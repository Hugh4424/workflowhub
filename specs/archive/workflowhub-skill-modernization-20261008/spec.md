# 功能规格：WorkflowHub技能与流程现代化

状态：完整计划已用户接受，build-plan按真实确认收口；003收口历史时点的build-code/verify-code尚未启动与暂不进入实施保留为原暂停事实，非当前实施状态。用户后续已由[恢复实施072](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-08-072-build-code-user-resume.json)恢复build-code；当前定位与完成度只读外置facts.jsonl及实际执行原件，不由本材料标签证明完成。[正式确认003](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/human-confirmations/2026-10-08-003-build-plan-accepted.json)。作者只同步确认标签，不执行测试、review、生产改动或Git写。

当前要求优先级：D-066用户纠正已彻底取消输出token／用量的采集、预算、验收与收口条件，不延期、不估算、不作unknown阻塞。当前四项客观量仅工件齐全度、硬约束违反数、耗时、真人重问次数。历史D-031/原AC018、WR001及093/099中的该项只保出处，当前不采用；其余有效比较解释依最新D-067：行为效果／表达保全分型，不强求赢家，相似与未观测不自动失败。

## 材料导航

需求解释与场景先读；功能需求索引连接来源；实现设计是全局工程权威；Appendix A独占验收正文；Phase独占局部程序，index仅指针。

## 速读卡

改现有方法而不堆技能，保原核心步骤优先。相序R→A1→A2′→A3→B1..B4→B6不变且不拆总任务。固定来源、真实consumer、目标RED/同oracleGREEN、保全表与真实A/B同时要求；既有红灯和缺量不粉饰。当前完整规划已展示并取得真实接受，build-plan收口；依用户要求暂不进入实施，最终handoff由主会话发布。

## 来源与决策映射

[decision-log](decision-log.md)历史正文836行保留，追加最新D-066后当前sha256 5fb36368c246cb460461650c53d5dacf1102788e370c5b7dc3e3bc4e1f39c73b；[raw原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/decision-log-refs/raw-user-requirement.md)sha256 e63baa673b0b21f76d4f4fb40845ffe48e95de3c29b1dfec6ebb7f3cb75d5266；[009设计原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-08-009-build-plan-design-research.md)sha256 c3e4588e465c740e1ebc0a24d49634ad034747fbc3fe528aecee1179ba06d819。006来源研究旧D055待答以005真答catalog覆盖；010真答仅build-code/verify正文两路径串行例外。启动formal确认decision=start不是plan accepted。

## 1. 需求解释、目标与范围

用户的外部技能清单是建议而非强制采用。质量核心吸收应保留长期打磨的约束和步骤；正文短不等于有效。复用grill作为跨所有目标项目的领域约定、stage-reflection作为复盘候选单一路径；PR按项目/环境支持自适应真实交付。当前登记/调用/出处漂移先R对账，A1证明比较夹具可靠，A2′仅三正文改写，A3先验后用，后续相显式重读。深B不是行数竞赛。

## 2. 用户场景与十维状态

### SCN-001 — PR收尾真实URL或失败描述

项目使用者提交已授权普通任务close，输入是当前task分支、目标base、真实授权原话和已验交付。支持GitHub且ahead时先推head，再创建或读已有head/base PR，展示真实URL及描述；gh/登录/权限/网络/base/ahead不支持时展示真实错误和可用描述退commit，不伪URL。无授权在任何push/create前拒绝；取消/响应丢失先inspect，不盲重建或删远端。关联FR-SM-003与AC-SM-001/002。

### SCN-002 — stage失败沉淀候选与诊断

当前主会话遇到真实stage失败，输入是当前可见会话/原错误/现材料。诊断执行者先复现可红单命令与最小化再提根因假设，环境故障不当bugRED；复盘执行者列有源候选让用户选，机械重复优先确定检查，判断项才未解Improvements，解决由人prune。未答只保候选，不代用户实施；取消或缺transcript标unknown。关联FR-SM-009/011与AC-SM-003/011。

### SCN-003 — OCR与同源补充分轴

Phase实施者交当前scope diff、完整AC与真实输出，独立OCR和另独立上下文的同源补充审查者消费同一允许材料。用户看到两轴原件/发现并排且same_source_degraded明确，不合并排名或算第二异源。OCR缺失/低版才按P9新目标fallback，已装执行失败/超时/取消仍保unavailable，迟到发现照留；补充执行者不写镜像，不授Git许可。关联FR-SM-008、AC-SM-004/014。

### SCN-004 — 架构机会一次评估与重复读回

verify-code执行者读取当前实现与真实消费者，首次评估只给值得深化的机会；用户选后才设计最小接口与优化、受影响重验。同task再次请求先引用已评估报告而非再评一次；拒选保原实现，缺真实代码/评估者写unknown/unavailable，取消保部分原件，不让机器已评估字段卡修复。关联FR-SM-010、AC-SM-005。

### SCN-005 — 登记、调用合并与退役

登记维护者输入baseline原manifest44与现catalog/deps/wh清单/磁盘，R迁原历史八字段且不覆盖当前语义。调用维护者在B4迁实际consumer与附件到owner后具名0悬空才删除旧薄/manifest/debate；故意fixture引用不存在必须报非零。历史缺路径不变active，取消保已迁字节与未删清单；目录或写集不明先原作者重排不越权。关联FR-SM-005/013/014、AC-SM-006/007/010/011。

### SCN-006 — 固定出处与单一领域语言

技能维护者按两固定commit原件核适用与本地偏离，目标项目使用者通过grill解决首个真实术语才懒建单GLOSSARY，多个真实context才GLOSSARY-MAP；领域Relationships/Example dialogue/Flagged ambiguities保。出现术语歧义按真实frontier答复更新，不生成自答；ADR三判据齐才建。当前仓rename读者同改，历史五ADR只文首批注保旧正文锚；来源缺失/取消留unknown与未迁事实。关联FR-SM-004/013、AC-SM-008/009。

### SCN-007 — 规划Task图与方向map

make-decision使用者输入raw与研究，五段map/fog记录在现decision-log，fog显示未知边/后果而不预切实施票，HITL只真实人选。build-plan作者消费已选方向，以纵切Task/tracer/prefactor/blocking/expand-contract写现Phase，现计划展示说明实际seam；故事写真实角色动机结果。缺接口/方向未答保明确缺口，取消不当已确认，索引只指针。关联FR-SM-002/006/007、AC-SM-013/016。

### SCN-008 — 精简保全与先验后用

原作者提供原单文件Git字节和逐步骤约束，独立比较执行者使用同本任务输入冻结oracle。A1先校准具源grader，A2′三正文改写，A3逐真实改动分型核保全与必要behaviorcase；现输出可复用，不按每正文固定四跑；用户见逐约束落点、原件、四项客观量与unknown而非行数收益。新故障/丢约束回原作者修，权限护栏不为短而删，取消/provider缺失不填0，未取得评分事实不声称完整。关联FR-SM-001/012/015、AC-SM-012/015/018。

十维覆盖：旅程=上述八场景；表面=CLI/skill/material；数据状态=当前spec/Phase/facts单源、历史归属不当active；成功/失败=唯一Appendix；权限=真用户选择与Git record/consume，当前只规划；集成=anysearch外发批准/gh远端实际效果；取消恢复=同job信号/迟到raw、close先inspect不盲重；竞态=单文件持笔/原子写/HEAD漂移拒；非目标=下节；延期证据=历史enum一周期、AC011下任务真触发、计量unknown。空候选须理由，长调用running不是完成。UI三源合并：raw无页面、inventory package只有ajv/js-yaml及CLI测试、accepted_frontend只有方法文本。因此Design/Experience/浏览器preview N/A — 无产品页面consumer，UI技能保全不免除。

## 3. 产品事实 PFACT

- **PFACT-001**；状态：verified；正式来源decision/005/010真实答复；影响全部FR/AC；不推出实际计划确认。
- **PFACT-002**；状态：verified；direct read material-workspace:5..36、safe-write:208..235、stage-skill-runtime:54..99；影响FR-SM-005/007/014与对应AC；材料和字段合同下列逐字保。
- **PFACT-003**；状态：verified；direct read core/task-close:166/247/384与case-selection:62；影响FR-SM-003/004与AC001/002/009；PR不是只扩白名单。
- **PFACT-004**；状态：verified；010 freeze事实十三具名旧失败，4环境/夹具错；012 catalog RED及classification/PR RED实际事实；影响FR-SM-013/015与AC006/009/012/018；不是质量裁决。
- **PFACT-005**；状态：unknown；owner独立A/B测试执行者；真人重问/字符句长具体预算与noise稳定性未实测；影响FR-SM-001/015、AC015/018、OPEN001/RISK001，下一动作真实校准，不发明阈值。
- **PFACT-006**；状态：verified；五ADR全文directread与009:50；原决定六份而当前五命中，影响FR-SM-004/AC009，不凑第六无关历史。
- **PFACT-007**；状态：not_applicable；产品UI无页面consumer三源依据上节；影响FR-SM-001/AC015，方法语义仍验。

## 4. 功能需求与双向追踪

### FR-SM-001 — 外部候选适用性与写作保全

来源：R-001,R-020,R-021,R-031 / ADR-001；source_status=current。关联PFACT-005、SCN-008；验收AC-SM-015；Task落点P2/T002,P3/T004,P3/T006,P4/T007,P5/T008,P6/T009,P7/T011,P7/T012,P8/T013,P8/T015。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-002 — 方向地图只并入现decision-log

来源：R-002 / ADR-003；source_status=current。关联PFACT-001、SCN-007；验收AC-SM-013；Task落点P8/T015。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-003 — 真实自适应PR与描述

来源：R-003 / ADR-007；source_status=current。关联PFACT-003、SCN-001；验收AC-SM-001,AC-SM-002；Task落点P3/T004,P10/T020,P10/T021。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-004 — 所有目标项目唯一领域约定

来源：R-004 / ADR-002,ADR-003；source_status=current。关联PFACT-006、SCN-006；验收AC-SM-009；Task落点P7/T011,P9/T017。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-005 — 外部调研/轻研究接线

来源：R-005 / ADR-003,ADR-004；source_status=current。关联PFACT-002、SCN-005；验收AC-SM-010,AC-SM-011；Task落点P6/T009,P8/T016。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-006 — 叙事规格与用户故事

来源：R-006 / ADR-004；source_status=current。关联PFACT-002、SCN-007；验收AC-SM-015,AC-SM-016；Task落点P3/T006,P6/T009。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-007 — Task图/TDD接缝/纵向切片

来源：R-007,R-008,R-009,R-010 / ADR-004,ADR-005；source_status=current。关联PFACT-002、SCN-007；验收AC-SM-013,AC-SM-016；Task落点P3/T004,P3/T005,P6/T010。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-008 — 实施context pointers与同源补充

