# Feature 10: Notification System

## Mô tả
Feature này triển khai hệ thống thông báo để cập nhật người dùng về các sự kiện quan trọng như phát hiện mô hình, thay đổi trạng thái giao dịch và cảnh báo thị trường.

## Danh sách file cần triển khai

### Telegram Integration
```
061. src/infrastructure/external/telegram/telegram.service.ts       # Service Telegram
062. src/infrastructure/external/telegram/telegram.module.ts        # Module Telegram
063. src/infrastructure/external/telegram/telegram.config.ts        # Cấu hình Telegram
```

### Notification Domain
```
129. src/domain/notification/entities/notification.entity.ts    # Entity thông báo
130. src/domain/notification/dtos/notification.dto.ts           # DTO thông báo
131. src/domain/notification/services/notification.service.ts   # Service thông báo
132. src/domain/notification/controllers/notification.controller.ts # Controller thông báo
133. src/domain/notification/notification.module.ts             # Module thông báo
```

## Chi tiết triển khai

### telegram.service.ts
Service để tương tác với Telegram Bot API:
- Gửi tin nhắn đến người dùng qua Telegram
- Xử lý webhook và sự kiện từ Telegram
- Hỗ trợ định dạng tin nhắn phong phú (markdown, HTML)
- Gửi hình ảnh và file

```typescript
@Injectable()
export class TelegramService {
  private readonly bot: Telegraf;
  
  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.bot = new Telegraf(token);
    this.initializeBot();
  }
  
  private initializeBot(): void {
    // Set up command handlers
    this.bot.command('start', (ctx) => {
      ctx.reply('Welcome to Harmonic Trading Bot! Your chat ID is: ' + ctx.chat.id);
    });
    
    // More command handlers...
    
    // Start the bot
    this.bot.launch();
  }
  
  async sendMessage(chatId: string, message: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<boolean> {
    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: parseMode,
      });
      return true;
    } catch (error) {
      Logger.error(`Failed to send Telegram message: ${error.message}`, 'TelegramService');
      return false;
    }
  }
  
  async sendPattern(chatId: string, pattern: HarmonicPattern): Promise<boolean> {
    const message = this.formatPatternMessage(pattern);
    return this.sendMessage(chatId, message);
  }
  
  async sendTradeSignal(chatId: string, trade: TradeSetup): Promise<boolean> {
    const message = this.formatTradeMessage(trade);
    return this.sendMessage(chatId, message);
  }
  
  private formatPatternMessage(pattern: HarmonicPattern): string {
    return `
🔍 *New Harmonic Pattern Detected*

*Symbol:* ${pattern.symbol}
*Pattern:* ${pattern.patternType}
*Direction:* ${pattern.direction}
*Quality Score:* ${pattern.qualityScore}%
*Completion Time:* ${format(pattern.completionTime, 'yyyy-MM-dd HH:mm')}
*Completion Price:* ${pattern.completionPrice}

*Potential Reversal Zone:*
- High: ${pattern.potentialReversalZoneHigh}
- Low: ${pattern.potentialReversalZoneLow}

[View Details](your-app-url/patterns/${pattern.id})
    `;
  }
  
  private formatTradeMessage(trade: TradeSetup): string {
    // Similar formatting for trade signals
    // ...
  }
}
```

### notification.service.ts
Service quản lý tất cả các thông báo trong hệ thống:
- Tạo và lưu thông báo
- Phân phối thông báo qua các kênh khác nhau (app, Telegram, email)
- Quản lý trạng thái đọc/chưa đọc
- Phân loại thông báo theo mức độ ưu tiên

