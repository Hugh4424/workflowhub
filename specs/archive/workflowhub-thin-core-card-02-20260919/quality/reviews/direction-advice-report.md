# direction-advice 审查报告（make-decision / step 6）

> 本报告由审查执行子代理按"如实记录、不许伪造"要求撰写。所有 status / material_id / provider 身份 / findings / 错误码均为
> `wh-review-cli.mjs run` 的**真实返回**，未做任何改写、升格或降格。

- **任务**：`workflowhub-thin-core-card-02-20260919`
- **阶段 / 轨道**：`make-decision` / `direction`（step 6 direction-advice，advice-only，非 pass 门）
- **宿主声明**：`host_provider="dsh"`（当前宿主为 DeepSeek Harness；`dsh` 是 3rd-review 支持的**宿主身份**，只用于同源排除与 provenance，本身不是 reviewer）
- **执行时间**：2026-09-20（本地）
- **路由**：`~/.config/workflowhub/config.json` → `wh_review.stages["make-decision"].direction.initial = [kimi/coding, antigravity/flash, codex/luna]`，`minimum_heterologous = 1`，`mode = single_round`
- **paired 形态**：`make-decision/direction` 无 `pair_id`/`role` 时 runner 走 paired 路径，red / blue 各发一次 broker group request（合计两次 public request）

## 1. 调用命令

按 SKILL 与本任务指定的形式（heredoc）：

```bash
cd /Users/Hugh/Hugh/Project/workflowhub
node skills/wh-review/scripts/wh-review-cli.mjs run <<'JSON'
{"stage":"make-decision","review_track":"direction","host_provider":"dsh","materials":{...}}
JSON
```

因 `materials` 达 12–14 万字节，heredoc 会被 shell 转义/长度破坏，改用 CLI 自身支持的
`argv[3] = input.json` 文件入口（`wh-review-cli.mjs` → `readFileSync(process.argv[3] ?? 0, "utf8")`）。实际执行的两条命令：

```bash
# 尝试 A：按任务原样指定的 key 名（raw_requirement / approved_direction / convergence_outline / acceptance）
cd /Users/Hugh/Hugh/Project/workflowhub && node skills/wh-review/scripts/wh-review-cli.mjs run /tmp/wh-review-attemptA.json

# 尝试 B：按 direction 轨道材料契约（stage-materials.json）合规的 key 集
cd /Users/Hugh/Hugh/Project/workflowhub && node skills/wh-review/scripts/wh-review-cli.mjs run /tmp/wh-review-attemptB.json
```

请求载荷（真实字节，可复核）：

| 尝试 | 载荷文件 | 字节 | stage / track / host_provider |
| --- | --- | --- | --- |
| A | `/tmp/wh-review-attemptA.json` | 138702 | make-decision / direction / dsh |
| B | `/tmp/wh-review-attemptB.json` | 119852 | make-decision / direction / dsh |

## 2. 送审材料清单（实际送了哪几节）

**源材料快照（抽取时刻哈希，可复核）**

- `prd.md`：`/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`
  - sha256 = `f05577c30a74931f11bfea3b11d37fbf4bec602a49a92bf9bb7eb12761a9e8f9`，121223 bytes
- `decision-log.md`：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-02-20260919/specs/workflowhub-thin-core-card-02-20260919/decision-log.md`
  - sha256 = `47029fe7270cd3121cbd64dc5bb126f78386bb721bc3c971dc15cfc8c68cb476`，299954 bytes，2361 行

**逐节抽取（逐字行切片，未改写、未压缩、未摘要）**

| 节 | 来源行范围 | 字节 | sha256（前 16） |
| --- | --- | --- | --- |
| `### CARD-02` 整节 | prd.md L264–292 | 5191 | `60734c3f29a2ff73…` |
| `### U-001` 整节 | decision-log L70–89 | 2680 | `f3419938b0396baa…` |
| `### U-002` 整节 | decision-log L90–127 | 3213 | `cba8188016755c7a…` |
| `## 任务身份` | decision-log L33–43 | 490 | `8021d139e13083ca…` |
| `## 任务类型说明` | decision-log L44–49 | 327 | `2142fc94a9616995…` |
| `## 原始需求与输入` | decision-log L50–67 | 1245 | `c521fe3d923b9892…` |
| `## 已知不一致预登记` | decision-log L141–154 | 1385 | `b41322817c14521e…` |
| `## 决定`（T 覆盖核对表 + D-001..D-014） | decision-log L155–454 | 74817 | `a3f04656e9457c1c…` |
| `## 唯一 OI 大纲` | decision-log L455–832 | 28181 | `e1b45270b1db59d5…` |
| `## 收敛检查`（四行表） | decision-log L1075–1089 | 13963 | `eaf7f5875b02bce2…` |
| `## spec 模板结构（终稿…）` | decision-log L2048–2087 | 2918 | `cdeac04403dcf212…` |
| `## 覆盖核查的补登记（T-060 / T-061 …）` | decision-log L2318–2361（EOF） | 5331 | `49d4c14c0597abc4…` |

除节标题行的 ASCII 分隔标签 `# ===== SECTION: <节名> =====` 外，未向材料内插入任何自有文字；**没有截断任何节**（全部节完整送入）。

### 2.1 关键事实：任务指定的 key 名与 direction 轨道契约冲突

`runtime/review/stage-materials.json → stages["make-decision"].tracks.direction` 规定：

- required：`raw_requirement`、`objective_facts`、`convergence_outline`（+`review_instructions`，runner 生成）
- optional：`current_selection`、`alternatives`、`selection_rationale`、`key_assumptions`、`independent_reconstruction`、`direction_flow`
- **forbidden**：`proposed_solution`、`decision_log`、`spec`、`plan`、`changes_diff`、`changed_files`

