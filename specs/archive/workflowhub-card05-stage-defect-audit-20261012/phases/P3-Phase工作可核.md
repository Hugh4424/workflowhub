# Phase P3 — Phase工作可核

读者：本 Phase 实施者、独立读取者与Phase审查者与P4收尾执行者及P5覆盖作者。
读完要能：沿完整卡找到第一处动作、正反oracle、范围与恢复；这是草案，不写执行状态。

## Phase 契约头

- **规则锚**: spec.md「### 接口与失败语义」；spec.md「## 测试标准」；decision-log.md「### N1 把已算出却被丢掉的校验结果接到边界，并让 Phase 声明的命令真跑」；decision-log.md「### N9 让 build-code 按声明的面真跑，并堵住两个逃逸口」；decision-log.md「### N11 补回提交粒度的正面条款，并把授权粒度改成绑分支加阶段」；decision-log.md「### N14 动手前读项目自己声明的受保护类别，越界即停」；decision-log.md「### N17 让 phase 文件名带工作包名，并让 phase 数量按可交付物划」。仅绑定上列实际依赖段落；无关段落变化不使本Phase实施事实失效。
- **材料变更影响**: 本次实施注记仅在本Phase「## Phase 契约头」补本两行；spec、方向、Task正文、AC、写集、依赖与其它Phase正文不改。本两行不构成机器门或完成依据。
- **全局规格**: `spec.md#实现设计全局权威`
- **写入集**: `workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`tools/cli/stage-runtime.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`workflows/build-code/skill-deps.yaml`；`workflows/verify-code/skill-deps.yaml`；`skills/catalog.yaml`；`workflows/build-code/steps.json`；`runtime/stage/stage-content-contracts.mjs`；`runtime/task/material-workspace.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`runtime/review/provider-material-projection.mjs`
- **依赖**: P1、P2
- **消费者**: Phase审查者与P4收尾执行者及P5覆盖作者
- **gate_cmd**: `node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run tests/contract/card05-runtime-target-behavior.test.mjs tests/contract/card05-phase-path-and-contract-facts.test.mjs tests/contract/card05-provider-named-phase.test.mjs -t 'N1 target:|N1 baseline:|N17' --reporter=verbose --no-fileParallelism`
- **oracle**: ORACLE-P3-FACTS
- **evidence_path**: `quality/tests/p3-effect-readback`（计划slug，真实原件由capture/appendRecord返回，未生成不当存在）
- **STOP**: 新范围/无源产品选择交原spec owner；仅停止该处，继续其它安全工作；不得把质量缺口冻结同task。
- **覆盖 AC**: AC-C05AUD-01、AC-C05AUD-02、AC-C05AUD-03、AC-C05AUD-11、AC-C05AUD-15、AC-C05AUD-19
- **Done**: 上列AC逐条有既有档位及具名原件路径、目标/反例/恢复证据和一次本Phase独立审查原件或真实unavailable；业务下一真实task未观察仍unknown，不声明修好。

## 工作包声明

- **读集**：`spec.md#实现设计全局权威`、`spec.md#appendix-a--验收判据唯一权威`、当前decision-log本Phase来源块与Task卡锚点。
- **文件 owner**：每张卡所列owned路径仅该卡实施者持笔，句稿交owner；测试/审查者不改同文件。外置原件各自slug互斥。
- **接口符号清单**：见每Task Files / symbols，未知具名停下该处。
- **合并责任**：原卡实施者串行整合自己的hunk，主会话核实际diff，finding回同一会话。
- **progress_cursor**：只引用facts.jsonl现phase_progress，不保存执行值。

## 速读卡

- **本 Phase 结果**：实施者能从同一 Phase 的事实读回声明工作是否真实执行。
- **非目标**：simplicity P1/P2复用现owner与原件；不选新gate/ledger/renderer，原因是现能力已覆盖；其它Phase结果交其owner。
- **改动前**：现具体缺口与源取舍见全局spec及下面第一处真实符号。
- **改动后**：本结果可独立读回；完成强度仍受真实证据限制。
- **与相邻 Phase 的边界**：依赖P1、P2，消费者Phase审查者与P4收尾执行者及P5覆盖作者；不把模块相邻当依赖。
- **主要风险**：未知接缝被猜作存在；替代走法是保unknown交原owner，仅局部复原受影响hunk。
- **下一步**：本Phase原件交消费者，未解决项保持具名。
- **动手前必读**：spec对应FR/AC→当前decision源块→下面各卡符号→受保护文件实读（spec DNT已读项或unknown owner动作）。
- **未决事实**：spec OPEN-N11/N18/PR/TEST与34项原件中本Phase相关条目，owner按卡。

