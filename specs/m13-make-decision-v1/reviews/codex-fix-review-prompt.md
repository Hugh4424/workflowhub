你是独立异源审查者（codex）。仓库 /Users/Hugh/Hugh/Project/workflowhub。

任务：独立核验两个 blocking 修复是否真正落地、是否对齐权威 spec、测试是否真断言（不是假绿）。只读不改。给最终 VERDICT: pass 或 revise_required。

## 权威源
- spec.md:128-132（FR-RESEARCH-03 双路返空即停）
- spec.md:306-318（FR-ENV-01 六个 env var 表）

## 核验点 1：FR-RESEARCH-03
读 workflows/make-decision/SKILL.md S3 段（约 150-172 行）。确认双路（muyu + anysearch）均返空时：写 journal 事件、向用户报告、等用户显式指令前不得进入 S4、绝不合成摘要；汇总步骤仅在非双路空时执行。是否符合 spec.md:130 的「立即停止 + 不得合成虚假摘要」？

读 tests/m13-make-decision.test.mjs 里 FR-RESEARCH-03 相关断言。确认测试真断言「停止语义」（停止/报告/不合成），不是只查 `dual_research_empty` 字符串存在（旧的假绿根因）。

## 核验点 2：FR-ENV-01
读 workflows/make-decision/SKILL.md Environment Variables 表（约 7-18 行）+ body 引用。确认：
- agent-teams 变量已是 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`，默认 `0`，`=1` 启用；旧名 `WORKFLOWHUB_AGENT_TEAMS_ENABLED` 0 残留
- `MAKE_DECISION_SKIP_DEBATE` / `MAKE_DECISION_SKIP_BLIND_REVIEW` / agent-teams 默认 `0`，值 `0`/`1`，body 判定用 `=1`
- `THIRD_REVIEW_RUNNER` 默认 `run-heterologous-review.mjs`（spec 语义，文件路径）
6 个变量名/默认值/语义是否全对齐 spec.md:309-316？

读 tests 里 env 断言，确认用新名。

## 假绿防护
跑 `npx vitest run tests/m13-make-decision.test.mjs`，确认全绿 exit 0、无 .skip/.only、无空断言桩测试。核对 specs/m13-make-decision-v1/evidence/fix-green.json 的 exit_code/content_hash。

## 输出
逐点给证据（file:line）。最后一行 `VERDICT: pass` 或 `VERDICT: revise_required`，revise 必须列具体 blocking 项 + file:line。