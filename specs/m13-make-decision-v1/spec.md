# 功能规格：M13 make-decision 深化

**功能名**: `m13-make-decision-v1`
**来源**: 上游 decision-log `tasks/m13-make-decision-v1/decision-log.md`
**状态**: 草稿（spec-specify 初稿）

---

## 速读卡（30 秒看懂这个需求）

- **一句话需求**：将 make-decision 从 M7 的两步骤（scope-triage + decision-log）升级为带五类护城河动作的 12 步深化流程，保证"在做正确的事"的决策质量。
- **核心改动点**：
  1. 新增双路外部调研（muyu-search-mcp + anysearch，条件触发）
  2. 新增三角度异源盲审（3rd-review 链，非阻断）
  3. 新增 talk-with-zhipeng 三轮交互（一次一问，按影响排序）
  4. 新增 grill-with-docs-lite 逐层追问
  5. 新增 debate 方向辩论（可选外部 skill，注册 reuse-registry）
- **最大影响面**：`skills/make-decision/SKILL.md`（全面重写）及对应的 artifacts 产物目录
- **验收信号**：S9 用户明确批准后 decision-log 落盘；五类护城河动作均可在 dogfooding 中独立触发并留下可追溯产物

---

## 1. 问题陈述

**当前**：M7 版 make-decision 只有 scope-triage + decision-log 两步，所有判断依赖单次单源推理，无外部调研、无异源审查、无对话收敛、无逐层追问、无方向级辩论。

**问题**：决策日志质量依赖主 agent 单次上下文，护城河不足——重要方向可被静默丢弃、盲区未被发现、过早钻入实现细节。

---

## 2. 背景、目标和边界

### 背景

make-decision 是工作流第一阶段，决策质量直接决定后续所有阶段的价值。M13 继承 M7 已有 scope-triage 和 decision-log 不变，在其基础上增加五类护城河动作（D1–D5）并保证全程非阻断（D5）。

### 目标

- 12 步深化流程可完整跑通（S0–S10）
- 五类护城河动作均可独立触发和跳过（非阻断）
- 唯一硬门控 S9 由用户明确批准，可通过 decision-log 落盘状态验证
- debate 外部 skill 在 reuse-registry 登记

### 边界

**在范围内**：
- 12 步流程剧本（S0–S10）
- 双路外部调研（muyu-search-mcp + anysearch）
- 三角度异源盲审（intake-direction-review / intake-framing-challenge / intake-scope-review，走 3rd-review）
- talk-with-zhipeng 三轮（S2/S4/S7）
- grill-with-docs-lite（S7）
- debate（EXTERNAL `/Users/Hugh/Hugh/Project/debate`，可选）
- 台账 D28（两个渲染点，禁止静默丢弃）
- 6 个 env var（可选，有安全默认值和降级路径）
- metrics 记录（recordSkeleton + updateOwnResult）
- S9 硬门控（唯一强制确认点）

**不在范围内**：
- 改下游阶段（build-spec / build-plan / build-code / verify-code）
- blocking gate（S9 以外的任何阻断门）
- debate 内部实现（外部 skill，原样调用）
- 强制 historical-lessons-used 校验
- agenthub route-review.mjs 作为调研来源

---

## 3. 12 步流程功能需求

### FR-FLOW-01：12 步流程完整顺序
**决策来源**：D1（流程排序）
**描述**：make-decision skill 必须按以下固定顺序执行 12 步（S0、S0.5、S1–S10），每步完成后才可推进到下一步：
1. S0：背景扎根（读 project-memory / ADR / 已有 decision-log / conversation history）
2. S0.5：scope-triage（分档：lite / full；lite 档可跳过 S1 内部调研和 S3 外部调研）
3. S1：内部调研（≥3 parallel sub-agents；仅 full 档执行；产出写入 `tasks/{task-id}/research/` 下的内部调研摘要，供 S2 talk#1 输入）
4. S2：talk-with-zhipeng 第 1 轮（基于 S1 内部调研结果，门控外部调研）
5. S3：条件性双路外部调研（仅 full 档且 S2 确认需要时触发）
6. S4：talk-with-zhipeng 第 2 轮 + 方向基线确认（记录模式，非阻断对话检查点）+ 原始需求落盘
7. S5：三角度并行盲审 + 第一次 debate 门控
8. S6：给用户看盲审/debate 结果
9. S7：talk-with-zhipeng 第 3 轮（talk#3）+ grill-with-docs-lite + decision-log 草稿 + intake-review-orchestrator（漂移/盲点/细节）+ 第二次 debate 门控
10. S8：同步 CONTEXT / ADR / project-memory
11. S9：方向确认硬门控（用户明确批准）——唯一强制 gate
12. S10：落盘 decision-log

