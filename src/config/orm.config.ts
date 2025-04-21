// src/config/orm.config.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config();

/**
 * Configuration for TypeORM CLI
 */
export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'harmonic_trading',
  
  // Adjust paths for entities and migrations
  entities: [
    join(__dirname, '..', '**', '*.entity.{ts,js}')
  ],
  migrations: [
    join(__dirname, '..', 'infrastructure', 'database', 'migrations', '*.{ts,js}')
  ],
  
  synchronize: false,
  logging: true,
  migrationsRun: false,
};

/**
 * DataSource for TypeORM CLI - used for migrations
 */
const dataSource = new DataSource(typeOrmConfig);
export default dataSource;
