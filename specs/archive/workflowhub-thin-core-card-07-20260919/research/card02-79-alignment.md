# CARD-02 交还来源 79 条逐项对齐

> **性质**：CARD-07 `build-plan` 的只读来源对齐支撑文件，不是第五份权威材料，也不替代 `decision-log.md`、`spec.md`、phase authority 或执行索引。
> **来源边界**：逐项读取 CARD-02 归档研究 `REQ-full-inventory.md` 的 B/E/G 三组，并用 `RC-card-07-scope-and-boundary.md` 的重叠面 O1/O3/O7 补齐 CARD-07 特有的三条边界事实。当前归档实测 B=36、E=26、G=14，共 76 条；加三条边界事实后为 79 条。
> **非穷尽声明**：本表只覆盖上述已知 79 条，不代表 CARD-02、CARD-07 或母 PRD 的全部需求。
> **处置枚举**：`本卡承接` / `明确排除` / `交其他卡` / `已被CARD02实现无需重复`。每行恰有一个处置；交其他卡必须给 owner；本卡承接必须给 FR/AC/phase 或 deferred owner。

## 逐项对齐

| source ID | 来源锚点 | disposition | CARD-07 FR/AC/phase 或 owner | 理由 |
| --- | --- | --- | --- | --- |
| REQ-B-01 | 母 PRD SD-01 | 交其他卡 | owner=CARD-06/CARD-10 | 薄核心窄工具、危险授权与整体交付属于删除/集成面；CARD-07 只继承如实披露，不重复实现通用机制。 |
| REQ-B-02 | 母 PRD SD-02 可验证用户结果工作包 | 已被CARD02实现无需重复 | CARD-02 phase authority | CARD-02 已把 phase 定为单一工程权威并要求按可观察结果切片；CARD-07 直接消费。 |
| REQ-B-03 | 母 PRD SD-02 上下文与独立复核 | 交其他卡 | owner=CARD-03/CARD-05 | 实现上下文与独立复核角色分工不是 CARD-07 头脑风暴语义。 |
| REQ-B-04 | 母 PRD SD-02 phase 差异文档 | 已被CARD02实现无需重复 | CARD-02 phase authority | 差异、边界、依赖、测试/验收和全局指针已进入 CARD-02 phase 合同。 |
| REQ-B-05 | 母 PRD SD-03 七值状态 | 交其他卡 | owner=CARD-08 | 历史接续与窄状态集归 CARD-08。 |
| REQ-B-06 | 母 PRD SD-04 五项窄工具 | 交其他卡 | owner=CARD-06 | 窄工具保留与删除面归 CARD-06。 |
| REQ-B-07 | 母 PRD SD-05 整体完成 | 交其他卡 | owner=CARD-10 | 真实入口整体完成与关键失败路径由 CARD-10 汇总；CARD-07 只交 AC 事实。 |
| REQ-B-08 | 母 PRD SD-06 有条件 TDD | 交其他卡 | owner=CARD-04 | TDD 适用性与有效 RED 属 CARD-04。 |
| REQ-B-09 | 母 PRD SD-06 G-2 豁免 | 交其他卡 | owner=CARD-04 | 纯文档/探索任务的 RED 豁免契约归 CARD-04。 |
| REQ-B-10 | 母 PRD SD-07 ①合并审查 | 已被CARD02实现无需重复 | CARD-02 build-plan step 9 | CARD-02 已实现一次冻结 packet 的 merged review；CARD-07 直接使用。 |
| REQ-B-11 | 母 PRD SD-07 ②phase 审查 | 交其他卡 | owner=CARD-05 | build-code phase 审查归 CARD-05。 |
| REQ-B-12 | 母 PRD SD-07 ③集成审查 | 交其他卡 | owner=CARD-05 | 全 phase 集成审查归 CARD-05。 |
| REQ-B-13 | 母 PRD SD-07 ④终末代码审查 | 交其他卡 | owner=CARD-05 | verify-code 终末代码审查归 CARD-05。 |
| REQ-B-14 | 母 PRD SD-07 verify-code 功能验收 | 交其他卡 | owner=CARD-05/CARD-10 | 终末代码审查与整体功能验收边界由 CARD-05/CARD-10 负责。 |
| REQ-B-15 | 母 PRD SD-07 审查点不减少 | 交其他卡 | owner=CARD-05 | 审查工具替换与完整节奏归 CARD-05；CARD-07 不改审查次数。 |
| REQ-B-16 | 母 PRD SD-07 不复审/无 severity 门槛 | 交其他卡 | owner=CARD-05 | finding 处置和复审策略是 CARD-05 合同。 |
| REQ-B-17 | 母 PRD SD-07 审查派发零身份前置 | 交其他卡 | owner=CARD-05/CARD-06 | 审查传输与旧身份机器删除不属于 CARD-07 产品行为。 |
| REQ-B-18 | 母 PRD SD-07 Supersession | 本卡承接 | FR-37 / AC-37 / P1 | CARD-07 的 append-only、原地保留和显式取代关系直接承接该要求。 |
| REQ-B-19 | 母 PRD SD-08 review fallback | 交其他卡 | owner=CARD-05 | 代码审查 fallback 与 unverified 语义归 CARD-05。 |
| REQ-B-20 | 母 PRD SD-08 review unavailable 不替测试失败 | 交其他卡 | owner=CARD-04/CARD-05 | 测试与代码审查的职责分离由 CARD-04/05 维护。 |
| REQ-B-21 | 母 PRD SD-09 逐字双层结构 | 本卡承接 | FR-35 / AC-35 / P1 | 这是 CARD-07 保真结构的核心行为。 |
| REQ-B-22 | 母 PRD SD-09 三档与待复核 | 本卡承接 | FR-35 / AC-35 / P1 | 三档结论、偏离说明和原话变更传播由 CARD-07 实现。 |
| REQ-B-23 | 母 PRD SD-10 append-only | 本卡承接 | FR-37 / AC-37 / P1 | 缺口追加、历史不可覆盖和现行结论属于 CARD-07。 |
| REQ-B-24 | 母 PRD SD-11 并行五件套 | 交其他卡 | owner=CARD-03 | 全阶段并行规则归 CARD-03。 |
| REQ-B-25 | 母 PRD SD-11 并行声明制 | 交其他卡 | owner=CARD-03 | 读写集、owner、接口、合并责任及失败语义归 CARD-03。 |
| REQ-B-26 | 母 PRD SD-11 接口冻结/G-1 | 交其他卡 | owner=CARD-03 | 停并行与重排纪律归 CARD-03；CARD-07 仅记录 OI-016 依赖。 |
| REQ-B-27 | 母 PRD SD-12 删除损失清单 | 交其他卡 | owner=CARD-06 | 通用事实引擎删除损失与窄能力保留归 CARD-06。 |
| REQ-B-28 | 母 PRD SD-13① 具体重构验收 | 交其他卡 | owner=CARD-10 | 套件执行、证据和负责人由 CARD-10 统一。 |
| REQ-B-29 | 母 PRD SD-13② 无重复契约 | 已被CARD02实现无需重复 | CARD-02 authority contract | CARD-02 已建立单一 phase authority 与纯指针索引；CARD-07 不重建检查面。 |
| REQ-B-30 | 母 PRD SD-14 责任指派 | 本卡承接 | DEFER-001 / OI-016 / owner=CARD-07+CARD-04 | 本卡必须冻结共享 make-decision 写面并记录集成责任。 |
| REQ-B-31 | 母 PRD SD-15 质量事实不漂白 | 本卡承接 | FR-43 / AC-43 / P3 | CARD-07 必须保证 review unavailable、unknown 与 incomplete 不写成通过。 |
| REQ-B-32 | 母 PRD SD-16 过渡审查基线 | 交其他卡 | owner=CARD-05/CARD-06 | 审查基线路径及退休归 CARD-05/06。 |
| REQ-B-33 | 母 PRD SD-17 两道人为门 | 已被CARD02实现无需重复 | CARD-02 runtime contract | CARD-02 已保留确认与不可逆授权边界；CARD-07 不新增第三道门。 |
| REQ-B-34 | 母 PRD SD-17 零机器推进前置 | 已被CARD02实现无需重复 | CARD-02 runtime contract | CARD-02 已将质量事实与推进许可分离；CARD-07 只消费该语义。 |
| REQ-B-35 | 母 PRD SD-17 普通命名/append-only | 交其他卡 | owner=CARD-08 | 历史接续和记录层命名归 CARD-08；CARD-07 只负责 decision-log 内容 append-only。 |
| REQ-B-36 | 母 PRD SD-17 质量三支柱 | 已被CARD02实现无需重复 | CARD-02 build-plan quality contract | 新 build-plan 已保留真实事实、独立审查和人工确认三类质量来源。 |
| REQ-E-01 | CARD-05 结果：build-plan 合并审查 | 已被CARD02实现无需重复 | CARD-02 build-plan step 9 | spec 与 phase 的一次合并审查已进入 13 步 build-plan。 |
| REQ-E-02 | CARD-05 结果：②③④审查序列 | 交其他卡 | owner=CARD-05 | build-code/verify-code 审查序列不属于 CARD-07。 |
| REQ-E-03 | CARD-05 结果：只换工具不减点 | 交其他卡 | owner=CARD-05 | 工具替换与次数保持归 CARD-05。 |
| REQ-E-04 | CARD-05 结果：派发零身份前置 | 交其他卡 | owner=CARD-05/CARD-06 | 审查传输与身份机器删除归 CARD-05/06。 |
| REQ-E-05 | CARD-05 结果：适配合同六要素 | 已被CARD02实现无需重复 | CARD-02 merged review contract | CARD-02 已为当前合并审查冻结 packet/finding/timeout/unavailable/provider/fact 语义。 |
| REQ-E-06 | CARD-05 结果：对比实验/go-no-go | 交其他卡 | owner=CARD-05 | 审查工具实验明确不在 CARD-07 范围。 |
| REQ-E-07 | CARD-05 结果：fallback 唯一定义 | 交其他卡 | owner=CARD-05 | fallback 选择与旧审查路径退休归 CARD-05。 |
| REQ-E-08 | CARD-05 结果：不复审 | 交其他卡 | owner=CARD-05 | 复审循环与 severity 规则归 CARD-05。 |
| REQ-E-09 | CARD-05 结果：unverified/审查非验收 | 交其他卡 | owner=CARD-05 | 代码审查不可用与功能验收边界归 CARD-05。 |
| REQ-E-10 | CARD-05 范围 | 交其他卡 | owner=CARD-05 | 六项审查替换能力均为 CARD-05 产品范围。 |
| REQ-E-11 | CARD-05 流程/状态 | 交其他卡 | owner=CARD-05 | 审查工具全生命周期由 CARD-05 定义。 |
| REQ-E-12 | CARD-05 FR-22 | 交其他卡 | owner=CARD-05 | 真实任务对比实验和 fallback 对照归 CARD-05。 |
| REQ-E-13 | CARD-05 FR-23 | 交其他卡 | owner=CARD-05 | 完整审查节奏归 CARD-05；CARD-07 不复制。 |
| REQ-E-14 | CARD-05 FR-24 | 交其他卡 | owner=CARD-05 | 同 scope 不复审与无 severity 门槛归 CARD-05。 |
| REQ-E-15 | CARD-05 FR-25 | 交其他卡 | owner=CARD-05 | 替代审查与 unverified 披露归 CARD-05。 |
| REQ-E-16 | CARD-05 FR-53 | 交其他卡 | owner=CARD-05 | 新审查工具适配合同归 CARD-05；CARD-07 不接工具。 |
| REQ-E-17 | CARD-05 FR-54 | 交其他卡 | owner=CARD-05 | go/no-go 阈值与结果归 CARD-05。 |
| REQ-E-18 | CARD-05 FR-56 | 已被CARD02实现无需重复 | CARD-02 merged review | 一次覆盖 spec+phase 且不拆双审查的能力已实现。 |
| REQ-E-19 | CARD-05 FR-57 | 交其他卡 | owner=CARD-05/CARD-06 | 审查派发零校验及旧身份机器退休归 CARD-05/06。 |
| REQ-E-20 | CARD-05 AC-23 | 交其他卡 | owner=CARD-05 | 审查次数、独立终末记录与失败判据由 CARD-05 验收。 |
| REQ-E-21 | CARD-05 AC-24 | 交其他卡 | owner=CARD-05 | 无复审与不得按 severity 搁置 finding 由 CARD-05 验收。 |
| REQ-E-22 | CARD-05 AC-26 | 交其他卡 | owner=CARD-05 | 各审查点真实执行记录属于 CARD-05 交付。 |
| REQ-E-23 | CARD-05 AC-54 | 交其他卡 | owner=CARD-05 | 工具接入前六要素冻结由 CARD-05 验收。 |
| REQ-E-24 | CARD-05 AC-58 | 交其他卡 | owner=CARD-05/CARD-06 | 派发前置和纯文本引用由 CARD-05/06 处理。 |
| REQ-E-25 | CARD-05 局部风险 | 交其他卡 | owner=CARD-05 | OCR 不预设、规则不迁就结果与 fallback 不硬切均为 CARD-05 风险。 |
| REQ-E-26 | CARD-05 五阶段开工说明 | 交其他卡 | owner=CARD-05 | CARD-05 自身执行合并审查的责任需由其卡内对齐，CARD-07 不代做。 |
| REQ-G-01 | CARD-10 结果：验收套件 | 交其他卡 | owner=CARD-10 | E2E/INTEG/失败路径套件由 CARD-10 执行。 |
| REQ-G-02 | CARD-10 结果：存在性核对与抽验权 | 交其他卡 | owner=CARD-10 | CARD-07 只交付可定位 AC 事实，核对与用户抽验通路由 CARD-10 提供。 |
| REQ-G-03 | CARD-10 结果：整体完成宣称 | 交其他卡 | owner=CARD-10 | 整体完成不能由 CARD-07 单卡宣称。 |
| REQ-G-04 | CARD-10 FR-47 | 交其他卡 | owner=CARD-10 | 套件主体、三部分构成和三要素由 CARD-10 维护。 |
| REQ-G-05 | CARD-10 FR-48 | 交其他卡 | owner=CARD-10 | 任一套件用例失败阻断整体完成属于 CARD-10。 |
| REQ-G-06 | CARD-10 FR-49 | 交其他卡 | owner=CARD-10 | 关键失败路径总账由 CARD-10 维护；CARD-07 仅提交本卡失败事实。 |
| REQ-G-07 | CARD-10 FR-50 | 交其他卡 | owner=CARD-10 | 整体完成的三前置与四项展示由 CARD-10 负责。 |
| REQ-G-08 | CARD-10 AC-47 | 交其他卡 | owner=CARD-10 | 禁止临时增删套件与逐卡重验由 CARD-10 验收。 |
| REQ-G-09 | CARD-10 E2E-2 | 交其他卡 | owner=CARD-04/CARD-05/CARD-10 | RED→GREEN/G-2、审查序列和四阶段真实执行由相应卡产出、CARD-10 汇总。 |
| REQ-G-10 | CARD-10 E2E-2 证据 | 交其他卡 | owner=CARD-04/CARD-10 | 测试产物适用性与 N/A 理由由 CARD-04 定义、CARD-10 核对。 |
| REQ-G-11 | CARD-10 INTEG-3 | 交其他卡 | owner=CARD-05/CARD-09/CARD-10 | 审查节奏与 provider 并发共存不属于 CARD-07。 |
| REQ-G-12 | CARD-10 关键失败路径 | 交其他卡 | owner=CARD-04/CARD-05/CARD-06/CARD-10 | 测试失败、审查不可用和历史失败不漂白分别由 owning 卡产出，CARD-10 汇总。 |
| REQ-G-13 | CARD-10 执行纪律 | 交其他卡 | owner=CARD-10 | 套件主体、逐条执行事实与总体完成结论归 CARD-10。 |
| REQ-G-14 | CARD-10 第一部分 | 交其他卡 | owner=CARD-10 | 每卡事实定位与用户抽验原文通路由 CARD-10 提供。 |
| S2-RC-O1 | RC §6 O1 decision-log 结构双归属 | 已被CARD02实现无需重复 | CARD-02 baseline + CARD-07 D-010/D-029 | CARD-02 已实现通用结构；CARD-07 只在其上增加逐字层、三档、模块台账与现行结论，不重建基线。 |
| S2-RC-O3 | RC §6 O3 覆盖强度校验 | 本卡承接 | FR-44 / AC-44 / P2 | CARD-07 明确承接需求单元级处置、强度与漏项负例；复用 CARD-02 已接线 audit，不新增校验器。 |
| S2-RC-O7 | RC §6 O7 make-decision 共享写面 | 本卡承接 | DEFER-001 / OI-016 / P1 | CARD-07 必须记录与 CARD-04 的冻结面和集成责任；CARD-02 基线只读消费。 |

