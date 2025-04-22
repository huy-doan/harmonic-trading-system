# Feature 11: Backtesting

## Mô tả
Feature này cung cấp khả năng kiểm thử chiến lược giao dịch trên dữ liệu lịch sử, phân tích hiệu suất và tối ưu các tham số.

## Danh sách file cần triển khai

### Backtesting Domain
```
140. src/domain/backtesting/entities/backtest.entity.ts        # Entity backtesting
141. src/domain/backtesting/dtos/backtest.dto.ts               # DTO backtesting
142. src/domain/backtesting/services/backtest-runner.service.ts # Service chạy backtest
143. src/domain/backtesting/services/performance-analyzer.service.ts # Service phân tích hiệu suất
144. src/domain/backtesting/controllers/backtest.controller.ts   # Controller backtest
145. src/domain/backtesting/backtesting.module.ts               # Module backtesting
```

## Chi tiết triển khai

### backtest.entity.ts
Entity lưu trữ thông tin về một phiên backtest và kết quả của nó:
- Cấu hình backtesting
- Kết quả thống kê
- Danh sách giao dịch mô phỏng
- Tối ưu tham số

```typescript
@Entity('backtests')
export class Backtest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', name: 'symbols' })
  symbols: string[]; // Mảng các cặp tiền được test

  @Column({ type: 'jsonb', name: 'timeframes' })
  timeframes: string[]; // Mảng các khung thời gian

  @Column({ type: 'jsonb', name: 'pattern_types' })
  patternTypes: string[]; // Mảng các loại mô hình

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate: Date; // Ngày bắt đầu của dữ liệu lịch sử

  @Column({ type: 'timestamp', name: 'end_date' })
  endDate: Date; // Ngày kết thúc của dữ liệu lịch sử

  @Column({ type: 'jsonb', name: 'parameters' })
  parameters: {
    riskPerTrade: number; // % rủi ro cho mỗi giao dịch
    initialCapital: number; // Vốn ban đầu
    patternQualityThreshold: number; // Ngưỡng chất lượng mô hình
    trailingStopEnabled: boolean; // Sử dụng trailing stop
    trailingStopPercent: number; // % của trailing stop
    takeProfit: number; // % take profit
    stopLoss: number; // % stop loss
    // Thêm các tham số khác
  };

  @Column({ type: 'jsonb', name: 'results' })
  results: {
    totalTrades: number; // Tổng số giao dịch
    winningTrades: number; // Số giao dịch thắng
    losingTrades: number; // Số giao dịch thua
    winRate: number; // Tỷ lệ thắng
    profitFactor: number; // Profit factor
    expectancy: number; // Kỳ vọng
    netProfit: number; // Lợi nhuận ròng
    netProfitPercent: number; // Lợi nhuận ròng %
    maxDrawdown: number; // Drawdown tối đa
    maxDrawdownPercent: number; // Drawdown tối đa %
    averageProfit: number; // Lợi nhuận trung bình
    averageLoss: number; // Thua lỗ trung bình
    sharpeRatio: number; // Tỷ lệ Sharpe
    // Thêm các chỉ số khác
  };

  @Column({ type: 'jsonb', name: 'trades', nullable: true })
  trades: any[]; // Mảng các giao dịch đã mô phỏng

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending', 'running', 'completed', 'failed'

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string; // Thông báo lỗi nếu có

  @ManyToOne(() => User, (user) => user.backtests)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### backtest-runner.service.ts
Service thực hiện việc chạy backtest:
- Lấy dữ liệu lịch sử
- Mô phỏng các giao dịch
- Tính toán kết quả
- Tối ưu các tham số

```typescript
@Injectable()
export class BacktestRunnerService {
  constructor(
    @InjectRepository(Backtest)
    private readonly backtestRepository: Repository<Backtest>,
    private readonly patternService: HarmonicPatternService,
    private readonly marketDataService: MarketDataService,
    private readonly performanceAnalyzerService: PerformanceAnalyzerService,
    private readonly queueService: QueueService,
  ) {}
  
  async createBacktest(createBacktestDto: CreateBacktestDto, userId?: string): Promise<Backtest> {
    const backtest = this.backtestRepository.create({
      ...createBacktestDto,
      userId,
      status: 'pending',
      results: null,
      trades: [],
    });
    
    await this.backtestRepository.save(backtest);
    
    // Add to queue for processing
    await this.queueService.add('backtest', { id: backtest.id }, {
      priority: 5,
      attempts: 1,
      timeout: 30 * 60 * 1000, // 30 minutes timeout
    });
    
    return backtest;
  }
  
