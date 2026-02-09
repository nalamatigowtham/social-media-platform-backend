import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateHashtagTable1713427600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create hashtags table
    await queryRunner.createTable(
      new Table({
        name: 'hashtags',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
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

    await queryRunner.createIndex(
      'hashtags',
      new TableIndex({
        name: 'IDX_hashtags_name',
        columnNames: ['name'],
      })
    );

    // Create post_hashtags join table
    await queryRunner.createTable(
      new Table({
        name: 'post_hashtags',
        columns: [
          {
            name: 'postId',
            type: 'uuid',
          },
          {
            name: 'hashtagId',
            type: 'uuid',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'post_hashtags',
      new TableForeignKey({
        columnNames: ['postId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'posts',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'post_hashtags',
      new TableForeignKey({
        columnNames: ['hashtagId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'hashtags',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'post_hashtags',
      new TableIndex({
        name: 'IDX_post_hashtags_postId_hashtagId',
        columnNames: ['postId', 'hashtagId'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('post_hashtags');
    await queryRunner.dropTable('hashtags');
  }
}
