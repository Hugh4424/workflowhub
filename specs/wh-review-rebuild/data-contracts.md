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
  | `materials` | string | 完整审查材料包文本内容；文档类审查对象（spec.md/data-contracts.md/plan.md/tasks.md）在 `total_round≥2` 时改为 round(N-1) 文档快照与当轮文档内容的文本 diff，而非全文，快照生成与存放规则见 FR-WHREVIEW-006 / Contract 10 |
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
  | `findings` | array/object | 审查发现项集合；来源②失败场景下 wh-review 合成时可为空数组；`total_round≥2` 时，若某条 finding 命中 FR-WHREVIEW-005"round2+ 新发现降级规则"，须在对应元素上标注 `severity_decision`（枚举 `default_downgraded_to_minor`/`exception_a_new_change`/`exception_b_undetectable_prior_round`/`exception_c_scope_boundary`/不适用）供报告 Blocking/Minor Issues 章节消费 |
  | `actual_mode` | enum string | 引擎实际执行的模式，`full`/`incremental`/`same-source` 之一，用于比对 wh-review 请求的 `mode` 是否被引擎降级/改写；来源②失败场景下取 wh-review 本轮请求的 `mode` 原值（引擎从未实际执行，无"降级"可言） |
  | `synthetic` | boolean（可选） | `true` 表示本 JSON 由 wh-review 合成、非 3rd-review 引擎真实产出，仅在下方"失败路径合成规则"场景出现；引擎正常产出的真实 `--output` 不含此字段（或显式为 `false`） |
  | `failure_reason` | enum string（可选，`synthetic: true` 时必填） | 失败具体原因，取值 `runner-missing`/`non-zero-exit`/`timeout`/`output-unparseable` 之一；仅在 `synthetic: true` 时出现 |
- **校验规则**：结果文件缺失或不可解析时属于上述 `escalate_to_human` 来源②（NFR-2 例外场景），wh-review 最终裁决直接判定为 `escalate_to_human`（不新增 `unknown` 裁决态），并在轮次状态文件与报告中标注触发原因；此场景与来源①（多轮历史综合升级）互斥，不叠加判断
- **失败路径合成规则（消除"失败场景引擎未产出 `--output` 却要求下游读取该文件"的自相矛盾，round12 finding，权威定义见 spec.md FR-THIRDREVIEW-001"失败路径 raw artifact 合成规则"）**：当 3rd-review 调用属于 NFR-2 定义的失败场景（runner 缺失/不可执行、非零退出、超时、`--output` 缺失或不可解析）时，引擎从未产出真实 `--output`，wh-review 不得假装该文件已由引擎写入。此时 wh-review 必须自行合成一份最小失败元数据 JSON（`verdict: "escalate_to_human"` + `synthetic: true` + `failure_reason`），写入与正常场景完全相同的落盘路径（见下方"落盘路径"）。两种来源统一落在同一路径、统一含 `verdict` 字段，gate_cmd/人工审计只需从该路径读取 `.verdict`，无需分裂成两套读取逻辑，仅内容来源不同。
- **落盘路径（消除与"中间产物"旧表述的矛盾）**：本三元组（或失败场景下 wh-review 合成的失败元数据）的序列化 JSON 即为落盘内容，实际持久化证据路径由 spec.md FR-THIRDREVIEW-001"evidence/report 落盘路径规则"权威定义为 `tasks/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`（`{stage}` 为此前修复新增维度，避免同一 task_id 下不同 stage 各自从1计数的轮次编号互相覆盖；`{review_flow_id}` 为本轮修复新增维度，定义见 Contract 4/spec.md FR-WHREVIEW-003，避免同一 stage 先后发起的不同审查流程因 `total_round` 复位而互相覆盖，round14 finding）。该证据文件须持久保留供 gate_cmd/人工审计读取（见 tasks.md 对应验收行），不属于可随意清理的临时产物；唯一可随意清理的中间产物是序列化传给 `--diff` 的临时输入文件，见 spec.md FR-WHREVIEW-001 落盘契约第1条。
- **版本兼容说明**：本三元组为 3rd-review 引擎单次调用的返回结构定义；旧版"不落入 task_tracking_root、消费后可清理"表述与上方落盘路径条款互斥，本条款以落盘路径条款为准，予以订正（FR-WHREVIEW-001 落盘契约第1条）

