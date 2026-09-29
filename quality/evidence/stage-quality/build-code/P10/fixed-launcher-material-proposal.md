# P10 固定可信入口与冻结反例的材料决定提案

## 已证事实

- 现行 public `verify --action=execute --stage=build-code` 走 `tools/cli/stage-runtime.mjs` 的 `capture-tests`，CLI 只接受 `command/receipt_ref/output_ref/timeout_ms`；`workflows/build-code/capture.mjs` 先执行命令，再计算 `change_scope`。当前官方 P9 receipt 已给出 206 路径的 `change_scope.status=recorded`，但没有 `test_inventory`。
- P8 目录 revision `2026-09-26.card04-seed.3` 有三条 JSON reporter 命令和 49 个全 ID；P9 collector 能在**调用者给出** `registeredTestIds` 时核对，但没有认证的目录版本读取器或生产调用。
- P10 选择、runner、对账模块仅被定向测试直接 import；没有固定生产消费者。三文件冻结门最近一次为 26/29，三个失败是 `mismatched_snapshot` 和两项以取消/余额合成夹具要求业务通过的正例；这些 alpha/beta 夹具没有经认证的 CARD-04 业务 oracle。P10/T020 的共享文件假归属已另行 fail-closed 修复，不改变这三项来源缺口。
- `mismatched_snapshot` 冻结反例只替换调用者提供的 scope tree；所传 inventory 无 Task/receipt/snapshot 身份。纯对象 selector 没有外部权威可区分“合法旧树”与“伪造树”，故不应硬编码字符串、当前 HEAD 或拒绝所有历史快照换绿。

## 建议材料决定与最小写面

1. 由 P10/Task 材料 owner 给 selector 一个**已认证**的输入合同：P9 `recorded` inventory 或 canonical receipt 的 `task_id/snapshot_tree/source_digest/receipt_ref/output_hash`，并修订冻结 `mismatched_snapshot` 反例，让它同时提供真实的独立权威与篡改值。失败原因保持 fail-closed；旧 RED 原件保留。
2. 在现有 public `verify` 的私有实现内接一个固定消费者，不增 public 命令、stage、gate 或账本：认证 Task/bootstrap/当前快照 → 读取并绑定 P8 目录 revision/hash 与独立登记 ID → 按 P9 范围安全选择 → P10 `shell:false` 固定 argv 执行 → 将 raw reporter/ref/hash、每个 leaf ID/状态与原有 canonical receipt 同版绑定 → 对账。外层现有 capture 若仍用 shell，只接受固定可信字面命令；动态目标留给已验证的内层 argv，不在 receipt 写锁内嵌套 capture。
3. P8/业务 owner 应为**真实 CARD-04 case**提供独立版本化效果谓词、before/after 读取路径和来源，并据此审定新的正控或修订冻结正控；不能把旧 alpha/beta 合成取消/余额夹具直接认证为本卡业务规则。旧 RED 原件保留。没有真实 oracle 时 T021 只能报告 `observed/unauthenticated_business_oracle`，不能升为 `reconciled/passed`。真实 P8 多 leaf case 还需要 case→leaf 分区合同，禁止同文件 leaf 误归。

**所需材料修订/写面：** `specs/workflowhub-thin-core-card-04-20260919/phases/P9.md` 与 `P10.md` 精确定义 catalog→capture 的 owner、版本和私有消费者；允许在现有 `workflows/build-code/capture.mjs` 与 P10 三模块内接线，并只在必要时让 `tools/cli/stage-runtime.mjs` 私有路径传递已认证 Task 句柄，公共四字段输入保持不变。冻结 `tests/contract/build-code-case-selection.test.mjs` 的反例输入应由材料 owner 限定修改，以验证独立 receipt/inventory 身份，不能放宽目标断言。若需新增生产文件，先在 move-map/职责记录中登记唯一 consumer、owner、替代关系、删除条件，再实施。

未获该材料决定和真实 oracle 前，P10 继续 `not_done/G2`；本提案不是实施事实、完成许可或修改授权。
