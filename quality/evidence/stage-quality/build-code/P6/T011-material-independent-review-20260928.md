# P6/T011 材料窄修独立审查（2026-09-28）

结论：**本次四行材料修订无阻断问题**。这只解除 T011 文字与当前镜像的矛盾，不构成 P6 或 T012 完成判定。

- 身份：`task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。只读核对 `T011-material-fix-20260928/diff.patch`、当前 `P6.md`、外置 `ORACLE.json`、冻结测试、T012 E2E 及此前独立复核；未运行新测试，未改代码、材料、oracle 或 Task facts。
- 差异只涉及 `specs/workflowhub-thin-core-card-04-20260919/phases/P6.md` 的 T011 Action、Outputs / failure、Evidence、Coverage limit 四行。把补丁中的四条新行从当前文件反向替回旧行，所得 SHA-256 为 `35b15b6739106d5f4e2ac8e2e0f69b3c1b365f81ce45bf4efcfd9471b85967c3`，等于前次独立快照和修订记录的修前值；当前文件 SHA-256 为 `8c92d7597e70686145230e3e255daf1cf97c0a38dee55870a3c6d61cbf2491dd`，等于修后记录。这证明此次补丁没有夹带其它 Phase 或材料段落的改变；不能据此评价工作树中其他任务的既有改动。
- 原八个键及取值要求逐字保留，只增加 `schema_version = 1.0.0` 和“九个顶层键”的计数。当前仓外原镜像确有九个顶层键，原件 SHA-256 为 `24bdd3016c92642212153e182a4c7b42ae293e74e33e00e685f811bcbf306e7e`，与前次快照一致；冻结 T011 测试 SHA-256 仍为 `b7f6fb9944ae17fdbe8192cae6f1af7e871bdf6d4bffc2783d6e8045845c1a70`。T012 E2E 的 P0-b 在 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs:277` 消费非空 `schema_version`，并未检查其精确值；新材料明说精确值由当前原字节核对，未夸称测试覆盖。
- 原 build-plan 预置 RED 的历史标签和原件路径仍在。修订后的 Evidence 明确区分当前 T011 定向 9/9、两项负控、原规划但不存在的 `T011-green.txt`、正式阶段质量及 P6 完成，未将局部绿色写成全阶段通过。前次独立复核与原始输出支持所引测试事实，本次未重新执行。
- 当前仓外目录权限位 `0555`，`ORACLE.json` 为 `0444`；仓内 `quality/oracle/card-04/` 不存在。新文字准确把这些称作权限位与声明写集边界，说明同一 OS 用户仍可读、可 `chmod` 后改写，不称作宿主级隔离。

剩余边界：T011 的正式完成仍要按当前材料和阶段规则判定；T012 全链、P6 综合门、业务效果与正式质量事实另核。本次无新增阻断。
