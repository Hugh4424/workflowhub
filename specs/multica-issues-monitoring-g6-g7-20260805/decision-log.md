# Decision Log

> 当前任务：处理组 6、7、8 的残留闭环，以及本次 WorkflowHub 执行暴露的流程问题。
> 本文件是当前决策索引；具体行为写入 spec，具体实现和命令写入 plan/tasks。

## 原始需求

| source_id | 原始需求 | 来源与状态 |
| --- | --- | --- |
| R-001 | 检查下载资料和目录，找出处理组 6、7、8 仍存在且需要优化的问题。 | `/Users/Hugh/Downloads/multica-issues-monitoring.md`；已覆盖 |
| R-002 | 处理组 1—5 已结束，WorkflowHub 已完成大改版。 | 原始需求与当前 main 基线；已覆盖 |
| R-003 | 资料目录是事实索引，不是实施顺序、方案或推进门槛。 | `multica-issues-monitoring/README.md`；已覆盖 |
| R-004 | 当前 vNext 只使用四份当前材料，历史控制面只读保留。 | `CONSTITUTION.md`、`CONTEXT.md`；已覆盖 |
| R-005 | Grill 没有和用户沟通。 | 用户 scope revision 原话；已覆盖，见 D-004 |
| R-006 | clarify 等 spec 技能没有真正用上，需要检查 build-spec、build-plan 等阶段是否正常使用这些技能。 | 用户 scope revision 原话；已覆盖，见 D-005、D-009 |
| R-007 | decision-log 和 spec.md 没有正确创建在 spec/ 文件夹中。 | 用户 scope revision 原话；已覆盖，见 D-006 |
| R-008 | spec 太复杂、太工程化；实现逻辑应放进 plan，spec 应让正常人读懂。需要参考 Spec Kit 和 Matt 的 to-spec。 | 用户 scope revision 原话；已覆盖，见 D-007 |
| R-009 | 除 build-code 外，各阶段 review 是异源建议，不应反复追求 pass、浪费 token。 | 用户 scope revision 原话；已覆盖，见 D-008 |
| R-010 | build-code 阶段每个 Phase 都必须完成必要实施、测试和审查，审查到 pass 后才能进入下一个 Phase；全部 Phase 完成后进入 verify-code，close 前停下汇报。 | 用户最新连续推进指令；已覆盖，见 D-014 |
| R-011 | 明确 build-spec/build-plan/build-code 的技能调用顺序：build-spec 先生成、澄清、简化和产品方向审查，再做一次 wh-review；build-plan 先研究（无问题则 skipped）、生成计划、简化和工程审查、测试路由、生成 tasks、做 spec-analyze，再做一次 wh-review；build-plan 不调用具体 testing skill 或 testing-system-blueprint；build-code 在真实改动后按实际范围重新路由并调用具体 testing skill。 | 用户 scope revision 原话；本次补充，见 D-015 |

## 当前目标、用户流程与边界

- **目标**：确认组 6、7 的真实残留，收窄组 8 为 inventory/retention 登记校验；同时修正本次 WorkflowHub 的材料路径、技能调用、Grill 沟通、spec 可读性和 review 语义。
- **用户流程**：读取原始资料 → Talk/Grill 形成可见选择 → 用户确认方向 → build-spec 形成可读需求 → build-plan 形成可直接执行的实现和测试合同 → build-code 按顺序执行 → verify-code 独立复核。
- **页面/入口范围**：不新增产品页面；只覆盖四份当前材料、WorkflowHub 五阶段入口、review/verify 可见结果和组 8 inventory 校验入口。
- **数据状态**：`confirmed residual`、`evidence-needed`、`planned`、`implemented`、`verified`、`unknown`、`unavailable`、`incomplete`、`deferred`、`non-goal`。后四种不能冒充通过。
- **成功边界**：每个残留都有来源、用户可理解的结果、实现 owner、测试层级、命令、oracle 和证据位置；spec 不含实现步骤；plan/tasks 足够让普通模型按顺序执行。
- **失败边界**：材料写错目录、必需技能未调用、Grill 未形成可见用户选择、原始需求未覆盖、review finding 未经主 agent 评审、测试策略缺失、未知/不可用被改写为通过，均保持 `incomplete` 或 fail-loud。

## 已接受的原始范围决定

### D-001 — 只处理当前残留

- **选择**：只审查当前 main 的组 6、7 残留；组 8 先保持历史只读边界。
- **来源**：用户 Talk Round 1=`A`；资料 README 明确组 1—8 是事实索引，不是施工清单。
- **理由**：不把历史资料直接当成新方案，避免复活旧控制面。
- **后果与风险**：范围小且可核验；组 8 的静态登记失败需要另行决定。
- **拒绝方案**：重写历史资料或重新激活组 8 产品工作。
- **延期交接**：组 8 是否纳入由 D-003 处理；具体实现留给 build-spec/build-plan。
- **Supersedes**：无。

### D-002 — 组 6 用 vNext 最小事实和验证解决

