# Tasks: wh-quality-convergence

**Input**: Design documents from `specs/wh-quality-convergence/`
**Prerequisites**: spec.md (355 lines, 3rd-reviewed, pass), plan.md (190 lines)

**Tests**: Vitest (`npm test`)

**Organization**: Tasks grouped by phase (Setup → Core → Polish) to enable independent implementation.

## Format: `- [ ] [TaskID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- Every task references at least one FR from spec.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema definition and foundational changes that all downstream tasks depend on

- [ ] T001 Define flow_profile field — make-decision writes flow_profile to decision-log facts (string, values: full_vibecoding/fast_make_decision_to_code) FR: FR-FLOWPROFILE-001
- [ ] T002 Update make-decision SKILL.md to write flow_profile in decision-log facts FR: FR-FLOWPROFILE-001
- [ ] T003 Add flow_profile acceptance tests — decision-log write + downstream read-only: missing field, non-string values, downstream misuse check FR: FR-FLOWPROFILE-001

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core mechanisms that downstream wiring tasks depend on

- [ ] T004 Implement getRealChangedFiles() in scripts/validate-stage-result.mjs — git diff to get actual changed files list FR: FR-RECEIPT-001
- [ ] T005 Implement verifyReceipts() in scripts/validate-stage-result.mjs — compare declared vs actual changes FR: FR-RECEIPT-001, FR-RECEIPT-002
- [ ] T006 Implement appendTaskIndex(taskId, projectKey, repoUrl) in core/task-index.mjs — append-only JSON index writer FR: FR-PROJECTINDEX-001
- [ ] T007 Implement lookupProjectKey(taskId) in core/task-index.mjs — indexed query from manifest file FR: FR-PROJECTINDEX-002
- [ ] T008 Implement config.json read path in core/task-dir-parser.mjs — priority: WORKFLOWHUB_TASK_DIR > config.json > fail-loud FR: FR-TASKDIR-001, FR-TASKDIR-002, FR-TASKDIR-003
- [ ] T009 Define ~/.workflowhub/config.json format with fail-loud rules (no default fallback) FR: FR-TASKDIR-001

**Checkpoint**: All core mechanisms (receipt verification, task-index, config persistence) implemented and unit-tested individually.

---

## Phase 3: User Story 1 — SKILL.md Wiring (Priority: P1)

**Goal**: Wire receipt verification into four stage SKILL.md files so each stage calls verifyReceipts after stage-result write

