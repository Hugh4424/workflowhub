# ADR-0026: 按语义签名聚合等价 stage outcome attempts

## 状态

Accepted for the vNext stage-status projection.

## 背景

同一个 authenticated task/stage 可能因为重试产生多个 immutable stage-outcome
记录。`attempt_id`、producer、时间、成本和 evidence ref 描述一次执行，不足以
判断两次执行的结果是否语义一致。若把这些字段直接用于完成判定，等价的
`completed` retry 会被错误地判为冲突；若挑一个 winner，又会把真实语义冲突
静默掉。

## 决策

`deriveExecutionOutcomes` 只在当前 task、stage、run、snapshot 和 material scope
内读取已经认证的 outcome，并按以下字段形成 semantic signature：

- stage identity and run binding;
- material/snapshot binding;
- manifest hashes;
- public execution status;
- normalized step outcomes and skill outcomes.

attempt identity、producer/session、timing、成本、摘要和 evidence refs 不进入
signature。所有当前 `completed` records 的 signature 相同则投影为
`execution_outcome.status=completed`；不同 signature 投影为 public `failed`，并
保留 `execution_outcome_ambiguous` diagnostic。相同 attempt id 绑定不同 immutable
bytes 投影为 `execution_replay_conflict`，同样为 public `failed`。

这个投影只用于独立的 execution disclosure。它不写入质量谓词、不生成
`missing`、不选择 winner，也不替代 current quality evidence。没有 current
authenticated outcome 时保持 `unavailable`。

## 后果

- 等价重试不会制造假的 stage-outcome 缺失或冲突。
- 真正的语义矛盾和 replay corruption 会 fail-loud，且不会被完成谓词隐藏。
- status consumers 必须显式读取 `execution_outcome`；不能把它重新当作 quality
  completion gate。
- 旧 outcome 仍只读保留；本决策不引入 selector、latest projection 或新的
  persistence control plane。