来源：R-011,R-012 / ADR-006,ADR-007；source_status=current。关联PFACT-001、SCN-003；验收AC-SM-004,AC-SM-014,AC-SM-016；Task落点P3/T004,P5/T008,P9/T018。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-009 — 诊断接线和可红复现先于假设

来源：R-013 / ADR-007；source_status=current。关联PFACT-001、SCN-002；验收AC-SM-011；Task落点P7/T012,P8/T016。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-010 — 架构评估一次/选后优化重验

来源：R-014 / ADR-008；source_status=current。关联PFACT-001、SCN-004；验收AC-SM-005；Task落点P8/T015。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-011 — 复盘候选/确定检查优先/未解清单

来源：R-015,R-016,R-017,R-018 / ADR-009；source_status=current。关联PFACT-001、SCN-002；验收AC-SM-003；Task落点P8/T014。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-012 — 原研究取舍/实际阶段与独立上下文

来源：R-019,R-022,R-025,R-026,R-027,R-028,R-029,R-030 / ADR-001；source_status=current。关联PFACT-001、SCN-008；验收AC-SM-012；Task落点P10/T021。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-013 — 出处/归属唯一登记与新固定commit

来源：R-023 / ADR-010,ADR-001；source_status=current。关联PFACT-004、SCN-006；验收AC-SM-006,AC-SM-008；Task落点P1/T001,P9/T017。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-014 — 清单合并/退役/历史归因

来源：R-024 / ADR-011,ADR-012；source_status=current。关联PFACT-002、SCN-005；验收AC-SM-006,AC-SM-007,AC-SM-010,AC-SM-011；Task落点P1/T001,P3/T005,P6/T009,P6/T010,P8/T016,P9/T019。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

### FR-SM-015 — 具名红灯与A/B可靠先验后用

来源：R-021 / ADR-001；source_status=current。关联PFACT-004、SCN-008；验收AC-SM-012,AC-SM-018；Task落点P2/T002,P2/T003,P4/T007,P10/T021。Task按同名oracle与正常/负例承接，反向每Task卡有授权来源与真实consumer。

31原R均以上FR source bindings承接，R025..030不新ADR：实际阶段/大白话/独立上下文/人决断由T021原件核；R019/R022原研究§六/8.3/8.4不假重复生产。18原AC映射新17组：原008/017合并新008，原001/002共享唯一gh原件，其余同后缀。新FR/AC canonical合法DOMAIN=SM；含义不因编码改写。

## 5. 模块、实体、生命周期与兼容

方法正文负责动作；catalog负责唯一历史出处/归属许可登记；deps和wh两清单是真实接线；close owner负责PR已有计划/动作，task-store/review-route只记事实。catalog顶层legacy_registration_history保存原44有序完整八字段[id,path,version,origin_path,origin_framework,local_changes,owner_stage,metrics_enabled]，历史复制不覆盖当前skills.local_changes、不参与runtime active派发。verify-code当前登记叙述窄修仅由P1/T001登记owner实施：stage-reflection、deep-research、anysearch、architect-code-review、diagnosing-bugs中确经现正文/消费者证明过时的purpose、design_idea、local_changes、upstream、update_policy可作对应语义更正；upstream未知固定来源明确unknown，不伪pin。legacy完整八字段/顺序/空值一字不动；不自动消used_by_stages report-only差异，不把当前叙述变为派发权威。唯一consumer人读迁移/退役与本任务独立保全重放，ownerR同时负责当前新commit/activebuild-spec/已定退役登记迁移，legacy原44行不动。只有被新具名历史载体承接、无读者且保留来源决定后可退役，不新增机器reader。A/B只git单文件A原字节与B当前字节，输出原件single，评分从原约束/需求独立冻结；迟到/失败不覆盖、cleanup不清证据。旧无pr五步/规划四步计划保持读和执行兼容；历史stage枚举仅保来源，不复活writer。

## 6. 非目标（唯一权威）

保X01整目录搬运、X02外tracker/.scratch第二根、X03编排器/路由、X04术语双真相、X05新stage/gate/第二进度、X06向量/daemon/marketplace拒绝取舍。历史specs/.planning/reports只读；不修符号漂移的无关旧consumer；不刷行数/凑第六ADR/拿缺Markdown链假称现checker完整。A3仅本任务前置证据顺序，无runtime对象/reader。010两workflow正文串行增量是唯一跨Phase例外，其余单Phase owner。

## 验收流程与测试标准

场景→FR→Appendix A→物理Phase Task→frozen同oracle→actual单份原件。每Task正负例/tier/具体skill/同命令/归因/coverage/STOP；纯owned .md无新运行行为才G-2，JSON/代码/混合不借G-2。比较不造仪式RED，already-pass是P2P保护非新RED；缺环境不是目标RED。

## 实现设计（全局权威）

### 当前source/scope correction — verify-code WH-LITERAL-01

来源：[独立详核402](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-09-402-verify-original-requirements-independent-audit.md)、[具体CR399](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-09-399-wh-literal437-specific-test-cr.json)、[原目标RED984](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-09-984-wh-literal437-target-red.json)与其唯一raw。父主会话明确转交本材料owner窄修范围，不改R/决定/FR/Appendix A、相序或进度声明。当前wh-review:11已把回退政策单一权威交两workflow「OCR 能力与回退」，自身执行文档审查与Long-review等待；simple-contracts原:437却仍向wh正文找ENOENT/低版字面，原source SHA256 9238cba8fba6833b1b2b49df7fb2ce4632b783c73bde8d0598b0b540d2aaee20，wh SHA256 a21d6611fc0bd096e8766e96278835c22bf35e8c4d3da17c54da4269241032b5。984实跑exit1、selected1fail/24filtered，首ENOENT断言失败，后两旧断言未到，不是环境RED。

仅将精确consumer test路径skills/wh-review/scripts/__tests__/simple-contracts.test.mjs纳P8/T016：唯一test实施owner74974d30，独立非作者source批准及同命令GREEN ownerc7edbb8f。按CR399只改该case与其必要本地oracle，保全部其它case/import/fixture及required/existence断言；将原条件强度迁到真实workflow政策节，并负控wh两指针、缺失/低版唯一architect、检测其它错及installed失败不fallback/invalid-output失败、Long-review真实终态边界。restore旧wh字面会重复政策权威并退回已接受方法，不能为消RED回填；不得删除断言/泛mentions换绿。先独立核实际test diff再同984 -t命令GREEN；本材料只确认当前写集与来源，CR尚待独立批准、修改/GREEN不冒已完成。九外置冻结oracle/scorer/gold、原raw/review、生产provider/公共入口均不改，不新增Task/Phase/gate。

### 当前scope修正 — build-plan审查真实lens消费

来源：[用户实际批准466](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-09-466-build-plan-lens-fix-user-scope.json)，原话「好的，按计划进行吧，直到所有任务彻底完成为止」；基准6dbcc53db3e2c0588ccf4f76ebe73ba4c0a02171。[029目标原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/verify-code-20261009/2026-10-09-029-build-plan-lens-selection-probe.json)实默认只review，未交付workflows/build-plan/SKILL.md:23要求的工程/简化lens。此修既定方法的实际consumer，不改FR/Appendix A、Phase/Task或方向，不重审旧任务、不执行最终close。

P8/T016唯一生产writer74974d30维护两清单与现组包/恢复消费者：required为review、simplicity-guard、plan-eng-review，plan-design-review按真实UI材料条件；规则正文继续归原lens，不复制大清单或加轮次。既有build-plan material allowlist只接raw/spec/AC/Phase/index及context_map/evidence_map；UI三来源事实可在现context_map内普通ui_applicability内容保存raw_requirement、project_inventory、planned_or_changed_frontend_fact及具源source_reasons，不增加顶层材料key、public必填字段/schema或持久对象。唯一现私有选材owner从同份已过滤材料解释该可选事实：先核三来源事实完整可定位且ui_scope非null：任一缺失、畸形、不可定位、null或producer显式同来源矛盾均为unknown，仍交默认三lens并在instruction明示UI材料缺口，不报nonUI/N/A或UI已审；三项均有效且非null时，任一true选design，全部false才省。reason仅核存在供lens核语义，不词匹配或真值认证；额外conclusion不覆盖三事实。其它来源没有UI不天然否定具源已接受UI计划；真实范围取舍尚冲突时由事实producer写unknown，程序不替人裁决。调用者ui_scope不单独决定，恢复沿同material重新选；不关键词扫Markdown/文件名猜非UI、不访问packet外补库存。旧无事实包仍合法可审，unknown不变流程门；该普通内容不是新机器认证合同。workflows/build-plan/SKILL.md仅必要条件指针澄清，原步骤/人确认/一次审查不变。

精确新增写集仅skills/wh-review/scripts/review-materials.mjs、skills/wh-review/scripts/simple-review-runner.mjs现私有组包/重建接缝及tests/contract/card03-review-orchestration.test.mjs两相关assert；两清单及build-plan正文原已P8授权但本次仅相关条件。review-materials-contract/simple-contracts无需本次改写，新外置独立七case覆盖真实packet seam，不为覆盖增加等价测试。独立test writer a2c9，具体旧review-only冻结assert变更必须c7edbb8f非作者CR批准后窄改；新oracle先冻结/目标RED，旧P2及外置980/987/010/012/014/历史原raw不改。验证默认三lens、具源UI第四lens、显式非UI、缺/冲突unknown、callerflag不能覆实事实、直接与serialize/rehydrate同正文，负控缺工程/简化或恢复丢UI应实际失败；必要命令由独立test owner按真实环境定，不全suite/新provider。此处写集/source授权不自判GREEN，独立c7核scope/source、a2实际复验，Git另原owner真实record/consume。

### 当前六组要求补齐范围（不改变已确认取舍）

来源：[新用户授权487](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-09-487-six-requirements-completion-user-scope.json)，原话「好的，按计划执行吧，直到所有原始需求完成，整个任务彻底没有遗漏为止」，基准77f81ed3d498ae2eef1419f3652b8f35ecb7dfcf。六组仍按原始需求与已接受方向验收，不要求逐字导入所有外部技能，不改变独立Phase、环境自适应PR、架构机会须用户先选等取舍。每有效子项核方法正文、真实可达consumer、源定义有限case及失败；登记/文件/退出0不替效果，历史每Phase审查、跨项目真人或外部服务未发生的部分如实保未知，不倒填或强造选择。

