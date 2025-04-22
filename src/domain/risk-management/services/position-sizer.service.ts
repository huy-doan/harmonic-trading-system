// 126. src/domain/risk-management/services/position-sizer.service.ts
// TODO: generate lại
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskProfile } from '../entities/risk-profile.entity';
import { ConfigService } from '@nestjs/config';
import { MarketDataStreamService } from '@infrastructure/external/binance/market-data-stream.service';

interface PositionSizeParams {
  symbol: string;
  entryPrice: number;
  stopLoss: number;
  accountBalance: number;
  riskPercentage?: number;
  maxPositionSizePercent?: number;
}

interface PositionSizeResult {
  quantity: number;
  positionValue: number;
  riskAmount: number;
  riskPercentage: number;
  accountPercentage: number;
}

@Injectable()
export class PositionSizerService {
  private readonly logger = new Logger(PositionSizerService.name);
  private readonly defaultRiskPercentage: number;

  constructor(
    @InjectRepository(RiskProfile)
    private readonly riskProfileRepository: Repository<RiskProfile>,
    private readonly configService: ConfigService,
    private readonly marketDataService: MarketDataStreamService
  ) {
    // Lấy giá trị rủi ro mặc định từ cấu hình
    this.defaultRiskPercentage = parseFloat(
      this.configService.get<string>('DEFAULT_RISK_PER_TRADE', '1.0')
    );
  }

  /**
   * Tính toán kích thước vị thế dựa trên quản lý rủi ro
   */
  async calculatePositionSize(
    userId: string,
    params: PositionSizeParams
  ): Promise<PositionSizeResult> {
    try {
      // Lấy hồ sơ rủi ro của người dùng
      const riskProfile = await this.getRiskProfile(userId);
      
      // Sử dụng tỷ lệ rủi ro từ tham số hoặc từ hồ sơ
      const riskPercentage = params.riskPercentage !== undefined
        ? params.riskPercentage
        : riskProfile?.riskPerTrade || this.defaultRiskPercentage;
      
      // Số tiền rủi ro tối đa
      const maxRiskAmount = params.accountBalance * (riskPercentage / 100);
      
      // Khoảng cách giữa giá vào lệnh và stop loss
      const priceDifference = Math.abs(params.entryPrice - params.stopLoss);
      
      // Tính số lượng dựa trên rủi ro
      let quantity = maxRiskAmount / priceDifference;
      
      // Tính giá trị vị thế
      const positionValue = quantity * params.entryPrice;
      
      // Sử dụng giới hạn kích thước vị thế từ tham số hoặc từ hồ sơ
      const maxPositionSizePercent = params.maxPositionSizePercent !== undefined
        ? params.maxPositionSizePercent
        : riskProfile?.maxPositionSize || 25; // Mặc định 25% tài khoản
      
      // Tính giá trị vị thế tối đa dựa trên phần trăm tài khoản
      const maxPositionValue = params.accountBalance * (maxPositionSizePercent / 100);
      
      // Nếu giá trị vị thế vượt quá giới hạn, điều chỉnh lại số lượng
      if (positionValue > maxPositionValue) {
        quantity = maxPositionValue / params.entryPrice;
        this.logger.debug(`Position size adjusted due to max position size limit: ${maxPositionSizePercent}%`);
      }
      
      // Điều chỉnh số lượng theo độ chính xác của symbol
      quantity = await this.roundQuantityToValidPrecision(params.symbol, quantity);
      
      // Tính lại các thông số sau khi làm tròn
      const adjustedPositionValue = quantity * params.entryPrice;
      const actualRiskAmount = quantity * priceDifference;
      const actualRiskPercentage = (actualRiskAmount / params.accountBalance) * 100;
      const accountPercentage = (adjustedPositionValue / params.accountBalance) * 100;
      
      return {
        quantity,
        positionValue: adjustedPositionValue,
        riskAmount: actualRiskAmount,
        riskPercentage: actualRiskPercentage,
        accountPercentage
      };
    } catch (error) {
      this.logger.error(`Error calculating position size: ${error.message}`, error.stack);
      
      // Trả về giá trị mặc định an toàn khi có lỗi
      return {
        quantity: 0,
        positionValue: 0,
        riskAmount: 0,
        riskPercentage: 0,
        accountPercentage: 0
      };
    }
  }

