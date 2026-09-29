# P7 逐场景覆盖补丁候选

**仅供审查；正式源码、测试及材料没有应用本候选。测试尚未运行，不能称 RED 或 GREEN 已实测。** 设计依据：`quality/evidence/stage-quality/build-code/P11/scenario-coverage-candidate-20260927/design.md`；P7 材料与 `phases/index.md` 已由材料 owner 登记写面。

## 文件与顺序

1. `tests-first.patch`：只改 `tests/contract/acceptance-execution-tier.test.mjs`，补真实 `runOfficialStage` 场景：A command 有已认证 `passed` leaf，B service 无模块/无 ref；A command + B browser 受阻；双场景各自通过；单场景多 AC 中 sibling 失败不污染通过的 AC。前两项按当前实现应 RED，这是**预测**，尚无 runner 原件。
2. `implementation-followup.patch`：只改 `runtime/stage/stage-handlers.mjs#acceptanceCoverageForExecution` 与 `runtime/stage/stage-runner.mjs` 的单 leaf 发布条件。每个必需场景按自身 `source/sample/scenario/tier`、AC、task/attempt/material/tree 读自己的 leaf；场景缺 ref 或 browser 无同源 AC 证明不能覆盖；非 covered 行仍保留已认证 ref 与缺场景说明；非 covered 始终走既有 stage-quality wrapper，避免单个 `passed` leaf 被当成整条 `missing` 事实。
3. `original/`、`after-tests/`、`after-impl/`：三个时间点的**候选副本**，只用于逐字比较，不是当前正式源码。

## 静态检查

- `git apply --check tests-first.patch`：exit 0，针对当前工作树。
- 从 `after-tests/` 执行 `git apply --check ../implementation-followup.patch`：exit 0。
- 对 `after-impl` 的两个生产 `.mjs` 和测试 `.mjs` 逐个执行 `node --check`：exit 0。
- 未运行 Vitest、未执行官方 stage、未做独立审查，不能凭静态检查断言补丁正确。

当前正式源文件 SHA-256：`stage-handlers.mjs=d3449bb5a66960fdc84f0555051f5d821abb1804c9bfefd311c26366626b6e40`；`stage-runner.mjs=9ee916e5692042df9535a1f278efce14a84ddf2dd61c87f9dadef5362337cc84`；`acceptance-execution-tier.test.mjs=ab2280b53d52bd9a798a1743d345112a96a8951b9018d7e3bce0e8fb27b57b01`。如正式文件变化，须重新比对，不可盲用补丁。

## 待实测风险

- 补丁只堵住 browser 场景借用 command leaf 的假绿。真正让 browser AC 被覆盖，仍需将 `stage-runner` 产生的同源 `ui_qa_projection` 接回唯一覆盖写者，核 case/ref/hash/AC/attempt；不能直接看 browser `executed`。
- 官方派生 coverage 的非 covered 行会保留 refs；caller 输入的 `validateAcceptanceCoverageShape` 目前禁止此形态，本候选没有放宽 caller。若新的内部消费者复用该输入校验，须单独定义仅官方派生行可保已认证 refs 的窄规则。
- 实施时按 `tests-first.patch` 跑目标 RED，保存原始输出/exit 与身份；再用 `implementation-followup.patch` 跑同范围 GREEN、相邻护栏和独立审查。真实业务页面和整卡完成仍需另证。
