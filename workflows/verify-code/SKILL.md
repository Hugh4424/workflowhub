---
name: verify-code
description: 对当前实现做一次高质量代码审查，检查真实消费者、生命周期、安全、失败边界和测试强度。
version: 5.2.0
---

# Verify Code：代码审查

## 统一回退协议

五个正式 stage 共用 `runtime/stage/stage-content-contracts.mjs` 的
`validateFallbackProtocol`。实现级问题留在当前 stage 修复；规格歧义回
`build-spec`；方向级问题回 `make-decision` 做增量决策；材料缺口回对应
owner；环境不可用只记录 attempt。错配只让正式完成事实保持 `incomplete`，保留同 task 修复，禁止整阶段重跑；不新增 stage、public command、store 或 gate。

## 阶段末遗漏披露

阶段结束的大白话总结必须逐项列出本阶段所有未完成、失败、跳过、不适用、`unknown`、`unavailable` 或 `incomplete` 的 step 和 skill，并写真实原因与证据引用；没有遗漏就明确写“无遗漏”。执行事实通过正式 `run` 输入提交，不依赖宿主会话绑定、隐式选 task 或等待时限。

## 阶段末复盘（必须执行）

阶段结束时，当前主会话按 `stage-reflection` 产出 `stage-reflection.v2` judgment JSON，经现有 `run --action=reflect` 或 runner 的 `on_stage_end` 调度提交。`judgments[].evidence_refs` 必须显式引用本阶段唯一真实 `quality/evidence/stage-outcomes/<stage>/<sha256>.json`；writer 重读并完整认证来源，核对 `identity` 的 task、worktree、branch、attempt、material_revision 和 snapshot_tree，run/executor 来自认证 outcome。缺来源、executor 或 judgment 保持 `unavailable`，保留实际错误，不借用旧复盘。

JSON 保留六个结构化区块：`what_helped`、`what_to_improve`、`blockers`、`intervention_reasons`、`what_to_simplify`、`simplifiable_now`，以及 `status_matrix`、`source_completeness`。条目写真实证据与 confidence；无发现写 `none_observed`，未知写 `unknown` 和原因，不适用写 `not_applicable` 和原因。

消费实际返回的 `quality/stage-reflection/<stage>/<semantic-key>.json` 与原始 bytes 的 `sha256`；key 与 bytes hash 含义不同。同来源同判断重试复用首次 ref、时间和 bytes，来源或判断变化产生新原件；旧 `<stage>.json` 只作显式历史读取。复盘异常、lesson 合并失败和原 stage 错误分别保留，不覆盖原件，也不改变原 stage 失败。

`validate-stage-reflection.mjs` 内部验证消费边：较早 output 与较晚 input 的同一引用才形成 edge；来源不完整保持 partial/unknown。`remove_candidate` 仍须既有完整零消费证明和人工介入条件，否则降为 `needs_evidence`。

## 职责

verify-code 审查当前实现，并在同一次常规独审中复核本次逐项验收结果、执行原件和冻结材料。上游材料的撰写与修订仍由原 stage 负责。

