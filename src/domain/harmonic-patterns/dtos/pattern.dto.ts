// 093. src/domain/harmonic-patterns/dtos/pattern.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID, IsDate, IsDateString, IsEnum, IsNotEmpty, Min, Max, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatternType } from '@shared/constants/pattern-type.enum';
import { TradeDirection } from '@shared/constants/trade-direction.enum';

export class CreatePatternDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)', example: 'BTCUSDT' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Timeframe (e.g., 1h, 4h, 1d)', example: '1h' })
  @IsString()
  @IsNotEmpty()
  timeframe: string;

  @ApiProperty({ description: 'Type of harmonic pattern', enum: PatternType, example: 'GARTLEY' })
  @IsEnum(PatternType)
  patternType: string;

  @ApiProperty({ description: 'Pattern direction', enum: TradeDirection, example: 'BULLISH' })
  @IsEnum(TradeDirection)
  direction: string;

  @ApiProperty({ description: 'Pattern quality score (0-100)', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  qualityScore: number;

  @ApiPropertyOptional({ description: 'Is pattern completed', example: false })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Is pattern valid', example: true })
  @IsBoolean()
  @IsOptional()
  isValid?: boolean;

  @ApiPropertyOptional({ description: 'Pattern detection time', example: '2023-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  detectionTime?: string;

  @ApiPropertyOptional({ description: 'Pattern completion price', example: 50000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  completionPrice?: number;

  @ApiPropertyOptional({ description: 'Upper bound of potential reversal zone', example: 50500 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  potentialReversalZoneHigh?: number;

  @ApiPropertyOptional({ description: 'Lower bound of potential reversal zone', example: 49500 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  potentialReversalZoneLow?: number;

  @ApiPropertyOptional({ description: 'Recommended entry price', example: 50000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  entryPrice?: number;

  @ApiPropertyOptional({ description: 'Recommended stop loss price', example: 49000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  stopLoss?: number;

  @ApiPropertyOptional({ description: 'First take profit level', example: 51000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  takeProfit1?: number;

  @ApiPropertyOptional({ description: 'Second take profit level', example: 52000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  takeProfit2?: number;

  @ApiPropertyOptional({ description: 'Third take profit level', example: 53000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  takeProfit3?: number;

  @ApiPropertyOptional({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class UpdatePatternDto {
  @ApiPropertyOptional({ description: 'Pattern quality score (0-100)', example: 90 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  qualityScore?: number;

  @ApiPropertyOptional({ description: 'Is pattern completed', example: true })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Is pattern valid', example: false })
  @IsBoolean()
  @IsOptional()
  isValid?: boolean;

  @ApiPropertyOptional({ description: 'Pattern completion time', example: '2023-01-01T01:00:00Z' })
  @IsDateString()
  @IsOptional()
  completionTime?: string;

  @ApiPropertyOptional({ description: 'Pattern invalidation time', example: '2023-01-01T01:00:00Z' })
  @IsDateString()
  @IsOptional()
  invalidationTime?: string;

  @ApiPropertyOptional({ description: 'Pattern completion price', example: 50100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  completionPrice?: number;

  @ApiPropertyOptional({ description: 'Recommended entry price', example: 50100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  entryPrice?: number;

  @ApiPropertyOptional({ description: 'Recommended stop loss price', example: 49100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  stopLoss?: number;

  @ApiPropertyOptional({ description: 'First take profit level', example: 51100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  takeProfit1?: number;

  @ApiPropertyOptional({ description: 'Second take profit level', example: 52100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  takeProfit2?: number;

  @ApiPropertyOptional({ description: 'Third take profit level', example: 53100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  takeProfit3?: number;
}

export class PatternResponseDto {
  @ApiProperty({ description: 'Pattern ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Trading symbol', example: 'BTCUSDT' })
  symbol: string;

  @ApiProperty({ description: 'Timeframe', example: '1h' })
  timeframe: string;

  @ApiProperty({ description: 'Type of harmonic pattern', enum: PatternType, example: 'GARTLEY' })
  patternType: string;

  @ApiProperty({ description: 'Pattern direction', enum: TradeDirection, example: 'BULLISH' })
  direction: string;

  @ApiProperty({ description: 'Pattern quality score (0-100)', example: 85 })
  qualityScore: number;

  @ApiProperty({ description: 'Is pattern valid', example: true })
  isValid: boolean;

  @ApiProperty({ description: 'Is pattern completed', example: false })
  isCompleted: boolean;

  @ApiProperty({ description: 'Pattern detection time', example: '2023-01-01T00:00:00Z' })
  detectionTime: Date;

  @ApiPropertyOptional({ description: 'Pattern completion time', example: '2023-01-01T01:00:00Z' })
  completionTime?: Date;

  @ApiPropertyOptional({ description: 'Pattern invalidation time', example: null })
  invalidationTime?: Date;

  @ApiPropertyOptional({ description: 'Pattern completion price', example: 50000 })
  completionPrice?: number;

  @ApiPropertyOptional({ description: 'Upper bound of potential reversal zone', example: 50500 })
  potentialReversalZoneHigh?: number;

  @ApiPropertyOptional({ description: 'Lower bound of potential reversal zone', example: 49500 })
  potentialReversalZoneLow?: number;

  @ApiPropertyOptional({ description: 'Recommended entry price', example: 50000 })
  entryPrice?: number;

  @ApiPropertyOptional({ description: 'Recommended stop loss price', example: 49000 })
  stopLoss?: number;

  @ApiPropertyOptional({ description: 'First take profit level', example: 51000 })
  takeProfit1?: number;

  @ApiPropertyOptional({ description: 'Second take profit level', example: 52000 })
  takeProfit2?: number;

  @ApiPropertyOptional({ description: 'Third take profit level', example: 53000 })
  takeProfit3?: number;

  @ApiProperty({ description: 'Pattern points', type: [Object] })
  points: any[];

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class FindPatternsDto {
  @ApiPropertyOptional({ description: 'Trading symbol (e.g., BTCUSDT)', example: 'BTCUSDT' })
  @IsString()
  @IsOptional()
  symbol?: string;

  @ApiPropertyOptional({ description: 'Timeframe (e.g., 1h, 4h, 1d)', example: '1h' })
  @IsString()
  @IsOptional()
  timeframe?: string;

  @ApiPropertyOptional({ description: 'Type of harmonic pattern', enum: PatternType, example: 'GARTLEY' })
  @IsEnum(PatternType)
  @IsOptional()
  patternType?: string;

  @ApiPropertyOptional({ description: 'Pattern direction', enum: TradeDirection, example: 'BULLISH' })
  @IsEnum(TradeDirection)
  @IsOptional()
  direction?: string;

  @ApiPropertyOptional({ description: 'Minimum quality score (0-100)', example: 70 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minQualityScore?: number;

  @ApiPropertyOptional({ description: 'Only valid patterns', example: true })
  @IsBoolean()
  @IsOptional()
  isValid?: boolean;

  @ApiPropertyOptional({ description: 'Only completed patterns', example: false })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Start time for detection period', example: '2023-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time for detection period', example: '2023-01-10T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Limit number of results', example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Result page', example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number;
}
