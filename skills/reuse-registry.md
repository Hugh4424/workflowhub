# 技能使用索引

从任务场景选技能，再读目标正文。登记事实（名称、版本、状态、来源与许可）以[catalog.yaml](catalog.yaml)为准；方法语义以目标正文为准，引用前先读取实际目标。两者冲突时，由本次变更owner核对真实consumer，在本次改动中修正错误的索引或登记；目标缺失或归属有争议时保留具体缺口交原owner，不把旧入口当可用路线。

## 阶段入口

| 名字 | 使用场景 | 正文入口 |
| --- | --- | --- |
| make-decision | 调研并确认方向。 | [读取正文](../workflows/make-decision/SKILL.md) |
| build-plan | 把已确认方向写成规格与独立Phase计划。 | [读取正文](../workflows/build-plan/SKILL.md) |
| build-code | 按当前Phase实施、验证和修复。 | [读取正文](../workflows/build-code/SKILL.md) |
| verify-code | 独立核实现、实际效果及剩余缺口；测试/检查/依赖升级读正文唯一可信度方法。 | [读取正文](../workflows/verify-code/SKILL.md) |
| build-prd | 整理已确认方向的产品表达与任务组PRD。 | [读取正文](../workflows/build-prd/SKILL.md) |

## 技能入口

外部三份能力的离线采用入口：[skills/external/README.md](external/README.md)。固定来源与许可只读 catalog 同名 absorbed 条目；脚本入库不执行。

