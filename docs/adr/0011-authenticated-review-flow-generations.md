# ADR 0011：认证的 review-flow generation

- 状态：Accepted
- 日期：2026-07-29
- 决定来源：`review-flow-reset` accepted spec、plan 与 tasks 的 T007/T008

## 背景

正式审查结果是质量事实，不是阶段通过许可证。已有 flow 必须保持 append-only；但设计或验证材料发生真实结构变化后，继续把新审查塞进旧链会混淆快照、head、预算和 provider 调用。

同时，runner、run id、审计元数据变化不应触发重复 provider 调用；policy 或核心材料变化也不得复用旧结果。

## 决定

1. review producer 是 provider verdict 和聚合结果的唯一语义来源。consumer 只认证 canonical result、hash、subject 和 flow head，不重裁 provider 输出。
2. 相同 subject、材料、review chain 和 policy fingerprint 复用已有结果。run、runner、审计等运行元数据不参与复用身份。
3. policy fingerprint 同时进入本地锁、canonical attempt 复用判断和 managed request id；policy 变化产生新请求身份。
4. 只有未 accepted 的 `build-spec`、`build-plan`、`verify-code` 可创建新 generation。创建条件必须同时满足：
   - 当前 Workspace 快照与旧结果快照不同；
   - 当前 flow head 是旧 semantic result；
   - 当前 flow event 是绑定该 head 的 verified structural resolution；
   - classification 由旧/新冻结材料机器派生，且至少一个结构维度变化。
5. reset 记录只追加到 `reviews/flow-resets/`。旧 result、event 和 flow identity 原字节不变；新 `workflow_run_id` 由 base identity 与 reset hash 派生。
6. structural resolution 写入后由 TaskKernel 自动创建 reset。controller 不在旧 generation 内直接发起 full review；下一次正式调用读取新 identity，并从 initial round 开始。
7. caller 不能指定 provider、generation id 或 attempt number。旧 generation 在 reset 后拒绝任何新写入。
8. accepted stage 不允许 reset。结构或身份错绑 fail-loud；provider unavailable、support missing 和普通建议不制造 reset，也不制造 pass。

## 取舍

- generation 复用现有 review-flow authority，不增加第二套状态机或阶段 gate。
- reset 只用于真实结构变化，不用于追逐 `pass`，也不用于同快照重复审查。
- policy 变化允许新 provider 调用；运行环境变化保持零调用复用。

## 后果

- 旧链可审计、不可改写，新链有明确的认证来源。
- 每代沿用既有“一次 structural full”预算；reset 不回填或重算旧代计数。
- 发现 reset、resolution 或旧 head 任一绑定损坏时，读取和写入都明确失败。
- 该机制不改变 provider route、direction/detail 双 track 或人工确认规则。
