# CARD-02 原始 AC 逐条验收账本（T020）

本账本以归档 `specs/archive/workflowhub-thin-core-card-02-20260919/spec.md` §11 的 22 条四段式 AC 为判据，并单独核对母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` 的 CARD-02 AC-06～10。状态指**原判据已获生产链及正反证据证明**，不是代码存在、模板字段存在或命令 exit 0。仅只读现有材料，未运行新测试/provider；“未见原件”是本次读面结论，不是断言原件在全世界不存在。

读面：`tests/acceptance/card-02-current.mjs` 及其 `card-02-current.test.mjs`；当前 `runtime/task/material-workspace.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs`、`workflows/make-decision/skill-deps.yaml`；归档 CARD-02 `tasks.md`、`quality/evidence/stage-end-spec-analyze-build-plan.json`；CARD-07 当前 `spec.md`、`phases/` 和 `research/card02-root-cause-audit.md`。下表的 N/F 分别为正常/失败原件；`缺` 表示仍需取得原始输出或正式读回。owner 是最短补救责任而非擅自替兄弟卡开工。

| 原 AC | 原判据要点 | 实际 producer → consumer；N/F 原件 | 本次状态及最短补救 owner |
| --- | --- | --- | --- |
| AC-DOC-001 | 逐字来源、ADR/OI/追溯唯一权威；缺源或双正文失败 | `decision-log` 模板→填充材料→build-plan reader；N=当前 CARD-07 `decision-log.md` 有 U/R/D，F=缺同 fixture 原文替换/双权威拒绝读回；`card-02-current.mjs#NON_ACHIEVED_READBACKS` 也记缺。 | **incomplete**；CARD-02 作者合同 owner：填一份含五类事实的 fixture，逐来源回读并注入原文替换、双权威反例。 |
| AC-DOC-002 | spec 主干可读、附件 A 唯一四段式、每 FR 有源/场景/AC | spec 模板→实际 spec→build-plan/实施者；N=当前 CARD-07 `spec.md` 有四件章节与 Appendix A，F=缺主干复制判据、空附件、断 FR 指针的同 fixture 反例。 | **incomplete**；CARD-02 作者合同 owner：做填充材料的重复事实与 FR 链完整性读回。 |
| AC-DOC-003 | 两个独立 Phase，各字段具体；弱模型仅凭本包与稳定指针可执行 | `skills/spec-plan/templates/phase-template.md`→`phases/P*.md`→build-code；N=`card-02-current.test.mjs` “validates independent post Phase files”及 `readCard02PostPhaseEvidence` 为**结构候选**；F=missing authority 负例。缺独立弱实施者对真实任务首编辑/接口/测试/恢复的冷读。 | **incomplete（脚本结构候选 achieved）**；CARD-07 P1–P3 owner：先补真实 RED/可观察接缝，再独立冷读；CARD-02 原判据不得只靠物理文件升绿。 |
| AC-DOC-004 | 紧凑索引纯指针、语义锚点、真实 consumer，无正文副本 | Phase index writer→`phaseFilesFromIndex`/实施者；N=`card-02-current.test.mjs` “rejects index body copy and missing pointer”及当前 `phases/index.md`；F=正文复制/缺指针拒绝。脚本可给结构 `achieved`，但逐行真实 consumer 人工回读与真实多 Phase 实施证据未闭合。 | **incomplete（脚本结构候选 achieved）**；CARD-07 P1 owner：逐行核 owner/consumer/目标定位，连同 AC-DOC-003 冷读。 |
| AC-DOC-005 | 真实需求的四件翻译均有非空语义、FR/AC 指针、oracle/覆盖限制 | build-plan spec 作者→build-code/verify-code；N=当前 CARD-07 `spec.md` 四节可定位；F=缺标题非空但内容空泛、错源指针反例与实施消费者回读。 | **incomplete**；CARD-07 P1/P3 owner：同一真实需求做四件语义抽验，不把章节存在当完成。 |
| AC-OI-001 | reconstruct→reveal/challenge→用户 confirm 后才下游绑定 | make-decision handler→build-plan OI 投影；N=归档 `tasks.md` P2 有局部 direct OI 记录；F=缺未确认候选进入下游及 deferred 四要素的同一生命周期回放；`card-02-current.mjs` 记缺。 | **incomplete**；CARD-02 runtime owner：一条 OI 全流程正反原件及正式输入投影读回。 |
| AC-TEST-001 | 22 AC 各四段非空、互斥可观察、V0=0 | 归档 spec §11→AC 检查器→作者；N=22 条文本存在；F=缺 22/22 四段与 V0 具名输出及含模糊词反例。 | **incomplete**；CARD-02 验收 owner：运行具名逐 AC 结构/语义检查，保留输出与违反项位置。 |
| AC-TEST-002 | 冻结测试不可静默放宽；合法变更有请求、独立审查、同 oracle RED/GREEN | Phase/task DO NOT TOUCH→实现者→独立 reviewer；N=归档 `tasks.md` 计划了冻结边界；F=缺目标测试被删/放宽时拒绝、合法变更记录及同命令 RED/GREEN 原件。 | **incomplete**；CARD-02 测试合同 owner：构造篡改负例及授权变更审查读回。 |
| AC-TEST-003 | 双 Phase fixture 目标断言 RED 非零且非环境故障，smoke 不冒充真实抽验 | 测试作者→fixture runner→handoff；N=归档 `tasks.md` T009/T010 声明 fixture 通过；F=缺当前**独立物理**双 Phase、原始失败输出/exit 和目标断言归因；`card-02-current.mjs` 维持缺证。 | **incomplete**；CARD-07 P1 owner：用现行物理 Phase fixture 保存同命令目标 RED/GREEN 原件和覆盖限制。 |
| AC-TEST-004 | 真实 Luna build-code/verify-code、不改冻结测试、真实入口成功/失败 | CARD-10 真实任务→Luna→verify-code；N/F=归档 `tasks.md` 明示仅 smoke，真实 E2E 未触发/无原件。 | **deferred**；CARD-10 owner：真实任务触发后保留实现 diff、澄清、同 oracle 测试与正式入口事实。 |
| AC-REVIEW-001 | 一次完整冻结材料审查；不截断，unavailable 保真 | build-plan packet→wh-review→canonical attempt/result；N=归档 `tasks.md` T004 记录完整/超限 transport 局部断言；F=归档 P1 `REVIEW_WAIT_EXCEEDED` attempt，当前完整 Phase packet 的语义结果缺。 | **unavailable**；wh-review/CARD-07 P4 owner：冻结当前 spec+全部 Phase+来源，单次派发并读回结果或真实 unavailable，禁止重试追 clean。 |
| AC-REVIEW-002 | finding 三态处置，人工项 owner/期限，无 severity gate/无变化复审 | canonical review result→disposition→受影响复验；N=归档 `tasks.md` T004 有模拟指标/处置断言；F=当前无完整语义 findings，无法做真实逐项处置。 | **unavailable**；wh-review owner：有结果时逐项处置及受影响复验；无结果如实保留。 |
| AC-REVIEW-003 | 原始分子分母/时间可复算、四自检、失败码/重试保真 | provider attempt→CARD-05 比较实验；N=归档 `tasks.md` T004 有 fixture；F=真实 provider 多状态比较实验和 canonical 复算原件缺。 | **deferred**；CARD-05 owner：按原 AC 取真实对比实验，未触发前不升绿。 |
| AC-AUTH-001 | 已知清单双权威 0，四类产品事实各有样本/权威/结论/证据 | ID 检查器+人工四类抽样→无重复契约报告；N=模板/局部 ID 检查存在；F=缺四类逐事实当前材料样本和检测出双权威的反例。 | **incomplete**；CARD-02/CARD-07 P3 owner：四类样本逐事实表、双权威注入负例、范围限定。 |
| AC-AUTH-002 | 产品目标变化只改一处权威正文，引用仅改指针 | 母 PRD/product authority→spec/Phase 引用；N/F=未见同一目标变更前后 diff 与全引用读回；现有静态指针不构成变更传播。 | **incomplete**；CARD-02/CARD-07 P3 owner：对隔离 fixture 做一次目标变更和全引用 diff，不改母 PRD。 |
| AC-FLOW-001 | 15+13 合成 13 步，旧语义不丢、public 新增 0、本卡不提前跳旧阶段 | 旧 manifest→`workflows/build-plan/steps.json`→stage runner；N=13 步目标 manifest 存在；F=缺逐步语义/真实 consumer 及 public surface 净零完整对账。 | **incomplete**；CARD-02 runtime owner：逐步对照并对 consumer 运行 oracle，列出增删对象。 |
| AC-FLOW-002 | K1–K12 每项 consumer/语义/oracle/owner/删除条件并实际核验 | K 账→runtime/skill consumers；N=归档研究 `I-B-build-spec-build-plan-quality-core.md` 有映射；F=缺 12/12 当前 consumer 的独立 oracle 回放。 | **incomplete**；CARD-02 runtime owner：逐 K 真实入口读回，不接受仅字段非空。 |
| AC-FLOW-003 | 不再 active 产 plan/tasks 双写与相等性路径 | spec/Phase writer→material workspace/stage/review/verify readers；N=`card-02-current.test.mjs` 拒绝 post `plan.md/tasks.md`，当前 CARD-07 无这两文件；F=active writer/reader/validator/模板全口反向清单未闭合，pre 历史读面与 active 双写未逐一分类。 | **incomplete**；CARD-07 P2 owner：生产 consumer census、post 新任务读回及旧路径只读分类。 |
| AC-COVER-001 | 五类独立缺失逐 ID/位置报错；现行完整输入空缺失；确认路径真的调用 | 覆盖检查器→confirm→质量事实；N=归档 `tasks.md` T005/T006 有五 fixture 局部声称；F=缺现行完整 inventory + 同身份 confirm readback 绑定，不能只靠 fixture。 | **incomplete**；CARD-07 P4/CARD-02 coverage owner：五 RED、真实完整 GREEN、confirm 事实三方同版核对。 |
| AC-COVER-002 | 同一 parser 识别 CARD-01/02 原定 24 决定块×4 字段=96，无文件名特判 | `tools/cli/check-decision-log-chain.mjs` 同 parser 读两真实归档：CARD-01 10 块/39 字段（D-010 缺 `artifacts`），CARD-02 15 块/56 字段（新增 D-015 四字段全缺），当前合计 25/95；排除 D-015 按原 24 块仍仅 95/96。旧 96/96 用合成块，checker advisory exit 0 非通过。 | **incomplete**；CARD-02 coverage/历史材料 owner：保留归档只读的真实缺口与固定两原件回归。若原 AC 必须由这两份归档达成，需用户另行授权历史勘误或变更提交条件，不可改 parser 伪造。 |
| AC-CLEAN-001 | 无 aggregate active 输入/writer/consumer/完成依赖及 outline_closed 前置 | make-decision→handler/runner→stage outcome；N=当前 `skill-deps.yaml` Talk consumer 只指向正式 make-decision `decision-log.md` 链，completion/runner 不再发布或要求 `outline_closed`，定向 `stage-completion`/`stage-skill-consumer-contract`/`zero-machine-gate-advancement`/`stage-decision-contract`/`stage-runtime-preflight` 共 **123** 项通过；F=现有 no-outline/no-aggregate fixture 若回归仍失败。未做真实用户会话的正式 stage quality 发布。 | **incomplete（当前生产契约已定向验证）**；CARD-07 owner：以真实 current make-decision 运行保留认证 stage fact/质量原件后，才能把原 CARD-02 的完整判据提升；不以局部 fixture 冒充已实现。 |
| AC-HANDOFF-001 | 每延期/不可用项有 owner、触发、对象、关闭条件、当前状态 | 归档风险表→阶段 handoff→task facts；N=归档 `tasks.md` T009/T010 有 CARD-10 deferred 声明；F=22 AC 当前 16 缺口/2 deferred/2 unavailable 尚无统一五要素当前 readback。 | **incomplete**；CARD-07 P4 owner：逐未完成项附 owner/触发/对象/关闭条件/状态，读回 task facts，不写成完成。 |