已确认五处窄修由原single-writer74974d30实施：mini-task仅退役不存在runner/P5未来导航，保当前材料/OCR/授权/取消；Multica正文仅去个人路径假设，改调用方真实repo的可搬运例，保main只读/CLI/workspace/确认与外部回读；build-code仅真实stage末有问题时读取同一reflection方法一次或显式不可用/跳过理由，不固定每Phase新增轮次；stage-reflection仅用户已选机械候选先核现结构/types/tests/CI检查和consumer、复用/窄扩后才有源新增，未答不采纳；resolving-merge-conflicts仅逐冲突明确双方预期结果及受影响检查/读回完成条件，保任务分支/目标只读/不全局ours-theirs/abort/原授权。新增精确方法路径仅skills/resolving-merge-conflicts/SKILL.md归P8/T013；mini-task归P9、build-code沿P3→P9原串行持笔，P8/T015只记录本次方法协作范围，不并发第二writer。core/task-close.mjs不在此增量，当前未证运行时merge错误，不新增validator或核心修复。mini默认代码consumer独立实追另确认运行时遗漏：bundle交付skills/mini-task/scripts/mini-task-runner.mjs，factory.runImplementationReview经默认runReviewRecovery仍进入wh文档面；原integration只注入handler，不证明默认路由。用户487覆盖此原审查功能修复，唯一代码writer d49d2a01改该mini脚本与tools/cli/stage-runtime.mjs现review-record私有CodeDispatcher适配，另精确修runtime/review/ocr-delegation-adapter.mjs的resolveTrustedOcrRoute消费者；749仅方法不碰runner。mini implementation保原kind/subject而明确code face/scope，不能改成普通Phase/null伪身份；设计文审保wh。复用现1055–1129单一review-record producer/dispatcher闭包提为共享私有函数，内部窄export接mini implementation的{taskDir,request,services,cwd}，沿thinTaskContext核身份及材料，无临时请求文件/新public动作。factory原services底层执行/取消依赖可透传，design与显式reviewRunner现兼容保；formalPhase投影仍kindnull，mini kind/subject不丢。后续实读确认适配器576–579对reviewKind非null直接return null，配置接受mini不等实际trusted route支持；原500/501/513读时的适配器已支持推论撤回但原件保。只补mini_task.implementation且stage=build-code、scope=phase、track=null，沿whReview.mini_task.implementation现single_round配置和既有provider/安全校验；不丢kind冒普通身份、不开放design/其它kind，不新增enum/公共字段/protocol。原ordinary路由、模式、检测/执行失败与取消事实保。mini合法材料合同只有spec承载完整AC权威，现packet projection固定找acceptance_criteria不适配；本次在上述已授权代码路径内部固定以mini的完整spec正文投影包验收并保持原指令/current diff/manifest校验，不要求mini新公共材料键，不按Phase摘剪，普通阶段acceptance_criteria来源与强度不变。此精确技术修归P9/T018同d49、原a2合法配置目标oracle与c7独立源码审消费，不给整目录写权。本次在只有ENOENT或低版的nativeFallback路径补入完整architect正文与指令/manifest，用真实wh-review执行并保其标识，不标签冒architect；已装失败/取消/其它检测错误原件保，不新增公共命令、身份schema、producer或平台。现tests/integration/mini-task-delivery.test.mjs只在具体独立CR后可新增必要默认consumer case；a2现公共factory到可控transport/命令的真实派发probe先写目标RED，不以injectedreviewRunner标签自证。另test路径待原owner实查后精确登记，不目录授权。

当前全方法实读又确认五处同类source缺口，仍由749同一持笔者串行修：plan-eng-review仅把未来GREEN写为可执行计划/实际RED诚实分型，not_checked交host限界而非凭未查虚造finding或扩findings JSON；anysearch仅区分真实可用匿名/有key能力，无key本身不等unavailable，外发范围/批准/失败边界保；third-review仅SKILL:52/57去过时512KB拒绝承诺，现attachments:110–143不按字节数拒绝且exceptions:13正确，不改runtime或docs来新增gate；:58按broker:1029–1065真实同session续跑规则区分独立delta附件同delivery校验与显式reuse_frozen_material且首轮完整冻结的复用，不再绝对说不重传附件，不新增字段；spec-specify现模板:321只去active build-spec或显历史适用性；simplicity-guard:107核四阶梯回本文件原16–42唯一正文，不向无定义的根GLOSSARY新增复制。原P5两lens仍原owner，P8只记录同writer本次原位纠偏；模板附件新精确纳P8/T013源指针修，不授整目录或另一spec作者。

六组结果面：方向map/fog/HITL、内部一手研究与领域语言；支持环境的真实PR和描述（收尾不提前开PR）；来源叙事/唯一验收、纵切Task图与已确认seam/独立期望/TDD；真实实施/诊断/同源补充分轴；完整改动范围的Standards/Spec核对；实际问题复盘、真实选择后的检查或未解项与prune；当前active方法核心保全/可搬运性/适用来源。新行为只追加未覆盖真实case，表达修正用保核心的可证伪G2应用；a2独立oracle/source_knownbad先冻结，c7独立语义/具体旧testCR复核。可用现允许材料一次最小consumer补原待验，不把D053延期当已实现，也不编真人/外效果。此处不给全部旅程或所有未来场景通过结论。

架构机会353原件已实际发生且覆盖有限五面，重复只引用其范围/未查；本轮可审未覆盖的真实改动seam及其规范/功能合规，不能重新产机会、接口设计或未经用户选择的优化。安全修复可继续，未知不作工作许可门；当前质量终判另依独立事实，不作者自审三材料。保持原FR/Appendix A/决定/Phase/Task，相同外置原报告只读，不新schema、公共节点、进度对象、统计或第二正常审查。最终close/归档/删除尚无授权。

### 术语维护与入口mini适用性追加范围（533）

新来源仅引用[用户原话533](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-09-533-glossary-maintenance-mini-entry-user-scope.json)，读时基准4d549ce7。本追加不撤回530/531原六组有限验收，不更改旧FR/AC/Appendix或新增Phase、公共类型/状态、schema、进度门。

领域方法原grill:156/180已明确真实resolved后inline更新及无变化理由；make-decision:39只在Grill窗口调用，后草稿/确认仍可能解决术语而:42末端未逐已解决术语核写回。修复方法消费者和完成界限，不假称缺少runtime术语writer。唯一领域载体GLOSSARY.md只收WorkflowHub领域概念、关系/边界/实际场景，现已接受规范与领域研究具名来源支持才纳；源不足/含义冲突保持未决。每个真实resolved窗口即时写唯一owner，末端只对已resolved项实际读回或说明已有同义定义/no_change；不是每次强写或批量替用户定义，不双建CONTEXT/map/ADR，不把代码结构/接口/临时进度塞术语表。

入口mini适用性与普通/规划任务性质为两个维度：ordinary目的才按边界清楚、单一结果、有限影响和重大架构/迁移/权限/安全事实判断精简交付建议，保真实来源与未知；规划性质问题沿原方向边界，不新增第三互斥任务类型，不自动bootstrap/转换。现evaluateMiniTaskScope:91–119默认补true/false导致{}或仅user_requested被判适合、别名冲突可能被判suitable_with_risk。只改该函数读事实，不扩runner审查/close/resume：七事实各有明确boolean且别名一致才评已知适合；missing/null/nonboolean/别名冲突保原三个status内paused并明确原因/待核项，user_requested不能补事实。已知正向不成立而用户仍选mini保既有suitable_with_risk边界；已知扩大风险true持续paused和真实路线选择。flags仍boolean，不新增状态/schema/公开类型。

精确写面归现P9/T018窄追加：GLOSSARY.md（a680领域具名来源、749唯一方法持笔），workflows/make-decision/SKILL.md及skill-deps.yaml（新入口mini conditional consumer、grill覆盖所有真实resolved窗口），skills/grill-with-docs/SKILL.md（唯一领域维护过程锐化），skills/mini-task/SKILL.md（正交适用性pointer），以上方法同749；skills/mini-task/scripts/mini-task-runner.mjs仅evaluate函数由d49原runtime writer。仅tests/integration/mini-task-delivery.test.mjs由a2测试writer实施已由c7批准的:6尾夹具补其余六明确资格boolean，保boundary_clear=false/user_requested=true与suitable_with_risk原语义/风险循环；在同现文件补纯evaluate资格回归，审查/交付其它字节不动，mini-task-a-resume.test.mjs全部不动。本任务decision-log.md身份:5现尾注导致readTaskTypeFromDecisionLog:74严格两类型reader返回unknown；仅材料原owner198改任务类型值为exact普通任务、尾注移独立任务说明行，原决定/说明含义保，不放宽parser或增第三type。新回归文件须a2先提确切路径、oracle及职责/consumer登记，未提不授tests目录或猜模板。a2先实目标RED/冻结并同源GREEN与已知正负条件；方法以有源resolved/no_change/未答保护和入口两维真实场景独立验证，c7/a680分别源/领域核，材料作者不自判。其它运行时类型reader、规范、公共命令和review协议不授写；仅必要技术修不新增用户日常确认或覆盖最终close授权边界。

### 已核接口与选择

复用既有safe-write/task facts/review single producer；规范A1复用WR001，A2′spec-specify唯一规范正文节，其余指针消费不新增第四规范对象。B2仅新索引模板与正文合并，旧薄文件删除归B4单owner，避免逆向依赖。B6治理单结果“当前术语/审查政策及其读者一致”，rename Task与七文本纯修宪Task独立diff/commit/验收/回退；修宪代码测试变更另commit不混七文本。PR实现另Phase，避免两高风险面互掩。

consumer实读：stage-skill-runtime:70 loadStageSkillManifest读name/path/trigger；run-checks:100读catalog path→validateSkillBundle/static deps，不读新history派发。material-workspace:8..36只纯index连续Phase；case-selection:62 classifyChangedPaths→selectAffectedCases；workflow-evolution:168 computeQualityTaxProjection→历史税事实。task-store:76 same_source_degraded不能非空review_result_ref，补充原件用现evidence/ref，不假conducted。

PR既有签名prepareDeliveryClosePlan({taskDir,delivery={}})窄扩可选delivery.pr={enabled,title,body}；newordinary缺此参数也默认probe支持PR，enabled:false明确optout才commit-only，旧storedplan缺pr仍原序兼容；P3/T004为描述模板及真实材料采集方法owner，prepare既有closeowner内私有buildDefaultPrDescription实际生成默认title/body：读task.json/spec、真实Git base..taskHEAD commit title/diff与现facts原ref。缺delivery.pr/body也默认调用helper，不要求调用者先传。Summary最小任务视图、Evidence真实before/after与实际测试原ref（facts空=未执行/unavailable）、Merge Danger的Door/Blast Radius来自真操作边界/实际diff，未知风险明说。explicitbody缺两风险字段才外发前PR_DESCRIPTION_INCOMPLETE；默认helper源不可读则保真实缺源原因不编。实际fixture已read101行，README before owned change→after owned change、commit Owned delivery title、facts空均可合法描述，标题失败后的bodyassert仍未执行到，不拿gold存在当实证。支持probe存现plan.pr={status,head,base,title,body,reason}，available普通steps=[commit,push-task,pr,merge,archive,push,cleanup]；无pr旧序保持。push-task现push授权推task:task，pr新authorize动作；gh/base/auth/ahead不可用保真实原原因和描述，不能用localbare冒GitHub。executeClosePlan既有signal仅操作间取消，spawnSync不承诺即时；重试先inspect与head/base查重、cleanup核本调用实际remote任务HEAD，不盲用旧prepush head。五面core/task-close、git-authorize、task-store、current-close-projection、stage-runtime同步。

