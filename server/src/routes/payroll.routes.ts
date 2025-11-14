import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/rbac.js';
import { listEmpPayrollSchema, listEmployeePayroll, payslipHandler, payslipSchema, upsertPayrollHandler, upsertPayrollSchema } from '../controllers/payrollController.js';
import { validate } from '../middlewares/validate.js';

const router = Router();
router.use(authenticate);

// HR/ADMIN/SUPER_ADMIN can upsert payroll data
router.post('/', requireRoles('HR', 'ADMIN', 'SUPER_ADMIN'), validate(upsertPayrollSchema), upsertPayrollHandler);

// List payroll entries for an employee (HR/ADMIN/SUPER_ADMIN), or allow user to view their own via guard on client
router.get('/employee/:employeeId', requireRoles('HR', 'ADMIN', 'SUPER_ADMIN'), validate(listEmpPayrollSchema), listEmployeePayroll);

// Generate payslip JSON for payroll document (HR/ADMIN/SUPER_ADMIN)
router.get('/:id/payslip', requireRoles('HR', 'ADMIN', 'SUPER_ADMIN'), validate(payslipSchema), payslipHandler);

export default router;


