# M14b 事实采集层 v2 规格：runtime-facts.v2

## 1. 目标

发布独立、版本化、可审计的 `runtime-facts.v2` 合同，写入任务内 `indexes/runtime-facts-v2.jsonl`，供 M15 的排行、趋势和流程诊断使用。v1 运行事实合同、四个既有索引及既有消费者保持不变。

v2 只在直接机器证据存在时产生值；没有来源输出 `missing`，证据不可判输出 `unknown`。不填零、不猜测、不读取正文或私有内容。

## 2. 已接受决策分类

### Locked（已锁定）

以下决策来自 v2 make-decision accepted，已按原顺序继承。本阶段不重新询问。

1. 独立新增 `runtime-facts.v2` 与 `indexes/runtime-facts-v2.jsonl`；`runtime-facts.v1`、既有索引和消费者保持兼容。
2. 字段完整，不因来源暂缺删除；没有已登记来源时明确记 missing；本期建立完整 v2，可靠来源实际采集，其余缺失。
3. 现有规范记录只在实现后、且对应直接记录存在时，支持 review、verification、human-intervention 与 stage-reconciliation 的 present；运行、transcript 和编排来源登记为空，因此 usage、attribution、automation-rate 现在不得制造数值。
4. 唯一来源：usage=已登记 usage receipt；attribution=已登记 launcher/transcript metadata；review=规范审查记录；verification=规范验证/测试回执；stage reconciliation=阶段清单与规范 journal/receipt；human intervention=规范确认记录；automation rate=已登记 orchestrator dispatch。
5. present 必有唯一登记来源、对象和运行范围；`no_registered_source`/`not_found` 是 missing；读取、格式、损坏或重复冲突是 unknown。去重键为事实类型、来源登记/对象和运行范围；同键同值合并，冲突转 unknown。禁止正文、私有路径、缓存、猜测和补零。
6. 阶段清单是预期，journal/receipt 是实际；规范 skipped receipt 是已跳过，不是缺记录；只有预期项没有终态事实才是 missing-stage。自动化率没有可核实分母时是 missing，不能是 0。

### Unresolved（未决）

无。当前没有需要上游重新选择的范围、字段、来源或消费口径；暂未登记的来源按本规格的 missing 规则处理，不形成新的决策。

### Newly discovered ambiguity（新发现歧义）

无。`spec-clarify` 扫描和正式细节审查中的表述问题均已在本规格闭合，不改变已锁定方向。

## 3. 范围与非目标

### 范围

- 在 `core/fact-indexes.mjs` 的唯一权威边界中闭合 v2 字段、值结构、校验和合并规则。
- 新增 v2 JSONL 索引及十类事实：`cost`、`token`、`duration`、`tool_count`、`attribution`、`review`、`verification`、`stage_reconciliation`、`human_intervention`、`automation_rate`。
- 定义 v1/v2 文件和消费者边界，确保 v1 的 `step_skip`/`automation` 与 v2 的阶段对照/自动化率不重复统计。
- 定义每类唯一来源、输入、输出、缺失/未知、去重、版本、隐私和 fail-loud 规则。

### 非目标

- 不修改 `runtime-facts.v1`、transcript、artifact、flow-health、skills-inventory 或已有消费者。
- 不登记新来源，不写 telemetry adapter，不读原始日志、正文、私有路径或缓存。
- 不迁移或重写 v1，不把 v1 行复制成 v2 行，不新增自动质量门。
- 不用 token、时长、工具次数、文本顺序或默认价格推算缺失值。
- 不在本阶段修改 M15 消费端；本规格只给后续 v2-aware 消费提供唯一口径。

## 4. v1/v2 兼容与消费口径

