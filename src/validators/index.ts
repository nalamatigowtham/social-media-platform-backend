import Joi from 'joi';

export const userValidation = {
  create: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    email: Joi.string().email().max(100).required(),
    fullName: Joi.string().min(1).max(100).required(),
    bio: Joi.string().max(500).optional().allow('', null),
    avatarUrl: Joi.string().uri().max(255).optional().allow('', null)
  }),
  update: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).optional(),
    email: Joi.string().email().max(100).optional(),
    fullName: Joi.string().min(1).max(100).optional(),
    bio: Joi.string().max(500).optional().allow('', null),
    avatarUrl: Joi.string().uri().max(255).optional().allow('', null)
  })
};

export const postValidation = {
  create: Joi.object({
    content: Joi.string().min(1).max(5000).required(),
    authorId: Joi.string().uuid().required(),
    hashtags: Joi.array().items(Joi.string().min(1).max(100)).optional()
  }),
  update: Joi.object({
    content: Joi.string().min(1).max(5000).optional()
  })
};

export const likeValidation = {
  create: Joi.object({
    userId: Joi.string().uuid().required(),
    postId: Joi.string().uuid().required()
  })
};

export const followValidation = {
  create: Joi.object({
    followerId: Joi.string().uuid().required(),
    followingId: Joi.string().uuid().required()
  })
};

export const hashtagValidation = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required().lowercase()
  })
};

export const activityValidation = {
  create: Joi.object({
    userId: Joi.string().uuid().required(),
    activityType: Joi.string().valid('POST_CREATED', 'POST_LIKED', 'USER_FOLLOWED', 'USER_UNFOLLOWED').required(),
    targetId: Joi.string().uuid().optional().allow(null),
    metadata: Joi.object().optional().allow(null)
  })
};

export const paginationValidation = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
});
