# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-30T08:45:15.632Z

## Original task

3rd-review R3 for m13b-build-spec-deepening Phase 1+2. R2 finding was: Section 6/7 still had residual pruning language ('F10 gate has already pruned the spec', 'F10 门裁剪后的最终 spec', 're-prune') creating execution ambiguity vs FR-LADDER-002 non-blocking. All residual pruning language now removed: Section 6 step description changed to 'records F10 findings (non-blocking), human confirms spec as-is; no automatic changes made before human sees it'; Section 7 human checkpoint changed to 'F10 analysis findings recorded (non-blocking)' and removed 're-prune' instruction; HUMAN_REVIEW_CHECKPOINT text updated to 'F10 反过度工程分析已完成，findings 已记录'. grep confirms zero occurrences of pruned/pruning/裁剪后/re-prune. All 55 tests still pass. Please verify B1 is now fully closed (zero blocking F10 auto-remove semantics anywhere in Section 6/7) and output final verdict: pass | revise_required.

## Final prompt

3rd-review R3 for m13b-build-spec-deepening Phase 1+2. R2 finding was: Section 6/7 still had residual pruning language ('F10 gate has already pruned the spec', 'F10 门裁剪后的最终 spec', 're-prune') creating execution ambiguity vs FR-LADDER-002 non-blocking. All residual pruning language now removed: Section 6 step description changed to 'records F10 findings (non-blocking), human confirms spec as-is; no automatic changes made before human sees it'; Section 7 human checkpoint changed to 'F10 analysis findings recorded (non-blocking)' and removed 're-prune' instruction; HUMAN_REVIEW_CHECKPOINT text updated to 'F10 反过度工程分析已完成，findings 已记录'. grep confirms zero occurrences of pruned/pruning/裁剪后/re-prune. All 55 tests still pass. Please verify B1 is now fully closed (zero blocking F10 auto-remove semantics anywhere in Section 6/7) and output final verdict: pass | revise_required.

## Raw output

