<!-- migrated from agenthub packages/core/agenthub/skills/3rd-review/verifiers/vibecoding/intake-reviewer-contract.md -->

# Make Decision 统一审查合同

> 本文件定义 intake 两审（方向/综合）的共享规则和各自维度。
> 合同外发现只能标 `minor`，不能标 `blocking`。

---

## 总则段（两审共享）

### 范围

本合同适用于 `direction`、`detail` 两个 `review_track`。各 track 引用本合同的对应节作为审查维度和阻断规则来源。范围四维维度（Real Pain / Complexity ROI / Risk Scope / Timing）内联在本合同范围节，不再有独立 scope 合同。两个 track 是独立 review flow，不共享 runtime 或 session。

### Finding 分类规则（MR-2）

所有 finding 必须按以下四分类归入一级，再决定是否可标 blocking：

| 分类 | 含义 | 可标 blocking？ |
|------|------|:---:|
| **问题改变** | 方向级——要解决的问题本身变了（真实痛点 vs agent 发明的问题） | ✅ 可 blocking |
| **范围/优先级** | 方向级——该不该现在做、scope 边界是否合理 | ✅ 可 blocking |
| **对需求的解释** | 方向级——原始需求的理解分歧 | ✅ 可 blocking |
| **仅实现层** | 方案/实现细节争议，不改变方向判断 | ❌ 强制降非阻断 |

**仅实现层处理规则**：
- 发现仅实现层争议时，标 blocking 的必须降为 `important` 或 `minor`，不得用 blocking 阻碍推进。
- 若认为实现层风险足够严重（如方案不可行导致需求无法交付），应 `escalate_to_human` 移交 Stage 1（Design），不在 intake 阶段以 blocking 卡死。

### 增量审查规则

第 1 轮：全量审查，按对应节所有维度出 findings。

第 2+ 轮：
1. 逐条核验前轮 blocking；未修复 → blocking。
2. 如果上游决策或需求发生变化，对该变化做全量复审。
3. 新 blocking 只能来自本轮新信息或前轮不可能发现的问题；其余 late finding 标 `minor`。

### 同 Finding 连续 2 轮升级规则（FR-REV-001）

同一 blocking 连续 2 轮未闭合时，finding 必须包含根因、扫描范围、反例矩阵、Closure checklist。
第 3 轮仍未闭合 → `escalate_to_human`。

### 修订记录规则

主 agent 在收到 `revise_required` 后、发起下一轮审查前，必须 append-only 记录失败根因、修改文件、修改摘要、验证命令和结果。reviewer 只读不写；缺修订记录时按证据缺失处理。

### 路径规则

- 正确 project root：`task_tracking_root`，通过 `core/task-dir-parser.mjs` 的 `parseTaskDir()` 解析（优先级：`WORKFLOWHUB_TASK_DIR` 环境变量直接根 → `~/.workflowhub/config.json` 的 `task_dir` 字段 → config 全局 Knowledge 根自动解析到 `Projects/<project-key>/tasks` → 两者皆缺时 fail-loud，见 FR-TASKDIR-001）。
- task 文件位于 `{task_tracking_root}/{task-id}/`，其中 `task-id` 必须匹配 `^[A-Za-z0-9._-]+$`（无路径分隔符、无 `..`）；不匹配的 `task-id` 是调用方 bug，fail-loud，不得静默修正。
- 材料中出现硬编码绝对路径替代 `task_tracking_root`（即未经 `parseTaskDir()` 解析的路径）→ `escalate_to_human`。

---

## review_track: direction

### 三轴审查

每轮必须覆盖三轴，缺一不可：

| 轴 | 含义 | 对照源 |
|----|------|--------|
| **Direction Fit** | 需求方向是否符合项目定位、约束和用户真实目标 | intake-original-context.md、contract.md、plan-ceo-review |
| **Demand Reality** | 问题的真实性——是用户真实痛点还是 agent 发明的问题 | intake-original-context.md、review skill output |
| **Premise Safety** | 方向级假设是否站得住——有没有"错了整件事就崩"的脆弱前提 | intake-original-context.md、plan-ceo-review |

