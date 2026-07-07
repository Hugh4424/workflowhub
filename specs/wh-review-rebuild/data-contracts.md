# Data Contracts: wh-review-rebuild

跨边界数据契约清单。边界指：wh-review ↔ 3rd-review（跨仓库）、stage agent ↔ wh-review、wh-review ↔ 磁盘落盘产物（供人工/下游 stage 读取）。来源：spec.md FR-WHREVIEW-001~004、FR-THIRDREVIEW-001~004、FR-D2-001、FR-INTAKE-001、FR-TESTACCEPTANCE-001、§6.5。

---

## Contract 1: 审查引擎调用三元组 `{mode, contract, materials}`

- **Owner**: wh-review（`skills/wh-review/`）
- **Consumer**: 3rd-review 引擎（独立仓库，默认与 workflowhub 以兄弟目录形式并列检出，见 spec.md FR-THIRDREVIEW-001「3rd-review 仓库根目录发现规则」）
- **传输方式**: wh-review 将三元组整体序列化（JSON）写入 `--diff=<file>`，调用 `node <runner> --diff=<file> --output=<file>`；`mode`/`contract` 不通过独立 CLI flag 传递
- **字段与类型**：
  | 字段 | 类型 | 说明 |
  |---|---|---|
  | `mode` | enum string | `full` / `incremental` / `same-source` 三值之一 |
  | `contract` | string | 本次审查依据的合同内容或"路径+hash" |
  | `materials` | string | 完整审查材料包文本内容；文档类审查对象（spec.md/data-contracts.md/plan.md/tasks.md）在 `total_round≥2` 时改为 round(N-1) 文档快照与当轮文档内容的文本 diff，而非全文，快照生成与存放规则见 FR-WHREVIEW-006 / Contract 10；代码/测试/决策类审查对象对应的"上一轮 materials 基线"记录机制见 FR-WHREVIEW-006 / Contract 12（round25 新增，通用机制的另一种落地方式） |
- **校验规则**：
  - `mode`/`contract` 必须是独立显式字段，不得坍缩进 `materials` 纯文本
  - 调用入口不含 `--checkpoint` 或任何 stage/round 相关 flag；引擎对 round/stage 零知识
  - 单次调用无内部循环：返回 `verdict=revise_required` 后进程即终止，不自动发起下一轮
- **版本兼容说明**：本契约为本期新增/冻结契约（FR-THIRDREVIEW-001 "集成入口冻结"），无历史版本；后续新增 stage 不改此契约结构，只增加 wh-review 侧的 stage→合同映射条目。

---

## Contract 2: 审查引擎返回三元组 `{verdict, findings, actual_mode}`

- **Owner**: 3rd-review 引擎正常完成审查时为 Owner；引擎调用本身失败（runner 缺失/不可执行、非零退出、超时、`--output` 缺失或不可解析）时，落盘内容改由 wh-review 自行合成，Owner 变为 wh-review（见下方"失败路径合成规则"，权威定义见 spec.md FR-THIRDREVIEW-001"失败路径 raw artifact 合成规则"）
- **Consumer**: wh-review（正常场景消费引擎真实产出）/ gate_cmd 与人工审计（统一从落盘路径读取，不区分来源）
- **字段与类型**：
  | 字段 | 类型 | 说明 |
  |---|---|---|
  | `verdict` | enum string | 3rd-review 引擎单轮正常完成审查时，本字段仅取 `pass`/`revise_required` 二值之一——引擎对 round/stage 零知识，不具备、也不产出 `escalate_to_human`。`escalate_to_human` 仅由 wh-review 产出，来源二选一，不存在"引擎返回值经综合后转换"这种中间态：①wh-review 综合多轮历史后作出的最终裁决升级，含轮级信号（连续3轮 `blocking_count≥3`）与 finding 级信号（单条 finding 指纹连续2轮未闭合，先触发根因诊断+定向修复尝试，尝试对应轮次审查后仍未解决方升级，round16 修复：阈值由3改为2，见 FR-WHREVIEW-003"升级人工触发条件"）两类；②NFR-2 定义的例外场景——runner 调用失败/超时/崩溃、或结果文件缺失/不可解析时，wh-review 直接判定为 `escalate_to_human`（此时引擎未产出任何有效 verdict，见 FR-THIRDREVIEW-001）|
  | `findings` | array/object | 审查发现项集合；来源②失败场景下 wh-review 合成时可为空数组；元素含 `severity`/`file`/`line`/`category`/`issue`/`recommendation` 等字段（见 FR-THIRDREVIEW-001 结果 schema），供 wh-review 据此自行计算 `finding_fingerprint`。**round24 修复：3rd-review 不产出、也不要求产出 `severity_decision`**——3rd-review 引擎调用边界（本 Contract）不透传 stage/round 历史，对 FR-WHREVIEW-005"round2+ 新发现降级规则"保持零知识，无法执行该判定；`total_round≥2` 时若某条 finding 命中该规则，`severity_decision` 改由 wh-review 收到本三元组后在本地计算，写入 Contract 4 `finding_fingerprints` 对应条目，供报告 Blocking/Minor Issues 章节消费（见 spec.md FR-WHREVIEW-005） |
  | `actual_mode` | enum string | 引擎实际执行的模式；正常场景（来源①）取 `full`/`incremental`/`same-source` 三值之一，用于比对 wh-review 请求的 `mode` 是否被引擎降级/改写；**round25 修复：来源②失败场景（runner 不存在/非零退出/超时等）下引擎从未实际执行任何模式，本字段须取新增枚举值 `not_executed`，语义为"引擎未实际执行、无可比对的执行模式"，不得取 wh-review 本轮请求的 `mode` 原值——此前版本将失败场景写成请求值，会让审计记录误以为引擎确实以某个 mode 跑过（round25 finding），已订正** |
  | `synthetic` | boolean（可选） | `true` 表示本 JSON 由 wh-review 合成、非 3rd-review 引擎真实产出，仅在下方"失败路径合成规则"场景出现；引擎正常产出的真实 `--output` 不含此字段（或显式为 `false`） |
  | `failure_reason` | enum string（可选，`synthetic: true` 时必填） | 失败具体原因，取值 `runner-missing`/`non-zero-exit`/`timeout`/`output-unparseable` 之一；仅在 `synthetic: true` 时出现 |
