// 044. src/infrastructure/database/migrations/create_pattern_points_table.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePatternPointsTable1684921467000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pattern_points',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'label',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
          },
          {
            name: 'fibonacci_ratio',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'is_predicted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'confidence_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'pattern_id',
            type: 'uuid',
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
      'pattern_points',
      new TableForeignKey({
        columnNames: ['pattern_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'harmonic_patterns',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('pattern_points');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('pattern_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('pattern_points', foreignKey);
    }
    await queryRunner.dropTable('pattern_points');
  }
}