**验收标准**：每步在 journal 中有 `skill_called` 或 `stage_enter/exit` 事件；步骤未完成时不得推进到下一步。

### FR-FLOW-02：档位路由（lite / full）
**决策来源**：D1
**描述**：scope-triage 产出档位；lite 档跳过 S1 内部调研和 S3 外部调研，直接从 S2 开始（以空内部调研上下文进入 talk#1）。档位决定写入 artifacts/scope-triage-result.md，后续步骤读取该文件做分支。

**验收标准**：lite 档时 S1 和 S3 对应 journal 事件分别记录 `skipped: scope=lite`；full 档时 S1 必须执行；S3 仅在 S2/talk#1 门控外部调研为"需要"时执行，否则记录 `skipped: s2_gate=no_external_research` （非阻断）。

---

## 3.5 S1 内部调研功能需求

### FR-RESEARCH-00：S1 内部调研（full 档专属）
**决策来源**：D1（S1 内部调研在 S2 talk#1 之前），decision-log §3 D1
**描述**：S1 在 scope-triage 判定为 full 档后、S2 talk#1 之前执行。要求：
- 并发派发 **≥3 个 parallel sub-agents**，分别覆盖以下五类内容（可跨 agent 分组）：
  1. 领域背景与术语澄清
  2. 类似决策的历史先例与经验教训
  3. 当前 codebase 相关实现（约束、接口、路由）
  4. 外部生态最佳实践参考
  5. 已知风险与反向案例
- 产出写入 `tasks/{task-id}/research/internal-research-summary.md`，格式包含：每类来源标记、sub-agent 执行记录、汇总结论。
- S2 talk#1 **必须以该文件内容为上下文输入**，在提问前先向用户呈现内部调研摘要。
- **失败行为**：若任一 sub-agent 失败，记录失败 agent ID 和原因到 `internal-research-summary.md` 中，继续执行其余 agents 的输出合并；若全部 agents 失败，记录 `s1_all_agents_failed: true`，继续推进到 S2（非阻断，告知用户内部调研失败原因）。

**验收标准**：`tasks/{task-id}/research/internal-research-summary.md` 存在，包含 ≥3 个 sub-agent 执行记录；journal 有 `s1_complete` 事件；S2 consultation.md 中包含内部调研摘要引用。

---

## 4. 双路外部调研功能需求

### FR-RESEARCH-01：muyu-search-mcp 调用规范
**决策来源**：D2（双路调研设计），skill-reuse-classification.md §1，decision-log §6 OPEN-1 已解决
**描述**：调用 muyu-search-mcp 时必须显式传入 `extra_sources >= 3`（绝不使用默认值 0，默认值导致纯幻觉）。调用完成后必须调用 `get_sources` 核实真实来源；若 `get_sources` 无法核实任何来源，**立即停下，向用户报告失败原因，等待用户明确指令**（继续单路 / 重试 / 中止）。不得自动降级、不得将无来源内容作为调研结果使用、不得静默继续。

**验收标准**：`artifacts/make-decision-background-research.md` 中 muyu 路径包含 `get_sources` 核实结果；若 `get_sources` 核实失败，journal 记录 `muyu_get_sources_failed: true` 并停止等待用户指令，不存在自动降级的合成摘要。

### FR-RESEARCH-02：anysearch 调用规范
**决策来源**：D2
**描述**：anysearch 走 `/Users/Hugh/.claude/skills/anysearch/SKILL.md`（v2.1.0）；调研结果写入 `artifacts/make-decision-background-research.md`。

**验收标准**：artifacts 文件存在且包含 anysearch 来源标记（`source: anysearch`）。

### FR-RESEARCH-03：双路返空即停
**决策来源**：D2
**描述**：muyu 和 anysearch 两路调研结果若均返回空内容（无有效信息），立即停止并在 artifacts 记录 `dual_research_empty: true`，不得继续合成虚假调研摘要。

**验收标准**：两路均空时 artifacts 有 `dual_research_empty: true`，不存在合成摘要。

---

## 5. 三角度盲审功能需求

### FR-REVIEW-01：三角度异源盲审
**决策来源**：D3（盲审异源设计，无同源降级）
**描述**：三个审查角度统一走 3rd-review 异源链（**严禁同源降级**），各自独立产出 checkpoint 文件：
- `intake-direction-review`：方向盲审；输入：原始需求基线
- `intake-framing-challenge`：框架挑战；输入：提案框架
- `intake-scope-review`：范围审查；输入：范围声明

