// 055. src/infrastructure/external/binance/binance-websocket.client.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BinanceWebsocketClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BinanceWebsocketClient.name);
  private readonly baseUrl: string = 'wss://stream.binance.com:9443/ws';
  private ws: WebSocket | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private subscriptions: string[] = [];
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;
  private readonly reconnectDelay: number = 5000;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connect() {
    try {
      this.logger.log('Connecting to Binance WebSocket');
      this.ws = new WebSocket(this.baseUrl);

      this.ws.on('open', () => {
        this.logger.log('Connected to Binance WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Resubscribe to previous streams if any
        if (this.subscriptions.length > 0) {
          this.subscribeToStreams(this.subscriptions);
        }

        // Start ping interval to keep connection alive
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.ping();
          }
        }, 30000);
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Handle different message types
          if (message.e) {
            const eventType = message.e;
            this.eventEmitter.emit(`binance.${eventType}`, message);
          }
        } catch (error) {
          this.logger.error('Error parsing WebSocket message', error);
        }
      });

      this.ws.on('error', (error) => {
        this.logger.error('Binance WebSocket error', error);
      });

      this.ws.on('close', (code, reason) => {
        this.logger.warn(`Binance WebSocket closed: ${code} - ${reason}`);
        this.isConnected = false;
        this.cleanup();
        this.scheduleReconnect();
      });

    } catch (error) {
      this.logger.error('Failed to connect to Binance WebSocket', error);
      this.scheduleReconnect();
    }
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      
      this.logger.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.logger.error('Max reconnect attempts reached, giving up');
    }
  }

  private disconnect() {
    this.logger.log('Disconnecting from Binance WebSocket');
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    
    this.cleanup();
  }

  private subscribeToStreams(streams: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: streams,
      id: Date.now(),
    };

    this.ws.send(JSON.stringify(subscribeMessage));
  }

  private unsubscribeFromStreams(streams: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('Cannot unsubscribe: WebSocket not connected');
      return;
    }

    const unsubscribeMessage = {
      method: 'UNSUBSCRIBE',
      params: streams,
      id: Date.now(),
    };

    this.ws.send(JSON.stringify(unsubscribeMessage));
  }

  /**
   * Subscribe to a specific symbol candlestick stream
   */
  subscribeToKline(symbol: string, interval: string) {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    
    if (!this.subscriptions.includes(stream)) {
      this.subscriptions.push(stream);
      
      if (this.isConnected) {
        this.subscribeToStreams([stream]);
      }
    }
  }

  /**
   * Subscribe to a specific symbol mini ticker stream
   */
  subscribeToMiniTicker(symbol: string) {
    const stream = `${symbol.toLowerCase()}@miniTicker`;
    
    if (!this.subscriptions.includes(stream)) {
      this.subscriptions.push(stream);
      
      if (this.isConnected) {
        this.subscribeToStreams([stream]);
      }
    }
  }

  /**
   * Subscribe to all market mini tickers stream
   */
  subscribeToAllMiniTickers() {
    const stream = '!miniTicker@arr';
    
    if (!this.subscriptions.includes(stream)) {
      this.subscriptions.push(stream);
      
      if (this.isConnected) {
        this.subscribeToStreams([stream]);
      }
    }
  }

  /**
   * Subscribe to a specific symbol book ticker stream
   */
  subscribeToBookTicker(symbol: string) {
    const stream = `${symbol.toLowerCase()}@bookTicker`;
    
    if (!this.subscriptions.includes(stream)) {
      this.subscriptions.push(stream);
      
      if (this.isConnected) {
        this.subscribeToStreams([stream]);
      }
    }
  }

  /**
   * Subscribe to a specific symbol partial book depth stream
   */
  subscribeToPartialBookDepth(symbol: string, level: 5 | 10 | 20) {
    const stream = `${symbol.toLowerCase()}@depth${level}`;
    
    if (!this.subscriptions.includes(stream)) {
      this.subscriptions.push(stream);
      
      if (this.isConnected) {
        this.subscribeToStreams([stream]);
      }
    }
  }

  /**
   * Unsubscribe from a specific stream
   */
  unsubscribe(stream: string) {
    const index = this.subscriptions.indexOf(stream);
    
    if (index !== -1) {
      this.subscriptions.splice(index, 1);
      
      if (this.isConnected) {
        this.unsubscribeFromStreams([stream]);
      }
    }
  }

  /**
   * Get current subscription list
   */
  getSubscriptions(): string[] {
    return [...this.subscriptions];
  }

  /**
   * Check if connection is established
   */
  isConnectedToWebSocket(): boolean {
    return this.isConnected;
  }
}
