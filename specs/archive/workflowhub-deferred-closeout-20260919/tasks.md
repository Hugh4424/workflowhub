# 任务清单：审查管线阻断解除与严格判定收敛

- **Input**：`specs/workflowhub-deferred-closeout-20260919/decision-log.md`、`specs/workflowhub-deferred-closeout-20260919/spec.md`、`specs/workflowhub-deferred-closeout-20260919/plan.md`
- **Template version**：`plan-task.v4`

## 全局执行约束（全部 gate_cmd 适用）

- **WH gate_cmd 全局前置**：WH 任务 worktree 必须先一次性执行 `npm ci`（`node_modules` 缺失，research 已核实）。此后每条 WH `gate_cmd` 均为 `npx vitest run <path>`。
- **BR gate_cmd**：在 `/Users/Hugh/Hugh/Project/3rd-review` 下运行 `node --test test/<file>.test.mjs`（BR 未提交工作树为唯一真实来源）。
- 只跑受影响针对性测试（AGENTS.md 硬规则）；验收只用既有针对性测试 + 最小新行为断言，不做前后计数（D-016/D-022）。
- 所有 RED 必须由预定行为断言失败产生，不以 import/fixture/setup 失败代替；GREEN 用同一命令并保留负例。
- RED 的 `依赖` 为 none；GREEN 的 `依赖` 为其配对的 RED。新增测试只允许写在既有测试文件内，不新增生产文件。

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#决定`（D-001～D-024）与 `#严格判定处置清单` | 已确认方向：5 REMOVE + 6 RELAX、material_id 对齐冻结、cancelManaged 接线、4.2/4.3/4.4/4.6/4.7 收口、非目标与红线 | M 定方向时；S/B 每 Phase 开工前 |
| `spec.md#5 功能需求`（FR-STRICT/IDENTITY/CANDIDATE/CANCEL/BOUNDARY 共 26 条） | 产品行为、范围边界、依据与场景 | S/B 写卡与实现前 |
| `spec.md#11 验收标准`（AC 共 26 条）与 `#7 关键实体`（两张显式丢弃事实合同） | 逐条 oracle、通过/失败判据、丢弃事实字段冻结 | B 逐卡核对；P 最终聚合时 |
| `spec.md#12 风险、未决与交接`（RISK-01/02、OPEN-01、七条红线） | 红线不动、墙钟不动、标识算法冻结边界 | M/S 遇边界判断时 |
| `plan.md#Code Anchors`、`#Solution Design`、`#Phase P1～P5`、`#Test Strategy`、`#Requirement and Verification Traceability` | 工程方案、精确锚点、gate_cmd/oracle/evidence_path、依赖与恢复策略 | S/B 执行卡时 |
| `tasks.md#Phase P1～P5`、`#Dependency Graph`、`#Final Boundary Check` | 可执行卡、gate_cmd、完成记录 | B/P 逐卡执行与核对 |

## Phase P1 — 跨仓材料标识对齐

### Goal

WH 侧 `reviewPacketMaterialId` 产出与 BR `canonicalWorkflowHubMaterialId` 对同一语义材料集完全相同的标识；4 个相等点比较保留，派发不再因标识不等被拒。

### Files

- **NEW**：N/A — 不新增文件
- **MODIFY**：`runtime/review/review-packet-identity.mjs`、`tests/contract/review-material-change-redispatch.test.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/review-materials.mjs:840-843`（已核实无需改）、4 个相等点比较语义

### Tasks

#### T001 — RED：冻结向量断言（两侧同值）

- **ID**：T001
- **Phase**：Phase P1 — 跨仓材料标识对齐
- **goal**：在既有契约测试内新增冻结向量断言，使“WH `reviewPacketMaterialId` 与 BR `canonicalWorkflowHubMaterialId` 对同一语义材料集产出同值”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-017 / G-001 → FR-IDENTITY-001, FR-IDENTITY-002 → AC-IDENTITY-001, AC-IDENTITY-002
- **输入**：spec.md §5 冻结合同；plan.md Code Anchors 与 Test Strategy
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-IDENTITY-001, FR-IDENTITY-002
- **AC**：AC-IDENTITY-001, AC-IDENTITY-002
- **动作**：在 `tests/contract/review-material-change-redispatch.test.mjs` 内新增冻结向量断言（WH `reviewPacketMaterialId` 与 BR `canonicalWorkflowHubMaterialId` 对同一语义材料集产出同值），不改生产实现
- **精确文件**：`tests/contract/review-material-change-redispatch.test.mjs`
- **boundary**：files: `tests/contract/review-material-change-redispatch.test.mjs`; symbols/regions: 仅允许在该测试文件内新增测试用例与断言
- **输出**：RED 证据：目标断言失败（exit 1），保留原始输出
- **Knowledge**：冻结合同（spec §5）：排除传输/审计包装件（`manifest.json`、`canonical-evidence.json` 及 WH 包内 `review-instructions.md`、`authenticated-evidence.json` 条目）、逐文件 `{path, bytes, lowercase sha256}`、按 path UTF-8 字节序（`Buffer.compare`）升序、输出 `sha256(JSON.stringify(entries))`；BR 权威 `lib/attachments.mjs:18-26` 不动
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：1
- **oracle**：`MATERIAL_IDENTITY_ALIGNED` — 目标断言失败信号：两侧同值向量断言失败
- **evidence_path**：`quality/evidence/build-code/material_identity/`
- **STOP**：命令损坏、环境失败（缺一次性 `npm ci`）、需改 spec 冻结合同或取消比较时停止（取消比较违宪）
- **recovery**：卡执行者修复命令/环境后重跑；材料级问题回 plan owner
- **task risk**：错误 RED（import/fixture/setup 失败冒充断言失败）；向量未覆盖包装件排除分支
- **test tier / test method**：simple — 既有契约测试文件内的最小行为断言（RED/GREEN 对），无 UI/服务依赖
- **scenarios / commands / expected exit / oracle**：成功场景=目标断言失败（exit 1，oracle MATERIAL_IDENTITY_ALIGNED）；GREEN 后同命令 exit 0；负例=两侧算法不同值时必失败
- **fixtures_services**：WH 认证 worktree；前置一次性 `npm ci`；`npx vitest`；无外部服务、无新增 fixture
- **coverage limits**：仅覆盖标识对齐冻结向量；不覆盖派发端到端、不覆盖 BR 运行时行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 `tests/contract/review-material-change-redispatch.test.mjs` 新增冻结语义材料向量与不同材料负例；未改生产实现。
- **executed_commands**：通过 public `verify --action=execute` 执行 `npx vitest run tests/contract/review-material-change-redispatch.test.mjs`；RED exit 1，目标向量断言失败且其余 6 tests passed；配对 GREEN 后同命令 exit 0。
- **evidence_refs**：RED receipt `quality/tests/build-code-p1-t001-red.json`，output `quality/tests/output/build-code-p1-t001-red.output`，output_sha256=`74e69559e4569cb6878a32d4663c78854b015f2c2b39aaa704831bedad5ffa86`；配对 GREEN `quality/tests/build-code-p1-t002-green-v2.json`。
- **covered_ac**：`AC-IDENTITY-001`、`AC-IDENTITY-002`；RED 证明原实现把非语义 wrapper 算入，GREEN 由 T002 完成。
- **review_fact**：P1 phase review 已通过 public `review --action=record` 记录为 `unavailable`，attempt=`quality/reviews/attempts/c62ae02d-7254-5b53-a0d6-b225736daf46/attempt.json`，error=`PROTOCOL_INCOMPATIBLE`，provider 未启动、无 findings；不能当作 review pass。
- **completed_at**：2026-09-19T16:11:34+0800
- **执行事实**：T001 RED 与 T002 GREEN 的配对行为事实已记录；review transport unavailable 保留原样。

#### T002 — GREEN：对齐 reviewPacketMaterialId 到 BR 权威算法

- **ID**：T002
- **Phase**：Phase P1 — 跨仓材料标识对齐
- **goal**：使 T001 的冻结向量断言通过并保留负例（算法不同值则必失败）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-017 / G-001 → FR-IDENTITY-001, FR-IDENTITY-002 → AC-IDENTITY-001, AC-IDENTITY-002
- **输入**：T001 的失败断言和已核实实现锚点（BR `lib/attachments.mjs:18-26` 权威算法）
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-IDENTITY-001, FR-IDENTITY-002
- **AC**：AC-IDENTITY-001, AC-IDENTITY-002
- **动作**：对齐 `runtime/review/review-packet-identity.mjs:121-156` `reviewPacketMaterialId` 到 BR 权威 v3 算法：排除包装件、逐文件 `{path, bytes, lowercase sha256}`、UTF-8 字节序升序、`sha256(JSON.stringify(entries))`；4 个相等点（`review-provider-client.mjs:687`、`simple-review-runner.mjs:680,1397`、`review-record-route.mjs:146`）保留严格比较
- **精确文件**：`runtime/review/review-packet-identity.mjs`、`tests/contract/review-material-change-redispatch.test.mjs`
- **boundary**：files: `runtime/review/review-packet-identity.mjs`; symbols/regions: 仅 `reviewPacketMaterialId`（:121-156，含 :137/:151-153/:154/:155/:156 条目与 hash 段）；测试文件仅允许保留/扩展 T001 断言
- **输出**：GREEN 可观察结果：同包同值测试通过（exit 0），派发不再报标识不兼容，比较 intact
- **Knowledge**：T001 产出的真实失败事实；WH `skills/wh-review/scripts/review-materials.mjs:840-843` 第三处哈希已核实无需改；BR 侧不动
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：0
- **oracle**：`MATERIAL_IDENTITY_ALIGNED` — 成功信号：两侧同值断言通过；负例=不同材料集产出不同标识
- **evidence_path**：`quality/evidence/build-code/material_identity/`
- **STOP**：需要弱化测试、扩大边界、动 BR 权威实现或取消比较时停止
- **recovery**：卡执行者回滚 `review-packet-identity.mjs` 改动并保留 RED 证据；上游改算法或丢 BR 工作树 → 回决策材料（PLAN-RISK-001）
- **task risk**：对齐时误动包装件过滤或 4 个相等点比较语义；未保留负例
- **test tier / test method**：simple — 与 T001 相同的既有契约测试内最小行为断言
- **scenarios / commands / expected exit / oracle**：成功场景=exit 0（oracle MATERIAL_IDENTITY_ALIGNED）；负例场景=同命令下不同输入不同标识仍成立；同命令不以 import 失败代替
- **fixtures_services**：WH 认证 worktree；前置一次性 `npm ci`；`npx vitest`；无外部服务、无新增 fixture
- **coverage limits**：仅覆盖 WH 侧标识实现；不覆盖 BR 侧运行时、不覆盖派发端到端
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/review/review-packet-identity.mjs` 的 `reviewPacketMaterialId` 语义过滤新增 `review-instructions.md`；`tests/contract/review-material-change-redispatch.test.mjs` 新增冻结向量与负例。
- **executed_commands**：一次性 `npm ci` exit 0；public `verify --action=execute` 执行 `npx vitest run tests/contract/review-material-change-redispatch.test.mjs`，首次修正 oracle 的 GREEN 尝试因字符串 byte oracle 多算换行 exit 1，修复测试 oracle 后 fresh GREEN exit 0，1 file / 7 tests passed。
- **evidence_refs**：GREEN receipt `quality/tests/build-code-p1-t002-green-v2.json`，output `quality/tests/output/build-code-p1-t002-green-v2.output`，output_sha256=`d26bb7a4ddbd401a05db15aa1092a9757e4b291ae837b9ab75b48fe1adad836c`；route=`.planning/2026-09-19-workflowhub-deferred-closeout/p1-routing.json`；strategy=`.planning/2026-09-19-workflowhub-deferred-closeout/p1-test-strategy.md`。
- **covered_ac**：`AC-IDENTITY-001`、`AC-IDENTITY-002`；同包语义向量与 3rd-review frozen output 一致，不同语义 bytes 仍产生不同 id；四个既有严格比较点未改。
- **review_fact**：P1 phase review attempt 已记录但 `unavailable`：`quality/reviews/attempts/c62ae02d-7254-5b53-a0d6-b225736daf46/attempt.json`；`provider_attempts=[]`、`terminal_status=unavailable`、`dispatch_state=blocked_before_dispatch`、`PROTOCOL_INCOMPATIBLE`；无 finding 可处置，不改写为空 findings/pass。
- **completed_at**：2026-09-19T16:11:34+0800
- **执行事实**：实现、定向测试、实际 changed-file 路由复判与一次 phase review 已执行；review provider 配置在派发前失败，质量状态保持 incomplete/unavailable。

### Verify

- **Target**：FR-IDENTITY-001, FR-IDENTITY-002；AC-IDENTITY-001, AC-IDENTITY-002；跨任务 seam：T001 RED → T002 GREEN 同命令同 oracle
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：RED=1 / GREEN=0
- **evidence_path**：`quality/evidence/build-code/material_identity/`
- **Oracle**：MATERIAL_IDENTITY_ALIGNED — 同包两侧同值、派发不再被拒、4 个相等点比较保留

### Knowledge

冻结合同（spec §5）：排除包装件、`{path,bytes,lowercase sha256}`、UTF-8 字节序、`sha256(JSON array)`；BR 权威 `attachments.mjs:18-26` 不动；标识稳定是 P5 熔断（T035/T036）与读侧对称（T021/T022）的前提。

### STOP

上游改算法或丢工作树 → STOP 回决策材料；需要取消比较 → 违宪，STOP。

### Done

同包同值测试通过；派发不再报标识不兼容；比较 intact。

### Risks and rollback

- **Risk**：BR v3 算法未提交（PFACT-03 / PLAN-RISK-001），上游丢弃工作树或改算法导致两侧再不一致
- **Prevention**：冻结契约 + 一致性测试钉值；改动需再裁定
- **Rollback / recovery**：仅回滚 `review-packet-identity.mjs` 改动，保留 RED 证据

## Phase P2 — 3rd-review 严格判定拆除与放宽

### Goal

BR 侧完成 A1/A2/A4 拆除与 B1/B2/B4 放宽；成员级结果、保真错误码、协议多余/缺失区分落地。

### Files

- **NEW**：N/A
- **MODIFY**：BR `lib/workflowhub-result-v3.mjs`、`lib/broker.mjs`、`lib/recovery-policy.mjs`；BR `test/workflowhub-result-v3.test.mjs`、`test/recovery-policy.test.mjs`、`test/broker.test.mjs`、`test/workflowhub-result-v3.test.mjs`、`test/recovery-policy.test.mjs`、`test/broker.test.mjs`
- **DO NOT TOUCH**：`lib/broker.mjs:795` 签名；红线 ⑥ 必需键判定（`:170,176,182`）

### Tasks

#### T003 — RED：整组私有路径扫描→成员级断言

- **ID**：T003
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：新增断言使“整组私有路径扫描判定拆除、坏成员只成员级失败不拖垮整组（部分成功）”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-001 → AC-STRICT-001
- **输入**：spec.md §5/§11 FR-STRICT-001 与 AC-STRICT-001；plan.md Code Anchors（`lib/workflowhub-result-v3.mjs:200`）
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-STRICT-001
- **AC**：AC-STRICT-001
- **动作**：在 BR `test/workflowhub-result-v3.test.mjs` 内新增断言：混合成员集（一坏一好）产出成员级结果，坏成员成员级失败、好成员结果保留；不改生产实现
- **精确文件**：`test/workflowhub-result-v3.test.mjs`（BR）
- **boundary**：files: `test/workflowhub-result-v3.test.mjs`; symbols/regions: 仅允许在该测试文件内新增测试用例与断言
- **输出**：RED 证据：目标断言失败（exit 1），保留原始输出
- **Knowledge**：现状 `lib/workflowhub-result-v3.mjs:200` 为整组扫描判定；红线判定强度不变（红线 1：只缩扫描面，告警语义不变）
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`node --test test/workflowhub-result-v3.test.mjs`
- **expected_exit**：1
- **oracle**：`GROUP_SCAN_MEMBER_LEVEL` — 目标断言失败信号：整组扫描仍在、成员级部分成功未落地
- **evidence_path**：`quality/evidence/build-code/group_scan_member_level/`
- **STOP**：命令损坏、环境失败、需改红线判定强度时停止
- **recovery**：卡执行者修复命令/环境后重跑；材料级问题回 plan owner
- **task risk**：错误 RED（fixture/setup 失败冒充）；断言误写成“告警消失”而非“成员级化”
- **test tier / test method**：simple — BR 既有测试文件内的最小行为断言（node --test）
- **scenarios / commands / expected exit / oracle**：成功场景=目标断言失败（exit 1，oracle GROUP_SCAN_MEMBER_LEVEL）；GREEN 后同命令 exit 0；负例=整组私有路径成员全坏时仍全部成员级失败
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`（未提交改动为唯一真实来源）；`node --test`；无外部服务、无新增 fixture
- **coverage limits**：仅覆盖整组扫描→成员级行为；不覆盖 token 删除（T005/T006）、不覆盖扫描面收敛（T009/T010）
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：无本卡生产改动；BR HEAD 在本任务开始前已具备成员级 partial 行为，现有 `test/workflowhub-result-v3.test.mjs` 的 mixed-member 断言已覆盖。
- **executed_commands**：BR 基线 `node --test test/workflowhub-result-v3.test.mjs`，exit 0；P2 收尾同命令仍 exit 0。
- **evidence_refs**：BR direct test output；未生成可复现 RED，原因是目标行为已在认证的脏 worktree 中存在，未回滚用户改动制造假 RED。
- **covered_ac**：`AC-STRICT-001`
- **review_fact**：P2 phase review `unavailable`，attempt=`quality/reviews/attempts/db6dca06-b7b1-5083-ac02-9904a8cb6d07/attempt.json`；无 provider attempts、无 findings。
- **completed_at**：2026-09-19
- **执行事实**：`red_fact=unavailable_due_to_preexisting_member_level_behavior`; 成员级坏成员不拖垮好成员的现有事实保留。