| 数据 | v1 责任 | v2 责任 | M15 聚合边界 |
|---|---|---|---|
| 原始跳步 | v1 `step_skip` 记录 canonical skipped receipt | v2 `stage_reconciliation.value.observed_state=skipped`，保留 skip receipt ID | 阶段结果只按 v2 reconciliation 计一次；v1 只作原始证据，不另加一项 |
| 原始自动派发 | v1 `automation` 记录单次 dispatch | v2 `automation_rate` 读取已登记 dispatch aggregate | 自动化率只用 v2 aggregate；不把 v1 dispatch 再加到 v2 numerator |
| 成本/使用量 | v1 文件和旧消费者不变 | v2 `cost`/`token` 只读 v2 唯一 usage receipt | v1 不作为 v2 数值的回退或重复来源 |
| 会话/代理信息 | v1 文件和旧消费者不变 | v2 `attribution` 只读登记的 launcher/transcript metadata | 不从 v1 文本或顺序推 v2 归属 |
| 审查/验证/阶段/人工 | v1 无对应新聚合 | v2 只接收各自规范记录 | 每类只按 v2 事实和直接 evidence 统计 |

- v1 文件仍是 `indexes/runtime-facts.jsonl`，schema 版本仍为 `runtime-facts.v1`；v2 文件只写 `indexes/runtime-facts-v2.jsonl`。
- v1/v2 记录不会跨文件 merge；不因 v2 缺失改写 v1。任何 v2-aware consumer 都以 v2 行为新指标的唯一事实来源，v1 仅作为兼容数据和原始证据。
- v2 的阶段对照是“预期 topology 对实际终态”的结果；预期清单本身不是执行事实。

## 5. v2 记录信封

每行是一个 UTF-8 JSON 对象，单行、末尾换行。顶层字段固定，不允许额外字段：

```json
{
  "schema_version": "runtime-facts.v2",
  "collector_version": "1.0.0",
  "fact_id": "rf2_<sha256>",
  "fact_type": "cost|token|duration|tool_count|attribution|review|verification|stage_reconciliation|human_intervention|automation_rate",
  "status": "present|missing|unknown",
  "value": null,
  "source": {
    "class": "usage_receipt|launcher_transcript_metadata|review_record|verification_receipt|stage_topology_journal|human_confirmation_record|orchestrator_dispatch",
    "registration_id": "string|null",
    "object_id": "string|null"
  },
  "observed_at": "RFC3339 UTC timestamp",
  "reason": "null|no_registered_source|not_found|read_error|unsupported_format|malformed_line|duplicate_id_conflict",
  "error": null,
  "scope": {
    "run_id": "string",
    "session_id": "string|null",
    "agent_id": "string|null",
    "stage": "string|null",
    "step": "string|null",
    "attempt_id": "string|null"
  }
}
```

### 信封约束

- `schema_version` 固定为 `runtime-facts.v2`。字段、类型、枚举、reason 或语义变化必须升 schema version；parser bugfix/refactor 只改 `collector_version`。
- `fact_id` 是稳定去重 ID，计算自 `{fact_type, source.class, source.registration_id, source.object_id, scope}` 的 canonical JSON SHA-256，前缀 `rf2_`，格式必须匹配 `^rf2_[a-f0-9]{64}$`。scope 的六个键都参与计算；聚合事实的时间范围只放在自己的 value 字段，不扩大通用 scope。
- `status=present` 时 value、source.registration_id、source.object_id、scope.run_id 非空；reason/error 必须为 null。
- `status=missing` 时 value=null，reason 只能为 `no_registered_source` 或 `not_found`，error=null。无登记来源时 source 的 registration_id/object_id 必须为 null。
- `status=unknown` 时 value=null，reason 只能为 `read_error`、`unsupported_format`、`malformed_line`、`duplicate_id_conflict`，error 必须是稳定且去敏的 `{code,message}`。
- `scope.run_id` 必须来自当前运行上下文；其余五个 scope 字段缺失时为 null，不推断。automation_rate 的 period_start/period_end 只接受聚合来源直接提供的时间范围。
- source class 必须与 fact_type 的唯一映射一致；object_id 必须是直接来源的稳定对象 ID，不得用正文、私有路径、数组位置或当前时间拼造。
- `source.object_id` 必须绑定对应 value 的稳定主 ID：`cost→cost_id`、`token→usage_id`、`duration/tool_count→execution_id`、`attribution→attribution_id`、`review→review_id`、`verification→verification_id`、`stage_reconciliation→reconciliation_id`、`human_intervention→intervention_id`、`automation_rate→aggregation_id`。
- 同一 `usage_receipt` source class 在不同 fact_type 下可直接提供各自事实的对象 ID；这是来源内的事实级直接标识，不是 ID 转换或新增来源。其绑定仍按上一条映射逐类执行。
- 错误 message 不得包含正文、私有路径、缓存内容、token、凭据或可还原原始输入。

