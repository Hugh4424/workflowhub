# detail-advice 审查报告（make-decision / step 10）

> 本报告由审查执行子代理按「如实记录、绝不伪造」要求撰写。所有 `status` / `material_id` / `runtime_id` / provider 身份 /
> transport outcome / findings / 错误码均为 `wh-review-cli.mjs run` 的**真实返回**，未做任何改写、升格或降格。
> 本报告**不做质量裁决**，只记录事实与主题归纳。

- **任务**：`workflowhub-thin-core-card-02-20260919`
- **阶段 / 轨道**：`make-decision` / `detail`（step 10 detail-advice，advice-only，**不是 pass 门**）
- **宿主声明**：`host_provider="dsh"`（当前宿主为 DeepSeek Harness；`dsh` 是 3rd-review 支持的**宿主身份**， 只用于同源排除与 provenance，本身不是 reviewer）
- **执行时间**：2026-09-20（本地）；`node skills/wh-review/scripts/wh-review-cli.mjs doctor` → `{"status":"ok",...}`
- **路由**：`~/.config/workflowhub/config.json` → `wh_review.stages["make-decision"].detail.initial = [kimi/coding, antigravity/flash, codex/luna]`，`minimum_heterologous = 1`，`mode = single_round`
- **paired 形态**：detail 无 `pair_id`/`role` 时 runner 走 paired 路径，red / blue 各发一次 broker group request（合计两次 public request，3 provider × 2 role = 6 个 provider attempt）
- **命令退出码**：`EXIT=0`（`/tmp/wh-card02-detail/exit.txt`）；`stderr` 为 **0 字节**（无输出）
- **真实顶层 status**：**`available-with-failures`**（partial；一个合法语义 sibling 已返回 → aggregate = available），`outcome = "partial"`，`dispatch_state = "dispatched"`，`reused = false`，`authoritative = false`

## 1. 调用命令（原样）

按 SKILL 与本任务指定的形式（heredoc）：

```bash
cd /Users/Hugh/Hugh/Project/workflowhub
node skills/wh-review/scripts/wh-review-cli.mjs run <<'JSON'
{"stage":"make-decision","review_track":"detail","host_provider":"<当前宿主 provider>","materials":{...}}
JSON
```

因 `materials` 达 19.3 万字节，heredoc 会被 shell 转义/长度破坏，改用 **CLI 自身支持的 argv[3] 文件入口**
（`wh-review-cli.mjs` → `readFileSync(process.argv[3] ?? 0, "utf8")`，见 `main()`）。**实际执行的命令原样为**：

```bash
cd /Users/Hugh/Hugh/Project/workflowhub && node skills/wh-review/scripts/wh-review-cli.mjs run < /tmp/wh-card02-detail/request.json > /tmp/wh-card02-detail/result.json 2> /tmp/wh-card02-detail/stderr.txt
```

请求载荷（真实字节，可复核）：

| 项 | 值 |
| --- | --- |
| 载荷文件 | `/tmp/wh-card02-detail/request.json`（由 `/tmp/wh-card02-detail/build-materials.mjs` 生成） |
| 载荷字节 | 193566 |
| 载荷 sha256 | `61ca9302a5b8bceb6398e1935892d97ce7001ceccaaf04fbd28a56c9017b2641` |
| 返回文件 | `/tmp/wh-card02-detail/result.json` |
| 返回字节 | 74444 |
| 返回 sha256 | `06436ecc91923c9d24a22d115f55b8507001bb848bd6e95be80cf54c67a742ba` |
| stage / review_track / host_provider | `make-decision` / `detail` / `dsh` |

**调用次数**：**1 次**。本次审查**没有重试、没有第二次调用**（首次即返回 `available-with-failures` 语义结果，不满足 SKILL「retry only when the previous call returned no semantic advice」的放宽条件）。

## 2. 材料 key 的合法性核对结果

### 2.1 allowlist 事实（`runtime/review/stage-materials.json`）

`stages["make-decision"].tracks.detail`（第 78–86 行，逐字）：

```json
"detail": {
  "source_bundle": "none",
  "required": ["raw_requirement", "approved_direction", "draft_spec_or_acceptance", "review_instructions"],
  "optional": ["context_map", "evidence_map"],
  "generated": ["review_instructions"],
  "forbidden": [],
  "v2_required_maps": []
}
```

`runtime/review/review-policy.mjs` 的 `reviewRuleFor("make-decision","detail")` 返回的即为该 rule；
`review-materials.mjs` 的 `materialAllowlistForRule(rule, { includeGenerated: false })` 派生：

| 集合 | 实际 key |
| --- | --- |
| **required（caller 必须提供）** | `raw_requirement`、`approved_direction`、`draft_spec_or_acceptance` |
| **generated（runner 生成，caller 不得提供）** | `review_instructions` |
| **optional** | `context_map`、`evidence_map` |
| **forbidden** | 无（空数组） |
| **legal（= required + optional，去 generated）** | `approved_direction`、`context_map`、`draft_spec_or_acceptance`、`evidence_map`、`raw_requirement` |

### 2.2 本次实际使用的 key

| 实际使用的 key | 是否在 detail allowlist 内 | 判定 |
| --- | --- | --- |
| `raw_requirement` | 是（required） | **合法** |
| `approved_direction` | 是（required） | **合法** |
| `draft_spec_or_acceptance` | 是（required） | **合法** |
| `stage` / `review_track` / `host_provider` | 非 materials 字段，属请求顶层字段 | 合法 |

**结论：本次没有使用任何非法 key。** 未发送 `review_instructions`（generated）、未发送 `context_map`/`evidence_map`（optional，未使用）、未发送任何 unknown key。
校验路径佐证：`simple-review-runner.mjs` 的静态 preflight（L782–796）以
`!allowlist.known.includes(key)` 判 unknown、以 `forbidden.has(key)` 判 forbidden；本次三键均为 known 且 non-empty。
API 亦确认 **整个过程为 single-shot：`exit=0`、`stderr` 0 字节、无 `MATERIAL_FORBIDDEN`/`MATERIAL_INCOMPLETE` 返回**。

### 2.3 任务指定的 key 与合法 key 的映射（含「没有合法 key 承载」的处置）

任务清单中 `### T 决策三档回填`、`## 覆盖矩阵`+`## 收敛检查`、`## 方向审查 findings 处置表`、
`## 独立方向审查（step 6）与 Talk round 3 处置`、`## Grill（step 8）`、`## spec 模板结构（终稿）`、
`### 承接与不承接清单`、`## 覆盖核查的补登记（T-060 / T-061）` 均**不是合法 key 名**（是文档节名）。
按任务指示「改挂最接近的合法 key，并在报告中写明映射」，映射如下（**未改写一个字节**）：

