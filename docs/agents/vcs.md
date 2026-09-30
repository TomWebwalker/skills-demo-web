---
base_branch: main
remote: origin
branch_pattern: 'feat/<id>-<slug>'
pr_target: main
pr_tool: gh
pr_template: ''
rebase_on_base: true
---

# VCS

Trunk-based on `main`. Feature branches are `feat/<id>-<slug>` (e.g. `feat/42-activity-feed`),
PRs go to `main` with `gh pr create`.
