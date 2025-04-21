// 076. src/libs/candlestick/CandlestickFinder.ts
import { Candlestick } from './Candlestick';

export class CandlestickFinder {
  name: string;
  requiredCount: number;

  constructor(name?: string) {
    this.name = name || this.constructor.name;
    this.requiredCount = 1;
  }

  /**
   * Checks if the provided candles match the pattern
   */
  hasPattern(candles: Candlestick[]): boolean {
    if (!this.validateInput(candles)) return false;
    return this._hasPattern(candles);
  }

  /**
   * Implementation for the actual pattern detection - to be overridden by subclasses
   */
  _hasPattern(candles: Candlestick[]): boolean {
    return false;
  }

  /**
   * Validates the input data
   */
  validateInput(candles: Candlestick[]): boolean {
    return candles && candles.length >= this.requiredCount;
  }

  /**
   * Finds all patterns in the candlestick array
   */
  findPatterns(candles: Candlestick[]): number[] {
    const patternIndexes: number[] = [];
    
    if (!candles || candles.length < this.requiredCount) {
      return patternIndexes;
    }
    
    for (let i = 0; i < candles.length - this.requiredCount + 1; i++) {
      const potentialPattern = candles.slice(i, i + this.requiredCount);
      if (this._hasPattern(potentialPattern)) {
        patternIndexes.push(i);
      }
    }
    
    return patternIndexes;
  }

  /**
   * Check if candle has bullish tone
   */
  static isBullish(candle: Candlestick): boolean {
    return candle.close > candle.open;
  }

  /**
   * Check if candle has bearish tone
   */
  static isBearish(candle: Candlestick): boolean {
    return candle.close < candle.open;
  }

  /**
   * Calculate body size of candle
   */
  static bodySize(candle: Candlestick): number {
    return Math.abs(candle.open - candle.close);
  }

  /**
   * Calculate upper shadow size
   */
  static upperShadow(candle: Candlestick): number {
    return this.isBullish(candle) 
      ? candle.high - candle.close 
      : candle.high - candle.open;
  }

  /**
   * Calculate lower shadow size
   */
  static lowerShadow(candle: Candlestick): number {
    return this.isBullish(candle) 
      ? candle.open - candle.low 
      : candle.close - candle.low;
  }

  /**
   * Calculate candle range (high to low)
   */
  static range(candle: Candlestick): number {
    return candle.high - candle.low;
  }

  /**
   * Calculate ratio of body to range
   */
  static bodyPercent(candle: Candlestick): number {
    return (this.bodySize(candle) / this.range(candle)) * 100;
  }

  /**
   * Calculate upper shadow to range ratio
   */
  static upperShadowPercent(candle: Candlestick): number {
    return (this.upperShadow(candle) / this.range(candle)) * 100;
  }

  /**
   * Calculate lower shadow to range ratio
   */
  static lowerShadowPercent(candle: Candlestick): number {
    return (this.lowerShadow(candle) / this.range(candle)) * 100;
  }

  /**
   * Check if candle has long upper shadow
   */
  static hasLongUpperShadow(candle: Candlestick): boolean {
    return this.upperShadowPercent(candle) > 60;
  }

  /**
   * Check if candle has long lower shadow
   */
  static hasLongLowerShadow(candle: Candlestick): boolean {
    return this.lowerShadowPercent(candle) > 60;
  }

  /**
   * Check if candle has long body
   */
  static hasLongBody(candle: Candlestick): boolean {
    return this.bodyPercent(candle) > 60;
  }

  /**
   * Check if candle has short body
   */
  static hasShortBody(candle: Candlestick): boolean {
    return this.bodyPercent(candle) < 30;
  }

  /**
   * Check if candle is a doji (open and close are very close)
   */
  static isDoji(candle: Candlestick): boolean {
    return this.bodyPercent(candle) < 5;
  }

  /**
   * Check if candle is a spinning top (small body in the middle)
   */
  static isSpinningTop(candle: Candlestick): boolean {
    const bodyPct = this.bodyPercent(candle);
    const upperPct = this.upperShadowPercent(candle);
    const lowerPct = this.lowerShadowPercent(candle);
    
    return bodyPct < 30 && upperPct > 30 && lowerPct > 30;
  }

  /**
   * Check if candle is a marubozu (no or very small shadows)
   */
  static isMarubozu(candle: Candlestick): boolean {
    return this.bodyPercent(candle) > 95;
  }
}
