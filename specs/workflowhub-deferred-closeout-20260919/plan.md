# 实现计划：审查管线阻断解除与严格判定收敛

- **Input**：`specs/workflowhub-deferred-closeout-20260919/decision-log.md`、`specs/workflowhub-deferred-closeout-20260919/spec.md`
- **Template version**：`plan-task.v4`

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#决定`（D-001～D-024）与 `#严格判定处置清单` | 已确认方向：5 REMOVE + 6 RELAX、material_id 对齐冻结、cancelManaged 接线、4.2/4.3/4.4/4.6/4.7 收口、非目标与红线 | M 定方向时；S/B 每 Phase 开工前 |
| `spec.md#5 功能需求`（FR-STRICT/IDENTITY/CANDIDATE/CANCEL/BOUNDARY 共 26 条） | 产品行为、范围边界、依据与场景 | S/B 写卡与实现前 |
| `spec.md#11 验收标准`（AC 共 26 条）与 `#7 关键实体`（两张显式丢弃事实合同） | 逐条 oracle、通过/失败判据、丢弃事实字段冻结 | B 逐卡核对；P 最终聚合时 |
| `spec.md#12 风险、未决与交接`（RISK-01/02、OPEN-01、七条红线） | 红线不动、墙钟不动、标识算法冻结边界 | M/S 遇边界判断时 |
| `plan.md#Code Anchors`、`#Solution Design`、`#Phase P1～P5` | 工程方案、精确锚点、依赖与恢复策略 | S/B 执行卡时 |
| `tasks.md#Phase P1～P5`、`#Dependency Graph`、`#Final Boundary Check` | 可执行卡、gate_cmd、完成记录 | B/P 逐卡执行与核对 |

## Quick Read

- **Goal**：跨仓审查管线恢复派发（两侧对同一材料包产出同一 `material_id`），五项严格判定拆除、六项放宽，接通既有 `cancelManaged` 终止源漂移卡死成员，4.2/4.3/4.4/4.6/4.7 候选收口；验收只用既有针对性测试 + 少量新行为断言（RED/GREEN）。
- **Non-goals**：来源：D-001/D-015/D-016；不新增任何严格判定或加严；不新增验收账本/计数/采集面（D-001/D-015/D-016）；不做 4.1/4.5/4.8（R-001/D-001）；不重做已修项 4.6 缺陷 1/2/4 与 RELAX 第 4 项（D-007/F-013）；不取消 `material_id` 比较（D-017）；不动七条红线与 20 分钟墙钟（D-015/G-004）；不 push 3rd-review（D-011）。
- **Before**：方向与细节审查双双 `blocked_before_dispatch`（`PROTOCOL_INCOMPATIBLE`，result_ref 双 null，该轴历史触发 80 次）；`MATERIAL_INCOMPLETE` 153、`EVIDENCE_ANCHOR_INVALID` 20 等严格判定实测放大失败（F-001）。
- **After**：同包两侧同标识、派发可认证；整组扫描/正文 token/死常量/模式重发门/锚点整轮升级被拆；私有路径只扫结构化字段、身份降级保真、近似键与未锚定 finding 丢弃并各留一条显式事实；守卫改为仅源漂移下调取消并补墙钟禁止断言。
- **Main risk**：3rd-review 的 v3 算法只存在于未提交工作树（PFACT-03/RISK-01）；多项候选（4.2 拆分函数、4.3 接入点、4.7 逐项映射、B4 health 路径）精确落点 PENDING，须在 build-code 内诚实定位，不得伪造行号。
- **Next step**：P1 T001 RED —— 在 `tests/contract/review-material-change-redispatch.test.mjs` 增加冻结向量断言（WH `reviewPacketMaterialId` 与 BR `canonicalWorkflowHubMaterialId` 对同一语义材料集产出同值）。

## Technical Context

### Global Constraints

