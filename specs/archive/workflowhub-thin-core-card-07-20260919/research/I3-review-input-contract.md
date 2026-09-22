# I3 早审/方向审查送审包契约与可用性

**性质**：只读侦察报告。不是方向确认、不是阶段完成、不是质量通过。
**代码基准**：`/Users/Hugh/Hugh/Project/workflowhub`（主 checkout，含 CARD-07 的 `.git` 与 worktree 共享）。
**纪律**：未执行任何 `review` 命令；未向 task store 写入任何文件；本报告只写在 task worktree 的 `specs/<task>/research/` 下。
**口径**：全文区分「合同文本要求」与「代码实际行为」；`[未找到]` 表示穷尽搜索后无此物。

---

## 0. 结论速览（≤10 条）

1. **方向审查的必填材料是 4 把 key，不是文件**：`raw_requirement`、`objective_facts`、`convergence_outline`、`review_instructions`（最后一把由 runner 生成）——`runtime/review/stage-materials.json`（`stages."make-decision".tracks.direction.required`）；`review_instructions` 必须由 runner 渲染，调用方提交即 `MATERIAL_FORBIDDEN: review_instructions is runner-generated`——抛点 `skills/wh-review/scripts/simple-review-runner.mjs:898-903`，被 runner 的静态 preflight 拦成 `blocked_before_dispatch`：`:923-943`。
2. **`direction_flow` 是 `optional`，不是 `required`**（`runtime/review/stage-materials.json` direction.optional）。上游 S3 把它当作必填是**合同文本与配置矩阵的读法差异**：合同 `skills/wh-review/contracts/make-decision.md:54-57` 要求「每个 request 携带 broker-owned `direction-review.v1` flow」，但它不是送审材料 key 的必填项。
3. **历史故障的两个条件之一是「死」的**：broker 只在 `input.review_flow` 存在时才校验 `direction_flow.json`（`/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:576-584`），而生产链路上**没有任何调用方设置 `review_flow`**（唯一生产者 `planDirectionReviewRequests` 只被定义、只被测试调用，`skills/wh-review/scripts/review-runner.mjs:56`；全仓引用仅 `skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs:5-6`）→ **该 `MATERIAL_INCOMPLETE` 今天不会再触发**。
4. **路径条件已修**：`direction_flow` 现在被投递到 bundle 根的 `direction_flow.json`，而不是 `materials/09-direction_flow.json`——`runtime/review/provider-material-projection.mjs:53-54,74`（已核对实测输出）。
5. **`approved_direction` byte 逐字相等是 detail 轨道规则，不是 direction 轨道规则**（`contracts/make-decision.md:96-97`），而且**实现它的函数在生产路径上没有被调用**——`skills/wh-review/scripts/review-materials.mjs:385-420`（导出），全仓唯一调用点在 `skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs:63`。
6. **真正会在送审前硬失败的字节校验是 `material_id` 自检**：声明的 packet 身份 vs 实际写盘字节，不一致抛 `MATERIAL_IDENTITY_MISMATCH`（`simple-review-runner.mjs:512-527`）。
7. **包上限与四档字节限是两套东西**：真正作用于 direction 的是 `REVIEW_PACKET_MAX_DELIVERY_BYTES = 2 MiB`，且作用在**整包交付字节之和**（所有 provider 可见文件 + `manifest.json`），超限抛 `MATERIAL_TOO_LARGE`，**无裁剪、无分片、无降级**（`skills/wh-review/scripts/review-materials.mjs:53,2222-2229`；runner 路径 `simple-review-runner.mjs:499-504`）；而 300/150/160/96 KiB 四档（`runtime/review/review-input-bounds.mjs:3,6,8`）**只服务 verify-code**，唯一生产消费者 `compactVerifyCodeMaterials` 仅在 `stage === "verify-code"` 被调用（`simple-review-runner.mjs:635-638,1277-1280`）。历史方向审查请求原件仅 22136 B，余量极大。
8. **`AUTHENTICATION_FAILED` 没有确定性只读探测**：broker `doctor` 只跑 `--version` 之类的可执行探测，其自述 "doctor does not verify model authentication or a real review"（`/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:688,692`）；该错误码来自 provider 自身输出的正则分类（`lib/provider-failure.mjs:69`）。
9. **审查失败不是硬阻断**：`review --action=record` 把 provider 失败/路由失败/材料失败都**记录为 attempt 事实**并返回 `status: "recorded"`（`runtime/review/review-record-route.mjs:1316-1381`），进程退出码仍为 0（`tools/cli/stage-runtime.mjs:68-72`）；阶段侧把它当 `unavailable` 事实（`runtime/stage/stage-handlers.mjs:2694-2704`）。
10. **早审能跑通命令、但不能满足合同语义**：唯一的「当前选择」字段 `current_selection` 没有任何必填校验，但 runner 的默认 `directionMode="full"` 封死了 `alternatives` / `selection_rationale` / `key_assumptions` / `independent_reconstruction` 四把 key，且 CLI 无任何途径改这个 mode（`skills/wh-review/scripts/review-materials.mjs:1968,1996-2007`；`review-runner.mjs:43-49`）。详见第 9 节。

---

## 1. direction 审查送审材料清单（逐字）

### 1.1 合同文本（`skills/wh-review/contracts/make-decision.md`）

`## direction`（L33–58）：

- L35：必需材料只有：
- L37：原始用户需求。
- L38：已知客观事实、硬约束和明确的非目标。
- L39–40：当前 `convergence_outline` questions-only 投影：包含当前全部 OI ID、固定类别、原始问题/未知、来源、`task_id` 和 `outline_version`；为防止答案锚定，展示状态统一为 `open`。
- L50：`runner 必须从材料集合中排除这些内容，不能先交付再要求 provider 忽略。发现禁止材料时必须在调用 provider 前返回 MATERIAL_FORBIDDEN。`
- L54–55：`每个 request 携带 broker-owned direction-review.v1 flow`（**这是流程要求，不是材料 key 的 required 项**）。
- L42–48 禁止交付（逐字）：
  - 拟定方案、推荐方案或方案比较结论。
  - OI 的答案、`selected_disposition`、依据、结论、终态字段、确认分组或 `interaction_ref`/`interaction_hash`（这些属于 detail/approve-decision 消费者）。
  - decision log、detail 审查结果或已批准方向。
  - spec、plan、实现 diff、代码或测试结果。
- L89–90：`direction 是不含候选方案的盲审，不包含 simplicity-guard 或其他依赖候选方案的 lens`。

`## 共同材料`（L5–13）两个 track 都必须包含：`review-instructions.md`、原始用户需求、本 track 所需材料、与这些材料一致的 reviewer 技能文件、`manifest.json`（列出每个 provider 可见文件及其 byte size、SHA-256，并据此计算 `material_id`）。