| 合法 key | 承载内容（逐字行切片） | 映射理由 |
| --- | --- | --- |
| `raw_requirement` | prd `### CARD-02` 整节（L264–292）+ decision-log `### U-001` 整节（L70–89）+ `### U-002` 整节（L90–126） | 任务指定的原始需求全文；`### U-001`/`### U-002` 是用户口述原始需求的逐字记录 |
| `approved_direction` | `## 决定`（L155–481，D-001..D-014）+ `### 承接与不承接清单`（L2341–2359）+ `## 独立方向审查（step 6）与 Talk round 3 处置`（L2477–2567，T-063..T-068）+ `## 方向审查 findings 处置表（F01..F24）`（L2568–2608）+ `## Grill（step 8）`（L2751–2781，T-070..T-073） | detail 契约要求「已批准方向，包括可读 decision log 与 grill 文档判断」；这五节正是「已批准方向 + grill 判断 + step 6 处置」 |
| `draft_spec_or_acceptance` | `## 覆盖矩阵`（L919–1147）+ `## 收敛检查`（L1148–1168）+ `### T 决策三档回填（GAP-4）`（L1169–1231）+ `## spec 模板结构（终稿）`（L2131–2198）+ `## 覆盖核查的补登记（T-060 / T-061）`（L2430–2464） | detail 契约要求「待审规格或验收草案」；这五节承载覆盖矩阵/收敛检查/三档回填/spec 模板终稿/补登记，是本次送审的规格-验收草案面 |

### 2.4 必须如实登记的契约张力（不掩盖）

`skills/wh-review/contracts/make-decision.md`（detail 节）明文：

> `approved_direction` 必须逐字匹配当前 Workspace 的 `decision-log.md`，并带当前 material revision；
> 不匹配时报告 `identity`/`freshness`，不得静默替换成摘要或旧结果。

**本次实测事实**：`approved_direction` 是 decision-log.md 的**节级逐字切片**（L155–481 + L2341–2359 + L2477–2567 + L2568–2608 + L2751–2781），
**不等于** decision-log.md 全文（2781 行 / 362477 字节）。
造成该张力的客观约束有二：

1. 任务明确禁止改写或压缩，并要求把 9 个文档节全部送入；而合法 key 只有 3 个可承载正文。
2. 全文送入在物理上不可行：decision-log.md 单文件 362477 字节
   > `review-input-bounds.mjs` 的 `TASK_BOUND_PROVIDER_INPUT_MAX_BYTES` = 307200 字节上限；且 `raw_requirement` 与 `draft_spec_or_acceptance` 亦为必需材料。

**本次运行的执行路径说明（重要，不把结论泛化）**：本次走的是 SKILL 文档化的
`wh-review-cli.mjs run` → `runReviewRecovery` → `runBareReview`（bare/diagnostic sink）路径；
`validateDetailReviewInput()`（即逐字匹配 + material revision 的强制校验）**只在 `review-runner.mjs` 的正式 run 路径被调用**
（全仓 only 一处生产 caller），bare 路径**不调用**它。因此：
本报告的 `available-with-failures` 是 **bare CLI 路径的真实结果**；它**不构成**对「正式 run 路径在同一材料下会通过」的证明。
正式 run 路径在同一材料下极可能因 `identity approved_direction must match current decision-log.md bytes` 与
`freshness current material revision is unavailable or invalid` 两条判 `MATERIAL_INCOMPLETE`。此点留给主会话处置，本报告不代裁。

## 3. 送审材料清单（含截断说明）

**源材料快照（抽取时刻哈希，可复核，未修改被审文件）**

| 源文件 | 字节 | 行数 | sha256 |
| --- | --- | --- | --- |
| `/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` | 121223 | 672 | `f05577c30a74931f11bfea3b11d37fbf4bec602a49a92bf9bb7eb12761a9e8f9` |
| `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-02-20260919/specs/workflowhub-thin-core-card-02-20260919/decision-log.md` | 362477 | 2781 | `85c1a4b20cb074ca093847fe8ffd39ffb27bdb46c3e75b7cc7235d28827504e3` |

**逐节抽取清单（逐字行切片；除节标题分隔标签 `# ===== … =====` 外未插入任何自有文字）**

| 送入 key | 节 | 来源行范围 | 字节 | sha256 |
| --- | --- | --- | --- | --- |
| `raw_requirement` | prd `### CARD-02 文档权威与单一事实源` 整节 | prd.md L264–292 | 5190 | 见 §3.4 |
| `raw_requirement` | `### U-001` 整节 | dl L70–89 | 2679 | 见 §3.4 |
| `raw_requirement` | `### U-002` 整节 | dl L90–126 | 3211 | 见 §3.4 |
| `approved_direction` | `## 决定`（D-001..D-014） | dl L155–481 | 83866 | 见 §3.4 |
| `approved_direction` | `### 承接与不承接清单` | dl L2341–2359 | 6602 | 见 §3.4 |
| `approved_direction` | `## 独立方向审查（step 6）与 Talk round 3 处置`（T-063..T-068） | dl L2477–2567 | 11209 | 见 §3.4 |
| `approved_direction` | `## 方向审查 findings 处置表（F01..F24）` | dl L2568–2608 | 6429 | 见 §3.4 |
| `approved_direction` | `## Grill（step 8）`（T-070..T-073） | dl L2751–2781（EOF） | 3010 | 见 §3.4 |
| `draft_spec_or_acceptance` | `## 覆盖矩阵` | dl L919–1147 | 26580 | 见 §3.4 |
| `draft_spec_or_acceptance` | `## 收敛检查` | dl L1148–1168 | 16658 | 见 §3.4 |
| `draft_spec_or_acceptance` | `### T 决策三档回填（GAP-4）` | dl L1169–1231 | 15358 | 见 §3.4 |
| `draft_spec_or_acceptance` | `## spec 模板结构（终稿）` | dl L2131–2198 | 6119 | 见 §3.4 |
| `draft_spec_or_acceptance` | `## 覆盖核查的补登记（T-060 / T-061）` | dl L2430–2464 | 4105 | 见 §3.4 |

### 3.4 三个合法 key 的聚合字节与 sha256（逐字原文）

| 合法 key | 字节 | 行数 | sha256 |
| --- | --- | --- | --- |
| `raw_requirement` | 11365 | 91 | `3094ecbf7088667b551185a11a240e15ebceaefce65aada5faf2a52337a5627b` |
| `approved_direction` | 111615 | 518 | `5a34bb8022ede176d763d7634c9c2dbe0284d2d7ecdfadc8d5a219be69b0b793` |
| `draft_spec_or_acceptance` | 69377 | 425 | `e38cbf724880c35c009e55eae8fc588be0765e1fed13be5c20527569fdf86a96` |
| **合计** | **192357** | — | — |

### 3.5 截断说明

**本次审查没有截断任务点名的任何一节**：上表 13 个行切片全部为该节完整字节（含节标题到下一节标题前的全部内容）。
- 表内「字节」列是**切片正文本身**的字节数（不含 runner 材料内的 `# =====` 节标签与空行）；
  §3.4 的聚合值是**实际提交载荷**中该 key 的字节数 = 各切片之和 + 节标签与空行（`raw_requirement` +285、`approved_direction` +499、`draft_spec_or_acceptance` +557）；
  两处数字口径不同，故不能直接用表内字节相加去核对 §3.4 的聚合值。
