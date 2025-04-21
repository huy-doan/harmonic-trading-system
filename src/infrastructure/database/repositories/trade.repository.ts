// 053. src/infrastructure/database/repositories/trade.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AbstractBaseRepository } from './base.repository';
import { Trade } from '@domain/trading/entities/trade.entity';

@Injectable()
export class TradeRepository extends AbstractBaseRepository<Trade> {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
  ) {
    super(tradeRepository);
  }

  async findActiveTradesByUser(userId: string): Promise<Trade[]> {
    return this.repository.find({
      where: {
        userId,
        status: 'OPEN',
      },
      relations: ['tradeSetup', 'pattern'],
      order: { createdAt: 'DESC' },
    });
  }

  async findTradesByStatus(status: string, symbol?: string): Promise<Trade[]> {
    const where: FindOptionsWhere<Trade> = { status };

    if (symbol) {
      where.symbol = symbol;
    }

    return this.repository.find({
      where,
      relations: ['tradeSetup', 'pattern'],
      order: { createdAt: 'DESC' },
    });
  }

  async findTradesByTimeRange(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<Trade[]> {
    const where: FindOptionsWhere<Trade> = {
      createdAt: Between(startDate, endDate),
    };

    if (userId) {
      where.userId = userId;
    }

    return this.repository.find({
      where,
      relations: ['tradeSetup', 'pattern'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTradingPerformance(userId?: string): Promise<any> {
    const query = this.repository
      .createQueryBuilder('trade')
      .select('trade.symbol', 'symbol')
      .addSelect('COUNT(*)', 'totalTrades')
      .addSelect('SUM(CASE WHEN trade.profit_loss > 0 THEN 1 ELSE 0 END)', 'winningTrades')
      .addSelect('SUM(CASE WHEN trade.profit_loss <= 0 THEN 1 ELSE 0 END)', 'losingTrades')
      .addSelect('AVG(trade.profit_loss)', 'avgProfitLoss')
      .addSelect('SUM(trade.profit_loss)', 'totalProfitLoss')
      .addSelect('AVG(trade.profit_loss_percent)', 'avgProfitLossPercent')
      .where('trade.status = :status', { status: 'CLOSED' })
      .groupBy('trade.symbol');

    if (userId) {
      query.andWhere('trade.user_id = :userId', { userId });
    }

    return query.getRawMany();
  }

  async findTradesWithPattern(patternId: string): Promise<Trade[]> {
    return this.repository.find({
      where: {
        patternId,
      },
      relations: ['tradeSetup', 'pattern'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTotalProfitLoss(userId: string, fromDate?: Date): Promise<number> {
    const query = this.repository
      .createQueryBuilder('trade')
      .select('SUM(trade.profit_loss)', 'totalProfitLoss')
      .where('trade.user_id = :userId', { userId })
      .andWhere('trade.status = :status', { status: 'CLOSED' });

    if (fromDate) {
      query.andWhere('trade.exit_time >= :fromDate', { fromDate });
    }

    const result = await query.getRawOne();
    return result.totalProfitLoss || 0;
  }
}