## 本 Phase 材料导航

| 材料 / 锚点 | 用途 | 时机 |
| --- | --- | --- |
| `spec.md#实现设计全局权威` | 精确写集及旧记录界限 | 第一处修改前 |
| `decision-log.md#模块清单` | 本卡原模块动作与取消取舍 | 第一处修改前 |
| `spec.md#appendix-a--验收判据唯一权威` | AC唯一条件及负例 | oracle读回时 |

## L0 — 结果与变更

实施者能从同一 Phase 的事实读回声明工作是否真实执行。
全局目标只引用spec，不复制其它Phase正文。该结果有独立读回判据，可以单独提交停手；本阶段设计稿不执行Git。任务分工为T004、T005，执行原件而非材料正文承载进度。

## L1 — 可执行契约

### 文件边界

- **新增**: N/A — 无新生产文件；冻结新测试归scout已经创建，不能借实施重写。
- **修改**: `workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`tools/cli/stage-runtime.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`workflows/build-code/skill-deps.yaml`；`workflows/verify-code/skill-deps.yaml`；`skills/catalog.yaml`；`workflows/build-code/steps.json`；`runtime/stage/stage-content-contracts.mjs`；`runtime/task/material-workspace.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`runtime/review/provider-material-projection.mjs`
- **禁止改动**: `runtime/interface/safe-write.mjs`、`runtime/stage/stage-content-contracts.mjs`未授权段、`runtime/task/task-store.mjs`、`tools/cli/run-checks.mjs`、`specs/workflowhub-card05-stage-defect-audit-20261012/decision-log.md`；原因与逐字实读/unknown记录见spec DNT。历史原件不改写。

### 任务顺序

T004、T005；真实blocked_by逐卡，编号全局递增。并发2–5具体分配按spec当前并行方案；同文件不并行。

### 测试策略

行为结果、持久化/状态、错误/取消/恢复、权限、并发/原子性、seam与来源按卡具体场景核。UI N/A仅基于本Phase精确写集无页面组件，不把下游浏览器方法义务当本次浏览器执行；库存限定核查见spec三来源false；未做全仓零消费者证明，不冒浏览器验证。

### 覆盖边界

最多证明本Phase机制/方法有源与针对性原件，不证明下一个真实task修好、不证明真实外部PR或OCR服务。具名unknown不补默认0。

### 停止

沿契约头STOP：未知产品选择回spec owner，继续安全处；局部失败回原实施者，不另开许可链。

### 完成

沿契约头Done逐条记录实际原件/档位，未来命令不是GREEN，0退出不是全部业务通过。

### 风险与回滚

共享hunk或scope漂移会损坏旧路径。先存本次实际修改文件原字节；触发旧正例回归或标题丢失时，只恢复受损原字节hunk后重编辑，保其它改动、首次失败及历史原件，不整树checkout。

### 交接知识

真实锚点均见逐卡；当前源N13取消、safe-write不改、质量事实不作门。未知继续标unknown，不用文件存在推完成。

### T004 — 字面命令失败与契约事实能在 Phase 边界读回

- **Source / FR / AC**: U-002/U-005④/U-009②/U-012①；R-015；N1/9/11/14/17；FR-C05AUD-001、FR-C05AUD-002、FR-C05AUD-003、FR-C05AUD-006；AC-C05AUD-01、AC-C05AUD-02、AC-C05AUD-03、AC-C05AUD-15、AC-C05AUD-19。完整条件只引用spec Appendix A，本卡交付字面命令失败与契约事实能在 Phase 边界读回。
- **Inputs**: 当前spec与source源原文；blocked_by=P1、P2，上游提供测试声明与显式scope API；仍先read本卡锚。正常真实fixture命令exit7/output原件和当前facts；负例receipt不存在、不完整findings有11条、无scope/越界保护；环境临时task，不动本任务Git。
- **Files / symbols**: owner=T004原实施者；`workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`tools/cli/stage-runtime.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`runtime/stage/stage-content-contracts.mjs`；`runtime/task/material-workspace.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`runtime/review/provider-material-projection.mjs`；已实读或unknown锚：phaseReviewSourceProjection:533；prepareTaskBoundBuildCodeReviewBundle:558；writeBuildCodePhaseProgressCursor:821；stageRuntimeMain capture-tests:1090；combinePairedResults:1877–1882。未知先read确认，不凭摘要改接口。
- **Action**: 1. stage-runtime phaseReviewSourceProjection已parse处构只读contract_ok/error_count/errors片段/ac/fr/command_oracle事实，539选择与540抛错逐字不动；事实必须装实际phase profile合法member，当前context_map不在允许表；本轮008真实选择准许现review-materials763 source.json序列保只读facts，不新增member/schema/filter。只附source被763省掉fields不算送达。最终manifest/provider原文读回证明。具名读取例外：phaseProgressTargetExists749及stage-content-contracts198/383/393从index实际authority读P<n>-短名，保裸P旧路径与原validation/required强度。另按用户真实007修material-workspace phaseFilesFromIndex8/27/31/34/PHASE_FILE6实际authority读取链，保旧root/顺序/安全，具体read/write定位消费者见spec。本轮015再补第四consumer providerMaterialEntries116–144，按index实际authority定位、排除中文/英文header、保完整正文/连续/duplicate/missing/crossroot拒绝与旧bareP/English正控；再按018真实选择同文件providerMaterialPath:100只扩合法named形状到requirements/实际authority相对路径，保旧bareP/包根/安全，不改material种类/interface/schema。无新material/schema/filter/审查轮，真实post-reviewscope不能冒已异源覆盖。新独立target原件新冻结target card05-provider-named-phase.test.mjs hash094796c773a1d9b188cb86ad787c3d6badee4d9fd32b238503c553fb784396dc；原013 exit1/11case=2named English/Chinese目标RED+9baseline/0fixture，entriesAPI未证明transport，完整body/key/order后继必须同oracle复核。N18 detail装配不由本卡phase source writer承接；只读共享resolver既有边界是P2P，完整detail合法成员与原文消费见P5/T009，不自动递归抓Markdown。2. capture-tests接receipt后从真实原件汇总到现build-code stage evidence，复用writeStageRow并保已有cursor/非空事实；更新游标不得回null。未执行/timeout/cancel按原receipt和原因，不捏exit0。3. prepareTaskBoundBuildCodeReviewBundle消费同事实投影，确实进入送审；只产生普通事实不加失败门。4. combinePairedResults只改不完整error.message，findings大于0显示数量，code/status/shape不动。5. build-code29逐面字面提交verify，禁止抓Phase文本自动跑；未跑逐面明写“哪一面／卡在哪／什么条件下能跑”，不能只有不可用；浏览器面按声明写集判，已声明适用而缺工具是unavailable不是N/A，保真实QA engine、route/场景、截图或not_observed真实原因在唯一原ref，不伪浏览器通过；合并N11提交时点和N14类别/范围核：先读项目实际类别与授权原文，授权是否包含此改动/是否超声明写集两项分别引用现普通appendRecord原件各一份（仅该判断源、路径/符号/原文锚，不新字段/ledger）；受保护且未授权只停该处并指缺哪确认，其它安全工作继续；纯文档/注释/夹具依U008①可继续但登记；项目未声明只查一次留未声明事实不停等。6. docs标准同段写先审查后phase一commit、最终close一次确认。
- **Outputs / failure**: 交付本标题的可观察增量；缺真实来源、非法scope、标题损坏或与原反例冲突为未达成；错误原样可见，恢复保已发生事实。
- **Boundary / DO NOT TOUCH**: 当前card owned集合外不写，spec全局DNT字段实读日期与unknown owner动作适用；`tests/contract/card05-runtime-target-behavior.test.mjs`与`tests/contract/card05-phase-path-and-contract-facts.test.mjs`、`tests/contract/card05-provider-named-phase.test.mjs`冻结，不能删到绿；其它owner文件只交句稿。只读卡外置执行原件不冒仓库写集。
- **Dependency**: P1、P2
- **Test tier / skill**: fullstack；主技能 fullstack-slice-testing；本卡面=实际CLI/Git/事实边界；技术路线只是预判，无机器gate。
- **Scenario / fixture or service**: 正常真实fixture命令exit7/output原件和当前facts；负例receipt不存在、不完整findings有11条、无scope/越界保护；环境临时task，不动本任务Git。；临时fixture只在已核真实root内创建/清理，原件单份，未经授权不碰本任务远端/分支。
- **预写测试**: 运行时卡冻结scout两新目标文件对应N1/N17 case，N17四条首故障已真实RED；首执行包级事实/public verify是fixture失败；现CR1–3最小纠错后023/024已实命名目标RED，后继未达仍不宣GREEN；其它卡现有针对性检查或独立G2读回，缺目标测试保持unavailable，不改旧成功断言凑绿。
- **可观察接缝**: phaseReviewSourceProjection:533；prepareTaskBoundBuildCodeReviewBundle:558；writeBuildCodePhaseProgressCursor:821；stageRuntimeMain capture-tests:1090；combinePairedResults:1877–1882的当前producer→本卡既有产物→契约头真实consumer；依据本次read，来源分母是上述source/AC，而非命中数量；端到端真实用户接缝尚未发生时unknown，owner实施者与用户，下次真实task取原件。
- **RED/GREEN gate_cmd**: `node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run tests/contract/card05-runtime-target-behavior.test.mjs tests/contract/card05-phase-path-and-contract-facts.test.mjs tests/contract/card05-provider-named-phase.test.mjs -t 'N1 target:|N1 baseline:|N17' --reporter=verbose --no-fileParallelism`
- **expected_exit**: RED：命名目标断言非零才有效；GREEN：同命令0；setup/环境失败不计目标RED。
- **RED target failure**: ORACLE-P3-FACTS；具名目标为上列负例在正确输入下不能被掩盖；G2是客观替代非目标RED，混合卡未取得目标断言前保持unavailable。
- **当前真实执行**: runtime023 N1实际exit7/raw命中但stageevidenceundefined目标RED；phase024 N1实际manifest输出缺contract_ok目标RED与4N17首RED，0fixture；原002/006及旧byte仍immutable，本次不能把早期失败改成旧已验证。
- **RED evidence**: 第二原件TASK/quality/tests/2026-10-12-006-card05-phase-path-contract-facts-red.output/.json exit1，4条N17真实目标失败、3条baseline通过、1条N1fixture API形状错非目标RED；第二首执行旧hash3dad3a466adbc31459bad9e8475513b814c9984b8e379c7cbd238cd282555032，当前hash6e1a3ec4f7dc1d825cdedfc31b8f9733ddfd5689515649e73779451b8a241795对应024重跑不对应006。实际scout原件 `TASK/quality/tests/2026-10-12-002-card05-runtime-target-primary-runner.output`及同名.json；9目标失败/1N1夹具失败/2旧行为本来通过逐条见runtime备忘§原始执行与逐条归因（82–97）。N11五条、N12一条、N20三条分别目标RED；旧N1 TASK_PATH_MISMATCH属于首次fixture非RED，当前023已到evidenceundefined目标RED。首执行对应旧hash18995f143c0227f75b4680b6522f87373b245df0870176811a5df15294905798；当前重冻结473dbbe9b114c3fc03a7a904c9a996e8b13866c3d0aba293102fc5d00e825d49对应023重跑，不对应002；只用首历史事实不能声称所有卡RED已齐。
- **映射目标case**: 018 consumer=review-materials762现write调用providerMaterialPath；独立测试者已执行唯一receipt argv原字面：`node --input-type=module -e 'import assert from "node:assert/strict"; import {providerMaterialPath} from "./runtime/review/provider-material-projection.mjs"; const old=providerMaterialPath("phase_authority:phases/P1.md",0,"# Phase P1\nComplete baseline body\n"); assert.equal(old,"requirements/phases/P1.md","BASELINE-OLD-BARE-P"); console.log("BASELINE-OLD-BARE-P passed: "+old); const actual=providerMaterialPath("phase_authority:phases/P1-短名.md",0,"# Phase P1\nComplete named body\n"); console.log("ORACLE-NAMED-PHASE-PATH actual="+actual+" expected=requirements/phases/P1-短名.md"); assert.equal(actual,"requirements/phases/P1-短名.md","ORACLE-NAMED-PHASE-PATH: accepted source018 actual indexed authority must keep its requirements-relative path");'`；旧bareP先正控通过1，named expected requirements/phases/P1-短名.md vs actual materials/01-phase_authority_phases_P1-_.md.md，原件TASK/quality/tests/2026-10-12-016-card05-named-phase-material-path-red.output/.json exit1/ERR_ASSERTION/ORACLE-NAMED-PHASE-PATH是目标RED非fixture。GREEN用同字面断言与同旧control，不改三冻结文件。该独立node -e命令与本Phase/T004 vitest -t N1|N17是两条分别执行/分别归因的命令；vitest主gate不会自动执行此映射case，必须另跑同receipt argv留独立原件，不能主gate绿冒mapping覆盖。负case继承entries跨root/parent/absolute拒绝，不放任mapping独立输入变新授权；完整包manifest相对path与index authority一致、正文末尾marker读回、顺序保持仍未实际验证，不能把此单case绿称完整packet通过。

