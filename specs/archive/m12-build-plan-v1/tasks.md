# Tasks: m12-build-plan-v1

**Input**: Design documents from `specs/m12-build-plan-v1/`
**Prerequisites**: spec.md (authoritative, 3rd-reviewed), plan.md

**Tests**: Vitest (`npm test`). Test tasks verify existing project structure is intact; no new tests required at build-plan stage (tests belong to build-code stage per M6 contract).

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [TaskID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- Include exact file paths in descriptions
- Every task references at least one FR from spec.md

## Path Conventions

- **Core stage skills**: `workflows/<skill-name>/SKILL.md`
- **Aux skills (spec-plan/spec-tasks/spec-analyze)**: `skills/<skill-name>/SKILL.md`
- **Templates (aux skills)**: `skills/<skill-name>/templates/`
- **Registry**: `reuse-registry.md`
- **Artifacts**: `specs/m12-build-plan-v1/`
- **Constitution**: `constitution-checklist.md`, `CONSTITUTION.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and scaffold for this dogfood run

- [ ] T001 Create directory structure for 3 new workflow skills in `skills/spec-plan/`, `skills/spec-tasks/`, `skills/spec-analyze/`, and template subdirectories `skills/spec-plan/templates/`, `skills/spec-tasks/templates/`. FR: FR-MIG-001, FR-MIG-002.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core template files that ALL downstream skills depend on

- [ ] T003 Create `skills/spec-plan/templates/plan-template.md` — structured implementation plan template with sections: Summary, Technical Context, Constitution Check (21 clauses), Project Structure, Implementation Steps, F10 Gate, Verification Mapping. FR: FR-DECOUPLE-002, FR-MIG-002.
- [ ] T004 [P] Create `skills/spec-tasks/templates/tasks-template.md` — checklist-format task template with phases (Setup, Foundational, User Story phases, Polish), dependency ordering, parallel markers, FR mapping per task. FR: FR-DECOUPLE-002, FR-MIG-002, FR-MIG-003.

**Checkpoint**: Templates ready — downstream skills can now be built using these templates.

---

## Phase 3: User Story 1 — spec-plan skill: spec-to-plan generation (Priority: P1)

**Goal**: Create `skills/spec-plan/` skill that accepts task-id, reads spec.md, applies plan-template, writes plan.md

**Independent Test**: Run spec-plan with task-id="m12-build-plan-v1", verify plan.md is created at `specs/m12-build-plan-v1/plan.md` with all required sections (Summary, Technical Context, Constitution Check, Project Structure, Implementation Steps).

**FR Coverage**: FR-MIG-001, FR-MIG-002, FR-DECOUPLE-001, FR-DECOUPLE-002

### Implementation for User Story 1

- [ ] T005 [US1] Create `skills/spec-plan/SKILL.md` — skill definition with YAML frontmatter (name: spec-plan, description), input contract (task-id required, fail-loud if missing), workflow steps (read spec.md, load plan-template.md from `skills/spec-plan/templates/`, fill template from spec FRs and user scenarios, write plan.md to `specs/{task-id}/plan.md`), output contract. No git operations, no `.specify/` dependency. FR: FR-MIG-001, FR-MIG-002, FR-DECOUPLE-001, FR-DECOUPLE-002.
- [ ] T006 [US1] Verify spec-plan SKILL.md contains explicit fail-loud error for missing task-id: "task-id required" with non-zero exit. No branch inference fallback code. FR: FR-DECOUPLE-001.
- [ ] T007 [US1] Verify spec-plan template loading uses internal path `skills/spec-plan/templates/plan-template.md`, NOT `.specify/templates/`. Fail-loud if template not found at internal path. FR: FR-DECOUPLE-002.

**Gate**: spec-plan SKILL.md exists, task-id contract clear, template path internal-only.

---

## Phase 4: User Story 2 — spec-tasks skill: plan-to-tasks decomposition with stage grouping (Priority: P1)

**Goal**: Create `skills/spec-tasks/` skill that accepts task-id + optional `--stage N`, reads spec.md + plan.md, generates dependency-ordered tasks.md with FR mapping

**Independent Test**: Run spec-tasks with task-id="m12-build-plan-v1" and `--stage 3`, verify tasks.md is created at `specs/m12-build-plan-v1/tasks.md` with dependency annotations, FR mapping per task, and stage blocks (Stage 1/N, Stage 2/N, ... Stage M/N where M <= N).

**FR Coverage**: FR-MIG-001, FR-MIG-002, FR-MIG-003, FR-DECOUPLE-001, FR-DECOUPLE-002

### Implementation for User Story 2

- [ ] T008 [US2] Create `skills/spec-tasks/SKILL.md` — skill definition with YAML frontmatter (name: spec-tasks, description), input contract (task-id required, `--stage N` optional with N >= 1), workflow steps (read spec.md + plan.md, extract FRs and user scenarios, generate dependency-ordered tasks with FR mapping per task, optionally group into `## Stage N` blocks per stage parameter rules, write tasks.md to `specs/{task-id}/tasks.md`), output contract. FR: FR-MIG-001, FR-MIG-002, FR-MIG-003, FR-DECOUPLE-001, FR-DECOUPLE-002.
- [ ] T009 [US2] Verify spec-tasks SKILL.md enforces `--stage N` contract: (a) N is positive integer; (b) each task must be annotated with its stage and dependencies (format: `(stage:N, depends:<task-ids>)`) — all depends tasks must exist and their stage must be <= current task's stage; (c) `## Stage N` blocks produced with consecutive stage numbers from 1; (d) actual stage count <= N (don't force N blocks when dependency depth is shallower); (e) no `--stage` omits stage block headers but keeps dependency sorting and dependency annotations. FR: FR-MIG-003.
- [ ] T010 [US2] Verify spec-tasks SKILL.md enforces fail-loud for missing task-id and missing spec.md/plan.md. No git operations, no `.specify/` dependency, template loaded from `skills/spec-tasks/templates/tasks-template.md`. FR: FR-DECOUPLE-001, FR-DECOUPLE-002.

