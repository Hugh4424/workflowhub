<!-- migrated from agenthub packages/core/agenthub/skills/3rd-review/verifiers/vibecoding/test-acceptance-reviewer-contract.md -->

# Verify Code 审查合同

> 本文件定义 test-acceptance-reviewer 的检查维度。合同外发现只能标 `minor`，不能标 `blocking`。

## 三轴审查

每轮必须覆盖三轴，缺一不可：

| 轴 | 含义 | 对照源 |
|----|------|--------|
| **Acceptance Coverage** | spec 验收章节 / plan-tasks 测试设计 / 用户问题是否全部验收 | `tasks/{task-id}/spec.md`（第 10 章 + 第 3 章）、`tasks/{task-id}/plan.md`、`tasks/{task-id}/tasks.md`、`tasks/{task-id}/test/final-test-report.md` |
| **Evidence Authenticity** | 证据是否 fresh、原始、可复现 | `tasks/{task-id}/test/final-test-report.md`、`tasks/{task-id}/phase-{N}-{RED,GREEN}.json`、`tasks/{task-id}/evidence/`、qa-only |
| **Workflow Closure** | verifier、Knowledge、workflow-issues、交付边界是否闭环 | `tasks/{task-id}/reports/report-index.md`、`tasks/{task-id}/reviews/reviews.jsonl`、verify-change --light |

## Required Skill Execution

审查员必须直接调用：

- `qa-only`：真实用户视角验收，只报告问题，不修复；不得用 `qa` 替代。
- `verify-change --light`：只读 packet 内的 `verification_closure`、测试证据和变更文件，确认闭环状态；材料缺失必须标 `material_incomplete`。

required skill 不可用且 SKILL.md 文件不可读、无法以 report-only lens 执行或输出缺关键结论 → `escalate_to_human`。pass/revise 输出必须含顶层 `skillResults`，逐项记录 executed / unavailable / failed。本仓库命名禁止 `openspec-*` 回流。

**Skill 执行回退规则**：审查员必须先尝试 Skill 工具调用 required skill。如果 Skill 工具在 headless/read-only 环境下失败，必须回退——直接 Read 该 skill 的 SKILL.md 文件，从中提取审查维度和检查清单，独立应用到 acceptance sources。回退成功时记录 `status=executed`，并在 `mode` 或 `evidence` 标明 `skill-file fallback`。不得使用 `qa` 替代 `qa-only`，不得使用 `openspec-*` 名称。

**三要素执行摘要要求（FR-REVIEW-006）**：每个必需技能的 `evidence` 字段必须包含三要素：（1）**在哪执行** — 会话位置/记录路径；（2）**具体输入/检查点** — 实际检查的内容；（3）**结论** — 发现了什么。禁止只写 "已执行"、"通过" 或无具体内容的占位符。

**实质内容最低门槛（FR-REVIEW-007）**：识别空洞摘要的判据如下。凡出现以下任意情形视为空洞，reviewer 必须降级为 `failed`：
- evidence 仅含状态词，无检查位置
- evidence 无具体检查点或输入描述
- evidence 缺少结论内容
- 空洞反例：`{"status":"executed","evidence":"ran verify-change, acceptance tests pass"}` — 缺在哪执行、无具体检查目标
- 合规示例：`{"status":"executed","evidence":"(1) Skill tool in this session; (2) read final-test-report.md lines 1-45, checked FR-001/FR-002/FR-003 closure evidence; (3) FR-001/FR-002 closed with raw command output, FR-003 missing evidence — flagged blocking"}`
不依赖执行位置路径的自动机器校验——判断由 reviewer 人工核查，不要求路径可访问。

## 总原则

审查重心在验收证据质量，而不是报告形式。先回答 5 个问题：

1. **验收完整吗** — 每条验收标准都有客观证据吗？
2. **证据新鲜吗** — `tasks/{task-id}/test/final-test-report.md` 是否当前 session 现跑？
3. **Verifier 闭环了吗** — 最新 verdict 都是 pass 吗？fix_status 剩余 open/in_progress **列出但不据此判 blocking**（仅当前阶段，前序阶段已裁决不重扫；`accepted`/`closed_inband` 视为已闭合）。
4. **Knowledge 完整吗** — `tasks/{task-id}/apply/phase`、`tasks/{task-id}/test/final-test-report.md`、verifier reports、`tasks/{task-id}/progress.md` 都齐吗？
5. **交付边界清晰吗** — keep/exclude/split、生成物、治理改动是否分类完毕？

