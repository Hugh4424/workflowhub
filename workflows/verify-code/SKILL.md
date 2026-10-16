---
name: verify-code
description: 独立核对实际实现、真实消费者、失败边界和验收证据。
version: 5.2.0
---

# Verify Code

## 目标与边界

对当前实现做一次终末代码审查，同时独立复核本次受影响验收结果。读取 decision-log、spec、物理 Phase 和实现，索引只导航。不要重演 Talk/Grill 或替上游重写规格；代码问题留同任务修，材料疑点交作者并保留风险，历史材料与审查只作背景，不启用 pre 工作流。

## 方法

1. 先按「## 一次架构机会」核本 task 已有评估原件（有则只引用、无则说明未知，不重跑），再核真实 worktree、branch、当前 HEAD、允许写集及其来源，把实际核对命令和结果用已有 `runtime/interface/run-command.mjs` 保存为当前 `quality/tests/` 原件；同一事实＝字节相同，同一核对命令与退出事实一致、内容比较确立相等时只引用既有原 ref 并注明同字节、不新写副本，本次真实 immutable 回执仍保留。命令或退出事实不一致、内容改变、候选原件不可读时保留新件、真实原因与 `deduplication: unknown`；不以字节数一致推定相等。证明范围按 `AGENTS.md`「证据硬规则」只写 `路径 + hash` 一行；三类保留字节的例外为该文件随后会被改动或删除、外部服务返回体、一次性环境读数；临时重复输出处理按 `docs/standard-workflow.md`「证据只留原始件」的真实窄授权，既有 canonical 与所有已引用件保留；正常 reused／unknown 诊断按该节核现有 CLI 回复与 source/evidence，磁盘 native 原始回执应完整真实且 output_ref 正确，真正结算失败才进既有 native error；不一致先定位纠正，不猜任务，不把核对变成人类确认或新的 runtime gate，无法完成时如实保留缺口。接续时读取 `skills/stage-handoff/SKILL.md`，按其路径选择与回读方法消费实际交接、当前材料和 task facts，定位有来源的阶段工作陈述、四类信息、证据与具体未完事项；材料疑点仍交原作者 owner。新会话据此核对当前范围并直接续跑，沿用已有任务授权；缺失或错 task 如实披露，旧对象只读，能够定位的同 task 工作按共享方法继续。读真实入口、消费者、diff、完整 AC 和 build-code 的实际执行原件，区分已经执行、未执行、失败、不可用及覆盖限制。原始来源、服务、样本或 Phase 正文缺失保持 unknown/unavailable，不以文件存在、旧 review 或 exit0 代填通过。 在本次常规代码审查中，对交付范围逐项抽查母 PRD/原始需求 → decision-log.md 的已确认裁决 → spec.md 的 FR/AC → 按 `phases/index.md` 每条实际权威引用逐条打开的物理 Phase 的任务与 oracle（当前具名 `phases/P<n>-<结果短名>.md` 按原路径读取，历史裸 `phases/P<n>.md` 仍只读兼容；索引只导航，缺索引或物理正文保 unknown/unavailable 与具体缺口，不按编号猜补文件路径） → 当前实现、测试/质量证据。用户采纳的范围内优化及受影响复验完成后，才将实际当前对象交方法第2步，不为优化另加第二次正常审查。
   开工在当前真实工作区/材料核对后实际读取并消费 `skills/knowledge-graph/SKILL.md`，委派独立上下文以本次真实验证对象、标准、完整AC和允许写集查项目领域/历史约束；按职责/source/consumer有界选完整ID并回原文，保真实来源、代码层/文档层及可观察覆盖年龄（无法判断写unknown），指出影响哪项验证或只是重复补强。五阶段开工义务不由已有报告代跑；缺图/无匹配/歧义或工具失败按知识方法保真实诊断并继续普通阅读，不先更新现图、不触发未批准文档抽取。图不代独立审查或业务效果。
