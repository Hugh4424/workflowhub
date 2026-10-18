# 功能规格：测试能证伪，审查、诊断与浏览器 QA 可靠

读者：本卡实施者、各 Phase 独立审查者和最终验收者。
读完要能：从真实来源找到实现边界、各独立结果与唯一验收判据。

- **功能名**：N3 审查、测试、诊断与隔离浏览器可靠性。
- **来源**：[decision-log.md](decision-log.md) 的 R-001…R-018、U-001、D-001…D-013；父 PRD `specs/archive/skills-framework-redesign-20261014/prd.md#n3` 只读作来源。
- **状态**：build-plan设计材料；成稿审查后仍须真实用户计划决定，开始build-plan不等于批准未展示计划。实施与业务验收未执行，阶段事实由外置任务库保存。
- **材料导航**：需求/场景读第1–5节；独立结果与数据边界读第6–10节；实施读「实现设计」及所属 Phase；判定只读 Appendix A；缺输入先读第12节。导航可从当前标题重生成，不是进度权威。

## 速读卡（30 秒）

用户和审查者需要可信的行为与失败证据，减少“文件写了、测试绿了，所以已经完成”的误判。本卡分别交付审查口径、材料协议、detail去配对、测试证伪、诊断接线、共同简洁视角、完整隔离浏览器检查。采用与来源登记跟随各自首个真实消费者完成；末 Phase 只做一次全 AC 验收。现有工具、入口和事实写者继续负责原职责；没有依据的新控制面不增加。

## 来源与决策映射

本表绑定真实来源与当前裁决；具体行为落点见「需求到任务追踪」，条件只在 Appendix A。D 编号为当前 decision 的人读决定，不新造 ADR；N2合入占用ADR-0045/0046后，本卡原ADR-0045“成本上限不替代质量”与ADR-0046“隔离浏览器与只读票据”现行路径分别为ADR-0047与ADR-0048；ADR-0044保持不变。D-013保留首次确认时的0045/0046历史编号，不将其当作当前文件路径。

| 来源 ID | 决定/原文位置 | FR / AC | source_status / 范围 | 未决/交接 |
| --- | --- | --- | --- | --- |
| R-001 | D-008；父PRD228–234 | FR-N3-001 / AC-001 | current；三维口径；选择表non-goal | OI-006/007欠账 |
| R-002 | D-010；ADR-0044；父PRD236 | FR-N3-002、FR-N3-003 / AC-002、AC-003 | current；路由与配对 | 候选runner与宿主broker来源分别报告 |
| R-003 | D-002、D-004；模块④ | FR-N3-004、FR-N3-010 / AC-004、AC-010 | current；测试证伪、读数 | 六处假绿部分达成 |
| R-004 | 模块②；父PRD234/340 | FR-N3-002、FR-N3-011 / AC-002、AC-011 | current；终末、身份覆盖 | 原件真实可读 |
| R-005 | 模块⑤；父PRD迁移表80/172 | FR-N3-005 / AC-005 | current；诊断 | P5真实步骤接线 |
| R-006 | 模块⑥；父PRD186–187/333 | FR-N3-006 / AC-006 | current；共同简洁视角 | 同一版所有已声明落点 |
| R-007 | D-007、D-013；ADR-0048 | FR-N3-007 / AC-007 | current；完整QA | OPEN-02真实输入 |
| R-008 | D-001、D-011；父PRD664–723 | FR-N3-008 / AC-008 | current；16项首验 | 各单元首次消费者 |
| R-009 | 模块⑧；父PRD749–751 | FR-N3-008 / AC-008 | current；23项保护 | 独立审查裁定 |
| R-010 | D-009、D-010；父PRD193–199 | FR-N3-009 / AC-009 | current；减法/字节 | OPEN-03成本缺字段 |
| R-011 | D-005；父U-020 | FR-N3-010 / AC-010 | current；十红保留 | 变化查因不主动修 |
| R-012 | D-003；父AC-012 | FR-N3-009 / AC-009 | current；收益 | 不以调用数替全部条件 |
| R-013 | D-011、D-012；父PRD184–188 | FR-N3-008、FR-N3-011 / AC-008、AC-011 | current；完整首验 | 共享定序非功能欠账 |
| R-014 | 父OI-029/ADR-0039 | FR-N3-008 / AC-008 | current；证据纪律；新去重器non-goal | 不新增控制面 |
| R-015 | D-006；父PRD505–532 | FR-N3-002、FR-N3-004、FR-N3-006、FR-N3-008 / AC-002、AC-004、AC-006、AC-008 | current；另8条不相加 | 各原consumer完成 |
| R-016 | D-009；ADR-0047；父PRD348 | FR-N3-008、FR-N3-009 / AC-008、AC-009 | current；具名后置；两上限non-goal | OPEN-04 |
| R-017 | V-001/U-001及最新build-plan授权 | FR-N3-008、FR-N3-011 / AC-008、AC-011 | current；分工/完整路线/当批验 | 当前阶段审查/真实计划决定/实际状态handoff后停 |
| R-018 | decision「范围与非目标」 | FR-N3-007、FR-N3-011 / AC-007、AC-011 | current；non_ui | QA夹具不等产品UI |
| U-001 | 当前唯一需求变更原件 | FR-N3-001…011 / AC-001…011 | current；各卡边做边验 | 不以末尾迁移补首验 |

## 1. 需求解释：问题与紧迫性

审查路由的文字、真实派发和材料内容不一致时，读者无法判断是谁读过什么；同模型换角色重复调用也不能直接证明质量增加。测试如果重述实现，行为已坏仍可能显示绿色。诊断和浏览器技能如果只有声明、不能真执行或取消，就会把缺证据误当成功。

本卡沿已确认方向修复这些误导。在真实消费者中验证方法，保留失败和未覆盖；不靠追加审批、全量回归或新的状态系统证明流程运行。原始理由留在 decision-log 的八模块收敛与风险表，本文件负责翻译成实施合同。

## 2. 背景、目标与范围

### 背景

现有 `runSimpleReview`、review材料构建、OCR包注入、三测试方法、诊断方法和隔离QA脚本可复用。成本工具fail-closed/重开、旧浏览器副本退役及图更新是make-decision收口后的已存在改动，不能当本阶段新实施或本卡全验。

### 目标

交付七个可分别观察的结果，每项包含真实使用路径、原始失败语义、适用采用、来源登记和首次验证；最终按同号 AC 读回完整交付。验证结果、独立质量、Git交付和物理清理分别报告。

### 范围内

范围为下列七个产品职责及其当前方法、既有入口、测试和普通登记。完整采用清单与23项保护的来源解析见任务库 `quality/evidence/2026-10-16-build-plan-source-research.md`，其不是完成证据。全局文件边界限定本次实际可写路径；发现额外生产写面先回原owner核来源和真实消费者。

## 3. 用户场景与状态覆盖

### SCN-001：按真实改动选择审查并看懂结果

实施者提供当前改动路径、增删量和具名消费者事实；审查者沿当前配置得到完整材料，能区分盲重建与揭示后的内容，读到真实模型身份、覆盖和原发现。缺影响事实时沿现有保守路线；缺材料/覆盖时保留缺口。关联FR-N3-001/002/003/006/008/011，AC入口见Appendix A同号条目。

### SCN-002：测试在行为坏掉时确实指出问题

测试作者在目标接缝准备具体输入和独立预期，实施者运行真实入口，受控破坏一处行为后观察目标断言，再恢复同一输入核对。执行入口盘点与弱断言判定属于本卡范围，不能把候选数量当坏测试数量。关联FR-N3-004/010，保留原始失败与环境差异。

### SCN-003：从真实失败定位根因

build-code遇测试失败或性能异常时进入现有诊断步骤。错误文本是数据；诊断者建立能捕获症状的回路、最小化、假设、单点修复与清理，不受输出中诱导指令改变授权。性能结论来自具名瓶颈观测。关联FR-N3-005；真实授权和本地诊断保护不下降。

### SCN-004：隔离浏览器检查终止后能安全交回

QA执行者创建本次独立实例、会话与临时目录，实际检查受控页面；登录态需要时仅通过已许可的browser-level只读票据通道导入独立实例。执行成功、失败、取消后，交回本次资源与证据事实，既有用户浏览器及其他并行会话仍可用。关联FR-N3-007；真实站点输入与未观察项由OPEN-02约定。

### SCN-005：验收者核完整交付与剩余限制

最终验收者一次消费各Phase的唯一原件，按Appendix A逐条件核对并只执行必要未闭环case。采用状态、成本字段、已知十红、未生效方法与不可用真实输入分别呈现；部分技术GREEN不能替整卡验收。关联FR-N3-008/009/010/011。

### 状态覆盖清单

- 默认：SCN-001正常路由，SCN-002合法对照，SCN-004受控可用页面。
- 空：SCN-001空findings/未报覆盖分别保存；SCN-004空console须区分页面未加载与确实安静。
- 错误：SCN-002目标RED与环境失败分开；SCN-003错误不伪默认成功；SCN-004失败清理。
- 加载：SCN-004观察加载瞬间console与实际页面就绪；本仓CLI无产品加载视图。
- 取消：SCN-004真取消和资源回收；审查调用方显式取消保原失败，其余已发路线按现合同运行。
- 边界：SCN-001缺位材料/同字节多声明、缺影响面；SCN-004文件目标白名单不可达与设备绑定票据不可迁移。
- 权限：SCN-003输出不扩授权；SCN-004只读目标范围票据、不操控用户页面、不外流秘密。
- 竞态：SCN-004两个会话取消/回收不互杀；共享记录沿现锁串行合入，不后写覆盖。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：现配对函数把direction/detail都列入，公开runner经该条件决定单双派发。
  - **状态**：`verified`
  - **证据**：2026-10-16实读 `skills/wh-review/scripts/simple-review-runner.mjs` 的 `isPairedMakeDecisionInput(input)` 与 `runSimpleReview(input, dependencies = {})`；target包含 `["direction", "detail"].includes(track)`。
  - **关联**：SCN-001、FR-N3-003、AC-003。
- **PFACT-002**：材料规则、provider协议、文档包与代码包注入均已有owner。
  - **状态**：`verified`
  - **证据**：实读 `runtime/review/stage-materials.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/provider-protocol.md`、`tools/cli/stage-runtime.mjs:398` 的具名包body清单。
  - **关联**：SCN-001、FR-N3-001、FR-N3-002、FR-N3-006、FR-N3-008、FR-N3-011、AC-001、AC-002、AC-006、AC-008、AC-011。
- **PFACT-003**：诊断正文有紧反馈回路、动态最小化、三次失败人工裁决与清理，build-code deps已声明诊断，但正文接线需本卡完成。
  - **状态**：`verified`
  - **证据**：实读 `skills/diagnosing-bugs/SKILL.md` 四步骤和 `workflows/build-code/skill-deps.yaml` 的 `actual_failure_reproduction_before_hypothesis`；当前build-code正文未见实际诊断步骤，证据见来源调研。
  - **关联**：SCN-003、FR-N3-005、AC-005。
- **PFACT-004**：历史盘点31个无就近测试目录/161弱断言是候选来源，不直接代表无入口或当前损坏数。
  - **状态**：`inferred`
  - **推断来源与限制**：decision模块④及engineering-research第3/4节。历史ref `251ea7e3970dd2e78ebd6f5f947b77a1f4e23f4b` 为36技能/31无就近测试，当前38/33，新增knowledge-graph/stage-closeout另列；31中四个有脚本、27个方法目录。历史161没有逐项位置原件，另一次历史ref独立重扫所得72候选文件的当前内容有6类语法命中220处，原161成员身份与该72文件无法认证对应；不把220冒161同一集合或坏项数。原逐项位置无法还原则保unknown，由P4作者给影响/下一动作，不称已修完161。
  - **关联**：SCN-002、FR-N3-004、AC-004。
- **PFACT-005**：浏览器原始失败、console能力与假票据实验存在，但不能证明本卡修复后的真实站点可用。
  - **状态**：`verified`
  - **证据**：decision模块⑦引用任务库 `quality/evidence/browser-qa-smoke/`、`browser-console-proof/` 与ADR0048；本次读取原件索引与决策，未把历史GREEN当本次重跑。
  - **关联**：SCN-004、FR-N3-007、AC-007。
- **PFACT-006**：真实站点、可安全读取的票据范围、连接是否弹授权框/横幅尚未输入或目视核验。
  - **状态**：`unknown`
  - **负责人、影响与下一动作**：用户提供站点与许可范围，P7执行者在真实验收前确认并目视；影响FR-N3-007/AC-007，见RISK-02/OPEN-02。
- **PFACT-007**：成本重开后的cacheRead/reasoning仍缺完整来源，当前材料不能给完整收益判定。
  - **状态**：`unknown`
  - **负责人、影响与下一动作**：P8成本验收者消费完整N1/同条件样本并记录缺字段；影响FR-N3-009/AC-009，见RISK-03/OPEN-03。
