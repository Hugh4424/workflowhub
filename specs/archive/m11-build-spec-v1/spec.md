---
task_id: m11-build-spec-v1
milestone: M11
stage: build-spec
source_decision_log: tasks/m11-build-spec-v1/decision-log.md
status: draft
---

# 功能规格：build-spec v1（升级 workflows/build-spec/SKILL.md）

> 基于 decision-log.md（m11-build-spec-v1，8 条决策 D-M11-1 至 D-M11-8）。本文件不可覆盖项目级规则。

**功能名**: `m11-build-spec-v1`
**来源**: decision-log.md M11 build-spec v1（spec-specify/clarify 改造引入 + 宪法符合性检查 + baseline 对照度量 + 一次人审 + reuse-registry 登记）
**状态**: 草稿

---

## 速读卡（30 秒看懂这个需求）

**一句话需求**：把 build-spec SKILL.md 从 M6 薄骨架升级到 v1——引入改名自 speckit 的 spec-specify/spec-clarify 技能（零 per-project clone、内置脚手架）、加宪法符合性检查（21 条逐条勾）、加 M10 baseline 5 项指标对照、加一次人审检查点、加 reuse-registry 登记。

**核心改动点**：
- 在 `workflows/build-spec/SKILL.md` 中集成 spec-specify + spec-clarify 两技能的调用流程（改名自 speckit，适配 workflowhub 契约）
- spec-specify/spec-clarify 的去耦：feature 身份改用显式参数（task-id/feature-dir），模板从 workflowhub 内部加载，不再依赖 per-project `.specify/`
- 宪法符合性检查：跑 `constitution-checklist.md` 21 条逐条勾选，结果写入 spec 产物，非 blocking（只记录、不阻断）
- 基线对照度量：产出 M11 自举 task vs M10 baseline 5 项指标对照（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count），阈值人拍、不达标不阻断、产不出对照即失败
- reuse-registry.md 登记 spec-specify / spec-clarify 两行（类别=外部改造适配 + 来源路径）
- build-spec v1 流程含一次人审检查点

**最大影响面**：`workflows/build-spec/SKILL.md`（升级） + 新增 spec-specify / spec-clarify 技能文件（路径待 build-plan 确定） + `reuse-registry.md`（追加两行）+ `constitution-checklist.md` 用法变更（从独立检查表变为 build-spec 流程产物的一部分）

**验收信号**：build-spec v1 跑完产出 spec.md → spec 含 constitution-checklist 勾选结果 → 5 项 M10 baseline 对照已产出 → reuse-registry 可见两新行 → 含一次人审记录。

---

## 1. 问题陈述

workflowhub 的 build-spec stage（M6 五段薄骨架之一）现阶段只是通用"写 spec"提示词骨架：读 decision-log → 写 spec → 产 stage-result → 记 metrics。功能太薄，缺少 speckit 改造后的 spec 生成/澄清能力、缺少宪法符合性检查、缺少自举对照度量、缺少 reuse-registry 登记。M10 自举切换点已完成，需要一个低风险 task 来验证 workflowhub 自研五段流程真能跑通——M11 build-spec v1 就是这个验证载体。

---

## 2. 背景、目标和边界

### 背景

workflowhub 五段骨架已在 M6 建成（make-decision / build-spec / build-plan / build-code / verify-code）。M7-M9 已将前三段和后两段分别升级到 v1。build-spec 仍是 M6 原始骨架（v1.0.0），只有通用 spec 书写流程，未引入 speckit 改造能力。用户明确要求把 speckit-specify / speckit-clarify 改造迁移进 workflowhub（改名为 spec-specify / spec-clarify），做到零 per-project clone、全局直用。同时 workflowhub 宪法（CONSTITUTION.md 21 条）需要每个里程碑做符合性检查，但至今无自动化/半自动化辅助机制。

### 目标

- build-spec v1 能从 decision-log 产出完整 spec（spec.md），过程集成 spec-specify（生成结构化 spec）+ spec-clarify（消除歧义）
- spec-specify/spec-clarify 改名生效，不与本地 speckit-* 冲突
- 零 per-project clone：两个技能不要求目标项目 clone/初始化 `.specify/`；模板/脚手架内置 workflowhub 技能包内
- feature 身份改用显式参数（task-id/feature-dir），不依赖 git 分支推断
- 加宪法符合性检查步骤：产出 constitution-checklist.md 21 条勾选结果进入 spec 产物
- 产出自举 task vs M10 baseline 5 项指标对照
- 在 reuse-registry.md 登记 spec-specify / spec-clarify
- 含一次人审检查点
- 保留 M6 骨架已有的 F10 反过度工程 gate + stage-result 契约 + metrics collector 契约（不回归）

### 非目标（明确不做）

> 逐条继承自 decision-log.md 第 5 节「明确不做」。build-plan / build-code 阶段不得逾越。

1. **不迁移 speckit-plan / speckit-tasks / speckit-analyze**——留 M12（D-M11-7）。
2. **不迁移 speckit-constitution**——冗余，既有 constitution-checklist.md 覆盖（D-M11-6）。
3. **不在目标项目 clone / 初始化 `.specify/`**——脚手架内置技能包，全局直用（D-M11-5）。模板/脚本能力本身不废弃，只废弃 per-project 铺设。
4. **不把 design 阶段其他技能塞进 M11**——按里程碑路由（D-M11-7）。
5. **不做 blocking 质量门**——宪法符合性检查输出 checklist 勾选结果即可，不因不达标卡推进（承接 D5/D7/F4/F10）。
6. **不强制 historical-lessons-used 引用**——按需记、不校验（承接 D22/D5/D7）。

---

## 3. 用户场景与用例

> 角色「编排者」= 在 workflowhub 里驱动一条任务流程的人或主 AI；「子代理」= 被派去执行某段 skill 的助手。

### 场景 3.1：编排者走完整 build-spec v1 流程（正常路径）

- **角色**：编排者有一条已完成 make-decision 的 task，需要把 decision-log 转为完整 spec。
- **操作步骤**：调起 `/build-spec`，build-spec v1 内部按提示词执行：读 decision-log → 调 spec-specify 生成 spec 初稿 → 调 spec-clarify 消除歧义 → 执行宪法符合性检查（逐条勾选 constitution-checklist.md 21 条，结果写入 spec 产物）→ 执行 M10 baseline 5 项指标对照 → 在人审检查点停顿等确认 → 产 stage-result。
- **预期结果**：`specs/m11-build-spec-v1/spec.md` 存在且含必要章节（场景 / FR / 不做 / 验收 / 影响范围，缺一即失败）；宪法符合性检查结果可见（21 条逐条勾，无输出即失败）；M10 baseline 5 项对照已产出（产不出即失败）；stage-result facts 含 `spec_ref` + `requirements`。

### 场景 3.2：spec-specify 用显式 task-id 定位产物路径（正常路径）

- **角色**：build-spec v1 在调用 spec-specify 时传入 task-id = `m11-build-spec-v1`。
- **操作步骤**：spec-specify 用 task-id 推导产物路径（`specs/m11-build-spec-v1/spec.md`），不依赖 git 分支名、不调 `create-new-feature.sh` 创建分支。
- **预期结果**：spec 写入 `specs/m11-build-spec-v1/spec.md`，不触发 git 操作。task-id 缺失时 spec-specify 报明确错误（不静默回退到分支推断）。

### 场景 3.3：spec-specify 模板从 workflowhub 内部加载（正常路径）

