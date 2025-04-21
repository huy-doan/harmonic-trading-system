// 019. src/shared/utils/time.helper.ts
import { format, parse, isValid, differenceInSeconds, addMinutes, subMinutes } from 'date-fns';

export class TimeHelper {
  static formatToISOString(date: Date | string | number): string {
    return new Date(date).toISOString();
  }

  static formatTimestamp(timestamp: number | string): string {
    const date = new Date(Number(timestamp));
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  }

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

  static getTimeframeStart(timeframe: string, currentTime: Date = new Date()): Date {
    const milliseconds = this.parseTimeframe(timeframe);
    return new Date(Math.floor(currentTime.getTime() / milliseconds) * milliseconds);
  }

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

  static isWithinTimeRange(date: Date, startTime: Date, endTime: Date): boolean {
    return date >= startTime && date <= endTime;
  }

  static addTimeframe(date: Date, timeframe: string, count: number = 1): Date {
    const milliseconds = this.parseTimeframe(timeframe) * count;
    return new Date(date.getTime() + milliseconds);
  }

  static subtractTimeframe(date: Date, timeframe: string, count: number = 1): Date {
    const milliseconds = this.parseTimeframe(timeframe) * count;
    return new Date(date.getTime() - milliseconds);
  }

  static getElapsedTimeInSeconds(startTime: Date, endTime: Date = new Date()): number {
    return differenceInSeconds(endTime, startTime);
  }
}