```text
pass

B1 is closed for Section 6/7.

Verified against [workflows/build-spec/SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:263):

- Section 6 now says F10 only records findings and is non-blocking: [line 265](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:265)
- Missing/weak F10 answers now produce warning + human review surfacing, not removal: [line 267](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:267)
- High-risk F10 answers are recorded in quality contract item 4 and surfaced to human, with explicit “do not automatically remove”: [line 274](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:274)
- Section 7 says the spec has not been automatically altered and F10 findings are only surfaced for review: [line 280](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:280)
- `HUMAN_REVIEW_CHECKPOINT` text is now “F10 反过度工程分析已完成，findings 已记录”: [line 282](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:282)

One note: the word `prune` still exists once in “The human at the review checkpoint decides whether to prune.” That is not an auto-remove/blocking semantic because it is explicitly human-decided and follows “do not automatically remove the mechanism.” I do not treat it as B1 blocking.

Verification run:

```text
npm test -- --run tests/m13b-build-spec-deepening.test.mjs
55 passed
```

Final verdict: `pass`


2026-06-30T08:43:57.293798Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:43:57.293857Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:43:57.293860Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-30T08:43:57.293861Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:43:57.293862Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:43:57.293864Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:43:57.293865Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:43:57.293866Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:43:57.293867Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:43:57.293868Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:43:57.293869Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-30T08:43:57.293870Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: high
reasoning summaries: none
session id: 019f17b3-0546-7e72-bd5c-a62aaab536b6
--------
user
3rd-review R3 for m13b-build-spec-deepening Phase 1+2. R2 finding was: Section 6/7 still had residual pruning language ('F10 gate has already pruned the spec', 'F10 门裁剪后的最终 spec', 're-prune') creating execution ambiguity vs FR-LADDER-002 non-blocking. All residual pruning language now removed: Section 6 step description changed to 'records F10 findings (non-blocking), human confirms spec as-is; no automatic changes made before human sees it'; Section 7 human checkpoint changed to 'F10 analysis findings recorded (non-blocking)' and removed 're-prune' instruction; HUMAN_REVIEW_CHECKPOINT text updated to 'F10 反过度工程分析已完成，findings 已记录'. grep confirms zero occurrences of pruned/pruning/裁剪后/re-prune. All 55 tests still pass. Please verify B1 is now fully closed (zero blocking F10 auto-remove semantics anywhere in Section 6/7) and output final verdict: pass | revise_required.
2026-06-30T08:43:58.197258Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
我会直接核对最新 `spec.md` 的 Section 6/7 和 `HUMAN_REVIEW_CHECKPOINT`，同时用关键词 grep 查残留自动裁剪语义。这个范围很窄，不启用子代理。
exec
/bin/bash -lc "sed -n '1,260p' specs/m13b-build-spec-deepening/spec.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
---
task_id: m13b-build-spec-deepening
milestone: M13b
stage: build-spec
source_decision_log: tasks/m13b-build-spec-deepening/decision-log.md
status: draft
spec_version: 1.0.0
---

# 功能规格：build-spec 质量事实契约深化（M13b）

> 基于 decision-log.md（m13b-build-spec-deepening，D1-D8，user_decision:true，S9='A' 已批准）。
> 本文件不可覆盖项目级规则。CONSTITUTION.md 优先。

**功能名**: `m13b-build-spec-deepening`
**来源**: decision-log.md M13b（make-decision stage，execution_id: 1DCFFB01-3F60-426B-A232-5F71CC31852C）
**状态**: 草稿

---

## 速读卡（30 秒看懂这个需求）

**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。

**核心改动点**：

- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
- 所有新机制均为"记录事实 + 浮现 + 人判断"，零阻断。
- TASK_TRACKING_ROOT 环境变量全局落地，所有 stage 按统一约定读取。

---

## 1. 问题陈述

build-spec M11 v1 缺少：

1. 范围分档（无 spec-ladder，容易过度工程）
2. spec 自检（无 7 条自检 + Spec-Purity grep，spec 纯度无法浮现）
3. spec↔decision-log 对齐（spec 偏离决策无感知）
4. 独立审查视角（无异源审查，自审自判风险）
5. 跨阶段任务跟踪（TASK_TRACKING_ROOT 未落地，执行记录不留存）
6. 交互规范（没有统一大白话+选项+进度报告规范）
7. 质量事实契约（无结构化 5 项质量事实产出）

---

## 2. 背景、目标与边界

### 背景

- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
- 当前 build-spec 产出 spec.md + checklist，但没有系统化的质量事实浮现机制。
- agenthub design 阶段有丰富质量保障体系，但其阻断门机制与 CONSTITUTION 冲突，须按"最小实现+记事实"原则移植。

### 目标

以最小改动让 build-spec 产出 5 项质量事实契约，覆盖 spec 构建本体 + 自检 + 独立审查 + 已知风险 + handoff 交接。

### 边界（scope）

**IN（必须实现）**：

- 质量事实契约 5 项定义 + 最小实现机制
- spec-ladder（A/B/C 档）反过度工程判断
- spec 三层小节结构（速读卡 / 正文 / 附录）
- 7 条自检 + Spec-Purity grep（非阻断，记事实）
- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
- 行为验证要求（Given/When/Then 格式 FR 场景）
- 摩擦捕获（capture-workflow-feedback 精神，记录摩擦点）
- `--task-dir` 命令定位规范
- Known Gaps 段
- handoff required_reads（作为契约第 5 项）
- scope-triage 高危词浮现（浮现+建议，非强制门）
- spec↔decision-log 一致性检查（非阻断，记差异）
- FR-{DOMAIN}-NNN 编号格式（全局统一）
- AC 条数计数存文件 `spec-acceptance-count.json`
- artifact-first：长报告只存路径，交互传路径不传全文
- TASK_TRACKING_ROOT：新增全局环境变量 + 所有 stage 读取约定（任务跟踪文件不存 repo，默认 Knowledge 目录）
- REQ-COMM-01：交互用大白话+给选项说后果
- REQ-COMM-02：勤报进度（做了啥/下一步/需要你啥）

**OUT（明确不做）**：

- agenthub 3 道阻断门（退出门/审查门/推进门）
- TodoWrite 待办模板仪式
- [DECOMP] 遥测
- 门绑定自动写
- Exit Conditions 重复行
- 3 source_family 多重审查（过度工程，单一异源即可）
- 5 框架外部调研（cursor/ECC/compound-engineering/skills/superpowers，单列任务）
- 任何阻断式 gate

---

## 3. 用户场景与用例

> 角色「编排者」= 驱动 workflowhub 任务流程的人或主 AI；「执行代理」= 被派去执行 build-spec 的助手。

### 场景 3.1：编排者走完整 build-spec 流程（正常路径，含质量事实契约）

- **操作步骤**：编排者传入 task-id + decision-log 路径，调起 build-spec；执行代理读 decision-log，产出 spec 初稿，运行 spec-ladder 判断档位，执行 7 条自检 + Spec-Purity grep，运行异源 3rd-review 独立审查，生成 5 项质量事实契约，写入 spec.md + checklists/requirements.md + spec-acceptance-count.json。
- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。

### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）

- **操作步骤**：spec 初稿含代码路径或 shell 命令（违反 Spec-Purity）；执行代理 grep 发现违规行。
- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。

### 场景 3.3：异源 3rd-review 审查发现方向偏差（记录不阻断）

- **操作步骤**：异源 3rd-review 审查中发现 spec 与 decision-log 有偏差。
- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。

### 场景 3.4：scope-triage 发现高危词（浮现建议不阻断）

- **操作步骤**：spec 文本中检测到高危词（如"自动阻断""blocking gate""门禁"等）。
- **预期结果**：高危词位置浮现，建议人工复核，附修改建议，stage 继续推进。

### 场景 3.5：TASK_TRACKING_ROOT 未设置（降级处理）

- **操作步骤**：执行代理启动时 `TASK_TRACKING_ROOT` 环境变量未设置。
- **预期结果**：降级到默认 Knowledge 目录路径，记录降级事件，warn 但不 throw，stage 继续。

### 场景 3.6：spec↔decision-log 一致性检查发现差异（记录不阻断）

- **操作步骤**：spec 中某 FR 在 decision-log 中找不到对应决策支撑。
- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。

### 场景 3.7：metrics recordSkeleton 写入失败

- **操作步骤**：collector.mjs 写入失败（磁盘满/权限不足）。
- **预期结果**：warn 到 onWarn 回调，不 throw，stage 继续，质量事实契约正常产出。

### 场景 3.8：AC 计数文件产出

- **操作步骤**：build-spec 完成，执行代理统计 spec.md 中验收条件（AC）数量和 FR 数量。
- **预期结果**：`specs/{task-id}/spec-acceptance-count.json` 写入，包含 `ac_count`、`fr_count`、`counted_at` 三字段。

### 场景 3.9：编排者交互收到大白话进度报告（REQ-COMM）

- **操作步骤**：执行代理完成某个步骤后向编排者报告。
- **预期结果**：报告用大白话，说明做了啥、下一步是啥、需要编排者做什么决定（给选项+后果），不用术语堆砌。

### 场景 3.10：--task-dir 定位规范

- **操作步骤**：编排者调用 build-spec 时传入 `--task-dir tasks/my-task/`。
- **预期结果**：所有产物路径、decision-log 路径均基于该 task-dir 推导，不依赖 cwd 猜测。

---

## 4. 功能需求（FR-{DOMAIN}-NNN）

### Spec 构建流水线（FR-BUILD）

**FR-BUILD-001**：build-spec 必须按以下流水线构建 spec：（1）调用 spec-specify 产出初稿；（2）调用 spec-clarify 对初稿做澄清扫描；（3）交叉比对平台约束（CONSTITUTION.md 及项目硬规则），将冲突点记入未解风险；（4）每步结论必须扎根于 decision-log 原文，不得自行发明未经决策的需求。流水线各步骤为"编排协议"描述，不修改 spec-specify/spec-clarify 技能本体。**别名映射**：spec-specify / spec-clarify 即 decision-log 所称 speckit-specify / speckit-clarify 的 workflowhub 适配版，M11 重命名后为同一机制，两个名称等价。

- **场景**：Given build-spec 启动且 decision-log 已就位，When 执行 spec 构建流水线，Then spec-specify 先于 spec-clarify 运行，两步完成后有平台约束比对记录，产出的 spec 内容可追溯到 decision-log 中对应的 KEEP 决策条目。
- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。

### 质量事实契约（FR-CONTRACT）

**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：

1. **scope 边界**：本次 spec 实际覆盖范围的简明描述（IN/OUT 各一列）
2. **自检结果**：7 条自检 + Spec-Purity grep 的逐条结论（pass/warn/unknown）
3. **独立审查摘要**：异源 3rd-review 独立审查 verdict+findings 摘要
4. **未解风险**：spec↔decision-log 差异、高危词命中、已知 gap 列表（可为空列表）
5. **handoff required_reads**：下游 stage 执行时必须读取的文件路径列表

- **场景**：Given build-spec 完成一次运行，When 检查 spec.md，Then 质量事实契约 5 项字段均存在，任一字段缺失即自检报 warn。
- **场景**：Given 某项无数据（如审查未运行），When 填写该字段，Then 填 unknown，不伪造值（F9 可证伪不假绿）。

**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。

- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。

### Spec-Ladder 反过度工程（FR-LADDER）

**FR-LADDER-001**：build-spec 在开始 spec-specify 前，必须基于 decision-log 描述的功能复杂度做 spec-ladder 档位判断，输出档位选择依据：

- **A 档（薄）**：单一场景、FR 极少（参考 1-3 个）、改动牵连面小——速读卡 + FR + 验收条件即可，不强制全章。
- **B 档（标准）**：多场景、有明确范围边界、改动集中在单系统或单文件内——五章硬门（速读卡/FR/不做/验收/影响范围）；FR 数量本身不是 B→C 升档的充分条件。
- **C 档（完整）**：**跨系统**（需改动两个及以上独立系统/服务）、**有外部依赖**（API/协议/三方合约）、或 **改动牵连面大**（多 repo/多团队协调）——五章硬门 + 额外章节（背景/兼容性/影响范围）。

- **场景**：Given decision-log 描述的是单一小功能，When 做 spec-ladder 判断，Then 选 A 档，不强制产出全章 spec。
- **场景**：Given 档位选择完成，When 查看 spec，Then spec 序言中有档位声明及选择依据。

**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。

- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。

### Spec 三层小节结构（FR-STRUCTURE）

**FR-STRUCTURE-001**：build-spec 产出的 spec.md 必须按三层结构组织：

- **层 1 速读卡**：一句话需求 + 核心改动点（30 秒可读完）
- **层 2 正文**：问题陈述、背景目标边界、用户场景、FR、不做/非目标、验收条件、影响范围
- **层 3 附录**：质量事实契约、Known Gaps、兼容性预留、设计决策记录

- **场景**：Given build-spec 产出 spec，When 检查结构，Then 速读卡/正文/附录三层可识别，且速读卡在文件顶部 30 行内。

**FR-STRUCTURE-002**：Known Gaps 段必须存在（可为空列表），记录本次 spec 有意留白、未覆盖或留待后续的事项。

- **场景**：Given build-spec 产出 spec，When 在附录中搜索 Known Gaps，Then 能找到该段落，即使内容为空列表也满足要求，不因内容为空而标 warn。

### 7 条自检 + Spec-Purity（FR-SELFCHECK）

**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：

1. spec-ladder 档位已声明且有依据
2. 所有 FR 使用 FR-{DOMAIN}-NNN 格式
3. 每个 FR 至少有一条 Given/When/Then 场景
4. 五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章
5. spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应
6. 无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）
7. Known Gaps 段存在

- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。

**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。

- **场景**：Given spec 中有 shell 命令，When Spec-Purity grep，Then warn + 命中行列表写入自检结果，stage 继续。
- **场景**：Given spec 中有 JSON 格式示例代码块，When Spec-Purity grep，Then 同样记 warn + 命中行，由人工判断是否为可接受的文档示例，不自动豁免。

### 异源独立审查（FR-REVIEW）

**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。

- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。

**FR-REVIEW-002**：审查必须由异源来源在独立上下文产出（禁止自审自判，符合宪法），命名为「异源独立审查 / 3rd-review」；不得使用单一 AI 切换视角替代异源审查。

- **场景**：Given 产出审查摘要，When 检查审查来源，Then 审查由独立异源引擎产出，grep 到"3rd-review"或"异源独立审查"，且审查由独立来源在独立上下文产出。

### 行为验证要求（FR-BEHAV）

**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。

- **场景**：Given spec 中 FR-CONTRACT-001，When 审查场景，Then 场景描述可被人工或工具核对（有明确可验证的 Then 条件）。

**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。

- **场景**：Given spec 中任意非 meta 的 FR 场景文本，When 检查场景描述是否仅涉及用户/系统可观察行为，Then 场景描述中只出现"谁做了什么、产出了什么结果"，不对执行方式作具体规定（如指定特定命令名、特定文件格式、具体协议码等）。
- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。

### 摩擦捕获（FR-FRICTION）

**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。

- **场景**：Given spec-specify 因 decision-log 描述模糊而需要推断，When 完成推断并继续，Then 摩擦点以 [FRICTION] 条目记录在未解风险中。

### --task-dir 定位规范（FR-TASKDIR）

**FR-TASKDIR-001**：build-spec SKILL.md 必须声明 `--task-dir` 参数约定：所有 stage 的输入文件（decision-log.md）和产物路径均基于 `--task-dir` 值推导，参数缺失时回退到 `tasks/{task-id}/` 默认路径，回退时记录 warn。

- **场景**：Given 编排者传入 `--task-dir tasks/m13b-build-spec-deepening/`，When build-spec 运行，Then 所有路径基于该值，不猜测 cwd。
- **场景**：Given `--task-dir` 未传入，When build-spec 运行，Then 回退到默认路径并 warn，不报错停止。

### TASK_TRACKING_ROOT（FR-TRACKING）


exec
/bin/bash -lc 'rg -n "HUMAN_REVIEW_CHECKPOINT|Section 6|Section 7|第 6|第 7|Phase 1|Phase 2|FR-LADDER-002|F10" specs/m13b-build-spec-deepening/spec.md tasks/m13b-build-spec-deepening/decision-log.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
specs/m13b-build-spec-deepening/spec.md:51:- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/spec.md:190:- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。
specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/spec.md:421:- `CONSTITUTION.md`（最高约束，F4/F5/F7/F10 直接相关）
specs/m13b-build-spec-deepening/spec.md:461:- F10 四问：(1) 防止 spec 质量盲区 (2) 诚实的执行者也需要结构化质量浮现 (3) 无更简单替代（最小实现已是最简） (4) 维护成本低（均为 SKILL.md 描述性内容，非代码）
tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
tasks/m13b-build-spec-deepening/decision-log.md:46:- 不做任何阻断式 gate（gate.sh stage_exit / post_review_pass / stage_advance 的阻断语义）。理由：违宪 F4/F5/F7/F10，F10 反例点名 agenthub。

exec
/bin/bash -lc 'rg -n "pruned|pruning|prune|re-prune|裁剪后|裁剪|auto-?remove|automatic changes|自动|删除|移除|F10" specs/m13b-build-spec-deepening tasks/m13b-build-spec-deepening' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
tasks/m13b-build-spec-deepening/AGENTS.md:22:- CONSTITUTION.md F2/F3/F8/F10/Q1/Q3
tasks/m13b-build-spec-deepening/stage-result-build-plan.json:21:  "reason": "Plan and sequenced task list produced via spec-plan/spec-tasks; cross-artifact analyzed; constitution check 21/21 [x] with rationale; M10 baseline comparison recorded (all 5 metrics unknown at plan stage by design); F10 gate applied to 7 mechanisms (0 removed); all 24 FR covered by >=1 task. Heterologous 3rd-review (codex, 5 rounds) converged to verdict=pass, 0 blocking. Human review checkpoint approved by initiator.",
tasks/m13b-build-spec-deepening/stage-result-build-plan.json:26:    "decision": "用户回复「批准」，确认 plan/tasks 产物通过：异源 3rd-review 5 轮收敛 pass、宪法 21/21、F10 7 机制保留、24 FR 全覆盖。授权进入 build-code。",
specs/m13b-build-spec-deepening/spec.md:51:- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
specs/m13b-build-spec-deepening/spec.md:87:- 门绑定自动写
specs/m13b-build-spec-deepening/spec.md:116:- **操作步骤**：spec 文本中检测到高危词（如"自动阻断""blocking gate""门禁"等）。
specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/spec.md:190:- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。
specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/spec.md:223:- **场景**：Given spec 中有 JSON 格式示例代码块，When Spec-Purity grep，Then 同样记 warn + 命中行，由人工判断是否为可接受的文档示例，不自动豁免。
specs/m13b-build-spec-deepening/spec.md:330:4. **无门绑定自动写**：不因 gate 触发自动写入任何文件（gate 已 CUT）。
specs/m13b-build-spec-deepening/spec.md:360:- [ ] **AC-21**：SKILL.md 中 D3 删除项不作为活跃机制存在——即 grep `workflows/build-spec/SKILL.md` 不命中 TodoWrite 待办模板调用、`[DECOMP]` 遥测发射、绑门自动写、Exit Conditions 重复行 作为机制性执行步骤；纯说明性引用（如"本 skill 不用 TodoWrite 待办模板"）不算违反，与 AC-16 同口径。这是 decision-log §7「D3 删除项不出现」的精确操作化：删除项作为机制不出现。
specs/m13b-build-spec-deepening/spec.md:371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18
specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/spec.md:409:- [RISK] FR-SELFCHECK-002 Spec-Purity grep：本 spec 示例代码块（JSON 格式示例）会命中 grep 触发 warn，已由人工确认为文档示例（可接受）；SKILL.md 实现时需说明 warn 后的人工判断流程，示例块与实现代码同等触发 warn，不自动豁免。
specs/m13b-build-spec-deepening/spec.md:410:- [RISK] FR-TRACKING-001 默认路径 `~/Knowledge/workflowhub/` 需要用户环境存在该目录或自动创建；SKILL.md 需说明自动 mkdir 行为。
specs/m13b-build-spec-deepening/spec.md:421:- `CONSTITUTION.md`（最高约束，F4/F5/F7/F10 直接相关）
specs/m13b-build-spec-deepening/spec.md:429:3. **TASK_TRACKING_ROOT 目录自动创建**：mkdir 行为（是否 -p，是否提示用户）待 SKILL.md 实现时确定。
specs/m13b-build-spec-deepening/spec.md:431:5. **spec-acceptance-count.json AC 计数方法**：当前计数为人工/grep 统计；自动化计数工具待后续优化。
specs/m13b-build-spec-deepening/spec.md:441:| D3 | 删除：agenthub 3 道门（退出门/审查门/推进门）、TodoWrite 待办模板仪式、`[DECOMP]` 遥测、绑门自动写、Exit Conditions 重复行（CUT，无需 FR 覆盖） | — |
specs/m13b-build-spec-deepening/spec.md:461:- F10 四问：(1) 防止 spec 质量盲区 (2) 诚实的执行者也需要结构化质量浮现 (3) 无更简单替代（最小实现已是最简） (4) 维护成本低（均为 SKILL.md 描述性内容，非代码）
tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
tasks/m13b-build-spec-deepening/decision-log.md:26:- **D3（删除）**：agenthub 3 道门（退出门/审查门/推进门）整层删（检查内容已被 D2 的 7 自检+纯净度扫描+独立审查覆盖，重复）；TodoWrite 待办模板仪式、`[DECOMP]` 遥测、绑门自动写、Exit Conditions 重复行。
tasks/m13b-build-spec-deepening/decision-log.md:41:- 实现时 D2 所有质量检查均为「记录事实 + 浮现 + 人判断」，无任何自动卡推进（economy 方向角 minor）。
tasks/m13b-build-spec-deepening/decision-log.md:46:- 不做任何阻断式 gate（gate.sh stage_exit / post_review_pass / stage_advance 的阻断语义）。理由：违宪 F4/F5/F7/F10，F10 反例点名 agenthub。
tasks/m13b-build-spec-deepening/decision-log.md:49:- 不搬 agenthub TodoWrite 待办模板、`[DECOMP]` 遥测、绑门自动写。理由：纯 token 开销、workflowhub 无对应。
tasks/m13b-build-spec-deepening/decision-log.md:59:- D3 删除项在 SKILL.md 中不出现。
tasks/m13b-build-spec-deepening/stage-result-build-spec.json:27:  "reason": "spec.md 经 spec-specify 初稿 + spec-clarify 澄清 + F10 反过度工程门 + 宪法符合性检查(constitution-check.md) + baseline 对照(baseline-report.md) + 异源 codex 独立审查(FR-REVIEW 2轮迭代 + 覆盖审计3轮，最终 verdict=pass，review_evidence 见 .omc/artifacts/ask/codex-1-tasks-m13b-build-spec-deepening-decision-log-md-2-specs-m1-2026-06-30T06-59-30-358Z.md)，全部完成。人审检查点已通过(human_intervention=true)。24 FR / 22 AC，spec-acceptance-count.json 落档。进入 build-plan 段。"
tasks/m13b-build-spec-deepening/scope-decision.md:23:### D-M13b-1：P0/P1/P2 全做，不裁剪
tasks/m13b-build-spec-deepening/scope-decision.md:30:| P0-2 | F10 gate 后 human review 前四项自检 | spec-self-check.md |
tasks/m13b-build-spec-deepening/scope-decision.md:31:| P0-3 | spec-clarify 后 F10 前 decision-log×spec 对齐 | spec-decision-alignment.md |
tasks/m13b-build-spec-deepening/scope-decision.md:49:### D-M13b-5：P0-2 四项自检复用 grill-with-docs-lite 思路但改为自动扫描
tasks/m13b-build-spec-deepening/scope-decision.md:50:原 grill-with-docs-lite 是交互逐条质询用户；P0-2 改为**非交互自动自检**四项：placeholder / contradiction / ambiguity / scope，各至少一条结论写 spec-self-check.md。复用 grill「逼出边界」内核，去掉交互盘问。命名归属（独立 spec-self-check skill vs 内联 build-spec）→ 见开放问题 OQ-2。
tasks/m13b-build-spec-deepening/scope-decision.md:70:- F10 gate 现有机制可用，新增步骤插在其前后不破坏现有门序。
specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
tasks/m13b-build-spec-deepening/artifacts/internal-research-summary.md:8:build-spec 当前是 M11 交付的 v1：spec-specify → spec-clarify → 宪法检查(F1–F10) → baseline 对照 → F10 反过度工程门 → 人工审查。
tasks/m13b-build-spec-deepening/artifacts/internal-research-summary.md:14:- M0 `grill-with-docs-lite`（外部改造薄壳，交互逐条质询，写边界回 spec/decision-log）——P0-2 取其「逼边界」内核但改非交互自动扫描。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:9:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:70:+- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:132:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:193:+- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:258:1. 严重：[CLAUDE.md](/Users/Hugh/Hugh/Project/workflowhub/CLAUDE.md:31) 被注入了 Multica runtime 本地上下文，应从本次 diff 移除。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:263:   新增 ladder F10 在 [workflows/build-spec/SKILL.md:94](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:94) 写了“不作为阻断条件”，但旧的 Section 6 仍写成硬 gate：[workflows/build-spec/SKILL.md:263](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:263) 标题就是 `F10 anti-over-engineering gate`，[workflows/build-spec/SKILL.md:267](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:267) 要求“四问答不全就 remove”，[workflows/build-spec/SKILL.md:274](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:274) 又要求某些答案直接 remove mechanism。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:319:Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:380:+- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:764:+- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:832:+F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:872:+**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:891:+1. **scope 边界**：本次 spec 的 IN/OUT scope 及裁剪机制列表
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:936: Read `constitution-checklist.md`. Check all 21 items (F1–F10, Q1–Q3, S1–S8) against the spec produced so far. For every item write `[x]` (compliant) or `[ ]` (non-compliant) with a concrete rationale sentence. No item may be left unmarked or without a rationale — all 21 must be present.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:967:    23	- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1038:    94	F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1087:   143	**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1106:   162	1. **scope 边界**：本次 spec 的 IN/OUT scope 及裁剪机制列表
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1151:   207	Read `constitution-checklist.md`. Check all 21 items (F1–F10, Q1–Q3, S1–S8) against the spec produced so far. For every item write `[x]` (compliant) or `[ ]` (non-compliant) with a concrete rationale sentence. No item may be left unmarked or without a rationale — all 21 must be present.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1155:   211	**Framework (F1–F10)**:
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1160:   216	- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1162:   218	- [ ] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作是否经人边界确认。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1165:   221	- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1307:./specs/m12-build-plan-v1/spec.md:218:- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1309:./specs/m12-build-plan-v1/spec.md:340:- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1328:./specs/m12-build-plan-v1/plan.md:162:- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1332:./specs/m12-build-plan-v1/plan.md.handwritten.bak:170:| 6 | `workflows/build-plan/SKILL.md` | Phase 2 | 从 M6 薄骨架升级为 v1 — 在读 spec 后插入子技能调用流程，追加宪法检查、baseline 对照、人审检查点，保留 F10 gate、stage-result 契约（追加 tasks_ref）、metrics 调用。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1333:./specs/m12-build-plan-v1/plan.md.handwritten.bak:233:- **Preserve intact**: F10 gate section (4 questions), stage-result contract (append `tasks_ref`, keep `plan_ref` + `tasks`), metrics calls (recordSkeleton + updateOwnResult with M4 10 core fields)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1334:./specs/m12-build-plan-v1/plan.md.handwritten.bak:237:- SKILL.md greps positive for: `plan-generate`, `tasks-generate`, `cross-artifact-analyze`, `constitution-checklist.md`, `constitution-check.md`, `baseline-comparison.md`, `cross-artifact-analysis.md`, `rework_proxy_count`, `F10`, `tasks_ref`, `plan_ref`, `recordSkeleton`, `updateOwnResult`
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1337:./tasks/m12-build-plan-v1/stage-result-build-spec.json:7:    "requirements": "24 FR across 10 groups: FR-BP(3, build-plan v1 SKILL.md 串行编排+plan/tasks产物结构+stage-result契约保留追加tasks_ref), FR-MIG(3, speckit-plan/tasks/analyze 改造迁移 workflows/ 改名 plan-generate/tasks-generate/cross-artifact-analyze + 独立可调起内置模板 + tasks 阶段分组), FR-DECOUPLE(3, 不从git分支推断身份 fail-loud + 模板技能内部加载 + analyze 显式路径定位), FR-XARTIFACT(2, 跨产物一致性检查只记录不阻断), FR-CONSTITUTION(3, 21条逐条勾选只记录不阻断 + 缺失判据), FR-BASELINE(3, M10 5项对照 rework_proxy_count真名 阈值人拍), FR-REGISTRY(2, 三件 reuse-registry 登记+格式校验), FR-REVIEW(1, 一且仅一次人审检查点), FR-SKELETON(2, F10门保留+M6 stage-result/metrics契约不回归), FR-SCOPE(2, 不碰 build-code/verify-code 逻辑+design其他技能); 9条验收; 每FR可溯 D-M12-x。"
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1342:./tasks/m12-build-plan-v1/plan-tasks-review-package.md:173:| 6 | `workflows/build-plan/SKILL.md` | Phase 2 | 从 M6 薄骨架升级为 v1 — 在读 spec 后插入子技能调用流程，追加宪法检查、baseline 对照、人审检查点，保留 F10 gate、stage-result 契约（追加 tasks_ref）、metrics 调用。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1343:./tasks/m12-build-plan-v1/plan-tasks-review-package.md:236:- **Preserve intact**: F10 gate section (4 questions), stage-result contract (append `tasks_ref`, keep `plan_ref` + `tasks`), metrics calls (recordSkeleton + updateOwnResult with M4 10 core fields)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1344:./tasks/m12-build-plan-v1/plan-tasks-review-package.md:240:- SKILL.md greps positive for: `plan-generate`, `tasks-generate`, `cross-artifact-analyze`, `constitution-checklist.md`, `constitution-check.md`, `baseline-comparison.md`, `cross-artifact-analysis.md`, `rework_proxy_count`, `F10`, `tasks_ref`, `plan_ref`, `recordSkeleton`, `updateOwnResult`
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1355:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:546:- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1357:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:737:- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1358:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:883:**Independent Test**: Read `workflows/build-plan/SKILL.md` and grep-verify: (a) references to spec-plan/spec-tasks/spec-analyze exist; (b) constitution-checklist 21-clause reference exists; (c) M10 baseline-report.md 5-metric reference exists; (d) human review pause marker exists exactly once; (e) F10 4-question gate present; (f) stage-result contract includes plan_ref + tasks (M6) + tasks_ref (v1 new) + review object.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1359:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:889:- [ ] T014 [US4] Upgrade `workflows/build-plan/SKILL.md` — replace M6 thin skeleton with v1 orchestrator: (a) read spec from upstream build-spec; (b) call spec-plan with task-id; (c) call spec-tasks with task-id + --stage N; (d) call spec-analyze with task-id, producing report at `specs/{task-id}/cross-artifact-analysis.md`; (e) perform constitution compliance check by reading `constitution-checklist.md` and filling all 21 clauses (F1-F10, Q1-Q3, S1-S8) with `[x]`/`[ ]` + rationale; (f) perform M10 baseline comparison using `specs/archive/m10-baseline-switch/baseline-report.md` as baseline values; (g) pause at human review checkpoint (exactly one occurrence) for manual confirmation; (h) produce stage-result JSON with plan_ref, tasks, tasks_ref (new), analysis_ref (new), review object; (i) call metrics collector (recordSkeleton + updateOwnResult). FR: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-BASELINE-001, FR-REVIEW-001, FR-SKELETON-002.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1362:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1113:- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1365:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1535:   165	- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1367:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1792:   218	- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1369:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1914:   340	- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1372:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2274:   105	**Independent Test**: Read `workflows/build-plan/SKILL.md` and grep-verify: (a) references to spec-plan/spec-tasks/spec-analyze exist; (b) constitution-checklist 21-clause reference exists; (c) M10 baseline-report.md 5-metric reference exists; (d) human review pause marker exists exactly once; (e) F10 4-question gate present; (f) stage-result contract includes plan_ref + tasks (M6) + tasks_ref (v1 new) + review object.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1373:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2280:   111	- [ ] T014 [US4] Upgrade `workflows/build-plan/SKILL.md` — replace M6 thin skeleton with v1 orchestrator: (a) read spec from upstream build-spec; (b) call spec-plan with task-id; (c) call spec-tasks with task-id + --stage N; (d) call spec-analyze with task-id, producing report at `specs/{task-id}/cross-artifact-analysis.md`; (e) perform constitution compliance check by reading `constitution-checklist.md` and filling all 21 clauses (F1-F10, Q1-Q3, S1-S8) with `[x]`/`[ ]` + rationale; (f) perform M10 baseline comparison using `specs/archive/m10-baseline-switch/baseline-report.md` as baseline values; (g) pause at human review checkpoint (exactly one occurrence) for manual confirmation; (h) produce stage-result JSON with plan_ref, tasks, tasks_ref (new), analysis_ref (new), review object; (i) call metrics collector (recordSkeleton + updateOwnResult). FR: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-BASELINE-001, FR-REVIEW-001, FR-SKELETON-002.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1376:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2456:   218	- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1378:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2578:   340	- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1379:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2889:   165	- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1392:./specs/m12-build-plan-v1/tasks.md:105:**Independent Test**: Read `workflows/build-plan/SKILL.md` and grep-verify: (a) references to spec-plan/spec-tasks/spec-analyze exist; (b) constitution-checklist 21-clause reference exists; (c) M10 baseline-report.md 5-metric reference exists; (d) human review pause marker exists exactly once; (e) F10 4-question gate present; (f) stage-result contract includes plan_ref + tasks (M6) + tasks_ref (v1 new) + review object.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1393:./specs/m12-build-plan-v1/tasks.md:111:- [ ] T014 [US4] Upgrade `workflows/build-plan/SKILL.md` — replace M6 thin skeleton with v1 orchestrator: (a) read spec from upstream build-spec; (b) call spec-plan with task-id; (c) call spec-tasks with task-id + --stage N; (d) call spec-analyze with task-id, producing report at `specs/{task-id}/cross-artifact-analysis.md`; (e) perform constitution compliance check by reading `constitution-checklist.md` and filling all 21 clauses (F1-F10, Q1-Q3, S1-S8) with `[x]`/`[ ]` + rationale; (f) perform M10 baseline comparison using `specs/archive/m10-baseline-switch/baseline-report.md` as baseline values; (g) pause at human review checkpoint (exactly one occurrence) for manual confirmation; (h) produce stage-result JSON with plan_ref, tasks, tasks_ref (new), analysis_ref (new), review object; (i) call metrics collector (recordSkeleton + updateOwnResult). FR: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-BASELINE-001, FR-REVIEW-001, FR-SKELETON-002.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1400:./specs/archive/m12-build-plan-v1/spec.md:218:- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1402:./specs/archive/m12-build-plan-v1/spec.md:340:- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1405:./specs/archive/m12-build-plan-v1/plan.md:162:- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1409:./specs/archive/m12-build-plan-v1/tasks.md:105:**Independent Test**: Read `workflows/build-plan/SKILL.md` and grep-verify: (a) references to spec-plan/spec-tasks/spec-analyze exist; (b) constitution-checklist 21-clause reference exists; (c) M10 baseline-report.md 5-metric reference exists; (d) human review pause marker exists exactly once; (e) F10 4-question gate present; (f) stage-result contract includes plan_ref + tasks (M6) + tasks_ref (v1 new) + review object.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1410:./specs/archive/m12-build-plan-v1/tasks.md:111:- [ ] T014 [US4] Upgrade `workflows/build-plan/SKILL.md` — replace M6 thin skeleton with v1 orchestrator: (a) read spec from upstream build-spec; (b) call spec-plan with task-id; (c) call spec-tasks with task-id + --stage N; (d) call spec-analyze with task-id, producing report at `specs/{task-id}/cross-artifact-analysis.md`; (e) perform constitution compliance check by reading `constitution-checklist.md` and filling all 21 clauses (F1-F10, Q1-Q3, S1-S8) with `[x]`/`[ ]` + rationale; (f) perform M10 baseline comparison using `specs/archive/m10-baseline-switch/baseline-report.md` as baseline values; (g) pause at human review checkpoint (exactly one occurrence) for manual confirmation; (h) produce stage-result JSON with plan_ref, tasks, tasks_ref (new), analysis_ref (new), review object; (i) call metrics collector (recordSkeleton + updateOwnResult). FR: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-BASELINE-001, FR-REVIEW-001, FR-SKELETON-002.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1443:workflows/build-spec/SKILL.md:23:- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1446:workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1453:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1467:specs/m13b-build-spec-deepening/spec.md:51:- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1481:specs/m13b-build-spec-deepening/spec.md:116:- **操作步骤**：spec 文本中检测到高危词（如"自动阻断""blocking gate""门禁"等）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1487:specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1488:specs/m13b-build-spec-deepening/spec.md:190:- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1490:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1502:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1512:specs/m13b-build-spec-deepening/plan.md:201:- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：spec 明确 OUT 列表（无阻断门、无 3 source_family 多重审查、无 TodoWrite 仪式），CUT 了全部 agenthub 阻断门（D3），无新增 gate 机制。符合 F5。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1526:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1535:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1553:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1642:specs/m13b-build-spec-deepening/constitution-check.md:62:  spec 明确对 agenthub 原有质量保障体系进行了合宪改造：删除三道阻断门（不符合 F4/F5），保留质量事实浮现机制；FR-REVIEW-002 将三 source_family 异源改造为 1-AI-3-angle 单代理三角度（合宪简化）；这正是"按项目需要改造使其合宪"的典型体现，符合 S2。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1694:   263	### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1696:   265	This gate runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint — so any pruning it triggers happens to the spec the human will then confirm. The human must confirm the final spec, not an intermediate one (F7).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1707:   276	This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1711:   280	After spec-specify output, spec-clarify refinement, the F10 gate, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. By this point the F10 gate has already pruned the spec, so the spec the human sees is final:
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1713:   282	> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪（F10 反过度工程门已应用，spec 为最终版），请确认后继续：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1714:   283	> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新 + F10 门裁剪后的最终 spec）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1720:   289	The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently re-prune or alter the spec — what the human confirmed is what gets recorded.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1838:tests/m13b-build-spec-deepening.test.mjs:158:  test("SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1840:tests/m13b-build-spec-deepening.test.mjs:162:      "SKILL.md must include F10 four-question in ladder judgment (FR-LADDER-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1877:workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1881:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1902:specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1908:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1941:specs/m13b-build-spec-deepening/spec.md:409:- [RISK] FR-SELFCHECK-002 Spec-Purity grep：本 spec 示例代码块（JSON 格式示例）会命中 grep 触发 warn，已由人工确认为文档示例（可接受）；SKILL.md 实现时需说明 warn 后的人工判断流程，示例块与实现代码同等触发 warn，不自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1942:specs/m13b-build-spec-deepening/spec.md:410:- [RISK] FR-TRACKING-001 默认路径 `~/Knowledge/workflowhub/` 需要用户环境存在该目录或自动创建；SKILL.md 需说明自动 mkdir 行为。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2113:  test("SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2117:      "SKILL.md must include F10 four-question in ladder judgment (FR-LADDER-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2345:specs/m13b-build-spec-deepening/spec.md:371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2346:specs/m13b-build-spec-deepening/spec.md:429:3. **TASK_TRACKING_ROOT 目录自动创建**：mkdir 行为（是否 -p，是否提示用户）待 SKILL.md 实现时确定。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2361:workflows/build-spec/SKILL.md:283:> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新 + F10 门裁剪后的最终 spec）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2891:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2896:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2956:360:- [ ] **AC-21**：SKILL.md 中 D3 删除项不作为活跃机制存在——即 grep `workflows/build-spec/SKILL.md` 不命中 TodoWrite 待办模板调用、`[DECOMP]` 遥测发射、绑门自动写、Exit Conditions 重复行 作为机制性执行步骤；纯说明性引用（如"本 skill 不用 TodoWrite 待办模板"）不算违反，与 AC-16 同口径。这是 decision-log §7「D3 删除项不出现」的精确操作化：删除项作为机制不出现。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2958:371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2963:1. 严重：[CLAUDE.md](/Users/Hugh/Hugh/Project/workflowhub/CLAUDE.md:31) 被注入了 Multica runtime 本地上下文，应从本次 diff 移除。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2968:   新增 ladder F10 在 [workflows/build-spec/SKILL.md:94](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:94) 写了“不作为阻断条件”，但旧的 Section 6 仍写成硬 gate：[workflows/build-spec/SKILL.md:263](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:263) 标题就是 `F10 anti-over-engineering gate`，[workflows/build-spec/SKILL.md:267](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:267) 要求“四问答不全就 remove”，[workflows/build-spec/SKILL.md:274](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:274) 又要求某些答案直接 remove mechanism。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:58: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:59:   → SKILL.md must include F10 four-question in ladder judgment (FR-LADDER-002)
specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/plan.md:90:- 内容：A/B/C 档定义、档位判断步骤、F10 四问在档位判断时执行（FR-LADDER-001/002）
specs/m13b-build-spec-deepening/plan.md:201:- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：spec 明确 OUT 列表（无阻断门、无 3 source_family 多重审查、无 TodoWrite 仪式），CUT 了全部 agenthub 阻断门（D3），无新增 gate 机制。符合 F5。
specs/m13b-build-spec-deepening/plan.md:209:- [x] **F9 不假绿** — 判据：FR-CONTRACT-001 明确"值可为 unknown 但禁止字段缺失"，FR-SELFCHECK-002 明确示例块不自动豁免、同等 warn——不允许任何伪通过路径。符合 F9。
specs/m13b-build-spec-deepening/plan.md:211:- [x] **F10 自动化按真实收益添加** — 判据：spec 只加入 grep 类轻量自动化（Spec-Purity grep、scope-triage grep），无新增 CI gate、无复杂 runner；F10 四问在 spec-ladder 档位判断时显式执行（FR-LADDER-002）。见本文档 F10 Gate 节详细回答。符合 F10。
specs/m13b-build-spec-deepening/plan.md:255:## F10 Anti-Over-Engineering Gate
specs/m13b-build-spec-deepening/plan.md:257:> 对 plan 中提出的每个新机制逐条回答 F10 四问。无法全部回答的项已移除。
specs/m13b-build-spec-deepening/plan.md:322:**F10 移除项**：无。所有 7 个机制均通过四问，全部保留。
tasks/m13b-build-spec-deepening/journal.jsonl:10:{"seq":10,"event":"constitution_crosscheck_done","ts":"2026-06-30T04:42:00Z","artifact":"artifacts/direction-constitution-crosscheck.md","note":"grill: 5 mechanisms constitutional & portable; 3 blocking gates (stage_exit/post_review_pass/stage_advance) violate F4/F5/F10/Q1/Q2/F7. F10 反例 names agenthub explicitly."}
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:478: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:479:AssertionError: SKILL.md must include F10 four-question in ladder judgment (FR-LADDER-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:488:    158|   test("SKILL.md declares F10 four-question at ladder stage (FR-LADDER…
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:493:    162|       "SKILL.md must include F10 four-question in ladder judgment (FR-…
tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/spec-clarify-scan.md:81:- **OQ-2**（OPEN）：`TASK_TRACKING_ROOT` 默认值 `~/Knowledge/workflowhub/` — 若用户 home 目录不可写，SKILL.md 应如何处理？decision-log 说"warn 不 throw"，但目录不存在时是否自动 `mkdir -p`？建议：SKILL.md 加"自动 mkdir -p，失败则 warn"，待 build-plan 确认。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:135:| OQ-2 | 集成依赖 | TASK_TRACKING_ROOT 目录不存在时是否自动 `mkdir -p`？失败如何处理？ | 自动 `mkdir -p`，失败 warn 不 throw |
specs/m13b-build-spec-deepening/constitution-check.md:23:- [x] **F5 gate 谨慎添加、出事再补、无用则移除**
specs/m13b-build-spec-deepening/constitution-check.md:29:- [x] **F7 推进与不可逆操作不自动越过人**
specs/m13b-build-spec-deepening/constitution-check.md:30:  spec 设计中所有质量事实契约项均"浮现供人判断"（场景 3.2/3.3/3.6 均以"人工可见"或"浮现给人判断"为预期结果），独立三角度审查偏差不自动推进处理，符合"不可逆操作须经人在边界确认"的 F7 原则；spec 未定义任何自动越过人的推进逻辑。
specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/constitution-check.md:38:- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建**
specs/m13b-build-spec-deepening/constitution-check.md:39:  spec 影响范围第 7 节明确"测试边界：grep SKILL.md 验证 AC-01 至 AC-16；JSON schema 验证 AC-17；正则验证 AC-18"，验证手段为轻量 grep/正则而非独立 CI 门；Section 5（不做）明确排除了遥测分解 [DECOMP] 和门绑定自动写；附录 D F10 四问执行结论"维护成本低（均为 SKILL.md 描述性内容，非代码）"，符合 F10 按真实收益添加自动化的原则。
specs/m13b-build-spec-deepening/constitution-check.md:62:  spec 明确对 agenthub 原有质量保障体系进行了合宪改造：删除三道阻断门（不符合 F4/F5），保留质量事实浮现机制；FR-REVIEW-002 将三 source_family 异源改造为 1-AI-3-angle 单代理三角度（合宪简化）；这正是"按项目需要改造使其合宪"的典型体现，符合 S2。
specs/m13b-build-spec-deepening/constitution-check.md:88:| 框架原则 F（F1-F10） | 10 | 0 | 0 |
tasks/m13b-build-spec-deepening/artifacts/s5-prompt-framing.md:5:背景：workflowhub 是 AI 开发工作流编排工具，宪法核心信条：薄核心窄契约、记事实不阻断、质量靠独立审查与人。它立项就是为逃离前身 agenthub——agenthub 堆约 9.5 万行 gate 代码、半数提交修 gate 死锁，被宪法 F10 列为反例。
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:43:- **[NBK-5]** F10 section in plan.md does not separately justify `spec↔decision-log alignment` (FR-ALIGN-001); several "simpler alternative" answers say "not covered" rather than comparing alternatives.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:45:- **[NBK-6]** F10 mechanism 4 (heterologous 3rd-review) has plausible basis but the specific "agenthub spec self-review caused direction drift" claim is not directly evidenced in D1-D8 text.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:47:- **[NBK-7]** F10 mechanism 5 (TASK_TRACKING_ROOT) is substantively justified: decision-log explicitly records the gap and D6 chooses full rollout.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:62:| Q4 | F10 Gate Soundness | warn | Mechanisms 4+5 mostly genuine; alignment mechanism (FR-ALIGN-001) missing separate F10 justification |
specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/checklists/requirements.md:59:| F7 推进与不可逆操作经人确认 | 无自动推进，人审在 SKILL.md 保留 | [x] 符合 |
specs/m13b-build-spec-deepening/checklists/requirements.md:62:| F10 反过度工程 | F10 四问已在 spec-ladder 判断中执行 | [x] 符合 |
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:28: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:29:   → SKILL.md must include F10 four-question in ladder judgment (FR-LADDER-002)
tasks/m13b-build-spec-deepening/artifacts/s5-prompt-direction.md:5:背景：workflowhub 是 AI 开发工作流编排工具，有一套宪法 CONSTITUTION（核心信条：薄核心窄契约、记事实不阻断、质量靠独立审查与人、不写阻断式质量门）。它的立项根因之一就是逃离前身系统 agenthub——agenthub 堆了约 9.5 万行 gate/校验代码，约一半提交在修 gate 死锁，宪法 F10 反例点名此事。
tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:4:workflowhub 是 AI 工作流编排工具，宪法核心：薄核心窄契约、记事实不阻断、质量靠独立审查与人、不写阻断式质量门。立项是为逃离前身 agenthub（堆 9.5 万行 gate 代码、半数提交修 gate 死锁，被宪法 F10 点名反例）。
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:19: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)
tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:4:workflowhub：AI 工作流编排工具，宪法核心=薄核心、记事实不阻断、质量靠独立审查与人、不写阻断式质量门。立项为逃离前身 agenthub（堆 9.5 万行 gate 代码、半数提交修 gate 死锁，宪法 F10 反例点名）。
tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:10:3. 删：agenthub 那 3 道门（退出门/审查门/推进门）整层删（检查内容已被 7 自检+纯净度扫描+异源审查覆盖）；TodoWrite 待办模板仪式、[DECOMP] 遥测、绑门自动写、重复行。
tasks/m13b-build-spec-deepening/artifacts/make-decision-original-context.md:19:- CONSTITUTION.md v1.1.0 已亲读：F4/F5/F10/Q1/Q2 明确禁止「阻断式质量门」；**F10 反例原文点名 agenthub 的 9.5 万行 gate 代码为永久警示**。【基准已读】
tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:13:| 最简 spec 阶梯（4 层决策闸） | 74-89 | 反过度工程，正对宪法 F10。决策闸非调研，便宜。 |
tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:37:| host 自动写 capture+stage_summary 绑 gate 的描述 | 18 | 绑在阻断门上的自动写仪式，门删了它也没意义。 |
tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:33: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:174: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:175:AssertionError: SKILL.md must include F10 four-question in ladder judgment (FR-LADDER-002)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:184:    158|   test("SKILL.md declares F10 four-question at ladder stage (FR-LADDER…
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:189:    162|       "SKILL.md must include F10 four-question in ladder judgment (FR-…
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:33: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-02: spec-ladder A/B/C 档 > SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)
tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:12:**这正是 workflowhub 生来要逃离的东西**——CONSTITUTION F10 反例原文点名："某前身系统为追求一切机器可自动校验，堆出约 9.5 万行 gate/校验代码……约一半代码提交都在修 gate 本身的死锁与漏洞"。该前身系统 = agenthub。
tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:20:| 1 | 退出检查门 gate.sh stage_exit（没过不能进） | **违 F4/F5/F10/Q2** | 不可照搬。改：6 条检查照跑，结果记事实+浮现边界，**不阻断**；推进由人确认（F7） |
tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:25:| 6 | stage_advance 关 post_review_pass | **违 F4/F5/F7/Q1** | 不可照搬。推进经人确认即可（F7），不要自动 gate |
tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:31:- **必须改造（违宪，不可照搬）**：stage_exit 门、post_review_pass 门、stage_advance 门 → 3 道 blocking gate。照搬即违 F4/F5/F7/F10/Q1/Q2，且违 CLAUDE.md 硬规则「不引入会阻断推进的质量门」。
tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:36:照搬 blocking gate = 推翻 workflowhub 立项根因，需走 CONSTITUTION governance 修宪（改 F4/F5/F10/Q1/Q2）。这是大决定，不能由 make-decision 默默执行。见 talk 问题 A/B。

codex
刚才先扫到了历史 review 归档，里面保留了旧问题文本，不能作为本轮判据。我现在只看执行文件 `workflows/build-spec/SKILL.md` 的 Section 6/7 和 checkpoint。
exec
/bin/bash -lc 'rg -n "''^##|''^###|F10|HUMAN_REVIEW_CHECKPOINT|pruned|pruning|prune|re-prune|裁剪后|裁剪|remove|auto-?remove|automatic changes|阻断|blocking|不得继续|不能继续|停止" workflows/build-spec/SKILL.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
9:## Goal
13:## 全局参数与产出约定
15:### 环境变量与参数约定（FR-TRACKING-001/002，FR-TASKDIR-001）
17:#### TASK_TRACKING_ROOT
22:- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
23:- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
26:#### --task-dir 参数约定（FR-TASKDIR-001）
36:### Spec 三层结构要求（FR-STRUCTURE-001/002）
48:### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING-001）
58:### AC 计数与 spec-acceptance-count.json 产出（FR-ACCOUNT-001）
76:## What to do
78:### 0. Pre-read: decision-log
82:### 1. Metrics: stage start
86:### 1.5. spec-ladder 档位判断（FR-LADDER-001/002）
94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
102:### 2. spec-specify: first-draft spec
110:### 3. spec-clarify: ambiguity scan and interactive refinement
118:### 3.5. scope-triage 高危词浮现（FR-SCOPETRIAGE-001）
120:spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
122:**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
127:- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
131:### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
147:### 3.7. 异源 3rd-review 独立审查（FR-REVIEW-001/002）
152:- 审查失败/不可用时降级记录 unknown + 原因，不阻断
158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
162:1. **scope 边界**：本次 spec 的 IN/OUT scope 及裁剪机制列表
168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
172:### 3.9. 交互规范（FR-COMM-001/002）
182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
184:#### [FRICTION] 摩擦捕获（FR-FRICTION-001）
192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
198:#### FR 场景行为验证（FR-BEHAV-001/002）
205:### 4. Constitution compliance check
207:Read `constitution-checklist.md`. Check all 21 items (F1–F10, Q1–Q3, S1–S8) against the spec produced so far. For every item write `[x]` (compliant) or `[ ]` (non-compliant) with a concrete rationale sentence. No item may be left unmarked or without a rationale — all 21 must be present.
211:**Framework (F1–F10)**:
214:- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
221:- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。
224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
225:- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
242:### 5. Baseline comparison
256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
263:### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
265:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
267:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
274:If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", **record the finding in the quality contract (item 4: 未解风险) and surface to human** — do not automatically remove the mechanism. The human at the review checkpoint decides whether to prune.
276:This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
278:### 7. Human review checkpoint
280:After spec-specify output, spec-clarify refinement, F10 analysis (findings recorded), constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. The spec has not been automatically altered; the human sees it as produced by spec-specify → spec-clarify, with F10 findings surfaced alongside for their review:
282:> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪（F10 反过度工程分析已完成，findings 已记录），请确认后继续：
283:> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新后的 spec，附 F10 findings 供参考）
291:## Produce a stage-result

exec
/bin/bash -lc "sed -n '1,360p' workflows/build-spec/SKILL.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
---
name: build-spec
version: 2.0.0
description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
---

# build-spec

## Goal

Translate the decision log from `make-decision` into a full spec via an orchestrated pipeline. The spec becomes the sole authority that later stages (plan, code, verify) refer to.

## 全局参数与产出约定

### 环境变量与参数约定（FR-TRACKING-001/002，FR-TASKDIR-001）

#### TASK_TRACKING_ROOT

全局环境变量 `TASK_TRACKING_ROOT` 约定所有阶段跟踪文件的存储根目录：

- **默认值**：`~/Knowledge/workflowhub/`（若变量未设置则使用此默认路径）
- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
- **禁止绕过（FR-TRACKING-002）**：所有 stage（包括 spec-specify、spec-clarify 等）必须通过 `TASK_TRACKING_ROOT` 获取跟踪文件路径，禁止硬编码绝对跟踪路径

#### --task-dir 参数约定（FR-TASKDIR-001）

`--task-dir` 控制本次运行的任务目录，所有输入/产物路径均基于它推导：

- **路径推导**：`{task-dir}/decision-log.md` 为输入；`specs/{task-id}/` 为产物目录
- **参数缺失时**：回退到 `tasks/{task-id}/` 默认路径并记录 warn（不依赖 cwd 猜测）
- **严禁 cwd 猜测**：路径推导不得依赖当前工作目录

---

### Spec 三层结构要求（FR-STRUCTURE-001/002）

build-spec 产出的 spec.md 必须按以下三层结构组织：

- **层 1 — 速读卡**（文件顶部 30 行内）：一句话需求 + 核心改动，让读者 30 秒看懂
- **层 2 — 正文**：问题陈述 / 背景 / FR / AC / 影响范围
- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策

**Known Gaps 段（FR-STRUCTURE-002）**：spec.md 中 Known Gaps 段必须存在（可为空列表），记录本次有意留白、未覆盖或留待后续的事项。

---

### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING-001）

build-spec 产出的所有功能需求必须使用 `FR-{DOMAIN}-NNN` 格式：

- **DOMAIN**：大写领域缩写（BUILD/CONTRACT/LADDER/STRUCTURE/SELFCHECK/REVIEW/BEHAV/FRICTION/TASKDIR/TRACKING/NUMBERING/ACCOUNT/ARTIFACT/COMM/SCOPETRIAGE/ALIGN）
- **NNN**：3 位数字（001 起）
- **示例**：`FR-BUILD-001`，`FR-SELFCHECK-002`

---

### AC 计数与 spec-acceptance-count.json 产出（FR-ACCOUNT-001）

build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：

```json
{
  "ac_count": <int>,
  "fr_count": <int>,
  "counted_at": "<ISO8601 string>"
}
```

- 三字段（`ac_count`、`fr_count`、`counted_at`）不可为 null
- `counted_at` 为产出时刻 ISO8601 时间戳
- 计数方法：grep spec.md 统计 AC- 和 FR- 条目数

---

## What to do

### 0. Pre-read: decision-log

Read `{--task-dir}/decision-log.md` — the upstream `make-decision` output (default path when `--task-dir` absent: `tasks/{task-id}/decision-log.md`, per FR-TASKDIR-001). Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.

### 1. Metrics: stage start

At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.

### 1.5. spec-ladder 档位判断（FR-LADDER-001/002）

在调用 spec-specify 前，基于 decision-log 描述的功能复杂度做档位判断，输出档位选择依据记入 spec 序言：

- **A 档**（小改动）：单文件或配置调整，影响面窄；速读卡足够，正文后三章可豁免
- **B 档**（中等）：跨模块改动或新增机制；需完整三层 spec
- **C 档**（大改动）：跨系统边界、新引入外部依赖或破坏性变更；完整三层 spec + 额外影响范围分析

F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
1. What real threat does this defend against?
2. Does any existing mechanism already cover it?
3. Can it be bypassed, making it security-theatre?
4. What is the long-term maintenance cost?

---

### 2. spec-specify: first-draft spec

Invoke `skills/spec-specify/SKILL.md` (spec-specify):

- **Input**: task-id (from the current stage context) and the functional description text extracted from the decision-log.
- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
- If spec-specify reports failure or the output files are missing, stop and surface the error — do not proceed to spec-clarify.

### 3. spec-clarify: ambiguity scan and interactive refinement

Invoke `skills/spec-clarify/SKILL.md` (spec-clarify):

- **Input**: task-id (or the explicit spec path `specs/{task-id}/spec.md`).
- **Expected behaviour**: 10-dimension ambiguity scan, up to 5 interactive clarification questions (one at a time), incremental spec updates after each accepted answer, and a coverage summary at completion.
- If spec-clarify reports the spec file is not found, stop — run spec-specify first.

### 3.5. scope-triage 高危词浮现（FR-SCOPETRIAGE-001）

spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：

**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`

