import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from './database.config';
import { join } from 'path';
import { env, isDevelopment } from '@config/env.config';

/**
 * Cấu hình TypeORM không đồng bộ
 */
export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule.forFeature(databaseConfig)],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
    const dbConfig = configService.get('database');
    return dbConfig || typeOrmConfig; // Đảm bảo luôn trả về một đối tượng hợp lệ
  },
  dataSourceFactory: async (options: DataSourceOptions) => {
    return new DataSource(options).initialize();
  },
};

/**
 * Cấu hình TypeORM cho migration
 */
export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: env.POSTGRES_HOST || 'localhost',
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER || 'postgres',
  password: env.POSTGRES_PASSWORD || 'postgres',
  database: env.POSTGRES_DB || 'harmonic_trading',
  
  // Điều chỉnh đường dẫn entities và migrations để hoạt động trong cả development và production
  entities: [
    join(__dirname, '..', '**', '*.entity.{ts,js}')
  ],
  migrations: [
    join(__dirname, '..', 'infrastructure', 'database', 'migrations', '*.{ts,js}')
  ],
  
  // Các tùy chọn khác
  synchronize: false,
  logging: isDevelopment,
  migrationsRun: false,
  // Sử dụng connectTimeoutMS để tránh lỗi timeout khi kết nối
  extra: {
    connectionTimeoutMillis: 10000,
  },
};

/**
 * DataSource cho TypeORM Migration
 */
export const dataSource = new DataSource(typeOrmConfig);
