// 112. src/domain/technical-indicators/controllers/indicator.controller.ts
import { 
    Controller, 
    Get, 
    Post, 
    Query, 
    Body, 
    ValidationPipe,
    ParseIntPipe
  } from '@nestjs/common';
  import { 
    ApiTags, 
    ApiOperation, 
    ApiQuery, 
    ApiResponse, 
    ApiBody 
  } from '@nestjs/swagger';
  import { IchimokuService } from '../services/ichimoku.service';
  import { RSIService } from '../services/rsi.service';
  import { MACDService } from '../services/macd.service';
  import { CalculateIchimokuDto, IchimokuResultDto } from '../dtos/ichimoku.dto';
  import { ParsePositiveIntPipe } from '@shared/pipes/parse-int.pipe';
  
  @ApiTags('Technical Indicators')
  @Controller('indicators')
  export class IndicatorController {
    constructor(
      private readonly ichimokuService: IchimokuService,
      private readonly rsiService: RSIService,
      private readonly macdService: MACDService
    ) {}
  
    // Ichimoku Cloud endpoints
    @Post('ichimoku/calculate')
    @ApiOperation({ summary: 'Calculate Ichimoku Cloud indicator' })
    @ApiBody({ type: CalculateIchimokuDto })
    @ApiResponse({ status: 200, description: 'Returns calculated Ichimoku values', type: [IchimokuResultDto] })
    async calculateIchimoku(@Body(ValidationPipe) params: CalculateIchimokuDto) {
      return this.ichimokuService.calculateIchimoku(params);
    }
  
    @Get('ichimoku')
    @ApiOperation({ summary: 'Get historical Ichimoku Cloud data' })
    @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
    @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1h, 4h, 1d)' })
    @ApiQuery({ name: 'startTime', required: false, description: 'Start timestamp in milliseconds' })
    @ApiQuery({ name: 'endTime', required: false, description: 'End timestamp in milliseconds' })
    @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
    @ApiResponse({ status: 200, description: 'Returns historical Ichimoku data', type: [IchimokuResultDto] })
    async getIchimokuData(
      @Query('symbol') symbol: string,
      @Query('timeframe') timeframe: string,
      @Query('startTime') startTime?: number,
      @Query('endTime') endTime?: number,
      @Query('limit', new ParsePositiveIntPipe()) limit: number = 100
    ) {
      return this.ichimokuService.getIchimokuData(symbol, timeframe, startTime, endTime, limit);
    }
  
    // RSI endpoints
    @Get('rsi/calculate')
    @ApiOperation({ summary: 'Calculate RSI indicator' })
    @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
    @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1h, 4h, 1d)' })
    @ApiQuery({ name: 'period', required: false, description: 'RSI period' })
    @ApiQuery({ name: 'overbought', required: false, description: 'Overbought threshold' })
    @ApiQuery({ name: 'oversold', required: false, description: 'Oversold threshold' })
    @ApiQuery({ name: 'startTime', required: false, description: 'Start timestamp in milliseconds' })
    @ApiQuery({ name: 'endTime', required: false, description: 'End timestamp in milliseconds' })
    @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
    @ApiResponse({ status: 200, description: 'Returns calculated MACD values' })
    async calculateMACD(
      @Query('symbol') symbol: string,
      @Query('timeframe') timeframe: string,
      @Query('fastPeriod', new ParsePositiveIntPipe()) fastPeriod: number = 12,
      @Query('slowPeriod', new ParsePositiveIntPipe()) slowPeriod: number = 26,
      @Query('signalPeriod', new ParsePositiveIntPipe()) signalPeriod: number = 9,
      @Query('startTime') startTime?: number,
      @Query('endTime') endTime?: number,
      @Query('limit', new ParsePositiveIntPipe()) limit: number = 100
    ) {
      return this.macdService.calculateMACD(
        symbol, 
        timeframe, 
        fastPeriod, 
        slowPeriod, 
        signalPeriod, 
        startTime, 
        endTime, 
        limit
      );
    }
  
    @Get('macd')
    @ApiOperation({ summary: 'Get historical MACD data' })
    @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
    @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1h, 4h, 1d)' })
    @ApiQuery({ name: 'startTime', required: false, description: 'Start timestamp in milliseconds' })
    @ApiQuery({ name: 'endTime', required: false, description: 'End timestamp in milliseconds' })
    @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
    @ApiResponse({ status: 200, description: 'Returns historical MACD data' })
    async getMACDData(
      @Query('symbol') symbol: string,
      @Query('timeframe') timeframe: string,
      @Query('startTime') startTime?: number,
      @Query('endTime') endTime?: number,
      @Query('limit', new ParsePositiveIntPipe()) limit: number = 100
    ) {
      return this.macdService.getMACDData(symbol, timeframe, startTime, endTime, limit);
    }
  
    // Combined analysis endpoint
    @Get('analyze')
    @ApiOperation({ summary: 'Perform combined indicator analysis' })
    @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
    @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1h, 4h, 1d)' })
    @ApiResponse({ status: 200, description: 'Returns combined technical analysis' })
    async analyzeTechnicalIndicators(
      @Query('symbol') symbol: string,
      @Query('timeframe') timeframe: string
    ) {
      try {
        // Calculate indicators (limited to latest data)
        const [ichimokuData, rsiData, macdData] = await Promise.all([
          this.ichimokuService.calculateIchimoku({
            symbol,
            timeframe,
            limit: 1,
          }),
          this.rsiService.calculateRSI(symbol, timeframe, 14, 70, 30, undefined, undefined, 1),
          this.macdService.calculateMACD(symbol, timeframe, 12, 26, 9, undefined, undefined, 1)
        ]);
  
        // Get the latest data point from each
        const latestIchimoku = ichimokuData.length > 0 ? ichimokuData[0] : null;
        const latestRSI = rsiData.length > 0 ? rsiData[0] : null;
        const latestMACD = macdData.length > 0 ? macdData[0] : null;
  
        // Perform combined analysis
        let overallSignal = 'NEUTRAL';
        let bullishSignals = 0;
        let bearishSignals = 0;
        let overallStrength = 0;
        let signalCount = 0;
  
        // Analyze Ichimoku
        if (latestIchimoku) {
          signalCount++;
          overallStrength += latestIchimoku.strength || 50;
          
          if (latestIchimoku.signal?.includes('BULLISH')) {
            bullishSignals++;
          } else if (latestIchimoku.signal?.includes('BEARISH')) {
            bearishSignals++;
          }
        }
  
        // Analyze RSI
        if (latestRSI) {
          signalCount++;
          overallStrength += latestRSI.values.strength;
          
          if (latestRSI.values.signal === 'OVERSOLD') {
            bullishSignals++; // Oversold can indicate potential reversal to upside
          } else if (latestRSI.values.signal === 'OVERBOUGHT') {
            bearishSignals++; // Overbought can indicate potential reversal to downside
          } else if (latestRSI.values.signal === 'BULLISH') {
            bullishSignals++;
          } else if (latestRSI.values.signal === 'BEARISH') {
            bearishSignals++;
          }
        }
  
        // Analyze MACD
        if (latestMACD) {
          signalCount++;
          overallStrength += latestMACD.values.strength;
          
          if (latestMACD.values.trend?.includes('BULLISH')) {
            bullishSignals++;
          } else if (latestMACD.values.trend?.includes('BEARISH')) {
            bearishSignals++;
          }
        }
  
        // Determine overall signal
        if (bullishSignals > bearishSignals) {
          overallSignal = bullishSignals > signalCount / 2 ? 'STRONG_BULLISH' : 'BULLISH';
        } else if (bearishSignals > bullishSignals) {
          overallSignal = bearishSignals > signalCount / 2 ? 'STRONG_BEARISH' : 'BEARISH';
        }
  
        // Calculate average strength
        overallStrength = signalCount > 0 ? overallStrength / signalCount : 50;
  
        return {
          symbol,
          timeframe,
          timestamp: new Date().toISOString(),
          analysis: {
            overallSignal,
            overallStrength,
            bullishSignals,
            bearishSignals,
            totalSignals: signalCount
          },
          indicators: {
            ichimoku: latestIchimoku,
            rsi: latestRSI,
            macd: latestMACD
          }
        };
      } catch (error) {
        return {
          symbol,
          timeframe,
          timestamp: new Date().toISOString(),
          error: error.message,
          status: 'ERROR'
        };
      }
    }
  }d RSI values' })
    async calculateRSI(
      @Query('symbol') symbol: string,
      @Query('timeframe') timeframe: string,
      @Query('period', new ParsePositiveIntPipe()) period: number = 14,
      @Query('overbought', new ParsePositiveIntPipe()) overbought: number = 70,
      @Query('oversold', new ParsePositiveIntPipe()) oversold: number = 30,
      @Query('startTime') startTime?: number,
      @Query('endTime') endTime?: number,
      @Query('limit', new ParsePositiveIntPipe()) limit: number = 100
    ) {
      return this.rsiService.calculateRSI(
        symbol, 
        timeframe, 
        period, 
        overbought, 
        oversold, 
        startTime, 
        endTime, 
        limit
      );
    }
  
    @Get('rsi')
    @ApiOperation({ summary: 'Get historical RSI data' })
    @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
    @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1h, 4h, 1d)' })
    @ApiQuery({ name: 'startTime', required: false, description: 'Start timestamp in milliseconds' })
    @ApiQuery({ name: 'endTime', required: false, description: 'End timestamp in milliseconds' })
    @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
    @ApiResponse({ status: 200, description: 'Returns historical RSI data' })
    async getRSIData(
      @Query('symbol') symbol: string,
      @Query('timeframe') timeframe: string,
      @Query('startTime') startTime?: number,
      @Query('endTime') endTime?: number,
      @Query('limit', new ParsePositiveIntPipe()) limit: number = 100
    ) {
      return this.rsiService.getRSIData(symbol, timeframe, startTime, endTime, limit);
    }
  
    // MACD endpoints
    @Get('macd/calculate')
    @ApiOperation({ summary: 'Calculate MACD indicator' })
    @ApiQuery({ name: 'symbol', required: true, description: 'Trading symbol (e.g., BTCUSDT)' })
    @ApiQuery({ name: 'timeframe', required: true, description: 'Candlestick interval (e.g., 1h, 4h, 1d)' })
    @ApiQuery({ name: 'fastPeriod', required: false, description: 'Fast EMA period' })
    @ApiQuery({ name: 'slowPeriod', required: false, description: 'Slow EMA period' })
    @ApiQuery({ name: 'signalPeriod', required: false, description: 'Signal EMA period' })
    @ApiQuery({ name: 'startTime', required: false, description: 'Start timestamp in milliseconds' })
    @ApiQuery({ name: 'endTime', required: false, description: 'End timestamp in milliseconds' })
    @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
    @ApiResponse({ status: 200, description: 'Returns calculate
        