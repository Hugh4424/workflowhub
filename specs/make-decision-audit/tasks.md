# Tasks: make-decision-audit

**Input**: Design documents from `specs/make-decision-audit/`
**Prerequisites**: `spec.md` (authoritative, independently reviewed), `plan.md`, `data-contracts.md`, `research.md`
**Tests**: Use the repository's existing Node.js test script from `package.json`; no new test runner or dependency.
**Organization**: Three ordered stages match the three plan phases. Every task carries explicit FR coverage, exact paths, stage, and dependencies.

## Format: `- [ ] [TaskID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other same-stage tasks after its dependencies finish.
- **[Story]**: `US1` topology/manifests, `US2` lineage/source, `US3` observed audit, `US4` consumers/docs/verification.
- Dependency order is authoritative; a task may start only after all listed task IDs complete.

---

## Stage 1

### Phase 1: Setup / Foundation

**Goal**: Freeze expected topology and canonical lineage contracts before wiring execution facts.

**Independent test**: Manifest validation rejects duplicate IDs, gaps, missing fields, unknown dependencies, and cycles; equivalent Multica/offline inputs produce the same canonical ledger and R1–R9 coverage is 9/9 while R10 remains withdrawn.

- [ ] T001 [US1] Rewrite the five stage definitions into continuous integer, one-action steps and record the unambiguous legacy action mapping in `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, `workflows/verify-code/SKILL.md`, and `docs/migration-and-fallback.md`  FR: FR-STRUCTURE-001, FR-COMM-001  (stage:1, depends:无)
- [ ] T002 [P] [US1] First add failing contract cases to `tests/step-manifest.test.mjs`; then add the canonical manifest interchange contract in `schemas/steps.schema.json` and implement stable ID, contiguous order, required evidence, dependency reference, and cycle validation in `core/step-manifest.mjs`  FR: FR-CONTRACT-001, FR-BEHAV-001  (stage:1, depends:T001)  (upstream_delta: 采用 data-contracts.md 的 expected-topology 窄合同)
- [ ] T003 [US1] Create `workflows/make-decision/steps.json`, `workflows/build-spec/steps.json`, `workflows/build-plan/steps.json`, `workflows/build-code/steps.json`, and `workflows/verify-code/steps.json` from the rewritten stage definitions, with entry conditions, completion evidence, observable results, and dependencies for every step  FR: FR-CONTRACT-001, FR-STRUCTURE-001  (stage:1, depends:T001,T002)
- [ ] T004 [P] [US2] First add failing lineage cases to `tests/requirement-lineage.test.mjs`; then define canonical source and immutable lineage contracts in `schemas/requirement-ledger.schema.json`, `core/canonical-source.mjs`, and `core/requirement-ledger.mjs`, including requirement status, evidence references, content hashes, coverage denominator, and stale propagation  FR: FR-ALIGN-001, FR-TRACKING-001  (stage:1, depends:无)  (upstream_delta: R1–R9 accepted，R10 withdrawn 且不进入 coverage 分母)
- [ ] T005 [US2] Implement the thin Multica normalization boundary in `core/multica-source-adapter.mjs`, returning canonical input or explicit `SOURCE_INCOMPLETE`/unknown without platform dependencies in generic core  FR: FR-CONTRACT-002, FR-ALIGN-001  (stage:1, depends:T004)
- [ ] T006 [P] [US1] Expand and run manifest contract tests in `tests/step-manifest.test.mjs` after T002/T003, proving 5/5 stage sets, uniqueness, contiguous order, required fields, missing dependency, and cyclic dependency rejection  FR: FR-CONTRACT-001, FR-BEHAV-001, FR-BUILD-001  (stage:1, depends:T002,T003)
- [ ] T007 [P] [US2] Expand and run lineage/source tests in `tests/requirement-lineage.test.mjs` and `tests/source-adapter.test.mjs` after T004/T005, proving 9/9 accepted coverage, withdrawn R10, tampered hashes, stale propagation, incomplete source, and Multica/offline equivalence  FR: FR-ALIGN-001, FR-TRACKING-001, FR-CONTRACT-002, FR-BUILD-001  (stage:1, depends:T004,T005)

**Stage 1 checkpoint**: T001–T007 complete; canonical expected topology and source/lineage inputs validate independently. T003 and T005 are not dispatched until their prerequisite contracts exist.

---

## Stage 2

### Phase 2: Core Implementation

**Goal**: Wire observed step facts to the manifests, produce one canonical audit verdict, and migrate all verdict consumers.

**Independent test**: A normal five-stage fixture has matching same-attempt entry/exit evidence for every expected step; missing, duplicate, unexpected, out-of-order, cross-attempt, unknown, stale, and tampered-hash cases never pass; all three result consumers expose the aggregator verdict/hash unchanged.

- [ ] T008 [US3] First add failing identity cases to `tests/receipt-verification.test.mjs`; then extend SIG-001 and SIG-003 in `core/receipt-schema.mjs` and `core/journal-schema.mjs` so run, stage, manifest step, attempt, event type, terminal status, timestamp, and evidence fields share one narrow contract  FR: FR-ARTIFACT-001, FR-BEHAV-001  (stage:2, depends:T003)
- [ ] T009 [US3] Adapt SIG-002 and SIG-004 in `core/receipt-writer.mjs` and `core/journal-appender.mjs` to preserve append-only observed facts, enforce entry fail-closed behavior, retain exit-write warnings, and never infer expected topology  FR: FR-ARTIFACT-001, FR-BEHAV-001  (stage:2, depends:T008)
- [ ] T010 [US3] Add manifest-bound `writeEntryReceipt` and `writeExitReceipt` calls at every canonical step boundary in `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, and `workflows/verify-code/SKILL.md`, preserving same run/stage/step/attempt identity and explicit skip/retry/human facts  FR: FR-ARTIFACT-001, FR-CONTRACT-001, FR-BEHAV-001  (stage:2, depends:T003,T009)
- [ ] T011 [US3] First add failing reconciliation cases to `tests/audit-aggregator.test.mjs`; then extend SIG-005 and SIG-006 in `core/chain-topology.mjs` and `core/audit-aggregator.mjs`, and add `schemas/audit-summary.schema.json`, to reconcile manifests, ledgers, journals, and receipts into expected/observed counts, coverage, findings, evidence references, summary hash, and the sole canonical verdict  FR: FR-REVIEW-001, FR-ACCOUNT-001, FR-BEHAV-001, FR-TRACKING-001  (stage:2, depends:T004,T008,T009)
- [ ] T012 [P] [US3] Expand `tests/receipt-wiring.test.mjs` and `tests/receipt-verification.test.mjs` to prove 5/5 stage wiring, same-attempt matching, entry failure, exit warning visibility, duplicate terminal exits, unexpected steps, and ordering failures  FR: FR-ARTIFACT-001, FR-BEHAV-001, FR-BUILD-001  (stage:2, depends:T010)
- [ ] T013 [US3] Add `tests/audit-aggregator.test.mjs` and canonical datasets `tests/fixtures/step-audit/normal.json`, `tests/fixtures/step-audit/legacy.json`, `tests/fixtures/step-audit/missing.json`, `tests/fixtures/step-audit/duplicate.json`, `tests/fixtures/step-audit/out-of-order.json`, `tests/fixtures/step-audit/unknown.json`, `tests/fixtures/step-audit/cross-attempt.json`, `tests/fixtures/step-audit/tampered-hash.json`, `tests/fixtures/step-audit/stale.json`, `tests/fixtures/step-audit/source-incomplete.json`, `tests/fixtures/step-audit/retry-volume.json`, and `tests/fixtures/step-audit/reordered-page.json`  FR: FR-ACCOUNT-001, FR-BEHAV-001, FR-BUILD-001  (stage:2, depends:T007,T011,T012)
- [ ] T014 [US4] First add failing consumer-reference cases to `tests/stage-result-contract.test.mjs` and `tests/facts-subschema.test.mjs`; then migrate SIG-007 and SIG-008 in `scripts/validate-stage-result.mjs` and `workflows/verify-code/facts-assembly.mjs` so stage-result, validator, and facts assembly only reference or verify the aggregator summary/verdict/hash and cannot independently recalculate a quality verdict  FR: FR-REVIEW-001, FR-ACCOUNT-001, FR-BEHAV-001  (stage:2, depends:T011)
- [ ] T015 [P] [US4] Update `tests/stage-result-contract.test.mjs` and `tests/facts-subschema.test.mjs` to reject missing or mismatched summary references/hashes and prove consumer verdict equality  FR: FR-REVIEW-001, FR-ACCOUNT-001, FR-BUILD-001  (stage:2, depends:T014)

