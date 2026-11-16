# Phase P3 — 终末实际调用现有完整收尾

本文件给本段唯一开发writer、独立测试/审查者和下游消费者。
Phase是可独立交付验收的一段；当前只写未确认草稿，不保存执行状态。
全局目标和唯一验收见spec.md；本文件只写本段增量与可执行协议。

## 哪些节必须写，哪些可以省？

本段必要章节均written，具体输入和动作在下文；唯一末验收节不适用。
机器标签和精确路径/命令保原字面，属于材料行宽例外。

| 章节组 | 当前安排 |
| --- | --- |
| 结果/验收/依据/读源 | written；当前输入和验收首判在本段 |
| 文件责任/验证/任务卡/机器字段 | written；同一writer和同一判定器 |
| 下一消费者 | written；只列本段实际交付 |
| 验收Phase专属检查 | not-applicable；唯一末段为P6 |

## 这一 Phase 交出什么？

终末实际调用现有完整收尾，让P4发布闭包作者、build-code终末caller与独立关闭读者拿真实产物继续。

- **本 Phase 结果**：终末在同一授权任务上下文继续执行可做收尾，不需用户重复提示；图、Git与物理动作分别回实际结果。
- **非目标**：静态接线和隔离Git/PR不证明真实远端发布、用户答复或付费图已完成；真实质量缺口可带入关闭但不能称完成；本段不写第二关闭系统、不改底座Git/图算法。简单优先取现owner复用或窄接线，不加控制面。
- **改动前**：stage-close正文已完整；build-code末步/依赖/catalog没有真实调用接线；现三份接线测试保旧阶段集合。
- **改动后**：终末在同一授权任务上下文继续执行可做收尾，不需用户重复提示；图、Git与物理动作分别回实际结果。
- **与相邻 Phase 的边界**：输入是已合主线当前源；本段结果可独立验收；共享登记与安装宿主配置由P2先交，P4消费已交付接口/方法。
- **主要风险**：接线触发后无条件推进push/delete或误把AST成功当文档已更新；返工只保真实方法调用，按已有授权/费用/精确确认逐动作分路。
- **下一步**：下游按“下一消费者”节读真实交付和限制。
- **动手前必读**：build-code SKILL:152–155/253–306；skill-deps.yaml；steps.json closeout；catalog stage-close:194–208；stage-close:10–156；knowledge-graph更新分支；三份现接线测试；研究004:18–22、41–99。
- **未决事实**：当前计划/预算未确认；真实执行资源在本段开工核，缺项回具名owner。

## 这一 Phase 怎么验收？

本段独立首判spec Appendix A所指验收，不把效果推到最终段。

成本账：验收12活动50 + 共享准备10 + 重验预留15 = 75活动分钟。
逐条七字段及资源来源由spec Appendix A承载，本处只重算本段。
资源账：现stage-close/knowledge-graph、当前final-report原ref、隔离Git仓与可控PR边界、免费语义缓存；
真实远端/新增付费抽取不预设可用。
范围账：本段只判断终末实际调用现有完整收尾；最终组合和其余AC只交供件。
`phase_budget={soft_min:unknown,hard_min:unknown,variance_threshold:unknown,source:provisional proposal}`。
`execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:unknown}`。
预算和S/M/L仍提案，未取得真实来源，不能填模板120/240/1.5。
用户等待、审查等待、环境等待各记实际owner/来源/恢复，与活动分钟分账。
本段非UI：只消费CLI/方法/文件和隔离进程，不观察页面或样式。

