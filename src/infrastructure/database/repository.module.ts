// src/infrastructure/database/repository.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HarmonicPattern } from '@domain/harmonic-patterns/entities/harmonic-pattern.entity';
import { PatternPoint } from '@domain/harmonic-patterns/entities/pattern-point.entity';
import { Trade } from '@domain/trading/entities/trade.entity';
import { TradeSetup } from '@domain/trading/entities/trade-setup.entity';
import { RiskProfile } from '@domain/risk-management/entities/risk-profile.entity';
import { Notification } from '@domain/notification/entities/notification.entity';
import { User } from '@domain/user/entities/user.entity';
import { PatternRepository } from './repositories/pattern.repository';
import { TradeRepository } from './repositories/trade.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      HarmonicPattern,
      PatternPoint,
      Trade,
      TradeSetup,
      RiskProfile,
      Notification,
    ]),
  ],
  providers: [PatternRepository, TradeRepository],
  exports: [PatternRepository, TradeRepository],
})
export class RepositoryModule {}
