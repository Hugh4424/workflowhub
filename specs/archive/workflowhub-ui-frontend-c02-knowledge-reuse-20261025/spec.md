# 功能规格：知识检索与规范复用

读者：知识方法维护者、规范原 owner、实施者和独立验收者。读完可定位原始需求、用户旅程、工程边界及唯一验收判据。

- **确认边界**：用户已对当前展示材料选择“记录缺口与负责人后确认并收口”，并另答“同意5项迁移及1项条件变更”；分别见[计划答复][plan-confirm]、[测试迁移答复][test-confirm]及[展示范围][confirm-scope]。本轮只准确登记授权并收口停止，不开始build-code、不修改生产或旧测试、不执行Git；业务验收仍not_run，执行事实仍归task facts。
- **来源**：[当前决定][decision]、[母 PRD 的 C02 / S1–S7][prd]、[完整用户答复][u]。领域决定沿 [decision 的“领域术语变更”][domain-decision]：ADR `not-needed`，不制造 ADR 编号；母决策 D 编号仅保历史来源。
- **当前写作边界**：产品行为按确认语义翻译；工程原件005/006/007/008/011和独立预写RED009已消费，计划为4个独立Phase、6张Task卡。本轮审查及核对事实回[审查处置][review-dispositions]，真实确认范围如上；未测行为、物理隔离及工具覆盖限制保原owner和缺口，不把确认冒产品验收或未来实施已经发生。

## 材料导航

| 章节 | 内容 | 何时读取 |
| --- | --- | --- |
| 需求解释、场景与功能需求 | 用户结果、正常与失败分支 | 理解产品范围时 |
| 来源与决策映射 | 原件中的来源身份与取舍 | 核来源、数量与边界时 |
| 测试标准／验收对象 | 测试面及输入安排 | 准备验证和独立判定前 |
| 实现设计（全局权威） | 接口、完整写集、依赖与追踪 | 实施分工前 |
| Appendix A | 唯一 AC 条件、判定时点及证据 | 每次逐条验收时 |
| 风险、未决与交接 | 缺口、负责人和恢复条件 | 遇失败或交接时 |

## 速读卡（30 秒）

让新任务查到适用知识，并把实际验证出的经验写回正确规范，让下一项真实工作用到它。
检索入口复用现知识图技能；规范同步是独立方法；初始化扩为五类规范。
两笔真实工作按 catalog 版本欠账→Improvements 判重顺序执行；PaperBuilder 只做规范与索引。
规范正文、任务事实、索引各有唯一 owner；未知许可和未经验证内容不会变成全局规则。
保存成功、命令退出零、结构测试通过，都不能单独证明真实复用。

## 来源与决策映射

来源编号必须连同原件理解：下文 `V3 R-…` 专指[需求索引 v3][v3]对应标题；`DEC R-…` 专指[当前决定“原始需求”][decision]表。两者部分同号异义，不合并。`U-…` 一律回[完整答复][u]对应标题。`PRD-…` 是本规格给母 PRD 稳定章节的引用别名，不改原编号。全部新 FR/AC 使用 KR 单段域；AC-KR-001～007 一对一承接当前决定验收面 AC-C02-1～7，后者是上游原号，不是本规格第二验收正文。

| 来源原件与锚 | 继承决定 | FR／AC | source_status／范围 | 交接 |
| --- | --- | --- | --- | --- |
| V3 R-001～005、R-023；PRD-C02 字段1～6 | 当前决定 WP1、WP2、WP4、WP5 | FR-KR-001～006、008～011／全部 AC | current；检索到再用 | 工程追踪逐项展开 |
| V3 R-006～009、R-016；PRD-S4 | U-002、007、012；共享 writer 串行 | FR-KR-004～010／003、005～007 | current；真实消费与所有权 | 不等待 C05/C09 |
| V3 R-010～015、R-017～018、R-024～025；PRD-S1/S2/S3/S7 | WP1/WP5；母 D-002/010/011 只作来源 | FR-KR-001～003、007、011／001、002、004、006 | current；有据复用和维护 | 非目标见第10节 |
| V3 R-019～022；DEC R-011；U-007～012、014、019 | WP2/WP3/WP4；C08 边界按 U-007 覆盖 | FR-KR-004～010／003、005～007 | current；五类规范与自动同步 | 候选概念退役 |
| U-003、004、013、017 | WP1/WP5 | FR-KR-001、002、011／001、002、004 | current；只重写方法，两处读取 | unknown 不是复制或同步许可 |
| U-015 | WP3 | FR-KR-007／006 | current；初始化改名 | 冻结测试迁移另列待真人答复 |
| U-016、018 | WP4 | FR-KR-010／003、005、006 | current；PaperBuilder 规范与索引 | 文件实施允许；Git 待用户确认 |
| PRD-S4 第7条、PRD-S6 | 保留适用原始事件要求 | FR-KR-012／003、005 | current；从首次真实执行采集 | 未测人工时间保持 unknown |
| U-001、006 | 复杂路线与已确认骨架 | 全部 FR／AC | current；规划组织 | 不等于本计划确认 |
| U-005 | 被 U-007 覆盖 | FR-KR-004、006／005 | non-goal；不再存独立候选 | 原答复留历史原件 |

## 1. 需求解释：问题与紧迫性

设计、开发与维护任务需要的不是搜索链接，而是能说明“为何适用、何时不适用”的依据。只保存经验会让下一任务继续凭记忆行动；把搜索命中直接当规范又会污染后续任务。当前真实欠账提供了检验闭环的机会，不必虚造页面或另等兄弟卡。

本卡把查询、原文核对、适用判断、真实使用、验证、规范回写和后续消费连起来。产品目标仍由[母 PRD US02 / C02][prd]持有，范围扩展的理由仍由[当前决定 WP1～WP5][decision]持有，本规格只翻译其行为与设计。

## 2. 背景、目标与范围

### 背景

已有知识图方法、规范初始化、阶段反思、规范源及记录底座可复用。旧图或旧经验只能引路，结论须回当前原文；旧方向中候选保存、C08 独占晋升与本次真实 U-007 冲突的部分，以[答复原件][u]及[澄清原件][clarify]为准。

### 目标

任务作者得到有来源和适用边界的依据；规范维护者获得可追溯、可撤回的条款变更；下一任务能定位新版条款并说明它改变了哪项真实产出。验收只按 Appendix A，不由文件数量或工具标签推导。

### 范围内

知识方法两处读取入口、规范同步四处收口调用、五类规范初始化及索引、两笔具名 WorkflowHub 维护任务、PaperBuilder 规范与索引更新、外部内容权利与查新、适用原始事件采集。具体文件与接口归实现设计；当前 build-plan 不执行这些生产改动。

## 3. 用户场景与状态覆盖

### SCN-001：新任务找到可采用依据

设计/开发者带真实任务问题，在 make-decision 开工或 build-plan 设计准备调用检索。执行者按来源类别查找、读取原文并比较；项目规范、案例、业务知识与已验证经验保身份。任务材料以“支持／需上下文／冲突／证据不足”描述适用性，再记录采用／不用／待补证、理由、适用范围、冲突和采用位置；四判不是新 task 状态。已有组件/布局知识仍在查询来源内，C03 的 API/映射整理不由本卡接管。回写修复时注明受影响 case 与原因，验收指 AC-KR-001。

### SCN-002：查询不足或来源互相矛盾

同一执行者遇无结果、过期、单源、冲突、未知许可或真实查询失败，保查询输入、原失败、影响与可执行补证动作。过期图回原文；单源注明“单源，未独立”，不能伪造交叉核对。资料合法性、语义有效性和 CLI exit 分开判断。验收指 AC-KR-002、AC-KR-004。

### SCN-003：阶段收口同步已验证变化

规范 owner 接收任务已验证结果，核独立来源、可回读证据、无未解冲突及适用范围，然后定位唯一专业源，保旧/新条款和理由，写 delta、规范及索引，读回真实消费者；只有完成对应迁入后才关闭经验文件的该条。仅当前任务适用的观察留任务局部说明。验收指 AC-KR-005、AC-KR-007。

### SCN-004：同步中断、重复或竞争写入

同一事实再次触发时复用任务＋条款 ID，核当前内容而非再追加。中途失败保原件和已完成的实际写入事实；逐文件恢复旧有效内容或完成该次更新，不能把单文件原子替换称多文件事务。不同 task 写同一项目规范须交同一个文件 writer 串行；任务记录锁不等于跨 task 项目锁。验收指 AC-KR-007。

### SCN-005：初始化后找到五类正确权威

维护者用 project-norm-init 定位设计、前端、后端、接口、验收来源；缺同职责实质源时才创建必要最小正文和导航。AGENTS 索引说明用途、读取时机、owner/consumer 与最后更新。已有专业源保留；WorkflowHub设计/前端不是整类不适用：AGENTS分别导航现有设计/前端方法与answer-as-page离线页面合同/模板，真实consumer为阶段页面caller和renderer；不因本卡不改HTML而删除两类，也不新造页面规范。PaperBuilder验收导航复用已有质量治理权威。验收指 AC-KR-006。

### SCN-006：catalog 欠账产出新条款，Improvements 真实采用

生产任务核七笔已存在的版本欠账，记录真实版本或具名不可得，经独立验证形成外部版本/许可证据条款。消费任务从自己的判重/状态核对需求出发，查询并读到该条款，应用到真实旧条目，输出可定位的采用变化，再形成旧经验退役规则。两个需求和结果分别具名，不把同任务重跑当第二任务。验收指 AC-KR-003、AC-KR-005。

### SCN-007：PaperBuilder 原 owner 更新规范而非页面