- **校验规则**：结果文件缺失或不可解析时属于上述 `escalate_to_human` 来源②（NFR-2 例外场景），wh-review 最终裁决直接判定为 `escalate_to_human`（不新增 `unknown` 裁决态），并在轮次状态文件与报告中标注触发原因；此场景与来源①（多轮历史综合升级）互斥，不叠加判断
- **失败路径合成规则（消除"失败场景引擎未产出 `--output` 却要求下游读取该文件"的自相矛盾，round12 finding，权威定义见 spec.md FR-THIRDREVIEW-001"失败路径 raw artifact 合成规则"）**：当 3rd-review 调用属于 NFR-2 定义的失败场景（runner 缺失/不可执行、非零退出、超时、`--output` 缺失或不可解析）时，引擎从未产出真实 `--output`，wh-review 不得假装该文件已由引擎写入。此时 wh-review 必须自行合成一份最小失败元数据 JSON（`verdict: "escalate_to_human"` + `synthetic: true` + `failure_reason` + **round25 修复新增** `actual_mode: "not_executed"`），写入与正常场景完全相同的落盘路径（见下方"落盘路径"）。两种来源统一落在同一路径、统一含 `verdict` 字段，gate_cmd/人工审计只需从该路径读取 `.verdict`，无需分裂成两套读取逻辑，仅内容来源不同。
- **落盘路径（消除与"中间产物"旧表述的矛盾）**：本三元组（或失败场景下 wh-review 合成的失败元数据）的序列化 JSON 即为落盘内容，实际持久化证据路径由 spec.md FR-THIRDREVIEW-001"evidence/report 落盘路径规则"权威定义为 `tasks/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`（`{stage}` 为此前修复新增维度，避免同一 task_id 下不同 stage 各自从1计数的轮次编号互相覆盖；`{review_flow_id}` 为本轮修复新增维度，定义见 Contract 4/spec.md FR-WHREVIEW-003，避免同一 stage 先后发起的不同审查流程因 `total_round` 复位而互相覆盖，round14 finding）。该证据文件须持久保留供 gate_cmd/人工审计读取（见 tasks.md 对应验收行），不属于可随意清理的临时产物；唯一可随意清理的中间产物是序列化传给 `--diff` 的临时输入文件，见 spec.md FR-WHREVIEW-001 落盘契约第1条。
- **版本兼容说明**：本三元组为 3rd-review 引擎单次调用的返回结构定义；旧版"不落入 task_tracking_root、消费后可清理"表述与上方落盘路径条款互斥，本条款以落盘路径条款为准，予以订正（FR-WHREVIEW-001 落盘契约第1条）

---

## Contract 3: route-decision 记录文件

- **Owner**: wh-review
- **Consumer**: 人工审计 / AC2-2 验收脚本
- **路径**: `tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json`（round19 修复：路径按 `stage`+`review_flow_id` 两个维度隔离，不再是单一全局文件；`review_flow_id` 在准备阶段第一次写入前即已生成，两次写入命中同一物理文件，详见下方"跨 stage/跨流程隔离结论"）
- **task_id 路径安全约束（round23 修复，权威定义见 spec.md FR-WHREVIEW-001"task-id 来源契约"；round27 修复：由"wh-review 自身遵守"扩展为"所有基于 task_id 的落盘操作前置条件"，堵住 Contract 11 提示词生成子代理绕过该校验先行写盘的缺口）**：本文件路径中的 `{task-id}` 片段仅允许安全字符集 `^[A-Za-z0-9._-]+$`（不含路径分隔符、不含 `..`）；**任何一方——wh-review 自身、stage 主 agent、Contract 11 定义的审查提示词生成子代理等——只要要基于 `task_id` 拼接落盘路径，都必须先在自己的写入代码路径中执行同一套字符集校验**，不匹配则 fail-loud 报错并终止，不得静默清洗或截断后继续使用，也不允许"先由某一方写入落盘文件、之后再由 wh-review 事后校验"这种时序——校验必须发生在自身的写入操作执行之前。本约束适用于本文档全部含 `tasks/{task-id}/...` 路径的契约（Contract 3/4/5/10/11 等），不逐条重复声明；Contract 11"校验规则"段对子代理落盘时点的约定同样受本条款约束。
- **字段与类型**（`review_flow_id`/`total_round` 自第一次写入〈准备阶段〉起即须非空，与允许"先占位后回填"的 `review_input_hash` 不同；`stage`/`contract_path`/`contract_hash`/`timestamp`/`input_mode`/`review_input_hash` 六项在执行阶段结束后均非空，缺任意一项视为不合规；`review_input_hash` 允许分两次写入，见下方"两阶段写入规则"）：
  | 字段 | 类型 | 说明 |
  |---|---|---|
  | `stage` | string | 触发审查的 stage 标识 |
  | `contract_path` | string | 所选合同文件源路径 |
  | `contract_hash` | string | 合同文件内容 hash 或版本锚点 |
  | `timestamp` | string (ISO 8601) | 写入时刻 |
  | `input_mode` | enum string | `full`/`incremental`/`same-source` |
  | `review_flow_id` | string | 本次审查流程的稳定唯一 ID；自第一次写入（准备阶段）起即须非空，不允许占位后回填，定义见 Contract 4/spec.md FR-WHREVIEW-003 |
  | `total_round` | non-negative integer | 本次审查流程的总轮次计数器，恒等于 `heterologous_round + same_source_round`；自第一次写入（准备阶段）起即须非空，不允许占位后回填，定义见 Contract 4/spec.md FR-WHREVIEW-003 |
  | `review_input_hash` | string | 本次传给引擎的 materials 内容 hash；**先占位后回填**——准备阶段（FR-WHREVIEW-007 步骤1）此时 materials 尚未生成，字段必须显式存在但留空（空字符串或 `null`）；执行阶段（FR-WHREVIEW-007 步骤3，实际调用 3rd-review 引擎之前）用真实 materials 算出 hash 后就地回填 |
