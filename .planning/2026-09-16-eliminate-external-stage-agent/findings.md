# Findings: 移除外部 Stage Agent 阻塞

## 已确认的现象

- 当前 task worktree：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-waste-reduction-20260915`。
- 当前分支：`task/workflowhub/workflowhub-mechanism-waste-reduction-20260915`。
- 四份当前材料存在，`status --action=begin` 返回 `work_status=ready`、`continuation_allowed=true`。
- 之前正式 verify run 在没有 `receipts.quality_review` 时返回 `code_review=missing`。
- 将旧 `wh-review` result 作为 `quality_review` 输入时，旧实现曾错误返回 `quality_status=passed`，但 evidence 绑定旧快照；已补充当前快照校验并回归通过。
- 旧复现曾通过 bridge 写入 `stage_outcomes/verify-code/2156b1c56a199e6b155575195529655787c69978a6c9ade95db344cdfb9b4.json`，其 12 个 step、4 个 skill 全部真实 `unavailable`；该文件保留为历史事实，不再作为当前 run 输入。

## 宪法对照后的新增结论

- F3/Q1/Q2 明确：四材料决定进入/继续；accepted、receipt、review、audit、checkpoint、历史 snapshot 都不是工作许可证。F4/Q3 要求独立 review 事实，但不要求外部 Stage Agent 作为执行者；F11 明确禁止辅助事实、stage ready 或控制面缺失阻塞普通工作。
- 当前材料原先把“本地阶段 outcome 的受支持路径”列为 D-024，并把 `stage_outcomes` 写进正式 run 的可选输入；这解释了为什么实现里仍有 bridge/adapter/host outcome 词汇。D-026 已明确 supersede 其 active 路径：主会话直接执行，旧 outcome/bridge 只读兼容。
- `workflows/verify-code/skill-deps.yaml` 将 `dsh-code-review` 的输入声明为 `receipts.quality_review`、结果声明为 `facts.code_review`；`runtime/stage/stage-runner.mjs` 又在正式 run 中读取可选 `receipts.stage_outcomes`，并对 verify-code 的 `code_review` 做 stage-outcome 绑定校验。两条输入链存在交叉，主会话没有一个直接的 code-review producer。
- `tools/host/workflowhub-local-stage-runner.mjs` 与 `tools/host/workflowhub-stage-agent-bridge.mjs` 只转发显式 packet，不启动或执行 review/阶段逻辑；在没有真实外部 producer 时，它的唯一合法产物是 `unavailable`。因此“提供本地 bridge 适配”不能从根上解决当前阻塞，只能把缺失事实包装一层；前者现已从 active 实现删除，后者保留历史兼容。

## 最小复现（RED）

- 新增回归场景：四份材料齐全，公开 `run --action=execute --stage=verify-code` 不提交任何 `receipts.stage_outcomes`，handler/publication 均成功返回；但 `facts.jsonl` 的阶段行写成 `stage-end:verify-code / exit_code=1 / stage_end_failed`。
- 根因已定位到 `runtime/stage/stage-runner.mjs` 的 `runOfficialStage`：它把“没有 host outcome”映射为 `stageStatus="failed"`，随后 `runStageEndReflection` 用这个错误的阶段状态写入失败签名。不是代码执行失败，也不是四份材料缺失。
- 这条错误映射会让主会话在成功发布后看到失败阶段行，并诱导出“必须先补真实外部 Stage Agent outcome 再正式 run”的错误恢复建议；它直接违反 F3/F4/F11 的推进与质量分离边界。

## 最小修复后的 GREEN

- `runOfficialStage` 现在把阶段状态绑定到当前 WorkflowHub handler/publication 是否成功，而不是绑定 host outcome 是否存在；无 host outcome 的同一复现已写出 `stage-end:verify-code / exit_code=0 / stage_end_recorded`。
- `publishStageHandoff` 原先把 stage outcome 设为硬必填，所以 author stage 的 handoff 仍会在无 host outcome 时降级为 unavailable；现在已允许它直接以当前 task/worktree/material snapshot 发布，旧 outcome 仍可作为历史来源读回。
- 这两处修正了真实失败归因；随后已完成 active 架构收口：五阶段 `steps.json`/`skill-deps.yaml` 不再声明 `stage_outcome`，reflection/handoff 允许无 outcome 直接绑定当前身份，host protocol/阶段技能明确当前 session 是唯一正式 producer，bridge/adapter 仅历史兼容。

## 当前 GREEN 与回到任务

- `npx vitest run tests/contract/no-external-stage-agent-gate.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`：stage-handoff 35/35、stage-runner-reflection 21/21、其余 active-path contract 22/22；首轮只有协议断行断言失败，修正文案后静态补跑 22/22。
- `node tools/cli/stage-runtime.mjs run --action=execute --stage=verify-code --project=workflowhub --task=workflowhub-mechanism-waste-reduction-20260915`：exit `0`；无 `receipts.stage_outcomes`；当前 stage row 写入 `stage-end:verify-code`, `exit_code=0`, `failure_signature=stage_end_recorded`；`execution_outcome.status=completed`。
- 随后的 `status --action=begin`：`work_status=ready`、`continuation_allowed=true`、四材料齐全；唯一 actionable quality gap 是 `code_review` missing，`quality_status=in_progress`；`research=unavailable` 与 reflection `executor_absent` 都不构成工作 gate。

## 宪法/合同线索

- `workflows/verify-code/SKILL.md` 明确 verify-code 可在四份材料存在时继续，缺质量事实只限制完成声明，不限制工作。
- `skills/workflowhub-host-protocol/SKILL.md` 同时规定“无外部 Stage Agent 流程继续”和“正式 run 可消费 stage_outcomes”，需要检查是否存在实现层矛盾。
- `workflows/verify-code/steps.json` 将 `dsh-code-review`、`wh-review`、`stage-reflection` 写进宿主 outcome，但 manifest steps 是执行描述，不应成为主会话运行许可证。
- `runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs`、`tools/cli/stage-runtime.mjs` 是核心 consumer。

## 待验证 producer → consumer 链

| Producer | Schema/record | Writer | Consumer | 当前疑点 |
|---|---|---|---|---|
| 当前主会话 dsh 审查 | code review stage outcome / quality review | stage runner / quality fact | `code_review` predicate | 是否被错误要求 external host |
| wh-review advisory | `wh-review-result.v1` | canonical review writer | `facts.review` / `quality_review` | 是否被错误提升或错槽消费 |
| Stage Agent host | `workflowhub-stage-outcomes.v1` | bridge adapter | stage outcome summary/reflection | 是否被错误变成正式前置 |
| stage reflection | `stage-reflection.v2` | reflection writer | status/handoff | 是否被错误当完成条件 |

## 修复原则

- 当前主会话可以直接完成 verify-code 的真实代码审查、修复、测试和事实写入。
- 没有外部宿主时，Stage Agent outcome/reflection 只能是可选的 `unavailable` 诊断，不得阻塞 run、quality consumer 或 work readiness；当前 reflection 没有注入 executor 时明确为 `executor_absent`，不是伪造的通过。
- 不新增第二 writer、第二状态机、bridge gate 或手工 receipt。
- 旧 bridge/adapter 若无真实 consumer，应删除；若仍需兼容，只能降为显式可选诊断，不能出现在完成前置链。

## 2026-09-17 修复闭环

- 独立架构审查指出的三个真实问题已修复：旧 `decision_freeze.stage_outcome_ref`
  不能再进入当前执行；stage-row 写失败不能以 CLI exit 0 假绿；review-record
  不再只信 acceptance wrapper，而是调用共享 aggregate authenticator 校验完整
  task/stage/snapshot/material、当前 actor、execution items 和每条 AC 叶子。
- provider review 的三个 minor 事实也已处置：`not_applicable` 有明确质量语义；
  测试 helper 删除退休参数；只读远端不可达时返回 `unavailable/incomplete`，不可逆
  删除仍然 fail-loud。
- 这些修复没有重跑 provider，也没有制造新 Stage Agent/session/outcome。当前
  `verify-code` 仍显示 `code_review=missing/incomplete`，因为已有 review 绑定旧代码
  快照；按 FR-REV-003 不能把旧 review 改写成当前通过。这是质量缺口，不是普通工作
  推进门；当前 public run 已在无外部输入下完成并写出 `stage_end_recorded`。
