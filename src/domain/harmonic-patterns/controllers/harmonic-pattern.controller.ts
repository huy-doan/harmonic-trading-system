// 103. src/domain/harmonic-patterns/controllers/harmonic-pattern.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GartleyPatternService } from '../services/gartley-pattern.service';
import { ButterflyPatternService } from '../services/butterfly-pattern.service';
import { BatPatternService } from '../services/bat-pattern.service';
import { CrabPatternService } from '../services/crab-pattern.service';
import { CypherPatternService } from '../services/cypher-pattern.service';
import { PointPredictorService } from '../services/point-predictor.service';
import { CreatePatternDto, UpdatePatternDto, FindPatternsDto, PatternResponseDto } from '../dtos/pattern.dto';
import { CreatePatternPointDto, UpdatePatternPointDto, PatternPointResponseDto } from '../dtos/pattern-point.dto';
import { HarmonicPattern } from '../entities/harmonic-pattern.entity';
import { PatternPoint } from '../entities/pattern-point.entity';

@ApiTags('Harmonic Patterns')
@Controller('harmonic-patterns')
export class HarmonicPatternController {
  constructor(
    private readonly gartleyService: GartleyPatternService,
    private readonly butterflyService: ButterflyPatternService,
    private readonly batService: BatPatternService,
    private readonly crabService: CrabPatternService,
    private readonly cypherService: CypherPatternService,
    private readonly pointPredictorService: PointPredictorService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find patterns with filters' })
  @ApiQuery({ name: 'symbol', required: false, description: 'Trading symbol (e.g., BTCUSDT)' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Timeframe (e.g., 1h, 4h, 1d)' })
  @ApiQuery({ name: 'patternType', required: false, description: 'Type of pattern (e.g., GARTLEY, BUTTERFLY)' })
  @ApiQuery({ name: 'minQuality', required: false, description: 'Minimum quality score (0-100)' })
  @ApiResponse({ status: 200, description: 'Returns list of matching patterns', type: [PatternResponseDto] })
  async findPatterns(@Query() filters: FindPatternsDto): Promise<HarmonicPattern[]> {
    // Xử lý các bộ lọc
    const criteria: any = {};
    
    if (filters.symbol) {
      criteria.symbol = filters.symbol;
    }
    
    if (filters.timeframe) {
      criteria.timeframe = filters.timeframe;
    }
    
    if (filters.patternType) {
      criteria.patternType = filters.patternType;
    }
    
    if (filters.direction) {
      criteria.direction = filters.direction;
    }
    
    if (filters.isValid !== undefined) {
      criteria.isValid = filters.isValid;
    }
    
    if (filters.isCompleted !== undefined) {
      criteria.isCompleted = filters.isCompleted;
    }
    
    if (filters.minQualityScore !== undefined) {
      criteria.qualityScore = { $gte: filters.minQualityScore };
    }
    
    // Chọn dịch vụ phù hợp theo loại mẫu hình
    if (filters.patternType) {
      switch (filters.patternType) {
        case 'GARTLEY':
          return this.gartleyService.findPatternsByCriteria(criteria);
        case 'BUTTERFLY':
          return this.butterflyService.findPatternsByCriteria(criteria);
        case 'BAT':
          return this.batService.findPatternsByCriteria(criteria);
        case 'CRAB':
          return this.crabService.findPatternsByCriteria(criteria);
        case 'CYPHER':
          return this.cypherService.findPatternsByCriteria(criteria);
      }
    }
    
    // Nếu không chỉ định loại mẫu hình, gộp kết quả từ tất cả các dịch vụ
    const [gartleyPatterns, butterflyPatterns, batPatterns, crabPatterns, cypherPatterns] = await Promise.all([
      this.gartleyService.findPatternsByCriteria(criteria),
      this.butterflyService.findPatternsByCriteria(criteria),
      this.batService.findPatternsByCriteria(criteria),
      this.crabService.findPatternsByCriteria(criteria),
      this.cypherService.findPatternsByCriteria(criteria)
    ]);
    
    return [
      ...gartleyPatterns,
      ...butterflyPatterns,
      ...batPatterns,
      ...crabPatterns,
      ...cypherPatterns
    ];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pattern by ID' })
  @ApiParam({ name: 'id', description: 'Pattern ID' })
  @ApiResponse({ status: 200, description: 'Returns specific pattern', type: PatternResponseDto })
  async getPatternById(@Param('id') id: string): Promise<HarmonicPattern> {
    // Lấy mẫu hình theo ID
    const pattern = await this.gartleyService.findPatternById(id);
    
    if (!pattern) {
      // Nếu không tìm thấy ở dịch vụ đầu tiên, thử các dịch vụ khác
      return (
        await this.butterflyService.findPatternById(id) ||
        await this.batService.findPatternById(id) ||
        await this.crabService.findPatternById(id) ||
        await this.cypherService.findPatternById(id)
      );
    }
    
    return pattern;
  }

  @Post(':id/predict-d-point')
  @ApiOperation({ summary: 'Predict D point for a pattern' })
  @ApiParam({ name: 'id', description: 'Pattern ID' })
  @ApiResponse({ status: 200, description: 'Returns predicted D point', type: PatternPointResponseDto })
  async predictDPoint(@Param('id') id: string): Promise<PatternPoint> {
    return this.pointPredictorService.predictDPoint(id);
  }

  @Put(':id/confirm-prediction/:pointId')
  @ApiOperation({ summary: 'Confirm a predicted point' })
  @ApiParam({ name: 'id', description: 'Pattern ID' })
  @ApiParam({ name: 'pointId', description: 'Point ID to confirm' })
  @ApiQuery({ name: 'actualPrice', required: false, description: 'Actual price (if different from prediction)' })
  @ApiResponse({ status: 200, description: 'Returns confirmed point', type: PatternPointResponseDto })
  async confirmPrediction(
    @Param('id') id: string,
    @Param('pointId') pointId: string,
    @Query('actualPrice') actualPrice?: number
  ): Promise<PatternPoint> {
    return this.pointPredictorService.confirmPrediction(pointId, actualPrice);
  }

  @Put(':id/update-status')
  @ApiOperation({ summary: 'Update pattern status' })
  @ApiParam({ name: 'id', description: 'Pattern ID' })
  @ApiBody({ type: UpdatePatternDto })
  @ApiResponse({ status: 200, description: 'Returns updated pattern', type: PatternResponseDto })
  async updatePatternStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdatePatternDto
  ): Promise<HarmonicPattern> {
    // Xác định loại mẫu hình và sử dụng dịch vụ tương ứng
    const pattern = await this.getPatternById(id);
    if (!pattern) {
      throw new Error(`Pattern with ID ${id} not found`);
    }
    
    switch (pattern.patternType) {
      case 'GARTLEY':
        return this.gartleyService.updatePatternStatus(id, updateDto);
      case 'BUTTERFLY':
        return this.butterflyService.updatePatternStatus(id, updateDto);
      case 'BAT':
        return this.batService.updatePatternStatus(id, updateDto);
      case 'CRAB':
        return this.crabService.updatePatternStatus(id, updateDto);
      case 'CYPHER':
        return this.cypherService.updatePatternStatus(id, updateDto);
      default:
        throw new Error(`Unknown pattern type: ${pattern.patternType}`);
    }
  }

  @Get(':id/points')
  @ApiOperation({ summary: 'Get all points for a pattern' })
  @ApiParam({ name: 'id', description: 'Pattern ID' })
  @ApiResponse({ status: 200, description: 'Returns pattern points', type: [PatternPointResponseDto] })
  async getPatternPoints(@Param('id') id: string): Promise<PatternPoint[]> {
    const pattern = await this.getPatternById(id);
    if (!pattern) {
      throw new Error(`Pattern with ID ${id} not found`);
    }
    
    return pattern.points;
  }

  @Post(':id/points')
  @ApiOperation({ summary: 'Add a new point to a pattern' })
  @ApiParam({ name: 'id', description: 'Pattern ID' })
  @ApiBody({ type: CreatePatternPointDto })
  @ApiResponse({ status: 201, description: 'Returns created point', type: PatternPointResponseDto })
  async addPatternPoint(
    @Param('id') id: string,
    @Body(ValidationPipe) pointDto: CreatePatternPointDto
  ): Promise<PatternPoint> {
    // Tạo điểm mới cho mẫu hình
    // Sử dụng đại diện Gartley service để tạo điểm, 
    // vì chức năng này tương tự ở tất cả các service
    return await this.gartleyService['pointRepository'].save({
      ...pointDto,
      patternId: id
    });
  }

  @Put(':id/points/:pointId')
  @ApiOperation({ summary: 'Update a pattern point' })
  @ApiParam({ name: 'id', description: 'Pattern ID' })
  @ApiParam({ name: 'pointId', description: 'Point ID' })
  @ApiBody({ type: UpdatePatternPointDto })
  @ApiResponse({ status: 200, description: 'Returns updated point', type: PatternPointResponseDto })
  async updatePatternPoint(
    @Param('id') id: string,
    @Param('pointId') pointId: string,
    @Body(ValidationPipe) updateDto: UpdatePatternPointDto
  ): Promise<PatternPoint> {
    // Cập nhật thông tin điểm
    await this.gartleyService['pointRepository'].update(pointId, updateDto);
    
    return this.gartleyService['pointRepository'].findOne({
      where: { id: pointId }
    });
  }

  @Delete(':id/points/:pointId')
  @ApiOperation({ summary: 'Delete a pattern point' })
  @ApiParam({ name: 'id', description: 'Pattern ID' })
  @ApiParam({ name: 'pointId', description: 'Point ID' })
  @ApiResponse({ status: 200, description: 'Returns success message' })
  async deletePatternPoint(
    @Param('id') id: string,
    @Param('pointId') pointId: string
  ): Promise<{ success: boolean; message: string }> {
    await this.gartleyService['pointRepository'].delete(pointId);
    
    return {
      success: true,
      message: `Point ${pointId} deleted successfully`
    };
  }
}
