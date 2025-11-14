import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';
import { createEmp, createEmployeeSchema, getEmp, listEmp, removeEmp, updateEmp, updateEmployeeSchema } from '../controllers/employeeController.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles('HR', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), listEmp);
router.get('/:id', requireRoles('HR', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), getEmp);
router.post('/', requireRoles('HR', 'ADMIN', 'SUPER_ADMIN'), validate(createEmployeeSchema), createEmp);
router.patch('/:id', requireRoles('HR', 'ADMIN', 'SUPER_ADMIN'), validate(updateEmployeeSchema), updateEmp);
router.delete('/:id', requireRoles('ADMIN', 'SUPER_ADMIN'), removeEmp);

export default router;


