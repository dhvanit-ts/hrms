# Implementation Plan

- [x] 1. Database schema updates and IP validation service




- [x] 1.1 Create database migration to add type and ipAddress fields to Attendance table

  - Add `type` field (String, nullable) to store 'Office' or 'WFH'
  - Add `ipAddress` field (String, nullable) to store request IP
  - Run migration and verify schema changes
  - _Requirements: 1.1, 1.2_


- [x] 1.2 Implement IP validation service

  - Create `ip-validation.service.ts` with `isOfficeIP` and `getAttendanceType` methods
  - Support CIDR notation for office IP ranges
  - Load office IP ranges from environment variables
  - _Requirements: 1.1, 1.2_

- [ ]* 1.3 Write unit tests for IP validation service
  - Test specific office IP ranges
  - Test CIDR notation parsing
  - Test edge cases (localhost, private ranges)
  - _Requirements: 1.1, 1.2_

- [x] 2. Enhanced attendance service with IP-based validation





- [x] 2.1 Update attendance service punch-in method


  - Extract IP address from request
  - Use IP validation service to determine attendance type
  - Check for existing active session before creating record
  - Store IP address and type in Attendance record
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ]* 2.2 Write property test for office IP punch-in
  - **Property 1: Office IP punch-in creates Office attendance**
  - **Validates: Requirements 1.1**

- [ ]* 2.3 Write property test for WFH IP punch-in
  - **Property 2: Non-office IP punch-in creates WFH attendance**
  - **Validates: Requirements 1.2**

- [ ]* 2.4 Write property test for duplicate punch-in prevention
  - **Property 3: Duplicate punch-in prevention**
  - **Validates: Requirements 1.3**

- [x] 2.5 Update attendance service punch-out method


  - Verify active session exists before updating
  - Calculate duration in minutes
  - Update record with punch-out timestamp and duration
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 2.6 Write property test for punch-out updates
  - **Property 4: Punch-out updates attendance with timestamp**
  - **Validates: Requirements 2.1**

- [ ]* 2.7 Write property test for punch-out without session
  - **Property 5: Punch-out without session is rejected**
  - **Validates: Requirements 2.2**

- [ ]* 2.8 Write property test for duration calculation
  - **Property 6: Duration calculation correctness**
  - **Validates: Requirements 2.3**

- [x] 2.9 Implement attendance history and status methods


  - Add `getAttendanceHistory` with date range filtering
  - Add `getTodayStatus` to check for active sessions
  - Ensure records are ordered by date descending
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 2.10 Write property test for attendance history ordering
  - **Property 7: Attendance history ordering**
  - **Validates: Requirements 3.1**

- [ ]* 2.11 Write property test for date range filtering
  - **Property 8: Date range filtering correctness**
  - **Validates: Requirements 3.3**

- [ ]* 2.12 Write property test for active session status
  - **Property 9: Active session status accuracy**
  - **Validates: Requirements 3.4**
-

- [x] 3. Update attendance controller and routes




- [x] 3.1 Update attendance controller to extract IP from request


  - Modify `checkInHandler` to pass IP address to service
  - Update request/response types to include new fields
  - Add error handling for business rule violations
  - _Requirements: 1.1, 1.2, 9.1, 9.2_

- [x] 3.2 Add new attendance endpoints


  - Add GET `/api/attendance/history` endpoint with date filtering
  - Add GET `/api/attendance/today` endpoint for current status
  - Update route definitions
  - _Requirements: 3.1, 3.3, 3.4, 9.1, 9.2_

- [ ]* 3.3 Write unit tests for attendance controller
  - Test request validation with invalid inputs
  - Test authentication middleware integration
  - Test response formatting
  - _Requirements: 9.1, 9.2, 9.5_


- [x] 4. Checkpoint - Ensure attendance tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Enhanced leave service with validation




- [x] 5.1 Implement leave validation methods

  - Create `validateLeaveApplication` method
  - Check start date is not in past
  - Check end date is not before start date
  - Check for overlapping leave applications
  - Verify sufficient leave balance
  - _Requirements: 4.1, 4.2, 4.3, 8.1, 8.3_

- [ ]* 5.2 Write property test for past date rejection
  - **Property 10: Past date rejection**
  - **Validates: Requirements 4.1**

- [ ]* 5.3 Write property test for end date validation
  - **Property 11: End date validation**
  - **Validates: Requirements 4.2**

- [ ]* 5.4 Write property test for overlap detection
  - **Property 12: Overlap detection**
  - **Validates: Requirements 4.3**

- [x] 5.5 Update leave application method


  - Call validation before creating leave request
  - Set initial status to "pending"
  - Ensure all required fields are included
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.6 Write property test for initial leave status
  - **Property 13: Initial leave status**
  - **Validates: Requirements 4.4**

- [x] 5.7 Implement leave history and filtering methods


  - Update `listMyLeaves` to support status filtering
  - Ensure records are ordered by submission date descending
  - Add filtering for pending leaves only
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 5.8 Write property test for leave history ordering
  - **Property 14: Leave history ordering**
  - **Validates: Requirements 5.1**

- [ ]* 5.9 Write property test for pending leave filtering
  - **Property 15: Pending leave filtering**
  - **Validates: Requirements 5.3**

- [x] 5.10 Update leave balance calculation


  - Ensure balance calculation subtracts approved leaves from annual allocation
  - Support year-based filtering
  - _Requirements: 5.4, 8.2_

- [ ]* 5.11 Write property test for leave balance calculation
  - **Property 16: Leave balance calculation**
  - **Validates: Requirements 5.4, 8.2**

- [ ]* 5.12 Write property test for insufficient balance rejection
  - **Property 24: Insufficient balance rejection**
  - **Validates: Requirements 8.1, 8.3**

