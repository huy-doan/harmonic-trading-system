// 138. src/domain/market-analysis/controllers/market.controller.ts
import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { MarketAnalyzerService } from '../services/market-analyzer.service';
import { TrendAnalyzerService } from '../services/trend-analyzer.service';
import { GetHistoricalCandlesticksDto, CandlestickDto, TrendAnalysisResultDto, TimeframeEnum } from '../dtos/market-data.dto';
import { ParsePositiveIntPipe } from '@shared/pipes/parse-int.pipe';

@ApiTags('Market Analysis')
@Controller('market-analysis')
export class MarketController {
  constructor(
    private readonly marketAnalyzerService: MarketAnalyzerService,
    private readonly trendAnalyzerService: TrendAnalyzerService
  ) {}

  @Get('analyze')
  @ApiOperation({ summary: 'Analyze market data for a symbol and timeframe' })
  @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
  @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1m, 5m, 1h)', enum: TimeframeEnum })
  @ApiResponse({ status: 200, description: 'Market analysis data' })
  async analyzeMarket(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string
  ) {
    return this.marketAnalyzerService.analyzeMarket(symbol, timeframe);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Analyze market trend for a symbol and timeframe' })
  @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
  @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1m, 5m, 1h)', enum: TimeframeEnum })
  @ApiResponse({ status: 200, description: 'Trend analysis result', type: TrendAnalysisResultDto })
  async analyzeTrend(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string
  ): Promise<TrendAnalysisResultDto> {
    return this.trendAnalyzerService.analyzeTrend(symbol, timeframe);
  }

  @Get('data')
  @ApiOperation({ summary: 'Get historical market data from database' })
  @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
  @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1m, 5m, 1h)', enum: TimeframeEnum })
  @ApiQuery({ name: 'startTime', required: true, description: 'Start time in ISO format' })
  @ApiQuery({ name: 'endTime', required: false, description: 'End time in ISO format' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of records to return' })
  @ApiResponse({ status: 200, description: 'Array of market data entries', type: [CandlestickDto] })
  async getMarketData(
    @Query() query: GetHistoricalCandlesticksDto,
    @Query('limit', new ParsePositiveIntPipe()) limit: number = 1000
  ) {
    const startTime = new Date(query.startTime);
    const endTime = query.endTime ? new Date(query.endTime) : new Date();
    
    return this.marketAnalyzerService.getMarketData(
      query.symbol,
      query.timeframe,
      startTime,
      endTime,
      limit
    );
  }

  @Get('metrics/:symbol/:timeframe')
  @ApiOperation({ summary: 'Get latest market metrics for a symbol and timeframe' })
  @ApiParam({ name: 'symbol', description: 'Trading symbol (e.g., BTCUSDT)' })
  @ApiParam({ name: 'timeframe', description: 'Candlestick interval (e.g., 1m, 5m, 1h)', enum: TimeframeEnum })
  @ApiResponse({ status: 200, description: 'Latest market metrics' })
  async getMarketMetrics(
    @Param('symbol') symbol: string,
    @Param('timeframe') timeframe: string
  ) {
    return this.marketAnalyzerService.getLatestMarketMetrics(symbol, timeframe);
  }

  @Post('analyze/batch')
  @ApiOperation({ summary: 'Analyze multiple symbols and timeframes' })
  @ApiResponse({ status: 200, description: 'Batch analysis results' })
  async analyzeBatch(
    @Body() body: {
      symbols: string[];
      timeframes: string[];
    }
  ) {
    const results = [];
    
    for (const symbol of body.symbols) {
      for (const timeframe of body.timeframes) {
        try {
          const analysis = await this.marketAnalyzerService.analyzeMarket(symbol, timeframe);
          results.push(analysis);
        } catch (error) {
          results.push({
            symbol,
            timeframe,
            error: error.message,
            success: false
          });
        }
      }
    }
    
    return {
      success: true,
      count: results.length,
      results
    };
  }

  @Post('trend/batch')
  @ApiOperation({ summary: 'Analyze trends for multiple symbols and timeframes' })
  @ApiResponse({ status: 200, description: 'Batch trend analysis results', type: TrendAnalysisResultDto, isArray: true })
  async analyzeTrendBatch(
    @Body() body: {
      symbols: string[];
      timeframes: string[];
    }
  ) {
    const results = [];
    
    for (const symbol of body.symbols) {
      for (const timeframe of body.timeframes) {
        try {
          const analysis = await this.trendAnalyzerService.analyzeTrend(symbol, timeframe);
          results.push(analysis);
        } catch (error) {
          results.push({
            symbol,
            timeframe,
            error: error.message,
            success: false
          });
        }
      }
    }
    
    return {
      success: true,
      count: results.length,
      results
    };
  }
  
  @Get('timeframes')
  @ApiOperation({ summary: 'Get supported timeframes' })
  @ApiResponse({ status: 200, description: 'List of supported timeframes', type: [String] })
  getTimeframes() {
    return Object.values(TimeframeEnum);
  }
  
  @Post('watch')
  @ApiOperation({ summary: 'Start watching a symbol with specified timeframes' })
  @ApiResponse({ status: 200, description: 'Symbol watching status' })
  async watchSymbol(
    @Body() body: {
      symbol: string;
      timeframes?: string[];
    }
  ) {
    await this.marketAnalyzerService.watchSymbol(body.symbol, body.timeframes);
    return {
      success: true,
      message: `Now watching ${body.symbol} with timeframes: ${body.timeframes?.join(', ') || 'all available'}`
    };
  }
}
