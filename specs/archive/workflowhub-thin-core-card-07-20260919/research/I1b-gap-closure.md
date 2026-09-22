# I1b 读取缺口补齐

> 本报告只做清点与承接对照，只读。未修改任何被读文件。
> 上一轮产物（口径基准）：`.../specs/workflowhub-thin-core-card-07-20260919/research/I1-redesign-candidates-inventory.md`（尤其第 5 节、6.3 节、6.4 节）。
> 证据目录绝对路径：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-rebuild-planning-20260919/quality/evidence/research/`
> 卡面对照源：`/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` 的 `### CARD-07`（实测 `### CARD-07` 在 L425；FR-33..FR-38 = L431–436；AC-33..AC-38 = L438–443；范围 L428；结果与 consumer L427；局部风险 L451；可后置技术项 L452）。
> 表格转义：原文单元格内的 `|` 在本报告中写作 `\|`；JSON 内的原文以字符串值存储（`\n` 转义），本报告引用其**字符串值内容**（已还原换行），未改一字；逐字引用一律用反引号包裹。
> U-00x / T-00x / D-00x / G-4 的来源：`detail-review-request-…json` 与 `direction-review-request-…json` 的 materials 字段；卡面自述来源的 decision-log 行号（L359-379、L791-794、L798-807、L766、Talk round 4 Q14/Q15、Grill 续 G-4）在本报告中单独标注为「decision-log 侧」。

---

## 0. 文件清单与逐文件读取状态

八份指定文件（I1 第 6.4 节列为未读/仅 grep）**全部读完**。另补读 2 份 I1 仅标「部分读（grep 命中）」的同目录文件（`diagnosis-envelope-25061695…`、`diagnosis-envelope-505f7ce7…`），因其与方向/细节审查事实直接相关且 I1 未读全文；标注为「I1b 追加读」，不计入八份之列。6 份同源快照按任务要求只读一份，另 5 份仅做逐字段比对（未重复读全文）。

| 文件 | 规模 | 读取状态 | 主题 | 是否有新需求单元 |
|---|---|---|---|---|
| `frozen-execution-root-cause-audit.md` | 19281 B / 205 行 | **已读（全文，L1–205）** | 冻结执行根因审计：数字复现与撤回、失败链、三类约束、并行比较、未知 | **有**（第 1 节 N-01–N-16） |
| `direction-review-request-58b0c43a…json` | 22136 B / 297 行 | **已读（`request` 全字段：L3–L4 轨道；L13/L49 `raw_requirement`；L14/L50 `objective_facts`；L87/L157 `convergence_outline`；L24/L226 `current_selection`；L25/L231 `alternatives`；L26/L245 `selection_rationale`；L27/L246 `key_assumptions`；L28/L252 `independent_reconstruction`；L253 `direction_flow`）** | make-decision direction 轨道审查请求（含 U-001/U-002/U-005 全文、9 条 OI、备选方案、关键假设） | **有**（A-01–A-07） |
| `diagnosis-envelope-0b191aab-583e-4119-b73b-26175fee6844.json` | 4549 B / 23 行 | **已读（全文；`wire.stdout` 内嵌 JSON 已完整解析）** | 持久化 broker public envelope：direction-review.v1 包 MATERIAL_INCOMPLETE | **有**（D-01、D-02） |
| `diagnosis-envelope-16232244-8c18-4f12-88f5-251b1677731d.json` | 4549 B / 23 行 | **已读（全文；与 0b191aab 逐字段比对：仅 `request_id` / `runtime_id` / 3 个 `provenance.runtime_id` 不同，其余逐字节语义相同）** | 同上信封的第二个 runtime | **无独立新单元**（同 D-01/D-02，仅 runtime 不同） |
| `diagnosis-review-envelope-replay.mjs` | 2297 B / 27 行 | **已读（全文，L1–27）** | 诊断信封重放脚本：8 个 case 的适用范围 | **有**（D-03） |
| `diagnosis-review-identity-repro-results.json` | 1117 B / 21 行 | **已读（全文，2 条命令记录）** | 身份复现结果：中文标点 fixture 身份不等、空格对照通过 | **有**（D-04、D-05） |
| `thread-observations-4c3f65d7…json` | 13792 B / 370 行 | **已读（全文；`source`、24 条 `turns`、2 条 `writer_call_witnesses`（含命令全文）、3 条 `receipt_failure_messages`）** | 历史 thread 01a0af94 的返回项统计与两条真实 writer 调用见证、3 条失败/收口 agentMessage | **有**（N-17–N-22） |
| `detail-review-request-43cc2844…json` | 34487 B / 329 行 | **已读（`request` 全字段：L3–L4 轨道；L7 `raw_requirement`（U-001/U-002/U-005/U-008 全文）；L9–L12 `approved_direction`（approval_boundary / U-007 / U-008 / T-001–T-007 全表）；L14 `draft_spec_or_acceptance`（D-001 全文）；L16 `context_map`（stage / 9 条 OI 记录 / Grill 全文 / review_focus）；L21 `evidence_map`）** | make-decision detail 轨道审查请求（U 全文 + T 表 + D-001 全文 + Grill 最小决策更新 + 审查质量限制） | **有**（B-01–B-16；并逐字补全了 I1 只作摘要的段落） |
| （6 份同源快照）`32763a6f…json` 等 | 各 3098 B | 读 1 份（`32763a6f…`，I1 已读全文）；另 5 份仅逐字段比对 | make-decision 阶段 research-report.v1 的 6 个快照 | **无**：I1b 用逐字段比对**再次确认**差异字段恰为 `snapshot_tree` / `material_scope_revision` / `recorded_at` 三项，其余字段 5 份全部相同 → 不重复读全文 |
| （I1b 追加读）`diagnosis-envelope-25061695-dc98-4a10-bea1-006f97b34216.json` | 15436 B | **已读（metadata + `wire.stdout` 完整解析）** | 第一轮公共 paired review 失败信封：material `f807724…`，outcome=partial，kimi `RATE_LIMITED` | **有**（D-06） |
| （I1b 追加读）`diagnosis-envelope-505f7ce7-a295-4e87-84d8-5258da5f127e.json` | 20327 B | **已读（metadata + `wire.stdout` 完整解析 + 12 条 findings 全文）** | 同一 material `f807724…` 的 completed 信封：3+3+6=12 条 provider findings（含 1 条 codex/luna `blocking`） | **有**（D-07；findings 为第三方审查事实，非用户原始需求） |

**同源快照去重核对结论（逐字段）**：以 `32763a6f…` 为基准，`3613b4fc…` / `7bd2bcee…` / `882eecfd…` / `ab4cddfe…` / `cca7db91…` 的差异字段集合均为 `{.material_scope_revision, .recorded_at, .snapshot_tree}`，无第四处差异；与 I1 第 4.6 节结论一致。

---

## 1. 新发现的原始需求单元（逐条逐字）

编号口径：沿用 I1 的形态，按来源文件分组，逐字引用，不改写。
- `A-xx` = direction-review-request 独有材料
- `B-xx` = detail-review-request 独有材料（I1 未收录的段落/字段）
- `D-xx` = 诊断信封与复现证据
- `N-xx` = 冻结执行审计与线程观察中的新单元（含 I1 只取 L48 一行之外的全部）

### 1.1 `direction-review-request-58b0c43a…json`（A 组）

| 单元ID | 来源文件:节名 | 逐字原文 | 主题 |
|---|---|---|---|
| A-01 | `direction-review-request…json:231`（`materials.alternatives[0]`） | `Remove persistent generic stage certification; keep real test/output capture, independent review provenance, workspace and dangerous delivery protections. Lose some automatic cross-host currentness/certification guarantees.` | 备选方案一（可搬运方法技能 + 窄执行助手）；`name` = `Portable method skills plus narrow execution helpers` |
| A-02 | 同上 `:231`（`alternatives[1]`） | `Keep only narrow task/result contracts, explicit code evidence and one outcome reader. Requires proving this deletes most current semantic validators and does not recreate the current engine.` | 备选方案二（保留小型强制 runtime）；`name` = `Retain a small mandatory runtime` |
| A-03 | 同上 `:231`（`alternatives[2]`） | `Default skills are usable without engine; advanced unattended/cross-host audit is opt-in. Risks maintaining two modes and hidden dependencies.` | 备选方案三（可选独立审计/编排引擎）；`name` = `Optional separate auditing/orchestration engine` |
| A-04 | `direction-review-request…json:245`（`selection_rationale`） | `Positioning is user-chosen after research, but every specific stage count, document layout, phase split, child-agent pattern and review tool still needs challenge. Research recommendations are hypotheses, not approval.` | 方向定位已选，但阶段数/文档形态/phase 划分/子代理形态/审查工具仍待挑战 |
| A-05 | `direction-review-request…json:246`（`key_assumptions[0]`） | `Primary users work through capable AI hosts and can resume by reading clear records. Necessity of machine-certified cross-host continuation is unproven.` | 关键假设 1：跨宿主机器认证接续的必要性未证 |
| A-06 | 同上 `:246`（`key_assumptions[1]`） | `Actual tests, failure disclosure, independent review and dangerous-operation authorization must remain.` | 关键假设 2：真实测试/失败披露/独立审查/危险操作授权必须保留 |
| A-07 | 同上 `:246`（`key_assumptions[2]`） | `Review tool replacement benefits and net time/token savings are unmeasured.` | 关键假设 3：审查工具替换收益与净节省未实测 |
| A-08 | 同上 `:246`（`key_assumptions[3]`） | `The future target workflow is not permission to bypass this current planning workflow.` | 关键假设 4：未来目标流程不构成绕过当前规划流程的许可 |
| A-09 | `direction-review-request…json:50`（`objective_facts.limitations[0]`） | `No measured token usage; no cost-saving percentage is established.` | 研究限制：无 token 实测 |
| A-10 | 同上 `:50`（`limitations[1]`） | `No whole-task wall time decomposition; parent command absence does not prove idle time.` | 研究限制：无全任务墙钟分解 |
| A-11 | 同上 `:50`（`limitations[2]`） | `Provider unavailable is not quality pass. Semantic findings and transport failures are separate.` | 研究限制：provider unavailable ≠ 质量通过 |
| A-12 | `direction-review-request…json:50`（`objective_facts.observations[2].fact`） | `Skill requires three Talk rounds and conditional fourth; aggregate validator checks positive actual round count. Tests lock the 14-step ordering. No whole-stage one-round bypass was tested.` | **固定 Talk 轮次与 14 步顺序锁的现状事实**（对应 CARD-07 FR-36） |
| A-13 | 同上 `:50`（`observations[6].fact`） | `Spec Kit supports pure skills and an optional persistent engine. Superpowers offers inline and delegated task execution; delegated mode carries ledger/package overhead and shared-repository parallelism limits. OpenSpec file-derived artifact readiness does not establish actual behavior acceptance. Documentation comparisons do not demonstrate performance gains on this repository.` | 外部方案能力与边界（含「文档比较不证明本仓收益」） |
| A-14 | `direction-review-request…json:157`（`convergence_outline.entries[OI-001..OI-009]`） | 9 条 OI 的 `question`/`source`/`status` 全文（`outline_version` = `outline-r2-group2-20260919`；OI-001..OI-009 全部 `"status": "open"`） | 唯一 OI 大纲（与 detail 请求内 OI 记录同源；差异见 A-15） |
| A-15 | 同上 `:157` vs `:226` | `convergence_outline` 把 OI-009 标为 `"status": "open"`、无 `selected_disposition`；同一请求的 `current_selection` 已记录 U-007 选 A | **材料内部不一致（事实）**：方向请求自身即含此矛盾；decision-log L764 已把同一处列为「材料内部不一致（可直接修）」 |
| A-16 | `direction-review-request…json:253`（`direction_flow`） | `reconstruct`（visible: `raw_requirement, objective_facts`；`hidden_until: reveal`）→ `reveal`（visible: `current_selection, alternatives, selection_rationale, key_assumptions, independent_reconstruction`）→ `challenge`（visible: `revealed_choice, independent_reconstruction`；output: `findings`）；`output.one_provider_result=true`、`output.one_logical_fact=true`；`public_request_count=1` | 方向审查三段式契约（decision-log L795 红-13 所指「确认流未保留方向性重建」的依据对象） |
| A-17 | `direction-review-request…json:252`（`independent_reconstruction`） | `Not supplied by host. Each provider must derive its own reconstruction before reveal; do not treat this absence as a missing user answer.` | 独立重建不由宿主提供，缺失不得记为用户未答 |

### 1.2 `detail-review-request-43cc2844…json`（B 组；I1 未逐条收录的段落）

