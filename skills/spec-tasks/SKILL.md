---
name: spec-tasks
description: Render the post-cohort phases/index.md pointer index from independent Phase files.
---

# Spec Tasks

For post-cohort tasks, read `decision-log.md`, `spec.md`, and every current `phases/P<n>.md` from the frozen stage packet. Write only `phases/index.md` using `templates/index-template.md`. This is a pure pointer index, not a task card, Phase procedure, progress ledger, or completion authority. Existing pre-cohort `tasks.md` and archived cards remain read-only.

Render exactly one row per Phase. Each row contains its stable authority path, semantic anchor, exact write set, Phase dependency, and real downstream consumer. The row must match the Phase header. Do not copy its L0/L1/L2 body, commands, oracle, evidence path, task procedure, or execution status. An absent or ambiguous authority is `unavailable` with the Phase owner and next action; never synthesize a fallback body or dual-write `tasks.md`.

Check that index Phase IDs and independent files form a bijection, dependency IDs resolve without cycles, and each write set matches its own Phase. Return row count and missing authorities. The index is regenerable from Phase files and cannot override them.
