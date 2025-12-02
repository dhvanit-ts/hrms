# Implementation Plan: Employee Login System

## Task List

- [x] 1. Fix existing backend authentication bugs




- [x] 1.1 Add missing prisma import to auth.controller.ts refresh function


  - Import prisma from @/config/db.js
  - Fix the undefined prisma.user reference in the refresh function
  - _Requirements: 5.1_

- [x] 1.2 Standardize error handling in auth service


  - Convert all thrown Error instances to use consistent error classes
  - Ensure all errors are properly caught and handled in controllers
  - Return appropriate HTTP status codes for different error types
  - _Requirements: 3.2, 1.3_

- [x] 1.3 Add validation middleware to refresh endpoint


  - Ensure refresh endpoint validates the presence of refresh_token cookie
  - Add proper error responses for missing or invalid cookies
  - _Requirements: 5.5_

- [ ]* 1.4 Write property test for password hashing
  - **Property 2: Password hashing**
  - **Validates: Requirements 2.6**

- [x] 2. Enhance password validation and security




- [x] 2.1 Verify password validation schema in registerSchema


  - Confirm all password requirements are enforced (12+ chars, lowercase, uppercase, digit, special char)
  - Test with various invalid passwords to ensure proper rejection
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.2 Improve password validation error messages


  - Update Zod schema to provide specific error messages for each failed requirement
  - Return structured validation errors that specify which requirements are not met
  - _Requirements: 1.2_

- [ ]* 2.3 Write property test for registration input validation
  - **Property 1: Registration input validation**
  - **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5**

- [ ] 3. Implement comprehensive token management




- [x] 3.1 Verify token rotation in rotateRefreshToken function


  - Ensure old token is marked as revoked
  - Verify new token is issued and stored in database
  - Confirm reuse detection logic works correctly
  - _Requirements: 5.2, 5.3_

- [x] 3.2 Enhance cookie security configuration


  - Verify buildRefreshCookie uses all security flags from environment
  - Ensure httpOnly, secure, sameSite, domain, and path are correctly set
  - Test cookie configuration in different environments
  - _Requirements: 1.5, 3.4, 5.4_

- [ ]* 3.3 Write property test for token refresh rotation
  - **Property 7: Token refresh rotation**
  - **Validates: Requirements 5.1, 5.2, 5.4**

- [ ]* 3.4 Write property test for cookie security configuration
  - **Property 9: Cookie security configuration**
  - **Validates: Requirements 1.5, 3.4, 5.4**
-

- [x] 4. Complete authentication flow implementation




- [x] 4.1 Verify registration completeness


  - Ensure user creation, token issuance, and cookie setting all work together
  - Test that passwordHash is excluded from response
  - Verify refresh token is stored in database
  - _Requirements: 1.4, 1.5_

- [x] 4.2 Verify login flow completeness


  - Ensure credential verification, token issuance, lastLogin update work together
  - Test inactive account rejection
  - Verify roles are included in access token payload
  - _Requirements: 3.1, 3.3, 3.5_

- [x] 4.3 Implement logout token revocation


  - Verify all refresh tokens are deleted for the user
  - Ensure cookie is properly cleared
  - Handle logout gracefully even without valid access token
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 4.4 Write property test for successful registration completeness
  - **Property 3: Successful registration completeness**
  - **Validates: Requirements 1.4, 1.5**

- [ ]* 4.5 Write property test for login with valid credentials
  - **Property 4: Login with valid credentials**
  - **Validates: Requirements 3.1, 3.4**

- [ ]* 4.6 Write property test for login credential validation
  - **Property 5: Login credential validation**
  - **Validates: Requirements 3.2**

- [ ]* 4.7 Write property test for access token contains roles
  - **Property 6: Access token contains roles**
  - **Validates: Requirements 3.5**

- [ ]* 4.8 Write property test for logout token revocation
  - **Property 8: Logout token revocation**
  - **Validates: Requirements 6.1, 6.2**

- [x] 5. Verify rate limiting and security middleware





