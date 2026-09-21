# I-C：CARD-05（审查链替换）完整范围分析

- 分析任务：从 PRD 与规划 decision-log 提取 CARD-05 完整范围，切分「plan 审查改造」（并入 card-02）与「代码审查改造」（留在 CARD-05）
- 输入：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`、同目录 `decision-log.md`、`skills/` 现状
- 性质：只读分析。所有原文摘录带行号，逐字不概括（`prd.md` 记作 P，`decision-log.md` 记作 D）
- 日期：2026-09-19

---

## 0. 一句话结论

CARD-05 的官方范围是「**审查节奏不变、只把 wh-review 换成新代码审查工具**」，共 4 个节奏点。其中**第 ① 个节奏点「build-plan 合并审查」是纯文档审查（审 spec + phase 文件），其质量核心与 CARD-02 的交付物完全重合，是唯一应当并入 card-02 的部分**；②③④ 三个节奏点审的是 worktree/diff 代码，必须留在 CARD-05。工具替换本体（适配合同 + 对比实验 + go/no-go + fallback）是跨全部 4 个节奏点的共享基础，**不能整块下移给 card-02**。

---

## 1. CARD-05 原文完整摘录

### 1.1 CARD-05 任务卡全文（P L353–388）

> 353: ### CARD-05 审查链替换(有证据门槛)
> 354:
> 355: - **结果与 consumer**:审查节奏按 SD-07 完整序列——①build-plan 合并审查一次(build-plan 完成后、build-code 开工前,一次同时覆盖 spec 与 phase 文件,质量核心=原 spec 审查的需求翻译完整性/验收可执行/架构合理 + 原 plan 审查的依赖正确/并行声明/写集,两类合一,OI-014)+②build-code 内每 phase 一次+③全 phase 结束集成审查一次+④verify-code 单独命名的「终末代码审查」一次(独立事实、不与功能验收共用一条;verify-code 另负责真实入口功能、失败路径与受影响回归验收);除新增①外其余审查点不变,只把 wh-review 换成新代码审查工具;审查派发不依赖材料身份/哈希/sha/快照/回执校验,审查输入以纯文本路径引用材料(OI-013,SD-17);接入前**适配合同先冻结**(输入形态 diff/worktree/packet 明确选定、finding schema、超时语义、unavailable 状态集合、provider 身份记录、审查事实写入位置,FR-53);换工具先做**有证据门槛的对比实验**(内置 go/no-go 规则,FR-54),不凭厂商宣称;fallback 合同统一为一次由未参与实现者完成的独立替代审查(旧 wh-review/broker 仅为只读历史证据,不是可执行 fallback);单次审查成功后不复审,发现照单修复,不建 severity 门槛/复审循环;工具不可用时按 SD-08 执行一次独立替代审查,替代也不可用时该审查事实记 unverified 并如实披露,不冒充已审;代码审查≠功能验收。consumer=用户(审查质量与耗时)+build-plan/build-code/verify-code。
> 356: - **范围**:审查适配合同(接入前冻结)、对比实验与 go/no-go 规则、新工具接入、build-plan 合并审查(OI-014)、fallback 与替代审查路径、节奏保持(完整序列 SD-07)。不含审查基建的资源修复(CARD-09② 限制并发 provider)、wh-review 物理删除(CARD-06)。
> 357: - **流程/状态**:适配合同冻结(输入形态/finding schema/超时语义/unavailable 状态集合/provider 身份/事实写入位置)→ 对比实验(真实任务实测能力与覆盖,实验设计内置 go/no-go 规则:接入判定阈值与不接入保留 fallback 的处置先写明,含 fallback 可用性结论)→ 按 go/no-go 决定接入或保留 fallback(独立替代审查)→ 工具接入全部节奏点:build-plan 合并审查一次(build-plan 完成后、build-code 开工前,覆盖 spec+phase 文件,OI-014)、build-code 内每 phase 审查与全 phase 结束集成审查、verify-code 终末代码审查 → 单次成功不复审、照单修复 → unavailable 时一次由未参与实现者完成的独立替代审查 → 替代也不可用时记 unverified 并如实披露,不冒充已审。审查派发与输入引用不做材料身份/哈希/sha/快照/回执校验,输入以纯文本路径引用材料(OI-013)。OCR(open-code-review 类)仅为候选,选型在本卡实验内定,不预设。
> 358: - **FR**:
> 359:   - FR-22:替换前完成对比实验:在真实任务上实测候选工具的能力与覆盖,产出实验报告;fallback 合同=一次由未参与实现者完成的独立替代审查(SD-08),旧 wh-review/broker 路径仅为只读历史证据用于对照,不是可执行 fallback。
> 360:   - FR-23:审查节奏按 SD-07 完整序列:build-plan 合并审查一次(时机=build-plan 完成后、build-code 开工前,覆盖 spec+phase 文件,质量核心两类合一,FR-56)+build-code 内每 phase 一次+全 phase 结束集成审查一次+verify-code 单独命名的「终末代码审查」一次(独立事实,不与功能验收共用一条记录);除新增 build-plan 合并审查点(OI-014)外,其余审查点次数与位置不变。
> 361:   - FR-24:单次审查成功后不为同一 scope 复审;发现照单修复;无 severity 门槛与复审循环。
> 362:   - FR-25:工具 unavailable 时,fallback 为一次由未参与实现者完成的独立替代审查并保留来源与缺口;独立替代也不可用时,该审查事实记 unverified 并如实披露,不冒充已审。
> 363:   - FR-26:新工具接入前有能力与覆盖验证,不直接把厂商数字当作本项目收益。
> 364:   - FR-53:新审查工具接入前,适配合同先冻结——输入形态(diff / worktree / packet 明确选定其一)、finding schema(严重度、文件/行号锚定、证据、建议)、超时语义、unavailable 状态集合、provider 身份记录、审查事实写入位置;合同冻结前不得接入。
> 365:   - FR-54:对比实验内置 go/no-go 规则——接入判定阈值(findings 有效率、锚定准确率、耗时阈值,具体数值由实验设计定稿)与不接入即保留 fallback(独立替代审查)的处置,在实验设计阶段写明;实验结果对照规则得出 go 或 no-go 结论并如实记录。
> 366:   - FR-56:build-plan 完成后、build-code 开工前执行一次合并审查,同时覆盖 spec 与 phase 文件;质量核心=原 spec 审查(需求翻译完整性/验收可执行/架构合理)+原 plan 审查(依赖正确/并行声明/写集)合一;不拆成两次固定审查,不漏任一质量核心(OI-014)。
> 367:   - FR-57:审查派发与审查输入不依赖材料身份/哈希/sha/快照/回执(readback)校验,审查输入以纯文本路径引用材料;派发不被任何机器校验阻断(OI-013,SD-17)。
> 368: - **AC**:
> 369:   - AC-22(对应 FR-22/FR-26):条件=运行对比实验;行为=候选工具与对照在真实任务上各跑审查;度量=实验报告含真实任务、发现数、失败边界、耗时事实与 fallback 结论。失败场景=无实测数据仅凭厂商宣称即接入,即失败。
> 370:   - AC-23(对应 FR-23):条件=观察一个实施 task;行为=核对审查发生点;度量=build-plan 合并审查一次(覆盖 spec+phase 文件)+build-code 内每 phase 一次+全 phase 结束集成审查一次+verify-code 终末代码审查一次(独立记录,不与功能验收混记),节奏与 SD-07 完整序列一致。失败场景=任一应有审查缺失、合并审查被拆成两次固定审查、额外增加固定审查轮次,或终末代码审查与功能验收混记一条,即失败。
> 371:   - AC-24(对应 FR-24):条件=一次审查成功且发现已修复;行为=核对后续动作;度量=同 scope 无复审记录;修复有记录。失败场景=出现复审循环或按 severity 门槛搁置发现,即失败。
> 372:   - AC-25(对应 FR-25):条件=演练工具不可用路径;行为=触发独立替代审查;度量=替代审查由未参与实现者完成且记录来源/缺口;替代也不可用时该审查事实记 unverified 且披露记录存在。失败场景=不可用或缺审查被写成通过/已审,或无限重派,即失败。
> 373:   - AC-26(对应 FR-23):条件=新工具完成 SD-07 全部节奏点的真实执行;行为=核对执行事实;度量=build-plan 合并审查一次+phase 级审查(每 phase 一次)+全 phase 结束集成审查一次+verify-code 终末代码审查一次(独立事实)的真实执行记录齐备(命令、exit、output 位置,纯文本路径引用)。失败场景=任一节奏点缺真实执行记录,或任一为模拟或脚本自证,即失败。
> 374:   - AC-54(对应 FR-53):条件=检查新工具接入前的材料;行为=核对适配合同;度量=合同含输入形态(明确选定 diff/worktree/packet 其一)、finding schema(严重度、文件/行号锚定、证据、建议四要素)、超时语义、unavailable 状态集合、provider 身份记录、审查事实写入位置,且接入动作发生在合同冻结之后。失败场景=任一要素缺失或未冻结即接入,即失败。
> 375:   - AC-55(对应 FR-54):条件=检查对比实验设计与报告;行为=核对 go/no-go 规则与结论;度量=实验设计含接入阈值(findings 有效率/锚定准确率/耗时)与 no-go 处置(保留独立替代审查 fallback),实验报告对照规则得出 go 或 no-go 结论;no-go 时 fallback 路径保留事实存在。失败场景=无阈值即下接入结论、no-go 结果仍接入,或 no-go 后 fallback 被拆除,即失败。
> 376:   - AC-57(对应 FR-56):条件=一个实施 task 完成 build-plan;行为=观察合并审查执行;度量=合并审查恰好一次且时机在 build-plan 完成后、build-code 开工前,审查记录同时覆盖 spec 与 phase 文件,且两类质量核心(需求翻译完整性/验收可执行/架构合理 + 依赖正确/并行声明/写集)齐备。失败场景=拆成两次固定审查、漏任一质量核心,或发生在 build-code 开工后,即失败。
> 377:   - AC-58(对应 FR-57):条件=观察一次审查派发;行为=核对派发前置与输入引用;度量=派发不要求材料身份/哈希/sha/快照/回执校验通过,审查输入以纯文本路径引用材料,无内容寻址哈希绑定。失败场景=派发被任一该校验阻断,或输入依赖哈希/身份绑定,即失败。
> 378: - **oracle**:冻结的适配合同存在;对比实验报告(真实任务实测能力与覆盖,含 go/no-go 规则对照结论与 fallback 可用性结论)存在;新工具完成 SD-07 全部节奏点(build-plan 合并审查一次+phase 级审查每 phase 一次+全 phase 集成审查一次+verify-code 终末代码审查一次)的真实执行记录存在(命令、exit、output 位置,纯文本路径引用);审查派发无材料身份/哈希校验前置(OI-013);不可用路径演练(独立替代审查,或替代不可用时记 unverified 并披露)有记录。
> 379: - **准备依赖**:CARD-01。
> 380: - **实现依赖**:CARD-01;与 CARD-09 共享审查基建写面(broker/provider 并发)→ 协调。
> 381: - **验收依赖**:真实审查任务样例;旧 wh-review 历史只读可对照。
> 382: - **合并依赖**:与 CARD-09 错时或分面合并(Group 1/2 边界显式协调)。
> 383: - **共享资源冲突与集成责任**:写面=审查基建(broker/provider 并发,与 CARD-09 共享);集成责任归属规则(SD-14)=先冻结接口的一方为集成责任方,另一方对齐(CARD-05 与 CARD-09 谁先触及审查基建接口谁先冻结,归属在各自承接 task 开工时指派;错时合并仍适用)。
> 384: - **来源/设计**:decision-log OI-005(L259-278)、U-009 第 2 条、D-001 L577/L579、Talk round 4 Q13、T-003、L614;U-010 第 2/3 条(L111-118)、OI-013(L438-458)、OI-014(L459-478)、Talk round 5(L993-1001);三个 revision 同 CARD-01。**Supersession 说明**:D-001 L577 为旧表述(superseded);2026-09-19 地图核对 Q5 的统一表述在转写中丢失了 U-009#2 的「verify-code 一次审查」,2026-09-19 第一轮加固修订(R5)恢复 U-009#2 原意并将其单独命名为「终末代码审查」(独立事实,不与功能验收共用一条);2026-09-19 第二轮(U-010/OI-014)追加 build-plan 合并审查点,审查节奏以 SD-07 完整序列为准;decision-log 本体 append-only 不改,本条为 PRD 侧显式标注。ui_applicability=non_ui,无设计稿。
> 385: - **局部风险**:新审查工具效果未验证(风险 R4)——对比实验结论可能是否定(no-go),须保留 fallback(独立替代审查)路径不硬切;选型被预设为 OCR(纪律禁止);适配合同未冻结即接入,或 go/no-go 规则事后改写迁就实验结果。
> 386: - **可后置技术项**:OCR 采用与否→本卡对比实验结论(go/no-go 对照);具体候选清单、适配合同输入形态选定(diff/worktree/packet)与 go/no-go 阈值数值留本卡实验设计定稿,且均在接入前冻结。
> 387: - **最小读取集**:必需=本卡 + SD-07/SD-08 + OI-005;条件=Q13、L614、wh-review 历史只读对照;通常不用=CPU 诊断、其他卡。
> 388: - **五阶段开工说明**:以本卡创建独立实施 task:①make-decision 输入=本卡 + SD-07/SD-08 + OI-005 只读引用;②build-plan 产 spec.md(含对比实验设计)与 phase 说明,完成后、build-code 开工前做合并审查一次(覆盖 spec+phase 文件,OI-014);③build-code 实施实验与接入,phase 级审查按 SD-07;④verify-code 真实审查任务验收。母/兄弟材料只读,不触发母任务 close。

### 1.2 CARD-05 相关 FR 原文（P L359–367）

见上 §1.1 内 FR-22、FR-23、FR-24、FR-25、FR-26、FR-53、FR-54、FR-56、FR-57 逐字。补充：FR-23 原文含「除新增 build-plan 合并审查点(OI-014)外,其余审查点次数与位置不变」。

### 1.3 CARD-05 相关 AC 原文（P L369–377）

见上 §1.1 内 AC-22、AC-23、AC-24、AC-25、AC-26、AC-54、AC-55、AC-57、AC-58 逐字。

### 1.4 SD-07 审查节奏（P L53–55，CARD-05 的节奏权威）

> 53: ### SD-07 审查节奏(统一表述,2026-09-19 加固修订恢复 U-009#2 原意;第二轮追加 OI-014 合并审查点)
> 54: - **定义**:审查节奏完整序列——**①build-plan 合并审查一次:build-plan 完成后、build-code 开工前执行,一次审查同时覆盖 spec 与 phase 文件,质量核心=原 spec 审查(需求翻译完整性/验收可执行/架构合理)+原 plan 审查(依赖正确/并行声明/写集)合一(2026-09-19 第二轮,OI-014/R-020);②build-code 内 phase 级审查每 phase 一次;③全 phase 结束集成审查一次;④verify-code 有一次单独命名的「终末代码审查」,是独立事实,不与功能验收共用一条记录;verify-code 另负责真实入口功能验收、失败路径核对与受影响回归验收**。除新增①外其余审查点次数与位置不变,变化只在把 wh-review 换成新的代码审查工具,不减少审查次数。单次审查成功后不再为同一 scope 复审;审查发现照单修复,修完不重跑审查,不建 severity 门槛或复审循环。审查派发不依赖材料身份/哈希/sha/快照/回执校验,审查输入以纯文本路径引用材料(OI-013,SD-17)。
> 55: - **来源锚点**:decision-log U-009 第 2 条(L100-106)、OI-005(L266)、D-001 L577、Talk round 4 Q13;U-010 第 3 条(L111-118)、OI-014(L459-478)、Talk round 5 问 3(L993-1001);2026-09-19 地图核对 Q5 统一表述。**Supersession 说明**:D-001 L577 为旧表述(superseded);2026-09-19 地图核对 Q5 的统一表述在转写中丢失了 U-009#2(L100-106)的「verify-code 一次审查」,2026-09-19 第一轮加固修订(R5)恢复 U-009#2 原意并单独命名为「终末代码审查」(独立事实,不与功能验收共用一条);2026-09-19 第二轮(U-010/OI-014)追加 build-plan 合并审查点为完整序列①。审查节奏以本节表述为准。decision-log 本体 append-only 不改,本条为 PRD 侧显式 supersession 标注。

### 1.5 SD-08 独立替代审查（P L57–59）

> 57: ### SD-08 独立替代审查(T-003)
> 58: - **定义**:fallback 合同统一为——审查工具 unavailable 时,采用一次由未参与实现者完成的独立替代审查,保留来源及缺口,不等待或反复重派;旧 wh-review/broker 路径仅为只读历史证据,不是可执行 fallback;若独立替代也不可用,该审查事实记 unverified 并如实披露,不冒充已审。不以 review unavailable 替真实测试失败开脱。
> 59: - **来源锚点**:decision-log U-005 Q1=A、T-003、OI-005、D-001 L579。

### 1.6 CARD-02 原文（P L264–291，用于边界对照）

> 264: ### CARD-02 文档权威与单一事实源
> 265:
> 266: - **结果与 consumer**:同一事实只有一个权威文件。PRD 独占产品目标、完整用户流程、跨任务需求、总体成功/失败与真实验收的权威;每个实施 task 保留单一 spec.md,由该 task 的 build-plan 产出,作为实施前「翻译」——含更标准的需求文档、验收流程、测试标准、架构方案;phase/工作包文档只写本检索边界内差异 + 常驻紧凑索引;plan.md/tasks.md 双写及相等性协议删除;单一权威靠约定与验收核对维持,不设机器校验门,文档间引用一律用纯文本路径,无 revision/内容寻址哈希绑定(OI-013,SD-17)。consumer=后续每个实施 task 的 build-plan/build-code/verify-code。
> 267: - **范围**:文档权威分工(PRD/spec/phase 文档)、单一事实源规则的落地与可测量检查、plan/tasks 双写删除的契约层。不含删除文件执行(CARD-06 负责物理删除面)。
> 268: - **流程/状态**:build-plan 产 spec.md(实现设计权威:架构取舍、全局依赖、验证策略,只引用 PRD/decision 中的目标,不复制完整产品需求或重新定义验收目标)→ phase/工作包文档(只写本包差异、边界、依赖、自身测试/验收)→ 紧凑索引常驻。无 PRD 的普通任务:精简 spec 引用用户原始需求与 decision-log 产品事实。
> 269: - **FR**:
> 270:   - FR-06:任一产品事实(目标/流程/跨任务需求/总体验收)在全仓现行材料中有且仅有一个权威文件。
> 271:   - FR-07:每个实施 task 的 spec.md 由本 task build-plan 产出,且含四件翻译内容:需求文档、验收流程、测试标准、架构方案。
> 272:   - FR-08:phase/工作包文档只含本检索边界内差异 + 引用,不复制 PRD 或 spec 完整正文;小任务可用简短章节,不机械增加文件。
> 273:   - FR-09:plan.md/tasks.md 双写及其相等性协议不复存在。
> 274:   - FR-10:「无重复契约」标准被写成可测量检查并作为命名交付项交付(SD-13②)。
> 275: - **AC**:
> 276:   - AC-06(对应 FR-06/FR-10):条件=对重构后材料运行「无重复契约」检查;行为=检查逐事实核对权威归属;度量=0 处「两个文件对同一事实各自声明权威」。失败场景=发现任一事实存在两个权威声明且检查未报失败,即失败。
> 277:   - AC-07(对应 FR-07):条件=抽一个真实实施 task 的 spec.md;行为=逐件核对四件翻译内容;度量=四件齐备且可定位到章节;验收标准条目满足可执行形式(条件→行为+可度量标准+≥1 失败场景)。失败场景=缺任一件,或 spec 大段复制 PRD 产品需求正文,即失败。
> 278:   - AC-08(对应 FR-08):条件=抽一个多 phase task 的 phase 文档;行为=核对文档内容;度量=每份 phase 文档只含差异/边界/依赖/自身验收 + 对全局目标的引用,无 PRD/spec 完整正文复制;紧凑索引存在。失败场景=任一 phase 文档为全量复制或索引缺失,即失败。
> 279:   - AC-09(对应 FR-09):条件=检查现行流程与产出物;行为=确认无双写;度量=不存在 plan.md/tasks.md 双写产出及相等性校验代码路径。失败场景=任一新建 task 仍产生双写,即失败。
> 280:   - AC-10(对应 FR-06):条件=产品目标发生变化;行为=只在其唯一权威文件更新,引用处随引用调整;度量=无第二处需手工同步的副本。失败场景=同一变更需在两份各自声明权威的文件中分别改写,即失败。
> 281: - **oracle**:可测量的「无重复契约」检查通过(SD-13②);抽真实 task 验证 spec 含四件翻译内容、phase 文档只含差异;plan/tasks 双写不复存在。
> 282: - **准备依赖**:CARD-01 接口蓝图(阶段/材料契约)。
> 283: - **实现依赖**:CARD-01。
> 284: - **验收依赖**:一个真实 task 样例(用于 AC-07/AC-08 抽查)。
> 285: - **合并依赖**:与 CARD-01 共享阶段/材料定义写面,需协调;紧随 CARD-01(Group 0),若并行须先冻结接口。
> 286: - **共享资源冲突与集成责任**:与 CARD-01 共享写面,集成责任=CARD-02 owner 在冻结接口上落地文档权威;spec/phase 文档模板与 CARD-03(工作方法)、CARD-04(验收写入)的衔接以接口蓝图为准。
> 287: - **来源/设计**:decision-log OI-001(reopen_provenance,L182)、OI-003(L224)、OI-013(L438-458,纯文本引用)、D-001 L552-560、L623,Talk round 4 Q6/Q17、L758/L760/L761;三个 revision 同 CARD-01。ui_applicability=non_ui,无设计稿。
> 288: - **局部风险**:把「单一权威」做成新的刚性文档仪式(与 R-007 减阻塞目标冲突);reopen 历史(L182 文档形态曾被推翻)提示形态须以 Q17 定稿为准。
> 289: - **可后置技术项**:紧凑索引的具体格式与生成方式留本卡 build-plan。
> 290: - **最小读取集**:必需=本卡 + SD-02/SD-13 + D-001 L552-560;条件=Q6/Q17、L758-761(形态疑义时);通常不用=其他卡细节、历史 review 原件。
> 291: - **五阶段开工说明**:以本卡创建独立实施 task:①make-decision 输入=本卡 + SD-02/SD-13 + D-001 L552-560 只读引用;②build-plan 产本 task spec.md 与 phase 说明;③build-code 实现文档权威规则与「无重复契约」检查,phase 级审查按 SD-07;④verify-code 以真实 task 样例抽查验收。母/兄弟材料只读,不触发母任务 close。

**注意**：CARD-02 的 FR/AC 中**没有任何审查条目**；它的审查承诺只出现在 L291「phase 级审查按 SD-07」一处。这是边界尚未显式化的证据。

### 1.7 decision-log 相关条目原文

#### U-001 第 5 点（D L53，CARD-05 的原始需求）

> 53: 5：审查效果提升，不再用wh-review里面的审查提示词和3rd-review进行build-code或verify-code审查了，而是改成类似"https://github.com/alibaba/open-code-review"的开源代码审查工具进行，保证代码审查质量更高，并且不在因为审查浪费这么长时间。

#### U-009 第 2 条（D L106，节奏纠正）

> 106: 2. **审查次数纠正（此前的收敛写窄了）**：审查不是"build-code 和 verify-code 各一次"，而是**每个 phase 一次 + 所有 phase 结束一次 + verify-code 一次**，与现在一致；只是把 `wh-review` 换成新的代码审查工具。

#### U-010 第 2/3 条（D L111–118）

> 111: ### U-010：三条新需求（2026-09-19，用户真实消息全文）
> 112:
> 113: > 1：workflowhub任务执行时，大量的质量、流程阻塞，我希望彻底移除。workflowhub是一个薄核心的开发技能集，不应该有任何阻塞；
> 114: > 2：workflowhub任务执行时，大量哈希、sha、快照、身份、材料、回执校验不对的问题，导致任务无法推进，也需要进行处理。workflowhub不需要这些过度工程化的东西来保证交付质量。每个阶段的推进、审查、测试的推进都不需要这些东西来保证质量。
> 115: > 3：build-plan流程修改后，build-plan的审查也需要对应的修改，一次审查同时覆盖spec和phase文件。包含spec审查和原来的plan审查质量核心。
> 116: > 如果这些问题没有包含在prd内，需要回到make-decision看看如何把这两个需求也放在prd里一起彻底解决。
> 117:
> 118: 来源：本轮用户真实消息。覆盖核查结论：①半覆盖（FR-04/AC-04/SD-15 已有，但加固修订引入了新前置冲突）；②③未覆盖。

#### OI-005 审查节奏（D L276–295）

> 279:       "oi_id": "OI-005",
> 280:       "category": "success_failure_boundary",
> 281:       "source": "U-001 第5点；U-005 研究深度纠正",
> 282:       "question": "不同审查方案的实际能力、失败边界、成本与替代条件有何证据，怎样避免只凭厂商宣称或用户候选选工具？",
> 283:       "resolution": "已收敛并经 U-009 第 2 条纠正：审查覆盖面保持现状——每个 phase 一次、所有 phase 结束一次（集成）、verify-code 一次；变化只在把 wh-review 换成新的代码审查工具，不减少审查次数。单次审查成功后不再为同一 scope 复审；审查提出的问题照单修复。换工具先做有证据门槛的对比实验并保留 fallback；工具 unavailable 时一次独立替代审查，再不可用如实披露。",
> 284:       "status": "confirmed",
> 285:       "impact_dimensions": [ "scope", "acceptance" ],
> 289:       "selected_disposition": "审查每 phase 一次 + 全 phase 结束一次 + verify-code 一次，成功后不复审，工具替换先做对比实验",
> 290:       "evidence": "U-009 第2条；OI-005 resolution",
> 291:       "acceptance": "审查次数与工具替换门槛写入材料",
> 292:       "counterexample": "减少审查次数或未实测就删旧路径",
> 293:       "requires_user_decision": true,
> 294:       "visible_group_id": "talk-round-4-group-3"

#### OI-002 并行规则（D L212–233，与审查派发相关）

> 215:       "oi_id": "OI-002",
> 216:       "category": "complete_user_flow",
> 217:       "source": "U-001 第4点；U-002；U-005 研究深度纠正",
> 218:       "question": "真实任务为何串行或上下文重复，怎样安排实现、测试、审查与修复才能减少等待且不转移协调成本？",
> 219:       "resolution": "已收敛（Round 3，经 U-009 第 1 条扩大到全部阶段）：make-decision、build-prd、build-plan、build-code、verify-code 都采用同一工作方法——按工作类型派发实施、测试、审查等子代理且各自独立上下文；修复回到实施子代理连续完成；主会话只做派发、回收与交互类技能，不做大量阅读或编辑，以保持主会话上下文干净并减少自动压缩次数。并行规则在计划阶段产出：先冻结接口蓝图（文件级符号与 import 图），再做依赖感知调度，保留中心化验证瓶颈，worktree 隔离并设硬并发上限（起始 3-5），只给输入、写集、环境独立的工作。"
> 227:       "selected_disposition": "全部阶段按工作类型派子代理，计划阶段产出并行规则，主会话只派发与回收",
> 229:       "acceptance": "每个阶段都给出派发与并行方案，主会话不承担大量读写",
> 230:       "counterexample": "回到每 task 单代理串行或让主会话自己干活"

#### OI-013 校验机器彻底全删（D L439–458，与 FR-57/AC-58 对应）

> 444:       "question": "哈希/快照/身份/材料/回执校验机器在新系统怎么处置？",
> 445:       "resolution": "已收敛（2026-09-19 Talk round 5 问2）：彻底全删——阶段推进、审查派发、测试执行不依赖哈希/sha/快照/身份/材料/回执校验；记录层也不用内容寻址哈希，普通文件名+纯文本引用；质量=真实执行+独立审查+人确认。显式区分：本规划任务自身 build-prd 使用的 revision 绑定是现行系统合同，与本次新系统设计无关，不因此保留。",
> 452:       "selected_disposition": "校验机器彻底全删；记录层用普通文件名+纯文本引用",
> 454:       "acceptance": "新系统任一推进/审查/测试路径无哈希校验依赖；证据文件用普通文件名。",
> 455:       "counterexample": "任一阶段要求哈希相等才推进，即违反。"
> 456:       "requires_user_decision": true,
> 457:       "visible_group_id": "talk-round-5"

#### OI-014 build-plan 合并审查（D L459–478，**并入 card-02 的直接依据**）

> 462:       "oi_id": "OI-014",
> 463:       "category": "success_failure_boundary",
> 464:       "source": "U-010 第3点；2026-09-19 Talk round 5 问3",
> 465:       "question": "build-plan 流程修改后，build-plan 的审查如何对应修改？",
> 466:       "resolution": "已收敛（2026-09-19 Talk round 5 问3）：合并为一次——build-plan 完成后、build-code 开工前一次审查同时覆盖 spec 与 phase 文件；质量核心=原 spec 审查（需求翻译完整性/验收可执行/架构合理）+原 plan 审查（依赖正确/并行声明/写集）合一；审查节奏其余点不变（build-code 每 phase 一次+全 phase 集成一次+verify-code 终末一次）。",
> 467:       "status": "confirmed",
> 468:       "impact_dimensions": [ "审查节奏", "文档权威" ],
> 472:       "selected_disposition": "build-plan 一次合并审查覆盖 spec+phase 文件，两类质量核心合一",
> 474:       "acceptance": "一次合并审查真实执行且覆盖两类文件与两类质量核心。",
> 475:       "counterexample": "拆成两次固定审查或漏掉任一质量核心，即违反。"

#### 追踪表条目（P L145/152/156/160；D L29/36/40/44）

- R-005 → OI-005，CARD-05，AC-22..AC-26/54/55（P L145）
- R-012 T-003 归 05 / T-004 归 08（P L152）
- R-016 审查次数纠正，CARD-05，AC-23/26（P L156）
- R-019 删除校验机器，CARD-06/05/04/02，AC-29/56/58（P L159）
- R-020 build-plan 合并审查，CARD-05，AC-23/26/57（P L160）
- P L111 卡片清单／并行纪律：CARD-05 组描述为「节奏按 SD-07 完整序列(含 build-plan 合并审查一次)只换工具;对比实验+fallback;独立替代审查;派发不依赖校验机器」

#### CARD-05 的 PRD 侧 supersession 与新增点（P L671 S4）

> 671（S4）：build-plan 合并审查(SD-07 完整序列①-④、CARD-05 结果/范围/流程/oracle/开工说明、FR-23 改写、新增 FR-56/57 与 AC-57/58、AC-23/26 同步、E2E-2 与 INTEG-3 审查点)

#### E2E-2 / INTEG-3 中的审查点（P L559、L587）

> 559（E2E-2）: ...build-plan 合并审查一次(build-plan 完成后、build-code 开工前,覆盖 spec+phase 文件,OI-014)、phase 级审查(每 phase 一次+全 phase 结束集成审查一次)、verify-code 终末代码审查(独立事实,不与功能验收共用一条)与 verify-code 功能验收的真实执行记录存在;推进与审查派发不被机器校验(revision/快照/材料身份/哈希/回执)阻断(SD-17)。
> 587（INTEG-3）: 可观察结果:CARD-05 新审查链与 CARD-09 并发限制在同一审查基建上共存,SD-07 完整节奏点(build-plan 合并审查、每 phase、全 phase 集成、verify-code 终末代码审查)与并发上限同时成立。

### 1.8 SD-16 / SD-17（CARD-05 相关的处置与门禁）

> 89: ### SD-16 过渡基线(未提交修复代码的定性)
> 90: - **定义**:本规划任务期间未提交的 `runtime/review/*`、`skills/wh-review/*` 修复代码(现行审查路径的协议修复,F1–F7)定性为**过渡基线**:它服务现行审查路径直至新路径就位;CARD-05/06 新路径就位后按迁移表(CARD-06 FR-51)转为只读历史或删除,不静默留存。
> 93: ### SD-17 两道人为门与零机器门禁
> 94: - **定义**:新系统仅有两道人为门——①推进中的人为确认对话;②不可逆 Git 授权(宪法级)。其余一切机器/流程校验(revision 绑定链、快照树认证、材料身份/哈希/sha 校验、回执 readback 校验等)均不构成阶段推进、审查派发、测试执行的前置;规则类要求(迁移表冻结、并行声明、接口蓝图冻结)一律为**事实记录+验收核对**……记录层不用内容寻址哈希:普通文件名(不可变命名:日期+序号+描述,append-only)+纯文本路径引用。质量=真实执行+独立审查+人确认……

### 1.9 CARD-06 承接的删除面（P L401/FR-32、P L410/AC-32，确认 wh-review 归宿）

> 401:   - FR-32:wh-review/broker 退出正常审查路径,历史只读保留,不换名搬进 Skill,仅作只读历史证据、不作为可执行 fallback;只保护流程形状的测试随职责删除或改写,真实安全/失败/数据完整性测试保留。
> 410:   - AC-32(对应 FR-32):条件=检查审查路径与历史区;行为=核对 wh-review/broker 状态;度量=正常审查路径无 wh-review/broker 调用,历史原件只读可查,且无任何路径把 wh-review/broker 当作可执行 fallback。失败场景=其换名后在 Skill 内继续执行,或被当作可执行 fallback 调用,即失败。

---

## 2. CARD-05 能力清单

CARD-05 要建立/替换的审查能力，逐条列出（每条附 FR/AC/SD 锚点）：

| # | 能力 | 内容 | 锚点 | 归类 |
|---|---|---|---|---|
| C1 | **审查节奏定义与保持** | SD-07 四点完整序列：①build-plan 合并审查 ②每 phase ③全 phase 集成 ④verify-code 终末代码审查；次数与位置不变 | FR-23、AC-23、AC-26、SD-07 | 共享基础（①属 plan，②③④属 code） |
| C2 | **build-plan 合并审查** | build-plan 完成后、build-code 开工前一次同时覆盖 spec+phase 文件；质量核心 = 原 spec 审查（需求翻译完整性/验收可执行/架构合理）+ 原 plan 审查（依赖正确/并行声明/写集）；不拆两次、不漏核心 | FR-56、AC-57、OI-014、R-020 | **plan 审查改造** |
| C3 | **审查适配合同冻结** | 接入前冻结：输入形态（diff/worktree/packet 择一）、finding schema（严重度/文件行号锚定/证据/建议）、超时语义、unavailable 状态集合、provider 身份记录、审查事实写入位置；未冻结不得接入 | FR-53、AC-54 | 共享基础（输入形态需因审查对象而分档） |
| C4 | **有证据门槛的对比实验 + go/no-go** | 真实任务实测候选工具能力与覆盖；实验设计阶段内置接入阈值（findings 有效率/锚定准确率/耗时）与 no-go 处置；报告对照规则给出 go/no-go | FR-22、FR-26、FR-54、AC-22、AC-55 | 代码审查改造（新工具面向 diff/worktree） |
| C5 | **新工具接入 + 替换 wh-review** | 把 wh-review/3rd-review 换成新的开源代码审查工具，接入全部节奏点；OCR（open-code-review 类）仅候选不预设选型 | FR-23、U-001#5、D L53、P L386 | 代码审查改造 |
| C6 | **fallback / 独立替代审查** | unavailable 时一次由未参与实现者完成的独立替代审查，保留来源与缺口；替代也不可用则记 unverified 并披露；旧 wh-review/broker 不是可执行 fallback | FR-25、AC-25、SD-08、T-003 | 共享基础 |
| C7 | **单次成功不复审** | 同 scope 成功后不复审；发现照单修复；无 severity 门槛与复审循环 | FR-24、AC-24、SD-07 | 共享基础 |
| C8 | **审查派发去机器门禁** | 审查派发与输入不依赖材料身份/哈希/sha/快照/回执校验；输入用纯文本路径引用 | FR-57、AC-58、OI-013、SD-17 | 共享基础 |
| C9 | **代码审查 ≠ 功能验收** | verify-code 终末代码审查是独立事实，不与功能验收共用一条记录 | FR-23、SD-05/SD-07、P L355 | 代码审查改造 |

**CARD-05 显式不做**（P L356 范围排除）：
- 审查基建的资源修复（并发 provider 限制）→ CARD-09②
- wh-review 物理删除 → CARD-06（FR-32/AC-32）

---

## 3. 边界切分建议

### 3.1 结论表

| 部分 | 归属 | 判断依据（原文） |
|---|---|---|
| C2 build-plan 合并审查（FR-56/AC-57 + AC-23/AC-26 的①部分） | **并入 card-02** | OI-014 `impact_dimensions = ["审查节奏","文档权威"]`（D L468）——官方已把这条审查直接挂在「文档权威」维度上；被审对象 spec/phase 文件就是 CARD-02 的交付物（P L266/FR-07/FR-08）；质量核心「需求翻译完整性/验收可执行/架构合理」与 CARD-02 AC-07（四件翻译内容 + 验收可执行形式）是同一内容；CARD-02 L291 已承诺「phase 级审查按 SD-07」但未写合并审查点 |
| C3 适配合同的**文档审查分档**（spec/phase 审查的输入形态与 finding schema） | **并入 card-02**（与 CARD-05 共写） | FR-53 要求「输入形态(diff / worktree / packet 明确选定其一)」（P L364）——文档审查选 packet，代码审查选 diff/worktree；一份合同覆盖两种对象会把 doc review 绑死在代码工具上 |
| C4 对比实验 + go/no-go（FR-22/FR-26/FR-54/AC-22/AC-55） | **留在 CARD-05** | FR-22 的实验对象是「候选工具的能力与覆盖」用于替换 wh-review 代码审查路径（P L359）；U-001#5 原话明说替换对象是「build-code 或 verify-code 审查」（D L53）；实验结果不预设（P L386） |
| C5 新工具接入（FR-23 的②③④部分） | **留在 CARD-05** | ②③④审的是 phase diff 与集成 worktree（现状合同已如此，见 §4.5）；card-02 是文档任务，无 diff/worktree 可审 |
| C6 fallback / SD-08 | **共享基础**（合同归 CARD-05 冻结，§3.2 说明） | SD-08 是「fallback 合同统一为」（P L58）——统一合同，全部节奏点适用 |
| C7 单次成功不复审 | **共享基础** | SD-07 定义句内统一规定（P L54） |
| C8 派发去机器门禁（FR-57/AC-58） | **共享基础** | OI-013 acceptance 覆盖「任一推进/审查/测试路径」（D L454）；R-019 覆盖 CARD-06/05/04/02 四张卡（P L159） |
| C9 代码审查 ≠ 功能验收 | **留在 CARD-05** | 只涉及 verify-code 阶段，与文档权威无关 |

### 3.2 判断依据展开

1. **「plan 审查改造」的精确所指只有一个节奏点。** U-010 第 3 条原话是「build-plan流程修改后，build-plan的审查也需要对应的修改，一次审查同时覆盖spec和phase文件。包含spec审查和原来的plan审查质量核心。」（D L115）OI-014 resolution 与 FR-56/AC-57 是它的落地（D L466、P L366、P L376）。用户这次要并入 card-02 的，就是这个 ①。PRD 也把①的引入单独标注：「除新增①外其余审查点不变,只把 wh-review 换成新代码审查工具」（SD-07，P L54）；CARD-05 L355 同样写「除新增①外其余审查点不变」。**「新增的①」与「其余不变的点」正是官方给出的切分线。**

2. **① 天然属于 CARD-02，因为被审对象就是 CARD-02 的产物。** ①覆盖「spec 与 phase 文件」（P L366），而 spec.md 与 phase 文档由 CARD-02 定义产出（P L268）。CARD-02 的 AC-07/AC-08 检查的正是 spec 四件翻译内容与 phase 文档只写差异（P L277-278）——①的 spec 质量核心与之同构，只是把机器/人工核对换成独立审查。CARD-02 现行 L291 开工说明里的「phase 级审查按 SD-07」在 SD-07 扩容后已经指向①，但 CARD-02 卡面并未写出①的内容与验收 —— 这是必须补齐的边界。

3. **①的质量核心跨了 CARD-03/04，但不改变归属。** 「验收可执行」由 CARD-04 FR-16 规范写入（P L328），「依赖正确/并行声明/写集」由 CARD-03 FR-14 声明制产出（P L302）。①是在 CARD-02 产物上校验这两者，属**审查动作**而非**写入动作**，因此归属 CARD-02（审查者）而非 CARD-03/04（被审规则作者）。这与 SD-14「先冻结接口的一方为集成责任方」（P L82）不冲突。

4. **反向证据：CARD-05 若失去①，是否仍自洽？** 自洽。CARD-05 的范围句把①列为「新工具接入」之外的一个并列项（P L356：「审查适配合同…对比实验与 go/no-go 规则、新工具接入、build-plan 合并审查(OI-014)、fallback 与替代审查路径、节奏保持」），说明①在原文中就是可与工具替换分离的独立条目。去掉①后 CARD-05 = C3(代码档)+C4+C5+C6+C7+C8+C9，仍是完整的「代码审查链替换」卡，其 oracle（P L378）与 AC-22/24/25/26/54/55/58 仍可独立成立；只有 AC-23/AC-26 需按节奏点拆分。

5. **整块下移是不成立的。** 若把 C3/C4/C5 一并搬进 card-02，会造成：card-02 是文档权威卡却要承担 diff/worktree 工具选型与真实代码审查实测（与 P L267「不含删除文件执行」的边界风格不符）；E2E-2/INTEG-3（P L559/L587）把新审查链与 CARD-09 并发限制的共存验证绑定在 CARD-05 上。

### 3.3 建议的切分后 AC 归属（消歧）

CARD-05 的 AC-23 与 AC-26 都是**节奏点全覆盖**型，措辞含①。建议拆写为：

- 并入 card-02：AC-57（纯①）；AC-23/AC-26 中的「build-plan 合并审查一次（覆盖 spec+phase 文件）」子句。
- 留在 CARD-05：AC-23/AC-26 中的「每 phase 一次 + 全 phase 集成一次 + verify-code 终末代码审查一次（独立记录）」子句。

### 3.4 共享基础的处理原则

C6/C7/C8 应在**两卡各写一次指向同一权威句**，而不是复制正文：SD-08（C6）与 SD-07 定义句（C7/C8）已是唯一权威（PRD 共享定义节）。对应 CARD-02 侧只需补一句「审查按 SD-07/SD-08，派发不受机器校验前置（SD-17）」，与 CARD-02 L266 已有的「不设机器校验门…无 revision/内容寻址哈希绑定」一致。

---

## 4. 审查现状事实

### 4.1 涉及审查的技能目录（`skills/` 实际清单）

与审查直接相关（12 个）：

| 技能 | 角色 |
|---|---|
| `wh-review/` | **现行审查链主技能**（v4.1.0），被 CARD-05 替换 |
| `review/` | 通用 report-only 独立审查 lens（`mode: lens-only`），被 wh-review 按 stage 引用 |
| `debate/` | 审查发现裁决的「四队法庭式对抗」技能 |
| `plan-eng-review/` | 计划阶段工程审查 lens |
| `plan-ceo-review/` | 计划阶段方向审查 lens（make-decision direction/detail 均引用） |
| `plan-design-review/` | 计划阶段设计审查 lens |
| `intake-decision-review/` | make-decision direction track 引用 |
| `simplicity-guard/` | detail/build-code track 引用 |
| `dsh-code-review/` | 代码审查技能 |
| `grill-with-docs/` | 文档拷问（Grill） |
| `spec-analyze/` | 阶段内 analyze 步 |
| `requirement-lineage/` | 需求追溯核对 |

组织形态：`skills/catalog.yaml` + `reuse-registry.md` 登记；每个技能带 `SKILL.md` + `skill-bundle.json`；审查类多为 `review-bundle.json` + `skill-bundle.json`。

### 4.2 `skills/wh-review/` 结构与 Purpose

目录结构：
```
wh-review/
├── SKILL.md              (5169 B, v4.1.0)
├── manifest.json
├── skill-bundle.json
├── stage-skill-plan.json
├── contracts/            build-code.md build-plan.md build-prd.md build-spec.md
│                         make-decision.md mini-task-design.md mini-task-implementation.md
│                         provider-protocol.md workflowhub-result.v1/v2/v3.json
├── scripts/              wh-review-cli.mjs review-runner.mjs simple-review-runner.mjs
│                         review-materials.mjs review-provider-client.mjs review-result.mjs
│                         review-output.mjs review-source.mjs review-semantic-projection.mjs
│                         review-input-bounds.mjs ac-evidence-summary.mjs
│                         integration-review-subject.mjs third-review-host-config.mjs schema-validator.mjs
│                         + lib/ + __tests__/
└── __tests__/
```

SKILL.md Purpose 段逐字（`skills/wh-review/SKILL.md` L11-16）：

> `wh-review` does one thing: review the bytes submitted in the current call with the current stage's review prompt.
>
> It does not open or validate a Workspace, TaskHandle, Git repository, branch, snapshot, material revision, current four-material set, stage status, receipt, or completion fact. Those belong to the calling stage when actually needed.

Behavior 段（同文件 L44-52）：

> 1. Select the configured heterologous reviewer route for the supplied stage/track.
> 2. Generate the stage-focused review instructions.
> 3. Freeze exactly the submitted `materials` into one temporary bundle and hash those bytes.
> 4. Make one broker group request.
> 5. Return the real provider identities, transport outcome, findings, and material hash.
> 6. Delete the temporary bundle.
>
> The provider may read only the submitted bundle. It may not access the repository, Workspace, TaskHandle, Git, shell, network, or host paths.

**关键事实**：现行 wh-review 审的是**冻结的材料字节（materials JSON）**，不是 Git diff、不是 worktree。这与新工具（open-code-review 类，面向 diff/worktree）的输入形态根本不同——这正是 FR-53 要求「输入形态 diff / worktree / packet 明确选定其一」的原因（P L364）。

### 4.3 每阶段审查配置（`skills/wh-review/stage-skill-plan.json`）

```json
"make-decision": { "tracks": {
  "direction": { "required_skills": ["intake-decision-review","plan-ceo-review","review"],
                 "review_mode": "lens-only", "lens_owner": "wh-review",
                 "lens_dispatch": "delegated", "delivery_mode": "file_only" },
  "detail":    { "required_skills": ["simplicity-guard","plan-ceo-review","review"], ... } } },
"build-spec":  { "required_skills": ["review"], ... },
"build-plan":  { "required_skills": ["review"], ... },
"build-code":  { "required_skills": ["simplicity-guard","review"], ... },
"verify-code": { "required_skills": ["review"], "invocation": "post-first-repair-non-gate", ... }
```

`non_stage.build_prd`：`review_kind: build_prd`、`delivery_mode: report_only`（本规划任务即走此路径）。

### 4.4 red/blue 双角色机制（`skills/wh-review/contracts/make-decision.md`）

> L3: provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。`direction` 和 `detail` 是两个独立 track，各自产生一个 paired review fact；每个 track 共享本次 `snapshot_tree` 和 `material_id`，并各发一个 `role=red` 与一个 `role=blue` 的独立 request。两次 request 使用同一 `pair_id`，结果保留 provider×role provenance。
> L15: 每次真正执行 `make-decision` 时，`direction` 和 `detail` 各执行一次当次输入的 red/blue pair；每个 role 只调用一次，不把 paired request 变成重试循环。
> L54: 审查顺序固定为一个逻辑 paired review fact：red 与 blue 各一次 broker group request，合计两次 public request。每个 request 携带 broker-owned …

即：**red/blue = 同一 track 内两个独立审查角色**，由异源 provider（3rd-review broker）承载，`review_mode = lens-only`（只给 finding，不给 verdict），同 `pair_id`，**每 role 只调一次、不重试**。`snapshot_tree` + `material_id` 是这一机制的绑定字段——正是 OI-013/SD-17 要删掉的校验面。

### 4.5 代码审查主体（`skills/wh-review/contracts/build-code.md`）

> `phase_id` 存在时，runner 自动派生 `review_scope=phase`。这是一份严格代码审查：必须审查完整当前 Phase diff，不能只检查上轮 finding…
> …已提交的 Phase 以直接父提交树到候选提交树为审查范围，并记录 `commit_oid`、`parent_commit`、`parent_tree`、`commit_tree`、`candidate_tree` 及树一致性；未提交的 Phase 不伪造提交，记录 `commit_oid=null` 和当前 HEAD 树。提交树与候选树不一致时，结果只能是 `unavailable`/`incomplete`…
> `phase_id` 缺失时，runner 自动派生 `review_scope=integration`，且 `subject_kind=worktree`。它只用于所有 Phase 之后的最终集成审查…

即 build-code 侧已经是 **worktree/commit-tree 代码审查**（②③点），verify-code 合同另有 `post-first-repair-non-gate` 审查步（④点）。CARD-05 的「代码审查改造」正是替换这一条链。

### 4.6 debate 四角色机制（`skills/debate/SKILL.md`）

> `debate` 把这个裁决换成**四队法庭式对抗**：Claude 的决策和 codex 的决策**对等上庭受审**（谁都不是免审基准），由 4 个独立上下文子代理分饰甲乙丙丁互相质疑，主代理只当 Lead 法官 —— **全程禁言、不下场写任何一方的辩护书、只综合幸存论点做最终裁决**。

- 用途：审查发现裁决、多方案对比、决策对抗；解决「方案作者自裁」的 self-preference bias。
- 环境判定：`parallel_agent_capability: available` → 四队对抗；unavailable/未传 → 自动降级「单人三档」（🟢必须确认/🟡建议考虑/🔴仅供参考）。
- 自我定性：**可选便利层，非质量地基**；不阻塞工作流。
- 与 OI-002 并行上限的冲突（D L886 审查发现）：debate 固定「研究 4、debate 4、红蓝 2」，与用户「计划阶段设计 2–5 路并行」方向不一致（SD-11 已把并发上限统一为 2–5，P L70）。

### 4.7 已知问题（decision-log F1-F7 修复记录）

规划任务执行期间，**方向审查与 detail 审查首轮双双 unavailable**（`semantic_status=unavailable`、`result_ref=null`、`coverage=incomplete`），错误为 `PROTOCOL_INCOMPATIBLE: 3rd-review managed lifecycle envelope is invalid`（D L717）；方向审查另表现为三个 provider 全 failed，`MATERIAL_INCOMPLETE: direction-review.v1 material is missing direction_flow.json`（D L722）；debate 无输出（D L508/L524）。

**已定位的三个独立根因（D L724–728，逐字要点）**：

1. **身份分叉**：bundle 投递字节使用 `skills/wh-review/scripts/review-materials.mjs:426` 的脱敏规则（遇中文标点停止），而声明的 packet material id 使用 `runtime/review/review-packet-identity.mjs:7` 的旧规则（继续吞掉路径后整行）。真实触发是 `https://` 中的 `s:/` 命中 Windows 盘符分支后吞掉整句中文。结果：detail 声明 `8243e7e8…`、broker 对实收字节算出 `f807724e…`；direction 声明 `653d9312…`、broker 算出 `421f2802…`。broker 按实收字节计算是正确的，**外层 parser 拒绝的是合法 envelope**。
2. **材料路径不匹配**：direction flow 被投递为 `materials/09-direction_flow.json`，而 broker 的 `validateDirectionReviewMaterial` 要求末段恰为 `direction_flow.json`，序号前缀使 `endsWith` 失配 → `content_entries` 含该文件而 finder 返回 `NONE`。
3. **观测缺陷**：start 请求已发出、broker 已创建 runtime，attempt 仍记 `blocked_before_dispatch`、`provider_attempts=[]`、`runtime_id` 缺失，且 `provider_results` 取值自 `review-provider-client.mjs` 中并不存在的 `error.managed_observation`。**因此该记录不能作为「远端未执行」或「可安全重派」的依据。**

**已完成的修复（F1–F7，未提交；D L730–734）**：

- 新增 `runtime/review/provider-material-projection.mjs` 作为脱敏规则与 provider 材料路径规则的**唯一实现**（原计划文件名 `host-path-redaction.mjs` 因同时承载路径规则而改名，已登记 move-map）。
- `review-packet-identity.mjs` 与 `review-materials.mjs` 改用它。
- `simple-review-runner.mjs` 以 `direction_flow.json` 投递 flow，并在 dispatch 前用 `deliveredMaterialId` 对实际写入字节复算身份，不一致即本地失败。
- `authenticated-evidence.json` 按 broker 口径计入声明身份。
- `review-provider-client.mjs` 接受 broker 真实的 health 形状（`error` 可省略、`status` 可为 `pending`）。
- 被拒绝的 managed envelope 现携带 `managed_observation`，attempt schema 与 `review-record-route.mjs` 接受并保留 `sent_unparsed`。
- 验证证据：`quality/evidence/review-protocol-repair/RED-GREEN.md`；修复后 103 个 wh-review 测试与 59+193 个 contract 测试通过。

**这些修复的定性（SD-16，P L89-91）**：属**过渡基线**，服务现行审查路径直至新路径就位；CARD-05/06 新路径就位后按迁移表（CARD-06 FR-51）转只读历史或删除，**不静默留存**。

**其他已记录问题**：

- 审查工具替换**无评估路径**（D L762，蓝-2/蓝-3/红-2）：替换属用户八点之一且 OI-005 open，但 alternatives 只覆盖 runtime/认证维度，替换收益与 net 时间/token 未测量 → 这是 FR-54 go/no-go 的直接来源。
- 用户原始痛点（D L53）：「不再因为审查浪费这么长时间」——时间/CPU 是替换的主要动机之一。
- CPU/进程抖动（D L909）：`skills/wh-review/scripts/simple-review-runner.mjs` 的 `DEFAULT_MANAGED_STATUS_POLL_MS` 由 1000ms 改为 5000ms（每次轮询都会 spawn 一个新 3rd-review 进程，该间隔是直接的 CPU/进程抖动开关）。此修复归 CARD-09 面，但属同一审查基建。
- 材料内部不一致（D L764，红-3/蓝-5/蓝-4）：`convergence_outline` 与 `current_selection` 对 OI-009 状态不一致；`product_positioning` 批准边界提到 "OCR选型" 而包内无 OCR 主题——提示「OCR 被预设为选型」的纪律风险（P L385 已点名）。

**修复后的可消费结果（用于对照基线，D L748–757）**：修复后重跑方向审查取得可消费结果——pair_id `b842d4d4-…`，两角色均 `semantic_status=available`、`partial=false`、`coverage=satisfied`；red 6 findings、blue 5 findings，共 11 条原始 finding，无 blocking 级。这是新工具对比实验可用的**对照锚点**。

---

## 5. 与 CARD-02 的接口

CARD-02（文档权威与单一事实源）与「审查改造」互相影响的点，逐条列出：

### I1. 被审对象 = CARD-02 的交付物（最强耦合）

① 合并审查覆盖「spec 与 phase 文件」（P L366）。spec.md 与 phase 文档的存在、结构、边界由 CARD-02 定义（P L266/FR-07/FR-08）。**若 CARD-02 改了 spec/phase 的文档形态，① 的输入材料集与审查范围随之改变。** 反方向：① 要求「两类质量核心齐备」（AC-57，P L376），反过来约束 CARD-02 的 spec 必须写出架构合理性与验收可执行性、phase 文档必须写出依赖与写集。

### I2. phase 文档「只写差异」使合并审查成为必然

CARD-02 FR-08：phase 文档「只含本检索边界内差异 + 引用」（P L272）。单独审一份 phase 文档无法判断整体质量核心；**必须与 spec 一起审**——这正是 ① 定义为「一次同时覆盖 spec 与 phase 文件」的结构性原因。CARD-02 的常驻紧凑索引（P L272、可后置技术项 P L289）是①定位审查边界的前提。

### I3. 质量核心的四方归属（①的检查内容跨界）

| 质量核心 | 被审规则的作者 | 落在哪份产物 |
|---|---|---|
| 需求翻译完整性 | CARD-02 FR-07（四件翻译） | spec.md |
| 验收可执行 | **CARD-04** FR-16（条件→行为+度量+失败场景） | spec.md（CARD-02 承载） |
| 架构合理 | CARD-02 FR-07（架构方案） | spec.md |
| 依赖正确 / 并行声明 / 写集 | **CARD-03** FR-14（并行声明制） | phase 文档（CARD-02 承载） |

→ **① 是唯一同时触达 CARD-02/03/04 三卡产物的审查点。** 并入 card-02 后，card-02 的验收需要一个多 phase 真实 task 样例来跑①（CARD-02 现有验收依赖 P L284 只说「一个真实 task 样例」，需明确为多 phase）。

### I4. 纯文本路径引用 = 两卡共用的同一条规则

- CARD-02 侧（文档间引用）：「文档间引用一律用纯文本路径,无 revision/内容寻址哈希绑定(OI-013,SD-17)」（P L266）。
- CARD-05 侧（审查输入）：「审查输入以纯文本路径引用材料」（FR-57，P L367）；AC-58 度量「审查输入以纯文本路径引用材料,无内容寻址哈希绑定」（P L377）。
- 上层权威：OI-013「阶段推进、审查派发、测试执行不依赖哈希/sha/快照/身份/材料/回执校验；记录层也不用内容寻址哈希，普通文件名+纯文本引用」（D L445）；R-019 覆盖 CARD-06/05/04/02（P L159）。
- **影响**：这是同一事实的**两个消费者**（文档引用、审查输入），不是两个权威。切分时必须保证只声明一次权威——否则会直接违反 CARD-02 自己的 FR-06/FR-10「同一事实只有一个权威文件」和 AC-06「0 处两个文件对同一事实各自声明权威」。**建议权威落在 SD-17（P L93-95），两卡各写引用句。**

### I5. 校验机器删除的同一删除面

现状 red/blue 机制绑定 `snapshot_tree`/`material_id`（§4.4），F1-F7 修的就是身份/路径校验（§4.7）。OI-013 判定这些「彻底全删」（D L445），删除执行归 CARD-06（P L398/FR-29），但**审查派发侧的「不再依赖」承诺分属 CARD-05 的 FR-57 与 CARD-02 的「不设机器校验门」**。并入 card-02 时，「合并审查的派发不受机器校验前置」这一条应与 CARD-02 的 FR-57 引用句一起落地，避免出现「文档侧宣称零门禁、审查侧仍走旧绑定」的不一致。

### I6. plan.md/tasks.md 双写删除 ↔ 原 plan 审查的消失

CARD-02 FR-09：plan.md/tasks.md 双写及其相等性协议不复存在（P L273）；AC-09 检查「不存在 plan.md/tasks.md 双写产出及相等性校验代码路径」（P L279）。①的 plan 审查质量核心是**原 plan 审查**（P L366）——而原 plan 文档形态被 CARD-02 删除。**接口结论**：①审的 plan 内容此后只存在于 phase 文档中，因此①的「依赖正确/并行声明/写集」必须能只靠 phase 文档 + 紧凑索引定位，不能依赖已删的 plan.md/tasks.md。这是把①并入 card-02 时最容易漏的一条。

### I7. 边界不重叠的部分（明确划开）

- CARD-02 不含：审查工具选型、适配合同、对比实验、wh-review 替换/删除（P L267 只含文档权威与双写删除契约层；P L356 明示 wh-review 物理删除属 CARD-06）。
- CARD-05 不含：文档权威分工与「无重复契约」检查（P L356 无此项；P L274 FR-10 归 CARD-02）。
- 两卡共同不含：wh-review 物理删除（CARD-06 FR-32/AC-32，P L401/L410）；审查基建并发资源修复（CARD-09②，P L356）。

### I8. 集成与验收面

- CARD-05 与 CARD-09 共享审查基建写面，集成责任按 SD-14「先冻结接口的一方为集成责任方」（P L383）；INTEG-3 验证两者共存（P L587）。
- CARD-02 与 CARD-01 共享阶段/材料定义写面（P L286）。**并入①后，card-02 变成同时握有 CARD-01 接口蓝图消费与合并审查落地的卡**，需在开工时按 SD-14 指派集成责任。
- E2E-2（P L559）已把「build-plan 合并审查一次」列为实施旅程端到端的可观察结果之一——该行同时含①与②③④，切分后应保留原样（E2E-2 是整体验收，不属任何单卡），但 card-02 的验收需能独立证明①成立。

---

## 6. 给 card-02 的落地建议（最小改动集）

1. **CARD-02 卡面补①**：在 FR 增一条（对应 FR-56/AC-57）「build-plan 完成后、build-code 开工前执行一次合并审查，覆盖 spec+phase 文件，两类质量核心齐备，不拆两次、不漏核心」，AC 采用 AC-57 原文。
2. **明确 AC-23/AC-26 的子句归属**：①子句移入 card-02 验收；②③④子句留 CARD-05。避免两卡对同一条 AC 各自声明权威（违反 FR-06）。
3. **审查输入形态取 packet**：FR-53 的输入形态三选一中，card-02 的合并审查选 `packet`（与现行 wh-review 的材料字节审查同族），代码审查仍由 CARD-05 选 `diff`/`worktree`。
4. **不搬 C3/C4/C5**：适配合同全文、对比实验、go/no-go、新工具接入仍归 CARD-05；card-02 只写「合并审查按 SD-07/SD-08/SD-17，派发不受机器校验前置」一句引用。
5. **验收依赖升级**：CARD-02 验收依赖从「一个真实 task 样例」升级为「一个**多 phase** 真实 task 样例」（同时满足 AC-07/AC-08 与 AC-57）。
6. **纯文本引用权威单点**：文档引用与审查输入的纯文本路径规则都只引用 SD-17，不在两卡各写一份规范正文。

---

## 7. 摘录完整性自查

| 要求项 | 位置 | 状态 |
|---|---|---|
| CARD-05 结果与 consumer / 范围 / 流程状态 | P L355-357 | 逐字 §1.1 |
| CARD-05 FR-22..26、FR-53/54/56/57 | P L359-367 | 逐字 §1.2 |
| CARD-05 AC-22..26、AC-54/55/57/58 | P L369-377 | 逐字 §1.3 |
| oracle / 依赖 / 风险 / 最小读取集 / 五阶段开工说明 | P L378-388 | 逐字 §1.1 |
| CARD-02 全文（边界对照） | P L264-291 | 逐字 §1.6 |
| SD-07 / SD-08 | P L53-59 | 逐字 §1.4/§1.5 |
| OI-005 / OI-002 / OI-014 / OI-013 | D L279-295 / L215-233 / L462-478 / L444-458 | 逐字 §1.7 |
| OI-001 审查次数纠正句 | D L197 | §1.7 U-009#2 交叉 |
| wh-review / red-blue / debate | 技能目录 + SKILL.md + contracts + stage-skill-plan | §4.2-§4.6 |
| F1-F7 修复记录 | D L724-734 | 逐字要点 §4.7 |

- 未读项：`prd.md` L1-52（共享定义前段）、L103-263（其他卡）、L420-537（CARD-07..10）、L598-673（风险与交付说明除已引行）；`decision-log.md` 其余 OI 与 Talk/Grill 全文。以上均非本任务必需读取集。
- 本次分析为只读，未修改任何输入文档。
