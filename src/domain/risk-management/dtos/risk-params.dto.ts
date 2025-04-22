// 124. src/domain/risk-management/dtos/risk-params.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNumber, 
  IsOptional, 
  IsBoolean,
  IsUUID,
  IsNotEmpty,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRiskProfileDto {
  @ApiProperty({ description: 'Risk percentage per trade (0-100)', example: 1.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  riskPerTrade: number;

  @ApiProperty({ description: 'Maximum daily risk percentage (0-100)', example: 5.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  maxDailyRisk: number;

  @ApiProperty({ description: 'Maximum weekly risk percentage (0-100)', example: 10.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  maxWeeklyRisk: number;

  @ApiProperty({ description: 'Maximum monthly risk percentage (0-100)', example: 20.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  maxMonthlyRisk: number;

  @ApiProperty({ description: 'Maximum number of concurrent trades', example: 5 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxConcurrentTrades: number;

  @ApiPropertyOptional({ description: 'Use trailing stop', example: true })
  @IsBoolean()
  @IsOptional()
  useTrailingStop?: boolean;

  @ApiPropertyOptional({ description: 'Trailing stop percentage (0-100)', example: 10.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  trailingStopPercentage?: number;

  @ApiPropertyOptional({ description: 'Maximum position size as percentage of account (0-100)', example: 25.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  maxPositionSize?: number;

  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}

export class UpdateRiskProfileDto {
  @ApiPropertyOptional({ description: 'Risk percentage per trade (0-100)', example: 1.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  riskPerTrade?: number;

  @ApiPropertyOptional({ description: 'Maximum daily risk percentage (0-100)', example: 6.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  maxDailyRisk?: number;

  @ApiPropertyOptional({ description: 'Maximum weekly risk percentage (0-100)', example: 12.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  maxWeeklyRisk?: number;

  @ApiPropertyOptional({ description: 'Maximum monthly risk percentage (0-100)', example: 25.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  maxMonthlyRisk?: number;

  @ApiPropertyOptional({ description: 'Maximum number of concurrent trades', example: 6 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  maxConcurrentTrades?: number;

  @ApiPropertyOptional({ description: 'Use trailing stop', example: false })
  @IsBoolean()
  @IsOptional()
  useTrailingStop?: boolean;

  @ApiPropertyOptional({ description: 'Trailing stop percentage (0-100)', example: 15.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  trailingStopPercentage?: number;

  @ApiPropertyOptional({ description: 'Maximum position size as percentage of account (0-100)', example: 20.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  maxPositionSize?: number;
}

export class RiskProfileResponseDto {
  @ApiProperty({ description: 'Risk profile ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Risk percentage per trade', example: 1.0 })
  riskPerTrade: number;

  @ApiProperty({ description: 'Maximum daily risk percentage', example: 5.0 })
  maxDailyRisk: number;

  @ApiProperty({ description: 'Maximum weekly risk percentage', example: 10.0 })
  maxWeeklyRisk: number;

  @ApiProperty({ description: 'Maximum monthly risk percentage', example: 20.0 })
  maxMonthlyRisk: number;

  @ApiProperty({ description: 'Maximum number of concurrent trades', example: 5 })
  maxConcurrentTrades: number;

  @ApiProperty({ description: 'Use trailing stop', example: true })
  useTrailingStop: boolean;

  @ApiProperty({ description: 'Trailing stop percentage', example: 10.0 })
  trailingStopPercentage: number;

  @ApiProperty({ description: 'Maximum position size as percentage of account', example: 25.0 })
  maxPositionSize: number;

  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class RiskParametersDto {
  @ApiProperty({ description: 'Account balance', example: 10000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  accountBalance: number;

  @ApiProperty({ description: 'Entry price', example: 50000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  entryPrice: number;

  @ApiProperty({ description: 'Stop loss price', example: 49000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stopLoss: number;

  @ApiPropertyOptional({ description: 'Custom risk percentage (overrides profile)', example: 1.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  customRiskPercentage?: number;

  @ApiPropertyOptional({ description: 'Maximum position value', example: 2500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPositionValue?: number;
}
