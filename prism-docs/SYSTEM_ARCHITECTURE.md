# Prism Platform — System Architecture

## Architecture Philosophy

Prism follows a **data-first architecture**.

The system is built around structured operational data rather than dashboards.

Dashboards and reports are views generated from the underlying data platform.

---

## Core Architecture Layers

### 1. Frontend Layer

Responsible for:

* UI rendering
* user interactions
* program submissions
* dashboards
* entity pages

Technologies:

Next.js
React
TypeScript
Tailwind
ShadCN UI
Framer Motion

---

### 2. API Layer

Handles:

* data validation
* business logic
* authentication
* aggregation queries

Technologies:

Node.js
Fastify

---

### 3. Service Layer

Contains platform services.

Examples:

Program Service
Submission Service
Analytics Service
Task Service
Notification Service

---

### 4. Data Layer

Primary storage.

Technology:

PostgreSQL

Stores:

* employee master
* stores
* submissions
* responses
* tasks
* program definitions

---

### 5. Storage Layer

Stores files.

Examples:

* audit photos
* attachments
* evidence images

Technology:

Supabase Storage

---

### 6. Notification Layer

Channels:

Email → Resend
WhatsApp → Meta Cloud API
In-app → Websocket / Firebase

---

## Deployment Architecture

Frontend

Vercel

Backend

Railway / Render

Database

Supabase PostgreSQL

Storage

Supabase Storage

---

## Monorepo Structure

```
prism-platform
│
├ apps
│ ├ web-app
│ ├ admin-panel
│ └ api-server
│
├ packages
│ ├ ui
│ ├ checklist-engine
│ ├ analytics-engine
│ ├ auth
│ └ notification-service
│
├ database
│ ├ schema
│ └ migrations
│
└ docs
```

---
