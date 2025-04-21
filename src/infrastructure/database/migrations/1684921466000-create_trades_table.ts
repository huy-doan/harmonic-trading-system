// 043. src/infrastructure/database/migrations/create_trades_table.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTradesTable1684921466000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'trades',
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
            name: 'order_id',
            type: 'varchar',
            length: '20',
            isNullable: true,
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
            name: 'quantity',
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
            name: 'take_profit',
            type: 'decimal',
            precision: 20,
            scale: 8,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'OPEN'",
          },
          {
            name: 'exit_price',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'entry_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'exit_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'profit_loss',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'profit_loss_percent',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'is_simulated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'pattern_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'trade_setup_id',
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
      'trades',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'trades',
      new TableForeignKey({
        columnNames: ['pattern_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'harmonic_patterns',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('trades');
    
    const userForeignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    if (userForeignKey) {
      await queryRunner.dropForeignKey('trades', userForeignKey);
    }

    const patternForeignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('pattern_id') !== -1,
    );
    if (patternForeignKey) {
      await queryRunner.dropForeignKey('trades', patternForeignKey);
    }

    await queryRunner.dropTable('trades');
  }
}
