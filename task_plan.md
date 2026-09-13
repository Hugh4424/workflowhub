# Build-code 执行计划 · workflowhub-mechanism-simplification-t2-20260911

## Goal
在认证 worktree `workflowhub-workflowhub-mechanism-simplification-t2-20260911`、分支 `task/workflowhub/workflowhub-mechanism-simplification-t2-20260911` 中，严格按当前四份材料和 `tasks.md` 的 T0–T74 完成 build-code。每个 Phase 先实施，再跑受影响定向测试、独立审查和事实证据；不 close、不推送、不合并。

## Authority / boundaries
- 当前权威：`specs/workflowhub-mechanism-simplification-t2-20260911/{decision-log.md,spec.md,plan.md,tasks.md}`。
- 质量事实写入外部 task store：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t2-20260911/`。
- 不把质量事实写成通过；缺失审查、真实任务或宿主使用保持 `unknown`/`unavailable`/`incomplete`。
- 只跑当前批次具名测试；禁止无范围全量回归。唯一批准例外是 C4 任务明确的 `npm run check`，须保存 raw output 与理由。
- T27 前不写 `/Users/Hugh/Hugh/Project/3rd-review`；跨仓改动前必须向用户展示文件、改动、验证、失败处理并取得真实确认。
- 主会话负责写入、集成、裁决；重读、独立审查、测试采集委派子代理。

## Phases
1. **T0 + Phase 1 / C9 执行面 (T0–T14)** — provisional sibling-worktree implementation only; C9 pending/unaccepted. T14 not executed (commit forbidden), external evidence/target binding incomplete, downstream snapshot consumer and active-operation preflight gaps remain.
2. **Phase 2 / C4 审查生命周期 (T15–T42)** — in progress; T15/T16 identity slice is being corrected; T17 budget deletion must follow replacement; T27 confirmation required before cross-repo writes.
3. **Phase 3 / C5 记录失效链 (T43–T53)** — pending until C4 closes.
4. **Phase 4 / C6 收口与 Tier-C 删除 (T54–T68)** — pending until C5 closes.
5. **Phase 5 / 任务级收尾 (T69–T74)** — pending.
6. **最终核对与 build-code 交接（verify-code 前停止）** — pending; no commit/push/merge/close/release.

## Phase cards / routing
- P1 actual scope: runtime profile contract/runner, receipt reuse, public preflight, profile measurement, package entry, focused contract tests. Routing = `feature`; concrete skill = `backend-testing`; no UI.
- Every behavior Phase must retain build-plan route, actual changed-file route, and independent advisor JSON. Main session remains sole writer.

## Evidence checklist
- T0: `quality/tests/t0-current-baseline.json`, `t0-preflight-check.md` + raw guard logs
- Phase 1: `p1-*`, `t1-*`, `t4-*`, `t5-*`, `t7-*` evidence and batch boundary
- Phase 2: `p2-*`, T27 confirmation, T18 channel run, batch boundary
- Phase 3: `p3-*`, freshness/write-boundary/ledger evidence
- Phase 4: `p4-*`, structured Tier-C proof and batch boundary
- Phase 5: `p5-*`, handoff/flow evidence and final dynamic guard comparison

## Errors encountered
| Error | Resolution |
|---|---|
| planning skill catch-up initially pointed at missing `~/.claude` script | Located canonical script under `/Users/Hugh/.agents/skills/planning-with-files/scripts/`; rerun produced no unsynced report |
| T0 first attempt wrote to a noncanonical duplicate root and omitted shell substitutions | Removed accidental files and re-recorded canonical evidence after resolving `resolveStorageRoot()` |
| T1 authored RED exited 0 because current tests do not yet assert the old-name mismatch | Preserved output; add the approved negative assertion in the existing allowed profile tests before T2, then rerun RED/GREEN |

## Next step
Finish the C9 boundary artifacts and independent review, then execute T15/T16 review-request identity slice. Do not modify C5/C6 files until their ordered phases are reached.
