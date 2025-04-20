// 005. src/app.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              // Mock configuration values for testing
              if (key === 'PORT') return 3000;
              return '';
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = { status: 'healthy', timestamp: expect.any(String) };
      jest.spyOn(appService, 'getHealth').mockImplementation(() => result);
      
      expect(appController.getHealth()).toBe(result);
    });
  });

  describe('getHello', () => {
    it('should return application info', () => {
      const result = {
        name: 'Harmonic Trading System',
        version: '0.1.0',
        description: 'A system for detecting and trading based on harmonic patterns',
      };
      jest.spyOn(appService, 'getAppInfo').mockImplementation(() => result);
      
      expect(appController.getHello()).toBe(result);
    });
  });
});