实施阶段的规范 owner 读取现有设计/前端内容和原权威，用可验证变化更新规范及索引，再由独立读取者核适用性。文件修改沿 U-018 已有授权；Git 提交仍等用户真实确认。只读 build-plan 不改 PaperBuilder，浏览器页面效果不在本次承诺内。验收指 AC-KR-005、AC-KR-006；与[冻结手工单元][manual]逐项比较。

### SCN-008：维护者查新并保查询失败

知识方法 owner 在采用前、迭代能力或维护计划到期时沿现有入口查固定版本与可用更新/更优候选，保旧新差异、适用性及采用/不用理由。一次真实查询和比较与一次具名受控失败分别留证；查询失败不能说“无更新”，不自动追 HEAD。验收指 AC-KR-004。

### 状态覆盖清单

- 默认：SCN-001、003、005、006；合法来源与实际消费者可追溯。
- 空：SCN-002 无结果；留缺口，不生成内容凑数。
- 错误：SCN-002 查询失败；SCN-004 部分写入或索引不一致。
- 加载：CLI/agent 查询等待按真实命令事实记录，无页面加载视图。
- 取消：SCN-004 保已发生副作用与未完成文件，停止后续写入，恢复只动本次条款。
- 边界：SCN-002 同名异义、过期；SCN-003 局部观察不晋升全局。
- 权限：SCN-002/007/008 区分阅读、复制、规范写入、Git 授权。
- 竞态：SCN-004 同文件单一 writer；不同字段仍属共享写。
- 重复操作与部分成功／结果未知：SCN-004 保实际状态，不虚报整批回退或成功。
- UI viewport/键盘/视觉：本轮不作页面承诺；是否适用须在测试标准用三源真实库存核定，不能只据任务名称免除。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：状态 `verified`。证据：[完整答复 U-001～019][u]及[当前决定 WP1～WP5][decision]已确认五类、两项目、直接同步及两笔真实需求。关联 FR-KR-001～012、全部 AC。
- **PFACT-002**：状态 `verified`。证据：[U-016/U-018][u]及[手工单元][manual]明确 PaperBuilder 文件实施与 Git 提交分开；本轮只规划。关联 FR-KR-010、AC-KR-005、AC-KR-006。
- **PFACT-003**：状态 `verified`。证据：[工程006][eng] §2～5及本作者对record-lock/safe-write/task-handle、旧reflection、PB质量入口的实读；task锁固定任务根、safe-write单文件rename，PB已有质量权威。关联 FR-KR-004～010、AC-KR-003、AC-KR-005～007。这只证现接口/库存，不证明未来同步效果。
- **PFACT-004**：状态 `verified`。证据：[母 PRD S3/S4/S6][prd]要求本卡验一次查新比较与查询失败，并从首次执行采集适用事件。关联 FR-KR-011/012、AC-KR-003、AC-KR-004、AC-KR-005。
- **PFACT-005**：状态 `verified`。证据：[验证009][red]及本作者实读新test和三组原回执/output：三个目标各exit1、1 failed/2 skipped，正常收集并命中缺生产接线断言。关联 FR-KR-001/004/007、AC-KR-001、AC-KR-005、AC-KR-006；只证RED，不证GREEN或语义。
- **PFACT-006**：状态 `unknown`。owner＝后续实施派发主会话；实现者只读/隐藏测试的物理隔离未建立，关联 FR-KR-001～012、AC-KR-001～007、OPEN-02/RISK-05。当前文件可写不冒物理保护，实施前应核实际权限并保失败限制。

## 5. 功能需求

以下 FR 的来源身份按“来源与决策映射”解释；首次写作仅翻译已确认语义；计划已按顶部真实答复确认，本轮只收口。

- **FR-KR-001**：两处入口按真实任务自动检索合法项目规范、案例、业务知识、已验证经验，读取全文而非只交链接。关联 PFACT-001、SCN-001、AC-KR-001；来源 V3 R-001/R-002/R-004a、U-004/U-013；source_status=current。
- **FR-KR-002**：比较、抽模式、推荐；输出采用/不用/待补证、来源与版本、上下文/范围/反例/冲突；按主题＋条款＋来源去重，单源不冒独立。关联 PFACT-001、SCN-001/SCN-002、AC-KR-001/AC-KR-002；来源 V3 R-002/R-003/R-023；source_status=current。
- **FR-KR-003**：无结果、过期、冲突、单源、未知许可及查询失败保原因/影响；图失败回原文，未知不改成事实。关联 PFACT-001、SCN-002、AC-KR-002；来源 V3 R-005b/R-011、DEC R-008；source_status=current。
- **FR-KR-004**：阶段收口核已验证条件，将变化写到唯一适用规范，保 delta、来源、范围/反例及 supersede；局部观察仍留局部。关联 PFACT-001/PFACT-003、SCN-003、AC-KR-005/AC-KR-007；来源 U-007/U-011/U-014/U-019、V3 R-004b/R-019；source_status=current。
- **FR-KR-005**：逐文件串行、同任务条款幂等；冲突/无目标/证据不足/许可未知不写；取消/半完成真实可恢复，不宣称跨文件事务。关联 PFACT-003、SCN-004、AC-KR-007；来源当前决定 WP2、U-007/U-014；source_status=current。
- **FR-KR-006**：同步后核 AGENTS 索引与真实文件用途一致，只清对应已迁条目；旧 writer 改向，历史原件保留。关联 PFACT-001/PFACT-003、SCN-003/SCN-005、AC-KR-005/AC-KR-006；来源 U-007/U-009、V3 R-018/R-021；source_status=current。
- **FR-KR-007**：初始化改名 project-norm-init，保旧八类职责及当前 consumer；两项目五类均有有源导航，WH设计/前端沿现方法及离线HTML合同的实际consumer读取，不整类N/A；新增三类按真实需要最小正文/导航/模板，复用等价权威。关联 PFACT-001/PFACT-003、SCN-005、AC-KR-006；来源 U-008/U-010/U-012/U-015、PRD-S2；source_status=current。
- **FR-KR-008**：catalog 生产任务核真实七笔欠账并独立验证，产出具名外部证据条款。关联 PFACT-001/PFACT-003、SCN-006、AC-KR-003/AC-KR-005；来源 U-002、当前决定 WP4 第1项；source_status=current。
- **FR-KR-009**：Improvements 消费任务查询并实际采用生产条款，逐条判重/状态核对，形成旧经验退役规范。关联 PFACT-001/PFACT-003、SCN-006、AC-KR-003/AC-KR-005；来源 U-002/U-007/U-012、当前决定 WP4 第2项；source_status=current。
- **FR-KR-010**：PaperBuilder 保已有专业源，补适用三类与索引并完成一次设计/前端规范更新；本轮不实施，后续文件允许、Git 待用户确认。关联 PFACT-001/PFACT-002/PFACT-003、SCN-007、AC-KR-005/AC-KR-006；来源 U-010/U-016/U-018、当前决定 WP4 第3项；source_status=current。
- **FR-KR-011**：逐项处置外部候选、固定源/许可/适配/维护/consumer；只重写 design-wiki 方法；执行一次查新比较和失败反例。关联 PFACT-001/PFACT-004、SCN-008、AC-KR-004；来源 V3 R-004d/R-010/R-015/R-017/R-018/R-024/R-025、U-003/U-017、PRD-S3；source_status=current。
- **FR-KR-012**：从首次真实执行记录适用返工/缺陷/人工时间/验收往返事件，无法取得保持 unknown；不把无页面指标填成功。关联 PFACT-001/PFACT-004、SCN-006/SCN-007、AC-KR-003/AC-KR-005；来源 PRD-S4 第7条/PRD-S6；source_status=current。

## 6. 模块划分

| 职责 | 输入→输出 | 真实消费者 | 依赖 |
| --- | --- | --- | --- |
| 任务依据 | 任务问题/合法原文→适用判断及采用定位 | make-decision/build-plan、两笔维护任务 | 现知识图与原文读取 |
| 规范同步 | 已验证事实→唯一条款/delta/索引读回 | 专业 owner、后续任务 | 规范路由与既有 I/O |
| 规范初始化 | 项目现状/已有权威→适用规范导航 | 通用 agent、专业任务 | 已有八类职责与真实库存 |
| 真实复用 | catalog 证据→新条款→Improvements 产出 | 维护者与下一任务 | 检索、同步及规范入口 |
| 权利与维护 | 固定源/更新查询→采用理由或缺口 | 知识方法 owner | 合法外部/仓内原件 |

## 7. 关键实体

**依据**携任务问题、source/origin、版本/时效、权利、适用范围、反例、冲突及选择理由；转载不产生新独立来源。
**规范条款**由专业源持有，条款 ID 与任务关联用于定位和去重，不是新的运行时身份对象。
**delta**为任务原件：条款 ID、旧/新、理由、证据 ref、来源、适用范围、反例、版本/时效、许可状态、任务、时间、实际文件清单及失败/恢复说明。保存先后与失败合同归实现设计。
**项目规范索引**只导航实际文件/用途/读取时机/owner/consumer/最后更新；不复制专业正文、token/API 值或执行状态。

## 8. 数据和生命周期

当前专业正文是唯一有效条款；旧值与替代理由留不可变 delta。历史研究、旧经验原件和原始失败保留，不为清洁当前经验文件而删除来源。经验文件仅保未解项，迁入完成的对应条目退出；来源不明或不适用项保真实处置，不推定已解决。

同一任务＋条款 ID 再触发先核是否为同事实，内容不同须记录真实变化。查询用当前原文，但在途任务不因全局更新静默切换已采用版本。迟到的失败或独立发现由原 owner 修相应条款并复核受影响 consumer，不能覆盖旧原件。取消时保已落地结果、停止后续副作用，逐件恢复不整树覆盖。回退前定位已经采用新版的直接及间接 consumer，由原 owner 核旧值兼容性并定向复验；未知 consumer 不当零个。