每个角度的 reviewer checkpoint 文件必须记录以下字段（机器可校验）：
- `reviewer_runtime_id`：唯一执行实例标识，三个角度不得相同
- `reviewer_source`：审查 agent 的来源描述（如模型名称、skill 路径）
- `source_family`：来源家族标签（如 `claude`, `codex`, `gemini`, `local-script`），三个角度必须来自**3 个不同的 source_family**
- `fallback_used`：`false`；若任一角度触发同源降级（source_family 与另一角度相同），立即记录 `fallback_used: true` 并**视为该角度审查失败**，不得使用其结果，停下报告用户。

**验收标准**：三个 checkpoint 文件均存在，各含 `reviewer_runtime_id`、`reviewer_source`、`source_family`、`fallback_used` 字段；三个 `source_family` 值两两不同；任一 `fallback_used: true` 时该角度标记失败且不进入合并结果；3rd-review 链调用日志可追溯。

### FR-REVIEW-02：三角度输入隔离（机器可校验）
**决策来源**：D4（横切质量机制），make-decision-flow-aligned.md §S5
**描述**：三角度审查的输入必须严格隔离，通过独立 bundle 文件实现（机器可校验）：
- 每个角度读取**独立输入 bundle 文件**（`review-input-direction.md` / `review-input-framing.md` / `review-input-scope.md`），不共享 scratch 文件。
- direction-review 只读 `review-input-direction.md`（原始需求基线），bundle 中不含提案框架内容。
- framing-challenge 只读 `review-input-framing.md`（框架提案），bundle 中不含用户偏好表达或其他角度输出。
- scope-review 只读 `review-input-scope.md`（范围声明），bundle 中不含审查结论。
- 每个 bundle 文件写入时记录 `input_hash`（内容 SHA256）；reviewer checkpoint 须引用该 `input_hash`，实现输入可追溯。
- 三个 bundle 文件的路径不得在任意一个角度的输入中出现交叉引用（可通过扫描 bundle 文件路径字符串校验）。

**验收标准**：三个 bundle 文件各自独立存在；各 reviewer checkpoint 含 `input_hash` 与对应 bundle 路径；自动扫描 bundle 文件内容，无跨角度 artifact 路径引用。

### FR-REVIEW-03：防漏阀阻断反对留痕
**决策来源**：D4，make-decision-flow-aligned.md §S7 防漏阀留痕
**描述**：审查中出现 `severity: blocking` 级反对时，必须在 decision-log 或审查产物中留痕，格式固定：
```
反对 X：<反对的具体内容>
决定 Y：<用户最终决定>
理由 Z：<决定的理由>
```
不阻断流程，但留痕缺失时 decision-log 不得标注"落盘完整"。

**验收标准**：存在 blocking 反对时，产物文件中必须找到上述三行格式；无 blocking 反对时该格式可缺席。

---

## 6. Debate 功能需求

### FR-DEBATE-01：第一次 debate 门控（S5 后）
**决策来源**：D1，D4（禁止审查前自造争点），D5（debate 触发条件）
**描述**：S5 三角度盲审完成后评估是否触发 debate：
- **触发条件**（必须来自现有盲审产物，不得预先制造）：
  - 条件 A：`artifacts/make-decision-review-direction.md`、`artifacts/make-decision-review-framing.md`、`artifacts/make-decision-review-scope.md` 中合计出现 `severity: blocking` 条目 **> 2 条**，或
  - 条件 B：任一角度 checkpoint 显式记录 `direction_divergence: true`
- **禁止行为（D4）**：触发判定必须基于上述已存在 artifact 中的具体 finding ID，**严禁在审查完成前或审查外自行制造争点**（无 artifact 来源的 debate 触发视为违规，记录 `debate_triggered_invalid: true` 并跳过 debate）。
- 触发时调用外部 debate repo（路径由 `MAKE_DECISION_DEBATE_PATH` 决定），传入 finding ID 列表作为争点来源；未触发时记录 `debate_1: skipped` 继续。

**验收标准**：debate 触发时 journal 含 `debate_1_triggered: true` 及来源 finding ID 列表，产出 `artifacts/make-decision-debate-1.md`（含裁决书）；未触发时 journal 有 `debate_1: skipped`；无来源 finding ID 时记录 `debate_triggered_invalid: true`。

### FR-DEBATE-02：第二次 debate 门控（S7 orchestrator 后）
**决策来源**：D1，D4，D5
**描述**：S7 intake-review-orchestrator 产出中出现 `severity: blocking` 时触发第二次 debate；触发条件、禁止行为（D4 反审查前自造争点规则）与 FR-DEBATE-01 相同，来源 artifact 为 orchestrator 产出文件。无 blocking 则不触发。

