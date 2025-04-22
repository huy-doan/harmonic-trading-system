// 118. src/domain/trading/services/trade.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Trade } from '../entities/trade.entity';
import { CreateTradeDto, UpdateTradeDto, TradeStatsDto } from '../dtos/trade.dto';
import { FormulaHelper } from '@shared/utils/formula.helper';

@Injectable()
export class TradeService {
  private readonly logger = new Logger(TradeService.name);

  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Tìm tất cả giao dịch với các bộ lọc tùy chọn
   */
  async findAll(filters: Partial<Trade> = {}, skip = 0, take = 10): Promise<[Trade[], number]> {
    try {
      return await this.tradeRepository.findAndCount({
        where: filters,
        relations: ['pattern', 'tradeSetup'],
        order: { createdAt: 'DESC' },
        skip,
        take
      });
    } catch (error) {
      this.logger.error(`Failed to find trades: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tìm giao dịch theo ID
   */
  async findById(id: string): Promise<Trade> {
    try {
      const trade = await this.tradeRepository.findOne({
        where: { id },
        relations: ['pattern', 'tradeSetup']
      });

      if (!trade) {
        throw new NotFoundException(`Trade with ID ${id} not found`);
      }

      return trade;
    } catch (error) {
      this.logger.error(`Failed to find trade by ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tạo giao dịch mới
   */
  async create(createTradeDto: CreateTradeDto): Promise<Trade> {
    try {
      const trade = this.tradeRepository.create({
        ...createTradeDto,
        status: 'OPEN',
        entryTime: new Date()
      });

      const savedTrade = await this.tradeRepository.save(trade);
      
      // Emit trade created event
      this.eventEmitter.emit('trade.created', {
        tradeId: savedTrade.id,
        symbol: savedTrade.symbol,
        direction: savedTrade.direction,
        entryPrice: savedTrade.entryPrice,
        quantity: savedTrade.quantity,
        isSimulated: savedTrade.isSimulated,
        timestamp: new Date()
      });

      return savedTrade;
    } catch (error) {
      this.logger.error(`Failed to create trade: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin giao dịch
   */
  async update(id: string, updateTradeDto: UpdateTradeDto): Promise<Trade> {
    try {
      const trade = await this.findById(id);
      
      // Apply updates
      Object.assign(trade, updateTradeDto);
      
      // Calculate profit/loss if we're closing the trade and have exit price
      if (updateTradeDto.status === 'CLOSED' && updateTradeDto.exitPrice) {
        if (!trade.exitTime) {
          trade.exitTime = new Date();
        }
        
        // Calculate profit/loss
        trade.profitLoss = this.calculateProfitLoss(trade);
        trade.profitLossPercent = this.calculateProfitLossPercent(trade);
      }
      
      const updatedTrade = await this.tradeRepository.save(trade);
      
      // Emit trade updated event
      this.eventEmitter.emit('trade.updated', {
        tradeId: updatedTrade.id,
        status: updatedTrade.status,
        exitPrice: updatedTrade.exitPrice,
        profitLoss: updatedTrade.profitLoss,
        profitLossPercent: updatedTrade.profitLossPercent,
        timestamp: new Date()
      });

      return updatedTrade;
    } catch (error) {
      this.logger.error(`Failed to update trade ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Đóng giao dịch với giá thoát lệnh 
   */
  async closeTrade(id: string, exitPrice: number): Promise<Trade> {
    try {
      const updateData: UpdateTradeDto = {
        status: 'CLOSED',
        exitPrice,
        exitTime: new Date().toISOString()
      };

      return await this.update(id, updateData);
    } catch (error) {
      this.logger.error(`Failed to close trade ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Hủy giao dịch
   */
  async cancelTrade(id: string): Promise<Trade> {
    try {
      const updateData: UpdateTradeDto = {
        status: 'CANCELLED'
      };

      return await this.update(id, updateData);
    } catch (error) {
      this.logger.error(`Failed to cancel trade ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tính toán lợi nhuận/lỗ cho giao dịch
   */
  private calculateProfitLoss(trade: Trade): number {
    if (!trade.exitPrice) {
      return 0;
    }

    return FormulaHelper.calculateProfitLoss(
      trade.entryPrice,
      trade.exitPrice,
      trade.quantity,
      trade.direction as 'LONG' | 'SHORT'
    );
  }

  /**
   * Tính toán phần trăm lợi nhuận/lỗ cho giao dịch
   */
  private calculateProfitLossPercent(trade: Trade): number {
    if (!trade.exitPrice) {
      return 0;
    }

    return FormulaHelper.calculateProfitLossPercentage(
      trade.entryPrice,
      trade.exitPrice,
      trade.direction as 'LONG' | 'SHORT'
    );
  }

  /**
   * Tìm tất cả giao dịch đang mở
   */
  async findOpenTrades(userId?: string): Promise<Trade[]> {
    try {
      const where: any = { status: 'OPEN' };
      
      if (userId) {
        where.userId = userId;
      }
      
      return await this.tradeRepository.find({
        where,
        relations: ['pattern', 'tradeSetup'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Failed to find open trades: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tìm tất cả giao dịch theo khoảng thời gian
   */
  async findTradesByTimeRange(startDate: Date, endDate: Date, userId?: string): Promise<Trade[]> {
    try {
      const where: any = {
        createdAt: Between(startDate, endDate)
      };
      
      if (userId) {
        where.userId = userId;
      }
      
      return await this.tradeRepository.find({
        where,
        relations: ['pattern', 'tradeSetup'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Failed to find trades by time range: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tính toán thống kê giao dịch
   */
  async getTradeStatistics(userId?: string, startDate?: Date, endDate?: Date): Promise<TradeStatsDto> {
    try {
      const where: any = { status: 'CLOSED' };
      
      if (userId) {
        where.userId = userId;
      }
      
      if (startDate && endDate) {
        where.exitTime = Between(startDate, endDate);
      }
      
      const trades = await this.tradeRepository.find({
        where,
        select: ['profitLoss', 'profitLossPercent']
      });
      
      const totalTrades = trades.length;
      if (totalTrades === 0) {
        return {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          averageProfit: 0,
          averageLoss: 0,
          totalProfitLoss: 0,
          profitFactor: 0
        };
      }
      
      const winningTrades = trades.filter(trade => (trade.profitLoss ?? 0) > 0).length;
      const losingTrades = trades.filter(trade => (trade.profitLoss ?? 0) < 0).length;
      
      const winRate = (winningTrades / totalTrades) * 100;
      
      const profits = trades
        .filter(trade => (trade.profitLoss ?? 0) > 0)
        .map(trade => trade.profitLossPercent ?? 0);
      
      const losses = trades
        .filter(trade => (trade.profitLoss ?? 0) < 0)
        .map(trade => trade.profitLossPercent ?? 0);
      
      const averageProfit = profits.length > 0
        ? profits.reduce((sum, val) => sum + val, 0) / profits.length
        : 0;
      
      const averageLoss = losses.length > 0
        ? losses.reduce((sum, val) => sum + val, 0) / losses.length
        : 0;
      
      const totalProfitLoss = trades.reduce((sum, trade) => sum + (trade.profitLoss ?? 0), 0);
      
      const totalProfit = profits.length > 0
        ? trades.filter(trade => (trade.profitLoss ?? 0) > 0).reduce((sum, trade) => sum + (trade.profitLoss ?? 0), 0)
        : 0;
      
      const totalLoss = losses.length > 0
        ? Math.abs(trades.filter(trade => (trade.profitLoss ?? 0) < 0).reduce((sum, trade) => sum + (trade.profitLoss ?? 0), 0))
        : 0;
      
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
      
      return {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        averageProfit,
        averageLoss,
        totalProfitLoss,
        profitFactor
      };
    } catch (error) {
      this.logger.error(`Failed to get trade statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy tổng lãi/lỗ
   */
  async getTotalProfitLoss(userId: string, fromDate?: Date): Promise<number> {
    try {
      const query = this.tradeRepository
        .createQueryBuilder('trade')
        .select('SUM(trade.profit_loss)', 'totalProfitLoss')
        .where('trade.user_id = :userId', { userId })
        .andWhere('trade.status = :status', { status: 'CLOSED' });

      if (fromDate) {
        query.andWhere('trade.exit_time >= :fromDate', { fromDate });
      }

      const result = await query.getRawOne();
      return result.totalProfitLoss || 0;
    } catch (error) {
      this.logger.error(`Failed to get total profit/loss: ${error.message}`, error.stack);
      throw error;
    }
  }
}