- `### U-002` 取到 L126（该节末尾的 `---` 分隔线行），未含 L127 空行之后的内容。
- `approved_direction` 中 `## 独立方向审查（step 6）…` 与 `## 方向审查 findings 处置表` 取到 L2608（该节末尾分隔线），
  其后 L2609–2750 的 `## findings 处置的落实登记（append-only 增补）` **不在** `approved_direction` 内；
  `## Grill（step 8）` 单独取自 L2751–2781。**任务清单未点名 L2609–2750，因此不属于「截断」，属「未点名」**，如实列出以免歧义。
- 未被任何合法 key 承载的内容：`## 唯一 OI 大纲`（L482–918）、`## Talk 记录`（L1232–1541）、
  `## 原始声明`（L1542–1674）、`## 需求保真`（L1675–1808）、`## 决策追加 T-027..T-058`（L1809–2130）、
  `## Talk round 2`（L2199–2429）、`## 本次修复的自检`（L2678–2750）。任务清单未点名这些节；本次**未送入**。
- `review_instructions` 由 runner 生成（generated），**不在** 提交载荷内。

## 4. 真实返回全文字段

```
status                 = available-with-failures
stage                  = make-decision
review_track           = detail
review_scope           = null
review_kind            = null
pair_id                = 64088140-91aa-4684-95ef-b6c89d9399f8
material_id            = 485dbda12ae5fde7bbcc34edd80760099444b18d9c347ed9f89c04a56805bbce
material_ids           = {"red":"485dbda12ae5fde7bbcc34edd80760099444b18d9c347ed9f89c04a56805bbce","blue":"485dbda12ae5fde7bbcc34edd80760099444b18d9c347ed9f89c04a56805bbce"}
material_consistency   = consistent
runtime_id             = null
outcome                = partial
pair_status            = partial
red_incomplete         = true
blue_incomplete        = true
dispatch_state         = dispatched
reused                 = false
authoritative          = false
sink_ref               = /Users/Hugh/.workflowhub/review-sink/d9e12768057a2aadc7b73f08a5f3770d640d02c0c0238cdff0a0751d6a7e7b44.json
error                  = {"code":"REVIEW_NO_SEMANTIC_RESULT","message":"neither paired review produced a semantic result"}
findings.length        = 25
provider_results.length= 6
```

**必须同时原样保留的内部不一致（不调和、不取舍）**：顶层 `error.code = REVIEW_NO_SEMANTIC_RESULT` /
`message = "neither paired review produced a semantic result"`，且 `red_incomplete = true`、`blue_incomplete = true`；
但同一次返回中 `role_results.red.status` 与 `role_results.blue.status` **均为 `available`**、`outcome = "partial"`，
且各带 findings。顶层 `status` 为 `available-with-failures`。
这与 direction 轨道当时的同型现象一致（顶层兜底标签 vs role 级真实语义结果）。本报告**两个字段都原样记录**，不代系统调和。

> **材料身份**：`material_id = 485dbda12ae5fde7bbcc34edd80760099444b18d9c347ed9f89c04a56805bbce`，
> red / blue 两次 request 的 `material_ids` 完全一致（`material_consistency = "consistent"`）。
> 该 id 由 runner 对本次提交的 materials 冻结包计算，**不是** 我构造的值。
> **`runtime_id`（顶层）为 `null`**；role 级 `runtime_id`：red = `9a80d602-38ac-4db1-9656-11b0fa83de7a`，
> blue = `8220cd9e-111c-4045-bc67-173db952469a`（**原样记录，未伪造**）。

## 5. provider_results（provider 身份 + transport outcome）

| provider | role | transport status | error | identity（adapter / model） | config_id | duration_ms | session_id | evidence_anchor_valid | process_outcome | parse_outcome |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `kimi/coding` | red | **completed** | — | kimi / `kimi-for-coding/kimi-for-coding` | `715d4c1363f6ba7d…` | 1081841 | session_0bc92029-87b9-4931-a6a9-f05e46bd144b | `[true,true,true,true,true,true,true,true,true]` (9) | ok | ok
| `antigravity/flash` | red | **failed** | `AUTHENTICATION_FAILED`: provider process exited with 1 | antigravity / `gemini-3.8-flash-high` | `5ba41c80161607da…` | 18162 | — | —（未返回） | exit_nonzero | —
| `codex/luna` | red | **completed** | — | codex / `gpt-5.6-luna` | `417b73e72fba3691…` | 574820 | 01a0bf32-96f8-7d92-8867-d08f528fa44c | `[true,true,true,true,true]` (5) | ok | ok
| `kimi/coding` | blue | **completed** | — | kimi / `kimi-for-coding/kimi-for-coding` | `715d4c1363f6ba7d…` | 515961 | session_d9810fd8-ef6c-47d4-931e-583d927802df | `[true,true,true]` (3) | ok | ok
| `antigravity/flash` | blue | **failed** | `AUTHENTICATION_FAILED`: provider process exited with 1 | antigravity / `gemini-3.8-flash-high` | `5ba41c80161607da…` | 16422 | — | —（未返回） | exit_nonzero | —
| `codex/luna` | blue | **completed** | — | codex / `gpt-5.6-luna` | `417b73e72fba3691…` | 897857 | 01a0bf32-9709-7450-a136-c8795a89a538 | `[true,true,true,true,true,true,true,true]` (8) | ok | ok

- 异源下限 `minimum_heterologous = 1` 由 `kimi/coding`（kimi-for-coding）与 `codex/luna`（gpt-5.6-luna）满足；二者均与宿主 `dsh` 异源。
- `antigravity/flash`（gemini-3.8-flash-high）在 **red 与 blue 两次 request 中均失败**，原码为
  `AUTHENTICATION_FAILED` / `provider process exited with 1`（duration ≈ 18.2s / 16.4s，
  `process_outcome = "exit_nonzero"`、`parse_outcome = null`）。
  **此失败按原码原样记录，未重标为 `REVIEW_PROVIDER_UNAVAILABLE` 或任何其它类别，也未据此把整次审查标成 unavailable**
  （一个合法语义 sibling 即保持 aggregate `available-with-failures`）。
- red / blue 的 `provider_attempts` 均为 3（= 3 provider 各一次）；`kimi/coding` red 侧 `execution.retry.count = 1`
  （provider 内部重试 1 次，`recovery.fresh_execution_retry_count = 0`），其余为 0。

### 5.1 role_results 汇总

| role | status | outcome | findings | runtime_id | providers |
| --- | --- | --- | --- | --- | --- |
| red | `available` | `partial` | 14 | `9a80d602-38ac-4db1-9656-11b0fa83de7a` | `kimi/coding`=completed、`antigravity/flash`=failed、`codex/luna`=completed |
| blue | `available` | `partial` | 11 | `8220cd9e-111c-4045-bc67-173db952469a` | `kimi/coding`=completed、`antigravity/flash`=failed、`codex/luna`=completed |

### 5.2 evidence_anchor_valid（原样记录，未把 unknown 改成 true）

`evidence_anchor_valid` 是 **per-provider 的逐条 boolean 数组**（**不是** per-finding 字段；
本次返回的 25 条 finding **本身都不带** `evidence_anchor_valid` 字段）：

