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

const router = Router();

// Employee Routes (require employee authentication)
router.post(
  "/attendance-correction",
  authenticateEmployee,
  validate(CreateAttendanceCorrectionTicketSchema),
  asyncHandler(createAttendanceCorrectionTicketController)
);

router.post(
  "/extra-leave",
  authenticateEmployee,
  validate(CreateExtraLeaveTicketSchema),
  asyncHandler(createExtraLeaveTicketController)
);

router.post(
  "/profile-change",
  authenticateEmployee,
  validate(CreateProfileChangeTicketSchema),
  asyncHandler(createProfileChangeTicketController)
);

router.get(
  "/my-tickets",
  authenticateEmployee,
  validate(TicketListQuerySchema),
  asyncHandler(getMyTicketsController)
);

router.get(
  "/my-tickets/:id",
  authenticateEmployee,
  asyncHandler(getMyTicketByIdController)
);

router.post(
  "/my-tickets/:id/comments",
  authenticateEmployee,
  validate(CreateTicketCommentSchema),
  asyncHandler(addMyTicketCommentController)
);

router.get(
  "/my-statistics",
  authenticateEmployee,
  asyncHandler(getMyTicketStatisticsController)
);

// Admin Routes (require admin/manager authentication)
router.get(
  "/admin/all",
  authenticate,
  requireRoles("ADMIN", "MANAGER", "HR"),
  validate(TicketListQuerySchema),
  asyncHandler(getAllTicketsController)
);

router.get(
  "/admin/:id",
  authenticate,
  requireRoles("ADMIN", "MANAGER", "HR"),
  asyncHandler(getTicketByIdController)
);

router.patch(
  "/admin/:id/status",
  authenticate,
  requireRoles("ADMIN", "MANAGER", "HR"),
  validate(UpdateTicketStatusSchema),
  asyncHandler(updateTicketStatusController)
);

router.post(
  "/admin/:id/comments",
  authenticate,
  requireRoles("ADMIN", "MANAGER", "HR"),
  validate(CreateTicketCommentSchema),
  asyncHandler(addTicketCommentController)
);

router.get(
  "/admin/statistics",
  authenticate,
  requireRoles("ADMIN", "MANAGER", "HR"),
  asyncHandler(getTicketStatisticsController)
);

// Shared Routes (accessible by both employees and admins)
router.get(
  "/categories",
  authenticateAny,
  asyncHandler(getTicketCategoriesController)
);

export default router;