# 实际步骤与当前依赖技能的 consumer／完成判据设计

读者：N9 spec 与 Phase 作者、后续实施者、独立材料读者。本文补父 PRD E-4 与 FR-T4-002 的有限工程设计，不记录阶段进度、用户授权或质量 pass。全局 FR/AC 与验收正文仍归同目录 spec，Phase 写集与动作仍归各卡；本附件独占逐 source 的 consumer 映射，spec/Phase 仅引用，不复制一份表。

## 输入集合与适用路线

来源：父 PRD [specs/archive/skills-framework-redesign-20261014/prd.md:464,530](<../../specs/archive/skills-framework-redesign-20261014/prd.md#L464>)；当前 `decision-log.md#未决项` OI-014；本任务外置 `quality/evidence/2026-10-20-047-n8-merge-p4-p5-investigation-final.md`。开工知识图来源复用本独立会话既有 query/god/explain：图有界导航未覆盖当前 N8/N9，故直接回指定原件，不为补设计更新图或调用 provider。已读 spec-plan 的索引附件条件：本文件不是 Phase index，不将这里的映射塞入纯指针 index；其模板仅在实际存在并登记时使用。本附件是唯一设计正文，不是对所有宿主强制加载的第四规范。

每次实施按认证仓库当前五个 `workflows/<workflow>/steps.json` 实读 `steps[]` 的 `step_id/step_slug/observable_result/completion_evidence`。make-decision 的路线表只从根 `flows` 指向真实 small/normal/planning 文件；真实用户选择取当前决策唯一「级别与路线」及其来源，不能从任务性质、推荐或缺材料猜级别。已确认轻档替换根复杂步骤，不将根15步和轻档相加跑；规划后继 build-prd 仅在真实执行时纳入。跨级只补真实未做适用步骤；旧选择和已有原件保留，不扫宿主历史。

下表是 2026-10-20、HEAD 1d24f938 下实读声明的可再生导航：根 15/6/12/12/8，轻档 9/11/11；这些是当前行数，不是冻结53、84或36分母。未来 source 增删时先重新回源与人读本表受影响行，不靠旧行数当完整。记录键采用来源路径＋step_slug，不引入新全局步骤身份、schema或进度对象。

当前依赖集合只来自五入口 `skill-deps.yaml` 的 name/path/trigger 与根/选中flow中真实必需、按需技能consumer。按实际路径去重；条件未触发保依据与未调用事实，不为凑清单加载全部技能。退役 mini-task 不作为 active 来源；同仓方法依赖不递归膨胀成整个技能库。

## 判定责任与回填方法

下列每行对应一个真实步骤声明；源行取 step_slug 的当前 JSON 位置。`human` 表示该步骤的业务完成含义必须由执行者或独立读者消费完整原件判，不由文件数/字串/exit0替代；`program` 只限可明确核验的实际 command/exit、身份、hash、输入数等子条件，不能提升为整个步骤的语义通过；取不到真实来源/输入/工具时按现有五态记 unavailable 并具名原因与 owner，不把 unavailable 作为新的永久判定模式。表内混合面写 human＋program，实际缺哪一面逐项列明。

表内完成与失败是本步观察合同，不新增许可门。业务反例失败说明本步未达成，仍可按现授权修复；检查器未运行、扫描零输入、返回体不支持、原件不可读是坏checker/取数失败，单独保限制，不误判业务已经失败，更不能冒 completed。对 advisory checker 保原退出语义，不改成阻断。

**回填统一动作**：保当前 step_id/slug/schema/kind/目录字段，保原 observable_result 的全部条件，在其现有字符串内以准确原方法consumer锚替换泛套话，保全部原义；必要时增加一个明确「判定消费：<本行实际工作流方法/专业方法路径＋稳定章节或步骤>；原件：<本行事实来源类别>」指针；不是每行再追加一段完整规则，不重抄整张表；不得添加 machine validator、必需键或新状态。当前 source 的 `completion_evidence` 目录指针只帮助找原件，不证明整份 SKILL 缺判据。下表已能读到的具体判据由原 SKILL 继续独占，回填的是 source 到 consumer 的可发现接缝。

本轮精确必须回填源为五根与三个flow的 steps.json；回填 owner 是对应入口内容 owner，在 N9 同一已授权 Phase 串行持笔，后续 spec 作者指定精确写集。根与flow SKILL除已另定 P5 页面/normal时点之外已有足够方法，默认只引用，不能以 E4 为由整份重写。若本表具体行与真实 source 不兼容，只修该 owner 的受影响段并登记，不扩大无关技能/整个目录。

## 根入口逐步映射

列中“方法锚”是实际消费者，N9 runner只读取其执行事实，不自动执行该方法；同一步可有多个生产者，但人读推进owner只有该入口主会话，程序核验由既有窄工具承接。

### make-decision

| source／方法锚与真实consumer | 本步可判完成；失败反例 | 事实原件／判定方式 | 回填路径与owner |
| --- | --- | --- | --- |
| [make-decision steps:7](<../../workflows/make-decision/steps.json#L7>) `load-context`；入口主会话读 [make-decision 方法:86](<../../workflows/make-decision/SKILL.md#L86>) 原步骤，专业consumer见依赖节 | 完成：原话/事实/假设分列；七输入各有来源且真实选择可回读。失败：把推荐当选择、未取得输入补false、无原话却声称完成。 | decision级别节、需求索引与入口返回原ref；human＋program | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:18](<../../workflows/make-decision/steps.json#L18>) `outline-hypothesis-talk`；入口主会话读 [make-decision 方法:102](<../../workflows/make-decision/SKILL.md#L102>) 原步骤，专业consumer见依赖节 | 完成：每块问题/边界、方向假设及可推翻证据可读。失败：把粗大纲写成已确认范围或没有推翻条件。 | decision大纲与真实Talk回复；human | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:29](<../../workflows/make-decision/steps.json#L29>) `research-and-diverge`；入口主会话读 [make-decision 方法:107](<../../workflows/make-decision/SKILL.md#L107>) 原步骤，专业consumer见依赖节 | 完成：内部/外部分列真实来源；候选含摘要、ref、推荐/拒绝及理由。失败：只有报告路径、无候选或以未执行冒零结果。 | canonical研究原件、内部origin和有源跳过理由；human | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:44](<../../workflows/make-decision/steps.json#L44>) `outline-revision-check`；入口主会话读 [make-decision 方法:116](<../../workflows/make-decision/SKILL.md#L116>) 原步骤，专业consumer见依赖节 | 完成：需求单元各有归属/落点/验收，独立四查四行指出应拆和应并。失败：编号齐但单元无人接，四查没有真实依据。 | 需求索引、coverage唯一原件、独立四查返回；human | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:55](<../../workflows/make-decision/steps.json#L55>) `outline-talk`；入口主会话读 [make-decision 方法:124](<../../workflows/make-decision/SKILL.md#L124>) 原步骤，专业consumer见依赖节 | 完成：攻击自查先于实际骨架展示，用户针对该稿真实答复。失败：用最终方向答复或旧稿回复代本稿确认。 | 展示稿、自查原ref、用户骨架确认；human＋program | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:66](<../../workflows/make-decision/steps.json#L66>) `adversarial-direction-check`；入口主会话读 [make-decision 方法:130](<../../workflows/make-decision/SKILL.md#L130>) 原步骤，专业consumer见依赖节 | 完成：回读同次攻击自查；骨架确认后两个单--file命令各有warning/exit。失败：把第5步答复冒自查、漏一个输入、零扫描仍判完整。 | 自查原件；需求索引/coverage各一命令回执；human＋program | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:77](<../../workflows/make-decision/steps.json#L77>) `direction-advice`；入口主会话读 [make-decision 方法:135](<../../workflows/make-decision/SKILL.md#L135>) 原步骤，专业consumer见依赖节 | 完成：questions-only盲包与各provider终态/原finding可读；Kill/Recycle由用户取舍。失败：包含已选答案、零有效结果却称方向通过。 | review原件、实际delivery与失败、用户处置；human＋program | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:92](<../../workflows/make-decision/steps.json#L92>) `module-breadth-confirm`；入口主会话读 [make-decision 方法:140](<../../workflows/make-decision/SKILL.md#L140>) 原步骤，专业consumer见依赖节 | 完成：每工作包简单/复杂分诊有理由，入口代价事实与paused拆分选项同批展示。失败：用分诊改掉已确认顺序或把未答当选择。 | 工作包分诊、入口原ref、真实展示/答复；human | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:103](<../../workflows/make-decision/steps.json#L103>) `module-convergence`；入口主会话读 [make-decision 方法:146](<../../workflows/make-decision/SKILL.md#L146>) 原步骤，专业consumer见依赖节 | 完成：每包五段结论＋ref，red/blue逐条处置；新增包闭包内补齐。失败：多个包压同批泛摘要、无验收或争议无人处置。 | 每包五行表、Talk/研究原件、现OI处置；human | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:114](<../../workflows/make-decision/steps.json#L114>) `detail-advice`；入口主会话读 [make-decision 方法:154](<../../workflows/make-decision/SKILL.md#L154>) 原步骤，专业consumer见依赖节 | 完成：收敛后一次整体detail，全部真实R/U正文送达，写集定序且每finding有处置。失败：主文摘要当全文、同路径并写、冲突值或漏R/U。 | detail包delivery、coverage、原finding与处置；human＋program | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:129](<../../workflows/make-decision/steps.json#L129>) `grill-with-docs`；入口主会话读 [make-decision 方法:161](<../../workflows/make-decision/SKILL.md#L161>) 原步骤，专业consumer见依赖节 | 完成：以真实计划骨架逐项质询，五类覆盖/四退出检查及领域changed/no-change可读。失败：Grill模拟答复冒用户选择或漏冲突退出条件。 | 原方法grill_summary、decision/GLOSSARY/ADR原ref；human | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:140](<../../workflows/make-decision/steps.json#L140>) `write-decision-draft`；入口主会话读 [make-decision 方法:166](<../../workflows/make-decision/SKILL.md#L166>) 原步骤，专业consumer见依赖节 | 完成：每R/U有语义落点或有源缺口；两单--file第二时点与第一次可对照。失败：文件存在冒覆盖、覆盖表两时点混用。 | 当前decision、R/U原件、两个checker回执；human＋program | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:151](<../../workflows/make-decision/steps.json#L151>) `approve-decision`；入口主会话读 [make-decision 方法:173](<../../workflows/make-decision/SKILL.md#L173>) 原步骤，专业consumer见依赖节 | 完成：真实展示最终方向/范围/风险/验收后取得该稿答复。失败：审查意见/旧回复冒确认，拒答仍称已批准。 | human-confirm原件与实际materialRefs；human＋program | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:162](<../../workflows/make-decision/steps.json#L162>) `stage-end-spec-analyze`；入口主会话读 [make-decision 方法:178](<../../workflows/make-decision/SKILL.md#L178>) 原步骤，专业consumer见依赖节 | 完成：确认后核原需→决定→问答/审查，遗漏/矛盾及领域写回或no-change可定位。失败：只核编号命中、修了方向未回用户、没有术语依据。 | spec-analyze原件、确认ref、术语读回；human | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |
| [make-decision steps:177](<../../workflows/make-decision/steps.json#L177>) `closeout`；入口主会话读 [make-decision 方法:183](<../../workflows/make-decision/SKILL.md#L183>) 原步骤，专业consumer见依赖节 | 完成：阶段末按反思原方法归纳→归口→成本→发布→报告，交接实际独立读回。失败：只有准备正文、成本缺字段填0、交接未发布却报路径。 | stage-reflection成本原件、immutable handoff与读回；human＋program | 同source只替泛句→原方法锚；make-decision内容owner；SKILL仅引用。 |

### build-prd

| source／方法锚与真实consumer | 本步可判完成；失败反例 | 事实原件／判定方式 | 回填路径与owner |
| --- | --- | --- | --- |
| [build-prd steps:7](<../../workflows/build-prd/steps.json#L7>) `load-confirmed-inputs`；入口主会话读 [build-prd 方法:17](<../../workflows/build-prd/SKILL.md#L17>) 原步骤，专业consumer见依赖节 | 完成：父确认与原需完整旅程/排除/未知逐项可回源。失败：父确认缺失被推断、summary代完整来源。 | decision确认ref、原始要求与只读输入原件；human | 同source只替泛句→原方法锚；build-prd内容owner；SKILL仅引用。 |
| [build-prd steps:18](<../../workflows/build-prd/steps.json#L18>) `generate-outline-and-task-map`；入口主会话读 [build-prd 方法:19](<../../workflows/build-prd/SKILL.md#L19>) 原步骤，专业consumer见依赖节 | 完成：首次同一spec-prd作者产结果导向任务地图，每需有负责卡或排除。失败：只有技术层列表、独立交付切一半、无消费者。 | prd地图实际稿、作者调用事实、来源覆盖；human | 同source只替泛句→原方法锚；build-prd内容owner；SKILL仅引用。 |
| [build-prd steps:29](<../../workflows/build-prd/steps.json#L29>) `confirm-map-and-conditional-design`；入口主会话读 [build-prd 方法:20](<../../workflows/build-prd/SKILL.md#L20>) 原步骤，专业consumer见依赖节 | 完成：对实际展示地图及条件设计取得真实答复；非UI有证据。失败：旧稿/未答冒批准、静态图冒交互观察。 | 真实问题/答复、设计来源/预览限制；human | 同source只替泛句→原方法锚；build-prd内容owner；SKILL仅引用。 |
| [build-prd steps:40](<../../workflows/build-prd/steps.json#L40>) `expand-single-prd`；入口主会话读 [build-prd 方法:21](<../../workflows/build-prd/SKILL.md#L21>) 原步骤，专业consumer见依赖节 | 完成：地图答复后第二次同作者扩完整PRD，来源/范围同义且未知保留。失败：第三内容调用隐藏为第二次、caller代写另稿。 | 作者真实调用事实、同一prd与确认输入；human＋program | 同source只替泛句→原方法锚；build-prd内容owner；SKILL仅引用。 |
| [build-prd steps:51](<../../workflows/build-prd/steps.json#L51>) `review-and-confirm-final-draft`；入口主会话读 [build-prd 方法:23](<../../workflows/build-prd/SKILL.md#L23>) 原步骤，专业consumer见依赖节 | 完成：完整稿文档建议逐项处置后展示当前稿，真实confirm可读。失败：地图答复代最终确认、provider失败冒建议通过。 | wh-review原件/处置、最终稿、confirm ref；human＋program | 同source只替泛句→原方法锚；build-prd内容owner；SKILL仅引用。 |
| [build-prd steps:66](<../../workflows/build-prd/steps.json#L66>) `closeout`；入口主会话读 [build-prd 方法:24](<../../workflows/build-prd/SKILL.md#L24>) 原步骤，专业consumer见依赖节 | 完成：收口六类handoff原信息真实，规划成本标签/失败分列且独立读回。失败：恢复旧terminal许可、未执行物理动作写已做。 | 原hand-off、成本27列原读数、真实交付原ref；human＋program | 同source只替泛句→原方法锚；build-prd内容owner；SKILL仅引用。 |

### build-plan

| source／方法锚与真实consumer | 本步可判完成；失败反例 | 事实原件／判定方式 | 回填路径与owner |
| --- | --- | --- | --- |
| [build-plan steps:7](<../../workflows/build-plan/steps.json#L7>) `read-current-materials`；入口主会话读 [build-plan 方法:17](<../../workflows/build-plan/SKILL.md#L17>) 原步骤，专业consumer见依赖节 | 完成：原需/决定/约束/风险到FR/AC/Task双向可回读。失败：只沿旧审查绿灯或遗漏已接受不做事项。 | 当前材料、条件原件、逐来源映射；human | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:18](<../../workflows/build-plan/steps.json#L18>) `conditional-light-research`；入口主会话读 [build-plan 方法:19](<../../workflows/build-plan/SKILL.md#L19>) 原步骤，专业consumer见依赖节 | 完成：点状问题有真实consumer/接口/失败证据，无问题有源跳过。失败：无真实未知强开深研究或图标签直接当结论。 | 轻研究内存结果或唯一研究ref、origin；human | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:29](<../../workflows/build-plan/steps.json#L29>) `spec-clarify`；入口主会话读 [build-plan 方法:21](<../../workflows/build-plan/SKILL.md#L21>) 原步骤，专业consumer见依赖节 | 完成：规格歧义分类继承上游已答，frontier问题真实等待。失败：重问已定方向、未答默选或绕过依赖先问后轴。 | spec-clarify问题/答复与真实草稿变更；human | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:40](<../../workflows/build-plan/steps.json#L40>) `spec-specify`；入口主会话读 [build-plan 方法:22](<../../workflows/build-plan/SKILL.md#L22>) 原步骤，专业consumer见依赖节 | 完成：同一spec有旅程/状态/异常/FR及Appendix A唯一验收正文。失败：只标题/编号在场，无可观察结果或失败反例。 | spec完整正文及原需来源；human | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:51](<../../workflows/build-plan/steps.json#L51>) `conditional-ui-readiness`；入口主会话读 [build-plan 方法:23](<../../workflows/build-plan/SKILL.md#L23>) 原步骤，专业consumer见依赖节 | 完成：三来源UI适用性合并；专业源/实际consumer/原型限制逐类可读。失败：只凭调用标签免UI、缺源判零问题、截图名冒交互。 | raw/inventory/accepted-plan、专业源读取、真实预览；human＋program | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:62](<../../workflows/build-plan/steps.json#L62>) `spec-plan`；入口主会话读 [build-plan 方法:24](<../../workflows/build-plan/SKILL.md#L24>) 原步骤，专业consumer见依赖节 | 完成：先手工单元oracle再最小复用，Phase边界有独立结果且共享写集定序。失败：按技术层切空Phase、两个writer同时写同文件。 | spec全局设计、独立Phase、纯指针index；human＋program | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:73](<../../workflows/build-plan/steps.json#L73>) `testing-system-blueprint`；入口主会话读 [build-plan 方法:25](<../../workflows/build-plan/SKILL.md#L25>) 原步骤，专业consumer见依赖节 | 完成：每Task风险/场景/oracle/命令/实际输入与证据/时点齐且可证伪。失败：setup失败冒RED、生成验收对象无真实三源。 | Phase卡、checkAcceptanceObject实际输入/返回、目标RED或G2原件；human＋program | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:88](<../../workflows/build-plan/steps.json#L88>) `test-routing-advisor`；入口主会话读 [build-plan 方法:25](<../../workflows/build-plan/SKILL.md#L25>) 原步骤，专业consumer见依赖节 | 完成：按真实改动面选主测试路线，条件面逐项测或有源不测。失败：用simple标签省掉浏览器写集或无主concrete skill。 | test-routing原结果、声明测试面与理由；human | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:103](<../../workflows/build-plan/steps.json#L103>) `merged-review`；入口主会话读 [build-plan 方法:27](<../../workflows/build-plan/SKILL.md#L27>) 原步骤，专业consumer见依赖节 | 完成：独立同包merged-review提供完整规格/Phase与实际provider限制。失败：自审、缺原件却空finding通过、另加每模块审。 | review包、provider/raw、失败与coverage；human＋program | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:118](<../../workflows/build-plan/steps.json#L118>) `main-agent-disposes-findings`；入口主会话读 [build-plan 方法:28](<../../workflows/build-plan/SKILL.md#L28>) 原步骤，专业consumer见依赖节 | 完成：每finding逐条fixed/附证误报/真实风险决定/待决，严重影响具名。失败：摘要覆盖原finding或擅自接受严重风险。 | 原findings和逐项处置/受影响修订；human | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:129](<../../workflows/build-plan/steps.json#L129>) `final-spec-analyze`；入口主会话读 [build-plan 方法:29](<../../workflows/build-plan/SKILL.md#L29>) 原步骤，专业consumer见依赖节 | 完成：六类核对各有源落点/排除，正反追原需到每物理Phase/oracle。失败：只跑结构工具或编号存在就宣六类完整。 | spec-analyze完整原件与具名修复范围；human | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |
| [build-plan steps:140](<../../workflows/build-plan/steps.json#L140>) `closeout`；入口主会话读 [build-plan 方法:30](<../../workflows/build-plan/SKILL.md#L30>) 原步骤，专业consumer见依赖节 | 完成：实际展示修订计划、分工/判据/欠账后真实确认，再反思发布交接。失败：旧确认代当前变更或未答已发布approved handoff。 | human确认、成本原件、handoff独立读回；human＋program | 同source只替泛句→原方法锚；build-plan内容owner；SKILL仅引用。 |

### build-code

| source／方法锚与真实consumer | 本步可判完成；失败反例 | 事实原件／判定方式 | 回填路径与owner |
| --- | --- | --- | --- |
| [build-code steps:7](<../../workflows/build-code/steps.json#L7>) `read-current-task-documents`；入口主会话读 [build-code 方法:21](<../../workflows/build-code/SKILL.md#L21>) 原步骤，专业consumer见依赖节 | 完成：核task/worktree/写集与frontier，规则锚/材料影响可回源。失败：跳依赖实施或历史receipt当许可。 | 当前spec/Phase、授权与写集核对原ref；human＋program | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:18](<../../workflows/build-code/steps.json#L18>) `write-red-tests`；入口主会话读 [build-code 方法:27](<../../workflows/build-code/SKILL.md#L27>) 原步骤，专业consumer见依赖节 | 完成：先读冻结oracle，目标断言实际RED再实现；G2有理由/风险/替代。失败：导入/环境失败冒目标RED、改预期换绿。 | 同命令RED原输出、预写测试/DO NOT TOUCH/TCR；human＋program | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:33](<../../workflows/build-code/steps.json#L33>) `implement-change`；入口主会话读 [build-code 方法:29](<../../workflows/build-code/SKILL.md#L29>) 原步骤，专业consumer见依赖节 | 完成：实际行为目标交付且改动在允许符号内，错误不吞，材料问题交owner。失败：只建stub/TODO、越界未登记、吞失败。 | 真实diff、源码与目标行为原件；human＋program | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:44](<../../workflows/build-code/steps.json#L44>) `inspect-and-route-actual-tests`；入口主会话读 [build-code 方法:30](<../../workflows/build-code/SKILL.md#L30>) 原步骤，专业consumer见依赖节 | 完成：按真实changed files定位波及面并选适用concrete testing skill。失败：只复制计划路线、图边未回源或遗漏跨层影响。 | affected/origin、有源路由选择与风险场景；human | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:59](<../../workflows/build-code/steps.json#L59>) `run-tests`；入口主会话读 [build-code 方法:32](<../../workflows/build-code/SKILL.md#L32>) 原步骤，专业consumer见依赖节 | 完成：每声明面真实执行原argv/cwd/exit/raw，场景效果按oracle核。失败：零输入或exit0冒效果，漏面未列条件。 | verify execute/run-command回执与原输出；human＋program | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:74](<../../workflows/build-code/steps.json#L74>) `inspect-acceptance-and-ui`；入口主会话读 [build-code 方法:33](<../../workflows/build-code/SKILL.md#L33>) 原步骤，专业consumer见依赖节 | 完成：每AC实际结果及UI消费者/浏览器场景有证据，未观察具体保真。失败：有浏览器写集因无服务误N/A、模拟当外部效果。 | AC实际/反例原件、engine/route/截图或not_observed；human＋program | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:85](<../../workflows/build-code/steps.json#L85>) `scan-diff`；入口主会话读 [build-code 方法:35](<../../workflows/build-code/SKILL.md#L35>) 原步骤，专业consumer见依赖节 | 完成：逐路径比较diff与写集，接口/权限/并发/回收有针对性核对。失败：只看文件数，动态配置/接口另一端未读。 | git diff路径、实际consumer与边界观察；human＋program | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:96](<../../workflows/build-code/steps.json#L96>) `review-change`；入口主会话读 [build-code 方法:36](<../../workflows/build-code/SKILL.md#L36>) 原步骤，专业consumer见依赖节 | 完成：当前Phase一次OCR及独立同源两镜头，轴/失败/范围并列保原件。失败：用同源补充漂白OCR、首路取消sibling、裁剪真实diff。 | OCR/Standards/Spec原件、包与终态；human＋program | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:111](<../../workflows/build-code/steps.json#L111>) `analyze-review-findings`；入口主会话读 [build-code 方法:37](<../../workflows/build-code/SKILL.md#L37>) 原步骤，专业consumer见依赖节 | 完成：finding回原实施者修，定向复验，Done逐AC及小结证据可读。失败：不修严重发现自行承担风险、下游补签上游AC。 | 原finding处置、受影响case输出、Phase Done；human＋program | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:126](<../../workflows/build-code/steps.json#L126>) `run-final-aggregate-and-ac-trace`；入口主会话读 [build-code 方法:41](<../../workflows/build-code/SKILL.md#L41>) 原步骤，专业consumer见依赖节 | 完成：末聚合消费沿途首次AC结论，补必要未闭环而非无疑点重跑。失败：末Phase首次判所有AC、汇总读回称端到端。 | 既有AC证据、必要串演/未测条件；human＋program | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:137](<../../workflows/build-code/steps.json#L137>) `stage-end-spec-analyze`；入口主会话读 [build-code 方法:43](<../../workflows/build-code/SKILL.md#L43>) 原步骤，专业consumer见依赖节 | 完成：对照原需/材料/实现/测试/处置，事实缺口同task修、作者问题归owner。失败：只以测试绿判全需求或擅改已定方向。 | spec-analyze原件与分界处置；human | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |
| [build-code steps:148](<../../workflows/build-code/steps.json#L148>) `closeout`；入口主会话读 [build-code 方法:44](<../../workflows/build-code/SKILL.md#L44>) 原步骤，专业consumer见依赖节 | 完成：整个stage末反思/归口/成本/交接按原方法一次且读回。失败：每Phase都stage-end、未执行填成功、成本填假0。 | stage-reflection原件、handoff、实际阶段facts；human＋program | 同source只替泛句→原方法锚；build-code内容owner；SKILL仅引用。 |

### verify-code

| source／方法锚与真实consumer | 本步可判完成；失败反例 | 事实原件／判定方式 | 回填路径与owner |
| --- | --- | --- | --- |
| [verify-code steps:7](<../../workflows/verify-code/steps.json#L7>) `read-current-materials-and-code`；入口主会话读 [verify-code 方法:15](<../../workflows/verify-code/SKILL.md#L15>) 原步骤，专业consumer见依赖节 | 完成：认证工作树/真实入口/完整AC/各Phase/原执行来源逐项可读。失败：历史绿灯代现源、猜任务/材料路径或缺原件报通过。 | 当前材料、diff、入口、原件、一次架构原ref；human＋program | 同source只替泛句→原方法锚；verify-code内容owner；SKILL仅引用。 |
| [verify-code steps:18](<../../workflows/verify-code/steps.json#L18>) `ocr-code-review`；入口主会话读 [verify-code 方法:17](<../../workflows/verify-code/SKILL.md#L17>) 原步骤，专业consumer见依赖节 | 完成：终末完整scope包与每provider终态、同源独立轴原件保存。失败：局部审冒终末、不可用改executor、缺一路仍报全审。 | OCR/同源原件、delivery/失败/覆盖；human＋program | 同source只替泛句→原方法锚；verify-code内容owner；SKILL仅引用。 |
| [verify-code steps:33](<../../workflows/verify-code/steps.json#L33>) `preserve-review-facts`；入口主会话读 [verify-code 方法:18](<../../workflows/verify-code/SKILL.md#L18>) 原步骤，专业consumer见依赖节 | 完成：各路原finding/identity/error/cancel保留，迟到有效发现继续处理。失败：首路终态杀其它路、成功覆盖原失败。 | provider原记录、脱敏范围与发现处置；human＋program | 同source只替泛句→原方法锚；verify-code内容owner；SKILL仅引用。 |
| [verify-code steps:48](<../../workflows/verify-code/steps.json#L48>) `inspect-real-entry-and-tests`；入口主会话读 [verify-code 方法:19](<../../workflows/verify-code/SKILL.md#L19>) 原步骤，专业consumer见依赖节 | 完成：每Phase每声明面与原argv/cwd/exit/raw逐行对账，高风险样本规则→入口→断言→效果。失败：provider coverage代测试充分、漏面仍adequate或模拟外部成功。 | Phase逐面表、AC原件、独立业务抽样/对象检查；human＋program | 同source只替泛句→原方法锚；verify-code内容owner；SKILL仅引用。 |
| [verify-code steps:63](<../../workflows/verify-code/steps.json#L63>) `repair-and-targeted-recheck`；入口主会话读 [verify-code 方法:26](<../../workflows/verify-code/SKILL.md#L26>) 原步骤，专业consumer见依赖节 | 完成：有效finding回原会话修，预列影响集合只复验有新疑点面。失败：范围外材料偏好扩写、无改动全量重跑、严重问题自行接受。 | 原finding、限定修复diff、目标复验原件；human＋program | 同source只替泛句→原方法锚；verify-code内容owner；SKILL仅引用。 |
| [verify-code steps:74](<../../workflows/verify-code/steps.json#L74>) `record-finding-dispositions`；入口主会话读 [verify-code 方法:28](<../../workflows/verify-code/SKILL.md#L28>) 原步骤，专业consumer见依赖节 | 完成：每原finding有真实处置，原review不改，剩余条件和owner显出。失败：accepted_risk无真实用户决定或resolved洗旧失败。 | 逐finding处置与实际重验来源；human | 同source只替泛句→原方法锚；verify-code内容owner；SKILL仅引用。 |
| [verify-code steps:85](<../../workflows/verify-code/steps.json#L85>) `report-verification-result`；入口主会话读 [verify-code 方法:28](<../../workflows/verify-code/SKILL.md#L28>) 原步骤，专业consumer见依赖节 | 完成：代码质量/业务效果/测试充分/物理交付分别结论，未知依AC条件保真。失败：测试绿等于发布完成、真人未答当观察通过。 | 逐AC/逐面实际原件、用户验收答复、交付事实；human | 同source只替泛句→原方法锚；verify-code内容owner；SKILL仅引用。 |
| [verify-code steps:96](<../../workflows/verify-code/steps.json#L96>) `closeout`；入口主会话读 [verify-code 方法:29](<../../workflows/verify-code/SKILL.md#L29>) 原步骤，专业consumer见依赖节 | 完成：阶段反思/成本/不可变交接及质量/交付/清理分列，真实末范围确认才清理。失败：局部测试/修复冒全验或清理冒质量成功。 | 反思成本、handoff读回、Git/确认原ref；human＋program | 同source只替泛句→原方法锚；verify-code内容owner；SKILL仅引用。 |

## make-decision 轻档及规划逐步映射

同名slug不能跨路线共用完成事实。下表每行对应选中flow实际步骤；未选的root或其它flow为路线不适用，保规则依据且不调用。方法锚按真实标题匹配，不依赖此处行号永久不漂移。

### small

| source／方法锚与真实consumer | 本步完成与失败反例 | 事实原件／判定方式 | 回填路径与owner |
| --- | --- | --- | --- |
| [small steps:7](<../../workflows/make-decision/flows/small/steps.json#L7>) `entry-route`；[small 方法:30](<../../workflows/make-decision/flows/small/SKILL.md#L30>)，入口主会话＋根入口路由 | 七事实来源和真实小改动选择同节；未答/缺事实不可declared。 | 入口返回原ref与decision级别节；human＋program | 同source只替泛句→原方法锚；make-decision/small内容owner；P5页面段保持。 |
| [small steps:18](<../../workflows/make-decision/flows/small/steps.json#L18>) `outline-hypothesis`；[small 方法:36](<../../workflows/make-decision/flows/small/SKILL.md#L36>)，Talk调用者 | 单点目标/改动/可推翻依据一条大纲；把假设当已定范围失败。 | decision大纲及真实答复；human | 同source只替泛句→原方法锚；make-decision/small内容owner；P5页面段保持。 |
| [small steps:29](<../../workflows/make-decision/flows/small/steps.json#L29>) `bounded-research`；[small 方法:42](<../../workflows/make-decision/flows/small/SKILL.md#L42>)，研究执行者 | 未知有origin结论或无未知有源理由；空研究报告/未执行冒零结果失败。 | 研究原件或具名未触发事实；human | 同source只替泛句→原方法锚；make-decision/small内容owner；P5页面段保持。 |
| [small steps:40](<../../workflows/make-decision/flows/small/steps.json#L40>) `thin-convergence`；[small 方法:48](<../../workflows/make-decision/flows/small/SKILL.md#L48>)，Talk/decision作者 | 每OI方案/替代/验收/后果及五段ref；无理由静默收敛失败。 | OI逐项处置、Talk原ref；human | 同source只替泛句→原方法锚；make-decision/small内容owner；P5页面段保持。 |
| [small steps:51](<../../workflows/make-decision/flows/small/steps.json#L51>) `write-light-materials`；[small 方法:54](<../../workflows/make-decision/flows/small/SKILL.md#L54>)，spec-clarify/spec-specify/spec-plan作者 | 极简五类内容/1Phase/纯index及澄清分类可读；缺测试oracle/用阶段数作gate失败。 | spec/Phase/index、clarify真实回复或trigger=false；human＋program | 同source只替泛句→原方法锚；make-decision/small内容owner；P5页面段保持。 |
| [small steps:62](<../../workflows/make-decision/flows/small/steps.json#L62>) `approve-solution`；[small 方法:68](<../../workflows/make-decision/flows/small/SKILL.md#L68>)，原确认owner | 展示本方案后的唯一真实确认；旧答或未答代许可失败。 | human-confirm原件与展示材料；human＋program | 同source只替泛句→原方法锚；make-decision/small内容owner；P5页面段保持。 |
| [small steps:73](<../../workflows/make-decision/flows/small/steps.json#L73>) `implement-and-test`；[small 方法:74](<../../workflows/make-decision/flows/small/SKILL.md#L74>)，实施/目标测试执行者 | 真实diff与写集对账、目标测试原回执；越界/失败未决仍物理交付失败；无独立审查。 | diff、target tests argv/cwd/exit/raw、失败/用户风险原件；human＋program | 同source只替泛句→原方法锚；make-decision/small内容owner；P5页面段保持。 |
| [small steps:84](<../../workflows/make-decision/flows/small/steps.json#L84>) `reflect-and-handoff`；[small 方法:80](<../../workflows/make-decision/flows/small/SKILL.md#L80>)，spec-analyze/stage-reflection/handoff原owner | 逐AC读回、经验/有源无发现、同窗口一次成本、交接已发布独立读回；准备正文冒执行失败。 | AC读回、Improvements、成本与handoff原ref；human＋program | 同source只替泛句→原方法锚；make-decision/small内容owner；P5页面段保持。 |
| [small steps:95](<../../workflows/make-decision/flows/small/steps.json#L95>) `closeout`；[small 方法:86](<../../workflows/make-decision/flows/small/SKILL.md#L86>)，stage-closeout/真实授权caller | 实施测试完成后按授权交付，末清理真实范围确认；未授权/失败项记未执行而非成功。 | PR/merge/Git授权consume、最终确认及清理回执；human＋program | 同source只替泛句→原方法锚；make-decision/small内容owner；P5页面段保持。 |

### normal

| source／方法锚与真实consumer | 本步完成与失败反例 | 事实原件／判定方式 | 回填路径与owner |
| --- | --- | --- | --- |
| [normal steps:7](<../../workflows/make-decision/flows/normal/steps.json#L7>) `entry-route`；[normal 方法:30](<../../workflows/make-decision/flows/normal/SKILL.md#L30>)，入口主会话＋根入口路由 | 七事实完整/无风险硬覆盖及真实普通选择；推荐当许可或缺事实自动轻档失败。 | 入口原ref、decision级别节/真实答复；human＋program | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |
| [normal steps:18](<../../workflows/make-decision/flows/normal/steps.json#L18>) `outline-hypothesis`；[normal 方法:36](<../../workflows/make-decision/flows/normal/SKILL.md#L36>)，Talk调用者 | 目标边界/模块假设/验收推翻依据对应独立结果；按文件层切空模块失败。 | decision完整大纲/真实Talk；human | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |
| [normal steps:29](<../../workflows/make-decision/flows/normal/steps.json#L29>) `internal-research-talk`；[normal 方法:42](<../../workflows/make-decision/flows/normal/SKILL.md#L42>)，knowledge-graph/内部研究＋Talk | 真实内部研究先图后源并消费结论/候选/真实回复；外部仅按缺口；空skipped冒内部研究失败。 | origin研究原件、Talk回复、外部未触发理由；human | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |
| [normal steps:40](<../../workflows/make-decision/flows/normal/steps.json#L40>) `module-convergence`；[normal 方法:48](<../../workflows/make-decision/flows/normal/SKILL.md#L48>)，decision/Talk作者 | 每模块五段与方案/替代/验收/后果有原ref，真实未决清零；泛摘要/固定问答数失败。 | 模块五段表、OI/真实答复；human | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |
| [normal steps:51](<../../workflows/make-decision/flows/normal/steps.json#L51>) `write-light-materials`；[normal 方法:54](<../../workflows/make-decision/flows/normal/SKILL.md#L54>)，spec-clarify/spec-specify/spec-plan作者 | 极简加现状/备选/依赖，1–2Phase及写集oracle；已答不重问；缺来源填满或新stage失败。 | spec/Phase/index与clarify原件；human＋program | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |
| [normal steps:62](<../../workflows/make-decision/flows/normal/steps.json#L62>) `detail-review`；[normal 方法:68](<../../workflows/make-decision/flows/normal/SKILL.md#L68>)，wh-review detail原caller | 逐模块收敛后一次整体方案审，provider失败/coverage保真；无审查原件却空发现通过失败。 | detail包、原review/finding/失败；human＋program | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |
| [normal steps:73](<../../workflows/make-decision/flows/normal/steps.json#L73>) `approve-solution`；[normal 方法:74](<../../workflows/make-decision/flows/normal/SKILL.md#L74>)，原确认owner | 对当前方向＋方案一次真实确认；用审查意见替答失败。 | 展示稿与human-confirm原件；human＋program | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |
| [normal steps:84](<../../workflows/make-decision/flows/normal/steps.json#L84>) `implement-and-test`；[normal 方法:80](<../../workflows/make-decision/flows/normal/SKILL.md#L80>)，实施/目标测试执行者 | diff写集逐项对账＋实际目标回执及AC结果；越界/测试失败未决交付失败。 | diff、目标测试回执/原输出、处置原ref；human＋program | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |
| [normal steps:95](<../../workflows/make-decision/flows/normal/steps.json#L95>) `implementation-review`；[normal 方法:86](<../../workflows/make-decision/flows/normal/SKILL.md#L86>)，现build-code审查面caller | 同task完整tuple phase_id=null、整次真实diff与完整AC，仍只make-decision阶段行；按Phase裁剪或新增阶段行失败。 | quality/reviews原件、stage evidence指针、OCR/Standards/Spec；human＋program | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |
| [normal steps:106](<../../workflows/make-decision/flows/normal/steps.json#L106>) `reflect-and-handoff`；[normal 方法:92](<../../workflows/make-decision/flows/normal/SKILL.md#L92>)，spec-analyze/stage-reflection/handoff＋页面原owner | 逐AC/反思/经验/成本/交接真实；P5未来接口首次刷新仅在原出页触发；新增verify阶段行或报告未生成称已刷新失败。 | AC读回、成本/handoff、条件页面/侧车与报告ref；human＋program | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |
| [normal steps:117](<../../workflows/make-decision/flows/normal/steps.json#L117>) `closeout`；[normal 方法:98](<../../workflows/make-decision/flows/normal/SKILL.md#L98>)，stage-closeout＋页面原owner | 有效发现处置后授权交付，P5未来接口PR后第二次刷新保旧件；原报告覆盖/未交付伪造PR失败。 | 授权/PR/merge/末范围确认、真实页面/侧车ref；human＋program | 同source只替泛句→原方法锚；make-decision/normal内容owner；P5页面段保持。 |

### planning

| source／方法锚与真实consumer | 本步完成与失败反例 | 事实原件／判定方式 | 回填路径与owner |
| --- | --- | --- | --- |
| [planning steps:7](<../../workflows/make-decision/flows/planning/steps.json#L7>) `entry-route`；[planning 方法:28](<../../workflows/make-decision/flows/planning/SKILL.md#L28>)，入口主会话＋根入口路由 | 规划性质/推荐理由/事实及真实选择同节；缺答当规划许可失败。 | decision级别与真实答复ref；human＋program | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |
| [planning steps:18](<../../workflows/make-decision/flows/planning/steps.json#L18>) `direction-outline`；[planning 方法:34](<../../workflows/make-decision/flows/planning/SKILL.md#L34>)，方向Talk作者 | 任务组目标/边界/可推翻骨架，仍假设；提前承诺实施票失败。 | decision方向大纲与原需；human | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |
| [planning steps:29](<../../workflows/make-decision/flows/planning/steps.json#L29>) `research`；[planning 方法:40](<../../workflows/make-decision/flows/planning/SKILL.md#L40>)，内部/外部研究caller | 真实方向未知有源候选/取舍/未解，canonical被Talk消费；无缺口仍调用外部或摘要冒全文失败。 | 研究origin/原件、候选、跳过依据；human | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |
| [planning steps:40](<../../workflows/make-decision/flows/planning/steps.json#L40>) `outline-revision`；[planning 方法:46](<../../workflows/make-decision/flows/planning/SKILL.md#L46>)，方向/任务组作者 | 修订骨架与独立交付单元/依赖/共享次序明确；任务拆一半或漏原需求失败。 | decision任务地图、来源/覆盖原件；human | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |
| [planning steps:51](<../../workflows/make-decision/flows/planning/steps.json#L51>) `approve-outline`；[planning 方法:52](<../../workflows/make-decision/flows/planning/SKILL.md#L52>)，原确认owner | 对当前方向骨架第一次真实确认；未答进入方向审失败。 | 骨架展示与human-confirm原ref；human＋program | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |
| [planning steps:62](<../../workflows/make-decision/flows/planning/steps.json#L62>) `direction-review`；[planning 方法:58](<../../workflows/make-decision/flows/planning/SKILL.md#L58>)，wh-review direction caller | 确认骨架后一次questions-only方向审，原finding/失败保存；答案入盲包失败。 | 实际方向包/delivery、provider原件；human＋program | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |
| [planning steps:73](<../../workflows/make-decision/flows/planning/steps.json#L73>) `task-convergence`；[planning 方法:64](<../../workflows/make-decision/flows/planning/SKILL.md#L64>)，Talk/decision任务卡作者 | 八字段任务卡＋N6五段/来源，真实未决清零；只写技术票或无独立验收失败。 | 各任务卡及研究/Talk/来源/验收原ref；human | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |
| [planning steps:84](<../../workflows/make-decision/flows/planning/steps.json#L84>) `detail-review`；[planning 方法:70](<../../workflows/make-decision/flows/planning/SKILL.md#L70>)，wh-review detail caller | 所有任务收敛后整体细节审一次；逐卡另审/未收敛提前审失败。 | 完整任务卡包、review/失败与处置；human＋program | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |
| [planning steps:95](<../../workflows/make-decision/flows/planning/steps.json#L95>) `approve-details`；[planning 方法:76](<../../workflows/make-decision/flows/planning/SKILL.md#L76>)，原确认owner | 对当前任务细节/范围/风险/验收第二次确认；骨架答复替代失败。 | 细节展示稿与第二次confirm原ref；human＋program | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |
| [planning steps:106](<../../workflows/make-decision/flows/planning/steps.json#L106>) `reflect-and-handoff`；[planning 方法:82](<../../workflows/make-decision/flows/planning/SKILL.md#L82>)，spec-analyze/stage-reflection/handoff与条件页面owner | 一致性/经验/真实成本/不可变交接真实，条件页仅原方向/卡更新；无spec/Phase/实施事实不得伪造。 | 分析/成本/handoff、原条件页面来源；human＋program | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |
| [planning steps:117](<../../workflows/make-decision/flows/planning/steps.json#L117>) `closeout`；[planning 方法:88](<../../workflows/make-decision/flows/planning/SKILL.md#L88>)，build-prd交接caller | 已确认八字段任务卡/来源/风险交后继并重读级别；不产spec/Phase、不实施/物理交付，后继未启动不判漏步。 | handoff实际路径、任务卡来源与后继输入；human | 同source只替泛句→原方法锚；make-decision/planning内容owner；P5页面段保持。 |

## 当前依赖技能映射

本次自足只读子研究 FULL read 五 YAML 的58次出现、去重31个实际技能正文，再读轻路线真实consumer另4项：intake-decision-review、plan-ceo-review、review、resolving-merge-conflicts；共35个当前实际技能，0缺读。计数是本次来源读数而非冻结分母。未递归展开同仓依赖；退役mini-task不算active第36项。来源读取覆盖归本次子研究，主作者按来源回读必要锚，不冒主作者逐行重复读过35正文。

下表均为 **仅引用**：当前 SKILL 有足够输入/产物/判据或明确失败边界，未证成必须改这35个正文。需要回填的是 source→该真实方法consumer的指针与当前N9的新承接Phase/Task，不因YAML没有通用success字段就改YAML/技能。来源事实类别表示执行时应读什么，不表示该执行已发生。原方法是判据唯一owner；附件只以具体反例帮助找到它。MD/PRD/PLAN/CODE/VERIFY分别指五根入口；S/N/P指小/普/规划路线。

| 实际技能原件／具体锚 | 实际consumer及触发 | 完成观察；失败反例 | 原事实输入／判定方式；owner |
| --- | --- | --- | --- |
| [knowledge-graph:18–52,133–137](<../../skills/knowledge-graph/SKILL.md#L18>)「查询／降级与交回」 | 五入口开工与内部真实未知；MD1/3、PRD1/5、PLAN1/2、CODE1/4、VERIFY1/4、N3/P3；closeout图更新条件 | 采用结论回origin并说明改变产出或重复/无信号；label命中冒命题、未执行冒零结果失败 | 图source_file/origin、当前材料/历史决定；human；知识方法owner；仅引用原方法。 |
| [talk-with-zhipeng:125–175,232–255](<../../skills/talk-with-zhipeng/SKILL.md#L125>)「每答重排／收敛阈值」 | MD2/5/8/9、N3/4、P3/7，S真实方向未决 | 真实ask→wait→reply→重排且待答项处理；旧答/默认替真人、开放high/medium仍称完成失败 | 原需/研究/实际回复及最小decision_updates；human；主会话Talk owner；仅引用原方法。 |
| [grill-with-docs:26–92,100–158](<../../skills/grill-with-docs/SKILL.md#L26>)「全需求覆盖／退出／Domain Awareness」 | MD11；S/N/P真实质询或已解决领域冲突 | 五类覆盖、四退出及领域changed/no-change可读，ADR仅三条件成立时写；漏类或无答代选失败 | 原需全文、代码接口、领域词义/ADR、真实回复；human；Grill/领域owner；仅引用原方法。 |
| [decision-log:13–28,57–71](<../../skills/decision-log/SKILL.md#L13>)「写作步骤／来源与未决问题」 | MD1/9/12及每路线R/U/OI/决定写入前 | 每R/U有语义落点或具名缺口/真人排除；只编号或未答记确认失败 | 原话/答复、唯一日志、coverage/requirement原件；human；决策作者；仅引用原方法。 |
| [deep-research:12–25,27–78](<../../skills/deep-research/SKILL.md#L12>)「轻研究／R0–R5」 | MD3及真实方向未知，PLAN2点状问题 | 原文/版本、候选/拒绝理由及交叉核对真实；轻研究逐题证据或有源跳过；摘要冒原文失败 | 批准范围、一手源、canonical报告/轻内存结果；human；研究owner；仅引用原方法。 |
| [anysearch:17–37,187–190](<../../skills/anysearch/SKILL.md#L17>)「Trigger／错误处理」 | deep-research获准外部发现 | 真实批准查询/来源/次数/时间内执行，参数据实际能力；越域外发或无能力mock成功失败 | 范围授权、真实工具响应/错误及URL；human相关性＋program查询事实；检索owner；仅引用原方法。 |
| [wh-review:20–59,61–88](<../../skills/wh-review/SKILL.md#L20>)「输入与方法／输出和失败边界」 | MD7/10、PRD5、PLAN9；CODE8/VERIFY2方法；N6/9、P6/8 | 允许完整材料实际送达，每路终态/原finding/限制保留；失败/空输出冒空finding通过失败 | ARTIFACT+CONTRACT、manifest/raw/回执；human内容＋program传输解析；正式review owner；仅引用原方法。 |
| [spec-analyze:20–44](<../../skills/spec-analyze/SKILL.md#L20>)「方法／结束披露」 | MD14、PLAN11、CODE11、S8/N10/P10；VERIFY材料疑点 | 逐来源→决定→FR/AC→Task/consumer六类对应/差异披露；ID命中冒consistent失败 | 实际材料、真实答复、已产生实现/测试原件；human；一致性分析owner；仅引用原方法。 |
| [stage-handoff:10–20,22–55](<../../skills/stage-handoff/SKILL.md#L10>)「方法／回读结果／结束条件」 | 五入口stage末reflection内；CODE1/VERIFY1接续、S8/N10/P10 | 必要来源内容、真实发布路径与独立消费可回读；准备稿/旧件冒新发布失败 | 材料/facts/test/review、immutable handoff；human内容＋program发布读回；stage主会话；仅引用原方法。 |
| [stage-reflection:10–44](<../../skills/stage-reflection/SKILL.md#L10>)「方法／归口／完成检查」 | 各真实stage末，S8/N10/P10，非局部Phase | 归纳→归口→真实成本→发布读回→报告，未知分列；未答当采纳/成本填0失败 | 会话/失败、业务仓经验、成本原账行、handoff；human；stage主会话；仅引用原方法。 |
| [answer-as-page:40–54](<../../skills/answer-as-page/SKILL.md#L40>)「当前任务驾驶舱／回灌安全」 | MD12与原出页条件、N/P条件更新，S具名不调用 | 真实五类来源、当前唯一结构/缺项、指纹/节点比较；示例事实或页面当进度权威失败 | 材料/facts/tests/review/diff、旧页/侧车；human视觉需QA；唯一页面owner；仅引用原方法。 |
| [stage-closeout:10–121](<../../skills/stage-closeout/SKILL.md#L10>)「核输入至逐项读回」 | PRD最终确认后、VERIFY交付、S9/N11；复杂MD/P不物理调用 | 授权动作/HEAD与真实结果对应，末清理真实范围确认、PR URL及时回传；内容确认冒Git授权失败 | 授权原ref、branch/HEAD、raw、保留清单；human授权＋program操作事实；close owner；仅引用原方法。 |
| [spec-prd:19–60](<../../skills/spec-prd/SKILL.md#L19>)「两步内容／User Stories／最终确认」 | PRD2/4/5；P11仅交后继 | 唯一作者、完整有源故事/任务卡；地图真答后详情再最终真答；隐藏第三内容调用失败 | 母方向确认/原需、同一prd、真实设计/答复；human；唯一PRD作者；仅引用原方法。 |
| [spec-clarify:19–89](<../../skills/spec-clarify/SKILL.md#L19>)「三分类／十维」 | PLAN3、S5/N5 | locked继承、十维落点、无歧义false原因；有歧义frontier发卡归还/真答后续；自答改稿失败 | spec、上游真答、受控callback；human；Clarify主会话；仅引用原方法。 |
| [spec-specify:11–62,64–145,146–165](<../../skills/spec-specify/SKILL.md#L11>)「规格合同／责任／WR001」 | PLAN4、S5/N5；所有材料写前WR001 | 来源/场景/FR/PFACT到唯一Appendix A、未知owner可读；模板存在冒语义覆盖失败 | 决定/原需与三源、真实spec；human，原对象checker仅最小机械子面；spec作者；仅引用原方法。 |
| [spec-plan:11–81](<../../skills/spec-plan/SKILL.md#L11>)「authoring／Test design／Pure pointer index」 | PLAN6/7、S5/N5 | 每Task有首符号/动作/正反oracle/恢复，写集定序/指针对齐；一行task或命令冒RED失败 | 当前spec/物理Phase/源码锚、测试原件或真实unavailable；human＋原合同program子面；Phase作者；仅引用原方法。 |
| [simplicity-guard:12–57](<../../skills/simplicity-guard/SKILL.md#L12>)「四阶梯／Packet lens」 | PLAN6/9、MD/N/P取舍与真实packet，S按需 | 首个可用P0–P3有据、三问可答且保安全；凑删除/新validator代减法失败 | 当前方案/diff、实际caller/原理由；human；简化lens/方案owner；仅引用原方法。 |
| [plan-eng-review:12–88](<../../skills/plan-eng-review/SKILL.md#L12>)「Check／Result」 | PLAN9同包工程镜头 | 接口/consumer/写主/oracle及遗漏有实际依据或未检限制；非零冒目标RED/额外verdict失败 | 允许spec/Phase/源码锚/RED事实；human；独立工程lens；仅引用原方法。 |
| [testing-system-blueprint:8–16](<../../skills/testing-system-blueprint/SKILL.md#L8>)「行为测试设计」 | PLAN7；S/N有新测试方案时 | 每Task风险/面/独立oracle/同命令RED-GREEN/STOP恢复进入卡；Phase摘要代逐Task失败 | 真实范围、backend判据、原Task设计；human；测试设计owner；仅引用原方法。 |
| [frontend-component-quality:10–60](<../../skills/frontend-component-quality/SKILL.md#L10>)「Component Quality Map」 | PLAN UI、CODE前端、VERIFY UI、S/N组件面 | 真实consumer/state/ViewModel/CSS owner与story/test可读；共享至少两consumer、删有真零；缺扫描当零失败 | 源码census/Map/规则；human＋原static checker机械子面；组件owner；仅引用原方法。 |
| [test-routing-advisor:8–43](<../../skills/test-routing-advisor/SKILL.md#L8>)「判类／输出」 | PLAN7预判、CODE4重判、S/N实际测试前 | 一个合法tier与有源理由/重判差异；phase_count单独升档、路由当测试执行失败 | changed_files/phase_count/test_command/阶段；human，program仅JSON语法；测试路由owner；仅引用原方法。 |
| [ui-project-init:10–70](<../../skills/ui-project-init/SKILL.md#L10>)「规范职责／完成边界」 | PLAN5 UI、PRD3、S/N新UI | 适用专业类有真实源/owner/consumer/路由或具体缺项；八文件数/HTTP200冒专业结果失败 | 原需/库存/计划、专业源/页面事实；human；专业路由与原owner；仅引用原方法。 |
| [design-source-readiness:8–19](<../../skills/design-source-readiness/SKILL.md#L8>)「方法」 | PLAN5、PRD3、路线真实设计源 | Read Map目标/状态/source/fixture/viewport及binding缺口真实；slug冒anchor/引用冒视觉成功失败 | 真实专业源、业务spec/API、Read Map/预览；human；Read Map owner；仅引用原方法。 |
| [frontend-prototype-render:10–23](<../../skills/frontend-prototype-render/SKILL.md#L10>)「方法／结束条件」 | PLAN5/PRD3及路线授权真实原型 | 实际组件/fixture→harness→preview/截图→真实展示回复；静态假页/许可冒最终设计确认失败 | export/fixture/viewport、cwd/command/exit、QA原件；human效果＋program渲染；原型owner；仅引用原方法。 |
| [plan-design-review:8–21](<../../skills/plan-design-review/SKILL.md#L8>)「Check／Result」 | PLAN9三源UI命中同包、PRD设计、路线实际镜头 | 旅程/状态/恢复/a11y/响应式有实际依据或缺证据；缺preview猜视觉/非UI造finding失败 | 同包旅程/专业源/真实预览；human；独立设计lens；仅引用原方法。 |
| [backend-testing:8–28](<../../skills/backend-testing/SKILL.md#L8>)「行为测试与证伪／执行事实」 | CODE4/5、S/N后端合同，PLAN仅蓝图设计 | 真实入口具体输入/独立预期，目标RED/同命令GREEN及失败片；环境失败冒RED/被测算预期失败 | Phase具名测试、fixture/service、raw/exit/覆盖；human充分性＋program实测；测试owner；仅引用原方法。 |
| [frontend-testing:8–24](<../../skills/frontend-testing/SKILL.md#L8>)「UI交付合同／实际消费」 | CODE/S/N真实前端面 | 状态/交互/键盘等适用面及DTO/ViewModel/style/隔离QA真实；fixture-only冒页面成功失败 | route/服务/fixture/viewport/QA原件；human语义视觉＋program实测；前端测试owner；仅引用原方法。 |
| [isolated-browser-qa:19–112,132–134](<../../skills/isolated-browser-qa/SKILL.md#L19>)「Standard Workflow／Output」 | CODE7/VERIFY浏览器面、入口原型/页QA按需 | 单engine/自有session、真实DOM ready/场景/截图/a11y及清理；doctor/空console冒绿或附用户Chrome失败 | 场景/viewport、截图/console/exit/cleanup；human效果＋program生命周期；QA owner；仅引用原方法。 |
| [fullstack-slice-testing:8–12](<../../skills/fullstack-slice-testing/SKILL.md#L8>)「行为测试方法」 | CODE真实跨端/协议/DB/权限/并发，S/N命中先重判风险 | 适用输入→请求→服务→持久化/返回/前端及失败恢复闭环；mock-only一层绿冒链路成功失败 | 端口/进程/fixture/schema/协议、backend原件；human链路＋program实跑；跨边界测试owner；仅引用原方法。 |
| [architect-code-review:24–63](<../../skills/architect-code-review/SKILL.md#L24>)「审查顺序／唯一输出／同源补充」 | CODE8/VERIFY终末、N9实现审 | 当前diff/consumer/完整AC/原件实审，双镜头独立保原finding；空数组/OCR漂白失败 | scope/base/diff/合同/lens/原件；human独立质量；补充审查owner；仅引用原方法。 |
| [diagnosing-bugs:10–56](<../../skills/diagnosing-bugs/SKILL.md#L10>)「反馈回路至验证／不可信页面」 | CODE真实失败/RED/回退、S/N失败、P真实故障 | 实跑捕症状→最小化→单变量证伪→根因修复→原目标/回归验证清理；无复现猜修失败 | 症状/raw/命令/授权写集/探针/复验；human根因＋program复现；原实施owner；仅引用原方法。 |
| [intake-decision-review:12–58](<../../skills/intake-decision-review/SKILL.md#L12>)「Input／Review／Failure」 | 轻路线真实选中intake；P6方向及stage-skill-plan direction | 盲原需/客观约束四角度，原JSON 0-N真实发现；候选答案入盲包或缺料冒pass失败 | questions-only盲包/方向合同；human；intake lens owner；仅引用原方法。 |
| [plan-ceo-review:8–27](<../../skills/plan-ceo-review/SKILL.md#L8>)「Check／Result」 | 轻路线产品镜头、N6 detail/P6/8及现包选择 | 证据/假设、最小scope/复用/替代/推翻前提有据；盲审虚构既定方案或产品verdict失败 | 原需客观事实或detail允许方向；human；产品lens owner；仅引用原方法。 |
| [review:10–58](<../../skills/review/SKILL.md#L10>)「双轴／Check／Evidence handling」 | N9实现审Standards/Spec、规划条件镜头与现包 | 两轴分别据标准/具名需求追producer/consumer及反证；无spec冒Spec/摘要代原件/合并赢家失败 | 同scope artifact/base/diff/AC/原件/协议/标准；human；lens与宿主owner；仅引用原方法。 |
| [resolving-merge-conflicts:8–18](<../../skills/resolving-merge-conflicts/SKILL.md#L8>)「Procedure」 | S9/N11授权交付发生真实merge/rebase冲突；P跳过 | 双方需求与保舍来源可解释、受影响检查与Git读回真实；全局ours/theirs或只删标记失败 | baseline/branch/HEAD/冲突/授权/raw；human语义＋program Git；冲突owner；仅引用原方法。 |

## 最小接线、逐步口径与反证

### 持久与执行边界

全局接口/报告字段/FR/AC由 spec 作者在同一 spec 决定，本附件不定义第二套报告schema或固定字段键。既有 manifest loader/纯核对内核供 P2 复用，已有 run-checks 的一次 stdout 原报告同时承载十环观察与步骤观察，caller 仍沿现 evidence owner 保存原字节；不另建 step-report 持久对象、终态 writer、runner、步骤执行器、进度游标或推进门。步骤核对只消费真实已发生的事实，不执行专业方法、不用LLM给每行自动评分；语义项交具名独立读者消费现方法/实际对象。未提供人读原件时应说未证，而不是报告字段在场即完成。

**真实消费链**：步骤内容 owner 回填准确原方法锚→当前入口主会话在执行该step时消费该方法→原专业执行者保一次真实产物/失败→N9 runner读原件的可判子条件/引用→独立读者按原方法判语义与限制→同一报告展示→后继验收/页面caller读报告。机器只能判command/身份/ref/hash/有限显式谓词；human判据非空不等于human已经判断。某一实际方法没有程序oracle是合法人读面，不制造自动parser/通用规则平台。

新 P7/T013 是本附件所需的方法回填交付：在 P6之后串行修改8个steps，保P6已补verify页面时点并使normal steps指向P5已定同阶段时点；原 P1–P6/T001–12保持真实分工。末验收改由 P8/T014消费新增原件，不在末验收首次建立E4来源或替上游补签。Phase路径/全部FR/AC及同一次计划确认归当前spec/Phase作者，本附件不是新实施授权。

### 两个分母分开

十环完成率仍按spec现十环状态/适用环求值。逐step的声明集合由本次实际选择的workflow/route与条件触发决定；不从十环数推出step数，不把适用十环映射成虚拟step再冒父指标。逐步状态可复用现五态，但没有完成来源的行不得completed；每条有状态只证明覆盖行在场，不证明语义成功。

父 `stage_skip_rate` 与 `step_attestation_coverage` 要在spec明确真实分子/分母与复跑输入，并和现十环 `skip_rate/attestation_coverage` 区分：步骤声明完整率、证据可判率、已完成率、合法跳过各自保原计数；合法不适用留依据不进适用工作分母，声明总集合与本次适用集合分列。stage_skip_rate按任务实际阶段承诺与真实阶段行观察，不以未选轻档的root stage当违规跳过；缺阶段历史来源保持未取得，不推断“都执行了”。确切字段名/是否新增同报告字段由spec唯一接口段落落实，本附件不预造运行时契约。

### 必须可证伪的有限输入

1. **合法输入→坏业务→恢复**：同一受控任务有具体step原判据/真实证据；仅移除本步必需目标事实或置一条真实目标失败，报告该步不可completed；恢复原字节后恢复原观察。退出0的report-only不代业务通过。输入/工作树恢复原件可定位。
2. **坏checker**：输入为空、manifest打不开、零扫描/不能解析当前结果、引用不是本task、body缺失时，保取数失败/unavailable及真实raw；不把它当“该业务根本失败”或 completed。advisory依旧exit0，反例断言观察值而非强改checker退出。
3. **重复/冲突**：同原字节/同执行事实只引用唯一原ref，不抬覆盖数或完成数；同step两条互斥的真实执行观察逐条保原件并标冲突/incomplete，不能并集择绿；不同step有意复用同一份证据须证明其中确含各自所需观察，不因ref相同一律删事实。
4. **合法跳过**：small不运行独立审查、planning当前路线不做实施/spec/Phase，normal不生成build-code/verify-code阶段行；仍按各自实际方法核人读/审查面，不能把未选root步骤逐行标漏做。on_demand未触发保来源依据与executed=false；已声明必做但无原件不是合法跳过。
5. **错consumer**：把detail文档审套normal implementation-review、把build-prd status attestation套CODE目标RED，或仅换slug但body身份/观察不符，程序可核身份子面不符，人读不得completed；报告其余步骤继续，不新增许可证。
6. **人读完成与机械存在分离**：实际逐源读者得到完整方法、输入和反例，原输出指出每行human为何达/未达及证据ref；只有全部source行都有非空模板文本而无原始对象，必须未证。正文改写用原字节/标题保全，既有合法条件不得因缩短丢失。

## 精确路径与修改策略

以下是本设计建议给新 P7/T013 的8条 **生产方法声明写集**，不是本附件作者当前写权；本作者只新增本附件，未改这些source。各行的原方法SKILL继续唯一承载详细判据，仅steps的泛observable_result做有限指针回填。

| 必须回填的实际路径 | 实际owner／先后写主 | 窄改与不改 |
| --- | --- | --- |
| [workflows/make-decision/steps.json](<../../workflows/make-decision/steps.json>) | make-decision内容owner；P7/T013 | 每slug指根SKILL对应15步＋条件技能锚；保flows路径、id/slug/数量/schema/kind及原候选/真人/自查时点等义务。 |
| [workflows/build-prd/steps.json](<../../workflows/build-prd/steps.json>) | build-prd内容owner；P7/T013 | 六步指真实两次作者/确认/收口方法；不参数化或恢复terminal执行器。 |
| [workflows/build-plan/steps.json](<../../workflows/build-plan/steps.json>) | build-plan内容owner；P7/T013 | 十二步指当前产品/工程/测试/审查/确认owner；不把原方法内容复制成另一份全文。 |
| [workflows/build-code/steps.json](<../../workflows/build-code/steps.json>) | build-code内容owner；P7/T013 | 十二步指原Phase/frontier/RED/实际面/审查/AC/收口方法；不新增gate或弱化oracle。 |
| [workflows/verify-code/steps.json](<../../workflows/verify-code/steps.json>) | P6/T011先写，P7/T013后写，P7依赖P6当前交付 | 八步保P6新增复杂两时点/保旧件；仅补consumer引用，不覆盖前writer。 |
| [workflows/make-decision/flows/small/steps.json](<../../workflows/make-decision/flows/small/steps.json>) | make-decision small内容owner；P7/T013 | 九步指对应small方法，保一次确认、spec/Phase、免独审/默认无页。 |
| [workflows/make-decision/flows/normal/steps.json](<../../workflows/make-decision/flows/normal/steps.json>) | P5先写normal SKILL，P7后补steps消费，P7依P6传递含P5 | 十一步指normal原方法与P5同阶段两刷新接口；保完整review tuple和只make-decision阶段事实。 |
| [workflows/make-decision/flows/planning/steps.json](<../../workflows/make-decision/flows/planning/steps.json>) | make-decision planning内容owner；P7/T013 | 十一步指任务卡/两确认/交接方法；保不实施/不产specPhase/不物理交付。 |

**只读引用，不扩写集**：上节35个SKILL、五个skill-deps.yaml、五根workflow SKILL及light SKILL（P5已获页面写权部分不被重复分配）、review身份/record producer、portable内核terminal writer、runtime stage loader、AGENTS/CONSTITUTION、父PRD/历史原件。任何实际必须改SKILL的反证应精确指出原方法缺哪条输入/判据/失败与owner，再由spec作者加精确路径，而不是以泛目录证据下结论。

**其余受影响路径归现owner**：N9 `spec.md`来源映射/全局接口/Appendix A/OPEN-06、新P7独立卡/新P8末验收卡与`phases/index.md`由spec/Phase作者串行集成；`decision-log.md` OI-014/D-008/验收映射由主会话维护。P1/T001/T002、P2/T004与P3/T006是否需承接step报告行为和目标fixture，必须由新spec FR/AC明确后补其原卡/实际模块与合同测试写集；不能仅本附件一句“有消费方”声称现十环模块已经覆盖E4。给独立读者完整原映射与变更前后对象，真实读者结论保现普通evidence，不建新评审对象。

### G1 与验证限度

回填前先对上述8文件逐路径实测字节，和既有027/029/035同清单面分列：原方法/必读预算不重置，新增8steps面与附件面另列，不从主会话省读推算token收益。各文件只去同文件内重复套话，以原方法准确条件指针承接；原必要条件、量词、真人答复/授权、失败/恢复不能因缩短删掉。当前没有可证净字节减少设计数，不能预承诺减少或用这份附件增长假装减法。若净增/增加必读面，按父G1保未达限制，由计划确认披露，不自动豁免。

新增必读范围只限当前所选步骤的consumer锚及原方法适用分支；本附件不成为每个任务必须整份加载的上下文。8steps范围原始字节读数见外置 [065基线](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n9-final-chain-verification-20261020/quality/evidence/2026-10-20-065-e4-eight-steps-g1-scope-baseline.md>)，当前合计47762B；和 [035原基准](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n9-final-chain-verification-20261020/quality/evidence/2026-10-20-035-n8-merged-g1-baseline.json>) 并列而不重置原清单。verify步骤与原METHOD面重叠，不能重复相加。

本轮是设计，未改8steps、未运行新checker/测试/实际技能/provider。后续P7独立读者应按每个source完整正反输入核：方法指针真实可达、原义和必要条件保全、各step存在具体可观察完成与反例，冻结id/slug/数量/schema/kind与全部标题原样；指针可达/行数一致只证机械子面。已有N8三合同基线55/55原件只证当时合入行为，不代E4新回填验证或N9目标GREEN。

## 来源与覆盖

查了：当前五根SKILL、根steps、五skill-deps、small/normal/planning SKILL/steps；本单位前置current N9 decision/spec/7Phase及047来源（按当前必要段回读，不重演全仓扫描）；父PRD:464/530；现stage loader/portable核对函数和实际CLI调用锚。子研究实际FULL读35技能、八入口、五YAML、治理与stage-skill-plan，技能漏读0；其中来源/完成/反例已逐条列上，不冒实际运行。

没查：外部固定upstream、所有templates/bundles/递归同仓依赖、真实provider/浏览器/外部服务/成本窗口；这些不在当前有限source集合，不宣称已执行、无缺口或效果通过。图无当前source只作导航限制；程序返回/字面存在不替人读全义。本文无新的FR/AC正文、执行进度、完成签名或独立质量pass；最后的source范围与处理是否完整由当前spec/Phase作者和独立读者据真实原件核对。
