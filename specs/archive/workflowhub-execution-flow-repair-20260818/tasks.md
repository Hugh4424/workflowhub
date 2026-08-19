# 任务清单：WorkflowHub 执行流与审查可靠性修复

- **Input**：`decision-log.md`（sha256: `16959dfd505a23146c894369d4bd0c1f3b986bb756d4c7c74aacbe340bebd541`）、`spec.md`（sha256: `36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a`）、`plan.md`（sha256: `70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa`）
- **Template version**：`plan-task.v3`

## 本轮 plan review disposition（原始 finding 仍在 quality/reviews）

以下只是当前任务的 owner/处置指针，不替代 `quality/reviews/` 的原始 provider finding，也不创建第二份 review authority。

| finding | disposition | owner / task | close fact |
| --- | --- | --- | --- |
| F-5a6159db4469 | accepted | P1 T102/T103 | 真实 host smoke 可认证；否则 P1 incomplete |
| F-6e8cca3fd2f8 | accepted | P2 T203、P3 T303 | real group/liveness receipt 与 hash/oracle 可消费 |
| F-71b257784337 | accepted | P2 T201/T202 | profile/config preflight 保留；raw source gate 移除；失败零 dispatch |
| F-83f3fe02f9c9 | accepted | P3 T303 | 外部 broker receipt 绑定 config/group/material/attempt |
| F-8642a9dc691c | accepted | P2 T201/T202 | 单请求 direction packet 与 reveal boundary 可观察 |
| F-a308172ccc84 | accepted | build-plan handoff | plan 定稿后刷新本文件全部 plan hash |
| F-b2f17073b6ea | accepted | T103/T203/T303/T403 | 每 Phase review card、触发、subject、snapshot、调用次数明确 |
| F-b3fb3f5959dc | accepted | OPEN-004 / P2 T201/T202 | stage-scoped route matrix 已写入四份材料并绑定当前 config hash |
| F-ba966fcd860b | accepted | P4 T401/T402 | environment、test/not_applicable、evidence binding 和缺口阻断可验证 |
| F-bc86fe077f2a、F-e81b3b4cc67f | accepted | P4 T401/T402 | 以枚举集合校验 20 FR、24 AC，不靠数量文字 |
| F-f5310703e578 | accepted | T203/T403 | 每个 finding 有 disposition；accepted_risk 缺绑定则 needs_human |

## Phase P1 — 交互生命周期与阶段顺序

### Goal

锁定既有阶段顺序、Talk 批量问题和 Grill/Clarify 真实 ask → wait → matching reply → resume；没有 host-visible reply 不得推断继续。

### Files

- **NEW**：`tests/contract/stage-order-and-host-interaction.test.mjs`
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-interaction-contract.test.mjs`
- **DO NOT TOUCH**：`workflows/make-decision/steps.json`；它是已核实的顺序 producer。

### Tasks

#### T101 — RED：交互批量与阶段顺序回归

- **ID**：T101
- **Phase**：Phase P1 — 交互生命周期与阶段顺序
- **goal**：用同一合同测试暴露一次一问、缺真实 reply、Grill/Clarify 无 lifecycle 或 steps 顺序漂移。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001/R-002/R-003/R-006/R-007 → D-001/D-002/D-003/D-006/D-007 → FR/AC
- **输入**：当前五阶段 steps、现有 interaction validators、Talk/Grill/Clarify skill contracts。
- **依赖**：none
- **并行**：否 — first RED for P1 behavior
- **FR**：FR-SEQ-001 FR-HAND-016 FR-INT-002 FR-INT-003
- **AC**：AC-SEQ-001 AC-HAND-017 AC-INT-001 AC-INT-002 AC-INT-003 AC-INT-004
- **动作**：增加/收紧失败测试，断言一批独立问题、选项后果/风险/推荐、真实 ask/wait/reply/resume、方向变化回流和既有 steps 顺序；不改生产实现。
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`
- **boundary**：files: `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `skills/talk-with-zhipeng/SKILL.md`, `skills/grill-with-docs/SKILL.md`, `skills/spec-clarify/SKILL.md`, `tests/contract/stage-interaction-batching.test.mjs`, `tests/interaction-quality-contract.test.mjs`, `tests/stage-interaction-contract.test.mjs`, `tests/contract/stage-order-and-host-interaction.test.mjs`; symbols/regions: interaction instructions and contract assertions only; do not modify steps.json or public runtime.
- **输出**：非零 RED stdout、失败断言、覆盖范围和 host dependency fact。
- **Knowledge**：真实交互由外部 Stage Agent host 产生；WorkflowHub bridge 只认证和发布已产生 execution/unavailable。
- **verification_role**：RED
- **paired_task**：T102
- **gate_cmd**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P1-INTERACTION` — 同一断言显示 batch/lifecycle/顺序缺口，不能由 Agent 自己生成 reply 通过。
- **evidence_path**：`quality/tests/p1-interaction-red.json`
- **STOP**：若 RED 只因环境/命令错误、需要新交互状态机、需要跳过真实 reply 或需要改 steps.json，停止并回到 P1 owning material。
- **recovery**：P1 owner 保留原始 stdout/exit，修复 fixture 或恢复当前测试字节；不改四份材料和 steps.json。
- **task risk**：把一次一问包装成 batch，或把 contract fixture 误当真实 host 证据。
- **test tier / test method**：fullstack-slice-testing / Vitest contract；覆盖 workflow skill、host lifecycle schema 和 steps consumer，不启动外部 provider。
- **scenarios / commands / expected exit / oracle**：batch 多题、部分 reply、wrong card、missing reply、direction return、Grill/Clarify lifecycle、steps order；本命令 expected exit 1，oracle 为 `ORACLE-P1-INTERACTION`。
- **fixtures_services**：现有 JSON/markdown fixtures；无外部服务；测试结束清理临时 fixture。
- **coverage limits**：覆盖合同和事实绑定，不证明真实宿主 UI 已发送消息；宿主缺失保持 unavailable/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-08-19 — RED fact canonicalized; paired GREEN remains separately incomplete at phase level because host evidence is unavailable
- **执行事实**：
  - Phase Card（build-code 2026-08-18）：goal = 用真实 contract 断言 P1 的批量提问、matching reply/resume、Grill/Clarify lifecycle、方向回流和既有 steps 顺序；allowed files = 本任务列出的 8 个 workflow/skill/test 文件及对应 interaction contract symbols；covered AC = AC-SEQ-001、AC-HAND-017、AC-INT-001~004；non-goals = 不改 steps.json、不新增公共 interaction state machine、不猜用户 reply、不改变产品方向；compatibility boundary = bridge 只认证真实 host execution/unavailable，缺 host receipt 保持 incomplete；test route = fullstack-slice-testing，先执行本任务 gate_cmd 形成真实 RED，再同命令 GREEN；stop = 需要改 steps 顺序、生成 reply、增加公共控制面或改变方向时停止并回 owning material；expected handoff = P1 产出当前 interaction contract、RED/GREEN facts、host evidence 限制、一次 Phase review 及 findings disposition，下一项为 T102。
  - RED 已运行，canonical receipt：`quality/tests/p1-interaction-red.json`（sha256=`ffe73fea7fd0b5ba818436e72c84577a99e267f7c143bff63698f979f4cabacd`）；实际 exit=1，失败断言为 Talk round 1/2/3 未逐轮声明真实 `ask -> wait -> user reply -> resume` seam；T101 只代表 RED 事实完成，不代表 P1 phase 完成。

#### T102 — GREEN：批量交互与顺序合同修复

- **ID**：T102
- **Phase**：Phase P1 — 交互生命周期与阶段顺序
- **goal**：让 T101 的同一断言在真实 lifecycle contract 下通过，同时保留 wrong/missing reply 负例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：与 T101 相同：R-001/R-002/R-003/R-006/R-007 → D-001/D-002/D-003/D-006/D-007
- **输入**：T101 RED 断言、既有 interaction aggregate/lifecycle validator 和 steps.json 的已核实顺序。
- **依赖**：T101
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-SEQ-001 FR-HAND-016 FR-INT-002 FR-INT-003
- **AC**：AC-SEQ-001 AC-HAND-017 AC-INT-001 AC-INT-002 AC-INT-003 AC-INT-004
- **动作**：修正 skill/contract 语义和宿主输入约束；一批展示独立问题；Talk/Grill/Clarify 只从 matching user reply resume；方向变化回 make-decision；不新增 public interaction state machine。外部 Stage Agent 必须提供一次真实 host smoke：`batch_id`、`question_ids`、`ask_event`、`wait_started`、`matching_reply`、`resume_event`，并把脱敏 hash-bound receipt 放入当前 task 的既有 `quality/evidence/` 目录；没有该 receipt 只能记录 incomplete。
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`
- **boundary**：files: `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `skills/talk-with-zhipeng/SKILL.md`, `skills/grill-with-docs/SKILL.md`, `skills/spec-clarify/SKILL.md`, `tests/contract/stage-interaction-batching.test.mjs`, `tests/interaction-quality-contract.test.mjs`, `tests/stage-interaction-contract.test.mjs`, `tests/contract/stage-order-and-host-interaction.test.mjs`; symbols/regions: instructions and contract assertions only; no new public command or material.
- **输出**：GREEN stdout、interaction contract facts、host evidence requirements和未覆盖限制。
- **Knowledge**：P1 只验证 WorkflowHub 接收的真实事实；bridge 不启动 Agent、不猜用户回复。
- **verification_role**：GREEN
- **paired_task**：T101
- **gate_cmd**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P1-INTERACTION` — batch、后果/风险/推荐、matching reply、resume、direction return 和 steps order 全部通过，wrong/missing reply 仍失败。
- **evidence_path**：`quality/tests/p1-interaction-green.json`
- **STOP**：若需要降低 lifecycle 校验、把 missing reply 当完成、修改既有 steps order或新增第五材料，停止并回到 P1。
- **recovery**：只回滚 T102 当前 skill/test 改动，保留 T101 RED 和原始质量事实。
- **task risk**：文档绿但真实 host 仍一次一问；必须把 host dependency 保持为未证明事实。
- **test tier / test method**：fullstack-slice-testing / 与 T101 完全相同的 Vitest 命令和 fixtures。
- **scenarios / commands / expected exit / oracle**：与 T101 完全相同；本命令 expected exit 0，负例仍由 oracle 检查。
- **fixtures_services**：与 T101 相同；不启动 provider/外部 broker。
- **coverage limits**：本地测试不证明外部 Stage Agent host 的实际 UI/会话实现；host smoke receipt 缺失、unavailable 或 reply 不匹配时，T102 可以有本地 GREEN，但 P1 的真实交互质量结论仍保持 incomplete；该事实不阻止同任务继续修复或进入后续验收。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：补充 `workflows/make-decision/SKILL.md` 的 Talk round 1/2/3 独立 `ask -> wait -> user reply -> resume -> re-rank` 绑定；新增 `tests/contract/stage-order-and-host-interaction.test.mjs`；不改 steps.json/public runtime。
- **executed_commands**：RED/GREEN/current replay 均执行 `npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED exit=1，GREEN/current replay exit=0、31 tests；`git diff --check` exit=0。
- **evidence_refs**：`quality/tests/p1-interaction-red.json`、`quality/tests/p1-interaction-green.json`、`quality/tests/p1-run-tests.json`、`quality/tests/p1-fullstack-slice.json`、`quality/tests/p1-diff-scan.json`。
- **covered_ac**：AC-SEQ-001、AC-HAND-017、AC-INT-001、AC-INT-002、AC-INT-003、AC-INT-004；本地合同已覆盖，真实 host seam 仍 unavailable。
- **review_fact**：`available` 但 group=`partial` — P1 phase review 已按当前 config 只执行一轮，并等待全部已派发 provider 终态；`codex/luna` 返回 semantic result，`kimi/coding` 明确失败 `ATTACHMENT_DELIVERY_UNSUPPORTED`，没有自动重试。当前 snapshot=`8221af045d5498540443dbc956a836fbd55e57ba`，material=`692c1752be667f6c3c5ada29b483f54b7aed71625a19bab1790d0f2198d2ce8d`。result：`quality/reviews/results/build-code-default-8221af045d5498540443dbc956a836fbd55e57ba-c36aa432-d557-4b56-8e30-ac617b0471a1.json`（sha256=`6b395afbd1b2433e069eb85502dd0b052d7710cfe675abf57b67bb6c6fe32402`）；attempt：`quality/reviews/attempts/c36aa432-d557-4b56-8e30-ac617b0471a1/attempt.json`（sha256=`9d9d3e18e47c3add5f7fe2186f85d879d4a8b240e02012921cb19977fcb0e908`）；report：`quality/reviews/reports/c36aa432-d557-4b56-8e30-ac617b0471a1.md`（sha256=`4a708f222491b4a6330583ad119b3bb9de0d7dcf1133e7306cc7777597ff98f0`）。Codex 返回 2 个 major，但均因不在 P1 当前可认证变更锚点而被 `invalid_anchor/rejected_invalid`，canonical findings=`[]`，valid serious findings=0；这只证明本轮没有可采纳的严重 finding，不代表真实 host seam 已完成。
- **completed_at**：2026-08-19
- **执行事实**：
  - 已实际检查 changed_files：`workflows/make-decision/SKILL.md`、`tests/contract/stage-order-and-host-interaction.test.mjs`、`quality/tests/p1-interaction-red.json`、`quality/tests/p1-interaction-green.json`、`quality/tests/p1-run-tests.json`、`quality/tests/p1-fullstack-slice.json`、`quality/tests/p1-diff-scan.json`。
  - test-routing-advisor v1.0.0：原计划 `fullstack-slice-testing`；实际重判仍为 `fullstack`，未 reroute，理由是 workflow skill + host-facing contract + test/evidence 跨边界，不能用更窄层级证明。
  - advisor 输出：`{"routing_tier":"fullstack","result":"pass"}`；advisor 不执行测试、不授予完成许可。
  - `fullstack-slice-testing` v1.0.0 已执行；本地合同 GREEN，但真实 Stage Agent host/user reply 未附着，`quality/tests/p1-fullstack-slice.json` 保留 `unavailable`，不把该缺口改写成 pass。
  - `run-tests` 当前快照重放：4 个文件、31 tests、exit=0；`scan-diff`：exit=0，无 whitespace 错误，P1 未修改 `steps.json` 或 public runtime。
  - P1 phase review：一次配置驱动的 `wh-review` 已结束并通过当前 review/result 绑定；`codex/luna` 提供 semantic result，`kimi/coding` 以 `ATTACHMENT_DELIVERY_UNSUPPORTED` 失败，全部 provider 已终态且没有自动重试；两个 major 均因当前 P1 锚点无效而 rejected，valid serious findings=0。真实 Stage Agent host 仍 unavailable；保留 attempt/report 和失败事实，不把 host 缺口改写为 pass。