| 名字 | 使用场景 | 正文入口 |
| --- | --- | --- |
| stage-reflection | 阶段结束发现实际过程问题，需要提出有来源的复盘改进候选。 | [读取正文](stage-reflection/SKILL.md) |
| stage-handoff | 阶段结束写人读交接，或接续时回读真实材料、事实与未完事项。 | [读取正文](stage-handoff/SKILL.md) |
| stage-closeout | 阶段交付后整理Git、图与收口事实；最终归档或删除按实际授权处理。 | [读取正文](stage-closeout/SKILL.md) |
| knowledge-graph | 开工与设计依据准备时以合法全文作采用判断；查询领域/历史经验、定位影响，或按许可更新图。 | [读取正文](knowledge-graph/SKILL.md)；[任务判断方法](knowledge-graph/references/knowledge-reuse.md) |
| anysearch | 需要联网检索、核事实或读取外部页面。 | [读取正文](anysearch/SKILL.md) |
| decision-log | 把已确认方向写为唯一决策与需求记录。 | [读取正文](decision-log/SKILL.md) |
| deep-research | 方向仍有关键未知，需要深度调研与可回读来源。 | [读取正文](deep-research/SKILL.md) |
| grill-with-docs | 通过追问检验方案，并维护术语与架构决定。 | [读取正文](grill-with-docs/SKILL.md) |
| intake-decision-review | 只读审查问题界定、范围与可行性。 | [读取正文](intake-decision-review/SKILL.md) |
| simplicity-guard | 同次包核最小路径、删前理由/行为、三问与有源归并；N3采用/排除读catalog absorbed来源，subtract/foundational同落P0/P1。 | [读取正文](simplicity-guard/SKILL.md) |
| talk-with-zhipeng | 需要用户决定方向、风险或范围，组织真实问答。 | [读取正文](talk-with-zhipeng/SKILL.md) |
| spec-prd | 把已确认方向写成任务组PRD与产品表达。 | [读取正文](spec-prd/SKILL.md) |
| spec-specify | 从已确认决定起草规格与全局实现设计骨架，或查技能写作规范。 | [读取正文](spec-specify/SKILL.md) |
| spec-clarify | 已有规格存在影响实施的歧义，需要澄清。 | [读取正文](spec-clarify/SKILL.md) |
| spec-plan | 把实现设计写入规格，拆成各自可交付的Phase。 | [读取正文](spec-plan/SKILL.md) |
| spec-analyze | 阶段结束核需求、材料、实现与证据是否一致。 | [读取正文](spec-analyze/SKILL.md) |
| architect-code-review | 审查实现的正确性、生命周期、接口消费者与测试强度。 | [读取正文](architect-code-review/SKILL.md) |
| workflowhub-host-protocol | 查当前会话如何执行五阶段、记录事实及说明完成边界。 | [读取正文](workflowhub-host-protocol/SKILL.md) |
| workflowhub-multica-sync | 明确要求核对或同步本机main与Multica的技能和agent配置。 | [读取正文](workflowhub-multica-sync/SKILL.md) |
| wh-review | 审查材料位/配置路线、ARTIFACT + CONTRACT、身份与覆盖/三条件结论；方法来源读catalog的N3 absorbed条目。 | [读取正文](wh-review/SKILL.md) |
| plan-ceo-review | 只读审查产品前提、范围、替代方案与交付风险。 | [读取正文](plan-ceo-review/SKILL.md) |
| plan-design-review | 只读审查UI信息架构、状态、无障碍及响应布局。 | [读取正文](plan-design-review/SKILL.md) |
| plan-eng-review | 只读审查工程顺序、接口、失败路径与验证设计。 | [读取正文](plan-eng-review/SKILL.md) |
| review | 只读审查正确性、范围、证据和未决风险；测试可信度沿verify正文条件指针。 | [读取正文](review/SKILL.md) |
| resolving-merge-conflicts | 已在合并中遇到冲突，需要按真实目标解冲突。 | [读取正文](resolving-merge-conflicts/SKILL.md) |
| diagnosing-bugs | build-code失败分支实读；复现/最小化/探针后修根因，输出与页面信任边界和性能方法唯一正文；两来源见catalog。 | [读取正文](diagnosing-bugs/SKILL.md) |
| test-routing-advisor | 按真实changed files选择simple、feature或fullstack测试路线；本身不执行测试。 | [读取正文](test-routing-advisor/SKILL.md) |
| testing-system-blueprint | 规划本Phase测试面与针对性验证；oracle读backend唯一证伪方法。 | [读取正文](testing-system-blueprint/SKILL.md) |
| backend-testing | 实施后仅有后端改动，验证参数、业务、权限和错误边界，定义唯一行为证伪方法；跨端另读fullstack-slice-testing。 | [读取正文](backend-testing/SKILL.md) |
| frontend-testing | 实施后仅有UI状态、交互或键盘行为改动，接口不变；跨端链路另读fullstack-slice-testing。 | [读取正文](frontend-testing/SKILL.md) |
| fullstack-slice-testing | 改动跨前端、API、worker或持久化边界，验证一个用户可观察的完整链路。 | [读取正文](fullstack-slice-testing/SKILL.md) |
| isolated-browser-qa | 浏览器/公开页/localhost验收；从正文context --run走Launch/health/Drive/Evidence/Cleanup，维护时区分文档漂移、owned harness缺口与产品回归；清理后回读原证据。来源/许可只读catalog，运行缺口留原task。 | [读取正文](isolated-browser-qa/SKILL.md) |
| project-norm-init | 规划、实施或验收准备前，按职责定位设计、前端、后端、接口、验收五类规范与原owner。 | [读取正文](project-norm-init/SKILL.md) |
| design-source-extraction | 设计源准备后、实施前提炼机器JSON；按五类输入缺项、四态与过期记录供规划/实施/独立检查消费；不晋升规范。 | [读取正文](design-source-extraction/SKILL.md) |
| design-source-readiness | 核对已有设计材料是否能供当前动作使用，并显露缺源或冲突。 | [读取正文](design-source-readiness/SKILL.md) |
| frontend-prototype-render | 用真实组件输入渲染任务原型，提供预览与截图。 | [读取正文](frontend-prototype-render/SKILL.md) |
| frontend-component-quality | 实现或审查组件的真实consumer、状态、ViewModel、样式与复用边界。 | [读取正文](frontend-component-quality/SKILL.md) |
| third-review | 明确调用通用异源CLI审查器，保原始意见和失败诊断。 | [读取正文](third-review/SKILL.md) |

## N4既有方法采用索引

