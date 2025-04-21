// 021. src/shared/utils/fibonacci.helper.ts
export class FibonacciHelper {
    static readonly RETRACEMENT_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    static readonly EXTENSION_LEVELS = [0, 0.382, 0.618, 1, 1.272, 1.618, 2.0, 2.618, 3.14, 3.618];
  
    static calculateRetracement(swingHigh: number, swingLow: number): Record<string, number> {
      const range = swingHigh - swingLow;
      const result: Record<string, number> = {};
  
      this.RETRACEMENT_LEVELS.forEach((level) => {
        result[level.toString()] = swingHigh - range * level;
      });
  
      return result;
    }
  
    static calculateExtension(swingLow: number, swingHigh: number, referencePoint: number): Record<string, number> {
      const range = swingHigh - swingLow;
      const result: Record<string, number> = {};
  
      this.EXTENSION_LEVELS.forEach((level) => {
        result[level.toString()] = referencePoint + range * level;
      });
  
      return result;
    }
  
    static calculateFibonacciRatio(firstSwing: number, secondSwing: number, thirdSwing: number): number {
      const firstDistance = Math.abs(secondSwing - firstSwing);
      const secondDistance = Math.abs(thirdSwing - secondSwing);
  
      if (firstDistance === 0) return 0;
      return secondDistance / firstDistance;
    }
  
    static isFibonacciNumber(value: number, tolerance: number = 0.03): boolean {
      const allLevels = [...this.RETRACEMENT_LEVELS, ...this.EXTENSION_LEVELS];
      return allLevels.some((level) => Math.abs(value - level) <= tolerance);
    }
  
    static isWithinFibonacciZone(value: number, targetLevel: number, tolerance: number = 0.03): boolean {
      return Math.abs(value - targetLevel) <= tolerance;
    }
  
    static findClosestFibonacciLevel(value: number): number {
      const allLevels = [...this.RETRACEMENT_LEVELS, ...this.EXTENSION_LEVELS];
      return allLevels.reduce((prev, curr) => {
        return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
      });
    }
  
    static calculateFibonacciProjection(
      point1Price: number,
      point2Price: number,
      point3Price: number,
      projectionLevels: number[] = [0.618, 1.0, 1.618],
    ): Record<string, number> {
      const range = point2Price - point1Price;
      const result: Record<string, number> = {};
  
      projectionLevels.forEach((level) => {
        result[level.toString()] = point3Price + range * level;
      });
  
      return result;
    }
  
    static calculateAlternateBatRatios(xaDistance: number, abDistance: number): Record<string, number> {
      return {
        ab_ratio: abDistance / xaDistance,
        bc_38_projection: abDistance * 0.382,
        bc_88_projection: abDistance * 0.886,
        bd_2_projection: abDistance * 2.0,
        bd_2618_projection: abDistance * 2.618,
        xd_88_projection: xaDistance * 0.886,
      };
    }
  }
  