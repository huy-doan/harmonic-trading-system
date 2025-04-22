// 122. src/domain/trading/trading.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Controllers
import { TradingController } from './controllers/trading.controller';

// Services
import { TradeService } from './services/trade.service';
import { TradeSetupService } from './services/trade-setup.service';
import { TradeExecutorService } from './services/trade-executor.service';

// Entities
import { Trade } from './entities/trade.entity';
import { TradeSetup } from './entities/trade-setup.entity';
import { HarmonicPattern } from '@domain/harmonic-patterns/entities/harmonic-pattern.entity';

// Modules
import { BinanceModule } from '../../binances/binance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, TradeSetup, HarmonicPattern]),
    ConfigModule,
    EventEmitterModule.forRoot(),
    BinanceModule
  ],
  controllers: [TradingController],
  providers: [
    TradeService,
    TradeSetupService,
    TradeExecutorService
  ],
  exports: [
    TradeService,
    TradeSetupService,
    TradeExecutorService
  ]
})
export class TradingModule {}
