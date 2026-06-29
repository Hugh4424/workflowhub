# Implementation Plan: M12 build-plan v1

**Task ID**: `m12-build-plan-v1` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/m12-build-plan-v1/spec.md`
**Status**: Phase 1 complete (manual speckit-plan workflow applied; setup-plan.sh blocked on main branch)

## Summary

Upgrade `workflows/build-plan/SKILL.md` from M6 thin skeleton (v1.0.0, ~3.5KB) to a full v1, integrating three migrated skills (spec-plan, spec-tasks, spec-analyze) adapted from speckit-plan/speckit-tasks/speckit-analyze. Add cross-artifact consistency scanning, constitution compliance check (21 clauses), M10 baseline metrics comparison, a human review checkpoint, and reuse-registry registration. All three new skills are decoupled from per-project `.specify/` and git-branch inference — they accept explicit task-id parameters and load templates from workflowhub internal paths.

This is workflowhub's second dogfood milestone: M12 build-plan v1 will generate its own plan.md and tasks.md via the speckit-method workflow (manual path due to branch coupling), proving the decoupled architecture works.

## Technical Context

**Language/Version**: Markdown (SKILL.md prompt files), Bash (shell scripts for setup, where needed), Node.js (metrics/collector.mjs)
**Primary Dependencies**: None (pure prompt/skill files, no runtime dependencies); speckit-plan/speckit-tasks/speckit-analyze SKILL.md as source material for adaptation
**Storage**: Filesystem — `specs/{task-id}/` for artifacts, `workflows/` (core stage skills) and `skills/` (aux skills) for skill definitions, `reuse-registry.md` for registration
**Testing**: `npm test` (existing project test suite); manual end-to-end walkthrough of build-plan v1 workflow
**Target Platform**: Claude Code / Multica agent runtime; any environment with filesystem access to workflowhub repo
**Project Type**: AI workflow orchestration tool (skill/prompt-based pipeline)
**Performance Goals**: N/A (prompt orchestration, no runtime perf targets)
**Constraints**: Zero per-project clone/init; must not touch build-code/verify-code or design-stage skills; must preserve M6 skeleton (F10 gate, stage-result contract, metrics collector)
**Scale/Scope**: 3 new workflow directories (spec-plan, spec-tasks, spec-analyze) + 1 upgraded SKILL.md + 3 reuse-registry rows; ~4 new SKILL.md files, ~2 template files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Every plan MUST explicitly answer these gates. For workflowhub, the applicable gates are the project's own 21-clause constitution (CONSTITUTION.md). This section fills all 21 clauses from constitution-checklist.md.

### Framework Principles (F)

- [x] **F1 薄核心** — 判据：核心只做调度编排，重活下沉技能层。build-plan v1 SKILL.md 作为主控编排 spec-plan → spec-tasks → spec-analyze → 宪法检查 → baseline 对照，重活全部下沉到独立的子技能（`skills/spec-plan/` 等），符合薄核心原则。
- [x] **F2 窄契约** — 判据：模块间走窄而明确的接口。所有子技能通过 task-id 参数 + 产物路径（`specs/{task-id}/spec.md` → `plan.md` → `tasks.md` → analyze 报告）与主控交互，不暴露内部实现。
- [x] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实机器客观采集且不阻断。宪法符合性检查逐条勾选（21 条全部有状态 + 判据）、spec-analyze 报告均只记录不阻断；baseline 对照采集 metrics 但不阻断。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡按需添加，无用即移除。唯一新增的 gate 为 F10 反过度工程 gate（延续 M6），非新增阻断门。
- [x] **F6 统一外置执行记录** — 判据：进度/指标/回溯统一记录可回溯。保留 M6 的 metrics collector 调用（recordSkeleton + updateOwnResult），stage-result 落盘可回溯。
- [x] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作经人边界确认。人审检查点在 stage-result 产前停顿等人确认；pending/rejected 均记录，不自动越过。
- [x] **F8 简单优先** — 判据：选更简单依赖更少的方案，不写掩盖问题的兜底。task-id 显式参数方案（代替分支推断）、内置模板路径（代替 `.specify/` 依赖）均为更简单方案；参数缺失 fail-loud，不静默回退。
- [x] **F9 可证伪不假绿** — 判据：检查在"实际为假"时真报失败、缺数据标未知。宪法检查缺条缺判据即失败；baseline 对照不可得指标写 `unknown` + 原因，不写占位值；FR 映射缺失即判 tasks.md 不完整。
- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化真实收益大于长期维护成本。不新增 CI/gate/自动校验基建；宪法检查人逐条勾；analyze 纯文本分析不含自动修复。F10 gate 自身在 plan.md 产前执行 4 问，过滤低收益机制。

### Quality Principles (Q)

- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
- [x] **Q2 gate 三类划分** — 判据：关卡分入口校验/记录采集/人工确认三类。入口校验（spec 存在、task-id 传入）、记录采集（宪法勾选、analyze 报告、baseline 对照、metrics）、人工确认（人审检查点）三类清晰分离。
- [x] **Q3 异源审查加人工把关** — 判据：质量裁决由独立来源独立上下文产出，无自审自判。spec.md 已经过异源 3rd-review（M11）；plan.md/tasks.md 由人审检查点确认。

### Skill Principles (S)

- [x] **S1 能用外部就不造轮子** — 判据：优先复用外部技能。spec-plan / spec-tasks / spec-analyze 三技能从 speckit-plan/speckit-tasks/speckit-analyze 改造迁移，文件直放 workflowhub `skills/` 内。
- [x] **S2 外部技能可针对项目改造合宪** — 判据：外部技能按需改造至合宪。speckit 原版依赖 per-project `.specify/` 和 git 分支推断，M12 改造为 task-id 显式参数 + 内置模板路径，使其合 workflowhub 宪（F2 窄契约、F8 简单优先）。
- [x] **S3 迭代时保持最新并就地检查** — 判据：迭代时查更新/更优，来源路径写进技能文件。三技能在 reuse-registry.md 登记来源路径（speckit-plan/tasks/analyze SKILL.md），后续迭代可追踪上游。
- [x] **S4 自定义技能必须有指标系统** — 判据：自研技能配套指标纳入统一执行记录。build-plan v1 保留 M6 的 metrics collector 调用（recordSkeleton + updateOwnResult），三子技能在 build-plan v1 流程内运行，其指标由主控 metrics 记录覆盖。
- [x] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能便于子代理调用，减少主上下文占用。三子技能设计为独立可调起的 workflow（各含 SKILL.md），可由子代理在独立上下文中调用。
- [x] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能参考成熟方案优化。三技能核心逻辑参考 speckit-plan/tasks/analyze 的成熟设计（依赖排序、任务分组、跨产物一致性扫描），不闭门造车。
- [x] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流一一对应独立、按目录约定。spec-plan / spec-tasks / spec-analyze 各为独立 `skills/` 目录（aux skill），build-plan 主控为 `workflows/build-plan/`（core stage skill），按目录约定组织。
- [x] **S8 自定义技能可独立调用可搬运** — 判据：自研技能可独立调用、可跨宿主搬运、不绑死环境。三技能接受显式 task-id 参数 + 内部模板路径，不依赖目标项目状态，可搬运到其他 workflowhub 实例或独立调用。

**Constitution Check Result**: 21/21 clauses addressed. All gates pass. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/m12-build-plan-v1/
├── spec.md                  # Build-spec output (authoritative, 3rd-reviewed)
├── plan.md                  # This file (speckit-plan workflow output)
├── tasks.md                 # Phase 2 output (speckit-tasks workflow)
└── speckit-regen-log.md     # Generation log for this regeneration
```