**验收标准**：orchestrator 产出含 blocking 时存在 `artifacts/make-decision-debate-2.md` 及来源 finding ID 列表；无 blocking 时 journal 有 `debate_2: skipped`。

### FR-DEBATE-03：debate 注册 reuse-registry
**决策来源**：D5，decision-log §3 D5
**描述**：debate 作为 EXTERNAL skill 首次引入时，必须在 `reuse-registry.md` 中登记（skill name、来源路径、reuse_class、接入说明）。

**验收标准**：`reuse-registry.md` 中存在 debate 条目，含 skill 名称和来源路径 `/Users/Hugh/Hugh/Project/debate`。

### FR-DEBATE-04：debate 降级
**决策来源**：D5，env-var-design.md
**描述**：当 `MAKE_DECISION_DEBATE_PATH` 指向路径不可达，或 `MAKE_DECISION_SKIP_DEBATE=1` 时，debate 动作记录 skip 原因（含 env var 状态）后继续，不报错、不阻断流程。

**验收标准**：路径不可达时 artifacts 中有 `debate_skipped_reason: path_unreachable` 记录；SKIP=1 时有 `debate_skipped_reason: env_skip`。

---

## 7. Talk-with-zhipeng 功能需求

### FR-TALK-01：三轮 talk 结构
**决策来源**：D1（S2/S4/S7 轮次）
**描述**：talk-with-zhipeng 共三轮，每轮目的不同：
- 轮 1（S2）：门控外部调研——判断是否需要双路外部调研
- 轮 2（S4）：收敛 + 方向基线确认——收敛调研发现，确认方向基线
- 轮 3（S7）：细节追问——聚焦已知盲区和边界

每轮产出写入 `artifacts/make-decision-consultation.md`（追加，含轮次标记）。

**验收标准**：artifacts 文件包含三轮标记（`round: 1/2/3`）；每轮完成后 journal 有 `skill_called: talk-with-zhipeng, round=N`。

### FR-TALK-02：一次一问按影响排序
**决策来源**：D1，D6（交互≤4选项），decision-log §3 D1
**描述**：每轮 talk 中问题必须按预估影响从高到低排序，每次只向用户提出**恰好一个问题**，等待回答后再继续下一个。不得批量提问、不得跳过用户回答直接进入下一问。具体限制：
- 每个 talk turn 最多包含 **1 个问号（？）**，最多包含 **1 个疑问句**；
- 禁止使用枚举式问题列表（如"1. … 2. … 3. …"中含多个疑问句），禁止在单 turn 中包含多个并列疑问分句；
- 当 talk turn 提供选项供用户选择时，选项数量 **≤ 4**（机器可校验：扫描选项标记如 `A/B/C/D` 或 `1/2/3/4` 的列表条目数）；
- 上述三条均可通过扫描 `artifacts/make-decision-consultation.md` 的 turn 内容自动校验。

**验收标准**：产物中每轮问题有明确排序编号；自动扫描每个 talk turn：问号数 ≤ 1，疑问句数 ≤ 1，选项条目数 ≤ 4；任一 turn 违反时 journal 记录 `talk_turn_violation: true`。

---

## 8. Grill 功能需求

### FR-GRILL-01：grill-with-docs-lite 薄壳（纯委托，禁止内嵌逻辑）
**决策来源**：D1，D2（薄壳原则），skill-reuse-classification.md §5
**描述**：grill-with-docs-lite 在 S7 执行，**只作为已有 grill 机制的委托调用**，不得在薄壳内复制或重新实现审查、debate、调研、决策判断等任何其他阶段的逻辑。具体约束：
- 薄壳实现 **≤ 40 行**，仅含：环境准备、调用现有 grill 机制、接收结果、写回 artifact。
- **不得在薄壳中加入**：多轮问答循环逻辑、盲审判断、debate 触发判断、调研摘要生成、decision-log 内容决策。
- 退出条件由被调用的 grill 机制内部决定（连续 3 次问答中用户能复述四件事：做了什么 / 为何 / 不做什么 / 怎么验证），薄壳不重新实现该逻辑。
- 盘问边界结果由 grill 机制产出，薄壳只负责将结果路径写入 decision-log 草稿。

**验收标准**：`artifacts/make-decision-grill-with-docs.md` 存在；薄壳实现行数 ≤ 40（可通过行数统计校验）；薄壳文件中不包含 `review`、`debate`、`research`、`decision` 相关业务逻辑代码；decision-log 草稿含 grill 产物引用路径。

---

## 8.5 S7 Decision-Log 草稿功能需求

