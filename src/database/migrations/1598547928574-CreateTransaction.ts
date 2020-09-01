import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from 'typeorm';

export default class CreateTransaction1598547928574
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'transactions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                    },
                    {
                        name: 'value',
                        type: 'integer',
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                    },
                    {
                        name: 'category_id',
                        type: 'uuid',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
                foreignKeys: [
                    new TableForeignKey({
                        name: 'TransactionCategoryFK',
                        columnNames: ['category_id'],
                        referencedColumnNames: ['id'],
                        referencedTableName: 'categories',
                        onDelete: 'RESTRICT',
                        onUpdate: 'CASCADE',
                    }),
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('transactions');
    }
}