### 1.2 代码实际行为（送审边界唯一权威：`runtime/review/stage-materials.json`）

`stages."make-decision".tracks.direction` 逐字：

| 项 | 值 |
|---|---|
| `source_bundle` | `"none"` |
| `required` | `["raw_requirement", "objective_facts", "convergence_outline", "review_instructions"]` |
| `optional` | `["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction", "direction_flow"]` |
| `generated` | `["review_instructions"]` |
| `forbidden` | `["proposed_solution", "decision_log", "spec", "plan", "changes_diff", "changed_files"]` |
| `minimum_reviewers` | `1` |
| `v2_required_maps` | `[]` |

对照 `detail` 轨道（同文件）：`required = ["raw_requirement", "approved_direction", "draft_spec_or_acceptance", "review_instructions"]`，`optional = ["context_map", "evidence_map"]`，`forbidden = []`。

**必填项（4 把 key）**：`raw_requirement`、`objective_facts`、`convergence_outline` 由调用方提交；`review_instructions` 由 runner 生成，调用方**不得**提交。
**可选项（6 把 key）**：`current_selection`、`alternatives`、`selection_rationale`、`key_assumptions`、`independent_reconstruction`、`direction_flow`。
**禁止项**：`proposed_solution`、`decision_log`、`spec`、`plan`、`changes_diff`、`changed_files`，外加 4 个已退役 key `phase_coverage` / `seam_index` / `phase_map_trace` / `integration_map`（`skills/wh-review/scripts/review-materials.mjs:28,822`）。

### 1.3 硬约束（代码实际行为，带锚点）

- 缺必填 → 走 `review --action=record` 时先被 runner 静态 preflight 拦成 `blocked_before_dispatch`，错误码 `MATERIAL_INCOMPLETE`，文案逐字 `required material <key> is missing or empty`：`skills/wh-review/scripts/simple-review-runner.mjs:831-840`（检查构造 `:819-830`）。`buildReviewMaterials` 侧的同类文案是 `MATERIAL_INCOMPLETE: missing or empty <keys>`：`review-materials.mjs:1991-1992`（但该函数在 `review --action=record` 路径上不被调用）。
- 提交 `review_instructions` → `MATERIAL_FORBIDDEN: review_instructions is runner-generated`：抛点 `simple-review-runner.mjs:898-903`（`rejectCallerInstructions`），调用点 `:928-931`，拦截面 `:932-943`；另有一处同类抛点 `:844-847`（`validateDirectPacketMaterials`，`createSimpleReviewPacket` 在 `:661` 调用）。
- 提交未知/禁止 key → `MATERIAL_FORBIDDEN: <key> is not allowed for this review; legal material keys: ...`：`review-materials.mjs:365-369,808-818,2008`。
- `objective_facts` 为 `undefined` 时会被容错为 `null`，但 `materialPresent(null)` 为假 → 仍算缺 → `MATERIAL_INCOMPLETE`（`review-materials.mjs:330-336,1991`）。
- **`current_selection` 没有任何必填校验**（required 里没有它，`review-materials.mjs:385-420` 的 `validateDetailReviewInput` 只看 detail）。`review-runner.mjs:43-49` 的 `normalizeDirectionSelection` 会抛 `current_selection is required for direction review`，但该函数只被 `planDirectionReviewRequests` 调用，而后者在生产路径上无调用方。

---

## 2. `direction_flow.json`：生产者、schema、当前是否在生产路径

### 2.1 broker 侧的校验（失败码来源）

`/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:576-584` 逐字行为：

```js
function validateDirectionReviewMaterial(input, checked) {
  if (!input.review_flow) return;                       // ← 只有请求带 review_flow 才校验
  const entry = checked?.content_entries?.find((item) => item.target === "direction_flow.json" || item.target.endsWith("/direction_flow.json"));
  if (!entry) fail("MATERIAL_INCOMPLETE", "direction-review.v1 material is missing direction_flow.json");
  let material;
  try { material = JSON.parse(entry.contents.toString("utf8")); }
  catch { fail("MATERIAL_INCOMPLETE", "direction_flow.json is not valid JSON"); }
  if (canonicalJson(material) !== canonicalJson(input.review_flow)) fail("MATERIAL_INCOMPLETE", "direction_flow.json does not match the broker request flow");
}
```

调用点：`broker.mjs:970`；`review_flow` 的请求约束：`broker.mjs:594-598`（要求 `workflowhub-result.v3` + `review_mode === "single_round"`）。

**三个失败码/文案（逐字）**：
1. `MATERIAL_INCOMPLETE: direction-review.v1 material is missing direction_flow.json`
2. `MATERIAL_INCOMPLETE: direction_flow.json is not valid JSON`
3. `MATERIAL_INCOMPLETE: direction_flow.json does not match the broker request flow`

### 2.2 谁生产 `direction_flow.json`

- **没有持久化生产者**。全仓搜索 `direction_flow.json` 的实体文件：`[未找到]`（`find` 主仓 + task worktree，排除 `node_modules`）。
- **有唯一一处「投递路径」规则**：`runtime/review/provider-material-projection.mjs:53-54,73-76` —— `const DIRECTION_FLOW_MATERIAL_KEY = "direction_flow"; const DIRECTION_FLOW_PATH = "direction_flow.json";`，`providerMaterialPath()` 对该 key 特判返回 bundle 根路径。实测：`providerMaterialPath('direction_flow', 8, {version:'direction-review.v1'}) === 'direction_flow.json'`（报告作者只读复算）。同文件 L39-47 的注释逐字记录了历史故障：「the numbered form `materials/09-direction_flow.json` does NOT match, so every direction provider failed with `MATERIAL_INCOMPLETE: direction-review.v1 material is missing direction_flow.json` even though the file was present」。
- **有唯一一处 flow 对象生产者**：`skills/wh-review/scripts/review-runner.mjs:56-78` `planDirectionReviewRequests()`，产出 `flow.version = "direction-review.v1"`、`public_request_count: 1`、3 步 `reconstruct → reveal → challenge`、`output.one_provider_result/one_logical_fact`。**该函数在生产代码里没有任何调用方**（全仓仅 `skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs:5-6` 调用）。

### 2.3 schema / 字段（以 `planDirectionReviewRequests` 为唯一口径）

```
flow = {
  version: "direction-review.v1",
  public_request_count: 1,
  steps: [
    { id: "reconstruct", visible: ["raw_requirement","objective_facts"], hidden_until: "reveal" },
    { id: "reveal",      after: ["reconstruct"], visible: ["current_selection","alternatives","selection_rationale","key_assumptions","independent_reconstruction"] },
    { id: "challenge",   after: ["reveal"], visible: ["revealed_choice","independent_reconstruction"], output: "findings" }
  ],
  output: { one_provider_result: true, one_logical_fact: true }
}
```

