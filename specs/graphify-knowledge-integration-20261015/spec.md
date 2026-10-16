# 功能规格：知识图谱融入五阶段与共享收口

读者：本任务各 Phase 的实施者、独立审查者、验收者与后续阶段主会话。
读完要能：知道阶段如何消费知识、谁更新图、什么属于真实效果、哪些动作仍需用户决定，并沿独立 Phase 执行。

- **任务**：`graphify-knowledge-integration-20261015`
- **来源**：当前 `decision-log.md` 的原始需求、ADR-001～ADR-018、M0～M7；原始逐项来源为任务库 `quality/evidence/decision-log-refs/requirement-index.md`。
- **状态**：build-plan 已确认，后续已进入 P1–P8 实施与验收。当前阶段、验收和交付结论以各 Phase、外置 task facts、`quality/tests/P8-acceptance.md` 与最新 stage-handoff 为准；本规格不代表阶段完成。当前规格保留既有 `AC-001`～`AC-012`；`AC-KG-013` 补接已经明确决定的 M6 完成判据，不增加新产品方向。

## 材料导航

| 要找什么 | 唯一位置 | 何时读 |
| --- | --- | --- |
| 产品目标、真实取舍与用户答复 | `decision-log.md` 对应 R/ADR/M 条目 | 目标、范围或成本决定不清时 |
| 行为与唯一验收承诺 | 本文件「功能需求」「Appendix A」 | 作者与验收者逐项对照时 |
| 全局接口、写集、依赖与风险 | 本文件「实现设计」 | 分工、边界及共享路径交接时 |
| 具体动作、命令、oracle、证据与恢复 | `phases/index.md` 指向的独立 Phase | 执行本 Phase 前 |
| 执行、审查、用户确认原件 | 外置任务库的 `facts.jsonl`、`quality/tests/`、`quality/reviews/`、必要 `quality/evidence/` | 判断实际做没做、结果是什么时 |

## 速读卡（30 秒）

五个阶段开工先按职责查知识图谱，再回真实文件核实；让历史决定和教训改变实际产出。先诊断并便宜补修图的已知缺口，再交付 `knowledge-graph`，独立抽取 `stage-closeout`，最后接各阶段。图与语义缓存随当前任务 worktree 和 Git 流动；不可用明确降级、继续安全工作。共享收口复用已有授权和窄工具，不恢复旧 close plan。收益以知识精准度为主，真实任务 token 净消耗不能劣化。八个 Phase、全局 T001～T008；P8 是唯一全 AC 验收，不能用方法文本或旧测试绿替代真实调用与用户效果。

## 来源与决策映射

来源的逐项行为、强度及 FR/AC/Task/oracle 关系统一见「需求到任务追踪」；原始来源仍由 requirement-index 与 decision-log 承载。本文件不另建需求原件。R-009 按 ADR-013 修订；R-025 原仓库外固定图设想已由 ADR-012 推翻，不能重新实施。R-010～R-017 的过程要求延续在本次工作与验收安排，不包装成另一项生产功能。

## 1. 需求解释：问题与紧迫性

当前项目已有包含历史规格与阶段方法的知识图谱，但工作流不会稳定地把这些知识用于当次决定、设计、开发和验证。仅增加一句「查图」容易装样子：命令执行了，产出却没变。另一方面，`graphify update` 只处理代码，对文档静默跳过也可能退出 0；把它当完整更新会让知识逐渐过时。

本任务让阶段执行者得到相关历史知识和精确代码落点，并把共享收口归一个方法 owner。目标与投入取舍以 decision-log ADR-001、ADR-013、ADR-016～ADR-018 为准。旧建图成本是实际投入，不能用不现实的整库通读基线宣称已省 token。

## 2. 背景、目标与范围

### 背景

Graphify 已安装且既有图已搬入当前 worktree；该事实不证明本集成已实现。图查询主要返回散文，文档语义抽取由宿主子代理承担。JSON、阶段步骤、schema 与治理规则必须直接读取真实文件。当前方法与工具的职责边界沿 CONSTITUTION、AGENTS 和 `docs/standard-workflow.md`，不随新技能改变。

### 目标

阶段主会话在独立调研摘要里拿到有用结论，回读原文后用于本阶段产出；各阶段仍按当前材料与真实测试工作。共享收口可由 build-prd 和 verify-code 实际消费，图两层更新、Git 交付与物理清理分别报告。

### 范围内

M6 图质量诊断与允许的便宜补修；知识图谱技能及包装登记；五阶段开头调研及既有步骤内部接入；共享收口方法、两个 caller；图数据的 Git 提交与手动冲突处理指引；三历史任务 A/B、真实五阶段旅程及全项验收。精确文件边界见全局设计。

## 3. 用户场景与状态覆盖

| 场景 | 角色、输入与触发 | 产出与唯一判据 |
| --- | --- | --- |
| SCN-001 首次项目 | make-decision 主会话发现项目无可解析图 | 自动取得代码图；文档建图先获范围与成本答复，图调研与原文读取顺序见 AC-001 |
| SCN-002 已有图的调研 | 各阶段子代理收到本阶段问题和实际路径 | 图结论真正改变产出；已有文件只作发现入口，回原文核实，见 AC-002/004/005/009/010 |
| SCN-003 工具或图异常 | 命令缺失、真实失败、图或查询输出不可消费 | 明确 unavailable 及原因，改普通阅读，见 AC-003 |
| SCN-004 验证并收口 | verify-code 已有实际材料、质量结果及任务授权 | 图侧补充核对、两层更新、共享方法与授权保全，见 AC-006/011/012 |
| SCN-005 分支交付 | 当前任务 worktree 中图与语义缓存随本次任务提交 | 知识载荷白名单、图变化单列及冲突指引，见 AC-007 |
| SCN-006 成本与价值 | 独立执行者拿到三历史任务、无图基线、真实任务及宿主 usage | 成对调研、真实效果与各成本条件分别判断，见 AC-002/008/010 |
| SCN-007 规划收口 | build-prd 最终稿已确认，仍有后续子任务消费父材料 | 调用共享方法，区分稿件确认、Git 授权和最终清理范围，见 AC-011/012 |
| SCN-008 修图 | P1 owner 收到现有图、缓存、抽取源及已知六缺口 | 每项成因与真实前后观察，合法 external 节点和关系来源不误修，见 AC-KG-013 |

状态覆盖：默认态为已有图调研；空态为 SCN-001；错误态为 SCN-003；长运行/加载为宿主语义抽取，报告真实运行与结束状态；取消保留已产生原件与未完成范围，不假称更新；边界为无匹配、歧义、只代码图、旧图和缓存复用；权限态为文档抽取许可及各 Git/清理范围；竞态为分支独立图合并、catalog 先后写者。无 UI 加载视图、viewport 页面或浏览器交互：本次仅方法、配置与图产物，无前端路由或组件改动；不以此免掉 CLI、Git 与真实宿主消费验证。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**；状态 `verified`：当前 decision-log 明确图随 worktree/Git、文档先问、五阶段开工调研与共享收口，来源本任务 `decision-log.md` ADR-006～ADR-018/M0～M7；影响全部 FR/AC。
- **PFACT-002**；状态 `verified`：当前方法有五个 `steps.json`、已有 narrow authorization/safe-write/workspace owner；2026-10-15 由作者实际读取，字段、签名与值见下方保护实读表；影响 FR-KG-004/010/011、AC-003/011/012。
- **PFACT-003**；状态 `inferred`：既有语义图对精准知识有价值，但真实阶段效果不能从图覆盖率推定；依据 decision-log ADR-015/M1 的有限抽样与选定 A/B；影响 FR-KG-002/009、AC-002/008/010，限制见 RISK-001。
- **PFACT-004**；状态 `unknown`：本次正式 M6 六项成因报告、允许补修后的完整数字及 JSON 纳入选择尚待 P1 原件；owner=P1 图质量作者与 JSON 选择的用户，影响 FR-KG-001、AC-KG-013，关联 OPEN-001。
- **PFACT-005**；状态 `unknown`：真实完整五阶段同 scope 对照 usage 与用户价值判断未产生；owner=P4/P8 独立执行者、真实任务主会话与用户，影响 FR-KG-009、AC-002/008/010，关联 OPEN-002/RISK-002。
- **PFACT-006**；状态 `not_applicable`：本任务无前端 UI 产品写集，不规划页面组件改造；影响 AC-009 的产出形式及验收对象缺 viewport 的说明，不取消实际阶段消费。

