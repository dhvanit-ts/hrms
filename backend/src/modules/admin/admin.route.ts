import express from "express";
import adminController from "@/modules/admin/admin.controller";

const router = express.Router();

router.get("/:adminId", adminController.getAdmin);
router.post("/", adminController.createAdmin);
router.patch("/:adminId/promote", adminController.promoteUser);
router.patch("/:adminId/revoke", adminController.revokeAdmin);

export default router;