### 唯一来源映射

| fact_type | source class | present 的直接来源 | 当前无来源/缺证据时 |
|---|---|---|---|
| `cost` | `usage_receipt` | 登记 usage receipt | `missing/no_registered_source` 或 `missing/not_found` |
| `token` | `usage_receipt` | 登记 usage receipt 的直接 token 数 | `missing/no_registered_source` 或 `missing/not_found` |
| `duration` | `usage_receipt` | 登记 usage receipt 的直接开始、结束、时长 | `missing/no_registered_source` 或 `missing/not_found` |
| `tool_count` | `usage_receipt` | 登记 usage receipt 的直接工具调用计数 | `missing/no_registered_source` 或 `missing/not_found` |
| `attribution` | `launcher_transcript_metadata` | 登记 launcher/transcript metadata 的直接归属关系 | `missing/no_registered_source` 或 `missing/not_found` |
| `review` | `review_record` | 规范审查记录 | 记录不存在为 `missing/not_found`；读取失败为 unknown |
| `verification` | `verification_receipt` | 规范验证/测试回执 | 记录不存在为 `missing/not_found`；读取失败为 unknown |
| `stage_reconciliation` | `stage_topology_journal` | 已登记阶段清单作为 expected、已登记规范 journal/receipt 作为 observed 的双输入对照；由 v2 逻辑生成 reconciliation | 任一登记输入缺失为 missing；格式/读取错误为 unknown |
| `human_intervention` | `human_confirmation_record` | 规范确认记录 | 记录不存在为 `missing/not_found`；读取失败为 unknown |
| `automation_rate` | `orchestrator_dispatch` | 登记 orchestrator dispatch 及可核实分母 | 无登记或分母为空为 missing |

每个 fact_type 一次采集最多一个 source class。重复登记、source class 不匹配或 registration identity 不一致是完整性错误：不写部分 v2 结果并 fail-loud。

## 6. 十类 v2 value 结构

`status=present` 的 value 只能是下列精确对象；不得增加自由字段。所有 ID 都是不含正文和私有路径的稳定公开标识。

### `cost`

```json
{"cost_id":"string","receipt_id":"string","amount_minor":"non-negative integer","currency":"ISO-4217 uppercase string","unit":"string","line_item_id":"string|null","period_start":"RFC3339 UTC timestamp|null","period_end":"RFC3339 UTC timestamp|null"}
```
`cost_id` 是 usage receipt 中该成本行的稳定对象 ID；若 receipt 没有 line item，则使用 receipt_id，且此时 `source.object_id` 绑定回落后的 `cost_id`（即 `receipt_id`）。金额、币种、单位和期间必须直接来自 usage receipt；不得按 token、时长、模型或默认价格计算。

### `token`

```json
{"usage_id":"string","input_tokens":"non-negative integer","output_tokens":"non-negative integer","total_tokens":"non-negative integer","unit":"tokens"}
```
所有 token 数直接来自 usage receipt；没有 receipt 不能估算。`total_tokens` 也只落盘 receipt 原值，不强制等于 `input_tokens + output_tokens`，因为来源可能包含缓存或计费口径差异。`source.object_id` 的统一绑定见第 5 节信封约束。

