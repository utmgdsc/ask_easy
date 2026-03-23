# AskEasy

A real-time classroom Q&A platform that makes it easy for students to ask questions during lectures — and for instructors to keep the conversation organized. Built for the University of Toronto with Shibboleth (UTORid) authentication.

## The Problem

In large lecture halls, many students hesitate to raise their hand or wait for a microphone. Questions go unasked, concepts stay unclear, and instructors lose visibility into what the class is struggling with. Existing tools like Piazza are designed for asynchronous discussion, not live, in-lecture interaction.

## The Solution

AskEasy gives every lecture a live Q&A room where students can post questions (anonymously if they prefer), upvote the most pressing ones, and get answers from instructors or peers — all in real time via WebSockets. Professors and TAs see what the class needs help with *right now*, and can present slides side-by-side with the chat.

## Features

- **Real-time Q&A** — Questions, answers, and upvotes update instantly via Socket.IO with Redis pub/sub
- **Role-based access** — Professors, TAs, and Students each see what's relevant to them; TAs are assigned per-course
- **Anonymous posting** — Students can ask questions and post answers anonymously
- **Upvoting** — The most important questions and best answers rise to the top
- **Slide viewer** — Professors can upload PDFs and present slides alongside the live chat in a resizable split view
- **Join codes** — Students join a session with a short code, no enrollment setup needed
- **Question filtering** — Filter by status (open, answered, resolved) and visibility (public, instructor-only)
- **Chat history export** — Professors can download the full Q&A transcript as a `.txt` file when ending a session
- **Course management** — Create courses, manage enrollments, start/schedule/end sessions
- **Shibboleth SSO** — Authenticates via UofT's identity provider; instructor whitelist controls professor access

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Radix UI |
| Backend | Next.js API routes + custom Node.js HTTP server |
| Real-time | Socket.IO with Redis adapter |
| Database | PostgreSQL 16 (via Prisma ORM) |
| Cache / Pub-sub | Redis 7 |
| Auth | iron-session + Shibboleth header-based SSO |
| Testing | Vitest, Testing Library |
| Containerization | Docker & Docker Compose |

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v8+
- [Docker](https://www.docker.com/) and Docker Compose

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/jadenScali/ask_easy.git
cd ask_easy
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

For native development (`pnpm dev`), also create `.env.local` and point hosts at `localhost`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ask_easy
REDIS_URL=redis://:changeme@localhost:6379
```

| File | Used by | Hosts |
|------|---------|-------|
| `.env` | Docker Compose | `@postgres`, `@redis` (service names) |
| `.env.local` | `pnpm dev` | `@localhost` |

### 3. Start services

**Option A — Full stack (app + database + Redis):**

```bash
docker-compose up
```

Open [http://localhost:3000](http://localhost:3000).

**Option B — Database & Redis only (for local dev):**

```bash
docker-compose up -d postgres redis
pnpm db:setup   # generate Prisma client + push schema
pnpm db:seed    # seed sample data (prints test URLs)
pnpm dev
```

After seeding, the terminal prints URLs for each test role (professor, TA, student). Open them in separate tabs to simulate a live session.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:integration` | Run integration tests |
| `pnpm db:setup` | Generate Prisma client + push schema |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio GUI |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── api/              # REST endpoints (auth, courses, sessions, questions)
│   ├── classes/          # Course listing & management UI
│   ├── create-class/     # Course creation flow
│   └── room/             # Live session room (chat + slide viewer)
├── components/ui/        # Shared UI components (Radix-based)
├── lib/                  # Server utilities (auth, caching, validation, Prisma)
├── socket/               # Socket.IO server setup, handlers, and middleware
├── services/             # Business logic services
└── utils/                # Shared types and helpers
prisma/
├── schema.prisma         # Database schema
├── migrations/           # Migration history
└── seed.ts               # Development seed data
```

## Team

Built by the AskEasy team at **GDG on Campus — UTM** (University of Toronto Mississauga).

- **Jaden Scali** — Project Lead