命中时：
- 浮现命中位置 + 建议修改（供人工确认是文档示例还是执行语义）
- 记录进质量事实契约第 4 项（未解风险）
- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）

---

### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）

spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：

1. spec-ladder 档位已声明且有依据
2. 所有 FR 使用 `FR-{DOMAIN}-NNN` 格式
3. 每个 FR 至少有一条 Given/When/Then 场景
4. 五章硬门完整（速读卡 / FR / 不做 / 验收 / 影响范围）——A 档可豁免后三章
5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
6. 无 `[NEEDS CLARIFICATION]` 残留（或全部标明已解决/延后理由）
7. Known Gaps 段存在

**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。

---

### 3.7. 异源 3rd-review 独立审查（FR-REVIEW-001/002）

spec 初稿完成后，调用异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），在独立上下文产出 verdict + findings：

- 结论记入质量事实契约第 3 项（独立审查摘要路径）
- 审查失败/不可用时降级记录 unknown + 原因，不阻断
- **禁止自审自判（FR-REVIEW-002）**：不得使用单一 AI 切换视角替代异源独立审查
- 可 grep 到 `3rd-review` 或 `异源独立审查`

---

### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）

完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：

1. **scope 边界**：本次 spec 的 IN/OUT scope 及裁剪机制列表
2. **自检结果**：7 条自检 + Spec-Purity grep 的 pass/warn/unknown 汇总
3. **独立审查摘要**：异源 3rd-review 的 verdict + findings 摘要路径
4. **未解风险**：已知缺口、摩擦记录（`[FRICTION]` 格式，见下节）、scope-triage 高危词命中、spec↔decision-log 差异
5. **handoff required_reads**：下游阶段必读文件清单

