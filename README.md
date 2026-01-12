This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Workflow

Please only use names from the assigned board, make a new ticket if needed.

```bash
git checkout -b NAME_NUM
```

Run the development server WHILE you write code:

```bash
pnpm dev
```

Once you think everything is all good test in the prod env locally by using

```bash
docker run -p 3000:3000 ask_easy
```

this will create a docker image and forward the 3000 port of the image to your computers 3000 port.

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

feat: add JWT-based authentication
fix: handle null user response from database
docs: update setup instructions for local development
refactor: extract validation logic into helper
test: add unit tests for login endpoint
chore: bump next.js from 14.0.2 to 14.1.0
perf: reduce API response time by memoizing queries
ci: add lint and test workflow

Please do not make up your own <types> (unless you asked the team first sometimes this is needed but rarely) use one of the <types> in he above examples.