#### T103 — FINAL：P1 phase evidence aggregate

- **ID**：T103
- **Phase**：Phase P1 — 交互生命周期与阶段顺序
- **goal**：只记录 P1 当前快照的测试、AC coverage、host dependency、review fact 和 phase evidence。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001/R-002/R-003/R-006/R-007 → D-001/D-002/D-003/D-006/D-007
- **输入**：T102 GREEN facts、P1 test receipts、current config/material snapshot、外部 host status。
- **依赖**：T102
- **并行**：否 — aggregate reads P1 facts
- **FR**：FR-SEQ-001 FR-HAND-016 FR-INT-002 FR-INT-003
- **AC**：AC-SEQ-001 AC-HAND-017 AC-INT-001 AC-INT-002 AC-INT-003 AC-INT-004
- **动作**：只汇总 P1 的真实执行命令、exit、oracle、coverage limits、真实 host smoke receipt、review/unavailable 和 phase evidence；不创建状态 authority。新增 review card：`initial` 绑定 P1 snapshot/material/config，真实修复后才允许一次 `focused`，T103 只保留一次 phase aggregate；无变化或无终态 STOP。
- **精确文件**：`tests/contract/stage-order-and-host-interaction.test.mjs`
- **boundary**：files: `tests/contract/stage-order-and-host-interaction.test.mjs`; symbols/regions: phase aggregate evidence binding only; facts/index/verify remain existing stores.
- **输出**：`quality/tests/p1-aggregate.json`、`quality/evidence/phases/P1.json` 的设计目标和 tasks completion facts。
- **Knowledge**：下一 Phase 只消费 P1 的 hash-bound facts 和真实 host 缺口，不消费推测。
- **verification_role**：N/A — non-behavior phase evidence aggregation
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P1-FINAL` — T101/T102 facts、P1 AC coverage、phase evidence、host lifecycle receipt 和外部 host status 一致；host unavailable 不得被解释为 completed。
- **evidence_path**：`quality/tests/p1-aggregate.json`
- **STOP**：若 aggregate 省略失败事实、把 host unavailable 写成 pass、或生成新 projection，停止回 T103。
- **recovery**：只重建 P1 aggregate evidence binding；不重跑或覆盖原始 RED/GREEN receipt。
- **task risk**：聚合遗漏 coverage 或把事实摘要误当 completion verdict。
- **test tier / test method**：fullstack-slice-testing / 读取 P1 当前 receipts 的一次 aggregate。
- **scenarios / commands / expected exit / oracle**：同 P1 命令 expected exit 0；oracle 额外检查 facts 与 phase evidence hash binding。
- **fixtures_services**：P1 fixtures；无外部服务；保留 unavailable reason。
- **coverage limits**：aggregate 不替代真实 host 证据和后续 P2 review；缺 host receipt 时只产生 truthful incomplete，不产生 P1 completed。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：按 T103 只读汇总规则创建当前 P1 aggregate 和 phase evidence summary；补跑并认证 P1 声明的 4 files/31 tests 当前 GREEN receipt；保留真实 host unavailable 和历史 review snapshot stale，不创建新的状态 authority，不覆盖原始 RED/GREEN 或 review 事实。
- **executed_commands**：T101 RED exit=1；T102/current P1 gate 由 `node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code ...` 执行，4 files、31 tests、exit=0，receipt=`quality/tests/p1-interaction-current-after-repair-20260819.json`，receipt_sha256=`33bee53a386207604936d9b5026838ef9edfbe77f19b936822c8c182fea2cc16`，snapshot=`58cc5af6408139c71c7e2c612d5ea6470544ab6f`；P1 review 只保留既有一轮历史事实，当前 snapshot 不匹配，不自动复审；host bridge 仍为 `EXTERNAL_STAGE_AGENT_HOST_NOT_ATTACHED`。
- **evidence_refs**：`quality/tests/p1-aggregate.json`（sha256=`aa92f0f3ba68fcc0f1f149c4219e40c0e290785e9991d043a1881d9f6ae8fc1e`）、`quality/evidence/phases/P1.json`、`quality/tests/p1-interaction-current-after-repair-20260819.json`（sha256=`33bee53a386207604936d9b5026838ef9edfbe77f19b936822c8c182fea2cc16`）、历史 review attempt/result/report refs（均保留原 hash，当前 review status=`unavailable`、reason=`REVIEW_SNAPSHOT_STALE`）。
- **covered_ac**：AC-SEQ-001、AC-HAND-017、AC-INT-001、AC-INT-002、AC-INT-003、AC-INT-004；本地测试覆盖，真实 host 和可信 review 仍未闭合。
- **review_fact**：继承 T102 的一轮历史 review 事实；其 review snapshot=`8221af045d5498540443dbc956a836fbd55e57ba`，当前 P1 snapshot=`58cc5af6408139c71c7e2c612d5ea6470544ab6f`，因此当前 review 标为 `unavailable/stale`，不把历史 findings 或空 findings 当作当前 clean，也不产生第二次 review。
- **completed_at**：2026-08-19T13:49:39+08:00 — T103 aggregate 记录完成；P1 质量结论仍 incomplete
- **执行事实**：T101 RED exit=1、T102/current GREEN exit=0（31 tests）；current canonical phase receipt exit=0；host=`EXTERNAL_STAGE_AGENT_HOST_NOT_ATTACHED`；历史 review provider terminal=2、但其 snapshot 已 stale，当前 review=`unavailable/stale`，不宣称当前 P1 clean；P1 的真实交互质量仍不标记 completed，但 host unavailable 不再作为进入或继续 `verify-code` 的门槛。
  - **宿主诊断（2026-08-19）**：当前任务没有注入或附着可认证的通用 Stage Agent host invocation，因此无法产生真实 host smoke。该事实属于当前执行环境缺少宿主绑定，不是 WorkflowHub/provider 失败；继续保留 host unavailable，不生成 synthetic reply 或 outcome。

### Verify

- **Target**：FR-SEQ-001、FR-HAND-016、FR-INT-002/003；AC-SEQ-001、AC-HAND-017、AC-INT-001~004；P1 interaction/host seam。
- **gate_cmd**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：T101 为 1，T102/T103 为 0。
- **evidence_path**：`quality/tests/p1-interaction-{red,green}.json`、`quality/evidence/phases/P1.json`
- **Oracle**：`ORACLE-P1-INTERACTION` 和 `ORACLE-P1-FINAL`。

### Knowledge

P1 交给 P2 的是当前 interaction/steps contract、真实 host evidence 要求和未解决外部 host 状态；不交付用户推测答案。

### STOP

宿主没有真实 reply、执行顺序来自第二套文档、出现新公共交互控制面或需要改产品方向时，回到 make-decision/build-spec owning material。

### Done

T101/T102/T103 的测试和 task completion facts 已绑定当前 snapshot；P1 review fact、failure/unavailable、AC coverage 和 phase evidence 均已写入既有 quality store。

### Risks and rollback

外部 host 未执行时保持 incomplete；回滚 P1 当前文件字节，保留原始 interaction evidence 和 task facts。

## Phase P2 — 多 provider 单组审查与方向盲审

### Goal

一次 public group 派发当前 config 的全部 provider，每 provider 一次；等待所有 dispatched provider terminal 后再聚合，方向内部顺序在同一 request 完成。

### Files

- **NEW**：N/A — reuse existing review runner/test files; no new runtime authority
- **MODIFY**：`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`
- **DO NOT TOUCH**：`runtime/review/canonical-review-result.mjs`；现有 canonical provider facts 和 quorum semantics 先复用。

### Tasks

#### T201 — RED：单组、全终态和方向 reveal 回归

- **ID**：T201
- **Phase**：Phase P2 — 多 provider 单组审查与方向盲审
- **goal**：暴露 direction 两次 public group、早 quorum、provider route 不全、preflight dispatch 或 failure/empty findings 混淆。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：R-004/F-014/D-004/D-008/D-011/D-012/G-006 → FR/AC；P2 route identity follows plan DEC-007。
- **输入**：当前 WorkflowHub route/profile snapshot、external provider config、review runner、provider client v3 和现有 direction tests。
- **依赖**：T103
- **并行**：否 — P2 依赖 P1 handoff
- **FR**：FR-REV-004 FR-REV-005 FR-REV-006 FR-REV-007 FR-REV-010 FR-REV-012 FR-REV-013 FR-RACE-015
- **AC**：AC-REV-004 AC-REV-005 AC-REV-006 AC-REV-007 AC-REV-010 AC-REV-012 AC-REV-013 AC-REV-014 AC-RACE-016
- **动作**：增加失败测试，精确断言每 provider 一次 request、direction 只有一次 group、全终态后聚合、缺失外部 `pi/k3.source_id` 不阻断 WorkflowHub profile selection；同时断言 route/profile/provider/model/config snapshot tuple 错绑时 preflight 失败且 provider call 数为零，broker result identity 错绑仍 fail-loud，失败事实保留；不改生产实现。
- **精确文件**：`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`
- **boundary**：files: `skills/wh-review/SKILL.md`, `skills/wh-review/scripts/review-runner.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/review-materials.mjs`, `skills/wh-review/contracts/make-decision.md`, `skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`, `skills/wh-review/scripts/__tests__/review-runner.test.mjs`, `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`, `skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`; symbols/regions: direction planning, source identity normalization, reviewGroup/runReviewOnce, material selection, and test doubles only.
- **输出**：P2 RED stdout、provider call trace、terminal set、dispatch count、requested profile map 和 provenance gaps。
- **Knowledge**：当前 build-plan route 不能从旧 decision-log 推断；必须以 config snapshot 为准。
- **verification_role**：RED
- **paired_task**：T202
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P2-GROUP` — call count、provider identity、terminal gate、failure classification 或 internal reveal 顺序至少一项失败。
- **evidence_path**：`quality/tests/p2-review-red.json`
- **STOP**：若 RED 需要真实 provider token、使用旧 config、把 retry 当正式 review 或无法区分 transport failure 与 findings，停止。
- **recovery**：保留 test double trace；只恢复 P2 RED fixtures，不删除旧 review facts。
- **task risk**：用单 provider 通过掩盖配置的多 provider 要求，或把 `{findings:[]}` 当整体 pass。
- **test tier / test method**：fullstack-slice-testing / Vitest runner/client contract with provider doubles。
- **scenarios / commands / expected exit / oracle**：direction group、detail group、缺失外部 source_id 仍可按 profile key selection、profile/config tuple mismatch zero-dispatch、result identity 错绑、preflight material/route failure、one completed plus pending、failed member、empty findings、duplicate/replay；expected exit 1。
- **fixtures_services**：现有 provider client fakes；不连接真实 provider；清理临时 packet/task roots。
- **coverage limits**：不证明外部 broker liveness；只证明 WorkflowHub public group contract 和事实聚合。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：只执行 T201 RED；未改生产实现。临时 baseline 暴露 5 个失败断言：direction public request/call count、group deadline 字段、缺失外部 raw `source_id` 的两条 dispatch 断言。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；隔离 baseline exit=1，4 files，89 tests，5 failed / 84 passed。
- **evidence_refs**：`quality/tests/p2-review-red.json`（canonical sha256=`9c456997d3dd97d3502c8f62da9b40786931fe6aca1e559586c5c29e174cb756`；仍标注为 RED fact，不冒充 GREEN receipt）。
- **covered_ac**：AC-REV-004、AC-REV-005、AC-REV-006、AC-REV-007、AC-REV-010、AC-REV-012、AC-REV-013、AC-REV-014、AC-RACE-016 的失败面已被 RED 暴露；GREEN/最终事实由 T202/T203 绑定。
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-08-19 — RED fact canonicalized; GREEN/phase completion remains separately recorded by T202/T203
- **执行事实**：RED 只使用 provider doubles 和隔离 baseline，不连接真实 provider；canonical 记录保留原始 exit=1 和 5 个失败断言，没有把 RED 当作 GREEN 或 provider pass。

