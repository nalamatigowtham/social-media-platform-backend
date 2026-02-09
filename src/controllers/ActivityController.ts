import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Activity } from '../entities/Activity';
import { activityValidation, paginationValidation } from '../validators';

const activityRepository = AppDataSource.getRepository(Activity);

export const ActivityController = {
  async getAll(req: Request, res: Response) {
    try {
      const { error, value } = paginationValidation.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { limit, offset } = value;
      const [activities, total] = await activityRepository.findAndCount({
        relations: ['user'],
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' }
      });

      res.json({ activities, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const activity = await activityRepository.findOne({
        where: { id },
        relations: ['user']
      });

      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { error, value } = activityValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const activity = activityRepository.create(value);
      await activityRepository.save(activity);

      const createdActivity = await activityRepository.findOne({
        where: { id: activity.id },
        relations: ['user']
      });

      res.status(201).json(createdActivity);
    } catch (error: any) {
      if (error.code === '23503') {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await activityRepository.delete(id);

      if (result.affected === 0) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