**Gate**: spec-tasks SKILL.md exists, stage grouping contract clear, dependency sorting enforced.

---

## Phase 5: User Story 3 — spec-analyze skill: 3-artifact consistency scan (Priority: P2)

**Goal**: Create `skills/spec-analyze/` skill that accepts task-id, loads spec.md + plan.md + tasks.md, performs cross-file consistency scan, outputs read-only analysis report with 4 problem types

**Independent Test**: Run spec-analyze with task-id="m12-build-plan-v1", verify analysis report exists at `specs/m12-build-plan-v1/` with at minimum a summary line, and any non-summary findings have all 5 required fields (type, source_artifact, target_artifact, fr_or_task_id, line_or_anchor).

**FR Coverage**: FR-MIG-001, FR-MIG-002, FR-XARTIFACT-001, FR-XARTIFACT-002, FR-DECOUPLE-003

### Implementation for User Story 3

- [ ] T011 [US3] Create `skills/spec-analyze/SKILL.md` — skill definition with YAML frontmatter (name: spec-analyze, description), input contract (task-id required; spec.md, plan.md, tasks.md must all exist; fail-loud if any missing), workflow steps (load all 3 artifacts, scan for 4 problem types — inconsistency, duplicate, ambiguity, underdefined; for each non-summary finding record all 5 fields: type, source_artifact, target_artifact, fr_or_task_id, line_or_anchor; if no problems found, output only a summary line "无一致性问题"), output contract (report written to `specs/{task-id}/cross-artifact-analysis.md`, read-only, does not block downstream progress). FR: FR-MIG-001, FR-MIG-002, FR-XARTIFACT-001, FR-XARTIFACT-002, FR-DECOUPLE-003.
- [ ] T012 [US3] Verify spec-analyze SKILL.md requires all 5 fields for non-summary findings and treats missing-field findings as invalid (report considered non-compliant). Verify report does not block — existence of inconsistency findings must not prevent normal completion. FR: FR-XARTIFACT-001, FR-XARTIFACT-002.
- [ ] T013 [US3] Verify spec-analyze SKILL.md locates artifacts via task-id derivation (`specs/{task-id}/spec.md`, `specs/{task-id}/plan.md`, `specs/{task-id}/tasks.md`), NOT via git branch or `.specify/`. Verify report is written to fixed path `specs/{task-id}/cross-artifact-analysis.md` and referenced in stage-result `facts.analysis_ref`. FR: FR-DECOUPLE-003.

**Gate**: spec-analyze SKILL.md exists, 5-field contract clear, non-blocking semantics verified.

---

## Phase 6: User Story 4 — build-plan v1 upgrade: main orchestrator + constitution check + baseline + human review (Priority: P2)

**Goal**: Upgrade `workflows/build-plan/SKILL.md` to orchestrate the full v1 pipeline: spec-plan → spec-tasks → spec-analyze → constitution compliance check (21 clauses) → M10 baseline comparison (5 metrics) → human review checkpoint → stage-result + metrics

**Independent Test**: Read `workflows/build-plan/SKILL.md` and grep-verify: (a) references to spec-plan/spec-tasks/spec-analyze exist; (b) constitution-checklist 21-clause reference exists; (c) M10 baseline-report.md 5-metric reference exists; (d) human review pause marker exists exactly once; (e) F10 4-question gate present; (f) stage-result contract includes plan_ref + tasks (M6) + tasks_ref (v1 new) + review object.

**FR Coverage**: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-CONSTITUTION-002, FR-CONSTITUTION-003, FR-BASELINE-001, FR-BASELINE-002, FR-BASELINE-003, FR-REVIEW-001, FR-SKELETON-001, FR-SKELETON-002