1. 验收标准：只引用Appendix A的本段首判，判定器见任务卡；不重写第二份通过/失败。
2. 场景：实际installed resolver/终末方法调用；只有新文档内容变化、代码无变化；prompt/mode miss与免费缓存命中；
新增付费未批准；归档再产交付字节；图产物自身排除；PR重入/多匹配/closed/权限拒绝；无PR明确路线；未确认清理；已合入/已不存在动作保幂等。
3. 环境与数据：现stage-close/knowledge-graph、当前final-report原ref、隔离Git仓与可控PR边界、免费语义缓存；
真实远端/新增付费抽取不预设可用。搭建和清理同作用域，原始输出留任务库。
4. 用例与预期：正常及每个具名反例走下文同一范围命令；有效RED须到目标assertion，GREEN后独立按原AC判效果。
5. 谁判与承接：开发通知实现就绪后，主会话才派不同上下文只读测试/审查；P4发布闭包作者、build-code终末caller与独立关闭读者消费原件。
6. 失败回修与重验：源报告ref错误、跨任务目标/HEAD漂移、付费未批准、PR权限拒绝、未知字节或最终确认未取得时只停对应动作；
回P3原writer/知识owner/Git owner修来源与方法，原失败保留，禁止无条件重试外部不可重试错误。同一原writer修，
受影响独立方只复验原问题及最小回归。

## 为什么现在做，依据是什么？

stage-close正文已完整；build-code末步/依赖/catalog没有真实调用接线；现三份接线测试保旧阶段集合，因此本段交付有当前消费者。
全局需求与取舍沿decision-log及spec，不在这里重开方向或替用户批准。
来源是R-028；ADR-003/004，本段判据指向spec Appendix A。

## 开始前读什么？

先读spec全局设计与本段Appendix A，再按以下真实锚点看首改和反例。
build-code SKILL:152–155/253–306；skill-deps.yaml；steps.json closeout；catalog 
stage-close:194–208；stage-close:10–156；knowledge-graph更新分支；三份现接线测试；研究004:18–22、
41–99。
这些源由作者2026-11-16用read/grep实读；精确签名/字段逐字清单在spec代码锚点。
任务库两份研究004/005只提供导航，关键接口仍读当前源。
禁止范围的原始合同取当前源，不把历史摘要冒现实现。

## 每个文件由谁改，先做什么？

本段唯一开发writer按下表逐文件交付，审查和测试只读。
路径是未来实施写集，本轮没有修改这些生产/测试/方法文件。

| 路径 | 动作类别与责任 | 真实消费者/输入 |
| --- | --- | --- |
| `workflows/build-code/SKILL.md` | modify；在原closeout及终末报告后实际加载调用stage-close并消费逐动作结果；复用final-report而非新关闭状态 | 本段唯一writer；P4发布闭包作者、build-code终末caller与独立关闭读者，输入见本段真实源 |
| `workflows/build-code/skill-deps.yaml` | modify；登记stage-close真实终末触发及原bundle，公共能力不扩 | 本段唯一writer；P4发布闭包作者、build-code终末caller与独立关闭读者，输入见本段真实源 |
| `workflows/build-code/steps.json` | modify；原closeout末步补实际调用/读回图、Git、归档、清理；保step_id/slug/步数 | 本段唯一writer；P4发布闭包作者、build-code终末caller与独立关闭读者，输入见本段真实源 |
| `skills/catalog.yaml` | modify；stage-close used_by_stages补build-code并移除旧终末标签；保其它consumer与依赖闭包 | 本段唯一writer；P4发布闭包作者、build-code终末caller与独立关闭读者，输入见本段真实源 |
| `tests/contract/knowledge-graph-stage-wiring.test.mjs` | modify；按当前四阶段与build-code终末核真实依赖和bundle，不继续读已退役verify-code路径 | 本段唯一writer；P4发布闭包作者、build-code终末caller与独立关闭读者，输入见本段真实源 |
| `tests/contract/stage-closeout-step-contract.test.mjs` | modify；修旧stage-close集合预期以承接当前build-code；保reflection/成本/步骤合同 | 本段唯一writer；P4发布闭包作者、build-code终末caller与独立关闭读者，输入见本段真实源 |
| `tests/contract/stage-closeout-skill.test.mjs` | modify；修含旧verify-code集合的断言，保唯一bundle/无第二Git执行器与PR路线合同 | 本段唯一writer；P4发布闭包作者、build-code终末caller与独立关闭读者，输入见本段真实源 |
| `tests/contract/terminal-close-consumption.test.mjs` | new；真实resolver+独立方法消费的正常/失败/重入场景，受控Git/PR不冒远端 | 本段唯一writer；P4发布闭包作者、build-code终末caller与独立关闭读者，输入见本段真实源 |

