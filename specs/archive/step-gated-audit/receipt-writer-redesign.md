# receipt-writer.mjs 重构设计文档

**状态**: 设计草案，待人工确认后方可开始实施
**日期**: 2026-07-03
**背景**: main 已 revert 回 7ecd826（phase-3 全部退回），历史代码保留在 `d5a5ddc` 及其前序 commit。本文档基于 `d5a5ddc:runtime/evidence/receipt-writer.mjs`（453 行）分析后出具。

---

## 1. 问题诊断

### 1.1 当前混职情况（基于 d5a5ddc 版本）

| 职责 | 当前所在位置 | 行数范围 |
|------|-------------|---------|
| 断言工具函数 | receipt-writer.mjs 内部 | 22–68 |
| 日志路径解析与 I/O | receipt-writer.mjs 内部 | 70–110 |
| entry/exit/rollback payload 校验 | receipt-writer.mjs 内部 | 112–234 |
| 拓扑链遍历（first-exit 视图） | receipt-writer.mjs 内部 | 236–347 |
| 审计聚合（latest-exit 视图） | receipt-writer.mjs 内部 | 362–433 |
| 公开写入 API | receipt-writer.mjs 内部 | 435–453 |

### 1.2 历史振荡根因

- **first-exit vs latest-exit 混用**：拓扑遍历（决定哪些步骤"在链上"）应用 `firstByStepId`，计数聚合（决定步骤最终状态）应用 `latestByStepId`。两套视图逻辑共存于同一函数 `buildAuditSummaryFromJournalEvents`，7 轮 review 中被反复互相覆盖。
- **executed=true/false 两种 payload 形状耦合在同一 validateReviewPayload 函数**：条件分支随每轮 review 意见增删，难以单独测试其中一种形状。
- **非阻塞合约（writeExitReceipt）与校验逻辑（validateExitPayload）耦合**：校验抛错时行为预期不清晰，导致"校验失败是否应该阻断"多次被重新讨论。

---

## 2. 模块拆分方案

拆分后共 4 个模块，当前 `journal-schema.mjs` 不变（已是单职责常量表）。

```
core/
  journal-schema.mjs          # 不变：常量定义（事件类型、字段列表等）
  journal-appender.mjs        # 新：I/O 层（路径解析、追加写入、非阻塞合约）
  receipt-schema.mjs          # 新：校验层（断言工具 + payload 校验，无 I/O）
  chain-topology.mjs          # 新：拓扑遍历（first-exit 视图，纯函数）
  audit-aggregator.mjs        # 新：计数聚合（latest-exit 视图，纯函数）
  receipt-writer.mjs          # 保留：薄门面，组合上述模块，暴露公开 API
```

> **为什么保留 receipt-writer.mjs 作为门面**：现有调用方（facts-assembly.mjs、SKILL.md 引用的路径）均 import 自 `runtime/evidence/receipt-writer.mjs`。保留门面避免调用方大范围改动，同时将内部实现分离到各自模块，迁移可分阶段进行。

---

## 3. 各模块接口定义（窄契约）

### 3.1 `core/journal-appender.mjs`

**职责**：唯一知道"如何写文件"的模块。非阻塞合约在此处落地，不在校验层。