#### T202 — GREEN：一次异源 group 与全终态聚合

- **ID**：T202
- **Phase**：Phase P2 — 多 provider 单组审查与方向盲审
- **goal**：让 T201 同一命令通过：一次 public group，所有配置 provider 一次调用，全部 terminal 后应用 minimum=1，direction 内部完成 reconstruct/reveal/challenge。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：与 T201 相同：R-004/F-014/D-004/D-008/D-011/D-012/G-006；P2 route identity follows plan DEC-007。
- **输入**：T201 RED trace、WorkflowHub route/profile selector、existing review result v3 and canonical aggregation。
- **依赖**：T201
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-004 FR-REV-005 FR-REV-006 FR-REV-007 FR-REV-010 FR-REV-012 FR-REV-013 FR-RACE-015
- **AC**：AC-REV-004 AC-REV-005 AC-REV-006 AC-REV-007 AC-REV-010 AC-REV-012 AC-REV-013 AC-REV-014 AC-RACE-016
- **动作**：合并 direction public requests 为一个 broker-owned `direction-review.v1` packet；按 WorkflowHub route/profile/config snapshot 建立一次 group identity，不要求外部 raw `source_id` 才能 dispatch；等待 broker 返回全部 dispatched provider terminal；保留 broker provider/source identity、failed/unavailable/empty findings；不自动 retry；integration material 选择支持 namespaced AC。packet 必须包含 `public_request_count=1`、`steps=[reconstruct,reveal,challenge]`、reconstruct 可见字段、reveal 边界、challenge 输入和最终输出顺序；不支持该协议时 fail-loud，不退回第二次请求。
- **精确文件**：`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`
- **boundary**：files: `skills/wh-review/SKILL.md`, `skills/wh-review/scripts/review-runner.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/review-materials.mjs`, `skills/wh-review/contracts/make-decision.md`, `skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`, `skills/wh-review/scripts/__tests__/review-runner.test.mjs`, `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`, `skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`; symbols/regions: one-group direction plan, source identity normalization, provider call/terminal aggregation, material AC selection, and corresponding tests only.
- **输出**：P2 GREEN review facts、config/group/semantic hashes、requested profile map、profile/config preflight facts、broker identity/provenance map、provider terminal map、direction packet/order facts、真实 v3 group attempt/result/report refs 和 finding disposition inputs。
- **Knowledge**：minimum=1 只表示至少一个有效异源结果；不改变等待全部 provider 终态和 failure visibility。
- **verification_role**：GREEN
- **paired_task**：T201
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P2-GROUP` — 每 provider 一次 public request；all terminal 后才聚合；direction `request_count=1`、`public_request_count=1` 且内部顺序/reveal boundary 完整；profile preflight failure 为 zero dispatch；failure/empty/unavailable 不互相改写。
- **evidence_path**：`quality/tests/p2-review-green.json`
- **STOP**：若需要额外同范围 review、提前 quorum、硬编码 provider、删除 failed member 或新增 review-loop/recovery 状态，停止。
- **recovery**：回滚当前 runner/material/protocol/test bytes；保留 T201/T202 raw facts 和 provider diagnostics。
- **task risk**：一次 group 仍被 broker 内部 retry 变成多次正式审查，或方向 packet 没有真正的 reveal boundary；P3 external broker owner 必须继续验证公开 retry/provenance。
- **test tier / test method**：fullstack-slice-testing / 与 T201 同一命令和 oracle。
- **scenarios / commands / expected exit / oracle**：与 T201 同一场景；expected exit 0，all terminal 和 one-call assertions 必须保留。
- **fixtures_services**：provider doubles、trusted config fixture、临时 packet roots；无真实 provider。
- **coverage limits**：本地 doubles 不证明 3rd-review 进程 liveness；真实 group smoke 必须消费当前 config/group/material identity 和 terminal map，外部 retry/timeout 由 P3 owner evidence 证明。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：已实现一次 public direction group、按 WorkflowHub profile/config tuple dispatch、等待全部 dispatched provider terminal、`minimum_heterologous=1` 下游判定和 `direction-review.v1` flow 校验；未恢复外部 raw `source_id` preflight gate。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 0，4 files，89 tests；canonical current receipt 已重新绑定当前 snapshot。
- **evidence_refs**：`quality/tests/p2-review-current.json`（sha256=`b779cf1c2128f7490b139605653c06c76cde22a05d014f6c57f92489d2d6ecda`）、`quality/tests/p2-review-phase.json`（sha256=`a91ceaf31eb5059d937b56aa99208ca31706417b4fa676f70d25d2e00a50c12c`）。旧的 `quality/tests/p2-review-green.json` 只保留为历史 raw fact，不作为当前权威。
- **covered_ac**：AC-REV-004 AC-REV-005 AC-REV-006 AC-REV-007 AC-REV-010 AC-REV-012 AC-REV-013 AC-REV-014 AC-RACE-016
- **review_fact**：一次配置驱动的正式异源 group 已完成：profiles=`kimi/coding`,`codex/luna`，provider terminal=2/2，minimum=1，group outcome=`completed`，无 retry，`deadline_ms=null`；正式 attempt/result/report 由 T203 绑定。首次因 review material anchor 缺 `outside_diff_reason` 的 attempt 也保留在 T203 history，修正 packet 后只执行这一轮正式 provider group。
- **completed_at**：2026-08-18T20:30:30+08:00
- **执行事实**：test-routing-advisor 实际 reroute 为 `feature`；因 provider/broker protocol 跨边界，继续执行 `fullstack-slice-testing` 保留更强覆盖，未把 advisor 结果误写成测试许可。local 89 tests GREEN；external group 2 providers 均终态。P2 review 报告有 3 个 `major/invalid_anchor` 原始 cluster，逐个处置为 `rejected_invalid`，没有 actionable valid major/blocking finding；原始 provider output 不覆盖。

#### T203 — FINAL：P2 review evidence aggregate

- **ID**：T203
- **Phase**：Phase P2 — 多 provider 单组审查与方向盲审
- **goal**：只记录 P2 的 route snapshot、provider terminal map、group outcome、findings/dispositions 和 phase evidence。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：R-004/F-014/D-004/D-008/D-011/D-012
- **输入**：T202 GREEN facts、current config hash、review attempt/result refs、P2 test receipt。
- **依赖**：T202
- **并行**：否 — aggregate reads P2 facts
- **FR**：FR-REV-004 FR-REV-005 FR-REV-006 FR-REV-007 FR-REV-010 FR-REV-012 FR-REV-013 FR-RACE-015
- **AC**：AC-REV-004 AC-REV-005 AC-REV-006 AC-REV-007 AC-REV-010 AC-REV-012 AC-REV-013 AC-REV-014 AC-RACE-016
- **动作**：写入既有 quality/review/evidence refs 和 tasks completion facts；消费真实 v3 group attempt/result/report refs，校验 config/group/material/semantic identity、每 provider 一次调用、全部 terminal、direction packet order/reveal oracle；逐个写入 finding disposition（`fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human`）及其 owner/ref；不生成 second review projection，不把 review fact 变成 permit。
- **精确文件**：`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/review-runner.test.mjs`; symbols/regions: aggregate evidence assertions only; canonical writer remains existing consumer.
- **输出**：`quality/tests/p2-aggregate.json`、`quality/evidence/phases/P2.json` 设计目标、真实 group refs、direction packet/order facts、逐 finding disposition refs 和 P2 task evidence refs。
- **Knowledge**：P3 只消费 provider terminal/liveness boundary，不重跑 P2 正式 review。
- **verification_role**：N/A — non-behavior phase evidence aggregation
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P2-FINAL` — config/group/provider/finding facts 与 P2 snapshot 一致，真实 group 的 provider call/terminal map 完整，direction `public_request_count=1` 且 reveal boundary 可回指，所有 finding 都有 disposition；accepted_risk 缺 review/snapshot/user confirmation 时为 `needs_human`；失败和空 findings 保持可区分。
- **evidence_path**：`quality/tests/p2-aggregate.json`
- **STOP**：若 aggregate 发现非 terminal provider、route hash 漂移、重复 public request 或 quality fact 被当作 pass，停止。
- **recovery**：只重建 P2 aggregate binding，不覆盖原始 attempt/result。
- **task risk**：把 one valid result 误写成 all provider complete；必须保留其他 provider terminal status。
- **test tier / test method**：fullstack-slice-testing / P2 current-snapshot aggregate。
- **scenarios / commands / expected exit / oracle**：同 P2 命令 expected exit 0；oracle 绑定 route/group/semantic hashes。
- **fixtures_services**：P2 test doubles and canonical refs；真实 smoke 使用当次 config/登录态/外部 broker，未启动时记录 unavailable，不伪造。
- **coverage limits**：本地 doubles 不覆盖外部 process timeout/liveness；真实 v3 group evidence 只证明该次 route/group/material 的公开终态，15 分钟 liveness 见 P3 dependency。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：创建 P2 aggregate 和 `quality/evidence/phases/P2.json`，只汇总 route/config/provider terminal/group/result/report/finding disposition；不创建第二份 review projection 或推进许可证。
- **executed_commands**：读取 T201/T202 facts、canonical P2 test receipts、第一次 `MATERIAL_INCOMPLETE` attempt 和修正后的正式 group attempt/result/report；最终 phase capture 同一命令 exit=0，4 files，89 tests，snapshot=`ba652f800655cbf2ade647eba9bfdd9e8502798d`。
- **evidence_refs**：`quality/tests/p2-review-phase.json`（sha256=`a91ceaf31eb5059d937b56aa99208ca31706417b4fa676f70d25d2e00a50c12c`）、正式 review attempt/result/report refs 及 hashes见 aggregate；本地 aggregate/phase summary 只在候选工作树保留，未冒充 canonical task record。
- **covered_ac**：AC-REV-004、AC-REV-005、AC-REV-006、AC-REV-007、AC-REV-010、AC-REV-012、AC-REV-013、AC-REV-014、AC-RACE-016。
- **review_fact**：`available`；configured profiles=2，provider terminal=2，group outcome=`completed`，只执行一轮正式异源 group；3 个原始 major finding 均为 `invalid_anchor`，disposition 已逐个记录为 `rejected_invalid`，严重 actionable finding=0。F-3787 的 broker hidden projection 只保留为 verify-code coverage limit，不伪造已证明。
- **completed_at**：2026-08-18T20:30:30+08:00
- **执行事实**：T203 aggregate 与 phase evidence 已绑定同一 snapshot；P2 可把事实交给 P3，但不得把 P2 provider 质量结果写成全任务完成，也不覆盖 P1 的 host/review incomplete。

