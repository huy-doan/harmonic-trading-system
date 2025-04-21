// 016. src/shared/interfaces/market-data.interface.ts
export interface Candlestick {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
    quoteAssetVolume: number;
    numberOfTrades: number;
    takerBuyBaseAssetVolume: number;
    takerBuyQuoteAssetVolume: number;
    symbol: string;
    timeframe: string;
  }
  
  export interface MarketDataParams {
    symbol: string;
    timeframe: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }
  