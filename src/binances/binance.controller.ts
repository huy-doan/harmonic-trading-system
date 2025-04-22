import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BinanceService } from './binance.service';
import { CandleChartInterval } from 'binance-api-node';

@ApiTags('binance')
@Controller('binance')
export class BinanceController {
  constructor(private readonly binanceService: BinanceService) {}

  @Get('prices')
  @ApiOperation({ summary: 'Get current prices for all symbols or a specific symbol' })
  @ApiQuery({ name: 'symbol', required: false, description: 'Symbol to get price for (e.g. BTCUSDT)' })
  @ApiResponse({ status: 200, description: 'Returns current prices' })
  async getPrices(@Query('symbol') symbol?: string) {
    return this.binanceService.getPrices(symbol);
  }

  @Get('ticker')
  @ApiOperation({ summary: 'Get 24hr ticker data for all symbols or a specific symbol' })
  @ApiQuery({ name: 'symbol', required: false, description: 'Symbol to get ticker for (e.g. BTCUSDT)' })
  @ApiResponse({ status: 200, description: 'Returns 24hr ticker data' })
  async getTicker(@Query('symbol') symbol?: string) {
    return this.binanceService.getTicker(symbol);
  }

  @Get('candles')
  @ApiOperation({ summary: 'Get historical candlestick data' })
  @ApiQuery({ name: 'symbol', required: true, description: 'Symbol (e.g. BTCUSDT)' })
  @ApiQuery({ name: 'interval', required: true, description: 'Candlestick interval (e.g. 1m, 5m, 1h, 1d)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit of results (default: 500, max: 1000)' })
  @ApiQuery({ name: 'startTime', required: false, description: 'Start time in milliseconds' })
  @ApiQuery({ name: 'endTime', required: false, description: 'End time in milliseconds' })
  @ApiResponse({ status: 200, description: 'Returns candlestick data' })
  async getCandles(
    @Query('symbol') symbol: string,
    @Query('interval') interval: CandleChartInterval,
    @Query('limit') limit?: number,
    @Query('startTime') startTime?: number,
    @Query('endTime') endTime?: number,
  ) {
    return this.binanceService.getCandles(symbol, interval, { limit, startTime, endTime });
  }

  @Get('symbols')
  @ApiOperation({ summary: 'Get available trading symbols' })
  @ApiResponse({ status: 200, description: 'Returns available trading symbols' })
  async getSymbols() {
    return this.binanceService.getSymbols();
  }

  @Get('account')
  @ApiOperation({ summary: 'Get account information including balances' })
  @ApiResponse({ status: 200, description: 'Returns account information' })
  async getAccountInfo() {
    return this.binanceService.getAccountInfo();
  }

  @Post('watch/symbol')
  @ApiOperation({ summary: 'Start watching a symbol for price updates' })
  @ApiResponse({ status: 200, description: 'Symbol is now being watched' })
  async watchSymbol(@Body() body: { symbol: string }) {
    return this.binanceService.watchSymbol(body.symbol);
  }

  @Delete('watch/symbol/:symbol')
  @ApiOperation({ summary: 'Stop watching a symbol' })
  @ApiParam({ name: 'symbol', description: 'Symbol to stop watching (e.g. BTCUSDT)' })
  @ApiResponse({ status: 200, description: 'Symbol is no longer being watched' })
  async unwatchSymbol(@Param('symbol') symbol: string) {
    return this.binanceService.unwatchSymbol(symbol);
  }

  @Post('watch/interval')
  @ApiOperation({ summary: 'Start watching an interval for all watched symbols' })
  @ApiResponse({ status: 200, description: 'Interval is now being watched' })
  async watchInterval(@Body() body: { interval: CandleChartInterval }) {
    return this.binanceService.watchInterval(body.interval);
  }

  @Delete('watch/interval/:interval')
  @ApiOperation({ summary: 'Stop watching an interval' })
  @ApiParam({ name: 'interval', description: 'Interval to stop watching (e.g. 1m, 5m, 1h, 1d)' })
  @ApiResponse({ status: 200, description: 'Interval is no longer being watched' })
  async unwatchInterval(@Param('interval') interval: CandleChartInterval) {
    return this.binanceService.unwatchInterval(interval);
  }

  @Post('orders/market-buy')
  @ApiOperation({ summary: 'Create a market buy order' })
  @ApiResponse({ status: 200, description: 'Order created successfully' })
  async marketBuy(@Body() body: { symbol: string; quantity: string }) {
    return this.binanceService.marketBuy(body.symbol, body.quantity);
  }

  @Post('orders/market-sell')
  @ApiOperation({ summary: 'Create a market sell order' })
  @ApiResponse({ status: 200, description: 'Order created successfully' })
  async marketSell(@Body() body: { symbol: string; quantity: string }) {
    return this.binanceService.marketSell(body.symbol, body.quantity);
  }

  @Post('orders/limit-buy')
  @ApiOperation({ summary: 'Create a limit buy order' })
  @ApiResponse({ status: 200, description: 'Order created successfully' })
  async limitBuy(@Body() body: { symbol: string; quantity: string; price: string; timeInForce?: 'GTC' | 'IOC' | 'FOK' }) {
    return this.binanceService.limitBuy(body.symbol, body.quantity, body.price, body.timeInForce);
  }

  @Post('orders/limit-sell')
  @ApiOperation({ summary: 'Create a limit sell order' })
  @ApiResponse({ status: 200, description: 'Order created successfully' })
  async limitSell(@Body() body: { symbol: string; quantity: string; price: string; timeInForce?: 'GTC' | 'IOC' | 'FOK' }) {
    return this.binanceService.limitSell(body.symbol, body.quantity, body.price, body.timeInForce);
  }

  @Delete('orders/:symbol/:orderId')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'symbol', description: 'Symbol (e.g. BTCUSDT)' })
  @ApiParam({ name: 'orderId', description: 'Order ID to cancel' })
  @ApiResponse({ status: 200, description: 'Order canceled successfully' })
  async cancelOrder(@Param('symbol') symbol: string, @Param('orderId') orderId: number) {
    return this.binanceService.cancelOrder(symbol, orderId);
  }
}
