---
# docs/agents/vcs.md — branching model the skills follow.
base_branch: main
branch_pattern: 'feat/<id>-<slug>'
pr_target: main
remote: origin
rebase_on_base: true
pr_tool: gh
pr_template: ''
---

# Version control

- New work branches off **`main`** after pulling latest.
- Branch names follow **`feat/<id>-<slug>`**, e.g. `feat/42-activity-feed-live`
  (`<slug>` is a short kebab-case summary).
- `origin/feat/42-activity-feed` is the rehearsal backup for the Angular Jam demo —
  never reuse, push to, or merge that branch.
- PRs open against **`main`** with `gh pr create`.
- Finalize updates `main`, then rebases the feature branch on it before pushing — no
  merge commits into the feature branch.
