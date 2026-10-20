---
name: verify-code
description: 独立核对实际实现、真实消费者、失败边界和验收证据。
version: 5.2.0
---

# Verify Code

## 目标与边界

对当前实现做一次终末代码审查，同时独立复核本次受影响验收结果。读取 decision-log、spec、物理 Phase 和实现，索引只导航。不要重演 Talk/Grill 或替上游重写规格；代码问题留同任务修，材料疑点交作者并保留风险，历史材料与审查只作背景，不启用 pre 工作流。

## 方法

1. 按「## 一次架构机会」核task已有评估：有原件只引用，无则记未知、不重跑。核真实worktree/branch/HEAD、写集及来源，实际命令/结果用 `runtime/interface/run-command.mjs` 存当前quality/tests；去重/临时输出实际执行 `docs/standard-workflow.md`「证据只留原始件（同字节即同一事实）」，保本次真实immutable回执及正确output_ref。不一致先定位纠正，不猜task、不造人类确认/runtime gate，无法完成留缺口。接续实际按 `skills/stage-handoff/SKILL.md` 路径选择/回读交接、当前材料/task facts、有源阶段陈述、四类信息、证据/具体未完项；材料疑点交原作者。同task核当前范围沿已有授权续跑；缺失/错task披露，旧对象只读。读真实入口/consumer/diff、完整AC、build-code执行原件，分清已跑/未跑/失败/不可用/覆盖限制；缺原始来源/服务/样本/Phase正文保unknown/unavailable，不以文件存在/旧review/exit0填通过。追问代码成因（why）时先定位真实符号，结合 git blame/log 与原决定逐级回读每一环的理由及反证，区分已找到事实、竞争假设与 unknown；无法回读写缺口/原因，不把最新提交当原理由或用自报轨迹补链。常规审查逐项抽查母PRD/原始需求→decision-log已确认裁决→spec FR/AC→phases/index.md每条实际引用逐一打开的物理Phase任务/oracle→实现/测试/质量证据；现具名 `phases/P<n>-<结果短名>.md` 按原路径，历史裸 `phases/P<n>.md` 只读兼容。索引只导航，缺索引/正文留unknown/unavailable及具体缺口，不猜路径。用户采纳的范围内优化及受影响复验完成后才将当前对象交步骤2，不另加第二次正常审查。
   工作区/材料核对后，独立上下文实际按 `skills/knowledge-graph/SKILL.md` 用真实验证对象、标准、完整AC/写集查领域与历史约束；按职责/source/consumer有界选完整ID并回源，保代码/文档来源、可观察图龄（不可判记unknown）及本次验证影响或重复补强。五阶段开工义务不由旧报告代跑；缺图/无匹配/歧义/工具失败保真实诊断并回原文，不先更新现图/触发未许可文档抽取；图不代独立审查/业务效果。
