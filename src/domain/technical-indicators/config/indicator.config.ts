// src/domain/technical-indicators/config/indicator.config.ts
import { registerAs } from '@nestjs/config';
import { env } from '@config/env.config';

/**
 * Configuration for technical indicators
 */
export const indicatorConfig = registerAs('indicators', () => ({
  // Ichimoku configuration
  ichimoku: {
    enabled: env.ENABLE_ICHIMOKU !== 'false',
    defaultParameters: {
      tenkanPeriod: parseInt(env.ICHIMOKU_TENKAN_PERIOD || '9', 10),
      kijunPeriod: parseInt(env.ICHIMOKU_KIJUN_PERIOD || '26', 10),
      senkouSpanBPeriod: parseInt(env.ICHIMOKU_SENKOU_SPAN_B_PERIOD || '52', 10),
      displacement: parseInt(env.ICHIMOKU_DISPLACEMENT || '26', 10),
    },
  },
  
  // RSI configuration
  rsi: {
    enabled: env.ENABLE_RSI !== 'false',
    defaultParameters: {
      period: parseInt(env.RSI_PERIOD || '14', 10),
      overbought: parseInt(env.RSI_OVERBOUGHT || '70', 10),
      oversold: parseInt(env.RSI_OVERSOLD || '30', 10),
    },
  },
  
  // MACD configuration
  macd: {
    enabled: env.ENABLE_MACD !== 'false',
    defaultParameters: {
      fastPeriod: parseInt(env.MACD_FAST_PERIOD || '12', 10),
      slowPeriod: parseInt(env.MACD_SLOW_PERIOD || '26', 10),
      signalPeriod: parseInt(env.MACD_SIGNAL_PERIOD || '9', 10),
    },
  },
  
  // Indicator comparison configuration
  comparison: {
    // Enable/disable comparison between indicators
    enabled: env.ENABLE_INDICATOR_COMPARISON !== 'false',
    // Consensus threshold (number of indicators that need to agree to confirm a signal)
    consensusThreshold: parseInt(env.INDICATOR_CONSENSUS_THRESHOLD || '2', 10),
    // Weights for each indicator (affects the overall score)
    weights: {
      ichimoku: parseFloat(env.ICHIMOKU_WEIGHT || '1.0'),
      rsi: parseFloat(env.RSI_WEIGHT || '1.0'),
      macd: parseFloat(env.MACD_WEIGHT || '1.0'),
    },
  },
}));

/**
 * Supported indicator types
 */
export enum IndicatorType {
  ICHIMOKU = 'ICHIMOKU',
  RSI = 'RSI',
  MACD = 'MACD',
}

/**
 * Indicator signals
 */
export enum IndicatorSignal {
  STRONG_BULLISH = 'STRONG_BULLISH',
  BULLISH = 'BULLISH',
  WEAK_BULLISH = 'WEAK_BULLISH',
  NEUTRAL = 'NEUTRAL',
  WEAK_BEARISH = 'WEAK_BEARISH',
  BEARISH = 'BEARISH',
  STRONG_BEARISH = 'STRONG_BEARISH',
  OVERBOUGHT = 'OVERBOUGHT',
  OVERSOLD = 'OVERSOLD',
  BULLISH_CROSSOVER = 'BULLISH_CROSSOVER',
  BEARISH_CROSSOVER = 'BEARISH_CROSSOVER',
}

/**
 * Check if an indicator is enabled
 */
export function isIndicatorEnabled(type: IndicatorType, config: any): boolean {
  switch (type) {
    case IndicatorType.ICHIMOKU:
      return config.ichimoku.enabled;
    case IndicatorType.RSI:
      return config.rsi.enabled;
    case IndicatorType.MACD:
      return config.macd.enabled;
    default:
      return false;
  }
}

/**
 * Convert signal to numeric value
 */
export function signalToValue(signal: IndicatorSignal): number {
  switch (signal) {
    case IndicatorSignal.STRONG_BULLISH:
      return 3;
    case IndicatorSignal.BULLISH:
    case IndicatorSignal.BULLISH_CROSSOVER:
      return 2;
    case IndicatorSignal.WEAK_BULLISH:
      return 1;
    case IndicatorSignal.NEUTRAL:
      return 0;
    case IndicatorSignal.WEAK_BEARISH:
      return -1;
    case IndicatorSignal.BEARISH:
    case IndicatorSignal.BEARISH_CROSSOVER:
      return -2;
    case IndicatorSignal.STRONG_BEARISH:
      return -3;
    case IndicatorSignal.OVERBOUGHT:
      return -2; // Overbought is typically considered a bearish signal
    case IndicatorSignal.OVERSOLD:
      return 2; // Oversold is typically considered a bullish signal
    default:
      return 0;
  }
}
