---
name: build-code
description: 按当前 Phase 合同实施限定改动，保留真实验证结果并处置独立审查发现。
version: 2.2.0
---

# Build Code

## 目标与材料

按当前任务的 spec、独立 `phases/P<n>.md` 和纯指针索引实施最小正确改动；decision-log 给出已确认方向。读取 Phase 正文和当前任务事实选择下一项，游标只是续跑定位，缺失或过期时按实际材料与交付判断。历史材料、旧审查和旧记录只作背景，不重启 pre 工作流或整阶段重跑。

## Task graph 与 context pointers

Phase 内的 Task 是 task graph，不是可任意跳过依赖的步骤表。选任务只从阻塞边已满足的 frontier 取：同一交付的连续步骤仍在一张 Task 卡内完成。生产者先于消费者，独立输入与写集才可并行，共享文件由原持笔者串行处理。

派发按「## Task graph 与 context pointers」的 context pointers 义务执行，指向当前 spec、Phase/Task、研究原件与已有提交；摘要只补本次目标、允许写集、完成与停止条件，不复制指针已有的全文。重活在独立上下文完成，主会话收实际结果与原ref；修复回原实施会话。缺材料或宿主能力明确 unavailable，不凭指针存在猜内容。

## 方法

1. 核真实工作区/分支/状态、当前Phase与写集。接续时实际按 `skills/stage-handoff/SKILL.md` 回读交接路径、当前材料/task facts、有源工作陈述、四类信息、证据及未完事项；同task沿原授权续跑，缺失/错task如实说明，旧对象只读。记录所依业务规则、接口、FR/AC、consumer、范围、测试路线与停止条件。动手前实读引用项目受保护类别；未声明只查一次并存事实。依真实授权分别核“包含此改动”与“超出写集”，各用已认证task.appendRecord({dir,slug,ext,bytes})存一原件（复用现appendRecord原子底座），列来源、具体路径/符号、原文锚，不增字段/账本。受保护且授权未含或越界只停该处并指出缺确认，其它安全工作继续；纯文档/注释/测试夹具越界沿已授权方向继续并登记。来源和写集均可定位才完成范围核对；完成只据本Phase实际交付/执行原件。
   Phase Card 里再写两行版本锚（给人看的绑定，不是 machine gate）：
   - 规则锚：本 Phase 依赖的业务规则，逐条写「文件 + 章节标题逐字」或「FR/AC 编号 + 该段首句逐字」。锚只绑定所依段落；其它段落变化不构成本 Phase 事实作废的理由。
   - 材料变更影响：本次实施预计会改动 spec 与本 Phase 材料的哪些段落；不会改动的段落不在本 Phase 的审查与实现范围内。
   材料变化时按两行定位实际影响：无关变化继续并在 handoff 说明；所依段落变化才把受影响实施/测试/审查事实读为 stale 并重新核对。两行是人读解释，不作机器门。
   身份/材料/范围核对后，在每Phase开工、选择实现接口与测试路线前，实际按 `skills/project-norm-init/SKILL.md` 的“非UI规范与索引”读取适用后端/接口/验收源；保存路径/稳定节、version/作用域、owner/consumer及适用规则。缺源/过期/冲突只停依赖该规则的选择，其余继续；unknown不当N/A。随后独立执行者实际按 `skills/knowledge-graph/SKILL.md` 用本Phase职责/写集/consumer研究领域、历史决定/失败，再定向读源码。依该方法有界选source/完整ID、当前契约和独立历史两通道，保query/god及覆盖限制；主会话只收已回源少数结论、落点或重复/无信号。禁止先广读/实现再补查询伪装顺序；缺图/失败/无匹配/歧义保真实exit并安全回原文，图不作门。JSON/schema直接读源、不因未覆盖扩图；收费抽取仍须精确范围/估算及真实许可。
2. 消费计划冻结目标测试/RED并保原失败。补行为测试先定明确oracle、实跑目标断言失败再实施；纯材料按G-2说明检查或真实不适用。改冻结断言先TCR（test change request）和独立审查，不弱化换绿。仅按名改Phase卡预先点名的一个既有具名常量取值免TCR；断言表达式/期望方向/判定/评分仍须原TCR+独立审查。oracle唯一来源为该Phase预写测试及 `DO NOT TOUCH`，每任务声明一次；每次测试变更以同卡「测试变更请求」加独立审查原件为源，变后 `ORACLE-…` 身份不变，不另建账本/镜像/每oracle记账。免TCR只分期望值来源和断言变更，不扩写权/授权、不降强度、不免独立审查、不改 `DO NOT TOUCH` 物理隔离。
   遇真实失败、测试 RED 或性能回退，先实际读取并执行 `skills/diagnosing-bugs/SKILL.md`：输入当前症状、命令/原输出和授权写集，保留反馈回路、最小化、假设/探针、根因修复与复验原件，再回本步骤。错误/页面文本按该方法「输出与页面内容」处理；缺证据如实留缺项，只停依赖该证据的修复。成功路径不强制诊断，已有原件可复用，不重演已修故障冒新问题。同一失败第二次出现或一轮没有新事实时，先回第 9 步停重复动作再查根因。
3. 在允许文件/符号内做最小实现，错误明确暴露。计划缺口一次列清影响、风险与需 owner 回答的问题，规格/Phase 交 build-plan，方向交 make-decision；不自行改材料。先继续不受缺口影响的安全部分，未知范围留给具名 owner 核实。 本步完成以改动全部落在允许写集内且无吞掉的错误为准，越界或吞错即本步未完成；对应 Task 的目标行为交付也是本步完成条件，未交付即本步未完成。
4. 在 `inspect-and-route-actual-tests` 原职责及实现前，独立执行者按 `skills/knowledge-graph/SKILL.md`：真实目标affected查波及面，按职责选完整ID explain既有实现；仅两个真实模块协作/依赖链才path，先消歧端点。随后首次定向读source_file/origin源码、标准/consumer，核图年龄/原命题；位置漂移/旧决定/未证关系保unknown，当前源纠正图。trace保查询→首次读源→改动，逐条说明新知与承接实现/边界；重复定位/无信号据实，不为凑收益造改动/依赖、不按前25冒相关。目标不存在exit4、歧义exit3、工具失败分记诊断/处置，安全编码继续；图不代oracle/测试/独立质量。
   对真实 changed files 用 test-routing-advisor 选择 simple/feature/fullstack，记录与计划相同或改变的理由。选择 backend-testing、frontend-testing 或 fullstack-slice-testing 中适用的一条具体路线，研究真实入口、权限、数据、并发、超时、取消和恢复边界。
