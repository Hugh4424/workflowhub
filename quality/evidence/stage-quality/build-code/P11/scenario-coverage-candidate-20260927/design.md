# P7 逐场景验收覆盖：只读修复候选

状态：设计候选；**未改正式源码或材料，未运行测试**。本件不构成通过证据。

## 当前假绿

`runtime/stage/stage-handlers.mjs:1730` 的 `acceptanceCoverageForExecution` 先把所有 command/service 场景的证据扁平化，再只按 AC 编号汇总。一个 AC 声明两个必需场景时，场景 A 有一个 `passed` 结果、场景 B `unavailable` 且无证据，函数仍见到非空的 `passed` 列表，输出 `covered`。`runtime/stage/stage-runner.mjs:3352` 在部分覆盖恰好只有一个结果时，又把那个 `passed` 原件直接当整条 AC 的 `missing` 事实发布，独立读取会遇到状态错绑。浏览器没有 command/service 同形的 AC 结果，不能借同 AC 的命令结果替它完成。

## 最小准确契约

1. 从当前 `execution.items` 逐项取**必需场景**：`item.acceptance_criterion_ids.includes(acId)`。场景身份用其数组位置加 `source/sample/scenario/tier`，证据还要绑定当前 task、attempt、材料版本和代码快照。一个场景可含多个 AC；每个 AC 必须在**每个**必需场景中各有自己的结果。只数结果总量或只按 AC 编号汇总均不够。
2. 对每个 command/service 场景，只从该场景自己的 `evidence_refs` 找 `subject===acId` 的结果；核 ref/hash、`validateAcceptanceExecutionEvidence`、task/stage/material/tree、`subject_fact.execution_binding` 与本次执行绑定、`subject_fact.execution` 的四项场景身份，并拒绝同场景同 AC 重复结果或跨场景借用。场景整体 `failed` 可能只是**另一个 AC** 失败；当前 AC 的 `passed` 结果仍可算它在此场景通过。场景 `unavailable` 且无结果、缺结果、`missing`/`failed`/`unavailable`/`deferred` 结果都不算通过。
3. 只在必需场景非空、**每个场景**各有一个该 AC 的已认证 `passed` 结果，且没有必需 browser 场景待认证时，输出 `covered`。任一必需 browser 场景不得被 command/service 的结果替代；本轮先保持非 `covered`。browser 的同源 `ui_qa_projection` 在 `stage-runner.mjs:3199` 才产生，晚于 handler 的覆盖计算；若将来要让 browser 计入覆盖，必须把同源通过投影接回唯一覆盖写者，并验证 case/ref/hash/AC/attempt，而不能只看 `item.status=executed`。
4. 非 `covered` 行也保留**已认证的** command/service 结果 `evidence_refs`，同时写清缺哪个场景及原因，例如 `semantic_gap`；无原件的场景仍无 ref。这样报告可看见 A 实测通过，同时仍判整条 AC 未完成。`covered` 以外的状态可按真实原因选 `missing`、`unavailable`、`deferred` 或 `unknown`，但不得让它们变成 `passed`。现有 `validateAcceptanceCoverageShape` 是 caller 输入校验，禁止某些非 covered 行带 refs；本候选只改官方派生路径，不放宽 caller 输入。若后续对官方派生行复用该校验，应加仅供内部派生的精确规则，不能开放调用者伪造证据。
5. `stage-runner.mjs:3352` 的单个原件快捷路径只可用于 `item.status===covered && status===passed && actualLeaves.length===1 && actualLeaves[0].status===passed`；所有非 covered 行使用既有 `publishAcceptanceQualityFact` wrapper。wrapper 的 `subject_fact.evidence_refs` 保留已认证 A ref，`detail` 保留缺 B 的诊断，外层质量事实为 `missing`/`failed`，不可直接挂 A 的 `passed` 原件。`freshness.mjs` 的现有 wrapper 读取路径能校验嵌套 leaf 的当前绑定；若状态和 wrapper 不一致，必须拒绝。

建议实现形态（伪代码，避免把场景总数当结果数）：

