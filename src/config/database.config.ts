import { registerAs } from '@nestjs/config';
import { env } from './env.config';

/**
 * Cấu hình cơ sở dữ liệu
 */
export const databaseConfig = registerAs('database', () => ({
  type: 'postgres',
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/infrastructure/database/migrations/*{.ts,.js}'],
  migrationsRun: true,
  synchronize: env.NODE_ENV === 'development',
  logging: env.NODE_ENV === 'development',
  keepConnectionAlive: true,
  ssl: env.NODE_ENV === 'production',
}));