## 5. 功能需求

每条 FR 的完整来源、场景、PFACT、AC 与 Phase 对应在追踪表及下表交叉引用；验收条件只在 Appendix A。

- **FR-KG-001**：六项图缺口先查因，按真实安全路径补修便宜部分，逐项给前后实测；不能修的保未修、原因与影响。JSON 扩面由用户在查因后真实选择；关联 PFACT-004 / SCN-008；验收 AC-KG-013。

- **FR-KG-002**：`knowledge-graph` 统一建图/更新/查图/降级；用 source_file 回原文；归档历史尝试与合法无信号分开，图只是发现入口；关联 PFACT-001/003 / SCN-001/002；验收 AC-001/002/003/009/010。

- **FR-KG-003**：图及文档语义缓存在项目 worktree 内随 Git 流动，首次全量后按 manifest/内容哈希增量；图变化与功能写集分别对账；关联 PFACT-001 / SCN-005；验收 AC-007。

- **FR-KG-004**：不可用、无匹配、歧义、代码无变化与真正更新分别报告；退回普通阅读继续工作，保留现有步骤、审查与事实 owner；关联 PFACT-001/002 / SCN-003；验收 AC-003/009。

- **FR-KG-005**：make-decision 在阶段开头调研并在 research-and-diverge 内消费；不存在代码图自动建立，文档缺失/陈旧先告知仅增量预计份数并问；外部调研与 Talk 保留；关联 PFACT-001 / SCN-001/002；验收 AC-001/002/009/010。

- **FR-KG-006**：verify-code 开工调研，affected 核声明外影响、query 核同类约定；共享收口在任务 worktree 内更新图并分别读回代码/文档结果；关联 PFACT-001/002 / SCN-004；验收 AC-006/009/011/012。

- **FR-KG-007**：build-prd 与 build-plan 开工及既有读源步骤查询职责、历史决定、过去教训，结论落现有产出而非新中间查询日志；关联 PFACT-001/003 / SCN-002/007；验收 AC-004/009/011。

- **FR-KG-008**：build-code 开工调研、写代码前 affected/explain/path 后精准读文件；目标不存在允许如实无匹配或歧义，不硬套、不伪造；关联 PFACT-001/002 / SCN-002；验收 AC-005/009。

- **FR-KG-009**：三历史任务有图/无图忠实 A/B、独立读文件对照与真实五阶段旅程，成本按真实 input/output/cacheRead 分列；缺 usage 不换算字节造 token，不把价值好评替代净消耗条件；关联 PFACT-003/005 / SCN-006；验收 AC-002/008/010。

- **FR-KG-010**：`stage-closeout` 作为共享方法唯一承接 Git/物理收口和知识更新委派；build-prd/verify-code 保阶段质量、确认、facts 与 handoff owner，真实调用后才判断效果；关联 PFACT-001/002 / SCN-004/007；验收 AC-006/011/012。

- **FR-KG-011**：共享收口保真实授权范围、动作/分支/HEAD 核对、最终 close 一次范围确认与具名例外；规划稿确认不授权 Git，后续仍消费的父材料不自动归档；关联 PFACT-001/002 / SCN-004/007；验收 AC-011/012。

## 6. 模块划分

图质量交付以一个可安全消费的诊断/便宜补修结果为 P1 单元；知识技能以独立宿主可消费的完整四动作方法为 P2 单元；共享收口以可独立复放的方法为 P3 单元。随后各阶段独立产出是不同真实消费者的结果，分别接入；build-prd/build-plan 同属规划知识使用结果，在 P6 同卡内完成两 caller，仍分别给实际证据。P8 独立消费全项首次结果，只补未闭环 case，不补造此前阶段效果。

## 7. 关键实体

知识图谱使用上游既有 `graph.json` 的 `nodes`、`links`、`hyperedges`，不新增本地 schema；manifest 与 `cache/semantic/` 参与内容哈希对应。节点 ID 是身份而非路径；`source_file` 才定位文件；边 source_file 表示关系的证据文档，不能机械等同源节点定义文件。`external=true,type=external` 引用占位可以没有 source_file，不能伪造来源。

阶段调研产出是现有材料中的结论及其实际影响；它不是新 knowledge receipt。M1 调研由 deep-research canonical report 承载；M2/M3 只把结论落既有 spec/Phase/代码，运行事实沿普通事实 owner；不另存散文查询日志。收口对象仍是当前 task、真实 worktree/branch/HEAD/remote 与已有原件引用，不新增 close 状态或 plan 对象。

## 8. 数据和生命周期

项目没有图时自动建立代码层；文档首次建图按 M1 先问并由宿主子代理执行。已有图解析可用即消费；版本/AST grammar/schema仅诊断事实、旧图不拒用，built_at_commit不能证明文档内容版本，随结论说明图的覆盖年龄、AST/语义层及本层是否更新。代码层缺少/陈旧可自动按正常流程补；文档层缺少/陈旧先问，只重抽改动文档并给预计数。增量候选必须取「内容变化集合 ∪ 当前prompt/mode缓存未命中集合」：detect_incremental只按semantic_hash，不能发现内容未变的prompt升级；legacy缓存无指纹时vintage为unknown，未批准不得新抽，也不能拿当前磁盘hash覆盖旧图的内容版本。代码-only 可回答结构问题，历史问题回原文并披露覆盖限制。

每个任务只更新自身 worktree；新 worktree 继承已提交图和缓存，不能写 main 或仓库外共享可变图。收口先由 knowledge-graph 在任务分支更新，再随任务交付。上游 update 对文档不操作、无变化退出 1 必须分别读回，不能用 exit 0 推定两层已更新。graphify 临时物仅清本次创建且具名可再生项；其余 ignored_unknown、私有、未知或未交付字节列具名例外及保管方式，不按 graphify-out 目录名整体删除。

## 9. 兼容性预留

五阶段原步骤、原审查点、授权与人类选择语义保持；开头调研与既有步骤内部接入并存，不能以只加开头取代 ADR-002～005 的内部消费。catalog 与 deps 沿现有形状，外部 graphify capability 缺失是 diagnostic。`knowledge-graph` 避免宿主宽触发的 `graphify` 名字；方法可搬运、不写死当前账户或绝对路径。

图合并只声明 `.gitattributes`，不注册 hook/global 配置。手动 merge-driver 只作 current/other 结构并集提示，base、manifest、缓存和 analysis 不由它完成语义合并。双方同 ID 不同内容、删除和旧关系回流必须读原文确认、再按正常更新恢复一致性；不能说驱动自动可靠合并或会保留删除语义。

## 10. 明确不做与默认必须成立

不改 runtime/core/tools 生产模块、五份 steps.json 或公共入口；不上游修改 graphify；不新增 gate、状态、schema、进度账本、调度器、经验记忆或事实 writer；不使用 `save-result`、`reflect`、`hook install`、不存在的 `--mcp`。不配置通用模型 API 后端，不由主会话吞全文散文或全部 analysis，不重新全量抽取已建图。首轮千万级文档建图已另会话完成，本次不重复承担；重抽必须按允许范围、成本与真实答复处理。

保留原始证据与历史失败；图存在、查询退出 0、方法文件存在、旧测试 GREEN、计数齐备和空 findings 均不能代表真实效果或用户同意。不为修 340 个 id/source_file 错位而重抽；读 source_file 并回原文。语义 label 是意译，不能当逐字引用；Community N 不当模块导航。JSON 当前覆盖 unknown，设计 schema/governance 时直接读原文件。

## 验收流程

从 SCN 入口沿 FR 到 Appendix A 的同号 AC，读取该 AC 对应首次 owner Phase 的命令、独立人读或真实宿主调用原件。每条 AC 条件分开判断技术接线、完整语义效果和真实用户输入；所需输入的提供者与时点见下表。P8 一次聚合此前原件，按 AC 原判据补必要未闭环真实 case。不能把结构检查变成另一个业务 oracle。

