// 097. src/domain/harmonic-patterns/services/cypher-pattern.service.ts
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
export class CypherPatternService extends PatternBaseService {
  protected readonly logger = new Logger(CypherPatternService.name);

  constructor(
    @InjectRepository(HarmonicPattern)
    protected readonly patternRepository: Repository<HarmonicPattern>,
    @InjectRepository(PatternPoint)
    protected readonly pointRepository: Repository<PatternPoint>,
    protected readonly eventEmitter: EventEmitter2
  ) {
    super(patternRepository, pointRepository, eventEmitter);
    this.initialize('CYPHER', HARMONIC_RATIOS.CYPHER);
  }

  /**
   * Find potential Cypher patterns in candlestick data
   */
  async findPatterns(candles: Candlestick[], symbol: string, timeframe: string): Promise<HarmonicPattern[]> {
    try {
      this.logger.debug(`Finding Cypher patterns for ${symbol} ${timeframe}...`);
      
      // Find swing points
      const { highs, lows } = this.findSwingPoints(candles);
      
      if (highs.length < 2 || lows.length < 2) {
        return [];
      }
      
      const patterns: HarmonicPattern[] = [];
      
      // Look for bullish Cypher patterns
      const bullishPatterns = await this.findBullishCypherPatterns(highs, lows, symbol, timeframe);
      patterns.push(...bullishPatterns);
      
      // Look for bearish Cypher patterns
      const bearishPatterns = await this.findBearishCypherPatterns(highs, lows, symbol, timeframe);
      patterns.push(...bearishPatterns);
      
      return patterns;
    } catch (error) {
      this.logger.error(`Error finding Cypher patterns: ${error.message}`, error.stack);
      return [];
    }
  }
  
  /**
   * Find bullish Cypher patterns
   */
  private async findBullishCypherPatterns(
    highs: { price: number; timestamp: number; index: number }[],
    lows: { price: number; timestamp: number; index: number }[],
    symbol: string,
    timeframe: string
  ): Promise<HarmonicPattern[]> {
    const patterns: HarmonicPattern[] = [];
    
    // For bullish Cypher: X(low) -> A(high) -> B(low) -> C(high) -> D(low)
    // Key characteristics: 
    // - XAB ratio is close to 0.5
    // - ABC ratio is between 1.27-1.618
    // - BCD ratio is close to 0.786
    // - XAD ratio is close to 0.786
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
          
          // Check if XAB ratio is roughly in range for a Cypher pattern
          if (xabRatio < 0.45 || xabRatio > 0.55) continue;
          
          // Find C as a high after B
          for (let cIndex = 0; cIndex < highs.length; cIndex++) {
            // Ensure C comes after B
            if (highs[cIndex].timestamp <= pointB.timestamp) continue;
            
            const pointC = { label: 'C', price: highs[cIndex].price, timestamp: highs[cIndex].timestamp };
            
            // Calculate ABC ratio
            const bcDistance = Math.abs(pointC.price - pointB.price);
            const abcRatio = bcDistance / abDistance;
            
            // Check if ABC ratio is in the Cypher range
            if (abcRatio < 1.27 || abcRatio > 1.618) continue;
            
            // Find D as a low after C
            for (let dIndex = 0; dIndex < lows.length; dIndex++) {
              // Ensure D comes after C
              if (lows[dIndex].timestamp <= pointC.timestamp) continue;
              
              const pointD = { label: 'D', price: lows[dIndex].price, timestamp: lows[dIndex].timestamp };
              
              // Calculate BCD ratio
              const cdDistance = Math.abs(pointD.price - pointC.price);
              const bcdRatio = cdDistance / bcDistance;
              
              // Calculate XAD ratio
              const xdDistance = Math.abs(pointD.price - pointX.price);
              const xadRatio = xdDistance / xaDistance;
              
              // Quick check for Cypher ratios before full validation
              if (Math.abs(bcdRatio - 0.786) > 0.05 || Math.abs(xadRatio - 0.786) > 0.05) continue;
              
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
   * Find bearish Cypher patterns
   */
  private async findBearishCypherPatterns(
    highs: { price: number; timestamp: number; index: number }[],
    lows: { price: number; timestamp: number; index: number }[],
    symbol: string,
    timeframe: string
  ): Promise<HarmonicPattern[]> {
    const patterns: HarmonicPattern[] = [];
    
    // For bearish Cypher: X(high) -> A(low) -> B(high) -> C(low) -> D(high)
    // Key characteristics:
    // - XAB ratio is close to 0.5
    // - ABC ratio is between 1.27-1.618
    // - BCD ratio is close to 0.786
    // - XAD ratio is close to 0.786
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
          
          // Check if XAB ratio is roughly in range for a Cypher pattern
          if (xabRatio < 0.45 || xabRatio > 0.55) continue;
          
          // Find C as a low after B
          for (let cIndex = 0; cIndex < lows.length; cIndex++) {
            // Ensure C comes after B
            if (lows[cIndex].timestamp <= pointB.timestamp) continue;
            
            const pointC = { label: 'C', price: lows[cIndex].price, timestamp: lows[cIndex].timestamp };
            
            // Calculate ABC ratio
            const bcDistance = Math.abs(pointC.price - pointB.price);
            const abcRatio = bcDistance / abDistance;
            
            // Check if ABC ratio is in the Cypher range
            if (abcRatio < 1.27 || abcRatio > 1.618) continue;
            
            // Find D as a high after C
            for (let dIndex = 0; dIndex < highs.length; dIndex++) {
              // Ensure D comes after C
              if (highs[dIndex].timestamp <= pointC.timestamp) continue;
              
              const pointD = { label: 'D', price: highs[dIndex].price, timestamp: highs[dIndex].timestamp };
              
              // Calculate BCD ratio
              const cdDistance = Math.abs(pointD.price - pointC.price);
              const bcdRatio = cdDistance / bcDistance;
              
              // Calculate XAD ratio
              const xdDistance = Math.abs(pointD.price - pointX.price);
              const xadRatio = xdDistance / xaDistance;
              
              // Quick check for Cypher ratios before full validation
              if (Math.abs(bcdRatio - 0.786) > 0.05 || Math.abs(xadRatio - 0.786) > 0.05) continue;
              
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
