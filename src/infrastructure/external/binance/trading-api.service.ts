// 059. src/infrastructure/external/binance/trading-api.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BinanceAdapter } from './binance.adapter';
import { BinanceRateLimiter } from './rate-limiter';

@Injectable()
export class TradingApiService {
  private readonly logger = new Logger(TradingApiService.name);
  private readonly isSimulationMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly binanceAdapter: BinanceAdapter,
    private readonly rateLimiter: BinanceRateLimiter
  ) {
    // Check if simulation mode is enabled
    this.isSimulationMode = this.configService.get<string>('TRADING_MODE') !== 'live';
    
    if (this.isSimulationMode) {
      this.logger.warn('Trading API is running in SIMULATION mode. No real trades will be executed.');
    } else {
      this.logger.log('Trading API is running in LIVE mode. Real trades will be executed.');
    }
  }

  /**
   * Executes a market buy order
   */
  async executeBuyMarketOrder(symbol: string, quantity: number): Promise<any> {
    await this.rateLimiter.acquirePermit('ORDERS');
    
    if (this.isSimulationMode) {
      const currentPrice = await this.binanceAdapter.getLatestPrice(symbol);
      
      this.logger.log(`[SIMULATION] Market Buy Order: ${symbol}, Quantity: ${quantity}, Price: ${currentPrice}`);
      
      return {
        symbol,
        orderId: Math.floor(Math.random() * 1000000),
        clientOrderId: `sim_${Date.now()}`,
        transactTime: Date.now(),
        price: currentPrice,
        origQty: quantity,
        executedQty: quantity,
        status: 'FILLED',
        type: 'MARKET',
        side: 'BUY',
        simulation: true
      };
    }

    try {
      this.logger.log(`Executing Market Buy Order: ${symbol}, Quantity: ${quantity}`);
      return await this.binanceAdapter.createMarketOrder(symbol, 'BUY', quantity);
    } catch (error) {
      this.logger.error(`Failed to execute buy market order for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Executes a market sell order
   */
  async executeSellMarketOrder(symbol: string, quantity: number): Promise<any> {
    await this.rateLimiter.acquirePermit('ORDERS');
    
    if (this.isSimulationMode) {
      const currentPrice = await this.binanceAdapter.getLatestPrice(symbol);
      
      this.logger.log(`[SIMULATION] Market Sell Order: ${symbol}, Quantity: ${quantity}, Price: ${currentPrice}`);
      
      return {
        symbol,
        orderId: Math.floor(Math.random() * 1000000),
        clientOrderId: `sim_${Date.now()}`,
        transactTime: Date.now(),
        price: currentPrice,
        origQty: quantity,
        executedQty: quantity,
        status: 'FILLED',
        type: 'MARKET',
        side: 'SELL',
        simulation: true
      };
    }

    try {
      this.logger.log(`Executing Market Sell Order: ${symbol}, Quantity: ${quantity}`);
      return await this.binanceAdapter.createMarketOrder(symbol, 'SELL', quantity);
    } catch (error) {
      this.logger.error(`Failed to execute sell market order for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Places a limit buy order
   */
  async placeBuyLimitOrder(symbol: string, quantity: number, price: number): Promise<any> {
    await this.rateLimiter.acquirePermit('ORDERS');
    
    if (this.isSimulationMode) {
      this.logger.log(`[SIMULATION] Limit Buy Order: ${symbol}, Quantity: ${quantity}, Price: ${price}`);
      
      return {
        symbol,
        orderId: Math.floor(Math.random() * 1000000),
        clientOrderId: `sim_${Date.now()}`,
        transactTime: Date.now(),
        price: price,
        origQty: quantity,
        executedQty: 0,
        status: 'NEW',
        type: 'LIMIT',
        side: 'BUY',
        simulation: true
      };
    }

    try {
      this.logger.log(`Placing Limit Buy Order: ${symbol}, Quantity: ${quantity}, Price: ${price}`);
      return await this.binanceAdapter.createLimitOrder(symbol, 'BUY', quantity, price);
    } catch (error) {
      this.logger.error(`Failed to place buy limit order for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Places a limit sell order
   */
  async placeSellLimitOrder(symbol: string, quantity: number, price: number): Promise<any> {
    await this.rateLimiter.acquirePermit('ORDERS');
    
    if (this.isSimulationMode) {
      this.logger.log(`[SIMULATION] Limit Sell Order: ${symbol}, Quantity: ${quantity}, Price: ${price}`);
      
      return {
        symbol,
        orderId: Math.floor(Math.random() * 1000000),
        clientOrderId: `sim_${Date.now()}`,
        transactTime: Date.now(),
        price: price,
        origQty: quantity,
        executedQty: 0,
        status: 'NEW',
        type: 'LIMIT',
        side: 'SELL',
        simulation: true
      };
    }

    try {
      this.logger.log(`Placing Limit Sell Order: ${symbol}, Quantity: ${quantity}, Price: ${price}`);
      return await this.binanceAdapter.createLimitOrder(symbol, 'SELL', quantity, price);
    } catch (error) {
      this.logger.error(`Failed to place sell limit order for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Cancels an existing order
   */
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    await this.rateLimiter.acquirePermit('ORDERS');
    
    if (this.isSimulationMode) {
      this.logger.log(`[SIMULATION] Cancel Order: ${symbol}, OrderId: ${orderId}`);
      
      return {
        symbol,
        orderId,
        status: 'CANCELED',
        clientOrderId: `sim_${orderId}`,
        simulation: true
      };
    }

    try {
      this.logger.log(`Canceling Order: ${symbol}, OrderId: ${orderId}`);
      return await this.binanceAdapter.cancelOrder(symbol, orderId);
    } catch (error) {
      this.logger.error(`Failed to cancel order ${orderId} for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get open orders for a symbol
   */
  async getOpenOrders(symbol?: string): Promise<any[]> {
    await this.rateLimiter.acquirePermit('REQUEST_WEIGHT', 3);
    
    if (this.isSimulationMode) {
      this.logger.log(`[SIMULATION] Get Open Orders${symbol ? ` for ${symbol}` : ''}`);
      return []; // Return empty array in simulation mode
    }

    try {
      return await this.binanceAdapter.getOpenOrders(symbol);
    } catch (error) {
      this.logger.error(`Failed to get open orders${symbol ? ` for ${symbol}` : ''}`, error);
      throw error;
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    await this.rateLimiter.acquirePermit('REQUEST_WEIGHT', 10);
    
    if (this.isSimulationMode) {
      // Return simulated account info
      const simulatedBalance = parseFloat(this.configService.get<string>('SIMULATION_BALANCE', '10000'));
      
      this.logger.log(`[SIMULATION] Get Account Info - Simulated Balance: ${simulatedBalance} USDT`);
      
      return {
        makerCommission: 10,
        takerCommission: 10,
        buyerCommission: 0,
        sellerCommission: 0,
        canTrade: true,
        canWithdraw: false,
        canDeposit: false,
        updateTime: Date.now(),
        accountType: 'SPOT',
        balances: [
          {
            asset: 'USDT',
            free: simulatedBalance.toString(),
            locked: '0.00000000'
          },
          {
            asset: 'BTC',
            free: '0.00000000',
            locked: '0.00000000'
          },
          {
            asset: 'ETH',
            free: '0.00000000',
            locked: '0.00000000'
          }
        ],
        simulation: true
      };
    }

    try {
      return await this.binanceAdapter.getAccountInfo();
    } catch (error) {
      this.logger.error('Failed to get account information', error);
      throw error;
    }
  }

  /**
   * Check if trading is currently in simulation mode
   */
  isSimulation(): boolean {
    return this.isSimulationMode;
  }
}