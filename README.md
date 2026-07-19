# Path Wounded — Full-Stack Logistics Platform

A full-stack freight operations platform with a React + Vite frontend, Node.js + Express + Prisma backend, PostgreSQL database, and real-time dashboard.

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, Axios, Recharts, Framer Motion, Lottie React

**Backend:** Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, JWT (access + refresh), Zod validation, bcrypt, Pino logging, Swagger UI

## Project Structure

```
Path-Wounded/
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── api/       # Axios client, API functions
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/     # React Query hooks, auth bootstrap
│   │   ├── pages/     # Landing, auth, dashboard pages
│   │   ├── context/   # Zustand auth store
│   │   ├── types/     # TypeScript interfaces
│   │   └── lib/       # Query client, formatters
│   ├── vite.config.ts
│   └── package.json
│
├── backend/           # Express + Prisma API
│   ├── src/
│   │   ├── modules/   # 12 feature modules (auth, orders, carriers, etc.)
│   │   ├── middleware/ # Auth, validation, error handling, rate limiting
│   │   ├── config/    # Env, database, constants
│   │   └── utils/     # Logger, email, S3, crypto, pagination
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend
cp .env.example .env        # Configure your env vars
npm install
npx prisma db push           # Push schema to database
npx prisma db seed           # Seed sample data
npm run dev                  # Start on port 3000
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env         # Configure API URL
npm install
npm run dev                  # Start on port 5173
```

### Seed Login

| Email | Password | Role |
|---|---|---|
| admin@pathwounded.com | Admin@123 | admin |
| sarah@freightco.com | Admin@123 | broker |
| mike@shipfast.com | Admin@123 | broker |

## API Documentation

Once running, visit **http://localhost:3000/api/docs** for interactive Swagger UI docs.

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Set **Root Directory** to `frontend`
4. Set environment variable: `VITE_API_BASE_URL` = your deployed backend URL + `/api/v1`
5. Deploy

### Backend

Deploy to any Node.js host (Railway, Render, Fly.io, etc.). Set the environment variables from `backend/.env.example`.

## License

MIT
