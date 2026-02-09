import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Hashtag } from '../entities/Hashtag';
import { hashtagValidation, paginationValidation } from '../validators';

const hashtagRepository = AppDataSource.getRepository(Hashtag);

export const HashtagController = {
  async getAll(req: Request, res: Response) {
    try {
      const { error, value } = paginationValidation.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { limit, offset } = value;
      const [hashtags, total] = await hashtagRepository.findAndCount({
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' }
      });

      res.json({ hashtags, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const hashtag = await hashtagRepository.findOne({ where: { id } });

      if (!hashtag) {
        return res.status(404).json({ error: 'Hashtag not found' });
      }

      res.json(hashtag);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { error, value } = hashtagValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const hashtag = hashtagRepository.create(value);
      await hashtagRepository.save(hashtag);

      res.status(201).json(hashtag);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Hashtag already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { error, value } = hashtagValidation.create.validate(req.body);
      
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const hashtag = await hashtagRepository.findOne({ where: { id } });
      if (!hashtag) {
        return res.status(404).json({ error: 'Hashtag not found' });
      }

      Object.assign(hashtag, value);
      await hashtagRepository.save(hashtag);

      res.json(hashtag);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Hashtag already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await hashtagRepository.delete(id);

      if (result.affected === 0) {
        return res.status(404).json({ error: 'Hashtag not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
