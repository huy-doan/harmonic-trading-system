// 094. src/domain/harmonic-patterns/dtos/pattern-point.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID, IsDate, IsDateString, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatternPointDto {
  @ApiProperty({ description: 'Point label (X, A, B, C, D)', example: 'X' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Price at the point', example: 50000 })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({ description: 'Timestamp of the point', example: '2023-01-01T00:00:00Z' })
  @IsDateString()
  timestamp: string;

  @ApiPropertyOptional({ description: 'Fibonacci ratio for the leg', example: 0.618 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  fibonacciRatio?: number;

  @ApiPropertyOptional({ description: 'Is this point predicted (not yet confirmed)', example: false })
  @IsBoolean()
  @IsOptional()
  isPredicted?: boolean;

  @ApiPropertyOptional({ description: 'Confidence score for prediction (0-100)', example: 85 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  confidenceScore?: number;

  @ApiProperty({ description: 'ID of the pattern this point belongs to', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  patternId: string;
}

export class UpdatePatternPointDto {
  @ApiPropertyOptional({ description: 'Price at the point', example: 50100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ description: 'Timestamp of the point', example: '2023-01-01T00:10:00Z' })
  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @ApiPropertyOptional({ description: 'Fibonacci ratio for the leg', example: 0.625 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  fibonacciRatio?: number;

  @ApiPropertyOptional({ description: 'Is this point predicted (not yet confirmed)', example: false })
  @IsBoolean()
  @IsOptional()
  isPredicted?: boolean;

  @ApiPropertyOptional({ description: 'Confidence score for prediction (0-100)', example: 90 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  confidenceScore?: number;
}

export class PatternPointResponseDto {
  @ApiProperty({ description: 'Point ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ description: 'Point label (X, A, B, C, D)', example: 'X' })
  label: string;

  @ApiProperty({ description: 'Price at the point', example: 50000 })
  price: number;

  @ApiProperty({ description: 'Timestamp of the point', example: '2023-01-01T00:00:00Z' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Fibonacci ratio for the leg', example: 0.618 })
  fibonacciRatio?: number;

  @ApiProperty({ description: 'Is this point predicted (not yet confirmed)', example: false })
  isPredicted: boolean;

  @ApiPropertyOptional({ description: 'Confidence score for prediction (0-100)', example: 85 })
  confidenceScore?: number;

  @ApiProperty({ description: 'ID of the pattern this point belongs to', example: '123e4567-e89b-12d3-a456-426614174000' })
  patternId: string;

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;
}
