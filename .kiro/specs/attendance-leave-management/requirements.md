# Requirements Document

## Introduction

This document specifies the requirements for an Attendance and Leave Management System that enables employees to track their attendance (office/work-from-home), apply for leaves, and allows administrators to manage and approve leave requests. The system enforces attendance rules, prevents fraudulent punch-ins, and automates leave approval workflows with email notifications.

## Glossary

- **System**: The Attendance and Leave Management System
- **Employee**: An authenticated user who can record attendance and apply for leaves
- **Administrator**: An authenticated HR/admin user who can approve or reject leave requests
- **Attendance Record**: A timestamped entry recording an employee's punch-in and punch-out times
- **Office Punch**: Attendance recorded from an office IP address range
- **WFH Punch**: Attendance recorded from a non-office IP address (Work From Home)
- **Leave Application**: A formal request by an employee for time off
- **Leave Status**: The current state of a leave application (pending, approved, rejected)
- **Punch Session**: The period between a punch-in and punch-out event

## Requirements

### Requirement 1

**User Story:** As an employee, I want to punch in for the day, so that my attendance is recorded and I can track my work hours.

#### Acceptance Criteria

1. WHEN an employee punches in from an office IP address THEN the System SHALL create an Attendance Record with type "Office" and the current timestamp
2. WHEN an employee punches in from a non-office IP address THEN the System SHALL create an Attendance Record with type "WFH" and the current timestamp
3. WHEN an employee attempts to punch in while an active Punch Session exists THEN the System SHALL reject the request and maintain the current Attendance Record
4. WHEN an employee punches in THEN the System SHALL validate the employee authentication token before creating the Attendance Record
5. WHEN an Attendance Record is created THEN the System SHALL persist it to the database immediately

### Requirement 2

**User Story:** As an employee, I want to punch out at the end of my work day, so that my total work hours are accurately recorded.

#### Acceptance Criteria

1. WHEN an employee punches out with an active Punch Session THEN the System SHALL update the Attendance Record with the punch-out timestamp
2. WHEN an employee attempts to punch out without an active Punch Session THEN the System SHALL reject the request and return an error
3. WHEN a punch-out timestamp is recorded THEN the System SHALL calculate and store the total work duration for that Attendance Record
4. WHEN an employee punches out THEN the System SHALL validate the employee authentication token before updating the Attendance Record

### Requirement 3

**User Story:** As an employee, I want to view my attendance history, so that I can track my work patterns and verify my records.

#### Acceptance Criteria

1. WHEN an employee requests their attendance history THEN the System SHALL return all Attendance Records for that employee ordered by date descending
2. WHEN displaying an Attendance Record THEN the System SHALL include punch-in time, punch-out time, attendance type, and total duration
3. WHEN an employee requests attendance for a specific date range THEN the System SHALL filter Attendance Records within that range
4. WHEN an employee views today's attendance THEN the System SHALL display the current Punch Session status if active

### Requirement 4

**User Story:** As an employee, I want to apply for leave, so that I can request time off for personal or medical reasons.

#### Acceptance Criteria

1. WHEN an employee submits a Leave Application THEN the System SHALL validate that the start date is not in the past
2. WHEN an employee submits a Leave Application THEN the System SHALL validate that the end date is not before the start date
3. WHEN an employee submits a Leave Application THEN the System SHALL check for overlapping Leave Applications and reject if overlap exists
4. WHEN a Leave Application is created THEN the System SHALL set the Leave Status to "pending" and persist it to the database
5. WHEN a Leave Application is created THEN the System SHALL include employee details, date range, leave type, and reason

### Requirement 5

**User Story:** As an employee, I want to view my leave history and status, so that I can track my leave balance and application outcomes.

#### Acceptance Criteria

1. WHEN an employee requests their leave history THEN the System SHALL return all Leave Applications for that employee ordered by submission date descending
2. WHEN displaying a Leave Application THEN the System SHALL include start date, end date, leave type, reason, Leave Status, and approval details
3. WHEN an employee views pending leaves THEN the System SHALL filter Leave Applications with Leave Status "pending"
4. WHEN an employee views their leave balance THEN the System SHALL calculate remaining leave days based on approved leaves

### Requirement 6

**User Story:** As an administrator, I want to review and approve leave requests, so that I can manage team availability and ensure proper coverage.

#### Acceptance Criteria

1. WHEN an Administrator approves a Leave Application THEN the System SHALL update the Leave Status to "approved" and record the administrator's user ID
2. WHEN an Administrator rejects a Leave Application THEN the System SHALL update the Leave Status to "rejected" and record the administrator's user ID
3. WHEN a Leave Application status changes to "approved" THEN the System SHALL send an email notification to the employee
4. WHEN a Leave Application status changes to "rejected" THEN the System SHALL send an email notification to the employee
5. WHEN an Administrator updates a Leave Application THEN the System SHALL validate the administrator has appropriate permissions

### Requirement 7

**User Story:** As an administrator, I want to view all pending leave requests, so that I can efficiently process approval workflows.

#### Acceptance Criteria

1. WHEN an Administrator requests pending leaves THEN the System SHALL return all Leave Applications with Leave Status "pending" ordered by submission date
2. WHEN displaying pending Leave Applications THEN the System SHALL include employee name, department, date range, leave type, and reason
3. WHEN an Administrator filters by department THEN the System SHALL return only Leave Applications from employees in that department
4. WHEN an Administrator filters by date range THEN the System SHALL return only Leave Applications overlapping that date range

### Requirement 8

**User Story:** As the system, I want to enforce leave policies, so that leave allocations are respected and business rules are maintained.

#### Acceptance Criteria

1. WHEN validating a Leave Application THEN the System SHALL verify the employee has sufficient leave balance for the requested duration
2. WHEN calculating leave balance THEN the System SHALL subtract approved leave days from the employee's annual allocation
3. WHEN a Leave Application would exceed available balance THEN the System SHALL reject the application and return an error
4. WHEN multiple Leave Applications exist for overlapping dates THEN the System SHALL prevent approval of conflicting requests

### Requirement 9

**User Story:** As a developer, I want comprehensive API endpoints for attendance and leave operations, so that the frontend can provide a seamless user experience.

#### Acceptance Criteria

1. WHEN the attendance API receives a punch-in request THEN the System SHALL validate authentication, check for active sessions, and return the created Attendance Record
2. WHEN the attendance API receives a punch-out request THEN the System SHALL validate authentication, verify active session, and return the updated Attendance Record
3. WHEN the leave API receives a create request THEN the System SHALL validate all business rules and return the created Leave Application or validation errors
4. WHEN the leave API receives an approval request THEN the System SHALL validate administrator permissions and return the updated Leave Application
5. WHEN any API endpoint encounters an error THEN the System SHALL return a structured error response with appropriate HTTP status code
