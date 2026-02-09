import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Post } from '../entities/Post';
import { Hashtag } from '../entities/Hashtag';
import { Follow } from '../entities/Follow';
import { Activity, ActivityType } from '../entities/Activity';
import { postValidation, paginationValidation } from '../validators';
import { In, ILike } from 'typeorm';

const postRepository = AppDataSource.getRepository(Post);
const hashtagRepository = AppDataSource.getRepository(Hashtag);
const followRepository = AppDataSource.getRepository(Follow);
const activityRepository = AppDataSource.getRepository(Activity);

export const PostController = {
  async getAll(req: Request, res: Response) {
    try {
      const { error, value } = paginationValidation.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { limit, offset } = value;
      const [posts, total] = await postRepository.findAndCount({
        relations: ['author', 'hashtags', 'likes'],
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' }
      });

      const postsWithCounts = posts.map(post => ({
        ...post,
        likeCount: post.likes?.length || 0,
        likes: undefined
      }));

      res.json({ posts: postsWithCounts, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await postRepository.findOne({
        where: { id },
        relations: ['author', 'hashtags', 'likes']
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const postWithCount = {
        ...post,
        likeCount: post.likes?.length || 0,
        likes: undefined
      };

      res.json(postWithCount);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { error, value } = postValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { content, authorId, hashtags: hashtagNames } = value;

      const post = postRepository.create({ content, authorId });

      if (hashtagNames && hashtagNames.length > 0) {
        const hashtags = await Promise.all(
          hashtagNames.map(async (name: string) => {
            const normalizedName = name.toLowerCase().replace(/^#/, '');
            let hashtag = await hashtagRepository.findOne({ where: { name: normalizedName } });
            
            if (!hashtag) {
              hashtag = hashtagRepository.create({ name: normalizedName });
              await hashtagRepository.save(hashtag);
            }
            
            return hashtag;
          })
        );
        
        post.hashtags = hashtags;
      }

      await postRepository.save(post);

      // Create activity
      const activity = activityRepository.create({
        userId: authorId,
        activityType: ActivityType.POST_CREATED,
        targetId: post.id,
        metadata: { content: content.substring(0, 100) }
      });
      await activityRepository.save(activity);

      const createdPost = await postRepository.findOne({
        where: { id: post.id },
        relations: ['author', 'hashtags']
      });

      res.status(201).json(createdPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { error, value } = postValidation.update.validate(req.body);
      
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const post = await postRepository.findOne({ where: { id } });
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      Object.assign(post, value);
      await postRepository.save(post);

      const updatedPost = await postRepository.findOne({
        where: { id },
        relations: ['author', 'hashtags']
      });

      res.json(updatedPost);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await postRepository.delete(id);

      if (result.affected === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getFeed(req: Request, res: Response) {
    try {
      const { userId, limit, offset } = req.query;
    
      if (!userId) {
        return res.status(400).json({ error: 'userId query parameter is required' });
      }

      // Validate pagination params separately
      const paginationParams = { 
        limit: limit ? Number(limit) : 10, 
        offset: offset ? Number(offset) : 0 
      };
    
      const { error, value } = paginationValidation.validate(paginationParams);
    
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const finalLimit = value.limit;
      const finalOffset = value.offset;

      // Get users that the current user follows
      const follows = await followRepository.find({
        where: { followerId: userId as string },
        select: ['followingId']
      });

      const followingIds = follows.map(f => f.followingId);

      if (followingIds.length === 0) {
        return res.json({ posts: [], total: 0, limit: finalLimit, offset: finalOffset });
      }

      const [posts, total] = await postRepository.findAndCount({
        where: { authorId: In(followingIds) },
        relations: ['author', 'hashtags', 'likes'],
        take: finalLimit,
        skip: finalOffset,
        order: { createdAt: 'DESC' }
      });

      const postsWithCounts = posts.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: post.author.id,
          username: post.author.username,
          fullName: post.author.fullName,
          avatarUrl: post.author.avatarUrl
        },
        hashtags: post.hashtags.map(h => ({ id: h.id, name: h.name })),
        likeCount: post.likes?.length || 0
      }));

      res.json({ posts: postsWithCounts, total, limit: finalLimit, offset: finalOffset });
    } catch (error) {
      console.error('Feed error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
},

  async getByHashtag(req: Request, res: Response) {
    try {
      const { tag } = req.params;
      const { error, value } = paginationValidation.validate(req.query);
      
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { limit, offset } = value;
      const normalizedTag = tag.toLowerCase().replace(/^#/, '');

      const hashtag = await hashtagRepository.findOne({
        where: { name: ILike(normalizedTag) },
        relations: ['posts', 'posts.author', 'posts.hashtags', 'posts.likes']
      });

      if (!hashtag) {
        return res.json({ posts: [], total: 0, limit, offset });
      }

      const total = hashtag.posts.length;
      const paginatedPosts = hashtag.posts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit);

      const postsWithCounts = paginatedPosts.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: post.author.id,
          username: post.author.username,
          fullName: post.author.fullName,
          avatarUrl: post.author.avatarUrl
        },
        hashtags: post.hashtags.map(h => ({ id: h.id, name: h.name })),
        likeCount: post.likes?.length || 0
      }));

      res.json({ posts: postsWithCounts, total, limit, offset, hashtag: normalizedTag });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
