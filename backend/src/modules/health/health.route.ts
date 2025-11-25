import { Router } from "express";
import { healthCheck } from "@/modules/health/health.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Server Health Check
 */

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Check server health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get("/", healthCheck);

export default router;
