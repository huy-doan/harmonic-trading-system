// 091. src/domain/harmonic-patterns/entities/harmonic-pattern.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { User } from '@domain/user/entities/user.entity';
import { PatternPoint } from '@domain/harmonic-patterns/entities/pattern-point.entity';
import { Trade } from '@domain/trading/entities/trade.entity';

@Entity('harmonic_patterns')
export class HarmonicPattern {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  symbol: string;

  @Column({ type: 'varchar', length: 10 })
  timeframe: string;

  @Column({ type: 'varchar', length: 50, name: 'pattern_type' })
  patternType: string; // GARTLEY, BUTTERFLY, BAT, CRAB, CYPHER

  @Column({ type: 'varchar', length: 10 })
  direction: string; // BULLISH, BEARISH

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'quality_score' })
  qualityScore: number;

  @Column({ type: 'boolean', default: false, name: 'is_valid' })
  isValid: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_completed' })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'detection_time' })
  detectionTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completion_time' })
  completionTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'invalidation_time' })
  invalidationTime: Date;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'completion_price' })
  completionPrice: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'potential_reversal_zone_high' })
  potentialReversalZoneHigh: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'potential_reversal_zone_low' })
  potentialReversalZoneLow: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'entry_price' })
  entryPrice: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'stop_loss' })
  stopLoss: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'take_profit1' })
  takeProfit1: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'take_profit2' })
  takeProfit2: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'take_profit3' })
  takeProfit3: number;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, (user) => user.patterns)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PatternPoint, (point) => point.pattern, { cascade: true })
  points: PatternPoint[];

  @OneToMany(() => Trade, (trade) => trade.pattern)
  trades: Trade[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
