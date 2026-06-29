# Tasks: {task-id}

**Input**: Design documents from `specs/{task-id}/`
**Prerequisites**: spec.md (authoritative, 3rd-reviewed), plan.md
<!-- 生成时替换 {task-id} 为实际的 task-id 字面量 -->

**Tests**: <!-- 测试说明，如 "Vitest (`npm test`)" -->

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [TaskID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- Include exact file paths in descriptions
- Every task references at least one FR from spec.md

## Path Conventions

- **Workflow skills**: `workflows/<skill-name>/SKILL.md`
- **Templates**: `workflows/<skill-name>/templates/`
- **Registry**: `reuse-registry.md`
- **Artifacts**: `specs/{task-id}/`
- **Constitution**: `constitution-checklist.md`, `CONSTITUTION.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and scaffold

- [ ] T001 Create ... FR: <!-- FR 映射 -->
- [ ] T002 [P] Create ... FR: <!-- FR 映射 -->

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core files that ALL downstream phases depend on

- [ ] T003 Create ... FR: <!-- FR 映射 -->
- [ ] T004 [P] Create ... FR: <!-- FR 映射 -->

**Checkpoint**: <!-- 此阶段完成后的检查点说明 -->

---

## Phase 3: User Story 1 — [Story Name] (Priority: P1)

**Goal**: <!-- 本用户故事的目标 -->

**Independent Test**: <!-- 如何独立测试本用户故事 -->

**FR Coverage**: <!-- 覆盖的 FR 列表 -->

### Implementation for User Story 1

- [ ] T005 [US1] Create ... FR: <!-- FR 映射 -->
- [ ] T006 [US1] Verify ... FR: <!-- FR 映射 -->

**Gate**: <!-- 门禁条件 -->

---

## Phase 4: User Story 2 — [Story Name] (Priority: P1/P2)

**Goal**: <!-- 同上 -->

**Independent Test**: <!-- 同上 -->

**FR Coverage**: <!-- 同上 -->

### Implementation for User Story 2

- [ ] T007 [US2] Create ... FR: <!-- FR 映射 -->
- [ ] T008 [P] [US2] Verify ... FR: <!-- FR 映射 -->

**Gate**: <!-- 门禁条件 -->

---

<!-- 按需补充更多 User Story Phase：Phase 5, Phase 6, ... -->

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and scope boundary checks

- [ ] T020 [P] Verify scope boundary: ... FR: <!-- FR 映射 -->
- [ ] T021 [P] Run full test suite: ... FR: <!-- FR 映射 -->

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1)
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2)
- **Polish (Phase N)**: Depends on all prior phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational
- **US2 (P1/P2)**: Can start after Foundational — independent of US1

### Parallel Opportunities

- Tasks marked **[P]** can run in parallel
- Independent user stories can be implemented concurrently after Foundational

### Within Each User Story

- SKILL.md creation before verification tasks
- Contract verification tasks can run after SKILL.md is written

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete the highest-priority User Story
4. **STOP and VALIDATE**: Independent test passes
5. Minimal viable: core functionality works

### Incremental Delivery

1. Setup + Foundational -> shared infrastructure ready
2. Add US1 -> first capability
3. Add US2 -> second capability (can parallel with US1)
4. Polish -> final verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Every task references at least one FR from spec.md (FR column or inline)
- Do NOT touch scope-red-line files listed in the plan

---

## Stage Block Syntax

<!--
  当 spec-tasks 被调用时传入 `--stage N` 参数（N >= 1），tasks.md 可选产出阶段分块。
  每个阶段以 `## Stage N` 二级标题起块，块内任务标注所属阶段和依赖关系。

  示例：

  ## Stage 1

  - [ ] T001 Create directory structure... (stage:1, depends:无)

  ## Stage 2

  - [ ] T002 Create core template file... (stage:2, depends:T001)
  - [ ] T003 [P] Create another file... (stage:2, depends:T001)

  约束规则（FR-MIG-003）：
  - N 为正整数，阶段序号从 1 连续递增，不跳跃
  - 每个任务必须标注 `(stage:N, depends:<task-ids>)` 格式
  - depends 中被依赖的任务必须存在，且其 stage <= 当前任务 stage
  - 实际阶段块数不得大于 N，依赖深度不足时块数可小于 N（不强制凑齐 N 块）
  - 未传入 `--stage` 参数时，不输出 `## Stage N` 阶段块标题，但仍按依赖排序
  - 同阶段内任务可并行
-->
