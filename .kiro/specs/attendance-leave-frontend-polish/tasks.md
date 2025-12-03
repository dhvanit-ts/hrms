# Implementation Plan

- [x] 1. Code cleanup and minor fixes






- [x] 1.1 Remove unused Clock import from PendingLeavesTable


  - Remove the unused `Clock` import from `client/src/components/PendingLeavesTable.tsx`
  - _Requirements: Code quality_


- [x] 1.2 Add client-side date validation to LeaveManagement form

  - Add validation to check that end date is not before start date
  - Display error message if validation fails
  - Prevent form submission if validation fails
  - _Requirements: 4.3, 4.4_

- [ ]* 1.3 Write unit tests for date validation
  - Test that end date before start date shows error
  - Test that valid dates allow submission
  - _Requirements: 4.3_

- [x] 2. Improve error handling consistency






- [x] 2.1 Create reusable ErrorAlert component


  - Create a consistent error alert component with auto-dismiss functionality
  - Support manual dismissal
  - Support auto-dismiss after configurable timeout
  - _Requirements: 10.1, 10.2, 10.4_

- [x] 2.2 Create error extraction utility function


  - Create `extractErrorMessage` function to standardize error message extraction
  - Handle network errors with user-friendly messages
  - Handle different error response formats
  - _Requirements: 10.1, 10.5_

- [x] 2.3 Update AttendanceDashboard to use new error handling


  - Replace inline error display with ErrorAlert component
  - Use extractErrorMessage utility
  - Add console logging for errors
  - _Requirements: 2.4, 10.1, 10.3_

- [x] 2.4 Update LeaveManagement to use new error handling


  - Replace inline error display with ErrorAlert component
  - Use extractErrorMessage utility
  - Add console logging for errors
  - _Requirements: 4.4, 10.1, 10.3_

- [x] 2.5 Update Leaves page to use new error handling


  - Replace inline error display with ErrorAlert component
  - Use extractErrorMessage utility
  - Add console logging for errors
  - _Requirements: 10.1, 10.3_

- [ ]* 2.6 Write unit tests for error handling
  - Test ErrorAlert component rendering
  - Test auto-dismiss functionality
  - Test extractErrorMessage with different error types
  - _Requirements: 10.1, 10.4, 10.5_

- [x] 3. Add loading state improvements





- [x] 3.1 Verify loading indicators in AttendanceDashboard


  - Ensure loading indicators show during punch-in/out operations
  - Ensure buttons are disabled during operations
  - Ensure loading state is cleared after operations complete
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.2 Verify loading indicators in LeaveManagement


  - Ensure loading indicators show during form submission
  - Ensure loading indicators show during filter changes
  - Ensure buttons are disabled during operations
  - _Requirements: 6.4_

- [x] 3.3 Verify loading indicators in PendingLeavesTable


  - Ensure loading indicators show during approve/reject operations
  - Ensure buttons are disabled during operations
  - Ensure loading state is cleared after operations complete
  - _Requirements: 9.5_

- [ ]* 3.4 Write unit tests for loading states
  - Test loading indicators appear during async operations
  - Test buttons are disabled during operations
  - Test loading state clears after completion
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Verify empty state handling






- [x] 4.1 Verify empty states in AttendanceDashboard


  - Ensure "No attendance records found" message displays when history is empty
  - Ensure proper styling for empty state
  - _Requirements: 3.5_

- [x] 4.2 Verify empty states in LeaveManagement


  - Ensure "No leave applications found" message displays when history is empty
  - Ensure proper styling for empty state
  - _Requirements: 6.5_

- [x] 4.3 Verify empty states in PendingLeavesTable


  - Ensure "No pending leave requests found" message displays when list is empty
  - Ensure proper styling for empty state
  - _Requirements: 7.5_

- [ ]* 4.4 Write unit tests for empty states
  - Test empty state messages display correctly
  - Test empty state styling
  - _Requirements: 3.5, 6.5, 7.5_
- [x] 5. Verify null value handling




- [x] 5.1 Verify null handling in AttendanceDashboard


  - Ensure dash or placeholder displays for null check-out time
  - Ensure dash or placeholder displays for null type
  - Ensure dash or placeholder displays for null duration
  - _Requirements: 3.3, 3.4_