- **GREEN oracle**: ORACLE-P3-FACTS；同命令真实原件与具名反例逐项读回；空输出/原件不存在/未观察不判通过，静态文本不替真实用户效果。
- **Evidence**: 实际RED唯一原件指向 `TASK/quality/evidence/2026-10-12-build-plan-runtime-design-and-red.md` 返回的quality/tests ref；本卡GREEN计划slug `quality/tests/t004-green`，未生成；G2原件/读回由现appendRecord保存并返回真实path，不复制镜像。
- **Coverage limit**: 不证明下一个真实任务修好了；不覆盖scope外案例或真实外部服务未执行面；P2P本来通过不是本卡目标RED。
- **STOP / recovery**: 与源量词/旧语义/所声明写集不符时仅停该处交原spec owner；可修finding回原实施会话，局部恢复原字节hunk后同oracle复验；未知保原因，不静默fallback或冻结安全工作。
- **测试变更请求**: CR1/2/3已按source021独立窄review019、024主会话actualAPI技术处置并原作者最小修；只env storage、deliveryManifest→实际manifest数组、authority_ref→既有path，目标/assertion/scoring不改。旧原字节/path/hash与diff唯一件见spec，首次raw不覆。原host positive批准门已撤，不把findings[]当pass、不自动重审；当前runtime023/phase024目标RED已到，后继facts/schema仍future，freeze473db…/6e1a…。
- **Done**: 上列AC逐条实际档位+具名原件、目标/反例/恢复读回与独立审查原件或真实unavailable；不足保持未达成，未参与实现的人可按同命令与原件重放；本标题结果不替业务验收。
- **成本**: 预估4–6小时，一个独立上下文纵切；费用/实际用量unknown；并发人数与互斥见spec当前并行方案，不能另起同文件writer。

