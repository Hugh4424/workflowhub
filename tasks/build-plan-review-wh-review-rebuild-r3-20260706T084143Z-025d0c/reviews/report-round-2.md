# 审查报告 — build-plan-review-wh-review-rebuild-r3-20260706T084143Z-025d0c (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

按 speckit-analyze、plan-eng-review、review 三个 lens 的只读 SKILL.md fallback 复核，上一轮卡住的 3 条主线已补上：wh-review→3rd-review runner 调度任务已落到 T010a/Phase 2 Goal，D2 批准 artifact 语义已改回批准态专用，round-state 最小字段集已补进 T010/T011/Phase 2 Verify。当前仍不能执行闭环，剩余阻断点集中在两类：接口变更后的调用方覆盖证据缺失，以及 Stage 3/THIRDREVIEW 验证命令仍存在假 gate 和错位验证。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:68 | 问题: 3rd-review 接口本期被破坏性收窄，但任务面只迁移 5 个 stage 的已知调用点（T019-T023/T023a），没有任何 repo 级 reverse-reference scan / caller inventory 去证明仓库内不存在其他直接调用 3rd-review、`--checkpoint`、旧 runner 入口的残余调用方。按现计划执行，隐藏调用点会在引擎瘦身后继续走旧接口并失效，`Business Impact Scope` 的“任何直接调用方都要迁移”也无法验收闭环。 | 建议: 在 Stage 2 前补一条显式任务：全仓扫描 `3rd-review` / `--checkpoint` / `run-heterologous-review` / `standalone.sh` 等引用，形成 caller 清单，并逐项标记“迁移/不受影响/删除”；若扫描结果只有 5 个 stage，也要把扫描命令和零额外命中的证据写进 plan/tasks 的 Files/Verify。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:111 | 问题: T025a 要求验证“未被冒烟覆盖的 stage 在改为调用 wh-review 后不因接口变更报错或阻塞”，但对应 gate_cmd 只是重跑 `route-decision-writer.test.mjs`。这只能证明路由记录脚本工作，不能证明各 stage 的真实收尾调用链、参数透传、D2/auto-advance 分支、或 wh-review 集成没有回归。FR→task→verify 链在这里断了。 | 建议: 把 T025a 的验证改成真正的 stage 级最小集成检查：逐个调用未纳入主冒烟的 stage 收尾入口，断言其 wh-review 调用至少能完成参数装配、进入正确推进分支，并在任务目录留下对应 route-decision / round-state / 报告或停门证据。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:88 | 问题: 验证命令仍有假 gate。这里用 `node /Users/Hugh/Hugh/Project/3rd-review/scripts/run-threat-auditor.mjs --test-fixture=semantic-compliant-with-keyword.json` 作为 pass/fail，但计划别处并没有给出该 CLI flag 的签名锚点，且 `plan.md` 同一检查改成了运行 `run-threat-auditor.test.mjs`。这既是 plan/tasks 不一致，也是 reviewer contract 明确禁止的 invented-flag / 不可执行 gate。另一个同类问题是 Stage 3 Scope Boundary 校验脚本 `git diff --name-only | grep -vE ...` 被描述为“无输出即通过”，但原命令在“通过”时返回非零，不适合作为未取反的 gate_cmd。 | 建议: 统一所有 gate_cmd 为真实可运行命令：threatAuditor 检查收敛到已有测试文件或补充明确 help/signature 锚点；Scope Boundary gate 改成退出码与通过语义一致的命令，例如用 `! git diff --name-only | grep -qvE '...'` 或等价可直接判定的 shell。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 接口本期被破坏性收窄，但任务面只迁移 5 个 stage 的已知调用点（T019-T023/T023a），没有任何 repo 级 reverse-reference scan / caller inventory 去证明仓库内不存在其他直接调用 3rd-review、`--checkpoint`、旧 runner 入口的残余调用方。按现计划执行，隐藏调用点会在引擎瘦身后继续走旧接口并失效，`Business Impact Scope` 的“任何直接调用方都要迁移”也无法验收闭环。
- 必须修复：T025a 要求验证“未被冒烟覆盖的 stage 在改为调用 wh-review 后不因接口变更报错或阻塞”，但对应 gate_cmd 只是重跑 `route-decision-writer.test.mjs`。这只能证明路由记录脚本工作，不能证明各 stage 的真实收尾调用链、参数透传、D2/auto-advance 分支、或 wh-review 集成没有回归。FR→task→verify 链在这里断了。
- 必须修复：验证命令仍有假 gate。这里用 `node /Users/Hugh/Hugh/Project/3rd-review/scripts/run-threat-auditor.mjs --test-fixture=semantic-compliant-with-keyword.json` 作为 pass/fail，但计划别处并没有给出该 CLI flag 的签名锚点，且 `plan.md` 同一检查改成了运行 `run-threat-auditor.test.mjs`。这既是 plan/tasks 不一致，也是 reviewer contract 明确禁止的 invented-flag / 不可执行 gate。另一个同类问题是 Stage 3 Scope Boundary 校验脚本 `git diff --name-only | grep -vE ...` 被描述为“无输出即通过”，但原命令在“通过”时返回非零，不适合作为未取反的 gate_cmd。

