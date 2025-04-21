// 089. src/libs/candlestick/GroupCandlestickFinder.ts
import { CandlestickFinder } from './CandlestickFinder';
import { Candlestick } from './Candlestick';

export class GroupCandlestickFinder {
  private finders: CandlestickFinder[];
  
  constructor(finders: CandlestickFinder[] = []) {
    this.finders = finders;
  }
  
  /**
   * Adds a pattern finder to the group
   */
  addFinder(finder: CandlestickFinder): void {
    this.finders.push(finder);
  }
  
  /**
   * Find all patterns in the candlestick data
   */
  findPatterns(candles: Candlestick[]): Map<string, number[]> {
    const result = new Map<string, number[]>();
    
    if (!candles || candles.length === 0) {
      return result;
    }
    
    for (const finder of this.finders) {
      const patternIndexes = finder.findPatterns(candles);
      if (patternIndexes.length > 0) {
        result.set(finder.name, patternIndexes);
      }
    }
    
    return result;
  }
  
  /**
   * Find all patterns at a specific index
   */
  findPatternsAtIndex(candles: Candlestick[], index: number): string[] {
    const patterns: string[] = [];
    
    if (!candles || candles.length === 0 || index < 0 || index >= candles.length) {
      return patterns;
    }
    
    for (const finder of this.finders) {
      if (finder.requiredCount > candles.length - index) {
        continue;
      }
      
      const slicedCandles = candles.slice(index, index + finder.requiredCount);
      if (finder.hasPattern(slicedCandles)) {
        patterns.push(finder.name);
      }
    }
    
    return patterns;
  }
  
  /**
   * Create a default group with all single-candle patterns
   */
  static createDefault(): GroupCandlestickFinder {
    // Import all pattern finders
    const { Doji } = require('./Doji');
    const { DragonFlyDoji } = require('./DragonFlyDoji');
    const { GraveStoneDoji } = require('./GraveStoneDoji');
    const { BearishHammerStick } = require('./BearishHammerStick');
    const { BullishHammerStick } = require('./BullishHammerStick');
    const { BearishInvertedHammerStick } = require('./BearishInvertedHammerStick');
    const { BullishInvertedHammerStick } = require('./BullishInvertedHammerStick');
    const { BearishMarubozu } = require('./BearishMarubozu');
    const { BullishMarubozu } = require('./BullishMarubozu');
    const { BearishSpinningTop } = require('./BearishSpinningTop');
    const { BullishSpinningTop } = require('./BullishSpinningTop');
    
    // Create finders
    const finders = [
      new Doji(),
      new DragonFlyDoji(),
      new GraveStoneDoji(),
      new BearishHammerStick(),
      new BullishHammerStick(),
      new BearishInvertedHammerStick(),
      new BullishInvertedHammerStick(),
      new BearishMarubozu(),
      new BullishMarubozu(),
      new BearishSpinningTop(),
      new BullishSpinningTop()
    ];
    
    return new GroupCandlestickFinder(finders);
  }
}
