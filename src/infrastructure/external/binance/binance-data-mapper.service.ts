import { Injectable, Logger } from '@nestjs/common';
import { CandleData } from './binance.types';
import { MarketData as MarketDataEntity } from '../../../domain/market-analysis/entities/market-data.entity';
import { CandleChartInterval } from 'binance-api-node';

@Injectable()
export class BinanceDataMapperService {
  private readonly logger = new Logger(BinanceDataMapperService.name);

  /**
   * Maps Binance CandleData to MarketData entity
   */
  mapCandleToMarketData(candle: CandleData): MarketDataEntity {
    try {
      const marketData = new MarketDataEntity();
      
      marketData.symbol = candle.symbol;
      marketData.timeframe = candle.interval;
      marketData.openTime = candle.openTime;
      marketData.closeTime = candle.closeTime;
      
      // Convert string values to numeric values
      marketData.open = this.parseStringToNumber(candle.open);
      marketData.high = this.parseStringToNumber(candle.high);
      marketData.low = this.parseStringToNumber(candle.low);
      marketData.close = this.parseStringToNumber(candle.close);
      marketData.volume = this.parseStringToNumber(candle.volume);
      marketData.quoteAssetVolume = this.parseStringToNumber(candle.quoteAssetVolume);
      marketData.numberOfTrades = candle.trades;
      marketData.takerBuyBaseAssetVolume = this.parseStringToNumber(candle.buyBaseAssetVolume);
      marketData.takerBuyQuoteAssetVolume = this.parseStringToNumber(candle.buyQuoteAssetVolume);
      
      return marketData;
    } catch (error) {
      this.logger.error(`Error mapping Binance candle to market data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Maps array of Binance CandleData to array of MarketData entities
   */
  mapCandlesToMarketData(candles: CandleData[]): MarketDataEntity[] {
    return candles.map(candle => this.mapCandleToMarketData(candle));
  }

  /**
   * Maps MarketData entity to Binance CandleData format
   */
  mapMarketDataToCandle(marketData: MarketDataEntity): CandleData {
    try {
      return {
        symbol: marketData.symbol,
        interval: marketData.timeframe as CandleChartInterval,
        openTime: marketData.openTime,
        closeTime: marketData.closeTime,
        open: marketData.open.toString(),
        high: marketData.high.toString(),
        low: marketData.low.toString(),
        close: marketData.close.toString(),
        volume: marketData.volume.toString(),
        quoteAssetVolume: marketData.quoteAssetVolume.toString(),
        trades: marketData.numberOfTrades,
        buyBaseAssetVolume: marketData.takerBuyBaseAssetVolume.toString(),
        buyQuoteAssetVolume: marketData.takerBuyQuoteAssetVolume.toString()
      };
    } catch (error) {
      this.logger.error(`Error mapping market data to Binance candle: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Safely parses string numeric values to numbers
   */
  private parseStringToNumber(value: string): number {
    try {
      return parseFloat(value);
    } catch (error) {
      this.logger.warn(`Error parsing string value to number: ${value}`);
      return 0;
    }
  }
}