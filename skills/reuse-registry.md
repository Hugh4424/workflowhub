# Skill 复用与溯源登记

机器真相：[`catalog.yaml`](catalog.yaml)。本文件是人读投影。固定版本、完整 `upstream`、依赖闭包和更新策略以 catalog 为准；禁止用 `main/latest` 代替固定 commit。`unresolved-*-snapshot` 表示历史导入未保存 commit，更新前必须先补齐，不能假装已固定。

## 兼容索引

下表保留旧合同依赖的三列格式；不作为完整 provenance 真相。

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
| 3rd-review | 外部依赖 | skills/wh-review | 已由 wh-review V4 替代 |
| TDD 件（capture.mjs） | 外部改造适配 | obra/superpowers + mattpocock/skills | 内联 RED/GREEN 证据合同 |
| spec-specify | 外部改造适配 | github/spec-kit | 去宿主耦合 |
| spec-clarify | 外部改造适配 | github/spec-kit | 去宿主耦合 |
| spec-plan | 外部改造适配 | speckit-plan/SKILL.md + obra/superpowers | 唯一 plan 格式 |
| spec-tasks | 外部改造适配 | speckit-tasks/SKILL.md + obra/superpowers | phase 六段映射 |
| spec-analyze | 外部改造适配 | speckit-analyze/SKILL.md historical idea | 现为 native lens |
| spec-research | 自研 | none | workflowhub 原生 |
| talk-with-zhipeng | 外部改造适配 | AgentHub historical import | 现为 workflowhub native |
| grill-with-docs | 外部改造适配 | mattpocock/skills | 吸收 grilling/domain-modeling |
| intake-decision-review | 外部改造适配 | AgentHub historical import | 现为 workflowhub native |
| test-routing-advisor | 外部改造适配 | Hugh4424/AgentHub | 裁为纯路由 JSON |
| stage-step-receipts | 自研 | skills/stage-step-receipts/SKILL.md | P0 canonical receipt contract；审计任务保留 |
| audit-summary-carrier | 自研 | skills/audit-summary-carrier/SKILL.md | P0 bounded audit-summary contract；审计任务保留 |
| requirement-lineage | 自研 | skills/requirement-lineage/SKILL.md | P0 requirement evidence contract；审计任务保留 |

## 仓内运行技能

共同规则：所有路径都在 `skills/`；通过 stage 的 `skill-deps.yaml` 显式加载；不注册到 Claude/Codex 全局目录；闭包由各目录 `skill-bundle.json` 定义。