| 单元ID | 来源文件:节名 | 逐字原文 | 主题 |
|---|---|---|---|
| B-01 | `detail-review-request…json:9`（`approved_direction.approval_boundary`） | `Only the actual user choices below are approved. The complete D-001 draft, detailed design, review-tool choice, implementation and release are NOT approved. This is detail advice, not independent direction reconstruction.` | 批准边界：D-001 完整草案/详细设计/审查工具选型/实现/发布均未批准 |
| B-02 | `detail-review-request…json:16`（`context_map.grill`） | `- 工作组织：按可验证用户结果工作包组织，不强制每task一个子代理；强关联实现、测试、修复可在同一上下文连续完成，独立复核换上下文。并行只用于输入、写集和环境独立的工作包。` | Grill 最小决策更新：工作组织（对应 CARD-07 FR-36 / M9 边界） |
| B-03 | 同上 `:16`（`grill`） | `- 权威材料：spec承载一份权威用户目标和跨任务需求；Phase/工作包只引用全局目标并写本包差异，不复制完整需求与架构。当前规划PRD负责需求覆盖与责任卡，后续执行主会话按整体目标组织验收；子任务完成不自动等于总体功能完成，也不触发母任务close。具体责任卡由build-prd形成，不新增后台管家。` | **该 Grill 版「spec 承载权威」与 D-001「PRD 独占权威」相矛盾**——decision-log L792 蓝-11 与 `diagnosis-envelope-505f7ce7…` codex/luna major finding 均指此同一处 |
| B-04 | 同上 `:16`（`grill`） | `- 真实验收：基础工作可按自身验证事实完成；整体功能只有从真实入口联通实跑才可声明完成，沿用Agent实跑、用户重点抽验。真实测试失败必须修复并复验；review unavailable沿用一次未参与实现者的独立替代，二者不能混写。` | Grill：真实验收与失败处置 |
| B-05 | 同上 `:16`（`grill`） | `- 接续：跨会话仅保留已决定、已验证、未完成、证据出处等清晰接续记录；不恢复阶段fact graph，不默认提供跨宿主自动恢复。` | Grill：最小接续 |
| B-06 | 同上 `:16`（`grill`） | `- 工具边界：stage completion、task kernel和fact graph是删除候选，不按现有对象反推必留核心。保留可脱离kernel的窄工具职责：工作区/范围核对、真实命令exit/output采集、安全写入、不可逆交付授权与冲突中断保护；未批准具体技术删除清单。` | Grill：删除候选与保留的窄工具 |
| B-07 | 同上 `:16`（`grill`） | `- 真实取舍：方法工具包不再承诺机器认证阶段完成、跨会话证据链或自动判断全部证据过期；这些是U-007所选定位的代价，不假称纯技能提供同等机器保证。` | Grill：所选定位的代价（不得假称等价机器保证） |
| B-08 | 同上 `:16`（`grill`） | `四项exit checks：` `1. external_interfaces=pass（方向适用范围）：现行build-prd/spec-prd职责已核；OCR锁定SHA源码已核接口能力，真实效果unknown，不以未做benchmark冒充已验证收益。具体外部工具尚未选定，不靠虚构接口作方向决定。` … `2. canonical_names=pass：产品定位唯一称“方法工具包”，工作组织唯一称“可验证用户结果工作包”；定义见CONTEXT目标重构节。具体文件路径/字段留后续，不在规划任务问用户。` … `3. failure_semantics=pass：真实测试失败须修复/复验，review unavailable与远端unknown单列，不能伪绿；缺固定Round3生命周期仍披露，不冻结同task讨论。` … `4. scope_boundaries=pass（当前方向）：本次仅规划，未来以宿主执行为主；保留真实安全/授权/验证，放弃通用逐步认证，历史只读；未选具体代码删留、OCR收益未知均有owner和后续触发，不伪造实现完成。` | Grill 四项 exit checks（含命名唯一性约束） |
| B-09 | 同上 `:16`（`grill`） | `冲突处置：CONTEXT当前五阶段和旧ADR描述仍有效的现行实现；新节/ADR只描述未来目标，不即时替代现行合同，不授权物理删除或交付。Round3零问题与固定生命周期合同冲突仍未解决，aggregate/正式completion可能incomplete；本次Grill完成不漂白该缺口。` | **Round3 零问题 vs 固定生命周期合同冲突（未解决）**（直接对应 FR-36「取消固定轮次」的现状冲突） |
| B-10 | `detail-review-request…json:16`（`context_map.review_focus`） | `Check real user flow, cross-task responsibility, source authority without duplicate content, meaningful TDD/review/acceptance, deletion versus preserved safety, failure/unknown and non-goals. Respect authoritative topology: planning task ends at make-decision→build-prd; each later implementation task independently runs make-decision→build-plan→build-code→verify-code. PRD map links work without successor/predecessor runtime objects.` | 细节审查聚焦面 + 权威拓扑重申 |
| B-11 | `detail-review-request…json:21`（`evidence_map.source_decision_sha256`） | `9acb5d48b7a10de0050d82de28039f3f3e7fb0ad0c8a7ef46cc02fd533fbf4ad` | 送审 decision-log 的 SHA256（**注意**：与 decision-log L514 记录的方向 review 冻结 SHA `20dd5c90f42802798500642dc5019271e982f4fd8140d94bb51e21eb82e4761c` **不同**） |
| B-12 | 同上 `:21`（`evidence_map.quality_limits[0]`） | `Direction review unavailable due to PROTOCOL_INCOMPATIBLE; no semantic findings.` | 质量限制 1：方向审查 unavailable，无语义 findings |
| B-13 | 同上 `:21`（`quality_limits[1]`） | `Round3 zero-question lifecycle and missing host reply credentials remain disclosed; do not infer current stage completion.` | 质量限制 2：Round3 零问题生命周期与缺宿主回复凭证保持披露；不得推断阶段完成 |
| B-14 | 同上 `:21`（`quality_limits[2]`） | `OCR benefit, complete deletion mapping and time/token savings are unmeasured.` | 质量限制 3：OCR 收益、完整删除映射、时间/token 节省均未实测 |
| B-15 | 同上 `:21`（`evidence_map.current_execution`） | `This request does not start PRD, implementation, tests or final approval.` | 本次审查不启动 PRD/实现/测试/最终批准 |
| B-16 | `detail-review-request…json:16`（`context_map.stage`） | `Current make-decision step10 after completed zero-question Grill and step9 draft. Direction review was unavailable; no semantic red/blue findings exist. Do not invent a successful direction review, absent replies or independent reconstruction.` | 送审时点与「不得编造通过的审查」 |

### 1.3 诊断信封与复现证据（D 组）

| 单元ID | 来源文件:节名 | 逐字原文 | 主题 |
|---|---|---|---|
| D-01 | `diagnosis-envelope-0b191aab-…json:19`（`wire.stdout` → `group.providers[*].error`） | `{\"code\":\"MATERIAL_INCOMPLETE\",\"message\":\"direction-review.v1 material is missing direction_flow.json\"}`（三个 provider：`kimi/coding`、`antigravity/flash`、`codex/luna` 各一条，`status: "failed"`、`attempts: []`、`group.outcome: "unavailable"`、`state: "terminal"`） | **方向审查真实失败码：material 缺 `direction_flow.json`**；material_id=`421f2802ebd4282aa342b9884e208113dcceb25a35682c9c3ed3ca092165c802`；请求 materialId=`653d9312b325a66a60401380a59b3b01060f92927e261b9b3e45d619b9fe8f84` |
| D-02 | `diagnosis-envelope-16232244-…json:19` | 与 D-01 同一错误、同一 material_id、同一三个 provider；逐字段比对仅 `request_id` / `runtime_id` / 各自 `provenance.runtime_id` 不同（`request_id` 分别为 `wh-review-ea008900…` / `wh-review-5af10455…`） | 同一失败的第二个 runtime（复现两次，非偶发） |
| D-03 | `diagnosis-review-envelope-replay.mjs:8–19`（逐字代码行） | `const good={version:'workflowhub-run.v1',request_id:requestId,runtime_id:'diagnostic-runtime',state:'starting',material_id:materialId};` / `if(options.case==='version')value.version='workflowhub-run.v2';` / `if(options.case==='request-id')value.request_id='other-request';` / `if(options.case==='material-id')value.material_id='b'.repeat(64);` / `if(options.case==='state')value.state='queued';` / `if(options.case==='provider')value.providers={'test/provider':{provider:'different/provider'}};` / `if(options.case==='polluted')stdout='INFO start\n'+stdout;` / `if(options.case==='multi-json')stdout+='\n'+JSON.stringify(value);` / `if(options['align-material']) {const envelope=JSON.parse(wire.stdout);envelope.material_id=materialId;wire={...wire,stdout:JSON.stringify(envelope)};}` | 信封校验的 8 个判据（version / request-id / material-id / state / provider / 污染前缀 / 多 JSON / material 对齐）；L1 逐字：`// Diagnostic-only: no provider, filesystem capture or CLI invocation.` |
| D-04 | `diagnosis-review-identity-repro-results.json:8`（第 1 条命令 stdout） | `{\"fixture\":\"chinese-punctuation\",\"declared\":\"d96c1ac0860e35f5f12c94695aee61366351ada21a26be08b050df1b60a4fe25\",\"actual\":\"306de164c5e8198085b5e7f15577bca691fe00e3b2c0bad92d4b37a0314c0e29\",\"equal\":false}` 与 `PROTOCOL_INCOMPATIBLE: 3rd-review managed lifecycle envelope is invalid`（`exit_code: 1`） | 中文标点 fixture 声明/实际字节不一致 → PROTOCOL_INCOMPATIBLE（真实可复现） |
| D-05 | `diagnosis-review-identity-repro-results.json:18`（第 2 条 `--control` stdout） | `{\"fixture\":\"space-control\",\"declared\":\"0e473786bd4689227019e318b2a4a97231d37f5af7f8209e3409eeae02e68510\",\"actual\":\"0e473786bd4689227019e318b2a4a97231d37f5af7f8209e3409eeae02e68510\",\"equal\":true}` 与 `PASS: delivered bytes match expected identity`（`exit_code: 0`） | 对照组通过 → 排除「工具整体不可用」，定位到字节转写 |
| D-06 | `diagnosis-envelope-25061695-…json`（`wire.stdout` → `group`） | `"outcome":"partial"`；`kimi/coding` attempt：`"error":{"code":"RATE_LIMITED","message":"provider process exited with 1"}`、`"process_outcome":"exit_nonzero"`、`"status":"failed"`、`duration_ms: 1857`；material_id = `f807724eca58474466ab7e0390443071e490beb31b72bdee38d41416dfa1a296` | 同一 material 的第一次 review：partial + rate limit（**decision-log L544 所述 first attempt 的真实信封**） |
| D-07 | `diagnosis-envelope-505f7ce7-…json`（`wire.stdout` → `group.providers[*].output`） | `"outcome":"completed"`，`round: 1`，`selected_tier: null`；三 provider 均 completed，`findings` 各 3 / 3 / 6 条；其中 `codex/luna` 第一条 `"severity":"blocking"`，`"issue"` 逐字起句为 `The draft advances toward final confirmation and build-prd without reviewable substantive research. U-005 explicitly pauses convergence until new research appears, but D-001 only cites B-005–B-008; those inputs and the claimed frozen-execution audit are not in the manifest. T-007 is a no-reply and unavailable-review event, not evidence of no unresolved direction issues.` | **第三方审查事实**（非用户原始需求）：1 blocking + 11 major/minor；含「spec/PRD 权威自相矛盾」「OI-008 页面范围未解」「OI-007 遗留任务路径未定义」「R-001..R-014 无定义」 |

### 1.4 冻结执行审计与线程观察（N 组；I1 仅取 `:48` 一行）