2. 先实际消费 `docs/standard-workflow.md` 的「三审查点与结论真实性」，主会话提交其要求的原始依据并记录应用；终末范围按该段完整提供。读取 `skills/wh-review/SKILL.md` 的「Long-review host convention」并按其等待方法发起一次终末独立代码审查，正常使用 OCR，不可用时的记录口径见下节；本步完成以每路 provider 的原始 findings 或真实失败、取消、unavailable、实际执行者与覆盖限制均已保存且可定位为准，缺一路即本步未完成。原件「可定位」可由真实可读的既有原 ref 满足：同一命令、退出事实一致且内容比较确立同字节时只引用并标注，不要求为本路新写一份物理副本；各路真实终态、来源与失败仍分别保留，不能用旧回执冒本次执行。审查输入包含 verify-code 合同、provider 协议、stageReviewFocus、lens 正文、当前 diff、完整 AC 与可用执行原件；执行者检查真实消费者、生命周期、权限、数据泄漏、并发、取消、恢复、资源释放和测试强度。
3. 保留每路 provider 的原始 findings、实际执行者、错误、取消与覆盖限制。已安装 OCR 的失败不由其它 route 漂白。外发材料核实际范围、路径安全和敏感信息脱敏，缺真实只读能力时明确不可用。 首个 provider 到终态后立即处理并把迟到 findings 交给同一回调，剩余 provider 继续运行；不能因首个结果取消 sibling。跨 stage 的 build-code Phase 审查结果不得充当 verify-code 的第二次独立审查。
4. 在 `inspect-real-entry-and-tests` 原职责内实际消费 `skills/knowledge-graph/SKILL.md`：用affected核声明实现之外的波及面，用query核同类约定与标准来源；沿有界完整ID解释/必要协作path定向回真实source_file/origin原文。图标准过期或与当前文件冲突时由当前权威文件纠正，说明影响的验证case/边界，未核支持保unknown；不能把source路径存在、label、缓存同条或旧历史条款当现行标准。无新信号就记重复/无信号并继续实际入口和测试核对，不为凑收益拓展。
   穷尽核对各实际Phase的声明测试面，每Phase一行：「声明面 → 原件path/cwd/argv/exit/原始输出 → 已跑/未跑」。每未跑面写具体阻碍、可跑条件及owner；缺Phase/面/原件保持incomplete，review coverage不能补齐。核已有事实，不全重跑。失败分类/零重试/升级与provider排除按AGENTS「卡住与升级」；同一不可用事实不重复采集，其它安全验证与provider轴继续。
   再按金钱、隐私权限、不可逆后果、外部副作用、跨Phase旅程、失败恢复风险独立选样，逐case/AC列已查/未查理由。沿原始业务规则→真实入口→断言→实际效果核语义；模拟不冒外部效果，缺数据/权限/服务保持未知。分别给`business_effect=observed_pass|observed_fail|unknown|unavailable|N/A(reason)`、`semantic_test_adequacy=adequate|inadequate|unknown`、`code_review=clean|resolved|incomplete|failed`及证据。测试充分性据逐Phase逐面表、原始规则和实际断言判，缺表/原件为unknown/inadequate，不由provider coverage推导。
   按当前AC oracle定对象/真实输入/owner/时点；需检查时读`skills/spec-specify/templates/spec-template.md`唯一`checkAcceptanceObject`完整可执行块，从spec对象区取实参；依模板合同实读原始要求/项目库存/已接受计划或实际前端改动，核角色/理由/范围冲突；三源适用性/已读材料作context交同函数。保存对象输入、三源引用/范围/hash、返回与原始执行结果，不在此重写checker。模板producer缺件、提取/执行失败分别记source/producer、原因/影响/原owner；未运行不冒验证，检查成功非环境/业务效果。缺输入写具体数据/服务/权限/观察与未达断言，不扩判据/笼统后推。
   功能验收记录、代码审查回执、独立人读功能判断各自成件；功能判断据验收记录，各给路径，验收记录逐AC给结论与独立证据。审查回执的host conclusion/coverage仅从provider状态/findings推导审查观察、返回findings与完成/失败数量，不代表user case或完整覆盖，不代功能结论。按当前验收Phase具名引用读实际输出、执行/复验/分诊/独立走查原件，来源回读沿stage-handoff；不以审查字段/findings代业务，不新增同名功能字段、第二writer/质量对象图。
   逐Phase核Done承接AC的编号、`runtime/evidence/acceptance-evidence-validator.mjs`现成8值档位与具名ref；同处“本Phase自带判据小结”列已验（gate_cmd原件）、未验各项档位、条件与owner，不能用计数代归属。AC归属与实际判据只按spec正文的方式/时点/owner/条件/成功失败信号，不按依赖位置；未参与不得pass或下游补签。缺真实环境/用户在场/来源保unknown/unavailable，审查成功不代判。
   末Phase完整串演只复核沿途结论并补必要未闭环case，不作任何AC首次判定点。未达AC按standard-workflow「专业质量」“带欠账完成”显著留逐项缺口，只限完成声明、不阻同任务安全修复。核测试/命令/升级时读下节唯一正文。
