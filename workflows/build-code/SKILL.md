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
   身份/材料/范围核对后，独立执行者实际按 `skills/knowledge-graph/SKILL.md` 用本Phase职责/写集/consumer研究领域、历史决定/失败，再定向读源码。依该方法有界选source/完整ID、当前契约和独立历史两通道，保query/god及覆盖限制；主会话只收已回源少数结论、落点或重复/无信号。禁止先广读/实现再补查询伪装顺序；缺图/失败/无匹配/歧义保真实exit并安全回原文，图不作门。JSON/schema直接读源、不因未覆盖扩图；收费抽取仍须精确范围/估算及真实许可。
2. 消费计划冻结目标测试/RED并保原失败。补行为测试先定明确oracle、实跑目标断言失败再实施；纯材料按G-2说明检查或真实不适用。改冻结断言先TCR（test change request）和独立审查，不弱化换绿。仅按名改Phase卡预先点名的一个既有具名常量取值免TCR；断言表达式/期望方向/判定/评分仍须原TCR+独立审查。oracle唯一来源为该Phase预写测试及 `DO NOT TOUCH`，每任务声明一次；每次测试变更以同卡「测试变更请求」加独立审查原件为源，变后 `ORACLE-…` 身份不变，不另建账本/镜像/每oracle记账。免TCR只分期望值来源和断言变更，不扩写权/授权、不降强度、不免独立审查、不改 `DO NOT TOUCH` 物理隔离。
   遇真实失败、测试 RED 或性能回退，先实际读取并执行 `skills/diagnosing-bugs/SKILL.md`：输入当前症状、命令/原输出和授权写集，保留反馈回路、最小化、假设/探针、根因修复与复验原件，再回本步骤。错误/页面文本按该方法「输出与页面内容」处理；缺证据如实留缺项，只停依赖该证据的修复。成功路径不强制诊断，已有原件可复用，不重演已修故障冒新问题。
3. 在允许文件/符号内做最小实现，错误明确暴露。计划缺口一次列清影响、风险与需 owner 回答的问题，规格/Phase 交 build-plan，方向交 make-decision；不自行改材料。先继续不受缺口影响的安全部分，未知范围留给具名 owner 核实。 本步完成以改动全部落在允许写集内且无吞掉的错误为准，越界或吞错即本步未完成；对应 Task 的目标行为交付也是本步完成条件，未交付即本步未完成。
4. 每Phase选择接口与测试路线前，实际按 `skills/project-norm-init/SKILL.md` 的“非UI规范与索引”读取适用后端/接口/验收源；保存路径/稳定节、version/作用域、owner/consumer及适用规则。缺源/过期/冲突只停依赖该规则的选择，其余继续；unknown不当N/A。 在 `inspect-and-route-actual-tests`原职责及实现前，独立执行者按 `skills/knowledge-graph/SKILL.md`：真实目标affected查波及面，按职责选完整ID explain既有实现；仅两个真实模块协作/依赖链才path，先消歧端点。随后首次定向读source_file/origin源码、标准/consumer，核图年龄/原命题；位置漂移/旧决定/未证关系保unknown，当前源纠正图。trace保查询→首次读源→改动，逐条说明新知与承接实现/边界；重复定位/无信号据实，不为凑收益造改动/依赖、不按前25冒相关。目标不存在exit4、歧义exit3、工具失败分记诊断/处置，安全编码继续；图不代oracle/测试/独立质量。
   对真实 changed files 用 test-routing-advisor 选择 simple/feature/fullstack，记录与计划相同或改变的理由。选择 backend-testing、frontend-testing 或 fullstack-slice-testing 中适用的一条具体路线，研究真实入口、权限、数据、并发、超时、取消和恢复边界。
