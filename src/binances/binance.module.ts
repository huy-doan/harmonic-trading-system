// 152. src/binances/binance.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';

import { BinanceClient } from '@infrastructure/external/binance/binance.client';
import { BinanceWebsocketClient } from '@infrastructure/external/binance/binance-websocket.client';
import { BinanceAdapter } from '@infrastructure/external/binance/binance.adapter';
import { BinanceRateLimiter } from '@infrastructure/external/binance/rate-limiter';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { TradingApiService } from '@infrastructure/external/binance/trading-api.service';

import { BinanceController } from './binance.controller';
import { BinanceService } from './binance.service';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    CacheModule
  ],
  controllers: [BinanceController],
  providers: [
    BinanceClient,
    BinanceWebsocketClient,
    BinanceAdapter,
    BinanceRateLimiter,
    MarketDataStreamService,
    TradingApiService,
    BinanceService
  ],
  exports: [
    BinanceClient,
    BinanceWebsocketClient,
    BinanceAdapter,
    MarketDataStreamService,
    TradingApiService,
    BinanceService
  ]
})
export class BinanceModule {}
