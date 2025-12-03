/**
 * AttendanceDashboard Component Tests
 * 
 * Tests for Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttendanceDashboard } from "./AttendanceDashboard";
import { EmployeeAuthProvider } from "@/shared/context/EmployeeAuthContext";
import { BrowserRouter } from "react-router-dom";
import * as attendanceApi from "@/services/api/attendance";

// Mock the attendance API
vi.mock("@/services/api/attendance", () => ({
    punchIn: vi.fn(),
    punchOut: vi.fn(),
    getAttendanceHistory: vi.fn(),
    getTodayStatus: vi.fn(),
}));

// Mock the EmployeeAuthContext
vi.mock("@/shared/context/EmployeeAuthContext", async () => {
    const actual = await vi.importActual("@/shared/context/EmployeeAuthContext");
    return {
        ...actual,
        useEmployeeAuth: () => ({
            employee: { id: 1, name: "Test Employee", email: "test@example.com" },
            accessToken: "mock-token",
            login: vi.fn(),
            logout: vi.fn(),
            setupPassword: vi.fn(),
        }),
    };
});

const renderComponent = () => {
    return render(
        <BrowserRouter>
            <EmployeeAuthProvider>
                <AttendanceDashboard />
            </EmployeeAuthProvider>
        </BrowserRouter>
    );
};

describe("AttendanceDashboard - Punch-in Button Functionality", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    /**
     * Requirement 1.1: WHEN an employee views the attendance dashboard without an active session 
     * THEN the System SHALL display two distinct buttons labeled "Punch In - Office" and "Punch In - WFH"
     */
    it("should display both 'Punch In - Office' and 'Punch In - WFH' buttons when no active session", async () => {
        // Mock no active session
        vi.mocked(attendanceApi.getTodayStatus).mockResolvedValue({
            hasActiveSession: false,
            attendance: null,
        });

        vi.mocked(attendanceApi.getAttendanceHistory).mockResolvedValue({
            attendances: [],
        });

        renderComponent();

        // Wait for data to load
        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        // Verify both buttons are displayed
        const officeButton = screen.getByRole("button", { name: /punch in - office/i });
        const wfhButton = screen.getByRole("button", { name: /punch in - wfh/i });

        expect(officeButton).toBeInTheDocument();
        expect(wfhButton).toBeInTheDocument();
    });

    /**
     * Requirement 1.2: WHEN an employee clicks "Punch In - Office" 
     * THEN the System SHALL call the punch-in API
     */
    it("should call punch-in API when 'Punch In - Office' button is clicked", async () => {
        const user = userEvent.setup();

        // Mock no active session initially
        vi.mocked(attendanceApi.getTodayStatus).mockResolvedValue({
            hasActiveSession: false,
            attendance: null,
        });

        vi.mocked(attendanceApi.getAttendanceHistory).mockResolvedValue({
            attendances: [],
        });

        vi.mocked(attendanceApi.punchIn).mockResolvedValue({
            attendance: {
                id: 1,
                employeeId: 1,
                date: "2024-01-01",
                checkIn: "2024-01-01T09:00:00Z",
                checkOut: null,
                duration: null,
                type: "Office",
                ipAddress: "192.168.1.1",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
            },
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        const officeButton = screen.getByRole("button", { name: /punch in - office/i });
        await user.click(officeButton);

        // Verify API was called
        expect(attendanceApi.punchIn).toHaveBeenCalledWith("mock-token");
    });

    /**
     * Requirement 1.3: WHEN an employee clicks "Punch In - WFH" 
     * THEN the System SHALL call the punch-in API
     */
    it("should call punch-in API when 'Punch In - WFH' button is clicked", async () => {
        const user = userEvent.setup();

        // Mock no active session initially
        vi.mocked(attendanceApi.getTodayStatus).mockResolvedValue({
            hasActiveSession: false,
            attendance: null,
        });

        vi.mocked(attendanceApi.getAttendanceHistory).mockResolvedValue({
            attendances: [],
        });

        vi.mocked(attendanceApi.punchIn).mockResolvedValue({
            attendance: {
                id: 1,
                employeeId: 1,
                date: "2024-01-01",
                checkIn: "2024-01-01T09:00:00Z",
                checkOut: null,
                duration: null,
                type: "WFH",
                ipAddress: "192.168.1.1",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
            },
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        const wfhButton = screen.getByRole("button", { name: /punch in - wfh/i });
        await user.click(wfhButton);

        // Verify API was called
        expect(attendanceApi.punchIn).toHaveBeenCalledWith("mock-token");
    });

    /**
     * Requirement 1.4: WHEN the punch-in request completes 
     * THEN the System SHALL refresh the attendance status to show the active session
     */
    it("should refresh attendance status after successful punch-in", async () => {
        const user = userEvent.setup();

        // Mock no active session initially
        vi.mocked(attendanceApi.getTodayStatus)
            .mockResolvedValueOnce({
                hasActiveSession: false,
                attendance: null,
            })
            .mockResolvedValueOnce({
                hasActiveSession: true,
                attendance: {
                    id: 1,
                    employeeId: 1,
                    date: "2024-01-01",
                    checkIn: "2024-01-01T09:00:00Z",
                    checkOut: null,
                    duration: null,
                    type: "Office",
                    ipAddress: "192.168.1.1",
                    createdAt: "2024-01-01T09:00:00Z",
                    updatedAt: "2024-01-01T09:00:00Z",
                },
            });

        vi.mocked(attendanceApi.getAttendanceHistory).mockResolvedValue({
            attendances: [],
        });

        vi.mocked(attendanceApi.punchIn).mockResolvedValue({
            attendance: {
                id: 1,
                employeeId: 1,
                date: "2024-01-01",
                checkIn: "2024-01-01T09:00:00Z",
                checkOut: null,
                duration: null,
                type: "Office",
                ipAddress: "192.168.1.1",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
            },
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        const officeButton = screen.getByRole("button", { name: /punch in - office/i });
        await user.click(officeButton);

        // Wait for the status to refresh and show active session
        await waitFor(() => {
            expect(screen.getByText(/active session/i)).toBeInTheDocument();
        });

        // Verify getTodayStatus was called twice (initial load + refresh)
        expect(attendanceApi.getTodayStatus).toHaveBeenCalledTimes(2);
    });

    /**
     * Requirement 1.5: WHEN the attendance type is determined by the backend 
     * THEN the System SHALL display the correct type badge (Office or WFH)
     */
    it("should display correct type badge for Office attendance", async () => {
        // Mock active session with Office type
        vi.mocked(attendanceApi.getTodayStatus).mockResolvedValue({
            hasActiveSession: true,
            attendance: {
                id: 1,
                employeeId: 1,
                date: "2024-01-01",
                checkIn: "2024-01-01T09:00:00Z",
                checkOut: null,
                duration: null,
                type: "Office",
                ipAddress: "192.168.1.1",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
            },
        });

        vi.mocked(attendanceApi.getAttendanceHistory).mockResolvedValue({
            attendances: [],
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        // Verify Office badge is displayed
        const officeBadge = screen.getByText("Office");
        expect(officeBadge).toBeInTheDocument();
    });

    it("should display correct type badge for WFH attendance", async () => {
        // Mock active session with WFH type
        vi.mocked(attendanceApi.getTodayStatus).mockResolvedValue({
            hasActiveSession: true,
            attendance: {
                id: 1,
                employeeId: 1,
                date: "2024-01-01",
                checkIn: "2024-01-01T09:00:00Z",
                checkOut: null,
                duration: null,
                type: "WFH",
                ipAddress: "192.168.1.1",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
            },
        });

        vi.mocked(attendanceApi.getAttendanceHistory).mockResolvedValue({
            attendances: [],
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        // Verify WFH badge is displayed
        const wfhBadge = screen.getByText("WFH");
        expect(wfhBadge).toBeInTheDocument();
    });

    /**
     * Additional test: Verify both buttons call the same handler
     */
    it("should verify both buttons call the same punch-in handler", async () => {
        const user = userEvent.setup();

        vi.mocked(attendanceApi.getTodayStatus).mockResolvedValue({
            hasActiveSession: false,
            attendance: null,
        });

        vi.mocked(attendanceApi.getAttendanceHistory).mockResolvedValue({
            attendances: [],
        });

        vi.mocked(attendanceApi.punchIn).mockResolvedValue({
            attendance: {
                id: 1,
                employeeId: 1,
                date: "2024-01-01",
                checkIn: "2024-01-01T09:00:00Z",
                checkOut: null,
                duration: null,
                type: "Office",
                ipAddress: "192.168.1.1",
                createdAt: "2024-01-01T09:00:00Z",
                updatedAt: "2024-01-01T09:00:00Z",
            },
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        // Click Office button
        const officeButton = screen.getByRole("button", { name: /punch in - office/i });
        await user.click(officeButton);

        expect(attendanceApi.punchIn).toHaveBeenCalledTimes(1);
        expect(attendanceApi.punchIn).toHaveBeenCalledWith("mock-token");

        // Reset and test WFH button
        vi.clearAllMocks();

        vi.mocked(attendanceApi.getTodayStatus).mockResolvedValue({
            hasActiveSession: false,
            attendance: null,
        });

        const wfhButton = screen.getByRole("button", { name: /punch in - wfh/i });
        await user.click(wfhButton);

        expect(attendanceApi.punchIn).toHaveBeenCalledTimes(1);
        expect(attendanceApi.punchIn).toHaveBeenCalledWith("mock-token");
    });
});
