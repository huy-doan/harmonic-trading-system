// 139. src/domain/market-analysis/market-analysis.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { MarketData } from './entities/market-data.entity';
import { MarketAnalyzerService } from './services/market-analyzer.service';
import { TrendAnalyzerService } from './services/trend-analyzer.service';
import { MarketController } from './controllers/market.controller';
import { BinanceModule } from '../../binances/binance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketData]),
    EventEmitterModule.forRoot(),
    CacheModule,
    BinanceModule
  ],
  controllers: [MarketController],
  providers: [
    MarketAnalyzerService,
    TrendAnalyzerService
  ],
  exports: [
    MarketAnalyzerService,
    TrendAnalyzerService
  ]
})
export class MarketAnalysisModule {}
