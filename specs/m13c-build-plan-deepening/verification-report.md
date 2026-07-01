# Phase-4 验收报告：m13c-build-plan-deepening

> issue: ZHI-46  
> worktree: `/Users/Hugh/Hugh/Project/workflowhub-m13c-build-code`  
> phase: phase-4 (T009-T011)  
> run timestamp: 2026-07-01T07:50Z / 2026-07-01T07:51Z  
> verifier: Coder agent

---

## T009 — task_dir 解析器测试

### 命令

```bash
npx vitest run core/task-dir-parser.test.mjs
```

### 结果

| 指标 | 值 |
|------|-----|
| Test Files | 1 passed (1) |
| Tests | 2 passed (2) |
| exit_code | 0 |
| 证据 | `.phase-evidence/phase-4-t009-taskdir-green.json` |

覆盖场景：

1. `config/workflowhub.yaml` 显式配置 `task_dir: tasks/` → 返回 `tasks/`。
2. 配置文件不存在 → 回退到 `~/Knowledge/workflowhub/`。

### 全量测试套件状态（参考）

```bash
npx vitest run
```

| 指标 | 值 |
|------|-----|
| Test Files | 2 failed \| 47 passed (49) |
| Tests | 7 failed \| 880 passed (887) |
| exit_code | 1 |
| 证据 | `.phase-evidence/phase-4-t009-full-run.json` |

失败用例均位于 `core/__tests__/check-extensibility.test.mjs` 与 `core/__tests__/run-checks.test.mjs`，与 task_dir 解析器无关。task_dir 解析器专属测试全部通过。

---

## T010 / T011 — 验收条件（AC-01 ~ AC-19）扫描

扫描命令汇总见证据文件 `.phase-evidence/phase-4-ac-scan.json` 及其 stdout。

### AC 明细

| AC | 检查内容 | grep 命中位置 | 结论 |
|----|----------|---------------|------|
| AC-01 | `skills/spec-research/SKILL.md` 存在，含 task-id 输入与 research.md 产出 | `skills/spec-research/SKILL.md:5`, `:22`, `:34`, `:55`, `:81`, `:89` | pass |
| AC-02 | `workflows/build-plan/SKILL.md` Phase 0 调用 spec-research | `workflows/build-plan/SKILL.md:16`, `:20`, `:22`, `:24`, `:26` | pass |
| AC-03 | `workflows/build-plan/SKILL.md` Phase 1 含 data-contracts 步骤 | `workflows/build-plan/SKILL.md:16`, `:46`, `:50`, `:51`, `:53`, `:189`, `:244`, `:250`, `:268` | pass |
| AC-04 | data-contracts 步骤在 tasks.md 分解之前 | Step 1.5 (`:46`) 在 Step 2 (`:55`) 与 Step 3 (`:72`) 之前 | pass |
| AC-05 | spec-plan 前置阶段调用 simplicity-guard | `workflows/build-plan/SKILL.md:58`, `:60`, `:61`, `:246`, `:270` | pass |
| AC-06 | stage-result.facts 含 minimal-path 字段 | `workflows/build-plan/SKILL.md:60`, `:62`, `:193`, `:246`, `:270` | pass |
| AC-07 | `workflows/build-plan/SKILL.md` 含 plan-reviewer 调用，且无新 skill 文件 | `workflows/build-plan/SKILL.md:16`, `:167`, `:174`, `:250`; `skills/spec-plan-review/` 不存在 | pass |
| AC-08 | plan-reviewer 产出 `specs/{task-id}/plan-eng-review.md` | `workflows/build-plan/SKILL.md:173`, `:175`, `:190`, `:245`, `:269` | pass |
| AC-09 | plan-reviewer 失败时记录+升级人工，非硬阻断 | `workflows/build-plan/SKILL.md:16`, `:173`, `:176`, `:250` | pass |
| AC-10 | `skills/spec-analyze/SKILL.md` facts 含 ambiguity_items[] | `skills/spec-analyze/SKILL.md:75`, `:90`, `:186`, `:194`, `:205` | pass |
| AC-11 | ambiguity_items 每项含 escalation_path（三选一） | `skills/spec-analyze/SKILL.md:80`, `:85`, `:89`, `:197`, `:205`, `:206` | pass |
| AC-12 | `skills/spec-tasks/SKILL.md` 含 no-placeholder 铁律 | `skills/spec-tasks/SKILL.md:96`, `:98`, `:99`, `:102`, `:105`, `:106`, `:176` | pass |
| AC-13 | placeholder 发现时标记 blocking_item | `skills/spec-tasks/SKILL.md:101`, `:176` | pass |
| AC-14 | tasks.md 格式含 STOP/Knowledge 标签 + upstream_delta 字段约定 | `skills/spec-tasks/SKILL.md:110`, `:113`, `:114`, `:116`, `:118`, `:123`, `:126`, `:167`, `:177` | pass |
| AC-15 | `reuse-registry.md` 含 upstream_delta 列与 spec-research 行 | `reuse-registry.md:3`, `:23` | pass |
| AC-16 | `config/workflowhub.yaml` task_dir 被真实消费者（解析器）读取，代码级 grep 命中 parseTaskDir | `skills/spec-research/SKILL.md:56`, `:59`, `:60`, `:62`, `:79`; `workflows/build-plan/SKILL.md:24`, `:36`, `:39`, `:40`, `:41`; `skills/spec-analyze/SKILL.md:230`, `:233`, `:234`, `:236`; `skills/spec-tasks/SKILL.md:128`, `:130`, `:133`, `:134`, `:136` | pass |
| AC-17 | task_dir 解析器有测试覆盖且 `npx vitest run core/task-dir-parser.test.mjs` 绿 | `core/task-dir-parser.test.mjs` 2 tests green | pass |
| AC-18 | 全部改动通过独立异源审查，审查产物路径存在 | `specs/m13c-build-plan-deepening/3rd-review-report.md` 存在；`specs/m13c-build-plan-deepening/3rd-review-work/tasks/spec-20260701T032953Z-fa393e/reviews/` 下 verdict-round-{1,2,3}.json 与 report-round-{1,2,3}.md 存在 | pass |
| AC-19 | `skills/simplicity-guard/SKILL.md` 存在，build-spec 含 simplicity-guard 引用 | `skills/simplicity-guard/SKILL.md` 存在；`workflows/build-spec/SKILL.md:221` | pass |

### 结论

19 条验收条件全部通过（pass）。

---

## 证据索引

| 证据项 | 路径 |
|--------|------|
| T009 task_dir 测试 GREEN | `.phase-evidence/phase-4-t009-taskdir-green.json` |
| T009 全量测试套件输出 | `.phase-evidence/phase-4-t009-full-run.json` |
| T010/T011 AC 扫描输出 | `.phase-evidence/phase-4-ac-scan.json` |
| 本报告 | `specs/m13c-build-plan-deepening/verification-report.md` |

---

## 备注

- 本 phase 未修改前 3 个 phase 的产物文件，仅新建验收报告与证据文件。
- 全量 `npx vitest run` 存在 7 个与 task_dir 解析器无关的失败，已在 T009 中单独验证 task_dir 解析器测试通过。
