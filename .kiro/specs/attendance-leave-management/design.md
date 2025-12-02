# Design Document: Attendance and Leave Management System

## Overview

The Attendance and Leave Management System provides comprehensive tracking of employee work hours and leave requests. The system distinguishes between office-based and work-from-home attendance using IP address validation, enforces business rules for leave applications, and automates approval workflows with email notifications.

The system integrates with the existing Employee authentication system and leverages the current database schema (Attendance and LeaveRequest models). It extends the existing services with IP-based validation, overlap detection, leave balance calculations, and email notification capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Frontend UI   │
│  (React/Vite)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────────────────────────┐
│      Express API Layer              │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ Attendance   │  │   Leave     │ │
│  │ Controller   │  │ Controller  │ │
│  └──────┬───────┘  └──────┬──────┘ │
└─────────┼──────────────────┼────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────┐
│       Service Layer                 │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ Attendance   │  │   Leave     │ │
│  │  Service     │  │  Service    │ │
│  └──────┬───────┘  └──────┬──────┘ │
│         │                  │        │
│         │  ┌───────────────┤        │
│         │  │               │        │
│         ▼  ▼               ▼        │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ IP Validator │  │ Mail Service│ │
│  └──────────────┘  └─────────────┘ │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│      Prisma ORM / Database          │
│  (Attendance, LeaveRequest models)  │
└─────────────────────────────────────┘
```

### Component Interaction Flow

**Attendance Flow:**
1. Employee sends punch-in request with auth token
2. Controller validates authentication and extracts employee ID
3. Service validates no active session exists
4. IP Validator determines office vs WFH based on request IP
5. Service creates Attendance record with appropriate type
6. Audit log records the action
7. Response returned to frontend

**Leave Approval Flow:**
1. Administrator approves/rejects leave request
2. Controller validates admin permissions
3. Service updates leave status and records approver ID
4. Mail Service sends notification email to employee
5. Audit log records the action
6. Response returned to frontend

## Components and Interfaces

### 1. IP Validation Service

**Purpose:** Determine if a request originates from office network or external location

**Interface:**
```typescript
interface IPValidationService {
  isOfficeIP(ipAddress: string): boolean;
  getAttendanceType(ipAddress: string): 'Office' | 'WFH';
}
```

**Configuration:**
- Office IP ranges stored in environment variables
- Support for CIDR notation (e.g., "192.168.1.0/24")
- Support for multiple IP ranges

### 2. Attendance Service (Enhanced)

**Purpose:** Manage attendance records with IP-based validation

**Interface:**
```typescript
interface AttendanceService {
  punchIn(employeeId: number, ipAddress: string): Promise<Attendance>;
  punchOut(employeeId: number): Promise<Attendance>;
  getAttendanceHistory(employeeId: number, filters?: DateRangeFilter): Promise<Attendance[]>;
  getTodayStatus(employeeId: number): Promise<AttendanceStatus>;
}

interface AttendanceStatus {
  hasActiveSession: boolean;
  attendance: Attendance | null;
}
```

**Key Methods:**
- `punchIn`: Validates no active session, determines type via IP, creates record
- `punchOut`: Validates active session exists, calculates duration, updates record
- `getAttendanceHistory`: Returns filtered attendance records
- `getTodayStatus`: Returns current day's attendance status

### 3. Leave Service (Enhanced)

**Purpose:** Manage leave applications with validation and approval workflow

**Interface:**
```typescript
interface LeaveService {
  applyLeave(params: LeaveApplicationParams): Promise<LeaveRequest>;
  getLeaveHistory(employeeId: number, filters?: LeaveFilter): Promise<LeaveRequest[]>;
  getPendingLeaves(filters?: AdminLeaveFilter): Promise<LeaveRequest[]>;
  approveLeave(leaveId: number, approverId: number): Promise<LeaveRequest>;
  rejectLeave(leaveId: number, approverId: number): Promise<LeaveRequest>;
  getLeaveBalance(employeeId: number, year?: number): Promise<LeaveBalance>;
  validateLeaveApplication(params: LeaveApplicationParams): Promise<ValidationResult>;
}