#### T004 — GREEN：组级扫描收敛为成员级

- **ID**：T004
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：使 T003 断言通过并保留负例（整组全坏仍全失败）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-001 → AC-STRICT-001
- **输入**：T003 的失败断言；锚点 `lib/workflowhub-result-v3.mjs:200`
- **依赖**：T003
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-STRICT-001
- **AC**：AC-STRICT-001
- **动作**：将 `lib/workflowhub-result-v3.mjs:200` 整组私有路径扫描收敛为成员级判定：逐成员产出结论（含部分成功），告警语义不变
- **精确文件**：`lib/workflowhub-result-v3.mjs`（BR）
- **boundary**：files: `lib/workflowhub-result-v3.mjs`; symbols/regions: 仅 :200 组级扫描段及其直接消费路径
- **输出**：GREEN 可观察结果：成员级部分成功通过（exit 0）
- **Knowledge**：T003 真实失败事实；红线 1 语义不变：真私有路径仍告警，只是成员级
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`node --test test/workflowhub-result-v3.test.mjs`
- **expected_exit**：0
- **oracle**：`GROUP_SCAN_MEMBER_LEVEL` — 成功信号：成员级部分成功；负例=全坏成员集全失败
- **evidence_path**：`quality/evidence/build-code/group_scan_member_level/`
- **STOP**：需要弱化测试、扩大边界、改红线判定强度时停止
- **recovery**：卡执行者回滚 `lib/workflowhub-result-v3.mjs` 本卡改动
- **task risk**：实现偏离成员级语义（静默放行坏成员）；负例回归
- **test tier / test method**：simple — 与 T003 相同的 node --test 针对性断言
- **scenarios / commands / expected exit / oracle**：成功场景=exit 0（oracle GROUP_SCAN_MEMBER_LEVEL）；负例=全坏集仍全失败；同命令
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖本卡成员级行为；不覆盖其余 REMOVE/RELAX 项
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：无新增生产改动；核实 `lib/workflowhub-result-v3.mjs` 现有成员级 `projectWorkflowHubMemberV3` + group partial 组合已满足本卡。
- **executed_commands**：`node --test test/workflowhub-result-v3.test.mjs`，exit 0；全坏成员负例保留。
- **evidence_refs**：BR direct test output；P2 review fact 待 Phase review 单独记录。
- **covered_ac**：`AC-STRICT-001`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 finding 可处置，不改写为 pass。
- **completed_at**：2026-09-19
- **执行事实**：现有代码已满足，未以回滚用户脏改动方式重演 GREEN。

#### T005 — RED：正文 secret|data token 断言

- **ID**：T005
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：新增断言使“正文扫描不再含 `secret|data` token 判定”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-002 → AC-STRICT-002
- **输入**：spec.md FR-STRICT-002 / AC-STRICT-002；plan.md Code Anchors（`lib/workflowhub-result-v3.mjs:32`）
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-STRICT-002
- **AC**：AC-STRICT-002
- **动作**：在 BR `test/workflowhub-result-v3.test.mjs` 内新增断言：正文含 `secret`/`data` 字样不再触发该 token 判定；不改生产实现
- **精确文件**：`test/workflowhub-result-v3.test.mjs`（BR）
- **boundary**：files: `test/workflowhub-result-v3.test.mjs`; symbols/regions: 仅允许新增测试用例与断言
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：现状 `lib/workflowhub-result-v3.mjs:32` 为 `secret|data` 正文 token；结构化字段告警保留（T009/T010）
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`node --test test/workflowhub-result-v3.test.mjs`
- **expected_exit**：1
- **oracle**：`BODY_TOKEN_REMOVED` — 目标断言失败信号：正文 token 判定仍在
- **evidence_path**：`quality/evidence/build-code/body_token_removed/`
- **STOP**：命令损坏、环境失败、需恢复正文 token 判定时停止
- **recovery**：卡执行者修复命令/环境后重跑
- **task risk**：错误 RED；断言误覆盖结构化字段告警（应保留）
- **test tier / test method**：simple — BR 既有测试文件内最小行为断言
- **scenarios / commands / expected exit / oracle**：成功场景=断言失败（exit 1，oracle BODY_TOKEN_REMOVED）；负例=结构化字段命中仍告警
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖正文 token 判定；不覆盖结构化字段扫描面
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：仅新增本卡 RED 断言，和 T009/T011 共享 BR v3 契约测试文件。
- **executed_commands**：首次 `node --test test/workflowhub-result-v3.test.mjs`，exit 1；目标正文 token 断言失败，非 fixture/setup 失败。
- **evidence_refs**：BR direct test output，oracle=`BODY_TOKEN_REMOVED`。
- **covered_ac**：`AC-STRICT-002`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 provider attempts、无 findings。
- **completed_at**：2026-09-19
- **执行事实**：RED 已真实捕获；正文 `/secret`、`/data` 被旧 token 判定误伤。

#### T006 — GREEN：删除 secret|data 正文 token

- **ID**：T006
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：使 T005 断言通过并保留结构化字段告警负例
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-002 → AC-STRICT-002
- **输入**：T005 的失败断言；锚点 `lib/workflowhub-result-v3.mjs:32`
- **依赖**：T005
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-STRICT-002
- **AC**：AC-STRICT-002
- **动作**：删除 `lib/workflowhub-result-v3.mjs:32` 的 `secret|data` 正文 token 判定；私有路径告警只经结构化字段通道（T009/T010）
- **精确文件**：`lib/workflowhub-result-v3.mjs`（BR）
- **boundary**：files: `lib/workflowhub-result-v3.mjs`; symbols/regions: 仅 :32 token 判定段
- **输出**：GREEN 可观察结果：正文 token 判定消失（exit 0），结构化字段告警保留
- **Knowledge**：T005 真实失败事实；`:37/:47/:179` 扫描面收敛属 T009/T010，本卡不动
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`node --test test/workflowhub-result-v3.test.mjs`
- **expected_exit**：0
- **oracle**：`BODY_TOKEN_REMOVED` — 成功信号：正文 token 判定已删；负例=结构化字段命中仍告警
- **evidence_path**：`quality/evidence/build-code/body_token_removed/`
- **STOP**：需要恢复 token、扩大扫描面、改红线判定时停止
- **recovery**：卡执行者回滚 :32 改动
- **task risk**：误删结构化字段告警通道；负例回归
- **test tier / test method**：simple — 与 T005 相同的 node --test 针对性断言
- **scenarios / commands / expected exit / oracle**：成功场景=exit 0（oracle BODY_TOKEN_REMOVED）；负例=结构化字段告警在；同命令
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖正文 token 删除；不覆盖恢复策略门（T007/T008）
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：BR `lib/workflowhub-result-v3.mjs` 删除 `secret|data` 正文 token；结构化字段扫描另由 T009/T010 收敛。
- **executed_commands**：`node --test test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs`，27/27 pass，exit 0。
- **evidence_refs**：BR direct test output，oracle=`BODY_TOKEN_REMOVED`。
- **covered_ac**：`AC-STRICT-002`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 finding 可处置。
- **completed_at**：2026-09-19
- **执行事实**：正文普通词放行；结构化真私有路径负例仍失败。

#### T007 — RED：review_mode 重发门断言

- **ID**：T007
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：新增断言使“review_mode 不再作为恢复/重发判定门”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-004 → AC-STRICT-004
- **输入**：spec.md FR-STRICT-004 / AC-STRICT-004；plan.md Code Anchors（`lib/broker.mjs:1243,1282,1387`、`lib/recovery-policy.mjs:14,26`）
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-STRICT-004
- **AC**：AC-STRICT-004
- **动作**：在 BR `test/recovery-policy.test.mjs` 内新增断言：恢复/重发判定不再看 review_mode；PROCESS_TIMEOUT 门与重发上限保留；不改生产实现
- **精确文件**：`test/recovery-policy.test.mjs`（BR）
- **boundary**：files: `test/recovery-policy.test.mjs`; symbols/regions: 仅允许新增测试用例与断言
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：现状 review_mode 门在 `lib/broker.mjs:1243,1282,1387` 与 `lib/recovery-policy.mjs:14,26`；PROCESS_TIMEOUT 门与重发上限不动
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`node --test test/recovery-policy.test.mjs`
- **expected_exit**：1
- **oracle**：`REVIEW_MODE_GATE_REMOVED` — 目标断言失败信号：review_mode 门仍在
- **evidence_path**：`quality/evidence/build-code/review_mode_gate_removed/`
- **STOP**：命令损坏、环境失败、需动 PROCESS_TIMEOUT 门或重发上限时停止
- **recovery**：卡执行者修复命令/环境后重跑
- **task risk**：错误 RED；断言误删 PROCESS_TIMEOUT 负例
- **test tier / test method**：simple — BR 既有测试文件内最小行为断言
- **scenarios / commands / expected exit / oracle**：成功场景=断言失败（exit 1，oracle REVIEW_MODE_GATE_REMOVED）；负例=PROCESS_TIMEOUT 触发恢复仍在
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖 review_mode 门；不覆盖 B4 放宽（T013/T014）
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：仅新增 BR recovery-policy 回归断言。
- **executed_commands**：首次 `node --test test/recovery-policy.test.mjs`，exit 1；`review_mode` 门目标断言真实失败。
- **evidence_refs**：BR direct test output，oracle=`REVIEW_MODE_GATE_REMOVED`。
- **covered_ac**：`AC-STRICT-004`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 provider attempts、无 findings。
- **completed_at**：2026-09-19
- **执行事实**：RED 已真实捕获；PROCESS_TIMEOUT 与重发上限未作为目标。

#### T008 — GREEN：去除 review_mode 重发门

- **ID**：T008
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：使 T007 断言通过并保留 PROCESS_TIMEOUT 门与重发上限负例
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-004 → AC-STRICT-004
- **输入**：T007 的失败断言；锚点 `lib/broker.mjs:1243,1282,1387`、`lib/recovery-policy.mjs:14,26`
- **依赖**：T007
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-STRICT-004
- **AC**：AC-STRICT-004
- **动作**：去除 `lib/broker.mjs:1243,1282,1387` 与 `lib/recovery-policy.mjs:14,26` 的 review_mode 门；保留 PROCESS_TIMEOUT 门与重发上限
- **精确文件**：`lib/broker.mjs`、`lib/recovery-policy.mjs`（BR）
- **boundary**：files: `lib/broker.mjs`, `lib/recovery-policy.mjs`; symbols/regions: 仅 :1243/:1282/:1387 与 :14/:26 review_mode 门段
- **输出**：GREEN 可观察结果：review_mode 不再影响恢复/重发（exit 0）
- **Knowledge**：T007 真实失败事实；重发上限是既有防刷约束，不动
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`node --test test/recovery-policy.test.mjs`
- **expected_exit**：0
- **oracle**：`REVIEW_MODE_GATE_REMOVED` — 成功信号：门已去；负例=PROCESS_TIMEOUT 恢复与重发上限仍生效
- **evidence_path**：`quality/evidence/build-code/review_mode_gate_removed/`
- **STOP**：需要恢复 review_mode 门、动公共 broker API 时停止
- **recovery**：卡执行者回滚两文件本卡改动
- **task risk**：误动 PROCESS_TIMEOUT 门或重发上限；负例回归
- **test tier / test method**：simple — 与 T007 相同的 node --test 针对性断言
- **scenarios / commands / expected exit / oracle**：成功场景=exit 0（oracle REVIEW_MODE_GATE_REMOVED）；负例=PROCESS_TIMEOUT 门在；同命令
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖 review_mode 门；不覆盖 B2/B4
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：BR `lib/broker.mjs` 与 `lib/recovery-policy.mjs` 去除 `review_mode` 恢复门，保留 PROCESS_TIMEOUT 与计数上限。
- **executed_commands**：`node --test test/recovery-policy.test.mjs`，5/5 pass，exit 0；`node --test test/broker.test.mjs`，36/36 pass，exit 0。
- **evidence_refs**：BR direct test output，oracle=`REVIEW_MODE_GATE_REMOVED`。
- **covered_ac**：`AC-STRICT-004`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 finding 可处置。
- **completed_at**：2026-09-19
- **执行事实**：两类 review_mode（`single_round`/`full_only`）均进入允许的 same-session repair；既有 timeout 门仍在。

