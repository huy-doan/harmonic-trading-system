// 073. src/infrastructure/event-bus/event-bus.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusService } from './event-bus.service';
import { MarketDataHandler } from './event-handlers/market-data-handler';
import { PatternDetectedHandler } from './event-handlers/pattern-detected-handler';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Cấu hình cho event emitter
      wildcard: true, // cho phép sử dụng wildcard trong tên sự kiện
      delimiter: '.', // dấu phân cách cho tên sự kiện phân cấp
      maxListeners: 20, // số lượng listener tối đa cho một sự kiện
      verboseMemoryLeak: true, // cảnh báo rò rỉ bộ nhớ
      ignoreErrors: false, // Không bỏ qua lỗi từ listeners
    }),
  ],
  providers: [
    EventBusService,
    MarketDataHandler,
    PatternDetectedHandler,
  ],
  exports: [
    EventBusService,
  ],
})
export class EventBusModule {}