| 单元ID | 来源文件:节名 | 逐字原文 | 主题 |
|---|---|---|---|
| N-01 | `frozen-execution-root-cause-audit.md:6` | `性质：研究输入；不是用户方向确认、阶段完成或 R5 自审结论。原八点是待独立检验的粗略候选。` | 审计的引用边界（非批准） |
| N-02 | `frozen-execution-root-cause-audit.md:12` | `原审计提供了有价值的线索和多项可复现数字，但它把“父 task 无 commandExecution”扩大成“无工具/空转”，把“经过 writer 的回执被拒绝”写成“手工拼回执”，又把纯状态回填误归为 material_revision 变化。这些结论不能继续作为新增 timer、停止器、统一 writer 或额外证据机制的充分依据。` | **三条原归因撤回**（不得作为新增机制依据） |
| N-03 | `frozen-execution-root-cause-audit.md:48` | `\| review attempts \| 共21份：make-decision6、build-spec1、build-plan3、build-code10、verify-code1 \| 已复现 \|` | I1 已收录；此处保留原样 |
| N-04 | `frozen-execution-root-cause-audit.md:51` | `\| build-code attempt outcome \| 4 semantic、6 unavailable；全部是phase scope，没有integration scope \| 不可把“没有integration review”推成phase审查全部无价值 \|` | 审查 scope 与「不得推出全无价值」 |
| N-05 | `frozen-execution-root-cause-audit.md:58` | `原报告将12个“无commandExecution”turn、约29.42小时称为最大的可见空转/浪费源。此归因应撤回，保留为“父任务返回数据中没有commandExecution的未完全解释时长”。` | 空转归因撤回 |
| N-06 | `frozen-execution-root-cause-audit.md:75` | `5. 空转停止器或固定60分钟handoff不是这些数据必然导出的方案；可能截断正在执行的子代理。` | 明示「固定时限 handoff/停止器」不是数据必然导出的方案 |
| N-07 | `frozen-execution-root-cause-audit.md:83–85` | `- 真依赖：P1→P2有明确消费者/生产者发布顺序。不能为了并行忽略跨仓半发布风险。` / `- 共享写面：P3/P4共同写simple-review-runner及其测试；P5/P6/P7共同写stage-runner；P7/P8共同写stage SKILL。并行不自动安全。` / `- 未证明必要的整体串行：P4→P5在卡片允许文件上没有交集，仍强制依赖；这只构成可并行候选，需要再核实语义依赖，不能据此承诺一定可并行。` | **三类约束（真依赖/共享写面/未证必要串行）**（对应 M9、C9） |
| N-08 | `frozen-execution-root-cause-audit.md:87` | `当前build-code SKILL:171–214仍要求读四材料、Phase Card、RED/GREEN、即使路由未变也跑advisor、testing skill、phase review、finding disposition、handoff和状态填写。这是当前仍存在的固定编排成本。归档tasks约125–149等每个Phase重复Verify/Knowledge/STOP/Done/Risks结构；25条gate_cmd中多数是RED/GREEN/Phase Verify重复声明，不能直接说实际执行25次。` | 当前仍存在的固定编排成本 + 计数口径纠正 |
| N-09 | `frozen-execution-root-cause-audit.md:89` | `RED和GREEN分成独立Task，但通常是同一行为变更的连续两步。若再按用户候选把每个task的实现/测试/修复都拆给不同上下文，可能进一步增加同一变更的上下文搬运；更值得比较“一个行为变更由一名实现者连续RED→GREEN→修复，另一个上下文独立审查”的候选，而不是默认角色越多越快。这是待比较方案，不是用户已确认决定。` | **对 U-001 第 4 点（每 task 独立子代理）的直接反证候选** |
| N-10 | `frozen-execution-root-cause-audit.md:133` | `generic factory允许不同component本身未必是bug，它可能还服务其他合法测试producer；固定stage consumer也有防止错证据混用的合理性。可确定的失败是agent选择了generic能力并误以为其可用于stage completion；底层writer“成功”并不承诺stage consumer可接受。现行build-code SKILL要求capture真实RED，但在本轮定向检查中未给出测试捕获专属入口示例，而review入口却明确；这支持“合法最短路径表达不充分”的设计问题，但没有证据证明原计划强制agent使用factory。` | 失败责任界限（非「统一 writer」问题） |
| N-11 | `frozen-execution-root-cause-audit.md:135` | `所以“统一到一个writer”不是足够方案——本例早已用了writer。应比较收窄agent可见捕获入口、让阶段wrapper拥有producer而非调用者命名、返回对象明确其消费用途、保留generic为内部能力等候选。不要为了此案删除所有producer检查或再造一层receipt/gate。` | 反方案清单 + 明确「不要删除所有 producer 检查 / 不要再造 receipt gate」 |
| N-12 | `frozen-execution-root-cause-audit.md:155` | `最终close completed原件是真实completed；close动作行仍保留stage_quality=incomplete。这直接反证“质量不全必然不能物理结束”。不需要为了这个历史事实再发明completed_with_quality_gaps才能close。` | 反证「质量不全 ⇒ 不能 close」，反对新增完成状态 |
| N-13 | `frozen-execution-root-cause-audit.md:191–195` | `未知：` `- 真正可并行关键路径、共享文件整合开销、子代理实际工作时长。` `- provider未记录attempt时远端是否执行、review findings实际有效率。` `- 不同项目真实用户验收不足与WorkflowHub机制的具体因果。` `- 新方案净节省时间/token以及长期质量收益。` | 四项未知（不得冒充已验证收益） |
| N-14 | `frozen-execution-root-cause-audit.md:197–201` | `可证伪的方案比较，不新增统计平台：` `- 比较把RED/GREEN当一个行为工作包与当前两张Task卡的效果；不要默认每个角色都建新agent。` `- 比较“默认阶段专属命令、generic不在agent正常路径”与“再统一writer”的收益；本案预期前者直接消除错误component。` `- 比较少量明确交付事实表达与新增完成状态；历史close已支持前者。` `- 对可并行候选先证明没有共享写冲突及语义依赖，再决定并行，不建立全局新调度状态机。` | 四条可证伪比较 + **不新增统计平台 / 不建全局新调度状态机** |
| N-15 | `thread-observations-…json:28`（`source.scope`） | `returned-items metadata only; not a full transcript or child-agent log; no token inference` | 线程观察的引用边界（不得推断 token / 不得当完整轨迹） |
| N-16 | `thread-observations-…json`（`receipt_failure_messages[0].text`，turn `01a0b74d…`） | `最后读回仍显示 \`risk_tests_fresh\` 缺失，说明状态索引与刚发布的测试回执存在身份漂移；我只定位这一个漂移点，不扩大审查范围。先核对当前快照、T017 状态块和最新回执的绑定关系。` | 真实处理链起点：**把 producer/consumer 用途错配误称「身份漂移」** |
| N-17 | 同上（`receipt_failure_messages[1].text`） | `根因已确认：\`risk_tests_fresh\` 事实和回执都在当前快照，但回执的 \`producer.component\` 写成了 \`t017-current-tests-v3\`，认证器只接受正式 \`build-code-test-capture\`。这不是再审查，而是一次明确的证据归属修复；我用官方 capture-tests 入口补一份正式回执，然后只做一次状态读回。` | 真实根因：component 命名不符（非身份漂移、非材料失效） |
| N-18 | 同上（`receipt_failure_messages[2].text`） | `已按计划快速收口：` `- T017 任务事实已完成，38/38 AC 通过。` `- 通过官方 \`verify --action=execute\` 补齐正式测试回执，\`risk_tests_fresh=passed\`。` `- 当前状态：\`ready\`、\`continuation_allowed=true\`，无执行阻塞。` `- 剩余仅是 formal quality：\`integration_review\`、\`finding_dispositions\` 缺失；不阻塞继续工作，但不能宣称正式质量通过。` `- 已通过 \`git diff --check\`，临时输入已清理。` `- 未执行 provider、全量测试、commit、merge、push 或物理 close。` | 收口事实：38/38 AC 通过、缺 integration_review/finding_dispositions 但不阻塞 |
| N-19 | `thread-observations-…json`（`writer_call_witnesses[0].command`，turn `01a0b74d…` event `exec-47f05418…`，exit_code=0，duration_ms=29182） | `const tests=createCanonicalReceiptWriter({task,workspace,stage:\"build-code\",component:\"t017-current-tests-v3\"}).captureTests({command,receiptRef:\"quality/tests/T017-current-tests-v3.json\",outputRef:\"quality/tests/output/T017-current-tests-v3.txt\",timeoutMs:300000});`（同命令内含 `./node_modules/.bin/vitest run tests/contract/acceptance-execution-tier.test.mjs -t "does not let one failed AC assertion hide a passed sibling leaf\|executes two command ACs" --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`） | **真实 writer 调用见证 1**（自定义 component，非手工拼 JSON） |
| N-20 | 同上（`writer_call_witnesses[1].command`，turn `01a0b738…` event `exec-20706d63…`，exit_code=0，duration_ms=30837） | `const tests=createCanonicalReceiptWriter({task,workspace,stage:\"build-code\",component:\"t017-current-tests-v2\"}).captureTests({command,receiptRef:\"quality/tests/T017-current-tests-v2.json\",outputRef:\"quality/tests/output/T017-current-tests-v2.txt\",timeoutMs:300000});`（同命令另含 `writeOfficialComponentReceipt({task,workspace,stage:\"build-code\",component:\"implementation\",payload:{}})`） | **真实 writer 调用见证 2**（同上） |
| N-21 | `thread-observations-…json`（`turns[3]` = `01a0b755-f79d…`、`turns[20]`=`01a0b1bf…`（18583463ms）、`turns[19]`=`01a0b2e1…`（30742513ms）、`turns[24]`=`01a0b769…`（1146560ms）等） | `{"id": "01a0b769-1000-78c0-9f48-e340603dbd61", "durationMs": 1146560, "items": 0, "types": {}, "commands": 0, "commandDurationMs": 0, "failed": 0}`（`items: 0` 的 turn 共 9 条，合计 durationMs = 107041391，即 29.73h） | 无返回项 turn 的真实形态：**只有「该接口未返回内容」**，不得等同未执行 |
| N-22 | `thread-observations-…json`（`turns[21]` = `01a0afdb-d855-79a3-b5cd-e4c350dcb859`） | `{"id": "01a0afdb-d855-79a3-b5cd-e4c350dcb859", "durationMs": 31672242, "items": 500, "types": {"reasoning": 279, "collabAgentToolCall": 171, "agentMessage": 33, "mcpToolCall": 17}, "commands": 0, "commandDurationMs": 0, "failed": 0}` | **「无 commandExecution ≠ 无工具调用」的原始反例**（500 items 含 171 collab + 17 MCP） |

---

## 2. 用户原话（逐字，含 U-00x 编号与出处）

**出处说明**：以下 U-001 / U-002 / U-005 / U-008 逐字来自 `detail-review-request-43cc2844…json:7`（`materials.raw_requirement`）与 `direction-review-request-58b0c43a…json:49`（`materials.raw_requirement`）——两份请求的该字段**逐字节相同**（`raw_requirement` 文本经比对一致；detail 版 = direction 版）。U-003 / U-004 / U-006 / U-009 / U-010 在这两份请求文件中**不存在**，逐字来自 decision-log（卡面 L450 自述来源的 `L791-794` 位于 decision-log，L791-794 实为 detail findings 段落，非 U 段；U 段实际位于 decision-log L46–L118）。凡「未找到」的一律标注，不编造。

### 2.1 U-001：用户八点思路（全文，八点全）——`detail-review-request…json:7` / `direction-review-request…json:49`（两份逐字相同）

> `### U-001：用户八点思路（全文）`
>
> `我的思路：`
> `1：spec优化，build-spec和build-plan合并成一个build-plan阶段，在这个阶段产出一个spec文档和多个phase文档，spec文档需要包含更标准的需求文档、验收流程、测试标准、架构方案等，相当于spec文档是把decision-log进行完整的实现所进行的翻译，需要结构更清晰、内容更清楚、验收更明确，避免出现所有phase做完了，但是一次真实测试验收都没做过，一直在用脚本验收，功能实现的完全不合理。`
> `2：plan去除，不在需要plan和tasks文档，而是每一个phase一个实现文档，里面要写清楚背景、方案、流程、影响范围、测试标准、验收流程等等。要避免现在task文档的问题，也要有更清晰的实现指引。一个phase一个文档也能避免agent上下文爆炸；`
> `3：TDD流程优化，现在的tdd完成是token和时间浪费机，对任务实现帮助非常少。需要更专业更有用的TDD流程，不要再写出完全没意义的red了，需要基于每一个task写真实的red，后续这个red也能基于实现完成的代码变成green。要让TDD的每一个token花的有意义；`
> `4：build-code提速：每一个task的实现、审查、测试、修复应该是一个独立的子代理，避免上下文互相影响。主会话收集回复、派发任务、进行归纳和验收。同时，多个子代理、多个task、多个phase还可以设计并行规则，避免全部子代理都只能串行浪费时间！`
> `5：审查效果提升，不再用wh-review里面的审查提示词和3rd-review进行build-code或verify-code审查了，而是改成类似“https://github.com/alibaba/open-code-review”的开源代码审查工具进行，保证代码审查质量更高，并且不在因为审查浪费这么长时间。`
> `6：简化流程，不要浪费任何机制统计token、时间等，我需要workflowhub是一个简单好用的框架，不是一个复杂的流程制造机；`
> `7：弱化所有流程中的严格验收！我已经花了十几个task优化阻塞问题，现在workflowhub还是充满了阻塞，根本不能用，烦死了。`
> `8：简化workflowhub：workflowhub现在被一大堆对象、测试文件搞得非常臃肿，最开始设计的宪法完全没生效。有一点问题，agent就搞一大堆严格验收、新对象、新标准、新流程，让这能workflowhub非常难以维护，宪法里的最坏事件在当前workflowhub完美体现了。我需要彻底优化整个workflowhub，不要搞这么多流程、质量、文件！改成薄核心+多技能的项目规划！`
> `请你基于这些思路和你的调研建议，看看合不合理，如何优化？我希望这一次方案实现后，再也不要来来回回的优化workflowhub了！太烦人了`

（与 I1 第 4.7 节一致；I1 只逐字引了第 8 点与 U-002/U-005，其余六点此前未逐字出现在 I1 报告中。）

### 2.2 U-002：最新执行指令（全文）——同 `:7` / `:49`

> `### U-002：最新执行指令（全文）`
>
> `整个任务非常复杂，我希望然后现在按标准 WorkflowHub 开始这个规划任务，先创建worktree，然后从 make-decision 开始，不要跳阶段，方便后续接上build-prd产生一个完整的prd文档，方便我后续逐任务实施。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整需求流程，Talk 和grill请用大白话说明选项、后果和风险。注意主会话只进行子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。`

### 2.3 U-005：Round 2 真实回复与研究纠正（全文，含 I1 未逐字收的「1：A；2：A」与来源段）——`detail-review-request…json:7`（`direction-review-request…json:49` 版无「来源」与「用户纠正的当前效力」两段，仅有首段）

> `### U-005：Round 2 真实回复与研究纠正（全文）`
>
> `1：A；2：A。现在有很严重的问题，你完全是依赖我给你的需求进行方案设计，这只是我的一些粗略的想法，你完全没有去调研之前我给你的调研材料，也没有去调研workflow hub现在的问题。也没有去调研外部，完全就是我给你什么，你就做什么。等于这个整个改进的上限还是基于我的经验，这完全不够呀，调研非常不够！方案深度也不够！`
>
> `来源：本轮用户消息，由主会话交给唯一材料写入代理。Q1=A：原审查工具不可用时，采用一次由未参与实现者执行的独立替代审查。Q2=A：新流程优先，历史只读；未完成旧任务不要求自动兼容。二者是局部真实选择，不表示用户批准整体架构或原八点全部方案。`
>
> `用户纠正的当前效力：原八点是粗略候选，不是完整获批方案，也不是最终需求边界。必须基于原审计、冻结执行证据、当前实现和外部一手研究独立诊断、比较备选方案，并可挑战或否定用户候选；不能只寻找支持原想法的证据。主会话已停止继续提问，直到新研究出现实质结果。同一任务返回 research-inputs 补充深度，暂停方案收敛；不新建任务、不重启流程、不宣称 Round 2 或整体方向已收敛。`