- **角色**：build-spec v1 调用 spec-specify，spec-specify 需要加载 spec 模板。
- **操作步骤**：spec-specify 从 workflowhub 技能包内部路径读模板，不访问目标项目 `.specify/templates/`。
- **预期结果**：模板加载成功，spec 按模板结构生成。模板路径不存在时 spec-specify 报明确错误（不做兼容回退读项目 `.specify/`）。

### 场景 3.4：spec-clarify 不依赖 git 分支定位 spec（正常路径）

- **角色**：build-spec v1 调用 spec-clarify 澄清 spec 初稿。
- **操作步骤**：spec-clarify 直接接收 task-id 或 spec 文件路径参数定位 `specs/m11-build-spec-v1/spec.md`，不调 `check-prerequisites.sh` 从当前分支推断 FEATURE_DIR。
- **预期结果**：spec-clarify 正确加载 spec 文件并进行歧义扫描。定位失败时报明确错误。

### 场景 3.5：宪法符合性检查产出勾选结果（正常路径）

- **角色**：build-spec v1 在执行宪法符合性检查步骤。
- **操作步骤**：逐条对照 constitution-checklist.md 的 21 条（F1-F10 / Q1-Q3 / S1-S8），对每一条勾选 `[x]` 符合或 `[ ]` 不符合并附判据，勾选结果写入 spec 产物（如 spec 附录或独立产出文件）。
- **预期结果**：21 条全部在场（不得缺条）；每条必须携带勾选状态（`[x]` 符合或 `[ ]` 不符合）和判据（不得有"空条"——既无勾选也无判据文字的条目）。21 条全部满足"有状态 + 有判据"视为有完整输出；任何一条缺状态或缺判据即视为"未产出完整勾选结果"= 验收失败。`[ ]` 附判据的条目属有效输出，不因不达标阻断 build-spec 主流程推进。

### 场景 3.6：基线对照度量产出（正常路径）

- **角色**：build-spec v1 执行 M10 baseline 5 项指标对照。
- **操作步骤**：对本次 M11 自举 task 采集 5 项指标（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count），与 M10 baseline 值（0.05 / 0.8295 / 1 / 6.075 / 25.25）逐项对照，输出对照表。阈值由人设定（不在 build-spec 内硬编码），不达标不阻断推进。
- **预期结果**：对照表含 5 行（每行：指标名 + M11 实值 + M10 baseline 值 + 方向 delta），表非空。对照表不存在或任一行缺值即失败。

### 场景 3.7：人审检查点停顿（正常路径）

- **角色**：build-spec v1 流程到达人审检查点。
- **操作步骤**：SKILL.md 提示词在此处写明停顿文字，要求执行者在继续前等待人工确认。确认后继续后续步骤（stage-result 产出 + metrics 写入）。
- **预期结果**：检查点可被观察到（SKILL.md 中可 grep 到明确的停顿标记），build-spec v1 不会在无人确认的情况下自动推进。

### 场景 3.8：reuse-registry 登记（正常路径）

- **角色**：build-spec v1 完成后，reuse-registry.md 被更新。
- **操作步骤**：在 reuse-registry.md 表中新增两行——spec-specify（类别：外部改造适配，来源路径指向原始 speckit-specify SKILL.md）+ spec-clarify（类别：外部改造适配，来源路径指向原始 speckit-clarify SKILL.md）。
- **预期结果**：两行均可在 reuse-registry.md 中 grep 到，每行含合法类别枚举值和非空来源路径。缺任一行即失败。

### 场景 3.9：spec 产物缺场景或 FR 无对应场景（失败场景）

- **角色**：build-spec v1 产出 spec 后内检。
- **操作步骤**：核查每个 FR 是否有至少一条 Given/When/Then 场景；核查 A 档硬门五章（用户场景 / FR / 不做 / 验收 / 影响范围）是否齐全。
- **预期结果**：缺 FR 场景或硬门五章缺失→ build-spec 报错、不产 stage-result success、status=failure。

### 场景 3.10：spec-specify 无 task-id 参数（失败场景）

- **角色**：编排者调 spec-specify 但未传入 task-id。
- **操作步骤**：spec-specify 检测到 task-id 缺失。
- **预期结果**：报明确错误信息（"task-id required"），exit 非 0，不创建任何产物，不做分支推断回退。

### 场景 3.11：spec-clarify 找不到 spec 文件（失败场景）

- **角色**：编排者调 spec-clarify 但传入的 spec 路径不存在。
- **操作步骤**：spec-clarify 检测到文件不存在。
- **预期结果**：报明确错误，exit 非 0，不运行歧义扫描。

### 场景 3.12：M6 骨架能力不回归（边界场景）

- **角色**：build-spec v1 执行时。
- **操作步骤**：验证 F10 gate 仍在 SKILL.md 中（4 问可 grep）、stage-result 契约字段不变（spec_ref + requirements）、metrics collector 调用不变（recordSkeleton + updateOwnResult）。
- **预期结果**：三者均在场，M6 既有能力不被 M11 升级覆盖或删除。

### 场景 3.13：M11 自举 task 五段全部跑通并留证据（任务级正常路径）

- **角色**：M11 自举 task（m11-build-spec-v1）走完 workflowhub 完整五段流程。
- **操作步骤**：按顺序执行 make-decision → build-spec → build-plan → build-code → verify-code，每段产出一份 stage-result JSON（落 `specs/m11-build-spec-v1/stage-result-{stage}.json`）并写一条 metrics collector 记录。
- **预期结果**：5 段 stage-result JSON 文件均存在（缺任一段即失败）；5 条 metrics 记录均存在（缺任一条即失败）。执行顺序可被验证（stage-result 文件时间戳或执行记录体现串行顺序）。

### 场景 3.14：task-id 和产物路径稳定可解析（任务级正常路径）

- **角色**：下游消费者（build-plan / build-code / verify-code）需定位 M11 task 的产物和决策记录。
- **操作步骤**：按 D-M11-2 约定的路径访问——task 追踪根 `tasks/m11-build-spec-v1/`（含 decision-log.md）、spec 产物根 `specs/m11-build-spec-v1/`（含 spec.md 和各段 stage-result JSON）。
- **预期结果**：三条路径基线均可解析：`tasks/m11-build-spec-v1/decision-log.md` 存在、`specs/m11-build-spec-v1/spec.md` 存在、`specs/m11-build-spec-v1/` 目录作为 stage-result 落盘根可写。task-id 拼写固定为 `m11-build-spec-v1`，不因分支名或环境变量变化。

---

## 4. 功能需求

> 溯源规则：每条 FR 标注来源 decision-log 决策编号（D-M11-x），可追溯回决策记录。

### 任务级自举约束（FR-TASK）

**FR-TASK-001**：M11 自举 task（task-id=m11-build-spec-v1）必须跑完 workflowhub 完整五段流程（make-decision → build-spec → build-plan → build-code → verify-code），五段按序执行、各不跳过。每段产出一份 stage-result JSON 文件（落 `specs/m11-build-spec-v1/stage-result-{stage}.json`）并写一条独立 metrics collector 记录。任一段缺失、任一段 stage-result 文件不存在、任一段 metrics 记录缺失即判任务级验收失败。（来源：D-M11-1——走完整五段顺序自举，产不出对照即失败）
- **场景**：Given M11 自举 task 执行完成，When 检查 `specs/m11-build-spec-v1/` 目录，Then 5 段 stage-result JSON 均在（make-decision / build-spec / build-plan / build-code / verify-code），缺任一段即失败。
- **场景**：Given 五段中 build-plan 段实际未执行（跳过或仅占位），When 验收，Then 判"五段不完整"失败。
- **场景**：Given 五段全部执行但某段 metrics collector 记录缺失，When 验收，Then 判"任务级 metrics 证据不全"失败。