| 输入/结果对象 | 提供者与 producer | 真实 consumer / 执行 owner | 取得时点与限制 |
| --- | --- | --- | --- |
| 图、manifest、缓存及六项缺口材料 | 当前 worktree/原建图原件；P1 作者 | P1 独立复验者、P2 技能作者 | P1 before/after；未知成因保留，不手造对照数字 |
| 无图项目/真实宿主阶段输入 | P4 作者提供受控临时项目，用户或已授权任务主会话提供真实需求 | 未参与实现的独立宿主会话 | P4 首次 make-decision 复放；受控反例不冒真实效果 |
| 三历史任务原始需求与基线 | `specs/archive/` 三任务原件、基线 c5c5bdb8 | 六个相互独立 A/B 研究上下文；独立比较者与用户 | P4 首次成对运行；成本先估告知；乙物理无图，禁装作无图 |
| 五阶段真实任务产出与完整 usage | 用户/已授权任务主会话提供未挑选 scope 的真实任务；宿主提供 trace/usage | 各 caller 首次执行者、P8 独立验收者、用户 | P4～P7 首次局部观察；P8 完整五阶段有/无图同 scope；缺完整 usage 的成本条件 unknown |
| build-prd 最终稿答复与 Git 授权 | 当前规划主会话记录真实用户原话 | P6 的共享收口 consumer | 最终稿真实确认后；无 Git 授权只完成授权内部分，父材料在用须保留 |
| verify task 授权及最终 close 范围 | 当前用户原话/既有 task 授权、最终范围回复 | P5 的共享收口 consumer | 必要 Git 沿已有授权；归档/删除前一次精确范围确认 |

## 测试标准

| 测试面 | 适用与理由 | oracle、证据及局限 | 命令 owner |
| --- | --- | --- | --- |
| 图质量/正常缓存重放 | 适用：图与哈希对应及合法 external 不能误修 | ORACLE-P1-GRAPH-QUALITY；冻结真实基线测试、六项前后数字与原始执行；结构完整不证明知识忠实 | P1/T001 |
| 技能/deps/catalog/move-map/ignore | 适用：实际包装与 Git 载荷改变 | ORACLE-P2-KNOWLEDGE-GRAPH；定向包装读取、check-ignore/状态、独立完整方法消费；不能证明真实效果 | P2/T002；catalog P3 后接 |
| close 授权与安全回归 | 适用：方法抽取影响不可逆动作选择 | ORACLE-KG-P3；既有 close/授权定向测试及临时 repo 实际共享方法复放；旧测试不能替 caller 接线 | P3/T003、P5/T005、P6/T006 |
| 自然语言方法完整性 | 适用：方法语义是主要产物 | 各 Phase 同名 ORACLE；非作者读完整正文与原源后逐步复放，缺来源不猜；纯 MD 卡满足 G-2 才可免新行为 RED | P2～P7 各本 Task |
| 阶段实际调用与产出影响 | 适用：存在方法无调用是主要失败 | P4→ORACLE-KG-STAGE、P5→ORACLE-P5-VERIFY、P6→ORACLE-P6-PLANNING、P7→ORACLE-KG-STAGE；ORACLE-KG-STAGE仅为共享接线技术子oracle；独立宿主 trace、完整产出、因果对照 | P4～P7 首次，P8必要补验 |
| 精准知识及成本 | 适用：R-008/009 核心目标 | ORACLE-P8-ALL-AC；三历史任务成对结果、用户判断、真实完整 usage；缺 token 只报 bytes/calls/elapsed，不能判 AC-008通过 | P4 原件、P8全项 |
| 浏览器/UI | 不适用：原始要求、当前 inventory 与计划写集都无页面/组件变更 | 不安排浏览器 E2E；不借非 UI 标签免真实宿主和 Git 流程 | 各 Phase声明同源理由 |

测试路线由 test-routing-advisor 对实际 changed_files/Phase 数/命令选择一个主 concrete skill：纯方法卡可 simple/G-2，图/配置与 Git 行为边界按真实风险至少 feature，无法证明更窄则 fullstack；路线档不替代上面测试面。主技能与精确命令留每张 Task。整个任务混合交付，不豁免唯一末验收 Phase。

### 验收对象