### Implementation for User Story 4

- [ ] T014 [US4] Upgrade `workflows/build-plan/SKILL.md` — replace M6 thin skeleton with v1 orchestrator: (a) read spec from upstream build-spec; (b) call spec-plan with task-id; (c) call spec-tasks with task-id + --stage N; (d) call spec-analyze with task-id, producing report at `specs/{task-id}/cross-artifact-analysis.md`; (e) perform constitution compliance check by reading `constitution-checklist.md` and filling all 21 clauses (F1-F10, Q1-Q3, S1-S8) with `[x]`/`[ ]` + rationale; (f) perform M10 baseline comparison using `specs/archive/m10-baseline-switch/baseline-report.md` as baseline values; (g) pause at human review checkpoint (exactly one occurrence) for manual confirmation; (h) produce stage-result JSON with plan_ref, tasks, tasks_ref (new), analysis_ref (new), review object; (i) call metrics collector (recordSkeleton + updateOwnResult). FR: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-BASELINE-001, FR-REVIEW-001, FR-SKELETON-002.
- [ ] T015 [US4] Verify constitution compliance check in build-plan SKILL.md: all 21 clauses present, each requires `[x]` or `[ ]` + rationale text, missing any clause or missing rationale for any clause = "incomplete output" failure (FR-CONSTITUTION-003). Check result is recorded not blocking (FR-CONSTITUTION-002). FR: FR-CONSTITUTION-001, FR-CONSTITUTION-002, FR-CONSTITUTION-003.
- [ ] T016 [US4] Verify baseline comparison in build-plan SKILL.md: 5 metrics (missed_step_rate, test_execution_rate, review_execution_rate, rework_rounds, rework_proxy_count) with M10 baseline values (0.05, 0.8295, 1, 6.075, 25.25). At build-plan stage, all 5 M12 values must be `unknown` with individual per-metric reasons (missed_step_rate: only upstream make-decision/build-spec records available, full 5-stage unavailable; test_execution_rate: build-plan stage has no test execution data; review_execution_rate: review stage not yet executed; rework_rounds: full pipeline not completed; rework_proxy_count: full pipeline not completed). Delta column must also be `unknown` for all 5 rows. No placeholder values (0, "-", "--") permitted. The build-plan SKILL.md must NOT reference build-plan's own not-yet-written metrics or build-code/verify-code metrics. Metric `rework_proxy_count` must use exact name (no aliases). Threshold set by human, non-blocking. FR: FR-BASELINE-001, FR-BASELINE-002, FR-BASELINE-003.
- [ ] T017 [US4] Verify human review checkpoint in build-plan SKILL.md: exactly one pause marker, stage-result includes `review` object with fields state/pending|approved|rejected), reviewer, timestamp, decision (non-empty in all 3 states), notes. Pending state produces valid stage-result (no omission). FR: FR-REVIEW-001.
- [ ] T018 [US4] Verify F10 anti-over-engineering gate retained in build-plan v1 SKILL.md: all 4 questions present ("What real threat does this defend against?", "Does any existing mechanism already cover it?", "Can it be bypassed?", "What is the long-term maintenance cost?"). FR: FR-SKELETON-001.
- [ ] T019 [US4] Verify M6 stage-result contract preserved: status/error_code/retryable/missing_items/user_decision/reason fields unchanged; facts.plan_ref and facts.tasks retained from M6; facts.tasks_ref and facts.analysis_ref added as v1 new fields (not replacing existing fields). metrics collector calls (recordSkeleton + updateOwnResult, 10 core fields) preserved. FR: FR-BP-003, FR-SKELETON-002.

**Gate**: build-plan v1 SKILL.md contains all 7 orchestrated steps, F10 gate present, M6 contract preserved, review object defined, stages: analysis_ref in stage-result.

---

## Phase 7: User Story 5 — reuse-registry registration (Priority: P3)

**Goal**: Append 3 rows to `reuse-registry.md` for spec-plan, spec-tasks, spec-analyze

**Independent Test**: `grep -c "spec-plan\|spec-tasks\|spec-analyze" reuse-registry.md` returns 3 matches, each with category "外部改造适配" and non-empty source path.

**FR Coverage**: FR-REGISTRY-001, FR-REGISTRY-002

### Implementation for User Story 5

- [ ] T020 [US5] Append 3 rows to `reuse-registry.md`: spec-plan (类别=外部改造适配, 来源=~/.claude/skills/speckit-plan/SKILL.md), spec-tasks (类别=外部改造适配, 来源=~/.claude/skills/speckit-tasks/SKILL.md), spec-analyze (类别=外部改造适配, 来源=~/.claude/skills/speckit-analyze/SKILL.md). FR: FR-REGISTRY-001.
- [ ] T021 [US5] Verify all 3 rows: category is legal enum value ("外部改造适配", "自研", "外部依赖", "改造适配", "其他平台原生"), source path is non-empty. FR: FR-REGISTRY-002.

