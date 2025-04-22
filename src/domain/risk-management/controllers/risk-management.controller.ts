// 127. src/domain/risk-management/controllers/risk-management.controller.ts
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
    ValidationPipe,
    ParseUUIDPipe
  } from '@nestjs/common';
  import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiParam, 
    ApiBody, 
    ApiQuery 
  } from '@nestjs/swagger';
  import { RiskCalculatorService } from '../services/risk-calculator.service';
  import { PositionSizerService } from '../services/position-sizer.service';
  import { 
    CreateRiskProfileDto, 
    UpdateRiskProfileDto, 
    RiskProfileResponseDto,
    RiskParametersDto
  } from '../dtos/risk-params.dto';
  
  @ApiTags('Risk Management')
  @Controller('risk-management')
  export class RiskManagementController {
    constructor(
      private readonly riskCalculatorService: RiskCalculatorService,
      private readonly positionSizerService: PositionSizerService
    ) {}
  
    @Post('profiles')
    @ApiOperation({ summary: 'Create a new risk profile' })
    @ApiBody({ type: CreateRiskProfileDto })
    @ApiResponse({ status: 201, description: 'Returns created risk profile', type: RiskProfileResponseDto })
    async createRiskProfile(@Body(ValidationPipe) createRiskProfileDto: CreateRiskProfileDto) {
      // Note: This endpoint would typically call a RiskProfileService
      // For now, we'll return a placeholder response
      return {
        id: 'generated-uuid',
        ...createRiskProfileDto,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  
    @Get('profiles/:id')
    @ApiOperation({ summary: 'Get risk profile by ID' })
    @ApiParam({ name: 'id', description: 'Risk profile ID' })
    @ApiResponse({ status: 200, description: 'Returns risk profile details', type: RiskProfileResponseDto })
    async getRiskProfileById(@Param('id', ParseUUIDPipe) id: string) {
      // Note: This endpoint would typically call a RiskProfileService
      // For now, we'll return a placeholder response
      return {
        id,
        userId: 'user-id',
        riskPerTrade: 1.0,
        maxDailyRisk: 5.0,
        maxWeeklyRisk: 10.0,
        maxMonthlyRisk: 20.0,
        maxConcurrentTrades: 5,
        useTrailingStop: true,
        trailingStopPercentage: 10.0,
        maxPositionSize: 25.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  
    @Get('profiles/user/:userId')
    @ApiOperation({ summary: 'Get risk profile by user ID' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'Returns risk profile details', type: RiskProfileResponseDto })
    async getRiskProfileByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
      // Note: This endpoint would typically call a RiskProfileService
      // For now, we'll return a placeholder response
      return {
        id: 'profile-id',
        userId,
        riskPerTrade: 1.0,
        maxDailyRisk: 5.0,
        maxWeeklyRisk: 10.0,
        maxMonthlyRisk: 20.0,
        maxConcurrentTrades: 5,
        useTrailingStop: true,
        trailingStopPercentage: 10.0,
        maxPositionSize: 25.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  
    @Put('profiles/:id')
    @ApiOperation({ summary: 'Update a risk profile' })
    @ApiParam({ name: 'id', description: 'Risk profile ID' })
    @ApiBody({ type: UpdateRiskProfileDto })
    @ApiResponse({ status: 200, description: 'Returns updated risk profile', type: RiskProfileResponseDto })
    async updateRiskProfile(
      @Param('id', ParseUUIDPipe) id: string,
      @Body(ValidationPipe) updateRiskProfileDto: UpdateRiskProfileDto
    ) {
      // Note: This endpoint would typically call a RiskProfileService
      // For now, we'll return a placeholder response
      return {
        id,
        userId: 'user-id',
        ...updateRiskProfileDto,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  
    @Post('calculate-position-size')
    @ApiOperation({ summary: 'Calculate position size based on risk management' })
    @ApiBody({ type: RiskParametersDto })
    @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
    async calculatePositionSize(
      @Query('userId') userId: string,
      @Body(ValidationPipe) params: RiskParametersDto
    ) {
      // Call PositionSizerService to calculate position size
      return this.positionSizerService.calculatePositionSize(userId, {
        symbol: params.entryPrice > 1000 ? 'BTCUSDT' : 'ETHUSDT', // Just a placeholder logic
        entryPrice: params.entryPrice,
        stopLoss: params.stopLoss,
        accountBalance: params.accountBalance,
        riskPercentage: params.customRiskPercentage
      });
    }
  
    @Post('evaluate-trade-setup')
    @ApiOperation({ summary: 'Evaluate a trade setup quality' })
    @ApiQuery({ name: 'entryPrice', required: true, description: 'Entry price' })
    @ApiQuery({ name: 'stopLoss', required: true, description: 'Stop loss price' })
    @ApiQuery({ name: 'takeProfit', required: true, description: 'Take profit price' })
    @ApiQuery({ name: 'isLong', required: true, description: 'Is this a long position' })
    async evaluateTradeSetup(
      @Query('entryPrice') entryPrice: number,
      @Query('stopLoss') stopLoss: number,
      @Query('takeProfit') takeProfit: number,
      @Query('isLong') isLong: boolean
    ) {
      // Call RiskCalculatorService to evaluate the trade setup
      return this.riskCalculatorService.evaluateTradeSetup(
        entryPrice,
        stopLoss,
        takeProfit,
        isLong
      );
    }
  
    @Post('calculate-risk-parameters')
    @ApiOperation({ summary: 'Calculate risk parameters for a trade' })
    @ApiBody({ type: RiskParametersDto })
    @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
    async calculateRiskParameters(
      @Query('userId') userId: string,
      @Body(ValidationPipe) params: RiskParametersDto
    ) {
      // Call RiskCalculatorService to calculate risk parameters
      return this.riskCalculatorService.calculateRiskParameters(userId, params);
    }
  
    @Get('account-risk-metrics')
    @ApiOperation({ summary: 'Get account risk metrics' })
    @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
    @ApiQuery({ name: 'accountBalance', required: true, description: 'Account balance' })
    async getAccountRiskMetrics(
      @Query('userId') userId: string,
      @Query('accountBalance') accountBalance: number
    ) {
      // Call PositionSizerService to get account risk metrics
      return this.positionSizerService.calculateAccountRiskMetrics(userId, accountBalance);
    }
  
    @Post('check-risk-limits')
    @ApiOperation({ summary: 'Check if a trade exceeds risk limits' })
    @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
    @ApiQuery({ name: 'riskAmount', required: true, description: 'Risk amount for the trade' })
    @ApiQuery({ name: 'dailyRiskUsed', required: false, description: 'Risk already used today' })
    @ApiQuery({ name: 'weeklyRiskUsed', required: false, description: 'Risk already used this week' })
    @ApiQuery({ name: 'monthlyRiskUsed', required: false, description: 'Risk already used this month' })
    async checkRiskLimits(
      @Query('userId') userId: string,
      @Query('riskAmount') riskAmount: number,
      @Query('dailyRiskUsed') dailyRiskUsed: number = 0,
      @Query('weeklyRiskUsed') weeklyRiskUsed: number = 0,
      @Query('monthlyRiskUsed') monthlyRiskUsed: number = 0
    ) {
      // Call RiskCalculatorService to check risk limits
      return this.riskCalculatorService.checkRiskLimits(
        userId,
        riskAmount,
        dailyRiskUsed,
        weeklyRiskUsed,
        monthlyRiskUsed
      );
    }
  }
  