**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。

---

### 3.9. 交互规范（FR-COMM-001/002）

build-spec 产出过程中必须遵守以下交互规范：

**REQ-COMM-01（FR-COMM-001）**：对编排者的所有提问或选项，必须使用大白话说明选项后果，不让编排者猜。格式：列出选项 A/B/C + 每个选项的后果一句话。禁止含糊带过选项差异。

**REQ-COMM-02（FR-COMM-002）**：每完成主要步骤后，主动汇报进度：做了什么 / 下一步是什么 / 需要编排者做什么。不等对方追问。

---

### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）

#### [FRICTION] 摩擦捕获（FR-FRICTION-001）

发现任何流程卡点时，立即记录 `[FRICTION]` 条目：

```
[FRICTION] <触发时机简述>: <卡点描述> | 建议: <可选>
```

条目写入质量事实契约第 4 项（未解风险），不阻断推进。

#### Artifact-First 只传路径（FR-ARTIFACT-001）

长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。

#### FR 场景行为验证（FR-BEHAV-001/002）

- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）

---

### 4. Constitution compliance check

Read `constitution-checklist.md`. Check all 21 items (F1–F10, Q1–Q3, S1–S8) against the spec produced so far. For every item write `[x]` (compliant) or `[ ]` (non-compliant) with a concrete rationale sentence. No item may be left unmarked or without a rationale — all 21 must be present.