### `duration`

```json
{"execution_id":"string","duration_ms":"non-negative integer","started_at":"RFC3339 UTC timestamp","ended_at":"RFC3339 UTC timestamp","measure":"wall_clock|active"}
```
只接受 usage receipt 直接提供的时间或时长；不以缺失时间补默认时长。

### `tool_count`

```json
{"execution_id":"string","total_calls":"non-negative integer","successful_calls":"non-negative integer","failed_calls":"non-negative integer","unknown_calls":"non-negative integer"}
```
计数必须直接来自 usage receipt；`total_calls` 必须等于 `successful_calls + failed_calls + unknown_calls`，三个分类桶穷尽总调用数。

### `attribution`

```json
{"attribution_id":"string","subject_kind":"string","subject_id":"string","attributed_kind":"string","attributed_id":"string","relation":"string"}
```
只接收 launcher/transcript metadata 的直接关系。不得按消息正文、调用顺序或时间推断 subject、agent、session 或 parent。

### `review`

```json
{"review_id":"string","stage":"string","verdict":"pass|revise_required|unavailable","finding_count":"non-negative integer","reviewer_count":"positive integer","evidence_id":"string"}
```
只接收规范审查记录的公开结果和 evidence ID；不写 provider 私有路径、原始输出或私有 session。

### `verification`

```json
{"verification_id":"string","stage":"string","result":"pass|fail","passed_count":"non-negative integer","failed_count":"non-negative integer","evidence_id":"string"}
```
只接收规范验证/测试回执；不得以没有回执推断 pass。

### `stage_reconciliation`

```json
{"reconciliation_id":"string","stage":"string","expected_topology_id":"string","expected_step_id":"string","observed_state":"completed|failed|skipped|missing-stage","terminal_fact_id":"string|null","skip_receipt_id":"string|null"}
```
- `stage_topology_journal` 不是新增来源，而是 accepted 决策已批准的两个输入边界：登记阶段清单提供 `expected_topology_id`/`expected_step_id`，登记规范 journal/receipt 提供实际终态。
- 对 `stage_reconciliation`，`source.registration_id` 只接受 source registry 已登记的 `stage_topology_journal` 双输入配对 registration；该 registration 仅标识阶段清单与 journal/receipt 的既有配对，不新建来源。若两个输入没有已登记配对 registration，则输出 `missing/no_registered_source`。
- `reconciliation_id` 是 `{stage, expected_topology_id, expected_step_id, terminal_fact_id, skip_receipt_id}` 的 canonical JSON SHA-256 稳定 ID；source.object_id 绑定该稳定对照对象，不绑定数组位置或新来源。
- expected topology 来自阶段清单，actual state 只来自 journal/receipt。
- `observed_state=skipped` 必须有 skipped receipt；它是已跳过，不是缺记录。
- `observed_state=missing-stage` 表示已有预期项但没有终态事实；该 reconciliation 记录本身是 present，不能把它伪装成 skipped 或普通 not_found。
- `completed|failed` 必须有 terminal_fact_id；`skipped` 必须有 skip_receipt_id；`missing-stage` 两者都为 null。

### `human_intervention`

```json
{"intervention_id":"string","kind":"string","actor_id":"string","action":"string","reason":"string","started_at":"RFC3339 UTC timestamp|null","ended_at":"RFC3339 UTC timestamp|null"}
```
只接收规范确认记录；actor 只存登记的公开 ID，不存姓名、正文或私有身份信息。

### `automation_rate`