## 当前轮 wh-review 自举闭环规则

verify-code 的 close 顺序是：先生成 fresh evidence / final-test-report
/ report-index / reviews.jsonl / stage-result 的候选包，再执行当前轮
wh-review；只有当前轮 wh-review 真实返回 `pass` 后，stage agent 才能把
stage-result/final-test-report 改成最终 `review_status=pass` 并进入 merge
gate。因此，审查员不得要求“当前轮 wh-review 的 pass raw artifact”在当前
轮 wh-review 执行前已经存在。

允许的候选闭环状态：

- `stage-result.status` 为 `unknown`。
- `facts.verdict` 表示 fresh acceptance 结论，可为 `pass`。
- `facts.review_status` 为 `pending_current_wh_review`。
- `facts.close_ready_for_merge_gate` 为 `false`。
- `final-test-report.md` 可写 `Verdict: ready_for_wh_review`，并明确
  “fresh test passed; current wh-review pending; merge/cleanup blocked until
  this wh-review returns pass”。
- `reports/report-index.md` / `reviews.jsonl` 可列出当前阶段
  `pending_current_wh_review` 或 `in_progress` 行；这些行必须指向本轮候选
  包和上一轮失败的诊断 artifact，不能伪称已 pass。

以上候选状态不是交付完成态，只是当前轮 wh-review 的输入态。若 fresh
evidence 全绿、验收矩阵完整、required skills 已执行或有可读 fallback、且
候选包没有把上一轮 `revise_required` artifact 伪装成 `pass`，不得仅因
`review_status=pending_current_wh_review` 或缺少“当前轮未来 pass artifact”
而出 blocking。

必须阻断的伪闭合：

- `stage-result` / `final-test-report.md` 声称 wh-review 已 `pass`，但引用的
  raw artifact 实际为 `revise_required` 或 `escalate_to_human`。
- `facts.review.verdict=pass`，但 `facts.review.artifact_path` 指向的 raw
  verdict 不是 `pass`。
- 候选包没有明确把 merge/cleanup 置为 blocked-until-current-wh-review-pass。

## 增量审查规则

第 1 轮：全量审查，按本合同所有维度出 findings。

第 2+ 轮：

1. 逐条核验前轮 blocking；未修复 → blocking。
2. 只审本轮修改文件和受影响源。
3. 如果触碰 RuntimeAdapter / checkpoint / workflow 边界、forbidden files、跨 package 接口 → 对该模块全量复审。
4. 新 blocking 只能来自本轮新改动、前轮不可能发现的问题、架构/边界触碰；其余 late finding 标 `minor`。
5. 第 2 轮起续跑本 review flow 的首轮 runtime，只看 packet 指定的增量材料。

## 首轮必查项

第 1 轮必须全部执行，不允许后续轮次才发现：

1. `tasks/{task-id}/workflow-issues.jsonl` 存在且已追加本 task 条目。
2. `tasks/{task-id}/reports/report-index.md` 的 `fix_status` 列：**列出当前阶段剩余 open 行（不据此判 blocking）**。只查该列，不扫描 summary。
   - open 集 = `{ open, in_progress }`；已闭合（视为非 open）= `{ closed, fixed, escalated, accepted, closed_inband }`。
   - 跨阶段收窄：只统计 stage 列 == 当前阶段（`currentStage`）的 open 行；前序阶段已裁决的 open 不重扫、不计入。
   - reviewer 在报告里如实列出当前阶段剩余 open 清单（checkpoint:round），注明"用户知情下放行"，但**不把 open 作为 revise_required 的依据**。
3. `spec 验收章节覆盖度核对`：`tasks/{task-id}/spec.md` 第 10 章每条 AC（含 Verification Method/AC ID）+ plan/tasks 每 phase 测试设计在 `tasks/{task-id}/test/final-test-report.md` 中都有证据。
4. artifacts 用户问题闭环：intake 原始用户问题在 `tasks/{task-id}/test/final-test-report.md` 中有验收证据。

第 2+ 轮发现首轮可检测 issue → 标 `late_finding: true`，通常只能 `minor`。

## 阻断/非阻断分类

**阻断（必须出 revise_required）**：

