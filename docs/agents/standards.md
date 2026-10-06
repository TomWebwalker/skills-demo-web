---
# docs/agents/standards.md — review rules the reviewer agent checks each diff against.
# The builder never reads this file; only the reviewer does.
scope: changed-lines
---

# Standards

Rules a reviewer holds every change to. Each has an id (the reviewer cites it), a tag,
and one line of *why*.

- `judgment` — needs a reader to apply.
- `mechanical` — a tool could check it; findings are marked *candidate for lint*.

## Rules

- **S1** `judgment` — Names say what a thing is for, not how it's built.
  *Why: the next reader has only the name.*
- **S2** `judgment` — Errors are handled where something can be done about them; a
  failed request never renders as if the data were empty. *Why: "No tasks" after a 500
  tells the user something false.*
- **S3** `judgment` — A behavior change comes with a test that fails without it.
  *Why: otherwise the next refactor removes it silently.*
- **A1** `judgment` — Components hold no HTTP calls; data comes from a root signal store
  following the `TaskStore` pattern (private writable signals, public `.asReadonly()`,
  derived state via `computed`). *Why: one place owns each piece of server state.*
- **A2** `mechanical` — Dependencies are injected with `inject()`, not constructor
  parameters. *Why: house style; keeps components and stores uniform.*
- **A3** `mechanical` — New state uses signals (`signal`, `computed`), not
  `BehaviorSubject` or mutable fields. *Why: the app is zoneless — non-signal state
  doesn't trigger change detection.*
- **A4** `mechanical` — A component whose file is 20 lines or fewer uses an inline
  `template`, not `templateUrl`. *Why: house style; small components read in one file.*
