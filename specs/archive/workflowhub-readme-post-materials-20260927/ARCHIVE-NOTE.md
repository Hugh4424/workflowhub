# 归档说明：workflowhub-readme-post-materials-20260927（残留卡处置）
日期：2026-09-29

## 来源与授权
- 无用户授权：CARD-04 父会话自行 bootstrap。外置 `task.json`：`created_at=2026-09-26T23:39:59.864Z`、`activation_cohort_frozen_at=2026-09-26T23:39:59.863Z`；`bootstrap-*.json` 的 `transaction.closed_at=2026-09-26T23:40:01.266Z`，基线 `ef920f1f`。
- 用户逐字授权仅「可以，就改这一行」，范围仅 README 一行。父会话调查记其时刻 2026-09-27T07:43:17Z（外置记录无此值）；本卡 `quality/confirmations/` 最早的同一答复为 2026-09-27T07:52:26.241Z（stage=make-decision）。

## 四阶段连续自动推进
- 父会话调查所述：单一子代理连续跑完（`/root/p13_report_consumer`，`fork_turns=all`）；本归档未能从外置记录独立核对这两项。
- 外置 `facts.jsonl` stage-end：make-decision `2026-09-27T07:57:42.119Z`、build-plan `2026-09-27T08:48:28.602Z`、build-code `2026-09-27T09:03:11.298Z`、verify-code `2026-09-27T09:03:40.201Z`。
- build-code → verify-code 间隔 28.903 秒（即 29 秒）。

## 状态
- 无提交：worktree HEAD 仍为基线 `ef920f1f`，分支无任何新提交。
- 无交付、无收口：`facts.jsonl` 各行 `layer_states.delivery=unavailable`、`task_closure=unavailable`。
- 外部任务根：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-readme-post-materials-20260927/`。

## 本次落地（2026-09-29）
- main 的 README `post` 行改为 `spec.md`、独立 `phases/P<n>.md`、纯指针 `phases/index.md`（去掉已废弃的 `plan.md`/`tasks.md` 双写）。
- 同一只读检查器对 main 运行 6 PASS / 0 FAIL（脚本 SHA-256 `70427483…`；原件在 `evidence/`）。