以下是当前真实验收对象；五项不因非 UI 而绕过。workspace 已知；service/viewport 没有真实服务或页面提供，保持 null，由验收主会话在具体对象成立时补真实来源，不造默认值。

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-graphify-knowledge-integration-20261015",
  "service": null,
  "route": "workflows/make-decision/SKILL.md; workflows/build-prd/SKILL.md; workflows/build-plan/SKILL.md; workflows/build-code/SKILL.md; workflows/verify-code/SKILL.md",
  "state": "build-plan草稿；待真实计划确认与后续独立宿主实施验收",
  "viewport": null,
  "owner": "当前任务主会话；真实用户效果与文档抽取选择由用户"
}
```

workspace 来源为认证工作区；route 是本次实际方法入口而非假 URL；state 是当前材料状态。service 缺项影响真实宿主/CLI运行对象的最小字段检查，owner=P4/P8执行者，实施/验收前取得；viewport 为当前无页面的具名限制，owner=验收主会话，不能编尺寸使 checker 通过。唯一 checker 从 `skills/spec-specify/templates/spec-template.md` marker 提取执行；结果只证明五字段存在，不证明完整 S5、环境或效果。

## 架构边界

knowledge-graph 是图动作与使用限制的唯一 owner；stage-closeout 是共享 Git/物理收口方法 owner，调用知识 owner 进行更新。五 caller 各自仍拥有本阶段材料、质量判断、真实用户交互、正式 task facts 与 stage-handoff。graphify 是外部 CLI/库能力，当前主会话和子代理按实际材料执行，不引入 runtime adapter。

## 实现设计（全局权威）

### 代码锚点

先读 `workflows/make-decision/SKILL.md` 的 research-and-diverge、`workflows/build-plan/SKILL.md` 方法第2步、`workflows/build-prd/SKILL.md` 方法第1/5/6步、`workflows/build-code/SKILL.md` 实际测试映射与入口研究、`workflows/verify-code/SKILL.md` 方法第4步及人为门/安全收口段。原 `steps.json` 用于点名现有步骤，不由本任务修改。

现有共享能力：`runtime/interface/safe-write.mjs` 的 writeFileAtomic/createFileOnce/appendRecord；`runtime/interface/git-authorize.mjs` record/consume；`runtime/task/workspace.mjs` inspectWorktreeCleanup/createTaskWorktreeRemoval；`runtime/stage/stage-skill-runtime.mjs` loadStageSkillManifest。`core/task-close.mjs` 历史结构只读作保全来源，不恢复 legacy close plan 或把旧 execute 链当新方法入口。

#### 受保护依赖实读（2026-10-15）

以下由本 spec 作者在当前 worktree 用 `nl -ba <文件>` 及 Python `json.loads(Path(...).read_text())` 实际读取；这是当时逐字字段/签名和值，不声称之后从未变化。实施者在 Phase 边界读回；不一致先修断言，禁止靠摘要推断未变。

| 保护文件 | 实读逐字项 | 用途 |
| --- | --- | --- |
| `runtime/interface/safe-write.mjs` | `writeFileAtomic(root, relPath, bytes)`；`createFileOnce(root, relPath, bytes)`；`appendRecord(dir, slug, ext, bytes)` | 复用现有安全写/不可变记录，不改 producer |
| `runtime/interface/git-authorize.mjs` | `record({ operation, confirmationRef, phase, dir = join(process.cwd(), "quality", "authorizations") } = {})`；`consume({ operation, stepId, authorizationRef, phase, dir = join(process.cwd(), "quality", "authorizations") } = {})`；`phase !== undefined` 仅允许 `operation === "commit" && phase === "build-code"`；非scoped HEAD变化抛 `AUTHORIZATION_HEAD_MISMATCH` | 共享方法复用真实授权，保现有build-code复用例外，不改授权实现 |
| `runtime/task/workspace.mjs` | `inspectWorktreeCleanup(worktreeRoot)`；`createTaskWorktreeRemoval(taskHandle)`；返回 `probe`/`execute`/`verify`；mode `existing` 返回 `existing worktree is not task-owned`；清理分类 `tracked`、`untracked`、`execution_sidecars`、`ignored_generated`、`ignored_unknown` | 普通安全移除，未知字节不靠目录名豁免 |
| `runtime/task/task-store.mjs` | `STAGE_ROW_KEYS`＝`record_kind, task_id, stage, source, created_at, review_origin, review_result_ref, finding_dispositions, spec_analyze, evidence, serious_issue_disposition, close_action, handoff, material_bytes`；`REVIEW_ORIGINS`＝`conducted, unavailable, not_run, same_source_degraded, dispatched_uncollected` | 保既有facts，不加知识/收口字段或状态 |
| `runtime/stage/stage-skill-runtime.mjs` | dependency的 `name`、`path`、`trigger`；`path` 相对且以 `skills/` 开头、不得含 `..`；`loadStageSkillManifest(packageRoot, stage)` | deps按原能力消费，不加runtime包 |
| `workflows/make-decision/steps.json` | 顶层 `schema_version, stage_slug, steps`；值 `2.0.0` / `make-decision`；原步骤1～15：`load-context, outline-hypothesis-talk, research-and-diverge, outline-revision-check, outline-talk, adversarial-direction-check, direction-advice, module-breadth-confirm, module-convergence, detail-advice, grill-with-docs, write-decision-draft, approve-decision, stage-end-spec-analyze, stage-handoff` | 保序列，开头调研折入方法 |
| `workflows/build-plan/steps.json` | 同三顶层键；`2.0.0` / `build-plan`；1～12：`read-current-materials, conditional-light-research, spec-clarify, spec-specify, conditional-ui-readiness, spec-plan, testing-system-blueprint, test-routing-advisor, merged-review, main-agent-disposes-findings, final-spec-analyze, confirm-plan-and-handoff` | 保现有步骤 |
| `workflows/build-prd/steps.json` | 同三顶层键；`2.0.0` / `build-prd`；1～6：`load-confirmed-inputs, generate-outline-and-task-map, confirm-map-and-conditional-design, expand-single-prd, review-and-confirm-final-draft, stage-handoff` | 保两次正文调用与真实确认 |
| `workflows/build-code/steps.json` | 同三顶层键；`2.0.0` / `build-code`；1～12：`read-current-task-documents, write-red-tests, implement-change, inspect-and-route-actual-tests, run-tests, inspect-acceptance-and-ui, scan-diff, review-change, analyze-review-findings, run-final-aggregate-and-ac-trace, stage-end-spec-analyze, stage-handoff` | 保每Phase开发/测试/审查职责 |
| `workflows/verify-code/steps.json` | 同三顶层键；`2.0.0` / `verify-code`；1～8：`read-current-materials-and-code, ocr-code-review, preserve-review-facts, inspect-real-entry-and-tests, repair-and-targeted-recheck, record-finding-dispositions, report-verification-result, stage-handoff` | 收口抽方法，不增步骤 |

### 接口与失败语义

<a id="knowledge-graph"></a>

#### knowledge-graph

输入为当前项目/worktree、阶段职责、任务涉及的精确路径、实际调研问题、已有材料及本次授权；root 用 realpath，prompt_file 用 Path。四分支输出仍是正常方法结果与现有事实：可消费图结论、正常流程图更新结果、无匹配/歧义/无变化的事实，或 unavailable 原因与普通阅读回退。`--no-label` 强制，避免隐式模型命名；不配置通用 API key。

调研子代理消费 query 散文，仅回少数结论+真实来源路径；每阶段尝试找归档历史并说明如何影响本次做法，真正无相关历史可合法报告「本次无历史经验可挖」。这不适用于 AC-010 的三指定正例。正常路径先 query、god-nodes，再按任务路径筛候选边取20～30条相关意外关联；不读低召回 surprises，不整份读 communities。空候选或共享同一端点标签说明无信号并停止；questions/gods 按需有界提取。编号、来源路径本身不是防装样子的判据。

build-code 内部消费按 affected/explain/path，其中 path 用于实际模块协作问题；不存在目标或不适用明确说明，读回退出3/4及真实消息，不能把歧义说失败或把命令失败说无匹配。verify 图侧核两项后仍由实际测试/OCR等既有独立质量来源判断。

<a id="closeout"></a>

#### stage-closeout

输入为 caller当前task/worktree/branch/HEAD/remote、实际交付结果、质量限制、原始授权引用、需交付/保留/清理范围及PR状态；输出为提交/推送/合并/PR/归档/清理/图更新分别真实结果和原件指针。质量判断、最终稿确认、普通stage facts、reflection与stage-handoff仍留caller；共享技能只消费这些来源，不重新决定方向。

先在任务worktree委派知识owner更新，确认不会继续生成应交付字节后执行必要Git交付。build-prd最终稿确认仅是内容选择；缺对应Git范围授权就不执行该不可逆动作。verify沿任务持续授权完成必要commit/push/merge，不增日常技术确认。每个动作前用现有authorize record/consume核动作/分支/HEAD；授权未覆盖的新增范围才问。只有归档、删除worktree/任务分支及交付清理前，展示真实结果、质量限制、精确目标、同名远端实际状态和具名例外，取得一次最终范围确认。

规划父材料仍被子任务消费时保留具名材料及原因，不机械归档或移动父/兄弟材料。PR创建后立即回真实URL；`until=pr`仅指真实PR处的一次调用切片，同次流核PR/head/base/branch状态接续，不产生旧plan/confirmation执行对象。普通五步退路与失败保全保持，禁止force/-D/强推。外部权限/凭据等不可重试失败按现项目规则立即停该路径并给可直接回复路线；其它安全工作继续。

<a id="decision-entry"></a>

#### make-decision阶段接入

P4/T004承接FR-KG-005，阶段开头与research-and-diverge内部消费并存；P2管理图有效性、代码自动/文档先问及查询方法，caller保外部研究、真实Talk/Grill与decision权威。三历史A/B是此Phase的真实价值验证输入，不把调查模拟成生产完成。

<a id="verification-entry"></a>

#### verify-code阶段接入

P5/T005承接FR-KG-006/010/011，开头调研、affected/query标准补充轴及经stage-closeout的真实收口共同交给verify consumer；既有OCR、授权与最终close范围确认保持。首次产生AC-006与AC-011/012的verify子条件原件。

<a id="planning-entry"></a>

#### build-prd与build-plan阶段接入

P6/T006承接FR-KG-007/010/011，两个规划caller分别问职责/历史决定/教训，结论落现有PRD/spec/Phase。build-prd保两次正文调用与最终稿真实确认，在确认及实际授权范围内调用共享收口；父材料在用保具名例外。build-plan的计划确认不擅自变成Git授权或自动close调用。

<a id="implementation-entry"></a>

#### build-code阶段接入

P7/T007承接FR-KG-008，开头调研后仍在既有实施前入口用affected/explain/path定位再读文件；阶段本身保RED/GREEN、真实消费者和每Phase独立代码审查。查询只是发现入口，不能替测试或自动把计划当已实现。

<a id="graph-quality"></a>

#### P1修图与JSON的两个完整分支

P1先对六缺口逐项查因：49 external占位与唯一ArgumentParser、AST raw到build数字映射、旧24/当前未见label/id的去重或真实遗漏、JSON exclusion策略、关系边来源与节点定义的差别、仓库忽略路径与覆盖差异。数字不能把不同快照混用；每项before/after都绑定本次实际输入和操作。合法有边external占位不当孤儿删除，边关系证据不机械改成节点source_file。ArgumentParser当前已确认为extractor刻意生成的type annotation外部引用stub；它与49个external引用占位均不该伪造source或为了让RED出现而修坏。优先免费AST/正常缓存重放补修真实问题，图/manifest/cache保持一致；不能直接手改hash关联图或伪造缺失字段。孤儿例外只在证明完全不参与哈希对应时逐项说明；现49引用节点不满足孤儿删除条件。

查因结束的P1边界由原owner把JSON两条路径交用户：A保持图当前范围，所有契约/JSON问题直接读原文件，收益是零新增语义重抽，风险是这类问题没有图导航；B仅把用户选定的关键JSON按上游支持的正常抽取/缓存流程纳入，先列精确文件、预计数、输入字节、可得token估算来源/区间与不确定性，再问实际新增成本和范围，用户明确同意才实施。禁止配置/扩展上游或新本地extractor来绕过范围。上游确不支持时B如实unavailable、报告替代，不假装纳入。两条均需正常增量复放与相同六项对照，B另核关键JSON查询到原文；用户未答保持unknown并继续A所允许的直接阅读，不能把A写成用户已经选中或把JSON问题从需求删除。大规模重抽不在P1便宜修授权内。

### 全局文件边界与依赖

**NEW**：`skills/knowledge-graph/SKILL.md`、`skills/knowledge-graph/skill-bundle.json`、`skills/stage-closeout/SKILL.md`、`skills/stage-closeout/skill-bundle.json`、根 `.gitattributes`。四个测试 `tests/contract/knowledge-graph-quality.test.mjs`、`tests/contract/knowledge-graph-skill.test.mjs`、`tests/contract/stage-closeout-skill.test.mjs`、`tests/contract/knowledge-graph-stage-wiring.test.mjs` 属本build-plan预写并冻结的测试；实施不得修改，不把它们当新增生产能力。图质量测试允许真实原状通过，不能制造RED；其它新增技能/阶段接线测试按实际目标RED保存。独立spec/Phase/index属于当前规划材料，实际命令/原件进外置任务库。P1实施写集是外置 `quality/evidence/build-code/P1-graph-quality.md`；四项已预写测试都只作为冻结输入，Phase头不再授予修改测试权限，图payload仍按ADR-014单列。P7首先产出外置 `quality/evidence/P8-data-readiness.json` 与 `quality/evidence/P8-environment-readiness.json` 两份就绪件，保真实incomplete/unavailable；P8只引用并必要补充，不建新schema或门。P8仅新写外置 `quality/tests/P8-acceptance.md` 作为逐条结论；这是外置执行事实写集，不是生产路径或第二进度权威。

**MODIFY**：`skills/catalog.yaml`、`docs/architecture/move-map.json`、`graphify-out/.gitignore`、`workflows/make-decision/SKILL.md`、`workflows/make-decision/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/skill-deps.yaml`、`workflows/build-prd/SKILL.md`、`workflows/build-prd/skill-deps.yaml`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`。