- [x] 5.1 Test rate limiting configuration


  - Verify rate limiter is applied to /api/auth/* endpointsb
  - Test that 10 requests per minute limit is enforced
  - Confirm 429 status code is returned when limit exceeded
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5.2 Verify CORS configuration


  - Ensure CORS_ORIGINS from environment is properly parsed
  - Test that credentials are enabled for cookie transmission
  - _Requirements: 8.1_

- [x] 5.3 Verify Helmet security headers


  - Confirm Helmet is applied with appropriate security headers
  - Test that x-powered-by header is disabled
  - _Requirements: Security considerations_

- [x] 6. Checkpoint - Ensure all backend tests pass




  - Ensure all tests pass, ask the user if questions arise.


- [x] 7. Implement frontend login page improvements




- [x] 7.1 Enhance Login.tsx with better validation


  - Add client-side email format validation
  - Add password minimum length validation
  - Display inline validation errors for each field
  - Prevent form submission when validation errors exist
  - _Requirements: 7.2, 10.1, 10.2, 10.3_

- [x] 7.2 Improve error and loading states

  - Ensure loading state disables submit button and shows loading text
  - Display API error messages in a visible error container
  - Clear errors when user retries or corrects input
  - _Requirements: 7.3, 7.4_

- [x] 7.3 Add form field labels and placeholders

  - Verify email and password fields have appropriate labels
  - Ensure placeholders provide helpful hints
  - _Requirements: 7.1_

- [ ]* 7.4 Write property test for empty form validation
  - **Property 10: Empty form validation**
  - **Validates: Requirements 7.2**

- [ ]* 7.5 Write property test for email validation display
  - **Property 13: Form validation error display**
  - **Validates: Requirements 10.1**

- [ ]* 7.6 Write property test for password length validation
  - **Property 14: Password length validation**
  - **Validates: Requirements 10.2**

- [ ]* 7.7 Write property test for validation error blocking
  - **Property 15: Validation error blocking**
  - **Validates: Requirements 10.3**

- [ ]* 7.8 Write property test for error clearing on correction
  - **Property 16: Error clearing on correction**
  - **Validates: Requirements 10.4**

- [x] 8. Implement role-based redirection





- [x] 8.1 Create role priority utility function


  - Implement function to determine highest privilege role
  - Define role hierarchy: SUPER_ADMIN > ADMIN > HR > MANAGER > EMPLOYEE
  - _Requirements: 9.5_

- [x] 8.2 Create dashboard route mapping


  - Map each role to its appropriate dashboard route
  - Handle users with multiple roles using priority function
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8.3 Update Login.tsx to use role-based redirect


  - Replace hardcoded '/' redirect with role-based routing
  - Use user roles from AuthContext to determine redirect
  - _Requirements: 7.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 8.4 Write property test for role redirect priority
  - **Property 12: Role-based redirect priority**
  - **Validates: Requirements 9.5**

- [x] 9. Enhance AuthContext session management





- [x] 9.1 Implement session restoration on app load


  - Add logic to attempt token refresh on AuthContext initialization
  - Handle refresh failure gracefully (don't show errors on initial load)
  - Update user state if refresh succeeds
  - _Requirements: 8.4_

- [x] 9.2 Verify access token storage security


  - Confirm access token is stored only in React state (memory)
  - Add check to ensure token is never written to localStorage or sessionStorage
  - _Requirements: 8.5_

- [x] 9.3 Improve logout error handling


  - Ensure logout clears state even if API call fails
  - Handle network errors gracefully during logout
  - _Requirements: 6.3_
-

- [x] 10. Enhance HTTP client interceptor




- [x] 10.1 Verify automatic token refresh on 401


  - Ensure interceptor catches 401 responses
  - Confirm refresh endpoint is called with cookie
  - Verify original request is retried with new token
  - _Requirements: 8.1, 8.2_

- [x] 10.2 Implement refresh failure handling

  - Clear auth state when refresh fails
  - Redirect to login page on refresh failure
  - Prevent infinite retry loops
  - _Requirements: 8.3_

- [x] 10.3 Add request retry tracking

  - Mark requests that have already been retried to prevent loops
  - Ensure only one refresh attempt per failed request
  - _Requirements: 8.1_

- [ ]* 10.4 Write property test for automatic token refresh on 401
  - **Property 11: Automatic token refresh on 401**
  - **Validates: Requirements 8.1, 8.2**
-

- [x] 11. Create test utilities and setup




- [x] 11.1 Create backend test utilities


  - Implement createTestUser() helper
  - Implement generateValidPassword() helper
  - Implement generateInvalidPassword() helper
  - Implement extractCookie() helper
  - Implement decodeToken() helper
  - _Requirements: Testing strategy_

- [x] 11.2 Create frontend test utilities


  - Implement renderWithAuth() helper
  - Implement mockApiResponse() helper
  - Implement fillLoginForm() helper
  - Implement waitForLoadingState() helper
  - _Requirements: Testing strategy_

- [x] 11.3 Configure fast-check for property-based testing


  - Install fast-check dependency
  - Configure test runner to support property-based tests
  - Set minimum iterations to 100 for all property tests
  - _Requirements: Testing strategy_

- [x] 12. Final checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 13. Write integration tests
- [ ]* 13.1 Write integration test for complete registration flow
  - Test API → Database → Response flow
  - Verify user creation, token issuance, cookie setting
  - _Requirements: 1.1, 1.4, 1.5_

- [ ]* 13.2 Write integration test for complete login flow
  - Test credential verification, token issuance, lastLogin update
  - Verify cookie setting and response structure
  - _Requirements: 3.1, 3.4, 3.5_

- [ ]* 13.3 Write integration test for token refresh flow
  - Test token rotation and cookie update
  - Verify old token revocation
  - _Requirements: 5.1, 5.2, 5.4_

- [ ]* 13.4 Write integration test for logout flow
  - Test token revocation and cookie clearing
  - Verify graceful handling without access token
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 13.5 Write integration test for rate limiting
  - Test that 11th request within 1 minute is rejected
  - Verify 429 status code and error message
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 13.6 Write integration test for frontend-backend cookie handling
  - Test that cookies are properly sent and received
  - Verify HttpOnly cookies work with Axios withCredentials
  - _Requirements: 1.5, 3.4, 5.4_
