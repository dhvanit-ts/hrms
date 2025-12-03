import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LeavesPage } from './Leaves';
import * as leavesApi from '@/services/api/leaves';
import { useAuth } from '@/shared/context/AuthContext';

// Mock the modules
vi.mock('@/shared/context/AuthContext');
vi.mock('@/services/api/leaves');
vi.mock('@/services/api/http', () => ({
    http: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

describe('Leaves Page - Confirmation Dialogs', () => {
    const mockAccessToken = 'test-token';
    const mockUser = {
        id: '1',
        email: 'admin@test.com',
        roles: ['ADMIN']
    };

    const mockPendingLeaves = [
        {
            id: 1,
            employeeId: 2,
            type: 'annual',
            startDate: '2024-01-01',
            endDate: '2024-01-05',
            status: 'pending' as const,
            approverId: null,
            reason: 'Vacation',
            createdAt: '2023-12-01',
            updatedAt: '2023-12-01',
            employee: {
                name: 'John Doe',
                department: 'Engineering',
                email: 'john@test.com'
            }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock useAuth hook
        vi.mocked(useAuth).mockReturnValue({
            accessToken: mockAccessToken,
            user: mockUser,
            isAdmin: true,
            isEmployee: false,
            employee: null,
            employeeAccessToken: null,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            employeeLogin: vi.fn(),
            employeeSetupPassword: vi.fn(),
            employeeLogout: vi.fn(),
        });

        // Mock API calls
        vi.mocked(leavesApi.getPendingLeaves).mockResolvedValue({
            leaves: mockPendingLeaves
        });
        vi.mocked(leavesApi.approveLeave).mockResolvedValue({
            leave: {
                id: 1,
                employeeId: 2,
                type: 'annual',
                startDate: '2024-01-01',
                endDate: '2024-01-05',
                status: 'approved',
                approverId: 1,
                reason: 'Vacation',
                createdAt: '2023-12-01',
                updatedAt: '2023-12-01',
            }
        });
        vi.mocked(leavesApi.rejectLeave).mockResolvedValue({
            leave: {
                id: 1,
                employeeId: 2,
                type: 'annual',
                startDate: '2024-01-01',
                endDate: '2024-01-05',
                status: 'rejected',
                approverId: 1,
                reason: 'Vacation',
                createdAt: '2023-12-01',
                updatedAt: '2023-12-01',
            }
        });

        // Mock window.confirm
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    it('should show confirmation dialog when clicking Approve button', async () => {
        render(<LeavesPage />);

        // Wait for pending leaves to load
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Find and click the Approve button
        const approveButton = screen.getByRole('button', { name: /approve/i });
        fireEvent.click(approveButton);

        // Verify confirmation dialog was shown
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to approve this leave request?');
    });

    it('should call approve API only after confirmation', async () => {
        render(<LeavesPage />);

        // Wait for pending leaves to load
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Click the Approve button
        const approveButton = screen.getByRole('button', { name: /approve/i });
        fireEvent.click(approveButton);

        // Verify API was called
        await waitFor(() => {
            expect(leavesApi.approveLeave).toHaveBeenCalledWith(mockAccessToken, 1);
        });
    });

    it('should not call approve API if confirmation is cancelled', async () => {
        // Mock window.confirm to return false (user cancels)
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        render(<LeavesPage />);

        // Wait for pending leaves to load
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Click the Approve button
        const approveButton = screen.getByRole('button', { name: /approve/i });
        fireEvent.click(approveButton);

        // Verify API was NOT called
        expect(leavesApi.approveLeave).not.toHaveBeenCalled();
    });

    it('should refresh list after approval', async () => {
        render(<LeavesPage />);

        // Wait for initial load
        await waitFor(() => {
            expect(leavesApi.getPendingLeaves).toHaveBeenCalledTimes(1);
        });

        // Click the Approve button
        const approveButton = screen.getByRole('button', { name: /approve/i });
        fireEvent.click(approveButton);

        // Verify list was refreshed (getPendingLeaves called again)
        await waitFor(() => {
            expect(leavesApi.getPendingLeaves).toHaveBeenCalledTimes(2);
        });
    });

    it('should show confirmation dialog when clicking Reject button', async () => {
        render(<LeavesPage />);

        // Wait for pending leaves to load
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Find and click the Reject button
        const rejectButton = screen.getByRole('button', { name: /reject/i });
        fireEvent.click(rejectButton);

        // Verify confirmation dialog was shown
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to reject this leave request?');
    });

    it('should call reject API only after confirmation', async () => {
        render(<LeavesPage />);

        // Wait for pending leaves to load
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Click the Reject button
        const rejectButton = screen.getByRole('button', { name: /reject/i });
        fireEvent.click(rejectButton);

        // Verify API was called
        await waitFor(() => {
            expect(leavesApi.rejectLeave).toHaveBeenCalledWith(mockAccessToken, 1);
        });
    });

    it('should not call reject API if confirmation is cancelled', async () => {
        // Mock window.confirm to return false (user cancels)
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        render(<LeavesPage />);

        // Wait for pending leaves to load
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Click the Reject button
        const rejectButton = screen.getByRole('button', { name: /reject/i });
        fireEvent.click(rejectButton);

        // Verify API was NOT called
        expect(leavesApi.rejectLeave).not.toHaveBeenCalled();
    });

    it('should refresh list after rejection', async () => {
        render(<LeavesPage />);

        // Wait for initial load
        await waitFor(() => {
            expect(leavesApi.getPendingLeaves).toHaveBeenCalledTimes(1);
        });

        // Click the Reject button
        const rejectButton = screen.getByRole('button', { name: /reject/i });
        fireEvent.click(rejectButton);

        // Verify list was refreshed (getPendingLeaves called again)
        await waitFor(() => {
            expect(leavesApi.getPendingLeaves).toHaveBeenCalledTimes(2);
        });
    });
});

describe('Leaves Page - Success Messages', () => {
    const mockAccessToken = 'test-token';
    const mockUser = {
        id: '1',
        email: 'admin@test.com',
        roles: ['ADMIN']
    };

    const mockPendingLeaves = [
        {
            id: 1,
            employeeId: 2,
            type: 'annual',
            startDate: '2024-01-01',
            endDate: '2024-01-05',
            status: 'pending' as const,
            approverId: null,
            reason: 'Vacation',
            createdAt: '2023-12-01',
            updatedAt: '2023-12-01',
            employee: {
                name: 'John Doe',
                department: 'Engineering',
                email: 'john@test.com'
            }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Mock useAuth hook
        vi.mocked(useAuth).mockReturnValue({
            accessToken: mockAccessToken,
            user: mockUser,
            isAdmin: true,
            isEmployee: false,
            employee: null,
            employeeAccessToken: null,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            employeeLogin: vi.fn(),
            employeeSetupPassword: vi.fn(),
            employeeLogout: vi.fn(),
        });

        // Mock API calls
        vi.mocked(leavesApi.getPendingLeaves).mockResolvedValue({
            leaves: mockPendingLeaves
        });
        vi.mocked(leavesApi.approveLeave).mockResolvedValue({
            leave: {
                id: 1,
                employeeId: 2,
                type: 'annual',
                startDate: '2024-01-01',
                endDate: '2024-01-05',
                status: 'approved',
                approverId: 1,
                reason: 'Vacation',
                createdAt: '2023-12-01',
                updatedAt: '2023-12-01',
            }
        });
        vi.mocked(leavesApi.rejectLeave).mockResolvedValue({
            leave: {
                id: 1,
                employeeId: 2,
                type: 'annual',
                startDate: '2024-01-01',
                endDate: '2024-01-05',
                status: 'rejected',
                approverId: 1,
                reason: 'Vacation',
                createdAt: '2023-12-01',
                updatedAt: '2023-12-01',
            }
        });

        // Mock window.confirm
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should display success message after approval', async () => {
        render(<LeavesPage />);

        // Wait for pending leaves to load
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Click the Approve button
        const approveButton = screen.getByRole('button', { name: /approve/i });
        fireEvent.click(approveButton);

        // Verify success message is displayed
        await waitFor(() => {
            expect(screen.getByText('Leave request approved successfully')).toBeInTheDocument();
        });
    });

    it('should display success message after rejection', async () => {
        render(<LeavesPage />);

        // Wait for pending leaves to load
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Click the Reject button
        const rejectButton = screen.getByRole('button', { name: /reject/i });
        fireEvent.click(rejectButton);

        // Verify success message is displayed
        await waitFor(() => {
            expect(screen.getByText('Leave request rejected successfully')).toBeInTheDocument();
        });
    });

    it('should auto-dismiss success message after 3 seconds', async () => {
        render(<LeavesPage />);

        // Wait for pending leaves to load
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Click the Approve button
        const approveButton = screen.getByRole('button', { name: /approve/i });
        fireEvent.click(approveButton);

        // Verify success message is displayed
        await waitFor(() => {
            expect(screen.getByText('Leave request approved successfully')).toBeInTheDocument();
        });

        // Fast-forward time by 3 seconds
        vi.advanceTimersByTime(3000);

        // Verify success message is removed
        await waitFor(() => {
            expect(screen.queryByText('Leave request approved successfully')).not.toBeInTheDocument();
        });
    });
});