**Gate**: 3 rows present, category legal, source non-empty.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Scope boundary verification and constitution compliance confirmation

- [ ] T022 [P] Verify scope boundary: `git diff` shows no changes to `workflows/build-code/SKILL.md`, `workflows/verify-code/SKILL.md`. FR: FR-SCOPE-001.
- [ ] T023 [P] Verify scope boundary: `git diff` shows no changes to `skills/spec-specify/`, `skills/spec-clarify/`, `workflows/build-spec/SKILL.md`, `workflows/make-decision/SKILL.md`, 3rd-review skill paths. FR: FR-SCOPE-002.
- [ ] T024 [P] Verify naming compliance: check (a) `skills/` directory basenames are spec-plan / spec-tasks / spec-analyze (mirroring speckit source per FR-MIG-001), (b) SKILL.md skill name fields match spec-plan/spec-tasks/spec-analyze, (c) no "speckit-plan", "speckit-tasks", or "speckit-analyze" appear as skill identifiers in `skills/` or `workflows/` (exempt: reuse-registry.md source paths, provenance footnotes, comments). FR: FR-MIG-001.
- [ ] T025 Run `npm test` to confirm no regressions. Verify constitution-checklist.md still has exactly 21 entries matching CONSTITUTION.md. FR: FR-CONSTITUTION-001, FR-CONSTITUTION-003, FR-SCOPE-001, FR-SCOPE-002, FR-SKELETON-002.
- [ ] T026 Verify M12 self-dogfood: build-plan v1 workflow can be executed against its own spec (`specs/m12-build-plan-v1/spec.md`) to produce plan.md + tasks.md — all required sections present, all tasks FR-mapped, constitution check filled. FR: FR-BP-001, FR-BP-002.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — directory structure must exist
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) — plan-template.md must exist
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) — tasks-template.md must exist
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) — directory structure must exist
- **User Story 4 (Phase 6)**: Depends on US1 + US2 + US3 (Phases 3-5) — sub-skills must be built before orchestrator can reference them
- **User Story 5 (Phase 7)**: Can start after US1 + US2 + US3 (Phases 3-5) — needs skill names resolved
- **Polish (Phase 8)**: Depends on all prior phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 (P2)**: Can start after Foundational — no dependencies on US1 (uses its own template)
- **US3 (P2)**: Can start after Foundational — no dependencies on US1/US2
- **US4 (P2)**: Depends on US1, US2, US3 — orchestrator references all sub-skills
- **US5 (P3)**: Depends on US1, US2, US3 — needs skill names for registration

### Parallel Opportunities

- T001 runs alone in Setup (directory structure creation only)
- T003 and T004 can run in parallel (Foundational - different template files)
- Phases 3 (US1), 4 (US2), 5 (US3) can ALL run in parallel after Foundational — independent skill files
- T021 depends on T020 (T021 validates T020's registry writes; running in parallel risks read-before-write)
- T022, T023, T024 within Polish can run in parallel (independent file checks)

### Within Each User Story

- SKILL.md creation before verification tasks
- Contract verification tasks can run after SKILL.md is written

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (templates ready)
3. Complete Phase 3: spec-plan (US1) + Phase 4: spec-tasks (US2) in parallel
4. **STOP and VALIDATE**: spec-plan and spec-tasks independently produce plan.md and tasks.md
5. Minimal viable: can already generate plan+tasks from spec

### Incremental Delivery

1. Setup + Foundational -> templates ready
2. Add US1 (spec-plan) + US2 (spec-tasks) in parallel -> plan+tasks generation works (MVP!)
3. Add US3 (spec-analyze) -> consistency scanning works
4. Add US4 (build-plan v1 upgrade + constitution + baseline + review) -> full pipeline orchestration
5. Add US5 (reuse-registry) -> provenance tracking complete
6. Polish: scope verification + dogfood validation

### Parallel Team Strategy

With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: spec-plan (US1)
   - Developer B: spec-tasks (US2)
   - Developer C: spec-analyze (US3) + reuse-registry (US5)
3. Once US1-3 complete:
   - Developer A: build-plan v1 upgrade (US4)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Every task references at least one FR from spec.md (FR column or inline)
- Do NOT touch `workflows/build-code/SKILL.md`, `workflows/verify-code/SKILL.md`, or design-stage skills
- Constitution compliance check must cover all 21 clauses, no missing items
- Baseline comparison must use `unknown` + reason for unavailable metrics, never placeholders
- F10 gate (4 questions) must be retained in v1 SKILL.md
- Stage-result contract: M6 fields retained, v1 adds tasks_ref + analysis_ref + review object