The 21 items are:

**Framework (F1–F10)**:
- [ ] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。
- [ ] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。
- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。
- [ ] **F6 统一外置执行记录** — 判据：进度/指标/回溯是否统一记录、可回溯。
- [ ] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作是否经人边界确认。
- [ ] **F8 简单优先** — 判据：是否选更简单依赖更少的方案、不写掩盖问题的兜底。
- [ ] **F9 可证伪不假绿** — 判据：检查是否在"实际为假"时真报失败、缺数据标未知。
- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。

**Quality (Q1–Q3)**:
- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
- [ ] **Q3 异源审查加人工把关** — 判据：质量裁决是否由独立来源独立上下文产出、无自审自判。

**Skills (S1–S8)**:
- [ ] **S1 能用外部就不造轮子** — 判据：通用能力是否优先复用外部、文件直放项目内。
- [ ] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。
- [ ] **S3 迭代时保持最新并就地检查** — 判据：迭代时是否查更新/更优、来源路径写进技能文件。
- [ ] **S4 自定义技能必须有指标系统** — 判据：自研技能是否配套指标、纳入统一执行记录。
- [ ] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能是否便于子代理调用、减少主上下文占用。
- [ ] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能是否参考成熟方案优化。
- [ ] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。
- [ ] **S8 自定义技能可独立调用可搬运** — 判据：自研技能是否可独立调用、可跨宿主搬运、不绑死环境。

