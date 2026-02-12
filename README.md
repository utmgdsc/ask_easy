# Ask Easy

A Next.js application with PostgreSQL and Redis.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v8+
- [Docker](https://www.docker.com/) and Docker Compose

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd ask_easy
pnpm install
```

> **Note:** `pnpm install` will automatically run `prisma generate` via the postinstall script to generate the Prisma client.

### 2. Set up environment variables

```bash
# For Docker Compose
cp .env.example .env

# For native development (pnpm dev) - edit to use localhost
cp .env.example .env.local
# Then change @postgres to @localhost and @redis to @localhost in .env.local
```

| File | Used by | Host values |
|------|---------|-------------|
| `.env` | Docker Compose | `@postgres`, `@redis` (service names) |
| `.env.local` | `pnpm dev` | `@localhost` |

### 3. Start services with Docker Compose

**Option A: Full stack (app + database + redis)**

```bash
docker-compose up # FOR ALL 3
```

Access the app at [http://localhost:3000](http://localhost:3000)

**Option B: Services only (for native development)**

```bash
docker-compose up postgres redis
```

Then run the development server:

```bash
pnpm dev
```

### 4. Set up the database

Generate Prisma client and push schema:

```bash
pnpm db:setup
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint issues |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run tests with Vitest |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:setup` | Generate client + push schema (for initial setup) |
| `pnpm db:studio` | Open Prisma Studio |

## Docker Commands

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# Rebuild the app image
docker-compose build app
```

---

## Workflow

Please only use names from the assigned board, make a new ticket if needed.

```bash
git checkout main
git pull
git checkout -b NAME_NUM
```

Run the development server WHILE you write code:

```bash
pnpm dev
```

Once you think everything is all good test in the prod env locally by using

```bash
docker-compose up
```

This will start the app, PostgreSQL, and Redis containers. Access the app at http://localhost:3000.

Commit as you go, you MUST use CONVENTIONAL COMMITS (see bottom for conventional commit cheat sheet):

```bash
git add -A
git commit -m "feat: add "
git push
```

Once a task (branch) is completed send a PR to main. Do so through github DO NOT MERGE TO MAIN LOCALLY THEN PUSH.
If you need help with this just shoot me (Jaden) a text.

## Conventional Commit Cheat Sheet

A conventional commit message follows the following criteria,

1. Is of the form <type>(optional scope): <short description>
2. Uses present tense, ex. add (good) but added (bad)
3. Describes one change not many if needed break into multiple commits each with one idea captured

The following are examples of amazing conventional commit messages:

```bash
feat: add JWT-based authentication
fix: handle null user response from database
docs: update setup instructions for local development
refactor: extract validation logic into helper
test: add unit tests for login endpoint
chore: bump next.js from 14.0.2 to 14.1.0
perf: reduce API response time by memoizing queries
ci: add lint and test workflow
```

Please do not make up your own <types> (unless you asked the team first sometimes this is needed but rarely) use one of the <types> in the above examples.