**重要**：`direction_flow.json` 的「材料内容」与请求里的 `review_flow` **必须是同一对象的 canonical-JSON 等价物**（broker `:583`），所以它的内容不是上面这个 `flow` 本身，而是含 `flow` 的完整 direction review request 对象——历史原件确实如此（见 2.5）。

### 2.4 请求侧的 `review_flow` 传递链（当前代码）

- `skills/wh-review/scripts/simple-review-runner.mjs:1417`（managed 路径）与 `:1506`（unmanaged 路径）都把 `input.review_flow ?? input.reviewFlow ?? null` 透传给 client；
- `skills/wh-review/scripts/review-provider-client.mjs:913`（`startManaged`）与 `:1010`（`runGroup`）在非空时才写入请求 `review_flow`；`:893`/`:979` 强制 `single_round`；
- 请求创建方是**调用方**：`review-record` 的 `request` 由 `--input` JSON 直接提供（`tools/cli/stage-runtime.mjs:1123-1194`），host **不注入** `review_flow`。

**结论：当前代码在生产路径上不会写 `direction_flow`，也不会设 `review_flow`。因此「缺 `direction_flow.json`」的硬失败今天是休眠的（dormant），只有调用方自己带上 `review_flow` 才会复活。**

### 2.5 历史原件（只读核对，用于校准形态）

`workflowhub-thin-core-rebuild-planning-20260919/quality/evidence/research/direction-review-request-58b0c43a….json`：顶层 key 为 `stage / review_track / host_provider / review_flow / materials`；`materials` 的 9 把 key 为 `raw_requirement, objective_facts, convergence_outline, current_selection, alternatives, selection_rationale, key_assumptions, independent_reconstruction, direction_flow`（**同时**带 `review_flow` 与 `materials.direction_flow`）。该请求 `raw_requirement` 1633 字符、`objective_facts` 为 dict、`convergence_outline` 为 dict、`alternatives` 为 list —— 即那次是「已收敛方向」形态，不是「未收敛选项空间」。上游 I1b 的 A-16 也逐字记录了该文件的 `direction_flow` 内容（与 2.3 的 flow 同构）。

---

## 3. 逐字相等校验的确切规则与错误文案

### 3.1 `approved_direction` ↔ `decision-log.md`（**detail 轨道**，非 direction）

- 合同文本：`contracts/make-decision.md:96-97` —— 「`approved_direction` 必须逐字匹配当前 Workspace 的 `decision-log.md`，并带当前 material revision；不匹配时报告 `identity`/`freshness`，不得静默替换成摘要或旧结果。」
- 代码实现：`skills/wh-review/scripts/review-materials.mjs:406-410`
  ```js
  if (typeof currentDecisionLog !== "string" || currentDecisionLog.length === 0) {
    errors.push("freshness current decision-log.md bytes are unavailable");
  } else if (typeof materials.approved_direction === "string" && materials.approved_direction !== currentDecisionLog) {
    errors.push("identity approved_direction must match current decision-log.md bytes");
  }
  ```
- **比较方式**：JS 字符串 `!==`，即 **UTF-16 code unit 逐字相等**，**没有任何规范化**（不归一化换行、不 trim、不去 BOM、不做全角半角折叠）。
- **错误码与完整文案**：`MATERIAL_INCOMPLETE: detail input ${errors.join("; ")}`（`review-materials.mjs:414-418`），拼装后形如
  `MATERIAL_INCOMPLETE: detail input missing raw_requirement; empty approved_direction; identity approved_direction must match current decision-log.md bytes; freshness current material revision is unavailable or invalid`
  （每条子句逐字来自 `:395,399,402,405,407,409,412`）。
- **`currentMaterialRevision` 必须匹配** `/^revision-[a-f0-9]{64}$/`，否则 `freshness current material revision is unavailable or invalid`（`:411-413`）。
- **⚠️ 代码实际行为 vs 合同文本**：`validateDetailReviewInput` 是**导出但生产路径无调用方**的死校验（`review-materials.mjs:385`；`skills/wh-review/scripts/review-runner.mjs:9` 只 import、正文未使用，见 `:139` 起）；唯一调用点是 `__tests__/detail-minimum-input.test.mjs:63`。**所以今天走 `review --action=record` 不会因为这条 byte 相等而失败**——它是合同文本层面的要求，不是 CLI 的实际闸门。

### 3.2 真正会在 provider 前硬失败的字节校验：`material_id` 自检

- 声明身份：`runtime/review/review-packet-identity.mjs:103-134` `reviewPacketMaterialId()`；
- 实际字节身份：同文件 `:173-175` `deliveredMaterialId()`；
- 自检：`skills/wh-review/scripts/simple-review-runner.mjs:512-527`
  ```
  MATERIAL_IDENTITY_MISMATCH: declared review material identity <a> does not match the delivered bundle bytes <b>
  diagnostic: { declared_material_id, delivered_material_id, delivered_paths }
  ```
- 事后校验：`runtime/review/review-record-route.mjs:1355-1359` —— 结果 `material_id` 与认证请求不符抛 `REVIEW_MATERIAL_MISMATCH`；`tools/cli/stage-runtime.mjs:1148-1166` 把该不符转成 `unavailable` 事实而非抛出。
- **direction 轨道没有 `approved_direction` 一类的逐字校验**；它唯一相关的是 `convergence_outline` 与决策日志 OI 权威的一致性校验，但那条校验发生在**阶段完成侧**（`runtime/stage/stage-content-contracts.mjs:3177-3197`），不在送审 preflight。

---

## 4. 包上限与超限行为

### 4.1 常量与作用对象

- `skills/wh-review/scripts/review-materials.mjs:53`：`export const REVIEW_PACKET_MAX_DELIVERY_BYTES = 2 * 1024 * 1024;`（同文件 L41-52 注释逐字：由 330 KiB 提到 2 MiB，user decision 2026-09-11 option 2；原因是真实 build-prd 包 707,698 B）。
- **作用对象是「整包交付字节之和」**，不是单个 material：
  - runner 路径：`simple-review-runner.mjs:499-504` —— `deliveryBytes = Σ(每个写入文件的字节) + manifest.length`；超限 `rmSync` 删 bundle 后抛错。
  - `buildReviewMaterials` 路径：`review-materials.mjs:2222-2229` —— `deliveryManifest`（所有 entries + `manifest.json` 自身）字节之和。

### 4.2 两条超限文案（逐字，注意措辞不同）

1. `simple-review-runner.mjs:503`
   `MATERIAL_TOO_LARGE: review bundle exceeds the 2048 KiB provider delivery budget`
2. `review-materials.mjs:2226`
   `MATERIAL_TOO_LARGE: review packet exceeds 2048 KiB after content deduplication and semantic slicing`