- **新增**：`tests/contract/terminal-close-consumption.test.mjs`。
- **修改**：`workflows/build-code/SKILL.md`；`workflows/build-code/skill-deps.yaml`；`workflows/build-code/steps.json`；`skills/catalog.yaml`；`tests/contract/knowledge-graph-stage-wiring.test.mjs`；`tests/contract/stage-closeout-step-contract.test.mjs`；`tests/contract/stage-closeout-skill.test.mjs`。
- **退役**：仅退役verify-code旧终末接线预期，不删历史证据。
- **禁止改动**：spec全局禁止写集；本段尤其不改skills/stage-close/SKILL.md、knowledge-graph算法、git-authorize及旧报告，已有owner承接。

本段与其它交付的结果独立，但新增测试/生产文件须先登记同一move-map，依真实前后writer串行。
共享边界：本段先交catalog现stage-close登记；P4后读该源生成清单，不并发改同文件。
冲突回本段原writer修自己hunk；未知状态如实保unknown，禁整树恢复或另建锁账本。
新文件逐项职责/consumer见表；生产新文件先登记move-map再实现。
替代与删除条件：仅当本表实际消费者均已由经独立核验的替代承接后退役，历史原件保留。

新增文件创建前先由本段writer修改`docs/architecture/move-map.json`，
登记上表新增项的职责、实际consumer、测试和全部consumer迁移后的删除条件。
本段写主独占该登记动作；不新增另一份职责账本。

## 怎么验证？

先冻结本段目标行为，再用同一命令保存RED/GREEN；独立消费才给效果结论。

```bash
node node_modules/vitest/vitest.mjs run tests/contract/knowledge-graph-stage-wiring.test.mjs tests/contract/stage-closeout-step-contract.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/contract/terminal-close-consumption.test.mjs
```

该命令是计划；具名预写测试按本轮授权补写，实际结果以后附原件为准，其它完整行为测试仍未执行，不冒RED或GREEN。
实施owner先落可收集目标测试，setup/导入/空收集故障只记原失败，不当目标RED。
从当前build-code实际依赖加载不到stage-close或独立终末消费者停在handoff未调用；缺语义贡献/后置交付字节的具名assertion失败；
旧测试集合错误单列，不把旧失败冒新RED。
安装方法包中的终末消费者按Appendix A验收12实际承接stage-close，分别读回语义/代码图、条件Git链与一次真实范围确认；
失败/重入可见且不重复PR/merge。
自动检查只证其断言覆盖；独立方法/宿主消费者按Appendix A原条件复放。
S/M/L沿spec提案：本段S隔离路由加M安装方法/现图，不是用户已选数据策略。
正式执行经task.captureCommand/appendRecord保存argv/cwd/exit/signal/time/raw-ref。
目标测试冻结后改断言走同卡TCR与独立批准；只读声明不冒物理隔离已建立。

## 每张任务卡怎么写？

本段只有一个用户可感知增量，同交付的创建、实现、测试与交接留在一张卡内。

### 任务 3：终末实际调用现有完整收尾