- **两阶段写入规则（round17 修复，对齐 FR-WHREVIEW-007 两段式调用流程）**：本文件允许分两次写入而非一次性写全——第一次（准备阶段）写入 `stage`/`contract_path`/`contract_hash`/`timestamp`/`input_mode`/`review_flow_id`/`total_round`，此七项均须非空；`review_input_hash` 留空占位；第二次（执行阶段）在真正调用 3rd-review 引擎之前，就地回填 `review_input_hash`，不重写其余字段、不新建文件。
- **校验规则**：必须在调用 3rd-review 引擎之前完成两次写入；同一 `review_flow_id` 内（该流程的准备阶段写入、执行阶段回填、以及该流程后续轮次的重复写入）均整体覆盖同一物理文件的上一次记录（非追加），跨轮历史由报告/轮次状态文件承担；不同 `review_flow_id`（新发起的审查流程、resume 重跑产生的新流程）因路径不同而写入不同物理文件，不会互相覆盖；**完整性校验（八字段均非空）只在执行阶段结束后检查**，准备阶段结束时 `review_input_hash` 为空属于预期中间态，不视为不合规
- **跨 stage/跨流程隔离结论（round19 修复：不再依赖未被保障的"stage 严格串行"假设）**：round7-10 曾以"FR-STAGE-001 约定同一 task_id 下 5 个 stage 严格串行触发审查、不并发"为由，认定本文件无需路径隔离、仅靠内容自带的 `stage` 字段自校验即可应对跨 stage 场景；但 FR-STAGE-001 实际条款标题即为"5 stage 收尾统一（回归保护项，非待改造项）"，全文只约定"5 个 stage 收尾步骤统一调用 `docs/human-brief-template.md`"这一回归保护要求，并未定义任何串行/互斥调用保证——若发生 resume 重跑、并发工具调用、或同一 stage 被重复触发，覆盖写会破坏可审计性且不可探测，且当前无消费方对此做 fail-loud 校验（区别于 Contract 4 round-state.json 已有的 `stage` 自校验 fail-loud 消费逻辑）。本轮改为路径级隔离（选择更简单的落地方案）：路径本身携带 `{stage}` 与 `{review_flow_id}` 两个维度，物理隔离到不同文件，无论是否串行、是否并发、是否重复触发都不会互相覆盖，不再依赖"stage 严格串行"这一未被 FR-STAGE-001 保障的假设；文件内容自带的 `stage` 字段继续保留作为读取方二次核验手段（双重保障，非替代关系）。**round21 修复更新**：Contract 4 round-state.json 此前在本条款声明中"维持不变、不在本轮修复范围内"，但 round21 审查指出同样的"stage 严格串行不成立"理由同样适用于 round-state.json——round21 已对 Contract 4 应用完全相同的路径级隔离方案，详见 Contract 4 及其"跨 stage/跨流程隔离结论"小节，本条款上述"维持不变"表述自 round21 起失效、以 Contract 4 当前版本为准。
- **版本兼容说明**：本期新增契约，仅保留最近一次路由决策，无历史版本兼容问题

---

## Contract 4: 轮次状态文件

- **Owner**: wh-review
- **Consumer**: wh-review 自身（跨轮读取判断降级/升级）、orchestrator 重启恢复逻辑（FR-D2-001 AC8-4）
- **路径**: `tasks/{task-id}/reviews/round-state-{stage}-{review_flow_id}.json`（round21 修复：应用与 Contract 3 route-decision 记录文件相同的 `stage`+`review_flow_id` 路径隔离，不再是覆盖整个 task 的单一全局文件；权威声明见 spec.md FR-WHREVIEW-003"落盘路径"条款；`task-id` 来源见 FR-WHREVIEW-001"task-id 来源契约"；与 Contract 3 `route-decision-{stage}-{review_flow_id}.json` 共享同一 `tasks/{task-id}/reviews/` 目录结构，不另设新目录；发现规则见下方"跨 stage/跨流程隔离结论"）
- **字段与类型**：
  | 字段 | 类型 | 说明 |
  |---|---|---|
  | `review_flow_id`（本轮新增） | string | 本次审查流程的稳定唯一 ID，仅含 `[a-z0-9-]` 字符；某 stage 发起全新审查流程（`total_round` 即将从1重新计数）时生成一次，同一流程内（含异源转同源）保持不变；用于报告/prompt/人工确认/raw verdict/文档快照等跨轮持久化 artifact 的文件名，避免同一 stage 先后发起的不同审查流程因 `total_round` 复位而互相覆盖历史文件，定义见 spec.md FR-WHREVIEW-003"字段完整性、历史记录与自校验" |
  | `heterologous_round` | non-negative integer | 异源轮次计数，上限 3 |
  | `same_source_round` | non-negative integer | 同源轮次计数，切换前为 0 |
  | `total_round` | non-negative integer | 恒等于 `heterologous_round + same_source_round` |
  | `mode` | enum string | 本轮请求模式，`full`/`incremental`/`same-source` |
  | `actual_mode` | enum string | 3rd-review 实际执行的模式（可能因环境探测降级，与 `mode` 不同，语义见 FR-WHREVIEW-003）；引擎调用失败场景下取值 `not_executed`（round25 修复，枚举定义见 Contract 2） |
  | `verdict` | enum string | 本轮裁决结果，`pass`/`revise_required`/`escalate_to_human` |
  | `report_path` | string | 本轮渲染报告的落盘路径（Contract 5） |
  | `blocking_count` | non-negative integer | 本轮 blocking 级问题计数，用于升级人工判定 |
  | `fingerprint_repeated` | boolean | 本轮 blocking 指纹集合是否与上一轮完全相同；自本轮修复起不再直接触发 `escalate_to_human`（见 spec.md FR-WHREVIEW-003"升级人工触发条件"），仅作报告/排查用粗粒度参考信号，实际升级判据改由 `finding_fingerprints` 承接 |
  | `post_review_action` | string | D2 人工确认门推进信号，取值 `await_human_confirmation`/`auto_advance`/不适用（留空），详细规则见 Contract 6 |
  | `stage`（本轮修复新增） | enum string | 触发本次审查的 stage 标识，取值 `make-decision`/`build-spec`/`build-plan`/`build-code`/`verify-code` 之一；写入时由触发方显式提供；恢复/重启读取时须与调用方当前 stage 比对，不一致 fail-loud（见 spec.md FR-WHREVIEW-003"字段完整性、历史记录与自校验"、AC3-5、AC8-4） |
  | `history`（本轮修复新增） | array | 每轮写入时追加一条快照，不覆盖已有条目；单条快照结构：`{round_type: "heterologous"\|"same-source", round_index: integer, total_round: integer, verdict: string, blocking_count: integer, fingerprint_repeated: boolean}`；用于升级人工判定读取最近3轮同类型快照判断连续性（见下方"版本兼容说明"与 AC-D10.2） |
  | `finding_fingerprints`（本轮新增；**round28 修复：覆盖范围由"仅追踪最终仍判为 blocking 的 finding"扩展为"追踪本轮 3rd-review 原始返回、进入 FR-WHREVIEW-005 降级判定范围的全部 blocking finding，含被该规则默认降级为 minor 的 finding"——被降级为 minor 的 finding 若不写入本数组，下一轮判定"是否曾出现过"会读不到历史记录、误判为真正新发现，导致同一 finding 无限重复触发默认降级，round28 finding**） | array | 每条进入本轮 FR-WHREVIEW-005 降级判定范围的 finding（含最终维持 blocking 与被默认降级为 minor 两类，不新增独立历史表，统一用本数组、以 `severity_decision` 区分当前是 blocking 还是被降级为 minor）的稳定指纹追踪记录，元素结构 `{finding_fingerprint: string, file: string, line: integer, category: string, first_seen_round: integer, consecutive_unresolved_rounds: integer, last_status: "open"\|"resolved", diagnosed: boolean, severity_decision: string\|null}`（本轮修复，round14 finding：`file`/`line`/`category` 此前未在最小字段集中显式声明，仅在文字说明里提及"`finding_fingerprint` 基于定位点与 `category` hash 得出"，未强制落盘这些原始字段，导致指纹计算所需依据无处可查、也无法审计复现；现将其列为元素级必需字段）；`finding_fingerprint` 为对 `file`+`line`（或等效锚点）与 `category` 三者联合 hash 得出的稳定字符串，`file`/`line`/`category` 三者须原样落盘（供人工审计复现该 hash，且供 finding 级信号判据消费 `category` 做归类展示）；**`severity_decision`（round24 新增字段）**：枚举 `default_downgraded_to_minor`/`exception_a_new_change`/`exception_b_undetectable_prior_round`/`exception_c_scope_boundary`/`not_applicable`，由 **wh-review 本地计算并写入**——3rd-review 不产出、也不透传该字段（见 Contract 1/Contract 2 边界说明），wh-review 收到 3rd-review 原始 findings 后依据 FR-WHREVIEW-005 判定基线（比对本数组历史全集）计算得出，round1（`total_round=1`）等本规则不适用的场景取 `not_applicable`；只追加/更新已有条目，不删除历史指纹；字段语义与升级判据见 spec.md FR-WHREVIEW-003"升级人工触发条件"finding 级信号、severity_decision 判定规则见 spec.md FR-WHREVIEW-005 |
  | `root_cause_diagnoses`（本轮新增） | array | 每次触发"根因诊断"步骤时追加一条记录，元素结构 `{finding_fingerprint: string, triggered_round: integer, diagnosis: string, category: "subsystem_design_defect"\|"prior_fix_direction_wrong"\|"other", fix_attempt_round: integer, resolved: boolean}`；不覆盖已有条目，见 spec.md FR-WHREVIEW-003；**round26 修复**：并非每条 `finding_fingerprint` 都会有对应记录——只有触发过 FR-WHREVIEW-003"连续2轮未闭合"诊断阈值的 finding 才会产生记录；FR-WHREVIEW-005 判定"重新开放的历史发现"不要求本数组中存在对应记录，缺失不影响该判定结论，见 spec.md FR-WHREVIEW-005 |
