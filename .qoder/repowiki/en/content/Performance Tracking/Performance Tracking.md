# Performance Tracking

<cite>
**Referenced Files in This Document**
- [performance.html](file://performance.html)
- [worker-performance.html](file://worker-performance.html)
- [attendance.html](file://attendance.html)
- [salary.html](file://salary.html)
- [reports.html](file://reports.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)
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
10. [Appendices](#appendices)

## Introduction
This document explains the performance tracking system used to monitor worker attendance, log daily performance, compute efficiency metrics, and generate reports. It covers the data model for attendance and performance records, the attendance marking and approval workflow, automated analytics for attendance rates and rankings, and the integration with salary calculations through work days tracking. It also describes the worker-specific performance view and administrative reporting capabilities.

## Project Structure
The performance tracking system is implemented as client-side Single Page Applications (SPA) pages with shared utilities for authentication, data persistence, and UI helpers. Key pages include:
- Administrative performance dashboard for daily logs, rankings, and filtering
- Worker performance dashboard for personal attendance history and metrics
- Attendance management with manual entry and pending approvals
- Salary calculation integrating performance and permissions
- Reporting module aggregating attendance, salary, and performance data

```mermaid
graph TB
subgraph "UI Pages"
PERF["performance.html"]
WPERF["worker-performance.html"]
ATT["attendance.html"]
SAL["salary.html"]
REP["reports.html"]
end
subgraph "Shared Modules"
AUTH["auth.js"]
APP["app.js"]
end
PERF --> AUTH
WPERF --> AUTH
ATT --> AUTH
SAL --> AUTH
REP --> AUTH
PERF --> APP
WPERF --> APP
ATT --> APP
SAL --> APP
REP --> APP
```

**Diagram sources**
- [performance.html](file://performance.html)
- [worker-performance.html](file://worker-performance.html)
- [attendance.html](file://attendance.html)
- [salary.html](file://salary.html)
- [reports.html](file://reports.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

**Section sources**
- [performance.html](file://performance.html)
- [worker-performance.html](file://worker-performance.html)
- [attendance.html](file://attendance.html)
- [salary.html](file://salary.html)
- [reports.html](file://reports.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

## Core Components
- Data model and persistence:
  - Workers, tasks, performance logs, salaries, penalties, permissions, shift changes are stored in browser localStorage.
  - Utility functions provide getters, setters, and helpers for dates, currency, and IDs.
- Attendance recording:
  - Daily attendance entries with status (present, absent, leave, half-day) and optional check-in/check-out times.
  - Pending approvals for attendance entries awaiting admin review.
- Performance logging:
  - Daily performance records with status, hours worked, efficiency percentage, and notes.
  - Ranking computed from average efficiency and attendance rate.
- Salary integration:
  - Work days derived from performance logs (present/late/approved) and paid leave days from permissions.
- Reporting:
  - Administrative reports aggregating attendance, salary, performance, and penalties across workers and time periods.

**Section sources**
- [auth.js](file://auth.js)
- [app.js](file://app.js)
- [performance.html](file://performance.html)
- [worker-performance.html](file://worker-performance.html)
- [attendance.html](file://attendance.html)
- [salary.html](file://salary.html)
- [reports.html](file://reports.html)

## Architecture Overview
The system follows a client-side SPA architecture with a shared module for authentication and utilities. Each page initializes data, loads worker lists, and renders dynamic content. Data is persisted locally and accessed via helper functions.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant PerfPage as "performance.html"
participant AttPage as "attendance.html"
participant SalPage as "salary.html"
participant RepPage as "reports.html"
participant Auth as "auth.js"
participant Util as "app.js"
participant Storage as "localStorage"
Admin->>PerfPage : Open Performance Dashboard
PerfPage->>Auth : checkAuth()
PerfPage->>Util : initTabs(), formatDate(), showAlert()
PerfPage->>Auth : getWorkers(), getPerformance()
PerfPage->>Storage : Read/write performance logs
PerfPage-->>Admin : Render daily logs, ranking
Admin->>AttPage : Open Attendance Management
AttPage->>Auth : checkAuth(), getWorkers()
AttPage->>Storage : Read/write attendance/pending
AttPage-->>Admin : Approve/reject entries
Admin->>SalPage : Open Salary Calculation
SalPage->>Auth : getWorkers(), getPerformance(), getPermissions(), getPenalties()
SalPage->>Storage : Read/write salaries
SalPage-->>Admin : Compute work days, bonuses, penalties, totals
Admin->>RepPage : Open Reports
RepPage->>Auth : getWorkers(), getPerformance(), getSalaries(), getPenalties(), getTasks()
RepPage-->>Admin : Aggregate stats, charts, top performers
```

**Diagram sources**
- [performance.html](file://performance.html)
- [attendance.html](file://attendance.html)
- [salary.html](file://salary.html)
- [reports.html](file://reports.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

## Detailed Component Analysis

### Performance Logging and Rankings
- Daily performance logs capture worker status, hours worked, efficiency percentage, and notes.
- Filtering by date and worker allows targeted views.
- Ranking computes weighted score combining average efficiency and attendance rate.

```mermaid
flowchart TD
Start(["Load Performance"]) --> Fetch["Fetch performance & workers"]
Fetch --> Filter["Apply date & worker filters"]
Filter --> Sort["Sort by date desc"]
Sort --> Render["Render table rows"]
Render --> Rank["Compute worker stats<br/>avg efficiency, attendance rate"]
Rank --> Weight["Weighted score = 0.6*eff + 0.4*attendance"]
Weight --> List["List workers by score desc"]
```

**Diagram sources**
- [performance.html](file://performance.html)

**Section sources**
- [performance.html](file://performance.html)

### Attendance Recording and Approval Workflow
- Manual attendance entry supports status and check-in/check-out times.
- Pending approvals require admin review; approved entries move to main attendance list.
- Statistics summarize present, absent, pending, and leave counts for the selected date.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Att as "attendance.html"
participant Util as "app.js"
participant Auth as "auth.js"
participant Store as "localStorage"
Admin->>Att : Open Attendance
Att->>Auth : getWorkers(), getAttendance(), getPendingAttendance()
Att->>Store : Read attendance/pending
Admin->>Att : Click "Add Entry"
Att->>Util : openModal()
Admin->>Att : Fill manual entry form
Att->>Store : Save to pending
Admin->>Att : Approve or Reject
Att->>Store : Move to attendance or remove from pending
Att->>Att : Update stats and table
```

**Diagram sources**
- [attendance.html](file://attendance.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

**Section sources**
- [attendance.html](file://attendance.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

### Worker-Specific Performance View
- Personal monthly filter displays attendance breakdown, average efficiency, and ranking among peers.
- Daily records show status badges, hours worked, and efficiency progress bars.
- Stats cards present total work days, attendance rate, average efficiency, and personal rank.

```mermaid
flowchart TD
WPStart(["Load Worker Performance"]) --> FilterWP["Filter by month/year"]
FilterWP --> StatsWP["Compute stats:<br/>present, late, absent, excused,<br/>attendance rate, avg efficiency"]
StatsWP --> RankWP["Rank among peers for month"]
RankWP --> BarsWP["Render last 10 daily efficiency bars"]
BarsWP --> RecordsWP["Render daily records table"]
```

**Diagram sources**
- [worker-performance.html](file://worker-performance.html)

**Section sources**
- [worker-performance.html](file://worker-performance.html)

### Salary Calculation and Work Days Tracking
- Work days are derived from performance logs where status indicates presence (present/late/approved).
- Paid leave days are calculated from approved permissions overlapping the selected month.
- Bonuses and penalties influence the final salary; existing records can be edited.

```mermaid
flowchart TD
SCStart(["Calculate Salaries"]) --> GetPerf["Get performance for month/year"]
GetPerf --> CountWD["Count work days (present/late/approved)"]
CountWD --> GetPerm["Get approved permissions for month"]
GetPerm --> LeaveDays["Sum paid leave days in month"]
LeaveDays --> BaseCalc["Base = workDays * dailySalary"]
BaseCalc --> Deduct["Deduct leaveDeduction = paidLeaveDays * dailySalary"]
Deduct --> BonusPenalty["Add bonus, subtract penalties"]
BonusPenalty --> Total["Total = Base + bonus - penalty - leaveDeduction"]
```

**Diagram sources**
- [salary.html](file://salary.html)

**Section sources**
- [salary.html](file://salary.html)

### Reporting and Trend Analysis
- Administrative reports support multiple types: attendance, salary, performance, penalties, and summary.
- Charts visualize monthly participation distribution and top performers by average efficiency.
- Export to CSV and print capabilities aid sharing and archival.

```mermaid
flowchart TD
RSel(["Select Report Type/Month/Year"]) --> Collect["Collect workers, performance, salaries, penalties, tasks"]
Collect --> Build["Build report rows per type"]
Build --> Stats["Aggregate totals and percentages"]
Stats --> Charts["Update pie/bar charts"]
Charts --> Render["Render table and top performers"]
```

**Diagram sources**
- [reports.html](file://reports.html)

**Section sources**
- [reports.html](file://reports.html)

## Dependency Analysis
- Pages depend on shared utilities for:
  - Authentication checks and redirection
  - Modal management, alerts, and UI helpers
  - Data accessors and formatters
- Data is centralized in localStorage with helper functions for CRUD-like operations.

```mermaid
graph LR
Perf["performance.html"] --> Auth["auth.js"]
Perf --> App["app.js"]
WPerf["worker-performance.html"] --> Auth
WPerf --> App
Att["attendance.html"] --> Auth
Att --> App
Sal["salary.html"] --> Auth
Sal --> App
Rep["reports.html"] --> Auth
Rep --> App
Auth --> Store["localStorage"]
App --> Store
```

**Diagram sources**
- [performance.html](file://performance.html)
- [worker-performance.html](file://worker-performance.html)
- [attendance.html](file://attendance.html)
- [salary.html](file://salary.html)
- [reports.html](file://reports.html)
- [auth.js](file://auth.js)
- [app.js](file://app.js)

**Section sources**
- [auth.js](file://auth.js)
- [app.js](file://app.js)
- [performance.html](file://performance.html)
- [worker-performance.html](file://worker-performance.html)
- [attendance.html](file://attendance.html)
- [salary.html](file://salary.html)
- [reports.html](file://reports.html)

## Performance Considerations
- Client-side filtering and sorting are efficient for small datasets; consider pagination or server-side processing for larger workloads.
- Rendering charts and tables dynamically can be optimized by debouncing filter changes and limiting DOM updates.
- Currency and date formatting are handled centrally to reduce duplication and improve consistency.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Authentication issues:
  - Ensure the current user is loaded from localStorage and roles are validated on page load.
- Data not persisting:
  - Verify localStorage keys exist and are initialized during login.
- Empty tables:
  - Confirm filters are not overly restrictive; clear filters to inspect raw data.
- Salary discrepancies:
  - Review performance statuses used for counting work days and permission overlaps for paid leave.

**Section sources**
- [auth.js](file://auth.js)
- [app.js](file://app.js)
- [performance.html](file://performance.html)
- [worker-performance.html](file://worker-performance.html)
- [attendance.html](file://attendance.html)
- [salary.html](file://salary.html)
- [reports.html](file://reports.html)

## Conclusion
The performance tracking system integrates attendance, performance logging, analytics, and salary computation through a cohesive client-side architecture. It enables administrators to manage attendance approvals and generate insightful reports while allowing workers to review personal performance metrics and monthly summaries. The modular design and shared utilities facilitate maintainability and future enhancements.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Data Model Overview
- Workers: id, name, position, dailySalary
- Tasks: id, title, description, assignedTo, status, priority, createdAt
- Performance: id, workerId, date, status, hoursWorked, efficiency, notes
- Salaries: id, workerId, month, year, workDays, dailySalary, baseSalary, bonus, penalty, leaveDeduction, total
- Penalties: id, workerId, date, amount, reason, note, status, timestamps
- Permissions: id, workerId, startDate, endDate, reason, type, status, timestamps
- ShiftChanges: id, requesterId, targetId, date, reason, status, timestamps

[No sources needed since this section provides general guidance]