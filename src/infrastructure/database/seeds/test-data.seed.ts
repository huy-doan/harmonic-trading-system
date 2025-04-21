// 049. src/infrastructure/database/seeds/test-data.seed.ts
import { DataSource } from 'typeorm';
import { User } from '@domain/user/entities/user.entity';
import { RiskProfile } from '@domain/risk-management/entities/risk-profile.entity';
import * as bcrypt from 'bcrypt';

export async function seedTestData(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const riskProfileRepository = dataSource.getRepository(RiskProfile);

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('Test@123', saltRounds);

  const testUser = await userRepository.save({
    email: 'test@example.com',
    password: hashedPassword,
    fullName: 'Test User',
    binanceApiKey: 'test_api_key',
    binanceApiSecret: 'test_api_secret',
    telegramChatId: '12345678',
    isActive: true,
  });

  await riskProfileRepository.save({
    userId: testUser.id,
    riskPerTrade: 1.0,
    maxDailyRisk: 5.0,
    maxWeeklyRisk: 10.0,
    maxMonthlyRisk: 20.0,
    maxConcurrentTrades: 5,
    useTrailingStop: true,
    trailingStopPercentage: 10.0,
    maxPositionSize: 25.0,
  });

  console.log('Test data seeded successfully');
}