S6 的适用对象是本卡真实交付事件：任务级返工、独立可复验缺陷、用户实际阅读/决定/反馈/验收时间、最终批量验收往返；任务级返工与局部修复分开。母目标返工≤2轮、缺陷≤10（≤5仅期望）、人工介入≤2小时、最终验收确认1次按同口径留原始读数，不能把收口方向/计划选择算最终验收，不能从会话时长反推人工时间。缺测保持 unknown，不据未测数字宣达标。提取覆盖和视觉差异不适用于本卡无设计提取/页面实现的范围，记具名 N/A 而非0或100%；C09的新旧页面收益实验不由本卡替做。

## 9. 兼容性预留

保现五阶段、七类 public runtime、task facts、规范原 owner、八类设计/前端分权和历史只读。初始化改名须迁真实当前 reader 和 bundle/catalog/reuse 登记；旧冻结用例若锁旧名或旧经验清理条件，明确提出测试变更请求，未经用户真实答复不改。

方法能独立搬运，项目根、精确写集、owner、能力均由调用者提供；不写死当前账号/绝对路径到通用方法。C08 后续消费规范同步机制负责扩展和分发，本卡不代替 C08/C10 发布。

## 10. 明确不做与默认必须成立

### 明确不做

- 知识网站、整库采集、动态 GenUI 框架、独立永久索引或第二 Experience 权威；来源为[当前决定“范围与非目标”][decision]和 PRD-C02 字段14。
- C03 的组件 API/映射、C05/C06/C07 的页面设计实现或浏览器验收；PaperBuilder 只改规范和索引（U-016）。读取 UI 规范不等于实施 UI。
- 一次性生成后端/接口/验收的全部条款或空壳；只做最小适用正文，其余有真实需要再补（U-012）。
- design-wiki 原文/源码/运行时复制、未核权利的外部内容同步，未知许可不能因 U-017 变 licensed。
- 未验证推断晋升、单任务观察推广全局、改冻结测试或 AC 换绿、第二状态机/审批门/validator/进度账本。
- 本轮生产实施、PaperBuilder 写入、Git 交付与清理；后续 PaperBuilder Git 仍由用户确认。
- C08/C10 的后续分发、后台自动追 HEAD 或定时监控；沿现维护入口查新。

### 默认必须成立

同一事实只保一个有效条款；历史失败和来源不覆写；权限、结构、语义、真实效果分别报告；缺少条件只停依赖动作而不冻结安全工作。以上分别由 AC-KR-001～007 对应失败场景检验。

## 验收流程

先从来源绑定进入场景、FR，再到 Appendix A 的唯一 AC；按该 AC 指定的首次判定 Phase、执行 owner 和真实输入取得原件。唯一末验收 Phase 消费各首次结论，补必要未闭环 case 并串演真实复用链；仅聚合不冒执行，也不把 AC 首次判断拖到末尾。命令、退出与结构只证其可观察范围；语义由独立读者核、真实使用由具名实际消费者核。

## 测试标准

项目声明的面及其执行合同如下；命令与配对原件唯一在所属Task，不从本表自动抓命令运行。

| 面／适用理由 | AC | 命令与数据入口 | oracle／证据上限 |
| --- | --- | --- | --- |
| 原文检索/四判/五反例：直接产品行为 | AC-KR-001、AC-KR-002 | P1/T001接线命令＋完整真实需求/反例输入 | ORACLE-C02-REUSE-ASSET只证附件；ORACLE-KR-RETRIEVAL/NEGATIVES独立人读证语义 |
| 外源权利/更新比较/查询失败：PRD-S3必需 | AC-KR-004 | P1/T001“维护与独立方法执行”确证curl及受控失败 | ORACLE-KR-RIGHTS；当前/固定具名文件差异、失败影响，不证全包 |
| 五类路由/迁名/模板/索引：真实reader变化 | AC-KR-006 | P2/T002同名命令、原八类/两仓真实源、缺源负例 | ORACLE-C02-NORM-INIT-RENAME机械；ORACLE-KR-NORM-INIT独立读回 |
| 同步/拒写/幂等/竞争/partial/恢复：真实副作用 | AC-KR-005、AC-KR-007 | P3/T003同名命令与完整方法应用正反数据；底座具名命令只辅助 | ORACLE-KR-SYNC/RECOVERY；受控面不冒全自动事务 |
| catalog生产/经验消费：两个真实独立需求 | AC-KR-003、AC-KR-005 | P3/T004公开remote/原包与checker；T005历史保护命令＋原条目 | ORACLE-KR-CATALOG/REUSE-CHAIN；格式与语义分判 |
| PB规范有源更新：现前端质量consumer | AC-KR-005、AC-KR-006 | P3/T003完整PB原规范/新条款/独立读取数据 | 文件允许、Git待确认；不冒页面效果 |
| S6适用原始事件：从首次执行记录 | AC-KR-003、AC-KR-005 | P3/T003～005真实需求/原会话事件与appendRecord；主会话现成本入口仅补成本 | 事件缺测unknown，机器时长不是真人工时间 |
| 全AC独立末验收 | 全部七AC | P4/T006复用原件并仅执行必要未闭环case | ORACLE-KR-FINAL，不全量重跑 |

三源合并UI适用性：raw_requirement为[U-016][u]第96–100行“只改规范文件和索引”；project_inventory为[工程006][eng]§5以及本作者实读WH package.json、PB frontend/package.json:7–39/App.tsx:133–206/专业规范；planned_or_changed_frontend_fact为[decision][decision]WP4第3项及本spec全局精确写集。PB确有React/Vite真实route，不因“项目有前端”自动变本卡页面任务；本写集无组件/CSS/route/API修改，WH报告HTML机制也不改。因此UI专业规范来源/语义保全适用，浏览器E2E/截图/a11y运行/性能没有本次页面对象，具名不执行、不宣页面通过。实际diff触及这些面即回原计划/测试owner重定适用性，不静默扩围。

自然语言意义用独立人读正反材料；机械接线用独立预写目标测试；真实任务原件与 consumer 采用位置证明效果。混合写集含 YAML/JSON/方法执行与真实写入，不对整任务用 G-2。单个纯 Markdown 且无新增运行行为的 Task 仅可具名说明理由、风险与可证伪替代。

冻结 oracle 原件与测试作者独立；本作者不写测试。只写 DO NOT TOUCH 不证明物理隔离；实施派发前须实测只读/隐藏权限，否则如实 incomplete。AC/断言变动须用户真实答复、旧字节及失败原件、独立审查，不因旧测试与新方向冲突静默改绿。

### 验收对象

