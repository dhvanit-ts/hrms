# Design Document: Attendance and Leave Frontend Polish

## Overview

This design document outlines the refinements needed to complete PHASE 3 of the HRM system's Attendance and Leave Management frontend. The focus is on improving user experience, ensuring proper error handling, and polishing the UI components to match the requirements. The existing components (AttendanceDashboard, LeaveManagement, PendingLeavesTable) are already functional but need minor adjustments for consistency and completeness.

## Architecture

### Component Structure

```
┌─────────────────────────────────────────┐
│         React Application               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Employee Dashboard              │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │  AttendanceDashboard        │ │ │
│  │  │  - Today's Status           │ │ │
│  │  │  - Punch In/Out Buttons     │ │ │
│  │  │  - Attendance History       │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │  LeaveManagement            │ │ │
│  │  │  - Leave Balance            │ │ │
│  │  │  - Application Form         │ │ │
│  │  │  - Leave History            │ │ │
│  │  └─────────────────────────────┘ │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Admin Dashboard                 │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │  PendingLeavesTable         │ │ │
│  │  │  - Filters                  │ │ │
│  │  │  - Leave List               │ │ │
│  │  │  - Approve/Reject Actions   │ │ │
│  │  └─────────────────────────────┘ │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   API Service Layer               │ │
│  │  - attendance.ts                  │ │
│  │  - leaves.ts                      │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. AttendanceDashboard Component

**Current State**: Functional but both punch-in buttons call the same handler

**Refinements Needed**:
- Both buttons already call the same API endpoint (which is correct - the backend determines type via IP)
- The UI correctly shows two distinct buttons
- No changes needed - the current implementation is correct

**Component Interface**:
```typescript
interface AttendanceDashboardProps {
  // No props - uses EmployeeAuthContext
}

interface AttendanceDashboardState {
  todayStatus: AttendanceStatus | null;
  history: Attendance[];
  loading: boolean;
  error: string | null;
  actionLoading: 'punch-in' | 'punch-out' | null;
}
```

### 2. LeaveManagement Component

**Current State**: Fully functional with form validation, filtering, and balance display

**Refinements Needed**:
- Add client-side validation for date comparison (end date >= start date)
- Improve error message display consistency
- Add auto-dismiss for success messages

**Component Interface**:
```typescript
interface LeaveManagementProps {
  // No props - uses EmployeeAuthContext
}

