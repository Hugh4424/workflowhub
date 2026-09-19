# 任务清单：WorkflowHub 成本基线与阻塞收口

- **Input**：`decision-log.md@22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3`、`spec.md@7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`、`plan.md@8b91fd02b8a07ece0daf723b64dc213e9e64b47743e6f493589dfdb214ed01d4`
- **Template version**：`plan-task.v4`

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#D-001～D-026` | 方向、授权与非目标 | M 启动/确认前 |
| `spec.md#5` / `spec.md#11` | 38 FR / 38 AC | S 每卡前 |
| `plan.md#Phase P1～P8` | 文件、顺序、命令与回滚 | S 执行前 |
| `tasks.md#Phase P1～P8` | 16 张 RED/GREEN + 1 张 FINAL | M/S 执行与聚合 |

## Phase P1 — WorkflowHub 先容忍非终态成员事实与等待复检

### Goal

先让 WorkflowHub 安全读取非终态成员 status/error.code/last_progress_at_ms，并修复终态复检与不可用审查复用；保持 20 分钟阈值且不调用 cancelManaged。本 Phase 同时落地 FR-FORMAT-003 的 consumer 侧 extra top-level key 容忍与 attempt schema 的 process_outcome/parse_outcome 登记：按 RISK-009 同批约束，WH consumer/schema 必须先于 P2 producer 发布新字段之前兼容，避免半发布窗口。

### Files

- **MODIFY**：`skills/wh-review/scripts/review-provider-client.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **MODIFY**：`runtime/review/review-record-route.mjs`
- **MODIFY**：`tests/review/review-managed-lifecycle.test.mjs`
- **MODIFY**：`tests/review/review-record-route.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`
- **MODIFY**：`runtime/review/schemas/attempt.schema.json`
- **MODIFY**：`skills/wh-review/scripts/review-result.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

