// 169. src/helpers/validation.helper.ts
/**
 * Helper class for validation functions
 */
export class ValidationHelper {
    /**
     * Checks if a value is a valid number
     */
    static isNumber(value: any): boolean {
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }
  
    /**
     * Checks if a value is a valid positive number
     */
    static isPositiveNumber(value: any): boolean {
      return this.isNumber(value) && value > 0;
    }
  
    /**
     * Checks if a value is a valid non-negative number
     */
    static isNonNegativeNumber(value: any): boolean {
      return this.isNumber(value) && value >= 0;
    }
  
    /**
     * Checks if a value is a valid integer
     */
    static isInteger(value: any): boolean {
      return this.isNumber(value) && Number.isInteger(value);
    }
  
    /**
     * Checks if a value is a valid positive integer
     */
    static isPositiveInteger(value: any): boolean {
      return this.isInteger(value) && value > 0;
    }
  
    /**
     * Checks if a string is a valid email
     */
    static isValidEmail(email: string): boolean {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    }
  
    /**
     * Checks if a string is a valid URL
     */
    static isValidUrl(url: string): boolean {
      try {
        new URL(url);
        return true;
      } catch (err) {
        return false;
      }
    }
  
    /**
     * Checks if a string is a valid cryptocurrency symbol
     */
    static isValidCryptoSymbol(symbol: string): boolean {
      // Most crypto symbols are uppercase with 2-8 characters
      const symbolRegex = /^[A-Z]{2,8}$/;
      return symbolRegex.test(symbol);
    }
  
    /**
     * Checks if a string is a valid cryptocurrency pair (e.g., BTCUSDT)
     */
    static isValidCryptoPair(pair: string): boolean {
      // Most crypto pairs are uppercase with 5-12 characters
      // They typically consist of two symbols concatenated
      const pairRegex = /^[A-Z]{2,8}[A-Z]{2,5}$/;
      return pairRegex.test(pair);
    }
  
    /**
     * Checks if a string is a valid timeframe
     */
    static isValidTimeframe(timeframe: string): boolean {
      const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
      return validTimeframes.includes(timeframe);
    }
  
    /**
     * Checks if a password meets minimum strength requirements
     */
    static isStrongPassword(password: string): boolean {
      // At least 8 characters, with at least one uppercase, one lowercase,
      // one number and one special character
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
      return passwordRegex.test(password);
    }
  
    /**
     * Sanitizes a string by removing special characters
     */
    static sanitizeString(str: string): string {
      return str.replace(/[^\w\s-]/gi, '');
    }
  
    /**
     * Validates an API key format
     */
    static isValidApiKey(apiKey: string): boolean {
      // Most API keys are alphanumeric and at least 16 characters long
      return /^[A-Za-z0-9]{16,}$/.test(apiKey);
    }
  }
  