本对象为当前认证worktree下方法/规范/接线与两笔真实维护任务，三源事实已按上节实际读取，选CLI分支；service/route/viewport不填伪URL或尺寸。对象检查只核结构和引用，不证明环境健康/语义/业务。下列sources key供调用内context使用，不是新持久schema：raw_requirement=完整U原件，project_inventory=工程006及已读WH/PB配置路由，planned_scope=当前spec，phase_entry=P4正文，real_samples=catalog七注释及Improvements，oracle=本spec Appendix A。

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c02-knowledge-reuse-20261025",
  "state": {"execution":"not_run","scope":"planned methods, norms and real maintenance tasks; no browser-visible changes"},
  "owner": "C02独立验收执行者",
  "cli": {
    "command": "node tools/cli/check-skill-consistency.mjs --root \"$PWD\"",
    "entry_ref": "phase_entry",
    "sample_ref": "real_samples",
    "oracle_ref": "oracle"
  }
}
```

执行者从本对象提输入，实读模板唯一marker后代码，context三项均提供false、原文source_ref和非UI实际理由；sources值是已读材料内容。保存真实对象输入/读取范围/hash/返回，不另存context文件或checker。计划入口可引用现P4，state.execution=not_run不得抹去。

## 架构边界

知识方法只产可回读判断，不拥有规范正文；规范同步路由到原专业 owner，不成为全局规范总 writer；初始化只定位/补实质源；任务执行事实归现 task quality/facts，AGENTS 只作导航。通用 I/O 复用既有窄底座，公共 runtime 不扩面。

## 实现设计（全局权威）

### 代码锚点

**written**。工程事实来自[工程006][eng]§2～6、[拆并补充007][eng7]、[验证008][ver8]、[上游入口011][upstream]；作者实际回源读取关键JSON、接口和PB专业源，不把图命中作证明。

| 已读来源/符号 | 当前事实 | 本计划采用 |
| --- | --- | --- |
| `runtime/stage/stage-skill-runtime.mjs:70-98` / resolveStageSkillPackages | manifest按name/path读真实bundle，返回dependencies/payloads | 三个独立预写接线oracle复用，不扩runtime |
| `skills/knowledge-graph/skill-bundle.json:3-6` | files只有SKILL.md | 加精确参考附件，两原workflow入口读同一方法 |
| `skills/ui-project-init/SKILL.md:12-39`及bundle | 八类职责与等价实质源优先；不是强制八文件 | 同批迁名、保八模板、加三模板 |
| `skills/answer-as-page/SKILL.md:8-16,40-50,58-76`；`skills/answer-as-page/scripts/render-answer-page.mjs:13`；`workflows/make-decision/SKILL.md:176`及`workflows/verify-code/SKILL.md:37-38` | WH有现离线HTML合同与模板消费者；renderer固定读overview-template.html，真实阶段caller提供DATA并读回 | AGENTS设计/前端两行分别指向原方法/合同/模板及真实owner/consumer；不改renderer、模板或页面 |
| `runtime/interface/record-lock.mjs:136-245` / withLock | dir/name瞬时排他，任务锁不跨task | caller显式项目realpath根＋norm-sync同锁 |
| `runtime/interface/safe-write.mjs:180-241` / writeFileAtomic | rename单文件原子，非CAS/多文件事务 | delta先写、有序发布、匹配after才补偿 |
| `runtime/task/task-handle.mjs:81-112` / openTask | identity核project/task，quality叶子预算锁；withRecordLock固定task根 | quality使用appendRecord，项目规范另用现withLock |
| `skills/stage-reflection/SKILL.md:28-38`及stage-closeout:14 | 当前经验保旧追加，未解仅用户确认清理 | 新已验证内容改向norm-sync；未解判断仍原规则 |
| `skills/catalog.yaml:35-53,1207-1213` | 七笔是not_backfilled注释，归档commit未知 | 逐笔原采用证据，不造七skills/假pin |
| `specs/Improvements.md:1-90` | 真实待办/历史原件引用；7历史标题受保护 | 新条款驱动判重和对应项迁入，未解不批清 |
| PB `specs/design/README.md:4-19` / frontend/ui-quality:29-42 | design7含README＋frontend2，真实专业reader | 保9件，只改README当前consumer及ui-quality证据归属 |
| PB `specs/quality-governance/README.md:3-21` / evidence-schema:1-70 | 唯一质量导航与ledger字段/实现 | 新acceptance导航现源，不复制协议/ledger |

固定外源：Design-wiki pin `0aaa9f649d90281009d08663b0f1a177ab3b7e8c`，[SKILL定版](https://modelscope.cn/api/v1/skills/WenjiaWang/Design-wiki/repo/raw?Revision=0aaa9f649d90281009d08663b0f1a177ab3b7e8c&FilePath=SKILL.md)。[上游011][upstream]记录官方元数据和root当前/固定同字节；仅本时点根文件，许可仍空/unknown，未证全部参考文件。原方法来源参考文件按实际采用明确点名并逐个当前/固定比较，不假称全包最新。

三新增模板仅借方法结构：[12-factor config](https://12factor.net/config)只支持部署配置分离，不把内部接线当部署配置；[OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html)只适用HTTP，不强加WH函数接口；[GivenWhenThen](https://martinfowler.com/bliki/GivenWhenThen.html)用于行为/负例写法。工程006已读范围/裁剪限制保原件。旧研究16正文/OpenAPI3.2.1/eng-project-init不是批准方案；不复制未授权文字。

### 接口与失败语义

**written**。选择P1复用→P2窄扩：现知识图承接任务问题/合法来源/采用判断；已有init迁名并扩专业路由；新norm-sync是U-014明确要求的方法，不造runtime引擎。现有知识卡存储、metrics双写、后台监控无此真实consumer，保持不接入。唯一新增方法/附件/模板在move-map和catalog登记owner、当前consumer、替代和退出条件；不建立额外registry/schema。

检索输入是任务目标、范围、知识类型、原文/合法性和现有工具能力；输出为原文定位、上下文/版本/权利、适用四判、采用/不用/待补证及产物位置。图只引路，词法匹配不判语义，原专业源仍持有条款。无结果、错误/取消和许可不明分别保原始事实，错误不被“无结果”吞没。

norm-sync由caller给项目规范权威根、精确目标/owner、task handle、独立证据/条款ID/old/new/来源/范围/反例/版本/权利以及预期before；无缺省目录/账号。新routes.md只解释五类到原owner的选择，不复制专业条款、token/API字段或规范权威。四个触发为build-code每个Phase收口、verify-code终末、stage-reflection写经验前、stage-closeout任务收口前；前二直接manifest，后二catalog dependency_closure。交付后从方法首次可用起，每个Phase均在本次收口处理其已验证变化，不延迟到整个build-code stage末；重复触发核同一task＋条款ID幂等，不重复有效条款，不加阶段/gate。

本卡首次建设顺序与交付后的通用触发分开：P1/P2结束时norm-sync尚未由P3/T003交付，执行者沿当时可用的现收口方法保已验证变化及尚未同步的事实原ref，不宣新方法已经执行，也不新建候选库/状态账本。P3/T003方法可用后先逐项核这些早期原件的证据/权利/目标与当前before，按现规范owner有序处理并记录真实时点；无适用变化写具名无变化，不能假补早期即时同步。此为本卡首次安装前的能力未就绪事实，不增加新用户选择，也不放宽交付后的触发时点；P3方法首次可用起，本卡后续Phase与后续普通任务均在每个Phase收口触发。不得倒称P1/P2已执行，或把本次安装前事实推广成一般延期例外。

**同步顺序和恢复**：所有AI起草、原文读取、网络、独立核证在锁外；合格条件按AC-KR-007，缺一不写。caller实核同一物理规范根，`withLock(projectRoot,"norm-sync",callback)`；同一项目各规范/AGENTS/对应经验共一锁，WH和PB分开顺序不嵌套；task.withRecordLock不是替代。锁内重读目标before，与准备值不同保双方差异、不覆盖；经task.appendRecord先保存该次变更delta，失败则目标尚未动。再逐精确文件writeFileAtomic：规范→AGENTS索引→对应已迁经验，逐文件读回；不持锁等child。没有对应经验项时明确不适用，不为清理而造条目。

第二文件失败时第一文件可能已变，保原错误及哪些已写/未写；补偿仅在当前字节仍等本次after时按具名delta恢复对应before，漂移则停该补偿交原owner，不覆盖他人。回退先核已用新版consumer与兼容性，定向复验。重复task＋条款ID先核真实条款/来源；ID相同异内容是冲突，旧delta存在不证明目标成功。没有跨文件事务/读改写CAS承诺，未参加同锁的外部编辑者仍是风险。

非UI的真实读取接线由现workflow正文承担，不依赖UI标签或resolver存在：build-plan在全局设计/测试蓝图前，按实际职责调用project-norm-init，从目标项目AGENTS规范索引读取backend/README.md→architecture.md、api/README.md→contract.md、acceptance/README.md→acceptance.md及其中现权威；build-code在每Phase开工、选择实现接口与测试前读该Phase适用类别；verify-code在终末验收对象/用例准备前读适用验收源及受影响backend/api契约。已有五个UI trigger原值保持，build-plan manifest的ui_scope_existing_project_baseline不改为泛化触发；非UI分支以这三个已列workflow的明确正文指针读取同一方法，不造runtime自动调度。缺源、过期、冲突只标该类缺件/影响/原owner并停止依赖该规则的选择，其他类继续；未知不是N/A，不默认生成架构/API规则。P2/T002由独立执行者分别给后端边界、函数/API契约、验收证据三个非UI真实问题和缺源/冲突反例，实际走三个workflow规定时点并留采用位置，不能以新名bundle可解析替代调用。

WH设计/前端两类的适用专业源不由本卡浏览器路线决定：设计沿`skills/ui-project-init/SKILL.md`（T002后新名）的八类职责、`skills/design-source-readiness/SKILL.md`和`skills/frontend-prototype-render/SKILL.md`定位源；本仓离线任务页的内容/组件取舍与确认设计由`skills/answer-as-page/SKILL.md`“分工与出页/组件词汇与取舍/当前任务驾驶舱”持有，精确样式仍在原`skills/answer-as-page/templates/overview-template.html`。前端工程沿`skills/frontend-component-quality/SKILL.md`、`skills/frontend-testing/SKILL.md`及answer-as-page“依赖与边界”的DATA/安全渲染/输出合同；真实reader为make-decision:176、verify-code:37–38的阶段caller及render-answer-page.mjs:13的模板读取。P2在已列WH AGENTS写集登记两类用途/读时/owner/consumer/当前源版本，把专业source与页面实现事实分开；不复制模板/CSS值，不新增八份空规范，不扩大HTML/renderer写权。版本或某子类未读保逐面unknown/原owner，不能把两整类写N/A。本卡只修方法/索引，浏览器视觉/a11y/性能仍无改动对象，保持未执行、不宣页面通过。

数据/接口与最小规范：WH backend architecture引用宪法F1/F2/F8、move-map和facade，api contract引用现七public行为与其真实函数/schema，不造OpenAPI；acceptance引用现标准工作方法/测试资产规则，evidence/done只写两真实任务新独立内容，避免复制既有证据规范。PB backend引用AGENTS/C2/组件映射，api引用现Pydantic/FastAPI公开合同，acceptance只给quality-governance入口及任务AC/取证边界；每类源版本/owner/consumer从实际专业源保留，未核版本记unverified，不能从代码倒推出正确规范。

成本假设：本卡无新增依赖安装、图更新/付费抽取、生产服务或复制分发；主要成本是单owner文字/登记迁移、独立正反方法消费和三resolver目标检查。在线查询仅已确认固定源与七笔实际采用，目标外需新授权；无法估计人工成本如实unknown，不捏时长。方法正文保持便携，当前机器路径只在本task材料/对象，不植入通用技能。

### 全局文件边界与依赖

**written**。本轮实际编写：本spec、4个独立Phase与index由材料作者独占；新`tests/contract/knowledge-reuse-norm-wiring.test.mjs`由独立验证作者预写，已经三条目标RED，生产实施者DO NOT TOUCH。当前已有decision/GLOSSARY上游改动保留，不归本作者；本轮不生产、不Git。下表是未来实施完整精确写集，阶段引用取各物理契约头，不用glob。

| 精确路径 | 动作 | writer顺序与消费者 |
| --- | --- | --- |
| `skills/knowledge-graph/SKILL.md` | MODIFY | P1；真实consumer见各Task文件/动作 |
| `skills/knowledge-graph/references/knowledge-reuse.md` | NEW | P1；真实consumer见各Task文件/动作 |
| `skills/knowledge-graph/skill-bundle.json` | MODIFY | P1；真实consumer见各Task文件/动作 |
| `workflows/make-decision/SKILL.md` | MODIFY | P1→P2；真实consumer见各Task文件/动作 |
| `workflows/build-plan/SKILL.md` | MODIFY | P1→P2；真实consumer见各Task文件/动作 |
| `skills/catalog.yaml` | MODIFY | P1→P2→P3；真实consumer见各Task文件/动作 |
| `skills/reuse-registry.md` | MODIFY | P1→P2→P3；真实consumer见各Task文件/动作 |
| `THIRD_PARTY_NOTICES.md` | MODIFY | P1→P3；真实consumer见各Task文件/动作 |
| `docs/architecture/move-map.json` | MODIFY | P1→P2→P3；真实consumer见各Task文件/动作 |
| `skills/ui-project-init/SKILL.md` | MODIFY（迁出后删除） | P2；真实consumer见各Task文件/动作 |
| `skills/ui-project-init/skill-bundle.json` | MODIFY（迁出后删除） | P2；真实consumer见各Task文件/动作 |
| `skills/ui-project-init/templates/domain-semantics.md` | MODIFY（迁出后删除） | P2；真实consumer见各Task文件/动作 |
| `skills/ui-project-init/templates/visual-design-system.md` | MODIFY（迁出后删除） | P2；真实consumer见各Task文件/动作 |
| `skills/ui-project-init/templates/components.md` | MODIFY（迁出后删除） | P2；真实consumer见各Task文件/动作 |
| `skills/ui-project-init/templates/layouts.md` | MODIFY（迁出后删除） | P2；真实consumer见各Task文件/动作 |
| `skills/ui-project-init/templates/interaction.md` | MODIFY（迁出后删除） | P2；真实consumer见各Task文件/动作 |
| `skills/ui-project-init/templates/frontend-engineering.md` | MODIFY（迁出后删除） | P2；真实consumer见各Task文件/动作 |
| `skills/ui-project-init/templates/craft.md` | MODIFY（迁出后删除） | P2；真实consumer见各Task文件/动作 |
| `skills/ui-project-init/templates/quality.md` | MODIFY（迁出后删除） | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/SKILL.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/skill-bundle.json` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/domain-semantics.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/visual-design-system.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/components.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/layouts.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/interaction.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/frontend-engineering.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/craft.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/quality.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/backend-architecture.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/api-contract.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/project-norm-init/templates/acceptance.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `workflows/build-plan/skill-deps.yaml` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `workflows/build-code/SKILL.md` | MODIFY | P2→P3；真实consumer见各Task文件/动作 |
| `workflows/verify-code/SKILL.md` | MODIFY | P2→P3；真实consumer见各Task文件/动作 |
| `workflows/make-decision/flows/small/SKILL.md` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `workflows/make-decision/flows/normal/SKILL.md` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `workflows/make-decision/flows/planning/SKILL.md` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `skills/spec-prd/SKILL.md` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `skills/frontend-testing/SKILL.md` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `skills/frontend-prototype-render/SKILL.md` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `skills/plan-design-review/SKILL.md` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `skills/design-source-readiness/SKILL.md` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `skills/frontend-component-quality/SKILL.md` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `AGENTS.md` | MODIFY | P2→P3；真实consumer见各Task文件/动作 |
| `specs/backend/README.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `specs/backend/architecture.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `specs/api/README.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `specs/api/contract.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `specs/acceptance/README.md` | NEW | P2→P3；真实consumer见各Task文件/动作 |
| `specs/acceptance/acceptance.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `/Users/Hugh/Hugh/Project/PaperBuilder/AGENTS.md` | MODIFY | P2→P3；真实consumer见各Task文件/动作 |
| `/Users/Hugh/Hugh/Project/PaperBuilder/specs/design/README.md` | MODIFY | P2；真实consumer见各Task文件/动作 |
| `/Users/Hugh/Hugh/Project/PaperBuilder/specs/backend/README.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `/Users/Hugh/Hugh/Project/PaperBuilder/specs/backend/architecture.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `/Users/Hugh/Hugh/Project/PaperBuilder/specs/api/README.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `/Users/Hugh/Hugh/Project/PaperBuilder/specs/api/contract.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `/Users/Hugh/Hugh/Project/PaperBuilder/specs/acceptance/README.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `/Users/Hugh/Hugh/Project/PaperBuilder/specs/acceptance/acceptance.md` | NEW | P2；真实consumer见各Task文件/动作 |
| `skills/norm-sync/SKILL.md` | NEW | P3；真实consumer见各Task文件/动作 |
| `skills/norm-sync/references/routes.md` | NEW | P3；真实consumer见各Task文件/动作 |
| `skills/norm-sync/skill-bundle.json` | NEW | P3；真实consumer见各Task文件/动作 |
| `skills/stage-reflection/SKILL.md` | MODIFY | P3；真实consumer见各Task文件/动作 |
| `skills/stage-closeout/SKILL.md` | MODIFY | P3；真实consumer见各Task文件/动作 |
| `workflows/build-code/skill-deps.yaml` | MODIFY | P3；真实consumer见各Task文件/动作 |
| `workflows/verify-code/skill-deps.yaml` | MODIFY | P3；真实consumer见各Task文件/动作 |
| `specs/acceptance/evidence.md` | NEW | P3；真实consumer见各Task文件/动作 |
| `specs/acceptance/done.md` | NEW | P3；真实consumer见各Task文件/动作 |
| `specs/Improvements.md` | MODIFY | P3；真实consumer见各Task文件/动作 |
| `/Users/Hugh/Hugh/Project/PaperBuilder/specs/frontend/ui-quality.md` | MODIFY | P3；真实consumer见各Task文件/动作 |
| `tests/contract/ui-skill-contract.test.mjs` | MODIFY（获批未来测试迁移） | P2/T002生产writer结束→独立测试owner→同oracle定向复验；非本轮写权 |
| `tests/n2-skill-catalog-portability.test.mjs` | MODIFY（获批未来测试迁移） | P2/T002生产writer结束→独立测试owner→同oracle定向复验；非本轮写权 |
| `tests/contract/make-decision-flows.test.mjs` | MODIFY（获批未来测试迁移） | P2/T002生产writer结束→独立测试owner→同oracle定向复验；非本轮写权 |
| `tests/contract/stage-closeout-skill.test.mjs` | MODIFY（获批未来测试迁移） | P3/T003生产writer结束→独立测试owner→同oracle定向复验；非本轮写权 |
| `tests/contract/stage-closeout-step-contract.test.mjs` | MODIFY（获批未来测试迁移） | P3/T003生产writer结束→独立测试owner→同oracle定向复验；非本轮写权 |
| `tests/contract/business-repo-experience-file.test.mjs` | MODIFY（仅原断言确需变化时） | P3/T005生产writer结束→独立测试owner核触发→窄迁移与复验；未触发不写 |

