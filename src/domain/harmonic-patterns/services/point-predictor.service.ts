// 102. src/domain/harmonic-patterns/services/point-predictor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HarmonicPattern } from '../entities/harmonic-pattern.entity';
import { PatternPoint } from '../entities/pattern-point.entity';
import { HARMONIC_RATIOS, FibonacciRatio } from '../interfaces/pattern-ratio.interface';

@Injectable()
export class PointPredictorService {
  private readonly logger = new Logger(PointPredictorService.name);

  constructor(
    @InjectRepository(HarmonicPattern)
    private readonly patternRepository: Repository<HarmonicPattern>,
    @InjectRepository(PatternPoint)
    private readonly pointRepository: Repository<PatternPoint>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Dự đoán điểm D cho mô hình Harmonic dựa trên các điểm X, A, B, C
   */
  async predictDPoint(patternId: string): Promise<PatternPoint | null> {
    try {
      // Lấy thông tin mô hình
      const pattern = await this.patternRepository.findOne({
        where: { id: patternId },
        relations: ['points'],
      });

      if (!pattern || !pattern.points || pattern.points.length < 3) {
        this.logger.warn(`Cannot predict D point for pattern ${patternId}: Insufficient points`);
        return null;
      }

      // Kiểm tra xem đã có điểm D chưa
      const hasPointD = pattern.points.some(point => point.label === 'D' && !point.isPredicted);
      if (hasPointD) {
        this.logger.debug(`Pattern ${patternId} already has a confirmed D point`);
        return pattern.points.find(point => point.label === 'D' && !point.isPredicted);
      }

      // Loại bỏ các điểm dự đoán cũ
      const existingDPoint = pattern.points.find(point => point.label === 'D' && point.isPredicted);
      if (existingDPoint) {
        await this.pointRepository.remove(existingDPoint);
      }

      // Lấy các điểm hiện có (X, A, B, C)
      const sortedPoints = pattern.points
        .filter(point => ['X', 'A', 'B', 'C'].includes(point.label))
        .sort((a, b) => {
          const order = { X: 1, A: 2, B: 3, C: 4 };
          return order[a.label] - order[b.label];
        });

      if (sortedPoints.length < 3) {
        this.logger.warn(`Cannot predict D point for pattern ${patternId}: Missing X, A, B, or C points`);
        return null;
      }

      // Lấy thông tin tỷ lệ Fibonacci cho loại mô hình
      const patternRatios = HARMONIC_RATIOS[pattern.patternType];
      if (!patternRatios) {
        this.logger.warn(`Unknown pattern type: ${pattern.patternType}`);
        return null;
      }

      // Lấy các điểm X, A, B, C
      const pointX = sortedPoints.find(p => p.label === 'X');
      const pointA = sortedPoints.find(p => p.label === 'A');
      const pointB = sortedPoints.find(p => p.label === 'B');
      const pointC = sortedPoints.find(p => p.label === 'C');

      if (!pointX || !pointA || !pointB || (sortedPoints.length >= 4 && !pointC)) {
        this.logger.warn(`Missing required points for pattern ${patternId}`);
        return null;
      }

      // Nếu chưa có điểm C, chỉ dự đoán điểm C dựa trên X, A và B
      if (!pointC) {
        return this.predictCPoint(pattern, pointX, pointA, pointB, patternRatios);
      }

      // Nếu đã có đủ X, A, B, C thì dự đoán điểm D
      return this.predictDPointFromXABC(pattern, pointX, pointA, pointB, pointC, patternRatios);
    } catch (error) {
      this.logger.error(`Error predicting D point for pattern ${patternId}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Dự đoán điểm C dựa trên X, A, B
   */
  private async predictCPoint(
    pattern: HarmonicPattern,
    pointX: PatternPoint,
    pointA: PatternPoint,
    pointB: PatternPoint,
    patternRatios: any
  ): Promise<PatternPoint> {
    const direction = pattern.direction.toUpperCase();
    const abDistance = Math.abs(pointB.price - pointA.price);
    
    // Tỷ lệ Fibonacci cho BC
    const bcRatio = patternRatios.ABC.ideal;
    
    // Tính toán điểm C dựa trên hướng của mô hình
    let predictedPrice: number;
    if (direction === 'BULLISH') {
      // Mẫu hình tăng: C thấp hơn B
      predictedPrice = pointB.price + (bcRatio * abDistance);
      if (predictedPrice >= pointA.price) {
        // Điều chỉnh để C nằm dưới A
        predictedPrice = pointA.price * 0.99;
      }
    } else {
      // Mẫu hình giảm: C cao hơn B
      predictedPrice = pointB.price - (bcRatio * abDistance);
      if (predictedPrice <= pointA.price) {
        // Điều chỉnh để C nằm trên A
        predictedPrice = pointA.price * 1.01;
      }
    }

    // Tạo điểm C dự đoán
    const confidenceScore = 70; // Mức độ tin cậy trung bình
    const pointC = this.pointRepository.create({
      patternId: pattern.id,
      label: 'C',
      price: predictedPrice,
      timestamp: new Date(pointB.timestamp.getTime() + (pointB.timestamp.getTime() - pointA.timestamp.getTime())),
      isPredicted: true,
      confidenceScore,
      fibonacciRatio: bcRatio,
    });

    await this.pointRepository.save(pointC);
    
    // Emit sự kiện
    this.eventEmitter.emit('pattern.point.predicted', {
      patternId: pattern.id,
      point: pointC,
      confidence: confidenceScore,
    });

    return pointC;
  }

  /**
   * Dự đoán điểm D dựa trên X, A, B, C
   */
  private async predictDPointFromXABC(
    pattern: HarmonicPattern,
    pointX: PatternPoint,
    pointA: PatternPoint,
    pointB: PatternPoint, 
    pointC: PatternPoint,
    patternRatios: any
  ): Promise<PatternPoint> {
    const direction = pattern.direction.toUpperCase();
    
    // Tính toán các khoảng cách
    const xaDistance = Math.abs(pointA.price - pointX.price);
    const bcDistance = Math.abs(pointC.price - pointB.price);
    
    // Lấy tỷ lệ Fibonacci cho XAD và BCD
    const xadRatio = patternRatios.XAD.ideal;
    const bcdRatio = patternRatios.BCD.ideal;
    
    // Tính toán 2 mức giá có thể cho điểm D
    const d1 = direction === 'BULLISH'
      ? pointX.price + (xaDistance * xadRatio) // D dựa trên XAD
      : pointX.price - (xaDistance * xadRatio);
      
    const d2 = direction === 'BULLISH'
      ? pointC.price - (bcDistance * bcdRatio) // D dựa trên BCD
      : pointC.price + (bcDistance * bcdRatio);
      
    // Lấy giá trị trung bình của 2 dự đoán
    const predictedPrice = (d1 + d2) / 2;
    
    // Tính độ tin cậy dựa trên độ gần nhau của 2 dự đoán
    const deviation = Math.abs(d1 - d2) / ((d1 + d2) / 2);
    const confidenceScore = Math.max(50, Math.round(100 - deviation * 100));
    
    // Tính thời gian cho điểm D (dựa trên khoảng thời gian giữa các điểm trước đó)
    const abTime = pointB.timestamp.getTime() - pointA.timestamp.getTime();
    const bcTime = pointC.timestamp.getTime() - pointB.timestamp.getTime();
    const avgTimeInterval = (abTime + bcTime) / 2;
    const predictedTimestamp = new Date(pointC.timestamp.getTime() + avgTimeInterval);
    
    // Tạo điểm D
    const pointD = this.pointRepository.create({
      patternId: pattern.id,
      label: 'D',
      price: predictedPrice,
      timestamp: predictedTimestamp,
      isPredicted: true,
      confidenceScore,
      fibonacciRatio: (xadRatio + bcdRatio) / 2, // Trung bình của 2 tỷ lệ
    });

    await this.pointRepository.save(pointD);
    
    // Cập nhật Potential Reversal Zone cho mô hình
    const tolerance = 0.01; // 1%
    await this.patternRepository.update(pattern.id, {
      potentialReversalZoneHigh: predictedPrice * (1 + tolerance),
      potentialReversalZoneLow: predictedPrice * (1 - tolerance),
    });
    
    // Emit sự kiện
    this.eventEmitter.emit('pattern.point.predicted', {
      patternId: pattern.id,
      point: pointD,
      confidence: confidenceScore,
    });

    return pointD;
  }

  /**
   * Cập nhật độ tin cậy của điểm dự đoán dựa trên giá thị trường hiện tại
   */
  async updatePredictionConfidence(patternId: string, currentPrice: number): Promise<void> {
    try {
      const pattern = await this.patternRepository.findOne({
        where: { id: patternId },
        relations: ['points'],
      });

      if (!pattern) return;

      const predictedPoint = pattern.points.find(p => p.isPredicted);
      if (!predictedPoint) return;

      // Cập nhật độ tin cậy dựa trên độ chênh lệch giữa giá dự đoán và giá hiện tại
      const priceDiff = Math.abs(predictedPoint.price - currentPrice) / predictedPoint.price;
      const newConfidence = Math.max(0, Math.min(100, Math.round(100 - priceDiff * 200)));
      
      // Chỉ cập nhật nếu độ tin cậy thay đổi đáng kể
      if (Math.abs(newConfidence - predictedPoint.confidenceScore) > 5) {
        await this.pointRepository.update(predictedPoint.id, {
          confidenceScore: newConfidence,
        });
        
        this.logger.debug(`Updated confidence for point ${predictedPoint.id} to ${newConfidence}`);
      }
    } catch (error) {
      this.logger.error(`Error updating prediction confidence: ${error.message}`, error.stack);
    }
  }

  /**
   * Xác nhận điểm dự đoán thành điểm thực tế
   */
  async confirmPrediction(pointId: string, actualPrice?: number): Promise<PatternPoint> {
    try {
      const point = await this.pointRepository.findOne({
        where: { id: pointId },
        relations: ['pattern'],
      });

      if (!point || !point.isPredicted) {
        throw new Error(`No predicted point found with ID ${pointId}`);
      }

      // Cập nhật điểm với giá trị thực tế
      const updatedPoint = await this.pointRepository.save({
        ...point,
        isPredicted: false,
        price: actualPrice || point.price,
        confidenceScore: 100,
      });

      // Cập nhật trạng thái hoàn thành của mô hình nếu đây là điểm D
      if (point.label === 'D') {
        await this.patternRepository.update(point.patternId, {
          isCompleted: true,
          completionTime: new Date(),
          completionPrice: actualPrice || point.price,
        });

        this.eventEmitter.emit('pattern.completed', {
          patternId: point.patternId,
          completionTime: new Date(),
          completionPrice: actualPrice || point.price,
        });
      }

      return updatedPoint;
    } catch (error) {
      this.logger.error(`Error confirming prediction: ${error.message}`, error.stack);
      throw error;
    }
  }
}