#### T009 — RED：结构化字段扫描面断言

- **ID**：T009
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：新增断言使“私有路径只扫结构化字段”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-007 → AC-STRICT-007
- **输入**：spec.md FR-STRICT-007 / AC-STRICT-007；plan.md Code Anchors（`lib/workflowhub-result-v3.mjs:37,47,179`、`lib/broker.mjs:104-113`）
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-STRICT-007
- **AC**：AC-STRICT-007
- **动作**：在 BR `test/workflowhub-result-v3.test.mjs` 内新增断言：私有路径判定只消费结构化字段，非结构化正文命中不触发；真私有路径结构化字段命中仍告警；不改生产实现
- **精确文件**：`test/workflowhub-result-v3.test.mjs`（BR）
- **boundary**：files: `test/workflowhub-result-v3.test.mjs`; symbols/regions: 仅允许新增测试用例与断言
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：现状深扫在 `lib/workflowhub-result-v3.mjs:37,47,179` 与 `lib/broker.mjs:104-113`；红线 1：告警语义不变，只缩扫描面
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`node --test test/workflowhub-result-v3.test.mjs`
- **expected_exit**：1
- **oracle**：`PRIVATE_PATH_STRUCTURED_ONLY` — 目标断言失败信号：深扫仍在
- **evidence_path**：`quality/evidence/build-code/private_path_structured_only/`
- **STOP**：命令损坏、环境失败、需恢复深扫时停止
- **recovery**：卡执行者修复命令/环境后重跑
- **task risk**：错误 RED；负例（结构化字段告警）缺失
- **test tier / test method**：simple — BR 既有测试文件内最小行为断言
- **scenarios / commands / expected exit / oracle**：成功场景=断言失败（exit 1，oracle PRIVATE_PATH_STRUCTURED_ONLY）；负例=真私有路径结构化命中仍告警
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖扫描面收敛；不覆盖错误码保真（T011/T012）
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：仅新增本卡结构化字段/正文分界 RED 断言，和 T005/T011 共享 BR v3 契约测试文件。
- **executed_commands**：首次 `node --test test/workflowhub-result-v3.test.mjs`，exit 1；正文命中与结构化命中目标断言真实分化失败。
- **evidence_refs**：BR direct test output，oracle=`PRIVATE_PATH_STRUCTURED_ONLY`。
- **covered_ac**：`AC-STRICT-007`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 provider attempts、无 findings。
- **completed_at**：2026-09-19
- **执行事实**：RED 已真实捕获；非结构化正文仍被旧深扫误判。

#### T010 — GREEN：私有路径只扫结构化字段

- **ID**：T010
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：使 T009 断言通过并保留真私有路径告警负例
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-007 → AC-STRICT-007
- **输入**：T009 的失败断言；锚点 `lib/workflowhub-result-v3.mjs:37,47,179`、`lib/broker.mjs:104-113`
- **依赖**：T009
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-STRICT-007
- **AC**：AC-STRICT-007
- **动作**：收敛私有路径扫描面为结构化字段：改 `lib/workflowhub-result-v3.mjs:37,47,179` 与 `lib/broker.mjs:104-113`，非结构化正文不再进私有路径判定；告警语义不变
- **精确文件**：`lib/workflowhub-result-v3.mjs`、`lib/broker.mjs`（BR）
- **boundary**：files: `lib/workflowhub-result-v3.mjs`, `lib/broker.mjs`; symbols/regions: 仅 :37/:47/:179 扫描面与 :104-113 深扫段
- **输出**：GREEN 可观察结果：只扫结构化字段（exit 0）
- **Knowledge**：T009 真实失败事实；成员级化（T004）后告警按成员落
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`node --test test/workflowhub-result-v3.test.mjs`
- **expected_exit**：0
- **oracle**：`PRIVATE_PATH_STRUCTURED_ONLY` — 成功信号：深扫收敛；负例=结构化字段命中仍告警
- **evidence_path**：`quality/evidence/build-code/private_path_structured_only/`
- **STOP**：需要恢复深扫或改红线判定时停止
- **recovery**：卡执行者回滚两文件本卡改动
- **task risk**：扫描面误扩或误缩（漏结构化字段）；负例回归
- **test tier / test method**：simple — 与 T009 相同的 node --test 针对性断言
- **scenarios / commands / expected exit / oracle**：成功场景=exit 0（oracle PRIVATE_PATH_STRUCTURED_ONLY）；负例=真私有路径告警在；同命令
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖扫描面收敛；不覆盖 B2 错误码保真
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：BR `lib/workflowhub-result-v3.mjs` 与 `lib/broker.mjs` 的私有路径扫描跳过成员 `output` 正文，仅保留结构化字段。
- **executed_commands**：`node --test test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs`，27/27 pass，exit 0；broker 结构化扫描随 `test/broker.test.mjs` 36/36 pass。
- **evidence_refs**：BR direct test output，oracle=`PRIVATE_PATH_STRUCTURED_ONLY`。
- **covered_ac**：`AC-STRICT-007`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 finding 可处置。
- **completed_at**：2026-09-19
- **执行事实**：正文私有路径不再触发；`model`/`provenance` 等结构化真私有路径仍 fail-closed。

#### T011 — RED：身份降级保真 + cause_code 断言

- **ID**：T011
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：新增断言使“降级错误对象保留原 provider 错误码并新增 cause_code”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 / G-005 → FR-STRICT-008 → AC-STRICT-008
- **输入**：spec.md FR-STRICT-008 / AC-STRICT-008；plan.md Code Anchors（`lib/broker.mjs:441-474` `publicInvalidV3Result`）；DEC-002
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-STRICT-008
- **AC**：AC-STRICT-008
- **动作**：在 BR `test/broker.test.mjs` 内新增断言：降级时原始错误码保留（回到 `CONTEXT.md:282-283` 原始码保留合规）且错误对象含 `cause_code` 字段；不改生产实现
- **精确文件**：`test/broker.test.mjs`（BR）
- **boundary**：files: `test/broker.test.mjs`; symbols/regions: 仅允许新增测试用例与断言
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：B2 目标 `lib/broker.mjs:441-474`；`cause_code` 为 BR lib 新字段（今日零命中）；未知码透传标 unknown（G-005 注册表保持开放）
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`node --test test/broker.test.mjs`
- **expected_exit**：1
- **oracle**：`ERROR_CODE_PRESERVED` — 目标断言失败信号：原码被覆写 / cause_code 缺失
- **evidence_path**：`quality/evidence/build-code/error_code_preserved/`
- **STOP**：命令损坏、环境失败、需收紧错误码注册表时停止
- **recovery**：卡执行者修复命令/环境后重跑
- **task risk**：错误 RED；断言锁定覆写行为而非保真行为
- **test tier / test method**：simple — BR 既有测试文件内最小行为断言
- **scenarios / commands / expected exit / oracle**：成功场景=断言失败（exit 1，oracle ERROR_CODE_PRESERVED）；未知码场景=透传标 unknown
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖降级错误对象字段；不覆盖对外统一码（T039/T040）
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：仅新增 BR broker 降级错误保真 RED 断言。
- **executed_commands**：首次 `node --test test/workflowhub-result-v3.test.mjs`，exit 1；原始 provider 错误码被旧实现覆写，目标断言真实失败。
- **evidence_refs**：BR direct test output，oracle=`ERROR_CODE_PRESERVED`。
- **covered_ac**：`AC-STRICT-008`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 provider attempts、无 findings。
- **completed_at**：2026-09-19
- **执行事实**：RED 已真实捕获；未把未知错误码注册表改成封闭集合。

#### T012 — GREEN：实现身份降级保真 + cause_code

- **ID**：T012
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：使 T011 断言通过并保留未知码透传负例
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 / G-005 → FR-STRICT-008 → AC-STRICT-008
- **输入**：T011 的失败断言；锚点 `lib/broker.mjs:441-474`；`lib/provider-failure.mjs:67`
- **依赖**：T011
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-STRICT-008
- **AC**：AC-STRICT-008
- **动作**：改 `lib/broker.mjs:441-474` `publicInvalidV3Result`：不再把原 provider 错误码覆写为 `PUBLIC_RESULT_INVALID`，透传原码并新增 `cause_code`；映射层 `lib/provider-failure.mjs:67` 同步写 cause_code
- **精确文件**：`lib/broker.mjs`（BR）
- **boundary**：files: `lib/broker.mjs`（BR）; symbols/regions: 仅 :441-474 降级对象段
- **输出**：GREEN 可观察结果：降级错误对象保真原码 + cause_code（exit 0）
- **Knowledge**：T011 真实失败事实；下游重发门不变
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`node --test test/broker.test.mjs`
- **expected_exit**：0
- **oracle**：`ERROR_CODE_PRESERVED` — 成功信号：原码保留 + cause_code 存在；负例=未知码透传标 unknown
- **evidence_path**：`quality/evidence/build-code/error_code_preserved/`
- **STOP**：需要收紧注册表、改公共 API 时停止
- **recovery**：卡执行者回滚本卡改动
- **task risk**：保真实现漏 cause_code；负例回归
- **test tier / test method**：simple — 与 T011 相同的 node --test 针对性断言
- **scenarios / commands / expected exit / oracle**：成功场景=exit 0（oracle ERROR_CODE_PRESERVED）；负例=未知码场景；同命令
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖降级保真；不覆盖 4.7 逐项（T041）
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：BR `lib/broker.mjs` 的 `publicInvalidV3Error` 保留原 provider `code/message`，新增 `cause_code=PUBLIC_RESULT_INVALID`；v3 `safeError` 已保留该字段。
- **executed_commands**：`node --test test/broker.test.mjs`，36/36 pass，exit 0；v3 contract suites 27/27 pass，exit 0。
- **evidence_refs**：BR direct test output，oracle=`ERROR_CODE_PRESERVED`。
- **covered_ac**：`AC-STRICT-008`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 finding 可处置。
- **completed_at**：2026-09-19
- **执行事实**：降级结果保留 `PROVIDER_PRINT_TIMEOUT` 等原码；当前 unified outward PROCESS_TIMEOUT/cause_code 的 adapter 映射属于后续 T039/T040，未提前扩大本卡边界。

#### T013 — RED：协议不兼容区分多余/缺失断言

- **ID**：T013
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：新增断言使“PROTOCOL_INCOMPATIBLE 区分多余字段与缺失字段”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-009 → AC-STRICT-009
- **输入**：spec.md FR-STRICT-009 / AC-STRICT-009；plan.md Code Anchors（`lib/broker.mjs:582,586,587,590,592,707` B4 request 路径）
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-STRICT-009
- **AC**：AC-STRICT-009
- **动作**：在 BR `test/broker.test.mjs` 内新增断言：request 路径上多余字段与缺失字段产生可区分的协议不兼容结论；不改生产实现
- **精确文件**：`test/broker.test.mjs`（BR）
- **boundary**：files: `test/broker.test.mjs`; symbols/regions: 仅允许新增测试用例与断言
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：B4 request 路径位点 :582/:586/:587/:590/:592/:707 已核实；health 路径精确位点 PENDING —— 需按 plan PLAN-RISK-002 在 build-code 定位窄 seam，不得伪造行号；Knowledge 诚实登记该未决点
- **verification_role**：RED
- **paired_task**：T014
- **gate_cmd**：`node --test test/broker.test.mjs`
- **expected_exit**：1
- **oracle**：`PROTOCOL_EXTRA_VS_MISSING` — 目标断言失败信号：多余/缺失不可区分
- **evidence_path**：`quality/evidence/build-code/protocol_extra_vs_missing/`
- **STOP**：命令损坏、环境失败、需改公共 broker API 时停止
- **recovery**：卡执行者修复命令/环境后重跑
- **task risk**：错误 RED；health 路径被臆造行号（禁止）
- **test tier / test method**：simple — BR 既有测试文件内最小行为断言
- **scenarios / commands / expected exit / oracle**：成功场景=断言失败（exit 1，oracle PROTOCOL_EXTRA_VS_MISSING）；场景=多余字段 / 缺失字段两类
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖 request 路径多余/缺失区分；health 路径未决如实登记
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：仅新增 BR broker request 路径回归断言。
- **executed_commands**：首次 `node --test test/broker.test.mjs`，exit 1；未知 extra 与全未知 allowlist 的区分断言真实失败。
- **evidence_refs**：BR direct test output，oracle=`PROTOCOL_EXTRA_VS_MISSING`。
- **covered_ac**：`AC-STRICT-009`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 provider attempts、无 findings。
- **completed_at**：2026-09-19
- **执行事实**：RED 已真实捕获；旧 request 校验把未知 extra 与缺失配置候选混为 `REQUEST_INVALID`。

#### T014 — GREEN：实现协议多余/缺失区分

- **ID**：T014
- **Phase**：Phase P2 — 3rd-review 严格判定拆除与放宽
- **goal**：使 T013 断言通过；health 路径窄 seam 如实定位或登记 PENDING
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-009 → AC-STRICT-009
- **输入**：T013 的失败断言；锚点 `lib/broker.mjs:582,586,587,590,592,707`
- **依赖**：T013
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-STRICT-009
- **AC**：AC-STRICT-009
- **动作**：在 B4 request 路径（:582-592/:707）实现多余字段与缺失字段的区分判定；health 路径精确位点按 plan PLAN-RISK-002 在 build-code 定位窄 seam，do NOT fabricate a line，定位结果如实回填本卡完成区
- **精确文件**：`lib/broker.mjs`（BR）
- **boundary**：files: `lib/broker.mjs`; symbols/regions: 仅 :582/:586/:587/:590/:592/:707 B4 request 路径段；health 路径仅允许在真实定位后窄改
- **输出**：GREEN 可观察结果：多余/缺失可区分（exit 0）；health 路径定位事实或 PENDING 登记
- **Knowledge**：T013 真实失败事实；health 路径 PENDING 是诚实未决点（PLAN-RISK-002），完成区必须记录定位结果
- **verification_role**：GREEN
- **paired_task**：T013
- **gate_cmd**：`node --test test/broker.test.mjs`
- **expected_exit**：0
- **oracle**：`PROTOCOL_EXTRA_VS_MISSING` — 成功信号：多余/缺失区分落地
- **evidence_path**：`quality/evidence/build-code/protocol_extra_vs_missing/`
- **STOP**：health 路径找不到窄接入点时 STOP 回决策材料，不臆造行号、不扩大机制
- **recovery**：卡执行者回滚 :582-707 段改动；PENDING 未闭合回 plan owner 补设计
- **task risk**：区分判定误伤既有兼容路径；health 路径臆造行号
- **test tier / test method**：simple — 与 T013 相同的 node --test 针对性断言
- **scenarios / commands / expected exit / oracle**：成功场景=exit 0（oracle PROTOCOL_EXTRA_VS_MISSING）；场景=多余 / 缺失；同命令
- **fixtures_services**：BR 工作树 `/Users/Hugh/Hugh/Project/3rd-review`；`node --test`；无外部服务
- **coverage limits**：仅覆盖 B4 request 路径区分；health 路径未决如实登记
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：BR `lib/broker.mjs` request 校验过滤未知 provider extra；仍无配置 provider 时抛 `PROTOCOL_INCOMPATIBLE`，配置 provider 的 heterologous 校验保持。
- **executed_commands**：`node --test test/broker.test.mjs`，36/36 pass，exit 0。
- **evidence_refs**：BR direct test output，oracle=`PROTOCOL_EXTRA_VS_MISSING`。
- **covered_ac**：`AC-STRICT-009`
- **review_fact**：P2 phase review `unavailable`，同一 attempt；无 finding 可处置。
- **completed_at**：2026-09-19
- **执行事实**：request seam 已落地；health seam 真实定位为 WH `validateManagedHealthProviders` 精确集合检查（`skills/wh-review/scripts/review-provider-client.mjs:621-627`），不在 BR broker，按 PLAN-RISK-002 登记为后续 P3/T023-T024，不伪造 BR 行号。