- [x] 5.2 Verify null handling in LeaveManagement


  - Ensure dash or placeholder displays for null reason
  - _Requirements: Leave display_

- [x] 5.3 Verify null handling in PendingLeavesTable


  - Ensure dash or placeholder displays for null reason
  - _Requirements: 7.1_

- [ ]* 5.4 Write unit tests for null value handling
  - Test null values display as dash or placeholder
  - Test components don't crash with null values
  - _Requirements: 3.3, 3.4_

- [x] 6. Verify filter functionality






- [x] 6.1 Verify leave status filters in LeaveManagement


  - Ensure all filter buttons are present (All, Pending, Approved, Rejected)
  - Ensure active filter is highlighted
  - Ensure filter changes fetch correct data
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6.2 Verify admin filters in PendingLeavesTable


  - Ensure department filter works correctly
  - Ensure date range filters work correctly
  - Ensure "Clear Filters" button resets all filters
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 6.3 Write unit tests for filter functionality
  - Test filter buttons render correctly
  - Test active filter is highlighted
  - Test filter changes trigger API calls
  - Test clear filters resets state
  - _Requirements: 6.1, 6.2, 6.3, 9.1, 9.2, 9.3, 9.4_
-

- [x] 7. Verify confirmation dialogs




- [x] 7.1 Verify approval confirmation in Leaves page


  - Ensure confirmation dialog appears when clicking "Approve"
  - Ensure API is called only after confirmation
  - Ensure list refreshes after approval
  - _Requirements: 8.1, 8.3_



- [x] 7.2 Verify rejection confirmation in Leaves page



  - Ensure confirmation dialog appears when clicking "Reject"
  - Ensure API is called only after confirmation
  - Ensure list refreshes after rejection
  - _Requirements: 8.2, 8.4_

- [ ]* 7.3 Write unit tests for confirmation dialogs
  - Test confirmation dialog appears


  - Test API is not called if user cancels


  - Test API is called if user confirms
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 8. Verify success message handling

- [x] 8.1 Verify success messages in Leaves page

  - Ensure success message displays after approval
  - Ensure success message displays after rejection
  - Ensure success message auto-dismisses after 3 seconds
  - _Requirements: 8.5_

- [x] 8.2 Verify success messages in LeaveManagement







  - Ensure form clears after successful submission
  - Ensure leave history refreshes after submission
  - Ensure leave balance refreshes after submission
  - _Requirements: 4.5_

- [ ]* 8.3 Write unit tests for success messages
  - Test success message displays
  - Test success message auto-dismisses
  - Test form clears after submission
  - _Requirements: 4.5, 8.5_


- [x] 9. Verify data display completeness





- [x] 9.1 Verify attendance data display


  - Ensure all fields are displayed (date, type, check-in, check-out, duration)
  - Ensure proper formatting for dates and times
  - Ensure proper formatting for duration
  - _Requirements: 3.1, 3.2_

- [x] 9.2 Verify leave balance display


  - Ensure all balance fields are displayed (allowance, used, remaining)
  - Ensure year is displayed
  - Ensure proper styling for balance card
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9.3 Verify pending leaves data display


  - Ensure all fields are displayed (employee name, email, department, type, dates, duration, reason)
  - Ensure proper formatting for dates
  - Ensure duration calculation is correct
  - _Requirements: 7.1_

- [ ]* 9.4 Write unit tests for data display
  - Test all required fields are rendered
  - Test date formatting
  - Test duration calculation
  - _Requirements: 3.1, 3.2, 5.1, 5.2, 5.3, 7.1_

- [x] 10. Verify punch-in button functionality





- [x] 10.1 Verify punch-in buttons in AttendanceDashboard

  - Ensure both "Punch In - Office" and "Punch In - WFH" buttons are displayed
  - Ensure both buttons call the same punch-in API
  - Ensure attendance status refreshes after punch-in
  - Ensure correct type badge is displayed after punch-in
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 10.2 Write unit tests for punch-in functionality
  - Test both buttons are rendered
  - Test buttons call punch-in API
  - Test status refreshes after punch-in
  - Test type badge displays correctly



  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 11. Final checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