**FR-TASK-002**：task-id 固定为 `m11-build-spec-v1`，产物路径基线以该 task-id 为唯一锚定——task 追踪根 `tasks/m11-build-spec-v1/`（含 decision-log.md）、spec 产物根 `specs/m11-build-spec-v1/`（含 spec.md + 各段 stage-result JSON）。task-id 不得因分支名、环境变量或执行上下文改变，下游消费者可直接按该字面量解析路径。（来源：D-M11-2——task-id = m11-build-spec-v1，产物落 specs/m11-build-spec-v1/，task 追踪根 tasks/m11-build-spec-v1/）
- **场景**：Given M11 task 在执行中，When 下游消费者按 `specs/m11-build-spec-v1/spec.md` 解析路径，Then 路径解析成功，文件存在。
- **场景**：Given 某段 stage-result 未按约定路径落盘（如落在分支名推导路径），When 验收，Then 判"路径不稳定"失败。

### spec-specify 改造适配（FR-SPECIFY）

**FR-SPECIFY-001**：build-spec v1 的 SKILL.md 必须集成 spec-specify 技能的调用流程——在 spec 生成步骤中，调用 spec-specify（改名自 speckit-specify）生成结构化 spec 初稿，含完整模板章节（用户场景 / FR / 验收 / 影响范围等）。调用方传入显式 task-id 参数（非 git 分支名）。（来源：D-M11-4、D-M11-5）
- **场景**：Given build-spec v1 SKILL.md 被调起且 task-id 已提供，When 执行 spec 生成步骤，Then spec-specify 被调用并产出 `specs/{task-id}/spec.md` 初稿。
- **场景**：Given task-id 未提供，When spec-specify 被调用，Then 报明确错误，不执行（承接 FR-DECOUPLE-001）。

**FR-SPECIFY-002**：spec-specify 的 spec 模板结构必须保留以下 speckit-specify 核心质量机制——（a）给定功能描述后提取关键概念（角色 / 动作 / 数据 / 约束）；（b）对不明确点做合理推断并记录假设；（c）最多 3 个 [NEEDS CLARIFICATION] 标记（且只用于影响范围/安全/用户体验的关键决策）；（d）每个 FR 可测试、可验证。（来源：D-M11-4，保留 speckit-specify 质量规范）
- **场景**：Given 一个有模糊点的功能描述，When spec-specify 生成 spec，Then [NEEDS CLARIFICATION] 标记 ≤ 3 个，假设记录在案，FR 可测试。
- **场景**：Given 一个无模糊点的清晰描述，When spec-specify 生成 spec，Then 无 [NEEDS CLARIFICATION] 标记残留。

**FR-SPECIFY-003**：spec-specify 生成的 spec 章节须按内容复杂度做三档裁剪——A 档硬门五章必填（用户场景 / FR / 不做 / 验收 / 影响范围）；B 档条件章触发才写（模块划分 / 关键实体 / 数据生命周期 / 兼容性），未触发标"本期不涉及（理由）"；C 档可精简（问题陈述一句话带过）。（来源：D-M11-4 + D-M11-5——保留改造技能核心能力，不为"把模板填满"硬写内容；附录B 经验#7）
- **场景**：Given 一个纯流程需求（不涉及新增数据实体），When spec-specify 生成 spec，Then 关键实体章标"本期不涉及（理由）"，不为填满而编造实体。

**FR-SPECIFY-004**：spec-specify 完成后必须生成 spec 质量检查清单（类似 speckit-specify 的 `checklists/requirements.md`），检查项含：无实现细节泄漏、FR 可测试且无歧义、成功标准可度量、所有验收场景已定义、边界已标识、范围已明确。（来源：D-M11-4 + D-M11-5——保留 speckit-specify 质量检查清单机制；附录B 经验#2）
- **场景**：Given spec-specify 完成 spec 生成，When 检查产物，Then `checklists/requirements.md` 存在且各检查项已逐条勾选。

**FR-SPECIFY-005**：spec-specify 的交互式澄清（[NEEDS CLARIFICATION] 处理）遵循 speckit-specify 的格式规范——每题提供 3-5 个互斥选项加推荐项 + 理由，题号 Q1/Q2/Q3 最多 3 题，一次性呈现全部题目后等待回答。（来源：D-M11-4 + D-M11-5——保留 speckit-specify 交互澄清格式；附录B 经验#3）
- **场景**：Given spec 初稿含 3 个 [NEEDS CLARIFICATION]，When 进入澄清环节，Then 3 题按 Q1/Q2/Q3 格式呈现，每题含选项表 + 推荐项，一次性全部呈现。

---

### spec-clarify 改造适配（FR-CLARIFY）

**FR-CLARIFY-001**：build-spec v1 的 SKILL.md 必须在 spec-specify 之后集成 spec-clarify 技能的调用流程——对 spec 初稿执行结构化歧义扫描并交互式澄清，最多 5 个问题。spec-clarify 直接接收 task-id 或 spec 文件路径参数定位 spec（不依赖 git 分支或 `.specify/feature.json`）。（来源：D-M11-4、D-M11-5）
- **场景**：Given build-spec v1 已完成 spec-specify 生成 spec 初稿，When 执行歧义消除步骤，Then spec-clarify 被调用并扫描 spec，最多 5 个交互问题。
- **场景**：Given spec 文件路径不存在，When spec-clarify 被调用，Then 报明确错误，exit 非 0。

**FR-CLARIFY-002**：spec-clarify 的歧义扫描必须覆盖 speckit-clarify 的全部 10 个分类维度——（1）功能范围与行为（核心用户目标/成功标准/显式不做范围/角色区分）；（2）领域与数据模型（实体/属性/关系/唯一性/生命周期/数据量级）；（3）交互与 UX 流程（关键用户旅程/错误-空-加载态/可访问性）；（4）非功能质量属性（性能/可扩展性/可靠性可用性/可观测性/安全隐私/合规）——此为 1 个维度含 6 个子项，非 6 个独立维度；（5）集成与外部依赖（外部服务API及失败模式/数据导入导出格式/协议版本假设）；（6）边界与失败处理（负向场景/限流节流/冲突解决如并发编辑）；（7）约束与取舍（技术约束/显式取舍或拒绝的替代方案）；（8）术语与一致性（规范术语表/已弃用同义词）；（9）完成信号（验收标准可测试性/可度量的 Definition of Done 指标）；（10）杂项与占位符（TODO 标记/未解决决策/模糊形容词如"健壮""直观"缺乏量化）——每维标 Clear / Partial / Missing。（来源：D-M11-4 + D-M11-5——保留 speckit-clarify 10 维歧义分类法，维度数以 speckit-clarify SKILL.md 步骤 2 原文 10 个顶级分类为准；附录B 经验#4）
- **场景**：Given spec 初稿缺少安全/隐私约束声明，When spec-clarify 扫描，Then "Non-Functional Quality Attributes - Security & privacy" 标 Partial 或 Missing。
- **场景**：Given spec 初稿覆盖所有 10 维且充分，When spec-clarify 扫描，Then 所有维标 Clear，输出"无关键歧义"。

**FR-CLARIFY-003**：spec-clarify 的交互式问答必须遵循 speckit-clarify 的纪律——（a）最多 5 题；（b）每次只呈现一题（不提前透露后续题目）；（c）每题含推荐答案 + 简短理由；（d）每题可选多选（2-5 互斥选项）或短回答（≤5 词）；（e）用户答"yes"/"recommended"即采纳推荐。（来源：D-M11-4 + D-M11-5——保留 speckit-clarify 一次一题 + 推荐 + 上限纪律；附录B 经验#5）
- **场景**：Given spec-clarify 有 3 个未解决高影响类别，When 开始交互，Then 一次只呈现一题，含推荐选项和理由；用户回答后呈现下一题。

