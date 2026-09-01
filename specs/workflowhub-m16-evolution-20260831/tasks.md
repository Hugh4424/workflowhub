# 任务清单：M16 自进化候选池、迭代入口与负例库

- **Input**：`decision-log.md@51d1ae108d28189df006d235bf2ae65e981812e283259dd06db29bc7a314bf7c`、`spec.md@b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb`、`plan.md@afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269`
- **Template version**：`plan-task.v3`

## Phase P1 — Evolution data-plane 与私有入口

### Goal

完整 proof、candidate/tax、ledger/ablation 和七区块 brief 在单机项目存储根上可确定性、并发安全、失败不覆旧地产出。

### Files

- **NEW**：`runtime/evidence/workflow-evolution.mjs`、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/generate-iteration-brief.mjs`、`tools/cli/record-evolution-result.mjs`、`tools/cli/check-skill-updates.mjs`、`tests/contract/workflow-evolution-candidates.test.mjs`、`tests/contract/workflow-evolution-ledgers.test.mjs`、`tests/contract/generate-iteration-brief.test.mjs`、`tests/contract/check-skill-updates.test.mjs`、`tests/fixtures/workflow-evolution/extreme.json`、`tests/fixtures/workflow-evolution/red-baseline.v1.json`、`tests/fixtures/workflow-evolution/check-red-authenticity.mjs`、`tests/fixtures/workflow-evolution/run-red-green-gate.sh`
- **MODIFY**：`tools/cli/derive-consumption-edges.mjs`、`skills/stage-reflection/SKILL.md`、`skills/stage-reflection/skill-bundle.json`、`skills/catalog.yaml`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-reflection-skill-contract.test.mjs`
- **DO NOT TOUCH**：TaskKernel、runtime facade、D24 库

### Tasks

#### T001 — RED：候选、质量税与 proof 合同

- **ID**：T001
- **Phase**：Phase P1 — Evolution data-plane 与私有入口
- **goal**：用失败测试固定 snapshot identity、proof coverage、两档候选和质量税的保守状态机。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-m16-evolution-20260831/spec.md","hash":"b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb","id":"M16-SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-m16-evolution-20260831/plan.md","hash":"afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269","id":"M16-PLAN"}]`
- **source_refs / decision_refs**：R-001,R-002,R-008,R-011,R-012,R-014,D-003,D-006,D-007,D-010 → FR-POOL-001..008,FR-TAX-001..007 / AC-POOL-001..005,AC-TAX-001..003
- **输入**：accepted spec/plan；canonical stage manifest、catalog、move-map 与现有 edge producer。
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-POOL-001、FR-POOL-002、FR-POOL-003、FR-POOL-004、FR-POOL-005、FR-POOL-006、FR-POOL-007、FR-POOL-008、FR-TAX-001、FR-TAX-002、FR-TAX-003、FR-TAX-004、FR-TAX-005、FR-TAX-006、FR-TAX-007
- **AC**：AC-POOL-001、AC-POOL-002、AC-POOL-003、AC-POOL-005、AC-TAX-001、AC-TAX-002、AC-TAX-003
- **动作**：固定 T002 九个 frozen exports及 plan exact consumer allowlist，call-graph positive 逐项证明每个 export 至少一个允许 import/call backref，negative 覆盖缺失 backref、allowlist 外生产 caller 与 private CLI/page/brief adapter 直接 import internal helper；新增 `acquireProjectLock` 的input/output/error/fencing/manualRecovery合同。`readCurrentCandidateSnapshot` 固定为仅供 refresh/transition/projection 三个 deep routines 调用的 module-private helper，不 export，外部 consumer 不得 import。candidate CLI顺序必须 acquire→把 lockHandle/ownerToken/fencingToken传入record并由deep API重验，CLI非semantic consumer。固定 snapshot_content_id=stable inventory hash与snapshot_id=content+attempt+publication generation分层；generation 只能在锁内由 latest complete committed snapshot+1 分配（初始1），写入 batch/snapshot/refresh_result/proof canonical bytes，commit前重验head generation+snapshot_id+fencing，竞争 loser 零写。extreme fixture 增加 initial、连续、同content双发布、并发同head、torn tail、pre-commit crash/new-attempt retry、post-commit response-loss/duplicate-attempt fixed vectors；相同inventory/asOf、新asOf、旧proof/refreshResult拒绝。其余identity/tax/read合同不变。RED中unknown/ambiguous target必须是allowlisted `invalid_target|stale_source`业务断言且零发布；exit24仅unknown test/report ID、syntax/load、fixture/timeout。
- **精确文件**：`tests/contract/workflow-evolution-candidates.test.mjs`、`tests/fixtures/workflow-evolution/extreme.json`、`tests/fixtures/workflow-evolution/red-baseline.v1.json`、`tests/fixtures/workflow-evolution/check-red-authenticity.mjs`、`tests/fixtures/workflow-evolution/run-red-green-gate.sh`
- **candidate-transition contract**：RED 只覆盖 deep API 的 current_snapshot_id+candidate_record_id+candidate_id+expected_revision+current source/material identities+human confirmation；refresh 继承 lifecycle/revision，transition 才递增，refresh 后旧 authority stale；record CLI adapter 属于 T003/T004。
- **boundary**：files: T001 exact five new test/fixture/checker files; symbols/regions: dynamic-import seam、candidate/proof/tax cases plus the sole baseline/RED/GREEN evidence producer and wrapper
- **输出**：实现缺失导致的稳定 RED；环境或测试语法错误不算 RED。
- **Knowledge**：snapshot_content_id稳定绑定inventory；publication_generation由锁内 latest complete committed head+1（初始1）唯一分配；snapshot_id另含attempt/generation且每次发布唯一；batch/snapshot/proof/refreshResult绑定同一 generation。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh pool-tax`
- **expected_exit**：1
- **expected_exit_notes**：valid RED=1；valid GREEN=0；invalid authenticity=23；Vitest/infrastructure=24；evidence write/hash=25。T001 当前任务只接受 valid RED=1。
- **oracle**：`ORACLE-POOL-TAX` — 仅因缺少候选/proof/tax 目标行为失败，既有 edge 用例仍通过；`ORACLE-POOL-TAX-CALL-GRAPH` — 九 export 逐项存在 allowlisted real consumer/backref，allowlist 外 caller、缺失 backref或外部 import internal helper 必须失败。
- **evidence_path**：`quality/tests/m16-p1-pool-tax/gate.json`
- **STOP**：命令损坏、fixture 身份不确定、需要第八 public behavior、或测试只能靠弱化 unknown 语义通过。
- **recovery**：build-code owner 修正测试/fixture；需要方向变化时退回 spec/plan。
- **task risk**：把旧 scan boolean 误当完整 proof，产生伪 RED。
- **test tier / test method**：fullstack — schema、producer、项目级持久化与状态投影跨域。
- **scenarios / commands / expected exit / oracle**：九 exports consumer map 逐项 positive，缺失 backref/allowlist 外 caller negative；internal candidate reader 不 export且只有三个内部 caller，外部 adapter/import negative；acquire成功handle/fencing与全错误矩阵；CLI acquire→record顺序/handle重验；generation fixed vectors：initial=1、连续=2..N、同content双发布不同snapshot、并发同head仅一方commit另一方零写、torn tail不占号、pre-commit crash后新attempt复用next generation、完整commit/响应丢失后同attempt拒绝且新attempt取下一号；batch/snapshot/refresh_result/proof bytes同generation；同inventory content id稳定但publication id唯一，同asOf计算等价、asOf变化、旧proof/refreshResult stale；tax/read/transition/torn；unknown/ambiguous target业务断言，exit24严格只限unknown report/test ID、syntax/load、fixture/timeout；同gate /1/ORACLE-POOL-TAX + ORACLE-POOL-TAX-CALL-GRAPH。
- **fixtures_services**：极端 fixture；无外部服务；测试负责临时目录清理。
- **identity/restart scenarios**：stage/step/skill/surface exact authority；step manifest unique/absent/ambiguous；observation/group fixed vectors与 distinct-task frequency；transition exact current authority/refresh stale；project_lock完整字段、boot/session recovery 正负例。
- **coverage limits**：证明 candidate 单机锁/CAS/原子发布；不证明 brief、浏览器、跨主机锁或业务收益。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：Phase Card 与候选/proof/tax RED 测试；未修改生产代码。
- **executed_commands**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh pool-tax`（RED=1；GREEN 后同 gate=0）
- **evidence_refs**：`quality/tests/m16-p1-pool-tax/gate.json`、`tests/contract/workflow-evolution-candidates.test.mjs`
- **covered_ac**：AC-POOL-001、AC-POOL-002、AC-POOL-003、AC-POOL-005、AC-TAX-001、AC-TAX-002、AC-TAX-003（测试事实）
- **review_fact**：与 T002 共享 Phase review；wh-review provider unavailable，已保留事实
- **completed_at**：2026-09-01
- **执行事实**：RED=1 由目标模块缺失触发；实现后同 gate GREEN=0，focused 断言通过。

#### T002 — GREEN：候选、质量税与完整 proof 实现

