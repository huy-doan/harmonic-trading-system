// 153. src/binances/binance.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { BinanceService } from './binance.service';
import { ParsePositiveIntPipe } from '@shared/pipes/parse-int.pipe';

@ApiTags('Binance')
@Controller('binance')
export class BinanceController {
  constructor(private readonly binanceService: BinanceService) {}

  @Get('market/candles')
  @ApiOperation({ summary: 'Get candlestick data for a symbol and timeframe' })
  @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
  @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1m, 5m, 1h)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of candles to return' })
  async getCandlesticks(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string,
    @Query('limit', new ParsePositiveIntPipe()) limit: number = 100
  ) {
    return this.binanceService.getCandlesticks(symbol, timeframe, limit);
  }

  @Get('market/price')
  @ApiOperation({ summary: 'Get latest price for a symbol' })
  @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
  async getLatestPrice(@Query('symbol') symbol: string) {
    const price = await this.binanceService.getLatestPrice(symbol);
    return { symbol, price };
  }

  @Get('market/symbols')
  @ApiOperation({ summary: 'Get available trading symbols' })
  async getTradingSymbols() {
    return this.binanceService.getTradingSymbols();
  }

  @Get('market/tracked-symbols')
  @ApiOperation({ summary: 'Get currently tracked symbols' })
  async getTrackedSymbols() {
    return this.binanceService.getTrackedSymbols();
  }

  @Post('market/symbols')
  @ApiOperation({ summary: 'Add a new symbol to track' })
  async addTrackedSymbol(@Body() data: { symbol: string }) {
    await this.binanceService.addTrackedSymbol(data.symbol);
    return { success: true, message: `Symbol ${data.symbol} is now being tracked` };
  }

  @Delete('market/symbols/:symbol')
  @ApiOperation({ summary: 'Remove a symbol from tracking' })
  @ApiParam({ name: 'symbol', description: 'Symbol to stop tracking' })
  async removeTrackedSymbol(@Param('symbol') symbol: string) {
    this.binanceService.removeTrackedSymbol(symbol);
    return { success: true, message: `Symbol ${symbol} is no longer being tracked` };
  }

  @Get('market/timeframes')
  @ApiOperation({ summary: 'Get available timeframes' })
  async getTimeframes() {
    return this.binanceService.getTimeframes();
  }

  @Get('account')
  @ApiOperation({ summary: 'Get account information' })
  async getAccountInfo() {
    return this.binanceService.getAccountInfo();
  }

  @Get('trading/status')
  @ApiOperation({ summary: 'Get trading mode status' })
  async getTradingStatus() {
    const isSimulation = this.binanceService.isSimulationMode();
    return {
      mode: isSimulation ? 'simulation' : 'live',
      message: isSimulation 
        ? 'Trading is in simulation mode. No real trades will be executed.' 
        : 'Trading is in live mode. Real trades will be executed.'
    };
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get open orders' })
  @ApiQuery({ name: 'symbol', required: false, description: 'Trading symbol (e.g., BTCUSDT)' })
  async getOpenOrders(@Query('symbol') symbol?: string) {
    return this.binanceService.getOpenOrders(symbol);
  }

  @Post('orders/market')
  @ApiOperation({ summary: 'Place a market order' })
  async placeMarketOrder(
    @Body() order: { 
      symbol: string; 
      side: 'BUY' | 'SELL'; 
      quantity: number;
    }
  ) {
    return this.binanceService.placeMarketOrder(
      order.symbol, 
      order.side,
      order.quantity
    );
  }

  @Post('orders/limit')
  @ApiOperation({ summary: 'Place a limit order' })
  async placeLimitOrder(
    @Body() order: { 
      symbol: string; 
      side: 'BUY' | 'SELL'; 
      quantity: number;
      price: number;
    }
  ) {
    return this.binanceService.placeLimitOrder(
      order.symbol, 
      order.side,
      order.quantity,
      order.price
    );
  }

  @Delete('orders/:symbol/:orderId')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'symbol', description: 'Trading symbol (e.g., BTCUSDT)' })
  @ApiParam({ name: 'orderId', description: 'Order ID to cancel' })
  async cancelOrder(
    @Param('symbol') symbol: string,
    @Param('orderId', new ParsePositiveIntPipe()) orderId: number
  ) {
    return this.binanceService.cancelOrder(symbol, orderId);
  }

  @Get('exchange-info')
  @ApiOperation({ summary: 'Get exchange information' })
  @ApiQuery({ name: 'symbols', required: false, description: 'Comma-separated list of symbols' })
  async getExchangeInfo(@Query('symbols') symbolsQuery?: string) {
    const symbols = symbolsQuery ? symbolsQuery.split(',') : undefined;
    return this.binanceService.getExchangeInfo(symbols);
  }

  @Get('market/historical')
  @ApiOperation({ summary: 'Get historical candlestick data' })
  @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
  @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1m, 5m, 1h)' })
  @ApiQuery({ name: 'startTime', required: true, description: 'Start time in ISO format or timestamp' })
  @ApiQuery({ name: 'endTime', required: false, description: 'End time in ISO format or timestamp' })
  async getHistoricalCandlesticks(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime?: string
  ) {
    const startDate = new Date(startTime);
    const endDate = endTime ? new Date(endTime) : new Date();
    
    return this.binanceService.getHistoricalCandlesticks(symbol, timeframe, startDate, endDate);
  }

  @Get('market/24hr')
  @ApiOperation({ summary: 'Get 24hr ticker price change statistics' })
  @ApiQuery({ name: 'symbol', required: false, description: 'Trading symbol (e.g., BTCUSDT)' })
  async get24hrTickerPriceChange(@Query('symbol') symbol?: string) {
    return this.binanceService.get24hrTickerPriceChange(symbol);
  }
}