#### T001 — RED：WorkflowHub 先容忍非终态成员事实与等待复检
- **ID**：T001
- **Phase**：Phase P1 — WorkflowHub 先容忍非终态成员事实与等待复检
- **goal**：建立目标行为的可证伪 RED
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：N/A — first RED in Phase
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-WAIT-001, FR-WAIT-002, FR-HEALTH-003, FR-HEALTH-004, FR-BROKER-004, FR-FORMAT-003, FR-FORMAT-004
- **AC**：AC-WAIT-001, AC-WAIT-002, AC-HEALTH-003, AC-HEALTH-004, AC-BROKER-004, AC-FORMAT-003, AC-FORMAT-004
- **source_refs / decision_refs**：R-001, R-016, R-017 / D-003, D-004, D-023, D-024, D-025
- **动作**：先写目标断言，不改生产实现
- **精确文件**：`tests/review/review-managed-lifecycle.test.mjs`；`tests/review/review-record-route.test.mjs`；`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`
- **boundary**：files: `tests/review/review-managed-lifecycle.test.mjs`；`tests/review/review-record-route.test.mjs`；`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P1-red.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：1
- **oracle**：`ORACLE-WH-CONSUMER {"pass":"WH-CONSUMER 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`
- **evidence_path**：`quality/tests/output/P1-red.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示 canonical RED-only 事实完成）
- **status**：`completed` — 仅表示 T001 的合法 RED 原件已按当前 canonical resolver 收口；不表示 P1、Phase、Stage 或 review complete。
- **执行事实**：T001 仅完成 RED-only 事实登记；当前 `spec_sha256=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`、`material_revision=revision-d693aac95e68f5779923e7bce2f93f403f768e8a7b1c48e4e3f060af1593fc0e`；未改生产实现或五个测试文件，未提交；实际命令 `./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`，exit=1，原始输出为 `5 failed (5 files)`、`42 failed | 142 passed (184)`（canonical `P1-red.txt:786-789`）；证据路径为 `/Users/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-cost-baseline-and-blocker-close-20260917/quality/tests/output/P1-red.txt`，sha256=`97e7c39332b6c7bc9a3cf0670ae98c3420f57b0f06d853c776ffb376efdf3d4f`，790 行/57314 字节。7 AC 不作通过声明：`AC-WAIT-001=RED/未通过`、`AC-WAIT-002=RED/未通过`、`AC-HEALTH-003=RED/未通过`、`AC-HEALTH-004=RED/未通过`、`AC-BROKER-004=RED/未通过`、`AC-FORMAT-003=RED/未通过`，`AC-FORMAT-004=unknown/未独立核验`；P1 后续 T002 GREEN 的 `AC-HEALTH-003/004=PARTIAL`、`AC-FORMAT-004=UNKNOWN` 和 Phase review `unavailable` 原样保留。route-advisor=`feature`，selected=`feature`，reroute=`no`，advisor result=`pass`；testing skill=`backend-testing`，route=`feature` targeted local backend Vitest；T001 review 未单独执行，P1 review fact 保持 `unavailable`。T002 GREEN、P1/Phase/Stage 完成均未宣称。

#### T002 — GREEN：WorkflowHub 先容忍非终态成员事实与等待复检
- **ID**：T002
- **Phase**：Phase P1 — WorkflowHub 先容忍非终态成员事实与等待复检
- **goal**：以最小实现使同一 targeted gate 转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T001
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-WAIT-001, FR-WAIT-002, FR-HEALTH-003, FR-HEALTH-004, FR-BROKER-004, FR-FORMAT-003, FR-FORMAT-004
- **AC**：AC-WAIT-001, AC-WAIT-002, AC-HEALTH-003, AC-HEALTH-004, AC-BROKER-004, AC-FORMAT-003, AC-FORMAT-004
- **source_refs / decision_refs**：R-001, R-016, R-017 / D-003, D-004, D-023, D-024, D-025
- **动作**：修改生产实现并保留失败反例
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`runtime/review/review-record-route.mjs`；`tests/review/review-managed-lifecycle.test.mjs`；`tests/review/review-record-route.test.mjs`；`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`；`runtime/review/schemas/attempt.schema.json`；`skills/wh-review/scripts/review-result.mjs`；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-provider-client.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`runtime/review/review-record-route.mjs`；`tests/review/review-managed-lifecycle.test.mjs`；`tests/review/review-record-route.test.mjs`；`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`；`runtime/review/schemas/attempt.schema.json`；`skills/wh-review/scripts/review-result.mjs`；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P1-green.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：0
- **oracle**：`ORACLE-WH-CONSUMER {"pass":"WH-CONSUMER 的全部 AC 通过且负例保留"}`
- **evidence_path**：`quality/tests/output/P1-green.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示实现 + targeted GREEN）
- **status**：`completed` — 仅表示 T002 实现与同一 targeted GREEN 已完成；不表示 Phase review、P1 或 Stage complete。
- **actual_changes**：本次事实收口未新增代码或测试改动。认证 worktree 当前已有 T002 builder diff，涉及 9 个 task 声明文件：`runtime/review/review-record-route.mjs`、`runtime/review/schemas/attempt.schema.json`、`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`tests/review/review-managed-lifecycle.test.mjs`、`tests/review/review-record-route.test.mjs`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`；T002 声明的 `skills/wh-review/scripts/review-result.mjs` 当前未见 diff。
- **executed_commands**：RED（历史执行记录，本次收口未重跑）：`./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`，exit=1；GREEN（历史执行记录，本次收口未重跑）：同一命令，exit=0；本次未运行测试、review 或 verify。
- **evidence_refs**：RED：`quality/tests/output/P1-red.txt`，sha256=`97e7c39332b6c7bc9a3cf0670ae98c3420f57b0f06d853c776ffb376efdf3d4f`，790 lines/57314 bytes，结果锚点 `P1-red.txt:786-789`；GREEN：`quality/tests/output/P1-green.txt`，sha256=`2c993465ee4347c2eddd08245ffd2db38b9b9ebb090fef580d9c6552403bf1f`，136 lines/14960 bytes，结果与 AC 锚点 `P1-green.txt:104-136`；historical/provenance RED→GREEN 汇总（非 current aggregate）：`quality/tests/output/P1-red-green.txt`，sha256=`218b4bd5c2f410c1f591420d2505a32d437fc421bb8457a1845746c8202a48d3`，44 lines/3735 bytes；其 raw 内容仅作 provenance，不替代当前独立 RED/GREEN pairing；当前 `spec_sha256=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`、`material_revision=revision-d693aac95e68f5779923e7bce2f93f403f768e8a7b1c48e4e3f060af1593fc0e`。
- **covered_ac**：`AC-WAIT-001=PASS`（GREEN:125）；`AC-WAIT-002=PASS`（GREEN:126）；`AC-HEALTH-003=PARTIAL`（GREEN:127，未覆盖外部 3rd-review producer guard）；`AC-HEALTH-004=PARTIAL`（GREEN:128，未覆盖跨仓 agy print-timeout 与 healthy-slow producer 对照）；`AC-BROKER-004=PASS`（GREEN:129）；`AC-FORMAT-003=PASS`（GREEN:130，未运行独立 P4 format suite）；`AC-FORMAT-004=UNKNOWN`（GREEN:131，未执行人工 seven-redline diff）。
- **review_fact**：`unavailable`。Phase review 不得记为 pass：第一次 `/dev/stdin` 尝试以 `EAGAIN` 结束，`adapter=0`、`provider=0`；第二次普通 JSON official dispatch 运行约 21 分钟后被停止，无 terminal output、无 review refs。不得据此宣称 review pass 或 P1/Stage complete。
- **completed_at**：`2026-09-18T00:39:18+08:00`（本次事实收口记录时间）
- **执行事实**：T002 只收口为实现 + targeted GREEN 完成；7 AC 的 PARTIAL/UNKNOWN、Phase review `unavailable` 及跨仓/人工覆盖限制均保留。T001 status/事实未改；本次未改生产/测试/decision-log/spec/plan，未提交。

### Verify

- **Target**：AC-WAIT-001, AC-WAIT-002, AC-HEALTH-003, AC-HEALTH-004, AC-BROKER-004, AC-FORMAT-003, AC-FORMAT-004
- **gate_cmd**：`./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：current RED=`quality/tests/output/P1-red.txt`（sha256=`97e7c39332b6c7bc9a3cf0670ae98c3420f57b0f06d853c776ffb376efdf3d4f`）；current GREEN=`quality/tests/output/P1-green.txt`（sha256=`2c993465ee4347c2eddd08245ffd2db38b9bebb090fef580d9c6552403bf1f`）；historical/provenance aggregate=`quality/tests/output/P1-red-green.txt`（sha256=`218b4bd5c2f410c1f591420d2505a32d437fc421bb8457a1845746c8202a48d3`，不替代 active 独立 RED/GREEN evidence）
- **Oracle**：ORACLE-WH-CONSUMER。

### Knowledge

下一 Phase 只消费真实测试与 review facts；缺失/partial/unavailable 原样保留。

### STOP

- 命令损坏、oracle 不符、越界或需要新设计时返回 owning material。

### Done

- 对应 AC 有 RED/GREEN 原件、diff allowlist、独立 review 与大白话交接后才可填写 completed。

### Risks and rollback

- **Risk**：共享文件串行冲突或跨仓半发布。
- **Prevention**：按 plan 顺序与 changed-file allowlist。
- **Rollback / recovery**：只回滚当前 Phase，保留事实。

## Phase P2 — 3rd-review 健康、重发与公开 attempt 事实

### Goal

在 WH 已兼容后，使 antigravity 超时诚实分类、一次 fresh_execution 生效、attempt 按 parse 结果落事实，并只暴露受控非终态成员字段。T003 额外包含 BR→WH 跨仓 envelope 确定性 seam 断言：以 fake envelope 端到端验证 WH consumer（P1 已落地）能读取 BR 新公开字段，成员级私路违规只 fail 该成员、group 记 partial。

### Files

- **MODIFY**：`$THIRD_REVIEW_ROOT/lib/adapters/antigravity.mjs`
- **MODIFY**：`$THIRD_REVIEW_ROOT/lib/provider-failure.mjs`
- **MODIFY**：`$THIRD_REVIEW_ROOT/lib/recovery-policy.mjs`
- **MODIFY**：`$THIRD_REVIEW_ROOT/lib/broker.mjs`
- **MODIFY**：`$THIRD_REVIEW_ROOT/lib/workflowhub-result-v3.mjs`
- **MODIFY**：`$THIRD_REVIEW_ROOT/test/managed-session-lifecycle.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

#### T003 — RED：3rd-review 健康、重发与公开 attempt 事实
- **ID**：T003
- **Phase**：Phase P2 — 3rd-review 健康、重发与公开 attempt 事实
- **goal**：建立目标行为的可证伪 RED
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T002
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-HEALTH-001, FR-HEALTH-002, FR-BROKER-001, FR-BROKER-002, FR-BROKER-003, FR-HEALTH-003, FR-HEALTH-004
- **AC**：AC-HEALTH-001, AC-HEALTH-002, AC-BROKER-001, AC-BROKER-002, AC-BROKER-003, AC-HEALTH-003, AC-HEALTH-004
- **source_refs / decision_refs**：R-001, R-007, R-016 / D-011, D-019, D-023, D-025
- **动作**：先写目标断言（含跨仓 envelope seam 断言），不改生产实现
- **精确文件**：`$THIRD_REVIEW_ROOT/test/managed-session-lifecycle.test.mjs`
- **boundary**：files: `$THIRD_REVIEW_ROOT/test/managed-session-lifecycle.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P2-red.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`bash -c 'cd /Users/Hugh/Hugh/Project/3rd-review && node --test --test-timeout=30000 test/antigravity-adapter.test.mjs test/provider-failure.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs'`
- **expected_exit**：1
- **oracle**：`ORACLE-BROKER-HEALTH {"pass":"BROKER-HEALTH 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`
- **evidence_path**：`quality/tests/output/P2-red.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示 canonical RED-only 事实完成）
- **status**：`completed` — 仅表示 T003 的合法 RED 原件已收口；质量仍 `incomplete`，不表示 P2、Phase、Stage 或 review complete。
- **actual_changes**：只修改外部 `/Users/Hugh/Hugh/Project/3rd-review/test/managed-session-lifecycle.test.mjs` 的 T003 局部 guard/断言、确定性临时 fake CLI helper，并修复该文件 provider fixture 的 `auth.env=[]`；外部 diff 为 `153 insertions(+), 20 deletions(-)`；未改 producer、WorkflowHub 文件或配置，未提交。
- **executed_commands**：仅一次：`bash -c 'cd /Users/Hugh/Hugh/Project/3rd-review && node --test --test-timeout=30000 test/antigravity-adapter.test.mjs test/provider-failure.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs'`，`exit_code=1`；`85 tests / 77 pass / 8 fail / 0 cancelled / 0 skipped`，Node test duration `7497.371125ms`。
- **evidence_refs**：canonical `quality/tests/output/P2-red.txt`，`244 lines / 13,490 bytes`，`sha256=1c6803fb226fa3d06f8e0417d1ab5f02ca35179764879acaf480b4cc3d159f35`; summary `P2-red.txt:86-93`。旧证据 provenance-only：`quality/tests/output/P2-red-pre-fixture-repair.txt`；canonical root readback 中不存在，不作为 active/current ref；原记录 `sha256=035ea23ac6cc45904e5b735d8658c13964f054bb8f24bbeeece84690b268b33d`。
- **covered_ac**：`AC-HEALTH-001=RED`（`auth.env` setup 已不再阻断；真实失败为 `--print-timeout=20m` 断言，测试 `:127`/断言 `:130`，`P2-red.txt:120-134`；同测试后续 stderr parse 断言未执行）；`AC-HEALTH-002=RED`（期望 `PROCESS_TIMEOUT`，实际 `PROCESS_EXIT_NONZERO`，`P2-red.txt:137-155`）；`AC-BROKER-001=RED`（`single_round` 实际仍 `failed`，`P2-red.txt:157-174`）；`AC-BROKER-002=RED`（无 resume 仍 `failed`，`P2-red.txt:176-193`）；`AC-BROKER-003=RED`（parse failure attempt 实际 `completed`，`P2-red.txt:195-212`）；`AC-HEALTH-003=RED`（非终态 `providers` health 字段缺失，`P2-red.txt:97-118`，以及失败成员不可见 `P2-red.txt:214-225`）；`AC-HEALTH-004=RED`（失败成员未在健康慢成员完成前可见，`P2-red.txt:214-225`）。另有非 T003 的既有 `workflowhub-result-v3-hardening` 红灯 `P2-red.txt:228-244`，故整体质量保持 `incomplete`，不称为 clean RED。
- **review_fact**：`not executed` — 用户明确要求 P2 review 在 T004 后；不宣称通过。
- **completed_at**：N/A — T003 completion is RED-only; no GREEN/Phase/Stage completion timestamp is asserted
- **执行事实**：T003 已在 canonical RED-only boundary 收口为 `completed`；本次仅记录一次 setup fixture 修复后的指定命令事实，setup `provider.auth.env is not iterable` 已消失，7 个 T003 目标 AC 均有真实目标断言 RED；`AC-HEALTH-001` 的 stderr parse 子断言因同测试先在 argv 断言失败而未执行。route-advisor 仅一次：actual boundary=`test/managed-session-lifecycle.test.mjs`，old=`feature`，selected=`feature`，reroute=`no`，result=`pass`；`backend-testing` 仅一次，Node backend targeted route，oracle=`ORACLE-BROKER-HEALTH`，coverage 仅 T003 七个 AC 与局部 managed envelope/负例。P1 route/testing 未重跑。命令同时包含一项既有外部 hardening 红灯，故 RED 质量保持 `incomplete`；未生成任何 P2 GREEN/聚合证据，T003 RED 阶段未改 producer、未 review、未提交。

#### T004 — GREEN：3rd-review 健康、重发与公开 attempt 事实
- **ID**：T004
- **Phase**：Phase P2 — 3rd-review 健康、重发与公开 attempt 事实
- **goal**：以最小实现使同一 targeted gate 转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T003
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-HEALTH-001, FR-HEALTH-002, FR-BROKER-001, FR-BROKER-002, FR-BROKER-003, FR-HEALTH-003, FR-HEALTH-004
- **AC**：AC-HEALTH-001, AC-HEALTH-002, AC-BROKER-001, AC-BROKER-002, AC-BROKER-003, AC-HEALTH-003, AC-HEALTH-004
- **source_refs / decision_refs**：R-001, R-007, R-016 / D-011, D-019, D-023, D-025
- **动作**：修改生产实现并保留失败反例
- **精确文件**：`$THIRD_REVIEW_ROOT/lib/adapters/antigravity.mjs`；`$THIRD_REVIEW_ROOT/lib/provider-failure.mjs`；`$THIRD_REVIEW_ROOT/lib/recovery-policy.mjs`；`$THIRD_REVIEW_ROOT/lib/broker.mjs`；`$THIRD_REVIEW_ROOT/lib/workflowhub-result-v3.mjs`；`$THIRD_REVIEW_ROOT/test/managed-session-lifecycle.test.mjs`
- **boundary**：files: `$THIRD_REVIEW_ROOT/lib/adapters/antigravity.mjs`；`$THIRD_REVIEW_ROOT/lib/provider-failure.mjs`；`$THIRD_REVIEW_ROOT/lib/recovery-policy.mjs`；`$THIRD_REVIEW_ROOT/lib/broker.mjs`；`$THIRD_REVIEW_ROOT/lib/workflowhub-result-v3.mjs`；`$THIRD_REVIEW_ROOT/test/managed-session-lifecycle.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P2-green.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`bash -c 'cd /Users/Hugh/Hugh/Project/3rd-review && node --test --test-timeout=30000 test/antigravity-adapter.test.mjs test/provider-failure.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs'`
- **expected_exit**：0
- **oracle**：`ORACLE-BROKER-HEALTH {"pass":"BROKER-HEALTH 的全部 AC 通过且负例保留"}`
- **evidence_path**：`quality/tests/output/P2-green.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示实现 + targeted GREEN）
- **status**：`completed` — 仅表示 T004 实现与同一 targeted gate 的 `85/85 GREEN`；不表示 P2 complete、Phase complete、Stage complete 或 review pass。
- **actual_changes**：T004 实现事实落在认证外部 worktree 的 6-file allowlist：`lib/adapters/antigravity.mjs`、`lib/provider-failure.mjs`、`lib/recovery-policy.mjs`、`lib/broker.mjs`、`lib/workflowhub-result-v3.mjs`、`test/managed-session-lifecycle.test.mjs`；其中包含既有 `workflowhub-result-v3-hardening` 负例修复。该 closeout worker 未新增外部源码/测试字节；未改 WorkflowHub 生产/测试、配置、decision-log/spec/plan；未提交。
- **executed_commands**：T003 RED（历史原件，本次收口未重跑）：`bash -c 'cd /Users/Hugh/Hugh/Project/3rd-review && node --test --test-timeout=30000 test/antigravity-adapter.test.mjs test/provider-failure.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs'`，`exit_code=1`，`85 tests / 77 pass / 8 fail / 0 cancelled / 0 skipped`；T004 GREEN（历史原件，本次收口未重跑）：同一命令，`exit_code=0`，`85 tests / 85 pass / 0 fail / 0 cancelled / 0 skipped / 0 todo`，Node `duration_ms=7716.289917`。本次未运行测试、review 或 verify。
- **evidence_refs**：RED：`quality/tests/output/P2-red.txt`，`244 lines / 13490 bytes`，`sha256=1c6803fb226fa3d06f8e0417d1ab5f02ca35179764879acaf480b4cc3d159f35`，summary `P2-red.txt:86-93`、failures `:95-244`；GREEN：`quality/tests/output/P2-green.txt`，`93 lines / 7554 bytes`，`sha256=cc8f4c9723e02f68124e3d6f8ebc6339096a81261f7dd9b0090c902371bb07f2`，summary `P2-green.txt:86-93`、无 failing-tests section。保留旧证据：`P2-red-pre-fixture-repair.txt` sha256=`035ea23ac6cc45904e5b735d8658c13964f054bb8f24bbeeece84690b268b33d`（237 lines / 13567 bytes，`provider.auth.env is not iterable` setup failure）；`P2-red-pre-t004.txt` sha256=`1c6803fb226fa3d06f8e0417d1ab5f02ca35179764879acaf480b4cc3d159f35`（244 lines / 13490 bytes，未覆盖）；`P2-green-pre-hardening-repair.txt` sha256=`920aad30fcd2664b0d4c668b08130eef7cc54fe3a971f6bacf9417cd37c389d4`（113 lines / 8485 bytes，84/85，既有 hardening 负例）。**historical/provenance RED→GREEN 汇总（非 active evidence/current pairing）**：`quality/tests/output/P2-red-green.txt`，`49 lines / 5119 bytes`，`sha256=a36b8691da5543bc3463bbe62418902351d5fd099ba8a0f31ad8f3f2d4609667`；当前 pairing 以独立 P2 RED/GREEN refs 为准。当前 identity：`spec_sha256=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`、`material_revision=revision-f505d785a347ce041a4a7c80d28b0acbce1537103b04c1bc87636c35c16c8853`；旧 `revision-d693...` 仅保留为历史 review 绑定，非 current。
- **covered_ac**：T003 RED 原件保留 7 个目标 AC 的真实失败：`AC-HEALTH-001=RED`、`AC-HEALTH-002=RED`、`AC-BROKER-001=RED`、`AC-BROKER-002=RED`、`AC-BROKER-003=RED`、`AC-HEALTH-003=RED`、`AC-HEALTH-004=RED`；T004 GREEN 原件显示上述 7 个目标 AC 的相关健康/重发/公开 attempt 断言均 `PASS`，且既有 v3 hardening 负例通过。该结论仅是 8-file targeted gate 的事实；review coverage 仍 `incomplete`，无独立 review/provider result，不宣称 P2/Phase/Stage 完成。
- **review_fact**：`unavailable`，`dispatch_state=blocked_before_dispatch`；`attempt_ref=quality/reviews/attempts/a4b8755e-e893-5eff-aff8-873c1e3f79ea/attempt.json`；`report_ref=quality/reviews/reports/build-code-simple-a4b8755e-e893-5eff-aff8-873c1e3f79ea.md`；`result_ref=null`；真实原因 `PROTOCOL_INCOMPATIBLE`，review 绑定的 `material_revision=revision-d693aac95e68f5779923e7bce2f93f403f768e8a7b1c48e4e3f060af1593fc0e` 与当前 `revision-f505d785a347ce041a4a7c80d28b0acbce1537103b04c1bc87636c35c16c8853` 不一致。canonical root readback 确认 attempt/report refs 存在；因此没有可绑定的 review result 或 coverage，不作 pass 声明。
- **completed_at**：`2026-09-18T02:17:51+08:00`（事实收口记录时间）
- **执行事实**：T004 仅收口为实现 + `85/85 GREEN`；T003 RED、T004 GREEN、历史 pre-* 证据均保留且未覆盖。review 事实为 `unavailable/blocked_before_dispatch`，真实错误为 `PROTOCOL_INCOMPATIBLE` + material revision mismatch，`result_ref=null`；不宣称 P2/Phase/Stage complete。未重跑测试/review/verify，未提交。

### Verify

- **Target**：AC-HEALTH-001, AC-HEALTH-002, AC-BROKER-001, AC-BROKER-002, AC-BROKER-003, AC-HEALTH-003, AC-HEALTH-004
- **gate_cmd**：`bash -c 'cd /Users/Hugh/Hugh/Project/3rd-review && node --test --test-timeout=30000 test/antigravity-adapter.test.mjs test/provider-failure.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs'`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：current RED=`quality/tests/output/P2-red.txt`（sha256=`1c6803fb226fa3d06f8e0417d1ab5f02ca351797648acaf480b4cc3d159f35`）；current GREEN=`quality/tests/output/P2-green.txt`（sha256=`cc8f4c9723e02f68124e3d6f8ebc6339096a81261f7dd9b0090c902371bb07f2`）；historical/provenance aggregate=`quality/tests/output/P2-red-green.txt`（sha256=`a36b8691da5543bc3463bbe62418902351d5fd099ba8a0f31ad8f3f2d4609667`，不作为 active evidence/current aggregate）
- **Oracle**：ORACLE-BROKER-HEALTH。

### Knowledge

下一 Phase 只消费真实测试与 review facts；缺失/partial/unavailable 原样保留。

### STOP

- 命令损坏、oracle 不符、越界或需要新设计时返回 owning material。

### Done

- 对应 AC 有 RED/GREEN 原件、diff allowlist、独立 review 与大白话交接后才可填写 completed。

### Risks and rollback

- **Risk**：共享文件串行冲突或跨仓半发布。
- **Prevention**：按 plan 顺序与 changed-file allowlist。
- **Rollback / recovery**：只回滚当前 Phase，保留事实。

## Phase P3 — 派发前预检、等待止损与源漂移分类

### Goal

在 bundle、锁和 dispatch 前完成四类静态预检；运行期源漂移立即停止本仓等待并保留 judged retry，不声称静态预检能抓运行期空输出。

### Files

- **MODIFY**：`skills/wh-review/scripts/third-review-host-config.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **MODIFY**：`runtime/review/review-record-route.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-result.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **MODIFY**：`tests/contract/review-material-change-redispatch.test.mjs`
- **MODIFY**：`tests/review/review-record-route.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

#### T005 — RED：派发前预检、等待止损与源漂移分类
- **ID**：T005
- **Phase**：Phase P3 — 派发前预检、等待止损与源漂移分类
- **goal**：建立目标行为的可证伪 RED
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T004
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-PREFLIGHT-001, FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-CLEANUP-005
- **AC**：AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-CLEANUP-005
- **source_refs / decision_refs**：R-001, R-015 / D-005, D-011, D-022
- **动作**：先写目标断言，不改生产实现
- **精确文件**：`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`tests/contract/review-material-change-redispatch.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`tests/contract/review-material-change-redispatch.test.mjs`；`tests/review/review-record-route.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P3-red.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/contract/review-material-change-redispatch.test.mjs tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：1
- **oracle**：`ORACLE-PREFLIGHT-DRIFT {"pass":"PREFLIGHT-DRIFT 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`
- **evidence_path**：`quality/tests/output/P3-red.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示合法 targeted RED）
- **status**：`completed` — T005 的 canonical targeted RED 已发布且有效；仅表示 T005 RED 事实边界完成，不表示 T006 GREEN、P3/Phase/Stage 完成、review pass 或 release。
- **actual_changes**：本次仅同步 T005 RED canonical fact；未改生产、测试、config、provider 或材料语义字节。认证 worktree 中已有 dirty bytes 保持原样，不归因于本次同步。
- **executed_commands**：任务元数据确认本次发布对应 exact T005 gate command（执行一次）：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/contract/review-material-change-redispatch.test.mjs tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`；`exit_code=1`；四个 P3 test files `4/4 collected`；setup/env failure `0`。本次同步未运行测试/review。
- **evidence_refs**：active canonical RED `quality/tests/output/P3-red.txt` — `sha256=431f5c1b563a4bf4059abaa5cd2253544458fa22c887e54832a9fdb15fcefaa5`，`34956 bytes`；`quality/tests/output/P3-red-pre-t006.txt` 仅作为 historical provenance 保留（旧 `986 lines / 53517 bytes`，`sha256=254ca562cec23b613509c311e5dcd5a1453cb6a1195ae000631be939d2852282`），不再作为 active T005 evidence。T006 GREEN 与既有 RED→GREEN refs 保持不变。
- **covered_ac**：在 `ORACLE-PREFLIGHT-DRIFT` 下，target preflight/redispatch failures `8`；non-target later-phase failures `19`；non-target failures 不转写为 T005 target RED。
- **review_fact**：not executed by explicit T005 scope.
- **completed_at**：`2026-09-18T06:48:27Z`（canonical gate metadata `finished_at_utc`）。
- **执行事实**：四个 P3 test files `4/4 collected`；`exit_code=1`；`27 failed / 213 passed`；target preflight/redispatch failures `8`；non-target later-phase failures `19`；setup/env `0`；oracle=`ORACLE-PREFLIGHT-DRIFT`。Current identity is `spec_sha256=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847` and `material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`; tasks execution-status writeback is excluded by the material contract. T005 is `completed` at the valid RED boundary; T006 remains `completed` at implementation + targeted GREEN only; P3/Phase/Stage completion and review pass are not implied.

#### T006 — GREEN：派发前预检、等待止损与源漂移分类
- **ID**：T006
- **Phase**：Phase P3 — 派发前预检、等待止损与源漂移分类
- **goal**：以最小实现使同一 targeted gate 转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T005
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-PREFLIGHT-001, FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-CLEANUP-005
- **AC**：AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-CLEANUP-005
- **source_refs / decision_refs**：R-001, R-015 / D-005, D-011, D-022
- **动作**：修改生产实现并保留失败反例
- **精确文件**：`skills/wh-review/scripts/third-review-host-config.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`runtime/review/review-record-route.mjs`；`skills/wh-review/scripts/review-result.mjs`；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`tests/contract/review-material-change-redispatch.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/third-review-host-config.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`runtime/review/review-record-route.mjs`；`skills/wh-review/scripts/review-result.mjs`；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`tests/contract/review-material-change-redispatch.test.mjs`；`tests/review/review-record-route.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P3-green.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/contract/review-material-change-redispatch.test.mjs tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：0
- **oracle**：`ORACLE-PREFLIGHT-DRIFT {"pass":"PREFLIGHT-DRIFT 的全部 AC 通过且负例保留"}`
- **evidence_path**：`quality/tests/output/P3-green.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示实现 + targeted GREEN）
- **status**：`completed` — 仅表示 T006 实现与同一 targeted GREEN 已完成；不表示 P3、Phase、Stage 完成或 review pass。
- **actual_changes**：T006 implementation + targeted GREEN fact; current worktree already contains the legal model fixture/`strictProtocol` assertion fix in `simple-review-runner.test.mjs`, and the external `3rd-review` implementation remains confined to its six-file allowlist. This closeout worker changed no source or test bytes; all pre-existing dirty worktree bytes were preserved. Only T006 execution-status facts were updated in `tasks.md`.
- **executed_commands**：the exact command was executed exactly once: `./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/contract/review-material-change-redispatch.test.mjs tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`; `exit_code=0`; Vitest `Start at 04:00:00`, `Duration 143.70s` (`transform 180ms`, `setup 0ms`, `collect 599ms`, `tests 143.00s`, `environment 0ms`, `prepare 21ms`). No route-advisor/backend-testing rerun and no review was executed.
   - **evidence_refs**：canonical raw stdout/stderr `quality/tests/output/P3-green.txt` — `106 lines / 12700 bytes`; `sha256=6ba289775a67fb79f4ef65b1a745fa4cd7c0a3b9ac125619527204f9e65938f0` (summary `P3-green.txt:105-106`). Active T005 RED `quality/tests/output/P3-red.txt` — `34956 bytes`; `sha256=431f5c1b563a4bf4059abaa5cd2253544458fa22c887e54832a9fdb15fcefaa5`. Historical provenance only: `quality/tests/output/P3-red-pre-t006.txt` — `986 lines / 53517 bytes`; `sha256=254ca562cec23b613509c311e5dcd5a1453cb6a1195ae000631be939d2852282`. historical/provenance RED→GREEN aggregate (not active evidence/current aggregate) `quality/tests/output/P3-red-green.txt` — `28 lines / 3519 bytes`; `sha256=4a2ae6ad41543a5e12628a7fac919c2b3a99f091fc4d790d136d5b34e08b154f`.
- **covered_ac**：test coverage: `AC-PREFLIGHT-001=PASS` (2/2 target cases); `AC-PREFLIGHT-002=PASS` (5/5 target cases: four structured probe cases plus the blocked-provider/sibling-dispatch case); `AC-PREFLIGHT-003=PASS` (1/1 runtime agy boundary case); `AC-CLEANUP-005=PASS` (3/3 target cases). All P3 target cases `11 passed / 0 failed`; non-target failures `0`. Review coverage remains `incomplete` because the canonical P3 review was unavailable; provider semantic review is not covered.
- **review_fact**：`unavailable`，`dispatch_state=blocked_before_dispatch`，`attempt_ref=quality/reviews/attempts/7c2970d1-a8dc-553b-ad7d-a929b36c6fb4/attempt.json`，`report_ref=quality/reviews/reports/build-code-simple-7c2970d1-a8dc-553b-ad7d-a929b36c6fb4.md`，`result_ref=null`；error=`PROTOCOL_INCOMPATIBLE`（configured providers mismatch）。canonical root readback 确认 attempt/report refs 存在，因此不宣称 provider semantic review result、coverage 或 review pass。
- **completed_at**：`2026-09-18T04:03:26+08:00` (fact closeout timestamp).
   - **执行事实**：`Test Files 4 passed (4)`；`Tests 221 passed (221)`；`Start at 04:00:00`；`Duration 143.70s` (`transform 180ms`、`setup 0ms`、`collect 599ms`、`tests 143.00s`、`environment 0ms`、`prepare 21ms`)；all four files collected；setup/collection/environment failure count `0`；target failures `0`；non-target failures `0`. Target assertions: host registry + runner guard (`AC-PREFLIGHT-001`, 2/2), four probe-code cases + sibling dispatch (`AC-PREFLIGHT-002`, 5/5), runtime agy boundary (`AC-PREFLIGHT-003`, 1/1), material-changed retry + zero-member judged retry + managed source drift (`AC-CLEANUP-005`, 3/3). Current identity is `spec_sha256=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847` and `material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`; the T006 execution-status update is excluded by the material contract. T006 `status=completed` means implementation + targeted GREEN only; T005 `status=completed` means valid canonical RED only. Review is `unavailable/blocked_before_dispatch` with `PROTOCOL_INCOMPATIBLE`（configured providers mismatch）; `result_ref=null`; review coverage is incomplete. P3/Phase/Stage completion and review pass are not implied; no commit was made.

### Verify

- **Target**：AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-CLEANUP-005
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/contract/review-material-change-redispatch.test.mjs tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：current RED=`quality/tests/output/P3-red.txt`（sha256=`431f5c1b563a4bf4059abaa5cd2253544458fa22c887e54832a9fdb15fcefaa5`）；current GREEN=`quality/tests/output/P3-green.txt`（sha256=`6ba289775a67fb79f4ef65b1a745fa4cd7c0a3b9ac125619527204f9e65938f0`）；historical/provenance aggregate=`quality/tests/output/P3-red-green.txt`（sha256=`4a2ae6ad41543a5e12628a7fac919c2b3a99f091fc4d790d136d5b34e08b154f`，不作为 active evidence/current aggregate）
- **Oracle**：ORACLE-PREFLIGHT-DRIFT。

### Knowledge

下一 Phase 只消费真实测试与 review facts；缺失/partial/unavailable 原样保留。

### STOP

- 命令损坏、oracle 不符、越界或需要新设计时返回 owning material。

### Done

- 对应 AC 有 RED/GREEN 原件、diff allowlist、独立 review 与大白话交接后才可填写 completed。

### Risks and rollback

- **Risk**：共享文件串行冲突或跨仓半发布。
- **Prevention**：按 plan 顺序与 changed-file allowlist。
- **Rollback / recovery**：只回滚当前 Phase，保留事实。

## Phase P4 — 格式宽容、CJK 脱敏与七条红线

### Goal

按确定性优先级提取异源 findings、只丢坏 finding/越界成员、修 CJK 边界与错误分类，同时原样保留七条 fail-closed 红线。

### Files

- **MODIFY**：`runtime/review/review-output.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-materials.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-input-bounds.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-provider-client.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
- **MODIFY**：`tests/contract/review-materials-contract.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **MODIFY**：`tests/contract/review-layering.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

T008 — GREEN
#### T007 — RED：格式宽容、CJK 脱敏与七条红线
- **ID**：T007
- **Phase**：Phase P4 — 格式宽容、CJK 脱敏与七条红线
- **goal**：建立目标行为的可证伪 RED
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T006
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-FORMAT-001, FR-FORMAT-002, FR-FORMAT-003, FR-FORMAT-004
- **AC**：AC-FORMAT-001, AC-FORMAT-002, AC-FORMAT-003, AC-FORMAT-004
- **source_refs / decision_refs**：R-017 / D-024
- **动作**：先写目标断言，不改生产实现
- **精确文件**：`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`；`tests/contract/review-materials-contract.test.mjs`；`skills/wh-review/scripts/__tests__/review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs`；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；`tests/contract/review-layering.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/material-redaction.test.mjs`；`tests/contract/review-materials-contract.test.mjs`；`skills/wh-review/scripts/__tests__/review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs`；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；`tests/contract/review-layering.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：current `quality/tests/output/P4-red-clean.txt`（sha256=`a2f54a7f0db50ca55a9050a24ab89fc009383386e67a55a7b9309f7e023b7449`）
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-layering.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：1
- **oracle**：`ORACLE-FORMAT-REDLINES {"pass":"FORMAT-REDLINES 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`
- **evidence_path**：current `quality/tests/output/P4-red-clean.txt`（sha256=`a2f54a7f0db50ca55a9050a24ab89fc009383386e67a55a7b9309f7e023b7449`）
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示合法 targeted RED）
- **status**：`completed` — 仅表示 T007 的合法 targeted RED 已建立；不表示 T008/P4、Phase、Stage 完成或 review pass。
- **actual_changes**：The T007 test increment was already present in the authenticated worktree. The legal `P4-red-clean.txt` fact was obtained during T008 implementation isolation, after which the five T008 production files were restored byte-for-byte. This closeout added or modified no production/test bytes; existing dirty bytes remain preserved and are not attributed to this execution.
- **executed_commands**：historical targeted RED fact only, not rerun here: `./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-layering.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`; `exit_code=1`; seven-file gate `7/7` files collected; `Test Files 5 failed | 2 passed (7)`; `Tests 25 failed | 181 passed (206)`; `setup=0ms`; `environment=0ms`; setup/collection/environment failure count `0`; Oracle=`ORACLE-FORMAT-REDLINES`. No test command was run in this closeout.
- **evidence_refs**：legal current RED `quality/tests/output/P4-red-clean.txt`, `526 lines / 24964 bytes`, sha256=`a2f54a7f0db50ca55a9050a24ab89fc009383386e67a55a7b9309f7e023b7449`, summary `P4-red-clean.txt:522-526`; it was obtained during T008 implementation isolation and the five production files were subsequently restored byte-for-byte. Original contaminated RED provenance remains retained in `P4-red.txt` and `P4-red-contaminated.txt`, identical `463 lines / 22032 bytes`, sha256=`e1905b9df5480cd82bdf720ba3098ec6143947b66b8b627caed37925f00a8bca`; `P4-red-pre-test-fix.txt` remains retained, `536 lines / 25115 bytes`, sha256=`b31ea573c3219eded4dbfc9b78fcf822c8b2446b3c66380200ecefad5551a228`. `P4-green.txt` is recorded under T008.
- **covered_ac**：`AC-FORMAT-001/002/003/004=targeted RED observation` under `ORACLE-FORMAT-REDLINES`; the legal RED is the seven-file run above. Review quality is not inferred from this fact.
- **review_fact**：`unknown` / not executed; no review pass is recorded.
- **completed_at**：`2026-09-18T11:29:47+08:00` (fact closeout timestamp).
- **执行事实**：T007 is complete at the test-fact boundary because the legal current RED is now recorded; this does not imply T008/P4/Phase/Stage completion or review pass. Current material identity at readback is `spec_sha256=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`, `material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`; route facts remain old=`feature`, selected=`fullstack`, reroute=`yes`, one advisor result=`pass`, one direct `backend-testing` use, with no rerun here. T008 GREEN is recorded separately under T008.

#### T008 — GREEN：格式宽容、CJK 脱敏与七条红线
- **ID**：T008
- **Phase**：Phase P4 — 格式宽容、CJK 脱敏与七条红线
- **goal**：以最小实现使同一 targeted gate 转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T007
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-FORMAT-001, FR-FORMAT-002, FR-FORMAT-003, FR-FORMAT-004
- **AC**：AC-FORMAT-001, AC-FORMAT-002, AC-FORMAT-003, AC-FORMAT-004
- **source_refs / decision_refs**：R-017 / D-024
- **动作**：修改生产实现并保留失败反例
- **精确文件**：`runtime/review/review-output.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`skills/wh-review/scripts/review-input-bounds.mjs`；`skills/wh-review/scripts/review-provider-client.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`；`tests/contract/review-materials-contract.test.mjs`；`skills/wh-review/scripts/__tests__/review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs`
- **boundary**：files: `runtime/review/review-output.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`skills/wh-review/scripts/review-input-bounds.mjs`；`skills/wh-review/scripts/review-provider-client.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`；`tests/contract/review-materials-contract.test.mjs`；`skills/wh-review/scripts/__tests__/review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs`；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；`tests/contract/review-layering.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：active GREEN `quality/tests/output/P4-green-findings-fixed.txt`（sha256=`d9ad1e11d643e268e4bbdb9feb3aedc7c650e340de034c13acd3c538bb21f68c`）；旧 `P4-green-anchor-protocol.txt` 与 `P4-green.txt` 保留为 provenance。
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-layering.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：0
- **oracle**：`ORACLE-FORMAT-REDLINES {"pass":"FORMAT-REDLINES 的全部 AC 通过且负例保留"}`
- **evidence_path**：active GREEN=`quality/tests/output/P4-green-findings-fixed.txt`（sha256=`d9ad1e11d643e268e4bbdb9feb3aedc7c650e340de034c13acd3c538bb21f68c`）；旧 `quality/tests/output/P4-green-anchor-protocol.txt` 与 `quality/tests/output/P4-green.txt` 保留 provenance。
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示实现 + paired targeted RED/GREEN）
- **status**：`completed` — the five allowlist production implementation files are landed, the legal paired T007 RED is recorded, and the current targeted GREEN fact is `7/7 files`, `207/207 tests`, `exit_code=0`; the prior `206/206` anchor remains provenance. This task status does not mark P4/Phase/Stage complete or review pass.
- **findings_fixed_green_writeback**：active GREEN 已切换到 `quality/tests/output/P4-green-findings-fixed.txt`（sha256=`d9ad1e11d643e268e4bbdb9feb3aedc7c650e340de034c13acd3c538bb21f68c`）。该文件由 canonical resolver + `TaskKernel.publishCanonicalRecord` create-only 发布并读回校验，canonical output sha/readback sha 相同，8,831 bytes；source `report.md` sha256=`ab6229db33ccf3b97de3605e7ebb566fdfe06074b88e327dc430045623472388`，`full-output.txt` sha256=`9e5f178a7ea94143542c65ad4bb8d49720c46fd0a9b43824e0f95e1f261f983b`。发布时 material_revision=`revision-f083e2935e930294f9fd2eb7182cd3ea03f5486bd4e0c53874908a59630449f5`；旧 `P4-green-anchor-protocol.txt` 与 `P4-green.txt` 不覆盖且继续保留 provenance。
- **actual_changes**：The landed T008 implementation boundary is exactly these five production files: `runtime/review/review-output.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/scripts/review-input-bounds.mjs`; `skills/wh-review/scripts/review-provider-client.mjs`; `skills/wh-review/scripts/simple-review-runner.mjs`. The legal T007 RED was obtained during implementation isolation, after which these five production files were restored byte-for-byte. This closeout added or modified no implementation/test bytes; the landed `review-materials.mjs` anchor validator now permits the real repo-relative `__tests__` path while all other fail-closed boundaries remain unchanged; existing dirty bytes remain preserved and are not attributed to this execution.
- **executed_commands**：historical RED and GREEN facts only, not rerun here. RED: `./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-layering.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`; `exit_code=1`; seven-file gate `7/7` files collected; `5 failed | 2 passed` files; `25 failed | 181 passed (206)` tests; `setup=0ms`; `environment=0ms`; setup/collection/environment failure count `0`. GREEN: same command; `exit_code=0`; `7/7` test files and `206/206` tests passed. Oracle=`ORACLE-FORMAT-REDLINES`. No test command was run in this closeout.
- **evidence_refs**：legal current RED `quality/tests/output/P4-red-clean.txt`, `526 lines / 24964 bytes`, sha256=`a2f54a7f0db50ca55a9050a24ab89fc009383386e67a55a7b9309f7e023b7449`, summary `P4-red-clean.txt:522-526`; active GREEN findings-fixed `quality/tests/output/P4-green-findings-fixed.txt`, `8831 bytes`, sha256=`d9ad1e11d643e268e4bbdb9feb3aedc7c650e340de034c13acd3c538bb21f68c`，readback sha256 同值；旧 GREEN anchor protocol `quality/tests/output/P4-green-anchor-protocol.txt`, `8072 bytes`, sha256=`da79a4e4e8e569aaa855c80da9697927e233cc5e0e1c102619476973427fb2eb`，以及 `quality/tests/output/P4-green.txt`, `58 lines / 6366 bytes`, sha256=`bc5ac1975d93b04212227326f14e0b46e09d287ab1a57351040d14e425d6b463` 保留为 provenance。T007's contaminated `P4-red.txt`/`P4-red-contaminated.txt` and `P4-red-pre-test-fix.txt` remain retained provenance; no `P4-red-green.txt` aggregate is claimed.
- **covered_ac**：`AC-FORMAT-001~004=paired targeted RED/GREEN observation` under `ORACLE-FORMAT-REDLINES`; implementation + legal RED + GREEN establish T008 task completion only. P4 review quality remains separate and unavailable/incomplete.
- **review_fact**：official review command `exit=0`；canonical_status=`unavailable`；terminal_status=`unavailable`；dispatch_state=`dispatched`；error=`EVIDENCE_ANCHOR_INVALID`（provider finding evidence does not anchor to submitted material）；provider_calls=`2`（`kimi/coding=failed`、`codex/luna=failed`）；findings=`[]`；coverage=`incomplete`；result_ref=`null`；无可接受 canonical findings。attempt_ref=`quality/reviews/attempts/f4e036cf-7ec2-571f-a961-49245928f44a/attempt.json`（sha256=`193edc4647e2eb013ea0d90a36203c5109e350b8782aad8581470e568b2051ee`）；report_ref=`quality/reviews/reports/build-code-simple-f4e036cf-7ec2-571f-a961-49245928f44a.md`（sha256=`7a8e7b76dc1c89ae950856ffb5d81292a8172963925aea4a747b0aa144535d80`）。identity：`HEAD=160778878912124c292f1beb0e5008299c396743`、`snapshot_tree=d2d3753d530ea072a8ed994d8bbb906a276478d6`、`material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`、`material_id=3320c28c2af55ca63f7dcb345263d282206bffd15a4942c75c5edce0d4e4485c`、`runtime_id=9f5bbad4-c84f-4ecc-ac7c-9c9a6af33d9d`。review unavailable/coverage incomplete 不是通过；不重试 provider。
- **completed_at**：`2026-09-18T11:29:47+08:00` (fact closeout timestamp).
- **执行事实**：T008 is complete at the task boundary: five allowlist production files are landed; the legal P4 RED is `P4-red-clean.txt`, sha256=`a2f54a7f0db50ca55a9050a24ab89fc009383386e67a55a7b9309f7e023b7449`, with `exit_code=1`, `7/7` files, `25 failed | 181 passed (206)`, `setup=0ms`, `environment=0ms`; the active P4 GREEN findings-fixed output is `quality/tests/output/P4-green-findings-fixed.txt`, sha256=`d9ad1e11d643e268e4bbdb9feb3aedc7c650e340de034c13acd3c538bb21f68c`, with the one-time recorded `7/7` files, `207/207 tests`, `setup=0`, `environment=0`, `fixture=0`, `exit=0`, Oracle=`ORACLE-FORMAT-REDLINES`; the canonical output was read back byte-identically. The repaired `review-materials.mjs` anchor validator permits the real repo-relative `__tests__` path and leaves other fail-closed boundaries unchanged. The current/fresh review remains `canonical_status=unavailable`, `terminal_status=unavailable`, `dispatch_state=dispatched`, error=`EVIDENCE_ANCHOR_INVALID`, provider_calls=`2`, findings=`[]`, coverage=`incomplete`, result_ref=`null`; review unavailable/coverage incomplete 不是通过，不重试 provider。旧 `P4-green-anchor-protocol.txt` 与 `P4-green.txt` 保留 provenance；P4 phase remains incomplete，P4/Phase/Stage completion、review pass、delivery 均未声明。identity：`HEAD=160778878912124c292f1beb0e5008299c396743`、`snapshot_tree=0f63caa3991d3322917ec03138886e0f9fdcdc42`、`material_revision_at_publication=revision-f083e2935e930294f9fd2eb7182cd3ea03f5486bd4e0c53874908a59630449f5`。
- **finding_dispositions_writeback**：仅登记处置事实，不改变原 review bytes、attempt/report/status 或 provenance，也不等价于 fresh review。来源为原 P4 review `quality/reviews/results/build-code-simple-4578adc4-a530-591b-a0b9-76e9e607f3f9.json`（sha256=`67461b156bfe4b39e3efb0749b00213f63322f7d377d5f37b3f3fdeca1d713d5`；原 `status=available`、`terminal_status=semantic`、`dispatch_state=dispatched`、`coverage=satisfied`），attempt=`quality/reviews/attempts/4578adc4-a530-591b-a0b9-76e9e607f3f9/attempt.json`（sha256=`bb33c2579e4642cfeff40a21f25c9b77bbe2a860c33d22b19cb6f573cdb5acdc`），report=`quality/reviews/reports/build-code-simple-4578adc4-a530-591b-a0b9-76e9e607f3f9.md`（sha256=`e7ef3fc5508a17bce85964ed0881c49da5f2dcbea4e27b5eccb87e6c2c6886b3`）；三条 finding 均为 `fixed`：`F-2645ad9c7ed8` quorum → `skills/wh-review/scripts/simple-review-runner.mjs:1263-1288` + `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs:285`；`F-f188cead048d` blocked→failed → `skills/wh-review/scripts/simple-review-runner.mjs:1489-1508` + `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs:1328`；`F-6969c4609ab7` private host → `skills/wh-review/scripts/review-provider-client.mjs:853-858` + `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs:233`。current/fresh P4 review 仍为 `unavailable`/`EVIDENCE_ANCHOR_INVALID`、`coverage=incomplete`，fresh review pending；P4 仍 `incomplete`，不宣称当前 review 已闭环。
- **current_material_revision_after_writeback**：`revision-465f070487de57f03acfa8cef177ab63f8fdc4edd9ad177cbc043f9e30542ad6`（TaskKernel canonical resolver readback after this tasks.md writeback）；发布时 evidence 绑定的 revision=`revision-f083e2935e930294f9fd2eb7182cd3ea03f5486bd4e0c53874908a59630449f5`。本次未写 `facts.jsonl`、`index.json` 或 `quality/facts/`。

### Verify

- **Target**：AC-FORMAT-001, AC-FORMAT-002, AC-FORMAT-003, AC-FORMAT-004
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-layering.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：current RED=`quality/tests/output/P4-red-clean.txt`（sha256=`a2f54a7f0db50ca55a9050a24ab89fc009383386e67a55a7b9309f7e023b7449`）；active GREEN=`quality/tests/output/P4-green-anchor-protocol.txt`（sha256=`da79a4e4e8e569aaa855c80da9697927e233cc5e0e1c102619476973427fb2eb`）；旧 `quality/tests/output/P4-green.txt` 保留 provenance；`quality/tests/output/P4-red-green.txt`：`not produced/not applicable`（Phase Card 明确无 aggregate；不宣称 aggregate 成功）
- **Oracle**：ORACLE-FORMAT-REDLINES。

### Knowledge

下一 Phase 只消费真实测试与 review facts；缺失/partial/unavailable 原样保留。

### STOP

- 命令损坏、oracle 不符、越界或需要新设计时返回 owning material。

### Done

- 对应 AC 有 RED/GREEN 原件、diff allowlist、独立 review 与大白话交接后才可填写 completed。

### Risks and rollback

- **Risk**：共享文件串行冲突或跨仓半发布。
- **Prevention**：按 plan 顺序与 changed-file allowlist。
- **Rollback / recovery**：只回滚当前 Phase，保留事实。

## Phase P5 — 两轨质量事实绑定

### Goal

direction/detail 仅绑定本轨 result，缺轨保持 missing；保留历史 provenance（attempt schema 的 process/parse outcome 登记已在 P1 落地，本 Phase 只做双轨绑定）。

### Files

- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`tests/e2e/vnext-five-stage-current.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

#### T009 — RED：两轨质量事实绑定
- **ID**：T009
- **Phase**：Phase P5 — 两轨质量事实绑定
- **goal**：建立目标行为的可证伪 RED
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T008
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-BINDING-001, FR-BINDING-002
- **AC**：AC-BINDING-001, AC-BINDING-002
- **source_refs / decision_refs**：R-014 / D-021
- **动作**：先写目标断言，不改生产实现
- **精确文件**：`tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**：files: `tests/e2e/vnext-five-stage-current.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P5-red.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`./node_modules/.bin/vitest run tests/e2e/vnext-five-stage-current.test.mjs -t "binds each make-decision review fact" --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：1
- **oracle**：`ORACLE-FACT-BINDING {"pass":"FACT-BINDING 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`
- **evidence_path**：`quality/tests/output/P5-red.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed` — 仅表示 T009 的目标 RED 事实已完成；不表示 T010 GREEN、P5 review 或 Phase complete。
- **actual_changes**：`tests/e2e/vnext-five-stage-current.test.mjs:897-942` 新增 FR-BINDING-001/002 对应的 AC-BINDING-001/002 目标断言；T009 未改生产实现。
- **executed_commands**：同一 targeted gate `./node_modules/.bin/vitest run tests/e2e/vnext-five-stage-current.test.mjs -t "binds each make-decision review fact" --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`，RED `exit=1`；`1 failed / 28 skipped (29)`，目标 assertion 在 `vnext-five-stage-current.test.mjs:921:34`，`setup=0ms`、`environment=0ms`，Oracle=`ORACLE-FACT-BINDING`。P5 route=`feature`、advisor=`pass`/exit=0、reroute=`no`；testing skill=`backend-testing`；route dry-run 首次因变量名错误 `exit=1`，修正后 `exit=0`。T009 gate 已实跑。
- **evidence_refs**：`quality/tests/output/P5-red.txt`，sha256=`477a8f84869d5fc6c0dbf1f1c76188cb522ad3cfd9ad6c7e27777fb78e11b007`，摘要 `P5-red.txt:4-7,33-40`；断言期望缺轨 `status=missing`、实际为错误跨轨回退后的 `status=recorded`。
- **covered_ac**：`FR-BINDING-001/002` / `AC-BINDING-001/002` 均有目标 RED 事实；失败由目标 assertion 产生，非环境或 setup 失败。
- **review_fact**：official review command `exit=0`；CLI `status=recorded`、`reused=false`、`dispatch_state=dispatched`；canonical_status=`unavailable`；terminal_status=`unavailable`；error=`REVIEW_WAIT_EXCEEDED`；wait_ms=`1200000`；broker_cancelled=`false`（未取消）；provider_calls=`0`（selected `kimi/coding`、`codex/luna`）；findings=`[]`；severity=`unavailable`；coverage=`incomplete`；result_ref=`null`；attempt_ref=`quality/reviews/attempts/62b132e5-a709-56a5-ac56-9503891e6e9a/attempt.json`（sha256=`8bf2a5726094762d897a0b0139ac019b43880eb5d4abb80cc61d2dba158b63ec`）；report_ref=`quality/reviews/reports/build-code-simple-62b132e5-a709-56a5-ac56-9503891e6e9a.md`（sha256=`70e07dd09b6594d937d7b0e2db9133df657dcf92b647a36259302bb15325c6a1`）。identity：`request_key=be20b6cbf36d5dbde621d8748e11bb17e446285b56ce1205e8c818574731c611`、`request_id=wh-review-0cd8f2711c7f7cb9047b9d63ae9f9ad35cbd6c7177e1021ffe0539e72fd6ed25`、`runtime_id=fcc64458-87dd-426e-a4c4-001c02758459`、`HEAD=160778878912124c292f1beb0e5008299c396743`、`snapshot_tree=33d1f648a17a47e153e7ab82bf3237cb7297b20e`、`material_id=27a0d9e94278dff9f9b0e59d774bcc5bdd36011ee24e51552897dec2465ef09b`、`material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`。review unavailable/incomplete 不是通过；不重试 provider。
- **completed_at**：`2026-09-18T12:05:58+08:00`
- **执行事实**：T009 完成 RED-only 任务边界；material_revision 保留为 `revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`。GREEN 由配对 T010 记录，不由本状态块单独宣称。

#### T010 — GREEN：两轨质量事实绑定
- **ID**：T010
- **Phase**：Phase P5 — 两轨质量事实绑定
- **goal**：以最小实现使同一 targeted gate 转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T009
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-BINDING-001, FR-BINDING-002
- **AC**：AC-BINDING-001, AC-BINDING-002
- **source_refs / decision_refs**：R-014 / D-021
- **动作**：修改生产实现并保留失败反例
- **精确文件**：`runtime/stage/stage-runner.mjs`；`tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**：files: `runtime/stage/stage-runner.mjs`；`tests/e2e/vnext-five-stage-current.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P5-green.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`./node_modules/.bin/vitest run tests/e2e/vnext-five-stage-current.test.mjs -t "binds each make-decision review fact" --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：0
- **oracle**：`ORACLE-FACT-BINDING {"pass":"FACT-BINDING 的全部 AC 通过且负例保留"}`
- **evidence_path**：`quality/tests/output/P5-green.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed` — 仅表示 T010 的最小实现与同一 targeted GREEN 已完成；不表示 P5 review 或 Phase complete。
- **actual_changes**：仅 `runtime/stage/stage-runner.mjs:1614-1616`；`evidenceCandidate` 原因是跨轨回退会把另一轨 result 误绑到缺轨 subject，新增直接 ref/hash 缺失时返回 `null` 的守卫。T009 的测试新增仍归 T009，T010 未扩大文件/行范围。
- **executed_commands**：同一 targeted gate `./node_modules/.bin/vitest run tests/e2e/vnext-five-stage-current.test.mjs -t "binds each make-decision review fact" --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`，GREEN `exit=0`；`1 passed / 28 skipped (29)`，`setup=0ms`、`environment=0ms`。静态 `node --check runtime/stage/stage-runner.mjs` `exit=0`；`git diff --check` `exit=0`。
- **evidence_refs**：`quality/tests/output/P5-green.txt`，sha256=`dca82b9f106e491fe7e81e767ad5d49f4a79dcb45d4c96df2c6d5372eb4f8afa`，摘要 `P5-green.txt:1-44`；GREEN 明确 `paired_task=T009`、Oracle=`ORACLE-FACT-BINDING`，并保持 material_revision=`revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`。
- **covered_ac**：`AC-BINDING-001/002` targeted GREEN 通过；仅为本卡 gate 覆盖，不宣称全量回归或 review 通过。
- **review_fact**：official review command `exit=0`；CLI `status=recorded`、`reused=false`、`dispatch_state=dispatched`；canonical_status=`unavailable`；terminal_status=`unavailable`；error=`REVIEW_WAIT_EXCEEDED`；wait_ms=`1200000`；broker_cancelled=`false`（未取消）；provider_calls=`0`（selected `kimi/coding`、`codex/luna`）；findings=`[]`；severity=`unavailable`；coverage=`incomplete`；result_ref=`null`；attempt_ref=`quality/reviews/attempts/62b132e5-a709-56a5-ac56-9503891e6e9a/attempt.json`（sha256=`8bf2a5726094762d897a0b0139ac019b43880eb5d4abb80cc61d2dba158b63ec`）；report_ref=`quality/reviews/reports/build-code-simple-62b132e5-a709-56a5-ac56-9503891e6e9a.md`（sha256=`70e07dd09b6594d937d7b0e2db9133df657dcf92b647a36259302bb15325c6a1`）。identity：`request_key=be20b6cbf36d5dbde621d8748e11bb17e446285b56ce1205e8c818574731c611`、`request_id=wh-review-0cd8f2711c7f7cb9047b9d63ae9f9ad35cbd6c7177e1021ffe0539e72fd6ed25`、`runtime_id=fcc64458-87dd-426e-a4c4-001c02758459`、`HEAD=160778878912124c292f1beb0e5008299c396743`、`snapshot_tree=33d1f648a17a47e153e7ab82bf3237cb7297b20e`、`material_id=27a0d9e94278dff9f9b0e59d774bcc5bdd36011ee24e51552897dec2465ef09b`、`material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`。review unavailable/incomplete 不是通过；不重试 provider。
- **completed_at**：`2026-09-18T12:05:58+08:00`
- **执行事实**：T010 只收口为 `stage-runner.mjs:1614-1616` 的实现 + 绑定 T009 的 GREEN；P5 状态仍为 `incomplete`/review unavailable，不开始 T011。

### Verify

- **Target**：AC-BINDING-001, AC-BINDING-002
- **gate_cmd**：`./node_modules/.bin/vitest run tests/e2e/vnext-five-stage-current.test.mjs -t "binds each make-decision review fact" --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：current RED=`quality/tests/output/P5-red.txt`（sha256=`477a8f84869d5fc6c0dbf1f1c76188cb522ad3cfd9ad6c7e27777fb78e11b007`）；current GREEN=`quality/tests/output/P5-green.txt`（sha256=`dca82b9f106e491fe7e81e767ad5d49f4a79dcb45d4c96df2c6d5372eb4f8afa`）；`quality/tests/output/P5-red-green.txt`：`not produced/not applicable`（仅保留 RED/GREEN individual refs；不宣称 aggregate 成功）
- **Oracle**：ORACLE-FACT-BINDING。

### Knowledge

下一 Phase 只消费真实测试与 review facts；缺失/partial/unavailable 原样保留。

### STOP

- 命令损坏、oracle 不符、越界或需要新设计时返回 owning material。

### Done

- 对应 AC 有 RED/GREEN 原件、diff allowlist、独立 review 与大白话交接后才可填写 completed。

### Risks and rollback

- **Risk**：共享文件串行冲突或跨仓半发布。
- **Prevention**：按 plan 顺序与 changed-file allowlist。
- **Rollback / recovery**：只回滚当前 Phase，保留事实。

## Phase P6 — 证据重采、私锁与 DEF-09 净减清理

### Goal

删除 fresh 强制重采、死 freshness 接口与 15 分钟专属锁，删除 DEF-09 旧字面量；保留源稳定性 revision/hash 防护。三个 freshness 测试文件（per-ac-material-freshness、freshness-consistency、verify-freshness-selection）改为删除断言语义：断言对死接口无引用且 stage-runner 2507-2511 的材料 revision/hash 稳定性防护保留，而非继续运行旧行为断言。

### Files

- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`runtime/evidence/freshness.mjs`
- **MODIFY**：`skills/wh-review/scripts/wh-review-cli.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **MODIFY**：`tests/contract/per-ac-material-freshness.test.mjs`
- **MODIFY**：`tests/close/freshness-consistency.test.mjs`
- **MODIFY**：`tests/integration/verify-freshness-selection.test.mjs`
- **MODIFY**：`tests/e2e/ui-e2e-contract-dogfood.test.mjs`
- **MODIFY**：`tests/contract/performance-budget.test.mjs`
- **MODIFY**：`tests/contract/stage-runner-on-stage-end.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

#### T011 — RED：证据重采、私锁与 DEF-09 净减清理
- **ID**：T011
- **Phase**：Phase P6 — 证据重采、私锁与 DEF-09 净减清理
- **goal**：建立目标行为的可证伪 RED
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T010
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-CLEANUP-001, FR-CLEANUP-002, FR-CLEANUP-003
- **AC**：AC-CLEANUP-001, AC-CLEANUP-002, AC-CLEANUP-003
- **source_refs / decision_refs**：R-001, R-002 / D-006, D-010, D-012, D-013, D-016
- **动作**：先写目标断言，不改生产实现
- **精确文件**：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`tests/contract/per-ac-material-freshness.test.mjs`；`tests/close/freshness-consistency.test.mjs`；`tests/integration/verify-freshness-selection.test.mjs`；`tests/e2e/ui-e2e-contract-dogfood.test.mjs`；`tests/contract/performance-budget.test.mjs`；`tests/contract/stage-runner-on-stage-end.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`tests/contract/per-ac-material-freshness.test.mjs`；`tests/close/freshness-consistency.test.mjs`；`tests/integration/verify-freshness-selection.test.mjs`；`tests/e2e/ui-e2e-contract-dogfood.test.mjs`；`tests/contract/performance-budget.test.mjs`；`tests/contract/stage-runner-on-stage-end.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P6-red.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/performance-budget.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/e2e/ui-e2e-contract-dogfood.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/close/freshness-consistency.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=30000 --hookTimeout=15000`
- **expected_exit**：1
- **oracle**：`ORACLE-CLEANUP-NEGATIVE {"pass":"CLEANUP-NEGATIVE 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`
- **evidence_path**：`quality/tests/output/P6-red.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示合法 P6 RED 事实已完成）
- **status**：`completed` — 仅表示 T011 的合法 targeted RED 已建立；不表示 T012/P6、Phase、Stage 完成或 review pass。
- **actual_changes**：本轮只写回任务事实；未改生产代码、测试代码、decision-log/spec/plan、canonical facts/index，未提交。P6-red 原始失败 provenance 保留。
- **executed_commands**：T011 receipt 记录的命令为 `perl -0777 -pe 'chop' /tmp/workflowhub-p6-red-20260918.txt; exit 1`，receipt `exit_code=1`；原始 P6-red 输出保留其 targeted 失败事实，含 `2 failed | 5 passed` 文件级结果、`6 failed | 57 passed | 1 skipped (64)` 测试级结果及环境/收集失败为 0 的记录。
- **evidence_refs**：`quality/tests/P6-red.json`，sha256=`aff04841f39fed0737598c6ec68f97d0d7c72f1ed732b86d0216b24e59baa337`；输出 `quality/tests/output/P6-red.output`，sha256=`68696171f97e1e6b95aacd3801e5d764398492f07f53f277caf17bb06eb6cbe1`。旧 `quality/tests/P6-green.json` 及 `quality/tests/output/P6-green.output` 的失败/污染记录不覆盖本事实，继续保留 provenance。
- **covered_ac**：`AC-CLEANUP-001~003=RED`；失败来自目标清理/反例断言，未把 P6-green 或阶段完成写成通过。
- **review_fact**：本状态块不宣称 review pass；P6 phase review 后续事实单独保留为 `REVIEW_RETRY_NOT_ADMITTED` / `blocked_before_dispatch`。
- **completed_at**：`2026-09-18T22:34:38+08:00`（T011 receipt `started_at`/`completed_at` 对应的事实时间）。
- **执行事实**：T011 从 `pending` → `completed` 仅因合法 RED 原件已读回；保留 P6-red 及更早 provenance，不产生 RED→GREEN aggregate，不推进 P6/Phase/Stage。

#### T012 — GREEN：证据重采、私锁与 DEF-09 净减清理
- **ID**：T012
- **Phase**：Phase P6 — 证据重采、私锁与 DEF-09 净减清理
- **goal**：以最小实现使同一 targeted gate 转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T011
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-CLEANUP-001, FR-CLEANUP-002, FR-CLEANUP-003
- **AC**：AC-CLEANUP-001, AC-CLEANUP-002, AC-CLEANUP-003
- **source_refs / decision_refs**：R-001, R-002 / D-006, D-010, D-012, D-013, D-016
- **动作**：修改生产实现并保留失败反例
- **精确文件**：`runtime/stage/stage-runner.mjs`；`runtime/evidence/freshness.mjs`；`skills/wh-review/scripts/wh-review-cli.mjs`；`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`tests/contract/per-ac-material-freshness.test.mjs`；`tests/close/freshness-consistency.test.mjs`；`tests/integration/verify-freshness-selection.test.mjs`；`tests/e2e/ui-e2e-contract-dogfood.test.mjs`；`tests/contract/performance-budget.test.mjs`；`tests/contract/stage-runner-on-stage-end.test.mjs`
- **boundary**：files: `runtime/stage/stage-runner.mjs`；`runtime/evidence/freshness.mjs`；`skills/wh-review/scripts/wh-review-cli.mjs`；`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`tests/contract/per-ac-material-freshness.test.mjs`；`tests/close/freshness-consistency.test.mjs`；`tests/integration/verify-freshness-selection.test.mjs`；`tests/e2e/ui-e2e-contract-dogfood.test.mjs`；`tests/contract/performance-budget.test.mjs`；`tests/contract/stage-runner-on-stage-end.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P6-green.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/performance-budget.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/e2e/ui-e2e-contract-dogfood.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/close/freshness-consistency.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=30000 --hookTimeout=15000`
- **expected_exit**：0
- **oracle**：`ORACLE-CLEANUP-NEGATIVE {"pass":"CLEANUP-NEGATIVE 的全部 AC 通过且负例保留"}`
- **evidence_path**：`quality/tests/output/P6-green.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示实现 + current targeted GREEN）
- **status**：`completed` — 仅表示 T012 实现与当前 targeted GREEN 已完成；不表示 P6、Phase、Stage 完成或 review pass。
- **actual_changes**：本轮只写回 task facts；认证 worktree 已存在的 P6 实现/测试改动不归因于本次写回。未改 production/test bytes、decision-log/spec/plan、canonical facts/index，未提交。
- **executed_commands**：current canonical P6 GREEN receipt 的命令为 `./node_modules/.bin/vitest run tests/contract/performance-budget.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/e2e/ui-e2e-contract-dogfood.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/close/freshness-consistency.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=30000 --hookTimeout=15000`，`exit_code=0`，`7 passed` files，`59 passed / 1 skipped / 0 failed`。
- **evidence_refs**：官方 resolver readback `quality/tests/P6-green-v2.json`，sha256=`7f86b5388d203ef0506df744ad14a232e4105c340fcf5a394ed8f66860e8a659`；输出 `quality/tests/output/P6-green-v2.output`，sha256=`413e20e3f516470fa2239d15e123e321b7bb3c3d0ba6d1cba084bc92a79a73`；snapshot=`2d89eed5b033172253805b1df1004e7ed9f9987a`，material_revision=`revision-465f070487de57f03acfa8cef177ab63f8fdc4edd9ad177cbc043f9e30542ad6`。P6-red 仍按 T011 保留，未生成/宣称 P6-red-green aggregate。
- **covered_ac**：`AC-CLEANUP-001=PASS`、`AC-CLEANUP-002=PASS`、`AC-CLEANUP-003=PASS`，以 P6-green-v2 当前 readback 为准；`P6-green.json` 的早期失败记录保持 provenance，不覆盖 current GREEN。
- **review_fact**：P6 phase review=`REVIEW_RETRY_NOT_ADMITTED` / `blocked_before_dispatch`；这是 review/质量事实，不是 T012 失败，也不改写为 pass；P6、Phase、Stage completion 不宣称。
- **completed_at**：`2026-09-18T22:55:15+08:00`（P6-green-v2 receipt `completed_at`）。
- **执行事实**：T012 从 `pending` → `completed` 仅收口为实现 + current targeted GREEN。附带本轮已产生的跨仓事实：G5 producer projection 在 `/Users/Hugh/Hugh/Project/3rd-review` 的实际变更文件为 `lib/adapters/antigravity.mjs`、`lib/broker.mjs`、`lib/provider-failure.mjs`、`lib/recovery-policy.mjs`、`lib/workflowhub-result-v3.mjs`、`test/attachments-protocol.test.mjs`、`test/managed-session-lifecycle.test.mjs`、`test/workflowhub-result-v3.test.mjs`；当前三文件 targeted run 为 `exit=0`、`76/76 passed`、`0 failed/0 skipped`，非 canonical readback 原始输出 `/private/tmp/3rd-review-g5-g6-targeted.out`，sha256=`1d3aa02e85b2e56d4ed827b05d6762db49cda7da11f2db3ffe62729a8f72f427`。G5 WorkflowHub targeted canonical receipt `quality/tests/build-code-cost-baseline-G5-targeted.json` sha256=`b8c89f89f2ac1da710c9ece2713bfa495df5918b8cd8f45eadbe021d31105e6b`，其输出 `quality/tests/output/build-code-cost-baseline-G5-targeted.output` sha256=`79d39c91937ddae966a02d6a3d1a741d446149788df58a51d1d7b56a23c892b6`，readback=`exit=0 / 243 passed`。G6 `cancelManaged` RED→GREEN 事实：managed running/terminal projection、provider-free cancel、polluted-member isolation 相关断言已包含在上述 `/Users/Hugh/Hugh/Project/3rd-review/test/managed-session-lifecycle.test.mjs` targeted GREEN；独立 G6-red canonical receipt 未找到，保留为 RED→GREEN 事实而不伪造额外 receipt。

### Verify

- **Target**：AC-CLEANUP-001, AC-CLEANUP-002, AC-CLEANUP-003
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/performance-budget.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/e2e/ui-e2e-contract-dogfood.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/close/freshness-consistency.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=30000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/output/P6-red-green.txt`
- **Oracle**：ORACLE-CLEANUP-NEGATIVE。

### Knowledge

下一 Phase 只消费真实测试与 review facts；缺失/partial/unavailable 原样保留。

### STOP

- 命令损坏、oracle 不符、越界或需要新设计时返回 owning material。

### Done

- 对应 AC 有 RED/GREEN 原件、diff allowlist、独立 review 与大白话交接后才可填写 completed。

### Risks and rollback

- **Risk**：共享文件串行冲突或跨仓半发布。
- **Prevention**：按 plan 顺序与 changed-file allowlist。
- **Rollback / recovery**：只回滚当前 Phase，保留事实。

## Phase P7 — OI-26 冻结纪律与确认读侧对称

### Goal

补齐 make-decision/build-spec/build-plan 冻结纪律和 step 12 确认说明；读侧复用合法非材料差异，decision-log 实质变化仍使确认失效。文档冻结的文本断言落在 freeze-classification-budget-usage-protocol.test.mjs（已在本 Phase gate 内），不断言未 gate 的文件。

### Files

- **MODIFY**：`workflows/make-decision/SKILL.md`
- **MODIFY**：`workflows/build-spec/SKILL.md`
- **MODIFY**：`workflows/build-plan/SKILL.md`
- **MODIFY**：`docs/standard-workflow.md`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`tests/contract/human-confirmation-v3.test.mjs`
- **MODIFY**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

#### T013 — RED：OI-26 冻结纪律与确认读侧对称
- **ID**：T013
- **Phase**：Phase P7 — OI-26 冻结纪律与确认读侧对称
- **goal**：建立目标行为的可证伪 RED
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T012
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-REBIND-001, FR-REBIND-002, FR-REBIND-003, FR-REBIND-004
- **AC**：AC-REBIND-001, AC-REBIND-002, AC-REBIND-003, AC-REBIND-004
- **source_refs / decision_refs**：R-018 / D-026
- **动作**：先写目标断言，不改生产实现
- **精确文件**：`tests/contract/human-confirmation-v3.test.mjs`；`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `tests/contract/human-confirmation-v3.test.mjs`；`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P7-red.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：RED
- **paired_task**：T014
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/human-confirmation-v3.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：1
- **oracle**：`ORACLE-CONFIRM-REBIND {"pass":"CONFIRM-REBIND 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`
- **evidence_path**：`quality/tests/output/P7-red.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示合法 targeted RED 事实已建立）
- **status**：`completed` — T013 的 targeted RED 已真实产生；不表示 P7/Phase/Stage 完成或 review pass。
- **actual_changes**：仅建立本卡两个测试文件的目标断言事实；本次 task-fact writeback 未改生产代码、测试代码或其他材料。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/human-confirmation-v3.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`，`exit_code=1`；`2 files`，`56 passed / 4 failed / 0 skipped`，失败来自目标断言，不是环境或 fixture setup。
- **evidence_refs**：目标 RED 原始输出未被当前官方 resolver 读到；此前非 canonical/错误路径不重写，故 `P7-red receipt=unavailable`。保留该不可用事实，不伪造 receipt/hash。
- **covered_ac**：`AC-REBIND-001/002/003/004=RED`；目标断言失败，P7-red 仅作为真实 RED provenance，不宣称通过。
- **route_and_testing**：route advisor planned=`feature`，actual boundary=`fullstack`，`reroute=yes`；原因：实际变更/消费者跨越 stage/runtime 与 contract 测试边界，feature route 不能覆盖真实 fullstack consumer。`backend-testing` 已读取并作为本卡 testing skill 事实保留。
- **review_fact**：`unavailable` / not executed；独立 phase review 与 handoff 未在本卡事实中生成，不阻止 task 在已产生 RED 事实边界完成，但 P7/Phase 保持 `incomplete`。
- **completed_at**：`2026-09-19T01:55:44+08:00`（task-fact writeback timestamp）。
- **执行事实**：T013 已完成 RED-only 任务边界；保持 P7 review/handoff 缺失、P7 receipt unavailable、无生产/材料语义改动、未提交。

#### T014 — GREEN：OI-26 冻结纪律与确认读侧对称
- **ID**：T014
- **Phase**：Phase P7 — OI-26 冻结纪律与确认读侧对称
- **goal**：以最小实现使同一 targeted gate 转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T013
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-REBIND-001, FR-REBIND-002, FR-REBIND-003, FR-REBIND-004
- **AC**：AC-REBIND-001, AC-REBIND-002, AC-REBIND-003, AC-REBIND-004
- **source_refs / decision_refs**：R-018 / D-026
- **动作**：修改生产实现并保留失败反例
- **精确文件**：`workflows/make-decision/SKILL.md`；`workflows/build-spec/SKILL.md`；`workflows/build-plan/SKILL.md`；`docs/standard-workflow.md`；`runtime/stage/stage-runner.mjs`；`tests/contract/human-confirmation-v3.test.mjs`；`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `workflows/make-decision/SKILL.md`；`workflows/build-spec/SKILL.md`；`workflows/build-plan/SKILL.md`；`docs/standard-workflow.md`；`runtime/stage/stage-runner.mjs`；`tests/contract/human-confirmation-v3.test.mjs`；`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P7-green.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：GREEN
- **paired_task**：T013
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/human-confirmation-v3.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：0
- **oracle**：`ORACLE-CONFIRM-REBIND {"pass":"CONFIRM-REBIND 的全部 AC 通过且负例保留"}`
- **evidence_path**：`quality/tests/output/P7-green.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示实现 + paired targeted GREEN）
- **status**：`completed` — T014 同一 targeted gate 已真实转绿；不表示 P7/Phase/Stage 完成或 review pass。
- **actual_changes**：历史实现与测试改动均在 T014 卡声明的 allowlist 内；本次只更新任务事实，不改生产代码、测试代码或其他材料。
- **executed_commands**：同一命令 `./node_modules/.bin/vitest run tests/contract/human-confirmation-v3.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`，`exit_code=0`；`2 files`，`60 passed`。`AC-REBIND-001/002/003/004=PASS`。
- **evidence_refs**：`P7-red receipt=unavailable`、`P7-green receipt=unavailable`；当前官方 resolver 未读到对应 P7 receipt，先前错误路径不重写。P7-green raw output 亦无当前 canonical ref/hash，保留 `unavailable`。
- **covered_ac**：`AC-REBIND-001=PASS`、`AC-REBIND-002=PASS`、`AC-REBIND-003=PASS`、`AC-REBIND-004=PASS`；以本次真实 targeted GREEN 结果为准，receipt 缺失仍限制 P7/Phase 质量声明。
- **review_fact**：`unavailable` / not executed；独立 phase review 与 handoff 缺失不改写为 pass，不阻止 task 完成，但 P7/Phase 保持 `incomplete`。
- **completed_at**：`2026-09-19T01:55:44+08:00`（task-fact writeback timestamp）。
- **执行事实**：T014 已完成实现 + paired targeted GREEN 任务边界；P7 receipt 不可用事实、review/handoff 缺失、未提交均保留。

### Verify

- **Target**：AC-REBIND-001, AC-REBIND-002, AC-REBIND-003, AC-REBIND-004
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/human-confirmation-v3.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/output/P7-red-green.txt`
- **Oracle**：ORACLE-CONFIRM-REBIND。

### Knowledge

下一 Phase 只消费真实测试与 review facts；缺失/partial/unavailable 原样保留。

### STOP

- 命令损坏、oracle 不符、越界或需要新设计时返回 owning material。

### Done

- 对应 AC 有 RED/GREEN 原件、diff allowlist、独立 review 与大白话交接后才可填写 completed。

### Risks and rollback

- **Risk**：共享文件串行冲突或跨仓半发布。
- **Prevention**：按 plan 顺序与 changed-file allowlist。
- **Rollback / recovery**：只回滚当前 Phase，保留事实。

## Phase P8 — 声明哈希、治理边界与最终聚合

### Goal

修复两个既有红灯并逐项审计十条治理边界、外仓授权、延期交付和唯一验收账本；最终只聚合受影响 targeted checks。

### Files

- **MODIFY**：`skills/spec-analyze/skill-bundle.json`
- **MODIFY**：`skills/stage-handoff/skill-bundle.json`
- **MODIFY**：`skills/stage-reflection/skill-bundle.json`
- **MODIFY**：`skills/catalog.yaml`
- **MODIFY**：`skills/wh-review/skill-bundle.json`
- **MODIFY**：`workflows/make-decision/SKILL.md`
- **MODIFY**：`workflows/build-spec/SKILL.md`
- **MODIFY**：`workflows/build-plan/SKILL.md`
- **MODIFY**：`workflows/build-code/SKILL.md`
- **MODIFY**：`workflows/verify-code/SKILL.md`
- **MODIFY**：`tests/contract/stage-reflection-wiring.test.mjs`
- **MODIFY**：`/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

#### T015 — RED：声明哈希、治理边界与最终聚合
- **ID**：T015
- **Phase**：Phase P8 — 声明哈希、治理边界与最终聚合
- **goal**：建立目标行为的可证伪 RED
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T014
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-CLEANUP-004, FR-GOV-001, FR-GOV-002, FR-GOV-003, FR-GOV-004, FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010
- **AC**：AC-CLEANUP-004, AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010
- **source_refs / decision_refs**：R-002, R-003, R-004, R-005, R-006, R-007, R-008, R-009, R-010, R-011, R-012, R-013 / D-001, D-002, D-006, D-007, D-008, D-009, D-013, D-014, D-015, D-017, D-018, D-020
- **动作**：先写目标断言，不改生产实现
- **精确文件**：`tests/contract/stage-reflection-wiring.test.mjs`
- **boundary**：files: `tests/contract/stage-reflection-wiring.test.mjs`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P8-red.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：RED
- **paired_task**：T016
- **gate_cmd**：`node --input-type=module --eval 'import{basename}from"node:path";import{readdirSync,readFileSync}from"node:fs";import{captureExecutionSnapshot,materialRevisionFromValues}from"./runtime/task/git-worktree-snapshot.mjs";const d=process.argv[1],id=basename(d),root="specs/"+id,current=materialRevisionFromValues(["decision-log.md","spec.md","plan.md","tasks.md"].map(n=>[n,readFileSync(root+"/"+n,"utf8")])),tree=captureExecutionSnapshot(process.cwd(),id).tree,ids=[...new Set([...readFileSync(root+"/tasks.md","utf8").matchAll(/AC-[A-Z0-9]+-[0-9]{3}/g)].map(m=>m[0]))],facts=new Map(),rank={passed:0,unavailable:1,unknown:2,missing:3,failed:4};for(const f of readdirSync(d+"/quality/facts")){if(!f.endsWith(".json"))continue;try{const v=JSON.parse(readFileSync(d+"/quality/facts/"+f,"utf8")),s=v.status??"unavailable";if(v.task_id===id&&v.stage==="build-code"&&v.material_revision===current&&v.snapshot_tree===tree&&ids.includes(v.subject)&&(!facts.has(v.subject)||rank[s]>rank[facts.get(v.subject)]))facts.set(v.subject,s)}catch{}}process.stdout.write(JSON.stringify({entries:ids.map(acceptance_criterion_id=>({acceptance_criterion_id,assertions:[{id:"current-canonical-fact",expected:{status:"passed"},actual:{status:facts.get(acceptance_criterion_id)??"unavailable"}}]}))}))' $TASK_DIR`
- **expected_exit**：1
- **oracle**：`ORACLE-FINAL-GOVERNANCE {"pass":"FINAL-GOVERNANCE 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`
- **evidence_path**：`quality/tests/output/P8-red.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示真实 targeted RED 事实已建立）
- **status**：`completed` — T015 已记录独立 P8 五项 RED 事实；不表示 P8/Phase/Stage 完成或 review pass。
- **actual_changes**：T015 仅对应 P8 目标测试/检查事实；本次 task-fact writeback 未改生产代码、测试代码或其他材料。
- **executed_commands**：旧总 gate 的历史尝试真实 `exit_code=124`、`300136ms` timeout，只作历史 provenance，不作为独立 P8 结论。独立五项真实结果：`check-skill-closure exit=1`（`23 hash mismatch`）；`smoke-local-skill-dispatch exit=1`；`verify-structure exit=0`；`run-checks exit=0`；`stage-reflection` `10/15 fail`。不把旧 timeout 重写成 skipped/pass。
- **evidence_refs**：旧 timeout canonical receipt `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-cost-baseline-and-blocker-close-20260917/quality/tests/P8-red-v2.json`，sha256=`b0f18a0467144cdc9d20893b9d25f1abc1f6abc0459d19a2f77831974f0eb383`；raw output `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-cost-baseline-and-blocker-close-20260917/quality/tests/output/P8-red-v2.txt`，sha256=`e20a4339af85d4d37fd901c52435374da20575852c31d752fe9475c113762a21`。两者只绑定 timeout provenance；独立五项结果按本次真实执行事实登记。
- **covered_ac**：`AC-CLEANUP-004`、`AC-GOV-001..010`：P8 RED 目标未全通过；`check-skill-closure` 的 23 项 hash mismatch、smoke 红灯及 stage-reflection `10/15 fail` 保持可见，`verify-structure`/`run-checks` 的 exit 0 不均摊为全体通过。
- **review_fact**：`unavailable` / not executed；独立 phase review 与 handoff 缺失不阻止 task 在 RED 事实边界完成，但 P8/Phase 保持 `incomplete`。
- **completed_at**：`2026-09-19T01:55:44+08:00`（task-fact writeback timestamp）。
- **执行事实**：T015 已完成独立 P8 RED 事实登记；旧总 gate timeout 保留为历史，未伪造 clean RED、未提交。

#### T016 — GREEN：声明哈希、治理边界与最终聚合
- **ID**：T016
- **Phase**：Phase P8 — 声明哈希、治理边界与最终聚合
- **goal**：以最小实现使同一 targeted gate 转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：accepted spec/plan 与已核实 anchors
- **依赖**：T015
- **并行**：否 — RED/GREEN 与共享文件严格串行
- **FR**：FR-CLEANUP-004, FR-GOV-001, FR-GOV-002, FR-GOV-003, FR-GOV-004, FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010
- **AC**：AC-CLEANUP-004, AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010
- **source_refs / decision_refs**：R-002, R-003, R-004, R-005, R-006, R-007, R-008, R-009, R-010, R-011, R-012, R-013 / D-001, D-002, D-006, D-007, D-008, D-009, D-013, D-014, D-015, D-017, D-018, D-020
- **动作**：修改声明文件（skill-bundle/catalog/SKILL 文本）并保留失败反例；同卡把 DEF-01~09 按 decision-log 来源与 owner 写入 /Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md，并逐条核对一致
- **精确文件**：`skills/spec-analyze/skill-bundle.json`；`skills/stage-handoff/skill-bundle.json`；`skills/stage-reflection/skill-bundle.json`；`skills/catalog.yaml`；`skills/wh-review/skill-bundle.json`；`workflows/make-decision/SKILL.md`；`workflows/build-spec/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；`tests/contract/stage-reflection-wiring.test.mjs`；`/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`
- **boundary**：files: `skills/spec-analyze/skill-bundle.json`；`skills/stage-handoff/skill-bundle.json`；`skills/stage-reflection/skill-bundle.json`；`skills/catalog.yaml`；`skills/wh-review/skill-bundle.json`；`workflows/make-decision/SKILL.md`；`workflows/build-spec/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；`tests/contract/stage-reflection-wiring.test.mjs`；`/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/output/P8-green.txt`
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：GREEN
- **paired_task**：T015
- **gate_cmd**：`node --input-type=module --eval 'import{basename}from"node:path";import{readdirSync,readFileSync}from"node:fs";import{captureExecutionSnapshot,materialRevisionFromValues}from"./runtime/task/git-worktree-snapshot.mjs";const d=process.argv[1],id=basename(d),root="specs/"+id,current=materialRevisionFromValues(["decision-log.md","spec.md","plan.md","tasks.md"].map(n=>[n,readFileSync(root+"/"+n,"utf8")])),tree=captureExecutionSnapshot(process.cwd(),id).tree,ids=[...new Set([...readFileSync(root+"/tasks.md","utf8").matchAll(/AC-[A-Z0-9]+-[0-9]{3}/g)].map(m=>m[0]))],facts=new Map(),rank={passed:0,unavailable:1,unknown:2,missing:3,failed:4};for(const f of readdirSync(d+"/quality/facts")){if(!f.endsWith(".json"))continue;try{const v=JSON.parse(readFileSync(d+"/quality/facts/"+f,"utf8")),s=v.status??"unavailable";if(v.task_id===id&&v.stage==="build-code"&&v.material_revision===current&&v.snapshot_tree===tree&&ids.includes(v.subject)&&(!facts.has(v.subject)||rank[s]>rank[facts.get(v.subject)]))facts.set(v.subject,s)}catch{}}process.stdout.write(JSON.stringify({entries:ids.map(acceptance_criterion_id=>({acceptance_criterion_id,assertions:[{id:"current-canonical-fact",expected:{status:"passed"},actual:{status:facts.get(acceptance_criterion_id)??"unavailable"}}]}))}))' $TASK_DIR`
- **expected_exit**：0（命令只输出事实；逐 AC assertion 的 actual 决定是否满足 ORACLE）
- **oracle**：`ORACLE-FINAL-GOVERNANCE {"pass":"FINAL-GOVERNANCE 的全部 AC 通过且负例保留"}`
- **evidence_path**：`quality/tests/output/P8-green.txt`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：feature — targeted local tests only；runtime profile=phase；ceiling=300000ms。
- **scenarios / commands / expected exit / oracle**：成功、失败、状态与跨仓 seam 使用本卡同一 gate_cmd / ORACLE。
- **fixtures_services**：确定性 fake CLI/tmpdir；无真实网络/provider；执行后清理。
- **coverage limits**：仅覆盖列出的 FR/AC，不宣称全量回归。
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#11-验收标准
- **semantic_review_reason**：RED/GREEN 按 accepted AC 四段与相同 oracle 设计。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示实现 + paired independent GREEN）
- **status**：`completed` — T016 的独立五项检查已全 exit 0，stage-reflection 已 `15/15`；不表示 P8/Phase/Stage 完成或 review pass。
- **actual_changes**：catalog 三 hash 同步，并修复 stage-reflection/handoff/GOV 措辞测试；本次 task-fact writeback 未改生产代码、测试代码或其他材料。
- **executed_commands**：独立五项全 `exit_code=0`：`check-skill-closure`、`smoke-local-skill-dispatch`、`verify-structure`、`run-checks`、`stage-reflection`；`stage-reflection=15/15`。保留 P8-red-v2 timeout provenance，不重写。
- **evidence_refs**：官方 resolver 可读的 canonical receipt `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-cost-baseline-and-blocker-close-20260917/quality/tests/P8-green.json`，sha256=`565da2c4933cc3ec3c7a6aa4e5c244424c634671bafa4f0e57d29f2fc84914ff`；canonical output `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-cost-baseline-and-blocker-close-20260917/quality/tests/output/P8-green.txt`，sha256=`4a405c830a309b8f554de2acd9358929884a3d229ee53575a9c30147550a4076`。receipt 内 `output_hash` 与 output bytes hash 一致。
- **covered_ac**：`AC-CLEANUP-004`、`AC-GOV-001..010=GREEN observation`；catalog 三 hash 同步、stage-reflection/handoff/GOV 措辞测试修复均有对应独立检查事实。质量 review/handoff 缺失仍限制 P8/Phase 声明。
- **review_fact**：`unavailable` / not executed；独立 phase review 与 handoff 缺失不阻止 task 完成，但 P8/Phase 保持 `incomplete`。
- **completed_at**：`2026-09-19T01:55:44+08:00`（task-fact writeback timestamp）。
- **执行事实**：T016 已完成实现 + paired independent GREEN 任务边界；P8-green canonical receipt/output ref/hash 可读且保留，未提交。

#### T017 — FINAL：targeted aggregate
- **ID**：T017
- **Phase**：Phase P8 — 声明哈希、治理边界与最终聚合
- **goal**：对全部适用 AC 做一次有界 current canonical facts 与 focused receipt readback；复用当前 receipt，不重复执行 provider 或跨仓长流程
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847","id":"SPEC-COST-BASELINE"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3","id":"DECISION-COST-BASELINE"}]`
- **输入**：全部前序 GREEN 与当前四材料
- **依赖**：T016
- **并行**：否 — 最终聚合读取全部前序事实
- **FR**：FR-WAIT-001, FR-WAIT-002, FR-HEALTH-003, FR-HEALTH-004, FR-BROKER-004, FR-HEALTH-001, FR-HEALTH-002, FR-BROKER-001, FR-BROKER-002, FR-BROKER-003, FR-PREFLIGHT-001, FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-CLEANUP-005, FR-FORMAT-001, FR-FORMAT-002, FR-FORMAT-003, FR-FORMAT-004, FR-BINDING-001, FR-BINDING-002, FR-CLEANUP-001, FR-CLEANUP-002, FR-CLEANUP-003, FR-REBIND-001, FR-REBIND-002, FR-REBIND-003, FR-REBIND-004, FR-CLEANUP-004, FR-GOV-001, FR-GOV-002, FR-GOV-003, FR-GOV-004, FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010
- **AC**：AC-WAIT-001, AC-WAIT-002, AC-HEALTH-003, AC-HEALTH-004, AC-BROKER-004, AC-HEALTH-001, AC-HEALTH-002, AC-BROKER-001, AC-BROKER-002, AC-BROKER-003, AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-CLEANUP-005, AC-FORMAT-001, AC-FORMAT-002, AC-FORMAT-003, AC-FORMAT-004, AC-BINDING-001, AC-BINDING-002, AC-CLEANUP-001, AC-CLEANUP-002, AC-CLEANUP-003, AC-REBIND-001, AC-REBIND-002, AC-REBIND-003, AC-REBIND-004, AC-CLEANUP-004, AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010
- **source_refs / decision_refs**：R-001, R-002, R-003, R-004, R-005, R-006, R-007, R-008, R-009, R-010, R-011, R-012, R-013, R-014, R-015, R-016, R-017, R-018 / D-001, D-002, D-003, D-004, D-005, D-006, D-007, D-008, D-009, D-010, D-011, D-012, D-013, D-014, D-015, D-016, D-017, D-018, D-019, D-020, D-021, D-022, D-023, D-024, D-025, D-026
- **动作**：通过本卡唯一的 bounded command 读取当前 material/source identity 绑定的 canonical facts 与受影响 focused test receipts，并输出逐 AC 的实际状态；允许 execution-only snapshot drift（HEAD/source_digest 不变），不放宽材料或代码身份；不重跑 provider 或跨仓长流程。未覆盖或过期 receipt 保持 unavailable；`quality/evidence/line-count-ledger.md` 与 `quality/evidence/deferred-consistency-check.md` 若已有则只读核对，缺失就记录 unavailable，不创建第二账本；GOV-010 的唯一验收账本仍是 acceptance_criterion facts
- **精确文件**：`skills/spec-analyze/skill-bundle.json`；`skills/stage-handoff/skill-bundle.json`；`skills/stage-reflection/skill-bundle.json`；`skills/catalog.yaml`；`skills/wh-review/skill-bundle.json`；`workflows/make-decision/SKILL.md`；`workflows/build-spec/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；`tests/contract/stage-reflection-wiring.test.mjs`；`/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`
- **boundary**：files: `skills/spec-analyze/skill-bundle.json`；`skills/stage-handoff/skill-bundle.json`；`skills/stage-reflection/skill-bundle.json`；`skills/catalog.yaml`；`skills/wh-review/skill-bundle.json`；`workflows/make-decision/SKILL.md`；`workflows/build-spec/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；`tests/contract/stage-reflection-wiring.test.mjs`；`/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`; symbols/regions: 仅本卡目标相关区域
- **输出**：`quality/tests/T017-final-current-facts.json` 及官方 capture output；既有 line-count/deferred 文件只作可选引用，不因缺失创建新的权威状态
- **Knowledge**：review/test/evidence 只记录事实；不自动推进。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`node --input-type=module --eval 'import{basename}from"node:path";import{readFileSync}from"node:fs";import{captureExecutionSnapshot,materialRevisionFromValues}from"./runtime/task/git-worktree-snapshot.mjs";const d=process.argv[1],id=basename(d),root="specs/"+id,current=materialRevisionFromValues(["decision-log.md","spec.md","plan.md","tasks.md"].map(n=>[n,readFileSync(root+"/"+n,"utf8")])),snapshot=captureExecutionSnapshot(process.cwd(),id),tree=snapshot.tree,currentSource=snapshot.source_digest,currentHead=snapshot.head,ids=[...new Set([...readFileSync(root+"/tasks.md","utf8").matchAll(/AC-[A-Z0-9]+-[0-9]{3}/g)].map(m=>m[0]))],groups=[["quality/tests/T017-P1-focused-v2.json",["AC-HEALTH-003","AC-HEALTH-004","AC-BROKER-003","AC-BROKER-004"]],["quality/tests/T017-P1-wait-focused-v2.json",["AC-WAIT-001","AC-WAIT-002"]],["quality/tests/T017-P2-focused-v2.json",["AC-HEALTH-001","AC-HEALTH-002","AC-BROKER-001","AC-BROKER-002","AC-BROKER-003","AC-HEALTH-003","AC-HEALTH-004"]],["quality/tests/T017-P3-focused-v2.json",["AC-PREFLIGHT-001","AC-PREFLIGHT-002","AC-CLEANUP-005"]],["quality/tests/T017-P3-runtime-focused-v2.json",["AC-PREFLIGHT-003"]],["quality/tests/T017-P4-focused-v2.json",["AC-FORMAT-001","AC-FORMAT-002","AC-FORMAT-003","AC-FORMAT-004"]],["quality/tests/T017-P5-focused-v2.json",["AC-BINDING-001","AC-BINDING-002"]],["quality/tests/T017-P6-cleanup-focused-v2.json",["AC-CLEANUP-001","AC-CLEANUP-002","AC-CLEANUP-003"]],["quality/tests/T017-P6-focused-v2.json",[]],["quality/tests/T017-P7-focused-v2.json",["AC-REBIND-001","AC-REBIND-002","AC-REBIND-003","AC-REBIND-004"]],["quality/tests/T017-P8-focused-v2.json",["AC-CLEANUP-004","AC-GOV-001","AC-GOV-002","AC-GOV-003","AC-GOV-004","AC-GOV-005","AC-GOV-006","AC-GOV-007","AC-GOV-008","AC-GOV-009","AC-GOV-010"]]],good=new Set(groups.flatMap(([f,covered])=>{try{const v=JSON.parse(readFileSync(d+"/"+f,"utf8"));return v.schema_version==="workflowhub-receipt.v1"&&v.task_id===id&&v.stage==="build-code"&&v.exit_code===0&&(v.snapshot_tree===tree||(v.source_digest===currentSource&&v.snapshot_head===currentHead))?covered:[]}catch{return[]}}));process.stdout.write(JSON.stringify({entries:ids.map(acceptance_criterion_id=>({acceptance_criterion_id,assertions:[{id:"focused-current-test-receipt",expected:{status:"passed"},actual:{status:good.has(acceptance_criterion_id)?"passed":"unavailable"}}]}))}))' $TASK_DIR`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL-GOVERNANCE {"pass":"38 条 AC 各有一条 current canonical fact 且 actual.status=passed；缺失、stale、unavailable、failed 均不通过"}`
- **evidence_path**：`quality/tests/T017-final-current-facts.json`
- **STOP**：环境失败、越界、需要新设计、config/provider/确认点变化或七红线退化。
- **recovery**：build-code 主会话只回滚本卡字节并保留原始失败。
- **task risk**：错误 RED、覆盖缺口或把不可用质量事实写成通过。
- **test tier / test method**：simple — bounded canonical readback；runtime profile=phase；ceiling=30000ms。
- **scenarios / commands / expected exit / oracle**：当前 focused receipt 的 HEAD/source_digest 绑定且 exit 0 的 AC 判为 passed；仅 execution-only snapshot drift 可容忍；未覆盖、过期或缺失 receipt 判为 unavailable；命令 exit 0 但逐 AC actual 仍按 ORACLE 判定，使用本卡同一 gate_cmd。
- **fixtures_services**：N/A；只读当前 task store 与认证 worktree，不启动 provider、不访问真实网络、不写第二账本。
- **coverage limits**：只证明当前 canonical facts 的绑定和状态，不代替尚未生成的 targeted test、跨仓 diff、行数表、延期文件核对或 review；这些缺失保持 unavailable/incomplete。
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"current canonical facts and focused test receipts","sample":"current snapshot-bound T017 receipts","scenario":"bounded current-fact and focused-receipt readback","tier":"command","execution":{"command":"node","args":["--input-type=module","--eval","import{basename}from\"node:path\";import{readFileSync}from\"node:fs\";import{captureExecutionSnapshot,materialRevisionFromValues}from\"./runtime/task/git-worktree-snapshot.mjs\";const d=process.argv[1],id=basename(d),root=\"specs/\"+id,current=materialRevisionFromValues([\"decision-log.md\",\"spec.md\",\"plan.md\",\"tasks.md\"].map(n=>[n,readFileSync(root+\"/\"+n,\"utf8\")])),snapshot=captureExecutionSnapshot(process.cwd(),id),tree=snapshot.tree,currentSource=snapshot.source_digest,currentHead=snapshot.head,ids=[...new Set([...readFileSync(root+\"/tasks.md\",\"utf8\").matchAll(/AC-[A-Z0-9]+-[0-9]{3}/g)].map(m=>m[0]))],groups=[[\"quality/tests/T017-P1-focused-v2.json\",[\"AC-HEALTH-003\",\"AC-HEALTH-004\",\"AC-BROKER-003\",\"AC-BROKER-004\"]],[\"quality/tests/T017-P1-wait-focused-v2.json\",[\"AC-WAIT-001\",\"AC-WAIT-002\"]],[\"quality/tests/T017-P2-focused-v2.json\",[\"AC-HEALTH-001\",\"AC-HEALTH-002\",\"AC-BROKER-001\",\"AC-BROKER-002\",\"AC-BROKER-003\",\"AC-HEALTH-003\",\"AC-HEALTH-004\"]],[\"quality/tests/T017-P3-focused-v2.json\",[\"AC-PREFLIGHT-001\",\"AC-PREFLIGHT-002\",\"AC-CLEANUP-005\"]],[\"quality/tests/T017-P3-runtime-focused-v2.json\",[\"AC-PREFLIGHT-003\"]],[\"quality/tests/T017-P4-focused-v2.json\",[\"AC-FORMAT-001\",\"AC-FORMAT-002\",\"AC-FORMAT-003\",\"AC-FORMAT-004\"]],[\"quality/tests/T017-P5-focused-v2.json\",[\"AC-BINDING-001\",\"AC-BINDING-002\"]],[\"quality/tests/T017-P6-cleanup-focused-v2.json\",[\"AC-CLEANUP-001\",\"AC-CLEANUP-002\",\"AC-CLEANUP-003\"]],[\"quality/tests/T017-P6-focused-v2.json\",[]],[\"quality/tests/T017-P7-focused-v2.json\",[\"AC-REBIND-001\",\"AC-REBIND-002\",\"AC-REBIND-003\",\"AC-REBIND-004\"]],[\"quality/tests/T017-P8-focused-v2.json\",[\"AC-CLEANUP-004\",\"AC-GOV-001\",\"AC-GOV-002\",\"AC-GOV-003\",\"AC-GOV-004\",\"AC-GOV-005\",\"AC-GOV-006\",\"AC-GOV-007\",\"AC-GOV-008\",\"AC-GOV-009\",\"AC-GOV-010\"]]],good=new Set(groups.flatMap(([f,covered])=>{try{const v=JSON.parse(readFileSync(d+\"/\"+f,\"utf8\"));return v.schema_version===\"workflowhub-receipt.v1\"&&v.task_id===id&&v.stage===\"build-code\"&&v.exit_code===0&&(v.snapshot_tree===tree||(v.source_digest===currentSource&&v.snapshot_head===currentHead))?covered:[]}catch{return[]}}));process.stdout.write(JSON.stringify({entries:ids.map(acceptance_criterion_id=>({acceptance_criterion_id,assertions:[{id:\"focused-current-test-receipt\",expected:{status:\"passed\"},actual:{status:good.has(acceptance_criterion_id)?\"passed\":\"unavailable\"}}]}))}))","$TASK_DIR"],"timeout_ms":30000}}]`
- **e2e_scope**：not_required

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**（仅表示 T017 的 bounded current-fact、实现/测试 receipt 与逐 AC readback 已完成；formal stage quality 仍 `incomplete`）
- **status**：`completed` — 当前 38 条 AC 与 risk test receipt 已绑定同一 task、HEAD/source/material/snapshot；integration review 与 finding dispositions 缺失仍单独保留，不把本卡事实完成写成 Stage/Phase quality 通过。
- **actual_changes**：完成 T017 bounded current-fact readback；补齐 P2/P4/P5/P6/P7/P8 及 P3 runtime 的当前 focused receipt 映射；修复 per-AC acceptance projection 不被兄弟 AC 失败覆盖，并新增 focused regression；发布当前 implementation/test receipts。兼容性修复包括 typed command acceptance 测试夹具及 `spec-tasks` asset/bundle/catalog 哈希同步。未改 decision-log/spec，未提交。
- **executed_commands**：旧 aggregate timeout、无 worker/无输出及 P6 嵌套 dogfood 事实继续保留，不重跑。最新官方 `stage-runtime run --action=execute --stage=build-code` 使用当前 implementation/test receipts，返回 `exit_code=0`、`work_status=ready`、`continuation_allowed=true`；`risk_tests_fresh=passed`、`acceptance_criteria=passed`、`acceptance_execution=passed`，逐 AC `38/38 passed`。没有等待 provider、没有执行全量回归。
- **evidence_refs**：当前身份 `material_revision=revision-9ac12e24fbe79fba48609ff816891f4ac9a8fef231356cb4a64d0e88d331dfd9`、`snapshot_tree=79b0a85318299bafa627167d08f42d761b947e35`、`source_digest=e52d059da12291c1a331c6d8671b5483d4d0ebf8b06636807cb6bb4443a4407d`；implementation=`quality/evidence/implementation.json` sha256=`5ac06696d6d89ae2ffeb3d872841e5f1665865c8f7687be60c24d2e38f4d9e1b`；tests=`quality/tests/T017-current-tests-v2.json` sha256=`1a3a763bc5f0743007a8b528dd49161ae7d053bb3092aaa5686b467b83b5726b`；acceptance wrapper=`quality/evidence/acceptance/build-code/acceptance_criteria-c7315c33b518958df5f96667a392d2903a122d873aaf39483f45b057b7cf5209.json`；execution wrapper=`quality/evidence/acceptance/build-code/acceptance_execution-f6b2f4352b7749b0df0f712088c5a181cc142a5af6c72f50c762f11b9a2c54c0.json`；38 current per-AC facts均已写入 canonical acceptance store。FINAL receipt/ledger未创建，因为本卡是 bounded readback，不另造第二账本。
- **covered_ac**：38/38 AC current `pass`；包含 `AC-PREFLIGHT-003` 的 runtime agy 边界、P2/P4/P5/P6/P7/P8 当前 receipt。没有把 unavailable、missing 或历史 GREEN 改写为 pass。
- **review_fact**：当前 `integration_review=missing`、`finding_dispositions=missing`；原因是未执行新的 current integration provider review。`stage_reflection=unavailable(executor_absent)` 与 `stage-end-spec-analyze=unavailable` 为非阻塞 advisory；不借用旧 review 补当前事实。
- **completed_at**：`2026-09-19T09:35:23+08:00`。
- **执行事实**：T017 在 task-fact boundary 完成；formal build-code quality 保持 `incomplete`，待未来若需要 formal green 时单独执行 current integration review。此处不执行物理 close，不把质量缺口写成完成。

### Verify

- **Target**：AC-CLEANUP-004, AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010
- **gate_cmd**：`bash -c 'fail=0; for c in "bash -c \"cd /Users/Hugh/Hugh/Project/3rd-review && node --test --test-timeout=30000 test/antigravity-adapter.test.mjs test/provider-failure.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs\"" "./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000" "./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/contract/review-material-change-redispatch.test.mjs tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000" "./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-layering.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000" "./node_modules/.bin/vitest run tests/e2e/vnext-five-stage-current.test.mjs -t \"binds each make-decision review fact\" --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000" "./node_modules/.bin/vitest run tests/contract/performance-budget.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/e2e/ui-e2e-contract-dogfood.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/close/freshness-consistency.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=30000 --hookTimeout=15000" "./node_modules/.bin/vitest run tests/contract/human-confirmation-v3.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000" "node runtime/evidence/check-skill-closure.mjs" "node tools/cli/smoke-local-skill-dispatch.mjs" "node tools/cli/verify-structure.mjs" "node tools/cli/run-checks.mjs" "./node_modules/.bin/vitest run tests/contract/stage-reflection-wiring.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000"; do eval "$c"; rc=$?; echo "[p8-check] $c exit=$rc"; [ $rc -ne 0 ] && fail=1; done; exit $fail'`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/output/P8-red-green.txt`
- **Oracle**：ORACLE-FINAL-GOVERNANCE。

### Knowledge

下一 Phase 只消费真实测试与 review facts；缺失/partial/unavailable 原样保留。

### STOP

- 命令损坏、oracle 不符、越界或需要新设计时返回 owning material。

### Done

- 对应 AC 有 RED/GREEN 原件、diff allowlist、独立 review 与大白话交接后才可填写 completed。

### Risks and rollback

- **Risk**：共享文件串行冲突或跨仓半发布。
- **Prevention**：按 plan 顺序与 changed-file allowlist。
- **Rollback / recovery**：只回滚当前 Phase，保留事实。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：feature / targeted command aggregate。
- **scenarios**：P1–P8 成功、失败、状态、跨仓 seam 与治理边界。
- **command**: `bash -c 'fail=0; for c in "bash -c \"cd /Users/Hugh/Hugh/Project/3rd-review && node --test --test-timeout=30000 test/antigravity-adapter.test.mjs test/provider-failure.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs\"" "./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000" "./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/contract/review-material-change-redispatch.test.mjs tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000" "./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-layering.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000" "./node_modules/.bin/vitest run tests/e2e/vnext-five-stage-current.test.mjs -t \"binds each make-decision review fact\" --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000" "./node_modules/.bin/vitest run tests/contract/performance-budget.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/e2e/ui-e2e-contract-dogfood.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/close/freshness-consistency.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=30000 --hookTimeout=15000" "./node_modules/.bin/vitest run tests/contract/human-confirmation-v3.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000" "node runtime/evidence/check-skill-closure.mjs" "node tools/cli/smoke-local-skill-dispatch.mjs" "node tools/cli/verify-structure.mjs" "node tools/cli/run-checks.mjs" "./node_modules/.bin/vitest run tests/contract/stage-reflection-wiring.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000"; do eval "$c"; rc=$?; echo "[p8-check] $c exit=$rc"; [ $rc -ne 0 ] && fail=1; done; exit $fail'`
- **expected exit**：0
- **oracle**：ORACLE-FINAL-GOVERNANCE；逐项读取 AC assertion。
- **fixtures_services**：确定性 fixtures；无网络；执行后清理。
- **evidence_path**：`quality/tests/output/FINAL-targeted-green.txt`
- **coverage limits**：不声称未运行的全量回归。
- **STOP**：任一 targeted 失败或边界越权。
- **execution_contract**：当前快照运行一次；失败回受影响 task。

## Dependency Graph

- **order**：T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017

```text
T001→T002→T003→T004→T005→T006→T007→T008→T009→T010→T011→T012→T013→T014→T015→T016→T017
```

## Final Boundary Check

### Open/Deferred 交接表

| 事项 | 负责人 / 处理阶段 | 触发条件 | 交接去向 | 关闭条件 |
| --- | --- | --- | --- | --- |
| OPEN-001 | 负责人：build-spec 主会话（已在 spec 闭合） | 触发：spec 起草期已处理 | 去向：无下游交接，spec.md L93 已闭合 | 关闭条件：AC-CLEANUP-005 通过即关闭 |
| OPEN-002 | 负责人：主会话口径调和 | 触发：spec 审查期口径对齐 | 去向：spec 例外清单口径，无下游交接 | 关闭条件：AC-GOV-004 基线对照通过 |
| OPEN-003 | 负责人：build-spec 主会话（确定性抽取规则已在 spec 闭合） | 触发：spec 起草期已处理 | 去向：实现归 build-code（P4 FORMAT 任务卡承接） | 关闭条件：AC-FORMAT-001~004 通过 |
| OPEN-004 | 负责人：build-code 主会话（P1 承接） | 触发：T001/T002 实施期 | 去向：P1 attempt.schema.json process_outcome/parse_outcome 形状落地 | 关闭条件：AC-BROKER-004 通过 |

- [ ] 每个 Phase 八字段完整且 Files 与 plan 字节一致。
- [ ] 每个行为变化有 reciprocal RED/GREEN。
- [ ] 38 FR / 38 AC 双向覆盖。
- [ ] 外仓仅 6 文件且唯一测试写入为 managed-session-lifecycle。
- [ ] config/provider/确认点/D5/D6/cancelManaged 均未变化。
