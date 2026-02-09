import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';

export enum ActivityType {
  POST_CREATED = 'POST_CREATED',
  POST_LIKED = 'POST_LIKED',
  USER_FOLLOWED = 'USER_FOLLOWED',
  USER_UNFOLLOWED = 'USER_UNFOLLOWED'
}

@Entity('activities')
@Index(['userId', 'createdAt'])
@Index(['activityType', 'createdAt'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, user => user.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ActivityType
  })
  activityType: ActivityType;

  @Column({ type: 'uuid', nullable: true })
  targetId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
