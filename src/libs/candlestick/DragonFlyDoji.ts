// 079. src/libs/candlestick/DragonFlyDoji.ts
import { CandlestickFinder } from './CandlestickFinder';
import { Candlestick } from './Candlestick';

export class DragonFlyDoji extends CandlestickFinder {
  constructor() {
    super('DragonFly Doji');
    this.requiredCount = 1;
  }
  
  _hasPattern(candles: Candlestick[]): boolean {
    const doji = candles[0];
    
    // Doji has almost the same open and close prices
    const bodyPercent = CandlestickFinder.bodyPercent(doji);
    
    // Must have a very small body
    if (bodyPercent > 5) return false;
    
    // Must have a very small or no upper shadow
    const upperShadowPercent = CandlestickFinder.upperShadowPercent(doji);
    if (upperShadowPercent > 5) return false;
    
    // Must have a significant lower shadow
    const lowerShadowPercent = CandlestickFinder.lowerShadowPercent(doji);
    
    // Lower shadow should be at least 60% of the total range
    return lowerShadowPercent > 60;
  }
}
