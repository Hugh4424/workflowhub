---
name: verify-code
description: 对当前实现做一次高质量代码审查，检查真实消费者、生命周期、安全、失败边界和测试强度。
version: 5.1.0
---

# Verify Code：代码审查

## 阶段末遗漏披露

阶段结束的大白话总结必须逐项列出本阶段所有未完成、失败、跳过、不适用、`unknown`、`unavailable` 或 `incomplete` 的 step 和 skill，并写真实原因与证据引用；没有遗漏就明确写“无遗漏”。执行事实通过正式 `run` 输入提交，不依赖宿主会话绑定、隐式选 task 或等待时限。

## 阶段末复盘（必须执行）

阶段结束时，当前主会话先按 `stage-reflection` 技能产出 judgment JSON，再调用实际的公共入口 `run --action=reflect`。JSON 必须包含六个结构化区块：`what_helped`、`what_to_improve`、`blockers`、`intervention_reasons`、`what_to_simplify`、`simplifiable_now`，分别回答帮助、改进、阻塞、人工介入原因、应简化和现在可简化之处。每个区块条目带真实 `evidence_refs` 与 `confidence`；没有观察到写 `none_observed`，无法判断写 `unknown` + `unknown_reason`，不适用写 `not_applicable` + 原因，不能静默空缺。

`validate-stage-reflection.mjs` 在验证时内部调用 `deriveConsumptionEdges`，不由技能单独调用消费边工具。只有较早 subject 的 `output_refs` 与较晚 subject 的 `input_refs` 含同一引用才形成边；stage outcome/output 不完整时 `coverage_status=partial`、消费保持 unknown、`zero_consumption_proof` 不可用。完整扫描和近 30 天零 consumer 证明还必须配合人工 rejected 或同一步骤两次介入，才能保留 `remove_candidate`；否则降为 `needs_evidence`。route 尚未实现时如实记录 unavailable/dependency，不发明替代命令。

## 职责

verify-code 只审查代码，不做材料审计、AC 覆盖审计或证据树审计。