新增tools/cli/check-skill-consistency.mjs仅窄只读--root W命令，唯一consumer=run-checks既有检查聚合/变更维护者，ownerB4，替代孤儿manifest当前对账；输入catalog/deps/wh实际清单，不存在/重复/未登记当前引用显式非零，historical history缺路径不算active。先move-map登记owner/consumer/测试/替代/无consumer删除条件；fixture故意删当前deps目标应失败、正常集合过；该checker实际预写RED目前unavailable，local catalog负控不冒productionchecker。

### 精确Phase边界/依赖

P1 R历史登记；P2 A1夹具/禁区；P3 A2′三正文；P4 A3真实比较；P5 B1审查正文；P6 B2规划正文/索引附件；P7 B3对话领域/诊断；P8 B4实际接线/剩余叶子/复盘/编排；P9 B6治理读者一致；P10 B6 PR运行与终末聚合。串行P1→P10；每Phase exact NEW/MODIFY/DELETE路径与owner以其契约头声明、index逐条一致，下游写集必须subset。生产新增精确路径：skills/spec-plan/templates/index-template.md（迁移）、skills/grill-with-docs/GLOSSARY-FORMAT.md（迁移）、GLOSSARY.md（迁移）、Improvements.md、tools/cli/check-skill-consistency.mjs；其它精确MODIFY/DELETE列各Phase，不目录授权。外置A1/A3执行工件写T quality/tests，不是repo NEW；索引列路径使用task-relative质量路径并明确外置解析，不能被实施者写进W。

目录预登记的窄时序修正：`docs/architecture/move-map.json`仍只有P8/T016原维护者持笔；他在各已授权新增文件创建前，以普通目录责任声明分次登记真实consumer、该文件Phase owner、测试、替代关系与删除/保留条件。P6/T010创建新索引模板前仅登记`skills/spec-tasks/templates/index-template.md`→`skills/spec-plan/templates/index-template.md`，consumer为spec-plan索引渲染方法及其bundle附件闭包，文件owner=P6-single-writer；旧附件/调用保至P8具名0悬空后删。P7/T011改名附件前由同一map维护者登记`skills/grill-with-docs/CONTEXT-FORMAT.md`→`skills/grill-with-docs/GLOSSARY-FORMAT.md`及真实正文/bundle/test读者，文件owner=P7-single-writer，保旧来源、迁完读者仅留新格式；P8的`Improvements.md`与新checker、P9根`GLOSSARY.md`分别仍在创建前由该map唯一维护者登记，不假称已存在或已迁接。职责有替代承接且无当前consumer时由对应文件owner删除，历史来源只读保留。此步骤只修唯一目录事实维护责任的时序，不是提前实施P8接线/清manifest/删除，不新增Task、Phase、控制面、进度账本或gate，不证明任何Phase交付。P6/P7/P9只消费现spec声明与该普通登记，不获得map写权；各Phase的实现写集/依赖仍原序，010两workflow例外不增第三路径。

### 全局精确文件操作与Phase owner

| 操作 | 精确路径 | Phase owner |
| --- | --- | --- |
| MODIFY | `skills/catalog.yaml` | P1 |
| NEW（仅外置T） | `quality/tests/skill-modernization-protected-literals.json` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-ab-input.json` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-ab.test.mjs` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-a1-comparison.json` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-consistency.test.mjs` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-thin-merge.test.mjs` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-domain.test.mjs` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-diagnose.test.mjs` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-reflection.test.mjs` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-supplemental-review.test.mjs` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-pr-default-body.test.mjs` | P2 |
| NEW（仅外置T） | `quality/tests/skill-modernization-catalog-current.test.mjs` | P2 |
| MODIFY | `workflows/build-code/SKILL.md` | P3→P9（010两workflow串行原持笔例外） |
| MODIFY | `skills/spec-plan/SKILL.md` | P3 |
| MODIFY | `skills/spec-specify/SKILL.md` | P3 |
| NEW（仅外置T） | `quality/tests/skill-modernization-a3-comparison.json` | P4 |
| MODIFY | `skills/wh-review/SKILL.md` | P5 |
| MODIFY | `skills/review/SKILL.md` | P5 |
| MODIFY | `skills/architect-code-review/SKILL.md` | P5 |
| MODIFY | `skills/simplicity-guard/SKILL.md` | P5 |
| MODIFY | `skills/plan-eng-review/SKILL.md` | P5 |
| MODIFY | `skills/decision-log/SKILL.md` | P6 |
| MODIFY | `skills/spec-prd/SKILL.md` | P6 |
| MODIFY | `skills/spec-analyze/SKILL.md` | P6 |
| MODIFY（已注册lens入口薄导航同步） | `skills/spec-analyze/packet-lens.md` | P6/T009 |
| MODIFY | `skills/spec-clarify/SKILL.md` | P6 |
| MODIFY | `skills/deep-research/SKILL.md` | P6 |
| MODIFY | `skills/spec-plan/templates/phase-template.md` | P6 |
| NEW | `skills/spec-plan/templates/index-template.md` | P6 |
| MODIFY | `skills/spec-plan/skill-bundle.json` | P6 |
| MODIFY | `skills/talk-with-zhipeng/SKILL.md` | P7 |
| MODIFY | `skills/grill-with-docs/SKILL.md` | P7；新533维护边界P9/T018串行single-writer749 |
| DELETE（consumer已迁后） | `skills/grill-with-docs/CONTEXT-FORMAT.md` | P7 |
| NEW | `skills/grill-with-docs/GLOSSARY-FORMAT.md` | P7 |
| MODIFY | `skills/grill-with-docs/skill-bundle.json` | P7 |
| MODIFY（具体test change request独立批准后，仅:75附件filename与:79同regexp名称迁移） | `tests/moat-skills-phase1.test.mjs` | P7/T011 |
| MODIFY | `skills/diagnosing-bugs/SKILL.md` | P7 |
| MODIFY | `skills/diagnosing-bugs/skill-bundle.json` | P7 |
| MODIFY | `skills/test-routing-advisor/SKILL.md` | P8 |
| MODIFY | `skills/backend-testing/SKILL.md` | P8 |
| MODIFY | `skills/frontend-testing/SKILL.md` | P8 |
| MODIFY | `skills/fullstack-slice-testing/SKILL.md` | P8 |
| MODIFY | `skills/isolated-browser-qa/SKILL.md` | P8 |
| MODIFY | `skills/frontend-component-quality/SKILL.md` | P8 |
| MODIFY | `skills/testing-system-blueprint/SKILL.md` | P8 |
| MODIFY | `skills/anysearch/SKILL.md` | P8 |
| MODIFY | `skills/design-source-readiness/SKILL.md` | P8 |
| MODIFY | `skills/frontend-prototype-render/SKILL.md` | P8 |
| MODIFY | `skills/intake-decision-review/SKILL.md` | P8 |
| MODIFY | `skills/plan-ceo-review/SKILL.md` | P8 |
| MODIFY | `skills/plan-design-review/SKILL.md` | P8 |
| MODIFY | `skills/stage-handoff/SKILL.md` | P8 |
| MODIFY | `skills/third-review/SKILL.md` | P8 |
| MODIFY | `skills/ui-project-init/SKILL.md` | P8 |
| MODIFY | `skills/workflowhub-multica-sync/SKILL.md` | P8 |
| MODIFY（逐冲突双方行为与可观察完成条件，非新增merge代码校验器） | `skills/resolving-merge-conflicts/SKILL.md` | P8/T013；single-writer74974d30 |
| MODIFY（仅原321风险处理阶段active build-spec指针，保模板其它正文） | `skills/spec-specify/templates/spec-template.md` | P8/T013具名引用附件源纠偏；single-writer74974d30 |
| MODIFY | `skills/stage-reflection/SKILL.md` | P8 |
| NEW | `Improvements.md` | P8 |
| MODIFY | `workflows/make-decision/SKILL.md` | P8；新533术语/入口P9/T018串行single-writer749 |
| MODIFY | `workflows/build-plan/SKILL.md` | P8 |
| MODIFY | `workflows/verify-code/SKILL.md` | P8→P9（010两workflow串行原持笔例外） |
| MODIFY | `workflows/build-prd/SKILL.md` | P8 |
| MODIFY | `workflows/make-decision/skill-deps.yaml` | P8；新533mini条件触发/grill领域窗口P9/T018串行single-writer749 |
| MODIFY | `workflows/make-decision/steps.json` | P8 |
| MODIFY | `workflows/build-plan/skill-deps.yaml` | P8 |
| MODIFY | `workflows/build-plan/steps.json` | P8 |
| MODIFY | `workflows/build-code/skill-deps.yaml` | P8 |
| MODIFY | `workflows/build-code/steps.json` | P8 |
| MODIFY | `workflows/verify-code/skill-deps.yaml` | P8 |
| MODIFY | `workflows/verify-code/steps.json` | P8 |
| MODIFY | `workflows/build-prd/skill-deps.yaml` | P8 |
| MODIFY | `workflows/build-prd/steps.json` | P8 |
| MODIFY | `skills/wh-review/manifest.json` | P8 |
| MODIFY | `skills/wh-review/stage-skill-plan.json` | P8 |
| MODIFY（build-plan同材料lens选择与UI证据解释私有接缝） | `skills/wh-review/scripts/review-materials.mjs` | P8/T016；生产single-writer74974d30 |
| MODIFY（仅现packet直接/serialize恢复同材料选材消费者） | `skills/wh-review/scripts/simple-review-runner.mjs` | P8/T016；生产single-writer74974d30 |
| MODIFY（具体VC-BP-LENS-CR01独立c7批准后，仅原161–171两build-plan相关assert） | `tests/contract/card03-review-orchestration.test.mjs` | P8/T016；旧consumer窄改74974d30，新外置oracle独立a2c9 |
| MODIFY | `docs/architecture/move-map.json` | P8/T016唯一原维护者；普通预登记时序见上，不授其它Phase写权 |
| MODIFY | `tools/cli/run-checks.mjs` | P8 |
| MODIFY（仅resolveSkillPackage消费既有name/path/trigger合同） | `runtime/adapters/local-skill-resolver.mjs` | P8/T016 |
| MODIFY（具体test change request独立批准后，保原cases并新增定向case） | `core/__tests__/local-skill-resolver.test.mjs` | P8/T016 |
| MODIFY（仅当前OCR回退consumer case，CR399及独立批准后） | `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs` | P8/T016；test唯一实施owner74974d30，独立批准/GREEN ownerc7edbb8f |
| NEW | `tools/cli/check-skill-consistency.mjs` | P8 |
| DELETE（consumer已迁后） | `skills/spec-tasks/SKILL.md` | P8 |
| DELETE（consumer已迁后） | `skills/spec-tasks/skill-bundle.json` | P8 |
| DELETE（consumer已迁后） | `skills/spec-tasks/templates/index-template.md` | P8 |
| DELETE（consumer已迁后） | `skills/spec-research/SKILL.md` | P8 |
| DELETE（consumer已迁后） | `skills/spec-research/skill-bundle.json` | P8 |
| DELETE（consumer已迁后） | `repo-skills.manifest.json` | P8 |
| DELETE（consumer已迁后） | `skills/debate/LICENSE` | P8 |
| DELETE（consumer已迁后） | `skills/debate/SKILL.md` | P8 |
| DELETE（consumer已迁后） | `skills/debate/skill-bundle.json` | P8 |
| DELETE（consumer已迁后） | `skills/debate/__tests__/skill-contract.test.mjs` | P8 |
| DELETE（consumer已迁后） | `skills/debate/examples/sample-input.md` | P8 |
| DELETE（consumer已迁后） | `skills/debate/examples/sample-verdict.md` | P8 |
| DELETE（consumer已迁后） | `skills/debate/pk-rules.test.ts` | P8 |
| DELETE（consumer已迁后） | `skills/debate/pk-rules.ts` | P8 |
| DELETE（consumer已迁后） | `skills/debate/references/anti-bias-guardrails.md` | P8 |
| DELETE（consumer已迁后） | `skills/debate/references/arbitration-protocol.md` | P8 |
| DELETE（consumer已迁后） | `skills/debate/references/output-template.md` | P8 |
| DELETE（consumer已迁后） | `skills/debate/references/role-spawn-templates.md` | P8 |
| DELETE（consumer已迁后） | `CONTEXT.md` | P9 |
| NEW | `GLOSSARY.md` | P9 |
| MODIFY | `README.md` | P9 |
| MODIFY | `AGENTS.md` | P9 |
| MODIFY | `CLAUDE.md` | P9 |
| MODIFY | `docs/standard-workflow.md` | P9 |
| MODIFY | `tools/cli/verify-structure.mjs` | P9 |
| MODIFY | `workflows/build-code/case-selection.mjs` | P9 |
| MODIFY | `docs/archive/repository-inventory.tsv` | P9 |
| MODIFY | `THIRD_PARTY_NOTICES.md` | P9 |
| MODIFY | `skills/reuse-registry.md` | P9 |
| MODIFY | `docs/adr/0010-serious-review-disposition.md` | P9 |
| MODIFY | `docs/adr/0022-candidate-pool-judgment-whitelist.md` | P9 |
| MODIFY | `docs/adr/0023-stage-reflection-execution-and-status.md` | P9 |
| MODIFY | `docs/adr/0031-review-check-downgrade-and-identity-boundary.md` | P9 |
| MODIFY | `docs/adr/0034-subagent-dispatch-and-parallel-rules.md` | P9 |
| MODIFY | `CONSTITUTION.md` | P9 |
| MODIFY | `skills/mini-task/SKILL.md` | P9 |
| MODIFY（默认implementation真实代码审查私有接线，design保文审） | `skills/mini-task/scripts/mini-task-runner.mjs` | P9/T018；代码single-writer d49d2a01 |
| MODIFY（仅真实mini implementation/build-code/phase trusted route，普通路由/设计保） | `runtime/review/ocr-delegation-adapter.mjs` | P9/T018；原代码single-writer d49d2a01 |
| MODIFY（原mini默认consumer范围保；新533仅:6风险夹具事实补全及纯evaluate资格回归） | `tests/integration/mini-task-delivery.test.mjs` | P9/T018；新测试single-writer a2，独立CR c7；runtime单writer d49不写测试 |
| MODIFY（新533仅任务类型exact普通任务及原尾注移说明行，原决定保） | `specs/workflowhub-skill-modernization-20261008/decision-log.md` | P9/T018；材料原single-writer198 |
| MODIFY | `skills/workflowhub-host-protocol/SKILL.md` | P9 |
| MODIFY | `skills/wh-review/contracts/verify-code.md` | P9 |
| MODIFY | `tests/contract/verify-architect-acceptance.test.mjs` | P9 |
| MODIFY | `runtime/evidence/workflow-evolution.mjs` | P9 |
| MODIFY | `runtime/evidence/research-report.mjs` | P9 |
| MODIFY（T019 publisher定向case具体CR独立批准后，保历史/原cases） | `tests/contract/research-report-current.test.mjs` | P9/T019 |
| MODIFY | `runtime/review/review-packet-identity.mjs` | P9 |
| MODIFY | `runtime/schemas/risk-acceptance.v1.json` | P9 |
| MODIFY | `runtime/schemas/human-confirmation.v1.schema.json` | P9 |
| MODIFY | `runtime/review/schemas/attempt.schema.json` | P9 |
| MODIFY | `core/task-close.mjs` | P10 |
| MODIFY | `runtime/interface/git-authorize.mjs` | P10 |
| MODIFY | `runtime/task/task-store.mjs` | P10 |
| MODIFY | `runtime/stage/current-close-projection.mjs` | P10 |
| MODIFY（原P10 close保；新增mini implementation代码面现review-record私有消费者精确串行例外，不新增public动作） | `tools/cli/stage-runtime.mjs` | P10→P9/T018现single-writer d49d2a01 |
| MODIFY | `tests/close/close-contract.test.mjs` | P10 |
| MODIFY | `tests/contract/four-domain-close-status.test.mjs` | P10 |
| MODIFY | `tests/contract/current-close-projection-readback.test.mjs` | P10 |

