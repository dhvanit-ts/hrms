import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import { HolidayController } from "./holiday.controller.js";

const router = Router();

router.post("/", authenticate, requireRoles("SUPER_ADMIN", "ADMIN", "HR"), HolidayController.createHoliday);
router.get("/", authenticate, HolidayController.getAllHolidays);
router.get("/:id", authenticate, HolidayController.getHolidayById);
router.put("/:id", authenticate, requireRoles("SUPER_ADMIN", "ADMIN", "HR"), HolidayController.updateHoliday);
router.delete("/:id", authenticate, requireRoles("SUPER_ADMIN", "ADMIN", "HR"), HolidayController.deleteHoliday);

export default router;
