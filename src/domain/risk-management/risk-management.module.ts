// 128. src/domain/risk-management/risk-management.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { RiskManagementController } from './controllers/risk-management.controller';

// Services
import { RiskCalculatorService } from './services/risk-calculator.service';
import { PositionSizerService } from './services/position-sizer.service';

// Entities
import { RiskProfile } from './entities/risk-profile.entity';

// External modules
import { BinanceModule } from '../../binances/binance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiskProfile]),
    ConfigModule,
    BinanceModule
  ],
  controllers: [RiskManagementController],
  providers: [
    RiskCalculatorService,
    PositionSizerService
  ],
  exports: [
    RiskCalculatorService,
    PositionSizerService
  ]
})
export class RiskManagementModule {}
