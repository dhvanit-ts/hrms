import { Router } from "express";
import { asyncHandlerCb as asyncHandler } from "@/core/http";
import { authenticate, authenticateEmployee, authenticateAny } from "@/core/middlewares/auth.js";
import { requireRoles } from "@/core/middlewares/rbac.js";
import { validate } from "@/core/middlewares/validate.js";
import {
  CreateAttendanceCorrectionTicketSchema,
  CreateExtraLeaveTicketSchema,
  CreateProfileChangeTicketSchema,
  UpdateTicketStatusSchema,
  CreateTicketCommentSchema,
  TicketListQuerySchema,
} from "./ticket.dto.js";
import {
  // Employee controllers
  createAttendanceCorrectionTicketController,
  createExtraLeaveTicketController,
  createProfileChangeTicketController,
  getMyTicketsController,
  getMyTicketByIdController,
  addMyTicketCommentController,
  getMyTicketStatisticsController,
  // Admin controllers
  getAllTicketsController,
  getTicketByIdController,
  updateTicketStatusController,
  addTicketCommentController,
  getTicketStatisticsController,
  // Shared controllers
  getTicketCategoriesController,
} from "./ticket.controller.js";
import { wrapZodSchemaRequest } from "@/lib/zod-schema-wrapper.js";

const router = Router();

// Employee Routes (require employee authentication)
router.post(
  "/attendance-correction",
  authenticateEmployee,
  validate(wrapZodSchemaRequest(CreateAttendanceCorrectionTicketSchema)),
  asyncHandler(createAttendanceCorrectionTicketController)
);

router.post(
  "/extra-leave",
  authenticateEmployee,
  validate(wrapZodSchemaRequest(CreateExtraLeaveTicketSchema)),
  asyncHandler(createExtraLeaveTicketController)
);

router.post(
  "/profile-change",
  authenticateEmployee,
  validate(wrapZodSchemaRequest(CreateProfileChangeTicketSchema)),
  asyncHandler(createProfileChangeTicketController)
);

router.get(
  "/my-tickets",
  authenticateEmployee,
  validate(wrapZodSchemaRequest(TicketListQuerySchema, "query")),
  asyncHandler(getMyTicketsController)
);

router.get(
  "/my-statistics",
  authenticateEmployee,
  asyncHandler(getMyTicketStatisticsController)
);

router.get(
  "/my-tickets/:id",
  authenticateEmployee,
  asyncHandler(getMyTicketByIdController)
);

router.post(
  "/my-tickets/:id/comments",
  authenticateEmployee,
  validate(wrapZodSchemaRequest(CreateTicketCommentSchema)),
  asyncHandler(addMyTicketCommentController)
);

// Admin Routes (require admin/manager authentication)
router.get(
  "/admin/all",
  authenticate,
  requireRoles("ADMIN", "MANAGER", "HR", "SUPER_ADMIN"),
  validate(wrapZodSchemaRequest(TicketListQuerySchema, "query")),
  asyncHandler(getAllTicketsController)
);

router.get(
  "/admin/statistics",
  authenticate,
  requireRoles("ADMIN", "MANAGER", "HR", "SUPER_ADMIN"),
  asyncHandler(getTicketStatisticsController)
);

router.get(
  "/admin/:id",
  authenticate,
  requireRoles("ADMIN", "MANAGER", "HR", "SUPER_ADMIN"),
  asyncHandler(getTicketByIdController)
);

router.patch(
  "/admin/:id/status",
  authenticate,
  requireRoles("ADMIN", "MANAGER", "HR", "SUPER_ADMIN"),
  validate(wrapZodSchemaRequest(UpdateTicketStatusSchema)),
  asyncHandler(updateTicketStatusController)
);

router.post(
  "/admin/:id/comments",
  authenticate,
  requireRoles("ADMIN", "MANAGER", "HR", "SUPER_ADMIN"),
  validate(wrapZodSchemaRequest(CreateTicketCommentSchema)),
  asyncHandler(addTicketCommentController)
);

// Shared Routes (accessible by both employees and admins)
router.get(
  "/categories",
  asyncHandler(getTicketCategoriesController)
);

export default router;