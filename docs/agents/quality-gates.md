---
# docs/agents/quality-gates.md — commit rules and pre-push checks this repo enforces.
commit:
  convention: conventional
  ticket_ref: none
  coauthor_line: 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'
  validator: ''
  rules: 'conventional header (type(scope): subject); no validator or CI enforces length'
gates:
  - { name: test,  cmd: 'stack.commands.test' }
  - { name: build, cmd: 'stack.commands.build' }
dup_check:
  enabled: false
  cmd: ''
  scope: changed-files
app_verify:
  enabled: true
  skill: verify-web
loop:
  max_cycles: 5
  builder_agent: builder
  checker_agent: checker
  reviewer_agent: reviewer
  models:
    builder: sonnet
    checker: haiku
    reviewer: opus
  on_exhausted: stop-and-report
---

# Quality gates

There is no CI in this repo, so the gates are what `package.json` scripts: unit tests,
then the production build (which also type-checks), then the `verify-web` app check.

## Commit messages

Conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:` — scope optional),
no ticket id in the header, and the `coauthor_line` as the last line. No validator
runs, so there's no validation step — still keep the header short and wrap the body.

## Duplication

Not enforced — no Sonar or similar service.

## App verification

`verify-web` (`.claude/skills/verify-web/SKILL.md`) runs last in `/verify-feature`. It
self-tests and then runs the committed harness `e2e/verify-web.mjs` against
`npm start`, with every `/api` call stubbed through Playwright's `page.route`, so it
needs no running backend. A branch that adds a UI flow adds a check for it to that
harness.

## Loop

`/loop` builds with `builder` (sonnet), checks with `checker` (haiku) running
`/verify-feature`, and reviews the green diff with `reviewer` (opus) against
`standards.md` and the spec. Five cycles at most, then it stops and reports.
