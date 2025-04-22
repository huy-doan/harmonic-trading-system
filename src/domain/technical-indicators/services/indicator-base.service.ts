// 108. src/domain/technical-indicators/services/indicator-base.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { TechnicalIndicator } from '../entities/indicator.entity';
import { CreateIndicatorDto } from '../dtos/indicator.dto';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';
import { Candlestick } from '@shared/interfaces/market-data.interface';

@Injectable()
export abstract class IndicatorBaseService {
  protected readonly logger = new Logger(this.constructor.name);
  protected indicatorType: string;

  constructor(
    @InjectRepository(TechnicalIndicator)
    protected readonly indicatorRepository: Repository<TechnicalIndicator>,
    protected readonly marketDataService: MarketDataStreamService
  ) {}

  /**
   * Initialize the service with indicator type
   */
  protected initialize(indicatorType: string): void {
    this.indicatorType = indicatorType;
  }

  /**
   * Get market data for indicator calculation
   */
  protected async getMarketData(
    symbol: string,
    timeframe: string,
    startTime?: number | Date,
    endTime?: number | Date,
    limit: number = 300
  ): Promise<Candlestick[]> {
    try {
      // Convert Date objects to timestamps if provided
      let startTimeMs: number | undefined;
      let endTimeMs: number | undefined;
      
      if (startTime instanceof Date) {
        startTimeMs = startTime.getTime();
      } else if (startTime) {
        startTimeMs = startTime;
      }
      
      if (endTime instanceof Date) {
        endTimeMs = endTime.getTime();
      } else if (endTime) {
        endTimeMs = endTime;
      }

      // Get historical candlesticks
      if (startTimeMs && endTimeMs) {
        return this.marketDataService.getHistoricalCandlesticks(
          symbol,
          timeframe,
          new Date(startTimeMs),
          new Date(endTimeMs)
        );
      } else {
        return this.marketDataService.getCandlesticks(symbol, timeframe, limit);
      }
    } catch (error) {
      this.logger.error(`Failed to get market data for ${symbol} ${timeframe}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Save indicator data to database
   */
  protected async saveIndicator(dto: CreateIndicatorDto): Promise<TechnicalIndicator> {
    try {
      // Check if indicator already exists
      const existingIndicator = await this.indicatorRepository.findOne({
        where: {
          symbol: dto.symbol,
          timeframe: dto.timeframe,
          type: dto.type,
          timestamp: dto.timestamp
        }
      });

      if (existingIndicator) {
        // Update existing indicator
        existingIndicator.values = dto.values;
        if (dto.notes) {
          existingIndicator.notes = dto.notes;
        }
        return this.indicatorRepository.save(existingIndicator);
      }

      // Create new indicator
      const newIndicator = this.indicatorRepository.create(dto);
      return this.indicatorRepository.save(newIndicator);
    } catch (error) {
      this.logger.error(`Failed to save indicator: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Save multiple indicators at once
   */
  protected async saveBulkIndicators(dtos: CreateIndicatorDto[]): Promise<TechnicalIndicator[]> {
    try {
      const savedIndicators: TechnicalIndicator[] = [];
      
      // Process in batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < dtos.length; i += batchSize) {
        const batch = dtos.slice(i, i + batchSize);
        const entities = batch.map(dto => this.indicatorRepository.create(dto));
        const savedBatch = await this.indicatorRepository.save(entities, { chunk: batchSize });
        savedIndicators.push(...savedBatch);
      }
      
      return savedIndicators;
    } catch (error) {
      this.logger.error(`Failed to save bulk indicators: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get indicators from database
   */
  async getIndicators(
    symbol: string,
    timeframe: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<TechnicalIndicator[]> {
    try {
      const query: any = {
        symbol,
        timeframe,
        type: this.indicatorType
      };

      // Add time range filters if provided
      if (startTime && endTime) {
        query.timestamp = Between(startTime, endTime);
      } else if (startTime) {
        query.timestamp = MoreThanOrEqual(startTime);
      } else if (endTime) {
        query.timestamp = LessThanOrEqual(endTime);
      }

      return this.indicatorRepository.find({
        where: query,
        order: { timestamp: 'DESC' },
        take: limit
      });
    } catch (error) {
      this.logger.error(`Failed to get indicators for ${symbol} ${timeframe}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate SMA (Simple Moving Average)
   */
  protected calculateSMA(values: number[], period: number): number[] {
    const result: number[] = [];
    
    // Need at least 'period' data points to calculate SMA
    if (values.length < period) {
      return result;
    }
    
    // Calculate sum for the first window
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += values[i];
    }
    
    // Calculate SMA for the first window
    result.push(sum / period);
    
    // Calculate remaining SMAs using sliding window approach
    for (let i = period; i < values.length; i++) {
      sum = sum - values[i - period] + values[i];
      result.push(sum / period);
    }
    
    return result;
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  protected calculateEMA(values: number[], period: number): number[] {
    const result: number[] = [];
    
    // Need at least 'period' data points to calculate EMA
    if (values.length < period) {
      return result;
    }
    
    // Calculate SMA for the first period as a starting point for EMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += values[i];
    }
    
    // First EMA is the same as SMA
    const smoothingFactor = 2 / (period + 1);
    let ema = sum / period;
    result.push(ema);
    
    // Calculate remaining EMAs
    for (let i = period; i < values.length; i++) {
      ema = (values[i] - ema) * smoothingFactor + ema;
      result.push(ema);
    }
    
    return result;
  }

  /**
   * Calculate highest value in a period
   */
  protected calculateHighest(values: number[], period: number): number[] {
    const result: number[] = [];
    
    // Need at least 'period' data points
    if (values.length < period) {
      return result;
    }
    
    // Calculate for each window
    for (let i = period - 1; i < values.length; i++) {
      let highest = values[i];
      for (let j = i - period + 1; j < i; j++) {
        if (values[j] > highest) {
          highest = values[j];
        }
      }
      result.push(highest);
    }
    
    return result;
  }

  /**
   * Calculate lowest value in a period
   */
  protected calculateLowest(values: number[], period: number): number[] {
    const result: number[] = [];
    
    // Need at least 'period' data points
    if (values.length < period) {
      return result;
    }
    
    // Calculate for each window
    for (let i = period - 1; i < values.length; i++) {
      let lowest = values[i];
      for (let j = i - period + 1; j < i; j++) {
        if (values[j] < lowest) {
          lowest = values[j];
        }
      }
      result.push(lowest);
    }
    
    return result;
  }

  /**
   * Extract close prices from candlesticks
   */
  protected extractClosePrices(candles: Candlestick[]): number[] {
    return candles.map(candle => candle.close);
  }

  /**
   * Extract high prices from candlesticks
   */
  protected extractHighPrices(candles: Candlestick[]): number[] {
    return candles.map(candle => candle.high);
  }

  /**
   * Extract low prices from candlesticks
   */
  protected extractLowPrices(candles: Candlestick[]): number[] {
    return candles.map(candle => candle.low);
  }

  /**
   * Extract timestamps from candlesticks
   */
  protected extractTimestamps(candles: Candlestick[]): number[] {
    return candles.map(candle => candle.openTime);
  }
}