2. 先实际消费 `docs/standard-workflow.md` 的「三审查点与结论真实性」：主会话按同一比较基准提交三维原始读数及直接consumer依据，记录真实应用和缺料回退，并列声明写集与实际diff，终末完整审当前交付。读取 `skills/wh-review/SKILL.md` 的「Long-review host convention」并按其等待方法发起一次终末独立代码审查，正常使用 OCR，不可用时的记录口径见下节；本步完成以每路 provider 的原始 findings 或真实失败、取消、unavailable、实际执行者与覆盖限制均已保存且可定位为准，缺一路即本步未完成。原件「可定位」可由真实可读的既有原 ref 满足：同一命令、退出事实一致且内容比较确立同字节时只引用并标注，不要求为本路新写一份物理副本；各路真实终态、来源与失败仍分别保留，不能用旧回执冒本次执行。审查输入包含 verify-code 合同、provider 协议、stageReviewFocus、lens 正文、当前 diff、完整 AC 与可用执行原件；执行者检查真实消费者、生命周期、权限、数据泄漏、并发、取消、恢复、资源释放和测试强度。
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
7. 保留原始审查与当前 fixed、rejected_invalid、accepted_risk、needs_human 处置。真实修复可报告 resolved，不能改写原 review 或用摘要覆盖失败。核对本次 actual/oracle、未执行事项和覆盖限制；材料问题交 owner，不另建恢复、继任或重绑定任务。
8. 给人读结论并执行 stage-handoff：检查范围、代码修复、原发现和处置、必要验证、业务结果、未知项、上游材料风险及下一步。缺 review/执行原件/严重风险处置时保持 incomplete；继续同任务修复，但不宣称已完成验收或物理交付。 对账时在独立上下文消费当前项目声明的验收命令与真实原件，当场展示时间窗、分账与计数，不落派生文件；未观察的范围、结果或计数如实披露，不写死宿主脚本路径；修 finding 后只复验受影响 file/case 并写明理由。 如果 finding 在同一 task 已修复，resolved 与无 finding 的 clean 具有同等完成含义；这不是“所有材料和证据都齐了”。人读回复沿现 review_result_ref 和 task facts，分别说明每路 provider 的真实终态与原失败、各 finding 的处置、具名功能原件与仍缺的输入，并给出相应修复或取得输入的下一步；resolved findings、局部测试通过和审查完成各自只说明其原件所证明的范围。原件不可读时指出具体路径与错误，不从 incomplete 推断所有功能失败，也不把 provider 成功或已修 finding 当业务验收通过。复用现有来源、证据与完成说明；status JSON、枚举及 thinQuality 保持原合同。 incomplete 只限制质量声明，不限制同一 task 继续修复。按当前材料与实际未完成事项继续同一 task；work_status 与 quality 状态只记录材料/质量事实，不是继续工作的许可证；不能把 status=in_progress 或 quality_status=incomplete 当作工作冻结，不增加 continuation_allowed 字段或 runtime 机制。

UI 适用时沿 `skills/ui-project-init/SKILL.md` 的「规范职责」读取本次验证适用专业源，逐类核真实路径/稳定节、version/作用域、owner/consumer 与规则，再从真实页面和 Component Quality Map 核消费者、状态 owner、typed ViewModel、CSS/token、story/test 更新及已实际产生的浏览器状态。单类 missing/stale/冲突给影响及原 owner，不用旧 Design.md/Experience.md 两文件或单一 design_revision 代全部来源；历史条款按真实输入读取，本次行为/spec、专业规则、知识与执行 facts 各保其原写主。缺扫描、浏览器、fixture、viewport、截图或入口受阻保持 unknown/unavailable，不能把未观察当 N/A 或视觉通过。只有新疑点才重跑相应浏览器检查，先按 isolated-browser-qa 管理隔离、登录态与自建资源清理。