当前 task 的以下四份材料存在且可读，就直接开始或继续验收：
`decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。旧事实只作背景，不是
工作许可证，也不能冻结同 task 修复。

它检查当前实现是否有会影响交付的代码问题：

- 真实入口、真实 consumer 和接口两端是否一致；
- 状态机、生命周期、并发、取消、资源释放和错误传播是否正确；
- 权限、安全边界、数据泄漏和失败恢复是否可靠；
- 是否新增了重复控制面、无 consumer 的抽象或不必要的兼容分支；
- 测试是否走真实入口、关键分支、外部状态和失败边界，而不是只让 mock 或绿色命令通过。

`decision-log.md`、`spec.md`、`plan.md`、`tasks.md`由上游 stage 负责形成和收尾。verify-code 可以把它们作为背景理解代码意图，但不重新检查其完整性，不补写它们，不要求 AC、测试 receipt、verification receipt、requirement replay 或 finding-disposition receipt。当前代码审查结束后仍必须取得一次绑定当前 task、stage、subject、材料身份和快照的真实用户确认；不能从 review、测试或授权推断同意。

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
No new stage or no gate is introduced by this alignment check.

The alignment projection also checks the current `Design.md` and `Experience.md`
source identities and the `consumer-census.v1` against the real changed-file
consumers. A stale hash, missing explicit anchor, missing consumer, or
unsupported CSS/data route is reported with its unknown reason and evidence;
verify-code does not rewrite either project standard or invent a browser pass.

## 审查依赖

直接使用 `skill-deps.yaml` 声明的两个依赖：

1. `dsh-code-review`：一次代码审查调用，内部包含 correctness、lifecycle、security、consumer fit、简化、变更文档和 prose 检查；
2. `wh-review`：按受信配置发起一次异源 findings 审查，保留真实 provider、model、session、transport status、findings、error 和 provenance。

provider 只能返回 `findings`。一次审查结束后不为得到空 findings、provider pass 或补齐证据再次调用；unavailable 如实记录，不能算 `pass`，不改写为空 findings。`unavailable` 绝不是 `pass`。如果 findings 在同一 task 已逐条修复，保留原 review 的快照身份，并把当前阶段结果记为 `resolved`；不把修复前的 review 改写成当前 `clean`，也不因为没有 `clean` 标签再开一轮审查。

review 结果只是质量事实，不是继续工作的许可证。缺质量事实只限制完成声明，不限制继续验收和修复；发现代码 finding 就回同一 task 修复，不新建任务。

## 固定流程：最多四个动作

1. **架构师代码审查一次**：读取当前 diff、真实入口、consumer、关键实现和相关测试，输出代码问题、锚点、影响、根因和最小修复建议。不列 AC 逐条结论，不列材料缺口。
2. **主 Agent 修复一次**：只修复影响当前代码交付的有效 finding；每个 finding 记录 `fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human`。
3. **异源代码审查一次**：只审查当前实现和未决代码风险，一次 broker 请求；不审查 receipt、AC coverage、task completion、历史 lineage 或材料完整性。
4. **主 Agent 收尾一次**：处理这一次异源 findings，跑必要的受影响检查或真实入口 smoke；不再开启第三轮 review，不为了 verify-code 重跑全量测试。

收尾后向用户说明当前代码审查结论，并通过现有 `confirm` 入口取得真实
verify-code 确认。确认只表达用户是否接受当前代码审查结果，不授权
commit、push、merge、archive、cleanup 或 close；拒绝、过期、错绑和缺失
确认保持阶段不完整，但允许同一 task 继续修复。

## 范围边界

build-spec、build-plan、build-code 各自负责自己的材料、计划、任务、阶段测试和阶段收尾。verify-code 不替它们兜底，也不把“最后发现”改写成 verify 的责任。

build-code 已有的测试事实可以作为代码审查输入，但 verify-code 不重新认证测试 receipt、不检查测试 freshness、不比较 AC evidence 集合、不解析 `quality/verify.json`，也不要求最终 aggregate 才能开始审查。四份当前材料只作背景，不是工作许可证；缺质量事实只限制完成声明，不限制继续验收和修复。

发现真实代码 finding 就在同一 task 修复。发现上游材料问题就保留风险并交回对应 owner；不创建 successor、recovery、rebind 或 continuation task。

## 结论

- `passed`：当前代码 review 已完成，没有未处置的 actionable serious code finding；如果 finding 在同一 task 已修复，`resolved` 与无 finding 的 `clean` 具有同等完成含义；这不是“所有材料和证据都齐了”。
- `incomplete`：代码 review unavailable，或仍有未处置的 actionable serious code finding；真实原因必须保留。
- `failed`：代码本身有明确失败，回同一 task 修复。

`incomplete` 只限制质量声明，不限制同一 task 继续修复。宿主推进使用 `work_status`/`continuation_allowed`，不能把 `status=in_progress` 或 `quality_status=incomplete` 当作工作冻结。

## Preflight self-check

Before submission, optionally run `stage-runtime.mjs run --action=preflight --stage=verify-code --input=<payload.json>` as a local payload-shape self-check (not a quality gate), and fix any reported protocol errors first.

## 阶段末交接

用大白话说明：检查了哪些代码入口和 consumer、修了哪些代码问题、异源 review 有哪些 findings、每条 finding 如何处置、必要检查的真实结果、剩余代码风险和上游材料风险。审查绑定的旧快照只说明“当时看了什么”；修复、当前检查和用户确认说明“现在交付什么”。

不要求用户重复 Talk/Grill，不要求用户补交 verify-code 证据；只要求用户对当前代码审查结论作一次真实确认。这个确认不是 close 授权，也不授权 commit、push、merge、archive 或 cleanup。
