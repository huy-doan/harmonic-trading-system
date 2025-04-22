// 107. src/domain/technical-indicators/dtos/ichimoku.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsObject, 
  IsOptional, 
  IsNotEmpty,
  IsInt,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';

export class IchimokuValuesDto {
  @ApiProperty({ description: 'Tenkan-sen (Conversion Line) value', example: 48250.5 })
  @IsNumber()
  tenkanSen: number;

  @ApiProperty({ description: 'Kijun-sen (Base Line) value', example: 47500.25 })
  @IsNumber()
  kijunSen: number;

  @ApiProperty({ description: 'Senkou Span A (Leading Span A) value', example: 47875.375 })
  @IsNumber()
  senkouSpanA: number;

  @ApiProperty({ description: 'Senkou Span B (Leading Span B) value', example: 46500.75 })
  @IsNumber()
  senkouSpanB: number;

  @ApiProperty({ description: 'Chikou Span (Lagging Span) value', example: 49200.0 })
  @IsNumber()
  chikouSpan: number;
}

export class IchimokuParametersDto {
  @ApiPropertyOptional({ description: 'Tenkan-sen period', example: 9 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  tenkanPeriod?: number = 9;

  @ApiPropertyOptional({ description: 'Kijun-sen period', example: 26 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  kijunPeriod?: number = 26;

  @ApiPropertyOptional({ description: 'Senkou Span B period', example: 52 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  senkouSpanBPeriod?: number = 52;

  @ApiPropertyOptional({ description: 'Displacement period', example: 26 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  displacement?: number = 26;
}

export class CalculateIchimokuDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)', example: 'BTCUSDT' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Timeframe (e.g., 1h, 4h, 1d)', example: '1h' })
  @IsString()
  @IsNotEmpty()
  timeframe: string;

  @ApiPropertyOptional({ description: 'Start timestamp in milliseconds', example: 1610000000000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  startTime?: number;

  @ApiPropertyOptional({ description: 'End timestamp in milliseconds', example: 1610100000000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  endTime?: number;

  @ApiPropertyOptional({ description: 'Maximum number of results', example: 100 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 100;

  @ApiPropertyOptional({ description: 'Ichimoku parameters', type: IchimokuParametersDto })
  @IsObject()
  @IsOptional()
  parameters?: IchimokuParametersDto;
}

export class IchimokuResultDto {
  @ApiProperty({ description: 'Timestamp in milliseconds', example: 1610000000000 })
  timestamp: number;

  @ApiProperty({ description: 'Ichimoku values', type: IchimokuValuesDto })
  values: IchimokuValuesDto;

  @ApiPropertyOptional({ description: 'Signal interpretation', example: 'BULLISH' })
  signal?: string;

  @ApiPropertyOptional({ description: 'Trend strength (0-100)', example: 85 })
  strength?: number;
}
