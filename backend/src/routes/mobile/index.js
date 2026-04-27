import { Router } from 'express';
import { mobileAuth } from '../../middleware/auth.js';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import activityRoutes from './activities.js';
import tasksRoutes from './tasks.js';
import badgesRoutes from './badges.js';
import streakRoutes from './streak.js';
import communityRoutes from './community.js';
import rewardsRoutes from './rewards.js';
import busStopsRoutes from './busStops.js';
import locationsRoutes from './locations.js';
import notificationsRoutes from './notifications.js';

const router = Router();

// Public
router.use('/auth', authRoutes);
router.use('/locations', locationsRoutes);

// Protected
router.use(mobileAuth);
router.use('/user', userRoutes);
router.use('/activities', activityRoutes);
router.use('/tasks', tasksRoutes);
router.use('/badges', badgesRoutes);
router.use('/streak', streakRoutes);
router.use('/community', communityRoutes);
router.use('/rewards', rewardsRoutes);
router.use('/bus-stops', busStopsRoutes);
router.use('/notifications', notificationsRoutes);

export default router;
