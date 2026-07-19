# M14b 当前任务事实采集规格

## 1. 目标与已核实事实

本功能为一次 WorkflowHub 任务生成四份可回溯、可重复生成的索引。采集器只读取结构化文件、Git 和 launcher 提供的可信能力，不调用 LLM，不从目录位置或私有缓存猜事实。

截至基线 `4310020cfd6e06e818321b2a078c8e6978acf838`，在 TaskHandle manifest inputs、WorkflowHub authority config、core、scripts、config、metrics 与 workflows 的 registry/adapter 定义中未发现可靠、明确登记的真实 transcript/conversation 来源。此结论只覆盖这些受信登记面，不声称个人目录或第三方私有缓存中不存在数据。`specs/m14a-audit-contract-layer/execution-trace.schema.json` 只定义 transcript 引用形状，未登记来源；`workflows/make-decision/SKILL.md` 明确把 Multica 限定为 wait/resume 通道且说明 WorkflowHub 不认证评论作者。因此首版 transcript 索引必须明确记录“没有已登记来源”，不得扫描 HOME、cwd、CLI 私有缓存或猜格式。

## 2. 用户结果

- 给定一个已认证 TaskHandle 和它的 accepted Workspace，用户可在当前任务的 `indexes/` 下查询 transcript、artifact、流程健康和技能清单。
- 每个来源的“已找到”“应有但缺失”“无法可靠判断”均可见；坏行、格式不支持和重复 ID 冲突不被静默丢弃。
- 相同输入重复运行得到相同语义记录和稳定排序；只有明确允许变化的生成时间可变。
- 采集质量状态只记录和展示，不自动阻断其他 stage；身份或写入完整性失败仍须明确失败。

## 3. 范围

### 3.1 范围内

- `indexes/transcript-index.jsonl`
- `indexes/artifact-index.jsonl`
- `indexes/flow-health-facts.jsonl`
- `indexes/skills-inventory.json`
- 当前任务内的确定性采集、去重、合并、锁和原子写。
- 少量代表性正常、缺失、损坏、格式不支持、幂等重复、重复冲突和错误工作树样本。

### 3.2 明确不做

- 不建全局索引、第二套证据库、第二套任务身份或第三套 generation。
- 不扫描个人目录、cwd、任意 CLI 私有缓存或未登记来源。
- 不调用 LLM 解析或推断事实。
- 不建立覆盖全部 CLI 的样本库，不要求每份样本额外绑定 SHA-256。
- 不恢复旧 `worktree.json`、`parseTaskDir` 或路径搜索作为发现机制。
- 不给每个 skill 增加机器执行入口，不修改 M14a skills inventory schema。
- 不把 missing/unknown 变成阻断式质量门。

## 4. 术语与公共规则

- `present`：可信来源存在且内容按已登记格式成功解析。
- `missing`：可信上下文明确声明某对象或来源应该存在，但读取时找不到。
- `unknown`：存在性、格式或内容无法可信判断，包括读取失败、坏行、格式不支持和内容冲突。
- `source_ref`：TaskHandle 相对引用、ArtifactDir 相对引用或显式注册的 transcript 来源 ID；不得写宿主个人目录推导出的引用。
- `run_id`：来自 execution trace 或正式运行记录的现有运行身份；没有可信 run 关联时为 `null`，不得新造身份。
- `schema_version`：输出字段、枚举或事实语义的版本。
- `collector_version`：采集实现版本；bugfix、重构或性能修改只改此值。

所有 JSONL 文件均为 UTF-8，每行一个 JSON object，以换行结尾。所有对象字段固定；新增字段需要提升对应 `schema_version`。输出按本规格指定键升序排列，禁止依赖文件系统遍历顺序。

## 5. 可信输入与身份边界

### REQ-001 StageContext 唯一入口

采集器只接收 `bootstrapStage(...)` 产生的 StageContext，并使用其中的 `ctx.task`、`ctx.kernel`、`ctx.workspace`、`ctx.artifacts`。不得读取 `WORKFLOWHUB_TASK_DIR`，不得用 cwd、Git remote、branch、issue ID、alias 或 latest 推导任务身份。

### REQ-002 错误工作树识别

采集开始前必须同时验证：

1. TaskHandle 的 project/task 与 StageContext identity 一致；
2. `ctx.workspace.worktreeRoot` 与 accepted make-decision 的 `worktree_root` 为同一已验证真实目录；
3. `ctx.workspace.baselineCommit` 与 accepted make-decision 的 `baseline_commit` 相同；
4. Workspace 能通过其受控 Git 能力读取当前 snapshot。