## 母 PRD CARD-02 AC-06～10 的独立核对

| 母 PRD AC | 本账本承接 | 当前判定 |
| --- | --- | --- |
| AC-06：重构后逐事实无重复、0 个双权威且失败可检出 | AC-AUTH-001/002 | **incomplete**：ID/结构检查不能替代四类产品事实的零双权威抽样。 |
| AC-07：真实实施 task 的 spec 四件翻译、可执行 AC、不复制 PRD 正文 | AC-DOC-002/005、AC-TEST-001 | **incomplete**：当前 CARD-07 实物可定位，但缺同一真实任务四件的独立语义读回与复制负例。 |
| AC-08：真实多 Phase 各自差异/边界/依赖/验收/全局指针，紧凑索引 | AC-DOC-003/004、AC-TEST-003 | **incomplete**：物理结构局部通过，真实开发可执行性和目标 RED 尚未闭合。 |
| AC-09：新任务无 plan/tasks 双写及相等性活动路径 | AC-FLOW-003 | **incomplete**：CARD-07 样本无双写，但全 active consumer/writer/validator 清单缺。 |
| AC-10：产品目标变化只更新唯一正文 | AC-AUTH-002 | **incomplete**：缺变更传播 diff。 |

## 最短修复顺序与外部事实

1. 先闭合 AC-CLEAN-001 与 AC-FLOW-003 的**当前生产路径**清单：去除残存 active aggregate 宣告，明确 pre 历史只读、post writer/reader/validator；它们会污染后续正式入口证明。
2. 用同一真实 CARD-07 材料补 AC-DOC-001～005、AC-TEST-003、母 PRD AC-07/08 的正常/失败原件；Phase 字段存在与局部测试 exit 0 不可代替独立实施冷读。
3. 补 AC-AUTH-001/002、AC-COVER-001/002 的逐事实/逐源判据及正式 confirm 读回；再做 AC-OI-001、AC-FLOW-001/002 的生命周期/逐 K 回放。
4. 最后冻结当前同版材料，取 AC-REVIEW-001/002 的一次真实结果或 truthful unavailable，再作 AC-HANDOFF-001 五要素读回。AC-TEST-004 的 Luna 实施和 AC-REVIEW-003 的真实 provider 比较明确属于 CARD-10/CARD-05：没有这些外部事实，**“22 条全部 achieved”不能成立**；若要改变提交条件，须由用户明确裁定，不可把 deferred/unavailable 当通过。

`card-02-current.mjs` 已在本任务随后修正：DOC-003/004 的结构子断言仍可通过，但原 AC outcome 保持 incomplete。**当前完整判据计数为 0 achieved、18 incomplete、2 deferred、2 unavailable**；此前 2 个 achieved 仅是结构候选的旧分类，不得当完整业务验收。
