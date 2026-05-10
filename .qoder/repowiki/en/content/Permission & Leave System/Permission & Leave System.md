# Permission & Leave System

<cite>
**Referenced Files in This Document**
- [permissions.html](file://permissions.html)
- [worker-permissions.html](file://worker-permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)
- [salary.html](file://salary.html)
- [backend/server.js](file://backend/server.js)
- [backend/models/Permission.js](file://backend/models/Permission.js)
- [backend/models/Notification.js](file://backend/models/Notification.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes the permission and leave management system used by the 555 İnşaat construction workforce management platform. It covers the end-to-end workflows for submitting leave requests, approval processes, tracking, and integration with salary calculations. It also documents the data model for permissions, administrative controls, notifications, and audit-ready activity tracking.

## Project Structure
The system comprises:
- Frontend pages for administrators and workers to manage and track permissions
- Shared frontend utilities for authentication, data access, and UI behaviors
- A backend server exposing REST APIs and managing MongoDB persistence
- Domain models for permissions and notifications

```mermaid
graph TB
subgraph "Frontend"
A_Admin["Admin Permissions Page<br/>(permissions.html)"]
A_Worker["Worker Permissions Page<br/>(worker-permissions.html)"]
A_Auth["Authentication Utilities<br/>(auth.js)"]
A_App["Shared UI Utilities<br/>(app.js)"]
A_Salary["Salary Integration View<br/>(salary.html)"]
end
subgraph "Backend"
B_Server["Express Server<br/>(backend/server.js)"]
B_ModelPerm["Permission Model<br/>(backend/models/Permission.js)"]
B_ModelNotif["Notification Model<br/>(backend/models/Notification.js)"]
end
A_Admin --> A_Auth
A_Worker --> A_Auth
A_Admin --> A_App
A_Worker --> A_App
A_Salary --> A_Auth
A_Admin --> B_Server
A_Worker --> B_Server
A_Salary --> B_Server
B_Server --> B_ModelPerm
B_Server --> B_ModelNotif
```

**Diagram sources**
- [permissions.html](file://permissions.html)
- [worker-permissions.html](file://worker-permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)
- [salary.html](file://salary.html)
- [backend/server.js](file://backend/server.js)
- [backend/models/Permission.js](file://backend/models/Permission.js)
- [backend/models/Notification.js](file://backend/models/Notification.js)

**Section sources**
- [permissions.html](file://permissions.html)
- [worker-permissions.html](file://worker-permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)
- [salary.html](file://salary.html)
- [backend/server.js](file://backend/server.js)
- [backend/models/Permission.js](file://backend/models/Permission.js)
- [backend/models/Notification.js](file://backend/models/Notification.js)

## Core Components
- Admin permissions dashboard: displays pending/approved/rejected requests, allows approvals and rejections, and shows request details.
- Worker permissions portal: enables employees to submit requests, view statistics, filter history, and see weekly free leave usage.
- Shared utilities: authentication, data persistence via localStorage, UI helpers, and formatting functions.
- Backend server: Express-based API surface, route exposure, and MongoDB integration.
- Domain models: Permission and Notification schemas with indexes, lifecycle hooks, and helper methods.

Key capabilities:
- Request types: annual, sick, unpaid, maternity, paternity, bereavement, emergency, other (backend model)
- Status tracking: pending, approved, rejected, cancelled (backend model)
- Approval workflow: multi-level approvals with per-level tracking and final decision
- Paid/unpaid flags and document attachments for supporting evidence
- Notifications: in-app, email, SMS delivery channels with categories and read tracking
- Salary integration: paid leave days calculation impacting monthly deductions

**Section sources**
- [permissions.html](file://permissions.html)
- [worker-permissions.html](file://worker-permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)
- [backend/models/Permission.js](file://backend/models/Permission.js)
- [backend/models/Notification.js](file://backend/models/Notification.js)

## Architecture Overview
The system follows a client-server pattern:
- Clients (admin and worker dashboards) persist data locally in browser storage and interact with backend endpoints via REST.
- The backend server initializes security middleware, rate limiting, logging, and routes for permissions and notifications.
- MongoDB stores domain entities with indexes and pre-save logic for derived fields.

```mermaid
graph TB
C_Client["Browser Clients<br/>(permissions.html, worker-permissions.html)"]
C_Auth["auth.js<br/>localStorage, helpers"]
C_App["app.js<br/>UI utils, modals, tabs"]
S_Server["Express Server<br/>(backend/server.js)"]
S_Routes["Routes<br/>(/api/permissions, /api/notifications)"]
DB_Mongo["MongoDB Collections<br/>Permissions, Notifications"]
C_Client --> C_Auth
C_Client --> C_App
C_Client --> S_Server
S_Server --> S_Routes
S_Routes --> DB_Mongo
```

**Diagram sources**
- [backend/server.js](file://backend/server.js)
- [permissions.html](file://permissions.html)
- [worker-permissions.html](file://worker-permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

## Detailed Component Analysis

### Data Model: Permission
The Permission model defines the schema for leave/permission requests, including:
- Worker reference and type classification
- Start/end dates and computed days
- Reason, status, and paid/unpaid flag
- Multi-level approvals with per-level tracking
- Final decision metadata
- Optional substitute, handover notes, documents, emergency contact
- Return-to-work tracking
- Created/updated by metadata

```mermaid
erDiagram
PERMISSION {
ObjectId id PK
ObjectId worker FK
string type
date startDate
date endDate
number days
string reason
string status
boolean isPaid
ObjectId substitute
string handoverNotes
array documents
object emergencyContact
object returnToWork
ObjectId createdBy FK
ObjectId updatedBy FK
date createdAt
date updatedAt
}
APPROVAL {
number level
ObjectId approver FK
string status
string comment
date actionAt
}
PERMISSION ||--o{ APPROVAL : "approvals[]"
```

**Diagram sources**
- [backend/models/Permission.js](file://backend/models/Permission.js)

**Section sources**
- [backend/models/Permission.js](file://backend/models/Permission.js)

### Data Model: Notification
Notifications support multi-channel delivery and categorization:
- Recipient, title, message, type (info/success/warning/error), category (permission, salary, etc.)
- Related entity linkage, action link/text
- Delivery channels (in-app/email/SMS), priority, scheduling, expiration
- Read/click tracking and metadata

```mermaid
erDiagram
NOTIFICATION {
ObjectId id PK
ObjectId recipient FK
string title
string message
string type
string category
string relatedTo_model
ObjectId relatedTo_id
string actionLink
string actionText
boolean inApp
boolean email
boolean sms
string priority
date scheduledFor
date expiresAt
boolean isRead
date readAt
boolean clicked
date clickedAt
string batchId
mixed metadata
ObjectId createdBy FK
date createdAt
date updatedAt
}
```

**Diagram sources**
- [backend/models/Notification.js](file://backend/models/Notification.js)

**Section sources**
- [backend/models/Notification.js](file://backend/models/Notification.js)

### Admin Permissions Dashboard Workflow
The admin page organizes permissions by status and supports approval/rejection actions. It loads permission records, worker details, and renders a tabbed interface.

```mermaid
sequenceDiagram
participant Admin as "Admin User"
participant Page as "permissions.html"
participant Utils as "auth.js/app.js"
participant Storage as "localStorage"
Admin->>Page : Open Permissions Dashboard
Page->>Utils : checkAuth()
Utils-->>Page : currentUser
Page->>Utils : getPermissions(), getWorkers()
Utils->>Storage : read permissions/workers
Storage-->>Utils : arrays
Utils-->>Page : permissions, workers
Page->>Page : render pending/approved/rejected lists
Admin->>Page : Click "Approve" for a request
Page->>Utils : approvePermission(id)
Utils->>Storage : update permissions array
Storage-->>Utils : persisted
Utils-->>Page : showAlert("Approved")
Admin->>Page : Click "Reject" for a request
Page->>Utils : rejectPermission(id)
Utils->>Storage : update permissions array
Utils-->>Page : showAlert("Rejected")
```

**Diagram sources**
- [permissions.html](file://permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

**Section sources**
- [permissions.html](file://permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

### Worker Permissions Submission and Tracking
The worker portal allows employees to:
- Submit new requests with type selection (weekly free, paid, unpaid, sick, family)
- View statistics (total, weekly free, pending, paid leave)
- Filter and sort their permission history
- See status badges and calculated durations

```mermaid
sequenceDiagram
participant Worker as "Worker User"
participant Page as "worker-permissions.html"
participant Utils as "auth.js/app.js"
participant Storage as "localStorage"
Worker->>Page : Open My Permissions
Page->>Utils : checkAuth()
Utils-->>Page : currentUser
Page->>Utils : getPermissions()
Utils->>Storage : read permissions
Storage-->>Utils : array
Utils-->>Page : myPermissions
Page->>Page : render stats and list
Worker->>Page : Open "New Permission" modal
Page->>Page : set min dates, show info based on type
Worker->>Page : Submit form (type, dates, reason)
Page->>Utils : submitPermission(event)
Utils->>Storage : append new permission
Storage-->>Utils : persisted
Utils-->>Page : showNotification("Submitted")
Page->>Page : loadPermissions()
```

**Diagram sources**
- [worker-permissions.html](file://worker-permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

**Section sources**
- [worker-permissions.html](file://worker-permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

### Leave Entitlements and Weekly Free Day Logic
The worker interface enforces a weekly free day entitlement:
- Weekly free day is limited to one day per week
- The UI restricts end date to match start date for weekly free selections
- Statistics compute used weekly free days vs. allowance

```mermaid
flowchart TD
Start(["Select Leave Type"]) --> CheckType{"Type == Weekly Free?"}
CheckType --> |Yes| LimitEndDate["Set End Date = Start Date"]
CheckType --> |No| ShowInfo["Show cost/description"]
LimitEndDate --> Submit["Submit Request"]
ShowInfo --> Submit
Submit --> CalcUsage["Compute weekly free usage for current week"]
CalcUsage --> UpdateUI["Update UI counters"]
```

**Diagram sources**
- [worker-permissions.html](file://worker-permissions.html)

**Section sources**
- [worker-permissions.html](file://worker-permissions.html)

### Salary Integration and Paid Leave Deductions
Monthly salary computation considers:
- Work days (present, late, approved)
- Paid leave days (approved "paid" type) within the month
- Daily wage and deductions
- Penalties and bonuses adjustments

```mermaid
flowchart TD
S_Start(["Generate Monthly Salary"]) --> CountWork["Count work days for month"]
CountWork --> FilterPaid["Filter approved 'paid' leaves in month"]
FilterPaid --> CalcDays["For each leave: compute days overlapping month"]
CalcDays --> SumDays["Sum paid leave days"]
SumDays --> BaseCalc["Base = workDays × dailySalary"]
BaseCalc --> Deduct["Deduction = paidLeaveDays × dailySalary"]
Deduct --> NetCalc["Net = Base + Bonus - Deduction - Penalty"]
NetCalc --> Save["Persist salary record"]
```

**Diagram sources**
- [salary.html](file://salary.html)

**Section sources**
- [salary.html](file://salary.html)

### Backend Server and Route Exposure
The backend server configures:
- Security (Helmet), rate limiting, CORS, compression, logging
- Static file serving for uploads/public
- MongoDB connection and cron job initialization
- Route registration for permissions and notifications
- Health check and global error handling

```mermaid
graph LR
S["server.js"] --> MW1["Helmet CSP"]
S --> MW2["Rate Limit"]
S --> MW3["CORS"]
S --> MW4["Compression"]
S --> MW5["Morgan Logging"]
S --> DB["MongoDB Connect"]
S --> Routes["/api/* Routes"]
Routes --> Perm["/api/permissions"]
Routes --> Notif["/api/notifications"]
```

**Diagram sources**
- [backend/server.js](file://backend/server.js)

**Section sources**
- [backend/server.js](file://backend/server.js)

## Dependency Analysis
- Frontend depends on shared utilities for authentication, data access, and UI behaviors.
- Admin and worker dashboards share common helpers for modals, tabs, alerts, and date formatting.
- Backend depends on Mongoose for modeling and MongoDB for persistence.
- Permission model encapsulates approval workflow and derived fields.
- Notification model supports multi-channel delivery and read tracking.

```mermaid
graph TB
F_Admin["permissions.html"] --> U_Auth["auth.js"]
F_Admin --> U_App["app.js"]
F_Worker["worker-permissions.html"] --> U_Auth
F_Worker --> U_App
F_Salary["salary.html"] --> U_Auth
U_Auth --> M_Perms["Permission Model"]
U_Auth --> M_Notif["Notification Model"]
S_Server["backend/server.js"] --> M_Perms
S_Server --> M_Notif
```

**Diagram sources**
- [permissions.html](file://permissions.html)
- [worker-permissions.html](file://worker-permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)
- [salary.html](file://salary.html)
- [backend/server.js](file://backend/server.js)
- [backend/models/Permission.js](file://backend/models/Permission.js)
- [backend/models/Notification.js](file://backend/models/Notification.js)

**Section sources**
- [permissions.html](file://permissions.html)
- [worker-permissions.html](file://worker-permissions.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)
- [salary.html](file://salary.html)
- [backend/server.js](file://backend/server.js)
- [backend/models/Permission.js](file://backend/models/Permission.js)
- [backend/models/Notification.js](file://backend/models/Notification.js)

## Performance Considerations
- Client-side filtering and rendering are lightweight but can be optimized by virtualizing large lists.
- UI animations and counters should be throttled to avoid layout thrashing.
- Backend queries should leverage indexes on worker, status, dates, and type for efficient filtering.
- Pre-save hooks compute derived fields; ensure minimal overhead by validating inputs early.
- Consider pagination for large datasets in admin dashboards.

## Troubleshooting Guide
Common issues and resolutions:
- Authentication failures: verify credentials and role checks; ensure localStorage initialization runs before page logic.
- Empty permission lists: confirm localStorage keys exist and are populated; check date filters and status conditions.
- Approval/rejection not reflected: ensure the update routine persists to localStorage and refreshes the view.
- Salary calculation discrepancies: validate monthly overlap logic for partial-month leaves and paid leave counts.
- Notification delivery: verify channel flags and category routing; ensure recipients exist and notifications are not expired.

**Section sources**
- [auth.js](file://auth.js)
- [permissions.html](file://permissions.html)
- [worker-permissions.html](file://worker-permissions.html)
- [salary.html](file://salary.html)
- [backend/models/Notification.js](file://backend/models/Notification.js)

## Conclusion
The permission and leave system integrates a straightforward client-side workflow with backend models for robust approval tracking, multi-level approvals, and salary impact calculations. Administrators can efficiently review and act on requests, while workers benefit from a clear submission and tracking experience, including weekly free day enforcement and monthly deduction computations.