- **`finding_fingerprints` 的 round23 新增用途（判定基线由历史全集驱动）**：spec.md FR-WHREVIEW-005"round2+ 新发现降级规则"的判定基线由本数组的历史全集（覆盖该 `review_flow_id` 全部历史轮次，**round28 修复：含 `severity_decision=default_downgraded_to_minor` 的历史条目**）驱动，而非仅比对上一轮报告；`last_status` 字段用于区分"该 `finding_fingerprint` 从未出现过"（判定为真正新发现）与"曾出现过"（不论当前 `last_status` 是 `resolved` 已闭合还是 `open` 未闭合，也不论其 `severity_decision` 当前是维持 blocking 还是被降级为 minor，均统一判定为重新开放的历史发现，维持原严重度）两大类情形；**round26 修复**：判定"是否算重新开放"仅依赖本字段本身（即该指纹是否存在于历史全集中），不要求 `root_cause_diagnoses` 中存在对应记录作为前提——很多 finding 在被标记 `resolved` 之前从未触发过诊断阈值、根本没有诊断记录可比对；`root_cause_diagnoses`（若确实存在）仅作为该 finding 确实触发过根因诊断步骤时的**额外加强判据**，用于报告细化标注（如区分"同根因复发"与"不同根因但同一定位点"），并非判定重新开放与否的必要前提，权威判定规则见 spec.md FR-WHREVIEW-005。
- **校验规则**：十五字段均非空非 null（`post_review_action` 允许留空表示不适用；`review_flow_id` 在流程发起时即生成，全流程期间不得为空；`history` 首次写入后至少含1条快照，不得为空数组；`finding_fingerprints`/`root_cause_diagnoses` 首轮无 blocking finding 时可为空数组）；`finding_fingerprints` 数组一旦存在元素，每个元素的 `file`/`line`/`category`/`finding_fingerprint` 四个指纹计算相关字段均为必需、不得为空（本轮修复，round14 finding，消除此前 `category` 等指纹计算依据字段未在最小字段集中强制声明的缺口）；`total_round = heterologous_round + same_source_round`；处于异源阶段时 `same_source_round=0`，处于同源阶段时 `heterologous_round` 保持切换时定值不再递增；`actual_mode`/`verdict`/`blocking_count`/`fingerprint_repeated`/`stage` 每轮覆盖写入，反映该轮最新结果；`review_flow_id` 同一流程内覆盖写入但值保持不变，仅在发起全新流程时更新为新值；`history`/`finding_fingerprints`/`root_cause_diagnoses` 每轮追加/更新已有条目、不覆盖删除历史
- **跨 stage/跨流程隔离结论（round21 修复，同款应用 Contract 3 的隔离方案）**：本文件此前作为覆盖整个 task 的单一全局文件，后续 stage 或同一 stage 新发起的审查流程会直接覆盖前一流程的轮次计数、`history`、`finding_fingerprints` 等状态，削弱"审查完成状态可追踪"与"恢复/重启"语义；理由与 Contract 3 round19 修复完全一致——FR-STAGE-001 并未定义"stage 严格串行执行"保证，resume 重跑、同一 stage 重复触发均可能发生。本轮改为与 Contract 3 相同的路径级隔离：路径携带 `{stage}`+`{review_flow_id}` 两个维度，物理隔离到不同文件，历史流程的轮次状态与 `history` 不再被新流程覆盖；文件内容自带的 `stage` 字段继续保留作为读取方二次核验手段（双重保障，非替代关系）。**发现规则（本文件相对于 Contract 3 的差异点，需额外定义；round22 修复：mtime 通配排序不稳，改为显式指针文件）**：Contract 3 route-decision 文件的消费方（人工审计/AC2-2 验收脚本）总是从调用链返回值或测试自身上下文中已获知 `review_flow_id`，无需盲目发现；但本文件的消费方之一——orchestrator 恢复/重启逻辑（FR-D2-001 AC8-4）——在进程重启后可能不再持有 `review_flow_id`。round21 曾定义"按 `{stage}` 通配匹配 `round-state-{stage}-*.json`，多个候选取文件系统 mtime 最近修改者"的发现规则，但该规则不稳：旧流程文件被人工修补、索引脚本重写、或批准态 artifact 晚写都会改变 mtime，可能导致恢复时选错 `review_flow_id`，进而把确认门、报告、后续推进绑定到错误流程（round22 finding）。**本轮改为显式持久化当前活跃流程指针，不再以 mtime 作为默认发现路径**：消费方（orchestrator 恢复/重启逻辑）先读取 `tasks/{task-id}/reviews/active-flow-{stage}.json` 指针文件取得 `review_flow_id`（字段/写入规则见下方"附属：活跃审查流程指针文件"），据此直接拼出 `round-state-{stage}-{review_flow_id}.json`/`route-decision-{stage}-{review_flow_id}.json` 路径，无需通配盲搜；定位到候选文件后仍须按 spec.md FR-WHREVIEW-003"字段完整性、历史记录与自校验"条款校验文件内容自带的 `stage`/`review_flow_id` 字段与指针/文件名一致，不一致须 fail-loud 报错并终止，不得静默假定该文件属于当前流程继续消费。**mtime 通配排序规则保留作为指针文件本身丢失/损坏时的兜底人工排障手段（仅兜底，非默认路径）**：仅供人工诊断时手动执行 `ls -t round-state-{stage}-*.json` 类命令排查候选文件，不作为 orchestrator 自动化恢复逻辑的组成部分。

