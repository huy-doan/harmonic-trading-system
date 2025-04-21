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
}