图数据另列非源码已知改动：`graphify-out/graph.json`、`graphify-out/manifest.json`、`graphify-out/.graphify_analysis.json`及实际变化的具名`graphify-out/cache/semantic/<hash>.json`。每次仅列本次实际路径及文件数；缓存不得用目录/glob冒精确写集，不保存整树清单或快照。P1查因/正常重放前记录预期受影响路径；内容哈希新路径只有确定输入后生成，执行前由该owner点名。未确定路径保unknown，不授权任意graphify-out内容。图 .gitignore作为本次治理控制文件单独核，不让其规则检查替代知识载荷白名单。

**DO NOT TOUCH**：上述四个冻结测试在build-plan完成预写后对build-code一律冻结；上述实读保护表的全部文件、`CONSTITUTION.md`、`constitution-checklist.md`、`AGENTS.md`、`docs/standard-workflow.md`、`core/task-close.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/task/portable-workflow-run.mjs`、现有目标close/授权测试、`specs/archive/`内三历史任务的原始文件、原建图与review历史原件。整个runtime/core/tools生产模块为禁止能力边界，表中具名精确文件用于本任务实际依赖核对，不据未列路径新增能力。

| Phase / Task | 独立交付结果 | 真实依赖与下游consumer | 写者与并行 |
| --- | --- | --- | --- |
| P1/T001 | 图质量成因与允许补修结果 | 当前图/冻结测试→P2知识owner | 图质量owner；修图串行 |
| P2/T002 | 完整knowledge-graph方法与包装 | P1已判结果→五阶段及P3 | 知识owner；先写catalog并统一登记四个NEW技能文件和四个冻结测试的move-map |
| P3/T003 | 可独立消费的共享收口方法 | P2更新契约/登记→P5/P6 | 收口owner；后写catalog，只加closeout条目，消费P2实读交回 |
| P4/T004 | make-decision真实知识消费 | P2/P3稳定接口→阶段主会话 | 决策caller owner；本计划按P3后开展 |
| P5/T005 | verify-code真实图侧核对及共享收口 | P3/P4→独立验证主会话 | 验证caller owner |
| P6/T006 | build-prd/build-plan规划知识消费 | P4/P5已稳定阶段与收口事实→两个规划主会话 | 规划caller owner，同卡连续动作 |
| P7/T007 | build-code先查后读的实际开发 | P6完整计划→实施主会话 | 实施caller owner |
| P8/T008 | 全部13AC的真实逐条结论 | P1～P7首次原件→用户与后续verify-code | 独立验收owner；末行唯一全项验收 |

粒度按phase-template三问与S1～S4：P1诊断与便宜补修共同判同一图质量结果；P2四动作、存储与使用限制共同交给知识consumer；P3收口动作共同判同一方法；P4～P7由不同阶段真实产出独立判定，不能为减少Phase合并。P6两个caller共享规划知识消费判据，但须分别执行；P8是全项结论、输入为已验收固定原件而非等待其判定才成立的上游碎片。每Phase一个用户可感知Task，连续子动作不拆假独立票。

catalog是唯一跨Phase共享写路径：P2先登记knowledge，P3依赖P2交回的当前条目后再登记closeout。move-map由P2唯一持笔，登记两个技能正文/两个bundle及四个冻结测试的职责、owner、真实consumer、替代关系与删除/冻结条件；P3只消费其登记。其余caller文件各归唯一writer。重活子代理可在2～4并发区间做独立只读调研/目标测试/审查，但本任务八个交付的实际写批按上表串行，不同时改共享路径。

### 需求到任务追踪

