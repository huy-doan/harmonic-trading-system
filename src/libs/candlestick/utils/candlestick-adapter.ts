// src/libs/candlestick/utils/candlestick-adapter.ts
import { Candlestick as MarketDataCandlestick } from '@shared/interfaces/market-data.interface';
import { Candlestick } from '../Candlestick';

/**
 * Chuyển đổi từ interface Candlestick từ market-data sang class Candlestick
 */
export class CandlestickAdapter {
  /**
   * Chuyển đổi một đối tượng từ interface sang class
   */
  static fromMarketData(data: MarketDataCandlestick): Candlestick {
    return new Candlestick(
      // Sử dụng openTime làm timestamp
      data.openTime,
      data.open,
      data.high,
      data.low,
      data.close,
      data.volume
    );
  }

  /**
   * Chuyển đổi một mảng từ interface sang class
   */
  static fromMarketDataArray(dataArray: MarketDataCandlestick[]): Candlestick[] {
    return dataArray.map(data => CandlestickAdapter.fromMarketData(data));
  }
}