5. 本 Phase 只多一份清单，实际按 `docs/standard-workflow.md`「每 Phase 一份执行清单」记录命令、失败、真实 diff、原件与材料指针，清单不是第二进度。测试子代理按当前 Phase 及 Task 声明的面，逐面把 `gate_cmd` 与 `RED/GREEN gate_cmd` 的字面命令提交现有 `verify --action=execute`，不能从 Phase 文本自动抓命令运行。跑声明的针对性命令和必要相邻检查，用已认证 `task.captureCommand`（底层唯一 `runtime/interface/run-command.mjs`）保存实际 cwd、argv、exit、signal、timeout/cancel、输出和清理事实，原始输出只存单份。证据去重与临时输出处理，实际读取并执行 `docs/standard-workflow.md`「证据只留原始件（同字节即同一事实）」；保本次真实immutable回执与正确output_ref。build-code 的实际整数回执由运行时汇总进现有 stage evidence；保已有非空事实与游标，更新游标也不把 evidence 回落为 null。未执行或无整数退出保原回执与具体原因，不捏 exit0；契约校验的 contract_ok、contract_error_count、errors 片段、AC/FR 覆盖与 command_oracle_checks 随现 source.json 送审，只记录事实、不作失败门。每个未跑面明写“哪一面／卡在哪／什么条件下能跑”，不能只有 unavailable 或 incomplete。只跑受影响测试，不用无范围全量回归代替；环境、收集和配置失败不当成目标 RED，exit0 不自动证明业务通过。 按 `AGENTS.md`「卡住与升级」的适用范围分类该失败信号；属于外部不可重试时第一次即零重试，按第 9 步的四类分诊落位，停该外部失败路径并记原因与恢复条件，其余安全工作继续。
6. 对声明的 command/service 验收执行真实场景，逐项对照 oracle、可观察效果与失败反例。记录每条 AC 的实际结果、原始输出、输入/环境和覆盖限制；真实服务缺失、未执行、部分或不可用保持原样，模拟效果不冒充外部效果。
   验收证据人读词表为 pass/fail/inconclusive/deferred/missing/inconsistent/incomplete/unavailable，来源 `runtime/evidence/acceptance-evidence-validator.mjs:6`；本词表只约束人读措辞，不改变现有 writer。未达成如实记为未达成并进失败事实清单，这一条不新增任何推进前置。
7. 检查实际 diff 与声明写集、真实消费者、接口两端、状态、错误传播、并发原子性和资源释放。UI 按组件质量地图与真实页面验证状态和 DTO→ViewModel，浏览器 QA 先读取并执行 `skills/isolated-browser-qa/SKILL.md`，保留隔离、取消和自建资源清理事实。 仅声明写集没有任何浏览器可见面时，记 `N/A — 理由` 并引用写集；已声明适用而缺工具时记 unavailable。QA engine、route/场景、截图路径或 not_observed 的真实原因保在唯一原 ref，不伪造浏览器通过。来源、样本、场景、浏览器或截图缺失不宣称 UI 完成。
   UI 适用时，先读 `skills/project-norm-init/SKILL.md` 的「规范职责」，再取本步适用的具体来源：③组件读 `specs/design/components.md`，独立工程正文确需时另读 `specs/frontend/components.md`，否则读 `specs/frontend/frontend.md`；④布局读 `specs/design/layouts.md`，独立工程正文确需时另读 `specs/frontend/layouts.md`，否则读 `specs/frontend/frontend.md`；⑤通用交互读 `specs/design/interaction.md`，控件内合同引用组件源；⑧质量判据确需独立正文时读 `specs/design/quality.md`，工程/运行共用 `specs/frontend/ui-quality.md`。路径相对目标项目根，同职责等价实质源优先，八类不是强制八文件。以该「规范职责」表为准，本处路径随表更新；逐类保实际路径/稳定节、version/作用域、owner/consumer、适用规则及 missing/stale/unknown 的影响与承接者，不把当前代码反推为应然标准，不把读取冒成方法调用或实际页面验证。
   本 Phase 涉及 UI 且有合法可读设计源时，在实施前读取 `skills/design-source-extraction/SKILL.md` 与任务原 ref 的 `design-source-extraction.json`；以 `items` 原值和证据、`pending_review` 待议与 `low_fidelity.blocked_scope` 作为实施输入，按 `references/isolated-consumption.md` 保初始 missing、独立实测与回填，不把待议当批准。按实际当前上下文核 `freshness`：unknown 不补默认 current，stale 通过已有 `node skills/design-source-extraction/scripts/collect-design-source.mjs --plan <已认证冻结plan>` 重提炼，依赖项未补齐保影响、无关项继续。仅消费已核 source 与范围；默认 ego 复用模式失败明确报错，不隐式启动备用浏览器/窗口，显式引擎沿原 isolated-browser-qa 合同。非 UI 保原专业源流程，不强制提炼。
