# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-30T08:52:20.217Z

## Original task

3rd-review Phase 3 R3 for m13b-build-spec-deepening. Single remaining R2 finding: FR-ARTIFACT-001 non-blocking note was not explicit enough. Fixed: now reads '违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）'. This matches the same explicit pattern used for FR-BEHAV-001/002. 55 tests pass. Please verify FR-ARTIFACT-001 non-blocking clause is now complete and output final verdict: pass | revise_required.

## Final prompt

3rd-review Phase 3 R3 for m13b-build-spec-deepening. Single remaining R2 finding: FR-ARTIFACT-001 non-blocking note was not explicit enough. Fixed: now reads '违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）'. This matches the same explicit pattern used for FR-BEHAV-001/002. 55 tests pass. Please verify FR-ARTIFACT-001 non-blocking clause is now complete and output final verdict: pass | revise_required.

## Raw output

```text
最终结论：**pass**

已核对 [workflows/build-spec/SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:196)：

- FR-ARTIFACT-001 现在明确写出：违规时记录为 `warn`
- 明确写入质量事实契约第 2 项：`自检结果`
- 明确浮现给人工
- 明确“不自动停止 stage（非阻断）”
- 语义与 [FR-BEHAV-001/002](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:203) 的处理模式一致

也核对了质量事实契约定义：[workflows/build-spec/SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:160) 到 [workflows/build-spec/SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 已定义第 2 项为“自检结果”，并声明所有 5 项都是“记录+浮现”、不得附加停止语义。

验证命令：

```bash
npm test -- tests/m13b-build-spec-deepening.test.mjs --reporter=verbose
```

结果：`55 passed / 55`。


Reading additional input from stdin...
2026-06-30T08:50:58.285044Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:50:58.285074Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:50:58.285076Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-30T08:50:58.285077Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:50:58.285079Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:50:58.285080Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:50:58.285081Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:50:58.285082Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:50:58.285083Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:50:58.285084Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:50:58.285085Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-30T08:50:58.285086Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: high
reasoning summaries: none
session id: 019f17b9-71a5-7663-9e45-40a382de78c6
--------
user
3rd-review Phase 3 R3 for m13b-build-spec-deepening. Single remaining R2 finding: FR-ARTIFACT-001 non-blocking note was not explicit enough. Fixed: now reads '违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）'. This matches the same explicit pattern used for FR-BEHAV-001/002. 55 tests pass. Please verify FR-ARTIFACT-001 non-blocking clause is now complete and output final verdict: pass | revise_required.
2026-06-30T08:50:59.185353Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
我先核对落盘文本和相关上下文，只验证这个剩余点，不扩大范围。
exec
/bin/bash -lc "rg -n \"FR-ARTIFACT-001|FR-BEHAV-001|FR-BEHAV-002|质量事实契约|非阻断|不自动停止\" specs tasks . -g '"'!node_modules'"'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
./CLAUDE.md:14:- **记录事实而非阻断**：物理事实机器采集、浮现到边界，但不卡死推进。
./constitution-checklist.md:12:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。→ [CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门](CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门)
./constitution-checklist.md:22:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。→ [CONSTITUTION.md#q1-记事实而非阻断](CONSTITUTION.md#q1-记事实而非阻断)
tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.raw.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.raw.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
./README.md:7:workflowhub 把开发流程拆成五个阶段，每个阶段做成一个独立、可搬运、可被子代理调用的技能；多个技能组成一个工作流。它强调：薄核心、窄契约、质量靠独立审查与人（而非阻断式质量门）、记录事实而非卡死流程。完整的设计原则见 [CONSTITUTION.md](CONSTITUTION.md)，逐条检查清单见 [constitution-checklist.md](constitution-checklist.md)。
tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
./skills/spec-plan/templates/plan-template.md:37:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。<!-- 判据说明 -->
./skills/spec-plan/templates/plan-template.md:47:- [ ] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。<!-- 判据说明 -->
tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report.md:8:第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。
tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report.md:16:- [major] 位置: spec.md:323 | 问题: FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。 | 建议: 明确：`[ ]` 不符合项不阻断；但 21 条缺失、无状态、无判据属于检查产物无效，应使 build-plan 失败。
specs/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report-round-3.md:8:第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。
tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report-round-3.md:16:- [major] 位置: spec.md:323 | 问题: FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。 | 建议: 明确：`[ ]` 不符合项不阻断；但 21 条缺失、无状态、无判据属于检查产物无效，应使 build-plan 失败。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:608:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:618:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:1101:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:1102:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:1406:    36	- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:1416:    46	- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:1902:   328	    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:1903:   329	    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:2566:   328	    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:2567:   329	    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:2630:specs/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:2634:specs/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:2692:specs/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:2693:specs/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:2760:    36	- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
tasks/m12-build-plan-v1/review/codex-raw-output.txt:2770:    46	- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
./workflows/make-decision/SKILL.md:57:其余步骤失败均记录后继续推进（非阻断）。
./workflows/make-decision/SKILL.md:119:**失败处理**（非阻断）：
./workflows/make-decision/SKILL.md:122:- 无论成功或失败，S1 均非阻断，必须继续到 S2。
./workflows/make-decision/SKILL.md:186:3. 接收用户回答后，记录 journal 事件 `event: "s4_baseline_recorded"`（非阻断，不等确认直接继续）。
./workflows/make-decision/SKILL.md:389:**失败/不可达分支**（非阻断）：
./workflows/make-decision/SKILL.md:564:| `s1_all_agents_failed` | S1（full 档） | `reason: "<原因>"`, `s1_mode: "subagent"/"inline_serial"` | 内部调研全部失败（非阻断） |
specs/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
tasks/m13-make-decision-v1/review/codex-review-prompt.md:19:2. 方向盲审（blind review）——复用 3rd-review skill，异源，非阻断
tasks/m13-make-decision-v1/review/codex-review-prompt.md:23:全部非阻断（D5），唯一 hard gate 是 S9 用户明确批准。"
tasks/m13-make-decision-v1/review/codex-review-prompt.md:83:理由: workflowhub 无既有业务 env 惯例，所有 env 透传外部 skill 已有约定，不引入新惯例；可选+安全默认保证 D5 非阻断
tasks/m13-make-decision-v1/review/codex-review-prompt.md:86:来源证据: tasks/m13-make-decision-v1/research/env-var-design.md §env-var清单全节 + §设计原则；D5 CONSTITUTION 非阻断原则
tasks/m13-make-decision-v1/review/codex-review-prompt.md:93:理由: 宪法 D5 记录事实而非阻断；quality 靠独立审查和人确认，不靠自动机器 gate；台账无静默踢出防止需求被悄悄丢弃
tasks/m13-make-decision-v1/review/codex-review-prompt.md:96:来源证据: make-decision-flow-aligned.md §横切质量机制表；原始 intake.md 各条；CONSTITUTION.md D5 非阻断原则
tasks/m13-make-decision-v1/review/codex-review-prompt.md:174:2. 方向盲审（blind review）via 3rd-review, 异源, 非阻断
tasks/m12-build-plan-v1/plan-tasks-review-package.md:81:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
tasks/m12-build-plan-v1/plan-tasks-review-package.md:104:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
tasks/m12-build-plan-v1/decision-log.md:73:- **理由链**：M11 D-M11-7 路由表明确 speckit-analyze 留 M12。analyze 天然只读非破坏，符合"记录事实而非阻断"。
tasks/m13-make-decision-v1/stage-result-make-decision.json:6:    "decision": "M13 深化 make-decision 为 12 步流程（S0、S0.5、S1-S10）：背景扎根→scope-triage→内部调研→talk#1门控外部→条件性双路调研(muyu-search-mcp+anysearch,返空即停)→talk#2收敛+方向基线确认→三角度异源盲审(3rd-review)+第一次debate调用点→给用户看→talk#3→grill→草稿→orchestrator审查+第二次debate调用点→同步CONTEXT/ADR→S9用户批准→落盘。全部非阻断(D5)，debate触发判断和五方法庭/单人三档模式委托 /Users/Hugh/Hugh/Project/debate 技能 Step 1，make-decision 只做skip/path/call/read verdict薄编排，唯一hard gate=S9。",
tasks/m13-make-decision-v1/decision-log.md:16:> 2. 方向盲审（blind review）——复用 3rd-review skill，异源，非阻断
tasks/m13-make-decision-v1/decision-log.md:20:> 全部非阻断（D5），唯一 hard gate 是 S9 用户明确批准。"
tasks/m13-make-decision-v1/decision-log.md:106:| 理由 | workflowhub 无既有业务 env 惯例，所有 env 透传外部 skill 已有约定，不引入新惯例；可选+安全默认保证 D5 非阻断 |
tasks/m13-make-decision-v1/decision-log.md:109:| 来源证据 | `tasks/m13-make-decision-v1/research/env-var-design.md` §env-var清单全节 + §设计原则；D5 CONSTITUTION 非阻断原则 |
tasks/m13-make-decision-v1/decision-log.md:121:| 理由 | 宪法 D5 "记录事实而非阻断"；quality 靠独立审查和人确认，不靠自动机器 gate；台账无静默踢出防止需求被悄悄丢弃 |
tasks/m13-make-decision-v1/decision-log.md:124:| 来源证据 | `tasks/m13-make-decision-v1/research/make-decision-flow-aligned.md` §横切质量机制表；原始 intake.md D28台账/方向基线确认衔接点/三角度输入隔离/防漏阀留痕/新想法回退判定D15/双路返空即停/交互简洁各条；CONSTITUTION.md D5 非阻断原则 |
./workflows/build-plan/SKILL.md:80:- The check is about recording facts (Q1: 记事实而非阻断), NOT about passing a quality gate
tasks/m13b-build-spec-deepening/scope-decision.md:40:### D-M13b-3：spec-reviewer 触发条件 = 可选、非阻断
tasks/m13b-build-spec-deepening/scope-decision.md:61:| spec-reviewer（M0 ref） | 新建 | 独立子代理，非阻断 |
tasks/m13-make-decision-v1/research/env-var-design.md:16:- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`：启用五方法庭对抗模式。**不设置时自动降级为单人三档模式**，非阻断。
tasks/m13-make-decision-v1/research/env-var-design.md:56:| `MAKE_DECISION_SKIP_BLIND_REVIEW` | 设为 `1` 跳过盲审（非阻断标志，调试 / 离线环境用） | 未设置（正常执行） | blind-review action | 否 |
specs/m12-build-plan-v1/constitution-check.md:16:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — cross-artifact-analyze 作为独立第三方技能扫描三产物（FR-XARTIFACT-001），加一次人审检查点（FR-REVIEW-001），决策 D-M12-5 明确引用"承接 F4 异源审查不卡死"，未设阻断式质量门。
specs/m12-build-plan-v1/constitution-check.md:26:- [x] **Q1 记事实而非阻断** — 宪法检查结果"仅记录浮现供人审查，不因不达标阻断"（FR-CONSTITUTION-002），analyze 报告"仅记录不阻断"（FR-XARTIFACT-002），基线对照"不达标不阻断推进"（FR-BASELINE-002），与 F3/F4 一致。
tasks/m13b-build-spec-deepening/decision-log.md:13:把 agenthub design 阶段的质量保障体系移植进 workflowhub `workflows/build-spec/SKILL.md`。后续用户三轮纠正：接受方向修正为质量事实契约；agenthub design 不全保留，逐块评估留/删/改；审查机制砍三 source_family 硬要求改省钱版；5 框架外部调研暂不做；TASK_TRACKING_ROOT 放本任务做（一直没做导致没正确留存任务执行记录）；交互要大白话+给选项、勤报进度。
tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
tasks/m13b-build-spec-deepening/decision-log.md:22:- **D1（目标重定义）**：build-spec 必须产出「质量事实契约」=｛scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads｝。机制只做候选实现、反选最少，不照搬 agenthub 机制清单。
tasks/m13b-build-spec-deepening/decision-log.md:28:- **D4（审查恢复修正）**【修正 2026-06-30，Hugh 授权】：原降级基于错误前提——将「异源独立审查」误当成「3 个不同 source_family 各审一角度」的高成本机制。事实是 agenthub design 原审查 = 单一异源引擎（如 codex）的 3rd-review 独立审查，workflowhub 现有 3rd-review 基础设施可直接复用，成本仅一次异源调用。**恢复为 B=真·异源独立审查：复用现有 3rd-review（单一异源引擎），产出 verdict+findings，记入质量事实契约第 3 项，非阻断（记录+浮现+人判断）。不做 3 source_family 多重审查（过度工程，Hugh 从未要求）。单一异源满足宪法独立裁决最小要求。**
tasks/m13b-build-spec-deepening/decision-log.md:57:- build-spec SKILL.md 含「质量事实契约」5 项产出定义（scope 边界/自检/独立审查摘要/未解风险/handoff required_reads），可逐项核对。
tasks/m13b-build-spec-deepening/decision-log.md:60:- 审查机制为真·异源独立审查（复用现有 3rd-review，单一异源引擎），结论记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查。
specs/m12-build-plan-v1/plan.md.handwritten.bak:78:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m12-build-plan-v1/plan.md.handwritten.bak:101:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./workflows/build-spec/SKILL.md:42:- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
./workflows/build-spec/SKILL.md:126:- 记录进质量事实契约第 4 项（未解风险）
./workflows/build-spec/SKILL.md:133:spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
./workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
./workflows/build-spec/SKILL.md:151:- 结论记入质量事实契约第 3 项（独立审查摘要路径）
./workflows/build-spec/SKILL.md:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
./workflows/build-spec/SKILL.md:160:完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
./workflows/build-spec/SKILL.md:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
./workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
./workflows/build-spec/SKILL.md:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
./workflows/build-spec/SKILL.md:196:长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
./workflows/build-spec/SKILL.md:198:#### FR 场景行为验证（FR-BEHAV-001/002）
./workflows/build-spec/SKILL.md:200:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
./workflows/build-spec/SKILL.md:201:- **FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为；meta 场景（描述 build-spec 机制本身的）豁免此要求
./workflows/build-spec/SKILL.md:203:以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
./workflows/build-spec/SKILL.md:217:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./workflows/build-spec/SKILL.md:226:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./workflows/build-spec/SKILL.md:240:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./workflows/build-spec/SKILL.md:258:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/report-round-1.md:14:- [major] 位置: workflows/make-decision/SKILL.md:292 | 问题: S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。 | 建议: 把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。
specs/m13-make-decision-v1/plan.md:11:将 `skills/make-decision/SKILL.md` 从 M7 的两步骤（scope-triage + decision-log）全面重写为带五类护城河动作的 12 步流程（S0、S0.5、S1–S10）。新增：S0 背景扎根、S0.5 scope-triage(分档 lite/full)、S1 内部调研（full档专属）、S2/S4/S7 三轮 talk 交互、S3 双路外部调研、S5 三角度异源盲审+第一次debate门控、S6 展示盲审/debate结果给用户、S7 talk#3→grill→draft→orchestrator→第二次debate门控、S8 台账渲染、S9 用户批准（唯一硬门）、S10 decision-log 落盘。所有步骤均为记录态非阻断，S9 是唯一强制等待点。
specs/m13-make-decision-v1/plan.md:37:| **F4 质量靠异源审查与人而非阻断式质量门** | [x] | 盲审（S5 三角度异源 3rd-review）、debate（S5/S7 门控）、S9 用户确认均为质量机制；无任何自动化阻断 gate（S9 唯一硬门且需人确认）。|
specs/m13-make-decision-v1/plan.md:38:| **F5 gate谨慎添加出事再补无用则移除** | [x] | 全流程仅 S9 一个 gate（人工确认），其余检查点均为记录态非阻断；F10 Gate 章节对每个机制逐条过四问，零冗余机制。|
specs/m13-make-decision-v1/plan.md:44:| **Q1 记事实而非阻断** | [x] | 所有失败/跳过路径（s1_all_agents_failed、debate_1: skipped、debate_triggered_invalid 等）均记录事实到 journal，继续推进，不阻断。|
specs/m13-make-decision-v1/plan.md:150:**Step 2.6 — S4 方向设计 + talk#2（非阻断，记录态）**
specs/m13-make-decision-v1/plan.md:153:- 动作：向用户展示方向摘要，问 Q2 收敛方向；用户回答后记 `s4_baseline_recorded: true`（非阻断，不等确认即继续）；渲染点①：写 `artifacts/make-decision-original-context.md`（原始需求逐条初始状态），此文件落盘后 S5 方可执行
specs/m13-make-decision-v1/plan.md:245:| FR-ACCEPT-01 S4 方向基线记录（非阻断） | 带错方向进入高成本盲审 | 无 S5 前检查点 | 可跳过（非代码门），记录态继续 | 低 | **保留** |
specs/m13-make-decision-v1/plan.md:267:| Step 2.6 S4 + talk#2 + 渲染点① | FR-ACCEPT-01, FR-TALK-01, FR-LEDGER-01 | `s4_baseline_recorded: true`（非阻断）；original-context.md 在 S5 前落盘 |
specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.raw.json:22:      "issue": "S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。",
specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.raw.json:23:      "recommendation": "把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。"
./tests/m12-spec-analyze.test.mjs:177:      content.includes("非阻断");
tasks/m13b-build-spec-deepening/artifacts/make-decision-blind-review-merged.md:38:1. **从「移植机制清单」转向「质量事实契约」**：codex 与 antigravity 独立给出同一建议——别搬 7 机制清单，先定义 build-spec 必须产出的质量事实（scope 边界 / 自检结果 / 异源审查摘要 / 未解风险 / handoff required_reads），机制可替换、反选最少。
specs/m13-make-decision-v1/review/plan-review-r4.md:112:- S9 仍是唯一 hard gate；S4 为记录态非阻断；未发现新增 blocking gate。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:89:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:212:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:284:- 质量事实契约 5 项齐全：[workflows/build-spec/SKILL.md:158](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:158) 到 [workflows/build-spec/SKILL.md:168](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 包含 scope 边界、自检结果、独立审查摘要、未解风险、handoff required_reads，并声明记录+浮现语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:399:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:783:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:855:+- 记录进质量事实契约第 4 项（未解风险）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:862:+spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:868:+5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:880:+- 结论记入质量事实契约第 3 项（独立审查摘要路径）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:887:+### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:889:+完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:911:+### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:921:+条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:923:+#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:927:+#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:929:+- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:930:+- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:986:    42	- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1070:   126	- 记录进质量事实契约第 4 项（未解风险）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1077:   133	spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1083:   139	5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1095:   151	- 结论记入质量事实契约第 3 项（独立审查摘要路径）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1102:   158	### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1104:   160	完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1126:   182	### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1136:   192	条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1138:   194	#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1142:   198	#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1144:   200	- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1145:   201	- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1159:   215	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1168:   224	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1427:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1428:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1430:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1433:tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1436:tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1439:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1452:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1456:workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1458:workflows/build-spec/SKILL.md:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1459:workflows/build-spec/SKILL.md:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1461:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1462:workflows/build-spec/SKILL.md:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1465:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1469:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1470:specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1472:specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1475:specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1477:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1479:specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1483:specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1484:specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1485:specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1486:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1489:specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1491:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1492:specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1494:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1497:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1499:specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1500:specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1504:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1508:specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1509:specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1511:specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1513:specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1521:specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1524:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1527:specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1529:specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1533:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1536:specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1538:specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1543:specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1545:specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1560:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:48: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1561:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1569:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:14: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1575:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1585:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:383: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1586:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1588:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1602:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:19: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1611:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1633:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1634:specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1639:specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1640:specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1641:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1669:   238	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1687:   256	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1825:tests/m13b-build-spec-deepening.test.mjs:107:      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1832:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1833:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1858:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1860:tests/m13b-build-spec-deepening.test.mjs:273:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1880:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1884:workflows/build-spec/SKILL.md:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1889:workflows/build-spec/SKILL.md:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1891:workflows/build-spec/SKILL.md:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1892:workflows/build-spec/SKILL.md:198:#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1893:workflows/build-spec/SKILL.md:200:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1894:workflows/build-spec/SKILL.md:201:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1897:specs/m13b-build-spec-deepening/spec.md:160:### 质量事实契约（FR-CONTRACT）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1898:specs/m13b-build-spec-deepening/spec.md:162:**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1899:specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1907:specs/m13b-build-spec-deepening/spec.md:208:**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1910:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1913:specs/m13b-build-spec-deepening/spec.md:237:**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1915:specs/m13b-build-spec-deepening/spec.md:241:**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1916:specs/m13b-build-spec-deepening/spec.md:244:- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1918:specs/m13b-build-spec-deepening/spec.md:248:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1929:specs/m13b-build-spec-deepening/spec.md:295:**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1934:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1936:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1940:specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1943:specs/m13b-build-spec-deepening/spec.md:411:- [RISK] FR-REVIEW-001 异源 3rd-review：依赖现有 3rd-review 基础设施可用（journal/collector/runner）；若基础设施不可用，审查步骤需降级处理并记录在质量事实契约第 3 项。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1945:specs/m13b-build-spec-deepening/spec.md:439:| D1 | 目标重定义：build-spec 产出「质量事实契约」5 项（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），机制反选最少 | FR-CONTRACT-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1946:specs/m13b-build-spec-deepening/spec.md:440:| D2 | 保留薄质量本体：spec 构建本体（spec-specify/spec-clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps | **FR-BUILD-001**, FR-LADDER-001/002, FR-STRUCTURE-001/002, FR-SELFCHECK-001/002, FR-REVIEW-001/002, FR-BEHAV-001/002, FR-FRICTION-001, FR-TASKDIR-001, FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1947:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2059:describe("Phase 2 / AC-01: 质量事实契约 5 items", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2060:  test("SKILL.md declares 质量事实契约 section", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2061:    assert.ok(skill().includes("质量事实契约"),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2062:      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2090:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2091:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2167:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2187:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2201:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2216:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2228:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2327:specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2389:FR-ARTIFACT-001
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2390:FR-BEHAV-001
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2391:FR-BEHAV-002
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2895:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2899:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2904:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2906:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2907:198:#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2908:200:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2909:201:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2936:340:- [ ] **AC-01**：`workflows/build-spec/SKILL.md` 含质量事实契约 5 项定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），可 grep 到 5 项标题。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2946:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2947:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2989:- 质量事实契约 5 项齐全：[workflows/build-spec/SKILL.md:158](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:158) 到 [workflows/build-spec/SKILL.md:168](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 包含 scope 边界、自检结果、独立审查摘要、未解风险、handoff required_reads，并声明记录+浮现语义。
specs/m13-make-decision-v1/review/plan-review-r1.md:81:S4 被 plan/tasks 写成等待用户确认的 gate，违反上游 spec 和“唯一硬门 S9”规则。spec 明确要求 S4 是“记录模式，非阻断”，展示方向基线后直接推进到 S5，不等待显式确认；journal 事件应为 `s4_baseline_recorded: true`，不是 `s4_baseline_confirmed: true`。
specs/m13-make-decision-v1/review/plan-review-r1.md:294:- S4 非阻断被 plan/tasks 改成确认 gate
specs/m13-make-decision-v1/review/plan-review-r1.md:346:当前 plan/tasks 不是小修即可放行。必须先修正 12 步命名、lite/full 路由、S4 非阻断、S5/S6 分工、台账渲染时机、env var 清单、宪法检查和 cross-analysis 假绿问题。修完后应重新执行 build-plan 的 spec-plan/spec-tasks/spec-analyze 三步，确保三产物同步。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:86:# 功能规格：build-spec 质量事实契约深化（M13b）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:99:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:103:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:119:7. 质量事实契约（无结构化 5 项质量事实产出）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:133:以最小改动让 build-spec 产出 5 项质量事实契约，覆盖 spec 构建本体 + 自检 + 独立审查 + 已知风险 + handoff 交接。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:139:- 质量事实契约 5 项定义 + 最小实现机制
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:142:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:143:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:150:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:175:### 场景 3.1：编排者走完整 build-spec 流程（正常路径，含质量事实契约）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:177:- **操作步骤**：编排者传入 task-id + decision-log 路径，调起 build-spec；执行代理读 decision-log，产出 spec 初稿，运行 spec-ladder 判断档位，执行 7 条自检 + Spec-Purity grep，运行异源 3rd-review 独立审查，生成 5 项质量事实契约，写入 spec.md + checklists/requirements.md + spec-acceptance-count.json。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:178:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:183:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:188:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:203:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:208:- **预期结果**：warn 到 onWarn 回调，不 throw，stage 继续，质量事实契约正常产出。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:234:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:236:### 质量事实契约（FR-CONTRACT）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:238:**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:246:- **场景**：Given build-spec 完成一次运行，When 检查 spec.md，Then 质量事实契约 5 项字段均存在，任一字段缺失即自检报 warn。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:249:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:251:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:274:- **层 3 附录**：质量事实契约、Known Gaps、兼容性预留、设计决策记录
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:284:**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:294:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:303:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:305:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:313:**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:317:**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:320:- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:324:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:344:specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:348:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:375:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:388:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:390:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:398:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:400:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:457:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:459:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:460:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:462:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:464:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:491:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:493:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:509:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:515:specs/m13b-build-spec-deepening/constitution-check.md:30:  spec 设计中所有质量事实契约项均"浮现供人判断"（场景 3.2/3.3/3.6 均以"人工可见"或"浮现给人判断"为预期结果），独立三角度审查偏差不自动推进处理，符合"不可逆操作须经人在边界确认"的 F7 原则；spec 未定义任何自动越过人的推进逻辑。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:516:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:526:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:541:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:581:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:585:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:589:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:591:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:592:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:593:198:#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:598:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:600:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:602:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:604:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:660:- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:744:- 记录进质量事实契约第 4 项（未解风险）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:751:spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:757:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:769:- 结论记入质量事实契约第 3 项（独立审查摘要路径）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:776:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:778:完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:800:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:810:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:812:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:816:#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:818:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:819:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:833:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:842:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:856:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:874:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:953:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:965:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/spec.md:10:# 功能规格：build-spec 质量事实契约深化（M13b）
specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/spec.md:43:7. 质量事实契约（无结构化 5 项质量事实产出）
specs/m13b-build-spec-deepening/spec.md:57:以最小改动让 build-spec 产出 5 项质量事实契约，覆盖 spec 构建本体 + 自检 + 独立审查 + 已知风险 + handoff 交接。
specs/m13b-build-spec-deepening/spec.md:63:- 质量事实契约 5 项定义 + 最小实现机制
specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/spec.md:99:### 场景 3.1：编排者走完整 build-spec 流程（正常路径，含质量事实契约）
specs/m13b-build-spec-deepening/spec.md:101:- **操作步骤**：编排者传入 task-id + decision-log 路径，调起 build-spec；执行代理读 decision-log，产出 spec 初稿，运行 spec-ladder 判断档位，执行 7 条自检 + Spec-Purity grep，运行异源 3rd-review 独立审查，生成 5 项质量事实契约，写入 spec.md + checklists/requirements.md + spec-acceptance-count.json。
specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/spec.md:132:- **预期结果**：warn 到 onWarn 回调，不 throw，stage 继续，质量事实契约正常产出。
specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/spec.md:160:### 质量事实契约（FR-CONTRACT）
specs/m13b-build-spec-deepening/spec.md:162:**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：
specs/m13b-build-spec-deepening/spec.md:170:- **场景**：Given build-spec 完成一次运行，When 检查 spec.md，Then 质量事实契约 5 项字段均存在，任一字段缺失即自检报 warn。
specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/spec.md:198:- **层 3 附录**：质量事实契约、Known Gaps、兼容性预留、设计决策记录
specs/m13b-build-spec-deepening/spec.md:208:**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/spec.md:237:**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。
specs/m13b-build-spec-deepening/spec.md:241:**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。
specs/m13b-build-spec-deepening/spec.md:244:- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。
specs/m13b-build-spec-deepening/spec.md:248:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
specs/m13b-build-spec-deepening/spec.md:295:**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。
specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/spec.md:340:- [ ] **AC-01**：`workflows/build-spec/SKILL.md` 含质量事实契约 5 项定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），可 grep 到 5 项标题。
specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/spec.md:375:## 附录 A：质量事实契约（本 spec 自检）
specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
specs/m13b-build-spec-deepening/spec.md:403:| verdict | pass | spec 主体为质量事实契约+最小实现，与 decision-log 一致（由异源引擎在独立上下文裁决） |
specs/m13b-build-spec-deepening/spec.md:411:- [RISK] FR-REVIEW-001 异源 3rd-review：依赖现有 3rd-review 基础设施可用（journal/collector/runner）；若基础设施不可用，审查步骤需降级处理并记录在质量事实契约第 3 项。
specs/m13b-build-spec-deepening/spec.md:439:| D1 | 目标重定义：build-spec 产出「质量事实契约」5 项（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），机制反选最少 | FR-CONTRACT-001/002 |
specs/m13b-build-spec-deepening/spec.md:440:| D2 | 保留薄质量本体：spec 构建本体（spec-specify/spec-clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps | **FR-BUILD-001**, FR-LADDER-001/002, FR-STRUCTURE-001/002, FR-SELFCHECK-001/002, FR-REVIEW-001/002, FR-BEHAV-001/002, FR-FRICTION-001, FR-TASKDIR-001, FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:8:1. 目标=定义 build-spec 必须产出的「质量事实契约」（scope 边界/自检结果/异源审查摘要/未解风险/handoff required_reads），机制只做候选实现、反选最少。不照搬 agenthub 机制清单。
tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:18:- **方向**：质量事实契约这个方向能否既保质量又不违宪？有无硬伤？
specs/m13-make-decision-v1/review/plan-review-r6-prompt.md:13:核 R5 的 1 minor 是否真修好：cross-analyze B5 追溯说明已用新格式「反对 X：/决定 Y：/理由 Z：」且已解决列点名全链路(spec/plan/tasks/decision-log D6/T016)，全仓 artifacts 无旧斜杠格式 `反对X/决定Y/理由Z` 残留。同时整体扫一遍有无任何残留矛盾/假绿/新引入问题。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.json:22:      "issue": "S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。",
specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.json:23:      "recommendation": "把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。"
specs/m13-make-decision-v1/review/plan-review-prompt.md:17:6. 是否违反项目硬规则：薄核心窄契约、记录态非阻断（D5）、唯一硬门 S9、不自审自判。
./tests/m13-make-decision.test.mjs:428:      content.includes("非阻断") ||
specs/m13b-build-spec-deepening/plan.md:11:本计划实施 build-spec 质量事实契约深化（M13b）。目标是在 `workflows/build-spec/SKILL.md`（当前 M11 v1）中加入一套薄"质量事实契约"能力，覆盖 5 项质量事实输出（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review、TASK_TRACKING_ROOT 环境变量约定、以及若干辅助产物和交互规范。
specs/m13b-build-spec-deepening/plan.md:35:- `workflows/build-spec/SKILL.md` — 主产物，添加质量事实契约 5 项 + 所有 FR 覆盖内容
specs/m13b-build-spec-deepening/plan.md:81:**Purpose**: 写入 spec 构建流水线、spec-ladder、质量事实契约 5 项定义、自检、审查等核心 FR，依赖 Phase 1 的基础节定义。
specs/m13b-build-spec-deepening/plan.md:93:**Step 2.3**: 在 SKILL.md 新增「质量事实契约 5 项定义」节
specs/m13b-build-spec-deepening/plan.md:105:- 内容：异源引擎执行、产出 verdict+findings、记入质量事实契约第 3 项，禁止自审自判（FR-REVIEW-001/002）
specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/plan.md:129:- 内容：[FRICTION] 条目格式（FR-FRICTION-001）；长报告存文件传路径规范（FR-ARTIFACT-001）；FR 场景格式要求（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/plan.md:130:- FR 覆盖：FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002
specs/m13b-build-spec-deepening/plan.md:154:| Step 3.2 | FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 | AC-09, AC-15 |
specs/m13b-build-spec-deepening/plan.md:193:- [x] **F1 薄核心** — 判据：本 spec 改动集中在 `workflows/build-spec/SKILL.md` 技能层，核心调度零改动；质量事实契约、自检、审查均下沉到 SKILL.md，核心只做调度。符合 F1 薄核心。
specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/plan.md:217:- [x] **Q3 人可见可干预** — 判据：所有 warn/偏差/gap 均浮现到质量事实契约供人判断；FR-ARTIFACT-001 要求长报告存文件传路径，人可读取。符合 Q3。
specs/m13b-build-spec-deepening/plan.md:219:- [x] **S1 技能有明确输入输出契约** — 判据：FR-BUILD-001 明确 spec 构建流水线 I/O；FR-TASKDIR-001 明确 --task-dir 参数与回退规则；质量事实契约 5 项字段明确为输出契约。符合 S1。
specs/m13b-build-spec-deepening/plan.md:227:- [x] **S5 技能颗粒度合适** — 判据：SKILL.md 深化的每个 FR 覆盖一个功能域，按 Phase 分节实施；质量事实契约 5 项为一个合理的原子单元，不切割成过细的微服务。符合 S5。
specs/m13b-build-spec-deepening/plan.md:259:### 机制 1：质量事实契约 5 项字段（FR-CONTRACT-001）
specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/plan.md:358:| FR-BEHAV-001 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/plan.md:359:| FR-BEHAV-002 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/plan.md:366:| FR-ARTIFACT-001 | Step 3.2 | T013 |
specs/m13-make-decision-v1/review/plan-review-r3-prompt.md:13:逐条核 R2 的 12 findings 是否真修好（宪法21条对真实清单/S8含CONTEXT同步/FR-REVIEW-03三行留痕/盲审fallback失败语义/双路均空即停/grill artifact/metrics十core fields/cross-analyze五字段无假绿/FR-SCOPE-01/decision-log D1+开放问题/baseline注脚）。同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13-make-decision-v1/review/plan-review-r5-prompt.md:17:同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:16:| 7 条自检清单 | 128-136 | 非阻断自检，便宜。含 Spec-Purity grep（纯事实粗筛）。 |
tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/r5-review-prompt.md:17:- tasks.md:75 now reads: "T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）"
specs/m13b-build-spec-deepening/r5-review-prompt.md:42:- [ ] T002 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec 三层结构要求」节：定义层 1 速读卡（一句话需求+核心改动，文件顶部 30 行内）、层 2 正文（问题陈述/背景/FR/AC/影响范围）、层 3 附录（质量事实契约/Known Gaps/设计决策）；新增 Known Gaps 段为必填项说明（可为空列表）。FR: FR-STRUCTURE-001, FR-STRUCTURE-002 (stage:1, depends:无)
specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:76:- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
specs/m13b-build-spec-deepening/r5-review-prompt.md:92:T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）
specs/m13b-build-spec-deepening/r5-review-prompt.md:113:| FR-BEHAV-001 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/r5-review-prompt.md:114:| FR-BEHAV-002 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/r5-review-prompt.md:121:| FR-ARTIFACT-001 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/r5-review-prompt.md:144:The spec.md declares these 24 FRs: FR-BUILD-001, FR-CONTRACT-001, FR-CONTRACT-002, FR-LADDER-001, FR-LADDER-002, FR-STRUCTURE-001, FR-STRUCTURE-002, FR-SELFCHECK-001, FR-SELFCHECK-002, FR-REVIEW-001, FR-REVIEW-002, FR-BEHAV-001, FR-BEHAV-002, FR-FRICTION-001, FR-TASKDIR-001, FR-TRACKING-001, FR-TRACKING-002, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001, FR-COMM-001, FR-COMM-002, FR-SCOPETRIAGE-001, FR-ALIGN-001.
specs/m13-make-decision-v1/review/plan-review-r2.md:27:| 3 | fixed | S4 已改为 `s4_baseline_recorded: true`，非阻断，不再写 confirmed。 |
specs/m13-make-decision-v1/review/plan-review-r2.md:58:- 真实 F8 是“简单优先”，plan F8 写成“记录事实而非阻断”。
tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:23:| 4 | 7 条自检清单（全过才能触发审查） | 清单**合宪**；"才能触发"阻断味**违 Q1** | 保留自检，非阻断 |
specs/m13-make-decision-v1/review/plan-review-r6.md:55:### 记录态非阻断 / 唯一硬门 S9
specs/m13b-build-spec-deepening/tasks.md:19:- [ ] T002 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec 三层结构要求」节：定义层 1 速读卡（一句话需求+核心改动，文件顶部 30 行内）、层 2 正文（问题陈述/背景/FR/AC/影响范围）、层 3 附录（质量事实契约/Known Gaps/设计决策）；新增 Known Gaps 段为必填项说明（可为空列表）。FR: FR-STRUCTURE-001, FR-STRUCTURE-002 (stage:1, depends:无)
specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/tasks.md:53:- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
specs/m13b-build-spec-deepening/tasks.md:75:T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）
specs/m13b-build-spec-deepening/tasks.md:84:2. 完成 T005（质量事实契约 5 项）：核心骨架就位
specs/m13b-build-spec-deepening/tasks.md:92:2. T005 完成 → 质量事实契约骨架 ready，下游可预读
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:36: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:37:   → SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:38: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:40: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:42: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:44: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:46: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:48: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:85:   → SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
specs/m13-make-decision-v1/reviews/build-code-phase-1.md:72:### 记录态非阻断 (非阻断门原则)
specs/m13-make-decision-v1/reviews/build-code-phase-1.md:74:env var 表明确说明：路径不可达时"自动降级跳过 debate（skipped），记录 `debate_path_unavailable: true`"，明确是记录而非阻断。`MAKE_DECISION_SKIP_BLIND_REVIEW`、`MAKE_DECISION_SKIP_DEBATE` 均走跳过+记录路径。无硬拦截逻辑。**通过。**
specs/m13-make-decision-v1/reviews/build-code-phase-1.md:146:- env var 表设计完整，6 个变量均有安全默认值、降级路径说明和 override 示例，符合宪法"记录态非阻断"原则。
./tests/m13b-build-spec-deepening.test.mjs:104:describe("Phase 2 / AC-01: 质量事实契约 5 items", () => {
./tests/m13b-build-spec-deepening.test.mjs:105:  test("SKILL.md declares 质量事实契约 section", () => {
./tests/m13b-build-spec-deepening.test.mjs:106:    assert.ok(skill().includes("质量事实契约"),
./tests/m13b-build-spec-deepening.test.mjs:107:      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
./tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
./tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
./tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
./tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
./tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
./tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
./tests/m13b-build-spec-deepening.test.mjs:273:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
specs/m13-make-decision-v1/review/plan-review-r2-prompt.md:13:逐条核 R1 的 15 findings 是否真修好（尤其：12步统一含S0背景扎根+S0.5、lite只跳S1+S3不跳talk/盲审/grill、S4非阻断s4_baseline_recorded、S5盲审+debate门控/S6展示、台账原始需求落盘在S4后S5前、6个env var正确、宪法21条对齐真实清单无幻引、talk三轮S2/S4/S7、双路extra_sources>=3+get_sources停下、盲审5字段+FR-REVIEW-03、grill纯委托、T-final每task有FR回指、cross-analyze去假绿、metrics recordSkeleton+updateOwnResult、baseline 4列）。
specs/m13-make-decision-v1/review/plan-review-r2-prompt.md:15:同时查有无新引入的矛盾/假绿/遗漏。硬规则：薄核心窄契约、记录态非阻断(D5)、唯一硬门S9、不自审自判、不假绿不占位。
tasks/m13b-build-spec-deepening/artifacts/s5-prompt-scope.md:8:1. 移植 7 个质保机制进 build-spec SKILL.md（异源审查、journal/evidence、spec-purity 扫描、7 自检、退出门、推进门、摩擦即记，全部合宪改造为非阻断）。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:39:- 质量事实契约 5 项：字段名已定，值格式（字符串/列表/表格）未完全锁定。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:40:- **OQ-1**（OPEN）：质量事实契约第 2 项（自检结果）和第 3 项（独立审查摘要）在 SKILL.md 中是用 Markdown 表格还是 JSON 块记录？decision-log 未明确格式，只说"记录事实"。建议：Markdown 表格（可读性优先），待 build-plan 确认。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:111:- **OQ-3**（OPEN）：SKILL.md 深化版本的 `skill_version` 应为 `2.0.0` 还是 `1.1.0`？decision-log 未明确版本号语义（是语义化版本还是里程碑编号）。建议：`2.0.0`（因引入质量事实契约为较大功能扩展），待人工确认。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:134:| OQ-1 | 数据格式 | 质量事实契约第 2/3 项在 SKILL.md 中用 Markdown 表格还是 JSON 块？ | Markdown 表格（可读性优先） |
specs/m13-make-decision-v1/review/spec-review-r2.md:32:ID: F-02 | STATUS: PARTIALLY_CLOSED | EVIDENCE: spec.md 的 FR-ACCEPT-01 已改成"记录模式，非阻断"，并要求 S4 后直接进入 S5。问题是权威 decision-log.md 的 D6 仍写着"S4 后 S5 前，未确认挡住流程但非机器gate"，这仍和"S9 唯一 hard gate"冲突。
specs/m13-make-decision-v1/review/spec-review-r2.md:82:| F-02 | blocking | PARTIALLY_CLOSED | spec 改为非阻断，但 decision-log.md D6 仍写"S4 未确认挡住流程"，权威文档矛盾未解 |
./specs/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
./specs/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:8: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:9: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:10: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:11: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:12: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:13: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:14: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:13:- 收敛 major：从「移植机制清单」转向「定义 build-spec 必须产出的质量事实契约（scope边界/自检/异源审查摘要/未解风险/handoff required_reads），机制可替换反选最少」。
tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:19:- **维持**（甲方方向成立，乙方意见降级为非阻断备注）
specs/m13-make-decision-v1/review/plan-review-r4-prompt.md:18:同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13b-build-spec-deepening/checklists/requirements.md:13:- [x] 聚焦用户价值与业务需求（质量事实契约、自检、审查均以行为描述）
specs/m13b-build-spec-deepening/checklists/requirements.md:41:| D1 质量事实契约最小实现 | [x] | FR-CONTRACT-001/002 |
specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
./specs/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
./specs/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:22: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:23: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:24: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:25: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:26: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13-make-decision-v1/stage-result-build-spec.json:7:    "spec_summary": "M13 make-decision 深化 spec：FR 覆盖 12 步流程（S0、S0.5、S1-S10）+ FR-RESEARCH-00/01/02/03 双路调研 + FR-REVIEW-01/02 三角度异源盲审 + FR-DEBATE 双调用点委托 debate 技能自判 + FR-TALK-01/02 + FR-GRILL-01 + FR-LEDGER 台账D28 + FR-ENV-01 六环境变量 + FR-METRIC + FR-DRAFT-01 + FR-ACCEPT-01/02/03 验收。全程记录态非阻断，唯一硬门 S9。",
specs/m13-make-decision-v1/tasks.md:108:### T010：实现 S4 方向设计 + talk#2 + 台账渲染点①（非阻断记录态）
specs/m13-make-decision-v1/tasks.md:109:- **FR 映射**：FR-ACCEPT-01（S4 方向基线，非阻断），FR-TALK-01（talk#2），FR-LEDGER-01（渲染点①：original-context.md 在 S4 后 S5 前落盘）
specs/m13-make-decision-v1/tasks.md:114:- **完成条件**：向用户展示方向摘要，问 Q2 收敛方向；用户回答后记 `s4_baseline_recorded: true`（非阻断，不等确认直接继续）；渲染点①写入 `make-decision-original-context.md`（原始需求逐条初始状态）；S5 依赖此文件存在，T011 depends T010
./specs/m12-build-plan-v1/constitution-check.md:16:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — cross-artifact-analyze 作为独立第三方技能扫描三产物（FR-XARTIFACT-001），加一次人审检查点（FR-REVIEW-001），决策 D-M12-5 明确引用"承接 F4 异源审查不卡死"，未设阻断式质量门。
./specs/m12-build-plan-v1/constitution-check.md:26:- [x] **Q1 记事实而非阻断** — 宪法检查结果"仅记录浮现供人审查，不因不达标阻断"（FR-CONSTITUTION-002），analyze 报告"仅记录不阻断"（FR-XARTIFACT-002），基线对照"不达标不阻断推进"（FR-BASELINE-002），与 F3/F4 一致。
specs/m13-make-decision-v1/constitution-check.md:10:- [x] **F3 物理事实靠机器校验但不阻断** — metrics 写失败 warn 不 throw（FR-METRIC-01）；muyu get_sources 失败**立即停下报告用户等待指令**（FR-RESEARCH-01，非自动降级，已在 spec OPEN-1 解决）；两路均空记录 dual_research_empty 不阻断（FR-RESEARCH-03）。注：muyu 失败属"物理来源核实失败需人决策"，停下等人是 let-it-crash 原则，不违反非阻断原则（非阻断指不因质量判断阻断，不指掩盖数据缺失）。
specs/m13-make-decision-v1/constitution-check.md:11:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 三角度盲审走 3rd-review 异源链（FR-REVIEW-01），各 reviewer 独立，审查结果非阻断；debate 有条件触发非默认阻断；S9 是唯一人确认点。
specs/m13-make-decision-v1/constitution-check.md:14:- [x] **F7 推进与不可逆操作不自动越过人** — S9 方向确认硬门控须用户明确回复"同意"才可落盘（FR-ACCEPT-02，唯一强制 gate）；S4 方向基线为记录模式非阻断检查点（FR-ACCEPT-01，已修正）；任何护城河跳过均有 journal 记录。
specs/m13-make-decision-v1/constitution-check.md:21:- [x] **Q1 记事实而非阻断** — 台账驳回理由、blocking 留痕（FR-REVIEW-03）、muyu 失败标记均为记录性产物；所有护城河跳过时 journal 记录 skipped 而非报错阻断（隐性必达 1）。
./specs/m12-build-plan-v1/plan.md.handwritten.bak:78:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/m12-build-plan-v1/plan.md.handwritten.bak:101:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13-make-decision-v1/spec.md:14:  2. 新增三角度异源盲审（3rd-review 链，非阻断）
specs/m13-make-decision-v1/spec.md:35:make-decision 是工作流第一阶段，决策质量直接决定后续所有阶段的价值。M13 继承 M7 已有 scope-triage 和 decision-log 不变，在其基础上增加五类护城河动作（D1–D5）并保证全程非阻断（D5）。
specs/m13-make-decision-v1/spec.md:40:- 五类护城河动作均可独立触发和跳过（非阻断）
specs/m13-make-decision-v1/spec.md:77:6. S4：talk-with-zhipeng 第 2 轮 + 方向基线确认（记录模式，非阻断对话检查点）+ 原始需求落盘
specs/m13-make-decision-v1/spec.md:91:**验收标准**：lite 档时 S1 和 S3 对应 journal 事件分别记录 `skipped: scope=lite`；full 档时 S1 必须执行；S3 仅在 S2/talk#1 门控外部调研为"需要"时执行，否则记录 `skipped: s2_gate=no_external_research` （非阻断）。
specs/m13-make-decision-v1/spec.md:108:- **失败行为**：若任一 sub-agent 失败，记录失败 agent ID 和原因到 `internal-research-summary.md` 中，继续执行其余 agents 的输出合并；若全部 agents 失败，记录 `s1_all_agents_failed: true`，继续推进到 S2（非阻断，告知用户内部调研失败原因）。
specs/m13-make-decision-v1/spec.md:296:### FR-ACCEPT-01：方向基线确认（S4，记录模式，非阻断）
specs/m13-make-decision-v1/spec.md:385:- **隐性必达 1**：所有护城河动作非阻断（跳过时 journal 有记录，不报错）
specs/m13-make-decision-v1/spec.md:492:| FR-DEBATE-01/02: debate 条件门控 | >2 blocking 时缺乏升级机制 | 无 | 理论可绕（计数错），但非阻断低风险 | 低 | **保留** |
specs/m13b-build-spec-deepening/r3-review-prompt.md:10:FR-SELFCHECK-001: build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
specs/m13b-build-spec-deepening/r3-review-prompt.md:73:| FR-ARTIFACT-001    | 3.1 | T013 |
specs/m13b-build-spec-deepening/r3-review-prompt.md:74:| FR-BEHAV-001       | 3.1 | T013 |
specs/m13b-build-spec-deepening/r3-review-prompt.md:75:| FR-BEHAV-002       | 3.1 | T013 |
specs/m13b-build-spec-deepening/r3-review-prompt.md:102:- T013 [P] FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
./specs/m13b-build-spec-deepening/constitution-check.md:12:  spec 的核心改动对象是 `workflows/build-spec/SKILL.md`（调度描述层），所有新机制（质量事实契约、自检、审查）均下沉到 SKILL 层描述，核心调度不变；改动牵连面明确限定为单文件深化 + 新增产物文件（影响范围第 7 节），符合"能力下沉技能层、核心只做调度"的薄核心定义。
./specs/m13b-build-spec-deepening/constitution-check.md:15:  spec 通过 `--task-dir`（FR-TASKDIR-001）、`TASK_TRACKING_ROOT`（FR-TRACKING-001）、handoff required_reads（质量事实契约第 5 项）三项明确接口与上下游交互，内部实现（7 条自检、三角度审查步骤）不暴露给调用方；模块间接口窄且文件化，符合窄契约定义。
./specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
./specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
./specs/m13b-build-spec-deepening/constitution-check.md:27:  spec 引入 `TASK_TRACKING_ROOT` 全局环境变量（FR-TRACKING-001/002），所有 stage 统一从该变量读取任务跟踪文件根目录，跟踪文件不存 repo（.gitignore 约定），实现了统一外置执行记录；`spec-acceptance-count.json`（FR-ACCOUNT-001）和质量事实契约作为结构化产物补充记录，符合 F6。
./specs/m13b-build-spec-deepening/constitution-check.md:30:  spec 设计中所有质量事实契约项均"浮现供人判断"（场景 3.2/3.3/3.6 均以"人工可见"或"浮现给人判断"为预期结果），独立三角度审查偏差不自动推进处理，符合"不可逆操作须经人在边界确认"的 F7 原则；spec 未定义任何自动越过人的推进逻辑。
./specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
./specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
./specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
./specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
./specs/m13b-build-spec-deepening/constitution-check.md:68:  spec 通过 `TASK_TRACKING_ROOT` + 任务跟踪文件（FR-TRACKING-001/002）、`spec-acceptance-count.json`（FR-ACCOUNT-001，含 ac_count/fr_count/counted_at）、质量事实契约 5 项结构化产出共同构成指标采集体系；metrics recordSkeleton 场景（3.7）专门处理指标写入失败的降级路径，符合 S4 配套指标采集的要求。
./specs/m13b-build-spec-deepening/constitution-check.md:71:  FR-ARTIFACT-001（artifact-first）明确规定"长报告只存路径，禁止在交互消息或 stage-result 中内联完整报告文本（超过 500 字即视为长报告）"；FR-COMM-002 要求勤报进度用路径而非全文；这两条直接减少主上下文占用，便于子代理独立调用技能，符合 S5。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:89:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:212:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:284:- 质量事实契约 5 项齐全：[workflows/build-spec/SKILL.md:158](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:158) 到 [workflows/build-spec/SKILL.md:168](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 包含 scope 边界、自检结果、独立审查摘要、未解风险、handoff required_reads，并声明记录+浮现语义。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:399:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:783:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:855:+- 记录进质量事实契约第 4 项（未解风险）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:862:+spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:868:+5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:880:+- 结论记入质量事实契约第 3 项（独立审查摘要路径）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:887:+### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:889:+完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:911:+### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:921:+条目写入质量事实契约第 4 项（未解风险），不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:923:+#### Artifact-First 只传路径（FR-ARTIFACT-001）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:927:+#### FR 场景行为验证（FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:929:+- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:930:+- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:986:    42	- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1070:   126	- 记录进质量事实契约第 4 项（未解风险）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1077:   133	spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1083:   139	5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1095:   151	- 结论记入质量事实契约第 3 项（独立审查摘要路径）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1102:   158	### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1104:   160	完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1126:   182	### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1136:   192	条目写入质量事实契约第 4 项（未解风险），不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1138:   194	#### Artifact-First 只传路径（FR-ARTIFACT-001）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1142:   198	#### FR 场景行为验证（FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1144:   200	- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1145:   201	- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1159:   215	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1168:   224	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1427:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1428:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1430:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1433:tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1436:tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1439:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1452:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1456:workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1458:workflows/build-spec/SKILL.md:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1459:workflows/build-spec/SKILL.md:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1461:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1462:workflows/build-spec/SKILL.md:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1465:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1469:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1470:specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1472:specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1475:specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1477:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1479:specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1483:specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1484:specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1485:specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1486:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1489:specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1491:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1492:specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1494:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1497:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1499:specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1500:specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1504:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1508:specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1509:specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1511:specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1513:specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1521:specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1524:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1527:specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1529:specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1533:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1536:specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1538:specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1543:specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1545:specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1560:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:48: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1561:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1569:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:14: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1575:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1585:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:383: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1586:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1588:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1602:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:19: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1611:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1633:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1634:specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1639:specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1640:specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1641:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1669:   238	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1687:   256	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1825:tests/m13b-build-spec-deepening.test.mjs:107:      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1832:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1833:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1858:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1860:tests/m13b-build-spec-deepening.test.mjs:273:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1880:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1884:workflows/build-spec/SKILL.md:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1889:workflows/build-spec/SKILL.md:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1891:workflows/build-spec/SKILL.md:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1892:workflows/build-spec/SKILL.md:198:#### FR 场景行为验证（FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1893:workflows/build-spec/SKILL.md:200:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1894:workflows/build-spec/SKILL.md:201:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1897:specs/m13b-build-spec-deepening/spec.md:160:### 质量事实契约（FR-CONTRACT）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1898:specs/m13b-build-spec-deepening/spec.md:162:**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1899:specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1907:specs/m13b-build-spec-deepening/spec.md:208:**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1910:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1913:specs/m13b-build-spec-deepening/spec.md:237:**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1915:specs/m13b-build-spec-deepening/spec.md:241:**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1916:specs/m13b-build-spec-deepening/spec.md:244:- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1918:specs/m13b-build-spec-deepening/spec.md:248:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1929:specs/m13b-build-spec-deepening/spec.md:295:**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1934:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1936:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1940:specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1943:specs/m13b-build-spec-deepening/spec.md:411:- [RISK] FR-REVIEW-001 异源 3rd-review：依赖现有 3rd-review 基础设施可用（journal/collector/runner）；若基础设施不可用，审查步骤需降级处理并记录在质量事实契约第 3 项。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1945:specs/m13b-build-spec-deepening/spec.md:439:| D1 | 目标重定义：build-spec 产出「质量事实契约」5 项（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），机制反选最少 | FR-CONTRACT-001/002 |
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1946:specs/m13b-build-spec-deepening/spec.md:440:| D2 | 保留薄质量本体：spec 构建本体（spec-specify/spec-clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps | **FR-BUILD-001**, FR-LADDER-001/002, FR-STRUCTURE-001/002, FR-SELFCHECK-001/002, FR-REVIEW-001/002, FR-BEHAV-001/002, FR-FRICTION-001, FR-TASKDIR-001, FR-SCOPETRIAGE-001, FR-ALIGN-001 |
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1947:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2059:describe("Phase 2 / AC-01: 质量事实契约 5 items", () => {
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2060:  test("SKILL.md declares 质量事实契约 section", () => {
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2061:    assert.ok(skill().includes("质量事实契约"),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2062:      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2090:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2091:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2167:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2187:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2201:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2216:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2228:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2327:specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2389:FR-ARTIFACT-001
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2390:FR-BEHAV-001
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2391:FR-BEHAV-002
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2895:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2899:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2904:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2906:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2907:198:#### FR 场景行为验证（FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2908:200:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2909:201:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2936:340:- [ ] **AC-01**：`workflows/build-spec/SKILL.md` 含质量事实契约 5 项定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），可 grep 到 5 项标题。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2946:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2947:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2989:- 质量事实契约 5 项齐全：[workflows/build-spec/SKILL.md:158](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:158) 到 [workflows/build-spec/SKILL.md:168](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 包含 scope 边界、自检结果、独立审查摘要、未解风险、handoff required_reads，并声明记录+浮现语义。
specs/m13-make-decision-v1/evidence/phase-2-notes.md:33:- **S1 非阻断**：全部 sub-agents 失败时记录 `s1_all_agents_failed: true` 并继续到 S2，不抛错不阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:86:# 功能规格：build-spec 质量事实契约深化（M13b）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:99:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:103:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:119:7. 质量事实契约（无结构化 5 项质量事实产出）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:133:以最小改动让 build-spec 产出 5 项质量事实契约，覆盖 spec 构建本体 + 自检 + 独立审查 + 已知风险 + handoff 交接。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:139:- 质量事实契约 5 项定义 + 最小实现机制
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:142:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:143:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:150:- spec↔decision-log 一致性检查（非阻断，记差异）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:175:### 场景 3.1：编排者走完整 build-spec 流程（正常路径，含质量事实契约）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:177:- **操作步骤**：编排者传入 task-id + decision-log 路径，调起 build-spec；执行代理读 decision-log，产出 spec 初稿，运行 spec-ladder 判断档位，执行 7 条自检 + Spec-Purity grep，运行异源 3rd-review 独立审查，生成 5 项质量事实契约，写入 spec.md + checklists/requirements.md + spec-acceptance-count.json。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:178:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:183:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:188:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:203:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:208:- **预期结果**：warn 到 onWarn 回调，不 throw，stage 继续，质量事实契约正常产出。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:234:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:236:### 质量事实契约（FR-CONTRACT）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:238:**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:246:- **场景**：Given build-spec 完成一次运行，When 检查 spec.md，Then 质量事实契约 5 项字段均存在，任一字段缺失即自检报 warn。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:249:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:251:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:274:- **层 3 附录**：质量事实契约、Known Gaps、兼容性预留、设计决策记录
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:284:**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:294:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:303:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:305:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:313:**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:317:**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:320:- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:324:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:344:specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:348:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:375:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:388:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:390:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:398:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:400:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:457:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:459:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:460:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:462:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:464:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:491:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:493:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:509:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:515:specs/m13b-build-spec-deepening/constitution-check.md:30:  spec 设计中所有质量事实契约项均"浮现供人判断"（场景 3.2/3.3/3.6 均以"人工可见"或"浮现给人判断"为预期结果），独立三角度审查偏差不自动推进处理，符合"不可逆操作须经人在边界确认"的 F7 原则；spec 未定义任何自动越过人的推进逻辑。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:516:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:526:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:541:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:581:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:585:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:589:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:591:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:592:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:593:198:#### FR 场景行为验证（FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:598:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:600:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:602:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:604:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:660:- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:744:- 记录进质量事实契约第 4 项（未解风险）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:751:spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:757:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:769:- 结论记入质量事实契约第 3 项（独立审查摘要路径）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:776:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:778:完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:800:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:810:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:812:#### Artifact-First 只传路径（FR-ARTIFACT-001）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:816:#### FR 场景行为验证（FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:818:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:819:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:833:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:842:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:856:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:874:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:953:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:965:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:22: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:23: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:24: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:25: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:26: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:50:   → SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
specs/archive/m9-verify-code/plan.md:40:| Q1 记事实而非阻断 | YES | anomaly_flags 浮现警告不 FAIL；metrics 写失败只 warn 不 throw |
./specs/m13b-build-spec-deepening/spec.md:10:# 功能规格：build-spec 质量事实契约深化（M13b）
./specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
./specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
./specs/m13b-build-spec-deepening/spec.md:43:7. 质量事实契约（无结构化 5 项质量事实产出）
./specs/m13b-build-spec-deepening/spec.md:57:以最小改动让 build-spec 产出 5 项质量事实契约，覆盖 spec 构建本体 + 自检 + 独立审查 + 已知风险 + handoff 交接。
./specs/m13b-build-spec-deepening/spec.md:63:- 质量事实契约 5 项定义 + 最小实现机制
./specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
./specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
./specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
./specs/m13b-build-spec-deepening/spec.md:99:### 场景 3.1：编排者走完整 build-spec 流程（正常路径，含质量事实契约）
./specs/m13b-build-spec-deepening/spec.md:101:- **操作步骤**：编排者传入 task-id + decision-log 路径，调起 build-spec；执行代理读 decision-log，产出 spec 初稿，运行 spec-ladder 判断档位，执行 7 条自检 + Spec-Purity grep，运行异源 3rd-review 独立审查，生成 5 项质量事实契约，写入 spec.md + checklists/requirements.md + spec-acceptance-count.json。
./specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
./specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
./specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
./specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
./specs/m13b-build-spec-deepening/spec.md:132:- **预期结果**：warn 到 onWarn 回调，不 throw，stage 继续，质量事实契约正常产出。
./specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
./specs/m13b-build-spec-deepening/spec.md:160:### 质量事实契约（FR-CONTRACT）
./specs/m13b-build-spec-deepening/spec.md:162:**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：
./specs/m13b-build-spec-deepening/spec.md:170:- **场景**：Given build-spec 完成一次运行，When 检查 spec.md，Then 质量事实契约 5 项字段均存在，任一字段缺失即自检报 warn。
./specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
./specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
./specs/m13b-build-spec-deepening/spec.md:198:- **层 3 附录**：质量事实契约、Known Gaps、兼容性预留、设计决策记录
./specs/m13b-build-spec-deepening/spec.md:208:**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
./specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
./specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
./specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
./specs/m13b-build-spec-deepening/spec.md:237:**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。
./specs/m13b-build-spec-deepening/spec.md:241:**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。
./specs/m13b-build-spec-deepening/spec.md:244:- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。
./specs/m13b-build-spec-deepening/spec.md:248:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
./specs/m13b-build-spec-deepening/spec.md:295:**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。
./specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
./specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
./specs/m13b-build-spec-deepening/spec.md:340:- [ ] **AC-01**：`workflows/build-spec/SKILL.md` 含质量事实契约 5 项定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），可 grep 到 5 项标题。
./specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
./specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
./specs/m13b-build-spec-deepening/spec.md:375:## 附录 A：质量事实契约（本 spec 自检）
./specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
./specs/m13b-build-spec-deepening/spec.md:403:| verdict | pass | spec 主体为质量事实契约+最小实现，与 decision-log 一致（由异源引擎在独立上下文裁决） |
./specs/m13b-build-spec-deepening/spec.md:411:- [RISK] FR-REVIEW-001 异源 3rd-review：依赖现有 3rd-review 基础设施可用（journal/collector/runner）；若基础设施不可用，审查步骤需降级处理并记录在质量事实契约第 3 项。
./specs/m13b-build-spec-deepening/spec.md:439:| D1 | 目标重定义：build-spec 产出「质量事实契约」5 项（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），机制反选最少 | FR-CONTRACT-001/002 |
./specs/m13b-build-spec-deepening/spec.md:440:| D2 | 保留薄质量本体：spec 构建本体（spec-specify/spec-clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps | **FR-BUILD-001**, FR-LADDER-001/002, FR-STRUCTURE-001/002, FR-SELFCHECK-001/002, FR-REVIEW-001/002, FR-BEHAV-001/002, FR-FRICTION-001, FR-TASKDIR-001, FR-SCOPETRIAGE-001, FR-ALIGN-001 |
./specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
./specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:269: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:270:AssertionError: SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:279:    104| describe("Phase 2 / AC-01: 质量事实契约 5 items", () => {
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:280:    105|   test("SKILL.md declares 质量事实契约 section", () => {
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:281:    106|     assert.ok(skill().includes("质量事实契约"),
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:283:    107|       "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:288: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:307: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:326: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:345: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:364: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:383: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:397:    135|       c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && …
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:669:AssertionError: SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:683:    273|       "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)…
./specs/m13b-build-spec-deepening/build-plan-3rd-review.md:273:- tasks.md:75 "T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）"
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:3: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:22: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:41: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:60: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:79: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
./specs/m13b-build-spec-deepening/plan.md:11:本计划实施 build-spec 质量事实契约深化（M13b）。目标是在 `workflows/build-spec/SKILL.md`（当前 M11 v1）中加入一套薄"质量事实契约"能力，覆盖 5 项质量事实输出（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review、TASK_TRACKING_ROOT 环境变量约定、以及若干辅助产物和交互规范。
./specs/m13b-build-spec-deepening/plan.md:35:- `workflows/build-spec/SKILL.md` — 主产物，添加质量事实契约 5 项 + 所有 FR 覆盖内容
./specs/m13b-build-spec-deepening/plan.md:81:**Purpose**: 写入 spec 构建流水线、spec-ladder、质量事实契约 5 项定义、自检、审查等核心 FR，依赖 Phase 1 的基础节定义。
./specs/m13b-build-spec-deepening/plan.md:93:**Step 2.3**: 在 SKILL.md 新增「质量事实契约 5 项定义」节
./specs/m13b-build-spec-deepening/plan.md:105:- 内容：异源引擎执行、产出 verdict+findings、记入质量事实契约第 3 项，禁止自审自判（FR-REVIEW-001/002）
./specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
./specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
./specs/m13b-build-spec-deepening/plan.md:129:- 内容：[FRICTION] 条目格式（FR-FRICTION-001）；长报告存文件传路径规范（FR-ARTIFACT-001）；FR 场景格式要求（FR-BEHAV-001/002）
./specs/m13b-build-spec-deepening/plan.md:130:- FR 覆盖：FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002
./specs/m13b-build-spec-deepening/plan.md:154:| Step 3.2 | FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 | AC-09, AC-15 |
./specs/m13b-build-spec-deepening/plan.md:193:- [x] **F1 薄核心** — 判据：本 spec 改动集中在 `workflows/build-spec/SKILL.md` 技能层，核心调度零改动；质量事实契约、自检、审查均下沉到 SKILL.md，核心只做调度。符合 F1 薄核心。
./specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
./specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
./specs/m13b-build-spec-deepening/plan.md:217:- [x] **Q3 人可见可干预** — 判据：所有 warn/偏差/gap 均浮现到质量事实契约供人判断；FR-ARTIFACT-001 要求长报告存文件传路径，人可读取。符合 Q3。
./specs/m13b-build-spec-deepening/plan.md:219:- [x] **S1 技能有明确输入输出契约** — 判据：FR-BUILD-001 明确 spec 构建流水线 I/O；FR-TASKDIR-001 明确 --task-dir 参数与回退规则；质量事实契约 5 项字段明确为输出契约。符合 S1。
./specs/m13b-build-spec-deepening/plan.md:227:- [x] **S5 技能颗粒度合适** — 判据：SKILL.md 深化的每个 FR 覆盖一个功能域，按 Phase 分节实施；质量事实契约 5 项为一个合理的原子单元，不切割成过细的微服务。符合 S5。
./specs/m13b-build-spec-deepening/plan.md:259:### 机制 1：质量事实契约 5 项字段（FR-CONTRACT-001）
./specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
./specs/m13b-build-spec-deepening/plan.md:358:| FR-BEHAV-001 | Step 3.2 | T013 |
./specs/m13b-build-spec-deepening/plan.md:359:| FR-BEHAV-002 | Step 3.2 | T013 |
./specs/m13b-build-spec-deepening/plan.md:366:| FR-ARTIFACT-001 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stderr:4:AssertionError: SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stderr:18:    273|       "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)…
./CONSTITUTION.md:31:### F4 质量靠异源审查与人，而非阻断式质量门
./CONSTITUTION.md:82:### Q1 记事实而非阻断
./specs/m13b-build-spec-deepening/r5-review-prompt.md:17:- tasks.md:75 now reads: "T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）"
./specs/m13b-build-spec-deepening/r5-review-prompt.md:42:- [ ] T002 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec 三层结构要求」节：定义层 1 速读卡（一句话需求+核心改动，文件顶部 30 行内）、层 2 正文（问题陈述/背景/FR/AC/影响范围）、层 3 附录（质量事实契约/Known Gaps/设计决策）；新增 Known Gaps 段为必填项说明（可为空列表）。FR: FR-STRUCTURE-001, FR-STRUCTURE-002 (stage:1, depends:无)
./specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
./specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
./specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/r5-review-prompt.md:76:- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
./specs/m13b-build-spec-deepening/r5-review-prompt.md:92:T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）
./specs/m13b-build-spec-deepening/r5-review-prompt.md:113:| FR-BEHAV-001 | Step 3.2 | T013 |
./specs/m13b-build-spec-deepening/r5-review-prompt.md:114:| FR-BEHAV-002 | Step 3.2 | T013 |
./specs/m13b-build-spec-deepening/r5-review-prompt.md:121:| FR-ARTIFACT-001 | Step 3.2 | T013 |
./specs/m13b-build-spec-deepening/r5-review-prompt.md:144:The spec.md declares these 24 FRs: FR-BUILD-001, FR-CONTRACT-001, FR-CONTRACT-002, FR-LADDER-001, FR-LADDER-002, FR-STRUCTURE-001, FR-STRUCTURE-002, FR-SELFCHECK-001, FR-SELFCHECK-002, FR-REVIEW-001, FR-REVIEW-002, FR-BEHAV-001, FR-BEHAV-002, FR-FRICTION-001, FR-TASKDIR-001, FR-TRACKING-001, FR-TRACKING-002, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001, FR-COMM-001, FR-COMM-002, FR-SCOPETRIAGE-001, FR-ALIGN-001.
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:8: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:9: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:11: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:13: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:15: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:17: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:19: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:28:| I-01 | LOW | spec.md FR 列表 vs plan.md Verification Mapping | spec.md 附录 C（决策落点覆盖）提及 FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 为"新增 FR"（5 项），但 spec.md 正文 §4 功能需求小节标题顺序与 plan.md Verification Mapping 中的 Step 排序存在轻微不一致——spec §4 按域分组（FR-BUILD → FR-CONTRACT → FR-LADDER → … → FR-COMM），plan 按实施阶段分组（Phase 1 = 基础节先行）。两者都正确，仅顺序视角不同。 | id:I-01, type:inconsistency, location:spec.md §4 vs plan.md Implementation Steps, description:FR 分组视角不同（按域 vs 按实施依赖），suggested_action:无需修改，两种分组均合理且互补 |
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:29:| I-02 | LOW | tasks.md Task ID 引用 vs plan.md FR Coverage Matrix | plan.md §Step 9 FR 覆盖矩阵列出任务编号 T001–T015，但 tasks.md 实际只有 T001–T014（14 条任务）。plan.md 矩阵中 T015 对应 FR-BEHAV-001/002, FR-FRICTION-001, FR-ARTIFACT-001，这些在 tasks.md 中合并到 T013 覆盖。 | id:I-02, type:inconsistency, location:plan.md §Step9 FR Coverage Matrix row T015 vs tasks.md, description:plan.md 矩阵引用 T015 但 tasks.md 无此编号（已并入 T013）, suggested_action:plan.md FR Coverage Matrix 中 T015 改为 T013 |
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:48:| G-01 | LOW | spec.md AC-20, AC-21 vs plan.md/tasks.md | spec.md 含 AC-20（Known Gaps 段可搜索）和 AC-21（行为验证场景格式覆盖）。plan.md Verification Mapping 未单独列出 AC-20/AC-21 的对应 Step（AC-20 隐含在 Step 1.2 / FR-STRUCTURE-002，AC-21 隐含在 Step 3.2 / FR-BEHAV-001/002）。 | id:G-01, type:coverage_gap, location:plan.md Verification Mapping, description:AC-20/AC-21 未显式在 Verification Mapping 中出现, suggested_action:可将 AC-20 加入 Step 1.2 行、AC-21 加入 Step 3.2 行；低优先级，功能覆盖已存在 |
./specs/m13b-build-spec-deepening/tasks.md:19:- [ ] T002 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec 三层结构要求」节：定义层 1 速读卡（一句话需求+核心改动，文件顶部 30 行内）、层 2 正文（问题陈述/背景/FR/AC/影响范围）、层 3 附录（质量事实契约/Known Gaps/设计决策）；新增 Known Gaps 段为必填项说明（可为空列表）。FR: FR-STRUCTURE-001, FR-STRUCTURE-002 (stage:1, depends:无)
./specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
./specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
./specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
./specs/m13b-build-spec-deepening/tasks.md:53:- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
./specs/m13b-build-spec-deepening/tasks.md:75:T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）
./specs/m13b-build-spec-deepening/tasks.md:84:2. 完成 T005（质量事实契约 5 项）：核心骨架就位
./specs/m13b-build-spec-deepening/tasks.md:92:2. T005 完成 → 质量事实契约骨架 ready，下游可预读
specs/m13b-build-spec-deepening/constitution-check.md:12:  spec 的核心改动对象是 `workflows/build-spec/SKILL.md`（调度描述层），所有新机制（质量事实契约、自检、审查）均下沉到 SKILL 层描述，核心调度不变；改动牵连面明确限定为单文件深化 + 新增产物文件（影响范围第 7 节），符合"能力下沉技能层、核心只做调度"的薄核心定义。
specs/m13b-build-spec-deepening/constitution-check.md:15:  spec 通过 `--task-dir`（FR-TASKDIR-001）、`TASK_TRACKING_ROOT`（FR-TRACKING-001）、handoff required_reads（质量事实契约第 5 项）三项明确接口与上下游交互，内部实现（7 条自检、三角度审查步骤）不暴露给调用方；模块间接口窄且文件化，符合窄契约定义。
specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/constitution-check.md:27:  spec 引入 `TASK_TRACKING_ROOT` 全局环境变量（FR-TRACKING-001/002），所有 stage 统一从该变量读取任务跟踪文件根目录，跟踪文件不存 repo（.gitignore 约定），实现了统一外置执行记录；`spec-acceptance-count.json`（FR-ACCOUNT-001）和质量事实契约作为结构化产物补充记录，符合 F6。
specs/m13b-build-spec-deepening/constitution-check.md:30:  spec 设计中所有质量事实契约项均"浮现供人判断"（场景 3.2/3.3/3.6 均以"人工可见"或"浮现给人判断"为预期结果），独立三角度审查偏差不自动推进处理，符合"不可逆操作须经人在边界确认"的 F7 原则；spec 未定义任何自动越过人的推进逻辑。
specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/constitution-check.md:68:  spec 通过 `TASK_TRACKING_ROOT` + 任务跟踪文件（FR-TRACKING-001/002）、`spec-acceptance-count.json`（FR-ACCOUNT-001，含 ac_count/fr_count/counted_at）、质量事实契约 5 项结构化产出共同构成指标采集体系；metrics recordSkeleton 场景（3.7）专门处理指标写入失败的降级路径，符合 S4 配套指标采集的要求。
specs/m13b-build-spec-deepening/constitution-check.md:71:  FR-ARTIFACT-001（artifact-first）明确规定"长报告只存路径，禁止在交互消息或 stage-result 中内联完整报告文本（超过 500 字即视为长报告）"；FR-COMM-002 要求勤报进度用路径而非全文；这两条直接减少主上下文占用，便于子代理独立调用技能，符合 S5。
./specs/m13b-build-spec-deepening/spec-clarify-scan.md:39:- 质量事实契约 5 项：字段名已定，值格式（字符串/列表/表格）未完全锁定。
./specs/m13b-build-spec-deepening/spec-clarify-scan.md:40:- **OQ-1**（OPEN）：质量事实契约第 2 项（自检结果）和第 3 项（独立审查摘要）在 SKILL.md 中是用 Markdown 表格还是 JSON 块记录？decision-log 未明确格式，只说"记录事实"。建议：Markdown 表格（可读性优先），待 build-plan 确认。
./specs/m13b-build-spec-deepening/spec-clarify-scan.md:111:- **OQ-3**（OPEN）：SKILL.md 深化版本的 `skill_version` 应为 `2.0.0` 还是 `1.1.0`？decision-log 未明确版本号语义（是语义化版本还是里程碑编号）。建议：`2.0.0`（因引入质量事实契约为较大功能扩展），待人工确认。
./specs/m13b-build-spec-deepening/spec-clarify-scan.md:134:| OQ-1 | 数据格式 | 质量事实契约第 2/3 项在 SKILL.md 中用 Markdown 表格还是 JSON 块？ | Markdown 表格（可读性优先） |
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:273:- tasks.md:75 "T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）"
./specs/m13b-build-spec-deepening/checklists/requirements.md:13:- [x] 聚焦用户价值与业务需求（质量事实契约、自检、审查均以行为描述）
./specs/m13b-build-spec-deepening/checklists/requirements.md:41:| D1 质量事实契约最小实现 | [x] | FR-CONTRACT-001/002 |
./specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
./specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
./specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/report-round-1.md:14:- [major] 位置: workflows/make-decision/SKILL.md:292 | 问题: S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。 | 建议: 把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。
./specs/m13b-build-spec-deepening/r3-review-prompt.md:10:FR-SELFCHECK-001: build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
./specs/m13b-build-spec-deepening/r3-review-prompt.md:73:| FR-ARTIFACT-001    | 3.1 | T013 |
./specs/m13b-build-spec-deepening/r3-review-prompt.md:74:| FR-BEHAV-001       | 3.1 | T013 |
./specs/m13b-build-spec-deepening/r3-review-prompt.md:75:| FR-BEHAV-002       | 3.1 | T013 |
./specs/m13b-build-spec-deepening/r3-review-prompt.md:102:- T013 [P] FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
./specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.raw.json:22:      "issue": "S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。",
./specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.raw.json:23:      "recommendation": "把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。"
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:36: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:37:   → SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:38: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:40: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:42: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:44: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:46: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:48: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:85:   → SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
./specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:8: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
./specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:9: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
./specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:10: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
./specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:11: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
./specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:12: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
./specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:13: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
./specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:14: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.json:22:      "issue": "S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。",
./specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.json:23:      "recommendation": "把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。"
./specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:22: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
./specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:23: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
./specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:24: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
./specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:25: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
./specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:26: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
./specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
./specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./tasks/m13b-build-spec-deepening/scope-decision.md:40:### D-M13b-3：spec-reviewer 触发条件 = 可选、非阻断
./tasks/m13b-build-spec-deepening/scope-decision.md:61:| spec-reviewer（M0 ref） | 新建 | 独立子代理，非阻断 |
./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report.md:8:第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。
./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report.md:16:- [major] 位置: spec.md:323 | 问题: FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。 | 建议: 明确：`[ ]` 不符合项不阻断；但 21 条缺失、无状态、无判据属于检查产物无效，应使 build-plan 失败。
./tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
./tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
./tasks/m12-build-plan-v1/decision-log.md:73:- **理由链**：M11 D-M11-7 路由表明确 speckit-analyze 留 M12。analyze 天然只读非破坏，符合"记录事实而非阻断"。
./tasks/m13b-build-spec-deepening/decision-log.md:13:把 agenthub design 阶段的质量保障体系移植进 workflowhub `workflows/build-spec/SKILL.md`。后续用户三轮纠正：接受方向修正为质量事实契约；agenthub design 不全保留，逐块评估留/删/改；审查机制砍三 source_family 硬要求改省钱版；5 框架外部调研暂不做；TASK_TRACKING_ROOT 放本任务做（一直没做导致没正确留存任务执行记录）；交互要大白话+给选项、勤报进度。
./tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
./tasks/m13b-build-spec-deepening/decision-log.md:22:- **D1（目标重定义）**：build-spec 必须产出「质量事实契约」=｛scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads｝。机制只做候选实现、反选最少，不照搬 agenthub 机制清单。
./tasks/m13b-build-spec-deepening/decision-log.md:28:- **D4（审查恢复修正）**【修正 2026-06-30，Hugh 授权】：原降级基于错误前提——将「异源独立审查」误当成「3 个不同 source_family 各审一角度」的高成本机制。事实是 agenthub design 原审查 = 单一异源引擎（如 codex）的 3rd-review 独立审查，workflowhub 现有 3rd-review 基础设施可直接复用，成本仅一次异源调用。**恢复为 B=真·异源独立审查：复用现有 3rd-review（单一异源引擎），产出 verdict+findings，记入质量事实契约第 3 项，非阻断（记录+浮现+人判断）。不做 3 source_family 多重审查（过度工程，Hugh 从未要求）。单一异源满足宪法独立裁决最小要求。**
./tasks/m13b-build-spec-deepening/decision-log.md:57:- build-spec SKILL.md 含「质量事实契约」5 项产出定义（scope 边界/自检/独立审查摘要/未解风险/handoff required_reads），可逐项核对。
./tasks/m13b-build-spec-deepening/decision-log.md:60:- 审查机制为真·异源独立审查（复用现有 3rd-review，单一异源引擎），结论记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查。
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:269: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:270:AssertionError: SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:279:    104| describe("Phase 2 / AC-01: 质量事实契约 5 items", () => {
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:280:    105|   test("SKILL.md declares 质量事实契约 section", () => {
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:281:    106|     assert.ok(skill().includes("质量事实契约"),
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:283:    107|       "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:288: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:307: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:326: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:345: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:364: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:383: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:397:    135|       c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && …
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:669:AssertionError: SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:683:    273|       "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)…
./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report-round-3.md:8:第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。
./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report-round-3.md:16:- [major] 位置: spec.md:323 | 问题: FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。 | 建议: 明确：`[ ]` 不符合项不阻断；但 21 条缺失、无状态、无判据属于检查产物无效，应使 build-plan 失败。
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:8: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:9: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:11: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:13: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:15: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:17: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:19: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:608:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:618:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1101:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1102:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1406:    36	- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1416:    46	- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1902:   328	    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1903:   329	    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2566:   328	    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2567:   329	    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2630:specs/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2634:specs/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2692:specs/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2693:specs/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2760:    36	- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2770:    46	- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.raw.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.raw.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
./specs/m13-make-decision-v1/plan.md:11:将 `skills/make-decision/SKILL.md` 从 M7 的两步骤（scope-triage + decision-log）全面重写为带五类护城河动作的 12 步流程（S0、S0.5、S1–S10）。新增：S0 背景扎根、S0.5 scope-triage(分档 lite/full)、S1 内部调研（full档专属）、S2/S4/S7 三轮 talk 交互、S3 双路外部调研、S5 三角度异源盲审+第一次debate门控、S6 展示盲审/debate结果给用户、S7 talk#3→grill→draft→orchestrator→第二次debate门控、S8 台账渲染、S9 用户批准（唯一硬门）、S10 decision-log 落盘。所有步骤均为记录态非阻断，S9 是唯一强制等待点。
./specs/m13-make-decision-v1/plan.md:37:| **F4 质量靠异源审查与人而非阻断式质量门** | [x] | 盲审（S5 三角度异源 3rd-review）、debate（S5/S7 门控）、S9 用户确认均为质量机制；无任何自动化阻断 gate（S9 唯一硬门且需人确认）。|
./specs/m13-make-decision-v1/plan.md:38:| **F5 gate谨慎添加出事再补无用则移除** | [x] | 全流程仅 S9 一个 gate（人工确认），其余检查点均为记录态非阻断；F10 Gate 章节对每个机制逐条过四问，零冗余机制。|
./specs/m13-make-decision-v1/plan.md:44:| **Q1 记事实而非阻断** | [x] | 所有失败/跳过路径（s1_all_agents_failed、debate_1: skipped、debate_triggered_invalid 等）均记录事实到 journal，继续推进，不阻断。|
./specs/m13-make-decision-v1/plan.md:150:**Step 2.6 — S4 方向设计 + talk#2（非阻断，记录态）**
./specs/m13-make-decision-v1/plan.md:153:- 动作：向用户展示方向摘要，问 Q2 收敛方向；用户回答后记 `s4_baseline_recorded: true`（非阻断，不等确认即继续）；渲染点①：写 `artifacts/make-decision-original-context.md`（原始需求逐条初始状态），此文件落盘后 S5 方可执行
./specs/m13-make-decision-v1/plan.md:245:| FR-ACCEPT-01 S4 方向基线记录（非阻断） | 带错方向进入高成本盲审 | 无 S5 前检查点 | 可跳过（非代码门），记录态继续 | 低 | **保留** |
./specs/m13-make-decision-v1/plan.md:267:| Step 2.6 S4 + talk#2 + 渲染点① | FR-ACCEPT-01, FR-TALK-01, FR-LEDGER-01 | `s4_baseline_recorded: true`（非阻断）；original-context.md 在 S5 前落盘 |
./specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stderr:4:AssertionError: SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
./specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stderr:18:    273|       "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)…
./specs/m13-make-decision-v1/reviews/build-code-phase-1.md:72:### 记录态非阻断 (非阻断门原则)
./specs/m13-make-decision-v1/reviews/build-code-phase-1.md:74:env var 表明确说明：路径不可达时"自动降级跳过 debate（skipped），记录 `debate_path_unavailable: true`"，明确是记录而非阻断。`MAKE_DECISION_SKIP_BLIND_REVIEW`、`MAKE_DECISION_SKIP_DEBATE` 均走跳过+记录路径。无硬拦截逻辑。**通过。**
./specs/m13-make-decision-v1/reviews/build-code-phase-1.md:146:- env var 表设计完整，6 个变量均有安全默认值、降级路径说明和 override 示例，符合宪法"记录态非阻断"原则。
./specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:22: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
./specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:23: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
./specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:24: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
./specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:25: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
./specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:26: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
./specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
./specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
./specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:50:   → SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
./specs/m13-make-decision-v1/review/plan-review-r4.md:112:- S9 仍是唯一 hard gate；S4 为记录态非阻断；未发现新增 blocking gate。
specs/archive/m7-intake-v1/spec.md:244:- **隐性必达 4**：宪法保持 21 条、F10 在册，既有运行时非阻断提醒（protected-paths）不破坏。
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:3: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:22: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:41: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:60: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
./specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:79: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
./tasks/m13b-build-spec-deepening/artifacts/make-decision-blind-review-merged.md:38:1. **从「移植机制清单」转向「质量事实契约」**：codex 与 antigravity 独立给出同一建议——别搬 7 机制清单，先定义 build-spec 必须产出的质量事实（scope 边界 / 自检结果 / 异源审查摘要 / 未解风险 / handoff required_reads），机制可替换、反选最少。
./specs/m13-make-decision-v1/review/plan-review-r1.md:81:S4 被 plan/tasks 写成等待用户确认的 gate，违反上游 spec 和“唯一硬门 S9”规则。spec 明确要求 S4 是“记录模式，非阻断”，展示方向基线后直接推进到 S5，不等待显式确认；journal 事件应为 `s4_baseline_recorded: true`，不是 `s4_baseline_confirmed: true`。
./specs/m13-make-decision-v1/review/plan-review-r1.md:294:- S4 非阻断被 plan/tasks 改成确认 gate
./specs/m13-make-decision-v1/review/plan-review-r1.md:346:当前 plan/tasks 不是小修即可放行。必须先修正 12 步命名、lite/full 路由、S4 非阻断、S5/S6 分工、台账渲染时机、env var 清单、宪法检查和 cross-analysis 假绿问题。修完后应重新执行 build-plan 的 spec-plan/spec-tasks/spec-analyze 三步，确保三产物同步。
./tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:8:1. 目标=定义 build-spec 必须产出的「质量事实契约」（scope 边界/自检结果/异源审查摘要/未解风险/handoff required_reads），机制只做候选实现、反选最少。不照搬 agenthub 机制清单。
./tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:18:- **方向**：质量事实契约这个方向能否既保质量又不违宪？有无硬伤？
./specs/m13-make-decision-v1/review/plan-review-r6-prompt.md:13:核 R5 的 1 minor 是否真修好：cross-analyze B5 追溯说明已用新格式「反对 X：/决定 Y：/理由 Z：」且已解决列点名全链路(spec/plan/tasks/decision-log D6/T016)，全仓 artifacts 无旧斜杠格式 `反对X/决定Y/理由Z` 残留。同时整体扫一遍有无任何残留矛盾/假绿/新引入问题。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
./specs/m13b-build-spec-deepening/cross-artifact-analysis.md:28:| I-01 | LOW | spec.md FR 列表 vs plan.md Verification Mapping | spec.md 附录 C（决策落点覆盖）提及 FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 为"新增 FR"（5 项），但 spec.md 正文 §4 功能需求小节标题顺序与 plan.md Verification Mapping 中的 Step 排序存在轻微不一致——spec §4 按域分组（FR-BUILD → FR-CONTRACT → FR-LADDER → … → FR-COMM），plan 按实施阶段分组（Phase 1 = 基础节先行）。两者都正确，仅顺序视角不同。 | id:I-01, type:inconsistency, location:spec.md §4 vs plan.md Implementation Steps, description:FR 分组视角不同（按域 vs 按实施依赖），suggested_action:无需修改，两种分组均合理且互补 |
./specs/m13b-build-spec-deepening/cross-artifact-analysis.md:29:| I-02 | LOW | tasks.md Task ID 引用 vs plan.md FR Coverage Matrix | plan.md §Step 9 FR 覆盖矩阵列出任务编号 T001–T015，但 tasks.md 实际只有 T001–T014（14 条任务）。plan.md 矩阵中 T015 对应 FR-BEHAV-001/002, FR-FRICTION-001, FR-ARTIFACT-001，这些在 tasks.md 中合并到 T013 覆盖。 | id:I-02, type:inconsistency, location:plan.md §Step9 FR Coverage Matrix row T015 vs tasks.md, description:plan.md 矩阵引用 T015 但 tasks.md 无此编号（已并入 T013）, suggested_action:plan.md FR Coverage Matrix 中 T015 改为 T013 |
./specs/m13b-build-spec-deepening/cross-artifact-analysis.md:48:| G-01 | LOW | spec.md AC-20, AC-21 vs plan.md/tasks.md | spec.md 含 AC-20（Known Gaps 段可搜索）和 AC-21（行为验证场景格式覆盖）。plan.md Verification Mapping 未单独列出 AC-20/AC-21 的对应 Step（AC-20 隐含在 Step 1.2 / FR-STRUCTURE-002，AC-21 隐含在 Step 3.2 / FR-BEHAV-001/002）。 | id:G-01, type:coverage_gap, location:plan.md Verification Mapping, description:AC-20/AC-21 未显式在 Verification Mapping 中出现, suggested_action:可将 AC-20 加入 Step 1.2 行、AC-21 加入 Step 3.2 行；低优先级，功能覆盖已存在 |
./specs/m13-make-decision-v1/spec.md:14:  2. 新增三角度异源盲审（3rd-review 链，非阻断）
./specs/m13-make-decision-v1/spec.md:35:make-decision 是工作流第一阶段，决策质量直接决定后续所有阶段的价值。M13 继承 M7 已有 scope-triage 和 decision-log 不变，在其基础上增加五类护城河动作（D1–D5）并保证全程非阻断（D5）。
./specs/m13-make-decision-v1/spec.md:40:- 五类护城河动作均可独立触发和跳过（非阻断）
./specs/m13-make-decision-v1/spec.md:77:6. S4：talk-with-zhipeng 第 2 轮 + 方向基线确认（记录模式，非阻断对话检查点）+ 原始需求落盘
./specs/m13-make-decision-v1/spec.md:91:**验收标准**：lite 档时 S1 和 S3 对应 journal 事件分别记录 `skipped: scope=lite`；full 档时 S1 必须执行；S3 仅在 S2/talk#1 门控外部调研为"需要"时执行，否则记录 `skipped: s2_gate=no_external_research` （非阻断）。
./specs/m13-make-decision-v1/spec.md:108:- **失败行为**：若任一 sub-agent 失败，记录失败 agent ID 和原因到 `internal-research-summary.md` 中，继续执行其余 agents 的输出合并；若全部 agents 失败，记录 `s1_all_agents_failed: true`，继续推进到 S2（非阻断，告知用户内部调研失败原因）。
./specs/m13-make-decision-v1/spec.md:296:### FR-ACCEPT-01：方向基线确认（S4，记录模式，非阻断）
./specs/m13-make-decision-v1/spec.md:385:- **隐性必达 1**：所有护城河动作非阻断（跳过时 journal 有记录，不报错）
./specs/m13-make-decision-v1/spec.md:492:| FR-DEBATE-01/02: debate 条件门控 | >2 blocking 时缺乏升级机制 | 无 | 理论可绕（计数错），但非阻断低风险 | 低 | **保留** |
./tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:16:| 7 条自检清单 | 128-136 | 非阻断自检，便宜。含 Spec-Purity grep（纯事实粗筛）。 |
./tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
./specs/m13-make-decision-v1/review/plan-review-prompt.md:17:6. 是否违反项目硬规则：薄核心窄契约、记录态非阻断（D5）、唯一硬门 S9、不自审自判。
./specs/m13-make-decision-v1/review/plan-review-r3-prompt.md:13:逐条核 R2 的 12 findings 是否真修好（宪法21条对真实清单/S8含CONTEXT同步/FR-REVIEW-03三行留痕/盲审fallback失败语义/双路均空即停/grill artifact/metrics十core fields/cross-analyze五字段无假绿/FR-SCOPE-01/decision-log D1+开放问题/baseline注脚）。同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
./tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:23:| 4 | 7 条自检清单（全过才能触发审查） | 清单**合宪**；"才能触发"阻断味**违 Q1** | 保留自检，非阻断 |
./specs/m13-make-decision-v1/review/plan-review-r5-prompt.md:17:同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
./tasks/m13b-build-spec-deepening/artifacts/s5-prompt-scope.md:8:1. 移植 7 个质保机制进 build-spec SKILL.md（异源审查、journal/evidence、spec-purity 扫描、7 自检、退出门、推进门、摩擦即记，全部合宪改造为非阻断）。
./tasks/m12-build-plan-v1/plan-tasks-review-package.md:81:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./tasks/m12-build-plan-v1/plan-tasks-review-package.md:104:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/m13-make-decision-v1/review/plan-review-r2.md:27:| 3 | fixed | S4 已改为 `s4_baseline_recorded: true`，非阻断，不再写 confirmed。 |
./specs/m13-make-decision-v1/review/plan-review-r2.md:58:- 真实 F8 是“简单优先”，plan F8 写成“记录事实而非阻断”。
./specs/m13-make-decision-v1/constitution-check.md:10:- [x] **F3 物理事实靠机器校验但不阻断** — metrics 写失败 warn 不 throw（FR-METRIC-01）；muyu get_sources 失败**立即停下报告用户等待指令**（FR-RESEARCH-01，非自动降级，已在 spec OPEN-1 解决）；两路均空记录 dual_research_empty 不阻断（FR-RESEARCH-03）。注：muyu 失败属"物理来源核实失败需人决策"，停下等人是 let-it-crash 原则，不违反非阻断原则（非阻断指不因质量判断阻断，不指掩盖数据缺失）。
./specs/m13-make-decision-v1/constitution-check.md:11:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 三角度盲审走 3rd-review 异源链（FR-REVIEW-01），各 reviewer 独立，审查结果非阻断；debate 有条件触发非默认阻断；S9 是唯一人确认点。
./specs/m13-make-decision-v1/constitution-check.md:14:- [x] **F7 推进与不可逆操作不自动越过人** — S9 方向确认硬门控须用户明确回复"同意"才可落盘（FR-ACCEPT-02，唯一强制 gate）；S4 方向基线为记录模式非阻断检查点（FR-ACCEPT-01，已修正）；任何护城河跳过均有 journal 记录。
./specs/m13-make-decision-v1/constitution-check.md:21:- [x] **Q1 记事实而非阻断** — 台账驳回理由、blocking 留痕（FR-REVIEW-03）、muyu 失败标记均为记录性产物；所有护城河跳过时 journal 记录 skipped 而非报错阻断（隐性必达 1）。
./specs/m13-make-decision-v1/review/plan-review-r4-prompt.md:18:同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
./specs/m13-make-decision-v1/review/plan-review-r6.md:55:### 记录态非阻断 / 唯一硬门 S9
./specs/m13-make-decision-v1/tasks.md:108:### T010：实现 S4 方向设计 + talk#2 + 台账渲染点①（非阻断记录态）
./specs/m13-make-decision-v1/tasks.md:109:- **FR 映射**：FR-ACCEPT-01（S4 方向基线，非阻断），FR-TALK-01（talk#2），FR-LEDGER-01（渲染点①：original-context.md 在 S4 后 S5 前落盘）
./specs/m13-make-decision-v1/tasks.md:114:- **完成条件**：向用户展示方向摘要，问 Q2 收敛方向；用户回答后记 `s4_baseline_recorded: true`（非阻断，不等确认直接继续）；渲染点①写入 `make-decision-original-context.md`（原始需求逐条初始状态）；S5 依赖此文件存在，T011 depends T010
./specs/m13-make-decision-v1/review/plan-review-r2-prompt.md:13:逐条核 R1 的 15 findings 是否真修好（尤其：12步统一含S0背景扎根+S0.5、lite只跳S1+S3不跳talk/盲审/grill、S4非阻断s4_baseline_recorded、S5盲审+debate门控/S6展示、台账原始需求落盘在S4后S5前、6个env var正确、宪法21条对齐真实清单无幻引、talk三轮S2/S4/S7、双路extra_sources>=3+get_sources停下、盲审5字段+FR-REVIEW-03、grill纯委托、T-final每task有FR回指、cross-analyze去假绿、metrics recordSkeleton+updateOwnResult、baseline 4列）。
./specs/m13-make-decision-v1/review/plan-review-r2-prompt.md:15:同时查有无新引入的矛盾/假绿/遗漏。硬规则：薄核心窄契约、记录态非阻断(D5)、唯一硬门S9、不自审自判、不假绿不占位。
./specs/m13-make-decision-v1/review/spec-review-r2.md:32:ID: F-02 | STATUS: PARTIALLY_CLOSED | EVIDENCE: spec.md 的 FR-ACCEPT-01 已改成"记录模式，非阻断"，并要求 S4 后直接进入 S5。问题是权威 decision-log.md 的 D6 仍写着"S4 后 S5 前，未确认挡住流程但非机器gate"，这仍和"S9 唯一 hard gate"冲突。
./specs/m13-make-decision-v1/review/spec-review-r2.md:82:| F-02 | blocking | PARTIALLY_CLOSED | spec 改为非阻断，但 decision-log.md D6 仍写"S4 未确认挡住流程"，权威文档矛盾未解 |
./specs/archive/m9-verify-code/plan.md:40:| Q1 记事实而非阻断 | YES | anomaly_flags 浮现警告不 FAIL；metrics 写失败只 warn 不 throw |
./tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:13:- 收敛 major：从「移植机制清单」转向「定义 build-spec 必须产出的质量事实契约（scope边界/自检/异源审查摘要/未解风险/handoff required_reads），机制可替换反选最少」。
./tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:19:- **维持**（甲方方向成立，乙方意见降级为非阻断备注）
./specs/m13-make-decision-v1/evidence/phase-2-notes.md:33:- **S1 非阻断**：全部 sub-agents 失败时记录 `s1_all_agents_failed: true` 并继续到 S2，不抛错不阻断。
specs/archive/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/archive/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/archive/m12-build-plan-v1/constitution-check.md:16:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — cross-artifact-analyze 作为独立第三方技能扫描三产物（FR-XARTIFACT-001），加一次人审检查点（FR-REVIEW-001），决策 D-M12-5 明确引用"承接 F4 异源审查不卡死"，未设阻断式质量门。
specs/archive/m12-build-plan-v1/constitution-check.md:26:- [x] **Q1 记事实而非阻断** — 宪法检查结果"仅记录浮现供人审查，不因不达标阻断"（FR-CONSTITUTION-002），analyze 报告"仅记录不阻断"（FR-XARTIFACT-002），基线对照"不达标不阻断推进"（FR-BASELINE-002），与 F3/F4 一致。
specs/archive/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/archive/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/archive/m6-five-stage-skeleton/spec.md:38:agenthub 的 vibecoding workflow 有成熟的五段提示词（intake/design/plan/apply/test-acceptance），但与运行时 gate 深度耦合。workflowhub 已立宪法 F4（质量靠异源审查+人，非阻断质量门）和 F10（自动化按真实收益，不为"机器可校验"本身堆基建），并已删除 check-path-guard CI 护栏、把 findViolation 解耦进 core/protected-paths.mjs 作运行时非阻断提醒（commit 7453d4b，已在 main）。M3 已定窄契约 stage-result，M4 已有指标系统与 check-stage-quality.mjs 扫描器。本期在这些基础上建五段骨架。
specs/archive/m6-five-stage-skeleton/spec.md:256:- **隐性必达 4**：宪法保持 21 条、F10 在册、check-path-guard 已删且 core/protected-paths.mjs 运行时非阻断提醒在位（既有状态，本期不得破坏）。
specs/archive/m6-five-stage-skeleton/spec.md:276:- [ ] **AC12**：宪法 F10 在册（21 条），check-path-guard 已删且运行时非阻断提醒保留。← 隐性必达 4
specs/archive/m6-five-stage-skeleton/spec.md:289:- **不受影响**：agenthub 全部现有功能（本期零改动）；workflowhub 宪法（保持 21 条不变）；既有运行时非阻断提醒（protected-paths）。
specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:102:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:111:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:125:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:143:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
./specs/archive/m7-intake-v1/spec.md:244:- **隐性必达 4**：宪法保持 21 条、F10 在册，既有运行时非阻断提醒（protected-paths）不破坏。
specs/archive/m8-build-code/plan.md:41:| Q1 记事实而非阻断 | YES | 假绿浮现、越界浮现，均不 block 推进 |
specs/archive/m6-five-stage-skeleton/plan.md:11:- 已有基建：CONSTITUTION.md（21 条，含 F4/F10）、contracts/stage-result.contract.json（facts 开放 object）、config/workflowhub.yaml（registry + metrics_path）、scripts/check-stage-quality.mjs（指标质量扫描器，344 行）、core/protected-paths.mjs（运行时非阻断提醒）。
specs/archive/m6-five-stage-skeleton/plan.md:20:- F4 质量靠异源审查+人非阻断门：YES — 不引运行时质量 gate，质量靠 plan/design-review + 人。
./tasks/m13-make-decision-v1/review/codex-review-prompt.md:19:2. 方向盲审（blind review）——复用 3rd-review skill，异源，非阻断
./tasks/m13-make-decision-v1/review/codex-review-prompt.md:23:全部非阻断（D5），唯一 hard gate 是 S9 用户明确批准。"
./tasks/m13-make-decision-v1/review/codex-review-prompt.md:83:理由: workflowhub 无既有业务 env 惯例，所有 env 透传外部 skill 已有约定，不引入新惯例；可选+安全默认保证 D5 非阻断
./tasks/m13-make-decision-v1/review/codex-review-prompt.md:86:来源证据: tasks/m13-make-decision-v1/research/env-var-design.md §env-var清单全节 + §设计原则；D5 CONSTITUTION 非阻断原则
./tasks/m13-make-decision-v1/review/codex-review-prompt.md:93:理由: 宪法 D5 记录事实而非阻断；quality 靠独立审查和人确认，不靠自动机器 gate；台账无静默踢出防止需求被悄悄丢弃
./tasks/m13-make-decision-v1/review/codex-review-prompt.md:96:来源证据: make-decision-flow-aligned.md §横切质量机制表；原始 intake.md 各条；CONSTITUTION.md D5 非阻断原则
./tasks/m13-make-decision-v1/review/codex-review-prompt.md:174:2. 方向盲审（blind review）via 3rd-review, 异源, 非阻断
./specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:102:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:111:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:125:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:143:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
./tasks/m13-make-decision-v1/stage-result-make-decision.json:6:    "decision": "M13 深化 make-decision 为 12 步流程（S0、S0.5、S1-S10）：背景扎根→scope-triage→内部调研→talk#1门控外部→条件性双路调研(muyu-search-mcp+anysearch,返空即停)→talk#2收敛+方向基线确认→三角度异源盲审(3rd-review)+第一次debate调用点→给用户看→talk#3→grill→草稿→orchestrator审查+第二次debate调用点→同步CONTEXT/ADR→S9用户批准→落盘。全部非阻断(D5)，debate触发判断和五方法庭/单人三档模式委托 /Users/Hugh/Hugh/Project/debate 技能 Step 1，make-decision 只做skip/path/call/read verdict薄编排，唯一hard gate=S9。",
specs/archive/m5-quality-mechanism/plan.md:33:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**：CI 扫描守零，非自动阻断，符合。
specs/archive/m5-quality-mechanism/plan.md:39:- [x] **Q1 记事实而非阻断**：FR-FACT-003 / FR-GATE-002 明确只记不挡，符合。
./specs/archive/m5-quality-mechanism/plan.md:33:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**：CI 扫描守零，非自动阻断，符合。
./specs/archive/m5-quality-mechanism/plan.md:39:- [x] **Q1 记事实而非阻断**：FR-FACT-003 / FR-GATE-002 明确只记不挡，符合。
./tasks/m13-make-decision-v1/decision-log.md:16:> 2. 方向盲审（blind review）——复用 3rd-review skill，异源，非阻断
./tasks/m13-make-decision-v1/decision-log.md:20:> 全部非阻断（D5），唯一 hard gate 是 S9 用户明确批准。"
./tasks/m13-make-decision-v1/decision-log.md:106:| 理由 | workflowhub 无既有业务 env 惯例，所有 env 透传外部 skill 已有约定，不引入新惯例；可选+安全默认保证 D5 非阻断 |
./tasks/m13-make-decision-v1/decision-log.md:109:| 来源证据 | `tasks/m13-make-decision-v1/research/env-var-design.md` §env-var清单全节 + §设计原则；D5 CONSTITUTION 非阻断原则 |
./tasks/m13-make-decision-v1/decision-log.md:121:| 理由 | 宪法 D5 "记录事实而非阻断"；quality 靠独立审查和人确认，不靠自动机器 gate；台账无静默踢出防止需求被悄悄丢弃 |
./tasks/m13-make-decision-v1/decision-log.md:124:| 来源证据 | `tasks/m13-make-decision-v1/research/make-decision-flow-aligned.md` §横切质量机制表；原始 intake.md D28台账/方向基线确认衔接点/三角度输入隔离/防漏阀留痕/新想法回退判定D15/双路返空即停/交互简洁各条；CONSTITUTION.md D5 非阻断原则 |
specs/archive/m11-build-spec-v1/plan.md:43:| Q1 记事实而非阻断 | YES | 宪法检查不达标仅浮现不阻断；baseline 对照阈值人拍、不达标不阻断；metrics 写失败只 warn |
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:110:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:119:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:133:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:151:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:301:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:310:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:324:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:342:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:571:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:580:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:594:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:612:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:110:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:119:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:133:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:151:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:301:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:310:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:324:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:342:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:571:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:580:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:594:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:612:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/phase-3.diff:60:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/phase-3.diff:69:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/phase-3.diff:83:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/phase-3.diff:101:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
./specs/m13-make-decision-v1/stage-result-build-spec.json:7:    "spec_summary": "M13 make-decision 深化 spec：FR 覆盖 12 步流程（S0、S0.5、S1-S10）+ FR-RESEARCH-00/01/02/03 双路调研 + FR-REVIEW-01/02 三角度异源盲审 + FR-DEBATE 双调用点委托 debate 技能自判 + FR-TALK-01/02 + FR-GRILL-01 + FR-LEDGER 台账D28 + FR-ENV-01 六环境变量 + FR-METRIC + FR-DRAFT-01 + FR-ACCEPT-01/02/03 验收。全程记录态非阻断，唯一硬门 S9。",
./specs/archive/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
./specs/archive/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
./tasks/m13-make-decision-v1/research/env-var-design.md:16:- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`：启用五方法庭对抗模式。**不设置时自动降级为单人三档模式**，非阻断。
./tasks/m13-make-decision-v1/research/env-var-design.md:56:| `MAKE_DECISION_SKIP_BLIND_REVIEW` | 设为 `1` 跳过盲审（非阻断标志，调试 / 离线环境用） | 未设置（正常执行） | blind-review action | 否 |
./specs/archive/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
./specs/archive/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:103:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:112:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:126:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:144:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/archive/m11-build-spec-v1/constitution-check.md:18:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。build-spec v1 流程含一次人审检查点（§7 HUMAN_REVIEW_CHECKPOINT），要求人在宪法检查/baseline 对照/F10 gate 完成后确认，不自动推进。宪法符合性检查本身是"记录采集"而非阻断门。spec-specify 的质量检查清单（checklists/requirements.md）是自检工具但不阻断。未引入阻断式 CI gate 或 pre-commit hook。
specs/archive/m11-build-spec-v1/constitution-check.md:34:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。宪法检查结果只记录浮现（`[ ]` 附判据视为有效输出，不阻断 stage-result 成功）。baseline 对照结果只记录浮现（不达标不阻断推进）。metrics 写失败只 warn 不 throw（"metrics write failure must not undo a successful stage completion"）。FR-CONSTITUTION-002 明确"checklist 不达标而阻断 build-spec 后续推进"为禁止行为。
./specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:103:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:112:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:126:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:144:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/archive/m11-build-spec-v1/constitution-check.md:18:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。build-spec v1 流程含一次人审检查点（§7 HUMAN_REVIEW_CHECKPOINT），要求人在宪法检查/baseline 对照/F10 gate 完成后确认，不自动推进。宪法符合性检查本身是"记录采集"而非阻断门。spec-specify 的质量检查清单（checklists/requirements.md）是自检工具但不阻断。未引入阻断式 CI gate 或 pre-commit hook。
./specs/archive/m11-build-spec-v1/constitution-check.md:34:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。宪法检查结果只记录浮现（`[ ]` 附判据视为有效输出，不阻断 stage-result 成功）。baseline 对照结果只记录浮现（不达标不阻断推进）。metrics 写失败只 warn 不 throw（"metrics write failure must not undo a successful stage completion"）。FR-CONSTITUTION-002 明确"checklist 不达标而阻断 build-spec 后续推进"为禁止行为。
./specs/archive/m8-build-code/plan.md:41:| Q1 记事实而非阻断 | YES | 假绿浮现、越界浮现，均不 block 推进 |
specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:62:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:71:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:85:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:103:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:111:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:120:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:134:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:152:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:319:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:328:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:342:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:360:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:578:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:587:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:601:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:619:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:962:    48	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:971:    57	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:985:    71	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1003:    89	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1142:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1151:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1165:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1183:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1260:    12	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。→ [CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门](CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门)
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1270:    22	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。→ [CONSTITUTION.md#q1-记事实而非阻断](CONSTITUTION.md#q1-记事实而非阻断)
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1436:./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:125:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1462:./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:126:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1562:./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:85:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1627:./specs/m11-build-spec-v1/reviews/phase-3.diff:83:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1971:./workflows/build-spec/SKILL.md:71:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:2147:./specs/archive/m6-five-stage-skeleton/plan.md:11:- 已有基建：CONSTITUTION.md（21 条，含 F4/F10）、contracts/stage-result.contract.json（facts 开放 object）、config/workflowhub.yaml（registry + metrics_path）、scripts/check-stage-quality.mjs（指标质量扫描器，344 行）、core/protected-paths.mjs（运行时非阻断提醒）。
specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:2179:./specs/archive/m6-five-stage-skeleton/spec.md:38:agenthub 的 vibecoding workflow 有成熟的五段提示词（intake/design/plan/apply/test-acceptance），但与运行时 gate 深度耦合。workflowhub 已立宪法 F4（质量靠异源审查+人，非阻断质量门）和 F10（自动化按真实收益，不为"机器可校验"本身堆基建），并已删除 check-path-guard CI 护栏、把 findViolation 解耦进 core/protected-paths.mjs 作运行时非阻断提醒（commit 7453d4b，已在 main）。M3 已定窄契约 stage-result，M4 已有指标系统与 check-stage-quality.mjs 扫描器。本期在这些基础上建五段骨架。
./specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:62:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:71:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:85:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:103:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/phase-3.diff:60:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/phase-3.diff:69:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/phase-3.diff:83:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/phase-3.diff:101:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:111:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:120:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:134:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:152:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:319:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:328:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:342:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:360:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:578:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:587:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:601:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:619:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:962:    48	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:971:    57	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:985:    71	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1003:    89	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1142:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1151:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1165:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1183:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1260:    12	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。→ [CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门](CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门)
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1270:    22	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。→ [CONSTITUTION.md#q1-记事实而非阻断](CONSTITUTION.md#q1-记事实而非阻断)
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1436:./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:125:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1462:./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:126:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1562:./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:85:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1627:./specs/m11-build-spec-v1/reviews/phase-3.diff:83:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1971:./workflows/build-spec/SKILL.md:71:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:2147:./specs/archive/m6-five-stage-skeleton/plan.md:11:- 已有基建：CONSTITUTION.md（21 条，含 F4/F10）、contracts/stage-result.contract.json（facts 开放 object）、config/workflowhub.yaml（registry + metrics_path）、scripts/check-stage-quality.mjs（指标质量扫描器，344 行）、core/protected-paths.mjs（运行时非阻断提醒）。
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:2179:./specs/archive/m6-five-stage-skeleton/spec.md:38:agenthub 的 vibecoding workflow 有成熟的五段提示词（intake/design/plan/apply/test-acceptance），但与运行时 gate 深度耦合。workflowhub 已立宪法 F4（质量靠异源审查+人，非阻断质量门）和 F10（自动化按真实收益，不为"机器可校验"本身堆基建），并已删除 check-path-guard CI 护栏、把 findViolation 解耦进 core/protected-paths.mjs 作运行时非阻断提醒（commit 7453d4b，已在 main）。M3 已定窄契约 stage-result，M4 已有指标系统与 check-stage-quality.mjs 扫描器。本期在这些基础上建五段骨架。
./specs/archive/m6-five-stage-skeleton/spec.md:38:agenthub 的 vibecoding workflow 有成熟的五段提示词（intake/design/plan/apply/test-acceptance），但与运行时 gate 深度耦合。workflowhub 已立宪法 F4（质量靠异源审查+人，非阻断质量门）和 F10（自动化按真实收益，不为"机器可校验"本身堆基建），并已删除 check-path-guard CI 护栏、把 findViolation 解耦进 core/protected-paths.mjs 作运行时非阻断提醒（commit 7453d4b，已在 main）。M3 已定窄契约 stage-result，M4 已有指标系统与 check-stage-quality.mjs 扫描器。本期在这些基础上建五段骨架。
./specs/archive/m6-five-stage-skeleton/spec.md:256:- **隐性必达 4**：宪法保持 21 条、F10 在册、check-path-guard 已删且 core/protected-paths.mjs 运行时非阻断提醒在位（既有状态，本期不得破坏）。
./specs/archive/m6-five-stage-skeleton/spec.md:276:- [ ] **AC12**：宪法 F10 在册（21 条），check-path-guard 已删且运行时非阻断提醒保留。← 隐性必达 4
./specs/archive/m6-five-stage-skeleton/spec.md:289:- **不受影响**：agenthub 全部现有功能（本期零改动）；workflowhub 宪法（保持 21 条不变）；既有运行时非阻断提醒（protected-paths）。
./specs/archive/m6-five-stage-skeleton/plan.md:11:- 已有基建：CONSTITUTION.md（21 条，含 F4/F10）、contracts/stage-result.contract.json（facts 开放 object）、config/workflowhub.yaml（registry + metrics_path）、scripts/check-stage-quality.mjs（指标质量扫描器，344 行）、core/protected-paths.mjs（运行时非阻断提醒）。
./specs/archive/m6-five-stage-skeleton/plan.md:20:- F4 质量靠异源审查+人非阻断门：YES — 不引运行时质量 gate，质量靠 plan/design-review + 人。
./specs/archive/m11-build-spec-v1/plan.md:43:| Q1 记事实而非阻断 | YES | 宪法检查不达标仅浮现不阻断；baseline 对照阈值人拍、不达标不阻断；metrics 写失败只 warn |
./specs/archive/m12-build-plan-v1/constitution-check.md:16:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — cross-artifact-analyze 作为独立第三方技能扫描三产物（FR-XARTIFACT-001），加一次人审检查点（FR-REVIEW-001），决策 D-M12-5 明确引用"承接 F4 异源审查不卡死"，未设阻断式质量门。
./specs/archive/m12-build-plan-v1/constitution-check.md:26:- [x] **Q1 记事实而非阻断** — 宪法检查结果"仅记录浮现供人审查，不因不达标阻断"（FR-CONSTITUTION-002），analyze 报告"仅记录不阻断"（FR-XARTIFACT-002），基线对照"不达标不阻断推进"（FR-BASELINE-002），与 F3/F4 一致。

exec
/bin/bash -lc 'git status --short' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
 M CLAUDE.md
 M tests/five-skills-present.test.mjs
 M workflows/build-code/SKILL.md
 M workflows/build-spec/SKILL.md
?? .agent_context/
?? .agents/
?? .claude/
?? .investigation/
?? .multica/
?? .specify/
?? global
?? "global flat metrics store (M4, FR-COLLECT-006/"
?? specs/m12-build-plan-v1/
?? specs/m13-make-decision-v1/reviews/codex-final/
?? specs/m13-make-decision-v1/reviews/codex-r2/
?? specs/m13-make-decision-v1/reviews/codex-r3-real/
?? specs/m13-make-decision-v1/reviews/codex-r3/
?? specs/m13-make-decision-v1/reviews/codex/
?? specs/m13b-build-spec-deepening/
?? task-metrics.jsonl
?? tasks/agenthub-extraction-program/
?? tasks/m11-build-spec-v1/
?? tasks/m12-build-plan-v1/
?? tasks/m13b-build-spec-deepening/
?? tasks/multica-cost-review/
?? tests/m13b-build-spec-deepening.test.mjs

codex
全仓搜索噪音很多。我缩到 `m13b-build-spec-deepening` 相关文件，直接看 FR 条款和质量事实契约。
exec
/bin/bash -lc 'rg -n "FR-ARTIFACT-001|FR-BEHAV-001|FR-BEHAV-002|质量事实契约|违规时记录为 warn|不自动停止 stage|非阻断" specs/m13b-build-spec-deepening tasks/m13b-build-spec-deepening tests/m13b-build-spec-deepening.test.mjs workflows/build-spec/SKILL.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
tests/m13b-build-spec-deepening.test.mjs:104:describe("Phase 2 / AC-01: 质量事实契约 5 items", () => {
tests/m13b-build-spec-deepening.test.mjs:105:  test("SKILL.md declares 质量事实契约 section", () => {
tests/m13b-build-spec-deepening.test.mjs:106:    assert.ok(skill().includes("质量事实契约"),
tests/m13b-build-spec-deepening.test.mjs:107:      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
tests/m13b-build-spec-deepening.test.mjs:273:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
workflows/build-spec/SKILL.md:42:- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
workflows/build-spec/SKILL.md:126:- 记录进质量事实契约第 4 项（未解风险）
workflows/build-spec/SKILL.md:133:spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
workflows/build-spec/SKILL.md:151:- 结论记入质量事实契约第 3 项（独立审查摘要路径）
workflows/build-spec/SKILL.md:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
workflows/build-spec/SKILL.md:160:完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
workflows/build-spec/SKILL.md:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
workflows/build-spec/SKILL.md:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
workflows/build-spec/SKILL.md:196:长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
workflows/build-spec/SKILL.md:198:#### FR 场景行为验证（FR-BEHAV-001/002）
workflows/build-spec/SKILL.md:200:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
workflows/build-spec/SKILL.md:201:- **FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为；meta 场景（描述 build-spec 机制本身的）豁免此要求
workflows/build-spec/SKILL.md:203:以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
workflows/build-spec/SKILL.md:217:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
workflows/build-spec/SKILL.md:226:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
workflows/build-spec/SKILL.md:240:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
workflows/build-spec/SKILL.md:258:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
tasks/m13b-build-spec-deepening/scope-decision.md:40:### D-M13b-3：spec-reviewer 触发条件 = 可选、非阻断
tasks/m13b-build-spec-deepening/scope-decision.md:61:| spec-reviewer（M0 ref） | 新建 | 独立子代理，非阻断 |
tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:89:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:212:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:284:- 质量事实契约 5 项齐全：[workflows/build-spec/SKILL.md:158](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:158) 到 [workflows/build-spec/SKILL.md:168](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 包含 scope 边界、自检结果、独立审查摘要、未解风险、handoff required_reads，并声明记录+浮现语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:399:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:783:+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:855:+- 记录进质量事实契约第 4 项（未解风险）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:862:+spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:868:+5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:880:+- 结论记入质量事实契约第 3 项（独立审查摘要路径）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:887:+### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:889:+完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:911:+### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:921:+条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:923:+#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:927:+#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:929:+- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:930:+- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:986:    42	- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1070:   126	- 记录进质量事实契约第 4 项（未解风险）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1077:   133	spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1083:   139	5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1095:   151	- 结论记入质量事实契约第 3 项（独立审查摘要路径）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1102:   158	### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1104:   160	完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1126:   182	### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1136:   192	条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1138:   194	#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1142:   198	#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1144:   200	- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1145:   201	- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1159:   215	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1168:   224	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1427:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1428:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1430:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1433:tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1436:tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1439:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1452:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1456:workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1458:workflows/build-spec/SKILL.md:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1459:workflows/build-spec/SKILL.md:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1461:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1462:workflows/build-spec/SKILL.md:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1465:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1469:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1470:specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1472:specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1475:specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1477:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1479:specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1483:specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1484:specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1485:specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1486:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1489:specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1491:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1492:specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1494:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1497:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1499:specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1500:specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1504:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1508:specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1509:specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1511:specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1513:specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1521:specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1524:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1527:specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1529:specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1533:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1536:specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1538:specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1543:specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1545:specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1560:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:48: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1561:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1569:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:14: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1575:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1585:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:383: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1586:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1588:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1602:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:19: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1611:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1633:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1634:specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1639:specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1640:specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1641:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1669:   238	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1687:   256	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1825:tests/m13b-build-spec-deepening.test.mjs:107:      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1832:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1833:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1858:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1860:tests/m13b-build-spec-deepening.test.mjs:273:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1880:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1884:workflows/build-spec/SKILL.md:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1889:workflows/build-spec/SKILL.md:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1891:workflows/build-spec/SKILL.md:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1892:workflows/build-spec/SKILL.md:198:#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1893:workflows/build-spec/SKILL.md:200:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1894:workflows/build-spec/SKILL.md:201:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1897:specs/m13b-build-spec-deepening/spec.md:160:### 质量事实契约（FR-CONTRACT）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1898:specs/m13b-build-spec-deepening/spec.md:162:**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1899:specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1907:specs/m13b-build-spec-deepening/spec.md:208:**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1910:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1913:specs/m13b-build-spec-deepening/spec.md:237:**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1915:specs/m13b-build-spec-deepening/spec.md:241:**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1916:specs/m13b-build-spec-deepening/spec.md:244:- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1918:specs/m13b-build-spec-deepening/spec.md:248:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1929:specs/m13b-build-spec-deepening/spec.md:295:**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1934:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1936:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1940:specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1943:specs/m13b-build-spec-deepening/spec.md:411:- [RISK] FR-REVIEW-001 异源 3rd-review：依赖现有 3rd-review 基础设施可用（journal/collector/runner）；若基础设施不可用，审查步骤需降级处理并记录在质量事实契约第 3 项。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1945:specs/m13b-build-spec-deepening/spec.md:439:| D1 | 目标重定义：build-spec 产出「质量事实契约」5 项（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），机制反选最少 | FR-CONTRACT-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1946:specs/m13b-build-spec-deepening/spec.md:440:| D2 | 保留薄质量本体：spec 构建本体（spec-specify/spec-clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps | **FR-BUILD-001**, FR-LADDER-001/002, FR-STRUCTURE-001/002, FR-SELFCHECK-001/002, FR-REVIEW-001/002, FR-BEHAV-001/002, FR-FRICTION-001, FR-TASKDIR-001, FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1947:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2059:describe("Phase 2 / AC-01: 质量事实契约 5 items", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2060:  test("SKILL.md declares 质量事实契约 section", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2061:    assert.ok(skill().includes("质量事实契约"),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2062:      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2090:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2091:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2167:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2187:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2201:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2216:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2228:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2327:specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2389:FR-ARTIFACT-001
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2390:FR-BEHAV-001
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2391:FR-BEHAV-002
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2895:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2899:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2904:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2906:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2907:198:#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2908:200:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2909:201:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2936:340:- [ ] **AC-01**：`workflows/build-spec/SKILL.md` 含质量事实契约 5 项定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），可 grep 到 5 项标题。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2946:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2947:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2989:- 质量事实契约 5 项齐全：[workflows/build-spec/SKILL.md:158](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:158) 到 [workflows/build-spec/SKILL.md:168](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 包含 scope 边界、自检结果、独立审查摘要、未解风险、handoff required_reads，并声明记录+浮现语义。
tasks/m13b-build-spec-deepening/decision-log.md:13:把 agenthub design 阶段的质量保障体系移植进 workflowhub `workflows/build-spec/SKILL.md`。后续用户三轮纠正：接受方向修正为质量事实契约；agenthub design 不全保留，逐块评估留/删/改；审查机制砍三 source_family 硬要求改省钱版；5 框架外部调研暂不做；TASK_TRACKING_ROOT 放本任务做（一直没做导致没正确留存任务执行记录）；交互要大白话+给选项、勤报进度。
tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
tasks/m13b-build-spec-deepening/decision-log.md:22:- **D1（目标重定义）**：build-spec 必须产出「质量事实契约」=｛scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads｝。机制只做候选实现、反选最少，不照搬 agenthub 机制清单。
tasks/m13b-build-spec-deepening/decision-log.md:28:- **D4（审查恢复修正）**【修正 2026-06-30，Hugh 授权】：原降级基于错误前提——将「异源独立审查」误当成「3 个不同 source_family 各审一角度」的高成本机制。事实是 agenthub design 原审查 = 单一异源引擎（如 codex）的 3rd-review 独立审查，workflowhub 现有 3rd-review 基础设施可直接复用，成本仅一次异源调用。**恢复为 B=真·异源独立审查：复用现有 3rd-review（单一异源引擎），产出 verdict+findings，记入质量事实契约第 3 项，非阻断（记录+浮现+人判断）。不做 3 source_family 多重审查（过度工程，Hugh 从未要求）。单一异源满足宪法独立裁决最小要求。**
tasks/m13b-build-spec-deepening/decision-log.md:57:- build-spec SKILL.md 含「质量事实契约」5 项产出定义（scope 边界/自检/独立审查摘要/未解风险/handoff required_reads），可逐项核对。
tasks/m13b-build-spec-deepening/decision-log.md:60:- 审查机制为真·异源独立审查（复用现有 3rd-review，单一异源引擎），结论记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:86:# 功能规格：build-spec 质量事实契约深化（M13b）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:99:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:103:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:119:7. 质量事实契约（无结构化 5 项质量事实产出）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:133:以最小改动让 build-spec 产出 5 项质量事实契约，覆盖 spec 构建本体 + 自检 + 独立审查 + 已知风险 + handoff 交接。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:139:- 质量事实契约 5 项定义 + 最小实现机制
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:142:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:143:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:150:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:175:### 场景 3.1：编排者走完整 build-spec 流程（正常路径，含质量事实契约）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:177:- **操作步骤**：编排者传入 task-id + decision-log 路径，调起 build-spec；执行代理读 decision-log，产出 spec 初稿，运行 spec-ladder 判断档位，执行 7 条自检 + Spec-Purity grep，运行异源 3rd-review 独立审查，生成 5 项质量事实契约，写入 spec.md + checklists/requirements.md + spec-acceptance-count.json。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:178:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:183:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:188:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:203:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:208:- **预期结果**：warn 到 onWarn 回调，不 throw，stage 继续，质量事实契约正常产出。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:234:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:236:### 质量事实契约（FR-CONTRACT）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:238:**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:246:- **场景**：Given build-spec 完成一次运行，When 检查 spec.md，Then 质量事实契约 5 项字段均存在，任一字段缺失即自检报 warn。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:249:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:251:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:274:- **层 3 附录**：质量事实契约、Known Gaps、兼容性预留、设计决策记录
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:284:**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:294:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:303:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:305:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:313:**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:317:**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:320:- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:324:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:344:specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:348:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:375:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:388:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:390:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:398:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:400:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:457:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:459:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:460:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:462:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:464:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:491:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:493:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:509:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:515:specs/m13b-build-spec-deepening/constitution-check.md:30:  spec 设计中所有质量事实契约项均"浮现供人判断"（场景 3.2/3.3/3.6 均以"人工可见"或"浮现给人判断"为预期结果），独立三角度审查偏差不自动推进处理，符合"不可逆操作须经人在边界确认"的 F7 原则；spec 未定义任何自动越过人的推进逻辑。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:516:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:526:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:541:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:581:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:585:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:589:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:591:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:592:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:593:198:#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:598:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:600:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:602:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:604:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:660:- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:744:- 记录进质量事实契约第 4 项（未解风险）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:751:spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:757:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:769:- 结论记入质量事实契约第 3 项（独立审查摘要路径）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:776:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:778:完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:800:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:810:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:812:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:816:#### FR 场景行为验证（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:818:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:819:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:833:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:842:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:856:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:874:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:953:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:965:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/spec.md:10:# 功能规格：build-spec 质量事实契约深化（M13b）
specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/spec.md:43:7. 质量事实契约（无结构化 5 项质量事实产出）
specs/m13b-build-spec-deepening/spec.md:57:以最小改动让 build-spec 产出 5 项质量事实契约，覆盖 spec 构建本体 + 自检 + 独立审查 + 已知风险 + handoff 交接。
specs/m13b-build-spec-deepening/spec.md:63:- 质量事实契约 5 项定义 + 最小实现机制
specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/spec.md:99:### 场景 3.1：编排者走完整 build-spec 流程（正常路径，含质量事实契约）
specs/m13b-build-spec-deepening/spec.md:101:- **操作步骤**：编排者传入 task-id + decision-log 路径，调起 build-spec；执行代理读 decision-log，产出 spec 初稿，运行 spec-ladder 判断档位，执行 7 条自检 + Spec-Purity grep，运行异源 3rd-review 独立审查，生成 5 项质量事实契约，写入 spec.md + checklists/requirements.md + spec-acceptance-count.json。
specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/spec.md:132:- **预期结果**：warn 到 onWarn 回调，不 throw，stage 继续，质量事实契约正常产出。
specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/spec.md:160:### 质量事实契约（FR-CONTRACT）
specs/m13b-build-spec-deepening/spec.md:162:**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：
specs/m13b-build-spec-deepening/spec.md:170:- **场景**：Given build-spec 完成一次运行，When 检查 spec.md，Then 质量事实契约 5 项字段均存在，任一字段缺失即自检报 warn。
specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/spec.md:198:- **层 3 附录**：质量事实契约、Known Gaps、兼容性预留、设计决策记录
specs/m13b-build-spec-deepening/spec.md:208:**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/spec.md:237:**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。
specs/m13b-build-spec-deepening/spec.md:241:**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。
specs/m13b-build-spec-deepening/spec.md:244:- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。
specs/m13b-build-spec-deepening/spec.md:248:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
specs/m13b-build-spec-deepening/spec.md:295:**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。
specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/spec.md:340:- [ ] **AC-01**：`workflows/build-spec/SKILL.md` 含质量事实契约 5 项定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），可 grep 到 5 项标题。
specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/spec.md:375:## 附录 A：质量事实契约（本 spec 自检）
specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
specs/m13b-build-spec-deepening/spec.md:403:| verdict | pass | spec 主体为质量事实契约+最小实现，与 decision-log 一致（由异源引擎在独立上下文裁决） |
specs/m13b-build-spec-deepening/spec.md:411:- [RISK] FR-REVIEW-001 异源 3rd-review：依赖现有 3rd-review 基础设施可用（journal/collector/runner）；若基础设施不可用，审查步骤需降级处理并记录在质量事实契约第 3 项。
specs/m13b-build-spec-deepening/spec.md:439:| D1 | 目标重定义：build-spec 产出「质量事实契约」5 项（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），机制反选最少 | FR-CONTRACT-001/002 |
specs/m13b-build-spec-deepening/spec.md:440:| D2 | 保留薄质量本体：spec 构建本体（spec-specify/spec-clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps | **FR-BUILD-001**, FR-LADDER-001/002, FR-STRUCTURE-001/002, FR-SELFCHECK-001/002, FR-REVIEW-001/002, FR-BEHAV-001/002, FR-FRICTION-001, FR-TASKDIR-001, FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/plan.md:11:本计划实施 build-spec 质量事实契约深化（M13b）。目标是在 `workflows/build-spec/SKILL.md`（当前 M11 v1）中加入一套薄"质量事实契约"能力，覆盖 5 项质量事实输出（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review、TASK_TRACKING_ROOT 环境变量约定、以及若干辅助产物和交互规范。
specs/m13b-build-spec-deepening/plan.md:35:- `workflows/build-spec/SKILL.md` — 主产物，添加质量事实契约 5 项 + 所有 FR 覆盖内容
specs/m13b-build-spec-deepening/plan.md:81:**Purpose**: 写入 spec 构建流水线、spec-ladder、质量事实契约 5 项定义、自检、审查等核心 FR，依赖 Phase 1 的基础节定义。
specs/m13b-build-spec-deepening/plan.md:93:**Step 2.3**: 在 SKILL.md 新增「质量事实契约 5 项定义」节
specs/m13b-build-spec-deepening/plan.md:105:- 内容：异源引擎执行、产出 verdict+findings、记入质量事实契约第 3 项，禁止自审自判（FR-REVIEW-001/002）
specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/plan.md:129:- 内容：[FRICTION] 条目格式（FR-FRICTION-001）；长报告存文件传路径规范（FR-ARTIFACT-001）；FR 场景格式要求（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/plan.md:130:- FR 覆盖：FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002
specs/m13b-build-spec-deepening/plan.md:154:| Step 3.2 | FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 | AC-09, AC-15 |
specs/m13b-build-spec-deepening/plan.md:193:- [x] **F1 薄核心** — 判据：本 spec 改动集中在 `workflows/build-spec/SKILL.md` 技能层，核心调度零改动；质量事实契约、自检、审查均下沉到 SKILL.md，核心只做调度。符合 F1 薄核心。
specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/plan.md:217:- [x] **Q3 人可见可干预** — 判据：所有 warn/偏差/gap 均浮现到质量事实契约供人判断；FR-ARTIFACT-001 要求长报告存文件传路径，人可读取。符合 Q3。
specs/m13b-build-spec-deepening/plan.md:219:- [x] **S1 技能有明确输入输出契约** — 判据：FR-BUILD-001 明确 spec 构建流水线 I/O；FR-TASKDIR-001 明确 --task-dir 参数与回退规则；质量事实契约 5 项字段明确为输出契约。符合 S1。
specs/m13b-build-spec-deepening/plan.md:227:- [x] **S5 技能颗粒度合适** — 判据：SKILL.md 深化的每个 FR 覆盖一个功能域，按 Phase 分节实施；质量事实契约 5 项为一个合理的原子单元，不切割成过细的微服务。符合 S5。
specs/m13b-build-spec-deepening/plan.md:259:### 机制 1：质量事实契约 5 项字段（FR-CONTRACT-001）
specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/plan.md:358:| FR-BEHAV-001 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/plan.md:359:| FR-BEHAV-002 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/plan.md:366:| FR-ARTIFACT-001 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/r5-review-prompt.md:17:- tasks.md:75 now reads: "T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）"
specs/m13b-build-spec-deepening/r5-review-prompt.md:42:- [ ] T002 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec 三层结构要求」节：定义层 1 速读卡（一句话需求+核心改动，文件顶部 30 行内）、层 2 正文（问题陈述/背景/FR/AC/影响范围）、层 3 附录（质量事实契约/Known Gaps/设计决策）；新增 Known Gaps 段为必填项说明（可为空列表）。FR: FR-STRUCTURE-001, FR-STRUCTURE-002 (stage:1, depends:无)
specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:76:- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
specs/m13b-build-spec-deepening/r5-review-prompt.md:92:T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）
specs/m13b-build-spec-deepening/r5-review-prompt.md:113:| FR-BEHAV-001 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/r5-review-prompt.md:114:| FR-BEHAV-002 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/r5-review-prompt.md:121:| FR-ARTIFACT-001 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/r5-review-prompt.md:144:The spec.md declares these 24 FRs: FR-BUILD-001, FR-CONTRACT-001, FR-CONTRACT-002, FR-LADDER-001, FR-LADDER-002, FR-STRUCTURE-001, FR-STRUCTURE-002, FR-SELFCHECK-001, FR-SELFCHECK-002, FR-REVIEW-001, FR-REVIEW-002, FR-BEHAV-001, FR-BEHAV-002, FR-FRICTION-001, FR-TASKDIR-001, FR-TRACKING-001, FR-TRACKING-002, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001, FR-COMM-001, FR-COMM-002, FR-SCOPETRIAGE-001, FR-ALIGN-001.
tasks/m13b-build-spec-deepening/artifacts/make-decision-blind-review-merged.md:38:1. **从「移植机制清单」转向「质量事实契约」**：codex 与 antigravity 独立给出同一建议——别搬 7 机制清单，先定义 build-spec 必须产出的质量事实（scope 边界 / 自检结果 / 异源审查摘要 / 未解风险 / handoff required_reads），机制可替换、反选最少。
specs/m13b-build-spec-deepening/tasks.md:19:- [ ] T002 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec 三层结构要求」节：定义层 1 速读卡（一句话需求+核心改动，文件顶部 30 行内）、层 2 正文（问题陈述/背景/FR/AC/影响范围）、层 3 附录（质量事实契约/Known Gaps/设计决策）；新增 Known Gaps 段为必填项说明（可为空列表）。FR: FR-STRUCTURE-001, FR-STRUCTURE-002 (stage:1, depends:无)
specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/tasks.md:53:- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
specs/m13b-build-spec-deepening/tasks.md:75:T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）
specs/m13b-build-spec-deepening/tasks.md:84:2. 完成 T005（质量事实契约 5 项）：核心骨架就位
specs/m13b-build-spec-deepening/tasks.md:92:2. T005 完成 → 质量事实契约骨架 ready，下游可预读
specs/m13b-build-spec-deepening/spec-clarify-scan.md:39:- 质量事实契约 5 项：字段名已定，值格式（字符串/列表/表格）未完全锁定。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:40:- **OQ-1**（OPEN）：质量事实契约第 2 项（自检结果）和第 3 项（独立审查摘要）在 SKILL.md 中是用 Markdown 表格还是 JSON 块记录？decision-log 未明确格式，只说"记录事实"。建议：Markdown 表格（可读性优先），待 build-plan 确认。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:111:- **OQ-3**（OPEN）：SKILL.md 深化版本的 `skill_version` 应为 `2.0.0` 还是 `1.1.0`？decision-log 未明确版本号语义（是语义化版本还是里程碑编号）。建议：`2.0.0`（因引入质量事实契约为较大功能扩展），待人工确认。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:134:| OQ-1 | 数据格式 | 质量事实契约第 2/3 项在 SKILL.md 中用 Markdown 表格还是 JSON 块？ | Markdown 表格（可读性优先） |
tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:8:1. 目标=定义 build-spec 必须产出的「质量事实契约」（scope 边界/自检结果/异源审查摘要/未解风险/handoff required_reads），机制只做候选实现、反选最少。不照搬 agenthub 机制清单。
tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:18:- **方向**：质量事实契约这个方向能否既保质量又不违宪？有无硬伤？
specs/m13b-build-spec-deepening/checklists/requirements.md:13:- [x] 聚焦用户价值与业务需求（质量事实契约、自检、审查均以行为描述）
specs/m13b-build-spec-deepening/checklists/requirements.md:41:| D1 质量事实契约最小实现 | [x] | FR-CONTRACT-001/002 |
specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:16:| 7 条自检清单 | 128-136 | 非阻断自检，便宜。含 Spec-Purity grep（纯事实粗筛）。 |
tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/r3-review-prompt.md:10:FR-SELFCHECK-001: build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
specs/m13b-build-spec-deepening/r3-review-prompt.md:73:| FR-ARTIFACT-001    | 3.1 | T013 |
specs/m13b-build-spec-deepening/r3-review-prompt.md:74:| FR-BEHAV-001       | 3.1 | T013 |
specs/m13b-build-spec-deepening/r3-review-prompt.md:75:| FR-BEHAV-002       | 3.1 | T013 |
specs/m13b-build-spec-deepening/r3-review-prompt.md:102:- T013 [P] FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:23:| 4 | 7 条自检清单（全过才能触发审查） | 清单**合宪**；"才能触发"阻断味**违 Q1** | 保留自检，非阻断 |
tasks/m13b-build-spec-deepening/artifacts/s5-prompt-scope.md:8:1. 移植 7 个质保机制进 build-spec SKILL.md（异源审查、journal/evidence、spec-purity 扫描、7 自检、退出门、推进门、摩擦即记，全部合宪改造为非阻断）。
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:36: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:37:   → SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:38: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:40: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:42: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:44: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:46: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:48: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:85:   → SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:8: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:9: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:10: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:11: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:12: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:13: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:14: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:13:- 收敛 major：从「移植机制清单」转向「定义 build-spec 必须产出的质量事实契约（scope边界/自检/异源审查摘要/未解风险/handoff required_reads），机制可替换反选最少」。
tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:19:- **维持**（甲方方向成立，乙方意见降级为非阻断备注）
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:22: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:23: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:24: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:25: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:26: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:22: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:23: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:24: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:25: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:26: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:50:   → SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:3: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:22: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:41: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:60: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:79: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/constitution-check.md:12:  spec 的核心改动对象是 `workflows/build-spec/SKILL.md`（调度描述层），所有新机制（质量事实契约、自检、审查）均下沉到 SKILL 层描述，核心调度不变；改动牵连面明确限定为单文件深化 + 新增产物文件（影响范围第 7 节），符合"能力下沉技能层、核心只做调度"的薄核心定义。
specs/m13b-build-spec-deepening/constitution-check.md:15:  spec 通过 `--task-dir`（FR-TASKDIR-001）、`TASK_TRACKING_ROOT`（FR-TRACKING-001）、handoff required_reads（质量事实契约第 5 项）三项明确接口与上下游交互，内部实现（7 条自检、三角度审查步骤）不暴露给调用方；模块间接口窄且文件化，符合窄契约定义。
specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/constitution-check.md:27:  spec 引入 `TASK_TRACKING_ROOT` 全局环境变量（FR-TRACKING-001/002），所有 stage 统一从该变量读取任务跟踪文件根目录，跟踪文件不存 repo（.gitignore 约定），实现了统一外置执行记录；`spec-acceptance-count.json`（FR-ACCOUNT-001）和质量事实契约作为结构化产物补充记录，符合 F6。
specs/m13b-build-spec-deepening/constitution-check.md:30:  spec 设计中所有质量事实契约项均"浮现供人判断"（场景 3.2/3.3/3.6 均以"人工可见"或"浮现给人判断"为预期结果），独立三角度审查偏差不自动推进处理，符合"不可逆操作须经人在边界确认"的 F7 原则；spec 未定义任何自动越过人的推进逻辑。
specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/constitution-check.md:68:  spec 通过 `TASK_TRACKING_ROOT` + 任务跟踪文件（FR-TRACKING-001/002）、`spec-acceptance-count.json`（FR-ACCOUNT-001，含 ac_count/fr_count/counted_at）、质量事实契约 5 项结构化产出共同构成指标采集体系；metrics recordSkeleton 场景（3.7）专门处理指标写入失败的降级路径，符合 S4 配套指标采集的要求。
specs/m13b-build-spec-deepening/constitution-check.md:71:  FR-ARTIFACT-001（artifact-first）明确规定"长报告只存路径，禁止在交互消息或 stage-result 中内联完整报告文本（超过 500 字即视为长报告）"；FR-COMM-002 要求勤报进度用路径而非全文；这两条直接减少主上下文占用，便于子代理独立调用技能，符合 S5。
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:269: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:270:AssertionError: SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:279:    104| describe("Phase 2 / AC-01: 质量事实契约 5 items", () => {
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:280:    105|   test("SKILL.md declares 质量事实契约 section", () => {
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:281:    106|     assert.ok(skill().includes("质量事实契约"),
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:283:    107|       "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:288: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:307: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:326: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:345: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:364: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:383: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:397:    135|       c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && …
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:669:AssertionError: SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:683:    273|       "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)…
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stderr:4:AssertionError: SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stderr:18:    273|       "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)…
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:28:| I-01 | LOW | spec.md FR 列表 vs plan.md Verification Mapping | spec.md 附录 C（决策落点覆盖）提及 FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 为"新增 FR"（5 项），但 spec.md 正文 §4 功能需求小节标题顺序与 plan.md Verification Mapping 中的 Step 排序存在轻微不一致——spec §4 按域分组（FR-BUILD → FR-CONTRACT → FR-LADDER → … → FR-COMM），plan 按实施阶段分组（Phase 1 = 基础节先行）。两者都正确，仅顺序视角不同。 | id:I-01, type:inconsistency, location:spec.md §4 vs plan.md Implementation Steps, description:FR 分组视角不同（按域 vs 按实施依赖），suggested_action:无需修改，两种分组均合理且互补 |
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:29:| I-02 | LOW | tasks.md Task ID 引用 vs plan.md FR Coverage Matrix | plan.md §Step 9 FR 覆盖矩阵列出任务编号 T001–T015，但 tasks.md 实际只有 T001–T014（14 条任务）。plan.md 矩阵中 T015 对应 FR-BEHAV-001/002, FR-FRICTION-001, FR-ARTIFACT-001，这些在 tasks.md 中合并到 T013 覆盖。 | id:I-02, type:inconsistency, location:plan.md §Step9 FR Coverage Matrix row T015 vs tasks.md, description:plan.md 矩阵引用 T015 但 tasks.md 无此编号（已并入 T013）, suggested_action:plan.md FR Coverage Matrix 中 T015 改为 T013 |
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:48:| G-01 | LOW | spec.md AC-20, AC-21 vs plan.md/tasks.md | spec.md 含 AC-20（Known Gaps 段可搜索）和 AC-21（行为验证场景格式覆盖）。plan.md Verification Mapping 未单独列出 AC-20/AC-21 的对应 Step（AC-20 隐含在 Step 1.2 / FR-STRUCTURE-002，AC-21 隐含在 Step 3.2 / FR-BEHAV-001/002）。 | id:G-01, type:coverage_gap, location:plan.md Verification Mapping, description:AC-20/AC-21 未显式在 Verification Mapping 中出现, suggested_action:可将 AC-20 加入 Step 1.2 行、AC-21 加入 Step 3.2 行；低优先级，功能覆盖已存在 |
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:273:- tasks.md:75 "T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）"
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:8: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:9: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:11: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:13: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:15: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:17: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:19: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)

exec
/bin/bash -lc 'rg -n "自检结果|required_reads|Spec-Purity|Artifact|artifacts" specs/m13b-build-spec-deepening tasks/m13b-build-spec-deepening workflows/build-spec/SKILL.md tests/m13b-build-spec-deepening.test.mjs' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
tests/m13b-build-spec-deepening.test.mjs:114:  test("SKILL.md includes 自检结果 as contract item 2", () => {
tests/m13b-build-spec-deepening.test.mjs:115:    assert.ok(skill().includes("自检结果"),
tests/m13b-build-spec-deepening.test.mjs:116:      "契约 item 2: 自检结果 (FR-CONTRACT-001)");
tests/m13b-build-spec-deepening.test.mjs:127:  test("SKILL.md includes handoff required_reads as contract item 5", () => {
tests/m13b-build-spec-deepening.test.mjs:129:    assert.ok(c.includes("required_reads") || c.includes("handoff") && c.includes("required"),
tests/m13b-build-spec-deepening.test.mjs:130:      "契约 item 5: handoff required_reads (FR-CONTRACT-001)");
tests/m13b-build-spec-deepening.test.mjs:203:describe("Phase 2 / AC-04: Spec-Purity grep", () => {
tests/m13b-build-spec-deepening.test.mjs:204:  test("SKILL.md declares Spec-Purity grep", () => {
tests/m13b-build-spec-deepening.test.mjs:206:    assert.ok(c.includes("Spec-Purity") || c.includes("spec-purity"),
tests/m13b-build-spec-deepening.test.mjs:207:      "SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)");
tests/m13b-build-spec-deepening.test.mjs:209:  test("SKILL.md states Spec-Purity is non-blocking", () => {
tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
tests/m13b-build-spec-deepening.test.mjs:213:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
workflows/build-spec/SKILL.md:131:### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
workflows/build-spec/SKILL.md:133:spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
workflows/build-spec/SKILL.md:163:2. **自检结果**：7 条自检 + Spec-Purity grep 的 pass/warn/unknown 汇总
workflows/build-spec/SKILL.md:166:5. **handoff required_reads**：下游阶段必读文件清单
workflows/build-spec/SKILL.md:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
workflows/build-spec/SKILL.md:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
workflows/build-spec/SKILL.md:196:长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
workflows/build-spec/SKILL.md:203:以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
tasks/m13b-build-spec-deepening/AGENTS.md:28:- 窄契约：stage 间只走 handoff/latest.json + required_reads[] 窄引用；长报告 artifact-first。
tasks/m13b-build-spec-deepening/scope-decision.md:45:`task_id / current_stage / next_stage / worktree_root / upstream_stage_result_ref / decision_log_ref / spec_ref / plan_ref / tasks_ref / data_contracts_ref / evidence_dir / required_reads / artifact_outputs / missing_items / risk_items / last_human_decision`。
tasks/m13b-build-spec-deepening/scope-decision.md:47:build-spec 写回时**必填子集**（缺任一即验收失败）：`task_id / current_stage / next_stage(=build-plan) / spec_ref / required_reads / artifact_outputs`。下游字段（plan_ref/tasks_ref/data_contracts_ref）本轮留空占位，由 M13c 填充。
tasks/m13b-build-spec-deepening/journal.jsonl:3:{"seq":3,"event":"s1_internal_research_complete","mode":"inline_serial","ts":"2026-06-30T03:36:00Z","artifact":"artifacts/internal-research-summary.md","note":"5 slices; reuse sources in-repo; tension = fact-not-block + heterologous review"}
tasks/m13b-build-spec-deepening/journal.jsonl:6:{"seq":6,"event":"s4_baseline_render_point1","ts":"2026-06-30T04:06:00Z","artifact":"artifacts/make-decision-original-context.md","note":"original context ledger written; S5 dependency satisfied"}
tasks/m13b-build-spec-deepening/journal.jsonl:10:{"seq":10,"event":"constitution_crosscheck_done","ts":"2026-06-30T04:42:00Z","artifact":"artifacts/direction-constitution-crosscheck.md","note":"grill: 5 mechanisms constitutional & portable; 3 blocking gates (stage_exit/post_review_pass/stage_advance) violate F4/F5/F10/Q1/Q2/F7. F10 反例 names agenthub explicitly."}
tasks/m13b-build-spec-deepening/journal.jsonl:11:{"seq":11,"event":"s4_baseline_render_point1_redo","ts":"2026-06-30T04:43:00Z","artifact":"artifacts/make-decision-original-context.md","note":"ledger redone with new direction; constitution conflict surfaced as fact (not blocked)"}
tasks/m13b-build-spec-deepening/journal.jsonl:14:{"seq":14,"event":"s4_baseline_recorded","ts":"2026-06-30T05:10:30Z","stage":"make-decision","artifact":"artifacts/make-decision-original-context.md","note":"render point① v3 final: confirmed direction = 5 constitutional mechanisms direct-port + 3 gates reframed non-blocking + TASK_TRACKING_ROOT env + 5-framework research deferred. S5 dependency satisfied."}
tasks/m13b-build-spec-deepening/journal.jsonl:17:{"seq":17,"event":"s5_blind_review_done","ts":"2026-06-30T05:30:00Z","stage":"make-decision","artifact":"artifacts/make-decision-blind-review-merged.md","note":"3 angles distinct source_family openai/antigravity/anthropic, input_hash 2x2 distinct, no fallback. direction=pass framing=revise(B1 blocking) scope=revise(B2 blocking). direction_divergence=true."}
tasks/m13b-build-spec-deepening/journal.jsonl:18:{"seq":18,"event":"debate_1_triggered","ts":"2026-06-30T05:31:00Z","stage":"make-decision","artifact":"artifacts/make-decision-debate1-verdict.md","note":"blocking findings present -> debate#1 ran (single-person three-tier degrade). verdict=建议改: keep gate-non-blocking-reframe + 5 mechanisms as candidates; adopt B1 (reframe goal to quality-fact-contract, mechanisms minimal) + B2 (split 5-framework research out)."}
tasks/m13b-build-spec-deepening/journal.jsonl:22:{"seq":22,"event":"design_granular_eval_done","ts":"2026-06-30T06:02:00Z","stage":"make-decision","artifact":"artifacts/agenthub-design-keep-cut-modify.md","note":"read design.md full 247 lines. keep 10 blocks (spec body/spec-ladder/3-tier/self-check/3rd-review/behavior-verify/task-dir/friction/gaps); modify 3 gates non-blocking; cut TodoWrite ceremony + [DECOMP] telemetry + gate-bound auto-write + dup exit line."}
tasks/m13b-build-spec-deepening/journal.jsonl:27:{"seq":27,"event":"cut_confirmed_modify_pending","ts":"2026-06-30T06:33:00Z","stage":"make-decision","note":"Hugh confirmed CUT list deletable. Hugh questions MODIFY block (3 gates non-blocking) value vs token. My assessment: gate-mechanism wrapper is redundant - its checks already covered by kept 7-item self-check + Spec-Purity + heterologous-review-surface. Recommend folding MODIFY into CUT. Pending Hugh choice A/B."}
tasks/m13b-build-spec-deepening/journal.jsonl:28:{"seq":28,"event":"modify_block_cut_confirmed","ts":"2026-06-30T07:00:00Z","stage":"make-decision","note":"Hugh chose option A: delete entire MODIFY block (3 gates non-blocking). checks already covered by kept 7-self-check + Spec-Purity + heterologous-review. direction now fully locked."}
tasks/m13b-build-spec-deepening/journal.jsonl:30:{"seq":30,"event":"s5_economy_review_done","ts":"2026-06-30T07:10:00Z","stage":"make-decision","artifact":".omc/artifacts/ask/codex-workflowhub-ai-agenthub-9-5-gate-gate-f10-m13b-agenthub-desi-2026-06-30T05-13-33-791Z.md","note":"1-AI 3-angle review on final direction. direction=pass(minor: ensure record-not-block wording). framing=revise(major: rename 省钱版 to 独立三角度审查, dont claim source_family异源; kept checks must land in artifacts). scope=revise(major: TASK_TRACKING_ROOT global, this batch write only build-spec read-convention, full global landing separate). NO blocking."}
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:9:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:132:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:284:- 质量事实契约 5 项齐全：[workflows/build-spec/SKILL.md:158](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:158) 到 [workflows/build-spec/SKILL.md:168](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 包含 scope 边界、自检结果、独立审查摘要、未解风险、handoff required_reads，并声明记录+浮现语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:319:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:579:In plan mode, allowed because they inform the plan: `$B`, `$D`, `codex exec`/`codex review`, writes to `~/.gstack/`, writes to the plan file, and `open` for generated artifacts.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:860:+### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:862:+spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:872:+**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:892:+2. **自检结果**：7 条自检 + Spec-Purity grep 的 pass/warn/unknown 汇总
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:895:+5. **handoff required_reads**：下游阶段必读文件清单
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:911:+### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:923:+#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1075:   131	### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1077:   133	spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1087:   143	**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1107:   163	2. **自检结果**：7 条自检 + Spec-Purity grep 的 pass/warn/unknown 汇总
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1110:   166	5. **handoff required_reads**：下游阶段必读文件清单
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1126:   182	### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1138:   194	#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1279:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report-round-1.md:8:Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1287:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.raw.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1303:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1315:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report.md:8:Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1323:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1338:./tasks/m13b-build-spec-deepening/scope-decision.md:45:`task_id / current_stage / next_stage / worktree_root / upstream_stage_result_ref / decision_log_ref / spec_ref / plan_ref / tasks_ref / data_contracts_ref / evidence_dir / required_reads / artifact_outputs / missing_items / risk_items / last_human_decision`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1339:./tasks/m13b-build-spec-deepening/scope-decision.md:47:build-spec 写回时**必填子集**（缺任一即验收失败）：`task_id / current_stage / next_stage(=build-plan) / spec_ref / required_reads / artifact_outputs`。下游字段（plan_ref/tasks_ref/data_contracts_ref）本轮留空占位，由 M13c 填充。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1429:tests/m13b-build-spec-deepening.test.mjs:209:  test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1430:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1431:tests/m13b-build-spec-deepening.test.mjs:213:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1453:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1465:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1469:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1476:specs/m13b-build-spec-deepening/spec.md:104:### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1477:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1486:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1490:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1502:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1507:specs/m13b-build-spec-deepening/plan.md:95:- 内容：5 项字段定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），禁止阻断语义（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1510:specs/m13b-build-spec-deepening/plan.md:197:- [x] **F3 物理事实靠机器校验但不阻断** — 判据：Spec-Purity grep、scope-triage grep、7 条自检均为机器执行并客观记录结论（pass/warn/unknown），明确要求不阻断推进（FR-CONTRACT-002, FR-SELFCHECK-001/002）。符合 F3。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1524:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1526:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1533:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1535:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1539:specs/m13b-build-spec-deepening/spec-clarify-scan.md:50:- Spec-Purity grep 命中：warn + 记录，不阻断（FR-SELFCHECK-002）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1547:specs/m13b-build-spec-deepening/checklists/requirements.md:74:## 五、阻断语言检查（Spec-Purity 阻断门语义）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1553:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1562:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:71: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1563:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:72:   → Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1570:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1576:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:41: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1589:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:573: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1590:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:574:AssertionError: Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1591:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:583:    209|   test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1592:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:587:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1593:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:588:    213|       "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1603:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:40: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1604:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:41:   → Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1612:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:41: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1616:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:250: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1617:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:251:AssertionError: Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1618:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:260:    209|   test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1619:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:264:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1620:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:265:    213|       "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1633:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1641:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1656:specs/m13b-build-spec-deepening/build-plan-3rd-review.md:328:**R5 Verdict: PASS** — All blocking findings resolved. Build-plan artifacts cleared for build-code phase.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1827:tests/m13b-build-spec-deepening.test.mjs:116:      "契约 item 2: 自检结果 (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1830:tests/m13b-build-spec-deepening.test.mjs:130:      "契约 item 5: handoff required_reads (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1847:tests/m13b-build-spec-deepening.test.mjs:207:      "SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1848:tests/m13b-build-spec-deepening.test.mjs:213:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1879:workflows/build-spec/SKILL.md:131:### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1881:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1889:workflows/build-spec/SKILL.md:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1891:workflows/build-spec/SKILL.md:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1906:specs/m13b-build-spec-deepening/spec.md:206:### 7 条自检 + Spec-Purity（FR-SELFCHECK）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1908:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1928:specs/m13b-build-spec-deepening/spec.md:293:### Artifact-First（FR-ARTIFACT）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1941:specs/m13b-build-spec-deepening/spec.md:409:- [RISK] FR-SELFCHECK-002 Spec-Purity grep：本 spec 示例代码块（JSON 格式示例）会命中 grep 触发 warn，已由人工确认为文档示例（可接受）；SKILL.md 实现时需说明 warn 后的人工判断流程，示例块与实现代码同等触发 warn，不自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1944:specs/m13b-build-spec-deepening/spec.md:427:1. **Spec-Purity 文档示例判断**：FR-SELFCHECK-002 已统一规则：示例块与实现代码同等触发 warn，人工确认是否可接受。SKILL.md 实现时需说明 warn 后的人工判断流程，无需额外豁免逻辑。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1945:specs/m13b-build-spec-deepening/spec.md:439:| D1 | 目标重定义：build-spec 产出「质量事实契约」5 项（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），机制反选最少 | FR-CONTRACT-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1946:specs/m13b-build-spec-deepening/spec.md:440:| D2 | 保留薄质量本体：spec 构建本体（spec-specify/spec-clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps | **FR-BUILD-001**, FR-LADDER-001/002, FR-STRUCTURE-001/002, FR-SELFCHECK-001/002, FR-REVIEW-001/002, FR-BEHAV-001/002, FR-FRICTION-001, FR-TASKDIR-001, FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2069:  test("SKILL.md includes 自检结果 as contract item 2", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2070:    assert.ok(skill().includes("自检结果"),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2071:      "契约 item 2: 自检结果 (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2082:  test("SKILL.md includes handoff required_reads as contract item 5", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2084:    assert.ok(c.includes("required_reads") || c.includes("handoff") && c.includes("required"),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2085:      "契约 item 5: handoff required_reads (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2158:describe("Phase 2 / AC-04: Spec-Purity grep", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2159:  test("SKILL.md declares Spec-Purity grep", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2161:    assert.ok(c.includes("Spec-Purity") || c.includes("spec-purity"),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2162:      "SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2164:  test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2167:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2168:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2327:specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2893:131:### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2896:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2904:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2906:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2936:340:- [ ] **AC-01**：`workflows/build-spec/SKILL.md` 含质量事实契约 5 项定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），可 grep 到 5 项标题。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2939:343:- [ ] **AC-04**：SKILL.md 含 Spec-Purity grep 描述，明确列出检测目标（代码块/路径/shell 命令）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2989:- 质量事实契约 5 项齐全：[workflows/build-spec/SKILL.md:158](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:158) 到 [workflows/build-spec/SKILL.md:168](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 包含 scope 边界、自检结果、独立审查摘要、未解风险、handoff required_reads，并声明记录+浮现语义。
tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:99:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:103:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:114:2. spec 自检（无 7 条自检 + Spec-Purity grep，spec 纯度无法浮现）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:142:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:148:- handoff required_reads（作为契约第 5 项）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:177:- **操作步骤**：编排者传入 task-id + decision-log 路径，调起 build-spec；执行代理读 decision-log，产出 spec 初稿，运行 spec-ladder 判断档位，执行 7 条自检 + Spec-Purity grep，运行异源 3rd-review 独立审查，生成 5 项质量事实契约，写入 spec.md + checklists/requirements.md + spec-acceptance-count.json。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:180:### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:182:- **操作步骤**：spec 初稿含代码路径或 shell 命令（违反 Spec-Purity）；执行代理 grep 发现违规行。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:183:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:241:2. **自检结果**：7 条自检 + Spec-Purity grep 的逐条结论（pass/warn/unknown）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:244:5. **handoff required_reads**：下游 stage 执行时必须读取的文件路径列表
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:251:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:282:### 7 条自检 + Spec-Purity（FR-SELFCHECK）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:296:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:298:- **场景**：Given spec 中有 shell 命令，When Spec-Purity grep，Then warn + 命中行列表写入自检结果，stage 继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:299:- **场景**：Given spec 中有 JSON 格式示例代码块，When Spec-Purity grep，Then 同样记 warn + 命中行，由人工判断是否为可接受的文档示例，不自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:345:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:362:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:363:specs/m13b-build-spec-deepening/spec.md:223:- **场景**：Given spec 中有 JSON 格式示例代码块，When Spec-Purity grep，Then 同样记 warn + 命中行，由人工判断是否为可接受的文档示例，不自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:367:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:368:specs/m13b-build-spec-deepening/spec.md:409:- [RISK] FR-SELFCHECK-002 Spec-Purity grep：本 spec 示例代码块（JSON 格式示例）会命中 grep 触发 warn，已由人工确认为文档示例（可接受）；SKILL.md 实现时需说明 warn 后的人工判断流程，示例块与实现代码同等触发 warn，不自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:381:tasks/m13b-build-spec-deepening/stage-result-build-spec.json:27:  "reason": "spec.md 经 spec-specify 初稿 + spec-clarify 澄清 + F10 反过度工程门 + 宪法符合性检查(constitution-check.md) + baseline 对照(baseline-report.md) + 异源 codex 独立审查(FR-REVIEW 2轮迭代 + 覆盖审计3轮，最终 verdict=pass，review_evidence 见 .omc/artifacts/ask/codex-1-tasks-m13b-build-spec-deepening-decision-log-md-2-specs-m1-2026-06-30T06-59-30-358Z.md)，全部完成。人审检查点已通过(human_intervention=true)。24 FR / 22 AC，spec-acceptance-count.json 落档。进入 build-plan 段。"
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:389:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:391:tasks/m13b-build-spec-deepening/artifacts/internal-research-summary.md:8:build-spec 当前是 M11 交付的 v1：spec-specify → spec-clarify → 宪法检查(F1–F10) → baseline 对照 → F10 反过度工程门 → 人工审查。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:392:tasks/m13b-build-spec-deepening/artifacts/internal-research-summary.md:14:- M0 `grill-with-docs-lite`（外部改造薄壳，交互逐条质询，写边界回 spec/decision-log）——P0-2 取其「逼边界」内核但改非交互自动扫描。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:393:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:9:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:395:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:132:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:401:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:319:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:405:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:872:+**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:410:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1087:   143	**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:449:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1453:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:454:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1490:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:455:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1502:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:458:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1526:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:461:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1535:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:463:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1553:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:476:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1881:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:478:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1908:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:479:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1941:specs/m13b-build-spec-deepening/spec.md:409:- [RISK] FR-SELFCHECK-002 Spec-Purity grep：本 spec 示例代码块（JSON 格式示例）会命中 grep 触发 warn，已由人工确认为文档示例（可接受）；SKILL.md 实现时需说明 warn 后的人工判断流程，示例块与实现代码同等触发 warn，不自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:487:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2896:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:496:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:500:specs/m13b-build-spec-deepening/plan.md:211:- [x] **F10 自动化按真实收益添加** — 判据：spec 只加入 grep 类轻量自动化（Spec-Purity grep、scope-triage grep），无新增 CI gate、无复杂 runner；F10 四问在 spec-ladder 档位判断时显式执行（FR-LADDER-002）。见本文档 F10 Gate 节详细回答。符合 F10。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:504:tasks/m13b-build-spec-deepening/journal.jsonl:10:{"seq":10,"event":"constitution_crosscheck_done","ts":"2026-06-30T04:42:00Z","artifact":"artifacts/direction-constitution-crosscheck.md","note":"grill: 5 mechanisms constitutional & portable; 3 blocking gates (stage_exit/post_review_pass/stage_advance) violate F4/F5/F10/Q1/Q2/F7. F10 反例 names agenthub explicitly."}
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:509:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:521:tasks/m13b-build-spec-deepening/artifacts/s5-prompt-framing.md:5:背景：workflowhub 是 AI 开发工作流编排工具，宪法核心信条：薄核心窄契约、记事实不阻断、质量靠独立审查与人。它立项就是为逃离前身 agenthub——agenthub 堆约 9.5 万行 gate 代码、半数提交修 gate 死锁，被宪法 F10 列为反例。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:527:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:533:tasks/m13b-build-spec-deepening/artifacts/s5-prompt-direction.md:5:背景：workflowhub 是 AI 开发工作流编排工具，有一套宪法 CONSTITUTION（核心信条：薄核心窄契约、记事实不阻断、质量靠独立审查与人、不写阻断式质量门）。它的立项根因之一就是逃离前身系统 agenthub——agenthub 堆了约 9.5 万行 gate/校验代码，约一半提交在修 gate 死锁，宪法 F10 反例点名此事。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:534:tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:4:workflowhub 是 AI 工作流编排工具，宪法核心：薄核心窄契约、记事实不阻断、质量靠独立审查与人、不写阻断式质量门。立项是为逃离前身 agenthub（堆 9.5 万行 gate 代码、半数提交修 gate 死锁，被宪法 F10 点名反例）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:536:tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:4:workflowhub：AI 工作流编排工具，宪法核心=薄核心、记事实不阻断、质量靠独立审查与人、不写阻断式质量门。立项为逃离前身 agenthub（堆 9.5 万行 gate 代码、半数提交修 gate 死锁，宪法 F10 反例点名）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:537:tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:10:3. 删：agenthub 那 3 道门（退出门/审查门/推进门）整层删（检查内容已被 7 自检+纯净度扫描+异源审查覆盖）；TodoWrite 待办模板仪式、[DECOMP] 遥测、绑门自动写、重复行。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:538:tasks/m13b-build-spec-deepening/artifacts/make-decision-original-context.md:19:- CONSTITUTION.md v1.1.0 已亲读：F4/F5/F10/Q1/Q2 明确禁止「阻断式质量门」；**F10 反例原文点名 agenthub 的 9.5 万行 gate 代码为永久警示**。【基准已读】
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:539:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:13:| 最简 spec 阶梯（4 层决策闸） | 74-89 | 反过度工程，正对宪法 F10。决策闸非调研，便宜。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:540:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:37:| host 自动写 capture+stage_summary 绑 gate 的描述 | 18 | 绑在阻断门上的自动写仪式，门删了它也没意义。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:541:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:548:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:12:**这正是 workflowhub 生来要逃离的东西**——CONSTITUTION F10 反例原文点名："某前身系统为追求一切机器可自动校验，堆出约 9.5 万行 gate/校验代码……约一半代码提交都在修 gate 本身的死锁与漏洞"。该前身系统 = agenthub。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:549:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:20:| 1 | 退出检查门 gate.sh stage_exit（没过不能进） | **违 F4/F5/F10/Q2** | 不可照搬。改：6 条检查照跑，结果记事实+浮现边界，**不阻断**；推进由人确认（F7） |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:550:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:25:| 6 | stage_advance 关 post_review_pass | **违 F4/F5/F7/Q1** | 不可照搬。推进经人确认即可（F7），不要自动 gate |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:551:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:31:- **必须改造（违宪，不可照搬）**：stage_exit 门、post_review_pass 门、stage_advance 门 → 3 道 blocking gate。照搬即违 F4/F5/F7/F10/Q1/Q2，且违 CLAUDE.md 硬规则「不引入会阻断推进的质量门」。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:552:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:36:照搬 blocking gate = 推翻 workflowhub 立项根因，需走 CONSTITUTION governance 修宪（改 F4/F5/F10/Q1/Q2）。这是大决定，不能由 make-decision 默默执行。见 talk 问题 A/B。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:580:131:### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:582:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:589:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:592:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:749:### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:751:spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:761:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:781:2. **自检结果**：7 条自检 + Spec-Purity grep 的 pass/warn/unknown 汇总
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:784:5. **handoff required_reads**：下游阶段必读文件清单
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:800:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:812:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1014:tests/m13-make-decision.test.mjs:561:      "S3 dual-empty stop flow must write an artifacts file containing dual_research_empty: true (FR-RESEARCH-03)"
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1031:tests/m13-make-decision.test.mjs:1034:  test("S5 debate gate: triggered output goes to tasks/{task-id}/artifacts/make-decision-debate-1.md", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1032:tests/m13-make-decision.test.mjs:1038:      "S5 debate gate must produce tasks/{task-id}/artifacts/make-decision-debate-1.md when triggered"
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1052:tests/m13-make-decision.test.mjs:1700:  test("S5 debate gate passes finding ID list from artifacts to debate skill", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1056:tests/m13-make-decision.test.mjs:1781:  test("S3 dual_research_empty stop flow includes artifacts entry dual_research_empty: true", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1057:tests/m13-make-decision.test.mjs:1788:      "S3 dual_research_empty stop flow must write artifacts with dual_research_empty: true field"
tasks/m13b-build-spec-deepening/decision-log.md:9:> 核查来源：`artifacts/make-decision-blind-review-merged.md`、`artifacts/make-decision-debate1-verdict.md`、`artifacts/agenthub-design-keep-cut-modify.md`、`artifacts/s5-economy-review-prompt.md`（make-decision 阶段盲审产物，非 build-spec FR-REVIEW 审查产物）
tasks/m13b-build-spec-deepening/decision-log.md:22:- **D1（目标重定义）**：build-spec 必须产出「质量事实契约」=｛scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads｝。机制只做候选实现、反选最少，不照搬 agenthub 机制清单。
tasks/m13b-build-spec-deepening/decision-log.md:24:- **D2（保留薄质量本体）**：spec 构建本体（speckit-specify/clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps。**这些检查必须落到产物里**（economy 框架角前提）。
tasks/m13b-build-spec-deepening/decision-log.md:34:- **D8（8 项纳入裁定）**：Hugh 提的 8 件事全部纳入本任务，无新增阻断门。映射：①handoff.json→D1 required_reads（已在）；②范围判断+高危词→scope-triage（D2，已在，"强制完整流程"改为高危词浮现+建议，不卡推进）；③需求自检 4 类→7 条自检（D2，已在，记录不卡）；④前后一致性→spec↔decision-log 对齐（D1，已在）；⑤独立审查→异源3rd-review独立审查（D4修正，复用现有基础设施）；⑥FR-{DOMAIN}-NNN 编号格式→新增小项（便宜）；⑦AC 条数计数存文件→新增小项（便宜）；⑧长报告只存路径→REQ-COMM/artifact-first（已在）。结论：6 项已在 D1/D2/D4，2 项（⑥⑦）为低成本新增，0 项引入阻断门。
tasks/m13b-build-spec-deepening/decision-log.md:57:- build-spec SKILL.md 含「质量事实契约」5 项产出定义（scope 边界/自检/独立审查摘要/未解风险/handoff required_reads），可逐项核对。
tasks/m13b-build-spec-deepening/stage-result-build-spec.json:8:    "artifacts": {
tasks/m13b-build-spec-deepening/stage-result-build-spec.json:14:      "review_evidence": ".omc/artifacts/ask/codex-1-tasks-m13b-build-spec-deepening-decision-log-md-2-specs-m1-2026-06-30T06-59-30-358Z.md"
tasks/m13b-build-spec-deepening/stage-result-build-spec.json:18:      "required_reads": [
tasks/m13b-build-spec-deepening/stage-result-build-spec.json:27:  "reason": "spec.md 经 spec-specify 初稿 + spec-clarify 澄清 + F10 反过度工程门 + 宪法符合性检查(constitution-check.md) + baseline 对照(baseline-report.md) + 异源 codex 独立审查(FR-REVIEW 2轮迭代 + 覆盖审计3轮，最终 verdict=pass，review_evidence 见 .omc/artifacts/ask/codex-1-tasks-m13b-build-spec-deepening-decision-log-md-2-specs-m1-2026-06-30T06-59-30-358Z.md)，全部完成。人审检查点已通过(human_intervention=true)。24 FR / 22 AC，spec-acceptance-count.json 落档。进入 build-plan 段。"
specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/spec.md:38:2. spec 自检（无 7 条自检 + Spec-Purity grep，spec 纯度无法浮现）
specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/spec.md:72:- handoff required_reads（作为契约第 5 项）
specs/m13b-build-spec-deepening/spec.md:101:- **操作步骤**：编排者传入 task-id + decision-log 路径，调起 build-spec；执行代理读 decision-log，产出 spec 初稿，运行 spec-ladder 判断档位，执行 7 条自检 + Spec-Purity grep，运行异源 3rd-review 独立审查，生成 5 项质量事实契约，写入 spec.md + checklists/requirements.md + spec-acceptance-count.json。
specs/m13b-build-spec-deepening/spec.md:104:### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）
specs/m13b-build-spec-deepening/spec.md:106:- **操作步骤**：spec 初稿含代码路径或 shell 命令（违反 Spec-Purity）；执行代理 grep 发现违规行。
specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/spec.md:165:2. **自检结果**：7 条自检 + Spec-Purity grep 的逐条结论（pass/warn/unknown）
specs/m13b-build-spec-deepening/spec.md:168:5. **handoff required_reads**：下游 stage 执行时必须读取的文件路径列表
specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/spec.md:206:### 7 条自检 + Spec-Purity（FR-SELFCHECK）
specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/spec.md:222:- **场景**：Given spec 中有 shell 命令，When Spec-Purity grep，Then warn + 命中行列表写入自检结果，stage 继续。
specs/m13b-build-spec-deepening/spec.md:223:- **场景**：Given spec 中有 JSON 格式示例代码块，When Spec-Purity grep，Then 同样记 warn + 命中行，由人工判断是否为可接受的文档示例，不自动豁免。
specs/m13b-build-spec-deepening/spec.md:293:### Artifact-First（FR-ARTIFACT）
specs/m13b-build-spec-deepening/spec.md:340:- [ ] **AC-01**：`workflows/build-spec/SKILL.md` 含质量事实契约 5 项定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），可 grep 到 5 项标题。
specs/m13b-build-spec-deepening/spec.md:343:- [ ] **AC-04**：SKILL.md 含 Spec-Purity grep 描述，明确列出检测目标（代码块/路径/shell 命令）。
specs/m13b-build-spec-deepening/spec.md:382:### 2. 自检结果
specs/m13b-build-spec-deepening/spec.md:394:Spec-Purity grep：本 spec 含代码块（spec-acceptance-count.json 示例），命中 warn，由人工确认该命中为文档示例（可接受），非实现代码误入。warn — 人工确认可接受。
specs/m13b-build-spec-deepening/spec.md:399:- **审查产物路径**：`artifacts/3rd-review-verdict.md`（实际执行时由 SKILL.md 填入）
specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/spec.md:409:- [RISK] FR-SELFCHECK-002 Spec-Purity grep：本 spec 示例代码块（JSON 格式示例）会命中 grep 触发 warn，已由人工确认为文档示例（可接受）；SKILL.md 实现时需说明 warn 后的人工判断流程，示例块与实现代码同等触发 warn，不自动豁免。
specs/m13b-build-spec-deepening/spec.md:427:1. **Spec-Purity 文档示例判断**：FR-SELFCHECK-002 已统一规则：示例块与实现代码同等触发 warn，人工确认是否可接受。SKILL.md 实现时需说明 warn 后的人工判断流程，无需额外豁免逻辑。
specs/m13b-build-spec-deepening/spec.md:439:| D1 | 目标重定义：build-spec 产出「质量事实契约」5 项（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），机制反选最少 | FR-CONTRACT-001/002 |
specs/m13b-build-spec-deepening/spec.md:440:| D2 | 保留薄质量本体：spec 构建本体（spec-specify/spec-clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps | **FR-BUILD-001**, FR-LADDER-001/002, FR-STRUCTURE-001/002, FR-SELFCHECK-001/002, FR-REVIEW-001/002, FR-BEHAV-001/002, FR-FRICTION-001, FR-TASKDIR-001, FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/plan.md:11:本计划实施 build-spec 质量事实契约深化（M13b）。目标是在 `workflows/build-spec/SKILL.md`（当前 M11 v1）中加入一套薄"质量事实契约"能力，覆盖 5 项质量事实输出（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review、TASK_TRACKING_ROOT 环境变量约定、以及若干辅助产物和交互规范。
specs/m13b-build-spec-deepening/plan.md:95:- 内容：5 项字段定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），禁止阻断语义（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/plan.md:98:**Step 2.4**: 在 SKILL.md 新增「7 条自检 + Spec-Purity grep」节
specs/m13b-build-spec-deepening/plan.md:100:- 内容：7 条自检逐条列表（1-7 编号）、Spec-Purity grep 检测目标（代码块/路径/shell 命令）（FR-SELFCHECK-001/002）
specs/m13b-build-spec-deepening/plan.md:127:**Step 3.2**: 在 SKILL.md 新增「摩擦捕获 + Artifact-First + 行为验证要求」节
specs/m13b-build-spec-deepening/plan.md:197:- [x] **F3 物理事实靠机器校验但不阻断** — 判据：Spec-Purity grep、scope-triage grep、7 条自检均为机器执行并客观记录结论（pass/warn/unknown），明确要求不阻断推进（FR-CONTRACT-002, FR-SELFCHECK-001/002）。符合 F3。
specs/m13b-build-spec-deepening/plan.md:205:- [x] **F7 检查可证伪** — 判据：AC-01~AC-22 全部可用 grep 或 JSON schema 验证，非绿灯式假通过；Spec-Purity grep "实际为假时报 warn"是真实失败（FR-SELFCHECK-002）。符合 F7。
specs/m13b-build-spec-deepening/plan.md:211:- [x] **F10 自动化按真实收益添加** — 判据：spec 只加入 grep 类轻量自动化（Spec-Purity grep、scope-triage grep），无新增 CI gate、无复杂 runner；F10 四问在 spec-ladder 档位判断时显式执行（FR-LADDER-002）。见本文档 F10 Gate 节详细回答。符合 F10。
specs/m13b-build-spec-deepening/plan.md:262:2. **已有机制是否覆盖**：未覆盖。现有 SKILL.md 仅有 constitution check，无 scope 边界声明、无 7 条自检、无 3rd-review 记录、无 handoff required_reads。
specs/m13b-build-spec-deepening/plan.md:277:### 机制 3：7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
specs/m13b-build-spec-deepening/plan.md:279:1. **防御的真实威胁**：spec 遗漏 FR-{DOMAIN}-NNN 格式、缺少 Given/When/Then 场景、混入实现代码（Spec-Purity 问题）——这些在 M11 实证中有出现（spec 含 shell 命令）。
specs/m13b-build-spec-deepening/plan.md:282:4. **长期维护成本**：低。7 条为固定清单，Spec-Purity grep 是简单正则，不引入新 runner。
tasks/m13b-build-spec-deepening/artifacts/internal-research-summary.md:29:- handoff/contract 模式（窄引用 + required_reads[]）是降低 stage 间上下文成本的标准做法；M13b-M13e 共用成本契约已定最小字段集。
specs/m13b-build-spec-deepening/r5-review-prompt.md:3:You are a NON-CLAUDE heterologous reviewer. This is Round 5. Your job: verify R4-BLK-1 is closed AND do a final full pass on the build-plan artifacts.
specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:76:- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
tasks/m13b-build-spec-deepening/artifacts/make-decision-blind-review-merged.md:11:| direction（方向合理性） | openai | codex gpt-5.5 | 13af72333f7b0180 | **pass** | `.omc/artifacts/ask/codex-intake-direction-review-*.md` |
tasks/m13b-build-spec-deepening/artifacts/make-decision-blind-review-merged.md:12:| framing（框架挑战） | antigravity | antigravity | 24348b87d1859adb | **revise** | `.omc/artifacts/ask/antigravity-intake-framing-challenge-*.md` |
tasks/m13b-build-spec-deepening/artifacts/make-decision-blind-review-merged.md:13:| scope（范围边界） | anthropic | claude | 66a1c2edf250b6f2 | **revise** | `.omc/artifacts/ask/claude-intake-scope-review-*.md` |
tasks/m13b-build-spec-deepening/artifacts/make-decision-blind-review-merged.md:38:1. **从「移植机制清单」转向「质量事实契约」**：codex 与 antigravity 独立给出同一建议——别搬 7 机制清单，先定义 build-spec 必须产出的质量事实（scope 边界 / 自检结果 / 异源审查摘要 / 未解风险 / handoff required_reads），机制可替换、反选最少。
specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/tasks.md:53:- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
tasks/m13b-build-spec-deepening/artifacts/make-decision-original-context.md:10:> M13b 真正的核心目标：把 agenthub design 阶段的质量保障体系（gate.sh exit 门、3rd-review 强制审查、Spec-Purity 纯净度预检、7 条自检清单、journal/evidence 留痕、stage_advance 关、workflow-feedback 记录）移植到 workflowhub 的 `workflows/build-spec/SKILL.md` 里。原来那 8 个 P0-P2 条目变成这个框架下的细节，不再是核心。
tasks/m13b-build-spec-deepening/artifacts/make-decision-original-context.md:35:1. **5 机制合宪直搬**：异源审查（复用 3rd-review skill）、journal/evidence 留痕（复用 journal.jsonl + collector）、Spec-Purity grep 扫描、7 条自检清单、摩擦即记精神。全部「记事实 + 浮现，不阻断」。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:40:- **OQ-1**（OPEN）：质量事实契约第 2 项（自检结果）和第 3 项（独立审查摘要）在 SKILL.md 中是用 Markdown 表格还是 JSON 块记录？decision-log 未明确格式，只说"记录事实"。建议：Markdown 表格（可读性优先），待 build-plan 确认。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:50:- Spec-Purity grep 命中：warn + 记录，不阻断（FR-SELFCHECK-002）。
tasks/m13b-build-spec-deepening/artifacts/s5-review-scope.out:1:/Users/Hugh/Hugh/Project/workflowhub/tasks/m13b-build-spec-deepening/.omc/artifacts/ask/claude-intake-scope-review-workflowhub-m13b-build-spec-workflowhub--2026-06-30T04-30-47-576Z.md
specs/m13b-build-spec-deepening/checklists/requirements.md:24:- [x] 边界情况已标识（TASK_TRACKING_ROOT 未设置、metrics 写入失败、Spec-Purity 命中等）
specs/m13b-build-spec-deepening/checklists/requirements.md:42:| D2 spec-ladder + 三层小节 + 7 条自检 + Spec-Purity | [x] | FR-LADDER, FR-STRUCTURE, FR-SELFCHECK |
specs/m13b-build-spec-deepening/checklists/requirements.md:45:| D5 Known Gaps + handoff required_reads | [x] | FR-STRUCTURE-002, FR-CONTRACT-001 第5项 |
specs/m13b-build-spec-deepening/checklists/requirements.md:74:## 五、阻断语言检查（Spec-Purity 阻断门语义）
specs/m13b-build-spec-deepening/r3-review-prompt.md:3:You are acting as a heterologous (non-Claude) code reviewer performing a third-round re-review of build-plan artifacts for task `m13b-build-spec-deepening`. This is an independent review — do not defer to previous rounds; verify claims yourself from the raw text.
specs/m13b-build-spec-deepening/r3-review-prompt.md:5:## Artifacts under review
specs/m13b-build-spec-deepening/r3-review-prompt.md:24:T008 [P] 在 workflows/build-spec/SKILL.md 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：
specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:8:1. 目标=定义 build-spec 必须产出的「质量事实契约」（scope 边界/自检结果/异源审查摘要/未解风险/handoff required_reads），机制只做候选实现、反选最少。不照搬 agenthub 机制清单。
tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:9:2. 保留（薄质量本体）：spec 构建本体（speckit-specify/clarify+平台约束交叉比对+扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检+Spec-Purity grep、异源审查、行为验证规则、摩擦即记、--task-dir 机制、Known Gaps。
tasks/m13b-build-spec-deepening/artifacts/make-decision-debate1-verdict.md:5:> 裁决员 source_family: openai（codex gpt-5.5）｜ raw: `.omc/artifacts/ask/codex-debate-*.md`
tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:16:| 7 条自检清单 | 128-136 | 非阻断自检，便宜。含 Spec-Purity grep（纯事实粗筛）。 |
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:40: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:41:   → 契约 item 2: 自检结果 (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:46: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:47:   → 契约 item 5: handoff required_reads (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:69: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md declares Spec-Purity grep
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:70:   → SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:71: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:72:   → Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:22:| 3 | Spec-Purity grep 预检（不过不能提审） | grep 扫描**合宪**（F3 机器采集）；"不能提审"阻断**违 Q1** | 保留扫描，结果记事实，命中浮现给人，不阻断 |
tasks/m13b-build-spec-deepening/artifacts/s5-debate1.out:1:/Users/Hugh/Hugh/Project/workflowhub/tasks/m13b-build-spec-deepening/.omc/artifacts/ask/codex-debate-claude-code-experimental-agent-teams-workflowhub-ai-a-2026-06-30T04-34-27-215Z.md
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:10: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:13: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:26: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md declares Spec-Purity grep
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
tasks/m13b-build-spec-deepening/artifacts/s5-economy.out:1:/Users/Hugh/Hugh/Project/workflowhub/tasks/m13b-build-spec-deepening/.omc/artifacts/ask/codex-workflowhub-ai-agenthub-9-5-gate-gate-f10-m13b-agenthub-desi-2026-06-30T05-13-33-791Z.md
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:11: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:12:   → 契约 item 2: 自检结果 (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:17: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:18:   → 契约 item 5: handoff required_reads (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:38: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md declares Spec-Purity grep
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:39:   → SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:40: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:41:   → Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:5:**Artifacts scanned**: spec.md, plan.md, tasks.md
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:14:| Artifact | FR Count | AC Count | Tasks Count |
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:49:| G-02 | LOW | baseline table: 5 metrics all unknown | plan.md M10 Baseline 表 5 项全为 unknown，原因充分（build-plan 阶段无上游 stage-result 采集值）。但 spec.md §附录 A 自检结果条目 5 提及"spec↔decision-log 覆盖率 pass"，说明部分指标在 spec 层面有结论，与 plan baseline 全 unknown 存在信息分层但不矛盾。 | id:G-02, type:coverage_gap, location:plan.md M10 Baseline table, description:5 项均 unknown 为预期（阶段限制），与 spec.md §附录 A 自检条目不矛盾，建议下游 build-code 完成后补录, suggested_action:无需修改当前产物；build-code/verify-code 完成后由 collector 补录实际值 |
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:307: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:308:AssertionError: 契约 item 2: 自检结果 (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:318:    114|   test("SKILL.md includes 自检结果 as contract item 2", () => {
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:319:    115|     assert.ok(skill().includes("自检结果"),
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:321:    116|       "契约 item 2: 自检结果 (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:364: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:365:AssertionError: 契约 item 5: handoff required_reads (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:374:    127|   test("SKILL.md includes handoff required_reads as contract item 5", …
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:376:    129|     assert.ok(c.includes("required_reads") || c.includes("handoff") &&…
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:378:    130|       "契约 item 5: handoff required_reads (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:554: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md declares Spec-Purity grep
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:555:AssertionError: SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:564:    204|   test("SKILL.md declares Spec-Purity grep", () => {
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:566:    206|     assert.ok(c.includes("Spec-Purity") || c.includes("spec-purity"),
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:568:    207|       "SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:573: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:574:AssertionError: Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:583:    209|   test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:587:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:588:    213|       "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)…
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:9:source_artifact: .omc/artifacts/ask/codex-heterologous-third-party-review-m13b-build-spec-deepening-bu-2026-06-30T07-26-44-146Z.md
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:49:- **[NBK-8]** "Single file SKILL.md" framing is partially accurate. `spec.md` impact scope also names `checklists/requirements.md` and `spec-clarify-scan.md` as new artifacts; plan should account for these or explain why this implementation omits them.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:84:source_artifact: .omc/artifacts/ask/codex-codex-heterologous-r2-re-review-m13b-build-spec-deepening-bu-2026-06-30T07-40-08-818Z.md
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:122:source_artifact: .omc/artifacts/ask/codex-heterologous-round-3-re-review-m13b-build-spec-deepening-bui-2026-06-30T07-49-15-068Z.md
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:173:source_artifact: .omc/artifacts/ask/codex-codex-r4-re-review-request-m13b-build-spec-deepening-build-p-2026-06-30T07-59-46-586Z.md
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:264:source_artifact: .omc/artifacts/ask/codex-heterologous-r5-re-review-request-m13b-build-spec-deepening--2026-06-30T08-06-52-777Z.md
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:328:**R5 Verdict: PASS** — All blocking findings resolved. Build-plan artifacts cleared for build-code phase.
tasks/m13b-build-spec-deepening/artifacts/s5-review-framing3.out:1:/Users/Hugh/Hugh/Project/workflowhub/tasks/m13b-build-spec-deepening/.omc/artifacts/ask/antigravity-intake-framing-challenge-workflowhub-m13b-build-spec-workflo-2026-06-30T04-31-58-689Z.md
tasks/m13b-build-spec-deepening/artifacts/s5-review-framing.out:1:/Users/Hugh/Hugh/Project/workflowhub/tasks/m13b-build-spec-deepening/.omc/artifacts/ask/gemini-intake-framing-challenge-workflowhub-m13b-build-spec-workflo-2026-06-30T04-30-13-674Z.md
specs/m13b-build-spec-deepening/constitution-check.md:15:  spec 通过 `--task-dir`（FR-TASKDIR-001）、`TASK_TRACKING_ROOT`（FR-TRACKING-001）、handoff required_reads（质量事实契约第 5 项）三项明确接口与上下游交互，内部实现（7 条自检、三角度审查步骤）不暴露给调用方；模块间接口窄且文件化，符合窄契约定义。
specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/constitution-check.md:65:  spec 是对 build-spec M11 v1 的迭代深化（见 Section 1 问题陈述，列出 7 项 M11 v1 缺失项），handoff required_reads（附录 A 第 5 项）包含 `workflows/build-spec/SKILL.md`（深化目标文件，需与本 spec AC 对照），确保下游执行时能就地检查最新版本；符合 S3 迭代保持最新并就地检查的要求。
tasks/m13b-build-spec-deepening/artifacts/s5-review-direction.out:1:/Users/Hugh/Hugh/Project/workflowhub/tasks/m13b-build-spec-deepening/.omc/artifacts/ask/codex-intake-direction-review-workflowhub-m13b-build-spec-workflow-2026-06-30T04-30-07-992Z.md
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:24: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:40: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md declares Spec-Purity grep
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:41: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:13:- 收敛 major：从「移植机制清单」转向「定义 build-spec 必须产出的质量事实契约（scope边界/自检/异源审查摘要/未解风险/handoff required_reads），机制可替换反选最少」。
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:22: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:23:AssertionError: 契约 item 2: 自检结果 (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:33:    114|   test("SKILL.md includes 自检结果 as contract item 2", () => {
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:34:    115|     assert.ok(skill().includes("自检结果"),
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:36:    116|       "契约 item 2: 自检结果 (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:79: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:80:AssertionError: 契约 item 5: handoff required_reads (FR-CONTRACT-001)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:89:    127|   test("SKILL.md includes handoff required_reads as contract item 5", …
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:91:    129|     assert.ok(c.includes("required_reads") || c.includes("handoff") &&…
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:93:    130|       "契约 item 5: handoff required_reads (FR-CONTRACT-001)");
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:231: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md declares Spec-Purity grep
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:232:AssertionError: SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:241:    204|   test("SKILL.md declares Spec-Purity grep", () => {
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:243:    206|     assert.ok(c.includes("Spec-Purity") || c.includes("spec-purity"),
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:245:    207|       "SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:250: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:251:AssertionError: Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:260:    209|   test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:264:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:265:    213|       "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)…
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:24: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:40: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md declares Spec-Purity grep
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:41: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
tasks/m13b-build-spec-deepening/artifacts/s5-review-framing2.out:1:/Users/Hugh/Hugh/Project/workflowhub/tasks/m13b-build-spec-deepening/.omc/artifacts/ask/gemini-intake-framing-challenge-workflowhub-m13b-build-spec-workflo-2026-06-30T04-31-30-913Z.md

codex
关键落点已找到：`workflows/build-spec/SKILL.md` 的 FR-ARTIFACT-001 现在和 FR-BEHAV-001/002 同一段内使用了同样的 warn + 写入契约第 2 项 + 人工浮现 + 不停止 stage 语义。我再看原 R2 finding，确认没有遗漏的判据。
exec
/bin/bash -lc "nl -ba workflows/build-spec/SKILL.md | sed -n '158,204p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
   158	### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
   159	
   160	完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
   161	
   162	1. **scope 边界**：本次 spec 的 IN/OUT scope 及裁剪机制列表
   163	2. **自检结果**：7 条自检 + Spec-Purity grep 的 pass/warn/unknown 汇总
   164	3. **独立审查摘要**：异源 3rd-review 的 verdict + findings 摘要路径
   165	4. **未解风险**：已知缺口、摩擦记录（`[FRICTION]` 格式，见下节）、scope-triage 高危词命中、spec↔decision-log 差异
   166	5. **handoff required_reads**：下游阶段必读文件清单
   167	
   168	**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
   169	
   170	---
   171	
   172	### 3.9. 交互规范（FR-COMM-001/002）
   173	
   174	build-spec 产出过程中必须遵守以下交互规范：
   175	
   176	**REQ-COMM-01（FR-COMM-001）**：对编排者的所有提问或选项，必须使用大白话说明选项后果，不让编排者猜。格式：列出选项 A/B/C + 每个选项的后果一句话。禁止含糊带过选项差异。
   177	
   178	**REQ-COMM-02（FR-COMM-002）**：每完成主要步骤后，主动汇报进度：做了什么 / 下一步是什么 / 需要编排者做什么。不等对方追问。
   179	
   180	---
   181	
   182	### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
   183	
   184	#### [FRICTION] 摩擦捕获（FR-FRICTION-001）
   185	
   186	发现任何流程卡点时，立即记录 `[FRICTION]` 条目：
   187	
   188	```
   189	[FRICTION] <触发时机简述>: <卡点描述> | 建议: <可选>
   190	```
   191	
   192	条目写入质量事实契约第 4 项（未解风险），不阻断推进。
   193	
   194	#### Artifact-First 只传路径（FR-ARTIFACT-001）
   195	
   196	长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
   197	
   198	#### FR 场景行为验证（FR-BEHAV-001/002）
   199	
   200	- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
   201	- **FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为；meta 场景（描述 build-spec 机制本身的）豁免此要求
   202	
   203	以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
   204	

exec
/bin/bash -lc "rg -n \"FR-ARTIFACT-001|R2|non-blocking|non-blocking note|不 explicit|not explicit|Artifact-First|artifact-first\" specs/m13b-build-spec-deepening/reviews specs/m13b-build-spec-deepening -g '*.md'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:9:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:132:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:319:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:911:+### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:923:+#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:925:+长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1126:   182	### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1138:   194	#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1140:   196	长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1233:    55	When any of these conditions hold, surface a **non-blocking warning** to the user. Do not halt the phase; record the warning in the phase notes. A false-green does not automatically invalidate the phase, but must be acknowledged.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1279:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report-round-1.md:8:Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1287:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.raw.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1303:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1315:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report.md:8:Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1323:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1341:./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/report-round-1.md:13:- [medium] 位置: specs/m12-build-plan-v1/plan.md:187 | 问题: Step 4 says the build-plan stage should add facts.analysis_ref, but FR-BP-003 only defines tasks_ref as the v1 addition while the spec's stage-result entity later also expects analysis_ref. The plan does not explicitly reconcile that analysis_ref is an additional v1 fact beyond FR-BP-003, which can make reviewers treat it as either optional or contract drift. | 建议: State explicitly that facts.analysis_ref is an additional M12 field required by FR-XARTIFACT/FR-DECOUPLE-003 and must be added without replacing the M6 fields or FR-BP-003's tasks_ref.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1347:./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/verdict-round-1.raw.json:15:      "issue": "Step 4 says the build-plan stage should add facts.analysis_ref, but FR-BP-003 only defines tasks_ref as the v1 addition while the spec's stage-result entity later also expects analysis_ref. The plan does not explicitly reconcile that analysis_ref is an additional v1 fact beyond FR-BP-003, which can make reviewers treat it as either optional or contract drift.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1352:./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/verdict-round-1.json:15:      "issue": "Step 4 says the build-plan stage should add facts.analysis_ref, but FR-BP-003 only defines tasks_ref as the v1 addition while the spec's stage-result entity later also expects analysis_ref. The plan does not explicitly reconcile that analysis_ref is an additional v1 fact beyond FR-BP-003, which can make reviewers treat it as either optional or contract drift.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1426:tests/m13b-build-spec-deepening.test.mjs:132:  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1429:tests/m13b-build-spec-deepening.test.mjs:209:  test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1431:tests/m13b-build-spec-deepening.test.mjs:213:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1432:tests/m13b-build-spec-deepening.test.mjs:229:  test("SKILL.md declares review is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1434:tests/m13b-build-spec-deepening.test.mjs:233:      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1435:tests/m13b-build-spec-deepening.test.mjs:243:  test("SKILL.md declares scope-triage is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1437:tests/m13b-build-spec-deepening.test.mjs:247:      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1438:tests/m13b-build-spec-deepening.test.mjs:258:  test("SKILL.md declares consistency check is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1440:tests/m13b-build-spec-deepening.test.mjs:262:      "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1441:workflows/build-code/SKILL.md:55:When any of these conditions hold, surface a **non-blocking warning** to the user. Do not halt the phase; record the warning in the phase notes. A false-green does not automatically invalidate the phase, but must be acknowledged.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1515:specs/m13b-build-spec-deepening/plan.md:251:> 所有 5 项均为 unknown。原因一致：build-plan 阶段处于规划期，上游 make-decision / build-spec 的 stage-result JSON 未记录这 5 项指标的采集值（metrics 采集在 build-code → verify-code 阶段落盘）。阈值判定留待 test-acceptance 阶段人工设定（non-blocking，D12 原则）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1557:specs/m13b-build-spec-deepening/r3-review-prompt.md:159:NON-BLOCKING: <list any non-blocking observations>
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1560:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:48: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1562:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:71: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1563:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:72:   → Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1564:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:75: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1565:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:78: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1566:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:79:   → scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1567:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:82: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1568:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:83:   → Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1569:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:14: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1570:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1571:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:30: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1572:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:32: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1573:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:34: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1575:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1576:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:41: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1577:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:44: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1578:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:46: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1579:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:48: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1585:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:383: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1587:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:393:    132|   test("SKILL.md declares contract items are non-blocking (FR-CONTRACT…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1589:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:573: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1590:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:574:AssertionError: Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1591:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:583:    209|   test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1593:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:588:    213|       "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1594:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:611: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1595:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:612:AssertionError: scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1596:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:621:    243|   test("SKILL.md declares scope-triage is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1597:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:626:    247|       "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1598:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:649: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1599:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:650:AssertionError: Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1600:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:659:    258|   test("SKILL.md declares consistency check is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1601:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:664:    262|       "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1602:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:19: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1603:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:40: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1604:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:41:   → Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1605:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:44: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1606:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:47: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1607:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:48:   → scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1608:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:51: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1609:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:52:   → Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1611:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1612:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:41: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1613:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:44: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1614:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:46: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1615:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:48: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1616:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:250: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1617:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:251:AssertionError: Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1618:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:260:    209|   test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1620:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:265:    213|       "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1621:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:288: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1622:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:289:AssertionError: scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1623:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:298:    243|   test("SKILL.md declares scope-triage is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1624:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:303:    247|       "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1625:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:326: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1626:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:327:AssertionError: Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1627:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:336:    258|   test("SKILL.md declares consistency check is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1628:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:341:    262|       "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1649:specs/m13b-build-spec-deepening/build-plan-3rd-review.md:159:R2's two blocking issues (NEW-BLK-1 T008 list divergence, BLK-4 T014/S6 version gap) are both fully closed. However three new blocking issues are found: a circular dependency between T002 and T005 that makes the task graph unexecutable; a phantom `FR-ACCOUNT-002` entry in the FR Coverage Matrix not backed by any task declaration; and FR-STRUCTURE-001/002 assigned to the wrong task (T007 in matrix vs T004 in tasks). These must be resolved before build-code can proceed safely.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1831:tests/m13b-build-spec-deepening.test.mjs:132:  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1848:tests/m13b-build-spec-deepening.test.mjs:213:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1853:tests/m13b-build-spec-deepening.test.mjs:233:      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1855:tests/m13b-build-spec-deepening.test.mjs:247:      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1859:tests/m13b-build-spec-deepening.test.mjs:262:      "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1860:tests/m13b-build-spec-deepening.test.mjs:273:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1889:workflows/build-spec/SKILL.md:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1891:workflows/build-spec/SKILL.md:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1928:specs/m13b-build-spec-deepening/spec.md:293:### Artifact-First（FR-ARTIFACT）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1929:specs/m13b-build-spec-deepening/spec.md:295:**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2087:  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2164:  test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2168:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2184:  test("SKILL.md declares review is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2188:      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2198:  test("SKILL.md declares scope-triage is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2202:      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2213:  test("SKILL.md declares consistency check is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2217:      "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2223:describe("Phase 3 / AC-09: artifact-first standard", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2224:  test("SKILL.md declares artifact-first / 只传路径 standard", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2227:      c.includes("artifact-first") || c.includes("只传路径") || c.includes("写入文件后只传"),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2228:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2327:specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2389:FR-ARTIFACT-001
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2904:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2906:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2944:348:- [ ] **AC-09**：SKILL.md 含 artifact-first 规范（长报告存文件传路径）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:9:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:132:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:319:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:911:+### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:923:+#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:925:+长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1126:   182	### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1138:   194	#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1140:   196	长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1233:    55	When any of these conditions hold, surface a **non-blocking warning** to the user. Do not halt the phase; record the warning in the phase notes. A false-green does not automatically invalidate the phase, but must be acknowledged.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1279:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report-round-1.md:8:Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1287:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.raw.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1303:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1315:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report.md:8:Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1323:./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1341:./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/report-round-1.md:13:- [medium] 位置: specs/m12-build-plan-v1/plan.md:187 | 问题: Step 4 says the build-plan stage should add facts.analysis_ref, but FR-BP-003 only defines tasks_ref as the v1 addition while the spec's stage-result entity later also expects analysis_ref. The plan does not explicitly reconcile that analysis_ref is an additional v1 fact beyond FR-BP-003, which can make reviewers treat it as either optional or contract drift. | 建议: State explicitly that facts.analysis_ref is an additional M12 field required by FR-XARTIFACT/FR-DECOUPLE-003 and must be added without replacing the M6 fields or FR-BP-003's tasks_ref.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1347:./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/verdict-round-1.raw.json:15:      "issue": "Step 4 says the build-plan stage should add facts.analysis_ref, but FR-BP-003 only defines tasks_ref as the v1 addition while the spec's stage-result entity later also expects analysis_ref. The plan does not explicitly reconcile that analysis_ref is an additional v1 fact beyond FR-BP-003, which can make reviewers treat it as either optional or contract drift.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1352:./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/verdict-round-1.json:15:      "issue": "Step 4 says the build-plan stage should add facts.analysis_ref, but FR-BP-003 only defines tasks_ref as the v1 addition while the spec's stage-result entity later also expects analysis_ref. The plan does not explicitly reconcile that analysis_ref is an additional v1 fact beyond FR-BP-003, which can make reviewers treat it as either optional or contract drift.",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1426:tests/m13b-build-spec-deepening.test.mjs:132:  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1429:tests/m13b-build-spec-deepening.test.mjs:209:  test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1431:tests/m13b-build-spec-deepening.test.mjs:213:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1432:tests/m13b-build-spec-deepening.test.mjs:229:  test("SKILL.md declares review is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1434:tests/m13b-build-spec-deepening.test.mjs:233:      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1435:tests/m13b-build-spec-deepening.test.mjs:243:  test("SKILL.md declares scope-triage is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1437:tests/m13b-build-spec-deepening.test.mjs:247:      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1438:tests/m13b-build-spec-deepening.test.mjs:258:  test("SKILL.md declares consistency check is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1440:tests/m13b-build-spec-deepening.test.mjs:262:      "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1441:workflows/build-code/SKILL.md:55:When any of these conditions hold, surface a **non-blocking warning** to the user. Do not halt the phase; record the warning in the phase notes. A false-green does not automatically invalidate the phase, but must be acknowledged.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1515:specs/m13b-build-spec-deepening/plan.md:251:> 所有 5 项均为 unknown。原因一致：build-plan 阶段处于规划期，上游 make-decision / build-spec 的 stage-result JSON 未记录这 5 项指标的采集值（metrics 采集在 build-code → verify-code 阶段落盘）。阈值判定留待 test-acceptance 阶段人工设定（non-blocking，D12 原则）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1557:specs/m13b-build-spec-deepening/r3-review-prompt.md:159:NON-BLOCKING: <list any non-blocking observations>
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1560:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:48: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1562:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:71: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1563:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:72:   → Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1564:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:75: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1565:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:78: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1566:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:79:   → scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1567:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:82: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1568:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:83:   → Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1569:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:14: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1570:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1571:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:30: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1572:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:32: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1573:specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:34: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1575:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1576:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:41: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1577:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:44: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1578:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:46: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1579:specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:48: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1585:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:383: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1587:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:393:    132|   test("SKILL.md declares contract items are non-blocking (FR-CONTRACT…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1589:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:573: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1590:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:574:AssertionError: Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1591:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:583:    209|   test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1593:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:588:    213|       "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1594:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:611: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1595:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:612:AssertionError: scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1596:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:621:    243|   test("SKILL.md declares scope-triage is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1597:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:626:    247|       "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1598:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:649: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1599:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:650:AssertionError: Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1600:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:659:    258|   test("SKILL.md declares consistency check is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1601:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:664:    262|       "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1602:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:19: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1603:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:40: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1604:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:41:   → Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1605:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:44: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1606:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:47: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1607:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:48:   → scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1608:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:51: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1609:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:52:   → Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1611:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1612:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:41: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1613:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:44: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1614:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:46: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1615:specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:48: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1616:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:250: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1617:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:251:AssertionError: Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1618:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:260:    209|   test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1620:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:265:    213|       "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1621:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:288: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1622:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:289:AssertionError: scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1623:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:298:    243|   test("SKILL.md declares scope-triage is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1624:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:303:    247|       "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1625:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:326: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1626:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:327:AssertionError: Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1627:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:336:    258|   test("SKILL.md declares consistency check is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1628:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:341:    262|       "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1649:specs/m13b-build-spec-deepening/build-plan-3rd-review.md:159:R2's two blocking issues (NEW-BLK-1 T008 list divergence, BLK-4 T014/S6 version gap) are both fully closed. However three new blocking issues are found: a circular dependency between T002 and T005 that makes the task graph unexecutable; a phantom `FR-ACCOUNT-002` entry in the FR Coverage Matrix not backed by any task declaration; and FR-STRUCTURE-001/002 assigned to the wrong task (T007 in matrix vs T004 in tasks). These must be resolved before build-code can proceed safely.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1831:tests/m13b-build-spec-deepening.test.mjs:132:  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1848:tests/m13b-build-spec-deepening.test.mjs:213:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1853:tests/m13b-build-spec-deepening.test.mjs:233:      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1855:tests/m13b-build-spec-deepening.test.mjs:247:      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1859:tests/m13b-build-spec-deepening.test.mjs:262:      "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1860:tests/m13b-build-spec-deepening.test.mjs:273:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1889:workflows/build-spec/SKILL.md:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1891:workflows/build-spec/SKILL.md:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1928:specs/m13b-build-spec-deepening/spec.md:293:### Artifact-First（FR-ARTIFACT）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1929:specs/m13b-build-spec-deepening/spec.md:295:**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2087:  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2164:  test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2168:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2184:  test("SKILL.md declares review is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2188:      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2198:  test("SKILL.md declares scope-triage is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2202:      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2213:  test("SKILL.md declares consistency check is non-blocking", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2217:      "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2223:describe("Phase 3 / AC-09: artifact-first standard", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2224:  test("SKILL.md declares artifact-first / 只传路径 standard", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2227:      c.includes("artifact-first") || c.includes("只传路径") || c.includes("写入文件后只传"),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2228:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2327:specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2389:FR-ARTIFACT-001
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2904:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2906:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2944:348:- [ ] **AC-09**：SKILL.md 含 artifact-first 规范（长报告存文件传路径）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:9:3rd-review R3 for m13b-build-spec-deepening Phase 1+2. R2 finding was: Section 6/7 still had residual pruning language ('F10 gate has already pruned the spec', 'F10 门裁剪后的最终 spec', 're-prune') creating execution ambiguity vs FR-LADDER-002 non-blocking. All residual pruning language now removed: Section 6 step description changed to 'records F10 findings (non-blocking), human confirms spec as-is; no automatic changes made before human sees it'; Section 7 human checkpoint changed to 'F10 analysis findings recorded (non-blocking)' and removed 're-prune' instruction; HUMAN_REVIEW_CHECKPOINT text updated to 'F10 反过度工程分析已完成，findings 已记录'. grep confirms zero occurrences of pruned/pruning/裁剪后/re-prune. All 55 tests still pass. Please verify B1 is now fully closed (zero blocking F10 auto-remove semantics anywhere in Section 6/7) and output final verdict: pass | revise_required.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:13:3rd-review R3 for m13b-build-spec-deepening Phase 1+2. R2 finding was: Section 6/7 still had residual pruning language ('F10 gate has already pruned the spec', 'F10 门裁剪后的最终 spec', 're-prune') creating execution ambiguity vs FR-LADDER-002 non-blocking. All residual pruning language now removed: Section 6 step description changed to 'records F10 findings (non-blocking), human confirms spec as-is; no automatic changes made before human sees it'; Section 7 human checkpoint changed to 'F10 analysis findings recorded (non-blocking)' and removed 're-prune' instruction; HUMAN_REVIEW_CHECKPOINT text updated to 'F10 反过度工程分析已完成，findings 已记录'. grep confirms zero occurrences of pruned/pruning/裁剪后/re-prune. All 55 tests still pass. Please verify B1 is now fully closed (zero blocking F10 auto-remove semantics anywhere in Section 6/7) and output final verdict: pass | revise_required.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:24:- Section 6 now says F10 only records findings and is non-blocking: [line 265](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:265)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:66:3rd-review R3 for m13b-build-spec-deepening Phase 1+2. R2 finding was: Section 6/7 still had residual pruning language ('F10 gate has already pruned the spec', 'F10 门裁剪后的最终 spec', 're-prune') creating execution ambiguity vs FR-LADDER-002 non-blocking. All residual pruning language now removed: Section 6 step description changed to 'records F10 findings (non-blocking), human confirms spec as-is; no automatic changes made before human sees it'; Section 7 human checkpoint changed to 'F10 analysis findings recorded (non-blocking)' and removed 're-prune' instruction; HUMAN_REVIEW_CHECKPOINT text updated to 'F10 反过度工程分析已完成，findings 已记录'. grep confirms zero occurrences of pruned/pruning/裁剪后/re-prune. All 55 tests still pass. Please verify B1 is now fully closed (zero blocking F10 auto-remove semantics anywhere in Section 6/7) and output final verdict: pass | revise_required.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:103:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:153:- artifact-first：长报告只存路径，交互传路径不传全文
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:393:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:9:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:395:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:132:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:401:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:319:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:589:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:592:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:606:265:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:607:267:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:800:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:812:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:814:长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:883:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:885:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:967:workflows/build-spec/SKILL.md:265:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:968:workflows/build-spec/SKILL.md:267:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1071:265:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1072:267:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1085:   265	This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1087:   267	Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1131:- Section 6 now says F10 only records findings and is non-blocking: [line 265](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:265)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:9:3rd-review R3 for m13b-build-spec-deepening Phase 1+2. R2 finding was: Section 6/7 still had residual pruning language ('F10 gate has already pruned the spec', 'F10 门裁剪后的最终 spec', 're-prune') creating execution ambiguity vs FR-LADDER-002 non-blocking. All residual pruning language now removed: Section 6 step description changed to 'records F10 findings (non-blocking), human confirms spec as-is; no automatic changes made before human sees it'; Section 7 human checkpoint changed to 'F10 analysis findings recorded (non-blocking)' and removed 're-prune' instruction; HUMAN_REVIEW_CHECKPOINT text updated to 'F10 反过度工程分析已完成，findings 已记录'. grep confirms zero occurrences of pruned/pruning/裁剪后/re-prune. All 55 tests still pass. Please verify B1 is now fully closed (zero blocking F10 auto-remove semantics anywhere in Section 6/7) and output final verdict: pass | revise_required.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:13:3rd-review R3 for m13b-build-spec-deepening Phase 1+2. R2 finding was: Section 6/7 still had residual pruning language ('F10 gate has already pruned the spec', 'F10 门裁剪后的最终 spec', 're-prune') creating execution ambiguity vs FR-LADDER-002 non-blocking. All residual pruning language now removed: Section 6 step description changed to 'records F10 findings (non-blocking), human confirms spec as-is; no automatic changes made before human sees it'; Section 7 human checkpoint changed to 'F10 analysis findings recorded (non-blocking)' and removed 're-prune' instruction; HUMAN_REVIEW_CHECKPOINT text updated to 'F10 反过度工程分析已完成，findings 已记录'. grep confirms zero occurrences of pruned/pruning/裁剪后/re-prune. All 55 tests still pass. Please verify B1 is now fully closed (zero blocking F10 auto-remove semantics anywhere in Section 6/7) and output final verdict: pass | revise_required.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:24:- Section 6 now says F10 only records findings and is non-blocking: [line 265](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:265)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:66:3rd-review R3 for m13b-build-spec-deepening Phase 1+2. R2 finding was: Section 6/7 still had residual pruning language ('F10 gate has already pruned the spec', 'F10 门裁剪后的最终 spec', 're-prune') creating execution ambiguity vs FR-LADDER-002 non-blocking. All residual pruning language now removed: Section 6 step description changed to 'records F10 findings (non-blocking), human confirms spec as-is; no automatic changes made before human sees it'; Section 7 human checkpoint changed to 'F10 analysis findings recorded (non-blocking)' and removed 're-prune' instruction; HUMAN_REVIEW_CHECKPOINT text updated to 'F10 反过度工程分析已完成，findings 已记录'. grep confirms zero occurrences of pruned/pruning/裁剪后/re-prune. All 55 tests still pass. Please verify B1 is now fully closed (zero blocking F10 auto-remove semantics anywhere in Section 6/7) and output final verdict: pass | revise_required.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:103:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:153:- artifact-first：长报告只存路径，交互传路径不传全文
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:393:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:9:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:395:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:132:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:401:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:319:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:589:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:592:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:606:265:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:607:267:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:800:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:812:#### Artifact-First 只传路径（FR-ARTIFACT-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:814:长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:883:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:885:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:967:workflows/build-spec/SKILL.md:265:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:968:workflows/build-spec/SKILL.md:267:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1071:265:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1072:267:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1085:   265	This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1087:   267	Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:1131:- Section 6 now says F10 only records findings and is non-blocking: [line 265](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:265)
specs/m13b-build-spec-deepening/r3-review-prompt.md:73:| FR-ARTIFACT-001    | 3.1 | T013 |
specs/m13b-build-spec-deepening/r3-review-prompt.md:102:- T013 [P] FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
specs/m13b-build-spec-deepening/r3-review-prompt.md:159:NON-BLOCKING: <list any non-blocking observations>
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:28:| I-01 | LOW | spec.md FR 列表 vs plan.md Verification Mapping | spec.md 附录 C（决策落点覆盖）提及 FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 为"新增 FR"（5 项），但 spec.md 正文 §4 功能需求小节标题顺序与 plan.md Verification Mapping 中的 Step 排序存在轻微不一致——spec §4 按域分组（FR-BUILD → FR-CONTRACT → FR-LADDER → … → FR-COMM），plan 按实施阶段分组（Phase 1 = 基础节先行）。两者都正确，仅顺序视角不同。 | id:I-01, type:inconsistency, location:spec.md §4 vs plan.md Implementation Steps, description:FR 分组视角不同（按域 vs 按实施依赖），suggested_action:无需修改，两种分组均合理且互补 |
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:29:| I-02 | LOW | tasks.md Task ID 引用 vs plan.md FR Coverage Matrix | plan.md §Step 9 FR 覆盖矩阵列出任务编号 T001–T015，但 tasks.md 实际只有 T001–T014（14 条任务）。plan.md 矩阵中 T015 对应 FR-BEHAV-001/002, FR-FRICTION-001, FR-ARTIFACT-001，这些在 tasks.md 中合并到 T013 覆盖。 | id:I-02, type:inconsistency, location:plan.md §Step9 FR Coverage Matrix row T015 vs tasks.md, description:plan.md 矩阵引用 T015 但 tasks.md 无此编号（已并入 T013）, suggested_action:plan.md FR Coverage Matrix 中 T015 改为 T013 |
specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/spec.md:77:- artifact-first：长报告只存路径，交互传路径不传全文
specs/m13b-build-spec-deepening/spec.md:293:### Artifact-First（FR-ARTIFACT）
specs/m13b-build-spec-deepening/spec.md:295:**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。
specs/m13b-build-spec-deepening/spec.md:348:- [ ] **AC-09**：SKILL.md 含 artifact-first 规范（长报告存文件传路径）。
specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/tasks.md:49:**Purpose**: 写入辅助规范（交互规范、摩擦捕获、artifact-first、行为验证要求），然后整体验收（grep AC 核查）。依赖 Stage 2 所有节就位。
specs/m13b-build-spec-deepening/tasks.md:53:- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
specs/m13b-build-spec-deepening/r5-review-prompt.md:72:**Purpose**: 写入辅助规范（交互规范、摩擦捕获、artifact-first、行为验证要求），然后整体验收（grep AC 核查）。依赖 Stage 2 所有节就位。
specs/m13b-build-spec-deepening/r5-review-prompt.md:76:- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
specs/m13b-build-spec-deepening/r5-review-prompt.md:121:| FR-ARTIFACT-001 | Step 3.2 | T013 |
specs/m13b-build-spec-deepening/r5-review-prompt.md:144:The spec.md declares these 24 FRs: FR-BUILD-001, FR-CONTRACT-001, FR-CONTRACT-002, FR-LADDER-001, FR-LADDER-002, FR-STRUCTURE-001, FR-STRUCTURE-002, FR-SELFCHECK-001, FR-SELFCHECK-002, FR-REVIEW-001, FR-REVIEW-002, FR-BEHAV-001, FR-BEHAV-002, FR-FRICTION-001, FR-TASKDIR-001, FR-TRACKING-001, FR-TRACKING-002, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001, FR-COMM-001, FR-COMM-002, FR-SCOPETRIAGE-001, FR-ALIGN-001.
specs/m13b-build-spec-deepening/spec-clarify-scan.md:120:| R2 | 角色 | 编排者/执行代理 | spec 场景定义 |
specs/m13b-build-spec-deepening/checklists/requirements.md:48:| D8 FR编号 + AC计数 + artifact-first + REQ-COMM | [x] | FR-NUMBERING, FR-ACCOUNT, FR-ARTIFACT, FR-COMM |
specs/m13b-build-spec-deepening/constitution-check.md:71:  FR-ARTIFACT-001（artifact-first）明确规定"长报告只存路径，禁止在交互消息或 stage-result 中内联完整报告文本（超过 500 字即视为长报告）"；FR-COMM-002 要求勤报进度用路径而非全文；这两条直接减少主上下文占用，便于子代理独立调用技能，符合 S5。
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:106:### R2 Overall Rationale
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:125:### R2 Blocking Findings Closure Status
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:159:R2's two blocking issues (NEW-BLK-1 T008 list divergence, BLK-4 T014/S6 version gap) are both fully closed. However three new blocking issues are found: a circular dependency between T002 and T005 that makes the task graph unexecutable; a phantom `FR-ACCOUNT-002` entry in the FR Coverage Matrix not backed by any task declaration; and FR-STRUCTURE-001/002 assigned to the wrong task (T007 in matrix vs T004 in tasks). These must be resolved before build-code can proceed safely.
specs/m13b-build-spec-deepening/plan.md:120:**Purpose**: 写入交互规范、摩擦捕获、artifact-first、行为验证要求等辅助 FR；验证 AC 覆盖和 scope boundary。依赖 Phase 2 的核心节。
specs/m13b-build-spec-deepening/plan.md:127:**Step 3.2**: 在 SKILL.md 新增「摩擦捕获 + Artifact-First + 行为验证要求」节
specs/m13b-build-spec-deepening/plan.md:129:- 内容：[FRICTION] 条目格式（FR-FRICTION-001）；长报告存文件传路径规范（FR-ARTIFACT-001）；FR 场景格式要求（FR-BEHAV-001/002）
specs/m13b-build-spec-deepening/plan.md:130:- FR 覆盖：FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002
specs/m13b-build-spec-deepening/plan.md:154:| Step 3.2 | FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 | AC-09, AC-15 |
specs/m13b-build-spec-deepening/plan.md:217:- [x] **Q3 人可见可干预** — 判据：所有 warn/偏差/gap 均浮现到质量事实契约供人判断；FR-ARTIFACT-001 要求长报告存文件传路径，人可读取。符合 Q3。
specs/m13b-build-spec-deepening/plan.md:251:> 所有 5 项均为 unknown。原因一致：build-plan 阶段处于规划期，上游 make-decision / build-spec 的 stage-result JSON 未记录这 5 项指标的采集值（metrics 采集在 build-code → verify-code 阶段落盘）。阈值判定留待 test-acceptance 阶段人工设定（non-blocking，D12 原则）。
specs/m13b-build-spec-deepening/plan.md:366:| FR-ARTIFACT-001 | Step 3.2 | T013 |

exec
/bin/bash -lc "nl -ba tests/m13b-build-spec-deepening.test.mjs | sed -n '260,282p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
   260	    assert.ok(
   261	      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
   262	      "Consistency check must be non-blocking (FR-ALIGN-001)");
   263	  });
   264	});
   265	
   266	// ─── Phase 3: Auxiliary & Verification ──────────────────────────────────────
   267	
   268	describe("Phase 3 / AC-09: artifact-first standard", () => {
   269	  test("SKILL.md declares artifact-first / 只传路径 standard", () => {
   270	    const c = skill();
   271	    assert.ok(
   272	      c.includes("artifact-first") || c.includes("只传路径") || c.includes("写入文件后只传"),
   273	      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
   274	  });
   275	});
   276	
   277	describe("Phase 3 / AC-10: REQ-COMM-01/02 communication rules", () => {
   278	  test("SKILL.md declares REQ-COMM-01 or 大白话 rule", () => {
   279	    const c = skill();
   280	    assert.ok(
   281	      c.includes("REQ-COMM-01") || c.includes("FR-COMM-001") || (c.includes("大白话") && c.includes("选项")),
   282	      "SKILL.md must declare REQ-COMM-01 plain language rule (FR-COMM-001)");

codex
从原 R1/R2 截图可见，旧问题是 FR-ARTIFACT-001 只写了“只传路径”，没有把违规后的非阻断处理写清楚。当前正文已经补齐这个处理链。为了不只看文本，我跑一次对应测试文件确认当前状态。
exec
/bin/bash -lc 'cat package.json' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
{
  "name": "workflowhub",
  "version": "0.0.0",
  "private": true,
  "description": "AI 开发工作流编排工具，按设计宪法构建",
  "scripts": {
    "check": "markdownlint-cli2 \"**/*.md\" && node scripts/verify-structure.mjs && node scripts/run-checks.mjs",
    "test": "vitest run"
  },
  "dependencies": {
    "js-yaml": "4.1.0"
  },
  "devDependencies": {
    "markdownlint-cli2": "0.14.0",
    "vitest": "2.1.9"
  }
}

exec
/bin/bash -lc "rg -n \"scripts|vitest|m13b-build-spec-deepening\" package.json tests specs/m13b-build-spec-deepening/evidence -g '*.json' -g '*.mjs'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
package.json:6:  "scripts": {
package.json:7:    "check": "markdownlint-cli2 \"**/*.md\" && node scripts/verify-structure.mjs && node scripts/run-checks.mjs",
package.json:8:    "test": "vitest run"
package.json:15:    "vitest": "2.1.9"
specs/m13b-build-spec-deepening/evidence/phase-1-GREEN.json:2:  "command": "npm test -- tests/m13b-build-spec-deepening.test.mjs --reporter=verbose -t 'Phase 1'",
specs/m13b-build-spec-deepening/evidence/phase-1-GREEN.json:9:  "stdout_path": "specs/m13b-build-spec-deepening/evidence/phase-1-GREEN.json.stdout",
specs/m13b-build-spec-deepening/evidence/phase-1-GREEN.json:10:  "stderr_path": "specs/m13b-build-spec-deepening/evidence/phase-1-GREEN.json.stderr",
tests/m12-spec-analyze.test.mjs:3:import { test, describe } from "vitest";
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json:2:  "command": "npm test -- tests/m13b-build-spec-deepening.test.mjs --reporter=verbose",
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json:9:  "stdout_path": "specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout",
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json:10:  "stderr_path": "specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stderr",
tests/verify-code-freshness.test.mjs:1:import { describe, it, expect } from 'vitest';
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json:2:  "command": "npm test -- tests/m13b-build-spec-deepening.test.mjs --reporter=verbose",
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json:9:  "stdout_path": "specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout",
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json:10:  "stderr_path": "specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr",
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json:2:  "command": "npm test -- tests/m13b-build-spec-deepening.test.mjs --reporter=verbose",
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json:9:  "stdout_path": "specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout",
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json:10:  "stderr_path": "specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stderr",
tests/m12-build-plan-v1.test.mjs:3:// Uses vitest + node:assert. Mirrors five-skills-present.test.mjs pattern.
tests/m12-build-plan-v1.test.mjs:5:import { test, describe } from "vitest";
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json:2:  "command": "npm test -- tests/m13b-build-spec-deepening.test.mjs --reporter=verbose -t 'Phase 2'",
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json:9:  "stdout_path": "specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout",
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json:10:  "stderr_path": "specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr",
tests/stage-result-contract.test.mjs:8:import { describe, it, expect } from "vitest";
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json:2:  "command": "npm test -- tests/m13b-build-spec-deepening.test.mjs --reporter=verbose -t 'Phase 2'",
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json:9:  "stdout_path": "specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout",
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json:10:  "stderr_path": "specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stderr",
tests/build-code-diff-only.test.mjs:1:import { describe, it, expect } from 'vitest';
tests/build-code-diff-only.test.mjs:21:    const diffText = `diff --git a/scripts/deploy.mjs b/scripts/deploy.mjs
tests/build-code-diff-only.test.mjs:22:--- a/scripts/deploy.mjs
tests/build-code-diff-only.test.mjs:23:+++ b/scripts/deploy.mjs
tests/build-code-diff-only.test.mjs:104:    const diffText = `diff --git a/scripts/cleanup.mjs b/scripts/cleanup.mjs
tests/build-code-diff-only.test.mjs:105:--- a/scripts/cleanup.mjs
tests/build-code-diff-only.test.mjs:106:+++ b/scripts/cleanup.mjs
tests/build-code-diff-only.test.mjs:116:    const diffText = `diff --git a/scripts/release.mjs b/scripts/release.mjs
tests/build-code-diff-only.test.mjs:117:--- a/scripts/release.mjs
tests/build-code-diff-only.test.mjs:118:+++ b/scripts/release.mjs
tests/build-code-diff-only.test.mjs:128:    const diffText = `diff --git a/scripts/reset.mjs b/scripts/reset.mjs
tests/build-code-diff-only.test.mjs:129:--- a/scripts/reset.mjs
tests/build-code-diff-only.test.mjs:130:+++ b/scripts/reset.mjs
tests/build-code-diff-only.test.mjs:180:    const diffText = `diff --git a/scripts/deploy-prod.sh b/scripts/deploy-prod.sh
tests/build-code-diff-only.test.mjs:181:--- a/scripts/deploy-prod.sh
tests/build-code-diff-only.test.mjs:182:+++ b/scripts/deploy-prod.sh
tests/build-code-diff-only.test.mjs:317:    const diffText = `diff --git a/scripts/release.mjs b/scripts/release.mjs
tests/build-code-diff-only.test.mjs:318:--- a/scripts/release.mjs
tests/build-code-diff-only.test.mjs:319:+++ b/scripts/release.mjs
tests/build-code-diff-only.test.mjs:332:    const diffText = `diff --git a/scripts/old-deploy.mjs b/scripts/old-deploy.mjs
tests/build-code-diff-only.test.mjs:333:--- a/scripts/old-deploy.mjs
tests/build-code-diff-only.test.mjs:334:+++ b/scripts/old-deploy.mjs
tests/contract-freeze.test.mjs:17:import { describe, it, expect } from "vitest";
tests/verify-code-capture.test.mjs:1:import { describe, it, expect, beforeAll, afterAll } from 'vitest';
tests/verify-code-capture.test.mjs:76:  it('test_files_line should extract the Test Files line from vitest stdout', async () => {
tests/m12-subskill-exclusion.test.mjs:16:import { describe, it, expect, beforeEach, afterEach } from "vitest";
tests/m12-subskill-exclusion.test.mjs:37:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/m12-subskill-exclusion.test.mjs:68:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/build-code-facts.test.mjs:1:import { describe, it, expect } from 'vitest';
tests/build-code-facts.test.mjs:43:    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true, command: 'npx vitest run' }, review: completeReview };
tests/spike-intake-design.test.mjs:9:import { describe, it, expect, beforeAll } from "vitest";
tests/m12-spec-plan.test.mjs:3:import { test, describe } from "vitest";
tests/verify-code-facts.test.mjs:1:import { describe, it, expect, beforeAll, afterAll } from 'vitest';
tests/verify-code-facts.test.mjs:13:    expect(readCommand({ facts: { tests: { command: 'npx vitest run' } } })).toBe('npx vitest run');
tests/stage-quality.test.mjs:9:import { describe, it, expect, beforeEach, afterEach } from "vitest";
tests/stage-quality.test.mjs:16:import { scanFiles } from "../scripts/check-stage-quality.mjs";
tests/stage-quality.test.mjs:20:const scriptPath = join(repoRoot, "scripts", "check-stage-quality.mjs");
tests/build-code-review.test.mjs:1:import { describe, it, expect } from 'vitest';
tests/m13b-build-spec-deepening.test.mjs:2: * m13b-build-spec-deepening.test.mjs
tests/m13b-build-spec-deepening.test.mjs:6:import { test, describe } from "vitest";
tests/m13b-build-spec-deepening.test.mjs:13:const COUNT_PATH = join(REPO_ROOT, "specs", "m13b-build-spec-deepening", "spec-acceptance-count.json");
tests/m13b-build-spec-deepening.test.mjs:318:      "specs/m13b-build-spec-deepening/spec-acceptance-count.json must exist (FR-ACCOUNT-001 AC-17)");
tests/baseline.test.mjs:11:import { describe, it, expect } from "vitest";
tests/build-code-target.test.mjs:1:import { describe, it, expect } from "vitest";
tests/m12-spec-tasks.test.mjs:2:// Uses vitest + node:assert (compatible with vitest).
tests/m12-spec-tasks.test.mjs:3:import { test, describe } from "vitest";
tests/agenthub-baseline.test.mjs:4: * Tests scripts/agenthub-baseline.mjs which computes 5 baseline process metrics
tests/agenthub-baseline.test.mjs:8:import { describe, it, expect } from "vitest";
tests/agenthub-baseline.test.mjs:15:const SCRIPT = join(__dirname, "..", "scripts", "agenthub-baseline.mjs");
tests/boundary-confirm.test.mjs:9:import { describe, it, expect, beforeEach, afterEach } from "vitest";
tests/m12-reuse-registry.test.mjs:2:// Uses vitest + node:assert (compatible with vitest).
tests/m12-reuse-registry.test.mjs:3:import { test, describe } from "vitest";
tests/smoke.test.mjs:1:import { describe, it, expect } from "vitest";
tests/smoke.test.mjs:3:// Smoke test: confirms the vitest runner is wired up so later phases' RED/GREEN
tests/metrics-smoke.test.mjs:1:import { describe, it, expect } from "vitest";
tests/execution-record.test.mjs:11:import { describe, it, expect } from "vitest";
tests/metrics-collector.test.mjs:14:import { describe, it, expect, beforeEach, afterEach } from "vitest";
tests/build-code-capture.test.mjs:1:import { describe, it } from "vitest";
tests/fact-collector.test.mjs:11:import { describe, it, expect, beforeEach, afterEach } from "vitest";
tests/reuse-registry.test.mjs:2:import { test, describe } from "vitest";
tests/knowledge-card.test.mjs:14:import { describe, it, expect } from "vitest";
tests/facts-subschema.test.mjs:12:import { describe, it, expect } from "vitest";
tests/facts-subschema.test.mjs:13:import { validateStageResult } from "../scripts/validate-stage-result.mjs";
tests/five-skills-present.test.mjs:2:// Uses vitest + node:assert (node:assert is compatible with vitest).
tests/five-skills-present.test.mjs:3:import { test, describe } from "vitest";
tests/m12-templates.test.mjs:3:import { test, describe } from "vitest";
tests/metric-scan.test.mjs:16:import { describe, it, expect, beforeEach, afterEach } from "vitest";
tests/metric-scan.test.mjs:25:const scriptPath = join(repoRoot, "scripts", "check-stage-quality.mjs");
tests/metric-scan.test.mjs:129:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/metric-scan.test.mjs:140:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/metric-scan.test.mjs:156:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/metric-scan.test.mjs:179:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/metric-scan.test.mjs:199:      const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/metric-scan.test.mjs:222:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/metric-scan.test.mjs:261:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/metric-scan.test.mjs:268:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/metric-scan.test.mjs:275:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/metric-scan.test.mjs:301:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/metric-scan.test.mjs:331:    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
tests/m13-make-decision.test.mjs:3:// Uses vitest + node:assert. Mirrors m12-build-plan-v1.test.mjs pattern.
tests/m13-make-decision.test.mjs:4:import { test, describe } from "vitest";

codex
我会跑 `m13b` 这一个测试文件；这属于窄验证，不跑全仓检查。
exec
/bin/bash -lc 'npm test -- tests/m13b-build-spec-deepening.test.mjs --reporter=verbose' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 430ms:

 RUN  v2.1.9 /Users/Hugh/Hugh/Project/workflowhub

 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-06: TASK_TRACKING_ROOT env var declared > SKILL.md contains TASK_TRACKING_ROOT
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-06: TASK_TRACKING_ROOT env var declared > SKILL.md declares default path ~/Knowledge/workflowhub/
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-06: TASK_TRACKING_ROOT env var declared > SKILL.md states warn-not-stop behaviour for missing TASK_TRACKING_ROOT
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-13: --task-dir parameter convention > SKILL.md declares --task-dir parameter
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-13: --task-dir parameter convention > SKILL.md states fallback behaviour for missing --task-dir
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-20: three-layer spec structure > SKILL.md declares 速读卡 (layer 1)
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-20: three-layer spec structure > SKILL.md declares 附录 (layer 3)
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-20: three-layer spec structure > SKILL.md declares 正文 (layer 2)
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-14: Known Gaps section requirement > SKILL.md requires Known Gaps section in spec output
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-07: FR-{DOMAIN}-NNN numbering format > SKILL.md declares FR-{DOMAIN}-NNN format
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-08: spec-acceptance-count.json production > SKILL.md declares spec-acceptance-count.json output step
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-08: spec-acceptance-count.json production > SKILL.md declares ac_count field
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-08: spec-acceptance-count.json production > SKILL.md declares fr_count field
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-08: spec-acceptance-count.json production > SKILL.md declares counted_at field
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares 质量事实契约 section
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes scope 边界 as contract item 1
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 自检结果 as contract item 2
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 独立审查摘要 as contract item 3
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes 未解风险 as contract item 4
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md includes handoff required_reads as contract item 5
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md declares spec-ladder
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md defines A 档
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md defines B 档
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md defines C 档
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-19: spec pipeline steps > SKILL.md mentions spec-specify as pipeline step
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-19: spec pipeline steps > SKILL.md mentions spec-clarify as pipeline step
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-19: spec pipeline steps > SKILL.md declares spec pipeline order (spec-specify → spec-clarify → ...)
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-03: 7 self-check items > SKILL.md declares 7 self-check (7 条自检)
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-03: 7 self-check items > SKILL.md includes self-check item for FR numbering format
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-03: 7 self-check items > SKILL.md includes self-check item for Given/When/Then scenes
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md declares Spec-Purity grep
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares 3rd-review or 异源独立审查
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md prohibits self-review (FR-REVIEW-002)
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage high-risk word surfacing
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares decision-log consistency check
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-09: artifact-first standard > SKILL.md declares artifact-first / 只传路径 standard
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-10: REQ-COMM-01/02 communication rules > SKILL.md declares REQ-COMM-01 or 大白话 rule
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-10: REQ-COMM-01/02 communication rules > SKILL.md declares REQ-COMM-02 or 进度报告 rule
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-15: [FRICTION] capture format > SKILL.md declares [FRICTION] entry format
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use gate.sh as an active execution call
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use post_review_pass as an active gate
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use [DECOMP] telemetry emission
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-17: spec-acceptance-count.json file validity > spec-acceptance-count.json exists
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-17: spec-acceptance-count.json file validity > spec-acceptance-count.json has non-null ac_count
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-17: spec-acceptance-count.json file validity > spec-acceptance-count.json has non-null fr_count
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-17: spec-acceptance-count.json file validity > spec-acceptance-count.json has non-null counted_at ISO8601
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-18: all FR numbers use FR-[A-Z]+-[0-9]{3} format > build-spec SKILL.md version field exists in frontmatter
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-22: TASK_TRACKING_ROOT used, no hardcoded tracking absolute paths > SKILL.md references TASK_TRACKING_ROOT for tracking file paths
 ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-22: TASK_TRACKING_ROOT used, no hardcoded tracking absolute paths > SKILL.md does not use ~/Knowledge/ as a hardcoded write path (only allowed as default-value declaration)

 Test Files  1 passed (1)
      Tests  55 passed (55)
   Start at  16:52:07
   Duration  161ms (transform 14ms, setup 0ms, collect 12ms, tests 5ms, environment 0ms, prepare 39ms)


codex
最终结论：**pass**

已核对 [workflows/build-spec/SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:196)：

- FR-ARTIFACT-001 现在明确写出：违规时记录为 `warn`
- 明确写入质量事实契约第 2 项：`自检结果`
- 明确浮现给人工
- 明确“不自动停止 stage（非阻断）”
- 语义与 [FR-BEHAV-001/002](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:203) 的处理模式一致

也核对了质量事实契约定义：[workflows/build-spec/SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:160) 到 [workflows/build-spec/SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 已定义第 2 项为“自检结果”，并声明所有 5 项都是“记录+浮现”、不得附加停止语义。

验证命令：

```bash
npm test -- tests/m13b-build-spec-deepening.test.mjs --reporter=verbose
```

结果：`55 passed / 55`。
hook: Stop
hook: Stop Completed
tokens used
61,507

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
