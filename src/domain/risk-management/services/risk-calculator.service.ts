// 125. src/domain/risk-management/services/risk-calculator.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskProfile } from '../entities/risk-profile.entity';
import { RiskParametersDto } from '../dtos/risk-params.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RiskCalculatorService {
  private readonly logger = new Logger(RiskCalculatorService.name);
  private readonly defaultRiskPerTrade: number;

  constructor(
    @InjectRepository(RiskProfile)
    private readonly riskProfileRepository: Repository<RiskProfile>,
    private readonly configService: ConfigService
  ) {
    // Lấy giá trị rủi ro mặc định từ cấu hình
    this.defaultRiskPerTrade = parseFloat(
      this.configService.get<string>('DEFAULT_RISK_PER_TRADE', '1.0')
    );
  }

  /**
   * Tính toán số tiền rủi ro tối đa cho một giao dịch
   */
  async calculateRiskAmount(userId: string, accountBalance: number, customRiskPercentage?: number): Promise<number> {
    try {
      // Lấy hồ sơ rủi ro của người dùng
      const riskProfile = await this.getRiskProfile(userId);
      
      // Sử dụng tỷ lệ rủi ro tùy chỉnh nếu được cung cấp, ngược lại sử dụng từ hồ sơ
      const riskPercentage = customRiskPercentage !== undefined
        ? customRiskPercentage
        : riskProfile?.riskPerTrade || this.defaultRiskPerTrade;
      
      // Tính số tiền rủi ro
      const riskAmount = accountBalance * (riskPercentage / 100);
      
      this.logger.debug(`Calculated risk amount for user ${userId}: ${riskAmount} (${riskPercentage}% of ${accountBalance})`);
      
      return riskAmount;
    } catch (error) {
      this.logger.error(`Error calculating risk amount: ${error.message}`, error.stack);
      // Trả về giá trị mặc định nếu có lỗi
      return accountBalance * (this.defaultRiskPerTrade / 100);
    }
  }

  /**
   * Kiểm tra xem giao dịch có vượt quá giới hạn rủi ro không
   */
  async checkRiskLimits(
    userId: string,
    riskAmount: number,
    dailyRiskUsed: number,
    weeklyRiskUsed: number,
    monthlyRiskUsed: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Lấy hồ sơ rủi ro của người dùng
      const riskProfile = await this.getRiskProfile(userId);
      
      if (!riskProfile) {
        // Nếu không có hồ sơ rủi ro, cho phép giao dịch
        return { allowed: true };
      }
      
      // Kiểm tra giới hạn rủi ro hàng ngày
      if (dailyRiskUsed + riskAmount > riskProfile.maxDailyRisk) {
        return {
          allowed: false,
          reason: `Daily risk limit exceeded: ${dailyRiskUsed.toFixed(2)}% + ${riskAmount.toFixed(2)}% > ${riskProfile.maxDailyRisk}%`
        };
      }
      
      // Kiểm tra giới hạn rủi ro hàng tuần
      if (weeklyRiskUsed + riskAmount > riskProfile.maxWeeklyRisk) {
        return {
          allowed: false,
          reason: `Weekly risk limit exceeded: ${weeklyRiskUsed.toFixed(2)}% + ${riskAmount.toFixed(2)}% > ${riskProfile.maxWeeklyRisk}%`
        };
      }
      
      // Kiểm tra giới hạn rủi ro hàng tháng
      if (monthlyRiskUsed + riskAmount > riskProfile.maxMonthlyRisk) {
        return {
          allowed: false,
          reason: `Monthly risk limit exceeded: ${monthlyRiskUsed.toFixed(2)}% + ${riskAmount.toFixed(2)}% > ${riskProfile.maxMonthlyRisk}%`
        };
      }
      
      return { allowed: true };
    } catch (error) {
      this.logger.error(`Error checking risk limits: ${error.message}`, error.stack);
      // Mặc định cho phép giao dịch nếu có lỗi
      return { allowed: true };
    }
  }

  /**
   * Tính toán tỷ lệ rủi ro/phần thưởng
   */
  calculateRiskRewardRatio(entryPrice: number, stopLoss: number, takeProfit: number, isLong: boolean): number {
    try {
      // Tính khoảng cách đến stop loss
      const riskDistance = Math.abs(entryPrice - stopLoss);
      
      // Tính khoảng cách đến take profit
      const rewardDistance = Math.abs(takeProfit - entryPrice);
      
      // Nếu rủi ro bằng 0, trả về 0 để tránh chia cho 0
      if (riskDistance === 0) {
        return 0;
      }
      
      // Tính tỷ lệ risk/reward
      const ratio = rewardDistance / riskDistance;
      
      return Number(ratio.toFixed(2));
    } catch (error) {
      this.logger.error(`Error calculating risk/reward ratio: ${error.message}`, error.stack);
      return 0;
    }
  }

  /**
   * Đánh giá chất lượng của thiết lập giao dịch
   */
  evaluateTradeSetup(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number,
    isLong: boolean
  ): { score: number; notes: string[] } {
    try {
      const notes: string[] = [];
      let score = 0;
      
      // Tính tỷ lệ risk/reward
      const riskRewardRatio = this.calculateRiskRewardRatio(entryPrice, stopLoss, takeProfit, isLong);
      
      // Đánh giá dựa trên tỷ lệ risk/reward
      if (riskRewardRatio >= 3) {
        score += 40;
        notes.push(`Excellent risk/reward ratio: ${riskRewardRatio}`);
      } else if (riskRewardRatio >= 2) {
        score += 30;
        notes.push(`Good risk/reward ratio: ${riskRewardRatio}`);
      } else if (riskRewardRatio >= 1) {
        score += 20;
        notes.push(`Acceptable risk/reward ratio: ${riskRewardRatio}`);
      } else {
        score += 0;
        notes.push(`Poor risk/reward ratio: ${riskRewardRatio}`);
      }
      
      // Kiểm tra hướng của giao dịch và vị trí stop loss
      if (isLong) {
        if (stopLoss < entryPrice) {
          score += 20;
          notes.push('Stop loss is correctly placed below entry for a LONG position');
        } else {
          score -= 20;
          notes.push('WARNING: Stop loss is incorrectly placed above entry for a LONG position');
        }
        
        if (takeProfit > entryPrice) {
          score += 20;
          notes.push('Take profit is correctly placed above entry for a LONG position');
        } else {
          score -= 20;
          notes.push('WARNING: Take profit is incorrectly placed below entry for a LONG position');
        }
      } else {
        if (stopLoss > entryPrice) {
          score += 20;
          notes.push('Stop loss is correctly placed above entry for a SHORT position');
        } else {
          score -= 20;
          notes.push('WARNING: Stop loss is incorrectly placed below entry for a SHORT position');
        }
        
        if (takeProfit < entryPrice) {
          score += 20;
          notes.push('Take profit is correctly placed below entry for a SHORT position');
        } else {
          score -= 20;
          notes.push('WARNING: Take profit is incorrectly placed above entry for a SHORT position');
        }
      }
      
      // Đánh giá khoảng cách đến stop loss
      const stopDistancePercent = Math.abs((stopLoss - entryPrice) / entryPrice) * 100;
      
      if (stopDistancePercent < 0.5) {
        score -= 10;
        notes.push(`Stop loss is very close to entry (${stopDistancePercent.toFixed(2)}%), may get stopped out by market noise`);
      } else if (stopDistancePercent > 5) {
        score -= 10;
        notes.push(`Stop loss is far from entry (${stopDistancePercent.toFixed(2)}%), consider tightening it`);
      } else {
        score += 20;
        notes.push(`Stop loss distance is reasonable (${stopDistancePercent.toFixed(2)}%)`);
      }
      
      // Giới hạn điểm số trong khoảng 0-100
      score = Math.max(0, Math.min(100, score));
      
      return { score, notes };
    } catch (error) {
      this.logger.error(`Error evaluating trade setup: ${error.message}`, error.stack);
      return { score: 0, notes: ['Error calculating trade setup quality'] };
    }
  }

  /**
   * Tính toán tham số rủi ro cho giao dịch
   */
  async calculateRiskParameters(userId: string, params: RiskParametersDto): Promise<any> {
    try {
      // Lấy hồ sơ rủi ro của người dùng
      const riskProfile = await this.getRiskProfile(userId);
      
      // Tính số tiền rủi ro tối đa
      const maxRiskAmount = await this.calculateRiskAmount(
        userId,
        params.accountBalance,
        params.customRiskPercentage
      );
      
      // Khoảng cách từ giá vào lệnh đến stop loss
      const priceDifference = Math.abs(params.entryPrice - params.stopLoss);
      
      // Tính số lượng tối đa
      let quantity = maxRiskAmount / priceDifference;
      
      // Tính giá trị vị thế
      const positionValue = quantity * params.entryPrice;
      
      // Giới hạn giá trị vị thế nếu vượt quá giới hạn
      if (
        riskProfile?.maxPositionSize &&
        positionValue > (params.accountBalance * riskProfile.maxPositionSize / 100)
      ) {
        // Điều chỉnh số lượng
        quantity = (params.accountBalance * riskProfile.maxPositionSize / 100) / params.entryPrice;
      }
      
      // Tính giá trị vị thế sau khi điều chỉnh
      const adjustedPositionValue = quantity * params.entryPrice;
      
      // Tính phần trăm tài khoản
      const accountPercentage = (adjustedPositionValue / params.accountBalance) * 100;
      
      // Giới hạn từ tham số
      if (params.maxPositionValue && adjustedPositionValue > params.maxPositionValue) {
        quantity = params.maxPositionValue / params.entryPrice;
      }
      
      // Làm tròn số lượng đến 5 chữ số thập phân
      quantity = Math.floor(quantity * 100000) / 100000;
      
      // Tính lại giá trị vị thế và rủi ro
      const finalPositionValue = quantity * params.entryPrice;
      const actualRiskAmount = quantity * priceDifference;
      const actualRiskPercentage = (actualRiskAmount / params.accountBalance) * 100;
      
      return {
        quantity,
        positionValue: finalPositionValue,
        riskAmount: actualRiskAmount,
        riskPercentage: actualRiskPercentage,
        accountPercentage,
        riskRewardRatio: 0, // Cần cung cấp giá take profit để tính
        maxConcurrentTrades: riskProfile?.maxConcurrentTrades || 1,
        useTrailingStop: riskProfile?.useTrailingStop || false,
        trailingStopPercentage: riskProfile?.trailingStopPercentage || 0
      };
    } catch (error) {
      this.logger.error(`Error calculating risk parameters: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy hồ sơ rủi ro của người dùng
   */
  private async getRiskProfile(userId: string): Promise<RiskProfile | null> {
    try {
      return await this.riskProfileRepository.findOne({ where: { userId } });
    } catch (error) {
      this.logger.error(`Error getting risk profile for user ${userId}: ${error.message}`, error.stack);
      return null;
    }
  }
}
