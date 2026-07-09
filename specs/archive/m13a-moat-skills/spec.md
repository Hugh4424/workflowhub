---
task_id: m13a-moat-skills
milestone: M13a
stage: build-spec
source_decision_log: tasks/m13a-moat-skills/decision-log.md
status: draft
spec_version: 1.1.0
---

# 功能规格：护城河能力内置化（M13a）

> 基于 decision-log.md（m13a-moat-skills，D1-D6，user_decision:true，talk#2 选项 A 已批准，异源盲审 codex direction_divergence=false）。
> 本文件不可覆盖项目级规则。CONSTITUTION.md 优先。

**功能名**: `m13a-moat-skills`
**来源**: decision-log.md M13a（make-decision stage，skill v2.0.0）
**状态**: 草稿

---

## 速读卡（30 秒看懂这个需求）

**一句话需求**：把 make-decision 的三个护城河动作（talk、grill、异源审查）从内联逻辑/外部依赖升级为独立的 in-repo skill 文件，并让测试能真正断言关键契约，杜绝 M13 的假绿问题。

**核心改动点**：

- 新建 `skills/talk-with-zhipeng/SKILL.md`：从 multica-agenthub 搬入，adapter 路径改 workflowhub，删 gbrain 依赖。
- 新建 `skills/grill-with-docs/SKILL.md`：从 `~/.claude/skills/grill-with-docs/` 原版搬入，含附属格式文件。
- 新建 `skills/intake-decision-review/SKILL.md`：三角度审查（direction/framing/scope），单次拼装，调一次 3rd-review，恰好 3 条 findings。
- 更新 `workflows/make-decision/SKILL.md`：S5/S7/talk 各轮引用切到 in-repo 路径。
- 新增测试断言：文件存在性 + frontmatter 合规 + 引用路径 + 三角度结构 + 可证伪负例。
- 加 `TASK_TRACKING_ROOT` 环境变量声明（对齐 M13b）。
- make-decision S2/S4/S9 用户交互改写为大白话，每选项给推荐和后果说明；S9 明确"不确认就不继续"。
- 更新 `config/reuse-registry.md`：新增 3 行登记三个新 skill，清除 ghost 绝对路径。
- 新建 repo 根 `.mcp.json`：声明 `muyu-search-mcp` server，make-decision S3 外部调研路径 A 切到 in-repo 声明（不再仅依赖用户级 Claude 配置）。
- 新建 `skills/anysearch/`：从 `~/.claude/skills/anysearch/` 搬入，去本机绝对路径，秘密仅以 `.env.example` 占位入库（真 .env 不入库），make-decision S3 路径 B 切到 in-repo。

---

## 序言

### Spec-Ladder 档位判断

**结论：B 档（标准）**

依据：
- 改动牵连面：3 个新 skill 文件 + 1 个现有 skill 更新 + 测试新增，涉及 skills/ 和 workflows/ 两个目录，属跨模块新增机制。
- 无外部 API/协议合约变更、无多 repo/多团队协调、无不可逆数据操作。
- C 档三项判断条件（跨系统依赖/外部 API 合约/多团队协调）均不满足。
- B 档判断条件满足：跨模块（skills/ + workflows/）、新增机制（3 个 skill 文件）、有测试契约扩展。

### F10 反过度工程四问

1. **这个自动化真的比手动更省力吗？** — 是。护城河动作（talk/grill/review）每次 make-decision 都要执行，in-repo skill 让调用路径可被测试断言，消除假绿，收益实证。
2. **失败时报错是否足够清晰？** — 是。D3 明确失败语义：fallback_used→停止报错不静默降级；缺类或不足 3 条→要求重跑，报错明确。
3. **这个抽象是否只为一次性场景服务？** — 否。三个 skill 文件均为通用护城河能力，make-decision 每轮复用，非一次性。
4. **是否在没有真实痛点前引入了复杂度？** — 否。M13 已有真实痛点（假绿、skill 不存在却测试通过），本次是修补，不是预防性工程。

结论（record-only，非阻断）：四问全部通过，无过度工程风险。

---

## 1. 问题陈述

M13 深化了 `workflows/make-decision/SKILL.md`，但护城河动作（talk/grill/异源审查）仅内联在主 skill 或作为外部依赖存在，未做成独立 in-repo skill 文件。测试只断言主 skill 单文件的文本内容，导致：

- skill 文件不存在也能测试通过（假绿）
- 引用路径未被断言（路径错误不被发现）
- 护城河能力无法独立复用、无法独立演进

---

## 2. 背景、目标与边界

### 背景

- `workflows/make-decision/SKILL.md`（v2.0.0，583 行）是核心决策 skill
- M13 已将 talk/grill/review 动作内联其中，但 skill 文件不存在于 repo
- 测试只断言单文件文本，无结构性契约验证

### 目标

1. 将三个护城河动作提升为 in-repo skill 文件，可被调用、可被测试
2. make-decision 的引用路径切到 in-repo，消除死文件风险
3. 测试断言关键契约（文件存在、引用路径、三角度结构）

### 边界

**Scope IN**：
1. 新建 `skills/talk-with-zhipeng/SKILL.md`（搬运，adapter 改写，删 gbrain）
2. 新建 `skills/grill-with-docs/SKILL.md`（含 CONTEXT-FORMAT.md、ADR-FORMAT.md）
3. 新建 `skills/intake-decision-review/SKILL.md`（三角度，单次，恰好 3 条）
4. 更新 `workflows/make-decision/SKILL.md` S5/S7/talk 引用路径
5. 新增测试断言（文件存在性、frontmatter、引用路径、三角度契约、可证伪负例）
6. 加 `TASK_TRACKING_ROOT` 环境变量声明
7. make-decision S2/S4/S9 用户交互大白话改写
8. 更新 reuse-registry：新增 3 行登记三个新 skill，清除 ghost 绝对路径