任务指定的 `approved_direction` 与 `acceptance` **不在** direction 的 allowlist 内（静态复核：
`validateMaterialAllowlist(direction-rule, {raw_requirement, approved_direction, convergence_outline, acceptance})`
→ `discarded_facts: MATERIAL_UNKNOWN_KEY_DROPPED × 2`）。同时任务清单未包含 direction 的必需键 `objective_facts`。
`skills/wh-review/contracts/make-decision.md` 的 direction 节亦明文禁止交付"拟定方案/推荐方案""已批准方向""decision log"。

因此本报告分两次真实调用：**尝试 A = 任务原样指定的 key 集**（结果见 §3），**尝试 B = direction 契约合规 key 集**（结果见 §4）。
两次调用的 `raw_requirement` 完全一致。

### 2.2 尝试 B 的材料映射（逐项可审计）

| direction 合法键 | 送入内容（均逐字） |
| --- | --- |
| `raw_requirement` | prd `### CARD-02` 整节 + `### U-001` 整节 + `### U-002` 整节（任务要求的"原始需求全文"，sha256 `9aa5ed3bd1ac3a41ddbb6cb7afde74253a26d98eb65aa212f35cb16aee607024`） |
| `objective_facts` | `## 任务身份` + `## 任务类型说明` + `## 原始需求与输入` + `## 已知不一致预登记 NG-1..NG-5`（正式键，任务清单未列；3783 bytes） |
| `convergence_outline` | OI 大纲的 **questions-only 投影**（见 §2.3；6085 bytes） |
| `current_selection` | `## 决定`（L155–454）+ `## 收敛检查` 四行表（L1075–1089）+ `## spec 模板结构（终稿）`（L2048–2087）+ `## 覆盖核查的补登记`（L2318–EOF）。即任务的 `approved_direction` + `acceptance` 内容整体落在此键（contract 指定的"当前选择 / reveal 阶段可见"槽位；runner 的 broker-owned `direction-review.v1` flow 在 reconstruct 阶段对其隐藏） |

**未送入**：无（任务的 4 项内容全部在内，只是 `approved_direction`/`acceptance` 两项按契约改挂 `current_selection`）。

### 2.3 questions-only 投影规则（任务称该节"已是 questions-only 投影"，实测不是）

实测 `## 唯一 OI 大纲` 的 17 条 OI 记录**均已回填答案字段**：`resolution`、`selected_disposition`、`evidence`、
`acceptance`、`counterexample`、`visible_group_id`、`impact_dimensions`、`requires_user_decision`、`status: "confirmed"`。
按 direction 契约这些属禁止交付内容（"OI 的答案、selected_disposition、依据、结论、终态字段"）。

故尝试 B 未原样送该节，而按**仓库既有唯一生产者** `runtime/stage/stage-content-contracts.mjs`
`deriveQuestionsOnlyOutline()` 的语义做机械投影：

- 保留：`task_id`、`outline_version`、每条 `oi_id` / `category` / `source` / `question`
- 丢弃：`acceptance`、`counterexample`、`evidence`、`impact_dimensions`、`requires_user_decision`、`resolution`、`selected_disposition`、`status`、`visible_group_id`
- `status`：统一 `"open"`（契约要求"为防止答案锚定，展示状态统一为 open"）
- 结果：17 条记录，6085 bytes，sha256 `3a5e7f7df44ba3dd1a2282f3098de337c832ac550ab28da91777080fa32b5453`

**尝试 A 的 `convergence_outline` 仍按任务原样送入该节全文**（含答案），以便如实暴露 A 的结果形态。

## 3. 尝试 A 的真实结果（任务原样指定 key 集）

**结果：命令失败，`exit code = 1`；stdout 为空；无 `status` / `material_id` / findings 返回。**

```
$ cd /Users/Hugh/Hugh/Project/workflowhub && node skills/wh-review/scripts/wh-review-cli.mjs run /tmp/wh-review-attemptA.json
exit=1
--- stdout (0 bytes) ---
--- stderr ---
MATERIAL_UNKNOWN_KEY_DROPPED: approved_direction is not in the stage material allowlist
MATERIAL_UNKNOWN_KEY_DROPPED: acceptance is not in the stage material allowlist
MATERIAL_UNKNOWN_KEY_DROPPED: approved_direction is not in the stage material allowlist
MATERIAL_UNKNOWN_KEY_DROPPED: acceptance is not in the stage material allowlist
TypeError: review recovery result material_id does not match its request
    at normalizeBareRecoveryResult (file:///Users/Hugh/Hugh/Project/workflowhub/skills/wh-review/scripts/wh-review-cli.mjs:218:13)
    at file:///Users/Hugh/Hugh/Project/workflowhub/skills/wh-review/scripts/wh-review-cli.mjs:303:14
```

- 这不是 `{"status":"unavailable"}` 结构，而是**宿主侧未捕获异常**（CLI 以 `process.exitCode = 1` 退出）。
  按任务要求如实归类为"非零退出 + JSON 无效"，**未**重标为 `REVIEW_PROVIDER_UNAVAILABLE`，也**未**写成 pass 或空 findings。
- 可观察的因果链（stderr 原文顺序）：direction 轨道把 `approved_direction` / `acceptance` 记为
  `MATERIAL_UNKNOWN_KEY_DROPPED`（paired 的 red/blue 各打一次，故 4 行），随后
  `TypeError: review recovery result material_id does not match its request`
  （`wh-review-cli.mjs:218 normalizeBareRecoveryResult`）。
- 该次调用**未派出任何 provider 请求**，未产生 findings，`/Users/Hugh/.workflowhub/review-sink/` 无新增文件（最近文件仍为 2026-09-16）。
- 结论（事实陈述，非质量裁决）：**按任务给定的 key 名，本机当前 wh-review 契约下无法完成一次真实 direction 审查**；
  `approved_direction` / `acceptance` 两个键在 direction 轨道上不被接受。

## 4. 尝试 B 的真实结果（direction 契约合规 key 集）