```js
// 导出接口

/**
 * 返回 taskSpecDir 下 journal.jsonl 的绝对路径。
 * 单一权威路径计算，facts-assembly 等调用方 import 此处，不再各自拼接。
 * @param {string} taskSpecDir
 * @returns {string}
 */
export function journalPathForTaskDir(taskSpecDir) { ... }

/**
 * 向 taskId 对应的 journal.jsonl 追加一行 JSON 事件。
 * 目录不存在时自动 mkdir recursive。
 * 写入失败抛出异常（调用方决定是否非阻塞）。
 * @param {string} taskId
 * @param {object} event
 * @returns {Promise<{ journal_entry_id: string }>}
 *   - STEP_ENTRY 调用：返回本次写入生成的 journal_entry_id（格式 `${iso_timestamp}_${step_id}`）。
 *   - 非 STEP_ENTRY 调用（STEP_EXIT、STEP_AUTO_ROLLBACK 等）：返回值中 journal_entry_id 为空字符串，
 *     调用方不应依赖此值，统一忽略即可。
 */
export async function appendJournalLine(taskId, event) { ... }

/**
 * 非阻塞地追加一条 receipt_write_warn 事件。
 * 写入失败时只写 stderr，绝不抛出。
 * 这是"writeExitReceipt 失败不阻断步骤"合约的唯一实现点。
 *
 * [疑虑3已解决] warn 事件结构必须包含完整原始 exit payload：
 *   { event_type: "receipt_write_warn", write_error: writeError.message,
 *     original_exit_payload: exitPayload }
 * originalExitPayload 参数由 receipt-writer.mjs 门面在 try/catch 中传入，
 * 确保 step_id / workflow_run_id / verdict / prev_step_id / next_step_id 等
 * 字段不因写入失败而丢失。audit-aggregator 在消费 journal events 时，
 * 若发现 receipt_write_warn 事件携带 original_exit_payload，
 * 将其视同一条未写成功的 STEP_EXIT 事件纳入计数（见 3.4 节）。
 *
 * @param {string} taskId
 * @param {Error|*} writeError
 * @param {object} exitPayload  - 写入失败的原始 exit payload，完整传入，不裁剪
 * @returns {Promise<void>}
 */
export async function appendReceiptWriteWarn(taskId, writeError, exitPayload) { ... }
```

**不导出**：路径拼接细节（`journalPathForTask` 内部私有）、`buildJournalEvent`（移至 receipt-writer.mjs 门面或保持内部）。

---

### 3.2 `core/receipt-schema.mjs`

**职责**：纯校验，无任何 I/O、无文件系统调用。断言失败抛 TypeError，由调用方决定如何处理。

```js
// 导出接口

/**
 * 校验 entry receipt payload。
 * 失败抛 TypeError，成功无返回值。
 * @param {object} payload
 */
export function validateEntryPayload(payload) { ... }

/**
 * 校验 exit receipt payload，含 review 子结构（两种形状）。
 * 失败抛 TypeError。
 * @param {object} payload
 */
export function validateExitPayload(payload) { ... }

/**
 * 校验 step_auto_rollback payload。
 * 失败抛 TypeError。
 * @param {object} payload
 */
export function validateStepAutoRollbackPayload(payload) { ... }

/**
 * 单独导出，供独立测试 review 两种形状。
 *
 * [疑虑2已解决] executed=false 时的合法 schema 明确如下：
 *
 *   executed=true（已执行）：
 *     - source, provider, report_path, raw_result_path, fix_status 必填且必须是非空字符串。
 *     - verdict 必填且值限定在合法枚举集内。
 *
 *   executed=false（未执行/跳过/超时）：
 *     - source, provider 即使 executed=false 也必须有值（非空字符串），
 *       因为这两个字段标识"谁发起了这次 review 请求"，与是否执行无关。
 *     - report_path, raw_result_path 允许为 null 或省略（未执行则无报告文件）；
 *       若提供则必须是非空字符串（空字符串视为格式错误，抛 TypeError）。
 *     - fix_status 允许为 null 或省略。
 *     - verdict 允许为 "unknown" 或省略（历史失败/超时 payload 中出现的真实值）；
 *       null 也允许（等同于 "unknown"）。
 *     - skipped_reason 或 error_reason 至少提供其一（非空字符串），
 *       用于区分"主动跳过"和"超时/环境错误"，防止伪造跳过路径。
 *       两者均缺失时抛 TypeError。
 *
 * 失败抛 TypeError。
 * @param {object} review
 */
export function validateReviewPayload(review) { ... }
```

**关键设计点**：`validateReviewPayload` 单独导出，使 executed=true 和 executed=false 两条路径可以独立编写单测，不需要通过完整 exit payload 路径触发。内部断言工具（assertObject 等）保持私有，不导出。

**不导出**：assertObject、assertNonEmptyString 等底层工具（内部实现细节，不属于模块契约）。

---

### 3.3 `core/chain-topology.mjs`

**职责**：纯函数，从 entry/exit 事件列表中发现链式拓扑结构。使用 **first-exit 视图**（重试不改变链结构）。无 I/O、无副作用。