### Required Skill Execution（方向节）

审查员必须直接调用：

- `plan-ceo-review`：premise challenge、scope mode、existing leverage、implementation alternatives、dream state delta、risk review。
- `review`：独立复审需求方向、用户痛点、方案前提假设。

required skill 不存在、不可运行、无法以 report-only 模式执行或输出缺关键结论 → `escalate_to_human`。

### 总原则（方向节）

方向审查的核心判断：**这个需求方向对吗？问题真实吗？值得做吗？**

先回答 5 个问题：
1. **方向对位** — 这个需求方向对准的是用户真实诉求，还是 agent 解读后的衍生品？
2. **问题真实** — 用户说"痛"，是真的痛还是"听起来该痛"？有没有反例？
3. **切口合理** — 目前规划的最小切口是否真的最小？有没有更简单的替代路径？
4. **前提脆弱** — 方向里哪个假设一旦错，整件事就白做？
5. **时机合适** — 现在做还是等某个前置依赖 ready？

### 阻断/非阻断分类（方向节）

**阻断（必须出 revise_required）**：
- 需求方向与用户原始诉求明显偏离（intake-original-context.md 中有明确矛盾）。
- 需求解决的是 agent 发明的问题，不是用户的真实痛点。
- 方向级假设被证伪（"一旦错了整件事就崩"的脆弱假设成立）。
- 存在明显更优的替代路径，且当前路径有明显风险被故意忽略。
- 用户已批准 scope 在 direction 层面被推翻：应降为风险提醒，不得阻断。

**非阻断（应出 pass，可标 important/minor）**：
- 方向没有原则性错误，但切口可以更小。
- 方向正确但前提假设不够明确。
- 用户已批准的 scope 决策的风险提醒。
- 场景优先级排列建议。

### 检查维度（方向节）

| 维度 | 验证方法 |
|------|---------|
| Required Skills 已执行 | 检查 plan-ceo-review/review 输出。无法执行 → escalate |
| 方向与用户目标对齐 | 仅对照 intake-original-context.md，方向是否对准用户原始诉求（禁止读 decision-log.md） |
| 问题真实性 | 检查痛点是否有原始证据（用户原文、数据、已知 bug），还是 agent 构造 |
| 替代路径评估 | 是否考虑过其他方向？有没有"为什么不这样做"的记录 |
| 脆弱前提 | 原始需求隐含的假设中是否有"不成立则全盘白做"的假设 |
| 需求/方案分离 | 方向层是否锁在"问题"而非"方案"上 |
| scope 边界 | 方向是否明确什么在 scope 内、什么明确不在 |
| 时机判断 | 现在做还是等某个前置条件 ready |

### 简洁性非阻断检查（方向节，见 FR-GOV-001）

审查员**非阻断**检查给用户回复的简洁性（不得标 blocking，只能标 important/minor）：
- **先结论后细节**：主 agent 的回复是否先给出结论再展开细节？
- **大白话**：是否有术语堆砌、内部路径暴露？
- **表格合理使用**：是否仅用于横向对比？
- **artifact 结构**：摘要在前 + 详情在后？

### 框架挑战职能（intake-direction-review 适用，纯盲审）

框架挑战不评估方向的正确性，而是质疑"问题该不该这么解"——在**不知道拟定方向的前提下**，检查是否还有未被考虑的框架级替代。这是 intake-direction-review 的核心职能之一，内置于方向节审查中。

| 维度 | 验证方法 |
|------|---------|
| 问题框架正确性 | 需求被定义的这个"问题空间"是否站得住？会不会其实完全不是这个问题？ |
| 框架级替代 | 有没有完全不同于当前拟定方向的解题框架未被考虑？ |
| 隐含约束质疑 | 当前方向依赖的约束条件是否真的成立？去掉约束会怎样？ |
| 框架级风险 | 如果方向选错了，影响半径和回退成本是多少？ |

