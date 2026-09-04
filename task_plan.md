# Task Plan: stage-reflection 可用性改造

## Goal

按照 WorkflowHub 五阶段标准，在当前任务 worktree 完成 stage-reflection 执行闭环、诚实状态、信息质量、历史导入与 M16 mixed-input 消费适配，逐 phase 实施/测试/独立审查，再经 verify-code 修复至可 close；当前 build-code 已获本轮 goal 明确授权，但 close 前必须向用户汇报并停下。

## Next Step

整理本轮修复后的真实证据与剩余边界；异源审查已补齐并修复两项 minor finding。保留 canonical dsh-code-review/session binding、正式浏览器验收、完整最终 aggregate 和 release/close 边界；不把 review-round evidence 或 focused regression 宣称为 acceptance/release。

## Current Phase

Build-code implementation complete through P7 focused evidence: P5 import, P6 page/M16 seam, P7 four-path E2E and local browser smoke are recorded; P6 prescribed aggregate is green at 130/130 and four M16 sub-gates are green. The prior `npm run test:safe` failure in `tests/official-component-receipts.test.mjs:566` was fixed at the test-boundary level and the affected file passes 52/52; full safe was not rerun per user instruction. Verify-code local review and heterologous review-round repair are complete; canonical session-event recording remains unavailable because this continuation is bound to an unrelated Baseline task.

## Phases

### Phase 1: P0 基线与 P1 schema/验证器

- [x] 确认正确 worktree、分支与 M16 基线
- [x] 记录 T001 有界完成状态与依赖缺失事实
- [x] 编写 T101 RED 并记录证据
- [x] 实现 T102 GREEN 并运行回归
- [x] 完成独立审查尝试并记录 unavailable
- **Status:** completed

### Phase 2: P2 执行闭环与调度

- [x] T201 RED（RED transcript partial，已如实记录）
- [x] T202 GREEN
- [x] P2 测试、独立审查、修复
- **Status:** completed；独立 review unavailable，未宣称审查通过

### Phase 3: P3 技能/文档与 P4 页面/事实投影

- [x] 按任务清单执行 P3
- [x] 按任务清单执行 P4
- [x] P5 一次性历史导入（20/20；转换器归档待授权）
- [x] P3/P4 定向测试与独立审查尝试已记录；P4 review 为 partial
- **Status:** P5 one-time import completed；converter archive and independent review remain unauthorized/unavailable

### Phase 4: P6 M16 mixed-input

- [x] T602 RED 五行契约
- [x] T603 GREEN 最小消费适配
- [x] M16 既有回归：prescribed aggregate 130/130，四个子门禁均 green
- [ ] 独立审查（未完成）
- **Status:** partial；独立 review、M16 T010/AC-GOV-002 与 release 仍未闭合

### Phase 5: P7 verify-code 与收口

- [x] T701 focused 四路径真链验证；浏览器页面 smoke partial
- [x] 全量 `npm run test:safe` 已执行（208/209 files passed，2188 passed、1 failed、25 skipped）；该失败已最小修复，受影响文件 52/52，通过后未按要求重跑完整 safe aggregate
- [x] `npm run check`、`git diff --check` 与结构/技能 smoke
- [x] 本地架构 code review，修复已确认 finding；异源 review 已真实 dispatch，2 项 minor finding 已修复并定向复测
- [x] 独立代码审查追加发现的 4 项页面/日期/reason 缺口已修复；5 files/49 tests 定向复测通过
- [x] 核对原始需求、宪法、move-map 与删除边界
- [x] close 前停止并用大白话向用户汇报
- [x] 取得当前 verify-code 的真实用户确认（用户已明确确认继续）
- **Status:** partial；异源 review-round 已完成且 findings 已修复，但 canonical dsh-code-review/session-event、正式四路径浏览器验收、完整最终 aggregate、release/close 仍未闭合

## Key Questions

1. 每个 RED/GREEN seam 是否与 tasks.md 和既有公共接口一致，且不扩展七类公共行为？
2. 如何在不改 M16 判定语义、候选身份、quality-tax 算法、lock/CAS、lifecycle、页面布局的前提下完成输入归一化？
3. 缺少依赖或前置 producer 时，如何如实记录 unavailable/incomplete 而不伪造通过？

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| 使用当前任务 worktree 分支 | `pwd` 与 git 已确认，HEAD/main 均为 `fff255c78` |
| 依赖恢复优先使用 `npm ci` | 存在 `package-lock.json`，避免手工漂移；不修改 package manifests |
| 外部 hash manifest 作为材料 provenance | decision-log 自包含自身 digest 不可收敛；manifest 明确不授权 build-code |
| M16 只做本任务 T602/T603 的窄消费适配 | 保持 M16 既有身份、阈值、tax、锁/CAS、lifecycle、布局语义 |
| 质量裁决委托独立上下文 | 遵守仓库规则，禁止自审自判 |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `vitest: command not found`, `markdownlint-cli2: command not found` | earlier baseline | Confirmed dependencies absent; now use repository lockfile with `npm ci` because build-code is explicitly authorized |
| `spawn bash ENOENT` | documentation audit | Retry only after confirming `pwd`; no file impact |
| decision-log self-hash non-convergence | documentation audit | Replaced with external manifest |

## Notes

- 不安装依赖以外的新增工具；不修改 M16 归档材料。
- 任何需要改公共行为、第二事实源、M16 判定语义/布局时立即 STOP，记录并回到 spec/用户。
- 所有命令退出码和独立审查结果写入 progress.md；发现写入 findings.md。
- 不在 close 前做不可逆动作、commit、push、deployment；除非用户另行明确要求。
