# M14b 事实采集层规格：runtime-facts

## 1. 目标

新增一个任务内事实索引 `indexes/runtime-facts.jsonl`，为 M15 提供六类可追溯、可验证的运行事实：`cost`、`conversation`、`session`、`subagent`、`step_skip`、`automation`。现有 `transcript`、`artifact`、`flow-health`、`skills-inventory` 四份索引保持原 schema、字段、写入语义和消费者兼容。

本规格只定义机器事实契约和采集边界。不通过 LLM、文本顺序、token 数、私有缓存或原始对话正文补事实。没有直接机器证据时，输出明确的 `missing` 或 `unknown`，不把缺口伪装成成功数据。

## 2. 上游锁定决策

以下四项决策来自已接受的 make-decision，顺序、范围和含义保持不变。它们是锁定约束，不在本阶段重新询问。

### 决策 1：统一行结构

- 新增独立任务内索引 `indexes/runtime-facts.jsonl`。
- 保留 transcript、artifact、flow-health、skills-inventory 四个现有索引及其 schema 不变。
- `fact_type` 封闭为：`cost`、`conversation`、`session`、`subagent`、`step_skip`、`automation`。
- 每行固定包含版本、事实 ID/类型、状态、值、来源、时间、原因、安全错误和 run/session/agent/stage/step/attempt 归属。
- 不改旧索引、不读取原始私有日志、不增加第二套任务身份。
- 选择独立 index，不把不同粒度的事实塞进 health 或 transcript。
- M15 新读一个 task-local JSONL；旧消费者不变。
- 未来新增事实类型必须新 schema_version。

### 决策 2：字段值和机器来源

- `cost` 只接收登记的 billing/usage receipt。
- `conversation` 只存 message metadata，不存正文。
- `session` 与 `subagent` 只接收 launcher 已登记 adapter 的 ID 和父子关系。
- `step_skip` 只接收 canonical receipt 的 skipped、原因、authorizer。
- `automation` 只接收 launcher/orchestrator dispatch 记录。
- 当前没有 cost、归属或 automation 的已登记机器来源；这些类别在来源批准前输出 `missing/no_registered_source`。
- 成本不得由 token 估算，父子关系不得按文本或顺序推断。
- 每个已填充 `fact_type` 只有一个 source class；不在本阶段增加 adapter。

### 决策 3：缺失和未知

- 无已登记来源：`missing/no_registered_source`。
- 已登记且应有对象但找不到：`missing/not_found`。
- `unknown` 原因只允许：`read_error`、`unsupported_format`、`malformed_line`、`duplicate_id_conflict`、`legacy_not_collected`。
- 非 `present` 的 `value` 必须为 `null`。
- 错误只能是去敏后的稳定 code/message。
- 不把 `missing` 当成成功数据。

### 决策 4：版本与行为边界

- 新 index 使用独立版本。字段、类型、枚举、原因或语义改变时提升 `schema_version`；parser bugfix/refactor 只改 `collector_version`。
- `missing`/`unknown` 不阻断流程；身份和写入完整性异常必须 fail-loud。
- 旧消费者继续读取四个旧 index；事实采集不是质量 gate。
- 新数据源不属于本阶段。

## 3. 范围与非目标

### 范围

- 建立第五个任务内 JSONL 索引及其 `runtime-facts.v1` 行契约。
- 从已登记的机器来源读取六类事实。
- 写入 present、missing、unknown 三种状态，包含统一原因、错误和归属字段。
- 做来源唯一性、输入 schema、去重、版本和写入错误校验。
- 提供可独立验证的 schema、采集和兼容验收。

### 非目标

- 不修改四个现有索引或其消费者。
- 不增加 adapter、billing provider、launcher registry、global analytics 或第二套任务身份。
- 不保存原始对话正文、私有日志、私有缓存或 token 估价。
- 不按文本内容、出现顺序或启发式推断 session/subagent 父子关系、归属或成本。
- 不把 missing/unknown 自动升级为流程失败、质量 verdict 或阻断。
- 不做迁移补采；旧任务只有直接机器信号时才可表达 `legacy_not_collected`。

## 4. 输入、来源和职责

采集器只接收当前 run 提供的来源注册表、来源对象和已认证的任务归属。注册表是唯一来源入口；采集器不得自行扫描目录、读取私有日志或创建来源注册。