任一不一致属于入口身份错误，必须在读取来源和写索引前 fail-loud，并报告 `WRONG_WORKTREE` 或底层更具体的完整性错误；不得改写四份索引。工作树在 accepted snapshot 后产生正常受控变更不等于错误工作树，不能要求当前 tree 永远等于 make-decision 的 snapshot tree。

### REQ-003 来源白名单

允许输入仅为：

- TaskHandle manifest 和 TaskHandle 可认证读取的 canonical records；
- `ctx.kernel.readAccepted(...)` 返回的 accepted stage facts；
- ArtifactDir 中由正式 stage facts 明确引用的命名产物；
- Workspace 受控 Git snapshot；
- repo 内 `skills/catalog.yaml`、`config/workflowhub.yaml`、`workflows/*/skill-deps.yaml` 和已校验 bundle；
- launcher 显式注册、且登记了接口、引用、格式、schema/version 与读取权限的 transcript source。

单个可选来源读取失败只影响该来源，其他来源继续。TaskHandle/Workspace 身份失败不是可选来源失败，按 REQ-002 终止。

## 6. transcript 索引

### REQ-010 输出结构

`indexes/transcript-index.jsonl` 每行必须包含：

| 字段 | 类型 | 规则 |
|---|---|---|
| `schema_version` | string | 非空 |
| `collector_version` | string | 非空 |
| `record_kind` | string | `transcript`、`source_status` 或 `parse_error` |
| `id` | string | 在同一 `record_kind` 内非空且稳定 |
| `run_id` | string/null | 只使用可信现有 run 身份 |
| `status` | string | `present`、`missing` 或 `unknown` |
| `source_ref` | string/null | 已登记来源 ID/引用 |
| `source_format` | string/null | 已登记格式名 |
| `source_version` | string/null | 已登记版本 |
| `line_number` | integer/null | JSONL 来源从 1 开始；非逐行来源为 null |
| `content_hash` | string/null | 正常候选的 canonical SHA-256；错误/冲突无单一内容时为 null |
| `payload` | object/null | 已登记 adapter 输出的结构化内容；不得放猜测内容 |
| `reason` | string/null | `no_registered_source`、`not_found`、`read_error`、`unsupported_format`、`malformed_line`、`duplicate_id_conflict` 或 null |
| `error` | object/null | 仅含稳定的 `code` 与安全消息，不含秘密或任意宿主路径 |
| `variant_hashes` | string[] | 仅冲突记录使用，去重后升序 |
| `variant_source_refs` | string[] | 仅冲突记录使用，去重后升序 |

### REQ-011 当前无来源行为

若 registry 中没有任何已核实 transcript source，文件不得为空，必须输出一条：`record_kind=source_status`、`id=transcript-source-registry`、`status=missing`、`reason=no_registered_source`。其余来源字段为 null 或空数组。不得为满足“有 transcript”而读取 issue comments 或扫描个人目录。

### REQ-012 已登记来源行为

每个来源必须先校验注册信息是否完整。已声明应存在但找不到时输出 `missing/not_found`；读取异常输出 `unknown/read_error`；格式或版本不在 adapter 支持范围时输出 `unknown/unsupported_format`。一个来源失败不得阻止其他来源产生记录。

### REQ-013 坏 JSONL 行

坏行输出 `record_kind=parse_error`、稳定 ID `bad-line:<registered-source-id>:<line_number>`、`status=unknown`、`reason=malformed_line`，保留来源 ID、行号和安全错误。其余合法行继续解析。采集器不得修改来源文件，也不得用合法行的部分结果覆盖来源证据。

### REQ-014 transcript 去重与冲突

去重键严格为 `(record_kind,id)`。正常候选的 `content_hash` 使用现有 RFC 8785 canonical JSON + SHA-256，hash material 仅为 `{record_kind,id,run_id,payload}`，排除来源位置、行号、采集时间、诊断字段和 `content_hash` 本身。

- 键相同且 hash 相同：视为幂等重复，只输出一条；合并后的来源引用去重排序。
- 键相同但 hash 不同：不得 first/last-write-wins；输出一条同键冲突记录，`status=unknown`、`reason=duplicate_id_conflict`、`content_hash=null`，并保存全部去重排序后的 `variant_hashes` 与 `variant_source_refs`。
- 同一组输入无论遍历顺序如何，结果必须相同。

## 7. artifact 索引

### REQ-020 输出结构

`indexes/artifact-index.jsonl` 每行必须包含：

