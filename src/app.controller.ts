// 003. src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }

  @Get()
  @ApiOperation({ summary: 'Get application information' })
  @ApiResponse({ status: 200, description: 'Return application information' })
  getHello(): { name: string; version: string; description: string } {
    return this.appService.getAppInfo();
  }
}
