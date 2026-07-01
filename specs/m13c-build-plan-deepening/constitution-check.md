# 宪法合规检查 — m13c-build-plan-deepening

> 检查对象：`specs/m13c-build-plan-deepening/spec.md`
> 检查基准：`CONSTITUTION.md` v1.1.0（21 条）+ `constitution-checklist.md`
> 检查日期：2026-07-01

---

## 框架原则（F）

- [x] **F1 薄核心**
  spec 的核心改动对象是 `workflows/build-plan/SKILL.md`（调度层），所有新能力（spec-research、data-contracts、simplicity-guard、plan-reviewer）均下沉到独立 skill/verifier 层；核心只新增"调用入口 + 产物路径约定"，不内嵌业务逻辑；影响范围第 8 节明确各文件角色，核心调度改动最小，符合薄核心定义。

- [x] **F2 窄契约**
  各模块通过窄接口交互：spec-research → research.md、data-contracts → data-contracts.md、plan-reviewer → plan-eng-review.md；FR-RESEARCH-002 规定 research.md 缺失时报告并暂停，而非内部绕过；接口均为"输入文件 + 产物文件"形式，不暴露内部实现，符合窄契约。

- [x] **F3 物理事实靠机器校验但不阻断**
  spec 的采集机制（ambiguity_items 检查、no-placeholder 自检、upstream_delta 格式检查）结果均写入 stage-result.facts 或 quality contract；FR-ANALYZE-002 明确"缺失时记录 warn，不阻断"；FR-TASKS-002 "缺失时记录 warn，流程继续"；FR-PLANREVIEW-002 "记录 unknown + 原因，升级人工"——均为采集记录型，符合不阻断原则。

- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
  独立工程审查通过复用 3rd-review plan-reviewer（FR-PLANREVIEW-001/002）实现，审查失败不硬阻断（D4 口径：记录+升级人工）；spec 第 6 节 OUT 明确剔除了"机器强校验门"；全 spec 无阻断式质量门定义，质量裁决依赖独立审查与人工把关，符合 F4。

- [x] **F5 gate 谨慎添加、出事再补、无用则移除**
  spec 新增机制均源于已有真实失败案例（速读卡 F10 四问列出）；OUT scope 明确剔除 STOP/Knowledge 六节格式机器强校验门（D5 延后）；plan-reviewer 复用已有 3rd-review 基础设施而非新建，无预先堆砌多余关卡，符合 F5。

- [x] **F6 统一外置执行记录**
  FR-TASKDIR-001/002 引入 task_dir 解析器，读取 `config/workflowhub.yaml` 中 task_dir 字段，确保任务跟踪文件写入 repo 外路径；FR-TASKDIR-002 要求测试覆盖默认值回退和显式配置两场景；执行记录统一路径化，符合统一外置原则。

- [x] **F7 推进与不可逆操作不自动越过人**
  FR-RESEARCH-002 明确 research.md 缺失时"暂停并升级人工，不自动跳过"；FR-DATACONTRACTS-002 data-contracts.md 缺失时"流程暂停，升级人工"；FR-PLANREVIEW-002 审查失败时"升级人工"；所有暂停点均要求人工介入，不自动越界推进，符合 F7。

- [x] **F8 简单优先**
  spec 速读卡 F10 四问明确各新增机制的真实收益；D3 决策"复用 3rd-review 而非新建 skill"是典型简单优先选择；D6、D8、D10 均延后以缩小范围；无额外抽象层，符合 F8 简单优先。

- [x] **F9 可证伪、不假绿**
  FR-TASKS-001 no-placeholder 铁律：发现 TODO/TBD 时标记为 blocking item，不自动通过；FR-ANALYZE-002 escalation_path 缺失时记录 warn 而非填假值；FR-RESEARCH-003 跳过外部调研时 note 字段明确标记，不伪造调研结论；缺数据如实记录 warn/unknown，符合可证伪不假绿原则。

- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建**
  速读卡 F10 四问逐一论证各机制的真实历史失败案例支撑；验收条件以 grep 验证为主（AC-01 至 AC-17），不为每个机制新建 CI 执行通道；FR-REGISTRY 仅为新 skill 补登记行，无独立 schema/CI 门；OUT scope 剔除 STOP/Knowledge 机器强校验门，符合 F10。

---

## 质量原则（Q）

- [x] **Q1 记事实而非阻断**
  全 spec 采集机制均为"记录+升级人工"语义（FR-PLANREVIEW-002、FR-DATACONTRACTS-002、FR-ANALYZE-002、FR-TASKS-002）；FR-TASKS-001 no-placeholder 阻断项是唯一例外——但该项阻断对象是 tasks.md 内容本身（人工内容质量），非流程自动门，且强制人工解决后再推进，符合"人工把关"而非"自动门阻断"；整体符合 Q1。