### Source Code (repository root)

```text
workflows/
├── build-plan/
│   └── SKILL.md              # UPGRADED: v1 main orchestrator
├── build-code/               # UNCHANGED (FR-SCOPE-001)
│   └── SKILL.md
├── verify-code/              # UNCHANGED (FR-SCOPE-001)
│   └── SKILL.md
├── build-spec/               # UNCHANGED (FR-SCOPE-002)
└── make-decision/            # UNCHANGED (FR-SCOPE-002)

skills/
├── spec-plan/                # NEW: speckit-plan adaptation
│   ├── SKILL.md
│   └── templates/
│       └── plan-template.md
├── spec-tasks/               # NEW: speckit-tasks adaptation
│   ├── SKILL.md
│   └── templates/
│       └── tasks-template.md
├── spec-analyze/             # NEW: speckit-analyze adaptation
│   └── SKILL.md
├── spec-specify/             # UNCHANGED (FR-SCOPE-002)
└── spec-clarify/             # UNCHANGED (FR-SCOPE-002)

specs/m12-build-plan-v1/     # Artifact directory for this task
reuse-registry.md             # UPDATED: +3 rows
constitution-checklist.md     # READ-ONLY: referenced by build-plan v1
metrics/
└── collector.mjs             # UNCHANGED: called by build-plan v1
```