---

## Contract 3: route-decision 记录文件

- **Owner**: wh-review
- **Consumer**: 人工审计 / AC2-2 验收脚本
- **路径**: `tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json`（round19 修复：路径按 `stage`+`review_flow_id` 两个维度隔离，不再是单一全局文件；`review_flow_id` 在准备阶段第一次写入前即已生成，两次写入命中同一物理文件，详见下方"跨 stage/跨流程隔离结论"）
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
- **跨 stage/跨流程隔离结论（round19 修复：不再依赖未被保障的"stage 严格串行"假设）**：round7-10 曾以"FR-STAGE-001 约定同一 task_id 下 5 个 stage 严格串行触发审查、不并发"为由，认定本文件无需路径隔离、仅靠内容自带的 `stage` 字段自校验即可应对跨 stage 场景；但 FR-STAGE-001 实际条款标题即为"5 stage 收尾统一（回归保护项，非待改造项）"，全文只约定"5 个 stage 收尾步骤统一调用 `docs/human-brief-template.md`"这一回归保护要求，并未定义任何串行/互斥调用保证——若发生 resume 重跑、并发工具调用、或同一 stage 被重复触发，覆盖写会破坏可审计性且不可探测，且当前无消费方对此做 fail-loud 校验（区别于 Contract 4 round-state.json 已有的 `stage` 自校验 fail-loud 消费逻辑）。本轮改为路径级隔离（选择更简单的落地方案）：路径本身携带 `{stage}` 与 `{review_flow_id}` 两个维度，物理隔离到不同文件，无论是否串行、是否并发、是否重复触发都不会互相覆盖，不再依赖"stage 严格串行"这一未被 FR-STAGE-001 保障的假设；文件内容自带的 `stage` 字段继续保留作为读取方二次核验手段（双重保障，非替代关系）。Contract 4 round-state.json 的路径与自校验设计维持不变，不在本轮修复范围内。
- **版本兼容说明**：本期新增契约，仅保留最近一次路由决策，无历史版本兼容问题

---

## Contract 4: 轮次状态文件

