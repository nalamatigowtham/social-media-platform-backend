import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable, Index, JoinColumn } from 'typeorm';
import { User } from './User';
import { Like } from './Like';
import { Hashtag } from './Hashtag';

@Entity('posts')
@Index(['authorId', 'createdAt'])
@Index(['createdAt'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, user => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Like, like => like.post)
  likes: Like[];

  @ManyToMany(() => Hashtag, hashtag => hashtag.posts)
  @JoinTable({
    name: 'post_hashtags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hashtagId', referencedColumnName: 'id' }
  })
  hashtags: Hashtag[];
}