- **ID**：T002
- **Phase**：Phase P1 — Evolution data-plane 与私有入口
- **goal**：实现单一深模块、组合 schema 与完整 proof，使 T001 通过且保留保守负例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-m16-evolution-20260831/spec.md","hash":"b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb","id":"M16-SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-m16-evolution-20260831/plan.md","hash":"afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269","id":"M16-PLAN"}]`
- **source_refs / decision_refs**：R-001,R-002,R-008,R-011,R-012,R-014,D-003,D-006,D-007,D-010 → FR-POOL-001..008,FR-TAX-001..007 / AC-POOL-001..005,AC-TAX-001..003
- **输入**：T001 RED 与已核实 producer/authority anchors。
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-POOL-001、FR-POOL-002、FR-POOL-003、FR-POOL-004、FR-POOL-005、FR-POOL-006、FR-POOL-007、FR-POOL-008、FR-TAX-001、FR-TAX-002、FR-TAX-003、FR-TAX-004、FR-TAX-005、FR-TAX-006、FR-TAX-007
- **AC**：AC-POOL-001、AC-POOL-002、AC-POOL-003、AC-POOL-005、AC-TAX-001、AC-TAX-002、AC-TAX-003
- **动作**：作为 combined schema 唯一 writer/owner实现 plan 九个 frozen exports与 exact consumer allowlist/backrefs，任何 export 缺失真实 caller 或出现 allowlist 外生产 caller 均失败；新增 `acquireProjectLock` input/output/error/fencing/manualRecovery。`readCurrentCandidateSnapshot` 只实现为不导出的 module-private helper，唯一 callers=`refreshEvolutionSnapshot|recordCandidateTransition|readCurrentEvolutionProjection`，T004/T005/T006只能消费 frozen projection API；call-graph negative 必须证明外部 import 不可用。实现 snapshot_content_id/snapshot_id 分层：锁内重读 latest complete committed head 分配 generation+1（初始1），写入 batch/snapshot/refresh_result/proof canonical bytes，commit前再重验 head snapshot_id/generation 与 fencing，竞争/旧head零写；torn tail不占 generation，pre/post-commit crash/retry按 spec 处理。proof/refreshResult双绑定并拒绝旧generation。`refreshEvolutionSnapshot`无manualRecovery；projection reader合同不变。实现identity/tax/publish/read guard与 frozen D24；更新既有producer/skill contracts。
- **精确文件**：`runtime/evidence/workflow-evolution.mjs`、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/derive-consumption-edges.mjs`、`skills/stage-reflection/SKILL.md`、`skills/stage-reflection/skill-bundle.json`、`skills/catalog.yaml`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-reflection-skill-contract.test.mjs`
- **candidate-transition implementation**：deep module实现 `acquireProjectLock` 与 `recordCandidateTransition`；record必须重验传入lockHandle/ownerToken/fencingToken。T003/T004才固定/实现CLI acquire→record顺序。
- **boundary**：files: exact eight production/governance/regression files; symbols/regions: workflow evolution inventory/attempt/candidate/tax producer+read/read-guard/lock exports, consumption proof producer, attribution contract and its hashes; page adapter integration belongs only to T006; focused tests return to T001
- **输出**：完整 proof 才能生成 action/参考两档；异常/残缺保持 unknown/reference_only，旧合法字节不变。
- **Knowledge**：canonical stage identity 来自 manifest，skill identity 来自 catalog，surface authority 来自 move-map。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh pool-tax`
- **expected_exit**：0
- **GREEN regression set**：同一次 gate 在 focused GREEN 后立即执行 `npx vitest run tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-reflection-skill-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；任一非零则 gate 非零且不得产 GREEN evidence；两文件继续排除在 immutable RED baseline 之外。
- **oracle**：`ORACLE-POOL-TAX` — 完整/残缺/漂移场景全部符合保守状态机，既有 edge 行为不回归。
- **sub_oracles**：`ORACLE-POOL-TAX-COMPUTE` — candidate/tax computation 与 raw inventory→proof attribution；`ORACLE-POOL-TAX-PUBLISH` — framed publication、lock/fencing/stale reclaim、candidate read guard 与 producer contract；`ORACLE-POOL-TAX-CALL-GRAPH` — 九 export allowlisted consumer/backref 全覆盖且 internal helper 无外部 import。
- **evidence_path**：`quality/tests/m16-p1-pool-tax/gate.json`
- **STOP**：需要修改 runtime facade/TaskKernel、覆盖旧前缀、或用 fallback 掩盖 schema/identity 错误。
- **recovery**：回滚本任务 producer/module/schema 修改，保留 T001 RED 与失败输出。
- **task risk**：状态跨维提升、hash 循环、skill bundle 漂移。
- **test tier / test method**：fullstack — 与 T001 相同。
- **scenarios / commands / expected exit / oracle**：与 T001 同九 export allowlisted consumer/backref positive/negative 与 internal helper external-import rejection；repeat-intervention、完整 lifecycle authority matrix；仅 current open/deferred + current candidate/revision human confirmation 可 supersede，旧 revision lifecycle=superseded/row=historical/immutable，新 revision+1 且 initial=open；verified/rejected supersede、no-authority/cross-candidate/stale-revision 均拒绝；generation initial/连续/同content双发布/并发同head/torn tail/pre-commit crash retry/post-commit response-loss fixed vectors，逐字节断言 batch begin+commit/snapshot/refresh_result/proof 同值且 commit前head漂移零写；固定 `asOf` 的 30 天起止内外与重复运行 byte-equivalent，windowStart/windowEnd/generatedAt 精确绑定；tax 4/5/9/10 与 0/10/20/30% unknown、upstream_omission matrix、raw inventory/output-only drift、lock/fencing、candidate torn begin/row/commit→byte-range authenticated abort→new batch、非法 abort/committed corruption/read guard 场景；focused GREEN 后立即运行 derive-consumption-edges 与 stage-reflection-skill-contract 两套 regression，任一失败不得 GREEN；只读 stage-reflection E2E 仍作 immutable baseline/P1 final net；同命令 / 0 / ORACLE-POOL-TAX + ORACLE-POOL-TAX-CALL-GRAPH，并加 bundle/catalog hash 闭合。
- **fixtures_services**：同 T001；无外部服务；锁和临时目录由测试清理。
- **identity/restart scenarios**：与 T001 同四类 target、observation/group、distinct-task frequency、exact transition authority/refresh inheritance/stale authorization；project_lock restart 正负例；T002 同 gate GREEN，并冻结 combined schema 全部 defs 与 D24 subtree bytes/hash/identity，供 T003/T004 只读消费。
- **coverage limits**：不覆盖 ledger/brief 和页面真实浏览器。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 workflow-evolution 深模块、组合 schema，并补齐 consumption proof/stage-reflection/catalog 合同。
- **executed_commands**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh pool-tax`（GREEN=0）；derive/stage-reflection regression 通过
- **evidence_refs**：`quality/tests/m16-p1-pool-tax/gate.json`、`quality/tests/m16-p1-regression/`
- **covered_ac**：AC-POOL-001、AC-POOL-002、AC-POOL-003、AC-POOL-005、AC-TAX-001、AC-TAX-002、AC-TAX-003（focused tests）
- **review_fact**：wh-review provider unavailable；未伪造通过
- **completed_at**：2026-09-01
- **执行事实**：九个导出与当前消费者、proof/tax 状态断言在 focused GREEN 通过；全量 npm test 另有既有失败。

#### T003 — RED：台账、消融合同与七区块简报

- **ID**：T003
- **Phase**：Phase P1 — Evolution data-plane 与私有入口
- **goal**：用失败测试固定 framed append-only ledger、effective head、target-ref、七区块 brief、skill update receipt producer 与 CAS。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-m16-evolution-20260831/spec.md","hash":"b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb","id":"M16-SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-m16-evolution-20260831/plan.md","hash":"afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269","id":"M16-PLAN"}]`
- **source_refs / decision_refs**：R-003,R-004,R-005,R-006,R-007,R-009,D-001,D-004,D-005,D-008,D-009 → FR-EDIT-001..003,FR-NEG-001..003,FR-ABL-001..003,FR-BRIEF-001..009 / corresponding AC
- **输入**：T002 schema、identity、lock API、current candidate snapshot，以及 T002-owned `runtime/schemas/workflow-evolution.v1.json#/$defs/d24_eval_boundary` ref/canonical subschema sha256/schema identity。
- **依赖**：T002
- **并行**：否 — shared schema/lock ownership
- **FR**：FR-EDIT-001、FR-EDIT-002、FR-EDIT-003、FR-NEG-001、FR-NEG-002、FR-NEG-003、FR-ABL-001、FR-ABL-002、FR-ABL-003、FR-BRIEF-001、FR-BRIEF-002、FR-BRIEF-003、FR-BRIEF-004、FR-BRIEF-005、FR-BRIEF-006、FR-BRIEF-007、FR-BRIEF-008、FR-BRIEF-009
- **AC**：AC-EDIT-001、AC-EDIT-002、AC-NEG-001、AC-NEG-002、AC-ABL-001、AC-ABL-002、AC-BRIEF-001、AC-BRIEF-002、AC-BRIEF-003
- **动作**：新增 ledger/brief/skill-check CLI focused contract tests；test-owned dynamic-import/CLI seam 将目标模块或 T004 新增 CLI 尚不存在、missing export/behavior 转为 allowlisted `M16-T003-*` assertion failure，syntax/依赖 module-load/fixture/timeout/未知 test/report ID 仍 exit24。RED 分开固定 `record-evolution-result` 三种互斥输入：candidate-transition CLI 必须先调用 `acquireProjectLock`，再把 frozen lockHandle/ownerToken/fencingToken 传入 deep `recordCandidateTransition` 重验，CLI 非 semantic consumer；attempted-edit 只校验终态 edit + current approved decision ref/hash/approval，明确拒绝/忽略 D24 字段；negative-result 才额外校验 T002 frozen D24 anchor/canonical bytes/sha256/schema identity，并由 deep writer 在同一锁内读取 current attempted-edits effective head 与 negative log/index，校验 failure_identity 唯一和 supersedes 同 identity current head/无环。分类顺序机器断言 `classification_unavailable`→D24/mixed `wrong_domain`→独立 M16 mechanism failure；unknown/ambiguous target 是 allowlisted `invalid_target|stale_source` 业务断言且零发布。brief 必须覆盖 stage/step/skill/surface 正例，step 仅接受 current versioned manifest 唯一映射，unknown/ambiguous/stale authority fail-loud；并固定不可复用 attempt_id/owner temp、temp fsync、内容+source重验、lock fencing、atomic rename、parent dir fsync；仅 pre-rename crash/cancel保证旧 current，post-rename dir-fsync失败为 `durability_unknown` 并按 fenced current-hash 重读恢复；只清同 owner orphan。checker 唯一写/hash-bind canonical `gate.json`；不改生产实现。
- **第六轮精化**：candidate-transition CLI必须acquire→record并传lockHandle/owner/fencing；negative writer锁内读current log/index验证failure_identity唯一及supersedes同identity current-head无环；brief pre-rename失败零写，post-rename directory fsync失败=`durability_unknown`，用fenced reread current hash决定幂等完成或新attempt重试。unknown/ambiguous target=`invalid_target|stale_source`业务allowlisted断言+零发布；exit24仅unknown test/report ID、syntax/load、fixture/timeout。
- **精确文件**：`tests/contract/workflow-evolution-ledgers.test.mjs`、`tests/contract/generate-iteration-brief.test.mjs`、`tests/contract/check-skill-updates.test.mjs`
- **boundary**：files: exact three tests; symbols/regions: terminal records, ablation protocol, target selection, skill receipt producer, lock/CAS/read-guard failures
- **输出**：仅因目标 API/CLI 缺失而 RED。
- **Knowledge**：只接受终态记录；exactly one canonical target；brief 是单一 current projection，不是事实源。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh ledger-brief`
- **expected_exit**：1
- **expected_exit_notes**：valid RED=1；valid GREEN=0；invalid authenticity=23；Vitest/infrastructure=24；evidence write/hash=25。T003 当前任务只接受 valid RED=1。
- **oracle**：`ORACLE-LEDGER-BRIEF` — 缺少原子 ledger/brief 行为导致目标断言失败，残缺/并发/错误 target 必须 fail-loud。
- **evidence_path**：`quality/tests/m16-p1-ledger-brief/gate.json`
- **STOP**：需要 daemon/database、非终态事实、自动执行实验或覆盖旧文件。
- **recovery**：修正测试 seam；方向变化退回 plan。
- **task risk**：把普通 append 或 last-line 误当 atomic/effective head。
- **test tier / test method**：fullstack — CLI、schema、锁、文件发布和 current projection 跨域。
- **scenarios / commands / expected exit / oracle**：ledger framed append/torn/corruption/effective-head；candidate-transition CLI adapter；attempted-edit decision-only 正负例及注入 D24 字段拒绝；negative-result D24 exact anchor/canonical bytes/hash/schema fixed vector、classification precedence 与 mixed/独立 failure；brief stage/step/skill/surface 正例及 step unknown/ambiguous/stale authority 零写；crash 点覆盖 temp write/fsync、validation、pre-rename fencing、rename、directory fsync，orphan same-owner cleanup 与 foreign-owner preserve；module/CLI absent 或 missing export/behavior 只作为 allowlisted assertion，syntax/dependency-load/fixture/timeout exit24；同命令 / 1 / ORACLE-LEDGER-BRIEF。
- **fixtures_services**：T001 extreme fixture + 每例独立临时 storage root；D24 fixture 绑定 T002 schema anchor/canonical subschema hash/identity；skill fixture 分别绑定 installed catalog+bundle/ref identity/version/content hash 与 upstream receipt；无服务；测试清理。
- **coverage limits**：不运行真实消融、市场调研或跨主机锁。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：台账/简报/skill-check RED 合同测试。
- **executed_commands**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh ledger-brief`（RED=1；GREEN 后同 gate=0）
- **evidence_refs**：`quality/tests/m16-p1-ledger-brief/gate.json`、相关三份 contract tests
- **covered_ac**：AC-EDIT-001、AC-EDIT-002、AC-NEG-001、AC-NEG-002、AC-ABL-001、AC-ABL-002、AC-BRIEF-001、AC-BRIEF-002、AC-BRIEF-003（测试事实）
- **review_fact**：与 T004 共享 Phase review；wh-review provider unavailable
- **completed_at**：2026-09-01
- **执行事实**：RED=1 由目标 CLI/行为缺失触发；实现后同 gate GREEN=0。

