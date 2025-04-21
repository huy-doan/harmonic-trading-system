// 046. src/infrastructure/database/migrations/create_risk_profiles_table.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateRiskProfilesTable1684921469000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'risk_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'risk_per_trade',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'max_daily_risk',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'max_weekly_risk',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'max_monthly_risk',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'max_concurrent_trades',
            type: 'int',
          },
          {
            name: 'use_trailing_stop',
            type: 'boolean',
            default: true,
          },
          {
            name: 'trailing_stop_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'max_position_size',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'user_id',
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
      'risk_profiles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('risk_profiles');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('risk_profiles', foreignKey);
    }
    await queryRunner.dropTable('risk_profiles');
  }
}
