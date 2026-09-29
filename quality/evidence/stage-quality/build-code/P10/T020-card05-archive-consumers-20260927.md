# P10：CARD05 归档文件的当前消费者审计（只读）

## 结论

- 输入清单中 `card05_archive_committed` 恰好有 **51** 条，均为 `specs/archive/workflowhub-thin-core-card-05-20260919/**`，当前磁盘上 51 条均存在，Git 均跟踪。它们由 CARD05 的归档提交带进 CARD04 从任务起点到当前快照的 215 条变更范围；这不等于 CARD04 修改了这些文件。
- 对 CARD04 当前业务执行链，未发现按这 51 条路径读取的生产代码。`tools/cli/check-decision-log-chain.mjs:141-149` 遍历 `specs/` 时明确排除 `archive`。然而 `core/task-close.mjs:1931-1981` 可按传入任务的归档路径读取已归档材料；不能断言所有运行时对这 51 条永远零读取。
- **8 条**被当前测试直接读取：`decision-log.md`、`spec.md`、`phases/index.md`、`phases/P1.md` 至 `P5.md`。`tests/contract/post-spec-analyze-original-source.test.mjs:5-18` 将它们装入真实材料包。另 **43 条**没有找到当前测试的逐文件直接读取，但归档清单与仓库盘点工具会遍历或逐个哈希全部 51 条。
- 以“完全无人消费、可从全部变更/检查中安全删除”为标准，**已证明可排除数为 0**。以“CARD04 业务用例无需逐条映射 CARD05 历史附件”为更窄的判断，43 条可列为候选，8 条仍与测试相关；正式排除须有明确的变更范围/选择规则，不能改造索引或把 51 条直接标成业务测试已覆盖。本报告不是这样的规则或质量通过结论。

## 51 条的分组与逐路径覆盖

| 分组 | 路径（共同前缀 `specs/archive/workflowhub-thin-core-card-05-20260919/`） | 数量 | 已证消费者 |
|---|---|---:|---|
| 当前测试直接读取 | `decision-log.md`, `spec.md`, `phases/index.md`, `phases/P1.md`—`P5.md` | 8 | `tests/contract/post-spec-analyze-original-source.test.mjs:5-18` 的 `currentPacket()`；每次构造材料包读取全部 8 条 |
| 历史研究与原始验证附件 | `research/**`，包括 `red-evidence/**` | 43 | 未找到当前测试的逐文件路径读取；仍被下列目录遍历和盘点覆盖 |

这两组覆盖输入 `index.json` 中 51 条路径，数量为 8 + 43 = 51。后组不是“不存在消费者”的证明，仅是精确测试引用未命中。

## 目录级消费者与边界

1. `tools/architecture/history-inventory.mjs:8-39` 从 `specs/archive/` 递归枚举文件并读取每个文件原始字节，生成长度与 SHA-256；`verifyUnchanged()` 再与冻结清单比较。故 51 条均有当前诊断消费者。`tools/architecture/retention-audit.mjs:92-120` 调用这两个读者；`tests/integration/governance-learning-non-gate.test.mjs:23-34` 在真实仓库执行该审计并明确把新增历史路径视为可见的诊断漂移，不是业务放行证。
2. `tools/architecture/inventory.mjs:168-190` 用 `listDeliveryFiles()` 纳入 Git 跟踪文件，`renderInventory()` 读取每个文件并记录哈希；`tests/contract/repository-inventory.test.mjs:28-38` 在当前树中调用它。`docs/architecture/repository-inventory.tsv` 是冻结旧清单，并未列出这次新归档的 51 条；不能用旧清单缺项推断文件无人使用。
3. `tools/architecture/reference-audit.mjs:68-94` 递归扫描 `specs/` 文本文件作为只读诊断。`vitest.config.mjs:31` 排除归档目录里的测试文件，只是不收集该目录内的测试；并不排除归档之外读取归档材料的测试。
4. `core/task-close.mjs:1931-1981` 支持按给定任务的 `spec_archive_path` 读回归档树和材料，并可能按任务声明读取附件。已归档 CARD05 没有当前 CARD04 活动消费者的证据；但这个通用运行时入口阻止“全局生产零消费者”断言。
5. `tests/contract/post-phase-contract.test.mjs:297` 与 `tests/contract/decision-freeze-current-oi.test.mjs:18` 仍指向已迁走的 `specs/workflowhub-thin-core-card-05-20260919/**`，当前该旧目录无 Git 文件。这是另外两处明显的旧路径测试风险；本审计未运行测试，也未擅自改动它们。

## 检查范围、可复核输入与限制

- 输入：`quality/evidence/stage-quality/build-code/P10/T020-unmapped-206-census-20260927/index.json` 的 `entries` 中 `origin_bucket=card05_archive_committed`；对 `runtime/`, `core/`, `tools/`, `workflows/`, `skills/`, `tests/` 的 `.mjs` 精确搜索 CARD05 任务名、`specs/archive/`、目录遍历与动态路径构造，并阅读命中的入口。`AGENTS.md:58` 要求 `specs/archive/**` 只读保留；本报告没有修改它们。
- 输入固定身份：清单记录 `snapshot_tree=a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`，`material_revision=revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`。本次未重算当前快照，未跑测试，未改源码、规格材料或选择规则。
- 静态搜索不能排除外部脚本、手工指定路径、未来对 CARD05 的 close 读回，或声明附件后动态读取 `research/**`。这些保持“无法证明没有消费者”，不得转成通过。