**Scope OUT**：
- make-decision 583 行拆分重构（另起 milestone）
- debate skill 转 in-repo（保持外部 `/Users/Hugh/Hugh/Project/debate`）
- 新建 grill-with-docs-lite（已取消，原版全量搬入）
- 4 个独立 intake-* skill + orchestrator（已取消，合并为单一 intake-decision-review）

---

## 3. 用户场景

### 场景 3.1：make-decision 执行 S5 调用 intake-decision-review

- **Given** make-decision 运行到 S5（盲审护城河）
- **When** S5 调用 `skills/intake-decision-review/` 路径
- **Then** 该 skill 文件存在于 in-repo，调用成功，返回恰好 3 条 findings，三角度（direction/framing/scope）全覆盖

### 场景 3.2：make-decision 执行 S7 调用 grill-with-docs

- **Given** make-decision 运行到 S7（grill 护城河）
- **When** S7 引用 `skills/grill-with-docs/` in-repo 路径
- **Then** grill-with-docs SKILL.md 存在，附属格式文件（CONTEXT-FORMAT.md/ADR-FORMAT.md）完整，无本机绝对路径残留

### 场景 3.3：make-decision talk 轮次调用 talk-with-zhipeng

- **Given** make-decision S2/S4/S7 的 talk 轮次执行
- **When** talk 引用 `skills/talk-with-zhipeng/` in-repo 路径
- **Then** SKILL.md 存在，frontmatter 合规，无 gbrain context 查询残留，按影响排序声明可 grep

### 场景 3.4：intake-decision-review 输出结构不满足三角度

- **Given** intake-decision-review 调用 3rd-review 后
- **When** 返回的 findings 缺少某一类型（如缺 framing 角度）或数量不足 3 条
- **Then** 停止并要求重跑，不静默降级，不自行编造缺失角度

### 场景 3.5：intake-decision-review fallback_used=true

- **Given** 3rd-review 执行时触发 fallback 机制
- **When** 返回结果包含 `fallback_used: true`
- **Then** 立即停止报错，不采用该结果，不继续主流程

### 场景 3.6：测试断言 skill 文件不存在时报红

- **Given** `skills/talk-with-zhipeng/SKILL.md` 被删除
- **When** 运行 npm test
- **Then** 测试明确报失败（红），不因为主 skill 文本存在而误报绿

### 场景 3.7：talk-with-zhipeng 无宿主依赖残留

- **Given** skills/talk-with-zhipeng/SKILL.md 写入 repo
- **When** 对文件执行宿主依赖扫描（grep multica-agenthub / gbrain / office-hours / ~/.claude）
- **Then** 扫描结果为空，无残留宿主依赖

### 场景 3.8：TASK_TRACKING_ROOT 未设置时降级

- **Given** `TASK_TRACKING_ROOT` 环境变量未设置
- **When** make-decision S10 落盘执行
- **Then** 降级到默认路径，记录降级事件，warn 不报错停止

### 场景 3.9：make-decision S2 用户交互大白话

- **Given** make-decision 到达 S2 用户交互节点
- **When** 展示选项给用户
- **Then** 选项文字无术语堆砌，每个选项含推荐标记和后果说明，高中生可读懂

---

## 4. 功能需求（FR）

### 域 MOAT：护城河 skill 整体

**FR-MOAT-001**：三个护城河 skill（talk-with-zhipeng、grill-with-docs、intake-decision-review）必须作为独立 SKILL.md 文件存在于 `skills/` 目录下，不得仅作为主 skill 内联文本存在。

- 场景：Given 任意执行环境，When 检查 `skills/` 目录，Then 三个 SKILL.md 均可 grep 到。

**FR-MOAT-002**：三个 skill 的 SKILL.md 必须包含合规 frontmatter（至少含 `name` 字段），格式与现有 skills/ 目录下其他 SKILL.md 一致。

- 场景：Given 读取 skills/talk-with-zhipeng/SKILL.md 等，When 解析 frontmatter，Then `name` 字段存在且非空。

**FR-MOAT-003**：三个 skill 目录内的**全部文件**（SKILL.md 及附属格式文件）不得含：（a）绝对路径残留（`/Users/` 等以 `/` 开头的宿主路径），或（b）宿主环境引用（`~/.claude`、`multica-agenthub`、`gbrain`、`office-hours`）。两类分别检测。

- 场景 a（绝对路径残留）：Given grep `/Users/\|/home/` 在三个 skill 目录的全部文件，When 搜索，Then 结果为空（覆盖 macOS /Users/ 与 Linux /home/ 等宿主家目录绝对前缀）。
- 场景 b（宿主环境引用）：Given grep `~/.claude\|multica-agenthub\|gbrain\|office-hours` 在三个 skill 目录的全部文件，When 搜索，Then 结果为空。

### 域 TALK：talk-with-zhipeng skill

**FR-TALK-001**：`skills/talk-with-zhipeng/SKILL.md` 必须源自 multica-agenthub 已实现版本的搬运，保留以下硬证据章节（不可删减）：（a）"输入"或等义章节、（b）"步骤"或"执行协议"或等义章节、（c）`talk` 关键词。adapter 层路径统一改写为 workflowhub 路径，核心逻辑不自研。

- 场景（核心章节存在）：Given grep `输入\|步骤\|执行协议\|talk` 在 SKILL.md，When 搜索，Then 每项至少命中一处。
- 场景（adapter 路径已改）：Given grep `multica-agenthub\|/Users/` 在 SKILL.md，When 搜索，Then 结果为空（已改为 workflowhub in-repo 路径）。