| 字段 | 类型 | 规则 |
|---|---|---|
| `schema_version` | string | 非空 |
| `collector_version` | string | 非空 |
| `record_kind` | string | `stage_result`、`handoff`、`artifact`、`evidence`、`review` 或 `test` |
| `id` | string | 优先使用 canonical attempt/ref ID；非空稳定 |
| `run_id` | string/null | 可信关联存在才填写 |
| `stage` | string/null | 可信关联存在才填写 |
| `status` | string | `present`、`missing` 或 `unknown` |
| `ref` | string | TaskHandle 或 ArtifactDir 的受控相对引用 |
| `required` | boolean | 是否由正式记录声明必须存在 |
| `content_hash` | string/null | 正式记录已有 hash 则复用；否则为 null，不额外强制计算 |
| `source_ref` | string | 声明该对象的 canonical record 引用 |
| `reason` | string/null | `not_found`、`read_error`、`unsupported_format`、`duplicate_id_conflict` 或 null |
| `error` | object/null | 稳定 code 与安全消息 |

### REQ-021 采集边界

从正式 stage attempts/accepted facts 中的命名引用出发，收集阶段结果、handoff、ArtifactDir 产物、evidence、review 和 test material。只跟随 canonical record 中明确声明的相对 ref，不递归扫描任意目录，不建立第二套证据。已声明 ref 不存在为 missing；无法认证、读取或解析为 unknown。

### REQ-022 artifact 去重

以 `(record_kind,id)` 去重。相同键、相同 canonical 内容留一条；相同键、不同内容输出 `unknown/duplicate_id_conflict`，禁止覆盖。若正式记录已提供可信 hash，优先用该 hash；否则用现有 canonical JSON hash，hash material 排除来源位置、诊断和生成时间。输出按 `record_kind,id,ref` 排序。

## 8. 流程健康事实

### REQ-030 输出结构

`indexes/flow-health-facts.jsonl` 每行必须包含：

| 字段 | 类型 | 规则 |
|---|---|---|
| `schema_version` | string | 非空 |
| `collector_version` | string | 非空 |
| `fact_id` | string | 非空稳定 |
| `run_id` | string/null | 可信关联存在才填写 |
| `stage` | string/null | 可信关联存在才填写 |
| `domain` | string | 严格复用 M14a 九域词表 |
| `status` | string | `present`、`missing` 或 `unknown` |
| `observed_value` | boolean/integer/string/null | 只放机器观察或正式声明值 |
| `source_ref` | string/null | 可信事实引用 |
| `reason` | string/null | 稳定原因码或 null |
| `error` | object/null | 稳定 code 与安全消息 |

`domain` 严格复用 `specs/m14a-audit-contract-layer/quality-failure-taxonomy.md`，只允许 `task_dir`、`worktree`、`review`、`verify`、`handoff`、`transcript`、`skill_missing`、`artifact_missing`、`token_waste`。本索引只陈述事实，不加入 severity、root cause、修复建议或解决算法。

### REQ-031 事实生成

- `task_dir`、`worktree`：来自已认证 TaskHandle、accepted Workspace 和受控 Git snapshot。
- `review`、`verify`、`handoff`：来自正式 stage results/receipts；声明应有但缺失为 missing，无法可靠判断为 unknown。
- `transcript`、`artifact_missing`：由本次 transcript/artifact 采集结果确定性投影。
- `skill_missing`：来自现有 skill closure 校验事实，不自行重写闭包算法。
- `token_waste`：只有现有 metrics 提供直接可信事实时填写；没有证据必须为 unknown，不能凭文本或运行时长推断。

事实以 `fact_id` 去重；内容一致留一条，内容冲突输出同 ID 的 unknown 冲突事实并保存原因，不得覆盖。输出按 `fact_id` 排序。任何 missing/unknown 均只记录并浮现，不自动卡住其他 stage。

## 9. 技能清单

### REQ-040 严格复用 M14a schema

`indexes/skills-inventory.json` 必须逐字遵守基线内 `specs/m14a-audit-contract-layer/skills-inventory.schema.json`（JSON Schema draft 2020-12，`$id=https://workflowhub.local/schemas/skills-inventory.schema.json`）：顶层只允许 `schema_version`、`generated_at`、`skills`；每个 skill 必须含 `name`、`path`、`version`、`stage`、`owner`、`source`、`portable`、`metrics_expected`、`subagent_friendly`，只可使用 schema 已声明的可选字段。禁止添加 `run_id`、状态、hash、entrypoint 或其他字段。实现若发现该路径、`$id` 或所列 required/additionalProperties 口径与基线不一致，必须停止该文件生成并报告契约不匹配，不得自行改 schema。

### REQ-041 权威来源与排序