### Verify

- **Target**：FR-STRICT-001/002/004/007/008/009；AC-STRICT-001/002/004/007/008/009；跨任务 seam：6 对 RED/GREEN 同命令同 oracle
- **gate_cmd**：各卡 gate_cmd 见 Test Strategy（`node --test test/{workflowhub-result-v3,recovery-policy,broker}.test.mjs`，BR 工作树下）
- **expected_exit**：RED=1 / GREEN=0
- **evidence_path**：各 oracle 目录（`quality/evidence/build-code/{group_scan_member_level,body_token_removed,review_mode_gate_removed,private_path_structured_only,error_code_preserved,protocol_extra_vs_missing}/`）
- **Oracle**：GROUP_SCAN_MEMBER_LEVEL、BODY_TOKEN_REMOVED、REVIEW_MODE_GATE_REMOVED、PRIVATE_PATH_STRUCTURED_ONLY、ERROR_CODE_PRESERVED、PROTOCOL_EXTRA_VS_MISSING

### Knowledge

BR 测试栈 `node --test`；B2 的 `cause_code` 为新增字段，BR lib 今日零命中；health 路径位点 PENDING 如实登记；红线判定强度与 `cancelManaged` 签名不动。

### STOP

需要改红线判定强度或公共 broker API → STOP 回决策材料。

### Done

6 对 RED/GREEN 通过；负例保留（坏成员仍成员级失败、真私有路径结构化字段仍告警）。

### Risks and rollback

- **Risk**：PLAN-RISK-002 — B4 health 路径找不到窄位点时臆造行号
- **Prevention**：health 路径只按真实定位窄改，定位失败 STOP
- **Rollback / recovery**：回滚对应卡文件改动，保留 PARTIAL 证据

## Phase P3 — workflowhub 严格判定收敛

### Goal

WH 侧：死常量删除、近似键留痕、未锚定 finding 不拖垮整轮、读侧对称、集合精确匹配移除、bounds 对齐宽松侧；全部用既有 WH 针对性测试 + 最小新断言。

### Files

- **NEW**：N/A
- **MODIFY**：WH `skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/review-input-bounds.mjs`、`runtime/review/review-input-bounds.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/task/git-worktree-snapshot.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/review/review-output.mjs` + 既有测试文件、`tests/contract/review-materials-contract.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`tests/contract/review-material-change-redispatch.test.mjs`、`tests/review/review-managed-lifecycle.test.mjs`、`tests/contract/review-input-bounds-portability.test.mjs`、`tests/review/review-record-route.test.mjs`、`tests/contract/review-layering.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/review-input-bounds.mjs`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
- **DO NOT TOUCH**：`:61` 活常量、`hasMarkdownHeadings:3511`、墙钟等待、对象参数 cancelManaged、红线 ③⑦

### Tasks

- T015：删死常量 PHASE_DIFF_MAX_DELIVERY_BYTES（RED→GREEN）
- T017：EVIDENCE_ANCHOR_INVALID 不拖垮整轮 + 未锚定 finding 留痕（RED→GREEN）
- T019：近似键 warn+drop+显式事实（RED→GREEN）
- T021：确认绑定读侧对称（RED→GREEN）
- T023：移除 validateManagedHealthProviders 集合精确匹配（RED→GREEN）
- T025：bounds 对齐宽松侧（RED→GREEN）
- T027：4.6 跳过错账一致（RED→GREEN）
- T029：4.4 未识别严重度留痕（RED→GREEN）

#### T015 — RED：死常量 PHASE_DIFF_MAX_DELIVERY_BYTES 断言

- **ID**：T015
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：新增断言使“死常量 PHASE_DIFF_MAX_DELIVERY_BYTES 已删除且活 sibling PHASE_DIFF_INLINE_LIMIT_BYTES 保留”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-003 → AC-STRICT-003
- **输入**：spec.md §5/§11 FR-STRICT-003；plan.md Code Anchors（`review-materials.mjs:57` 死、`:61` 活）
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-STRICT-003
- **AC**：AC-STRICT-003
- **动作**：在 WH `tests/contract/review-materials-contract.test.mjs` 内新增断言：模块不再导出 PHASE_DIFF_MAX_DELIVERY_BYTES，且 PHASE_DIFF_INLINE_LIMIT_BYTES 仍可导入；不改生产实现
- **精确文件**：`tests/contract/review-materials-contract.test.mjs`
- **boundary**：files: `tests/contract/review-materials-contract.test.mjs`; symbols/regions: 仅允许新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：死常量 :57 零 consumer（research 反向引用扫描）；活 sibling :61 消费者 :2038,:2133 勿动
- **verification_role**：RED
- **paired_task**：T016
- **gate_cmd**：`npx vitest run tests/contract/review-materials-contract.test.mjs`
- **expected_exit**：1
- **oracle**：`DEAD_CONSTANT_REMOVED` — 死常量仍可导入（断言失败）
- **evidence_path**：`quality/evidence/build-code/dead_constant_removed/`
- **STOP**：命令损坏、需动活 sibling 时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：误删活 sibling；import 失败冒充断言失败
- **test tier / test method**：simple — WH 既有测试文件内最小断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1（oracle DEAD_CONSTANT_REMOVED）；GREEN=exit 0；负例=活 sibling 仍可用
- **fixtures_services**：WH worktree；前置 `npm ci`；无外部服务
- **coverage limits**：仅覆盖死常量删除；不覆盖近似键（T019/T020）
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增死常量/活 sibling 契约断言。
- **executed_commands**：`npx vitest run tests/contract/review-materials-contract.test.mjs`，exit 1，45 tests 中目标断言失败、其余通过。
- **evidence_refs**：WH direct Vitest output，oracle=`DEAD_CONSTANT_REMOVED`。
- **covered_ac**：`AC-STRICT-003`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：RED 是导出仍存在，不是 import/setup 失败。

#### T016 — GREEN：删除死常量 PHASE_DIFF_MAX_DELIVERY_BYTES

- **ID**：T016
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：删除 `review-materials.mjs:57` 死常量及 :53-56 过期注释，保留活 sibling :61
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-003 → AC-STRICT-003
- **输入**：T015 的失败断言与已核实锚点
- **依赖**：T015
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-STRICT-003
- **AC**：AC-STRICT-003
- **动作**：删除 `review-materials.mjs:57` 及过期注释 :53-56；不动 :61
- **精确文件**：`skills/wh-review/scripts/review-materials.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-materials.mjs`; symbols/regions: 仅 :53-57 区域
- **输出**：GREEN 可观察：T015 断言通过
- **Knowledge**：活 sibling :61 consumer :2038,:2133
- **verification_role**：GREEN
- **paired_task**：T015
- **gate_cmd**：`npx vitest run tests/contract/review-materials-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`DEAD_CONSTANT_REMOVED` — 同 oracle，成功信号：死常量不可导入、活 sibling 可用
- **evidence_path**：`quality/evidence/build-code/dead_constant_removed/`
- **STOP**：需删活 sibling 时停止
- **recovery**：卡执行者恢复
- **task risk**：误删活 sibling
- **test tier / test method**：simple — 同 T015
- **scenarios / commands / expected exit / oracle**：同命令 exit 0；负例=活 sibling 仍可用
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：WH `review-materials.mjs` 删除死常量与过期注释，保留 `PHASE_DIFF_INLINE_LIMIT_BYTES`。
- **executed_commands**：同 gate 46/46 pass，exit 0；技能 bundle manifest/catalog hash 同步后 release closure 仍可构建。
- **evidence_refs**：WH direct Vitest output，oracle=`DEAD_CONSTANT_REMOVED`。
- **covered_ac**：`AC-STRICT-003`
- **review_fact**：P3 phase review `unavailable`，attempt `c28e6681-66a6-5ff4-aae2-9b5082b06368`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：活 sibling 负例保留。

#### T017 — RED：EVIDENCE_ANCHOR_INVALID 不拖垮整轮 + 未锚定 finding 留痕断言

- **ID**：T017
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：新增断言使“单条未锚定 finding 不再使整轮失败、且该 finding 被丢弃并留一条显式事实”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 / G-003 → FR-STRICT-005, FR-STRICT-012 → AC-STRICT-005, AC-STRICT-012
- **输入**：spec.md §5/§7 未锚定 finding 丢弃事实合同；plan.md Code Anchors（`simple-review-runner.mjs:1470-1476`）
- **依赖**：T016
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-STRICT-005, FR-STRICT-012
- **AC**：AC-STRICT-005, AC-STRICT-012
- **动作**：在 WH `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` 新增断言：一坏一好 finding 混合时整轮不按失败、坏 finding 丢弃且留 `unanchored_finding_dropped` 显式事实、好 finding 保留；不改生产实现
- **精确文件**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`; symbols/regions: 仅新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：现状 :1470-1476 未锚定 → 整轮 failed；丢弃事实字段以 spec §7 合同为准（fact_kind/finding_excerpt/reason）
- **verification_role**：RED
- **paired_task**：T018
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：1
- **oracle**：`ANCHOR_DROP_FACT` — 整轮仍 failed 或丢弃未留痕（断言失败）
- **evidence_path**：`quality/evidence/build-code/anchor_drop_fact/`
- **STOP**：需放宽 7 红线时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：断言误写成“锚点校验消失”而非“finding 级 + 留痕”
- **test tier / test method**：simple — WH 既有测试文件内最小断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1（oracle ANCHOR_DROP_FACT）；GREEN=exit 0；负例=全部 finding 未锚定时仍整轮不按失败且各留痕
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅未锚定 finding 处置；不覆盖近似键（T019/T020）
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 mixed anchored/unanchored finding RED 断言。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`，exit 1；目标 finding 级断言失败，另有两处由 P1 identity 语义变更暴露的旧假设已修正后重跑。
- **evidence_refs**：WH direct Vitest output，oracle=`ANCHOR_DROP_FACT`。
- **covered_ac**：`AC-STRICT-005`、`AC-STRICT-012`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：RED 首次输出中 `EVIDENCE_ANCHOR_INVALID` 仍拖垮整轮。

#### T018 — GREEN：EVIDENCE_ANCHOR_INVALID finding 级化 + 留痕

- **ID**：T018
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：改 `simple-review-runner.mjs:1470-1476` 使未锚定 finding 不拖垮整轮、丢弃并留显式事实，其余 finding 与成员不受影响
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 / G-003 → FR-STRICT-005, FR-STRICT-012 → AC-STRICT-005, AC-STRICT-012
- **输入**：T017 的失败断言与已核实锚点
- **依赖**：T017
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-STRICT-005, FR-STRICT-012
- **AC**：AC-STRICT-005, AC-STRICT-012
- **动作**：:1470-1476 未锚定 finding 改为丢弃 + 写 `unanchored_finding_dropped` 显式事实（字段按 spec §7），不置整轮 failed
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **boundary**：files: `skills/wh-review/scripts/simple-review-runner.mjs`; symbols/regions: 仅 evidenceAnchorValidity 处置分支 :1470-1480
- **输出**：GREEN 可观察：T017 断言通过
- **Knowledge**：丢弃事实字段名以 spec §7 合同为准，不得自定
- **verification_role**：GREEN
- **paired_task**：T017
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：0
- **oracle**：`ANCHOR_DROP_FACT` — 同 oracle，成功信号：finding 级 + 留痕 + 整轮不按失败
- **evidence_path**：`quality/evidence/build-code/anchor_drop_fact/`
- **STOP**：需放宽红线时停止
- **recovery**：卡执行者恢复
- **task risk**：字段名漂移；误动其它 finding 路径
- **test tier / test method**：simple — 同 T017
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：WH `simple-review-runner.mjs` 保留锚定 finding、丢弃未锚定 finding，并输出 `discarded_facts` 的 `fact_kind/finding_excerpt/reason`。
- **executed_commands**：同 gate 97/97 pass，exit 0。
- **evidence_refs**：WH direct Vitest output，oracle=`ANCHOR_DROP_FACT`。
- **covered_ac**：`AC-STRICT-005`、`AC-STRICT-012`
- **review_fact**：P3 phase review `unavailable`，attempt `c28e6681-66a6-5ff4-aae2-9b5082b06368`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：全坏 finding 也保持 provider completed + 显式丢弃事实；不静默进入结论。

#### T019 — RED：近似键 warn+drop+显式事实断言

- **ID**：T019
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：新增断言使“近似但不在允许清单内的材料键被 warn+drop+显式事实（而非派发前中止）”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 / G-002 → FR-STRICT-006 → AC-STRICT-006
- **输入**：spec.md §5/§7 未知键丢弃事实合同；plan.md Code Anchors（`review-materials.mjs:372,1997-2007`）
- **依赖**：T018
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-STRICT-006
- **AC**：AC-STRICT-006
- **动作**：在 WH `tests/contract/review-materials-contract.test.mjs` 新增断言：含近似键的材料不中止、近似键被丢弃且留 `material_unknown_key_dropped` 显式事实；真禁止键仍失败；不改生产实现
- **精确文件**：`tests/contract/review-materials-contract.test.mjs`
- **boundary**：files: `tests/contract/review-materials-contract.test.mjs`; symbols/regions: 仅新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：现状 :1997-1999 未知键 throw MATERIAL_FORBIDDEN；真 rule.forbidden :2001 仍失败
- **verification_role**：RED
- **paired_task**：T020
- **gate_cmd**：`npx vitest run tests/contract/review-materials-contract.test.mjs`
- **expected_exit**：1
- **oracle**：`NEAR_MISS_DROP_FACT` — 仍中止或无留痕（断言失败）
- **evidence_path**：`quality/evidence/build-code/near_miss_drop_fact/`
- **STOP**：命令损坏时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：误放行真禁止键；事实字段名漂移
- **test tier / test method**：simple — WH 既有测试文件内最小断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1（oracle NEAR_MISS_DROP_FACT）；GREEN=exit 0；负例=真禁止键仍失败
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅近似键处置
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 near-miss material key RED 断言，保留 retired/forbidden key 负例。
- **executed_commands**：首次 gate exit 1，`MATERIAL_FORBIDDEN` 目标断言失败；非 fixture/setup 失败。
- **evidence_refs**：WH direct Vitest output，oracle=`NEAR_MISS_DROP_FACT`。
- **covered_ac**：`AC-STRICT-006`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：近似键当前仍在 allowlist 处中止。

