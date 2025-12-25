import { Router } from "express";
import { authenticate, authenticateAny } from "@/core/middlewares/auth.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import { HolidayController } from "./holiday.controller.js";

const router = Router();

router.post("/", authenticate, requireRoles("SUPER_ADMIN", "ADMIN", "HR"), HolidayController.createHoliday);
router.get("/", authenticateAny, HolidayController.getAllHolidays);
router.get("/:id", authenticateAny, HolidayController.getHolidayById);
router.put("/:id", authenticate, requireRoles("SUPER_ADMIN", "ADMIN", "HR"), HolidayController.updateHoliday);
router.delete("/:id", authenticate, requireRoles("SUPER_ADMIN", "ADMIN", "HR"), HolidayController.deleteHoliday);

export default router;