- [x] 6. Leave notification service



- [x] 6.1 Create leave email templates


  - Create LeaveApprovedEmail template with leave details
  - Create LeaveRejectedEmail template with leave details
  - Include employee name, dates, leave type in templates
  - _Requirements: 6.3, 6.4_

- [x] 6.2 Implement leave notification service


  - Create `sendApprovalNotification` method
  - Create `sendRejectionNotification` method
  - Integrate with existing mail service
  - Handle email failures gracefully (log but don't block)
  - _Requirements: 6.3, 6.4_

- [x] 6.3 Implement leave approval and rejection methods


  - Create `approveLeave` method that updates status and records approver
  - Create `rejectLeave` method that updates status and records approver
  - Trigger email notifications after status update
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 6.4 Write property test for approval updates
  - **Property 17: Approval updates status and records approver**
  - **Validates: Requirements 6.1**

- [ ]* 6.5 Write property test for rejection updates
  - **Property 18: Rejection updates status and records approver**
  - **Validates: Requirements 6.2**

- [ ]* 6.6 Write property test for approval email notification
  - **Property 19: Approval triggers email notification**
  - **Validates: Requirements 6.3**

- [ ]* 6.7 Write property test for rejection email notification
  - **Property 20: Rejection triggers email notification**
  - **Validates: Requirements 6.4**

- [ ]* 6.8 Write property test for conflicting approval prevention
  - **Property 25: Conflicting approval prevention**
  - **Validates: Requirements 8.4**

- [ ] 7. Admin leave management endpoints

- [x] 7.1 Implement admin pending leaves method


  - Update `listPendingLeaves` to include employee details
  - Support department filtering
  - Support date range filtering for overlapping leaves
  - Ensure records are ordered by submission date
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 7.2 Write property test for admin pending leaves ordering
  - **Property 21: Admin pending leaves ordering**
  - **Validates: Requirements 7.1**

- [ ]* 7.3 Write property test for department filtering
  - **Property 22: Department filtering correctness**
  - **Validates: Requirements 7.3**

- [ ]* 7.4 Write property test for admin date range filtering
  - **Property 23: Admin date range filtering**
  - **Validates: Requirements 7.4**


- [x] 8. Update leave controller and routes





- [x] 8.1 Update leave controller with new endpoints


  - Add POST `/api/leaves` endpoint with validation
  - Add GET `/api/leaves/my-leaves` with status filtering
  - Add GET `/api/leaves/balance` endpoint
  - Add GET `/api/leaves/pending` endpoint (admin only)
  - Add PATCH `/api/leaves/:id/approve` endpoint (admin only)
  - Add PATCH `/api/leaves/:id/reject` endpoint (admin only)
  - _Requirements: 4.1-4.5, 5.1-5.4, 6.1-6.5, 7.1-7.4, 9.3, 9.4_

- [x] 8.2 Add admin authorization middleware


  - Verify user has admin role before allowing approval/rejection
  - Return 403 for non-admin users
  - _Requirements: 6.5_

- [ ]* 8.3 Write unit tests for leave controller
  - Test request validation with invalid inputs
  - Test admin authorization
  - Test response formatting
  - _Requirements: 9.3, 9.4, 9.5_



- [x] 9. Checkpoint - Ensure leave tests pass





  - Ensure all tests pass, ask the user if questions arise.


- [x] 10. Frontend attendance components


- [x] 10.1 Create AttendanceDashboard component

  - Display today's attendance status
  - Show punch-in/punch-out times
  - Add "Punch In - Office" and "Punch In - WFH" buttons


  - Show active session indicator
  - Display attendance history table
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.4_


- [x] 10.2 Implement attendance API service

  - Create `punchIn` method
  - Create `punchOut` method
  - Create `getAttendanceHistory` method
  - Create `getTodayStatus` method
  - Handle loading and error states
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.4_

- [x] 10.3 Wire up attendance dashboard with API

  - Connect buttons to API calls
  - Display real-time attendance data
  - Show loading spinners during API calls
  - Display error messages for failures
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.4_

- [x] 11. Frontend leave management components



- [x] 11.1 Create LeaveManagement component


  - Build leave application form with date pickers
  - Display leave history table with status indicators
  - Show leave balance
  - Add filter by status (pending/approved/rejected)
  - _Requirements: 4.1-4.5, 5.1-5.4_

- [x] 11.2 Implement leave API service


  - Create `applyLeave` method
  - Create `getMyLeaves` method
  - Create `getLeaveBalance` method
  - Handle validation errors from backend
  - _Requirements: 4.1-4.5, 5.1-5.4_

- [x] 11.3 Wire up leave management with API


  - Connect form submission to API
  - Display leave history from API
  - Show leave balance from API
  - Display validation errors
  - _Requirements: 4.1-4.5, 5.1-5.4_



- [x] 12. Frontend admin leave management


- [x] 12.1 Create PendingLeavesTable component
  - List all pending leave requests
  - Show employee details, department, dates
  - Add approve/reject action buttons


  - Add filters for department and date range
  - _Requirements: 7.1-7.4, 6.1, 6.2_

- [x] 12.2 Implement admin leave API service
  - Create `getPendingLeaves` method with filters

  - Create `approveLeave` method
  - Create `rejectLeave` method
  - Handle authorization errors
  - _Requirements: 7.1-7.4, 6.1, 6.2_

- [x] 12.3 Wire up admin components with API

  - Connect approve/reject buttons to API
  - Refresh list after approval/rejection
  - Show confirmation dialogs
  - Display success/error messages
  - _Requirements: 7.1-7.4, 6.1, 6.2_


- [x] 13. Final checkpoint - Integration testing


  - Ensure all tests pass, ask the user if questions arise.