**FR-CLARIFY-004**：spec-clarify 必须每次接受答案后增量更新 spec 文件——答案写入 `## Clarifications → ### Session YYYY-MM-DD` 节，并立即整合到对应章节（功能歧义→更新 FR、数据模型歧义→更新数据模型节、非功能约束歧义→更新质量属性节等），保留格式、不重排无关节。（来源：D-M11-4 + D-M11-5——保留 speckit-clarify 增量更新规范；附录B 经验#6）
- **场景**：Given 用户回答了关于数据保留期限的问题，When 答案被接受，Then spec 的 Clarifications 节追加 Q&A 记录，数据生命周期节同步更新保留期限约束。

**FR-CLARIFY-005**：spec-clarify 完成时必须输出覆盖率摘要——每维状态 Resolved / Deferred / Clear / Outstanding，若有 Deferred 或 Outstanding 标注是否建议继续推进。（来源：D-M11-4 + D-M11-5——保留 speckit-clarify 覆盖率报告输出；附录B 经验#4）
- **场景**：Given spec-clarify 完成 5 题上限但有 2 维仍 Partial，When 输出摘要，Then 该 2 维标 Deferred（附注"超出问题配额"），建议后续再跑或人工补齐。

---

### 去耦：feature 身份显式化（FR-DECOUPLE）

**FR-DECOUPLE-001**：spec-specify 和 spec-clarify 不得从 git 分支推断 feature 身份。feature 身份必须通过显式参数传入（task-id 或 feature-dir），参数缺失时 fail-loud（明确错误信息，非零退出，不做分支推断回退，不做自动探测兼容层）。（来源：D-M11-5 假设验证第 1 条——显式 feature 身份能替代分支推断）
- **场景**：Given task-id="m11-build-spec-v1" 传入，When spec-specify 运行，Then 产物落 `specs/m11-build-spec-v1/spec.md`，不执行 git branch / checkout。
- **场景**：Given 无 task-id 传入，When spec-specify 或 spec-clarify 启动，Then 报 "task-id required" 错误，exit 非 0。

**FR-DECOUPLE-002**：spec-specify 所需的模板（spec-template.md 等）必须从 workflowhub 内部路径加载，不读目标项目的 `.specify/templates/` 或任何 per-project 脚手架路径。模板路径不存在时 fail-loud，不做 `.specify/` 回退。（来源：D-M11-5 假设验证第 2 条——模板能从 workflowhub/技能包内部加载）
- **场景**：Given workflowhub 内部模板路径存在，When spec-specify 加载模板，Then 成功加载并生成 spec。
- **场景**：Given 内部模板路径不存在，When spec-specify 尝试加载，Then 报 "template not found at <internal-path>" 错误，exit 非 0。

**FR-DECOUPLE-003**：spec-clarify 定位待澄清 spec 文件时，必须通过直接路径参数（task-id 推导或显式文件路径），不通过 git 分支推断、不调用 `check-prerequisites.sh` 读 `.specify/feature.json`。（来源：D-M11-5 假设验证第 3 条——clarify 能定位上一阶段 spec，不靠 `.specify/specs/<branch>`）
- **场景**：Given task-id="m11-build-spec-v1" 传入，When spec-clarify 定位 spec 文件，Then 读取 `specs/m11-build-spec-v1/spec.md`，不执行任何 git 命令。
- **场景**：Given 传入的 spec 路径对应文件不存在，When spec-clarify 定位，Then 报 "spec not found at <path>" 错误，exit 非 0。

---

### 模板/脚手架内置化（FR-TEMPLATE）

**FR-TEMPLATE-001**：speckit 的脚手架（模板/脚本/feature 身份机制）不废弃、不删除，而是从 per-project `.specify/` 铺设迁入 workflowhub 技能包内部。spec-specify/spec-clarify 技能自带所需的模板和必要脚本，调用方项目不感知。（来源：D-M11-5——模板/脚本能力本身不废弃，只废弃 per-project 铺设）
- **场景**：Given spec-specify 被任意项目调起（该项目的 `.specify/` 目录不存在），When spec-specify 生成 spec，Then 成功生成，不要求项目先 `speckit init`。

**FR-TEMPLATE-002**：内置的模板内容保留 speckit-specify 模板的章节结构（11 章模板骨架），但适配为 workflowhub 风格——spec 文件格式与 archive 已有 spec（如 `specs/archive/m7-intake-v1/spec.md`、`specs/archive/m9-verify-code/spec.md`）对齐（速读卡 + 问题陈述 + 背景目标边界 + 用户场景 + 功能需求 + 模块划分 + 关键实体 + 数据生命周期 + 兼容性预留 + 不做和隐性必达 + 验收清单 + 影响范围）。（来源：D-M11-4 改造要求，以及保留 speckit 模板结构质量但适配 workflowhub 格式）
- **场景**：Given spec-specify 用内置模板生成 spec，When 检查 spec 章节，Then 章节与 archive 风格对齐（速读卡在顶、五根支柱不缺），不含 speckit 原有 11 章模板的编号风格（1-11 罗马数字章号改为中文锚点）。

---

### 宪法符合性检查（FR-CONSTITUTION）

**FR-CONSTITUTION-001**：build-spec v1 流程必须含一步宪法符合性检查——对照 workflowhub `constitution-checklist.md` 的 21 条（F1-F10 / Q1-Q3 / S1-S8），逐条勾选 `[x]`（符合）或 `[ ]`（不符合）并附判据，产出含 21 条完整勾选结果的文档。（来源：D-M11-6、D-M11-8 验收 2）
- **场景**：Given build-spec v1 执行完毕，When 检查 spec 产物，Then 含 21 条 checklist（缺任一条即失败），每条有勾选状态（`[x]` 或 `[ ]`）且附判据文字（任一条缺状态或缺判据即失败）。
- **场景**：Given 21 条全部有状态且有判据（含 `[ ]` 附判据的条目），When 验收，Then 视为"已产出完整勾选结果"——不因不达标失败，仅记录浮现。（来源：D5/D7/F4/Q1——记事实不阻断）

**FR-CONSTITUTION-002**：宪法符合性检查输出仅记录不阻断——checklist 勾选结果（含不达标条目）浮现到 spec 产物中供人审查，不因 checklist 不达标而阻断 build-spec 后续推进（stage-result 仍可 status=success）。（来源：D-M11-8 验收 2 注释、D5/D7/F4/Q1）
- **场景**：Given checklist 有 5 条不达标（`[ ]`），When build-spec v1 完成，Then stage-result status=success（若无其他阻塞），不达标仅记录不阻断。

**FR-CONSTITUTION-003**：宪法符合性检查的"未产出完整勾选结果"判据（与 AC2 一致）为——21 条中（a）任一条缺失，（b）任一条无勾选状态（既非 `[x]` 也非 `[ ]`），（c）任一条无判据文字——任一项满足即验收失败。（来源：D-M11-8——失败条件是"未产出完整勾选结果"，不是"不达标"；承接 F9 可证伪）
- **场景**：Given checklist 产物含 15 条 `[x]` + 判据 + 6 条 `[ ]` + 判据，When 验收，Then 视为完整输出（21 条全部有状态有判据），验收通过（不因不达标水平失败）。
- **场景**：Given checklist 产物缺第 5 条（F5），或第 8 条（F8）有勾选无判据，When 验收，Then 判"未产出完整勾选结果"，验收失败。

---

### 基线对照度量（FR-BASELINE）