- **PFACT-008**：本卡不新增产品UI；浏览器页面是验证工具的测试表面。
  - **状态**：`not_applicable`
  - **不适用理由**：原要求R-018为non_ui，当前受影响库存为CLI/方法/QA脚本，既定写集无产品前端；产品UI设计、typed ViewModel、CSS/token与产品视觉对齐无新增对象。
  - **关联**：SCN-004、SCN-005、FR-N3-007、FR-N3-011、AC-007、AC-011。

## 5. 功能需求

### 可信审查、测试与执行

下列FR叙述产品行为，条件和预期证据只在Appendix A。真实使用方按GLOSSARY唯一定义判定；依赖声明、测试调用或文件存在不能独自证明已生效。

- **FR-N3-001**：用真实三维改动事实解释审查投入及保守回退，保持当前文字口径范围。
  - **事实/场景**：PFACT-001、PFACT-002；SCN-001。
  - **来源**：R-001；D-008。
  - **验收**：AC-001；条件见Appendix A。

- **FR-N3-002**：配置路由、两步材料位与覆盖读回语义一致，保现三条件结论契约，终末审查材料完整且来源可读。
  - **事实/场景**：PFACT-002；SCN-001。
  - **来源**：R-002、R-004；D-011；父PRD336。
  - **验收**：AC-002；条件见Appendix A。

- **FR-N3-003**：取消detail无信息重复，direction配对保持，调用行为可观察。
  - **事实/场景**：PFACT-001；SCN-001。
  - **来源**：R-002；D-010/ADR0044。
  - **验收**：AC-003；条件见Appendix A。

- **FR-N3-004**：三测试方法与实际目标测试能证伪，原候选逐项判定、纯方法不造入口。
  - **事实/场景**：PFACT-004；SCN-002。
  - **来源**：R-003、R-015；模块④。
  - **验收**：AC-004；条件见Appendix A。

- **FR-N3-005**：诊断在既有build-code步骤真实触发，输出不改变授权，性能建议有测量。
  - **事实/场景**：PFACT-003；SCN-003。
  - **来源**：R-005；模块⑤。
  - **验收**：AC-005；条件见Appendix A。

- **FR-N3-006**：一版simplicity承接三来源和真实包注入，以同根因处理有效发现。
  - **事实/场景**：PFACT-002；SCN-001。
  - **来源**：R-006、R-015；模块⑥。
  - **验收**：AC-006；条件见Appendix A。

- **FR-N3-007**：隔离QA提供完整会话/票据/取消/回收行为与真实观察边界。
  - **事实/场景**：PFACT-005、PFACT-006、PFACT-008；SCN-004。
  - **来源**：R-007、R-018；ADR0048。
  - **验收**：AC-007；条件见Appendix A。

- **FR-N3-008**：各采用项在原consumer首次交全，23保护按实际影响核，未生效如实标明。
  - **事实/场景**：PFACT-002、PFACT-004；SCN-005。
  - **来源**：R-008、R-009、R-013、R-014、R-015、R-016、R-017；D-001、D-006、D-011、D-012。
  - **验收**：AC-008；条件见Appendix A。

- **FR-N3-009**：减法、成本和同cohort审查质量以完整口径分别呈现，缺源与未测保真实，不以调用数或成本改善替质量不降。
  - **事实/场景**：PFACT-007；SCN-005。
  - **来源**：R-010、R-012、R-016；D-003、D-009、D-010。
  - **验收**：AC-009；条件见Appendix A。

- **FR-N3-010**：已知红、未知与通过可区分，既有保护不因转绿被弱化。
  - **事实/场景**：PFACT-004；SCN-002、SCN-005。
  - **来源**：R-003、R-011；D-002、D-004、D-005。
  - **验收**：AC-010；条件见Appendix A。

- **FR-N3-011**：每项改动在任务工作区真实路径生效并可复现，实际限制与最终交付可读。
  - **事实/场景**：PFACT-002、PFACT-008；SCN-001、SCN-005。
  - **来源**：R-004、R-013、R-017、R-018；U-001。
  - **验收**：AC-011；条件见Appendix A。

## 6. 模块划分

七个独立结果为P1审查口径、P2材料协议、P3配对、P4测试证伪、P5诊断、P6共同简洁视角、P7隔离QA；模块⑧的采用、保护和登记是各结果自身责任，不另造末尾迁移单元。P8只有一次全AC验收，消费已经完成的原件并补必要未闭环case。物理权威分别为 `phases/P1-审查投入口径.md`、`phases/P2-审查材料与路由.md`、`phases/P3-细节审查单次调用.md`、`phases/P4-测试能够证伪.md`、`phases/P5-诊断真实接入.md`、`phases/P6-共同简洁审查.md`、`phases/P7-隔离浏览器可靠回收.md`、`phases/P8-整卡独立验收.md`；纯指针index只引用这些实际契约。

P1/2/3/6各有独立判定对象，分别能观察口径回退、分位投递读回、单双派发、真实包lens与归并，S1–S4没有要求把这些合成一个大Phase。P7的隔离、取消、票据和cleanup共同判断一个完整会话，拆成只交脚本/只交文字无法满足同一AC-007，按S1/S2合并。P8不重新首验各采用，也不能以只读聚合声称端到端运行。

## 7. 关键实体

- **审查请求和材料位**：复用当前stage/track、materials和provider配置；原始要求、客观事实、当前选择各自按真实职责投递。没有新schema或持久请求对象。
- **审查原始结果**：复用findings、identity、过程终态、usage和覆盖事实；未报覆盖保持未确定。处置沿原finding，不新建verdict/reconciliation对象。
- **测试观察**：输入、独立预期、目标断言、实际退出与唯一原件；环境不可用不转成目标RED。
- **隔离会话**：本次会话标识、引擎、受控资源及临时数据目录；资源归本次执行者，不以进程名或全机同类进程认归属。
- **票据**：目标站点所需范围的短期秘密；值只存在隔离执行内，报告只允许数量、域名和属性存在性。

## 8. 数据和生命周期

产品不新增持久进度容器。review/test/evidence继续由既有任务事实与原件owner保存；相同字节先比较后复用引用。禁止复制工作树或目录快照，禁止镜像同一输出；未知去重原因保unknown。

QA临时票据、会话状态和本次临时目录随成功/失败/取消清理；证明输出写在清理范围外。现历史失败、review原件、已被引用证据和用户浏览器数据保留。共享catalog/reuse/notices/move-map沿现有锁读回逐项合入，不以新日志维护双权威。

父PRD134/336的“两轮修复”指已经授权的两轮基线测试修复，原件为父任务 `quality/tests/2026-10-14-004-baseline-repair-verify.txt` 与 `quality/tests/2026-10-14-005-oi034-repair-verify.txt`（父decision OI030/031/034、PRD769）。这些既有实现和失败来源保留，剩余十红按U-020处理；不是新review修复轮数、debate轮次或额外许可。

## 9. 兼容性预留

公共runtime仍为既有七类命令；review单个公共group与原transport边界保持，make-decision方向内部顺序不拆成多个公共请求。build-plan/code/verify原本不配对，不把它们重复列为待取消。pre/history材料只读，post只产spec、独立Phase和纯指针index。用户浏览器、其他任务会话、合法输入与已交付绿行为保持。

## 10. 明确不做与默认必须成立

### 明确不做

以下是唯一非目标列表，继承当前decision范围：不新增阻断门、不把只报告检查改退出失败；不实现推理预算/输入上限、任意时长停审、按异源下限取消；不落地三维选择表、矩阵列、评分器或selector；不改仓外宿主配置凑数字；不为纯方法造执行入口；不主动修十红或reference-audit九项基线登记；不使用账号密码、不在用户真实浏览器开标签或页面attach、不关闭用户Chrome、不向第三方同步cookie；不增加第八公共命令、新schema、常驻服务、双写桥或持久进度对象；不替N10接检查工具；不清洗历史/归档/原失败；不把QA夹具扩成产品UI。本阶段不实施生产行为，不自动进入build-code或close。

### 默认必须成立

既有输入/路径/权限/Git保护、目标域名白名单、真实失败和原始出处保留。独立来源/上下文承担质量裁决；单源有效发现不丢，provider不可用不漂白。实现者不能修改被冻结oracle换GREEN；不明保护范围先回原owner核来源，安全修复与事实报告仍继续。

## 验收流程

每个Phase从场景找到FR与Appendix A同号AC，在真实consumer首次交付其适用采用/来源/负例。执行者保存一次原件，独立审查者按真实字节与限定范围给质量事实。P8按AC逐条件消费这些原件，补必要未闭环行为，把技术子条件、独立人读效果和真实用户输入的结果分别说明。全部适用条件齐备才称该AC通过；缺源保持具体缺口。

## 测试标准

| 项目测试面 | 适用/理由 | oracle与证据类型 | Phase命令权威 | 覆盖限制 |
| --- | --- | --- | --- | --- |
| CLI/Node行为与派发 | P3生产runner/P7会话工具 | 冻结行为断言、退出与调用轨迹 | P3/T003、P7/T007的gate_cmd | 受控provider边界不证明外部理解；受控引擎不证明真实站点 |
| 来源元数据技术契约 | P2/P5/P6当批catalog登记；P4/P7各自来源登记 | P2/P5/P6沿冻结metadata测试核YAML、固定源/许可/包pin/生产consumer与缺项反例；P4/P7由独立读者逐行对照固定来源原件核相同字段及采用内容，并用缺source/adopted/consumer/pin的只读反例确认缺项 | P2/P5/P6对应metadata filter；P4/P7首验记入各自ORACLE效果记录 | 只证明来源登记完整，不证明实际调用、方法质量或AC整体通过 |
| 方法/自然语言真实消费 | P1/P2/P4/P5/P6 | 完整实际材料独立读者、具名正反例/调用原件 | 各Phase Task的gate_cmd与人工oracle | 静态结构或依赖声明不能替语义效果 |
| 行为测试与受控变异 | P4真实选定1–2接缝 | 破坏行为目标RED、恢复同测试GREEN | P4/T004 | 不全量变异；161候选不是161缺陷 |
| 浏览器可见面 | P7测试工具的真实页面/会话 | 隔离前后、页面/console/errors、取消与cleanup后证据 | P7/T007 | 三源非产品UI仍须该面真浏览器E2E；登录/横幅见OPEN02 |
| 来源/登记/保护 | 每个采用结果当批核 | 源差/notice/consumer读回、23项保护比对 | P1–P7各Task；P8读回 | 单独字样命中不能证明生效 |
| 同cohort审查质量 | P2/P3真实正常审查原件、P8独立逐问题比较 | 同材料/contract与配置条件、有效发现/误报/可证遗漏、失败与未定原件 | P8/T008「同cohort审查质量比较」 | baseline缺失/不可比/N不足为incomplete，dispatch或成本改善不证明质量 |
| 成本/减法 | P3/P6原件、P8同条件比较 | 完整N1来源、次数/波动/缺字段与字节差 | P8/T008 | 缺usage不宣净消耗不劣化 |
| 产品前端组件/视觉 | N/A：无产品前端改动 | 三源范围事实 | 当前spec写集与来源表 | QA页面截图不是产品视觉验收 |

N2 合入后的来源约定也适用于本卡写入的 GitHub `upstream`：必须附非空 `adopted` 描述数组。N3 方法采用仍写入既有 `capability_decisions` 的 `status: absorbed` 行，不另建 `skills[]` 项或第二套来源表；`content_sha256` 只用于真正 vendored 的内容，本卡未 vendored 的上游不造该指纹。P2/P5/P6冻结测试验证字段形状及缺失反例，独立读者还须核每项说明确实指向来源章节与本地采用内容；P4/P7同样逐项核坐标、许可、采用内容和consumer。N2 portability 测试只遍历 `skills[]`，不能替代这些N3 absorbed记录的验收。

### 验收对象