- **Owner**: wh-review
- **Consumer**: wh-review 自身（跨轮读取判断降级/升级）、orchestrator 重启恢复逻辑（FR-D2-001 AC8-4）
- **路径**: `tasks/{task-id}/reviews/round-state.json`（权威声明见 spec.md FR-WHREVIEW-003"落盘路径"条款；`task-id` 来源见 FR-WHREVIEW-001"task-id 来源契约"；与 Contract 3 `route-decision-{stage}-{review_flow_id}.json` 共享同一 `tasks/{task-id}/reviews/` 目录结构，不另设新目录）
- **字段与类型**：
  | 字段 | 类型 | 说明 |
  |---|---|---|
  | `review_flow_id`（本轮新增） | string | 本次审查流程的稳定唯一 ID，仅含 `[a-z0-9-]` 字符；某 stage 发起全新审查流程（`total_round` 即将从1重新计数）时生成一次，同一流程内（含异源转同源）保持不变；用于报告/prompt/人工确认/raw verdict/文档快照等跨轮持久化 artifact 的文件名，避免同一 stage 先后发起的不同审查流程因 `total_round` 复位而互相覆盖历史文件，定义见 spec.md FR-WHREVIEW-003"字段完整性、历史记录与自校验" |
  | `heterologous_round` | non-negative integer | 异源轮次计数，上限 3 |
  | `same_source_round` | non-negative integer | 同源轮次计数，切换前为 0 |
  | `total_round` | non-negative integer | 恒等于 `heterologous_round + same_source_round` |
  | `mode` | enum string | 本轮请求模式，`full`/`incremental`/`same-source` |
  | `actual_mode` | enum string | 3rd-review 实际执行的模式（可能因环境探测降级，与 `mode` 不同，语义见 FR-WHREVIEW-003） |
  | `verdict` | enum string | 本轮裁决结果，`pass`/`revise_required`/`escalate_to_human` |
  | `report_path` | string | 本轮渲染报告的落盘路径（Contract 5） |
  | `blocking_count` | non-negative integer | 本轮 blocking 级问题计数，用于升级人工判定 |
  | `fingerprint_repeated` | boolean | 本轮 blocking 指纹集合是否与上一轮完全相同；自本轮修复起不再直接触发 `escalate_to_human`（见 spec.md FR-WHREVIEW-003"升级人工触发条件"），仅作报告/排查用粗粒度参考信号，实际升级判据改由 `finding_fingerprints` 承接 |
  | `post_review_action` | string | D2 人工确认门推进信号，取值 `await_human_confirmation`/`auto_advance`/不适用（留空），详细规则见 Contract 6 |
  | `stage`（本轮修复新增） | enum string | 触发本次审查的 stage 标识，取值 `make-decision`/`build-spec`/`build-plan`/`build-code`/`verify-code` 之一；写入时由触发方显式提供；恢复/重启读取时须与调用方当前 stage 比对，不一致 fail-loud（见 spec.md FR-WHREVIEW-003"字段完整性、历史记录与自校验"、AC3-5、AC8-4） |
  | `history`（本轮修复新增） | array | 每轮写入时追加一条快照，不覆盖已有条目；单条快照结构：`{round_type: "heterologous"\|"same-source", round_index: integer, total_round: integer, verdict: string, blocking_count: integer, fingerprint_repeated: boolean}`；用于升级人工判定读取最近3轮同类型快照判断连续性（见下方"版本兼容说明"与 AC-D10.2） |
  | `finding_fingerprints`（本轮新增） | array | 每条 blocking finding 的稳定指纹追踪记录，元素结构 `{finding_fingerprint: string, file: string, line: integer, category: string, first_seen_round: integer, consecutive_unresolved_rounds: integer, last_status: "open"\|"resolved", diagnosed: boolean}`（本轮修复，round14 finding：`file`/`line`/`category` 此前未在最小字段集中显式声明，仅在文字说明里提及"`finding_fingerprint` 基于定位点与 `category` hash 得出"，未强制落盘这些原始字段，导致指纹计算所需依据无处可查、也无法审计复现；现将其列为元素级必需字段）；`finding_fingerprint` 为对 `file`+`line`（或等效锚点）与 `category` 三者联合 hash 得出的稳定字符串，`file`/`line`/`category` 三者须原样落盘（供人工审计复现该 hash，且供 finding 级信号判据消费 `category` 做归类展示）；只追加/更新已有条目，不删除历史指纹；字段语义与升级判据见 spec.md FR-WHREVIEW-003"升级人工触发条件"finding 级信号 |
  | `root_cause_diagnoses`（本轮新增） | array | 每次触发"根因诊断"步骤时追加一条记录，元素结构 `{finding_fingerprint: string, triggered_round: integer, diagnosis: string, category: "subsystem_design_defect"\|"prior_fix_direction_wrong"\|"other", fix_attempt_round: integer, resolved: boolean}`；不覆盖已有条目，见 spec.md FR-WHREVIEW-003 |
- **校验规则**：十五字段均非空非 null（`post_review_action` 允许留空表示不适用；`review_flow_id` 在流程发起时即生成，全流程期间不得为空；`history` 首次写入后至少含1条快照，不得为空数组；`finding_fingerprints`/`root_cause_diagnoses` 首轮无 blocking finding 时可为空数组）；`finding_fingerprints` 数组一旦存在元素，每个元素的 `file`/`line`/`category`/`finding_fingerprint` 四个指纹计算相关字段均为必需、不得为空（本轮修复，round14 finding，消除此前 `category` 等指纹计算依据字段未在最小字段集中强制声明的缺口）；`total_round = heterologous_round + same_source_round`；处于异源阶段时 `same_source_round=0`，处于同源阶段时 `heterologous_round` 保持切换时定值不再递增；`actual_mode`/`verdict`/`blocking_count`/`fingerprint_repeated`/`stage` 每轮覆盖写入，反映该轮最新结果；`review_flow_id` 同一流程内覆盖写入但值保持不变，仅在发起全新流程时更新为新值；`history`/`finding_fingerprints`/`root_cause_diagnoses` 每轮追加/更新已有条目、不覆盖删除历史
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
- **路径**: `tasks/{task-id}/reviews/snapshots/{doc}-{review_flow_id}-r{N}.md`（`{doc}` 为被审文档基础文件名，不含目录与扩展名；`{review_flow_id}` 为本次审查流程的稳定唯一 ID，定义见 Contract 4/spec.md FR-WHREVIEW-003；`{N}` 为该文档参与审查时对应的 `total_round`；权威声明见 spec.md FR-WHREVIEW-006）
- **字段与类型**：文件内容为纯文本，即被审文档在该轮审查提交前的完整原样内容，不做任何结构化包装
- **校验规则**：仅适用于文档类审查对象（spec.md/data-contracts.md/plan.md/tasks.md）；每轮审查提交前必须先落盘当轮快照，`total_round≥2` 时读取 round(N-1) 快照与当前文档内容做 diff 作为 materials；round(N-1) 快照缺失时 fail-loud，不静默退化为全文送审；快照文件一经生成不得覆盖或删除；文件名须含 `{review_flow_id}`，仅靠 `{doc}-r{N}.md` 不足以区分同一 stage 先后发起的不同审查流程（`total_round` 均从1重新计数），会导致覆盖历史快照（round14 finding）
- **版本兼容说明**：本期新增契约，配合 FR-WHREVIEW-003 既有"第2轮起增量降级构造 Delta Package"条款，是文档类审查对象的专属补充规则

