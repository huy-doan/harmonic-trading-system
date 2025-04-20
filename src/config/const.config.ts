// 009. src/config/const.config.ts
export const APP_CONSTANTS = {
    // App metadata
    APP_NAME: 'Harmonic Trading System',
    APP_VERSION: '0.1.0',
    APP_DESCRIPTION: 'A system for detecting and trading based on harmonic patterns',
    
    // Pagination defaults
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    
    // Timeframes for market data
    TIMEFRAMES: {
      ONE_MINUTE: '1m',
      FIVE_MINUTES: '5m',
      FIFTEEN_MINUTES: '15m',
      THIRTY_MINUTES: '30m',
      ONE_HOUR: '1h',
      FOUR_HOURS: '4h',
      ONE_DAY: '1d',
      ONE_WEEK: '1w',
    },
    
    // Fibonacci ratios for harmonic patterns
    FIBONACCI_RATIOS: {
      EXTREME_RETRACEMENTS: {
        ZERO: 0,
        FULL: 1.0,
      },
      RETRACEMENTS: {
        SHALLOW: 0.382,
        MEDIUM: 0.5,
        DEEP: 0.618,
        DEEPER: 0.786,
        DEEPEST: 0.886,
      },
      PROJECTIONS: {
        SMALL: 1.27,
        MEDIUM: 1.414,
        LARGE: 1.618,
        EXTREME: 2.0,
        ULTRA: 2.618,
        MEGA: 3.14,
        SUPER: 3.618,
      },
    },
    
    // Pattern types
    PATTERN_TYPES: {
      GARTLEY: 'GARTLEY',
      BUTTERFLY: 'BUTTERFLY',
      BAT: 'BAT',
      CRAB: 'CRAB',
      CYPHER: 'CYPHER',
    },
    
    // Market scan intervals (in milliseconds)
    SCAN_INTERVALS: {
      PATTERN_DETECTION: 30000, // 30 seconds
      MARKET_ANALYSIS: 3600000, // 1 hour
      TRADE_EXECUTION: 60000, // 1 minute
    },
    
    // Trade directions
    TRADE_DIRECTIONS: {
      LONG: 'LONG',
      SHORT: 'SHORT',
    },
  };
  