两者都挂 `error.code = "MATERIAL_TOO_LARGE"`，且都在**任何 provider 被 spawn 之前**。

### 4.3 是否有裁剪 / 分片路径

- **direction / detail 轨道：没有。** 只有 dedup 与（verify-code 专属的）diff 分片。
- dedup：`review-materials.mjs:904-956` `deduplicateProviderMaterials()`（内容 sha256 相同的 material 只留一份，其余落 `alias_material` 事实）。
- diff 分片：`review-materials.mjs:58,2188-2191` 的 `writeShardedPhaseDiff`，以及 `runtime/review/review-input-bounds.mjs` 的全部机制——**只为 verify-code / build-code 服务**。
- verify-code 的裁剪上限逐字（`runtime/review/review-input-bounds.mjs:3,6,7,8`）：`TASK_BOUND_PROVIDER_INPUT_MAX_BYTES = 300 * 1024`、`TASK_BOUND_DIFF_BUDGET_BYTES = 150 * 1024`、`TASK_BOUND_DIFF_INLINE_LIMIT_BYTES = 160 * 1024`、`TASK_BOUND_CONTEXT_BUDGET_BYTES = 96 * 1024`。唯一生产消费者是 `compactVerifyCodeMaterials`，仅 `stage === "verify-code"` 时被调用（`simple-review-runner.mjs:635-638`、`:1277-1280`；`runtime/review/review-packet-identity.mjs:114-117`）。**这四档不作用于 direction。**
- 超限的 verify-code 专属错误码是 `REVIEW_INPUT_TOO_LARGE`（`simple-review-runner.mjs:1282`）与 `MATERIAL_TOO_LARGE`（`review-input-bounds.mjs:50,95,151,158,192`）——**均与 direction 无关**。

### 4.4 余量实测（只读）

历史真实方向审查请求原件 22136 B（`direction-review-request-58b0c43a….json`），距离 2 MiB 有约 99% 余量。CARD-07 当前全部材料只有 `decision-log.md` = 29985 B（task worktree 实测），远不可能撞上限。

---

## 5. 字节相等风险点（中文/标点/换行）

### 5.1 会改变字节的步骤：host-path 脱敏（**lossy**）

`runtime/review/provider-material-projection.mjs:56`：

```js
const LOCAL_HOST_PATH = /\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\/[^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+|[A-Za-z]:[\\/][^\s"'`<>()[\]{}\u2018-\u201f\u2026\u3000-\u303f\ufe30-\ufe4f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]+/g;
```

替换为 `HOST_PATH_PLACEHOLDER = "<host-path-redacted>"`（`:50,58-60`）。

**只读实测（报告作者复算，未执行 review）**：

| 输入 | 输出 | 是否改变 |
|---|---|---|
| `来源 /Users/Hugh/notes.md，取消理由：DEF-01；DEF-01` | `来源 <host-path-redacted>，取消理由：DEF-01；DEF-01` | 是（中文标点与 `DEF-01` 完整保留） |
| `https://example.com/a 后面是中文句子，完整保留` | `http<host-path-redacted> 后面是中文句子，完整保留` | 是（`//example.com/a` 被当作 host path 吃掉） |
| `/Users/Hugh/Downloads/调研深度优化方案.md` | `<host-path-redacted>` | 是 |
| `C:\Users\x\y.md，中文` | `<host-path-redacted>，中文` | 是 |
| `全角（括号）和“引号”` | 原样 | 否 |

**关键事实**：`https://…` 里 `//example.com/a` 会命中 host-path 分支而被替换——这与历史 `decision-log.md`（planning task）L726 逐字记录的触发条件一致：「真实触发是 `https://` 中的 `s:/` 命中 Windows 盘符分支后吞掉整句中文」。**中文句子本身现在被保住了**（靠 L56 的宽停止集），但 URL 部分会被改写。

### 5.2 D-04「中文标点 fixture 声明/实际字节不等」的机制（核实结论）

历史根因（`specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:726` 逐字）：「bundle 投递字节使用 `skills/wh-review/scripts/review-materials.mjs:426` 的脱敏规则（遇中文标点停止），而声明的 packet material id 使用 `runtime/review/review-packet-identity.mjs:7` 的旧规则（继续吞掉路径后整行）……结果：detail 声明 `8243e7e8…`、broker 对实收字节算出 `f807724e…`；direction 声明 `653d9312…`、broker 算出 `421f2802…`」。

**机制**：**同名两条规则的两份实现漂移**，而不是平台或编码问题——同样一段中文标点材料，在「声明身份」和「实际写盘字节」两侧被不同正则改写，导致 sha256 不同。对照组（纯空格 fixture）两侧规则结果相同 → 通过，排除了「工具整体不可用」。

**当前状态**：两份规则已收敛为唯一实现 `runtime/review/provider-material-projection.mjs`（`:1-48` 的注释逐字声明：「Do not reintroduce a second copy of this rule anywhere: import this module.」），且有 pin 测试 `skills/wh-review/scripts/__tests__/material-redaction.test.mjs:34-95`（含 L85-95「preserves CJK prose and DEF-01 tokens after a redacted host path」）。因此**同类漂移已被结构性消除**，但脱敏本身仍是 lossy 变换——任何含本地绝对路径或 `https://` 的送审材料，其 provider 看到的字节都已被改写（这是设计意图，不是缺陷）。

### 5.3 明确**没有**的规范化

- **没有 BOM 处理**：`review-materials.mjs` / `provider-material-projection.mjs` / `review-packet-identity.mjs` 全文搜索 `\uFEFF` / `BOM` → 无匹配。BOM 会作为普通字符参与 sha256。
- **没有全角/半角折叠**：唯一涉及全角的代码是 L56 正则的**停止集**（用来「不吞」全角标点），不是折叠。
- **没有 `\r\n` 归一化参与身份计算**：`materialBytes` 是 `Buffer.from(str,"utf8")`（`review-materials.mjs:326-331`），原字节直通。仅有的 `\r\n → \n` 归一化在 `originalRequirementSection`（`:862`）与 `deduplicateDecisionMaterials`（`:881-883`），**且只用于 dedup 的「是否重复」判断与派生子串**，不是身份计算。
- **没有 trim**（除 `materialPresent` 的「是否为空」判断，`:330-336`）。
- **唯一的路径特判**是 `direction_flow → direction_flow.json`（`provider-material-projection.mjs:74`），其余一律 `materials/<NN>-<stem>.<ext>`（`:75-76`）。

### 5.4 其余会改变字节的行为

`assertRedactableMaterials`（`simple-review-runner.mjs:642-655`）对 `Buffer`/`Uint8Array` 材料直接 `MATERIAL_FORBIDDEN: binary material <key> cannot cross the host-path redaction boundary` —— 因为脱敏是文本/JSON-only，二进制无法被检查，故 fail-closed。