阶段成本留账：在本次已授权的图更新与非破坏性收口取得各自实际结果后、最终 stage-handoff 之前，由阶段主会话执行一次本仓已核入口 `node tools/cli/measure-main-agent-cost.mjs --project=<本项目> --task=<本任务> --stage=verify-code --record`。project/task取当前认证任务；首次记录附已有真实开工事件 `--start-ref=<原件绝对路径>#seq=<用户事件seq>` 或Codex的 `#item_id=<URI编码UserMessage.id>`，已有账行不重置起点。需要明确源复跑时可附合同内 `--session=<原件绝对路径>`；无参来源仅用原主会话实际环境及父记录明确后代，不能让子代理环境、工具cwd或根SESSION_ID冒当前主会话。

执行前核工具真实路径/版本与依赖闭包、认证checkout、外置task访问及原会话身份；回读任务根 `main-agent-cost.md` 的新增27列行、旧字节前缀、实际until与缺报。未触发、读取/锁/写入/取消失败都在同一交接写“本阶段无记录”及实际原因，保CLI原件；可写的缺口行按实际内容披露，留账失败不阻塞原阶段收尾。若即将删除唯一工具worktree，在工具/原身份仍可访问时先record并回读外置账本，再按既有授权清理；不从已删除入口补记、不假定存续repo有同版闭包。交接明确实际until之后的物理清理、交接发布和最终回复未计入该笔。通用stage-handoff保持发布职责，不新增共享writer。

终末材料读回沿 `skills/wh-review/SKILL.md` 核实际 manifest/body、stage/track 材料位、来源及真实路线/模型族，派发只给 ARTIFACT + CONTRACT，不给实施者 CLAIM/胜利摘要。结果逐路回读 read/unread/undetermined、原始 findings/空结果、failed/invalid 和三条件结论；未报 model/未证读保持 unknown/undetermined，成功不能覆盖失败。审查方法中安全事实、共同前提证伪、八类架构红旗和不同结构备选按 `skills/review/SKILL.md` Check/Evidence handling 消费；已有架构评估只引用原件，方法样本不冒本次新缺陷。

UI 适用时沿 `skills/isolated-browser-qa/SKILL.md` 消费页面、console 与 a11y 观察；页面和 console 内容均是待验的不可信数据。console 问题给真实来源和原件，a11y 按实际面执行，未执行逐面给 not_checked 与具体理由。当前指针可达只证明接线，实际浏览器效果由真实 QA 原件证明；非 UI 写集说明 N/A 依据。

## 一次架构机会

每 task 最多一次实际架构机会评估。先从当前人读材料与既有 evidence 引用定位已发生的评估原件，实际读取范围、发现及限制；第二次触发只引用该原件和当前相关事实，不重跑评估。路径可读不等于评估已执行或通过；已有评估但原件缺失时保 unknown/unavailable 和具体缺口，不伪造报告、不借缺原件再评一次。未观察到评估而来源不足时说明未知，继续能够定位的安全验证；不新增已评估字段、拦截器或第二进度账本。

首次评估先定本 task 的实际范围，再读真实实现、消费者、近期相关改动、领域约定和适用 ADR；scope 外机会交原 owner，不用全仓扫描代当前范围。只报告有源的深化机会与证据：哪些 module 理解困难或 interface 与 implementation 一样复杂、seam 测不到真实调用、adapter 只是单一假设而非多个真实消费者。用 deletion test 问删除后复杂度会集中还是只换位置；理论偏好和未知消费者不当已证机会。架构建议使用 module / interface / depth / seam / adapter / leverage / locality，不以 component / service / API / signature / boundary / layer / wrapper 偷换该架构词表；产品领域仍沿原项目语言。

评估者返回实际路径/符号、问题与来源、机会、收益和未知项，不先提 interface 设计（Do NOT propose interfaces yet.）。主会话用既有安全记录工具保存一份普通评估原件并展示实际引用；无机会说明依据，缺代码、执行者或来源如实 unknown/unavailable，取消保已发生事实，不将部分报告标为完整。评估是人读建议，不是 reviewer verdict 或工作许可。