**FR-TALK-002**：`skills/talk-with-zhipeng/SKILL.md` 必须声明"按影响排序"逻辑（impact-ordered），可通过 grep 验证。

- 场景：Given grep `影响排序\|impact` 关键词，When 搜索 SKILL.md，Then 命中至少一处。

**FR-TALK-003**：`skills/talk-with-zhipeng/SKILL.md` 中不得含 office-hours 的 gbrain context 查询逻辑（已删除）。

- 场景：Given grep `gbrain\|office-hours`，When 搜索 SKILL.md，Then 结果为空。

### 域 GRILL：grill-with-docs skill

**FR-GRILL-001**：`skills/grill-with-docs/` 目录必须包含 SKILL.md，且附属格式文件 CONTEXT-FORMAT.md 和 ADR-FORMAT.md 必须存在（文件存在即满足，不要求内容完整性——内容完整性依赖搬运原版）。

- 场景：Given 检查目录结构，When 列出 skills/grill-with-docs/ 下所有文件，Then SKILL.md、CONTEXT-FORMAT.md、ADR-FORMAT.md 三个文件均存在（stat 可验证），不因文件内容而影响本条判断。

**FR-GRILL-002**：grill-with-docs SKILL.md 必须保留原版的核心协议段：至少含"输入"/"输出"/"步骤"或等义章节标题，以及 `grill` 关键词。不做 lite 变体，adapter 改写仅限于宿主路径替换。

- 场景：Given SKILL.md 内容，When grep `grill\|输入\|输出\|步骤`，Then 每个关键词至少命中一处；When grep `~/.claude\|multica-agenthub`，Then 结果为空（宿主路径已替换）。

**FR-GRILL-003**：grill-with-docs 目录内**全部文件**（SKILL.md、CONTEXT-FORMAT.md、ADR-FORMAT.md）不得含绝对路径残留（`/Users/`）或宿主环境引用（`~/.claude`、`multica-agenthub`、`gbrain`、`office-hours`）。扫描范围为目录内全部文件，非仅 SKILL.md。

- 场景：Given grep `/Users/\|~/.claude\|multica-agenthub\|gbrain\|office-hours` 在 skills/grill-with-docs/ 全部文件，When 搜索，Then 结果为空。

### 域 REVIEW：intake-decision-review skill

**FR-REVIEW-001**：`skills/intake-decision-review/SKILL.md` 必须定义三角度审查结构：每次审查产出**恰好 3 条** findings，每条标注 `direction`、`framing`、`scope` 之一，三类必须全覆盖（不得缺类）。

- 场景：Given intake-decision-review 运行完成，When 检查输出 findings，Then 数量=3，标注类型为 direction/framing/scope 各一条，顺序任意。

**FR-REVIEW-002**：intake-decision-review 必须为单次拼装调用模式——将三角度内容拼装后调用一次 3rd-review，不得分三次独立调用。

- 场景：Given SKILL.md 执行协议，When 检查 3rd-review 调用次数声明，Then 明确说明"单次调用"或等义文本可 grep。

**FR-REVIEW-003**：当 3rd-review 返回 `fallback_used: true` 时，intake-decision-review 必须立即停止并报错，不得静默降级、不得采用该结果继续主流程。

- 场景：Given fallback_used=true 的返回，When intake-decision-review 处理该返回，Then 产出明确的停止信号（报错/blocked 状态），主流程不继续。

**FR-REVIEW-004**：当 findings 数量不足 3 条或三角度缺少任意一类时，intake-decision-review 必须要求重跑，不得自行编造缺失角度。

- 场景：Given findings=[{direction:...},{scope:...}]（缺 framing），When 校验，Then 触发重跑要求，不填充 framing。

### 域 MAKEDEC：make-decision 引用切换

**FR-MAKEDEC-001**：`workflows/make-decision/SKILL.md` 的 S5 步骤必须将盲审引用路径更新为 `skills/intake-decision-review/`（in-repo 路径），不得保留外部或内联引用。

- 场景：Given grep "intake-decision-review" 在 make-decision SKILL.md，When 搜索，Then S5 对应段落可命中该路径。

**FR-MAKEDEC-002**：`workflows/make-decision/SKILL.md` 的 S7 步骤必须将 grill 引用路径更新为 `skills/grill-with-docs/`（in-repo 路径）。

- 场景：Given grep "grill-with-docs" 在 make-decision SKILL.md，When 搜索 S7 段落，Then 命中 in-repo 路径引用。

**FR-MAKEDEC-003**：`workflows/make-decision/SKILL.md` 的所有 talk 轮次（S2、S4、S7）必须将 talk 引用路径更新为 `skills/talk-with-zhipeng/`（in-repo 路径），且旧的外部 talk 引用路径不得残留。

- 场景（S2 命中）：Given grep `talk-with-zhipeng` 在 make-decision SKILL.md 的 S2 段落，When 搜索，Then 命中 in-repo 路径引用。
- 场景（S4 命中）：Given grep `talk-with-zhipeng` 在 make-decision SKILL.md 的 S4 段落，When 搜索，Then 命中 in-repo 路径引用。
- 场景（S7 命中）：Given grep `talk-with-zhipeng` 在 make-decision SKILL.md 的 S7 段落，When 搜索，Then 命中 in-repo 路径引用。
- 场景（旧路径清除）：Given grep 旧外部 talk 路径（如 `multica-agenthub.*talk\|~/.claude.*talk`），When 搜索 make-decision SKILL.md，Then 结果为空，无外部路径残留。

### 域 TEST：测试断言

**FR-TEST-001**：测试套件必须包含文件存在性断言：验证 `skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/intake-decision-review/SKILL.md` 三个文件均存在。文件缺失时测试必须报红。

