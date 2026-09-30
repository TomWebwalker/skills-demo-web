---
language: typescript
framework: angular
layout: single-app
package_manager: npm
source_paths: [src/app]
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

Angular 22, standalone and zoneless, signal-based stores. First-party code in `src/app/`
(`core/`, `tasks/`, `activity/`). Tests run with Vitest + jsdom through `ng test`, no browser.
`npm start` serves on 4200 and proxies `/api` to the API on 3000 (`proxy.conf.json`).

## QA mode

`browser` — serve the app with the API running and check the board and Activity panel.
