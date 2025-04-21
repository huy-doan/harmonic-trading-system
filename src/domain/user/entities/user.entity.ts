// 173. src/user/entities/user.entity.ts
import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    CreateDateColumn, 
    UpdateDateColumn,
    OneToMany 
  } from 'typeorm';
  import { HarmonicPattern } from '@domain/harmonic-patterns/entities/harmonic-pattern.entity';
  import { Trade } from '@domain/trading/entities/trade.entity';
  import { Notification } from '@domain/notification/entities/notification.entity';
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string;
  
    @Column({ name: 'full_name' })
    fullName: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    binanceApiKey: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    binanceApiSecret: string;
  
    @Column({ type: 'varchar', length: 100, nullable: true })
    telegramChatId: string;
  
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
  
    @OneToMany(() => HarmonicPattern, (pattern) => pattern.user)
    patterns: HarmonicPattern[];
  
    @OneToMany(() => Trade, (trade) => trade.user)
    trades: Trade[];
  
    @OneToMany(() => Notification, (notification) => notification.user)
    notifications: Notification[];
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  