import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './entities/User';
import { Post } from './entities/Post';
import { Like } from './entities/Like';
import { Follow } from './entities/Follow';
import { Hashtag } from './entities/Hashtag';
import { Activity } from './entities/Activity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'social_media_db',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Post, Like, Follow, Hashtag, Activity],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});
