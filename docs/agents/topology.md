---
role: frontend
companion:
  kind: api
  path: ../angular-jam-demo-api
  url: https://github.com/TomWebwalker/angular-jam-demo-api
---

# Topology

This repo is the UI. The Express API lives in `../angular-jam-demo-api` (port 3000); this app
reaches it through the `/api` dev proxy. Route contracts are in that repo's `src/app.js`.
