// 020. src/shared/utils/formula.helper.ts
export class FormulaHelper {
    static calculatePercentageChange(oldValue: number, newValue: number): number {
      if (oldValue === 0) return 0;
      return ((newValue - oldValue) / oldValue) * 100;
    }
  
    static calculateMovingAverage(values: number[], period: number): number[] {
      if (values.length < period) {
        return [];
      }
  
      const result: number[] = [];
      for (let i = 0; i <= values.length - period; i++) {
        const sum = values.slice(i, i + period).reduce((acc, val) => acc + val, 0);
        result.push(sum / period);
      }
  
      return result;
    }
  
    static calculateSwingPoints(data: { high: number; low: number }[]): { highs: number[]; lows: number[] } {
      const highs: number[] = [];
      const lows: number[] = [];
  
      for (let i = 1; i < data.length - 1; i++) {
        if (data[i].high > data[i - 1].high && data[i].high > data[i + 1].high) {
          highs.push(i);
        }
        if (data[i].low < data[i - 1].low && data[i].low < data[i + 1].low) {
          lows.push(i);
        }
      }
  
      return { highs, lows };
    }
  
    static calculateRiskRewardRatio(
      entryPrice: number,
      stopLoss: number,
      takeProfit: number,
      direction: 'LONG' | 'SHORT',
    ): number {
      const risk = Math.abs(entryPrice - stopLoss);
      const reward = Math.abs(takeProfit - entryPrice);
  
      if (risk === 0) return 0;
      return reward / risk;
    }
  
    static calculatePositionSize(
      accountBalance: number,
      riskPercentage: number,
      entryPrice: number,
      stopLoss: number,
    ): number {
      const riskAmount = accountBalance * (riskPercentage / 100);
      const priceRisk = Math.abs(entryPrice - stopLoss);
  
      if (priceRisk === 0) return 0;
      return riskAmount / priceRisk;
    }
  
    static calculateProfitLoss(
      entryPrice: number,
      exitPrice: number,
      quantity: number,
      direction: 'LONG' | 'SHORT',
    ): number {
      if (direction === 'LONG') {
        return (exitPrice - entryPrice) * quantity;
      } else {
        return (entryPrice - exitPrice) * quantity;
      }
    }
  
    static calculateProfitLossPercentage(
      entryPrice: number,
      exitPrice: number,
      direction: 'LONG' | 'SHORT',
    ): number {
      if (direction === 'LONG') {
        return ((exitPrice - entryPrice) / entryPrice) * 100;
      } else {
        return ((entryPrice - exitPrice) / entryPrice) * 100;
      }
    }
  
    static roundToDecimal(value: number, decimals: number): number {
      return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
    }
  }
  