### Verify

- **Target**：FR-REV-004/005/006/007/010/012/013、FR-RACE-015；对应 AC-REV-004/005/006/007/010/012/013/014、AC-RACE-016。
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：T201 为 1，T202/T203 为 0。
- **evidence_path**：`quality/tests/p2-review-{red,green}.json`、`quality/evidence/phases/P2.json`
- **Oracle**：`ORACLE-P2-GROUP` 和 `ORACLE-P2-FINAL`。

### Knowledge

P2 交给 P3 的是 provider attempt/terminal/group contract 和当前 route snapshot；不交付 provider 质量 pass。

### STOP

任何 early quorum、自动复审、provider route hardcode 或 failure/empty findings 改写，都回到 P2 runner/protocol owning material。

### Done

P2 的一次 configured group 和所有 member terminal facts 已绑定；异源 review 只作为质量事实，未完成处置仍保留 needs_human/incomplete。

### Risks and rollback

保留每个 provider 原始 attempt/result；回滚只限 P2 runner/material/test 当前改动。

## Phase P3 — provider liveness 与无固定总时限

### Goal

WorkflowHub 不设置固定总审查时限；健康有进展继续，unverifiable 不直接失败，只有 busy 且 15 分钟无可验证进展才进入 stalled/unavailable。

### Files

- **NEW**：N/A — reuse external broker test/evidence stores
- **MODIFY**：`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/process.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/adapters/kimi.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/health-runner.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/process.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/kimi-wire.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/broker.test.mjs`、`/Users/Hugh/.config/3rd-review/config.json`
- **PRESERVE**：外部仓库其余用户已有 dirty hunks；本任务只保留上述生命周期/协议/config 变更，不执行 reset、checkout 或覆盖。

### Tasks

#### T301 — RED：deadline/liveness 协议回归

- **ID**：T301
- **Phase**：Phase P3 — provider liveness 与无固定总时限
- **goal**：暴露 WorkflowHub positive deadline、把 unverifiable 直接失败、timeout 自动 retry 或把 stalled 当正常空结果。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：F-013/F-015/D-010/D-011/D-012 → FR/AC
- **输入**：P2 terminal group contract、provider result v3、当前 client/CLI tests、外部 broker protocol。
- **依赖**：T203
- **并行**：否 — P3 依赖 P2 group semantics
- **FR**：FR-REV-007 FR-REV-008 FR-REV-009 FR-REV-010 FR-REV-011 FR-REV-013
- **AC**：AC-REV-007 AC-REV-008 AC-REV-009 AC-REV-010 AC-REV-011 AC-REV-014
- **动作**：保留固定总时限、隐式 Kimi 总时限和 timeout retry 的历史 RED 事实；GREEN 由 T302 收紧协议和外部 lifecycle 实现，不把失败改写为空 findings。
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/contracts/provider-protocol.md`, `skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`, `skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`; symbols/regions: deadline/liveness fields and protocol assertions only; no external repo.
- **输出**：P3 RED stdout、deadline value、status transition、retry count、external dependency status。
- **Knowledge**：15 分钟是 external idle-progress condition，不是 WorkflowHub wall-clock deadline。
- **verification_role**：RED
- **paired_task**：T302
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P3-LIVENESS` — positive deadline、unverifiable early failure、unjustified retry 或 incorrect stalled classification 被断言失败。
- **evidence_path**：`quality/tests/p3-liveness-red.json`
- **STOP**：若测试必须修改外部 dirty repo、依赖不可复现 token、或把 15 分钟改成 total timeout，停止。
- **recovery**：保留 external dependency fact 和本地 RED output，只恢复 P3 tests/protocol fixture。
- **task risk**：为了让本地测试绿而隐藏外部 broker 当前 `PROCESS_TIMEOUT`。
- **test tier / test method**：fullstack-slice-testing / provider protocol and CLI contract with lifecycle doubles。
- **scenarios / commands / expected exit / oracle**：healthy progress beyond minutes、unverifiable、busy no progress、confirmed-dead、timeout diagnostic、no auto retry；expected exit 1。
- **fixtures_services**：本地 provider result v3/CLI fixtures；不启动外部 broker；保留外部 dirty status。
- **coverage limits**：不能替代 3rd-review broker 的真实 process/health tests。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：N/A — RED fact is retained in `quality/tests/p3-liveness-red.json`; no new P3 RED execution was performed in this phase.
- **executed_commands**：N/A — not re-run; the existing P3 RED fact remains the historical input for T302/T303.
- **evidence_refs**：`quality/tests/p3-liveness-red.json`（canonical sha256=`ee03fb3cede39701b38f37f951ebe585f7d1639b92eaa1d3aa89d6a51eed9be1`；仍标注为 RED fact，不冒充 GREEN receipt）
- **covered_ac**：AC-REV-007 AC-REV-008 AC-REV-009 AC-REV-010 AC-REV-011 AC-REV-014（失败面由既有 RED fact 暴露，完成状态由 T302/T303 事实决定）
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：2026-08-19 — RED fact canonicalized; external liveness completion remains separately limited by T303
- **执行事实**：保留既有 P3 RED 与外部依赖事实；本轮没有重复执行 provider 或重放同一 RED；canonical 记录仍保持原始 44-test/3-failure RED 事实。

#### T302 — GREEN：无总时限与 15 分钟无进展合同

- **ID**：T302
- **Phase**：Phase P3 — provider liveness 与无固定总时限
- **goal**：让 T301 同一命令通过，WorkflowHub 不设置 wall-clock deadline，只传播真实 broker liveness/terminal facts。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：与 T301 相同：F-013/F-015/D-010/D-011/D-012
- **输入**：T301 RED trace、现有 client/result v3 fields、external broker protocol ownership。
- **依赖**：T301
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-007 FR-REV-008 FR-REV-009 FR-REV-010 FR-REV-011 FR-REV-013
- **AC**：AC-REV-007 AC-REV-008 AC-REV-009 AC-REV-010 AC-REV-011 AC-REV-014
- **动作**：使 `deadline_ms` 默认/发送为 `null`；配置层拒绝重新启用正数 deadline；保留 alive/unverifiable/confirmed-dead 区分；只接受外部 busy+15m no-progress 的 `PROCESS_STALLED/unavailable`；禁止 `single_round`/`full_only` 自动 retry 或把 failure 改成 empty findings。
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/process.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/adapters/kimi.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/health-runner.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/process.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/kimi-wire.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/broker.test.mjs`、`/Users/Hugh/.config/3rd-review/config.json`
- **boundary**：files: `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/contracts/provider-protocol.md`, `skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`, `skills/wh-review/scripts/__tests__/review-runner.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`, `skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`, `/Users/Hugh/Hugh/Project/3rd-review/lib/process.mjs`, `/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs`, `/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs`, `/Users/Hugh/Hugh/Project/3rd-review/lib/adapters/kimi.mjs`, `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`, `/Users/Hugh/Hugh/Project/3rd-review/test/health-runner.test.mjs`, `/Users/Hugh/Hugh/Project/3rd-review/test/process.test.mjs`, `/Users/Hugh/Hugh/Project/3rd-review/test/kimi-wire.test.mjs`, `/Users/Hugh/Hugh/Project/3rd-review/test/broker.test.mjs`, `/Users/Hugh/.config/3rd-review/config.json`; symbols/regions: deadline serialization, health no-progress classification, direction flow/retry guard, config validation and corresponding tests only; external other dirty hunks stay unchanged.
- **输出**：P3 GREEN protocol facts、liveness transition matrix、external broker proof requirement。
- **Knowledge**：外部 broker 仍必须自行停止 confirmed-dead/15m stalled；WorkflowHub 不拥有进程树。当前定向回归已通过，但外部 worktree 未提交，仍是 dependency caveat。
- **verification_role**：GREEN
- **paired_task**：T301
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P3-LIVENESS` — healthy progress continues; unverifiable waits; only explicit busy/no-progress produces stalled; confirmed-dead retains diagnostics/cleanup; no automatic same-review retry.
- **evidence_path**：`quality/tests/p3-liveness-phase.json`
- **STOP**：若外部 broker evidence 仍显示 fixed wall-clock timeout 或 retry，保持 P3 incomplete，不报告全链路完成。
- **recovery**：回滚本地 protocol/client/tests；保留 external broker failure facts and original result refs。
- **task risk**：本地 null 只证明发送方；外部 config validator、Kimi wire 和 health/process/broker 定向回归共同证明当前实现，但未提交 worktree 仍不能等同发布。
- **test tier / test method**：fullstack-slice-testing / 与 T301 完全相同的命令和 oracle。
- **scenarios / commands / expected exit / oracle**：与 T301 相同；expected exit 0，外部缺失状态不被隐藏。
- **fixtures_services**：本地 lifecycle doubles；外部 broker 由独立 owner 运行和清理。
- **coverage limits**：不把 WorkflowHub test 当 3rd-review process/health proof。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：先用 focused RED 暴露正数 `deadline_ms` 可被接受、`progressing/retry` 误触发 stalled；随后将 public v3 deadline 收紧为 `null`，并只让明确 `busy` 参与无进展判断。
- **executed_commands**：WorkflowHub P3 GREEN exit 0，3 files，45 tests；3rd-review 定向 exit 0，82 tests；3rd-review 全量 `npm test` exit 0，308 tests。
- **evidence_refs**：`quality/tests/p3-liveness-current-repair.json`（sha256=`e3aa0b849f8fcdee3bedf4d35eb74c187dcd02ee9ca04a944d7efdf681f2c126`）、`quality/tests/p3-liveness-phase.json`（sha256=`8c3513c7a928d55e44ac2e12be5faa33f094aaee4931b47382b95a6e41b831e3`）
- **covered_ac**：AC-REV-007 AC-REV-008 AC-REV-009 AC-REV-010 AC-REV-011 AC-REV-014
- **review_fact**：focused review 一轮；配置 provider 两个均终态，kimi/coding failed、codex/luna completed，valid_provider_count=1，minimum=1；无 actionable valid major/blocking finding。
- **completed_at**：2026-08-18T21:01:40+08:00
- **执行事实**：失败 provider 保留为 terminal failure；标准路径无固定 provider deadline；外部 worktree dirty；健康 managed smoke 中 Codex 运行 118625ms、6 次 progress 后终态，Kimi failure 原样保留；另以真实 broker/health runner 运行受控无输出 child，15 分钟无可验证进展后收束为 `PROCESS_STALLED`，900000ms threshold、无 retry、终态后进程不存活。该受控 smoke 不是产品审查证据；外部 3rd-review 全量回归 308/308 覆盖 `unverifiable`、`PROCESS_DEAD`、`ORPHANED_BROKER` 和清理边界。

