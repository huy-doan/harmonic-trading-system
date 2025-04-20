import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

// Load .env file
config();

// Create ConfigService manually for CLI commands
const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('POSTGRES_HOST'),
  port: configService.get('POSTGRES_PORT'),
  username: configService.get('POSTGRES_USER'),
  password: configService.get('POSTGRES_PASSWORD'),
  database: configService.get('POSTGRES_DB'),
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../infrastructure/database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: configService.get('NODE_ENV') !== 'production',
  ssl: configService.get('NODE_ENV') === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
});