---

## Contract 11: 审查提示词文件（prompt-{review_flow_id}-r{N}.md）

- **Owner**: 各 stage 主 agent 派生的审查提示词生成子代理（stage 收尾、调用 wh-review 之前触发）
- **Consumer**: wh-review（读取该文件内容，仅作为组装 `{mode, contract, materials}` 三元组中 **`materials` 字段**的来源；`mode`/`contract` 两个字段独立取自 round-state.json 当轮判定值与 route-decision-{stage}-{review_flow_id}.json 的 `contract_path`/`contract_hash`，不依赖对本文件的解析，见 Contract 1 校验规则"`mode`/`contract` 必须是独立显式字段，不得坍缩进 `materials` 纯文本"与 spec.md FR-WHREVIEW-007）
- **路径**: `tasks/{task-id}/reviews/prompt-{review_flow_id}-r{N}.md`（`{review_flow_id}`/`{N}`〈即 `total_round`〉均取值自 wh-review "准备"调用（步骤1）的返回值，**由子代理消费、非子代理自行生成或猜测**——round16 修复：消除子代理需要这两个 ID 却只能在调用 wh-review 之后才能获得的循环依赖，权威声明见 spec.md FR-WHREVIEW-007"两段式调用流程"）
- **字段与类型**：文件内容为纯文本，含当前 stage 专属合同规则原文与本轮送审 materials/diff 的完整拼装结果——**该文本仅供审查方阅读理解上下文，不是 `{mode, contract, materials}` 三元组的唯一权威来源**（round14 修复，消除与 Contract 1"`mode`/`contract` 必须作为独立显式字段传输、不得坍缩进单一材料文本"要求的表面冲突）：文本中出现合同原文不违反 Contract 1，因为 `mode`/`contract` 仍会作为独立字段被 wh-review 单独赋值传输，本文件只贡献 `materials` 字段的取值
- **校验规则**：子代理须在 stage 主 agent 完成"准备"调用（步骤1）取得 `review_flow_id`/`total_round`/`contract_path` 之后、wh-review 执行实际审查（步骤3）被调用之前完成该文件落盘；wh-review 读取该文件失败或文件不存在时 fail-loud 报错，不静默回退为空 materials；stage 主 agent 自身进程内不得直接拼接合同/materials 全文替代该文件；文件名须含 `{review_flow_id}`，仅靠 `prompt-r{N}.md` 不足以区分同一 stage 先后发起的不同审查流程（round14 finding）；`contract_path` 权威解析结果仍以步骤1中 wh-review 自己写入 route-decision-{stage}-{review_flow_id}.json 的值为准，子代理不得自行重新解析（round16 修复）
- **版本兼容说明**：本期新增契约，目的是把大段合同/materials 文本的组装工作转移到独立子代理的上下文中，减少 stage 主 agent 自身的上下文消耗
- **版本兼容说明**：复用现有 M4 record-schema（`metrics/record-schema.mjs`），本期不新增字段，仅新增写入方（wh-review）