| 来源 / 决定 | 原义、修订或过程边界 | FR / AC | Phase / Task / oracle | 处置与反向检查 |
| --- | --- | --- | --- | --- |
| R-001 / ADR-001 | 深入融入graphify，真实消费者使用 | FR-KG-002；AC-001/002/009 | P2/T002；P4～P7；ORACLE-P2-KNOWLEDGE-GRAPH | 现有普通阶段→知识发现；文件存在不算消费 |
| R-002 / ADR-002,M1 | 无图先建图再查图；文档先问 | FR-KG-005；AC-001 | P4/T004；ORACLE-KG-STAGE | 无图正例；未经许可文档抽取反例 |
| R-003 / ADR-002 | 已有图详细内部调研，取知识与经验 | FR-KG-002/005；AC-002/010 | P4/T004；ORACLE-KG-STAGE | 因果产出变化与无图独立读文件对照 |
| R-004 / ADR-003 | 两规划阶段用代码/架构/教训设计产出 | FR-KG-007；AC-004 | P6/T006；ORACLE-P6-PLANNING | 两caller分别实际产出；无图输入为反例 |
| R-005 / ADR-004 | 开发前查波及、实现、连接再精准读 | FR-KG-008；AC-005 | P7/T007；ORACLE-KG-STAGE | 真实先后；做完代码再补查不成立 |
| R-006 / ADR-005 | 图补充核实现范围与既有标准 | FR-KG-006；AC-006 | P5/T005；ORACLE-P5-VERIFY | 声明外调用/同类实现；图不能替OCR |
| R-007 / ADR-006,018 | 任务收口自动代码更新，文档按许可 | FR-KG-006/010；AC-006/011 | P3/T003、P5/T005；ORACLE-KG-P3 | 两层事实分别读；update0不证明文档 |
| R-008 / ADR-001,017 | 知识与上下文更精准 | FR-KG-009；AC-002/010 | P4/T004、P8/T008；ORACLE-P8-ALL-AC | 独立完整对照+真实用户判断，不以节点数替代 |
| R-009 / ADR-013 | 原更省修订为净消耗不劣化 | FR-KG-009；AC-008 | P4/T004、P8/T008；ORACLE-P8-ALL-AC | 同scope真实usage；缺usage不能用proxy判通过 |
| R-010 / 当前任务身份 | 先worktree、make-decision、不跳阶段 | FR-KG-004；AC-009 | 当前过程；P8/T008回读 | 过程来源而非新生产功能；不得改历史 |
| R-011 / ADR-002 | 与用户详细内外部研究 | FR-KG-005；AC-001/002 | P4/T004；ORACLE-KG-STAGE | 内部图调研不替外部来源及真实问答 |
| R-012 / make-decision确认 | 大纲先确认再逐模块 | FR-KG-004；AC-009 | 当前上游原件；P8/T008回读 | 已确认来源继承，不重开方向Talk |
| R-013 / M0～M7 | 扩散→需求→方案→验收逐模块 | FR-KG-004；AC-009 | 当前上游原件；P8/T008回读 | 保既有模块决定，不补造答复 |
| R-014 / 原始要求 | 大白话讲选项/后果/风险 | FR-KG-004/011；AC-003/011/012 | P4～P8；对应ORACLE | 问真实未决，不拿内部字段充解释 |
| R-015 / ADR-008,M5 | 重阅读/调研进子代理、主上下文少量结论 | FR-KG-002/009；AC-009/008 | P2/T002、P4～P8；对应ORACLE | 散文不进主上下文；不以摘要覆盖原件 |
| R-016 / 阶段审查规划 | 方向/细节各一次异源审查 | FR-KG-004；AC-009 | 历史原件只读；本build-plan一次合并review | 不为追空finding加轮，不重做已关上游 |
| R-017 / 原始追加 | 简洁直白中文 | FR-KG-004；AC-009 | 各Task输出 | 不用缩写隐藏风险和未完成 |
| R-018 / ADR-007 | 包含文档，specs历史档案最重要 | FR-KG-002/003；AC-002/007/010 | P2/T002、P4/T004；ORACLE-P2-KNOWLEDGE-GRAPH | 不为成本缩掉档案；原文不可只信label |
| R-019 / ADR-007,012 | 首次全量后只补改动 | FR-KG-003；AC-006/007 | P2/T002、P5/T005；对应ORACLE | manifest/内容哈希正常重放；防全量误触发 |
| R-020 / ADR-008 | 宿主子代理抽语义、不配通用后端 | FR-KG-002；AC-001/006 | P2/T002、P4/P5；对应ORACLE | 真实许可与宿主能力；不可用不换后端伪成功 |
| R-021 / ADR-006,018 | 每任务verify收口更新 | FR-KG-006/010；AC-006/011 | P5/T005；ORACLE-P5-VERIFY | 任务分支更新后随交付，不去main补一步 |
| R-022 / ADR-009 | graphify不可用如实继续 | FR-KG-004；AC-003 | P2/T002、P4/T004；对应ORACLE | 缺安装/失败/不可解析分别反例 |
| R-023 / ADR-010 | 不给steps加步骤 | FR-KG-004；AC-009/012 | 各caller；P8读回 | 五份原序列受保护，不造新节点 |
| R-024 / ADR-011 | 不使用自带经验记忆 | FR-KG-002；AC-007/009 | P2/T002；ORACLE-P2-KNOWLEDGE-GRAPH | 无save-result/reflect与第二账本 |
| R-025 / ADR-012 | 原仓库外固定图已被推翻 | FR-KG-003；AC-007 | P2/T002；ORACLE-P2-KNOWLEDGE-GRAPH | 原设想non-goal；实施项目内worktree图 |
| R-026 / ADR-008 | 首次全量文档另会话、主会话不承担 | FR-KG-002/009；AC-008 | 既有建图原件；P8/T008 | 不重复建图、不把cacheRead混新投入 |
| R-027 / ADR-016 | 五stage每个开工都做相应调研 | FR-KG-005/006/007/008；AC-009 | P4～P7；对应ORACLE | 开头与内部步骤并存，漏任一stage不成立 |
| R-028 / ADR-017 | 防装样子，历史结论改变产出 | FR-KG-002/009；AC-010 | P4/T004、P8/T008；ORACLE-P8-ALL-AC | 三正例不能声称没历史；不造路径反查评分器 |
| R-029 / ADR-018 | 统一完整收尾技能 | FR-KG-010/011；AC-011/012 | P3/T003、P5/P6；对应ORACLE | 单一方法、两真实caller，旧测试不是新调用证据 |
| R-030 / ADR-018 | 仅build-prd/verify人工确认后消费 | FR-KG-010/011；AC-011/012 | P5/T005、P6/T006；对应ORACLE | 依真实caller授权语义，不给其它阶段新增close调用 |
| M6/OI-006/OI-008 / 用户补定 | 六缺口成因+前后实测，便宜修而非手改图 | FR-KG-001；AC-KG-013 | P1/T001；ORACLE-P1-GRAPH-QUALITY | 未修诚实留影响；JSON决策在P1查因后，未答不扩面 |

Task级oracle接线如下，只把已有来源/FR/AC映射到实际命令owner，具体执行正文仍在各Phase：

| 来源与决定 | FR / AC | Phase / Task | 同义正反oracle | consumer / 条件 |
| --- | --- | --- | --- | --- |
| R-001、R-018、R-019；M6/OI-006/OI-008 | FR-KG-001；AC-KG-013、AC-008 | P1/T001 | ORACLE-P1-GRAPH-QUALITY | P2；真实逐项归因与合法占位反例 |
| R-001、R-018～R-025、R-027～R-028 | FR-KG-002、FR-KG-003、FR-KG-004、FR-KG-009；AC-001、AC-002、AC-003、AC-007、AC-008、AC-009、AC-010 | P2/T002 | ORACLE-P2-KNOWLEDGE-GRAPH | P3/五stage；注册与缓存正常/缺项反例，不替真实效果 |
| R-007、R-029、R-030 | FR-KG-006、FR-KG-010、FR-KG-011；AC-006、AC-011、AC-012 | P3/T003 | ORACLE-KG-P3 | P5/P6；共享方法实际消费与拒绝/HEAD反例 |
| R-002、R-003、R-011、R-027、R-028 | FR-KG-002、FR-KG-004、FR-KG-005、FR-KG-009；AC-001、AC-002、AC-003、AC-008、AC-009、AC-010 | P4/T004 | ORACLE-KG-STAGE | make-decision；真正无图/坏图与历史三正例 |
| R-006、R-007、R-021、R-027、R-029、R-030 | FR-KG-006、FR-KG-010、FR-KG-011；AC-006、AC-009、AC-011、AC-012 | P5/T005 | ORACLE-P5-VERIFY | verify-code；真实标准核对/收口与假文档更新反例 |
| R-004、R-027、R-029、R-030 | FR-KG-007、FR-KG-010、FR-KG-011；AC-004、AC-009、AC-011、AC-012 | P6/T006 | ORACLE-P6-PLANNING | 两规划caller；实际产出与无图/越权反例 |
| R-005、R-027 | FR-KG-008、FR-KG-002、FR-KG-004；AC-002、AC-003、AC-005、AC-009 | P7/T007 | ORACLE-KG-STAGE | build-code；先查后读与事后补查反例 |
| R-001～R-030；M6 | FR-KG-001、FR-KG-002、FR-KG-003、FR-KG-004、FR-KG-005、FR-KG-006、FR-KG-007、FR-KG-008、FR-KG-009、FR-KG-010、FR-KG-011；AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-KG-013 | P8/T008 | ORACLE-P8-ALL-AC | 用户/verify；逐条件消费首次原件与必要反例，不能由suite替真实效果 |

每 Task 可反查上表及其真实 consumer；P1新增测试只服务已经决定的图质量结果，P8只验全部承诺，不增加功能。正式运行事实与是否完成留 task facts，不把本表当执行状态。

<a id="cost-evidence"></a>

### 全局验证策略

技术最大重放集合由P8契约头给出，例如具名目标命令 `npx vitest run tests/contract/knowledge-graph-quality.test.mjs` 只验证其图数据子条件，不是全项验收。

本阶段预写并冻结四项具名测试，按真实结果区分目标RED、本来通过或环境失败。P1图质量基线本来通过时保真实通过，不制造RED；正常流程修图后沿同一oracle复验，并保护合法引用节点和关系来源的P2P反例。方法卡只有owned全部MD且无新增执行逻辑才可G-2，写具体风险、客观替代和独立完整方法复放；全任务因图/ignore/attribute/deps/config混合交付仍保P8。修改冻结assertion须原Phase TCR和独立审查，不能静默削弱。

三历史任务：`specs/archive/design-execution-efficiency-20261014/`、`specs/archive/requirements-completeness-audit-20260804/`、`specs/archive/governance-runtime-execution-chain-20260827/`。每个从当时原始需求独立启动有图甲/无图乙；乙在c5c5bdb8真实无图基线或临时物理移走图的隔离树，禁止同有图树里装作无图。六次调研前先估可得成本并告知用户；本任务主会话不吞全文。成对记录与比较存外置任务库`quality/evidence/graph-value-ab/`，用户判断哪份对接着做任务有帮助，不立新分数门。

历史经验确实改变本次设计：作者实际读 `specs/archive/workflowhub-delivery-flow-quality-v1/spec.md:268` 的FR-COST-001与 `specs/archive/skills-framework-redesign-20261014/decision-log.md:661–684` 的D-013后，成本方案改为input/output/cacheRead分列、可得读量/调用/墙钟只作替代观察，缺usage明确unknown。旧建图原件沿`quality/evidence/decision-log-refs/research.md` I-004和`graphify-semantic-cost-report.md`，不复制研究原件。第一次建图输入49,608,703、输出4,026,015、cacheRead154,290,304各列；53,634,718只为input+output，不能混总成本或把cacheRead当免费。历史benchmark约1,650只是估计，不是实测token调用usage。

