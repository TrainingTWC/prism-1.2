# Prism Platform — Repository Structure

## Overview

This document defines the official repository architecture for the Prism Platform.

The goal is to ensure:

* clean separation of concerns
* modular development
* maintainable codebase
* AI-assisted development compatibility
* scalability to multiple teams and modules

The architecture follows a **monorepo structure**.

---

# Monorepo Layout

```
prism-platform
│
├ apps
│  ├ web-app
│  ├ admin-panel
│  └ api-server
│
├ packages
│  ├ ui
│  ├ auth
│  ├ checklist-engine
│  ├ analytics-engine
│  ├ notification-service
│  └ task-engine
│
├ database
│  ├ schema
│  ├ migrations
│  └ seeds
│
├ modules
│  ├ program-engine
│  ├ entity-intelligence
│  ├ reporting-engine
│  └ file-storage
│
├ docs
│
└ scripts
```

---

# Apps Directory

The **apps** folder contains full runnable applications.

## web-app

Main platform interface used by operational users.

Contains:

* dashboards
* checklist submission
* entity intelligence pages
* task management
* reports
* notifications

Technology:

Next.js
React
TypeScript
Tailwind
ShadCN UI

---

## admin-panel

Admin control interface.

Contains:

* program builder
* employee manager
* role manager
* company settings
* dashboard configuration
* permissions control

---

## api-server

Backend service layer.

Responsible for:

* authentication
* data validation
* business logic
* analytics queries
* notifications
* report generation

Technology:

Node.js
Fastify

---

# Packages Directory

Reusable shared libraries.

These packages are used by multiple applications.

---

## ui

Shared UI components.

Examples:

StatCard
GlassPanel
Sidebar
ChartContainer
Modal
FormInput
FileUploader

Purpose:

Maintain consistent design across the platform.

---

## auth

Authentication and authorization utilities.

Features:

* JWT authentication
* role validation
* permission checking
* session management

---

## checklist-engine

Core program submission engine.

Handles:

* question rendering
* response validation
* scoring calculation
* offline storage
* submission syncing

---

## analytics-engine

Processes data for dashboards.

Responsibilities:

* score aggregation
* trend calculations
* entity analytics
* performance metrics

---

## notification-service

Handles notifications across channels.

Channels:

Email
WhatsApp
In-app

Responsible for:

* notification triggers
* delivery queues
* message templates

---

## task-engine

Handles operational follow-ups.

Features:

* task creation
* assignment
* status tracking
* due date management

---

# Database Directory

Contains database-related files.

---

## schema

Defines PostgreSQL schema.

Tables include:

Company
Store
Employee
Role
Program
Submission
Response
Task
Notification

---

## migrations

Database schema migrations.

Used for version-controlled database updates.

Example:

```
001_create_company_table.sql
002_create_store_table.sql
003_create_employee_table.sql
```

---

## seeds

Seed data for development environments.

Examples:

* sample companies
* sample stores
* test employees
* example programs

---

# Modules Directory

Contains platform-level modules.

Modules represent large functional subsystems.

---

## program-engine

Handles:

* program creation
* sections
* questions
* scoring configuration
* program lifecycle

---

## entity-intelligence

Generates entity-level insights.

Entities include:

Stores
Managers
Regions
Employees

Handles:

* entity analytics
* trend analysis
* intelligence page data

---

## reporting-engine

Responsible for report generation.

Supports:

PDF
Excel
CSV

Includes:

* report templates
* scheduled reports
* export services

---

## file-storage

Handles file uploads.

Supports:

* audit evidence photos
* attachments
* document storage

Recommended storage:

Supabase Storage

---

# Docs Directory

Contains product and engineering documentation.

Documents include:

PRD
Architecture
Database schema
API spec
Analytics engine
Checklist engine

These docs guide development and AI code generation.

---

# Scripts Directory

Utility scripts used during development.

Examples:

Database seed scripts
Data migration tools
Program import scripts
Backup scripts

---

# Code Organization Principles

## 1. Maximum File Size

Files should not exceed **400–500 lines**.

Large files must be split into smaller modules.

---

## 2. Separation of Concerns

Frontend must not contain heavy business logic.

Frontend responsibility:

* rendering UI
* handling user input
* calling APIs

Backend responsibility:

* calculations
* validations
* analytics queries

---

## 3. Module Isolation

Each module must operate independently.

Example:

Program Engine should not directly depend on Analytics Engine.

Communication should occur through service interfaces.

---

## 4. Configuration Over Hardcoding

Operational logic should be stored in configuration tables rather than code.

Examples:

Program definitions
Dashboard layouts
Scoring rules

---

## 5. AI-Friendly Development

To ensure Copilot and AI tools perform well:

* keep files small
* maintain clear naming
* document modules
* maintain consistent folder structure

---

# Recommended Development Workflow

1. Define feature in documentation
2. Create backend service
3. Create API endpoints
4. Implement frontend UI
5. Connect analytics
6. Test with sample data

---

# Long-Term Scalability

The architecture supports:

* 5000+ users
* multiple companies
* multiple operational programs
* large operational datasets

The system is designed to evolve into a **Retail Operations Intelligence Platform**.

---
