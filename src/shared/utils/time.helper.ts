// 019. src/shared/utils/time.helper.ts
import {
  format,
  parse,
  isValid,
  differenceInSeconds,
  addMinutes,
  subMinutes,
  addDays,
  subDays
} from 'date-fns';

/**
 * Helper class for time-related operations
 */
export class TimeHelper {
  /**
   * Formats a date to ISO string
   */
  static formatToISOString(date: Date | string | number): string {
    return new Date(date).toISOString();
  }

  /**
   * Alternative method for formatting to ISO string, maintained for compatibility
   */
  static toISOString(date: Date | string | number): string {
    if (typeof date === 'string' && !date.endsWith('Z')) {
      // If the date is a string without timezone info, convert to Date
      date = new Date(date);
    }
    return new Date(date).toISOString();
  }

  /**
   * Formats a timestamp to a human readable string
   */
  static formatTimestamp(timestamp: number | string): string {
    const date = new Date(Number(timestamp));
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  }

  /**
   * Formats a date to a custom format
   */
  static formatDate(date: Date | string | number, formatString: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return format(new Date(date), formatString);
  }

  /**
   * Parses a string date with the given format
   */
  static parseDate(dateString: string, formatString: string = 'yyyy-MM-dd'): Date {
    return parse(dateString, formatString, new Date());
  }

  /**
   * Parses a timeframe string to milliseconds
   */
  static parseTimeframe(timeframe: string): number {
    const regex = /(\d+)([mhd])/;
    const match = timeframe.match(regex);

    if (!match) {
      throw new Error('Invalid timeframe format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error('Invalid timeframe unit');
    }
  }

  /**
   * Gets the start time of a timeframe
   */
  static getTimeframeStart(timeframe: string, currentTime: Date = new Date()): Date {
    const milliseconds = this.parseTimeframe(timeframe);
    return new Date(Math.floor(currentTime.getTime() / milliseconds) * milliseconds);
  }

  /**
   * Gets an array of timeframe timestamps between start and end dates
   */
  static getTimeframesBetween(startTime: Date, endTime: Date, timeframe: string): Date[] {
    const timestamps: Date[] = [];
    const interval = this.parseTimeframe(timeframe);
    let current = new Date(startTime.getTime());

    while (current <= endTime) {
      timestamps.push(new Date(current));
      current = new Date(current.getTime() + interval);
    }

    return timestamps;
  }

  /**
   * Checks if a date is within a time range
   */
  static isWithinTimeRange(date: Date, startTime: Date, endTime: Date): boolean {
    return date >= startTime && date <= endTime;
  }

  /**
   * Adds a timeframe to a date
   */
  static addTimeframe(date: Date, timeframe: string, count: number = 1): Date {
    const milliseconds = this.parseTimeframe(timeframe) * count;
    return new Date(date.getTime() + milliseconds);
  }

  /**
   * Subtracts a timeframe from a date
   */
  static subtractTimeframe(date: Date, timeframe: string, count: number = 1): Date {
    const milliseconds = this.parseTimeframe(timeframe) * count;
    return new Date(date.getTime() - milliseconds);
  }

  /**
   * Gets the elapsed time in seconds between two dates
   */
  static getElapsedTimeInSeconds(startTime: Date, endTime: Date = new Date()): number {
    return differenceInSeconds(endTime, startTime);
  }

  /**
   * Alternative method for getting time difference, maintained for compatibility
   */
  static getTimeDifference(startDate: Date, endDate: Date = new Date()): number {
    return differenceInSeconds(endDate, startDate);
  }

  /**
   * Returns true if the provided date is valid
   */
  static isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime()) || 
           (typeof date === 'string' && isValid(new Date(date)));
  }

  /**
   * Adds days to a date
   */
  static addDays(date: Date, days: number): Date {
    return addDays(date, days);
  }

  /**
   * Subtracts days from a date
   */
  static subtractDays(date: Date, days: number): Date {
    return subDays(date, days);
  }

  /**
   * Gets the current time in milliseconds
   */
  static now(): number {
    return Date.now();
  }

  /**
   * Returns a Date object for the start of today
   */
  static startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Returns a Date object for the end of today
   */
  static endOfToday(): Date {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }

  /**
   * Gets the current date in YYYY-MM-DD format
   */
  static getCurrentDateFormatted(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }

  /**
   * Adds minutes to a date
   */
  static addMinutes(date: Date, minutes: number): Date {
    return addMinutes(date, minutes);
  }

  /**
   * Subtracts minutes from a date
   */
  static subtractMinutes(date: Date, minutes: number): Date {
    return subMinutes(date, minutes);
  }
}