**本次调用真实成功进入 provider 层（`dispatch_state = "dispatched"`），返回语义 findings。**

| 字段 | 真实值 |
| --- | --- |
| `status` | `available-with-failures` |
| `outcome` | `partial` |
| `pair_status` | `partial` |
| `dispatch_state` | `dispatched` |
| `material_id` | `904c2514d983b19f63e5cced40b2acdd9e183aea6bd54f409bfda5c094a47190` |
| `material_ids` | `{"red":"904c2514d983b19f63e5cced40b2acdd9e183aea6bd54f409bfda5c094a47190","blue":"904c2514d983b19f63e5cced40b2acdd9e183aea6bd54f409bfda5c094a47190"}` |
| `material_consistency` | `consistent` |
| `runtime_id` | `null` |
| `pair_id` | `7dcfab66-59ae-4cd5-8288-838362e4cc59` |
| `reused` / `authoritative` | `false` / `false` |
| `red_incomplete` / `blue_incomplete` | `true` / `true` |
| `sink_ref` | `/Users/Hugh/.workflowhub/review-sink/eeb6d6c16ccb30ff9f398b273b8bf0da9f062c40ae4e1f01ee1ba19ec9a4654c.json` |
| `error` | `{"code":"REVIEW_NO_SEMANTIC_RESULT","message":"neither paired review produced a semantic result"}` |
| `findings` | **24 条** |
| `provider_results` | **6 条**（red 3 + blue 3） |

`status = "available-with-failures"`（partial）表示：至少一个异源 reviewer 返回了合法 findings JSON，**但**并非所有
provider 都完成。按 SKILL 与合同，**partial 不是 pass**；本报告不把它表述为"方向通过"。
顶层 `error.code = REVIEW_NO_SEMANTIC_RESULT` 是 `combinePairedResults` 在 `allIncomplete`（两个 role 都因
`antigravity/flash` 失败而判 incomplete）时发出的兜底标签；同一次返回中 `role_results.red.status`/`blue.status` 均为
`available` 且各带 findings（见下表）。此处**两个字段同时原样保留**，不做取舍或调和。

### 4.1 provider_results（provider 身份 + transport outcome）

| provider | role | transport status | error | identity（adapter / model） | config_id | duration_ms | session_id | evidence_anchor_valid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `kimi/coding` | red | **completed** | — | kimi / `kimi-for-coding/kimi-for-coding` | `715d4c1363f6ba7d…` | 355706 | `session_89ad20ed-b9f6-42ad-81c0-728f7a38c1d6` | `[true,true,true,true,true]` (5) |
| `antigravity/flash` | red | **failed** | `AUTHENTICATION_FAILED`: provider process exited with 1 | antigravity / `gemini-3.8-flash-high` | `5ba41c80161607da…` | 16726 | `—` | — (未返回) |
| `codex/luna` | red | **completed** | — | codex / `gpt-5.6-luna` | `417b73e72fba3691…` | 439854 | `01a0bf0c-f30b-7cf3-9175-62bf12119999` | `[true,true,true,true,true,true,true,true,true]` (9) |
| `kimi/coding` | blue | **completed** | — | kimi / `kimi-for-coding/kimi-for-coding` | `715d4c1363f6ba7d…` | 291077 | `session_8e47e256-2e8d-4f7a-9611-fc972b8d0917` | `[true,true]` (2) |
| `antigravity/flash` | blue | **failed** | `AUTHENTICATION_FAILED`: provider process exited with 1 | antigravity / `gemini-3.8-flash-high` | `5ba41c80161607da…` | 16685 | `—` | — (未返回) |
| `codex/luna` | blue | **completed** | — | codex / `gpt-5.6-luna` | `417b73e72fba3691…` | 325768 | `01a0bf0c-f30c-7d02-a32d-35626e95bc23` | `[true,true,true,true,true,true,true,true]` (8) |

- 异源下限 `minimum_heterologous = 1` 由 `kimi/coding`（kimi-for-coding）与 `codex/luna`（gpt-5.6-luna）满足；二者均与宿主 `dsh` 异源。
- `antigravity/flash`（gemini-3.8-flash-high）在 red/blue 两次请求中均返回
  `AUTHENTICATION_FAILED` / `provider process exited with 1`（duration ≈ 16.7s）。这是**真实的 provider 侧失败事实**，按原码原样记录，未重标为 `REVIEW_PROVIDER_UNAVAILABLE` 或任何其它类别。

### 4.2 role_results 汇总

| role | status | outcome | findings | providers |
| --- | --- | --- | --- | --- |
| red | `available` | `partial` | 14 | `kimi/coding`=completed、`antigravity/flash`=failed、`codex/luna`=completed |
| blue | `available` | `partial` | 10 | `kimi/coding`=completed、`antigravity/flash`=failed、`codex/luna`=completed |

### 4.3 evidence_anchor_valid（原样记录，未把 unknown 改成 true）

- `kimi/coding` (red)：`evidence_anchor_valid` = `[true,true,true,true,true]`，共 5 条 finding，其中带 `line` 锚点的 5 条。
- `codex/luna` (red)：`evidence_anchor_valid` = `[true,true,true,true,true,true,true,true,true]`，共 9 条 finding，其中带 `line` 锚点的 0 条。
- `kimi/coding` (blue)：`evidence_anchor_valid` = `[true,true]`，共 2 条 finding，其中带 `line` 锚点的 2 条。
- `codex/luna` (blue)：`evidence_anchor_valid` = `[true,true,true,true,true,true,true,true]`，共 8 条 finding，其中带 `line` 锚点的 0 条。

