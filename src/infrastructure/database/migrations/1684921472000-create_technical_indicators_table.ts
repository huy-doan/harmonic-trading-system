// src/infrastructure/database/migrations/1684921472000-create_technical_indicators_table.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTechnicalIndicatorsTable1684921472000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'technical_indicators',
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
            length: '50',
          },
          {
            name: 'timeframe',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'timestamp',
            type: 'bigint',
          },
          {
            name: 'values',
            type: 'jsonb',
          },
          {
            name: 'notes',
            type: 'varchar',
            length: '255',
            isNullable: true,
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
      'technical_indicators',
      new TableIndex({
        name: 'IDX_TECHNICAL_INDICATORS_SYMBOL',
        columnNames: ['symbol'],
      }),
    );

    await queryRunner.createIndex(
      'technical_indicators',
      new TableIndex({
        name: 'IDX_TECHNICAL_INDICATORS_TIMEFRAME',
        columnNames: ['timeframe'],
      }),
    );

    await queryRunner.createIndex(
      'technical_indicators',
      new TableIndex({
        name: 'IDX_TECHNICAL_INDICATORS_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'technical_indicators',
      new TableIndex({
        name: 'IDX_TECHNICAL_INDICATORS_TIMESTAMP',
        columnNames: ['timestamp'],
      }),
    );

    // Create a unique compound index
    await queryRunner.createIndex(
      'technical_indicators',
      new TableIndex({
        name: 'IDX_TECHNICAL_INDICATORS_UNIQUE',
        columnNames: ['symbol', 'timeframe', 'type', 'timestamp'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('technical_indicators', 'IDX_TECHNICAL_INDICATORS_UNIQUE');
    await queryRunner.dropIndex('technical_indicators', 'IDX_TECHNICAL_INDICATORS_TIMESTAMP');
    await queryRunner.dropIndex('technical_indicators', 'IDX_TECHNICAL_INDICATORS_TYPE');
    await queryRunner.dropIndex('technical_indicators', 'IDX_TECHNICAL_INDICATORS_TIMEFRAME');
    await queryRunner.dropIndex('technical_indicators', 'IDX_TECHNICAL_INDICATORS_SYMBOL');
    await queryRunner.dropTable('technical_indicators');
  }
}