8. 每次挑审先实际消费 `docs/standard-workflow.md` 的「三审查点与结论真实性」，主会话提交其要求的三维原始依据并记录应用与缺料回退。每个 Phase 对当前 diff、本 Phase 承接 AC 与声明测试面、实际执行原件和审查重点发起一次独立代码审查：按上述标准工作方法的用户 U-020 授权规则，用 `reviewTierFor` 选择低风险独立子代理或高风险/影响说不清的外部 OCR；终末整卡固定外部 OCR 全审。先读取 `skills/wh-review/SKILL.md` 的「Long-review host convention」。审查记录正文用 `assertReviewTierRecord` 核执行者、来源与三维读数；独立子代理留派发身份与上下文隔离，不写 `ocr` 身份或伪造 `provider_results`；外部 OCR 留 route/provider 原ref与真实终态，不可用时仍保检测输出、原始失败与原执行者，口径见下节。同时显式派一次独立上下文的同源补充审查，方法见「同源补充轴」。各轴真实终态、原件与覆盖限制可定位才算完成本次审查工作；没有额外全 Phase 集成审查点，不为追空 findings 重派未变范围。
9. 主会话保留每条 finding 原文和真实处置。有效问题回原实施会话自动修复，先列受影响 file/case，再只跑该集合并写实际结果；严重问题优先修复，不以请求用户承担风险代替修复。确实无法在当前任务范围内解决时，写清影响、证据、原因和剩余选项，继续不受影响的工作；未处理保持 incomplete。只有已有绑定该 finding 的用户真实决定才可记 accepted_risk，不能自行接受风险或伪造通过。
   同一失败反复或一轮没有新事实时，先停重复动作；恢复前自述一行并写进本 Phase 的 task facts：「自上次以来我改了什么：<一句话>；失败信号：与上次相同／已变」。
   三检查沿 `AGENTS.md`「卡住与升级」执行，完成检查后选择恢复方法，禁止猜测修复。
   换路径可自动深研、换假设、换方法、换独立上下文，或修正本 Phase 内任务拆分、顺序、依赖、实现路线、测试路线与证据补齐并继续；不改 AC、FR、oracle、写集、方向与验收对象，不新建任务、不建第二个账本、不覆盖原失败原件，失败命令、cwd、退出码与原始输出沿唯一原 ref 保留。
   四类分诊只按 `AGENTS.md`「卡住与升级」同一张表落位；三类停只停相应路径，其余安全工作继续。非阻塞缺资源记 `incomplete` 继续，不中途弹选项；需改承诺交原 owner，不自行改 AC 求绿。
   外部不可重试失败第一次即零重试，记录原因与恢复条件并停该外部失败路径，问人条件及用户新答复复位仍以该表及适用范围为准，时间不构成复位条件。审查 provider 的不可用、失败、超时、取消、无效输出、零成功路或空 findings 沿同节排除行及既有 wh-review 口径处理，原始失败保留，其余安全工作继续。
   自动恢复不设次数或时长上限；审查并发、轮次和时长仍受该节排除行保护。无新事实不是完成，不能据此声明 Phase 完成或质量通过。
   本 Phase 收口时，契约头 `Done` 逐条承接 AC：每条写 AC 编号、一个上述现成 8 值档位和一条具名证据指针，并在现有正文写「本 Phase 自带判据小结」：自己验了什么（附本 Phase `gate_cmd` 原件）、没验什么（逐条带档位）、未验项所需条件与具名 owner。逐条记录、实际审查事实和本 Phase 提交分别可定位，才完成本 Phase 的收口工作；档位不要求全部为 pass。
   AC 的判定归属由 spec 的 AC 正文决定：实读判定方式、时点、执行 owner、所需条件和成功失败信号，不由依赖链位置决定。未参与该 AC 判定的 Phase 不得为该条写 pass，下游不得替上游补签。承接 AC 未达成时，按 `docs/standard-workflow.md`「专业质量」的「带欠账完成」口径显著标注、逐条保留缺口；继续同任务修复与后续安全部分。
10. 所有实施任务结束后，按计划执行一次最终聚合，逐 AC 消费沿途已产生的结论原件，对账实现、真实效果、测试和未覆盖项。末 Phase 保留完整端到端串演，只作复核与必要未闭环 case 补充，业务、实现与效果 AC 的首次结论仍按 spec 正文归属承接 Phase；仅需完整最终产物才能检查的 AC-BOUND-001/002 在最终边界首次独立判定，其余 AC 不得延期。默认只跑本任务范围内与本次改动相关的测试；判断不了影响面时用最小可证伪集合并记录未知影响面。全局重跑仅在改动对象是流程本身且局部无法证明时执行一次，事先说明范围与理由。没有新改动、失败或疑点时不重复运行。最终聚合不证明 review pass，也不替代独立审查。 最后 Phase 实际运行 `node tools/cli/run-checks.mjs --task-path <当前认证任务根>`，保存一份 stdout 原件供十环对账；环1–9取真实状态，环10在build-code记 `skipped`，stage-close后由原调用方补终态。exit 0 不证明步骤齐全，逐项读取报告的 `missing_steps`，不改 final-chain 原职责。
     对账由独立上下文实跑一次项目声明的会话用量命令，当场展示时间窗/分账/计数，不落派生文件；finding修复仅复验受影响file/case并说明理由。
11. 用 spec-analyze 对照原始需求、当前材料、实现、测试、发现处置与用户可见结果。实施/事实问题在本阶段修，方向和作者材料仍交对应 owner。缺项明确写未启动、未执行、失败、不适用、unknown 或 unavailable，不用产物存在代替完成条件。
12. 整个 stage 末由当前主会话按 `skills/stage-reflection/SKILL.md`「方法」「用户选择后的归口」「判断词表与完成检查」执行阶段收口，保存并读回最终报告，说明交付行为、实际测试/AC限制、原始发现与处置、风险及关闭方法下一步。局部 Phase 摘要不触发 stage-end 或固定复盘。结束时按 spec 模板验收流程统一提醒每条 incomplete 的真实尝试 ref、阻塞条件、提供者与恢复条件；最终报告逐条列缺口，不宣称完成。
    人读结论用达成／未达成（写明下一步）／退役；退役须有真实退出决定，不用模糊延期替代。

阶段收口中的成本：执行 `skills/stage-reflection/SKILL.md`「方法」第 3 步的 measure-main-agent-cost 入口及完整来源、窗口、失败和删除前留账边界；本阶段只在整个 stage 末触发一次 `measure-main-agent-cost --record`，首笔带 `--start-ref` 指向真实开工事件；同一计量窗口不重复，不每 Phase 触发。Phase 收口尚看不到完整墙钟与等待，不能切碎窗口重复记成本。受控 old/new 比较只读复算原生会话，不追加账本；真实 stage 末成本与未闭环 AC 仍由原 owner 回核。

## OCR 能力与缺省记录

