import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Like } from '../entities/Like';
import { Activity, ActivityType } from '../entities/Activity';
import { likeValidation, paginationValidation } from '../validators';

const likeRepository = AppDataSource.getRepository(Like);
const activityRepository = AppDataSource.getRepository(Activity);

export const LikeController = {
  async getAll(req: Request, res: Response) {
    try {
      const { error, value } = paginationValidation.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { limit, offset } = value;
      const [likes, total] = await likeRepository.findAndCount({
        relations: ['user', 'post'],
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' }
      });

      res.json({ likes, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const like = await likeRepository.findOne({
        where: { id },
        relations: ['user', 'post']
      });

      if (!like) {
        return res.status(404).json({ error: 'Like not found' });
      }

      res.json(like);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { error, value } = likeValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { userId, postId } = value;

      // Check if like already exists
      const existingLike = await likeRepository.findOne({
        where: { userId, postId }
      });

      if (existingLike) {
        return res.status(409).json({ error: 'Post already liked by this user' });
      }

      const like = likeRepository.create({ userId, postId });
      await likeRepository.save(like);

      // Create activity
      const activity = activityRepository.create({
        userId,
        activityType: ActivityType.POST_LIKED,
        targetId: postId,
        metadata: { likeId: like.id }
      });
      await activityRepository.save(activity);

      const createdLike = await likeRepository.findOne({
        where: { id: like.id },
        relations: ['user', 'post']
      });

      res.status(201).json(createdLike);
    } catch (error: any) {
      if (error.code === '23503') {
        return res.status(404).json({ error: 'User or Post not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await likeRepository.delete(id);

      if (result.affected === 0) {
        return res.status(404).json({ error: 'Like not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
