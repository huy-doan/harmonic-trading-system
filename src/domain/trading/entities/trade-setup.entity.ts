// 115. src/domain/trading/entities/trade-setup.entity.ts
import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    CreateDateColumn, 
    UpdateDateColumn,
    OneToMany 
  } from 'typeorm';
  import { Trade } from './trade.entity';
  
  @Entity('trade_setups')
  export class TradeSetup {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 50 })
    symbol: string;
  
    @Column({ type: 'varchar', length: 10 })
    timeframe: string;
  
    @Column({ type: 'varchar', length: 50, name: 'pattern_type' })
    patternType: string;
  
    @Column({ type: 'varchar', length: 10 })
    direction: string; // LONG, SHORT
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'entry_price' })
    entryPrice: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'stop_loss' })
    stopLoss: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'take_profit1' })
    takeProfit1: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'take_profit2', nullable: true })
    takeProfit2: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'take_profit3', nullable: true })
    takeProfit3: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'risk_reward_ratio' })
    riskRewardRatio: number;
  
    @Column({ type: 'boolean', default: false, name: 'is_triggered' })
    isTriggered: boolean;
  
    @Column({ type: 'boolean', default: true, name: 'is_active' })
    isActive: boolean;
  
    @Column({ type: 'timestamp', name: 'valid_until' })
    validUntil: Date;
  
    @OneToMany(() => Trade, (trade) => trade.tradeSetup)
    trades: Trade[];
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  