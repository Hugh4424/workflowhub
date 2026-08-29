# 当前决策日志：事实组 2 主流程去 Gate

## 当前决定

1. build-code 与 verify-code 的主流程输入是当前可读的 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。
2. 直接修改其中任一文件即更新当前工作，不新建 continuation、reset、rebind 或修复任务。
3. accepted、receipt、review、provider、audit、checkpoint、确认、风险接受、历史快照和 generation 不得成为 build-code/verify-code 的进入或继续许可证；阶段自身的正常确认、不可逆授权、serious finding 处理和完成判据仍按原合同生效。
4. 四份当前文件任一缺失或不可读时，不得进入或继续 build-code/verify-code，并须指出具体文件；正确 task/worktree、实际执行安全和阶段完成真实性仍各自 fail-loud。
5. 审计或正式旧链不可用时记录 `unavailable`，业务工作可在同一任务继续；不得以 `live_plan_execution`、automatic accepted 或 fallback 伪造审计成功、实施完成或验证通过。

## 原始决策继续有效

`receipts/decision-log/55ab7dea22fa00c0222ee1a2d9d9dab7e9829c24caa7fecf92b1640aebec7a32.md`
不是被替代的历史附件，而是当前任务的权威原始需求。以下决定继续有效：

- **MD-D1**：reset 只追加 lineage，不重置 pass，不改写旧 head、verdict、provider 或 accepted 记录。
- **MD-D2**：只有未 accepted 阶段发生真实结构变化，且快照差异、完整 ledger、旧 head/event 绑定均可验证时才可 reset。
- **MD-D3**：新 generation 由认证 reset ref 派生并从 initial 开始；同一 generation 最多一次结构 full review。
- **MD-D4**：不增加日常人工确认；正常确认、不可逆授权、完成判据和 serious finding 的 repair-or-risk 边界继续有效。
- **MD-D5**：provider 只由可信配置选择；caller 不得指定 provider，reset 不持久绑定 runner。
- **MD-NG1**：不做同快照重复重审。
- **MD-NG2**：不覆盖或删除旧记录。
- **MD-NG3**：不合并 make-decision direction/detail 双 track。
- **MD-NG4**：不使用 reset 绕过 accepted stage 的下游失效设计。

本轮只撤销一种错误解释：不得把上述 decision、accepted、receipt、review、audit、checkpoint
当成 build-code/verify-code 的**进入或继续许可证**。这不撤销结构真实性、阶段完成判据、正常确认、
provider 可信边界、append-only lineage 或 serious finding 的真实处理要求。

## 当前修订的权威关系

当前 `decision-log.md` 与原 receipt 共同构成需求来源：

1. 原 receipt 的 MD-D1..D5、MD-NG1..NG4 保持当前权威。
2. 本文件“当前决定”只增加四材料推进资格和审计非准入 gate。
3. `spec.md` 定义完成判据；缺实际核心交付、相关测试、逐 AC 结果、独立 review/真实 unavailable 或交接时，不得宣称完成。