**必须同时记录的限定**：`evidence_anchor_valid` 是 **per-provider 的逐条 boolean 数组**（不是 per-finding 字段）。
本机返回的 24 个布尔值全部为 `true`，但其中 `codex/luna` 的 **17 条 finding 全部没有 `line` 字段**（`line: undefined`）。
即：`codex/luna` 的 17 个 `true` 是在**无行号锚点**的情况下返回的，**不能**据此宣称这 17 条的行级锚点已被验证。
本报告不把任何 unknown 写成 true，也不把 true 升格为"锚点已验证"。

## 5. findings 全文（逐条，无改写）

severity 分布（真实计数）：**major 20 / minor 4 / blocking 0**；
按 provider：`kimi/coding` 7 条，`codex/luna` 17 条。
材料路径为 runner 冻结包内的相对路径（`materials/04-current_selection.md` ⇐ 本报告 §2.2 的 `current_selection`；
`materials/03-convergence_outline.md` ⇐ `convergence_outline`）。

### F01 — severity: `major`

- **位置**：`materials/04-current_selection.md` L315
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：收敛检查 solution 行把「spec = 候选 D 信封（B 四拍主干 + C 分节轴 + A 开头）」列为已定方案，但 D-002 明确 spec 信息架构⑤「尚待用户对 R-G 推荐组合的确认，未确认前标『待复核』」，且 acceptance 通过条件㈠–㈩中没有一条要求完成该确认。E-1（三种文档形态设计）是本卡核心交付面，方向级方案在未确认状态下进入『已选方案』，step 11 approve-decision 可能在用户未确认 R-G 推荐组合的情况下将其绑定，fixture task（S3）与 spec 模板（S1）也会建在未定型结构上产生返工。
- **建议**：在收敛检查 solution 行的 spec 结构处加「待复核」标记，并在通过条件中新增一条：『R-G 推荐组合（候选 D 信封）获得用户确认并记录』，与 D-002 approval_binding 对齐后再进入 approve-decision。
- **evidence（provider 原文）**：04 L61「approval_binding：…spec 结构（⑤）尚待用户对 R-G 推荐组合的确认，未确认前标『待复核』」；L315「**已选方案**：…spec = 候选 D 信封（薄叙事主干 + 契约附件，主干按 B 四拍、分节轴用 C、开头用 A）」未带待复核标记；L316 通过条件㈠–㈩无 spec 结构确认项。
- **root_cause（provider 原文）**：D-002 的待复核标记没有传播到收敛检查表；收口时只回填了 D-002⑤ 的历史口径更正（候选 B 四拍），漏掉了尚未确认的⑤本身。

### F02 — severity: `major`

- **位置**：`materials/04-current_selection.md` L200
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-009 的 unresolved_items 承诺「OI-009 需重写为 K1–K12 → 现有技能映射 + 合并账 + 真正新建项的最小集（空集）」，owner=本卡 make-decision；但收敛大纲（问题与状态权威，D-002①）中 OI-009 仍写「8 条质量核心如何分布」，T-062 合并版（1461→2351 行）声明对「唯一 OI 大纲」逐字节保留、新增节清单中无 OI 大纲重写。方向面与大纲面就「8 条 vs K1–K12」直接矛盾，build-plan 读取大纲时可能按已作废的 8 技能口径执行质量核心分布。
- **建议**：在 make-decision 阶段完成 OI-009 重写（问题改为 K1–K12 口径），或在大纲中为 OI-009 追加指向 D-009 的 supersession 指针；不应把该重写留给下游阶段。
- **evidence（provider 原文）**：03 L65 OI-009 question「build-spec/build-plan 的 8 条质量核心如何分布，才不使 build-plan 过重？」；04 L196「K1–K12 与『8 条』的口径冲突…必须书面澄清（L-03 判定）」；L200「OI-009 需重写为…（owner=本卡 make-decision）」；L403「逐字节一致：…唯一 OI 大纲…」、L404 新增节清单无大纲重写。
- **root_cause（provider 原文）**：step 9 合并替换 decision-log 时执行了 append-only 保留，D-009 承诺的本卡内重写动作未被列入收口清单，导致承诺落空而大纲保持原样。

### F03 — severity: `major`

- **位置**：`materials/04-current_selection.md` L211
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-010 的『最小修复面』④㈤包含 R-7（取消 500 字回传上限）与 R-8（给审查者加只读字段），二者是 stage-handlers/审查输入投影层面的 make-decision 交互平台改动（facts 自证 stage-handlers.mjs:1021-1028），与 D-001『凡是改 make-decision 交互平台的一律交出去』及 D-010 ⑤ 自述『本卡只改校验器粒度 + 接线这一最小面』直接冲突。以『最小修复面』名义把平台面改动并入本卡，正是方向审查要拦的范围蔓延：它同时放大 R-35 越 CARD-07 写面与 R-37 撞车风险。
- **建议**：把④㈤（R-7/R-8）从本卡最小修复面剥离，登记为 CARD-07 承接项（与 SKILL 文本同归口）；本卡只保留㈠接线 + sourceItems 改取原始需求清点、㈡逐条 disposition + 强度对照两项，使『最小面』与 D-010 ⑤ 及 D-001 边界一致。
- **evidence（provider 原文）**：L211『④最小修复面（按投入产出排序）：…㈤放大器优先做 R-7（取消 500 字回传上限）与 R-8…；⑤本卡只改「校验器粒度 + 接线」这一最小面，不改 make-decision 的 SKILL 文本』；L38『凡是「改 make-decision 交互平台」「删文件」「做工具实测」的一律交出去』；L214『stage-handlers.mjs:1021-1028（审查输入为 questions-only 投影）』。
- **root_cause（provider 原文）**：根因报告按投入产出排序给了 5 条修复项，收口时未区分『根因对 R-1+R-2 的最小闭合』与『放大器优先项』，把平台级放大器写进了冠以『最小修复面』的同一列表。

### F04 — severity: `minor`