---

## 6. provider 列表与登录态查询方式

### 6.1 候选 provider 从哪读

1. **WorkflowHub host 配置**：`~/.config/workflowhub/config.json`（路径定义 `skills/wh-review/scripts/third-review-host-config.mjs:50`：`join(process.env.HOME || homedir(), ".config", "workflowhub", "config.json")`；加载器 `:531` `loadTrustedThirdReviewConfig`）。
   - 现实值：`third_review.command = ["node","/Users/Hugh/Hugh/Project/3rd-review/scripts/3rd-review.mjs"]`，`third_review.config = "/Users/Hugh/.config/3rd-review/config.json"`，`wh_review.version = 2`。
   - `wh_review.stages."make-decision".direction = { initial: ["kimi/coding","antigravity/flash","codex/luna"], minimum_heterologous: 1, mode: "single_round" }`（`detail` 同）。
   - 路由解析：`third-review-host-config.mjs:345-372`（`make-decision` 按 track 取 route）；`mode` 必须为 `single_round`（`:335-340` `requireStageReviewMode`）。
2. **broker 配置**：`/Users/Hugh/.config/3rd-review/config.json`，`version: 4`，凭据与模型在这里：`tiers` 与 `providers`（`pi/v4flash`、`claude-code/opus`、`kimi/coding`、`kimi/k3`、`antigravity/flash`、`antigravity/opus`、`codex/luna`、`grok/grok` …），每个含 `enabled`、`command`、`model`、`effort`、`auth`（多为 `{type:"native"}`），部分含 `allow_host_state: true`（`antigravity/*`）。
3. **可用性选择算法**：`skills/wh-review/scripts/simple-review-runner.mjs:1316-1337`（`selectProviders(trusted.config, host_provider, route)`；同源 provider 会被剔除并转成 `ROUTE_UNAVAILABLE`）。

### 6.2 只读查询方式（核实）

| 方式 | 是否只读 | 能查到什么 | 锚点 |
|---|---|---|---|
| `node tools/cli/stage-runtime.mjs doctor --action=workspace --stage=<stage> [--project --task]` | 只读 | worktree root / baseline / 材料可用性 / storage；**不碰 provider** | `tools/cli/stage-runtime.mjs:1062-1075` |
| `node skills/wh-review/scripts/wh-review-cli.mjs doctor` | 只读 | `{status:"ok", config, stages:[...]}`，并跑 `validateAllWhReviewRoutes` | `skills/wh-review/scripts/wh-review-cli.mjs:576-580,585-588` |
| `node /Users/Hugh/Hugh/Project/3rd-review/scripts/3rd-review.mjs doctor --config=<cfg>` | 只读（不调模型） | 每个 provider `status: ready|disabled|unavailable`，但 `verification: "executable_only"`，且自述 `note: "doctor does not verify model authentication or a real review"` | `3rd-review/scripts/3rd-review.mjs:5`（usage）、`lib/broker.mjs:667-693`（实现，`:688` 是 `--version` 类探测、`:692` 是那句 note） |
| 直接读两个 config 文件 | 只读 | provider id、model、`enabled`、`auth.type` | 见 6.1 |
| 列 broker runtime 状态 `status --runtime-id=<uuid>` | 只读 | **已存在** runtime 的状态；不能预判登录态 | `3rd-review/scripts/3rd-review.mjs:5-6` |

**`[未找到]`：没有任何「列出当前 provider 及其登录态」的只读命令。** broker CLI 的动词是 `doctor|run|start|status|cancel`（`3rd-review/scripts/3rd-review.mjs:5`），其中只有 `doctor` 无需 model call，而它只证明可执行文件存在。

### 6.3 `antigravity/flash` 的 `AUTHENTICATION_FAILED`

- 该错误码**不是** broker 主动探测出来的，而是**从 provider 自身输出分类**出来的：`3rd-review/lib/provider-failure.mjs:69` 逐字 `if (/unauthorized|authentication failed|invalid api key|no api key|missing api key|login required|not logged in/.test(value)) return "AUTHENTICATION_FAILED";`，稳定文案 `"provider authentication failed"`（`:25`）。
- broker `doctor` 对该 provider 只会跑 `antigravity.mjs:30` `doctor: (provider, cwd) => plan(provider, cwd, ["--version"], null)`。
- 因此：**「能不能确定 antigravity/flash 现在登录态 OK」的唯一确定方式是一次真实 provider 调用。** 只读手段只能证明：`agy` 可执行、`antigravity/flash` 在 `tiers` 里 enabled、config 通过 schema 校验。
- 相关旁路（都不是只读）：`tools/cli/run-wh-review-provider-smoke.mjs`（`runProviderSmoke`，真调 provider 并把结果写成 `--evidence_path` 证据文件，`:14-27`）。

---

## 7. 失败是硬阻断还是事实记录

### 7.1 `review --action=record` 的失败面

| 失败类型 | 表现 | 是否硬失败 | 锚点 |
|---|---|---|---|
| provider 返回失败/超时/坏 JSON | `status:"unavailable"` + `provider_results[*].error` | **否**，被记录 | `review-record-route.mjs:1316-1330`（runRound 抛错也在这里被捕获转 unavailable）、`:1372-1381` |
| 路由不可用（`ROUTE_UNAVAILABLE`） | `dispatch_state:"blocked_before_dispatch"`，provider 数为 0 | **否**，被记录 | `simple-review-runner.mjs:1302-1337`；`review-record-route.mjs:1303-1315` |
| 材料缺失/禁止/未知 key | `MATERIAL_INCOMPLETE` / `MATERIAL_FORBIDDEN`，`blocked_before_dispatch` | **否**，被记录为 attempt 事实 | `simple-review-runner.mjs:791-830,1241-1248` |
| provider 健康探测不过（`REVIEW_THRESHOLD_INVALID`） | 同上 | **否** | `simple-review-runner.mjs:1365-1376` |
| 历史不可读 / 源漂移 | `REVIEW_HISTORY_UNAVAILABLE` / `REVIEW_SOURCE_DRIFT` / `REVIEW_SOURCE_UNAVAILABLE` | **否**，被记录 | `review-record-route.mjs:1154-1196,1231-1233,1262-1280` |
| 显式 retry 但无依据 | `REVIEW_RETRY_NOT_ADMITTED` | **否** | `review-record-route.mjs:1244-1255`；依据集合 `:424` `["material_changed","provider_changed","source_recovered"]` |
| 结果 `material_id` 与认证请求不符 | `REVIEW_MATERIAL_MISMATCH` | **否**（stage-runtime 把它转 unavailable 事实） | `review-record-route.mjs:1355-1359`；`tools/cli/stage-runtime.mjs:1148-1166` |
| **`--input` 缺失** | `TypeError` 抛出 → 进程退出码 1 | **是（协议层）** | `tools/cli/stage-runtime.mjs:835-837` |
| **request 结构非法**（例如同时给 `request` 与 `result`、含 host-owned 身份字段） | `TypeError` 抛出 → 退出码 1 | **是（协议层）** | `tools/cli/stage-runtime.mjs:1123-1129`；`runtime/review/review-record-route.mjs:1122-1131` |