**FR-BASELINE-001**：build-spec v1 流程必须产出 M11 自举 task vs M10 baseline 的 5 项指标对照——指标名为 missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count，M10 baseline 值为 0.05 / 0.8295 / 1 / 6.075 / 25.25（来自 `specs/archive/m10-baseline-switch/baseline-report.md`），对照表含指标名 + M11 实值 + M10 baseline 值 + 方向 delta。（来源：D-M11-3——对照基线 = M10 baseline-report.md 5 项指标）
- **场景**：Given build-spec v1 执行对照步骤，When 对照产出落盘，Then 表含 5 行，每行 4 列非空（指标名 / M11 值 / M10 基线值 / delta），任一行缺值即失败。

**FR-BASELINE-002**：基线对照的阈值由人设定——build-spec v1 不在 SKILL.md 或代码内硬编码达标/不达标判定逻辑。不达标不阻断推进。（来源：D-M11-3——阈值人拍、不达标不阻断、但产不出对照即失败）
- **场景**：Given 对照表中某指标 M11 值远差于 M10 baseline，When build-spec v1 完成，Then 不因指标差距阻断，stage-result 正常产出，对照表浮现供人判断。

**FR-BASELINE-003**：第 5 项指标命名必须使用 `rework_proxy_count`（M10 baseline-report.md 落盘字段真名），不得使用 roadmap 缺陷数口径旧称或其它别名。对照表表头、文档叙述、代码标识符均用此名。（来源：D-M11-3——统一用 baseline-report.md 真名 rework_proxy_count）
- **场景**：Given 对照表表头或叙述中出现非 `rework_proxy_count` 的别名/旧称（如 roadmap 缺陷数口径旧字段名），When 验收，Then 判命名不合规，失败。

---

### reuse-registry 登记（FR-REGISTRY）

**FR-REGISTRY-001**：spec-specify 和 spec-clarify 两技能必须各在 `reuse-registry.md` 中登记一行——skill 名分别为 spec-specify / spec-clarify，复用类别均为"外部改造适配"，来源路径分别指向原始 speckit-specify / speckit-clarify SKILL.md 的路径。（来源：D-M11-4、D-M11-8 验收 4、D15/D16）
- **场景**：Given build-spec v1 完成后，When grep reuse-registry.md，Then 存在 spec-specify 和 spec-clarify 各一行，类别列 = "外部改造适配"，来源列非空。

**FR-REGISTRY-002**：reuse-registry.md 中 spec-specify / spec-clarify 的登记行必须通过格式校验——类别为合法枚举值（"外部改造适配" / "自研" / "外部依赖" / "改造适配" / "其他平台原生"之一），来源路径为实际存在的文件路径或合法的外部引用字符串。（来源：D-M11-4 + D15 + D16——spec-specify/clarify 为外部改造引入，须在 reuse-registry 登记格式合法行）
- **场景**：Given spec-specify 登记行类别不是合法枚举值，When 校验，Then 判格式不合法，验收失败。
- **场景**：Given spec-clarify 登记行来源路径为空字符串，When 校验，Then 判格式不合法，验收失败。

---

### 人审检查点（FR-REVIEW）

**FR-REVIEW-001**：build-spec v1 的 SKILL.md 必须含一且仅一次人审检查点——在 spec 生成/澄清/宪法检查/基线对照全部完成后、产出 stage-result 之前，SKILL.md 提示词明文要求执行者停顿等人确认。（来源：D-M11-8 验收 5——一次人审）
- **场景**：Given build-spec v1 SKILL.md，When grep 人审相关停顿文字，Then 存在一处人审检查点（不多于一处，不少于一处）。
- **场景**：Given build-spec v1 在人审检查点未获确认，When 尝试继续，Then 不自动推进到 stage-result 产出步骤。

---

### 骨架保留（FR-SKELETON）

**FR-SKELETON-001**：M6 build-spec SKILL.md 中已有的 F10 反过度工程 gate（4 问：真实威胁？已有覆盖？可绕过？长期维护成本？）必须在 v1 SKILL.md 中保留并适用于 v1 所有新增机制。SKILL.md 正文中可 grep 到完整的 F10 4 问。（来源：D-M11-1 完整五段自举要求保留骨架质量；M6 SKILL.md F10 gate 是核心机制不可回归）
- **场景**：Given build-spec v1 SKILL.md，When grep "What real threat does this defend against"，Then 有匹配（F10 gate 4 问完整在场）。

**FR-SKELETON-002**：M6 build-spec SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.spec_ref / facts.requirements / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段，不可删除或重命名已有字段。（来源：D-M11-1——完整五段自举要求每段保留既有契约，build-spec 段不可回归 M6 骨架接口；附录B 经验#8）
- **场景**：Given build-spec v1 产出的 stage-result JSON，When 校验，Then 含 spec_ref + requirements（M6 既有字段在场），且 status/error_code/retryable/missing_items/user_decision/reason 结构不变。
- **场景**：Given build-spec v1 SKILL.md，When 检查，Then grep 到 recordSkeleton + updateOwnResult 调用指令在场。

---

## 5. 模块划分

> 各模块之间通过 stage-result 产物文件和 prompt 文本引用单向传递，属窄契约耦合。

### build-spec SKILL.md（升级）

- **负责什么**：build-spec v1 流程主控——编排 spec-specify → spec-clarify → 宪法符合性检查 → baseline 对照 → 人审检查点 → 产 stage-result + metrics。
- **对外接口**：产 `specs/{task-id}/spec.md` + stage-result JSON + metrics record。
- **依赖谁**：spec-specify 技能、spec-clarify 技能、constitution-checklist.md、M10 baseline report、collector.mjs。
- **测试边界**：提示词文件存在性 + 路径引用可 grep + F10 gate 在场 + stage-result 契约字段不回归。

### spec-specify 技能（新增，路径待 build-plan 确定）

- **负责什么**：接受 task-id + 功能描述（来自 decision-log），生成结构化 spec 初稿（内置模板），含质量检查清单生成，最多 3 个 [NEEDS CLARIFICATION] 交互式澄清。
- **对外接口**：输入为 task-id + 描述文本；输出为 `specs/{task-id}/spec.md` + `specs/{task-id}/checklists/requirements.md`。
- **依赖谁**：内置模板文件（workflowhub 内部路径），不依赖目标项目的 `.specify/` 或 git 分支状态。
- **测试边界**：可独立调起测试（传入 task-id + mock 描述 → 产出文件存在性 + 模板章节完整性 + 无 git 操作）。

### spec-clarify 技能（新增，路径待 build-plan 确定）

- **负责什么**：接受 task-id 或 spec 文件路径，加载现有 spec，执行 10 维歧义扫描，最多 5 题交互式澄清，增量更新 spec 文件。
- **对外接口**：输入为 task-id 或 spec 路径；输出为更新后的 `specs/{task-id}/spec.md`（含 Clarifications 节 + 整合答案）。
- **依赖谁**：spec 文件（由 spec-specify 产出），不依赖 git 分支或 `.specify/`。
- **测试边界**：可独立调起测试（传入已有 spec → 歧义扫描覆盖 10 维 → 交互逻辑验证）。

### constitution-checklist.md（复用，规则来源不变）

- **负责什么**：21 条宪法符合性检查的对照母本。build-spec v1 从中读取 21 条逐条勾选，但本身不被修改。
- **对外接口**：markdown 静态文件，被 build-spec v1 流程读取。
- **依赖谁**：无（纯静态文档，与 CONSTITUTION.md 条目数保持严格相等）。

### reuse-registry.md（更新，追加两行）

- **负责什么**：全仓 skill 复用登记表。M11 追加 spec-specify / spec-clarify 两行。
- **对外接口**：markdown 文件。
- **依赖谁**：无。