本对象指计划中的真实CLI行为测试；`not_run`只说明尚未执行实施验收。它不声明浏览器环境健康或AC-007已通过。

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-n3-review-test-diagnosis-qa-20261016",
  "state": {"execution": "not_run", "scope": "N3 planned behavior acceptance"},
  "cli": {
    "command": "npx vitest run tests/review/n3-detail-single-dispatch.test.mjs",
    "entry_ref": "cli_entry",
    "sample_ref": "cli_sample",
    "oracle_ref": "cli_oracle"
  },
  "owner": "N3 build-code执行者"
}
```

checker的调用内sources应从下表实际读取，不把本段标签当三源证明；引用可解析材料本身，不新建验收对象文件。

| sources key / 角色 | 真实来源及读取范围 | scope/理由 |
| --- | --- | --- |
| raw_requirement | decision「任务身份」「范围与非目标」、R-018；父PRD N3卡331–350 | ui_scope=false；方法/CLI/QA可靠性，没有新增产品页面 |
| project_inventory | `package.json` scripts与依赖、本规格「全局文件边界」对应的当前方法/脚本库存；P4原31目录盘点另有原件 | ui_scope=false；本次受影响库存是方法、Node/shell与QA工具，没有产品组件/样式写集 |
| planned_frontend_fact | 本规格「全局文件边界」「明确不做」及P7真实写集 | ui_scope=false；既定产物无产品前端，QA受控页面是测试输入 |
| cli_entry | `skills/wh-review/scripts/simple-review-runner.mjs` 的 `runSimpleReview(input, dependencies = {})` | 实际runner；默认宿主主工作区链路范围另披露 |
| cli_sample | `tests/review/n3-detail-single-dispatch.test.mjs` 的 `dispatch(track)` 输入与受控group | 真实已写测试样本，两配置profile；不复制秘密或宿主配置 |
| cli_oracle | 同一测试 `ORACLE-N3-DETAIL-ONCE`、`ORACLE-N3-DIRECTION-PAIRED` | 独立次数/role断言；规划阶段RED原件由原测试作者保存 |

三来源实际hash、读取范围、checker输入/返回/exit由主会话保存唯一执行原件；本spec不复制模板checker JS。真实浏览器route、站点票据许可范围与目视输入不能从CLI对象推定；提供者和执行时点见OPEN02。

## 架构边界

产品边界是使用者能看见可信材料、行为和失败；工程边界是现有方法、runner、包注入和QA工具各自的owner。审查器只给限定包内建议，真实运行由测试现场负责。测试/审查/图/成本都产事实，不成为继续工作的许可证。

## 实现设计（全局权威）

### 代码锚点

2026-10-16实读锚点，行号只便于定位、会漂移；契约以符号与行为为准。

| 现有路径/符号 | 现状与选用方式 | consumer/影响 |
| --- | --- | --- |
| `skills/wh-review/scripts/simple-review-runner.mjs`：`isPairedMakeDecisionInput(input)`、`runSimpleReview(input, dependencies = {})` | P3只缩配对track分支，保公开runner受控transport seam | wh-review公共group；AC-003 |
| `skills/wh-review/scripts/review-materials.mjs`：`validateDirectionReviewInput({ materials } = {})`、`buildPlanningArtifacts`、`selectReviewerSkills` | P2说明材料位、P6消费现有lens；P6仅修mini design实际kind分支，保持其它组包/validator职责，不另建validator | 现有文档审查包；AC-002、AC-006 |
| `runtime/review/stage-materials.json`：`stages.make-decision.tracks.direction`、`stages.build-plan.profiles.post` | 读已有required/optional/generated/forbidden，不加选择表或新字段 | 材料producer；保护逐字见下文 |
| `tools/cli/stage-runtime.mjs`：OCR包body检查附近 | 现有代码包要求simplicity/review正文；只从真实包读回，不改executor路径 | OCR代码包；AC-006、AC-010 |
| `workflows/build-code/SKILL.md`、`skill-deps.yaml` | P1口径、P5真实诊断触发；保已存在的诊断deps | build-code现场步骤；AC-001、AC-005 |
| `skills/diagnosing-bugs/SKILL.md` 四步 | P5窄加不可信输出/性能来源，保根因回路 | build-code现步骤；AC-005 |
| `skills/simplicity-guard/SKILL.md`：Packet lens contract、写作调用点 | P6同版融合并删重复；不单独起review | 文档/代码包与写作步骤；AC-006 |
| `skills/isolated-browser-qa/scripts/browser-qa-context.sh`、`browser-qa-cleanup.sh` | P7扩现入口的会话和票据生命周期；临时资源只认本次归属 | 隔离QA；AC-007 |

### 2026-10-17已批准的P2/P8窄修订

真实授权：主会话用户消息 `msg_01a145c3-9dd4-74c2-8d08-9614db7edbf2`，取证原件 `quality/evidence/2026-10-16-187-p2-p8-narrow-plan-approval-source.json`；scope分别为“批准窄扩写集并修复（推荐）”与“允许核现存后补采（推荐）”。需求/验收authority仍是当前decision、Appendix A与P2/P8原合同。P2新增既有broker/attachments/必要AG/OpenCode adapter及具名定向测试写集，精确动作、条件client写面、先RED后生产及硬只读失败处理见P2「已批准窄修订」。不改一次公共group、direction独立role、安全边界及原冻结oracle。

P8先认证现存正常review；不足时允许按P8「补采前冻结同cohort输入」预先冻结条件后补采真实baseline/candidate连续三对。只解除原“不为凑样本另发provider”的执行限制，不降低N≥3、可比性、逐风险独立质量、成本四组或失败分母要求；不得先跑再改标准。原161、真实登录、23保护与G2历史冲突不在这次修订范围，仍保原事实。

### P2完整审查包预读的现有consumer窄修（2026-10-18）

沿本轮用户已接受的P2 B/C完整包预读根因与最小修复、D-011及既有AC-002/009，P2窄增既有 `tools/cli/stage-runtime.mjs` 与独立新增 `tests/contract/n3-review-material-observer.test.mjs` 写集。原public review consumer只在真实bundle构建后/provider准备前提供可选host只读 `onReviewMaterials({materialId,manifest,readMaterial})`；完整成员读回后caller主动abort原signal，由现review owner记录真实取消/unavailable并finally清理，不新增公共动作/参数、runner、writer、schema、gate或持久对象。精确读边界、独立先RED、默认路线保护、B/C现最小闭包与保留/删除条件见P2「完整审查包预读的现有consumer窄修」。187原批不冒此二路径的逐名授权；新登记不代替实现/验证，不改AC、冻结oracle、硬只读、成本/质量分母或旧103/139失败。P8不承担生产写入，仍只消费原件。

### P2共享投影既定语义缺陷修复（456/458）

456已定位当前共享脱敏producer误吞真实JS执行声明的await，破坏AC-002送审语义。按完整N3目标及D-011自身问题修复，仅新增P2既有 `runtime/review/provider-material-projection.mjs` 与 `skills/wh-review/scripts/__tests__/material-redaction.test.mjs` 写集，独立458先RED/正反保护与实际egress，原P2owner后修；精确consumer、词法边界与保留删除条件见P2“本轮自身缺陷窄修”。187原答复不冒逐路径批准shared runtime。455 OCR检测器另行诊断，不取消fullread、秘密、硬只读或旧失败，不改AC/方向/路由/新schema。

483独立窄TCR确认139/140同四旧fixture失败属于当前consumer迁移遗漏，479已排除由456新修复引入。P2仅迁material-redaction中1个真实catalog pin来源fixture及原P4所属review-semantic-projection中3个verify-code implementation_assessment fixture；原相等/不等、host-only/snapshot不入、秘密/路径强断言保持，其它旧case不动。精确条件与跨P4定序归属见P2“四个既有fixture的当前契约迁移”，不扩production，不改AC/路由/冻结oracle或provider重采。

### P6 mini design既定合同修复（2026-10-17）

235实际caller与239独立读回发现mini_task.design合法默认包被codePacket注入simplicity，违背P6原“design无lens”合同。按原用户完整实现目标、D-011及该原合同，P6窄扩既有 `skills/wh-review/scripts/review-materials.mjs` 与 `tests/contract/review-materials-contract.test.mjs`，由原P6owner修实际mini kind分支；不是P2最新答复另授的文件范围。授权核对240与原声明越界事实241分别保留。具体独立先RED方案/consumer/保留删除条件见P6「mini design既定合同的根因修复」。不改AC、八入口原表、stage identity、广义documentFace或direction盲边界，不加schema/字段/runner/public命令。

### P4当前纯.md G2合同的根因修复

按当前P4纯.md要求及原用户完整实现目标，独立370确认需收窄既有G2 reader，不因旧N2合法scope-approved而免当前交付；不是N2未授权归责。P4窄增 `runtime/stage/stage-content-contracts.mjs` 写集；模板仅解除允许注释YAML/YML豁免那一句的保护，其它标题/示例/字段保留。两原已声明测试的六个positive须独立exact TCR先冻结拒绝期望并取目标RED，再原owner修runtime/template与同oracle GREEN，保纯.md和正常YAML行为RED/GREEN正控。完整owner/consumer、测试、保留删除与scope来源见P4「当前pure.md G2合同收窄」。不改AC、旧decision、四冻结oracle或历史十红，不加新gate/schema/对象；P8付费cohort修后重新freeze，当前0provider。

### G2修后当前P4采样scope对齐

既有P4写集已纳入stage-content-contracts，纯指针index逐路径保持与P4一致。411只读取当前真实声明/源：83声明、19changed，旧306/363的82/16/29不作为当前输入。按P8「本次review方法分量预冻方案（G2修后）」最终重建正常CLI两投影后再冻结成员数与源hash；169原合同和四风险oracle语义不变，已修G2候选不要求产旧bugfinding。P1/P2/G2代码交付与本规划材料交付后，原dispatcher依已授权次序补采；技术preflight、字节减法、单AG真实三段均不代全局质量/成本/真实登录或完成。当前0provider、未确认完成事实保留。

### 原需求与采用项的具体首验导航

原PRD为 `specs/archive/skills-framework-redesign-20261014/prd.md`（SHA256 `b156f1c9096b40b2f82e38490b0974fb81677df1e838167d82904c7a241ceb5c`）。任务库两份独立回源审计 `quality/evidence/2026-10-16-build-plan-original-prd-requirements-audit.md`（`247fe9e47a1c6a77d44768dbf531f3e6502ed19c47401fb0d66e32b985892ada`）和 `quality/evidence/2026-10-16-build-plan-original-prd-adoption-audit.md`（`772047c69a572140b79854cc793b3951d89769e97006ea9de9644a113fb5e029`）是原件；其42语义单元与24来源行是不同分母，不能由零整条遗漏推断无设计缺口。本表把已指出的缺口落实到原Task的动作/正反输入/首consumer/首验；只作导航，不替代各卡完整程序，也不宣称实施或效果已完成。`show-me-your-work` 是17来源表分配给N3的补充来源，不计入54项主表技能；P2只将其方法用于现有审查证据展示，不新增独立技能、宿主transcript扫描或审查路线。

| 原义与适用AC | 首writer及完整首验的物理权威 | 全局边界 |
| --- | --- | --- |
| read/unread/undetermined及read_confirmed/null；AC-002 | [P2](phases/P2-审查材料与路由.md)「覆盖读回与可比较审查原件（T002）」；沿既有providerCoverage/adapter分别读回三类材料及未证读原值 | 不新增coverage键，不由送达推已读；P8读同一原件 |
| blast-radius / attack-the-premise / architect / arena；AC-002、AC-008 | [P2](phases/P2-审查材料与路由.md)「原采用项逐项实施与首验（T002）」；同一次完整独立消费中逐项核安全事实、前提反证、结构取舍与条件适用 | 只有grep/行锚为unproven；arena无真实候选/judge consumer只落完整方法、未生效，不造框架或轮次 |
| setup / code-review-and-quality / constraint；AC-004、AC-008、AC-010 | [P4](phases/P4-测试能够证伪.md)「采用方法与首次消费（T004同一oracle的具体子条件）」完整持笔verify唯一正文与review条件指针，并在当卡首验两consumer；P2仅导航不交半份 | P4同次核pass/fail/pass、五类削弱与unknown、条件式changelog/lockfile/行为对照；无真实依赖升级只豁免实际升级，不免完整方法 |
| matt/pstack tdd、E5/E6；AC-004 | [P4](phases/P4-测试能够证伪.md)「采用方法与首次消费（T004同一oracle的具体子条件）」 | backend唯一正文、其它真实指针；三反模式逐例、缺RED真实原因/邻近检查及限制，原161身份不得用当前220替代；P4逐行验收7个外部方法来源的固定坐标、采用说明与consumer |
| interrogate / subtract / foundational；AC-006、AC-008 | [P6](phases/P6-共同简洁审查.md)「interrogate 的三问与差异样本（T006）」与「subtract/foundational 的同一落点与首验（T006）」 | 幂等/并发/简化与归并分别验；foundational去重进既有P0/P1并保来源，动态consumer与无需求validator负例，不新建规则/账本 |
| 各stage/track现simplicity消费者；AC-006、AC-011 | [P6](phases/P6-共同简洁审查.md)「各真实 stage/track 的适用面与实际包（T006）」 | direction防泄漏、适用detail/build-plan/code/verify/build-prd等逐包给依据；不以一包外推全部，不恢复退役stage |
| browser→verify指针、create/maintain→reuse、dry-run条件；AC-007、AC-008、AC-011 | [P7](phases/P7-隔离浏览器可靠回收.md)「三来源的具体采用与首次完整消费」 | P7只读verify现UI指针，QA/reuse同卡维护及首验；dry-run先核真实consumer，无则未生效；P7逐行验收3个外部来源的固定坐标、采用说明与consumer，并将两个新helper写入bundle `files` 且由resolver回读；卡死/地图漂移/产品回归分诊不互代 |
| 模板trace更强保护；AC-004、AC-008、AC-010 | [P4](phases/P4-测试能够证伪.md)「Phase模板允许修改段与保护读回」 | 仅窄改测试提示/指针；现命令执行事实与失败归属保留，历史帧归属来源unknown，不造trace系统 |
| 同cohort审查质量；AC-009 | P2「覆盖读回与可比较审查原件（T002）」和[P3](phases/P3-细节审查单次调用.md)的真实审查质量取证→[P8](phases/P8-整卡独立验收.md)「同cohort审查质量比较」 | 只用正常审查唯一原件，连续N≥3含失败/不可用；有效发现/误报/可证遗漏与成本分别判，缺baseline不可比为incomplete |

共享写主保持P2→P4→P6→P7：P2先交review/verify/AGENTS审查协议，P4完整写verify测试方法与review条件指针并保前卡正文，P6回读后合AGENTS/protocol的共同方法，P7只读verify并交QA/reuse。它是共享当前字节的真实集成顺序，各卡body可提前独立准备；不是额外业务依赖或未来补首次接线的许可。

### 接口与失败语义

选用“既有owner窄扩展”。新增browser-qa-session/tickets只承接当前QA真实生命周期缺陷，归P7执行者；不注册为公共runtime命令或新持久对象。现有包装脚本调用这两个本地工具，场景结束删除临时运行数据；替代旧强杀/误导票据路径，删除条件为所有现consumer已由经审查的新实现承接且无独立consumer。

QA沿现context输出exports的默认行为保兼容，显式 `--run --url URL --evidence-dir DIR -- argv...` 才进入本次生命周期。session先打开隔离about:blank并预取owned `agent-browser get cdp-url`，再执行可能占用daemon锁的操作；取消用独立socket向该owned实例发送Browser.close，不能busy后才排队获取endpoint。启动竞态无endpoint时只对已核PID/启动时间/精确data-dir的owned主browser发TERM并等待；无法回收就报失败，不升级整树SIGKILL或搜杀全机Playwright。

票据真实输入与失败边界以[ P7「真实票据输入与传递」](phases/P7-隔离浏览器可靠回收.md)的caller输入表为唯一细约定：同一context `--run --url URL`入口只在明确许可后接受`BROWSER_QA_AUTH_MODE=read-only-ticket-export`；`BROWSER_QA_TICKET_SOURCE_WS`仅caller→runner短期环境输入，须显式loopback端口/browser endpoint且无userinfo/query/fragment，不扫描默认9222，并从engine/scenario环境剔除。`--url`是普通cookie唯一scope（origin+pathname/hostname/pathname/secure），拒query/fragment及越白名单；可选`BROWSER_QA_TICKET_TOP_LEVEL_SITE`只能由caller提供已知获准https site，缺值丢分区cookie并保unknown，不能猜PSL；有值须域点边界及partition规范精确相同、ancestor=false。全context瞬时读取须另有真实许可，receiver为不同owned实例；缺source/许可为unavailable且非零，不回退none。source URI连接能力的同机可信进程边界和逐项校验沿P7，不把URI当cookie payload或宣称环境不可见。

tickets的窄接口为 `filterTargetCookies(cookies, scope)` 与 `transferTargetCookies({source, receiver, scope, signal, report})`。CDP Storage.getCookies没有URL/domain参数，源全context响应只可在用户已许可的源适配器内存瞬时出现，按明确目标URL的host-only/域名点边界、path边界、secure/https、partitionKey和有效期筛选后才传owned receiver；若许可不覆盖该瞬时读取，此通道unavailable，不能声称服务端按域导出。Cookie→CookieParam只映射明确白名单字段，不spread响应；cookie值/原CDP payload不经argv/env/文件/stdout传递，finally释放内存。source只允许版本/目标查询/getCookies；setCookies和Browser.close只对不同的owned receiver，异常只报受控方法/错误码，不序列化request/response。设备绑定、opaque分区及未支持的localStorage/IDB保持未达成，不改密码/复制profile路线。

数据流为真实diff/材料→当前review配置/包producer→单公共group与原始结果→主会话具名处置。P3只改变detail进入哪个已存在分支。宿主third_review.command的主工作区绝对路径只选择broker，不意味着候选WorkflowHub runner不生效；候选入口/相对import显式运行可验证配对。必须分列cwd、入口realpath/hash与实际broker来源，不改宿主配置。诊断数据流为build-code现失败→现诊断四步→回归/原症状观测；输出诱导不能改变任务。QA数据流为context/target→独立会话→受控操作→终态/取消→同会话回收→清理外证据读回，票据只在隔离运行内短暂存在。

失败语义复用当前明确错误：缺材料/权限/来源保具体unavailable/incomplete，未报保未报；空发现不等质量通过；目标断言失败与环境失败分开；取消保已经发生的动作。现协议的provider真实终态、PROCESS_STALLED和owner丢失回收保持，本卡不另加固定墙钟终止或换provider兜底。

### 全局文件边界与依赖

全局路径逐项列出，Phase写集必须为子集；材料文件与任务证据各由既有owner写入，不扩大生产写面。

**NEW（生产）**：`skills/isolated-browser-qa/scripts/browser-qa-session.mjs`；`skills/isolated-browser-qa/scripts/browser-qa-tickets.mjs`。唯一owner P7，consumer为同技能现包装脚本，测试为冻结生命周期测试与真实QA；同Phase登记move-map/skill-bundle与notice，不留末尾登记。`skill-bundle.json.files` 必须列出这两个相对路径；`sources` 继续指向 `../catalog.yaml#skills.isolated-browser-qa`，不复制来源登记。

