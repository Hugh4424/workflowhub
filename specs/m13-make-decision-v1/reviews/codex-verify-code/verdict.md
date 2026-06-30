# Codex Verify-Code Independent Review — M13 make-decision-v1

VERDICT: revise_required

结论：verify-code 的 PASS 裁决不成立。测试命令确实跑了 M13 测试套件，当前复跑也是 133/133 通过；但 verify-code 报告没有按 spec 的 AC 全集验收，AC 编号和含义错位，若干可自动验证项被错误挂 PENDING 或漏验，stage-result 本身也不符合 `verify-code` 契约。

## 核验摘要

- fresh test command: `npx vitest run tests/m13-make-decision.test.mjs`
- fresh-capture exit_code: `0`，见 `specs/m13-make-decision-v1/evidence/fresh-capture.json:5`
- 当前复跑：`Tests 133 passed (133)`，exit_code `0`
- 当前 HEAD: `278ebabd8e791d80bef5512fa7ed40cf29d5aa79`
- fresh-capture git_sha: `278ebabd8e791d80bef5512fa7ed40cf29d5aa79`
- skip/only 扫描：未发现 `test.skip` / `describe.skip` / `it.skip` / `test.only` / `describe.only` / `it.only`
- 明显桩测试：未发现 `assert.ok(true)`、`expect(true)`、`vi.mock`、`stub` 一类冒充通过；但测试大量为文档字符串结构断言，只能证明结构存在，不能证明 runtime dogfooding 产物真实生成。

## BLOCKING findings

1. `specs/m13-make-decision-v1/stage-result-verify-code.json:1` 与 `workflows/verify-code/SKILL.md:78` 契约不一致。  
   `verify-code` 契约要求 stage-result 包含 `status`、`error_code`、`retryable`、`facts.verdict`、`facts.evidence_ref` 等结构；当前产物把 `verdict`、`evidence_ref`、`anomaly_flags` 放在顶层，缺少 `status/facts` 包裹。verify-code 自己的交付物格式不合格，不能作为 PASS 裁决落地。

2. `specs/m13-make-decision-v1/test/final-test-report.md:48` 到 `:51` 与 `specs/m13-make-decision-v1/spec.md:401` 到 `:410` 的 AC 编号语义整体错位。  
   spec 中 AC3 是“盲审异源”，报告 AC3 却写成 decision-log 7 节；spec 中 AC4 是 metrics 记录，报告 AC4 却写成 live S9 approval；spec 中 AC5 是台账无静默丢弃，报告 AC5 却写成 skip env vars；spec 中 AC6 是 S9 可验证，报告 AC6 却写成 133 tests pass。验收矩阵对错对象给 PASS/PENDING，PASS 裁决不可采信。

3. `specs/m13-make-decision-v1/test/final-test-report.md:49` 将 AC4 标为 PENDING 的理由不成立。  
   `specs/m13-make-decision-v1/spec.md:404` 明确 AC4 是 `task-metrics.jsonl` 中有 make-decision 阶段的 `recordSkeleton` 和 `updateOwnResult` 记录。这是可自动核查项，不是 human-in-loop。verify-code 把它当 S9 人工确认处理，属于错判。

4. `specs/m13-make-decision-v1/test/final-test-report.md:59` 声称 “Total ACs checked: 26”，但 spec 实际列出 27 个 FR 加 6 个 AC。  
   报告漏掉多个权威 FR：`FR-FLOW-02`（`spec.md:87`）、`FR-RESEARCH-03`（`spec.md:128`）、`FR-DRAFT-01`（`spec.md:253`）、`FR-ENV-02`（`spec.md:320`）、`FR-METRIC-01`（`spec.md:330`）。因此 “22 PASS / 4 PENDING / 0 FAIL” 的分母不可信。