AC-008(c)在P4得到真实paired trace/usage，P8用相同scope、输入、完成条件、允许工具与完整五stage旅程比较有/无图。全成本包括宿主主/子代理、查询消费、文档增量与必要重试；历史一次性建图单列已发生投入，不为凑非劣化任意排除本次新增成本，cacheRead同口径分列。宿主不给完整usage时仅列真实bytes/calls/elapsed及unknown，不能换算出token或宣布不劣化。不能挑简单任务、删反例、把五stage局部通过当完整旅程。数据/环境就绪原件与验收固定13项由P8卡安排，首次结论按P1～P7承接条件产生，P8一次消费并补必要未闭环case。

<a id="acceptance"></a>

## Appendix A — 验收判据（唯一权威）

以下每条保上游同号承诺。判定方式、时点、执行owner与输入是该AC的一部分；技术子条件与整体效果都满足才可判该AC通过。证据声明是预期类型/原件位置，不表示已经执行。

- [ ] **AC-001**：无图先建再查（FR-KG-002/005）

验证：机器可判的建图/查询顺序与只能人读的宿主方法消费共同判断；P4独立执行者在真实无图项目运行make-decision，提供真实需求、工具与耗时/退出原件；自动建立代码图，文档缺失时按M1告知预计份数与成本并取得真实答复，获许可后由宿主子代理抽取，之后查图再按定位读原文。P4首次判断，P8补真实旅程条件。
通过：正常获许可的正例确有先建图再查图的命令与耗时原件；文档许可/真实来源与阶段产出可回读，不直接读完文件后补查询。未许可或工具不可用只按AC-003降级，不当本正例已通过。
失败：图未建就声称完成、直接广泛阅读后补查询、未经文档许可抽取、伪造原件或以示例代真实宿主执行。
证据：P4的唯一命令原件、宿主执行trace、实际调研与decision产出、文档真实答复；任务库quality/tests和现有research原件，P8引用同份来源。

- [ ] **AC-002**：图结论实际改变产出（FR-KG-002/005/009）

验证：只能人读；P4独立研究者在已有图项目用真实需求产生至少一例图结论→决定/PRD范围/Phase切分/代码改变，另一独立上下文按无图基线读文件对照；比较者读完整实际材料，用户判断该案例是否有助接续。不能事后补跑查询制造因果。
通过：能指名一条具体图结论和产出中被它改变的具体内容，且有独立读文件的对照及可回读比较；技术送达、单个query记录或文件路径出现不能代替效果。
失败：只有查询调用没有产出变化、产出已定才补查询、无独立读文件对照、把语义label当原文或以source路径存在判有用。
证据：quality/evidence/graph-value-ab/中的成对完整产出与比较原件、实际用户判断来源及被改变产出的稳定节引用；只保唯一原件。

- [ ] **AC-003**：不可用如实降级且继续（FR-KG-004）

验证：机器可判的受控反例加独立人读；P2/P4执行者分别制造未安装、命令失败、输出不可解析三种情形，读取真实错误与后续普通阅读/阶段工作记录；另区分无匹配、歧义、update无变化等正常事实。
通过：三种不可用分别有unavailable与具体原因，安全阶段工作实际继续；真实无匹配/歧义/无变化不被伪装为更新、失败或质量通过。
失败：卡死流程、静默吞错、降级说成功、只测试一种情形便外推全部，或exit0被当作知识已消费。
证据：具名受控输入与原始命令/退出、后续工作读回；P2/P4quality/tests唯一原件及阶段事实引用，限制受控反例不证明外部平台健康。

- [ ] **AC-004**：两规划阶段实际消费（FR-KG-007）

验证：只能人读；P6独立宿主分别实际调用build-prd与build-plan，以同类真实项目输入完成相应产出，读三个领域问题的结论与PRD范围/全局spec/Phase对应；用户/已授权任务主会话提供真实来源，P8补缺实际输入。
通过：两个阶段各有实际图输入及产出落点，范围/Phase可追溯到具体知识结论且已回真实原文；只把结论落现有材料，不额外存查询日志。
失败：任一caller只有方法文本、没有实际图输入、结论与规划无关，或把图替代当前spec/Phase读取。
证据：两阶段实际宿主trace与完整产出、独立人读对照，精确引用所属原件；不把static fixture产出当真实业务效果。

- [ ] **AC-005**：实施先查再读（FR-KG-008）

验证：机器可判先后与只能人读的实际消费；P7未参与方法实现的执行者在真实build-code Phase用affected/explain/path按真实适用问题定位，再读文件并实施，提供时序trace；无匹配/歧义/目标不存在另有受控负例。
通过：至少一个真实开发Phase有先查知识图谱再精准读文件的实际先后原件，改动能指名承接的结论；不适用步骤如实有源说明。
失败：先广泛读文件/写完代码再补查询、只有字符串或假trace、无查询且无真实降级原因，或把未匹配说成已完成调查。
证据：P7实际执行trace、查询消费摘要落点、代码/Phase原件与独立复验；不新增散文查询日志。

- [ ] **AC-006**：验证与两层更新分报（FR-KG-006/010）

验证：机器可判的更新命令与只能人读的标准核对；P5独立宿主实际运行verify-code，affected核声明外影响、query核同类约定；在任务worktree调用共享收口→知识owner更新代码并按M1真实答复处理文档，读回两个结果。
通过：标准核对有实际图消费，代码图真实已更新/无变化/失败与exit各自相符，文档已更新/未更新及原因独立报告；文档未许可不假称已更新。代码/文档实际未闭环则该适用效果保未达成。
失败：只跑update即声称文档已更新、在main额外补图、图替代独立审查或测试、忽略真实退出或未更新影响。
证据：P5宿主trace、两层更新原始执行/答复与产物读回、验证产出；P3共享方法复放只支撑方法子条件，不替此真实caller执行。

- [ ] **AC-007**：图知识载荷提交范围（FR-KG-003）

验证：机器可判；P2执行者在认证worktree运行git status --porcelain与git check-ignore，作用域仅graphify-out内，分别读应跟踪知识载荷与可重建物；P8读实际Git交付结果。治理控制文件graphify-out/.gitignore自身沿声明写集另核，不当知识载荷或新知识数据种类。
通过：目录内知识数据被跟踪的恰好是graph.json、manifest.json、.graphify_analysis.json、cache/semantic中的实际条目；cache/ast、cache/stat-index.json、.graphify_ast.json、.graphify_chunk_*.json、GRAPH_REPORT.md全部被忽略。图外改动不由此条判，图变化另列实际路径/文件数。
失败：应跟踪知识载荷缺失、含任一应忽略产物、把graphify-out外越界塞进图单列项、只验ignore但没有真实交付读回。
证据：P2/P8具名命令原件与真实Git状态/提交引用；只写变化路径+必要hash，不造树快照、tar或全树清单。

- [ ] **AC-008**：可复现成本与真实净消耗不劣化（FR-KG-009）

验证：机器可判的数据读取加只能人读的scope对照；(a)回读首次建图真实usage原件，(b)回读单次查图实际调用/消费成本与计量口径，(c)P4提供paired trace/usage、P8独立执行完整五阶段同scope有/无图真实任务旅程，以input/output/cacheRead分列核本次净消耗。真实输入由用户/已授权任务主会话提供，不能挑简单例或排除反例；usage不足保unknown。
通过：三项各有可复现数字与范围，(c)完整真实任务净消耗不劣化；历史53,634,718建图input+output与cacheRead分开，benchmark约1,650 token/问的估计与实测区别明示，不把bytes/calls/elapsed代理量冒token。
失败：只给形容词或数字无原件、拿427.2x整库通读基线当收益、把估计当实测、漏主/子代理/增量抽取/必要重试导致scope不可比、真实净消耗劣化，或缺usage仍判不劣化。
证据：既有research/graphify-semantic-cost-report的原件引用、P4成对执行trace与可得usage、P8同scope完整旅程usage和比较；不复制旧raw，缺计量字段逐项标unknown及provider。

- [ ] **AC-009**：五阶段开工调研影响产出（FR-KG-004/005/006/007/008）