5. 测试子代理按当前 Phase 及 Task 声明的面，逐面把 `gate_cmd` 与 `RED/GREEN gate_cmd` 的字面命令提交现有 `verify --action=execute`，不能从 Phase 文本自动抓命令运行。跑声明的针对性命令和必要相邻检查，用已认证 `task.captureCommand`（底层唯一 `runtime/interface/run-command.mjs`）保存实际 cwd、argv、exit、signal、timeout/cancel、输出和清理事实，原始输出只存单份。证据去重与临时输出处理，实际读取并执行 `docs/standard-workflow.md`「证据只留原始件（同字节即同一事实）」；保本次真实immutable回执与正确output_ref。build-code 的实际整数回执由运行时汇总进现有 stage evidence；保已有非空事实与游标，更新游标也不把 evidence 回落为 null。未执行或无整数退出保原回执与具体原因，不捏 exit0；契约校验的 contract_ok、contract_error_count、errors 片段、AC/FR 覆盖与 command_oracle_checks 随现 source.json 送审，只记录事实、不作失败门。每个未跑面明写“哪一面／卡在哪／什么条件下能跑”，不能只有 unavailable 或 incomplete。只跑受影响测试，不用无范围全量回归代替；环境、收集和配置失败不当成目标 RED，exit0 不自动证明业务通过。 按 `AGENTS.md`「卡住与升级」的适用范围分类该失败信号；属于外部不可重试时零重试，立即按该节格式报告并给可直接回复的选项，停止该外部失败路径，其余安全工作继续。
6. 对声明的 command/service 验收执行真实场景，逐项对照 oracle、可观察效果与失败反例。记录每条 AC 的实际结果、原始输出、输入/环境和覆盖限制；真实服务缺失、未执行、部分或不可用保持原样，模拟效果不冒充外部效果。
   验收证据人读词表为 pass/fail/inconclusive/deferred/missing/inconsistent/incomplete/unavailable，来源 `runtime/evidence/acceptance-evidence-validator.mjs:6`；本词表只约束人读措辞，不改变现有 writer。未达成如实记为未达成并进失败事实清单，这一条不新增任何推进前置。
7. 检查实际 diff 与声明写集、真实消费者、接口两端、状态、错误传播、并发原子性和资源释放。UI 按组件质量地图与真实页面验证状态和 DTO→ViewModel，浏览器 QA 先读取并执行 `skills/isolated-browser-qa/SKILL.md`，保留隔离、取消和自建资源清理事实。 仅声明写集没有任何浏览器可见面时，记 `N/A — 理由` 并引用写集；已声明适用而缺工具时记 unavailable。QA engine、route/场景、截图路径或 not_observed 的真实原因保在唯一原 ref，不伪造浏览器通过。来源、样本、场景、浏览器或截图缺失不宣称 UI 完成。
   UI 适用时，先读 `skills/project-norm-init/SKILL.md` 的「规范职责」，再取本步适用的具体来源：③组件读 `specs/design/components.md`，独立工程正文确需时另读 `specs/frontend/components.md`，否则读 `specs/frontend/frontend.md`；④布局读 `specs/design/layouts.md`，独立工程正文确需时另读 `specs/frontend/layouts.md`，否则读 `specs/frontend/frontend.md`；⑤通用交互读 `specs/design/interaction.md`，控件内合同引用组件源；⑧质量判据确需独立正文时读 `specs/design/quality.md`，工程/运行共用 `specs/frontend/ui-quality.md`。路径相对目标项目根，同职责等价实质源优先，八类不是强制八文件。以该「规范职责」表为准，本处路径随表更新；逐类保实际路径/稳定节、version/作用域、owner/consumer、适用规则及 missing/stale/unknown 的影响与承接者，不把当前代码反推为应然标准，不把读取冒成方法调用或实际页面验证。
8. 每次挑审先实际消费 `docs/standard-workflow.md` 的「三审查点与结论真实性」，主会话提交其要求的三维原始依据并记录应用与缺料回退。每个 Phase 对当前 diff、本 Phase 承接 AC 与声明测试面、实际执行原件和审查重点发起一次独立代码审查：先读取 `skills/wh-review/SKILL.md` 的「Long-review host convention」。正常使用 OCR；不可用时的记录口径见下节。同时显式派一次独立上下文的同源补充审查，方法见「同源补充轴」。各轴真实终态、原件与覆盖限制可定位才算完成本次审查工作；没有额外全 Phase 集成审查点，不为追空 findings 重派未变范围。
9. 主会话保留每条 finding 原文和真实处置。有效问题回原实施会话自动修复，先列受影响 file/case，再只跑该集合并写实际结果；严重问题优先修复，不以请求用户承担风险代替修复。确实无法在当前任务范围内解决时，写清影响、证据、原因和剩余选项，继续不受影响的工作；未处理保持 incomplete。只有已有绑定该 finding 的用户真实决定才可记 accepted_risk，不能自行接受风险或伪造通过。
   重试前自述一行并写进本 Phase 的 task facts：「自上次以来我改了什么：<一句话>；失败信号：与上次相同／已变」。 按 `AGENTS.md`「卡住与升级」及 `docs/standard-workflow.md`「stage 结束」的适用范围、provider排除、无新事实判定/独立重开/升级、外部不可重试零重试及用户答复复位执行；收到答复按当前材料续跑，不新建任务或账本。
   本 Phase 收口时，契约头 `Done` 逐条承接 AC：每条写 AC 编号、一个上述现成 8 值档位和一条具名证据指针，并在现有正文写「本 Phase 自带判据小结」：自己验了什么（附本 Phase `gate_cmd` 原件）、没验什么（逐条带档位）、未验项所需条件与具名 owner。逐条记录、实际审查事实和本 Phase 提交分别可定位，才完成本 Phase 的收口工作；档位不要求全部为 pass。
   AC 的判定归属由 spec 的 AC 正文决定：实读判定方式、时点、执行 owner、所需条件和成功失败信号，不由依赖链位置决定。未参与该 AC 判定的 Phase 不得为该条写 pass，下游不得替上游补签。承接 AC 未达成时，按 `docs/standard-workflow.md`「专业质量」的「带欠账完成」口径显著标注、逐条保留缺口；继续同任务修复与后续安全部分。