**P7必要现有owner接入（513/514设计，当前已实现有限消费）**：新增唯一 `skills/isolated-browser-qa/scripts/browser-qa-browser-use.py`，由session.mjs唯一生命周期owner管理adapter与scenario临时CLI两个caller；现公开parser/send_command/SessionInfo/handler接入同SDK，不调用main/ensure/migration，不新长期服务/QA入口。真实shell、统一cwd、双端同session、typed失败、原票据/取消/导航redirect、认证正PID TERM及秘密边界依P7该节与独立514。原实施者已写bundle.files，571核实际resolver闭包；当前176为冻结16＋55完整通过，179 SDK-await与180 FIFO分别定向通过，17日001真实source三终态通过（013独立增量、014 first-owner当前小结），不是单次57全跑；173及179/181–183原失败保留，202真实登录unavailable、168旧root unknown与057覆盖限制不变，新版17-007 OCR已settled，实际 `quality/reviews/2026-10-17-003-build-code-phase-p7.json` unavailable（Kimi403/AG guardfailed）；015两项minor已由原writer最小修，17日002清理8/8及003依赖locator定向pass，`quality/evidence/2026-10-17-019-p7-ocr-minor-fix-independent-readback.md`已独立确认两项fixed，定向原件为 `quality/tests/2026-10-17-002-p7-minor-cleanup-targeted.json`及 `quality/tests/2026-10-17-003-p7-skill-dependency-locator.json`，不改变正式OCR unavailable；整P7及AC-007/008/011仍incomplete；现resolver/release闭包足够，不扩deps/package/resolver；仅第24具名TCR，其余27/冻结16保持，不改AC或预写验收。

**NEW（预写测试，build-plan作者持笔，后续冻结）**：`tests/review/n3-detail-single-dispatch.test.mjs`；`tests/integration/n3-browser-session-lifecycle.node-test.mjs`；`tests/integration/n3-browser-ticket-boundary.node-test.mjs`；`tests/contract/n3-adoption-metadata.node-test.mjs`。

**MODIFY（全局精确路径）**：下表来自已写物理Phase的契约头联合去重；P4候选只有确认真弱、保护范围允许且既有test-change审查成立时才局部修改，未确认默认不改。两个保护文件保在只读候选分类中，已从写集排除。

| 精确路径 | 持笔Phase/顺序 |
| --- | --- |
| `skills/third-review/lib/broker.mjs` | P2（本次批准窄修订） |
| `skills/third-review/lib/attachments.mjs` | P2（本次批准窄修订） |
| `skills/third-review/lib/adapters/antigravity.mjs` | P2（本次批准窄修订） |
| `skills/third-review/lib/adapters/opencode.mjs` | P2（本次批准窄修订） |
| `skills/third-review/lib/adapters/opencode-supervised-cli.mjs` | P2（本次批准窄修订） |
| `skills/third-review/test/broker.test.mjs` | P2（本次批准窄修订） |
| `skills/third-review/test/attachments-protocol.test.mjs` | P2（本次批准窄修订） |
| `skills/third-review/test/antigravity-adapter.test.mjs` | P2（本次批准窄修订） |
| `skills/third-review/test/adapters-health.test.mjs` | P2（本次批准窄修订） |
| `skills/wh-review/scripts/review-provider-client.mjs` | P2（条件写集：仅实际集成证明需要，默认不改） |
| `skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs` | P2（条件写集：仅实际集成证明需要，默认不改） |
| `runtime/review/provider-material-projection.mjs` | P2（456共享producer词法语义窄修；秘密/私有路径保护不降） |
| `skills/wh-review/scripts/__tests__/material-redaction.test.mjs` | P2（458新增oracle保持；483仅1个旧URL来源fixture精确迁移，其余旧case不改） |
| `skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs` | 原P4候选分类保留；483仅3个旧integration fixture迁现verify-code，由P2定序执行，原强方向不变 |
| `skills/wh-review/scripts/review-materials.mjs` | P6（mini design实际kind分支窄修） |
| `tests/contract/review-materials-contract.test.mjs` | P6（独立预写mini design目标RED/同oracle GREEN） |
| `runtime/stage/stage-content-contracts.mjs` | P4（当前纯.md G2既有reader窄收） |
| `AGENTS.md` | P2 → P4 → P6 |
| `THIRD_PARTY_NOTICES.md` | P2 → P4 → P5 → P6 → P7 |
| `core/__tests__/check-anti-host.test.mjs` | P4 |
| `core/__tests__/local-skill-resolver.test.mjs` | P4 |
| `core/__tests__/validate-contract.test.mjs` | P4 |
| `core/__tests__/workspace-manager.test.mjs` | P4 |
| `docs/architecture/move-map.json` | P2 → P4 → P5 → P6 → P7 |
| `docs/standard-workflow.md` | P1 |
| `skills/backend-testing/SKILL.md` | P4 |
| `skills/catalog.yaml` | P2 → P4 → P5 → P6 → P7 |
| `skills/decision-log/SKILL.md` | P6 |
| `skills/diagnosing-bugs/SKILL.md` | P5 |
| `skills/frontend-testing/SKILL.md` | P4 |
| `skills/fullstack-slice-testing/SKILL.md` | P4 |
| `skills/isolated-browser-qa/SKILL.md` | P7 |
| `skills/isolated-browser-qa/__tests__/skill-contract.test.mjs` | P7 |
| `skills/isolated-browser-qa/references/agent-browser.md` | P7 |
| `skills/isolated-browser-qa/references/auth.md` | P7 |
| `skills/isolated-browser-qa/references/browser-use.md` | P7 |
| `skills/isolated-browser-qa/references/fallback.md` | P7 |
| `skills/isolated-browser-qa/scripts/browser-qa-cleanup.sh` | P7 |
| `skills/isolated-browser-qa/scripts/browser-qa-context.sh` | P7 |
| `skills/isolated-browser-qa/scripts/browser-qa-doctor.sh` | P7 |
| `skills/isolated-browser-qa/skill-bundle.json` | P7 |
| `skills/reuse-registry.md` | P2 → P4 → P5 → P6 → P7 |
| `skills/review/SKILL.md` | P2 → P4 |
| `skills/simplicity-guard/SKILL.md` | P6 |
| `skills/spec-plan/templates/phase-template.md` | P4 |
| `skills/testing-system-blueprint/SKILL.md` | P4 |
| `skills/third-review/test/card09-orphan-reclaim.test.mjs` | P4 |
| `skills/wh-review/SKILL.md` | P2 |
| `skills/wh-review/contracts/provider-protocol.md` | P2 → P6 |
| `skills/wh-review/scripts/__tests__/review-output-embedded-json.test.mjs` | P4 |
| `skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs` | P4 |
| `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs` | P4 |
| `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` | P3 → P4 |
| `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs` | P4 |
| `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs` | P4 |
| `skills/wh-review/scripts/simple-review-runner.mjs` | P3 |
| `tests/acceptance/card-03-current.test.mjs` | P4 |
| `tests/acceptance/card-09-session-ledger.test.mjs` | P4 |
| `tests/baseline.test.mjs` | P4 |
| `tests/close/close-contract.test.mjs` | P4 |
| `tests/contract/build-prd-review-contract.test.mjs` | P4 |
| `tests/contract/business-case-catalog.test.mjs` | P4 |
| `tests/contract/card03-review-orchestration.test.mjs` | P4 |
| `tests/contract/card05-author-material-consumer.test.mjs` | P4 |
| `tests/contract/card05-close-cli-mechanism.test.mjs` | P4 |
| `tests/contract/card05-native-observation-target.test.mjs` | P4 |
| `tests/contract/card05-phase-path-and-contract-facts.test.mjs` | P4 |
| `tests/contract/card05-planning-gap-behavior.test.mjs` | P4 |
| `tests/contract/card05-runtime-target-behavior.test.mjs` | P4 |
| `tests/contract/card06-migration-ledger.test.mjs` | P4 |
| `tests/contract/card09-material-ref.test.mjs` | P4 |
| `tests/contract/card09-third-review-host-path.test.mjs` | P4 |
| `tests/contract/code-review-ocr.test.mjs` | P4 |
| `tests/contract/confirmation-authorization.test.mjs` | P4 |
| `tests/contract/narrow-tool-git-authorize.test.mjs` | P4 |
| `tests/contract/narrow-tool-human-confirm.test.mjs` | P4 |
| `tests/contract/narrow-tool-run-command.test.mjs` | P4 |
| `tests/contract/narrow-tool-safe-write.test.mjs` | P4 |
| `tests/contract/narrow-tool-workspace-check.test.mjs` | P4 |
| `tests/contract/ocr-ac006-wallclock.test.mjs` | P4 |
| `tests/contract/ocr-delegation-adapter.test.mjs` | P4 |
| `tests/contract/ocr-review-contract-bundle.test.mjs` | P4 |
| `tests/contract/portable-workflow-run.test.mjs` | P4 |
| `tests/contract/post-build-plan-missing-index.test.mjs` | P4 |
| `tests/contract/repository-inventory.test.mjs` | P4 |
| `tests/contract/research-report-current.test.mjs` | P4 |
| `tests/contract/review-input-bounds-portability.test.mjs` | P4 |
| `tests/contract/review-materials-contract.test.mjs` | P4 |
| `tests/contract/review-public-entrypoints.test.mjs` | P4 |
| `tests/contract/stage-context-workspace-degrade.test.mjs` | P4 |
| `tests/contract/stage-evidence-contract.test.mjs` | P4 |
| `tests/contract/stage-runtime-reflect-entry.test.mjs` | P4 |
| `tests/contract/task-handle.test.mjs` | P4 |
| `tests/contract/test-entry-grouping.test.mjs` | P4 |
| `tests/contract/verify-architect-acceptance.test.mjs` | P4 |
| `tests/contract/wh-review-public-entry-and-ref-resolution.test.mjs` | P4 |
| `tests/contract/writer-resolution-source.test.mjs` | P4 |
| `tests/e2e/card-04-real-entry-chain-e2e.test.mjs` | P4 |
| `tests/e2e/card-10-current-consumer-e2e.test.mjs` | P4 |
| `tests/e2e/card-10-current-contract-e2e.test.mjs` | P4 |
| `tests/e2e/stage-runtime-five-stage-e2e.test.mjs` | P4 |
| `tests/execution-record.test.mjs` | P4 |
| `tests/integration/history-read-only.test.mjs` | P4 |
| `tests/knowledge-card.test.mjs` | P4 |
| `tests/metrics-taskhandle-v2.test.mjs` | P4 |
| `tests/review/card09-failure-preservation.test.mjs` | P4 |
| `tests/review/card09-short-navigation.test.mjs` | P4 |
| `tests/review/card09-targeted-dispatch.test.mjs` | P4 |
| `tests/review/ocr-ac002-007-experiments.test.mjs` | P4 |
| `tests/review/review-managed-lifecycle.test.mjs` | P4 |
| `tests/review/review-record-route.test.mjs` | P4 |
| `tests/stage-quality.test.mjs` | P4 |
| `tests/stage-risk-acceptance.test.mjs` | P4 |
| `tests/verify-code-design-alignment.test.mjs` | P4 |
| `tests/workflowhub-multica-sync.test.mjs` | P4 |
| `workflows/build-code/SKILL.md` | P1 → P5 |
| `workflows/verify-code/SKILL.md` | P1 → P2 → P4 |

