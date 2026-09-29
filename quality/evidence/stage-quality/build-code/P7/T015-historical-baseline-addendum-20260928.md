# P7/T015 历史 123 条基线补查：质量事实反向引用

承接 `T015-historical-baseline-audit-20260928.md`；本次只读外置 Task 的 `quality/facts/**`、`quality/evidence/acceptance/**` 和 A1 设计报告，不改旧事实。**结论仍为 unknown/G2**：当前质量事实提供了独立文件中的 123 个 ref/hash，显著加强候选识别，但没有当时独立封存的清单、旧字节包或生成命令原始输出，不能把当前交叉一致性当成历史逐字证明。

## 可复核结果

- 外置 Task `quality/facts/*.json` 现有 242 文件。其中 195 个 `kind=acceptance_criterion` 且含 `evidence_type=acceptance_evidence` 引用，引用互不重复。
- 以 A1 报告当前文件 mtime `2026-09-23T03:31:56.618Z` 为截止，按质量事实的 `recorded_at` 筛出 **123 个**：`make-decision=88`、`build-plan=35`，`status=passed 94 / missing 29`。它们的文件 mtime 也全部早于报告 mtime；`qualityFactDigest(value)` 与各 `quality/facts/<digest>.json` 文件名及 `fact_id` 全部相符。
- 这 123 个质量事实各自给出唯一的验收记录路径和 SHA-256；现存对应路径 123/123 可读，当前原始字节哈希与质量事实中的哈希 123/123 匹配，`subject` 与验收记录 ID 123/123 匹配。以 `ref<TAB>sha256<LF>` 排序拼出的**当前反向引用清单** SHA-256 为 `955da14a74390212dc58287a4601e995345a63de433a75a712dc41f733f153f4`，与前次从验收目录独立算出的当前候选清单相同。另 72 个验收质量事实的 `recorded_at` 和文件 mtime 均晚于报告。
- 当前生产实现中，`runtime/stage/stage-runner.mjs#publishStageQualityFact` 先写内容寻址的验收记录，再让 `publishVNextQualityFact` 写独立质量事实；`runtime/evidence/quality-fact.mjs#publishQualityFact` 与 `runtime/task/task-handle.mjs#createOnlyAt` 通过仅创建不覆盖的写入路径保留已有记录。这证明**当前设计**预期旧记录不可被正常写入流程替换；它不是对 2026-09-23 实际文件系统无旁路改写的外部证明。

## 为何尚不能提升为旧基线

- A1 报告 §5.2 展示了一段当时遍历验收目录的命令，并仅保存 `{ok:123,bad:0,dist:{pass:94,deferred:29}}` 等聚合结果；没有保存那次命令的原始输出文件、逐条 ref/hash 或质量事实列表。限定检索未找到独立于现存 Task store 的当时清单、Git 版本或备份。
- 当前质量事实与当前验收文件虽然是两组不同文件，并且哈希完全对得上，但两组都来自同一现存可写 Task store。它们的 `recorded_at`、验收记录的 `freshness.evaluated_at` 和文件 mtime 共同支持“很可能就是当年的 123 条”，仍无法排除报告之后由同一文件系统权限绕过正常 writer、同步改写两组文件并保留/恢复时间戳。内容寻址文件名只约束当前字节，不证明报告当时的路径集合及字节。

要改判逐字兼容，需要报告当时**另行封存**且可认证的 123 条路径与原始字节/逐条 SHA-256；再对这份外部旧见证与当前 123 个 ref/hash 逐条比对。现有 123 个质量事实可作为定位候选的清单，不能替代旧见证。