10. 所有实施任务结束后，按计划执行一次最终聚合，逐 AC 消费沿途已产生的结论原件，对账实现、真实效果、测试和未覆盖项。末 Phase 保留完整端到端串演，只作复核与必要未闭环 case 补充，不得成为任何 AC 的首次结论产生点；首次结论仍按 spec 的 AC 正文归属各承接 Phase。默认只跑本任务范围内与本次改动相关的测试；判断不了影响面时用最小可证伪集合并记录未知影响面。全局重跑仅在改动对象是流程本身且局部无法证明时执行一次，事先说明范围与理由。没有新改动、失败或疑点时不重复运行。最终聚合不证明 review pass，也不替代独立审查。
     对账由独立上下文实跑一次项目声明的会话用量命令，当场展示时间窗/分账/计数，不落派生文件；finding修复仅复验受影响file/case并说明理由。
11. 用 spec-analyze 对照原始需求、当前材料、实现、测试、发现处置与用户可见结果。实施/事实问题在本阶段修，方向和作者材料仍交对应 owner。缺项明确写未启动、未执行、失败、不适用、unknown 或 unavailable，不用产物存在代替完成条件。
12. 整个 stage 末由当前主会话按 `skills/stage-reflection/SKILL.md`「方法」「用户选择后的归口」「判断词表与完成检查」执行阶段收口，内部发布并读回交接，说明交付行为、实际测试/AC限制、原始发现与处置、风险及 verify-code 下一步。局部 Phase 摘要不触发 stage-end 或固定复盘。
    人读结论用达成／未达成（写明下一步）／退役；退役须有真实退出决定，不用模糊延期替代。

阶段收口中的成本：执行 `skills/stage-reflection/SKILL.md`「方法」第 3 步的 measure-main-agent-cost 入口及完整来源、窗口、失败和删除前留账边界；本阶段只在整个 stage 末触发一次，同一计量窗口不重复，不每 Phase 触发。

## OCR 能力与缺省记录

先检查 `ocr` 命令与 `ocr --version`。OCR 不可用（命令不存在（ENOENT）或版本低于1.12.9）如实记 unavailable/unknown，不换执行者，保留检测输出与原始失败；版本检测其它错误不推断未安装。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关；已装 OCR 失败、超时、取消、无效输出、零成功路或空 findings 均保留原始事实。依赖真实 OCR 的测试在未安装时显式 skip 并披露；不把不可用写成空 findings。 同一不可用事实不再重复采集，由执行者自行停机并报告；此处只停止重复采集路径，审查 provider 各轴继续按上述既有口径执行，保留各轴终态与原失败，其余安全工作继续。

代码审查输入保留 build-code 合同、provider 协议、stageReviewFocus 与所需 lens 正文、当前 diff、本 Phase 承接 AC 及实际执行原件；只搬方法合同，不能重建旧执行流程。材料外发前核范围、路径边界并脱敏私有路径/secret；没有真实只读边界的执行者记不可用。取消、单路失败、迟到 findings 与其它成功路的 provenance 分别保留，不能由首个结果取消其它路或把失败写成通过。

## 同源补充轴

每Phase的review-change与正式审查使用相同scope、当前artifact/基线/diff、本 Phase 承接 AC、执行原ref、阶段合同、provider协议、审查重点、所需lens全文和仓库规范；主会话按下段实际执行独立Standards/Spec派发与并列展示，两个执行者消费 `skills/review/SKILL.md` 的对应镜头。补充原文由主会话按 `docs/standard-workflow.md`「证据只留原始件（同字节即同一事实）」比较后用已认证task.appendRecord保存唯一原件或复用同字节原ref。

