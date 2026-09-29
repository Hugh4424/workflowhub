# CARD-04 build-code P1 Phase Card

- Identity: `workflowhub-thin-core-card-04-20260919`, post cohort, `task/workflowhub/workflowhub-thin-core-card-04-20260919`.
- Goal: deliver the test asset rules, real entry inventory, and ADR-0032 so later phases and CARD-10 can consume a truthful contract.
- Tasks and AC: T001 (FR-16/17, AC-16/17), T002 (FR-21, AC-21), T003 (FR-16, AC-16).
- Production write set: `docs/architecture/test-asset-governance-rules.md`, `docs/architecture/real-entry-inventory.md`, `docs/adr/0032-acceptance-truth-presentation-and-cohort-parity.md`. Execution evidence belongs under this directory and existing task facts/quality paths. No runtime code, `ENTRYPOINT.md`, or `package.json` edits.
- Compatibility: keep the post cohort's `spec.md` plus physical Phase authority; ADR-0032 decision claims must match `decision-log.md` D-001..D-008. Preserve the known ADR number collision as a disclosed limit.
- Test route: document and git assertions from P1 T001–T003; use the exact P1 composite command. Capture target RED and full GREEN transcripts, then verify document semantics against decision/source and the entry consumers. Unit tests are not applicable to these document-only tasks. Reassess UI applicability after the inventory is verified.
- Review: one independent P1 review via public `review --action=record`; record canonical result or unavailable attempt and disposition each finding. Do not treat the marker assertions as semantic acceptance.
- STOP: non-target RED, a missing required document section, ADR untracked, ADR contrary to confirmed decisions, or incomplete P1 evidence prevents a P1 completion claim. Quality gaps do not prevent same-task repair.
- Handoff: report delivered documents, actual commands and exits, semantic and AC limits, independent review and dispositions, open risks, and the next task.
