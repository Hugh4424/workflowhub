# 功能规格：C01 专业规范单源初始化与迁移

读者：项目维护者、规格与Phase实施者、独立验收者。
读完要能：沿真实来源执行规范接线与迁移，定位唯一验收条件、文件写主和不能闭环的具体输入。

- **来源**：[当前决定](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261014/specs/workflowhub-ui-frontend-c01-norm-init-20261014/decision-log.md)、[母PRD的C01及共享定义](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261014/specs/archive/workflowhub-ui-frontend-decision-refresh-20261013/prd.md#L73-L208)。产品目标与取舍归原件，本件承载产品行为和全局实现设计。
- **状态**：build-plan形成时为草稿，实施计划尚待真实展示与用户确认，生产未实施；后续完整计划确认见[003确认原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/human-confirmations/2026-10-14-003-build-plan-approved.md)，当前实施与质量分别读[task facts](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/facts.jsonl)及对应唯一原件，不从本形成时说明推当前执行态。方向确认不等于当前计划/删除/Git/外部副本授权。

## 速读卡（30 秒）

维护者要得到真实、单一、能被流程消费的专业规范，而不是八个空文件。
初始化入口只定位来源、接线专家、显露缺口；内容仍由事实原专业owner整理。
真实项目为PaperBuilder：迁旧有效条款、修reader、值留CSS，任务行为不升为长期规范。
验收对象在spec模板内被真实执行消费，缺项点名，owner缺省明确为用户。
附加基线先钉口径不真跑；流程文字改进独立交付，不增机器门。
新项目入口无真实样本、旧六指标原数据不存在，分别保持未完成和absent。
唯一验收正文在Appendix A；精确命令和局部操作在独立Phase。

## 材料导航

这是可再生非权威导航：先读需求解释与场景理解用户结果；按本次动作读功能需求、实体和架构边界；实施分工读实现设计及相应独立Phase；验收读Appendix A全部子条件。需要核25个旧消费点/47条款原义时沿[提取证据](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/build-plan-requirements.md)的条件来源回读原件；需要实际执行结果读task facts与各命令唯一原件，不从本件推已完成。

## 来源与决策映射

| 来源 / 原件定位 | 承接决定 | FR / AC | source_status / 场景 | 未决或交接 |
| --- | --- | --- | --- | --- |
| R-C01-01/02；决定原始需求 | ADR-C01-001/004/006/009/014 | FR-C01-001/002/003/004/010；AC-C01-001～004 | current；SCN-001/002/003/004 | 新项目样本OPEN-01 |
| R-C01-03；母PRD S2/C01-F1 | ADR-C01-014/004/005 | FR-C01-001/004/006/010；AC-C01-001/004 | current；SCN-001/003 | 第三起点缺真实输入 |
| R-C01-04/07；25迁移点 | ADR-C01-001/002/003 | FR-C01-002；AC-C01-002 | current；SCN-002 | 存量扫描覆盖限制保留 |
| R-C01-05；母PRD S5 | ADR-C01-009 | FR-C01-003；AC-C01-003 | current；SCN-004 | 模板producer待实施 |
| R-C01-06；S3原能力 | ADR-C01-015 | FR-C01-005；AC-C01-005 | current；SCN-005 | 许可/合法AUDIT入口OPEN-02 |
| R-C01-08/09/12；旧条款与目录 | ADR-C01-004～008/012/016 | FR-C01-004/006/010；AC-C01-001/002/004 | current；SCN-003/007 | 治理未迁条款OPEN-03 |
| R-C01-10/11；横向owner/非目标 | ADR-C01-014/004及非目标 | FR-C01-001/002/004/010；AC-C01-001/002/004 | non-goal为第10节排除项；其保全行为current | 非目标不得倒填完成 |
| 母U014/U015/U019/U020；母D014 | ADR-C01-001/004/008/014 | FR-C01-001/004/010；AC-C01-001/004 | current；SCN-001/003 | 词义源原位不新建 |
| U-C01-001/003/004/006/008；真实项目/分文件 | ADR-C01-004/011/016 | FR-C01-004/010；AC-C01-001/002/004 | current；SCN-003/007 | 大小写暂定OPEN-04 |
| U-C01-002/005/007；C09准备/顺序 | ADR-C01-010/013 | 附加B | current准备；C09最终实验deferred | OPEN-05/06，非C01 AC |
| CARD-C01-WP6：当前决定WP6与验收面；Talk q22/batch009模块六 | ADR-C01-017/018 | FR-C01-007/008/009；AC-C01-006 | current；SCN-006 | 无新增方向问题 |

六个规范化AC依次对应上游AC-C01-1、2、3、4、F4、WP6；规范化只为当前内容profile编号，不重编号或删除原承诺。batch009对原工作包的细化沿真实Talk原件，不把缺U编号当作新增需求许可。

## 1. 需求解释：问题与紧迫性

维护者需要知道一条规则来自哪里、由谁修改、谁实际读取。当前WorkflowHub仍把视觉、组件、工程和页面状态塞进Design/Experience两文件；PaperBuilder旧正文还包含任务业务状态、过时引用、手写CSS数值镜像和仍读取旧文件的守卫。只重命名会让规则继续混权，甚至为保测试而保旧双active。

本次把已确认的八类专业分工接入当前流程。维护者给真实输入，入口把动作交给专业方法；专业作者核适用与冲突后整理，规划、原型、实现与验证只取当前动作需要的来源。实际资产/API证明当前事实，不反向覆盖已确认预期；材料评分、目录、截图和reader名字不能证明规范生效。痛点与目标原义沿[母PRD US01/C01](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261014/specs/archive/workflowhub-ui-frontend-decision-refresh-20261013/prd.md#L191-L208)。

## 2. 背景、目标与范围

### 背景

PaperBuilder是React19/TypeScript/Vite SPA，不是Next；SimulationBoard/SimWorkbench是Figma Make导出原型里的页面。领域词义已有根CONTEXT，视觉数值已有CSS，工程已有配置、PRD§12.7、架构清单和ADR。旧31根token的摘要计数已被本轮工程实读34条推翻，保全部真实角色，不为旧计数删除三个角色。形成时事实及逐字保护实读沿[工程研究](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/build-plan-engineering-research.md#L79-L110)。

### 目标

交付单一、可消费的专业来源与真实迁移；按三类内容起点提供方法，缺真实起点输入就显露影响；验收对象在现规格/实施/验证实际消费；两个外部方法有源采用、不伪安装/分数；在真实任务准备验证内容适用与不混写。附加B只提供C09口径和输入，不替代其实验结果。

### 范围内

薄规范入口；25已知迁移点及其真实caller；47条旧条款的分句去向与当前有效性；spec内验收对象producer和两个真实reader；SDD分责及材料GUIDE/AUDIT的合法真实采用；PaperBuilder分文件整理、角色元数据/守卫/旧源退出；WP6三项可发现性与既有入口契约；C09基线口径先行。本文不以C09补测本卡验收。排除项仅在第10节维护。

## 3. 用户场景与状态覆盖

### SCN-001：维护者从真实内容起点定位专业来源

角色为维护者和原专业owner。入口接收真实目标/方向/栈，或已有可信规范，或已有实现；按类核来源、owner、consumer、版本、适用性和缺口，接线专家，而不是生成器代写全部内容。缺新项目样本时说明其未执行与提供者，继续已有规范/实现两路；不能用夹具充第三真实例。关联FR-C01-001/004、AC-C01-001。

### SCN-002：现阶段reader消费迁移后的来源

原规划/原型/实施/验证消费者读各专业源的适用规则和按类identity，单类missing/stale不等于其余类失效。旧两文件路由退出；未支持扫描留具体unknown。build-code通过frontend-testing间接消费，build-prd经readiness/render继承，不凭无显式旧文件名创造reader。关联FR-C01-002、AC-C01-002。

### SCN-003：PaperBuilder维护者迁条款而保真实事实

原专业作者从旧条款与当前实现核保留/更新/过时；通用规则进专业源，业务状态/权限/API归原任务，历史仍历史。值只在CSS，角色元数据带定位和语义，不夹精确值。先新源可消费，再守卫切新源，最后根Design退出；中间只交局部结果，不宣无双active或整卡通过。关联FR-C01-004/006/010、AC-C01-001/002/004。

### SCN-004：验收者读取合法对象或定位具体缺项

规格作者填spec现有结构区块，build-plan和verify消费同一模板checker及真实对象。缺工作区、服务、route、状态、viewport分别点名；owner省略或空白显式为用户，已给owner保留。对象结构检查不代环境健康或业务运行；真实任务准备消费一次以证明非schema空壳。关联FR-C01-003、AC-C01-003。

### SCN-005：采用者有源使用外部方法

采用owner读取固定SDD Skill/execution与材料GUIDE/AUDIT闭包，查新、比较、核许可、适配与错误路径。许可unknown不vendor；可以合法在线引用方法处理真实任务材料，实际未调用不写已采用；完整AUDIT执行缺合法入口时保持具体unavailable，不自建评分冒原能力。关联FR-C01-005、AC-C01-005。

### SCN-006：主会话按可见说明复放既有流程

review公开入口与裸入口差异明确，契约固定现有行为；每步必要产物/进入条件到行首加粗；用户可见问题改用清楚人话并保机器记录语域。Talk目录实际没有另份格式附件，原格式在同Skill问答IO/2.1段，唯一writer在同文件整理，不虚造新附件。关联FR-C01-007/008/009、AC-C01-006。

### SCN-007：实施者遇到保护或外部条件缺失

当前仅规划；未来执行者按真实授权核受保护路径、动作和HEAD，独立test-change审查与同等负例后才改活守卫。删除及跨仓merge当前pending。case-sensitive布局不可从APFS同inode推通过；若无合法环境只该条件unavailable。关联FR-C01-004/006/010与附加B与OPEN-02/04/05。

### 状态覆盖清单

- 默认：SCN-001/002/004有真实源与合法对象。
- 空：SCN-001无实质内容不造空骨架；SCN-004逐字段缺项。
- 错误：SCN-002断链/冲突不回旧双源；SCN-003守卫角色/锚失配非零。
- 加载：SCN-005查询与执行尚在进行不计已采用；不新增UI加载状态。
- 取消：保外部执行原取消及未执行范围；本卡不新增业务取消机制。
- 边界：角色漏增/重复、feature scope扩大、13非颜色锚漂移、目录大小写分裂。
- 权限：SCN-005/007许可、凭据和执行授权不足只限制受影响动作。
- 竞态：共享文件仅一个Phase作者；迟到输出保原件不覆盖新事实，不新增恢复状态机。

场景修订由spec原作者具名记哪条case/原因/影响与Appendix A关联；普通实施者不自行改承诺。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：状态 `verified`；当前旧reader和间接链真实存在。证据为[迁移原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/decision-log-refs/migration-surface-audit.md)及[工程实读](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/build-plan-engineering-research.md#L11-L19)。关联FR-C01-001/002、AC-C01-001/002。
- **PFACT-002**：状态 `verified`；PaperBuilder具有旧规范/实现两起点，根Design/Experience/CONTEXT的条款原件与真实CSS/守卫有消费者。证据为[47条款原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/decision-log-refs/research.md)、[PB真实consumer实读](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/build-plan-paperbuilder-research.md#L125-L142)。关联FR-C01-004/006/010、AC-C01-001/002/004；它证明当前事实不证明迁移后有效。
- **PFACT-003**：状态 `unknown`；真实新项目目标/方向/栈输入不存在。owner为未来真实项目owner/用户；影响FR-C01-001/004、AC-C01-001、OPEN-01/RISK-01，不能以两个例成功推整条通过。
- **PFACT-004**：状态 `verified`；build-plan形成时工程实读基线：模板当时仅指针、无验收对象checker，public review有顶层ref resolver，裸入口不解析。证据为[工程接缝实读](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/build-plan-engineering-research.md#L15-L33)。后续实现与质量读[task facts](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/facts.jsonl)及对应唯一原件，本形成时基线不声明当前checker仍缺失。关联FR-C01-003/007/008/009、AC-C01-003/006。
- **PFACT-005**：状态 `unknown`；两外部固定来源无可核复制许可grant，完整AUDIT合法执行入口未具备，UI Designer具名子技能不在本仓。owner为采用者；影响FR-C01-001/005、AC-C01-001/005、OPEN-02/RISK-03。可达性与闭包读取不证明合法运行。
- **PFACT-006**：状态 `verified`；旧六指标原数据absent，用户q10已定本卡不真跑，Downloads/UI是选定新代、两代均非Git。证据[真实答复](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/decision-log-refs/talk-batches.md#L100-L116)、[现场事实](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/decision-log-refs/target-recon.md#L59-L93)。关联附加B/OPEN-05/06，不冒C01/C09 AC。
- **PFACT-007**：状态 `inferred`；规范暂定小写specs/design、既有大写原型原位，可在case-sensitive系统分开布局。依据母U020与当前D风险，但未经用户确认、当前APFS无法证明Linux正确；缓存Docker内部clone检查已设计但尚未执行。关联FR-C01-010、AC-C01-004、OPEN-04/RISK-04；这是一处普通细节最小假设，不是新方向裁定。
- **PFACT-008**：状态 `not_applicable`；本卡不设计新业务页面原型，用户q4明确C01设计展示不需要；关联FR-C01-010、AC-C01-004。仅免新UI设计展示，不免PaperBuilder前端事实、守卫/语义检查和三来源UI审查范围。

## 5. 功能需求

### 专业来源路由（NORM）

维护者从真实源出发，薄入口按类定位和接线，专业owner保持实质内容单源。reader获得规则与具体缺口，验收者可以用真实任务而非文件数判断其作用。

- **FR-C01-001**：薄初始化入口只定位八类真实来源/作用域/版本/owner/consumer/缺口，接线专业生成维护动作，显露失败。三起点按每类内容取源；入口不写八类正文。依据R-C01-02/03、ADR-C01-014；关联PFACT-001/003/005、SCN-001、AC-C01-001。
- **FR-C01-004**：八类按S2专业分责，缺同职责实质源才默认建文件，同目录等价源复用；领域WH用GLOSSARY、PB用CONTEXT原位。token/API/资产/上游原件只引用，横向主题归原owner与基础源。依据R-C01-03/09/10/12、ADR-C01-004/008；关联PFACT-002/003、SCN-001/003、AC-C01-001/004。
- **FR-C01-002**：全部25已知迁移点、六入口及受影响真实caller按语义改读新源；binding按类，职责正文一处；旧契约同批转新语义负例、五trigger保字面、ADR0015退出双active。依据R-C01-01/04/07、ADR-C01-001～003；关联PFACT-001、SCN-002、AC-C01-002。
- **FR-C01-003**：spec内验收对象结构实际接现消费者，最小五必填缺项确定性点名，owner缺省显式用户；唯一模板checker被真执行，合法/缺项/空白/多缺/保owner均可观察。依据R-C01-05、ADR-C01-009；关联PFACT-004、SCN-004、AC-C01-003。
- **FR-C01-005**：固定SDD分责/execution与材料GUIDE/AUDIT真实采用并登记，至少真用一次，履行S3查新比较/失败、许可/完整闭包/适配/consumer/维护者。合法引用与运行事实分开，缺合法入口不冒安装或采用；不迁六材料双写/重开/分数放行。依据R-C01-06、ADR-C01-015；关联PFACT-005、SCN-005、AC-C01-005。
- **FR-C01-007**：审查入口说明澄清公开review顶层ref/裸差异与认证worktree，定向契约固定既有行为，原WP6文字工作不改CLI/resolver；新增P1基础设施接线是用户后续要求补计划的独立范围，不偷归WP6。依据CARD-C01-WP6、ADR-C01-017；关联PFACT-004、SCN-006、AC-C01-006。
- **FR-C01-008**：方向每步必需产物与前置条件行首加粗，原步骤/编号/三完成条件保全，真实内外研究与争议逐条处置可见。依据CARD-C01-WP6、ADR-C01-018；关联PFACT-004、SCN-006、AC-C01-006。
- **FR-C01-009**：Talk同Skill格式/IO与新增用户可见说话方式分域，禁三形态并补正例，保真实问答和机器字段。依据CARD-C01-WP6、ADR-C01-018；关联PFACT-004、SCN-006、AC-C01-006。
- **FR-C01-010**：47旧条款各分句核来源/适用/冲突/consumer、保留/更新/过时、专业/任务/历史/缺口去向；PB按S2分文件、README只指针；一次真实准备核语义及五种事实分离。Experience历史与版号保留仅ADR007引用行例外；根Design全活消费迁完后删除。依据R-C01-01/02/08/09/11/12、U-C01-006/008、ADR-C01-004/006～008/012/016；关联PFACT-002/007/008、SCN-003/007、AC-C01-001/002/004。
- **FR-C01-006**：CSS值保持唯一源，metadata仅角色/定位/语义/禁令，守卫改新源不减保护，34根+2feature完整集合、13非颜色定位、scope/退役/豁免/失效ref/化石断言和负例保全；冻结oracle变化走owning correction+独立test-change review。依据R-C01-03/12、ADR-C01-005/012/016；关联PFACT-002、SCN-003/007、AC-C01-004。
- **附加B**：附加B在所有改造前钉旧WH/PB对象、代次/环境和S6口径，不真跑，不产旧指标数值；raw absent与C09实验前补跑、对象未定具名传递。依据U-C01-002/005/007、ADR-C01-010/013；关联PFACT-006、SCN-007、附加B。该附加合同无C01 AC，独立T002交接判据与P13读回，不为满足结构冒C01通过。

## 6. 模块划分

专业入口负责定位/接线而不写内容；现reader负责动作范围与按类身份；验收对象producer负责输入缺项判定而不认环境健康；外部采用者负责固定源/合法方法实际消费；PB专业owner负责条款/值源/历史边界；WP6方法作者负责同一既有流程的可见说明。各依赖当前材料/真实原owner，不设新状态机。产品职责仍为WP1～6+B；Phase按单个可验收结果展开，不把模块数当Phase配额。

## 7. 关键实体

- **专业来源**：类、实际路径/section anchor、作用域/版本、owner、真实consumer、适用/缺源/冲突与影响；是普通可读合同，不新增机器schema或同步平台。每类identity独立，任务例外与 adopted源版本显式。
- **条款去向**：原条款/分句→保留/更新/过时→唯一正文或原任务/历史/缺口→consumer与承接owner；缺来源/consumer不假迁。完整输入沿47条原件，本文不再复制第三份条款正文。
- **验收对象**：workspace/service/route/state/viewport为此卡最小必填；owner未给/空白为用户。设计源、代码/URL、数据/权限由S5真实任务合同补，适用N/A具名。这不是后台环境登记。
- **token元数据**：schema_version为1；roles及non_color_roles均数组；逐项id/category/status/owner/selector/property/semantic/prohibited_use；非颜色可有within_selector用于media结构定位。status仅active或legacy-new-use-prohibited。无value/精确数值字段，文本也不夹精确CSS值。完整接口以[冻结测试](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/tests/c01-paperbuilder-metadata.test.mjs#L15-L53)实字节为设计来源。
- **附加基线口径**：旧版本对象、样本来源代次/path/mtime、环境与入口、S6六指标定义、absent与未决下游；不是baseline-metrics数值或进度对象。

## 8. 数据和生命周期

来源由原owner维护，reader每动作按已采用类版本取最小充分规则；新证据与预期冲突显式回原owner，不由当前代码自动反推标准。当前任务行为/spec/Phase与命令/审查facts分别留原owner。新专业正文迁完后替代旧active路由，保历史Experience和归档原件；兼容锚仅同批过渡，所有活consumer迁新锚且定向复验后由原owner清除别名，根Design不作永久bridge。

元数据修改前保存本次文件原字节；值留CSS并由test-only冻结独立旧期望核保护，不以从实施重算期望自证。原始输出每类一件，报告immutable；失败/取消/迟到保真实来源。只清理自建临时夹具，不清用户资料/登录态/原型工程；回退只本次hunk或对应提交，不整树快照覆盖。

## 9. 兼容性预留

已有正常调用链仍沿五阶段与七类public命令；按类源替旧双文件，不新增专业正文runtime resolver平台或第二writer；新增P1的trusted services只读scope选项是现正式审查捕获Interface，不是新来源权威/持久授权平台。模板内checker是现模板资源的局部执行内容，两个消费者运行同一producer；若现成同职责checker未来完整承接consumer才退该块。PB组件API/CSS值/后端行为保持，root旧Design删除依实际迁完与授权；历史引用按历史保留。compat anchor可读定位但不写第二套规则或跟踪平台。

## 10. 明确不做与默认必须成立

### 明确不做

- 全库/所有项目迁移与八空文件：母C01限定当前真实源及consumer。
- C04新提炼采集器、C05新原型、C06 stylelint/完整Vercel实现、C07完整页面验证、C08持续升级机制、C09两路最终实验：各归原卡；本卡接线/实质内容不后置让这些卡兜底。
- 真跑旧基线或造六指标数值：用户q10选只钉；历史5轮/30缺陷/20+小时仅旁证。
- 新规范维护skill、第九规范、万能IR权威、漂移/同步/知识后台、第二任务/进度/状态平台：母D014与宪法薄核心。
- 新public CLI命令、正文resolver/许可平台、stage/gate/机器门/steps零consumer修缮：WP6只澄清现行为与文字可发现性；新增P1私有可信host选项与原capture窄改例外已在OPEN07明列，不增公共流程。
- 删除Experience/改历史版号/重写母归档或review失败：原历史保留；引用行有限例外归第12节。
- PB词义改名/新GLOSSARY/domain/spec目录、原型大写路径重排改名/改字节、Tailwind入PB/样例数字入runtime、后端/API/页面/token数值重写：真实项目原owner边界。
- 无许可vendor/包落盘、部署、未授权Git/根Design物理删除：执行动作pending来源，当前只规划；通用持续授权不覆盖显式收窄。

### 默认必须成立

每事实一处正文writer，专业/任务/API/资产/知识/facts分离；缺来源/未知consumer不当零或通过；正常工作继续仅停依赖缺项；测试/独立审查真实做或如实不可用，不作推进许可证；严重问题修复优先、未达不可假绿。UI适用性三来源分别描述，本卡不设计新页面不代表目标项目没有UI。

## 验收流程

从当前决定验收面取原六条映射，Appendix A保唯一条件；按场景→FR→Phase Task→真实oracle正负例逐子条件读回。P2先交准备事实；各Phase只声明自身效果；P13唯一末验收一次消费上游原件并执行必要未闭环case，真实准备/合法对象/外部真用与独立完整材料读回不能用聚合旧输出代替。新项目输入仍缺时只对应子条件非pass，不整批延期或靠数量宣布全部达成。

## 测试标准

| 测试面 | 适用与oracle | 证据/覆盖上限 | 负责Phase |
| --- | --- | --- | --- |
| 入口/reader语义接线 | 专业source实际定位/按类缺项；完整材料独立读回 | 方法输出/负例/读回，文本匹配不证语义 | P3/P4/P6/P13 |
| 对象checker行为 | 模板实际producer、合法/逐删/空白/多缺/owner | 定向Node测试及两consumer执行；不证服务健康 | P5/P13 |
| public review现行为/文字 | 顶层ref真解析、裸不解析、错sha/cwd失败 | 受控真实接口+文字读回；注入provider不冒外部review | P10/P13 |
| PB角色/定位/冻结保护 | CSS原值、36角色及13定位、各等价mutant拒绝 | task-local元数据与既有vitest定向；不以digest/数量代语义 | P8/P13 |
| 条款单源与真实准备 | 47每分句适用、原历史/任务分离、live consumers | 专业生成/reader真实准备+独立语义全读 | P7/P9/P13 |
| 外部方法 | 固定版本闭包/许可/更新比较/查询失败与实际任务消费 | 原源ref、采用原输出；未跑AUDIT不算完成 | P6/P13 |
| 方向与Talk文字 | 原步骤/条件/标题保全、新节/三禁/正例、实际人话复放 | G-2完整材料独立读回；无新增行为不仪式RED | P11/P12/P13 |
| 大小写布局 | 授权Docker内部Linux检出两路径及限定consumer | 真Linux原输出；APFS/字符串推演不证Linux | P9/P13 |
| 浏览器页面/性能/业务E2E | 本卡不改生产页面/组件/CSS/API，无新视觉状态；仅迁规范/既有守卫 | 本卡命令/语义验证不冒浏览器/a11y/性能/业务；完整两路径C09 | 本卡具名不测新浏览器面 |
| B环境/数据就绪 | pin-only实际对象/环境可读、旧raw absent | 两就绪原件与契约；不测旧流程收益 | P2/P13 |

具名runner：两new target实读import Vitest，使用direct `node node_modules/vitest/vitest.mjs run`，不使用Node --test或pnpm wrapper；旧ui-skill契约实读node:test才用Node --test。最终producer/method文字目标RED与public5guard本来PASS+1文字RED沿工程研究:150–154单份原件；pnpm安装及旧fixture错失败不算RED。

主具体技能：WH方法/Node接口backend-testing；PB既有前端守卫frontend-testing；真实全栈业务能力不在本卡写集，不为Phase数升fullstack。各要测面在所属Phase精确命令；只受影响测试，不全vitest/npm test/test:unit/make check。冻结目标RED归因区分目标/环境/本来通过，独立test-change后同oracleGREEN；机器结构检查不替独立自然语言质量。


### 前端组件质量地图与UI三来源

action=reuse的对象是现AsyncStatePanel、UiDialog、UiDrawer及UiAsyncState/LineageIdentity/WorkbenchIdentityViewModel，真实消费者为App/current-market-workbench/现stop确认与页面。state owner仍页面/store；本卡不改props/events/typed ViewModel接口、不抽共享/不删组件，故本卡接口变更为N/A，不冒不存在的新consumer。action=modify对象仅style/live测试的metadata读取；CSS/token owner保持tokens-base/primitives/page-local，值不变。story_or_test_update就是两受影响guard，不造Storybook。真实T05 census有route/import/lazy/CSS/data有限支持但未运行且不支持全动态import，完整consumer-census重放unknown，不新扫描平台、不推全库零未知。[PB实读地图](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/build-plan-paperbuilder-research.md#L17-L25)。

审查三来源普通事实均ui_scope=true：raw_requirement=C01真实视觉/组件/交互规范与guard请求；project_inventory=PB React/Vite真实路由/组件；planned_or_changed_frontend_fact=拟改role规范、metadata与style/live读取，当前生产无改。新业务UI展示不适用由PFACT-008限定；当前preview/screenshot/交互运行unknown/not_run，不借静态截图或N/A省UI lens。

## 架构边界

入口和reader消费各类原owner的内容；验收模板producer只判对象输入；真实环境与任务结果仍由实际执行者提供。PB规范引用原CSS/API/架构而非codegen第二数值/API清单。阶段runtime/facts/review-record-route只记录事实，不成为新增reader门。共享path只有一个Phase owner；段级需求跨工作包由该作者一次整合，不用串行重复写集假豁免。

## 实现设计（全局权威）

### 代码锚点

具体锚点为`skills/ui-project-init/SKILL.md:13-21`、`workflows/build-plan/SKILL.md:19-30`、`skills/frontend-testing/SKILL.md:30-37`、`skills/spec-specify/templates/spec-template.md:223`、`tools/cli/stage-runtime.mjs:539`、`/Users/Hugh/Hugh/Project/PaperBuilder/frontend/src/ui/style-token-guard.test.ts:13-333`。工程真实producer/consumer与逐字保护实读沿[工程研究:11–90](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/build-plan-engineering-research.md#L11-L90)。WP6原步骤三完成条件直接读[make-decision:47–49](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261014/workflows/make-decision/SKILL.md#L47-L49)，不是摘要漏第三项。PB读取[原守卫:276–333](/Users/Hugh/Hugh/Project/PaperBuilder/frontend/src/ui/style-token-guard.test.ts#L276-L333)的nonColorAnchors/resolveCssValue/validateNonColorAnchor全部消费，不能只迁颜色。角色形状及集合沿冻结task-local测试，实际CSS仍唯一值源。

2026-10-14用read实读的受保护字面：WH五trigger为ui_scope_existing_project_baseline、ui_scope_readable_design_sources、ui_scope_actual_prototype_preview、ui_scope、ui_scope_design_lens_in_merged_review；public runtime为doctor/status/run/review/verify/confirm/authorize，review仅record；PB exemptions恰src/ui/tokens-base.css、src/footprint/core/marker-overlay.ts、**/*.test.ts(x)；RETIRED四role值与live exact pair及原noncolor签名逐字清单在上述工程原件，作为冻结测试例外不复制为生产第二源。未实读其它保护依赖保unknown，下次执行者按实际目标核，不宣全目录签名未变。

### 接口与失败语义

**选型与简化**：复用现技能、模板、真实CSS、task facts与七public入口。没有额外runtime对象执行器：模板内唯一具名JS块导出checkAcceptanceObject(input)，由两个方法消费者抽取实际字节运行；测试同样运行producer，不在测试重实现。它解决真实缺项不点名问题且不需要新脚本/CLI/schema/持久控制面；现同职责能力将来完整替代才移除。

对象块marker为HTML注释中的精确标识`c01-acceptance-object-check`（注释起止语法按已冻目标源码）；输出`{ok, missing_fields, object}`，固定五字段顺序workspace/service/route/state/viewport；缺/空白按名列missing，owner省略/空白归用户，原值保留。消费者须传真实完整对象并保存执行输出；missing不可忽略，block未生成/导出错误不冒检查成功。实际接口以P5冻结测试与作者实读为准，若源不一致回规格owner修不另造resolver。

#### 验收对象（模拟记录列表声明输入）

此处填写P13原定模拟记录列表/详情准备中的列表对象；五项取自真实工作区、配置、入口、待验状态定义和规定尺寸，不是现场观察，也不将任何最小项写为N/A。数据形状与声明/观察界线沿[唯一模板验收对象节](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261014/skills/spec-specify/templates/spec-template.md:227)。

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014",
  "service": "http://127.0.0.1:5175",
  "route": "/simulations",
  "state": "loading",
  "viewport": {
    "width": 1440,
    "height": 900
  }
}
```

| 字段 | 真实来源 | 本次未观察范围 |
| --- | --- | --- |
| workspace | setup118已认证PB专用checkout `/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014`，本次原路径实读 | 不由本对象授予新的写入、Git或服务操作范围 |
| service | [vite.config.ts](/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014/frontend/vite.config.ts:6)的host `127.0.0.1`与默认port `5175`；`PAPERBUILDER_F6_FRONTEND_PORT`可覆盖 | 此值是配置默认声明；当前环境覆盖、实际监听、health、API连通均未观察，不宣服务已启动 |
| route | [App.tsx](/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014/frontend/src/App.tsx:138)真实`/simulations`入口接SimulationRecordsRoute | 未请求页面或观察路由成功；详情139–142需真实simulationId，当前不编造详情ID/URL |
| state | [App.tsx](/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014/frontend/src/App.tsx:39)的RouteLoadingState与[SimulationRecordsRoute](/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014/frontend/src/App.tsx:85)的LazyRouteBoundary声明loading | 待验状态定义，非此刻页面状态；未获取真实列表数据或呈现该状态 |
| viewport | [T05规定尺寸](/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014/specs/paperbuilder-v2-t05-realtime-market-footprint/spec.md:441)、同spec AC-UI-003/004（715–724）、[layouts fixture](/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014/specs/design/layouts.md:86)与[Playwright配置](/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014/frontend/playwright.config.ts:134)规定1440×900 | 规定的验收尺寸，非观察；不推CSS断点、视觉批准或任一页面已通过 |

既有业务目标源为[T05-SPEC-004](/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014/specs/paperbuilder-v2-t05-realtime-market-footprint/spec.md:9)与只读归档[T04-SPEC-001-R1](/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261014/specs/archive/paperbuilder-v2-t04-simulation-preflight/spec.md:12)：从模拟记录定位真实模拟，再进入详情/工作台核身份与输入来源；T04保保存/预检/明确开始边界。本次只提供源目标，不重开旧task、回写归档或套用历史进度/视觉批准/业务通过；缺真实详情ID、数据、权限与执行证据仍具名未完成。

没有用户新指定owner，因此对象不填猜测的C11 owner，独立消费者沿已有唯一checker缺省输出“用户”；这不是风险接受。此处未运行checker、两方法/API、六入口、服务或浏览器；字段结构接纳与真实对象准备/服务健康/业务效果分别由原独立消费者观察，不能以本声明完成验收。

规范来源→薄定位/接线→专家必要正文→reader本动作适用投影/按类identity→任务准备；断链/冲突/生成失败记录类名、源、影响、owner，不回旧双源。readiness仅组织Read Map，不冒观察采集器。

metadata由PB token owner产生；守卫读元数据、按CSS locator取得真实声明，用独立冻结test-only旧期望保护数值/定位，生产JSON无精确值；集合增删/重复/错owner/scope/value字段/文字夹值/13定位缺失及等价mutation明确失败，源解析空不默认合法。本轮唯一文档合并review仅审改测试方案；未来P8具体新oracle字节未写、未批准，不能由本轮coverage/方向授权推导批准。实施前P8 owner先提交实际proposal（原字节/新差异/保护影响/具名真实RED/等价负例），在正常Phase OCR及独立test-change上下文实际审查批准后才应用冻结oracle变更，保存现普通原件；不另加第二次本轮文档review、不自批、不删失败。

WP6public review入口现resolver只读materials顶层ref；裸run将对象序列化不解析，需要内联完整字节；请求外壳request，认证WT不符报CURRENT_WORKTREE_MISMATCH。仅说明与测试不修改实现。Talk新增用户语域和原机器IO分域，格式原owner在同Skill。

### 全局文件边界与依赖

十三个Phase各一个结果，原WP顺序B→1→2→3→4→5保留；WP5分expand/guard/contract，WP6三结果各独立。主会话分配并发2–5，不因Phase编号强行串无依赖工作。

| Phase / Task | 单一结果与真实consumer | Dependency | 唯一文件归属 |
| --- | --- | --- | --- |
| P1/T001 | 获准跨仓改动被现正式审查真实消费 | none；改前raw先提供，非P2 Done | 五现生产+两existing suites唯一owner |
| P2/T002 | 基线口径供C09/P13 | P1 | task-store基线/数据与环境就绪原件 |
| P3/T003 | 薄入口供现reader | P2 | ui-project-init方法与move-map，含WP4条件指针一次写 |
| P4/T004 | 主reader取专业源 | P3 | reader方法/旧契约/ADR；排除registry/catalog |
| P5/T005 | 对象producer可执行 | P4 | spec-template/spec-specify；已冻target只读 |
| P6/T006 | 外部真采用登记 | P5 | registry/catalog含剩余路由迁移 |
| P7/T007 | PB专业规范可消费 | P6 | 各真实有源正文/README |
| P8/T008 | PB守卫取新源 | P7 | tokens-anchor/两guard文件 |
| P9/T009 | PB旧active源退出 | P8 | 根Design删除、Experience引用例外、新ADR外部authority |
| P10/T010 | review入口说明可复放 | P2 | wh-review；已冻public/ref只读 |
| P11/T011 | 方向步骤产物可见 | P10 | make-decision方法 |
| P12/T012 | 用户问题说话方式清楚 | P2 | talk方法同IO/2.1格式 |
| P13/T013 | 唯一末全AC真实验收结论 | P9/P10/P11/P12 | 生产写集为空；执行事实仍现facts/quality |

每个NEW/MODIFY path的精确所有权以作者成稿独立Phase和本节同步，原十二卡实际头此前已读、工程sole迁为P2～P13；新P1七path实际头与当前十三行index本作者已实读，以下并集按当前44精确路径同步（按路径，不目录glob；每path仍由实际Phase唯一owner）：

**Task-store P2 NEW**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/c01-baseline-pin.md`与`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/c01-sample-environment.md`，分别为数据/环境就绪的同一pin结果，非生产控制面。

**WorkflowHub NEW（已预写冻结，未来执行Phase只读）**：`tests/contract/acceptance-object-required-fields.test.mjs`由P5消费；`tests/contract/wh-review-public-entry-and-ref-resolution.test.mjs`由P10消费。预写target tests为本轮已授权测试写作，不是实施生产许可；冻结后实施者不改oracle。

**WorkflowHub P1 MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`tools/cli/stage-runtime.mjs`、`skills/wh-review/scripts/review-source.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`runtime/review/ocr-delegation-adapter.mjs`、`tests/contract/card05-phase-path-and-contract-facts.test.mjs`、`tests/contract/ocr-review-contract-bundle.test.mjs`；同一获准capture结果必需局部，不改两C01冻结targets。

**WorkflowHub 其他MODIFY**：P3 `skills/ui-project-init/SKILL.md`、`docs/architecture/move-map.json`（一次登记本卡新资源/职责）；P4 `skills/design-source-readiness/SKILL.md`、`skills/frontend-prototype-render/SKILL.md`、`skills/frontend-testing/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/verify-code/SKILL.md`、`skills/frontend-component-quality/SKILL.md`、`skills/isolated-browser-qa/SKILL.md`、`skills/spec-prd/SKILL.md`、`tests/contract/ui-skill-contract.test.mjs`、`docs/adr/0015-ui-design-source-and-initialization.md`、`docs/adr/0016-external-first-frontend-component-quality.md`；P5 `skills/spec-specify/templates/spec-template.md`、`skills/spec-specify/SKILL.md`；P6 `skills/reuse-registry.md`、`skills/catalog.yaml`；P10 `skills/wh-review/SKILL.md`；P11 `workflows/make-decision/SKILL.md`；P12 `skills/talk-with-zhipeng/SKILL.md`。

build-plan/verify在P4一次加入对象块条件指针，P5只写唯一producer；中间producer未就绪不冒对象通过。registry/catalog在P6同时完成来源路由与真实采用状态；P4不得冒25点全部完成。bundle只实际附件/登记变化才由唯一owner精确认领，不默认改所有bundle。

**PaperBuilder NEW**：P7 `specs/design/design.md`、`specs/design/components.md`、`specs/design/layouts.md`、`specs/design/interaction.md`、`specs/design/craft.md`、`specs/design/quality.md`、`specs/frontend/frontend.md`、`specs/frontend/ui-quality.md`、`specs/design/README.md`；只实质来源与consumer成立才建，⑤⑦只跨任务部分。P8 `frontend/src/ui/tokens-anchor.json`。

**PaperBuilder MODIFY/DELETE**：P8 `frontend/src/ui/style-token-guard.test.ts`、`frontend/src/live-pages.test.tsx`；P9 NEW `docs/adr/0035-project-norm-authority-and-value-source-migration.md`、MODIFY `Experience.md`仅18/20/289死引用行、DELETE根`Design.md`。221历史approved-source句保原，其缺件在新quality/ADR登记。11未归档文档候选中7形成时历史/冻结源保原，4旧C3/T13生命周期unknown且实扫无machine caller，只由新ADR外部authority supersede当前项目标准，不全11改写、不推无限人类consumer为零；独立审查若不足以支撑退出，删除pending、具体影响/owner保留。

**DO NOT TOUCH**：P1七精确路径以外的runtime/provider/resolver生产实现；P1范围只补可信读scope与正式审查捕获，不能扩公共命令/权限平台/新身份或持久schema；WH五trigger段及固定上游原件；PB `frontend/src/ui/tokens-base.css`、`frontend/src/ui/live-cockpit.css`、`frontend/src/ui/style-token-baseline.json`、`CONTEXT.md`、`tests/test_prd_f6_sync.py`、`specs/Design/P1 回测工作台.html`、`specs/Design/p1-footprint.js`及既有设计原型工程；归档spec/报告/旧失败；task-local `quality/tests/c01-review-wiring-target.test.mjs`预写目标冻结，当前发现的错误夹具须先具体TCR/旧字节保存/独立批准，不能改生产scope上限∩Phaseowned规则迁就它。真实活守卫有条件授权改新源，不列整文件绝对禁改；exemptions/scope/retired等冻结保护仍禁放宽。

新增资源沿现move-map owner/consumer/替代/退出登记；PB无实核move-map，不暗造它，资源职责由现README与正文索引登记。README只定位，tokens-anchor唯一consumer守卫，完整单源替代并迁完所有reader后才可退役。

回退由原Phase owner只恢复受损hunk/对应提交，保用户及其他Phase改动和失败原件；PB专用分支不验证不merge；大小写风险不能为回退移动原型。P7～P9同一integration范围expand–contract，中间不宣整AC通过，删除只在全实际消费迁完后。

### 需求到任务追踪

| 原始来源与行为 | 完整FR / AC绑定 | Phase/Task | 实际局部判定器 | 真实消费与限制 |
| --- | --- | --- | --- | --- |
| R-C01-04/R-C01-08/U-C01-008：真实新源与双仓保护的审查可消费 | FR-C01-002、FR-C01-006、FR-C01-010；AC-C01-002、AC-C01-004 | P1/T001 | ORACLE-C01-REVIEW-WIRING | 可信host scope/双仓原source/none/现公共OCR，技术子条件不是新产品AC |
| U-C01-002/U-C01-005/U-C01-007：改造前pin不跑 | 附加B，非C01 AC | P2/T002 | ORACLE-P1-PIN-ONLY | 两数据/环境原件供C09；raw absent |
| R-C01-02/R-C01-03/R-C01-06：只接线/各类真实源/采用指针 | FR-C01-001；AC-C01-001、AC-C01-002、AC-C01-005 | P3/T003 | ORACLE-C01-THIN | 原Skill→专家；缺原方法不冒调用 |
| R-C01-04/R-C01-05/R-C01-07：真实reader与对象条件指针 | FR-C01-002、FR-C01-003；AC-C01-002、AC-C01-003 | P4/T004 | ORACLE-C01-ACCEPTANCE | 两method实际引用；完整语义/其他reader另核 |
| R-C01-05：模板实际producer/缺五点名/owner | FR-C01-003；AC-C01-003 | P5/T005 | ORACLE-C01-ACCEPTANCE | 实块正负行为，真实consumer末P13 |
| R-C01-04/R-C01-06：固定方法真实采用并登记/剩余路由 | FR-C01-005；AC-C01-002、AC-C01-005 | P6/T006 | ORACLE-C01-ADOPT | 登记检查不代真实使用/许可 |
| R-C01-02/R-C01-03/R-C01-08/R-C01-09/R-C01-12：47分句/专业正文 | FR-C01-004、FR-C01-010；AC-C01-001、AC-C01-002、AC-C01-004 | P7/T007 | ORACLE-P6-NORM-SOURCES | 真实原规范/实现→source→reader；语义独立读回 |
| R-C01-03/R-C01-12：值单源/34+2+13守卫等强 | FR-C01-006；AC-C01-002、AC-C01-004 | P8/T008 | ORACLE-P7-METADATA-GUARD | metadata→旧style/live，独立旧期望与mutants |
| R-C01-08/U-C01-006/U-C01-008：旧源退出/历史例外 | FR-C01-010；AC-C01-002、AC-C01-004 | P9/T009 | ORACLE-P8-LEGACY-RETIREMENT | 删除需真授权/真实迁完，四unknown不假零 |
| CARD-C01-WP6：现public/ref说明真复放 | FR-C01-007；AC-C01-006 | P10/T010 | ORACLE-C01-PUBLIC-REF | 五guard本来绿/文字target，非真实provider |
| CARD-C01-WP6：全部步骤产物条件可见 | FR-C01-008；AC-C01-006 | P11/T011 | ORACLE-C01-STEPS | 文本有限命令+独立完整原条件读回 |
| CARD-C01-WP6：用户语域三禁与正例 | FR-C01-009；AC-C01-006 | P12/T012 | ORACLE-C01-TALK | 同Skill格式保机器IO，独立全文/人话 |
| R-C01-01/R-C01-02/R-C01-03/R-C01-04/R-C01-05/R-C01-06/R-C01-07/R-C01-08/R-C01-09/R-C01-10/R-C01-11/R-C01-12/CARD-C01-WP6：全原子条件真实验收 | FR-C01-001、FR-C01-002、FR-C01-003、FR-C01-004、FR-C01-005、FR-C01-006、FR-C01-007、FR-C01-008、FR-C01-009、FR-C01-010；AC-C01-001、AC-C01-002、AC-C01-003、AC-C01-004、AC-C01-005、AC-C01-006 | P13/T013 | ORACLE-P12-ALL-AC | 两真实起点/对象/原方法/独立语义，不改原AC |

Appendix A的ORACLE-NORM-*是产品语义轴别名，不与上述局部实际oracle同名：SOURCES→P3 THIN/P7 NORM-SOURCES/P13 ALL-AC；READERS→P4 ACCEPTANCE/P6 ADOPT及UI契约/独立reader实跑；OBJECT→P5 ACCEPTANCE/P13；CLAUSES→P7 NORM-SOURCES/P9 LEGACY-RETIREMENT/P13全文；GUARD→P8 METADATA-GUARD；ADOPTION→P6 ADOPT及原方法真用；METHODS→P10 PUBLIC-REF/P11 STEPS/P12 TALK；BASELINE→P2 PIN-ONLY。有限局部命令不冒语义别名完整通过。

完整12R/8U/母U与25/47每项原义在[requirements原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/build-plan-requirements.md)，表内枚举只定位，实际行为/通过/失败由场景和Appendix A所有子条件证明，不能ID出现替代语义覆盖。

### 全局验证策略

审查接线派生面由P1独立test executor消费task-local只读fixture目标（具体原件由P1头给）与两现suite的具名受控construction tests；未跑真实OCR的fixture不冒正式review。完整44精确未来path=原37+新增P1七path，index/P1成稿后最终按真实头核。

具体全局重放入口为`node node_modules/vitest/vitest.mjs run tests/contract/acceptance-object-required-fields.test.mjs tests/contract/wh-review-public-entry-and-ref-resolution.test.mjs`（cwd认证WT）；reader UI契约用`node --test tests/contract/ui-skill-contract.test.mjs`。这是现target局部命令，完整PB/方法/自然语言条件的具体执行者与其他面命令沿P13，不把本命令exit0当全AC通过。

先同一纵切test→最小实施→下一条，不把所有测试横切后写生产；纯方法只用有源G-2独立复放，不造仪式RED。对象producer不存在的具名target可RED，逐字段行为未到达保持unavailable；review行为已存在的guard可本来通过，说明缺句target才RED。PB元数据producer缺失目标原件沿[RED输出](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/tests/c01-paperbuilder-metadata-red.log)，mutant未到达不冒通过，既有guard改造行为RED需在实施前真实写跑。

P13既读原件又运行必要未闭环真实case：两已有起点的专业任务准备、真实对象块两个consumer、外部方法处理本任务材料、专业源与WP6独立全文语义读回。针对性命令分面由末Phase给cwd/owner，缺真实输入具体非pass。无新浏览器页面写集是未测浏览器E2E的具名理由，不宣有稿/无稿验证结论。机器结构/正则/元数据集合只能局部证明，完整自然语言质量由独立读者消费完整成稿。

## Appendix A — 验收判据（唯一权威）

### AC-C01-001：三个真实内容起点分别产生可消费规范（原AC-C01-1）

- **AC-C01-001** 本节是该验收的唯一条件声明；适用子条件不可因输入缺失取消。

关联FR-C01-001/004/010；source R-C01-02/03、ADR-C01-014/004。
验证：P3/P7作者提供专业owner真实输入与产出，P13独立验收者在本卡末分别执行新项目目标/方向/栈、已有可信规范、已有实现三起点的读取/生成→实际reader消费。两已有起点由未参与实施的P13-input-reader在隔离上下文真实按当前PB模拟记录/详情旅程准备，不改页面/API、不复制示例数据，分别用旧规范原件与当前可证源码输入形成两个section，单份实际观察原件quality/evidence/c01-p12-real-preparation.md；独立full-material-reader复核同原件及完整产物，不以regex/名字代真实方法。旧两起点由PB真实规范/源码owner提供；新项目由真实项目owner/用户提供，当前无材料不得伪造。逐类核适用/缺源/冲突/内容与consumer；独立读者核语义并执行缺源/冲突反例，ORACLE-NORM-SOURCES。取得时点为相应生成/读取后，缺某起点仅该子条件未完成。
通过：三个起点各有真实合法材料的读取/生成例；所需八类有实质可消费内容或有源具名不适用；来源缺失分支明确影响/owner。每类由专业owner而非薄入口代写，不抄第二份token/API。
失败：任一起点未运行却宣整条通过；空骨架/默认业务规则/错实现倒推正确标准；适用缺源伪N/A；仅名字/文件数/两个例替三起点。当前新项目缺样本仍使整条非pass，q20不扩范围不取消该条件。
证据：各真实输入/生成/reader执行原件、完整语义读回、具名缺源/冲突负例；缺新项目输入的实名提供者/取得条件与未执行说明。

### AC-C01-002：旧有效条款和真实reader完整迁移（原AC-C01-2）

- **AC-C01-002** 本节是该验收的唯一条件声明；适用子条件不可因输入缺失取消。

关联FR-C01-002/004/005/010；source R-C01-01/04/07/08、ADR-C01-001/002/003/006。
验证：P4/P6提供25点实际旧→新条款，P7/P9提供47条及其独立分句保留/更新/过时去向；P13独立reader/语义执行者逐点读六入口及相关caller新来源，核按类identity/唯一正文、间接调用链、旧ADR退出与仍有效负断言。producer/旧输入由各原owner提供，迁移后执行ORACLE-NORM-READERS与ORACLE-NORM-CLAUSES，缺支持范围具体unknown不冒穷尽。
通过：每个实际旧条款/引用有具名去向和consumer或未迁影响/承接者；六入口及相关caller真实读取新源；无有效规则静默丢失/新旧双active。required同批转分类语义，五trigger不变，新负断言确实拒绝新口径违规，旧历史正文不重写。
失败：只改初始化或文件名；某分句无去向；未知consumer当零/未执行reader；旧字面硬断言诱保旧active或删负例降强度；P4未到P6即宣25点已迁。
证据：逐处去向与真实reader准备原输出、契约定向运行/负例、独立完整材料读回、scope有限diff；原始事实不复制镜像。

### AC-C01-003：验收对象实际消费与确定性缺项行为（原AC-C01-3）

- **AC-C01-003** 本节是该验收的唯一条件声明；适用子条件不可因输入缺失取消。

关联FR-C01-003；source R-C01-05、ADR-C01-009。
验证：P5 spec-specify owner提供模板内唯一checker与spec真实对象，P13独立执行者由build-plan/verify-code两个现消费者实际抽取/执行该块，保存合法对象输出并在受控对象中逐删/置空workspace、service、route、state、viewport，省owner及给具名owner、多缺固定顺序。真实任务对象由PB/任务owner提供，在实施后和最终准备取得输出，ORACLE-NORM-OBJECT；测试不得自身重实现checker。
通过：合法对象被真实消费者用于任务准备/实施验证；每个必要项缺失确定性点名；owner省略/空白明确输出用户，给定owner保留。S5其余适用输入真实说明，不只schema样例或模板文字；缺项检查真实运行。
失败：只有schema/字段/样例/代码块名字而不执行；checker缺失/导出失败被吞；任一缺项不点名；owner默隐或强覆盖；producer存在RED冒逐字段行为已RED；结构test成功冒服务/业务验收。
证据：目标测试原件与同oracleGREEN、两个消费者实际输入/输出及逐缺项/owner负例，实际cwd/执行者/exit/覆盖限制。

### AC-C01-004：真实任务准备证明分权与PaperBuilder单源（原AC-C01-4）

- **AC-C01-004** 本节是该验收的唯一条件声明；适用子条件不可因输入缺失取消。

关联FR-C01-004/006/010；source R-C01-03/08/09/12、U-C01-006/008、ADR-C01-004～008/012/016。
验证：PB专业owner提供从根旧条款/真实源码生成的新规范、元数据、守卫和active repoint；P13未参与实施者执行一次真实PB任务准备并完整语义读回，检查专业/工程/任务/知识/facts写主及实际读取结果。保存原Experience字节，按已确认ADR007逐hunk仅允许明确死引用行，历史正文和revision保留；根Design删除在全consumer迁完及真实执行授权后核。token owner与独立test-change reviewer在P8改冻结oracle前核差异/旧期望/负例；末定向复验ORACLE-NORM-GUARD和ORACLE-NORM-CLAUSES。
通过：一次真实准备中设计/工程/任务/知识/facts不混写且内容语义适用；Experience存在、历史正文/版号保全，仅ADR007具名引用修复例外；根Design条款已迁后删除、全active消费点改新源，历史refs标历史。CSS唯一数值源、JSON无value/文本精确值；34根+2feature集合完整，13非颜色定位与语义保全；退役4值、失效引用、恰3豁免、shared.css化石、live唯一lc-root/scope/任意literal拒绝和非颜色缺失/重复/漂移/变量负例保持等强；角色文字语义/禁令由独立文档检查证明。
失败：未验语义即称规范完成；旧根永久bridge/删前未迁完/引用失效被负断言空转；Experience任意改历史或假称整字节不变；31旧计数删真role；JSON/正文第二数值源；冻结旧期望从实现动态重算/用digest相等自证；保护减少/无独立test-change/缺等价负例；APFS同目录推Linux可用。
证据：真实准备输入与执行原件、47条分句语义读回、有限历史diff与删除/repoint实际范围；元数据target/既有vitest定向及等价mutation、独立test-change原件/保护分析；case-sensitive实环境布局或具体unavailable及owner。待授权操作未发生不填达成。

### AC-C01-005：两个外部原方法真实采用并履行S3（原AC-C01-F4）

- **AC-C01-005** 本节是该验收的唯一条件声明；适用子条件不可因输入缺失取消。

关联FR-C01-005；source R-C01-06、ADR-C01-015。
验证：P6采用owner在实际使用前读取固定SDD@000b04a2a3553bddcf991b3dc42f9a5a2746fa6f Skill/execution与材料@b62e87f3f91868033106b21f6398f0fd6d3d2043完整适用闭包、LICENSE/资产权利、上游版本/更优候选并比较；登记consumer/维护者/触发时机/本地偏离，查询失败用具名受控反例。P6/P13在独立上下文用原方法处理本C01真实准备/专业材料至少一次，运行原件区分SDD、GUIDE、AUDIT及未执行分支，ORACLE-NORM-ADOPTION。可合法引用不等副本/脚本已运行。
通过：两个固定源身份可核；许可与完整闭包已真实核或如实unavailable；真实consumer使用且登记，不冒未安装/不可达为已交付；S3更新发现/比较与查询失败分支可复核。SDD不迁六材料双写/重开，材料评分不替产品质量。许可允许并实际授权才存固定副本，许可不明只合法引用且运行限制显露。
失败：仅写采用/HTTP200/安装数量/分数，无来源核验或真consumer；把GUIDE读文冒AUDIT脚本成功；无许可vendor；查询失败称无更新；复制上游默认六材料或自建规范维护技能/评分替代冒原能力；缺项包装已完成。
证据：固定原源/闭包/权利/查询原事实与采用登记；真实任务材料调用及结果原件；查询失败受控标注与实际未运行/unavailable原因、提供者/后续合法条件。

### AC-C01-006：三项方法缺陷修复全部可观察（原AC-C01-WP6）

- **AC-C01-006** 本节是该验收的唯一条件声明；适用子条件不可因输入缺失取消。

关联FR-C01-007/008/009；source CARD-C01-WP6、ADR-C01-017/018、真实q22/batch009模块六。
验证：P10作者提供review说明及真实public/ref契约运行；P11/P12作者提供方法成稿，P13独立自然语言读者全文消费当前原步骤/真实用户选择与修改后方法并逐步复放，ORACLE-NORM-METHODS。公开review入口解析materials顶层ref，裸入口不解析须内联；request外壳/认证WT拒绝真实观察。步骤条件与Talk用户语域正例由独立读回，不以regex当合理解释效果。
通过：①wh-review写清公开review --action=record、顶层ref、裸差异、request形状和认证WT，契约真实运行；②每步必需产物/前置条件行首加粗，step9争议逐条处置、step3内外研究真实执行/跳过、step10全部模块收敛后进入及三完成条件（全部R/U落点或缺口、每文件唯一写主、文内同事实唯一值）语义保全；③Talk同Skill格式/IO与新增用户可见说话方式节分域，禁大写编号/文件名+行号/下划线字段名、补一段正面示范。三项全部具备，原步骤/编号/CLI行为保持。
失败：任一项缺或只有文本无契约真跑；漏step10条件/改步骤语义；用户文案仍内部字段堆叠/无解释或正例；把文字加固做成新stage/gate/检查器/控制面；伪承诺跳步不会再发生。
证据：三份实际方法成稿与独立完整读回/复放、public/ref目标与同oracleGREEN/既有行为guard原件，明确注入provider/自然语言/真人长期效果覆盖限制。

## 附加B — C09输入与基线口径（不计C01 AC）

baseline owner在P1任何生产改动前先用现工具采单份真实raw，P1消费后实现接线，P2/T002随后消费同raw整理（不重采/不先假Done）并正式保存唯一旧WH b66c134856a3b7aa13c7115b4e9a1df04dad1914、PB改造前8569bd5219e3cfcd87f1aade5f2ed4a5c03c692f及ahead3形成时事实，实核当前漂移并保两时点；Downloads/UI选定代次/path/mtime、两代非Git不混；真实样本来源/环境依赖/入口/S6六指标定义，数据和环境各一份就绪原件。只钉不跑，raw均absent非0。C09比较实验前必须补跑固定旧流程采六指标；具体有稿实现语义/无稿对象API与权限oracle归C09。P13只读真实交接与必要未闭环对象检查，不造数、不计C01通过。

## 12. 风险、未决与交接

- **RISK-01 / OPEN-01**：新项目真实目标/方向/栈样本缺失，影响PFACT-003/FR-C01-001/004/AC-C01-001。用户/未来项目owner提供，当前按q20保未完成不扩范围，P13仍验已具输入两路。关闭=真正新项目生成/reader实跑，而非fixture/文件名。
- **RISK-02 / OPEN-03**：旧条款分句/剩余active引用或治理条款漏承接，影响FR-C01-002/004/010/AC-C01-002/004。PB迁移owner逐项核原文/consumer并给精确path；治理不硬塞八类，原基础治理owner具名；未迁影响不静默。关闭=去向与consumer/历史/缺口每句可读，删除前全部真实active完成。
- **RISK-03 / OPEN-02**：外部许可/AUDIT合法执行入口/专业子Skill原件不足，影响PFACT-005/FR-C01-001/005/AC-C01-001/005。采用owner核真实grant/合法引用与可运行入口，未具只停对应能力；未vendor不代表完成。关闭=合法源与实际消费/失败可核，缺AUDIT保持unavailable不造分。
- **RISK-04 / OPEN-04**：APFS两拼写同inode但Linux分裂，影响PFACT-007/FR-C01-004/010/AC-C01-004。当前暂定规范小写、原型大写原位不搬；PB作者设计并在有授权case-sensitive环境实核限定路径/consumer，缺环境unavailable。计划展示让用户确认或覆写暂定，不提前认批准；环境正确性仍靠实际证据。
- **RISK-05 / OPEN-05**：六指标旧raw全部不存在，影响附加B与C09收益实验。C09 owner实验前真采；本卡只pin，absent不0。关闭不在本卡伪跑，传递对象与补跑前置事实。
- **OPEN-06**：有稿还原/现状对比、无稿真实对象/API/权限/操作结果，由C09 owner实验前核；影响附加B，非C01实施歧义，保样本来源不预造业务。
- **RISK-06**：保护变更若只去markdown数值镜像会丢13非颜色锚/feature scope；FR-C01-006/AC-C01-004。token owner保存old oracle并提出明确change，独立合并review核拟议等价负例；反例不达就原owner同任务修，不改断言求绿。
- **RISK-07**：Experience上游AC字节不变与ADR007引用例外冲突；FR-C01-004/010/AC-C01-004。以真实确认覆盖ADR007做作者表达纠错：历史正文/版号保全、明确引用行例外，保存原字节/有限diff；不改decision、非新用户选择。[范围核对原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/build-plan-clarification-and-scope.md#L14-L17)保来源解释。
- **RISK-08**：WP6文字改善仍可能漏看，FR-C01-007/008/009/AC-C01-006。完整原步骤独立读回保强度，不增自动门、不宣长期人行为验证。

授权pending不等产品歧义：删除、跨仓Git/vendor/部署边界沿[原确认:24–25](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/human-confirmations/2026-10-14-001-make-decision-approved.md#L24-L25)，实际计划确认之后由主会话消费真实覆盖原话，未覆盖动作不执行。stylelint归C06/活守卫允许本卡改/分文件/新项目缺口已定，不重Talk/Grill。

## 13. 业务影响与回归范围

正常reader继续沿当前五阶段；专业来源变化不改产品业务状态/API/实际CSS值。回归保合法对象读取、按类identity正常路径、原public review行为、PB现有角色/feature/非颜色保护、原历史与原型字节锁、引用不消音。类型检查仅因TS守卫修改适用，测试面只受影响保守超集，不全量回归。

当前可证明方法接线、对象缺项及专业规则消费，不证明C09两路业务E2E/提取收益/真人耗时。缺质量事实不冻结修复，但完整AC的任一必需子条件未达就不记pass。review/RED/provider失败、原始缺数据和旧历史分别保留；最终对每条实证判断后再展示真实结果与授权范围。

## 补充材料

作者提取、工程轻研究、澄清范围原件仅作为设计输入，原AC条件以本文Appendix A、全局设计以本文、精确操作以实际独立Phase为准。文档存在与目标测试已预写不代当前计划确认、实施、独立裁决或完成。

## 审查后定向修订：在线原方法与真实reader（非本轮provider已审）

原review032四provider虽completed，coverage仍undetermined，不能自推方案/功能通过；下列是032后授权作者修订、未重新独立审查的新证据。②④⑤⑦在线原方法闭包与许可实核见[工程研究:164–206](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/build-plan-engineering-research.md#L164-L206)。不是本机未安装就推C09，也不是原文HTTP200就expert已执行。

固定BASE为https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/，四方法为完整原MD（不安装、不复制SKILL、不跑外部脚本）：

| 类/独立专业owner | 原方法及必要闭包 | 本任务真实输入→P7唯一writer产出→consumer |
| --- | --- | --- |
| ②设计系统/token expert，inheritance=none | [design-tokens完整原法](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/design-tokens/SKILL.md)；方向确需才固定frontend-design与LICENSE.txt | 现确认方向/栈、旧可信视觉条款、34根+2feature CSS/consumer→design.md角色引用/禁令/有源缺口；精确值CSS原源，metadata P8→Read Map/专业reader/守卫 |
| ④布局/IA expert，inheritance=none | [information-architecture完整原法](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/information-architecture/SKILL.md)单MD | 当前方向/真实App/nav/layout/CSS/可信条款→layouts.md区域/增长/容器/响应式/overflow；业务流程现task spec→renderer/readiness |
| ⑤交互行为 expert，inheritance=none | [ui-interaction-states完整原法](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/ui-interaction-states/SKILL.md)；optional openai metadata非执行依赖 | 确認规则/真实控件焦点反馈/权限取消恢复→interaction.md通用跨控件规则；任务态/业务权限/恢复现task spec→planning/testing/verify |
| ⑦内容设计 expert，inheritance=none | [design-brief完整原法](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/design-brief/SKILL.md)+[固定frontend-design Writing copy](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/frontend-design/SKILL.md)+其LICENSE.txt | 当前受众目标/真实UI strings/CONTEXT词义→craft.md语气层级/错误文案/动效目的；词义CONTEXT原位、精确样式原源→component/copy/专业reader |

②④⑦原字节等designer-skills@c259656c76d9758d7ead46b0d2f125cbe84f8665，其根LICENSE Apache2实核；固定frontend-design自身Apache2实核。⑤local原创无许可grant，保持副本/分发unknown，不复制/vendor；公开完整引用与项目事实原创正文并非机械阻断，真需复制由实际权利owner提供许可。expert实际web_fetch完整原法与必要依赖、glob/grep/read仅项目及授权公开源，P7唯一writer收专家内容写现九精确正文；不替新Skill、不新.design、重复访谈、强双主题/默认数值或上游命令。按本地已确认事实作显式偏离，网络失败/输入缺/冲突只停受影响动作。三起点同法；新真实样本缺仍AC001非pass。

六reader的真实输入、独立执行者、完整方法消费/输出/受控失败现按[P13六入口表](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261014/specs/workflowhub-ui-frontend-c01-norm-init-20261014/phases/P13-全项验收.md)执行，不能跑primitives.test冒prototype Skill完整执行或只guard绿冒frontend-testing完整执行。prototype现harness真实渲染技术消费与强制Preview/用户答复缺口分别记录，不为C01生成新UI/越C05，缺完整方法结束条件仍incomplete。

## OPEN-07 — 审查接线补充设计（用户已要求补计划，未批准实施）

**旧13卡补充前的失败形成时映射**：下面三段的P1/P6/P7/P8/P12是review032/最后28结构观察当时旧编号（新分别P2/P7/P8/P9/P13），原件不可变，不表示当前13卡已审或当前接线已实施；这里的旧host git diff说明仅证明原capture缺口，不是下方opt-in安全capture的执行方案。

**已核真实影响，不只是open**：[build-code:21–39](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261014/workflows/build-code/SKILL.md#L21-L39)与[verify-code:15–18](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261014/workflows/verify-code/SKILL.md#L15-L18)可由主会话/独立执行者直接按现index逐指针打开物理spec/Phase，按完整FR/AC/写集执行；无需parser产物授予许可。命令原件沿现public verify execute的captureCommand（stage-runtime:1128–1147），任务根quality/tests单份保存实际argv/cwd/exit。P1只pin，PB各命令带真实绝对--dir/env/或shell先明确PB cwd，无shell猜仓。例：`/Users/Hugh/.npm-global/bin/pnpm --dir /Users/Hugh/Hugh/Project/PaperBuilder/frontend exec vitest run src/ui/style-token-guard.test.ts src/live-pages.test.tsx`由独立测试者以原字面提交现verify execute；语义方法读取同物理材料输出现普通原件。检查继续保原false/errors，不能file-only读回充机器coverage绿。

但正式public build-code Phase代码审查调用`phaseReviewSourceProjection`（stage-runtime:534–543）时parser拒P1/P6/P7/P8跨仓绝对写集，找不到phase.write_set后实throw MATERIAL_INCOMPLETE，下游正式OCR未dispatch，不是纯事实可忽略。P12空写集现合同已有`none（理由）`，当前P12与index改该既有表达，不改空写集语义/runtime；先前27失败原件保形成时事实。正常verify-code虽不走Phase投影，capture:579–586只认证WH diff，不能WH空diff冒PB已审。裸wh-review-cli run只runSimpleReview并由review-record owner存wh-review，不是OCR，不能偷换；export OCR seam需真实bundle/executor接线，目前无已核CLI能绕此限制而合法同OCR保存。P1纯文档G2读回也不能偷免每Phase正式OCR合同。

**当前可用的直接材料行动与未完成边界**：主会话可在真实范围确认后用现file-only方法执行安全WH部分/当前单仓测试及真实任务准备；PB维护者供明确实际分支/HEAD/base、P6～P8精确子集diff，宿主用`git -C /Users/Hugh/Hugh/Project/PaperBuilder diff --binary <实际base> -- specs/design/design.md specs/design/components.md specs/design/layouts.md specs/design/interaction.md specs/design/craft.md specs/design/quality.md specs/design/README.md specs/frontend/frontend.md specs/frontend/ui-quality.md frontend/src/ui/tokens-anchor.json frontend/src/ui/style-token-guard.test.ts frontend/src/live-pages.test.tsx Design.md Experience.md docs/adr/0035-project-norm-authority-and-value-source-migration.md`采实际原diff（untracked新增要完整原字节另纳，不从空git diff漏掉），只同一正式review packet引用原件而不建第二原review。该diff命令是材料采集，不是能已送OCR的证明。正式OCR接缝未支持前P1/P6/P7/P8及PB终末覆盖保持design-incomplete/不得宣每Phase或全卡完成，owner=原post contract/runtime review接线owner+主会话，下一动作是下面真实范围选择；不假填写通过/省provider/另造fallback字段。

### 用户接续范围及可信读scope

用户真实新回复“先补齐审查接线的计划”只允许设计当前补充计划，不授生产/实际OCR/Git。本节以下设计替代旧“原owner以后核授权”的占位；实施必须等一次完整修订计划真实确认中明确涵盖下述具体读取/捕获范围，不能解析这句要求自行产生读权。六原产品AC不新增或降级；补充接线作为AC002真实reader消费、AC004合法双仓语义/保护证据的派生技术子条件。

**接口归属**：新增现`stageRuntimeCliMain(argv,{services,cwd,...})`宿主选项`services.resolveReviewReadScope({task,workspace,stage,phaseId})`，由同一原`recordTaskReview`→`prepareTaskBoundBuildCodeReviewBundle`消费。它是私有/普通短生命周期函数参数，不是request字段、public command、外部Stage Agent、持久schema/config/allowlist文件。默认普通CLI没有resolver时保持现单仓；spec出现外部声明而resolver缺失，报告该外部范围unavailable/错误并保原单仓安全部分，不能自动接受spec路径或从materials根反推权限。

**真正的来源链**：实施主会话作为当前真实用户会话的宿主调用者，先消费实际人答复（范围、对象、禁止动作）的原件，以及其实际展示的spec/当前Phase，核回同task。主会话只在真实答复明确覆盖读取/capture第二PB Git根及十五声明path、P2 task-root两证据的上下文读取时，才为这次调用构造resolver。人答复原件通过既有confirm/普通记录保存，callback仅附该ref作provenance，不解析reply文本根、不把confirm HEAD/文件存在当权限grant。机器信任边界是宿主显式服务函数而非agent提交的JSON；宿主伪造函数不能凭本设计拥有权利，必须由实际操作主会话核原真人来源，未覆盖就不构造。没有永久根映射或新task字段。

**typed返回，非持久对象**：resolver返回内存只读`{taskId,primaryRoot,repositories:[{id,sourceRoot,targetRepoRoot,baseCommit,expectedHead,expectedBranch,paths}],evidenceFiles,authorizationSource:{confirmationRef,materialRefs}}`。primaryRoot必须逐字匹配已认证context.workspace.worktreeRoot；repositories只`wh`/`pb`两具名id，wh sourceRoot/targetRepoRoot必须匹配认证workspace，pb需匹配完整计划实际批准的真实根/对象，各sourceRoot是精确Git top-level，paths是明确repository-relative普通文件path；evidenceFiles是`[{ref}]`，只这次已批准task-root精确相对ref集合：P2两pin文件，以及实际此前已采baseline raw的唯一receipt/output ref（路径由现captureCommand返回后逐项加入这次可信caller集合）；不得通配quality/tests/evidence、不得由request自行增加“本Phase具名原件”。其他已认证WH AC/Phase材料仍现material reader，不用外部scope另授。若正式review需要其它task原件，宿主只可在同已批准读取范围内逐件核真实路径加入这次exact refs并保来源，不把新未知目录扩大成授权；机器只读回值集合与原请求ref交集、未列ref拒读取。authorizationSource仅原权限说明定位，不作为机器质量/许可谓词。不接受request/materials同名键，不允许caller把repositories再嵌套传成新永久schema。任何值/根/范围与认证task、原权限或spec/Phase声明交集不符都拒该动作，不silent过滤造成少审。

**现public实际宿主调用**：完整计划真实批准后由当前主会话取下面一个Node调用，不新脚本/命令；`approvedScope`只能来自已核实际答复展示范围、真实认证WH/PB对象及现base采集原件，不能照抄本例未得授权即执行。

```js
// cwd = authenticated WH worktree; actual input JSON is the ordinary current review request.
const {stageRuntimeCliMain} = await import('./tools/cli/stage-runtime.mjs');
const result = await stageRuntimeCliMain([
  'review', '--action=record', '--stage=build-code',
  '--project=workflowhub', '--task=workflowhub-ui-frontend-c01-norm-init-20261014',
  '--task-path=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014',
  '--input=quality/evidence/actual-code-review-request.json'
], {cwd: authenticatedWorktree, services: {
  resolveReviewReadScope: ({task,workspace,stage,phaseId}) => approvedScopeForActualCall
}});
// result is the existing public review receipt; raw/provider/results are saved once by the existing writer.
```

此例不调用裸wh-review或直接自写review result。verify-code同七public owner，stage改verify-code、现完整AC/功能原件请求、同resolver取得终末实际base/changed范围；首P1bootstrap可普通现CLI单WH调用，不需先PBscope形成循环。input request仍原request/materials合同，禁止往它添加resolver/授权roots。设计精确信任参数与值来源，actual input缺失不把例名当已存在原件。

**职责/保留与退出**：唯一新增首结果为“获准跨仓改动能被现正式审查真实消费”；scope安全、none Task、quoted锚都是其必要局部，不按七文件拆并列结果。owner是现review source/CLI接线与post contract原作者，consumer是每Phase/终末public OCR和完整物理材料reader；复用七个现文件不新增资源或公共控制面，不为这次行为改动借机加move-map条目（原薄入口那份登记仍它唯一owner）。default单仓是仍被真实consumer使用的正常模式，opt-in双仓不是永兼容桥；若将来现task workspace拥有被实证的同职责获准多仓读取并完整承接本consumer，则原owner在正常维护中删除此resolver选项/内嵌worker与其适配，保单writer/原失败，不建双机制长期同步。

**小接口隐藏复杂度**：host只提供已批准typed scope及现public调用；认证/目录fd安全捕获/changed exactset/namespace/失败清理由review-source和CLI原producer内部完成（现1294服务能到recordTaskReview，但1030未把scope传prepare bundle正是P1必改consumer，不宣现已接上），不要求每个caller手工实现安全步骤。Python worker只服务本次opt-in source capture相关文件，不扩通用执行器/目录扫描平台；PB十五path是权限上限，不是每回十五文件快照，当前Phase仅真实changed exactset，完整必要AC/Phase材料仍现材料reader。SOURCE_UNAVAILABLE/SOURCE_CHANGED仅真实失败事实、继续同task修复，不是新gate。

**用途分离**：scope只允许“读材料并capture审查输入”，不授写入、Git提交/merge/delete/vendor。spec/Phase决定工作与写主，Git等另走原授权。task-root证据只现安全材料ref读取加入context；真实WH/PB Git仓才生产diff/source。根祖先/符号链接、TOCTOU、diff/新删除/dirty细则由下方同一接线实现，不新独立权限平台。

### 双仓捕获、安全与全部现消费者合同

**纯声明与读能力不同**：validator只校spec/Phase声明路径与传入可信读scope的归属交集；不会把读scope变写许可。新纯函数参数从CLI可信host取得，不persist，不信spec里增加第三root。绝对代码路径先按scope精确Git根转换`{repoId,relativePath}`再做owned/path唯一性判断，禁止startsWith简单前缀；task evidence相对认证task-root只作context，纯验收none Task可read-only symbols+具体理由而无owned file。普通实现Task仍必须owned路径，read-only例外不能让代码实现省略scope/Files。

**路径及TOCTOU**：现Node resolveMaterialRefs虽持目录fd，但open后chdir(name)重新解析存在ABA，不能以先后stat证明未瞬时越权；Node标准无openat/fchdir，不借它冒race安全。仅多仓opt-in安全capture在review-source原owner内嵌短命Python stdlib worker，无新脚本文件/安装/平台。先实际探测`os.open` dir_fd、`os.fchdir`、O_NOFOLLOW/O_DIRECTORY及fd继承能力，不具能力则SOURCE_UNAVAILABLE、绝无绝对read或Node不安全fallback，现default单仓行为不强加Python依赖。当前宿主[能力输出](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/tests/2026-10-14-005-c01-dirfd-capability.output)与[原回执](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/tests/2026-10-14-005-c01-dirfd-capability.json)实读：Python3.13.12、上述四项true、exit0；只证明这些能力存在，未实现安全worker/未检验inherit FD生产调用，不宣捕获通过，实际opt-in执行还须worker能力自检。

安全worker从系统根fd逐component O_DIRECTORY|O_NOFOLLOW/dir_fd持有到获准root，host传root fd与核定root身份；相对path逐层dirfd步进，leaf O_NOFOLLOW/fstat single-link regular才读取，真实根/ancestor/leaf路径不得按名chdir再读。根fd重新fstat匹配原认证根，Python os.fchdir(rootFd)后Git子进程以继承真实cwd运行，不用cwd绝对路径再次解析，保清理GIT_*、禁ext-diff/textconv/hook/network。base原blob从Git对象与exactpath读取，current只能批准FD已读的那一份bytes，形成patch时把这些bytes放本次私有临时单文件材料后diff，不用git diff沿宿主不可信leaf第二次读取；不是目录快照/私有Gitcommit/证据镜像。只获准changed文件单份bytes入同packet，DELETE核父fd下leaf不存在且base blob存在，捕获前后root/HEAD/branch与选定文件状态不一致则失败关闭fd/自建临时文件，不把前后两世代拼绿。

根必须绝对canonical、无`..`/NUL/glob/非系统alias，root/每层祖先lstat real directory、非symlink，Git top-level/expectedBranch/expectedHead和baseCommit commit可读全部精确核；拒非法继承GIT_*，保现gitMetadataEnvironment。源码与证据各叶必须regular single-link，读时O_NOFOLLOW/fstat与先lstat inode/dev相等，读后再核leaf/ancestor inode/realpath/长度/修改状态；DELETE只能叶真不存在且祖先合法、旧blob在该仓base可读，不能跟链接“发现删除”。获准新文件的目录可真实不存在，逐层核已存在最长祖先，不创建宿主路径；只读取实际存在已落候选源，不能把missing当空文件。捕获前后核每仓HEAD/branch/base及选定path status和实际字节，不以hash相等判产品功能，hash只检测传输/读取换件；任一漂移明确SOURCE_CHANGED并停止该捕获、清理仅自建packet，不能拼接前后两次世代或无限重试到绿。

**真实差异不丢来源**：分别对WH/PB用实际root fd fchdir后的Git对象命令核base与当前受控FD读件形成差异，包含base→当前工作树的committed/staged/unstaged改动；禁止直接git diff再沿不可信宿主leaf重读，原Git diff仅作为default单仓既有路线，多仓opt-in由baseblob/current已读bytes生成patch；verify changedPaths不得用旧`base...HEAD --name-only`遗漏dirty。仅获准exact path集，带NUL-safe status/name列表，新增untracked（git diff本身看不到）以允许叶真实完整原字节生成可证新文件patch/源材料，删除含旧blob原行及缺当前源事实；不自动git add/commit、不全树copy/忽略路径追踪。renames两端都在scope才可，越界一端显式拒而非丢半个删除；测试如不推断rename则按真实D+A保完整语义。无关dirty只记录未覆盖范围不收其字节，同path已有用户dirty不冒本Task独作，不reset/覆盖，source仍真实采并在宿主说明原归属。零PBdiff只可记其实际零，不能代表PB语义已审或漏untracked被当没改。

**两仓相同路径及packet**：packet内代码来源稳定namespace `repos/wh/<relative>`、`repos/pb/<relative>`，root永不进provider字面path。每仓rawdiff原始字节单份；provider差异标题/源路径按namespace投影，使用现diff分片与原行映射职责记录raw→delivered对应，不能拼原同名Git header让不同仓覆盖。现source.json只附临时packet的仓来源/实际base/head/范围/未覆盖事实，不成持久schema/IR/第二进度对象。OCR source读取与finding回读只能manifest声明namespace路径和对应真实仓/source bytes，禁止provider回读hostpath或用WH同名源替PB。多个仓仍一个阶段request/一个OCR轮/原review-record-route单writer原raw与结果，dispose收所有本次临时捕获目录，失败/取消/清理错误原样保存。

**公共消费者逐项适配**：

| 现consumer | 接线/保留方式与可证失败 |
| --- | --- |
| phaseFilesFromIndex / materialFilesForCohort | 仍只13安全连续权威ref，不写第二索引或root IR；某Phase正文缺仍unknown/error，完整物理卡不能剥掉 |
| validatePostPhaseContract / phaseReviewSourceProjection | 可信scope下按类别root判声明，none/read-only Task窄例外，未授权外部仍错误；首卡relative自举保全局false事实；当前Phase实际rawdiff按仓exact paths选择，不跨Phase收无关源 |
| recordTaskReview / prepareTaskBoundBuildCodeReviewBundle / projectOcrCodeReviewBundle | public同路取得resolver，capture逐仓、namespace投影、实source叶/删除旧行、新文件、同OCR契约/lenses/单writer；materials根欺骗/scope不匹配拒，不切裸wh-review |
| verify-code终末 | 完整AC及验收summary保现validator，scope内WH/PB base→工作树+untracked真实diff及new source同packet；无scope默认单仓，缺PBscope明确外部未覆盖，不能空WH冒PB已审 |
| status / thinMaterials / thinQuality | 仍按现认证WH当前材料/facts显示，index只定位完整卡、quality取原review；ready仅材料存在不代表scope已授/已审，公有输出不加新scope字段或覆盖枚举；实际review unavailable/错误由现原件显示，不以状态补绿 |
| run phase_progress / phaseProgressTargetExists | 仍依现13物理卡定位、单WH材料phases_head/base_head游标、不加PB游标数组或历史trace；PB各Phase真实base/startHEAD由现普通命令raw给host resolver，续跑按该原ref和当前实际HEAD核漂移，不偷偷用WHbase当PBbase |
| verify execute / captureCommand | 现接口记录真实cwd/argv/exit/signal/timeout/raw，baseline前置与各仓精确命令字面提交；不从Phase抓自动执行，不为读scope另造shell许可，没运行不写green |
| finding / material source回读 | namespace→同packet真实manifest bytes与rawdiff行，不跨仓串锚；原错误/raw/provider身份保真，不以count/hash/成功状态当AC功能pass |

每仓phase base与最终base分别来自本次真实baseline/start采集原件；host根据现权限覆盖保持同task日常核实，不逐动作新询问，读取/捕获批准不替任何Git授权。expectedHead/branch是该次调用前即时真实值，刷新它不得换根/path/批准范围；HEAD/base变化时保原raw、说明变化后重做当前capture，不悄然错用旧对象。对合法自建test repo的受控resolver仅用于测试，不是生产权限来源。

### 接线自举与baseline先行

新增首个Phase只相对WH文件写集、依赖none；原十二卡统一顺移、末验收唯一末。编号/路径由工程按全部真实头一次迁移，本作者不擅改其它卡或index。首卡的一个结果是“本任务正式审查材料可以按真实范围被原公共review消费者读取”，不是规范迁移/另一次基线结果。

1. **先真实采原baseline输入**：原baseline owner在任何新增接线生产变更前，用现verify execute/captureCommand只读核WH/PB原commit及当前HEAD/status、Downloads两代mtime、真实组件/样本/环境、六raw absent，单份raw/receipt留现quality/tests。维护者提供真实样本/环境，输入缺仍missing。已有研究形成时事实不当本次采集，不运行旧流程实验。不需要先正式审查task-store pin文件，原pin卡稍后整理两件并消费同raw，未完成不记Done；这不是新增流程节点或第二进度对象。
2. **冻结目标tests→真RED**：新增首卡owner提交其明确target tests并由独立执行者经现verify跑，先证crossrepo/none-Task/untracked/dirty/namespace和trust拒绝目标断言；收集/配置错误非目标RED。冻结现两C01new targets不改。首卡测试可用13卡完整材料fixture及合法首卡WH相对row，必须证明当前全局contract false仍能选首卡write_set、取真实WH diff、public OCR dispatch到同writer；不删掉其它跨仓物理卡造假绿。
3. **最小接线实现后正常首卡OCR**：旧`phaseFilesFromIndex`只读权威ref连续/安全，`currentPostPhaseMaterialState`和`phaseProgressTargetExists`可在13物理卡中定位合法首卡；旧`phaseReviewSourceProjection`仅当前row无write_set才throw，全局false本身随contract_facts提供。因此首卡合法relative写集可自举，不依赖未完成pin卡，也不豁免正式Phase OCR。修正后由同一`stageRuntimeCliMain` public review record/现OCR/现review-record-route单writer送当前首卡真实diff、完整AC/物理材料与实际测试；同源补充轴按原方法，原错误/未覆盖显露，不把绿色结构当provider质量。
4. **随后pin卡正式整理与OCR**：原pin卡顺移后写两就绪件、消费步骤1同raw、运行现pin readback，不再次采实验/镜像证据，接线已支持task-rootcontext。完成自己的正常Phase OCR再进入原主线。先采baseline、接线首卡、pin卡完成三者不同事实；编号依赖不能反向或末后插前置。

首卡输入owner=主会话真实计划/读范围来源、认证task/workspace；baseline owner提供改前raw；PB维护者提供精确root/base/HEAD/branch和允许十五path。首卡结束须真实target RED/GREEN与必要P2P、公共Phase OCR原件和实际source完整覆盖可定位，不要求provider空finding/全产品AC已pass，也不因缺下游业务样本假停首卡修复。

### 新增首卡的精确实现与测试边界

新增首卡唯一结果是正式审查材料在真实获准范围可被现public消费者正确消费。新增写集七个既存WH路径，原37path不重复：

| 文件 / 原owner函数 | 最小改动与实际consumer |
| --- | --- |
| `runtime/stage/stage-content-contracts.mjs` — unsafeWritePath / executionIndexRows / validatePostPhaseContract | 增加可信调用者只读scope参数、代码/证据两类别精确路径归属、合法none验收Task的read-only Files例外；现relative单仓默认/实现owned路径/FRAC追踪保全。与firstPhase相对row自举测试配套，不把不授权的外部声明改安全 |
| `tools/cli/stage-runtime.mjs` — recordTaskReview / phaseReviewSourceProjection / prepareTaskBoundBuildCodeReviewBundle / projectOcrCodeReviewBundle | 接services.resolveReviewReadScope，认证上下文与声明交集；分别capture scope内真实双仓，verify采用base→工作树+untracked的changed来源；namespace投影真实源/删除、同公共OCR/单writer。status及现游标保原接口，scope不持久、不增CLI flags |
| `skills/wh-review/scripts/review-source.mjs` — captureReviewSource | root/祖先/叶无symlink与安全描述符、前后HEAD/branch/status/byte稳定核，base→working tracked diff+exact untracked新增原字节及删除旧blob；dirty及不足原样，支持可信仓id namespace输出，不拷全树/不git add |
| `skills/wh-review/scripts/review-materials.mjs` — buildReviewMaterials / writeReviewDiff | 同packet完整双仓diff/source事实、namespace源路径及现diff-index分片原行映射，兼容现单仓身份；不可把原raw重写/重复存quality原件，不收hostroots/private原始绝对路径 |
| `runtime/review/ocr-delegation-adapter.mjs` — ocrDiffSourceLine / createOcrSourceAnchorResolver.diffAnchor | safeOcrSnapshotPath/manifest相对读取已可repos/wh与repos/pb；只窄补Git quoted路径严格bytes decode与namespace direct/shard finding原行对应：现gitDiffPath只返string且toStringUTF8会有损，不盲复用它当安全判定；局部保decoded bytes、UTF8 roundtrip相等才接受，非法byte不得normalize成有效U+FFFD同名路径，必要helper藏本7path内，不改公共bounds语义。还须在本adapter原职责内用共享section-state parser替现859–868 hunk内误认`+++`为header和971全diff regex扫target：仅section头阶段解析target，hunk阶段按old/new count及`+`/`-`/space真实推进，源码行不得重新解释header，direct/shard用同一解析输出；invalid hunk/count/歧义保持null。真实fixture a.txt新增源码`++ b/repos/wh/b.txt`后跟`same`，b.txt:1亦same，必须锚a.txt:2而非b.txt:1，防伪header串源；不是新parser平台/公共export。现quoted returnnull/regex及该错误均需目标断言，不称已实现。deleted/binary没current source仍null/明确覆盖限制，不虚制造valid source；不扩provider host读取边界 |
| `tests/contract/card05-phase-path-and-contract-facts.test.mjs` | 现contract/phase投影/游标consumer追加真正目标正负与bootstrap；原冻结断言变化走实际TCR，新增目标不削弱旧保护 |
| `tests/contract/ocr-review-contract-bundle.test.mjs` | 现source capture/材料/packet/OCR/read-record面追加双仓实际Git fixture、untracked/dirty/delete/namespace/direct+shard回读与可信scope反例；原单仓/lens/取消/provider失败P2P保真 |

实现/test新增函数或临时参数限上表原职责，必要辅助函数原文件内复用现safe-read/Git环境方法；不得为七路径数量硬塞跨职责实现。前述安全读若需复用descriptor helper从现owner导入，必须证明其原export/调用适配；不新增持久schema/公共command/IR/第三授权平台。所有跨仓读取由可信host service获准再执行，缺批准scope默认仍单仓/外部unavailable，不通过宽化absolute默认行为闭合。

**首卡配对目标命令**：P1实头gate_cmd=`node --test /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/tests/c01-review-wiring-target.test.mjs`，总oracle=ORACLE-C01-REVIEW-WIRING，BOOTSTRAP guard与AUTH/PHASE/CAPTURE/NONE为当前task-local子判据；真正TERMINAL全链是未来P1existing suite具名面，当前CAPTURE不冒其覆盖。独立testing executor在认证WH cwd提交现verify execute；test变更经当前具体TCR独立批准后再冻结，同命令做实施GREEN。两existing Vitest suite的未来定向受控目标用实际P1给出的test-name filter，不在本轮规划跑其可能真实OCR例；`node node_modules/vitest/vitest.mjs run tests/contract/card05-phase-path-and-contract-facts.test.mjs tests/contract/ocr-review-contract-bundle.test.mjs`仅两个文件范围定位，实际执行还必须限定已声明受控case，不能全suite替目标。RED准确断言：旧crossrepo过滤/none Task owned拒绝、漏untracked或dirty、同名异仓source混淆、quoted direct/shard无anchor。测试如已有绿色原控制明确P2P不是RED；环境失败另存，实际producer RED后冻结原期望，修同oracle到GREEN。两suite中受控fake provider仅验证packet/source边界，不冒真实OCR运行/异源质量；正式首Phase OCR必须另经现公共review记录真实provider原件。

**007形成时事实与已知oracle纠错**：[007输出](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/tests/2026-10-14-007-c01-review-wiring-target-final-red.output)与[原回执](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/tests/2026-10-14-007-c01-review-wiring-target-final-red.json)已实读，exit1、BOOTSTRAP guard PASS、四首assert失败；其AUTH/PHASE fixture owned集与期待源不一致已由独立点读发现，不能当正确oracle RED/不能放宽生产Phaseowned∩scope迁就。TERMINAL只captureReviewSource producer的dirty已有/untracked缺assert失败，不是verify prepare/compact端到端已观测；NONE是readonly owned误报目标。006初始化linkedWT失败不是产品RED。具体TCR已由独立9db审pass、主会话转批准，工程按提案修fixture（非生产），旧007/旧字节保原。当前冻结script SHA256=`3cbbc95664dc2ed65e3e1bbe1f66613285a7ce1597d048a8856652a6d637b57d`，同配对命令[008输出](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/tests/2026-10-14-008-c01-review-wiring-target-scope-corrected-red.output)与[008回执](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/tests/2026-10-14-008-c01-review-wiring-target-scope-corrected-red.json)本作者完整实读：exit1、BOOTSTRAP PASS；AUTH的WH-onlyP1字节/不含PB已先成立，合法PB-onlyP2首assert因observed MATERIAL_INCOMPLETE失败；PHASE显式双仓四declaredpath P2同首assert失败；CAPTURE producer有tracked dirty但new untracked addition断言失败；NONE纯readonly owned误报断言失败。四个目标首失败、无fixture环境失败，仍未到callback called辅助断言、PBcurrent/body/namespace/exclude等后续检查，不能冒callback已接或两仓已完整读。真正verify/compact终末、dirfd安全/quoted/hunk/invalidbyte负例未覆盖，不借4fail计证明；实施前按P1实际声明独立补真实目标。

目标集合（实施时每面正例/负例都实际观察，不靠数量判真，当前不是全部已跑）：
- bootstrap：完整13卡/other外部错误可见，合法首row写集与真实WHdiff能正常组包；现cursor定位/材料commit规则及首OCR协议保真；baseline raw在首生产改动前实际采，原pin卡无完成假值；不剥包/不漏完整AC。
- trust：有真实宿主resolver才准两root/path；无callback default单仓、request/materials伪scope被拒、task/primary/id/base/head/branch/root不一致拒；不认reply字串/任意绝对路径grant；同根相似前缀/../glob/NUL/symlink/hardlink/交换祖先/换叶/HEAD漂移拒。
- task证据：仅task-root exact refs安全读取context、不能第三code diff/整tasks目录；none纯验收read-only Symbols成立，普通实现owned空仍拒，证据越root/夹symlink不采。
- capture：两自建Git repo各真实base/commit/staged/unstaged/untracked/delete，same basename不同source不串；负例观察实际worker及Git子进程读取：禁止已读FD bytes之外再沿宿主leaf打开，不能仅Node readspy零当所有child读取安全；declared subset外dirty字节不送、rename越边界拒、禁止丢未跟踪新件/用WHbase套PB；packet source与原行实际相符，零diff只零覆盖。
- namespace：ASCII repos/wh及repos/pb actual source/changes raw、inline与强制shard finding映回各独立原行；本卡PB十五path是ASCII，不杜撰中文生产需求；quoted-space/UTF8用真实Git fixture覆盖现通用接口的必要字符边界，quoted malformed/escape/非法UTF8 byte拒，需`\377`非法byte与真实有效U+FFFD文件名同映冲突负例，strict decoded bytes roundtrip不能被有损字符串绕过；source path编码非法为SOURCE_UNAVAILABLE/scope拒，坏finding path为null/invalid原事实，不把它变有效锚或洗掉provider原finding。deleted/binary current-source-null不伪valid。
- compatibility/failure：原单仓contract/publicref/五trigger/OCR合同/lens/错误取消/原writer输出继续正确，物理status/cursor不改API/持久字段；捕获失败/权限不足/漂移/provider失败/清理失败都有原件，不能fallback换执行者/静音到绿。只跑两受影响suite与有具体diff疑点的邻接测试，不全库vitest。

**复验、恢复与真实确认**：先保baseline/test-old字节和失败原件；首卡改动只上述七path，回退只原owner受损hunk/对应提交，留用户dirty和其他Phase改动、PB/证据原件，不reset整树。scope分支若失败撤这次临时capture、默认单仓行为保真并报告外部未覆盖，不永久legacy bridge。测试变更提交真实proposal/RED、正常独立test-change审查，不从本轮文档review推新字节已批；正常每Phase/终末OCR次数沿原方法，修有效finding回原会话定向复验，不重派本轮文档provider。

完整修订计划与七path新增范围、读取/捕获root/path界限展示后，主会话取得真实计划确认才实施；当前“补齐计划”不是这次确认。计划确认可覆盖本task同范围只读capture无需逐动作重新问，Git/删除/vendor/部署沿原权限来源另核。本轮后续独立report-only分析验证原需求六类/接线/自举/44path所有权，不自判PASS。未获得计划确认保持草稿；新样本/AUDIT/旧human consumer/Linux真实reader等产品缺口依原AC分别仍非pass，不因接线设计齐而称全卡业务达成。

## 原始需求方案完整性与可验收性分离

12原R、8真实U、母有效U及WP6、25消费点/47分句在本文FR/场景/AC与Phase各有设计落点，完整逐项来源语义沿requirements原件；这不是全部验证闭合。新项目真实输入缺使AC001非pass；合法完整专业方法路径/材料AUDIT入口若缺仍是具体设计或执行缺口，不能留一句“以后补”称可执行；外部许可unknown禁vendor但合法引用消费仍须真跑；四旧形成时引用消费生命周期unknown由P9外部authority处理、独立判断不足则删除pending；C09六指标absent只交准备非本卡通过。每项具名提供者/执行owner/取得时点与失败处理，但不自行接受严重风险。当前方案完整性最终仍须前序Phase精确写集/接缝核对、一次独立合并审查及原需求六类分析；有缺口由主会话向用户展示先修缺口/指派owner后推进/取消三路径并等真实回复。