技能事实从现有 `skills/catalog.yaml`、stage 配置、`workflows/*/skill-deps.yaml` 和已验证 bundle/closure 能力投影。不得复制 skill closure 算法。`skills` 按 `name,path` 稳定排序；同一 `name,path` 内容相同只留一条，内容不同使本文件写入失败并报告 `duplicate_id_conflict`，因为 M14a schema 没有合法冲突字段可承载该状态。

`generated_at` 是唯一允许随成功运行变化而变化的字段；测试确定性时使用注入时钟。run 关联只由 TaskHandle 以及其他三个索引的 `run_id` 表达。

## 10. 合并、并发、写入与结果

### REQ-050 锁与原子更新

每个索引必须经当前 TaskHandle 的 `withRecordLock` 独占读-合并-写临界区，并用 `writeRecordAtomic` 更新；不得自行实现锁、rename、fsync、symlink 或路径校验。ArtifactDir 只用于 build-spec 的 `spec.md`，不作为索引写入口。

### REQ-051 既有索引合并

锁内读取既有索引并与本次候选合并，使用各索引的稳定键、canonical hash 和冲突规则。既有 JSONL 坏行也必须转成可见的 unknown parse-error 事实后再写，不能静默丢弃。schema 版本超出 collector 声明支持范围时，该文件写入失败并报告 `unsupported_format`，不得猜迁移。

### REQ-052 部分来源与部分写失败

来源级失败不妨碍其他来源采集。四个文件分别原子写，已成功的文件无需回滚；但返回值必须逐文件报告 `saved:true|false`、错误码和最终 ref。任何一个目标文件未保存时，总体结果不得为 success，必须为 failed，并列出未保存文件。绝不在实际写失败后报告成功。

### REQ-053 指标

采集入口通过 launcher-issued metrics capability 调用现有 `recordSkeleton`，退出时调用 `updateOwnResult`。metrics 仍为 warn-only，不得用 global metrics store 替代四份任务内索引，也不得因 metrics 写失败伪造索引成功或失败。

## 11. 错误处理表

| 场景 | 结果 | 是否继续其他来源/文件 |
|---|---|---|
| StageContext/TaskHandle/Workspace 身份不一致 | fail-loud；不写索引 | 否 |
| 没有已登记 transcript 来源 | transcript 写一条 missing | 是 |
| 已声明来源不存在 | 对应记录 missing | 是 |
| 来源读取失败 | 对应记录 unknown/read_error | 是 |
| 格式或版本不支持 | 对应记录 unknown/unsupported_format | 是 |
| JSONL 坏行 | unknown/malformed_line，合法行继续 | 是 |
| 幂等重复 | 合并为一条 | 是 |
| 同 ID 内容冲突 | unknown/duplicate_id_conflict；不覆盖 | 是；skills 文件例外为该文件写失败 |
| 目标 schema 不支持 | 对应文件失败 | 是 |
| 锁、路径校验、原子写失败 | 对应文件 saved=false；总体 failed | 是，未开始文件可继续尝试 |
| metrics 写失败 | 警告事实 | 是 |

## 12. 可执行验收标准

### AC-001 正常当前任务采集

给定合法 TaskHandle、accepted Workspace、正式 stage records、artifact/review/test refs 和技能 registry；运行采集器；四个目标文件均位于当前 TaskHandle 的 `indexes/`，字段合法、引用可追溯、排序稳定，返回总体 success。

### AC-002 无 transcript 来源

给定当前基线且 registry 无已核实 transcript source；运行采集器；transcript 索引仅以确定性规则输出 `transcript-source-registry` 的 `missing/no_registered_source` 事实，不读取 HOME、cwd、Multica 评论或 CLI 私有缓存。

### AC-003 missing 与 unknown 分离

给定一个明确 required 但不存在的 ref，以及一个存在性无法认证的 ref；运行采集器；前者为 missing，后者为 unknown，二者都不阻断其他合法来源写入。

### AC-004 坏行不中断合法行

给定含合法行、坏行、合法行的已登记 JSONL 来源；运行采集器；两条合法记录存在，坏行以来源 ID、1-based 行号、错误码和 unknown/malformed_line 存在，来源文件字节不变。

### AC-005 格式不支持

给定已登记来源但 schema/version 不在 adapter 支持范围；运行采集器；输出 unknown/unsupported_format，不尝试猜字段。

### AC-006 幂等重复

给定两个 `(record_kind,id)` 相同且 canonical hash 相同的候选，并以两种相反遍历顺序运行；两次均只输出一条相同语义记录，来源列表和文件排序相同。

### AC-007 重复冲突