```js
// 导出接口

/**
 * 从 entry events 和 exit events（已按 first-exit 去重）中，
 * 按 prev_step_id 链接关系发现有序步骤链路节点列表。
 *
 * [疑虑1已解决] 返回值从 { stepIds: string[] } 改为 { chainNodes: ChainNode[], warnings: string[] }。
 * ChainNode 结构：
 *   {
 *     step_id: string,
 *     journal_entry_id: string,   // 选中的 entry 事件的唯一 ID（journal 行 ID 或 timestamp+step_id 组合键）
 *     attempt_index: number,      // 该 step_id 在当前链路中是第几次出现（0-based）
 *     exit_journal_entry_id: string | null  // 选中的 first-exit 事件的唯一 ID，尚未退出时为 null
 *   }
 *
 * audit-aggregator 必须按 journal_entry_id（而非仅 step_id）做 latest 统计，
 * 确保只在"本链路选中的那次 entry 对应的 exit"范围内做聚合，
 * 不会被链路外的同名 step_id 重试实例覆盖。
 *
 * 使用 first-exit 视图：exitByStepAndEntry 必须是 firstByStepAndEntry() 的结果。
 * 调用方不得传入 latestByStepId() 的结果（职责边界）。
 *
 * @param {object[]} entryEvents  - event_type === STEP_ENTRY 的事件列表
 * @param {Map<string,object>} firstExitByStepAndEntry
 *        key 格式：`${step_id}::${journal_entry_id}`
 *        value：对应的 first exit 事件对象
 * @param {string} stageSlug
 * @returns {{ chainNodes: ChainNode[], warnings: string[] }}
 */
export function discoverChainNodes(entryEvents, firstExitByStepAndEntry, stageSlug) { ... }

/**
 * 从事件列表中，按 (step_id, journal_entry_id) 取第一次出现的 exit 记录。
 * key 格式：`${step_id}::${journal_entry_id}`
 * 注意：key 中的 journal_entry_id **取自 exit 事件自身的 `exit_journal_entry_id` 字段**
 * （即 exit payload 中绑定的对应 entry 的 ID），而非 exit 事件的行 ID。
 * @param {object[]} exitEvents
 * @returns {Map<string, object>}
 */
export function firstByStepAndEntry(exitEvents) { ... }

/**
 * 兼容辅助：按 step_id 取第一次出现的记录（first-exit 语义，不区分 attempt）。
 * 仍保留供链路头检测等不需要 attempt 粒度的内部场景使用。
 * @param {object[]} events
 * @returns {Map<string, object>}
 */
export function firstByStepId(events) { ... }
```

**不导出**：orderedDistinctHeads、orderedDistinctUnvisitedNextEntries、firstEntryForStepId（内部遍历细节）。

---

### 3.4 `core/audit-aggregator.mjs`

**职责**：纯函数，从 journal events 聚合审计计数。使用 **latest-exit 视图**（重试步骤反映最新结果）。无 I/O、无副作用。