- [x] **Q2 gate 三类划分**
  入口校验：research.md 存在性检查（FR-RESEARCH-002）、data-contracts.md 存在性检查（FR-DATACONTRACTS-002），均仅校验必需产物是否存在；采集记录：ambiguity_items、upstream_delta 缺失写 warn；人工确认：plan-reviewer 失败、data-contracts 缺失时升级人工；三类清晰，无将记录型采集误做阻断门，符合 Q2。

- [x] **Q3 异源审查加人工把关**
  plan-reviewer 基于 3rd-review 现有基础设施（FR-PLANREVIEW-001/003），为独立审查步骤；FR-PLANREVIEW-003 明确禁止新建 skill（复用保证独立性），审查产物 plan-eng-review.md 由独立 verifier 产出，供人工最终把关；符合 Q3 异源审查加人工把关要求。

---

## 技能原则（S）

- [x] **S1 能用外部就不造轮子**
  plan-reviewer 直接复用已有 3rd-review 基础设施（D3 决策），FR-PLANREVIEW-003 硬性禁止新建 skill；simplicity-guard 已在 M13b 落盘，本 spec 直接接入；无重复自研已有能力，符合 S1。

- [x] **S2 外部技能可针对项目改造合宪**
  3rd-review plan-reviewer 复用时按 D4 口径改造失败语义（记录+升级人工，非硬阻断），使其符合 F4/Q1；simplicity-guard 接入 build-plan 是对 M13b 产物的跨工作流复用，无需修改即合宪；符合 S2。

- [x] **S3 迭代时保持最新并就地检查**
  spec 是对 build-plan M13c 的迭代深化，handoff required_reads（附录 A）包含 `workflows/build-plan/SKILL.md`；FR-RESEARCH-003 保留外部调研跳过选项（D7），迭代时可按需启用；reuse-registry.md 新增 upstream_delta 列以记录上游变动，符合 S3。

- [x] **S4 自定义技能必须有指标系统**
  FR-TASKDIR-001/002 引入 task_dir 解析器，任务跟踪文件统一路径化，为指标采集提供路径基础；spec-research 新建后需在 reuse-registry.md 登记（FR-REGISTRY-001），纳入统一注册表；符合 S4 指标系统要求。

- [x] **S5 自定义技能方便子代理调用、省主上下文**
  各新增 skill 产物均为独立文件（research.md、data-contracts.md、plan-eng-review.md），子代理调用后仅返回路径；FR-TASKDIR-001 路径参数化消除对特定 cwd 的隐式依赖；符合 S5 便于子代理调用、省主上下文原则。

- [x] **S6 自定义技能参考市面方案、不闭门造车**
  spec 背景（Section 2）说明参考 agenthub 执行记录中的历史失败案例作为新机制依据；plan-reviewer 参考 3rd-review 已有 1-AI-3-angle 审查概念；simplicity-guard 四阶梯判断参考现有 spec-ladder 方法论；有明确外部参考来源，符合 S6。

- [x] **S7 一阶段一技能、一工作流一文件夹**
  新建 `skills/spec-research/SKILL.md` 对应 Phase 0 research 阶段，独立文件夹；`workflows/build-plan/SKILL.md` 对应 build-plan 工作流，一工作流一文件夹；各子 skill（spec-analyze、spec-tasks）独立修订，互不干扰；符合 S7。

- [x] **S8 自定义技能可独立调用、可搬运**
  FR-TASKDIR-001 要求 skill 通过解析器取得路径，不硬编码绝对路径；FR-RESEARCH-003 跳过选项通过配置控制，不绑死单一环境；spec-research 接受 task-id 和功能描述文本为标准输入，可在不同宿主独立调用，符合 S8。

---

## 汇总

| 类别 | 合规 | 不合规 | N/A |
|------|------|--------|-----|
| 框架原则 F（F1-F10） | 10 | 0 | 0 |
| 质量原则 Q（Q1-Q3） | 3 | 0 | 0 |
| 技能原则 S（S1-S8） | 8 | 0 | 0 |
| **合计** | **21** | **0** | **0** |

**结论：21/21 合规，0 不合规，0 N/A。**

spec 设计核心（复用 3rd-review、task_dir 路径外置、无阻断门、记事实+升级人工）与宪法 F3/F4/F5/Q1/Q2 高度契合；FR-TASKS-001 no-placeholder 阻断项是唯一看似"阻断"的机制，但阻断对象是人工内容质量（tasks.md 内容本身），非自动质量门，强制人工解决后再推进，符合 F4/Q1 的"人把关"而非"自动门卡死"语义。