- 场景：Given 删除 skills/talk-with-zhipeng/SKILL.md，When 运行 npm test，Then 对应断言报红，不因主 skill 文本存在而误报绿。

**FR-TEST-002**：测试套件必须包含 frontmatter 合规断言：三个 skill 文件的 frontmatter 必须含 `name` 字段且非空，违规时测试报红。

- 场景：Given SKILL.md frontmatter 缺少 name 字段，When 运行 npm test，Then frontmatter 断言报红。

**FR-TEST-003**：测试套件必须包含引用路径断言：验证 make-decision SKILL.md 的 S5/S7/talk 段落包含正确的 in-repo 路径引用（grep 可验证）。

- 场景：Given make-decision S5 引用未改为 in-repo 路径，When 运行 npm test，Then 路径断言报红。

**FR-TEST-004**：测试套件必须包含 intake-decision-review 三角度结构契约断言，覆盖以下可证伪负例——每个负例在实际为假时必须使测试报红：

- （a）SKILL.md 缺少 `direction`/`framing`/`scope` 任意关键词 → 断言报红
- （b）SKILL.md 缺少"恰好 3 条"或等义约束文本 → 断言报红
- （c）SKILL.md 缺少 `fallback_used` 及停止/报错语义 → 断言报红
- （d）SKILL.md 缺少"单次"或等义单次调用声明 → 断言报红
- （e）SKILL.md 未说明 findings 数量不足或缺角度时需重跑（不自行编造） → 断言报红

- 场景（负例 a）：Given SKILL.md 缺少 framing 关键词，When 运行 npm test，Then 三角度断言报红，不因其他关键词存在而误报绿。
- 场景（负例 c）：Given SKILL.md 缺少 fallback_used 文本，When 运行 npm test，Then fallback 停止断言报红。
- 场景（负例 d）：Given SKILL.md 缺少单次调用声明，When 运行 npm test，Then 单次调用断言报红。

**FR-TEST-005**：测试套件必须包含宿主依赖扫描断言：三个 skill 文件中不含 `multica-agenthub`、`gbrain`、`office-hours` 等宿主依赖标记，命中时测试报红。

- 场景：Given SKILL.md 含 "gbrain" 字符串，When 运行 npm test，Then 宿主依赖断言报红。

### 域 TRACKING：环境变量

**FR-TRACKING-001**：`workflows/make-decision/SKILL.md` 的 Environment Variables 表必须新增 `TASK_TRACKING_ROOT` 条目，含义、默认值、使用说明与 M13b build-spec SKILL.md 中的定义对齐。

- 场景：Given grep "TASK_TRACKING_ROOT" 在 make-decision SKILL.md，When 搜索，Then 命中 Environment Variables 表中的条目。

**FR-TRACKING-002**：S10 落盘步骤执行前，必须读取 `TASK_TRACKING_ROOT` 确定跟踪文件写入路径；未设置时降级到默认路径，记录降级事件，warn 不报错停止。

- 场景：Given TASK_TRACKING_ROOT 未设置，When S10 落盘，Then 写入默认路径，journal 记录 `tracking_root_fallback` 事件。

### 域 COMM：用户交互改写

**FR-COMM-001**：make-decision S2 用户交互段必须改写为大白话：无 framing/scope 等英文术语直接暴露给用户，每选项含推荐标记和中文后果说明，高中生可读。

- 场景：Given 读取 S2 选项文本，When 评估可读性，Then 每选项有中文后果说明，至少一项有"推荐"标记，grep `推荐` 在 S2 段落命中，grep `framing\|scope` 作为给用户的独立术语不出现。

**FR-COMM-002**：make-decision S4 用户交互段必须同样改写为大白话，遇到问题时给出选项（不只是提问），每选项含推荐标记和中文后果说明。

- 场景：Given S4 遇到歧义情况，When 展示给用户，Then 以选项形式呈现，含推荐和后果，grep `推荐` 在 S4 段落命中。

**FR-COMM-003**：make-decision S9 用户确认段必须改写为大白话：必须明确说明"不确认就不继续"或等义文本，含等待确认说明，不含英文术语直接暴露。

- 场景：Given S9 等待确认，When 展示给用户，Then 文字直白，grep `不确认\|not confirmed\|等待确认` 在 S9 段落命中，grep `framing\|scope` 作为给用户的独立术语不出现。

### 域 REGISTRY：reuse-registry 更新

**FR-REGISTRY-001**：`config/reuse-registry.md` 必须新增 3 行，分别登记三个新 skill（talk-with-zhipeng、grill-with-docs、intake-decision-review），每行至少含 skill 名称和 in-repo 路径。

- 场景：Given 检查 `config/reuse-registry.md`，When grep `talk-with-zhipeng`、`grill-with-docs`、`intake-decision-review`，Then 三行各自命中，且路径为 in-repo 相对路径。

**FR-REGISTRY-002**：`config/reuse-registry.md` 不得含以下两类污染路径，分别检测：

- （a）**绝对路径残留**：以 `/Users/`、`/home/` 等 `/` 开头的本机绝对路径，不得出现在任何 registry 行。
- （b）**宿主环境引用**：`~/.claude`、`multica-agenthub`、`gbrain`、`office-hours` 等宿主上下文引用（`~/.claude` 为波浪线相对路径，属宿主引用而非绝对路径，须单独列类）。

- 场景 a（绝对路径残留）：Given grep `/Users/\|/home/` 在 `config/reuse-registry.md`，When 搜索，Then 结果为空（覆盖 macOS /Users/ 与 Linux /home/ 等宿主家目录绝对前缀）。
- 场景 b（宿主环境引用）：Given grep `~/.claude\|multica-agenthub\|gbrain\|office-hours` 在 `config/reuse-registry.md`，When 搜索，Then 结果为空。