```js
// 导出接口

/**
 * 从 journal events 聚合审计摘要。
 *
 * 内部流程：
 * 1. 过滤出当前 run + 当前 stage 的 entry/exit 事件。
 * 2. 调用 chain-topology.discoverChainNodes（first-exit 视图）确定可达链路节点集。
 *    可达集现在是 ChainNode[]，包含 step_id + journal_entry_id 两个维度。
 * 3. 对可达节点，按 (step_id, journal_entry_id) 键取 latest-exit 统计
 *    passed/blocked/skipped 计数。
 *    注意：latest 统计的范围限定在"该链路节点对应的 exit 事件"，
 *    不允许跨 journal_entry_id 的同名 step_id exit 事件相互覆盖。
 * 4. 统计 rollback_count（限 workflow_run_id + 可达节点集）。
 * 5. [疑虑3已解决] 消费 receipt_write_warn 事件：
 *    若 warn 事件携带 original_exit_payload，且对应的 (step_id, journal_entry_id)
 *    属于可达节点集，则将 original_exit_payload 视同一条 STEP_EXIT 事件纳入计数。
 *    这确保写入失败不导致静默少计：失败的 exit 仍被计入，只是来源是 warn 事件内嵌的 payload。
 *    若同一节点已有正常写入的 STEP_EXIT，则 warn 内嵌 payload 被忽略（正常写入优先）。
 *    字段对齐规则：匹配时取 `original_exit_payload.exit_journal_entry_id`
 *    与 `ChainNode.journal_entry_id` 比对——两个字段名不同但值相同（均为对应 entry 事件的唯一 ID）。
 *    实施者禁止用 exit 事件自身行 ID 或 step_id 单独做匹配键。
 *
 * first-exit（拓扑用）和 latest-exit（计数用）的分工在此函数内部明确隔离：
 * 拓扑发现只调用 chain-topology 模块，计数只用 latestByStepAndEntry。
 *
 * @param {object[]} events - journal.jsonl 全部解析后的事件数组
 * @param {{ stageSlug: string, workflowRunId: string }} options
 * @returns {{ audit_summary: AuditSummary, warnings: string[] }}
 */
export function buildAuditSummaryFromJournalEvents(events, { stageSlug, workflowRunId }) { ... }

/**
 * 从事件列表中，按 (step_id, journal_entry_id) 取最后一次出现的 exit 记录（latest-exit 语义）。
 * key 格式：`${step_id}::${journal_entry_id}`
 * @param {object[]} exitEvents
 * @returns {Map<string, object>}
 */
export function latestByStepAndEntry(exitEvents) { ... }

/**
 * 兼容辅助：按 step_id 取最后一次出现的记录（粗粒度 latest，不区分 attempt）。
 * 仅在不需要 attempt 粒度的内部工具场景使用，不应用于主计数路径。
 * @param {object[]} events
 * @returns {Map<string, object>}
 */
export function latestByStepId(events) { ... }
```

**关键设计点**：
- `first-exit`（拓扑）和 `latest-exit`（计数）分别由不同函数承载，命名明确，不再混在一个作用域里。
- 计数粒度从 `step_id` 升级到 `(step_id, journal_entry_id)`，彻底消除跨重试链路的覆盖风险。
- `rollback_count` 严格限定 `workflow_run_id` 相同且 `affected_step_id` 在可达节点集内（历史踩坑点已固化为此处注释）。
- 写入失败的 exit 通过 warn 事件内嵌 payload 被聚合器显式消费，不静默少算。

**不导出**：isStageStepId（内部工具）。

---

### 3.5 `runtime/evidence/receipt-writer.mjs`（重构后：薄门面）

**职责**：组合上述 3 个新模块，暴露对外公开 API。不含任何业务逻辑。

```js
// 公开 API（与当前版本接口完全兼容）

export { journalPathForTaskDir } from "./journal-appender.mjs";
export { buildAuditSummaryFromJournalEvents } from "./audit-aggregator.mjs";

export async function writeEntryReceipt(taskId, payload) {
  validateEntryPayload(payload);
  await appendJournalLine(taskId, buildJournalEvent(JOURNAL_EVENT_TYPES.STEP_ENTRY, payload));
}

export async function writeExitReceipt(taskId, payload) {
  // 非阻塞合约：校验失败（validateExitPayload 抛出）仍应阻断——调用方传错就报错。
  // 只有"写入磁盘"失败才走非阻塞路径。此分工在此处明确，不再有歧义。
  validateExitPayload(payload);
  try {
    await appendJournalLine(taskId, buildJournalEvent(JOURNAL_EVENT_TYPES.STEP_EXIT, payload));
  } catch (err) {
    // [疑虑3已解决] 将原始 payload 完整传入 warn，不丢弃任何字段。
    // appendReceiptWriteWarn 内部将 payload 嵌入 warn 事件的 original_exit_payload 字段，
    // audit-aggregator 消费 warn 事件时可从中恢复计数。
    await appendReceiptWriteWarn(taskId, err, payload);
  }
}

export async function writeStepAutoRollback(taskId, payload) {
  validateStepAutoRollbackPayload(payload);
  await appendJournalLine(taskId, buildJournalEvent(JOURNAL_EVENT_TYPES.STEP_AUTO_ROLLBACK, payload));
}
```

**非阻塞合约说明**（历史踩坑固化）：