| NEW（仅外置T） | `quality/tests/skill-modernization-comparison-v3.test.mjs` | P2（T003唯一writer11d7c0d3） |
| NEW（仅外置T） | `quality/tests/skill-modernization-comparison-v3.mjs` | P2（T003唯一writer11d7c0d3） |
| NEW（仅外置T） | `quality/tests/skill-modernization-comparison-contract-v3.json` | P2（T003唯一writer11d7c0d3） |

表外repo路径DO NOT TOUCH；外置quality路径不能写W生产。

### 审查材料角色别名

本worktree唯一spec.md及Appendix A为权威。审查包draft_spec与acceptance_criteria是同一物理spec不同角色的瞬时输送别名，不另在W/T创建验收全文，也不独立维护第二件；验收角色只指Appendix A。正式原review保原传输材料和发现不可变，后续handoff说明该alias，不改原包/协议。

### 受保护实读

以下functions.read直接读取W于2026-10-08；以下为局部token/字段名/签名片段，不是整行字节。各片段取自本轮直接read；允许局部变化以Phase Task为准，未实读不得声称整行或整个接口未变。

- runtime/task/material-workspace.mjs:5逐字：

~~~text
export const CURRENT_MATERIAL_FILES = Object.freeze(["decision-log.md", "spec.md", "phases/index.md"]);
~~~

- runtime/task/material-workspace.mjs:6逐字：

~~~text
const PHASE_FILE = /^phases\/P([1-9][0-9]*)\.md$/;
~~~

- runtime/interface/safe-write.mjs:208逐字：

~~~text
export async function writeFileAtomic(root, relPath, bytes)
~~~

- runtime/interface/safe-write.mjs:212逐字：

~~~text
export async function createFileOnce(root, relPath, bytes)
~~~

- runtime/interface/safe-write.mjs:216逐字：

~~~text
export async function appendRecord(dir, slug, ext, bytes)
~~~

- runtime/task/task-store.mjs:7逐字：

~~~text
["stage", "close_action"]
~~~

- runtime/task/task-store.mjs:8..11逐字：

~~~text
record_kind, task_id, stage, source, created_at, review_origin, review_result_ref, finding_dispositions, spec_analyze, evidence, serious_issue_disposition, close_action, handoff, material_bytes
~~~

- runtime/task/task-store.mjs:12逐字：

~~~text
["conducted", "unavailable", "not_run", "same_source_degraded", "dispatched_uncollected"]
~~~

- runtime/evidence/skill-static-deps.mjs:51逐字：

~~~text
findUndeclaredStaticDependencies({ skillDir, fileEntries })
~~~

- CONSTITUTION.md:3逐字：

~~~text
Version: 1.9.2
~~~

- CONSTITUTION.md:172逐字（P9前规划实读来源时点，保下列原quote，不代表P9后当前政策）：

~~~text
代码由 OCR，只有 OCR 未安装才回退 wh-review 并记录事实。
~~~

- skills/spec-plan/SKILL.md:19逐字：

~~~text
One Task is one user-perceivable delivery increment
~~~

- skills/spec-plan/SKILL.md:17逐字：

~~~text
A superseded full-text body does not stay in this file either
~~~

- skills/spec-plan/SKILL.md:27逐字：

~~~text
run the same self-check with `simplicity-guard`'s core questions
~~~

- skills/spec-specify/SKILL.md:39逐字：

~~~text
self-check with `simplicity-guard`'s core questions (has this layer earned its place
~~~

- tests/contract/verify-architect-acceptance.test.mjs:13逐字：

~~~text
{name:"wh-review",path:"skills/wh-review/SKILL.md",trigger:"every_code_review_invocation_method_only_or_existing_ocr_fallback"}
~~~

DO NOT TOUCH精确路径：runtime/task/material-workspace.mjs、runtime/interface/safe-write.mjs、runtime/evidence/skill-static-deps.mjs、tests/acceptance/card-03-current.mjs、constitution-checklist.md、package.json。checklist本轮read22原则与close三义未包含wh-review/architect回退目标枚举，P9只改宪法治理实施边界而不改22标题/定义映射，因此无checklist同步consumer改动。task-store仅CLOSE_ACTIONS变，STAGE_ROW_KEYS/REVIEW_ORIGINS保护；宪法仅回退条款改，22原则/七公共类保。static deps:68不存在Markdown不报missing，:75存在未声明附件才报，不扩它。verify-architect旧wh-review精确fallback literal与新方向冲突，P9 test change request独立批准后改，旧字节git/raw留；Long-review三bullet/17串仍保。五ADR全文已直接read，标题后批注外所有正文和旧行号保护。