interface LeaveManagementState {
  leaves: LeaveRequest[];
  balance: LeaveBalance | null;
  loading: boolean;
  error: string | null;
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected';
  formData: ApplyLeaveParams;
  submitting: boolean;
  formError: string | null;
}
```

### 3. PendingLeavesTable Component

**Current State**: Functional with filters and approve/reject actions

**Refinements Needed**:
- Remove unused `Clock` import
- Ensure confirmation dialogs are working (already implemented in parent)
- Add success/error message handling within the component

**Component Interface**:
```typescript
interface PendingLeavesTableProps {
  leaves: PendingLeave[];
  isLoading: boolean;
  onApprove: (leaveId: number) => Promise<void>;
  onReject: (leaveId: number) => Promise<void>;
  onFilterChange: (filters: FilterParams) => void;
}
```

### 4. Leaves Page Component

**Current State**: Integrates both employee and admin views

**Refinements Needed**:
- Success/error messages already implemented
- Confirmation dialogs already implemented
- Auto-dismiss for messages already implemented
- No changes needed

## Data Models

### Frontend Types (Already Defined)

```typescript
// Attendance Types
interface Attendance {
  id: number;
  employeeId: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  duration: number | null;
  type: string | null; // 'Office' | 'WFH'
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceStatus {
  hasActiveSession: boolean;
  attendance: Attendance | null;
}

// Leave Types
interface LeaveRequest {
  id: number;
  employeeId: number;
  type: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId: number | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeaveBalance {
  year: number;
  allowance: number;
  usedDays: number;
  remaining: number;
}

interface ApplyLeaveParams {
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

// Admin Types
interface PendingLeave extends LeaveRequest {
  employee: {
    name: string;
    department: string;
    email: string;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN an employee views the attendance dashboard without an active session THEN the System SHALL display two distinct buttons labeled "Punch In - Office" and "Punch In - WFH"
  Thoughts: This is testing that the UI renders correctly in a specific state. We can test this by rendering the component with no active session and checking that both buttons exist
  Testable: yes - example

1.2 WHEN an employee clicks "Punch In - Office" THEN the System SHALL call the punch-in API and the backend SHALL determine the type based on IP address
  Thoughts: This is testing UI interaction and API integration. We can test that clicking the button calls the API
  Testable: yes - example

1.3 WHEN an employee clicks "Punch In - WFH" THEN the System SHALL call the punch-in API and the backend SHALL determine the type based on IP address
  Thoughts: Same as 1.2, this is testing UI interaction
  Testable: yes - example

1.4 WHEN the punch-in request completes THEN the System SHALL refresh the attendance status to show the active session
  Thoughts: This is testing that after a successful API call, the UI updates. We can test this by mocking the API and verifying state changes
  Testable: yes - example

1.5 WHEN the attendance type is determined by the backend THEN the System SHALL display the correct type badge (Office or WFH)
  Thoughts: This is testing that the UI correctly displays data from the backend. We can test this by providing mock data with different types
  Testable: yes - example

2.1 WHEN an employee initiates a punch-in or punch-out action THEN the System SHALL display a loading indicator on the button
  Thoughts: This is testing UI state during async operations. We can test this by checking button state during API calls
  Testable: yes - example

2.2 WHEN an attendance operation is in progress THEN the System SHALL disable all attendance action buttons
  Thoughts: This is testing that buttons are disabled during operations. We can verify the disabled attribute
  Testable: yes - example

2.3 WHEN an attendance operation completes successfully THEN the System SHALL remove the loading indicator and update the display
  Thoughts: This is testing UI state after successful operations
  Testable: yes - example

2.4 WHEN an attendance operation fails THEN the System SHALL display an error message with details
  Thoughts: This is testing error handling in the UI
  Testable: yes - example

2.5 WHEN an error is displayed THEN the System SHALL allow the employee to retry the operation
  Thoughts: This is testing that after an error, buttons remain functional
  Testable: yes - example

3.1 WHEN an employee views their attendance history THEN the System SHALL display records in a table format ordered by date descending
  Thoughts: This is testing data display and ordering. We can provide mock data and verify rendering
  Testable: yes - example

3.2 WHEN displaying an attendance record THEN the System SHALL show date, type badge, check-in time, check-out time, and duration
  Thoughts: This is testing that all required fields are displayed
  Testable: yes - example

3.3 WHEN an attendance record has no check-out time THEN the System SHALL display a dash or placeholder
  Thoughts: This is testing null value handling
  Testable: yes - example

3.4 WHEN an attendance record has no type THEN the System SHALL display a dash or placeholder
  Thoughts: This is testing null value handling
  Testable: yes - example

3.5 WHEN the attendance history is empty THEN the System SHALL display a message indicating no records exist
  Thoughts: This is testing empty state handling
  Testable: yes - example

4.1 WHEN an employee submits a leave application THEN the System SHALL validate that start date is not empty
  Thoughts: This is testing form validation. HTML5 required attribute handles this, but we can test it
  Testable: yes - example

4.2 WHEN an employee submits a leave application THEN the System SHALL validate that end date is not empty
  Thoughts: Same as 4.1
  Testable: yes - example

4.3 WHEN an employee submits a leave application THEN the System SHALL validate that end date is not before start date
  Thoughts: This is testing date comparison validation
  Testable: yes - example

4.4 WHEN validation fails THEN the System SHALL display specific error messages for each validation failure
  Thoughts: This is testing error message display
  Testable: yes - example

4.5 WHEN a leave application is submitted successfully THEN the System SHALL clear the form and refresh the leave history
  Thoughts: This is testing post-submission behavior
  Testable: yes - example

5.1 WHEN an employee views the leave management page THEN the System SHALL display their current leave balance
  Thoughts: This is testing that balance data is fetched and displayed
  Testable: yes - example

5.2 WHEN displaying leave balance THEN the System SHALL show total allowance, used days, and remaining days
  Thoughts: This is testing that all balance fields are displayed
  Testable: yes - example

5.3 WHEN leave balance is loaded THEN the System SHALL include the year for which the balance applies
  Thoughts: This is testing that year is displayed
  Testable: yes - example

5.4 WHEN leave balance fails to load THEN the System SHALL handle the error gracefully without blocking other functionality
  Thoughts: This is testing error handling that doesn't block the UI
  Testable: yes - example

5.5 WHEN a leave application is approved THEN the System SHALL refresh the leave balance to reflect the change
  Thoughts: This is testing that balance updates after approval. This is more of an integration test
  Testable: no

6.1 WHEN an employee views their leave history THEN the System SHALL provide filter buttons for "All", "Pending", "Approved", and "Rejected"
  Thoughts: This is testing that filter buttons exist
  Testable: yes - example

6.2 WHEN an employee clicks a filter button THEN the System SHALL highlight the active filter
  Thoughts: This is testing visual feedback for active filter
  Testable: yes - example

6.3 WHEN a filter is applied THEN the System SHALL fetch and display only leaves matching that status
  Thoughts: This is testing filtering logic
  Testable: yes - example

6.4 WHEN switching between filters THEN the System SHALL show a loading indicator during the fetch
  Thoughts: This is testing loading state during filter changes
  Testable: yes - example

6.5 WHEN no leaves match the filter THEN the System SHALL display a message indicating no results
  Thoughts: This is testing empty state for filtered results
  Testable: yes - example

7.1 WHEN an administrator views pending leaves THEN the System SHALL display employee name, email, department, leave type, dates, duration, and reason
  Thoughts: This is testing that all required fields are displayed in the admin view
  Testable: yes - example

7.2 WHEN displaying pending leaves THEN the System SHALL order them by submission date ascending (oldest first)
  Thoughts: This is testing data ordering. The backend handles this, but we can verify the display
  Testable: yes - example

7.3 WHEN an administrator filters by department THEN the System SHALL show only leaves from employees in that department
  Thoughts: This is testing filtering logic
  Testable: yes - example

7.4 WHEN an administrator filters by date range THEN the System SHALL show only leaves overlapping that range
  Thoughts: This is testing date range filtering
  Testable: yes - example

7.5 WHEN no pending leaves exist THEN the System SHALL display a message indicating no pending requests
  Thoughts: This is testing empty state
  Testable: yes - example

8.1 WHEN an administrator clicks "Approve" on a leave request THEN the System SHALL display a confirmation dialog
  Thoughts: This is testing that confirmation is shown
  Testable: yes - example

8.2 WHEN an administrator clicks "Reject" on a leave request THEN the System SHALL display a confirmation dialog
  Thoughts: Same as 8.1
  Testable: yes - example

8.3 WHEN an administrator confirms approval THEN the System SHALL call the approve API and refresh the list
  Thoughts: This is testing the approval flow
  Testable: yes - example

8.4 WHEN an administrator confirms rejection THEN the System SHALL call the reject API and refresh the list
  Thoughts: This is testing the rejection flow
  Testable: yes - example

8.5 WHEN an approval or rejection operation completes THEN the System SHALL display a success message
  Thoughts: This is testing success message display
  Testable: yes - example

9.1 WHEN an administrator enters a department filter THEN the System SHALL apply the filter and fetch matching leaves
  Thoughts: This is testing filter application
  Testable: yes - example

9.2 WHEN an administrator selects a start date filter THEN the System SHALL apply the filter and fetch matching leaves
  Thoughts: Same as 9.1
  Testable: yes - example

9.3 WHEN an administrator selects an end date filter THEN the System SHALL apply the filter and fetch matching leaves
  Thoughts: Same as 9.1
  Testable: yes - example

9.4 WHEN an administrator clicks "Clear Filters" THEN the System SHALL reset all filters and fetch all pending leaves
  Thoughts: This is testing filter reset
  Testable: yes - example

9.5 WHEN filters are applied THEN the System SHALL show a loading indicator during the fetch
  Thoughts: This is testing loading state
  Testable: yes - example

10.1 WHEN any API call fails THEN the System SHALL extract and display the error message from the response
  Thoughts: This is testing error extraction and display
  Testable: yes - example

10.2 WHEN an error message is displayed THEN the System SHALL use consistent styling across all components
  Thoughts: This is testing visual consistency, which is hard to test programmatically
  Testable: no

10.3 WHEN an error occurs THEN the System SHALL log the error to the console for debugging
  Thoughts: This is testing console logging
  Testable: yes - example

10.4 WHEN an error is displayed THEN the System SHALL automatically dismiss it after 5 seconds or allow manual dismissal
  Thoughts: This is testing auto-dismiss behavior
  Testable: yes - example

10.5 WHEN a network error occurs THEN the System SHALL display a user-friendly message indicating connectivity issues
  Thoughts: This is testing specific error message handling
  Testable: yes - example

### Property Reflection

After reviewing all acceptance criteria, most are UI-specific examples rather than universal properties. Frontend testing typically focuses on:
- Component rendering with specific props/state
- User interaction flows
- Error handling scenarios
- Edge cases (empty states, null values)

These are best tested with example-based tests (unit tests) rather than property-based tests. Property-based testing is more valuable for:
- Data transformation logic
- Validation functions
- Parsing/serialization
- Business logic

Since this spec focuses on UI polish and integration, we will use unit tests exclusively.

**No property-based tests are needed for this feature** - all testable criteria are examples.

## Error Handling

### Error Display Strategy

**Consistent Error Component**:
```typescript
interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  dismissAfter?: number; // milliseconds
}
```

**Error Extraction**:
```typescript
function extractErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  if (error.response?.status === 0) {
    return 'Network error - please check your connection';
  }
  return 'An unexpected error occurred';
}
```

### Error Categories

1. **Network Errors**: Connection failures, timeouts
2. **Validation Errors**: Form validation failures
3. **Authorization Errors**: Permission denied, token expired
4. **Business Logic Errors**: Overlapping leaves, insufficient balance
5. **Server Errors**: 500 errors, unexpected failures

## Testing Strategy

### Unit Testing Approach

**Framework**: Vitest + React Testing Library (already configured in the project)

**Test Coverage Areas**:

1. **Component Rendering Tests**
   - Test components render with different props/state
   - Test conditional rendering (active session vs no session)
   - Test empty states
   - Test loading states

2. **User Interaction Tests**
   - Test button clicks trigger correct handlers
   - Test form submissions
   - Test filter changes
   - Test confirmation dialogs

3. **Error Handling Tests**
   - Test error message display
   - Test error recovery
   - Test network error handling

4. **Integration Tests**
   - Test complete user flows (punch-in → view history)
   - Test API integration with mocked responses
   - Test state updates after API calls

### Test Organization

```
client/src/
├── components/
│   ├── AttendanceDashboard.tsx
│   ├── AttendanceDashboard.test.tsx
│   ├── LeaveManagement.tsx
│   ├── LeaveManagement.test.tsx
│   ├── PendingLeavesTable.tsx
│   └── PendingLeavesTable.test.tsx
├── pages/
│   ├── Leaves.tsx
│   └── Leaves.test.tsx
└── services/
    ├── api/
    │   ├── attendance.ts
    │   ├── attendance.test.ts
    │   ├── leaves.ts
    │   └── leaves.test.ts
```

### Testing Best Practices

1. **Mock API Calls**: Use MSW (Mock Service Worker) or jest.mock for API mocking
2. **Test User Behavior**: Focus on what users see and do, not implementation details
3. **Accessibility**: Test keyboard navigation and screen reader compatibility
4. **Responsive Design**: Test components at different viewport sizes
5. **Async Operations**: Properly wait for async operations to complete

## UI/UX Improvements

### Visual Consistency

**Color Scheme**:
- Success: Green (#10b981)
- Error: Red (#ef4444)
- Warning: Yellow (#f59e0b)
- Info: Blue (#3b82f6)
- Neutral: Gray (#6b7280)

**Typography**:
- Headings: font-semibold
- Body: font-normal
- Labels: font-medium text-sm
- Captions: text-xs text-muted-foreground

**Spacing**:
- Card padding: p-6
- Form spacing: space-y-4
- Grid gaps: gap-4
- Section spacing: space-y-6

### Loading States

**Button Loading**:
```typescript
<Button disabled={loading}>
  {loading ? 'Processing...' : 'Submit'}
</Button>
```

**Page Loading**:
```typescript
{loading && <Spinner className="h-8 w-8" />}
```

### Empty States

**No Data Message**:
```typescript
<div className="text-center py-8 text-muted-foreground">
  No records found
</div>
```

## Accessibility Considerations

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **ARIA Labels**: Proper labels for screen readers
3. **Focus Management**: Visible focus indicators
4. **Color Contrast**: WCAG AA compliance
5. **Error Announcements**: Screen reader announcements for errors

## Performance Considerations

1. **Debounce Filters**: Debounce filter inputs to reduce API calls
2. **Memoization**: Use React.memo for expensive components
3. **Lazy Loading**: Load components on demand
4. **Optimistic Updates**: Update UI before API response for better UX
5. **Caching**: Cache API responses where appropriate

## Browser Compatibility

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

## Deployment Considerations

1. **Environment Variables**: API base URL configuration
2. **Build Optimization**: Code splitting and minification
3. **Error Tracking**: Integration with error monitoring service
4. **Analytics**: Track user interactions for insights
5. **Feature Flags**: Ability to toggle features on/off
