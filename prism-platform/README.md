# Prism Platform

Multi-tenant operational intelligence platform for analyzing store, manager, and regional performance.

## Tech Stack

| Layer        | Technology                            |
| ------------ | ------------------------------------- |
| Frontend     | Next.js, React, Tailwind, ShadCN UI  |
| Backend      | Node.js, Fastify                      |
| Database     | PostgreSQL (Supabase)                 |
| Storage      | Supabase Storage                      |
| Notifications| Resend (Email), Meta Cloud (WhatsApp) |

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Run database migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start all apps in development
pnpm dev
```

### Individual Apps

```bash
# Web app (port 3000)
pnpm dev:web

# Admin panel (port 3001)
pnpm dev:admin

# API server (port 4000)
pnpm dev:api
```

## Repository Structure

```
prism-platform/
├── apps/
│   ├── web-app/         # Main platform UI
│   ├── admin-panel/     # Admin control interface
│   └── api-server/      # Fastify backend
├── packages/
│   ├── ui/              # Shared UI components
│   ├── auth/            # Authentication utilities
│   ├── checklist-engine/# Program submission engine
│   ├── analytics-engine/# Analytics processing
│   ├── notification-service/ # Notification handling
│   └── task-engine/     # Task management
├── modules/
│   ├── program-engine/  # Program builder logic
│   ├── entity-intelligence/ # Entity analytics
│   ├── reporting-engine/# Report generation
│   └── file-storage/    # File upload handling
├── database/
│   ├── schema/          # SQL schema definitions
│   ├── migrations/      # Version-controlled migrations
│   └── seeds/           # Development seed data
├── docs/                # Documentation
└── scripts/             # Utility scripts
```

## Development Rules

1. Data-first architecture — dashboards derive from structured data
2. Business logic lives in backend services
3. Frontend handles only UI and API calls
4. No file exceeds 400–500 lines
5. Modular monorepo structure
6. No hardcoded operational logic
7. All code in TypeScript