> - `validateExitPayload` 抛错 = 调用方传参有误，**应当** 向上传播，不进非阻塞路径。
> - `appendJournalLine` 抛错 = 磁盘/权限写入失败，**不应** 阻断步骤，走 appendReceiptWriteWarn。
> - 这两种失败模式之所以被分别对待，是因为前者是"调用方 bug"，后者是"运行时环境问题"。两者不得混淆。
> - 写入失败时，原始 exit payload 通过 `appendReceiptWriteWarn` 第三参数完整保留在 warn 事件中，确保审计计数不静默丢失。

---

## 4. 迁移路径

迁移设计原则：**不大爆炸重写**，分 3 个可独立验证的步骤，每步完成后可单独 commit 并跑测试。

### Step 1：提取纯函数模块（无 breaking change）

创建 `chain-topology.mjs` 和 `audit-aggregator.mjs` 和 `receipt-schema.mjs`，将对应函数从 receipt-writer.mjs 搬入，receipt-writer.mjs 改为从这些模块 import 后再使用。

- 对外接口**完全不变**（调用方无感知）。
- 可新增针对各模块的单元测试（见第 5 节）。
- 风险：低。纯搬移，可逐行 diff 验证。

### Step 2：提取 I/O 层

创建 `journal-appender.mjs`，将 `journalPathForTask`、`appendJournalLine`、`appendReceiptWriteWarn` 从 receipt-writer.mjs 搬入。receipt-writer.mjs 改为 import。

- `journalPathForTaskDir` 已是公开导出，在此步确认仍从 receipt-writer.mjs 再导出（兼容 facts-assembly.mjs 的 import 路径）。
- 风险：低。I/O 逻辑未变，仅模块边界移动。

### Step 3：门面精简

receipt-writer.mjs 只保留 3 个公开 write 函数 + 2 个 re-export，删除所有已迁出的内部函数。

- 可 diff 确认 receipt-writer.mjs 行数降至约 40 行。
- 风险：低。前两步完成后，此步基本只是删除代码。

### 调用方改动清单

| 调用方 | 当前 import | 需要改动 |
|--------|------------|---------|
| `workflows/verify-code/facts-assembly.mjs` | `buildAuditSummaryFromJournalEvents`, `journalPathForTaskDir` from `receipt-writer.mjs` | **不需要改**（门面继续 re-export） |
| `core/__tests__/receipt-writer.test.mjs` | 全量 import from `receipt-writer.mjs` | 可选：补充针对子模块的直接单测（见第 5 节），原有测试继续通过 |
| `tests/verify-code-facts.test.mjs` | 间接通过 facts-assembly | **不需要改** |
| 其他 SKILL.md 引用 | 引用路径 `runtime/evidence/receipt-writer.mjs` | **不需要改**（路径不变） |

---

## 5. 测试迁移方案

### 5.1 现有测试处理

`core/__tests__/receipt-writer.test.mjs`（1135 行）中已有的测试**全部保留**，继续通过门面接口运行。迁移后不应出现任何测试回归。

### 5.2 新增单元测试（各模块独立可测的收益实现点）

**`chain-topology.test.mjs`**（目标：隔离拓扑逻辑，不需要 I/O）
- `discoverChainNodes` 正常链、有环、重复头、missing_link 各分支
- 验证返回的 `chainNodes` 包含 `journal_entry_id` 和 `attempt_index`（不只是 step_id 字符串）
- 验证同一 step_id 两次出现时，两个节点的 `journal_entry_id` 不同，互不覆盖
- 验证 next_step_id 指针不匹配时的 pointer_mismatch 警告

**`audit-aggregator.test.mjs`**（目标：隔离计数逻辑，不需要 I/O）
- passed/blocked/skipped 计数正确
- 重试场景：同一 step_id 两条 exit（不同 journal_entry_id），latest 状态为 passed，计数应为 passed（不是 blocked）
- 跨链路隔离：同 step_id 但属于不同链路实例的 exit，不互相覆盖计数
- rollback_count 仅计入当前 workflow_run_id + 可达节点的 rollback 事件
- 跨 run 的 rollback 事件不计入
- receipt_write_warn 携带 original_exit_payload 时，对应节点被正确计入计数
- receipt_write_warn 对应节点已有正常 STEP_EXIT 时，warn 内嵌 payload 被忽略（正常写入优先）