**退出码语义**（`tools/cli/stage-runtime.mjs:68-72`）：`status === "protocol_invalid"` → 2；`stage_row_error` → 1；**其余（含 `unavailable` 的 review）→ 0**。

### 7.2 阶段侧（是否阻断推进）

- `runtime/stage/stage-handlers.mjs:2694-2704` `safeReviewFacts`：只把 `MATERIAL_INCOMPLETE` / `ENOENT` 转成「诚实的 unavailable 事实」；注释逐字：「A missing/material-incomplete review is an honest quality fact and may be disclosed without becoming a progression gate.」
- 定义 `direction` / `detail` 两个审查事实：`:3616-3617`（`safeReviewFacts(worker, input, "direction_review", "direction")` / `"detail_review"`）。
- 合同文本：`contracts/make-decision.md:123-125` —— 「decision-log 的决定和 finding 处置仍由 WorkflowHub 阶段负责；**review 不成为阶段推进 gate**。」
- 步骤 manifest：`workflows/make-decision/steps.json` step 6 `direction-advice` 的 `completion_evidence` 同时接受 `quality/reviews/results/` **或** `quality/reviews/attempts/<attempt_id>/attempt.json`，其 `observable_result` 逐字：「Missing or unavailable stays explicit and never becomes an empty successful result. Use the actual canonical result ref when available; when the review is unavailable, consume its canonical attempt ref.」
- **结论**：provider 侧的任何失败**不阻断**该阶段；但**缺质量事实不能被声称为完成**。

---

## 8. 可直接执行的命令模板（不执行）

### 8.1 调用面确认（只读推导）

- 公开行为 → 内部操作：`"review:record": "review-record"`（`tools/cli/stage-runtime.mjs:1360`），需 `--action=<...>`（`:1337-1339`）。
- 内部入口：`node tools/cli/stage-runtime.mjs review --action=record --stage=<stage> --input=<json>`（行为入口 `:1384`）。
- 必需参数（逐字来自代码）：
  - `--action=record`（缺则 `public runtime behavior requires --action=<high-level-action>`，`:1338`）；
  - `--stage`（：identity 解析 `:811` 附近；`review-record` 缺 `--input` 抛 `review-record requires --input=<simple-review-result.json>`，`:835-837`）；
  - `--input=<path>`（同上）；若走 `--task-path` 形式亦可，但更稳的是 `--project` + `--task`（`:145-166` `resolveWorkflowHubIdentity`：两者必须同时给，且必须与认证 worktree 一致，否则 `WorkflowHub identity conflict`）。
- `review-record` **没有** `allowed` 参数白名单（对比 `capture-tests` 等在 `:838-845` 有严格白名单）。

### 8.2 命令模板

```bash
# 在 task worktree 根目录执行（保证 --project/--task 与认证 worktree 一致）
cd /Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-07-20260919

node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/stage-runtime.mjs review \
  --action=record \
  --stage=make-decision \
  --project=workflowhub \
  --task=workflowhub-thin-core-card-07-20260919 \
  --input=/absolute/path/to/direction-review-input.json
```

（把 `--project`/`--task` 换成 CARD-07 的 `task.json`：`project_name: "workflowhub"`、`task_id: "workflowhub-thin-core-card-07-20260919"`、`workspace_root: "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-07-20260919"`、`target_repo_root: "/Users/Hugh/Hugh/Project/workflowhub"`。）

### 8.3 `--input` JSON 的形态与每个字段的来源

```jsonc
{
  "request": {
    "stage": "make-decision",              // 必需；须与 --stage 一致
    "review_track": "direction",           // 必需；"direction" | "detail"（review-policy.mjs REVIEW_TRACKS）
    "host_provider": "codex",              // 必需；须是 3rd-review config 里已配置的 provider id
    "materials": {
      "raw_requirement":    "<string>",    // 必需；来源：decision-log.md 的「原始需求」段，或 host session transcript 投影
      "objective_facts":    "<string|object>", // 必需；来源：本会话已知客观事实/硬约束/非目标
      "convergence_outline": {             // 必需；来源见下
        "task_id": "workflowhub-thin-core-card-07-20260919",
        "outline_version": "<同 decision-log OI 表的 outline_version>",
        "entries": [
          { "oi_id": "OI-00X", "category": "<category>", "source": "<source>",
            "question": "<原始问题/未知>", "status": "open" }
        ]
      }
      // "current_selection" / "alternatives" / "selection_rationale" /
      // "key_assumptions" / "independent_reconstruction" / "direction_flow"
      // 均为 optional —— 但注意第 9 节：默认 directionMode="full" 会拒掉前 5 把 key。
      // 禁止出现：proposed_solution, decision_log, spec, plan, changes_diff, changed_files,
      //           review_instructions（runner 生成）, 以及 4 个 retired key。
    }
    // "review_flow": { version:"direction-review.v1", ... }  ← 可选；一旦给了就必须同时给 materials.direction_flow（第 2 节）
    // "retry": { "requested": true, "reason": "<非空>", "basis": "material_changed" }  ← 仅在需要覆盖同键历史时
  }
}
```

**每一把 key 的来源锚点**：

| 字段 | 来源 |
|---|---|
| 送审边界/必填/可选/禁止 | `runtime/review/stage-materials.json`（`stages."make-decision".tracks.direction`） |
| `review_instructions` 由 runner 生成、调用方禁用 | `skills/wh-review/scripts/simple-review-runner.mjs:898-903`；`skills/wh-review/scripts/review-materials.mjs:1075-1126`（模板渲染） |
| `convergence_outline` 的 questions-only 形态 | `runtime/stage/stage-content-contracts.mjs:3004-3014`（`deriveQuestionsOnlyOutline`：`entries` 只含 `oi_id/category/source/question/status:"open"`）；必须 `task_id`+`outline_version` 匹配（`:3177-3197`）；`outline_version` 取自 decision-log OI 表（`:3098-3105`） |
| `outline_version` 的来源 | decision-log.md 的 OI 表首行 `outline_version`/`version`（`stage-content-contracts.mjs:3098`） |
| `current_selection` 形态 | 字符串或 `{ current_selection: "<string>", ... }`（`skills/wh-review/scripts/review-runner.mjs:43-49`） |
| `direction_flow` 形态与投递路径 | `review-runner.mjs:56-78`（对象）；`runtime/review/provider-material-projection.mjs:53-54,74`（路径） |
| `host_provider` 必须是已配置 provider | `skills/wh-review/scripts/simple-review-runner.mjs:1208-1209,1318-1327` |
| `retry` 形态与依据集合 | `runtime/review/review-record-route.mjs:426-451`、`:424`、`:1234-1255` |
| 结果返回形态 | `review-record-route.mjs:1374-1381`（`{status:"recorded", reused, dispatch_state, ...refs}`） |