共享顺序逐精确文件由上表给出；全图为P1/T001→P2/T002→P3/T003→T004→T005→P4/T006。P1/P2因catalog/reuse/move-map和两个workflow共享前态串行，不伪称产品强依赖；P3消费P2规范路由。T003→T004共享catalog/move-map/AGENTS，T004→T005只共享WH acceptance README/AGENTS；move-map最后由T004在已读现Improvements消费者与拟定done规则来源后预登记evidence/done本任务生产用途，不写active/已创建猜测，T005生产writer只写Markdown；若已获批experience断言变更条件实际触发，同卡独立测试owner随后单独写该精确测试，不把该测试迁移计入纯文档G-2。PB init的AGENTS→T003 PB应用AGENTS顺序明确；不会WH与PB双锁并发。前writer交实际局部差异/未决，后writer重读当前字节；版本漂移不静默覆盖。

**DO NOT TOUCH及实读（2026-10-25，read工具）**：新目标测试104行sha256 `d808c71f8fc450a9fbe30f4975982913244d17102a05513b4342e363fbb52012`；tests:23/37/74三个ORACLE-C02名称、固定附件/旧八＋新三模板及两直接stage＋两间接owner闭包预期均已读，P2/P3后段因首断言失败未运行。旧六测试保护与条件写权见下一节。`runtime/interface/record-lock.mjs`逐字`withLock(dir, name, fn, { waitMs = 2000 } = {})`；`runtime/interface/safe-write.mjs`逐字`writeFileAtomic(root, relPath, bytes, options)`和`createFileOnce(root, relPath, bytes, options)`；`runtime/task/task-handle.mjs`逐字`openTask(taskPath, expected, expectedTaskId)`与`appendRecord({dir,slug,ext,bytes}={})`，这些接口本卡不改。`runtime/interface/runtime-facade.mjs`七public行为已读，保持不扩。

PB受保护精确路径：`/Users/Hugh/Hugh/Project/PaperBuilder/frontend/src/ui/style-token-guard.test.ts`、`/Users/Hugh/Hugh/Project/PaperBuilder/frontend/src/ui/tokens-base.css`、`/Users/Hugh/Hugh/Project/PaperBuilder/frontend/src/ui/style-token-baseline.json`、`/Users/Hugh/Hugh/Project/PaperBuilder/frontend/tests/local-color-contract.ts`、`/Users/Hugh/Hugh/Project/PaperBuilder/specs/quality-governance/evidence-schema.md`。作者实读guard:1–82，DO NOT TOUCH及EXEMPTION_SCOPE逐字三项为`src/ui/tokens-base.css`、`src/footprint/core/marker-overlay.ts`、`**/*.test.ts(x)`；完整冻结值表未读，CSS/baseline/local-color全文unknown，由PB原test/source owner在任何受影响动作前核真实字节，当前不改它们。evidence-schema全文已读：唯一实现`scripts/quality_gate/ledger.py`、schema=`paperbuilder-evidence.v1`，不另建副本。手工oracle002、原PRD/decision/GLOSSARY及历史证据只读；ADR沿原not-needed指针。

#### 冻结测试迁移请求

