# angular-jam-demo-web

Demo frontend for the Angular Jam talk **"Codifying the Developer Lifecycle"**: a small sprint board
(Angular 22, zoneless, signal-based stores) that an autonomous coding agent extends live on stage.

## Running it

The app talks to the demo API through a dev proxy (`proxy.conf.json`: `/api` → `http://localhost:3000`).

```bash
# 1. in angular-jam-demo-api — serves the API on http://localhost:3000
npm start

# 2. here — serves the board on http://localhost:4200
npm install
npm start
```

Without the API running the board still loads; it just shows empty columns.

## Tests

```bash
npm test   # ng test --watch=false — Vitest + jsdom, headless
```

## The activity feed is intentionally missing

The **Activity** panel is a placeholder ("Activity feed coming soon.") — implementing it is
[issue #42](./ISSUE-42.md). Its specs already exist in `src/app/activity/activity-feed.spec.ts`,
so `npm test` currently reports **8 tests: 5 passing, 3 failing by design**. The 3 failures are the
definition of done for #42.

## Layout

```
src/app/
  core/models.ts             shared contract with the backend
  tasks/task-store.ts        TaskStore — signal store for tasks and users
  tasks/task-board.ts        TaskBoard — the three-column sprint board
  activity/activity-feed.ts  ActivityFeed — placeholder (issue #42)
  app.ts                     shell: board + Activity panel
```

## Angular Jam demo runbook

| Branch | What it is |
|---|---|
| `main` | The **before** state for the live demo: activity feed is a placeholder, 3 of 8 tests fail by design. Don't merge anything into it before the talk. |
| `feat/42-activity-feed` (PR #2) | The finished **rehearsal** run of delivery-skills 1.1 — the backup if the live run stalls. Never merge. |

Live flow (API from `angular-jam-demo-api` running on :3000):

1. `/setup-project-skills` — writes `docs/agents/`, `CLAUDE.md`, the `verify-web` skill and its harness. It asks to add `playwright` as a devDependency: answer yes.
2. `/loop 42` — answer the grill questions (the recommended answers are fine), let it run builder → checker → reviewer until green and clean.
3. Say yes to `/finalize-feature` — it opens a PR.

The rehearsal took 4 cycles and roughly 15 minutes for this repo; plan the talk around the backup branch if time is short.
