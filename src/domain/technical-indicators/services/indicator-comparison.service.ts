// src/domain/technical-indicators/services/indicator-comparison.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IchimokuService } from './ichimoku.service';
import { RSIService } from './rsi.service';
import { MACDService } from './macd.service';
import { IndicatorType, IndicatorSignal, signalToValue, isIndicatorEnabled } from '../config/indicator.config';

export interface ComparisonResult {
  timestamp: number;
  overallSignal: string;
  consensusScore: number;
  consensusStrength: number;
  signals: {
    ichimoku?: {
      signal: string;
      strength: number;
      enabled: boolean;
    };
    rsi?: {
      signal: string;
      strength: number;
      enabled: boolean;
    };
    macd?: {
      signal: string;
      strength: number;
      enabled: boolean;
    };
  };
  details: {
    description: string;
    recommendations: string[];
  };
}

@Injectable()
export class IndicatorComparisonService {
  private readonly logger = new Logger(IndicatorComparisonService.name);
  private readonly indicatorsConfig: any;
  private readonly enabledIndicators: IndicatorType[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly ichimokuService: IchimokuService,
    private readonly rsiService: RSIService,
    private readonly macdService: MACDService
  ) {
    // Lấy cấu hình cho các chỉ báo
    this.indicatorsConfig = this.configService.get('indicators');
    
    // Xác định các chỉ báo đã được bật
    if (isIndicatorEnabled(IndicatorType.ICHIMOKU, this.indicatorsConfig)) {
      this.enabledIndicators.push(IndicatorType.ICHIMOKU);
    }
    
    if (isIndicatorEnabled(IndicatorType.RSI, this.indicatorsConfig)) {
      this.enabledIndicators.push(IndicatorType.RSI);
    }
    
    if (isIndicatorEnabled(IndicatorType.MACD, this.indicatorsConfig)) {
      this.enabledIndicators.push(IndicatorType.MACD);
    }
    
    this.logger.log(`Enabled indicators: ${this.enabledIndicators.join(', ')}`);
  }