- **选择**：不重建旧 Phase Card、恢复、reopen、rebind 或 gate 控制面，只补当前可观察事实和契约。
- **来源**：用户 Talk Round 2=`A`；`CONSTITUTION.md`、`CONTEXT.md` 的四材料和公共行为边界。
- **理由**：复用当前 TaskKernel、quality、review 和测试边界，维护面最小。
- **后果与风险**：字段需要在 plan 中精确定义；缺证据必须保持 unknown/unavailable/incomplete。
- **拒绝方案**：把历史组 6 方案原样恢复为公共运行时。
- **延期交接**：integration baseline、Phase 证据、失败归因、测试 lease 由 build-spec/build-plan 细化。
- **Supersedes**：历史下载资料中的未经当前 vNext 复核的实现方案。

### D-003 — 组 8 只修登记和校验

- **选择**：本轮纳入 inventory/retention 登记与校验差异，但不改归档正文、不让运行时读取历史 inventory。
- **来源**：用户 Talk Round 3=`B`；`08-archive-reference.md` 和当前 inventory 差异事实。
- **理由**：消除已知校验失败，同时保留历史只读边界。
- **后果与风险**：会增加少量登记工作；任何为过检查而改写归档内容都必须停止。
- **拒绝方案**：完全延期已知失败，或开发历史归档运行时消费。
- **延期交接**：具体登记文件、保护规则和验证命令由 build-plan 定义。
- **Supersedes**：D-001 中“组 8 暂不纳入本轮”的未决部分；不改变归档内容只读。

## 本次 WorkflowHub scope revision 决定

### D-004 — Grill 必须和用户沟通

- **选择**：Grill 由主 agent 在用户可见上下文执行；先用大白话展示结论、选项、后果和风险，等用户确认/修改，再写入 decision-log。
- **来源**：R-005；用户选择 `A`。
- **事实与约束**：当前 make-decision skill 已要求主 agent 负责 Talk/Grill，但本次执行没有把沟通结果显式呈现给用户。
- **理由**：文档核对不能代替用户对范围、风险和长期规则的选择。
- **后果与风险**：会多一次可见交互，但能防止代理替用户拍板；没有真实回复时不得宣称决定已确认。
- **拒绝方案**：只在后台运行 Grill，或直接把 Grill 结论写进日志。
- **延期交接**：实现由 make-decision 交互和完成证据契约承接；不新增第二套对话状态机。
- **Supersedes**：无。

### D-005 — 必需技能必须真实调用并留下事实

- **选择**：阶段依赖中声明的必需技能必须真的调用；调用结果、未调用原因或不可用事实写入统一 invocation facts。缺调用只能是 incomplete，不能伪造 pass。
- **来源**：R-006；用户选择 `A`。
- **事实与约束**：skill-deps 已声明多个技能，但 runner 的正常 run 路径没有完整 dispatch；`wh-review` 是唯一 review provider owner。
- **理由**：技能“写在清单里”不等于技能真正参与了决策；但不能为此新增第二套完成状态机。
- **后果与风险**：需要补齐 runner 的调用闭环和测试；技能不可用时质量事实更诚实，但不应自动把阶段变成不可修复的历史分支。
- **拒绝方案**：只在 prompt 里声明技能，或让每个 stage 自己维护一套调用账本。
- **延期交接**：调用顺序、输入、输出、影响写进 plan/tasks；统一事实由现有 TaskKernel/skill invocation 复用。
- **Supersedes**：无。

### D-006 — 当前材料必须在受控 specs 目录

- **选择**：当前任务的 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 统一位于 `<worktree>/specs/<task>/`，由 ArtifactDir 读写；根目录同名文件不算当前材料。
- **来源**：R-007；当前事实是 make-decision 只发布了 `quality/evidence` 决策正文，候选 worktree 根目录出现了手工 `decision-log.md`、`spec.md`。
- **理由**：后续阶段只能读取受控 ArtifactDir，才能保证任务身份、快照和材料一致。
- **后果与风险**：需要让 make-decision 也能写受控 ArtifactDir，并保留质量证据的不可变快照；不允许用复制文件解决不一致。
- **拒绝方案**：继续依赖根目录文件，或让每个阶段自行拼路径。
- **延期交接**：build-spec/build-plan 只使用 `ctx.artifacts`；旧 quality evidence 只做来源证据，不成为第二份当前材料。
- **Supersedes**：当前 `docs/adr/0009-stage-content-authority.md` 中“决策只通过 accepted facts 定位、不产生 worktree-side decision-log”的旧边界。

### D-007 — spec 面向人，plan/tasks 面向实现

- **选择**：spec 只写问题、用户流程、页面/入口范围、数据状态、成功/失败边界、功能要求、验收、非目标、风险和延期；文件、函数、schema、命令、顺序、回滚和测试细节放入 plan/tasks。
- **来源**：R-008；用户选择 `A`；参考 GitHub Spec Kit 和 Matt Pocock `to-spec`。
- **关键调研事实**：Spec Kit 的 specify 模板聚焦 what/why、场景、需求、边界和成功标准，plan 才接技术上下文；Matt 的模板把实现决策和测试决策单列，而不是塞进问题规格。
- **理由**：正常读者应能在几分钟内知道“要解决什么”和“做到什么算成功”，不必阅读内部 ID 和实现过程。
- **后果与风险**：plan/tasks 必须承担更多可执行细节；如果 spec 省掉了行为边界，build-plan 必须 STOP，不得自行补产品需求。
- **拒绝方案**：继续把完整实现文档叫 spec，或用 build-spec 替用户补决定。
- **延期交接**：高智力 build-plan 负责工程方案、测试路线和执行卡；普通 build-code 只执行。
- **Supersedes**：当前候选 worktree 根目录 497 行的工程化 spec 草稿。

