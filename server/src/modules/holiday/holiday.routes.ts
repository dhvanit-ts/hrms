import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import { HolidayController } from "./holiday.controller.js";

const router = Router();

router.post("/", authenticate, requireRoles("ADMIN"), HolidayController.createHoliday);
router.get("/", authenticate, HolidayController.getAllHolidays);
router.get("/:id", authenticate, HolidayController.getHolidayById);
router.put("/:id", authenticate, requireRoles("ADMIN"), HolidayController.updateHoliday);
router.delete("/:id", authenticate, requireRoles("ADMIN"), HolidayController.deleteHoliday);

export default router;
