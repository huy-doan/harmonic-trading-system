// 100. src/domain/harmonic-patterns/services/gartley-pattern.service.ts
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
export class GartleyPatternService extends PatternBaseService {
  protected readonly logger = new Logger(GartleyPatternService.name);

  constructor(
    @InjectRepository(HarmonicPattern)
    protected readonly patternRepository: Repository<HarmonicPattern>,
    @InjectRepository(PatternPoint)
    protected readonly pointRepository: Repository<PatternPoint>,
    protected readonly eventEmitter: EventEmitter2
  ) {
    super(patternRepository, pointRepository, eventEmitter);
    this.initialize('GARTLEY', HARMONIC_RATIOS.GARTLEY);
  }

  /**
   * Find potential Gartley patterns in candlestick data
   */
  async findPatterns(candles: Candlestick[], symbol: string, timeframe: string): Promise<HarmonicPattern[]> {
    try {
      this.logger.debug(`Finding Gartley patterns for ${symbol} ${timeframe}...`);
      
      // Find swing points
      const { highs, lows } = this.findSwingPoints(candles);
      
      if (highs.length < 2 || lows.length < 2) {
        return [];
      }
      
      const patterns: HarmonicPattern[] = [];
      
      // Look for bullish Gartley patterns (lows-highs-lows-highs)
      const bullishPatterns = await this.findBullishGartleyPatterns(highs, lows, symbol, timeframe);
      patterns.push(...bullishPatterns);
      
      // Look for bearish Gartley patterns (highs-lows-highs-lows)
      const bearishPatterns = await this.findBearishGartleyPatterns(highs, lows, symbol, timeframe);
      patterns.push(...bearishPatterns);
      
      return patterns;
    } catch (error) {
      this.logger.error(`Error finding Gartley patterns: ${error.message}`, error.stack);
      return [];
    }
  }
  
  /**
   * Find bullish Gartley patterns
   */
  private async findBullishGartleyPatterns(
    highs: { price: number; timestamp: number; index: number }[],
    lows: { price: number; timestamp: number; index: number }[],
    symbol: string,
    timeframe: string
  ): Promise<HarmonicPattern[]> {
    const patterns: HarmonicPattern[] = [];
    
    // For bullish patterns we need X(low) -> A(high) -> B(low) -> C(high) -> D(low)
    // Try all combinations of significant swing lows and highs
    for (let xIndex = 0; xIndex < lows.length - 1; xIndex++) {
      const pointX = { label: 'X', price: lows[xIndex].price, timestamp: lows[xIndex].timestamp };
      
      // Find A as a high after X
      for (let aIndex = 0; aIndex < highs.length; aIndex++) {
        // Ensure A comes after X
        if (highs[aIndex].timestamp <= pointX.timestamp) continue;
        
        const pointA = { label: 'A', price: highs[aIndex].price, timestamp: highs[aIndex].timestamp };
        
        // Find B as a low after A
        for (let bIndex = 0; bIndex < lows.length; bIndex++) {
          // Ensure B comes after A and is higher than X
          if (lows[bIndex].timestamp <= pointA.timestamp || lows[bIndex].price < pointX.price) continue;
          
          const pointB = { label: 'B', price: lows[bIndex].price, timestamp: lows[bIndex].timestamp };
          
          // Find C as a high after B and lower than A
          for (let cIndex = 0; cIndex < highs.length; cIndex++) {
            // Ensure C comes after B and is lower than A
            if (highs[cIndex].timestamp <= pointB.timestamp || highs[cIndex].price > pointA.price) continue;
            
            const pointC = { label: 'C', price: highs[cIndex].price, timestamp: highs[cIndex].timestamp };
            
            // Find D as a low after C
            for (let dIndex = 0; dIndex < lows.length; dIndex++) {
              // Ensure D comes after C
              if (lows[dIndex].timestamp <= pointC.timestamp) continue;
              
              const pointD = { label: 'D', price: lows[dIndex].price, timestamp: lows[dIndex].timestamp };
              
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
   * Find bearish Gartley patterns
   */
  private async findBearishGartleyPatterns(
    highs: { price: number; timestamp: number; index: number }[],
    lows: { price: number; timestamp: number; index: number }[],
    symbol: string,
    timeframe: string
  ): Promise<HarmonicPattern[]> {
    const patterns: HarmonicPattern[] = [];
    
    // For bearish patterns we need X(high) -> A(low) -> B(high) -> C(low) -> D(high)
    // Try all combinations of significant swing highs and lows
    for (let xIndex = 0; xIndex < highs.length - 1; xIndex++) {
      const pointX = { label: 'X', price: highs[xIndex].price, timestamp: highs[xIndex].timestamp };
      
      // Find A as a low after X
      for (let aIndex = 0; aIndex < lows.length; aIndex++) {
        // Ensure A comes after X
        if (lows[aIndex].timestamp <= pointX.timestamp) continue;
        
        const pointA = { label: 'A', price: lows[aIndex].price, timestamp: lows[aIndex].timestamp };
        
        // Find B as a high after A and lower than X
        for (let bIndex = 0; bIndex < highs.length; bIndex++) {
          // Ensure B comes after A and is lower than X
          if (highs[bIndex].timestamp <= pointA.timestamp || highs[bIndex].price > pointX.price) continue;
          
          const pointB = { label: 'B', price: highs[bIndex].price, timestamp: highs[bIndex].timestamp };
          
          // Find C as a low after B and higher than A
          for (let cIndex = 0; cIndex < lows.length; cIndex++) {
            // Ensure C comes after B and is higher than A
            if (lows[cIndex].timestamp <= pointB.timestamp || lows[cIndex].price < pointA.price) continue;
            
            const pointC = { label: 'C', price: lows[cIndex].price, timestamp: lows[cIndex].timestamp };
            
            // Find D as a high after C
            for (let dIndex = 0; dIndex < highs.length; dIndex++) {
              // Ensure D comes after C
              if (highs[dIndex].timestamp <= pointC.timestamp) continue;
              
              const pointD = { label: 'D', price: highs[dIndex].price, timestamp: highs[dIndex].timestamp };
              
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
