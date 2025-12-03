# Product Overview

HRMS (Human Resource Management System) - A full-stack MERN application for managing HR operations including employee management, attendance tracking, leave requests, and payroll.

## Key Features

- **Dual Authentication**: Separate auth flows for admin/HR staff (User model) and employees (Employee model)
- **Attendance Management**: Office and WFH punch-in/out with IP validation
- **Leave Management**: Request, approve/reject leaves with email notifications
- **Employee Management**: CRUD operations for employee records, departments, and job roles
- **Payroll**: Salary management with allowances and deductions
- **RBAC**: Role-based access control (ADMIN, MANAGER, EMPLOYEE)

## Security

- JWT-based auth with HttpOnly refresh tokens (7d TTL, rotation + reuse detection)
- Access tokens in memory (15m TTL)
- Rate limiting, helmet, CORS allowlist
- Strong password policies via Zod validation
- IP-based attendance verification

## Current Phase

Phase 3: Attendance & Leave Frontend workflow - building UI components for attendance tracking and leave management with real API integration.
