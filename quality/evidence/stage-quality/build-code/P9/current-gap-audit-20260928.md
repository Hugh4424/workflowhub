# P9 当前缺口只读核查（2026-09-28）

范围：CARD-04 认证 worktree `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。本次只读当前文件、旧原件和外置 Task 记录；未改生产代码、阶段材料或旧证据，未运行测试。

## 已有且仍有效的局部事实

先前「CARD-04 没有 P9 官方测试回执」的说法有误：**该 Task 已有两份正式 targeted receipt**，同绑当时的 `snapshot_tree=a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`、`material_revision=revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`。

| 卡面命令 | 当时结果 | 原件核对 |
| --- | --- | --- |
| `npx vitest run tests/contract/build-code-preexecution-source.test.mjs tests/contract/build-code-change-scope.test.mjs` | 12/12，通过，CLI 和 receipt 内部退出码均为 0 | `current-official-gates-20260927-493b195d/scope/readback.json`；receipt `quality/tests/card04-P9-scope-current-493b195d-edf9-4cb9-b881-6678192ca734.json` |
| `npx vitest run tests/contract/build-code-test-registry.test.mjs tests/contract/build-code-test-inventory.test.mjs` | 11/11，通过，CLI 和 receipt 内部退出码均为 0 | `current-official-gates-20260927-18c2b580/inventory/readback.json`；receipt `quality/tests/card04-P9-inventory-current-18c2b580-6d2b-4053-8186-a00855cfbb73.json` |

两份 `readback.json` 均记录 Task 身份、命令、receipt/output SHA 和执行前后相等。当前下列 P9 生产与测试文件 SHA-256 仍等于当时两份本地 12/12、11/11 meta 及 CARD-04 官方 preflight 清单：`change-scope.mjs` `da79f207…`、`capture.mjs` `2da71029…`、`test-asset-inventory.mjs` `29d10bc7…`、独立 `test-asset-registry.json` `b5f7c796…`；两新两旧合同依次为 `e5ec0396…`、`21601f34…`、`9afc2b3b…`、`448b803d…`。`P9.md` 本身仍为 `dcfd25ea…`。这是字节同一性，不是当前整棵源码或相位完成证明。

独立 registry 当前仍只登记 3 个真实目标，目标文件 SHA 与登记一致。隔离 Task `p9-real-three-targets` 的 3 份 canonical receipt 分别实报 **6、28、15** 条测试叶，全通过并与登记身份逐项相符；原件见 `T019-safe-three-target-{1,2,3}-20260927.meta.json`。它们的任务和树不同于 CARD-04，不可写成 CARD-04 的正式执行。整份安全探针脚本退出码仍为 **1**；`T019-real-three-targets-audit-20260927.md` 与 `T019-safe-three-content-reconciliation-20260927.json` 只说明当时另做的内容对账，不能覆盖失败退出码。registry 明写 `outside_scope=unknown`，未登记测试资产和业务覆盖不能借这 49 条叶宣称完成。

## 当前仍缺的证明

旧两份 CARD-04 receipt 绑定旧树。按其 `scope/before.json` 文件 SHA 对当前字节重算，`phases/index.md`、`P7.md`、`P10.md`、`P13.md`、`stage-runner.mjs`、`stage-content-contracts.mjs` 和业务目录 `business-case-catalog.json` 已变化；P9 核心文件不变并不能使旧 `snapshot_tree` 自动变成当前树。当前相位材料和消费者的组合因此不同于旧回执。未取得这组组合的同版 P9 联合正式结果及独立审查结论。

真实消费接线已存在：`capture.mjs:175,182,209` 执行前、后读取 P9 变化范围与 registry；`targeted-capture.mjs:90,92,197,199` 使用并复核两者；`case-reconciliation.mjs:398,440,464` 读取 registry 并核执行记录。调用边证明来源被读取，不能替代当前 Task 的真实选例、逐业务效果或 P9-J1 跨任务旅程。外置 `quality/reviews/results/build-code-simple-*.json` 未见与旧 `a8ba4bcc…` P9 双门绑定的独立正式审查，更未见当前版本的同版审查；不把其他树的审查移用到此处。

## 最小安全后续

待材料与代码稳定后，在 CARD-04 认证 worktree 按 P9 卡面**两条原命令**分别取得新 canonical receipt/output，并保存可独立枚举的完整测试叶身份；比较 Task、材料版本、源码树、命令、退出、原始输出哈希及 registry 版本。随后由独立上下文核任务启动起点→执行前变化→registry 双向对账→P10 真实选择/运行/结果，保留任何未映射或失败。旧两份 CARD-04 回执、隔离 Task 三份回执和失败脚本原件均只读留存。当前 P9 仍为 `not_done`。