- **位置**：`materials/04-current_selection.md` L59
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-002 ① 决策正文仍写「ADR 风格决策块（≤15 行）」，facts 行亦引用「决策块 ≤15 行」规则；但同文件头部 T-047 执行结果与收敛检查 solution 行均已改为 16 行/块并把 R-E『≤15 行』降为非硬性目标。决策块是 D-002 的权威结论文本，残留的 15 行数字与现行 16 行口径冲突，且本文件已有「口径更正」先例（D-002⑤ 处）却未对此次偏差不一致处理。
- **建议**：按既有「口径更正」模式在 D-002① 的 ≤15 行处追加一句：『字段行数以 T-047 为准＝16 行/块，R-E ≤15 行为非硬性目标』，保持 append-only。
- **evidence（provider 原文）**：L59『①decision-log＝ADR 风格决策块（≤15 行）+ 保留唯一 OI 大纲…』；L62 facts『R-E 报告 ADR 节与「决策块 ≤15 行」规则』；对照 L6『每块字段行 16 行…R-E 的「≤15 行」为非硬性目标』与 L315『ADR 块（16 行/块，T-047）』。
- **root_cause（provider 原文）**：T-047 行数执行发生在 D-002 定稿之后，回填只落到文件头部说明与 solution 行，未同步改正 D-002 块内正文与 facts 的数字。

### F05 — severity: `minor`

- **位置**：`materials/04-current_selection.md` L39
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-001 ②登记 U-001 扩张并入项时写「E-1/E-3/E-5/E-6」，漏登 E-7（现有四份材料的问题定位：太长、啰嗦、详略失当、缺验收标准与测试流程）；收敛检查 target 行与 U-001 分解表均含 E-7。范围登记口径不一致，下游按 D-001 核对并入面时会漏掉 E-7 的问题定位输入。
- **建议**：在 D-001②的并入清单中补上 E-7（或显式注明 E-7 作为问题定位输入已含于病灶调查 I-A），使范围登记与 U-001 分解表、target 行一致。
- **evidence（provider 原文）**：L39『②U-001 扩张（E-1/E-3/E-5/E-6）并入本卡并如实登记』；对照 01-raw_requirement.md L50「E-7 现有四份材料的问题（太长、啰嗦、重点简写、详略失当、缺验收标准与测试流程）」与 04 L313 target 行『E-7 现有四材料病灶』。
- **root_cause（provider 原文）**：D-001 照抄了 U-002 关系说明中的『E-1/E-3/E-5/E-6 超出母 PRD』一句，未对照 U-001 分解表把 E-7 一并列入。

### F06 — severity: `major`

- **位置**：`materials/03-convergence_outline.md`（未提供行号）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：17 个 OI 全部仍为 open，但 current selection 宣称 T-001..T-047 已全覆盖，并把 spec 结构称为终稿；D-002 又注明该结构待用户确认。没有逐 OI 的处置状态、确认绑定和 owner，无法区分候选、已选与延期内容。
- **建议**：在进入 build-plan 前，为每个 OI 登记 selected/deferred/rejected/accepted_omission、D/来源指针、owner 和用户确认状态；未确认 OI 不得成为模板或验收的硬依赖。
- **evidence（provider 原文）**：outline 的 17 个 entries 均为 status=open；current_selection 同时写明 T-001..T-047 无遗漏、spec 模板为终稿，且 D-002 的 approval_binding 仍为待用户确认。
- **root_cause（provider 原文）**：用 T 项覆盖计数替代 OI 的生命周期与确认状态。

### F07 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-006/S3 用本卡自造的 fixture task 代替 CARD-02 AC-07/AC-08 要求的真实实施 task 和多 phase task，真实外部抽验又被延期到 CARD-10；S1-S6 也没有验证低能力 build-code/verify-code 模型能否据此交付高质量代码。核心方向可以通过静态模板检查，却仍未验证真实下游使用。
- **建议**：fixture 只能用于 RED/GREEN 检查，不能满足 AC-07/AC-08；将首个真实采用新格式的实施 task、多 phase 抽验及一次代表性的目标模型执行设为明确验收依赖，或明确当前阶段不能宣称这些目标已满足。
- **evidence（provider 原文）**：D-006 明写“卡内造一个最小真实样例（fixture task）”，并把真实多 phase task 外部抽验列为延期项；原始 CARD-02 要求抽查真实实施 task。
- **root_cause（provider 原文）**：用自生成的结构性代理证据替代真实下游产物和结果验证。

### F08 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：spec 模板把同一验收事实同时放在 A 面第 5 节的四段式验收判据和契约附件 A 的“验收判据（四段式）”列，未指定唯一权威或生成关系，直接制造了 FR-06 所禁止的双写。失效条件只描述发现重复后的补救，没有防止模板本身产生重复。
- **建议**：指定附件 A 或主干之一为验收判据唯一权威，另一处只保留场景说明或稳定指针；补充生成、回读和重复检测规则。
- **evidence（provider 原文）**：A 面第 5 节要求四段式验收判据，附件 A 同样要求验收判据（四段式）；模板失效条件又承认两处同事实会形成双写。
- **root_cause（provider 原文）**：两个阅读视图被设计成两份契约，而不是一份契约加指针。

### F09 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-008 的轨 2 只有四类事实的人工抽样，却恢复了“0 处两个文件对同一事实各自声明权威”的全局度量。抽样没有总体、覆盖范围或抽样规则，不能证明 AC-06 要求的逐事实核对和全局为零。
- **建议**：提供可穷举的事实清单并逐项分配唯一权威，或明确缩小度量范围并改写 AC-06；抽样只能作为风险发现，不能作为全局零重复的证明。
- **evidence（provider 原文）**：D-008 定义轨 1 为 ID 唯一性、轨 2 为“人工核对 + 抽样”，同时仍宣称度量为 0 处重复；CARD-02 AC-06 要求逐事实核对。
- **root_cause（provider 原文）**：用未定义覆盖范围的抽样检查承接了穷举式验收目标。

