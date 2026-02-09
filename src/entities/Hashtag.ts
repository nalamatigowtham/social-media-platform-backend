import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, Index } from 'typeorm';
import { Post } from './Post';

@Entity('hashtags')
@Index(['name'], { unique: true })
export class Hashtag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Post, post => post.hashtags)
  posts: Post[];
}