框架质疑若成立 → 可标 blocking（方向节内处理，不走仅实现层降级）。
**框架挑战的输入仅含原始需求，禁止包含任何拟定方向；审查包中发现拟定方向 → 立即 `escalate_to_human`。**

---

## review_track: detail

> **注**：intake-detail-review 是综合审查，一次覆盖盲点（Blindspot）、细节（Detail）、漂移（Drift）、范围（Scope）四个维度。本节定义各维度的规则；完整审查清单见 `intake-detail-reviewer.md`。

### 五轴审查

每轮必须覆盖五轴，缺一不可：

| 轴 | 含义 | 对照源 |
|----|------|--------|
| **Source Accuracy** | 每条决策的来源类型（原文要求/衍生/新增）是否真实 | decision-log 第 3 节、intake 原始上下文 |
| **Decision Consistency** | D1-D13（或现有决策）之间有无逻辑冲突 | decision-log 全篇 |
| **Assumption Completeness** | 假设节有没有漏掉关键的脆弱假设 | decision-log 第 4 节、实际依赖 |
| **Verifiability** | 验收标准是否可验证、不模糊 | decision-log 第 7 节 |
| **Open Issue** | 开放问题哪些其实现在就该定 | decision-log 第 6 节 |

### Required Skill Execution（细节节）

审查员必须直接调用：

- `review`：独立复审——聚焦细节质量，不重复方向/盲点内容。

required skill 不存在、不可运行、无法以 report-only 模式执行或输出缺关键结论 → `escalate_to_human`。

### 总原则（细节节）

细节审查的核心判断：**决策记录本身经得起推敲吗？**

先回答 5 个问题：
1. **诚实标记** — 每条决策的"来源类型"是诚实的还是美化的？有没有把"衍生"或"新增"伪装成"原文要求"？
2. **逻辑自洽** — 各决策之间矛盾吗？D1 的后续连锁决策是否与 D1 意图一致？
3. **假设全面** — 第 4 节假设覆盖了所有脆弱前提吗？有没有明显该写但没写的？
4. **可验收性** — 第 7 节的每条验收标准是否可以被客观判断？有没有模糊措辞？
5. **拖不得的问题** — 第 6 节哪些开放问题其实现在该定，不该留给实现期？

### 阻断/非阻断分类（细节节）

**阻断（必须出 revise_required）**：
- 来源类型造假：把"新增"或"衍生"伪装成"原文要求"。
- 决策间存在逻辑矛盾，且放行后会导致方案不可实施。
- 关键脆弱假设未写入且一旦崩塌会推翻当前方案。
- 验收标准模糊/不可判定，无法支撑 gate 推进。
- 明显该实现的开放问题被拖延且未注明理由。
- 决策的版本锚点缺失或已过期。

**非阻断（应出 pass，可标 important/minor）**：
- 次要假设不够显式但不脆弱。
- 验收标准措辞可更精确但不影响判断。
- 开放问题优先级排序建议。
- 决策记录格式建议（编号规范、措辞等）。

### 检查维度（细节节）

| 维度 | 验证方法 |
|------|---------|
| Required Skills 已执行 | 检查 review skill 输出。无法执行 → escalate |
| 来源类型诚实性 | 逐条比对该决策的原文出处：是否真的来自用户原文，还是 agent 衍生 |
| 决策一致性 | 跨决策检查逻辑链条：Dn 与 Dn+1 是否兼容 |
| 假设完整性 | 假设节是否包含"不成立则方案崩"的关键前提 |
| 验收可测性 | 每条验收标准是否可运行命令/日志验证/人工可判定 |
| 开放问题及时性 | 检查哪些开放问题应在本阶段定而不是留到实现 |
| 版本锚点 | decision-log frontmatter version 是否存在且最新 |

