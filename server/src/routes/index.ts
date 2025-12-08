import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/user/user.routes.js";
import employeeRoutes from "../modules/employee/employee.routes.js";
import leaveRoutes from "../modules/leave/leave.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import payrollRoutes from "../modules/payroll/payroll.routes.js";
import bankDetailsRoutes from "../modules/bank-details/bank-details.routes.js";
import holidayRoutes from "../modules/holiday/holiday.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);
router.use("/leaves", leaveRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/payroll", payrollRoutes);
router.use("/bank-details", bankDetailsRoutes);
router.use("/holidays", holidayRoutes);

export default router;
