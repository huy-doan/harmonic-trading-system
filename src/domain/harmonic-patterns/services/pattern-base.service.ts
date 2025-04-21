// 096. src/domain/harmonic-patterns/services/pattern-base.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HarmonicPattern } from '../entities/harmonic-pattern.entity';
import { PatternPoint } from '../entities/pattern-point.entity';
import { Candlestick } from '@libs/candlestick/Candlestick';
import { FibonacciHelper } from '@shared/utils/fibonacci.helper';
import { HarmonicPatternRatios, isRatioValid, calculateRatioQuality } from '../interfaces/pattern-ratio.interface';

@Injectable()
export abstract class PatternBaseService {
  protected readonly logger = new Logger(this.constructor.name);
  protected patternType: string;
  protected patternRatios: HarmonicPatternRatios;

  constructor(
    @InjectRepository(HarmonicPattern)
    protected readonly patternRepository: Repository<HarmonicPattern>,
    @InjectRepository(PatternPoint)
    protected readonly pointRepository: Repository<PatternPoint>,
    protected readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Initialize the pattern service with specific ratios
   */
  protected initialize(patternType: string, patternRatios: HarmonicPatternRatios): void {
    this.patternType = patternType;
    this.patternRatios = patternRatios;
  }

  /**
   * Find potential patterns in candlestick data
   */
  abstract findPatterns(candles: Candlestick[], symbol: string, timeframe: string): Promise<HarmonicPattern[]>;

  /**
   * Calculate all Fibonacci ratios for a set of pattern points
   */
  protected calculateFibonacciRatios(points: { label: string; price: number; timestamp: number }[]): {
    XAB: number;
    ABC: number;
    BCD: number;
    XAD?: number;
  } {
    if (points.length < 4) {
      throw new Error('At least 4 points (X, A, B, C) are required to calculate ratios');
    }

    // Sort points by their labels to ensure correct order
    const sortedPoints = this.sortPointsByLabel(points);

    // Extract prices for each point
    const X = sortedPoints.find(p => p.label === 'X')?.price;
    const A = sortedPoints.find(p => p.label === 'A')?.price;
    const B = sortedPoints.find(p => p.label === 'B')?.price;
    const C = sortedPoints.find(p => p.label === 'C')?.price;
    const D = sortedPoints.find(p => p.label === 'D')?.price;

    if (!X || !A || !B || !C) {
      throw new Error('Missing required points (X, A, B, C)');
    }

    // Calculate legs
    const XA = Math.abs(A - X);
    const AB = Math.abs(B - A);
    const BC = Math.abs(C - B);
    const CD = D ? Math.abs(D - C) : 0;
    const AD = D ? Math.abs(D - A) : 0;
    const XD = D ? Math.abs(D - X) : 0;

    // Calculate ratios
    const XAB = AB / XA;
    const ABC = BC / AB;
    const BCD = CD / BC;
    const XAD = D ? XD / XA : undefined;

    return {
      XAB,
      ABC,
      BCD,
      XAD,
    };
  }

  /**
   * Sort points by their labels in the correct order (X, A, B, C, D)
   */
  protected sortPointsByLabel(points: { label: string; price: number; timestamp: number }[]): {
    label: string;
    price: number;
    timestamp: number;
  }[] {
    const orderMap = { X: 0, A: 1, B: 2, C: 3, D: 4 };
    return [...points].sort((a, b) => orderMap[a.label] - orderMap[b.label]);
  }

  /**
   * Validate if the given points form a valid pattern according to Fibonacci ratios
   */
  protected validatePattern(
    points: { label: string; price: number; timestamp: number }[],
    direction: 'BULLISH' | 'BEARISH'
  ): { isValid: boolean; qualityScore: number; ratios: any } {
    try {
      // Calculate ratios
      const ratios = this.calculateFibonacciRatios(points);
      
      // Initialize validation status
      let isValid = true;
      let totalQuality = 0;
      let ratioCount = 0;

      // Validate XAB ratio
      const xabValid = isRatioValid(ratios.XAB, this.patternRatios.XAB);
      isValid = isValid && xabValid;
      if (xabValid) {
        totalQuality += calculateRatioQuality(ratios.XAB, this.patternRatios.XAB);
        ratioCount++;
      }

      // Validate ABC ratio
      const abcValid = isRatioValid(ratios.ABC, this.patternRatios.ABC);
      isValid = isValid && abcValid;
      if (abcValid) {
        totalQuality += calculateRatioQuality(ratios.ABC, this.patternRatios.ABC);
        ratioCount++;
      }

      // Validate BCD ratio
      const bcdValid = isRatioValid(ratios.BCD, this.patternRatios.BCD);
      isValid = isValid && bcdValid;
      if (bcdValid) {
        totalQuality += calculateRatioQuality(ratios.BCD, this.patternRatios.BCD);
        ratioCount++;
      }

      // Validate XAD ratio if D point exists
      let xadValid = true;
      if (ratios.XAD !== undefined) {
        xadValid = isRatioValid(ratios.XAD, this.patternRatios.XAD);
        isValid = isValid && xadValid;
        if (xadValid) {
          totalQuality += calculateRatioQuality(ratios.XAD, this.patternRatios.XAD);
          ratioCount++;
        }
      }

      // Calculate average quality score
      const qualityScore = ratioCount > 0 ? Math.round(totalQuality / ratioCount) : 0;

      return {
        isValid,
        qualityScore,
        ratios,
      };
    } catch (error) {
      this.logger.error(`Error validating pattern: ${error.message}`);
      return {
        isValid: false,
        qualityScore: 0,
        ratios: {},
      };
    }
  }

  /**
   * Calculate potential reversal zone (PRZ) for the pattern
   */
  protected calculatePRZ(
    points: { label: string; price: number; timestamp: number }[],
    direction: 'BULLISH' | 'BEARISH'
  ): { high: number; low: number } {
    // Sort points to ensure correct order
    const sortedPoints = this.sortPointsByLabel(points);

    // Get the last point (C or D)
    const lastPoint = sortedPoints[sortedPoints.length - 1];
    
    // Default tolerance in percentage
    const tolerance = 0.015; // 1.5%
    
    // Calculate PRZ based on last point and pattern direction
    if (direction === 'BULLISH') {
      // For bullish patterns, PRZ is below the last point
      const prz = lastPoint.price;
      return {
        high: prz * (1 + tolerance),
        low: prz * (1 - tolerance),
      };
    } else {
      // For bearish patterns, PRZ is above the last point
      const prz = lastPoint.price;
      return {
        high: prz * (1 + tolerance),
        low: prz * (1 - tolerance),
      };
    }
  }

  /**
   * Calculate entry, stop loss and take profit levels for the pattern
   */
  protected calculateTradeLevels(
    points: { label: string; price: number; timestamp: number }[],
    direction: 'BULLISH' | 'BEARISH'
  ): {
    entryPrice: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    takeProfit3: number;
  } {
    // Sort points
    const sortedPoints = this.sortPointsByLabel(points);
    
    // Extract necessary points
    const X = sortedPoints.find(p => p.label === 'X')?.price;
    const A = sortedPoints.find(p => p.label === 'A')?.price;
    const B = sortedPoints.find(p => p.label === 'B')?.price;
    const C = sortedPoints.find(p => p.label === 'C')?.price;
    const D = sortedPoints.find(p => p.label === 'D')?.price || C; // If D is missing, use C as approximation
    
    if (!X || !A || !B || !C) {
      throw new Error('Missing required points (X, A, B, C)');
    }
    
    // For bullish patterns
    if (direction === 'BULLISH') {
      // Entry is at D point or PRZ
      const entryPrice = D;
      
      // Stop loss is slightly below X (or a specific percentage below entry)
      const stopLoss = Math.min(X * 0.99, entryPrice * 0.98);
      
      // Calculate take profit levels using Fibonacci extensions
      const range = Math.abs(entryPrice - stopLoss);
      const takeProfit1 = entryPrice + range * 1.0; // 1:1 risk-reward
      const takeProfit2 = entryPrice + range * 1.618; // 1.618 extension
      const takeProfit3 = entryPrice + range * 2.618; // 2.618 extension
      
      return {
        entryPrice,
        stopLoss,
        takeProfit1,
        takeProfit2,
        takeProfit3,
      };
    } 
    // For bearish patterns
    else {
      // Entry is at D point or PRZ
      const entryPrice = D;
      
      // Stop loss is slightly above X (or a specific percentage above entry)
      const stopLoss = Math.max(X * 1.01, entryPrice * 1.02);
      
      // Calculate take profit levels using Fibonacci extensions
      const range = Math.abs(stopLoss - entryPrice);
      const takeProfit1 = entryPrice - range * 1.0; // 1:1 risk-reward
      const takeProfit2 = entryPrice - range * 1.618; // 1.618 extension
      const takeProfit3 = entryPrice - range * 2.618; // 2.618 extension
      
      return {
        entryPrice,
        stopLoss,
        takeProfit1,
        takeProfit2,
        takeProfit3,
      };
    }
  }

  /**
   * Save a detected pattern to the database
   */
  protected async savePattern(
    patternPoints: { label: string; price: number; timestamp: number }[],
    symbol: string,
    timeframe: string,
    direction: 'BULLISH' | 'BEARISH',
    validation: { isValid: boolean; qualityScore: number; ratios: any }
  ): Promise<HarmonicPattern> {
    try {
      // Calculate PRZ and trade levels
      const prz = this.calculatePRZ(patternPoints, direction);
      const tradeLevels = this.calculateTradeLevels(patternPoints, direction);
      
      // Create pattern entity
      const pattern = this.patternRepository.create({
        symbol,
        timeframe,
        patternType: this.patternType,
        direction,
        qualityScore: validation.qualityScore,
        isValid: validation.isValid,
        isCompleted: patternPoints.some(p => p.label === 'D'),
        detectionTime: new Date(),
        potentialReversalZoneHigh: prz.high,
        potentialReversalZoneLow: prz.low,
        entryPrice: tradeLevels.entryPrice,
        stopLoss: tradeLevels.stopLoss,
        takeProfit1: tradeLevels.takeProfit1,
        takeProfit2: tradeLevels.takeProfit2,
        takeProfit3: tradeLevels.takeProfit3,
      });
      
      // Save pattern to get ID
      const savedPattern = await this.patternRepository.save(pattern);
      
      // Save pattern points
      const pointEntities = patternPoints.map(point => {
        // Find ratio for this point if available
        let fibRatio: number | null = null;
        
        if (point.label === 'B') {
          fibRatio = validation.ratios.XAB;
        } else if (point.label === 'C') {
          fibRatio = validation.ratios.ABC;
        } else if (point.label === 'D') {
          fibRatio = validation.ratios.BCD;
        }
        
        return this.pointRepository.create({
          patternId: savedPattern.id,
          label: point.label,
          price: point.price,
          timestamp: new Date(point.timestamp),
          fibonacciRatio: fibRatio,
          isPredicted: false,
          confidenceScore: 100, // Confirmed points have 100% confidence
        });
      });
      
      await this.pointRepository.save(pointEntities);
      
      // Emit pattern detected event
      this.eventEmitter.emit('pattern.detected', {
        patternId: savedPattern.id,
        patternType: this.patternType,
        symbol,
        timeframe,
        direction,
        qualityScore: validation.qualityScore,
        detectedAt: new Date(),
      });
      
      return savedPattern;
    } catch (error) {
      this.logger.error(`Error saving pattern: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find swing highs and lows in candlestick data
   */
  protected findSwingPoints(
    candles: Candlestick[],
    lookback: number = 3
  ): {
    highs: { price: number; timestamp: number; index: number }[];
    lows: { price: number; timestamp: number; index: number }[];
  } {
    const highs = [];
    const lows = [];
    
    // Need at least 2*lookback + 1 candles to find swing points
    if (candles.length < 2 * lookback + 1) {
      return { highs, lows };
    }
    
    // Find swing highs and lows
    for (let i = lookback; i < candles.length - lookback; i++) {
      // Check for swing high
      let isHigh = true;
      for (let j = 1; j <= lookback; j++) {
        if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) {
          isHigh = false;
          break;
        }
      }
      
      if (isHigh) {
        highs.push({
          price: candles[i].high,
          timestamp: candles[i].timestamp,
          index: i,
        });
      }
      
      // Check for swing low
      let isLow = true;
      for (let j = 1; j <= lookback; j++) {
        if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) {
          isLow = false;
          break;
        }
      }
      
      if (isLow) {
        lows.push({
          price: candles[i].low,
          timestamp: candles[i].timestamp,
          index: i,
        });
      }
    }
    
    return { highs, lows };
  }
  
  /**
   * Find all patterns with specific criteria
   */
  async findPatternsByCriteria(criteria: FindOptionsWhere<HarmonicPattern>): Promise<HarmonicPattern[]> {
    return this.patternRepository.find({
      where: criteria,
      relations: ['points'],
      order: { createdAt: 'DESC' },
    });
  }
  
  /**
   * Find pattern by ID
   */
  async findPatternById(id: string): Promise<HarmonicPattern> {
    return this.patternRepository.findOne({
      where: { id },
      relations: ['points'],
    });
  }
  
  /**
   * Update pattern status
   */
  async updatePatternStatus(id: string, updates: Partial<HarmonicPattern>): Promise<HarmonicPattern> {
    await this.patternRepository.update(id, updates);
    return this.findPatternById(id);
  }
}
