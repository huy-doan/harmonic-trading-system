// 088. src/libs/candlestick/BullishSpinningTop.ts
import { CandlestickFinder } from './CandlestickFinder';
import { Candlestick } from './Candlestick';

export class BullishSpinningTop extends CandlestickFinder {
  constructor() {
    super('Bullish Spinning Top');
    this.requiredCount = 1;
  }
  
  _hasPattern(candles: Candlestick[]): boolean {
    const spinningTop = candles[0];
    
    // Must be bullish (close higher than open)
    if (!CandlestickFinder.isBullish(spinningTop)) return false;
    
    // Must have a small body
    const bodyPercent = CandlestickFinder.bodyPercent(spinningTop);
    if (bodyPercent > 30) return false;
    
    // Must have nearly equal upper and lower shadows
    const upperShadowPercent = CandlestickFinder.upperShadowPercent(spinningTop);
    const lowerShadowPercent = CandlestickFinder.lowerShadowPercent(spinningTop);
    
    // Both shadows must be significant
    if (upperShadowPercent < 25 || lowerShadowPercent < 25) return false;
    
    // Shadows should be roughly equal (within 30% of each other)
    const shadowRatio = Math.min(upperShadowPercent, lowerShadowPercent) / 
                        Math.max(upperShadowPercent, lowerShadowPercent);
    
    return shadowRatio > 0.7;
  }
}