- 审查员未真实调用 `qa-only` 或 `verify-change --light`。
- 最终测试报告或 verifier reports 缺失。
- `tasks/{task-id}/test/final-test-report.md` 引用“之前已经跑过”“上一轮 verdict 已通过”“逻辑上应该没变”“同 Phase X 一致”等历史结果。
- `tasks/{task-id}/test/final-test-report.md` 未按 `<!-- round-N -->` 分段保留 raw output，或覆盖旧轮次。
- spec 验收章节（第 10 章 AC）或 plan/tasks 测试设计有条目未覆盖，或 spec 验收标准无客观证据。
- artifacts 原始用户问题未全部验证已解决。
- 验收命令非全绿、typecheck 有错误、项目相关 test/build 未执行且无替代检查。
- 出现 skipped、only、todo 或临时关闭测试。
- 证据缺 evidence JSON 文件路径、真实 exit_code、时间/session/commit 特征，或有 `...` / `（省略）` / `（同上）`。
- 多步验收证据缺任意一步原始输出，或用“上文已有”替代。
- ~~verifier-report-index 有 open/in_progress finding~~ **（已降级，移至非阻断）**：剩余 open/in_progress finding 不再阻断；列出当前阶段清单如实呈现（用户已决定 open 降级为知情确认），`accepted`/`closed_inband` 视为已闭合，前序阶段 open 不重扫。
- design/plan/code 最新 review 未通过，或 revise_required 无修复记录。
- 涉及 UI/browser/user flow 但未用 `isolated-browser-qa` 或缺截图/trace。
- 浏览器 QA 截图 hash 重复，或 final-test-report 与 close/summary 记录的 QA 工具名称矛盾。
- 前端 change 缺「视觉对比验收」段。
- 使用 design-fidelity-component-contract 时，设计合同不存在、非 latest，或 component 实现无法对齐合同。
- 交付 out-of-scope、遗漏 spec 目标、差异未解释，或当前 change 无法独立讲成完整 user story。
- 约束同步未完成，或全 change 自洽性未验证。

**验收指标三软门（FR-ORACLE-001/002/003）**：

- **FR-ORACLE-001 分母检查**：spec 验收章节（第 10 章）中的每个验收指标，是否写明分母（即 "X/Y 中的 Y 是多少"）？任一指标缺分母（如只写"覆盖率 80%"而不写"共 N 条 AC 中至少 M 条"）→ revise_required。
- **FR-ORACLE-002 反向断言成对**：每条行为断言是否同时声明正向（X 必须发生）和反向（Y 必须不发生）？任一断言只有正向、缺反向一侧 → revise_required。
- **FR-ORACLE-003 验收来源核验**：spec 验收章节 / plan-tasks 测试设计每条 AC 是否标明来源？实现者自填的来源（如 "手工测量"、"本次新建"）是否有独立确认（非同一人自证）？来源缺失或未独立确认 → revise_required。

**非阻断（应出 pass，可标 important/minor）**：

- 浏览器 QA 截图路径可更清晰。
- 测试报告措辞可更精确。
- 非约束性配置提醒。
- E2E fixture 非合同派生但不影响当前交付时标 important；影响验收可信度时升级 blocking。

## 检查维度

