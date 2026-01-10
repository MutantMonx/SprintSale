# SprintSale

> 🚗 Car listing aggregator with browser automation, real-time notifications, and cross-platform support

**Created by monx**

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### One-Command Deployment

```bash
# 1. Clone and configure
git clone https://github.com/MutantMonx/SprintSale.git
cd SprintSale
cp .env.example .env
# Edit .env with your secrets

# 2. Start all services
docker compose up -d

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api
# Health check: http://localhost:4000/api/health
```

### Default Admin Credentials

- **Email:** <admin@sprintsale.local>
- **Password:** ChangeMe123!

> ⚠️ Change these immediately after first login!

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    React 18 + Vite                          │
│                     (Port 3000)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│                 Express.js + TypeScript                     │
│                     (Port 4000)                             │
├─────────────────────────────────────────────────────────────┤
│  • JWT Authentication    • Service Management               │
│  • Search Configs        • Notifications                    │
│  • WebSocket (Socket.IO) • Rate Limiting                   │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                    ▼                    ▼
┌─────────────────────────┐  ┌─────────────────────────────────┐
│      PostgreSQL         │  │           Redis                 │
│    (Port 5432)          │  │        (Port 6379)              │
│  • Users & Auth         │  │  • Session Cache                │
│  • Services & Workflows │  │  • Job Queue (Bull)             │
│  • Listings & Notifs    │  │  • Rate Limiting                │
└─────────────────────────┘  └─────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Scraping Worker                          │
│                 Playwright + Chromium                       │
│  • Workflow Execution   • Listing Detection                 │
│  • Anti-Bot Measures    • Real-time Notifications          │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
SprintSale/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── config/          # Environment & database config
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── schemas/         # Zod validation schemas
│   │   └── index.ts         # Server entry point
│   └── prisma/
│       ├── schema.prisma    # Database models
│       └── seed.ts          # Initial data seeding
├── frontend/                # React application (pending)
├── mobile/                  # React Native app (pending)
├── Dockerfile.backend       # Backend container
├── Dockerfile.frontend      # Frontend container
├── Dockerfile.worker        # Scraping worker container
├── docker-compose.yml       # Full stack deployment
├── nginx.conf               # Frontend reverse proxy
└── .env.example             # Environment template
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List available car platforms |
| POST | `/api/services/:id/subscribe` | Subscribe to service |
| POST | `/api/services/:id/credentials` | Store login credentials |

### Search Configurations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search-configs` | List user's searches |
| POST | `/api/search-configs` | Create new search |
| PATCH | `/api/search-configs/:id/toggle` | Enable/disable |
| POST | `/api/search-configs/:id/run` | Manual trigger |

### Listings & Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | List detected listings |
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/unread-count` | Get unread count |

---

## Development

### Backend Development

```bash
cd backend
cp .env.example .env
npm install
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed initial data
npm run dev          # Start dev server
```

### Run Tests

```bash
npm test
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js 20, Express.js, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| Cache/Queue | Redis, Bull |
| Browser Automation | Playwright |
| Frontend | React 18, Vite, TailwindCSS |
| Mobile | React Native, Expo |
| Container | Docker, Docker Compose |

---

## Security Features

- **JWT Authentication** with short-lived access tokens (15m) and refresh tokens (7d)
- **AES-256-GCM Encryption** for stored service credentials
- **Rate Limiting** on auth endpoints (10 attempts / 15 min)
- **Helmet.js** security headers
- **Non-root Docker containers**
- **GDPR-ready** soft delete for user data

---

## License

MIT © monx
