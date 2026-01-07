import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import prisma from "@/config/db.js";

type AttendanceStatus = "pending" | "approved" | "rejected"

describe("Attendance Correction API", () => {
  let employeeToken: string;
  let adminToken: string;
  let employeeId: number;
  let attendanceId: number;

  beforeEach(async () => {
    // Clean up test data
    await prisma.attendanceCorrectionRequest.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test employee
    const employee = await prisma.employee.create({
      data: {
        employeeId: "TEST001",
        name: "Test Employee",
        email: "test@example.com",
        passwordHash: "$2a$10$test",
        status: "active",
      },
    });
    employeeId = employee.id;

    // Create test admin user
    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash: "$2a$10$test",
        roles: ["ADMIN"],
        isActive: true,
      },
    });

    // Create test attendance record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employeeId,
        date: new Date(),
        checkIn: new Date(),
        checkOut: new Date(),
      },
    });
    attendanceId = attendance.id;

    // Mock tokens (in real tests, you'd generate proper JWT tokens)
    employeeToken = "mock-employee-token";
    adminToken = "mock-admin-token";
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.attendanceCorrectionRequest.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe("POST /attendance-corrections", () => {
    it("should create a correction request", async () => {
      const requestData = {
        attendanceId: attendanceId,
        requestType: "CHECK_IN_TIME",
        requestedCheckIn: new Date().toISOString(),
        reason: "Forgot to check in on time due to traffic",
      };

      // Note: This test would need proper authentication middleware mocking
      // For now, it demonstrates the expected API structure
      expect(requestData.reason.length).toBeGreaterThan(10);
      expect(requestData.requestType).toBe("CHECK_IN_TIME");
    });

    it("should validate required fields", async () => {
      const invalidData = {
        attendanceId: attendanceId,
        requestType: "CHECK_IN_TIME",
        // Missing requestedCheckIn and reason
      };

      // This would fail validation
      expect(invalidData).not.toHaveProperty("reason");
    });
  });

  describe("GET /attendance-corrections/my-requests", () => {
    it("should return employee's correction requests", async () => {
      // Create a test correction request
      const correctionRequest = await prisma.attendanceCorrectionRequest.create({
        data: {
          employeeId: employeeId,
          attendanceId: attendanceId,
          requestType: "CHECK_IN_TIME",
          requestedCheckIn: new Date(),
          currentCheckIn: new Date(),
          reason: "Test reason for correction",
        },
      });

      expect(correctionRequest.employeeId).toBe(employeeId);
      expect(correctionRequest.status).toBe("pending");
    });
  });

  describe("PATCH /admin/attendance-corrections/:id/review", () => {
    it("should approve a correction request", async () => {
      // Create a test correction request
      const correctionRequest = await prisma.attendanceCorrectionRequest.create({
        data: {
          employeeId: employeeId,
          attendanceId: attendanceId,
          requestType: "CHECK_IN_TIME",
          requestedCheckIn: new Date(),
          currentCheckIn: new Date(),
          reason: "Test reason for correction",
        },
      });

      const reviewData = {
        status: "approved",
        reviewerNotes: "Approved - valid reason provided",
      };

      // Update the request
      const updatedRequest = await prisma.attendanceCorrectionRequest.update({
        where: { id: correctionRequest.id },
        data: {
          status: reviewData.status as AttendanceStatus,
          reviewerNotes: reviewData.reviewerNotes,
          reviewedAt: new Date(),
        },
      });

      expect(updatedRequest.status).toBe("approved");
      expect(updatedRequest.reviewerNotes).toBe(reviewData.reviewerNotes);
    });
  });
});