为什么做：stage-close正文已完整；build-code末步/依赖/catalog没有真实调用接线；现三份接线测试保旧阶段集合，
本卡按全局验收补消费者拿不到的结果。
交付什么：终末在同一授权任务上下文继续执行可做收尾，不需用户重复提示；图、Git与物理动作分别回实际结果；失败保具名原因和原始输出。
不做什么：静态接线和隔离Git/PR不证明真实远端发布、用户答复或付费图已完成；真实质量缺口可带入关闭但不能称完成；本段不写第二关闭系统、
不改底座Git/图算法。
前置：P2交回当前move-map与独立宿主隔离配置后，从当前终末方法开始；当前草稿仍待计划真实确认。
怎么做：从上表第一条首改路径开始，按下面有序动作切穿真实输入、方法/接口、测试和消费者。
步骤1：先固定本任务真实final-report ref/sha和独立终末结果；
在build-code原closeout/终末收口后明确加载并执行stage-close，不新增脚本执行器、stage、gate或close plan。
正式事实/reflection/handoff仍归原caller。
步骤2：让skill-deps和catalog与该实际触发一致，resolver从installed包可取到唯一stage-close及原依赖闭包；
steps原closeout描述写实际进入、返回原件和后置十环/页面更新，不改步骤身份或新增状态。
步骤3：知识owner在功能/规范写入完成后核当前实际源路径，代码结构与新增/变化文档语义分别更新/未更新。按prompt/mode和内容核语义cache命中；
可免费重放先用，miss新增抽取需已有本次精确范围和成本许可，未取得保文档未更新。
步骤4：把知识owner返回的精确图allowlist与真实功能字节交最终commit，再按已选PR/无PR路线读回任务远端、PR、merge及目标push。
归档后产生的新交付字节回核精确变化，必要补图与提交；图自身不是语义源，不对同一无变化集合无限update-commit。
步骤5：每个Git实际动作前核cwd/branch/HEAD/remote和原授权，沿TaskHandle同进程record/consume；
PR先核唯一精确open匹配项，失败不切写路由，已创建则复用，不重复新建或merge。PR/直接merge是条件路线，未执行保持未执行。
步骤6：归档、工作区/分支/同名远端分支删除及PR合并隐含删除，统一展示精确实际范围取得一次最终答复；已有同范围答复直接用。未答只停破坏动作，其它安全工作继续；
不以新需求冒当前树即时删除授权。
步骤7：独立消费者none上下文从实际installed终末进入，执行具源受控正反输入：免费缓存命中、新文档miss未批、收费已批范围、归档后新字节、
PR重入/权限拒绝、直接merge、最终确认未答。模拟边界只证方法接线；真实远端结果由实际授权执行时另留原件。
步骤8：旧三份测试的阶段集合修改走TCR：原预期与当前治理冲突、源为R-028/现build-code替代旧verify-code，
独立review批准后只改该集合；不删PR安全断言或原失败。
怎么验收：运行本卡范围命令并由独立上下文消费真实产物；效果按Appendix A，不把exit代效果。
证据：本卡RED/GREEN及独立消费原件放任务quality下，计划位置不冒已产出。
下游（含何时停）：P4发布闭包作者、build-code终末caller与独立关闭读者读取现交付；源报告ref错误、跨任务目标/HEAD漂移、付费未批准、
PR权限拒绝、未知字节或最终确认未取得时只停对应动作；回P3原writer/知识owner/Git owner修来源与方法，原失败保留，
禁止无条件重试外部不可重试错误。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T003
- **来源 / FR / AC**：R-028；ADR-003/004；FR-C10-011；AC-C10-012；结果为终末实际调用现有完整收尾，失败和保留强度沿Appendix A。
- **输入**：当前spec/decision和已合主线具名源；producer为本段唯一writer，consumer为P4发布闭包作者、build-code终末caller与独立关闭读者；独立测试在实现就绪后取得当前产物和原始输出。
- **文件 / 符号**：`workflows/build-code/SKILL.md`；`workflows/build-code/skill-deps.yaml`；`workflows/build-code/steps.json`；`skills/catalog.yaml`；`tests/contract/knowledge-graph-stage-wiring.test.mjs`；`tests/contract/stage-closeout-step-contract.test.mjs`；`tests/contract/stage-closeout-skill.test.mjs`；`tests/contract/terminal-close-consumption.test.mjs`；`docs/architecture/move-map.json`；符号：build-code step-closeout/终末、skill-deps.skills、catalog stage-close.used_by_stages；新测试ORACLE-TERMINAL-CLOSE。
- **动作**：从上表第一条首改路径开始，按下面有序动作切穿真实输入、方法/接口、测试和消费者。；步骤1：先固定本任务真实final-report ref/sha和独立终末结果；；在build-code原closeout/终末收口后明确加载并执行stage-close，不新增脚本执行器、stage、gate或close plan。；正式事实/reflection/handoff仍归原caller。；步骤2：让skill-deps和catalog与该实际触发一致，resolver从installed包可取到唯一stage-close及原依赖闭包；；steps原closeout描述写实际进入、返回原件和后置十环/页面更新，不改步骤身份或新增状态。；步骤3：知识owner在功能/规范写入完成后核当前实际源路径，代码结构与新增/变化文档语义分别更新/未更新。按prompt/mode和内容核语义cache命中；；可免费重放先用，miss新增抽取需已有本次精确范围和成本许可，未取得保文档未更新。；步骤4：把知识owner返回的精确图allowlist与真实功能字节交最终commit，再按已选PR/无PR路线读回任务远端、PR、merge及目标push。；归档后产生的新交付字节回核精确变化，必要补图与提交；图自身不是语义源，不对同一无变化集合无限update-commit。；步骤5：每个Git实际动作前核cwd/branch/HEAD/remote和原授权，沿TaskHandle同进程record/consume；；PR先核唯一精确open匹配项，失败不切写路由，已创建则复用，不重复新建或merge。PR/直接merge是条件路线，未执行保持未执行。；步骤6：归档、工作区/分支/同名远端分支删除及PR合并隐含删除，统一展示精确实际范围取得一次最终答复；已有同范围答复直接用。未答只停破坏动作，其它安全工作继续；；不以新需求冒当前树即时删除授权。；步骤7：独立消费者none上下文从实际installed终末进入，执行具源受控正反输入：免费缓存命中、新文档miss未批、收费已批范围、归档后新字节、；PR重入/权限拒绝、直接merge、最终确认未答。模拟边界只证方法接线；真实远端结果由实际授权执行时另留原件。；步骤8：旧三份测试的阶段集合修改走TCR：原预期与当前治理冲突、源为R-028/现build-code替代旧verify-code，；独立review批准后只改该集合；不删PR安全断言或原失败。
- **输出 / 失败**：终末在同一授权任务上下文继续执行可做收尾，不需用户重复提示；图、Git与物理动作分别回实际结果；源报告ref错误、跨任务目标/HEAD漂移、付费未批准、PR权限拒绝、未知字节或最终确认未取得时只停对应动作；回P3原writer/知识owner/Git owner修来源与方法，原失败保留，禁止无条件重试外部不可重试错误。
- **边界 / 禁止改动**：本段写集之外只读；全局底座/PRD/上游材料/旧报告不可写，防第二owner和历史漂白。
- **依赖**：P2
- **测试层级 / 技能**：当前spec测试面；终末方法/图/授权条件链；主技能backend-testing为build-plan预判，实际build-code按真实diff选；UI本段不适用，真实页面在P6。
- **场景 / 夹具或服务**：实际installed resolver/终末方法调用；只有新文档内容变化、代码无变化；prompt/mode miss与免费缓存命中；新增付费未批准；归档再产交付字节；图产物自身排除；PR重入/多匹配/closed/权限拒绝；无PR明确路线；未确认清理；已合入/已不存在动作保幂等；搭建/清理同进程，原始输出外置。
- **预写测试**：实际resolvePortableStageFiles(build-code)不含stage-close方法，已到达声明闭包目标断言；独立installed terminal host、两图/授权/重入/归档后字节与Git分路尚未取得。
- **可观察接缝**：installed方法解析及独立终末消费者的逐动作返回；漏掉的范围见覆盖上限。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/knowledge-graph-stage-wiring.test.mjs tests/contract/stage-closeout-step-contract.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/contract/terminal-close-consumption.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0；目标assertion到达前的setup错误不是RED。
- **RED 目标失败**：ORACLE-TERMINAL-CLOSE；从当前build-code实际依赖加载不到stage-close或独立终末消费者停在handoff未调用；缺语义贡献/后置交付字节的具名assertion失败；旧测试集合错误单列，不把旧失败冒新RED。
- **RED 证据**：actual: `quality/tests/2026-11-16-049-c10-repair-targeted-contract-tests.output`中build-code闭包缺stage-close具名断言失败；真实终末动作仍未取。
- **GREEN 判定器**：ORACLE-TERMINAL-CLOSE；安装方法包中的终末消费者按Appendix A验收12实际承接stage-close，分别读回语义/代码图、条件Git链与一次真实范围确认；失败/重入可见且不重复PR/merge；具名反例不得被当成功。
- **证据**：planned: `quality/tests/p3-t003-green.output`；planned: `quality/evidence/p3-terminal-close-effect.md`；成本类别为命令级/文件级及独立语义读回，具体七字段见Appendix A。
- **覆盖上限**：静态接线和隔离Git/PR不证明真实远端发布、用户答复或付费图已完成；真实质量缺口可带入关闭但不能称完成；本段不写第二关闭系统、不改底座Git/图算法。
- **停止 / 恢复**：源报告ref错误、跨任务目标/HEAD漂移、付费未批准、PR权限拒绝、未知字节或最终确认未取得时只停对应动作；回P3原writer/知识owner/Git owner修来源与方法，原失败保留，禁止无条件重试外部不可重试错误。
- **测试变更请求**：旧三份集合断言需独立TCR批准当前阶段迁接；理由/原失败/影响/批准者和复验放本卡普通原件；未批准不改冻结断言。
- **完成**：前置（不作完成条件）：范围命令可收集并留真实exit/raw。完成条件（只写效果）：独立执行者按Appendix A首判AC-C10-012的真实效果及反例，读回原件并交下游；语义未执行记incomplete并保判定者/协议/计划落点；当前计划未实施，不把本卡声明填成pass。

