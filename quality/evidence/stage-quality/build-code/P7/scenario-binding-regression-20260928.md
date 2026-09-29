# P7 单例失败：验收执行身份冲突（只读诊断）

## 现象

- 2026-09-27 的单文件定向运行执行 84 项，83 通过、1 失败；原始记录见 `scenario-coverage-implementation-20260927/after-full-file/`。失败用例是 `publishes the acceptance execution aggregate for the implementation/tests receipt branch`，错误为 `runtime acceptance evidence binding mismatch`（`runtime/stage/stage-handlers.mjs:1755`）。本次诊断没有再运行测试，也没有改生产源码、测试或任务材料。

## 真实来源与原因

- 该用例在 `tests/contract/acceptance-execution-tier.test.mjs:1469–1503` 同时提交 `implementation`、`tests` 和旧式 `stage_outcomes`。`p9Actor` 在同一测试文件 `:965–1006` 生成的旧记录本身经 `authenticateCurrentBuildCodeStageOutcome` 校验；它不是一个任意字符串。`p9Fixture` 默认 `record_model=vnext-single-write`，其余 P9 用例的 `p9Execute` 不提交旧记录。
- `runOfficialStage` 在 `runtime/stage/stage-runner.mjs:4722–4734` 因该字段进入历史兼容读取。`worker.runAcceptanceScenario` 又在 `:3860` 把读到的旧记录传入本次执行。`executePrivateAcceptance` 在 `:2789–2796` 因旧记录存在，把刚运行出来的每条命令/服务叶子标成 `{stage_outcome_ref, stage_outcome_hash}`，而不是本次会话身份。旧记录没有执行这条测试命令；它只是兼容输入。
- 汇总的身份由 `acceptanceExecutionFacts` 在 `runtime/stage/stage-handlers.mjs:1658–1675` 根据当前 Task、stage、attempt、run、tree、材料版本生成。P7 新覆盖检查在 `:1744–1755` 要求每条叶子的身份与该汇总完全相同。两种身份不相同，于是抛错。读到的叶子或其哈希并未被证明造假；这是生产者把可选历史记录误当成本次执行身份。
- 当前代码在 `runtime/stage/stage-runner.mjs:907–913, 4765–4780` 明写旧记录只作可选诊断，不应成为本次执行依据。`tests/contract/acceptance-execution-tier.test.mjs:1313–1331` 也要求正常命令叶子使用本次会话身份且没有旧记录字段。因此本次运行可信的身份应是**本次会话身份**。不能让新覆盖检查接受两种身份的任意一个；那会使错误的旧记录把本次叶子带过去。

## 最小修复建议

1. 在 `runtime/stage/stage-runner.mjs` 的当前 `runAcceptanceScenario` 闭包中，不再把 `authenticatedStageOutcome` 传给 `privateAcceptanceScenario`；或等价地删除 `executePrivateAcceptance` 的旧记录优先分支，让本次命令/服务叶子始终使用已验证的 `binding` 与 `ctx.workflowRunId` 构造身份。继续保留 `readOptionalStageOutcome` 的诊断、旧原件和只读认证；不要改动 `stage-handlers.mjs:1752–1755` 的严格比较。
2. 保留失败用例的三个 receipt，补充断言：汇总与两个 AC 叶子都有相同的本次 Task、attempt、run、tree、材料版本；叶子不含 `stage_outcome_ref/hash`；实际子命令有运行痕迹，叶子原文及 ref/hash 能读回。这样证明 receipt 分支可用，且旧记录没有决定新执行身份。不能只从测试删掉 `stage_outcomes` 来消除失败，那会漏掉这条生产路径。
3. 若确有历史记录回放读取需求，应继续交由既有只读 `freshness.mjs:495–551` 认证其原有绑定和生产者证明；不能把它混进当前会话新执行的叶子。该只读路径可接受经过完整验证的历史绑定，但当前新执行只接受本次会话绑定。

## 必须补的反例

- **错 Task**：给本 Task 的本次调用传另一 Task 的旧记录；诊断应指出不可用，本次叶子仍只绑本 Task、本次 attempt，另一 Task 的旧记录和叶子均不得使验收通过。先确认测试确实执行了本次命令，而非只断言返回状态。
- **旧 tree / 材料**：同 Task 旧快照记录或叶子，哪怕 ref/hash 自洽，也不能满足本次叶子的 tree/材料版本比较。与本次命令失败组合，确保旧记录无法把失败改成通过。
- **伪 ref/hash 或伪生产者**：`stage_outcomes` 指向不存在、重算哈希但伪造生产者、或 ref/hash 不一致时，旧记录只能留下不可用诊断，不能变成执行身份；本次失败命令仍失败。`readOptionalStageOutcome` 的诊断不应被静默改写成通过。
- **叶子跨场景/跨 AC**：保留 P7 已有严格的叶子哈希、`subject`、场景四字段和一场景一 AC 叶子的检查；将另一场景的真实叶子调包仍须失败。

## 边界

这是源代码读取后的修复建议，不是测试通过记录。实施后只跑受影响的单文件定向测试及必要的相邻绑定测试，由独立上下文审查；本诊断不能把 P7 标为完成。
