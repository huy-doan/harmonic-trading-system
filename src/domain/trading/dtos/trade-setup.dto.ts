// 117. src/domain/trading/dtos/trade-setup.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsBoolean, 
  IsOptional, 
  IsDateString,
  IsEnum,
  IsNotEmpty,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { PatternType } from '@shared/constants/pattern-type.enum';
import { TradeDirection } from '@shared/constants/trade-direction.enum';

export class CreateTradeSetupDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)', example: 'BTCUSDT' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Timeframe (e.g., 1h, 4h, 1d)', example: '1h' })
  @IsString()
  @IsNotEmpty()
  timeframe: string;

  @ApiProperty({ description: 'Pattern type', enum: PatternType, example: 'GARTLEY' })
  @IsEnum(PatternType)
  patternType: string;

  @ApiProperty({ description: 'Trade direction', enum: TradeDirection, example: 'LONG' })
  @IsEnum(TradeDirection)
  direction: string;

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

  @ApiProperty({ description: 'Take profit price level 1', example: 51000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  takeProfit1: number;

  @ApiPropertyOptional({ description: 'Take profit price level 2', example: 52000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  takeProfit2?: number;

  @ApiPropertyOptional({ description: 'Take profit price level 3', example: 53000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  takeProfit3?: number;

  @ApiProperty({ description: 'Risk/reward ratio', example: 2.5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  riskRewardRatio: number;

  @ApiPropertyOptional({ description: 'Is setup triggered', example: false })
  @IsBoolean()
  @IsOptional()
  isTriggered?: boolean;

  @ApiPropertyOptional({ description: 'Is setup active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Valid until date', example: '2023-01-05T00:00:00Z' })
  @IsDateString()
  validUntil: string;
}

export class UpdateTradeSetupDto {
  @ApiPropertyOptional({ description: 'Entry price', example: 50100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  entryPrice?: number;

  @ApiPropertyOptional({ description: 'Stop loss price', example: 49100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stopLoss?: number;

  @ApiPropertyOptional({ description: 'Take profit price level 1', example: 51100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  takeProfit1?: number;

  @ApiPropertyOptional({ description: 'Take profit price level 2', example: 52100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  takeProfit2?: number;

  @ApiPropertyOptional({ description: 'Take profit price level 3', example: 53100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  takeProfit3?: number;

  @ApiPropertyOptional({ description: 'Risk/reward ratio', example: 2.6 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  riskRewardRatio?: number;

  @ApiPropertyOptional({ description: 'Is setup triggered', example: true })
  @IsBoolean()
  @IsOptional()
  isTriggered?: boolean;

  @ApiPropertyOptional({ description: 'Is setup active', example: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Valid until date', example: '2023-01-06T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  validUntil?: string;
}

export class TradeSetupResponseDto {
  @ApiProperty({ description: 'Trade setup ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Trading symbol', example: 'BTCUSDT' })
  symbol: string;

  @ApiProperty({ description: 'Timeframe', example: '1h' })
  timeframe: string;

  @ApiProperty({ description: 'Pattern type', enum: PatternType, example: 'GARTLEY' })
  patternType: string;

  @ApiProperty({ description: 'Trade direction', enum: TradeDirection, example: 'LONG' })
  direction: string;

  @ApiProperty({ description: 'Entry price', example: 50000 })
  entryPrice: number;

  @ApiProperty({ description: 'Stop loss price', example: 49000 })
  stopLoss: number;

  @ApiProperty({ description: 'Take profit price level 1', example: 51000 })
  takeProfit1: number;

  @ApiPropertyOptional({ description: 'Take profit price level 2', example: 52000 })
  takeProfit2?: number;

  @ApiPropertyOptional({ description: 'Take profit price level 3', example: 53000 })
  takeProfit3?: number;

  @ApiProperty({ description: 'Risk/reward ratio', example: 2.5 })
  riskRewardRatio: number;

  @ApiProperty({ description: 'Is setup triggered', example: false })
  isTriggered: boolean;

  @ApiProperty({ description: 'Is setup active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Valid until date', example: '2023-01-05T00:00:00Z' })
  validUntil: Date;

  @ApiPropertyOptional({ description: 'Associated trades', type: [Object] })
  trades?: any[];

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class TradeSetupFilterDto {
  @ApiPropertyOptional({ description: 'Trading symbol', example: 'BTCUSDT' })
  @IsString()
  @IsOptional()
  symbol?: string;

  @ApiPropertyOptional({ description: 'Timeframe', example: '1h' })
  @IsString()
  @IsOptional()
  timeframe?: string;

  @ApiPropertyOptional({ description: 'Pattern type', enum: PatternType })
  @IsEnum(PatternType)
  @IsOptional()
  patternType?: string;

  @ApiPropertyOptional({ description: 'Trade direction', enum: TradeDirection })
  @IsEnum(TradeDirection)
  @IsOptional()
  direction?: string;

  @ApiPropertyOptional({ description: 'Minimum risk/reward ratio', example: 2.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minRiskRewardRatio?: number;

  @ApiPropertyOptional({ description: 'Is setup active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is setup triggered', example: false })
  @IsBoolean()
  @IsOptional()
  isTriggered?: boolean;
}
