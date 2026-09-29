# P7/T015 旧 123 份验收记录来源查找（2026-09-28）

## 结论

**未找到能认证当时 123 份原始字节的旧快照或逐文件基线。兼容结论仍是 `unknown/G2`。** 当前 Task store 的逐份事实引用与 A1 报告的数量、阶段、结果分布完全吻合，可以定位 123 份**候选**，但它们和候选文件都从同一个仍在变化的 Task store 读取；不能据此证明 A1 报告当时读取的恰好是这些字节。

## 找到的线索

- 旧 A1 报告：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/reviews/a1-acceptance-enum-design-20260923.md`，当前 SHA-256 `169800ed9f24568533d4aed95bd2c997355f6debb116927d7063870dcd95f96e`。报告称当时 123 份，`make-decision=88`、`build-plan=35`，`pass=94`、`deferred=29`；只留了聚合数，没有逐份路径、哈希或冻结目录身份。
- 同一 Task store 的 `quality/facts/*.json` 中有单份 `quality/evidence/acceptance/...` 引用及 SHA-256。按这些事实**文件内自报** `recorded_at` 不晚于报告 mtime `2026-09-23T03:31:56.618Z` 过滤，得到 123 个不同引用：`make-decision=88`、`build-plan=35`；目前 123 个目标文件全在，按**当前字节**重算的 SHA-256 全部等于引用值，结果分布亦为 94/29。最晚自报时间 `2026-09-23T03:16:57.107Z`。
- 这些事实和接受记录采用内容寻址文件名，能发现**现在**的损坏或错配；自报时间、文件名、mtime 和同库事实引用都不能代替独立保管的 2026-09-23 快照。此前候选集及其**本次重算**清单哈希见 `T015-historical-baseline-audit-20260928.md`；那份哈希也不是旧基线。

## 已查范围

- 只在本 Task 的 `quality/reviews/**`、`quality/evidence/**`、`quality/facts/*.json`、`facts.jsonl` 内找旧清单、备份、快照及引用；A1 及后续报告有聚合数字，未找到当时的逐文件清单或原始字节包。`facts.jsonl` 目前仅 3 条阶段行，未列 123 份验收原件。
- `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/` 下按 CARD-04 名称限域查找，只发现当前 Task 目录；`tasks-archive/` 限深 3 层同名查找无结果。未无界扫描用户磁盘。
- 工作树 Git `git ls-files 'quality/evidence/acceptance/**'` 和 `git log --all -- quality/evidence/acceptance` 均无结果。A1 记录的旧 HEAD `35a881ac3c3288249677597a9079d445949de778` 可读，但该提交不含外置 Task store 的 `quality/evidence/acceptance` 目录；Git refs 无旧事实字节来源。

## 还缺什么

须找到**当时独立保存且能核对来源身份**的 123 份路径与原始字节，或同等的逐文件 SHA-256 清单和被认证的旧快照，然后逐份对照当前文件。未取得前，不把这 123 个当前候选文件写成“旧记录兼容已通过”。