先检查 `ocr` 命令与 `ocr --version`。OCR 不可用（命令不存在（ENOENT）或版本低于1.12.9）如实记 unavailable/unknown，不换执行者，保留检测输出与原始失败；版本检测其它错误不推断未安装。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关；已装 OCR 失败、超时、取消、无效输出、零成功路或空 findings 均保留原始事实。依赖真实 OCR 的测试在未安装时显式 skip 并披露；不把不可用写成空 findings。 同一不可用事实不再重复采集，由执行者自行停机并报告；此处只停止重复采集路径，审查 provider 各轴继续按上述既有口径执行，保留各轴终态与原失败，其余安全工作继续。

代码审查输入保留 build-code 合同、provider 协议、stageReviewFocus 与所需 lens 正文、当前 diff、本 Phase 承接 AC 及实际执行原件；只搬方法合同，不能重建旧执行流程。材料外发前核范围、路径边界并脱敏私有路径/secret；没有真实只读边界的执行者记不可用。取消、单路失败、迟到 findings 与其它成功路的 provenance 分别保留，不能由首个结果取消其它路或把失败写成通过。

## 同源补充轴

每Phase的review-change与正式审查使用相同scope、当前artifact/基线/diff、本 Phase 承接 AC、执行原ref、阶段合同、provider协议、审查重点、所需lens全文和仓库规范；主会话按下段实际执行独立Standards/Spec派发与并列展示，两个执行者消费 `skills/review/SKILL.md` 的对应镜头。补充原文由主会话按 `docs/standard-workflow.md`「证据只留原始件（同字节即同一事实）」比较后用已认证task.appendRecord保存唯一原件或复用同字节原ref。

宿主执行同源补充时，向两个互不继承对方上下文的独立执行者同时提供上述共同材料，并分别给 Standards 规范/baseline 或 Spec 来源。执行者只返回原文，不写文件；宿主按当前 workflow 保存单份原件，在 Standards / Spec 两栏分别展示发现、范围和不可用原因，只汇总各栏数量及各栏最严重问题，不合并、不重排名、不选跨轴赢家。同源补充标为 same_source_degraded，不替代 OCR、不计异源 quorum；OCR 与补充也并排保留，各路失败、取消与迟到有效发现不被成功路覆盖。

现 stage row 保留真实 OCR 的 `review_origin`、失败及 `review_result_ref`；补充引用放既有 evidence/普通说明，不覆盖 OCR identity、不新增字段。单独读回补充事实时，`review_origin: same_source_degraded` 的 `review_result_ref.value` 为 `null` 且有 reason，原件仍由普通引用定位。已装 OCR 失败、超时或取消不被补充轴洗成通过；补充缺失、失败、取消、迟到 finding 各保原事实，继续安全修复，未测来源或空 findings 不冒成功。

## PR 描述方法

本阶段不生成交付说明；交付说明在真正执行关闭的阶段（目前是规划收尾与终末验证）生成；本阶段只备 Evidence 与真实 diff 事实。

### Phase 三角色与七步顺序

仅复杂任务的 build-code Phase 固定 1 开发、1 审查、1 测试；开发是唯一 writer，审查与测试不改代码、测试或材料。测试只读执行并用既有 capture 保存 argv、退出码与输出回执，这不属于修改。主会话不写代码、不跑测试、不查细节 bug。审查执行者与独立同源补充仍按方法第8步及标准工作方法选择，三角色不改变 P1 的审查分级和失败来源口径。

1. 主会话备 Phase packet，含 spec、Phase 卡、AC、写集、测试命令、上下文指针与基线，交开发子代理。
2. 开发实施、写测试、跑目标测试到通过，确认无待修项后通知主会话。
3. 主会话再派审查与测试；两者可并行，不得早于开发完成并明确通知。
4. 普通 finding 回同一开发子代理；开发修完只复验受影响 file/case，审查与测试只复验受影响面。
5. 开发在两方明确回报后，最后确认无待改项，再通知主会话。
6. 主会话只核对四项：无 open finding、无未解释测试失败、Phase Done、AC 齐，然后推进。
7. 只有改 AC 或方向、用户独占阻塞资源、必须有人承担严重风险，才回主会话按自动恢复方法处理，其余继续回原开发修复。

两方回报须在开发最后确认之前汇合：审查回报列 finding 与未解决项；测试回报列命令、退出码、失败归因与覆盖限制。开发确认仅表示写主无待改项，不能替代两方回报。任一未回、仍有 open finding 或未解释测试失败，继续等该回报或回原开发修复，不提交本轮；无新消息不等于无问题。普通或迟到 finding 修复后，受影响方重新明确回报，开发再作最后确认。

每轮审后一次提交：开发完成、审查与测试回报无进一步 finding、目标测试与证据齐后，由开发子代理在本 Phase 提交一次；最终 Phase 的最终提交在终末审查与修复之后；push/merge/PR/归档/清理归 stage-close。

迟到 finding：重开同一 Phase，回同一开发子代理修，审查与测试只复验受影响面；不得丢弃，也不得只带到期终审。该轮同样先取得两方适用回报、开发最后确认及四项核对，再追加一次审后提交。同一 Phase 保持同一开发上下文；原会话不可用须披露，沿当前材料重核受影响范围并保留原失败，不静默换写主。

## 人为门与审查点

执行纪律：缺失即未完成；跨包不合批；确认与推进分开问，分诊、骨架与最终确认分别问；少打扰不等于跳过步骤。步骤证据位置以本阶段 `steps.json` 为指针，研究、审查、确认、测试和问答原件仍放既有位置，不在决策日志新增步骤节；问答原件开头写明批次类型。收口前运行 `node tools/cli/check-stage-steps.mjs --stage=build-code --task-path=<任务目录>`，逐项消费判定与缺口；检查器只报告、退出 0，不证明完成。入口推荐行使用可解析字面，如 `- 推荐级别：复杂`；既有日志不回改，未命中就报“未读到级别事实”。

用户授权进入实施或选定方向与实施计划后，持续覆盖本task实施、验证、独立审查、修复及交付必要commit/push/merge；阶段切换/新会话/handoff不重置。直接执行，不再要日常确认/本地提交授权/技术验收确认/用户承担严重风险；不借此扩方向/范围。真实平台限制、方向无法解决或外部条件缺失据实报告，继续可执行部分，不加人工gate。