| fact_type | 唯一 source class | present 时允许的直接证据 | 当前无来源时的行为 |
|---|---|---|---|
| `cost` | `billing_usage_receipt` | 登记 receipt 的金额、币种、计费单位和 receipt ID | `missing/no_registered_source` |
| `conversation` | `message_metadata` | 登记 message metadata；只保留白名单字段 | 已登记但对象不存在为 `missing/not_found`；无登记为 `missing/no_registered_source` |
| `session` | `launcher_adapter_registry` | launcher 登记的 session ID、adapter ID 和直接 parent session ID | `missing/no_registered_source` |
| `subagent` | `launcher_adapter_registry` | launcher 登记的 agent ID、adapter ID 和直接 parent agent ID | `missing/no_registered_source` |
| `step_skip` | `canonical_skipped_receipt` | canonical receipt 的 skipped、原因、authorizer 和 receipt ref | 普通未跳步不生成事实行 |
| `automation` | `launcher_orchestrator_dispatch` | launcher/orchestrator dispatch ID、动作和结果 | `missing/no_registered_source` |

### 来源唯一性

- 每个 `fact_type` 在一次采集中最多一个已登记 source class。重复登记、同类型多来源或注册表身份不一致是配置/身份完整性错误：采集器不写部分结果并 fail-loud。
- source class 只决定允许的输入边界，不代表有数据。source class 已登记但目标对象找不到，使用 `missing/not_found`。
- 当前已知没有 `cost`、`session/subagent` 归属和 `automation` 的已登记机器来源；因此这些类别不能写 present。若未来 source 被批准，必须另有输入契约和测试，不在本规格默认开启。

## 4A. 现有四索引兼容契约

本阶段不重写四个现有索引的字段 schema，但验收必须明确它们的职责边界。每个现有索引继续使用原有 collector、输入来源、输出字段、缺失语义、去重、版本和错误规则；本阶段不复制这些规则到 runtime-facts，也不把旧行转换成新行。

| 现有索引 | 本阶段输入/输出责任 | 来源与缺失责任 | 去重、版本和错误边界 |
|---|---|---|---|
| transcript | 继续由既有 transcript collector 写原 schema；本阶段不新增字段、不转写 | 继续使用既有已登记来源和既有缺失/未知语义；不读私有原始对话 | 继续使用既有规则；新 index 的 fact_id、schema_version、reason 不向后写入 |
| artifact | 继续由既有 artifact collector 写原 schema；本阶段不新增字段、不转写 | 继续使用既有来源和既有错误语义；新采集器不代替它读 artifact | 继续使用既有规则；旧 fixture/消费者字节兼容 |
| flow-health | 继续由既有 flow-health collector 写原 schema；本阶段不把 runtime facts 塞进 health | 继续使用既有 flow/launcher 输入和既有失败语义 | 继续使用既有规则；runtime-facts 独立版本和文件 |
| skills-inventory | 继续由既有 skills-inventory collector 写原 schema；本阶段不新增事实类型 | 继续使用既有来源和既有缺失/错误语义；不从 runtime-facts 反推 skills | 继续使用既有规则；新 index 不改变它的版本或去重 |

四个索引的具体字段以现有 schema 为唯一权威；若实现需要读取它们，必须复用既有 collector/API，不能建立第二套兼容层。

## 5. 统一行结构：`runtime-facts.v1`

每行是一个 UTF-8 JSON 对象，以单个换行结尾。顶层字段固定且不得新增未定义字段：

