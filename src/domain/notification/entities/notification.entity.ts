// 129. src/domain/notification/entities/notification.entity.ts
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
  
  @Entity('notifications')
  export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255 })
    title: string;
  
    @Column({ type: 'text' })
    content: string;
  
    @Column({ type: 'varchar', length: 50 })
    type: string; // PATTERN_DETECTED, TRADE_SIGNAL, TRADE_EXECUTED, PRICE_ALERT
  
    @Column({ type: 'boolean', default: false, name: 'is_read' })
    isRead: boolean;
  
    @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
    readAt: Date;
  
    @Column({ type: 'varchar', length: 50, nullable: true, name: 'entity_type' })
    entityType: string; // PATTERN, TRADE, TRADE_SETUP
  
    @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
    entityId: string;
  
    @Column({ type: 'varchar', length: 20, default: 'NORMAL' })
    priority: string; // LOW, NORMAL, HIGH, URGENT
  
    @Column({ type: 'boolean', default: false, name: 'sent_to_telegram' })
    sentToTelegram: boolean;
  
    @Column({ type: 'varchar', length: 100, nullable: true, name: 'telegram_message_id' })
    telegramMessageId: string;
  
    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;
  
    @ManyToOne(() => User, (user) => user.notifications)
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
