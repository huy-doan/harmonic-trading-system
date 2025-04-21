// 167. src/helpers/time.helper.ts
import { format, parse, differenceInSeconds, addDays, subDays, isValid } from 'date-fns';

/**
 * Helper class for time-related operations
 */
export class TimeHelper {
  /**
   * Formats a date to ISO string
   */
  static toISOString(date: Date | string | number): string {
    if (typeof date === 'string' && !date.endsWith('Z')) {
      // If the date is a string without timezone info, convert to Date
      date = new Date(date);
    }
    return new Date(date).toISOString();
  }

  /**
   * Formats a date to a custom format
   */
  static formatDate(date: Date | string | number, formatString: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return format(new Date(date), formatString);
  }

  /**
   * Converts a timestamp (in milliseconds) to a formatted date string
   */
  static formatTimestamp(timestamp: number): string {
    return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
  }

  /**
   * Parses a string date with the given format
   */
  static parseDate(dateString: string, formatString: string = 'yyyy-MM-dd'): Date {
    return parse(dateString, formatString, new Date());
  }

  /**
   * Gets the time difference between two dates in seconds
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
}