### 附属：活跃审查流程指针文件（active-flow-{stage}.json，round22 新增；round24 修复：补充并发约束；round25 修复：收紧"流程已结束"判定，堵住 D2 人工确认门绕过缺口；round27 修复：补充 prepare 对该悬而未决子状态的显式阻断返回值，堵住"复用既有流程后仍放行下一轮"绕过 D2 门的缺口）

- **Owner**: wh-review（每次分配或复用某 stage 的 `review_flow_id` 时，即 FR-WHREVIEW-007"两段式调用流程"步骤1"准备"完成后，同步写入/更新）
- **Consumer**: orchestrator 恢复/重启逻辑（FR-D2-001 AC8-4，T023a）；其余需要在不持有 `review_flow_id` 时定位当前活跃流程的消费方
- **路径**: `tasks/{task-id}/reviews/active-flow-{stage}.json`（`{stage}` 取值 `make-decision`/`build-spec`/`build-plan`/`build-code`/`verify-code` 之一；每个 stage 一份，不跨 stage 共用）
- **字段与类型**：

  | 字段 | 类型 | 说明 |
  |------|------|------|
  | `review_flow_id` | string | 该 stage 当前活跃审查流程的稳定唯一 ID，定义见 Contract 4/spec.md FR-WHREVIEW-003 |
  | `updated_at` | string (ISO 8601) | 本次写入时刻 |

- **并发约束（定死，权威声明，round24 修复：本文档已放弃"stage 严格串行"假设，须显式补充同一 task_id+stage 下多活跃流的处理规则，消除"并发重跑/重入场景下指针被最后一次 prepare 覆盖、重启恢复拿错 flow"缺口）**：同一 `task_id` + `stage` 在任意时刻至多允许存在一个"进行中"的审查流程。**"流程已结束"判定依据（round25 修复：`verdict` 到达 `pass` 不再单独构成"已结束"，须与 `post_review_action` 及人工确认 artifact 状态联合判定，否则会让新的 prepare 调用绕过 D2 人工确认门分配新 `review_flow_id`，见 round25 finding）**：对应 `round-state-{stage}-{review_flow_id}.json` 须同时满足——① `verdict` 已到达终态；且② 满足下列之一：
  - (a) `verdict=escalate_to_human`（该终态无 `post_review_action` 语义，直接视为已结束）；
  - (b) `verdict=pass` 且 `post_review_action=auto_advance`；
  - (c) `verdict=pass` 且 `post_review_action=await_human_confirmation`，且对应的人工确认 artifact `human-confirmation-{stage}-{review_flow_id}-{total_round}.json`（字段定义见 spec.md FR-D2-001，`{total_round}` 取该 round-state 文件当前 `total_round` 值）已存在，且其内部 `stage`/`review_flow_id`/`total_round` 字段与当前 round-state 一致。

  只要①②未同时满足即视为"进行中"，包括但不限于：`verdict` 尚未到达终态（含该 round-state 文件尚不存在——从未产出过 verdict——的情形）；或 `verdict=pass` 且 `post_review_action=await_human_confirmation` 但对应人工确认 artifact 尚不存在或字段不匹配（即 D2 人工确认门仍悬而未决）。后一种情形若被误判为"已结束"，会导致 prepare 阶段为同一 `task_id`+`stage` 分配全新 `review_flow_id`，绕过尚未完成的人工确认，因此必须显式排除。
- **prepare 判断顺序（FR-WHREVIEW-007 步骤1"准备"，分配/复用 `review_flow_id` 之前必须遵循）**：
  1. 读取 `active-flow-{stage}.json`（若存在），取得既有 `review_flow_id`，据此定位 `round-state-{stage}-{既有review_flow_id}.json`。
  2. 指针文件不存在，或指向的 round-state 文件不存在 → 视为当前无进行中流程，直接分配全新 `review_flow_id` 并写入本文件（首次发起场景）。
  3. 指针存在且对应 round-state 未满足上方"流程已结束"判定（即仍处于"进行中"，round25 修复：含 `verdict=pass` 但 `post_review_action=await_human_confirmation` 且人工确认 artifact 尚未生成/字段不匹配的情形）→ **默认复用**该既有 `review_flow_id`，不得分配新值、不得覆盖本文件的 `review_flow_id` 字段（仅可更新 `updated_at`）；这是正常的"同一审查流程继续下一轮"或"等待人工确认中"场景，不视为并发冲突，不得因此报错阻断，也不得据此绕过 D2 人工确认门分配新流程。**round27 修复："进行中"须再按具体子状态区分是否允许继续推进下一轮，堵住"复用后仍放行下一轮"绕过 D2 门的缺口**：
     - **3a（可继续推进，round28 修复：补充返回值 schema）**：若"进行中"的原因是 `verdict` 尚未到达终态、或 `verdict=revise_required` 需继续下一轮，复用既有 `review_flow_id` 后按 FR-WHREVIEW-007 步骤1正常计算下一个 `total_round`，允许步骤2子代理生成新 prompt 文件、允许进入步骤3执行审查；prepare 返回 `{status: "ready", review_flow_id, total_round, contract_path}` 四字段均非空（返回值 schema 权威定义见 spec.md FR-WHREVIEW-007"输出契约"）。
     - **3b（人工确认门悬而未决，round25 已识别该子状态，round27 修复补充其应有的推进行为；round28 修复：补充返回值 schema）**：若"进行中"的原因具体是 `verdict=pass` 且 `post_review_action=await_human_confirmation` 且对应人工确认 artifact 尚未生成或字段不匹配，复用既有 `review_flow_id` 的同时，prepare 必须直接返回明确的 `blocked_by_human_confirmation` 状态给调用方——返回值为 `{status: "blocked_by_human_confirmation", review_flow_id}` 两字段，不含 `total_round`/`contract_path` 键（这两个值在该场景下未被计算，返回值 schema 权威定义见 spec.md FR-WHREVIEW-007"输出契约"），且本次调用不得分配/计算下一个 `total_round`、不得允许步骤2子代理生成新的 prompt 文件、不得允许调用方进入步骤3执行审查；调用方收到该状态后须停在原地等待人工确认，只有对应人工确认 artifact 生成后，下一次 prepare 调用才恢复按 3a 正常推进。
  4. 指针存在且对应 round-state 已满足上方"流程已结束"判定（`verdict=escalate_to_human`；或 `verdict=pass` 且 `post_review_action=auto_advance`；或 `verdict=pass` 且 `post_review_action=await_human_confirmation` 且人工确认 artifact 已存在且字段匹配）→ 视为该流程已结束，可正常分配全新 `review_flow_id` 并覆盖写入本文件。
  5. **仅当调用方显式要求"强制开新流"**（如用户主动要求放弃当前进行中流程、重新发起审查）时，才允许在既有流程仍进行中的情况下覆盖指针；覆盖前必须 fail-loud 报错、要求显式确认后才可继续，不得在检测到"既有流程仍进行中"时静默覆盖指针——静默覆盖会导致原进行中流程的后续轮次/D2 确认门推进逻辑读取到错误的 `review_flow_id`，破坏可审计性（round24 finding）。