本轮不改旧测试。[测试迁移独立答复][test-confirm]已明确同意下表5项迁移及1项条件变更；并非从计划同意或U-015推定授权。下表只纳未来实施写集：相应生产writer结束后，独立测试owner先核旧字节/hash并保当前失败或本来通过事实，再串行改获批精确用例并定向复验；测试owner回交原件后原生产writer消费同一oracle，二者不并发写。六文件对生产writer及本轮材料作者仍DO NOT TOUCH，只有具名独立测试owner获所列窄例外；未触发的条件项及表外断言不写。旧失败不覆盖，oracle身份、原分母/保护强度不减；新目标test继续完全冻结。一次审查原件和覆盖限制见[审查处置][review-dispositions]，授权不把其undetermined读为已验证。

| 请求／触发Task | 条件允许精确路径 | 旧→新及保留强度 | 原件/限制 |
| --- | --- | --- | --- |
| TCR-KR-RENAME，T002后 | `tests/contract/ui-skill-contract.test.mjs` | skillSpecs旧name/path/bundle→新名；保五trigger原值及全部安全断言 | hash与原RED范围见验证004 |
| 同上 | `tests/n2-skill-catalog-portability.test.mjs` | SAMPLES旧名→新名；三样本、真实复制/闭包/缺依赖断言不减 | 不改历史runbook |
| 同上 | `tests/contract/make-decision-flows.test.mjs` | 原31能力每项保留，旧能力映射新owner/路径；不删分母 | 原RED未取得，如实缺口 |
| TCR-KR-CLOSEOUT，T003后 | `tests/contract/stage-closeout-skill.test.mjs` | 三精确依赖→原三项＋skills/norm-sync；保去重/无自引/相对路径/真实bundle | 原三项knowledge-graph/resolving-merge-conflicts/spec-specify |
| 同上 | `tests/contract/stage-closeout-step-contract.test.mjs` | length3→同一四精确项，不仅改计数；三stage边界不变 | 原RED未取得 |
| TCR-KR-EXPERIENCE，T005如确触发 | `tests/contract/business-repo-experience-file.test.mjs` | 仅“已验证且已同步对应项”新增退役分支；未解人判断仍保用户确认，判重/路径/模块规则不减 | 先确认现保留语义能否免改；条件未触发则不改 |

旧hash、原RED已读/仅定位/未取得逐项沿[验证004][ver4]§TCR唯一原件；本作者已read六文件相关断言：UI:13–31/177–190、N2:16/127–148、flows:235–244、closeout:24–44、step:66–80、experience:36–44。`tests/contract/light-route-controlled-fixture.test.mjs`历史31分母及`tests/contract/n11-capability-gaps.test.mjs`7历史标题不迁；后者2026-10-25已读:40–41。本次依真实答复将六精确路径加入全局表、对应Task/Phase头及再生index；这是未来独立测试owner的窄许可，不是测试已经修改/通过或本轮可以开工。TCR-KR-EXPERIENCE只有现保留语义无法覆盖“已验证且已同步对应项退役”且确需改旧断言时触发；能保持原断言则不改，未解人判断继续用户确认，七个历史标题不变。

### 需求到任务追踪

以下双向表以每行原件＋标题确定来源含义，五列为原source→FR/AC→物理Phase/Task→oracle→交付/反例。R-004a～d、R-005a～d保派生子项不吞原全义。每Task Source栏反指这些源，P4/T006覆盖全部AC但不替首次验收。

| 原始来源（原件定义见来源表） | FR／AC | Phase/Task | oracle | 交付及反例 |
| --- | --- | --- | --- | --- |
| V3 R-001/R-002/R-003/R-004a/R-004d/R-005a/R-005b/R-005d/R-010/R-011/R-013/R-015/R-017/R-018/R-023/R-024/R-025；U-003/U-004/U-013/U-017；PRD-S3 | FR-KR-001、FR-KR-002、FR-KR-003、FR-KR-011；AC-KR-001、AC-KR-002、AC-KR-004 | P1/T001 | ORACLE-C02-REUSE-ASSET | 原文实际采用、五反例、权利与查新失败；语义oracle见唯一AC |
| V3 R-007/R-020/R-021/R-022；U-008/U-009/U-010/U-012/U-015/U-016/U-018；PRD-S2 | FR-KR-006、FR-KR-007、FR-KR-010；AC-KR-006 | P2/T002 | ORACLE-C02-NORM-INIT-RENAME | 迁名/闭包、两项目实质源与索引；空壳/双权威拒绝 |
| V3 R-004b/R-009/R-019/R-021/R-022；U-007/U-009/U-011/U-014/U-016/U-018/U-019；PRD-S7 | FR-KR-004、FR-KR-005、FR-KR-006、FR-KR-010、FR-KR-012；AC-KR-005、AC-KR-007 | P3/T003 | ORACLE-C02-NORM-SYNC-WIRING | 同步四入口与PB真实应用；拒写/partial/恢复，后续人读ORACLE-KR-SYNC/RECOVERY |
| V3 R-004c/R-005c/R-006/R-016；U-002/U-012；PRD-S4/PRD-S6 | FR-KR-008、FR-KR-012；AC-KR-003、AC-KR-005 | P3/T004 | ORACLE-KR-CATALOG | 七笔原采用及证据条款；当前HEAD冒原包绑定失败 |
| V3 R-005c/R-008/R-016/R-019；U-002/U-007/U-012；PRD-S4/PRD-S6 | FR-KR-009、FR-KR-012；AC-KR-003、AC-KR-005 | P3/T005 | ORACLE-KR-REUSE-CHAIN | 不同需求查询采用新条款，未解不清、历史不删 |
| V3 R-001/R-002/R-003/R-004/R-005/R-006/R-007/R-008/R-009/R-010/R-011/R-012/R-013/R-014/R-015/R-016/R-017/R-018/R-019/R-020/R-021/R-022/R-023/R-024/R-025；U-001/U-006；PRD-C02/PRD-S1/PRD-S4/PRD-S6/PRD-S7 | FR-KR-001、FR-KR-002、FR-KR-003、FR-KR-004、FR-KR-005、FR-KR-006、FR-KR-007、FR-KR-008、FR-KR-009、FR-KR-010、FR-KR-011、FR-KR-012；AC-KR-001、AC-KR-002、AC-KR-003、AC-KR-004、AC-KR-005、AC-KR-006、AC-KR-007 | P4/T006 | ORACLE-KR-FINAL | 逐条读回、必要未闭环case、授权/原件/非目标，不自判或全量重跑 |

| 全来源逐项回读 | 承接Task | 具体处置/反例 |
| --- | --- | --- |
| [V3 R-001 结果与消费方][v3]（对应同名节） | P1/T001、P3/T005 | 交适用依据并真实用；链接清单失败 |
| [V3 R-002 范围][v3]（对应同名节） | P1/T001、P2/T002、P3/T003 | 四类知识/五类规范分开，未验证不写；C03排除 |
| [V3 R-003 流程与状态][v3]（对应同名节） | P1/T001、P3/T004→T005 | 查询至新经验再用；五类未知显露 |
| [V3 R-004 功能要求][v3]（对应同名节） | P1/T001、P3/T003/T004/T005 | F1依据/F2同步/F3真实后续/F4版本许可四子项 |
| [V3 R-005 验收][v3]（对应同名节） | P1/T001、P3/T005、P4/T006 | 母四AC及四子项全部由KR1～4承接 |
| [V3 R-006 准备依赖][v3]（对应同名节） | P3/T004/T005 | 两笔实际独立需求，非虚造 |
| [V3 R-007 实现依赖][v3]（对应同名节） | P1/T001、P2/T002 | C01有则消费，不等目录迁移，不造平台 |
| [V3 R-008 验收依赖][v3]（对应同名节） | P3/T005 | 不等C05/C09；独立语义和新经验再用 |
| [V3 R-009 合并与共享冲突][v3]（对应同名节） | P2/T002、P3/T003 | 唯一owner和真实依赖串行，不接管C03/C08整卡 |
| [V3 R-010 来源/设计][v3]（对应同名节） | P1/T001 | 母D/AC保历史原指针，公开不等许可 |
| [V3 R-011 局部风险][v3]（对应同名节） | P1/T001 | 词法非语义、同形异义、过期弱源反例 |
| [V3 R-012 可后置技术项][v3]（对应同名节） | P4/T006 | 第10节非目标；任务检索/再用不延期 |
| [V3 R-013 最小读取集][v3]（对应同名节） | P1/T001 | NAV/C02/S1～4/当前源有界，不强读全部语料 |
| [V3 R-014 五阶段开工说明][v3]（对应同名节） | P4/T006 | 复杂材料/原件/人确认，不建第二task状态 |
| [V3 R-015 共享定义S3][v3]（对应同名节） | P1/T001 | 原方法/词法/权利更新，U007覆候选 |
| [V3 R-016 共享定义S4][v3]（对应同名节） | P3/T004/T005 | 来源/消费/结果具名，非重放 |
| [V3 R-017 母决策][v3]（对应同名节） | P1/T001、P3/T003 | D002/010/011原锚；U007修正规范晋升 |
| [V3 R-018 母验收][v3]（对应同名节） | P1/T001、P3/T005 | D01/12/13/24原义，历史Experience保留 |
| [V3 R-019 经验直接进规范][v3]（对应同名节） | P3/T003/T005 | U007退候选；未解仍留，已验证对应项才清 |
| [V3 R-020 五类规范][v3]（对应同名节） | P2/T002 | 后端/API/验收最小正文，等价权威优先 |
| [V3 R-021 AGENTS索引][v3]（对应同名节） | P2/T002、P3/T003/T005 | 实际路径/用途/读取/owner/consumer/更新时间 |
| [V3 R-022 两项目与证明范围][v3]（对应同名节） | P2/T002、P3/T003/T004/T005 | 两WH真实更新+PB一次规范应用 |
| [V3 R-023 判定器][v3]（对应同名节） | P1/T001、P4/T006 | 合法性/语义/CLI exit分开 |
| [V3 R-024 RS01 A1～A3][v3]（对应同名节） | P1/T001 | 只重写方法；拒整站/未选语料 |
| [V3 R-025 RS05 E09/E10][v3]（对应同名节） | P1/T001 | 不动态重排；空rule非188规则 |
| [U-001 复杂路线][u]（该编号标题） | P4/T006 | 材料/独立质量/真实计划确认 |
| [U-002 两笔真欠账][u]（该编号标题） | P3/T004→T005 | 不同需求/原件/结果 |
| [U-003 方法重写][u]（该编号标题） | P1/T001 | 不copy原文/源码 |
| [U-004 扩知识图][u]（该编号标题） | P1/T001 | 既有skill＋reference，不新检索skill |
| [U-005 旧候选方案][u]（该编号标题） | P3/T003 | U007已覆盖；历史只读，不恢复候选 |
| [U-006 骨架确认][u]（该编号标题） | P4/T006 | 只证当时方向，不冒本计划确认 |
| [U-007 直接同步][u]（该编号标题） | P3/T003/T005 | 已验证规范化，未解保留 |
| [U-008 五类][u]（该编号标题） | P2/T002 | 只必要最小源，不16空件 |
| [U-009 AGENTS][u]（该编号标题） | P2/T002、P3/T003/T005 | 真实索引同步 |
| [U-010 两项目][u]（该编号标题） | P2/T002、P3/T003 | PB/WH各自原owner |
| [U-011 阶段收口][u]（该编号标题） | P3/T003 | 四入口，不循环写 |
| [U-012 证明范围][u]（该编号标题） | P3/T004/T005 | 至少两WH更新＋PB额外一次 |
| [U-013 两处检索][u]（该编号标题） | P1/T001 | 开工和设计准备 |
| [U-014 独立同步skill][u]（该编号标题） | P3/T003 | norm-sync方法，非引擎 |
| [U-015 初始化改名][u]（该编号标题） | P2/T002 | 全部当前caller，旧test另TCR |
| [U-016 PB只规范索引][u]（该编号标题） | P2/T002、P3/T003 | 无页面/浏览器效果承诺 |
| [U-017 许可unknown][u]（该编号标题） | P1/T001 | 方法重写非grant；外部内容不自动同步 |
| [U-018 PB文件/Git分开][u]（该编号标题） | P2/T002、P3/T003 | 实施文件允许；Git用户确认；手工oracle同单元 |
| [U-019 术语规范同步][u]（该编号标题） | P3/T003 | 沿GLOSSARY已有词，ADR not-needed |