#### T303 — FINAL：P3 liveness evidence aggregate

- **ID**：T303
- **Phase**：Phase P3 — provider liveness 与无固定总时限
- **goal**：记录 P3 protocol facts、external broker owner/status、liveness evidence、attempt count 和 phase evidence。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：F-013/F-015/D-010/D-011/D-012
- **输入**：T302 facts、P3 receipts、external broker test/status/commit evidence。
- **依赖**：T302
- **并行**：否 — aggregate reads P3 facts
- **FR**：FR-REV-007 FR-REV-008 FR-REV-009 FR-REV-010 FR-REV-011 FR-REV-013
- **AC**：AC-REV-007 AC-REV-008 AC-REV-009 AC-REV-010 AC-REV-011 AC-REV-014
- **动作**：只绑定 local protocol facts 与 external lifecycle facts；外部 broker owner 必须产出脱敏、公开、hash-bound liveness receipt，至少包含 producer/commit-or-runtime、config_hash、group/material/attempt refs、provider attempt count、progress/cursor/session 时间线、健康 busy 状态、`PROCESS_STALLED` 或真实 terminal、显式 cancel/进程清理事实；T303 校验并消费该 receipt。缺 external evidence、receipt 过期或 hash/attempt 不匹配时写 unavailable/incomplete，不自动 retry、不生成 pass。
- **精确文件**：`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`; symbols/regions: P3 aggregate assertions only; external files remain read-only.
- **输出**：`quality/tests/p3-aggregate.json`、`quality/evidence/phases/P3.json` 及写入当前 task 既有 `quality/evidence/` 的 external dependency handoff；该 handoff 不是新的状态 authority，只是可验证事实引用。
- **Knowledge**：P4 需要把 external liveness 缺口作为 risk/STOP，不得让 tasks completion 覆盖。
- **verification_role**：N/A — non-behavior phase evidence aggregation
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P3-FINAL` — local deadline/liveness facts、external owner/status、attempt count、progress timeline、`PROCESS_STALLED`/terminal、cancel/cleanup 和 unavailable reason 一致；没有 receipt 时 AC-REV-008/009 仍是 incomplete。
- **evidence_path**：`quality/tests/p3-aggregate.json`
- **STOP**：若 aggregate 把 external unavailable 写成 complete、丢失 diagnostic 或发现 fixed timeout，停止。
- **recovery**：只重建 P3 evidence binding；不覆盖 external raw facts。
- **task risk**：跨仓 handoff 被误当作当前仓库的完成证据。
- **test tier / test method**：fullstack-slice-testing / P3 current-snapshot aggregate。
- **scenarios / commands / expected exit / oracle**：同 P3 命令 expected exit 0；external missing 仍是 truthful incomplete。
- **fixtures_services**：local fixtures；external owner 负责 broker process cleanup，并只回传脱敏 public receipt，不把 raw transcript、token、cookie 或 host path 写入 WorkflowHub。
- **coverage limits**：已绑定真实健康终态、真实 broker 15 分钟 stalled lifecycle 和 3rd-review 全量回归 receipts，可支持 AC-REV-008/009/014 的当前配置、收尾与 liveness 状态事实；本地 `deadline_ms:null` 只证明 WorkflowHub 发送方，受控 child smoke 和外部回归都不是产品审查质量证明。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：写入 P3 aggregate、phase evidence、provider terminal map、review findings disposition 和 external dependency caveat；新增健康终态、15 分钟 stalled lifecycle、3rd-review regression 三份脱敏 hash-bound receipts；不把生命周期事实改写成产品审查通过。
- **executed_commands**：消费 P3 canonical receipt、focused review attempt/result/report 和 external test/status facts；健康 managed `workflowhub-result.v2` smoke 使用 runtime=`3d95d4f9-f33f-41bf-838f-17eb5a8a371e`，等待两 provider 终态；另运行真实 broker/health runner 受控 stalled smoke，runtime=`069bf92d-717a-484b-9010-6da8749b709d`，实际等待 900000ms 无进展边界后终态；该 smoke 未评估产品审查内容，aggregate 本身不自动复审、不重试。
- **evidence_refs**：`quality/tests/p3-liveness-phase.json`（sha256=`8c3513c7a928d55e44ac2e12be5faa33f094aaee4931b47382b95a6e41b831e3`）、`quality/tests/p3-liveness-current-repair.json`（sha256=`e3aa0b849f8fcdee3bedf4d35eb74c187dcd02ee9ca04a944d7efdf681f2c126`）、`quality/evidence/external-p3-liveness-smoke-20260819.json`（sha256=`84ef49982572a9afd7478092f7bb19de4806fccf3723c45bad09904d1392e401`）、`quality/evidence/external-p3-stalled-smoke-20260819.json`（sha256=`6aecfb3ec03b3d0cc21672187194765fdd25ec1aa7c0dcdbb183f740050f0e69`）、`quality/evidence/external-p3-regression-20260819.json`（sha256=`0277f572e367463e26d863495bd846749a84da61c3916c51f72a089940dc3a7c`）；P3 aggregate/phase summary 只在候选工作树保留，未冒充 canonical task record。
- **covered_ac**：AC-REV-007 AC-REV-008 AC-REV-009 AC-REV-010 AC-REV-011 AC-REV-014
- **review_fact**：P3 focused review 已完成；2 个 major 均为 invalid_anchor，均 rejected_invalid，保留为 verify-code coverage limit；phase aggregate status=incomplete。
- **completed_at**：2026-08-18T21:01:40+08:00
- **执行事实**：已等全部 configured provider 终态；健康 smoke 中一项有效结果满足 minimum=1，允许下游，但不隐藏 Kimi failure；Codex 运行 118625ms、6 次 progress、无 retry，terminal cleanup 后进程不存活；独立受控 stalled smoke 在 900000ms 无进展阈值后输出 `PROCESS_STALLED`、无 retry、进程清理完成；3rd-review 全量回归 308/308，覆盖 `unverifiable`、`PROCESS_DEAD`、`ORPHANED_BROKER` 和健康进程不误杀；没有自动复审。P3 lifecycle contract 已完成，外部 worktree dirty 仍作为 dependency caveat。

### Verify

- **Target**：FR-REV-007/008/009/010/011/013；AC-REV-007/008/009/010/011/014。
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：T301 为 1，T302/T303 为 0；external proof 缺失则质量状态 incomplete。
- **evidence_path**：`quality/tests/p3-liveness-{red,green}.json`、`quality/evidence/phases/P3.json`
- **Oracle**：`ORACLE-P3-LIVENESS` 和 `ORACLE-P3-FINAL`。

### Knowledge

P3 交给 P4 的是 deadline/liveness protocol 和跨仓 dependency 状态；不交付假的 broker completion。

### STOP

外部 broker 当前 dirty、固定 deadline、自动 retry 或无法提供 progress/session 事实时，回到 P3 owning protocol，保持 incomplete。

### Done

P3 的 local protocol facts 和 external owner handoff 已写入；只有两者都真实可认证才可报告 liveness behavior 已完成。

### Risks and rollback

外部仓库不修改；回滚 local protocol/client/test，保留 external diagnostics 和 unavailable status。

## Phase P4 — Phase 设计、任务完成和证据交接

### Goal

用同一份 plan/tasks 设计每个 Phase 的任务、环境、测试、STOP、Done 和证据；运行时校验所有 FR/AC、RED/GREEN、task completion 和既有 evidence bindings。

### Files

- **NEW**：N/A — reuse existing task/evidence stores
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-completion.test.mjs`
- **DO NOT TOUCH**：`runtime/task/task-store.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`；它们是现有 evidence consumer。

### Tasks

#### T401 — RED：Phase 设计与证据闭环回归

