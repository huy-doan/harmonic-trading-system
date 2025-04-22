// 106. src/domain/technical-indicators/dtos/indicator.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsObject, 
  IsOptional, 
  IsDateString, 
  IsNotEmpty,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIndicatorDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)', example: 'BTCUSDT' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Timeframe (e.g., 1h, 4h, 1d)', example: '1h' })
  @IsString()
  @IsNotEmpty()
  timeframe: string;

  @ApiProperty({ description: 'Indicator type (e.g., ICHIMOKU, RSI, MACD)', example: 'RSI' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Timestamp in milliseconds', example: 1610000000000 })
  @IsNumber()
  timestamp: number;

  @ApiProperty({ description: 'Indicator values in JSON format', type: 'object', additionalProperties: true })
  @IsObject()
  values: any;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Strong overbought signal' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateIndicatorDto {
  @ApiPropertyOptional({ description: 'Indicator values in JSON format', type: 'object', additionalProperties: true })
  @IsObject()
  @IsOptional()
  values?: any;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Updated interpretation' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class IndicatorResponseDto {
  @ApiProperty({ description: 'Indicator ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Trading symbol', example: 'BTCUSDT' })
  symbol: string;

  @ApiProperty({ description: 'Timeframe', example: '1h' })
  timeframe: string;

  @ApiProperty({ description: 'Indicator type', example: 'RSI' })
  type: string;

  @ApiProperty({ description: 'Timestamp in milliseconds', example: 1610000000000 })
  timestamp: number;

  @ApiProperty({ description: 'Indicator values', type: 'object', additionalProperties: true })
  values: any;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Strong overbought signal' })
  notes?: string;

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class GetIndicatorQueryDto {
  @ApiPropertyOptional({ description: 'Trading symbol (e.g., BTCUSDT)', example: 'BTCUSDT' })
  @IsString()
  @IsOptional()
  symbol?: string;

  @ApiPropertyOptional({ description: 'Timeframe (e.g., 1h, 4h, 1d)', example: '1h' })
  @IsString()
  @IsOptional()
  timeframe?: string;

  @ApiPropertyOptional({ description: 'Indicator type (e.g., ICHIMOKU, RSI, MACD)', example: 'RSI' })
  @IsString()
  @IsOptional()
  type?: string;

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
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
