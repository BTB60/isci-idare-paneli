# Getting Started

<cite>
**Referenced Files in This Document**
- [index.html](file://index.html)
- [login.html](file://login.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)
- [dashboard.html](file://dashboard.html)
- [seller-dashboard.html](file://seller-dashboard.html)
- [worker-dashboard.html](file://worker-dashboard.html)
- [workers.html](file://workers.html)
- [tasks.html](file://tasks.html)
- [style.css](file://style.css)
- [backend/server.js](file://backend/server.js)
- [backend/package.json](file://backend/package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Installation and Setup](#installation-and-setup)
4. [Initial Setup Procedures](#initial-setup-procedures)
5. [Demo Accounts and Access Patterns](#demo-accounts-and-access-patterns)
6. [Step-by-Step Login and First-Time Experience](#step-by-step-login-and-first-time-experience)
7. [Role-Based Navigation](#role-based-navigation)
8. [Data Initialization and localStorage Usage](#data-initialization-and-localstorage-usage)
9. [Screenshots and Practical Examples](#screenshots-and-practical-examples)
10. [Common Setup Issues and Browser Compatibility](#common-setup-issues-and-browser-compatibility)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Conclusion](#conclusion)

## Introduction
This guide helps you quickly set up and use the 555 İnşaat İşçi İdarəetmə Sistemi. It covers system requirements, local installation, initial setup, demo accounts, login flow, role-based dashboards, and how the system persists data locally during development.

## System Requirements
- Modern web browser with JavaScript enabled
- No server installation required for local development (frontend-only)
- For backend development, Node.js and MongoDB are required (see Installation section)

## Installation and Setup
Follow these steps to run the system locally:

1. **Clone or download the repository** to your machine.
2. **Open the frontend in a browser**:
   - Navigate to the project folder and open [index.html](file://index.html) in your browser.
   - Alternatively, serve the files using a local static server (e.g., Live Server extension in VS Code).
3. **Optional: Backend development**:
   - Install Node.js and MongoDB.
   - Open the backend directory and install dependencies:
     ```
     cd backend
     npm install
     ```
   - Start the backend server:
     ```
     npm run dev
     ```
   - The backend server listens on port 5000 by default and exposes API routes for workers, attendance, salary, tasks, and more.

**Section sources**
- [backend/server.js:177-181](file://backend/server.js#L177-L181)
- [backend/package.json:6-9](file://backend/package.json#L6-L9)

## Initial Setup Procedures
- The system initializes demo data automatically when you log in for the first time. This includes workers, tasks, performance records, salaries, penalties, permissions, and shift changes.
- The initialization runs once per browser session and writes data into localStorage.

Key initialization points:
- Demo users and initial datasets are created in [auth.js](file://auth.js) during login form submission.
- Data keys created include: workers, tasks, performance, salaries, penalties, permissions, shiftChanges.

**Section sources**
- [auth.js:15-53](file://auth.js#L15-L53)

## Demo Accounts and Access Patterns
Use these demo credentials to log in:

- Admin
  - Username: admin
  - Password: admin123
  - Role: admin
- Seller
  - Username: seller
  - Password: seller123
  - Role: seller
- Workers
  - worker1 / worker123
  - worker2 / worker123
  - worker3 / worker123

Access patterns:
- On the login page, select the appropriate role from the dropdown and enter credentials.
- Click “Demo” cards to auto-fill credentials and role.

**Section sources**
- [login.html:100-125](file://login.html#L100-L125)
- [auth.js:6-13](file://auth.js#L6-L13)

## Step-by-Step Login and First-Time Experience
1. Open [login.html](file://login.html) in your browser.
2. Choose a role:
   - 👤 Admin
   - 🛒 Seller
   - 👷 Worker
3. Enter username and password.
4. Click “Login”.
5. On successful login:
   - Admin is redirected to [dashboard.html](file://dashboard.html).
   - Seller is redirected to [seller-dashboard.html](file://seller-dashboard.html).
   - Worker is redirected to [worker-dashboard.html](file://worker-dashboard.html).
6. The system initializes demo data automatically if not present.

Optional: Use the “Demo” cards to quickly fill credentials and role.

**Section sources**
- [login.html:77-94](file://login.html#L77-L94)
- [auth.js:90-127](file://auth.js#L90-L127)
- [dashboard.html:274-278](file://dashboard.html#L274-L278)
- [seller-dashboard.html:299-303](file://seller-dashboard.html#L299-L303)
- [worker-dashboard.html:292-296](file://worker-dashboard.html#L292-L296)

## Role-Based Navigation
After logging in, each role has a dedicated dashboard and navigation menu:

- Admin
  - Dashboard: [dashboard.html](file://dashboard.html)
  - Navigation includes Workers, Performance, Tasks, Salary, Penalties, Permissions, Shift Change, Reports.
  - Example page: [workers.html](file://workers.html), [tasks.html](file://tasks.html)

- Seller
  - Dashboard: [seller-dashboard.html](file://seller-dashboard.html)
  - Navigation includes Dashboard, Materials, Sales, Orders, Reports.

- Worker
  - Dashboard: [worker-dashboard.html](file://worker-dashboard.html)
  - Navigation includes Performance, Tasks, Projects, Overtime, Advances, Salary, Targets, Permissions, Documents, Shift Change.

All dashboards include:
- Sidebar navigation
- Theme toggle (light/dark mode)
- Logout button
- Role-specific widgets and data

**Section sources**
- [dashboard.html:22-59](file://dashboard.html#L22-L59)
- [seller-dashboard.html:22-43](file://seller-dashboard.html#L22-L43)
- [worker-dashboard.html:22-67](file://worker-dashboard.html#L22-L67)

## Data Initialization and localStorage Usage
During login, the system checks for required localStorage keys and initializes them if missing. Keys include:
- workers
- tasks
- performance
- salaries
- penalties
- permissions
- shiftChanges

The initialization logic resides in [auth.js](file://auth.js). It creates realistic demo data for workers, tasks, performance, salaries, penalties, and shift changes.

LocalStorage helpers:
- The application provides helper functions to manage localStorage with expiration and convenience utilities (e.g., saving data, formatting currency/date, calculating statistics).

**Section sources**
- [auth.js:15-53](file://auth.js#L15-L53)
- [auth.js:158-165](file://auth.js#L158-L165)
- [app.js:328-350](file://app.js#L328-L350)

## Screenshots and Practical Examples
Below are practical examples of accessing dashboards and navigating roles. Replace the images with actual screenshots taken from your browser.

- Admin Dashboard
  - Access: [dashboard.html](file://dashboard.html)
  - Example screenshot: Admin dashboard with stats and quick actions
  - Navigation: Workers, Performance, Tasks, Salary, Penalties, Permissions, Shift Change, Reports

- Seller Dashboard
  - Access: [seller-dashboard.html](file://seller-dashboard.html)
  - Example screenshot: Seller dashboard with sales summary and quick actions
  - Navigation: Materials, Sales, Orders, Reports

- Worker Dashboard
  - Access: [worker-dashboard.html](file://worker-dashboard.html)
  - Example screenshot: Worker dashboard with attendance controls and personal stats
  - Navigation: Performance, Tasks, Projects, Overtime, Advances, Salary, Targets, Permissions, Documents, Shift Change

- Workers List (Admin)
  - Access: [workers.html](file://workers.html)
  - Example screenshot: Admin view of workers table with filters and actions

- Tasks List (Admin)
  - Access: [tasks.html](file://tasks.html)
  - Example screenshot: Admin view of tasks with status updates and actions

**Section sources**
- [dashboard.html:274-379](file://dashboard.html#L274-L379)
- [seller-dashboard.html:299-437](file://seller-dashboard.html#L299-L437)
- [worker-dashboard.html:292-554](file://worker-dashboard.html#L292-L554)
- [workers.html:132-159](file://workers.html#L132-L159)
- [tasks.html:62-74](file://tasks.html#L62-L74)

## Common Setup Issues and Browser Compatibility
- JavaScript disabled
  - Symptom: Login form does not submit or interactive elements do not work.
  - Resolution: Enable JavaScript in your browser.
- localStorage blocked
  - Symptom: Data not persisting or login not remembered.
  - Resolution: Use an incognito/private window or enable localStorage in your browser settings.
- CORS errors (backend)
  - Symptom: API calls fail when running backend locally.
  - Resolution: Ensure the backend server is running and CORS allows your frontend origins.
- Port conflicts
  - Symptom: Backend fails to start on port 5000.
  - Resolution: Change the port in environment variables or stop the conflicting service.

Browser compatibility:
- Works on modern browsers (Chrome, Firefox, Edge, Safari). Ensure JavaScript is enabled.

**Section sources**
- [backend/server.js:55-63](file://backend/server.js#L55-L63)
- [backend/server.js:177-181](file://backend/server.js#L177-L181)

## Troubleshooting Guide
- Login fails with incorrect credentials
  - Verify role selection matches the demo account (admin, seller, worker).
  - Ensure username/password match the demo accounts.
- Redirect loop or wrong dashboard
  - Confirm the correct role is selected before login.
  - Admins are redirected to [dashboard.html](file://dashboard.html), sellers to [seller-dashboard.html](file://seller-dashboard.html), workers to [worker-dashboard.html](file://worker-dashboard.html).
- Data not loading
  - Refresh the page to trigger data initialization.
  - Clear browser cache/localStorage if corrupted.
- Theme toggle not switching
  - The theme preference is stored in localStorage; clearing it resets to default.
- Backend API not responding
  - Ensure MongoDB is running and reachable.
  - Check backend logs for connection errors.

**Section sources**
- [auth.js:55-63](file://auth.js#L55-L63)
- [auth.js:90-127](file://auth.js#L90-L127)
- [app.js:70-94](file://app.js#L70-L94)
- [backend/server.js:79-93](file://backend/server.js#L79-L93)

## Conclusion
You are now ready to explore the 555 İnşaat İşçi İdarəetmə Sistemi. Use the demo accounts to experience admin, seller, and worker dashboards. For backend development, install Node.js and MongoDB, then start the server. For frontend-only usage, simply open [index.html](file://index.html) in your browser.