- **ID**：T401
- **Phase**：Phase P4 — Phase 设计、任务完成和证据交接
- **goal**：暴露 plan/tasks 缺 Phase 设计/环境/测试/STOP/Done、复合 AC coverage 缺失、task completion 未绑定 evidence 或质量事实被当 permit。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：G-007/G-008/D-005/D-003/D-006 → FR/AC
- **输入**：P1-P3 phase facts、current plan/task templates、stage contract validators、现有 AC grammar regression。
- **依赖**：T303
- **并行**：否 — P4 depends on all prior design facts
- **FR**：FR-PLAN-010 FR-PLAN-011 FR-QUALITY-012 FR-SCOPE-013 FR-PERM-014
- **AC**：AC-PLAN-011 AC-PLAN-012 AC-EVID-012 AC-QUALITY-013 AC-SCOPE-014 AC-PERM-015
- **动作**：增加失败 fixtures，断言每 Phase 八字段、`environment_ready` 或明确 `not_applicable` 理由、实际测试命令/exit/oracle、task completion/evidence、FR/AC 双向 coverage、compound AC、逐 finding disposition 和 permission/quality separation；不改生产实现。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-completion.test.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/SKILL.md`, `skills/spec-tasks/templates/tasks-template.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tests/contract/phase-quality-handoff.test.mjs`, `tests/contract/filled-plan-task-production.test.mjs`, `tests/contract/spec-stage-artifact-closure.test.mjs`, `tests/contract/stage-completion.test.mjs`; symbols/regions: plan-task-v3, executable minimum, phase evidence, task completion, stage handoff and related fixtures only.
- **输出**：P4 RED stdout、missing field/coverage/evidence errors、current preflight AC grammar fact。
- **Knowledge**：AC parser bootstrap 已修复复合编号识别，但 build-code 仍需对完整 P4 contract 产生新 RED/GREEN evidence；不得把本次 preflight test 当完成事实。
- **verification_role**：RED
- **paired_task**：T402
- **gate_cmd**：`npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/stage-plan-task-contract.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P4-EVIDENCE` — 缺字段、未覆盖 AC、未认证 evidence、错误 permit 或阶段交接被明确拒绝。
- **evidence_path**：`quality/tests/p4-evidence-red.json`
- **STOP**：若只能伪造 completion fields、降低 validator、把现有 preflight green 当 RED/GREEN，停止并回到 P4 design。
- **recovery**：保留现有 AC grammar compatibility fact，恢复 P4 RED fixture/模板测试字节，不重写四份材料。
- **task risk**：把 plan-task validation 变成阻止同-task 修复的 gate；必须保持质量事实与推进资格分离。
- **test tier / test method**：fullstack-slice-testing / Vitest plan/task/evidence contract。
- **scenarios / commands / expected exit / oracle**：缺 Phase field、environment 未就绪、测试缺 exit/oracle 且无 not_applicable reason、compound AC、FR/AC omission、bad evidence hash、completed task missing facts、finding 无 disposition、accepted_risk 缺绑定、review unavailable、permission fallback；expected exit 1。
- **fixtures_services**：现有 plan/tasks fixtures、temporary task store；无外部 provider；清理临时 roots。
- **coverage limits**：不执行真实 build-code、provider、host 或 browser；只证明结构和 evidence binding contract。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在隔离 baseline 上加入 P4 namespaced AC grammar 回归断言，保留基线失败事实；未用伪造 completion 字段或降低 validator。
- **executed_commands**：`npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/stage-plan-task-contract.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 1，6 files，126 tests passed，1 target assertion failed。
- **evidence_refs**：`[{"ref":"quality/tests/p4-evidence-red.json","kind":"test_run","sha256":"3eceb5921f7d85c673164f2668b7004ef542da7718b2734005e87604a4bcc0d7"}]`
- **covered_ac**：AC-PLAN-011 AC-PLAN-012 AC-EVID-012 AC-QUALITY-013 AC-SCOPE-014 AC-PERM-015
- **review_fact**：T401 的 RED 由 T402 同一命令 GREEN 配对验证；RED 只证明旧 validator 对复合 AC 的目标断言失败，不证明 provider、host 或 browser 可用。
- **completed_at**：2026-08-18T13:09:56Z
- **执行事实**：隔离 baseline 缺 `node_modules` 的环境问题已用候选工作树 symlink 修正后重放；provider dispatch 未启动，环境修正未改候选代码。

#### T402 — GREEN：Phase 设计与 evidence handoff contract

- **ID**：T402
- **Phase**：Phase P4 — Phase 设计、任务完成和证据交接
- **goal**：让 T401 同一命令通过，同时保持四份材料 authority、质量事实非 permit 和复合 AC traceability。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：与 T401 相同：G-007/G-008/D-005/D-003/D-006
- **输入**：T401 RED、既有 phase evidence v1、facts/index/verify writers、当前 AC IDs。
- **依赖**：T401
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-PLAN-010 FR-PLAN-011 FR-QUALITY-012 FR-SCOPE-013 FR-PERM-014
- **AC**：AC-PLAN-011 AC-PLAN-012 AC-EVID-012 AC-QUALITY-013 AC-SCOPE-014 AC-PERM-015
- **动作**：扩展模板和 runtime validator/handler：每 Phase Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risks and rollback 非空；每个 Phase 的 `environment_ready` 必须有真实 evidence ref，或在 task 中有可核验的 `not_applicable` 理由；task 卡记录实际 test command/exit/oracle、coverage/final evidence；AC grammar 统一并按枚举 ID 集合校验 20 FR/24 AC；completed task 的 evidence refs 必须 hash-authenticated；每个 review finding 必须有 disposition，`accepted_risk` 必须绑定 finding/review/snapshot/user confirmation，否则自动成为 `needs_human`；不增加新 authority。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-completion.test.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/SKILL.md`, `skills/spec-tasks/templates/tasks-template.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tests/contract/phase-quality-handoff.test.mjs`, `tests/contract/filled-plan-task-production.test.mjs`, `tests/contract/spec-stage-artifact-closure.test.mjs`, `tests/contract/stage-completion.test.mjs`; symbols/regions: same as T401; no new file-based authority or public command.
- **输出**：P4 GREEN contract facts、phase/task evidence binding rules、AC/FR coverage map 和 truthful incomplete rules。
- **Knowledge**：quality/test/review/history remain facts; current four materials and task completion fields are the only handoff source。
- **verification_role**：GREEN
- **paired_task**：T401
- **gate_cmd**：`npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/stage-plan-task-contract.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P4-EVIDENCE` — 20 FR/24 AC 枚举 coverage、phase fields/environment、RED/GREEN 或 not_applicable、completion evidence、task scope、逐 finding disposition、constitution 和 permission facts pass without turning quality facts into permits；任何 quality gap/unavailable 仍保持 incomplete。
- **evidence_path**：`quality/tests/p4-evidence-green.json`
- **STOP**：若需要第五 material、selector/recovery/continuation state、假 evidence、skip RED 或降低后续 stage quality，停止。
- **recovery**：回滚当前 templates/validator/handler/skill/test 改动；保留 T401 failure facts 和此前 AC preflight diagnosis。
- **task risk**：完成区字段被当作第二任务状态机；只允许既有 tasks completion seam 和 canonical evidence refs。
- **test tier / test method**：fullstack-slice-testing / 与 T401 完全相同的命令和 oracle。
- **scenarios / commands / expected exit / oracle**：与 T401 相同；expected exit 0，unknown/unavailable/incomplete 负例必须保持可见。
- **fixtures_services**：现有 task/evidence fixtures；无外部 service；清理临时 task roots。
- **coverage limits**：不替代真实 implementation/test/review/provider/host evidence；只完成 plan/task/evidence contract。真实 host/broker evidence 缺失时 validator 只能报告 incomplete，不能把结构 GREEN 当阶段完成。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：已实现并验证 Phase/Task/证据交接合同、FR/AC 枚举覆盖、完成区 hash 认证和 skill bundle closure 校验。
- **executed_commands**：`npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/stage-plan-task-contract.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 0，6 files，127 tests；canonical receipt `quality/tests/p4-evidence-current.json` hash `ca01c2e73a3c40d5d0495e0e3e3850533732567c2e4cbf79bbf565ebd979da2f`。
- **evidence_refs**：`quality/tests/p4-evidence-current.json`（sha256=`ca01c2e73a3c40d5d0495e0e3e3850533732567c2e4cbf79bbf565ebd979da2f`）；`quality/tests/p4-evidence-green.json` 仅为候选工作树的派生事实，未冒充 canonical task record。
- **covered_ac**：AC-PLAN-011 AC-PLAN-012 AC-EVID-012 AC-QUALITY-013 AC-SCOPE-014 AC-PERM-015
- **review_fact**：P4 初始 review attempt `33dae970-81ed-4b2e-8423-07c980135728` 的可行动测试范围 finding 已由 T403 全量 aggregate 修复；其两个 invalid-anchor finding 已 `rejected_invalid`。针对当前 aggregate 的 focused review `576b3052-1fff-45a5-ad36-37bab963dbca` 没有 valid findings；其中两个 invalid-anchor finding 已 `rejected_invalid`。两轮均按配置各 provider 一次、无 retry、无 deadline；Kimi 失败事实保留。
- **completed_at**：2026-08-18T21:14:17+08:00
- **执行事实**：结构、证据绑定、权限边界和复合 AC 测试通过；P4 review 有 1 个有效 provider 结果、Kimi 为 `ATTACHMENT_DELIVERY_UNSUPPORTED`，因此质量事实仍是 partial/incomplete，不把 GREEN 写成全任务完成。

#### T403 — FINAL：P4 与全任务 current-snapshot aggregate

