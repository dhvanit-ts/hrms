import { Router } from "express";
import { asyncHandlerCb as asyncHandler } from "@/core/http";
import { AttendanceCorrectionController } from "./attendance-correction.controller.js";

const router = Router();

// Employee routes
router.post(
  "/",
  asyncHandler(AttendanceCorrectionController.createRequest)
);

router.get(
  "/my-requests",
  asyncHandler(AttendanceCorrectionController.getMyRequests)
);

router.get(
  "/:id",
  asyncHandler(AttendanceCorrectionController.getRequestById)
);

export { router as attendanceCorrectionEmployeeRoutes };

// Admin routes
const adminRouter = Router();

adminRouter.get(
  "/",
  asyncHandler(AttendanceCorrectionController.getAllRequests)
);

adminRouter.get(
  "/:id",
  asyncHandler(AttendanceCorrectionController.getRequestById)
);

adminRouter.patch(
  "/:id/review",
  asyncHandler(AttendanceCorrectionController.reviewRequest)
);

export { adminRouter as attendanceCorrectionAdminRoutes };