### D-008 — review 语义改为建议（历史版本）

- **选择（历史版本）**：make-decision、build-spec、build-plan、verify-code 的 review 是异源建议；主 agent 必须逐条判断 finding 是否合理、是否修复、拒绝或接受风险，但不为 stage 反复追求 pass。原先把 build-code 最终 review 写成必须 pass，已由 D-016 收窄为 review fact + finding disposition。
- **来源**：R-009；用户选择 `A`。
- **理由**：质量建议有意义的地方在于帮助主 agent 判断，不在于把 provider verdict 变成推进许可证。
- **后果与风险**：严重 finding 不能被忽略，必须有处置和证据；provider unavailable、invalid evidence、revise_required 等原始事实照实保留。
- **拒绝方案**：每轮 finding 都触发全量 review，或把非 build-code review 变成隐性 pass gate。
- **延期交接**：wh-review 继续是唯一 provider owner；一次未变化快照只审一次，变化后只审 delta 和直接影响。
- **Supersedes**：当前 stage completion 中把 review 结果语义化为反复 pass 的旧行为。

### D-009 — 阶段技能的调用顺序和产物（历史版本，当前以 D-015 为准）

| 阶段 | 高智力设计时实际调用 | 不调用/不重复的技能 | 必须产生的影响 |
| --- | --- | --- | --- |
| make-decision | Talk、Grill、decision-log；必要 research；wh-review direction/detail；simplicity-guard 只由 wh-review lens 负责 | 不调用 spec-analyze/spec-plan/spec-tasks | 用户可见选择、决策日志、范围/风险/延期；review 只作建议 |
| build-spec | spec-specify → spec-clarify → simplicity-guard → plan-ceo-review → wh-review | 不调用 spec-analyze；不把 plan 当 spec | 可读 spec、ambiguity facts、finding 逐条处置；未解决的产品歧义 STOP |
| build-plan | spec-research → spec-plan → test-routing-advisor → testing-system-blueprint → 适用 testing skill（设计输入）→ spec-tasks → spec-analyze → simplicity-guard/plan-eng-review → wh-review | 不执行测试；不在 build-code 重新设计路线 | 完整 plan/tasks：开发什么、注意什么、每 Phase/最终测试层级、具体技能、命令、oracle、证据和 STOP |
| build-code | 按 tasks 的顺序执行记录好的具体测试策略；最终调用 wh-review | 不重新路由、不重新设计 testing skill | 普通模型只执行；实际 exit、输出 hash、snapshot、证据和失败事实回填 |
| verify-code | 读取四份材料和 build-code 事实，独立复跑已设计路径；wh-review 只作建议 | 不调用 spec 技能，不把 review 当 pass gate | 独立验证结果、逐 AC 结论、未决风险和交接 |

- **补充决定**：`test-routing-advisor` 在 build-plan 先给每个 Phase 和最终完整测试判定 `simple|feature|fullstack`；随后测试技能只做“怎么测”的设计，真正执行延迟到 build-code。
- **高智力模型要求**：build-plan 必须把以上设计产物落到 plan/tasks；build-code 不得凭空发明测试命令或验收 oracle，缺失就写 `MATERIAL_INCOMPLETE` 并 STOP。
- **Supersedes**：此前“只在 build-code 调具体测试技能”的模糊表述；现在明确为“build-plan 设计时调用，build-code 执行时不重设计”。
- **当前状态**：上表保留为原始决策事实；其中 build-plan 调用 `testing-system-blueprint`/具体 testing skill，以及 build-code 不重路由的部分，已由 D-015 supersede，不得作为当前执行合同。

### D-010 — spec-analyze 做完整一致性审查

- **选择**：spec-analyze 读取原始需求、decision-log、spec、plan、tasks，做报告式一致性检查。
- **检查内容**：原始需求是否全部覆盖；四份材料是否一致；用户流程、数据状态、成功/失败边界、非目标和延期是否遗漏；每个 FR/AC 是否有 task、测试层级、命令、oracle、证据；是否出现孤儿 task、无来源 plan、重复或 scope drift。
- **理由**：只看 spec/plan/tasks 会漏掉原始需求和用户已确认的限制。
- **后果与风险**：会产生更有用的 finding，但它仍是 report-only；主 agent 必须逐条评审，不得看到 finding 就直接推进。
- **延期交接**：由 build-plan 调用一次；finding 保留来源、影响、修正建议、owner、consumer 和处置状态。
- **Supersedes**：现有只读取 `planning_artifacts` 中 spec/plan/tasks 摘要的弱检查。

### D-011 — build-plan 用高智力模型，build-code 用普通模型执行

