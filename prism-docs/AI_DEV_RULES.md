# Prism Platform — AI Development Rules

## Purpose

This document defines the rules that AI assistants (Claude, Copilot, GPT, etc.) must follow when generating code for the Prism Platform.

These rules ensure the system remains maintainable, scalable, and consistent.

All AI-generated code must follow these constraints.

---

# Core Architecture Principle

Prism follows a **DATA-FIRST architecture**.

Operational data is the foundation of the platform.

Programs collect structured data which is stored in the database and later analyzed to generate dashboards and entity intelligence.

The architecture flow is:

Programs → Submissions → Database → Analytics → Dashboards → Intelligence

Dashboards are views of data.
They are not the primary system logic.

---

# Layer Responsibilities

## Frontend

Responsibilities:

* UI rendering
* form input handling
* API communication
* displaying analytics

Frontend must NOT perform heavy data processing.

The frontend must not contain complex aggregation logic.

---

## Backend

Responsibilities:

* business logic
* scoring calculations
* analytics queries
* validation
* submission processing
* notifications
* report generation

All operational logic must exist in backend services.

---

## Database

Responsibilities:

* storing structured operational data
* maintaining relationships between entities
* serving analytics queries

Database is the **source of truth**.

---

# File Size Rules

No file should exceed **500 lines**.

If a file approaches 400 lines it must be refactored into smaller modules.

Large files reduce maintainability and break AI code generation quality.

---

# Folder Structure Rules

All generated code must follow the official monorepo structure.

```text
apps
packages
modules
database
docs
scripts
```

AI must not create random top-level folders.

---

# Code Organization Rules

## UI Components

UI components must live inside:

```text
packages/ui
```

Examples:

StatCard
GlassPanel
ChartContainer
Sidebar
Modal
FormInput

UI components must be reusable.

---

## Backend Services

Business logic must live inside:

```text
modules
```

Examples:

program-engine
analytics-engine
entity-intelligence
reporting-engine

---

## API Routes

API routes must live inside:

```text
apps/api-server
```

Routes should remain thin.

Routes call service modules rather than implementing logic directly.

---

# Program Engine Rules

Programs represent operational processes such as:

* audits
* assessments
* inspections
* competitions
* surveys

Programs are generic.

They contain:

Sections
Questions
Responses
Submissions

Programs must be configurable through database definitions.

Operational logic must not be hardcoded.

---

# Question System Rules

Supported question types include:

text
number
yes/no
dropdown
multiple choice
rating
image upload
file upload
signature

Questions may support conditional logic.

Example:

Show Question B if Question A = "No".

Conditional logic must be stored in configuration rather than implemented directly in UI logic.

---

# Analytics Rules

Analytics must operate on structured submission data.

Analytics queries must be executed on the backend.

Frontend must only render aggregated results.

Example analytics dimensions:

company
region
store
manager
program
time period

---

# Entity Intelligence Rules

The system supports entity pages for:

Stores
Managers
Regions
Employees
Programs

Each entity page must display analytics derived from the submission dataset.

Entity pages must never run heavy queries in the frontend.

---

# Security Rules

All endpoints must enforce authentication.

Role-based permissions must be validated on the backend.

Roles include:

User
Admin
Editor

Permissions must be configurable through database tables.

---

# Offline Submission Rules

Checklist submissions must support offline mode.

Responses should be stored locally using IndexedDB.

When connectivity returns, submissions must automatically sync with the backend.

---

# API Design Rules

All API endpoints must follow REST conventions.

Example endpoints:

GET /programs
POST /programs
GET /submissions
POST /submissions

Responses must use JSON.

Errors must return structured error messages.

---

# UI Design Rules

The platform uses a **premium glassmorphism UI**.

Design characteristics:

* minimal interface
* glass surfaces
* smooth animations
* dark-first design
* strong typography

Frontend stack:

Next.js
Tailwind
ShadCN UI
Framer Motion
Recharts

Animations must remain subtle and fluid.

---

# Naming Conventions

Use clear and descriptive naming.

Examples:

ProgramSubmission
ProgramResponse
StoreHealthScore
ManagerPerformanceMetric

Avoid vague names such as:

data
item
object

---

# Development Workflow

All new features should follow this sequence:

1. Update documentation
2. Update database schema
3. Implement backend service
4. Create API endpoint
5. Implement frontend UI
6. Connect analytics

Skipping this order leads to unstable architecture.

---

# AI Code Generation Guidelines

When generating code, AI must:

* read documentation first
* respect the repository structure
* avoid creating oversized files
* keep modules isolated
* prefer configuration over hardcoding

If uncertain about architecture, AI should request clarification rather than invent new structures.

---

# Long-Term Vision

Prism is designed to evolve into a **Retail Operations Intelligence Platform**.

The system must remain flexible enough to support new operational programs without requiring major code changes.

Operational programs must be configurable rather than hardcoded.

---
