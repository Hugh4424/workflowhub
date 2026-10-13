# 功能规格：让 WorkflowHub 已声明的工作被执行和看见

读者：实施者、独立审查者、用户与下一任务的执行者。
读完要能：知道要改哪处、为什么改、怎样反证失败，且分清本地证据与用户真实任务的验收。

- 状态：设计与分工已由用户确认，build-plan 收口交接中；未实施、不自判质量。真实确认：[005-build-plan-approved](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-card05-stage-defect-audit-20261012/quality/evidence/human-confirmations/2026-10-12-005-build-plan-approved.json>)；答复为“确认当前方案，保存事实和交接后停下（推荐）”。仅确认设计，不授权本轮生产实施或 Git 动作。
- 当前来源：[decision-log](decision-log.md) 是方向与范围权威；本规格 Appendix A 是验收正文唯一权威。pre/history 只读，不写 plan.md/tasks.md。
- 认证工作区：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-card05-stage-defect-audit-20261012`；分支 `task/workflowhub/workflowhub-card05-stage-defect-audit-20261012`；读取基线 `b07afcff44e598096950d118a90309282912162b`；日期 2026-10-12。
- 外置任务根：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-card05-stage-defect-audit-20261012`。下文 `TASK/` 指此根，不按 worktree cwd 解析。
- source-locked 例外：源 AC-C05AUD-01…23 保原号，不静默改成三位或新 ADR。源决定使用 N1–N12、N14–N20，不伪造 ADR 来源；新 FR 使用 FR-C05AUD-NNN。

## 速读卡

用户已付出几轮修复成本，下一次真实使用仍然漏交东西。本次不再靠增加一层流程解决：沿现有方法、执行回执、任务事实和检查器把漏交呈现出来。测试按项目自己声明的面设计；执行者真跑；末 Phase 汇聚真实证据；授权与收尾保旧记录。19个实施模块之外，N13取消编号占位，全部保留其取消理由。用户另跑真实任务才决定是否真的修好了。

## 材料导航

本节是可再生导航，不承载进度。先读「需求解释」与「场景」看用户结果；读「实现设计」看写集、接缝和依赖；执行时从 [Phase 索引](phases/index.md) 打开当前完整 Task 卡；核结论只用 Appendix A 与唯一原始执行件；遇到未知读「风险、未决与交接」。

## 来源与决策映射

本轮真实spec-clarify四选择已实读 `TASK/quality/evidence/2026-10-12-005-build-plan-clarifications.md:6–9`：整个build-code共用一份commit授权；次数/HEAD沿既有consumed、授权原件immutable；允许stage-runtime与stage-content-contracts仅读具名Phase实际authority最小修正；evidence保整数shape，未跑原因由source/原回执/人读表承接。这四项替代相冲突的旧措辞，不反写decision，不等于最终计划确认。

直接实读 decision-log 1–898，包含 R-001…R-018 的索引及六份手打原话全文、U-001…U-018 最小索引、四工作包、19 块、48 行写集、23 条 AC、6 条 open OI。交接旧件自报 897 行，本次源已追加注册并把外置索引旧 14 改为 18；不反写交接或 decision-log。U-015/U-017 补存 g/h 不构成独立来源，U-018 无独立确认件；照实保留。

来源状态：R-001…004、007…009、012 的诊断和方向工作已在工作包①完成，只读承接，不再诊断整个宿主产物。R-005/006/010/011/013…018 及 U 的已选修复由下方追踪表承接。R-014「make-decision 末建 PR」未纳入本次 accepted 最小路径，UN-C-4 保为范围外缺口，不把合并前可见偷称提前建 PR。U-009③ 取消 N13；U-015 作废长度驱动；U-016② 外置整节需求变更；U-017 追加 N19/N20；U-018 只作现确认 provenance，不推定计划批准。

## 1. 需求解释：问题与紧迫性

真正需要改善的是交付过程，而非文本看起来更短。工具已经写了许多要求，执行者读到了却没有交；运行时又算出了校验结果，但审查没有看到。用户不得不在真实任务中发现遗漏，并承担反复补需求、补测试与补审查的成本。源 decision-log 的主因与被推翻判断仍归原文，本规格不重写其诊断证明。

修复沿三个实际接缝：计划把测试面和 oracle 交给实施者；实施者经已有 verify 保存真实执行；审查和交接消费同一份事实。缺项可以继续修，不能称为已完成。用现有 coverage 格、OPEN、quality/tests 和 facts.jsonl，不建第二套状态或许可证。

## 2. 背景、目标与范围

