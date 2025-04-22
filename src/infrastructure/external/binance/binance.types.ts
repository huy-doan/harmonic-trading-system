// 060. src/infrastructure/external/binance/binance.types.ts
/**
 * Binance API type definitions
 */

import { CandleChartInterval } from 'binance-api-node';

/**
 * Kline/Candlestick data format from Binance API
 */
export interface BinanceKline {
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    closeTime: number;
    quoteAssetVolume: string;
    numberOfTrades: number;
    takerBuyBaseAssetVolume: string;
    takerBuyQuoteAssetVolume: string;
  }
  
  /**
   * Ticker price from Binance API
   */
  export interface BinanceTickerPrice {
    symbol: string;
    price: string;
  }
  
  /**
   * Ticker 24hr stats from Binance API
   */
  export interface BinanceTicker24hr {
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    weightedAvgPrice: string;
    prevClosePrice: string;
    lastPrice: string;
    lastQty: string;
    bidPrice: string;
    bidQty: string;
    askPrice: string;
    askQty: string;
    openPrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
    openTime: number;
    closeTime: number;
    firstId: number;
    lastId: number;
    count: number;
  }
  
  /**
   * Order response from Binance API
   */
  export interface BinanceOrderResponse {
    symbol: string;
    orderId: number;
    orderListId: number;
    clientOrderId: string;
    transactTime: number;
    price: string;
    origQty: string;
    executedQty: string;
    cummulativeQuoteQty: string;
    status: BinanceOrderStatus;
    timeInForce: BinanceTimeInForce;
    type: BinanceOrderType;
    side: BinanceOrderSide;
    fills?: BinanceOrderFill[];
  }
  
  /**
   * Order fill from Binance API
   */
  export interface BinanceOrderFill {
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
    tradeId: number;
  }
  
  /**
   * Account information from Binance API
   */
  export interface BinanceAccountInfo {
    makerCommission: number;
    takerCommission: number;
    buyerCommission: number;
    sellerCommission: number;
    canTrade: boolean;
    canWithdraw: boolean;
    canDeposit: boolean;
    updateTime: number;
    accountType: string;
    balances: BinanceBalance[];
    permissions: string[];
  }
  
  /**
   * Account balance from Binance API
   */
  export interface BinanceBalance {
    asset: string;
    free: string;
    locked: string;
  }
  
  /**
   * Exchange information from Binance API
   */
  export interface BinanceExchangeInfo {
    timezone: string;
    serverTime: number;
    rateLimits: BinanceRateLimit[];
    exchangeFilters: any[];
    symbols: BinanceSymbolInfo[];
  }
  
  /**
   * Symbol information from Binance API
   */
  export interface BinanceSymbolInfo {
    symbol: string;
    status: string;
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quotePrecision: number;
    quoteAssetPrecision: number;
    baseCommissionPrecision: number;
    quoteCommissionPrecision: number;
    orderTypes: string[];
    icebergAllowed: boolean;
    ocoAllowed: boolean;
    quoteOrderQtyMarketAllowed: boolean;
    isSpotTradingAllowed: boolean;
    isMarginTradingAllowed: boolean;
    filters: BinanceSymbolFilter[];
    permissions: string[];
  }
  
  /**
   * Symbol filter from Binance API
   */
  export interface BinanceSymbolFilter {
    filterType: string;
    [key: string]: any;
  }
  
  /**
   * Rate limit from Binance API
   */
  export interface BinanceRateLimit {
    rateLimitType: string;
    interval: string;
    intervalNum: number;
    limit: number;
  }
  
  /**
   * WebSocket message types
   */
  export interface BinanceWsKlineMessage {
    e: 'kline';
    E: number;  // Event time
    s: string;  // Symbol
    k: {
      t: number;  // Kline start time
      T: number;  // Kline close time
      s: string;  // Symbol
      i: string;  // Interval
      f: number;  // First trade ID
      L: number;  // Last trade ID
      o: string;  // Open price
      c: string;  // Close price
      h: string;  // High price
      l: string;  // Low price
      v: string;  // Base asset volume
      n: number;  // Number of trades
      x: boolean; // Is this kline closed?
      q: string;  // Quote asset volume
      V: string;  // Taker buy base asset volume
      Q: string;  // Taker buy quote asset volume
      B: string;  // Ignore
    };
  }
  
  export interface BinanceWsMiniTickerMessage {
    e: '24hrMiniTicker';
    E: number;  // Event time
    s: string;  // Symbol
    c: string;  // Close price
    o: string;  // Open price
    h: string;  // High price
    l: string;  // Low price
    v: string;  // Total traded base asset volume
    q: string;  // Total traded quote asset volume
  }
  
  /**
   * Enum types
   */
  export enum BinanceOrderStatus {
    NEW = 'NEW',
    PARTIALLY_FILLED = 'PARTIALLY_FILLED',
    FILLED = 'FILLED',
    CANCELED = 'CANCELED',
    PENDING_CANCEL = 'PENDING_CANCEL',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED'
  }
  
  export enum BinanceOrderType {
    LIMIT = 'LIMIT',
    MARKET = 'MARKET',
    STOP_LOSS = 'STOP_LOSS',
    STOP_LOSS_LIMIT = 'STOP_LOSS_LIMIT',
    TAKE_PROFIT = 'TAKE_PROFIT',
    TAKE_PROFIT_LIMIT = 'TAKE_PROFIT_LIMIT',
    LIMIT_MAKER = 'LIMIT_MAKER'
  }
  
  export enum BinanceOrderSide {
    BUY = 'BUY',
    SELL = 'SELL'
  }
  
  export enum BinanceTimeInForce {
    GTC = 'GTC', // Good till canceled
    IOC = 'IOC', // Immediate or cancel
    FOK = 'FOK'  // Fill or kill
  }

export interface MarketData {
  symbol: string;
  price: string;
  timestamp: number;
  volume?: string;
}

export interface CandleData {
  symbol: string;
  interval: CandleChartInterval;
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  trades: number;
  buyBaseAssetVolume: string;
  buyQuoteAssetVolume: string;
}

export interface TradeOrder {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT' | 'LIMIT_MAKER';
  quantity: string;
  price?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  stopPrice?: string;
}

export interface AccountInfo {
  balances: {
    asset: string;
    free: string;
    locked: string;
  }[];
}

export interface StreamSubscription {
  id: string;
  unsubscribe: () => void;
}

export interface BinanceCredentials {
  apiKey: string;
  apiSecret: string;
}

export type SymbolPrice = {
  symbol: string;
  price: string;
};

export type TickerData = {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
};