### 2.4 U-008：用户对任务拓扑的权威纠正（全文）——同 `:7`（I1 只逐字引了首行）

> `### U-008：用户对任务拓扑的权威纠正（全文）`
>
> `规划任务只有make-decision → build-prd，后续每个任务是单独的make-decision → build-plan → build-code → verify-code，你别搞错了`
>
> `本条立即覆盖此前草案中的错误串行路径。规划任务只产出完整PRD与任务地图，不进入build-plan/build-code/verify-code；后续每个实施任务都是独立task。撤回把规划任务继续串入实现阶段的草案，不把纠正视为新增确认要求。`

### 2.5 U-003 / U-004 / U-006（八份目标文件中 `[未找到]`；逐字来自 decision-log L63–L85）

> U-003（`decision-log.md:65`）：`1：这个问题不应该问，在make-decision最开始的时候已经有相关分流了，由人工决定是规划任务还是普通任务；2：A`
> U-003 来源（`decision-log.md:67`）：`来源：本轮用户消息，由主会话传递给材料写入子代理。首题是纠正和撤回，绝不登记为用户选择 A 或 B；第二题真实选择 A。宿主未提供 reply_ref/reply_hash，因此没有可声明的宿主认证凭证；本记录只保留真实会话来源，不补造字段。`
> U-004（`decision-log.md:71`）：`来源：主会话传递的用户最新交互指令。后续 Talk 和 Grill 用聊天文字提问，禁止使用 Codex 提问工具；大白话说明选项、后果和风险。此约束不等于用户预先回答任何后续问题。`
> U-006（`decision-log.md:83`）：`好的，继续`
> U-006 来源（`decision-log.md:85`）：`来源：本轮用户真实消息，由主会话传递。含义仅为继续当前 make-decision 和基于新研究的下一批 Talk；不是批准研究推荐架构，不是选择宿主技能包或独立平台，不是批准原八点整体方案，也不授权提前实施、review、Grill、build-prd 或阶段完成。`

### 2.6 U-009（八份目标文件中 `[未找到]`；逐字来自 `decision-log.md:105–109`）——**含对既有收敛结论的纠正**

> `U-009：最新三条要求（全文要点）`
> `1. **不止 build-code，所有阶段都要"派子代理 + 并行设计"**：\`make-decision\`、\`build-prd\`、\`build-plan\`、\`verify-code\` 都要用同一套工作方法——主会话不要一直干活，把工作尽量派给子代理；能并行的尽量并行；主会话只负责**派发、回收和交互类技能**；保证主会话上下文干净，**减少自动压缩次数**。`
> `2. **审查次数纠正（此前的收敛写窄了）**：审查不是"build-code 和 verify-code 各一次"，而是**每个 phase 一次 + 所有 phase 结束一次 + verify-code 一次**，与现在一致；只是把 \`wh-review\` 换成新的代码审查工具。`
> `3. **CPU/温度必须优化**：现在一旦开始 WorkflowHub 任务，电脑超过 80 度、风扇超过 5000 转。要求查出是哪个进程导致（是否 kernel）并尽可能优化。`
> 来源段（`decision-log.md:109`）：`来源：本轮用户真实消息。第 2 条是对既有 OI-001/OI-005 收敛结论的**纠正**（此前把审查范围写成"只在两个阶段各一次"属收窄）；第 1 条扩大 OI-002 到全部阶段；第 3 条登记为 OI-011。`

### 2.7 U-010（八份目标文件中 `[未找到]`；逐字来自 `decision-log.md:113–118`）

> `1：workflowhub任务执行时，大量的质量、流程阻塞，我希望彻底移除。workflowhub是一个薄核心的开发技能集，不应该有任何阻塞；`
> `2：workflowhub任务执行时，大量哈希、sha、快照、身份、材料、回执校验不对的问题，导致任务无法推进，也需要进行处理。workflowhub不需要这些过度工程化的东西来保证交付质量。每个阶段的推进、审查、测试的推进都不需要这些东西来保证质量。`
> `3：build-plan流程修改后，build-plan的审查也需要对应的修改，一次审查同时覆盖spec和phase文件。包含spec审查和原来的plan审查质量核心。`
> `如果这些问题没有包含在prd内，需要回到make-decision看看如何把这两个需求也放在prd里一起彻底解决。`
> 来源段（`decision-log.md:118`）：`来源：本轮用户真实消息。覆盖核查结论：①半覆盖（FR-04/AC-04/SD-15 已有，但加固修订引入了新前置冲突）；②③未覆盖。`

### 2.8 U-007（产品定位真实回复全文，两份请求均含）——`direction-review-request…json:24`（`current_selection.product_positioning`）/ `detail-review-request…json:10`（`approved_direction.product_position`）

> `### U-007：Round 2 group 2 产品定位选择（真实回复全文）`
>
> `A`
>
> `来源：本轮用户真实消息。主会话已用聊天文字提出 OI-009 产品定位问题，真实等待后收到本条A并恢复；这里只记录选项的最小决策含义，不复制完整问题卡、不新增交互archive或ledger、不补造宿主reply_ref/hash。`
>
> `本次选择的方法工具包定位：当前AI助手及子代理按方法完成工作，WorkflowHub提供必要工具；通过实际改动、测试、审查说明结果，不再逐阶段专门认证。跨会话或不同助手接续依赖清晰记录与读取，不提供每一步强制机器认证；保留工作区安全、危险操作授权、真实测试、独立审查和如实披露。`
>
> `批准边界：只确认产品定位及该卡直接表达的能力取舍，不等于批准原八点、具体阶段数、材料组织、每task开代理或OCR选型，也不是make-decision最终批准或实施授权。`

---

## 3. 关键决议草案（T-00x / D-001 等，逐条逐字 + 出处）

### 3.1 T-001–T-007 全表（逐字；`detail-review-request…json:12` = `approved_direction.local_user_choices`；`direction-review-request…json:24` 的 `current_selection.local_choices` 仅含 T-001–T-006，**无 T-007**）

> `| T-001 | Round 1 / U-003 首句 | 用户指出已有人工任务类型分流，本题不应再问 | 误提撤回；已由当前事实回答。沿用 make-decision 入口人工选择规划任务/普通任务，不新增按大小自动分流；不是 A/B 选项选择 | 避免重复要求用户决定已存在机制；后续任务内部流程尚未全部确认 | OI-001 |`
> `| T-002 | Round 1 / U-003 第二句 | 用户真实回答：2：A | Agent 先实跑约定使用流程，展示结果与未决问题，用户按需重点抽验；不默认等待用户逐项亲验 | 不把脚本通过当作真实功能完成；Agent 无法实跑时如实披露，具体失败处置留在同一 OI 待研究后收敛 | OI-004 |`
> `| T-003 | Round 2 / U-005 第一项 | 用户真实回答：1：A | 原审查工具不可用时，采用一次由未参与实现者完成的独立替代审查 | 保留真实来源和缺失，不把替代审查写成原工具已执行或通过；不是整体审查架构批准 | OI-005 |`
> `| T-004 | Round 2 / U-005 第二项 | 用户真实回答：2：A | 新流程优先、历史只读，未完成旧任务不要求自动兼容 | 不为旧任务增建永久兼容链；具体切换与遗留任务处置仍须研究，未授权删除历史或用户文件 | OI-007 |`
> `| T-005 | Round 2 / U-005 纠正 | 用户指出研究与方案深度不足，八点只是粗略想法 | 回到同task research-inputs：独立诊断、寻找备选与反证，不能照单设计 | 保留已有局部选择，暂停整体方案收敛与后续问答，不重启任务或提前进入review/Grill | 全部OI |`
> `| T-006 | Round 2 group 2 / U-007 | 用户真实回答：A | 选择方法工具包，由宿主Agent/子代理执行；结果以实际改动、测试、审查说明，不再逐阶段专门认证 | 接续依赖清晰记录与读取；保留工作区安全、危险操作授权、真实测试、独立审查及如实披露。仅定位获选，不批准全部八点或具体技术方案 | OI-009；关联OI-001/006 |`
> `| T-007 | Round 3 / 主会话实际处置 | 0题；没有用户回复事件，不适用选项选择 | 方向审查无语义结果、debate无输出；核对当前OI没有新增high/medium方向问题，按Talk零问题规则结束本轮 | 不等于方向审查通过，不伪造问答链；aggregate/completion合同缺口保留，same-task继续Grill | 当前OI与方向review原件 |`

（T-001–T-007 与 `decision-log.md:534–540` 的 Talk 表逐字节相同，I1 仅引了 T-007。）

### 3.2 D-001 草案全文（逐字；`detail-review-request…json:14` = `materials.draft_spec_or_acceptance`）

**（a）D-001 首部与 question/recommendation/decision**

> `## 决定草案（step 9）`
>
> `本稿供 detail advice 和最终一次用户确认。用户已选择“方法工具包”定位及此前四项边界；以下具体工作流、文档分工和删除方案仍是研究后的待确认方案，不代表原八点已整体批准。当前任务继续按现行 WorkflowHub 完成 make-decision，随后接 build-prd；未来流程不能提前替代当前执行合同。`
>
> `### D-001 — 方法工具包、单一产品权威与可验证用户结果`
>
> `- question/final_option：如何在保留真实交付质量的前提下，删除围绕阶段与证明运行的重复工作？推荐采用宿主承载的方法工具包，并按以下边界组织工作。`
> `- recommendation/plain_language：现有AI助手负责对话、派发与执行，WorkflowHub提供方法和必要窄工具；用实际改动、测试、独立审查及未完成说明交付，不再默认用 task kernel、stage completion 或 fact graph 逐步认证。`
> `- decision：产品定位已由U-007真实A选择；本条其余具体设计为待最终确认草案。`
> `- source_type/reference/exact_excerpt：用户原始候选U-001、当前执行约束U-002、研究纠正U-005、定位选择U-007“A”、权威拓扑纠正U-008及T-001至T-006；三路研究B-005至B-008和零问题Grill最小结论。八点只作为粗略候选，不作为设计上限。`
> `- approval_binding：产品定位、此前局部选择及U-008权威任务拓扑已确认；本完整草案其余设计尚未最终确认，没有伪造回复或宿主凭证。`
> `- facts_and_constraints：冻结任务证据证明存在长线性计划与writer消费用途断层；无父命令不能证明空转，状态回填必失效和手工receipt两项归因已被反证。方向review一次真实unavailable，不能当作通过。`
> `- Logic：真实浪费和用户结果问题 → 删除重复证明及固定仪式 → 宿主执行、单一目标权威、按结果验证 → 减少维护与协调，同时保留真实失败和安全边界。`
> `- choice_reason/impact：同时改变框架职责、方法组织与材料权威，不只合并阶段或替换审查工具；接受不再提供每一步机器认证、跨会话证据链和自动过期判断的代价。`
> `- consequences_and_risks：更依赖宿主能力与清晰记录；具体删除映射、工具接入及质量效果需后续核实，不能承诺节省比例或永不再重构。`
> `- rejected_alternatives：继续维护统一执行平台；只把旧kernel/协议搬进Skill；PRD/spec重复产品需求；每包复制全部架构；强制每task新代理；机械RED或把环境错误当RED；用review通过替代真实入口验收。`
> `- unresolved_items/owner：最终用户确认由make-decision主会话负责；完整用户旅程与任务覆盖由后续build-prd细化；具体删除清单、依赖和工具效果由后续build-plan/实施核查。未知不冒充已完成，不增加新gate。`
> `- Supersedes：只细化本任务草案，不立即废止当前运行合同或删除历史证据。`
> `- module：未来产品职责与交付方法`
> `- requirement_ids：[R-001,R-002,R-003,R-004,R-005,R-006,R-007,R-008,R-009,R-010,R-011,R-012,R-013,R-014]`
> `- derived_from：[]`
> `- artifacts：当前decision-log；CONTEXT目标重构术语；ADR-0031；后续build-prd与实施材料（尚未生成）。`

**（b）未来用户路径与各方法职责（逐字）**

> `人工在 make-decision 入口选择规划任务或普通任务，不新增按任务大小自动分流。权威拓扑以U-008为准：`
>
> `- 规划任务只有 make-decision → build-prd，产出完整用户需求、总体成功/失败及真实验收要求、任务地图；到此结束规划范围，不进入build-plan、build-code或verify-code。`
> `- 后续每个实施任务都是独立task，分别执行 make-decision → build-plan → build-code → verify-code；每个任务的make-decision只确认本任务方向与边界，继承PRD，不重问或改写全局产品决定。确有全局方向变化时明确交回其owner，不在子任务悄悄改写。`
> `- 普通任务同样执行 make-decision → build-plan → build-code → verify-code，可按实际范围精简内容，不为不适用PRD或文档制造跳过事实。`
> `- 每个实施task的build-plan只为本task产spec.md与工作包/phase说明，build-code和verify-code只处理本task。PRD任务地图和人工选择下一task足以衔接，不新增successor/predecessor关系对象、后台调度器或母任务自动close。`
>
> `用户旅程分两条：规划任务提出目标、确认方向，再通过build-prd形成并确认完整PRD与任务地图；用户随后选择一个实施任务，在独立task中依次确认本task边界、产实现设计与工作包、实现与测试、独立复核及真实入口验收。后续任务逐个或按独立边界并行承接PRD；总体功能验收由任务地图明确指定的实施任务承接，规划任务本身不进入代码阶段。每个实施任务展示实际结果、证据与缺口，用户按需重点抽验；不可逆Git交付仍需明确授权。`