### FR-DRAFT-01：S7 decision-log 草稿产出
**决策来源**：D1（S7 产出 decision-log 草稿），make-decision-flow-aligned.md §S7
**描述**：S7 内 grill 完成后，必须产出 decision-log 草稿文件 `artifacts/make-decision-decision-log-draft.md`，草稿包含以下 7 节结构（与 S10 最终落盘格式一致，节标题相同，内容为草稿态）：
1. 原始需求
2. 问题与目标
3. 决策（D1–D6，每条含 rationale）
4. 假设
5. 明确不做
6. 开放问题（此时可含 OPEN 项）
7. 验收标准（含 `user_decision` 字段，草稿态为 `false`）

intake-review-orchestrator 完成后，其产出（漂移/盲点/细节发现）必须 **attach 到该草稿文件末尾**（追加 `## orchestrator-findings` 节），不得覆盖草稿正文。

**验收标准**：`artifacts/make-decision-decision-log-draft.md` 在 S7 grill 完成后存在，含上述 7 节；orchestrator 完成后该文件追加 `## orchestrator-findings` 节；journal 有 `s7_draft_complete` 事件。

---

## 9. 台账功能需求

### FR-LEDGER-01：台账两个渲染点
**决策来源**：D4，make-decision-flow-aligned.md §台账渲染点①②
**描述**：原始需求台账（D28）在两个固定时间点渲染，两次渲染结果直接为 **S9 决策裁决**提供事实依据（哪些需求被接受、哪些被驳回，S9 用户看到的台账即从此处来）：
- 渲染点①（S4 后）：将用户原始需求/聊天原文落盘为 `artifacts/make-decision-original-context.md`，逐条标注初始状态
- 渲染点②（debate/审查裁决收敛后，S7 后）：逐条渲染台账，判为丢弃的条目必须登记驳回理由；此版本作为 S9 展示给用户的台账基础

**验收标准**：两个渲染产物均存在；台账中无"状态未知"条目；所有丢弃条目含驳回理由；S9 展示内容可追溯至渲染点②产物。

### FR-LEDGER-02：禁止静默丢弃
**决策来源**：D4，decision-log §3 D4
**描述**：任何一条用户需求在任何阶段被判定为丢弃/降级，必须在台账中登记驳回理由，不得静默删除。framing-challenge 在 `artifacts/make-decision-original-context.md` 落盘前不得派发（确保原始需求已在台账登记）。

**验收标准**：对比输入需求列表和 decision-log 最终范围，所有不包含的需求项均有台账驳回记录。

### FR-LEDGER-03：新想法回退判定 D15
**决策来源**：D4，make-decision-flow-aligned.md §新想法回退判定D15
**描述**：调研/审查中出现的新想法，若超出当前 task 范围，必须判定为回退（记录到新 task 候选列表），不得自动扩大当前 task 范围。

**验收标准**：新想法候选列表存在（可为空列表）；无未登记的自动范围扩大。

---

## 10. 方向基线功能需求

### FR-ACCEPT-01：方向基线确认（S4，记录模式，非阻断）
**决策来源**：D6（S9 是唯一硬门控），decision-log §3 D6
**描述**：S4 talk 第 2 轮收敛后，向用户呈现方向基线摘要（含：做什么 / 不做什么 / 关键约束 / 成功判据），作为**对话检查点记录**用户当前理解，然后**直接推进到 S5**，不等待显式确认，不阻断流程。S4 是信息同步节点，不是机器门控。用户若有异议应在 talk 轮中提出，不构成流程 gate。

**验收标准**：`artifacts/make-decision-consultation.md` 第 2 轮产物包含方向基线摘要；journal 中 S4 后有 `s4_baseline_recorded: true`（非 `user_confirmed`）；S4 不得出现等待用户批准的 blocking 提示。

---

## 11. 环境变量功能需求

### FR-ENV-01：6 个可选 env var
**决策来源**：D6（env-var 设计），env-var-design.md；**全部可选，均有安全默认值，默认路径无需任何 env var 即可正常执行。**

| env var | 默认值 | 允许值 | 非法值行为 | 作用 |
|---------|--------|--------|------------|------|
| `MAKE_DECISION_DEBATE_PATH` | `/Users/Hugh/Hugh/Project/debate` | 任意可访问目录路径 | 路径不可达时记录 `debate_path_invalid`，skip debate+log，继续 | 覆盖 debate skill 路径 |
| `MAKE_DECISION_SKIP_DEBATE` | `0` | `0` 或 `1` | 非 `0`/`1` 值视为 `0`（warn+log） | `=1` 强制跳过 debate |
| `MAKE_DECISION_SKIP_BLIND_REVIEW` | `0` | `0` 或 `1` | 非 `0`/`1` 值视为 `0`（warn+log） | `=1` 强制跳过盲审 |
| `THIRD_REVIEW_RUNNER` | `run-heterologous-review.mjs` | 任意可执行文件路径 | 文件不可达时记录 `runner_invalid`，用默认 runner，继续 | 自定义 reviewer runner |
| `REVIEW_DISPATCH_CONFIG` | （空，走内置默认调度） | 有效 JSON/YAML 配置文件路径 | 文件不可达或解析失败时记录 `dispatch_config_invalid`，用默认调度，继续 | 盲审调度配置 |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `0` | `0` 或 `1` | 非 `0`/`1` 值视为 `0`（warn+log） | `=1` 启用 debate 五方法庭模式；`=0` debate 自动降级单人三档 |