### 阻断/非阻断分类（盲点维度）

**阻断（必须出 revise_required）**：
- 遗漏关键角色或用户群体，导致设计覆盖不完整。
- 未被覆盖的失败模式在当前设计方案下会造成实质损失。
- 方向决策依赖的默认前提被证伪或明确不可靠。
- 存在虚假共识（多方都同意是因为互相确认而非独立判断）。

**非阻断（应出 pass，可标 important/minor）**：
- 场景覆盖不够细但不影响方向判断。
- 建议补充的边界测试案例。
- 长尾维护成本尚未估算但不影响 MVP。
- 假设不够显式但不脆弱的。

### 阻断/非阻断分类（漂移维度）

**阻断（必须出 revise_required）**：
- 方向级偏移：拟定方向解决的不是用户真实提出的问题。
- 原始需求中的核心关切在 decision-log 中被忽略或降级。
- 未经用户确认就扩大了 scope（不在原文+未在 intake-original-context.md 原始需求台账得到认可）。

**非阻断（应出 pass，可标 important/minor）**：
- 方向与原始需求基本对准，但措辞有轻微解读偏差。
- 次要需求优先级稍有调整且理由充分。

### 阻断/非阻断分类（范围维度）

**阻断（必须出 revise_required）**：
- 痛点维标了「证据」却无任何用户原文/数据来源（伪证据，把主观伪装成客观）。
- 裁决为「可以做」但风险与影响范围维明确为负面或"无法判断"，裁决与四维结论自相矛盾。
- 丢弃台账有条目但缺丢弃理由或去向（沿用 FR-TWZ-008，理由缺失对裁决有强制阻断力）。
- 痛点是 agent 发明的问题、原始上下文中无任何支撑（MR-2「问题改变」级）。

**非阻断（应出 pass，可标 important/minor）**：
- 四维结论正确但某维证据可以更扎实。
- 裁决合理但推翻条件清单不够具体。
- ROI 估算偏乐观但方向无误。
- 仅实现层的复杂度争议（按 MR-2 强制降非阻断）。
- 用户已批准的 scope 决策被推翻：应降为风险提醒，不得阻断。

### 范围四维（scope 四维定义，内联）

| 维度 | 含义 | 对照源 |
|------|------|--------|
| **Real Pain（真实痛点）** | 是用户真实痛点还是 agent 发明/推断的问题 | intake-original-context.md、decision-log.md |
| **Complexity ROI（复杂度与 ROI）** | 改动量是否可估、ROI 是否成立（可量化 vs 靠猜） | decision-log.md、plan-ceo-review |
| **Risk Scope（风险与影响范围）** | 改动边界是否清楚、受影响模块是否列得出 | decision-log.md、plan-ceo-review |
| **Timing（时机）** | 现在做合不合适、有没有前置依赖或资源冲突 | decision-log.md、项目计划/阶段目标 |

范围维度的五个核心判断问题：
1. 痛点有用户原文/数据支撑，还是 agent 推断？
2. 复杂度可估吗？ROI 是可量化还是靠猜？
3. 改动边界列得出吗？有没有"无法判断影响范围"被当成"风险可控"？
4. 现在做还是该缓？有没有前置依赖/资源冲突被忽略？
5. 四选一裁决（可以做/可做但缓一缓/有风险需限制范围/不建议做）与四维结论是否一致？推翻条件清单有没有？

---

## 判据 C1-C6（intake 材料通用验收判据）

> 本节定义 intake 材料（decision-log、scope 决策、open_questions 等）必须满足的六条通用判据，供方向节、细节节审查在各自维度基础上统一校验。任一判据 fail → 该 finding 至少标 `important`；触及方向/范围/需求解释类的 fail（C1、C3、C5、C6）→ 可标 `blocking`，按 MR-2 分类规则归类。

### C1：原始需求原文引用

