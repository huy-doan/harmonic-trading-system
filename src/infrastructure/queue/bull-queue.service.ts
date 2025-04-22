// 070. src/infrastructure/queue/bull-queue.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Queue, Job } from 'bull';
import { QueueService, QueueJob, QueueHandler } from './queue.service';

/**
 * BullQueueService - Triển khai QueueService sử dụng Bull
 */
@Injectable()
export class BullQueueService extends QueueService implements OnModuleDestroy {
  private readonly registeredProcessors: Map<string, Map<string, QueueHandler>> = new Map();
  protected readonly logger = new Logger(BullQueueService.name);
  private readonly queues: Map<string, Queue> = new Map();

  constructor() {
    super();
  }

  /**
   * Đăng ký một queue mới
   */
  registerQueue(queueName: string, queue: Queue): void {
    this.queues.set(queueName, queue);
    this.registeredProcessors.set(queueName, new Map());
    this.logger.log(`Queue ${queueName} registered`);
  }

  /**
   * Thêm công việc vào hàng đợi
   */
  async add<T = any>(queueName: string, job: QueueJob<T>): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    try {
      return await queue.add(job.name, job.data, job.options);
    } catch (error) {
      this.logger.error(`Failed to add job ${job.name} to queue ${queueName}`, error.stack);
      throw error;
    }
  }

  /**
   * Thêm nhiều công việc vào hàng đợi
   */
  async addBulk<T = any>(queueName: string, jobs: QueueJob<T>[]): Promise<Job<T>[]> {
    const queue = this.getQueue(queueName);
    try {
      const bullJobs = jobs.map(job => ({
        name: job.name,
        data: job.data,
        opts: job.options
      }));
      return await queue.addBulk(bullJobs);
    } catch (error) {
      this.logger.error(`Failed to add bulk jobs to queue ${queueName}`, error.stack);
      throw error;
    }
  }

  /**
   * Đặt lịch cho công việc
   */
  async schedule<T = any>(queueName: string, job: QueueJob<T>, date: Date | string | number): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    try {
      return await queue.add(job.name, job.data, {
        ...job.options,
        delay: typeof date === 'number' 
          ? date 
          : new Date(date).getTime() - Date.now()
      });
    } catch (error) {
      this.logger.error(`Failed to schedule job ${job.name} to queue ${queueName}`, error.stack);
      throw error;
    }
  }

  /**
   * Xử lý công việc trong hàng đợi
   */
  process<T = any, R = any>(queueName: string, jobName: string, handler: QueueHandler<T, R>): void {
    const queue = this.getQueue(queueName);
    const processors = this.registeredProcessors.get(queueName);
    
    if (processors.has(jobName)) {
      this.logger.warn(`Processor for job ${jobName} in queue ${queueName} already registered`);
      return;
    }
    
    processors.set(jobName, handler);
    
    queue.process(jobName, async (job) => {
      try {
        this.logger.debug(`Processing job ${job.id} (${jobName}) from queue ${queueName}`);
        return await handler(job.data);
      } catch (error) {
        this.handleError(queueName, jobName, error);
        throw error;
      }
    });
    
    this.logger.log(`Processor for job ${jobName} in queue ${queueName} registered`);
  }

  /**
   * Xóa tất cả công việc khỏi hàng đợi
   */
  async clean(queueName: string, status?: 'completed' | 'failed' | 'delayed' | 'active' | 'wait'): Promise<number> {
    const queue = this.getQueue(queueName);
    const gracePeriod = 0; // Xóa ngay lập tức
    
    if (status) {
      return (await queue.clean(gracePeriod, status)).length;
    } else {
      // Xóa tất cả các trạng thái
      const statuses: ('completed' | 'failed' | 'delayed' | 'active' | 'wait')[] = [
        'completed', 'failed', 'delayed', 'active', 'wait'
      ];
      
      let totalRemoved = 0;
      for (const jobStatus of statuses) {
        const removed = await queue.clean(gracePeriod, jobStatus);
        totalRemoved += removed.length;
      }
      
      return totalRemoved;
    }
  }

  /**
   * Lấy tất cả công việc từ hàng đợi
   */
  async getJobs(queueName: string, status?: 'completed' | 'failed' | 'delayed' | 'active' | 'wait'): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    
    if (status) {
      return await queue.getJobs([status as any]);
    } else {
      // Lấy tất cả các trạng thái
      const statuses: ('completed' | 'failed' | 'delayed' | 'active' | 'wait')[] = [
        'completed', 'failed', 'delayed', 'active', 'wait'
      ];
      
      const allJobs = [];
      
      for (const jobStatus of statuses) {
        const jobs = await queue.getJobs([jobStatus as any]);
        allJobs.push(...jobs);
      }
      
      return allJobs;
    }
  }

  /**
   * Lấy thông tin hàng đợi
   */
  async getQueueInfo(queueName: string): Promise<any> {
    const queue = this.getQueue(queueName);
    
    const [
      jobCounts,
      isPaused,
      workers
    ] = await Promise.all([
      queue.getJobCounts(),
      queue.isPaused(),
      queue.getWorkers()
    ]);
    
    return {
      name: queueName,
      jobCounts,
      isPaused,
      workers: workers.length
    };
  }

  /**
   * Dọn dẹp khi module bị hủy
   */
  async onModuleDestroy() {
    const closePromises = [];
    
    for (const [queueName, queue] of this.queues.entries()) {
      this.logger.log(`Closing queue ${queueName}`);
      closePromises.push(queue.close());
    }
    
    await Promise.all(closePromises);
    this.logger.log('All queues closed');
  }

  /**
   * Lấy queue theo tên
   */
  private getQueue(queueName: string): Queue {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue ${queueName} is not registered`);
    }
    
    return queue;
  }
}