  /**
   * Tính toán dữ liệu rủi ro của tài khoản
   */
  async calculateAccountRiskMetrics(userId: string, accountBalance: number): Promise<any> {
    try {
      // Lấy hồ sơ rủi ro
      const riskProfile = await this.getRiskProfile(userId);
      
      if (!riskProfile) {
        return {
          accountBalance,
          maxDailyRisk: accountBalance * (this.defaultRiskPercentage * 5 / 100), // Mặc định 5x risk per trade
          maxWeeklyRisk: accountBalance * (this.defaultRiskPercentage * 10 / 100), // Mặc định 10x risk per trade
          maxMonthlyRisk: accountBalance * (this.defaultRiskPercentage * 20 / 100), // Mặc định 20x risk per trade
          maxPositionSize: accountBalance * 0.25, // Mặc định 25% tài khoản
          maxRiskPerTrade: accountBalance * (this.defaultRiskPercentage / 100),
          currentDailyRiskUsed: 0,
          currentWeeklyRiskUsed: 0,
          currentMonthlyRiskUsed: 0,
          openPositionsRisk: 0,
          availableDailyRisk: accountBalance * (this.defaultRiskPercentage * 5 / 100)
        };
      }
      
      // Tính toán các giá trị dựa trên hồ sơ rủi ro
      const maxDailyRisk = accountBalance * (riskProfile.maxDailyRisk / 100);
      const maxWeeklyRisk = accountBalance * (riskProfile.maxWeeklyRisk / 100);
      const maxMonthlyRisk = accountBalance * (riskProfile.maxMonthlyRisk / 100);
      const maxPositionSize = accountBalance * (riskProfile.maxPositionSize / 100);
      const maxRiskPerTrade = accountBalance * (riskProfile.riskPerTrade / 100);
      
      // TODO: Tính toán rủi ro đã sử dụng dựa trên giao dịch hiện tại
      // Điều này sẽ yêu cầu truy vấn từ TradeService
      const currentDailyRiskUsed = 0;
      const currentWeeklyRiskUsed = 0;
      const currentMonthlyRiskUsed = 0;
      const openPositionsRisk = 0;
      
      return {
        accountBalance,
        maxDailyRisk,
        maxWeeklyRisk,
        maxMonthlyRisk,
        maxPositionSize,
        maxRiskPerTrade,
        currentDailyRiskUsed,
        currentWeeklyRiskUsed,
        currentMonthlyRiskUsed,
        openPositionsRisk,
        availableDailyRisk: maxDailyRisk - currentDailyRiskUsed
      };
    } catch (error) {
      this.logger.error(`Error calculating account risk metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Lấy hồ sơ rủi ro của người dùng
    private async getRiskProfile(userId: string): Promise<RiskProfile | null> {
        try {
        return await this.riskProfileRepository.findOne({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
        } catch (error) {
        this.logger.error(`Error fetching risk profile for user ${userId}: ${error.message}`, error.stack);
        return null;
        }
    }

    /**
     * Làm tròn số lượng theo độ chính xác của symbol
     *  
     * @param symbol Ticker của symbol
     * @param quantity Số lượng cần làm tròn
     * @return Số lượng đã làm tròn
     * */
    private async roundQuantityToValidPrecision(symbol: string, quantity: number): Promise<number> {
        try {
            const symbolInfo = await this.marketDataService.getSymbolInfo(symbol);
            const stepSize = symbolInfo.filters.find((filter) => filter.filterType === 'LOT_SIZE').stepSize;
            const precision = Math.log10(1 / stepSize);
            return parseFloat(quantity.toFixed(precision));
        } catch (error) {
            this.logger.error(`Error rounding quantity for ${symbol}: ${error.message}`, error.stack);
            throw error;
        }
    }
}
