# T020 邻近定向检查的六项失败

结论：这六项在本次 OI 补丁前的隔离基线中**同名、同原因失败**。它们不能记成本次补丁新增的失败，也不能把这条邻近检查记为通过。

## 复核方法与原始输出

- 从当前 CARD04 worktree 复制代码到 `/tmp/card04-oi-before.hdMFrs`，不复制 `.git`、`quality/`、`node_modules/`；临时副本链接主仓库已安装的 `node_modules`。仅将 `runtime/stage/stage-handlers.mjs` 和 `runtime/stage/stage-content-contracts.mjs` 换成 `T020-decision-freeze-oi-implementation-20260927/before/` 中补丁前的备份。两份备份 SHA-256 分别是 `88760292bc8b78d6a13e848fddc5ba9ce1fa4708cd422d404045c8820c21e5c9`、`653a6f0d516cb7b66c4de0fb081122dbb06354dbaaa51044b1d7666c033d3245`。
- 临时副本的两个定向测试文件 SHA-256 为 `e4197528887d296211f69fd6f2b5f70a821d0cf80a500886a1991ddce420e17e`、`b31d564a6e7d9971e2260af999f119eba5323c4794c0126770e06deb453bf161`，与 `after/runs.json` 一致。`runtime/review/canonical-review-result.mjs` 未被 OI 补丁改动。
- 在临时副本执行与 `after/runs.json` 第三条相同的命令：`vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/post-phase-contract.test.mjs`。退出码 1；48 条中 42 通过、6 失败；六个 `FAIL` 名称及原因与 `after/command-3.*` 一致。补丁前原始输出：[`stdout`](T020-adjacent-failures-before-baseline-20260927.stdout.txt)、[`stderr`](T020-adjacent-failures-before-baseline-20260927.stderr.txt)，SHA-256 分别为 `89667eb6666c6ee31e6904ad90c561f1aac58e8f17ccaa9a0105a10cde10b698`、`0582096443da7439d9d9a520a2db2bc59b7e525a6b61117dfbf77fbaa405411c`。

## 逐项原因

| 失败测试 | 精确原因 | 补丁前证据 |
| --- | --- | --- |
| `publishes handler routing facts...`、`accepts a fixed direction change...`、`T014 keeps a handler completion incomplete...`、`keeps an otherwise valid active fallback incomplete...` | 四项都使用 `buildSpecRoutingFixture`。测试先聚合未带 `evidenceAnchors` 的 provider 结果，得到 `provider_findings[].evidence_anchor_valid=false`；随后保存的 provider 输出却有 `evidence_anchor_valid:[true]`。`verifyReviewChain` 重算得到 `true`，`authenticateCanonicalReviewResult` 在 `canonical-review-result.mjs:362-366` 拒绝不一致，抛 `REVIEW_EVIDENCE_INVALID`。`safeReviewFacts` 位于本次新增的 `currentDecisionFreeze` 路径之前，故尚未执行新 OI 逻辑。 | 隔离基线四项同样抛该错误；测试夹具 `freeze-classification-budget-usage-protocol.test.mjs:59-130`、handler `stage-handlers.mjs:2164,3777-3785`；直接聚合对照得到 `false` 与 `true`，`findingsEqual=false`、`adjudicationEqual=false`。 |
| `AC-REBIND-001...` | 测试第 299 行读取旧任务的 `specs/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md`；本 worktree 和 HEAD 都没有此文件。 | 隔离基线同样 `ENOENT`；`git ls-tree HEAD` 对该路径无条目。 |
| `AC-REBIND-003...` | 测试第 321 行要求 `workflows/build-plan/SKILL.md` 包含旧句 `确认后唯一可写区是 tasks.md 的执行状态填写区`，当前文件与 HEAD 均无该句。 | 隔离基线同样断言失败；`git diff` 显示该技能文件和本测试均未被本次 OI 补丁改动。 |

边界：这个隔离基线只回退本次 OI 补丁的两份生产文件，其余为复制时的 worktree 状态；它证明这些六项失败不依赖本次 OI 改动，不能代替完整历史快照或证明整个 P10 已通过。临时副本位于 `/tmp`，未写回 worktree 的源码、材料或 Task facts。
