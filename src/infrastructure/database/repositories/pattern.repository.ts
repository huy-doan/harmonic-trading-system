// 052. src/infrastructure/database/repositories/pattern.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AbstractBaseRepository } from './base.repository';
import { HarmonicPattern } from '@domain/harmonic-patterns/entities/harmonic-pattern.entity';

@Injectable()
export class PatternRepository extends AbstractBaseRepository<HarmonicPattern> {
  constructor(
    @InjectRepository(HarmonicPattern)
    private readonly patternRepository: Repository<HarmonicPattern>,
  ) {
    super(patternRepository);
  }

  async findActivePatterns(symbol?: string, timeframe?: string): Promise<HarmonicPattern[]> {
    const where: FindOptionsWhere<HarmonicPattern> = {
      isValid: true,
      isCompleted: false,
    };

    if (symbol) {
      where.symbol = symbol;
    }

    if (timeframe) {
      where.timeframe = timeframe;
    }

    return this.repository.find({
      where,
      relations: ['points'],
      order: { createdAt: 'DESC' },
    });
  }

  async findHighQualityPatterns(minQuality: number = 70): Promise<HarmonicPattern[]> {
    return this.repository
      .createQueryBuilder('pattern')
      .where('pattern.quality_score >= :minQuality', { minQuality })
      .andWhere('pattern.is_valid = true')
      .leftJoinAndSelect('pattern.points', 'points')
      .orderBy('pattern.quality_score', 'DESC')
      .getMany();
  }

  async findPatternsByTimeRange(
    startDate: Date,
    endDate: Date,
    symbol?: string,
  ): Promise<HarmonicPattern[]> {
    const where: FindOptionsWhere<HarmonicPattern> = {
      createdAt: Between(startDate, endDate),
    };

    if (symbol) {
      where.symbol = symbol;
    }

    return this.repository.find({
      where,
      relations: ['points'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPatternStats(symbol?: string): Promise<any> {
    const query = this.repository
      .createQueryBuilder('pattern')
      .select('pattern.pattern_type', 'patternType')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(pattern.quality_score)', 'avgQuality')
      .addSelect('SUM(CASE WHEN pattern.is_completed THEN 1 ELSE 0 END)', 'completed')
      .addSelect('SUM(CASE WHEN pattern.is_valid THEN 1 ELSE 0 END)', 'valid')
      .groupBy('pattern.pattern_type');

    if (symbol) {
      query.where('pattern.symbol = :symbol', { symbol });
    }

    return query.getRawMany();
  }
}
