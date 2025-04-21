// 045. src/infrastructure/database/migrations/create_trade_setups_table.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTradeSetupsTable1684921468000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'trade_setups',
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
            name: 'entry_price',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'stop_loss',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'take_profit1',
            type: 'decimal',
            precision: 20,
            scale: 8,
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
            name: 'risk_reward_ratio',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'is_triggered',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'valid_until',
            type: 'timestamp',
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
      'trades',
      new TableForeignKey({
        columnNames: ['trade_setup_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'trade_setups',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('trades');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('trade_setup_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('trades', foreignKey);
    }
    await queryRunner.dropTable('trade_setups');
  }
}
