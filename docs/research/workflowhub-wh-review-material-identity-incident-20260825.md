# 外部 `wh-review` `PROTOCOL_INCOMPATIBLE` 根因与修复记录

日期：2026-08-25  
范围：仅检查并修复 trusted worktree `/Users/Hugh/Hugh/Project/workflowhub-batch-governance-20260824`；原始 checkout 和外部 `3rd-review` checkout 未修改。

## 结论

旧的 `PROTOCOL_INCOMPATIBLE/unavailable` 不是 provider 没有意见，也不是空 findings。WorkflowHub 和当前实际路由到的 `3rd-review` 对同一批附件使用了两个不同的 `material_id` 算法：

- WorkflowHub 把 `canonical-evidence.json` 算进语义材料哈希。
- 当前外部 `3rd-review` 的公开 v3 实现把 `manifest.json` 和 `canonical-evidence.json` 都排除在语义材料哈希之外。

因此 provider 结果返回后，WorkflowHub 在校验 v3 group 的顶层 `material_id` 时就拒绝整个 group；成员结果还没进入正常 provenance/内容校验，所以旧 attempt 出现 `provider_called=true`、`provider_attempts=[]`、`0 valid reviewer result(s)`。

旧 attempt 的事实：

| attempt | 旧 WorkflowHub material_id | 终态 | 事实限制 |
| --- | --- | --- | --- |
| P0A | `29598795bb206485...119ddbd7` | `unavailable` | group 顶层身份不匹配 |
| P1 | `c95e615886c601a...19ccf187` | `unavailable` | group 顶层身份不匹配 |

这解释了为什么错误统一显示为 `PROTOCOL_INCOMPATIBLE`，以及为什么不能把它当作“provider 没有发现问题”。

## 修复

只改已有的材料身份计算，不增加 stage、gate、state、writer 或 evidence store：

1. `skills/wh-review/scripts/review-materials.mjs` 的语义 `materialId` 改为排除 `canonical-evidence.json`，与当前外部公开 v3 算法一致。
2. `canonical-evidence.json` 仍然写入并保留在交付 manifest 中，继续供审计使用；它没有被删除，也没有从审计证据中隐形消失。
3. 增加回归断言：阶段包必须仍交付 `canonical-evidence.json`，但语义 `materialId` 只能由去掉该审计索引后的 entries 计算。

这个边界把“provider 看到的语义材料身份”和“WorkflowHub 内部保留的审计索引”分开，仍由同一个现有 bundle writer 负责，没有引入第二套身份或 fallback hash。

## 验证

- 定向回归：
  `npx vitest run tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- 结果：3 个文件、124 tests passed、0 failed。
- 跨端算法对照：用同一组含 `canonical-evidence.json`、`manifest.json` 和语义文件的 entries，同时调用 WorkflowHub 和当前外部 `3rd-review` public helper；修复后的两端 hash 相同，旧的“把证据索引算入” hash 不同。
- 标准 TaskHandle 测试 receipt：`quality/tests/wh-review-material-identity-fix.json`，`exit_code=0`，`receipt_hash=07b3faee5f3718e77426dcc3753ce807222e27638a5191d99a84b08002092e8e`。
- 修复后的外部 `wh-review` 已用新的 material identity 发起一次真实 build-code/P1 审查；provider 进程实际启动，但约 15 分钟仍没有公开终态，随后由本任务停止自己的等待进程。没有把这个观察伪装成 pass、空 findings 或产品验收。

## 仍未解决的外部依赖

当前外部 `3rd-review` checkout 有大量用户未提交修改；其中 `lib/attachments.mjs` 的排除规则正是本修复要对齐的公开算法，但它不是稳定 commit。若外部路由回到只排除 `manifest.json` 的旧版本，身份冲突会复发。这个外部 checkout 不属于本 trusted worktree，本任务没有擅自修改、reset、clean 或提交它。

另外，当前公开调用链没有给 provider 设置 WorkflowHub 自己的 wall-clock deadline，依赖 broker 的 liveness 终止；本次修复后实际观察到 provider 长时间无公开终态。它与已定位的 material identity 冲突是两个独立问题，不能混写成一个协议结论。需要另一个明确授权的 `3rd-review`/路由治理任务，才能决定统一算法的稳定发布和 provider 超时语义。

## 推进边界

本记录只证明“旧身份冲突已定位并在 WorkflowHub 侧修正”，不证明外部审查已经 available，也不证明产品验收、release 或全量测试绿色。在外部审查没有真实终态前，不继续把这次 build-code 结果写成审查通过。
