// 101. src/domain/harmonic-patterns/services/crab-pattern.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PatternBaseService } from './pattern-base.service';
import { HarmonicPattern } from '../entities/harmonic-pattern.entity';
import { PatternPoint } from '../entities/pattern-point.entity';
import { Candlestick } from '@libs/candlestick/Candlestick';
import { HARMONIC_RATIOS } from '../interfaces/pattern-ratio.interface';

@Injectable()
export class CrabPatternService extends PatternBaseService {
  protected readonly logger = new Logger(CrabPatternService.name);

  constructor(
    @InjectRepository(HarmonicPattern)
    protected readonly patternRepository: Repository<HarmonicPattern>,
    @InjectRepository(PatternPoint)
    protected readonly pointRepository: Repository<PatternPoint>,
    protected readonly eventEmitter: EventEmitter2
  ) {
    super(patternRepository, pointRepository, eventEmitter);
    this.initialize('CRAB', HARMONIC_RATIOS.CRAB);
  }

  /**
   * Find potential Crab patterns in candlestick data
   */
  async findPatterns(candles: Candlestick[], symbol: string, timeframe: string): Promise<HarmonicPattern[]> {
    try {
      this.logger.debug(`Finding Crab patterns for ${symbol} ${timeframe}...`);
      
      // Find swing points
      const { highs, lows } = this.findSwingPoints(candles);
      
      if (highs.length < 2 || lows.length < 2) {
        return [];
      }
      
      const patterns: HarmonicPattern[] = [];
      
      // Look for bullish Crab patterns
      const bullishPatterns = await this.findBullishCrabPatterns(highs, lows, symbol, timeframe);
      patterns.push(...bullishPatterns);
      
      // Look for bearish Crab patterns
      const bearishPatterns = await this.findBearishCrabPatterns(highs, lows, symbol, timeframe);
      patterns.push(...bearishPatterns);
      
      return patterns;
    } catch (error) {
      this.logger.error(`Error finding Crab patterns: ${error.message}`, error.stack);
      return [];
    }
  }
  