interface LeaveApplicationParams {
  employeeId: number;
  type: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

interface LeaveBalance {
  year: number;
  allowance: number;
  usedDays: number;
  remaining: number;
}
```

**Key Methods:**
- `applyLeave`: Validates dates, checks overlaps, verifies balance, creates request
- `approveLeave`: Updates status, triggers email notification
- `rejectLeave`: Updates status, triggers email notification
- `validateLeaveApplication`: Checks all business rules before creation

### 4. Leave Notification Service

**Purpose:** Send email notifications for leave status changes

**Interface:**
```typescript
interface LeaveNotificationService {
  sendApprovalNotification(leave: LeaveRequest, employee: Employee): Promise<void>;
  sendRejectionNotification(leave: LeaveRequest, employee: Employee): Promise<void>;
}
```

**Email Templates:**
- Leave Approved: Includes leave details, dates, approver name
- Leave Rejected: Includes leave details, dates, rejection reason (if provided)

## Data Models

### Attendance Model (Existing - Enhanced)

```prisma
model Attendance {
  id         Int       @id @default(autoincrement())
  employeeId Int
  date       DateTime
  checkIn    DateTime?
  checkOut   DateTime?
  duration   Int?      // Duration in minutes
  type       String?   // NEW: 'Office' or 'WFH'
  ipAddress  String?   // NEW: IP address of punch-in
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  employee   Employee  @relation(fields: [employeeId], references: [id])

  @@unique([employeeId, date])
  @@index([employeeId])
  @@index([date])
}
```

**Schema Changes Required:**
- Add `type` field (String, nullable) to store 'Office' or 'WFH'
- Add `ipAddress` field (String, nullable) to store request IP

### LeaveRequest Model (Existing - No Changes)

```prisma
model LeaveRequest {
  id         Int         @id @default(autoincrement())
  employeeId Int
  type       String
  startDate  DateTime
  endDate    DateTime
  status     LeaveStatus @default(pending)
  approverId Int?
  reason     String?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  employee Employee  @relation("EmployeeLeaveRequests", fields: [employeeId], references: [id])
  approver Employee? @relation("EmployeeApprovals", fields: [approverId], references: [id])

  @@index([employeeId])
  @@index([approverId])
}
```

**No schema changes needed** - existing model supports all requirements

## C
orrectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After reviewing all acceptance criteria, several properties are logically redundant or can be combined. The reflection below identifies the core unique properties:

**Property Reflection:**
- Properties 1.4 and 2.4 (authentication validation) are redundant - can be combined into one authentication property
- Properties 1.5 and 4.4 (persistence) are redundant - database persistence is a system-wide concern, not feature-specific
- Properties 3.2 and 5.2 (data structure completeness) are redundant - can be combined into one data completeness property
- Properties 8.2 and 5.4 (balance calculation) are redundant - same calculation logic
- Properties 9.1-9.5 (API behavior) are integration tests, not unit properties - they test the complete flow rather than specific logic

**Core Unique Properties:**

Property 1: Office IP punch-in creates Office attendance
*For any* employee and office IP address, when punching in from that IP, the created Attendance Record should have type "Office"
**Validates: Requirements 1.1**

Property 2: Non-office IP punch-in creates WFH attendance
*For any* employee and non-office IP address, when punching in from that IP, the created Attendance Record should have type "WFH"
**Validates: Requirements 1.2**

Property 3: Duplicate punch-in prevention
*For any* employee with an active Punch Session, attempting to punch in again should be rejected and the existing Attendance Record should remain unchanged
**Validates: Requirements 1.3**

Property 4: Punch-out updates attendance with timestamp
*For any* employee with an active Punch Session, punching out should update the Attendance Record with a punch-out timestamp
**Validates: Requirements 2.1**

Property 5: Punch-out without session is rejected
*For any* employee without an active Punch Session, attempting to punch out should be rejected with an error
**Validates: Requirements 2.2**

Property 6: Duration calculation correctness
*For any* Attendance Record with both punch-in and punch-out timestamps, the stored duration should equal the time difference in minutes
**Validates: Requirements 2.3**

Property 7: Attendance history ordering
*For any* employee with multiple Attendance Records, requesting history should return records ordered by date descending
**Validates: Requirements 3.1**

Property 8: Date range filtering correctness
*For any* employee and date range, requesting attendance should return only Attendance Records where the date falls within that range
**Validates: Requirements 3.3**

Property 9: Active session status accuracy
*For any* employee, viewing today's attendance should correctly indicate whether an active Punch Session exists
**Validates: Requirements 3.4**

Property 10: Past date rejection
*For any* Leave Application with a start date in the past, the System should reject the application
**Validates: Requirements 4.1**

Property 11: End date validation
*For any* Leave Application where end date is before start date, the System should reject the application
**Validates: Requirements 4.2**

Property 12: Overlap detection
*For any* employee with an existing Leave Application, submitting a new Leave Application with overlapping dates should be rejected
**Validates: Requirements 4.3**

Property 13: Initial leave status
*For any* newly created Leave Application, the Leave Status should be "pending"
**Validates: Requirements 4.4**

Property 14: Leave history ordering
*For any* employee with multiple Leave Applications, requesting history should return records ordered by submission date descending
**Validates: Requirements 5.1**

Property 15: Pending leave filtering
*For any* employee, viewing pending leaves should return only Leave Applications with Leave Status "pending"
**Validates: Requirements 5.3**

Property 16: Leave balance calculation
*For any* employee and year, the leave balance should equal annual allocation minus the sum of approved leave days in that year
**Validates: Requirements 5.4, 8.2**

Property 17: Approval updates status and records approver
*For any* Leave Application, when approved by an Administrator, the Leave Status should be "approved" and the approverId should be set
**Validates: Requirements 6.1**

Property 18: Rejection updates status and records approver
*For any* Leave Application, when rejected by an Administrator, the Leave Status should be "rejected" and the approverId should be set
**Validates: Requirements 6.2**

Property 19: Approval triggers email notification
*For any* Leave Application that is approved, an email notification should be sent to the employee
**Validates: Requirements 6.3**

Property 20: Rejection triggers email notification
*For any* Leave Application that is rejected, an email notification should be sent to the employee
**Validates: Requirements 6.4**

Property 21: Admin pending leaves ordering
*For any* Administrator requesting pending leaves, the System should return all Leave Applications with status "pending" ordered by submission date
**Validates: Requirements 7.1**

Property 22: Department filtering correctness
*For any* Administrator filtering by department, the System should return only Leave Applications from employees in that department
**Validates: Requirements 7.3**

Property 23: Admin date range filtering
*For any* Administrator filtering by date range, the System should return only Leave Applications that overlap with that date range
**Validates: Requirements 7.4**

Property 24: Insufficient balance rejection
*For any* Leave Application where the requested duration exceeds the employee's available leave balance, the System should reject the application
**Validates: Requirements 8.1, 8.3**

Property 25: Conflicting approval prevention
*For any* two Leave Applications with overlapping dates for the same employee, approving one should prevent approval of the other
**Validates: Requirements 8.4**


## Error Handling

### Error Categories

**1. Authentication Errors (401)**
- Invalid or missing authentication token
- Expired token
- Token for wrong user type (admin vs employee)

**2. Authorization Errors (403)**
- Non-admin attempting to approve/reject leaves
- Employee attempting to access another employee's data

**3. Validation Errors (400)**
- Invalid date formats
- End date before start date
- Start date in the past
- Missing required fields
- Invalid leave type

**4. Business Rule Violations (409)**
- Duplicate punch-in attempt
- Punch-out without active session
- Overlapping leave applications
- Insufficient leave balance
- Conflicting leave approvals

**5. Not Found Errors (404)**
- Leave application not found
- Employee not found
- Attendance record not found

**6. Server Errors (500)**
- Database connection failures
- Email service failures
- Unexpected exceptions

### Error Response Format

All errors follow the existing ApiError structure:

```typescript
{
  success: false,
  statusCode: number,
  code: string,
  message: string,
  errors?: Array<{ field: string, message: string }>,
  data?: unknown
}
```

### Error Handling Strategy

1. **Input Validation**: Use Zod schemas at controller level to catch malformed requests early
2. **Business Logic Validation**: Service layer throws descriptive errors for business rule violations
3. **Database Errors**: Catch and transform Prisma errors into user-friendly messages
4. **External Service Failures**: Log email failures but don't block the main operation
5. **Audit Logging**: Record all errors in audit logs for debugging and compliance


## Testing Strategy

### Dual Testing Approach

The system will employ both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide complete coverage: unit tests catch concrete bugs, property tests verify general correctness

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must include a comment tag: `**Feature: attendance-leave-management, Property {number}: {property_text}**`
- Each correctness property from the design document must be implemented by a SINGLE property-based test

**Property Test Examples**:

```typescript
// **Feature: attendance-leave-management, Property 1: Office IP punch-in creates Office attendance**
test('office IP punch-in creates Office attendance', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 10000 }), // employeeId
      fc.ipV4(), // office IP
      async (employeeId, ipAddress) => {
        // Assume ipAddress is in office range
        const attendance = await punchIn(employeeId, ipAddress);
        expect(attendance.type).toBe('Office');
      }
    ),
    { numRuns: 100 }
  );
});
```

**Key Property Test Areas**:
1. IP-based attendance type determination (Properties 1-2)
2. Session state management (Properties 3, 5, 9)
3. Duration calculations (Property 6)
4. Date validation and filtering (Properties 8, 10, 11, 23)
5. Leave overlap detection (Properties 12, 25)
6. Leave balance calculations (Properties 16, 24)
7. Status updates and ordering (Properties 13-15, 17-18, 21)
8. Email notifications (Properties 19-20)

### Unit Testing

**Framework**: Jest (existing test framework in the project)

**Unit Test Coverage**:

1. **IP Validation Service**
   - Test specific office IP ranges
   - Test CIDR notation parsing
   - Test edge cases (localhost, private ranges)

2. **Attendance Service**
   - Test punch-in with specific timestamps
   - Test punch-out duration calculation with known values
   - Test error messages for specific scenarios

3. **Leave Service**
   - Test specific date overlap scenarios
   - Test leave balance with known approved leaves
   - Test email notification triggers

4. **Controllers**
   - Test request validation with specific invalid inputs
   - Test authentication middleware integration
   - Test response formatting

5. **Integration Tests**
   - Test complete API flows (punch-in → punch-out)
   - Test leave application → approval → email flow
   - Test database transaction rollbacks on errors

### Test Organization

```
server/src/modules/
├── attendance/
│   ├── attendance.service.ts
│   ├── attendance.service.test.ts        # Unit tests
│   ├── attendance.service.property.test.ts  # Property tests
│   ├── attendance.controller.test.ts     # Controller tests
├── leave/
│   ├── leave.service.ts
│   ├── leave.service.test.ts            # Unit tests
│   ├── leave.service.property.test.ts   # Property tests
│   ├── leave.controller.test.ts         # Controller tests
└── ip-validation/
    ├── ip-validation.service.ts
    ├── ip-validation.service.test.ts    # Unit tests