- **校验规则**：每次 wh-review 分配全新 `review_flow_id` 或复用既有 `review_flow_id`（同一进行中流程，见上方"并发约束"与"prepare 判断顺序"）时，均须同步覆盖写入本文件（`updated_at` 随之更新为当次写入时刻；复用场景下 `review_flow_id` 值本身不变）；消费方读取本文件取得 `review_flow_id` 后，仍须按上方"发现规则"校验对应 `round-state-{stage}-{review_flow_id}.json`/`route-decision-{stage}-{review_flow_id}.json` 内部的 `stage`/`review_flow_id` 字段与本文件/文件名一致，不一致 fail-loud；本文件缺失或 JSON 解析失败时，orchestrator 恢复/重启逻辑须 fail-loud 报错终止，不得静默退回 mtime 通配扫描自动继续（mtime 排序仅供人工排障，见上方说明）
- **版本兼容说明**：本期新增契约，替代 round21 定义的 mtime 通配排序发现规则作为默认路径；不影响 round-state/route-decision 文件自身的路径与字段结构；round24 新增"并发约束"与"prepare 判断顺序"条款，不改变本契约已定义的字段结构与路径规则；round27 在"prepare 判断顺序"第3条内部新增 3a/3b 子状态区分与 `blocked_by_human_confirmation` 返回值定义，同样不改变本契约已定义的字段结构与路径规则
- **版本兼容说明**：本期新增契约；升级人工触发条件拆分为轮级（连续3轮 `blocking_count≥3`）与 finding 级（单条 finding 指纹连续2轮未闭合，先触发根因诊断+定向修复尝试，尝试对应轮次仍未闭合再判升级，round16 修复：阈值由3改为2）两类，判据来源分别为 `history` 与 `finding_fingerprints`（本轮修复：原表述"读取本文件历史轮次数据"未定义历史从何而来——原字段列表仅有顶层覆盖式存储，覆盖后前序轮次数据即丢失，无法支撑"连续"语义；现由 `history`/`finding_fingerprints` 数组分别承载两类历史）：轮级信号按 `round_type` 过滤出与当前阶段匹配的快照，取最近3条按 `round_index` 升序核对，两类计数器（`heterologous`/`same-source`）分别独立比较窗口，不跨阶段合并，`history` 中对应类型快照不足3条时不判定为满足；finding 级信号直接读取 `finding_fingerprints` 对应条目的 `consecutive_unresolved_rounds`

---

## Contract 5: 报告文件与索引

- **Owner**: wh-review（`render-review-report.mjs`）
- **Consumer**: 人工 / D2 人工确认门 / 下游 stage
- **路径**: 报告 `tasks/{task-id}/reports/<stage>--<review_flow_id>--<round>-{pass|revise|escalated}.md`（后缀由当轮 verdict 决定，三态穷尽必填，不存在无后缀形态，详见下方"校验规则"）；索引 `tasks/{task-id}/reports/report-index.md`
- **字段与类型**：
  - 报告：6 章结构（Summary/Blocking Issues/Minor Issues/Pass Items/Delta/Metadata，各章最小必要信息点见 spec.md FR-WHREVIEW-004 AC4-3；Metadata 章字段全集：task-name/review_flow_id/heterologous_round/same_source_round/total_round/mode/actual_mode/contract_path/contract_hash/timestamp）
  - 索引行：`seq`/`timestamp`/`stage`/`report_kind`/`verdict`/`report_path`/`summary`
- **校验规则**：`<stage>` 限定 5 值之一；`<review_flow_id>` 即本次审查流程的稳定唯一 ID（定义见 Contract 4/spec.md FR-WHREVIEW-003）；`<round>` 即 `total_round`，其计数范围是单次审查流程（该 stage 每次发起新一轮审查流程时从 1 重新计数，同一流程内不因异源/同源模式切换而重置，详见 FR-WHREVIEW-003）；仅靠 `<stage>` 前缀不足以避免同一 stage 先后发起的不同审查流程互相覆盖（`total_round` 均从1重新计数），文件名须同时含 `<review_flow_id>` 才能避免覆盖历史证据（round14 finding，见 spec.md FR-WHREVIEW-001 命名规则）；文件名后缀与裁决枚举一一映射且不得共用：`verdict=pass`→`-pass`、`verdict=revise_required`→`-revise`、`verdict=escalate_to_human`→`-escalated`；后缀 100% 由该轮渲染报告时的当轮 verdict 决定，verdict 三态穷尽、每轮渲染必有其一，不存在"尚无终审"的无后缀中间态（round17 修复，删除此前"未终审时无后缀"的表述，与"revise_required 用 -revise 后缀"相矛盾，见 spec.md FR-WHREVIEW-001 AC1-5）；报告文件名须匹配正则 `^(make-decision|build-spec|build-plan|build-code|verify-code)--[a-z0-9-]+--\d+-(pass|revise|escalated)\.md$`；索引每次渲染后追加一行，不得覆盖历史记录
- **版本兼容说明**：迁移自 agenthub `verifier-report-index.md` 既有列结构，字段名保持一致以复用既有渲染逻辑参考实现

---

## Contract 6: post_review_action（D2 人工确认门推进信号）

- **Owner**: wh-review
- **Consumer**: 各 stage orchestrator
- **落盘位置**：本字段随 Contract 4 轮次状态文件一同落盘，不单独建文件（AC8-1/AC8-2/AC8-4）
- **字段与类型**：`post_review_action` enum string，取值 `await_human_confirmation` / `auto_advance` / 不适用（留空）
- **校验规则**：
  - `verdict=pass` 且 `stage ∈ {make-decision, build-plan, verify-code}` → `await_human_confirmation`
  - `verdict=pass` 且 `stage ∈ {build-spec, build-code}` → `auto_advance`
  - `verdict=revise_required` 或 `escalate_to_human` → 字段不适用
- **版本兼容说明**：本期新增字段，无历史版本；决策来源 decision-log D2（原始验收标准 #4 的收窄修正）

---

## Contract 7: intake 合同机器可消费字段（C1-C6）

