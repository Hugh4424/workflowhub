# ADR-0029: 当前逐 AC 事实与四域收口状态

## 决定

S7 保留 main 已建立的 `quality/verify.json` 作为逐验收标准的 current 权威，保留
`runtime/evidence/quality-store.mjs#publishVerifySummary` 作为其唯一 canonical writer。
`runtime/stage/completion-predicates.mjs` 只消费经过 material、snapshot、evidence、hash、
时间、stage/subject allowlist 认证的 `build-code`/`verify-code` `AC-*` 事实。第二 writer、
双写、旁路导入、坏时间、并列最新和冲突结果均 fail-closed；不迁移、不删除既有权威。

状态读取由 `runtime/stage/current-close-projection.mjs` 提供只读投影，不持久化、不创建
第二状态机或索引。投影稳定并列四个互相独立的域：

- `work_progress`：当前工作是否还能继续；
- `stage_quality`：当前阶段质量事实；
- `product_release`：逐 AC current 权威派生的发布状态；
- `physical_delivery`：close 计划、不可变步骤记录和现场读回派生的物理状态。

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
| current per-AC authority | `publishVerifySummary` | product-release/status readers |
| stage freshness scope | `STAGE_FACT_MATERIALS` + existing quality writer | freshness and current product readers |
| four-domain projection | `deriveCurrentCloseProjection` (read-only) | status and close readers |
| physical close records | `core/task-close.mjs` | physical-delivery projection and audit readers |

## 不在本 ADR 中

本 ADR 不新增 public command、HTTP/API、quality store、current selector 或 release writer；
不修改历史 `quality/verify.json` bytes，不恢复旧索引/lineage/recovery 控制面，不把质量缺口
变成继续工作的许可证，也不证明真实远端 push、权限或 browser/UI 行为。

## 证据

- `tests/contract/verify-publication.test.mjs`：既有 canonical writer 和拒绝直接写入；
- `tests/contract/verify-authority-boundary.test.mjs`：逐 AC stage/subject、最新/并列/坏时间及旁路结果；
- `tests/contract/four-domain-close-status.test.mjs`：四域、六态、计划/步骤/完成结果分离；
- `tests/close/close-contract.test.mjs` 与 `tests/close/cleanup-resume-finalize.test.mjs`：确认、逐动作授权、读回和同计划恢复；
- `docs/architecture/control-plane-inventory.json`：投影与既有唯一 writer 的职责、消费者和删除条件登记。

## Supersedes

仅精确 supersede ADR-0017 中把产品发布输入限定为阶段质量事实的冲突表述；ADR-0017 的
阶段质量新鲜度范围继续有效。ADR-0018、ADR-0020 的物理交付与质量分离、既有工作区不删除
和人工授权语义继续有效。

