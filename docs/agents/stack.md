---
# docs/agents/stack.md — what this project is built with and how to run it.
language: typescript
framework: angular
layout: single-app
package_manager: npm
source_paths: [src]
qa_mode: browser
fix_agent: ''
commands:
  install: npm ci
  dev: npm start
  test: npm test
  lint: ''
  format_check: ''
  typecheck: ''
  build: npm run build
services: ''
---

# Stack

**Framework:** Angular 22 single app — zoneless, standalone components, signal-based
root stores (`TaskStore` in `src/app/tasks/task-store.ts`). First-party code lives
under `src/app/`; shared backend contracts are in `src/app/core/models.ts`.

## Commands

- `npm start` serves the app on http://localhost:4200 and proxies `/api` to
  http://localhost:3000 (`proxy.conf.json`). Without the API running the board still
  loads with empty columns.
- `npm test` runs `ng test --watch=false` (Vitest + jsdom, headless).
- `npm run build` is the production build; it also type-checks, so `typecheck` is
  empty.
- There is no linter. Prettier is configured (`.prettierrc`) but not enforced, so
  `format_check` is empty.
- `services` is empty: the real API lives in the companion repo (see `topology.md`),
  and the `verify-web` harness stubs `/api` itself.

## QA mode

`browser` — start `npm start`, open http://localhost:4200, and walk the sprint board
and the Activity panel. For live data, start the companion API with `npm start` in
`../skills-demo-api` first.

## Fix agent

None — fixes go through the generic builder.