**判据**：decision-log / intake 材料中引用用户原始需求处，必须是**逐字引用**（verbatim quote），并附可定位的出处（如 intake-original-context.md 的行号、章节、或对话时间戳/comment id）。

**Pass**：每处声称"用户说过"的内容，都能在 intake-original-context.md 或来源对话中找到完全一致（不改写、不摘要）的原文，且引用处标注了可定位的出处。

**Fail**：
- 引用是复述/改写而非原文（措辞与原文不一致）。
- 声称"用户要求 X"但找不到可定位出处。
- 出处指向一个不存在或已过期的位置。

### C2：决策证据

**判据**：decision-log 中每一条决策（Dn）必须有可追溯证据支撑，不能仅是断言。证据类型包括：来源对话引用、外部接口/文档确认、用户明确批准记录。

**Pass**：逐条决策都能找到对应证据链接/引用，证据类型明确（可分类为"来源对话""外部接口确认""用户批准"三者之一或组合），且证据可独立核验（reviewer 无需信任 agent 的转述即可查证）。

**Fail**：
- 决策仅有结论没有证据（"决定采用方案 A"但无理由/来源）。
- 证据是 agent 自己的推断而非可核验来源。
- 证据链接失效或指向的内容与决策不匹配。

### C3：scope in-out 完整性

**判据**：`scope.in` 与 `scope.out` 必须同时存在且非空，且两者合起来不能留下"这个东西到底在不在 scope 内"的悬空歧义。

**Pass**：`scope.in` 列出的每一项都有明确边界；`scope.out` 明确列出被排除的项目及排除理由；对读者可能疑惑"这个算不算"的边界情形，至少归入 in 或 out 之一。

**Fail**：
- `scope.in` 或 `scope.out` 任一为空/缺失。
- 存在读者能合理提出"这个到底算不算 scope 内"且材料未给出答案的条目。
- scope.in 与 scope.out 有条目冲突（同一项既在 in 又在 out）。

### C4：无悬挂开放问题

**判据**：前序轮次遗留的所有 open question，必须在本轮material 中要么已被解决（有明确结论和证据）、要么被显式保留为 open（写明仍未解决及原因），不允许被静默移除或遗漏。

**Pass**：逐条核对前轮 open_questions 列表，每一条在本轮都能在"已解决"或"仍标记 open"两类中找到对应记录，无遗漏。

**Fail**：
- 前轮某条 open question 在本轮材料中彻底消失，且找不到解决记录或保留说明（静默丢弃）。
- 声称"已解决"但无支撑证据（违反 C2）。

### C5：方向一致性

**判据**：intake 决策整体方向不能与原始需求陈述的目标相矛盾。

**Pass**：逐条关键决策与原始需求目标（intake-original-context.md 中用户陈述的目的）比对，无实质性冲突；如有偏离，材料中有明确的、用户认可的改变理由记录。

**Fail**：
- 决策实质上解决的是与原始需求目标不同/相反的问题，且无用户认可的变更记录。
- 决策与原始需求目标存在未被承认、未被讨论的矛盾。

### C6：标准字段非空（对应 tasks.md T008 / spec.md AC9-2）

**判据**：受审材料中 `decision` / `scope.in` / `scope.out` / `open_questions` 四个标准字段必须全部存在（不缺失）且非空（不是空字符串、空数组、空对象、占位符文本）。

**Pass**：四个字段均可在材料中定位到，且每个字段至少含一条实质内容（非占位符如"TBD"、"待补充"、空列表 `[]`）。

**Fail**：
- 任一字段在材料结构中缺失（字段本身不存在）。
- 字段存在但值为空（空字符串/空数组/空对象）或仅为占位符文本。

---

## 修订记录

主 agent 在收到 `revise_required` 后、发起下一轮审查前，必须 append-only 记录失败根因、修改文件、修改摘要、验证命令和结果。reviewer 只读不写；缺修订记录时按证据缺失处理。