### 8.4 同键复用提醒（会影响「要不要真的跑」）

`runtime/review/review-record-route.mjs:1256-1286`：若历史里存在同一 `request_key` 的可复用记录，**直接返回 `status:"recorded", reused:true, dispatch_state:"reused"`，不再调 provider**。要真正重跑，需要显式 `retry` 且依据成立（`material_changed` 要求 `attempt.material_id !== 当前 materialId`，`:488`）。

---

## 9. 与「早审」用法的适配性评估

**问题**：早审的输入是「未收敛的选项空间」（调研与发散之后、用户方向讨论之前），而合同的 direction 轨道被写成「不含候选方案的盲审 + 已收敛方向的 challenge」。**只列选项与代价，不做推荐。**

### 9.1 判定：**命令能跑通并被记录为事实，但不能满足合同语义；作为「让异源 provider 看未收敛选项空间给发散建议」的用途，现有路径不成立。**

逐条依据：

1. **合同禁止把候选方案/SELECTION 交给 direction**：`contracts/make-decision.md:44` 「禁止交付：拟定方案、推荐方案或方案比较结论」；`:89-90` 「direction 是不含候选方案的盲审」。早审的诉求恰恰是「看未收敛的选项空间」，与该禁止项正面冲突。
2. **早审时刻不存在「当前选择」**：方向讨论（approve-decision / Talk round 2）尚未发生。而历史真实请求的原件里 `current_selection` 承载的是 U-007 选 A 的已定选择（见 2.5）。
3. **即便强行送 `alternatives`，默认 mode 会拒**：`skills/wh-review/scripts/review-materials.mjs:1996-2007` —— `if (!["challenge","combined"].includes(directionMode)) { for (const key of ["current_selection","alternatives","selection_rationale","key_assumptions","independent_reconstruction"]) allowed.delete(key); }`，随后任何不在 `allowed` 的 key → `materialForbiddenMessage`。而 `directionMode` 的默认值是 `"full"`（`:1968`），且**没有任何生产调用方传过它**（全仓 `directionMode` 只出现在 `review-materials.mjs` 与其测试；CLI/route/runner 均无入口——`:1031,1042,1045,1048,1075,1084,1091,1114,1116,1118,1968,1999,2013`）。
4. **默认 mode 的指令模板明确否定「提出方案」**：`review-materials.mjs:1051-1052` —— 「Focus on whether the raw requirement, user flow, boundaries, risks, and direction are complete. **Do not propose or judge an implementation solution.**」早审想要的正是「发散/方向建议」。
5. **`direction_flow` 的 reconstruct 步看不到候选空间**：`review-runner.mjs:64` `{ id:"reconstruct", visible:["raw_requirement","objective_facts"], hidden_until:"reveal" }` —— 即使送 `alternatives`，它也只能在 `reveal` 之后被看到（`review-runner.mjs:65`），发散/方向建议在结构上被排在 reveal 之后。
6. **`convergence_outline` 的 questions-only 投影没有持久化生产者**：`deriveQuestionsOnlyOutline` 只在 `directionReview` 缺失时作内存 fallback（`runtime/stage/stage-content-contracts.mjs:3175`），产出物落在 `direction_review_input` 这个 **fact** 上（`runtime/stage/stage-handlers.mjs:3698-3719`），不写独立文件。早审如果要「未收敛选项空间」，得**自己的会话临时构造** `convergence_outline`（并自证 `task_id`/`outline_version` 与当前 decision-log OI 表一致），或改送别的 key——但别的 key 会被 `MATERIAL_FORBIDDEN` 拒。
7. **早审会污染官方位**：`workflows/make-decision/steps.json` step 6 `direction-advice` 是官方方向审查位（order 6，`depends_on: [5]`）。在 step 6 之前另发一次 direction track 的 review，会写入 `quality/reviews/attempts/*` 与 `quality/reviews/results/*`，而 step 6 的 `completion_evidence` 与 `runtime/stage/stage-handlers.mjs:3616` 的 `direction_review` 消费者**不区分是哪一次**——第二次正式审查可能因为同键复用（第 8.4 节）而不真正派发。
8. **可用的合规出口是「事实」而非「gate」**：早审失败不会被阻断（第 7 节），所以试错代价主要在 provider 预算与一次不可变的 attempt 记录上。

### 9.2 所有可选路径与其代价（只列，不推荐）

| # | 路径 | 具体做法 | 代价 / 风险 | 锚点 |
|---|---|---|---|---|
| A | 走现有 `review --action=record` + `review_track=direction`，只送 3 把必填 + `current_selection` | 送 `raw_requirement` / `objective_facts` / `convergence_outline`，把「当前选择」写成「未选定/全部候选仍 open」 | 违反 `:44`/`:89-90` 的「不含候选方案」；`current_selection` 只能承载**一个字符串/对象**，无法承载选项空间；provider 的 reconstruct 步看不到候选 | `contracts/make-decision.md:44,89-90`；`review-runner.mjs:43-49,64-65` |
| B | 同上，但送 `alternatives` / `selection_rationale` / `key_assumptions` / `independent_reconstruction` | —— | **直接 `MATERIAL_FORBIDDEN`**（默认 `directionMode="full"`）；除非改代码传 `directionMode="combined"`，而 CLI/route 无此入口 | `review-materials.mjs:1968,1996-2007` |
| C | 同上 + 自造 `direction_flow` 与 `review_flow` | 调用方自带 `review_flow` 并投递末段为 `direction_flow.json` 的材料 | 复活 broker 的三条 `MATERIAL_INCOMPLETE` 校验（缺文件/非 JSON/与 `review_flow` 不等价）；且要求 `workflowhub-result.v3` + `single_round`；等于**绕过 runner 自己实现 flow**，与「不得用第二次 public request 拼顺序」的约束相邻 | `3rd-review/lib/broker.mjs:576-584,594-598`；`simple-review-runner.mjs:1417,1506` |
| D | 不投 direction track，改投 `detail` track | —— | 与早审诉求无关；且 detail 的 `approved_direction` 需逐字等于 `decision-log.md` 且带 `revision-<64hex>`，早审时刻方向尚未批准 | `contracts/make-decision.md:92-101`；`review-materials.mjs:406-413` |
| E | 用最小 non-stage 面 `build-prd`（`review_kind=build_prd`） | 走 `non_stage.build_prd` 的送审边界 | 语义是 PRD 报告审查，不是方向发散；自有材料契约与 forbidden 集合 | `runtime/review/review-policy.mjs:79-84`；`skills/wh-review/scripts/wh-review-cli.mjs:382-384` |
| F | 直接走 broker（`3rd-review … run/start`），不经过 review-record | 自备 `--request` 与 `--attachments` | 结果**不落** `quality/reviews/*` 不可变事实，stage 侧无法消费（`safeReviewFacts` 找不到 attempt/result）；等于放弃 provenance | `3rd-review/scripts/3rd-review.mjs:5,17-19`；`runtime/stage/stage-handlers.mjs:2694-2704` |
| G | 用 `tools/cli/run-wh-review-provider-smoke.mjs` 真调 provider | 写 `--evidence_path` | 需要 `source_root`/`target_repo_root`/`review_data_root`/`attachment_root`/`config` 等一堆绝对路径；**写文件**（违反本轮只读约束）；结果不是 canonical review fact | `tools/cli/run-wh-review-provider-smoke.mjs:7-27` |
| H | 把「未收敛选项空间」的异源意见放在审查链路之外（例：另起一次普通咨询/独立会话） | —— | 无 canonical provenance，不产生 `quality/reviews/*`；需要用户同意这种「非审查」定位 | `CONSTITUTION.md`/`AGENTS.md` 的质量事实边界（质量裁决须独立来源独立上下文） |
| I | 把早审并入官方 step 6（`direction-advice`）之前的那一轮，即**不额外发起**，只按合同在 step 6 一次完成 | —— | 放弃「用户方向讨论之前」的时机；早审诉求（发散去向）退化为 step 6 的挑战型审查 | `workflows/make-decision/steps.json` step 6 |
| J | 把早审并入 `convergence_outline` 之前的调研/发散产物（研究记录），不走 review | —— | 不是异源 provider 审查；不产生 review fact | 同上 |

