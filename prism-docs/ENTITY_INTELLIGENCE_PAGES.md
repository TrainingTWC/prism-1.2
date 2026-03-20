# Prism Platform — Entity Intelligence Pages

## Overview

Entity pages provide operational insights for key organizational entities.

Entities include:

Stores
Managers
Regions
Employees
Programs

These pages act as operational intelligence dashboards.

---

## Store Intelligence Page

Route:

/stores/{store_id}

### Sections

Store Header
Store Health Score
Performance Trend
Program Performance
Recent Submissions
Recurring Issues
Open Tasks
Evidence Gallery

---

### Store Health Score

Composite score derived from multiple programs.

Example:

StoreHealth =
0.35 * QA Audit
0.25 * Operations Audit
0.20 * Training Audit
0.20 * HR Compliance

Admin can configure scoring weights.

---

### Performance Trend

Shows historical store performance.

Typical time ranges:

30 days
90 days
6 months
1 year

---

### Program Breakdown

Displays program-level performance.

Example table:

Program | Score | Trend
QA Audit | 85 | ↑
Training Audit | 90 | →
Operations Audit | 78 | ↓

---

### Recurring Issues

Derived from submission responses and comments.

Displays most frequent operational problems.

Example:

Milk steaming inconsistency
Dial-in calibration errors
Cleaning SOP failures

---

## Manager Intelligence Page

Route:

/managers/{manager_id}

Displays performance across stores under a manager.

Sections:

Manager Overview
Manager Effectiveness Score
Store Distribution
Program Performance
Performance Trend

---

## Region Intelligence Page

Route:

/regions/{region_id}

Displays performance across stores within a region.

Sections:

Regional Health Score
Top Performing Stores
Risk Stores
Program Breakdown
Trend Analysis

---

## Employee Intelligence Page

Route:

/employees/{employee_id}

Displays:

* submissions performed
* tasks assigned
* program involvement
* performance metrics

---

## Program Intelligence Page

Route:

/programs/{program_id}

Displays analytics for a specific program.

Sections:

Total Submissions
Average Score
Store Comparison
Regional Comparison
Trend Analysis

---
