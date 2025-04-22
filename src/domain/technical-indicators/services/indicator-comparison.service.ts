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
    // Get configuration for indicators
    this.indicatorsConfig = this.configService.get('indicators');
    
    // Determine which indicators are enabled
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
   * Compare signals from different indicators to produce a consensus signal
   */
  async compareIndicators(
    symbol: string,
    timeframe: string,
    timestamp?: number
  ): Promise<ComparisonResult> {
    try {
      // Only get data from enabled indicators
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
      
      // Get the latest data from each indicator
      const latestIchimoku = ichimokuData.length > 0 ? ichimokuData[0] : null;
      const latestRSI = rsiData.length > 0 ? rsiData[0] : null;
      const latestMACD = macdData.length > 0 ? macdData[0] : null;
      
      // Calculate consensus score based on signals
      let consensusScoreTotal = 0;
      let consensusStrengthTotal = 0;
      let weightTotal = 0;
      
      // Signal results for each indicator
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
      
      // Calculate score for Ichimoku
      if (latestIchimoku && this.enabledIndicators.includes(IndicatorType.ICHIMOKU)) {
        const weight = this.indicatorsConfig.comparison.weights.ichimoku;
        const signalValue = signalToValue(latestIchimoku.signal as IndicatorSignal);
        consensusScoreTotal += signalValue * weight;
        consensusStrengthTotal += latestIchimoku.strength * weight;
        weightTotal += weight;
      }
      
      // Calculate score for RSI
      if (latestRSI && this.enabledIndicators.includes(IndicatorType.RSI)) {
        const weight = this.indicatorsConfig.comparison.weights.rsi;
        const signalValue = signalToValue(latestRSI.values.signal as IndicatorSignal);
        consensusScoreTotal += signalValue * weight;
        consensusStrengthTotal += latestRSI.values.strength * weight;
        weightTotal += weight;
      }
      
      // Calculate score for MACD
      if (latestMACD && this.enabledIndicators.includes(IndicatorType.MACD)) {
        const weight = this.indicatorsConfig.comparison.weights.macd;
        const signalValue = signalToValue(latestMACD.values.trend as IndicatorSignal);
        consensusScoreTotal += signalValue * weight;
        consensusStrengthTotal += latestMACD.values.strength * weight;
        weightTotal += weight;
      }
      
      // Calculate average scores
      const consensusScore = weightTotal > 0 ? consensusScoreTotal / weightTotal : 0;
      const consensusStrength = weightTotal > 0 ? consensusStrengthTotal / weightTotal : 0;
      
      // Determine overall signal
      let overallSignal = this.determineOverallSignal(consensusScore);
      
      // Generate description and recommendations
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
   * Determine overall signal based on consensus score
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
   * Generate description and recommendations based on analysis results
   */
  private generateRecommendations(
    overallSignal: string,
    consensusScore: number,
    consensusStrength: number,
    signals: any
  ): { description: string; recommendations: string[] } {
    let description = '';
    const recommendations: string[] = [];
    
    // General description
    if (consensusStrength < 40) {
      description = 'Weak signal with low confidence.';
      recommendations.push('Exercise caution when trading based on this signal.');
    } else if (consensusStrength < 70) {
      description = 'Signal with medium confidence.';
      recommendations.push('Consider trading with additional confirmations.');
    } else {
      description = 'Strong signal with high confidence.';
      recommendations.push('Reliable signal for trading opportunity.');
    }
    
    // Detailed descriptions
    switch (overallSignal) {
      case IndicatorSignal.STRONG_BULLISH:
        description += ' Strong uptrend confirmed by multiple indicators.';
        recommendations.push('Consider opening a long position.');
        recommendations.push('Place stop loss below the nearest support level.');
        break;
        
      case IndicatorSignal.BULLISH:
        description += ' Uptrend confirmed but not overly strong.';
        recommendations.push('Consider opening a long position with additional confirmation.');
        recommendations.push('Manage risk carefully with appropriate stop loss.');
        break;
        
      case IndicatorSignal.WEAK_BULLISH:
        description += ' Slight bullish signs but not definitive.';
        recommendations.push('Wait for more confirmation before entering position.');
        recommendations.push('Consider smaller position size or no trade.');
        break;
        
      case IndicatorSignal.NEUTRAL:
        description += ' No clear trend, market moving sideways.';
        recommendations.push('Avoid opening new positions.');
        recommendations.push('Consider range trading strategies.');
        break;
        
      case IndicatorSignal.WEAK_BEARISH:
        description += ' Slight bearish signs but not definitive.';
        recommendations.push('Wait for more confirmation before shorting.');
        recommendations.push('Consider smaller position size or no trade.');
        break;
        
      case IndicatorSignal.BEARISH:
        description += ' Downtrend confirmed but not overly strong.';
        recommendations.push('Consider opening a short position with additional confirmation.');
        recommendations.push('Manage risk carefully with appropriate stop loss.');
        break;
        
      case IndicatorSignal.STRONG_BEARISH:
        description += ' Strong downtrend confirmed by multiple indicators.';
        recommendations.push('Consider opening a short position.');
        recommendations.push('Place stop loss above the nearest resistance level.');
        break;
        
      default:
        description += ' Unclear signal.';
        recommendations.push('Exercise caution and wait for clearer signals.');
    }
    
    // Recommendations based on conflicting signals between indicators
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
      description += ' Note that there are conflicting signals between indicators.';
      recommendations.push('Consider additional analysis due to conflicting indicator signals.');
    }
    
    return { description, recommendations };
  }
}
