# ADR-0037：采用跨语言写作规则精炼所有文档输出物

**源自归档任务 ADR-023**：原任务 `workflowhub-acceptance-flow-hardening-20261006`，原日期 2026-10-07，commit `28e1eca`；逐字来源为 `specs/archive/workflowhub-acceptance-flow-hardening-20261006/decision-log.md:302`。此处归档原决定及其失效事实，当前实施以任务 `workflowhub-skill-quality-regression-20261010` 的 FR-QUAL-007 / P4 为准。

既有重号事实：`docs/adr/0023-stage-reflection-execution-and-status.md` 已存在并使用 0023，不能将原任务 ADR-023 编为领域 ADR-0023；本次采用空闲的 0037，历史原编号和原件保留。仓库领域 ADR 与 decision-log 内部的 ADR-001–ADR-011 是两套编号，不能混用。迁号仅保证可发现，不是新的方向批准；登记方法参照 `docs/adr/0033-acceptance-truth-presentation-and-cohort-parity.md:3`。

## 两条必做落地形态

本节回答原决定要求作者怎样写材料和方法。

1. 模板固定小节骨架：文档头两行 `读者：` 与 `读完要能：`；小节标题可预测下一节内容；每节第一句说明本节回答什么问题；固定 `## 补充材料` 尾部小节承载推导、原始输出与被否方案；`phases/P<n>.md` 采用「结论 → 依据 → 例外与风险」。
2. `SKILL.md` 采用编号写作规则清单：每条一行、祈使句、可自检、显式写出允许的例外、显式声明「这是写作指引，不是质量门」；可读写作清单文件可选，只作该清单的附属。

## 原决定

本节保留原 ADR-023 的五字段，原测量与历史锚点仅说明当时依据，不冒充当前测试。

- **决定**：用 ASD-STE100 与 ISO 24495-1:2023 的核心思想精炼 workflowhub 的所有文档输出物（`decision-log.md`、`spec.md`、`phases/P<n>.md`、`prd.md`、`phases/index.md`）。落地形态只有两条必做：一是模板里的固定小节骨架（文档头两行 `读者：` 与 `读完要能：`；小节标题必须能预测下一节内容；每节第一句说明本节回答什么问题；固定一个 `## 补充材料` 尾部小节承载推导、原始输出与被否方案；`phases/P<n>.md` 采用「结论 → 依据 → 例外与风险」顺序）；二是 `SKILL.md` 里的编号写作规则清单（每条一行、祈使句、可自检、显式写出允许的例外、显式声明「这是写作指引，不是质量门」）。可读写作清单文件可选，只作第二条的附属。精炼单独占 build-plan 一个普通 phase。
- **为什么**：本任务 worktree 的 `decision-log.md` 在本轮重写前实测 1,854 行、326,870 B（更早一版 2,354 行、511,939 B，约 217 B 每行），近三个归档任务分别是 1,392、1,033、928 行，涨的是单行内容。本轮按本条重写后为 548 行、80,069 B（作者交付值）；经两处定点更正后为 549 行、80,492 B，即 m01492 展示给用户的版本。用户逐字要求「精炼、高质量、好阅读、不丢失细节」。与 ASD-STE100 冲突处一律以 ISO 24495-1 为准，因为 ISO 定什么算好文档，STE 定句子和术语怎么收紧。只取跨语言通用规则：一段一主题、一词一义、结论在前、标题可预测、不为缩短而省略词或使用缩写、名词化动作还原成动词、默认主动语态；丢弃英文许可词表与词数与句法硬上限。
- **否掉了什么**：照搬 ASD-STE100 全部可用规则；做自动可读性评分器或字数门；落地 ISO 24495-1 的「拿真实读者试用」原则——做成流程节点即变成 gate；把精炼与 ADR-022 回收合成一个 phase——两者在 `skills/decision-log/SKILL.md` 与 `skills/spec-specify/SKILL.md` 两个文件上重叠，必须分开。
- **后果与风险**：好的是文档有了可自检的写作判据，且零新增控制面。坏的是判据靠人读自检，because 明确不做任何自动校验器、评分器、阻断门、许可词表与字数门。判据第 9 条受必保锚点约束：`skills/spec-plan/templates/phase-template.md:35`、`:50`、`:54` 三句与 `:198-217` 的 G-2 示例块一个字都不能改。
- **影响面**：`skills/decision-log/templates/decision-log-template.md`、`skills/decision-log/SKILL.md`、`skills/spec-prd/templates/prd-template.md`、`skills/spec-prd/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/templates/phase-template.md`、`skills/spec-plan/SKILL.md`。

## 失效事实与本次补做

本节回答原决定为何失去可发现性、当前补做落在哪里。

2026-10-08，commit `de5fec9a` 删除的 decision-log 模板节包括 `## 调研`、`## 动态 Talk 批次`、`## 逐字声明层`，以及原 ADR-023 强制的 `## 补充材料` 尾节；前三节不是完整删除清单。这些删除反向推翻前一天 ADR-023 在对应节的落地，当时没有记录说明原因。删除事实由本任务 Z1 原件「对简报三处症状的更正（有证据）」与 `git show de5fec9a -- skills/decision-log/templates/decision-log-template.md` 交叉读回。原决定只存在于已归档任务材料、未进入 `docs/adr/` 的事实见本次 decision-log 的 U-017 第 4–6 项；不改写原历史记录。

2026-10-10 实读确认，spec 系列六个活文件已有 `读者：` / `读完要能：` 骨架：`skills/spec-specify/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-prd/SKILL.md`、`skills/spec-prd/templates/prd-template.md`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/templates/phase-template.md`。

P4/T011 在 `skills/decision-log/templates/decision-log-template.md` 补读者骨架，按下游消费固定十二节；`## 工作包与决定` 承接唯一 ADR 五字段，`## 验收面` 承接覆盖结论，`## 外置事实索引` 以绝对路径基准和十二个具名条件指针承接过程原件。P4/T012 在 `skills/decision-log/SKILL.md` 补骨架、编号第 7/8 条及「不是质量门」声明。当前模板按 D1 / U-015 / U-016 外置原始输出和推导，本次不恢复已被 `de5fec9a` 删除的 `## 补充材料` 尾节及上述三个过程节；本节保留原落地形态作为历史决定，当前十二节由 FR-QUAL-007 唯一决定。

本次只证明模板与方法文字落地，以及原决定可被发现；后续作者是否按条件指针读取真实原件、日志是否真的变薄，由用户后续实跑读回。缺测试或独立审查保留具体缺口，不以该归档件证明质量通过。
