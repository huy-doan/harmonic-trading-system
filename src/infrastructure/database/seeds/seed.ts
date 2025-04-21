// 050. src/infrastructure/database/seeds/seed.ts
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { seedTestData } from './test-data.seed';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [join(__dirname, '../../../**/*.entity{.ts,.js}')],
  synchronize: false,
});

async function runSeeds() {
  try {
    await dataSource.initialize();
    console.log('Database connection established');

    await seedTestData(dataSource);

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Error during seed execution:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();