### 域 MCP：muyu-search-mcp 内置化

**FR-MCP-001**：repo 根必须存在 `.mcp.json`，声明名为 `muyu-search-mcp` 的 MCP server 条目：为合法 JSON，`mcpServers` 对象下含 `muyu-search-mcp` 键，该键含 server name 语义与 `command`/`args` 字段（结构可被 Claude Code 加载）。鉴权秘密（token/api key）不得明文写入 `.mcp.json`，须经环境变量引用，真实秘密不入库。

- 场景（条目存在）：Given 检查 repo 根，When 读取 `.mcp.json` 并 grep `muyu-search-mcp`，Then 文件存在、JSON 合法、`mcpServers` 下命中 `muyu-search-mcp` 键且含 `command`/`args` 字段。
- 场景（无明文秘密）：Given grep 常见秘密标记（如 `sk-`、`token`、真实 key 形态）在 `.mcp.json`，When 搜索，Then 无明文秘密残留（秘密以 env 引用形式存在）。
- 场景（负例）：Given `.mcp.json` 缺失或 `mcpServers` 下无 `muyu-search-mcp` 键，When 运行 npm test，Then `.mcp.json` 条目断言报红。

**FR-MCP-002**：`workflows/make-decision/SKILL.md` 的 S3 双路外部调研「路径 A — muyu-search-mcp」对该 server 的引用必须可由 in-repo `.mcp.json` 声明满足，不得以「仅用户级 Claude 配置」「仅本机」等外部依赖措辞作为唯一来源；换机克隆 repo 后 S3 路径 A 不应因缺少 in-repo 声明而静默跳过。

- 场景（S3 引用 in-repo 可满足）：Given grep `muyu-search-mcp` 在 make-decision SKILL.md S3 段落，When 搜索，Then 命中，且无「仅用户级配置/仅本机」等将外部配置作为唯一来源的措辞残留。
- 场景（负例）：Given S3 路径 A 仍标注 muyu 仅存在于用户级配置，When 运行路径断言，Then 报红。

### 域 SEARCH：anysearch 内置化

**FR-SEARCH-001**：`skills/anysearch/` 目录必须存在，含从 `~/.claude/skills/anysearch/` 搬入的 `SKILL.md`：frontmatter 合规且含非空 `name` 字段；目录内全部受版本控制文件不含本机绝对路径（`/Users/`、`/home/`）残留。秘密仅以 `.env.example`（占位、无真实值）入库，真实 `.env` 不入库（由 `.gitignore` 覆盖，git 不追踪）。

- 场景（skill 文件 + frontmatter）：Given 检查 `skills/anysearch/SKILL.md`，When stat 并 grep `^name:`，Then 文件存在且 `name` 字段值非空。
- 场景（无绝对路径残留）：Given grep `/Users/\|/home/` 在 `skills/anysearch/` 受版本控制文件，When 搜索，Then 结果为空。
- 场景（秘密合规）：Given 检查 `skills/anysearch/`，When 检查版本控制状态，Then `.env.example` 入库且为占位（无真实 key），`.env` 不被 git 追踪（`.gitignore` 命中）。
- 场景（负例）：Given `skills/anysearch/SKILL.md` 缺失，When 运行 npm test，Then 文件存在断言报红。

**FR-SEARCH-002**：`workflows/make-decision/SKILL.md` 的 S3「路径 B — anysearch」对 anysearch 的引用必须切换为 in-repo `skills/anysearch/` 路径，不得依赖 `~/.claude/skills/anysearch/` 等宿主路径；换机克隆 repo 后 S3 路径 B 不应因缺少 in-repo skill 而静默跳过。

- 场景（S3 引用 in-repo）：Given grep `skills/anysearch` 在 make-decision SKILL.md S3 段落，When 搜索，Then 命中 in-repo 相对路径，且 grep `~/.claude.*anysearch` 结果为空。
- 场景（负例）：Given S3 路径 B 仍引用 `~/.claude/skills/anysearch`，When 运行路径断言，Then 报红。

---

## 5. 非目标（明确不做）

- make-decision 583 行主 skill 拆分重构
- debate skill 转 in-repo
- grill-with-docs-lite 变体
- 4 个独立 intake-* skill + orchestrator 方案
- 宪法 21 条逐条勾选（由独立人工完成）
- baseline 对照表（由独立人工完成）
- 异源 3rd-review 审查（已在 make-decision 阶段完成，非本 spec 产物）

---

## 6. 验收条件（AC）