**`receipt-schema.test.mjs`**（目标：隔离 review 两种形状，无需 I/O）
- `validateReviewPayload({ executed: true, ... })` 缺必填字段抛 TypeError
- `validateReviewPayload({ executed: false, ... })` 缺 source/provider 抛 TypeError（即使 executed=false，这两个字段也必须有值）
- `validateReviewPayload({ executed: false, skipped_reason: "..." })` 不含可选字段时通过
- `validateReviewPayload({ executed: false, report_path: null })` 应通过（null 合法）
- `validateReviewPayload({ executed: false, report_path: "" })` 应抛（提供了但空字符串格式错误）
- `validateReviewPayload({ executed: false, report_path: "valid/path" })` 应通过
- `validateReviewPayload({ executed: false, verdict: "unknown" })` 应通过（历史真实失败 payload 形状）
- `validateReviewPayload({ executed: false })` 缺 skipped_reason 且缺 error_reason 时抛 TypeError

### 5.3 迁移验证门

迁移完成的验收标准：运行 `vitest run` 全套测试（含原有 1135 行测试），结果与 revert 前一致，不引入新失败。

---

## 6. 宪法自查（F1 / F2 / F4 / Q3 / F9 / F10）

### F1 薄核心

**结论：符合**

拆分将业务逻辑（校验、拓扑、聚合）下沉到独立模块，receipt-writer.mjs 门面仅做调度（调用各子模块、组合结果）。核心调度层（kernel.mjs）不受任何影响，无需改动。拆分后子模块各自可替换，改一个不牵连其他。

### F2 窄契约

**结论：符合**

各模块导出接口：
- `receipt-schema.mjs`：仅暴露 4 个 validate 函数（输入 object，无返回 / 抛 TypeError）。
- `chain-topology.mjs`：仅暴露 `discoverChainNodes` + `firstByStepAndEntry` + `firstByStepId`，返回 `{ chainNodes, warnings }`。
- `audit-aggregator.mjs`：仅暴露 `buildAuditSummaryFromJournalEvents` + `latestByStepAndEntry` + `latestByStepId`，返回 `{ audit_summary, warnings }`。
- `journal-appender.mjs`：仅暴露路径计算 + 两个 append 函数。

每个模块内部实现对外完全不可见。模块间不共享内部状态，不通过全局变量通信。

### F4 质量靠异源审查与人，而非阻断式质量门

**结论：符合，无新增阻断门**

本设计不引入任何新的自动阻断质量门。校验函数（validateExitPayload 等）在调用方传错参数时抛 TypeError——这是"调用方 bug 立即暴露"（F8 Let it crash），不是质量门。

校验失败的处理路径：
- entry/rollback payload 校验失败：抛出，由 SKILL.md 执行者感知并修正（已有行为，不变）。
- exit payload 校验失败：同上，不走非阻塞路径（见第 3.5 节的非阻塞合约说明）。
- I/O 写入失败：`appendReceiptWriteWarn` 记录警告事件 + stderr，不阻断步骤（已有行为，不变）。

无新增"达不到就卡死推进"的自动门。

### Q3 异源审查加人工把关，禁止自审自判

**结论：符合，且设计加强了此原则**

拆分后 `receipt-schema.mjs` 和 `audit-aggregator.mjs` 均为纯函数模块，无 I/O 副作用，可由独立 test runner 在独立上下文中单独验证。这正是"由独立来源产出验证结果"的基础设施。

本设计文档本身遵循 Q3：由 planner agent 起草，需由人或独立 reviewer 确认后方可实施，不自批自判。

### F9 可证伪、不假绿

**结论：符合**

- 校验函数在实际无效输入时真实抛 TypeError（不吞错）。
- `buildAuditSummaryFromJournalEvents` 在缺数据时 `audit_summary` 字段为 0（真实状态），不伪造通过。
- `appendReceiptWriteWarn` 写入失败时输出到 stderr（F9 要求如实标记），不静默吞掉。
- 拓扑遍历中 `missing_chain_head` / `missing_link` 等异常情况通过 `warnings` 数组如实返回，不假装链完整。
- 写入失败的 exit 通过 warn 事件内嵌 payload 被显式消费，audit_summary 计数不静默少算，不假绿。