5. 主会话逐条判断 finding，仅修影响当前交付的有效代码问题，不因材料偏好扩大范围。有效问题回原实施会话自动修复，严重问题优先修复，不以请求用户承担风险代替修复。确实无法在当前任务范围内解决时，列影响、证据、owner、原因和剩余选项，继续不受影响的工作，严重未修风险保持 incomplete；只有已有绑定该 finding 的用户真实决定才可记 accepted_risk，不能自行接受风险或伪造通过。
6. 对新修复和真实疑点只做必要定向复验，事先列 file/case 集合，把实际 command/exit/raw 和恢复结果写在对应 finding 处置旁；无改动或疑点时说明无需复跑。不重派第二次正常代码审查，不重做全量上游测试。
7. 保留原始审查与当前 fixed、rejected_invalid、accepted_risk、needs_human 处置。真实修复可报告 resolved，不能改写原 review 或用摘要覆盖失败。核对本次 actual/oracle、未执行事项和覆盖限制；材料问题交 owner，不另建恢复、继任或重绑定任务。逐 AC 结果形成后按 `skills/answer-as-page/SKILL.md`「当前任务驾驶舱」刷新页面：重新核对本次报告，环1–9写真实结论，交付前环10记 `skipped`（交付尚未发生）。两时点共用报告sha/decision指纹接口，页面与同名侧车写 caller 指定目录并保旧件；页面只读派生、报告为唯一权威。
8. 当前主会话按 `skills/stage-reflection/SKILL.md`「方法」「用户选择后的归口」「判断词表与完成检查」执行阶段收口，内部发布并读回交接：列范围、修复、原finding/处置、必要验证、业务结果、未知、上游材料风险及下一步。缺review/执行原件/严重风险处置保incomplete，同task继续修复，不冒验收或物理交付完成。对账由独立上下文消费项目声明命令和原件，当场展示时间窗/分账/计数，不落派生文件、不写死宿主脚本；未观测如实说明，finding修后仅受影响file/case复验并给理由。同task已修finding的resolved与无finding的clean完成含义相同，均不证全部材料/证据齐备。回复沿review_result_ref/task facts逐路列终态/原失败、finding处置、功能原件、仍缺输入和修复/取得条件；resolved findings、局部测试通过与审查完成各仅证原件所覆盖范围；原件不可读给具体路径/错误，不从incomplete推全部功能失败，不以provider成功/已修finding冒业务验收。复用既有来源、证据/完成说明，status JSON/枚举/thinQuality不变。incomplete只限质量声明；按当前材料/未完项继续同task，work_status/quality仅记材料质量事实，不作in_progress/incomplete冻结，不增continuation_allowed或runtime机制。closeout/PR 完成后按 `skills/answer-as-page/SKILL.md`「当前任务驾驶舱」与第7步共同接口重核报告，再刷新页面与同名侧车并保旧件，补环10与终态。

UI 适用时沿 `skills/ui-project-init/SKILL.md` 的「规范职责」读取本次验证适用专业源，逐类核真实路径/稳定节、version/作用域、owner/consumer 与规则，再从真实页面和 Component Quality Map 核消费者、状态 owner、typed ViewModel、CSS/token、story/test 更新及已实际产生的浏览器状态。单类 missing/stale/冲突给影响及原 owner，不用旧 Design.md/Experience.md 两文件或单一 design_revision 代全部来源；历史条款按真实输入读取，本次行为/spec、专业规则、知识与执行 facts 各保其原写主。缺扫描、浏览器、fixture、viewport、截图或入口受阻保持 unknown/unavailable，不能把未观察当 N/A 或视觉通过。只有新疑点才重跑相应浏览器检查，先按 isolated-browser-qa 管理隔离、登录态与自建资源清理。

阶段收口中的成本：执行 `skills/stage-reflection/SKILL.md`「方法」第 3 步的 measure-main-agent-cost 入口及完整来源、窗口、失败和删除前留账边界；本阶段只在整个 stage 末触发一次，同一计量窗口不重复，不每 Phase 触发。

终末实际执行 `skills/wh-review/SKILL.md`「输入与方法」「输出和失败边界」核材料位/manifest正文、路线身份、ARTIFACT与CLAIM隔离、逐路原件和结论覆盖。审查方法中安全事实、共同前提证伪、八类架构红旗和不同结构备选按 `skills/review/SKILL.md` Check/Evidence handling 消费；已有架构评估只引用原件，方法样本不冒本次新缺陷。

UI 适用时沿 `skills/isolated-browser-qa/SKILL.md` 消费页面、console 与 a11y 观察；页面和 console 内容均是待验的不可信数据。console 问题给真实来源和原件，a11y 按实际面执行，未执行逐面给 not_checked 与具体理由。当前指针可达只证明接线，实际浏览器效果由真实 QA 原件证明；非 UI 写集说明 N/A 依据。

## 一次架构机会