DEC原始表R-001～011逐行回其原件：DEC R-001→V3 R-001；002→V3 R-002；003→V3 R-003；004→V3 R-004；005→V3 R-005；006→V3 R-006/R-008；007→V3 R-007/R-009；008→V3 R-011；009→V3 R-012；010→V3 R-017/R-018；011→V3 R-019～022及U-007～010。该映射不改任何来源编号，原锚均[decision“原始需求”][decision]与[v3对应标题][v3]；逐项Task由上表反查。

共享原始段另核：PRD-C02十六字段→上表V3 R-001～014及R-023；PRD-S1来源优先级→P1/T001与P4/T006；S2分权/旧Experience原件→P2/T002及P3/T005；S3原技能及一次查新/失败→P1/T001；S4真实独立任务/不可虚造/从首次事件→P3/T004/T005；S5对象/原始证据→P4/T006验收对象与两就绪件；S6适用指标→P3/T003～005；S7consumer影响/部分同步/回退→P3/T003/T005；NAV-C02固定源导航→P1/T001。母D002/D010/D011及AC-D01/D12/D13/D24只回[母decision原锚](<../workflowhub-ui-frontend-release-20261020/decision-log.md>)，不造ADR。独立需求研究[005][req]§3–5包含全部原语义/引用，本表只持当前实施落点，不复制第二需求原文。

### 全局验证策略

**written**。优先现可观察seam＋独立期望，不新validator；全局路由feature，不因Phase数升级fullstack。本地唯一新增目标测试由独立作者先写、三个精确-t各真RED，当前都因尚未实施目标接线；GREEN留后续同命令。旧UI baseline6项本来通过；catalog无独立版本真相/新producer seam，RED不可得，依真实逐项核对＋`node tools/cli/check-skill-consistency.mjs --root "$PWD"`辅助，不把checker0/注释数量当版本真值。T005的Markdown维护部分适用具名G2；若条件测试迁移触发，该测试代码部分不适用G2，独立test owner保原失败归因并按获批断言定向复验。P3和全任务混合不豁免末Phase。

首次验收：P1/T001=AC-KR-001、AC-KR-002、AC-KR-004，P2/T002=AC-KR-006，P3/T003=AC-KR-007及PB/机制的AC-KR-005子条件，T004=生产及第二次更新子条件，T005=AC-KR-003/AC-KR-005整体；唯一P4/T006复核全部并执行必要未闭环case。每测试面/独立输入/owner/命令/失败/恢复沿对应卡，不让resolver替代语义。无新增runtime代码意味着测试不证明自动引擎；方法采用必须真的由独立执行者消费完整材料并实际调用现I/O。

验收对象复用模板唯一函数；作者收口消费现`validatePostPhaseContract({spec,index,phases,reviewReadScope})`和`checkSkillConsistency(root)`，PB跨仓scope显式列现精确路径。旧工具无scope的unsafe-absolute或step附加readerunattested保原始诊断，不改工具/补旧step-consumer-design材料求绿；这些不判业务/语义。当前物理只读/隐藏未建立，后续派发须实证，原oracle不可改求绿。手工PB单元对照保只读原件，独立读者逐项比较SCN007/FR10/AC-KR-005、AC-KR-006与实际Phase写集；作者不自评质量。

## Appendix A — 验收判据（唯一权威）

上游 AC-C02-1～7 分别由以下 AC-KR-001～007 承接。每项分开技术子条件、独立语义与实际效果；全部适用条件满足才可判 pass。首次判定按“全局验证策略”具体Task执行；当前计划已获真实确认但本轮仅收口，不预签产品通过。

- **AC-KR-001**：真实任务取得并使用完整适用依据；关联 FR-KR-001/002，来源 V3 R-001/002/003/004a/005a/023、U-004/013。
验证：判定方式“机器可判”用于入口/来源引用接线，“只能人读”用于语义及采用影响。检索实施者提供真实任务问题、查询、原文及当前任务产物；未参与写作的读取者在检索交付时核完整上下文、来源/权利、版本/时效、范围/反例、比较/抽模式/推荐、采用/不用/待补证及冲突处置，并从方案或维护产物定位实际采用；oracle 为 ORACLE-KR-RETRIEVAL，后续两笔任务再核实际消费。
通过：两处入口均可到达方法且真实任务已沿该方法取得依据；采用结论有完整原文及具体影响，未采用/待补证有理由，同源未冒独立；资料合法性、语义有效性、CLI exit 分开报告。
失败：只有标题/链接、复制文章、没有原文或采用位置；把同名异义、单源、过期资料或未知权利静默当正确全局标准；入口仅存在而未实际消费。
证据：查询输入与原输出、原文稳定定位、独立适用读回、方案/实现/维护产物的采用位置及入口执行原件。

- **AC-KR-002**：五类反例及查询失败保持可见；关联 FR-KR-002/003，来源 V3 R-003/005b/011/023、当前决定 WP5。
验证：判定方式“机器可判”用于可重复入口输出，“只能人读”用于反例含义。独立测试作者提供无结果、过期、冲突、单源、未知许可五个具名受控输入和查询失败；检索交付时独立执行者按 ORACLE-KR-NEGATIVES 核原因、影响、采用/不用/待补证及恢复路径；受控失败不冒在线故障。
通过：各类分别可定位，过期图回原文且披露限制，单源明确未独立，冲突未解决不写规范，许可未知不复制/同步，查询失败不报无更新/无结果成功；未知仍保持未知。
失败：漏任何一类、用命令非零代替目标反例、默用旧资料、把推断改事实、吞失败或默认写入。
证据：每个具名输入、执行输出/退出、逐项独立判定、实际原文/错误引用与未覆盖范围。

- **AC-KR-003**：两笔有独立需求的真实任务构成新经验再用链；关联 FR-KR-008/009/012，来源 U-002/012、V3 R-004c/005c/006/008/016、PRD-S4/S6。
验证：判定方式“只能人读”核需求独立性与实际采用，“机器可判”核具名维护输出及证据接线。catalog 生产 owner 提供既有七笔欠账与版本/具名不可得结果，独立验证后生成证据条款；Improvements 消费 owner 随后从真实判重需求查询、读条款、应用并产出定位。消费交付时独立验收者按 ORACLE-KR-REUSE-CHAIN 核两任务原件与从首次执行留下的适用 S6 事件。
通过：来源任务/消费任务/结果具名且非同一需求重放；新条款已验证并实际进入消费任务产物，能逐步定位查询→条款 ID→采用→结果；不等待 C05/C09，事件缺测如实 unknown、不捏造改善数字。
失败：只保存、同任务重跑、虚构需求、没有实际采用位置、只用旧经验替代新写入再用能力、后置给 C09，或补造人工时间/效果。
证据：两笔原始需求、实际查询/读回、独立验证、条款 ID、采用前后局部产物及原始事件记录；CLI 结构报告仅辅助。

