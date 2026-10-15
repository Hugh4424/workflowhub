# Skill 复用与溯源登记

UI governance records include an explicit owner, consumer, and delete condition.

实际调用以各阶段 `skill-deps.yaml` 与 wh-review 两清单为准；[`catalog.yaml`](catalog.yaml) 是唯一来源、许可与历史归属登记。本文件是人读投影。固定版本、完整 `upstream` 与更新策略以 catalog 为准；禁止用 `main/latest` 代替固定 commit。`unresolved-*-snapshot` 表示历史导入未保存 commit，更新前必须先补齐，不能假装已固定。

## 状态词表与 M17 审计

复用状态只使用 catalog 当前词表：`native`（仓内实现）、`adopted`（外部原样采用）、`adapted`（外部改造）、`absorbed`（规则已吸收，不保留独立 skill）、`rejected`（明确拒绝）和 `watch`（观察中）。`docs/reuse-registry.md` 记录同一词表和审计结论，不另立状态名。

2026-09-05 `_spike` 审计：扫描当前 `skills/` 路径未发现 `_spike` 目录或文件；本结论只证明当前仓内扫描范围，不推断仓外历史目录已删除。

2026-09-05 M17 X 处置：X2 委派不引入；X3 保持独立 3rd-review broker，通过 `wh-review` 薄入口声明运行依赖 `>=1.2.0`，当前 host adapter 探针因 broker 未暴露 semver 而报告 `unknown`；X4 `debate` 状态为 `adopted`，仅作可选诊断，不进入核心 Bundle。

## 兼容索引

下表保留旧合同依赖的三列格式和历史路径，不作为当前派发或完整 provenance 真相。

| skill 名 | 复用类别 | 来源路径 | upstream_delta |
|---|---|---|---|
| make-decision | 自研 | none | stage orchestrator |
| build-spec | 自研 | none | stage orchestrator |
| build-plan | 自研 | none | stage orchestrator |
| build-code | 自研 | none | stage orchestrator |
| verify-code | 自研 | none | stage orchestrator |
| scope-triage | 外部改造适配 | AgentHub historical import | 已内联吸收，不保留 runtime skill |
| decision-log | 外部改造适配 | AgentHub historical import | 现为 workflowhub native |
| Worker-Mode | 外部依赖 | host subagent capability | 不属于 skill 闭包 |
| 3rd-review | 仓内原生 | skills/third-review | 已迁入 `skills/third-review`，由 wh-review 调用 |
| TDD 件（capture.mjs） | 外部改造适配 | obra/superpowers + mattpocock/skills | 内联 RED/GREEN 证据合同 |
| spec-specify | 外部改造适配 | github/spec-kit | 去宿主耦合 |
| spec-clarify | 外部改造适配 | github/spec-kit | 去宿主耦合 |
| spec-plan | 外部改造适配 | speckit-plan/SKILL.md + obra/superpowers | 唯一 plan 格式 |
| spec-tasks | 外部改造适配 | speckit-tasks/SKILL.md + obra/superpowers | phase 六段映射 |
| spec-analyze | 外部改造适配 | speckit-analyze/SKILL.md historical idea | 现为 native lens |
| spec-prd | 自研 | none | build-prd 唯一正式 PRD 内容 owner；独立调用保持同版两步输出，不伪造平台事实 |
| spec-research | 自研 | none | workflowhub 原生 |
| talk-with-zhipeng | 外部改造适配 | AgentHub historical import | 现为 workflowhub native |
| grill-with-docs | 外部改造适配 | mattpocock/skills | 吸收 grilling/domain-modeling |
| intake-decision-review | 外部改造适配 | AgentHub historical import | 现为 workflowhub native |
| test-routing-advisor | 外部改造适配 | Hugh4424/AgentHub | 裁为纯路由 JSON |
| stage-step-receipts | 自研 | 已退役，无当前路径 | P0 canonical receipt contract；审计任务保留 |
| audit-summary-carrier | 自研 | 已退役，无当前路径 | P0 bounded audit-summary contract；审计任务保留 |
| requirement-lineage | 自研 | 已退役，无当前路径 | P0 requirement evidence contract；审计任务保留 |
| workflowhub-multica-sync | 自研 | skills/workflowhub-multica-sync/SKILL.md | 固定 main 快照并做 Git 连通性预检，按阶段三件套审计 Multica 技能、依赖绑定和 agent 提示词；确认后才同步 |
| ui-project-init | 自研 | skills/ui-project-init/SKILL.md | version 2.0.0；三起点按类接线原专业 owner；consumer/deletion 见 catalog |
| design-source-readiness | 自研 | skills/design-source-readiness/SKILL.md | 按本动作适用专业来源 → Screen Read Map；不打分、不设 gate |
| frontend-prototype-render | 自研 | skills/frontend-prototype-render/SKILL.md | 真实组件渲染→任务预览/截图；降级须用户明确同意 |
| frontend-component-quality | 外部改造适配 | skills/frontend-component-quality/SKILL.md + Vercel pinned guide | Component Quality Map；React/Next 只读内部 lens |

