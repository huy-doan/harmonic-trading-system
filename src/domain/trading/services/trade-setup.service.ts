// 120. src/domain/trading/services/trade-setup.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TradeSetup } from '../entities/trade-setup.entity';
import { CreateTradeSetupDto, UpdateTradeSetupDto, TradeSetupFilterDto } from '../dtos/trade-setup.dto';
import { HarmonicPattern } from '@domain/harmonic-patterns/entities/harmonic-pattern.entity';
import { FormulaHelper } from '@shared/utils/formula.helper';

@Injectable()
export class TradeSetupService {
  private readonly logger = new Logger(TradeSetupService.name);

  constructor(
    @InjectRepository(TradeSetup)
    private readonly tradeSetupRepository: Repository<TradeSetup>,
    @InjectRepository(HarmonicPattern)
    private readonly patternRepository: Repository<HarmonicPattern>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Tìm tất cả các thiết lập giao dịch
   */
  async findAll(filters?: TradeSetupFilterDto, skip = 0, take = 10): Promise<[TradeSetup[], number]> {
    try {
      const where: any = {};
      
      if (filters) {
        if (filters.symbol) {
          where.symbol = filters.symbol;
        }
        
        if (filters.timeframe) {
          where.timeframe = filters.timeframe;
        }
        
        if (filters.patternType) {
          where.patternType = filters.patternType;
        }
        
        if (filters.direction) {
          where.direction = filters.direction;
        }
        
        if (filters.minRiskRewardRatio) {
          where.riskRewardRatio = MoreThan(filters.minRiskRewardRatio);
        }
        
        if (filters.isActive !== undefined) {
          where.isActive = filters.isActive;
        }
        
        if (filters.isTriggered !== undefined) {
          where.isTriggered = filters.isTriggered;
        }
      }
      
      // Mặc định chỉ hiển thị các thiết lập chưa hết hạn
      if (where.isActive === undefined) {
        where.isActive = true;
      }
      
      if (!where.validUntil) {
        where.validUntil = MoreThan(new Date());
      }
      
      return await this.tradeSetupRepository.findAndCount({
        where,
        relations: ['trades'],
        order: { createdAt: 'DESC' },
        skip,
        take
      });
    } catch (error) {
      this.logger.error(`Failed to find trade setups: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tìm thiết lập giao dịch theo ID
   */
  async findById(id: string): Promise<TradeSetup> {
    try {
      const tradeSetup = await this.tradeSetupRepository.findOne({
        where: { id },
        relations: ['trades']
      });

      if (!tradeSetup) {
        throw new NotFoundException(`Trade setup with ID ${id} not found`);
      }

      return tradeSetup;
    } catch (error) {
      this.logger.error(`Failed to find trade setup by ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tạo thiết lập giao dịch mới
   */
  async create(createTradeSetupDto: CreateTradeSetupDto): Promise<TradeSetup> {
    try {
      // Parse validUntil date
      const validUntil = new Date(createTradeSetupDto.validUntil);
      
      // Tính toán Risk/Reward Ratio nếu không được cung cấp
      if (!createTradeSetupDto.riskRewardRatio) {
        const entryPrice = createTradeSetupDto.entryPrice;
        const stopLoss = createTradeSetupDto.stopLoss;
        const takeProfit1 = createTradeSetupDto.takeProfit1;
        
        createTradeSetupDto.riskRewardRatio = FormulaHelper.calculateRiskRewardRatio(
          entryPrice,
          stopLoss,
          takeProfit1,
          createTradeSetupDto.direction as 'LONG' | 'SHORT'
        );
      }
      
      const tradeSetup = this.tradeSetupRepository.create({
        ...createTradeSetupDto,
        validUntil,
        isTriggered: false,
        isActive: true
      });

      const savedSetup = await this.tradeSetupRepository.save(tradeSetup);
      
      // Emit trade setup created event
      this.eventEmitter.emit('trade-setup.created', {
        setupId: savedSetup.id,
        symbol: savedSetup.symbol,
        direction: savedSetup.direction,
        patternType: savedSetup.patternType,
        entryPrice: savedSetup.entryPrice,
        timestamp: new Date()
      });

      return savedSetup;
    } catch (error) {
      this.logger.error(`Failed to create trade setup: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cập nhật thiết lập giao dịch
   */
  async update(id: string, updateTradeSetupDto: UpdateTradeSetupDto): Promise<TradeSetup> {
    try {
      const tradeSetup = await this.findById(id);
      
      // Parse validUntil date if provided
      let validUntil: Date | undefined;
      if (updateTradeSetupDto.validUntil) {
        validUntil = new Date(updateTradeSetupDto.validUntil);
      }
      
      // Apply updates
      const updatedData = {
        ...updateTradeSetupDto,
        validUntil
      };
      
      Object.assign(tradeSetup, updatedData);
      
      // Recalculate risk/reward ratio if necessary
      if (
        updateTradeSetupDto.entryPrice !== undefined ||
        updateTradeSetupDto.stopLoss !== undefined ||
        updateTradeSetupDto.takeProfit1 !== undefined
      ) {
        const entryPrice = updateTradeSetupDto.entryPrice ?? tradeSetup.entryPrice;
        const stopLoss = updateTradeSetupDto.stopLoss ?? tradeSetup.stopLoss;
        const takeProfit1 = updateTradeSetupDto.takeProfit1 ?? tradeSetup.takeProfit1;
        
        tradeSetup.riskRewardRatio = FormulaHelper.calculateRiskRewardRatio(
          entryPrice,
          stopLoss,
          takeProfit1,
          tradeSetup.direction as 'LONG' | 'SHORT'
        );
      }
      
      const updatedSetup = await this.tradeSetupRepository.save(tradeSetup);
      
      // Emit trade setup updated event
      this.eventEmitter.emit('trade-setup.updated', {
        setupId: updatedSetup.id,
        isActive: updatedSetup.isActive,
        isTriggered: updatedSetup.isTriggered,
        timestamp: new Date()
      });

      return updatedSetup;
    } catch (error) {
      this.logger.error(`Failed to update trade setup ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tạo thiết lập giao dịch từ mô hình Harmonic
   */
  async createFromPattern(patternId: string, validityHours: number = 24): Promise<TradeSetup> {
    try {
      // Lấy thông tin mô hình
      const pattern = await this.patternRepository.findOne({
        where: { id: patternId }
      });

      if (!pattern) {
        throw new NotFoundException(`Pattern with ID ${patternId} not found`);
      }
      
      // Kiểm tra tính hợp lệ của mô hình
      if (!pattern.isValid) {
        throw new Error(`Pattern ${patternId} is not valid`);
      }
      
      // Tính thời gian hết hạn
      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + validityHours);
      
      // Tạo dto cho thiết lập giao dịch
      const tradeSetupDto: CreateTradeSetupDto = {
        symbol: pattern.symbol,
        timeframe: pattern.timeframe,
        patternType: pattern.patternType,
        direction: pattern.direction,
        entryPrice: pattern.entryPrice,
        stopLoss: pattern.stopLoss,
        takeProfit1: pattern.takeProfit1,
        takeProfit2: pattern.takeProfit2,
        takeProfit3: pattern.takeProfit3,
        riskRewardRatio: Math.abs(pattern.takeProfit1 - pattern.entryPrice) / Math.abs(pattern.entryPrice - pattern.stopLoss),
        validUntil: validUntil.toISOString()
      };
      
      return this.create(tradeSetupDto);
    } catch (error) {
      this.logger.error(`Failed to create trade setup from pattern ${patternId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Xóa thiết lập giao dịch
   */
  async remove(id: string): Promise<void> {
    try {
      const tradeSetup = await this.findById(id);
      
      // Kiểm tra xem đã có giao dịch nào được tạo từ thiết lập này chưa
      if (tradeSetup.trades && tradeSetup.trades.length > 0) {
        // Thay vì xóa, đánh dấu thiết lập là không còn hoạt động
        await this.update(id, { isActive: false });
        return;
      }
      
      // Xóa thiết lập
      await this.tradeSetupRepository.remove(tradeSetup);
      
      // Emit trade setup deleted event
      this.eventEmitter.emit('trade-setup.deleted', {
        setupId: id,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error(`Failed to remove trade setup ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tìm thiết lập giao dịch chưa hoàn thành và vẫn còn hiệu lực
   */
  async findActiveSetups(symbol?: string): Promise<TradeSetup[]> {
    try {
      const where: any = {
        isActive: true,
        isTriggered: false,
        validUntil: MoreThan(new Date())
      };
      
      if (symbol) {
        where.symbol = symbol;
      }
      
      return await this.tradeSetupRepository.find({
        where,
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Failed to find active trade setups: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Tìm thiết lập giao dịch sắp hết hạn
   */
  async findExpiringSetups(hoursThreshold: number = 2): Promise<TradeSetup[]> {
    try {
      const now = new Date();
      const threshold = new Date(now);
      threshold.setHours(now.getHours() + hoursThreshold);
      
      return await this.tradeSetupRepository.find({
        where: {
          isActive: true,
          isTriggered: false,
          validUntil: Between(now, threshold)
        },
        order: { validUntil: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`Failed to find expiring trade setups: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Vô hiệu hóa thiết lập giao dịch hết hạn
   */
  async deactivateExpiredSetups(): Promise<number> {
    try {
      const now = new Date();
      
      const result = await this.tradeSetupRepository.update(
        {
          isActive: true,
          validUntil: LessThan(now)
        },
        {
          isActive: false
        }
      );
      
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Failed to deactivate expired trade setups: ${error.message}`, error.stack);
      throw error;
    }
  }
}