```typescript
@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly telegramService: TelegramService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  
  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    await this.notificationRepository.save(notification);
    
    // Emit event for real-time notifications
    this.eventEmitter.emit('notification.created', notification);
    
    // Send to external channels if requested
    if (createNotificationDto.sendToTelegram) {
      await this.sendToTelegram(notification);
    }
    
    return notification;
  }
  
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ 
      where: { id, userId } as any 
    });
    
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    
    notification.isRead = true;
    notification.readAt = new Date();
    
    return this.notificationRepository.save(notification);
  }
  
  async findAllForUser(userId: string, options: { isRead?: boolean } = {}): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        userId,
        ...(options.isRead !== undefined ? { isRead: options.isRead } : {}),
      } as any,
      order: { createdAt: 'DESC' },
    });
  }
  
  private async sendToTelegram(notification: Notification): Promise<void> {
    // Get user's Telegram chat ID
    const user = await this.userRepository.findOne({ 
      where: { id: notification.userId } as any 
    });
    
    if (!user || !user.telegramChatId) {
      return;
    }
    
    // Send based on notification type
    switch (notification.type) {
      case 'pattern_detected':
        await this.telegramService.sendMessage(
          user.telegramChatId,
          this.formatTelegramMessage(notification)
        );
        break;
      case 'trade_executed':
        // Similar handling
        break;
      default:
        await this.telegramService.sendMessage(
          user.telegramChatId,
          `${notification.title}\n\n${notification.content}`
        );
    }
    
    // Update notification with Telegram status
    notification.sentToTelegram = true;
    await this.notificationRepository.save(notification);
  }
  
  private formatTelegramMessage(notification: Notification): string {
    // Format based on notification type and data
    // ...
  }
}
```

### notification.controller.ts
Controller để quản lý các thông báo thông qua API:
- Lấy danh sách thông báo
- Đánh dấu thông báo đã đọc
- Xóa thông báo
- Cấu hình thông báo của người dùng

```typescript
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  
  @Get()
  async findAll(@User() user: UserEntity, @Query() query): Promise<Notification[]> {
    return this.notificationService.findAllForUser(user.id, {
      isRead: query.isRead === 'true',
    });
  }
  
  @Get('unread/count')
  async countUnread(@User() user: UserEntity): Promise<{ count: number }> {
    const notifications = await this.notificationService.findAllForUser(user.id, { isRead: false });
    return { count: notifications.length };
  }
  
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @User() user: UserEntity): Promise<Notification> {
    return this.notificationService.markAsRead(id, user.id);
  }
  
  @Patch('read-all')
  async markAllAsRead(@User() user: UserEntity): Promise<void> {
    return this.notificationService.markAllAsRead(user.id);
  }
  
  @Delete(':id')
  async remove(@Param('id') id: string, @User() user: UserEntity): Promise<void> {
    return this.notificationService.delete(id, user.id);
  }
  
  @Get('settings')
  async getSettings(@User() user: UserEntity): Promise<NotificationSettings> {
    return this.notificationService.getSettings(user.id);
  }
  
  @Patch('settings')
  async updateSettings(
    @User() user: UserEntity, 
    @Body() updateDto: UpdateNotificationSettingsDto
  ): Promise<NotificationSettings> {
    return this.notificationService.updateSettings(user.id, updateDto);
  }
}
```

### notification.entity.ts
Entity để lưu trữ thông tin thông báo:
- Liên kết với người dùng
- Lưu trữ nội dung và loại thông báo
- Theo dõi trạng thái đọc/chưa đọc
- Theo dõi trạng thái gửi đến các kênh khác (Telegram)

```typescript
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'pattern_detected', 'trade_signal', 'price_alert', etc.

  @Column({ type: 'boolean', name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', name: 'read_at', nullable: true })
  readAt?: Date;

  @Column({ type: 'varchar', length: 50, name: 'entity_type', nullable: true })
  entityType?: string; // 'pattern', 'trade', 'trade_setup', etc.

  @Column({ type: 'varchar', length: 50, name: 'entity_id', nullable: true })
  entityId?: string; // ID of the related entity

  @Column({ type: 'varchar', length: 50, nullable: true })
  action?: string; // 'view', 'execute_trade', 'cancel_trade', etc.

  @Column({ type: 'boolean', name: 'sent_to_telegram', default: false })
  sentToTelegram: boolean;

  @Column({ type: 'varchar', length: 50, name: 'telegram_message_id', nullable: true })
  telegramMessageId?: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority: string; // 'low', 'normal', 'high', 'urgent'

  @Column({ type: 'jsonb', name: 'extra_data', nullable: true })
  extraData?: any; // Additional data

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

## Thứ tự triển khai đề xuất

1. Triển khai telegram.config.ts và telegram.module.ts
2. Xây dựng telegram.service.ts
3. Tạo notification.entity.ts và notification.dto.ts
4. Triển khai notification.service.ts
5. Xây dựng notification.controller.ts và notification.module.ts
6. Tích hợp với các service khác để gửi thông báo

## Dependencies chính

- nestjs-telegraf
- telegraf
- @nestjs/event-emitter
- TypeORM
- class-validator & class-transformer