**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).

Write the completed checklist as an appendix to the spec or as a standalone file `specs/{task-id}/constitution-check.md`.

### 5. Baseline comparison

Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:

| Metric | M11 Actual | M10 Baseline | Direction Delta |
| ------ | ---------- | ------------ | --------------- |
| missed_step_rate | <M11 actual> | 0.05 | <delta> |
| test_execution_rate | <M11 actual> | 0.8295 | <delta> |
| review_execution_rate | <M11 actual> | 1 | <delta> |
| rework_rounds | <M11 actual> | 6.075 | <delta> |
| rework_proxy_count | <M11 actual> | 25.25 | <delta> |

- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
- **If a metric cannot be computed from available data, write `unknown` in the M11 Actual cell and state the missing-data reason in a note below the table. Never fabricate a value.** A fabricated actual is a false-green (violates F9); a real `unknown` is honest.
- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
- The direction delta indicates whether the metric moved favourably (e.g. fewer rework rounds is better, higher test execution rate is better). For an `unknown` actual, the delta is also `unknown`.
- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.

Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.

### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)

This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).

Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).

1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). Hypothetical threats do not justify new infrastructure.
2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before keeping something new. Duplication is waste.
3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
4. **What is the long-term maintenance cost?** — Every mechanism kept here must be maintained across all future changes. High ongoing cost is a signal worth surfacing.

