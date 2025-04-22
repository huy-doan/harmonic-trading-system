// 135. src/domain/market-analysis/dtos/market-data.dto.ts
import { IsString, IsNumber, IsOptional, IsInt, Min, IsPositive, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TimeframeEnum {
  ONE_MINUTE = '1m',
  THREE_MINUTES = '3m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  THIRTY_MINUTES = '30m',
  ONE_HOUR = '1h',
  TWO_HOURS = '2h',
  FOUR_HOURS = '4h',
  ONE_DAY = '1d',
  ONE_WEEK = '1w',
  ONE_MONTH = '1M'
}

export class TrendAnalysisResultDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Timeframe used for analysis', enum: TimeframeEnum })
  @IsString()
  timeframe: string;

  @ApiProperty({ description: 'Identified trend direction', enum: ['UPTREND', 'DOWNTREND', 'SIDEWAYS'] })
  @IsString()
  trendDirection: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';

  @ApiProperty({ description: 'Trend strength (0-100)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  strength: number;

  @ApiProperty({ description: 'Key support levels', type: [Number] })
  @IsNumber({}, { each: true })
  @Type(() => Number)
  supportLevels: number[];

  @ApiProperty({ description: 'Key resistance levels', type: [Number] })
  @IsNumber({}, { each: true })
  @Type(() => Number)
  resistanceLevels: number[];
  
  @ApiProperty({ description: 'Analysis timestamp' })
  @IsNumber()
  @Type(() => Number)
  timestamp: number;
}

export class CandlestickDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Timeframe (e.g., 1m, 1h, 1d)' })
  @IsString()
  timeframe: string;

  @ApiProperty({ description: 'Kline open time in milliseconds timestamp' })
  @IsNumber()
  @Type(() => Number)
  openTime: number;

  @ApiProperty({ description: 'Kline close time in milliseconds timestamp' })
  @IsNumber()
  @Type(() => Number)
  closeTime: number;

  @ApiProperty({ description: 'Open price' })
  @IsNumber()
  @Type(() => Number)
  open: number;

  @ApiProperty({ description: 'High price' })
  @IsNumber()
  @Type(() => Number)
  high: number;

  @ApiProperty({ description: 'Low price' })
  @IsNumber()
  @Type(() => Number)
  low: number;

  @ApiProperty({ description: 'Close price' })
  @IsNumber()
  @Type(() => Number)
  close: number;

  @ApiProperty({ description: 'Volume' })
  @IsNumber()
  @Type(() => Number)
  volume: number;

  @ApiProperty({ description: 'Quote asset volume' })
  @IsNumber()
  @Type(() => Number)
  quoteAssetVolume: number;

  @ApiProperty({ description: 'Number of trades' })
  @IsInt()
  @Type(() => Number)
  numberOfTrades: number;

  @ApiProperty({ description: 'Taker buy base asset volume' })
  @IsNumber()
  @Type(() => Number)
  takerBuyBaseAssetVolume: number;

  @ApiProperty({ description: 'Taker buy quote asset volume' })
  @IsNumber()
  @Type(() => Number)
  takerBuyQuoteAssetVolume: number;
}

export class GetCandlesticksDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Timeframe (e.g., 1m, 1h, 1d)' })
  @IsString()
  timeframe: string;

  @ApiProperty({ description: 'Number of candles to return', required: false, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 100;

  @ApiProperty({ description: 'Start time in milliseconds or ISO date string', required: false })
  @IsOptional()
  startTime?: string | number;

  @ApiProperty({ description: 'End time in milliseconds or ISO date string', required: false })
  @IsOptional()
  endTime?: string | number;
}

export class GetHistoricalCandlesticksDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Timeframe (e.g., 1m, 1h, 1d)' })
  @IsString()
  timeframe: string;

  @ApiProperty({ description: 'Start time in ISO date format' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End time in ISO date format', required: false })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}

export class SymbolDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)' })
  @IsString()
  symbol: string;
}

export class MarketOrderDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Order side', enum: ['BUY', 'SELL'] })
  @IsString()
  side: 'BUY' | 'SELL';

  @ApiProperty({ description: 'Order quantity' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}

export class LimitOrderDto extends MarketOrderDto {
  @ApiProperty({ description: 'Order price' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price: number;
}

export class CancelOrderDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Order ID to cancel' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  orderId: number;
}

export class PriceDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Current price' })
  @IsNumber()
  @Type(() => Number)
  price: number;
}
