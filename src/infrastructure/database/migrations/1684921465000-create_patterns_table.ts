// 042. src/infrastructure/database/migrations/create_patterns_table.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePatternsTable1684921465000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'harmonic_patterns',
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
            name: 'pattern_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'direction',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'quality_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'is_valid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'detection_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completion_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'invalidation_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completion_price',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'potential_reversal_zone_high',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'potential_reversal_zone_low',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'entry_price',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'stop_loss',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'take_profit1',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'take_profit2',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'take_profit3',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
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

    await queryRunner.createForeignKey(
      'harmonic_patterns',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('harmonic_patterns');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('harmonic_patterns', foreignKey);
    }
    await queryRunner.dropTable('harmonic_patterns');
  }
}
