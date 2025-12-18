import { Router } from "express";
import { authenticate } from "../../core/middlewares/auth.js";
import { requireRoles } from "../../core/middlewares/rbac.js";
import { LeadsController } from "./leads.controller.js";
import { validate } from "@/core/middlewares/validate.js";
import { addActivitySchema, createLeadSchema, updateLeadSchema } from "./leads.schema.js";

const router = Router();

// All lead routes require authentication and manager/admin role
router.use(authenticate);
router.use(requireRoles("SUPER_ADMIN", "ADMIN", "MANAGER"));

// Lead CRUD operations
router.get("/", LeadsController.getLeads);
router.get("/stats", LeadsController.getLeadStats);
router.get("/:id", LeadsController.getLeadById);
router.post("/", validate(createLeadSchema), LeadsController.createLead);
router.put("/:id", validate(updateLeadSchema), LeadsController.updateLead);
router.delete("/:id", LeadsController.deleteLead);

// Lead activities
router.post("/:id/activities", validate(addActivitySchema), LeadsController.addActivity);
router.get("/:id/activities", LeadsController.getLeadActivities);

export default router;