---

## 6. 关键实体

**build-spec v1 stage-result 产物**（沿用 M6 结构，M11 可追加不删改）：
- `status`：success | failure
- `error_code`：失败原因描述（success 时为空字符串）
- `retryable`：布尔
- `facts.spec_ref`：相对路径指向产出 spec（如 `specs/m11-build-spec-v1/spec.md`）
- `facts.requirements`：FR 标识符列表或单行摘要
- `missing_items`：未完成项清单
- `user_decision`：布尔（人审检查点确认结果）
- `reason`：人可读的结论描述

**spec 产物（build-spec v1 核心产出）**（结构对齐 archive 已有格式）：
- 速读卡（30 秒看懂）
- 1. 问题陈述
- 2. 背景、目标和边界
- 3. 用户场景与用例（每条 FR 至少一条场景，覆盖正常/失败/边界）
- 4. 功能需求（按功能域分组，FR-{域缩写}-NNN 编号）
- 5. 模块划分（如触发）
- 6. 关键实体（如触发）
- 7. 数据和生命周期（如触发）
- 8. 兼容性预留（如触发）
- 9. 不做和隐性必达
- 10. 验收清单及未决问题
- 11. 影响范围（业务性质）

**宪法符合性检查产物**（含于 spec 产物或作为独立文件）：
- 21 条逐条勾选（F1-F10 / Q1-Q3 / S1-S8），每条为 `[x]` 或 `[ ]` + 判据，无空条

**基线对照表**（含于 spec 产物或作为独立文件）：
- 5 行（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count），每行 4 列（指标名 / M11 实值 / M10 baseline 值 / delta）

**reuse-registry.md 新增行**：
- spec-specify：类别=外部改造适配，来源=speckit-specify SKILL.md 路径
- spec-clarify：类别=外部改造适配，来源=speckit-clarify SKILL.md 路径

---

## 7. 数据和生命周期

- **build-spec stage-result**：每次 build-spec 执行产出一份，落 `specs/{task-id}/stage-result-build-spec.json`。同一 task 重跑覆盖前次。
- **spec 产物**：`specs/{task-id}/spec.md`，是整个 task 的需求真相源，下游 build-plan/build-code/verify-code 均以此为输入。build-spec 阶段写定后，后续阶段只读不写（clarify 阶段的增量更新由 build-spec 收尾）。
- **宪法检查结果**：含于 spec 产物或独立文件，随 spec 产物一起落档，供后续人审对照。
- **基线对照表**：含于 spec 产物或独立文件，随 spec 产物落档。
- **reuse-registry.md**：追加两行，随代码提交长期保留。
- **metrics 记录**：recordSkeleton 在 build-spec 开始时写入，updateOwnResult 在结束时补全。metrics 写失败只 warn 不 throw（对齐 CONSTITUTION F3/Q1）。
- 本期不涉及数据库 / 迁移 / 多版本数据演进。

---

## 8. 兼容性预留

- **spec 产物章节扩展预留**：spec 模板章节可追加（如未来需要加新章），已有 11 章结构不删改。下游 build-plan 按已知章消费，不识别的章跳过。
- **spec-specify/spec-clarify 技能路径预留**：技能文件具体存放位置在本 spec 中不锚定（留 build-plan 设计），但 spec 定义其必须满足的约束——可被 build-spec SKILL.md 引用、内部含全量所需模板和逻辑、不依赖目标项目 `.specify/`。
- **baseline 对照指标扩展预留**：当前 5 项指标，未来 M10 baseline 可追加新指标，对照表格式支持追加列。
- **宪法符合性检查模式预留**：当前为"人工逐条勾"模式，未来可演进为"半自动辅助"（如自动检测某些条目的吻合度，人工审核确认），但 check 的产出格式（21 条逐条勾 + 判据）不变。

---

## 9. 不做和隐性必达

### 明确不做（来源：decision-log §5）

1. **不迁移 speckit-plan/tasks/analyze**——留 M12（D-M11-7）。
2. **不迁移 speckit-constitution**——冗余，既有 constitution-checklist.md 覆盖（D-M11-6）。
3. **不在目标项目 clone/初始化 `.specify/`**——脚手架内置技能包，全局直用（D-M11-5）。模板/脚本能力本身不废弃。
4. **不把 design 阶段其他技能塞进 M11**——按里程碑路由（D-M11-7，路由表见附录）。
5. **不做 blocking 质量门**——宪法符合性检查 + baseline 对照只记录不阻断（D5/D7/F4/F10）。
6. **不强制 historical-lessons-used 引用**——按需记、不校验（D22/D5/D7）。
7. **不在此 spec 中锚定 spec-specify/spec-clarify 的具体实现路径/注册方式**——留 build-plan 设计（decision-log §6 开放问题）。

### 隐性必达

- **spec-specify/spec-clarify 的命名**：技能名为 spec-specify / spec-clarify，不与本地 speckit-* 冲突（D-M11-4 改名要求）。
- **零 per-project clone 可验证**：build-spec v1 后续验证须证实 spec-specify/spec-clarify 在无 `.specify/` 的目标项目中正常调用（AC7）。
- **Design 阶段其他技能路由表**：必须落档（AC8），M11 不误收非本期件（D-M11-7）。
- **不静默回退**：FR-DECOUPLE 三条假设任一不成立必须 fail-loud，不写隐藏兼容层（承接 Let-it-crash）。
- **不废弃 speckit 模板/脚本能力**：只废弃 per-project 铺设（D-M11-5 明确要求）。
- **M6 骨架不回归**：F10 gate / stage-result 契约 / metrics 契约均保留（FR-SKELETON-001/002）。

---

## 10. 验收清单及未决问题

> 逐条来自 decision-log §7（8 条：5 roadmap-hard + 3 derived），每条可手动或命令验证。

### 验收检查（success_criteria）

- [ ] **AC1 — 能产出 spec**：build-spec v1 跑完产出 spec.md（含硬门五章：用户场景 / FR / 不做 / 验收 / 影响范围，缺一即失败）。（来源：D-M11-8 验收 1）
  - 验证方式：检查 `specs/m11-build-spec-v1/spec.md` 存在且含五章标题，每个 FR 至少一条 Given/When/Then。
  - 反向：缺文件或缺任一章即失败。

- [ ] **AC2 — 宪法符合性检查有输出**：spec 产物含 constitution-checklist.md 21 条逐条勾选结果（每条至少 `[x]` 或 `[ ]` + 判据，无空条）。（来源：D-M11-8 验收 2）
  - 验证方式：grep 勾选结果，确认 21 条全部在场、每条有状态（`[x]` 或 `[ ]`）+ 判据文字。21 条全部"有状态 + 有判据"视为完整输出。
  - 反向：缺任一条、任一条无勾选状态、或任一条无判据文字 → "未产出完整勾选结果"失败。`[ ]` 附判据属有效输出，仅记录不阻断。

- [ ] **AC3 — 对照度量产出**：产出 M11 自举 task vs M10 baseline 5 项指标对照表（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count，M10 baseline 值为 0.05 / 0.8295 / 1 / 6.075 / 25.25），每行 4 列非空。（来源：D-M11-8 验收 3）
  - 验证方式：检查对照表文件或 spec 产物中含完整 5 行对照。
  - 反向：对照表不存在或任一行缺值即失败。阈值人拍、不达标不阻断。

- [ ] **AC4 — 复用登记**：reuse-registry.md 含 spec-specify / spec-clarify 两行，各有复用类别（"外部改造适配"）+ 来源路径（非空）。（来源：D-M11-8 验收 4）
  - 验证方式：grep reuse-registry.md 确认两行均在，类别合法，来源非空。
  - 反向：缺任一行、类别非枚举值、或来源路径为空即失败。