- **Verified facts**：两仓库锚点已逐行核实（WH worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-deferred-closeout-20260919` @ `fcb7078f`；BR `/Users/Hugh/Hugh/Project/3rd-review` @ `a96f28b` + 未提交 v3 工作树，BR 行号为工作树行号）。BR 8 个未提交改动文件（+517/−88）经 `git diff --stat` 复核：5 lib + 3 test。WH `node_modules` 未安装；BR 侧验证过可直接 `node --test`。
- **Language / runtime**：Node.js（两仓均 ESM `.mjs`）；WH 测试 `vitest`，BR 测试 `node --test`（`package.json` scripts 已核实）。
- **Primary dependencies**：无新增依赖。复用 Node 内建 `crypto`、`node:test`/`vitest`。
- **Storage / state**：无新增持久对象或 schema；显式丢弃事实随审查运行质量事实归档（spec §8）。
- **Testing**：**前置条件：WH worktree 必须先一次性执行 `npm ci`**（`node_modules` 缺失；research 已核实）。此后每条 WH `gate_cmd` 均为 `npx vitest run <path>`；BR 均为 `node --test test/<file>.test.mjs`。只跑受影响针对性测试（AGENTS.md 硬规则）；验收只用既有针对性测试，新行为断言允许最小 RED/GREEN，不做前后计数（D-016/D-022）。
- **Target environment**：WH 任务 worktree + BR 工作树（可改可测；commit 仅在独立分支且不 push，授权已随重新签发延续）。
- **Scale / scope**：WH 侧约 10 个实现文件 + 9 个既有测试文件；BR 侧 5 lib + 3 test；跨仓一次。
- **Unresolved facts**（诚实登记，build-code 内定位，不得伪造行号）：① 4.2 behavior/governance digest 拆分的确切函数（digest 逻辑分布在 `runtime/review/canonical-review-result.mjs`、`runtime/review/review-route-identity.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/review/integration-review-subject.mjs`）；② 4.3 一次即熔断与聚合健康预检被阶段路由消费的精确接入点（runtime 无现成 circuit-breaker 位点）；③ 4.7 八项逐条 ↔ 文件映射（需全量 diff 阅读）；④ B4 health 路径 `PROTOCOL_INCOMPATIBLE` 精确位点（request 路径 :582/:586/:587/:590/:592/:707 已核实）；⑤ B2/E/A5/A3/B5/G 全部无既有测试覆盖（NO_TEST_FOUND），按本计划在最近既有测试文件内设计最小 RED。

## Code Anchors

- **Verified anchors**（逐行核实，2026-09-19）：
  - 标识权威：BR `lib/attachments.mjs:18-26` `canonicalWorkflowHubMaterialId`（filter :22、map :23、sort :24、digest :25）。
  - 标识改侧：WH `runtime/review/review-packet-identity.mjs:121-156` `reviewPacketMaterialId`（含 `review-instructions.md` 条目 :137、`authenticated-evidence.json` 条目 :151-153、canonical filter :154、sort :155、hash :156）。
  - 第三处哈希实现：WH `skills/wh-review/scripts/review-materials.mjs:840-843` `canonicalMaterialManifest`（sort+map，输入已是小写 hex，核实无需改）。
  - 4 个相等点：WH `skills/wh-review/scripts/review-provider-client.mjs:687`；`simple-review-runner.mjs:680`、`:1397`；`runtime/review/review-record-route.mjs:146`（全部保留比较）。
  - REMOVE：BR `lib/workflowhub-result-v3.mjs:200`（组级扫描）、`:32`（`secret|data` token）；WH `skills/wh-review/scripts/review-materials.mjs:57`（死常量；活 sibling `:61` `PHASE_DIFF_INLINE_LIMIT_BYTES` 消费者 `:2038`/`:2133`，勿动）；BR `lib/broker.mjs:1243,1282,1387` + `lib/recovery-policy.mjs:14,26`（review_mode 门）；WH `simple-review-runner.mjs:1475`（EVIDENCE_ANCHOR_INVALID 整轮升级）。
  - RELAX：BR `workflowhub-result-v3.mjs:37,47,179` + `broker.mjs:104-113`（结构化字段）；BR `broker.mjs:441-474` `publicInvalidV3Result`（B2；`cause_code` 在 BR lib 今日零命中，本改动新增该字段）；WH `review-materials.mjs:372,2001,2007`（近似键）；BR `broker.mjs:582,586,587,590,592,707`（B4 request 路径；health 路径 PENDING）；WH `runtime/stage/stage-runner.mjs:1654-1694` `currentConfirmationCandidate`（复用谓词 :1661-1667；循环内 `evidence.ref` 前缀检查 :1681）+ `runtime/task/git-worktree-snapshot.mjs:503-526`（:524 委托、`isExecutionRecordOnlyMaterialDelta` 定义 :569）。
  - cancelManaged：BR `lib/broker.mjs:795` `cancelManaged(runtime_id)`；生产入口 `scripts/3rd-review.mjs:62`；WH 守卫 `tests/review/review-managed-lifecycle.test.mjs:378,433,478,507,540,584`；墙钟守卫块 `:526-558`（:540 位于其中，保持不改）；WH 客户端对象参数版 `review-provider-client.mjs:899`（生产调用 0，不用）；`simple-review-runner.mjs:574-582` 现“此处不调取消”。
  - merge：WH `review-provider-client.mjs:621-666`，精确集匹配 `:626`。
  - bounds：WH `runtime/review/review-input-bounds.mjs`（11417B）vs `skills/wh-review/scripts/review-input-bounds.mjs`（12702B）；skill 侧新增 fail-closed `MATERIAL_TOO_LARGE` throw `:109-111`（runtime 侧仅实现类 throw :95 对应段）。
  - 4.6：WH `runtime/stage/stage-content-contracts.mjs` `hasMarkdownHeadings:3511`（唯一判别，不动）；`specAnalyzeSkip` 初始化 :5962；跳过写入 :5990 与 :6011；`facts.spec_analyze` 透出 :6036；errors 写入 :5958/:5986/:6007。
  - 4.4：WH `runtime/review/review-output.mjs` `severityAliases:1-4`；未知 severity `if (!severity) return null` :24（静默丢弃）；`needsEvidence` :31。
  - 4.2：digest 分布在 `runtime/review/canonical-review-result.mjs`、`review-route-identity.mjs`、`review-record-route.mjs`、`stage-review-disposition.mjs`、`integration-review-subject.mjs`（`runtime/review/review-materials.mjs` 不存在）。
- **Existing interfaces**：BR `canonicalWorkflowHubMaterialId(files)`（`{target,size,sha256}` 入、`files` 含包装件时内部过滤）；WH `reviewPacketMaterialId(input,{instructionText,compactMaterials})`；BR `cancelManaged(runtime_id)`；WH 两 delta 谓词签名见 `git-worktree-snapshot.mjs:503-526,569-591`。
- **Read now**：spec §5/§7/§11/§12；本计划 File Boundary 与 Traceability。
- **Must read before task**：各卡 精确文件 列出的最小锚点；PENDING 项按卡内 Knowledge 现读现核。
- **Context mode**：Lite —— 改动为多点窄修，跨仓锚点已核实，无需全仓深读。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 跨仓材料标识 | extend | BR `lib/attachments.mjs:18-26`（权威）；WH `runtime/review/review-packet-identity.mjs:121-156`（改侧） | 对齐到公开 v3 算法并冻结（D-017/G-001）；比较保留 |
| 私有路径扫描面 | extend | BR `lib/workflowhub-result-v3.mjs:37,47,179`、`lib/broker.mjs:104-113` | 只缩扫描面为结构化字段，告警语义不变（红线 1） |
| 恢复/重发判定 | extend | BR `lib/recovery-policy.mjs`、`lib/broker.mjs:1243,1282,1387` | 去掉 review_mode 门，保留 PROCESS_TIMEOUT 门与重发上限 |
| 错误码保真 | extend | BR `lib/broker.mjs:441-474`、`lib/provider-failure.mjs:67`、`lib/adapters/antigravity.mjs:7-8` | 回到 `CONTEXT.md:282-283` 原始码保留合规；对外统一 `PROCESS_TIMEOUT` + `cause_code`（D-013） |
| 近似键处置 | extend | WH `skills/wh-review/scripts/review-materials.mjs:369-373,1997-2008` | warn+drop+显式事实，真禁止键仍失败（G-002） |
| 未锚定 finding 处置 | extend | WH `skills/wh-review/scripts/simple-review-runner.mjs:1470-1480` | finding 级缺陷语义，drop-fact 留痕（G-003） |
| 确认绑定读侧判别 | extend | WH `runtime/stage/stage-runner.mjs:1654-1694`、`runtime/task/git-worktree-snapshot.mjs:503-526,569-591` | 复用既有 delta 谓词做读侧对称，不新增绑定面 |
| 取消接线 | extend | BR `lib/broker.mjs:795` + `scripts/3rd-review.mjs:62`；WH `simple-review-runner.mjs:545-588` | 用 broker 侧 runtime_id 参数既有生产接口；对象参数版零生产调用不用 |
| 输入边界 | extend | WH `runtime/review/review-input-bounds.mjs` + `skills/wh-review/scripts/review-input-bounds.mjs:109-111` | 对齐宽松侧，删 skill 侧新增 fail-closed throw |
| 聚合健康预检消费 | new（窄） | 接入点 PENDING；生产面 `simple-review-runner.mjs:906-946`、`review-provider-client.mjs:180,621-666` | F-003 用户裁定纳入范围；consumer=阶段路由；owner=build-code；测试=最小 RED；删除条件=被经审查的替代机制取代 |
| 一次即熔断 | new（窄） | 接入点 PENDING；派发缝 `broker.mjs` dispatch / `review-material-change-redispatch` 行为 | F-003 用户裁定；同指纹不重复派发；consumer=审查派发；owner=build-code；测试=最小 RED；删除条件同上 |
| 显式丢弃事实（两合同） | new（字段已冻结） | spec §7 两张合同；落点在 review-materials / simple-review-runner | 字段名冻结不漂移（PFACT-05）；consumer=审查运行质量事实 |

## Solution Design

### Overview

第一步（P1）把 WH 侧 `reviewPacketMaterialId` 对齐到 BR 权威算法：对语义材料文件集，排除传输/审计包装件（`manifest.json`、`canonical-evidence.json` 及 WH 包内包装条目 `review-instructions.md`、`authenticated-evidence.json`），逐文件取 `{path, bytes, lowercase sha256}`，按 path UTF-8 字节序（`Buffer.compare`）升序，输出 `sha256(JSON.stringify(entries))`。4 个相等点保持严格比较不变。此步 unblock 全部审查派发。

第二步（P2/P3）按 D-015 处置清单做 5 项 REMOVE + 6 项 RELAX：BR 侧整组私有路径扫描收敛为成员级、删 `secret|data` token、去 review_mode 重发门、私有路径只扫结构化字段、身份降级保真（新增 `cause_code`）、协议不兼容区分多余/缺失；WH 侧删死常量、`EVIDENCE_ANCHOR_INVALID` 降级为 finding 级并记丢弃事实、近似键 warn+drop+显式事实、读侧确认绑定对称、删 provider 集精确匹配、两份 bounds 对齐宽松侧。

第三步（P4）接通取消：managed 等待循环在源漂移事实（`REVIEW_SOURCE_DRIFT`）下经既有生产路径（`scripts/3rd-review.mjs cancel` → `broker.cancelManaged(runtime_id)`）终止卡死成员；6 处“绝不调用”守卫改写为“仅源漂移事实下调用”，墙钟守卫块 `:526-558` 不动，另新增一条相邻断言禁止按墙钟调用。

第四步（P5）候选收口：4.2 按 behavior/governance 两轴拆 digest（确切拆分函数 build-code 内定位）；4.3 新增两个窄机制——同指纹一次即熔断、聚合健康预检结论被阶段路由消费（接入点 build-code 内确认）；4.4 未知 severity 从静默 `return null` 改为显式丢弃事实，歧义/多候选确定性规则在本计划成文并由 RED 锁定；4.7 按 live diff 8 文件收口，F4 对外统一 `PROCESS_TIMEOUT` + `cause_code`，其余逐项在 build-code 对照 live diff 核验。

### Module responsibilities

#### 审查派发装配（material_id）

- **Responsibility**：按冻结算法计算跨仓材料标识。
- **Consumes**：BR `canonicalWorkflowHubMaterialId` 契约（spec §5）；材料文件清单。
- **Produces**：两侧一致的 `material_id`；4 个相等点消费。
- **Must not decide**：不得取消比较；不得让任一侧消费另一侧摘要。

#### 审查运行与恢复（BR broker/result-v3/recovery + WH runner）

- **Responsibility**：执行审查、成员级结论、恢复重发、finding 处置。
- **Consumes**：冻结算法标识；恢复策略；finding 锚定校验。
- **Produces**：成员级结果（含部分成功）、显式丢弃事实、保真错误码。
- **Must not decide**：七条红线判定强度；错误码注册表收紧。

#### 取消接线

- **Responsibility**：源漂移事实下终止卡死成员。
- **Consumes**：BR `cancelManaged(runtime_id)` 既有生产接口。
- **Produces**：成员级终止结果（既有字段披露）。
- **Must not decide**：墙钟不触发取消；不缩短 20 分钟等待。

#### 阶段路由消费（4.3 新增窄机制）

- **Responsibility**：消费聚合健康预检结论；同指纹不重复派发。
- **Consumes**：预检结论对象（build-code 定形）；派发请求指纹。
- **Produces**：路由可用结论；熔断事实。
- **Must not decide**：不新增持久账本；不新增第二套 dispatcher。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：材料标识合同（spec §5 冻结文本）；两张显式丢弃事实合同（spec §7，字段名冻结）；`cause_code` 字段新增于 BR 降级错误对象；无新 wire 字段、无新持久 schema。
- **Data flow / state**：材料文件 → 标识（两侧独立计算）→ 派发信封比较 → 成员级结果/丢弃事实 → 质量事实归档。失败保留原错误码与 cause_code；缺失丢弃事实即判失败。
- **API contract**：BR 内部函数级改动，无公共 API 变化；WH 无 CLI 变化。N/A — reason：仅既有接口行为收敛。
- **UI / external code**：N/A — non_ui（D-012）。
- **Fail-loud behavior**：真禁止键、固定指令模板不符、必需键缺失、身份错绑仍 fail-loud；静默丢弃（无事实）在测试中判失败。

4.4 歧义/多候选确定性规则（成文，FR-CANDIDATE-003，D-021）：① severity 先经 `severityAliases` 规范化，未命中即为“未知 severity”；② 未知 severity finding 不进入结论，产一条显式丢弃事实（含原 severity 值、path/行号可得字段、原因 `unknown_severity`），绝不静默；③ 同一输出内多候选时按 JSONL 行序取首个通过结构校验的候选（既有单 fence/嵌套解析不变）；④ 结构校验失败候选跳过并留解析事实；⑤ 七条红线判定（含非 minor 证据三字段）强度不变。

## UI Delivery Contract (仅 UI phase/task 使用)

- **UI applicability**：`N/A — non_ui`（D-012 三输入实测 non_ui，无前端应用）。
- **Component action** ～ **Screenshot handoff**：N/A — reason：无 UI 改动。
- **Coverage limits**：全部 UI 验证范围不适用。
- **N/A / unknown reason**：仓库无可运行前端；本任务改动面在 `runtime/**`、`skills/wh-review/**`、3rd-review `lib/**`。

### Design-gap handoff (不改变 Design.md 权威)

- **design_status**：`not_approved` → 实际为 N/A — non_ui，无 Design.md 参与。其余字段全部 `N/A — reason：non_ui`。

## File Boundary

### NEW

- N/A — 不新增生产文件。仅允许在既有测试文件内新增最小测试用例（A3/B2/B5/E/4.2/4.3/4.4 的 RED）。

### MODIFY

- WH：`runtime/review/review-packet-identity.mjs`、`skills/wh-review/scripts/review-materials.mjs`（删 :57 死常量；近似键处置）、`skills/wh-review/scripts/simple-review-runner.mjs`（锚点降级+丢弃事实；取消接线）、`skills/wh-review/scripts/review-provider-client.mjs`（删 :626 精确集匹配）、`runtime/review/review-input-bounds.mjs`（对齐参照）、`skills/wh-review/scripts/review-input-bounds.mjs`（删 :109-111）、`runtime/stage/stage-runner.mjs`（读侧对称）、`runtime/task/git-worktree-snapshot.mjs`（仅当对称性需窄改）、`runtime/stage/stage-content-contracts.mjs`（4.6 跳过同时进 errors）、`runtime/review/review-output.mjs`（未知 severity 显式事实）、`runtime/review/canonical-review-result.mjs`、`runtime/review/review-route-identity.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/review/integration-review-subject.mjs`（4.2 拆分，确切函数 build-code 定位）、`tests/review/review-managed-lifecycle.test.mjs`（守卫改写+新增墙钟断言）。
- 测试（既有文件内新增/扩展断言）：`tests/contract/review-material-change-redispatch.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`tests/review/review-record-route.test.mjs`、`tests/contract/review-input-bounds-portability.test.mjs`、`tests/contract/review-layering.test.mjs`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`。
- BR：`lib/workflowhub-result-v3.mjs`（:200 组扫描、:32 token、:37/:47/:179 扫描面）、`lib/broker.mjs`（:1243/:1282/:1387 模式门、:104-113 深扫、:441-474 保真+新增 cause_code、:582-592/:707 B4）、`lib/recovery-policy.mjs`（:14/:26）、`lib/adapters/antigravity.mjs`（:7-8 对外码）、`lib/provider-failure.mjs`（:67 映射写 cause_code）；BR 测试 `test/broker.test.mjs`、`test/workflowhub-result-v3.test.mjs`、`test/recovery-policy.test.mjs`、`test/managed-session-lifecycle.test.mjs`、`test/attachments-protocol.test.mjs`、`test/provider-failure.test.mjs` 内新增最小断言。

### DO NOT TOUCH

- WH `skills/wh-review/scripts/review-materials.mjs:61` `PHASE_DIFF_INLINE_LIMIT_BYTES`（活消费者 :2038/:2133）与其余实现；`runtime/stage/stage-content-contracts.mjs:3511` `hasMarkdownHeadings`（唯一判别）；`simple-review-runner.mjs:40,521` 墙钟等待（G-004）；`review-provider-client.mjs:899` 对象参数 `cancelManaged`（零生产调用）；红线 ③⑥⑦ 相关判定（`simple-review-runner.mjs:184-201`、`workflowhub-result-v3.mjs:170,176,182`、`review-output.mjs` 证据三字段）。
- BR 侧除列明行外不动；`lib/broker.mjs:795` `cancelManaged` 签名不动。
- 归档目录、四份材料、既有质量事实（AGENTS.md 边界）。

## Technical Decisions

### DEC-001 — 材料标识对齐到 BR 公开 v3 算法并冻结

- **Problem**：两侧算法不同 + 严格相等 ⇒ 每次派发被拒（80 次事故）。
- **Options**：①对齐 BR 并冻结；②取消比较；③第三套规则。
- **Selected**：extend ①（D-017/G-001）。
- **Reason**：恢复独立可比性，最小改动（只改 WH 一侧实现）。
- **Consequence / risk**：v3 算法未提交（PFACT-03）；冻结后改动需再裁定 ⇒ 契约写进 spec §5 并由一致性测试钉住。
- **Fallback**：无 — 方向已裁定。
- **F10 disposition**：N/A — 非 new 机制。

### DEC-002 — 身份降级保真新增 `cause_code`

- **Problem**：降级时原始 provider 错误码被覆写为 `PUBLIC_RESULT_INVALID`（违 `CONTEXT.md:282-283`）。
- **Options**：①透传原码+cause_code；②保持覆写；③收紧注册表。
- **Selected**：extend ①（G-005 注册表保持开放；未知码透传标 unknown）。
- **Reason**：回原码保留合规，下游重发门不变。
- **Consequence / risk**：`cause_code` 为 BR lib 新字段（今日零命中），需 RED 锁定。
- **Fallback**：N/A。
- **F10 disposition**：N/A — 字段级扩展，非新机制。

### DEC-003 — 4.3 两窄机制（熔断 + 预检消费）

- **Problem**：同指纹重复派发浪费 provider 时间；聚合健康预检只写诊断不被路由消费（F-003 用户裁定纳入）。
- **Options**：①在派发缝新增窄机制；②复用既有 dispatcher 加状态。
- **Selected**：new ① —— owner=build-code；consumer=审查派发/阶段路由；test=最小 RED（最近既有测试文件）；删除条件=被经审查的替代机制取代。
- **Reason**：不复活第二套 dispatcher（ADR-0025），只在既有派发路径上加一次性熔断与结论消费。
- **Consequence / risk**：接入点 PENDING —— build-code 内定位并如实登记，不得伪造行号。
- **Fallback**：若接入点无法窄实现，STOP 回决策材料，不扩大面。
- **F10 real threat**：新增控制面被当成质量门阻断推进。
- **F10 existing cover**：宪法 F11 控制面受限条款 + 本计划登记 owner/consumer/删除条件。
- **F10 bypassable**：是 — 仅限派发路径，不碰记录与完成判据。
- **F10 maintenance cost**：低 — 一次性指纹去重 + 结论透传，无持久状态。
- **F10 disposition**：`simplify` —— 能复用既有 precheck 输出就不新造采集面。

### DEC-004 — 验收只用既有针对性测试 + 最小新行为断言

- **Problem**：用户拒绝任何新验收账本/采集面（D-016/D-022/D-023）。
- **Options**：①既有测试 + RED/GREEN 新断言；②前后计数。
- **Selected**：①。
- **Reason**：可证伪且不增维护面。
- **Consequence / risk**：NO_TEST_FOUND 项的 RED 由本计划显式作者在最近既有测试文件。
- **Fallback**：缺证据如实记 unknown/unavailable。
- **F10 disposition**：N/A。

## Deletion Proofs（删除证明）

本任务含 5 项 REMOVE，各项 deletion proof 如下（均有实测依据，非凭空删除）：

- **A1 整组私有路径扫描 → 成员级**：`3rd-review/lib/workflowhub-result-v3.mjs:200` 整组扫描判定移除；成员级扫描 `:179` 已存在。证明：组内单坏成员不再拖垮整组（部分成功），判别面不新增（T003/T004）。
- **A2 `secret|data` 正文 token 回退移除**：`workflowhub-result-v3.mjs:32` 的 `privatePathPattern` 中 `secret|data` token 删除，保留 fs 根与 `Library`。证明：合法 `/data`、`/secret` 正文不再误杀；未新增加严（T005/T006）。
- **A3 死常量 `PHASE_DIFF_MAX_DELIVERY_BYTES` 删除**：`skills/wh-review/scripts/review-materials.mjs:57` 经全仓反向引用扫描确认零 consumer；活 sibling `PHASE_DIFF_INLINE_LIMIT_BYTES`(:61) 保留。证明：删除后仍可导入、活 sibling 不受影响（T015/T016）。
- **A4 `review_mode` 重发门移除**：`3rd-review/lib/broker.mjs:1243,1282,1387` + `lib/recovery-policy.mjs:14,26` 的 review_mode 恢复门删除，保留 PROCESS_TIMEOUT 门与重发上限。证明：传输类问题确可重发、除超时外恢复关闭（T007/T008）。
- **A5 `EVIDENCE_ANCHOR_INVALID` 整轮升级移除**：`skills/wh-review/scripts/simple-review-runner.mjs:1470-1476` 未锚定 finding 由整轮 failed 改为 finding 级丢弃 + 显式事实。证明：单条未锚定 finding 不拖垮整轮、丢弃留痕（T017/T018）。

deletion proofs（删除证明）齐备；每项 REMOVE 均绑定同命令同 oracle 的 RED/GREEN 对，负例保留（真私有路径、真禁止键、活 sibling、全部未锚定场景仍按成员级/finding 级正确处置）。

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。两者使用同一 `gate_cmd` 和 oracle identity；`gate_cmd` 只是测试命令，不是工作许可证。**所有 WH gate_cmd 前置一次性 `npm ci`**（`node_modules` 缺失，research 已核实）。所有 BR gate_cmd 在 `/Users/Hugh/Hugh/Project/3rd-review` 下运行。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| AC-IDENTITY-001/002 | T001 | RED | `npx vitest run tests/contract/review-material-change-redispatch.test.mjs` / 1 | MATERIAL_IDENTITY_ALIGNED / `quality/evidence/build-code/material_identity/` |
| AC-IDENTITY-001/002 | T002 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-001 | T003 | RED | `node --test test/workflowhub-result-v3.test.mjs` / 1 | GROUP_SCAN_MEMBER_LEVEL / `quality/evidence/build-code/group_scan_member_level/` |
| AC-STRICT-001 | T004 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-002 | T005 | RED | `node --test test/workflowhub-result-v3.test.mjs` / 1 | BODY_TOKEN_REMOVED / `quality/evidence/build-code/body_token_removed/` |
| AC-STRICT-002 | T006 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-004 | T007 | RED | `node --test test/recovery-policy.test.mjs` / 1 | REVIEW_MODE_GATE_REMOVED / `quality/evidence/build-code/review_mode_gate_removed/` |
| AC-STRICT-004 | T008 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-007 | T009 | RED | `node --test test/workflowhub-result-v3.test.mjs` / 1 | PRIVATE_PATH_STRUCTURED_ONLY / `quality/evidence/build-code/private_path_structured_only/` |
| AC-STRICT-007 | T010 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-008 | T011 | RED | `node --test test/broker.test.mjs` / 1 | ERROR_CODE_PRESERVED / `quality/evidence/build-code/error_code_preserved/` |
| AC-STRICT-008 | T012 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-009 | T013 | RED | `node --test test/broker.test.mjs` / 1 | PROTOCOL_EXTRA_VS_MISSING / `quality/evidence/build-code/protocol_extra_vs_missing/` |
| AC-STRICT-009 | T014 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-003 | T015 | RED | `npx vitest run tests/contract/review-materials-contract.test.mjs` / 1 | DEAD_CONSTANT_REMOVED / `quality/evidence/build-code/dead_constant_removed/` |
| AC-STRICT-003 | T016 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-005/012 | T017 | RED | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / 1 | ANCHOR_DROP_FACT / `quality/evidence/build-code/anchor_drop_fact/` |
| AC-STRICT-005/012 | T018 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-006 | T019 | RED | `npx vitest run tests/contract/review-materials-contract.test.mjs` / 1 | NEAR_MISS_DROP_FACT / `quality/evidence/build-code/near_miss_drop_fact/` |
| AC-STRICT-006 | T020 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-010 | T021 | RED | `npx vitest run tests/review` / 1 | CONFIRMATION_READ_SYMMETRY / `quality/evidence/build-code/confirmation_read_symmetry/` |
| AC-STRICT-010 | T022 | GREEN | 同上 / 0 | 同上 |
| AC-STRICT-011, AC-BOUNDARY-002 | T023 | RED | `npx vitest run tests/review/review-managed-lifecycle.test.mjs` / 1 | HEALTH_SET_RELAXED / `quality/evidence/build-code/health_set_relaxed/` |
| AC-STRICT-011, AC-BOUNDARY-002 | T024 | GREEN | 同上 / 0 | 同上 |
| AC-BOUNDARY-001 | T025 | RED | `npx vitest run tests/contract/review-input-bounds-portability.test.mjs` / 1 | BOUNDS_ALIGNED_LOOSE / `quality/evidence/build-code/bounds_aligned_loose/` |
| AC-BOUNDARY-001 | T026 | GREEN | 同上 / 0 | 同上 |
| AC-CANDIDATE-006 | T027 | RED | `npx vitest run tests/review` / 1 | SKIP_GOES_TO_ERRORS / `quality/evidence/build-code/skip_goes_to_errors/` |
| AC-CANDIDATE-006 | T028 | GREEN | 同上 / 0 | 同上 |
| AC-CANDIDATE-003/004 | T029 | RED | `npx vitest run tests/contract/review-layering.test.mjs` / 1 | UNKNOWN_SEVERITY_DROP_FACT / `quality/evidence/build-code/unknown_severity_drop_fact/` |
| AC-CANDIDATE-003/004 | T030 | GREEN | 同上 / 0 | 同上 |
| AC-CANCEL-001/002 | T031 | RED | `npx vitest run tests/review/review-managed-lifecycle.test.mjs` / 1 | CANCEL_ON_SOURCE_DRIFT_ONLY / `quality/evidence/build-code/cancel_on_source_drift_only/` |
| AC-CANCEL-001/002 | T032 | GREEN | 同上 / 0 | 同上 |
| AC-CANDIDATE-001 | T033 | RED | `npx vitest run tests/contract/review-material-change-redispatch.test.mjs` / 1 | DIGEST_TWO_AXIS_SPLIT / `quality/evidence/build-code/digest_two_axis_split/` |
| AC-CANDIDATE-001 | T034 | GREEN | 同上 / 0 | 同上 |
| AC-CANDIDATE-007 | T035 | RED | `npx vitest run tests/contract/review-material-change-redispatch.test.mjs` / 1 | SAME_FINGERPRINT_CIRCUIT_BREAK / `quality/evidence/build-code/same_fingerprint_circuit_break/` |
| AC-CANDIDATE-007 | T036 | GREEN | 同上 / 0 | 同上 |
| AC-CANDIDATE-008 | T037 | RED | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / 1 | HEALTH_PRECHECK_CONSUMED / `quality/evidence/build-code/health_precheck_consumed/` |
| AC-CANDIDATE-008 | T038 | GREEN | 同上 / 0 | 同上 |
| AC-CANDIDATE-002 | T039 | RED | `node --test test/provider-failure.test.mjs` / 1 | OUTWARD_PROCESS_TIMEOUT_ONLY / `quality/evidence/build-code/outward_process_timeout_only/` |
| AC-CANDIDATE-002 | T040 | GREEN | 同上 / 0 | 同上 |
| AC-CANDIDATE-005 | T041 | N/A — 逐项落地核验 | `node --test test/attachments-protocol.test.mjs test/managed-session-lifecycle.test.mjs` + `node --test test/workflowhub-result-v3.test.mjs` / 0 | CANDIDATE_LANDING_ITEMS / `quality/evidence/build-code/candidate_landing_items/` |
| 全部 26 AC | T042 | FINAL | 见下 / 0 | ORACLE-FINAL / `quality/evidence/build-code/final/` |

FINAL（T042）聚合命令（WH，前置 `npm ci`）：
`npx vitest run tests/contract/review-material-change-redispatch.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/review/review-record-route.test.mjs tests/contract/review-input-bounds-portability.test.mjs tests/contract/review-layering.test.mjs tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
+ BR：`node --test test/broker.test.mjs test/workflowhub-result-v3.test.mjs test/recovery-policy.test.mjs test/managed-session-lifecycle.test.mjs test/attachments-protocol.test.mjs test/provider-failure.test.mjs`。expected_exit=0；26 项 AC 逐项有真实满足证据，任一未执行/失败阻止“全部验证完成”声明。

所有 RED 必须由预定行为断言失败产生，不以 import/fixture/setup 失败代替；GREEN 用同一命令并保留负例。

## Rollback and Recovery

- **Global recovery rule**：只回滚本次实现改动，保留四份材料、既有质量事实与全部失败证据；WH/BR 各自按文件回滚。
- **Irreversible boundaries**：BR commit 仅限独立分支且不 push（授权随重新签发延续）；push/merge/archive 不在授权内（D-011）。
- **Recovery owner**：各卡执行者恢复本卡改动；PENDING 接入点定位失败回 plan owner 补设计，不静默扩面。

### Engineering Risk Handoff

- **PLAN-RISK-001**：BR v3 算法未提交（PFACT-03/RISK-01）
  - **Affected IDs**：FR-IDENTITY-001/002 / AC-IDENTITY-001/002 / T001/T002
  - **Trigger**：上游丢弃工作树或改算法
  - **Consequence**：两侧标识再不一致
  - **Mitigation or STOP**：冻结契约 + 一致性测试钉值；改动需再裁定
  - **Handling Stage**：build-code
  - **Verification**：同一材料包两侧同值测试
- **PLAN-RISK-002**：PENDING 接入点定位失败（4.2/4.3/4.7/B4-health）
  - **Affected IDs**：FR-CANDIDATE-001/005/007/008、FR-STRICT-009 / T013/T014、T033～T041
  - **Trigger**：build-code 找不到窄接入点
  - **Consequence**：无法诚实落地
  - **Mitigation or STOP**：STOP 回材料 owner，不伪造行号、不扩大机制
  - **Handling Stage**：build-code
  - **Verification**：落地行号回填 tasks 完成区
- **PLAN-RISK-003**：丢弃事实字段漂移（PFACT-05）
  - **Affected IDs**：FR-STRICT-006/012 / T017～T020
  - **Trigger**：实现自定字段名
  - **Consequence**：消费方（审查运行质量事实）破裂
  - **Mitigation or STOP**：字段名以 spec §7 冻结合同为准
  - **Handling Stage**：build-code
  - **Verification**：RED 断言字段名逐字
- **PLAN-RISK-004**：守卫改写引入墙钟取消
  - **Affected IDs**：FR-CANCEL-002 / T031/T032
  - **Trigger**：改写误触 :526-558 块
  - **Consequence**：违 D-030③/G-004
  - **Mitigation or STOP**：墙钟块不改，仅新增相邻断言
  - **Handling Stage**：build-code
  - **Verification**：墙钟用例原样通过 + 新断言存在

## Implementation Order

P1（T001→T002）→ P2（T003→…→T014）→ P3（T015→…→T030）→ P4（T031→T032）→ P5（T033→…→T041→T042）。P1 先行 unblock 派发；同 Phase 内 RED→GREEN 串行；P2 全在 BR、P3 全在 WH，可分仓并行推进但卡内串行；P4 依赖 P3 的 runner/客户端收敛；P5 的 4.3 熔断依赖 P1 标识稳定；FINAL 最后一次性聚合。

## Dependencies and Parallelism

- **Dependencies**：T002→T001… 逐对 RED→GREEN；T021/T022 依赖 T001/T002（读侧判别消费标识稳定）；T031/T032 依赖 T017/T018（runner 处置收敛）与 BR cancelManaged（已存在）；T035/T036 依赖 T001/T002；T042 依赖全部前序。
- **Parallel work**：P2（BR）与 P3（WH）文件所有权不重叠，可并行；同文件内的卡串行。
- **External dependencies**：BR 工作树未提交改动为唯一真实来源（absence semantics：无稳定提交点可钉，RISK-01 已登记）。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-001/D-017/G-001 | FR-IDENTITY-001, FR-IDENTITY-002 | AC-IDENTITY-001, AC-IDENTITY-002 | P1/T001,T002 | none | `runtime/review/review-packet-identity.mjs`、`tests/contract/review-material-change-redispatch.test.mjs` | MATERIAL_IDENTITY_ALIGNED（命令见 Test Strategy） |
| R-001/D-015 | FR-STRICT-001 | AC-STRICT-001 | P2/T003,T004 | T002 | `lib/workflowhub-result-v3.mjs`（BR）、`test/workflowhub-result-v3.test.mjs` | GROUP_SCAN_MEMBER_LEVEL |
| R-001/D-015 | FR-STRICT-002 | AC-STRICT-002 | P2/T005,T006 | T004 | `lib/workflowhub-result-v3.mjs`（BR）、`test/workflowhub-result-v3.test.mjs` | BODY_TOKEN_REMOVED |
| R-001/D-015 | FR-STRICT-004 | AC-STRICT-004 | P2/T007,T008 | T006 | `lib/broker.mjs`、`lib/recovery-policy.mjs`（BR）、`test/recovery-policy.test.mjs` | REVIEW_MODE_GATE_REMOVED |
| R-001/D-015 | FR-STRICT-007 | AC-STRICT-007 | P2/T009,T010 | T008 | `lib/workflowhub-result-v3.mjs`、`lib/broker.mjs`（BR）、`test/workflowhub-result-v3.test.mjs` | PRIVATE_PATH_STRUCTURED_ONLY |
| R-001/D-015/G-005 | FR-STRICT-008 | AC-STRICT-008 | P2/T011,T012 | T010 | `lib/broker.mjs`（BR）、`test/broker.test.mjs` | ERROR_CODE_PRESERVED |
| R-001/D-015 | FR-STRICT-009 | AC-STRICT-009 | P2/T013,T014 | T012 | `lib/broker.mjs`（BR）、`test/broker.test.mjs` | PROTOCOL_EXTRA_VS_MISSING（health 路径 PENDING） |
| R-001/D-015 | FR-STRICT-003 | AC-STRICT-003 | P3/T015,T016 | T002 | `skills/wh-review/scripts/review-materials.mjs`、`tests/contract/review-materials-contract.test.mjs` | DEAD_CONSTANT_REMOVED |
| R-001/D-015/G-003 | FR-STRICT-005, FR-STRICT-012 | AC-STRICT-005, AC-STRICT-012 | P3/T017,T018 | T016 | `skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` | ANCHOR_DROP_FACT |
| R-001/D-015/G-002 | FR-STRICT-006 | AC-STRICT-006 | P3/T019,T020 | T018 | `skills/wh-review/scripts/review-materials.mjs`、`tests/contract/review-materials-contract.test.mjs` | NEAR_MISS_DROP_FACT |
| R-001/D-015 | FR-STRICT-010 | AC-STRICT-010 | P3/T021,T022 | T002 | `runtime/stage/stage-runner.mjs`、`runtime/task/git-worktree-snapshot.mjs`、`tests/review/` | CONFIRMATION_READ_SYMMETRY |
| R-010/D-015/F-010 | FR-STRICT-011, FR-BOUNDARY-002 | AC-STRICT-011, AC-BOUNDARY-002 | P3/T023,T024 | T022 | `skills/wh-review/scripts/review-provider-client.mjs`、`tests/review/review-managed-lifecycle.test.mjs` | HEALTH_SET_RELAXED |
| R-003/D-015 | FR-BOUNDARY-001 | AC-BOUNDARY-001 | P3/T025,T026 | T024 | `runtime/review/review-input-bounds.mjs`、`skills/wh-review/scripts/review-input-bounds.mjs`、`tests/contract/review-input-bounds-portability.test.mjs` | BOUNDS_ALIGNED_LOOSE |
| R-004/D-007/D-010 | FR-CANDIDATE-006 | AC-CANDIDATE-006 | P3/T027,T028 | T026 | `runtime/stage/stage-content-contracts.mjs`、`tests/review/` | SKIP_GOES_TO_ERRORS |
| R-004/D-005/D-006/D-021 | FR-CANDIDATE-003, FR-CANDIDATE-004 | AC-CANDIDATE-003, AC-CANDIDATE-004 | P3/T029,T030 | T028 | `runtime/review/review-output.mjs`、`tests/contract/review-layering.test.mjs` | UNKNOWN_SEVERITY_DROP_FACT |
| R-002/D-005 | FR-CANCEL-001, FR-CANCEL-002 | AC-CANCEL-001, AC-CANCEL-002 | P4/T031,T032 | T018,T024 | `skills/wh-review/scripts/simple-review-runner.mjs`、`tests/review/review-managed-lifecycle.test.mjs`、BR `lib/broker.mjs` | CANCEL_ON_SOURCE_DRIFT_ONLY |
| R-004/D-004/D-020 | FR-CANDIDATE-001 | AC-CANDIDATE-001 | P5/T033,T034 | T002 | `runtime/review/canonical-review-result.mjs`、`runtime/review/review-route-identity.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/review/integration-review-subject.mjs`、`tests/contract/review-material-change-redispatch.test.mjs` | DIGEST_TWO_AXIS_SPLIT（拆分函数 PENDING） |
| R-004/F-003 | FR-CANDIDATE-007 | AC-CANDIDATE-007 | P5/T035,T036 | T002 | 派发缝（build-code 定位）、`tests/contract/review-material-change-redispatch.test.mjs` | SAME_FINGERPRINT_CIRCUIT_BREAK（接入点 PENDING） |
| R-004/F-003 | FR-CANDIDATE-008 | AC-CANDIDATE-008 | P5/T037,T038 | T036 | `skills/wh-review/scripts/simple-review-runner.mjs`（:906-946 预检面）、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` | HEALTH_PRECHECK_CONSUMED（路由接入点 PENDING） |
| R-004/D-013 | FR-CANDIDATE-002 | AC-CANDIDATE-002 | P5/T039,T040 | T014 | `lib/adapters/antigravity.mjs`、`lib/provider-failure.mjs`（BR）、`test/provider-failure.test.mjs` | OUTWARD_PROCESS_TIMEOUT_ONLY |
| R-004/D-008 | FR-CANDIDATE-005 | AC-CANDIDATE-005 | P5/T041 | T040 | BR live diff 8 文件 | CANDIDATE_LANDING_ITEMS（逐项映射 build-code 核验） |
| R-001～R-011 / D-001～D-024 | 全部 26 FR | 全部 26 AC | P5/T042 | T041 | 全部 MODIFY | ORACLE-FINAL（命令见 Test Strategy） |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 宪法与四材料 | CONSTITUTION.md、constitution-checklist.md、decision-log.md、spec.md | no change | 全部 | 只消费已定方向 |
| ADR | `docs/adr/0031-review-check-downgrade-and-identity-boundary.md` | no change（make-decision 已立） | 全部 | 本计划引用其决定行 |
| 技能说明 | `skills/wh-review/SKILL.md`、`contracts/provider-protocol.md` | change（如实现改变对外说明） | T002/T012/T018/T020/T032 | 说明跟随行为收敛，不新增协议 |
| 公开 CLI/公共流程 | `tools/cli/stage-runtime.mjs` | no change | 全部 | 七类公共行为不变（AGENTS.md 边界） |
| 3rd-review 工作树 | 5 lib + 3 test | change | T003～T014、T039～T041 | D-011 授权范围内改动 |
| move-map 登记 | `docs/architecture/move-map.json` | no change | 全部 | 无新增生产文件 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"91c72a0db7a77da84369d0aada56105612c21def13761f6aa7db387b8922f434","id":"CONSTITUTION","version":"1.9.0","clause_count":22}`
- **F1**：核心只做调度；改动在技能/适配层与 BR lib，核心零业务新增。
- **F2**：模块间窄接口（标识函数、delta 谓词、cancelManaged）不变宽。
- **F3**：四材料只定推进；实现失败 fail-loud（真禁止键/必需键/身份错绑）。
- **F4**：审查建议仍独立异源；本任务不阶段 gate；unavailable 不漂白。
- **F5**：无新增 gate；只拆实测阻塞判定。
- **F6**：执行记录外置不动；报告 create-only。
- **F7**：build-plan 本阶段确认；BR commit 不 push 已授权；push 仍 unauthorized。
- **F8**：复用既有算法/谓词/接口，最小改动。
- **F9**：RED 由目标断言失败产生；unknown/unavailable 不假绿；PENDING 如实登记。
- **F10**：DEC-003 新机制逐项登记威胁/覆盖/绕过/成本，倾向 simplify。
- **F11**：新窄机制（熔断/预检消费/丢弃事实）登记 owner/consumer/test/删除条件。
- **Q1**：质量事实不作准入；缺证据记 unknown。
- **Q2**：推进/发布/完成判据分离；FINAL 聚合是验证不是许可证。
- **Q3**：质量裁决仍靠异源审查与人；本地测试只证行为事实。
- **S1**：无新轮子，Node 内建 + 既有测试栈。
- **S2**：BR 仓内改造在授权边界内。
- **S3**：锚点就地核实并记录来源（/tmp/plan-research.md 可溯）。
- **S4**：无新指标采集面（D-016）。
- **S5**：重活可派子代理；锚点已核。
- **S6**：参考既有 review 研究记录（docs/research 事件记录）。
- **S7**：不新增阶段/技能目录。
- **S8**：技能可独立调用性不受影响。

## Phase P1 — 跨仓材料标识对齐

### Goal

WH 侧 `reviewPacketMaterialId` 产出与 BR `canonicalWorkflowHubMaterialId` 对同一语义材料集完全相同的标识；4 个相等点比较保留，派发不再因标识不等被拒。

### Files

- **NEW**：N/A — 不新增文件
- **MODIFY**：`runtime/review/review-packet-identity.mjs`、`tests/contract/review-material-change-redispatch.test.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/review-materials.mjs:840-843`（已核实无需改）、4 个相等点比较语义

### Tasks

- `T001`：RED 冻结向量断言（两侧同值）；Files：`tests/contract/review-material-change-redispatch.test.mjs`
- `T002`：GREEN 对齐 :121-156 到 BR 权威算法；Files：`runtime/review/review-packet-identity.mjs` + 同测试

### Verify

`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`（前置 `npm ci`）；RED=1/GREEN=0；MATERIAL_IDENTITY_ALIGNED；`quality/evidence/build-code/material_identity/`。

### Knowledge

冻结合同（spec §5）：排除包装件、`{path,bytes,lowercase sha256}`、UTF-8 字节序、sha256(JSON array)；BR 权威 `attachments.mjs:18-26` 不动。

### STOP

上游改算法或丢工作树 → STOP 回决策材料；需要取消比较 → 违宪，STOP。

### Done

同包同值测试通过；派发不再报标识不兼容；比较 intact。

### Risks and rollback

PLAN-RISK-001：仅回滚 `review-packet-identity.mjs` 改动，保留 RED 证据。

## Phase P2 — 3rd-review 严格判定拆除与放宽

### Goal

BR 侧完成 A1/A2/A4 拆除与 B1/B2/B4 放宽；成员级结果、保真错误码、协议多余/缺失区分落地。

### Files

- **NEW**：N/A
- **MODIFY**：BR `lib/workflowhub-result-v3.mjs`、`lib/broker.mjs`、`lib/recovery-policy.mjs`；BR `test/workflowhub-result-v3.test.mjs`、`test/recovery-policy.test.mjs`、`test/broker.test.mjs`、`test/workflowhub-result-v3.test.mjs`、`test/recovery-policy.test.mjs`、`test/broker.test.mjs`
- **DO NOT TOUCH**：`lib/broker.mjs:795` 签名；红线 ⑥ 必需键判定（`:170,176,182`）

### Tasks

- `T003`/`T004`：组级私有路径扫描→成员级（FR-STRICT-001）
- `T005`/`T006`：删 `secret|data` token（FR-STRICT-002）
- `T007`/`T008`：去 review_mode 重发门（FR-STRICT-004）
- `T009`/`T010`：私有路径只扫结构化字段（FR-STRICT-007）
- `T011`/`T012`：身份降级保真+cause_code（FR-STRICT-008；RED 新增于 test/broker.test.mjs）
- `T013`/`T014`：协议不兼容区分多余/缺失（FR-STRICT-009；health 路径 PENDING 登记）

### Verify

各卡 gate_cmd 见 Test Strategy；RED=1/GREEN=0；证据落各 oracle 目录。

### Knowledge

BR 测试栈 `node --test`；B2 的 `cause_code` 为新增字段，BR lib 今日零命中。

### STOP

需要改红线判定强度或公共 broker API → STOP 回决策材料。

### Done

6 对 RED/GREEN 通过；负例保留（坏成员仍成员级失败、真私有路径结构化字段仍告警）。

### Risks and rollback

PLAN-RISK-002：B4 health 路径找不到窄位点时 STOP，不臆造。

## Phase P3 — workflowhub 严格判定收敛

### Goal

WH 侧完成 A3/A5 拆除、B3/B5/E/F 放宽、4.6/4.4 收口；两张丢弃事实合同落地。

### Files

- **NEW**：N/A
- **MODIFY**：WH `skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/review-input-bounds.mjs`、`runtime/review/review-input-bounds.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/task/git-worktree-snapshot.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/review/review-output.mjs` + 既有测试文件、`tests/contract/review-materials-contract.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`tests/contract/review-material-change-redispatch.test.mjs`、`tests/review/review-managed-lifecycle.test.mjs`、`tests/contract/review-input-bounds-portability.test.mjs`、`tests/review/review-record-route.test.mjs`、`tests/contract/review-layering.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/review-input-bounds.mjs`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
- **DO NOT TOUCH**：`:61` 活常量、`hasMarkdownHeadings:3511`、墙钟等待、对象参数 cancelManaged、红线 ③⑦

### Tasks

- `T015`/`T016`：删死常量（FR-STRICT-003）
- `T017`/`T018`：锚点无效降级+丢弃事实（FR-STRICT-005/012）
- `T019`/`T020`：近似键 warn+drop+事实（FR-STRICT-006）
- `T021`/`T022`：确认绑定读侧对称（FR-STRICT-010）
- `T023`/`T024`：删 provider 集精确匹配（FR-STRICT-011/FR-BOUNDARY-002）
- `T025`/`T026`：bounds 对齐宽松侧（FR-BOUNDARY-001）
- `T027`/`T028`：4.6 跳过同时进 errors（FR-CANDIDATE-006）
- `T029`/`T030`：未知 severity 显式事实+规则成文（FR-CANDIDATE-003/004）

### Verify

各卡 gate_cmd 见 Test Strategy；RED=1/GREEN=0。

### Knowledge

丢弃事实字段以 spec §7 为准；B5/E 为 NO_TEST_FOUND，RED 已设计进既有文件。

### STOP

需要新增判别面/账本/加严 → STOP。

### Done

8 对 RED/GREEN 通过；死常量零 consumer 证据保留；墙钟/红线 untouched。

### Risks and rollback

PLAN-RISK-003：字段名漂移即回滚对应卡。

## Phase P4 — cancelManaged 接线

### Goal

源漂移事实下经既有生产接口终止卡死成员；6 处守卫改写 + 新增墙钟禁止断言；墙钟块 `:526-558` 不动。

### Files

- **NEW**：N/A
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`、`tests/review/review-managed-lifecycle.test.mjs`
- **DO NOT TOUCH**：墙钟守卫块 `:526-558`；BR `lib/broker.mjs:795`

### Tasks

- `T031`：RED 源漂移下调取消 + 墙钟不调（新相邻断言）+ 守卫改写目标
- `T032`：GREEN 接通取消 + 改写 :378/:433/:478/:507/:584（:540 所在墙钟块不改）

### Verify

`npx vitest run tests/review/review-managed-lifecycle.test.mjs`；RED=1/GREEN=0；CANCEL_ON_SOURCE_DRIFT_ONLY。

### Knowledge

生产路径 `scripts/3rd-review.mjs:62`；对象参数版不用；披露只用既有成员级字段。

### STOP

需要按墙钟取消或缩短等待 → STOP（违 G-004）。

### Done

源漂移用例调、墙钟用例不调；新断言存在；既有字段披露。

### Risks and rollback

PLAN-RISK-004：误触墙钟块即回滚本 Phase。

## Phase P5 — 候选收口与最终聚合

### Goal

4.2 两轴 digest、4.3 熔断+预检消费、4.7 八项落地（含 F4 错误码统一）；FINAL 一次聚合 26 AC。

### Files

- **NEW**：N/A
- **MODIFY**：`runtime/task/material-workspace.mjs`、`runtime/review/integration-review-subject.mjs`、`tests/contract/material-workspace.test.mjs`、`tests/contract/integration-review-subject.test.mjs`、`runtime/review/review-record-route.mjs`、`tests/contract/review-material-change-redispatch.test.mjs`、`tests/review/review-record-route.test.mjs`、BR `lib/adapters/antigravity.mjs`、`lib/provider-failure.mjs` + 既有测试、`skills/wh-review/scripts/simple-review-runner.mjs`、`test/managed-session-lifecycle.test.mjs`、`test/attachments-protocol.test.mjs`、`test/workflowhub-result-v3.test.mjs`
- **DO NOT TOUCH**：无新 wire 字段/第二套摘要

### Tasks

- `T033`/`T034`：digest 两轴拆分（FR-CANDIDATE-001；`material-workspace.mjs` producer + `integration-review-subject.mjs` behavior consumer）
- `T035`/`T036`：同指纹熔断（FR-CANDIDATE-007；接入点 PENDING）
- `T037`/`T038`：聚合健康预检被路由消费（FR-CANDIDATE-008；接入点 PENDING）
- `T039`/`T040`：对外只产 PROCESS_TIMEOUT + cause_code（FR-CANDIDATE-002）
- `T041`：N/A — 4.7 八项落地核验（FR-CANDIDATE-005）
- `T042`：FINAL 聚合（全部 26 AC）

### Verify

各卡 gate_cmd 见 Test Strategy；T042 FINAL 命令聚合 WH+BR 全量受影响测试；expected_exit=0。

### Knowledge

治理摘要继续使用现有 `material_digest` 原始字节语义；行为摘要只在内部 review subject 使用，格式归一化规则与历史只读兼容见当前 `spec.md` FR-CANDIDATE-001。4.7 逐项对照 live diff。

### STOP

PENDING 接入点无法窄实现 → STOP 回 plan owner。

### Done

候选收口与修复后聚合测试通过；review/provider `unavailable` 仍单独保留，不改写为 pass。

### Risks and rollback

PLAN-RISK-002：回滚对应卡，保留 PARTIAL 证据。
