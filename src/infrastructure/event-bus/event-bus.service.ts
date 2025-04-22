// 072. src/infrastructure/event-bus/event-bus.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * EventPayload - Định nghĩa cấu trúc của sự kiện
 */
export interface EventPayload<T = any> {
  event: string;
  data: T;
  timestamp: Date;
  source?: string;
}

/**
 * EventHandler - Handler xử lý sự kiện
 */
export type EventHandler<T = any> = (data: T) => Promise<void> | void;

/**
 * EventBusService - Service quản lý việc truyền và xử lý sự kiện
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly eventHandlers: Map<string, EventHandler[]> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {
    // Thiết lập cấu hình
    this.setupEventEmitter();
  }

  /**
   * Thiết lập cấu hình cho EventEmitter
   */
  private setupEventEmitter(): void {
    // Đăng ký listener xử lý tất cả các sự kiện
    this.eventEmitter.onAny((event, payload) => {
      this.logger.debug(`Event received: ${event}`);
      this.processEvent(event, payload);
    });
  }

  /**
   * Phát sự kiện
   */
  emit<T>(event: string, data: T, source?: string): boolean {
    const payload: EventPayload<T> = {
      event,
      data,
      timestamp: new Date(),
      source,
    };

    this.logger.debug(`Emitting event: ${event}`);
    return this.eventEmitter.emit(event, payload);
  }

  /**
   * Đăng ký handler cho sự kiện
   */
  on<T>(event: string, handler: EventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    this.eventHandlers.get(event).push(handler);
    this.logger.log(`Handler registered for event: ${event}`);
  }

  /**
   * Gỡ bỏ handler cho sự kiện
   */
  off(event: string, handler?: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }

    if (handler) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        this.logger.log(`Handler removed for event: ${event}`);
      }
    } else {
      this.eventHandlers.delete(event);
      this.logger.log(`All handlers removed for event: ${event}`);
    }
  }

  /**
   * Đăng ký handler cho nhiều sự kiện
   */
  onMultiple(events: string[], handler: EventHandler): void {
    events.forEach(event => this.on(event, handler));
  }

  /**
   * Đăng ký handler một lần cho sự kiện
   */
  once<T>(event: string, handler: EventHandler<T>): void {
    const onceHandler: EventHandler<T> = async (data: T) => {
      await handler(data);
      this.off(event, onceHandler);
    };

    this.on(event, onceHandler);
  }

  /**
   * Xử lý sự kiện
   */
  private async processEvent(eventName: string, payload: EventPayload): Promise<void> {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }

    const handlers = this.eventHandlers.get(eventName);
    
    try {
      await Promise.all(
        handlers.map(async (handler) => {
          try {
            await handler(payload.data);
          } catch (error) {
            this.logger.error(
              `Error handling event ${eventName}: ${error.message}`,
              error.stack,
            );
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Error processing event ${eventName}: ${error.message}`, error.stack);
    }
  }
}
