import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Follow } from '../entities/Follow';
import { Activity } from '../entities/Activity';
import { userValidation, paginationValidation } from '../validators';
import { Between, In } from 'typeorm';

const userRepository = AppDataSource.getRepository(User);
const followRepository = AppDataSource.getRepository(Follow);
const activityRepository = AppDataSource.getRepository(Activity);

export const UserController = {
  async getAll(req: Request, res: Response) {
    try {
      const { error, value } = paginationValidation.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { limit, offset } = value;
      const [users, total] = await userRepository.findAndCount({
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' }
      });

      res.json({ users, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userRepository.findOne({ where: { id } });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { error, value } = userValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const user = userRepository.create(value);
      await userRepository.save(user);

      res.status(201).json(user);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { error, value } = userValidation.update.validate(req.body);
      
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      Object.assign(user, value);
      await userRepository.save(user);

      res.json(user);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await userRepository.delete(id);

      if (result.affected === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getFollowers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { error, value } = paginationValidation.validate(req.query);
      
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { limit, offset } = value;

      const [follows, total] = await followRepository.findAndCount({
        where: { followingId: id },
        relations: ['follower'],
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' }
      });

      const followers = follows.map(f => ({
        ...f.follower,
        followedAt: f.createdAt
      }));

      res.json({ followers, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getActivity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { error, value } = paginationValidation.validate(req.query);
      
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { limit, offset } = value;
      const { activityType, startDate, endDate } = req.query;

      let whereClause: any = { userId: id };

      if (activityType) {
        whereClause.activityType = activityType;
      }

      if (startDate && endDate) {
        whereClause.createdAt = Between(new Date(startDate as string), new Date(endDate as string));
      }

      const [activities, total] = await activityRepository.findAndCount({
        where: whereClause,
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' }
      });

      res.json({ activities, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