**Structure Decision**: Follows S7 "一阶段一技能、一工作流一文件夹". Three new aux skill directories under `skills/` (`spec-plan/`, `spec-tasks/`, `spec-analyze/`) each contain a SKILL.md defining the skill's contract. Templates live inside the skill's own `templates/` subdirectory (not in `.specify/`), enabling zero per-project clone. Core stage skills remain under `workflows/`.

## Complexity Tracking

> No constitution violations requiring justification. 21/21 clauses pass.

No new mechanisms beyond what the spec requires. F10 gate applied before finalizing (see below).

## F10 Anti-Over-Engineering Gate

Applied to every new mechanism proposed in this plan before finalizing.

| Mechanism | Q1: Real threat? | Q2: Existing cover? | Q3: Bypassable? | Q4: Maintenance cost? | Keep? |
|---|---|---|---|---|---|
| spec-analyze report | Real: FR missing from tasks, spec/plan mismatch observed in practice | No existing cross-artifact check in workflowhub | No — analysis is informational, bypass doesn't create harm | Low: pure text scan, no runtime dependency | KEEP |
| constitution compliance check (21 clause) | Real: design drift from constitution observed in prior milestones | constitution-checklist.md exists but not mechanically invoked in build-plan | No — human review is the enforcement, not automation | Low: one-time template fill per plan | KEEP |
| M10 baseline comparison | Real: need to track whether new workflow improves or degrades metrics | M10 baseline-report.md exists, not consumed by build-plan before | No — non-blocking, informational only | Low: 5-row table filled per plan | KEEP |
| reuse-registry registration | Real: external skill provenance tracking required by D15/D16 | reuse-registry.md exists but missing plan/tasks/analyze entries | N/A — this IS the mechanism | Very low: 3 markdown rows | KEEP |
| human review checkpoint | Real: unreviewed plans have caused downstream rework in prior milestones | No formal review checkpoint in build-plan before | Bypass results in "pending" (not false green) | Low: one pause point in SKILL.md | KEEP |

**F10 Gate Result**: 5 mechanisms evaluated, 5 kept, 0 pruned. All have real observed threats or regulatory requirements (D15/D16), not hypothetical.

## Implementation Steps

### Step 1: Create spec-plan skill (`skills/spec-plan/`)

- Create `skills/spec-plan/SKILL.md` — defining the skill: accepts task-id parameter, reads `specs/{task-id}/spec.md`, applies built-in plan template, writes `specs/{task-id}/plan.md`
- Create `skills/spec-plan/templates/plan-template.md` — structured template with Summary, Technical Context, Constitution Check, Project Structure, Implementation Steps sections
- Contract: task-id required; fail-loud if missing; no git operations; no `.specify/` dependency

**Files**: `skills/spec-plan/SKILL.md` (NEW), `skills/spec-plan/templates/plan-template.md` (NEW)
**Maps to**: FR-MIG-001, FR-MIG-002, FR-DECOUPLE-001, FR-DECOUPLE-002

### Step 2: Create spec-tasks skill (`skills/spec-tasks/`)

- Create `skills/spec-tasks/SKILL.md` — accepts task-id + optional `--stage N`; reads spec.md + plan.md; generates dependency-ordered tasks.md with FR mapping
- Create `skills/spec-tasks/templates/tasks-template.md` — checklist-format template with phases (Setup, Foundational, User Stories, Polish)
- Contract: task-id required; `--stage N` optional (N >= 1, caps stages at N); fail-loud on missing inputs; FR mapping per task

