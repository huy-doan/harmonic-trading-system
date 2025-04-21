// 134. src/domain/market-analysis/entities/market-data.entity.ts
import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    CreateDateColumn, 
    UpdateDateColumn,
    Index
  } from 'typeorm';
  
  @Entity('market_data')
  @Index(['symbol', 'timeframe', 'openTime'], { unique: true })
  export class MarketData {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 20 })
    @Index()
    symbol: string;
  
    @Column({ type: 'varchar', length: 10 })
    @Index()
    timeframe: string;
  
    @Column({ type: 'bigint', name: 'open_time' })
    @Index()
    openTime: number;
  
    @Column({ type: 'bigint', name: 'close_time' })
    closeTime: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8 })
    open: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8 })
    high: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8 })
    low: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8 })
    close: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8 })
    volume: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'quote_asset_volume' })
    quoteAssetVolume: number;
  
    @Column({ type: 'integer', name: 'number_of_trades' })
    numberOfTrades: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'taker_buy_base_asset_volume' })
    takerBuyBaseAssetVolume: number;
  
    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'taker_buy_quote_asset_volume' })
    takerBuyQuoteAssetVolume: number;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  