# Household HQ

One place for household projects, tasks, home assets, maintenance, and costs — the "Phase 1" bones described
in the Household HQ design doc: Dashboard, Projects, Tasks, Expenses, Assets, Maintenance, and Service History,
wired together so a project rolls up its tasks and spend, and an asset rolls up its maintenance schedule,
service history, and cost.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + TypeScript + Tailwind CSS
- **Prisma 7** + SQLite (via the `better-sqlite3` driver adapter) for local, file-based storage — no external
  database to stand up
- Photos, manuals, warranties, and receipts are expected to live in **Google Drive**; the app stores a label +
  link to each, not the file itself (see "Attachments" below)

## Data model

Six connected entities (`prisma/schema.prisma`):

| Entity | Purpose |
| --- | --- |
| `Project` | Larger household projects (budget, priority, status, due date) |
| `Task` | Individual to-dos, optionally attached to a project |
| `Expense` | Every purchase, linkable to a project, task, asset, or service record |
| `Asset` | Appliances/equipment (location, manufacturer, model/serial, warranty) |
| `MaintenanceSchedule` | Recurring service per asset (interval, last/next due date) |
| `ServiceRecord` | Completed maintenance or ad-hoc repair history |
| `Attachment` | A label + URL (typically a Google Drive link) for docs/photos |

Completing a maintenance schedule (`completeService` in `src/lib/actions/maintenance.ts`) logs a
`ServiceRecord`, optionally creates a linked `Expense` when a cost is given, and rolls `nextDueDate` forward
from the completed service date using the schedule's interval.

## Getting started

```bash
npm install            # also runs `prisma generate`
npx prisma migrate dev # creates dev.db and applies the schema
npm run seed           # optional: loads sample data (a fridge, furnace, dishwasher repair,
                        # a basement-flooring project, a few tasks)
npm run dev
```

Open http://localhost:3100 (or whatever port you pass to `next dev`).

No `.env` is required for local use — `prisma.config.ts` and `src/lib/db.ts` default `DATABASE_URL` to
`file:./dev.db`. Set `DATABASE_URL` yourself to point at a different SQLite file if you want.

## Pages

- **`/`** — Dashboard: overdue tasks, due-soon tasks, high-priority tasks, upcoming maintenance, active
  projects with budget/spend/remaining, and quick-add links for a task/project/asset/expense.
- **`/projects`, `/projects/[id]`** — project list and detail, with nested tasks, expenses, and Drive-linked
  attachments. Budget, spend, and remaining are computed from linked expenses.
- **`/tasks`** — all tasks with status/priority filters; supports standalone tasks with no project.
- **`/assets`, `/assets/[id]`** — asset database grouped by location; detail view has maintenance schedules,
  service history, a "Find a part" search (builds a web search from manufacturer + model + the part you
  describe), linked expenses, and Drive-linked manuals/photos.
- **`/maintenance`** — every maintenance schedule across all assets, split into overdue vs. upcoming.
- **`/expenses`** — the full expense ledger, optionally linked to a project or asset.

## Deploying to Railway

This app keeps SQLite in production, so it needs a host with a persistent disk — Railway's volumes cover that
with no code changes beyond what's already in this repo (`npm start` runs `prisma migrate deploy` before
`next start`, and reads its port from `$PORT`).

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. At [railway.app](https://railway.app), sign in with GitHub → **New Project** → **Deploy from GitHub repo**
   → pick this repo and the branch you want live.
3. Open the new service → **Settings → Volumes** → add a volume mounted at `/data`.
4. Open **Variables** and add `DATABASE_URL` = `file:/data/production.db`.
5. Deploy. Railway auto-detects Node.js, runs `npm install` (which runs `prisma generate` via `postinstall`)
   and `npm run build`, then starts the app with `npm start` — which applies migrations against the volume
   and boots `next start` on Railway's assigned port.
6. Optional: load sample data once via the Railway CLI: `railway run npm run seed`.

Railway gives you a `*.up.railway.app` URL immediately; add a custom domain later from the service's
**Settings → Networking** tab if you want one.

## What's next (per the original design doc's phasing)

This build covers **Phase 1 (the bones)**. Later phases from the design doc — not built here — would add:
Google Drive/Calendar integration for real file storage and maintenance reminders, price comparison for the
"Find a part" search, automatic recurring-reminder generation, and eventually natural-language questions over
the accumulated household data.
