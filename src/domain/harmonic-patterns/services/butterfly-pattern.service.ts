// 099. src/domain/harmonic-patterns/services/butterfly-pattern.service.ts
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
export class ButterflyPatternService extends PatternBaseService {
  protected readonly logger = new Logger(ButterflyPatternService.name);

  constructor(
    @InjectRepository(HarmonicPattern)
    protected readonly patternRepository: Repository<HarmonicPattern>,
    @InjectRepository(PatternPoint)
    protected readonly pointRepository: Repository<PatternPoint>,
    protected readonly eventEmitter: EventEmitter2
  ) {
    super(patternRepository, pointRepository, eventEmitter);
    this.initialize('BUTTERFLY', HARMONIC_RATIOS.BUTTERFLY);
  }

  /**
   * Find potential Butterfly patterns in candlestick data
   */
  async findPatterns(candles: Candlestick[], symbol: string, timeframe: string): Promise<HarmonicPattern[]> {
    try {
      this.logger.debug(`Finding Butterfly patterns for ${symbol} ${timeframe}...`);
      
      // Find swing points
      const { highs, lows } = this.findSwingPoints(candles);
      
      if (highs.length < 2 || lows.length < 2) {
        return [];
      }
      
      const patterns: HarmonicPattern[] = [];
      
      // Look for bullish Butterfly patterns (lows-highs-lows-highs)
      const bullishPatterns = await this.findBullishButterflyPatterns(highs, lows, symbol, timeframe);
      patterns.push(...bullishPatterns);
      
      // Look for bearish Butterfly patterns (highs-lows-highs-lows)
      const bearishPatterns = await this.findBearishButterflyPatterns(highs, lows, symbol, timeframe);
      patterns.push(...bearishPatterns);
      
      return patterns;
    } catch (error) {
      this.logger.error(`Error finding Butterfly patterns: ${error.message}`, error.stack);
      return [];
    }
  }
  
  /**
   * Find bullish Butterfly patterns
   */
  private async findBullishButterflyPatterns(
    highs: { price: number; timestamp: number; index: number }[],
    lows: { price: number; timestamp: number; index: number }[],
    symbol: string,
    timeframe: string
  ): Promise<HarmonicPattern[]> {
    const patterns: HarmonicPattern[] = [];
    
    // For bullish Butterfly: X(low) -> A(high) -> B(low) -> C(high) -> D(low)
    // Key difference from Gartley: XAB ratio is about 0.786 and D goes beyond X
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
          
          // Find C as a high after B
          for (let cIndex = 0; cIndex < highs.length; cIndex++) {
            // Ensure C comes after B and is lower than A
            if (highs[cIndex].timestamp <= pointB.timestamp || highs[cIndex].price > pointA.price) continue;
            
            const pointC = { label: 'C', price: highs[cIndex].price, timestamp: highs[cIndex].timestamp };
            
            // Find D as a low after C and lower than X (key characteristic of Butterfly)
            for (let dIndex = 0; dIndex < lows.length; dIndex++) {
              // Ensure D comes after C and is lower than X
              if (lows[dIndex].timestamp <= pointC.timestamp || lows[dIndex].price > pointX.price) continue;
              
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
   * Find bearish Butterfly patterns
   */
  private async findBearishButterflyPatterns(
    highs: { price: number; timestamp: number; index: number }[],
    lows: { price: number; timestamp: number; index: number }[],
    symbol: string,
    timeframe: string
  ): Promise<HarmonicPattern[]> {
    const patterns: HarmonicPattern[] = [];
    
    // For bearish Butterfly: X(high) -> A(low) -> B(high) -> C(low) -> D(high)
    // Key difference from Gartley: XAB ratio is about 0.786 and D goes beyond X
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
          
          // Find C as a low after B
          for (let cIndex = 0; cIndex < lows.length; cIndex++) {
            // Ensure C comes after B and is higher than A
            if (lows[cIndex].timestamp <= pointB.timestamp || lows[cIndex].price < pointA.price) continue;
            
            const pointC = { label: 'C', price: lows[cIndex].price, timestamp: lows[cIndex].timestamp };
            
            // Find D as a high after C and higher than X (key characteristic of Butterfly)
            for (let dIndex = 0; dIndex < highs.length; dIndex++) {
              // Ensure D comes after C and is higher than X
              if (highs[dIndex].timestamp <= pointC.timestamp || highs[dIndex].price < pointX.price) continue;
              
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