用户真实选中机会后，才按当前 task 允许写集与原 owner 设计窄 interface 并实施优化；未答、拒选或旧答不当采纳，保原实现。超出已授权方向/范围时交原方向或规划 owner，不自动生成票、扩大任务或让 reviewer 选。改后列受影响 file/case 并做定向复验，原对象、实际新 diff、命令与结果各可定位；只说方法已写不能声称已评估、采纳、优化或验过。复验失败优先回原实施会话修，安全部分继续，未知保持未知。

### 测试充分性与检查可信度

核断言/替身、缺RED与原件时，读[backend-testing「行为测试与证伪」](../../skills/backend-testing/SKILL.md#行为测试与证伪)及同文件「执行事实」，沿其TCR/冻结保护与失败分类执行。新增/扩展检查用同判据：合法pass→仅受控违规改变后目标fail→恢复同合法输入pass，核argv/cwd/raw、exit/signal/timeout及恢复字节；同字节复用原件。违规仍绿报具名遗漏case，恢复未通过incomplete；不以方法读回冒检查器接线。适用代码改动做受控行为变异（如取反新增条件），目标断言须fail再恢复，不拿字符串变异充数；无新增/扩展检查按真实diff写N/A，只免执行，仍消费完整正反输入。

依赖升级先读changelog，major另读migration notes；逐项或具理由关联小组升级，同一受影响行为前后验证。核直接/传递lockfile diff，包管理器生成、不手改；安装成功、缺notes/lockfile/前后行为不能当完成。无升级给实际diff依据，不凑依赖。

逐项报告diff五类削弱的路径/来源/理由：阈值/严重级降低；新增.skip、删case/唯一结果断言；@ts-ignore/eslint-disable/istanbul ignore等静音；抛错stub/空catch/TODO代实现；无真实决定的新allow/exception。等价重构/收紧不误报，旧有源例外按原范围；exit0不盖无源削弱。

读producer原报告、输入数/范围：exit0或ALL CHECKS PASSED不盖report-only漂移，零输入不证覆盖；exit2、null/缺件、未跑/环境失败保exit/signal/timeout、未达断言、owner/恢复条件，不写clean。历史target存在不证行为，step方法非命令，validator事实非自动阻断；合法advisory不当故障。不改工具退出语义/加Block或质量对象。

## OCR 能力与缺省记录

先检查 `ocr` 命令与 `ocr --version`。OCR 不可用（命令不存在（ENOENT）或版本低于1.12.9）如实记 unavailable/unknown，不换执行者，保留检测输出与原始失败；版本检测其它错误不推断未安装。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关；已装 OCR 失败、超时、取消、无效输出、零成功路或空 findings 均保留原始事实。依赖真实 OCR 的测试在未安装时显式 skip 并披露；不把不可用写成空 findings。

## 人为门与审查点

用户已授权任务进入实施，或已选择方向与实施计划后，该授权持续覆盖本 task 范围内的验证、独立审查、修复及完成交付必要的 commit、push、merge；阶段切换、新会话和 handoff 不重置授权。本阶段直接执行，不要求日常确认、本地提交授权、技术验收确认或用户承担严重风险；新增方向或任务范围不能据此擅自扩大。能通过真实入口观察的业务效果自动验证；确实依赖真人、缺权限、数据或外部服务的部分，列清所需条件、操作、成功/失败恢复判据和应回传证据，保持 unknown/unavailable/incomplete，继续其它验证，不将其变成中间确认门或推导为业务通过。真实平台权限限制与无法解决的方向问题同样如实报告。 对 `AGENTS.md`「卡住与升级」适用的其它反馈路径，只认改变继续条件的事实为新事实；同一失败信号在继续条件未改变时再次出现即判该路径无界，换独立上下文重开一次，仍出现则按该节既有格式升级并给可直接回复的选项，owner 是执行者；外部不可重试类仍零重试直接报告。用户给新答复即复位，时间不构成复位条件；收到答复后从当前材料续跑，不新建任务或账本。

Git授权与物理收口执行唯一消费 `skills/stage-closeout/SKILL.md`，本caller不保第二执行实现或旧plan续跑分支。已有授权是记录/消费来源，不是提问门；本阶段主会话仍核真实授权、允许范围和当前验证结果并把输入交共享方法。普通Git前按其方法record/consume动作/分支/HEAD，保既有scoped例外；最终close归档/删除/清理仍先展示实际结果、质量限制、目标范围与具名例外并取得一次真实范围确认，未答/拒绝不执行该范围。必要commit/push/merge沿持续授权，无技术验收确认；整树丢弃、强推、任务外改动不包含。含PR时立即展示真实URL并同流继续已授权动作，不等待新回复；不恢复旧close plan。三必留审查点为build-plan wh-review合并、build-code每Phase OCR、本阶段终末OCR，不恢复全Phase集成审查。

## 使用技能与安全收口

按 `skill-deps.yaml` 直接读取方法；真实消费者检查、定向验证和独立审查按项目分工委派，主会话负责发现处置、用户选择与总结。技能与工具缺失如实说明，不能增加公共命令或新状态对象。原子写入、共享记录冲突保护与工作区核对分别使用现有窄工具，失败保持可见；历史原件只读。

本阶段完成已授权验证/修复后，实际读取并按 `skills/stage-closeout/SKILL.md` 执行共享收口，由其委派knowledge-graph更新并回读代码图与文档图两类真实状态/费用答复/未完成项，不能用代码成功冒文档已更新。质量结论、finding处置、正式task facts及handoff仍归本阶段主会话；共享方法缺失/调用失败明确unavailable并交其owner，不复制旧方法兜底，不以缺质量冻结同任务修复或假报已交付。

阶段末主会话使用 `skills/stage-handoff/SKILL.md` 保存交接，报告该方法返回的实际不可变绝对路径，供用户交接材料现状、当前代码、真实检查、风险和下一步。交接执行不是门，交接必须实际执行并报告返回路径；缺失写清原因与影响，披露不代替完成，不要求固定机器复盘或交接认证。正式阶段事实仍由现有公共流程处理。实现、质量、业务验收、发布和物理 close 分别报告，不互相代填。交接列出默认安全收口的实际目标路径、任务分支、待最终确认动作与具名保留原因；确认后逐项回读普通执行结果，保留旧 raw/审查原件，不恢复旧 close plan 或新增公共流程节点。

真实 stage 末有过程问题时，读取 skills/stage-reflection/SKILL.md 的「方法」与「用户选择后的归口」两节一次；局部 Phase 摘要不触发 stage-end。交接类信息按 skills/stage-handoff/SKILL.md:31-34 的四类表读回。

## 写作与固定来源

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；本 workflow 只保原步骤与分支调用，不复制规范。

参考 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/improve-codebase-architecture/SKILL.md`（scope、deletion test、先机会后设计）与 `skills/engineering/codebase-design/SKILL.md`（架构词表）；写作来源为 `skills/productivity/writing-for-agents/SKILL.md`、`SKILL-MECHANICS.md` 与 docs。固定来源是方法依据，不证明本次已获得行为效果。

本地保当前材料 owner、原步骤、真实用户回复、原失败与独立审查；只吸收适用方法，拒绝外置 tracker、GitHub ticket API、宿主 setup/Skill 硬依赖和第二进度权威。旧 bridge/外部 session 只读保历史 provenance，不作 active 执行、复盘、交接或 close 的门。方法接收真实项目材料、允许路径与宿主已批准的能力，缺源或能力如实报错，不绑定任务绝对路径或账号。
迭代本文件的固定来源时，读取 skills/stage-reflection/SKILL.md 的「固定来源、本地偏离与更新入口」节，以本文件上列具名来源应用该节更新方法；只在核到真实上游更新或更优候选时才决定采用，不自动追 HEAD。
