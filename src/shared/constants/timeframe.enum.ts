// 026. src/shared/constants/timeframe.enum.ts
export enum Timeframe {
    ONE_MINUTE = '1m',
    FIVE_MINUTES = '5m',
    FIFTEEN_MINUTES = '15m',
    THIRTY_MINUTES = '30m',
    ONE_HOUR = '1h',
    FOUR_HOURS = '4h',
    ONE_DAY = '1d',
    ONE_WEEK = '1w',
  }
  
  export const TimeframeInMilliseconds = {
    [Timeframe.ONE_MINUTE]: 60 * 1000,
    [Timeframe.FIVE_MINUTES]: 5 * 60 * 1000,
    [Timeframe.FIFTEEN_MINUTES]: 15 * 60 * 1000,
    [Timeframe.THIRTY_MINUTES]: 30 * 60 * 1000,
    [Timeframe.ONE_HOUR]: 60 * 60 * 1000,
    [Timeframe.FOUR_HOURS]: 4 * 60 * 60 * 1000,
    [Timeframe.ONE_DAY]: 24 * 60 * 60 * 1000,
    [Timeframe.ONE_WEEK]: 7 * 24 * 60 * 60 * 1000,
  };
  
  export function isValidTimeframe(timeframe: string): boolean {
    return Object.values(Timeframe).includes(timeframe as Timeframe);
  }
  
  export function getTimeframeInMilliseconds(timeframe: Timeframe): number {
    return TimeframeInMilliseconds[timeframe];
  }
  