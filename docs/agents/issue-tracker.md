---
type: github
access: cli
ticket_id_pattern: '\d+'
ticket_id_example: '42'
statuses:
  in_progress: ''
  ready_for_qa: ''
version_label: false
version_source: ''
---

# Issue tracker

Tickets are written as `ISSUE-<id>.md` in the repo root; that file is the spec. Each one
is mirrored to a GitHub issue with the same title (GitHub numbering differs: `ISSUE-42.md`
is GitHub issue #1).

## Fetch a ticket

Read `ISSUE-<id>.md`. If it's missing, search GitHub: `gh issue list --search "Issue #<id>" --json number,title`.

## Set status

No workflow statuses on this repo; skip.

## Comment (QA instructions)

`gh issue comment <github number> --body-file <file>`. Check `gh issue view <n> --comments` first so
you don't post the same block twice.