If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", **record the finding in the quality contract (item 4: 未解风险) and surface to human** — do not automatically remove the mechanism. The human at the review checkpoint decides whether to prune.

This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.

### 7. Human review checkpoint

After spec-specify output, spec-clarify refinement, F10 analysis (findings recorded), constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. The spec has not been automatically altered; the human sees it as produced by spec-specify → spec-clarify, with F10 findings surfaced alongside for their review:

> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪（F10 反过度工程分析已完成，findings 已记录），请确认后继续：
> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新后的 spec，附 F10 findings 供参考）
> - 宪法符合性检查清单（constitution-checklist.md 21 条逐条勾选）
> - M11 vs M10 baseline 对照表（5 项指标）
>
> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。

The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently alter the spec — what the human confirmed is what gets recorded.

## Produce a stage-result

When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "spec_ref": "<relative path to spec.md>",
    "requirements": "<comma-separated list of FR identifiers or one-line summary>"
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "Spec written via spec-specify → spec-clarify → constitution check → baseline comparison, confirmed at human review checkpoint."
}
```

Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "build-spec",
  "stage": "build-spec",
  "skill_version": "2.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": false,
  "friction_ref": null
}
```

These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.

At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.

exec
/bin/bash -lc 'rg -n "pruned|pruning|裁剪后|re-prune|auto-?remove|自动删除|自动移除|automatic changes|remove mechanism|机制移除|阻断条件|blocking condition|stop|停止|不得继续|不能继续|gate" workflows/build-spec tests specs/m13b-build-spec-deepening/tasks.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
specs/m13b-build-spec-deepening/tasks.md:17:- [ ] T001 在 `workflows/build-spec/SKILL.md` 新增「环境变量与参数约定」节：定义 `TASK_TRACKING_ROOT` 变量（默认值 `~/Knowledge/workflowhub/`、降级行为、warn 不停止）和 `--task-dir` 参数约定（路径推导规则，不依赖 cwd 猜测，缺失时回退默认路径并 warn）。FR: FR-TRACKING-001, FR-TRACKING-002, FR-TASKDIR-001 (stage:1, depends:无)
specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
workflows/build-spec/SKILL.md:22:- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
workflows/build-spec/SKILL.md:23:- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
workflows/build-spec/SKILL.md:80:Read `{--task-dir}/decision-log.md` — the upstream `make-decision` output (default path when `--task-dir` absent: `tasks/{task-id}/decision-log.md`, per FR-TASKDIR-001). Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.
workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
workflows/build-spec/SKILL.md:108:- If spec-specify reports failure or the output files are missing, stop and surface the error — do not proceed to spec-clarify.
workflows/build-spec/SKILL.md:116:- If spec-clarify reports the spec file is not found, stop — run spec-specify first.
workflows/build-spec/SKILL.md:122:**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
workflows/build-spec/SKILL.md:127:- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
workflows/build-spec/SKILL.md:168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
workflows/build-spec/SKILL.md:216:- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。
workflows/build-spec/SKILL.md:225:- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
workflows/build-spec/SKILL.md:263:### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
workflows/build-spec/SKILL.md:265:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
workflows/build-spec/SKILL.md:267:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
workflows/build-spec/SKILL.md:276:This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
tests/m12-spec-analyze.test.mjs:378:    const hasOverflow = /overflow|summary|余|截断|超过|aggregate|excess/i.test(content);
tests/m12-spec-analyze.test.mjs:395:      "skills/spec-analyze/SKILL.md must include constitution-alignment as a named detection/scan category (RECORD-only, not a blocking gate)"
tests/m13b-build-spec-deepening.test.mjs:30:  test("SKILL.md states warn-not-stop behaviour for missing TASK_TRACKING_ROOT", () => {
tests/m13b-build-spec-deepening.test.mjs:33:      "SKILL.md must declare warn (not stop) on missing TASK_TRACKING_ROOT (FR-TRACKING-001)");
tests/m13b-build-spec-deepening.test.mjs:301:  test("SKILL.md does NOT use gate.sh as an active execution call", () => {
tests/m13b-build-spec-deepening.test.mjs:302:    assert.ok(!skill().includes("gate.sh"),
tests/m13b-build-spec-deepening.test.mjs:303:      "gate.sh must not appear as active mechanism in SKILL.md (AC-21/AC-16)");
tests/m13b-build-spec-deepening.test.mjs:305:  test("SKILL.md does NOT use post_review_pass as an active gate", () => {
tests/m12-build-plan-v1.test.mjs:383:// T018(f): F10 4-question gate present (all 4 question strings)
tests/m12-build-plan-v1.test.mjs:384:describe("T018: F10 anti-over-engineering gate — all 4 questions present", () => {
tests/m12-build-plan-v1.test.mjs:428:  test("F10 cautionary example preserved (95,000 lines of gate code)", () => {
tests/m12-build-plan-v1.test.mjs:432:      "SKILL.md must retain F10 cautionary example text about ~95,000 lines of gate code"
tests/m12-subskill-exclusion.test.mjs:2: * m12-subskill-exclusion.test.mjs — Guard test for sub-skill marker-gated
tests/m12-subskill-exclusion.test.mjs:11: *       marker-gated, not a blanket "skip if unwired").
tests/m12-subskill-exclusion.test.mjs:13: * Proves the exclusion is marker-gated, not a blanket bypass.
tests/m12-subskill-exclusion.test.mjs:56:    // Marker-gated skip: kind:sub-skill → found:false even without wiring
tests/stage-result-contract.test.mjs:164:      reason: "gate blocked on missing reviewer output",
tests/stage-result-contract.test.mjs:184:      reason: "gate blocked",
tests/stage-result-contract.test.mjs:194:// decision WITHOUT throwing and WITHOUT turning the schema into a runtime gate.
tests/stage-result-contract.test.mjs:200:// never throws on a present object and never blocks (FR-RESULT-003: not a gate).
tests/stage-result-contract.test.mjs:226:      reason: "transient gate timeout",
tests/stage-result-contract.test.mjs:254:  it("consumer only reads fields and returns a decision — it never blocks or throws on a well-formed schema (FR-RESULT-003: not a runtime gate)", () => {
tests/m12-spec-tasks.test.mjs:78:      body.includes("停止执行") ||
tests/boundary-confirm.test.mjs:64:    it(`state=${state}: returns continue result and writes source-gated boundary_decisions`, () => {
tests/boundary-confirm.test.mjs:87:      // Source-gated: must carry source tag (FR-EXECREC-004)
tests/knowledge-card.test.mjs:5: *   - recorded once per occurrence, no threshold (the validator never gates on count).
tests/knowledge-card.test.mjs:30:    type: "gate_deadlock",
tests/knowledge-card.test.mjs:32:    root_cause: "gate scanned wrong repo",
tests/knowledge-card.test.mjs:103:    expect(normalizeCardType("gate_deadlock")).toBe("gate_deadlock");
tests/knowledge-card.test.mjs:109:    // a single card validates exactly the same as any other — no count field gates it
tests/knowledge-card.test.mjs:119:      memory_ref: ["m4-cross-repo-gate"],
tests/stage-quality.test.mjs:113:    throw new Error("gate blocked: code is not small enough");
tests/m12-templates.test.mjs:67:      "plan-template.md must contain F10 gate heading");
tests/m12-templates.test.mjs:75:  test("plan-template.md contains F10 4-question gate table columns", () => {
tests/m12-templates.test.mjs:82:      "plan-template.md must list all 4 F10 gate questions: real threat, existing cover, bypassable, maintenance cost");
tests/five-skills-present.test.mjs:139:  test("build-spec contains the 'what real threat' question (anti-over-engineering gate)", () => {
tests/five-skills-present.test.mjs:141:    // Must contain one of the four gate questions about real threat / true cost
tests/five-skills-present.test.mjs:150:      "build-spec/SKILL.md must ask about real threat defended against (F10 four-question gate)"
tests/five-skills-present.test.mjs:154:  test("build-spec contains maintenance cost question (anti-over-engineering gate)", () => {
tests/five-skills-present.test.mjs:163:      "build-spec/SKILL.md must ask about long-term maintenance cost (F10 four-question gate)"
tests/five-skills-present.test.mjs:179:  test("build-plan contains real-threat question (anti-over-engineering gate)", () => {
tests/five-skills-present.test.mjs:189:      "build-plan/SKILL.md must ask about real threat defended against (F10 four-question gate)"
tests/five-skills-present.test.mjs:193:  test("build-plan contains maintenance cost question (anti-over-engineering gate)", () => {
tests/five-skills-present.test.mjs:202:      "build-plan/SKILL.md must ask about long-term maintenance cost (F10 four-question gate)"
tests/m13-make-decision.test.mjs:561:      "S3 dual-empty stop flow must write an artifacts file containing dual_research_empty: true (FR-RESEARCH-03)"
tests/m13-make-decision.test.mjs:565:  test("S3 dual-empty stops flow — does not synthesize summary (FR-RESEARCH-03)", () => {
tests/m13-make-decision.test.mjs:570:    // The section around dual_research_empty must contain stop/report/wait semantics
tests/m13-make-decision.test.mjs:572:    const hasStop = window.includes("停止") || window.includes("stop") || window.includes("不得进入") || window.includes("halt");
tests/m13-make-decision.test.mjs:577:      "S3 dual_research_empty branch must contain stop semantics (停止/stop/不得进入/halt)"
tests/m13-make-decision.test.mjs:594:    // as an unconditional sibling after the dual_research_empty stop block.
tests/m13-make-decision.test.mjs:595:    // Specifically: the dual_research_empty stop branch must precede the summary step
tests/m13-make-decision.test.mjs:602:    // The stop/wait block around dual_research_empty must come BEFORE any
tests/m13-make-decision.test.mjs:888:  test("S5 forbids the old pairwise-distinct source_family gate", () => {
tests/m13-make-decision.test.mjs:987:      s5Section.includes("停止合并") ||
tests/m13-make-decision.test.mjs:988:      s5Section.includes("stops merging");
tests/m13-make-decision.test.mjs:1003:  test("S5 has no source_family clash gate", () => {
tests/m13-make-decision.test.mjs:1010:      "S5 must not gate on source_family clash"
tests/m13-make-decision.test.mjs:1014:  test("S5 debate gate: delegates trigger decision to debate skill (not inline self-judgement)", () => {
tests/m13-make-decision.test.mjs:1022:      s5Section.includes("delegate") ||
tests/m13-make-decision.test.mjs:1024:    assert.ok(hasDelegation, "S5 debate gate must delegate trigger decision to debate skill, not use inline self-judgement");
tests/m13-make-decision.test.mjs:1031:    assert.ok(!hasInlineTrigger, "S5 debate gate must NOT use inline trigger conditions (条件A/B removed)");
tests/m13-make-decision.test.mjs:1034:  test("S5 debate gate: triggered output goes to tasks/{task-id}/artifacts/make-decision-debate-1.md", () => {
tests/m13-make-decision.test.mjs:1038:      "S5 debate gate must produce tasks/{task-id}/artifacts/make-decision-debate-1.md when triggered"
tests/m13-make-decision.test.mjs:1042:  test("S5 debate gate: not triggered records debate_1: skipped", () => {
tests/m13-make-decision.test.mjs:1050:  test("S5 debate gate: path unreachable records reason and degrades gracefully", () => {
tests/m13-make-decision.test.mjs:1199:  test("S7 grill delegates to grill-with-docs-lite (pure delegation)", () => {
tests/m13-make-decision.test.mjs:1203:      "S7 grill step must delegate to grill-with-docs-lite"
tests/m13-make-decision.test.mjs:1305:  test("S7 debate-2 delegates unconditionally to debate skill (no inline blocking check)", () => {
tests/m13-make-decision.test.mjs:1315:      "S7 must NOT gate debate-2 on blocking presence — delegate unconditionally to debate skill Step 1"
tests/m13-make-decision.test.mjs:1320:    assert.ok(hasSkipDebate, "S7 debate-2 gate must still handle MAKE_DECISION_SKIP_DEBATE");
tests/m13-make-decision.test.mjs:1321:    assert.ok(hasPathCheck, "S7 debate-2 gate must still handle MAKE_DECISION_DEBATE_PATH reachability");
tests/m13-make-decision.test.mjs:1328:    const delegatesToDebate =
tests/m13-make-decision.test.mjs:1333:      delegatesToDebate,
tests/m13-make-decision.test.mjs:1334:      "S7 must delegate to debate skill for trigger judgment, not self-judge based on blocking"
tests/m13-make-decision.test.mjs:1425:  test("S9 is the only mandatory hard gate in the flow (FR-ACCEPT-02)", () => {
tests/m13-make-decision.test.mjs:1433:      s9Section.includes("hard gate");
tests/m13-make-decision.test.mjs:1434:    assert.ok(hasHardGate, "S9 must be declared the only mandatory hard gate (FR-ACCEPT-02)");
tests/m13-make-decision.test.mjs:1668:// FIX-01: S5 debate gate — no inline五方/三档 conditions; delegate source-ID judgment to debate
tests/m13-make-decision.test.mjs:1669:describe("FIX-01: S5 debate gate delegates to debate skill, no inline mode decisions", () => {
tests/m13-make-decision.test.mjs:1670:  test("S5 debate gate does NOT inline 五方法庭/单人三档 mode selection logic", () => {
tests/m13-make-decision.test.mjs:1685:      "S5 must NOT inline 五方法庭/单人三档 mode selection — must delegate to debate skill"
tests/m13-make-decision.test.mjs:1689:  test("S5 debate gate does not self-skip on missing artifact-sourced finding IDs", () => {
tests/m13-make-decision.test.mjs:1700:  test("S5 debate gate passes finding ID list from artifacts to debate skill", () => {
tests/m13-make-decision.test.mjs:1713:      "S5 debate gate must pass artifact-based finding ID list to debate skill as 争点来源"
tests/m13-make-decision.test.mjs:1779:// FIX-04: FR-RESEARCH-03 dual-research-empty must truly stop, not silently continue
tests/m13-make-decision.test.mjs:1780:describe("FIX-04: FR-RESEARCH-03 dual-research-empty — true stop, not false-green", () => {
tests/m13-make-decision.test.mjs:1781:  test("S3 dual_research_empty stop flow includes artifacts entry dual_research_empty: true", () => {
tests/m13-make-decision.test.mjs:1788:      "S3 dual_research_empty stop flow must write artifacts with dual_research_empty: true field"
tests/m13-make-decision.test.mjs:1792:  test("S3 dual_research_empty stop flow must write s3_dual_research_empty journal event", () => {
tests/m13-make-decision.test.mjs:1796:      "S3 dual_research_empty stop flow must write journal event s3_dual_research_empty"
tests/m13-make-decision.test.mjs:1800:  test("S3 dual_research_empty stop flow must halt and wait for user instruction before S4", () => {
tests/m13-make-decision.test.mjs:1810:      "S3 dual_research_empty stop flow must require explicit user instruction before S4 — not auto-continue"
tests/m13-make-decision.test.mjs:1839:// FIX-05: debate source-ID validation is delegated to debate skill
tests/m13-make-decision.test.mjs:1840:describe("FIX-05: debate source-ID validation is delegated to debate skill", () => {
tests/m13-make-decision.test.mjs:1849:  test("S7 debate gate does not self-skip on missing orchestrator finding IDs", () => {

codex
`workflows/build-spec/SKILL.md` 里已没有“F10 自动删除机制”的执行指令；剩下的可疑点是 Section 6 仍保留 `prune` 这个词，但语义限定为 human checkpoint 后由人决定，不是自动裁剪。我再跑一次定向测试/关键词核对，确认不是遗漏。
exec
/bin/bash -lc 'rg -n "pruned|pruning|裁剪后|re-prune|auto-remove|automatically remove|automatic changes|do not auto-remove|prune|remove the mechanism|remove mechanism|机制裁剪|自动.*(删除|移除|裁剪)|F10.*(remove|prune|裁剪|移除|删除)" workflows/build-spec/SKILL.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
265:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
267:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
274:If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", **record the finding in the quality contract (item 4: 未解风险) and surface to human** — do not automatically remove the mechanism. The human at the review checkpoint decides whether to prune.

exec
/bin/bash -lc "nl -ba workflows/build-spec/SKILL.md | sed -n '258,288p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
   258	- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
   259	- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
   260	
   261	Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
   262	
   263	### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
   264	
   265	This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
   266	
   267	Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
   268	
   269	1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). Hypothetical threats do not justify new infrastructure.
   270	2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before keeping something new. Duplication is waste.
   271	3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
   272	4. **What is the long-term maintenance cost?** — Every mechanism kept here must be maintained across all future changes. High ongoing cost is a signal worth surfacing.
   273	
   274	If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", **record the finding in the quality contract (item 4: 未解风险) and surface to human** — do not automatically remove the mechanism. The human at the review checkpoint decides whether to prune.
   275	
   276	This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
   277	
   278	### 7. Human review checkpoint
   279	
   280	After spec-specify output, spec-clarify refinement, F10 analysis (findings recorded), constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. The spec has not been automatically altered; the human sees it as produced by spec-specify → spec-clarify, with F10 findings surfaced alongside for their review:
   281	
   282	> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪（F10 反过度工程分析已完成，findings 已记录），请确认后继续：
   283	> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新后的 spec，附 F10 findings 供参考）
   284	> - 宪法符合性检查清单（constitution-checklist.md 21 条逐条勾选）
   285	> - M11 vs M10 baseline 对照表（5 项指标）
   286	>
   287	> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
   288	

exec
/bin/bash -lc 'npm test -- --run tests/m13b-build-spec-deepening.test.mjs' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 484ms:

 RUN  v2.1.9 /Users/Hugh/Hugh/Project/workflowhub

 ✓ tests/m13b-build-spec-deepening.test.mjs (55 tests) 8ms

 Test Files  1 passed (1)
      Tests  55 passed (55)
   Start at  16:44:57
   Duration  199ms (transform 14ms, setup 0ms, collect 14ms, tests 8ms, environment 0ms, prepare 38ms)


codex
pass

B1 is closed for Section 6/7.

Verified against [workflows/build-spec/SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:263):

- Section 6 now says F10 only records findings and is non-blocking: [line 265](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:265)
- Missing/weak F10 answers now produce warning + human review surfacing, not removal: [line 267](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:267)
- High-risk F10 answers are recorded in quality contract item 4 and surfaced to human, with explicit “do not automatically remove”: [line 274](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:274)
- Section 7 says the spec has not been automatically altered and F10 findings are only surfaced for review: [line 280](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:280)
- `HUMAN_REVIEW_CHECKPOINT` text is now “F10 反过度工程分析已完成，findings 已记录”: [line 282](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:282)

One note: the word `prune` still exists once in “The human at the review checkpoint decides whether to prune.” That is not an auto-remove/blocking semantic because it is explicitly human-decided and follows “do not automatically remove the mechanism.” I do not treat it as B1 blocking.

Verification run:

```text
npm test -- --run tests/m13b-build-spec-deepening.test.mjs
55 passed
```

Final verdict: `pass`
hook: Stop
hook: Stop Completed
tokens used
71,217

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