#### T020 — GREEN：近似键 warn+drop+显式事实

- **ID**：T020
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：改 `review-materials.mjs:1997-2007` 使近似键 warn+drop+显式事实，真禁止键仍失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 / G-002 → FR-STRICT-006 → AC-STRICT-006
- **输入**：T019 的失败断言与已核实锚点
- **依赖**：T019
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-STRICT-006
- **AC**：AC-STRICT-006
- **动作**：:1997-1999 未知键改 warn+drop+写 `material_unknown_key_dropped` 显式事实；:2001 真禁止键、:2007 模板不符保持失败
- **精确文件**：`skills/wh-review/scripts/review-materials.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-materials.mjs`; symbols/regions: 仅 :1997-2007 未知键分支
- **输出**：GREEN 可观察：T019 断言通过
- **Knowledge**：丢弃事实字段名按 spec §7 合同（fact_kind/dropped_key/reason）
- **verification_role**：GREEN
- **paired_task**：T019
- **gate_cmd**：`npx vitest run tests/contract/review-materials-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`NEAR_MISS_DROP_FACT` — 同 oracle，成功信号：不中止 + 留痕 + 真禁止键仍失败
- **evidence_path**：`quality/evidence/build-code/near_miss_drop_fact/`
- **STOP**：需放宽真禁止键时停止
- **recovery**：卡执行者恢复
- **task risk**：误放行真禁止键
- **test tier / test method**：simple — 同 T019
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：WH `review-materials.mjs` 对未知非 retired key warn+drop，返回 `discarded_facts`; 真 forbidden/retired key 仍 fail。
- **executed_commands**：`npx vitest run tests/contract/review-materials-contract.test.mjs`，46/46 pass，exit 0。
- **evidence_refs**：WH direct Vitest output，oracle=`NEAR_MISS_DROP_FACT`。
- **covered_ac**：`AC-STRICT-006`
- **review_fact**：P3 phase review `unavailable`，attempt `c28e6681-66a6-5ff4-aae2-9b5082b06368`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：stderr 留 `MATERIAL_UNKNOWN_KEY_DROPPED`；bundle 不含被丢弃键。

#### T021 — RED：确认绑定读侧对称断言

- **ID**：T021
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：新增断言使“材料确认绑定的 revision/snapshot 读侧判别对称（复用 isExecutionRecordOnlyMaterialDelta/isStageMaterialOnlySnapshotDelta）”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-010 → AC-STRICT-010
- **输入**：plan.md Code Anchors（`stage-runner.mjs:1654-1694`、`git-worktree-snapshot.mjs:503-526`）
- **依赖**：T016
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-STRICT-010
- **AC**：AC-STRICT-010
- **动作**：在 WH `tests/contract/review-material-change-redispatch.test.mjs` 新增断言：只含执行记录的增量被读侧对称判别（不误判为材料漂移）；不改生产实现
- **精确文件**：`tests/contract/review-material-change-redispatch.test.mjs`
- **boundary**：files: `tests/contract/review-material-change-redispatch.test.mjs`; symbols/regions: 仅新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：现状 :1681 循环内 evidence.ref 前缀检查 + :1692 revision 检查为不对称焦点；谓词已存在 :1661-1667
- **verification_role**：RED
- **paired_task**：T022
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：1
- **oracle**：`CONFIRMATION_READ_SYMMETRY` — 执行记录增量仍被误判（断言失败）
- **evidence_path**：`quality/evidence/build-code/confirmation_read_symmetry/`
- **STOP**：命令损坏时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：误改写侧行为；谓词误用
- **test tier / test method**：simple — WH 既有测试文件内最小断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1；GREEN=exit 0；负例=真材料漂移仍被正确识别
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅读侧对称判别
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：无生产改动；认证 worktree 当前 `currentConfirmationCandidate` 已同时调用 execution-record-only 与 stage-material-only predicates，故未回滚制造 RED。
- **executed_commands**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`，7/7 pass，exit 0；源码定位确认读侧已有对称复用。
- **evidence_refs**：WH direct Vitest output + source inspection；RED=`unavailable_due_to_preexisting_symmetric_reader`。
- **covered_ac**：`AC-STRICT-010`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：未用 destructive rollback 制造失败；材料 revision mismatch 与 snapshot delta 仍按现有谓词判定。

#### T022 — GREEN：确认绑定读侧对称

- **ID**：T022
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：改 `stage-runner.mjs:1654-1694` 读侧判别复用两 delta 谓词，与写侧对称
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001 / D-015 → FR-STRICT-010 → AC-STRICT-010
- **输入**：T021 的失败断言与已核实锚点
- **依赖**：T021
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-STRICT-010
- **AC**：AC-STRICT-010
- **动作**：:1661-1667 复用 `isExecutionRecordOnlyMaterialDelta`/`isStageMaterialOnlySnapshotDelta` 使读侧对称；不新增绑定面
- **精确文件**：`runtime/stage/stage-runner.mjs`
- **boundary**：files: `runtime/stage/stage-runner.mjs`、`runtime/task/git-worktree-snapshot.mjs`; symbols/regions: 仅 currentConfirmationCandidate :1654-1694 读侧判别与 delta 谓词 :503-526
- **输出**：GREEN 可观察：T021 断言通过
- **Knowledge**：谓词定义 `git-worktree-snapshot.mjs:503-526,569-591`
- **verification_role**：GREEN
- **paired_task**：T021
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：0
- **oracle**：`CONFIRMATION_READ_SYMMETRY` — 同 oracle，成功信号：执行记录增量不误判
- **evidence_path**：`quality/evidence/build-code/confirmation_read_symmetry/`
- **STOP**：需新增绑定面时停止
- **recovery**：卡执行者恢复
- **task risk**：误改写侧
- **test tier / test method**：simple — 同 T021
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：无新增生产改动；读侧实现已符合计划中的两谓词复用。
- **executed_commands**：同 gate 7/7 pass，exit 0。
- **evidence_refs**：WH direct Vitest output；source anchors `stage-runner.mjs:1661-1667` 与 `git-worktree-snapshot.mjs:503-591`。
- **covered_ac**：`AC-STRICT-010`
- **review_fact**：P3 phase review `unavailable`，attempt `c28e6681-66a6-5ff4-aae2-9b5082b06368`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：现有实现已闭合本卡，不重复施工。

#### T023 — RED：移除集合精确匹配断言

- **ID**：T023
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：新增断言使“validateManagedHealthProviders 不再要求 provider 集合精确匹配（容许多余/缺失），保留逐成员校验”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-010 / D-015 / F-010 → FR-STRICT-011, FR-BOUNDARY-002 → AC-STRICT-011, AC-BOUNDARY-002
- **输入**：plan.md Code Anchors（`review-provider-client.mjs:621-666`，:626 集匹配）
- **依赖**：T022
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-STRICT-011, FR-BOUNDARY-002
- **AC**：AC-STRICT-011, AC-BOUNDARY-002
- **动作**：在 WH `tests/review/review-managed-lifecycle.test.mjs` 新增断言：health map 含多余/缺失 provider 时不再失败、逐成员字段仍校验；不改生产实现
- **精确文件**：`tests/review/review-managed-lifecycle.test.mjs`
- **boundary**：files: `tests/review/review-managed-lifecycle.test.mjs`; symbols/regions: 仅新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：:626 现要求集精确匹配；调用点 :711
- **verification_role**：RED
- **paired_task**：T024
- **gate_cmd**：`npx vitest run tests/review/review-managed-lifecycle.test.mjs`
- **expected_exit**：1
- **oracle**：`HEALTH_SET_RELAXED` — 集不匹配仍失败（断言失败）
- **evidence_path**：`quality/evidence/build-code/health_set_relaxed/`
- **STOP**：命令损坏时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：误移除逐成员校验
- **test tier / test method**：simple — WH 既有测试文件内最小断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1；GREEN=exit 0；负例=逐成员字段非法仍失败
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅集合精确匹配移除
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 managed health additive/missing map RED 断言。
- **executed_commands**：`npx vitest run tests/review/review-managed-lifecycle.test.mjs`，exit 1，目标 extra provider 在 strict set check 失败。
- **evidence_refs**：WH direct Vitest output，oracle=`HEALTH_SET_RELAXED`。
- **covered_ac**：`AC-STRICT-011`、`AC-BOUNDARY-002`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：RED 是集合精确匹配，不是 present-member field 校验失败。

#### T024 — GREEN：移除集合精确匹配

- **ID**：T024
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：删 `review-provider-client.mjs:626` 集精确匹配，保留 :629-664 逐成员校验
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-010 / D-015 / F-010 → FR-STRICT-011, FR-BOUNDARY-002 → AC-STRICT-011, AC-BOUNDARY-002
- **输入**：T023 的失败断言与已核实锚点
- **依赖**：T023
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-STRICT-011, FR-BOUNDARY-002
- **AC**：AC-STRICT-011, AC-BOUNDARY-002
- **动作**：删 :626 集匹配检查；:629-664 逐成员字段校验保留
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`; symbols/regions: 仅 validateManagedHealthProviders :626 及相关既有测试
- **输出**：GREEN 可观察：T023 断言通过
- **Knowledge**：只拆有旁证的 1 处；其余合并新增判定不动
- **verification_role**：GREEN
- **paired_task**：T023
- **gate_cmd**：`npx vitest run tests/review/review-managed-lifecycle.test.mjs`
- **expected_exit**：0
- **oracle**：`HEALTH_SET_RELAXED` — 同 oracle，成功信号：集不匹配通过、逐成员仍校验
- **evidence_path**：`quality/evidence/build-code/health_set_relaxed/`
- **STOP**：需动其它合并判定时停止
- **recovery**：卡执行者恢复
- **task risk**：误删逐成员校验
- **test tier / test method**：simple — 同 T023
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：WH `review-provider-client.mjs` health map 只保留已配置且实际出现的成员，忽略 additive unknown，缺失成员保持 absent；present member 字段校验不变。
- **executed_commands**：`npx vitest run tests/review/review-managed-lifecycle.test.mjs`，30/30 pass，exit 0。
- **evidence_refs**：WH direct Vitest output，oracle=`HEALTH_SET_RELAXED`。
- **covered_ac**：`AC-STRICT-011`、`AC-BOUNDARY-002`
- **review_fact**：P3 phase review `unavailable`，attempt `c28e6681-66a6-5ff4-aae2-9b5082b06368`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：present member malformed status/error/path 仍由原有逐成员校验拒绝。

#### T025 — RED：bounds 对齐宽松侧断言

- **ID**：T025
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：新增断言使“skill 侧 review-input-bounds 对齐 runtime 宽松侧、删除 :110 过大即失败抛出”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-003 / D-015 → FR-BOUNDARY-001 → AC-BOUNDARY-001
- **输入**：plan.md Code Anchors（skill `review-input-bounds.mjs:110`）
- **依赖**：T024
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-BOUNDARY-001
- **AC**：AC-BOUNDARY-001
- **动作**：在 WH `tests/contract/review-input-bounds-portability.test.mjs` 新增断言：compactVerifyCodeMaterials 的 test-candidate 过大不再 fail-closed（与 runtime 一致）；不改生产实现
- **精确文件**：`tests/contract/review-input-bounds-portability.test.mjs`
- **boundary**：files: `tests/contract/review-input-bounds-portability.test.mjs`; symbols/regions: 仅新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：skill 侧 :110 多一个 fail-closed MATERIAL_TOO_LARGE；runtime 无
- **verification_role**：RED
- **paired_task**：T026
- **gate_cmd**：`npx vitest run tests/contract/review-input-bounds-portability.test.mjs`
- **expected_exit**：1
- **oracle**：`BOUNDS_ALIGNED_LOOSE` — 仍 fail-closed（断言失败）
- **evidence_path**：`quality/evidence/build-code/bounds_aligned_loose/`
- **STOP**：命令损坏时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：误删 runtime 侧既有 throw
- **test tier / test method**：simple — WH 既有测试文件内最小断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1；GREEN=exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅 bounds 对齐
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 skill bundle 源闭包断言，锁定 skill-only `implementation/test` fail-closed guard。
- **executed_commands**：首次 portability gate exit 1；先因本 Phase `review-materials` hash 漂移暴露 closure 事实，更新 bundle/catalog hashes 后目标 guard 断言仍真实失败。
- **evidence_refs**：WH direct Vitest output，oracle=`BOUNDS_ALIGNED_LOOSE`。
- **covered_ac**：`AC-BOUNDARY-001`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：RED guard 位于 skill `review-input-bounds.mjs`，runtime 侧未改。

#### T026 — GREEN：bounds 对齐宽松侧

- **ID**：T026
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：删 skill `review-input-bounds.mjs:110` fail-closed MATERIAL_TOO_LARGE 抛出，对齐 runtime 宽松侧
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-003 / D-015 → FR-BOUNDARY-001 → AC-BOUNDARY-001
- **输入**：T025 的失败断言与已核实锚点
- **依赖**：T025
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-BOUNDARY-001
- **AC**：AC-BOUNDARY-001
- **动作**：删 skill `review-input-bounds.mjs:109-111` 的 test-candidate fail-closed 抛出，对齐 runtime；不动 runtime 侧
- **精确文件**：`skills/wh-review/scripts/review-input-bounds.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-input-bounds.mjs`、`runtime/review/review-input-bounds.mjs`; symbols/regions: 仅 skill 侧 :109-111，runtime 侧只读对齐
- **输出**：GREEN 可观察：T025 断言通过
- **Knowledge**：对齐后需同步重算 skill bundle 哈希（RK-5）
- **verification_role**：GREEN
- **paired_task**：T025
- **gate_cmd**：`npx vitest run tests/contract/review-input-bounds-portability.test.mjs`
- **expected_exit**：0
- **oracle**：`BOUNDS_ALIGNED_LOOSE` — 同 oracle，成功信号：与 runtime 一致
- **evidence_path**：`quality/evidence/build-code/bounds_aligned_loose/`
- **STOP**：需动 runtime 侧时停止
- **recovery**：卡执行者恢复
- **task risk**：误删 runtime throw
- **test tier / test method**：simple — 同 T025
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：删除 skill-only test-candidate fail-closed guard；同步 `skill-bundle.json` 与 `skills/catalog.yaml` resolver hash。
- **executed_commands**：`npx vitest run tests/contract/review-input-bounds-portability.test.mjs`，2/2 pass，exit 0。
- **evidence_refs**：WH direct Vitest output，oracle=`BOUNDS_ALIGNED_LOOSE`。
- **covered_ac**：`AC-BOUNDARY-001`
- **review_fact**：P3 phase review `unavailable`，attempt `c28e6681-66a6-5ff4-aae2-9b5082b06368`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：runtime `review-input-bounds.mjs` 未改；skill bundle release closure 可构建。

#### T027 — RED：4.6 跳过错账一致断言

- **ID**：T027
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：新增断言使“spec-analyze 跳过时同时写 facts.spec_analyze 与 errors（而非其一）”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / D-007 / D-010 → FR-CANDIDATE-006 → AC-CANDIDATE-006
- **输入**：plan.md Code Anchors（`stage-content-contracts.mjs:5962,5990,6011,6036`）
- **依赖**：T026
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-006
- **AC**：AC-CANDIDATE-006
- **动作**：在 WH `tests/review` 内新增断言：无标题正文被跳过时同时进 facts.spec_analyze 与 errors；hasMarkdownHeadings 判别不变；不改生产实现
- **精确文件**：`tests/review/review-record-route.test.mjs`
- **boundary**：files: `tests/review/review-record-route.test.mjs`; symbols/regions: 仅新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：:5962 初始化、:5990/:6011 跳过写入、:6036 facts.spec_analyze 透出；errors :5958/:5986/:6007
- **verification_role**：RED
- **paired_task**：T028
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs`
- **expected_exit**：1
- **oracle**：`SKIP_GOES_TO_ERRORS` — 只进其一（断言失败）
- **evidence_path**：`quality/evidence/build-code/skip_goes_to_errors/`
- **STOP**：需新增判别面时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：新增判别面；误改 hasMarkdownHeadings
- **test tier / test method**：simple — WH 既有测试文件内最小断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1；GREEN=exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅 4.6 跳过错账
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `validateStageSpecAnalyzeProfile` skip ledger RED 断言。
- **executed_commands**：初次 focused test exit 1；facts.spec_analyze 已存在但 errors 缺少 skip 记录，目标失败真实可见。
- **evidence_refs**：WH direct Vitest output，oracle=`SKIP_GOES_TO_ERRORS`。
- **covered_ac**：`AC-CANDIDATE-006`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：RED 不是材料缺失伪装；断言已看到 skip fact，只有错误账缺项。

