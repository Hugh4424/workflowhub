# P3/T005：写入正式任务事实前的只读核对

## 当前事实

- 2026-09-28 本地读回：Task `workflowhub-thin-core-card-04-20260919`，分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`，材料 `revision-30e50b760cb29e92f9b114a9be6db6105647a76b7c3c8caeb15a4a949a4975b6`，源码树 `4381e90d43a7072ba12d1a4359ba757c3ddd5786`。
- 两目标官方测试 receipt `quality/tests/card04-P3-T005-two-targets-2ec04542-fc3c-4f75-8bfb-ec87394bf9da.json` 绑定上述树，8/8；当前 P3 独立 review result `quality/reviews/results/build-code-simple-4f2643f1-2185-507d-ad19-ec19bedb433b.json` 绑定同树和材料版本，两方结果各 0 findings。原始取证见本 worktree `quality/evidence/stage-quality/build-code/P3/T005-current-two-targets-20260928/` 与 `P3/T005-phase-review-current-20260928/`。
- 外置 Task 当前 `facts.jsonl` 的 build-code 行仍是 2026-09-27 的 `partial/incomplete`，绑旧树 `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`、旧材料 `revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`；`status` 显示该行 stale、`phase_progress=null`、完成尝试 0。旧实现 receipt `quality/evidence/implementation/fd49dc11b9bedf1399b7a8663304a3397c340a232323331154cb197c2d4842e0.json` 也绑旧树，不能用来写当前质量事实。

## 正式写法及最小顺序

1. 写前再核当前 Task、分支、HEAD、材料版本和源码树。若树变了，先对当前树重新取得相应实现/测试事实；不能将本次 8/8 和 review 机械迁移到新树。
2. 使用现有 `runtime/evidence/canonical-receipt-writer.mjs#writeCurrentImplementationReceipt` 与认证的 Task/Workspace 对象，生成**当前树**的内容寻址实现 receipt，并回读 `snapshot_tree`、diff 与 changed 路径。`stage-runtime` 的七类公共命令中，`verify --action=execute` 只采测试，`review --action=record` 只采审查；没有公共的“采实现 receipt”命令。这个既有私有 writer 曾生成上面的旧 receipt，但旧原件必须保留。
3. 若要让正式运行把 review 记为 **P3 的** `phase_review`，先用公共 `run --action=execute --stage=build-code --input=<仅含 phase_progress 的 JSON>` 将游标指向 `P3/T005`。当前没有游标；`publishVNextStage` 从同一行读游标来确定 `currentPhaseId`，`reviewEvidenceStatus` 要求 review 的 `phase_id` 与它相同。游标只定位工作，不证明完成，且必须作为该次输入的唯一字段，不能与 receipts 混写。
4. 再经公共 `run --action=execute --stage=build-code --input=<运行请求>` 提供**当前树**的 `receipts.implementation`、上述 `receipts.tests`、上述 `receipts.review`。当前 handler 在发布前验证三份原件的 Task/树/哈希和测试输出；运行后由 `publishVNextStage` 写质量事实与同一 `facts.jsonl` build-code 行。不要手改该文件。若仅提供 P3 局部证据，其它验收项目仍须按真实状态留 `missing/incomplete`，不能填成全卡通过。
5. 读回新行与 `phase_review` 质量事实，核树、材料、证据 ref/hash、finding disposition 和实际完成状态。P3 的独立审查 0 findings 只说明此审查未提出问题；它不证明 AC-18/AC-19 的全部真实样例，也不证明 build-code 完成。P3 交接报告可在事实核对后如实说明本地 G-2 两侧问题修复及剩余全卡限制，再考虑把游标移到下一实际未完成任务。

本页是只读准备记录；没有启动新的 stage run、写游标、生成新实现 receipt 或修改代码/材料。依据：`tools/cli/stage-runtime.mjs` 的 public route、`writeBuildCodePhaseProgressCursor` 和 `run` 分支；`runtime/stage/stage-handlers.mjs` 的 build-code receipt 验证；`runtime/stage/stage-runner.mjs#publishVNextStage` 的当前 Phase review 绑定；`workflows/build-code/SKILL.md` 的 post 事实与游标约定。
