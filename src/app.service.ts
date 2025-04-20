// 004. src/app.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  getAppInfo(): { name: string; version: string; description: string } {
    return {
      name: 'Harmonic Trading System',
      version: '0.1.0',
      description: 'A system for detecting and trading based on harmonic patterns',
    };
  }
}