```json
{"aggregation_id":"string","scope_kind":"run|stage|step","automated_count":"non-negative integer","manual_count":"non-negative integer","denominator":"positive integer","rate_ppm":"integer 0..1000000","period_start":"RFC3339 UTC timestamp|null","period_end":"RFC3339 UTC timestamp|null"}
```
- denominator 是同一 scope 内所有可核实、且明确归类为 automated 或 manual 的 dispatch 记录；可读取但无法完成这两个分类之一的 dispatch 不属于可核实自动化率输入并排除在分母外。present 时必须大于 0。
- `period_start`/`period_end` 必须直接来自 dispatch aggregate；没有时间范围时为 null。`denominator = automated_count + manual_count`；`rate_ppm = Math.round((automated_count * 1000000) / denominator)`，结果为确定性的整数 0..1000000。分母不可核实或等于 0 时输出 `status=missing`；source 已登记但没有可核实 dispatch 终值或分母为 0 时，`reason=not_found`，不输出 0。
- 只使用 v2 登记的 orchestrator dispatch aggregate；不能把 v1 automation 行再次加进分子或分母。

## 7. 状态、缺失、未知和写入

1. 先验证任务身份、v2 source registry、scope.run_id、source 唯一性和输入 schema；失败时不写部分结果。
2. 无登记来源输出 `status=missing`、`reason=no_registered_source`；已登记对象不存在输出 `status=missing`、`reason=not_found`。两者 value 都是 null。
3. 读取失败、格式不支持、坏行、重复 ID 内容冲突分别输出 unknown；不能从文件不存在、旧 schema 或空数组推断新的 unknown reason。没有登记 source 时仍是 missing/no_registered_source。
4. `missing-stage` 只存在于 stage reconciliation 的 present value；不是 unknown reason，不是 skipped，不是自动化率为 0。
5. missing/unknown 是事实状态，不阻断主流程；身份、schema、来源注册冲突、隐私违规和 index 写入失败必须 fail-loud。
6. 结果按 canonical JSON 序列化为 UTF-8 JSONL；先全批次校验、merge、排序，再原子写入。写入异常不转成 missing/unknown。

## 8. 去重、合并和版本

- 去重键就是 fact_id，语义等价于 fact_type + source class/registration/object + 完整 scope。
- 同 key 且稳定 payload 一致时合并成一条；比较 hash 排除 observed_at 和 collector_version，避免重复采集制造重复行。
- 同 key payload 冲突时只保留一条 `status=unknown`、`reason=duplicate_id_conflict`、value=null 的冲突事实；不采用 first-wins 或 last-wins。
- v2 schema 变化必须新版本；不能把 v1 记录迁移到 v2，也不能用 collector_version 隐藏字段变化。
- v1 和 v2 分开校验、分开写入、分开保留；既有 v1 fixtures 和消费者 bytes 不得变化。

## 9. 隐私与错误安全

- 不写 message body、content、text、原始 transcript、私有路径、缓存、凭据或 provider 私有 session。
- token、duration、tool_count、cost 只能来自直接登记记录；没有来源只能 missing，不得补零或按经验估算。
- error 只允许稳定 code/message；message 不能泄露原始输入。
- 记录 ID 可用于审计回指，但不得是绝对路径或可还原正文的编码。

## 10. 稳定需求