宿主执行同源补充时，向两个互不继承对方上下文的独立执行者同时提供上述共同材料，并分别给 Standards 规范/baseline 或 Spec 来源。执行者只返回原文，不写文件；宿主按当前 workflow 保存单份原件，在 Standards / Spec 两栏分别展示发现、范围和不可用原因，只汇总各栏数量及各栏最严重问题，不合并、不重排名、不选跨轴赢家。同源补充标为 same_source_degraded，不替代 OCR、不计异源 quorum；OCR 与补充也并排保留，各路失败、取消与迟到有效发现不被成功路覆盖。

现 stage row 保留真实 OCR 的 `review_origin`、失败及 `review_result_ref`；补充引用放既有 evidence/普通说明，不覆盖 OCR identity、不新增字段。单独读回补充事实时，`review_origin: same_source_degraded` 的 `review_result_ref.value` 为 `null` 且有 reason，原件仍由普通引用定位。已装 OCR 失败、超时或取消不被补充轴洗成通过；补充缺失、失败、取消、迟到 finding 各保原事实，继续安全修复，未测来源或空 findings 不冒成功。

## PR 描述方法

本阶段不生成交付说明；交付说明在真正执行关闭的阶段（目前是规划收尾与终末验证）生成；本阶段只备 Evidence 与真实 diff 事实。

## 人为门与审查点

用户授权进入实施或选定方向与实施计划后，持续覆盖本task实施、验证、独立审查、修复及交付必要commit/push/merge；阶段切换/新会话/handoff不重置。直接执行，不再要日常确认/本地提交授权/技术验收确认/用户承担严重风险；不借此扩方向/范围。真实平台限制、方向无法解决或外部条件缺失据实报告，继续可执行部分，不加人工gate。

一个 Phase 的实施、针对性测试、独立审查与 finding 修复全部完成后，在本 Phase 提交一次；审查在提交前进行。verify-code 结束时完成全部提交与合并，最终 close 仍只确认一次。

authorize只记录/消费已有授权。每次Git前用 `runtime/interface/git-authorize.mjs` 按真实原话/来源、动作/范围、分支/HEAD record/consume；build-code commit两步显式同传 `phase: "build-code"`（CLI `--phase build-code`），绑当前task/分支/整阶段，同阶段共用grant，既有consumed保实际HEAD/次数，grant不改。其它阶段、旧无phase、push/merge/pr严格匹配HEAD，变化须重核记录、不消费旧HEAD。仅最终close（归档/分支与worktree删除/交付清理）前展示实际结果、质量限制和范围，取得一次确认后按范围执行；持续授权不含整树丢弃、强推、任务外改动。

三审查点是 build-plan 的 wh-review 合并、每 Phase 的 OCR 代码审查、verify-code 终末 OCR 审查；文档建议仍按 wh-review 分工。review/test/history 是质量事实，缺失不能冒充完成，也不禁止同任务安全修复。实施者不自审自判质量。

## 使用技能与收口

按 `skill-deps.yaml` 读取所需方法，重实施、定向验证和独立审查按项目分工委派，修 finding 回原实施会话；主会话裁定范围、记录真实用户选择并汇总。新文件/机制必须有实际消费者、owner、替代关系与删除条件。写入用安全原子写，共享冲突用记录锁，工作区核对和 Git 授权分别负责各自边界；失败原样披露。

整个 stage 末按第 12 步执行阶段收口；交接内容与独立读取沿 `skills/stage-handoff/SKILL.md`「信息来源」「回读结果」「结束条件与边界」，报告实际不可变路径。缺失与未执行给原因及影响，披露不代完成。正式事实仍由既有公共流程发布，不增机器认证、第二账本或推进许可。

## 写作与固定来源

改写 agent 方法时，若 `skills/spec-specify/SKILL.md` 已有「技能写作规范（WR001）」节，读取该唯一规范并逐项保全；规范尚未到位时保留当前方法与调用者提供的写作源，不猜新规则。

吸收 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/implement-spec/SKILL.md`（task graph/context pointers）、`skills/engineering/tdd/SKILL.md`（纵切与独立 oracle）、`skills/engineering/code-review/SKILL.md`（Standards/Spec 分轴）及 `skills/engineering/pr/SKILL.md`（描述三段）。写作参考 `skills/productivity/writing-for-agents/SKILL.md`、`SKILL-MECHANICS.md` 与其 docs。

本地偏离：当前 spec/Phase 与 task facts 代替外部 tracker、setup 命令、integration/worktree 自动编排；原十二步、冻结 oracle、授权、真实失败及独立审查保留。补充同源不冒异源，PR 实现由既有 close owner 承接，回退政策仍按本文件现条款。迭代时核上述固定子文件与上游更新/更优候选，先说明实际差异与本地偏离，再决定采用；不自动追 HEAD。方法接收真实项目材料、允许写目标和宿主能力，不绑定本任务路径或账号。