#### T004 — GREEN：原子台账与按需简报入口

- **ID**：T004
- **Phase**：Phase P1 — Evolution data-plane 与私有入口
- **goal**：实现三个私有 CLI 与深模块发布/read-guard API，使 T003 通过且不新增 public behavior。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-m16-evolution-20260831/spec.md","hash":"b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb","id":"M16-SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-m16-evolution-20260831/plan.md","hash":"afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269","id":"M16-PLAN"}]`
- **source_refs / decision_refs**：与 T003 相同。
- **输入**：T003 RED、T002 深模块/schema 与 T002-owned D24 anchor/canonical subschema hash/schema identity。
- **依赖**：T003
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-EDIT-001、FR-EDIT-002、FR-EDIT-003、FR-NEG-001、FR-NEG-002、FR-NEG-003、FR-ABL-001、FR-ABL-002、FR-ABL-003、FR-BRIEF-001、FR-BRIEF-002、FR-BRIEF-003、FR-BRIEF-004、FR-BRIEF-005、FR-BRIEF-006、FR-BRIEF-007、FR-BRIEF-008、FR-BRIEF-009
- **AC**：AC-EDIT-001、AC-EDIT-002、AC-NEG-001、AC-NEG-002、AC-ABL-001、AC-ABL-002、AC-BRIEF-001、AC-BRIEF-002、AC-BRIEF-003
- **动作**：实现 framed ledger/brief，并由 T004 新增三个 thin CLI；candidate-transition CLI 固定先调用 T002 `acquireProjectLock`，再把 frozen lockHandle/ownerToken/fencingToken 传给 `recordCandidateTransition` 重验，CLI 只 parse/转交且不是 semantic consumer；record/brief CLI 对可选 `--manual-recovery=<json>` 只 parse 并把 `manualRecovery` 原样转交 `acquireProjectLock({manualRecovery})`，不做 semantic validation/reclaim，唯一 semantic consumer 仍是 acquire API；attempted-edit 不消费 D24；negative-result 消费 T002 frozen D24 exports，并由 deep writer 在同一锁内读取 current negative log/index完成 failure_identity/supersedes writer-side validation。T004 不得修改 combined schema 或新增任何 `$defs`，schema 从 T004 exact files/写入职责排除；运行 byte-identical fixed-vector regression，任何 D24 subtree 漂移零写。brief 实现 stage/step/skill/surface 四类目标，step resolver 对 unknown/ambiguous/stale manifest authority fail-loud/零发布；实现 pre-rename零写与 post-rename `durability_unknown` fenced reread恢复、manual recovery/skill receipt；同 checker GREEN failure set 为空并原子覆写同一 `gate.json`；不得修改 T003 测试/baseline/checker。
- **第六轮精化**：CLI先acquire并把frozen handle/owner/fencing传给record重验；negative deep writer在同锁内完成identity/supersedes验证并作为writer-side validation consumer；brief实现独立`durability_unknown`恢复路径与`ORACLE-BRIEF-DURABILITY-UNKNOWN`。
- **精确文件**：`runtime/evidence/workflow-evolution.mjs`、`tools/cli/generate-iteration-brief.mjs`、`tools/cli/record-evolution-result.mjs`、`tools/cli/check-skill-updates.mjs`
- **entrypoint/read-current**：record CLI candidate-transition固定先`acquireProjectLock`再`recordCandidateTransition`；brief CLI提供`--read-current`与durability recovery hash重读，不新增reader文件。
- **boundary**：files: exact four production files; symbols/regions: ledger/brief/read-guard/skill-check exports and private CLI argument adapters; tests return to T003
- **输出**：结构化 `ok|failed|conflict|stale_source|cancelled|wrong_domain|durability_unknown`；仅pre-rename失败保证旧字节不变，post-rename unknown必须重读判定。
- **Knowledge**：project lock 是短期协调，不是事实源；全量校验与 CAS 在锁内重读。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh ledger-brief`
- **expected_exit**：0
- **oracle**：`ORACLE-LEDGER-BRIEF` — 所有成功/失败/并发场景确定性通过；CLI 只 parse/原样转交 `manualRecovery`，missing/stale/replayed/cross-lock/cross-boot 仅由 `acquireProjectLock` 裁决且失败零写；public behavior 未扩张。
- **evidence_path**：`quality/tests/m16-p1-ledger-brief/gate.json`
- **STOP**：需弱化 T003、引入第二 owner、自动运行实验或吞掉损坏输入。
- **recovery**：回滚 record/brief/check-skill-updates 三个 CLI 与相关深模块 API；保留旧项目对象、content-addressed receipt 与测试失败事实，不安装 skill。
- **task risk**：锁泄漏、半批可见、brief 来源漂移。
- **test tier / test method**：fullstack — 与 T003 相同。
- **scenarios / commands / expected exit / oracle**：与 T003 同 ledger torn/corruption、brief temp/fsync/validate/fencing/rename/dir-fsync/crash/orphan、candidate-transition adapter；attempted-edit decision-only 且 D24 注入拒绝，negative-result decision+D24 frozen exact bytes/hash/schema；classification_unavailable→D24/mixed→M16 precedence；stage/step/skill/surface 正例与 step unknown/ambiguous/stale authority；manual recovery CLI 原样转交正例与 missing/stale/replayed/cross-lock/cross-boot acquire-only semantic rejection/零写、read guard/skill receipt；同 JSON test-ID inventory failure set 为空；同命令 / 0 / ORACLE-LEDGER-BRIEF。
- **fixtures_services**：同 T003；测试检查临时文件和锁已清理。
- **coverage limits**：单机 filesystem；不证明 NFS/跨主机语义或真实收益。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 record-evolution-result、generate-iteration-brief、check-skill-updates 三个私有 CLI，并实现原子 brief/台账写入路径。
- **executed_commands**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh ledger-brief`（GREEN=0）
- **evidence_refs**：`quality/tests/m16-p1-ledger-brief/gate.json`、`tools/cli/record-evolution-result.mjs`、`tools/cli/generate-iteration-brief.mjs`
- **covered_ac**：AC-EDIT-001、AC-EDIT-002、AC-NEG-001、AC-NEG-002、AC-ABL-001、AC-ABL-002、AC-BRIEF-001、AC-BRIEF-002、AC-BRIEF-003（focused tests）
- **review_fact**：wh-review provider unavailable；未伪造审查通过
- **completed_at**：2026-09-01
- **执行事实**：三 CLI 与七区块 brief 合同通过；完整并发/CAS 矩阵仍受实现范围与全量测试事实限制。

