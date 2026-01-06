import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/user/user.routes.js";
import employeeRoutes from "../modules/employee/employee.routes.js";
import leaveRoutes from "../modules/leave/leave.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import payrollRoutes from "../modules/payroll/payroll.routes.js";
import bankDetailsRoutes from "../modules/bank-details/bank-details.routes.js";
import holidayRoutes from "../modules/holiday/holiday.routes.js";
import { statsRoutes } from "../modules/stats/stats.routes.js";
import { auditRoutes } from "../modules/audit/audit.routes.js";
import departmentRoutes from "../modules/department/department.routes.js";
import jobRoleRoutes from "../modules/job-role/job-role.routes.js";
import shiftRoutes from "../modules/shift/shift.routes.js";
import leadsRoutes from "../modules/leads/leads.routes.js";
import notificationRoutes from "../modules/notification-rejected/notification.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);
router.use("/leaves", leaveRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/payroll", payrollRoutes);
router.use("/bank-details", bankDetailsRoutes);
router.use("/holidays", holidayRoutes);
router.use("/departments", departmentRoutes);
router.use("/job-roles", jobRoleRoutes);
router.use("/shifts", shiftRoutes);
router.use("/leads", leadsRoutes);
router.use("/stats", statsRoutes);
router.use("/audit", auditRoutes);
router.use("/notifications", notificationRoutes);

export default router;