  async runBacktest(id: string): Promise<void> {
    const backtest = await this.backtestRepository.findOne({ where: { id } as any });
    if (!backtest) {
      throw new NotFoundException(`Backtest with ID ${id} not found`);
    }
    
    try {
      // Update status to running
      backtest.status = 'running';
      await this.backtestRepository.save(backtest);
      
      // Get historical data
      const historicalData = await this.fetchHistoricalData(backtest);
      
      // Run simulation
      const simulatedTrades = await this.simulateTrades(backtest, historicalData);
      
      // Calculate performance metrics
      const results = this.performanceAnalyzerService.analyzePerformance(
        simulatedTrades,
        backtest.parameters.initialCapital,
      );
      
      // Update backtest with results
      backtest.results = results;
      backtest.trades = simulatedTrades;
      backtest.status = 'completed';
      await this.backtestRepository.save(backtest);
    } catch (error) {
      // Update status to failed
      backtest.status = 'failed';
      backtest.errorMessage = error.message;
      await this.backtestRepository.save(backtest);
      
      throw error;
    }
  }
  
  private async fetchHistoricalData(backtest: Backtest): Promise<Map<string, Map<string, any[]>>> {
    // Fetch historical market data for all symbols and timeframes
    const data = new Map<string, Map<string, any[]>>();
    
    for (const symbol of backtest.symbols) {
      data.set(symbol, new Map<string, any[]>());
      
      for (const timeframe of backtest.timeframes) {
        const candles = await this.marketDataService.getHistoricalCandles(
          symbol,
          timeframe,
          backtest.startDate,
          backtest.endDate,
        );
        
        data.get(symbol).set(timeframe, candles);
      }
    }
    
    return data;
  }
  
  private async simulateTrades(
    backtest: Backtest,
    historicalData: Map<string, Map<string, any[]>>,
  ): Promise<any[]> {
    const simulatedTrades = [];
    const portfolio = {
      balance: backtest.parameters.initialCapital,
      openTrades: [],
    };
    
    // Process data chronologically
    const timeSeriesData = this.createTimeSeriesData(historicalData);
    
    for (const timePoint of timeSeriesData) {
      // Update open trades
      this.updateOpenTrades(portfolio, timePoint);
      
      // Detect patterns
      const detectedPatterns = await this.detectPatterns(
        timePoint,
        backtest.patternTypes,
        backtest.parameters.patternQualityThreshold,
      );
      
      // Create new trades
      for (const pattern of detectedPatterns) {
        const trade = this.createTrade(pattern, portfolio, backtest.parameters);
        if (trade) {
          portfolio.openTrades.push(trade);
          trade.entryBalance = portfolio.balance;
        }
      }
    }
    
    // Close any remaining open trades with the last price
    const lastTimePoint = timeSeriesData[timeSeriesData.length - 1];
    this.closeAllOpenTrades(portfolio, lastTimePoint);
    
    return portfolio.openTrades;
  }
  
  private createTimeSeriesData(historicalData: Map<string, Map<string, any[]>>): any[] {
    // Merge all candles into a single chronological timeline
    // ...
  }
  
  private updateOpenTrades(portfolio: any, timePoint: any): void {
    // Update status of open trades
    // Check for stop loss, take profit, and trailing stop
    // ...
  }
  
  private async detectPatterns(
    timePoint: any,
    patternTypes: string[],
    qualityThreshold: number,
  ): Promise<any[]> {
    // Detect harmonic patterns in the current data
    // ...
  }
  
  private createTrade(pattern: any, portfolio: any, parameters: any): any {
    // Create a new trade based on detected pattern
    // Calculate position size, entry, stop loss, take profit
    // ...
  }
  
