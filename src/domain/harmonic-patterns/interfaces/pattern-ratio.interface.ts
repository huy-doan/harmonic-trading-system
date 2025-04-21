// 095. src/domain/harmonic-patterns/interfaces/pattern-ratio.interface.ts
export interface FibonacciRatio {
    min: number;
    ideal: number;
    max: number;
  }
  
  export interface HarmonicPatternRatios {
    XAB: FibonacciRatio;
    ABC: FibonacciRatio;
    BCD: FibonacciRatio;
    XAD: FibonacciRatio;
  }
  
  export interface AllHarmonicPatternRatios {
    GARTLEY: HarmonicPatternRatios;
    BUTTERFLY: HarmonicPatternRatios;
    BAT: HarmonicPatternRatios;
    CRAB: HarmonicPatternRatios;
    CYPHER: HarmonicPatternRatios;
  }
  
  // Default Fibonacci ratios for harmonic patterns
  export const HARMONIC_RATIOS: AllHarmonicPatternRatios = {
    GARTLEY: {
      XAB: { min: 0.586, ideal: 0.618, max: 0.648 },
      ABC: { min: 0.382, ideal: 0.618, max: 0.886 },
      BCD: { min: 1.13, ideal: 1.272, max: 1.618 },
      XAD: { min: 0.766, ideal: 0.786, max: 0.806 },
    },
    BUTTERFLY: {
      XAB: { min: 0.766, ideal: 0.786, max: 0.806 },
      ABC: { min: 0.382, ideal: 0.618, max: 0.886 },
      BCD: { min: 1.618, ideal: 2.24, max: 2.618 },
      XAD: { min: 1.17, ideal: 1.27, max: 1.618 },
    },
    BAT: {
      XAB: { min: 0.382, ideal: 0.5, max: 0.618 },
      ABC: { min: 0.382, ideal: 0.618, max: 0.886 },
      BCD: { min: 1.618, ideal: 2.0, max: 2.618 },
      XAD: { min: 0.866, ideal: 0.886, max: 0.906 },
    },
    CRAB: {
      XAB: { min: 0.382, ideal: 0.5, max: 0.618 },
      ABC: { min: 0.382, ideal: 0.618, max: 0.886 },
      BCD: { min: 2.618, ideal: 3.14, max: 3.618 },
      XAD: { min: 1.588, ideal: 1.618, max: 1.648 },
    },
    CYPHER: {
      XAB: { min: 0.468, ideal: 0.5, max: 0.532 },
      ABC: { min: 1.13, ideal: 1.414, max: 1.618 },
      BCD: { min: 0.75, ideal: 0.786, max: 0.82 },
      XAD: { min: 0.75, ideal: 0.786, max: 0.82 },
    },
  };
  
  // Function to check if a ratio is within tolerance of the target
  export function isRatioWithinTolerance(
    ratio: number, 
    target: number, 
    tolerance: number = 0.03
  ): boolean {
    return Math.abs(ratio - target) <= tolerance;
  }
  
  // Function to check if a ratio is within the valid range for a pattern
  export function isRatioValid(
    ratio: number,
    rangeObj: FibonacciRatio
  ): boolean {
    return ratio >= rangeObj.min && ratio <= rangeObj.max;
  }
  
  // Function to calculate quality score based on how close the ratio is to ideal
  export function calculateRatioQuality(
    ratio: number,
    rangeObj: FibonacciRatio
  ): number {
    if (!isRatioValid(ratio, rangeObj)) {
      return 0;
    }
  
    const distanceFromIdeal = Math.abs(ratio - rangeObj.ideal);
    const maxDistance = Math.max(
      Math.abs(rangeObj.max - rangeObj.ideal),
      Math.abs(rangeObj.min - rangeObj.ideal)
    );
  
    // Return a score from 0-100 based on how close to ideal
    return 100 * (1 - distanceFromIdeal / maxDistance);
  }
  