P7/T011真实filename consumer的窄测试合同：本轮直接read `tests/moat-skills-phase1.test.mjs:75`为`assert.ok(existsSync(filePath("skills", "grill-with-docs", "CONTEXT-FORMAT.md")));`，它在删除旧格式后必然失败，并非新方法效果失败。仅允许经具体test change request与独立非作者批准，将该附件存在性断言的精确filename改为`GLOSSARY-FORMAT.md`，保持`assert.ok(existsSync(filePath(...)))`存在性强度；另经具体CR230与独立104源scope认可，仅:79原`/输出|Update CONTEXT\.md|ADR/`→新`/输出|Update GLOSSARY\.md|ADR/`，保同assert.match predicate、转义点、输出/ADR分支、顺序、message及除该名称外全部字节。其余assert/scorer/gold不变；不得删assert、skip、允许old-or-new或复制旧附件凑绿。请求保存原/新assert、旧源码字节/hash、已有oldraw原ref、改名理由与影响；若新执行失败则单份保存真实raw，不造已跑RED。未来测试修改单独diff/commit/验收/回退，不混方法正文、不借G2，批准者独立于正文与测试修改作者；本次材料作者不批准亦不修改测试。:79原整文件9pass不等于GLOSSARY词支专测、独立104仅源scope认可不等实际diff批准；材料扩该精确名称后实际test diff须另独立核、单独测试commit/验收/回退，仅恢复:79不撤已交付:75。旧273/157/230与formal012及原raw/hash不可变，本材料修正不宣测试已运行或Phase GREEN。九外置冻结源码与核心字面保护不变。

外置已冻结DO NOT TOUCH：T/quality/tests/skill-modernization-classification.test.mjs（e73e867e50c308c418890a0f2543a7b477b5831586515fcfccc521f45ff18296）；historical-attribution.test.mjs（264b30fb82677f9dd1b437b221cd3a349cd8651a65edde8bb6fa7931cccea84f）；pr-close.test.mjs（6d57582f7bf210e261977d0ea893241793e636ed6e610b65610d38a68ea08b78）；catalog.test.mjs（a57174233faeb5612d42029bcf0522a6e8e98d0e330d68788c0528c3797d7f4d）。四名前均加skill-modernization-，只有这些actual路径，不造副本；owner a46，consumer各对应Phase与独立复验。facts010/012提供完整command/raw/hash，修改scorer先独立test change request。

### 全局并行、成本和回退

每Task并发2：实施owner唯一写其文件；独立测试只读产物写自身T原件。各Task输入/写集不相交可2–5而共享文件串行；P3 build-code与P8 verify到P9仅010允许的原持笔者回退条款增量。执行成本按D-067只计已覆盖输出重评与新增未覆盖行为的定向场景，不拿旧4N/12/100+估计当必须执行次数。耗时窗口实际，适用真人問答質量源-backed；无人not_observed不当0、不作所有case重演阻塞，具体阈值无源不发明。回退只本Task实际diff，保其它交付/失败原件；真实PR残留先inspect不自动删/close，当前作者不执行Git。

## Appendix A — 验收判据（唯一权威）

### AC-SM-001

关联FR-SM-003；原AC-001。
验证：PR描述使用Summary最小视图、Evidence真实before/after、Merge Danger Door与Blast Radius，引用AC002唯一gh原件。
通过：支持环境真实head/base/URL或不支持的真实原因与描述齐备。
失败：只有commit无描述、伪造URL、用stub冒GH效果。
证据：单份真实gh输出/读回或错误，与AC002共享原ref；声明预期类型，非当前执行结论。

### AC-SM-002

关联FR-SM-003；原AC-002。
验证：既有close五代码面与三冻结测试变更审查；任务head push与pr早于merge、未授权负例、旧计划兼容。
通过：支持时commit→push-task→pr→merge→archive→push→cleanup；未授权零副作用；旧五步/规划四步保持可读；真实gh一次或保失败。
失败：只扩白名单/不推head/先merge/绕授权/未跑声明测试。
证据：五面diff、三测试change request、定向close/contract/integration实际输出与AC001共享gh原件；声明预期类型，非当前执行结论。

### AC-SM-003

关联FR-SM-011；原AC-003。
验证：真实复盘候选经用户选择后分检查/判断/无操作；检查实跑真实历史错误负例。
通过：机械重复先architecture/types/test检查，判断项只留未解，解决由人prune，每任务可更新。
失败：机械规则只prose、历史错仍通过、已解项保留、无源候选。
证据：真实候选选择、历史错误RED/当前GREEN、Improvements内容；声明预期类型，非当前执行结论。

### AC-SM-004

关联FR-SM-008；原AC-004。
验证：每Phase OCR与same_source_degraded补充轴各原件、当前事实记录和失败/取消。
通过：同源不计异源quorum，分轴并排不合并排名，不自写镜像；已装OCR失败不fallback漂白。
失败：伪身份/伪quorum/镜像/丢失败/空findings冒完成。
证据：两轴原件ref、真实review_origin、现evidence引用与provider失败事实；声明预期类型，非当前执行结论。

### AC-SM-005

关联FR-SM-010；原AC-005。
验证：首次架构机会评估与第二次触发引用、优化后定向复验。
通过：同任务最多一次，人读已评估事实；用户选机会才设计优化，改后重验；重复只引用旧报告。
失败：机器拦截新字段、重复评估、先接口未选、改后不验。
证据：单份评估原件/重复引用事实/受影响复验；声明预期类型，非当前执行结论。

### AC-SM-006

关联FR-SM-013,FR-SM-014；原AC-006。
验证：baseline原manifest44完整8字段按序与catalog legacy_registration_history对照，当前接线checker故意不一致负例；38登记清零后删。
通过：catalog历史归属/provenance唯一，当前local_changes不覆盖、deps只实际调用；迁移/0悬空后删除。
失败：丢owner/出处/空owner、改原local_changes、双写或未迁删除、checker对故意错误仍过。
证据：catalog真实oracleRED/GREEN、独立gold原ref、具名consumer扫描命令计数命中、checker真实正反输出；声明预期类型，非当前执行结论。

### AC-SM-007

关联FR-SM-014；原AC-007。
验证：登记/文档先清死stage，3runtime/3schema保历史枚举+说明，computeQualityTaxProjection与createSimpleReviewPacket现有拒绝负例。
通过：历史upstream_omission:build-spec仍attributed，退役身份拒当前review；最终enum删除延期一个真实任务观察周期。
失败：历史静默unknown、哨兵删除、非法JSON注释、宣称历史值全清。
证据：historical三例P2P与负例、扫描、延期owner和一周期关闭条件；声明预期类型，非当前执行结论。

### AC-SM-008

关联FR-SM-013,FR-SM-001；原AC-008与原AC-017合并（D053）。
验证：原AC008/017合并；全仓旧66898f6当前面扫描、引用技能内部出处/固定commit/偏离/本地差异/更新入口。
通过：固定b0618bc436ad893b3c5e84e55fba86586d34a404；旧pr/retro/implement不存在事实保存；旧grill不升级结论重写；旧值仅逐项明确历史例外。
失败：只三登记换值、残留现行旧值、来源搬运丢失、自相矛盾旧结论。
证据：两commit目录对照原ref、旧值扫描、逐技能来源段；合并不丢原17条件；声明预期类型，非当前执行结论。

### AC-SM-009

关联FR-SM-004；原AC-009。
验证：单/多context懒建、ADR三判据、格式保全、当前rename读者与五ADR批注读回。
通过：grill唯一格式owner，本地Relationships/Example dialogue/Flagged ambiguities保，补Rules/Single vs multi；GLOSSARY唯一；实命中5ADR文首批注，正文行号不动。
失败：双术语、无目标项目载体、reader静默漏名、ADR正文重写或凑无关第六。
证据：classification真实RED/GREEN、verify-structure输出、各静默reader核、五ADR正文读回及6vs5差异；声明预期类型，非当前执行结论。

### AC-SM-010

关联FR-SM-005,FR-SM-014；原AC-010。
验证：薄技能职责/调用点/附件闭包前后扫描与实际consumer。
通过：spec-tasks索引归spec-plan、spec-research轻问题归deep-research；先迁调用0悬空才删除。
失败：只删文件、索引取代Phase正文、轻研究强制深报告、悬空引用。
证据：前后命令计数命中、真实deps/包消费者定向contract；声明预期类型，非当前执行结论。

### AC-SM-011

关联FR-SM-005,FR-SM-009,FR-SM-014；原AC-011。
验证：三技能真实路由/触发条件及debate消费者扫描/退役。
通过：anysearch、architect、diagnosing真实引用+contract；下一任务真触发待验具名owner，未运行不声称触发。
失败：只一行声明无触发、无扫描删除、新active死技能、把下一任务待验说完成。
证据：引用计数与contract；下一真实任务触发原件ref（D053）；声明预期类型，非当前执行结论。

### AC-SM-012

关联FR-SM-012,FR-SM-015；原AC-012。
验证：13既有失败ID集合/本次新失败差集、结构单跑、affected contract/close/integration准确范围。
通过：verify-structure显式PASS，check既有exit1且零新增按D065，不称全绿；环境失败与目标RED分开。
失败：未跑称绿、exit0含fail当成功、旧失败消音或当新RED、全量替代针对性。
证据：原baseline与010 freeze十三full_name、命令cwd/exit/signal/raw/runner版本；声明预期类型，非当前执行结论。

### AC-SM-013

关联FR-SM-002,FR-SM-007；原AC-013。
验证：SCN-007方向map五段及fog未知边/后果/真实HITL读回，当前decision-log单一载体且Plan dont do；再核实际Phase模板与完整Task卡的纵切/blocking/tracer/prefactor/expand-contract/TDD。
通过：方向五段map/fog只现日志，未知不预切ticket且HITL有真实人答；P<n>文件与纯index保持，全局Task递增；seam在现计划确认展示，独立真相期望值，禁止horizontal，refactor归review。
失败：方向map另权威/fog被偷偷实施或HITL自答；换tickets形态、只措辞无方法、期望抄实现、索引代程序。
证据：方向实际map/fog与人答原ref、真实模板/Phase读回与material reader定向结果，计划展示seam；声明预期类型，非当前执行结论。

### AC-SM-014

关联FR-SM-008；原AC-014。
验证：七文本D026真实答复、独立纯文本批diff/commit/验收/回退与直接consumer。
通过：回退仅缺失/低版本目标architect；独立于技能重写与PR实现；两workflow例外仅串行回退条款。
失败：实施者静默修宪、窗口隐去、PR代码混修宪、泛owner例外。
证据：七核心原diff与答复ref、独立回退、consumer一致性与冻结test change request；声明预期类型，非当前执行结论。

### AC-SM-015

关联FR-SM-001,FR-SM-006；原AC-015。
验证：WR001 Q01..12，逐句no-op/否定外禁区转正/引领词；逐段对照+核心步骤保全+真实跑。
通过：每原步骤约束落点明确、字面禁区逐字保、单规范层；字符句长预算有真实依据，行数只观察。
失败：语义丢失、仅压行数、只删不补、改冻否定、发明阈值刷绿。
证据：逐份对照/保全、字面实值、真实A/B与噪声；具体预算unknown影响项保持incomplete；声明预期类型，非当前执行结论。

### AC-SM-016

