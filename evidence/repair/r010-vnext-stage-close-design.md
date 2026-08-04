# vNext stage 与正式 close 修复方案

## 结论

`vNext` 是本次治理方案明确引入的单写入模型，不是要恢复旧 `accepted.json`、`results/*` 或旧 attempt writer。当前阻塞有两个不同根因：

1. 真实 task 的当前 task store 没有通过官方 public stage 路径发布的 `quality/facts`，所以 `status` 如实显示六类 verify 事实全部 `missing`。现有“贯通”测试直接调用内部 `runStage` 并使用 fixture，不能证明用户从 public CLI 能完成五阶段。
2. 正式 delivery close 从 vNext quality fact 读取测试事实时丢弃了测试 receipt 中的 `snapshot_commit`，但后续 close 又强制要求它，因此即使 verify fact 已通过，close 也会在匹配 task snapshot commit 处失败。

## 最小修复

### A. 把 public stage 链路变成可回归验证的唯一入口

新增一个临时隔离 task fixture 的 public CLI 集成测试，按 `make-decision → build-spec → build-plan → build-code → verify-code` 调用 `stageRuntimeCliMain`/公开 `stage-runtime.mjs` 路由，并用官方 receipt/evidence writer 生成输入。测试必须证明：

- 每个阶段只读上一阶段正式 publication；输入缺失时返回明确的 `MATERIAL_INCOMPLETE`，不创建误导性的 active run 或旧 lineage；
- 输入完整时写入当前 `quality/facts/*`，所有必需 fact 通过后才写入 `publications/<stage>/*`；
- `status` 能读取这些当前 facts；
- 全链路不创建 `accepted.json`、`results/*` 或旧 attempt writer 记录。

不增加兼容桥、不把本地 `evidence/final` 自动升级为当前 task fact，也不把 provider unavailable 伪装成 pass。

### B. 修正正式 close 的 snapshot commit 取值

不修改 `quality-fact.v1` schema，不复制一个容易漂移的 `snapshot_commit` 字段。`currentVerifyFacts()` 在读取 `full_tests_fresh` fact 时：

1. 校验 fact 的 test evidence ref/hash；
2. 读取该 evidence 对应的 canonical test receipt；
3. 校验 receipt 的 task/stage、receipt hash、`snapshot_tree === fact.snapshot_tree`，并确认 `snapshot_commit` 的 tree 等于该 tree、parent 等于 `snapshot_head`；
4. 将认证后的 `snapshot_commit` 暴露给既有 close freshness/match 检查；缺失或不合法时明确报 `verify-code test receipt snapshot_commit is unavailable`。

这样 close 继续以 test receipt 的真实快照 commit 为唯一依据，避免新增第二个事实源。

### C. 把材料缺失变成可行动错误

`receipt()` 对“输入没有必需 receipt ref”和“canonical record 不存在”统一转换为包含 stage、receipt 名和 canonical namespace/ref 的 `MATERIAL_INCOMPLETE` 错误；保留 fail-loud，不重试、不回退、不创建旧记录。

### D. 修正 public status 的 freshness 认证输入

`status` 读取 quality fact 时必须把 canonical fact 的 `ref` 和原始字节 `sha256` 一起传给 freshness evaluator。只传 JSON value 会让 freshness 无法读取 fact 本身（缺 ref），或把 fact 判成 stale（缺 sha256），从而出现“明明已发布却全 missing”。该修复只补齐已存在的认证输入，不改变 status 判定规则。

### E. 让 confirm 与 status 使用同一条 vNext 事实链

公共 `confirm:decision` 不能只写 `evidence/confirmations/*`，否则用户完成确认后，`status` 仍会显示 `human_confirmation` 缺失。确认写入成功后立即按同一材料 revision/snapshot 发布一个 `kind=confirmation` 的 `quality/facts/*`；接受映射为 `passed`，拒绝映射为 `failed`。质量事实只引用刚写入的 canonical confirmation，重复写入保持幂等。make-decision 的 audit 仍是披露性材料，不重新变成推进许可证。

### F. 保留最小的风险暂停/明确接受路径

`review:risk` 与 `authorize:risk` 是技能明确要求的人工处置路径，不能保留 CLI 壳却让 kernel 永远抛 retired。vNext 只保留两步：从当前同快照正式 review result 派生严重 finding card；人工提交绑定该 card、原 review、snapshot 和 reply 的 `risk-acceptance.v1`。run 输入显式携带该接受记录后，review quality fact 保留原始 `revise_required` verdict，同时以 `resolution_verified` 和风险接受 evidence 说明“用户承担了该具体风险”；不改写 review verdict、不绕过结构性校验、不恢复旧 review-flow。

## 回归与验收

先加入红灯回归：formal vNext close fixture 构造通过的 verify facts 和 test receipt，调用 `prepareDeliveryClosePlan`，在修复前必须因 `currentVerifyFacts()` 丢失 `snapshot_commit` 失败；同时覆盖 receipt tree/commit 错配和缺失 receipt ref。再实现 B/C/D 使其变绿。随后加入 A 的真实 public CLI 五阶段测试，并运行：

- close snapshot commit 回归测试；
- public 五阶段集成测试；
- 相关 stage/quality/task-close 测试；
- 独立 review；
- 一次完整 verify-code（当前材料、当前 snapshot、独立 review、测试与人工确认分别记录）。

对已有阻塞 task，修复后的 remediation 不是补旧 `accepted.json`：用官方 public `run:execute` 逐阶段发布当前 vNext facts，重新执行缺失的 verify 输入/测试/审查/确认，最后再检查 `status:begin` 与 formal close preflight。历史 `evidence/final` 只能作为诊断材料，不能自动升级为当前 fact。

回归 fixture 必须显式满足 make-decision 的内容聚合、verify-code 的完整 AC ID 集合、build-code 的最终 integration review 以及 verify-code 的 independent review；audit 是公开披露材料而不是 stage 推进许可证。测试调用实际 `stage-runtime.mjs` 的 public `behavior/action` argv 路由，不只直接调用内部 `runStage`，并覆盖真实 public `confirm:decision`、拒绝确认和 risk pause/accept。状态测试还要断言失败时没有 legacy active-run、副作用或 `accepted/results` 记录；当前回归共覆盖 7 个 vNext E2E 场景。

## 非目标

- 不恢复或新增 `accepted.json`、`results/*`、legacy writer、旧 current pointer；
- 不修改原始 plan/tasks；
- 不为 provider 增加隐式 fallback 或无限重试；
- 不删除当前四份材料和 canonical fact/publication 结构；
- 不把“有测试输出”当成正式 accepted，Git delivery 与 WorkflowHub formal close 仍分开。
- 不把 `snapshot_commit` 复制进 `quality-fact.v1`；它只从已认证的 test receipt 读取。