- `anysearch` — adopted；make-decision 条件检索。来源 [anysearch-ai/anysearch-skill@db3d76e](https://github.com/anysearch-ai/anysearch-skill/commit/db3d76e5597aec7261257be5322dd211c9d9bb87)，Apache-2.0。首次导入的核心文件已逐 blob 对上该 commit；仓内打包，不做全局安装。
- `decision-log` — native；make-decision。结构化唯一权威需求记录。`upstream=[]`；随 stage 合同更新。
- `grill-with-docs` — `skills/grill-with-docs/`；adapted；make-decision。来源 Matt Pocock [`grilling`](https://github.com/mattpocock/skills/tree/66898f60e8c744e269f8ce06c2b2b99ce7660d5f/skills/grilling) 与 [`domain-modeling`](https://github.com/mattpocock/skills/tree/66898f60e8c744e269f8ce06c2b2b99ce7660d5f/skills/domain-modeling)，MIT。保留完整交互、代码核实、CONTEXT/ADR 写入和四项退出合同；不使用 lite 或只读变体，真实阻塞才转人工。
- `intake-decision-review` — `skills/intake-decision-review/`；native；make-decision direction 纯盲审 lens。只读 wh-review 冻结材料，不问用户、不调用 provider；wh-review 是唯一 provider owner。`upstream=[]`；随 wh-review 合同更新。
- `simplicity-guard` — native；make-decision/detail、build-spec、build-plan、build-code 的 wh-review 只读 lens。四阶梯最小路径审查。`upstream=[]`；随宪法更新。
- `talk-with-zhipeng` — `skills/talk-with-zhipeng/`；native；make-decision。一次一问、动态重排、阈值收敛。`upstream=[]`。
- `spec-research` — native；build-plan。fail-loud、可明确跳过、证据可追踪。`upstream=[]`。
- `spec-specify` — adapted；build-spec。来源 [github/spec-kit@b7e67f5 specify](https://github.com/github/spec-kit/blob/b7e67f55bf7a937aaa57dbe0a8198774e285de3a/templates/commands/specify.md)，MIT。去 git/.specify 耦合，改为 task-id、内置模板和 metrics。
- `spec-clarify` — adapted；build-spec。来源 [github/spec-kit@b7e67f5 clarify](https://github.com/github/spec-kit/blob/b7e67f55bf7a937aaa57dbe0a8198774e285de3a/templates/commands/clarify.md)，MIT。保留十维扫描，去宿主耦合。
- `spec-plan` — adapted；build-plan。来源 [Spec Kit@b7e67f5](https://github.com/github/spec-kit/commit/b7e67f55bf7a937aaa57dbe0a8198774e285de3a) plan 与 Superpowers [`writing-plans`](https://github.com/obra/superpowers/tree/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/writing-plans)，MIT。保持 workflowhub 唯一 plan 格式。
- `spec-tasks` — adapted；build-plan。来源 [Spec Kit@b7e67f5](https://github.com/github/spec-kit/commit/b7e67f55bf7a937aaa57dbe0a8198774e285de3a) tasks 与 Superpowers `writing-plans`，MIT。补 Goal/Files/Tasks/Verify/Knowledge/STOP 映射。
- `spec-analyze` — native；build-plan。report-only 一致性 lens。`upstream=[]`；历史吸收 Spec Kit analyze 思路。
- `wh-review` — native；全部五阶段。唯一异源审查调度层。`upstream=[]`；禁止第二 review flow。
- `workflowhub-host-protocol` — standalone native draft；宿主适配层规则。未接入任何 Stage skill-deps，不参与 WorkflowHub 阶段门禁。
- `plan-ceo-review` — adapted；make-decision/build-spec。来源 gstack [`plan-ceo-review`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/plan-ceo-review)，MIT。裁为 report-only lens，去 runtime/gbrain/telemetry。
- `plan-design-review` — adapted；build-spec UI 条件。来源 gstack [`plan-design-review`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/plan-design-review)，MIT。去浏览器 daemon。
- `plan-eng-review` — adapted；build-plan。来源 gstack [`plan-eng-review`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/plan-eng-review)，MIT。裁为 report-only lens。
- `review` — adapted；make-decision/build-spec/build-plan。来源 gstack [`review`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/review)，MIT。只作为 wh-review lens。
- `qa-only` — adapted；verify-code。来源 gstack [`qa-only`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/qa-only)，MIT。去浏览器 daemon，只消费 sealed packet。
- `verify-change` — adapted；verify-code。来源 AgentHub [`verify-change`](https://github.com/Hugh4424/AgentHub/tree/258f5a2548fa8cc15325c6aa18dd107c1fc497b9/packages/core/agenthub/skills/verify-change)，MIT。裁为 lens；full/close 由 verify-code 承接。
- `test-strategy` — adapted；verify-code。来源 AgentHub 固定快照，MIT。适配 workflowhub AC-to-test-route 和 L2/L3 证据合同。
- `debate` — adopted；make-decision 条件增强。来源 [Hugh4424/debate@af121a1](https://github.com/Hugh4424/debate/blob/af121a1e24ae3af48f5e132d3de1342d16eccf31/SKILL.md)，MIT。仓内路径；失败记录 diagnostic 后继续。
- `diagnosing-bugs` — adapted；build-code。来源 Matt Pocock [`diagnosing-bugs`](https://github.com/mattpocock/skills/tree/66898f60e8c744e269f8ce06c2b2b99ce7660d5f/skills/diagnosing-bugs)、Superpowers [`systematic-debugging`](https://github.com/obra/superpowers/tree/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/systematic-debugging)、gstack [`investigate`](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063/investigate)，MIT。合并为结构化根因证据合同。
- `review-response` — adapted；build-code revise_required。来源 Superpowers [`receiving-code-review`](https://github.com/obra/superpowers/tree/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/receiving-code-review)，MIT。适配 wh-review continuation flow。
- `test-routing-advisor` — adapted；build-code。来源 [AgentHub 固定快照](https://github.com/Hugh4424/AgentHub/tree/258f5a2548fa8cc15325c6aa18dd107c1fc497b9/packages/core/agenthub/skills/test-routing-advisor)，MIT。删除跨仓执行器，输出三档 JSON。
- `isolated-browser-qa` — adopted；verify-code UI 条件。来源为用户明确提供并授权迁入的本机 skill snapshot，审查快照 hash `ccfcbefcde46da585f1d627218965c573575f8e4d8ecd59fec2b028e22a981ef`；尚无公开 canonical URL。搬完整资产、去绝对路径；有公开上游后补固定 URL/commit。

## 已吸收

- AgentHub `scope-triage` → make-decision S0.5 与 build-spec 高危词浮现。只保留内联分档语义，不保留独立 runtime skill。
- Superpowers `test-driven-development` + Matt `tdd` → `workflows/build-code/SKILL.md`、`capture.mjs`、`test-strategy`。只吸收 RED/GREEN、fresh evidence、anti-pattern；不复制重复 TDD 编排器。
- Superpowers `subagent-driven-development` → build-code phase executor、独立上下文、`PHASE_RESULT`。宿主 subagent 是 capability，不是 skill。
- Superpowers `requesting-code-review` → `wh-review` V4。sealed packet、provider receipt、continuation flow 已承接。
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
- rejected：AgentHub `testing-system-blueprint`、backend/frontend/full-chain 执行器。只保留纯路由 advisor。
- rejected：Superpowers `using-superpowers`。全局发现/bootstrap 与 repo-relative 按需加载冲突。
- rejected：gstack runtime。Bun、browser daemon、gbrain、telemetry、自动更新均不进入闭包；只人工吸收局部 review/QA 方法。
- absorbed：Matt `code-review` 双轴进入 `review`；`research` primary-source/citation 进入 `spec-research`；`to-tickets` 阻塞边/tracer bullet 进入 `spec-tasks`。
- watch：Matt `domain-modeling`、`codebase-design`、`prototype`。没有独立 stage 触发、消费点、验证合同前不进入运行闭包。
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