关联FR-SM-006,FR-SM-007,FR-SM-008；原AC-016。
验证：review双轴/Fowler12、spec-plan blocked_by/tracer、spec-prd User Stories前后consumer。
通过：三缺失规则补回正文且真实可消费，原核心不丢。
失败：登记自称已吸收而正文/consumer缺失。
证据：原固定上游12值、前后定位/计数、当前consumer contract；声明预期类型，非当前执行结论。

### AC-SM-018

关联FR-SM-015；原AC-018。
验证：按D-067核source_delta分型与grader正确/已知错误/未观测校准；A1 diagnosing现真实输出重评，A3三正文按对应核心保全/新增行为case先验后用。
通过：行为改动具源结果支持目标且无核心约束丢失；表达整理每条核心保全、有限已覆盖场景无已证回归，可不分赢家。四项客观量按实际case范围记录，未观测明示且不当通过，耗时差异不自动改善；新行为无覆盖须补targetedcase后再用，B组仍显式重读。
失败：未校准grader/预设结论、核心约束丢失、已证行为回归/捏造证据、把未观测写已测、用旧未修PR报红或相似字节作方法效果，盲评代验收；相似输出本身非失败。
证据：具源change-type与逐核心preservation、pre-usegrader校准正常/已知错误/未观测实际原件、已有A/B单输出及必要新增场景；四项按适用namespace记录，无人問答not_observed不是0或全方法阻塞；仅所支持范围作结论，声明预期类型非当前实际通过。

## 风险、未决与交接

RISK001/OPEN001影响PFACT005、FR001/015、AC015/018：D-067已由真实用户接受：先按source_delta分型，行为改动测source-defined outcome与硬约束，表达整理做逐条核心保全＋有限无回归，不强求赢家。grader必须先用具源正确／已知错误／未观测三类对照校准，不预设结论，不以相似/unknown自动fail。仅新增且未覆盖行为追加targeted场景；当前诊断主要表达整理，现八fresh原件可重评而不新trial。不得称统计等价/改善。无人case的真人问答not_observed不填0、不普遍阻塞，其真实行为变化另测。新评分源码/合同由11d7c0d3，独立95c7按source核/具体change request批准后使用，独立批准与当前finite重评分原件已产，实际支持范围见末节，不以futureowner自证完成；旧九freeze及旧099历史报错完整保留。 OPEN002：P2/T002实际前置test准备owner=a46，consistency/supplemental records九code测试已冻结，三方法G2有限场景原件已产见末节；其未来productionCLI/rename/D009/provider调用仍未实施，不能以P2P/G2作targetGREEN，未来实现质量仍待相应场景，不把这些未来能力缺口再当当前评分合同缺失；checker窄seam如工程定义，不把localcontrols作为它的RED，ownerB4测试设计，闭合=实际正常/负例同命令；local catalog四负控不是它。OPEN003：AC011下一任务真触发与历史enum一周期延期，ownerB4/P10；下任务真实原件才关闭。OPEN004：第六ADR当前未命中，ownerP9，5已read不能改无关第六凑数。RISK002 PR授权/网络失败、取消及重复调用，ownerP10；inspect/readback+头基查重，未知不清理远端。

已有目标RED三项：catalog缺history数组exit1/4本地controls pass；classification未知GLOSSARY exit1/2controls pass；PR prepare忽略pr旧五步exit1/未授权零外发control pass。historical三例exit0为already-pass保护而非RED。来源[010 freeze](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-010-sm-oracle-freeze-facts.json)与[012 catalog freeze](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-012-sm-catalog-freeze-facts.json)；各Phase留精确同命令。十三旧失败具名集合齐，不用数字抵消新失败。check既有11lint文件exit1，结构另跑，原件不改写。

宪法22条作者自检是设计对照非质量裁决：F1/2复用窄owner；F3/6当前材料/单份外置事实；F4/Q3独立来源裁决；F5/8/10/11无新平台/gate；F7现计划展示后真答，当前未授权实施；F9/Q1/2未知不假绿；S1/2/3/6吸收适用外部固定来源；S4/5真实计量与独立上下文；S7/8现五阶段/可搬运方法。结构分析、一次合并异源review及发现处置、实际计划展示已执行，003已取得真实完整计划接受；主会话据该确认收口build-plan并发布handoff，暂不进入实施，不把确认改写为全部质量GREEN。

### 宪法执行边界的具体承接

F4：已认证actionable+major|blocking发现优先回原Task实施者同会话修，不用“请用户接受”替修复，不新增中间确认；确实范围内无法修/验，保incomplete、具名owner与具体影响，继续安全部分，只在最终close展示真实未修风险，未有该finding绑定真选择不得accepted_risk。F7：方向/实际计划选择后，已授权本task进入build-code/verify-code持续覆盖实施/验证/审查/修复与必要commit/push/merge；阶段切换/HEAD变化/新会话不重问日常技术或本地提交，Git每次按真来源范围/branch/HEAD record/consume；仅最终close归档/删除/清理统一一次实际范围确认，当前规划授权不预填这项。

F10：新一致性checker仅替代旧manifest当前对账并检查未来改接线后的遗漏；actual当前catalog39和五stageclosure一致，44历史不是现有漂移，不能编损失来证明工具必要，复用run-checks owner，无数据库/后台/CI执行平台；维护成本是一脚本与一个正负夹具，保单次定向手跑可替代，若漂移维护负担高于具名损失或consumer消失，经原维护owner收缩/删除，不以可机器校验自证收益。PR窄扩复用close事务，不再建PR账本。S3：每后续迭代先核内部固定来源入口是否上游更新与真实更优候选，实际源差异与本地偏离写同技能来源段/唯一catalog登记，人评选择后更新；不自动追HEAD、不另update daemon，也不把本轮固定commit当永久免查。

S8：可搬运方法显式输入材料内容/允许写目标/宿主问答或子代理能力，路径与命令由真实项目环境传入，不把本任务W/T/账号硬编码进生产技能；缺能力写unavailable或同内容大白话卡降级，不伪工具/回复。内容方法返回正文/发现/原ref，宿主负责现safe-write/授权事实；移出WorkflowHub仍可读方法执行，不依赖隐藏cohort writer/旧object graph。以上是实施约束，不是本作者质量判定。

### 只读历史consumer反证（本轮direct read）

tests/contract/card06-migration-ledger.test.mjs:14只读specs/archive/.../attachments/migration-table.md，:229–236筛选SURVIVOR才检查当前path存在；actual历史表:821 CONTEXT.md处置NARROW不是SURVIVOR。因此不会为CONTEXT生成当前exists断言，不修改历史table/该test或造第三写集；原review误报保留并用此出处处置。P5/T008 simplicity当前来源:108需改GLOSSARY，归P5单owner，纳AC009静默核。

### 新预写测试实际冻结与执行限制

[021 freeze](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-021-sm-review-repair-oracle-freeze.json)sha25643d627fd3b92055473b83c320f96d41493e3105ebb2398d69540a8ca29ac4fb1由a46已执行three existingseam each once，futureT002是注册/消费这些输入不是已做生产。

- DO NOT TOUCH `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-thin-merge.test.mjs` sha256 685a44b95007f707229c977380f4aecf1dd7372b6388f5932f1dc242fcf9c7a4；actual raw `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-018-sm-thin-merge-red.txt` sha256 ed48f63f503de8b0a6040d77e27f68efbddf6395b9d64f3c08f118a3b958cd8a；same RED/GREEN `WORKFLOWHUB_WORKTREE=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-skill-modernization-20261008 node --test --test-reporter=tap /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-thin-merge.test.mjs`。exit1，2targetfail+1controlpass；limit=does not prove generated index pointer correctness, all original template byte preservation, downstream stage execution, missing Markdown static-deps detection, new consistency checker, or entire resolver package chain。

- DO NOT TOUCH `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-catalog-current.test.mjs` sha256 b133072fafdf348775fe8786fd2ca7ea5b1ce247ee7c8403d8613dd986142c05；actual raw `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-019-sm-catalog-current-red.txt` sha256 ed129a147c0bf09398f4f563f4488230ec8903b2776f30c58fadb8da86552349；same RED/GREEN `WORKFLOWHUB_WORKTREE=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-skill-modernization-20261008 node --test --test-reporter=tap /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-catalog-current.test.mjs`。exit1，2targetfail+1controlpass；limit=does not rescore/history-rewrite original44, scan every upstream subentry/global oldcommit residue, or prove live dispatch/inconsistency checker behavior。

- DO NOT TOUCH `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-pr-default-body.test.mjs` sha256 bcc102c5932d16fb70d55d7487329ff18864ed9bc2c404ddde750e9476df0dc4；actual raw `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-020-sm-pr-default-red.txt` sha256 da59c802df9dfe308a7643281651ceba43093edb2223849b1fc72d299fe528da；same RED/GREEN `WORKFLOWHUB_WORKTREE=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-skill-modernization-20261008 node --test --test-reporter=tap /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-pr-default-body.test.mjs`。exit1，2targetfail+1controlpass；limit=local Git capability stubs only, no online support/GitHub publication; body heading/BeforeAfter/risk formatting assertions lie after missing-title failure and have not executed yet; they do not by themselves prove actual evidence semantics or minimum summary view; no successful legacy full Git close/retry coverage。

原3+新3是6目标RED scope不是6失败assert，historical3P2P另计；九code原件与三方法有限G2实际已齐，不再称全缺源码；完整literal与AB中性四trial见补缺节。futureproduction/全部实现验收仍待对应实施；当前比较解释以D066/D067及实际有限V3结果为准，计划已003接受，不能报告产品绝对无问题或全部验收GREEN。

### 补缺原件与当前／下游验收分界

现规划阶段已取得：[2026-10-08-028-sm-focused-preservation-freeze.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-028-sm-focused-preservation-freeze.json) sha256 bea65734821399cf49e42e3dfb4ebff5b8a2d4bd19501adf58a7fea5933a4eab，两new preservation tests各3pass0，不是RED；原7+2为九code冻结sources不改。当前catalog39与五阶段name/path一致，44是独立历史不是currentdrift分母，不能仅39≠44造RED。

| code P2P scope | 精确source / hash | actualraw / hash | same command / limit |
| --- | --- | --- | --- |
| consistency | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-consistency.test.mjs` sha256 cd9f7de410dbfe6568424382133d46af4fc0a5930d0868259fabaa5649c7ec7b | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-025-sm-consistency-preservation.txt` sha256 d826864d1a6525202f5960d9790eabb98175a0099daf8a1361b34a15d02e5fd5 | `WORKFLOWHUB_WORKTREE=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-skill-modernization-20261008 node --test --test-reporter=tap /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-consistency.test.mjs`；normal assertion is test-owner check over real existing readers; NOT new check-skill-consistency CLI execution or its deliberate catalog/deps mismatch negative; does not inspect wh-review manifest/plan/current registry used_by stage equivalence; historical44 not active |
| supplemental-review | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-supplemental-review.test.mjs` sha256 e8631a74c43241b02d0be6191131a793a672fd77ef1dbda061e09f954cf5b88e | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-026-sm-supplemental-review-preservation.txt` sha256 1e1fc626a1e730cfed8cd5ef0f7031b2e16f28253f2e875ddc45a7d0f869dafa | `WORKFLOWHUB_WORKTREE=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-skill-modernization-20261008 node --test --test-reporter=tap /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-supplemental-review.test.mjs`；no method/provider supplemental execution or eachPhase trigger proved; caller can label conducted plus arbitrary namedref accepted by store: no provenance/quorum verifier; normal-negative record preservation is P2P, NOT new behavior RED |