  /**
   * Find bullish Crab patterns
   */
  private async findBullishCrabPatterns(
    highs: { price: number; timestamp: number; index: number }[],
    lows: { price: number; timestamp: number; index: number }[],
    symbol: string,
    timeframe: string
  ): Promise<HarmonicPattern[]> {
    const patterns: HarmonicPattern[] = [];
    
    // For bullish Crab: X(low) -> A(high) -> B(low) -> C(high) -> D(low)
    // Key characteristic: XAB ratio is around 0.382-0.618, BCD ratio is around 3.14 (extreme), XAD is 1.618
    for (let xIndex = 0; xIndex < lows.length - 1; xIndex++) {
      const pointX = { label: 'X', price: lows[xIndex].price, timestamp: lows[xIndex].timestamp };
      
      // Find A as a high after X
      for (let aIndex = 0; aIndex < highs.length; aIndex++) {
        // Ensure A comes after X
        if (highs[aIndex].timestamp <= pointX.timestamp) continue;
        
        const pointA = { label: 'A', price: highs[aIndex].price, timestamp: highs[aIndex].timestamp };
        
        // Find B as a low after A
        for (let bIndex = 0; bIndex < lows.length; bIndex++) {
          // Ensure B comes after A
          if (lows[bIndex].timestamp <= pointA.timestamp) continue;
          
          const pointB = { label: 'B', price: lows[bIndex].price, timestamp: lows[bIndex].timestamp };
          
          // Calculate XAB ratio early to filter out unlikely candidates
          const xaDistance = Math.abs(pointA.price - pointX.price);
          const abDistance = Math.abs(pointB.price - pointA.price);
          const xabRatio = abDistance / xaDistance;
          
          // Check if XAB ratio is roughly in range for a Crab pattern
          if (xabRatio < 0.35 || xabRatio > 0.65) continue;
          
          // Find C as a high after B
          for (let cIndex = 0; cIndex < highs.length; cIndex++) {
            // Ensure C comes after B and is lower than A
            if (highs[cIndex].timestamp <= pointB.timestamp || highs[cIndex].price > pointA.price) continue;
            
            const pointC = { label: 'C', price: highs[cIndex].price, timestamp: highs[cIndex].timestamp };
            
            // Calculate BC distance to estimate potential D location
            const bcDistance = Math.abs(pointC.price - pointB.price);
            const potentialDPrice = pointC.price - bcDistance * 3.14; // BCD ratio for Crab is around 3.14
            
            // Find D as a low after C and significantly below X (extension typically 1.618 of XA)
            for (let dIndex = 0; dIndex < lows.length; dIndex++) {
              // Ensure D comes after C and is significantly below X
              if (lows[dIndex].timestamp <= pointC.timestamp || lows[dIndex].price > pointX.price) continue;
              
              const pointD = { label: 'D', price: lows[dIndex].price, timestamp: lows[dIndex].timestamp };
              
              // Additional check for Crab pattern: XAD ratio should be around 1.618
              const xaDistance = Math.abs(pointA.price - pointX.price);
              const xdDistance = Math.abs(pointD.price - pointX.price);
              const xadRatio = xdDistance / xaDistance;
              
              // Rough check before full validation
              if (xadRatio < 1.4 || xadRatio > 1.8) continue;
              
              // Validate the pattern
              const points = [pointX, pointA, pointB, pointC, pointD];
              const validation = this.validatePattern(points, 'BULLISH');
              
              if (validation.isValid && validation.qualityScore >= 70) {
                // Save the pattern
                const pattern = await this.savePattern(points, symbol, timeframe, 'BULLISH', validation);
                patterns.push(pattern);
              }
            }
            
            // If we don't have a D point yet, we can still have a potential pattern with X, A, B, C
            const points = [pointX, pointA, pointB, pointC];
            const validation = this.validatePattern(points, 'BULLISH');
            
            if (validation.isValid && validation.qualityScore >= 75) {
              // Save the pattern as "not completed"
              const pattern = await this.savePattern(points, symbol, timeframe, 'BULLISH', validation);
              patterns.push(pattern);
            }
          }
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Find bearish Crab patterns
   */
  private async findBearishCrabPatterns(
    highs: { price: number; timestamp: number; index: number }[],
    lows: { price: number; timestamp: number; index: number }[],
    symbol: string,
    timeframe: string
  ): Promise<HarmonicPattern[]> {
    const patterns: HarmonicPattern[] = [];
    
    // For bearish Crab: X(high) -> A(low) -> B(high) -> C(low) -> D(high)
    // Key characteristic: XAB ratio is around 0.382-0.618, BCD ratio is around 3.14 (extreme), XAD is 1.618
    for (let xIndex = 0; xIndex < highs.length - 1; xIndex++) {
      const pointX = { label: 'X', price: highs[xIndex].price, timestamp: highs[xIndex].timestamp };
      
      // Find A as a low after X
      for (let aIndex = 0; aIndex < lows.length; aIndex++) {
        // Ensure A comes after X
        if (lows[aIndex].timestamp <= pointX.timestamp) continue;
        
        const pointA = { label: 'A', price: lows[aIndex].price, timestamp: lows[aIndex].timestamp };
        
        // Find B as a high after A
        for (let bIndex = 0; bIndex < highs.length; bIndex++) {
          // Ensure B comes after A
          if (highs[bIndex].timestamp <= pointA.timestamp) continue;
          
          const pointB = { label: 'B', price: highs[bIndex].price, timestamp: highs[bIndex].timestamp };
          
          // Calculate XAB ratio early to filter out unlikely candidates
          const xaDistance = Math.abs(pointA.price - pointX.price);
          const abDistance = Math.abs(pointB.price - pointA.price);
          const xabRatio = abDistance / xaDistance;
          
          // Check if XAB ratio is roughly in range for a Crab pattern
          if (xabRatio < 0.35 || xabRatio > 0.65) continue;
          
          // Find C as a low after B
          for (let cIndex = 0; cIndex < lows.length; cIndex++) {
            // Ensure C comes after B and is higher than A
            if (lows[cIndex].timestamp <= pointB.timestamp || lows[cIndex].price < pointA.price) continue;
            
            const pointC = { label: 'C', price: lows[cIndex].price, timestamp: lows[cIndex].timestamp };
            
            // Calculate BC distance to estimate potential D location
            const bcDistance = Math.abs(pointC.price - pointB.price);
            const potentialDPrice = pointC.price + bcDistance * 3.14; // BCD ratio for Crab is around 3.14
            
            // Find D as a high after C and significantly above X (extension typically 1.618 of XA)
            for (let dIndex = 0; dIndex < highs.length; dIndex++) {
              // Ensure D comes after C and is significantly above X
              if (highs[dIndex].timestamp <= pointC.timestamp || highs[dIndex].price < pointX.price) continue;
              
              const pointD = { label: 'D', price: highs[dIndex].price, timestamp: highs[dIndex].timestamp };
              
              // Additional check for Crab pattern: XAD ratio should be around 1.618
              const xaDistance = Math.abs(pointA.price - pointX.price);
              const xdDistance = Math.abs(pointD.price - pointX.price);
              const xadRatio = xdDistance / xaDistance;
              
              // Rough check before full validation
              if (xadRatio < 1.4 || xadRatio > 1.8) continue;
              
              // Validate the pattern
              const points = [pointX, pointA, pointB, pointC, pointD];
              const validation = this.validatePattern(points, 'BEARISH');
              
              if (validation.isValid && validation.qualityScore >= 70) {
                // Save the pattern
                const pattern = await this.savePattern(points, symbol, timeframe, 'BEARISH', validation);
                patterns.push(pattern);
              }
            }
            
            // If we don't have a D point yet, we can still have a potential pattern with X, A, B, C
            const points = [pointX, pointA, pointB, pointC];
            const validation = this.validatePattern(points, 'BEARISH');
            
            if (validation.isValid && validation.qualityScore >= 75) {
              // Save the pattern as "not completed"
              const pattern = await this.savePattern(points, symbol, timeframe, 'BEARISH', validation);
              patterns.push(pattern);
            }
          }
        }
      }
    }
    
    return patterns;
  }
}
