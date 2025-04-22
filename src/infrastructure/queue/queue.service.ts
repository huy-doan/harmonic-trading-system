// 069. src/infrastructure/queue/queue.service.ts
import { Injectable, Logger } from '@nestjs/common';

/**
 * QueueJob - Định nghĩa cấu trúc của một công việc trong hàng đợi
 */
export interface QueueJob<T = any> {
  id?: string | number;
  name: string;
  data: T;
  options?: QueueJobOptions;
}

/**
 * QueueJobOptions - Các tùy chọn cho công việc
 */
export interface QueueJobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  timeout?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  jobId?: string | number;
}

/**
 * QueueHandler - Handler xử lý công việc
 */
export type QueueHandler<T = any, R = any> = (data: T) => Promise<R>;

/**
 * QueueService - Service cơ sở cho hệ thống queue
 */
@Injectable()
export abstract class QueueService {
  protected readonly logger = new Logger(QueueService.name);

  /**
   * Thêm công việc vào hàng đợi
   */
  abstract add<T = any>(queue: string, job: QueueJob<T>): Promise<any>;

  /**
   * Thêm nhiều công việc vào hàng đợi
   */
  abstract addBulk<T = any>(queue: string, jobs: QueueJob<T>[]): Promise<any>;

  /**
   * Xử lý công việc trong hàng đợi
   */
  abstract process<T = any, R = any>(queue: string, jobName: string, handler: QueueHandler<T, R>): void;

  /**
   * Xóa tất cả công việc khỏi hàng đợi
   */
  abstract clean(queue: string, status?: 'completed' | 'failed' | 'delayed' | 'active' | 'wait'): Promise<number>;

  /**
   * Lấy tất cả công việc từ hàng đợi
   */
  abstract getJobs(queue: string, status?: 'completed' | 'failed' | 'delayed' | 'active' | 'wait'): Promise<any[]>;

  /**
   * Đặt lịch cho công việc
   */
  abstract schedule<T = any>(queue: string, job: QueueJob<T>, date: Date | string | number): Promise<any>;

  /**
   * Lấy thông tin hàng đợi
   */
  abstract getQueueInfo(queue: string): Promise<any>;

  /**
   * Xử lý lỗi và retry
   */
  protected handleError(queue: string, jobName: string, error: any): void {
    this.logger.error(
      `Error processing job ${jobName} in queue ${queue}: ${error.message}`,
      error.stack
    );
  }
}
