import { Router } from "express";
import { healthCheck } from "@/modules/health/health.controller";

const router = Router();

router.get("/", healthCheck);

export default router;