- **FR-V2-001 独立版本与文件**：创建 `runtime-facts.v2` 和 `indexes/runtime-facts-v2.jsonl`，不改 v1 文件、schema、消费者。
- **FR-V2-002 唯一权威**：v2 字段、校验、fact_id、merge 和错误定义以 `core/fact-indexes.mjs` 为唯一权威位置。
- **FR-V2-003 固定信封**：每行只含第 5 节定义的固定顶层字段，scope 六键齐全。
- **FR-V2-004 封闭类型**：fact_type 只允许十类 v2 类型，value 只允许第 6 节结构。
- **FR-V2-005 来源唯一**：每类只接收映射表指定 source class；present 必有登记、对象和运行范围。
- **FR-V2-006 成本与使用量**：cost/token 只接收 usage receipt，数值不得估算。
- **FR-V2-007 时长**：duration 只接收已锁定 usage receipt 的直接值；当前无 usage 来源时输出 missing。
- **FR-V2-008 归属**：attribution 只接收 launcher/transcript metadata 的直接关系，不做猜测。
- **FR-V2-009 审查验证**：review/verification 只接收规范记录和回执，不读原始 provider 输出。
- **FR-V2-010 阶段对照**：expected topology 与 observed journal/receipt 分离，明确 completed、failed、skipped、missing-stage。
- **FR-V2-011 人工介入**：human_intervention 只接收规范确认记录和登记 actor ID。
- **FR-V2-012 自动化率**：automation_rate 只接收登记 dispatch aggregate；分母为空或不可核实时 missing，不是 0。
- **FR-V2-013 缺失未知**：missing/unknown reason、value、error 组合严格按第 7 节执行；missing-stage 不与 skipped 混淆。
- **FR-V2-014 去重冲突**：同 key 同值合并；冲突转 unknown，不覆盖事实。
- **FR-V2-015 v1/v2 消费边界**：v1 step_skip 与 v2 skipped reconciliation、v1 automation 与 v2 automation_rate 不重复统计。
- **FR-V2-016 版本演进**：schema 改动升 schema_version；parser-only 改动只升 collector_version；不迁移 v1。
- **FR-V2-017 隐私安全**：禁止正文、私有路径、缓存、凭据、原始输出和私有 session。
- **FR-V2-018 fail-loud**：身份、schema、source registry、隐私和写入完整性失败可观察并阻断本次采集；missing/unknown 不阻断主流程。
- **FR-V2-019 M15 边界**：本阶段不修改 M15；任何 v2-aware consumer 只按 v2 的唯一聚合口径读取新事实，不从 v1 做重复回退。
- **FR-V2-020 工具次数**：tool_count 只接收已锁定 usage receipt 的直接值；当前无 usage 来源时输出 missing，分类计数必须穷尽 total_calls。

## 11. 验收标准

- **AC-V2-001 信封校验**：fixture 覆盖 present、missing、unknown；所有顶层字段和 scope 六键存在，额外字段被拒绝，schema_version 固定为 runtime-facts.v2。
- **AC-V2-002 十类 schema**：十类 fact_type 各有合法 present fixture；非法类型、source class、value 字段或 value 额外字段被拒绝。
- **AC-V2-003 来源和对象**：present 行的 registration_id、object_id、scope.run_id 均来自直接登记记录，且 value 主 ID 与 source.object_id 一致。
- **AC-V2-004 无来源**：未登记 source 的每个适用类型输出 missing/no_registered_source，value=null，不扫描私有来源，不填零。
- **AC-V2-005 缺失未知**：not_found、read_error、unsupported_format、malformed_line、duplicate_id_conflict 各有独立 fixture，状态、reason、value、error 精确匹配。
- **AC-V2-006 成本 token**：usage receipt 给出成本和 token 时原值落盘；`total_tokens` 保持 receipt 原值，不强制等于 input/output 之和；receipt 不存在时 missing；没有 token 估算、默认价格或零值补全。
- **AC-V2-007 时长**：usage receipt 给出 duration 时原值落盘；时间和非负计数约束通过；缺来源不生成伪值。
- **AC-V2-008 归属隐私**：只接受 launcher/transcript metadata 的直接 attribution；含正文、私有路径或顺序推断输入被拒绝或 unknown，不落敏感内容。
- **AC-V2-009 审查验证**：规范 review/verification 记录能生成 present；缺回执不判 pass；原始 provider 输出和私有 session 不进入 index。
- **AC-V2-010 阶段对照**：测试 completed、failed、skipped、missing-stage；skipped 必有 skip receipt，missing-stage 仅在预期项无终态事实时出现，二者不混淆。
- **AC-V2-011 自动化率**：有正分母时按固定公式输出 rate_ppm；分母为空、不可核实或为 0 时输出 `missing/not_found`（source 已登记但无可核实终值），不输出 0；未登记 source 仍为 `missing/no_registered_source`；v1 automation 不重复计数。
- **AC-V2-012 去重**：同 key 同值重复输入只留一条；同 key 不同值生成一条 duplicate conflict unknown，不 first-wins/last-wins。
- **AC-V2-013 版本兼容**：parser-only 变化只改 collector_version；字段/枚举/语义变化要求新 schema_version；v1 fixture、文件 bytes 和既有消费者测试不变。
- **AC-V2-014 fail-loud**：身份、schema、source 注册冲突、隐私违规、原子写入失败均可断言且无部分 v2 成功；missing/unknown 仍不阻断主流程。
- **AC-V2-015 消费边界**：给定 v1 skip、v2 skipped reconciliation、v1 automation、v2 automation_rate 输入，按第 4 节口径计算的聚合结果中每项只计一次；v2 缺失不能回退为零或重复聚合。本验收验证口径/fixture，不要求本阶段修改 M15 消费端。
- **AC-V2-016 工具次数**：usage receipt 给出 tool_count 时原值落盘；`total_calls = successful_calls + failed_calls + unknown_calls`；缺来源不生成伪值。
- **AC-V2-017 fact ID**：给定固定 `{fact_type, source.class, source.registration_id, source.object_id, scope}`，`fact_id` 必须匹配 `^rf2_[a-f0-9]{64}$`，且等于 `rf2_` + `hex(SHA256(canonical JSON of {fact_type, source.class, source.registration_id, source.object_id, scope}))`；`rf2_` 只作为输出前缀，不进入哈希输入，不得随机生成。

