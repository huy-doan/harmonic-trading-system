// 056. src/infrastructure/external/binance/binance.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import { CandleData, MarketData, SymbolPrice, TickerData } from './binance.types';
import { CandleChartInterval } from 'binance-api-node';

@Injectable()
export class BinanceAdapter {
  private readonly logger = new Logger(BinanceAdapter.name);

  /**
   * Transform raw Binance candlestick data to application CandleData format
   */
  public transformCandleData(
    rawCandle: any,
    symbol: string,
    interval: CandleChartInterval
  ): CandleData {
    try {
      return {
        symbol,
        interval,
        openTime: rawCandle.openTime,
        open: rawCandle.open,
        high: rawCandle.high,
        low: rawCandle.low,
        close: rawCandle.close,
        volume: rawCandle.volume,
        closeTime: rawCandle.closeTime,
        quoteAssetVolume: rawCandle.quoteVolume,
        trades: rawCandle.trades,
        buyBaseAssetVolume: rawCandle.buyVolume,
        buyQuoteAssetVolume: rawCandle.quoteBuyVolume,
      };
    } catch (error) {
      this.logger.error(`Error transforming candle data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Transform raw Binance symbol price data to application MarketData format
   */
  public transformSymbolPrice(symbolPrice: SymbolPrice): MarketData {
    try {
      return {
        symbol: symbolPrice.symbol,
        price: symbolPrice.price,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`Error transforming symbol price: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Transform raw Binance ticker data to application MarketData format with volume
   */
  public transformTickerData(ticker: TickerData): MarketData {
    try {
      return {
        symbol: ticker.symbol,
        price: ticker.lastPrice,
        timestamp: ticker.closeTime,
        volume: ticker.volume,
      };
    } catch (error) {
      this.logger.error(`Error transforming ticker data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Transform Binance websocket kline message to application CandleData format
   */
  public transformWsKlineData(wsCandle: any): CandleData {
    try {
      return {
        symbol: wsCandle.symbol,
        interval: wsCandle.interval,
        openTime: wsCandle.openTime,
        open: wsCandle.open,
        high: wsCandle.high,
        low: wsCandle.low,
        close: wsCandle.close,
        volume: wsCandle.volume,
        closeTime: wsCandle.closeTime,
        quoteAssetVolume: wsCandle.quoteAssetVolume,
        trades: wsCandle.trades,
        buyBaseAssetVolume: wsCandle.buyBaseAssetVolume,
        buyQuoteAssetVolume: wsCandle.buyQuoteAssetVolume,
      };
    } catch (error) {
      this.logger.error(`Error transforming websocket kline data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Normalize symbol format (e.g., convert "BTCUSDT" to "BTC/USDT" if needed)
   */
  public normalizeSymbol(symbol: string, withSlash: boolean = false): string {
    try {
      // Common base assets for pattern matching
      const baseAssets = ['BTC', 'ETH', 'BNB', 'USDT', 'BUSD', 'USDC', 'DAI', 'USD', 'EUR'];
      
      if (withSlash) {
        // If symbol already has a slash, return as is
        if (symbol.includes('/')) {
          return symbol;
        }

        // Try to find base asset and insert slash
        for (const baseAsset of baseAssets) {
          if (symbol.endsWith(baseAsset)) {
            return `${symbol.slice(0, -baseAsset.length)}/${baseAsset}`;
          }
        }

        // Default fallback: try to split at position 3 or 4
        return symbol.length > 6 
          ? `${symbol.slice(0, 3)}/${symbol.slice(3)}`
          : symbol;
      } else {
        // Remove slash if present
        return symbol.replace('/', '');
      }
    } catch (error) {
      this.logger.error(`Error normalizing symbol: ${error.message}`, error.stack);
      return symbol; // Return original on error
    }
  }
}
