// 152. src/binances/binance.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { BinanceController } from './binance.controller';
import { BinanceService } from './binance.service';
import { BinanceAdapter } from '../infrastructure/external/binance/binance.adapter';
import { BinanceApiClient } from '../infrastructure/external/binance/binance.client';
import { BinanceWebsocketClient } from '../infrastructure/external/binance/binance-websocket.client';
import { BinanceDataMapperService } from '../infrastructure/external/binance/binance-data-mapper.service';
import { MarketDataStreamService } from '../infrastructure/external/binance/market-data-stream.service';
import { RateLimiterService } from '../infrastructure/external/binance/rate-limiter';
import { TradingApiService } from '../infrastructure/external/binance/trading-api.service';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot()
  ],
  controllers: [BinanceController],
  providers: [
    BinanceService,
    BinanceAdapter,
    BinanceApiClient,
    BinanceWebsocketClient,
    BinanceDataMapperService,
    RateLimiterService,
    MarketDataStreamService,
    TradingApiService,
  ],
  exports: [
    BinanceService,
    BinanceDataMapperService,
    MarketDataStreamService,
    TradingApiService,
  ]
})
export class BinanceModule {}