一个 Phase 的实施、针对性测试、独立审查与 finding 修复全部完成后，在本 Phase 提交一次；审查在提交前进行。build-code 终末结束时完成全部提交与合并，最终 close 仍只确认一次。

authorize只记录/消费已有授权。每次Git前用 `runtime/interface/git-authorize.mjs` 按真实原话/来源、动作/范围、分支/HEAD record/consume；build-code commit两步显式同传 `phase: "build-code"`（CLI `--phase build-code`），绑当前task/分支/整阶段，同阶段共用grant，既有consumed保实际HEAD/次数，grant不改。其它阶段、旧无phase、push/merge/pr严格匹配HEAD，变化须重核记录、不消费旧HEAD。仅最终close（归档/分支与worktree删除/交付清理）前展示实际结果、质量限制和范围，取得一次确认后按范围执行；持续授权不含整树丢弃、强推、任务外改动。

三审查点是 build-plan 的 wh-review 合并、每 Phase 按风险选择执行者的独立代码审查、build-code 终末外部 OCR 全审；文档建议仍按 wh-review 分工。review/test/history 是质量事实，缺失不能冒充完成，也不禁止同任务安全修复。实施者不自审自判质量。

## 使用技能与收口

按 `skill-deps.yaml` 读取所需方法，重实施、定向验证和独立审查按项目分工委派，修 finding 回原实施会话；主会话裁定范围、记录真实用户选择并汇总。新文件/机制必须有实际消费者、owner、替代关系与删除条件。写入用安全原子写，共享冲突用记录锁，工作区核对和 Git 授权分别负责各自边界；失败原样披露。

整个 stage 末按第 12 步执行阶段收口；交接内容与独立读取沿 `skills/stage-handoff/SKILL.md`「信息来源」「回读结果」「结束条件与边界」，报告实际不可变路径。缺失与未执行给原因及影响，披露不代完成。正式事实仍由既有公共流程发布，不增机器认证、第二账本或推进许可。

在每个Phase收口、审后提交前，实际读取并执行 `skills/norm-sync/SKILL.md`，处理本Phase已独立验证变化，核目标/权利/before及项目共同锁、delta和逐件读回；不延迟至整stage末。无适用变化给具名原ref；重复触发核task＋条款ID，首次建设尚未就绪的早期Phase只记真实晚期回核，不倒称已执行。

## 写作与固定来源

改写 agent 方法时，若 `skills/spec-specify/SKILL.md` 已有「技能写作规范（WR001）」节，读取该唯一规范并逐项保全；规范尚未到位时保留当前方法与调用者提供的写作源，不猜新规则。

