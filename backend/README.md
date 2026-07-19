# Path Wounded — Backend API

Production-grade REST API for a logistics/freight operations dashboard.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (access + refresh tokens) + bcrypt
- **Validation:** Zod
- **Logging:** Pino

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- (Optional) Redis for rate limiting

### Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env   # or edit .env directly

# Create the database
createdb path_wounded

# Run Prisma migrations
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed the database with sample data
npm run db:seed

# Start the dev server
npm run dev
```

The server starts at `http://localhost:3000`.

### Seed Data

After seeding, you can log in with:

| Email                    | Password  | Role     |
| ------------------------ | --------- | -------- |
| admin@pathwounded.com    | Admin@123 | admin    |
| sarah@freightco.com      | Admin@123 | broker   |
| mike@shipfast.com        | Admin@123 | broker   |
| lisa@dispatch.io         | Admin@123 | dispatcher |

The seed script creates:
- 5 users (admin, 2 brokers, 1 dispatcher, 1 viewer)
- 10 carriers with realistic names/locations
- 25+ vehicles across all carriers
- 50 orders in various statuses (pending, assigned, in_transit, delivered, cancelled)
- 25 invoices (paid, unpaid, overdue)
- Reviews, partners, and notifications

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint                 | Description              | Auth |
| ------ | ------------------------ | ------------------------ | ---- |
| POST   | `/auth/signup`           | Register a new account   | No   |
| POST   | `/auth/login`            | Log in, get tokens       | No   |
| POST   | `/auth/refresh`          | Rotate refresh token     | No   |
| POST   | `/auth/logout`           | Revoke refresh token     | No   |
| POST   | `/auth/verify-email`     | Verify email address     | No   |
| POST   | `/auth/forgot-password`  | Request password reset   | No   |
| POST   | `/auth/reset-password`   | Reset password           | No   |
| GET    | `/auth/me`               | Get current user profile | Yes  |

### Orders

| Method | Endpoint             | Description                   |
| ------ | -------------------- | ----------------------------- |
| GET    | `/orders`            | List orders (paginated)       |
| GET    | `/orders/stats`      | Dashboard statistics          |
| GET    | `/orders/:id`        | Get order details             |
| POST   | `/orders`            | Create order                  |
| PATCH  | `/orders/:id`        | Update order/status           |
| POST   | `/orders/:id/cancel` | Cancel order                  |

### Carriers

| Method | Endpoint                  | Description               |
| ------ | ------------------------- | ------------------------- |
| GET    | `/carriers`               | List carriers             |
| GET    | `/carriers/top`           | Top carriers by rating    |
| GET    | `/carriers/:id`           | Carrier detail + reviews  |
| POST   | `/carriers`               | Create carrier (admin)    |
| PATCH  | `/carriers/:id`           | Update carrier (admin)    |
| POST   | `/carriers/:id/reviews`   | Create review             |
| GET    | `/carriers/:id/reviews`   | List reviews              |

### Vehicles

| Method | Endpoint                        | Description            |
| ------ | ------------------------------- | ---------------------- |
| GET    | `/vehicles/breakdown`           | Vehicle type breakdown |
| GET    | `/vehicles/carrier/:carrierId`  | List vehicles          |
| GET    | `/vehicles/:id`                 | Get vehicle            |
| POST   | `/vehicles/carrier/:carrierId`  | Add vehicle            |
| PATCH  | `/vehicles/:id`                 | Update vehicle         |
| DELETE | `/vehicles/:id`                 | Remove vehicle         |

### Invoices

| Method | Endpoint                 | Description            |
| ------ | ------------------------ | ---------------------- |
| GET    | `/invoices`              | List invoices          |
| GET    | `/invoices/:id`          | Get invoice            |
| POST   | `/invoices`              | Create invoice         |
| POST   | `/invoices/:id/mark-paid` | Mark as paid           |
| POST   | `/invoices/detect-overdue` | Detect overdue         |

### Analytics

| Method | Endpoint                          | Description                |
| ------ | --------------------------------- | -------------------------- |
| GET    | `/analytics/overview`             | Dashboard overview stats   |
| GET    | `/analytics/revenue?range=30d`    | Revenue over time          |
| GET    | `/analytics/vehicle-breakdown`    | Vehicle type breakdown     |
| GET    | `/analytics/order-status-breakdown` | Order status breakdown  |

### Other Modules

| Method | Endpoint                    | Description          |
| ------ | --------------------------- | -------------------- |
| GET    | `/messages/threads`         | List message threads |
| GET    | `/messages/threads/:id`     | Get thread           |
| POST   | `/messages`                 | Send message         |
| GET    | `/messages/unread-count`    | Unread count         |
| GET    | `/notifications`            | List notifications   |
| GET    | `/notifications/unread-count` | Unread count       |
| GET    | `/automations`              | List automations     |
| POST   | `/automations`              | Create automation    |
| GET    | `/reporting/carriers`       | Carrier performance  |
| GET    | `/reporting/carriers/export` | CSV export           |

## Project Structure

```
src/
  config/          — Environment, database, constants
  middleware/       — Auth guard, RBAC, rate limiter, error handler, validator
  modules/
    auth/          — Signup, login, refresh, logout, password reset, email verify
    users/         — Profile, avatar, change password
    orders/        — CRUD, status transitions, stats
    carriers/      — CRUD, top carriers, reviews
    vehicles/      — CRUD, type breakdown
    invoices/      — CRUD, mark paid, overdue detection
    partners/      — CRUD
    messages/      — Threaded messaging, unread count
    automations/   — CRUD trigger/action rules
    notifications/ — CRUD, unread count
    analytics/     — Overview, revenue, vehicle/status breakdowns
    reporting/     — Carrier performance, CSV export
  utils/           — Logger, response helpers, pagination, email, S3, crypto
  prisma/          — Schema
  app.ts           — Express app setup
  server.ts        — Server entry point
```

## Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": { "email": ["Invalid email"] }
  }
}
```

## Environment Variables

See `.env` for all configuration options. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — Token signing secrets
- `SMTP_*` — Email configuration (optional, logs to console if not set)
- `S3_*` — File storage (optional)
- `PORT` — Server port (default: 3000)
- `CORS_ORIGIN` — Frontend URL for CORS