**验收标准**：SKILL.md 中每个 env var 入口处有检测逻辑；未设置任何 env var 时流程完整可跑；env 检测结果写入 decision-log 的"执行环境"字段。

### FR-ENV-02：env var 不进 config 注册表
**决策来源**：D6，env-var-design.md §实现建议
**描述**：6 个 env var 不在 `config/workflowhub.yaml` 中注册（注册表保持为纯组件路由表）。

**验收标准**：`config/workflowhub.yaml` 不含上述 env var 条目。

---

## 12. Metrics 功能需求

### FR-METRIC-01：metrics 记录完整
**决策来源**：CONSTITUTION F6（统一外置执行记录）
**描述**：make-decision 执行时必须调用 `metrics/collector.mjs`：
- 阶段开始时调用 `recordSkeleton`（10 个核心字段）
- 阶段结束时调用 `updateOwnResult`（填写 executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）
- metrics 写失败时 warn 不 throw，不阻断正常流程

**验收标准**：`task-metrics.jsonl` 中存在 `skill_or_stage: make-decision` 的记录；记录含 10 个核心字段；metrics 失败不阻断流程可通过异常注入验证。

---

## 13. S9 硬门控功能需求

### FR-ACCEPT-02：S9 唯一硬门控
**决策来源**：D5，decision-log §3 D5
**描述**：S9 是整个 make-decision 流程唯一的强制确认点。执行到 S9 时，向用户展示完整决策摘要（含：方向、范围、关键约束、待办列表台账），等待用户明确回复"同意"（或等效确认）后才可进入 S10 落盘。用户未确认时无限等待，不得自动通过。

**验收标准**：decision-log 落盘前 journal 有 `s9_user_approved: true` 事件；decision-log 的 `user_decision: true` 字段为真；从 S8 直接跳到 S10（绕过 S9）被视为错误。

### FR-ACCEPT-03：S9 台账逐条核对
**决策来源**：D4（台账），D5（S9 门控）
**描述**：S9 展示给用户的内容必须包含原始需求台账逐条状态，用户可在此轮对台账提出异议并返回相应步骤修正，直至用户确认。

**验收标准**：S9 产物（artifacts 或 chat 记录）包含台账逐条状态（含丢弃条目驳回理由）。

---

## 13.5 Scope Boundary 功能需求

### FR-SCOPE-01：不改下游阶段文件 + scope boundary 可验收
**决策来源**：spec §14 明确不做第 1 条；tasks T018
**描述**：make-decision skill 实现过程中，以下文件/路径严禁被改动：
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `config/workflowhub.yaml`

**验收标准**：T018 执行完成后，上述所有文件的 git diff 为空；逐条确认 FR-ACCEPT-01/02/03 验收条件已满足。

---

## 14. 不做和隐性必达

### 明确不做

1. 不改下游阶段（build-spec / build-plan / build-code / verify-code）的任何文件（见 FR-SCOPE-01）
2. 不引入任何阻断式 gate（S9 以外）
3. 不实现 debate 内部逻辑（外部 skill，原样调用）
4. 不强制 historical-lessons-used 校验
5. 不使用 agenthub route-review.mjs 作为调研来源
6. 不向 config/workflowhub.yaml 注册 env var

### 隐性必达

- **隐性必达 1**：所有护城河动作非阻断（跳过时 journal 有记录，不报错）
- **隐性必达 2**：decision-log 落盘后内容完整（7节，含执行环境字段）
- **隐性必达 3**：debate 调用必须在 reuse-registry.md 登记

---

## 15. 验收清单（Acceptance Criteria）

对应 decision-log §7 成功标准：

**AC1（五类护城河可触发）**：在 workflowhub 自身 dogfooding 中，双路调研、三角度盲审、talk 三轮、grill、debate 均可通过 env var 配置独立触发，各产出对应 artifacts 文件。
- 失败判据：任一动作无法触发或触发后无产物

**AC2（debate 注册 reuse-registry）**：`reuse-registry.md` 存在 debate 条目，含 skill 名称、来源路径、reuse_class。
- 失败判据：reuse-registry.md 无 debate 条目