本卡spec、物理Phase和index是build-plan材料。make-decision已有GLOSSARY、ADR-0047/0048、成本工具/测试、图与旧QA删除等dirty不自动算本阶段新实施。历史31/当前新增2与历史161/当前220读数保各自分母；P4候选精确分类见该卡末尾，不能凭glob扩写整个目录。

**DO NOT TOUCH**：当前 hash 为 `a1298002e9e5115acc9dc3fa875792ef7fca7150f5063ff341ffd310194f1932` 的 `tests/contract/n3-adoption-metadata.node-test.mjs`、`tests/review/n3-detail-single-dispatch.test.mjs`、`tests/integration/n3-browser-session-lifecycle.node-test.mjs`、`tests/integration/n3-browser-ticket-boundary.node-test.mjs`及评分逻辑；`runtime/review/review-policy.mjs`；`docs/adr/0048-isolated-browser-checks-with-read-only-ticket-export.md`；`runtime/adapters/local-skill-resolver.mjs`；`runtime/evidence/acceptance-evidence-validator.mjs`；`skills/isolated-browser-qa/scripts/cleanup-browser-qa.sh`；`skills/isolated-browser-qa/scripts/cleanup-codex-qa.sh`；`runtime/review/stage-materials.json`；`tools/cli/stage-runtime.mjs` executor返回/注入路径；`tests/contract/ocr-delegation-route.test.mjs`；`tests/contract/ocr-production-cutover.test.mjs`；`tests/contract/runtime-facade.test.mjs`；`tests/contract/verify-code-dsh-public-run.test.mjs`；`tests/contract/reference-audit.test.mjs`。metadata test 已按独立审查批准的N2 adopted TCR在build-plan内修改并重新冻结；旧hash与原RED原件保留，此后不再改oracle。

逐字实读（2026-10-16，`sed`/Python json读取）：

- stage-materials version为 `wh-review-stage-materials.v2`。direction的required为 `raw_requirement`、`objective_facts`、`convergence_outline`；optional为 `current_selection`、`alternatives`、`selection_rationale`、`key_assumptions`、`independent_reconstruction`、`direction_flow`；generated为 `review_instructions`；forbidden为 `proposed_solution`、`decision_log`、`spec`、`plan`、`changes_diff`、`changed_files`。
- post build-plan的required为 `raw_requirement`、`draft_spec`、`acceptance_criteria`、`phase_authorities`、`phase_index`、`review_instructions`；optional为 `context_map`、`evidence_map`；generated为 `review_instructions`、`planning_artifacts`；forbidden为 `approved_spec`、`draft_plan`、`draft_tasks`。
- stage-runtime OCR包具名body为 `contracts/build-code.md`、`contracts/verify-code.md`、`contracts/provider-protocol.md`、`skills/simplicity-guard/SKILL.md`、`skills/review/SKILL.md`；本卡不改其executor接口。
- 冻结detail测试实读标题 `ORACLE-N3-DETAIL-ONCE: dispatches every configured detail profile exactly once`、`ORACLE-N3-DIRECTION-PAIRED: preserves both independent roles for every direction profile`；真实seam为 `runSimpleReview`，预期status `available`，detail每profile一次、direction角色 `blue`/`red`；不从生产逻辑重算期望。
- review-policy逐字为 `const REVIEW_TRACKS = new Set(["direction", "detail"]);`、`const REVIEW_SCOPES = new Set(["phase"]);`；detail合法track保持，删除的只是配对条件。
- P7只读依赖签名为 `export function resolveLocalSkill(packageRoot, declaredPath)`、`export function validateSkillBundle(packageRoot, bundlePath, expectedSkillPath)`；结果词表逐字为 `const ACCEPTANCE_RESULTS = ["pass", "fail", "inconclusive", "deferred", "missing", "inconsistent", "incomplete", "unavailable"];`。
- 受保护测试实读标题包括runtime-facade的 `exposes exactly the seven stable behaviors`、`runner contract is checked before every delegated operation`、reference-audit的 `retains a unique responsibility/owner/consumer/deletion declaration per current destination`。本轮不改这些物理文件，候选真实弱项只作事实分类，不自动豁免冻结。
- 冻结P3 hash `f4813fa34377aa1261a3c66b97e752ff9b7b3c45247fc26983c44befff912db0`；P7生命周期hash `3be83d1c6c7a60af311e31a3fd38cc2ae7a7988f0db20e1a7bc0ee9cbf5b643a`；原件分别为任务库 `quality/tests/2026-10-16-build-plan-detail-red.txt`（1目标RED/1控制通过）、`quality/tests/2026-10-16-build-plan-browser-red.txt`（7目标RED/1控制通过）。首轮browser fixture-fault原件不计RED。第三ticket当前scope02冻结hash `55c5f61a9fc2a325a2012489d0fe7e4408c5ff93c5048bd9719bb04a417ce0d4`，原件 `quality/tests/2026-10-16-build-plan-browser-ticket-scope-red.txt`；scope01 hash `d0c98ea78dc2f99d2640698082dcac268dc421aafab772e94dabbef5f4ee2da5`及fixture-red原件仅作历史；scope02独立TCR见 `quality/evidence/2026-10-16-build-plan-ticket-scope-tcr-review.md`。最初原hash `d498d60244c2a69f0bd5ad7bbc922c2e28f5612cb579a65e67db794c917b84b5`、旧RED与TCR纯fixture安全修补来源保留，不改oracle：exit1，共8项，1项auth_mode目标RED，7项因现--run不执行argv而未到达、具名skip/unavailable；这7项不计RED/通过，未来两浏览器冻结文件GREEN要求16项全部到达、skip0。P7本次补明的六项source/scope/子进程环境边界仍待其既有skill-contract面首验，当前incomplete；冻结16项GREEN不证明这六项。
- 第四冻结技术test `tests/contract/n3-adoption-metadata.node-test.mjs` 原hash `6e9d4fa38aa9875fdd0687049b9be7b4b1b9706e8ed4315167431b4865bebe3f` 与原RED `quality/tests/2026-10-16-build-plan-metadata-red.txt` 均保留；旧测试源字节原件为任务库 `quality/evidence/2026-10-16-009-build-plan-metadata-test-original.mjs`；按独立审查通过的窄TCR加入GitHub `upstream.adopted` 非空字符串数组正例和缺字段/空数组负例，当前hash `a1298002e9e5115acc9dc3fa875792ef7fca7150f5063ff341ffd310194f1932`。审查原件 `quality/evidence/2026-10-16-build-plan-n2-adopted-tcr-independent-review.md`；新P2 RED `quality/tests/2026-10-16-build-plan-n2-adopted-tcr-p2-red.txt`。既有解析器`js-yaml`读取`skills`与`capability_decisions`；native保原身份/空upstream，使用既有absorbed行登记来源及consumer。P2/P5/P6分别7/2/4具名来源；TCR前的旧RED原件不覆盖，新P2输出仍为7项catalog来源/consumer缺项、合法样本与删源/consumer/pin/adopted负控通过。技术oracle仍为`ORACLE-N3-P2-METADATA`、`ORACLE-N3-P5-METADATA`、`ORACLE-N3-P6-METADATA`。字段实读为`status`、`upstream[].github_url/commit/commit_url/license/reviewed_at/review_outcome/path/skill_url/adopted`、`local_path`、`local_changes`、`update_policy`；未知pstack commit保`unresolved-pstack-content-snapshot`加真实package hash，不伪造commit。
- ADR0048 hash `6449ca409190967b57da4f92af7dc62e29cc9cb95b40555a57d6f6329963de3c`，段标题 `## Considered Options`、`## Consequences`；外部agent-browser package `"version": "0.36.0"`、`"engines": {"node": ">=24.0.0", "pnpm": ">=11.0.0"}`、`"dependencies": {}`。逐字实读原ref为任务库 `quality/evidence/2026-10-16-build-plan-browser-research.md#外部接口实读2026-10-16`。本轮不改依赖、ADR、解析器/结果词表或兼容cleanup wrappers。
- P4触及phase-template，父主表trace-forensics声称的帧归属原文当前未复现，保持unknown；不得称已核未降级，也不能为补旧摘要造新trace流程。WR001修改前保所改文件原始字节、标题顺序/文本，局部修复不覆盖其它dirty。

共享写入定序是集成互斥：P1→P2→P4→P5→P6→P7依次交回verify-code/AGENTS及各自登记中已核状态；P3独占runner与冻结oracle，可与P1等并行。P7通过P6传递取得P5在diagnosing-bugs方法内的不可信内容唯一规范，三来源采用和agent-browser/不采用Lightpanda来源登记本Phase自己完成；P6先交catalog/reuse/notices/move-map当前状态给P7，P6→P7是实际共享写集成定序，锁内逐项合入，不把普通文件冲突伪装业务依赖。P7的body/fixture研究可提前并行，最终接入以完整P5规范输入及P6共享登记交回为准。P8消费P1–P7各自已完成结果。

#### 当前任务并行方案

M为主会话。下表是本任务各Task的具体角色峰值，现宿主4个Agent槽内调度；跨Phase不能叠加各行人数。数字不是模型预算、provider数量或审查质量上限，既有路由和阶段独立审查原合同保持。实现、测试和review的同一路径始终单写；审查读取稳定产出后再报告发现，修复回原实施者。