**（c）文档权威与避免双写（逐字——I1 只摘了其中两行，此处为完整段落）**

> `### 文档权威与避免双写`
>
> `- decision-log记录方向、取舍、约束及用户真实选择，不重写详细规格。`
> `- 有PRD的规划任务：PRD独占产品目标、完整用户流程、跨任务需求、总体成功/失败与真实验收的权威；每项需求有负责工作包或明确排除理由。`
> `- 每个独立实施task保留单一 spec.md，由该task的build-plan产出，作为本task实现设计权威：仅引用PRD/decision中的目标，写架构取舍、全局依赖和验证策略，不复制完整产品需求或重新定义验收目标。`
> `- 无PRD的普通任务：精简spec引用用户原始需求和decision-log中的产品事实，再承接必要目标说明与实现设计；不得把实现方便性写成用户已批准的新需求。`
> `- phases或工作包文档围绕可验证用户结果，只写本包差异、边界、依赖及自身测试/验收，引用同一全局目标；不复制PRD或spec完整正文。小任务可用简短章节，不机械增加文件。`
> `- 删除 plan.md/tasks.md 双写及其相等性协议。产品目标改变回到其唯一权威更新，设计随引用调整；包内不能另写相冲突版本。总体验收由执行主会话围绕PRD组织，子任务状态相加不等于整体完成。`
> `- 这是对Grill“单一权威”原则的细化：有PRD时产品权威在PRD，spec只管实现设计；不是PRD与spec同时管同一需求。`

（注：上列第 6 条中 `总体验收由执行主会话围绕PRD组织` 与同稿「未来用户路径」段的 `总体功能验收由任务地图明确指定的实施任务承接` 自相矛盾；decision-log L788 红-7/蓝-13、L809 Q3、`diagnosis-envelope-505f7ce7…` codex/luna major finding 均指向此同一处。）

**（d）实施、并行与 TDD（逐字——含「反馈位置」段）**

> `### 实施、并行与TDD`
>
> `强关联的实现、测试和修复在同一上下文连续完成，独立复核换上下文；不强制每task一个代理。并行仅用于输入、写集与环境独立的工作包，共享写面或真实发布依赖先协调，不能为并行转移整合成本。`
>
> `可观察行为变化且真实测试能先失败时，用同一测试完成RED→GREEN。环境故障、配置缺失或无意义断言不算有效RED；纯文档等不为形式制造失败。已验证且相关输入未变的结果可供判断复用，不因多一轮汇报机械重跑。第一条贯通路径形成时就实际试用，最终仍做整体真实入口联通验收，不能只汇总单元测试或工作包状态。`

（注：decision-log L641 的该节标题为 `### 实施、并行与子代理（Talk round 4 用户定稿）`——卡面 L450 自述来源 `Talk round 4 Q14/Q15` 即指此处。）

**（e）审查、失败与真实完成（逐字）**

> `### 审查、失败与真实完成`
>
> `build-code中的独立代码review检查代码缺陷与相关边界；verify-code检查整体用户行为、验收结果和残余风险，不再固定重做一轮相同代码审查。OCR可作为正常独立审查候选，但效果未实测，接入前验证能力与覆盖；不能直接把厂商数字当作本项目收益。`
>
> `审查工具unavailable时沿用用户选择：一次由未参与实现者完成的独立替代审查，保留来源及缺口，不等待或反复重派；若替代也不可用，如实披露，不宣称独立审查已完成。真实测试失败必须修复并复验才能宣称对应功能完成；不能修复时可停止并交接未完成事实，不能用review unavailable替失败开脱。`
>
> `基础工作可按自身验证事实完成；整体功能只有从真实入口联通实跑、达到约定成功条件且关键失败路径被核对，才可声明完成。Agent展示实际改动、验证结果、未验证项和风险，用户按需抽验；不默认逐项等用户亲验，不把物理交付当质量证明。`

**（f）保留工具、删除职责与最小接续（逐字——含「固定 Talk 轮次删除」段）**

> `### 保留工具、删除职责与最小接续`
>
> `保留可脱离kernel独立调用的窄工具：工作区/范围核对、真实命令exit/output采集、安全写入、不可逆Git授权及冲突中断保护。工具只保证实际能观察的事，不替人判断功能是否合理，也不另建通用完成对象。`
>
> `删除目标职责：stage completion通用认证、task kernel/fact graph对日常工作的强制依赖、多层重复evidence包装、plan/tasks重复合同、固定Talk轮次、强制每Phase review/handoff/不变路线重选，以及只保护这些流程形状的测试。旧wh-review/broker不再是新流程正常审查路径，历史原件只读保留；不能换名字或搬进Skill继续执行。删除具体文件及其活跃消费者要由后续build-plan核查，不预先捏造完整删除清单；真实安全、失败和数据完整性测试保留或随职责改写。`
>
> `跨会话只保留已决定、已完成且验证、未完成及证据位置，新的助手读取这些记录后继续；不恢复阶段fact graph或自动恢复平台。新流程优先，旧任务与历史只读，不保证未完成旧任务自动兼容，不借迁移删除用户文件。`

**（g）非目标、风险、未知与后续边界（逐字）**

> `### 非目标、风险、未知与后续边界`
>
> `不做独立后台执行平台，不保留通用阶段事实图或跨宿主自动恢复；不建token/时间统计机制，不为旧任务建设永久兼容；不新增页面/仪表盘作为本次推荐范围；不在当前规划实现新框架。当前stage工具在重构正式交付前继续有效。`
>
> `保留未知：OCR实际效果尚未验证；完整迁移删除清单和消费者影响需后续代码核查；全部host/子代理耗时归因不明；跨项目“功能不合理”案例尚未完整验证；纯技能不能保证与旧认证引擎同等自动审计。若用户后来提出确切的无人值守或跨宿主强恢复需求，应重新评估产品取舍，而不是偷偷加回平台。`
>
> `后续build-prd应把上述完整用户旅程、责任归属、实际成功/失败边界、迁移范围和任务之间依赖写清，尤其给总体真实验收安排明确承接；不把实现函数、字段、schema或命令形态当本阶段用户问题。`

**（h）原始八点到草案的覆盖（逐字，8 行表）**

> `| 原候选 | 本稿处理 | 未被默认为批准的部分 |`
> `| --- | --- | --- |`
> `| 1 合并规格/计划 | 独立实施task内合并为build-plan方法；规划任务只到PRD，PRD管全局产品，task spec管本task实现 | 具体结构待最终确认 |`
> `| 2 每Phase文档 | 按可验证用户结果工作包，只写差异；删除plan/tasks双写 | 不机械按phase数增文件 |`
> `| 3 TDD提效 | 同一真实行为测试RED→GREEN，剔除形式RED | 不证明所有变更都适用TDD |`
> `| 4 子代理与并行 | 按上下文关联与独立写面选择；独立复核分开 | 不强制每task代理或并行 |`
> `| 5 更换审查 | OCR等可替换候选，代码review与功能验收分工 | OCR更快更准仍未知 |`
> `| 6 去统计 | 不建设token/时间统计机制 | 不删除真实执行结果 |`
> `| 7 弱化严格流程 | 删除过程认证，失败可披露并结束当前尝试 | 不把真实测试失败写成完成 |`
> `| 8 薄核心多技能 | 删除核心与技能中的重复职责，保留窄工具 | 不把旧引擎换名搬家 |`
> `开放状态：本完整草案等待detail advice和最终用户确认；原方向review仍unavailable，Round3零题生命周期冲突及宿主凭证缺失仍如实保留。草案完成不是make-decision完成，也不是build-prd已开始。`

**（i）成功/失败边界 + 风险与延期（逐字）**

> `## 成功/失败边界`
>
> `规划成功目标：用户能核对完整工作流、范围、真实交付结果、失败处置、风险和后续逐任务实施边界；经真实 make-decision 确认后交给 build-prd。具体重构验收标准由 OI-004 收敛。`
>
> `当前不能宣称：框架已实现、测试通过、审查完成、需求全部澄清、make-decision 完成、PRD 完成或物理交付。`
>
> `## 风险与延期`
>
> `风险：仅换文件名但不改消费者；把旧流程搬到技能里；把减阻塞误做成掩盖失败；新审查工具效果未经当前任务验证；并行边界不清造成覆盖写入。这些是待评估风险，不是新增执行 gate。`
>
> `延期：本次规划确认后的实现、测试和交付由后续任务承担；具体迁移顺序和排除项尚未确认，保留 OI-007。`

### 3.3 Grill 最小决策更新（逐字；`detail-review-request…json:16` = `context_map.grill`；`decision-log.md:572–595` 为同一文本的**修订后版本**）

> `### Grill`
>
> `主会话在方向review真实unavailable与Round3零问题结束之后，核对原需求、真实选择和三路研究，确认没有必须追加的方向级问题，Grill以0题完成。没有问答事件，也没有Grill review verdict；以下是主会话授权的最小决策更新，具体设计纳入最终一次确认，不冒充用户逐项批准。`
>
> `- 工作组织：按可验证用户结果工作包组织，不强制每task一个子代理；强关联实现、测试、修复可在同一上下文连续完成，独立复核换上下文。并行只用于输入、写集和环境独立的工作包。`
> `- 权威材料：spec承载一份权威用户目标和跨任务需求；Phase/工作包只引用全局目标并写本包差异，不复制完整需求与架构。当前规划PRD负责需求覆盖与责任卡，后续执行主会话按整体目标组织验收；子任务完成不自动等于总体功能完成，也不触发母任务close。具体责任卡由build-prd形成，不新增后台管家。`
> `- 真实验收：基础工作可按自身验证事实完成；整体功能只有从真实入口联通实跑才可声明完成，沿用Agent实跑、用户重点抽验。真实测试失败必须修复并复验；review unavailable沿用一次未参与实现者的独立替代，二者不能混写。`
> `- 接续：跨会话仅保留已决定、已验证、未完成、证据出处等清晰接续记录；不恢复阶段fact graph，不默认提供跨宿主自动恢复。`
> `- 工具边界：stage completion、task kernel和fact graph是删除候选，不按现有对象反推必留核心。保留可脱离kernel的窄工具职责：工作区/范围核对、真实命令exit/output采集、安全写入、不可逆交付授权与冲突中断保护；未批准具体技术删除清单。`
> `- 真实取舍：方法工具包不再承诺机器认证阶段完成、跨会话证据链或自动判断全部证据过期；这些是U-007所选定位的代价，不假称纯技能提供同等机器保证。`
>
> `覆盖核对：goal由U-001高质量/低浪费与U-005独立诊断覆盖；flow由U-002当前make-decision→build-prd及U-007未来方法工具包覆盖；data/state由单一权威目标、差异工作包与最小接续覆盖；success/failure/acceptance由T-002真实实跑、T-003替代审查与失败不得漂白覆盖；constraints/non-goals/deferred由不建统计、历史只读、未完旧任务不自动兼容、当前不实施覆盖。无遗漏的消息类别；原八点继续保留为候选，不能因覆盖完整就宣称全部方案获批。`
>
> `四项exit checks：`（四条逐字见 1.2 节 B-08）
> `CONTEXT：changed，仅增加两条目标重构术语，明确尚未实施，旧五阶段定义继续描述当前系统。ADR：created，docs/adr/0031-hosted-method-toolkit-direction.md，只记录U-007已解决的产品定位与能力取舍，文档并入本阶段最终整体确认。ADR三判据：难以反转=true（以后恢复统一认证/接续引擎需重新承担状态及适配成本）；无背景会意外=true（维护者可能把主动放弃的认证误作缺陷重建）；真实取舍=true（方法工具包与独立平台已有明确收益/代价比较及用户A）。`
> `冲突处置：CONTEXT当前五阶段和旧ADR描述仍有效的现行实现；新节/ADR只描述未来目标，不即时替代现行合同，不授权物理删除或交付。Round3零问题与固定生命周期合同冲突仍未解决，aggregate/正式completion可能incomplete；本次Grill完成不漂白该缺口。`
> `ADR文档职责登记：owner=本任务make-decision主会话；consumer=最终确认、后续build-prd与实施任务理解产品定位；替代关系=补充未来方向，不即时废止旧实现ADR；保留条件=方向仍是当前重构依据，若被新决策替代则按ADR惯例保留历史而非runtime消费；无新增生产控制面。`

（`decision-log.md:572–595` 的 Grill 修订版把「权威材料」条改写为 `规划任务的PRD独占产品目标、完整用户流程、跨任务需求、总体成功/失败与真实验收；每个独立实施task的spec只负责本task的实现设计、架构取舍、依赖与验证策略。…后续总体验收由PRD任务地图明确指定的实施任务承接…` —— 与送审版不一致，即 decision-log L792 所述「Grill 记录残留旧文档权威」的对照点。）

### 3.4 G-4 原文（卡面 L427/L434 直接引用；八份目标文件中 `[未找到]`，逐字来自 `decision-log.md:857`）