- **AC-KR-004**：外部内容权利、版本与维护可核；关联 FR-KR-011，来源 U-003/017、V3 R-004d/005d/010/015/017/018/024/025、PRD-S3。
验证：判定方式“只能人读”核逐项处置与合法性，“机器可判”核登记/固定源及查新输出。知识方法 owner 在采用前沿现维护入口取得 design-wiki 固定源和一次真实更新发现/比较，提供旧新差异、更优候选适用性及采用/不采用理由，再用具名受控查询失败验证 unknown/unavailable；独立读取者在该交付时按 ORACLE-KR-RIGHTS 核全文、登记与原件。
通过：design-wiki 只重写方法、保固定版本及 unknown 许可；design-experience-analysis 仅参考，grammar-ai/A6/动态 GenUI 不引入，仓内方法复用；采用项有维护 owner、真实 consumer、适配/失败边界；更新比较和失败分支可复核，不自动追 HEAD、不将公开阅读当复制授权；未知外部权利不写入规范。
失败：漏候选、复制未授权原文/源码、伪称 licensed、查新失败报无更新、未比较即追 HEAD，或登记代实际使用/维护验证。
证据：固定原文定位、许可事实、候选处置、登记 diff、真实查新/比较与受控失败原件、独立合法性读回。

- **AC-KR-005**：阶段收口规范同步真实发生且后续读到新版；关联 FR-KR-004/006/008/009/010/012，来源 U-007/009/011/012/014/016/018/019、当前决定 WP2/WP4。
验证：判定方式“机器可判”核调用/文件结果，“只能人读”核条款适用性与真实消费。各规范 owner 提供已验证变化、独立来源、实际规范/索引及原始 delta；catalog 和 Improvements 各在自身收口执行一次，PaperBuilder 完成一次有源设计/前端规范更新；每次独立读取者在该交付时按 ORACLE-KR-SYNC 核对“核证/路由→delta→规范→索引→已迁经验处置→读回及下游读取”，最后消费交付汇齐整体结论。
通过：至少两次真实更新且消费任务读到生产新版；四处触发接线可到达同一方法，旧 stage-reflection writer 已改向；delta 字段及 old/new 理由齐备、规范/索引一致、对应已迁经验无残留、历史原件保留；PB 文件修改在允许范围，适用事件从首次执行保真。
失败：只加指针不改变旧 writer、只产文件不走真实更新、对应旧经验仍是有效权威、索引漂移、虚报部分成功、把 PB 页面或 Git 当已授权/已完成。
证据：每次同步原始 delta、精确局部文件变化、索引读回、后续任务读新版及采用记录、独立检查与原始事件；不复制整树。

- **AC-KR-006**：两项目五类规范有适用正文与真实导航；关联 FR-KR-006/007/010，来源 U-008/009/010/012/015/016/018、PRD-S2。
验证：判定方式“机器可判”核路径/迁名/bundle/当前 reader，“只能人读”核实质条款/唯一权威。初始化 owner 提供旧八类源、实际 consumer 和各项目库存；两项目规范交付时独立读取者按 ORACLE-KR-NORM-INIT 从 AGENTS 导航实际读取每类来源，包括WH设计/前端原方法与离线页面合同/模板及其实际caller，核新增三类最小导航/正文与模板、各子面适用或具名不适用、owner/consumer/删除条件；WH设计/前端不得因本卡不改HTML整类排除；PB 等价质量源由原 owner 保持。
通过：project-norm-init 真实接管当前 caller，八类有效条款不丢；WorkflowHub 只建适用内容，PaperBuilder 保 design7含README＋frontend2 的既有9份；新增后端/接口/验收有实质最小内容或等价权威导航，不复制质量证据协议；两项目索引与实际用途一致。
失败：只有空壳/数量、只换名而 reader 断链、双 active 权威、丢旧规则、把代码现状直接倒填应然、虚构 WorkflowHub 页面规范、误数或覆盖 PB 现有质量源。
证据：原条款到去向、精确文件/reader 调用与读回、模板和登记、两项目索引一致性及独立语义原件。

- **AC-KR-007**：拒写、幂等、串行与回退守住真实失败边界；关联 FR-KR-004/005，来源 当前决定 WP2 的验证/范围/并发失败条款、U-007/014。
验证：判定方式“机器可判”核既有 I/O seam 的受控正反效果，“只能人读”核方法执行与恢复说明。同步 owner 提供合法变化及冲突、无目标、证据不足、许可未知、重复触发、同文件竞争、写 delta/规范/索引各段失败和取消输入；独立执行者在机制交付时沿 ORACLE-KR-RECOVERY 实跑最小替身或真实窄入口，真实两次更新再回读对应结果。
通过：无未解冲突、独立核对/证据/范围/权利齐才写；拒写无目标副作用；同任务条款不重复，同文件跨 task 由结构性独占/串行约束；旧值/理由可回读，失败明确哪些文件已变/未变，按 delta 局部恢复且读回；索引不一致保持失败并由原 owner 修复，不伪称多文件原子提交。
失败：先写后补证、吞错、重复有效条款、靠 task 锁冒跨 task 锁、靠单文件 atomic 冒事务、失败丢旧件、整树覆盖回退或没有恢复证据。
证据：受控输入/原始命令与失败、delta 与局部旧新值、锁/独占范围实读、重复/竞争/取消及恢复读回、真实更新反证。

## 12. 风险、未决与交接

- **RISK-01**：同号不同义或旧决定覆盖新答复导致范围错译。影响全部 FR/AC；触发为裸 R/U 摘要推断。缓解为原件锚定与母 PRD 双向表；build-plan 独立读者核来源，不改旧原件。
- **RISK-02**：共享规范/AGENTS 多 writer 或半完成被写成事务成功。影响 FR-KR-004～010、AC-KR-005～007；工程作者核既有锁与准确顺序，未证的能力保持 unknown；执行时局部失败保 old/new/delta 并恢复，不整树回滚。
- **RISK-03**：unknown 许可被泛化为可复制或可同步。影响 FR-KR-011、AC-KR-004、AC-KR-007；知识 owner 分离方法重写与外部内容授权，用拒写反例验。
- **RISK-04**：真实欠账被模型合成任务替代或旧有效条款被清除。影响 FR-KR-008/009、AC-KR-003、AC-KR-005；两任务各自保真实输入与采用位置，保冻结标题、旧原件及未解项。
- **RISK-05**：冻结测试与已确认新方向冲突。影响 FR-KR-004/007、AC-KR-005、AC-KR-006；本轮原测试不变，未来迁移仅沿已获真实答复的精确TCR及独立测试owner串行写权；新测试只覆盖新增目标，不用它遮旧失败。
- **RISK-06**：机器结构通过被冒为知识语义/实际复用通过。影响全部 AC；独立读者与实际 consumer 分判，末 Phase 执行必要未闭环 case，未测部分保 incomplete/unavailable。
- **OPEN-01**：工程/三源/精确写集已由006/007/011与作者回源补齐；剩余Design-wiki实际采用参考文件完整差异/许可grant由P1知识owner在实施前核，影响FR-KR-011/AC-KR-004，不能以根SKILL同字节推全包。
- **OPEN-02**：三个真实目标RED已取得009；物理只读/隐藏未建立，owner后续派发主会话，影响全部冻结oracle保护。实施前须验证真实访问边界；未建立如实incomplete，文字禁改不冒隔离。
- **OPEN-03**：迁移许可已由[独立测试答复][test-confirm]取得；剩余为未来独立测试owner保旧字节/真实失败、执行5项窄迁移并判断第6项是否触发。尚无迁移/GREEN事实，不把许可当已完成。
- **OPEN-04**：当前计划已由[计划答复][plan-confirm]确认“记录缺口与负责人后确认并收口”；本轮剩余收口/交接由stage owner承接，未执行不冒已完成。此答复不授权进入build-code或Git。

## 13. 业务影响与回归范围

已有查询/图降级、八类专业职责、真实 reader、bundle/catalog/reuse 登记、反思经验 writer、norm delta/索引及两笔维护产物均在定向回归面。旧历史、七 public runtime、token/API 值及 PB 页面实现保持。旧测试失败不因新目标测试变绿而消失；记录未测/失配到准确 case，不跑无范围全量回归。

## 补充材料

[手工单元][manual]只读：本规格 SCN-007、FR-KR-010、AC-KR-005、AC-KR-006 和非目标处理同一单元，供独立读者逐项比较；作者不改 oracle 求一致。[澄清原件][clarify]区分已定方向、工程事实与本轮阶段身份。后续研究/执行原件沿 task quality 原路径，不新建进度账本。

[decision]: <decision-log.md>
[domain-decision]: <decision-log.md#领域术语变更>
[prd]: <../workflowhub-ui-frontend-release-20261020/prd.md>
[v3]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/decision-log-refs/requirement-index-v3.md>
[u]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/decision-log-refs/requirement-change-log-v3.md>
[clarify]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/build-plan/2026-10-25-003-c02-plan-clarify.md>
[manual]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/build-plan/2026-10-25-002-c02-plan-manual-oracle.md>
[kg]: <../../skills/knowledge-graph/SKILL.md>
[init]: <../../skills/ui-project-init/SKILL.md>
[facade]: <../../runtime/interface/runtime-facade.mjs>

[eng]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/research/2026-10-25-006-c02-plan-engineering.md>
[eng7]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/research/2026-10-25-007-c02-plan-engineering.md>
[req]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/research/2026-10-25-005-c02-plan-requirements.md>
[red]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/research/2026-10-25-009-c02-plan-verification.md>
[ver4]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/research/2026-10-25-004-c02-plan-verification.md>
[ver8]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/research/2026-10-25-008-c02-plan-verification.md>
[upstream]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/research/2026-10-25-011-c02-plan-engineering.md>

[plan-confirm]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/human-confirmations/2026-10-25-002-build-plan-plan-approved.json>
[test-confirm]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/human-confirmations/2026-10-25-003-build-plan-test-migration-approved.json>
[confirm-scope]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/build-plan/2026-10-25-022-c02-plan-confirmation-scope.md>
[review-dispositions]: </Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/quality/evidence/build-plan/2026-10-25-021-c02-plan-review-dispositions.md>