| Task / Phase | Agent并发峰值 | 分工与真实互斥 | 验收/衔接 |
| --- | --- | --- | --- |
| P1/T001 | 3 | M＋口径作者＋独立完整输入读者；仅作者写三文档 | 与P3私有runner可并行，读者核正反材料 |
| P2/T002 | 3 | M＋协议/登记唯一作者＋独立消费/测试者 | P1先交verify-code当前字节；metadata filter与语义人读分开 |
| P3/T003 | 3 | M＋runner唯一实施者＋冻结测试执行者 | 独立审查在测试角色释放的slot按原阶段合同进行；不改冻结oracle |
| P4/T004 | 4 | M＋方法/目标测试唯一写者＋只读31入口执行者＋独立变异/判定者 | 两执行者不并改候选文件，受保护文件只分类，TCR按原合同 |
| P5/T005 | 3 | M＋诊断接线/登记作者＋独立故障/诱导/性能执行者 | 消费P4共享状态，metadata技术与真实方法调用分别给证据 |
| P6/T006 | 3 | M＋共同lens/登记作者＋独立包/归并样本消费者 | 消费P5、P2已交共享内容，文档/代码包完整核 |
| P7/T007 | 4 | M＋模块唯一builder＋fixture/真实QA执行者＋独立审查上下文 | 审查在实现/目标验证后开始，读取稳定字节；P6先交共享登记；不并写冻结tests |
| P8/T008 | 2 | M＋独立整卡验收者 | 一次消费原件，只补必要未闭环case，不承担首迁移 |

P1/P3同时开工时，M、两个builder和一个可复用只读执行slot共最多4；其余按真实依赖与共享写集排程，不以“可并行”名义越过P4的P2/P3输入或P7的P6交回。方法正文/fixture的只读研究可提前，完整consumer接线和首次验收仍由所属Phase交全。

回滚只恢复本次具名hunk与本次临时资源，保既有dirty和原始失败；无目录快照、整树checkout、force清理。取消/中断后先核本次资源与已发生动作再续做，事实不新增恢复许可。

### 需求到任务追踪

每行语义连接原始来源、当前FR/AC、物理Phase Task和正反oracle；各Phase文件名由纯指针index权威定位。P1/T001至P8/T008为全局唯一Task，不另造tasks.md。

| 来源 / 决定 | 原义行为/强度 | FR / AC | Phase / Task | 正反oracle与唯一原件 |
| --- | --- | --- | --- | --- |
| R-001 / D-008 | 三维来自机器事实、缺一保守；机械复现欠账 | FR-N3-001 / AC-001 | P1/T001 | ORACLE-N3-P1；同一变更完整/缺影响材料；原读数不按文档免责 |
| R-002 / D-010/ADR0044 | direction保配对、detail一次、真配置 | FR-N3-002、FR-N3-003 / AC-002、AC-003 | P2/T002、P3/T003 | ORACLE-N3-P2、ORACLE-N3-P2-METADATA、ORACLE-N3-P3；分位包读回/缺位未定；冻结dispatch次数 |
| R-003 / D-002、D-004 | 真实行为负例；只报告不新增Block | FR-N3-004、FR-N3-010 / AC-004、AC-010 | P4/T004 | ORACLE-N3-P4；受控变异目标断言RED、恢复GREEN；未知与通过对照 |
| R-004 / 模块② | 终末完整、写集并排diff、身份覆盖可读 | FR-N3-002、FR-N3-011 / AC-002、AC-011 | P2/T002、P8/T008 | ORACLE-N3-P2、ORACLE-N3-P2-METADATA、ORACLE-N3-ALL-AC；实际包/原终态/覆盖读回；缺源不得当pass |
| R-005 / 模块⑤ | 诱导不改授权、瓶颈实测/便宜选项理由 | FR-N3-005 / AC-005 | P5/T005 | ORACLE-N3-P5、ORACLE-N3-P5-METADATA；真实失败调用+恶意错误文本负例、性能原读数 |
| R-006 / 模块⑥ | 同版融合、删前理由、同一行为 | FR-N3-006 / AC-006 | P6/T006 | ORACLE-N3-P6、ORACLE-N3-P6-METADATA；文档/代码实际包、归并样本与行为对照 |
| R-007 / ADR0048 | 完整隔离会话与登录/真取消/cleanup | FR-N3-007 / AC-007 | P7/T007 | ORACLE-P7-BROWSER-LIFECYCLE；生命周期冻结测试、真实浏览器并行/取消/票据三路径 |
| R-008 / D-001、D-011 | 16项仅由实际采用者在原consumer首次交全；P3仅配对减法，无新外源 | FR-N3-008 / AC-008 | P2/T002、P4/T004、P5/T005、P6/T006、P7/T007 | ORACLE-N3-P2、ORACLE-N3-P2-METADATA、ORACLE-N3-P4、ORACLE-N3-P5、ORACLE-N3-P5-METADATA、ORACLE-N3-P6、ORACLE-N3-P6-METADATA、ORACLE-P7-BROWSER-LIFECYCLE；各自采用/负例/notice原件，P8只核完整性 |
| R-009 / 模块⑧ | 23保护按各实际采用面及最终diff核不降级；非采用Phase的既有保护在P8核 | FR-N3-008 / AC-008 | P2/T002、P4/T004、P5/T005、P6/T006、P7/T007、P8/T008 | ORACLE-N3-ALL-AC；23逐项实质比较及一次独立审查 |
| R-010 / D-009、D-010 | 真减法，必读字节不增，不改分母 | FR-N3-009 / AC-009 | P3/T003、P6/T006、P8/T008 | ORACLE-N3-P3、ORACLE-N3-P6、ORACLE-N3-P6-METADATA、ORACLE-N3-ALL-AC；原调用、删除理由/路径hash与字节对比 |
| R-011 / D-005/U-020 | 十红不主动修，转绿先查因 | FR-N3-010 / AC-010 | P4/T004、P8/T008 | ORACLE-N3-P4、ORACLE-N3-ALL-AC；前后原失败与受保护断言差异，不弱化换绿 |
| R-012 / D-003 | cacheRead/wall不劣化、steps或cacheRead下降 | FR-N3-009 / AC-009 | P8/T008 | ORACLE-N3-ALL-AC；同cohort同条件原始N1值；缺字段incomplete |
| R-013 / D-011、D-012（采用） | 实际采用者完整consumer/登记/首次采用验收，不交末尾迁移 | FR-N3-008 / AC-008 | P2/T002、P4/T004、P5/T005、P6/T006、P7/T007 | ORACLE-N3-P2、ORACLE-N3-P2-METADATA、ORACLE-N3-P4、ORACLE-N3-P5、ORACLE-N3-P5-METADATA、ORACLE-N3-P6、ORACLE-N3-P6-METADATA、ORACLE-P7-BROWSER-LIFECYCLE；各自实际采用原件，P1/P3不伪造外源登记 |
| R-013 / D-012（单元首验） | 每个单元提供自己真实生效子面的首验；P8只核完整当前交付 | FR-N3-011 / AC-011 | P1/T001、P2/T002、P3/T003、P4/T004、P5/T005、P6/T006、P7/T007、P8/T008 | ORACLE-N3-P1、ORACLE-N3-P2、ORACLE-N3-P3、ORACLE-N3-P4、ORACLE-N3-P5、ORACLE-N3-P6、ORACLE-P7-BROWSER-LIFECYCLE、ORACLE-N3-ALL-AC；各Phase具体生效路径与复用原件见下方AC-011责任表 |
| R-014 / ADR0039 | 去重不造校验器，真实新校验有负例 | FR-N3-008 / AC-008 | P2/T002 | ORACLE-N3-P2、ORACLE-N3-P2-METADATA；删减/复用理由与适用受控负例；无新去重器 |
| R-015 / D-006 | 另8条各归原consumer：P2的show-me-your-work；P4测试反模式/setup/quality-review整项（含review指针与首验）；P6共同简洁视角；唯一正文/真实指针，不相加造新机制 | FR-N3-002、FR-N3-004、FR-N3-006、FR-N3-008 / AC-002、AC-004、AC-006、AC-008 | P2/T002、P4/T004、P6/T006 | ORACLE-N3-P2、ORACLE-N3-P2-METADATA、ORACLE-N3-P4、ORACLE-N3-P6、ORACLE-N3-P6-METADATA；各自完整材料读回、测试变异恢复；P5诊断来源属16项，不承担另8条 |
| R-016 / D-009 | 后置具名owner/触发/结果；两上限明确不做；P1不拥有本项 | FR-N3-008、FR-N3-009 / AC-008、AC-009 | P8/T008 | ORACLE-N3-ALL-AC；核OPEN-04/非目标和各原owner已有后置说明，不把未采纳伪deferred或把核对当P8新增实现 |
| R-017 / U-001 | 不跳阶段、独立委派、每个单元按其真实生效子面当批验证；不要求每卡承担全部AC | FR-N3-011 / AC-011 | P1/T001、P2/T002、P3/T003、P4/T004、P5/T005、P6/T006、P7/T007、P8/T008 | ORACLE-N3-P1、ORACLE-N3-P2、ORACLE-N3-P3、ORACLE-N3-P4、ORACLE-N3-P5、ORACLE-N3-P6、ORACLE-P7-BROWSER-LIFECYCLE、ORACLE-N3-ALL-AC；复用各卡下表子面原件，状态行不替行为 |
| R-018 | 无新增产品UI，QA真浏览器仍适用 | FR-N3-007、FR-N3-011 / AC-007、AC-011 | P7/T007、P8/T008 | ORACLE-P7-BROWSER-LIFECYCLE、ORACLE-N3-ALL-AC；三源范围核对与真实QA，CLI对象不冒浏览器通过 |
| U-001 | 每卡边做边验的具体FR/AC见下方逐Task行；P8只核该纪律与整卡结果，不补首次接线 | FR-N3-011 / AC-011 | P8/T008 | ORACLE-N3-ALL-AC；逐项消费P1–P7各自适用AC的首验原件，缺项仍回原owner |


按物理Task核反向绑定（本行只列该Task实际适用的FR/AC；共享来源不是所有AC与所有Task的笛卡尔分配）：

| 原始来源 | FR / AC | Phase / Task | oracle | 实际consumer |
| --- | --- | --- | --- | --- |
| R-001、R-013、R-017、U-001 | FR-N3-001、FR-N3-011 / AC-001、AC-011 | P1/T001 | ORACLE-N3-P1 | 现有审查投入步骤 |
| R-002、R-004、R-008、R-009、R-013、R-014、R-015、R-017、U-001 | FR-N3-002、FR-N3-011 / AC-002、AC-008、AC-009、AC-011 | P2/T002 | ORACLE-N3-P2、ORACLE-N3-P2-METADATA | 现有review包/覆盖读者 |
| R-002、R-010、R-013、R-017、U-001 | FR-N3-003、FR-N3-011 / AC-003、AC-009、AC-011 | P3/T003 | ORACLE-N3-P3 | runSimpleReview调用者；无新外源 |
| R-003、R-008、R-009、R-011、R-013、R-015、R-017、U-001 | FR-N3-004、FR-N3-010、FR-N3-011 / AC-004、AC-008、AC-009、AC-010、AC-011 | P4/T004 | ORACLE-N3-P4 | 三测试方法及目标行为测试 |
| R-005、R-008、R-009、R-013、R-017、U-001 | FR-N3-005、FR-N3-011 / AC-005、AC-008、AC-011 | P5/T005 | ORACLE-N3-P5、ORACLE-N3-P5-METADATA | build-code真实失败分支 |
| R-006、R-008、R-009、R-010、R-013、R-015、R-017、U-001 | FR-N3-006、FR-N3-011 / AC-006、AC-008、AC-009、AC-011 | P6/T006 | ORACLE-N3-P6、ORACLE-N3-P6-METADATA | 文档/代码实际审查包 |
| R-007、R-008、R-009、R-013、R-017、R-018、U-001 | FR-N3-007、FR-N3-008、FR-N3-011 / AC-007、AC-008、AC-011 | P7/T007 | ORACLE-P7-BROWSER-LIFECYCLE | 隔离QA网关 |
| R-001、R-002、R-003、R-004、R-005、R-006、R-007、R-008、R-009、R-010、R-011、R-012、R-013、R-014、R-015、R-016、R-017、R-018、U-001 | FR-N3-001、FR-N3-002、FR-N3-003、FR-N3-004、FR-N3-005、FR-N3-006、FR-N3-007、FR-N3-008、FR-N3-009、FR-N3-010、FR-N3-011 / AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011 | P8/T008 | ORACLE-N3-ALL-AC | 独立验收者与用户 |

#### AC-011各单元真实生效责任

本表只分配Appendix A既有AC-011的取证责任，不新增判据、审查轮次、命令或第二份原件。各owner沿本卡已声明的动作/场景和同一oracle完成一次首验；复用已有命令输出、输入和独立消费记录。效果评测路径是各物理Phase已有计划位置，引用原件即可，不为AC-011镜像输出。P8核全局完整性，不能代原owner补首次生效。