**Files**: `workflows/build-spec/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, `workflows/verify-code/SKILL.md`

**Tasks**: T010-T013

**Verify**: For each wired SKILL.md, run `grep -n 'verifyReceipts' workflows/<stage>/SKILL.md` to confirm call exists after stage-result write; run `npx vitest run -t "receipt"` to confirm receipt tests pass

**Knowledge**: Updates to `tasks/wh-quality-convergence/progress.md`

**STOP**: Each SKILL.md wiring must be verified independently

**Independent Test**: For each stage, run `grep -n 'verifyReceipts' workflows/<stage>/SKILL.md` to verify post-stage-result call position; confirm receipt-verification tests pass with `npx vitest run -t "receipt"`

**FR Coverage**: FR-RECEIPT-001, FR-RECEIPT-002

### Implementation for User Story 1

- [ ] T010 Wire receipt verification into workflows/build-spec/SKILL.md stage-result post-write step FR: FR-RECEIPT-001, FR-RECEIPT-002
- [ ] T011 Wire receipt verification into workflows/build-plan/SKILL.md stage-result post-write step FR: FR-RECEIPT-001, FR-RECEIPT-002
- [ ] T012 Wire receipt verification into workflows/build-code/SKILL.md stage-result post-write step FR: FR-RECEIPT-001, FR-RECEIPT-002
- [ ] T013 Wire receipt verification into workflows/verify-code/SKILL.md stage-result post-write step FR: FR-RECEIPT-001, FR-RECEIPT-002

**Gate**: Each SKILL.md wiring must be verified independently — verify that the receipt call uses correct file paths for that stage.

---

## Phase 4: User Story 2 — Test Coverage (Priority: P1)

**Goal**: Comprehensive test coverage for all new mechanisms, including boundary and failure cases

**Files**: `tests/receipt-verification.test.mjs`, `core/__tests__/task-index.test.mjs`, `core/__tests__/task-dir-parser-config.test.mjs`

**Tasks**: T014-T017

**Verify**: `npm test` — full suite must pass, including all new test files

**Knowledge**: Updates to `tasks/wh-quality-convergence/reviews/` — verifier reports stored for evidence

**STOP**: Full `npm test` green before polish phase

**Independent Test**: `npm test` must pass entirely

**FR Coverage**: FR-RECEIPT-002 (AC1-AC4), FR-PROJECTINDEX-002 (AC1-AC3), FR-TASKDIR-002 (AC1-AC3)

### Implementation for User Story 2

- [ ] T014 Write tests/receipt-verification.test.mjs — receipt verification tests: positive (valid git diff + test stdout/stderr/exit code + facts.diff_sha + facts.test_result_log must pass), negative (empty diff, test not run, evidence mismatch, wrong-stage test log, no_code_change missing) FR: FR-RECEIPT-002
- [ ] T015 Write core/__tests__/task-index.test.mjs — task-index tests: append, lookup, concurrent write, file corruption FR: FR-PROJECTINDEX-002
- [ ] T016 Write core/__tests__/task-dir-parser-config.test.mjs — config.json tests: file exists, missing, malformed, priority chain FR: FR-TASKDIR-002, FR-TASKDIR-003
- [ ] T017 Run full regression test suite — all existing tests + new tests must pass FR: All FRs

**Gate**: Full `npm test` green.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and scope boundary checks

- [ ] T018 [P] Verify scope boundary: no changes to make-decision/write-code/verify-code SKILL.md beyond receipt wiring and flow_profile field addition Governance: scope-boundary
- [ ] T019 [P] Scan for no-placeholder compliance: TODO, TBD, placeholder, 待定, 暂缺 patterns in all new files Governance: no-placeholder
- [ ] T020 [P] Final regression: `npm test` full suite, all 152+ tests pass FR: All FRs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — needs flow_profile schema defined first
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) — needs verifyReceipts implemented
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) — tests need target code
- **Polish (Phase N)**: Depends on all prior phases complete

### Phase-Level Stage Mapping

- **Stage 1**: T001-T003 (Setup — flow_profile schema)
- **Stage 2**: T004-T009 (Foundational — core mechanisms)
- **Stage 3**: T010-T013 (US1 — SKILL.md wiring)
- **Stage 4**: T014-T017 (US2 — test coverage)
- **Stage 5**: T018-T020 (Polish — final verification)

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (T004-T009)
- **US2 (P1)**: Starts after US1 — independent but complements

### Parallel Opportunities

- Tasks marked **[P]** can run in parallel
- T002, T003 in Phase 1 are parallel
- T006, T007 in Phase 2 are sequential (same file core/task-index.mjs)
- T014, T015, T016 in Phase 4 are parallel (separate test files)

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete US1 (T010-T013) — SKILL.md wiring
4. STOP and VALIDATE: Individual receipt verification tests pass
5. Minimal viable: flow_profile schema + receipt verification + basic SKILL.md wiring

### Incremental Delivery

1. Setup + Foundational → shared infrastructure ready
2. Add US1 → receipt verification wired into all stages
3. Add US2 → full test coverage
4. Polish → final verification

---

## Notes

- [P] tasks = different files, no dependencies
- Every task references at least one FR from spec.md (inline FR annotation)
- Do NOT touch scope-red-line files: make-decision SKILL.md, wh-review/ infra, worktree-reuse-guard.mjs
- D5 config.json writing and task-dir-parser integration: Step T008-T009 (design ready, code to build-code)