## 仓内运行技能

以下条目保留各自来源与历史改造说明；旧 build-spec、spec-research、spec-tasks、debate 及旧 receipts/runner 描述不恢复为当前调用。当前接线与退役按上述实际清单读取。Matt 当前固定来源为 `b0618bc436ad893b3c5e84e55fba86586d34a404`；原固定版本缺 pr、retro、implement-spec 的事实仍由任务 decision-log 的 AC-017/源研究 §8.1 保留，不改成旧版本已存在。

共同规则：所有路径都在 `skills/`；Stage-owned 组件通过 `skill-deps.yaml` 显式加载，portable workflow 也通过同一声明式依赖闭包加载；authoring review 的适用 lens 由 wh-review 放进 frozen packet，代码审查由 OCR delegation 处理；不注册到 Claude/Codex 全局目录；闭包由各目录 `skill-bundle.json` 定义。

- `stage-reflection` — native；五个 authoring stage 的 stage-end 判断层复盘。只消费当前会话记忆、lessons 索引和本 stage outcome；由 runner 先追加 raw observation，再由技能产出 judgment 记录并调用确定性 validator；不生成质量分数或继续工作门禁。
- `stage-handoff` — native；当前材料与 task facts 的人读派生视图，各次原件留存。由当前 stage owner 用现有 `runtime/interface/safe-write.mjs` 的 `appendRecord` 一次 create-only 发布，路径为 `quality/evidence/handoff/YYYY-MM-DD-NNN-<stage>-handoff.md`（日期与当日序号由该工具分配，不写固定名或 current 副本），报告并回读该实际不可变绝对路径；make-decision、build-prd、build-plan、build-code、verify-code 均使用，build-code 与 verify-code 另按同一方法选择与回读实际交接；不新增 writer、facts 字段、schema、公共命令或持久对象，不生成质量事实或推进门禁。

