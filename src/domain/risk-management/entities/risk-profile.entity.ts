// 123. src/domain/risk-management/entities/risk-profile.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn 
} from 'typeorm';
import { User } from '@domain/user/entities/user.entity';

@Entity('risk_profiles')
export class RiskProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'risk_per_trade' })
  riskPerTrade: number; // % of account balance

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'max_daily_risk' })
  maxDailyRisk: number; // % of account balance

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'max_weekly_risk' })
  maxWeeklyRisk: number; // % of account balance

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'max_monthly_risk' })
  maxMonthlyRisk: number; // % of account balance

  @Column({ type: 'int', name: 'max_concurrent_trades' })
  maxConcurrentTrades: number;

  @Column({ type: 'boolean', default: true, name: 'use_trailing_stop' })
  useTrailingStop: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'trailing_stop_percentage', nullable: true })
  trailingStopPercentage: number; // % of profit

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'max_position_size', nullable: true })
  maxPositionSize: number; // % of account balance

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
