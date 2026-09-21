# Buywalkin - Marketplace Booking Platform

A production-ready booking platform where customers can discover and book services from local businesses.

## Features

- **Customer**: Browse services, check availability, book appointments, manage bookings
- **Business Owner**: Create business, manage services, set operating hours, view bookings
- **Real-time Availability**: Dynamic slot generation based on operating hours and duration
- **Concurrency Protection**: Database-level unique constraints prevent double bookings
- **Authentication**: JWT-based auth with role-based access control (RBAC)
- **Responsive UI**: Modern gradient design with dark mode support

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with Passport

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL running on localhost:5432
- pnpm (or npm)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and set your DATABASE_URL and JWT_SECRET

# 3. Run database migrations
cd apps/api
npx prisma migrate deploy
npx prisma generate

# 4. Seed database with test data
npx tsx prisma/seed.ts

# 5. Start backend (in apps/api)
npx nest start --watch

# 6. Start frontend (in apps/web, new terminal)
cd apps/web
npm run dev
```

### Access

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000/api/v1
- **Swagger Docs**: http://localhost:4000/api/docs

### Test Credentials

- **Customer**: customer@example.com / Password123!
- **Business Owner**: owner@example.com / Password123!

## Architecture

### Database Schema

**Core Models:**
- `User` - Authentication and role management (CUSTOMER | BUSINESS_OWNER)
- `Business` - One per owner, has operating hours and services
- `Service` - Offered by business, has price and duration
- `OperatingHour` - Weekly schedule (day, opening/closing time)
- `Booking` - Links customer to service with time slot and status

**Key Constraints:**
- `User.email` - Unique
- `Business.ownerId` - Unique (one business per owner)
- `OperatingHour(businessId, dayOfWeek)` - Unique
- `Booking(serviceId, startTime)` - **Unique (prevents double booking)**

### Design Decisions

#### 1. Concurrency-Safe Booking
**Problem**: Multiple customers booking the same slot simultaneously.

**Solution**: Database unique constraint on `(serviceId, startTime)` + Prisma transaction.
- Application validates slot availability
- Database enforces uniqueness as final authority
- Concurrent requests: one succeeds (201), others fail (409 Conflict)

#### 2. Availability Calculation
**Approach**: Dynamic generation, not pre-stored slots.
- Query operating hours for selected date
- Generate slots based on service duration
- Mark slots with confirmed bookings as unavailable
- Efficient: no slot storage, always accurate

#### 3. One Business Per Owner
**Rationale**: Simplifies ownership model and authorization.
- `Business.ownerId` is unique
- Owner can only manage their own business
- Clear ownership boundaries

#### 4. Cancelled Bookings
**Design**: Status change, not deletion.
- Booking status changes to CANCELLED
- Original slot remains in database (due to unique constraint)
- Trade-off: Simpler implementation vs. slot reuse complexity
- Alternative: Use partial unique index excluding CANCELLED status

#### 5. Authentication & Authorization
**JWT Strategy**:
- Stateless authentication
- Role-based guards (CUSTOMER, BUSINESS_OWNER)
- Ownership verification (users can only modify their own resources)
- User loaded from DB on each request (not just from token)

#### 6. API Design
**RESTful with clear separation**:
- `/auth/*` - Authentication
- `/businesses/me/*` - Owner's business management
- `/services/*` - Public service browsing + owner CRUD
- `/bookings/*` - Customer bookings
- `/services/:id/availability` - Real-time availability

## Project Structure

```
apps/
  api/                    # NestJS backend
    src/
      auth/              # JWT authentication
      businesses/        # Business management
      services/          # Service CRUD
      availability/      # Slot generation
      bookings/          # Booking logic
      common/            # Guards, decorators, interfaces
    prisma/
      schema.prisma      # Database schema
      migrations/        # Migration history
      seed.ts           # Test data
  
  web/                   # Next.js frontend
    app/                 # App router pages
    components/          # Shared components
    contexts/            # Auth context
    lib/                 # API client
```

## Database Migrations

Migrations are in `apps/api/prisma/migrations/`.

**To create new migration:**
```bash
cd apps/api
npx prisma migrate dev --name description
```

**To apply migrations:**
```bash
npx prisma migrate deploy
```

**To reset database (dev only):**
```bash
npx prisma migrate reset
```

## Testing

```bash
cd apps/api

# Run all tests
npm run test:e2e

# Run specific test
npx jest --config ./test/jest-e2e.json bookings.e2e-spec.ts
```

**Test Coverage:**
- Authentication (11 tests)
- Authorization (16 tests)
- Availability (7 tests)
- Booking validation (7 tests)
- Concurrency (2 tests - critical)
- Cancellation (5 tests)

## Production Deployment

1. Set strong `JWT_SECRET` (min 32 characters)
2. Use production PostgreSQL instance
3. Run migrations: `npx prisma migrate deploy`
4. Build frontend: `npm run build`
5. Build backend: `npx nest build`
6. Set `NODE_ENV=production`