5. `specs/m13-make-decision-v1/test/final-test-report.md:44` 对 FR-ENV-01 给 PASS，但实现和测试没有覆盖 spec 指定的第 6 个 env var。  
   `specs/m13-make-decision-v1/spec.md:306` 到 `:318` 要求 6 个 env var，其中第 6 个是 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`；实际 `workflows/make-decision/SKILL.md:18` 和 `tests/m13-make-decision.test.mjs:71` 使用的是 `WORKFLOWHUB_AGENT_TEAMS_ENABLED`。这可能是合理设计修正，但 spec 未同步；verify-code 不能补全作者逻辑后宣称 FR-ENV-01 PASS。

6. `specs/m13-make-decision-v1/constitution-check.md:22` 到 `:34` 的 Q/S 条款不是当前 `constitution-checklist.md` 的真实条款。  
   当前清单中 Q2 是 “gate 三类划分”、Q3 是 “异源审查加人工把关”，S1-S8 是外部复用、指标、子代理、可搬运等条款，见 `constitution-checklist.md:22` 到 `:35`。M13 的 constitution-check 使用了旧口径/自造口径并全部打 `[x]`，不能算“逐条对照宪法”。

## MAJOR findings

1. `specs/m13-make-decision-v1/evidence/fresh-capture.json:8` 的 `content_hash` 不能独立复算。  
   `workflows/verify-code/capture.mjs:65` 到 `:68` 显示 hash 来源是 `stdout + "\n" + stderr`，但 fresh-capture 只保存 hash，没有保存 stdout/stderr。Vitest 输出含 `Start at`、`Duration` 等动态内容，事后复跑同一命令得到不同 hash。这不证明伪造，但 “content_hash verified” 的证据链不完整。

2. `specs/m13-make-decision-v1/cross-artifact-analysis.md:18` 声称 constitution-check “条款名称与 constitution-checklist.md 真实清单对齐”，但 `constitution-check.md:22-34` 与 `constitution-checklist.md:22-35` 明显不对齐。  
   cross-artifact-analysis 漏报真实矛盾。

3. `specs/m13-make-decision-v1/cross-artifact-analysis.md:24` 声称无残留一致性问题，但 verify-code 报告漏掉 FR-DRAFT-01、FR-ENV-02、FR-METRIC-01 等要求，且 AC2-AC6 映射错位。  
   “无残留”结论不成立。

4. `specs/m13-make-decision-v1/stage-result-build-code.json:24` 到 `:30` 记录第三方 review 仍有 “4 major + 2 medium internal-consistency nits”，但 `specs/m13-make-decision-v1/test/final-test-report.md:64` 直接写 “No implementation contradicts any AC”。  
   残留项可按宪法不阻断，但 verify-code 至少应说明这些残留是否触及 AC。当前是直接跳过解释。

5. `tests/m13-make-decision.test.mjs:75` 起的大量断言使用 `content.includes(...)` 证明文档字符串存在。  
   这类测试可支撑“结构性文档存在”，不能支撑 AC1 dogfooding、AC3 真实异源 reviewer、AC5 台账无静默丢弃、AC6 S9 runtime 证据。把这些测试绿等同于验收绿，是证据强度过度外推。

## MEDIUM findings

1. `specs/m13-make-decision-v1/evidence/fresh-capture.json:4` 的 git_sha 与当前 HEAD 匹配，但当前 `specs/m13-make-decision-v1/` 和 `tests/m13-make-decision.test.mjs` 是未跟踪文件，`reuse-registry.md`、`workflows/make-decision/SKILL.md` 有未提交修改。  
   git_sha 只能固定 HEAD，不能固定这些未跟踪/未提交证据内容。没有伪造迹象，但可复核性弱。

2. `specs/m13-make-decision-v1/baseline-report.md:11` 写 “M13 仅有 1 条 task-metrics.jsonl 记录（make-decision 段）”，但路径未说明，证据链混乱。  
   `specs/m13-make-decision-v1/task-metrics.jsonl:1` 到 `:2` 是 verify-code 记录；`tasks/m13-make-decision-v1/task-metrics.jsonl:1` 才有 make-decision 记录。verify-code 报告没有明确引用正确 metrics 路径。

3. `specs/m13-make-decision-v1/test/final-test-report.md:46` 把 AC1 标为 PENDING 基本合理，但备注写“结构已测，只剩 runtime”容易弱化 spec 要求。  
   `specs/m13-make-decision-v1/spec.md:395` 到 `:397` 要求 workflowhub 自身 dogfooding 中五类护城河可触发并产出 artifacts；没有 runtime artifacts 时只能说未完成，不能暗示已经满足。

4. `specs/m13-make-decision-v1/constitution-check.md:34` 写 `skill_version: 1.0.0`，但实际 `workflows/make-decision/SKILL.md:3` 是 `version: 2.0.0`，recordSkeleton 示例也在 `workflows/make-decision/SKILL.md:31` 写 `2.0.0`。  
   宪法声明证据陈旧。

## LOW findings

1. `specs/m13-make-decision-v1/constitution-check.md:8` 写 “11 步流程”，但 spec 和实际 SKILL 都是 S0、S0.5、S1-S10 的 12 步。  
   不单独阻断，但说明 constitution-check 不是精确复核结果。

2. `tests/m13-make-decision.test.mjs:115` 在 `config/workflowhub.yaml` 不存在时会 `return`，导致“不得注册 env var”测试静默跳过。  
   当前仓库存在该文件，所以这次没有造成假绿；但测试健壮性弱。

## 4 PENDING 正当性结论

- `FR-ACCEPT-02`: PENDING 成立。S9 需要真实用户确认，自动测试不能完整替代。
- `FR-ACCEPT-03`: PENDING 成立。S9 台账逐条核对依赖真实交互记录。
- `AC1`: PENDING 基本成立。它要求 dogfooding runtime 触发五类护城河并产出 artifacts；当前没有完整 runtime 证据。
- `AC4`: PENDING 不成立。spec 中 AC4 是 metrics 记录，不是 S9 human-in-loop；应自动核查或据实 FAIL/PASS。

额外说明：spec 中真正对应 S9 runtime 的是 AC6（`spec.md:410`），报告却把 AC6 写成测试全绿 PASS，这是核心错判之一。

## 假绿防护结论

- `fresh-capture.json` 的 `exit_code` 真为 `0`。
- 测试命令确实跑了 `tests/m13-make-decision.test.mjs`，当前复跑为 `133 passed (133)`。
- 未发现 `.skip` / `.only`。
- 未发现明显 `assert true` 类桩测试。
- 但 `content_hash` 无原始 stdout/stderr 可复算，且测试主要是结构字符串断言；它能证明“文档结构大体存在”，不能证明所有 spec runtime AC 已满足。

## 最终裁决

VERDICT: revise_required

verify-code 的 PASS 裁决未经独立核验成立，不能进入合并。必须重做 verify-code 报告和 stage-result：按 `workflows/verify-code/SKILL.md` schema 写结果，按 `spec.md` 原始 FR/AC 编号重建验收矩阵，把 AC4 改为 metrics 核查，把 AC6/S9 单独处理，并明确结构 PASS、runtime PENDING、证据缺失 FAIL/PENDING 的边界。
