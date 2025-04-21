// 114. src/domain/trading/entities/trade.entity.ts
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
  import { HarmonicPattern } from '@domain/harmonic-patterns/entities/harmonic-pattern.entity';
  import { TradeSetup } from '@domain/trading/entities/trade-setup.entity';
  
  @Entity('trades')
  export class Trade {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 50 })
    symbol: string;
  
    @Column({ type: 'varchar', length: 20, name: 'order_id', nullable: true })
    orderId: string;
  
    @Column({ type: 'varchar', length: 10 })
    direction: string; // LONG, SHORT
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'entry_price' })
    entryPrice: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'quantity' })
    quantity: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'stop_loss' })
    stopLoss: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'take_profit' })
    takeProfit: number;
  
    @Column({ type: 'varchar', length: 20, default: 'OPEN' })
    status: string; // OPEN, CLOSED, CANCELLED
  
    @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'exit_price' })
    exitPrice: number;
  
    @Column({ type: 'timestamp', nullable: true, name: 'entry_time' })
    entryTime: Date;
  
    @Column({ type: 'timestamp', nullable: true, name: 'exit_time' })
    exitTime: Date;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true, name: 'profit_loss' })
    profitLoss: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'profit_loss_percent' })
    profitLossPercent: number;
  
    @Column({ type: 'boolean', default: false, name: 'is_simulated' })
    isSimulated: boolean;
  
    @Column({ type: 'uuid', name: 'user_id', nullable: true })
    userId: string;
  
    @Column({ type: 'uuid', name: 'pattern_id', nullable: true })
    patternId: string;
  
    @Column({ type: 'uuid', name: 'trade_setup_id', nullable: true })
    tradeSetupId: string;
  
    @ManyToOne(() => User, (user) => user.trades)
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @ManyToOne(() => HarmonicPattern, (pattern) => pattern.trades)
    @JoinColumn({ name: 'pattern_id' })
    pattern: HarmonicPattern;
  
    @ManyToOne(() => TradeSetup, (setup) => setup.trades)
    @JoinColumn({ name: 'trade_setup_id' })
    tradeSetup: TradeSetup;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