### T005 — 逐面执行依赖在现入口可发现

- **Source / FR / AC**: R-015；U-009②/U-010②；N9；FR-C05AUD-003；AC-C05AUD-11。完整条件只引用spec Appendix A，本卡交付逐面执行依赖在现入口可发现。
- **Inputs**: 当前spec与source源原文；blocked_by=P1，上游提供测试合同/真实事实或同卡既有输入；none仅指Phase内无额外Task依赖；有效blocked_by是契约头Phase依赖∪本卡额外依赖，Phase前置未满足不能开始，仍先read本卡锚。正常依赖反向一致；负例仅catalog改、QA依赖bundle缺文件、UI缺执行原件；没有浏览器可见写集，实际浏览器N/A有路径依据。
- **Files / symbols**: owner=T005原实施者；`workflows/build-code/skill-deps.yaml`；`workflows/verify-code/skill-deps.yaml`；`skills/catalog.yaml`；`workflows/build-code/steps.json`；已实读或unknown锚：skill-deps skills；catalog isolated-browser-qa used_by_stages；steps5/6 observable_result。未知先read确认，不凭摘要改接口。
- **Action**: 1. 两skill-deps skills段新增既有isolated-browser-qa路径与源指定trigger。2. catalog的该技能used_by_stages改build-code/verify-code，仅一处。3. build-code steps5/6 observable_result逐面原件、UI真实执行或声明写集非浏览器具名判断，字段集合不变。4. bundle/consistency实际读回；check现红不冒PASS；若因本变更出现新失败回本hunk修，不借泛unavailable。
- **Outputs / failure**: 交付本标题的可观察增量；缺真实来源、非法scope、标题损坏或与原反例冲突为未达成；错误原样可见，恢复保已发生事实。
- **Boundary / DO NOT TOUCH**: 当前card owned集合外不写，spec全局DNT字段实读日期与unknown owner动作适用；`tests/contract/card05-runtime-target-behavior.test.mjs`与`tests/contract/card05-phase-path-and-contract-facts.test.mjs`、`tests/contract/card05-provider-named-phase.test.mjs`冻结，不能删到绿；其它owner文件只交句稿。只读卡外置执行原件不冒仓库写集。
- **Dependency**: P1、P2（Phase前置）；无额外Task前置
- **Test tier / skill**: fullstack；主技能 fullstack-slice-testing；本卡面=实际CLI/Git/事实边界；技术路线只是预判，无机器gate。
- **Scenario / fixture or service**: 正常依赖反向一致；负例仅catalog改、QA依赖bundle缺文件、UI缺执行原件；没有浏览器可见写集，实际浏览器N/A有路径依据。；临时fixture只在已核真实root内创建/清理，原件单份，未经授权不碰本任务远端/分支。
- **预写测试**: 运行时卡冻结scout两新目标文件对应N1/N17 case，N17四条首故障已真实RED；首执行包级事实/public verify是fixture失败；现CR1–3最小纠错后023/024已实命名目标RED，后继未达仍不宣GREEN；其它卡现有针对性检查或独立G2读回，缺目标测试保持unavailable，不改旧成功断言凑绿。
- **可观察接缝**: skill-deps skills；catalog isolated-browser-qa used_by_stages；steps5/6 observable_result的当前producer→本卡既有产物→契约头真实consumer；依据本次read，来源分母是上述source/AC，而非命中数量；端到端真实用户接缝尚未发生时unknown，owner实施者与用户，下次真实task取原件。
- **RED/GREEN gate_cmd**: `node tools/cli/check-skill-consistency.mjs --root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-card05-stage-defect-audit-20261012`
- **expected_exit**: RED：命名目标断言非零才有效；GREEN：同命令0；setup/环境失败不计目标RED。
- **RED target failure**: ORACLE-P3-ROUTES；具名目标为上列负例在正确输入下不能被掩盖；G2是客观替代非目标RED，混合卡未取得目标断言前保持unavailable。
- **RED evidence**: unavailable — 本混合或只读卡尚无新行为目标RED；现有命令通过仅P2P，不能用文本替会话执行或造仪式RED。
- **GREEN oracle**: ORACLE-P3-ROUTES；同命令真实原件与具名反例逐项读回；空输出/原件不存在/未观察不判通过，静态文本不替真实用户效果。
- **Evidence**: 实际RED唯一原件指向 `TASK/quality/evidence/2026-10-12-build-plan-runtime-design-and-red.md` 返回的quality/tests ref；本卡GREEN计划slug `quality/tests/t005-green`，未生成；G2原件/读回由现appendRecord保存并返回真实path，不复制镜像。
- **Coverage limit**: 不证明下一个真实任务修好了；不覆盖scope外案例或真实外部服务未执行面；P2P本来通过不是本卡目标RED。
- **STOP / recovery**: 与源量词/旧语义/所声明写集不符时仅停该处交原spec owner；可修finding回原实施会话，局部恢复原字节hunk后同oracle复验；未知保原因，不静默fallback或冻结安全工作。
- **测试变更请求**: none；若冻结oracle需变，先具名原因/旧新断言/旧失败原件与独立审查，不由实施者自行批准。
- **Done**: 上列AC逐条实际档位+具名原件、目标/反例/恢复读回与独立审查原件或真实unavailable；不足保持未达成，未参与实现的人可按同命令与原件重放；本标题结果不替业务验收。
- **成本**: 预估1–2小时，一个独立上下文纵切；费用/实际用量unknown；并发人数与互斥见spec当前并行方案，不能另起同文件writer。

## L2 — 可删除参考

本节只提示读回顺序：源→第一符号→同oracle→原件→限制；删除本节不改变L0/L1。原始研究与失败见spec的唯一原ref，不复制正文。

<!-- 当前第四consumer的明确测试计划，不是新机器门 -->