  /**
   * So sánh các tín hiệu từ các chỉ báo khác nhau để đưa ra tín hiệu tổng hợp
   */
  async compareIndicators(
    symbol: string,
    timeframe: string,
    timestamp?: number
  ): Promise<ComparisonResult> {
    try {
      // Chỉ lấy dữ liệu từ các chỉ báo đã được bật
      const [ichimokuData, rsiData, macdData] = await Promise.all([
        this.enabledIndicators.includes(IndicatorType.ICHIMOKU)
          ? this.ichimokuService.getIchimokuData(symbol, timeframe, timestamp, timestamp ? timestamp + 1 : undefined, 1)
          : Promise.resolve([]),
        
        this.enabledIndicators.includes(IndicatorType.RSI)
          ? this.rsiService.getRSIData(symbol, timeframe, timestamp, timestamp ? timestamp + 1 : undefined, 1)
          : Promise.resolve([]),
        
        this.enabledIndicators.includes(IndicatorType.MACD)
          ? this.macdService.getMACDData(symbol, timeframe, timestamp, timestamp ? timestamp + 1 : undefined, 1)
          : Promise.resolve([])
      ]);
      
      // Lấy dữ liệu mới nhất từ mỗi chỉ báo
      const latestIchimoku = ichimokuData.length > 0 ? ichimokuData[0] : null;
      const latestRSI = rsiData.length > 0 ? rsiData[0] : null;
      const latestMACD = macdData.length > 0 ? macdData[0] : null;
      
      // Tính điểm tổng hợp dựa trên các tín hiệu
      let consensusScoreTotal = 0;
      let consensusStrengthTotal = 0;
      let weightTotal = 0;
      
      // Kết quả tín hiệu cho từng chỉ báo
      const signals = {
        ichimoku: latestIchimoku ? {
          signal: latestIchimoku.signal,
          strength: latestIchimoku.strength,
          enabled: this.enabledIndicators.includes(IndicatorType.ICHIMOKU)
        } : undefined,
        
        rsi: latestRSI ? {
          signal: latestRSI.values.signal,
          strength: latestRSI.values.strength,
          enabled: this.enabledIndicators.includes(IndicatorType.RSI)
        } : undefined,
        
        macd: latestMACD ? {
          signal: latestMACD.values.trend,
          strength: latestMACD.values.strength,
          enabled: this.enabledIndicators.includes(IndicatorType.MACD)
        } : undefined
      };
      
      // Tính điểm cho Ichimoku
      if (latestIchimoku && this.enabledIndicators.includes(IndicatorType.ICHIMOKU)) {
        const weight = this.indicatorsConfig.comparison.weights.ichimoku;
        const signalValue = signalToValue(latestIchimoku.signal as IndicatorSignal);
        consensusScoreTotal += signalValue * weight;
        consensusStrengthTotal += latestIchimoku.strength * weight;
        weightTotal += weight;
      }
      
      // Tính điểm cho RSI
      if (latestRSI && this.enabledIndicators.includes(IndicatorType.RSI)) {
        const weight = this.indicatorsConfig.comparison.weights.rsi;
        const signalValue = signalToValue(latestRSI.values.signal as IndicatorSignal);
        consensusScoreTotal += signalValue * weight;
        consensusStrengthTotal += latestRSI.values.strength * weight;
        weightTotal += weight;
      }
      
      // Tính điểm cho MACD
      if (latestMACD && this.enabledIndicators.includes(IndicatorType.MACD)) {
        const weight = this.indicatorsConfig.comparison.weights.macd;
        const signalValue = signalToValue(latestMACD.values.trend as IndicatorSignal);
        consensusScoreTotal += signalValue * weight;
        consensusStrengthTotal += latestMACD.values.strength * weight;
        weightTotal += weight;
      }
      
      // Tính điểm trung bình
      const consensusScore = weightTotal > 0 ? consensusScoreTotal / weightTotal : 0;
      const consensusStrength = weightTotal > 0 ? consensusStrengthTotal / weightTotal : 0;
      
      // Xác định tín hiệu tổng hợp
      let overallSignal = this.determineOverallSignal(consensusScore);
      
      // Mô tả và khuyến nghị
      const { description, recommendations } = this.generateRecommendations(
        overallSignal,
        consensusScore,
        consensusStrength,
        signals
      );
      
      return {
        timestamp: latestIchimoku?.timestamp || latestRSI?.timestamp || latestMACD?.timestamp || Date.now(),
        overallSignal,
        consensusScore,
        consensusStrength,
        signals,
        details: {
          description,
          recommendations
        }
      };
    } catch (error) {
      this.logger.error(`Failed to compare indicators for ${symbol} ${timeframe}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Xác định tín hiệu tổng hợp dựa trên điểm số đồng thuận
   */
  private determineOverallSignal(consensusScore: number): string {
    if (consensusScore >= 2.5) {
      return IndicatorSignal.STRONG_BULLISH;
    } else if (consensusScore >= 1.5) {
      return IndicatorSignal.BULLISH;
    } else if (consensusScore >= 0.5) {
      return IndicatorSignal.WEAK_BULLISH;
    } else if (consensusScore > -0.5) {
      return IndicatorSignal.NEUTRAL;
    } else if (consensusScore > -1.5) {
      return IndicatorSignal.WEAK_BEARISH;
    } else if (consensusScore > -2.5) {
      return IndicatorSignal.BEARISH;
    } else {
      return IndicatorSignal.STRONG_BEARISH;
    }
  }

  /**
   * Tạo mô tả và khuyến nghị dựa trên kết quả phân tích
   */
  private generateRecommendations(
    overallSignal: string,
    consensusScore: number,
    consensusStrength: number,
    signals: any
  ): { description: string; recommendations: string[] } {
    let description = '';
    const recommendations: string[] = [];
    
    // Mô tả chung
    if (consensusStrength < 40) {
      description = 'Tín hiệu yếu với độ tin cậy thấp.';
      recommendations.push('Nên thận trọng khi giao dịch dựa trên tín hiệu này.');
    } else if (consensusStrength < 70) {
      description = 'Tín hiệu với độ tin cậy trung bình.';
      recommendations.push('Có thể xem xét giao dịch kèm theo các xác nhận khác.');
    } else {
      description = 'Tín hiệu mạnh với độ tin cậy cao.';
      recommendations.push('Tín hiệu đáng tin cậy cho cơ hội giao dịch.');
    }
    
    // Mô tả chi tiết
    switch (overallSignal) {
      case IndicatorSignal.STRONG_BULLISH:
        description += ' Xu hướng tăng mạnh đã được xác nhận bởi nhiều chỉ báo.';
        recommendations.push('Xem xét mở vị thế mua.');
        recommendations.push('Đặt stop loss dưới vùng hỗ trợ gần nhất.');
        break;
        
      case IndicatorSignal.BULLISH:
        description += ' Xu hướng tăng được xác nhận nhưng không quá mạnh.';
        recommendations.push('Xem xét mở vị thế mua khi có xác nhận thêm.');
        recommendations.push('Quản lý rủi ro cẩn thận với stop loss phù hợp.');
        break;
        
      case IndicatorSignal.WEAK_BULLISH:
        description += ' Có dấu hiệu tăng nhẹ nhưng chưa rõ ràng.';
        recommendations.push('Chờ đợi xác nhận thêm trước khi mở vị thế.');
        recommendations.push('Cân nhắc giao dịch với khối lượng nhỏ hoặc không giao dịch.');
        break;
        
      case IndicatorSignal.NEUTRAL:
        description += ' Không có xu hướng rõ ràng, thị trường đi ngang.';
        recommendations.push('Tránh mở vị thế mới.');
        recommendations.push('Có thể sử dụng chiến lược giao dịch biên độ.');
        break;
        
      case IndicatorSignal.WEAK_BEARISH:
        description += ' Có dấu hiệu giảm nhẹ nhưng chưa rõ ràng.';
        recommendations.push('Chờ đợi xác nhận thêm trước khi mở vị thế bán.');
        recommendations.push('Cân nhắc giao dịch với khối lượng nhỏ hoặc không giao dịch.');
        break;
        
      case IndicatorSignal.BEARISH:
        description += ' Xu hướng giảm được xác nhận nhưng không quá mạnh.';
        recommendations.push('Xem xét mở vị thế bán khi có xác nhận thêm.');
        recommendations.push('Quản lý rủi ro cẩn thận với stop loss phù hợp.');
        break;
        
      case IndicatorSignal.STRONG_BEARISH:
        description += ' Xu hướng giảm mạnh đã được xác nhận bởi nhiều chỉ báo.';
        recommendations.push('Xem xét mở vị thế bán.');
        recommendations.push('Đặt stop loss trên vùng kháng cự gần nhất.');
        break;
        
      default:
        description += ' Tín hiệu không rõ ràng.';
        recommendations.push('Nên thận trọng và chờ đợi tín hiệu rõ ràng hơn.');
    }
    
    // Khuyến nghị dựa trên tín hiệu mâu thuẫn giữa các chỉ báo
    const enabledSignalsCount = Object.values(signals).filter(s => s?.enabled).length;
    const differentSignalsCount = new Set(
      Object.values(signals)
        .filter(s => s?.enabled)
        .map(s => {
          const signal = s?.signal;
          if (signal?.includes('BULLISH')) return 'BULLISH';
          if (signal?.includes('BEARISH')) return 'BEARISH';
          return signal;
        })
    ).size;
    
    if (differentSignalsCount > 1 && enabledSignalsCount >= 2) {
      description += ' Lưu ý rằng có sự mâu thuẫn giữa các chỉ báo.';
      recommendations.push('Cân nhắc thêm các phân tích khác do có mâu thuẫn giữa các chỉ báo.');
    }
    
    return { description, recommendations };
  }
}
