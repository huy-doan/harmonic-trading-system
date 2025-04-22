// 163. src/tasks/tasks.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';

interface TaskInfo {
  name: string;
  description: string;
  pattern: string;
  lastRun: Date | null;
  nextRun: Date | null;
  status: 'active' | 'disabled';
}

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);
  private readonly tasks: Map<string, TaskInfo> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    this.logger.log('Tasks service initialized');
    this.loadTasksConfig();
  }

  /**
   * Tải cấu hình các tác vụ từ biến môi trường
   */
  private loadTasksConfig(): void {
    // Tải cấu hình từ biến môi trường hoặc sử dụng mặc định
    const enablePatternDetector = this.configService.get<string>('ENABLE_PATTERN_DETECTOR') !== 'false';
    const enableMarketAnalyzer = this.configService.get<string>('ENABLE_MARKET_ANALYZER') !== 'false';
    const enableTradeExecutor = this.configService.get<string>('ENABLE_TRADE_EXECUTOR') !== 'false';

    // Lấy thông tin các tác vụ từ schedulerRegistry
    const cronJobs = this.schedulerRegistry.getCronJobs();

    cronJobs.forEach((job, name) => {
      let isEnabled = true;

      // Kiểm tra xem tác vụ có bị vô hiệu hóa không
      if (name.includes('patternDetector') && !enablePatternDetector) {
        job.stop();
        isEnabled = false;
      } else if (name.includes('marketAnalyzer') && !enableMarketAnalyzer) {
        job.stop();
        isEnabled = false;
      } else if (name.includes('tradeExecutor') && !enableTradeExecutor) {
        job.stop();
        isEnabled = false;
      }

      // Thêm thông tin tác vụ vào danh sách
      this.tasks.set(name, {
        name,
        description: this.getTaskDescription(name),
        pattern: job.cronTime.source,
        lastRun: null,
        nextRun: job.nextDate().toDate(),
        status: isEnabled ? 'active' : 'disabled',
      });

      this.logger.log(`Task ${name} is ${isEnabled ? 'enabled' : 'disabled'}`);
    });
  }

  /**
   * Đăng ký một tác vụ mới
   */
  registerTask(
    name: string,
    description: string,
    pattern: string,
    callback: () => void,
    isEnabled: boolean = true,
  ): void {
    const job = new CronJob(pattern, () => {
      this.logger.debug(`Executing task: ${name}`);
      const startTime = Date.now();

      try {
        callback();
        
        // Cập nhật thông tin về lần chạy cuối và lần chạy tiếp theo
        if (this.tasks.has(name)) {
          const taskInfo = this.tasks.get(name);
          taskInfo.lastRun = new Date();
          taskInfo.nextRun = job.nextDate().toDate();
        }

        this.logger.debug(`Task ${name} completed in ${Date.now() - startTime}ms`);
      } catch (error) {
        this.logger.error(`Error executing task ${name}: ${error.message}`, error.stack);
      }
    });

    // Đăng ký với SchedulerRegistry
    this.schedulerRegistry.addCronJob(name, job);

    // Thêm thông tin tác vụ vào danh sách
    this.tasks.set(name, {
      name,
      description,
      pattern,
      lastRun: null,
      nextRun: job.nextDate().toDate(),
      status: isEnabled ? 'active' : 'disabled',
    });

    // Bắt đầu tác vụ nếu được bật
    if (isEnabled) {
      job.start();
      this.logger.log(`Task ${name} registered and started`);
    } else {
      this.logger.log(`Task ${name} registered but disabled`);
    }
  }

  /**
   * Bật tác vụ
   */
  enableTask(name: string): boolean {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      job.start();

      if (this.tasks.has(name)) {
        const taskInfo = this.tasks.get(name);
        taskInfo.status = 'active';
        taskInfo.nextRun = job.nextDate().toDate();
        this.logger.log(`Task ${name} enabled`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error enabling task ${name}: ${error.message}`);
      return false;
    }
  }

  /**
   * Tắt tác vụ
   */
  disableTask(name: string): boolean {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      job.stop();

      if (this.tasks.has(name)) {
        const taskInfo = this.tasks.get(name);
        taskInfo.status = 'disabled';
        taskInfo.nextRun = null;
        this.logger.log(`Task ${name} disabled`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error disabling task ${name}: ${error.message}`);
      return false;
    }
  }

  /**
   * Chạy tác vụ ngay lập tức
   */
  executeTaskNow(name: string): boolean {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      
      // Chạy hàm callback của job
      job.fireOnTick();
      this.logger.log(`Task ${name} executed manually`);
      
      return true;
    } catch (error) {
      this.logger.error(`Error executing task ${name}: ${error.message}`);
      return false;
    }
  }

  /**
   * Lấy danh sách tất cả các tác vụ
   */
  getAllTasks(): TaskInfo[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Lấy thông tin tác vụ
   */
  getTaskInfo(name: string): TaskInfo | null {
    return this.tasks.has(name) ? this.tasks.get(name) : null;
  }

  /**
   * Lấy mô tả cho tác vụ
   */
  private getTaskDescription(name: string): string {
    if (name.includes('patternDetector')) {
      return 'Phát hiện mô hình Harmonic';
    } else if (name.includes('marketAnalyzer')) {
      return 'Phân tích thị trường';
    } else if (name.includes('tradeExecutor')) {
      return 'Thực thi giao dịch';
    } else {
      return 'Tác vụ hệ thống';
    }
  }
}
