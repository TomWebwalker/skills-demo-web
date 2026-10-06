---
name: verify-web
description: Verify the sprint board end to end — start it, run the committed app-verify harness against it, and save evidence. Run as the last gate of /verify-feature.
---

**Load config first.** Read `docs/agents/stack.md` (`commands.dev`, `services`,
`qa_mode`) and `docs/agents/vcs.md` (`base_branch`). This skill checks the running
app; the unit gates already ran before it.

**Run the harness; never write or edit checks.** Every check lives in
`e2e/verify-web.mjs`, which is committed and reviewed like any other code. If the
branch adds a flow the harness doesn't cover, report it as `missing check: <flow>` —
the builder adds it, the reviewer reviews it.

## Evidence directory

```bash
repo=$(basename "$(git rev-parse --show-toplevel)")
branch=$(git branch --show-current | tr '/' '-')
run="${TMPDIR:-/tmp}/delivery-skills/$repo/$branch/app-verify/$(date +%Y%m%dT%H%M%S)"
mkdir -p "$run"
```

## Steps

1. **Self-test.** `node e2e/verify-web.mjs --self-test --out "$run/self-test"`. It runs
   every check against a known-bad fixture and must report each one as failing. If any
   line starts with `BAD`, stop and report `FAILED` — `app_verify - check <name>
   cannot fail`.
2. **Start.** `services` is empty (all `/api` calls are stubbed by the harness). Never
   reuse a server on :4200 — other projects on this machine use that port. Always start
   a dedicated one on **port 4310**:
   - If `lsof -nP -iTCP:4310 -sTCP:LISTEN` shows a listener, report `FAILED` —
     `app_verify - port 4310 is busy` — and stop. Don't kill it.
   - `npm start -- --port 4310 > "$run/server.log" 2>&1 & echo $! > "$run/server.pid"`
   - Readiness — the page must be *this* app, not just any answer:
     `for i in $(seq 90); do curl -sf http://localhost:4310/ | grep -q '<title>Sprint board' && break; sleep 1; done`.
     If it never matches, report `FAILED` with the last 40 lines of `server.log`.
3. **Run.** `node e2e/verify-web.mjs --base http://localhost:4310 --out "$run"`. It
   prints one `PASS`/`FAIL` line per check, saves a full-page screenshot per check
   into `$run/`, and writes `$run/index.md`.
4. **Tear down** only what this skill started: `pkill -P "$(cat "$run/server.pid")";
   kill "$(cat "$run/server.pid")"`. Never `pkill` by name.
5. **Report** the harness result in the format below. Copy each failing check's
   message as the harness printed it.

## Report format

```
ALL GREEN
skipped: <check> (<why>)
evidence: <run dir>
```

```
FAILED
<check> - <what broke, as the harness printed it> - app_verify
missing check: <flow the branch adds that the harness doesn't cover>
evidence: <run dir>
```