**Stage 2 checkpoint**: T008–T015 complete; canonical summary is the only verdict authority, all expected and observed records reconcile, and consumer contract tests pass.

---

## Stage 3

### Phase 3: Polish / Verification

**Goal**: Complete the evidence matrix, caller migration documentation, full acceptance run, performance baseline, and reference-impact check.

**Independent test**: The four validation layers and all six required failure classes produce reproducible results; 8/8 consumers have evidenced reuse decisions; a legacy caller can migrate using documentation alone.

- [ ] T016 [P] [US4] Create the 8-consumer typed I/O and evidence matrix in `docs/reuse-registry.md`, recording failure, skip, retry, human semantics and reuse/local/extract rationale for five stages plus stage-result, validator, and facts assembly  FR: FR-SCOPETRIAGE-001, FR-COMM-001  (stage:3, depends:T003,T014)
- [ ] T017 [US4] Update `tests/reuse-registry.test.mjs` and `tests/m12-reuse-registry.test.mjs` to require 8/8 consumer entries and reject unsupported shared mechanisms or missing semantic evidence  FR: FR-SCOPETRIAGE-001, FR-BUILD-001  (stage:3, depends:T016)
- [ ] T018 [P] [US4] Write canonical schema, owner/consumer, error-code, legacy/unknown, skip/retry/human, old-to-new mapping, cutover signal, and offline/Multica caller guidance in `docs/audit-contracts.md`, `docs/migration-and-fallback.md`, and `docs/adr/0002-requirement-lineage-and-step-audit.md`  FR: FR-COMM-001, FR-CONTRACT-002  (stage:3, depends:T005,T011,T014,T016)
- [ ] T019 [US4] Run the repository's existing relevant test script against unit, integration, legacy, and adversarial suites; record exact commands, pass/fail counts, fixture evidence, actual ledger/receipt scale, and audit-duration baseline in the task tracking evidence directory resolved by `core/task-record-paths.mjs`  FR: FR-BUILD-001, FR-ACCOUNT-001  (stage:3, depends:T006,T007,T013,T015,T017,T018)
- [ ] T020 [Knowledge] [US4] Scan all references to modified, deleted, or renamed symbols and paths across code, config, tests, and docs; reconcile every caller against `docs/migration-and-fallback.md` and record any unavailable performance metric as unknown with its source limitation  FR: FR-COMM-001, FR-BUILD-001, FR-BEHAV-001  (stage:3, depends:T018,T019)
- [ ] T021 [STOP] [US4] Validate AC-01 through AC-08 and the FR-COMM-001 documentation scenario against `specs/make-decision-audit/spec.md`, `specs/make-decision-audit/plan.md`, test evidence, manifests, ledger, and canonical summary; pause for explicit release validation before implementation handoff  FR: FR-STRUCTURE-001, FR-CONTRACT-001, FR-ARTIFACT-001, FR-ALIGN-001, FR-REVIEW-001, FR-BEHAV-001, FR-TRACKING-001, FR-ACCOUNT-001, FR-SCOPETRIAGE-001, FR-CONTRACT-002, FR-COMM-001, FR-BUILD-001  (stage:3, depends:T020)

