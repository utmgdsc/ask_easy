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

| File         | Used by        | Host values                           |
| ------------ | -------------- | ------------------------------------- |
| `.env`       | Docker Compose | `@postgres`, `@redis` (service names) |
| `.env.local` | `pnpm dev`     | `@localhost`                          |

### 3. Start services with Docker Compose

**Option A: Full stack (app + database + redis)**

```bash
docker-compose up # FOR ALL 3
```

Access the app at [http://localhost:3000](http://localhost:3000)

**Option B: Services only (for native development)**

```bash
docker-compose up -d postgres redis
```

Copy env and point DB/Redis at localhost (for `pnpm dev`):

```bash
cp .env.example .env
# Edit .env: use host "localhost" for DATABASE_URL and REDIS_URL
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ask_easy
#   REDIS_URL=redis://localhost:6379
```

Generate Prisma client, push schema, and seed:

```bash
pnpm db:setup
pnpm db:seed
```

Then run the dev server:

```bash
pnpm dev
```

After seeding, the terminal prints localhost URLs for each role. You can also use:

| Page | URL |
|------|-----|
| **All classes** | [http://localhost:3000/classes](http://localhost:3000/classes) |
| **Room (role in query)** | `http://localhost:3000/?sessionId=<SESSION_ID>&userId=<USER_ID>&role=<role>` |

**Open as different roles (use IDs from seed output):**

- **Professor** — `http://localhost:3000/?sessionId=<SESSION_ID>&userId=<PROFESSOR_USER_ID>&role=professor`
- **TA** — `http://localhost:3000/?sessionId=<SESSION_ID>&userId=<TA_USER_ID>&role=ta`
- **Student** — `http://localhost:3000/?sessionId=<SESSION_ID>&userId=<STUDENT_USER_ID>&role=student`
- **Student 2** — `http://localhost:3000/?sessionId=<SESSION_ID>&userId=<STUDENT2_USER_ID>&role=student`

Run `pnpm db:seed` once; at the end it prints the exact URLs for professor, TA, student, and student 2. Copy those into your browser to open each role. To open all four at once, run the seed, copy the four printed URLs into separate tabs or windows.

## Available Scripts

| Script             | Description                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Start development server                          |
| `pnpm build`       | Build for production                              |
| `pnpm start`       | Start production server                           |
| `pnpm typecheck`   | Run TypeScript type checking                      |
| `pnpm lint`        | Run ESLint                                        |
| `pnpm lint:fix`    | Fix ESLint issues                                 |
| `pnpm format`      | Format code with Prettier                         |
| `pnpm test`        | Run tests with Vitest                             |
| `pnpm db:generate` | Generate Prisma client                            |
| `pnpm db:push`     | Push schema to database                           |
| `pnpm db:migrate`  | Run database migrations                           |
| `pnpm db:setup`    | Generate client + push schema (for initial setup) |
| `pnpm db:seed`     | Seed database (prints localhost URLs per role)    |
| `pnpm db:studio`   | Open Prisma Studio                                |

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
