// 082. src/libs/candlestick/BullishHammerStick.ts
import { CandlestickFinder } from './CandlestickFinder';
import { Candlestick } from './Candlestick';

export class BullishHammerStick extends CandlestickFinder {
  constructor() {
    super('Bullish Hammer');
    this.requiredCount = 1;
  }
  
  _hasPattern(candles: Candlestick[]): boolean {
    const hammer = candles[0];
    
    // Must be bullish (close higher than open)
    if (!CandlestickFinder.isBullish(hammer)) return false;
    
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