吸收 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/implement-spec/SKILL.md`（task graph/context pointers）、`skills/engineering/tdd/SKILL.md`（纵切与独立 oracle）、`skills/engineering/code-review/SKILL.md`（Standards/Spec 分轴）及 `skills/engineering/pr/SKILL.md`（描述三段）。写作参考 `skills/productivity/writing-for-agents/SKILL.md`、`SKILL-MECHANICS.md` 与其 docs。

本地偏离：当前 spec/Phase 与 task facts 代替外部 tracker、setup 命令、integration/worktree 自动编排；原十二步、冻结 oracle、授权、真实失败及独立审查保留。补充同源不冒异源，PR 实现由既有 close owner 承接，回退政策仍按本文件现条款。迭代时核上述固定子文件与上游更新/更优候选，先说明实际差异与本地偏离，再决定采用；不自动追 HEAD。方法接收真实项目材料、允许写目标和宿主能力，不绑定本任务路径或账号。

## 驾驶舱刷新

每 Phase 审后提交与 norm-sync 后，由本阶段主会话在同一事件现场调用 answer-as-page 的共同入口，event 为 `phase-closed`；使用当前认证任务根、实际 run-checks stdout 原件和同名任务库输出页。无需 caller 手拼 pageData，失败保原件与「未自动打开」真实原因。尚未到真实时点就保 incomplete 与负责主会话，不能用手动预演冒事件触发。

最后 Phase 收口后同入口用 `build-code-ended` 刷新环 1–9，环 10 只取报告 skipped；stage-close 完成后由原调用方用 `stage-closed` 与新报告补终态。六事件、派生/比较与旧件保全规则只在 skills/answer-as-page/SKILL.md「驾驶舱自动派生与事件」维护；页面不写 task facts，不代当前阶段事实。

## 最后 Phase：终末承接

复杂任务最后 Phase 使用本节覆盖方法8、10、12的终末执行：本 Phase 常规审查与整 stage 终末审查合为同一轮外部 OCR，不先 phase 再 terminal 双审；其它 Phase 原方法保持。最后 Phase 对账沿途结论；仅 AC-BOUND-001/002 因依赖完整最终字节，在此作最终边界首次独立判定。冻结仅固定审查对象，允许有效 finding 修复及定向复验，不重派正常审查。

1. 冻结实现
2. spec-analyze
3. AC/证据对账表
4. 终末独立审查
5. 修 finding 并定向复验
6. 测试充分性与验收对象
7. UI/浏览器终验
8. 最终 AC 对账和报告
9. norm-sync/reflection/成本/页面

第4段调用 stage=build-code、review_scope=terminal、subject_kind=worktree、phase_id=null；base 为任务起点提交，head 为冻结实现，审查整份交付 diff。路由 single_round；旧 verify-code 记录只读保留，当前调用只用终末身份。每路原件/实际执行者/失败/覆盖限制分别保存；finding 回原实施会话，独立同源补充不冒异源。缺材料保 unknown/unavailable/incomplete，不作继续工作的许可证。

| 编号（原判据） | 并入位置 | 执行者 | 证据 | 验收 |
| --- | --- | --- | --- | --- |
| RP-01 来源与架构机会（原判据：方法 1 首句按 project-norm-init 读适用源并核 owner/版本/consumer；「一次架构机会」只引既有原件、无则记未知） | 段 1 冻结实现 | 主会话读源，独立执行者复核 | 规范源读回（路径/稳定节/version/owner/consumer）；架构评估原件引用或 unknown | 每类有真实来源；缺源只停依赖该规则的判断；不出现第二次架构评估 |
| RP-02 冻结实现（原判据：方法 1 核真实 worktree/branch/HEAD、写集与来源，真实命令留回执，按 stage-handoff 回读交接、材料疑点交原作者、旧对象只读） | 段 1 冻结实现 | 主会话；开发子代理提供交付 diff | 冻结 HEAD 与交付 base/head 读回、写集清单、captureCommand 回执、handoff 回读件 | 冻结审查对象后不扩大范围；有效 finding 修复保新 diff 和定向复验；diff 边界可回读；疑点有 owner；旧原件未改写 |
| RP-03 执行事实核对（原判据：方法 1 读真实入口/消费者/diff/完整 AC/build-code 原件，分清已跑、未跑、失败、不可用与覆盖限制） | 段 2 spec-analyze | 主会话；测试子代理供原件 | 五态清单（AC → 原件 → 状态 → 覆盖率限制） | 每条有状态与原因；未跑不写成通过；缺原件保持 incomplete/unavailable |
| RP-04 理由与约束回源（原判据：方法 1 追问 why 时沿 git blame/log 与原决定逐环读理由与反证；按 knowledge-graph 有界回源领域与历史约束） | 段 2 spec-analyze | 独立执行者 | blame/log 读回与图查询原件；事实、竞争假设与 unknown 分栏 | 读不到写缺口与原因；不拿最新提交或自报轨迹当理由 |
| RP-05 需求链抽查（原判据：方法 1 从原始需求→decision-log 裁决→spec FR/AC→phases 索引与物理Phase正文→实现与测试/质量原件逐项打开） | 段 2 spec-analyze | 主会话 | 抽查清单（每环真实路径与读回结果） | 每一环实际打开；缺索引/正文留 unknown/unavailable，不猜路径 |
| RP-06 终末独立审查（原判据：方法 2 按 wh-review Long-review 发起一次终末独立代码审查并正常使用 OCR；每路原始 findings 或真实失败/取消/unavailable 均可定位） | 段 4 终末独立审查 | 外部 OCR 以终末身份执行；主会话发起并存原件 | 每路终态/失败原件、实际执行者、覆盖限制、含整份交付 diff 的调用参数 | 身份 `build-code/terminal` 可调用；范围是整份交付 diff；路由为 single_round；至少一路终态或如实记 unavailable |
| RP-07 审查原件保全（原判据：方法 3 保留每路 findings、执行者、错误、取消与覆盖限制，迟到 findings 交同一回调，build-code Phase 审查不得充当终末第二次独立审查） | 段 4 终末独立审查 | 主会话 | provider 原始件、迟到 finding 记录、来源标注 | 各终态分别可定位；失败不被成功路漂白；Phase 审查不被冒记为终末审查 |
| RP-08 测试面与检查可信度（原判据：方法 4 每 Phase 一行「声明面→原件 path/cwd/argv/exit/原始输出→已跑/未跑」；测试充分性节核断言/替身、缺 RED、受控变异与 diff 五类削弱） | 段 6 测试充分性与验收对象 | 测试子代理 | 逐 Phase 测试面表；削弱清单与原始读数 | 每个未跑面写阻碍、可跑条件与 owner；缺表保持 incomplete/inadequate |
| RP-09 风险选样与三值结论（原判据：方法 4 按金钱、隐私权限、不可逆后果、外部副作用、跨 Phase 旅程、失败恢复风险独立选样，分别给 business_effect、semantic_test_adequacy、code_review） | 段 6 测试充分性与验收对象 | 独立执行者 | 选样表与逐 case/AC 的已查/未查理由 | 三类结论各有证据；缺数据/权限保持 unknown/unavailable，不按 provider coverage 推导 |
| RP-10 验收对象检查（原判据：方法 4 按 spec 唯一 checkAcceptanceObject 与 check-acceptance-object.mjs 实跑，exit 0、1、2 分开记） | 段 6 测试充分性与验收对象 | 主会话 | 命令 argv/cwd/exit 原件、解析对象与来源文件 | exit 0 只证结构与来源文件存在；exit 1/2 分开记，不冒业务效果 |
| RP-11 AC/证据对账表（原判据：方法 4 逐 Phase 核 Done 承接 AC 的编号、runtime/evidence/acceptance-evidence-validator.mjs 现成 8 值档位与具名 ref；AC 归属按 spec 正文） | 段 3 AC/证据对账表 | 主会话 | 对账表（AC → 承接 Phase → 8 值档位 → 具名 ref） | 每条 AC 有编号、档位与 ref；缺首判的 AC 记缺口并回 owner，不补签 |
| RP-12 finding 处置（原判据：方法 5 与 7 逐条判断 finding，有效问题回原实施会话，无法解决列影响/证据/owner/选项，accepted_risk 需已有用户真实决定，不改写原 review） | 段 5 修 finding 并定向复验 | 主会话；修复回原实施会话 | finding 原文与处置表（fixed、rejected_invalid、accepted_risk、needs_human） | 每条有原文与处置；不改写原 review；严重问题不留给用户承担 |
| RP-13 定向复验（原判据：方法 6 对新修复和真实疑点只做必要定向复验，先列 file/case 集合，记录实际 command/exit/raw，不重派第二次正常审查） | 段 5 修 finding 并定向复验 | 原实施会话修复，独立执行者复验 | 复验命令原件与恢复结果 | 只跑受影响集合；无改动或无疑点有说明；不重做全量上游 |
| RP-14 UI/浏览器终验（原判据：方法 8 之后的 UI 段按专业源与设计源核对，按 isolated-browser-qa 消费页面、console 与 a11y；缺工具或入口记 unknown/unavailable） | 段 7 UI/浏览器终验 | 独立执行者（浏览器 QA） | 页面、console、a11y、截图与 not_observed 原因 | 非 UI 写集给 N/A 理由；缺工具/入口记 unavailable；不把未观察当视觉通过 |
| RP-15 最终 AC 对账与报告（原判据：方法 4 末段完整串演只复核沿途结论并补必要未闭环 case、不新增全量重跑、不作任何 AC 首次判定点；方法 7 逐 AC 结果保留处置） | 段 8 最终 AC 对账和报告 | 主会话 | 逐 AC 结论表与未闭环 case 清单；十环报告消费记录 | 每条 AC 指向承接 Phase 的原始结论；缺口逐条列；仅 AC-BOUND-001/002 在最终边界首判，其余引用各 Phase 原首判 |
| RP-16 收口与成本页面（原判据：方法 7 尾按 answer-as-page 刷新页面，环 1–9 真实结论、环 10 记 skipped；方法 8 按 stage-reflection 阶段收口、内部发布并读回最终报告；成本在 stage 末只记一次；收口前执行 norm-sync） | 段 9 norm-sync/reflection/成本/页面 | 主会话；独立上下文核成本读数 | 收口与最终报告读回件、成本读数、页面与同名侧车、norm-sync 回执 | 成本同窗口只记一次；环 10 为 skipped；norm-sync 有真实回执；缺口如实保留 |


终末第8段由当前主会话经认证 task.appendRecord 保存一个不可变普通 final-report 原件（纯 JSON，或 Markdown 内唯一机验 JSON 数据段；扩展名与实际内容一致，含人读六项结论，以实际 ref 为准），交回关闭 reader；不要求双格式或双报告，同字节复用。报告包含任务/材料/HEAD身份、逐 AC 档位与原件 ref、六项结论、未完成项的真实尝试/owner/恢复条件、终末审查原件和失败。功能验收记录、代码审查回执、独立人读功能判断分别引用；business_effect、semantic_test_adequacy、code_review 不互相推导。缺口不得写成完成，缺证据 ref 明列未知。

本节覆盖旧步骤12的最后阶段输出：不再产出 stage-handoff，不引导进入 verify-code 下一阶段；最终报告承担人读关闭记录。第9段保存成本、页面、交付等实际后置独立事实与十环检查报告，不机械生成第二份整体 final-report；仅整体报告有实质内容错误时，沿既有递增命名保存修订的新不可变原件并保留旧件。成本只在整个 stage 末记一次，norm-sync/reflection 沿既有方法；关闭/PR后按实际结果刷新页面与侧车，交付前环10为 skipped。用户额外要求的人读续接指针不变为默认产品流程、机器门或新增 stage。

### 测试充分性与检查可信度

执行验收对象检查时，读取 `skills/spec-specify/templates/spec-template.md` 的唯一 `checkAcceptanceObject(input, context={})` producer，不在本方法复制checker。将当前spec的真实「验收对象」与本次实际context交给既有CLI运行：

```bash
node tools/cli/check-acceptance-object.mjs --spec specs/<task-id>/spec.md --context <本次实际context.json> --check-sources
```

`--spec` 指当前认证工作树的实际规格；`--context` 指本次真实sources及UI适用性/CLI来源映射，按已读spec与实际输入生成，不能用示例替代。没有context时不伪造文件；按实际条件省略可选参数并披露未检查的来源。`--check-sources` 仅核已选择本地源文件，不证明浏览器、服务健康或业务效果。保存实际argv/cwd、验收对象/context原ref、原始输出与退出码：0只证最小对象/所查来源通过，1记录具名缺项或缺源，2记录输入/节/producer等执行错误；未执行保持未验证，不用该检查作为继续修复的许可证。

核断言/替身、缺RED与原件时，读[backend-testing「行为测试与证伪」](../../skills/backend-testing/SKILL.md#行为测试与证伪)及同文件「执行事实」，沿其TCR/冻结保护与失败分类执行。新增/扩展检查用同判据：合法pass→仅受控违规改变后目标fail→恢复同合法输入pass，核argv/cwd/raw、exit/signal/timeout及恢复字节；同字节复用原件。违规仍绿报具名遗漏case，恢复未通过incomplete；不以方法读回冒检查器接线。适用代码改动做受控行为变异（如取反新增条件），目标断言须fail再恢复，不拿字符串变异充数；无新增/扩展检查按真实diff写N/A，只免执行，仍消费完整正反输入。

错在范围修：检查错时修检查本身或收窄其范围，不绕过检查、不在上下游加豁免。通过太易时先查观察方法：核断言、替身与夹具是否真能失败，再动实现。检查可信度的三值结论分为已验证/未验证/无法判断，不把未知写成通过；不替换 AC 的既有结果档位。同一修正复发时，把教训落为具名检查，先在有源真实历史错误上失败，再验证当前修复。

依赖升级先读changelog，major另读migration notes；逐项或具理由关联小组升级，同一受影响行为前后验证。核直接/传递lockfile diff，包管理器生成、不手改；安装成功、缺notes/lockfile/前后行为不能当完成。无升级给实际diff依据，不凑依赖。

逐项报告diff五类削弱的路径/来源/理由：阈值/严重级降低；新增.skip、删case/唯一结果断言；@ts-ignore/eslint-disable/istanbul ignore等静音；抛错stub/空catch/TODO代实现；无真实决定的新allow/exception。等价重构/收紧不误报，旧有源例外按原范围；exit0不盖无源削弱。

读producer原报告、输入数/范围：exit0或ALL CHECKS PASSED不盖report-only漂移，零输入不证覆盖；exit2、null/缺件、未跑/环境失败保exit/signal/timeout、未达断言、owner/恢复条件，不写clean。历史target存在不证行为，step方法非命令，validator事实非自动阻断；合法advisory不当故障。不改工具退出语义/加Block或质量对象。

### 终末独立原件的保存与公共 status 消费

最终报告先保存生成时事实；AC-BOUND-002 的后置检查尚未发生时明确 pending。fresh 独立 reader 用 none 上下文读取该唯一报告、当前材料/实施字节、每 AC 原始结论、真实业务效果、测试/断言与执行回执、原 provider raw 和每条 finding 的独立修复复验。原报告不因后置检查重写，不为追验生产 report2；报告本身有实质错误时保 finding 并正常修新原件。原 AC 首判格式和旧原件不改。

先产独立 raw JSON，最低事实沿当前 Phase 的 typed contract：task_id/stage、final_report、materials/implementation 的实际路径与 hash、acceptance 的完整 AC 分母和原件、business_effect/semantic_test_adequacy、原 review、finding_dispositions、boundary_checks。两维各列 covered_ac_ids、result、refs、coverage_limits 与 proofs；proofs 中 receipt/output 是同一次真实 capture 的原件引用，inputs 为实际源/输入路径和 hash，semantic 另给该真实命令消费的 test_sources 断言源路径/hash。exit0、任意文本、文件在场、空 findings 或 fixed 字符串均不代语义判断；语义归独立 raw，机器只核来源、身份、范围和字节链。

caller 随后机械保存 provenance 封套，只含 task_id、stage、raw_ref 与 reader，不复制 raw 结论。reader.identity 是实际 agent thread，reader.source_ref 指已合法归档的公开绑定原件；绑定列 dispatch/final/delivery 三个 ref/hash。dispatch 原件列 task_id、stage=build-code、role=terminal-assessor、agent_thread_id、context_mode=none 与实际 implementation_authors，reader 不得属于实施作者。final/delivery 的 agent_thread_id 一致，public_text 与独立 raw 原始字节逐字一致；不依赖用户目录私有 session 或导出 analysis。独立 finding verifier 用 role=finding-verifier 的实际派发来源，结论指原 finding ID、原 review ref/hash、实际受影响路径、当前实现 hash 和执行 proof refs。来源未产生或不可证保持 unknown/incomplete，不伪造公开绑定。

主会话通过现 run --action=execute --stage=build-code 的输入 terminal_assessment_ref:{ref,sha256} 保存封套引用；它与 phase_progress 输入互斥，同一 build-code-row 锁保原 cursor、evidence、review 和非空字段。原 public status --action=begin 只读计算；无新引用沿旧 readiness/quality，坏引用、坏 JSON/I/O 明确暴露。质量闭合只在独立原件、当前全写集和全部必要面严格相符时投影 pass，原 review 的 needs_revision/inconclusive 及失败、覆盖限制分列，不被改成通过。同字节审后 commit 不导致 stale；新增或变化字节缺独立 proof 不冒 current。status 不保存完成对象，也不成为修复、Git 或 close 许可证。

页面 producer 仅调用同一个 public status，使用 manifest 身份、绝对 task-path 和认证 cwd，stageStatus 是内存 DTO。顶部、阶段栏、主对象视图显示同一有限结论和原件；Task 自己的交付与验收独立呈现。无新引用保持原页面投影，调用错误明确显示，不用十环 completed 猜终末 pass。

首判来源与当前适用分开：acceptance 的原 refs 保其当时快照/版本与 immutable verdict，不将历史方法全文件 hash 强等当前。当前终末 raw 每条 current_applicability 写 basis 与 refs，说明原判据现在为何仍适用、已做哪些必要补充；当前 materials/implementation、真实修复范围与 proof 源字节才须对应当前。无关段落演进不抹原首判，真正功能规则改变而缺适用或独立补证仍 incomplete。删除实现路径以 deleted:true、sha256:null、base_sha256 保存已认证基线原字节与当前真实缺席事实，不伪造现存文件。

有效 finding 的 fixed 须有实际 fix 与独立复验；rejected_invalid 须有同原 finding/review 的独立无效性解释和来源，不造修复。两者都保原发现字节，accepted_risk 不能由本投影自动推导。终末独立 reader 同次核修复可复用自己真实 terminal-assessor 的 pre-dispatch 身份作为 proof 来源；已验证公开 raw 必须在 finding_verification_attestations 中逐条列 finding_id 与准确 proof_ref:{ref,sha256}，不能只靠身份相同。不为同次判断另造一次 dispatch、审查或自引用 hash 循环。

原 canonical provider 的 path-only raw/evidence_refs 仍保旧字节；fresh 独立 raw 用 provider_raw_refs 的 ref/sha256 明确所读每份原始字节，不能只证路径存在或忽略同 provider 的补充流。status 返回逐 AC 已核结果、原件与当前适用说明供页面按显式 ac_ids/工作包映射展示；汇总 pass 不填未关联对象，已关联对象也不永久停留旧卡未判定。

AC-BOUND-002 无环顺序：唯一 final-report 先保生成时 pending → fresh reader 实读该报告与本任务额外 continuation 精确字节，先保存本来必需的 BOUND002 独立首判原件（不回指未来 assessment）→ 同一 reader 的整体 raw 在 acceptance 引用该原件 → caller 归档实际公开派发/child final/parent delivery，再机械封套 → run 保存引用，status 读回。只有 AC-BOUND-001/002 允许在最终边界首判，业务 AC 不借后置检查延期或补签。

BOUND001 首判可在报告前形成，不要求它回填未来 final-report hash；BOUND002 后置原件必须指实际 final_report，额外 continuation 用 continuation:{ref,sha256} 指定并校字节。两项都保真实 typed verdict 与当前适用说明，不要求补签旧首判。

不同 finding verifier 的 proof 原件保持不变。独立 raw 在 finding_verification_completions 逐项列 proof_ref、reader_identity、source_ref；外侧 source_ref 指 dispatch/final/delivery 的 ref/hash，dispatch 必须与 proof.reader.source_ref 的实际派发一致。公开 final/delivery 的同一 public_text 必须是该 proof 精确原字节，或真实产物回执 JSON（task_id、stage、agent_thread_id、artifact_ref 精确指该 proof ref/hash）。只有 dispatch 不证明实际复验完成；外侧绑定由 raw 引用，proof 不回指后产绑定，避免自 hash 循环。

原审查 inconclusive、逐 provider 未读/undetermined 材料或失败路均保原件和限制。独立 raw 的 review_coverage_closure 须明确 result、review_ref、basis、covered_gaps 和 refs；covered_gaps 逐项对应 review:<原结论>、coverage:<provider>:<原材料路径>、provider:<原失败 provider ID> 的真实缺口分母，不漏项、不加异源项。refs 必须绑定当前业务与语义 proof 已实际捕获并核验的 receipts；独立 reader 说明这些原件为何闭合对应范围，不能用笼统 pass、exit0 或无关文本替代。缺闭合时整体 incomplete，原 review 结论及限制不变。

既有 JSON 首判按同对象精确 AC 读 id/acceptance_criterion_id/criterion_id/ac/ac_id 或 task 的明确 AC 分词，typed 结果读 result/conclusion/tier/independent_status；同对象显式身份或结果冲突按不一致保留，不把顶层 pass 扩散到子 AC，也不解释 Markdown 为机器 verdict。历史原件不重写。