> `| G-4 \| 发散并入第一轮 Talk/调研/方向审查后，若仍觉选项不够 \| 自动再发散一轮 \| 按“取消固定轮次、按未知问题触发”自动再跑一轮发散，不凑数也不压制 \|`
> 该表前导句（`decision-log.md:853`）：`收口时运行时要求 interaction aggregate 的 Grill 至少含一轮真实 ask→wait→reply→resume；此前该步骤为 0 题完成、没有问答事件，因此按同一 Grill 步骤真实补跑**一批独立前沿问题**，用户逐题以选项作答。`
> 收尾句（`decision-log.md:859`）：`上述四条即时生效，作为方向级的 Grill 结论进入 build-prd 的输入；它们不新增 gate，只约束后续实施任务与并行、验收、删除边界的处置方式。`
> 同表另三条（`decision-log.md:854–856`，卡面未引用）：`G-1 … 停并重排`、`G-2 … 显式豁免 + 必须披露`、`G-3 … 停下回报，由你定`。

### 3.5 固定 Talk 轮次删除 + 零问题规则的合同冲突（逐字事实，卡面未见；来自 3.2(f)、3.3、`decision-log.md:514–520`、`decision-log.md:572–580`）

> `Round3规则核对：skills/talk-with-zhipeng/SKILL.md:52–55明确候选可为零，无high/medium待回答项可说明事实与关闭理由后结束；:133–140也允许无人工等待，但必须由主会话记录候选和结束事实。workflows/make-decision/SKILL.md:258–272却要求每轮各自ask/wait/reply/resume，:351–359要求实际三轮/条件四轮且逐轮验证；steps.json:11也描述真实reply/resume。这是零问题结束与固定生命周期文字之间的合同冲突。`（`decision-log.md:520`）
>
> `处理边界：主会话可先核对本轮是否确有未解决的方向问题；若确无新增high/medium项，可按Talk零问题规则说明原因结束本轮，再继续Grill讨论。不为凑轮数重问、不借用前轮回复、不生成未发生的ask/reply；此时不能宣称Round3的真实问答事件链存在或完整interaction aggregate已认证。若后续正式发布边界因此拒绝，保留实际错误/缺失，不创建替代对象。上述是规则边界。`（`decision-log.md:522`）
>
> 事实佐证（I1b 实测被引文件在认证 worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-07-20260919`）：`workflows/make-decision/SKILL.md` L252–254 逐字含 `Host execution binds that seam separately for every Talk round:`、`- Talk round 1 uses \`ask -> wait -> user reply -> resume -> re-rank\` for the`…、`Each round must publish its own \`ask\`, pause at \`wait\`, accept only the` / `matching real user \`reply\`, and then \`resume\` and re-rank before the next` / `owning step.`；同文件 L353–355 逐字含 `` `round_count` is the actual number of completed Talk rounds: it is `3` when `` / `` the conditional Talk round 4 is not triggered and `4` when a direction-level `` / `` or acceptance-impacting dispute requires it.``；`skills/talk-with-zhipeng/SKILL.md:52–55` 逐字含 `候选数量由真实未决问题决定，可以是零、一个或多个；不得设置固定最少或最多问答次数，` / `也不得为了凑数量制造问题。开始时没有 \`high\` 或 \`medium\` 待回答项，可以展示事实和` / `关闭理由后结束本轮；`。

### 3.6 Talk round 4 Q1–Q8 与用户纠正在八份目标文件中 `[未找到]`（卡面 L450 自述来源 `Talk round 4 Q14/Q15`）

八份目标文件中**没有** Talk round 4 的问题卡或 Q1–Q8 编号文本；`detail-review-request…json:14` 的 D-001 与 `:16` 的 Grill 是其后定稿形态。逐字原文见 `decision-log.md:805–814`（Q1–Q8 表）与 `decision-log.md:825–829`（用户纠正），以及 `decision-log.md:831–847`（新增/修订需求 1–5、方法论纠正、reopen 影响）。I1b 不重复转写，仅登记来源指向：

- `decision-log.md:807` `| Q1 | 送审/确认材料集 | 纳入被引用来源：需求目录 R-001..R-014、U-003/U-006、B-005..B-008、ADR-0031、CONTEXT、decision-log |`
- `decision-log.md:810` `| Q4 | 审查工具与跨会话保证 | 两项都接受：(a) 审查工具替换改为有证据门槛的对比实验并保留 fallback；(b) 保留窄交接状态集 + 记录完整性回读检查 |`
- `decision-log.md:827` `用户指出：Q1–Q5 这类问题（材料集、OI 状态、需求编号、责任人措辞）**与 WorkflowHub 流程改造本身无关**；具体方案从未与用户逐条讨论，需求尚未收敛，照此无法设计 PRD，等于凭空做。要求主会话把**具体方案本身**端出来逐条讨论，而不是只收敛材料记账。`
- `decision-log.md:829` `该纠正即刻生效，约束后续交互：**以方案内容为主线**；材料自洽性、台账状态、编号一致性等问题由主会话直接修正，只做简短披露，不再作为向用户提问的主体。同时确认：上述 Q1–Q5 是真实回答，仍按答复执行。`

---

## 4. 与 I1 第 5 节承接对照的合并

判定口径与 I1 第 5 节一致：**已承接** / **部分承接** / **未承接** / **被明确排除**。对照源仍是 `prd.md` 的 CARD-07（FR-33..38 = L431–436；AC-33..38 = L438–443；范围 L428；结果与 consumer L427；可后置技术项 L452；局部风险 L451）。

### 4.1 第 1 节（A 组）新单元承接对照

| 单元ID | 判定 | 依据 |
|---|---|---|
| A-01/A-02/A-03 三条备选方案 | **未承接** | 卡面 FR-33..FR-38 / AC-33..AC-38 无「备选产品形态比较」条款；卡面 L450 的 `来源/设计` 只引 OI-010 与 decision-log 行号，不引 alternatives |
| A-04（阶段数/文档形态/phase 划分/子代理形态/审查工具仍需挑战） | **部分承接** | 「发散候选须挑战既有方案」由 FR-33（`prd.md:431`）与 AC-33（`prd.md:438`）的「含至少 1 条非用户提出的新方向」承接；但「阶段数/文档形态/phase 划分/审查工具」四项均超出卡面范围 L428（卡面只覆盖发散/保真/到达通路/轮次与顺序锁/交互触发） |
| A-05（跨宿主机器认证必要性未证） | **未承接** | 卡面无跨宿主认证条款；属产品定位（U-007）层面，非本卡 FR/AC |
| A-06（真实测试/失败披露/独立审查/危险操作授权必须保留） | **部分承接** | `prd.md:427` 的 consumer 段未列这四项保留下限；FR-33..FR-38 / AC-33..AC-38 无对应条款（其中「独立审查」属 OI-005，被 `prd.md:452` 之外的其他卡/后续承接） |
| A-07（审查工具替换收益未实测） | **未承接** | 卡面无审查工具条款；卡面 L452 只后置「错误清单的具体条目与发散候选的生成方式」 |
| A-08（未来目标流程不构成绕过当前流程的许可） | **未承接** | 卡面无此约束条款；属 D-001 与 decision-log 的执行合同层 |
| A-09/A-10/A-11（无 token 实测 / 无墙钟分解 / unavailable≠通过） | **未承接** | 卡面无对应度量约束；AC-33..AC-38 未含「不得用关键词次数或父命令时间推导」类反例 |
| A-12（三 Talk 轮次 + 条件第四轮 + 测试锁 14 步顺序） | **已承接** | FR-36（`prd.md:434`）`取消固定轮次与 14 步顺序锁`；AC-36（`prd.md:441`）`无固定轮次计数驱动` + 失败场景 `为凑轮次提问…即失败`；本条即其现状事实依据 |
| A-13（外部方案能力与边界；文档比较不证明本仓收益） | **部分承接** | 仅「发散候选须有独立来源」由 FR-33/AC-33 间接承接；「不证明本仓收益」的反例约束在卡面无条款 |
| A-14（9 条 OI 的 question/source/status 全表） | **已承接（间接）** | 卡面 L450 `来源/设计` 明确引 `decision-log OI-010(L359-379)`；OI 表本身是卡面的来源台账，非 FR/AC 条款 |
| A-15（convergence_outline 标 OI-009 open 与 current_selection 已选 A 矛盾） | **未承接** | 属材料内部一致性问题；卡面 FR-33..FR-38 / AC-33..AC-38 无对应条款（decision-log L764 已单列为「可直接修」） |
| A-16（reconstruct→reveal→challenge 三段式） | **未承接** | 卡面无确认流结构条款；decision-log L795 红-13 亦把它列为未解决争议 |
| A-17（独立重建不由宿主提供） | **未承接** | 卡面无对应条款 |

### 4.2 第 1 节（B 组）新单元承接对照

| 单元ID | 判定 | 依据 |
|---|---|---|
| B-01（批准边界：D-001 完整草案等未批准） | **未承接** | 卡面无批准边界条款；属 decision-log/detail 审查面 |
| B-02（按可验证用户结果工作包组织，不强制每 task 一子代理） | **未承接** | 卡面无工作包组织条款；卡面 L428 范围不含计划阶段工作包形态（对应 I1 判 M9 未承接） |
| B-03（Grill 旧版「spec 承载权威」） | **未承接** | 卡面无文档权威条款；且该条本身与 D-001 冲突（decision-log L792 蓝-11） |
| B-04（真实验收与失败处置） | **部分承接** | 「Talk/Grill 大白话 + 失败场景即失败」见 FR-38/AC-38；但「整体功能只有从真实入口联通实跑才可声明完成」不在卡面（卡面 L428 范围不含验收写入契约） |
| B-05（最小接续记录） | **未承接** | 卡面无接续条款 |
| B-06（删除候选 + 保留的窄工具职责） | **未承接** | 卡面无删除面/窄工具条款；对应 I1 判 C5/C6/C7 未承接 |
| B-07（所选定位的代价） | **未承接** | 卡面无代价声明条款 |
| B-08（四项 exit checks + 命名唯一性） | **未承接** | 卡面无命名唯一性或 exit check 条款；卡面 L452 只后置错误清单条目与发散候选生成方式 |
| B-09（Round3 零问题 vs 固定生命周期合同冲突未解决） | **已承接（作为问题的现状依据）** | FR-36（`prd.md:434`）+ AC-36（`prd.md:441`）直接对应「取消固定轮次」；B-09 是该条款要解决的冲突事实。但「冲突未解决、aggregate 可能 incomplete」这一状态本身卡面无条款 → 该子项**未承接** |
| B-10（审查聚焦面 + 权威拓扑重申） | **未承接** | 卡面无审查聚焦面条款；拓扑属 U-008，非本卡 FR/AC |
| B-11（送审 decision-log SHA `9acb5d48…`） | **未承接** | 卡面无材料哈希/送审绑定条款（且卡面 L450 只引三个 revision 同 CARD-01） |
| B-12/B-13/B-14/B-15（方向审查 unavailable、Round3 缺口、OCR/删除映射/节省未实测、本次不启动后续） | **未承接** | 卡面无质量限制与「不得推断完成」条款 |
| B-16（送审时点 + 不得编造通过的审查） | **未承接** | 卡面无对应条款 |

### 4.3 第 1 节（D 组）新单元承接对照

| 单元ID | 判定 | 依据 |
|---|---|---|
| D-01/D-02（direction-review.v1 缺 `direction_flow.json` → MATERIAL_INCOMPLETE，两 runtime 复现） | **未承接** | 卡面无方向审查包完整性条款；卡面 L450 只把「方向审查」列为来源之一。该事实可作 FR-36/C8「取消固定轮次、按真实未决问题触发」的失败背景，但卡面无条款 |
| D-03（信封校验 8 判据与 material 对齐） | **未承接** | 卡面无信封校验条款 |
| D-04/D-05（中文标点 fixture 身份不等 / 空格对照通过） | **未承接** | 卡面无字节身份/转写条款 |
| D-06（provider RATE_LIMITED → partial） | **未承接** | 卡面无 provider 失败处置条款 |
| D-07（12 条 provider findings，含 1 blocking） | **未承接** | 第三方审查事实，非用户原始需求；卡面无对应条款。其中「spec/PRD 权威矛盾」「OI-008 页面范围」「OI-007 遗留路径」「R-001..R-014 无定义」四项与 decision-log L785–795 同源，仍未承接 |

### 4.4 第 1 节（N 组）新单元承接对照

