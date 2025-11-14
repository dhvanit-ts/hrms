import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';
import { assignUserRoles, assignRolesSchema, me, updateMe, updateMeSchema } from '../controllers/userController.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.get('/me', authenticate, me);
router.patch('/me', authenticate, validate(updateMeSchema), updateMe);
router.patch('/:id/roles', authenticate, requireRoles('ADMIN', 'SUPER_ADMIN'), validate(assignRolesSchema), assignUserRoles);

export default router;