#### T028 — GREEN：4.6 跳过错账一致

- **ID**：T028
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：改 `stage-content-contracts.mjs` 使 spec-analyze 跳过时同时写 facts.spec_analyze 与 errors，判别面不变
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / D-007 / D-010 → FR-CANDIDATE-006 → AC-CANDIDATE-006
- **输入**：T027 的失败断言与已核实锚点
- **依赖**：T027
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-006
- **AC**：AC-CANDIDATE-006
- **动作**：跳过路径同时写 facts.spec_analyze（:6036 已透出）与 errors，不新增判别面
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`; symbols/regions: 仅 spec_analyze 跳过 :5962-6036
- **输出**：GREEN 可观察：T027 断言通过
- **Knowledge**：hasMarkdownHeadings:3511 不动
- **verification_role**：GREEN
- **paired_task**：T027
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs`
- **expected_exit**：0
- **oracle**：`SKIP_GOES_TO_ERRORS` — 同 oracle，成功信号：两账一致
- **evidence_path**：`quality/evidence/build-code/skip_goes_to_errors/`
- **STOP**：需新增判别面时停止
- **recovery**：卡执行者恢复
- **task risk**：误改判别面
- **test tier / test method**：simple — 同 T027
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：WH `stage-content-contracts.mjs` 在 make-decision/build-spec skip 路径同时写 `facts.spec_analyze` 与 `errors`；`hasMarkdownHeadings` 未改。
- **executed_commands**：focused `npx vitest run ... -t "RED: keeps a spec-analyze skip"`，1/1 pass，exit 0。
- **evidence_refs**：WH direct Vitest output，oracle=`SKIP_GOES_TO_ERRORS`。
- **covered_ac**：`AC-CANDIDATE-006`
- **review_fact**：P3 phase review `unavailable`，attempt `c28e6681-66a6-5ff4-aae2-9b5082b06368`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：错误账追加 `spec-analyze skipped: ...`，不新增判别面。

#### T029 — RED：4.4 未识别严重度留痕断言

- **ID**：T029
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：新增断言使“未知 severity 的 finding 不再静默 return null，而是丢弃并留显式事实，7 红线不动”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / D-005 / D-006 / D-021 → FR-CANDIDATE-003, FR-CANDIDATE-004 → AC-CANDIDATE-003, AC-CANDIDATE-004
- **输入**：plan.md Code Anchors（`review-output.mjs:24` null-drop、:1-4 severityAliases）
- **依赖**：T028
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-003, FR-CANDIDATE-004
- **AC**：AC-CANDIDATE-003, AC-CANDIDATE-004
- **动作**：在 WH `tests/contract/review-layering.test.mjs` 新增断言：未知 severity finding 被丢弃且留显式事实、红线不动；歧义/多候选规则成文；不改生产实现
- **精确文件**：`tests/contract/review-layering.test.mjs`
- **boundary**：files: `tests/contract/review-layering.test.mjs`; symbols/regions: 仅新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：:24 `if(!severity) return null` 静默丢弃；needsEvidence :31
- **verification_role**：RED
- **paired_task**：T030
- **gate_cmd**：`npx vitest run tests/contract/review-layering.test.mjs`
- **expected_exit**：1
- **oracle**：`UNKNOWN_SEVERITY_DROP_FACT` — 仍静默丢弃（断言失败）
- **evidence_path**：`quality/evidence/build-code/unknown_severity_drop_fact/`
- **STOP**：需改 7 红线时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：误改红线
- **test tier / test method**：simple — WH 既有测试文件内最小断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1；GREEN=exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅 4.4 未识别严重度
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 production parser unknown severity RED 断言。
- **executed_commands**：`npx vitest run tests/contract/review-layering.test.mjs`，exit 1；未知 severity 返回空 findings 但无显式事实。
- **evidence_refs**：WH direct Vitest output，oracle=`UNKNOWN_SEVERITY_DROP_FACT`。
- **covered_ac**：`AC-CANDIDATE-003`、`AC-CANDIDATE-004`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：RED 锁定静默 `return null`，未触碰 7 条红线。

#### T030 — GREEN：4.4 未识别严重度留痕 + 歧义规则成文

- **ID**：T030
- **Phase**：Phase P3 — workflowhub 严格判定收敛
- **goal**：改 `review-output.mjs:24` 使未知 severity 丢弃并留显式事实，红线不动；歧义/多候选规则成文
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / D-005 / D-006 / D-021 → FR-CANDIDATE-003, FR-CANDIDATE-004 → AC-CANDIDATE-003, AC-CANDIDATE-004
- **输入**：T029 的失败断言与已核实锚点
- **依赖**：T029
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-003, FR-CANDIDATE-004
- **AC**：AC-CANDIDATE-003, AC-CANDIDATE-004
- **动作**：:24 未知 severity 改丢弃 + 显式事实；歧义/多候选确定性规则成文；红线不动
- **精确文件**：`runtime/review/review-output.mjs`
- **boundary**：files: `runtime/review/review-output.mjs`; symbols/regions: 仅 severity 处置 :23-31
- **输出**：GREEN 可观察：T029 断言通过
- **Knowledge**：7 红线对应检查不动
- **verification_role**：GREEN
- **paired_task**：T029
- **gate_cmd**：`npx vitest run tests/contract/review-layering.test.mjs`
- **expected_exit**：0
- **oracle**：`UNKNOWN_SEVERITY_DROP_FACT` — 同 oracle，成功信号：留痕 + 红线不动
- **evidence_path**：`quality/evidence/build-code/unknown_severity_drop_fact/`
- **STOP**：需改红线时停止
- **recovery**：卡执行者恢复
- **task risk**：误改红线
- **test tier / test method**：simple — 同 T029
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：WH `runtime/review/review-output.mjs` 对 unknown severity 输出 `discarded_facts`，JSONL/fence/first-candidate 解析保留事实；确定性首个可解析候选规则保持。
- **executed_commands**：`npx vitest run tests/contract/review-layering.test.mjs`，15/15 pass，exit 0。
- **evidence_refs**：WH direct Vitest output，oracle=`UNKNOWN_SEVERITY_DROP_FACT`。
- **covered_ac**：`AC-CANDIDATE-003`、`AC-CANDIDATE-004`
- **review_fact**：P3 phase review `unavailable`，attempt `c28e6681-66a6-5ff4-aae2-9b5082b06368`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：红线严重 finding evidence 要求与 URI/path 边界负例均保持原断言。

### Verify

- **Target**：FR-STRICT-003/005/006/010/011、FR-BOUNDARY-001/002、FR-CANDIDATE-003/004/006；AC 对应；跨任务 seam：8 对 RED/GREEN
- **gate_cmd**：各卡 gate_cmd（`npx vitest run tests/{contract/review-materials-contract,contract/review-material-change-redispatch,contract/review-input-bounds-portability,contract/review-layering,review/review-managed-lifecycle,review/review-record-route}.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`，前置 `npm ci`）
- **expected_exit**：RED=1 / GREEN=0
- **evidence_path**：各 oracle 目录
- **Oracle**：DEAD_CONSTANT_REMOVED、ANCHOR_DROP_FACT、NEAR_MISS_DROP_FACT、CONFIRMATION_READ_SYMMETRY、HEALTH_SET_RELAXED、BOUNDS_ALIGNED_LOOSE、SKIP_GOES_TO_ERRORS、UNKNOWN_SEVERITY_DROP_FACT

### Knowledge

WH 测试栈 vitest（先 `npm ci`）；丢弃事实字段名以 spec §7 合同为准；A3/B2/B5/E/G 无既有测试，已设计最小 RED；谓词定义 git-worktree-snapshot.mjs:503-591；4.6 hasMarkdownHeadings:3511 不动。

### STOP

需改 7 红线、新增判别面、动 runtime 侧既有 throw 或活 sibling 时 → STOP 回决策材料。

### Done

8 对 RED/GREEN 通过；负例保留（真禁止键仍失败、逐成员仍校验、活 sibling 仍可用、真材料漂移仍识别）。

### Risks and rollback

- **Risk**：PLAN-RISK-002/003 — 无测试覆盖项臆造行号；丢弃事实字段漂移
- **Prevention**：RED 走最近既有测试文件；字段名以 spec §7 合同逐字
- **Rollback / recovery**：回滚对应卡文件改动，保留 PARTIAL 证据

## Phase P4 — cancelManaged 接线

### Goal

源漂移事实下调用 broker.cancelManaged(runtime_id) 真正终止卡死成员；改写 5 处守卫为仅源漂移下调 + 新增独立墙钟禁止断言；墙钟守卫块 :526-558 不改。

### Files

- **NEW**：N/A
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`、`tests/review/review-managed-lifecycle.test.mjs`
- **DO NOT TOUCH**：墙钟守卫块 `:526-558`；BR `lib/broker.mjs:795`

### Tasks

- T031：RED 源漂移下调、墙钟不调断言
- T032：GREEN 守卫改写 + 墙钟禁止断言 + 接线

#### T031 — RED：源漂移下调、墙钟不调断言

- **ID**：T031
- **Phase**：Phase P4 — cancelManaged 接线
- **goal**：新增断言使“源漂移事实下调用 cancelManaged、墙钟计时不调用”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-002 / D-005 → FR-CANCEL-001, FR-CANCEL-002 → AC-CANCEL-001, AC-CANCEL-002
- **输入**：plan.md Code Anchors（守卫 :378,:433,:478,:507,:584；生产 broker.mjs:795 + scripts/3rd-review.mjs:62）
- **依赖**：T018
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANCEL-001, FR-CANCEL-002
- **AC**：AC-CANCEL-001, AC-CANCEL-002
- **动作**：在 WH `tests/review/review-managed-lifecycle.test.mjs` 改写守卫为“源漂移下调、墙钟不调”并新增独立墙钟禁止断言；不改生产实现
- **精确文件**：`tests/review/review-managed-lifecycle.test.mjs`
- **boundary**：files: `tests/review/review-managed-lifecycle.test.mjs`; symbols/regions: 守卫 :378,:433,:478,:507,:584 + 新增墙钟禁止断言；不进入 :526-558 块
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：:540 在墙钟块 :526-558 内保持不调；生产路径 broker.mjs:795（非 WH 客户端对象参数版 :899）
- **verification_role**：RED
- **paired_task**：T032
- **gate_cmd**：`npx vitest run tests/review/review-managed-lifecycle.test.mjs`
- **expected_exit**：1
- **oracle**：`CANCEL_ON_SOURCE_DRIFT_ONLY` — 源漂移未调或墙钟误调（断言失败）
- **evidence_path**：`quality/evidence/build-code/cancel_on_source_drift_only/`
- **STOP**：需动 :526-558 墙钟块时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：误触墙钟块；用错取消接口
- **test tier / test method**：feature — 生命周期守卫改写（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1；GREEN=exit 0；负例=墙钟块用例原样通过
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅取消接线守卫
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 source-drift cancel RED lifecycle test；墙钟测试未改。
- **executed_commands**：focused `npx vitest run tests/review/review-managed-lifecycle.test.mjs -t "RED: cancels the managed runtime"`，exit 1；调用序列缺少 cancel，目标断言真实失败。
- **evidence_refs**：WH direct Vitest output，oracle=`CANCEL_ON_SOURCE_DRIFT_ONLY`。
- **covered_ac**：`AC-CANCEL-001`、`AC-CANCEL-002`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：RED 仅验证源漂移；未进入 :526-558 墙钟块。

#### T032 — GREEN：守卫改写 + 墙钟禁止断言 + 接线

- **ID**：T032
- **Phase**：Phase P4 — cancelManaged 接线
- **goal**：守卫 :378,:433,:478,:507,:584 改写为仅源漂移下调；新增独立墙钟禁止断言；simple-review-runner 接通 broker.cancelManaged(runtime_id)；墙钟块 :526-558 不改
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-002 / D-005 → FR-CANCEL-001, FR-CANCEL-002 → AC-CANCEL-001, AC-CANCEL-002
- **输入**：T031 的失败断言与已核实锚点
- **依赖**：T031
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANCEL-001, FR-CANCEL-002
- **AC**：AC-CANCEL-001, AC-CANCEL-002
- **动作**：守卫改写 + 新增墙钟禁止断言；runner :574-582 区域接通 broker.cancelManaged(runtime_id)；披露只用既有成员级字段
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`；`tests/review/review-managed-lifecycle.test.mjs`
- **boundary**：files: 上述两文件; symbols/regions: runner :545-588 取消接线；测试守卫 :378,:433,:478,:507,:584 + 新增断言；不进入 :526-558
- **输出**：GREEN 可观察：T031 断言通过
- **Knowledge**：生产入口 scripts/3rd-review.mjs:62；墙钟块 :540 fake 保持不调
- **verification_role**：GREEN
- **paired_task**：T031
- **gate_cmd**：`npx vitest run tests/review/review-managed-lifecycle.test.mjs`
- **expected_exit**：0
- **oracle**：`CANCEL_ON_SOURCE_DRIFT_ONLY` — 同 oracle，成功信号：源漂移调、墙钟不调
- **evidence_path**：`quality/evidence/build-code/cancel_on_source_drift_only/`
- **STOP**：需动墙钟块或用 WH 客户端对象参数版时停止
- **recovery**：卡执行者恢复
- **task risk**：误触墙钟块
- **test tier / test method**：feature — 同 T031
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：WH `simple-review-runner.mjs` 在 `REVIEW_SOURCE_DRIFT` catch 中调用既有 `client.cancelManaged`，传递 runtime/request/provider/material context；取消失败保留为 `cancel_error`，原错误码不覆盖；墙钟分支不调用。
- **executed_commands**：`npx vitest run tests/review/review-managed-lifecycle.test.mjs`，31/31 pass，exit 0。
- **evidence_refs**：WH direct Vitest output，oracle=`CANCEL_ON_SOURCE_DRIFT_ONLY`。
- **covered_ac**：`AC-CANCEL-001`、`AC-CANCEL-002`
- **review_fact**：P4 phase review `unavailable`，attempt `52191430-c879-56e5-a6c2-3b5e04d3ab7d`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：source drift 调用 `cancelManaged(runtime_id)` 路径；live poll/status error/wall-clock/terminal recheck 负例保持 no-cancel。

