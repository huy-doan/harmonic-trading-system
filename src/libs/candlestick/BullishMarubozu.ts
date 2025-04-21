// 086. src/libs/candlestick/BullishMarubozu.ts
import { CandlestickFinder } from './CandlestickFinder';
import { Candlestick } from './Candlestick';

export class BullishMarubozu extends CandlestickFinder {
  constructor() {
    super('Bullish Marubozu');
    this.requiredCount = 1;
  }
  
  _hasPattern(candles: Candlestick[]): boolean {
    const marubozu = candles[0];
    
    // Must be bullish (close higher than open)
    if (!CandlestickFinder.isBullish(marubozu)) return false;
    
    // Must have a very large body
    const bodyPercent = CandlestickFinder.bodyPercent(marubozu);
    if (bodyPercent < 95) return false;
    
    // Little to no shadows
    const upperShadowPercent = CandlestickFinder.upperShadowPercent(marubozu);
    const lowerShadowPercent = CandlestickFinder.lowerShadowPercent(marubozu);
    
    return upperShadowPercent < 1 && lowerShadowPercent < 1;
  }
}