**Stage 3 checkpoint**: T016–T021 complete; STOP validation has explicit evidence and no unresolved scope expansion.

---

## Dependencies & Execution Order

### Stage Dependencies

- **Stage 1**: Starts immediately. T001/T004 can start independently; T002 follows T001; T003 follows T001/T002; T005 follows T004; tests follow their contracts and artifacts.
- **Stage 2**: Begins only when Stage 1 completes. Receipt identity precedes writers and workflow wiring; aggregator precedes consumers; consumer tests follow migration.
- **Stage 3**: Begins only when Stage 2 completes. Matrix/docs can proceed in parallel where dependencies allow; full tests precede reference-impact and final STOP validation.

### User Story Dependencies

- **US1 — Canonical topology/manifests**: Independent foundation; provides expected steps to US3.
- **US2 — Requirement lineage/source**: Independent foundation; joins US3 at aggregator reconciliation.
- **US3 — Receipt/journal/audit**: Depends on US1 and US2 contracts; produces canonical summary.
- **US4 — Consumers/docs/verification**: Depends on canonical summary and consumer migration; independently testable through reference/hash equality and documented migration.

### Parallel Opportunities

- T001 and T004 may run in parallel.
- T006 and T007 may run in parallel after their respective implementation chains.
- T012 may run while T011 is completed after T010; T015 follows T014 independently of fixture authoring.
- T016 and T018 may overlap after their listed dependencies; no two parallel tasks edit the same declared file.

