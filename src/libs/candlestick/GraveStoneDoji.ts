// 080. src/libs/candlestick/GraveStoneDoji.ts
import { CandlestickFinder } from './CandlestickFinder';
import { Candlestick } from './Candlestick';

export class GraveStoneDoji extends CandlestickFinder {
  constructor() {
    super('GraveStone Doji');
    this.requiredCount = 1;
  }
  
  _hasPattern(candles: Candlestick[]): boolean {
    const doji = candles[0];
    
    // Doji has almost the same open and close prices
    const bodyPercent = CandlestickFinder.bodyPercent(doji);
    
    // Must have a very small body
    if (bodyPercent > 5) return false;
    
    // Must have a very small or no lower shadow
    const lowerShadowPercent = CandlestickFinder.lowerShadowPercent(doji);
    if (lowerShadowPercent > 5) return false;
    
    // Must have a significant upper shadow
    const upperShadowPercent = CandlestickFinder.upperShadowPercent(doji);
    
    // Upper shadow should be at least 60% of the total range
    return upperShadowPercent > 60;
  }
}