## 分类计数

| disposition | 条数 |
| --- | ---: |
| 本卡承接 | 8 |
| 明确排除 | 0 |
| 交其他卡 | 60 |
| 已被CARD02实现无需重复 | 11 |
| **合计** | **79** |

验算：`8 + 0 + 60 + 11 = 79`。

## 边界说明

- `明确排除=0` 不是遗漏：不在 CARD-07 范围的 60 条均有明确 owner，因此落 `交其他卡`，不使用无主排除。
- `已被CARD02实现无需重复` 只表示当前 CARD-02 基线已有相应 producer/contract；不表示 CARD-07 的行为验收已完成。
- 本卡承接的 8 条只进入 CARD-07 的 FR/AC、phase 或 deferred 风险；不会把 CARD-03/04/05/06/08/10 的能力拉回本卡。
- 本表是已知来源对齐，不是穷尽性声明。后续来源新增或 CARD-02/CARD-07 合同变化时，必须追加新行或显式 supersession，不得改写历史行来维持计数。

## 2026-09-22 现行处置纠偏（保留上表历史判断）

U-006/U-007 与物理 Phase/可执行细度复核发现，上表 11 条“已被 CARD02 实现无需重复”是当时**结构或声明层**的判断，不能当作当前交付完成。下表逐条取代其现行处置；原表与 `8/60/11` 历史计数保留，不再用于本任务当前覆盖结论。