- [ ] **AC-01**：`skills/talk-with-zhipeng/SKILL.md` 文件存在（ls 或 stat 可验证）。
- [ ] **AC-02**：`skills/grill-with-docs/SKILL.md` 文件存在。
- [ ] **AC-03**：`skills/intake-decision-review/SKILL.md` 文件存在。
- [ ] **AC-04**：`skills/grill-with-docs/CONTEXT-FORMAT.md` 文件存在。
- [ ] **AC-05**：`skills/grill-with-docs/ADR-FORMAT.md` 文件存在。
- [ ] **AC-06**：三个 SKILL.md 的 frontmatter 均含 `name` 字段，grep `^name:` 各命中至少一行。
- [ ] **AC-07**：grep `~/.claude\|multica-agenthub\|gbrain\|office-hours` 在三个 skill 目录内**全部文件**（含 CONTEXT-FORMAT.md、ADR-FORMAT.md）中结果为空（宿主环境引用）。
- [ ] **AC-08**：grep `/Users/\|/home/` 在三个 skill 目录内**全部文件**中结果为空（绝对路径残留；覆盖 macOS /Users/ 与 Linux /home/ 等宿主家目录绝对前缀）。
- [ ] **AC-09**：grep `影响排序\|impact` 在 `skills/talk-with-zhipeng/SKILL.md` 中命中至少一处。
- [ ] **AC-10**：grep `intake-decision-review` 在 `workflows/make-decision/SKILL.md` 的 S5 段落可命中。
- [ ] **AC-11**：grep `grill-with-docs` 在 `workflows/make-decision/SKILL.md` 的 S7 段落可命中。
- [ ] **AC-12**：`workflows/make-decision/SKILL.md` 中 S2/S4/S7 三个段落各自命中 `talk-with-zhipeng`（共至少 3 处，逐段断言）；旧外部 talk 路径（含 `multica-agenthub.*talk` 或 `~/.claude.*talk`）grep 结果为空。
- [ ] **AC-13**：`tests/moat-skills.test.mjs` 存在，且 grep `direction.*framing.*scope\|framing.*direction\|三.*角度\|angle` 命中——证明测试文件已包含三角度断言代码。
- [ ] **AC-14**：`tests/moat-skills.test.mjs` 存在，且 grep `恰好.*3\|exactly.*3\|findings.*length.*3\|3.*findings` 命中——证明测试文件已包含"恰好 3 条"负例断言代码。
- [ ] **AC-15**：`tests/moat-skills.test.mjs` 存在，且 grep `fallback_used` 命中——证明测试文件已包含 fallback_used 停止断言代码。
- [ ] **AC-16**：`tests/moat-skills.test.mjs` 存在，且 grep `单次\|single.*call\|once\|calledOnce` 命中——证明测试文件已包含单次调用断言代码。
- [ ] **AC-17**：grep `TASK_TRACKING_ROOT` 在 `workflows/make-decision/SKILL.md` 命中 Environment Variables 表。
- [ ] **AC-18**：make-decision SKILL.md 含 S10 落盘前读取 TASK_TRACKING_ROOT 的说明，可 grep `tracking_root_fallback` 或等义降级事件名。
- [ ] **AC-19**：npm test 运行全量绿（0 failures）。
- [ ] **AC-20**：新增测试中，删除任一 skill 文件后对应断言报红（测试本身可证伪）。
- [ ] **AC-21**：make-decision S2/S4 用户交互段：每选项含中文后果说明，至少一项有"推荐"标记，grep `推荐` 在 S2 段落命中，grep `推荐` 在 S4 段落命中；grep `framing\|scope` 作为独立术语直接暴露给用户的结果为空。
- [ ] **AC-22**：`skills/talk-with-zhipeng/SKILL.md` 不含 `gbrain` 关键词（FR-TALK-003 独立验收，与 AC-07 合并可接受）。
- [ ] **AC-23**：make-decision S9 确认段必须含"不确认就不继续"或等义文本，grep `不确认\|not confirmed\|等待确认` 在 S9 段落命中；且不含英文术语 `framing\|scope` 直接暴露给用户。
- [ ] **AC-24**：`config/reuse-registry.md` 中，三个新 skill 各自的名称与 in-repo 相对路径**同处一行**：(a) 含 `talk-with-zhipeng` 的行同时含 `skills/talk-with-zhipeng/`；(b) 含 `grill-with-docs` 的行同时含 `skills/grill-with-docs/`；(c) 含 `intake-decision-review` 的行同时含 `skills/intake-decision-review/`。路径为相对路径（不以 `/Users/` 开头）。（grep 验证：`grep "talk-with-zhipeng.*skills/talk-with-zhipeng\|skills/talk-with-zhipeng.*talk-with-zhipeng"` 等逐行断言三条均命中）
- [ ] **AC-25**：`config/reuse-registry.md` 文件中：(a) grep `/Users/\|/home/` 结果为空（无绝对路径残留，覆盖 macOS /Users/ 与 Linux /home/ 等宿主家目录绝对前缀）；(b) grep `~/.claude\|multica-agenthub\|gbrain\|office-hours` 结果为空（无宿主环境引用，四类全覆盖）。两类分别检测，均需为空。
- [ ] **AC-26**：`skills/talk-with-zhipeng/SKILL.md` 核心章节可 grep 命中：`输入\|步骤\|执行协议` 至少一项命中，`talk` 关键词命中。（FR-TALK-001 搬运硬证据）
- [ ] **AC-27**：`skills/grill-with-docs/SKILL.md` 核心关键词可 grep 命中：`grill` 关键词命中，`输入\|输出\|步骤` 至少一项命中。（FR-GRILL-002 搬运硬证据）
- [ ] **AC-28**：两层断言，均须通过：(1) `tests/moat-skills.test.mjs` 存在且 grep `不得编造\|不自行编造\|缺角度\|重跑\|rerun` 命中——证明测试文件已包含 FR-TEST-004(e) 负例断言代码；(2) `skills/intake-decision-review/SKILL.md` 含三语义，三组 AND 断言全部命中（任一组为空即 fail）：(a) 数量不足/缺角度：grep `不足\|缺角度\|缺.*角度` 命中；(b) 重跑：grep `重跑\|rerun\|重新调用` 命中；(c) 不得编造：grep `不得编造\|不自行编造\|不得补齐\|不补齐` 命中。（FR-TEST-004(e) 负例语义硬证据；RED/GREEN 运行时证据属 build-code 阶段，见 Known Gaps RISK-04）
- [ ] **AC-29**：repo 根 `.mcp.json` 存在、为合法 JSON，且 `mcpServers` 下含 `muyu-search-mcp` 键并含 `command`/`args` 字段；grep `.mcp.json` 无明文秘密（无真实 token/api key 形态）。（FR-MCP-001 硬证据）
- [ ] **AC-30**：`workflows/make-decision/SKILL.md` S3 段落 grep `muyu-search-mcp` 命中，且无「仅用户级配置/仅本机」将外部配置作为唯一来源的措辞残留。（FR-MCP-002 硬证据）
- [ ] **AC-31**：`skills/anysearch/SKILL.md` 存在、frontmatter `name` 字段非空；`skills/anysearch/` 受版本控制文件 grep `/Users/\|/home/` 结果为空；`.env.example` 入库且为占位，`.env` 不被 git 追踪。（FR-SEARCH-001 硬证据）
- [ ] **AC-32**：`workflows/make-decision/SKILL.md` S3 段落 grep `skills/anysearch` 命中 in-repo 相对路径，且 grep `~/.claude.*anysearch` 结果为空。（FR-SEARCH-002 硬证据）

