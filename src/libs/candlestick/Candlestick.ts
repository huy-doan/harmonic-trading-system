// 077. src/libs/candlestick/Candlestick.ts
export class Candlestick {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    
    constructor(timestamp: number, open: number, high: number, low: number, close: number, volume: number = 0) {
      this.timestamp = timestamp;
      this.open = open;
      this.high = high;
      this.low = low;
      this.close = close;
      this.volume = volume;
    }
  
    /**
     * Creates a candlestick from market data interface
     */
    static fromMarketData(data: any): Candlestick {
      return new Candlestick(
        data.openTime,
        data.open,
        data.high,
        data.low,
        data.close,
        data.volume
      );
    }
  
    /**
     * Check if candlestick is bullish (close > open)
     */
    isBullish(): boolean {
      return this.close > this.open;
    }
  
    /**
     * Check if candlestick is bearish (close < open)
     */
    isBearish(): boolean {
      return this.close < this.open;
    }
  
    /**
     * Calculate body size of candlestick
     */
    getBodySize(): number {
      return Math.abs(this.open - this.close);
    }
  
    /**
     * Calculate upper shadow size
     */
    getUpperShadow(): number {
      return this.isBullish() 
        ? this.high - this.close 
        : this.high - this.open;
    }
  
    /**
     * Calculate lower shadow size
     */
    getLowerShadow(): number {
      return this.isBullish() 
        ? this.open - this.low 
        : this.close - this.low;
    }
  
    /**
     * Calculate candlestick range (high to low)
     */
    getRange(): number {
      return this.high - this.low;
    }
  
    /**
     * Calculate body to range ratio
     */
    getBodyPercent(): number {
      return (this.getBodySize() / this.getRange()) * 100;
    }
  
    /**
     * Calculate upper shadow to range ratio
     */
    getUpperShadowPercent(): number {
      return (this.getUpperShadow() / this.getRange()) * 100;
    }
  
    /**
     * Calculate lower shadow to range ratio
     */
    getLowerShadowPercent(): number {
      return (this.getLowerShadow() / this.getRange()) * 100;
    }
  
    /**
     * Check if candlestick has long upper shadow
     */
    hasLongUpperShadow(): boolean {
      return this.getUpperShadowPercent() > 60;
    }
  
    /**
     * Check if candlestick has long lower shadow
     */
    hasLongLowerShadow(): boolean {
      return this.getLowerShadowPercent() > 60;
    }
  
    /**
     * Check if candlestick has long body
     */
    hasLongBody(): boolean {
      return this.getBodyPercent() > 60;
    }
  
    /**
     * Check if candlestick has short body
     */
    hasShortBody(): boolean {
      return this.getBodyPercent() < 30;
    }
  
    /**
     * Check if candlestick is a doji (open and close are very close)
     */
    isDoji(): boolean {
      return this.getBodyPercent() < 5;
    }
  
    /**
     * Check if candlestick is a spinning top (small body with upper and lower shadows)
     */
    isSpinningTop(): boolean {
      const bodyPct = this.getBodyPercent();
      const upperPct = this.getUpperShadowPercent();
      const lowerPct = this.getLowerShadowPercent();
      
      return bodyPct < 30 && upperPct > 30 && lowerPct > 30;
    }
  
    /**
     * Check if candlestick is a marubozu (all or almost all body)
     */
    isMarubozu(): boolean {
      return this.getBodyPercent() > 95;
    }
  
    /**
     * Check if candlestick is a hammer (small body at the top, long lower shadow)
     */
    isHammer(): boolean {
      const bodyPct = this.getBodyPercent();
      const lowerPct = this.getLowerShadowPercent();
      const upperPct = this.getUpperShadowPercent();
      
      return bodyPct < 30 && lowerPct > 60 && upperPct < 10;
    }
  
    /**
     * Check if candlestick is an inverted hammer (small body at the bottom, long upper shadow)
     */
    isInvertedHammer(): boolean {
      const bodyPct = this.getBodyPercent();
      const lowerPct = this.getLowerShadowPercent();
      const upperPct = this.getUpperShadowPercent();
      
      return bodyPct < 30 && upperPct > 60 && lowerPct < 10;
    }
  }
  