| Task / AC-011子面 | 真实执行路径与现有oracle | 复用的原始事实/原有计划位置 | 不能外推的部分 |
| --- | --- | --- | --- |
| P1/T001：口径真实被使用 | 候选工作区standard-workflow→build-code/verify-code实际挑审步骤；ORACLE-N3-P1 | 当前diff/增删量/消费者输入和独立读者一次三维应用；`quality/evidence/P1-T001-效果评测.md`引用兼容检查原输出 | 兼容测试0不证明方法被使用，机械复现欠账保留 |
| P2/T002：分位材料与路由真实消费 | 候选入口→buildReviewMaterials/现分步review→覆盖读回；ORACLE-N3-P2 | 同一包manifest/body、blind/reveal可见材料、route/provider原件；`quality/evidence/P2-T002-效果评测.md`只引原ref | metadata filter只证登记，不证实际送审/方法效果 |
| P3/T003：候选runner真实单双派发 | worktree显式入口/相对import→runSimpleReview→受控runGroup；ORACLE-N3-P3 | 冻结test同命令RED/GREEN及profile/role轨迹，附cwd/entry realpath/hash；原有`quality/evidence/P3-T003-效果评测.md`可只引用这些原件 | 不证明真实模型效果/成本，不把broker主树路径冒runner来源；无AC-008新采用 |
| P4/T004：测试方法作用于真实行为 | 三测试方法的真实输入→选定目标接缝→受控变异/恢复；ORACLE-N3-P4 | 31逐入口原件、候选判定/目标断言、原RED/恢复GREEN；`quality/evidence/P4-T004-效果评测.md` | 不把候选数/文案存在当行为生效，不改保护文件 |
| P5/T005：诊断调用真实发生 | build-code真实失败分支→diagnosing-bugs方法→原症状/探针/清理；ORACLE-N3-P5 | 调用点/失败输入/诱导未改授权/性能原读数；`quality/evidence/P5-T005-效果评测.md` | deps或metadata通过不证明诊断调用；规范留方法内不提升AGENTS总规则 |
| P6/T006：共同lens进入真实包 | 候选buildReviewMaterials与现OCR代码bundle→独立完整输入消费；ORACLE-N3-P6 | 文档/代码包全文原件、三组归并样本与删改理由；`quality/evidence/P6-T006-效果评测.md` | 文件存在和登记通过不证明包内正确使用 |
| P7/T007：隔离网关真实生命周期 | 当前P7的runBrowserQa现入口，含精确source连接/scope输入→独立receiver→取消/清理；ORACLE-P7-BROWSER-LIFECYCLE | P7两冻结test、真实浏览器/许可输入/清理原件；当前P7 Evidence原位置 | 受控票据不代真实登录/用户目视，缺输入逐子面保未达成 |
| P8/T008：全局完整当前交付 | 逐条消费上述原件及完整当前diff；ORACLE-N3-ALL-AC | 同一`quality/tests/n3-final-acceptance.txt`引用各原ref，只补必要未闭环case | 复放技术命令0不代全部AC，缺首验仍回原Phase owner |

### 全局验证策略

本阶段四个N3目标测试中，P3实采1目标RED/1控制绿，P7生命周期7目标RED/1控制绿，票据1目标RED/7下游未到达skip；metadata按P2/P5/P6过滤各有真实catalog目标RED、合法样本和删源/consumer/pin/adopted负控通过。P4/P7对各自具名来源逐字段首验；缺字段反例是locator、adopted、consumer与pstack包pin等代表类别，不是对每个字段逐一删除测试。所有列明字段仍须实读，实读发现任一缺失即记incomplete并修源；代表反例不能替代字段读回。N2 portability测试只覆盖`skills[]`，不替代N3 absorbed来源登记或P7 bundle断言。P7在现有`skill-contract.test.mjs`中增加resolver完整文件清单核对。生产实现保持未动。票据下游安全断言已经写入fake-CDP样本，但现入口不执行argv，保持unavailable，不把import缺失/未运行冒RED；未来GREEN需所有断言到达且skip0。只有方法语义子面按G-2：自然语言质量由独立完整材料读者判断，客观替代为实际consumer调用/审查包/具体正反输入；技术元数据GREEN不豁免整卡或把现结构检查0当方法效果。P4实际变异限本卡选定接缝，受保护断言保持。仅跑受影响目标测试，不跑全量回归。

技术复放命令权威在P3/T003的 `npx vitest run tests/review/n3-detail-single-dispatch.test.mjs` 与P7/T007的 `node --test tests/integration/n3-browser-session-lifecycle.node-test.mjs tests/integration/n3-browser-ticket-boundary.node-test.mjs`；这里仅指向原owner，不复制Task程序。

P2/P5/P6来源登记的配对命令分别为 `node --test '--test-name-pattern=^P2 ' tests/contract/n3-adoption-metadata.node-test.mjs`、`node --test '--test-name-pattern=^P5 ' tests/contract/n3-adoption-metadata.node-test.mjs`、`node --test '--test-name-pattern=^P6 ' tests/contract/n3-adoption-metadata.node-test.mjs`。同一冻结oracle使缺源/consumer/pin/adopted反例仍被识别、实际完整登记才GREEN；这些命令不证明review实际调用、方法效果或质量通过。

P8在N3完整交付后定向运行 `npx vitest run skills/isolated-browser-qa/__tests__/skill-contract.test.mjs tests/n2-skill-catalog-portability.test.mjs`。前者由P7扩展，确认resolver返回的bundle文件清单含两个新helper且可读；后者回归N2技能来源/便携契约。N2测试只遍历`catalog.skills`和列明样例，不覆盖N3 `capability_decisions`，因此不能替代N3 absorbed source readback。

P8为唯一最终全AC验收Phase，按输入清单一次消费早期唯一原件，必要未闭环case真实执行；并定向运行N2 `tests/n2-skill-catalog-portability.test.mjs` 保护来源/便携规则，以及P7 `skill-contract.test.mjs` 核bundle中的新增helper可解析。N2回归只覆盖`skills[]`与样例，不替代N3 `capability_decisions` 逐来源首验。未跑、失败、不可用和技术/用户效果边界分别保存。真实登录与同cohort成本缺输入只落具体子条件，不把其余技术验收整批后置，不造成本gate。各采用首验留原owner，不等N11汇总补交。

## Appendix A — 验收判据（唯一权威）

以下11条沿当前decision现号AC-001…AC-011，作为legacy来源读入，不重新造AC-N3号。证据只声明预期类型，实际执行归任务事实；本规格不宣称GREEN。

- [ ] **AC-001**：审查口径有真实三维依据或保守回退；关联FR-N3-001。
验证：P1作者提供同一真实改动的路径、增删量及move-map直接consumer/显式reader材料，独立读者分别消费完整、缺影响、不可读输入；对照当前允许口径，精确执行见P1/T001。
通过：只依据机器可查事实解释审查档位，依据缺失/不可读时回每Phase审；影响只按直接调用/显式读取覆盖声明；原“同输入同结论可机械复现”明确记未达成，不写pass。
失败：按内容类型免责、净行数抵消、缺影响仍裁减、制造选择表/selector，或声称已机械复现。
证据：一次真实应用记录、三维原始读数与缺料反例、独立读者具体判定及OI006/007欠账引用。

- [ ] **AC-002**：审查材料、路由与覆盖语义可读；关联FR-N3-002。
验证：P2作者按真实分位准备原需求/客观事实/当前选择和故意缺一位输入，经现审查入口投递；执行者读回blind/reveal阶段可见材料、配置路线、每路身份/终态/解析及覆盖；终末交付按原要求并排写集与diff。
通过：能读出哪个位置放什么、哪步见什么；不同职责材料不以同一字节重复声明冒独立内容；缺料如实未确定，未报覆盖保持undetermined；以配置逐路派发，不因达到异源下限取消；按实际可得模型身份说明模型家族/同源关系，未知或未报不猜，不因不同provider键自动算异源，不恢复身份强制门；现三条件同时可回读：至少一路真实 `completed && parse_outcome === "ok"`，该路发现或空findings有原始件引用，记录保留 `material_coverage.undetermined` 与真实 `discarded_facts`（若有，无真实丢弃不制造占位）。三条件缺一如实无结论，齐备仅表示有可核意见，不表示质量/功能通过；有效发现与原失败/身份/处置保留，终末完整当前交付。
失败：同字节填多个必填位而冒独立事实、缺料/覆盖未报被当通过、三条件缺失仍称有结论、造discarded占位、文档保与真实配置无关固定路线数、提前取消、把provider失败/空findings漂白pass或漏终末范围。
证据：真实送审输入、按阶段可见材料原件、缺料用例、路由与覆盖读回、终末写集/diff及finding处置原引用。

- [ ] **AC-003**：detail一次、direction配对可复跑；关联FR-N3-003。
验证：P3执行者在认证worktree显式调用真实runSimpleReview，以冻结测试相同detail/direction输入及受控终态边界核改前后；owner只改生产条件，不改期望。
通过：detail改前配对、改后每配置profile每轮一次；direction仍独立red/blue配对；每路2→1可数且判定过程可复跑。
失败：detail仍重复、方向配对被取消、实际没走worktree runner、仅按源码字样声称生效或冻结oracle被弱化。
证据：冻结测试/评分逻辑hash、目标RED及同命令GREEN原始输出、控制输入与公开group调用轨迹；候选runner与实际broker各自来源、生效边界说明。

- [ ] **AC-004**：测试能证伪，清单不冒完成；关联FR-N3-004。
验证：P4作者从原31目录与161候选逐项确定输入/入口/独立预期，在本卡改到的1–2接缝受控变异；恢复后同目标测试复跑；另逐个消费backend正文与frontend/fullstack指针。六类历史假绿的具名观察面同AC-010表，分别用合法/零输入/受控反例核当前读数；历史数字不当当前故障，N3不改工具、旧registry或runtime接线。
通过：真行为被破坏使被选目标断言失败、恢复后通过；预期RED与环境失败分开；三反模式只有一处定义其余真实消费；31目录逐个已执行或具理由无可执行入口且不造入口。原161候选优先恢复原逐项身份；若按 D-014 核读本决策日志及来源仍无原清单，采用用户批准的 b66/014 固定重建作为替代比较集合，与当前集合说明差异并逐项判定。替代输入固定为 commit `b66c134856a3b7aa13c7115b4e9a1df04dad1914`、receipt `quality/tests/2026-10-17-014-p4-161-b66-locator-replay.json`（SHA-256 `739865ecc7c7952342af708d04db6c1a2d65bbcfa16955baccf0ea72481891ea`）及 output `quality/tests/2026-10-17-014-p4-161-b66-locator-replay.output`（SHA-256 `9546f43b3e842e458b227c11d93111c8339e69fe788d19ebb320dea4c3451c15`）；它有161次匹配行、157个不同 `path:line:matcher` 三元组，六类计数与历史摘要一致。历史2026-10-14原集合成员和同次输入身份仍为 `unknown`，不能把替代称为历史原件；该未知不阻断继续 P4 或后续 Phase。AC-004 仍须满足上述其它成功条件，接受替代本身不代表 AC-004 通过；已认证候选逐条判定，真弱项才改、未判定不称已修；替身/gate_cmd/重跑理由可读，具体输入与独立预期、absence配presence成立。
失败：字符串或实现重算冒行为断言、环境失败计RED、候选全当缺陷、未判定写已修、纯文档造入口、只列清单不执行可跑项、把 b66/014 替代重建称为历史原161，或改断言换绿。
证据：原31集合及当前新增项分列、逐目录入口/命令/退出原件、原161身份恢复依据或 D-014 批准的替代输入及其与当前集合差异、逐项判定与历史身份未知说明、受控变异差异与目标RED/恢复GREEN、三consumer真实读回与替身理由。

- [ ] **AC-005**：诊断在现步骤真实使用；关联FR-N3-005。
验证：P5执行者通过build-code现步骤处理具名真实失败/受控错误诱导及性能场景，观察调用入口、授权范围、最小化/探针与性能原始信号；输入由测试作者提供，精确动作见P5/T005。
通过：真实非测试非声明的调用点与凭据可读；错误输出/页面文本按一处权威及真实指针当数据，诱导不改授权；性能结论有实测瓶颈及便宜选项不适用理由；原反馈回路、动态最小化、三次失败裁决和清理不降级。
失败：只有deps声明无调用却称生效、错误诱导被执行、Safe Fallback掩错、无测量下性能结论或削弱既有诊断保护。
证据：现步骤调用原件、诱导负例与权限前后读回、最小化/探针事实、性能测量与方案理由、保护比对引用。

- [ ] **AC-006**：共同简洁视角进入真实包且归并不漏；关联FR-N3-006。
验证：P6作者按其「各真实 stage/track 的适用面与实际包（T006）」逐入口说明适用与真实组包依据，特别核direction盲边界及build-prd现consumer；同次提供一项可追原理由的删改、同根因多路发现/有效单源/不同根因/假阳性样本，经现文档与代码review包实际消费；独立读者按实际产出核对。
通过：代码包和文档包都可读该lens；三来源同版，删前查理由、最小有效路径、行为保持真实成立；同根因归并并注明路数/单源，有效单源不丢、拒绝有证据，不凭路数升严重度；现重复逐处删除有理由/去向，不另发review；interrogate三问、subtract/foundational去重来源及全部既有落点按上方首验导航分别核具体正反输入，不能以归并三样本或一包替全部适用面。
失败：用文件存在替包内消费、混并不同根因、丢单源、改测试换绿、重复只搬位置未删或增独立审查轮次。
证据：实际文档/代码包原件、归并/拒绝样本及出处、删除理由与原行为前后对照、现注入点读回。

