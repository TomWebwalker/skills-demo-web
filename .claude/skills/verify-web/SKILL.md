---
name: verify-web
description: Verify the web app end to end — serve it against the real API, drive the flows the current branch touches in a headless browser, try to break them with hostile data, and save screenshots. Run as the last gate of /verify-feature.
---

**Load config first.** Read `docs/agents/stack.md`, `docs/agents/vcs.md`, and
`docs/agents/topology.md`. **Never edit code** — report, don't fix.

## Evidence directory

```bash
repo=$(basename "$(git rev-parse --show-toplevel)")
branch=$(git branch --show-current | tr '/' '-')
run="${TMPDIR:-/tmp}/delivery-skills/$repo/$branch/app-verify/$(date +%Y%m%dT%H%M%S)"
mkdir -p "$run"
```

## Steps

1. **Scope.** `git diff --name-only main...HEAD`; map changed files to what a user sees
   (the board, the Activity panel).
2. **Start.** The API from `topology.md#companion.path`: `(cd ../angular-jam-demo-api && npm start) > "$run/api.log" 2>&1 &`,
   ready when `curl -sf localhost:3000/api/users` answers. Then `npm start > "$run/web.log" 2>&1 &`,
   ready when `curl -sf localhost:4200/` answers (max 120 s each). Skip starting anything already
   listening on its port, and don't stop it afterwards.
3. **Drive** with a throwaway Playwright script at `$run/check.mjs`. Install Playwright into
   the run folder, not the project: `npm i --prefix "$run" --no-save --silent playwright@1.63`
   (the browsers are already cached), then `node "$run/check.mjs"` (headless Chromium). Load http://localhost:4200, screenshot the
   page, check the scoped panels render real data, move one task through the board UI and
   confirm the change shows up where the branch says it should. Screenshot each step into `$run/`.
4. **Try to break it** with hostile data, only where the change renders it — use
   `page.route('**/api/...')` to serve: an empty list, one item, 1,000 items, a 300-character
   task title, an emoji and right-to-left name, and a 500 response. A crash, a blank panel, a
   layout that overflows the page, or silently wrong text is a failure; a clear empty or
   error state is a pass.
5. **Tear down** what this skill started.
6. **Write `$run/index.md`** — one line per check (flow, data, result, screenshot), then report.

## Report format

```
ALL GREEN
evidence: <run dir>
```

```
FAILED
<flow> - <what broke> - app_verify
evidence: <run dir>
```