```js
for (const acId of acceptedCriterionIds) {
  const required = execution.items.filter((item) => item.acceptance_criterion_ids?.includes(acId));
  const checked = required.map((item, scenarioIndex) => {
    if (item.tier === "browser") return { passed: false, reason: "browser requires same-source QA projection", refs: [] };
    const own = authenticateOwnLeaves(item, acId, execution.execution_binding, snapshotTree);
    return { passed: own.length === 1 && own[0].status === "passed",
      refs: own.map((leaf) => leaf.reference), reason: reasonFor(item, own), scenarioIndex };
  });
  const covered = required.length > 0 && checked.every((entry) => entry.passed);
  // refs = authenticated checked refs even when covered is false;
  // missing case names go into a nonpassing row's diagnostic.
}
```

## 必需负控与正例

| 场景 | 应见结果 |
| --- | --- |
| 同一 AC 的 A=command `passed`、B=service 不存在的模块 `unavailable` 且 `[]` | 该 AC 非 `covered`；正式 AC 事实非 `passed`；覆盖行与 wrapper 保留 A ref 和 B 缺失原因；独立 freshness 读回为 current |
| A=command `passed`、B=browser `unavailable` 或有 ref 但 QA 同源投影 `unknown` | 不能借 A 判 `covered`；browser ref 不冒充 command AC leaf |
| A 与 B 都有各自 `passed` AC leaf | `covered`；两份 ref 均保留 |
| 两份 `passed` leaf 全来自 A，B 无自己的 leaf，或把 A ref 填给 B | 非 `covered` 或拒绝绑定；不按 leaf 数量判全 |
| 同场景同时声明 AC1、AC2，AC1 leaf `passed`、AC2 leaf `failed`；AC1 在其他必需场景也通过 | AC1 可 `covered`，AC2 不可；不把整体场景 `failed` 一刀切到 AC1 |
| A `passed`，B 对本 AC `failed`/`missing`/`unavailable`/`deferred` | 非 `covered`，保留两者真实 refs 与原因；失败不得变绿 |
| 无任何场景声明某个 spec AC | `unknown`，不得凭其他 AC 结果覆盖 |
| 当前 task/attempt/material/tree 或场景四元身份不匹配 | 拒绝证据或保持非 `covered`；不得把旧结果借给当前场景 |

## 现有文件的精确写面

- `runtime/stage/stage-handlers.mjs`：只改 `acceptanceCoverageForExecution`，从扁平 AC 汇总改为场景 × AC 校验；保留已认证 refs 和缺场景诊断。可复用 `validateAcceptanceExecutionEvidence`，不要新增持久对象或公共命令。
- `runtime/stage/stage-runner.mjs`：只收紧 `publishAcceptanceQualityFact` 调用处的 `executionEvidence` 条件，让非 covered 始终走既有 wrapper，保 A ref 与缺 B 诊断。
- `tests/contract/acceptance-execution-tier.test.mjs`：在现有 `p9Fixture`/`p9Execute`/`p9PerAc` 夹具附近加 `acceptanceData` 覆盖选项，扩出两个不同身份、同一 AC 的 command/service 场景；在 `describe("P3 T009 real command and service acceptance")` 加上表中的真实 `runOfficialStage` 与正式事实、freshness 读回断言；在 P11 browser 区补 command+browser 不串证的夹具断言。第一条先 RED，改后 GREEN。只跑该文件中受影响定向测试与必要相邻测试，遵守项目禁全量回归规则。
- 本问题是 P7 的生产者映射遗留项；材料写面应由 P7 owner 更新 `phases/P7.md`、`phases/index.md` 后执行，勿在 P11 材料偷挂完成。

## 已核对的调用关系与边界

`projectPostPhaseAcceptanceExecutionData` 从唯一验收 Task 的 `acceptance_data` 生成每个场景的 `acceptance_criterion_ids`；`acceptanceExecutionFacts` 调用私有执行器并保留场景字段和 refs；`executeAcceptanceCommandOrService` 一场景可为多个 AC 分别发布 leaf；`acceptanceCoverageForExecution` 是唯一派生覆盖写者；`stage-runner` 另外发布每个 AC 的事实，`freshness.mjs` 再读。现有 P11 测试已证明两个 browser case 的独立调度和同源投影，但没有覆盖“两个必需场景仅一个有 AC leaf”的缺口。

不以这份候选或临时夹具宣称 P7/P11/整卡完成；真实页面、业务效果、独立审查和正式同版收据仍须分别核验。