---

## 7. 影响范围

| 文件/目录 | 操作 | 影响 FR |
|---|---|---|
| `skills/talk-with-zhipeng/SKILL.md` | 新建 | FR-TALK-001~003, FR-MOAT-001~003 |
| `skills/grill-with-docs/SKILL.md` | 新建 | FR-GRILL-001~003, FR-MOAT-001~003 |
| `skills/grill-with-docs/CONTEXT-FORMAT.md` | 新建 | FR-GRILL-001, FR-GRILL-003, FR-MOAT-003 |
| `skills/grill-with-docs/ADR-FORMAT.md` | 新建 | FR-GRILL-001, FR-GRILL-003, FR-MOAT-003 |
| `skills/intake-decision-review/SKILL.md` | 新建 | FR-REVIEW-001~004, FR-MOAT-001~003 |
| `workflows/make-decision/SKILL.md` | 更新 | FR-MAKEDEC-001~003, FR-TRACKING-001~002, FR-COMM-001~003, FR-MCP-002, FR-SEARCH-002 |
| `config/reuse-registry.md` | 更新 | FR-REGISTRY-001~002 |
| `.mcp.json` | 新建 | FR-MCP-001 |
| `skills/anysearch/` | 新建（搬入） | FR-SEARCH-001 |
| `tests/moat-skills.test.mjs` | 更新/新增 | FR-TEST-001~005, FR-MCP-001~002, FR-SEARCH-001~002 |

---

## 附录 A：Known Gaps

- grill-with-docs 附属格式文件（CONTEXT-FORMAT.md/ADR-FORMAT.md）内容规格：本 spec 仅要求文件存在（FR-GRILL-001），内容完整性依赖搬运原版，不单独定义内容格式——与"完整存在"措辞无矛盾，"完整"指文件集完整（三个文件均存在），非内容完整。
- 测试文件具体路径：测试断言写入 `tests/moat-skills.test.mjs`（AC-13~16、AC-28 指定该文件）；如 build-code 阶段确认文件名不同，须同步更新对应 AC。
- S2/S4/S9 改写的具体选项文本：本 spec 定义可读性标准（含推荐、含后果、S9 含"不确认就不继续"、高中生可读），具体措辞由实现阶段产出。

---

## 附录 B：质量事实契约（5 项）

### 1. Scope 边界

**IN（本 milestone 必须交付）：**
- 3 个护城河 skill 文件：`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/intake-decision-review/SKILL.md`
- `workflows/make-decision/SKILL.md` S5/S7/talk 三处引用切换为 in-repo 相对路径（不改调度逻辑，不拆 583 行主壳）
- `tests/moat-skills.test.mjs` 新增测试断言契约（AC-13~16、AC-28 指定的测试代码存在）
- `TASK_TRACKING_ROOT` 环境变量声明（FR-TRACKING-001/002）
- make-decision S2/S4/S9 大白话改写（FR-COMM-001~003）
- `config/reuse-registry.md` 新增 3 行登记、清除 ghost 绝对路径

**OUT（本 milestone 明确排除）：**
- make-decision 583 行主壳拆分（另起 milestone）
- debate skill 转 in-repo（保持外部 `/Users/Hugh/Hugh/Project/debate` 现状）

**裁剪机制：** FR-LADDER B 档判断（6 FR 以上 → spec 阶段产出完整契约）；F10 四问 record-only（物理事实记录+浮现，不阻断推进）。

---

### 2. 自检结果

| 项目 | 结论 | 备注 |
|---|---|---|
| FR 编号连续无重复 | pass | FR-MOAT-001~003, FR-TALK-001~003, FR-GRILL-001~003, FR-REVIEW-001~004, FR-MAKEDEC-001~003, FR-TEST-001~005, FR-TRACKING-001~002, FR-COMM-001~003, FR-REGISTRY-001~002, FR-MCP-001~002, FR-SEARCH-001~002，共 32 条，无断号 |
| AC 编号连续无重复 | pass | AC-01~32，共 32 条，无断号，顺序 AC-28→AC-29→…→AC-32 |
| FR↔AC 映射完整 | pass | 每个域的 FR 均有对应 AC 覆盖，含新增 REGISTRY 域（AC-24~25）、COMM 补充（AC-23）、搬运硬证据（AC-26~27）、FR-TEST-004(e) 负例语义（AC-28）、MCP 内置化（FR-MCP-001/002↔AC-29/30）、SEARCH 内置化（FR-SEARCH-001/002↔AC-31/32） |
| 场景覆盖关键路径 | pass | 正常路径、失败路径、降级路径、可证伪测试均有场景 |
| Spec-Purity（无实现代码/shell 命令） | pass | 本 spec 无代码块，仅含 grep 命令示意（文档说明性质），人工确认可接受 |
| NEEDS CLARIFICATION 残留 | pass（0 条） | 决策日志 D1-D6 覆盖所有待决事项，无残留 |
| Known Gaps 段存在 | pass | 见附录 A；RISK-04 阶段边界已明确记录 |

---

### 3. 独立审查摘要

