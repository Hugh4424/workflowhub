# build-plan 输入 ↔ decision-log 字段映射与缺口审计

- 类型：只读审计（未改任何源文件；本报告为交付件）
- 日期：2026-11-19
- 对象：本任务 `execution-quality-build-code-hardening-20261119` 的 decision-log（`specs/execution-quality-build-code-hardening-20261119/decision-log.md`，391 行，状态仍为 `decision-draft` / make-decision 未最终确认，见 stage-handoff:8）
- 方法与原件
  - 字段来源：`workflows/build-plan/SKILL.md`（消费 spec/phase/index）、`skills/spec-plan/SKILL.md:18-30,56-72`、`skills/spec-plan/templates/phase-template.md`（18 卡字段 + 10 文件级机器字段 + 六件验收）、`skills/spec-specify/templates/spec-template.md:113-342`、`workflows/build-code/SKILL.md:180-200`（七步 + Task 图）。
  - 真实产物对照：T13 `PaperBuilder-paperbuilder-architecture-t13-order-sync/specs/paperbuilder-architecture-t13-order-sync/`（spec.md 3007 行、phases/P1–P12、P4-brake-test-card.md 含 T011–T013）；T16 `PaperBuilder/specs/archive/paperbuilder-architecture-t16-feature-consumption-performance/`（spec.md 788 行、phases/P1–P8、P3 含 T007/T008）。二者证明“字段真正被填满”长什么样。

## 1. build-plan 三类产物需要的字段

**A. 全局 spec.md（8 组 + 2 附）**
架构方案（选择方案 / 模块职责 / 被否替代）；接口与失败语义（接口签名 / DTO 字段 / 数据流 / 失败语义 / 新增控制面）；数据与状态（现状→目标差异 / 状态·存储边界）；验收（Appendix A 唯一权威 AC：可观察结果 / 失败判据 / 负控 / 判定对象 / 验收对象 JSON / 证据计划七项）；风险（风险+触发+缓解+验证）；依赖（Phase 大纲 / 谁先谁后 / 阻塞边）；非目标（排除 / 退役，不自动补做）；+ 代码锚点（文件:行 / 符号 / 签名 / 读取顺序，须实读）；+ 需求到任务追踪（Source→FR→AC→Phase→oracle）。

**B. Phase P*.md（5 组 + 10 机器字段）**
独立交付（交出什么、可独立验收、拆/并判据）；写集（精确文件路径 / 唯一 writer / NEW·MODIFY·DO NOT TOUCH / 共享边界先写后写）；依赖（blocked_by，只能更早 Phase）；验收（六件：目标/怎么操作/什么条件/通过失败含反例/真跑或替代/谁判与证据；成本·资源·范围三账；gate_cmd·oracle·evidence_path）；回滚（原 writer 撤回 hunk / 补救与交接 / 触发条件）。机器字段 10：全局规格/写入集/依赖/消费者/gate_cmd/oracle/evidence_path/STOP/覆盖 AC/Done。

**C. Task 卡（18 字段）**
任务编号；来源/FR/AC（逐字，不只写编号）；输入（producer/consumer/提供者/时点）；文件/符号；动作（有序、第一处改动）；输出/失败；边界/禁止改动；依赖；测试层级/技能；场景/夹具或服务；RED/GREEN 门禁命令；预期退出码；RED 目标失败（ORACLE 编号+确切断言）；GREEN 判定器（ORACLE-）；证据；覆盖上限；停止/恢复；完成（前置 vs 完成条件两栏）。对应本任务问的“输入/动作/输出/RED/GREEN/失败 oracle/证据”均在其中。

## 2. 每个字段从 decision-log 哪段取、取不到时 build-plan 怎么补

| 字段组 | 本 decision-log 取源段 | 取不到时 build-plan 的补法 |
| --- | --- | --- |
| 需求 / 来源 | 「原始需求」+需求索引 R-001…R-022 | 回读「外置事实索引」原件；仍缺→记缺口回 make-decision，不猜 |
| 非目标 / 排除 | 「这次覆盖什么，排除什么」+ 各包「边界」 | 可据排除清单补；方向变化回 make-decision |
| 方案/架构/取舍 | 「决定」1–9（含否掉什么/后果风险）+ 九包骨架「范围」列 | 已有取舍直接用；机制取舍缺口按「还有没定」回 owner（用户/原阶段），不自答 |
| 接口/数据/状态 | 决定 2/7/9 的只言片语（status-model.json、加载事件、图） | 读真实代码/技能与 knowledge-graph 补（步骤 1–2 轻研究）；读不到记 `unknown — owner/impact/next` |
| 代码锚点 | **无**（仅命令名/模块名） | build-plan 步骤 1–2 实读源码/图；实读取值，缺失照 spec-template“不以猜测填空”记 unknown |
| 依赖 / 顺序 | 「9 包依赖与验收」依赖列 + 「方向地图」 | 包级依赖可沿用；Phase 级重排由 build-plan 依真实依赖定，变化回 make-decision |
| 验收（AC/负控） | 「验收面（草案）」「9 包依赖与验收」「各包验收草案」——有检查项+反例，无 AC 编号/无正式失败判据/负控表 | 意图转成可执行 AC+oracle；AC 对象/判据变更须回 spec-clarify/make-decision 取用户答复 |
| 风险 / 回退 | 决定 1–9「后果与风险」+「方向审查处置」B1–B5 | 风险可补；“接受风险”须用户真实答复，agent 不得自签 |
| 写集（精确路径） | **无**（只模块名如 `check-stage-steps`、answer-as-page） | 必须读真实代码/技能文件定位；未知写 `unknown`+owner，不阻断无关 Phase |
| Phase 六件/回滚 | 各包「验收草案」弱对应；回滚**无** | build-plan 依 phase-template 补齐；涉及 AC 对象回原 owner |

