// 121. src/domain/trading/controllers/trading.controller.ts
import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Body, 
    Param, 
    Query, 
    UseGuards,
    ParseUUIDPipe,
    ValidationPipe
  } from '@nestjs/common';
  import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiParam, 
    ApiBody, 
    ApiQuery 
  } from '@nestjs/swagger';
  import { TradeService } from '../services/trade.service';
  import { TradeSetupService } from '../services/trade-setup.service';
  import { TradeExecutorService } from '../services/trade-executor.service';
  import { 
    CreateTradeDto, 
    UpdateTradeDto, 
    TradeResponseDto,
    TradeStatsDto
  } from '../dtos/trade.dto';
  import { 
    CreateTradeSetupDto, 
    UpdateTradeSetupDto, 
    TradeSetupResponseDto,
    TradeSetupFilterDto
  } from '../dtos/trade-setup.dto';
  import { ParsePositiveIntPipe } from '@shared/pipes/parse-int.pipe';
  
  @ApiTags('Trading')
  @Controller('trading')
  export class TradingController {
    constructor(
      private readonly tradeService: TradeService,
      private readonly tradeSetupService: TradeSetupService,
      private readonly tradeExecutorService: TradeExecutorService
    ) {}
  
    // Các endpoint cho Trade
    @Get('trades')
    @ApiOperation({ summary: 'Get all trades with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
    @ApiQuery({ name: 'symbol', required: false, type: String, description: 'Filter by symbol' })
    @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
    @ApiResponse({ status: 200, description: 'Returns trades list', type: [TradeResponseDto] })
    async getAllTrades(
      @Query('page', new ParsePositiveIntPipe()) page: number = 1,
      @Query('limit', new ParsePositiveIntPipe()) limit: number = 10,
      @Query('symbol') symbol?: string,
      @Query('status') status?: string
    ) {
      const filters: any = {};
      if (symbol) filters.symbol = symbol;
      if (status) filters.status = status;
      
      const skip = (page - 1) * limit;
      const [trades, total] = await this.tradeService.findAll(filters, skip, limit);
      
      return {
        data: trades,
        meta: {
          total,
          page,
          limit,
          pageCount: Math.ceil(total / limit)
        }
      };
    }
  
    @Get('trades/:id')
    @ApiOperation({ summary: 'Get trade by ID' })
    @ApiParam({ name: 'id', description: 'Trade ID' })
    @ApiResponse({ status: 200, description: 'Returns trade details', type: TradeResponseDto })
    async getTradeById(@Param('id', ParseUUIDPipe) id: string) {
      return this.tradeService.findById(id);
    }
  
    @Post('trades')
    @ApiOperation({ summary: 'Create a new trade' })
    @ApiBody({ type: CreateTradeDto })
    @ApiResponse({ status: 201, description: 'Returns created trade', type: TradeResponseDto })
    async createTrade(@Body(ValidationPipe) createTradeDto: CreateTradeDto) {
      return this.tradeService.create(createTradeDto);
    }
  
    @Put('trades/:id')
    @ApiOperation({ summary: 'Update a trade' })
    @ApiParam({ name: 'id', description: 'Trade ID' })
    @ApiBody({ type: UpdateTradeDto })
    @ApiResponse({ status: 200, description: 'Returns updated trade', type: TradeResponseDto })
    async updateTrade(
      @Param('id', ParseUUIDPipe) id: string,
      @Body(ValidationPipe) updateTradeDto: UpdateTradeDto
    ) {
      return this.tradeService.update(id, updateTradeDto);
    }
  
    @Put('trades/:id/close')
    @ApiOperation({ summary: 'Close a trade' })
    @ApiParam({ name: 'id', description: 'Trade ID' })
    @ApiQuery({ name: 'exitPrice', required: true, description: 'Exit price' })
    @ApiResponse({ status: 200, description: 'Returns closed trade', type: TradeResponseDto })
    async closeTrade(
      @Param('id', ParseUUIDPipe) id: string,
      @Query('exitPrice', new ParsePositiveIntPipe()) exitPrice: number
    ) {
      return this.tradeService.closeTrade(id, exitPrice);
    }
  
    @Put('trades/:id/cancel')
    @ApiOperation({ summary: 'Cancel a trade' })
    @ApiParam({ name: 'id', description: 'Trade ID' })
    @ApiResponse({ status: 200, description: 'Returns cancelled trade', type: TradeResponseDto })
    async cancelTrade(@Param('id', ParseUUIDPipe) id: string) {
      return this.tradeService.cancelTrade(id);
    }
  
    @Get('trades/stats')
    @ApiOperation({ summary: 'Get trade statistics' })
    @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
    @ApiResponse({ status: 200, description: 'Returns trade statistics', type: TradeStatsDto })
    async getTradeStats(
      @Query('userId') userId?: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string
    ) {
      const startDateObj = startDate ? new Date(startDate) : undefined;
      const endDateObj = endDate ? new Date(endDate) : undefined;
      
      return this.tradeService.getTradeStatistics(userId, startDateObj, endDateObj);
    }
  
    // Các endpoint cho TradeSetup
    @Get('setups')
    @ApiOperation({ summary: 'Get all trade setups with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
    @ApiResponse({ status: 200, description: 'Returns trade setups list', type: [TradeSetupResponseDto] })
    async getAllTradeSetups(
      @Query('page', new ParsePositiveIntPipe()) page: number = 1,
      @Query('limit', new ParsePositiveIntPipe()) limit: number = 10,
      @Query() filterDto: TradeSetupFilterDto
    ) {
      const skip = (page - 1) * limit;
      const [setups, total] = await this.tradeSetupService.findAll(filterDto, skip, limit);
      
      return {
        data: setups,
        meta: {
          total,
          page,
          limit,
          pageCount: Math.ceil(total / limit)
        }
      };
    }
  
    @Get('setups/:id')
    @ApiOperation({ summary: 'Get trade setup by ID' })
    @ApiParam({ name: 'id', description: 'Trade setup ID' })
    @ApiResponse({ status: 200, description: 'Returns trade setup details', type: TradeSetupResponseDto })
    async getTradeSetupById(@Param('id', ParseUUIDPipe) id: string) {
      return this.tradeSetupService.findById(id);
    }
  
    @Post('setups')
    @ApiOperation({ summary: 'Create a new trade setup' })
    @ApiBody({ type: CreateTradeSetupDto })
    @ApiResponse({ status: 201, description: 'Returns created trade setup', type: TradeSetupResponseDto })
    async createTradeSetup(@Body(ValidationPipe) createTradeSetupDto: CreateTradeSetupDto) {
      return this.tradeSetupService.create(createTradeSetupDto);
    }
  
    @Post('setups/from-pattern/:patternId')
    @ApiOperation({ summary: 'Create a trade setup from a pattern' })
    @ApiParam({ name: 'patternId', description: 'Pattern ID' })
    @ApiQuery({ name: 'validityHours', required: false, description: 'Validity period in hours' })
    @ApiResponse({ status: 201, description: 'Returns created trade setup', type: TradeSetupResponseDto })
    async createTradeSetupFromPattern(
      @Param('patternId', ParseUUIDPipe) patternId: string,
      @Query('validityHours', new ParsePositiveIntPipe()) validityHours: number = 24
    ) {
      return this.tradeSetupService.createFromPattern(patternId, validityHours);
    }
  
    @Put('setups/:id')
    @ApiOperation({ summary: 'Update a trade setup' })
    @ApiParam({ name: 'id', description: 'Trade setup ID' })
    @ApiBody({ type: UpdateTradeSetupDto })
    @ApiResponse({ status: 200, description: 'Returns updated trade setup', type: TradeSetupResponseDto })
    async updateTradeSetup(
      @Param('id', ParseUUIDPipe) id: string,
      @Body(ValidationPipe) updateTradeSetupDto: UpdateTradeSetupDto
    ) {
      return this.tradeSetupService.update(id, updateTradeSetupDto);
    }
  
    @Delete('setups/:id')
    @ApiOperation({ summary: 'Delete a trade setup' })
    @ApiParam({ name: 'id', description: 'Trade setup ID' })
    @ApiResponse({ status: 200, description: 'Returns success message' })
    async deleteTradeSetup(@Param('id', ParseUUIDPipe) id: string) {
      await this.tradeSetupService.remove(id);
      return { success: true, message: 'Trade setup deleted successfully' };
    }
  
    @Post('execute/:setupId')
    @ApiOperation({ summary: 'Execute a trade from a setup' })
    @ApiParam({ name: 'setupId', description: 'Trade setup ID' })
    @ApiQuery({ name: 'userId', required: false, description: 'User ID' })
    @ApiResponse({ status: 201, description: 'Returns executed trade', type: TradeResponseDto })
    async executeTradeFromSetup(
      @Param('setupId', ParseUUIDPipe) setupId: string,
      @Query('userId') userId?: string
    ) {
      return this.tradeExecutorService.executeTradeFromSetup(setupId, userId);
    }
  
    @Put('close-at-market/:tradeId')
    @ApiOperation({ summary: 'Close a trade at market price' })
    @ApiParam({ name: 'tradeId', description: 'Trade ID' })
    @ApiResponse({ status: 200, description: 'Returns closed trade', type: TradeResponseDto })
    async closeTradeAtMarket(@Param('tradeId', ParseUUIDPipe) tradeId: string) {
      return this.tradeExecutorService.closeTradeAtMarket(tradeId);
    }
  }