来源/固定版本/许可唯一回 `catalog.yaml` 的 `n4-*` absorbed条目；以下只给真实动作与正文入口，不建立第二来源权威。三重复项只核复用，其余文字采用不冒行为效果。

| 条目 | 采用或复用动作 | 既有正文入口 |
| --- | --- | --- |
| documentation-and-adrs | 先读现有ADR约定；被拒替代逐项留理由与代价 | `skills/decision-log/SKILL.md` |
| incremental-implementation | 真实纵切逐增量实现/验证/下游消费闭环 | `skills/spec-plan/SKILL.md` |
| planning-and-task-breakdown | 复用既有依赖图与共享文件定序，重复项不新写规则 | `skills/spec-plan/SKILL.md` |
| shipping-and-launch | 复用既有精确hunk回滚与触发，重复项不新写发布清单 | `skills/spec-plan/templates/phase-template.md` |
| source-driven-development | 复用P4实读版本/直达原文/unverified，不凭记忆实现 | `skills/deep-research/SKILL.md` |
| spec-driven-development | 多能力先列模块职责/稳定称谓/单向依赖，互依赖核合并 | `skills/spec-specify/templates/spec-template.md` |
| technical-writing | WR001跨语言模式/术语/指代与条件保全；四类写作出口读唯一规范 | `skills/spec-specify/SKILL.md`；`skills/decision-log/templates/decision-log-template.md`；`skills/spec-specify/templates/spec-template.md`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-prd/templates/prd-template.md` |
| unslop | 人读跨语言表面痕迹并保意义，不作评分或风格门 | `skills/spec-specify/SKILL.md` |
| build-the-lever | 手工独立oracle与worker产物逐项对照；worker不改自身验收契约/保留标签，标签回真实产物，不冻全树 | `workflows/build-plan/SKILL.md` |
| minimize-reader-load | 复用WR001与材料指针降低追溯负担，重复项不加同义权威 | `skills/spec-plan/SKILL.md` |
| why | 代码anchor→git历史/原决定→竞争假设与unknown，三处真实方法消费 | `skills/decision-log/SKILL.md`；`skills/spec-analyze/SKILL.md`；`workflows/verify-code/SKILL.md` |
| multi-phase-plan.md | spec-plan作者收口实际消费既有无状态合同校验与现reports，缺验收例/占位可见，语义不明unknown，原退出语义不变 | `skills/spec-plan/templates/phase-template.md` |
| refactoring.md | 结构改动先pin行为契约；typecheck/lint不算pin，无第二oracle | `skills/spec-plan/SKILL.md` |
| hillclimb.md | 独立oracle区分好坏、error/work明确单位、重复观测/噪声与停止；无固定次数门/loop账本 | `skills/spec-plan/templates/phase-template.md` |
| eval.md | 真实独立候选→匿名同尺judge→基底合成与验证，实际轨迹不信自报 | `skills/wh-review/contracts/provider-protocol.md`；`docs/architecture/test-asset-governance-rules.md` |

## N5既有方法采用索引

来源、固定版本、许可与未证实项唯一回 `catalog.yaml` 的 `n5-dispatch-and-return`；此处只索引正文。

| 条目 | 采用动作 | 既有正文入口 |
| --- | --- | --- |
| context-engineering | 任务重点靠后、保护字段与指针进入面 | [AGENTS.md](../AGENTS.md#派发与回传) |
| orchestrate.md | brief缩放、上游指针中继、可核事实回传 | [AGENTS.md](../AGENTS.md#派发与回传)；`skills/deep-research/SKILL.md` |

人读：swarm 的具名测量方法与样本只给人工判断。派发者与结果汇总者在实际安排 commit 测量时，核对具名 SHA、样本数、单样本定义、执行顺序及结果原件，判断样本是否支持结论。swarm 当前仅 watch/consumer-only，未采用其测量机制、未取得本次测量样本，不声明测量效果；来源与未采用范围唯一回 catalog.yaml 的 swarm 条目。本段只明确人工边界，不引入采样机制、指标或机器通过结论。

## N6研究方法采用索引

来源、固定版本、许可与未证实项唯一回 `catalog.yaml` 的 `knowledge-graph`、`deep-research` 与 `make-decision`；写作沿 `skills/spec-specify/SKILL.md` 的 WR001。此节只索引正文，保留既有 N4／N5 内容。消费者读对应方法，owner为各方法维护者；替代旧的内外混写与重复来源转述。正文被正式替代且无消费者时，由原 owner 同批删除对应索引行，历史原件保留。

| 条目 | 采用动作 | 既有正文入口 |
| --- | --- | --- |
| 内部研究 | 图／文件三保障与查图判据，供研究派发者及 P3 作者消费 | `skills/knowledge-graph/SKILL.md` |
| 外部研究 | 来源／检索三保障、单份报告与逐任务找回，供 make-decision 作者消费 | `skills/deep-research/SKILL.md` |
| 研究分工与来源减法 | 第3步分工与关键结论消费；D7来源转述降为固定来源与 WR001 指针，供方向作者及 P3 消费 | `workflows/make-decision/SKILL.md` |

`runtime/evidence/research-report.mjs` 的职责是旧 JSON 研究报告校验与保存；当前普通 Markdown 报告和轻研究没有生产 consumer，保留旧测试／历史读取，不反向接线。owner＝研究报告运行时维护者（P9/T019 原归属）；本卡不替代其实现。保留条件＝仍需旧报告读取／验证；删除条件＝原 owner 核全真实 caller、历史保全及替代消费者后确认没有消费者，再按原治理处理。当前缺口是没有当前报告 consumer，不能把旧校验器存在当研究已验证。

## N6提问方法采用索引

固定版本与许可唯一回 `catalog.yaml` 的 `talk-with-zhipeng`、`grill-with-docs`；本节只保采用/偏离与正文入口。owner＝两方法维护者；consumer＝Talk/Grill调用者、独立搬运者与P3收敛作者；替代旧重复问答转述。方法被正式替代且无消费者时，由原owner同批删除本节对应行，历史原件保留。

| 条目 | 采用与本地偏离 | 既有正文入口 |
| --- | --- | --- |
| `skills/idea-refine/SKILL.md` | Phase 1–3 七类透镜按问题选，比较关键取舍而不凑数量；三份配套 frameworks.md、refinement-criteria.md、examples.md 未保存/未登记，不声称完整评分标准 | Talk「2.2 扩散透镜」 |
| `skills/interview-me/SKILL.md` | Step 3–5 四类信号、四类非确认、原意追问与地板规则；来源条款“不许给用户列选项”明确“不采用”：这是决定口径／文档转述，非用户逐字——本地采用每题2～3互斥选项、推荐及后果风险，用户原话是“Talk 和 grill 请用大白话说明选项、后果和风险”。固定原文 Common Rationalizations:204 可回读；不采用置信度退出与绝对批量禁令 | Grill「Sharpen fuzzy language」与本地最小问卡；Talk链接只供可选示例 |

版本/许可沿catalog；pin为commit级＋逐字节哈希，不是签名/发布级强绑定。三份缺失配套由来源维护方提供后才能评估，不静默补全。

## N6骨架与逐包收敛采用索引

当前owner＝N6/P3方法维护者；本卡是N4/N5与N6研究/提问节的后写方，只追加本节，不改其来源权威。固定源、许可与能力决定沿 catalog 的现条目，本文只指正文。consumer＝P4/T004、P5/T005登记writer读回本节后在各自新节追加，P6只聚合原件；正文全部由catalog承接且无引用时原owner删本节并保历史。

| 条目 | 采用／减法承接 | 既有正文入口 |
| --- | --- | --- |
| 骨架到逐包 | 需求单元、四查定序、真实骨架答复与逐包五段；不新增进度权威 | `workflows/make-decision/SKILL.md` 第4–9步 |
| D5 Grill方法转述 | 删方法侧重复完整checklist；保本步产物／进下一步前两行，Grill调用者与P4仍按原owner全文执行 | `workflows/make-decision/SKILL.md` 第11步；`skills/grill-with-docs/SKILL.md` |
| D6 Talk方法转述 | 方法侧压为最小内联卡；保文本降级及真实原因，Talk调用者与P5仍读问答契约／每答重排 | `workflows/make-decision/SKILL.md` 第1步；`skills/talk-with-zhipeng/SKILL.md` |
| 显式单元检查 | 单元／派生号／需求三表头与派生号缺格只报warning；唯一生产者checkDecisionLogChain，consumer为run-checks advisory及两冻测；owner为checker维护者，均无消费且无正文引用才删码 | `tools/cli/check-decision-log-chain.mjs` |

## N6技术分歧草图采用索引

第三项来源新开 catalog 能力决定 `n6-technical-sketch`，不复用无关 `matt-prototype` watch；来源为 `skills/poteto-mode/playbooks/prototype.md`，固定字节、许可与未证实项只回catalog。owner＝总则维护者；consumer＝主会话读 `AGENTS.md`「卡住与升级」三触发/四禁用后决定是否取事实，用户消费观察再决定方向；删除条件＝替代方法经独立审查承接全部消费者且无正文引用，原owner退役本节并保历史。

跨卡重叠：本节接在P3骨架与逐包收敛索引之后，是后写方，只追加本节；既有N4/N5、P1/P2/P3来源及减法说明不动，P5在自己的新节追加。采用隔离草图、变体观察与路径交接；三句宽许可仅限隔离/一次性/非生产；四项未保存机制不声称吸收，提交未证实且镜像带自行改动，不写已绑定上游版本。

减法声明：删charter成本预算门，存在/非空/指针/角色保护仍由原五个it消费；降prototype通用原型流程为AGENTS适用分支，调用者仍在原总则读到触发与边界；不新增流程、技能、控制面或进度对象。全卡D1–D7由原Phase各自首验，本节不替P5或P6补签。

## N6 P5 answer-as-page采用索引

唯一来源事实见catalog answer-as-page；独立于pstack。固定pin 7acea24024923eaae8647f5988e826062456dc86 / Release v0.5.5（仅此tag核过且未签名）。MIT；owner=P5/T005及后续技能维护者；首consumer=用户直接调用/本任务驾驶舱生成者，首验=冻结合同＋独立真实页消费。替代宿主绑定renderer；替代实现接全部消费者或整体退役时同步删除登记，历史保留。下表不是额外验收门，13项须读原义；原源坐标相对上述pin。U1–U12单层MIT，U13打包许可不完整，未采用部分不称已适配。

| 项 | 原做法 | 原源 | 本地处置与删除/重评条件 |
| --- | --- | --- | --- |
| U1 | 输出默认目录 | SKILL.md:61 | 改用caller指定任务库路径；不需默认目录时删 |
| U2 | always-on | SKILL.md:37–45 | 不采用；改显式入口时重评 |
| U3 | 后台更新 | references/settings.md | 不采用；有统一更新owner时重评 |
| U4 | 清理命令 | commands/clean.md | 不采用；任务库owner承接时删 |
| U5 | Node20 | package.json engines / README.md:75 | 不搬CLI；本仓Node>=24不变，engines变化重评 |
| U6 | 宿主变量 | SKILL.md:56–61 | 改本技能相对路径；宿主变量成为公共面时重评 |
| U7 | 专有命令 | SKILL.md:42/89/91/92、settings | 不搬；宿主放弃专有命令时删 |
| U8 | 下载上游清单追新 | references/settings.md | 不采用；统一owner承接时重评，与U3独立 |
| U9 | frontmatter宿主键 | SKILL.md:3 | 只name/description；本仓消费新键时重评 |
| U10 | 视频依赖 | SKILL.md:193–197 / references/video.md | 不搬；视频确需且许可补齐后重评 |
| U11 | Reply/ask/复制源 | SKILL.md:159/163–170 | 仅保安全回灌方法；当前只读页不用控件，真实确认互动后重评 |
| U12 | 嵌真实代码 | SKILL.md:157 | 只稳定指针、不嵌正文造双写；改运行时取数时重评 |
| U13 | 打包许可缺失 | scripts/am.mjs bundled license block | 不搬renderer；dagre/marked等许可补齐并独立审查后由ADR-012回退块承接 |

## N7六项既有方法来源登记

来源、pin、许可与固定文件指纹只回 `catalog.yaml` 的 `n7-*` absorbed条目；登记修复不改变方法、不重签历史验收。历史task_id=`n7-route-delivery-closeout-experience-20261018`；以下 `quality/...` 均相对此task根，绝对根只供本机取回，不依赖向外暴露私有路径。owner为对应方法维护者；阶段主会话、交接/治理作者及读取经验条目的业务仓维护者是实际消费者。替代方法经独立审查承接全部消费者且无正文引用后，由owner退役登记并保历史。

| 条目 | 现有消费者入口 | 历史首验边界 |
| --- | --- | --- |
| n7-git-workflow-and-versioning | `skills/stage-handoff/SKILL.md; AGENTS.md` | P1 quality/tests/2026-10-18-038-p1-independent-method-readback.md；P3 quality/tests/2026-10-18-077-p3-independent-consumer-readback.md；两consumer具名首验，不证明发布 |
| n7-no-comments | `skills/stage-reflection/SKILL.md` | P1 quality/tests/2026-10-18-038-p1-independent-method-readback.md；P3 quality/tests/2026-10-18-077-p3-independent-consumer-readback.md；仅具名方法与保全，不冒泛化效果 |
| n7-ketchup | `skills/stage-handoff/SKILL.md; AGENTS.md` | P1 quality/tests/2026-10-18-038-p1-independent-method-readback.md；P3 quality/tests/2026-10-18-077-p3-independent-consumer-readback.md；凭证正例为受控假设 |
| n7-reflect | `skills/stage-reflection/SKILL.md; specs/Improvements.md` | P1 quality/tests/2026-10-18-038-p1-independent-method-readback.md；P2 quality/tests/2026-10-18-059-p2-independent-complete-readback.json；首验适用条件未齐保持incomplete，见quality/tests/2026-10-18-p6-six-adoptions.md |
| n7-recall | `skills/stage-reflection/SKILL.md; specs/Improvements.md` | P1 quality/tests/2026-10-18-038-p1-independent-method-readback.md；P2 quality/tests/2026-10-18-059-p2-independent-complete-readback.json；仅具名后继读取，不外推未来任务 |
| n7-opening-a-pr | `skills/stage-closeout/SKILL.md` | P4 quality/tests/2026-10-18-081-p4-controlled-delivery-materials.json及quality/tests/2026-10-18-083-p4-delivery-note-green.json、quality/tests/2026-10-18-084-p4-closeout-protection-green.json；独立首验为quality/evidence/2026-10-18-050-p4-independent-first-consumer.json、quality/evidence/2026-10-18-055-p4-compression-consumer.json；受控首验不冒真实PR，后续实际PR另见quality/tests/2026-10-19-022-ac010-real-pr-independent-consumer.md |

历史原件根：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/`。六项采用/排除判据只读回 `specs/archive/n7-route-delivery-closeout-experience-20261018/decision-log.md` 的 D-017 和 spec AC-013；历史六项汇总原件 `quality/tests/2026-10-18-p6-six-adoptions.md` 保留 reflect incomplete 与受控首验限制，不把补登记冒整体验收。

## N10有限检查来源

figure-it-out 的采用、固定字节与未证实项见 [catalog.yaml](catalog.yaml) 的 `figure-it-out` 条目；正文落点为 [verify-code 的检查可信度段](../workflows/verify-code/SKILL.md#测试充分性与检查可信度)，[stage-reflection](stage-reflection/SKILL.md) 只放指针，正文接线与首验归 P5/T021。本节只导航。

| norm-sync | 每Phase收口、终末验证、写经验及任务收口前同步已独立验证变化；拒写不足项并保partial恢复。 | [读取正文](norm-sync/SKILL.md) |