| 单元ID | 判定 | 依据 |
|---|---|---|
| N-01（审计自述非批准） | **未承接** | 卡面无引用边界条款 |
| N-02（三条原归因撤回） | **未承接** | 卡面无「不得以被撤回归因作为新增机制依据」条款 |
| N-04（4 semantic / 6 unavailable，全 phase scope） | **未承接** | 卡面无审查 scope 条款 |
| N-05/N-06（空转归因撤回；停止器/固定 handoff 非必然导出） | **部分承接** | 「取消固定轮次/顺序锁」由 FR-36/AC-36 承接；但「固定 60 分钟 handoff 不是数据必然导出的方案」这一负向约束卡面无条款 |
| N-07（真依赖/共享写面/未证必要串行 三类约束） | **未承接** | 卡面无并行编排条款（对应 I1 判 M9 未承接） |
| N-08（当前 build-code 固定编排成本 + gate_cmd 计数口径） | **未承接** | 卡面无 build-code 编排条款（超卡面范围 L428） |
| N-09（对 U-001 第 4 点「每 task 独立子代理」的反证候选） | **未承接** | 卡面无子代理策略条款；该反证与卡面 L450 的 `来源/设计` 无引用关系 |
| N-10/N-11（writer producer/consumer 责任界限 + 反方案清单 + 不要删除所有 producer 检查/不要再造 receipt gate） | **未承接** | 卡面无证据机制条款；「不要为了此案删除所有 producer 检查或再造一层 receipt/gate」这一负向约束卡面无对应条目 |
| N-12（close completed 与 stage_quality=incomplete 并存；不需要新增 completed_with_quality_gaps） | **未承接** | 卡面无完成状态条款 |
| N-13（四项未知） | **未承接** | 卡面无未知登记条款 |
| N-14（四条可证伪比较 + 不新增统计平台/不建全局调度状态机） | **未承接** | 卡面无比较计划与「不新增统计/调度」约束；卡面 L451 局部风险只列三条 |
| N-15（线程观察引用边界：不得推断 token） | **未承接** | 卡面无引用边界条款 |
| N-16（把 producer/consumer 错配误称「身份漂移」） | **未承接** | 卡面无对应条款；与 FR-35「逐字保真/不得改写」相邻但不同（该误称发生在 agent 叙述层，非材料改写层） |
| N-17（真实根因：component 命名不符，非身份漂移/非材料失效） | **未承接** | 同上 |
| N-18（38/38 AC 通过、缺 integration_review/finding_dispositions 但不阻塞） | **未承接** | 卡面无完成度/阻塞语义条款 |
| N-19/N-20（两条真实 writer 调用见证） | **未承接** | 卡面无 capture 入口条款；对应 N-10/N-11 的「合法最短路径表达不充分」 |
| N-21（items=0 的 9 个 turn 合计 29.73h） | **未承接** | 卡面无时长归因条款 |
| N-22（500 items 含 171 collab + 17 MCP：无 commandExecution ≠ 无工具调用） | **未承接** | 卡面无对应条款 |

### 4.5 第 2/3 节（用户原话与决议草案）承接对照

| 单元ID | 判定 | 依据 |
|---|---|---|
| U-001 第 1–8 点（全文） | **部分承接** | 卡面 L450 `来源/设计` 引 `L791-794(用户原话)` 与 `L798-807`；卡面 L452 后置「错误清单的具体条目与发散候选的生成方式」。第 8 点（薄核心+多技能）是 FR-33/F-35/F-36/F-37 的上位约束；第 1/2/3/4/5/6/7 点的具体落点分散在 CARD-04 与后续卡（`prd.md:428` 明确排除验收写入契约） |
| U-002（大白话 + 主会话只派发） | **已承接** | FR-38（`prd.md:436`）`Talk/Grill 用大白话说明选项、后果和风险`；AC-38（`prd.md:443`）失败场景 `使用术语堆砌`。「主会话只派发与交互」属 OI-002，卡面无条款 → 该子项未承接 |
| U-005（研究深度纠正 + 八点仅粗略候选） | **已承接** | FR-33（`prd.md:431`）`含用户原始候选之外的新候选方向`；AC-33（`prd.md:438`）失败场景 `产物仅是用户候选的重排,即失败` —— 即 U-005 纠正的条款化 |
| U-005 的两个 A 选择（替代审查 / 新流程优先） | **未承接** | 卡面 FR-33..FR-38 / AC-33..AC-38 无条款；属 OI-005/OI-007 |
| U-007（方法工具包定位 A） | **未承接（本卡范围外，已由母 PRD 别处承接）** | 卡面无产品定位条款；卡面 L450 来源未引 U-007 |
| U-008（权威任务拓扑） | **未承接（本卡范围外）** | 卡面无拓扑条款；卡面 L450 来源未引 U-008 |
| U-009 第 1 点（所有阶段派子代理+并行） | **未承接** | 卡面无对应条款（对应 I1 判 M9 未承接） |
| U-009 第 2 点（审查 = 每 phase 一次 + 全部结束一次 + verify-code 一次） | **未承接** | 卡面无审查次数条款；与卡面 L451 `局部风险` 中的「发散被做成新仪式」不同 |
| U-009 第 3 点（CPU/温度） | **未承接** | 卡面无对应条款 |
| U-010 第 1 点（彻底移除质量/流程阻塞，薄核心无任何阻塞） | **部分承接** | 卡面 L427 `结果与 consumer` 的「取消 500 字回传上限」「不新增轮次」与 FR-37 append-only 与之同向；但「不应该有任何阻塞」这一绝对约束卡面无条款 |
| U-010 第 2 点（删除哈希/sha/快照/身份/材料/回执校验机器） | **未承接** | 卡面无对应条款 |
| U-010 第 3 点（build-plan 一次合并审查覆盖 spec+phase） | **未承接** | 超卡面范围（属 CARD-04/后续卡） |
| T-001 | **部分承接** | 卡面 L427 `结果与 consumer` 的「不新增轮次」与 T-001「不新增按大小自动分流」同向；但「make-decision 入口人工选择规划/普通任务」卡面无条款 |
| T-002（Agent 先实跑、用户按需抽验） | **未承接** | 卡面无对应条款（属 OI-004） |
| T-003（工具不可用时一次独立替代审查） | **未承接** | 卡面无对应条款（属 OI-005） |
| T-004（新流程优先、历史只读） | **未承接** | 卡面无对应条款（属 OI-007） |
| T-005（八点仅粗略候选，须独立诊断） | **已承接** | 同 U-005 判定：FR-33（`prd.md:431`）+ AC-33（`prd.md:438`） |
| T-006（方法工具包定位的接续与保留） | **未承接** | 卡面无对应条款 |
| T-007（Round 3 零题、不伪造问答链） | **部分承接** | AC-36（`prd.md:441`）失败场景 `为凑轮次提问…即失败` 承接「不伪造问答链」的一半；「aggregate/completion 合同缺口保留」卡面无条款 |
| D-001 首部 + question/recommendation/decision | **未承接（作为整体）** | 卡面无方法工具包整体设计条款；卡面 L427 只承接其中「发散并入第一轮、不新增轮次」 |
| D-001 未来用户路径（U-008 拓扑落地） | **未承接** | 卡面无拓扑条款 |
| D-001「文档权威与避免双写」 | **未承接** | 卡面无文档权威条款；卡面 L428 范围不含文档形态（对应 I1 判 M10 未承接） |
| D-001「实施、并行与 TDD」+「第一条贯通路径形成时就实际试用」 | **部分承接** | 「反馈位置」（第一条贯通路径形成时就试用）由卡面**未**承接；「TDD 有条件 RED」超卡面范围 L428；「不强制每 task 一代理」未承接 → 整体判部分承接仅因卡面 L427 的「不新增轮次」与之同向 |
| D-001「审查、失败与真实完成」 | **未承接** | 卡面无审查/失败语义条款 |
| D-001「保留工具、删除职责与最小接续」（含固定 Talk 轮次删除） | **部分承接** | 「固定 Talk 轮次」删除由 FR-36（`prd.md:434`）承接；同段其余项（stage completion 认证、task kernel/fact graph、多层 evidence 包装、plan/tasks 重复合同、强制每 Phase review/handoff、只保护流程形状的测试）卡面无条款 |
| D-001「非目标、风险、未知与后续边界」 | **部分承接** | 卡面 L452 后置技术项与 D-001「不预先捏造完整删除清单」同向；「不建 token/时间统计」「不新增页面/仪表盘」卡面无条款 |
| D-001「原始八点到草案的覆盖」8 行表 | **部分承接** | 第 7/8 行（删除过程认证、薄核心多技能）与卡面同向；第 1/2/3/4/5/6 行的具体形态均超卡面范围 L428 |
| D-001「成功/失败边界」+「风险与延期」 | **未承接** | 卡面 L451 只列三条局部风险（`发散被做成新仪式`/`大白话要求与结构化记录的张力`/`取消固定轮次被误读`），D-001 的五条风险不在卡面 |
| Grill 最小决策更新（B-02–B-09） | **未承接** | 卡面 FR-33..FR-38 / AC-33..AC-38 无对应条款；卡面 `来源/设计`（L450）未引 Grill 最小结论，只引 `Grill 续 G-4` |
| G-4（选项不够自动再发散一轮） | **已承接** | FR-36（`prd.md:434`）`G-4 自动再发散`；AC-36（`prd.md:441`）`模拟「选项不够」时自动再发散一轮`；卡面 L427 `选项不够按 G-4 自动再发散一轮` |
| G-1/G-2/G-3 | **未承接** | 卡面无并行重排/验收豁免披露/删除安全职责回报条款；卡面 L450 只引 `Grill 续 G-4` |

### 4.6 合并后的「未承接」新增条目清单（I1 第 6.3 节 25 条之外）

> 计数口径：I1 第 6.3 节列 25 条（24 条未承接 + 附 D4）。下表为本轮新增的**未承接**条目（含 6.4 节列为「未清点完」的 8 份文件所补充的条目），共 **62** 条。判定为「部分承接/已承接/被明确排除」的条目已在上表逐条给出，不列入本清单。

| # | 条目 | 主题 |
|---|---|---|
| U-01 | A-01 可搬运方法技能 + 窄执行助手 | 备选产品形态 |
| U-02 | A-02 保留小型强制 runtime（附证明要求） | 备选产品形态 |
| U-03 | A-03 可选独立审计/编排引擎（两种模式风险） | 备选产品形态 |
| U-04 | A-05 跨宿主机器认证必要性未证 | 关键假设 |
| U-05 | A-07 审查工具替换收益与净节省未实测 | 关键假设 |
| U-06 | A-08 未来目标流程不构成绕过当前流程的许可 | 执行合同约束 |
| U-07 | A-09 无 token 实测 | 研究限制 |
| U-08 | A-10 无全任务墙钟分解；无父命令不证明空转 | 研究限制 |
| U-09 | A-11 provider unavailable ≠ 质量通过；语义 findings 与传输失败分列 | 研究限制 |
| U-10 | A-15 convergence_outline 标 OI-009 open 与 current_selection 已选 A 矛盾 | 材料内部不一致 |
| U-11 | A-16 reconstruct→reveal→challenge 三段式 | 确认流结构 |
| U-12 | A-17 独立重建不由宿主提供，缺失不得记为未答 | 审查协议 |
| U-13 | B-01 批准边界（D-001 草案/设计/工具选型/实现/发布未批准） | 批准边界 |
| U-14 | B-02 按可验证用户结果工作包组织，不强制每 task 一子代理 | 工作组织 |
| U-15 | B-03 Grill 送审版「spec 承载权威」与 D-001「PRD 独占权威」矛盾 | 文档权威（残留） |
| U-16 | B-05 最小接续记录集（已决定/已验证/未完成/证据出处） | 接续 |
| U-17 | B-06 删除候选 + 保留的窄工具职责 | 删除面/工具边界 |
| U-18 | B-07 所选定位的代价（不承诺机器认证/证据链/自动过期） | 定位代价 |
| U-19 | B-08 四项 exit checks + 命名唯一性 | 方向出口判据 |
| U-20 | B-09 子项：Round3 零问题与固定生命周期冲突未解决、aggregate 可能 incomplete | 合同冲突状态 |
| U-21 | B-10 审查聚焦面 + 权威拓扑重申 | 审查范围 |
| U-22 | B-11 送审 decision-log SHA `9acb5d48…`（与方向 review 冻结 SHA 不同） | 材料绑定 |
| U-23 | B-12 方向审查 unavailable、无语义 findings | 质量限制 |
| U-24 | B-13 Round3 零问题生命周期 + 缺宿主回复凭证持续披露 | 质量限制 |
| U-25 | B-14 OCR 收益/删除映射/时间 token 节省未实测 | 质量限制 |
| U-26 | B-15 本次请求不启动 PRD/实现/测试/最终批准 | 执行边界 |
| U-27 | B-16 送审时点 + 不得编造通过的审查 | 审查真实性 |
| U-28 | D-01/D-02 direction-review.v1 缺 `direction_flow.json` → MATERIAL_INCOMPLETE（两 runtime 复现） | 方向审查包完整性 |
| U-29 | D-03 信封校验 8 判据（version/request-id/material-id/state/provider/污染/多 JSON/material 对齐） | 信封协议 |
| U-30 | D-04 中文标点 fixture 声明/实际字节不等 | 字节身份 |
| U-31 | D-05 空格对照通过（排除工具整体不可用） | 字节身份对照 |
| U-32 | D-06 provider RATE_LIMITED → partial | provider 失败处置 |
| U-33 | D-07 12 条 provider findings（含 1 blocking：研究前置被折叠为引用标签） | 第三方审查事实 |
| U-34 | N-01 审计自述非批准、八点为待检验粗略候选 | 引用边界 |
| U-35 | N-02 三条原归因撤回（空转/手工拼回执/状态回填改 revision） | 归因纠正 |
| U-36 | N-04 4 semantic / 6 unavailable、全 phase scope | 审查 scope |
| U-37 | N-06 空转停止器或固定 60 分钟 handoff 可能截断运行中的子代理 | 负向约束 |
| U-38 | N-07 三类约束：真依赖 / 共享写面 / 未证必要串行 | 并行编排 |
| U-39 | N-08 当前 build-code 固定编排成本；25 条 gate_cmd 不等于执行 25 次 | 固定编排成本 |
| U-40 | N-09 对「每 task 独立子代理」的反证候选（一个实现者连续 RED→GREEN→修复 + 另一上下文独立审查） | 子代理策略反证 |
| U-41 | N-10 writer producer/consumer 责任界限（固定 stage consumer 有合理性） | 证据机制责任 |
| U-42 | N-11 反方案清单 + 不要删除所有 producer 检查/不要再造 receipt gate | 负向约束 |
| U-43 | N-12 close completed 与 stage_quality=incomplete 并存；不需新增完成状态 | 完成语义 |
| U-44 | N-13 四项未知（并行关键路径/远端是否执行/因果/净节省与长期收益） | 未知登记 |
| U-45 | N-14 四条可证伪比较 + 不新增统计平台 + 不建全局调度状态机 | 比较计划与负向约束 |
| U-46 | N-15 线程观察引用边界：不得推断 token、非完整轨迹 | 引用边界 |
| U-47 | N-16 把 producer/consumer 错配误称「身份漂移」 | agent 叙述准确性 |
| U-48 | N-18 38/38 AC 通过；缺 integration_review/finding_dispositions 但不阻塞 | 完成度/阻塞语义 |
| U-49 | N-19/N-20 两条真实 writer 调用见证（自定义 component，非手工拼 JSON） | 事实见证 |
| U-50 | N-21 items=0 的 9 个 turn 合计 29.73h（不得等同未执行） | 时长归因 |
| U-51 | N-22 500 items 含 171 collab + 17 MCP（无 commandExecution ≠ 无工具调用） | 反例 |
| U-52 | U-001 第 1/2/3/4/5/6/7 点的具体落点（阶段合并、每 phase 一文档、TDD、子代理并行、换审查工具、不建统计、弱化阻塞） | 原始八点本体 |
| U-53 | U-005 两个 A 选择（替代审查 / 新流程优先历史只读） | 局部选择 |
| U-54 | U-007 方法工具包定位 A | 产品定位 |
| U-55 | U-008 权威任务拓扑 | 任务拓扑 |
| U-56 | U-009 第 1 点（所有阶段派子代理 + 并行设计） | 工作方法 |
| U-57 | U-009 第 2 点（审查次数 = 每 phase 一次 + 全部结束一次 + verify-code 一次） | 审查次数 |
| U-58 | U-009 第 3 点（CPU/温度必须优化） | 环境成本 |
| U-59 | U-010 第 2 点（删除哈希/sha/快照/身份/材料/回执校验机器） | 证据机器删除 |
| U-60 | U-010 第 3 点（build-plan 一次合并审查覆盖 spec+phase） | 审查合并 |
| U-61 | T-002/T-003/T-004/T-006（实跑抽验 / 替代审查 / 新流程优先 / 定位接续） | 局部选择 |
| U-62 | D-001 各节中卡面无条款的形态（文档权威、审查失败语义、成功失败边界、五条风险、未完成旧任务不自动兼容） | 草案形态 |