### F10 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：phase 方向只明确 L0/L1/L2、写集和依赖，未把 AC-08 要求的边界、自身验收和对全局目标的引用写入 phase 契约；S1/S3 也没有检查这些字段。下游 phase 文档因此可能形式上合规但缺少关键执行信息。
- **建议**：将 phase 模板和验收明确为：本包差异、边界、依赖、自身四段式验收、全局目标稳定指针及紧凑索引，并逐项检查。
- **evidence（provider 原文）**：D-002 的 phase 决定仅列本包差异、L0/L1/L2、写集和依赖；原始 AC-08 还要求边界、自身验收和全局目标引用。
- **root_cause（provider 原文）**：把 L0/L1/L2 层级标签误当成完整的 phase 信息架构。

### F11 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：方向承认 316 个需求单元只是 U-002-14 下的下界、不是完备清单，却把 S5 的 316/316/39 闭合当作覆盖验收。没有发现或收束“等等等等”所代表的未列需求的机制，因此仍可在未知需求被遗漏时通过。
- **建议**：扩大清点直到用户明确输入边界，或把 316 仅定义为已知范围并将“无遗漏”标为待用户确认的外部前置条件；不得把下界闭合称为完整覆盖。
- **evidence（provider 原文）**：收敛检查明确写“316 是下界，不是完备集”，但 acceptance 又要求覆盖矩阵按 316/316/39 闭合；U-002-14 明确声明清单不完备。
- **root_cause（provider 原文）**：已知下界被当作完整分母。

### F12 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-009 以 28→13 步、26 项机制和“语义丢失 0”证明 K1–K12 被保留，但每个 K 的具体承接者和语义映射被延期到 build-plan，当前 acceptance 也没有逐条核验 K1–K12。聚合计数无法阻止合并时静默丢失质量核心。
- **建议**：在方向验收中加入 K1–K12 逐条映射：现有 consumer、保留/改变的语义、测试或 oracle、owner 和删除条件；聚合账只能作为摘要。
- **evidence（provider 原文）**：D-009 声称 K1–K12 全保留且语义丢失为 0，同时把逐条承接者列为 build-plan 未决项；现有 acceptance 未要求逐条映射。
- **root_cause（provider 原文）**：把流程数量守恒当作质量语义守恒。

### F13 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-010 把 runtime/stage 覆盖校验粒度修复和 make-decision approve 接线纳入本卡，尽管同节记录母 PRD 将 make-decision 实现归 CARD-07；当前只有登记风险并交 CARD-10 核对，没有冻结的单一写 owner 或接口。实现时可能形成 CARD-02/CARD-07 双重控制面。
- **建议**：将运行时实现移交 CARD-07，本卡只交付契约；或先取得明确的边界变更并冻结唯一 owner、接口和冲突处理规则，再纳入本卡。
- **evidence（provider 原文）**：D-010 将两项 runtime/stage 改动称为本卡的“最小越界面”，同时列出 CARD-07 负责 make-decision 实现及 R-35/R-37/R-38 冲突。
- **root_cause（provider 原文）**：用风险登记替代跨卡写面和控制权的实际裁决。

### F14 — severity: `minor`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-004 禁止任何硬或软的长度数值目标，但 D-002 仍规定 ADR 块≤15 行，T-047 又把最终字段行数定为 16 行；生成者无法判断哪一条是现行规范。
- **建议**：明确废止 ≤15 与 16 行中的非规范表述，或记录一个经过确认的兼容例外并给出唯一验收口径。
- **evidence（provider 原文）**：D-004 写明不设任何长度数值目标；D-002 写 ADR 块≤15 行；收口说明又写每块为 16 行。
- **root_cause（provider 原文）**：旧的长度目标和新的解析器兼容约束没有完成 supersession。

### F15 — severity: `major`