## 下一消费者拿什么继续？

P4发布闭包作者、build-code终末caller与独立关闭读者取得本段真实当前字节、适用原件和未完成条件，再做自己的增量。
交可从installed包读取的终末方法/依赖、实际消费原件与代码/文档图的分别状态；P4将当前方法纳入完整包。
读不到具名产物时保具体owner/影响/恢复，不把来源摘要当执行证明。

## 任务编号怎样对照？

这里只定位本段卡片，不复制执行状态。

| 正文 | 机器编号 | 唯一交付 |
| --- | --- | --- |
| 任务3 | T003 | 终末实际调用现有完整收尾 |

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：`workflows/build-code/SKILL.md`；`workflows/build-code/skill-deps.yaml`；`workflows/build-code/steps.json`；`skills/catalog.yaml`；`tests/contract/knowledge-graph-stage-wiring.test.mjs`；`tests/contract/stage-closeout-step-contract.test.mjs`；`tests/contract/stage-closeout-skill.test.mjs`；`tests/contract/terminal-close-consumption.test.mjs`；`docs/architecture/move-map.json`
- **依赖**：P2
- **消费者**：P4发布闭包作者、build-code终末caller与独立关闭读者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/knowledge-graph-stage-wiring.test.mjs tests/contract/stage-closeout-step-contract.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/contract/terminal-close-consumption.test.mjs`
- **oracle**：ORACLE-TERMINAL-CLOSE
- **evidence_path**：planned: `quality/evidence/p3-terminal-close-effect.md`
- **STOP**：源报告ref错误、跨任务目标/HEAD漂移、付费未批准、PR权限拒绝、未知字节或最终确认未取得时只停对应动作；回P3原writer/知识owner/Git owner修来源与方法，原失败保留，禁止无条件重试外部不可重试错误。
- **覆盖 AC**：AC-C10-012
- **Done**：前置（不作完成条件）：目标命令/原件可读。完成条件（只写效果）：AC-C10-012在本段由独立执行者按同一判据首次判断，效果/反例和原件引用逐条写任务facts；当前仅计划未执行，机器目标RED/GREEN未取得不报通过；语义判定未执行记incomplete，owner为本段独立测试/审查者，协议见验收节，计划证据为`quality/evidence/p3-terminal-close-effect.md`；外部资源不可得须具名原因与恢复。