当前 task 的以下四份材料存在且可读，就直接开始或继续验收：
`decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。旧事实只作背景，不是
工作许可证，也不能冻结同 task 修复。

它检查当前实现是否有会影响交付的代码问题：

- 真实入口、真实 consumer 和接口两端是否一致；
- 状态机、生命周期、并发、取消、资源释放和错误传播是否正确；
- 权限、安全边界、数据泄漏和失败恢复是否可靠；
- 是否新增了重复控制面、无 consumer 的抽象或不必要的兼容分支；
- 测试是否走真实入口、关键分支、外部状态和失败边界，而不是只让 mock 或绿色命令通过。

四份当前材料由上游 stage 撰写；本阶段读取当前内容以核对实现意图及验收输入，不重演 Talk/Grill 或上游材料生成。完成声明必须对应真实当前执行、逐项结果和审查绑定；缺失或错绑事实保持 incomplete，只有疑点才复跑受影响检查。

材料问题应在发现它的 stage 由 `spec-analyze` 和该 stage 自己修复；verify-code 发现材料疑点时只报告“上游材料风险”，不把它变成最后阶段的代码门禁。

verify-code 不在 verify-code
中改写材料，`tasks.md` 任务卡既有 `执行状态填写区` 除外。`spec.md` → build-spec；`plan.md`/`tasks.md` → build-plan。

## Conditional UI consumer alignment

For `ui_applicability=ui`, consume the existing
`frontend-component-quality` Component Quality Map and the UI Contract through
the real entrypoint. Check each real consumer, state owner, typed ViewModel,
CSS/token owner, `story_or_test_update`, compatibility boundary, and the browser/state facts that were
actually produced. A missing design source, consumer, browser, fixture,
viewport, or screenshot is reported as `unknown`, `unavailable`, or `N/A +
reason`; it is not silently treated as visual completion and is not a gate.

`design-alignment.mjs` is the sole projection for this check. A design gap may
return an `unknown` alignment with a recoverable handoff and
`continuation_allowed=true`; verify-code does not create a UI stage, fifth
material, review controller, or public command. Non-UI tasks retain the
existing code-review path and record UI facts as not applicable.

The alignment projection also checks the current `Design.md` and `Experience.md`
source identities and any explicitly supplied `consumer-census.v1`, bound to
the current implementation snapshot, against the real changed-file consumers.
The caller must supply the actual scanner facts; the census validator does not
perform a scan. Missing facts remain `unknown`/`missing` with the actual owner
and evidence gap, and never imply zero consumers or completed alignment.
A stale hash, missing explicit anchor, missing consumer, or
unsupported CSS/data route is reported with its unknown reason and evidence;
verify-code does not rewrite either project standard or invent a browser pass.

## 审查依赖

直接使用 `skill-deps.yaml` 声明的两个依赖：

1. `dsh-code-review`：一次代码审查调用，内部包含 correctness、lifecycle、security、consumer fit、简化、变更文档和 prose 检查；
2. `wh-review`：按受信配置发起一次异源 findings 审查，保留真实 provider、model、session、transport status、findings、error 和 provenance。

provider 只能返回 `findings`。一次审查结束后不为得到空 findings、provider pass 或补齐证据再次调用；unavailable 如实记录，不能算 `pass`，不改写为空 findings。如果 findings 在同一 task 已逐条修复，保留原 review 的快照身份，并把当前阶段结果记为 `resolved`；不把修复前的 review 改写成当前 `clean`，也不因为没有 `clean` 标签再开一轮审查。

review 结果只是质量事实，不是继续工作的许可证。缺质量事实只限制完成声明，不限制继续验收和修复；发现代码 finding 就回同一 task 修复，不新建任务。

## 固定流程：最多四个动作

1. **架构师代码审查一次**：读取当前 diff、真实入口、consumer、关键实现和相关测试，输出代码问题、锚点、影响、根因和最小修复建议。核对本次逐项 actual/oracle、执行原件和冻结材料；上游撰写问题交回 owner。
2. **主 Agent 修复一次**：只修复影响当前代码交付的有效 finding；每个 finding 记录 `fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human`。
3. **异源代码审查一次**：一次 broker 请求复核当前实现、未决风险、本次逐项执行原件及冻结材料；同次输出形成 E2E binding，不另派第二轮同类 E2E 审查。
4. **主 Agent 收尾一次**：处理这一次异源 findings，跑必要的受影响检查或真实入口 smoke；不再开启第三轮 review，不为了 verify-code 重跑全量测试。

通过现有公共 `review --action=record` 提交 `input.request`，其中 `stage=verify-code`、真实 host provider、当前 materials 和 `reviewed_execution={ref,sha256,quality_fact_ref}` 指向本次 build-code 的 `acceptance_execution` 聚合与实际质量事实。host 在派发前认证 actor、逐项原件、材料及 snapshot，将真实 bytes 放入同一 provider bundle；该次常规审查记录既有 E2E binding，不补绑旧结果。

`dsh-code-review` 的结果继续经 `receipts.quality_review` 绑定当前 code_review outcome；`wh-review` 的 advisory 结果经 `receipts.review` 消费，两者不互相冒充。验收确认沿已有 `confirm` 记录实际用户回复，在 review 之后通过 `receipts.confirmation` 交给 verify；不代答、不补造或重复请求同一确认。`readCurrentE2eAcceptanceEvidence` 核对同次 review、confirmation 和 nested freshness。缺 review、确认或执行原件时相应事实保持 missing/incomplete，不从代码审查结束推断验收或 release。

当前 WorkflowHub session 发布绑定当前 task、stage、材料和快照的代码审查结果。真实修复可为 resolved，原 review 仍保留其旧身份；未修复 finding 或 unavailable 限制完成声明，保留同 task 修复。commit、push、merge、archive、cleanup 和 close 仍由已有独立授权流程处理。

## 范围边界

build-spec、build-plan、build-code 各自负责自己的材料、计划、任务、阶段测试和阶段收尾。verify-code 不替它们兜底，也不把“最后发现”改写成 verify 的责任。

build-code 的执行与测试原件作为本次独立复核输入，由既有 runtime 认证当前身份和 freshness。逐项结果、缺失项和 coverage limits 均保留；只复跑有疑点的受影响部分，不为 verify 重跑完整上游流程。代码质量、功能验收、product release 和 physical close 分别报告。

发现真实代码 finding 就在同一 task 修复。发现上游材料问题就保留风险并交回对应 owner；不创建 successor、recovery、rebind 或 continuation task。

## 结论

- `passed`：当前代码 review 已完成，没有未处置的 actionable serious code finding；如果 finding 在同一 task 已修复，`resolved` 与无 finding 的 `clean` 具有同等完成含义；这不是“所有材料和证据都齐了”。
- `incomplete`：代码 review unavailable，或仍有未处置的 actionable serious code finding；真实原因必须保留。
- `failed`：代码本身有明确失败，回同一 task 修复。

`incomplete` 只限制质量声明，不限制同一 task 继续修复。宿主推进使用 `work_status`/`continuation_allowed`，不能把 `status=in_progress` 或 `quality_status=incomplete` 当作工作冻结。

## Preflight self-check

Before submission, optionally run `stage-runtime.mjs run --action=preflight --stage=verify-code --input=<payload.json>` as a local payload-shape self-check (not a quality gate), and fix any reported protocol errors first.

## 阶段末交接

用大白话说明：检查了哪些代码入口和 consumer、修了哪些代码问题、异源 review 有哪些 findings、每条 finding 如何处置、必要检查的真实结果、剩余代码风险和上游材料风险。审查绑定的旧快照只说明“当时看了什么”；修复、当前检查和阶段结果说明“现在交付什么”。

不要求用户重复 Talk/Grill，消费现有真实执行证据；用户确认仅沿上述既有验收确认语义，不重复确认代码审查结论。阶段交接只报告当前审查事实、质量状态和剩余风险；close 授权仍是独立动作。
对上游材料本身，本阶段只审查代码及其对当前实现的影响；不重新检查其完整性，也不列 AC 逐条结论。不要要求用户补交 verify-code 证据，不把交接确认当作代码 review 的证据门禁。