### Dependency Integrity

- Every `depends` ID exists in this file.
- All dependencies are in the same or an earlier stage.
- No task depends on a later task; T001–T021 are topologically ordered.

## Implementation Strategy

### MVP First

1. Complete T001–T007 to freeze canonical expected topology and lineage inputs.
2. Complete T008–T013 to prove same-attempt receipt reconciliation and sole aggregator verdict on normal/adversarial fixtures.
3. **STOP and validate** that the normal full-chain fixture passes and every required failure fixture is non-pass before migrating consumers.
4. Complete T014–T021 for consumer cutover, documentation, full evidence, and handoff.

### Incremental Delivery

1. Stage 1 delivers independently testable manifests and canonical source/ledger contracts.
2. Stage 2 delivers independently testable observed-fact reconciliation and canonical summary.
3. Stage 3 delivers caller migration, complete verification, measured baseline, and explicit validation.

## Quality Contract

- No undefined work markers detected; no task is frozen for missing task content.
- T020 carries `Knowledge` because performance evidence must come from an actual run and unavailable facts must remain unknown.
- T021 carries `STOP` because final validation requires explicit confirmation before implementation handoff.
- Scope excludes R10, a sixth stage, new services/databases/event buses/dependencies/CI blocking gates, a second verdict engine, platform dependencies in generic core, and unrelated product changes.
- Phase 1 `gate_cmd`: `npm test -- tests/step-manifest.test.mjs tests/requirement-lineage.test.mjs tests/source-adapter.test.mjs`; `display_cmd`: same command plus `--reporter=verbose`.
- Phase 2 `gate_cmd`: `npm test -- tests/receipt-wiring.test.mjs tests/receipt-verification.test.mjs tests/audit-aggregator.test.mjs tests/stage-result-contract.test.mjs tests/facts-subschema.test.mjs tests/reuse-registry.test.mjs tests/m12-reuse-registry.test.mjs`; `display_cmd`: same command plus `--reporter=verbose`.
- Phase 3 `gate_cmd`: `npm test`; `display_cmd`: `npm test -- --reporter=verbose`; diff gate is `git diff --check`, display is `git diff --stat`.
- Every phase writes exact checkpoints to `tasks/make-decision-audit/progress.md` and `tasks/make-decision-audit/apply/phase-N.md`; any required human confirmation stays explicit and is never inferred from review pass.