```json
{
  "schema_version": "runtime-facts.v1",
  "collector_version": "1.0.0",
  "fact_id": "rf_<sha256>",
  "fact_type": "cost|conversation|session|subagent|step_skip|automation",
  "status": "present|missing|unknown",
  "value": null,
  "source": {
    "class": "billing_usage_receipt|message_metadata|launcher_adapter_registry|canonical_skipped_receipt|launcher_orchestrator_dispatch",
    "registration_id": "string|null",
    "object_id": "string|null"
  },
  "observed_at": "RFC3339 UTC timestamp",
  "reason": "null|no_registered_source|not_found|read_error|unsupported_format|malformed_line|duplicate_id_conflict|legacy_not_collected",
  "error": "null|{code:string,message:string}",
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

### 字段约束

- `schema_version` 初始固定为 `runtime-facts.v1`。新增事实类型或改变字段、类型、枚举、原因、状态语义时升版；不能在同一版本静默改变含义。
- `collector_version` 使用语义版本；只允许 parser bugfix/refactor 改变，不能借此隐藏 schema 变化。
- `fact_id` 是稳定去重 ID，计算自 canonical JSON：`{fact_type, source.class, source.registration_id, source.object_id}` 的 UTF-8 SHA-256，前缀 `rf_`。无登记来源时 `registration_id` 和 `object_id` 都为 `null`，每类只产生一个稳定缺口 ID。
- `fact_type` 只能是六个枚举值。旧四索引的类型不能复制进此索引。
- `status=present` 时 `value`、`source.registration_id`、`source.object_id` 非空，`reason=null`、`error=null`。
- `status=missing` 时 `value=null`；原因只能是 `no_registered_source` 或 `not_found`；错误为 `null`。`no_registered_source` 时 registration/object ID 必须为 `null`。
- `status=unknown` 时 `value=null`；原因只能是五个 unknown reason；`error` 必须包含稳定 code 和去敏 message。
- `observed_at` 和 `scope.run_id` 直接取当前采集上下文；session、agent、stage、step、attempt 缺失时为 `null`，不能推断。
- `scope` 六个键固定存在。`run_id` 缺失属于身份完整性错误，不能写成 unknown。
- `source.class` 必须与 `fact_type` 的唯一映射一致。`source.object_id` 只能来自 source 的稳定 ID，不能用正文、token、数组位置或时间戳拼造。
- `error.message` 不得包含正文、私有路径、token、凭据或未去敏原始输入。

## 6. 六类 value 结构

模板中的 `value: null` 表示缺失或未知行；present 行必须替换为对应 fact_type 的白名单对象。`value` 只允许下列结构；字段缺失或多余字段属于 `unsupported_format` / `malformed_line`，不得猜测填充。

### `cost`

```json
{"receipt_id":"string","amount_minor":"non-negative integer","currency":"ISO-4217 uppercase string","unit":"string"}
```

只接受 billing/usage receipt 已给出的金额、币种、单位和 receipt ID。`amount_minor` 不由 token、时长、模型或默认价格计算。

### `conversation`

```json
{"conversation_id":"string","message_id":"string","role":"string|null","message_created_at":"RFC3339 UTC timestamp|null","channel":"string|null"}
```

只保留上述 message metadata。禁止 `body`、`content`、`text`、附件正文和可还原正文的字段。

### `session`

```json
{"session_id":"string","adapter_id":"string","parent_session_id":"string|null","started_at":"RFC3339 UTC timestamp|null","ended_at":"RFC3339 UTC timestamp|null"}
```

所有 ID 和父子关系必须来自 launcher 登记记录；没有 parent 记录就为 `null`，不能按时间或文本推断。

### `subagent`

```json
{"agent_id":"string","adapter_id":"string","parent_agent_id":"string|null","session_id":"string|null","started_at":"RFC3339 UTC timestamp|null","ended_at":"RFC3339 UTC timestamp|null"}
```

父 agent、session 和 adapter 关系必须是 launcher 登记值。

### `step_skip`

```json
{"skipped":"boolean=true","step_id":"string","skip_reason":"string","authorizer":"string","receipt_ref":"canonical task receipt ref"}
```

只有 canonical skipped receipt 才能生成 present。receipt 缺失、格式错误或无法读取时按对应 missing/unknown 规则处理；普通未跳步不生成一行。

### `automation`

```json
{"dispatch_id":"string","orchestrator_id":"string","action":"string","outcome":"string","dispatched_at":"RFC3339 UTC timestamp"}
```

只接受 launcher/orchestrator dispatch 记录；不从流程结果、文本或时间顺序反推自动化。

## 7. 采集、缺失、未知和错误

1. 先校验任务身份、当前 run、注册表唯一性和每个输入对象的 schema；失败则不写任何部分结果并 fail-loud。
2. 对每个允许的 source 读取直接机器记录，保留 source ID 和归属字段。
3. 没有注册 source class 时，为除 `step_skip` 外的对应 fact type 生成一条 `missing/no_registered_source`；不扫描其他位置找替代来源。
4. source 已登记但明确目标对象不存在时生成 `missing/not_found`。已登记 source 的普通读失败不能伪装成 not_found。
5. 输入不可读、格式不支持、行损坏、同 ID 内容冲突或显式 legacy marker 分别生成 `unknown`，原因严格对应五个枚举。
6. `legacy_not_collected` 只能由 source/launcher 明确提供的 legacy marker 触发；不能仅凭文件不存在推断。
7. 以上 missing/unknown 只记录事实，不阻断主流程。身份错误、source 注册冲突、schema 违反和 index 写入错误必须抛出稳定错误并阻断本次采集。
8. 稳定错误 code 由采集器定义；message 只描述原因，不携带原始正文、秘密、token、绝对路径或私有日志。

## 8. 去重和写入

- 去重键是 `fact_id`。同一 key 的 canonical payload（除 `observed_at`、`collector_version` 外）完全一致时，重复采集为 no-op，不追加重复行。
- 同一 key 的 payload 有任何事实性差异时，不选择 first-wins/last-wins；在本次批次内只输出一条 `status=unknown`、`reason=duplicate_id_conflict`、`value=null` 的冲突事实，保留 source key，不写冲突的 present 值。
- 读取历史索引时只按 JSONL 逐行校验；坏行属于 `malformed_line`，不能被静默跳过。
- 写入前完成全批次校验和去重，成功后再 append；写入失败不降级为 missing/unknown。
- JSONL 使用 UTF-8、每行一个对象、末尾换行；键序和 canonical JSON 序列化固定，供 hash、去重和 fixture 复现。
- 索引路径固定为当前任务的 `indexes/runtime-facts.jsonl`，不写 global analytics，不创建第二份事实文件。

## 9. 版本与兼容

- `runtime-facts.v1` 与旧四索引完全分离；读取或写入第五索引不得改动旧文件。
- collector-only 改动只更新 `collector_version`，必须保留相同 schema、枚举、reason 和语义；schema 改动必须升 `schema_version` 并保留新旧解析边界。
- 新事实类型、新来源 class、新状态/reason 或字段语义变化都属于 schema 变化，不得复用 `runtime-facts.v1`。
- M15 读取时以 `status` 分流：只把 present 的 value 作为事实；missing 显示缺口，unknown 显示证据不可判；不得把二者当作零值、空成功或自动 verdict。
- 旧任务没有本索引时，不回填、不扫描私有数据；只有明确 legacy marker 才生成 `legacy_not_collected`。

## 10. 稳定需求

- **FR-001 独立索引**：创建并维护 `indexes/runtime-facts.jsonl`，只承载六个闭合 `fact_type`；四个旧索引和 schema 不变。
- **FR-002 统一结构**：每行提供固定版本、collector 版本、事实 ID/类型、status、value、source、observed_at、reason、error 和完整 scope。
- **FR-003 来源边界**：按表中唯一 source class 读取直接机器事实；不增加 adapter、不扫描私有日志、不读取正文、不推断归属。
- **FR-004 类型值**：六类 present value 遵守第 6 节白名单结构；非允许字段和无法验证的输入不得进入 value。
- **FR-005 缺失语义**：无登记来源写 `missing/no_registered_source`；已登记对象不存在写 `missing/not_found`；`step_skip` 普通未跳步不造缺口。
- **FR-006 未知语义**：仅允许五个 unknown reason；unknown 行 value 必须为 null，并提供去敏稳定 error。
- **FR-007 归属安全**：run/session/agent/stage/step/attempt 只取直接登记值；缺失填 null，run 身份缺失或身份不一致 fail-loud。
- **FR-008 来源唯一性**：每个 fact type 一次采集至多一个 source class；冲突注册不写部分结果并失败。
- **FR-009 去重**：同 fact_id 同 canonical payload 幂等；内容冲突写一条 duplicate_id_conflict unknown，不选择性覆盖。
- **FR-010 版本**：schema 变化升 schema_version；parser-only 改动只升 collector_version；新类型/来源不复用旧 schema。
- **FR-011 非阻断**：missing/unknown 记录不阻断主流程；身份、schema、注册表和写入完整性错误必须阻断。
- **FR-012 兼容**：新增采集不能改变旧四索引 fixture、schema、文件内容和消费者输入。
- **FR-013 可审计**：每条 present 事实可沿 source.registration_id/object_id/receipt_ref 回到直接机器证据；缺口和未知可由 reason/error 解释。
- **FR-014 隐私**：conversation 不含正文或可还原正文；任何 error message 不含秘密、token、私有路径和原始输入。

## 11. 验收标准

- **AC-001 Schema 正向**：fixture 覆盖六个 `fact_type`，每行通过 `runtime-facts.v1` schema；所有固定字段存在，present value 与对应白名单一致。
- **AC-002 来源唯一**：重复注册同一 fact type、类型与 source class 不匹配、或任务身份不一致时，采集器无部分写入并返回稳定失败；有效注册时可生成 present。
- **AC-003 无来源**：无 adapter/source 时，`cost`、`session`、`subagent`、`automation` 及其他没有登记 source 的类别各输出 `missing/no_registered_source`；不读私有日志，不产生 present。
- **AC-004 对话隐私**：message metadata 采集结果只含第 6 节白名单字段；输入或输出含 `body`/`content`/`text` 时拒绝或标记 `unsupported_format`，不得落正文。
- **AC-005 跳步事实**：给定 canonical skipped receipt 时输出一条 present `step_skip`，值含 skipped、原因、authorizer 和 receipt ref；普通未跳步不输出事实行。
- **AC-006 缺失与未知**：测试 `not_found` 为 `status=missing`、`value=null`、`error=null`；分别测试五个 unknown reason 为 `status=unknown`、`value=null`、reason 精确匹配且 error 去敏稳定。
- **AC-007 去重**：同输入重复运行不新增相同 canonical 行；同 fact_id 不同 payload 不被覆盖，且输出一条 duplicate conflict unknown。
- **AC-008 版本**：parser-only 变更只改变 collector_version；字段/枚举/reason/语义变化被 schema 校验拒绝或要求新 schema_version；新 fact type 不能混入 v1。
- **AC-009 非阻断与 fail-loud**：missing/unknown 记录后主流程可继续；身份错误、注册冲突、schema 违反和 index 写入错误都可观察、可断言并阻断本次采集。
- **AC-010 兼容**：现有四索引的 schema、fixture、内容快照和消费者测试在新增索引测试后保持通过；新增文件是唯一事实索引变化。
- **AC-011 可追溯**：present 行的 source 与 scope 字段来自直接登记记录；测试证明不能从文本、顺序、token 或默认值得到成本/父子关系。
- **AC-012 状态可区分**：给定 present/missing/unknown 三类输入，行的 `status`、`value`、`reason` 和 `error` 能无歧义区分三种状态；missing/unknown 不得被序列化为 present、零值或空成功。

## 12. 验收场景矩阵

| 场景 | 输入 | 期望 |
|---|---|---|
| 已登记 present | 合法 source record | 一条 present，value 白名单通过，source/scope 可回溯 |
| 无来源 | registry 没有该 source class | missing/no_registered_source，value=null，不扫描替代来源 |
| 对象缺失 | registry 已登记但 object ID 不存在 | missing/not_found，value=null |
| 读取失败 | 已登记 source 返回 read error | unknown/read_error，稳定去敏 error |
| 格式不支持 | source 声明的版本/格式不受支持 | unknown/unsupported_format，value=null |
| 行损坏 | JSONL 某行不是合法对象或字段不全 | unknown/malformed_line，不能静默跳过 |
| ID 冲突 | 同 fact_id 有不同 canonical payload | unknown/duplicate_id_conflict，不覆盖任一事实 |
| 旧任务 | source 明确给 legacy marker | unknown/legacy_not_collected；无 marker 不凭缺文件推断 |
| 普通步骤 | 没有 skipped receipt | 不输出 step_skip 行，不把未跳步当 missing |
| 写入失败 | index 不可写或完整性校验失败 | fail-loud，不把失败转成 unknown |

## 13. 风险、假设和交接

- 当前没有 cost、归属和 automation 已登记来源；对应数据保持 missing 是预期结果，不是实现缺陷。
- `conversation` 的 message metadata、session/subagent 的 launcher registry、automation dispatch 和 billing receipt 的未来输入契约必须由后续 source owner 提供；本阶段只消费已登记且通过校验的来源。
- `legacy_not_collected` 依赖明确 machine marker；若上游没有 marker，不能人为补写 unknown。
- M15 必须保留 missing/unknown 语义，否则会把数据缺口误报为成功事实。
- 下游 build-plan 输入：本 spec 的 FR-001–FR-014、AC-001–AC-012、统一行结构、六类 value 白名单、来源映射、错误与版本边界；实现计划不得扩大到新 adapter、旧索引改造或私有日志采集。

## 14. 歧义扫描结论

上游锁定项均已继承。当前 draft 未发现会改变范围、验收、接口、数据、安全或运维的未决轴；`spec-clarify`：trigger=false — no material ambiguity。未来 source owner 的输入细节属于新增来源批准，不是本阶段用户决策。