全局目标指向 [decision-log 范围与非目标](decision-log.md#范围与非目标)。四个工作包保持：①诊断只读；②修复根因；③N2跨阶段复核只产结论；④交付与用户后续验收。所有计划 hunk 必须有当前源，不照误判清单扩大其它 stage。

细化顺序逐字保留：`N2 → N1 → N6 → N5 → N4 → N8 → N9 → N10 → N11 → N12 → N14 → N15 → N3 → N7 → N16 → N17 → N18 → N19 → N20`。这是研究细化顺序，不是为相邻编号凭空增加 blocked_by；实际实施依赖生产者与输入、共享文件 owner。

## 3. 用户场景与状态覆盖

### SCN-001 — 从确认方向写出能执行的测试方案

材料作者读取本任务需求、项目类别与真实消费者，为每个行为 Task 写项目自己的测试面、理由、oracle 和命令；实施者不需猜工具仓库给的固定层级表。纯方法说明用可证伪 G-2 读回，不造 RED。浏览器可见改动才运行浏览器 QA。关联 AC10/12/15/16/19。

### SCN-002 — Phase 执行失败仍能继续安全修复

测试子代理明确提交字面命令给已有 verify。失败、取消、超时和没执行分别保原件；运行时把真实回执汇总到当前 stage evidence，游标更新不覆盖回 null；审查输入读到契约事实。未知没有变成准入门。关联 AC01/02/03/11/13。

### SCN-003 — 收尾之前用户看得到 PR

现 close 在同一次流中创建 PR、输出链接、再合并；不会等第二次答复。显式 until 只是已有执行入口的可选分段，默认仍继续。缺 gh 不捏 URL。取消或失败按既有重放读取已完成副作用，不盲目重发。关联 AC14。

### SCN-004 — 决策材料留下下游真正要读的内容

材料作者在模板现小节里逐 R/U 登记落点或缺口；四字段决策块只存一处，证明与过程只留原件指针。外置索引按任务库根解析，送审使用原件内容不落第二副本。当前 N/D/ADR 检查器只报事实，不管字数，不改变推进。关联 AC04/05/06/07/08/17/18/20/21/22/23。

### SCN-005 — 阶段末不掩盖没做复盘

主会话写本轮未执行及真实原因，incomplete 不冻结修复；用户实际选择的未解问题按所属项目回流，没有文件就不凭空创建宿主清单。关联 AC09。

默认态：以上正常路径。空态：无回执、空 findings、无类别声明保具体 unknown/unavailable，不推通过。错误态：SCN-002/003/004。加载态：CLI 文件读取，无新增 UI/loading 状态。取消态：保持 run-command signal/timeout 原件及 close cancelled records，未执行后续动作不补成功。边界态：scope、路径越界及旧记录兼容。权限态：只对项目已声明受保护面且授权未含处停，纯文档/注释/夹具越界按源继续并登记。竞态：每文件一个 Phase/Task writer，既有锁保护外置记录，review/test 与 writer 分开。恢复态：回原实施者局部恢复受损 hunk，保其它更改与失败原件。历史态：旧 task/报告/确认只读，不能改作当前质量。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：`verified`；证据：本次 read `tools/cli/stage-runtime.mjs:533-544,1090-1105`，已有 parse/verify 接缝；影响 FR001/002、AC01/02/03。
- **PFACT-002**：`verified`；证据：本次 read `runtime/task/task-store.mjs:79-88` 与 `git-authorize.mjs:539-615`；已有 evidence 槽与旧 HEAD 严格绑定；影响 FR001/004、AC01/13。
- **PFACT-003**：`verified`；证据：本次 read `core/task-close.mjs:603-814` 与 CLI:18-44；可选 cutoff 当前不存在，默认取消/回放已有；影响 FR005、AC14。
- **PFACT-004**：`verified`；证据：本次 read decision/template/方法原文，五字段与本任务四字段冲突、checker:43 只识别 ADR/D；影响 FR006/007、AC05/06/07/17/21/22/23。
- **PFACT-005**：`unknown`；owner 用户与下一真实任务执行者；影响所有 FR/AC；本任务内局部测试不能证明下一个真实任务漏交减少，关联 OPEN-USER、RISK-REAL。
- **PFACT-006**：`verified`；证据：运行时scout备忘48–54及本作者read stage-runtime672–745，现双root read-only接缝已定向12/12本来通过；影响 FR007、AC18/20；这不证明细节包已装配，覆盖限制关联OPEN-N18。
- **PFACT-007**：`verified`；证据：TASK/quality/evidence/2026-10-12-004-n2-cross-stage-criteria-conclusions.md:24–34/74–92；影响 FR006、AC04；C4判据U4，六类整体未确认，第一摘要保英文同义义务而有效窗口链仍缺，关联OPEN-N2。
- **PFACT-008**：`verified`；证据：TASK/quality/evidence/2026-10-12-003-build-plan-product-source-memo.md:§9 UI三来源适用性与审查包可用性（175–181）限定库存；影响FR003、AC10/11；未做全仓零消费者证明、不证明浏览器验收。

## 5. 功能需求

- **FR-C05AUD-001**：声明命令经已有 verify 执行并汇总到既有 evidence，不能覆盖回 null；来源 U-005④/U-009②/U-012①，N1；PFACT-001/002，SCN-002，AC01/02。
- **FR-C05AUD-002**：不完整方向审查仍返回有效 findings 时，错误消息与数量自洽，原 code/status 不变；来源 U-002、N1；PFACT-001，SCN-002，AC03。
- **FR-C05AUD-003**：计划→逐面执行→末 Phase→verify-code 穷尽只读核对形成同一测试标准链；来源 R-015/U-006/U-009①/U-010/U-012⑤、N8/9/10/17；PFACT-001/008，SCN-001/002，AC10/11/12/19。
- **FR-C05AUD-004**：完成实施/测试/审查修复才每 Phase 提交一次；只有显式 build-code scope 可同分支跨 HEAD 重用，旧记录严格绑定不变；来源 R-013/U-005①/U-012②③、N11；PFACT-002，SCN-002，AC13。
- **FR-C05AUD-005**：同次 close 先推 PR 链接再合并，until 可选且默认不等待；来源 R-014/U-011①、N12；PFACT-003，SCN-003，AC14。
- **FR-C05AUD-006**：读正确判据、按原项目类别核范围、关键方法在用前读取、覆盖格接住遗漏、保标题；来源 R-005/006/010/011/U-008/U-010③/U-011②③、N2/3/4/5/6/14/15；PFACT-004/007，SCN-001/004，AC04/05/06/07/08/15/16。
- **FR-C05AUD-007**：决策四字段与节级消费者定义唯一正文，外置原件可读，既有检查器识别当前编号只报事实；来源 R-018/U-015/016/017、N16/18/19/20；PFACT-004/006，SCN-004，AC17/18/20/21/22/23。
- **FR-C05AUD-008**：复盘未执行在交接可读，真实选择问题按归属回流；来源 R-005/U-003②/U-008②、N7；PFACT-004，SCN-005，AC09。

## 6. 模块划分

产品职责为可执行测试方案、可核对 Phase 工作、合并前可见交付、可消费决策与阶段交接。19 个源模块全部映射到这些结果，N13取消不成为 Task。N2研究表不改 stage 文本、不生成检查器。方法模块只教现有执行者，不创建新 orchestration 或进度机。

## 7. 关键实体

命令回执由 captureCommand 产生，含实际 argv/cwd/exit/output_ref；当前 stage evidence 只存 `{command, exit_code, failure_signature}` 的数组或 `{value:null, reason}`。未执行不能捏 integer exit，未跑原因按已确认source/原回执/人读表承接，不能在integer evidence伪造0。phase_progress 是单行当前游标，非历史序列或完成依据。grant 保不可变 operation/branch/head/confirmation_ref/created_at，新增可选 phase 的确切 scope 为build-code，来源见本轮真实澄清；消费事实复用既有 consumed 原件，不另建计次账本。close 使用同一 plan/confirmation/actions，不新状态。

## 8. 数据和生命周期

回执只保存一次于 quality/tests；汇总只引用其事实，不复制 raw。新校验只读当前材料；旧报告、授权与失败保持原字节。更新游标保现 stage evidence 不回落。read-only 外置件必须属于当前 task 根，原件缺失/不可读明确失败，不默用同名副本。取消/超时保部分事实，按原 output/ref 核副作用再恢复；不靠新 checkpoint 许可。

## 9. 兼容性预留

pre/history reader 与记录不改；无 phase grant 继续 HEAD 严格相等，retry 继续 idempotent；push/merge/pr 不使用宽松 build-code commit scope。close 不传 until 保现默认步骤、无 PR plan 保既有降级路径。N1不改写集筛选/缺写集抛错。N20继续 ADR/D 历史读法、增加当前 N形态，warnings/failures/exit 原 report-only 界限保留。N18优先消费已存在双root resolver，不放开通用 ArtifactDir 的 writer。

## 10. 明确不做与默认必须成立

继承源唯一非目标：不修 PaperBuilder card-05 八条产物缺陷；不加运行时推进门；不加检查器/账本/stage；不改历史材料；不在本任务自判修好。N13经 U-009③取消，不追空 findings 再审。safe-write 不改、N15新增函数/CLI/pre-hook方案作废；不修 hooks，不清退孤儿旧QA副本，不做未批准退役，不扩大 ADR0037 到用户对话。本轮不commit/push/merge/close，计划确认由主会话，生产实施须等实际计划选择。

simplicity：P0 有源故障；P1复用 verify/capture/appendRecord/locks/现 resolver；P2只改必要消息、事实投影、grant消费、close cutoff与方法句；没有 P3新长期机制。r27可选 steps 更改不认领，减少同义写作；N18不新建外置副本；最终验收只读现原件不增持久 ledger。

## 验收流程

来源→场景→FR→Appendix A→当前 Phase完整Task→原始输出→独立判断。Appendix A全部承诺面向用户下一个真实任务；本次内部契约测试只证明边界机制，不替它签字。末 Phase逐条列23条并保未触发/未执行/unknown；verify-code读各 Phase原件而不重跑全量。

## 测试标准

本任务自行声明测试面：方法消费/可证伪读回、运行时CLI事实与持久化、授权真实Git、close本地副作用与重放、检查器正负fixture、最终证据链。oracle取源原话与唯一Appendix A，不由实现推算期望。面和命令对应在Phase卡，不在AC复制命令。

UI三来源：raw_requirement=false（decision-log原话要求WorkflowHub方法与runtime修复；其中浏览器测试是下游方法义务，不要求本次页面）；project_inventory=false（产品scout备忘§9 UI三来源适用性与审查包可用性（175–181）：README定位方法工具包；package依赖ajv/js-yaml、devDeps markdownlint/vitest，根src/app/apps/pages/components/frontend/web/ui限定路径未见，move-map登记设计技能而非本项目页面；未做全仓零消费证明）；planned_or_changed_frontend_fact=false（当前48写集无前端页面/组件改动）。source_reasons保每项事实和未知，不按“非UI”标签覆盖。Design.md/Experience.md与真实原型本次未产生；包内须实际纳入上述库存正文作为context_map.project_inventory，三源均false且材料引用有效才省UI lens；缺包内源则写null，不能默认省略事实缺口。浏览器可见产物若被新增，交原owner先改范围，不私增前端Task。

本轮实际G2方法读回已执行：TASK/quality/tests/2026-10-12-007-build-plan-method-g2-readback.output与.json，exit0、原方法标题/WR001/index实读、空标题negative control被拒；已read原输出1–8。它只证明原方法可读与负控，不是未来方法改后GREEN、质量或用户效果。

G-2只作用于纯md且无新增运行行为，当前真实人读补验证原件TASK/quality/evidence/2026-10-12-026-g2-three-card-source-consumption.md已read1–58：T001/T008/T011源→卡→实际正例/历史缺失反例的顺序/动作/结果已观察，不造RED；抽样不声称18/18、新方法已修或未来业务GREEN。NEG-T011实际检索结果以上述原件限制为准，不从历史摘要猜零。

补验证source021当时的执行与冻结：当时真实确认是deferred（TASK/quality/evidence/human-confirmations/2026-10-12-003-build-plan-deferred.json），用户先要求补验证再确认，该原件不approved；当前设计确认见文首005真实原件，不反写当时答复或质量事实。024撤去host额外“须provider正面批准才改fixture”门；spec-plan53仅explicit CR/reason/旧证据/独立review。CR1/2/3已独立窄review019真实两route completed/findings[]、coverage undetermined，不是quality pass；host据actualAPI技术处置后原测试作者保旧bytes/path/hash唯一件再最小fixture纠错。CR4不在019，025独立结构fact+027技术处置只修view object/list array，不冒provider覆盖。

六冻结测试当前hash及真实原件：

- `tests/contract/card05-runtime-target-behavior.test.mjs` hash473dbbe9b114c3fc03a7a904c9a996e8b13866c3d0aba293102fc5d00e825d49；023-card05-cr1-runtime-target-rerun.output/.json exit1，12case=10目标RED/2现状P2P/0fixture；N1真实verify exit7/output已到达，当前evidence undefined是目标失败。
- `tests/contract/card05-phase-path-and-contract-facts.test.mjs` hash6e1a3ec4f7dc1d825cdedfc31b8f9733ddfd5689515649e73779451b8a241795；024-card05-cr2-cr3-phase-facts-rerun.output/.json exit1，8case=5目标RED/3P2P/0fixture；实际bundle.manifest是数组，CR2不读.files；contract_ok缺失目标已到达，其它facts后继断言尚未到达。
- `tests/contract/card05-provider-named-phase.test.mjs` hash094796c773a1d9b188cb86ad787c3d6badee4d9fd32b238503c553fb784396dc；013原件exit1，2namedEnglish/Chinese目标RED+9P2P，0fixture；全文/key/order后继同oracle待GREEN，不把throw消失当全部已核。
- `tests/contract/card05-planning-gap-behavior.test.mjs` hash949660d1383e47f3f12e64929fbd1af17ef40146f18aaa62c33eb968cd24b293；025-card05-cr4-planning-gap-rerun.output/.json exit1，11case=6目标RED/5P2P/0fixture：N11operation/stage/concurrency5RED，N12合法URL已可读后实际completed vs expectedpartial1RED，resume/replay后继尚未达；N18 lawful detail fullbytes/missing/crosstask3P2P是当前真实构包读回、不调用外部provider；N12preabort/noPRfallback2P2P是本地机制，不真远端PR或用户消息。

- `tests/contract/card05-close-cli-mechanism.test.mjs` hashb83f13c7d3737c0f2b86d9307b1f3a857ca6fe4b885134496f4a6e976f49aafe；026-card05-close-cli-mechanism-red.output/.json exit1，1命名ORACLE-N12-CLI-PR-CUTOFF目标RED/0P2P/0fixture：真实CLI拒--until=pr，exit1 stderr unknown close option vs expected0，失败在JSON.parse前；prepared ownedplan/nativegrant正常不是setup失败。partial/stopped_at/actualstdoutURL/main未merge/同planconfirmation无stdin回复续跑/1create后继合法预写未达，不test自写URL冒消息；真实远端/默认方法通知人仍futureB。

- `tests/contract/card05-decision-boundary-target.test.mjs` hash1f9171f8be6aa2f3f8cc92fed81ba851d50c139c7433ddc0dde6d64b02b3f06c；035-card05-decision-boundary-target-red.output/.json exit1，3目标RED/0P2P/0fixture：当前###N1/####N2/fence界定首recognized0 vs2、明确缺当前小节warning false、合法新ADR4已recognized1后误报旧五missing字段。父子字段/块截止、history别fileN99排除、field4count/缺风险不可fallback/旧ADR5正控后继都预写尚未达，不计P2P。Dlegacy、混族、unknown、duplicate/fifthparent、完整R/U引用仍具名未预写/未执行，不假完整parser覆盖；人读语义不自动评分。当前highest合法首RED可反证非未来实现GREEN，五原freeze恒。

上列raw/receipt均在TASK/quality/tests，完整路径按各basename解析，已read各失败签名及最小diff。当前31新复跑case=21目标RED10P2P0fixture，加原provider013 2RED9P2P、mapping016 1RED1P2P和CLI026 1RED0P2P，source021补验证时25RED20P2P/G2、0fixture；031完整决策设计后新035三个首RED使当前整体28RED20P2P/G2、0fixture；不与首次失败累计，不以数量证明23AC业务完成。旧N18双root12/12另列，重叠baseline不增独立覆盖。mapping016 actual ERR_ASSERTION/expected path当前已有有效RED，GREEN须独立同receipt argv，主vitest不自动跑。

独立事实读回TASK/quality/evidence/2026-10-12-029-changed-fixture-and-cli-fact-readback.md已read1–56：三旧新字节限定变换全串相等，标签/顺序/目标值不放宽，CR2实际returnedmanifest数组与磁盘object.files分层不混；该029原件当时25RED20P2P/G2、0fixture仅事实，最新035后28RED20P2P/G2、0fixture，不质量verdict，原016未审最新后置范围、019只窄CR1–3覆盖undetermined。原bytes唯一样件与最小diff都在TASK/quality/evidence/fixture-originals：runtime/phase两个`.pre-cr1-cr3`及对应`.cr1-cr3.diff`、gap`.pre-cr4`及`.cr4.diff`；旧hash18995f…/3dad3a…/00b683…仍可读，首次002/006/021失败原件不覆。旧017处置含“须明确接受”是已撤过强host解释，按024当前语义消费、不反写旧件。六测试消费者是本task当前预写RED与未来同oracleGREEN，owner原测试作者，冻结非新production能力；长期保留仍需现治理登记真实consumer/删除条件，不新增runtime writer或对象。

## 架构边界

spec全局设计与AC只在此；Phase为实现增量；index为纯指针；进度只在task facts。公共工具七类不变。测试与审查生产质量事实，不决定推进。N14只停未授权受保护处，不冻结其它安全工作。

## 实现设计（全局权威）

### 代码锚点

已直接read（2026-10-12）：stage-runtime `phaseReviewSourceProjection:533`、`prepareTaskBoundBuildCodeReviewBundle:558`、`writeBuildCodePhaseProgressCursor:821`、`stageRuntimeMain:1040`；git-authorize `record:539`、`consume:553`；task-close `executeClosePlan:603`；checker `checkDecisionLogChain:54`、`decisionSections:31`；runner `combinePairedResults` 返回载荷:1877-1882。方法/模板的真实节已读，引用前先重定位，行号漂移不凭记忆写旧签名。

### 接口与失败语义

N1：parse事实只读，不动539选择与540抛错；source对象本身不会传完整facts到provider（review-materials763只写captured_head/baseline_commit），本轮008用户真实选择已允许 `skills/wh-review/scripts/review-materials.mjs` 现组包函数:763把source只读facts保进既有source.json；不新增member种类/schema，不改变过滤。phase profile不允许context_map，不臆造；provider manifest实际文本须读到相同事实，不能只改source对象。测试子代理字面提交verify输入，不从Phase自动抓命令。capture-tests返回实际receipt后由现stage writer汇总，保游标/旧非空evidence；exit0用非空说明 `exit 0; no failing assertion`（工程设计建议，不声称源既有正式语义）；cancel/timeout无整数exit时保receipt原件与空value理由，不捏0。错误截断额度未核保unknown，owner实施者读真实包预算，不写死N。

N11：可选 `phase` 字段不得只放宽branch，不改旧HEAD路径；原授权不可变，消费原件记录每次真实HEAD/用途。2026-10-12真实澄清已选phase="build-code" exact equality，不是P编号；仅当前task同branch的commit，缺/错stage报AUTH_SCOPE；既有consumed原件留每次真实HEAD/次数，旧确认与授权不改。stage-runtime授权alias→CLI record链连通后再用；非build-code路径不传宽松参数。

N12：签名增until，在plan.steps外报AUTH_SCOPE；在已完成该action且原件写成后返回partial，cancel仍cancelled。默认不传cutoff，不等答复。CLI必须传until，否则仅改core无消费者。PR链接必须在merge前输出，不可等最终JSON才首次显示：现workflow同一执行流先execute until=pr→立即推返回URL→同plan/confirmation再次execute续跑，不等待回话；五步无pr退路不传until。临时partial只是内部函数切片，不是用户停等结果，不加callback/stream接口或持久状态。

N18：范围先定；消费current-task双root read-only现resolver和外置基准，拒绝遍历、跨task、symlink escape。ArtifactDir writer仍只允许认证specs根，读材料装配与写路径分离。N18只指make-decision/detail：本作者已read runtime/review/stage-materials.json:24–40及skills/wh-review/contracts/make-decision.md:13–19，approved_direction必须完整当前decision-log、context_map/evidence_map在detail合法。组包使用stage-runtime672–745顶层resolved refs到这些detail成员。N1单指build-code/phase：该profile72–95无context_map，使用已选source.json事实。两接缝分离，N18不依赖P3 phase context writer、不改allowlist、不把detail原文塞phase source，make-decision合同说明当前完整主文与具名条件原文；不递归抓Markdown，不授权放开ArtifactDir，不需要新生产路径。装配到provider真实完整性仍需目标证据，保OPEN-N18。

### 决策日志如何改得清楚且能直接交给下游

本段是N3/4/5/6/15/16/18/19/20的工程展开，未来方法/模板由现P5/T008–T010与P1/T001唯一owner实施；不是对本任务已签decision-log的重新精炼或历史修订。作者本轮已重新逐行read该源1–898与U外置1–73，19块决定、18U、48行写集、23AC、四工作包和原细化顺序保持。OI实际8条＝6open/2closed；原状态不因本规格有方案而改closed，OI001缺有效窗口证据、OI002仅本轮复核关闭候选、OI005逐项设计接与不接；OI006/007/008仍用户未来范围，不替用户回答。

#### 四字段各管一件事，不是只准四个要点

当前模板65把五字段挤一行，skill22/45/62/76又要求五字段全文和ADR-only，入口32再说全部外置，造成作者不知道该留什么。T008在模板63–69替换示例和形状，在skill22/32–35/45/60/62/76–77对齐同一职责：

- **做什么**只写选定结果、适用前提与执行动作；与决定相关的关键来源/约束或拒绝替代理由，就近挂在该动作的依据子点或原件指针，不删除因果链。
- **不做什么**只写会误扩范围或让执行者停下的真实边界及来源；默认常识不铺成第二份范围表。
- **风险**只写该决定独有触发、后果、缓解/恢复及未解owner；通用风险表引用该决定，不复制全文。
- **改动**只写精确文件/符号、行为变化和唯一写主；全局写集汇总引用此决定，必要接口完整留主文，证据历史对账另指原件。

每字段行自身先有一句结论；要讲多件事用子要点，一点一事，数量不设上限。本任务真实after范例是已签decision-log:534–555的N16四字段（U016/U017），只引用该原块不再复制全文、不据此冒当前plan批准。以下拟模板after示例只是教形状，不是假实际来源/确认：

```markdown
#### ADR-001 — 让下游直接取得已确认方向

- **做什么**：主文保留下游要用的方向与接口。
  - 每条原始需求保原义、来源与落点；真实来源未提供时写缺口。
  - 依据引用本任务真实选择原件；此示例尚无实际确认。
- **不做什么**：历史过程只引用唯一原件，不复制成第二正文。
- **风险**：原件缺失时相应依据保持unknown，由来源owner补路径。
- **改动**：本例仅演示模板形状，实际任务填写精确路径和唯一writer。
```

现任务N标题和原ADR/D历史编号不重编号；五字段历史全文仍原ref，只取消“同一当前决定必须主文+外置两份全文”的指令。skill35≤3行、77>15%解释门槛等无本任务保留依据的长度驱动，按U015内容判断替换，不换成另一个预算。保锁定文字/原R与U条件与确认边界；一般写作规范只指WR001，N15编辑保全由P1/T001加140–158一条，唯一原文锚、替换不跨heading、损坏只恢复受损原字节再编辑。

#### 主文保接口，外置保过程，逐节说明谁读

节级消费者定义由T008放现`## 外置事实索引`之内，不新顶层节、不建校验清单。表是人读定义，不新机器字段。T001在build-plan15/21只指这一定义及必要直接输入，不复制表；spec-template275/302保持验收索引到唯一Appendix A的边界。实读消费者区分如下，源N19“其它9节未被点名”是当时有界扫描事实，不推这些节无消费者：

| 当前节 | 下游何处用 | 原消费依据 | 主文与原件分工 |
| --- | --- | --- | --- |
| 任务身份 | build-plan15辨任务类型/当前根 | 按内容 | 当前身份与范围留主文，不把历史确认当新授权 |
| 大纲地图 | build-plan15/21定位输入 | 按内容 | 按实际最终顶层标题及顺序人工再生，自身省略，不强制新数量 |
| 原始需求 | spec-analyze35逐字原始需求；spec-template275的R/U按内容追来源 | analyze逐字`## 原始需求`；spec-template275逐字节名只指验收面 | 原义、痛点、旅程和必要逐字声明留主文；索引明细指原件 |
| U最小索引/需求变更记录 | decision-skill60与build-plan15取真实选择 | 按内容，U016/U017 | 全U过程记录整节外置；主文每U最小决定与受影响落点/唯一ref，不复写全文 |
| 工作包与决定/模块清单 | build-plan15/21拆结果/唯一writer | 按内容 | 当前方向与四字段、结果/consumer/恢复留主文；旧全文/争论指历史ref |
| 要改哪些文件 | build-plan21分写集 | 按内容 | 每具体改动、owner、决定完整留主文，不整表外置 |
| 范围与非目标 | build-plan15继承边界 | 按内容 | 当前取舍/理由留主文，旧变更过程外置 |
| 验收面 | spec-template275/302 | 逐字`## 验收面` | 可观察接口与成功失败边界留主文供spec承接；覆盖逐项过程指唯一原件 |
| 未决项 | build-plan15 | 按内容 | 当前问题/来源/状态/处置/owner下一步留主文；历史挑战外置 |
| 风险与延期交接 | spec-analyze37 | 按内容 | 触发/后果/处理阶段/owner留主文；证明原件外置 |
| 退役登记 | build-plan15继承不做事项 | 按内容 | 真实对象/理由/决定人/去向留主文，未授权建议不冒已删 |
| 外置事实索引 | 本表指定的条件消费者 | 按内容 | 每ref写基准目录、到达条件、主文留什么；只指现唯一原件 |

这张表定义各内容族，不规定所有任务必须出现额外模块节。模板45–53由T008改为只留U条件指针/最小可解读接口，完整变更表在唯一原件；skill60同步，不保原“主文完整索引表”与“整节外置”两种互斥指令。原“十二节”是现模板事实，U016后以实际输出headers再生地图，不能靠删节凑数或新数量门；目前task主文最小U索引受U016/U017保护不删除承重编号。

#### 覆盖与遗漏使用现有三栏，不造第二个未处置清单

T008保template39–43原R索引四栏（source_id／需求约束／来源引用／落点），保原义与主文必要接口，不吞并或新增字段。coverage现103–105三栏（来源／事实与处置／落点或缺口）定义用于唯一逐项原件，不在未来主文生成逐项副本；沿现skill43的coverage-matrix-5d唯一原件用现来源/事实与处置/落点或缺口三栏只逐R/U写，不增加字段。当前已存在coverage-matrix-itemized原件继续原ref，本任务不把它搬移/复制。101一次编辑按N4→N5次序，107原完成句逐字保并后追加R/U穷尽；skill64只指既有落点或缺口/OI状态。人读步骤是：先枚举真实原始R与全部真实U（包括不按数字排序或后补的U），再逐项定位选定决定/现小节或真实排除选择；最后反查每一决定/写集有源。原发现、风险、OI各归既有唯一处置位置：任何已投递未落地或已登记未处置项也必须在其原有处置格出现一次“缺口/已投递未执行/needs_human/incomplete”及原ref、owner下一步，不能因不属R/U就消失；其影响R/U时覆盖唯一格指向该原处置，不复制finding/OI全文或另建清单。

- 正常行：现“来源”栏写R/U，现“事实与处置”栏写实际处理，现“落点或缺口”栏指决定/现节及原件；重复来源引用不复制事实全文。
- 已读却未交：事实栏保“已投递未执行”，落点栏写“缺口—缺哪一输出、应落现哪节、owner下一动作”；它不是已实现或用户已接受的排除。
- 登记未处置或编号无行/落点空：遗漏签名就是已有格中的“缺口—原编号/原来源/缺的落点”；每个R/U缺口出现一次，补证后原owner更新本当前格真实处置，历史失败保ref，不能默填已落或另建未处置表。
- 无来源/打不开：写具体unknown/unavailable、影响与owner下次定位；“无”只用于已实读确无，不拿路径没找到当零消费者。新需求改变方向时仍由真实owner问用户，不能靠缺口格代答。

源AC05的“矩阵里”逐项义务与U017⑤“逐项保持外置”按后一次已确认选择协调：主文验收/外置索引保逻辑覆盖authority的条件指针与最小接口，逐R/U原件仍逐项可核；不是宣称主文原旧物理内联字面已实现。Appendix A05/07将旧物理主文矩阵位置明确标为已被U017⑤替代，逐项穷尽/缺口/已投递未执行原义保留，沿唯一覆盖原件消费，不能因为外置删逐项义务；来源唯一TASK/quality/evidence/decision-log-refs/requirement-change-log.md:58、62–63，不改旧已签decision-log原字。全覆盖是原件逐项人读，不是静态出现编号/grep数量。

#### 编号和数字是一个原事实的引用，不是新计数账本

skill62由T008定义各事实只有原producer：决定集合以当前决定节为源、写集以该表为源、AC以其唯一权威为源；需要重述的数字或同号关系就给原锚，不在各节重新手数产生第二值。spec-specify72由P1/T001只追加指向该规则，保新ID三位与legacy兼容既有字面，不在下游重复定义位数。核例是原源19块/N13取消、48登记行不等48可写文件、23AC以及U018方向范围确认而非普通登记重新签字；检查的是同一事实相矛盾，不是要求每一个数字都带新metadata。本文源锁定两位AC保例外，绝不靠改旧编号强行统一。

#### 用前读方法，并把真实全文放进detail合法成员

T009替make-decision32条件读取：第一次结构化提问前读talk方法；首次写外置完整U原件及主文OI之前read `skills/decision-log/SKILL.md#来源与未决问题写法`，coverage audit同一方法64是唯一owner。入口原位三行实际pointer：①U外置变更写入前读该方法60，按当前TASK绝对基准定位现`quality/evidence/decision-log-refs/requirement-change-log.md`并用该原件实际U编号定位（现U001–015表、U016/U017/U018真实条目），不造不存在的通用fragment或实际唯一变更原ref，主文只最小决定与ref；②OI主文`decision-log.md#未决项`写入前读该方法58，问题/来源/真实状态/owner下一步按现四列；③coverage收口逐R/U对账前读该方法64，沿当前TASK基准现`quality/evidence/decision-log-refs/coverage-matrix-5d.md`或已存在itemized真实原ref，按现三栏写实际落点/缺口；此taskitemized不搬移/复制。该三行是调用指针不是第二定义，完整规则仍T008 owner。step1只改既有observable_result字符串披露实际读与读后未执行，不增fields、hooks或reader。问答仍真工具/真回复；工具缺时同内容文本卡+真实降级，不把计数当对话质量。make-decision41把悬空“未落项”映射现工作包与决定/要改哪些文件/覆盖格，保其它审查发现/OI真实处置和十五步。

N18读与写分离：主文/索引给当前task绝对基准+相对原ref；调用者只把本次触发需读的明确ref放现detail approved_direction/context_map/evidence_map顶层成员，现resolveMaterialRefs先按认证worktree或当前TASK双root读真实bytes，再现buildReviewMaterials写完整当前decision与所引用原文进packet。缺源/跨task返回现TASK_FILE_INVALID，不略过或换摘要；ArtifactDir writer根不放宽、不扫全目录、不递归解析Markdown。当前025三case构包全文/缺失/跨task已经实P2P/G2，不provider语义裁决。N1 phase facts不是此profile，不能把detail context_map删成不合法或把全文放phase source换绿。

#### 既有检查器怎样识别当前块并如实提示

T010只扩现decisionSections/checkDecisionLogChain，当前N与未来模板ADR均支持四字段，旧ADR五字段与旧D legacy字段读法兼容，failures=[]、main exit0、不接run-checks失败列表。形状取块内真实父label而非ADR前缀推历史：N按四字段；ADR有任一当前精确label（做什么/不做什么/风险/改动）即按当前四字段检查，缺任何一项仍报缺失，混入旧label报形状冲突，不因不完整fallback五字段；ADR没有当前label且有旧精确label（决定/为什么/否掉了什么/后果与风险/影响面）才按旧五字段检查，原单行五字段兼容不得默改；两套均无可识别label报形状unknown/缺字段事实，不猜history或静默成功。D保现module/requirement_ids/derived_from/artifacts legacy读法，不把D误称五字段ADR。此逻辑只是现函数局部label分支，不新增classifier对象/metadata/schema，不迁改任何历史记录；新模板ADR四字段不会被旧startsWith("ADR-")规则误报五字段。实现使用现行逐行正则与heading层级边界，不引通用Markdown AST/自动canon。当前N读法接受非fence中的###或####，编号N1与可选空格/破折号标题，源259是`### N1 把…`而旧说明写`#### N1 — …`，两者都合法。块的body在下一个同级或更高heading截止；更深heading属于该块，下一同族决定再开始，最后块不吞“各模块前提/要改哪些文件/验收面”后续节。保持现```fence排除；新tilde/嵌套Markdown解析能力不为本需求扩进来，未覆盖如实写明。

字段检测只把块内父级四个label当字段，允许中文冒号/加粗，标签后的正文须非空；缩进子点是对应值的一部分，不是第五字段。缺字段、重复父字段或第5个父级标签仅输出原warning形状中的具体N编号/字段/冲突位置，不把子点误作重复；明确引用不存在的当前小节也报具名warning。原N20三case只到缺风险/N99/recognition；新增035三case真实首RED覆盖heading识别/明确当前缺section/新ADR4被旧五误查。父子/截止/historyfalsepositive/缺风险与oldADR5controls后继已预写未达；Dlegacy/混族/unknown/duplicate与第五父label等仍未预写未执行，均不宣完整覆盖。缺字段输出原warning形状中的具体N编号与字段，已在冻结N20缺风险case预写；主题是否清楚、要点是否一事仍人读，不机器打分。AC21⑦既有checker事实范围是块/字段/明确引用，结论句/一事一要点/实际标题可理解性由独立真实G2人读原件补事实（当前026仅源消费不是方法改后验收）；不声称七项全由机器测过，未观察面具名说明，不加topic评分器。局部引用只检查明确说本当前文的现小节/编号（如“引用 N99”）是否在已读heading/决定集合中；带另一文件、历史/旧编号或external原ref的引用不据当前集合报断链，能力不扩到读取任意外置树。原“引用自洽”包含明确R/U引用时使用本当前文可定位来源/现索引，不硬绑发现全部进矩阵；缺原件只提示unknown，不能推不存在。六冻结最新N20原三与新增三case均首目标RED，heading截止/子点/历史falsepositive已预写但首断言后的实际结果仍未观察；其它上述未预写项保限制，不改顺序/softassert为多RED、不为全点绿色扩大scope。

### 全局文件边界与依赖

计划编写NEW只包括本spec、八个具名Phase和纯pointer index；本stage不改decision-log/生产/现测试；未来P7对当前decision仅格式的具名例外来源011/013，不改方向/原话/判据语义。实现NEW：无新生产文件；六份测试新件由scout已预登记创建并冻结，不在实施Phase写集。职责登记源为TASK/quality/evidence/2026-10-12-build-plan-runtime-design-and-red.md:5–12；consumer是本task直接RED/GREEN执行、owner原测试作者，非新runtime能力。暂不纳生产distribution/move-map自动链；长期保留为仓库正式目标回归时须原owner登记其消费者/保留条件到现move-map，不以临时执行事实冒已完成永久登记。测试不得默删，任何变化保旧字节与独立test-change事实。MODIFY按源48对账下段指定，一文件一个Phase与Task owner。

拆分理由：四工作包不是四个待编码结果。①诊断已完成只读；③N2本轮复核进入设计且零生产写集。②根因修复按独立consumer/oracle分成六种结果：P1测试方案、P2同阶段授权、P3事实执行、P4收尾可见、P5决策可消费、P6阶段交接。④为只读整任务聚合P8。八个Phase（011/013新选活动检查结果另拆P7）而非19模块机械拆；授权API有真实直调用者与独立正负case可先交付，CLI接线由P3消费，不伪造同一文件跨Phase双writer。

依赖：P1无前置；P2无前置，给P3显式scope API；P3依赖P1测试声明/P2API，写现stage-runtime与build-code/docs全部相关hunk一次；P4依赖P3对授权及默认close边界的实际回归；P5依赖P3 N1事实与本卡N4编号输入，不因编号强串行；P6独立；P7活动check依赖P1/P3/P5/P6当前活动Markdown/依赖声明，P2/P4源码结果不是其已证前置，不强串行；P8明确依赖P1–P7原件。

当前并行方案2–5：P1 T001先交测试卡合同，T002消费它后落verify审计（真实blocked_by=T001）；同一时段2上下文为唯一writer+只读方法验证；P2 T003唯一writer+只读测试2；P3 T004事实writer/T005依赖声明writer+只读包级测试3，共享文本交T004一次；P4 T006writer+T007后置独立复验2上下文，真实依赖满足才执行；P5 T008模板与T010checker可并行，T009消费T008后开始；3上下文为前沿writer与独立只读验证，真实blocked_by不能越过，N18完整detail装配方法由T009，不交P3 phase writer；P6 T011唯一writer+只读回2；P7 T012唯一check writer+独立语义/执行读回2；P8 T013/T014只读并行2，各外置slug互斥。成本为卡内预估切片，实际费用unknown。

#### 48行逐项承接

以下保原行号/owner与处置；完整改什么归源decision-log写集，不复制第二表正文。补漏hunk用同文件owner，不改历史。

1 P3/T004 N1 `workflows/build-code/SKILL.md`（合并N9/11/14）；2 P1/T002 N10 `workflows/verify-code/SKILL.md`（N9/11/12合并）；3 P1/T001 N10 `workflows/build-plan/SKILL.md`（N14+N19消费者指针）；4 P5/T009 N6 `workflows/make-decision/SKILL.md`（N8）；5 P3/T004 N11 `docs/standard-workflow.md`（N12）；6 P3/T004 N1 `tools/cli/stage-runtime.mjs`（N11/12，加N17具名phaseProgressTargetExists实际authority读取；N17 material-workspace现reader最小例外见下一句；N18完整detail原文装配方法仅P5/T009，不归本行phase source writer）；7 P3/T004 N1 `skills/wh-review/scripts/simple-review-runner.mjs`。

8 P5/T008 N3 `skills/decision-log/templates/decision-log-template.md`（N4→N5，补N16/19）；9 P5/T008 N3 `skills/decision-log/SKILL.md`（N4，补N16/19）；10 P1/T001 N8 `skills/spec-plan/templates/phase-template.md`（N10+补N17）；11 P1/T001 N8 `skills/spec-plan/SKILL.md`（N10+补N17）；12 P1/T001 N8 `skills/spec-specify/SKILL.md`（N15+补N4）；13 P1/T001 N8 `skills/spec-specify/templates/spec-template.md`（N19错误指spec-plan路径在此明确更正，不造不存在文件）。

14 P6/T011 N7 `skills/stage-handoff/SKILL.md`；15 P6/T011 N7 `skills/stage-reflection/SKILL.md`；16 P2/T003 N11 `runtime/interface/git-authorize.mjs`；17 P4/T006 N12 `core/task-close.mjs`；18 P3/T005 N9 `workflows/build-code/skill-deps.yaml`；19 P3/T005 N9 `workflows/verify-code/skill-deps.yaml`；20 P3/T005 N9 `skills/catalog.yaml`；21 P4/T006 N12 `tools/cli/task-close.mjs`；22 P4/T006 N12 `tests/close/close-contract.test.mjs`；23 P2/T003 N11 `tests/contract/narrow-tool-git-authorize.test.mjs`；24 P2/T003 N11 `tests/contract/close-authorization-diagnostics.test.mjs`；25 P3/T005 N9 `workflows/build-code/steps.json`；26 P1/T002 N10 `workflows/verify-code/steps.json`。

27 不认领待裁 `workflows/build-plan/steps.json`，选择最小权威方法说明不新增同义step；28 P5/T009 N6 `workflows/make-decision/steps.json`；29 P1/T001 N8 `skills/test-routing-advisor/SKILL.md`；30 DNT登记 `Improvements.md`（不改第5行，下一真实任务实际选择才追加）；31 用户本轮具名例外 P3/T004 MODIFY `runtime/stage/stage-content-contracts.mjs`，只读index实际authority（198/383/393），保旧P<n>.md、不增判定/必填/验收强制；其它正则/required结构DNT；32 DNT `tools/cli/run-checks.mjs`；33 P5/T010 N20 `tools/cli/check-decision-log-chain.mjs`（原不改由U017取代）；34 DNT `runtime/evidence/acceptance-evidence-validator.mjs`；35 DNT `tools/cli/check-stage-quality.mjs`；36 DNT `tools/cli/verify-structure.mjs`；37 DNT `runtime/stage/stage-skill-runtime.mjs`；38 DNT `runtime/task/task-store.mjs`；39 DNT `skills/isolated-browser-qa/SKILL.md`；40 DNT `tools/cli/check-skill-consistency.mjs`；41 DNT `skills/spec-plan/templates/index-template.md`；42 DNT `runtime/interface/human-confirm.mjs`；43 未提出其它模板/skill测试（登记类别不是glob授权）；44 只建议退役不删 `workflows/verify-code/isolated-browser-qa.md`；45 DNT `.codex/hooks.json`；46 只读 `docs/archive/2026-07-13-unstaged-review-snapshots.md`；47只读历史 `specs/archive`与历史任务；48 N2输出落本spec研究表及P5/T008引用，不当新增生产文件。

另MODIFY `skills/wh-review/scripts/review-materials.mjs:763` 现 `buildReviewMaterials` source.json序列owner P3/T004，真实范围源 `TASK/quality/evidence/2026-10-12-008-review-source-scope-and-test-cr.md:3–5`，现source member保事实不新材料、不改filter。

2026-10-12用户真实追加选择 `TASK/quality/evidence/2026-10-12-007-phase-reader-scope-clarification.md`与011:6已read，后者明确共享PHASE_FILE对现read/write定位的许可：MODIFY `runtime/task/material-workspace.mjs` 唯一owner P3/T004，`phaseFilesFromIndex:8/27/31/34`读取index实际短名authority并保连续编号/重复/越界拒绝；同文件PHASE_FILE:6供materialPath:53/replaceMaterialAtomic消费者，只扩同一认证specs root内具名Phase合法文件定位，不增writer/root/scope。本作者read日期2026-10-12逐字 `const PHASE_FILE = /^phases\/P([1-9][0-9]*)\.md$/;`、`CURRENT_MATERIAL_FILES`=`["decision-log.md", "spec.md", "phases/index.md"]`，旧裸P合法继续。这是48行之外本轮具名已授权补充，不静默扩大runtime目录。

015真实选择追加MODIFY `runtime/review/provider-material-projection.mjs` 唯一owner P3/T004，现providerMaterialEntries:116–144按index实际authority定位named中文/英文header、完整正文、连续编号、重复/缺失/跨root拒绝，保旧bareP正控，不新增材料key/schema/审查轮/推进门。read2026-10-12逐字:130 `phases/P[1-9]\d*\.md`、:136 ``path !== `phases/P${position + 1}.md` ``；当前生产未改。第三冻结目标 `tests/contract/card05-provider-named-phase.test.mjs`已read1–49，hash094796c773a1d9b188cb86ad787c3d6badee4d9fd32b238503c553fb784396dc，唯一raw/receipt TASK/quality/tests/2026-10-12-013-card05-provider-named-phase-red.output/.json exit1：2条named-English/Chinese目标RED、9条旧全body+8安全反例P2P、0fixture；entries API不是真实transport，后继完整body/key/order尚未到达，未来GREEN须同断言核不只是throw消失。providerMaterialPath98–102当前named落fallback materials path不是拒绝；018真实用户已选同文件:100最小合法named映射补齐，owner仍P3/T004，保包根/路径安全/旧bareP、不新增材料/interface/schema/review。精确预写expectedpath与packet消费case见P3/T004，当前目标RED已实跑原件TASK/quality/tests/2026-10-12-016-card05-named-phase-material-path-red.output/.json：exit1命中ORACLE-NAMED-PHASE-PATH ERR_ASSERTION，expected requirements/phases/P1-短名.md，actual materials/01-phase_authority_phases_P1-_.md.md；旧bareP正控先通过1，非fixture失败，entriesAPI两RED仍不冒mapping完整packet覆盖。上述16/15/2仅source021前历史首执行；当前按补验证段六冻结最新执行+literal统计28RED/20P2P/G2/0fixture，首次归因不覆，旧N18双root12/12另列。

### 检查旧失败的本轮精确边界

真实来源011纳旧check与013逐文件保护选择：新增独立结果P7/T012活动检查兼容，MODIFY `.markdownlint-cli2.jsonc` ignores、`skills/plan-eng-review/SKILL.md` 有序步骤9/10纯format、`specs/workflowhub-card05-stage-defect-audit-20261012/decision-log.md`仅无损Markdown格式（未来实施具名例外；本build-plan仍不改该源）。前三个活动skill旧错分别decision模板134 MD032由P5/T008、spec模板11 MD028由P1/T001、plan-eng43/66 MD029由P7/T012，各文件唯一owner不后送hunk。原8历史只读精确名单见P7/T012，现config仅append8文件strings，不排目录/current、不全局关闭规则。当前源URL/空白代码/48编号保原字面，用局部MD038/029注释仅保护这些具名字面；无法保意义即停该处，不把“纳旧错”推改已签方向。

NEW生产无；已有第一lint消费者package check用同config无新writer/schema。config已read1–37日期2026-10-12，原default=true/规则/所有ignores保；原首lint010 exit1、249errors/13paths是事实，2下游未跑unknown，完成需同完整check三段真实原件。013检查覆盖真实改变不是旧文件修好，不计异源审查已覆盖post-review新范围。新增成本1–2h/费用unknown，仅当前活动format与精确history保护；回退局部append/hunk不整checkout。

#### DO NOT TOUCH 实读记录

本节每项工具均为read，日期2026-10-12；只列逐字已读字段，不靠源摘要声称全部文件未改。`runtime/task/task-store.mjs:87`：`command`、`exit_code`、`failure_signature`，报错原串 `evidence must carry actual command, exit_code, failure_signature`。`runtime/stage/stage-content-contracts.mjs` 本轮授权仅读路径的具名例外已直接read：:198 ``if (plain(cells[1]) !== `phases/${phase}.md`)``、:383 ``const ref = `phases/${id}.md`;``、:393 ``const expectedPath = `phases/${expectedId}.md`;``；该处改为index实际authority，非校验强度扩张。:470-472：`"Boundary / DO NOT TOUCH", "Dependency", "Test tier / skill", "Scenario / fixture or service"`；`"RED/GREEN gate_cmd", "expected_exit", "RED target failure", "GREEN oracle"`；`"Evidence", "STOP / recovery", "Coverage limit", "Done"`；:611 `"Code Anchors", "Interfaces and Failure Semantics", "Requirement-to-Task Trace", "Global Verification Strategy"`。`tools/cli/run-checks.mjs:143-148`：`if (decisionLogChainCode !== 0)` 与原输出 `not added to failures`；无failures.push。`skills/spec-plan/templates/index-template.md:8`：`阶段 / 权威引用 / 语义锚点 / 写入集 / 依赖 / 消费者`（原表列逐字），:12 `pre cohort 的旧任务卡只读保留，在本文件中没有有效行。`。

所有其它DNT路径当前逐字字段/签名/版本实读结果均为 `unknown`，不声明零调用/签名不变/字节未改；owner对应上行模块实施者，动手前read该具体文件与依赖项，记录日期及逐字值到执行原件。特别 safe-write、hooks、human-confirm、archive、validator、check-stage-quality、verify-structure、stage-skill-runtime、isolated-browser-qa、check-skill-consistency、Improvements 不用历史摘要替实读。冻结新测试已read 1–101，顶部逐字 `// build-plan target oracle: freeze these bytes; later edits require test change request + independent review.`；最终hash由测试scout原件提供。

### N2 本轮跨阶段复核结论

唯一研究原件 `TASK/quality/evidence/2026-10-12-004-n2-cross-stage-criteria-conclusions.md` 已直接read，hash bb0b97a0e6afb1cbc2ee506f9f8b6a4b9399e2ab10206c18263aa3cb779ea341；以下结论是研究事实、不是质量裁决。行号以本次实读为准，原06/09不复制。

| 类别/判据原ref | 正确口径与结论 | 06对/错部分 | 缺证与模块 |
| --- | --- | --- | --- |
| C1 raw06:57 | 整类未确认；人读+被引owner亦可承载义务 | 对：有未展示errors；错：同句无台账≠不可执行 | 他stage投递/产物链缺；N1/3/4/5/6/8–10 |
| C2 raw06:58 | 整类未确认；handoff:38 incomplete不判齐备、:40不报完成 | 对：长期缺口有风险；错：诚实unknown≠质量通过 | 每stage缺口消费链缺；N5/7/9/10 |
| C3 raw06:59 | 整类未确认；真实review writer/command原件存在 | 对：某记录须owner；错：无机器reader≠无人读义务 | argv/cwd/raw/facts事件链缺；N1/5/9/10 |
| C4 raw06:60/140–158 | 判据被推翻U4；模板55/71/80/101–107有同义载体 | 对：card05悬空有价值；错：名字grep0≠义务不存在 | finding语义逐项和其它stage执行链缺；N3/4/5/6/20 |
| C5 raw06:61 | 整类未确认；build-plan23→24→25与spec-plan61修后核有闭环 | 对：owner回修需证；错：回灌字面0≠无闭环 | finding→修→再核原件缺；N5/10与原owner |
| C6 raw06:62 | 整类未确认；spec-plan41/47明确Phase owner/trace | 对：机器只核子集；错：consumer字符串核≠方法无消费 | 48逐行实际diff/结果待实施；N4/5/10 |
| C7 raw06:63 | 整类未确认；可选复盘/真stage末/用户选择有触发 | 对：未做须留一句；错：条件词≠永不触发 | 各次真实条件/未做原因缺；N7/6 |

真正成立清单：无本包可确认的5/5行为通病；card05局部规则已投递而矩阵仍待填(raw09:15–21、41–59/raw08:223–241、宿主decision:1015–1021)为宽U3/incomplete，N5/N6/N3；Phase validator已算事实未展示限stage-runtime533–545这个生产投影，N1；schema/方法存在不能证明执行，N1/9/10；C6反向承诺是局限不是5/5病。

被误判清单：C4旧判据U4已推翻；C1机械可跑才有效、C2披露等于完成、C3不落派生件等于销毁、C5回灌字面0等于无闭环、C6方法完全无owner、C7可选等于永不，这些过强推论均不足，不把整类六项写成已推翻/已成立。每条保真失败与具体缺证见上表及原件60–70。

漂移一起保留：stage-handoff兜底36→38；raw06§7.1:280–284、:296与card05旧decision:75类别排序漂移，仍按C3落点/C4编号，不统一原件；当前宿主矩阵1015–1021，旧行仅历史。第一summary L1177保英文同义step10/grill；第二L2380未命中但有效prompt链未核，不声称摘要都缺。八键永久落盘不是当前新增义务。

### 需求到任务追踪

新增追踪：011/013→FR-C05AUD-003→AC-C05AUD-11→P7/T012→ORACLE-P7-CHECK；正例完整check与8原字节、反例排active/删source保护失败。每行正例与反例是具名oracle的测试对象，完整通过失败正文仅Appendix A。AC是原两位号，下表不创建新编号。

| 来源 / 决定 | 原义与状态 | FR / AC | Phase / Task | 正反 oracle |
| --- | --- | --- | --- | --- |
| U005/U009/U012；N1 | 字面执行/汇总防回落；current | FR-C05AUD-001；AC-C05AUD-01/02 | P3/T004 | ORACLE-P3-FACTS：失败7落真值/无回执不捏0 |
| U002；N1 | partial findings仍可读；current | FR-C05AUD-002；AC-C05AUD-03 | P3/T004 | ORACLE-P3-FACTS：N条消息/零条仍失败 |
| R006/U003；N2 | 七类复核不扩大；current | FR-C05AUD-006；AC-C05AUD-04 | P5/T008 | ORACLE-P5-DECISION：C4证据/其它六类无证不推翻 |
| U008/U011；N3/4/5 | R/U覆盖与缺口；current | FR-C05AUD-006；AC-C05AUD-05/06/07 | P5/T008 | ORACLE-P5-DECISION：有落点/漏R显缺口 |
| R010/011/U001；N6 | 方法用前读、工具提问；current | FR-C05AUD-006；AC-C05AUD-08 | P5/T009 | ORACLE-P5-ENTRY：首次提问前读/无工具降级 |
| R005/U003/U008；N7 | 未做说明、按归属；current | FR-C05AUD-008；AC-C05AUD-09 | P6/T011 | ORACLE-P6-HANDOFF：真原因/不造宿主文件 |
| R015/U006/U009/U010/U012；N8 | 自定面与命令；current | FR-C05AUD-003；AC-C05AUD-10 | P1/T001 | ORACLE-P1-PLAN：面oracle命令/不固定枚举 |
| R015/U010；N9 | 逐面执行及具名限制；current | FR-C05AUD-003；AC-C05AUD-11 | P3/T005 | ORACLE-P3-ROUTES：已声明依赖/不假浏览器通过 |
| R015/U005；N10 | 末phase与穷尽只读；current | FR-C05AUD-003；AC-C05AUD-12 | P1/T002 | ORACLE-P1-AUDIT：全phase行/不复跑全量 |
| R013/U005/U012；N11 | review前commit否；current | FR-C05AUD-004；AC-C05AUD-13 | P2/T003；P3/T004；P1/T002 | ORACLE-P2-AUTH：显式stage跨HEAD/旧grant拒漂移 |
| R014/U011；N12 | 合并前见链接；current；提前建PR deferred | FR-C05AUD-005；AC-C05AUD-14 | P4/T006；P4/T007 | ORACLE-P4-CLOSE：cutoff部分/默认不停等 |
| R006/U008/U011；N14 | 类别授权待核；current | FR-C05AUD-006；AC-C05AUD-15 | P1/T001；P3/T004 | ORACLE-P1-PLAN / ORACLE-P3-FACTS：保护处停/夹具登记 |
| U010；N15 | 保标题；current | FR-C05AUD-006；AC-C05AUD-16 | P1/T001 | ORACLE-P1-PLAN：原标题保/损坏字节恢复非手补 |
| R018/U015/016/017；N16/19 | 下游消费及四字段；current | FR-C05AUD-007；AC-C05AUD-17/21/22 | P5/T008 | ORACLE-P5-DECISION：接口内联/过程单ref |
| U016；N18 | 双root原件可读；current只读范围已明确；方法实施/真实业务仍futureunknown | FR-C05AUD-007；AC-C05AUD-18/20 | P5/T009 | ORACLE-P5-ENTRY：当前task读/跨task拒 |
| R016/017/U014；N17 | 具名独立结果；current | FR-C05AUD-003；AC-C05AUD-19 | P1/T001；P3/T004 | ORACLE-P1-PLAN / ORACLE-P3-FACTS：具名物理phase/旧裸P兼容/四reader送审消费 |
| R018/U017；N20 | 当前块与引用事实；current | FR-C05AUD-007；AC-C05AUD-23 | P5/T010 | ORACLE-P5-CHECKER：认N与缺字段/N99可见 |
| U002/U007；工作包④ | 全23逐项证据，不自判；current | FR-C05AUD-001…008；全部23AC | P8/T013；P8/T014 | ORACLE-P8-EVIDENCE / ORACLE-P8-SOURCE：每原件回读/缺源保持未知 |

R001…004/007…009/012与U001…018的剩余量词按源需求逐项保留到P8/T014反向核对；诊断事实只读，具体U016–018不因旧外置coverage停在U015而丢失。每Task有源，新增写集未经上述源或spec-clarify确定不执行。

### 全局验证策略

运行时目标只跑 `npx vitest run tests/contract/card05-runtime-target-behavior.test.mjs` 的具名case子集，旧record/close/material-ref/phase fixture作P2P定向超集，不跑全仓。源旧宏命令与禁无范围全量的张力已由011真实选择解决为仅受影响具名contract测试，OPEN-TEST只保检查实施后未执行事实，不再要求用户选范围；不私自跑全contract。方法用原件read回正常与具名缺失反例，G2不执行假RED。最终只读聚合之前执行原件、F2P/P2P与业务未知，不重复无疑点测试。

## 12. 风险、未决与交接

唯一异源审查原件 `TASK/quality/reviews/2026-10-12-016-build-plan-document.json` 已实读findings208–318，三源完成返回6major/4minor，available不是通过、各read[]coverage未定；唯一处置原件 `TASK/quality/evidence/2026-10-12-017-build-plan-review-dispositions.md` 8fixed/2rejected_invalid（两条的有效设计部分仍已修，原severity/全文保）。CR1/2/3后按用户source021做过独立窄fixture审查019与024技术处置；不要求positive批准，不将空findings当通过。当前N1命名目标已实RED，N17字段/facts与N12resume后继仍未达，futureGREEN/真实业务不可提前宣称；原016及017不覆写，设计质量不自判全部通过。

独立审查已捕ready2全文后本轮011真实选择与012事实修复才应用；review只覆盖它实际捕稿，不伪称最新所有修改已异源审过。本次被捕稿的provider材料投影不认中文index/具名文件，用内存英文导航与P<n>.md逻辑别名送实际全文，context保actual原ref/hash及中文原index；无物理mirror。此传输局限不是三reader GREEN；本轮015真实用户后置已允许第四projection精确最小consumer修正，原review仍只覆盖ready2捕稿，不冒新增路径已审。

- **RISK-REAL**：局部绿被读成真实任务修好；涉及全部AC；用户另跑任务前保unknown；owner用户/主会话，P8逐条限制。
- **RISK-GATE**：N1/8/10/14检查被升级门；涉及FR001/003/006；保持DNT校验器、只读事实与同task安全修复；owner各Phase实施者，独立diff核。
- **RISK-LEGACY**：N11公共授权/N12close/N18审查读面影响旧任务；FR004/005/007；以无scope旧grant、原默认close、双root拒绝边界P2P验证；ownerT003/T006/T009。
- **RISK-WRITE**：共享hunk或批替换吞标题；FR006/007；单writer、先保存被改原字节、唯一锚点不跨小节、若损坏仅恢复对应原字节hunk后重新编辑；不是手工补标题，不整树checkout；owner所有writer。
- **RISK-SCALE**：34未确认项、无已证自动链、check旧红；成本/质量不假0；owner各模块实施者，先定向验证再报告。
- **OPEN-N2**：OI001仍open但第一摘要已补英文同义义务，第二未命中不证明整个prompt缺；仍缺step10执行有效窗口链。OI002正确判据复核已完成为关闭候选，原decision状态不改；七类与两清单见下方本轮表，不照06扩修。
- **OPEN-N1**：OI005尚待接线逐项核；本设计接parse事实/真实verify/partial消息，不接5个无当前消费者检查器；层级与命令校验结果只浮现，不前置。截断额度、exit0 failure_signature具体语义本次review未给明确判断，保持unknown/原owner下步读真实预算与签名语义，不自动第二轮、不增schema。
- **OPEN-N11**：已由真实spec-clarify收敛，来源TASK/quality/evidence/2026-10-12-005-build-plan-clarifications.md:6–7；phase=build-code、原授权不改、consumed事实唯一。旧机械断言同HEAD第二次拒绝已被本次真实选择取代，历史原件只读，不再needs_human。
- **OPEN-N18**：reader已核stage-runtime672–745双root，现read边界12/12本来通过；当前细节完整原文包装配由P5/T009现detail方法owner承担，不借P3 phase profile。N1 CR2单指phase source事实，不覆盖N18。N18当前gap025中真实detail全bytes/missing/crosstask3例已实际通过，construct-only未调用provider；12/12仅旧read边界，不能称未来各任务外置链全验收，不放开ArtifactDir.open writer。
- **OPEN-PR**：现workflow until=pr→推链接→同plan resume复用既有消费者，接口无需新增；真实gh远端/先后可见性未测仍unknown，ownerT006与下一真实任务。
- **OPEN-TEST**：011真实用户已选旧check失败纳本task、contract仅受影响具名测试；首lint实际exit1/249error已定位不是全check完成，下游verify-structure/run-checks未执行。历史只读仍硬边界，013已选8exact忽略及当前活动无损format，精确安全方案P7/T012，不把范围选择推历史可写，不伪PASS。
- **OPEN-USER**：OI006/007/008分别宿主8产物缺陷、hooks另任务、ADR沟通范围，由用户决定不纳入本task；N2/5/7/14/15/16真实行为待下一任务，退役4行仅建议。既有make-decision复盘未执行不补造。

34项原始未确认的唯一原件 `TASK/quality/evidence/decision-log-refs/unconfirmed-summary.md:41-74` 已逐行read，全部保源状态（裁定不等于确证），各条owner如下：UN-A1-1…4 N1；5…8 N2/N1；UN-A2-1/7 N3、2 N4、3 N4/N7、4 N15、5/6/8 N5；UN-B-1 N6、2/4 N9、3 N8、5/6 N10、7 N6–10、8 N1、9 N8/10；UN-C-1/9 N14、2 N10、3/6 N15历史作废、4/5 N12范围外、7 N11、8 N11/12/14/15。没有把它们改成已证。

## 13. 业务影响与回归范围

公共runtime只改用户已定接线和授权/close局部行为。旧grant/默认close/历史ADR-D读取保真，方法新增义务不追判旧phase。取消signal、失败原件、迟到finding与部分provider各留来源；无自动CI事实不能写成全绿保护。CONSTITUTION1.9.3与checklist已实读，F1–11/Q1–3/S1–8逐项设计落点：薄现owner/窄接口/当前材料/独立建议/无新gate/唯一facts/两原人为选择/复用/unknown/不堆基建/安全部分继续；原件与结论分开、无自审；外部技能不升级pin、保本地偏离、指标未观测、独立上下文、原方法参考、五阶段不变、无宿主硬绑定。该对照是作者设计事实，不是独立合宪质量 verdict。

## Appendix A — 验收判据（唯一权威）

本节保源23条全部条件，AC01③的位置仅按本轮真实澄清替代，旧原文仍归decision只读；AC08③按011真实用户选择取消数字硬限制，按内容是否清楚判断；原<20/≤20及助手自行≤19不作为当前判据；每条关联FR、SCN、原N，具体命令只在Phase。全部需要用户下一个真实任务观察，本轮不得用局部原件宣称最终pass。

- [ ] **AC-C05AUD-01**：下一个真实任务跑 build-code：看 Phase 卡声明的 `gate_cmd` 有没有被按字面跑过，以及 `facts.jsonl` 的 `evidence` 槽是否被填；关联 FR-C05AUD-001；来源 U-001／U-002／U-004／U-005④／U-009②；F-47／F-49／F-41；owner N1（执行者＝build-code 中的测试子代理，U-009②；运行时只提供已有事实槽）
验证：用户下一真实任务以 ORACLE-P3-FACTS 对场景原件逐项核；具体指令见该 Phase。下一个真实任务跑 build-code：看 Phase 卡声明的 `gate_cmd` 有没有被按字面跑过，以及 `facts.jsonl` 的 `evidence` 槽是否被填
通过：① `quality/tests/` 下存在至少一条对应某条 `gate_cmd` 的真实回执（含真实 `argv`／`cwd`／`exit_code`／原始输出）；② 该阶段 stage 行的 `evidence.value` **不再是 `null`**（`tools/cli/stage-runtime.mjs:866` 的最小落盘逻辑已生效），每条含真实 `command`／`exit_code`／`failure_signature`，**且回执可按 `command` 与 `quality/tests/` 下的原件逐条核对**；③ 声明了却没跑的，现同stage source事实、唯一原始回执或人读逐项表看得见该条未执行及真实原因，且阶段照常收口；已跑整数exit才进既有evidence槽（本轮用户真实澄清005第4项替代原位置，schema不改）
失败：所有 `gate_cmd` 只有文本、`quality/tests/` 里没有任何对应该命令的回执；或 `evidence.value` 仍是 `null`（老行为）；或写了命令但 `exit_code` 全是 0 而回执显示失败；或反过来因未执行把阶段卡死
证据：任务库 `quality/tests/` 回执原件（`stage-runtime.mjs:1098` `recordDir`）＋ `facts.jsonl`（形状由 `runtime/task/task-store.mjs:87` 强制）；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-02**：下一个真实任务发起 build-code 单 Phase 审查时，看送审材料里有没有契约校验的只读事实块；关联 FR-C05AUD-001；来源 U-005④；F-21／F-38／F-49；owner N1
验证：用户下一真实任务以 ORACLE-P3-FACTS 对场景原件逐项核；具体指令见该 Phase。下一个真实任务发起 build-code 单 Phase 审查时，看送审材料里有没有契约校验的只读事实块
通过：审查输入里能看到 `contract_ok`／`contract_error_count`／`ac_coverage`（含"某 AC 无 Phase Task 承接"这类既有错误串），且**该块的出现没有改变"是否发起审查"**
失败：审查输入里没有该块；或该块出现后改变了审查是否发起（＝变成门）
证据：审查材料原件（`captureSource` → `stage-runtime.mjs:576-579`）；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-03**：下一个真实任务若再出现"两个 role 都不完整"的方向审查，看回执的 `error.message` 与同一回执里的 `findings` 是否自洽；关联 FR-C05AUD-002；来源 U-002；F-15⑥／`workflows/verify-code/SKILL.md:18`；owner N1
验证：用户下一真实任务以 ORACLE-P3-FACTS 对场景原件逐项核；具体指令见该 Phase。下一个真实任务若再出现"两个 role 都不完整"的方向审查，看回执的 `error.message` 与同一回执里的 `findings` 是否自洽
通过：有 findings 时 `message` 不再声称"neither paired review produced a semantic result"，且明说存在 N 条 finding；`code`／`status`／`pair_status` 判定与改动前一致
失败：`code=REVIEW_NO_SEMANTIC_RESULT` ＋「neither paired review produced a semantic result」与 11 条 findings 并存（本任务已复现一次）
证据：任务库 `quality/reviews/*.json`（既有落点，`review-record-route.mjs:165`）；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-04**：读下一个真实任务 build-plan 的产出物，看七类跨阶段命中是不是逐类有结论；关联 FR-C05AUD-006；来源 U-002／U-003；F-33／F-34／F-35／F-62；owner N2
验证：用户下一真实任务以 ORACLE-P5-DECISION 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务 build-plan 的产出物，看七类跨阶段命中是不是逐类有结论
通过：① 产出物里七类各有一行，逐行给出「判据原文 `文件:行号` ＋ U 口径结论 ＋ 依据」，**没有一行是"结构名没逐字出现"**；② C4 被显式标为"判据被推翻"并给出同义形态的 `文件:行号`；③ 其余六类**没有被写成"已推翻"或"已成立"**，全部落在 {U1,U2,U3,U4,未确认} 之一并写明缺哪份证据；④ 显式登记 `stage-handoff` 兜底句行号误差（36→38）与 `06 §7.1`／`:296`／被审计项目 card-05 的 `decision-log.md:75` 三处的类别编号漂移；⑤ 下一个真实任务的 `git diff` 里**没有** stage 方法文本因本模块被改动
失败：出现"某结构名全仓只命中该行自身 ⇒ 该义务不存在"这类推理；或 C4 仍被当作"五阶段通病"保留；或六类被一刀切成"都没问题／都有问题"；或 `workflows/*/SKILL.md`／`steps.json` 出现在本模块名下
证据：产出物本身（build-plan 的 `spec.md`／`phases/P<n>.md`）＋该任务的 `git diff --name-only`；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-05**：读下一个真实任务的 `decision-log.md`，看还有没有人去"造"那一节、以及矩阵是否穷尽；关联 FR-C05AUD-006；来源 U-003／U-008③；F-20／F-34 第 3 组；owner N3
位置更正：U-017⑤后一次已确认选择（TASK/quality/evidence/decision-log-refs/requirement-change-log.md:58、62–63）替代旧物理主文逐项矩阵要求：未来复用现coverage-matrix-5d唯一原件，主文仅结论与条件ref；当前已有itemized原件仍原path不复制。下列“矩阵”均指该唯一逻辑覆盖原件，不是新表/字段/账本；未处置R/U逐项与缺口强度不变，旧源文本只读保留。
验证：用户下一真实任务以 ORACLE-P5-DECISION 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务的 `decision-log.md`，看还有没有人去"造"那一节、以及矩阵是否穷尽
通过：① `grep -c '^## 未落项与处置'` ＝ **0**，起草者**不需要造这一节**才能声称第 10 步完成；② 由`## 验收面`条件指针定位的唯一覆盖原件里能逐行找到**每条 R 与每条 U** 编号，各自给"已落某节"或"缺口"两态之一（**口径已收窄为 R 与 U 两级**）；③ `## 未决项` 与 `## 风险与延期交接` 里**属于 R／U 两级**的未处置项在矩阵里各有一行指向它（发现编号／风险／OI 三类按覆盖矩阵「口径收窄」不强制，各自已有唯一落点）；④ **`## 大纲地图` 节存在**，其行数 ＝ 正文顶层节数 − 1（地图自身省略）
失败：材料里出现 `## 未落项与处置` 一节；或存在"在别处登记了、矩阵里没有"的编号 ≥1；或未处置项在矩阵无行；或 `## 大纲地图` 缺失或行数与顶层节数不符
证据：该任务主文的结论与条件指针 ＋ 唯一覆盖原件（逐R/U读回）；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-06**：读下一个真实任务的四份材料，看编号位数、同号取值与计数出处；关联 FR-C05AUD-006；来源 U-002；F-15④／F-26／F-29④／F-56；owner N4
验证：用户下一真实任务以 ORACLE-P5-DECISION 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务的四份材料，看编号位数、同号取值与计数出处
通过：① `FR-`／`AC-` 编号位数统一（同一 DOMAIN 不存在两位与三位同时出现）；② 同一编号跨材料取值一致（`decision-log.md` 与 `spec.md` 的 AC 编号同号）；③ 材料里出现的模块数／条目数／行数每处都能指出出处；④ 一条需求若在 `## 原始需求`／`## 需求变更记录` 有条目却在覆盖矩阵没有行（或"落点或缺口"为空）**能被指认，且被记为"缺口"而不是被悄悄补成"已落"**；⑤ `git diff --name-only` 里不出现新的 `tools/cli/*`、`runtime/**`、`schemas/**`
失败：出现 `FR-1` 与 `FR-001` 混用 ≥1 处；或出现 `V-013` 类"引用但原件只到 `V-012`"；或同一事实两个值（如"15 个模块"与同句枚举 16 个编号）；或遗漏签名被静默补成"已落"；或新增了校验器／schema 承载上述四项
证据：该任务四份材料 ＋ `git diff --name-only`；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-07**：下一个真实任务收口时，把所有登记项（对抗风险、审查发现、OI）逐一列出并与覆盖矩阵对账；关联 FR-C05AUD-006；来源 U-011③；F-15③／F-34／`raw/09:21`；owner N5
位置更正：U-017⑤后一次已确认选择（TASK/quality/evidence/decision-log-refs/requirement-change-log.md:58、62–63）替代旧物理主文逐项矩阵要求：未来复用现coverage-matrix-5d唯一原件，主文仅结论与条件ref；当前已有itemized原件仍原path不复制。下列“矩阵”均指该唯一逻辑覆盖原件，不是新表/字段/账本；未处置R/U逐项与缺口强度不变，旧源文本只读保留。
验证：用户下一真实任务以 ORACLE-P5-DECISION 对场景原件逐项核；具体指令见该 Phase。下一个真实任务收口时，把所有登记项（对抗风险、审查发现、OI）逐一列出并与覆盖矩阵对账
通过：① 任何"已投递却未落地"的项能在矩阵里找到一行**明写"已投递未执行"**并指到它应落的小节（不是散落在交接的散文里）；② "登记了却在矩阵中是空白格"的 **R／U 两级**项数 = **0**（发现编号／风险／OI 按覆盖矩阵「口径收窄」不在此口径内）（**由用户数，不由本任务自证**）；若 >0，则该项至少以 `缺口` 形态出现在矩阵里；③ `git diff --name-only` 中不出现新文件来承载该对账，仓库内不出现第二个"未处置项"清单；④ `raw/09:19` 的 grill 型实例（八键在 reasoning 里写全、材料里 0 命中）表现为**矩阵缺口栏里的可指名行**，而不是"事后审计才发现"
失败：未被处置的登记项无法当场数出；或收口时仍有"登记了却在矩阵是空白格"的项且未以缺口出现；或新增了台账／新字段
证据：该任务收口主文结论与ref ＋ 唯一覆盖原件逐行＋ `git diff --name-only`；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-08**：下一个真实任务的 make-decision 会话记录里，看两份方法正文有没有在"用到它的那一刻"被读到；关联 FR-C05AUD-006；来源 U-001／U-009②；F-12／F-37／F-39／F-40；owner N6
验证：用户下一真实任务以 ORACLE-P5-ENTRY 对场景原件逐项核；具体指令见该 Phase。下一个真实任务的 make-decision 会话记录里，看两份方法正文有没有在"用到它的那一刻"被读到
通过：① 产物写入 `## 需求变更记录` 或 `## 未决项` 之前，会话记录里**存在一次**对 `skills/decision-log/SKILL.md` 的读取，且读取发生在该节首次落盘**之前**；② 同一会话里**存在一次**对 `skills/talk-with-zhipeng/SKILL.md` 的读取，且发生在该会话**第一次**向用户结构化提问**之前**；③ 所有面向用户的输出均以大白话讲清任务、进度、风险与下一步；内部编号仅在帮助定位时补充，不作唯一说明。取消原<基线50的40%（<20/≤20）及助手≤19硬限制，按内容是否清楚判断，不新增计数器、评分器或沟通门（TASK/quality/evidence/2026-10-12-011-check-scope-and-plain-language-choice.md:7–8真实选择替代）；④ `grep -n "读取并执行" workflows/make-decision/SKILL.md` 里**不再出现**"…时，读取并执行"这一条件句形态，且与同文件 grill 那条读取形态一致；⑤ **向用户提问时必须使用宿主问答工具**：能读到该会话至少一次宿主问答工具的调用记录；**无该工具时**必须发一条与结构化提问同内容的文本卡，并在产物里记录"本轮降级为文本提问"＋真实原因（不记为通过、也不判失败）
失败：条件已满足、目标仍零读取；或 `skills/talk-with-zhipeng/SKILL.md` 路径全流仍 0 次；或面向用户输出仅靠黑话/内部编号解释，读者无法知道任务、进度、风险或下一步（011已取消数字硬限）；或未使用宿主问答工具且未记录降级
证据：按011真实选择，涉及同套grep的两次计数仅为可选观察，不作验收前置或通过/失败判据；主要证据是实际面向用户内容与方法/问答调用先后原件。原来源定位（不再强制计数）：会话原文（读取序号与提问 call 序号可比）＋产物 mtime ＋同一套 grep 的两次计数；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-09**：下一个真实任务阶段收口时，看交接件里"没做复盘"有没有被说明；若在宿主项目里跑，看问题有没有按归属分流；关联 FR-C05AUD-008；来源 U-003②／U-008②；F-05／F-09／F-10／R-005；owner N7
验证：用户下一真实任务以 ORACLE-P6-HANDOFF 对场景原件逐项核；具体指令见该 Phase。下一个真实任务阶段收口时，看交接件里"没做复盘"有没有被说明；若在宿主项目里跑，看问题有没有按归属分流
通过：① 若该阶段 stage-reflection 未执行，交接**逐字**含"未执行"＋至少一句真实原因与真实路径或明确缺口（`grep -c "stage-reflection"` 非 0；card-05 基线 006 与 `2026-10-12-001` = 0）；② 若过程问题指向工具仓库本身（或目标项目根没有 `Improvements.md`），workflowhub 根 `Improvements.md` 新增至少一条含问题、来源路径（含宿主任务 id 与阶段）、真实选择／未解状态的条目；③ `skills/stage-handoff/SKILL.md` 与 `skills/stage-reflection/SKILL.md` **仍没有**新增节、没有新增必填字段、没有被任何校验器引用（`grep -n "stage-handoff\|stage-reflection" runtime/stage/stage-content-contracts.mjs` 仍为零）；④ 宿主项目侧**没有**被凭空创建 `Improvements.md`
失败："未执行"这句又消失；或两边沉淀仍为空；或新增了节／字段／校验器；或在宿主项目里凭空造文件
证据：交接件原文 ＋ `git diff Improvements.md` ＋ `ls` 宿主项目根 ＋ grep 结果；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-10**：读下一个真实任务 `phases/P<n>.md` 的每张行为 Task 卡，看"这次测哪些面"有没有被声明、每个要测的面有没有命令；关联 FR-C05AUD-003；来源 U-006／U-009①／U-010①；F-57／F-58／F-50；owner N8（层级不写死，由各项目各任务各 Phase 自定；工具仓库不给清单也不检查清单内容——U-009①／U-010①）
验证：用户下一真实任务以 ORACLE-P1-PLAN 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务 `phases/P<n>.md` 的每张行为 Task 卡，看"这次测哪些面"有没有被声明、每个要测的面有没有命令
通过：① 每张行为 Task 卡的「测试层级 / 技能」字段是**项目自己声明的面**的子集，**不再**只出现 `simple／feature／fullstack` 或任何由工具仓库下发的固定清单；② 同一批 Phase 卡里，每条 `覆盖 AC` 列出的 AC 的验证面**指向一条在该 Phase 可执行的命令**；③ `## 测试标准` 节逐面写出适用/不适用＋oracle/证据类型/覆盖边界；**涉及浏览器可见行为的层未列入浏览器端到端时，有具名理由**；④ `routing_tier` 在 `runtime/ tools/ workflows/ config/` 仍**零机器命中**（**不得**新增机器消费者）；⑤ `git diff --stat` 不含 `tools/cli/run-checks.mjs`，且 `stage-content-contracts.mjs` 的必填清单逐项未变；原stage-content-contracts未改限定仅由005第3项与007真实选择替代为现具名Phase读取路径最小例外，既有必填项/校验强度/推进语义仍不变。
失败：卡里仍是路由档位或自由文本；或 AC 没有任何可执行命令；或浏览器可见面缺具名理由；或新增了必填字段／校验器；或工具仓库下发了层级清单并检查清单内容
证据：逐卡 grep ＋ spec.md 的 `## 测试标准` 节原文 ＋ 第三人真跑一条命令留真实 exit code ＋ `git diff --stat`；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-11**：下一个真实任务 build-code 收尾时，逐面看有没有真跑、没跑的写了什么；关联 FR-C05AUD-003；来源 U-005④／U-006／U-009②／U-010②；F-58／F-59／F-47／F-50；owner N9（执行者＝build-code 中的测试子代理，U-009②；没跑要写清哪一面／卡在哪／何时能跑，U-010②）
验证：用户下一真实任务以 ORACLE-P3-ROUTES 对场景原件逐项核；具体指令见该 Phase。下一个真实任务 build-code 收尾时，逐面看有没有真跑、没跑的写了什么
通过：① **每一个声明的面**在 `quality/tests/` 里能找到至少一条真实执行原件（含实际 `cwd`／`argv`／`exit`／原始输出）；② 未跑的面有**具名理由**：**哪一面／卡在哪／什么条件下能跑**，且**不存在**只有"没跑"三个字的条目；③ **涉及浏览器可见行为的 Phase**：要么有 `isolated-browser-qa` 的一次真实执行事实（engine、route/场景、截图路径或真实 `not_observed`＋理由、命令/输出/exit），要么有"该 Phase 声明写集不含浏览器可见面"的具名判断；④ `grep -rn "card-09-session-ledger" workflows/` **零命中**；⑤ `skills/isolated-browser-qa/SKILL.md` 同时出现在两个 `skill-deps.yaml`，`catalog.yaml:807` 与实际声明一致，`npm run check` 仍 PASS 且 `check-skill-consistency` 不再输出该技能的报告行
失败：有声明却没跑且只写"没跑／不可用"；或浏览器可见面既没跑也没有具名判断依据；或仍有写死的本仓历史脚本路径；或 `used_by_stages` 与实际声明不一致
证据：逐 Phase 逐面对账（AC-12 的表）＋ `quality/tests/` 原始回执 ＋ 三文件 diff ＋ `npm run check` 实际输出与 exit code；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-12**：读下一个真实任务的 `phases/`，看末 Phase 是不是整任务端到端验收；读 `quality/`，看 verify-code 有没有逐 phase 核对表；关联 FR-C05AUD-003；来源 U-005③／U-006；F-46／F-48／F-49／R-015；owner N10
验证：用户下一真实任务以 ORACLE-P1-AUDIT 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务的 `phases/`，看末 Phase 是不是整任务端到端验收；读 `quality/`，看 verify-code 有没有逐 phase 核对表
通过：① `phases/` 里**恰有一个末 Phase**，其契约头列出**全部** AC 编号，其 `Done` 逐条给出 AC 编号＋档位＋一条具名证据路径，且 `phases/index.md` 末行指向它；**适用范围限制**：本条**仅当任务包含可执行产物时必选**，纯文档／工作流规范类任务允许在 Phase 契约里声明豁免并给**具名理由**（与 U-009① 一致；`phase-template.md:224` 的"不新增 stage／gate／schema／校验器"自述逐字保留）；② `quality/`（reviews 或 tests）存在**一张** verify-code 的逐 phase 测试执行核对表，**行数 = Phase 数**，每行含 Phase／声明的面／找到的执行原件（路径＋exit）／未跑或未取证的面与理由；③ 表里**任何**"未跑"都带具名理由与承接人，不存在空行或只有"未跑"的格子，且 `semantic_test_adequacy` 的取值能由该表推出；④ verify-code **没有重跑**上游全量测试（无新增的、与被改 file/case 无关的测试执行原件），`":20"` 的"不重做全量上游测试"与 `:22` 的"incomplete 只限制质量声明、不限制同一 task 继续修复"**逐字仍在**；⑤ `stage-content-contracts.mjs` 未改、`git diff --stat` 不含 `tools/cli/run-checks.mjs`；原stage-content-contracts未改限定仅由005第3项与007真实选择替代为现具名Phase读取路径最小例外，既有必填项/校验强度/推进语义仍不变。
失败：末 Phase 仍是纯结算或没有覆盖全部 AC；或没有逐 phase 核对表；或表里有空行／只有"未跑"；或 verify-code 重跑全量；或新增了"必须有验收 Phase"的机器校验；或缺口的出现把任务冻结；仅本轮已授权路径读取例外不算新增验收Phase机器校验，除此以外原禁止项不变。
证据：该任务 `phases/` 原文 ＋ `phases/index.md` 末行 ＋ AC 全集对照 ＋ 核对表原文与行数 ＋ verify-code 回执 grep；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-13**：用户在真实任务上跑完至少两个 build-code phase，数提交条数与授权条数；关联 FR-C05AUD-004；来源 U-004／U-005①；F-41／F-42／F-43／F-44／R-013；owner **N11**（提交粒度＝每 phase 1 次 ＋ verify-code 结束一次完整的全部提交合并，U-004／U-005①）
验证：用户下一真实任务以 ORACLE-P2-AUTH 对场景原件逐项核；具体指令见该 Phase。用户在真实任务上跑完至少两个 build-code phase，数提交条数与授权条数
通过：① 对每个 phase 执行 `git log --oneline <phase base>..HEAD`，**该 phase 段内的提交数 = 1**（材料更新与 finding 修复都算在这 1 次里）；② `quality/evidence/git-authorizations/` 里 `*-authorize-commit*.json` 的条数 **≤ phase 数**（可能还有收尾那条），并抽样确认同一条 `commit` 授权的前后两个 HEAD 不同；③ 该 phase 的审查原件引用的送审对象是**当时的工作树 diff**（`git rev-parse HEAD` 在此期间未变），且该 phase 的提交发生在审查回执之后；④ verify-code 结束时目标分支已包含任务分支，且任务分支顶端提交包含该阶段全部材料与代码改动；⑤ 过程记录里**没有新增**任何"提交门"、提交账本或新的阶段字段
失败：一个 phase 段内提交数 >1（开发一次、测试改一次、审查改一次）；或授权条数与提交条数同量级增长（HEAD 一 HEAD 一授权）；或提交发生在审查之前；或新增了提交门／账本／字段
证据：`git log --oneline <phase base>..HEAD` 逐 phase ＋ 授权 JSON 清单与 `head` 取值 ＋ 审查原件时间序 ＋ `git diff --stat` 与 `facts.jsonl` 无新字段；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-14**：用户在真实任务上执行一次收尾，看 **PR 是否在合并前真实存在、链接是否已被推送给用户**、且全过程**没有阻塞**；关联 FR-C05AUD-005；来源 U-004／U-005②／U-011①；F-51／F-52／F-53／F-54／R-014；owner N12（**不阻塞，只把链接推送给用户**；收尾两段式＝同一次执行流内先建 PR、推送链接、再合并，**不等用户回话、不需新确认**——U-011①；父代理裁定见 `## 冲突待裁` 第 3 条）
验证：用户下一真实任务以 ORACLE-P4-CLOSE 对场景原件逐项核；具体指令见该 Phase。用户在真实任务上执行一次收尾，看 **PR 是否在合并前真实存在、链接是否已被推送给用户**、且全过程**没有阻塞**
通过：① **PR 在合并前真实存在**：close-action 记录里 `pr` 为 `completed`，且执行输出与 `inspectDeliveryCloseState` 的 `pr.url` 里能读到真实 PR 地址；② **其链接已被推送给用户**：面向用户的输出里含该 PR 地址（同一次执行流的输出即可核）；③ 同一次执行流内继续完成合并与归档：`commit`／`push-task`／`pr`／`merge` 均为 `completed`，目标分支已含任务提交、worktree 与本地任务分支按默认安全收口移除；④ `gh pr view <url>` 能查到该 PR，其 `createdAt` 早于 `mergedAt`（＝PR 确实先于合并存在；已合并＝`MERGED` 属正常，不判失败）——**按仓库内可复现的命令取证**；⑤ **没有**新增 close 子命令、第二次确认或新持久状态（仍只有那一条七步不变量）；⑥ 全过程**不等用户回话**（该次执行不停在 `partial`、不需要用户随后执行第二段）
失败：PR 只在合并不成立（`pr` 记录缺失或 `pr.url` 打不开）；或 PR 被建但**链接没有推送给用户**；或该次执行停在 `partial` 等用户回话／需要用户随后执行第二段；或新增了第二次确认／新子命令／新持久状态
证据：该次执行返回体与 close-action 记录 ＋ `gh pr view <url>` 的 `createdAt`／`mergedAt` 真实远端对照 ＋ `git merge-base --is-ancestor` ＋ `grep -rn "stopAfter" <close 收口路径>`（竖线在正文里写作"或"，避免破坏表列）；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-15**：用户在真实任务上，让人为把某一 Phase 的声明写集与任务授权范围**不一致**（声明写集只含 A，却准备改 B），看流程怎么处置；关联 FR-C05AUD-006；来源 U-008①／U-011②；F-23／F-24／F-25／F-60／R-006；owner N14（工具仓库不定义类别，只要求动手前显式读取并引用项目自己声明的类别——U-011②）
验证：用户下一真实任务以 ORACLE-P1-PLAN 对场景原件逐项核；具体指令见该 Phase。用户在真实任务上，让人为把某一 Phase 的声明写集与任务授权范围**不一致**（声明写集只含 A，却准备改 B），看流程怎么处置
通过：① 该处改动**被停下**，过程记录里能读到三项事实：越界的**具体文件／符号**、所依据的**授权原文位置**、缺的是**哪一条确认**；② 记录里**没有**出现由实施方自己写下的"已有裁决覆盖／不增审批门"式结论；③ 材料里凡出现"已确认／逐字／已产生"的断言，其指向的原件路径**真实存在且可打开**（把材料里所有此类断言的路径逐个打开，**0 个 404**）；④ 该任务全流程的"人确认"次数与既有口径一致（**最终 close 一次** ＋ 方向／计划两道既有选择），不因本模块新增；⑤ 动手前**显式读取并引用了项目自己声明的类别**（记录里能看到"按某项目某处声明的类别"这一引用），而**不是**引用工具仓库下发的类别清单；⑥ **停等只适用于项目声明的受保护类别**：本用例的 B 必须声明为该项目自己声明的受保护类别之一（如引擎／DSL／数据库／产品代码），该处**停下**；同一用例里另改一处**纯文档／注释／测试夹具**类的越界，则按 U-008① **继续做并登记**，不被停下——两条路径都要在本用例里出现并可判
失败：越界改动由实施方自己认定"已有裁决覆盖"后放行；或材料里"已确认"指向的原件打不开／从未产生；或人确认次数增加（＝新审批门）；或工具仓库自己定义了一套类别清单让执行者照抄
证据：该任务处置记录 ＋ 授权 JSON／确认件原文（`quality/evidence/git-authorizations/*.json` 与 `human-confirmations/`）＋ 逐个打开材料里"已确认"指向的路径 ＋ 人确认次数清单；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-16**：用户另跑一个真实任务，其中至少发生一次会触碰小节标题的批量改写（例如替换某个标题下的整段内容）；关联 FR-C05AUD-006；来源 U-010③；F-17／F-56（编辑事故重复）；`03:219-226`／F-63；owner N15（**只写进写作规范，不动代码**，U-010③）
验证：用户下一真实任务以 ORACLE-P1-PLAN 对场景原件逐项核；具体指令见该 Phase。用户另跑一个真实任务，其中至少发生一次会触碰小节标题的批量改写（例如替换某个标题下的整段内容）
通过：① 每个被改文件的小节标题数在改写前后一致，`grep -n '^#' <被改文件>` 里改写前存在的标题**逐字仍在**；② 当次编辑说明里能读到"本轮涉及文件＋标题清单"这一事实；③ 仓库里**没有**新增任何运行时函数、CLI 工具或 pre-hook 拦截器（`runtime/interface/safe-write.mjs` 逐字未改）；④ 发生标题丢失时按规范**先恢复原文件再重新编辑**，没有出现"手工补标题"
失败：被改文件的小节标题被旧锚点替换吃掉（card-05 重复 4–6 次的形态、本会话 6 次的形态）；或改写后靠手工补标题掩盖；或为兜住它新增了函数／命令／检查链条目
证据：`grep -n '^#' <被改文件>` 前后对照 ＋ 当次编辑说明 ＋ `git diff --name-only` 中 `runtime/interface/safe-write.mjs` 未出现；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-17**：读下一个真实任务的 `decision-log.md`，逐节问"build-plan 写 spec 与 phases 时要不要读它"，再核表与指针的去向；关联 FR-C05AUD-007；来源 U-014①／U-014③／U-015；F-65／F-67／F-68；owner N16
验证：用户下一真实任务以 ORACLE-P5-DECISION 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务的 `decision-log.md`，逐节问"build-plan 写 spec 与 phases 时要不要读它"，再核表与指针的去向
通过：每一节都能被判为"build-plan 写 spec 与 phases 时要读"；节内一段一主题、结论在前、节首说明本节回答什么问题；**写集表与 AC 表逐行保留在主文**；只是证明与过程的内容以指针代替，指针能定位到原件
失败：出现把多个主题硬挤成一句而读不出结论；或把写集表与 AC 表整块搬进外置件，导致 build-plan 必须读外置件才能取到接口
证据：该任务 `decision-log.md` 逐节 ＋ 写集表与 AC 表所在节 ＋ `## 外置事实索引` 的到达条件；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-18**：读下一个真实任务的 `## 外置事实索引`，逐条核每个**被外置的原件是否可达、可读、可回读**（不核篇幅，不核"该不该外置"）；关联 FR-C05AUD-007；来源 U-014①／U-016；F-68／`raw/20` 第 7 节；owner N18
验证：用户下一真实任务以 ORACLE-P5-ENTRY 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务的 `## 外置事实索引`，逐条核每个**被外置的原件是否可达、可读、可回读**（不核篇幅，不核"该不该外置"）
通过：① 索引列出的每条外置件**按索引的基准目录加相对路径逐个可打开**（与索引口径同一套路径，0 个 404）；② 每条指针写明**什么条件下要读**与**主文留了什么**，回读原件能取到索引声称的内容，不出现"指到不存在的位置"；③ 判断依据是**内容**（该节是否为 build-plan 直接消费）而**不是篇幅数字**（U-015）
失败：索引里指到的外置件打不开；或同一原件在 worktree 与任务库之间出现两个不一致的路径；或以篇幅数字为由删内容具名理由；或外置件建了但主文 0 引用
证据：该任务 `## 外置事实索引` ＋ 逐条按基准目录打开外置件 ＋ `grep` 主文引用位置；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-19**：读下一个真实任务的 `phases/`，看文件名与 phase 数量；关联 FR-C05AUD-003；来源 U-013／U-014②；R-016／R-017；owner N17
验证：用户下一真实任务以 ORACLE-P1-PLAN 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务的 `phases/`，看文件名与 phase 数量
通过：每个 phase 文件名形如 `P<n>-<任务或工作包短名>.md`；phase 数与"独立可交付、可验收"的划分一致；工作包多于可交付物而拆分时，spec 里写明为什么拆
失败：文件名只有 `P1`、`P2`；或 phase 数明显多于工作包且 spec 没有说明
证据：该任务 `phases/` 文件清单 ＋ `spec.md` 的拆分理由段；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-20**：读下一个真实任务的外置件与主文，看外置件是否真的可达、可读；关联 FR-C05AUD-007；来源 U-014①／U-016；F-68／`raw/20` 第 7 节；owner N18
验证：用户下一真实任务以 ORACLE-P5-ENTRY 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务的外置件与主文，看外置件是否真的可达、可读
通过：外置件位于主文索引给出的基准目录、**按索引的基准目录加相对路径可打开**（与索引口径同一套）；审查材料解析路径能读到外置原件（N18 定范围后核）；主文引用外置件的位置能被 `grep` 命中
失败：外置件建了但不在被审查也读不到的路径上；或同一原件在 worktree 与任务库之间出现两个不一致的路径
证据：该任务外置件路径逐个打开 ＋ 审查送审材料的实际解析路径 ＋ `grep` 主文引用；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-21**：读下一个真实任务的 `decision-log.md` 里任意一块决策，看形状是否达标；关联 FR-C05AUD-007；来源 U-016③／U-017①；F-9；owner N16
验证：用户下一真实任务以 ORACLE-P5-DECISION 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务的 `decision-log.md` 里任意一块决策，看形状是否达标
<!-- markdownlint-disable-next-line MD038 — source-locked literal spaces are intentional -->
通过：① 每块固定 **4 个字段**（做什么／不做什么／风险／改动），字段数固定即 4；② 每个字段内的**每一条要点**（含子要点）**只讲一件事**，一个字段需要讲多件事时以子要点（`  - `）逐条列；③ 每条第 1 句即结论，依据、边界与例外写在结论之后；④ 标题是含动作动词、脱离正文能读懂的目标句；⑤ **不含任何长度／字数要求**（不设上限、不设评分器、不据此判完成）；⑥ **不规定"每块恰好 4 条要点"**；⑦ 上述各项**由既有检查器以事实报告，不构成推进阻断**（`tools/cli/run-checks.mjs:146-147` 逐字不入 `failures`）
失败：某块缺少 4 个字段之一或出现第 5 个字段；或一条要点（含子要点）里塞 2 个以上主题；或要点以铺垫／背景／复述缺陷起头；或标题只写 `N1` 或只有抽象名词；或仍以"每块恰好／最多 4 条要点"判达标；或出现以字数／行数判定达标的写法
证据：该任务 `decision-log.md` 的 `## 模块清单` 逐块原文（本材料 `## 模块清单` 的 19 块即同一形状的当场证据）；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-22**：读下一个真实任务的 `decision-log.md` 的节级消费者表与 `## 外置事实索引`，看**外置面的划分**是否按"下游哪一步读它"判的；关联 FR-C05AUD-007；来源 U-016②／U-017②；F-4／F-65／F-67／F-68；owner N19
验证：用户下一真实任务以 ORACLE-P5-DECISION 对场景原件逐项核；具体指令见该 Phase。读下一个真实任务的 `decision-log.md` 的节级消费者表与 `## 外置事实索引`，看**外置面的划分**是否按"下游哪一步读它"判的
通过：① 存在**节级消费者表**，逐节写明"这一节给下游哪一步读、判据是逐字带 `##` 前缀还是按内容"；② `## 需求变更记录` 按 U-016 **整节外置**，主文只留指针；③ 仍留在主文的每一节都能给出"build-plan 写 spec 或 phases 时读它"的具名理由
失败：存在节级消费者表但某节未列且给不出理由；或以篇幅数字（行数／字节）作为外置与否的判据；或 `## 需求变更记录` 仍未外置、主文重复铺开
证据：该任务 `decision-log.md` 的 `## 外置事实索引` 节级消费者表 ＋ `## 需求变更记录` 所在位置与指针；仅声明所需原件，不代表本次已执行或通过。

- [ ] **AC-C05AUD-23**：对下一个真实任务的 decision-log 跑一次 `check-decision-log-chain`，看它是否真能识别决策块；关联 FR-C05AUD-007；来源 U-017①；F-67；owner N20
验证：用户下一真实任务以 ORACLE-P5-CHECKER 对场景原件逐项核；具体指令见该 Phase。对下一个真实任务的 decision-log 跑一次 `check-decision-log-chain`，看它是否真能识别决策块
通过：① `recognized_blocks > 0`（修前实测为 0 且恒 exit 0）；② 材料指向不存在的小节／编号时**有输出**，"引用自洽"与"结构存在性"两项检查各自有输出形态；③ 输出只报事实、**不改变推进**（advisory 语义不变，不写入 `failures`）；④ **不含篇幅或字数检查**
失败：仍只认 `ADR-NNN` 而本材料用 `#### N — …` 时 `recognized_blocks = 0`；或引用自洽／结构存在性任一项无输出；或检查结果改变推进／写入 `failures`；或新增第二个检查器
证据：`tools/cli/check-decision-log-chain.mjs` 实跑输出与 exit code ＋ `tools/cli/run-checks.mjs:143-148` 的 advisory 语义未变；仅声明所需原件，不代表本次已执行或通过。

<!-- APPEND-ONLY-2026-10-13-MINIMAL-REPAIR: START -->

本轮追加条款由 U-020/U-021 与 N21–N23 引出；以下仍属于唯一 Appendix A，只新增 AC-C05AUD-24 至 AC-C05AUD-29，不修改上文 AC-C05AUD-01 至 AC-C05AUD-23 的条件、未知结论或真实任务边界。

- **AC-C05AUD-24**：验收对象、输入、执行 owner 与发生时点清楚；来源 U-020/N21；FR-C05AUD-009。
验证：独立读者消费修改后的四份方法/模板与完整作者示例，逐项定位当前技术结果、独立人读结果和真实用户效果的输入、生产者、消费者、时点及执行 owner，并检查有可执行产物或混合交付时末 Phase 预留必要未闭环场景；纯文档/纯方法工作流保留现Test design and quality的G-2具名豁免、具体理由/风险/客观替代，不能扩成全部任务一律实跑。本轮含adapter运行行为，属于混合交付，不适用该豁免。只按原 oracle 核，不能加上 provider 理解或任意自然语言评分要求。
通过：各条件可对应实际输入和执行动作；未具备输入的具体条件提前可见；完整示例由真实生产 parser 与构包消费者验证。纯只读聚合清楚限定为原件读回，适用范围及G-2具名豁免原条件保留。
失败：整批技术条件无理由推下一任务；只读聚合冒称 E2E；受控测试冒真实用户效果；改大原 oracle；示例必须靠测试作者补 trace 或改字段才能消费。
证据：P9/T015 的具名独立文档读回、完整示例原字节与目标命令原件；P11/T019 的完整消费者回归原件。材料存在或结构通过不能代替独立人读结论。

- **AC-C05AUD-25**：现有回复解释质量事实；来源 U-020/N22；FR-C05AUD-010。
验证：独立消费 verify-code 收尾方法，以具名 review_result_ref 与 facts 中 finding 处置、测试/功能原件指针说明 provider 终态、修复情况与具体缺输入条件；对全成功、失败 sibling、缺原件分别读回。
通过：thinQuality 和 status JSON 键及质量 enum 保持原义；回复可区分审查可用性、finding 处置、技术证据与业务限制，并给真实来源。all-success 不自动升级整阶段质量，原失败保持。
失败：把 incomplete 等同全部功能坏了，或把 finding fixed/工具读取/exit0 当完整业务通过；新增 status 解释字段、质量聚合器或第二事实对象；缺原件仍编造结论。
证据：P10/T016 的具名独立人读反例与保全记录；既有 status 输出形状读回和原件引用。没有新增 reply renderer。

- **AC-C05AUD-26**：原生局部读取事实可回读；来源 U-020/N22；FR-C05AUD-011。
验证：通过现 runConfiguredOcrHostReview 与本地假 CLI，驱动真实 AG guard/Kimi reader；在 dispose 前把原 audit 字节一次交现 rawOutputSink，读回 evidence_refs 和原字节，核 session/path/hash/分页及输出截断。
通过：只有可靠完整文件观察进入既有 material_coverage.read；部分页、部分行、未知完整度留 undetermined 并指向原 audit。其它路径不凭缺事件判 unread；Codex 原 stdout 的局部工具观察保原，read_confirmed 可为 null。
失败：有局部观察却丢原件；partial 或工具成功调用冒全文；保存前清理；伪造安全路径、session/hash、已存指针或 provider 理解；扩大 schema/字段。
证据：P10/T017 目标测试原始输出、audit 原字节和现 review 原件引用；明确假 CLI、受控 packet 与真实 provider/理解未覆盖。

- **AC-C05AUD-27**：原生重试与失败生命周期如实呈现；来源 U-020/N22；FR-C05AUD-012。
验证：对原生 retry 事件、未知/截断事件、失败 sibling、取消、raw/audit 保存失败及 cleanup 失败做本地受控负例，消费现 execution.recovery、unavailable_diagnostics、原失败和独立 sibling 结果。本次直接native宿主每provider只有一次初始执行，额外fresh retry与same-session repair均无实际动作；两者0由该真实调用路径支持，不构造无consumer的非零策略。
通过：确证 internal retry 由可靠完整CLI事件计算；本次宿主 fresh retry/repair 两计数按已证单次初始执行、无额外动作保持0；native数量未知时整个recovery容器保 null/缺省及具体说明，不填伪0；原始错误类别不推断网络根因；成功 sibling/findings 与已存字节不丢，保存/清理失败显式可见。
失败：宿主0被宣称全链0；APIConnectionError直接定因DNS；盲增retry/timeout或换provider；失败、取消、保存失败被漂白；清理前丢取证。
证据：P10/T017 的同 oracle RED/GREEN、取消恢复与保存失败原件；现 diagnostics/recovery 读回，网络配置与真实网络效果不在本次验收。

- **AC-C05AUD-28**：public verify 三字段与保全有永久源码回归；来源 U-020/N23；FR-C05AUD-013。
验证：独占测试经真实 public verify --action=execute 运行 exit7/0/124/null/130，读真实 receipt/raw 与 facts evidence exact key-set，再经 public run 更新 cursor，核旧 source/evidence/原始字节保全。
通过：整数 evidence 恰含 command/exit_code/failure_signature；null 不伪造整数项；新 refs 真实可达，原 source/evidence/cursor 不互相覆盖。预写错误替身能分别打红多键、缺键、错误 exit 与覆盖 source。
失败：只局部匹配三键、只测私有 helper、使用自写 receipt 冒 public 入口；破坏旧字节或把 ENOENT/null 改整数成功。
证据：P11/T018 的新永久测试源码、真实 CLI 定向输出、独立错误替身检验与原 receipt/raw 引用；旧外置013/016保历史，不再作为唯一常规回归。

- **AC-C05AUD-29**：完整作者材料可被真实消费者核对；来源 U-020/N23；FR-C05AUD-014。
验证：直接抽 P9 模板内完整 spec/index/具名 P1 行为/P2 纯.md G2 四块，只替具名环境占位；依次调用 validatePostPhaseContract、prepareTaskBoundBuildCodeReviewBundle 并读真实 source.json。缺 source、漏 AC、错 oracle、空/越界 scope、G2 混代码分别负控。
通过：正常完整小样例零结构错误且 literal trace 与 source.json 一致；可入包的错误完整投影，非法 scope 保现错误；正常流程不因其它结构错误新增运行门；未知/延期不变已执行。P11 末验收覆盖本轮24–29各条件且旧23逐项仍以原件 unknown 展示。
失败：抽12行后在测试内补造合法 fixture、改标签/oracle/trace；只调用 parser 不读真实 source.json；为旧108错误改旧正文/validator；把本次技术测试宣称旧23通过。
证据：P11/T019 完整消费与负控原件、P9/P10上游原件引用、具名独立人读及本轮逐 AC 结论。缺完整示例的初始失败属于真实材料缺失，不冒运行行为 RED。

## 2026-10-13 本次追加规格与全局实现设计

本节仅承接 U-020/U-021、N21–N23 的新增范围，当前决策与计划已由用户确认，按真实回复“确认决策与计划，停在计划交接”停在规划交接，不开始生产实施；确认原件为TASK/quality/evidence/2026-10-13-067-user-final-decision-plan-confirmation.md，所确认展示为066-final-decision-plan-display.md。原正文是不可覆盖前缀；原 P1–P8、23 AC、六冻结测试与旧报告保原，不利用新增条款倒填历史通过。TASK 指外置任务根 /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-card05-stage-defect-audit-20261012，WT 为本 spec 所在认证工作树。

### 需求解释与场景

维护者需要在本次可获得的输入上完成技术验收，并在收尾读懂哪些问题已修、哪些审查失败、哪些真实效果仍缺输入。顺序为先修作者的验收设计，再修现回复与原生取证，最后把已暴露接缝留为永久回归。用户明确排除真实任务验证；本轮结果不会把旧23项批量转成 pass。

SCN-006：未来计划作者读取模板，按每条 AC 的实际对象安排输入与执行 owner；末 Phase 能执行尚缺的必要 case，独立读者能指出什么结果需真实任务输入。
SCN-007：一次受控审查部分读取、原生重试后有一条失败；维护者能从现原件看到范围、失败和成功 sibling，收尾解释没有合并成一个含混标签。
SCN-008：日后修改 public verify 或作者模板，具名永久回归在字段膨胀、source 覆盖或完整材料失配时直接失败，原失败可复放。

### 产品事实与新增需求

- **PFACT-009**：verified；038研究与本轮源码实读确认 thinQuality 不计算业务完成，status 没有人读解释字段；影响 SCN-007、FR-C05AUD-010。
- **PFACT-010**：verified；adapter 已有 native guard/reader、rawOutputSink、material_coverage、recovery/diagnostics 容器；AG当前全或无投影、Kimi不投影分页、retry宿主0不能证明全链0；影响 SCN-007、FR-C05AUD-011/012。
- **PFACT-011**：verified；现 public 三键生产修复已在 stage-runtime，外置016是精确探针；旧模板测试仅抽12行再组合法 fixture；影响 SCN-008、FR-C05AUD-013/014。
- **PFACT-012**：unknown；真实用户任务、provider理解、Kimi底层连接根因未在本次观察；owner分别为未来获授权任务执行者、独立审查者与真实transport owner；影响本轮覆盖上限，不能当失败已修。
- **FR-C05AUD-009**：现验收正文与示例区分结果对象/输入/owner/时点，保持原 oracle；source U-020，N21，current；SCN-006，PFACT-011，AC-C05AUD-24。
- **FR-C05AUD-010**：现verify-code回复消费现facts/review解释限制，不扩status JSON；source U-020，N22，current；SCN-007，PFACT-009，AC-C05AUD-25。
- **FR-C05AUD-011**：取证在清理前单存，可靠完整观察才read，部分/未知保原件与undetermined；source U-020，N22，current；SCN-007，PFACT-010，AC-C05AUD-26。
- **FR-C05AUD-012**：现recovery/diagnostics表达真实internal retry与失败/取消/清理，保成功sibling；source U-020，N22，current；SCN-007，PFACT-010/012，AC-C05AUD-27。
- **FR-C05AUD-013**：public verify精确三键及refs/source/cursor保全成为独占永久回归；source U-020，N23，current；SCN-008，PFACT-011，AC-C05AUD-28。
- **FR-C05AUD-014**：完整作者小样例→parser→真实source.json永久回归，含显式负控；source U-020，N23，current；SCN-008，PFACT-011，AC-C05AUD-29。

U-019/033/038是研究来源，U-020是范围选择，U-021是追加保存边界；研究报告不替用户决定。每条 AC 的唯一条件仍在上方 Appendix A 续条，本节不复制判据。

### 架构选择、接口与失败语义

沿现作者、adapter、writer、status与人读回复的owner分工。生产只改既有 adapter，不新增模块、schema、命令、持久对象或事实聚合器。工具事件仅证明可观察读取，不能证明理解；read路径数组不能表达范围的部分事实留在单份原audit。与“另做新状态/账本/全文阅读门”相比，复用现入口能保原失败并减少第二权威。取舍来源 N21–N23/038。

本轮实读锚点（2026-10-13，工具 exec_command/sed/rg）：tools/cli/stage-runtime.mjs:973–984 thinQuality；:1098–1104 status；:833–842 三键投影；:535–551 phaseReviewSourceProjection；:565 prepareTaskBoundBuildCodeReviewBundle。runtime/stage/stage-content-contracts.mjs:370 validatePostPhaseContract；:621首实现设计.find；skills/wh-review/scripts/review-materials.mjs:763 source.json。runtime/review/ocr-delegation-adapter.mjs:1053 installAgPacketGuard、1121 installKimiPacketReader、1552 native close、1642 runConfiguredOcrHostReview、1785 projectProviderResult、1945 finally。

已核接口逐字名：runConfiguredOcrHostReview 的第二参数 loadConfig/resolveRoute/selectProviders/readConfig/trustedContext/sourceBundle/providerExecutor/onProviderHealth/onProviderResult/rawOutputSink/healthPollMs。status quality 当前键为 status/review_origin/review_result_ref；materialCoverage键为 provider/read/unread/undetermined；recovery键为 fresh_execution_retry_count/provider_internal_retry_count/same_session_repair_count，容器允许null；unavailable_diagnostics键为code/message。保这些字段，不新增provider理解字段。其余未逐字复核的依赖签名按unknown留实施者动手前读取，不宣称全部不变。

AG/Kimi可信完整文件观察才进read；Kimi只见部分页或AG只见部分行不升级。Codex保null与现raw指针，不做任意shell解释器。每个provider的audit原字节经现rawOutputSink单存到现review原件，再由既有evidence_refs引用；清理时已保存refs可读。保存失败用现错误与diagnostics保失败，不声称已保存；失败路顶层coverage仍由现writer保undetermined。确证retry计数与未知分别处理，未知不填0。连接根因排除在本次实现。

### 本次全局文件边界与owner

P9唯一持笔四文件：skills/spec-plan/SKILL.md；skills/spec-plan/templates/phase-template.md；skills/spec-specify/templates/spec-template.md；workflows/build-plan/SKILL.md。P10唯一持笔：workflows/verify-code/SKILL.md；runtime/review/ocr-delegation-adapter.mjs；tests/contract/card05-native-observation-target.test.mjs。P11唯一持笔：tests/contract/stage-evidence-contract.test.mjs；tests/contract/card05-author-material-consumer.test.mjs；docs/architecture/move-map.json。合计10条精确路径，规划材料的追加不冒生产写集。

三独占测试已由本轮build-plan测试作者在预写前登记move-map并实际创建，见048；这是build-plan已有步骤8的工作。用户P9→P10→P11是后续实施顺序，不限制本轮标准预写，P10没有依赖未来P11推进的登记前置。登记须写唯一Vitest定向consumer、owner、替代外置probe/旧过强覆盖结论的关系、等价现consumer接管后删除重复测试的条件。build-code只消费已冻结oracle；P10/P11不因持笔登记而有放松断言权，改变必须走既有test change request与独立审查。P11对登记只核其实际内容与必要维护。

DNT：本task原decision/spec/index前缀、P1–P8、原23AC、六冻结tests；tools/cli/stage-runtime.mjs；runtime/stage/stage-content-contracts.mjs；runtime/review/review-record-route.mjs；runtime/review/schemas/result.schema.json；runtime/task/task-store.mjs；网络/provider配置、CI/hooks与原始review/test报告。六冻结文件按原spec:126–133具名清单逐项保原。post-build-plan-missing-index.test.mjs虽不在六目标清单，本次也只读，另建独占完整消费者测试。旧P1写集与新增P9/P10重叠只是时序沿用owner事实，P1–P8不再重跑编辑；不改旧Phase以消重复提示。

### 追加范围的依赖、并行与验收流程

P9→P10→P11，顺序来自U-020；P9/T015交可独立读回且可生产消费的作者示例；P10/T016解释方法，T017原生事实，相同Phase内分别独立文件，完成后一起交P11；P11/T018与T019可并行读/写各自独占测试，主owner串行登记与最终对账。并发2：一实施一独立审查/取证，必要时P11两测试作者并行；共享文件只一个持笔者。P9的示例测试由规划预写提供，P9不依赖尚未实施的P11，也不偷改测试。

用户可见接口为CLI原件与agent回复，无网页、组件或前端改动。UI三来源：raw_requirement=U-020明示方法/取证/回归；project_inventory=本轮实读10路径均文档/Node CLI/backend测试；planned_or_changed_frontend_fact=本追加写集无前端路径。故浏览器/视觉/a11y不适用，不调用浏览器QA；这不是全仓零UI证明。

P11为本次追加范围唯一末验收Phase，逐条核24–29全部条件，引用上游原件并实跑必要未闭环case。原AC01–23逐项引用TASK/quality/evidence/2026-10-13-030-acceptance-root-cause-research.md与现功能原件继续unknown，既不重定义也不运行真实任务；最终报告不得说全29业务已通过。原P8纯聚合职责只作为历史输入；不新增P12。

### 追加范围的需求到任务追踪

| 来源/决定 | 需求/验收 | Phase/Task | oracle | 真实消费者 |
| --- | --- | --- | --- | --- |
| U-020/N21 | FR-C05AUD-009 / AC-C05AUD-24 | P9/T015 | ORACLE-P9-ACCEPTANCE-DESIGN | 未来build-plan作者与独立读者 |
| U-020/N22 | FR-C05AUD-010 / AC-C05AUD-25 | P10/T016 | ORACLE-P10-REPLY-FACTS | verify-code实际回复 |
| U-020/N22 | FR-C05AUD-011 / AC-C05AUD-26 | P10/T017 | ORACLE-P10-NATIVE-FACTS | review原件与人读 |
| U-020/N22 | FR-C05AUD-012 / AC-C05AUD-27 | P10/T017 | ORACLE-P10-NATIVE-FACTS | recovery/diagnostics读取者 |
| U-020/N23 | FR-C05AUD-013 / AC-C05AUD-28 | P11/T018 | ORACLE-P11-EXACT-THREE-KEYS | public verify/cursor回归 |
| U-020/N23 | FR-C05AUD-014 / AC-C05AUD-29 | P11/T019 | ORACLE-P11-AUTHOR-SOURCE | parser与真实source.json |
| U-020/U-021/N21–N23 | FR-C05AUD-009、FR-C05AUD-010、FR-C05AUD-011、FR-C05AUD-012、FR-C05AUD-013、FR-C05AUD-014；AC-C05AUD-24、AC-C05AUD-25、AC-C05AUD-26、AC-C05AUD-27、AC-C05AUD-28、AC-C05AUD-29 | P11/T019 | ORACLE-P11-AUTHOR-SOURCE | 本轮独立末验收 |

### 测试标准与全局验证策略

主具体testing skill预判为backend-testing（只记录，不在build-plan调用）；P9/T015与P10/T016为simple/G2文档独立读回，P10/T017涉及并发取消选fullstack风险档但测试面限本地后端进程/持久化，P11为feature真实CLI/材料consumer。routing档位不代测试面；无数据库、HTTP API、真实网络或前端测试，因本次不改这些消费者。

测试面为：文档原oracle/示例消费；CLI序列化与source/cursor保全；native原件持久化/范围/重试；失败、取消、cleanup与成功sibling并发；真实parser→source.json。每面具名命令归所属Phase。规划预写测试的初始结果按实际区分“目标行为RED”“材料缺样例”“本来通过”“环境失败”；三键已修当前可能本来GREEN，须错误替身检验证伪能力，不造生产倒退。范围仅新增3测试及受影响现邻控，不跑全量vitest/npm test/test:safe；不以新测试替代独立人读或常规审查。现有close四窗口已永久回归，无本轮close改动则不机械重跑。

当前parser只用spec首个实现设计节，因此本追加trace尚不会进入其原first-match消费；只能如实保存全当前材料解析错误，不为GREEN改旧正文或validator。完整小作者示例是未来新材料的生产consumer测试对象，和本task追加材料parser结果分别报告；不能以小样例GREEN掩盖整个旧task结构事实。index只在原尾追加三表行，不加第二## Execution Index或新表头。

### 风险、未决、回退与宪法对照

RISK-APPEND：首节parser不消费新trace及旧重复写集错误继续存在；影响材料结构报告，不妨碍同task有源规划/安全修复。owner主会话/材料作者，保持原失败、交独立审查，不扩大parser。
RISK-READ：工具事件不足以证明完整文件；owner adapter实施者，只把可靠完整观察列read，partial保原件。
RISK-RAW：audit可能含宿主路径；owner adapter实施者沿现允许数据边界保存最小原生取证，不输出秘密，不整树留存；若现事件含敏感字段，先明确具体字段与现脱敏owner，不能把重构文本叫原始字节。
RISK-RETRY：截断/缺事件时无法确定总数；owner adapter实施者，现null/diagnostics显露未知。
OPEN-RED：预写目标已由独立测试作者执行，真实归因见下方065/066/077（旧067/072保原）；实施后GREEN与未达后继仍待验证，不能将本来GREEN、材料缺口、目标RED混为一类。OPEN-REVIEW：新增方法的人读与独立正式审查尚未由本作者产出，主会话接续。
回退仅撤本次新hunk并保真实失败/原件；不可整份checkout覆盖别人的工作，不删除旧测试/旧事实；最终close仍须用户一次确认。

宪法逐项对照：F1复用现owner；F2不增公共接口；F3只追加真实范围；F4失败继续修且不洗白；F5无新stage/gate；F6单原件/无第二对象；F7 Git与close按实际授权分离；F8无compatibility bridge；F9未知显式；F10仅具名定向测试；F11结构事实不作许可。Q1保测试/AC/审查/交接义务；Q2进度与完成分离；Q3作者不自判质量，独立来源收口。S1/S2复用现方法；S3本次不升级上游，源码版本事实实读；S4不造指标平台；S5独立上下文；S6承接现固定上游与033研究；S7沿原五阶段；S8方法不绑定本task绝对路径，绝对根仅在本任务材料导航。

<!-- APPEND-ONLY-2026-10-13-MINIMAL-REPAIR: END -->

本轮示例消费约定：phase-template新增四个紧接markdown fence的marker，分别为`<!-- card05-author-example:spec -->`、`<!-- card05-author-example:index -->`、`<!-- card05-author-example:phase-behavior -->`、`<!-- card05-author-example:phase-document -->`。只允许替换显式`{{TASK_ID}}`、`{{TASK_ROOT}}`、`{{WORKTREE_ROOT}}`；其余正文原样消费。示例source固定R-001/R-002，FR-EXAMPLE-001/002，AC-EXAMPLE-001/002，P1-行为结果.md/T001与P2-文档核对.md/T002，oracle为ORACLE-EXAMPLE-BEHAVIOR/ORACLE-EXAMPLE-DOCUMENT；fixture写集为src/owned.mjs与docs/owned.md，由测试实际创建源文件，不能在测试内改写模板路径以获合法性。

033仅作研究来源，其前三块按U-020采纳，第四步真实消费者任务验证排除。本次只做决策/计划及标准预写测试，当前具体决策与计划已获067原件所载真实确认，用户明确要求停在计划交接；生产/方法实施尚未授权，U-021保存边界及本次规划确认均不替实施授权。

环境事实增量（2026-10-13）：测试作者已报WT ./node_modules/.bin/vitest为ENOENT（环境失败原件060，不计RED）；实读main依赖vitest2.1.9与markdownlint-cli2 0.14.0的bin，Phase精确命令采用main实际安装入口且cwd为本WT。没有安装/新runner；方法模板继续可搬运，不植入本机绝对路径。

预写移交边界：三个独占测试已由本轮build-plan测试作者创建并在move-map事前登记；A/B仍按048绑定065/066冻结；native经TCR060/独立061批准，最新冻结见063-partial-read-tcr060-execution.md与076/077，旧048/056/067/071/072保原。后续P9/P10只修方法或adapter使现oracle满足，P11消费已有测试完成日常回归职责与新增范围验收，不再新增同名或另一套重复测试。测试评分逻辑变更仍须既有test change request与独立审查。执行引用以下方真实原件增量为准。

047独立分析的编码澄清：execution.recovery整个容器可为null或缺省；三个已存在计数字段仅允许非负整数，任何计数不确定时不写字段级null，也不补造0，使用整个容器null/缺省与现diagnostics说明具体缺证。

### 已发生的规划预写事实与冻结移交

本节只引用build-plan实际测试原件，未来GREEN/本轮功能验收仍须在实施后由独立来源判断；不覆盖旧原件。A/B测试冻结说明为TASK/quality/evidence/2026-10-13-048-minimal-repair-prewritten-test-freeze.md；native最新冻结说明为063-partial-read-tcr060-execution.md，依据060-partial-read-test-change-request.md与独立061批准；旧048/056及对应067/071/072仍保原。独立评分发现原件为047-increment-plan-spec-analyze.md。

| 新增源码 | 冻结SHA256 | 唯一当前receipt/raw | 实际归因 |
| --- | --- | --- | --- |
| tests/contract/card05-native-observation-target.test.mjs | 395ccd58004565ebfe34cbdc4b5446318240aa063928ac4460ef66b62ecfe3f2 | quality/tests/2026-10-13-077-p10-native-tcr060-thirteen-cases.json；quality/tests/2026-10-13-077-p10-native-tcr060-thirteen-cases.output | exit1；13case=10命名目标RED、3本来GREEN、0fixture失败；新增局部行/缺页case见076，截断历史见071 |
| tests/contract/stage-evidence-contract.test.mjs | 03c301bd3c986f8c190dbe33610d3c26afed5262c6e80904fafa3b3f18a337d0 | quality/tests/2026-10-13-065-p11-evidence-independent-f2.json；quality/tests/2026-10-13-065-p11-evidence-independent-f2.output | exit0；2case通过=1真实CLI链+1评分负控；当前生产机制本来GREEN |
| tests/contract/card05-author-material-consumer.test.mjs | 089dc1216beb54a1eb4a460843fe417d2f846a17d67af6ae183db9645c1f4a42 | quality/tests/2026-10-13-066-p11-author-independent-f1.json；quality/tests/2026-10-13-066-p11-author-independent-f1.output | exit1；7case停同一个完整spec示例缺失，生产链及6类后继负控均未达 |

原067的7目标失败（在072的原十case中结果保持）具体是AG/Kimi两项完整子文件投影丢失、audit未persist、9次native retry未映射、audit保存分支未尝试、取消后audit丢失、hash拒绝后audit丢失。hash拒绝行为已发生，不把它改称安全拒绝失效。其3项本来GREEN是retry未知保持解释、错误session仍保独立成功finding、Kimi trust cleanup显错且原stdout保留。前置断言失败后的读取完整度、save失败最终member/sibling状态、persist后拒绝记录等后继仍须GREEN时真正执行，不能按预写存在计通过。

A的多键/缺键/假exit/command/覆盖旧source是独立受控错误对象的评分敏感度验证，不是生产变异测试或额外真实CLI覆盖。047/F2的source负控已由原测试作者修正并在065实际到达。B的047/F1已改为固定literal AC/FR ids/count、command_oracle_checks.valid与完整原文trace，不再从parser输出重算期望；但066仍卡完整样例，因此这部分后继断言未执行，不声称F1行为已验证。

早期060-p11-evidence-permanent-baseline.json/.output为WT缺.bin/vitest的ENOENT，exit_code=null/调度127，只是环境失败；061/063/064旧执行原件均保原，不覆写成当前结果。实际命令、cwd与完整输出以上述065/066/077 receipt/raw为准；旧067/072保原，没有真实provider调用或OCR版本探测。

预写覆盖限制具名保留：输出硬截断已按TCR054实际执行，截断/前缀/refs/未知retry/失败coverage到达，但audit原件及其后继仍目标RED；AG局部行与Kimi缺页序列已由TCR060实际执行；AG误报全文为目标RED，Kimi保持undetermined已到达、随后audit缺失为目标RED，相关audit/range/cleanup后继未达。非零宿主fresh retry/repair在本次直接native链无真实动作或consumer，依059具名不适用，不列为待补假case。现测试不证明这些边界已修，当前不能宣称全边界覆盖；P10实施若触及对应分支，原测试作者在同一已声明测试文件内按既有test change request与独立审查补足必要oracle，保本次冻结与原失败；未补则本轮对应证据保持unknown，不用其它GREEN代填。P11完整作者正常链和后继负控必须在P9实际写好样例后运行；本轮规划不预造示例救绿。

三个测试已事前登记、创建并以上述hash冻结；P9/P10方法/adapter实现消费现oracle，P11复用已存在测试承担永久回归与末验收，不再新建同名或重复测试。测试评分持笔权不随Phase的实现owner转移。

已捕获的生产parser/保护读回：TASK/quality/tests/2026-10-13-068-increment-parser-protection-readback.json 与 .output；实际命令由现captureCommand保存，exit1为当前contract false诊断，不是质量通过。精确基准commit9c31a10c596cbabc0146571f90d4fc792692bf43，旧108→当前130；新增22仅首设计节未消费新增6FR/6AC/5Task绑定/5oracle。decision/spec/index旧前缀、P1–P8、六冻结tests逐一保全；当前11个实际Phase指针可读。该原件记录本句追加前的确切材料hash；本句只补原件引用，不回写原件或宣称parser通过。

019细节建议窄修：AC24与P9明确末Phase实跑义务仅适用于可执行/混合交付，纯文档/纯方法工作流保留现G-2具名豁免；本轮混合交付不豁免。三test登记和预写已在build-plan完成，P11未来只读回/维护既有条目；现move-map是原架构职责登记，不是新gate、账本或跨Phase推进前置。047两评分发现修后独立读回为TASK/quality/evidence/2026-10-13-050-increment-plan-f1-f2-readback.md：F1静态修正但B后继未达，F2评分负控已真实到达；不扩为计划或实现质量通过。

TCR054实际截断增量：TASK/quality/tests/2026-10-13-071-p10-truncation-tcr054-isolated.json 与 .output，精确 -t ORACLE-P10-OUTPUT-TRUNCATION，exit1，1失败/10跳过，Vitest 1.16秒；TASK/quality/tests/2026-10-13-072-p10-native-tcr054-eleven-cases.json 与 .output，只跑同一native文件11case，exit1，8目标RED/3本来GREEN/0fixture，Vitest 4.19秒。真实16MiB输出上限、恰16777216字节前缀、不完整retry后缀、原stdout ref/hash、recovery未知、失败coverage undetermined、watchdog=false均已到达；随后“audit恰一份”实际0份目标RED。audit内容、audit引用、先存后清理与packet后继断言未达，不称通过。旧十case逐名结果与067相同，两个新增源码串以外与旧冻结字节相同；这是一项同族audit缺失反例，不新造独立生产根因。TCR054时点native冻结SHA256=97773b5129547591c51cd9ac064309bbc40af2fefce3f1e90c0de6fb994a59da，历史fb5ee207164874be151b2761ced8842ea82321ea07ab63abe335cbba995782e3由056指向唯一原字节保存。

本次TCR054新增字节不属于正在执行的正式052请求已读版本；不改原request或重启审查，实际覆盖由独立Delta承接，不冒052已覆盖最终字节。

新旧计数适用范围：冻结旧正文中的8 Phase、19模块及其它原交付计数只描述原P1–P8/N原模块范围，不随本追加反写。此次新增P9–P11与N21–N23；当前物理index由现phaseFilesFromIndex实读为11个Phase，旧23项业务unknown仍保原条件与原件。索引原注记后新增表头采用GFM允许的无外侧竖线写法，与原6列顺序一致；其P9–P11数据行仍由现reader读取，修的是Markdown人读表形，不是机器漏Phase。

024/finding4适用范围澄清（source TASK/quality/evidence/2026-10-13-059-plan-findings-lint-native-retry-facts.md）：runConfiguredOcrHostReview按唯一providers逐项仅调用一次executor；默认native process/监督进程各只发起一次真实provider；后续map只投影、all只等待。故额外host fresh retry=0、same-session repair=0是本链已证动作事实，非零策略无当前consumer，不在本范围新增或造假case。native内部9次与host两个0分开，未知/截断整recovery容器null/缺省。AG局部行与缺页序列已由TCR060具名负例实际触达，仍有下游audit/range/cleanup必要条件未达；缺证保持未完成，和不存在非零host路径的不适用分开。当前判断不推断其它broker/provider内部链路。

TCR060最新事实与冻结：TASK/quality/evidence/2026-10-13-063-partial-read-tcr060-execution.md承接060请求与独立061批准。TASK/quality/tests/2026-10-13-076-p10-partial-tcr060-isolated.json 与 .output，精确两个新case，exit1/1.89秒，2失败11跳过；TASK/quality/tests/2026-10-13-077-p10-native-tcr060-thirteen-cases.json 与 .output，仅同一native文件13case，exit1/5.42秒，10目标RED+3本来GREEN+0fixture。原11case评分/源字节（移除新增串后）与977冻结相等、逐名结果与072相同。最新native SHA256=395ccd58004565ebfe34cbdc4b5446318240aa063928ac4460ef66b62ecfe3f2；旧048/056及旧执行原件保留，不回写。

AG真实pre/post传StartLine=1/EndLine=1，provider只见三行中的首行，现read_confirmed=true误报全文，是新观察到的有效行为RED；其逐path coverage/audit范围及清理后继未达。Kimi真实288B同hash源返回(0,128,true)/(0,128,true)/(224,64,false)，共320B仍缺中间96B；该path保持undetermined、read_confirmed非true已经到达，随后audit实际0份才RED，不能称缺页合并算法错误。audit三条事件原样保留、small完整正控、refs/range/cleanup后继未达。保守undetermined是允许结果，不增加正向多页拼全算法、任意工具或非零host策略；059的host非零无consumer适用理由保留。

本次TCR060新增引用与字节不冒正式052已读覆盖；最终覆盖由已安排的独立Delta核对，实施及后继GREEN仍未完成。
