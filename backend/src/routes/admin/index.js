import { Router } from 'express';
import { adminAuth } from '../../middleware/auth.js';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';
import usersRoutes from './users.js';
import activitiesRoutes from './activities.js';
import settingsRoutes from './settings.js';
import securityRoutes from './security.js';
import { crudRouter } from './crudFactory.js';

const router = Router();

// Public
router.use('/auth', authRoutes);

// Protected
router.use(adminAuth);

router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/activities', activitiesRoutes);
router.use('/settings', settingsRoutes);
router.use('/security', securityRoutes);

router.use(
  '/tasks',
  crudRouter({
    table: 'tasks',
    allowed: ['title', 'description', 'type', 'icon', 'cc_reward', 'xp_reward', 'requirement_type', 'requirement_value', 'is_active'],
  })
);
router.use(
  '/rewards',
  crudRouter({
    table: 'rewards',
    allowed: ['title', 'description', 'icon', 'cc_cost', 'stock_count', 'is_active'],
  })
);
router.use(
  '/badges',
  crudRouter({
    table: 'badges',
    allowed: ['name', 'description', 'icon', 'color', 'rarity', 'requirement_code', 'requirement_value', 'cc_reward', 'is_active'],
  })
);
router.use(
  '/bus-stops',
  crudRouter({
    table: 'bus_stops',
    allowed: ['name', 'latitude', 'longitude', 'city_id', 'routes'],
    orderBy: 'city_id, name',
  })
);
router.use(
  '/campaigns',
  crudRouter({
    table: 'campaigns',
    allowed: ['title', 'description', 'start_date', 'end_date', 'is_active', 'image_url', 'cc_bonus_multiplier'],
  })
);
router.use(
  '/community-tasks',
  crudRouter({
    table: 'community_tasks',
    allowed: ['title', 'description', 'target_value', 'current_value', 'unit', 'reward_cc', 'is_completed', 'start_date', 'end_date'],
  })
);
router.use(
  '/cities',
  crudRouter({ table: 'cities', allowed: ['name'], orderBy: 'name' })
);

export default router;
