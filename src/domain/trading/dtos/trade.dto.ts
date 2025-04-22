// 116. src/domain/trading/dtos/trade.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsBoolean, 
  IsOptional, 
  IsUUID, 
  IsDate,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';
import { TradeDirection } from '@shared/constants/trade-direction.enum';

export class CreateTradeDto {
  @ApiProperty({ description: 'Trading symbol (e.g., BTCUSDT)', example: 'BTCUSDT' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiPropertyOptional({ description: 'External order ID', example: '123456789' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Trade direction', enum: TradeDirection, example: 'LONG' })
  @IsEnum(TradeDirection)
  direction: string;

  @ApiProperty({ description: 'Entry price', example: 50000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  entryPrice: number;

  @ApiProperty({ description: 'Trade quantity', example: 0.01 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'Stop loss price', example: 49000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stopLoss: number;

  @ApiProperty({ description: 'Take profit price', example: 52000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  takeProfit: number;

  @ApiPropertyOptional({ description: 'Is trade simulated', example: true })
  @IsBoolean()
  @IsOptional()
  isSimulated?: boolean;

  @ApiPropertyOptional({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Pattern ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  patternId?: string;

  @ApiPropertyOptional({ description: 'Trade setup ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  tradeSetupId?: string;
}

export class UpdateTradeDto {
  @ApiPropertyOptional({ description: 'Trade status', example: 'CLOSED' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Exit price', example: 51000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  exitPrice?: number;

  @ApiPropertyOptional({ description: 'Exit time', example: '2023-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  exitTime?: string;

  @ApiPropertyOptional({ description: 'Profit/loss amount', example: 100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  profitLoss?: number;

  @ApiPropertyOptional({ description: 'Profit/loss percentage', example: 2.5 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  profitLossPercent?: number;
}

export class TradeResponseDto {
  @ApiProperty({ description: 'Trade ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Trading symbol', example: 'BTCUSDT' })
  symbol: string;

  @ApiPropertyOptional({ description: 'External order ID', example: '123456789' })
  orderId?: string;

  @ApiProperty({ description: 'Trade direction', enum: TradeDirection, example: 'LONG' })
  direction: string;

  @ApiProperty({ description: 'Entry price', example: 50000 })
  entryPrice: number;

  @ApiProperty({ description: 'Trade quantity', example: 0.01 })
  quantity: number;

  @ApiProperty({ description: 'Stop loss price', example: 49000 })
  stopLoss: number;

  @ApiProperty({ description: 'Take profit price', example: 52000 })
  takeProfit: number;

  @ApiProperty({ description: 'Trade status', example: 'OPEN' })
  status: string;

  @ApiPropertyOptional({ description: 'Exit price', example: 51000 })
  exitPrice?: number;

  @ApiPropertyOptional({ description: 'Entry time', example: '2023-01-01T00:00:00Z' })
  entryTime?: Date;

  @ApiPropertyOptional({ description: 'Exit time', example: '2023-01-02T00:00:00Z' })
  exitTime?: Date;

  @ApiPropertyOptional({ description: 'Profit/loss amount', example: 100 })
  profitLoss?: number;

  @ApiPropertyOptional({ description: 'Profit/loss percentage', example: 2.5 })
  profitLossPercent?: number;

  @ApiProperty({ description: 'Is trade simulated', example: true })
  isSimulated: boolean;

  @ApiPropertyOptional({ description: 'Pattern details', type: 'object', additionalProperties: true })
  pattern?: any;

  @ApiPropertyOptional({ description: 'Trade setup details', type: 'object', additionalProperties: true })
  tradeSetup?: any;

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class TradeStatsDto {
  @ApiProperty({ description: 'Total trades', example: 50 })
  totalTrades: number;

  @ApiProperty({ description: 'Winning trades', example: 30 })
  winningTrades: number;

  @ApiProperty({ description: 'Losing trades', example: 20 })
  losingTrades: number;

  @ApiProperty({ description: 'Win rate (%)', example: 60 })
  winRate: number;

  @ApiProperty({ description: 'Average profit (%)', example: 2.5 })
  averageProfit: number;

  @ApiProperty({ description: 'Average loss (%)', example: -1.5 })
  averageLoss: number;

  @ApiProperty({ description: 'Total profit/loss', example: 2500 })
  totalProfitLoss: number;

  @ApiProperty({ description: 'Profit factor', example: 1.8 })
  profitFactor: number;
}
