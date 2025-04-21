// 054. src/infrastructure/external/binance/binance.client.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import { BinanceApiError } from '@shared/exceptions/api-error.exception';

@Injectable()
export class BinanceClient {
  private readonly logger = new Logger(BinanceClient.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string = 'https://api.binance.com';
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BINANCE_API_KEY');
    this.apiSecret = this.configService.get<string>('BINANCE_API_SECRET');
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          
          this.logger.error(
            `Binance API error: ${status} - ${data.code} - ${data.msg}`,
            error.stack
          );
          
          throw new BinanceApiError(data.msg, {
            statusCode: status,
            errorCode: `BINANCE_ERROR_${data.code}`,
            details: data,
          });
        }
        
        this.logger.error(
          `Binance API error: ${error.message}`,
          error.stack
        );
        
        throw new BinanceApiError('Failed to connect to Binance API');
      }
    );
  }

  /**
   * Creates a signature for authenticated requests
   */
  private createSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Performs a public GET request to the Binance API
   */
  async get<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Performs an authenticated GET request to the Binance API
   */
  async getSecure<T>(endpoint: string, params: any = {}): Promise<T> {
    try {
      const timestamp = Date.now();
      const queryParams = {
        ...params,
        timestamp,
      };

      const queryString = new URLSearchParams(queryParams as any).toString();
      const signature = this.createSignature(queryString);
      
      const response: AxiosResponse<T> = await this.client.get(
        `${endpoint}?${queryString}&signature=${signature}`
      );
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Performs an authenticated POST request to the Binance API
   */
  async post<T>(endpoint: string, params: any = {}): Promise<T> {
    try {
      const timestamp = Date.now();
      const queryParams = {
        ...params,
        timestamp,
      };

      const queryString = new URLSearchParams(queryParams as any).toString();
      const signature = this.createSignature(queryString);
      
      const response: AxiosResponse<T> = await this.client.post(
        `${endpoint}?${queryString}&signature=${signature}`
      );
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches candlestick data from Binance
   */
  async getKlines(symbol: string, interval: string, options: {
    startTime?: number;
    endTime?: number;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const params = {
        symbol: symbol.toUpperCase(),
        interval,
        ...options,
      };

      return this.get<any[]>('/api/v3/klines', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches account information
   */
  async getAccountInfo(): Promise<any> {
    try {
      return this.getSecure<any>('/api/v3/account');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches exchange information
   */
  async getExchangeInfo(symbols?: string[]): Promise<any> {
    try {
      const params: any = {};
      
      if (symbols && symbols.length > 0) {
        params.symbols = JSON.stringify(symbols);
      }
      
      return this.get<any>('/api/v3/exchangeInfo', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Places a new order
   */
  async createOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT',
    options: {
      timeInForce?: 'GTC' | 'IOC' | 'FOK';
      quantity?: number;
      quoteOrderQty?: number;
      price?: number;
      newClientOrderId?: string;
      stopPrice?: number;
      icebergQty?: number;
      newOrderRespType?: 'ACK' | 'RESULT' | 'FULL';
    } = {}
  ): Promise<any> {
    try {
      const params = {
        symbol: symbol.toUpperCase(),
        side,
        type,
        ...options,
      };
      
      return this.post<any>('/api/v3/order', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancels an existing order
   */
  async cancelOrder(symbol: string, orderId?: number, origClientOrderId?: string): Promise<any> {
    try {
      const params: any = {
        symbol: symbol.toUpperCase(),
      };
      
      if (orderId) {
        params.orderId = orderId;
      } else if (origClientOrderId) {
        params.origClientOrderId = origClientOrderId;
      } else {
        throw new BinanceApiError('Either orderId or origClientOrderId must be provided');
      }
      
      return this.post<any>('/api/v3/order', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets current open orders
   */
  async getOpenOrders(symbol?: string): Promise<any[]> {
    try {
      const params: any = {};
      
      if (symbol) {
        params.symbol = symbol.toUpperCase();
      }
      
      return this.getSecure<any[]>('/api/v3/openOrders', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets 24hr ticker price change statistics
   */
  async get24hrTickerPriceChange(symbol?: string): Promise<any> {
    try {
      const params: any = {};
      
      if (symbol) {
        params.symbol = symbol.toUpperCase();
      }
      
      return this.get<any>('/api/v3/ticker/24hr', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets latest price for a symbol or symbols
   */
  async getSymbolPriceTicker(symbol?: string): Promise<any> {
    try {
      const params: any = {};
      
      if (symbol) {
        params.symbol = symbol.toUpperCase();
      }
      
      return this.get<any>('/api/v3/ticker/price', params);
    } catch (error) {
      throw error;
    }
  }
}
