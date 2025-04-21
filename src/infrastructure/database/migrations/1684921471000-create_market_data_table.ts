// src/infrastructure/database/migrations/1684921471000-create_market_data_table.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMarketDataTable1684921471000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'market_data',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'timeframe',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'open_time',
            type: 'bigint',
          },
          {
            name: 'close_time',
            type: 'bigint',
          },
          {
            name: 'open',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'high',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'low',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'close',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'volume',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'quote_asset_volume',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'number_of_trades',
            type: 'integer',
          },
          {
            name: 'taker_buy_base_asset_volume',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'taker_buy_quote_asset_volume',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for faster queries
    await queryRunner.createIndex(
      'market_data',
      new TableIndex({
        name: 'IDX_MARKET_DATA_SYMBOL',
        columnNames: ['symbol'],
      }),
    );

    await queryRunner.createIndex(
      'market_data',
      new TableIndex({
        name: 'IDX_MARKET_DATA_TIMEFRAME',
        columnNames: ['timeframe'],
      }),
    );

    await queryRunner.createIndex(
      'market_data',
      new TableIndex({
        name: 'IDX_MARKET_DATA_OPEN_TIME',
        columnNames: ['open_time'],
      }),
    );

    // Create a unique compound index
    await queryRunner.createIndex(
      'market_data',
      new TableIndex({
        name: 'IDX_MARKET_DATA_UNIQUE',
        columnNames: ['symbol', 'timeframe', 'open_time'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('market_data', 'IDX_MARKET_DATA_UNIQUE');
    await queryRunner.dropIndex('market_data', 'IDX_MARKET_DATA_OPEN_TIME');
    await queryRunner.dropIndex('market_data', 'IDX_MARKET_DATA_TIMEFRAME');
    await queryRunner.dropIndex('market_data', 'IDX_MARKET_DATA_SYMBOL');
    await queryRunner.dropTable('market_data');
  }
}