关键事实：build-plan **不会“猜”**（spec-template:118“每项缺失写 unknown…不以猜测填空”），**不会“跳过收口”**（build-plan SKILL 步骤 11“缺口清单非空时 build-plan 不许收口”）；歧义走 spec-clarify（未答停 `awaiting_user`，不当同意）；方向缺口回 make-decision。所谓“重读聊天”只经答复登记表/外置事实索引回读原件——但本日志 U-012…U-019 已标 backfilled，**不能作当时原件**（决定 3、未决项）。

## 3. 字段 → decision-log 段 → 现状（有/弱/无）

| 字段 | decision-log 段 | 现状 |
| --- | --- | --- |
| 架构方案/模块职责 | 决定 1–9 + 九包骨架范围 | 弱（有方案名与否掉替代，无模块职责/接口） |
| 接口签名/DTO/数据流 | 决定 2/7/9 零散 | 无（无签名、无 DTO 字段、无数据流） |
| 数据/状态 | 决定 7 状态模型、决定 2 加载事件 | 弱（概念有、schema 无） |
| 验收 AC（唯一权威） | 验收面（草案）/9 包依赖与验收 | 弱（检查+反例有，无 AC 编号、无正式失败/负控、明确“落 Phase 卡”待 build-plan） |
| 风险 | 决定后果与风险 + 方向审查 B1–B5 | 有（逐决定带风险；缺 per-Phase 风险矩阵） |
| 依赖/顺序 | 9 包依赖与验收依赖列 | 有（包级；Phase 级待定） |
| 非目标 | 覆盖/排除 + 包边界 | 有（全局清晰；包级部分） |
| 代码锚点（文件:行/符号） | —— | 无（必须实读补） |
| Phase 独立交付粒度 | 九包骨架范围 | 弱（是“包”不是“Phase”；2–7 阶段由 build-plan 切） |
| Phase/Task 写集（精确路径） | —— | 无 |
| Phase/Task gate_cmd/RED/GREEN/oracle | 仅命令名（且多为 build-code 待实现的新命令，当前跑不了） | 无 |
| 失败 oracle / 反例断言 | 验收草案“反例”列 | 弱（有人话反例，无命令/断言） |
| 证据路径 | 「外置事实索引」（决策期研究件，非 Task 证据） | 无 |
| 回滚/恢复 | —— | 无 |

结论：本 decision-log 对**方向、非目标、包级依赖、风险**够用；对**验收意图**只有草案；对**代码锚点、接口、写集、RED/GREEN、oracle、证据、回滚**基本为零——这些正是 T13/T16 的 spec/phases 里最厚、最吃工的部分，现均需 build-plan 从真实代码补。

## 4. 边界：哪些必须在 decision-log，哪些可在 spec-plan 补

**必须在 decision-log（只有 make-decision/用户能定，build-plan 无权重定）**：原始需求与 R 编号、非目标/退役、已确认方案取舍（选择+被否替代+用户答复原件）、包骨架与依赖意图、验收意图（可观察结果+失败方向+负控方向）、风险接受、未决项与 owner、涉及方向的授权。
**可在 spec-plan 补（build-plan 是唯一作者，从真实代码派生）**：代码锚点（实读文件:行/符号/签名）、接口签名/DTO 字段/数据流、精确写集、Phase 拆分粒度、全局与 Phase 验证策略、每条 AC 的精确 gate_cmd/RED 断言/GREEN oracle/evidence_path、Phase/Task 回滚与恢复、成本预算。
**划界准则**：凡“改方向、改 AC/验收对象、改用户已接受的取舍或范围”必须留在 decision-log 且需用户真实答复；凡“把已确认方向落到真实代码接口与可执行命令”属 spec-plan。spec-plan 若发现 AC 对象/判据需变，回 make-decision/spec-clarify，不得自改材料。

## 5. 每包最小必填清单（10 项）与缺项失败行为

每包进 build-plan 前至少具备：①包范围与可观察的独立交付结果；②来源/需求编号（R-xxx + 逐字原文）；③验收意图：可观察结果 + 失败判据 + ≥1 反例/负控；④依赖（blocked_by，真实输入/交付边）；⑤非目标/边界（受保护、不改）；⑥已确认方案取舍（选择 + 否掉替代 + 用户答复锚点）；⑦风险与回退方向（最可能损害 + 恢复条件 + owner）；⑧已知真实文件/模块锚点或“待 build-plan 实读”的具名缺口；⑨接口/数据/状态契约意图（对象、字段、失败语义）；⑩未决项与 owner（哪些留 build-plan、哪些阻塞）。

缺项失败行为：
- 缺 ②③⑥⑦⑩（需求/验收意图/已确认取舍/风险接受/未决 owner）→ **阻塞**：build-plan 不得自撰，回 make-decision 或 spec-clarify；强写即“猜”，违反“缺源 unavailable”。
- 缺 ①④⑤ → build-plan 可从九包骨架与排除清单补，但须标注来源。
- 缺 ⑧⑨（代码锚点/接口）→ build-plan 应实读源码补并留真读记录；读不到记 `unknown`+owner，不阻断无关 Phase，但该 Task **不得开工**（spec-plan“缺一项不得开工”）。
- 缺 ⑪证据/验收时点、⑫成本预算线索 → 记 `incomplete`，写提供者/命令/时点，不写成已验。

（本清单为该任务 9 包的推荐下限；T13/T16 实际每卡 18 字段是本清单落地后的形态，非 decision-log 的最低输入。）