| provider | role | 数组 | 长度 | 与 finding 数的对应 |
| --- | --- | --- | --- | --- |
| `kimi/coding` | red | `[true,true,true,true,true,true,true,true,true]` | 9 | 与 kimi/coding red 的 9 条 finding 一致 |
| `codex/luna` | red | `[true,true,true,true,true]` | 5 | 与 codex/luna red 的 5 条 finding 一致 |
| `kimi/coding` | blue | `[true,true,true]` | 3 | 与 kimi/coding blue 的 3 条 finding 一致 |
| `codex/luna` | blue | `[true,true,true,true,true,true,true,true]` | 8 | 与 codex/luna blue 的 8 条 finding 一致 |
| `antigravity/flash` | red / blue | **未返回**（provider failed，无 finding） | — | — |

**必须同时记录的限定**：本次返回的 25 个布尔值全部为 `true`，但**其中 13 条 finding 没有 `line` 字段**
（`line: undefined`，见 §6 逐条的「位置」行；12 条带行号）。
即：codex/luna 的 13 个 `true` 是在 **无行号锚点** 的情况下返回的，**不能**据此宣称这 13 条的行级锚点已被验证。
本报告**不把任何 unknown 写成 true，也不把 true 升格为「锚点已验证」**。

## 6. findings 全文（逐条，无改写）

**真实计数**：共 **25** 条。
severity 分布：**major 17 / minor 7 / blocking 1**。
按 provider：`kimi/coding` 12 / `codex/luna` 13。按 role：`red` 14 / `blue` 11。`evidence_kind`：`direct` 24 / `inferred` 1。
带 `line` 锚点 12 条 / 无 `line` 锚点 13 条。
材料路径为 runner 冻结包内的相对路径：`materials/02-approved_direction.md`（12 条）
⇐ 本报告 §2.3 的 `approved_direction`；`materials/03-draft_spec_or_acceptance.md`（13 条）
⇐ `draft_spec_or_acceptance`；**没有 finding 落在 `materials/01-raw_requirement.md`**。

### F01 — severity: `major`

- **位置**：`materials/02-approved_direction.md` L190
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-008① defines the stable-ID namespace for the track-1 「无重复契约」 check as `U-### / R-### / RS-### / OI-### / D-### / FR-### / AC-### / PH-###`, but the IDs actually used across the coverage matrix and every D-block `requirement_ids` field are `REQ-*` (REQ-A..REQ-R groups, REQ-x-nn units); `REQ-*`, `T-###` (T-001..T-073), `V-###` (derived_from anchors), and `L-##/X-##/F##` are all absent from the list, while `R-###` collides with the risk register (R-1..R-84) and the PRD traceability rows (R-018..R-020). Implemented as written, the track-1 checker would not cover the requirement IDs it exists to police and would conflate risk IDs with requirement definitions — the same-form collision GAP-9 items 6/8 explicitly require to be annotated.
- **建议**：Append an correction to D-008① registering REQ-*, T-*, V-*, L-*, X-*, F* in the namespace list and splitting requirement `R-###` from risk `R-##` (or renaming the risk prefix); implement track 1 in build-code against the revised list, and align D-002①'s traceability chain (原始需求（R-###）) with the REQ-* form.
- **evidence（provider 原文）**：D-008① (line 190) lists only `U-### / R-### / RS-### / OI-### / D-### / FR-### / AC-### / PH-###`, yet the coverage matrix 主表 uses REQ-A..REQ-R (materials/03 lines 70-88), D-block requirement_ids cite REQ-D-01 etc. (e.g., line 55), derived_from cites V-## (e.g., line 56), risks cite R-1..R-84 (e.g., line 50), and D-002① (line 64) still defines the chain as 原始需求（R-###）.
- **root_cause（provider 原文）**：The namespace list was drafted before the REQ-full-inventory numbering (REQ-*) and the T/V/L/X/F registers existed and was never updated when the coverage matrix and derived_from fields adopted them; GAP-9's namespace-isolation rule was not written back into D-008①.

### F02 — severity: `major`

- **位置**：`materials/03-draft_spec_or_acceptance.md` L244
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：Acceptance scenario S6 (and the identical 承接与不承接清单 criterion for T-046) requires the fixed checker to recognize the four fields in 「card-01 与 card-02 全部现行 decision-log 的 14 个块」 — but card-01's log has only 10 blocks (D-001..D-010; 0/40 = 10 blocks × 4 fields), so the correct total is 24 blocks / 96 field checks. As written, the criterion can be satisfied by repairing only card-02's 14 blocks, which is exactly the card-02-only repair that R-55 declares behavior-inconsistent.
- **建议**：Correct the criterion (append-only) to 「card-01 的 10 块 + card-02 的 14 块（共 24 块 / 96 字段）均可识别 module/requirement_ids/derived_from/artifacts 四字段」 in both the acceptance S6 row and the 承接清单 T-046 row.
- **evidence（provider 原文）**：S6 (line 244) and the T-046 row (materials/02 line 345) both say 「card-01 与 card-02 全部现行 decision-log 的 14 个块」; materials/02 line 5 establishes card-01 = D-001..D-010 (10 blocks) and line 6 gives card-01 0/40 vs card-02 0/56.
- **root_cause（provider 原文）**：The block count was copied from card-02's single-file figure (14 blocks / 0-56) and card-01's 10 blocks were never added, despite R-55 requiring both sides to behave identically.

### F03 — severity: `major`

- **位置**：`materials/02-approved_direction.md` L346
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：The runtime/stage coverage-validator fix + wiring (T-031) is registered as a build-code deliverable whose row claims 「本阶段只登记需求与验收判据」, but the row lists only requirements ①–④ and no acceptance criteria; no acceptance scenario (S1–S8) or pass-condition (㈠–㈩) covers its behavior — S6 covers only the T-046 checker compatibility, and ㈨ merely checks that the registration exists. The deliverable therefore has no executable acceptance anywhere, violating the card's own rule that acceptance criteria must be in 条件→行为→可度量标准→失败场景 form.
- **建议**：Add explicit acceptance criteria for T-031 (e.g., the approve path fails for real when sourceItems is short; per-item disposition validation reports missing dispositions with a location list; RED must be caused by the target assertion), attach them to an acceptance scenario or the build-code acceptance section, and make the row's 「登记…验收判据」 claim match its content.
- **evidence（provider 原文）**：The runtime/stage row (line 346) enumerates 需求 ①②③④ and ends with 「不改 make-decision 的 SKILL 文本」 with no 验收判据, whereas the T-046 row (line 345) states 「验收判据：修复后同一检查器…四字段」; acceptance scenarios S1–S8 (materials/03 lines 244, 248-250, 422) and pass-conditions ㈠–㈩ (line 244, incl. ㈨ which only checks that T-046/T-031 are labeled in the 承接清单) contain no T-031 behavioral check.
- **root_cause（provider 原文）**：When T-046's stage discipline was extended to T-031, the registration copied the 「需求 + 验收判据」 formula from the T-046 row but only the requirement half was filled in; no S-scenario owner was assigned for the runtime/stage fix.