**AC3（盲审异源）**：三角度盲审各有独立 reviewer_runtime_id，不走同源 reviewer。
- 失败判据：三个产物 reviewer_runtime_id 相同，或走同源 reviewer

**AC4（metrics 记录）**：task-metrics.jsonl 中有 make-decision 阶段的 recordSkeleton 和 updateOwnResult 记录。
- 失败判据：task-metrics.jsonl 缺失或无 make-decision 条目

**AC5（台账无静默丢弃）**：decision-log 落盘后，对比输入需求列表，所有未纳入范围的需求项在台账中有驳回理由。
- 失败判据：存在需求项既未出现在 decision-log 范围内、也无台账驳回记录

**AC6（S9 可验证）**：decision-log.md 中 `user_decision: true` 字段存在且为真，且 journal 有 `s9_user_approved: true` 事件。
- 失败判据：decision-log 落盘但缺少 `user_decision` 字段或该字段为 false

---

## 16. Clarifications

### 10 维歧义扫描覆盖（Session 2026-06-29）

扫描了全部 10 维，上游权威源：`tasks/m13-make-decision-v1/decision-log.md`（version: final）+ `tasks/m13-make-decision-v1/research/` 全目录。

| 维度 | 状态 | 处理 |
|------|------|------|
| 1. Functional Scope & Behavior | Clear | 无歧义，直接通过 |
| 2. Domain & Data Model | Partial → Resolved | artifacts 路径 + decision-log 7节 从上游解析 |
| 3. Interaction UX Flow | Partial → Resolved | S2 talk#1 退出条件从 flow doc 解析 |
| 4. Non-Functional Attributes | Clear | 无性能/延迟目标要求（人交互型 skill） |
| 5. Error Handling & Resilience | Partial → Open（1项） | muyu 单路降级行为，见 OPEN 列表 |
| 6. Security & Authorization | Clear | N/A |
| 7. Integration & API Contracts | Partial → Open（1项） | S7 orchestrator framing 接线，见 OPEN 列表 |
| 8. Deployment & Operations | Clear | env-var-design.md 完整覆盖 |
| 9. Testing & Validation Strategy | Clear | AC1–AC6 均有可证伪判据 |
| 10. Terminology & Consistency | Resolved | FR-FLOW-01 "12 bullet / 11 step" 不一致已解释 |

**歧义总数：5**（含上游已标注的 2 项）
**从 decision-log / research 解析：3**
**留存 OPEN：2**（均来自 decision-log §6 已标注的"待实现时确认"项）

---

### Resolved Clarifications

- **Q: artifacts 基础路径是什么？**
  A: artifacts 相对于 skill 执行的当前工作目录（即 `tasks/{task-id}/artifacts/`），与现有 workflowhub artifacts 惯例一致（make-decision-flow-aligned.md §S10 + 现有 skill artifacts 路径规范）。

- **Q: decision-log "7节" 结构具体是哪 7 节？**
  A: 来自 decision-log §7 成功标准与 make-decision-flow-aligned.md §S10：原始需求、问题与目标、决策（D1–D6）、假设、明确不做、开放问题、验收标准（含 user_decision 与执行环境字段）。SKILL.md 实现时须按此 7 节结构落盘。

- **Q: S2 talk#1 退出条件？**
  A: S2 结束于用户回答"是否需要外部双路调研"这一核心判断；用户确认需要 → S3 full-档触发；用户确认不需要 → journal 记录 `s3: skipped(user_decision)` 后进 S4。来源：make-decision-flow-aligned.md §S2。

- **Q: FR-FLOW-01 列了几步？**
  A: 共 12 步（S0、S0.5、S1–S10）。S0 背景扎根、S0.5 scope-triage 各占一步，S1 至 S10 共 10 步，合计 12 步。S6 是独立步骤（给用户看盲审/debate 结果），不得省略。

---

### OPEN CLARIFICATIONS（待人工确认，不得由实现者自行发明）

**~~OPEN-1：muyu get_sources 核实失败后，是停下等人还是自动降级单路继续？~~** ✅ RESOLVED

- **已决行为**：muyu `get_sources` 核实失败 → **立即停下，向用户报告失败原因，等待用户明确指令**（继续单路 / 重试 / 中止）。已写入 FR-RESEARCH-01。
- 选择依据：无来源等于幻觉，自动降级掩盖问题；let-it-crash 原则，问题尽早暴露。

**OPEN-2：S7 intake-review-orchestrator 中 framing-challenge 是否重跑？**

