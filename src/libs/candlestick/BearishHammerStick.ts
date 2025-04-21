// 081. src/libs/candlestick/BearishHammerStick.ts
import { CandlestickFinder } from './CandlestickFinder';
import { Candlestick } from './Candlestick';

export class BearishHammerStick extends CandlestickFinder {
  constructor() {
    super('Bearish Hammer');
    this.requiredCount = 1;
  }
  
  _hasPattern(candles: Candlestick[]): boolean {
    const hammer = candles[0];
    
    // Must be bearish (close lower than open)
    if (!CandlestickFinder.isBearish(hammer)) return false;
    
    // Must have a small body
    const bodyPercent = CandlestickFinder.bodyPercent(hammer);
    if (bodyPercent > 30) return false;
    
    // Must have a very small or no upper shadow
    const upperShadowPercent = CandlestickFinder.upperShadowPercent(hammer);
    if (upperShadowPercent > 10) return false;
    
    // Must have a significant lower shadow
    const lowerShadowPercent = CandlestickFinder.lowerShadowPercent(hammer);
    
    // Lower shadow should be at least 2 times the body size
    return lowerShadowPercent > 60 && lowerShadowPercent > (bodyPercent * 2);
  }
}
