# CARD-04 build-code P6 Phase Card

- Goal: verify the original-source census, upstream coverage ledger, external read-only oracle mirror, real CLI E2E, spec-analyze diagnostic truth, and review-history reader against the current post cohort.
- Tasks/AC: T009–T014; see physical P6.md for FR/AC and eight-file aggregate command. Existing spec/decision text and prewritten tests are inputs, not execution or acceptance facts.
- Write boundary: T009 decision-log append and T010/T014 spec material changes only if their already recorded task-specific authorization and authoring ownership are authenticated; otherwise record the gap and route to make-decision/build-plan owner. T011 may write only the declared external oracle mirror. T012/T013 frozen tests and CARD-05 runtime/review files are read-only.
- Route: focused T009/T010/T011/T012/T013/T014 commands first, then the exact P6 aggregate command only when dependencies support it. Record test counts, IDs, exits, output, source snapshot, and genuine target RED/GREEN. Run no unrestricted Vitest suite.
- STOP: do not produce the T012 dynamic fixture report from a static P5 file; do not edit CARD-05-owned zero-entry guard or archived-spec test path to force T013 green; do not rename local source IDs as upstream IDs or invent oracle provenance. Preserve A-8/A-9' and any missing P5 source as `not_done/G2` with owner.
- Review: one independent P6 OCR Phase review after the actual scope stabilizes; dispose each finding. Green local checks cannot establish the full P6 Phase while a required route or source remains missing.
- Handoff: per-task actual command/result, AC evidence/limits, the aggregate result, review status, unresolved owner, and next safe Phase.
