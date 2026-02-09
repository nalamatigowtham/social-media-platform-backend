import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Follow } from '../entities/Follow';
import { Activity, ActivityType } from '../entities/Activity';
import { followValidation, paginationValidation } from '../validators';

const followRepository = AppDataSource.getRepository(Follow);
const activityRepository = AppDataSource.getRepository(Activity);

export const FollowController = {
  async getAll(req: Request, res: Response) {
    try {
      const { error, value } = paginationValidation.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { limit, offset } = value;
      const [follows, total] = await followRepository.findAndCount({
        relations: ['follower', 'following'],
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' }
      });

      res.json({ follows, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const follow = await followRepository.findOne({
        where: { id },
        relations: ['follower', 'following']
      });

      if (!follow) {
        return res.status(404).json({ error: 'Follow not found' });
      }

      res.json(follow);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { error, value } = followValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { followerId, followingId } = value;

      if (followerId === followingId) {
        return res.status(400).json({ error: 'Users cannot follow themselves' });
      }

      // Check if follow already exists
      const existingFollow = await followRepository.findOne({
        where: { followerId, followingId }
      });

      if (existingFollow) {
        return res.status(409).json({ error: 'Already following this user' });
      }

      const follow = followRepository.create({ followerId, followingId });
      await followRepository.save(follow);

      // Create activity
      const activity = activityRepository.create({
        userId: followerId,
        activityType: ActivityType.USER_FOLLOWED,
        targetId: followingId,
        metadata: { followId: follow.id }
      });
      await activityRepository.save(activity);

      const createdFollow = await followRepository.findOne({
        where: { id: follow.id },
        relations: ['follower', 'following']
      });

      res.status(201).json(createdFollow);
    } catch (error: any) {
      if (error.code === '23503') {
        return res.status(404).json({ error: 'Follower or Following user not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const follow = await followRepository.findOne({ where: { id } });
      if (!follow) {
        return res.status(404).json({ error: 'Follow not found' });
      }

      // Create unfollow activity before deleting
      const activity = activityRepository.create({
        userId: follow.followerId,
        activityType: ActivityType.USER_UNFOLLOWED,
        targetId: follow.followingId,
        metadata: { followId: id }
      });
      await activityRepository.save(activity);

      await followRepository.delete(id);

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