重要边界：非阻塞合约（I/O 失败不阻断）与"不假绿"不冲突——记录了 `receipt_write_warn` 事件且内嵌完整原始 payload，事实在日志中可见，aggregator 显式消费后计数正确，审查者不会看到虚假的 0 计数。

### F10 自动化按真实收益添加，不为机器可校验堆基建

**结论：符合，本设计克制**

本设计没有：
- 引入新的 CI gate 或 schema 校验流水线。
- 为"让一切可机器校验"新增额外的 schema 定义文件。
- 要求在每个模块上新建机器执行入口。

新增的单元测试（第 5.2 节）收益明确：独立测试 `validateReviewPayload` 的两种 executed 形状是历史振荡的直接原因，补充单测的收益（防止回归）远大于维护成本（纯函数，测试不需要 mock I/O）。

F10 反例警示中提到的"单个 gate 引擎文件 6000+ 行"恰好是把以上 5 种职责合并在一个文件不分离的结果；本设计的拆分方向是离开那个反例，而不是朝它靠拢。

---

## 7. 历史踩坑固化清单

以下是 7 轮 3rd-review 振荡中反复出现的问题，本设计在哪里固化：

| 历史坑点 | 本设计固化方式 |
|---------|-------------|
| first-exit vs latest-exit 混用在一个函数里 | chain-topology 模块接受并要求 `firstByStepAndEntry` 结果；audit-aggregator 内部使用 `latestByStepAndEntry`；两者命名和模块边界明确分离 |
| 同 step_id 不同重试实例互相覆盖 latest 计数 | ChainNode 携带 journal_entry_id，计数键从 step_id 升级到 (step_id, journal_entry_id)，跨重试实例物理隔离 |
| executed=true/false 校验条件随 review 意见反复改 | `validateReviewPayload` 单独导出，executed=false 合法 schema 明确列出（source/provider 必填，report_path 允许 null/省略，skipped_reason/error_reason 至少一个），各自有独立单测 |
| writeExitReceipt 非阻塞合约"写失败应阻断还是不阻断"反复争议 | 第 3.5 节将合约明确写进注释：校验失败（调用方 bug）向上传播；I/O 失败走 warn，这两条路径在代码结构上已经分离 |
| 写入失败后 audit 计数静默少算 | appendReceiptWriteWarn 第三参数携带完整原始 payload；aggregator 显式消费 receipt_write_warn 事件内嵌 payload 纳入计数 |
| rollback_count 是否应跨 run 累积 | audit-aggregator 中 rollback 过滤明确限定 `sameRun(event)` + `reachable.has(event.affected_step_id)`，逻辑集中在一处 |

---

## 8. Codex 异源审查疑虑解决记录

> 来源：`specs/step-gated-audit/receipt-writer-redesign-codex-review.md`（2026-07-03T12:19:07Z）

### 疑虑1：chain-topology 粒度太粗，只返回 step_id 字符串集合

**已解决：** `discoverChainStepIds` 重命名为 `discoverChainNodes`，返回值从 `{ stepIds: string[] }` 改为 `{ chainNodes: ChainNode[], warnings: string[] }`。ChainNode 包含 `step_id`、`journal_entry_id`（选中的 entry 事件唯一 ID）、`attempt_index`、`exit_journal_entry_id`。audit-aggregator 的计数键从 `step_id` 升级到 `${step_id}::${journal_entry_id}`，物理阻断跨重试实例的互相覆盖。相应地，`firstByStepId` 扩展出 `firstByStepAndEntry`、`latestByStepId` 扩展出 `latestByStepAndEntry`，主计数路径强制使用细粒度键，粗粒度键降级为内部辅助。（见 3.3 节、3.4 节）

### 疑虑2：validateReviewPayload 对 executed=false 的 null 字段处理未明确

**已解决：** 在 `validateReviewPayload` 接口注释中明确列出 executed=false 时各字段的合法规则：`source`/`provider` 即使 executed=false 也必须有值；`report_path`/`raw_result_path`/`fix_status` 允许 null 或省略，若提供则必须非空字符串；`verdict` 允许 "unknown" 或 null；`skipped_reason`/`error_reason` 至少提供一个（防伪造跳过）。同时在测试方案（5.2 节）补充覆盖历史真实失败 payload 形状的用例，包括 `report_path: null`、`verdict: "unknown"` 等。（见 3.2 节、5.2 节）