### Verify

- **Target**：FR-CANCEL-001/002；AC-CANCEL-001/002
- **gate_cmd**：`npx vitest run tests/review/review-managed-lifecycle.test.mjs`
- **expected_exit**：RED=1 / GREEN=0
- **evidence_path**：`quality/evidence/build-code/cancel_on_source_drift_only/`
- **Oracle**：CANCEL_ON_SOURCE_DRIFT_ONLY

### Knowledge

生产取消路径 = broker.mjs:795 cancelManaged(runtime_id) + scripts/3rd-review.mjs:62；墙钟块 :526-558 含 :540 fake，保持不改；WH 客户端对象参数版 :899 零生产调用不用。

### STOP

需动墙钟块、用 WH 客户端对象参数版、或改公共 broker API 时 → STOP。

### Done

守卫改写、墙钟禁止断言新增、接线落地、测试通过；墙钟块用例原样通过。

### Risks and rollback

- **Risk**：PLAN-RISK-004 — 改写误触墙钟块引入墙钟取消
- **Prevention**：:526-558 不进入；新断言独立于该块
- **Rollback / recovery**：回滚 runner + 测试文件改动

## Phase P5 — 候选收口与最终聚合

### Goal

4.2 digest 两轴拆分、4.3 一次即熔断 + 聚合健康预检被路由消费、4.7 八项候选收口、对外只产 PROCESS_TIMEOUT；最终聚合验证全部 26 AC。

### Files

- **NEW**：N/A
- **MODIFY**：`runtime/review/canonical-review-result.mjs`、`runtime/review/review-route-identity.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/review/integration-review-subject.mjs`、派发缝（build-code 定位）、BR `lib/adapters/antigravity.mjs`、`lib/provider-failure.mjs` + 既有测试、`tests/contract/review-material-change-redispatch.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`test/provider-failure.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`test/managed-session-lifecycle.test.mjs`、`test/attachments-protocol.test.mjs`、`test/workflowhub-result-v3.test.mjs`
- **DO NOT TOUCH**：无新 wire 字段/第二套摘要

### Tasks

- T033/T034：4.2 digest 两轴拆分（RED→GREEN）
- T035/T036：4.3 同指纹熔断（RED→GREEN）
- T037/T038：4.3 聚合健康预检被路由消费（RED→GREEN）
- T039/T040：4.4-candidate 对外只产 PROCESS_TIMEOUT（RED→GREEN）
- T041：4.7 八项逐项落地核验（N/A 聚合）
- T042：FINAL 聚合验证

#### T033 — RED：4.2 digest 两轴拆分断言

- **ID**：T033
- **Phase**：Phase P5 — 候选收口与最终聚合
- **goal**：新增断言使“digest 按 behavior/governance 两轴拆分、格式类改动不再使测试/审查失效、历史可读”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / D-004 / D-020 → FR-CANDIDATE-001 → AC-CANDIDATE-001
- **输入**：spec.md FR-CANDIDATE-001 两轴合同；producer=`runtime/task/material-workspace.mjs`，behavior consumer=`runtime/review/integration-review-subject.mjs`。
- **依赖**：T002
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-001
- **AC**：AC-CANDIDATE-001
- **动作**：新增 behavior/governance 两轴与格式噪声稳定性断言；不改生产实现
- **精确文件**：`tests/contract/material-workspace.test.mjs`、`tests/contract/integration-review-subject.test.mjs`
- **boundary**：files: 上述两个契约测试；symbols/regions: material digest axes 与 integration subject material revision
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：RED 只证明旧实现没有两轴行为；不把 RED 的旧失败当作 setup 失败。
- **verification_role**：RED
- **paired_task**：T034
- **gate_cmd**：`npx vitest run tests/contract/material-workspace.test.mjs tests/contract/integration-review-subject.test.mjs`
- **expected_exit**：1
- **oracle**：`DIGEST_TWO_AXIS_SPLIT` — 未拆分或历史不可读（断言失败）
- **evidence_path**：`quality/evidence/build-code/digest_two_axis_split/`
- **STOP**：需新增 wire 字段/第二套摘要时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：臆造拆分函数位置
- **test tier / test method**：feature — digest 行为断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1；GREEN=exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅 4.2 两轴拆分
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增两轴摘要与 integration review 行为投影契约测试；旧实现保留为 RED 基线。
- **executed_commands**：`npx vitest run tests/contract/material-workspace.test.mjs tests/contract/integration-review-subject.test.mjs`，exit 1；19 tests 中 2 个目标断言失败、17 个通过。
- **evidence_refs**：WH direct Vitest output，oracle=`DIGEST_TWO_AXIS_SPLIT`。
- **covered_ac**：`AC-CANDIDATE-001`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：旧实现把行为/治理两轴折叠为同一 raw digest；RED 是行为断言失败，不是 import/fixture 失败。

#### T034 — GREEN：4.2 digest 两轴拆分

- **ID**：T034
- **Phase**：Phase P5 — 候选收口与最终聚合
- **goal**：在现有材料 producer/consumer 内实现 behavior/governance 两轴拆分；不新增线上字段或历史迁移
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / D-004 / D-020 → FR-CANDIDATE-001 → AC-CANDIDATE-001
- **输入**：T033 的失败断言
- **依赖**：T033
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-001
- **AC**：AC-CANDIDATE-001
- **动作**：`materialDigestAxes` 保留 raw-byte governance digest，生成格式归一化 behavior digest；integration review 使用既有 `material_revision.sha256` 字段承载 behavior digest；不新增第二套摘要/wire 字段
- **精确文件**：`runtime/task/material-workspace.mjs`、`runtime/review/integration-review-subject.mjs`
- **boundary**：files: 上述两个 producer/consumer 文件及对应契约测试；symbols/regions: 四份材料摘要与 integration subject current material binding
- **输出**：GREEN 可观察：T033 断言通过
- **Knowledge**：治理摘要沿用现有 `material_digest`；旧记录只读兼容，不回填、不迁移。
- **verification_role**：GREEN
- **paired_task**：T033
- **gate_cmd**：`npx vitest run tests/contract/material-workspace.test.mjs tests/contract/integration-review-subject.test.mjs`
- **expected_exit**：0
- **oracle**：`DIGEST_TWO_AXIS_SPLIT` — 同 oracle，成功信号：两轴拆分、历史可读
- **evidence_path**：`quality/evidence/build-code/digest_two_axis_split/`
- **STOP**：需新增 wire 字段时停止
- **recovery**：卡执行者恢复
- **task risk**：臆造位置
- **test tier / test method**：feature — 同 T033
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：WH `material-workspace.mjs` 新增内部两轴 producer；`integration-review-subject.mjs` 使用 behavior 轴，既有 `material_digest` 保持 governance/raw-byte 语义；无新 wire 字段。
- **executed_commands**：同 T033 gate，19/19 pass，exit 0。
- **evidence_refs**：WH direct Vitest output，oracle=`DIGEST_TWO_AXIS_SPLIT`。
- **covered_ac**：`AC-CANDIDATE-001`
- **review_fact**：P5 phase review canonical identity reused attempt `35741e8e-b9bc-5d41-a35a-5e23355d5434`；`unavailable`，provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：格式噪声保持 behavior digest 与 integration subject 可复用；语义结构改变会改变 behavior digest；旧治理摘要读取路径保持不变。

#### T035 — RED：同指纹熔断断言

- **ID**：T035
- **Phase**：Phase P5 — 候选收口与最终聚合
- **goal**：新增断言使“同一指纹不重复派发、缺可派发 provider 不盲目重发”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / F-003 → FR-CANDIDATE-007 → AC-CANDIDATE-007
- **输入**：plan.md（4.3 熔断，接入点 PENDING）
- **依赖**：T034
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-007
- **AC**：AC-CANDIDATE-007
- **动作**：在 WH `tests/contract/review-material-change-redispatch.test.mjs` 新增断言：同指纹二次进入不重复派发；不改生产实现
- **精确文件**：`tests/contract/review-material-change-redispatch.test.mjs`
- **boundary**：files: `tests/contract/review-material-change-redispatch.test.mjs`; symbols/regions: 仅新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：熔断接入点 PENDING（runtime 无现成 circuit 点），build-code 在派发缝定位（PLAN-RISK-002）
- **verification_role**：RED
- **paired_task**：T036
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：1
- **oracle**：`SAME_FINGERPRINT_CIRCUIT_BREAK` — 重复派发（断言失败）
- **evidence_path**：`quality/evidence/build-code/same_fingerprint_circuit_break/`
- **STOP**：需引入新状态机时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：臆造接入点
- **test tier / test method**：feature — 派发行为断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1；GREEN=exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅同指纹熔断
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增同指纹 quorum-blocked 重入断言；未回滚现有派发缝，行为在当前实现中已存在。
- **executed_commands**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs -t "does not redispatch a blocked quorum result for the same review fingerprint"`，1/1 pass，exit 0；未制造破坏性 RED。
- **evidence_refs**：WH direct Vitest output，oracle=`SAME_FINGERPRINT_CIRCUIT_BREAK`。
- **covered_ac**：`AC-CANDIDATE-007`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：当前 `findReusableReview`/request lock 已对同一 review fingerprint 复用 blocked result，未重复调用 `runRound`；本项按 pre-existing-green 记录。

#### T036 — GREEN：同指纹熔断

- **ID**：T036
- **Phase**：Phase P5 — 候选收口与最终聚合
- **goal**：在派发缝实现一次即熔断；build-code 定位窄接入点
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / F-003 → FR-CANDIDATE-007 → AC-CANDIDATE-007
- **输入**：T035 的失败断言
- **依赖**：T035
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-007
- **AC**：AC-CANDIDATE-007
- **动作**：build-code 在派发缝定位熔断点，实现同指纹不重复派发；不引入新状态机
- **精确文件**：`runtime/review/review-record-route.mjs`（派发缝，接入点 build-code 定位）
- **boundary**：files: 派发相关文件; symbols/regions: 派发入口
- **输出**：GREEN 可观察：T035 断言通过
- **Knowledge**：接入点 PENDING，定位失败 STOP（PLAN-RISK-002）
- **verification_role**：GREEN
- **paired_task**：T035
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：0
- **oracle**：`SAME_FINGERPRINT_CIRCUIT_BREAK` — 同 oracle，成功信号：不重复派发
- **evidence_path**：`quality/evidence/build-code/same_fingerprint_circuit_break/`
- **STOP**：需新状态机时停止
- **recovery**：卡执行者恢复
- **task risk**：臆造接入点
- **test tier / test method**：feature — 同 T035
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：N/A — 现有 `runtime/review/review-record-route.mjs` 派发缝已提供一次性复用/熔断语义；只补契约测试，不新增状态机。
- **executed_commands**：同 T035 focused Vitest，1/1 pass，exit 0。
- **evidence_refs**：WH direct Vitest output，oracle=`SAME_FINGERPRINT_CIRCUIT_BREAK`。
- **covered_ac**：`AC-CANDIDATE-007`
- **review_fact**：P5 phase review canonical identity reused attempt `35741e8e-b9bc-5d41-a35a-5e23355d5434`；`unavailable`，provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：同指纹重复进入复用 immutable refs；provider/route 未发生可认证变化时不盲目二次派发。

#### T037 — RED：聚合健康预检被路由消费断言

- **ID**：T037
- **Phase**：Phase P5 — 候选收口与最终聚合
- **goal**：新增断言使“聚合健康预检结论被阶段路由消费（而非只写诊断）”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / F-003 → FR-CANDIDATE-008 → AC-CANDIDATE-008
- **输入**：plan.md（4.3 预检消费，接入点 PENDING）
- **依赖**：T036
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-008
- **AC**：AC-CANDIDATE-008
- **动作**：在 WH `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` 新增断言：预检结论被阶段路由消费；不改生产实现
- **精确文件**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`; symbols/regions: 仅新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：预检面 simple-review-runner.mjs:906-946；路由接入点 PENDING（PLAN-RISK-002）
- **verification_role**：RED
- **paired_task**：T038
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：1
- **oracle**：`HEALTH_PRECHECK_CONSUMED` — 只写诊断未被消费（断言失败）
- **evidence_path**：`quality/evidence/build-code/health_precheck_consumed/`
- **STOP**：需新增遥测面时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：臆造路由接入点
- **test tier / test method**：feature — 预检路由断言（vitest）
- **scenarios / commands / expected exit / oracle**：RED=exit 1；GREEN=exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅预检消费
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 `tests/review/review-record-route.test.mjs` 新增预检 quorum shortfall 的阶段路由消费断言；未改生产路由。
- **executed_commands**：`npx vitest run tests/review/review-record-route.test.mjs -t "consumes a provider-preflight quorum shortfall before dispatch"`，1/1 pass，exit 0；当前实现已满足行为，未制造破坏性 RED。
- **evidence_refs**：WH direct Vitest output，oracle=`HEALTH_PRECHECK_CONSUMED`。
- **covered_ac**：`AC-CANDIDATE-008`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：预检后的 quorum shortfall 被 `recordSimpleReviewRequest` 记录为 `blocked_before_dispatch`，attempt `provider_attempts=[]`，brokerCalls=0；本项按 pre-existing-green 记录。

#### T038 — GREEN：聚合健康预检被路由消费

