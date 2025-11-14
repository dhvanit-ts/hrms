import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import employeeRoutes from './employee.routes.js';
import leaveRoutes from './leave.routes.js';
import attendanceRoutes from './attendance.routes.js';
import payrollRoutes from './payroll.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/leaves', leaveRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payroll', payrollRoutes);

export default router;