- **Owner**: wh-review intake 合同（make-decision 专属）
- **Consumer**: make-decision stage agent / C1-C6 验收判据
- **字段与类型**：`decision`（string）、`scope.in`（array，非空）、`scope.out`（array，非空）、`open_questions`（array，允许为空但已标注项须含"不阻断+跟进"说明）
- **校验规则**：C1-C6 六项判据全部覆盖，标准字段均非空
- **版本兼容说明**：判据定案于 decision-log D4，本期为首个实现版本

---

## Contract 8: test-acceptance 合同新鲜性字段（F1-F6）

- **Owner**: wh-review test-acceptance 合同（verify-code 专属）
- **Consumer**: verify-code stage agent / F1-F6 验收判据
- **字段与类型**：git_sha（string）、content_hash（string，用于 L2/RED/GREEN 报告）、AC-ID 路由表（test-strategy.md 中的 ac_routes，非空）
- **校验规则**：F1（commit 晚于 decision-log 更新）、F2（AC-ID 全集非空路由）、F3（无引用废弃字段）、F4（fresh-capture git_sha 与 HEAD 一致）、F5（content_hash 未变）、F6（测试命令与 build-code 产物记录一致）
- **版本兼容说明**：判据定案于 decision-log D5，本期为首个实现版本

---

## Contract 9: metrics M4 记录字段映射

- **Owner**: wh-review
- **Consumer**: `metrics/collector.mjs`（`recordSkeleton`/`updateOwnResult`）
- **字段与类型**：`rework_rounds`（← 轮次状态 `total_round`）、`duration_ms`（← 本轮审查耗时）、`human_intervention`（← 是否触发 `escalate_to_human`）；`verdict`/`mode` 等 M4 字段之外信息保留在 wh-review 自身轮次状态文件
- **校验规则**：不手写独立指标文件，必须通过 `metrics/collector.mjs` 既有接口写入；M4 十核心字段全集非空

---

## Contract 10: 文档快照文件（Delta Package diff 裁剪）

- **Owner**: wh-review（每轮审查提交前自动生成）
- **Consumer**: wh-review 自身（下一轮组装 materials 时读取，与当前文档内容做文本 diff）
- **materials 归属（round23 修复）**：wh-review 是文档类审查对象 snapshot diff 生成与最终 `materials` 组装的唯一 owner——本合同产出的 diff 直接构成 `materials` 核心内容，不经由 Contract 11 定义的 `prompt-{review_flow_id}-r{N}.md` 文件中转；该文件在 Contract 11 中的定位是补充上下文，不与本合同竞争 `materials` 归属权威（此前版本 Contract 11 允许 wh-review 直接把该文件内容当 `materials`，与本合同形成双重真相源，round23 finding，予以订正）。
- **路径**: `tasks/{task-id}/reviews/snapshots/{doc}-{review_flow_id}-r{N}.md`（`{doc}` 为被审文档基础文件名，不含目录与扩展名；`{review_flow_id}` 为本次审查流程的稳定唯一 ID，定义见 Contract 4/spec.md FR-WHREVIEW-003；`{N}` 为该文档参与审查时对应的 `total_round`；权威声明见 spec.md FR-WHREVIEW-006）
- **字段与类型**：文件内容为纯文本，即被审文档在该轮审查提交前的完整原样内容，不做任何结构化包装
- **校验规则**：仅适用于文档类审查对象（spec.md/data-contracts.md/plan.md/tasks.md）；每轮审查提交前必须先落盘当轮快照，`total_round≥2` 时读取 round(N-1) 快照与当前文档内容做 diff 作为 materials；round(N-1) 快照缺失时 fail-loud，不静默退化为全文送审；快照文件一经生成不得覆盖或删除；文件名须含 `{review_flow_id}`，仅靠 `{doc}-r{N}.md` 不足以区分同一 stage 先后发起的不同审查流程（`total_round` 均从1重新计数），会导致覆盖历史快照（round14 finding）
- **版本兼容说明**：本期新增契约，配合 FR-WHREVIEW-003 既有"第2轮起增量降级构造 Delta Package"条款，是文档类审查对象的专属补充规则；**round25 修复**：本合同是 spec.md FR-WHREVIEW-006 定义的通用"上一轮 materials 基线持久化机制"在文档类审查对象上的具体实现，代码/测试/决策类审查对象的对应基线记录见 Contract 12

---

## Contract 11: 审查提示词补充上下文文件（prompt-{review_flow_id}-r{N}.md，round23 修复：定位由 materials 来源收紧为补充上下文）

- **Owner**: 各 stage 主 agent 派生的审查提示词生成子代理（stage 收尾、调用 wh-review 之前触发）
- **Consumer**: wh-review（读取该文件内容作为组装 `{mode, contract, materials}` 三元组时的**补充上下文**，纳入最终 `materials` 的辅助说明部分；`materials` 字段本体由 wh-review 自身生成——文档类审查对象复用 Contract 10 快照 diff 机制作为 `materials` 核心内容（round23 修复：此前版本表述"仅作为 materials 字段的来源"与 Contract 10"wh-review 自身生成 diff 作为 materials"形成双重真相源冲突，予以订正）；`mode`/`contract` 两个字段独立取自 round-state-{stage}-{review_flow_id}.json 当轮判定值与 route-decision-{stage}-{review_flow_id}.json 的 `contract_path`/`contract_hash`，不依赖对本文件的解析，见 Contract 1 校验规则"`mode`/`contract` 必须是独立显式字段，不得坍缩进 `materials` 纯文本"与 spec.md FR-WHREVIEW-007）
- **路径**: `tasks/{task-id}/reviews/prompt-{review_flow_id}-r{N}.md`（`{review_flow_id}`/`{N}`〈即 `total_round`〉均取值自 wh-review "准备"调用（步骤1）的返回值，**由子代理消费、非子代理自行生成或猜测**——round16 修复：消除子代理需要这两个 ID 却只能在调用 wh-review 之后才能获得的循环依赖，权威声明见 spec.md FR-WHREVIEW-007"两段式调用流程"）
- **字段与类型**：文件内容为纯文本，**仅含本轮送审的补充说明/上下文摘要**（如 stage 名称等元信息，round23 修复：不含 `materials` 本体）——**round22 修复：禁止内嵌合同全文**。该文本不是 `{mode, contract, materials}` 三元组中 `materials` 字段的来源（round23 修复，此前版本"该文本只是 materials 字段的来源"的表述予以订正），`materials` 字段本体由 wh-review 自身按 Contract 10 快照 diff 机制生成；`mode`/`contract` 两个字段与本文件内容完全无关：`mode` 由 wh-review 自身根据当轮 round-state 判定值独立赋值，`contract` 由 wh-review 独立读取 route-decision 记录的 `contract_path`/`contract_hash` 赋值，两者均不依赖对本文件的解析（校验规则见下）。此前版本（round14 修复）允许该文本同时内嵌合同原文，理由是"便于审查方阅读理解上下文，不违反 Contract 1 独立字段校验"；本轮订正：内嵌合同原文会产生一份游离于 route-decision 记录之外的"第二份合同文本"，当两者不一致时审查 agent 实际读到哪份没有强约束，可能导致审查结果漂移（round22 finding），故收紧为物理分离、单一权威来源方案
- **校验规则**：**子代理拼出本文件落盘路径前，必须先对 `task_id` 执行 Contract 3"task_id 路径安全约束"定义的同一套 `^[A-Za-z0-9._-]+$` 字符集校验（round27 修复）**——校验不通过须 fail-loud 拒绝生成/写入该文件，不得静默清洗或截断后继续拼接路径，也不得先落盘写入再依赖 wh-review 下一次调用（步骤3）才发现问题；子代理须在 stage 主 agent 完成"准备"调用（步骤1）取得 `review_flow_id`/`total_round` 之后、wh-review 执行实际审查（步骤3）被调用之前完成该文件落盘；wh-review 读取该文件失败或文件不存在时 fail-loud 报错，不静默回退为空补充上下文（round23 修复：措辞由"空 materials"调整为"空补充上下文"，fail-loud 语义不变）；stage 主 agent 自身进程内不得直接拼接 materials 全文替代该文件；文件名须含 `{review_flow_id}`，仅靠 `prompt-r{N}.md` 不足以区分同一 stage 先后发起的不同审查流程（round14 finding）；`contract_path` 权威解析结果仍以步骤1中 wh-review 自己写入 route-decision-{stage}-{review_flow_id}.json 的值为准，**子代理不读取、不消费 `contract_path`，不得自行重新解析、也不得将其指向的合同内容写入本文件**（round16 修复原为"不得自行重新解析"，round22 修复收紧为"完全不读取、不内嵌"）
- **版本兼容说明**：本期新增契约，目的是把提示词/补充说明文本的组装工作转移到独立子代理的上下文中，减少 stage 主 agent 自身的上下文消耗；**round23 修复**：此前版本子代理产出物即为 `materials` 字段的直接来源，本轮收紧为 wh-review 是 `materials` 唯一 owner（含文档类审查对象的 snapshot diff，见 Contract 10），本文件降级为补充上下文来源，不再与 wh-review 自身生成的 diff 竞争权威，消除与 Contract 10 的双重真相源冲突
- **版本兼容说明**：复用现有 M4 record-schema（`metrics/record-schema.mjs`），本期不新增字段，仅新增写入方（wh-review）