- `anysearch` — adopted；make-decision 条件检索。来源 [anysearch-ai/anysearch-skill@db3d76e](https://github.com/anysearch-ai/anysearch-skill/commit/db3d76e5597aec7261257be5322dd211c9d9bb87)，Apache-2.0。首次导入的核心文件已逐 blob 对上该 commit；仓内打包，不做全局安装。
- `decision-log` — native；make-decision。结构化唯一权威需求记录。`upstream=[]`；随 stage 合同更新。
- `deep-research` — native；make-decision 深度调研。R0-R5、原文证据、三角测量、content-addressed `research-report.v1` 和独立复核；研究只作为 Talk 输入，不是 review 或推进 gate。`upstream=[]`。
- `grill-with-docs` — `skills/grill-with-docs/`；adapted；make-decision。来源 Matt Pocock [`grilling`](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/skills/productivity/grilling/SKILL.md) 与 [`domain-modeling`](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/skills/engineering/domain-modeling/SKILL.md)，MIT。保留完整交互、代码核实、GLOSSARY/ADR 写入和四项退出合同；不使用 lite 或只读变体，真实阻塞才转人工。
- `intake-decision-review` — `skills/intake-decision-review/`；native；make-decision direction 纯盲审 lens。只读 wh-review 冻结材料，不问用户、不调用 provider；wh-review 是唯一 provider owner。`upstream=[]`；随 wh-review 合同更新。
- `simplicity-guard` — native；wh-review packet 内的 advisory lens。四阶梯最小路径审查；不生成 `*-facts`、invocation receipt、dispatcher 或独立 runtime，不成为继续工作的前置条件。`upstream=[]`；随宪法更新。
- `talk-with-zhipeng` — `skills/talk-with-zhipeng/`；native；make-decision。独立问题成批、依赖问题拆批、动态重排、阈值收敛。`upstream=[]`。
- `spec-research` — native；build-spec/build-plan。fail-loud、可明确跳过、证据可追踪。`upstream=[]`。
- `spec-specify` — adapted；build-spec。来源 [github/spec-kit@b7e67f5 specify](https://github.com/github/spec-kit/blob/b7e67f55bf7a937aaa57dbe0a8198774e285de3a/templates/commands/specify.md)，MIT。去 git/.specify 耦合，改为 task-id、内置模板和 metrics。
- `spec-clarify` — adapted；build-spec。来源 [github/spec-kit@b7e67f5 clarify](https://github.com/github/spec-kit/blob/b7e67f55bf7a937aaa57dbe0a8198774e285de3a/templates/commands/clarify.md)，MIT。保留十维扫描，去宿主耦合。
- `spec-plan` — adapted；build-plan。来源 [Spec Kit@b7e67f5](https://github.com/github/spec-kit/commit/b7e67f55bf7a937aaa57dbe0a8198774e285de3a) plan 与 Superpowers [`writing-plans`](https://github.com/obra/superpowers/tree/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/writing-plans)，MIT。保持 workflowhub 唯一 plan 格式。
- `spec-tasks` — adapted；build-plan。来源 [Spec Kit@b7e67f5](https://github.com/github/spec-kit/commit/b7e67f55bf7a937aaa57dbe0a8198774e285de3a) tasks 与 Superpowers `writing-plans`，MIT。补 Goal/Files/Tasks/Verify/Knowledge/STOP 映射。
- `spec-analyze` — native；build-plan。report-only 一致性 lens。`upstream=[]`；历史吸收 Spec Kit analyze 思路。
- `wh-review` — native；make-decision/build-spec/build-plan 的 authoring review。普通 build-code/verify-code 通过 `review --action=record` 走 OCR delegation，再分别以 `run` 的 `receipts.review` / `receipts.quality_review` 消费 canonical 结果或 unavailable attempt。`upstream=[]`；保留原始 provenance。
- `Architect-Code-Review`（skill ID：`architect-code-review`；历史来源 `dsh-code-review`）— adapted；可选独立代码 diff 诊断与历史审查解读，无当前 stage-owned consumer，不将其输出充当 OCR 的正式 review receipt。来源 DeepSeek Harness [`dsh-code-review`](https://github.com/deepseek-ai/deepseek-harness/tree/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/.agents/skills/dsh-code-review)，并内联吸收同一版本的简化、文档、prose 与过程叙述 lens。
- `mini-task` — native；standalone。独立小功能薄流程；复用当前材料、正式审查结果和现有 task-close；不增加第六 stage 或任务关系对象。
- `workflowhub-host-protocol` — standalone native draft；宿主适配层规则。未接入任何 Stage skill-deps，不参与 WorkflowHub 阶段门禁。
- `plan-ceo-review` — adapted；make-decision/build-spec 的 wh-review packet advisory lens。来源 gstack [`plan-ceo-review`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/plan-ceo-review)，MIT。裁为 packet-local report-only lens，去 runtime/gbrain/telemetry、独立事实和调用收据。
- `plan-design-review` — adapted；build-spec UI 条件。来源 gstack [`plan-design-review`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/plan-design-review)，MIT。去浏览器 daemon。
- `plan-eng-review` — adapted；build-plan。来源 gstack [`plan-eng-review`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/plan-eng-review)，MIT。裁为 report-only lens。
- `review` — adapted；make-decision/build-spec/build-plan。来源 gstack [`review`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/review)，MIT。只作为 wh-review lens。
- `resolving-merge-conflicts` — native；verify-code close 冲突恢复。只在 task 分支解决冲突，不接管 target 合并、推送或清理。
- `test-strategy` — adapted；verify-code。来源 AgentHub 固定快照，MIT。适配 workflowhub AC-to-test-route 和 L2/L3 证据合同。
- `debate` — adopted；make-decision 条件增强。来源 [Hugh4424/debate@af121a1](https://github.com/Hugh4424/debate/blob/af121a1e24ae3af48f5e132d3de1342d16eccf31/SKILL.md)，MIT。仓内路径；失败记录 diagnostic 后继续。
- `diagnosing-bugs` — adapted；build-code。来源 Matt Pocock [`diagnosing-bugs`](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/skills/engineering/diagnosing-bugs/SKILL.md)、Superpowers [`systematic-debugging`](https://github.com/obra/superpowers/tree/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/systematic-debugging)、gstack [`investigate`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/investigate)，MIT。合并为结构化根因证据合同。
- `review-response` — adapted；build-code finding disposition。来源 Superpowers [`receiving-code-review`](https://github.com/obra/superpowers/tree/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/receiving-code-review)，MIT。适配 wh-review finding response flow。
- `test-routing-advisor` — adapted；build-plan 预判、build-code 真实范围变化时重判。来源 [AgentHub 固定快照](https://github.com/Hugh4424/AgentHub/tree/258f5a2548fa8cc15325c6aa18dd107c1fc497b9/packages/core/agenthub/skills/test-routing-advisor)，MIT。删除跨仓执行器，输出三档 JSON 并保留预判/重判事实。
- `testing-system-blueprint` — adapted；build-plan 的 advisory 测试设计输入，供 build-code 按真实改动消费；不承担执行器、交付 gate 或第二控制面。来源 [AgentHub 固定快照](https://github.com/Hugh4424/AgentHub/tree/258f5a2548fa8cc15325c6aa18dd107c1fc497b9/packages/core/agenthub/skills/testing-system-blueprint)，MIT。
- `backend-testing` — adapted；build-code 真实后端改动后调用。来源 [AgentHub 固定快照](https://github.com/Hugh4424/AgentHub/tree/258f5a2548fa8cc15325c6aa18dd107c1fc497b9/packages/core/agenthub/skills/backend-testing)，MIT。保留真实后端边界测试和报告字段，不新增执行器控制面。
- `frontend-testing` — adapted；build-code 真实 UI 改动后调用。来源 [AgentHub 固定快照](https://github.com/Hugh4424/AgentHub/tree/258f5a2548fa8cc15325c6aa18dd107c1fc497b9/packages/core/agenthub/skills/frontend-testing)，MIT。保留状态/交互/UI 证据，owner 是 build-code 前端测试路由，consumer 是真实 changed files；适用 UI attempt 经官方 build-code seam 一次调用 isolated-browser-qa，绑定本动作各类实际专业来源/版本/作用域与 service/API/DTO identity、取消和 cleanup；不把 browser pass 当推进 gate，不新增 Runner；无阶段引用时可删除。
- `fullstack-slice-testing` — adapted；build-code 真实跨边界改动后调用。来源 [AgentHub 固定快照](https://github.com/Hugh4424/AgentHub/tree/258f5a2548fa8cc15325c6aa18dd107c1fc497b9/packages/core/agenthub/skills/fullstack-slice-testing)，MIT。保留真实 seam slice 和报告，不恢复强制 worktree/commit/release gate。
- `isolated-browser-qa` — adopted；build-code controlled QA 与 verify-code UI 条件。来源为用户明确提供并授权迁入的本机 skill snapshot，审查快照 hash `ccfcbefcde46da585f1d627218965c573575f8e4d8ecd59fec2b028e22a981ef`；尚无公开 canonical URL。owner 是 browser QA 路由，consumer 是官方 build-code seam 与 verify-code；一次 invocation 沿当前 task/spec/Phase 核实际适用专业来源与 service/API/DTO identity，取消、cleanup、blocked/unknown 必须保留；pre/history snapshot 只读；无 browser QA consumer 时可删除。
- `ui-project-init` — native，version 2.0.0；现 build-plan UI trigger 消费，build-prd 经 readiness/render 读取来源指针。按三起点接线八类原专业 owner；职责与条件方法只读本入口「规范职责/方法」，fixture/Preview 的真实事实另由其执行 owner 留原件。owner 是 UI 专业规范接线作者；所有 consumer 经已审替代承接后才删除。
- `design-source-readiness` — native；现 build-plan UI 分支与 build-prd 条件设计分支消费。沿 ui-project-init 读取本动作适用专业源，按类保 bindable/not_bindable/unknown、实际确认与缺口，派生 Screen Read Map；旧 Design.md/Experience.md 仅为有据历史/可信条款输入。不打分、不设 gate、不复制正文；owner 是 UI 来源只读作者，consumer 是现 plan-design-review 输入；consumer 经已审替代承接后可删除。
- `frontend-prototype-render` — native；现 build-plan UI 分支与 build-prd 条件设计分支消费。按适用专业来源从真实组件/fixture生成任务预览和截图，沿 task 原件保命令/退出码/实际展示与用户答复；降级为提示词包前必须取得用户明确同意，降级同意不等于最终稿确认。owner 是当前 UI 方法主会话；两个当前 consumer 经已审替代承接后删除。
- `frontend-component-quality` — adapted；现 build-plan/build-code/verify-code 的真实 UI 条件消费。Component Quality Map 支持 reuse/modify/extend-state-or-variant/add-local/extract-shared/remove-after-no-consumers，读适用专业源及真实 consumer；React/Next 只读 Vercel MIT 固定 commit `dd089a8c752c966dee8bf0f27cb625ba193ffd9e`。owner 是组件质量作者；consumer 经已审替代承接后可删除；不替代 frontend-testing，不创建第二 workflow 或 gate。

本任务 C01 的固定在线方法参考由 catalog 的 ui-project-init.local_changes 现字段登记，未导入本地运行闭包：

- SDD `000b04a2a3553bddcf991b3dc42f9a5a2746fa6f` 的 SKILL/execution 人读分责与更新方法，consumer 是⑥工程 owner 与本次 P6 应用。保现 spec/Phase/facts，不迁六材料双写/reopen。
- 材料 `b62e87f3f91868033106b21f6398f0fd6d3d2043` 的 GUIDE/AUDIT 原能力分开：本次只有用途解释/PB旧规范输入盘点；定制 GUIDE 缺用户用途选择，AUDIT 未取得获准入口/资源操作范围，未运行原脚本或产出报告。许可grant未知与用途/操作授权缺口分列，原 owner 下一动作见 catalog。
- UI Designer `c7317a841b6427360bc1b94151a03cf023e6643e` 四类原方法、固定 frontend-design、闭包和本地偏离沿入口条件指针与 catalog。tokens/IA/brief 上游 designer-skills `c259656c76d9758d7ead46b0d2f125cbe84f8665` 与固定 frontend-design 各有 Apache-2.0；states 单独副本/分发grant未知，不泛化许可。专业正文应用归 P7，尚未执行。
本次实际查新/许可/闭包/query failure 为 task `quality/tests/2026-10-14-061-c01-p6-source-check.output` 与同名 `.json`；真实 SDD 应用/有界候选比较和 GUIDE 前置原件为 `quality/evidence/2026-10-14-134-c01-p6-method-application.md`。HTTP400是受控不存在路径拒绝，非真实上游故障。空 License 仅 grant 未核，当前003另不含copy/install/vendor；本次只引用阅读与项目事实原创结果，无外源副本。可读/登记/字面GREEN不宣实际能力完成或产品质量。

## 已吸收

- AgentHub `scope-triage` → make-decision S0.5 与 build-spec 高危词浮现。只保留内联分档语义，不保留独立 runtime skill。
- Superpowers `test-driven-development` + Matt `tdd` → `workflows/build-code/SKILL.md`、`capture.mjs`、`test-strategy`。只吸收 RED/GREEN、fresh evidence、anti-pattern；不复制重复 TDD 编排器。
- Superpowers `subagent-driven-development` → build-code phase executor、独立上下文、`PHASE_RESULT`。宿主 subagent 是 capability，不是 skill。
- Superpowers `requesting-code-review` → `wh-review` V4 的 authoring review。代码审查现由 OCR delegation 处理。
- Superpowers `verification-before-completion` → verify-code freshness、AC coverage、L2/L3。
- Superpowers `finishing-a-development-branch` → verify-code close、人工 merge、worktree 清理。
- Superpowers `writing-plans` → `spec-plan/spec-tasks` 字段与任务粒度，不复制第二模板。
- AgentHub `stage-summary` → 五阶段 human brief。
- AgentHub `capture-workflow-feedback` → 五阶段 `[FRICTION]` execution record；不恢复 BrainInbox/host journal。

以上 Superpowers 固定源均为 [obra/superpowers@d884ae0](https://github.com/obra/superpowers/tree/d884ae04edebef577e82ff7c4e143debd0bbec99/skills)，AgentHub 固定源均为 [Hugh4424/AgentHub@258f5a2](https://github.com/Hugh4424/AgentHub/tree/258f5a2548fa8cc15325c6aa18dd107c1fc497b9)。

## 拒绝与观察

机器 catalog capability ID 投影（用于闭包校验）：

- `superpowers-test-driven-development`
- `superpowers-subagent-driven-development`
- `superpowers-requesting-code-review`
- `superpowers-verification-before-completion`
- `superpowers-finishing-a-development-branch`
- `superpowers-writing-plans`
- `workflow-friction`
- `agenthub-testing-executor-framework`
- `agenthub-skill-discovery-symlinks`
- `agenthub-handoff-session-pair`
- `superpowers-using-superpowers`
- `gstack-runtime`
- `matt-domain-modeling`
- `matt-codebase-design`
- `matt-research`
- `matt-code-review`
- `matt-to-tickets`
- `matt-prototype`
- `matt-implement`
- `matt-setup-and-experimental`
- `gstack-evidence-visibility`
- `gstack-state-data-flow`
- `gstack-ship-release-discipline`
- `gstack-canary`

- rejected：`intake-review-orchestrator`。上游已删除；由 `intake-decision-review + wh-review` 承接。
- rejected：AgentHub 的跨仓执行器控制面、强制 gate 和宿主编排。风险维度与 backend/frontend/fullstack 方法已吸收为 build-plan 设计技能，build-code 只执行 tasks.md 策略。
- rejected：Superpowers `using-superpowers`。全局发现/bootstrap 与 repo-relative 按需加载冲突。
- rejected：gstack runtime。Bun、browser daemon、gbrain、telemetry、自动更新均不进入闭包；只人工吸收局部 review/QA 方法。
- absorbed：Matt `code-review` 双轴进入 `review`；`research` primary-source/citation 进入 `spec-research`；`to-tickets` 阻塞边/tracer bullet 进入 `spec-tasks`。
- watch：Matt `domain-modeling`、`codebase-design`、`prototype`。没有独立 stage 触发、消费点、验证合同前不进入运行闭包。

测试策略边界：`testing-system-blueprint` 在 `build-plan` 只形成 advisory 测试设计；`test-routing-advisor` 为每个 Phase 和最终完整测试预判 tier/skill；`build-code` 检查真实 changed files，必要时重判，再调用 `backend-testing`、`frontend-testing` 或 `fullstack-slice-testing`。这些都是事实记录，不是推进 gate。

- rejected：Matt `implement`、setup、deprecated、in-progress、personal skills。与现有 stage 编排重复或不稳定。
- absorbed：gstack review 证据可见性进入 `review`；state/data-flow 进入 `spec-plan`；Ship release discipline 进入 verify-code。
- watch：gstack Canary。等待独立 deploy-observe workflow。

## 更新流程

1. 从 `catalog.yaml` 读取固定 project commit 和 skill path。
2. 拉取上游新 commit，比较对应 skill 目录，不比较整个框架生成物。
3. 逐条判断 adopted/adapted/absorbed/rejected/watch；不得因“上游更新”自动覆盖本地合同。
4. 更新 `local_changes`、`dependency_closure`、`last_reviewed_at` 和固定 commit。
5. 同步 `THIRD_PARTY_NOTICES.md` 与局部 LICENSE。
6. 跑 skill closure、bundle、stage prompt 和五阶段 smoke；再走 `wh-review` 异源审查。

只引用外源的方法不加入本地 dependency_closure；许可/操作授权按单项核验后才允许资源导入。当前C01只更新登记与适用consumer，执行本Phase字面target及受影响UI contract，不因上述历史全套smoke描述跑全量回归；实际原件和正式审查沿既有owner，失败/unknown不改为采用效果。