### Verify

- **Target**：POOL/TAX/EDIT/NEG/ABL/BRIEF 全部适用 FR/AC 与 proof→snapshot→ledger/brief seam。
- **gate_cmd**：`npx vitest run tests/contract/workflow-evolution-candidates.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-reflection-skill-contract.test.mjs tests/contract/stage-reflection-e2e-constructed.test.mjs tests/contract/workflow-evolution-ledgers.test.mjs tests/contract/generate-iteration-brief.test.mjs tests/contract/check-skill-updates.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **evidence_path**：`quality/tests/m16-p1-pool-tax/gate.json`、`quality/tests/m16-p1-ledger-brief/gate.json`
- **Oracle**：ORACLE-P1 — 两组 GREEN 同时成立，旧字节、unknown 和 public surface 不被提升。

### Knowledge

P2 只消费 current candidate snapshot、tax projection 和结构化 refresh_result；legacy overall_pending 不升格。

### STOP

- 完整 inventory 无法形成、旧文件前缀变化、需要 daemon/database 或第八 public behavior。

### Done

- T001/T003 真实 RED，T002/T004 同命令 GREEN；适用 AC 有证据，独立 Phase review findings 已处置。

### Risks and rollback

- **Risk**：并发半批、source drift、状态跨维提升。
- **Prevention**：锁内重读、全量 schema、prefix/CAS、负例断言。
- **Rollback / recovery**：删除同 attempt 临时文件/锁；回滚 P1 生产文件，保留旧 current 和质量事实。

## Phase P2 — 现有 monitor 只读趋势区

### Goal

不破坏 task/overall_pending 地展示候选和质量税并完成静态合同；真实 browser evidence 由 P3/T007 负责。

### Files

- **NEW**：none
- **MODIFY**：`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tests/contract/build-reflection-page.test.mjs`
- **DO NOT TOUCH**：现有 task view 字段、runtime data fetch/control plane、`tests/contract/stage-reflection-e2e-constructed.test.mjs`（只读回归依赖；若证明 stage-reflection producer 回归则失败回 T002，只有 page adapter/template 断言失败才回 T006；P2 不修改该测试）

### Tasks

#### T005 — RED：monitor projection 与静态 UI 合同

- **ID**：T005
- **Phase**：Phase P2 — 现有 monitor 只读趋势区
- **goal**：用失败测试固定同次 frozen ViewModel、三区块、稳定排序、展开和失败隔离。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-m16-evolution-20260831/spec.md","hash":"b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb","id":"M16-SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-m16-evolution-20260831/plan.md","hash":"afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269","id":"M16-PLAN"}]`
- **source_refs / decision_refs**：R-010,R-012,D-001,D-002,D-005,D-006 → FR-PAGE-001..005,FR-POOL-004..005,FR-TAX-004,FR-TAX-006 / AC-PAGE-001..003
- **输入**：T002 current snapshot/tax/inventory/attempt/refresh/read-guard API 与现有 page producer/template。
- **依赖**：T002
- **并行**：否 — page consumes P1 API
- **FR**：FR-PAGE-001、FR-PAGE-002、FR-PAGE-003、FR-PAGE-004、FR-PAGE-005、FR-POOL-004、FR-POOL-005、FR-TAX-004、FR-TAX-006
- **AC**：AC-PAGE-001、AC-PAGE-002、AC-PAGE-003
- **动作**：扩展 page contract tests；锁定现有 CLI 参数与 page inventory；把 `--now` 原样作为 `asOf` 传给 tax producer，再显式把 `{taxProjection,sourceInventoryHash,asOf,refreshResult}` 传给 `readCurrentEvolutionProjection`，机器断言四者同 attempt/source/time，任一错配 stale/零写，且 reader 无隐藏文件重读或系统时钟。覆盖 tax 状态、inventory/attempt/refresh identity、未验证文案、accessible name/expand/read guard；不改生产 CLI/template。
- **精确文件**：`tests/contract/build-reflection-page.test.mjs`
- **boundary**：files: exact test; symbols/regions: evolution ViewModel, labels, ordering, failure isolation, legacy regressions
- **输出**：仅因新 ViewModel/DOM 合同缺失而 RED，旧 page 断言仍通过。
- **Knowledge**：页面无 runtime fetch/retry；每区独立状态；Design/Experience 仍 unknown。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh monitor`
- **expected_exit**：1
- **oracle**：`ORACLE-MONITOR` — 新三区块/状态断言失败，既有 task/filter/safe-ref 通过。
- **evidence_path**：`quality/tests/m16-p2-monitor/gate.json`
- **STOP**：既有页面基线本身失败、需要网络状态 owner、或断言依赖未绑定设计稿。
- **recovery**：修正测试 seam；视觉方向变化退回 design/plan。
- **task risk**：DOM 字符串断言替代真实状态/安全验证。
- **test tier / test method**：fullstack — producer→data.js→template 静态消费链。
- **scenarios / commands / expected exit / oracle**：四个既有 CLI caller 参数不变；page `--now` 原样传入 tax `asOf`，断言 tax/current projection 的 windowStart/windowEnd/generatedAt 同一身份，缺失或漂移 fail-loud；page inventory 有真实 page/candidate sources 且明确排除 decision/spec；raw/output drift、attempt、refresh/read guard；tax 4 samples 不显示比例、5 samples 开始显示、显著未验证文案且无因果/推进许可；default/empty/error/insufficient_samples/unavailable/stale/unverified、混合态、expand/long refs/legacy；同命令 / 1 / ORACLE-MONITOR。
- **fixtures_services**：P1 extreme fixture；无服务；临时页面目录由测试清理。
- **coverage limits**：不证明真实布局、键盘、对比度或截图。

##### UI phase/task fields (仅 UI scope 填写)

- **ui_scope**：`ui`
- **component action / real consumer**：add-local evolution trends region；generated monitor → user browser。
- **state owner / typed ViewModel / CSS/token owner**：`buildReflectionPage()` frozen data；schema/contract 边界；`#evolution-trends` 局部 CSS。
- **fixture / viewport / responsive**：extreme fixture；390×844 与 1280×800；窄屏纵排、长文本换行。
- **browser / a11y / performance / screenshot**：T007 执行 canonical browser checks 与双 viewport 截图；本任务仅固定可测试 DOM/状态合同。
- **coverage limits / N/A or unknown reason**：视觉权威与真实浏览器在 T007 前 unavailable。
- **design-gap handoff**：`design_status=unknown`；缺 Design/Experience/Screen Read Map；fallback=现有 monitor；追加区域、固定标签；视觉返工风险保留；human confirmation 不等于 design approval。
- **design refs**：`current_material_ref=spec.md#10.1`；`design_revision=unknown`；visible labels=`建议行动|仅供参考|前期质量税|显示更多|展开全部证据`；preview/screenshot unavailable；fixture/viewport 如上。
- **state UI facts**：default/empty/error/insufficient_samples/unavailable/stale/unverified 及三区块混合态均需文字状态、窄屏换行和颜色非唯一编码。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：monitor ViewModel/DOM RED 合同测试。
- **executed_commands**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh monitor`（RED=1；GREEN 后同 gate=0）
- **evidence_refs**：`quality/tests/m16-p2-monitor/gate.json`、`tests/contract/build-reflection-page.test.mjs`
- **covered_ac**：AC-PAGE-001、AC-PAGE-002、AC-PAGE-003（测试事实）
- **review_fact**：与 T006 共享 Phase review；wh-review provider unavailable
- **completed_at**：2026-09-01
- **执行事实**：RED=1 由 evolution ViewModel/DOM 缺失触发；实现后同 gate GREEN=0。

#### T006 — GREEN：monitor frozen projection 与局部 UI

- **ID**：T006
- **Phase**：Phase P2 — 现有 monitor 只读趋势区
- **goal**：实现 T005 的 frozen projection 与局部 DOM/CSS，保持旧区域和失败隔离。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-m16-evolution-20260831/spec.md","hash":"b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb","id":"M16-SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-m16-evolution-20260831/plan.md","hash":"afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269","id":"M16-PLAN"}]`
- **source_refs / decision_refs**：R-010,R-012,D-001,D-002,D-005,D-006 → FR-PAGE-001..005,FR-POOL-004..005,FR-TAX-004,FR-TAX-006 / AC-PAGE-001..003
- **输入**：T005 RED 与 T002 current projection/inventory/attempt/read-guard API。
- **依赖**：T005
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-PAGE-001、FR-PAGE-002、FR-PAGE-003、FR-PAGE-004、FR-PAGE-005、FR-POOL-004、FR-POOL-005、FR-TAX-004、FR-TAX-006
- **AC**：AC-PAGE-001、AC-PAGE-002、AC-PAGE-003
- **动作**：保持 page CLI 参数不变，在 adapter 内派生 project/storage并冻结真实 raw sources；把已校验 `--now` 原样作为 `asOf` 调用 tax producer，再把 exact `{taxProjection,sourceInventoryHash,asOf,refreshResult}` 显式传给 projection reader。reader 逐字段重验同 attempt/source/time并生成 frozen ViewModel/read guard，禁止隐藏重读/系统时钟，任一 stale/unavailable 零写旧 current；模板实现三区块、tax 状态、未验证文案与可访问交互；不得修改 T005 测试。
- **精确文件**：`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`
- **boundary**：files: exact two production files; symbols/regions: buildReflectionPage raw inventory/attempt adapter、page read guard 与 render evolution region only; tests return to T005
- **输出**：合同 GREEN；失败保留旧 snapshot 并显示 honest status，其他区域不清空。
- **Knowledge**：template 只消费 frozen data；禁止 fetch/retry/timeout/background refresh 和 global CSS override。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh monitor`
- **expected_exit**：0
- **oracle**：`ORACLE-MONITOR` — 新旧合同、失败隔离、安全 refs 和稳定排序全通过。
- **evidence_path**：`quality/tests/m16-p2-monitor/gate.json`
- **STOP**：需弱化旧测试、引入第二状态 owner、全局样式覆盖或客户端网络逻辑。
- **recovery**：回滚 page 新 keys/template region；保留 P1 数据与 T005 RED。
- **task risk**：旧 task/filter 回归、XSS、安全引用或一处失败清空全页。
- **test tier / test method**：fullstack — 与 T005 相同。
- **scenarios / commands / expected exit / oracle**：与 T005 同 page-only inventory、page `--now`→tax `asOf` 原样转交、tax/current projection windowStart/windowEnd/generatedAt 同一时间身份及漂移拒绝、tax sample/UI 非因果/非许可文案、七状态及三区块混合态、同命令 / 0 / ORACLE-MONITOR。
- **fixtures_services**：同 T005；测试清理生成页。
- **coverage limits**：真实 browser 双 viewport 由 T007；a11y/performance 不由当前 runner 独立证明。

##### UI phase/task fields (仅 UI scope 填写)

- **ui_scope**：`ui`
- **component action / real consumer**：add-local；generated monitor → user browser。
- **state owner / typed ViewModel / CSS/token owner**：page builder frozen ViewModel；schema/contract；template local selector。
- **fixture / viewport / responsive**：extreme fixture；390×844、1280×800；窄屏纵排、无横溢出目标。
- **browser / a11y / performance / screenshot**：实现可访问 markup；T007 执行 canonical browser checks 与截图，a11y/performance 不由当前 runner 独立证明。
- **coverage limits / N/A or unknown reason**：Design/Experience 未绑定，不能宣称视觉通过。
- **design-gap handoff**：与 T005 相同；不得把合同 GREEN 升格为 design approval。
- **design refs**：与 T005 相同。
- **state UI facts**：default/empty/error/insufficient_samples/unavailable/stale/unverified 及三区块混合态都保留可见文字、keyboard 顺序和非颜色唯一编码。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：build-reflection-page 增加 evolution frozen projection，模板增加 Evolution 趋势区与可访问展开交互。
- **executed_commands**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh monitor`（GREEN=0）
- **evidence_refs**：`quality/tests/m16-p2-monitor/gate.json`、`tests/contract/build-reflection-page.test.mjs`
- **covered_ac**：AC-PAGE-001、AC-PAGE-002、AC-PAGE-003（focused tests）
- **review_fact**：wh-review provider unavailable；设计/Experience 仍 unknown
- **completed_at**：2026-09-01
- **执行事实**：旧 task/overall 页面合同保留，Evolution 区只读；真实浏览器由 T007 负责。