- S5 已跑过 framing-challenge（intake-framing-challenge 角度）；S7 orchestrator 涵盖"漂移/盲点/细节"
- decision-log §6 已标注："framing-challenge 已在 S5 前置跑，orchestrator 本步不重复跑 framing——此接线细节待 SKILL.md 实现时确认"
- 需要确认：S7 orchestrator 入口是否需要显式 skip framing-challenge（还是 orchestrator 内部逻辑自动判断）？FR-FLOW-01 步骤描述应更新为"S7（续）：intake-review-orchestrator（漂移/盲点/细节，不含 framing）"还是保持现状由实现者判断？

## 附：未决问题

仅 OPEN-2 留存（S7 orchestrator framing-challenge 接线），待 SKILL.md 实现时确认。

---

*由 spec-specify 生成，输入来源：`tasks/m13-make-decision-v1/decision-log.md`*

---

## F10 Gate Review

**评估时间**: 2026-06-29 | **评估依据**: SKILL.md §6 四问原则

对 spec.md 中每一个新机制逐条过 4 问（Q1 真实威胁 / Q2 已有覆盖 / Q3 可否绕过 / Q4 维护成本），Q1="none" 或 Q4="high ongoing" → 裁剪。

| 机制 | Q1 真实威胁 | Q2 已有覆盖？ | Q3 可绕过？ | Q4 维护成本 | 裁决 |
|------|------------|--------------|------------|------------|------|
| FR-RESEARCH-01: muyu extra_sources≥3 + get_sources 核实 | muyu 默认 extra_sources=0 → 纯幻觉（已在 agenthub 失败中观察到） | 无 | 否（调用方须显式传参） | 低（一行检测） | **保留** |
| FR-RESEARCH-02: anysearch 来源标记 | 调研来源可追溯性 | artifacts 惯例部分覆盖 | 可（agent 可写任意字符串），但属行为规范 | 低 | **保留** |
| FR-RESEARCH-03: 双路返空即停 | 防止双路均空时合成虚假摘要 | 无 | 可绕过，但记录在案 | 低 | **保留** |
| FR-REVIEW-01/02: 三角度盲审 + 输入隔离 | 单源自审盲区（agenthub 失败根因）；跨角度污染 | 无 | 部分可绕（降低质量） | 低（结构性，非代码门） | **保留** |
| FR-REVIEW-03: blocking 反对留痕格式 | 被否决意见不可追溯 | 无 | 可绕（agent 写自由文本），但义务留记录 | 低 | **保留** |
| FR-DEBATE-01/02: debate 条件门控 | >2 blocking 时缺乏升级机制 | 无 | 理论可绕（计数错），但非阻断低风险 | 低 | **保留** |
| FR-DEBATE-03: reuse-registry 登记 | 外部 skill 依赖不可追踪 | reuse-registry.md 已有惯例 | 一行条目，低绕过风险 | 极低 | **保留** |
| FR-DEBATE-04: debate 降级 | 路径不可达是真实运营风险 | 无降级机制 | N/A（本身即降级路径） | 低 | **保留** |
| FR-TALK-01/02: 三轮结构 + 一次一问 | 批量提问抑制对话收敛 | 无 | 行为规范，无机器强制 | 低 | **保留** |
| FR-GRILL-01: grill 四件事退出条件 | 用户未理解范围即过早退出 | 无 | 行为规范 | 低 | **保留** |
| FR-LEDGER-01/02/03: 台账两渲染点 + 禁静默丢弃 + 新想法回退 | 需求静默丢弃（D28，agenthub 失败直接观察） | 无 | 可绕但义务文档化 | 低（artifact 写入） | **保留** |
| FR-ACCEPT-01: S4 方向基线确认 | 带错方向进入高成本盲审 | 无 S5 前检查点 | 可跳过（非代码门），但属对话节点 | 低 | **保留** |
| FR-ENV-01/02: 6 个 env var + 不进 config 注册表 | 功能开关无覆盖机制；硬编码路径僵化 | 无 override 机制 | N/A | 低（6 个 env 读取，无 schema） | **保留** |
| FR-METRIC-01: metrics 记录 | F6 可观测性（复盘必须） | metrics/collector.mjs 已有 | N/A | 低（复用现有 collector） | **保留** |
| FR-ACCEPT-02/03: S9 唯一硬门控 + 台账逐条核对 | 自动提交错误方向 | 无硬门控 | 不可绕（需用户回复） | 低 | **保留** |

**裁剪结果**: 无裁剪。全部 15 项机制均满足 Q1 有真实威胁 + Q4 维护成本低，且均溯源至 agenthub 失败（静默丢需求、自审盲区、无升级路径）或宪法规则（F6 可观测性）。没有"machine-checkable for its own sake"的过度工程。