- [ ] **AC5 — 一次人审**：build-spec v1 的 SKILL.md 含一且仅一次人审检查点（明文停顿等人确认）。（来源：D-M11-8 验收 5）
  - 验证方式：检查 SKILL.md 中可 grep 到人审停顿标记。
  - 反向：无人审标记或多处人审标记即失败。

- [ ] **AC6 — 改名生效**：技能名为 spec-specify / spec-clarify，不与本地 speckit-* 冲突——workflowhub 内不存在名为 speckit-specify 或 speckit-clarify 的技能定义。（来源：D-M11-8 验收 6）
  - 验证方式：grep workflowhub 内技能定义，确认无 speckit-* 命名。
  - 反向：发现 speckit-specify 或 speckit-clarify 命名即失败。

- [ ] **AC7 — 零 per-project clone 实跑验证**：在一个不含 `.specify/` 目录的目标项目路径下执行 spec-specify，验证不报"missing .specify/"类错误且正常产出 spec（脚手架内置技能包，不铺设到使用方项目）。（来源：D-M11-8 验收 7）
  - 验证方式：在一个不含 `.specify/` 的目录下执行 spec-specify，验证不报"missing .specify/"类错误且正常产出 spec。
  - 反向：要求 `.specify/` 或自动创建 `.specify/` 即失败。

- [ ] **AC8 — 路由不漏**：design 阶段其他技能路由表（D-M11-7）已落档（在 spec 附录或相关文档中），M11 不误收非本期件。（来源：D-M11-8 验收 8）
  - 验证方式：grep 路由表确认包含 speckit-plan/tasks/analyze→M12、speckit-constitution→不迁移、3rd-review→保持外部依赖、stage-summary/evidence/capture-workflow-feedback→不迁移等条目。
  - 反向：路由表缺失、M11 误收 speckit-plan 等非本期件即失败。

- [ ] **AC9 — 五段自举闭环（任务级）**：M11 自举 task 跑完 5 段（make-decision → build-spec → build-plan → build-code → verify-code），5 段 stage-result JSON 均落 `specs/m11-build-spec-v1/` 目录，5 段各有一条 metrics collector 记录（共 5 条，缺任一段即失败）。（来源：D-M11-1——走完整五段顺序自举）
  - 验证方式：检查 `specs/m11-build-spec-v1/` 下存在 5 个 stage-result-{stage}.json 文件 + task-metrics.jsonl 中 5 段各有记录。
  - 反向：任一段 stage-result 缺失、任一段 metrics 无记录、或执行顺序可证明跳段 → 失败。注：此为任务级验收，非 build-spec 自身能力的验收——build-spec 自身 stage-result 仍由 AC1 覆盖。

- [ ] **AC10 — task-id 路径稳定**：task-id = `m11-build-spec-v1` 不变，产物路径基线可解析（`tasks/m11-build-spec-v1/decision-log.md` 存在、`specs/m11-build-spec-v1/spec.md` 存在、`specs/m11-build-spec-v1/` 可写）。（来源：D-M11-2）
  - 验证方式：检查各路径下文件存在且路径由 task-id 字面量推导，不依赖分支名。
  - 反向：task-id 出现变体（如 `m11-build-spec-v2`、`m11_build_spec_v1`）、或路径依赖分支名解析 → 失败。

### 未决问题和风险

> 以下为 decision-log §6 开放问题——本 spec 只确认它们为待设计问题，不在此给出答案。留 build-plan 阶段设计。

- **未决 1**：spec-specify/spec-clarify 去 git 分支身份的具体替代机制（task-id 推断路径？显式 feature-dir 参数？）——build-plan 阶段设计。
- **未决 2**：模板（spec-template.md 等）从 speckit 原仓库迁移进 workflowhub 的存放位置与引用路径——build-plan 阶段设计。
- **未决 3**：spec-specify/spec-clarify 改名后是注册成全局 Claude skill 还是 workflowhub 内 workflow——build-plan 阶段设计（参照 3rd-review 全局注册先例）。
- **未决 4**：宪法符合性检查的具体执行形态（人工逐条勾 vs 半自动辅助）——build-plan 阶段设计，但产出勾选结果是硬验收（不因形态不定而豁免 AC2）。

---

## 11. 影响范围（业务性质）

- **受影响：build-spec SKILL.md**
  - 既有行为：M6 薄骨架，通用"写 spec"提示词。
  - 本需求影响：升级为 v1，集成 spec-specify/clarify → 宪法符合性检查 → baseline 对照 → 人审 → 产 stage-result 的完整流程。
  - 回归要点：F10 gate、stage-result 契约（spec_ref / requirements）、metrics 调用（recordSkeleton / updateOwnResult）必须保留不减。

- **受影响：workflows/ 目录（新增技能文件）**
  - 既有行为：无 spec-specify / spec-clarify 技能。
  - 本需求影响：新增两个技能文件（路径待 build-plan 确定），各为独立可调起的 skill，含内置模板和脚本。
  - 回归要点：新增技能不影响已有 7 个 skill 和行为。

- **受影响：reuse-registry.md**
  - 既有行为：含 11 行 skill 登记（7 个 workflowhub skill + Worker-Mode + 3rd-review + TDD 件 + isolated-browser-qa）。
  - 本需求影响：追加 spec-specify / spec-clarify 两行（类别：外部改造适配）。
  - 回归要点：已有行不变，只追加不删除。

- **受影响：constitution-checklist.md（使用方式变更）**
  - 既有行为：独立静态文档，供里程碑对照。
  - 本需求影响：被 build-spec v1 流程读取并产出勾选结果；文件本身内容不被 M11 修改。
  - 回归要点：21 条条目数不变，与 CONSTITUTION.md 条目数保持严格相等。

- **可能受冲击的业务规则**：D5（记事实非 blocking）和 D7（按需记不校验）——宪法检查不达标不阻断、historical-lessons-used 不校验。M11 实现不得将此两条升级为 blocking gate。

- **明确无影响**：make-decision / build-plan / build-code / verify-code 已有技能；M4 collector.mjs 底座；Multica 路由/API；agenthub 现有实现（零改动）。

---

## 附录 A：Design 阶段其他技能路由表（D-M11-7）

> 此表为 D-M11-7 决策的落档。本 spec 不把表内非 M11 件纳入需求范围（AC8 验证此表在场即通过）。

| 技能 | 路由结论 | 理由 |
|---|---|---|
| speckit-specify/clarify | **M11 本期接入**（改名 spec-*） | M11 核心活，见 D-M11-4 |
| speckit-plan/tasks/analyze | **M12 接入** | roadmap M12 = build-plan v1 |
| speckit-constitution | **不迁移** | 冗余，既有 constitution-checklist.md 覆盖（D-M11-6） |
| 3rd-review | **保持外部依赖** | reuse-registry 已登记外部依赖，verify-code 用 |
| stage-summary / evidence(MCP) | **不迁移** | workflowhub 用 stage-result JSON + collector.mjs 替代 |
| capture-workflow-feedback | **M14 接入** | roadmap M14 = 软反馈采集 |
| testing-system-blueprint / test-routing-advisor | **已属 M8/M9 范围** | 测试方法论归 build-code/verify-code，非 design |
| superpowers-receiving-code-review | **不迁移** | 与 M11 无关，按需外部用 |

---

## 附录 B：Preserved Lessons（经验教训留存记录）

> 本节记录从 agenthub design.md + speckit-specify/clarify 原始提示词中提取的经验教训，以及它们在 build-spec v1 中的处置方式。每条标注"保留"或"替换"及理由。

