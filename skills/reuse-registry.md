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

| 名字 | 使用场景 | 正文入口 |
| --- | --- | --- |
| stage-reflection | 阶段结束发现实际过程问题，需要提出有来源的复盘改进候选。 | [读取正文](stage-reflection/SKILL.md) |
| stage-handoff | 阶段结束写人读交接，或接续时回读真实材料、事实与未完事项。 | [读取正文](stage-handoff/SKILL.md) |
| stage-closeout | 阶段交付后整理Git、图与收口事实；最终归档或删除按实际授权处理。 | [读取正文](stage-closeout/SKILL.md) |
| knowledge-graph | 开工查询领域与历史经验、定位影响，或按许可更新图。 | [读取正文](knowledge-graph/SKILL.md) |
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
| mini-task | 在独立任务工作区内交付一个小功能。 | [读取正文](mini-task/SKILL.md) |
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
| ui-project-init | UI规划先定位本动作适用的专业规范与原owner。 | [读取正文](ui-project-init/SKILL.md) |
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

## N6研究方法采用索引

来源、固定版本、许可与未证实项唯一回 `catalog.yaml` 的 `knowledge-graph`、`deep-research` 与 `make-decision`；写作沿 `skills/spec-specify/SKILL.md` 的 WR001。此节只索引正文，保留既有 N4／N5 内容。消费者读对应方法，owner为各方法维护者；替代旧的内外混写与重复来源转述。正文被正式替代且无消费者时，由原 owner 同批删除对应索引行，历史原件保留。

| 条目 | 采用动作 | 既有正文入口 |
| --- | --- | --- |
| 内部研究 | 图／文件三保障与查图判据，供研究派发者及 P3 作者消费 | `skills/knowledge-graph/SKILL.md` |
| 外部研究 | 来源／检索三保障、单份报告与逐任务找回，供 make-decision 作者消费 | `skills/deep-research/SKILL.md` |
| 研究分工与来源减法 | 第3步分工与关键结论消费；D7来源转述降为固定来源与 WR001 指针，供方向作者及 P3 消费 | `workflows/make-decision/SKILL.md` |

`runtime/evidence/research-report.mjs` 的职责是旧 JSON 研究报告校验与保存；当前普通 Markdown 报告和轻研究没有生产 consumer，保留旧测试／历史读取，不反向接线。owner＝研究报告运行时维护者（P9/T019 原归属）；本卡不替代其实现。保留条件＝仍需旧报告读取／验证；删除条件＝原 owner 核全真实 caller、历史保全及替代消费者后确认没有消费者，再按原治理处理。当前缺口是没有当前报告 consumer，不能把旧校验器存在当研究已验证。