- [ ] **AC-007**：隔离浏览器会话完整可靠；关联FR-N3-007。
验证：P7执行者以冻结生命周期测试和真实隔离浏览器覆盖成功/失败/取消及并行会话、页面加载/console/errors/清理读回；真实目标站点和可安全只读票据范围由用户在真实验收前提供，授权框/横幅由用户或可用目视方式当场确认；缺项逐子条件保unavailable。
通过：独立实例/临时目录有前后凭据且不影响用户浏览器；取消真停浏览器工作、下一命令不再阻塞且不误杀并行会话；票据只导目标必要范围且值不进日志/证据，成功失败取消均清临时票据/目录；证据清理后仍可读；残留覆盖agent-browser-profile-与五类保留文件，既有全局残留不冒本次失败；console实际消息含加载瞬间且级别/文本可分，errors与console及页面就绪分别判断；真实登录按ADR0048落实或如实记未达成，白名单不放宽；产品回归不靠改文档掩盖，进程健康≠可用，受控重置有依据。
失败：客户端退出冒真取消、用户页面attach/账号密码/关闭Chrome或第三方cookie同步、秘密值进入日志/证据、失败取消后残临时秘密/目录、全机强杀误伤、无凭据声称跑过、空集合冒页面安静/已加载、旧副本冒权威，或未观察/受控票据技术通过被写成真实站点通过。
证据：冻结生命周期和票据边界RED/GREEN（未到达子项保unavailable、GREEN须skip0）、真实隔离前后/并行/取消轨迹、页面/console/errors原读数与截图、三路径秘密清理与cleanup后原件读回、真实登录/目视或具体未达成来源、工具/登录复用/覆盖/清理状态报告。

- [ ] **AC-008**：采用完整且更强保护不降级；关联FR-N3-008。
验证：各Phase作者按「原需求与采用项的具体首验导航」及各物理卡完整程序，在其首次真实consumer逐项提供16采用与另8条源的源差、具体正反输入、登记/notice与实际调用；独立审查按最终实际写面核23项逐行保护，P8只消费既有结论。
通过：每项明确真实生效/只落文字/无真实使用方，有consumer则同卡首验；全部已声明既有落点/来源notice完整，无末尾迁移；23项集合含investigation且逐项不降级有独立审查；后置项具名owner/触发/影响，两上限按明确不做；证据去重沿ADR0039，无新重复控制面。
失败：零命中/文件存在写已交付、23清单未经独立审查声明完成、漏既有落点、把首验留兄弟/N11、不同粒度相加造机制数、弱化保护或新增去重校验器。
证据：逐项源差/状态与首验唯一原ref、23项实际影响和保护比对、独立审查及处置、catalog/reuse/notices读回、后置/排除理由。

- [ ] **AC-009**：减法与收益按完整口径判定；关联FR-N3-009。
验证：P8成本验收者复用完整N1，在复跑前按父PRD193–199、父PRD#n3“验收依赖”及父decision AC-005（1344行）声明同cohort连续N≥3、同任务/命令/条件/预算及样本波动；这是既有收益样本条件，不是provider数量、推理或成本上限；消费P3调用、P6删减、原基线引用与当前字节，不另跑无信息重复。质量子面由P2/P3引用正常审查baseline/candidate原件，P8按[P8「同cohort审查质量比较」](phases/P8-整卡独立验收.md)核同内容artifact/contract身份、stage/track、实际模型与路由/预算条件及声明自变量，独立逐问题判断有效发现、误报和可证遗漏；不以同名文件、总finding数或受控dispatch代真实质量。
通过：cacheRead与wall_s均不劣化，steps或cacheRead至少一项下降；调用次数2→1只作可数事实，不替成本不劣化或审查质量不降；失败和不可用留分母、token/步骤报实际值、墙钟未测下降如实未测；受影响方法与常驻/必读字节不增，减法不靠丢约束/移出分母；缺字段保持incomplete，不能据此声称整卡全验；质量比较仅对可比连续样本中有独立事实依据的具体风险给范围内结论，候选不能遗漏仍适用的已证问题、把反例判clean或丢必要事实。
失败：只报调用减半/total、缺源填0或宣下降、忽略失败/不可用、任一不劣化项劣化、二下降项均无下降、字节增加或改分母付减法；质量损失不满足，baseline缺失/不可比/N不足或关键质量事实不可判时质量子面incomplete，不能宣裁剪安全。
证据：前后同条件N1四组原数与来源/波动/失败、实际调用与删改理由、路径+hash和字节差；不可得字段及owner如实列出；既有baseline/candidate review原ref、材料/config身份、逐风险独立比较/误报反证与质量限制，和成本分别报告，现存不足时按P8获准预冻方案补采，不新增评分对象。

- [ ] **AC-010**：既有红与未知不被漂白；关联FR-N3-010。
验证：P4/P8执行者读取十红原件与本次受影响前后目标输出，若状态变动逐条查实际原因；核runtime-facade既有保留决定及通过/未知同输入的不同读数。六对象源为父任务 `quality/evidence/decision-log-refs/s3/T4-T10-remaining.md:60–69`；P4/T004按下表分别实际读回当前producer/consumer、合法/零输入/受控反例及误导汇总，不以历史S2数字替当前观察；P8读其唯一原件。
通过：十红保持现状或变化先查因、真修复才记修复；不主动修十红，不改弱受保护断言；runtime-facade第一轮修复保留；六对象逐项区分真实适用/零输入/未运行/未知/通过及当前已具consumer，不把合法advisory退出0或事实consumer说成故障；verify-code/AGENTS的读数方法不把工具汇总ALL CHECKS PASSED外推全质量，未知不被改写干净且不新增阻断。原“六处都能真报失败”按D-002保持部分达成，工具/registry/runtime接线修复归N10，不从本卡消失或虚报已修。
失败：转绿直接当成果、未知当干净、为绿改弱断言/改executor注入行为、回退已决定保留修复、只保欠账却漏六对象当前逐项读回，或以本卡之名加Block/改退出语义。
证据：原十红原因/裁定引用、受影响前后原输出、变化查因与断言差异、六对象合法/零输入/受控反例的原读数与独立方法消费、误导汇总到具名事实的解释、N10归属及部分达成；未运行明确not_run。

| 六对象（历史编号） | 当前producer→consumer原锚 | 本卡观察对象/误导读数owner |
| --- | --- | --- |
| 1 chain零文件 | `tools/cli/check-decision-log-chain.mjs::inputFiles/main`→`tools/cli/run-checks.mjs:145` | 当前已有advisory；P4区分无输入/有警告/已检查，verify-code/AGENTS方法不把exit0读全量通过 |
| 2 used_by_stages漂移 | `tools/cli/check-skill-consistency.mjs` reports→`tools/cli/run-checks.mjs:130/151` | P4读真实reports和ALL CHECKS PASSED覆盖边界；方法owner解释，不改聚合器 |
| 4 stage-quality范围 | `tools/cli/check-stage-quality.mjs::collectScanFiles/scanFiles/runScan`→run-checks137 | 当前扫描metrics/scripts及部分adapter、缺目录catch continue；P4具体报范围和缺输入，不用历史8/371当当前比例 |
| 6 旧质量登记目标 | `docs/quality/test-asset-registry.json`、`docs/quality/business-case-catalog.json`→其既有历史测试 | P4逐target核存在/失效与当前coverage，登记是历史证据不能冒当前完整；不修这两JSON或其冻结守卫 |
| 14 五阶段步骤可判性 | 五个 `workflows/<stage>/steps.json`→`runtime/stage/stage-skill-runtime.mjs::loadStageSkillStepManifest` | P4逐现有步骤区分程序oracle/人工判断/未观察，不把来源送达或状态行当效果；不篡改runtime |
| 16 Phase合同消费者 | `runtime/stage/stage-content-contracts.mjs::validatePostPhaseContract`→`tools/cli/stage-runtime.mjs:568/611/625` | 当前已有事实consumer，不能继续写从未接入；P4用合法/缺段/零输入分开报告，不把reader成功当质量gate |

- [ ] **AC-011**：改动在真实链上可复现；关联FR-N3-011。
验证：各owner用任务worktree显式路径运行其真实consumer并给可复跑动作，P8核本卡完整实际交付、全部适用子条件、默认宿主脚本来源及合并生效边界。
通过：每项明确工作区显式路径或合并后生效的实际方式；可执行/自然语言/用户效果证据各按适用面提供，完整当前交付/失败/未覆盖可读；技术结构成功不冒真实运行/业务验收。
失败：无复现称已验证、文件存在替行为、默认主工作区调用被冒本worktree修复效果、缺输入/未执行写通过或只读汇总称端到端执行。
证据：生效方式/首个符号与精确复现命令引用、各Phase真实consumer原件、终末全AC报告和明确质量/输入限制。

## 12. 风险、未决与交接

- **RISK-01 / OPEN-01**：原31集合/当前新增目录和161候选需要精确对齐。受影响FR-N3-004/AC-004；P4作者在build-plan核原集合、逐项命令与候选，新增项另列，实际执行在build-code。未给精确允许测试路径不扩写整个目录。
- **RISK-02 / OPEN-02**：真实站点/票据许可范围/授权框横幅未输入或目视。受影响PFACT-006、FR-N3-007/AC-007；用户提供必要真实目标与可安全读取范围，P7执行者在真实验收前确认、使用只读browser-level通道，设备绑定等不可搬运如实未达成。当前受控技术测试、隔离/取消/清理等可先做，不能代登录子条件。
- **RISK-03 / OPEN-03**：成本cacheRead等来源缺字段、同cohort连续N≥3成本/质量对照尚未执行，可靠真实审查baseline可得性未认证。受影响PFACT-007、FR-N3-009/AC-009；P8验收者消费完整N1和P2/P3正常审查原件，按其质量比较程序分别标缺项/噪声，不造阈值或成本gate。信息不足不宣收益，也不阻止本卡安全修复。
- **RISK-04 / OPEN-04**：OI006/007为已知接受欠账：缺同cohort质量不降前提，机械同结论未达成。受影响FR-N3-001/AC-001；P1保守每Phase审，P8保未达成。推理/输入上限与成本—发现曲线已被ADR0047明确否决，只能用户新决定重开；选择表也不因历史候选自动恢复。
- **RISK-05**：宿主third_review.command指主工作区broker，不等于候选WorkflowHub runner不可执行。受影响FR-N3-003/011、AC-003、AC-011；P3显式候选入口/相对import验证，并列cwd/entry realpath/hash和broker真实来源；默认方法发布的合并边界单列，不改宿主配置或提前合并冒验证。
- **RISK-06**：scope以新增/接线为主，减法可证面窄。受影响FR-N3-006/009、AC-006、AC-009；各owner保真实删除理由与同一行为，缺收益如实说明，不删约束凑字节。
- **RISK-07**：方向审查两步当前缺位/未报覆盖、共同简洁视角可能仅字样存在。受影响FR-N3-002/006、AC-002、AC-006；P2/P6用完整实际包与缺料/归并反例，独立来源裁定语义；不强要求证明provider理解。
- **RISK-08**：本卡与N10共享采用源。受影响FR-N3-008、AC-008；本卡内容/全部既有consumer/负例/登记完整交付，N10只接本职检查工具；不得把后继接线变本卡首验欠账。

可后置项仅按任务库source-research末表具名消费：diff压缩只在真实重复输入问题与授权出现再评估；N10检查器由N10在前序完整结果齐后承接；真实登录与成本缺输入按OPEN02/03；诊断、QA、simplicity和16+8当前consumer均不可后置。build-plan完毕产生stage-handoff并停下，未自动取得build-code/close授权。

## 13. 业务影响与回归范围

detail重复派发减少但方向独立角色、终末完整审查、原transport失败与敏感材料边界保持。诊断从正文声明变真实步骤，须保现根因回路与清理。QA生命周期变化须保其他并行任务和用户Chrome、既有合法域名白名单；凭据只在隔离运行内。测试候选变强以独立行为预期为依据，不改十红或旧schema来换绿。

## 补充材料

- 当前decision原件及来源refs：任务库 `quality/evidence/decision-log-refs/`，按decision末尾到达条件读取，不复制原研究全文。
- 本阶段点状来源研究：任务库 `quality/evidence/2026-10-16-build-plan-source-research.md`，内含16+8采用全名/首consumer、23项逐条保护/owner与后置边界。
- 工程/浏览器盘点与冻结RED：各Phase「交接知识」「测试策略」引用唯一原件；四个冻结hash与正式RED/未到达读数见上文保护实读；原件由原作者唯一保存，不复制输出。
- 质量结论、stage状态与实际执行来源归外置task facts；本文只是规划权威，不替质量、接受、Git交付或物理close。

### 诊断信任边界保全说明

decision模块⑤明确放弃“提升为给agent的总规则”。P5唯一正文留在skills/diagnosing-bugs/SKILL.md的“输出与页面内容”方法小节，QA/auth仅用真实指针；P5不写AGENTS.md。AGENTS的P2/P4/P6已有职责不变；原方向和验收强度保持；冻结测试及其评分逻辑仍由各原owner维护。