### 保留的经验

1. **spec 模板章节三档裁剪**（design.md "spec.md 章节（三档）"）：A 档硬门必填（五章）+ B 档条件触发 + C 档可精简。保留为 FR-SPECIFY-003，防止"为填满模板而编内容"。
2. **speckit-specify 质量检查清单**（`checklists/requirements.md`）：保留为 FR-SPECIFY-004，确保 spec 在进入 plan 前自检完整性。
3. **[NEEDS CLARIFICATION] 限制与交互格式**（speckit-specify 步骤 4-6）：最多 3 个标记，优先 scope > security > UX > technical，交互式多选选项 + 推荐。保留为 FR-SPECIFY-002/005。
4. **speckit-clarify 10 维歧义分类法**（speckit-clarify 步骤 2）：覆盖功能范围与行为 / 领域与数据模型 / 交互与UX流程 / 非功能质量属性（含6子项）/ 集成与外部依赖 / 边界与失败处理 / 约束与取舍 / 术语与一致性 / 完成信号 / 杂项与占位符，共 10 个顶级分类（非 12 非 14——原 speckit-clarify SKILL.md 步骤 2 原文即 10 个顶级分类，agenthub inventory 的 "14 dimensions" 和早期 spec 的 "12 维"均为计数错误——将非功能质量属性下的 6 个子项或边界/约束等篇末维度重复计数所致；此处以 SKILL.md 原文为准）。（来源：保留为 FR-CLARIFY-002）。
5. **speckit-clarify 一次一题 + 推荐 + 上限 5 题的纪律**（speckit-clarify 步骤 3-4）：防止一次性信息过载、每题带推荐降低决策成本。保留为 FR-CLARIFY-003。
6. **speckit-clarify 增量更新**（speckit-clarify 步骤 5）：每答一题立即写回 spec，防止上下文丢失。保留为 FR-CLARIFY-004。
7. **spec 阶梯（最简 spec 判断）**（design.md "最简 spec 判断"）：4 级判断——需存在？已有覆盖？更简表达？才落最小内容。保留为 FR-SPECIFY-003 的裁剪原则。
8. **五根支柱（FR/验收/影响范围/场景核心/不做）**（design.md "铁律"）：保留为 spec 产物 A 档硬门五章结构，与 archive 已有 spec 格式对齐。
9. **FR 编号格式 FR-{域缩写}-NNN**（design.md "Forbidden Actions"）：保留，禁止 FR-001 平铺编号。
10. **业务侧测试用例进验收章节**（design.md "测试策略设计"）：保留——每条 FR 至少一条业务可观察的行为判据。

### 有意替换的经验（含理由）

1. **stage-summary（开始/结束版）** → 替换为 **stage-result JSON**。理由：workflowhub 用结构化 JSON 替代 prose 报告（M3 窄契约 stage-result），stage-summary 的进度追踪功能由 M4 collector.mjs 的 recordSkeleton/updateOwnResult 覆盖。design.md 的"待办模板"模式在 workflowhub 中由 TodoWrite 工具承担。
2. **evidence(MCP) + journal.jsonl** → 替换为 **collector.mjs recordSkeleton/updateOwnResult**。理由：workflowhub 已有自研 M4 metrics 底座，不需要 MCP primitive。指标证据统一进 task-metrics.jsonl + global metrics。design.md 的 journal 事件溯源模型被 metrics 记录替代。
3. **gate.sh stage_exit + post_review_pass** → 替换为 **F10 反过度工程 gate（4 问）**。理由：workflowhub 宪法 F10 明确反对"为机器可校验堆基建"——不引入 gate.sh 执行入口，改为提示词内嵌 F10 4 问人审。
4. **design-review（3rd-review pipeline + reviewer verifier）** → 替换为 **一次人审检查点**。理由：workflowhub 不走 design-review pipeline（自审自判红线），而是一次人工确认（承接 Q3 异源审查原则，但不在此建 full pipeline）。speckit 的 spec-purity 预检（grep 无代码/路径/shell 命令）保留为 FR-SPECIFY-004 质量检查清单的子项。
5. **capture-workflow-feedback** → 不迁移。理由：workflowhub 当前无 workflow-feedback 采集机制。roadmap M14 规划软反馈采集，届时再接入。不在 M11 scope。
6. **speckit 11 章模板编号（1-11 罗马数字章号）** → 替换为 **archive 已有 spec 章节结构**（中文锚点：速读卡 + 问题陈述 + 背景目标边界 + ...）。理由：workflowhub 已形成 archive 风格（m7/m9 为证），不另起炉灶。
7. **特征目录 vs task 目录**：speckit 用 `specs/{feature}/` 作产物目录；workflowhub 用 `specs/{task-id}/`。保留 task-id 路径约定（D-M11-2），不与 speckit feature dir 混淆。
8. **design.md 的 `--no-branch` escape hatch** → 升级为 **默认行为（不切分支）**。理由：原 speckit-specify SKILL.md 虽支持 `--no-branch` 但不暴露；build-spec v1 将其升为唯一默认行为（FR-DECOUPLE-001），不做分支推断兼容。

### 有意延期/留待后续里程碑（M11 外）

9. **testing-system-blueprint（风险分级 P0-P3 / 需求↔测试可追溯 / 三层测试节奏 / 发布门）和 test-routing-advisor（feature 分类 + 测试路由）** → **不纳入 M11，归属 M8/M9 已有范围**。理由：agenthub 的测试方法论基建已在 M8（build-code v1）和 M9（verify-code v1）中部分覆盖；M11 build-spec 自身只要求"每 FR 至少一条业务可观察验收判据"（附录B 经验#10），不做更深测试策略嵌入。testing-system-blueprint 和 test-routing-advisor 的完整方法论在路由表（附录A）中标注为"已属 M8/M9 范围"，M11 不重复纳入。此经验未丢弃，只是在正确里程碑已覆盖。

---

## 附录 C：F10 Gate 应用记录

> build-spec v1 引入的每个新机制均过 F10 4 问。全部通过。

| 机制 | Q1 真实威胁 | Q2 已有覆盖 | Q3 可绕过 | Q4 维护成本 | 结论 |
|---|---|---|---|---|---|
| spec-specify 适配引入 | 现 spec 生成太薄，缺结构化能力 | 无 | 否 | 中（技能提示词维护） | 纳入 |
| spec-clarify 适配引入 | spec 歧义未消除导致下游返工 | 无 | 否 | 中（技能提示词维护） | 纳入 |
| Feature 身份显式参数化 | 多 task 并行冲突、per-project clone 摩擦 | 无 | 否 | 低（参数传递） | 纳入 |
| 模板内置化 | per-project clone 摩擦、模板不同步 | 无 | 否 | 低（静态文件） | 纳入 |
| 宪法符合性检查 | 无宪法对照导致的合规盲区 | constitution-checklist.md 存在但未被流程串联 | 否 | 低（checklist 勾选） | 纳入 |
| Baseline 对照度量 | 无对比基线无法评估流程改进 | 无 | 否 | 中（度量计算脚本一次投入） | 纳入 |
| Reuse-registry 登记 | 外部依赖无溯源 | reuse-registry.md 存在 | 否 | 低（表行追加） | 纳入 |
| 人审检查点 | 无人审导致方向漂移 | Q3 原则已定但无具体检查点 | 否 | 低（SKILL.md 中一行提示词） | 纳入 |

---

> 本 spec 基于 decision-log.md（m11-build-spec-v1）全部 8 条决策撰写。每条 FR 标注 D-M11-x 来源可追溯。8 条验收标准已在第 10 章逐条落地。