## 12. 验收场景矩阵

| 场景 | 输入 | 期望 |
|---|---|---|
| v2 present | 合法登记来源和对象 | 一条 present，value/source/scope 可回指 |
| 无来源 | registry 没有 source class | missing/no_registered_source，value=null |
| 对象不存在 | source 已登记但 object 不存在 | missing/not_found，value=null |
| 读取失败 | source reader 返回错误 | unknown/read_error，稳定去敏 error |
| 格式/坏行 | 版本不支持或 JSONL 损坏 | unknown/unsupported_format 或 malformed_line |
| 重复冲突 | 同 key 不同 payload | unknown/duplicate_id_conflict，不覆盖 |
| skipped | 预期 step 有 canonical skipped receipt | present reconciliation，observed_state=skipped |
| missing-stage | 预期 step 没有任何终态 journal/receipt | present reconciliation，observed_state=missing-stage |
| 空自动化分母 | source 已登记但 dispatch aggregate 分母不可核实或为 0 | missing/not_found，不输出 rate=0 |
| v1/v2 同时存在 | v1 raw event 与 v2 aggregate/reconciliation | 每项只计一次，不跨文件重复 merge |
| 写入失败 | index 原子写入或身份校验失败 | fail-loud，无部分 v2 成功 |

## 13. 风险、假设和交接

- 当前 usage、attribution、automation-rate 等定量来源登记为空，排行和趋势只能部分使用；对应字段保持 missing 是正确结果。
- review、verification、stage reconciliation、human intervention 只有在实现后且对应直接规范记录存在时才能 present。
- 未来登记 source 必须先做独立决策并提供新输入契约；本阶段不扩展采集源。
- M15 消费端本阶段不改；下游必须按 v1/v2 口径避免 skip、automation 双重统计。
- build-plan 的精确输入：FR-V2-001–FR-V2-020、AC-V2-001–AC-V2-017、v2 信封、十类 value 结构、唯一来源映射、状态/去重/版本/隐私/fail-loud 规则和 v1/v2 消费矩阵。

## 14. 歧义扫描

上游决策已锁定来源策略、版本边界、v1 兼容、缺失/未知、skip 与 missing-stage、自动化分母和禁止项。当前 draft 没有会改变范围、验收、接口、数据、安全或运维的新增歧义；`spec-clarify`: trigger=false — no material ambiguity。未来 source 登记属于新的上游决策，不在本阶段默认补齐。