- **ID**：T038
- **Phase**：Phase P5 — 候选收口与最终聚合
- **goal**：使聚合健康预检结论被阶段路由消费；build-code 定位路由接入点
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / F-003 → FR-CANDIDATE-008 → AC-CANDIDATE-008
- **输入**：T037 的失败断言
- **依赖**：T037
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-008
- **AC**：AC-CANDIDATE-008
- **动作**：build-code 定位路由接入点，使预检结论被阶段路由消费；不新增遥测面
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`（预检路由，接入点 build-code 定位）
- **boundary**：files: 预检与路由相关文件; symbols/regions: 预检结论消费点
- **输出**：GREEN 可观察：T037 断言通过
- **Knowledge**：接入点 PENDING，定位失败 STOP（PLAN-RISK-002）
- **verification_role**：GREEN
- **paired_task**：T037
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：0
- **oracle**：`HEALTH_PRECHECK_CONSUMED` — 同 oracle，成功信号：被路由消费
- **evidence_path**：`quality/evidence/build-code/health_precheck_consumed/`
- **STOP**：需新增遥测面时停止
- **recovery**：卡执行者恢复
- **task risk**：臆造接入点
- **test tier / test method**：feature — 同 T037
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：WH worktree；前置 `npm ci`
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：N/A — 既有 `simple-review-runner` 预检输出与 `recordSimpleReviewRequest` 记录消费者已闭合；新增路由行为测试，不新增遥测面。
- **executed_commands**：同 T037 focused Vitest，1/1 pass，exit 0。
- **evidence_refs**：WH direct Vitest output，oracle=`HEALTH_PRECHECK_CONSUMED`。
- **covered_ac**：`AC-CANDIDATE-008`
- **review_fact**：P5 phase review canonical identity reused attempt `35741e8e-b9bc-5d41-a35a-5e23355d5434`；`unavailable`，provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：阶段路由消费预检结论并持久化 blocked/unavailable 事实，未进入 provider dispatch。

#### T039 — RED：对外只产 PROCESS_TIMEOUT 断言

- **ID**：T039
- **Phase**：Phase P5 — 候选收口与最终聚合
- **goal**：新增断言使“打印超时对外只产 PROCESS_TIMEOUT、真实原因存 cause_code、不再产 PROVIDER_PRINT_TIMEOUT”成为可证伪失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / D-013 → FR-CANDIDATE-002 → AC-CANDIDATE-002
- **输入**：plan.md Code Anchors（antigravity.mjs:7-8、provider-failure.mjs:67）
- **依赖**：T038
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-002
- **AC**：AC-CANDIDATE-002
- **动作**：在 BR `test/provider-failure.test.mjs` 新增断言：打印超时对外产 PROCESS_TIMEOUT + cause_code、不产 PROVIDER_PRINT_TIMEOUT；不改生产实现
- **精确文件**：`test/provider-failure.test.mjs`（BR）
- **boundary**：files: `test/provider-failure.test.mjs`; symbols/regions: 仅新增测试用例
- **输出**：RED 证据：目标断言失败（exit 1）
- **Knowledge**：agy 超时现被归为 PROVIDER_PRINT_TIMEOUT/OUTPUT_INVALID；D-013 统一 PROCESS_TIMEOUT + cause_code
- **verification_role**：RED
- **paired_task**：T040
- **gate_cmd**：`node --test test/provider-failure.test.mjs`
- **expected_exit**：1
- **oracle**：`OUTWARD_PROCESS_TIMEOUT_ONLY` — 仍产 PROVIDER_PRINT_TIMEOUT（断言失败）
- **evidence_path**：`quality/evidence/build-code/outward_process_timeout_only/`
- **STOP**：命令损坏时停止
- **recovery**：卡执行者修复后重跑
- **task risk**：误改真实原因保留
- **test tier / test method**：simple — BR 既有测试文件内最小断言（node --test）
- **scenarios / commands / expected exit / oracle**：RED=exit 1；GREEN=exit 0
- **fixtures_services**：BR worktree `/Users/Hugh/Hugh/Project/3rd-review`
- **coverage limits**：仅对外错误码
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：BR `test/provider-failure.test.mjs` 新增打印超时对外码与 `cause_code` 断言；未改生产实现。
- **executed_commands**：`node --test test/provider-failure.test.mjs`，exit 1；2/3 pass，目标断言真实失败。
- **evidence_refs**：BR direct test output，oracle=`OUTWARD_PROCESS_TIMEOUT_ONLY`。
- **covered_ac**：`AC-CANDIDATE-002`
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-09-19
- **执行事实**：旧实现返回 `PROVIDER_PRINT_TIMEOUT`，RED 证明统一外部码尚未落地。

#### T040 — GREEN：对外只产 PROCESS_TIMEOUT

- **ID**：T040
- **Phase**：Phase P5 — 候选收口与最终聚合
- **goal**：改 antigravity.mjs:7-8 + provider-failure.mjs:67 使打印超时对外只产 PROCESS_TIMEOUT + cause_code
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / D-013 → FR-CANDIDATE-002 → AC-CANDIDATE-002
- **输入**：T039 的失败断言
- **依赖**：T039
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CANDIDATE-002
- **AC**：AC-CANDIDATE-002
- **动作**：打印超时映射改 PROCESS_TIMEOUT，真实原因存 cause_code；不产 PROVIDER_PRINT_TIMEOUT
- **精确文件**：`lib/adapters/antigravity.mjs`（BR）
- **boundary**：files: 上述 BR 文件; symbols/regions: 超时映射 :7-8、:67
- **输出**：GREEN 可观察：T039 断言通过
- **Knowledge**：D-013；provider-failure.mjs:67 映射保持 PROCESS_TIMEOUT
- **verification_role**：GREEN
- **paired_task**：T039
- **gate_cmd**：`node --test test/provider-failure.test.mjs`
- **expected_exit**：0
- **oracle**：`OUTWARD_PROCESS_TIMEOUT_ONLY` — 同 oracle，成功信号：只产 PROCESS_TIMEOUT
- **evidence_path**：`quality/evidence/build-code/outward_process_timeout_only/`
- **STOP**：命令损坏时停止
- **recovery**：卡执行者恢复
- **task risk**：丢失真实原因
- **test tier / test method**：simple — 同 T039
- **scenarios / commands / expected exit / oracle**：同命令 exit 0
- **fixtures_services**：BR worktree
- **coverage limits**：仅本行为
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：BR `antigravity.mjs` 对外返回 `PROCESS_TIMEOUT` + `cause_code=PROVIDER_PRINT_TIMEOUT`；`provider-failure.mjs` 同步保留原因字段；managed lifecycle 断言更新为新公共合同。
- **executed_commands**：`node --test test/provider-failure.test.mjs`，3/3 pass，exit 0；`node --test test/managed-session-lifecycle.test.mjs`，19/19 pass，exit 0。
- **evidence_refs**：BR direct test outputs，oracle=`OUTWARD_PROCESS_TIMEOUT_ONLY`。
- **covered_ac**：`AC-CANDIDATE-002`
- **review_fact**：P5 phase review `unavailable`，attempt `35741e8e-b9bc-5d41-a35a-5e23355d5434`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：不再把 `PROVIDER_PRINT_TIMEOUT` 作为外部主码，真实原因未丢失。

#### T041 — N/A：4.7 八项逐项落地核验

- **ID**：T041
- **Phase**：Phase P5 — 候选收口与最终聚合
- **goal**：对 3rd-review live diff 8 文件逐项核验落地条目，不照过期状态表重做
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-004 / D-008 → FR-CANDIDATE-005 → AC-CANDIDATE-005
- **输入**：3rd-review live diff 8 文件
- **依赖**：T040
- **并行**：否
- **FR**：FR-CANDIDATE-005
- **AC**：AC-CANDIDATE-005
- **动作**：逐项核验 8 文件落地（per-item 映射 build-code 读全量 diff 回填），不重做已完成修法
- **精确文件**：`test/managed-session-lifecycle.test.mjs`、`test/attachments-protocol.test.mjs`、`test/workflowhub-result-v3.test.mjs`、`lib/provider-failure.mjs`（BR live diff 8 文件，逐项映射 build-code 回填）
- **boundary**：files: BR 8 文件; symbols/regions: 逐项核验
- **输出**：核验事实
- **Knowledge**：8 文件=5 lib（antigravity/broker/provider-failure/recovery-policy/workflowhub-result-v3）+3 test；逐项映射 PENDING
- **verification_role**：N/A — non-behavior landing verification
- **paired_task**：N/A — non-behavior landing verification
- **gate_cmd**：`node --test test/attachments-protocol.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs`
- **expected_exit**：0
- **oracle**：`CANDIDATE_LANDING_ITEMS` — 八项各有落地条目
- **evidence_path**：`quality/evidence/build-code/candidate_landing_items/`
- **STOP**：需重做已完成修法时停止
- **recovery**：卡执行者恢复
- **task risk**：全量重做已完成的
- **test tier / test method**：feature — 逐项核验（node --test）
- **scenarios / commands / expected exit / oracle**：exit 0 / CANDIDATE_LANDING_ITEMS
- **fixtures_services**：BR worktree
- **coverage limits**：仅 4.7 八项核验
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：N/A — non-behavior landing verification；未重做 BR 已完成修法。
- **executed_commands**：`node --test test/attachments-protocol.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs`，79/79 pass，exit 0。
- **evidence_refs**：BR direct candidate landing suite，oracle=`CANDIDATE_LANDING_ITEMS`；当前 live diff 实际为 5 lib + 8 test 文件，逐项映射以 `git diff --name-only` 与目标套件核验。
- **covered_ac**：`AC-CANDIDATE-005`
- **review_fact**：P5 phase review `unavailable`，attempt `35741e8e-b9bc-5d41-a35a-5e23355d5434`；provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：当前 13 个 dirty 文件（5 lib + 8 test）的协议相关行为由目标套件 79/79 覆盖；材料最初列的 8 文件已被后续针对性测试扩展，未把工作树 dirty 当作提交、合并或发布。

#### T042 — FINAL：aggregate verification

- **ID**：T042
- **Phase**：Phase P5 — 候选收口与最终聚合
- **goal**：按 plan 最终路线验证全部 26 AC、跨任务 seam 与当前完整测试事实
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-deferred-closeout-20260919/spec.md","hash":"f162961b94502c91208b71d4cd726541b36a3e367cf3261cacb36931ed228704","id":"workflowhub-deferred-closeout-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-deferred-closeout-20260919/plan.md","hash":"0c56ce8199f737bfe00d59052edc7a4a9784db4bea236fdf027a3cb5e59db724","id":"workflowhub-deferred-closeout-20260919"}]`
- **source_refs / decision_refs**：R-001～R-011 / D-001～D-024 → 全部 26 FR → 全部 26 AC
- **输入**：已完成 P1-P5 任务与最终路线
- **依赖**：T041
- **并行**：否 — aggregate reads all preceding task facts
- **FR**：全部 26 FR
- **AC**：全部 26 AC
- **动作**：只执行一次最终聚合检查并记录真实退出码、oracle、覆盖范围与剩余风险；不创建新状态权威
- **精确文件**：`runtime/review/review-record-route.mjs` 等全部 MODIFY 文件
- **boundary**：files: 全部 MODIFY; symbols/regions: 仅最终验证
- **输出**：最终测试与交接事实
- **Knowledge**：所有前序任务的真实结果
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — non-behavior landing verification
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/review/review-record-route.test.mjs tests/contract/review-input-bounds-portability.test.mjs tests/contract/review-layering.test.mjs tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL` — 全部 26 AC 逐项真实满足、跨任务 seam、最终测试事实
- **evidence_path**：`quality/evidence/build-code/final/`
- **STOP**：命令损坏、AC 缺失、越界或需新决策时停止
- **recovery**：卡执行者恢复
- **task risk**：聚合覆盖遗漏；把质量事实误写成通过
- **test tier / test method**：feature — 聚合
- **scenarios / commands / expected exit / oracle**：成功=exit 0 + 26 AC 满足；失败保留原始输出
- **fixtures_services**：WH worktree（前置 `npm ci`）+ BR worktree
- **coverage limits**：聚合既有针对性测试；不做前后计数、不新增验收机制
- **acceptance_role**：acceptance
- **acceptance_data**：`[{"source":"current task tests","sample":"targeted suites","scenario":"all AC satisfied","tier":"command","execution":{"command":"npx","args":["vitest","run","tests/contract/review-material-change-redispatch.test.mjs"],"timeout_ms":120000}}]`
- **e2e_scope**：`not_required`
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：N/A — aggregate verification only; skill closure metadata was repaired after the first aggregate attempt.
- **executed_commands**：first declared T042 aggregate exited 1 with 343/345; after updating `skill-bundle.json`/catalog closure hashes and passing the narrow repair gate 2/2, the repair aggregate completed 9 files / 345/345 tests, exit 0.
- **evidence_refs**：T042 first failure + repair output; final aggregate output, oracle=`ORACLE-FINAL`.
- **covered_ac**：all current implementation AC covered by the aggregate command; review/provider quality remains separately `unavailable`.
- **review_fact**：P5 phase review canonical identity reused attempt `35741e8e-b9bc-5d41-a35a-5e23355d5434`; `unavailable`，provider `kimi/coding` health invalid，未产生 provider attempts/findings。
- **completed_at**：2026-09-19
- **执行事实**：首次失败是 skill closure provenance 漂移，不是行为失败；修复后同一聚合范围 345/345 通过，未把第一次失败改写为通过。

### Verify

- **Target**：FR-CANDIDATE-001/002/005/007/008；AC 对应
- **gate_cmd**：见各卡（BR `node --test` + WH `npx vitest run`，前置 `npm ci`）
- **expected_exit**：RED=1 / GREEN=0 / FINAL=0
- **evidence_path**：各 oracle 目录
- **Oracle**：DIGEST_TWO_AXIS_SPLIT、SAME_FINGERPRINT_CIRCUIT_BREAK、HEALTH_PRECHECK_CONSUMED、OUTWARD_PROCESS_TIMEOUT_ONLY、CANDIDATE_LANDING_ITEMS

### Knowledge

4.2 拆分函数与 4.3 接入点 PENDING（build-code 定位，PLAN-RISK-002）；4.7 逐项映射 PENDING；D-013 统一 PROCESS_TIMEOUT。

### STOP

需新增方向/wire 字段/第二套摘要/遥测面时 → STOP 回 make-decision。

### Done

候选收口 + 聚合测试通过；PENDING 实现细节如实回填完成区。

### Risks and rollback

- **Risk**：PLAN-RISK-002 — PENDING 接入点定位失败
- **Prevention**：定位失败 STOP 回材料 owner，不伪造行号
- **Rollback / recovery**：回滚对应文件改动，保留证据

## Dependency Graph

- **order**：T001→T002 → T003→T004 → T005→T006 → T007→T008 → T009→T010 → T011→T012 → T013→T014 → T015→T016 → T017→T018 → T019→T020 → T021→T022 → T023→T024 → T025→T026 → T027→T028 → T029→T030 → T031→T032 → T033→T034 → T035→T036 → T037→T038 → T039→T040 → T041 → T042

```text
T001→T002 → T003→T004 → T005→T006 → T007→T008 → T009→T010 → T011→T012 → T013→T014
  → T015→T016 → T017→T018 → T019→T020 → T021→T022 → T023→T024 → T025→T026
  → T027→T028 → T029→T030 → T031→T032 → T033→T034 → T035→T036 → T037→T038
  → T039→T040 → T041 → T042(FINAL)
```

完成区的 `executed_commands`、`evidence_refs`、`review_fact` 和 `执行事实` 只填真实调用及消费者结果。

## Final Boundary Check

- [x] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [x] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [x] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL（T042）只做一次聚合。
- [x] 依赖无环，FR/AC 双向追溯闭合，未知事实（4.2/4.3/4.7/B4-health）没有被写成假设或通过。
- [x] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。