| 维度 | 验证方法 |
|------|---------|
| Required Skills 已执行 | 检查 qa-only 与 verify-change --light 输出；无法执行 required skill → escalate |
| 验收矩阵 | 逐条对照 spec Success Criteria 与 `tasks/{task-id}/test/final-test-report.md` 证据 |
| spec 验收章节核对 | `tasks/{task-id}/spec.md` 第 10 章每条 AC + `tasks/{task-id}/plan.md`/`tasks/{task-id}/tasks.md` 每 phase 测试设计在 `tasks/{task-id}/test/final-test-report.md` 中有命令/截图/报告证据 |
| 用户问题闭环 | intake artifacts 每个原始问题都有验收证据 |
| Fresh verification | `tasks/{task-id}/test/final-test-report.md` 当前 session 现跑，禁止历史引用 |
| round raw output | 检查 `<!-- round-N -->` 分段，不覆盖旧轮次 |
| 命令全绿 | 执行/核验 `pnpm test`、`make test`、项目指定命令 |
| typecheck 通过 | 执行/核验 `pnpm typecheck` 或项目指定 typecheck |
| 测试可信度 | 检查 skipped/only/todo、临时关闭、docs-only 替代检查 |
| 证据真实性 | evidence JSON 文件存在、provenance hash 匹配、exit_code/timestamp 合理 |
| verifier 闭环 | `tasks/{task-id}/reviews/reviews.jsonl` 与 `tasks/{task-id}/reports/report-index.md` 结构一致；fix_status 列剩余 open/in_progress **列出但不阻断**（仅当前阶段，前序阶段不重扫）；`accepted`/`closed_inband` 视为已闭合 |
| workflow-issues | `tasks/{task-id}/workflow-issues.jsonl` 文件存在且追加本 task stage 条目 |
| Knowledge close | `tasks/{task-id}/task.md`、`tasks/{task-id}/AGENTS.md`、`tasks/{task-id}/progress.md`、`tasks/{task-id}/apply/phase`、`tasks/{task-id}/test/final-test-report.md`、verifier reports 完整 |
| 浏览器 QA | UI scope 时 isolated-browser-qa、截图/trace、截图 hash 唯一、工具来源一致 |
| 视觉对比 | 前端 change 必有「视觉对比验收」段 |
| 设计合同验收 | design-contract/ui-contract latest，component 实现与合同一致 |
| Scope 与风险 | out-of-scope、遗漏目标、未解释差异、是否暂不 archive |
| 三轮升级 | 连续 3 轮 revise_required 需 BrainInbox 根因沉淀 |
| FR 逐条核验（FR-ACCEPT-002） | 对照 plan/spec 的**每一条**功能需求逐条核对是否实现，**禁止抽样**：抽查若干条即下 pass 视为审查不充分；任一 FR 未核到 → blocking |
| 原始需求逐条完整解决（FR-ACCEPT-003） | 对照 intake 原始需求台账/decision-log，**逐条**核验每条原始需求是否被**完整解决**（不止"有 FR 映射"，而是实现确已落地满足该需求）；任一条未完整解决或未核到 → blocking |
| dogfood 豁免理由核验（FR-DOG-002） | 若判定某产物为纯库/纯文档/纯配置而豁免 dogfood 真跑，reviewer 输出中必须明确标注豁免理由（为何属纯库/纯文档/纯配置，且不含 behavior-shaping 逻辑）；未标豁免理由 → revise_required |

## Fresh verification 真假鉴别

- `tasks/{task-id}/test/final-test-report.md` 必须是当前 session 的原始输出。
- 看到历史引用字样直接 `revise_required`。
- 每个 `<!-- round-N -->` 段应包含当前 session 唯一特征：session_id、实际时间戳或当前 commit hash。
- 连续 3 轮同一验证项证据问题 → finding 标 `repeat: true`，并 `escalate_to_human`。

## 浏览器验收规则

UI/browser/user-flow change 必查：

- 必须使用 `isolated-browser-qa`，不得只做人工口头验收。
- 必须有截图或 trace。
- 执行截图 hash 唯一性检查：重复 hash → blocking。
- `tasks/{task-id}/test/final-test-report.md` 与 close/summary 的浏览器 QA 工具名称必须一致。
- 无法验证时不能 pass，必须写 missing/blocking。

## Knowledge close 与交付边界

- 检查 `tasks/{task-id}/task.md`、`tasks/{task-id}/AGENTS.md`、`tasks/{task-id}/progress.md`、`tasks/{task-id}/apply/phase-*.md`、`tasks/{task-id}/test/final-test-report.md`、`tasks/{task-id}/reports/*.md`。
- pass 后仍不等于交付完成；必须写 `tasks/{task-id}/close/summary.md` 并等待用户明确“进行交付”或等价表达，才能 archive/merge/删分支/七项验证。
- 如果出现过同一 phase 连续 3 轮 revise_required，`tasks/{task-id}/decision-log.md` 必须有根因分析，不是流水账。

## 验证方法

1. **Skill 对照**：逐条核验 qa-only/verify-change --light 的 findings 是否进入 verdict；未真实调用 required skill → escalate。
2. **执行命令**：对 test/typecheck/build/fresh check 直接运行或核验原始输出。
3. **读文件 + grep**：检查 `tasks/{task-id}/reports/report-index.md`、`tasks/{task-id}/reviews/reviews.jsonl`、`tasks/{task-id}/workflow-issues.jsonl`、`tasks/{task-id}/test/final-test-report.md`、baseline。
4. **列级检查**：`tasks/{task-id}/reports/report-index.md` 只看 `fix_status` 列，列出当前阶段剩余 open/in_progress（列出不阻断，前序阶段不重扫；`accepted`/`closed_inband` 视为已闭合）。
5. **目录检查**：截图、trace、Knowledge artifacts 必须存在且非空。
6. **交叉比对**：spec AC、baseline、用户问题、final evidence 逐条映射。

