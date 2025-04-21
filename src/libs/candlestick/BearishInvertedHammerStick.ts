// 083. src/libs/candlestick/BearishInvertedHammerStick.ts
import { CandlestickFinder } from './CandlestickFinder';
import { Candlestick } from './Candlestick';

export class BearishInvertedHammerStick extends CandlestickFinder {
  constructor() {
    super('Bearish Inverted Hammer');
    this.requiredCount = 1;
  }
  
  _hasPattern(candles: Candlestick[]): boolean {
    const hammer = candles[0];
    
    // Must be bearish (close lower than open)
    if (!CandlestickFinder.isBearish(hammer)) return false;
    
    // Must have a small body
    const bodyPercent = CandlestickFinder.bodyPercent(hammer);
    if (bodyPercent > 30) return false;
    
    // Must have a very small or no lower shadow
    const lowerShadowPercent = CandlestickFinder.lowerShadowPercent(hammer);
    if (lowerShadowPercent > 10) return false;
    
    // Must have a significant upper shadow
    const upperShadowPercent = CandlestickFinder.upperShadowPercent(hammer);
    
    // Upper shadow should be at least 2 times the body size
    return upperShadowPercent > 60 && upperShadowPercent > (bodyPercent * 2);
  }
}
