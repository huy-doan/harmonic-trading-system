// 055. src/infrastructure/external/binance/binance-websocket.client.ts
import { Injectable, Logger } from '@nestjs/common';
import Binance, { ReconnectingWebSocketHandler } from 'binance-api-node';
import { EventEmitter } from 'events';
import { BinanceCredentials, StreamSubscription } from './binance.types';
import { CandleChartInterval } from 'binance-api-node';

@Injectable()
export class BinanceWebsocketClient {
  private readonly logger = new Logger(BinanceWebsocketClient.name);
  private client: ReturnType<typeof Binance>;
  private eventEmitter: EventEmitter = new EventEmitter();
  private subscriptions: Map<string, StreamSubscription> = new Map();
  private wsHandlers: Map<string, ReconnectingWebSocketHandler | Promise<ReconnectingWebSocketHandler>> = new Map();

  constructor() {
    this.eventEmitter.setMaxListeners(100); // Increase max listeners to handle multiple subscriptions
  }

  /**
   * Initialize the Binance WebSocket client
   */
  public initialize(credentials?: BinanceCredentials): void {
    this.client = Binance(credentials || {});
    this.logger.log('Binance WebSocket client initialized');
  }

  /**
   * Subscribe to candlestick/kline updates for a symbol and interval
   */
  public subscribeToKlines(symbol: string, interval: CandleChartInterval): StreamSubscription {
    const id = `kline_${symbol.toLowerCase()}_${interval}`;
    
    if (this.subscriptions.has(id)) {
      return this.subscriptions.get(id);
    }

    try {
      this.logger.log(`Subscribing to klines for ${symbol} with interval ${interval}`);
      
      const handler = this.client.ws.candles(symbol, interval, candle => {
        this.eventEmitter.emit(id, {
          symbol: candle.symbol,
          interval,
          openTime: candle.startTime,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          closeTime: candle.closeTime,
          quoteAssetVolume: candle.quoteVolume,
          trades: candle.trades,
          // Use the correct property names from the Candle type
          buyBaseAssetVolume: candle.buyVolume || '0',
          buyQuoteAssetVolume: candle.quoteBuyVolume || '0',
        });
      });

      // Store the original handler for cleanup later
      this.wsHandlers.set(id, handler);

      const subscription: StreamSubscription = {
        id,
        unsubscribe: () => {
          // Call the handler function directly
          const wsHandler = this.wsHandlers.get(id);
          if (wsHandler) {
            if (typeof wsHandler === 'function') {
              wsHandler();
            } else if (wsHandler instanceof Promise) {
              wsHandler.then(h => {
                if (typeof h === 'function') {
                  h();
                }
              }).catch(err => {
                this.logger.error(`Error unsubscribing from ${id}: ${err.message}`);
              });
            }
            this.wsHandlers.delete(id);
          }
        }
      };
      
      this.subscriptions.set(id, subscription);
      return subscription;
    } catch (error) {
      this.logger.error(`Error subscribing to klines: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Subscribe to ticker updates for a symbol
   */
  public subscribeToTicker(symbol: string): StreamSubscription {
    const id = `ticker_${symbol.toLowerCase()}`;
    
    if (this.subscriptions.has(id)) {
      return this.subscriptions.get(id);
    }

    try {
      this.logger.log(`Subscribing to ticker for ${symbol}`);

      const handler = this.client.ws.ticker(symbol, ticker => {
        this.eventEmitter.emit(id, ticker);
      });

      // Store the original handler for cleanup later
      this.wsHandlers.set(id, handler);

      const subscription: StreamSubscription = {
        id,
        unsubscribe: () => {
          // Call the handler function directly
          const wsHandler = this.wsHandlers.get(id);
          if (wsHandler) {
            if (typeof wsHandler === 'function') {
              wsHandler();
            } else if (wsHandler instanceof Promise) {
              wsHandler.then(h => {
                if (typeof h === 'function') {
                  h();
                }
              }).catch(err => {
                this.logger.error(`Error unsubscribing from ${id}: ${err.message}`);
              });
            }
            this.wsHandlers.delete(id);
          }
        }
      };
      
      this.subscriptions.set(id, subscription);
      return subscription;
    } catch (error) {
      this.logger.error(`Error subscribing to ticker: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Subscribe to all market mini tickers
   */
  public subscribeToAllMiniTickers(): StreamSubscription {
    const id = 'allMiniTickers';
    
    if (this.subscriptions.has(id)) {
      return this.subscriptions.get(id);
    }

    try {
      this.logger.log('Subscribing to all mini tickers');

      // The miniTicker method requires a callback function for the second parameter
      const handler = this.client.ws.miniTicker(
        null, // First parameter is symbol (null for all symbols)
        tickers => {
          this.eventEmitter.emit(id, tickers);
        }
      );

      // Store the original handler for cleanup later
      this.wsHandlers.set(id, handler);

      const subscription: StreamSubscription = {
        id,
        unsubscribe: () => {
          // Handle the Promise properly
          const wsHandler = this.wsHandlers.get(id);
          if (wsHandler) {
            if (typeof wsHandler === 'function') {
              wsHandler();
            } else if (wsHandler instanceof Promise) {
              wsHandler.then(h => {
                if (typeof h === 'function') {
                  h();
                }
              }).catch(err => {
                this.logger.error(`Error unsubscribing from ${id}: ${err.message}`);
              });
            }
            this.wsHandlers.delete(id);
          }
        }
      };
      
      this.subscriptions.set(id, subscription);
      return subscription;
    } catch (error) {
      this.logger.error(`Error subscribing to all mini tickers: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Subscribe to user account updates (requires authentication)
   */
  public subscribeToUserData(): StreamSubscription {
    const id = 'userData';
    
    if (this.subscriptions.has(id)) {
      return this.subscriptions.get(id);
    }

    try {
      this.logger.log('Subscribing to user data');

      const handler = this.client.ws.user(data => {
        this.eventEmitter.emit(id, data);
      });

      // Store the original handler for cleanup later
      this.wsHandlers.set(id, handler);

      const subscription: StreamSubscription = {
        id,
        unsubscribe: () => {
          // Handle the Promise properly
          const wsHandler = this.wsHandlers.get(id);
          if (wsHandler) {
            if (typeof wsHandler === 'function') {
              wsHandler();
            } else if (wsHandler instanceof Promise) {
              wsHandler.then(h => {
                if (typeof h === 'function') {
                  h();
                }
              }).catch(err => {
                this.logger.error(`Error unsubscribing from ${id}: ${err.message}`);
              });
            }
            this.wsHandlers.delete(id);
          }
        }
      };
      
      this.subscriptions.set(id, subscription);
      return subscription;
    } catch (error) {
      this.logger.error(`Error subscribing to user data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Register event listener for a specific subscription
   */
  public on(subscriptionId: string, listener: (data: any) => void): void {
    this.eventEmitter.on(subscriptionId, listener);
  }

  /**
   * Remove event listener for a specific subscription
   */
  public off(subscriptionId: string, listener: (data: any) => void): void {
    this.eventEmitter.off(subscriptionId, listener);
  }

  /**
   * Unsubscribe from a specific data stream
   */
  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      this.eventEmitter.removeAllListeners(subscriptionId);
      this.logger.log(`Unsubscribed from ${subscriptionId}`);
      return true;
    }
    return false;
  }

  /**
   * Unsubscribe from all data streams
   */
  public unsubscribeAll(): void {
    for (const [id, subscription] of this.subscriptions.entries()) {
      subscription.unsubscribe();
      this.eventEmitter.removeAllListeners(id);
    }
    this.subscriptions.clear();
    this.wsHandlers.clear();
    this.logger.log('Unsubscribed from all streams');
  }
}