## 证据真实性维度（FR-REV-002）

- 证据文件位于 `tasks/{task-id}/phase-{N}-{MODE}.json` + `.stdout` + `.stderr`（根级）、辅助报告位于 `tasks/{task-id}/evidence/`，gate 已验证 provenance
- 审查时 Read evidence JSON 确认 command、exit_code、timestamp 合理性
- 禁止 `...` / `（省略）` / `（同上）`。
- **Host-Verified Facts 优先**：当审查包包含 Host-Verified Facts 段时，reviewer 不重跑 evidence command。reviewer 继续读取 evidence JSON 确认 command/exit_code/timestamp 合理性，读取 stdout/stderr 检查占位符
- Host-Verified Facts 与 reviewer 发现矛盾 → `escalate_to_human`（fail-closed）。

## 同 Finding 连续 2 轮升级规则（FR-REV-001）

同一 blocking 连续 2 轮未闭合时，finding 必须包含：

1. 根因。
2. 扫描范围。
3. 反例矩阵。
4. Closure checklist。

第 3 轮仍未闭合 → `escalate_to_human`。

## 判据 F1-F6（fresh-capture 与测试真实性硬判据）

以下 6 条是本合同对 evidence 真实性与测试有效性的硬判据，reviewer 必须逐条显式核验并在报告中给出核验结论；任一命中 blocking 规则即出 `revise_required`，不得因"整体感觉证据没问题"而跳过单条核验。

- **F1（fresh-capture git_sha 一致）**：RED/GREEN evidence JSON 中记录的 `git_sha` 字段必须与审查发生时的当前 HEAD commit 一致。判据：`git_sha` != 当前 HEAD → 判定为 stale capture（证据不是本次改动下真实采集），**blocking**。reviewer 必须显式对比两者并在报告中写出对比结果（不能只写"已核对"）。
- **F2（AC-ID 路由非空）**：审查范围内每个受审测试文件/断言都必须能追溯到一个非空的验收标准 ID（AC-xx，见 `test-strategy.md` 的 `ac_routes` 或等价路由表）。判据：任一测试文件/断言找不到对应非空 AC-ID（路由缺失、路由为空字符串、或路由指向不存在的 AC）→ **blocking**。
- **F3（content_hash 比对）**：RED 阶段 evidence 的 `content_hash` 必须与 GREEN 阶段 evidence 的 `content_hash` 不同。判据：`RED.content_hash === GREEN.content_hash` → 视为 capture.mjs `anomaly_flags` 定义下的疑似 false-green（测试内容未变但从失败变通过，说明变更未真正驱动测试结果）→ **blocking**。reviewer 必须显式比对两个 hash 值，不能仅确认字段存在。
- **F4（测试命令与 build-code 产物记录一致）**：build-code 阶段结果（`facts.tests.command`）记录的测试命令，必须与 RED/GREEN evidence JSON 中实际采集到的 `command` 字段一致（含参数、路径）。判据：两处命令不一致（不同的测试文件范围、不同的 flag、不同的执行入口）→ **blocking**，视为证据与实现产物脱节。
- **F5（覆盖率非空洞）**：受审测试必须真实覆盖本次改动涉及的代码路径，断言必须能在实现被破坏时失败（非恒真断言、非仅调用不断言、非只测 mock/stub 返回值）。判据：测试删除/回退实现改动后仍然通过（即测试未实际约束该行为）→ 判定为空洞覆盖 → **blocking**；reviewer 应能指出具体哪条断言是空洞的，不能仅凭"测试文件存在"判 pass。
- **F6（无跳过/占位测试）**：本轮 diff 中不得出现 `test.skip`、`.only`、`it.todo`、`xdescribe`/`xit`、空函数体占位测试，或标题含"TODO"/"待实现"但无实际断言的测试。判据：diff 中命中以上任一模式 → **blocking**，自动判定为占位/跳过测试，无需进一步论证即可判 revise_required。

## 修订记录

主 agent 在收到 `revise_required` 后、发起下一轮审查前，必须 append-only 记录失败根因、修改文件、修改摘要、验证命令和结果。reviewer 只读不写；缺修订记录时按证据缺失处理。
