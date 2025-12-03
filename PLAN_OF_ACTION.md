## PHASE 1 — Admin/HR Login System

### Backend

* Fix the existing auth flow for **User** model (admins/HR staff).
* Standardize responses (tokens, error handling, validation).
* Add proper session handling + refresh token flow.
* Make sure rate-limiting, brute-force protection, and password rules aren't a joke.

### Frontend

* Build admin/HR login page:

  * Real API calls (no stubs, no fake promises).
  * Form validation that actually works.
  * Loading + error states so users don't feel gaslit.

* On successful login:

  * Store tokens securely.
  * Redirect to admin dashboard.
  * Auto-refresh session (silent refresh).

---

## PHASE 1.5 — Employee Login System

**Note:** Employees use a completely separate authentication flow from admins. The Employee model currently has NO password authentication.

### Backend

* Add authentication to **Employee** model:
  * Add `passwordHash` field to Employee schema (or create separate EmployeeAuth table).
  * Create employee-specific auth endpoints:
    * `POST /auth/employee/login`
    * `POST /auth/employee/register` (or initial password setup)
    * `POST /auth/employee/refresh`
    * `POST /auth/employee/logout`
  * Employee tokens should include `employeeId`, `departmentId`, `jobRoleId`.
  * Separate refresh token handling for employees.
  * Apply same security measures (rate-limiting, brute-force protection).

### Frontend

* Build employee login page (separate from admin login):
  * Login with `employeeId` or `email` + password.
  * Real API calls to employee auth endpoints.
  * Form validation that actually works.
  * Loading + error states.

* On successful login:
  * Store employee tokens securely (separate from admin tokens).
  * Redirect to employee dashboard.
  * Auto-refresh session (silent refresh).

---

## PHASE 2 — Attendance & Leave Workflow

### Backend

#### Attendance APIs

* CRUD endpoints that don't choke under real usage.
* Punch in options:

  * **Office punch** → verify via office IP range.
  * **WFH punch** → verify via non-office IP.
* Prevent double punch-ins.
* Track punch-out as well (unless you want zombie sessions forever).

#### Leave APIs

* Create, update, approve, reject.
* Enforce leave rules:

  * Max leaves.
  * Overlaps.
  * Future dates only.
* Send email on approval/rejection.

---

## PHASE 3 - Attendence & Leave Frontend workflow

### Frontend

#### Attendance UI

* Clean dashboard showing (Implement this into existing dashboard):

  * Today's status (present/absent).
  * Punch-in/punch-out time.
  * Buttons for:

    * **Punch In — Office**
    * **Punch In — Work From Home**
* Must hit real APIs and show real timestamps.

#### Leave UI

* Page with:

  * Leave history (API-driven).
  * Leave application form.
  * Leave status indicators (pending/approved/rejected).
* Trigger email notification when backend approves leave.

---

## PHASE 4 - 