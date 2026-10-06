---
# docs/agents/topology.md — how this repo relates to its sibling UI/API.
role: frontend
companion:
  kind: api
  path: ../skills-demo-api
  url: https://github.com/TomWebwalker/skills-demo-api
---

# Topology

**Role:** frontend. The API (Express 5, `npm start` on :3000) lives at
`../skills-demo-api` (fallback: https://github.com/TomWebwalker/skills-demo-api).

The shared contract is mirrored by hand in `src/app/core/models.ts`; when a task
depends on a request/response shape, read the companion's `src/app.js` (routes) and
`src/store.js` / `src/seed.js` (data) rather than guessing. Read-only — don't edit or
install anything in the companion unless asked.
