# Build-code Phase P2 card — OI author and three consumers

- **Goal**: Extend the existing make-decision/decision-log/review contracts with one current OI authority, the six framework nodes and six fixed categories, a questions-only direction projection, and distinct direction/detail/approve-decision responsibilities.
- **Allowed files**: `workflows/make-decision/SKILL.md`, `workflows/make-decision/steps.json`, `skills/decision-log/SKILL.md`, `skills/decision-log/templates/decision-log-template.md`, `runtime/review/stage-materials.json`, `skills/wh-review/contracts/make-decision.md`, `docs/standard-workflow.md`, the five P2 contract tests, plus the required decision-log bundle/catalog hash synchronization discovered by closure validation.
- **Covered ACs**: AC-OUTLINE-001, AC-OUTLINE-002, AC-SNAPSHOT-001, AC-REVIEW-002, AC-STATE-002.
- **Non-goals**: no new material, store, stage, public command, confirmation point, runtime close predicate, Talk/Grill change, or provider-quality gate; runtime validation of OI identity/proof remains P3 scope.
- **Compatibility boundary**: keep four current materials, fourteen make-decision steps, current interaction aggregate and existing review advisory semantics. `convergence_outline` is a projection field, not a fifth material or persistent authority.
- **Predesigned route**: static/contract feature tests across the five named test files; focused command from T003/T004 with single Vitest fork and no file parallelism. RED must fail only at the new OI/consumer assertions; GREEN must pass the same command.
- **Stop conditions**: any new authority/state/control plane, answer leakage into direction projection, consumer substitution, extra confirmation, review-as-permission, or unrelated stage edits.
- **Expected stage-end summary**: report changed contracts, exact focused RED/GREEN command and exits, AC dispositions and coverage limits, review fact/disposition, unresolved runtime-validation limits, and next task T005.

## Execution facts

- **Build-code routing advisor**:

  ```json
  {"routing_tier":"feature","routing_rationale":"P2 changes the make-decision OI/review contract and its static/contract consumers across workflows/make-decision, skills/decision-log, runtime/review/stage-materials.json, skills/wh-review/contracts/make-decision.md, and five focused contract tests; it changes behavior within one feature domain without a cross-endpoint, database, auth, or deployment seam.","result":"pass","ts":"2026-09-10T01:40:00Z"}
  ```

- **Backend-testing record**: changed files are the P2 contract/docs/registry files listed above and the five named contract tests; FRs `FR-OUTLINE-001/002`, `FR-SNAPSHOT-001`, `FR-REVIEW-001`, `FR-STATE-001`, `FR-CONFIRM-001`, `FR-REVISION-001`, `FR-CONFLICT-001`, `FR-FLOW-001/002`, `FR-GOV-001`; ACs `AC-OUTLINE-001/002`, `AC-SNAPSHOT-001`, `AC-REVIEW-002`, `AC-STATE-002`. Command was the exact T003/T004 focused Vitest command, expected/observed GREEN exit `0`, 5 files/74 tests. Oracle `ORACLE-OI-CONTRACT`. Fixtures are in-memory Markdown/JSON; no service. Coverage is static/contract only: runtime OI identity, real provider output, per-OI no-gap proof, user confirmation interaction, conflict, and close aggregation remain unverified.

- **Focused test evidence**: RED exact command exited `1` at the named OI/consumer assertions (with initial stale bundle/namespace assertions repaired within the same paired scope); GREEN exact command exited `0` at `2026-09-10`, duration ~34.8s.

- **Phase review facts** (public `review --action=record`, `subject_kind=phase`, `review_scope=phase`): P1 attempt `quality/reviews/attempts/fc659856-4297-5e24-adf1-783bdd28abeb/attempt.json` is `unavailable`, `dispatch_state=blocked_before_dispatch`, `error.code=MATERIAL_INCOMPLETE` (acceptance material intentionally empty to exercise the route without a provider dispatch); P2 attempt `quality/reviews/attempts/8b379781-028d-55fb-a923-cbded1139ede/attempt.json` is `unavailable`, `dispatch_state=blocked_before_dispatch`, `error.code=PROTOCOL_INCOMPATIBLE` (`managed provider timing is invalid`). These are review facts, not permission or GREEN evidence; no review result refs exist.

- **Open limitation**: the frozen FR-REVIEW-001 wording asks for per-OI `checked_no_gap`, while the provider protocol only carries `{findings}`. This phase therefore records no invented per-OI no-finding proof; the conflict remains `unavailable`/requires build-spec clarification before any runtime claim.
