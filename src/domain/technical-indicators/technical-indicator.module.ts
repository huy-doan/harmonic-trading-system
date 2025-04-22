// 113. src/domain/technical-indicators/technical-indicator.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Controllers
import { IndicatorController } from './controllers/indicator.controller';

// Services
import { IchimokuService } from './services/ichimoku.service';
import { RSIService } from './services/rsi.service';
import { MACDService } from './services/macd.service';
import { IndicatorComparisonService } from './services/indicator-comparison.service';

// Entities
import { TechnicalIndicator } from './entities/indicator.entity';

// Config
import { indicatorConfig } from './config/indicator.config';

// Other modules
import { BinanceModule } from '../../binances/binance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TechnicalIndicator]),
    ConfigModule.forFeature(indicatorConfig),
    EventEmitterModule.forRoot(),
    BinanceModule
  ],
  controllers: [IndicatorController],
  providers: [
    IchimokuService,
    RSIService,
    MACDService,
    IndicatorComparisonService
  ],
  exports: [
    IchimokuService,
    RSIService,
    MACDService,
    IndicatorComparisonService
  ]
})
export class TechnicalIndicatorModule {}