### 疑虑3：receipt_write_warn 与 audit warnings 关系没闭合，写失败时原始 exit payload 丢失

**已解决：** `appendReceiptWriteWarn` 新增第三参数 `exitPayload`，warn 事件结构必须包含 `original_exit_payload` 字段（完整原始 exit payload，不裁剪）。receipt-writer.mjs 门面在 catch 块中将 `payload` 完整传入。audit-aggregator 的 `buildAuditSummaryFromJournalEvents` 显式消费 `receipt_write_warn` 事件：若携带 `original_exit_payload` 且对应节点在可达集内，则视同 STEP_EXIT 纳入计数；若同一节点已有正常写入的 STEP_EXIT，则 warn 内嵌 payload 被忽略（正常写入优先）。这确保写入失败不导致静默少计，F9 可证伪原则不被违反。（见 3.1 节、3.4 节、3.5 节）

---

## 9. 开放问题

以下决策需要人工确认后方可开始实施：

1. **迁移时机**：3 步迁移建议在独立 feature 分支上进行，还是直接在当前 agent worktree 分支上？
2. **门面 re-export 策略**：`buildAuditSummaryFromJournalEvents` 是否也在 receipt-writer.mjs 中 re-export（当前 facts-assembly.mjs 从此处 import），还是要求 facts-assembly.mjs 直接 import 自 audit-aggregator.mjs？建议保留 re-export（零 breaking change），但如有意愿收紧边界可改。
3. **`journal-appender.mjs` 是否应进入 core/ 还是新建 `core/internal/`**：建议放 core/ 与其他模块平级，但如果希望对外只暴露 receipt-writer.mjs 的门面，可以约定 internal/ 子目录表示非公开 API。
4. **journal_entry_id 的生成方式**（已解决）：`journal_entry_id` 由 **journal-appender.mjs 在写入 STEP_ENTRY 事件时生成**，格式为 `${iso_timestamp}_${step_id}`（例如 `2026-07-03T12:00:00.000Z_build-code`）。生成时机是 `appendJournalLine` 被调用写入 STEP_ENTRY 那一刻，写入前赋值到 payload，再落盘，确保 journal 文件中该字段已存在。唯一性范围：**单次 workflow run 内的单 step 单次 entry**——同一 step_id 重试时 timestamp 不同，天然产生不同 ID；不同 run 之间通过 `workflow_run_id` 隔离，无需跨 run 保证全局唯一。上游调用方（receipt-writer.mjs 门面）在调用 `appendJournalLine` 前不生成此字段，字段由 journal-appender 统一注入，不允许调用方自行传入（防止格式不一致）。

5. **exit-to-entry 绑定机制**（已解决）：采用**调用方持有、显式传入**方案。流程如下：（a）receipt-writer.mjs 在调用 `writeStepEntry` 时，从 journal-appender 返回值中取得该次写入生成的 `journal_entry_id`；（b）调用方（workflow executor）将此 ID 存入当前 step 执行上下文，贯穿 step 整个生命周期；（c）调用 `writeStepExit` 时，将持有的 `journal_entry_id` 作为 `exit_journal_entry_id` 字段显式传入。**禁止** exit 时从 journal 文件中反查（按 step_id+attempt_index 扫描），原因：重试场景下同一 step_id 有多个 entry，反查必须遍历且有竞态风险。重试场景保证：每次重试都是独立的 entry 写入，产生独立的 `journal_entry_id`；executor 每次重试开始时重新调用 `writeStepEntry`，拿到当次的 ID，exit 时绑定当次 ID，上一次重试的 entry 与本次 entry 不会混淆。实现要点：`appendJournalLine` 写入 STEP_ENTRY 后须将生成的 `journal_entry_id` 作为返回值返回（`Promise<{ journal_entry_id: string }>`），门面层 `writeEntryReceipt` 相应改为将此值透传给调用方（3.1 节接口声明已同步更新）。

---

*本文档由 planner 出具，不含任何代码实施。实施须经人工确认后交由 executor 执行。*