**Files**: `skills/spec-tasks/SKILL.md` (NEW), `skills/spec-tasks/templates/tasks-template.md` (NEW)
**Maps to**: FR-MIG-001, FR-MIG-002, FR-MIG-003, FR-DECOUPLE-001, FR-DECOUPLE-002

### Step 3: Create spec-analyze skill (`skills/spec-analyze/`)

- Create `skills/spec-analyze/SKILL.md` — accepts task-id; loads spec.md + plan.md + tasks.md; performs cross-file consistency scan for 4 problem types (inconsistency, duplicate, ambiguity, underdefined)
- Contract: task-id required; three artifacts must all exist; output is read-only analysis report written to `specs/{task-id}/cross-artifact-analysis.md`; each non-summary finding must have 5 fields (type, source_artifact, target_artifact, fr_or_task_id, line_or_anchor); report does not block progress. Summary-only reports (no findings) write "无一致性问题".

**Files**: `skills/spec-analyze/SKILL.md` (NEW)
**Maps to**: FR-MIG-001, FR-MIG-002, FR-XARTIFACT-001, FR-XARTIFACT-002, FR-DECOUPLE-003

### Step 4: Upgrade build-plan SKILL.md to v1

- Rewrite `workflows/build-plan/SKILL.md` to orchestrate full v1 workflow: read spec → call spec-plan → call spec-tasks → call spec-analyze → execute constitution compliance check (21 clauses from constitution-checklist.md) → execute M10 baseline 5-metric comparison → human review checkpoint → produce stage-result + metrics
- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
- Add `review` object to stage-result JSON (state, reviewer, timestamp, decision, notes)
- Add `facts.analysis_ref` to stage-result JSON (pointing to `specs/{task-id}/cross-artifact-analysis.md`)
- Add explicit pause text for human review checkpoint

**Files**: `workflows/build-plan/SKILL.md` (MODIFY)
**Maps to**: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-CONSTITUTION-002, FR-CONSTITUTION-003, FR-BASELINE-001, FR-BASELINE-002, FR-BASELINE-003, FR-REVIEW-001, FR-SKELETON-001, FR-SKELETON-002

### Step 5: Update reuse-registry.md

- Append 3 rows to reuse-registry.md:
  - spec-plan | 外部改造适配 | ~/.claude/skills/speckit-plan/SKILL.md
  - spec-tasks | 外部改造适配 | ~/.claude/skills/speckit-tasks/SKILL.md
  - spec-analyze | 外部改造适配 | ~/.claude/skills/speckit-analyze/SKILL.md

**Files**: `reuse-registry.md` (MODIFY)
**Maps to**: FR-REGISTRY-001, FR-REGISTRY-002

### Scope Boundary Verification

**DO NOT TOUCH** (FR-SCOPE-001, FR-SCOPE-002):
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `skills/spec-specify/SKILL.md` and `skills/spec-specify/templates/`
- `skills/spec-clarify/SKILL.md` and `skills/spec-clarify/templates/`
- `workflows/build-spec/SKILL.md`
- `workflows/make-decision/SKILL.md`
- 3rd-review skill (external)

## Verification Mapping

| Step | Maps to FRs | Verified by AC |
|---|---|---|
| Step 1: spec-plan | FR-MIG-001, FR-MIG-002, FR-DECOUPLE-001, FR-DECOUPLE-002 | AC1, AC7 |
| Step 2: spec-tasks | FR-MIG-001, FR-MIG-002, FR-MIG-003, FR-DECOUPLE-001, FR-DECOUPLE-002 | AC1, AC7 |
| Step 3: spec-analyze | FR-MIG-001, FR-MIG-002, FR-XARTIFACT-001, FR-XARTIFACT-002, FR-DECOUPLE-003 | AC3, AC7 |
| Step 4: build-plan v1 upgrade | FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001/002/003, FR-BASELINE-001/002/003, FR-REVIEW-001, FR-SKELETON-001/002 | AC1, AC2, AC4, AC6 |
| Step 5: reuse-registry | FR-REGISTRY-001, FR-REGISTRY-002 | AC5 |