| source ID | 现行处置 / owner | 原判断失效或限界 | 当前复核目标 |
| --- | --- | --- | --- |
| REQ-B-02 | 本卡承接 / CARD-07 P1～P3 | 旧 Phase 是技术层章节，未证明按可独立验证的用户结果切片；当前 P1 巨大写集也需逐 Task ownership。 | FR-50/AC-50；真实切片只读本包可执行。 |
| REQ-B-04 | 本卡承接 / CARD-07 P1 | CARD-02 未产物理 Phase；本轮初稿又仅一行 Task。 | FR-47/50、AC-47/50；独立文件加完整差异/自身验收。 |
| REQ-B-10 | 本卡承接 / CARD-07 P1 | 旧 merged review packet 审的是 spec+plan/tasks，不是全部独立 Phase；step 声明不是 provider 完成事实。 | FR-48/52、AC-48/52；raw+spec+全部 Phase 冻结审查，缺失保真。 |
| REQ-B-29 | 本卡承接 / CARD-07 P1+P3 | “单 Phase 权威/纯索引”不等于四类产品事实零双权威，CARD-02 AC-AUTH-001/002 现仍 incomplete。 | FR-51/AC-51；本任务四类事实抽样和目标变更传播。 |
| REQ-B-33 | 交其他卡 / CARD-06 总体核对 | 两个人为入口存在，不证明全系统仅此两门；本卡不新增第三门。 | 本卡只读回确认与不可逆授权边界。 |
| REQ-B-34 | 交其他卡 / CARD-06 删除面 | 部分质量事实分离不等于零机器前置；当前 revision/snapshot 只能是身份/诊断，不得升级为工作许可证。 | FR-48/AC-48 保持非 gate；整体退休交 CARD-06。 |
| REQ-B-36 | 本卡承接 / CARD-07 build-plan | 三支柱写入 step 不等于本 task 已有真实测试、独立审查和用户确认；上次审查取消为 unavailable。 | FR-52/AC-52；逐来源事实与缺失状态。 |
| REQ-E-01 | 本卡承接 / CARD-07 P1 | 同 REQ-B-10，旧审查未见独立 Phase 原件。 | 当前 post packet/provider manifest 及审查结果或真实 unavailable。 |
| REQ-E-05 | 交其他卡 / CARD-05 | 现有 wh-review transport 合同不是 CARD-05 新工具选型的六要素适配冻结。 | CARD-05 owner；本卡只修现有 post packet。 |
| REQ-E-18 | 本卡承接 / CARD-07 P1 | “一次审查覆盖 spec+phase”在 CARD-02 只覆盖 plan 内章节，不能代替独立文件审查。 | FR-48/52、AC-48/52；一次完整 post 合并 packet。 |
| S2-RC-O1 | 本卡承接 / CARD-07 P2 | CARD-02 有通用 ADR/OI/source 结构，但没有替本卡实现逐字层、三档、模块台账与现行结论；旧 AC-DOC-001 无填充抽验。 | FR-35/37/44、AC-35/37/44；真实当前记录回读。 |

现行已知 79 条处置由上表覆盖同 ID 的旧处置后，计数为：`本卡承接 16 + 交其他卡 63 + 明确排除 0 + 已被 CARD02 完整实现而无需核对 0 = 79`。这仍是**已知来源分母**，不是穷尽性证明；其中 CARD-07 承接项尚未因重新归属而自动完成。