- **选择**：把所有工程判断前置到 build-plan：开发范围、文件边界、顺序、风险、注意点、每 Phase 测试层级、具体 testing skill、命令、预期退出码、oracle、fixture/service、证据路径、覆盖限制、STOP 和最终完整测试策略；build-code 按 tasks 顺序执行并只回填事实。
- **来源**：用户最新原话：“我希望 build-plan 阶段用高智力模型把计划做好……build-code 阶段就可以用普通智力模型，按顺序去执行了。”
- **理由**：把复杂判断集中在一次高质量规划，降低执行阶段重新思考和重复 token 消耗。
- **后果与风险**：plan/tasks 若漏写关键命令或 oracle，普通模型不能可靠补救；因此 plan-task 结构检查和 `MATERIAL_INCOMPLETE` STOP 必须明确。
- **延期交接**：build-code 只执行已记录策略；实际改动超出 Phase 文件边界时回到 scope revision。
- **Supersedes**：D-009 中尚未明确模型分工的部分。
- **当前状态**：模型分工仍有效；具体 testing skill 的调用时机改由 D-015 规定为 build-code 真实改动后，D-011 中与此冲突的“build-plan 直接调用具体 testing skill”不再有效。

## 原始事实与调研

| fact/source | 关键事实 | 影响 |
| --- | --- | --- |
| F-001 `06-stage-gates.md` | 组 6 的问题 19/21/24/31/32 仍有回归证据、baseline、阶段证据、失败归因和并发 lease 缺口。 | 纳入组 6，禁止复活旧 control plane。 |
| F-002 `07-provider-prompt-review-package.md` | 组 7 已有部分 subject 绑定，但 attempt/result lineage、failure taxonomy、全量 metrics 不完整。 | 纳入组 7，保留逐次尝试和失败事实。 |
| F-003 `08-archive-reference.md` | 归档内容只读；inventory/retention 登记存在差异。 | 组 8 只修登记/校验。 |
| F-004 当前 main | ArtifactDir 只控制 `specs/<task>/`；make-decision 当前 context 没有 ArtifactDir，stage runner 只读 invocation facts，存在声明技能但未实际 dispatch 的风险。 | 纳入 D-005、D-006；实现需复用现有能力。 |
| F-005 本次候选材料 | 根目录出现未受控 `decision-log.md`、`spec.md`；后续阶段应读取受控目录。 | 当前 scope revision 先迁移材料，再修运行时写入路径。 |
| F-006 [GitHub Spec Kit](https://github.com/github/spec-kit) 与 [spec template](https://raw.githubusercontent.com/github/spec-kit/main/templates/spec-template.md) | specify 模板把用户场景、需求、边界、验收和成功标准放在 spec；计划阶段再接技术上下文。 | 支持 D-007。 |
| F-007 [Matt `to-spec`](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-spec) | Problem、Solution（用户视角）、User Stories、Implementation Decisions、Testing Decisions、Out of Scope 分开。 | 支持 D-007，并把实现/测试移到 plan。 |
| F-008 wh-review | 当前 provider 有完成、失败、卡住和 invalid evidence 混合事实。 | 只能保留原始状态，主 agent 逐条处置。 |

## Grill 与用户确认

- **Grill 结论**：当前问题不是再加一层流程，而是四个可观察缺口：材料没落到受控目录、技能声明与真实调用可能脱节、spec/plan职责混淆、review建议被误当成 pass。处理这些缺口不会恢复历史 control plane。
- **本轮沟通变化**：本记录公开展示了结论、后果和风险；用户随后确认“其他没问题了，可以继续了”。该回复作为本次 scope revision 的用户确认事实；正式 runtime confirmation 需要在重新发布当前材料时绑定新的 revision。
- **文档结果**：暂不新增 ADR；这是对已有当前材料和阶段合同的修正，不新增公共运行时行为。若实现改变 make-decision 的 ArtifactDir 能力，plan 必须说明它是对现有能力的扩展，不是第二套材料系统。

## 审查处置

| finding_id | 原始事实 | 主 agent 判断与后果 | status | 下一步/保留 |
| --- | --- | --- | --- | --- |
| FND-001 | provider 对组 8、历史方案或范围提出意见，但部分 anchor 无效。 | 无效 anchor 不能直接阻断；本地事实仍需保留。 | rejected_invalid | 保留原始 provider 结果；build-spec/build-plan 消费当前决策。 |
| FND-002 | pi/k3 卡住，cursor/grok 失败，antigravity/flash 完成。 | 不能宣称全员可用；不因不可用循环 review。 | accepted_risk | 保留 provider attempt/result；后续只做一次必要的直接影响审查。 |
| FND-003 | spec 太工程化、技能未真正使用、材料路径错误、review 语义造成多轮。 | 属于真实流程缺口，已转为 R-005—R-009 与 D-004—D-011。 | fixed_in_current_materials | 由 plan/tasks 交给 build-code 实现并由 verify-code 验证；不删除原始事实。 |
| FND-006 | P1 `wh-review`（result `quality/reviews/results/build-code-default-b0f1fb2e0040ffb7995b44ee46dfc5097e363b88-9c494a4c-9ab7-4bdc-81f0-f9a52b4804d5.json`）指出 `stage-decision-contract.test.mjs` 被写成 MODIFY，但当前 diff 没有改它。 | finding 合理；它是既有回归输入，不是 P1 修改文件。已从 plan/tasks 的修改清单和 T002 执行文件中移出，保留为 reused baseline test；随后重新采集当前快照测试并完成 P1 review，结果无 findings、verdict=pass。 | fixed_in_current_phase | 新结果：`quality/reviews/results/build-code-default-78ae109b57f061092886b9862ff76e7023e3fb8d-b34c80e3-6ac3-49df-a67f-d9565b7ebda5.json`；原始 finding 和两次 review 事实均保留。 |

### 本轮 plan/tasks 设计复核新增事实

| finding_id | 原始事实 | 主 agent 判断与处置 | status | 下一步/保留 |
| --- | --- | --- | --- | --- |
| FND-004 | `dispatchStageSkill()` 和 invocation fact 能力存在，但 `runOfficialStage()` 当前只读取已有 invocation，不会自动产生 `spec-*` 的真实调用事实；已有完成测试不能证明正式 build-spec/build-plan 已 dispatch。 | 合理且直接影响 R-006/D-005；不能靠文档宣称“已调用”，纳入 P2 的 dispatcher、completion、E2E/contract 测试和 `MATERIAL_INCOMPLETE` 停止条件。 | accepted_for_plan | T003—T004；保留缺事实为 incomplete，不伪造历史 receipt。 |
| FND-005 | 当前 manifest、stage-skill-plan 和 runner 没有明确区分 stage-owned skill 与 wh-review delegated lens；直接补依赖可能重复调用或错误计数；review controller 对普通快照变化仍可能重新走 full initial。 | 合理；选择“manifest 声明依赖 + owner/dispatch 区分、wh-review 单一 lens owner、delegated lens 不计为独立 stage component；同 snapshot 不重审，普通修复只允许有直接影响的 delta，不为追求 pass 全量重审”。 | accepted_for_plan | D-012、D-013；T003—T004；保留原始 review attempt/result 和 provider verdict。 |

### D-012 — 技能依赖和 delegated lens 使用单一 owner

- **选择**：stage manifest 直接声明所有阶段需要的技能，并给每项标明 `owner/dispatch`；普通 stage skill 由 stage dispatcher 真实调用，review lens 由 `wh-review` 一次性按 `stage-skill-plan.json` 调用。delegated lens 不允许被公共 stage 命令直接调用，也不作为独立 stage completion component 重复计数。
- **来源**：FND-004、FND-005；`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/schemas/stage-skill-deps.schema.json`、`skills/wh-review/stage-skill-plan.json` 的当前事实。
- **理由**：既能证明技能真正参与，又不新增第二套 review ledger 或重复 provider 调用。
- **后果与风险**：需要同步 schema、dispatcher、closure、completion、manifest 和测试；旧 fixture 需要明确 stage-owned/delegated 身份。
- **延期交接**：具体字段名和兼容旧 fixture 由 build-code 按 T004 的真实代码锚点确定；不改变公共阶段数量。

### D-013 — review 重试只做有直接影响的 delta

- **选择**：同一 snapshot 不重复全量 review；非 build-code 普通修复不自动重新走 full initial；只有 review scope/boundary 或直接影响的材料/代码真正变化时，才按已有 lineage 做一次最小 delta review。verify-code 的独立 review 仍只消费新验证边界；不为取得 pass 反复审查。
- **来源**：FND-005；现有 `review-controller.mjs`、`wh-review-cli.mjs` 与 `wh-review` stage contracts 的行为对照。
- **理由**：保留有意义的异源审查，同时消除因 provider verdict 或普通修复造成的 token 浪费。
- **后果与风险**：需要明确“直接影响”和 delta scope；无法证明影响关系时保留 advisory/unknown，不自动全量重审。
- **延期交接**：具体 controller 判定和 regression fixture 由 T003—T004 实现；原始 attempt/result 不覆盖。

### D-014 — build-code 每个 Phase 的 review 必须 pass

- **选择**：build-code 的每个 Phase（当前任务为 P1—P5）都必须完成实现、记录测试事实、由主 agent 逐条评审 findings、修复有效问题并重新 review 到 `pass`，才允许交接到下一个 Phase；verify-code 只在全部 Phase 通过后开始，并在 close 前停下汇报。
- **来源**：R-010；用户最新连续推进指令。
- **理由**：把 review 质量要求放在实际交付边界，避免带着未处置问题一路累积到最终验证。
- **宪法边界**：这是 build-code Phase handoff 的质量要求，不是禁止同一任务继续修复的总 gate；review 发现问题时仍在当前 Phase 修复，保留原始 verdict 和 disposition，不创建新任务、不伪造 pass。
- **后果与风险**：provider unavailable、invalid evidence 或未解决 serious finding 会让当前 Phase 不能交接；需要明确重试上限、真实失败原因和最小修复范围，不能为了拿 pass 无限重复。
- **延期交接**：每个 Phase 的 review packet、pass 条件、disposition 和复审证据由 plan/tasks 及 build-code 执行记录承接；非 build-code review 仍按 D-008 保持 advisory。
- **当前状态**：D-016 已按宪法收窄本决定；原始用户要求和本次错误实现保留为历史事实，不能继续作为 reviewer pass gate。

### D-015 — 固化阶段技能顺序与测试执行时机

- **选择**：build-spec 按 `spec-specify → spec-clarify → simplicity-guard → plan-ceo-review → 条件 plan-design-review(UI) → wh-review` 执行；主 agent 逐条处置 wh-review findings 后发布 spec。build-spec 不调用 `spec-analyze`。
- **选择**：build-plan 按 `spec-research（有真实问题才执行，否则 skipped）→ spec-plan → simplicity-guard → plan-eng-review → test-routing-advisor → spec-tasks → spec-analyze → wh-review` 执行。`test-routing-advisor` 为每个 Phase 和最终完整测试预判 tier 与具体 testing skill；build-plan 不调用 `backend-testing`、`frontend-testing`、`fullstack-slice-testing` 或 `testing-system-blueprint`。
- **选择**：build-code 先读取 plan/tasks 的预判，检查真实 changed files；范围变化时重新调用 `test-routing-advisor`，随后按实际范围调用 `backend-testing`、`frontend-testing` 或 `fullstack-slice-testing`，再执行测试并留下事实。范围未变化也必须调用计划指定的具体 testing skill，不由普通模型临场发明策略。
- **来源**：R-011；用户最新连续推进指令。
- **理由**：把产品和工程判断集中在 build-plan，同时让测试技能看到真实实现后的文件范围；避免空代码阶段凭空设计具体测试，也避免普通执行模型猜测。
- **后果与风险**：阶段依赖、步骤、skill 文档、plan/tasks 和测试契约必须同步；旧的“build-plan 调 blueprint/具体 testing skill”和“build-code 不重新路由”文字全部失效。实际范围变化可能产生新的 tier/命令，必须记录原始预判、重路由事实和最终执行结果。
- **主 agent 影响**：这是当前任务的 scope revision；必须先更新 decision-log、spec、plan、tasks 和阶段合同，再执行新增/受影响 Phase；不覆盖历史 P1—P4 的原始 receipt。
- **交接确认**：用户已经授权连续推进，普通阶段交接不再重复询问 stage confirmation；只有出现新的产品选择、范围变化、具体风险接受或不可逆操作授权时才重新沟通。
- **延期交接**：build-code 的 concrete testing skill 只消费真实 changed files、当前 Task 和 plan/tasks 预判；verify-code 反向检查原始需求、四份材料、完整用户流程和全部证据，缺证据标 `unknown`，不算 pass。
- **Supersedes**：D-009 中 build-plan 调用 blueprint/具体 testing skill 的部分、D-011 中“所有具体 testing skill 在 build-plan 设计”的部分，以及 D-009 中 build-code“不重新路由”的部分。

### D-016 — 宪法优先解释 review 和 Phase 交接

- **选择**：所有阶段都必须真实执行声明的 review；主 agent 必须逐条检查每个 finding，记录来源、影响、判断、修正或延期交接。reviewer 的 `pass`、`revise_required`、`unavailable` 和 `invalid_evidence` 都保留为质量事实，不能把 `pass` 设成继续工作的许可证，也不能为追求 `pass` 无限重审。
- **build-code 交接**：Phase 完成需要实现、风险相关测试、AC/证据、review 事实和 finding disposition；存在已认证 actionable `major|blocking` 时，必须在同一任务修复或取得绑定该 finding 的具体风险接受。review verdict 本身不是硬门槛，缺质量事实或 serious finding 未处置时只能保持 `incomplete`，不能宣称完成。
- **来源与宪法依据**：F3、F4、F5、F9、F10、Q1、Q2；它们优先于 R-010/D-014 中把 reviewer `pass` 写成阶段 gate 的解释。
- **理由**：避免把本任务已经出现的审查包、锚点和 provider 失败，转化为数小时的 review→修复→再 review 循环；同时保留真正有价值的异源审查和人工把关。
- **后果与风险**：非 `pass` 结果不会被改写成成功；未完成质量事实会显示为 `unknown`/`unavailable`/`incomplete`，并影响完成结论，但不阻止同一任务继续修复。
- **延期交接**：当前 P5 只做一次当前快照 review；先处理已有 findings，再决定是否需要修复行为。后续最终测试和 verify-code 反向回放不以 provider `pass` 替代逐 AC 证据。
- **Supersedes**：D-014 中“review 到 `pass` 才能交接”、spec/plan/tasks 中相同的硬 gate 文案；不删除 R-010 原始需求或旧 review 事实。

### D-017 — verify-code 改为有上限的架构师验收

- **原始需求**：用户明确要求 verify-code 像资深架构师一样检查需求实现、架构设计和代码完整性；先修改一次、独立审查一次、再按审查结果修改一次，然后收尾，不再把时间耗在证据和审计循环上。
- **关键事实**：当前 verify-code 同时要求长篇 requirement replay、完整 acceptance evidence tree、重复 review 绑定和多重 close 证据；这些事实增加了耗时，却没有替代架构判断。AgentHub 的 test-acceptance 提示词保留了真实测试和逐条验收的价值，但其重复 fresh verification、强制 review pass 和多重 gate 不适合当前 WorkflowHub 宪法。
- **选择**：verify-code 固定为“架构师检查一次 → 主 agent 修一次 → wh-review 异源审查一次 → 主 agent 最后修一次 → 最终测试/交接”。最多一次架构检查、一次异源 review、两批主 agent 修复；旧 requirement replay 只作可选审计事实，不能触发循环。
- **理由**：把有限的时间用于发现真正影响交付的需求、架构、实现和失败路径问题；保留当前四份材料、AC、当前测试和独立 review 这些必要事实，但不再复制完整日志、历史 evidence tree 或 provider ledger。
- **后果与风险**：结论更快、更接近正常工程验收；如果主 agent 漏看问题，异源 review 仍有一次补漏机会；第二次修复后不再自动开启第三轮，剩余风险必须如实交接。
- **宪法依据**：F1/F3/F4/F5/F8/F9/F10；review 是质量事实，不是 pass 许可证；unknown/incomplete 不能伪造成完成。
- **延期交接**：具体代码问题交给同一任务的两批修复；provider 不可用、最终测试超时或 AC 缺证据交给用户可见交接，不启动新任务或新账本。

### D-017 执行结果与主 agent 处置

- 第一批修改后的定向合同测试通过：5 个文件、36 个测试、exit 0。
- 按本决定只发起一次独立 `wh-review`。本机 provider 等待约 3 分钟没有返回，主 agent 停止该请求；没有 semantic verdict，也没有可采纳的 provider finding，状态保留为 `unavailable`，不重试。
- 主 agent 发现一条本地有效问题：`wh-review/SKILL.md` 和生成 instructions 仍残留旧的“完整 acceptance evidence/fresh tests/full review”语义，可能把新流程重新拉回证据循环。已在最后一批修改中统一为“短摘要、一次 post-repair 架构审查、无 provider pass 门槛”。
- 影响：当前 verify-code 流程合同已完成收窄；provider unavailable、历史完整测试 timeout 和 P5 当前 review 缺失仍是质量事实，不能写成正式通过。

### D-018 — 当前任务恢复 Phase pass 交接，但不恢复全局审查循环

- **原始需求**：用户要求本任务按标准 WorkflowHub 推进；P1—P5 每个 build-code Phase 必须完成实现、测试、主 agent finding 评审和一次当前 `wh-review=pass` 后才能交接到下一个 Phase，全部 Phase 完成后才进入 verify-code。
- **关键事实**：D-016 把 reviewer `pass` 从全局推进许可证中移除是合宪的；但本任务当前用户合同明确要求 Phase handoff 以 `pass` 为完成条件。现有任务材料仍把 P5 写成 `incomplete`，原因是把后续 verify-code 的改动和 P5 阶段混在一起，不能据此否定 P5 最近一次已记录的 `pass`。
- **选择**：只在本任务的 build-code Phase handoff 中要求 `review verdict=pass`；它不是新的公共 runtime gate、不是第二套 ledger，也不触发同一快照无限复审。`unavailable`、`revise_required` 或未处置 serious finding 继续保留原始事实，并使当前 Phase 保持 incomplete；修复后最多按新的快照做一次有限复审，仍不通过就停止并交接风险。
- **理由**：满足用户对每个 Phase 质量把关的明确要求，同时保留宪法对事实、推进、发布和正式完成分离的约束，避免恢复原先“为拿 pass 无限循环”的错误行为。
- **影响**：更新当前四份材料和 build-code 执行合同；P1—P4 复用已有绑定的 pass 事实，P5 使用最近一次 P5 pass 及当前绿色定向测试；P6/verify-code 改动不再倒灌为 P5 未完成。
- **风险**：P1—P5 的 review 仍是阶段快照事实，不能代替 verify-code 对当前整体实现的架构复核；最终完整测试或 verify 独立审查缺失时，整体结论仍只能是 `incomplete`。
- **延期交接**：最终完整测试、verify-code 架构师检查和一次异源审查由 verify-code 完成；close、commit、push、merge、archive 和 cleanup 仍需单独授权。
- **Supersedes**：仅就本任务 P1—P5 的 handoff 语义取代 D-016 中“review verdict 本身不影响 Phase handoff”的表述；不改变 D-016 对非 build-code review、全局 runtime 和无限复审的限制。

### D-019 — 把重型公共行为探针从普通收尾测试中拆出

- **原始事实**：`public-behavior-baseline` 会为 7 个公共行为各跑 default/alternate 两个隔离 CLI 场景；普通测试文件还重复采集同一组场景，单次 live 采集约 9 分钟，导致 `npm test` 看起来长期卡住，并把 verify-code 的时间耗在探针审计而不是功能验收上。
- **选择**：普通 `npm test` 只校验已冻结的 candidate 契约；live 14 场景探针保留为显式 `WORKFLOWHUB_LIVE_PUBLIC_BEHAVIOR=1` 运行的架构检查。它不改变七个公共行为，也不把静态 fixture 当作当前 live provider 或正式 close 证据。
- **理由**：日常收尾需要有界、可重复的回归测试；公共行为探针仍然有价值，但应在公共 API 发生变化或需要专项架构核查时单独执行，不能每次 verify 都自动重复。
- **后果与风险**：普通全量测试耗时显著下降；如果公共 runtime 发生变化，必须显式运行 live 探针，不能只看冻结 fixture。缺少 live 探针时仍只表示该专项检查未执行，不影响普通测试的真实结果。
- **同步修复**：已将已归档的 requirements-completeness 文件登记到 `history-inventory.json` 和 `retention-manifest.json`，只更新登记和哈希，不修改归档内容；同时修复 wh-review skill bundle 哈希与 catalog 的绑定。
- **宪法边界**：不新增 ledger、公共命令、历史读取路径或 close gate；静态 fixture、live 探针、测试结果和正式 verify 结论保持分离。
- **延期交接**：公共行为发生变化时由 build-code/verify-code 按真实改动范围显式执行 live 探针；本次 verify 仍只做一次最终完整测试和一次事实交接。

## 非目标

- 不重写下载资料，不把组 6、7、8 变成历史问题编号的执行顺序。
- 不恢复 recovery、reopen、rebind、continuation、successor/predecessor、replacement review、旧 accepted 或历史 inventory runtime。
- 不让运行时读取 `specs/archive` 或把历史归档变成当前材料。
- 不新增 UI 页面；本任务的“可见”指主 agent 的 Talk/Grill 和现有运行结果可读，不是开发页面。
- 不在 build-spec 偷补未决定的产品范围；不在 build-code 重新设计产品范围或验收 oracle。只有真实 changed files 与预判范围不一致时，才重新调用 `test-routing-advisor` 并按实际范围选择具体 testing skill。
- 不把 review provider verdict、测试 exit 0、材料存在或 inventory 事实单独当作完成许可证。

## 风险与延期交接

| id | 风险/延期 | 处理阶段与 owner | 关闭条件 |
| --- | --- | --- | --- |
| RISK-001 | make-decision 若同时写 quality evidence 和当前材料，可能产生两份真相。 | build-plan/runtime owner | 当前材料由 ArtifactDir 读写，quality evidence 只作不可变证据并校验 hash。 |
| RISK-002 | 高智力规划遗漏命令、oracle 或文件边界，普通执行模型会自行猜测。 | build-plan/spec-tasks owner | 每个 Phase 和最终测试都有完整 test contract；缺项 STOP。 |
| RISK-003 | spec-analyze finding 被直接照单全收，产生无意义返工。 | build-plan 主 agent | 每条 finding 有证据、后果、处置、owner/consumer；主 agent 先评审再推进。 |
| RISK-004 | review advisory 语义被实现为隐性 gate，继续多轮审查。 | build-spec/build-plan/verify-code owner | 非 build-code review 不要求 pass；快照未变不重复全量审查。 |
| DEFER-001 | 组 6 最小数据字段、阶段证据原子发布方式。 | build-spec → build-plan | spec 只锁行为，plan 给出已核实接口和最小设计。 |
| DEFER-002 | 组 7 lineage/failure taxonomy/metrics 的具体字段。 | build-plan | 每个字段有 consumer、owner、测试和失败语义。 |
| DEFER-003 | 组 8 inventory 更新文件和 retention 命令。 | build-plan | 只改登记事实，归档内容 hash 保持不变。 |
| DEFER-004 | make-decision ArtifactDir 写入和旧 ADR 的同步修改。 | build-plan → build-code | 新路径有正式测试；无第二套 writer。 |

## 阶段交接

- **交给 build-spec**：只需把 D-001—D-014 转成可读行为规格；不要猜字段、文件、命令或实现顺序。必须调用 `spec-specify`、`spec-clarify`，并保留未决项。
- **交给 build-plan**：使用高智力模型，按 D-015 写出完整工程方案和执行卡；只调用 `spec-research`、`spec-plan`、`simplicity-guard`、`plan-eng-review`、`test-routing-advisor`、`spec-tasks`、`spec-analyze`，再由 `wh-review` 提供一次异源建议。具体 testing skill 不在此阶段调用。
- **交给 build-code**：使用普通模型，按 tasks 逐项执行；读取预判、检查真实改动，必要时重新路由，再调用具体 testing skill；不改产品范围、不把失败改写为通过。
- **交给 verify-code**：读取四份材料、实际变更和证据，先做一次架构师检查并修一次，再调用一次 `wh-review`，再做最后一批修复和一次最终测试；只发布短验收摘要，不复制全量历史 replay。

## 最终状态

- 当前 scope revision：`accepted_for_continuation`，基于用户最新确认；正式 runtime publication/confirmation 需绑定新材料快照。
- 当前材料：已写入 `specs/multica-issues-monitoring-g6-g7-20260805/`；根目录同名草稿不再是当前材料。
- 质量事实：保留已有 review/provider 的 pass、失败、卡住和 invalid evidence，不重写。
- 不能宣称：本记录不表示 spec、plan、tasks 已完成，也不表示代码已修复；这些交给后续阶段。
