/**
 * Helper class for financial formulas and calculations
 */
export class FormulaHelper {
  /**
   * Calculates percentage change between two values
   */
  static calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Alternative method for percentage change calculation using absolute value
   */
  static calculatePercentChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  }
  
  /**
   * Calculates the average of an array of numbers
   */
  static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((total, value) => total + value, 0);
    return sum / values.length;
  }
  
  /**
   * Calculates Simple Moving Average (SMA)
   */
  static calculateSMA(values: number[], period: number): number[] {
    const result: number[] = [];
    
    if (values.length < period) {
      return result;
    }

    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }

    return result;
  }

  /**
   * Legacy method for calculating moving average, maintained for compatibility
   */
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
  
  /**
   * Calculates Exponential Moving Average (EMA)
   */
  static calculateEMA(values: number[], period: number): number[] {
    const result: number[] = [];
    
    if (values.length < period) {
      return result;
    }

    // First EMA is the SMA
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(values.slice(0, period), period)[0];
    
    result.push(ema);
    
    // Calculate EMA for the rest of the values
    for (let i = period; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema;
      result.push(ema);
    }

    return result;
  }
  
  /**
   * Calculates Relative Strength Index (RSI)
   */
  static calculateRSI(values: number[], period: number = 14): number[] {
    const result: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    if (values.length < period + 1) {
      return result;
    }

    // Calculate initial gains and losses
    for (let i = 1; i < values.length; i++) {
      const change = values[i] - values[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate initial RS
    const avgGain = this.calculateAverage(gains.slice(0, period));
    const avgLoss = this.calculateAverage(losses.slice(0, period));
    
    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }

    // Calculate RSI for the rest of the values
    for (let i = period; i < gains.length; i++) {
      const newAvgGain = (avgGain * (period - 1) + gains[i]) / period;
      const newAvgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      if (newAvgLoss === 0) {
        result.push(100);
      } else {
        const rs = newAvgGain / newAvgLoss;
        result.push(100 - (100 / (1 + rs)));
      }
    }

    return result;
  }

  /**
   * Calculates swing points in a dataset
   */
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
  
  /**
   * Calculates risk to reward ratio
   */
  static calculateRiskRewardRatio(
    entryPrice: number, 
    stopLoss: number, 
    takeProfit: number, 
    direction: 'LONG' | 'SHORT' = 'LONG'
  ): number {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    
    if (risk === 0) return 0;
    return reward / risk;
  }
  
  /**
   * Calculates position size based on risk parameters
   */
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

  /**
   * Calculates profit or loss for a trade
   */
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

  /**
   * Calculates profit or loss percentage for a trade
   */
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
  
  /**
   * Rounds a number to specified decimal places
   */
  static roundToDecimal(value: number, decimals: number = 2): number {
    return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
  }
  
  /**
   * Alternative method for rounding, maintained for compatibility
   */
  static round(value: number, decimals: number = 2): number {
    return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
  }
}