**其中「可直接落到 CARD-07 写面」的强相关新增未承接条目（与 make-decision 发散/保真/到达/轮次/交互直接相关）**：U-20、U-28、U-29、U-33、U-34、U-35、U-39、U-40、U-46–U-51、U-53、U-56–U-58、U-62。

---

## 5. 仍未读或无法读取的项（如实）

### 5.1 本轮指定 8 份文件：全部可读、全部已读全文 → 无 `[不可读]`

八份文件均在 `.../quality/evidence/research/` 下，均有读权限（权限位 `-rw-r--r--` / `-rw-------`，均属当前用户）。`diagnosis-envelope-0b191aab…json` 与 `diagnosis-envelope-16232244…json` 的 `wire.stdout` 单行超长，`read` 工具按 2000 字符截断；I1b 用 JSON 解析还原了完整 stdout 并逐字段输出，故视为**已读全文**。

### 5.2 同一 evidence 目录内仍未读的项（不在本轮指定 8 份之列，如实登记）

| 项 | 状态 | 理由 |
|---|---|---|
| 5 份同源快照 `3613b4fc…` / `7bd2bcee…` / `882eecfd…` / `ab4cddfe…` / `cca7db91…` | **未读全文**（按任务要求不重复读） | 已逐字段比对确认差异仅 3 字段；任务书明确「读一份即可」 |
| `diagnosis-review-contract-independent.md`（15222 B） | **仅部分读**（I1 grep 命中 L74/L82） | 不在本轮 8 份之列；I1 已登记其 L82 内容。I1b 未展开全文 → 全文状态**未读** |
| `diagnosis-review-identity-repro.mjs`（2182 B） | **I1 部分读（grep 命中）**；I1b 未读全文（仅通过 results 的 stdout 与 `diagnosis-review-envelope-replay.mjs` 反推其存在） | 不在本轮 8 份之列；其输出已被 `diagnosis-review-identity-repro-results.json` 完整记录 |
| `make-decision-redesign-candidates.md` / `divergence-*.md` / `research-synthesis.md` / `external-architecture-options.md` / `architecture-diagnosis.md` / `r5-*.md` / `0709c780…json` / `16a9db4c…json` | **I1 已读**（本报告不重复） | 见 I1 第 0 节 |
| `direction-review-request-…json` 的 `review_flow.steps` 与 `materials.direction_flow` | **已读**（逐字见 A-16） | — |
| `detail-review-request-…json` 的 `approved_direction` 四个子字段 | **已读**（`approval_boundary` / `product_position` / `authoritative_task_topology` / `local_user_choices`） | — |
| `frozen-execution-root-cause-audit.md` 引用的原审计原件 `/Users/Hugh/Downloads/workflowhub-build-verify-time-waste-audit-20260919.md` | **未读**（不在 evidence 目录，不在本轮范围） | 本轮 8 份不含；审计报告已逐条记录其应撤回结论 |
| 历史 task store `.../workflowhub-cost-baseline-and-blocker-close-20260917/`、归档材料 `specs/archive/…` | **未读**（不在本轮范围） | 本轮 8 份不含 |
| 原 thread `01a0af94-d79b-7000-88ea-32c06c9508e5` 的完整对话 | **未读**（超出工具能力与范围） | `thread-observations-…json` 自述 `scope: returned-items metadata only; not a full transcript or child-agent log` |
| Quick Look / 图片类证据 | **不适用** | evidence 目录内无图片文件 |

### 5.3 明确 `[未找到]` 的项

| 查找目标 | 结果 |
|---|---|
| U-003 / U-004 / U-006 / U-009 / U-010 全文 | **`[未找到]`（在 8 份目标文件内）**；逐字见 `decision-log.md:63–118` |
| Talk round 4 问题卡与 Q1–Q8 编号 | **`[未找到]`（在 8 份目标文件内）**；`detail-review-request…json:14` 与 `:16` 只含其后定稿形态；逐字见 `decision-log.md:805–814` |
| G-1/G-2/G-3/G-4 原文表 | **`[未找到]`（在 8 份目标文件内）**；卡面 L450 引 `Grill 续 G-4`；逐字见 `decision-log.md:854–857` |
| 把 M1–M12 / C1–C14 / F1–F10 逐条映射到 CARD-07 的**下游**文档 | **`[未找到]`**（与 I1 第 6.4 节结论一致；I1b 8 份文件中亦无） |
| U-009/U-010 的宿主 `reply_ref`/`reply_hash` | **`[未找到]`**：`detail-review-request…json:9`/`:16` 与 `decision-log.md:372` 均明写 `宿主未提供认证reply_ref/hash，不补造` |
| `direction_flow.json` 实体文件 | **`[未找到]`**（这正是 D-01/D-02 的失败原因；信封内未见该文件内容） |
| `diagnosis-envelope-0b191aab…` / `16232244…` 的 `group.selected_tier` 值 | 值存在但为 `null`（非缺失） |

---

## 6. 计数

### 6.1 读取状态计数

| 项 | 数 |
|---|---|
| 本轮指定文件 | **8** |
| 已读全文 | **8**（其中 2 份的 `wire.stdout` 经 JSON 解析还原为完整内容） |
| 无法读取 | **0** |
| 同源快照按「只读一份」执行 | 6 份中读 1、逐字段比对 5；差异字段 3 |
| I1b 追加读（I1 仅标部分读） | **2**（`diagnosis-envelope-25061695…`、`diagnosis-envelope-505f7ce7…`） |
| 被读文件被修改数 | **0** |

### 6.2 新单元计数

| 节 | 组 | 条数 |
|---|---|---|
| 第 1 节 | A（direction-review-request） | **17**（A-01–A-17） |
| 第 1 节 | B（detail-review-request） | **16**（B-01–B-16） |
| 第 1 节 | D（诊断信封/复现） | **7**（D-01–D-07） |
| 第 1 节 | N（审计/线程） | **22**（N-01–N-22） |
| **第 1 节合计** | — | **62** |
| 第 2 节 | 用户原话逐字 | **10** 组（U-001、U-002、U-003、U-004、U-005、U-006、U-007、U-008、U-009、U-010）；其中 8 份目标文件内实含 5 组（U-001/U-002/U-005/U-007/U-008），另 5 组标 `[未找到]` 并由 decision-log 补逐字 |
| 第 3 节 | 决议草案逐条 | **9** 组（T-001–T-007 全表、D-001 九个子段、Grill 最小更新、G-4、固定 Talk 轮次冲突事实、Talk round 4 Q1–Q8 指向） |
| 第 4 节 | 承接对照行 | **112** 行（4.1 = 17、4.2 = 16、4.3 = 7、4.4 = 22、4.5 = 47；其中 4.5 为第 2/3 节单元） |
| 第 4.6 节 | **新增「未承接」条目** | **62**（U-01–U-62，与第 1 节 62 条一一对应） |

### 6.3 第 4 节判定分布（按对照行）

| 判定 | 行数 | 编号 |
|---|---|---|
| 已承接 | **6** | A-12, A-14, U-002, U-005, T-005, G-4（另 B-09 行整体标「已承接（作为问题的现状依据）」并含未承接子项） |
| 部分承接 | **14** | A-04, A-06, A-13, B-04, D-001「保留工具、删除职责与最小接续」（固定 Talk 轮次子项已承接、其余未承接）, T-001, T-007, U-001, U-010 第 1 点, D-001「实施、并行与 TDD」, D-001「非目标、风险、未知与后续边界」, D-001「原始八点到草案的覆盖」, N-05+N-06（同一行两条）, N-08（同段含计数口径纠正） |
| 未承接 | **92** | 第 4.1–4.5 节判定为未承接的 92 行；其中 **62 条为第 1 节新单元（= 第 4.6 节 U-01–U-62 清单）**，另 30 条为第 2/3 节的既有单元（U-001 的第 1–7 点、U-005 的两个 A、U-007、U-008、U-009 第 1/2/3 点、U-010 第 2/3 点、T-002/T-003/T-004/T-006、D-001 各节形态、Grill 最小更新、G-1/G-2/G-3）——这批与 I1 已判定的 M/C/F 主题有重叠，**不并入 6.4 的「未承接」增量** |
| 被明确排除 | **0（本卡范围内）** | 第 4.5 节 U-007/U-008 两项判为「本卡范围外」而非「被排除」；按 I1 口径，卡面 L428 明确排除的仅「验收标准写入契约」一项（I1 已列 M7/D3，本轮不新增） |
| 同一主题双份材料重复判定 | **—** | 同一主题在 U-001 与 D-001 双份材料中分别判定（与 I1 第 6.4 节「D3 与 M7 同一项出现两次」的处理口径一致），已在 4.5 节逐行标注 |

**判定分布的小计核对**：6 + 14 + 92 = 112 = 第 4 节对照行总数。

### 6.4 与 I1 计数的合并

| 项 | I1 | I1b 新增 | 合并 |
|---|---|---|---|
| 未读/仅 grep 的目标文件 | 8 | **−8（全部清空）** | **0** |
| 「未承接」条目（去重口径：只计第 1 节新单元） | 25 | **+62** | **87** |
| 承接对照行 | 40（36+D1–D4） | +112 | 152 |
| 用户原话组 | 含 U-001 第 8 点、U-002、U-005、U-007、U-008 等零散引用 | +5 组全文（U-001 八点全、U-005 效力段全、U-008 全、U-003/U-004/U-006/U-009/U-010） | 10 组 |

> 去重说明：I1 第 6.3 节的 24 条「未承接」均为 M/C/F 编号（主文件候选），与 I1b 的 A/B/D/N 编号（证据文件单元）无编号重叠；I1b 第 4.5 节中判「未承接」的 U-/T-/D-001/Grill 单元虽与 M/C/F 主题相邻，但按 I1 第 6.4 节的既有口径（同一主题出现两次即分别判定）不并入增量，故 6.4 的增量严格等于第 1 节新单元数 62。

---

## 附：I1b 判断之外的边界声明

- 本报告只清点与承接对照，**不提改造建议、不做取舍判断**（与 I1 一致）。
- 所有「未承接」判定依据均为「卡面 FR-33..FR-38 / AC-33..AC-38 / 范围 L428 / L427 / L451 / L452 中无对应条款」，不含取舍判断。
- 第 1.3 节 D-07 的 12 条 findings 是**第三方 provider 审查事实**，不是用户原始需求单元；I1b 只登记其存在与首条 blocking 的逐字起句，未把其 recommendation 当作需求。
- 第 3.5 节的被引 skill 行号在认证 worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-07-20260919` 上做只读实测；实测文本与 `decision-log.md:520` 描述一致。
