# P7/T015 历史 123 条逐字兼容基线核查（2026-09-28）

结论：**仍为 unknown/G2**。找到了与旧统计精确吻合的 123 条**当前候选记录**，但未找到当时冻结的逐文件路径与 SHA-256 清单或旧原始字节；不能证明候选集合就是当时 123 条，也不能证明每条字节自那时未变。本文件是只读核查记录，不把候选集提升为历史权威。

## 旧来源与当前候选

- 外置 Task 的 `quality/reviews/a1-acceptance-enum-design-20260923.md` 当前 SHA-256 为 `169800ed9f24568533d4aed95bd2c997355f6debb116927d7063870dcd95f96e`，文件 mtime 为 `2026-09-23T03:31:56.618Z`。该报告 §1 只记录旧时聚合数：总 123，`pass=94`、`deferred=29`；其中 `make-decision=88`（70/18）、`build-plan=35`（24/11）。没有逐文件路径、逐条 hash 或旧目录的不可变快照引用。
- 现存外置 Task `quality/evidence/acceptance/**` 有 195 个 JSON：`make-decision=88`、`build-plan=84`、`build-code=23`。按记录内 `freshness.evaluated_at <=` 上述报告文件 mtime 筛选，恰好 123 个：`make-decision=88`、`build-plan=35`，结果 `pass=94`、`deferred=29`。这 123 个的最晚内嵌时间为 `2026-09-23T03:16:57.107Z`；文件 mtime 均不晚于报告 mtime。余下 72 个的内嵌时间与文件 mtime 均晚于报告。当前候选 123 个的每个文件名 SHA-256 后缀均等于当前原始字节哈希。
- 为便于复核**当前候选集**，以 Task 根相对路径排序，每行 `path<TAB>raw_sha256<LF>` 拼接后，整份清单 SHA-256 为 `955da14a74390212dc58287a4601e995345a63de433a75a712dc41f733f153f4`。这只是本次从当前文件重新计算的候选清单哈希，**不是旧基线哈希**。

## 来源检索边界

- 限定搜索外置 Task 的 `quality/reviews/**` 与 `quality/evidence/**`：A1 报告及后续独立审查附件提到 123 的统计，但未找到同一时点的 path→SHA-256 清单或旧字节包；当前 Task 下没有命名为 acceptance backup/snapshot/manifest 的基线文件。
- 当前 Git 仓库 `git ls-files 'quality/evidence/acceptance/**'` 为 0；对该路径的 `git log --all` 无历史提交。因此不能由 Git 版本取回旧目录。
- 当前 `quality/facts/**` 中有验收引用，记录内也有时间与内容寻址 ref/hash；这些是现存 Task store 的当前材料，并非 A1 报告当时冻结的 123 条成员清单。文件名内容寻址只能证明**现在**文件名与**现在**字节一致，不能从统计数和时间倒推当时每条原始字节。

## 补证条件

取得由当时来源独立保存的 123 条路径与原始字节（或逐文件 SHA-256 且可认证的旧快照），确认它与 A1 报告的样本同源，再逐条与当前对应文件对比。只凭当前候选集的 123、94/29、mtime 或本次新算的清单 hash，不得将逐字兼容改判通过。缺旧来源时保留 `unknown/G2`，不改既有记录。