**未在表内的可能路径**：`[未找到]`——除 `review --action=record`（`review:record`）、`review --action=risk`（`review:risk`）、`verify --action=execute`、`run --action=*`、`confirm --action=decision`、`authorize --action=*`、`doctor --action=workspace`、`status --action=*` 之外，`RUNTIME_BEHAVIORS` 里没有别的 public 行为可以发起一次 provider 审查（`runtime/interface/runtime-facade.mjs:5-13`；`tools/cli/stage-runtime.mjs:1324-1334`）。

---

## 10. 无法确认项

1. **CARD-07 的 `convergence_outline` 当前实际内容**：CARD-07 的 `decision-log.md` 里 OI 表的 `outline_version` 字面值、以及是否已存在 9 条 OI 的完整表——**未逐字核对**（本报告未读 CARD-07 `decision-log.md` 全文，只测了字节数 29985 B）。因此无法给出可直接粘贴的 `convergence_outline` 实例。
2. **CARD-07 的 task 是否已在 WorkflowHub 侧「已存在可复用 direction review 历史」**：CARD-07 的 `quality/reviews/` 目录为空（实测 `ls` 无输出），所以首次调用不会被同键复用；但**尚未经 stage-runtime status 读取过**，故复用键命中与否是推断而非实测。
3. **`antigravity/flash` 当前登录态**：`[无法只读确认]`（第 6.3 节）。任何断言都需要一次真实 provider 调用。
4. **`host_provider` 的推荐取值**：`~/.config/3rd-review/config.json` 的 provider id 里没有裸 `"codex"`（只有 `codex/luna`），而历史请求用的是 `"codex"`。`selectTrustedReviewProviderSelection` 如何把 `"codex"` 映射到同源 provider **未逐行核对**（`skills/wh-review/scripts/third-review-host-config.mjs:324-333` 有 `sameSource` 相关逻辑，但未展开）。
5. **上游提到的「300/150/160/96 KiB 只服务 verify-code」已完成核实**（第 4.3 节），但**未核实 `skills/wh-review/scripts/review-input-bounds.mjs` 与 `runtime/review/review-input-bounds.mjs` 两份副本当前是否 byte 等价**（历史 archive 记载曾有 63 行 diff、D-015 曾裁定对齐到宽松侧；`tests/contract/review-input-bounds-portability.test.mjs` 存在但未运行）。
6. **早审若走路径 A，`current_selection` 的合规占位值应当是什么**：合同禁止「推荐方案」，但没有给出「尚未选择」的合法表达方式——`[未找到]` 任何 `current_selection` 的「未选定」约定值。
7. **`direction_flow.json` 的正式 schema 文档**：`[未找到]` 独立的 JSON Schema 文件；唯一口径是 `planDirectionReviewRequests` 的运行时对象 + broker 的 canonicalJson 等价比较。
8. **`review --action=record` 在 provider 失败时的 `outcome` 取值已核实为 `"unavailable"`**（`skills/wh-review/scripts/simple-review-runner.mjs:751-770` `unavailableResult` 固定写入 `status:"unavailable"` 与 `outcome:"unavailable"`）；但**双角色合并后**（`combinePairedResults`）的 `outcome` / `status` 分支未逐行读全——`simple-review-runner.mjs:1727-1824`。

---

## 附：最可能导致「下一次真实调用失败」的 3 个原因（按可能性排序）

1. **更可能出现在材料形态上，而不是 direction_flow 上**：`raw_requirement` / `objective_facts` 中含本地绝对路径或 `https://` URL → 脱敏改写字节 → 虽然声明身份与实际字节现在共用同一规则（`provider-material-projection.mjs`）故不会 `MATERIAL_IDENTITY_MISMATCH`，但**provider 看到的需求文本已被改写**，且历史 `direction_flow` 与 broker `review_flow` 的 canonicalJson 等价比较对任何改写都不容忍。锚点：`provider-material-projection.mjs:50-60`；`3rd-review/lib/broker.mjs:583`。
2. **早审诉求与 direction 轨道语义冲突 → 被 `MATERIAL_FORBIDDEN` 或被模板「不得提出方案」掏空**：`review-materials.mjs:1996-2007`（默认 mode 封死 5 把 key）+ `:1051-1052`（禁止提出/评判方案）。这是「一次成功但语义无用」或「直接失败」的分叉点。
3. **provider 可用性不可预判**：`kimi/coding` 曾 `RATE_LIMITED`（planning task D-06：`provider process exited with 1`）、`antigravity/flash` 历史上两次 `AUTHENTICATION_FAILED`，而只读手段（broker `doctor`）只证明可执行文件存在（`3rd-review/lib/broker.mjs:688,692`；`lib/provider-failure.mjs:69`）。route 要求 `minimum_heterologous: 1`，三 provider 全失败即 `outcome=unavailable`（历史 D-01/D-02 形态），但**不会阻断阶段**。