**审查来源：** 异源 codex（trueCrossEngine），共 6 轮，全程独立上下文，与本 spec 生产上下文无交叉。

| 轮次 | verdict | findings 摘要 |
|---|---|---|
| R1 | revise_required | 1 blocking（reuse-registry 路径未固定）+ 6 major + 3 minor |
| R2 | revise_required | 关闭 R1 6 major；遗留 1 major（AC-24 reuse-registry 路径仍模糊） |
| R3 | revise_required | 2 major（新覆盖缺口：AC-13~16 断言对象仍指 SKILL.md 文本；AC-28 负例语义未分层） |
| R4 | revise_required | 1 major（AC-28 grep 范围过宽，需两层断言：测试文件 + SKILL.md） |
| R5 | revise_required | 3 major（/home/ 扫描缺失、测试断言硬度不足、registry 路径未固定至 config/reuse-registry.md）+ 1 minor（AC-28 顺序） |
| R6 | **pass** | 0 findings，direction_divergence=false |

**审查 artifact 路径（记录+浮现）：**
- `.omc/artifacts/ask/codex-spec-r1.md`
- `.omc/artifacts/ask/codex-spec-r2.md`
- `.omc/artifacts/ask/codex-spec-r3.md`
- `.omc/artifacts/ask/codex-spec-r4.md`
- `.omc/artifacts/ask/codex-spec-r5.md`
- `.omc/artifacts/ask/codex-spec-r6.md`

verdict 链：revise → revise → revise → revise → revise → **pass**（R6 终审通过）。

---

### 4. 未解风险

- **RISK-01**：grill-with-docs 搬运时原版路径引用检查——若原版含宿主路径，需逐行清理，风险为遗漏（概率低，可测）。已列入 FR-MOAT-003/AC-08 检测兜底；build-plan 阶段先读原版再搬运（记录+浮现，不阻断）。
- **RISK-02**：talk-with-zhipeng adapter 层改写范围——agenthub 原版 adapter 层复杂度未知，改写可能遗漏路径。build-plan 阶段须先读 agenthub 原版确认改写边界，FR-MOAT-003/AC-08 检测兜底（记录+浮现，不阻断）。
- **RISK-03**：npm test 现有测试与新断言冲突——现有测试结构未完整探索，新断言可能与现有断言命名冲突，build-plan 阶段需先探索测试目录（记录+浮现，不阻断）。
- **RISK-04（阶段边界）**：FR-TEST-004 b/c/d/e 负例的 RED/GREEN 运行时证据属 build-code 阶段义务——spec 阶段（AC-13~16、AC-28）只固定断言契约（测试文件存在 + 断言代码命中），不要求此处产出 mutation/fixture 证明测试会报红的运行时证据；该运行时证据须由 build-code 阶段产出并记录（记录+浮现，非阻断）。
- **RISK-05（baseline 缺口）**：baseline 5 项指标（SKILL.md 完整性率、ghost 路径残留率、测试覆盖率、TASK_TRACKING_ROOT 声明率、registry 同步率）当前全部 unknown/gap——instrumentation 缺口，已记录于 `specs/m13a-moat-skills/baseline-report.md`；build-code 阶段产出后补采（记录+浮现，不阻断）。
- **RISK-06（muyu-search-mcp 真值来源）**：FR-MCP-001 要求 repo 根 `.mcp.json` 声明 `muyu-search-mcp` 的 command/args，但该 server 当前仅存在于用户级 Claude 配置，未在 repo 内可达的 mcp 配置文件中检索到具体 command/args。build-code 阶段须从用户级 Claude MCP 配置提取真实 command/args 写入 `.mcp.json`，并确保鉴权秘密走 env 引用、不入库（记录+浮现，不阻断）。
- **RISK-07（make-decision S3 引用切换面）**：FR-MCP-002/FR-SEARCH-002 涉及 `workflows/make-decision/SKILL.md` S3 段落（路径 A 约行 152-166、路径 B 约行 168）及 S2 Q1（约行 138，提及两路 server 名）的引用切换；build-code 阶段须先读 S3 段落确认全部外部/本机引用点，避免遗漏（记录+浮现，不阻断）。

---

### 5. Handoff Required Reads

下游 build-plan 阶段必读（按优先级排序）：

1. `tasks/m13a-moat-skills/decision-log.md`——权威决策源（D1-D6）
2. `specs/m13a-moat-skills/spec.md`——本文件，FR/AC 契约
3. `specs/m13a-moat-skills/constitution-check.md`——宪法合规检查结论
4. `specs/m13a-moat-skills/baseline-report.md`——baseline 5 指标现状（instrumentation 缺口记录）
5. `config/reuse-registry.md`——当前 registry 实况，build-plan 探索 ghost 路径前先读
6. agenthub talk-with-zhipeng 原版（`multica-agenthub` 内 talk-with-zhipeng skill）——确认 adapter 改写范围再实现 FR-TALK-001~003
7. `~/.claude/skills/grill-with-docs/`——grill-with-docs 原版目录——确认搬运核心章节完整性再实现 FR-GRILL-001~003
8. `workflows/make-decision/SKILL.md`——需更新引用路径的主 skill（S5/S7/talk 三处；另含 S3 双路调研引用切换，FR-MCP-002/FR-SEARCH-002）
9. `~/.claude/skills/anysearch/`——anysearch 原版目录——确认搬入 `skills/anysearch/` 的核心文件、frontmatter、秘密处理（.env.example 占位）再实现 FR-SEARCH-001
10. 用户级 Claude MCP 配置——`muyu-search-mcp` server 的真实 command/args 来源——build-code 提取写入 repo 根 `.mcp.json` 再实现 FR-MCP-001（见 Known Gaps RISK-06）
