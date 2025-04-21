// 078. src/libs/candlestick/Doji.ts
import { CandlestickFinder } from './CandlestickFinder';
import { Candlestick } from './Candlestick';

export class Doji extends CandlestickFinder {
  constructor() {
    super('Doji');
    this.requiredCount = 1;
  }
  
  _hasPattern(candles: Candlestick[]): boolean {
    const doji = candles[0];
    
    // Doji has almost the same open and close prices
    const bodyPercent = CandlestickFinder.bodyPercent(doji);
    
    // Must have a very small body (less than 5% of the total range)
    return bodyPercent < 5;
  }
}