### Verify

- **Target**：PAGE 适用 FR/AC 与旧 page seam；真实 browser 双 viewport 由 P3/T007 验证，a11y/performance 不由当前 runner 独立证明。
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh monitor`
- **expected_exit**：0
- **evidence_path**：`quality/tests/m16-p2-monitor/gate.json`
- **Oracle**：ORACLE-MONITOR。

### Knowledge

P3 消费 P2 合同，并在 current move-map 登记后生成真实 browser facts；Design/Experience 仍 unknown。

### STOP

- 旧 task/filter/safe-ref 回归或页面新增网络控制面。

### Done

- T005 RED、T006 GREEN；不在 P2 提前声明 browser evidence。

### Risks and rollback

- **Risk**：旧视图回归、XSS、横溢出、假视觉通过。
- **Prevention**：旧断言、safe refs、极端 fixture、真实隔离浏览器。
- **Rollback / recovery**：回滚 template region/page keys；保留 P1 对象和失败证据。

## Phase P3 — 治理双向登记与当前快照总验收

### Goal

新增 surface/consumer/owner/delete 条件双向闭合，public 七行为不变，当前 snapshot 可聚合验收。

### Files

- **NEW**：`tests/contract/workflow-evolution-governance.test.mjs`、`tests/e2e/workflow-evolution-current.test.mjs`、`tests/contract/workflow-evolution-browser-manifest.test.mjs`、`tests/fixtures/workflow-evolution/setup-browser-fixture.mjs`、`tests/fixtures/workflow-evolution/run-browser-qa.sh`、`tests/fixtures/workflow-evolution/run-final-review-chain.mjs`、`tests/fixtures/workflow-evolution/validate-final-review-chain.mjs`、`tests/fixtures/workflow-evolution/run-final-aggregate.sh`、`quality/evidence/browser-qa/m16-monitor/manifest.json`（T007 task evidence output，非 repository source）
- **MODIFY**：`docs/architecture/move-map.json`、`tests/contract/public-behavior-baseline.test.mjs`
- **DO NOT TOUCH**：runtime facade/stage runtime、四材料以外的历史记录

### Tasks

#### T008 — RED：最终治理集合与 current snapshot seam

- **ID**：T008
- **Phase**：Phase P3 — 治理双向登记与当前快照总验收
- **goal**：用失败测试固定 production-only filesystem/runtime-object↔move-map 集合、owner/consumer/delete 条件、七行为基线和 current snapshot seam；test-only 文件必须只由 fixture manifest/gate evidence 跟踪且不得进入 move-map。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-m16-evolution-20260831/spec.md","hash":"b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb","id":"M16-SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-m16-evolution-20260831/plan.md","hash":"afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269","id":"M16-PLAN"}]`
- **source_refs / decision_refs**：R-001,R-002,R-008,R-013,R-014,D-005,D-007,D-008,D-010 → FR-POOL-003,FR-POOL-005,FR-POOL-006,FR-GOV-001..003 / AC-POOL-004,AC-GOV-001..002
- **输入**：T004 私有 CLI/ledger/brief、T006 page current implementation 与现有 move-map/public baseline。
- **依赖**：T004、T006
- **并行**：否 — join data-plane 与 page 两支后固定 governance/current identity
- **FR**：FR-POOL-003、FR-POOL-005、FR-POOL-006、FR-GOV-001、FR-GOV-002、FR-GOV-003
- **AC**：AC-POOL-004、AC-GOV-001、AC-GOV-002
- **动作**：新增 final governance/e2e tests 并扩展 public baseline；move-map exact set 只枚举 deep module、combined schema、三个 private CLI、四个 logical runtime objects，以及修改的 derive/stage-reflection/page production producers；四对象按 logical path/schema/owner/consumer metadata 对照，不把 temp path 当 repo file，并断言 negative-results 同时登记 external direct consumer=`iteration brief` 与 writer-side validation consumer=`negative deep writer`。另对 deep module 九个 frozen exports 逐项解析真实 import/call backref：每项至少一个且只能来自 plan allowlist；`readCurrentCandidateSnapshot` 不得 export，除三个 internal callers 外任何生产引用失败。反向断言 P1 wrapper/checker/baseline、全部 tests、browser/review/aggregate harness 均不在 move-map且只由 fixture manifest/canonical gate evidence 跟踪。逐对象验证真实 consumer、D24 不是第五对象、external receipt 与七 public behaviors；T008 只写测试、不改生产治理登记。
- **精确文件**：`tests/contract/workflow-evolution-governance.test.mjs`、`tests/e2e/workflow-evolution-current.test.mjs`、`tests/contract/public-behavior-baseline.test.mjs`
- **consumer oracle**：brief exact read path=`generate-iteration-brief.mjs --read-current`→identity validation→stdout→user；禁止泛称 browser。candidate transition API/CLI 与 `$defs.project_lock` 唯一 host_id+boot_id+session_epoch schema 也纳入已存在项双向治理断言。`ORACLE-EXPORT-CONSUMERS` 逐项比对九 export→allowlisted real consumer/import backref，缺失/越界均失败；internal candidate reader 必须无 export 且仅三个 module-local callers。
- **boundary**：files: exact three tests; symbols/regions: M16 entries, consumer backrefs, seven behaviors, current identity
- **输出**：仅因 production item/object metadata 登记缺失或 test-only 混入 move-map 而稳定 RED；既有 current identity/read-guard 与七行为基线仍通过。
- **Knowledge**：move-map 是 surface authority；review/test/evidence 不是推进许可证；browser stale 不可升格。
- **verification_role**：RED
- **paired_task**：T009
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh governance`
- **expected_exit**：1
- **oracle**：`ORACLE-GOV-E2E` — production filesystem↔move-map 与四 logical runtime objects↔metadata 双向精确；test-only 集合与 move-map 交集为空；仅登记缺失/多余/placeholder 或第八 behavior 失败。
- **evidence_path**：`quality/tests/m16-p3-governance/gate.json`
- **STOP**：需要 placeholder consumer、修改 public runtime、回填历史或把质量事实当 gate。
- **recovery**：修正测试映射；需要 surface 变化退回 plan/decision。
- **task risk**：只登记文件不验证真实 consumer，或测试依赖旧快照。
- **test tier / test method**：fullstack — governance authority、runtime surface 与跨阶段 current identity。
- **scenarios / commands / expected exit / oracle**：candidate→page→brief、production files/commands/schema/modified producers 双向登记、四 object metadata、九 export allowlisted consumer/backref 正负例、internal helper external import rejection、test-only exclusion、三个 private CLI、project_lock、七行为、current read guard与 external receipt；同命令 / 1 / ORACLE-GOV-E2E + ORACLE-EXPORT-CONSUMERS。
- **fixtures_services**：复用 P1 fixture/P2 evidence；无服务；临时 task store 清理。
- **coverage limits**：不证明 release/close、业务收益或历史迁移。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：governance/current snapshot RED 测试与七行为基线回归。
- **executed_commands**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh governance`（RED=1；GREEN 后同 gate=0）
- **evidence_refs**：`quality/tests/m16-p3-governance/gate.json`、governance/e2e/baseline tests
- **covered_ac**：AC-POOL-004、AC-GOV-001、AC-GOV-002（测试事实）
- **review_fact**：与 T009 共享 Phase review；wh-review provider unavailable
- **completed_at**：2026-09-01
- **执行事实**：RED=1 由 move-map production 登记缺失触发；补登记后 GREEN=0。

