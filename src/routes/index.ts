import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { PostController } from '../controllers/PostController';
import { LikeController } from '../controllers/LikeController';
import { FollowController } from '../controllers/FollowController';
import { HashtagController } from '../controllers/HashtagController';
import { ActivityController } from '../controllers/ActivityController';

const router = Router();

// User routes
router.get('/users', UserController.getAll);
router.get('/users/:id', UserController.getById);
router.post('/users', UserController.create);
router.put('/users/:id', UserController.update);
router.delete('/users/:id', UserController.delete);
router.get('/users/:id/followers', UserController.getFollowers);
router.get('/users/:id/activity', UserController.getActivity);

// Post routes
router.get('/posts', PostController.getAll);
router.get('/posts/:id', PostController.getById);
router.post('/posts', PostController.create);
router.put('/posts/:id', PostController.update);
router.delete('/posts/:id', PostController.delete);

// Special post endpoints
router.get('/feed', PostController.getFeed);
router.get('/posts/hashtag/:tag', PostController.getByHashtag);

// Like routes
router.get('/likes', LikeController.getAll);
router.get('/likes/:id', LikeController.getById);
router.post('/likes', LikeController.create);
router.delete('/likes/:id', LikeController.delete);

// Follow routes
router.get('/follows', FollowController.getAll);
router.get('/follows/:id', FollowController.getById);
router.post('/follows', FollowController.create);
router.delete('/follows/:id', FollowController.delete);

// Hashtag routes
router.get('/hashtags', HashtagController.getAll);
router.get('/hashtags/:id', HashtagController.getById);
router.post('/hashtags', HashtagController.create);
router.put('/hashtags/:id', HashtagController.update);
router.delete('/hashtags/:id', HashtagController.delete);

// Activity routes
router.get('/activities', ActivityController.getAll);
router.get('/activities/:id', ActivityController.getById);
router.post('/activities', ActivityController.create);
router.delete('/activities/:id', ActivityController.delete);

export default router;
