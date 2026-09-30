---
scope: changed-lines
---

# Standards

The reviewer holds every change to these. The builder never reads this file.

- **W1** `mechanical` — Dependencies come from `inject()`, never constructor parameters.
  *Why: one DI style across the app.*
- **W2** `mechanical` — State lives in signals; stores expose them read-only
  (`asReadonly()` or `computed`). *Why: only the store writes its state.*
- **W3** `mechanical` — A component whose template is 20 lines or fewer uses an inline
  template. *Why: a separate file for a few lines is navigation for nothing.*
- **W4** `judgment` — Components hold no HTTP calls; data comes from a store in the
  feature folder. *Why: components stay testable without an HTTP mock.*
- **W5** `judgment` — Loading, empty, and error states are all rendered, not just the happy
  path. *Why: the empty board is the first thing a new user sees.*