#### T009 — GREEN：最终治理检查与 production-only 闭合

- **ID**：T009
- **Phase**：Phase P3 — 治理双向登记与当前快照总验收
- **goal**：创建最终 browser/review/aggregate test-only checks但不登记 move-map；用真实 producer preflight 四对象并完成 production-only move-map 双向闭合，使 T008 通过。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-m16-evolution-20260831/spec.md","hash":"b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb","id":"M16-SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-m16-evolution-20260831/plan.md","hash":"afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269","id":"M16-PLAN"}]`
- **source_refs / decision_refs**：与 T008 相同。
- **输入**：T008 RED 与 T004/T006 current implementation；T007 尚未执行。
- **依赖**：T008
- **并行**：否 — 必须在 T008 RED 后完成 move-map，随后才允许正式 T007 evidence
- **FR**：FR-POOL-003、FR-POOL-005、FR-POOL-006、FR-GOV-001、FR-GOV-002、FR-GOV-003
- **AC**：AC-POOL-004、AC-GOV-001、AC-GOV-002
- **动作**：作为最终 browser/review/aggregate test-only checks 的 owner，先创建六个 harness并由 fixture manifest/canonical gate evidence 跟踪，明确不写 move-map。preflight 必须在配置允许的 temp storage root 调用真实 producer，依次创建 `evolution-candidates.jsonl`、`attempted-edits.jsonl`、`negative-results.jsonl`、`iteration-brief.md`，逐个绑定 logical object id/path/schema、content hash、producer identity与预期 consumer metadata；其中 negative-results consumer metadata 必须区分 external direct consumer=`iteration brief` 与 writer-side validation consumer=`negative deep writer`（同锁读取 current log/index 校验 identity/supersedes）。同时让 T008 governance test 对九个 frozen exports 逐项验证至少一个 plan-allowlisted real consumer/import backref，拒绝 allowlist 外 caller，并断言 `readCurrentCandidateSnapshot` 不 export且仅三个 module-local callers。验证后只按 attempt/owner 清理 temp root，不把 temp absolute path 登记为 repo file。move-map 只写全部 M16 production file/command/schema、四 object metadata与修改 production producers；T008 test 双向枚举，漏项、多余 test-only、placeholder nonzero。完成后冻结 move-map hash，T007/T010 只读绑定。
- **精确文件**：`docs/architecture/move-map.json`、`tests/fixtures/workflow-evolution/setup-browser-fixture.mjs`、`tests/fixtures/workflow-evolution/run-browser-qa.sh`、`tests/contract/workflow-evolution-browser-manifest.test.mjs`、`tests/fixtures/workflow-evolution/run-final-review-chain.mjs`、`tests/fixtures/workflow-evolution/validate-final-review-chain.mjs`、`tests/fixtures/workflow-evolution/run-final-aggregate.sh`
- **final governance boundary**：T009 是唯一 final move-map writer；test-only harness 不登记。T010 不修改 move-map。T009 GREEN hash 是 T007 manifest 与 T010 current-binding authority。
- **boundary**：files: exact seven governance/test-only files; symbols/regions: create six test-only checks, real-producer temp preflight, production-only bidirectional registration; tests return to T008
- **输出**：production files/commands/schema/modified producers 与四 logical objects 双向闭合，test-only intersection=empty；preflight temp 已 owner-safe cleanup；输出 frozen move-map hash。
- **Knowledge**：catalog/stage/move-map 各有唯一 authority；private CLI 不进入 public runtime。
- **verification_role**：GREEN
- **paired_task**：T008
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh governance`
- **expected_exit**：0
- **oracle**：`ORACLE-GOV-E2E` — 真实 producer 在 allowed temp root 创建并 hash-bind 四对象后清理；move-map 对 production files/commands/schema/modified producers 与四 object metadata 双向闭合，九 export consumer/backref allowlist闭合且 internal helper 无外部 import，test-only 零条目，七行为不变。
- **evidence_path**：`quality/tests/m16-p3-governance/gate.json`
- **STOP**：需改 runtime facade、stage action、历史记录或用 placeholder consumer 过测。
- **recovery**：回滚错误治理条目/测试；保留生产事实和 T008 RED。
- **task risk**：登记与真实 consumer 漂移，或 E2E 把物理存在误写为质量通过。
- **test tier / test method**：fullstack — 与 T008 相同。
- **scenarios / commands / expected exit / oracle**：六个 test-only post 文件由 manifest/evidence 跟踪且 move-map intersection=empty；allowed temp root真实 producer四对象创建/hash/identity/cleanup；production filesystem+object metadata 双向 exact set；九 export 每项至少一条 allowlisted real consumer/backref、越界 caller 失败、internal helper 无 export/外部 import；同命令 / 0 / ORACLE-GOV-E2E + ORACLE-EXPORT-CONSUMERS。
- **fixtures_services**：同 T008；测试清理临时 task store。
- **coverage limits**：不证明发布、merge/push、真实收益或跨主机锁。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：补齐 M16 production move-map 与 test-only harness；新增 browser/review/aggregate 受控脚本。
- **executed_commands**：`bash tests/fixtures/workflow-evolution/run-red-green-gate.sh governance`（GREEN=0）
- **evidence_refs**：`quality/tests/m16-p3-governance/gate.json`、`docs/architecture/move-map.json`
- **covered_ac**：AC-POOL-004、AC-GOV-001、AC-GOV-002（focused tests）
- **review_fact**：wh-review provider unavailable；治理测试通过不等于发布/close
- **completed_at**：2026-09-01
- **执行事实**：production-only 登记与 test-only 排除断言通过；browser evidence 随后由 T007 生成。

#### T007 — VERIFY：真实 browser 与双 viewport 证据

- **ID**：T007
- **Phase**：Phase P3 — 治理双向登记与当前快照总验收
- **goal**：对当前 fixture 生成的单页执行两 viewport、Evolution tab/预期文案、console/network 与 cleanup 验收。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-m16-evolution-20260831/spec.md","hash":"b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb","id":"M16-SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-m16-evolution-20260831/plan.md","hash":"afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269","id":"M16-PLAN"}]`
- **source_refs / decision_refs**：R-010,R-012,D-001,D-002,D-005,D-006 → FR-PAGE-001..005,FR-TAX-004,FR-TAX-006 / AC-PAGE-001..003
- **输入**：T009 current move-map、T006 生成页与 `tests/fixtures/workflow-evolution/extreme.json`。
- **依赖**：T009
- **并行**：否 — T009 是 browser 文件唯一 owner，已完成 dry-run/preflight 与 current move-map closure 后，T007 才能只读执行
- **FR**：FR-PAGE-001、FR-PAGE-002、FR-PAGE-003、FR-PAGE-004、FR-PAGE-005、FR-TAX-004、FR-TAX-006
- **AC**：AC-PAGE-001、AC-PAGE-002、AC-PAGE-003
- **动作**：T007 是 browser evidence 唯一 producer。只读执行 T009-owned canonical browser runner；runner 对单页 `workflowhub-monitor.html` 依次执行 open、Evolution tab、预期文案、page errors、runtime network、390×844/1280×800 两张截图与 cleanup，manifest 保留实际 assertions/checks/viewports/evidence/status/cleanup 字段。runner 不要求也不产出 `snapshot_id`、`refresh_result`、planned/observed 或独立 contract preflight；临时 fixture source 只在本次执行中可用，cleanup 后不作 source hash 后验重验。禁止旧 fixture；passed/qa_failed/unavailable/incomplete 都无条件运行 manifest validator，validator exit=22 优先，否则保留 QA 0/20/21；task-owned server/session/temp 全清理，不复用登录态。任何后续任务不得生成、刷新或改写该 evidence。
- **精确文件**：`quality/evidence/browser-qa/m16-monitor/manifest.json` — 唯一 task evidence output；零 repository source/test file ownership/write，只读消费 T009-owned browser harness
- **boundary**：repo files: zero writes; task evidence: one attempt-owned browser manifest/screenshots/logs; production correction returns to T006，script/fixture/checker correction returns to T009
- **输出**：本次 runner 执行的 `browser-qa-evidence.v1` manifest、两张截图、实际检查清单、console/network 与 cleanup 事实；status=`passed|qa_failed|unavailable|incomplete`。
- **Knowledge**：必须使用 isolated-browser-qa；不复用登录态；静态本地页无业务网络请求。
- **verification_role**：N/A — non-behavior browser verification
- **paired_task**：N/A — verification uses T005/T006 behavior pair
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-browser-qa.sh`
- **expected_exit**：0
- **expected_exit_notes**：状态矩阵 `0|20|21|22`：passed=0；qa_failed=20；tool unavailable/incomplete=21；manifest validator invalid=22 且优先于 QA 状态。
- **oracle**：`ORACLE-MONITOR-BROWSER` — 合同通过且真实单页两 viewport 可打开；Evolution tab、预期文案、无页面错误、无外部运行时网络请求及两张截图符合 canonical manifest checks。
- **evidence_path**：`quality/evidence/browser-qa/m16-monitor/`
- **STOP**：页面无法打开、Evolution tab/预期文案缺失、console error、外部运行时网络请求或截图缺失时记录 qa_failed 并回 T006；若是 T009-owned script/fixture/checker 缺陷，必须回 T009 修复、重跑 dry-run/final closure并产生新 frozen move-map hash，使旧 evidence 自动 stale，再用新 attempt 重跑 T007；cleanup 失败同样不得完成。当前 runner 不独立判定 keyboard/focus、对比度、横溢出或展开控件同步；这些事实不能从本证据推断。隔离浏览器/agent-browser unavailable 时记录 incomplete/unavailable，不伪造 qa_failed 或 exit 0。
- **recovery**：保留失败截图/日志；产品缺陷回 T006，browser harness 缺陷回 T009；任何修复后旧 evidence 失效并用新 attempt 重跑。
- **task risk**：把合同测试或旧截图误当真实浏览器证据。
- **test tier / test method**：fullstack — isolated-browser-qa 实页验收。
- **scenarios / commands / expected exit / oracle**：setup 固定单页 `workflowhub-monitor.html`；canonical runner 不执行独立 contract preflight，按 isolated-browser-qa 实际顺序打开页面、点击 Evolution tab、采集默认/窄屏/宽屏 snapshot、生成 390×844 与 1280×800 两张截图、读取 errors/network，并完成 browser/server/temp cleanup。manifest 只按 runner 实际字段记录 assertions、checks、两项 viewports/evidence、status 与 cleanup；不要求 `snapshot_id`、`refresh_result`、planned/observed 或 cleanup 后临时 source hash 重验。passed/qa_failed/unavailable/incomplete 四路都运行 manifest validator，validator failure 优先返回，否则保留 QA 状态；真实断言失败=`qa_failed` 且 QA exit non-zero，工具 unavailable 或 cleanup 不完整=`unavailable/incomplete`、QA exit_code absent、orchestrator non-zero；passed 才 exit 0 / ORACLE-MONITOR-BROWSER。
- **fixtures_services**：T009-owned setup harness 在 `mktemp -d` root 生成单页；canonical QA runner 启动 task-owned localhost server 并持有精确 PID；技能 cleanup 只清 agent-browser session，确认 server 仍活后由 runner trap 停该 fixture server并清临时 root；不复用登录态，不触碰用户服务。
- **coverage limits**：当前 runner 不独立断言 keyboard/focus order、对比度、横溢出或展开控件同步；另不覆盖 Safari/真机/生产部署、Design/Experience 审批或长期性能。

##### UI phase/task fields (仅 UI scope 填写)

- **ui_scope**：`ui`
- **component action / real consumer**：verify add-local region；真实本地 browser consumer。
- **state owner / typed ViewModel / CSS/token owner**：只读 T006 frozen projection/schema/local CSS。
- **fixture / viewport / responsive**：extreme fixture；390×844、1280×800；检查纵排、换行、无横溢出。
- **browser / a11y / performance / screenshot**：isolated-browser-qa；页面可打开、Evolution tab/预期文案、console/network 与两 viewport 截图；截图写 evidence_path。
- **coverage limits / N/A or unknown reason**：设计稿缺失，证据只证明当前 fallback visual basis。
- **design-gap handoff**：design_status=unknown；缺 Design/Experience；现有 monitor 为 fallback；视觉返工风险保留；human confirmation 不等于 design approval。
- **design refs**：current material/spec anchor 与固定 labels；design_revision/preview unknown；fixture/viewport 已绑定；截图执行后填写。
- **state UI facts**：当前 runner 以 rendered snapshots 记录单页中的状态文字；未观察状态写 unavailable，不推测，keyboard/focus/contrast 不从截图推断。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：无 repository source 修改；生成当前 fixture 的 browser QA manifest 与截图证据。
- **executed_commands**：`bash tests/fixtures/workflow-evolution/run-browser-qa.sh`（exit=0）
- **evidence_refs**：`quality/evidence/browser-qa/m16-monitor/manifest.json`、`quality/evidence/browser-qa/m16-monitor/m16-monitor-390x844.png`、`quality/evidence/browser-qa/m16-monitor/m16-monitor-1280x800.png`
- **covered_ac**：AC-PAGE-001、AC-PAGE-002、AC-PAGE-003（browser evidence；Design/Experience 未覆盖）
- **review_fact**：browser manifest validator 通过；wh-review provider unavailable
- **completed_at**：2026-09-01
- **执行事实**：isolated-browser-qa/agent-browser 未复用登录态，cleanup=complete；证据绑定当前 task root。

#### T010 — FINAL：current-snapshot aggregate verification

- **ID**：T010
- **Phase**：Phase P3 — 治理双向登记与当前快照总验收
- **goal**：对当前 spec/plan/tasks/implementation snapshot 一次聚合验证 22 项 AC、跨任务 seam 和完整质量事实。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-m16-evolution-20260831/spec.md","hash":"b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb","id":"M16-SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-m16-evolution-20260831/plan.md","hash":"afd407b72231af9bb122ea2f4e01a69f457ad639232fd0ff4562435bc2481269","id":"M16-PLAN"}]`
- **source_refs / decision_refs**：R-001..014,D-001..010 → all M16 FR/AC
- **输入**：T001-T009 completed facts、current material hashes、T009 创建但不登记 move-map 的 browser/review/aggregate harness manifests，以及 T007 exact current browser evidence。
- **依赖**：T007、T009
- **并行**：否 — aggregate reads all preceding task facts
- **FR**：FR-POOL-001、FR-POOL-002、FR-POOL-003、FR-POOL-004、FR-POOL-005、FR-POOL-006、FR-POOL-007、FR-POOL-008、FR-TAX-001、FR-TAX-002、FR-TAX-003、FR-TAX-004、FR-TAX-005、FR-TAX-006、FR-TAX-007、FR-EDIT-001、FR-EDIT-002、FR-EDIT-003、FR-NEG-001、FR-NEG-002、FR-NEG-003、FR-ABL-001、FR-ABL-002、FR-ABL-003、FR-BRIEF-001、FR-BRIEF-002、FR-BRIEF-003、FR-BRIEF-004、FR-BRIEF-005、FR-BRIEF-006、FR-BRIEF-007、FR-BRIEF-008、FR-BRIEF-009、FR-PAGE-001、FR-PAGE-002、FR-PAGE-003、FR-PAGE-004、FR-PAGE-005、FR-GOV-001、FR-GOV-002、FR-GOV-003
- **AC**：AC-POOL-001、AC-POOL-002、AC-POOL-003、AC-POOL-004、AC-POOL-005、AC-TAX-001、AC-TAX-002、AC-TAX-003、AC-EDIT-001、AC-EDIT-002、AC-NEG-001、AC-NEG-002、AC-ABL-001、AC-ABL-002、AC-BRIEF-001、AC-BRIEF-002、AC-BRIEF-003、AC-PAGE-001、AC-PAGE-002、AC-PAGE-003、AC-GOV-001、AC-GOV-002
- **动作**：对 repo/product/material/move-map/browser evidence 严格只读执行 T009 harness；唯一 canonical 顺序固定为 browser manifest→review chain/receipt→全部 M16 focused→`npm test && npm run check`→原子 aggregate。任一步失败立即返回该步 code且不运行后续步骤。task-quality exact 两类受控 writer：现有 `review --action=record` 写 immutable review receipt，owner=`run-final-review-chain:<attempt_id>`，idempotency key=`sha256(current material manifest + exact wh-review result + provider/runtime identity)`；同 key同 bytes 返回既有 receipt，同 key异 bytes/已有不同 current identity fail-loud且零覆盖；final aggregate runner 重验 receipt 后按上述顺序运行 focused/repository gates，并以 temp write/fsync/rename/parent-fsync 原子写唯一 `quality/tests/m16-final-aggregate.json`，同一对象内绑定 focused/repository 结果与 review receipt refs/hashes。packer/hash/record/status/validator任一失败保留既有 immutable receipt与原始 result，aggregate 发布前失败不覆盖旧 bytes，cleanup 只删同 owner temp，重试用新 attempt但同 logical key；不另写 focused/repository 持久 JSON。
- **精确文件**：`tests/fixtures/workflow-evolution/run-final-aggregate.sh`、`tests/fixtures/workflow-evolution/run-final-review-chain.mjs`、`tests/fixtures/workflow-evolution/validate-final-review-chain.mjs`、`tests/contract/workflow-evolution-browser-manifest.test.mjs`
- **final governance closure**：只读验证 T009 final closure 与 frozen move-map hash；任何 repo/product/material/move-map/browser-evidence mutation 都 nonzero；仅允许 review receipt 与单一 final aggregate 两类 task-quality writer。
- **boundary**：files: exact four existing scripts/checkers; symbols/regions: product-side read-only validation + controlled immutable review receipt write + atomic single aggregate write/consumption; no repository writer
- **输出**：当前 snapshot 的 formal review/disposition 与 final test fact；与 work readiness/release/close 分开。
- **Knowledge**：任何 stale/missing browser/review/test fact 保持 incomplete；不得靠重跑全量掩盖局部失败。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-final-aggregate.sh`
- **expected_exit**：0
- **expected_exit_notes**：first-failure wins且后续步骤不运行：success=0；browser manifest/status 20/21/22 原样透传；review unavailable=31；review receipt invalid/identity mismatch/unresolved finding=32；随后 M16 focused、`npm test`、`npm run check` 各返回其原始非零。
- **oracle**：`ORACLE-FINAL` — production-only move-map closure且test-only零条目；四 canonical gate与browser current；repo/product/material/move-map/browser evidence 零写；review receipt write 具 owner/idempotency/immutable/failure/rollback 断言，aggregate writer 只原子发布唯一 `m16-final-aggregate.json` 且其 focused/repository 结果和 review refs/hashes 全部重验一致；D24、review disposition、22 AC与七行为闭合。
- **evidence_path**：`quality/tests/m16-final-aggregate.json`、`quality/reviews/<sha256>.json`
- **STOP**：命令损坏、AC/trace 缺失、当前 identity 漂移、浏览器证据 stale、越界或需要新决策。
- **recovery**：保留完整输出与既有 immutable receipt；record 前失败零 task-quality 写，record 后失败不得删除/覆盖 receipt；aggregate 发布前失败不覆盖既有 aggregate，清理同 owner temp，修复后新 attempt 按同 idempotency key复核并原子重发单一 aggregate；回失败 owning task，不以全量重跑覆盖原失败。
- **task risk**：把 aggregate exit 0 升格成发布/收益/close 通过。
- **test tier / test method**：fullstack — repository final aggregate + prior isolated-browser-qa evidence。
- **scenarios / commands / expected exit / oracle**：production-only closure/test-only exclusion；browser manifest→current materials review chain→owner/hash temp→受控幂等 `review --action=record`→status/validator→M16 focused→`npm test && npm run check`→原子单文件 aggregate，逐步 first-failure/skip-later；覆盖同key复用/异bytes拒绝、record前零写、record后失败保留、aggregate temp/rename/parent-fsync 与旧 bytes 保留、cleanup owner safety、receipt identity/unresolved/provider unavailable、aggregate 内 focused/repository 结果及 review refs/hashes 精确绑定；D24与22 AC / 0 / ORACLE-FINAL。
- **fixtures_services**：复用已提交 fixture；所有 M16/repository tests 每例使用独立临时 root，不共享项目 storage/lock；browser task-owned server/session/temp 须清理。
- **coverage limits**：不覆盖真实业务收益、生产部署、Safari/真机、NFS/跨主机锁、merge/push/release。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`incomplete`
- **actual_changes**：执行当前 snapshot aggregate；browser 与 M16 focused tests 通过，正式 review unavailable，全量 npm test 已确认失败并中断，npm run check 以 markdownlint 25 errors 失败。
- **executed_commands**：`bash tests/fixtures/workflow-evolution/run-final-aggregate.sh`（aggregate status=incomplete）；`npm run check`（exit=1）；`node tools/cli/stage-runtime.mjs run --action=execute --stage=build-code`（exit=0，stage quality=incomplete）
- **evidence_refs**：`quality/tests/m16-final-aggregate.json`、`quality/tests/m16-final-aggregate/review.json`、`quality/evidence/stage-outcomes/build-code/aff93f6f7c1f7e2aefd088e0f65a89dde66f17dcfb01b3be0314f2c89bae9f4f.json`
- **covered_ac**：AC-PAGE-001、AC-PAGE-002、AC-PAGE-003、AC-POOL-004（browser/focused evidence）；其余 AC 缺完整 current acceptance chain
- **review_fact**：wh-review CLI 因 `stage-runner.mjs` 缺少 `authenticateCurrentBuildCodeStageOutcome` 导出而 unavailable；integration review 未通过 provider
- **completed_at**：N/A — quality incomplete
- **执行事实**：aggregate 保留 browser=0、focused=0、repository_test=130、repository_check=1；stage-reflection executor unavailable 事实已保留。

### Verify

- **Target**：GOV、T007 current browser evidence、全部 22 AC、跨任务 current snapshot、public surface 和 repository aggregate。
- **gate_cmd**：`bash tests/fixtures/workflow-evolution/run-final-aggregate.sh`（唯一 canonical final gate；内部顺序固定为 browser manifest → review chain → all M16 focused tests → `npm test && npm run check`）
- **expected_exit**：0
- **evidence_path**：`quality/tests/m16-p3-governance/gate.json`、`quality/evidence/browser-qa/m16-monitor/`、`quality/tests/m16-final-aggregate.json`、`quality/reviews/<sha256>.json`
- **Oracle**：ORACLE-GOV-E2E + ORACLE-MONITOR-BROWSER + ORACLE-FINAL；失败保留原始事实并回 owning task。

### Knowledge

完成只表示当前实现质量事实；work readiness、merge/push、release/close 和业务收益仍是独立事实。

### STOP

- move-map 漏项、placeholder consumer、第八 behavior、stale evidence、AC trace 缺失或需要新方向。

### Done

- T008 RED、T009 production-only governance closure GREEN/test-only excluded、T007 current browser evidence、T010 controlled immutable review receipt + atomic single aggregate；22 AC 可双向追溯。

### Risks and rollback

- **Risk**：治理登记与实际消费漂移，或最终通过被误当发布。
- **Prevention**：双向 contract、public baseline、current identity E2E 与明确 coverage limits。
- **Rollback / recovery**：只修登记/测试或回 owning task；整体回滚删除 M16 add 项并恢复 page/producer，保留材料和质量记录。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack；targeted RED/GREEN + repository `npm run check` + isolated-browser-qa current evidence。
- **scenarios**：22 AC、成功/失败/partial/stale/conflict/cancelled/wrong_domain、candidate→page→brief/ledger、public/governance、两 viewport。
- **command**: `bash tests/fixtures/workflow-evolution/run-final-aggregate.sh`（与 T010/P3 Verify 同一个 canonical gate）
- **expected exit**：0
- **oracle**：ORACLE-FINAL — 当前材料/实现/证据 identity 一致，22 AC 和跨任务 seam 闭合，七行为不变。
- **fixtures_services**：提交的 extreme fixture；所有 M16/repository tests 每例独立临时 root；所有 server/browser session/lock 完成清理。
- **evidence_path**：`quality/tests/m16-final-aggregate.json`、`quality/reviews/<sha256>.json`
- **coverage limits**：不证明真实收益、生产发布、真机/Safari、跨主机锁、merge/push/close。
- **STOP**：命令损坏、AC/identity 缺失、边界越界、browser evidence stale 或需要新决策。
- **execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## Dependency Graph

- **order**：T001 → T002；T002 后并行 T003 → T004 与 T005 → T006；T004 + T006 → T008 → T009 → T007 → T010

```text
T001 RED → T002 GREEN ┬→ T003 RED → T004 GREEN ─┐
                       └→ T005 RED → T006 GREEN ─┴→ T008 RED → T009 GREEN → T007 VERIFY → T010 FINAL
```

## Final Boundary Check

- [ ] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [ ] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [ ] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；VERIFY/FINAL 不修改行为。
- [ ] 依赖无环，41 FR / 22 AC 双向追溯闭合，unknown/unavailable/incomplete 未升格。
- [ ] review、test、evidence 只作为事实记录，不是开始、继续、merge、release 或交付许可证。
