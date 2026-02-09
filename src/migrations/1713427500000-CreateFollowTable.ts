import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateFollowTable1713427500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'follows',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'followerId',
            type: 'uuid',
          },
          {
            name: 'followingId',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'follows',
      new TableForeignKey({
        columnNames: ['followerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'follows',
      new TableForeignKey({
        columnNames: ['followingId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'IDX_follows_followerId_followingId',
        columnNames: ['followerId', 'followingId'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'IDX_follows_followingId_createdAt',
        columnNames: ['followingId', 'createdAt'],
      })
    );

    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'IDX_follows_followerId_createdAt',
        columnNames: ['followerId', 'createdAt'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('follows');
  }
}