```

### Testing Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Database Cleanup**: Use transactions or cleanup hooks to reset database state
3. **Mock External Services**: Mock email service in tests to avoid sending real emails
4. **Test Data Generators**: Create helper functions to generate valid test data
5. **Edge Case Coverage**: Explicitly test boundary conditions (midnight, year boundaries, etc.)
6. **Error Path Testing**: Verify error messages and status codes for all failure scenarios


## API Endpoints

### Attendance Endpoints

**POST /api/attendance/punch-in**
- **Auth**: Employee token required
- **Body**: `{ ipAddress?: string }` (IP extracted from request if not provided)
- **Response**: `{ attendance: Attendance }`
- **Errors**: 401 (unauthorized), 409 (already punched in)

**POST /api/attendance/punch-out**
- **Auth**: Employee token required
- **Body**: `{}`
- **Response**: `{ attendance: Attendance }`
- **Errors**: 401 (unauthorized), 409 (no active session)

**GET /api/attendance/history**
- **Auth**: Employee token required
- **Query**: `{ startDate?: string, endDate?: string }`
- **Response**: `{ attendances: Attendance[] }`
- **Errors**: 401 (unauthorized)

**GET /api/attendance/today**
- **Auth**: Employee token required
- **Response**: `{ attendance: Attendance | null, hasActiveSession: boolean }`
- **Errors**: 401 (unauthorized)

### Leave Endpoints

**POST /api/leaves**
- **Auth**: Employee token required
- **Body**: `{ type: string, startDate: string, endDate: string, reason?: string }`
- **Response**: `{ leave: LeaveRequest }`
- **Errors**: 401 (unauthorized), 400 (validation), 409 (overlap/insufficient balance)

**GET /api/leaves/my-leaves**
- **Auth**: Employee token required
- **Query**: `{ status?: 'pending' | 'approved' | 'rejected' }`
- **Response**: `{ leaves: LeaveRequest[] }`
- **Errors**: 401 (unauthorized)

**GET /api/leaves/balance**
- **Auth**: Employee token required
- **Query**: `{ year?: number }`
- **Response**: `{ balance: LeaveBalance }`
- **Errors**: 401 (unauthorized)

**GET /api/leaves/pending** (Admin only)
- **Auth**: Admin token required
- **Query**: `{ departmentId?: number, startDate?: string, endDate?: string }`
- **Response**: `{ leaves: LeaveRequest[] }`
- **Errors**: 401 (unauthorized), 403 (forbidden)

**PATCH /api/leaves/:id/approve** (Admin only)
- **Auth**: Admin token required
- **Response**: `{ leave: LeaveRequest }`
- **Errors**: 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict)

**PATCH /api/leaves/:id/reject** (Admin only)
- **Auth**: Admin token required
- **Body**: `{ reason?: string }`
- **Response**: `{ leave: LeaveRequest }`
- **Errors**: 401 (unauthorized), 403 (forbidden), 404 (not found)

## Frontend Components

### Employee Dashboard Components

**1. AttendanceDashboard**
- Displays today's attendance status
- Shows punch-in/punch-out times
- Provides "Punch In - Office" and "Punch In - WFH" buttons
- Shows active session indicator
- Displays attendance history table

**2. LeaveManagement**
- Leave application form with date pickers
- Leave history table with status indicators
- Leave balance display
- Filter by status (pending/approved/rejected)

### Admin Dashboard Components

**3. PendingLeavesTable**
- Lists all pending leave requests
- Shows employee details, department, dates
- Provides approve/reject actions
- Filters by department and date range

**4. AttendanceReports**
- Daily attendance summary
- Department-wise attendance statistics
- Export functionality

### Shared UI Components

- DateRangePicker: For filtering attendance/leaves
- StatusBadge: Visual indicators for leave status
- LoadingSpinner: For async operations
- ErrorAlert: For displaying error messages
- ConfirmDialog: For approve/reject confirmations

## Security Considerations

1. **IP Spoofing Prevention**: Use `req.ip` or `X-Forwarded-For` header with validation
2. **Rate Limiting**: Apply rate limits to prevent abuse of punch-in/out endpoints
3. **Token Validation**: Verify employee/admin tokens on all protected routes
4. **Data Access Control**: Employees can only access their own data; admins can access all
5. **Audit Logging**: Log all attendance and leave operations for compliance
6. **Input Sanitization**: Validate and sanitize all user inputs to prevent injection attacks
7. **HTTPS Only**: Enforce HTTPS in production to protect tokens and sensitive data

## Performance Considerations

1. **Database Indexing**: Existing indexes on employeeId and date support efficient queries
2. **Pagination**: Implement pagination for attendance history and leave lists
3. **Caching**: Cache leave balance calculations for frequently accessed data
4. **Batch Operations**: Support bulk approval/rejection for admin efficiency
5. **Query Optimization**: Use Prisma's `select` to fetch only required fields
6. **Email Queue**: Use background jobs for email notifications to avoid blocking requests

## Deployment Considerations

1. **Environment Variables**: Configure office IP ranges via environment variables
2. **Database Migration**: Add `type` and `ipAddress` fields to Attendance table
3. **Email Templates**: Deploy leave approval/rejection email templates
4. **Monitoring**: Set up alerts for failed email notifications
5. **Backup Strategy**: Ensure attendance and leave data is included in backups
6. **Rollback Plan**: Maintain ability to rollback database migrations if needed