验证：只能人读，技术时序由trace辅助；P4～P7分别产生make-decision、verify-code、build-prd、build-plan、build-code的实际开工调研与完整阶段产出；P8独立读者按五阶段逐项核结论及落点，开头调研与原内部步骤均消费。
通过：五个阶段每个开工时都实际基于知识图谱调研，产出里能找到相应结论并指名落点；真实不可用按AC-003另记，不用可读字段或命令计数代替阶段效果。
失败：任一stage无实际调研、调研与产出无关联、只新增开头而删掉内部消费，或把路径元数据反查冒成防装样子的新验收。
证据：五个实际阶段的完整产出和同次执行trace、独立比较者逐项人读结论；P8引用首次原件，缺真实输入的阶段仍未完成。

- [ ] **AC-010**：三历史正例确有经验改变产出（FR-KG-002/009）

验证：只能人读且需用户判断；P4按全局验证策略对指定三个历史任务做忠实有/无图对照，独立研究者与独立比较者读当时原始需求和完整实际结果；用户判断其对接着做任务的帮助。一般任务可合法无历史，不取消本条指定正例的要求。
通过：三个任务每个至少一条来自归档历史的真实结论，并指名改变本次产出的具体处；乙物理无图、甲真实查图，来源意译已回原文核实，且独立比较与用户判断实际发生。
失败：任一指定正例称「本次无历史经验可挖」、声称有结论却无产出改变、同有图树装作无图、只靠query路径或结论自述、由执行者本人充当独立判定者。
证据：quality/evidence/graph-value-ab下三个成对调研与独立比较唯一原件、原始需求定位和用户真实判断引用；不立量化评分门。

- [ ] **AC-011**：两caller实际共享收口（FR-KG-010/011）

验证：只能人读的完整方法消费与机器可判Git结果共同判断；P3独立复放共享方法，P5/P6分别实际经verify-code/build-prd在相应真实人工选择与授权之后调用stage-closeout；两caller保质量/facts/handoff并只引用共享收口方法，原来两套方法正文已抽走。
通过：两处都真实经共享技能完成其授权范围的收口，含图更新委派与真实状态读回；build-prd稿件确认不冒Git授权，后续仍消费父材料的保留例外明确；没有两处独立收口实现。
失败：仅一caller可用、只留链接未消费、两处仍各一套实现、用户未确认的不可逆范围被执行、把受控临时repo成功冒真实交付，或无授权/未完成仍声称全部收口。
证据：P3完整方法复放、P5/P6实际宿主trace/真实回复/逐项结果与caller文本对照；旧测试全绿不构成新共享路径已调用证据。

- [ ] **AC-012**：授权核对与新路径均保真（FR-KG-011）

验证：机器可判；P3/P5/P6独立执行者重跑具名既有close/授权定向测试，并在临时repo及实际授权内caller路径观察record/consume、动作/分支/HEAD核对与真实新路径调用。普通非scoped授权HEAD漂移仍拒旧记录；既有build-code scoped commit复用例外按原实现保留，不误改它以凑断言。
通过：受影响针对性测试全部通过，动作/分支/HEAD保护、最终close一次范围确认和具名例外均保持；两处收口确走共享技能有实际证据。真实失败原件与缺scope/未知字节保持可见。
失败：任一目标测试失败、授权行为扩大或削弱、HEAD保护被跳过、恢复旧close plan/新状态，或只有旧测试通过却无法证明两caller共享消费。
证据：具名测试执行raw/机器报告、HEAD/分支反例、临时repo实际共享方法与P5/P6真实caller执行原件；独立复验者与修复者上下文区别明示。

- [ ] **AC-KG-013**：六缺口查因与真实前后结果（FR-KG-001）

验证：机器可判的冻结测试和实测读数与只能人读的成因说明共同判断；P1 owner对六项逐项取同次输入下的before/after：无来源节点类型/ArgumentParser、AST raw→build计数映射、语义抽取未见label/id及去重/遗漏、JSON主动排除策略、关系边来源不等节点定义、repo忽略路径造成的覆盖差异。JSON扩面选择在查因后由用户作真实决定，重抽先给范围/成本再问。
通过：六项每项都有可回读成因、真实改前/改后数及操作；可正常流程便宜补的已补，真实无法修的明确未修与影响不冒已修。49个external占位的合法语义和边证据来源保持，不伪造source、不把它们当孤儿删；ArgumentParser保真实外部stub来源语义，不伪造定义文件；图/manifest/cache一致性经正常重放验证。JSON未决明确owner/时点/两路径，不擅自扩面。
失败：只有报告无逐项实测、混不同图快照计数、将label合并/去重直接说知识丢失、机械改所有关系source_file、删除合法external或伪造来源、手改hash关联图、未许可扩大重抽，或把修不了写成已修。
证据：P1冻结tests/contract/knowledge-graph-quality.test.mjs的真实基线/复验及正常、反向原件（本来通过不造RED）、六项成因与before/after实际命令输出引用、用户JSON/额外成本答复（如适用）；不复制图或整目录作为证据。

## 12. 风险、未决与交接

| 风险/未决 | 影响、owner与处理时点 | 缓解、停止与恢复 |
| --- | --- | --- |
| RISK-001 方法装样子/图误读 | FR-KG-002/005～009；各caller与独立验收者，P4～P8 | 完整真实产出因果对照；三指定正例不能以无历史逃避；source_file回原文，语义label不当引用 |
| RISK-002 成本劣化或usage缺失 | FR-KG-009/AC-008；P4/P8、宿主usage提供者与用户 | 同scope计量；缺字段保unknown；真实劣化按ADR-013披露窄用法替代，不能自行改已定目标 |
| RISK-003 抽取失配/误修 | FR-KG-001/003；P1/P2 | 正常AST/缓存重放，冻结测试及external/关系来源反例；大额重抽停该路径先估问，不上游改工具 |
| RISK-004 合并/清理遗失图或私有字节 | FR-KG-003/010/011；P2/P3及实际close主会话 | 并集不可靠处理同ID双改/删除；读原文后正常更新；只清本次具名可再生项，ignored_unknown具名保管 |
| RISK-005 授权或父材料边界回归 | FR-KG-010/011；P3/P5/P6 | 只抽方法，复用现有授权/窄工具；稿件确认与Git分离；父材料在用作具名例外；最终close一次真实范围确认 |
| OPEN-001 M6正式结果及JSON选择 | PFACT-004；P1 owner，JSON选择用户；P1六项查因完成边界 | 给A/B完整路径、成本与影响；未答不默认，继续已定直接读JSON与其它安全部分 |
| OPEN-002 真实任务及完整usage/用户判断 | PFACT-005；用户/已授权任务主会话提供输入，P4/P8取得 | 确认计划前披露每条缺条件；真实条件何时可得就何时执行，不整批延期，缺项不判通过 |
| OPEN-003 graph-only载荷与ignore自身控制文件 | P2 owner，P2包装核对时 | AC-007知识数据白名单与`.gitignore`治理写集分别读回，禁止借此增加其它数据类型；独立审查若发现语义歧义回原作者处置 |

本阶段没有未定产品方向，Clarify十维由主会话记录trigger=false；JSON查因后选择与真实任务输入是上游已经安排的具体时点/owner，不伪装成当前新方向问题。计划确认前须逐项展示仍无法闭环的真实用户效果、usage与文档成本输入。阶段handoff保已决定、已完成且验证、未完成、证据位置四类来源与下一步；本spec草稿不能充作实施或验收完成。

## 13. 业务影响与回归范围

主要影响是五stage的实际工作顺序、两caller收口方法与图知识载荷提交。回归守住既有阶段材料读取、真实问答、文档语义抽取许可、OCR/wh-review职责、授权核对、普通Git与安全清理、父/兄弟材料消费边界。受影响目标测试按各Phase点名执行，不跑无范围全量测试。独立审查、实际方法复放、真实用户效果、Git交付和物理close分别报告；任何一项缺失不由另一项代填。

## 补充材料

实际原件均在外置任务库 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/graphify-knowledge-integration-20261015/`：requirement-index、research、graphify-semantic-cost-report与graph-quality-ruling沿decision-log的外置事实索引到达条件读取，不复制到spec。阶段与测试规则沿当前 `workflows/build-plan/SKILL.md`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md` 及其模板；本文件只承接本任务行为与工程选择。