方法原件由11d7c0d3协调，21ab3394独立有限执行；expectedgold可见非盲评，061索引为原件引用不复制raw。

| 方法 | 精确test / hash | 实际回放／应用原件 | 限界 |
| --- | --- | --- | --- |
| domain | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-domain.test.mjs` sha256 fd839b4fd447b2a3bbb7da386b7e2bfc91f1f36579691cc8ca02759d96bdd865 | [2026-10-08-054-sm-domain-method-replay.txt](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-054-sm-domain-method-replay.txt) / [2026-10-08-043-sm-domain-method-output.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-043-sm-domain-method-output.json) | 三P2P/有限negative，currentCONTEXT不是未来rename |
| diagnose | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-diagnose.test.mjs` sha256 bfe02b8b103e447860d22c6565bd10641748b355d23009b5292e8d3f888b6344 | [2026-10-08-040-sm-diagnose-method-replay.txt](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-040-sm-diagnose-method-replay.txt) / [2026-10-08-061-sm-method-owner-artifact-index.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-061-sm-method-owner-artifact-index.json) | 三reportP2P；实际target仍RED，dynamicminimization未验 |
| reflection | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-reflection.test.mjs` sha256 23c3ecbe202f7a0ea9c3a40dddc31673fa3f612a52529a180c72d5253e25f054 | [2026-10-08-055-sm-reflection-method-replay.txt](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-055-sm-reflection-method-replay.txt) / [2026-10-08-044-sm-reflection-method-output.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-044-sm-reflection-method-output.json) | 三P2P，D004未来用户选择/check不是已完成 |

supplemental流程另 [2026-10-08-045-supplemental-method-case.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-045-supplemental-method-case.json)与[2026-10-08-059-supplemental-method-negative-facts.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-059-supplemental-method-negative-facts.json)：normal=true，缺case/quorumreversal/newreviewfinite负例拒；provider未调、unavailable/cancelled只输入scenario不是真实IO事件。028 taskstore虽拒非法空ref/no reason，却接受callerconducted+任意namedref，不能替审查来源身份/异源quorum认证。P3/T004方法触发与P8/T016deps/steps仍待实施，每Phase真实外部调用以后逐原件，当前方法case不冒已执行审查。

完整literal [skill-modernization-protected-literals.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-protected-literals.json) shaca99302f432968fb5adc97c62fd1c24e213600664b6e529c9f8d507462cd110c，039 replay0/ownedM3negative1、049candidatebinding附录、052actualvector139+21=160（非旧171/170）、独立evidence040有限范围已核。579raw/994expanded/719dynamic分母区分，candidateallmatchingdeclarations不是全lexicalresolved。21机制11present10missing与8staticexpectfail为原baseline，无生产修改/非新RED。所有future正文编辑以逐source原guard/正负表、对应实际consumer before/after失败差集追踪，不能缩计数/删assert/弱gold将baseline变绿；方法WR核心语义独立对照。

历史执行：V1 056及中性V2 047/058/091/092/099原件保留；098预设status必败已052源更正，报错不作data-derived methodfailure。093历史计量选项由D066/D067覆盖，当前不采用用量、不普遍要求无人case真人演练。041独立具体method消费、100domainpendinglocator纠正保持原件，不改九freeze。

### 当前已接受比较合同

[真实接受059](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-08-059-build-plan-comparison-amendment-accepted.json) sha256 971d4a19493e8aa97214e4894075386ea98bc2cd8c7fe1eaaaa5cdd1065602c3消费[原提案058](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-08-058-build-plan-method-comparison-proposal.json)；D-067已由真实用户接受：先按source_delta分型，行为改动测source-defined outcome与硬约束，表达整理做逐条核心保全＋有限无回归，不强求赢家。grader必须先用具源正确／已知错误／未观测三类对照校准，不预设结论，不以相似/unknown自动fail。仅新增且未覆盖行为追加targeted场景；当前诊断主要表达整理，现八fresh原件可重评而不新trial。不得称统计等价/改善。无人case的真人问答not_observed不填0、不普遍阻塞，其真实行为变化另测。新评分源码/合同由11d7c0d3，独立95c7按source核/具体change request批准后使用，独立批准与当前finite重评分原件已产，实际支持范围见末节，不以futureowner自证完成；旧九freeze及旧099历史报错完整保留。

本阶段比较合同修正、独立批准、有限校准与现输出重评已实际产出；仅声明其有限准备范围，不预填未来实现pass。行为新增producer/双轴触发等仍归既定P3/P8/P10对应真实场景，当前表达整理结果不冒它们实施GREEN。当前完整计划已由用户真实接受并要求收口build-plan，来源[003正式确认](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/human-confirmations/2026-10-08-003-build-plan-accepted.json)，原话“确认当前完整计划，收口 build-plan，暂不进入实施”。此为003收口历史时点：当时仅同步确认时态，build-code/verify-code均not-started，生产/Git暂不执行；后续072已恢复build-code，当前定位与完成度读外置facts.jsonl和实际执行原件，不回写原暂停或有限V3证据；计划接受不是全部产品验收GREEN，一次正式review原partial及历史失败/有限unknown原件不改。

### V3当前外置合同写集补充

109实际具体请求仅三精确P2路径，source/test/privatehelper均writer11d7c0d3、独立95c7核source，create-only不覆旧source；唯一consumer=P2/T003新grader校准/现八输出重评，P4只消费原则及自身真实差异case，不以当前诊断单case涵盖未来三正文behavior。精确正常/错误/未观测与源码目的归P2 Task程序；spec Appendix A仍唯一产品验收权威。正式amend-comparison原件已列D067，不新确认节点。当前独立approval及actualresultref已产，具名有限校准/表达范围有实际支持，该V3结果本身不代表完整计划接受或生产完成；完整计划接受另由真实003提供，“生产仍未开始”仅003收口历史时点；后续072已恢复build-code，当前定位与完成度读外置facts.jsonl和实际执行原件，该有限V3不代表当前实施完成；gate命令为 `WORKFLOWHUB_WORKTREE=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-skill-modernization-20261008 node --test --test-reporter=tap /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-comparison-v3.test.mjs`，仅现taskexternal，不生产platform。

### V3实际完成与当前阶段边界

独立95c7已具体批准109，21A核心语义→B映射与四N因果判断由独立coremap/consumerfacts供给，非实现者判自己的gold。新V3三源码create-only后首一次111 actualexit0/4tests pass，28校准匹配（4真实positive、20knownbad、4诚实unknown）。112从actualsource/result派生presentation_cleanup，candidate_adoption_ready=true，仅此有限表达整理范围：21核心文本保全、四case R1因果/R3恢复/R5目标证据支持，R2直接读范围有限、R4实际最小化未观测、R6全副作用/route/human保持限界。删除M07/改lost则不eligible，R1观测错误则wrong且不eligible，behavior_change没有新效果case返回need_case，不自动pass。无新methodtrial、无winner/统计等价/Bbetter/faster/全WR001或productionGREEN。

- [2026-10-09-sm-v3-independent-sourcegold-coremap.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-09-sm-v3-independent-sourcegold-coremap.json) sha256 59753c348584fef70ccf25cc5c84c8dc6af14045cc477394044d0850e4f0a81c。
- [2026-10-09-sm-v3-change-request-independent-approval.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-09-sm-v3-change-request-independent-approval.json) sha256 480a48b004c80b6fe71dfa3118aec92c0ccad4069470f2aec71c40e29e9aed64。
- [2026-10-09-sm-v3-approved-gold-consumer-facts.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/2026-10-09-sm-v3-approved-gold-consumer-facts.json) sha256 fda43ca125344bde02ca023837b50d7acbed4d0de898cd25f67dc26990be0f02。
- [2026-10-08-112-sm-comparison-v3-actual-result.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-112-sm-comparison-v3-actual-result.json) sha256 1ed5e801eb3c9262990292dde4a7bbbf0bc74716e9913abe2e93905e282ef3ca。
- [2026-10-08-113-sm-comparison-v3-freeze-receipt.json](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-113-sm-comparison-v3-freeze-receipt.json) sha256 2c88adfefceaf5d8a8313f8b60a9c37c0540dcb3cc29658f650dbaa183483871。
- actualraw [2026-10-08-111-sm-comparison-v3-first-target.txt](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/2026-10-08-111-sm-comparison-v3-first-target.txt) sha256 87678b6cba34921e9c792fbe8bf42d3066ea0ca60b4f5385822dcbd8b0098dcd；原raw只引用不复制。
- DO NOT TOUCH `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-comparison-v3.mjs` sha256 2e0d7b396d425e2e338f35d87e159b0859ba02292ab7fe3746e89ffe8a62c05c；修改先具体独立请求，不覆旧source。
- DO NOT TOUCH `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-comparison-v3.test.mjs` sha256 9582830c35e26b51582628dcf6faff71382ac3c620b21756f6f0ed0829c4ff36；修改先具体独立请求，不覆旧source。
- DO NOT TOUCH `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/tests/skill-modernization-comparison-contract-v3.json` sha256 ef8116d47509a4b6a5042072a76865140860fb78e70e0965e2455307d18bc39d；修改先具体独立请求，不覆旧source。

当前规划输入、源保全/校准与有限case执行的补缺已具原件；当前完整计划已由用户真实接受并要求收口build-plan，来源[003正式确认](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-skill-modernization-20261008/quality/evidence/human-confirmations/2026-10-08-003-build-plan-accepted.json)，原话“确认当前完整计划，收口 build-plan，暂不进入实施”。此为003收口历史时点：当时仅同步确认时态，build-code/verify-code均not-started，生产/Git暂不执行；后续072已恢复build-code，当前定位与完成度读外置facts.jsonl和实际执行原件，不回写原暂停或有限V3证据；计划接受不是全部产品验收GREEN，一次正式review原partial及历史失败/有限unknown原件不改。本任务21Task/10Phase既定scope不扩，futureA1/A3/GH/完整Grill/真实取消等按原Task下游适用验证，不借future尚未实施把本阶段无限延长。D066用量完全取消，未观测不捏0或冒已测。一次正式异源review原partial和19处置仍原件保留，不二次fullreview/不自审通过。
