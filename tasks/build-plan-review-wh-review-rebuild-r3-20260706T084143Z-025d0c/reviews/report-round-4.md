# 审查报告 — build-plan-review-wh-review-rebuild-r3-20260706T084143Z-025d0c (round 4)

- verdict: revise_required
- provenance: single-context

## Summary

第 3 轮留下的 3 个 blocking 本轮仍未闭合：旧调用方覆盖证据缺失、T025a 仍不是 stage 级集成验证、THIRDREVIEW/Scope Boundary gate 仍有假命令。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:68 | 问题: 重复阻断。计划仍只枚举 5 个已知 stage 调用点迁移（T019-T023a），没有 repo 级 reverse-reference scan / caller inventory 去证明仓库内不存在其他直接调用 3rd-review、`--checkpoint`、旧 runner 入口的残余调用方。当前方案无法闭合 spec 里“任何直接调用方都要迁移”的影响面要求。 | 建议: 新增显式任务和 Verify：全仓扫描 `3rd-review`、`--checkpoint`、`run-heterologous-review`、`standalone.sh` 等引用，形成 caller 清单，并逐项标记“迁移 / 不受影响 / 删除”；若扫描结果只有 5 个 stage，也要把扫描命令和零额外命中的证据写进 plan/tasks。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:101 | 问题: 重复阻断。T025a 仍只承诺“补一条独立最小验证”，对应 checkpoint gate_cmd 还是重跑 `route-decision-writer.test.mjs`。这只能证明路由记录脚本工作，不能证明未纳入主冒烟的 stage 真实收尾调用链、参数透传、D2/auto-advance 分支、或 wh-review 集成没有回归，FR→task→verify 链仍然断裂。 | 建议: 把 T025a 的验证改成 stage 级最小集成检查：逐个调用未纳入主冒烟的 stage 收尾入口，断言其 wh-review 调用至少完成参数装配、进入正确推进分支，并在任务目录留下 `route-decision`、`round-state`、报告或停门证据。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:88 | 问题: 重复阻断。THIRDREVIEW / Stage 3 仍有 fake gate。`node /Users/Hugh/Hugh/Project/3rd-review/scripts/run-threat-auditor.mjs --test-fixture=semantic-compliant-with-keyword.json` 仍被当作 pass/fail，但 plan/tasks 没有给出该 CLI flag 的签名锚点；同时 Scope Boundary 校验脚本仍是“无输出即通过”的 `git diff --name-only | grep -vE ...`，通过时返回非零，不能作为可靠 gate_cmd。 | 建议: 统一 gate_cmd 为真实可执行且退出码语义正确的命令：threatAuditor 检查收敛到已有测试文件，或补充明确 help / signature 锚点；Scope Boundary gate 改成退出码与通过语义一致的形式，例如 `! git diff --name-only | grep -qvE '...'` 或等价命令。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：重复阻断。计划仍只枚举 5 个已知 stage 调用点迁移（T019-T023a），没有 repo 级 reverse-reference scan / caller inventory 去证明仓库内不存在其他直接调用 3rd-review、`--checkpoint`、旧 runner 入口的残余调用方。当前方案无法闭合 spec 里“任何直接调用方都要迁移”的影响面要求。
- 必须修复：重复阻断。T025a 仍只承诺“补一条独立最小验证”，对应 checkpoint gate_cmd 还是重跑 `route-decision-writer.test.mjs`。这只能证明路由记录脚本工作，不能证明未纳入主冒烟的 stage 真实收尾调用链、参数透传、D2/auto-advance 分支、或 wh-review 集成没有回归，FR→task→verify 链仍然断裂。
- 必须修复：重复阻断。THIRDREVIEW / Stage 3 仍有 fake gate。`node /Users/Hugh/Hugh/Project/3rd-review/scripts/run-threat-auditor.mjs --test-fixture=semantic-compliant-with-keyword.json` 仍被当作 pass/fail，但 plan/tasks 没有给出该 CLI flag 的签名锚点；同时 Scope Boundary 校验脚本仍是“无输出即通过”的 `git diff --name-only | grep -vE ...`，通过时返回非零，不能作为可靠 gate_cmd。

