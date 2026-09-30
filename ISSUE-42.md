# Issue #42 — the activity feed

Show a live log of what happened on the sprint board in the right-hand **Activity** panel.

> The backend half (`GET /api/activity`, `?limit=n`) lives in [angular-jam-demo-api](https://github.com/TomWebwalker/angular-jam-demo-api).

## Acceptance criteria

| #  | Criterion                                        | Side     |
| -- | ------------------------------------------------ | -------- |
| 01 | `GET /api/activity` returns the log, newest first | backend  |
| 02 | `?limit=n` caps the result                        | backend  |
| 03 | `ActivityStore` exposes `events`, `loading`, `isEmpty` | frontend |
| 04 | One list item per event, naming actor and task    | frontend |
| 05 | Empty log renders "No activity yet"               | frontend |

"Written as tests before the feature exists — the checker's definition of done."
The frontend criteria are covered by `src/app/activity/activity-feed.spec.ts`.

## Rendering hint for 04

For example: `Ada moved "Fix login" to done` — the actor name and task title are resolved via `TaskStore`'s `users` / `tasks`.
