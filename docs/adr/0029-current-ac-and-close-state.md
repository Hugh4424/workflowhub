# ADR-0029: 当前逐 AC 事实与三域收口状态

## 决定

C6 规定移除 active `quality/verify.json`、`runtime/schemas/quality-verify.v1.json` object graph
及 `runtime/evidence/quality-store.mjs#publishVerifySummary` writer。C6 proof 收口后的当前权威是
`facts.jsonl` 的 K2 当前阶段行；K5 原始证据只通过具名 ref 与 sha256 保留。身份/完整性
字段继续保留，但不再把 freshness/currentness 失效链作为 active 控制面。

状态读取由 `runtime/stage/current-close-projection.mjs` 提供只读投影，不持久化、不创建
第二状态机或索引。投影稳定并列三个互相独立的域：

- `work_progress`：当前工作是否还能继续；
- `stage_quality`：当前阶段质量事实；
- `physical_delivery`：close 计划、不可变步骤记录和现场读回派生的物理状态。

不再产生或消费 `product_release`、`status_groups`；状态根因和当前质量只读 K2 当前行及
K1–K6 具名 ref。`specs/archive/**`、`docs/research/**` 不可变保留。

物理域只允许 `not_started`、`incomplete`、`removed`、`not_applicable_recorded`、
`unavailable`、`unknown` 六种状态。没有 close 计划是 `not_started`；已有计划但动作未完或
失败是 `incomplete`；确定性工作区完成现场读回是 `removed`；既有工作区不删除并记录为
`not_applicable_recorded`；现场读取失败是 `unavailable`；身份不足是 `unknown`。一个公开
视图只表达一个物理状态，不用质量或发布结果替代物理事实。

close 仍由既有 `core/task-close.mjs` 写入：计划冻结质量/发布风险快照和待执行清单，步骤
记录保存实际成功或失败，完成结果只在所有物理项读回满足后写入，且同一计划只有一个有效
完成结果。确认先于逐动作授权；失败后沿用同一计划和原失败记录，现场探测后补足未完成动作，
不覆盖失败事实、不新增独立 correction/recovery 状态机；既有工作区永不删除。

## Owner / consumer

| seam | owner / writer | consumer |
| --- | --- | --- |
| current stage/AC authority | `facts.jsonl` K2 current row | status and stage-quality readers |
| K5 evidence | named ref + sha256 | review/reflection/evidence readback |
| three-domain projection | `deriveCurrentCloseProjection` (read-only) | status and close readers |
| physical close records | `core/task-close.mjs` | physical-delivery projection and audit readers |

## 不在本 ADR 中

本 ADR 不新增 public command、HTTP/API、quality store、current selector 或 release writer；
不修改 immutable archive/research bytes，不恢复旧索引/lineage/recovery 控制面，不把质量缺口
变成继续工作的许可证，也不证明真实远端 push、权限或 browser/UI 行为。

## 证据

- C6 Tier-C deletion proof：active writer/schema/object graph removal and immutable archive/research byte stability；
- `tests/contract/verify-authority-boundary.test.mjs`：K2/K5 identity-bound current status and旁路结果；
- `tests/contract/four-domain-close-status.test.mjs`：三域、六态、计划/步骤/完成结果分离；
- `tests/close/close-contract.test.mjs` 与 `tests/close/cleanup-resume-finalize.test.mjs`：确认、逐动作授权、读回和同计划恢复；
- `docs/architecture/control-plane-inventory.json`：投影与既有唯一 writer 的职责、消费者和删除条件登记。

## Supersedes

C6 supersede active `quality/verify.v1`、`product_release`、`status_groups` authority
及 ADR-0017 的 freshness selector 表述；ADR-0018、ADR-0020 的物理交付与质量分离、
既有工作区不删除和人工授权语义继续有效。