### F04 — severity: `major`

- **位置**：`materials/03-draft_spec_or_acceptance.md` L334
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：The 「spec 模板结构（终稿）」 A-face table still defines section 5 as containing 「四段式验收判据（G-07）+ 可执行命令」, while the F08 supplement appended in the same section states 主干第 5 节 「只留：场景说明 + 稳定指针…不再承载第二份四段式判据正文」 and designates 附件 A as the sole authority — yet F08 declares itself 「补（不取代）」. The same 终稿 section thus carries two contradictory definitions of section 5, the exact two-authorities-on-one-fact pattern F08 was created to eliminate; a build-plan consumer following the A-face table would manufacture the double-write.
- **建议**：Add an append-only correction to the A-face section-5 row (scenario narrative + stable pointers to 附件 A; keep 可执行命令 if intended), or state explicitly in the F08 block that the A-face row's 「四段式验收判据」 wording is superseded.
- **evidence（provider 原文）**：Line 334 (A-face row 5: 「场景化验收（含八态 G-02）+ 影响面与回归（G-06）+ 四段式验收判据（G-07）+ 可执行命令」) vs lines 363-365 (F08: 「附件 A 的「验收判据（四段式）」列 = 验收判据的唯一权威…主干第 5 节…不再承载第二份四段式判据正文」) under the header 「本节补（不取代）上方 A 面第 5 节…的表述」 (line 361).
- **root_cause（provider 原文）**：F08 was appended as a 「supplement, not supersession」 per append-only discipline, but its content substantively replaces the A-face row; no correction pointer was attached to the row itself.

### F05 — severity: `major`

- **位置**：`materials/03-draft_spec_or_acceptance.md` L244
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：Pass-condition ㈡ still reads 「S1 的三份模板文件存在且逐字段可核对」, but the F20 correction redefined S1 as four templates (spec / phase / 紧凑索引 / decision-log, the last with the five mandatory elements per T-059 deliverable 1). Acceptance executed against ㈡ would pass with the decision-log template missing, silently dropping the F20 fix.
- **建议**：Append a correction to ㈡: 「S1 的四份模板文件（decision-log / spec / phase / 紧凑索引）存在且逐字段可核对，decision-log 模板含 ADR 块 / OI 状态 / 三级追溯链 / 原始需求锚点 / append-only 规则五要素」.
- **evidence（provider 原文）**：通过条件㈡ (line 244) says 「S1 的三份模板文件」; the F20 更正行 (line 249) states 「S1 = 四份模板（decision-log / spec / phase / 紧凑索引）…与 T-059 交付物清单第 1 项一致」.
- **root_cause（provider 原文）**：The F20 correction updated the S1 scenario text but did not sync the corresponding pass-condition in the same acceptance row.

### F06 — severity: `minor`

- **位置**：`materials/02-approved_direction.md` L234
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：The D-010④ correction says the card's minimal fix surface 「只保留两项」 (㈠ wiring + sourceItems, ㈡ per-item disposition + strength check), but D-010④'s own items ㈢ (OI-row mandatory verbatim-quote/source fields, R-3/R-4) and ㈣ (completion-criteria supplement, R-6) were not stripped, and the 承接与不承接清单 registers all four ①–④ as build-code requirements. A build-code executor cannot tell whether ㈢㈣ are in scope.
- **建议**：Reword the correction (append-only) to state that ㈠㈡ constitute the minimal root-cause closure while ㈢㈣ remain in the same deliverable as supporting items — or explicitly delist ㈢㈣ from the 承接清单.
- **evidence（provider 原文）**：Line 234 (「本卡最小修复面只保留两项：㈠…㈡…」) vs line 232 (D-010④ still enumerates ㈢㈣) and line 346 （承接清单 requirements ③④ for R-3/R-4/R-6).
- **root_cause（provider 原文）**：The correction sentence was written to record the R-7/R-8 stripping and over-generalized 「只保留两项」 without reconciling the retained ㈢㈣.

### F07 — severity: `minor`

