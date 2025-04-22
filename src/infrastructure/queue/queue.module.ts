// 071. src/infrastructure/queue/queue.module.ts
import { Module, DynamicModule, Provider } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { QueueService } from './queue.service';
import { BullQueueService } from './bull-queue.service';
import { QUEUE_NAMES } from '@config/queue.config';

@Module({})
export class QueueModule {
  static forRoot(): DynamicModule {
    const providers: Provider[] = [
      {
        provide: QueueService,
        useClass: BullQueueService,
      },
    ];

    return {
      module: QueueModule,
      imports: [
        ConfigModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => {
            const redisHost = configService.get<string>('REDIS_HOST');
            const redisPort = configService.get<number>('REDIS_PORT');
            const redisPassword = configService.get<string>('REDIS_PASSWORD');

            return {
              redis: {
                host: redisHost,
                port: redisPort,
                password: redisPassword,
              },
              defaultJobOptions: {
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 1000,
                },
                removeOnComplete: true,
                removeOnFail: false,
              },
            };
          },
        }),
        // Đăng ký các queue cụ thể
        BullModule.registerQueue(
          { name: QUEUE_NAMES.PATTERN_DETECTION },
          { name: QUEUE_NAMES.MARKET_ANALYSIS },
          { name: QUEUE_NAMES.TRADE_EXECUTION },
          { name: QUEUE_NAMES.NOTIFICATION },
        ),
      ],
      providers,
      exports: [QueueService, BullModule],
    };
  }

  static forFeature(queues: string[]): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        BullModule.registerQueue(
          ...queues.map(queue => ({ name: queue })),
        ),
      ],
      exports: [BullModule],
    };
  }
}