  private closeAllOpenTrades(portfolio: any, lastTimePoint: any): void {
    // Close any remaining open trades
    // ...
  }
}
```

### performance-analyzer.service.ts
Service phân tích hiệu suất của các giao dịch:
- Tính toán các chỉ số thống kê (win rate, profit factor, etc.)
- Tính drawdown và các chỉ số rủi ro
- Phân tích hiệu suất theo loại mô hình, cặp tiền
- Tạo báo cáo hiệu suất

```typescript
@Injectable()
export class PerformanceAnalyzerService {
  analyzePerformance(trades: any[], initialCapital: number): any {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        profitFactor: 0,
        expectancy: 0,
        netProfit: 0,
        netProfitPercent: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        averageProfit: 0,
        averageLoss: 0,
        sharpeRatio: 0,
      };
    }
    
    // Calculate basic statistics
    const closedTrades = trades.filter(t => t.exitTime);
    const winningTrades = closedTrades.filter(t => t.profitLoss > 0);
    const losingTrades = closedTrades.filter(t => t.profitLoss <= 0);
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0));
    
    const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const averageProfit = winningTrades.length > 0 
      ? totalProfit / winningTrades.length 
      : 0;
      
    const averageLoss = losingTrades.length > 0 
      ? totalLoss / losingTrades.length 
      : 0;
    
    const expectancy = (winRate * averageProfit) - ((1 - winRate) * averageLoss);
    
    // Calculate equity curve and drawdown
    const equityCurve = this.calculateEquityCurve(trades, initialCapital);
    const { maxDrawdown, maxDrawdownPercent } = this.calculateDrawdown(equityCurve);
    
    // Calculate final results
    const netProfit = totalProfit - totalLoss;
    const netProfitPercent = (netProfit / initialCapital) * 100;
    
    // Calculate Sharpe Ratio
    const returns = this.calculateDailyReturns(equityCurve);
    const sharpeRatio = this.calculateSharpeRatio(returns);
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      profitFactor,
      expectancy,
      netProfit,
      netProfitPercent,
      maxDrawdown,
      maxDrawdownPercent,
      averageProfit,
      averageLoss,
      sharpeRatio,
      equityCurve, // Include equity curve for charting
    };
  }
  
  private calculateEquityCurve(trades: any[], initialCapital: number): { date: Date; equity: number }[] {
    // Sort trades by entry and exit time
    // Create a time series of equity changes
    // ...
  }
  
  private calculateDrawdown(equityCurve: { date: Date; equity: number }[]): { maxDrawdown: number; maxDrawdownPercent: number } {
    // Calculate maximum drawdown from equity curve
    // ...
  }
  
  private calculateDailyReturns(equityCurve: { date: Date; equity: number }[]): number[] {
    // Calculate daily returns from equity curve
    // ...
  }
  
  private calculateSharpeRatio(returns: number[]): number {
    // Calculate Sharpe Ratio (mean return / standard deviation)
    // ...
  }
  
  analyzeTrades(trades: any[]): any {
    // Group trades by pattern type, symbol, timeframe, etc.
    // Calculate statistics for each group
    // ...
  }
  
  generatePerformanceReport(backtest: Backtest): any {
    // Generate a comprehensive performance report
    // ...
  }
}
```

### backtest.controller.ts
Controller cung cấp API endpoints cho quản lý và thực hiện backtest:
- Tạo backtest mới
- Lấy kết quả backtest
- Chạy backtest
- Tối ưu hóa tham số

```typescript
@Controller('backtesting')
@UseGuards(JwtAuthGuard)
export class BacktestController {
  constructor(
    private readonly backtestRunnerService: BacktestRunnerService,
    private readonly performanceAnalyzerService: PerformanceAnalyzerService,
  ) {}
  
  @Post()
  async create(
    @Body() createBacktestDto: CreateBacktestDto,
    @User() user: UserEntity,
  ): Promise<Backtest> {
    return this.backtestRunnerService.createBacktest(createBacktestDto, user.id);
  }
  
  @Get()
  async findAll(@User() user: UserEntity): Promise<Backtest[]> {
    return this.backtestRunnerService.findAllByUser(user.id);
  }
  
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @User() user: UserEntity,
  ): Promise<Backtest> {
    return this.backtestRunnerService.findOne(id, user.id);
  }
  
  @Get(':id/results')
  async getResults(
    @Param('id') id: string,
    @User() user: UserEntity,
  ): Promise<any> {
    const backtest = await this.backtestRunnerService.findOne(id, user.id);
    return backtest.results;
  }
  
  @Get(':id/trades')
  async getTrades(
    @Param('id') id: string,
    @User() user: UserEntity,
  ): Promise<any[]> {
    const backtest = await this.backtestRunnerService.findOne(id, user.id);
    return backtest.trades;
  }
  
  @Post(':id/run')
  async run(
    @Param('id') id: string,
    @User() user: UserEntity,
  ): Promise<void> {
    await this.backtestRunnerService.checkOwnership(id, user.id);
    return this.backtestRunnerService.runBacktest(id);
  }
  
  @Post(':id/optimize')
  async optimize(
    @Param('id') id: string,
    @Body() optimizeDto: OptimizeBacktestDto,
    @User() user: UserEntity,
  ): Promise<any> {
    await this.backtestRunnerService.checkOwnership(id, user.id);
    return this.backtestRunnerService.optimizeParameters(id, optimizeDto);
  }
  
  @Get(':id/report')
  async getReport(
    @Param('id') id: string,
    @User() user: UserEntity,
  ): Promise<any> {
    const backtest = await this.backtestRunnerService.findOne(id, user.id);
    return this.performanceAnalyzerService.generatePerformanceReport(backtest);
  }
}
```

## Thứ tự triển khai đề xuất

1. Triển khai backtest.entity.ts và backtest.dto.ts
2. Xây dựng performance-analyzer.service.ts
3. Triển khai backtest-runner.service.ts
4. Tạo backtest.controller.ts và backtesting.module.ts

## Dependencies chính

- NestJS
- TypeORM
- Bull Queue (cho xử lý backtest bất đồng bộ)
- Technicalindicators (thư viện tính toán chỉ báo kỹ thuật)