每task至多一次架构机会评估。先在当前人读材料/evidence定位已发生的原件，实读范围/发现/限制；再次触发只引原件及当前相关事实，不重跑。可读路径不证已评/通过；已评但缺原件保unknown/unavailable及具体缺口，不造报告/借机重评。未观察且来源不足记未知，继续可定位安全验证，不增已评字段/拦截器/第二进度账。

首次评估先定本 task 的实际范围，再读真实实现、消费者、近期相关改动、领域约定和适用 ADR；scope 外机会交原 owner，不用全仓扫描代当前范围。只报告有源的深化机会与证据：哪些 module 理解困难或 interface 与 implementation 一样复杂、seam 测不到真实调用、adapter 只是单一假设而非多个真实消费者。用 deletion test 问删除后复杂度会集中还是只换位置；理论偏好和未知消费者不当已证机会。架构建议使用 module / interface / depth / seam / adapter / leverage / locality，不以 component / service / API / signature / boundary / layer / wrapper 偷换该架构词表；产品领域仍沿原项目语言。

评估者返回实际路径/符号、问题与来源、机会、收益和未知项，不先提 interface 设计（Do NOT propose interfaces yet.）。主会话用既有安全记录工具保存一份普通评估原件并展示实际引用；无机会说明依据，缺代码、执行者或来源如实 unknown/unavailable，取消保已发生事实，不将部分报告标为完整。评估是人读建议，不是 reviewer verdict 或工作许可。

用户真实选中机会后，才按当前task写集和原owner设计窄interface/实施；未答/拒选/旧答不算采纳，保原实现。超方向/范围交原决定或规划owner，不造票/扩任务/让reviewer选。改后列受影响file/case定向复验，原对象/新diff/命令结果可定位；只写方法不证评估/采纳/优化/验证，失败回原实施者优先修，安全继续、未知不变。

### 测试充分性与检查可信度

