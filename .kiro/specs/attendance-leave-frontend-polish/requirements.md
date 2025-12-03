# Requirements Document

## Introduction

This document specifies the requirements for polishing the Attendance and Leave Management frontend UI to ensure it fully implements PHASE 3 of the HRM system. The focus is on refining the user experience, ensuring proper integration between frontend components and backend APIs, and addressing any remaining gaps in the implementation.

## Glossary

- **System**: The Attendance and Leave Management Frontend Application
- **Employee Dashboard**: The interface where employees view and manage their attendance and leave
- **Admin Dashboard**: The interface where administrators review and approve leave requests
- **Punch-In Action**: The user action to record the start of a work session
- **Attendance Type**: The classification of attendance as either "Office" or "WFH" (Work From Home)
- **Leave Status Indicator**: Visual feedback showing the current state of a leave request

## Requirements

### Requirement 1

**User Story:** As an employee, I want clear visual distinction between office and work-from-home punch-in options, so that I can accurately record my attendance type.

#### Acceptance Criteria

1. WHEN an employee views the attendance dashboard without an active session THEN the System SHALL display two distinct buttons labeled "Punch In - Office" and "Punch In - WFH"
2. WHEN an employee clicks "Punch In - Office" THEN the System SHALL call the punch-in API and the backend SHALL determine the type based on IP address
3. WHEN an employee clicks "Punch In - WFH" THEN the System SHALL call the punch-in API and the backend SHALL determine the type based on IP address
4. WHEN the punch-in request completes THEN the System SHALL refresh the attendance status to show the active session
5. WHEN the attendance type is determined by the backend THEN the System SHALL display the correct type badge (Office or WFH)

### Requirement 2

**User Story:** As an employee, I want to see real-time feedback during attendance operations, so that I know my actions are being processed.

#### Acceptance Criteria

1. WHEN an employee initiates a punch-in or punch-out action THEN the System SHALL display a loading indicator on the button
2. WHEN an attendance operation is in progress THEN the System SHALL disable all attendance action buttons
3. WHEN an attendance operation completes successfully THEN the System SHALL remove the loading indicator and update the display
4. WHEN an attendance operation fails THEN the System SHALL display an error message with details
5. WHEN an error is displayed THEN the System SHALL allow the employee to retry the operation

### Requirement 3

**User Story:** As an employee, I want to view my attendance history with clear formatting, so that I can easily track my work patterns.

#### Acceptance Criteria

1. WHEN an employee views their attendance history THEN the System SHALL display records in a table format ordered by date descending
2. WHEN displaying an attendance record THEN the System SHALL show date, type badge, check-in time, check-out time, and duration
3. WHEN an attendance record has no check-out time THEN the System SHALL display a dash or placeholder
4. WHEN an attendance record has no type THEN the System SHALL display a dash or placeholder
5. WHEN the attendance history is empty THEN the System SHALL display a message indicating no records exist

### Requirement 4

**User Story:** As an employee, I want to apply for leave with proper validation, so that I submit valid requests and avoid errors.

#### Acceptance Criteria

1. WHEN an employee submits a leave application THEN the System SHALL validate that start date is not empty
2. WHEN an employee submits a leave application THEN the System SHALL validate that end date is not empty
3. WHEN an employee submits a leave application THEN the System SHALL validate that end date is not before start date
4. WHEN validation fails THEN the System SHALL display specific error messages for each validation failure
5. WHEN a leave application is submitted successfully THEN the System SHALL clear the form and refresh the leave history

### Requirement 5

**User Story:** As an employee, I want to see my leave balance prominently displayed, so that I can make informed decisions about leave applications.

#### Acceptance Criteria

1. WHEN an employee views the leave management page THEN the System SHALL display their current leave balance
2. WHEN displaying leave balance THEN the System SHALL show total allowance, used days, and remaining days
3. WHEN leave balance is loaded THEN the System SHALL include the year for which the balance applies
4. WHEN leave balance fails to load THEN the System SHALL handle the error gracefully without blocking other functionality
5. WHEN a leave application is approved THEN the System SHALL refresh the leave balance to reflect the change

### Requirement 6

**User Story:** As an employee, I want to filter my leave history by status, so that I can quickly find pending, approved, or rejected requests.

#### Acceptance Criteria

1. WHEN an employee views their leave history THEN the System SHALL provide filter buttons for "All", "Pending", "Approved", and "Rejected"
2. WHEN an employee clicks a filter button THEN the System SHALL highlight the active filter
3. WHEN a filter is applied THEN the System SHALL fetch and display only leaves matching that status
4. WHEN switching between filters THEN the System SHALL show a loading indicator during the fetch
5. WHEN no leaves match the filter THEN the System SHALL display a message indicating no results

### Requirement 7

**User Story:** As an administrator, I want to review pending leave requests with complete employee information, so that I can make informed approval decisions.

#### Acceptance Criteria

1. WHEN an administrator views pending leaves THEN the System SHALL display employee name, email, department, leave type, dates, duration, and reason
2. WHEN displaying pending leaves THEN the System SHALL order them by submission date ascending (oldest first)
3. WHEN an administrator filters by department THEN the System SHALL show only leaves from employees in that department
4. WHEN an administrator filters by date range THEN the System SHALL show only leaves overlapping that range
5. WHEN no pending leaves exist THEN the System SHALL display a message indicating no pending requests

### Requirement 8

**User Story:** As an administrator, I want to approve or reject leave requests with confirmation, so that I avoid accidental actions.

#### Acceptance Criteria

1. WHEN an administrator clicks "Approve" on a leave request THEN the System SHALL display a confirmation dialog
2. WHEN an administrator clicks "Reject" on a leave request THEN the System SHALL display a confirmation dialog
3. WHEN an administrator confirms approval THEN the System SHALL call the approve API and refresh the list
4. WHEN an administrator confirms rejection THEN the System SHALL call the reject API and refresh the list
5. WHEN an approval or rejection operation completes THEN the System SHALL display a success message

### Requirement 9

**User Story:** As an administrator, I want to filter pending leaves by department and date range, so that I can efficiently manage leave requests for specific teams or time periods.

#### Acceptance Criteria

1. WHEN an administrator enters a department filter THEN the System SHALL apply the filter and fetch matching leaves
2. WHEN an administrator selects a start date filter THEN the System SHALL apply the filter and fetch matching leaves
3. WHEN an administrator selects an end date filter THEN the System SHALL apply the filter and fetch matching leaves
4. WHEN an administrator clicks "Clear Filters" THEN the System SHALL reset all filters and fetch all pending leaves
5. WHEN filters are applied THEN the System SHALL show a loading indicator during the fetch

### Requirement 10

**User Story:** As a user, I want consistent error handling across all attendance and leave operations, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN any API call fails THEN the System SHALL extract and display the error message from the response
2. WHEN an error message is displayed THEN the System SHALL use consistent styling across all components
3. WHEN an error occurs THEN the System SHALL log the error to the console for debugging
4. WHEN an error is displayed THEN the System SHALL automatically dismiss it after 5 seconds or allow manual dismissal
5. WHEN a network error occurs THEN the System SHALL display a user-friendly message indicating connectivity issues