- **ID**：T403
- **Phase**：Phase P4 — Phase 设计、任务完成和证据交接
- **goal**：只运行一次最终 current-snapshot aggregate，汇总 P1-P4 的 task completion、测试、AC coverage、review facts、phase evidence 和外部依赖限制。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"70be9d926b23c04d5c22ee92361a4817a5090f06d065aae4ebe5ebf7b830effa","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001~R-007、F-013~F-015、G-007/G-008、D-001~D-012
- **输入**：T103/T203/T303/T402 facts、current tasks completion seam、final test route、current config snapshot、external dependency facts。
- **依赖**：T402
- **并行**：否 — final aggregate reads all preceding phases
- **FR**：FR-SEQ-001 FR-HAND-016 FR-INT-002 FR-INT-003 FR-REV-004 FR-REV-005 FR-REV-006 FR-REV-007 FR-REV-008 FR-REV-009 FR-REV-010 FR-REV-011 FR-REV-012 FR-REV-013 FR-RACE-015 FR-PLAN-010 FR-PLAN-011 FR-QUALITY-012 FR-SCOPE-013 FR-PERM-014
- **AC**：AC-SEQ-001 AC-HAND-017 AC-INT-001 AC-INT-002 AC-INT-003 AC-INT-004 AC-REV-004 AC-REV-005 AC-REV-006 AC-REV-007 AC-REV-008 AC-REV-009 AC-REV-010 AC-REV-011 AC-REV-012 AC-REV-013 AC-REV-014 AC-RACE-016 AC-PLAN-011 AC-PLAN-012 AC-EVID-012 AC-QUALITY-013 AC-SCOPE-014 AC-PERM-015
- **动作**：只执行一次最终 aggregate；保存真实 exit/oracle/coverage limits、每 provider/member terminal、external unavailable、phase evidence refs、每 Phase review card 和逐 finding disposition、tasks completion facts；不重跑 provider、不创建新 projection、不授权不可逆操作。
- **精确文件**：`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/stage-completion.test.mjs`
- **boundary**：files: `tests/contract/phase-quality-handoff.test.mjs`, `tests/contract/stage-completion.test.mjs`; symbols/regions: final aggregate assertions and evidence binding only; no new authority.
- **输出**：`quality/tests/final-current-snapshot.json`、`quality/evidence/phases/P1.json` 至 `P4.json`、既有 `quality/reviews/attempts|results|reports/` refs、`quality/verify.json`/`index.json` refs 和 truthful final handoff。
- **Knowledge**：verify-code 只读取当前四份材料和 canonical quality facts；external missing remains explicit.
- **verification_role**：N/A — non-behavior final aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/stage-plan-task-contract.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL` — current snapshot 的本地合同事实、20 FR/24 AC 枚举 coverage、每 Phase review card、逐 finding disposition 和 evidence binding 完整；外部 host/broker 缺失、provider partial、test unknown、route/material conflict 和 review unavailable 仍单独显示，不折叠为 pass。
- **evidence_path**：`quality/tests/final-current-snapshot.json`
- **STOP**：若任何 phase 缺真实 facts、AC coverage、terminal provider、external dependency status、current snapshot 或出现新决策，停止，不以旧 receipt 补齐。
- **recovery**：回到具体失败 Phase/task；最终 aggregate 只重做一次，不重复未变化的 provider review。
- **task risk**：用 aggregate 摘要覆盖原始 facts，或把 local green 当外部系统 ready。
- **test tier / test method**：fullstack-slice-testing / one final current-snapshot Vitest run。
- **scenarios / commands / expected exit / oracle**：全阶段顺序、交互、review、liveness、evidence、permission 和 failure boundaries；expected exit 0；oracle `ORACLE-FINAL`。
- **fixtures_services**：本地 fixtures；真实 provider/host/broker 不由 aggregate 伪造；清理责任归当前 test runner。
- **coverage limits**：不证明外部 3rd-review/host 已修复，不授权 merge/push/cleanup，不替代 verify-code 的独立 review。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：完成当前快照 aggregate；补齐 `quality/evidence/phases/P4.json`，刷新 `quality/tests/final-current-snapshot.json`；补录真实外部 broker healthy-terminal、15 分钟 stalled lifecycle 和 regression receipts，并保留 P1 host unavailable；修复 canonical receipt 路径、integration review 命令绑定、stage-runner review 状态投影、integration-review-subject 当前快照绑定、build-code phase receipt canonical provenance/output hash 校验、malformed current receipt 的 unavailable 归类，以及缺失/显式 `missing` integration test evidence 的 fail-loud 处理；新增对应回归测试；同步更新 review-runner 的 canonical fixture 与 wh-review bundle/catalog hash；没有新增 authority、selector、recovery 或 review projection；本次已用当前工作树和当前四份材料重新执行 T403 aggregate，作为 build-code 的最终本地检查完成。
- **executed_commands**：受影响回归 `npx vitest run tests/contract/review-materials-contract.test.mjs tests/contract/integration-review-subject.test.mjs skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，4 files，50/50，exit 0；`npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，60/60，exit 0；T403 原命令重新执行，16 files，268 tests，exit 0，receipt=`quality/tests/final-current-build-code-after-repair-v3.json`，hash=`ccbab1e86999368967aacf1ad75fa39d5acc7e225b2ab88aaf153f622395a5c1`，snapshot=`f310bca95ffab9a7e216219fd17b409f85b2e41e`，source_digest=`5797c59d0e5250d40b5367393b582cca43adba383019a297a3ff4c5b7b227d99`；当前完整 `npm test` exit 0：164 files，1729 passed + 1 skipped，exclusive 31 passed，receipt=`quality/tests/npm-test-after-build-code-repair-v3.json`，hash=`cf26786710f667c41ccc4f27f3ad39ef8ea0ebd8d9e654130e9688f80fe48c01`，snapshot=`f310bca95ffab9a7e216219fd17b409f85b2e41e`，source_digest=`5797c59d0e5250d40b5367393b582cca43adba383019a297a3ff4c5b7b227d99`。
- **evidence_refs**：当前 implementation=`quality/evidence/implementation/8f7008e9684e074e4e5cdd77370d89968b155adfd84e2d6309e510e97f112992.json`（sha256=`8f7008e9684e074e4e5cdd77370d89968b155adfd84e2d6309e510e97f112992`，snapshot=`f310bca95ffab9a7e216219fd17b409f85b2e41e`）；当前 aggregate=`quality/tests/final-current-build-code-after-repair-v3.json`（sha256=`ccbab1e86999368967aacf1ad75fa39d5acc7e225b2ab88aaf153f622395a5c1`）；当前全量测试=`quality/tests/npm-test-after-build-code-repair-v3.json`（sha256=`cf26786710f667c41ccc4f27f3ad39ef8ea0ebd8d9e654130e9688f80fe48c01`）；当前 final snapshot=`quality/tests/final-current-snapshot.json`，P1/P2/P3/P4 phase evidence=`quality/evidence/phases/P1.json`、`P2.json`、`P3.json`、`P4.json`（P1 sha256=`023d7e1365f2e244cad4ec46222cdce6dccfc2f3f39a9a389bb00b26be68ee05`，P3 sha256=`1fb4d62a01c96ba18afc1e2760149fe808631f21cac4821ec4825f5a30046e8c`，P4 sha256=`c5837543e8c24677165fd3c3b7ab2eacc5b3033455529a0937714fb00b828141`）；真实 external healthy liveness=`quality/evidence/external-p3-liveness-smoke-20260819.json`（sha256=`84ef49982572a9afd7478092f7bb19de4806fccf3723c45bad09904d1392e401`）；真实 external stalled lifecycle=`quality/evidence/external-p3-stalled-smoke-20260819.json`（sha256=`6aecfb3ec03b3d0cc21672187194765fdd25ec1aa7c0dcdbb183f740050f0e69`）；真实 external regression=`quality/evidence/external-p3-regression-20260819.json`（sha256=`0277f572e367463e26d863495bd846749a84da61c3916c51f72a089940dc3a7c`）；当前 focused review result=`quality/reviews/results/build-code-default-f310bca95ffab9a7e216219fd17b409f85b2e41e-532bba2e-45fa-4cb8-931a-33f3562e162a.json`（sha256=`3220f1c39fdc7137dd36fa6df1de5c21852dcc17c9481c4e66daad89828348fa`）、attempt=`quality/reviews/attempts/532bba2e-45fa-4cb8-931a-33f3562e162a/attempt.json`（sha256=`b0d7334838ac3b65e4f9771c8077b5c5fad1184ed4ca684cbc647f957c230438`）、report=`quality/reviews/reports/532bba2e-45fa-4cb8-931a-33f3562e162a.md`（sha256=`da7be366ae2bd13d8083906bb58789de1bc0560610f0f50e1a3f30335e8e1db3`）；阶段 host outcome=`quality/evidence/stage-outcomes/build-code/6871abe30bdc99397c16fcb8a9956528cdfedef780bb399d9d157cce1a1e4af0.json`（sha256=`6871abe30bdc99397c16fcb8a9956528cdfedef780bb399d9d157cce1a1e4af0`，status=`unavailable`）；当前 T403 final snapshot=`quality/tests/final-current-snapshot.json`（本次刷新后绑定当前四份材料 hash 和当前工作树 aggregate 结果）。
- **covered_ac**：AC-SEQ-001 AC-HAND-017 AC-INT-001 AC-INT-002 AC-INT-003 AC-INT-004 AC-REV-004 AC-REV-005 AC-REV-006 AC-REV-007 AC-REV-008 AC-REV-009 AC-REV-010 AC-REV-011 AC-REV-012 AC-REV-013 AC-REV-014 AC-RACE-016 AC-PLAN-011 AC-PLAN-012 AC-EVID-012 AC-QUALITY-013 AC-SCOPE-014 AC-PERM-015
- **review_fact**：当前 final integration review `fb28c666-cd7f-426c-bd64-97955cc3f741` 发生在最新缺失 evidence 修复前：Codex 报告的 subject-binding finding 按实际 `workflowhub-receipt.v1` 合同和本任务边界 `rejected_invalid`，缺失/无效 integration test evidence finding 已 fixed；随后当前快照 focused review `532bba2e-45fa-4cb8-931a-33f3562e162a` 仅报 `F-2d67c3bc75b2`，它要求不存在的顶层 `receipt.subject`，与既有 `producer.component` 身份和 `quality-fact.subject` 逻辑 subject 混淆，已 `rejected_invalid`，未留下有效 serious finding。此前一次材料调用 `11188ff9-37db-48be-af1e-517bbd1f1b05` 因调用方漏传 `approved_spec` 在 preflight 失败、provider dispatch=0，作为 unavailable preflight fact 保留，不算 review 结果。当前 focused review 按配置派发 `kimi/coding`、`codex/luna` 各一次；两 provider 均终态，Kimi=`ATTACHMENT_DELIVERY_UNSUPPORTED`，Codex completed，valid provider=1/1，group outcome=`partial`，无 retry，`deadline_ms=null`。
- **last_attempted_at**：2026-08-19T02:07:34+08:00
- **执行事实**：此前 aggregate、受影响回归和完整 `npm test` 均通过；P4 phase summary 和 final current snapshot 已补齐并通过 JSON 结构校验；当前 review 已绑定 snapshot=`f310bca95ffab9a7e216219fd17b409f85b2e41e`，所有 finding 均有 disposition，且没有有效 serious finding。P3 healthy-terminal、15 分钟 stalled 与 3rd-review regression facts 已绑定，P3 lifecycle contract 完成；正式 stage-end bridge 因当前 thread 没有 authenticated Stage Agent host 而 `unavailable`，该事实保留，但不再作为进入或继续 `verify-code` 的门槛。已补充“无 host outcome 仍可从四份材料执行、monitoring 记录 unavailable”的当前运行时合同测试；本次已在当前工作树重新执行 T403 aggregate，16 files、268 tests、exit 0，故 T403 build-code aggregate 任务完成；外部 host/Kimi 限制仍按真实状态保留，下一步进入 `verify-code`，不跑全量回归。
  - **本次边界修复定向验证**：`tests/integration/vnext-official-stage-run.test.mjs -t "four materials alone"` 1/1、`-t "accepts a host-supplied Stage Agent result"` 1/1、`tests/e2e/vnext-five-stage-current.test.mjs -t "stage-outcome|host outcome"` 2/2、`tests/contract/four-material-non-gate-contract.test.mjs` 16/16，均 exit=0；`node --check`、`git diff --check` 和 `node runtime/evidence/check-skill-closure.mjs` 均通过。受影响集成文件合并运行 30 秒无输出后停止，未记为通过；本次不跑全量回归。
  - **当前证据**：`quality/tests/stage-host-boundary-repair-20260819.json`；它只证明本次 host 边界修复和严格认证负例，不替代 final aggregate、外部 host 或 verify-code。
  - **verify-code 当前收尾事实（2026-08-19）**：按既定 T403 命令刷新当前快照一次；首次刷新暴露两个真实回归：`review-runner` 仍断言旧默认 `file_only`，以及 `skills/wh-review/skill-bundle.json` 的协议文档哈希失配。已分别改为断言默认 `negotiated`、同步 bundle 文件哈希和 `skills/catalog.yaml` 闭包哈希；定向修复测试通过后，同一 T403 命令最终为 16 files、269 tests、exit=0。新增当前 stage-end 分析 `quality/evidence/stage-end/verify-code-spec-analyze.json`，复放结果为 `inconsistent`：四份材料完整可读，但 review 证据绑定的是修复前旧快照，7 条原始需求仍保持 incomplete；真实 Stage Agent host 未附着，旧独立 review 未因本次修复重复调用；没有宣称 verify-code 或任务整体通过。
  - **verify-code 当前异源复核事实（2026-08-19）**：修复后只执行一轮当前配置 group，attempt=`quality/reviews/attempts/28e8a387-1cd0-423c-bf58-7ecdc5afd371/attempt.json`，result=`quality/reviews/results/verify-code-default-bcd721be711569ff7de3f4546a329e38646b1b53-28e8a387-1cd0-423c-bf58-7ecdc5afd371.json`，report=`quality/reviews/reports/28e8a387-1cd0-423c-bf58-7ecdc5afd371.md`；kimi/coding、antigravity/flash completed，codex/luna 因与 host 同源未派发，2/2 valid、minimum=1、group=`partial`、无重试。6 个有效 major finding 已逐条处置：4 个 fixed、1 个 rejected_invalid、1 个 needs_human；共享锚点的 16 条 pass 声明已回退为 unknown，AC-HAND-017 已修正为交接语义，当前 AC 汇总为 0 pass/24 unknown。host 缺失和 dirty worktree 均保留为质量限制，不作为 verify-code 推进门槛；canonical `quality/verify.json` status=`incomplete`，不宣称通过。
  - **verify-code 本轮最终复核事实（2026-08-19）**：当前代码修复后按 `/Users/Hugh/.config/workflowhub/config.json` 对应的实际 3rd-review 路由只执行一轮异源 group；attempt=`quality/reviews/attempts/cfe95ffa-4901-49d8-ac5a-b4fc6f6d740c/attempt.json`、result=`quality/reviews/results/verify-code-default-9d0dc751cdb34d5905b42e1cddd62fabb0e2bace-cfe95ffa-4901-49d8-ac5a-b4fc6f6d740c.json`、report=`quality/reviews/reports/cfe95ffa-4901-49d8-ac5a-b4fc6f6d740c.md`；请求 profiles=`kimi/coding`,`antigravity/flash`,`codex/luna`，3/3 provider terminal 并返回语义结果，group=`completed`，无 retry、无 timeout，minimum=1 已满足。antigravity findings=`[]`；codex/luna 的真实 major finding 保留为“缺少 authenticated Stage Agent host、不能宣称交互/最终交接完成”；kimi 的 AC/全量回归/旧 spec-analyze 指摘因 anchor 不在当前可认证 review subject 被 `invalid_anchor` 拒绝，不把它们当修复任务。`verify-final` 已验证 result 与当前 worktree snapshot 一致：status=`finalized`，reviewed snapshot=`9d0dc751cdb34d5905b42e1cddd62fabb0e2bace`，任务卡 record-only writeback 后 current snapshot=`c392adec4c4f6b96ca0b21c17236acd3206b72cb`。最终定向回归 5 files/100 tests exit=0，node syntax、diff check、skill closure 全通过；未跑无关全量回归。真实 host smoke、24 条 AC 独立运行证据、最终人工确认仍 unavailable/incomplete，保持 canonical `quality/verify.json` 不通过。
  - **当前任务边界修复（2026-08-19）**：Stage Agent outcome 明确为诊断事实，不是当前 WorkflowHub handler 的执行许可；缺失或无效 outcome 继续执行当前 handler，并输出 `stage_outcome_status=unavailable` 及诊断原因，monitoring 保留 unavailable；当前材料、质量和发布错误仍 fail-loud。定向证据=`quality/tests/stage-outcome-optional-repair-20260819.json`（sha256=`6735487a7d29e26b124d5b92de558b7fd10819e7352ecad17baae36118f5f211`），7 个边界测试、20 个合同测试、语法和 diff 检查均 exit=0；未刷新 269 条 aggregate、未重跑 provider、未跑全量回归。该修复不改变 24 条 AC、live 交互和最终人工确认仍 incomplete 的结论。
  - **当前交互证据绑定修复（2026-08-19）**：根因是 make-decision interaction aggregate 错把整个工作树 `snapshot_tree` 当作 Talk/Clarify 证据有效期；下游代码变化会误使同一 `decision-log` 下的真实交互失效。现改为保留原始交互快照作 provenance，只以当前 task、`decision_ref` 和 `decision_hash` 认证可复用性；新增回归覆盖“下游工作树变化、决策未变时 Talk/Clarify 仍可复用”。`tests/contract/make-decision-artifact-path.test.mjs` 5/5、`tests/integration/vnext-official-stage-run.test.mjs` 17/17、`tests/contract/stage-order-and-host-interaction.test.mjs` 4/4，均 exit=0；未重跑 provider、未跑全量回归。该修复不伪造缺失的 Grill/live reply/最终人工确认，当前 parent `quality/verify.json` 仍保持 incomplete。
  - **T103 后的 verify-code 反向复核（2026-08-19）**：P1 aggregate 已绑定当前 snapshot=`58cc5af6408139c71c7e2c612d5ea6470544ab6f` 的 canonical 31/31 receipt；四份材料、原始需求、Design、完整用户流程、20 FR/24 AC 和失败边界重新对齐。`node --check runtime/stage/stage-handlers.mjs`、`node --check tests/contract/make-decision-artifact-path.test.mjs`、`git diff --check` 均通过。实现侧没有发现新的有效缺陷；交付侧仍保持 `incomplete`：Stage Agent/live 交互缺失、24 条 AC 独立证据缺失、当前独立 review 不绑定最新 snapshot、最终人工确认缺失。未重跑 provider、未跑全量回归、未 close。
  - **official verify-code 入口事实（2026-08-19）**：执行 `node tools/cli/stage-runtime.mjs run --action=execute --stage=verify-code --project=workflowhub --task=workflowhub-execution-flow-repair-20260818`，入口返回 `status=in_progress`、`quality_status=incomplete`、`stage_outcome_status=unavailable`（`stage_outcome_missing`），并真实记录 `full_tests_fresh`、`independent_review`、`finding_dispositions`、`acceptance_criteria`、`exceptions`、`human_confirmation` 六项缺口；没有把缺口改写成 pass，也没有触发 provider 或全量回归。quality facts refs=`quality/facts/01a0f8c28d9e3de872f7227018d36d1f9678dfc540b35b8d223403df557ae406.json`、`quality/facts/e6b445e9bc6fddb10471689a83ec7d693d5ddd16846cb0734557537d20f592a2.json`、`quality/facts/1b65dd7b3064833a7103821468b43809072899f1f915dc7fff6a868f9cef07c8.json`、`quality/facts/ea497e44ec367c182813797117bae07f33858f52fd59b832576fac75d6e9a465.json`、`quality/facts/915ef2af38e20839f99bc4c01c6ef1e416bc789076dec7f4623b2d885bf5504b.json`、`quality/facts/b7fd02400c8a3e99692d5eda1029343911e81a9d5ac6956c5496e46ed6369547.json`。
  - **verify-code 反向检查（2026-08-19）**：已按“原始需求 → decision-log → spec → 完整用户流程（入口/成功/失败/交接）→ plan/tasks → 20 FR/24 AC → 实现/测试/证据”检查；实现修复的受影响定向测试保持 GREEN，但 T103 仍为 `pending`，当前 `quality/verify.json` 仍 `incomplete`，真实 Stage Agent host、Grill/Clarify live reply、24 条 AC 当前独立运行证据和最终人工确认仍缺失。既有 verify-code 异源 group 已按配置完成一轮且未自动复审；本轮交互证据绑定修复后不再重复 provider，避免违反一次审查和 token 约束。结论：可以继续 verify-code 收尾，但不能 close 或宣称整体通过；stage-end spec-analyze 需在可认证当前事实形成后再刷新。


### Verify

- **Target**：全部 20 FR、24 AC、P1-P4 seams、task completion/evidence and external dependency truth。
- **gate_cmd**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/stage-plan-task-contract.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：T401 为 1，T402/T403 为 0。
- **evidence_path**：`quality/tests/p4-evidence-{red,green}.json`、`quality/tests/final-current-snapshot.json`、`quality/evidence/phases/`。
- **Oracle**：`ORACLE-P4-EVIDENCE` 和 `ORACLE-FINAL`。

### Knowledge

P4 将完整 plan/task/evidence handoff 交给 verify-code；verify-code 仍需自己的独立异源 review、最终测试和真实用户确认，不能因本 aggregate 跳过。

### STOP

任何未覆盖 AC、missing evidence、外部依赖假绿、权限越界或新增控制面，都必须保留为 incomplete 并回到对应 Phase 修复；缺失质量事实不能阻止同任务进入或继续 `verify-code`，但在 close 前必须保持真实可见。

### Done

P4 完成时每个 task 的 completion 区、测试事实、review fact、phase evidence 和最终 aggregate 都有真实 hash-bound refs；缺失质量事实仍显示 incomplete。

### Risks and rollback

不新增 evidence authority；回滚 P4 当前改动，保留所有原始 phase/test/review facts 和 task history。

## 3. Deferred and open handoff

以下条目来自 decision-log，tasks 只记录执行交接，不重新决定方向；如果 upstream `spec.md` 没有携带这些 ID，最终 spec-analyze 必须保留 material gap，不能由 build-code 猜测或由 tasks 伪造补齐。

| ID | owner | trigger | handoff / consumer | close condition |
| --- | --- | --- | --- | --- |
| DEFER-001 | user / future make-decision task | 用户提出独立 dashboard 或 UI 页面需求 | 回到 make-decision，重新确认范围和页面边界 | 新四材料完成并经用户确认；当前不是阻塞 |
| DEFER-002 | build-spec / build-plan | 进入具体接口或 schema 设计 | build-code 只消费冻结材料，不自行补方向 | 当前 plan 已给出实现边界；后续只需按 task 落证据，不是未决产品方向 |
| OPEN-001 | 已由 D-011/G-003/G-017 解决 | 不再重新询问 minimum=1；继续保留“全终态后再应用阈值” | P2/P3 消费既定时序 | 以当前 decision-log 事实做一致性校验；不创建新 Talk |
| OPEN-002 | build-code / config owner | 当前 `pi/k3` 原始字段缺失，WorkflowHub 把 broker provenance 当 dispatch gate | P2 T201/T202 保留 profile/config snapshot preflight，移除 raw `source_id` 重复 gate；结果边界校验 broker identity | 三个 route profile 可 selection/dispatch，route/group/material 可回指，真实 smoke 的 broker result identity 完整；preflight 失败时零 dispatch |
| OPEN-003 | 决策已由 D-008/G-002 解决；实现交给 build-code | review runner 改造 direction public call count | P2 T202/T203 和 verify-code 复放一次 public group | 一次 group、每 provider 一次调用、blind order 和 terminal facts 可验证 |
| OPEN-004 | build-code / owning stage | 修复前材料把不同 stage 的 route 混成一条全局 route | 已按 stage 写入四份材料；P2 只消费当前 stage route 和 config hash | stage-scoped route matrix、四材料 hash 和当前 config snapshot 一致；route conflict 已关闭 |

## 4. Final current-snapshot aggregate strategy

- **tier / method**：`fullstack-slice-testing`；使用 T403 的一次最终命令。
- **scenarios**：P1 交互/顺序、P2 group/terminal、P3 liveness/deadline、P4 plan/task/evidence、失败分类和权限边界。
- **command**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/stage-plan-task-contract.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected exit**：0
- **oracle**：`ORACLE-FINAL` — all current local facts, 20 FR/24 AC enumeration, Phase review cards, finding dispositions and evidence bindings complete; external worktree dirty/uncommitted remains explicit, while the former approved-material route conflict is closed.
- **fixtures_services**：本地 fixtures；外部 provider/host/broker 不由 aggregate 伪造。
- **evidence_path**：`quality/tests/final-current-snapshot.json`、`quality/evidence/phases/`、`quality/verify.json`、`index.json`。
- **coverage limits**：不替代外部 liveness、真实 host 交互、浏览器/业务运行时或 verify-code review。
- **STOP**：命令、snapshot、AC coverage、evidence binding 或外部状态缺失时停止。
- **execution_contract**：当前快照运行一次；失败回受影响 task，不用重复审查或旧 receipt 掩盖局部失败。

## Dependency Graph

- **order**：T101 → T102 → T103 → T201 → T202 → T203 → T301 → T302 → T303 → T401 → T402 → T403。

```text
T101 (RED) → T102 (GREEN) → T103 (P1 FINAL)
  → T201 (RED) → T202 (GREEN) → T203 (P2 FINAL)
  → T301 (RED) → T302 (GREEN) → T303 (P3 FINAL)
  → T401 (RED) → T402 (GREEN) → T403 (FINAL)
```

## Final Boundary Check

- [ ] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [ ] 每个 task 只有一张卡和一个完成区；task files 是所属 Phase 的 NEW/MODIFY 子集。
- [ ] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只记录一次 aggregate。
- [ ] 20 FR、24 AC 双向追溯；external host/broker unknown/unavailable 没有被写成假设或通过。
- [ ] 每个 Phase 都有 initial/focused/final review card；每个 finding 都有 disposition，accepted_risk 缺绑定时为 needs_human。
- [ ] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。