- **位置**：`materials/03-draft_spec_or_acceptance.md` L146
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：In 明细 B (X 张力表）, four rows' 处置档 labels contradict the disposition of the L-layer items they cite: X-04 → 「接受但有偏离（L-37）」 but L-37 is 拒绝→补回 (T-034); X-12 → 「接受但有偏离（L-36）」 but L-36 is 拒绝→补回 (T-037); X-20 → 「拒绝 → 补回（L-22）」 but L-22 is 接受但有偏离； X-21 → 「接受但有偏离（L-19）」 but L-19 is 拒绝 (B-2). The preamble says the column marks the L/decision-layer disposition, so these labels misstate the very table they reference.
- **建议**：Correct the four 处置档 cells (append-only) to match 明细 A, or annotate each with the compound label actually used there (e.g., 拒绝 → 补回）.
- **evidence（provider 原文）**：Lines 146 (X-04), 154 (X-12), 162 (X-20), 163 (X-21) vs 明细 A rows L-19 (line 114, 拒绝 → 登记排除理由）, L-22 (line 117, 接受但有偏离）, L-36 (line 131, 拒绝 → 补回）, L-37 (line 132, 拒绝 → 补回）, and the preamble at line 139 (「处置档」列只标注该张力在 L 层/决策层已被处置时的档位）.
- **root_cause（provider 原文）**：The X table was filled from the tension-resolution direction rather than by copying the cited L items' registered dispositions; no cross-check against 明细 A was recorded.

### F08 — severity: `minor`

- **位置**：`materials/02-approved_direction.md` L273
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-012② states the 11 A-class items 「直接补回、无需用户逐条确认（仍记录为「接受」）」, but the authoritative backfill records all 11 as 「拒绝 → 补回」 and the coverage matrix layer-3 counts them inside 拒绝 25 (0/14/25 = 39). If D-012's parenthetical were operative the layer-3 distribution would be 11/14/14; as written, two sections of the same log disagree on the disposition label of the same 11 items.
- **建议**：Append a correction to D-012② replacing 「（仍记录为「接受」）」 with the registered compound label 「拒绝 → 补回（A 类补回清单）」, consistent with 明细 A and the layer-3 count.
- **evidence（provider 原文）**：Line 273 (「A 应补回 11 条…（仍记录为「接受」）」) vs 明细 A rows L-09..L-15, L-18, L-24, L-25, L-38 all marked 「拒绝 → 补回」 (materials/03 lines 104-110, 113, 119-120, 133) and layer-3 count 「拒绝 25 = L-06..L-16（11）+ L-18..L-20（3）+ L-23..L-27（5）+ L-33..L-38（6）」 (materials/03 lines 36, 135).
- **root_cause（provider 原文）**：D-012 was written before the GAP-4 backfill adopted the 「拒绝 → 补回」 compound label, and the parenthetical was never reconciled with the matrix it feeds.

### F09 — severity: `minor`

- **位置**：`materials/03-draft_spec_or_acceptance.md` L243
- **provider / role**：`kimi/coding` / `red`（providers=["kimi/coding"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：The 收敛检查 solution row's open-item disposition ㈢ still lists 「spec 结构定稿（R-G 推荐组合的用户确认）→ owner＝make-decision 主会话」 as open, but the F01/T-048 correction closed that item (confirmed as the 定稿基础， 「不再标「待复核」」), and the F01 fix was applied to D-002 only. The convergence record thus contradicts the decision block on whether any spec-structure confirmation is still pending.
- **建议**：Append a correction to the solution row's open-item ㈢ marking it closed per T-048/F01, or register the sync in the F01 落点.
- **evidence（provider 原文）**：Line 243 open-item 「㈢spec 结构定稿（R-G 推荐组合的用户确认）→ owner＝make-decision 主会话」 vs materials/02 lines 70 and 78 (F01 更正： 「确认状态 = confirmed，不再标「待复核」…该项已关闭」).
- **root_cause（provider 原文）**：The F01 correction updated D-002's approval_binding and unresolved_items but did not sync the 收敛检查 solution row that enumerates the same open item.

### F10 — severity: `blocking`

- **位置**：`materials/02-approved_direction.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：下游没有唯一的“已确认当前状态”。D-012仍将14条偏离项和C类7项交由用户裁决，但其他段落、旧T条目和验收文本同时把相关方案写成已定稿。
- **建议**：增加独立的当前状态投影，逐项标记confirmed、pending、superseded或deferred及owner/触发条件；build-plan只消费confirmed项，完成用户裁决前不得交接。
- **evidence（provider 原文）**：D-012的approval_binding仍为“待用户真实裁决”；D-002更正称spec结构已confirmed，但T-009和收敛检查的open-item仍称待确认；F07/F19更正称fixture不能关闭AC-07/08，而T-041及旧S3仍称其可作真实抽取证据。
- **root_cause（provider 原文）**：append-only历史、审批状态和下游交付状态混在同一日志中，没有强制的当前状态层。

### F11 — severity: `major`

- **位置**：`materials/02-approved_direction.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：方向只在D-014的说明文字中提到“重建目标→揭示方案→逐条挑战”，没有规定重建阶段必须隐藏当前选择，也没有定义揭示转移、挑战顺序或泄漏选择时的失败条件。
- **建议**：在方向层增加唯一的交互状态契约和验收：reconstruct阶段不得包含final_option，只有reveal后显示当前选择，随后才能challenge；禁止直接进入同意/批准路径。
- **evidence（provider 原文）**：D-014只给出流程短语；03材料的S1-S8验收覆盖模板、工具、覆盖率和映射，没有任何reconstruct/reveal/challenge或当前选择可见性的检查。
- **root_cause（provider 原文）**：完整用户流被记录成取舍理由，而不是可执行、可失败的状态与转移契约。

### F12 — severity: `major`

- **位置**：`materials/02-approved_direction.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：D-008把原始FR-06/AC-06要求的全量“0处双权威声明”降成已知事实清单上的人工抽样，并明确承认全局零重复不可证明；这不能满足原始单一事实源验收。
- **建议**：要么建立覆盖所有当前产品事实的穷举清单与检查，要么把该降级明确登记为待用户确认的偏离、owner和触发条件；不能把抽样结果称为原AC-06/FR-06已满足。
- **evidence（provider 原文）**：01材料的FR-06/AC-06要求逐事实核对并达到0处双权威；D-008更正将度量限定为“已知事实清单内”，并写明人工抽样不能证明全局零重复；03材料的覆盖验收也只称已知范围闭合。
- **root_cause（provider 原文）**：将未知需求的范围限制错误地套用于权威归属检查，以抽样替代全量事实覆盖。

### F13 — severity: `major`

- **位置**：`materials/03-draft_spec_or_acceptance.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：验收引用了未随提交材料提供的证据：S8要求K1-K12逐条映射且12/12字段齐全，T-064又声称17条OI已逐条回填，但提交内容只有这些表的引用和汇总，没有映射行或OI状态/来源表。detail不能自行补写这些OI答案。
- **建议**：把K1-K12映射和17条OI的逐条状态、source、resolved_by/owner、触发条件直接纳入提交材料；否则将S8和OI闭合标为未完成并保留明确延期项。
- **evidence（provider 原文）**：03材料的S8更正要求映射表并规定12/12通过，但正文没有该表；02材料的T-064只声称“17条逐条回填”，提交内容未包含对应17行。
- **root_cause（provider 原文）**：验收把外部或未提交的产物当作已存在证据，只验证“有引用”而没有可回读的证据面。

### F14 — severity: `major`

- **位置**：`materials/02-approved_direction.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `red`（providers=["codex/luna"]，roles=["red"]）
- **evidence_kind**：`direct`
- **问题**：方向重新引入了原始CARD-02明确禁止的revision绑定：D-004要求记录CARD-01的具体commit以判定漂移。文档没有说明该commit只是不可引用的临时执行证据。
- **建议**：改用纯文本路径、语义锚点和冻结事实记录；若必须记录commit，明确其不进入文档引用、不可作为内容寻址绑定，并增加禁止revision/hash引用的验收。
- **evidence（provider 原文）**：01材料规定文档间引用不得使用revision或内容寻址哈希；02材料D-004却要求记录CARD-01的具体commit使漂移可判定。
- **root_cause（provider 原文）**：接口协调的可判定性需求未与单一事实源的无revision/hash约束对齐。

### F15 — severity: `major`

- **位置**：`materials/02-approved_direction.md` L345
- **provider / role**：`kimi/coding` / `blue`（providers=["kimi/coding"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：T-046 的验收判据写「修复后同一检查器对 card-01 与 card-02 全部现行 decision-log 的 14 个块均可识别四字段」，但同文件行预算声明已登记 card-01 只有 D-001..D-010 共 10 块（0/40 = 10 块 × 4 字段），card-02 才有 14 块（0/56）；两文件合计应为 24 块。按字面 card-01 的 10 块无法满足「14 个块」，该验收判据不可判定，且无任何口径更正行登记此数。
- **建议**：将该验收判据改为「card-01 的 10 个块与 card-02 的 14 个块（合计 24 块）均可识别四字段」，并在 03 材料收敛检查 acceptance S6 的同一表述同步追加更正行。
- **evidence（provider 原文）**：02 L345「对 card-01 与 card-02 全部现行 decision-log 的 14 个块均可识别」vs 02 L5「card-01 `### D-001`..`### D-010` 的 16 个字段」与「card-01 亦 0/40」；同一错误复述于 03 L244 acceptance S6。
- **root_cause（provider 原文）**：验收判据从 card-02 侧的块数（14）直接复制到覆盖两文件的判据句中，未核对 card-01 的实际块数（10）。

### F16 — severity: `minor`

- **位置**：`materials/03-draft_spec_or_acceptance.md` L163
- **provider / role**：`kimi/coding` / `blue`（providers=["kimi/coding"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：明细 B X-21 行（「上下文控制 ↔ 需求全量清点完整到达」）的处置档标注「接受但有偏离（L-19）」，但 L-19 在明细 A 中为 B 类拒绝→登记排除理由（V-22 U-009/FR-11/FR-12 五阶段派子代理，归 CARD-03），与 X-21 张力的语义无关；该张力实际承接决策为 D-013+D-012，对应的偏离项应为 L-30（最小读取集，接受但有偏离）。此误标会把读者导航到无关的排除条目。
- **建议**：将 X-21 行的「（L-19）」更正为「（L-30）」，或按 GAP-9 的修正表惯例追加一行勘误登记。
- **evidence（provider 原文）**：03 L163 X-21「`接受但有偏离`（L-19）」vs 03 L114 L-19「B 类 B-2…`拒绝` → 登记排除理由」及 03 L125 L-30「母 PRD CARD-02 最小读取集 | D-004 + D-012 | `接受但有偏离`」。
- **root_cause（provider 原文）**：X 表处置档列的 L 编号引用笔误（L-19 与 L-30 混用），复核时未与明细 A 的档位对照。

### F17 — severity: `minor`

- **位置**：`materials/02-approved_direction.md` L311
- **provider / role**：`kimi/coding` / `blue`（providers=["kimi/coding"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：D-014① 的实质变化枚举仍为「U-001 的 E-1/E-3/E-5/E-6 属实质变化」，但 D-001② 经 F05 口径更正后并入清单已补 E-7（现有四材料病灶定位），收敛检查 target 行同样含 E-7；两处官方枚举不一致，且 D-014① 无更正行说明 E-7 是否属实质变化、其前后承诺展示是否已覆盖，CARD-10 核对实质变化程序完整性时无法判定 E-7 状态。
- **建议**：对 D-014① 追加口径更正行：明确 E-7 是否计入实质变化清单；若计入，补登记其前后承诺展示已完成（或说明 E-7 仅为问题定位、不构成实质变化的理由）。
- **evidence（provider 原文）**：02 L44（F05 更正）「并入清单为 E-1 / E-3 / E-5 / E-6 / E-7」与 03 L241 target 行含「E-7 现有四材料病灶」，vs 02 L311 D-014①「E-1/E-3/E-5/E-6 属实质变化」无对应更正。
- **root_cause（provider 原文）**：F05 更正只同步了 D-001② 与收敛检查 target 行，遗漏了同样枚举 U-001 清单的 D-014①。

### F18 — severity: `major`

- **位置**：`materials/03-draft_spec_or_acceptance.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：The zero-orphan acceptance is not proven at individual-requirement granularity: the material states that the per-316-unit disposition table does not exist, provides only 18 group aggregates, and identifies all 89 first-layer rejections as unowned.
- **建议**：Add a per-REQ stable-ID ledger with source, disposition, strength comparison, owner or explicit exclusion reason, and count reconciliation. Until then, mark S5 incomplete and do not claim zero-orphan closure.
- **evidence（provider 原文）**：The material says the per-unit table is absent, the 18-row group table is the available evidence, explicit exclusions are 0, all 89 rejected units are 「无主拒绝」, yet concludes 「没有任何一个需求单元被排除在三档之外」.
- **root_cause（provider 原文）**：Aggregate counts were promoted to an individual coverage oracle.

### F19 — severity: `major`

- **位置**：`materials/02-approved_direction.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：The direction weakens FR-06/AC-06 from global single-authority verification to the known-facts list, explicitly admitting that global zero-duplication is unprovable, but does not register AC-06 as incomplete with an owner and trigger.
- **建议**：Either provide an exhaustive authority check or explicitly defer AC-06/FR-06 with owner, trigger, evidence requirements, and a prohibition on claiming completion from known-list sampling.
- **evidence（provider 原文）**：D-008 limits the metric to the known fact list and states 「全局零重复不在本卡可证范围内，不得宣称」, while the raw requirement requires 0 duplicate authoritative declarations across product facts.
- **root_cause（provider 原文）**：A scope limitation was recorded as a caveat instead of as a deferred acceptance item.

### F20 — severity: `major`

- **位置**：`materials/03-draft_spec_or_acceptance.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：The append-only corrections leave conflicting active states. D-002 is corrected to confirmed, while T-009 and the open-item list still say spec structure confirmation is pending; D-006/T-070 make the fixture smoke-only, while T-041 and the original S3 criterion still treat it as AC-07/AC-08 evidence.
- **建议**：Create one current-state index with explicit supersession links and update every active acceptance/open-item entry. Make the latest status authoritative for build-plan and completion decisions.
- **evidence（provider 原文）**：The submitted direction simultaneously contains 「confirmed，不再标『待复核』」 and 「用户对…确认仍未取得」, plus both 「不得用它关闭 AC-07/AC-08」 and a fixture criterion that says it can be extracted for AC-07/AC-08.
- **root_cause（provider 原文）**：Append-only corrections lack a transitive reconciliation mechanism for dependent tables and acceptance criteria.

### F21 — severity: `major`

- **位置**：`materials/03-draft_spec_or_acceptance.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：The required concision/readability outcome is not connected to an executable acceptance. U-002 requires concise, readable, complete documents and F23 calls for a human readability rubric, but S1-S8 contains no rubric result, reviewer record, threshold, or failure condition; the corrected fixture is only a template smoke test.
- **建议**：Add a dedicated human-review acceptance using the stated rubric, a named fixture, independent reviewer evidence, and explicit failure conditions, or mark the attribute deferred with owner and trigger.
- **evidence（provider 原文）**：D-004/F23 requires a non-length-based readability rubric and fixture review, while the draft acceptance enumerates structural, tool, coverage, and mapping checks without a readability check.
- **root_cause（provider 原文）**：The readability requirement was added to design prose but not wired into the acceptance surface.

### F22 — severity: `minor`

- **位置**：`materials/03-draft_spec_or_acceptance.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：The spec template imposes a 「≤5 行」 header limit despite D-004 explicitly rejecting all hard or soft numeric length targets.
- **建议**：Remove the numeric cap, or clearly define it as a non-binding example that cannot affect acceptance or delivery.
- **evidence（provider 原文）**：D-004 says 「不设任何长度数值目标（硬或软）」, while the template header requires a paragraph of 「≤5 行」.
- **root_cause（provider 原文）**：A stale numeric formatting constraint remained after the no-length-target decision.

### F23 — severity: `major`

- **位置**：`materials/03-draft_spec_or_acceptance.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`inferred`
- **问题**：The required make-decision interaction invariant is only mentioned as prose and is not enforced by the acceptance: no criterion verifies one reconstruct → reveal → challenge flow or that the current selection remains hidden until reveal.
- **建议**：Add a direction-level state/transition contract and acceptance for reconstruct, reveal, and challenge, including the hidden-selection boundary; keep detailed OI content downstream of that direction.
- **evidence（provider 原文）**：D-014 names 「重建目标 → 揭示当前已选方案 → 逐条挑战」, but the submitted S1-S8 acceptance contains no visibility state, transition, or hidden-until-reveal check.
- **root_cause（provider 原文）**：The interaction invariant was recorded as a rationale sentence rather than as an executable flow contract.

### F24 — severity: `major`

- **位置**：`materials/02-approved_direction.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：E-2 external research is not auditable from the submitted materials. The direction relies on R-A/R-D/R-E/R-F/R-G and quantitative claims, but the manifest contains none of those research artifacts, URLs, or primary-source excerpts.
- **建议**：Include the research sources or direct primary citations and map each research-dependent decision to them; otherwise mark E-2 and dependent decisions as unverified.
- **evidence（provider 原文）**：The raw requirement explicitly adds external SDD-framework research, while the direction cites research identifiers and statistics without submitting their contents or direct citations.
- **root_cause（provider 原文）**：Opaque research labels were used as evidence instead of portable, reviewable research inputs.

### F25 — severity: `major`

- **位置**：`materials/03-draft_spec_or_acceptance.md`（无 `line` 字段）
- **provider / role**：`codex/luna` / `blue`（providers=["codex/luna"]，roles=["blue"]）
- **evidence_kind**：`direct`
- **问题**：S8 can pass without demonstrating preservation of the build-spec/build-plan quality core: it requires 12/12 K mappings with five non-empty fields, but does not test semantic equivalence, actual consumer behavior, or the claimed zero semantic loss.
- **建议**：Require each K item to show the retained/changed behavior, real consumer, executable oracle, owner, and deletion condition, with independent verification of semantic preservation.
- **evidence（provider 原文）**：D-009 claims 「语义丢失 0」, while S8's stated pass condition is only that 12 mappings exist and five fields are non-empty.
- **root_cause（provider 原文）**：Field presence was substituted for behavioral and semantic verification of the quality-core mapping.

## 7. 主题归纳（仅分类，不做质量裁决）

以下只按 finding 的**问题对象**归类（**每一条 finding 只归一个主主题**，按其主要对象判定；25 条全部归入且不重复，
故各主题条数之和 = **25**，可逐项核算）；**不含任何通过/不通过、严重性裁决或处置建议**。

| # | 主题 | 条数 | 主归类 finding | 事实描述（provider 原文口径） |
| --- | --- | --- | --- | --- |
| 1 | **「当前状态」不唯一 / append-only 更正未传播到依赖表** | 6 | F04、F05、F09、F10、F17、F20 | 同一事实在多节同时存在已确认与待确认、或旧口径与更正后口径并存：A 面第 5 节 vs F08 补（F04）；通过条件㈡ 三份模板 vs F20 四份（F05）；收敛检查 open-item ㈢ vs F01/T-048 已关闭（F09）；D-012 待裁决 vs 其它段落写成已定稿（F10）；D-014① E-7 枚举未同步（F17）；D-002 vs T-009、D-006/T-070 vs T-041/S3（F20） |
| 2 | **验收判据不可执行 / 缺少可失败检查** | 5 | F03、F12、F18、F21、F25 | T-031 无验收判据（F03）；AC-06/FR-06 降级未登记延期（F12）；S5 零孤儿以聚合账代逐单元账（F18）；可读性无验收（F21）；S8 只查字段存在（F25） |
| 3 | **ID / 计数 / 档位口径不一致（簿记与算术）** | 7 | F01、F02、F06、F07、F08、F15、F16 | D-008① 命名空间清单缺 REQ-/T-/V-/L-/X-/F- 且 `R-###` 与风险 `R-##` 撞形（F01）；S6「14 个块」漏算 card-01 10 块（F02）；D-010④「只保留两项」与 ㈢㈣ 并存（F06）；明细 B 四行处置档与明细 A 矛盾（F07）；D-012② 标签与三档回填矛盾（F08）；T-046 同一「14 个块」表述（F15）；X-21 引用 L-19 应为 L-30（F16） |
| 4 | **审查输入可审计性（证据未随材料送入）** | 2 | F13、F24 | K1–K12 映射表与 17 条 OI 逐条状态未在送审材料内（F13）；E-2 外部调研 R-A/R-D/R-E/R-F/R-G 无来源或引文（F24） |
| 5 | **方向层交互流程未成契约** | 2 | F11、F23 | 「重建→揭示→挑战」只作为散文出现，无隐藏当前选择的状态/转移/可见性验收（F11 为 red、F23 为 blue 的同一对象） |
| 6 | **与母 PRD 原文边界的对齐（scope / 约束）** | 2 | F14、F19 | D-004 要求记录 CARD-01 具体 commit，与「文档间引用不用 revision/内容寻址哈希」的原文约束存在张力（F14）；FR-06/AC-06 范围被收窄到已知事实清单（F19） |
| 7 | **模板内残留的数值长度约束** | 1 | F22 | spec 模板头部仍写「≤5 行」，而 D-004 明确不设任何长度数值目标 |

**归类计数核对**：6 + 5 + 7 + 2 + 2 + 2 + 1 = **25** ✅ 与 findings 总数一致（无未归类、无重复归类）。

### 7.1 与材料形态相关的事实说明（非质量裁决）

- 本次 `antigravity/flash` 双 role 全失败，**该 provider 未提供任何语义建议**；有效语义建议来自
  `kimi/coding`（12 条）与 `codex/luna`（13 条），两者为异源 sibling，满足 `minimum_heterologous = 1`。
- 全部 25 条 finding 落在 `approved_direction` 与 `draft_spec_or_acceptance` 两个 key 的投影上；
  `raw_requirement` 无 finding —— 这是**本次提交形态下的返回分布事实**，不构成对任何一节的质量判断。
- `codex/luna` 的 13 条 finding **全部不带行号锚点**（`line: undefined`），其「位置」只能到文件级；
  `kimi/coding` 的 12 条全部带行号（L146/L163/L190/L234/L243/L244×2/L273/L311/L334/L345/L346）。

## 8. 真实性声明

1. 本报告全部数据来自 **1 次真实调用**：`node skills/wh-review/scripts/wh-review-cli.mjs run < request.json`，
   `exit = 0`，`stderr` 0 字节，返回 `/tmp/wh-card02-detail/result.json`（sha256 `06436ecc91923c9d24a22d115f55b8507001bb848bd6e95be80cf54c67a742ba`）。
2. **未伪造** `material_id`、`runtime_id`、`pair_id`、provider 身份、transport outcome、findings、证据锚点。
3. **未重标**任何失败类别：`antigravity/flash` 的失败原样保留为 `AUTHENTICATION_FAILED`；
   顶层 `REVIEW_NO_SEMANTIC_RESULT` 与 `available-with-failures` 同时原样保留。
4. **未把 unknown 改成 true**：§5.2 的 `evidence_anchor_valid` 与 `line: undefined` 事实同时记录。
5. **未修改** `decision-log.md`、`prd.md` 或任何被审文件；本报告是本次唯一的写入产物。
6. 本报告**不做质量裁决**，不含 pass/fail 结论；`available-with-failures` 是 transport/语义事实，不是通过。
7. `antigravity/flash` 失败的成因（凭证过期 vs 配置漂移）**不在本次审查范围内**，本报告不推断原因。

---

*附：CLI 原始返回 JSON（`result.json`，74444 字节）完整保存在 `/tmp/wh-card02-detail/result.json`；
本报告 §6 为其 `findings` 数组的逐条原文呈现，§4/§5 为其身份与 transport 字段的原文呈现。*
