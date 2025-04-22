// 022. src/shared/utils/validation.helper.ts
import { ValidationError, validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class ValidationHelper {
  static async validateDto<T extends object>(
    dtoClass: new () => T,
    plain: object,
  ): Promise<{ errors: ValidationError[]; dto: T }> {
    const dto = plainToClass(dtoClass, plain);
    const errors = await validate(dto);
    return { errors, dto };
  }

  static formatValidationErrors(errors: ValidationError[]): string[] {
    const formattedErrors: string[] = [];

    errors.forEach((error) => {
      if (error.constraints) {
        formattedErrors.push(...Object.values(error.constraints));
      }
      if (error.children && error.children.length > 0) {
        formattedErrors.push(...this.formatValidationErrors(error.children));
      }
    });

    return formattedErrors;
  }

  static isValidTimeframe(timeframe: string): boolean {
    const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
    return validTimeframes.includes(timeframe);
  }

  static isValidSymbol(symbol: string): boolean {
    const symbolRegex = /^[A-Z]{3,10}$/;
    return symbolRegex.test(symbol);
  }

  static isValidPrice(price: number): boolean {
    return !isNaN(price) && price > 0;
  }

  static isValidQuantity(quantity: number): boolean {
    return !isNaN(quantity) && quantity > 0;
  }

  static isValidPercentage(value: number): boolean {
    return !isNaN(value) && value >= 0 && value <= 100;
  }

  static validateTradeSetup(setup: {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    direction: 'LONG' | 'SHORT';
  }): boolean {
    const { entryPrice, stopLoss, takeProfit, direction } = setup;

    if (direction === 'LONG') {
      return stopLoss < entryPrice && takeProfit > entryPrice;
    } else {
      return stopLoss > entryPrice && takeProfit < entryPrice;
    }
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/[^\w\s-]/gi, '');
  }

  static isValidBinanceApiKey(apiKey: string): boolean {
    const binanceApiKeyRegex = /^[A-Za-z0-9]{64}$/;
    return binanceApiKeyRegex.test(apiKey);
  }

  static isValidBinanceApiSecret(apiSecret: string): boolean {
    const binanceApiSecretRegex = /^[A-Za-z0-9]{64}$/;
    return binanceApiSecretRegex.test(apiSecret);
  }

  static isValidTelegramChatId(chatId: string): boolean {
    return /^-?\d+$/.test(chatId);
  }

  static isNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  static isPositiveNumber(value: any): boolean {
    return this.isNumber(value) && value > 0;
  }

  static isNonNegativeNumber(value: any): boolean {
    return this.isNumber(value) && value >= 0;
  }

  static isInteger(value: any): boolean {
    return this.isNumber(value) && Number.isInteger(value);
  }

  static isPositiveInteger(value: any): boolean {
    return this.isInteger(value) && value > 0;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  }

  static isValidCryptoSymbol(symbol: string): boolean {
    const symbolRegex = /^[A-Z]{2,8}$/;
    return symbolRegex.test(symbol);
  }

  static isValidCryptoPair(pair: string): boolean {
    const pairRegex = /^[A-Z]{2,8}[A-Z]{2,5}$/;
    return pairRegex.test(pair);
  }

  static isStrongPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
    return passwordRegex.test(password);
  }

  static isValidApiKey(apiKey: string): boolean {
    return /^[A-Za-z0-9]{16,}$/.test(apiKey);
  }
}
