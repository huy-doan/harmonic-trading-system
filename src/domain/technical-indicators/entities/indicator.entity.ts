// 105. src/domain/technical-indicators/entities/indicator.entity.ts
import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    CreateDateColumn, 
    UpdateDateColumn,
    Index
  } from 'typeorm';
  
  @Entity('technical_indicators')
  @Index(['symbol', 'timeframe', 'type', 'timestamp'], { unique: true })
  export class TechnicalIndicator {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 50 })
    @Index()
    symbol: string;
  
    @Column({ type: 'varchar', length: 10 })
    @Index()
    timeframe: string;
  
    @Column({ type: 'varchar', length: 20 })
    @Index()
    type: string; // ICHIMOKU, RSI, MACD, etc.
  
    @Column({ type: 'bigint' })
    @Index()
    timestamp: number;
  
    @Column({ type: 'jsonb' })
    values: any; // Store values in JSON format for flexibility
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    notes: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  