- **位置**：`materials/04-current_selection.md` L27
- **provider / role**：`kimi/coding` / `blue`（providers=["kimi/coding"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：The T 覆盖核对表's 主块小计 row claims '14 块，42 条唯一主块归属；算术闭合 6+10+1+2+1+4+6+3+1+1+3+3+1+1 = 42', but the fourteen per-block counts actually sum to 43, and T-026 is listed in both the D-002 and D-011 rows. The '两处非一一对应' note (line 33) discloses only T-013/T-004/T-043/T-031/T-036, so the table presents 43 row entries as 42 unique 主块归属, breaking the coverage arithmetic that the convergence claim ('T-001..T-043 共 43 条全部被覆盖，无遗漏') and acceptance S5/㈥ (覆盖矩阵加总闭合、零孤儿) depend on.
- **建议**：Recompute the 主块小计: either remove T-026 from one of the D-002/D-011 rows or explicitly mark it as a cross-face pointer and add it to the '非一一对应' disclosure, so the table's 42/43/47 totals reconcile; apply the same correction to the identical '6+10+...+1 = 42' equation repeated in the 收敛检查 solution row (line 315).
- **evidence（provider 原文）**：Line 27 reads '主块小计 | 14 块，42 条唯一主块归属；算术闭合 6+10+1+2+1+4+6+3+1+1+3+3+1+1 = 42', but summing the row counts (lines 13-26: 6,10,1,2,1,4,6,3,1,1,3,3,1,1) yields 43; T-026 appears in the D-002 row (line 14) and again in the D-011 row (line 23), while the line-33 note lists only T-004/T-043/T-031/T-036 as cross-block appearances.
- **root_cause（provider 原文）**：The coverage table was edited (T-026 appearing in both D-002 and D-011 rows) without re-verifying the arithmetic, and the 'unique主块归属' note was not updated to cover this third non-one-to-one case.

### F16 — severity: `major`

- **位置**：`materials/03-convergence_outline.md` L10
- **provider / role**：`kimi/coding` / `blue`（providers=["kimi/coding"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：Every one of the 17 outline entries (OI-001 through OI-017) still carries "status": "open", and no entry references the D block that resolves it. This contradicts materials/04-current_selection.md, which presents D-001..D-014 as decided and the 收敛检查 as filled (e.g., D-002 states 'OI-007「未收敛」由本块第 ⑤ 项收敛'). Since D-002 designates the OI 大纲 as the '问题与状态权威' with OI-ID ↔ ADR 块 cross-referencing (R-13), an all-open outline means the claimed bidirectional traceability is not realized and the status authority records nothing as resolved at convergence time.
- **建议**：Before approve-decision, update each OI's status in the outline (resolved, citing its resolving D block; or deferred per D-014 ④) and add the D-block pointer per entry, so the OI↔ADR bidirectional check and the convergence claim are actually verifiable from the outline.
- **evidence（provider 原文）**：All 17 entries in materials/03-convergence_outline.md end with "status": "open" (lines 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 94, 101, 108, 115, 122) and none contains a reference to a D-### block, while materials/04-current_selection.md line 59 records decisions resolving these OIs and line 313's 收敛检查 claims convergence.
- **root_cause（provider 原文）**：The outline snapshot was never updated after the D-001..D-014 blocks were written; status maintenance for the OI 大纲 was not included in the 收口 steps (T-060/T-061/T-062 register other fixes but not OI status回填).

### F17 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：方向没有区分开放 OI、揭示后的候选方案和用户确认后的绑定决策；同时也没有明确 current_selection 在 reconstruct 阶段必须隐藏。下游可能把待确认方案当成既定契约，导致 challenge 被锚定或跳过。
- **建议**：为每个 OI/决策增加明确生命周期状态；规定 reconstruct 不得读取或展示 current_selection，reveal 才首次展示，challenge 必须记录变更并完成确认；build-plan 只消费已确认项。
- **evidence（provider 原文）**：03-convergence_outline.md 将 OI-001 至 OI-017 全部标为 open；04-current_selection.md 又宣称 T-001..T-043 全部覆盖并写成“已选方案”，但 D-002 的 spec 结构、D-012 的 14 条偏离和 7 条 C 类、D-014 的实质变化仍待用户确认。
- **root_cause（provider 原文）**：候选方案与批准后的方向被合并进同一份“决定/收敛”材料，缺少状态和可见性不变量。

### F18 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：S5 要求 316/316/39 精确闭合并据此支撑无遗漏，但方向自身承认 316 只是下界，且 U-002-14 明确用户清单不完备。未知需求仍可存在时，精确闭合会产生虚假的完整性结论。
- **建议**：先定义有限的需求语料边界和结束条件；在边界未获确认前，将未知项标为开放风险，不得用 316/316/39 宣称无遗漏。
- **evidence（provider 原文）**：D-014 的 target 写明 316 是下界而非完备集；同一材料的 acceptance 又把“覆盖矩阵三层各自加总闭合（316 / 316 / 39）”列为通过条件。
- **root_cause（provider 原文）**：把非穷尽需求清点当成了完整覆盖的有限 oracle。

### F19 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：方向用卡内生成的 fixture task 作为 AC-07/AC-08 的“真实实施 task”样例，并把真实多 phase task 延期到首个新格式 task；合成 fixture 只能验证模板形状，不能证明真实 build-plan/build-code 使用效果。
- **建议**：保留 fixture 作为模板 smoke test，但不要用它关闭 AC-07/AC-08；将首个真实多 phase task 的抽验作为明确的未完成验收项，绑定触发条件、责任人和完成状态。
- **evidence（provider 原文）**：D-006 明确“卡内造一个最小真实样例（fixture task）”并以其作为 AC-07/AC-08 抽取对象，同时把真实多 phase task 的外部抽验延期到首个新格式 task。
- **root_cause（provider 原文）**：为降低当前验收成本，把合成样例与原始要求的真实实施证据混为一谈。

### F20 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：用户扩张明确覆盖 decision-log、spec、phase 三种文档，但验收 S1 只列 spec 模板、phase 模板和紧凑索引；没有 decision-log 模板、fixture 或结构验收，因此三种文档的方向并未完整落地。
- **建议**：增加 decision-log 的结构交付物和独立验收，至少核对 ADR 块、OI 状态、三级追溯、原始需求锚点及 append-only 规则；或明确把 decision-log 移出本卡并取得用户确认。
- **evidence（provider 原文）**：D-002 定义了 decision-log 的 ADR/OI/追溯结构，但 acceptance 的 S1 仅列“spec 模板、phase 模板、紧凑索引模板”。
- **root_cause（provider 原文）**：验收设计偏向实现文档，遗漏了扩张范围中同等重要的决策文档。

### F21 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：D-008 选择了“机器 ID 唯一性 + 四类事实人工抽样”的双轨判据，但验收只要求工具 RED/GREEN 运行和 S2/S3 的独立核对，没有要求四类事实的人工抽样记录。机器通过仍可能漏掉不同措辞对同一事实的双权威声明。
- **建议**：增加独立人工抽样验收：四类事实各有样本、权威文件、核对结论和证据记录；缺少该记录时不得宣称 AC-06/FR-06 已满足。
- **evidence（provider 原文）**：D-008 要求对产品目标、完整用户流程、跨任务需求、总体成功/失败与验收进行人工抽样；S2/S4 的 acceptance 只覆盖工具运行及 S2/S3 结论。
- **root_cause（provider 原文）**：定义了双轨 oracle，却只把机器通路接入了验收条件。

### F22 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：D-010 把 runtime/stage 覆盖校验器粒度修复和 make-decision approve 接线纳入本卡方向，但 D-001 又把 make-decision SKILL、交互平台和扩散机制交给 CARD-07，且 D-010 自身列出 CARD-07 写面冲突和实现撞车风险。没有单一 owner 或冻结接口，build-code 会面对竞争写面。
- **建议**：将运行时修复移交 CARD-07，或在本卡方向中先确定唯一 owner、接口、提交边界和 CARD-10 核对条件；未解决前不要把该代码面列为本卡交付。
- **evidence（provider 原文）**：D-001 将 make-decision 平台改造交出；D-010 又将校验器接线列为本卡最小越界面，并明确登记 R-35/R-37/R-38。
- **root_cause（provider 原文）**：文档方向、覆盖校验实现和 make-decision 平台边界没有被拆成可独立交付的责任面。

### F23 — severity: `minor`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：方向取消所有长度目标并放弃中文可读性度量，但九条语义判据主要检查冗余、权威和引用，不能判定“好阅读”或详略得当。文档即使结构合规、仍然可能过长、啰嗦或难以扫描。
- **建议**：增加不依赖字数的人工可读性 rubric，例如读者能否从主干直接定位问题、取舍、约束和验收，以及是否需要跨附件重建结论，并用 fixture 实际评审。
- **evidence（provider 原文）**：D-004 规定不设任何长度数值目标；D-014 将无障碍/中文可读性度量列为未采用；现有 acceptance 没有替代性的读者验收。
- **root_cause（provider 原文）**：把“不能用长度配额”错误地等同于“不需要可读性验收”。

### F24 — severity: `major`

- **位置**：`materials/04-current_selection.md`（未提供行号）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：D-007 将 finding 处置设为默认 advisory、禁止同 scope 复审，并允许 needs_human 状态，但验收没有要求所有 finding 在交付前变为 fixed 或带理由的 rejected，也没有未决 owner/期限条件；这可能在不阻断的名义下保留未处理问题。
- **建议**：保留 advisory 语义，但要求 packet 逐条记录 fixed、rejected-with-reason 或 needs_human 的 owner/期限；未分配的 needs_human 不得进入阶段完成或下游 handoff。
- **evidence（provider 原文）**：D-007 同时规定 finding 默认 advisory、单次审查和三态处置，但其 acceptance 没有对应的逐 finding 收口判据。
- **root_cause（provider 原文）**：将“不自动阻断”与“不必完成处置”混淆，缺少审查结果的收口条件。

## 6. 主题归纳（仅分类，不做质量裁决）

| # | 主题 | 涉及 finding | 条数 |
| --- | --- | --- | --- |
| 主题 1 | **收敛产物内部一致性**：OI 状态与"已收敛"宣称不符、T 覆盖核对表算术（42 vs 43、T-026 双列）、≤15 行 vs 16 行口径残留、U-001 并入项漏登 E-7、OI-009 的"8 条"与 K1–K12 口径冲突 | F02、F04、F05、F06、F14、F15、F16、F17 | 8 |
| 主题 2 | **"已选方案"与"待用户确认"边界**：R-G 推荐组合尚未经用户确认却进入"已选方案"与"终稿"表述，approve-decision 可能提前绑定 | F01、F17 | 2 |
| 主题 3 | **范围 / 写面越界与跨卡双控制面**：本卡纳入 make-decision 交互平台与 runtime/stage 实现面，与 CARD-07 写面重叠且无唯一 owner/冻结接口 | F03、F13、F22 | 3 |
| 主题 4 | **验收充分性**：以卡内 fixture 代替真实 task 关闭 AC-07/AC-08、人工抽样代替逐事实核对、316 下界当完备覆盖、decision-log 形态未纳入验收、spec 模板自身的验收判据双写、phase 契约字段缺失 | F07、F08、F09、F10、F11、F18、F19、F20、F21 | 9 |
| 主题 5 | **质量核心保留与 finding 处置的可核对性**：K1–K12 只有聚合计数无逐条映射；finding 处置缺 owner/期限与终态要求；取消长度目标后无替代可读性判据 | F12、F23、F24 | 3 |

合计 8+2+3+9+3 = **24**（含 F17 同时落在主题 1 与主题 2，故按主题计数会相加为 25 项次；按 finding 去重为 24 条）。

### 6.1 与材料形态相关的事实说明（非质量裁决）

方向上，以下几点是**送审材料形态**导致的可观察现象，记录供主会话判断，本报告不据此判定 finding 真假：

- `convergence_outline` 按契约投影为 `status: "open"`，因此 F06 / F16（以及 F17 的一部分）的"17 个 OI 全部仍为 open"是对**契约要求的投影**的观察，而非对 decision-log 原文状态的观察（原文 17 条均为 `status: "confirmed"` 且已回填 `selected_disposition`）。
- `approved_direction` 内容按契约改挂 `current_selection` 后，进入了 broker-owned `direction-review.v1` flow 的 reveal 阶段；provider 看到的即 `materials/04-current_selection.md`（22/24 条 finding 的锚点文件）。
- 尝试 A 未派出任何 provider，因此**本次没有任何 provider 看到过含答案的 OI 原文**。

## 7. 本次审查未提供的部分（不编造）

- `antigravity/flash` **未提供任何语义建议**（两次请求均 `AUTHENTICATION_FAILED`）。
- 尝试 A **未提供任何语义建议**（命令失败，无 findings）。
- `usage` 字段 6 条均为 `null`；`runtime_id` 顶层为 `null`；`authoritative = false`（bare sink 是诊断落点，不是正式 writer）。
- 无任何 provider 给出 `blocking` 级 finding；这不等于"没有问题"。

## 8. 边界声明

- 本报告只写本文件；**未修改** `decision-log.md`、`prd.md` 或任何被审材料。
- 未对 findings 做质量裁决、未处置 findings、未把结果写成 pass/审批；`available-with-failures` 与 `REVIEW_NO_SEMANTIC_RESULT` 均按原样保留。
- 未运行任何全量测试；本次只做一次真实审查调用。
- 材料载荷（`/tmp/wh-review-attemptA.json`、`/tmp/wh-review-attemptB.json`）与源快照哈希已在上文登记，可据行范围与 sha256 逐字节复现。
