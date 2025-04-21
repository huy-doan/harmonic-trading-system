// 090. src/libs/candlestick/StockGroupCandleData.ts
import { Candlestick } from './Candlestick';
import { GroupCandlestickFinder } from './GroupCandlestickFinder';

export class StockGroupCandleData {
  symbol: string;
  timeframe: string;
  candles: Candlestick[];
  finder: GroupCandlestickFinder;
  
  constructor(symbol: string, timeframe: string, data?: any[]) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.candles = [];
    
    // Create default group pattern finder
    this.finder = GroupCandlestickFinder.createDefault();
    
    // Initialize candles if data is provided
    if (data && Array.isArray(data)) {
      this.addCandleData(data);
    }
  }
  
  /**
   * Add candlestick data to the stock
   */
  addCandleData(data: any[]): void {
    if (!data || !Array.isArray(data)) {
      return;
    }
    
    // Convert data to Candlestick objects
    const newCandles = data.map(item => {
      // Handle data from Binance API
      if (Array.isArray(item)) {
        return new Candlestick(
          item[0], // timestamp
          parseFloat(item[1]), // open
          parseFloat(item[2]), // high
          parseFloat(item[3]), // low
          parseFloat(item[4]), // close
          parseFloat(item[5])  // volume
        );
      }
      // Handle standardized candlestick data
      else if (item.open !== undefined) {
        return new Candlestick(
          item.timestamp || item.openTime,
          item.open,
          item.high,
          item.low,
          item.close,
          item.volume
        );
      }
      
      return null;
    }).filter(Boolean);
    
    // Sort by timestamp and add to the existing candles
    this.candles = [...this.candles, ...newCandles]
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove duplicates (based on timestamp)
    const uniqueCandles: Candlestick[] = [];
    const timestamps = new Set<number>();
    
    for (const candle of this.candles) {
      if (!timestamps.has(candle.timestamp)) {
        uniqueCandles.push(candle);
        timestamps.add(candle.timestamp);
      }
    }
    
    this.candles = uniqueCandles;
  }
  
  /**
   * Find all candlestick patterns in the data
   */
  findAllPatterns(): Map<string, number[]> {
    return this.finder.findPatterns(this.candles);
  }
  
  /**
   * Find patterns at a specific index
   */
  findPatternsAtIndex(index: number): string[] {
    return this.finder.findPatternsAtIndex(this.candles, index);
  }
  
  /**
   * Get the latest candle
   */
  getLatestCandle(): Candlestick | null {
    if (this.candles.length === 0) {
      return null;
    }
    
    return this.candles[this.candles.length - 1];
  }
  
  /**
   * Get patterns for the latest candle
   */
  getLatestPatterns(): string[] {
    if (this.candles.length === 0) {
      return [];
    }
    
    return this.finder.findPatternsAtIndex(this.candles, this.candles.length - 1);
  }
  
  /**
   * Get candles for a specific time range
   */
  getCandlesInRange(startTime: number, endTime: number): Candlestick[] {
    return this.candles.filter(candle => 
      candle.timestamp >= startTime && candle.timestamp <= endTime
    );
  }
  
  /**
   * Get the most recent N candles
   */
  getRecentCandles(count: number): Candlestick[] {
    if (count <= 0 || this.candles.length === 0) {
      return [];
    }
    
    const start = Math.max(0, this.candles.length - count);
    return this.candles.slice(start);
  }
}