---

## Contract 12: 非文档类审查对象上一轮 materials 基线记录（round25 新增，支撑 FR-WHREVIEW-005 例外 (a)/(b) 判定；round26 修复：补充 materials 全文持久化，仅靠 hash 无法支撑"可见性"比对）

- **Owner**: wh-review（每轮审查提交前自动生成，代码/测试/决策类审查对象专属）
- **Consumer**: wh-review 自身（下一轮判定 FR-WHREVIEW-005 round2+ 新发现降级规则例外 (a)/(b) 时读取比对）
- **materials 归属**：本合同是 FR-WHREVIEW-006 定义的"上一轮 materials 基线持久化机制"在代码/测试/决策类审查对象（build-code/verify-code/make-decision 等 stage，审查对象为源码 diff、测试报告、决策合同等非文档类内容）上的具体落地方式；与 Contract 10（文档类快照）共同构成该通用机制的两种实现，二者互不覆盖，按审查对象类型二选一生效
- **路径**: 元数据记录 `tasks/{task-id}/reviews/materials-baseline-{stage}-{review_flow_id}-r{N}.json`（`{stage}` 取当轮所属 stage；`{review_flow_id}`/`{N}`〈即 `total_round`〉定义同 Contract 10，均取值自 wh-review "准备"调用返回值）；**round26 新增**：本轮实际提交 materials 的全文快照文件 `tasks/{task-id}/reviews/snapshots/materials-{stage}-{review_flow_id}-r{N}.txt`（与 Contract 10 文档类快照共享同一 `tasks/{task-id}/reviews/snapshots/` 目录，文件名前缀 `materials-` 区分于文档类快照的 `{doc}-` 前缀，`{stage}`/`{review_flow_id}`/`{N}` 取值同上）
- **字段与类型**：

  | 字段 | 类型 | 说明 |
  |------|------|------|
  | `git_sha` | string | 本轮实际送审 materials 对应的代码基线 commit hash（或等效版本锚点），辅助溯源信息 |
  | `materials_content_hash` | string | 本轮传给 3rd-review 引擎的 materials 内容 hash |
  | `covered_paths` | array\<string\> | 本轮 materials 实际覆盖的文件/定位路径列表，供例外 (a)/(b) 判定"某 finding 定位点是否在本轮覆盖范围内"使用，辅助溯源信息 |
  | `materials_snapshot_path`（round26 新增） | string | 指向上方"路径"字段定义的 materials 全文快照文件（`.txt`）的相对路径；例外 (a)/(b) 判定须读取该文件全文做比对，而非仅比对 `materials_content_hash` |

  **round26 修复：materials 全量内容（或等效 diff/patch 文本）须落盘至 `materials_snapshot_path` 指向的快照文件**，供下一轮判定例外 (a)/(b) 时直接读取全文比对——此前版本"是否额外存储全量内容由实现自行选择"不足以支撑判定，因为 `git_sha`/`materials_content_hash` 只能证明代码基线/内容是否发生变化，无法证明"该 finding 依赖的上下文在上一轮 materials 中是否真的可见"（round26 finding）；`git_sha`/`covered_paths` 保留作为辅助溯源信息，不作为判定可见性的唯一依据。
- **校验规则**：仅适用于代码/测试/决策类审查对象（build-code/verify-code/make-decision 等，不含 spec.md/data-contracts.md/plan.md/tasks.md 四类文档，文档类走 Contract 10）；每轮审查提交（调用 3rd-review 引擎）之前必须先落盘当轮基线记录（JSON 元数据文件与 materials 全文快照文件两部分，二者均不得缺失）；下一轮判定 FR-WHREVIEW-005 例外 (a)/(b) 时读取上一轮基线记录（含全文快照）失败或缺失须 fail-loud 报错，不得静默跳过例外判定、直接按默认降级规则处理；两份文件均一经生成不得覆盖或删除；文件名须含 `{review_flow_id}`，避免同一 stage 先后发起的不同审查流程互相覆盖（原因同 Contract 10 round14 finding）
- **版本兼容说明**：本期新增契约，与 Contract 10 共同构成 spec.md FR-WHREVIEW-006 定义的通用"上一轮 materials 基线持久化机制"的两种落地方式（round25 修复：消除此前版本该机制仅覆盖文档类、代码/测试/决策类场景无对应持久化的缺口；round26 修复：非文档类基线此前仅持久化 hash 摘要，无法支撑 FR-WHREVIEW-005 例外 (a)/(b) 的可见性比对，补充 `materials_snapshot_path` 全文快照字段与对应落盘要求）
