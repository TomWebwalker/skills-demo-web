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