核断言/替身、缺RED与原件时，读[backend-testing「行为测试与证伪」](../../skills/backend-testing/SKILL.md#行为测试与证伪)及同文件「执行事实」，沿其TCR/冻结保护与失败分类执行。新增/扩展检查用同判据：合法pass→仅受控违规改变后目标fail→恢复同合法输入pass，核argv/cwd/raw、exit/signal/timeout及恢复字节；同字节复用原件。违规仍绿报具名遗漏case，恢复未通过incomplete；不以方法读回冒检查器接线。适用代码改动做受控行为变异（如取反新增条件），目标断言须fail再恢复，不拿字符串变异充数；无新增/扩展检查按真实diff写N/A，只免执行，仍消费完整正反输入。

依赖升级先读changelog，major另读migration notes；逐项或具理由关联小组升级，同一受影响行为前后验证。核直接/传递lockfile diff，包管理器生成、不手改；安装成功、缺notes/lockfile/前后行为不能当完成。无升级给实际diff依据，不凑依赖。

逐项报告diff五类削弱的路径/来源/理由：阈值/严重级降低；新增.skip、删case/唯一结果断言；@ts-ignore/eslint-disable/istanbul ignore等静音；抛错stub/空catch/TODO代实现；无真实决定的新allow/exception。等价重构/收紧不误报，旧有源例外按原范围；exit0不盖无源削弱。

读producer原报告、输入数/范围：exit0或ALL CHECKS PASSED不盖report-only漂移，零输入不证覆盖；exit2、null/缺件、未跑/环境失败保exit/signal/timeout、未达断言、owner/恢复条件，不写clean。历史target存在不证行为，step方法非命令，validator事实非自动阻断；合法advisory不当故障。不改工具退出语义/加Block或质量对象。

## OCR 能力与缺省记录

先检查 `ocr` 命令与 `ocr --version`。OCR 不可用（命令不存在（ENOENT）或版本低于1.12.9）如实记 unavailable/unknown，不换执行者，保留检测输出与原始失败；版本检测其它错误不推断未安装。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关；已装 OCR 失败、超时、取消、无效输出、零成功路或空 findings 均保留原始事实。依赖真实 OCR 的测试在未安装时显式 skip 并披露；不把不可用写成空 findings。

## 人为门与审查点

用户已授权任务进入实施，或已选择方向与实施计划后，该授权持续覆盖本 task 范围内的验证、独立审查、修复及完成交付必要的 commit、push、merge；阶段切换、新会话和 handoff 不重置授权。本阶段直接执行，不要求日常确认、本地提交授权、技术验收确认或用户承担严重风险；新增方向或任务范围不能据此擅自扩大。能通过真实入口观察的业务效果自动验证；确实依赖真人、缺权限、数据或外部服务的部分，列清所需条件、操作、成功/失败恢复判据和应回传证据，保持 unknown/unavailable/incomplete，继续其它验证，不将其变成中间确认门或推导为业务通过。真实平台权限限制与无法解决的方向问题同样如实报告。 失败重试按 `AGENTS.md`「卡住与升级」及 `docs/standard-workflow.md`「stage 结束」实际执行适用/排除、零重试、新事实判定与升级；收到答复按当前材料续跑，不新建任务或账本。

Git授权与物理收口执行唯一消费 `skills/stage-closeout/SKILL.md`，本caller不保第二执行实现或旧plan续跑分支。已有授权是记录/消费来源，不是提问门；本阶段主会话仍核真实授权、允许范围和当前验证结果并把输入交共享方法。普通Git前按其方法record/consume动作/分支/HEAD，保既有scoped例外；最终close归档/删除/清理仍先展示实际结果、质量限制、目标范围与具名例外并取得一次真实范围确认，未答/拒绝不执行该范围。必要commit/push/merge沿持续授权，无技术验收确认；整树丢弃、强推、任务外改动不包含。含PR时立即展示真实URL并同流继续已授权动作，不等待新回复；不恢复旧close plan。三必留审查点为build-plan wh-review合并、build-code每Phase OCR、本阶段终末OCR，不恢复全Phase集成审查。

## 使用技能与安全收口

按 `skill-deps.yaml` 直接读取方法；真实消费者检查、定向验证和独立审查按项目分工委派，主会话负责发现处置、用户选择与总结。技能与工具缺失如实说明，不能增加公共命令或新状态对象。原子写入、共享记录冲突保护与工作区核对分别使用现有窄工具，失败保持可见；历史原件只读。

本阶段完成已授权验证/修复后，实际读取并按 `skills/stage-closeout/SKILL.md` 执行共享收口，由其委派knowledge-graph更新并回读代码图与文档图两类真实状态/费用答复/未完成项，不能用代码成功冒文档已更新。质量结论、finding处置、正式task facts及handoff仍归本阶段主会话；共享方法缺失/调用失败明确unavailable并交其owner，不复制旧方法兜底，不以缺质量冻结同任务修复或假报已交付。

阶段末主会话只执行一次 `skills/stage-handoff/SKILL.md`「信息来源」「回读结果」「结束条件与边界」，保存交接并报告实际不可变绝对路径：材料现状、代码、真实检查、风险/下一步、默认安全收口路径、任务分支、待最终确认动作及具名保留原因。执行不是门，但须实际执行/回报；缺失写原因/影响，披露不代完成，不要求固定机器复盘/交接认证。正式阶段事实仍由公共流程处理，实现/质量/业务验收/发布/物理close分别报、不互代。确认后逐项回读执行结果，保旧raw/review原件，不恢复旧close plan或新增公共节点。局部 Phase 摘要不触发收口，原失败与缺口可见，持续授权不代候选采纳。

## 写作与固定来源

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；本 workflow 只保原步骤与分支调用，不复制规范。

参考 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/improve-codebase-architecture/SKILL.md`（scope、deletion test、先机会后设计）与 `skills/engineering/codebase-design/SKILL.md`（架构词表）；写作来源为 `skills/productivity/writing-for-agents/SKILL.md`、`SKILL-MECHANICS.md` 与 docs。固定来源是方法依据，不证明本次已获得行为效果。

本地保当前材料 owner、原步骤、真实用户回复、原失败与独立审查；只吸收适用方法，拒绝外置 tracker、GitHub ticket API、宿主 setup/Skill 硬依赖和第二进度权威。旧 bridge/外部 session 只读保历史 provenance，不作 active 执行、复盘、交接或 close 的门。方法接收真实项目材料、允许路径与宿主已批准的能力，缺源或能力如实报错，不绑定任务绝对路径或账号。
迭代本文件的固定来源时，读取 skills/stage-reflection/SKILL.md 的「固定来源、本地偏离与更新入口」节，以本文件上列具名来源应用该节更新方法；只在核到真实上游更新或更优候选时才决定采用，不自动追 HEAD。