给定两个 `(record_kind,id)` 相同但 canonical hash 不同的候选；运行采集器；输出 unknown/duplicate_id_conflict 和全部排序后的 variant hashes/source refs，不采用 first/last-write-wins。skills inventory 的同键冲突则该文件 saved=false、总体 failed。

### AC-008 artifact 明确引用

给定 stage result 明确引用 artifact、handoff、evidence、review 和 test material；运行采集器；每个引用出现且分类正确。再移除一个 required ref；对应条目变为 missing，其他条目不变。

### AC-009 九域健康事实

给定各域代表性正式事实；运行采集器；domain 只来自 M14a 九词表，输出不含 severity、根因或修复建议。没有 metrics 证据的 token_waste 为 unknown。

### AC-010 skills schema 原样兼容

生成 skills inventory 后，用现有 M14a schema 校验必须通过，`additionalProperties` 测试为零；不得出现 run_id、hash 或 entrypoint。相同输入和注入时钟产生字节相同文件。

### AC-011 错误工作树

给定与 accepted make-decision 不同的 worktree root 或 baseline commit；运行采集器；在任何来源读取和索引写入前返回 WRONG_WORKTREE/完整性错误，四个索引保持原字节。

### AC-012 并发与原子写

两个采集进程同时更新同一索引；观察到 TaskHandle 锁串行化，最终文件是完整 JSON/JSONL，不出现截断或交错。模拟 rename/fsync/ancestor identity 失败时，该文件 saved=false，总体不得 success。

### AC-013 写失败不假成功

让四个文件中的一个写入失败；其余已成功文件可保留，但返回总体 failed，明确列出失败文件和错误，失败文件不被半写。

### AC-014 事实不变成质量门

给定 transcript missing、artifact unknown 或 review failed 的可认证事实；采集完成并如实记录，不因这些状态阻止其他 stage。只有入口身份和写入完整性错误按本规格失败。

### AC-015 版本分离

仅修复 parser bug 时 collector_version 改变而 schema_version 不变；新增字段、枚举或改变 missing/unknown 语义时 schema_version 必须改变。输入 schema 超出支持范围时明确 unsupported_format。

## 13. 代表性测试范围

只建设覆盖 AC-001 至 AC-015 的最小 fixture：一组正常任务、无 transcript 来源、单个 missing、单个读取失败、三行混合 JSONL、单个不支持版本、幂等重复、重复冲突、错误工作树、并发写与注入写失败。不按 CLI 品牌扩展样本矩阵，不给每份 fixture 单独维护 SHA-256。

## 14. 假设、风险与推翻条件

- 假设 TaskHandle、Workspace、ArtifactDir、canonical JSON/hash、metrics 和 skill closure 保持现有契约；实现只做适配和投影。
- 风险：未来 transcript 来源格式分裂。控制：只有完成接口、引用、格式、版本、权限登记后才能新增 adapter。
- 风险：冲突诊断字段参与 hash 形成自指或假冲突。控制：各索引明确固定 hash material。
- 风险：skills schema 无法承载 unknown/conflict。控制：严格守 schema；冲突时该文件明确失败，不偷偷加字段。
- 推翻条件：若后续取得稳定、公开、统一的多 CLI transcript 契约，可另行批准并扩展 registry/adapter；本规格不预留猜测扫描。

## 15. 宪法检查

- F1/F2：核心只提供能力和编排；采集/投影保持窄接口。
- F3/F4/F5、Q1/Q2/Q3：机器采事实但不设阻断式质量门；正式规格须经独立 wh-review。
- F6：只写当前 TaskHandle 的统一外置记录，不建第二套身份或证据。
- F7：本阶段为可逆自动阶段，不授权 commit、push、merge、archive 或 cleanup。
- F8/F9/F10：复用现有能力；缺证据标 missing/unknown；只做最小 fixture，不堆完整 CLI 自动化基建。
- S1/S2/S3/S4/S5/S6/S7/S8：复用现有 canonical hash、metrics、skill closure 与 stage 技能；不新造通用框架。与本功能无直接新增外部技能的条目按“不新增，现有约束保持”满足。

## 16. 需求覆盖与歧义结论

本规格覆盖四类索引的输入、输出、错误、去重、冲突、并发、错误工作树、技能 schema、写失败和验收。受信登记面已核实为“截至基线未发现明确登记来源”，因此首版行为确定为 missing，不再构成待用户回答的产品歧义。make-decision 是否已正式接受不由本规格自报或重复证明；正式 build-spec runtime 必须先通过 `ctx.kernel.readAccepted("make-decision")` 的入口校验，缺少 accepted 结果时本 stage 不得执行。未增加全局索引、完整 CLI 样本库、额外 fixture hash、LLM 推断或下一 stage。
