---
name: verify-code
description: 对当前实现做一次高质量代码审查，检查真实消费者、生命周期、安全、失败边界和测试强度。
version: 5.1.0
---

# Verify Code：代码审查

## 职责

verify-code 只审查代码，不做材料审计、AC 覆盖审计或证据树审计。

它检查当前实现是否有会影响交付的代码问题：

- 真实入口、真实 consumer 和接口两端是否一致；
- 状态机、生命周期、并发、取消、资源释放和错误传播是否正确；
- 权限、安全边界、数据泄漏和失败恢复是否可靠；
- 是否新增了重复控制面、无 consumer 的抽象或不必要的兼容分支；
- 测试是否走真实入口、关键分支、外部状态和失败边界，而不是只让 mock 或绿色命令通过。

`decision-log.md`、`spec.md`、`plan.md`、`tasks.md`由上游 stage 负责形成和收尾。verify-code 可以把它们作为背景理解代码意图，但不重新检查其完整性，不补写它们，不要求 AC、测试 receipt、verification receipt、requirement replay、finding-disposition receipt 或 human confirmation。

材料问题应在发现它的 stage 由 `spec-analyze` 和该 stage 自己修复；verify-code 发现材料疑点时只报告“上游材料风险”，不把它变成最后阶段的代码门禁。

verify-code 不在 verify-code
中改写材料，`tasks.md` 任务卡既有 `执行状态填写区` 除外。`spec.md` → build-spec；`plan.md`/`tasks.md` → build-plan。

## 审查依赖

直接使用 `skill-deps.yaml` 声明的两个依赖：

1. `dsh-code-review`：一次代码审查调用，内部包含 correctness、lifecycle、security、consumer fit、简化、变更文档和 prose 检查；
2. `wh-review`：按受信配置发起一次异源 findings 审查，保留真实 provider、model、session、transport status、findings、error 和 provenance。

provider 只能返回 `findings`。一次审查结束后不为得到空 findings、provider pass 或补齐证据再次调用；unavailable 如实记录，不改写为空 findings。

review 结果只是质量事实，不是继续工作的许可证。缺质量事实只限制完成声明，不限制继续验收和修复；发现代码 finding 就回同一 task 修复，不新建任务。

## 固定流程：最多四个动作

1. **架构师代码审查一次**：读取当前 diff、真实入口、consumer、关键实现和相关测试，输出代码问题、锚点、影响、根因和最小修复建议。不列 AC 逐条结论，不列材料缺口。
2. **主 Agent 修复一次**：只修复影响当前代码交付的有效 finding；每个 finding 记录 `fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human`。
3. **异源代码审查一次**：只审查当前实现和未决代码风险，一次 broker 请求；不审查 receipt、AC coverage、task completion、历史 lineage 或材料完整性。
4. **主 Agent 收尾一次**：处理这一次异源 findings，跑必要的受影响检查或真实入口 smoke；不再开启第三轮 review，不为了 verify-code 重跑全量测试。

## 范围边界

build-spec、build-plan、build-code 各自负责自己的材料、计划、任务、阶段测试和阶段收尾。verify-code 不替它们兜底，也不把“最后发现”改写成 verify 的责任。

build-code 已有的测试事实可以作为代码审查输入，但 verify-code 不重新认证测试 receipt、不检查测试 freshness、不比较 AC evidence 集合、不解析 `quality/verify.json`，也不要求最终 aggregate 才能开始审查。

发现真实代码 finding 就在同一 task 修复。发现上游材料问题就保留风险并交回对应 owner；不创建 successor、recovery、rebind 或 continuation task。

## 结论

- `passed`：当前代码 review 已完成，没有未处置的 actionable serious code finding；这不是“所有材料和证据都齐了”。
- `incomplete`：代码 review unavailable，或仍有 actionable serious code finding；真实原因必须保留。
- `failed`：代码本身有明确失败，回同一 task 修复。

`incomplete` 只限制质量声明，不限制同一 task 继续修复。宿主推进使用 `work_status`/`continuation_allowed`，不能把 `status=in_progress` 或 `quality_status=incomplete` 当作工作冻结。

## 阶段末交接

用大白话说明：检查了哪些代码入口和 consumer、修了哪些代码问题、异源 review 有哪些 findings、每条 finding 如何处置、必要检查的真实结果、剩余代码风险和上游材料风险。

不要求用户重复 Talk/Grill，不要求用户补交 verify-code 证据，不把交接确认当作代码 review 的证据门禁；确认仍不授权 commit、push、merge、archive 或 cleanup。
