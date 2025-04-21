// 084. src/libs/candlestick/BullishInvertedHammerStick.ts
import { CandlestickFinder } from './CandlestickFinder';
import { Candlestick } from './Candlestick';

export class BullishInvertedHammerStick extends CandlestickFinder {
  constructor() {
    super('Bullish Inverted Hammer');
    this.requiredCount = 1;
  }
  
  _hasPattern(candles: Candlestick[]): boolean {
    const hammer = candles[0];
    
    // Must be bullish (close higher than open)
    if (!CandlestickFinder.isBullish(hammer)) return false;
    
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
