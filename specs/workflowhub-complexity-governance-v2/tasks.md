# 任务清单：WorkflowHub 复杂度治理与可靠交付

> 基于 current spec 和 plan；任务按证据、切换、删除、迁移脚手架即时退出、测试和机械搬迁排序。

- **Input**：`specs/workflowhub-complexity-governance-v2/spec.md`、`specs/workflowhub-complexity-governance-v2/plan.md`
- **Status**：Draft
- **Template version**：`plan-task.v3`

## 1. 执行摘要

- **Goal**：完成七行为 facade、单写事实模型、逐项垂直删除、双发布单元、精简测试和稳定目录治理。
- **Main boundary**：删除 proof 或用户确认缺失即 KEEP；质量原语不可削弱；目录最后搬。
- **Main risk**：隐藏 consumer 和唯一负向 oracle 被误删。
- **First executable task**：T001

## 2. Global Constraints

- 当前 decision/spec/plan/tasks 可直接修订；旧记录只读。
- 行为改动必须先真实 RED，再做 GREEN；命令和 oracle 相同。
- 每个删除 GREEN 保留独立 diff、证据和 revert boundary；T021 前不得删除，未获关闭授权不得自行 commit。
- focused、full、check、clean install 分别证明不同事实。
- 不重放历史事故，不跑十个真实任务，不因业务任务修改 WorkflowHub。
- 文件均为精确路径；Phase 8 move-map 绑定每个源和目标。

## Phase 0：冻结基线与逐文件清单

### Goal

在当前 tree 上生成可复算 inventory、复杂度基线和删除证明合同；不删除生产能力。

### Files

- **NEW**：`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`tools/architecture/deletion-proof.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/complexity-baseline.json`、`docs/architecture/deletion-plan.json`、`tests/contract/repository-inventory.test.mjs`、`tests/contract/deletion-proof.test.mjs`
- **MODIFY**：`package.json`、`.gitignore`
- **DO NOT TOUCH**：`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`CONSTITUTION.md`

### Tasks

#### T001 — 生成当前 tree 的 inventory 与复杂度基线

- **ID**：T001
- **Phase**：Phase 0：冻结基线与逐文件清单
- **goal**：生成当前 tree 的 inventory 与复杂度基线
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、N/A — first task
- **依赖**：N/A — first task
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-INV-001、FR-MET-001
- **AC**：AC-13、AC-14
- **动作**：实现静态 inventory 与 complexity reporter
- **精确文件**：`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/complexity-baseline.json`、`tests/contract/repository-inventory.test.mjs`、`package.json`
- **boundary**：files: `tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/complexity-baseline.json`、`tests/contract/repository-inventory.test.mjs`、`package.json`; symbols/regions: 本 Task goal 对应区域
- **输出**：同 tree 的 inventory TSV 与 baseline JSON
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：N/A — non-behavior change: 只生成可复算架构事实
- **paired_task**：N/A — non-behavior change
- **gate_cmd**：`node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates`
- **expected_exit**：0
- **oracle**：ORACLE-INVENTORY：每个 tracked file 唯一分类；硬门字段可复算
- **evidence_path**：`evidence/phase-0/inventory-baseline.json`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：统计口径漂移。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 delivery-tree inventory、复杂度 reporter、inventory TSV、复杂度基线与合同测试；inventory 支持 alternate index 与自稳定 hash，baseline 分离 formal/support tests，并可复算 persistent families、bundle violations、Node/npm runtime contract。
- **executed_commands**：`node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates && node tools/architecture/deletion-proof.mjs --check && ./node_modules/.bin/vitest run tests/contract/repository-inventory.test.mjs tests/contract/deletion-proof.test.mjs && npx markdownlint-cli2 'specs/workflowhub-complexity-governance-v2/*.md' && npm ci --ignore-scripts --dry-run && test "$(git ls-files node_modules | wc -l | tr -d ' ')" = 0`
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/c0487baf565b33dfbe40c68a7a31a12237594c6e357f7c6868cb6db127933520.json","sha256":"f8cf07ddde139de5dfe3aab5add66d2bf4b80a4a91cc60629655cf175681cb6e"},{"ref":"receipts/build-tests-phase-0-pass.json","sha256":"c0b829a06574592e83537ec53fe4a5d82a402b5e4a4c3947385e8fd8fdb3c1c5"},{"ref":"reviews/results/build-code-default-8e8762f30fd7d4d5fe4e9a6efe2817f849015998-67d18ae7-8fed-4c3f-808e-1a8575dc9fa5.json","sha256":"7f92794436f944c1b668df752217d4ae7649888a68700633c0aa76bc389ade68"}]`
- **covered_ac**：AC-13、AC-14
- **review_fact**：`reviews/results/build-code-default-8e8762f30fd7d4d5fe4e9a6efe2817f849015998-67d18ae7-8fed-4c3f-808e-1a8575dc9fa5.json`
- **completed_at**：2026-07-30T16:32:01Z

#### T002 — 先证明缺字段 deletion proof 会失败

- **ID**：T002
- **Phase**：Phase 0：冻结基线与逐文件清单
- **goal**：先证明缺字段 deletion proof 会失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T001
- **依赖**：T001
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002
- **AC**：AC-06、AC-07
- **动作**：新增 deletion proof 合同失败测试
- **精确文件**：`tests/contract/deletion-proof.test.mjs`
- **boundary**：files: `tests/contract/deletion-proof.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T003
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/deletion-proof.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-DELETE-PROOF：缺任一字段必须 KEEP 且测试断言当前实现未满足
- **evidence_path**：`evidence/phase-0/deletion-proof-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：RED 可能因 fixture 错误而非目标断言失败。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 deletion proof 合同测试，证明缺实现或 proof 字段不完整时必须失败并保持 KEEP。
- **executed_commands**：`node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates && node tools/architecture/deletion-proof.mjs --check && ./node_modules/.bin/vitest run tests/contract/repository-inventory.test.mjs tests/contract/deletion-proof.test.mjs && npx markdownlint-cli2 'specs/workflowhub-complexity-governance-v2/*.md' && npm ci --ignore-scripts --dry-run && test "$(git ls-files node_modules | wc -l | tr -d ' ')" = 0`
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/c0487baf565b33dfbe40c68a7a31a12237594c6e357f7c6868cb6db127933520.json","sha256":"f8cf07ddde139de5dfe3aab5add66d2bf4b80a4a91cc60629655cf175681cb6e"},{"ref":"receipts/build-tests-phase-0-pass.json","sha256":"c0b829a06574592e83537ec53fe4a5d82a402b5e4a4c3947385e8fd8fdb3c1c5"},{"ref":"reviews/results/build-code-default-8e8762f30fd7d4d5fe4e9a6efe2817f849015998-67d18ae7-8fed-4c3f-808e-1a8575dc9fa5.json","sha256":"7f92794436f944c1b668df752217d4ae7649888a68700633c0aa76bc389ade68"}]`
- **covered_ac**：AC-06、AC-07
- **review_fact**：`reviews/results/build-code-default-8e8762f30fd7d4d5fe4e9a6efe2817f849015998-67d18ae7-8fed-4c3f-808e-1a8575dc9fa5.json`
- **completed_at**：2026-07-30T16:32:01Z

#### T003 — 实现 deletion proof 校验与 12 类候选清单

- **ID**：T003
- **Phase**：Phase 0：冻结基线与逐文件清单
- **goal**：实现 deletion proof 校验与 12 类候选清单
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T002
- **依赖**：T002
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002
- **AC**：AC-06、AC-07
- **动作**：实现 proof card validator 并列出 12 类候选
- **精确文件**：`tools/architecture/deletion-proof.mjs`、`docs/architecture/deletion-plan.json`、`tests/contract/deletion-proof.test.mjs`
- **boundary**：files: `tools/architecture/deletion-proof.mjs`、`docs/architecture/deletion-plan.json`、`tests/contract/deletion-proof.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：每项候选可判定且尚未删除
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T002
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/deletion-proof.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-DELETE-PROOF：字段完整才 DELETE，缺项自动 KEEP
- **evidence_path**：`evidence/phase-0/deletion-proof-green.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：proof 工具演变为新状态机。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 deletion proof validator 与 12 类候选清单；proof 绑定候选路径和 evidence，缺字段或错配时 fail closed 为 KEEP。
- **executed_commands**：`node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates && node tools/architecture/deletion-proof.mjs --check && ./node_modules/.bin/vitest run tests/contract/repository-inventory.test.mjs tests/contract/deletion-proof.test.mjs && npx markdownlint-cli2 'specs/workflowhub-complexity-governance-v2/*.md' && npm ci --ignore-scripts --dry-run && test "$(git ls-files node_modules | wc -l | tr -d ' ')" = 0`
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/c0487baf565b33dfbe40c68a7a31a12237594c6e357f7c6868cb6db127933520.json","sha256":"f8cf07ddde139de5dfe3aab5add66d2bf4b80a4a91cc60629655cf175681cb6e"},{"ref":"receipts/build-tests-phase-0-pass.json","sha256":"c0b829a06574592e83537ec53fe4a5d82a402b5e4a4c3947385e8fd8fdb3c1c5"},{"ref":"reviews/results/build-code-default-8e8762f30fd7d4d5fe4e9a6efe2817f849015998-67d18ae7-8fed-4c3f-808e-1a8575dc9fa5.json","sha256":"7f92794436f944c1b668df752217d4ae7649888a68700633c0aa76bc389ade68"}]`
- **covered_ac**：AC-06、AC-07
- **review_fact**：`reviews/results/build-code-default-8e8762f30fd7d4d5fe4e9a6efe2817f849015998-67d18ae7-8fed-4c3f-808e-1a8575dc9fa5.json`
- **completed_at**：2026-07-30T16:32:01Z

#### T004 — 证明 node_modules 只是可重建本地缓存

- **ID**：T004
- **Phase**：Phase 0：冻结基线与逐文件清单
- **goal**：证明 node_modules 只是可重建本地缓存
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T001
- **依赖**：T001
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DIST-001
- **AC**：AC-10
- **动作**：审计 Git、lockfile 和 clean-install 边界
- **精确文件**：`.gitignore`、`package.json`、`docs/architecture/complexity-baseline.json`
- **boundary**：files: `.gitignore`、`package.json`、`docs/architecture/complexity-baseline.json`; symbols/regions: 本 Task goal 对应区域
- **输出**：本地缓存不进入项目或发布
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：N/A — non-behavior change: 依赖边界审计
- **paired_task**：N/A — non-behavior change
- **gate_cmd**：`git ls-files node_modules | test ! -s /dev/stdin && npm ci --ignore-scripts --dry-run`
- **expected_exit**：0
- **oracle**：ORACLE-NODE-MODULES：tracked=0，lockfile 可 clean install
- **evidence_path**：`evidence/phase-0/node-modules-boundary.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：dry-run 不能替代最终空目录安装。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：复杂度基线记录 node_modules tracked=0、gitignore 边界、lockfile hash 与 Node/npm runtime contract；Phase gate 验证 clean-install dry-run 可重建。
- **executed_commands**：`node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates && node tools/architecture/deletion-proof.mjs --check && ./node_modules/.bin/vitest run tests/contract/repository-inventory.test.mjs tests/contract/deletion-proof.test.mjs && npx markdownlint-cli2 'specs/workflowhub-complexity-governance-v2/*.md' && npm ci --ignore-scripts --dry-run && test "$(git ls-files node_modules | wc -l | tr -d ' ')" = 0`
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/c0487baf565b33dfbe40c68a7a31a12237594c6e357f7c6868cb6db127933520.json","sha256":"f8cf07ddde139de5dfe3aab5add66d2bf4b80a4a91cc60629655cf175681cb6e"},{"ref":"receipts/build-tests-phase-0-pass.json","sha256":"c0b829a06574592e83537ec53fe4a5d82a402b5e4a4c3947385e8fd8fdb3c1c5"},{"ref":"reviews/results/build-code-default-8e8762f30fd7d4d5fe4e9a6efe2817f849015998-67d18ae7-8fed-4c3f-808e-1a8575dc9fa5.json","sha256":"7f92794436f944c1b668df752217d4ae7649888a68700633c0aa76bc389ade68"}]`
- **covered_ac**：AC-10
- **review_fact**：`reviews/results/build-code-default-8e8762f30fd7d4d5fe4e9a6efe2817f849015998-67d18ae7-8fed-4c3f-808e-1a8575dc9fa5.json`
- **completed_at**：2026-07-30T16:32:01Z

### Verify

- **Target**：全部 tracked file 恰好一个 disposition；12 类候选有 proof 状态；node_modules 未跟踪且可重建。
- **gate_cmd**：`node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates`
- **expected_exit**：0
- **evidence_path**：`evidence/phase-0/phase-result.json`
- **display_cmd**：N/A — gate 输出已可读
- **Oracle**：node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates

### Knowledge

- 基线数字必须由当前 tree 重算；Downloads 文件只作需求来源。

### STOP

- 任一 tracked file 未分类、删除候选无 consumer/proof 或统计口径不可重算。

### Done

- 全部 tracked file 恰好一个 disposition；12 类候选有 proof 状态；node_modules 未跟踪且可重建。

### Risks and rollback

- **Risk**：错误分类导致后续误删。
- **Prevention**：精确 boundary、同一 oracle、独立 review。
- **Rollback / recovery**：本 Phase 只有文档/工具，可整体回退。

## Phase 1：窄 Runtime facade 与双发布单元

### Goal

新增七行为 facade 和 Bundle/Runner 合同，底层仍复用旧实现。

### Files

- **NEW**：`core/runtime-facade.mjs`、`core/runner-contract.mjs`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`schemas/runner-release.schema.json`、`tests/contract/runtime-facade.test.mjs`、`tests/contract/runner-contract.test.mjs`、`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- **MODIFY**：`schemas/skill-bundle.schema.json`、`scripts/stage-runtime.mjs`、`core/check-skill-closure.mjs`、`package.json`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`
- **DO NOT TOUCH**：`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`

### Tasks

#### T005 — 先冻结七行为 facade 和版本错配失败合同

- **ID**：T005
- **Phase**：Phase 1：窄 Runtime facade 与双发布单元
- **goal**：先冻结七行为 facade 和版本错配失败合同
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T003
- **依赖**：T003
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-RUN-001、FR-DIST-002
- **AC**：AC-01、AC-11、AC-14
- **动作**：新增 public facade 与 compatibility RED
- **精确文件**：`tests/contract/runtime-facade.test.mjs`、`tests/contract/runner-contract.test.mjs`
- **boundary**：files: `tests/contract/runtime-facade.test.mjs`、`tests/contract/runner-contract.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-FACADE：仅七行为；缺失/错配 Runner 不正式写
- **evidence_path**：`evidence/phase-1/facade-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：现有 33 命令可能让负测假通过。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增七行为 facade 与 Runner 版本错配 RED，证明缺失行为、额外行为和不兼容 Runner 必须 fail loud。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs`（RED exit 1；GREEN exit 0）；`./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs tests/contract/stage-skill-runtime.test.mjs`（19/19 passed，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/09a9a2592c5a5e14fb2f8414063ab2bf27168a34b3443a5a04f711fb5871cb42.json","sha256":"3ad9c8451c2f123fbd39526ce9652caf786fac7d2dcbb09f64b086cdb4c0d51d"},{"ref":"receipts/build-tests-phase-1-reviewed-fix.json","sha256":"696f7f36fc4cc064115db06ee895c5c306dd5721281e0b30499d3c858d1101b6"},{"ref":"reviews/results/build-code-default-1fd88f0b629b14449e1abcfc7b84235c3f9a47c0-1a629669-c776-4445-9eaf-c33a91fc9504.json","sha256":"91904387efe5e0a81d949320d868eee5ca0c0d737a374db3dfdf12f8845d01ce"}]`
- **covered_ac**：AC-01、AC-11、AC-14
- **review_fact**：`reviews/results/build-code-default-1fd88f0b629b14449e1abcfc7b84235c3f9a47c0-1a629669-c776-4445-9eaf-c33a91fc9504.json`
- **completed_at**：2026-07-30T17:29:45Z

#### T006 — 实现七行为 facade 和 Runner 兼容函数

- **ID**：T006
- **Phase**：Phase 1：窄 Runtime facade 与双发布单元
- **goal**：实现七行为 facade 和 Runner 兼容函数
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T005
- **依赖**：T005
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-RUN-001、FR-DIST-002
- **AC**：AC-01、AC-11、AC-14
- **动作**：用 facade 代理旧实现并冻结兼容字段
- **精确文件**：`core/runtime-facade.mjs`、`core/runner-contract.mjs`、`schemas/skill-bundle.schema.json`、`schemas/runner-release.schema.json`、`scripts/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`、`tests/contract/runtime-facade.test.mjs`、`tests/contract/runner-contract.test.mjs`
- **boundary**：files: `core/runtime-facade.mjs`、`core/runner-contract.mjs`、`schemas/skill-bundle.schema.json`、`schemas/runner-release.schema.json`、`scripts/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`、`tests/contract/runtime-facade.test.mjs`、`tests/contract/runner-contract.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：Skill/Workflow 只引用 facade
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-FACADE：七行为完整，版本规则 fail-loud
- **evidence_path**：`evidence/phase-1/facade-green.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：facade 变成第二套 Runtime。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：实现仅含七个公共行为的 Runtime facade、Runner 版本兼容校验，并让 Stage/Skill 合同统一经 facade 调用旧实现。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs`（RED exit 1；GREEN exit 0）；`./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs tests/contract/stage-skill-runtime.test.mjs`（19/19 passed，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/09a9a2592c5a5e14fb2f8414063ab2bf27168a34b3443a5a04f711fb5871cb42.json","sha256":"3ad9c8451c2f123fbd39526ce9652caf786fac7d2dcbb09f64b086cdb4c0d51d"},{"ref":"receipts/build-tests-phase-1-reviewed-fix.json","sha256":"696f7f36fc4cc064115db06ee895c5c306dd5721281e0b30499d3c858d1101b6"},{"ref":"reviews/results/build-code-default-1fd88f0b629b14449e1abcfc7b84235c3f9a47c0-1a629669-c776-4445-9eaf-c33a91fc9504.json","sha256":"91904387efe5e0a81d949320d868eee5ca0c0d737a374db3dfdf12f8845d01ce"}]`
- **covered_ac**：AC-01、AC-11、AC-14
- **review_fact**：`reviews/results/build-code-default-1fd88f0b629b14449e1abcfc7b84235c3f9a47c0-1a629669-c776-4445-9eaf-c33a91fc9504.json`
- **completed_at**：2026-07-30T17:29:45Z

#### T007 — 先证明 Bundle/Runner 夹带内容和隐式依赖会失败

- **ID**：T007
- **Phase**：Phase 1：窄 Runtime facade 与双发布单元
- **goal**：先证明 Bundle/Runner 夹带内容和隐式依赖会失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T006
- **依赖**：T006
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DIST-001、FR-DIST-002
- **AC**：AC-10、AC-11
- **动作**：新增真实打包/空目录安装 RED
- **精确文件**：`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- **boundary**：files: `tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-DISTRIBUTION：Bundle 禁止内容=0；Runner 空目录可安装
- **evidence_path**：`evidence/phase-1/distribution-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：仓内 skill closure 被误当发布闭包。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 Bundle 禁止内容与 Runner 隐式依赖 RED，证明发布闭包夹带源码历史或缺运行依赖时必须失败。
- **executed_commands**：`./node_modules/.bin/vitest run tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs`（RED exit 1；GREEN exit 0）；`./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs tests/contract/stage-skill-runtime.test.mjs`（19/19 passed，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/09a9a2592c5a5e14fb2f8414063ab2bf27168a34b3443a5a04f711fb5871cb42.json","sha256":"3ad9c8451c2f123fbd39526ce9652caf786fac7d2dcbb09f64b086cdb4c0d51d"},{"ref":"receipts/build-tests-phase-1-reviewed-fix.json","sha256":"696f7f36fc4cc064115db06ee895c5c306dd5721281e0b30499d3c858d1101b6"},{"ref":"reviews/results/build-code-default-1fd88f0b629b14449e1abcfc7b84235c3f9a47c0-1a629669-c776-4445-9eaf-c33a91fc9504.json","sha256":"91904387efe5e0a81d949320d868eee5ca0c0d737a374db3dfdf12f8845d01ce"}]`
- **covered_ac**：AC-10、AC-11
- **review_fact**：`reviews/results/build-code-default-1fd88f0b629b14449e1abcfc7b84235c3f9a47c0-1a629669-c776-4445-9eaf-c33a91fc9504.json`
- **completed_at**：2026-07-30T17:29:45Z

#### T008 — 实现洁净 Skill Bundle 与 Local Runner Release

- **ID**：T008
- **Phase**：Phase 1：窄 Runtime facade 与双发布单元
- **goal**：实现洁净 Skill Bundle 与 Local Runner Release
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T007
- **依赖**：T007
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DIST-001、FR-DIST-002
- **AC**：AC-10、AC-11
- **动作**：实现真实发布包生成与 clean install
- **精确文件**：`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`core/check-skill-closure.mjs`、`package.json`、`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- **boundary**：files: `core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`core/check-skill-closure.mjs`、`package.json`、`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：Bundle/Runner 独立、无第三单元
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-DISTRIBUTION：两个发布单元可独立验证
- **evidence_path**：`evidence/phase-1/distribution-green.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：打包器复制源码仓历史。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：实现洁净 Skill Bundle 与 Local Runner Release 生成、闭包校验和空目录安装验证，保持两个独立发布单元。
- **executed_commands**：`./node_modules/.bin/vitest run tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs`（RED exit 1；GREEN exit 0）；`./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs tests/contract/stage-skill-runtime.test.mjs`（19/19 passed，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/09a9a2592c5a5e14fb2f8414063ab2bf27168a34b3443a5a04f711fb5871cb42.json","sha256":"3ad9c8451c2f123fbd39526ce9652caf786fac7d2dcbb09f64b086cdb4c0d51d"},{"ref":"receipts/build-tests-phase-1-reviewed-fix.json","sha256":"696f7f36fc4cc064115db06ee895c5c306dd5721281e0b30499d3c858d1101b6"},{"ref":"reviews/results/build-code-default-1fd88f0b629b14449e1abcfc7b84235c3f9a47c0-1a629669-c776-4445-9eaf-c33a91fc9504.json","sha256":"91904387efe5e0a81d949320d868eee5ca0c0d737a374db3dfdf12f8845d01ce"}]`
- **covered_ac**：AC-10、AC-11
- **review_fact**：`reviews/results/build-code-default-1fd88f0b629b14449e1abcfc7b84235c3f9a47c0-1a629669-c776-4445-9eaf-c33a91fc9504.json`
- **completed_at**：2026-07-30T17:29:45Z

### Verify

- **Target**：facade 与两个 release 合同通过，旧实现仍可回退。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs`
- **expected_exit**：0
- **evidence_path**：`evidence/phase-1/phase-result.json`
- **display_cmd**：N/A — gate 输出已可读
- **Oracle**：./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs

### Knowledge

- 七个行为固定为 doctor/status/run/review/verify/confirm/authorize；仅两个发布单元。

### STOP

- facade 需要第八行为但无真实 consumer；clean install 依赖源码仓 node_modules。

### Done

- facade 与两个 release 合同通过，旧实现仍可回退。

### Risks and rollback

- **Risk**：兼容 wrapper 可能长期保留。
- **Prevention**：精确 boundary、同一 oracle、独立 review。
- **Rollback / recovery**：删除 facade 即恢复旧入口；不改底层 writer。

## Phase 2：单一材料修订与派生发布

### Goal

以现有 task-material-revision 为基座，统一质量事实、freshness、完成谓词和原子 publication；尚不切 writer。

### Files

- **NEW**：`core/material-revision.mjs`、`core/quality-fact.mjs`、`core/freshness.mjs`、`core/completion-predicates.mjs`、`core/publication.mjs`、`schemas/quality-fact.v1.json`、`schemas/publication.v1.json`、`tests/contract/stage-completion.test.mjs`、`tests/integration/material-revision.test.mjs`、`tests/integration/derived-publication.test.mjs`、`tests/integration/atomic-write-faults.test.mjs`
- **MODIFY**：`core/task-kernel-implementation.mjs`、`core/stage-content-contracts.mjs`、`core/stage-skill-invocation.mjs`、`core/stage-completion-facts.mjs`、`core/canonical-receipt-writer.mjs`、`core/receipt-schema.mjs`、`core/task-handle.mjs`
- **DO NOT TOUCH**：`scripts/stage-runtime.mjs`、`core/task-recovery.mjs`

### Tasks

#### T009 — 先冻结材料修订、质量事实和五阶段完成谓词

- **ID**：T009
- **Phase**：Phase 2：单一材料修订与派生发布
- **goal**：先冻结材料修订、质量事实和五阶段完成谓词
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T008
- **依赖**：T008
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-MAT-001、FR-MAT-002、FR-PUB-001、FR-REV-001
- **AC**：AC-01、AC-02、AC-04、AC-05
- **动作**：新增统一事实模型 RED
- **精确文件**：`tests/contract/stage-completion.test.mjs`、`tests/integration/material-revision.test.mjs`、`tests/integration/derived-publication.test.mjs`
- **boundary**：files: `tests/contract/stage-completion.test.mjs`、`tests/integration/material-revision.test.mjs`、`tests/integration/derived-publication.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs tests/integration/material-revision.test.mjs tests/integration/derived-publication.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-FACT-MODEL：当前材料可修订，旧事实 stale，完成谓词不可缩减
- **evidence_path**：`evidence/phase-2/fact-model-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：RED 过度绑定旧实现。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：冻结 Phase 2 单一 MaterialRevision、append-only QualityFact、freshness/completion 谓词、派生 Publication 与正式 writer 原子写入合同。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs tests/integration/material-revision.test.mjs tests/integration/derived-publication.test.mjs tests/integration/atomic-write-faults.test.mjs tests/stage-content-continuation.test.mjs`（Phase 2 final-v2，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/d32dee8169322a582ddf4dcf2df62da95c184bc5bcdf2bfa5d613c053c9003de.json","sha256":"446addf19ca37424f13a97c5ecc2e12792cecdf1c027996603ab9eecf37bb7c5"},{"ref":"receipts/build-tests-phase-2-final-v2.json","sha256":"37e721dbc95d226ed9c96c1b9332cf14fc2dc8f5d719aced5833403fc4aadb3b"},{"ref":"reviews/results/build-code-default-ddab5f58f36b50d1c448d00f8f5ca75c1283bd37-cf8c62a3-7cfc-4d75-b4ab-ff8ace7ac3a6.json","sha256":"d564602d4bf44e55f95b41069f065debfae392476babe5b7b51dd5612d67a407"}]`
- **covered_ac**：AC-01、AC-02、AC-04、AC-05
- **review_fact**：`reviews/results/build-code-default-ddab5f58f36b50d1c448d00f8f5ca75c1283bd37-cf8c62a3-7cfc-4d75-b4ab-ff8ace7ac3a6.json`
- **completed_at**：2026-07-30T18:23:30Z

#### T010 — 实现单一修订、质量事实和派生完成

- **ID**：T010
- **Phase**：Phase 2：单一材料修订与派生发布
- **goal**：实现单一修订、质量事实和派生完成
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T009
- **依赖**：T009
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-MAT-001、FR-MAT-002、FR-PUB-001、FR-REV-001
- **AC**：AC-01、AC-02、AC-04、AC-05
- **动作**：扩展现有 revision 并实现纯 freshness/completion
- **精确文件**：`core/material-revision.mjs`、`core/quality-fact.mjs`、`core/freshness.mjs`、`core/completion-predicates.mjs`、`core/publication.mjs`、`core/canonical-evidence-validators.mjs`、`schemas/quality-fact.v1.json`、`schemas/publication.v1.json`、`core/task-kernel-implementation.mjs`、`core/stage-content-contracts.mjs`、`core/stage-skill-invocation.mjs`、`core/stage-completion-facts.mjs`、`core/schemas/task-material-revision.v1.json`、`tests/contract/stage-completion.test.mjs`、`tests/integration/material-revision.test.mjs`、`tests/integration/derived-publication.test.mjs`、`tests/stage-content-continuation.test.mjs`
- **boundary**：files: `core/material-revision.mjs`、`core/quality-fact.mjs`、`core/freshness.mjs`、`core/completion-predicates.mjs`、`core/publication.mjs`、`core/canonical-evidence-validators.mjs`、`schemas/quality-fact.v1.json`、`schemas/publication.v1.json`、`core/task-kernel-implementation.mjs`、`core/stage-content-contracts.mjs`、`core/stage-skill-invocation.mjs`、`core/stage-completion-facts.mjs`、`core/schemas/task-material-revision.v1.json`、`tests/contract/stage-completion.test.mjs`、`tests/integration/material-revision.test.mjs`、`tests/integration/derived-publication.test.mjs`、`tests/stage-content-continuation.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：新模型在测试中闭合
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs tests/integration/material-revision.test.mjs tests/integration/derived-publication.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-FACT-MODEL：四材料同 revision；质量事实 append-only；结果可重建
- **evidence_path**：`evidence/phase-2/fact-model-green.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：重复投影未真正消失。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：冻结 Phase 2 单一 MaterialRevision、append-only QualityFact、freshness/completion 谓词、派生 Publication 与正式 writer 原子写入合同。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs tests/integration/material-revision.test.mjs tests/integration/derived-publication.test.mjs tests/integration/atomic-write-faults.test.mjs tests/stage-content-continuation.test.mjs`（Phase 2 final-v2，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/d32dee8169322a582ddf4dcf2df62da95c184bc5bcdf2bfa5d613c053c9003de.json","sha256":"446addf19ca37424f13a97c5ecc2e12792cecdf1c027996603ab9eecf37bb7c5"},{"ref":"receipts/build-tests-phase-2-final-v2.json","sha256":"37e721dbc95d226ed9c96c1b9332cf14fc2dc8f5d719aced5833403fc4aadb3b"},{"ref":"reviews/results/build-code-default-ddab5f58f36b50d1c448d00f8f5ca75c1283bd37-cf8c62a3-7cfc-4d75-b4ab-ff8ace7ac3a6.json","sha256":"d564602d4bf44e55f95b41069f065debfae392476babe5b7b51dd5612d67a407"}]`
- **covered_ac**：AC-01、AC-02、AC-04、AC-05
- **review_fact**：`reviews/results/build-code-default-ddab5f58f36b50d1c448d00f8f5ca75c1283bd37-cf8c62a3-7cfc-4d75-b4ab-ff8ace7ac3a6.json`
- **completed_at**：2026-07-30T18:23:30Z

#### T011 — 先注入全部正式 writer 的五类故障

- **ID**：T011
- **Phase**：Phase 2：单一材料修订与派生发布
- **goal**：先注入全部正式 writer 的五类故障
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T010
- **依赖**：T010
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-MAT-002、FR-PUB-002
- **AC**：AC-03、AC-12
- **动作**：对三类正式 writer 参数化注入五类故障 RED
- **精确文件**：`tests/integration/atomic-write-faults.test.mjs`
- **boundary**：files: `tests/integration/atomic-write-faults.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/atomic-write-faults.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-ATOMIC-WRITES：MaterialRevision、QualityFact、Publication 在 temp/fsync/rename/CAS/current 任一故障下只能 old-or-new，无半写
- **evidence_path**：`evidence/phase-2/atomic-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：故障点未穿过真实 writer seam。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：冻结 Phase 2 单一 MaterialRevision、append-only QualityFact、freshness/completion 谓词、派生 Publication 与正式 writer 原子写入合同。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs tests/integration/material-revision.test.mjs tests/integration/derived-publication.test.mjs tests/integration/atomic-write-faults.test.mjs tests/stage-content-continuation.test.mjs`（Phase 2 final-v2，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/d32dee8169322a582ddf4dcf2df62da95c184bc5bcdf2bfa5d613c053c9003de.json","sha256":"446addf19ca37424f13a97c5ecc2e12792cecdf1c027996603ab9eecf37bb7c5"},{"ref":"receipts/build-tests-phase-2-final-v2.json","sha256":"37e721dbc95d226ed9c96c1b9332cf14fc2dc8f5d719aced5833403fc4aadb3b"},{"ref":"reviews/results/build-code-default-ddab5f58f36b50d1c448d00f8f5ca75c1283bd37-cf8c62a3-7cfc-4d75-b4ab-ff8ace7ac3a6.json","sha256":"d564602d4bf44e55f95b41069f065debfae392476babe5b7b51dd5612d67a407"}]`
- **covered_ac**：AC-03、AC-12
- **review_fact**：`reviews/results/build-code-default-ddab5f58f36b50d1c448d00f8f5ca75c1283bd37-cf8c62a3-7cfc-4d75-b4ab-ff8ace7ac3a6.json`
- **completed_at**：2026-07-30T18:23:30Z

#### T012 — 实现全部正式 writer 的原子、并发唯一胜者和幂等

- **ID**：T012
- **Phase**：Phase 2：单一材料修订与派生发布
- **goal**：实现全部正式 writer 的原子、并发唯一胜者和幂等
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T011
- **依赖**：T011
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-MAT-002、FR-PUB-002
- **AC**：AC-03、AC-12
- **动作**：复用 TaskHandle 安全原语统一三类正式写入
- **精确文件**：`core/material-revision.mjs`、`core/quality-fact.mjs`、`core/publication.mjs`、`core/canonical-receipt-writer.mjs`、`core/receipt-schema.mjs`、`core/task-handle.mjs`、`tests/integration/atomic-write-faults.test.mjs`
- **boundary**：files: `core/material-revision.mjs`、`core/quality-fact.mjs`、`core/publication.mjs`、`core/canonical-receipt-writer.mjs`、`core/receipt-schema.mjs`、`core/task-handle.mjs`、`tests/integration/atomic-write-faults.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：无半写、无重复 generation、无 writer 例外
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/atomic-write-faults.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-ATOMIC-WRITES：三类 writer × 五故障点安全、同输入幂等、并发恰一胜者
- **evidence_path**：`evidence/phase-2/atomic-green.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：错误地削弱 create-only。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：冻结 Phase 2 单一 MaterialRevision、append-only QualityFact、freshness/completion 谓词、派生 Publication 与正式 writer 原子写入合同。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs tests/integration/material-revision.test.mjs tests/integration/derived-publication.test.mjs tests/integration/atomic-write-faults.test.mjs tests/stage-content-continuation.test.mjs`（Phase 2 final-v2，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/d32dee8169322a582ddf4dcf2df62da95c184bc5bcdf2bfa5d613c053c9003de.json","sha256":"446addf19ca37424f13a97c5ecc2e12792cecdf1c027996603ab9eecf37bb7c5"},{"ref":"receipts/build-tests-phase-2-final-v2.json","sha256":"37e721dbc95d226ed9c96c1b9332cf14fc2dc8f5d719aced5833403fc4aadb3b"},{"ref":"reviews/results/build-code-default-ddab5f58f36b50d1c448d00f8f5ca75c1283bd37-cf8c62a3-7cfc-4d75-b4ab-ff8ace7ac3a6.json","sha256":"d564602d4bf44e55f95b41069f065debfae392476babe5b7b51dd5612d67a407"}]`
- **covered_ac**：AC-03、AC-12
- **review_fact**：`reviews/results/build-code-default-ddab5f58f36b50d1c448d00f8f5ca75c1283bd37-cf8c62a3-7cfc-4d75-b4ab-ff8ace7ac3a6.json`
- **completed_at**：2026-07-30T18:23:30Z

### Verify

- **Target**：材料修订、质量事实和 publication 的纯模型及完整故障矩阵通过，旧 writer 仍是唯一生产 writer。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs tests/integration/material-revision.test.mjs tests/integration/derived-publication.test.mjs tests/integration/atomic-write-faults.test.mjs`
- **expected_exit**：0
- **evidence_path**：`evidence/phase-2/phase-result.json`
- **display_cmd**：N/A — gate 输出已可读
- **Oracle**：./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs tests/integration/material-revision.test.mjs tests/integration/derived-publication.test.mjs tests/integration/atomic-write-faults.test.mjs

### Knowledge

- 保留 TaskHandle nofollow/create-only/CAS；质量事实不作工作许可。

### STOP

- 任一正式写入边界的原子性或旧事实只读投影无法证明；新增第六持久对象族。

### Done

- 材料修订、质量事实和 publication 的纯模型及完整故障矩阵通过，旧 writer 仍是唯一生产 writer。

### Risks and rollback

- **Risk**：派生发布过宽或某类 writer 未穿过真实故障 seam。
- **Prevention**：精确 boundary、同一 oracle、独立 review。
- **Rollback / recovery**：所有新模块未切生产入口，可整体回退。

## Phase 3：新任务单写与迁移脚手架即时退出

### Goal

新任务只写 vNext；临时 importer 仅对冻结 fixture 和只读真实旧任务 inventory 生成证据，随后在本 Phase 立即删除，禁止双写和长期兼容。

### Files

- **NEW**：`docs/architecture/legacy-task-inventory.json`、`docs/architecture/legacy-import-proof.json`、`tools/architecture/verify-migration-proof.mjs`
- **MODIFY**：`core/task-kernel.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/material-revision.mjs`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`scripts/task-bootstrap.mjs`、`scripts/stage-runtime.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`core/legacy-reader.mjs`、`tools/migrations/import-legacy-task.mjs`、`schemas/legacy-import.v1.json`、`tests/integration/legacy-import-proof.test.mjs`、`tests/fixtures/legacy-supported.json`、`tests/fixtures/legacy-missing-identity.json`、`tests/fixtures/legacy-hash-conflict.json`、`tests/fixtures/legacy-current-conflict.json`、`tests/fixtures/legacy-unknown-source.json`
- **DO NOT TOUCH**：`core/task-recovery.mjs`、`scripts/task-recovery.mjs`

### Tasks

#### T013 — 先证明新任务单写和旧 writer 不可达

- **ID**：T013
- **Phase**：Phase 3：新任务单写与迁移脚手架即时退出
- **goal**：先证明新任务单写和旧 writer 不可达
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T012
- **依赖**：T012
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-MAT-001、FR-PUB-002、FR-LEG-001
- **AC**：AC-02、AC-03、AC-08
- **动作**：新增 writer cutover 和迁移证明 RED
- **精确文件**：`tests/integration/legacy-import-proof.test.mjs`
- **boundary**：files: `tests/integration/legacy-import-proof.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T014
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/legacy-import-proof.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-CUTOVER：新任务仅 vNext；旧 writer 不可达；双写=0
- **evidence_path**：`evidence/phase-3/cutover-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：测试可能仅做静态字符串检查。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：RED 证明新任务单写、旧 writer 不可达；该 RED 测试随 T016 同 Phase 归零删除，执行事实由 Phase 3 正式收据绑定。
- **executed_commands**：`node tools/architecture/verify-migration-proof.mjs --phase-gate --require-real-task-inventory --require-current-tree && node tools/architecture/inventory.mjs --check --require-zero=legacy-runtime`（Phase 3 gate，exit 0）；`npm test`（全量回归，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/730ec45dfd54a62029b3b8285b9ffe27de7349ea0b6dfcb73efaa165a90e41e8.json","sha256":"647286b2af6198b0a5d9e269ab4faa72eb0993658b475528148da2da3acda191"},{"ref":"receipts/build-tests-phase-3-v2.json","sha256":"718cf5a7508cf3bd86b74a37bf89a7589a85bf40210b3f09c5b0b9ac903dc0a6"},{"ref":"receipts/build-tests-phase-3-regression-v2.json","sha256":"a7ded8d94f7fbd199db7b377183f5515b141e0b43a4e5f7e13fb6b8bfbd62ddd"},{"ref":"reviews/results/build-code-default-2096af554f9c5c00968fed34e05230d6924d21b3-3133f510-fd75-4024-9bc1-1211b544550c.json","sha256":"3fc1776048296a858b432a2c1bf7c4193d395bcdca0cf98fd7bcbc8c58987049"}]`
- **covered_ac**：AC-02、AC-03、AC-08
- **review_fact**：`reviews/results/build-code-default-2096af554f9c5c00968fed34e05230d6924d21b3-3133f510-fd75-4024-9bc1-1211b544550c.json`
- **completed_at**：2026-07-31T04:33:03Z

#### T014 — 原子切换新任务 writer

- **ID**：T014
- **Phase**：Phase 3：新任务单写与迁移脚手架即时退出
- **goal**：原子切换新任务 writer
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T013
- **依赖**：T013
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-MAT-001、FR-PUB-002、FR-LEG-001
- **AC**：AC-02、AC-03、AC-08
- **动作**：切 production writer 至 vNext
- **精确文件**：`core/task-kernel.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`scripts/task-bootstrap.mjs`、`scripts/stage-runtime.mjs`、`core/material-revision.mjs`、`tests/integration/legacy-import-proof.test.mjs`
- **boundary**：files: `core/task-kernel.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`scripts/task-bootstrap.mjs`、`scripts/stage-runtime.mjs`、`core/material-revision.mjs`、`tests/integration/legacy-import-proof.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：新任务不再产生旧状态族
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T013
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/legacy-import-proof.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-CUTOVER：新任务单写；旧 writer 新入口失败；双写=0
- **evidence_path**：`evidence/phase-3/cutover-green.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：迁移证明误获生产写权限。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新任务 writer 原子切换为单写 vNext；并发/故障注入测试与全量回归在当前 tree 通过；迁移证明无生产写权限。
- **executed_commands**：`node tools/architecture/verify-migration-proof.mjs --phase-gate --require-real-task-inventory --require-current-tree && node tools/architecture/inventory.mjs --check --require-zero=legacy-runtime`（Phase 3 gate，exit 0）；`npm test`（全量回归，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/730ec45dfd54a62029b3b8285b9ffe27de7349ea0b6dfcb73efaa165a90e41e8.json","sha256":"647286b2af6198b0a5d9e269ab4faa72eb0993658b475528148da2da3acda191"},{"ref":"receipts/build-tests-phase-3-v2.json","sha256":"718cf5a7508cf3bd86b74a37bf89a7589a85bf40210b3f09c5b0b9ac903dc0a6"},{"ref":"receipts/build-tests-phase-3-regression-v2.json","sha256":"a7ded8d94f7fbd199db7b377183f5515b141e0b43a4e5f7e13fb6b8bfbd62ddd"},{"ref":"reviews/results/build-code-default-2096af554f9c5c00968fed34e05230d6924d21b3-3133f510-fd75-4024-9bc1-1211b544550c.json","sha256":"3fc1776048296a858b432a2c1bf7c4193d395bcdca0cf98fd7bcbc8c58987049"}]`
- **covered_ac**：AC-02、AC-03、AC-08
- **review_fact**：`reviews/results/build-code-default-2096af554f9c5c00968fed34e05230d6924d21b3-3133f510-fd75-4024-9bc1-1211b544550c.json`
- **completed_at**：2026-07-31T04:33:03Z

#### T015 — 审计真实旧任务并用冻结 fixture 证明一次性迁移完整性

- **ID**：T015
- **Phase**：Phase 3：新任务单写与迁移脚手架即时退出
- **goal**：审计真实旧任务并用冻结 fixture 证明一次性迁移完整性
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T014
- **依赖**：T014
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-LEG-001、FR-INV-001
- **AC**：AC-08、AC-13
- **动作**：创建临时 importer/schema/fixtures 和 RED 版 `verify-migration-proof.mjs`，生成真实旧任务只读 inventory；不得修改真实任务；phase-gate 因尚无逐项处置和归零事实保持 RED
- **精确文件**：`core/legacy-reader.mjs`、`tools/migrations/import-legacy-task.mjs`、`tools/architecture/verify-migration-proof.mjs`、`schemas/legacy-import.v1.json`、`tests/integration/legacy-import-proof.test.mjs`、`tests/fixtures/legacy-supported.json`、`tests/fixtures/legacy-missing-identity.json`、`tests/fixtures/legacy-hash-conflict.json`、`tests/fixtures/legacy-current-conflict.json`、`tests/fixtures/legacy-unknown-source.json`、`docs/architecture/legacy-task-inventory.json`
- **boundary**：files: `core/legacy-reader.mjs`、`tools/migrations/import-legacy-task.mjs`、`tools/architecture/verify-migration-proof.mjs`、`schemas/legacy-import.v1.json`、`tests/integration/legacy-import-proof.test.mjs`、`tests/fixtures/legacy-supported.json`、`tests/fixtures/legacy-missing-identity.json`、`tests/fixtures/legacy-hash-conflict.json`、`tests/fixtures/legacy-current-conflict.json`、`tests/fixtures/legacy-unknown-source.json`、`docs/architecture/legacy-task-inventory.json`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实行为 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T016
- **gate_cmd**：`node tools/architecture/verify-migration-proof.mjs --phase-gate --require-real-task-inventory --require-cases=supported,idempotent,missing-identity,hash-conflict,current-conflict,unknown-source --require-current-tree && node tools/architecture/inventory.mjs --check --require-zero=legacy-runtime`
- **expected_exit**：1
- **oracle**：ORACLE-LEGACY-MIGRATION：只读列出真实旧任务并逐项判定可导入/需归档/不支持；fixture 内容不丢且身份稳定；重复导入幂等；坏输入 fail-loud；缺 GREEN receipt、active legacy 未归零或仍有 legacy 入口即失败
- **evidence_path**：`evidence/phase-3/legacy-proof-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：importer 静默猜测未知字段或遗漏真实旧任务。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：生成 106 项真实旧任务只读 inventory（内容脱敏、身份哈希）；临时 importer/schema/fixture 与 RED 版 verifier 落地；逐项处置经用户确认（import=51、archive=15、reject=40）。
- **executed_commands**：`node tools/architecture/verify-migration-proof.mjs --phase-gate --require-real-task-inventory --require-current-tree && node tools/architecture/inventory.mjs --check --require-zero=legacy-runtime`（Phase 3 gate，exit 0）；`npm test`（全量回归，exit 0）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/730ec45dfd54a62029b3b8285b9ffe27de7349ea0b6dfcb73efaa165a90e41e8.json","sha256":"647286b2af6198b0a5d9e269ab4faa72eb0993658b475528148da2da3acda191"},{"ref":"receipts/build-tests-phase-3-v2.json","sha256":"718cf5a7508cf3bd86b74a37bf89a7589a85bf40210b3f09c5b0b9ac903dc0a6"},{"ref":"receipts/build-tests-phase-3-regression-v2.json","sha256":"a7ded8d94f7fbd199db7b377183f5515b141e0b43a4e5f7e13fb6b8bfbd62ddd"},{"ref":"reviews/results/build-code-default-2096af554f9c5c00968fed34e05230d6924d21b3-3133f510-fd75-4024-9bc1-1211b544550c.json","sha256":"3fc1776048296a858b432a2c1bf7c4193d395bcdca0cf98fd7bcbc8c58987049"}]`
- **covered_ac**：AC-08、AC-13
- **review_fact**：`reviews/results/build-code-default-2096af554f9c5c00968fed34e05230d6924d21b3-3133f510-fd75-4024-9bc1-1211b544550c.json`
- **completed_at**：2026-07-31T04:33:03Z

#### T016 — 完成真实旧任务处置证明并立即删除全部 legacy 脚手架

- **ID**：T016
- **Phase**：Phase 3：新任务单写与迁移脚手架即时退出
- **goal**：完成真实旧任务处置证明并立即删除全部 legacy 脚手架
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T015
- **依赖**：T015
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-LEG-001、FR-INV-001
- **AC**：AC-08、AC-13
- **动作**：先对真实旧任务逐项展示处置结果并取得用户确认；未归零则 STOP，不保留兼容期；完成后固化不可变证据并在同一 Phase 删除 legacy reader/importer/schema/fixture/public entry，再用 task-only `verify-migration-proof.mjs` 验证证据；该 verifier 在 T054 最终归零
- **精确文件**：`core/legacy-reader.mjs`、`tools/migrations/import-legacy-task.mjs`、`schemas/legacy-import.v1.json`、`tests/integration/legacy-import-proof.test.mjs`、`tests/fixtures/legacy-supported.json`、`tests/fixtures/legacy-missing-identity.json`、`tests/fixtures/legacy-hash-conflict.json`、`tests/fixtures/legacy-current-conflict.json`、`tests/fixtures/legacy-unknown-source.json`、`docs/architecture/legacy-task-inventory.json`、`docs/architecture/legacy-import-proof.json`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`tools/architecture/verify-migration-proof.mjs`
- **boundary**：files: `core/legacy-reader.mjs`、`tools/migrations/import-legacy-task.mjs`、`schemas/legacy-import.v1.json`、`tests/integration/legacy-import-proof.test.mjs`、`tests/fixtures/legacy-supported.json`、`tests/fixtures/legacy-missing-identity.json`、`tests/fixtures/legacy-hash-conflict.json`、`tests/fixtures/legacy-current-conflict.json`、`tests/fixtures/legacy-unknown-source.json`、`docs/architecture/legacy-task-inventory.json`、`docs/architecture/legacy-import-proof.json`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`tools/architecture/verify-migration-proof.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实旧任务处置证据 + legacy 入口归零
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T015
- **gate_cmd**：`node tools/architecture/verify-migration-proof.mjs --phase-gate --require-real-task-inventory --require-cases=supported,idempotent,missing-identity,hash-conflict,current-conflict,unknown-source --require-current-tree && node tools/architecture/inventory.mjs --check --require-zero=legacy-runtime`
- **expected_exit**：0
- **oracle**：ORACLE-LEGACY-MIGRATION：真实旧任务 active=0，或每项已有经用户确认的导入/归档/拒绝证明；同一 tree 的 GREEN 行为 receipt 覆盖全部案例；源码、CLI、schema、fixture、Bundle、Runner 中 legacy 入口归零
- **evidence_path**：`evidence/phase-3/legacy-zero.txt`
- **STOP**：真实旧任务未逐项审计、用户未确认处置或 active legacy 非 0 时 STOP；不得以兼容期、长期 reader 或静默删除替代。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：临时 importer 变永久产品或为赶进度丢失旧事实。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：固化不可变 legacy-import-proof（106 项用户确认处置，源聚合不变）；同 Phase 删除 legacy reader/importer/schema/fixture 与公开入口，inventory `--require-zero=legacy-runtime`=0；带 `--require-cases` 请求在最终 tree fail-loud（旧 writer 不可用，证据 `evidence/phase-3/legacy-cases-unavailable.txt`）。披露：一次性 importer 的删除前 fixture 用例执行证据未留存且代码不在 git 历史，无法重放；最终 AC-08 验收在 verify-code 携带本披露。
- **executed_commands**：`node tools/architecture/verify-migration-proof.mjs --phase-gate --require-real-task-inventory --require-current-tree && node tools/architecture/inventory.mjs --check --require-zero=legacy-runtime`（Phase 3 gate，exit 0）；`npm test`（全量回归，exit 0）；`node tools/architecture/verify-migration-proof.mjs --phase-gate --require-real-task-inventory --require-cases=supported,idempotent,missing-identity,hash-conflict,current-conflict,unknown-source --require-current-tree`（exit 1，旧 writer 不可用证明）
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/730ec45dfd54a62029b3b8285b9ffe27de7349ea0b6dfcb73efaa165a90e41e8.json","sha256":"647286b2af6198b0a5d9e269ab4faa72eb0993658b475528148da2da3acda191"},{"ref":"receipts/build-tests-phase-3-v2.json","sha256":"718cf5a7508cf3bd86b74a37bf89a7589a85bf40210b3f09c5b0b9ac903dc0a6"},{"ref":"receipts/build-tests-phase-3-regression-v2.json","sha256":"a7ded8d94f7fbd199db7b377183f5515b141e0b43a4e5f7e13fb6b8bfbd62ddd"},{"ref":"reviews/results/build-code-default-2096af554f9c5c00968fed34e05230d6924d21b3-3133f510-fd75-4024-9bc1-1211b544550c.json","sha256":"3fc1776048296a858b432a2c1bf7c4193d395bcdca0cf98fd7bcbc8c58987049"}]`
- **covered_ac**：AC-08、AC-13
- **review_fact**：`reviews/results/build-code-default-2096af554f9c5c00968fed34e05230d6924d21b3-3133f510-fd75-4024-9bc1-1211b544550c.json`
- **completed_at**：2026-07-31T04:33:03Z

### Verify

- **Target**：新任务 writer 单写；真实旧任务已逐项证明处置；迁移证据不可变；源码、CLI、schema、fixture、Bundle、Runner 中 legacy 入口=0。
- **gate_cmd**：`node tools/architecture/verify-migration-proof.mjs --phase-gate --require-real-task-inventory --require-current-tree && node tools/architecture/inventory.mjs --check --require-zero=legacy-runtime`
- **expected_exit**：0
- **evidence_path**：`evidence/phase-3/phase-result.json`
- **display_cmd**：N/A — gate 输出已可读
- **Oracle**：node tools/architecture/verify-migration-proof.mjs --phase-gate --require-real-task-inventory --require-current-tree && node tools/architecture/inventory.mjs --check --require-zero=legacy-runtime

### Knowledge

- 冻结 fixture 必须证明内容不丢、幂等和坏输入拒绝；真实旧任务只读 inventory 必须逐项处置；正式证据落盘后同 Phase 删除 legacy runtime 脚手架，task-only verifier 在 T054 删除。

### STOP

- 任何路径要求旧新双写、导入改变原始事实、真实旧任务仍未处置、迁移证明缺失或最终仍有 legacy 入口。

### Done

- 新任务 writer 单写；真实旧任务已逐项证明处置；迁移证据不可变；源码、CLI、schema、fixture、Bundle、Runner 中 legacy 入口=0。

### Risks and rollback

- **Risk**：切换时新旧 writer 同时可达、旧事实丢失或临时 importer 被误交付。
- **Prevention**：精确 boundary、同一 oracle、独立 review。
- **Rollback / recovery**：恢复 writer cutover 独立 diff；不得并行启用；失败时保留旧数据但不交付脚手架。

## Phase 4：切断历史推进许可证

### Goal

五阶段普通工作不再读取 checkpoint/reopen/rebind/recovery 等许可；verify/close 只按当前事实。

### Files

- **NEW**：`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/helpers/read-only-runner-fixture.mjs`、`tests/integration/progression-without-permits.test.mjs`
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`core/stage-context.mjs`、`core/stage-handlers.mjs`、`core/stage-acceptance-policy.mjs`、`core/git-checkpoint.mjs`、`core/task-close.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-close.mjs`
- **DO NOT TOUCH**：`core/task-handle.mjs`、`docs/architecture/legacy-import-proof.json`

### Tasks

#### T017 — 先证明普通工作仍被历史许可阻塞

- **ID**：T017
- **Phase**：Phase 4：切断历史推进许可证
- **goal**：先证明普通工作仍被历史许可阻塞
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T016
- **依赖**：T016
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-FLOW-001、FR-RUN-001、FR-MAT-001、FR-PUB-001
- **AC**：AC-01、AC-02、AC-04、AC-09
- **动作**：新增无许可推进 RED
- **精确文件**：`tests/integration/progression-without-permits.test.mjs`
- **boundary**：files: `tests/integration/progression-without-permits.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T018
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/progression-without-permits.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-PROGRESSION：材料可改可执行；stale 仅阻止正式 verify
- **evidence_path**：`evidence/phase-4/progression-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：误把质量门也当许可删除。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 progression-without-permits RED，复现旧 checkpoint 将普通材料修订误判为工作许可的阻塞。
- **executed_commands**：`./node_modules/.bin/vitest run tests/integration/progression-without-permits.test.mjs`（RED 证据）；Phase 4 GREEN 与补充完整回归 receipt 复跑。
- **evidence_refs**：[{"ref":"evidence/phase-4/progression-red.txt","sha256":"d0c0a86034a442ffe7ed3e41856210aaadb2c598432d511058207f634fdf9bcd"},{"ref":"receipts/revisions/implementation/6c6dff097b04d28c465854b3d4df47eb128ab510d0de670b329d91b5c3677d6c.json","sha256":"9b5aaa93c12966269d577bc5975975e021253e419face48f70cd592f6f699eba"},{"ref":"receipts/build-tests-phase-4-current.json","sha256":"04da5039b6faaf3bfcf3d4cb4ad6098b44a57a4316e9b1da1aca3a91ef72005e"},{"ref":"reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json","sha256":"92a475f027d04e30369484f6230cbae5f9f4ebf0f1aeeeb5b82470fcd2bbcb5f"}]
- **covered_ac**：AC-01、AC-02、AC-04、AC-09。
- **evidence_refs**：[{"ref":"evidence/phase-4/progression-red.txt","sha256":"d0c0a86034a442ffe7ed3e41856210aaadb2c598432d511058207f634fdf9bcd"},{"ref":"receipts/revisions/implementation/6c6dff097b04d28c465854b3d4df47eb128ab510d0de670b329d91b5c3677d6c.json","sha256":"9b5aaa93c12966269d577bc5975975e021253e419face48f70cd592f6f699eba"},{"ref":"receipts/build-tests-phase-4-current.json","sha256":"04da5039b6faaf3bfcf3d4cb4ad6098b44a57a4316e9b1da1aca3a91ef72005e"},{"ref":"reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json","sha256":"92a475f027d04e30369484f6230cbae5f9f4ebf0f1aeeeb5b82470fcd2bbcb5f"}]
- **review_fact**：`reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json`
- **completed_at**：2026-07-31

#### T018 — 切断 checkpoint/reopen/rebind/recovery 工作许可读取

- **ID**：T018
- **Phase**：Phase 4：切断历史推进许可证
- **goal**：切断 checkpoint/reopen/rebind/recovery 工作许可读取
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T017
- **依赖**：T017
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-FLOW-001、FR-RUN-001、FR-MAT-001、FR-PUB-001
- **AC**：AC-01、AC-02、AC-04、AC-09
- **动作**：改五阶段消费面与 verify/close 选择器
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`core/stage-context.mjs`、`core/stage-handlers.mjs`、`core/stage-acceptance-policy.mjs`、`core/git-checkpoint.mjs`、`core/task-close.mjs`、`core/task-kernel-implementation.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-close.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/integration/progression-without-permits.test.mjs`
- **boundary**：files: `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`core/stage-context.mjs`、`core/stage-handlers.mjs`、`core/stage-acceptance-policy.mjs`、`core/git-checkpoint.mjs`、`core/task-close.mjs`、`core/task-kernel-implementation.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-close.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/integration/progression-without-permits.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：历史事实只读且不授予许可
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T017
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/progression-without-permits.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-PROGRESSION：工作资格、结构有效、完成质量三个谓词分离
- **evidence_path**：`evidence/phase-4/progression-green.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：required review 被错误变可选。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：checkpoint 仅校验 Git ref 完整性；历史 accepted/checkpoint 不再授予普通推进许可；stale quality facts 留给 verify/close 新鲜度门；`readAccepted` 固定为历史只读读取。
- **executed_commands**：`./node_modules/.bin/vitest run tests/integration/progression-without-permits.test.mjs`；Phase 4 GREEN 与补充完整回归 receipt 复跑。
- **evidence_refs**：[{"ref":"evidence/build-tests-phase-4-t018-gate-v5.output","sha256":"ec4f69bc0354a3cc49d828e73629fd79040a3f23170f85975dbb98081d96bcf4"},{"ref":"receipts/revisions/implementation/6c6dff097b04d28c465854b3d4df47eb128ab510d0de670b329d91b5c3677d6c.json","sha256":"9b5aaa93c12966269d577bc5975975e021253e419face48f70cd592f6f699eba"},{"ref":"receipts/build-tests-phase-4-current.json","sha256":"04da5039b6faaf3bfcf3d4cb4ad6098b44a57a4316e9b1da1aca3a91ef72005e"},{"ref":"reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json","sha256":"92a475f027d04e30369484f6230cbae5f9f4ebf0f1aeeeb5b82470fcd2bbcb5f9f"}]
- **covered_ac**：AC-01、AC-02、AC-04、AC-09。
- **evidence_refs**：[{"ref":"evidence/build-tests-phase-4-t018-gate-v5.output","sha256":"ec4f69bc0354a3cc49d828e73629fd79040a3f23170f85975dbb98081d96bcf4"},{"ref":"receipts/revisions/implementation/6c6dff097b04d28c465854b3d4df47eb128ab510d0de670b329d91b5c3677d6c.json","sha256":"9b5aaa93c12966269d577bc5975975e021253e419face48f70cd592f6f699eba"},{"ref":"receipts/build-tests-phase-4-current.json","sha256":"04da5039b6faaf3bfcf3d4cb4ad6098b44a57a4316e9b1da1aca3a91ef72005e"},{"ref":"reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json","sha256":"92a475f027d04e30369484f6230cbae5f9f4ebf0f1aeeeb5b82470fcd2bbcb5f"}]
- **review_fact**：`reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json`
- **completed_at**：2026-07-31

#### T019 — 先固定三条完整五阶段恢复 E2E 与源码不可变合同

- **ID**：T019
- **Phase**：Phase 4：切断历史推进许可证
- **goal**：先固定三条完整五阶段恢复 E2E 与源码不可变合同
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T018
- **依赖**：T018
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-FLOW-001、FR-TEST-001、FR-PUB-002
- **AC**：AC-01、AC-02、AC-03、AC-12
- **动作**：新增三条用户级恢复 E2E 和只读 Runner/source immutability RED
- **精确文件**：`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/helpers/read-only-runner-fixture.mjs`
- **boundary**：files: `tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/helpers/read-only-runner-fixture.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T020
- **gate_cmd**：`./node_modules/.bin/vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-THREE-E2E：A正常；B中途修改材料+stale facts+major finding 修复；C写入中断+review unavailable 后同输入幂等重跑并在 provider 恢复后完成；三条均使用 clean-install 只读 Runner，Hub source 前后内容清单哈希完全一致
- **evidence_path**：`evidence/phase-4/e2e-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：E2E 通过 mock 绕过真实 CLI seam或遗漏 unavailable→recovery。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增三条真实 CLI 五阶段 E2E 与只读 Runner/source immutability fixture，覆盖正常、材料修订/stale facts 和中断后恢复路径。
- **executed_commands**：`./node_modules/.bin/vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs`；Phase 4 完整 GREEN receipt 复跑。
- **evidence_refs**：[{"ref":"receipts/revisions/implementation/6c6dff097b04d28c465854b3d4df47eb128ab510d0de670b329d91b5c3677d6c.json","sha256":"9b5aaa93c12966269d577bc5975975e021253e419face48f70cd592f6f699eba"},{"ref":"receipts/build-tests-phase-4-current.json","sha256":"04da5039b6faaf3bfcf3d4cb4ad6098b44a57a4316e9b1da1aca3a91ef72005e"},{"ref":"reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json","sha256":"92a475f027d04e30369484f6230cbae5f9f4ebf0f1aeeeb5b82470fcd2bbcb5f"}]
- **covered_ac**：AC-01、AC-02、AC-03、AC-12。
- **evidence_refs**：[{"ref":"receipts/revisions/implementation/6c6dff097b04d28c465854b3d4df47eb128ab510d0de670b329d91b5c3677d6c.json","sha256":"9b5aaa93c12966269d577bc5975975e021253e419face48f70cd592f6f699eba"},{"ref":"receipts/build-tests-phase-4-current.json","sha256":"04da5039b6faaf3bfcf3d4cb4ad6098b44a57a4316e9b1da1aca3a91ef72005e"},{"ref":"reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json","sha256":"92a475f027d04e30369484f6230cbae5f9f4ebf0f1aeeeb5b82470fcd2bbcb5f"}]
- **review_fact**：`reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json`
- **completed_at**：2026-07-31

#### T020 — 完成三条合成五阶段恢复 E2E

- **ID**：T020
- **Phase**：Phase 4：切断历史推进许可证
- **goal**：完成三条合成五阶段恢复 E2E
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T019
- **依赖**：T019
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-FLOW-001、FR-TEST-001、FR-PUB-002
- **AC**：AC-01、AC-02、AC-03、AC-12
- **动作**：修复 E2E 暴露 seam
- **精确文件**：`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/helpers/read-only-runner-fixture.mjs`、`scripts/stage-runtime.mjs`
- **boundary**：files: `tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/helpers/read-only-runner-fixture.mjs`、`scripts/stage-runtime.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：正常、材料修订+finding、写入中断+provider恢复三条核心用户路径闭合
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T019
- **gate_cmd**：`./node_modules/.bin/vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-THREE-E2E：三条真实 CLI 路径全绿；不使用 reopen/rebind/recovery；required review verdict 保留；业务任务不写 WorkflowHub 源码
- **evidence_path**：`evidence/phase-4/e2e-green.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：测试偷用源码仓既有 node_modules 或可写 Runner。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：完成三条合成五阶段恢复 E2E；保留 required review、provider unavailable/recovery 历史与重复执行幂等性；业务任务不写 WorkflowHub 源码。
- **executed_commands**：`./node_modules/.bin/vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs`；Phase 4 完整 GREEN receipt 复跑。
- **evidence_refs**：[{"ref":"receipts/revisions/implementation/6c6dff097b04d28c465854b3d4df47eb128ab510d0de670b329d91b5c3677d6c.json","sha256":"9b5aaa93c12966269d577bc5975975e021253e419face48f70cd592f6f699eba"},{"ref":"receipts/build-tests-phase-4-current.json","sha256":"04da5039b6faaf3bfcf3d4cb4ad6098b44a57a4316e9b1da1aca3a91ef72005e"},{"ref":"reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json","sha256":"92a475f027d04e30369484f6230cbae5f9f4ebf0f1aeeeb5b82470fcd2bbcb5f"}]
- **covered_ac**：AC-01、AC-02、AC-03、AC-12。
- **review_fact**：`reviews/results/build-code-default-e2bdf012a97ae4c90eb16e89a9e83c6368297991-67e3e3f6-5f25-4f83-9133-414d60e061e3.json`
- **completed_at**：2026-07-31

### Verify

- **Target**：3 条 E2E 覆盖正常、材料+质量修复和中断+provider恢复，且 WorkflowHub 源码前后完全不变。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/progression-without-permits.test.mjs tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs`
- **expected_exit**：0
- **evidence_path**：`evidence/phase-4/phase-result.json`
- **display_cmd**：N/A — gate 输出已可读
- **Oracle**：./node_modules/.bin/vitest run tests/integration/progression-without-permits.test.mjs tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs

### Knowledge

- 旧 evidence 仅使 verify incomplete，不阻止材料编辑和普通执行；三个 E2E 都从 clean-install 的只读 Runner 运行，前后 WorkflowHub 源码 tree 完全不变。

### STOP

- 任何 stage 仍需专用许可；close 可消费 stale 事实；业务任务需要写 WorkflowHub 源码才能恢复。

### Done

- 3 条 E2E 覆盖正常、材料+质量修复和中断+provider恢复，且 WorkflowHub 源码前后完全不变。

### Risks and rollback

- **Risk**：切断过早导致正式质量门丢失。
- **Prevention**：精确 boundary、同一 oracle、独立 review。
- **Rollback / recovery**：恢复本 Phase 独立 diff；不恢复双写。

## Phase 5：用户确认后的垂直删除

### Goal

先展示并确认逐项清单；随后 12 个切片各自 RED/GREEN，每项都有独立 diff、证据和恢复边界。

### Files

- **NEW**：`tools/architecture/reference-audit.mjs`、`tests/integration/deletion-slices-summary.test.mjs`、`tests/integration/deletion-grill-replacement.test.mjs`、`tests/integration/deletion-phase-trace.test.mjs`、`tests/integration/deletion-invalidation.test.mjs`、`tests/integration/deletion-continuation.test.mjs`、`tests/integration/deletion-rebind.test.mjs`、`tests/integration/deletion-reopen.test.mjs`、`tests/integration/deletion-stage-recovery.test.mjs`、`tests/integration/deletion-recovery-workspace.test.mjs`、`tests/integration/deletion-duplicate-projection.test.mjs`、`tests/integration/deletion-transition-journal.test.mjs`、`tests/integration/deletion-shadow-checkpoint.test.mjs`、`tests/integration/deletion-obsolete-tools.test.mjs`
- **MODIFY**：`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`docs/architecture/complexity-baseline.json`、`tools/architecture/deletion-proof.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`CONTEXT.md`、`README.md`、`core/stage-content-evidence.mjs`、`core/task-kernel-implementation.mjs`、`core/schemas/interaction-completion.v1.json`、`workflows/make-decision/SKILL.md`、`tests/stage-content-evidence.test.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-recovery.mjs`、`core/task-handle.mjs`、`workflows/build-code/phase-evidence.mjs`、`workflows/build-code/SKILL.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/scripts/integration-review-subject.mjs`、`skills/wh-review/scripts/phase-review-subject.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`tests/build-code-phase-evidence.test.mjs`、`core/audit-aggregator.mjs`、`scripts/validate-stage-replay.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`core/stage-context.mjs`、`core/task-recovery.mjs`、`core/workspace.mjs`、`workflows/build-plan/SKILL.md`、`workflows/build-spec/SKILL.md`、`tests/stage-content-continuation.test.mjs`、`core/git-checkpoint.mjs`、`core/stage-runner.mjs`、`workflows/verify-code/SKILL.md`、`core/__tests__/task-recovery.test.mjs`、`core/artifact-dir.mjs`、`core/canonical-receipt-writer.mjs`、`core/stage-handlers.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`core/build-spec-receipt-recovery.mjs`、`core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`core/runtime-mode.mjs`、`scripts/runtime-cutover.mjs`、`core/__tests__/workspace-manager.test.mjs`、`core/__tests__/runtime-mode.test.mjs`、`core/stage-skill-invocation.mjs`、`core/stage-completion-facts.mjs`、`core/receipt-schema.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/chain-topology.mjs`、`core/fact-indexes.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`core/task-close.mjs`、`scripts/task-close.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/task-close-delivery.test.mjs`、`core/dispatch-component.mjs`、`core/resolve-component.mjs`、`core/task-index.mjs`、`core/load-config.mjs`、`core/parse-framework-config.mjs`、`workflows/_spike/design-variant.mjs`、`workflows/_spike/design.mjs`、`workflows/_spike/intake.mjs`、`core/__tests__/task-index.test.mjs`、`core/__tests__/load-config.test.mjs`、`core/__tests__/parse-framework-config.test.mjs`、`tests/spike-intake-design.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`core/runtime-facade.mjs`、`core/publication.mjs`

### Tasks

#### T021 — 冻结逐项删除清单并取得用户确认

- **ID**：T021
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：冻结逐项删除清单并取得用户确认
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T020
- **依赖**：T020
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-INV-001
- **AC**：AC-06、AC-13
- **动作**：展示每项消费者、替代、测试、回滚与精确文件
- **精确文件**：`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`tools/architecture/deletion-proof.mjs`
- **boundary**：files: `docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`tools/architecture/deletion-proof.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：删除前人工门完成
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：N/A — non-behavior change: 删除授权门
- **paired_task**：N/A — non-behavior change
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --all --require-user-confirmation`
- **expected_exit**：0
- **oracle**：ORACLE-DELETE-CONFIRM：12 项 proof 完整且各自有用户选择；未确认为 KEEP
- **evidence_path**：`evidence/phase-5/delete-confirmation.json`
- **STOP**：用户未逐项确认或任一 proof 缺字段时 STOP/KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：确认不能推断 Git 提交或推送授权。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T022 — 先证明 DEL-01 Grill replacement 旧入口仍可达

- **ID**：T022
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-01 Grill replacement 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T021
- **依赖**：T021
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-01 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-grill-replacement.test.mjs`
- **boundary**：files: `tests/integration/deletion-grill-replacement.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T023
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-01 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-grill-replacement.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-01`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-01：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-01-red.txt`
- **STOP**：DEL-01 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：Grill replacement 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T023 — 垂直删除 DEL-01 Grill replacement

- **ID**：T023
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-01 Grill replacement
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T022
- **依赖**：T022
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-grill-replacement.test.mjs`、`core/stage-content-evidence.mjs`、`core/task-kernel-implementation.mjs`、`core/schemas/interaction-completion.v1.json`、`workflows/make-decision/SKILL.md`、`tests/stage-content-evidence.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-grill-replacement.test.mjs`、`core/stage-content-evidence.mjs`、`core/task-kernel-implementation.mjs`、`core/schemas/interaction-completion.v1.json`、`workflows/make-decision/SKILL.md`、`tests/stage-content-evidence.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T022
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-01 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-grill-replacement.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-01`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-01：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-01-green.txt`
- **STOP**：DEL-01 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：Grill replacement 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T024 — 先证明 DEL-02 Phase trace lineage 旧入口仍可达

- **ID**：T024
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-02 Phase trace lineage 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T023
- **依赖**：T023
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-02 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-phase-trace.test.mjs`
- **boundary**：files: `tests/integration/deletion-phase-trace.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T025
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-02 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-phase-trace.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-02`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-02：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-02-red.txt`
- **STOP**：DEL-02 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：Phase trace lineage 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T025 — 垂直删除 DEL-02 Phase trace lineage

- **ID**：T025
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-02 Phase trace lineage
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T024
- **依赖**：T024
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-phase-trace.test.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-recovery.mjs`、`core/task-handle.mjs`、`core/task-kernel-implementation.mjs`、`workflows/build-code/phase-evidence.mjs`、`workflows/build-code/SKILL.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/scripts/integration-review-subject.mjs`、`skills/wh-review/scripts/phase-review-subject.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-phase-trace.test.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-recovery.mjs`、`core/task-handle.mjs`、`core/task-kernel-implementation.mjs`、`workflows/build-code/phase-evidence.mjs`、`workflows/build-code/SKILL.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/scripts/integration-review-subject.mjs`、`skills/wh-review/scripts/phase-review-subject.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T024
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-02 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-phase-trace.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-02`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-02：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-02-green.txt`
- **STOP**：DEL-02 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：Phase trace lineage 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T026 — 先证明 DEL-03 专用 invalidation 旧入口仍可达

- **ID**：T026
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-03 专用 invalidation 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T025
- **依赖**：T025
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-03 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-invalidation.test.mjs`
- **boundary**：files: `tests/integration/deletion-invalidation.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T027
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-03 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-invalidation.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-03`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-03：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-03-red.txt`
- **STOP**：DEL-03 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：专用 invalidation 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T027 — 垂直删除 DEL-03 专用 invalidation

- **ID**：T027
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-03 专用 invalidation
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T026
- **依赖**：T026
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-invalidation.test.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/audit-aggregator.mjs`、`scripts/validate-stage-replay.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-invalidation.test.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/audit-aggregator.mjs`、`scripts/validate-stage-replay.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T026
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-03 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-invalidation.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-03`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-03：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-03-green.txt`
- **STOP**：DEL-03 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：专用 invalidation 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T028 — 先证明 DEL-04 continuation 旧入口仍可达

- **ID**：T028
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-04 continuation 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T027
- **依赖**：T027
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-04 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-continuation.test.mjs`
- **boundary**：files: `tests/integration/deletion-continuation.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T029
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-04 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-continuation.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-04`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-04：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-04-red.txt`
- **STOP**：DEL-04 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：continuation 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T029 — 垂直删除 DEL-04 continuation

- **ID**：T029
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-04 continuation
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T028
- **依赖**：T028
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-continuation.test.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/stage-context.mjs`、`core/task-recovery.mjs`、`core/workspace.mjs`、`workflows/build-plan/SKILL.md`、`workflows/build-spec/SKILL.md`、`tests/stage-content-continuation.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-continuation.test.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/stage-context.mjs`、`core/task-recovery.mjs`、`core/workspace.mjs`、`workflows/build-plan/SKILL.md`、`workflows/build-spec/SKILL.md`、`tests/stage-content-continuation.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T028
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-04 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-continuation.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-04`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-04：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-04-green.txt`
- **STOP**：DEL-04 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：continuation 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T030 — 先证明 DEL-05 rebind 旧入口仍可达

- **ID**：T030
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-05 rebind 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T029
- **依赖**：T029
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-05 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-rebind.test.mjs`
- **boundary**：files: `tests/integration/deletion-rebind.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T031
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-05 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-rebind.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-05`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-05：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-05-red.txt`
- **STOP**：DEL-05 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：rebind 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T031 — 垂直删除 DEL-05 rebind

- **ID**：T031
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-05 rebind
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T030
- **依赖**：T030
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-rebind.test.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/git-checkpoint.mjs`、`core/stage-runner.mjs`、`core/task-recovery.mjs`、`core/workspace.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`core/__tests__/task-recovery.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-rebind.test.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/git-checkpoint.mjs`、`core/stage-runner.mjs`、`core/task-recovery.mjs`、`core/workspace.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`core/__tests__/task-recovery.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T030
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-05 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-rebind.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-05`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-05：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-05-green.txt`
- **STOP**：DEL-05 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：rebind 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T032 — 先证明 DEL-06 reopen 旧入口仍可达

- **ID**：T032
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-06 reopen 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T031
- **依赖**：T031
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-06 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-reopen.test.mjs`
- **boundary**：files: `tests/integration/deletion-reopen.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T033
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-06 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-reopen.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-06`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-06：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-06-red.txt`
- **STOP**：DEL-06 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：reopen 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T033 — 垂直删除 DEL-06 reopen

- **ID**：T033
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-06 reopen
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T032
- **依赖**：T032
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-reopen.test.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/artifact-dir.mjs`、`core/canonical-receipt-writer.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`core/task-recovery.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tests/stage-orchestrator-v2.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-reopen.test.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/artifact-dir.mjs`、`core/canonical-receipt-writer.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`core/task-recovery.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tests/stage-orchestrator-v2.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T032
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-06 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-reopen.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-06`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-06：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-06-green.txt`
- **STOP**：DEL-06 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：reopen 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T034 — 先证明 DEL-07 stage recovery 与 recover-spec 旧入口仍可达

- **ID**：T034
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-07 stage recovery 与 recover-spec 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T033
- **依赖**：T033
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-07 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-stage-recovery.test.mjs`
- **boundary**：files: `tests/integration/deletion-stage-recovery.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T035
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-07 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-stage-recovery.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-07`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-07：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-07-red.txt`
- **STOP**：DEL-07 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：stage recovery 与 recover-spec 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T035 — 垂直删除 DEL-07 stage recovery 与 recover-spec

- **ID**：T035
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-07 stage recovery 与 recover-spec
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T034
- **依赖**：T034
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-stage-recovery.test.mjs`、`core/build-spec-receipt-recovery.mjs`、`core/task-recovery.mjs`、`scripts/task-recovery.mjs`、`scripts/stage-runtime.mjs`、`core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-stage-recovery.test.mjs`、`core/build-spec-receipt-recovery.mjs`、`core/task-recovery.mjs`、`scripts/task-recovery.mjs`、`scripts/stage-runtime.mjs`、`core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T034
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-07 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-stage-recovery.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-07`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-07：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-07-green.txt`
- **STOP**：DEL-07 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：stage recovery 与 recover-spec 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T036 — 先证明 DEL-08 recovery/reset workspace CAS 旧入口仍可达

- **ID**：T036
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-08 recovery/reset workspace CAS 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T035
- **依赖**：T035
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-08 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-recovery-workspace.test.mjs`
- **boundary**：files: `tests/integration/deletion-recovery-workspace.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T037
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-08 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-recovery-workspace.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-08`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-08：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-08-red.txt`
- **STOP**：DEL-08 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：recovery/reset workspace CAS 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T037 — 垂直删除 DEL-08 recovery/reset workspace CAS

- **ID**：T037
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-08 recovery/reset workspace CAS
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T036
- **依赖**：T036
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-recovery-workspace.test.mjs`、`core/task-recovery.mjs`、`core/workspace.mjs`、`core/runtime-mode.mjs`、`core/git-checkpoint.mjs`、`scripts/runtime-cutover.mjs`、`scripts/task-recovery.mjs`、`core/__tests__/workspace-manager.test.mjs`、`core/__tests__/runtime-mode.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-recovery-workspace.test.mjs`、`core/task-recovery.mjs`、`core/workspace.mjs`、`core/runtime-mode.mjs`、`core/git-checkpoint.mjs`、`scripts/runtime-cutover.mjs`、`scripts/task-recovery.mjs`、`core/__tests__/workspace-manager.test.mjs`、`core/__tests__/runtime-mode.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T036
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-08 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-recovery-workspace.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-08`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-08：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-08-green.txt`
- **STOP**：DEL-08 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：recovery/reset workspace CAS 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T038 — 先证明 DEL-09 重复 invocation/completion projection 旧入口仍可达

- **ID**：T038
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-09 重复 invocation/completion projection 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T037
- **依赖**：T037
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-09 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-duplicate-projection.test.mjs`
- **boundary**：files: `tests/integration/deletion-duplicate-projection.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T039
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-09 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-duplicate-projection.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-09`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-09：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-09-red.txt`
- **STOP**：DEL-09 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：重复 invocation/completion projection 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T039 — 垂直删除 DEL-09 重复 invocation/completion projection

- **ID**：T039
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-09 重复 invocation/completion projection
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T038
- **依赖**：T038
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-duplicate-projection.test.mjs`、`core/stage-skill-invocation.mjs`、`core/stage-completion-facts.mjs`、`core/stage-content-evidence.mjs`、`core/canonical-receipt-writer.mjs`、`core/receipt-schema.mjs`、`core/task-kernel-implementation.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-duplicate-projection.test.mjs`、`core/stage-skill-invocation.mjs`、`core/stage-completion-facts.mjs`、`core/stage-content-evidence.mjs`、`core/canonical-receipt-writer.mjs`、`core/receipt-schema.mjs`、`core/task-kernel-implementation.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T038
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-09 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-duplicate-projection.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-09`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-09：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-09-green.txt`
- **STOP**：DEL-09 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：重复 invocation/completion projection 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T040 — 先证明 DEL-10 stage-transition journal 旧入口仍可达

- **ID**：T040
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-10 stage-transition journal 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T039
- **依赖**：T039
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-10 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-transition-journal.test.mjs`
- **boundary**：files: `tests/integration/deletion-transition-journal.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T041
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-10 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-transition-journal.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-10`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-10：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-10-red.txt`
- **STOP**：DEL-10 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：stage-transition journal 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T041 — 垂直删除 DEL-10 stage-transition journal

- **ID**：T041
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-10 stage-transition journal
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T040
- **依赖**：T040
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-transition-journal.test.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/audit-aggregator.mjs`、`core/chain-topology.mjs`、`core/fact-indexes.mjs`、`core/task-handle.mjs`、`core/task-kernel-implementation.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-transition-journal.test.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/audit-aggregator.mjs`、`core/chain-topology.mjs`、`core/fact-indexes.mjs`、`core/task-handle.mjs`、`core/task-kernel-implementation.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T040
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-10 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-transition-journal.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-10`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-10：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-10-green.txt`
- **STOP**：DEL-10 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：stage-transition journal 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T042 — 先证明 DEL-11 shadow current/head/checkpoint 旧入口仍可达

- **ID**：T042
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-11 shadow current/head/checkpoint 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T041
- **依赖**：T041
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-11 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-shadow-checkpoint.test.mjs`
- **boundary**：files: `tests/integration/deletion-shadow-checkpoint.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T043
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-11 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-shadow-checkpoint.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-11`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-11：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-11-red.txt`
- **STOP**：DEL-11 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：shadow current/head/checkpoint 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T043 — 垂直删除 DEL-11 shadow current/head/checkpoint

- **ID**：T043
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-11 shadow current/head/checkpoint
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T042
- **依赖**：T042
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-shadow-checkpoint.test.mjs`、`core/git-checkpoint.mjs`、`core/task-handle.mjs`、`core/task-kernel-implementation.mjs`、`core/stage-runner.mjs`、`core/task-close.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-close.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/task-close-delivery.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-shadow-checkpoint.test.mjs`、`core/git-checkpoint.mjs`、`core/task-handle.mjs`、`core/task-kernel-implementation.mjs`、`core/stage-runner.mjs`、`core/task-close.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-close.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/task-close-delivery.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T042
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-11 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-shadow-checkpoint.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-11`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-11：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-11-green.txt`
- **STOP**：DEL-11 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：shadow current/head/checkpoint 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T044 — 先证明 DEL-12 旧 dispatch/config/index/spike 旧入口仍可达

- **ID**：T044
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：先证明 DEL-12 旧 dispatch/config/index/spike 旧入口仍可达
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T043
- **依赖**：T043
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：新增 DEL-12 同一删除前后 oracle
- **精确文件**：`tests/integration/deletion-obsolete-tools.test.mjs`
- **boundary**：files: `tests/integration/deletion-obsolete-tools.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T045
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-12 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-obsolete-tools.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-12`
- **expected_exit**：1
- **oracle**：ORACLE-DEL-12：旧入口 unsupported，替代路径和同一负测通过
- **evidence_path**：`evidence/phase-5/del-12-red.txt`
- **STOP**：DEL-12 proof 或用户确认缺失时 KEEP；不得执行删除。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：旧 dispatch/config/index/spike 隐藏消费者未被覆盖。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T045 — 垂直删除 DEL-12 旧 dispatch/config/index/spike

- **ID**：T045
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：垂直删除 DEL-12 旧 dispatch/config/index/spike
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T044
- **依赖**：T044
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-DEL-002、FR-TEST-001
- **AC**：AC-06、AC-07、AC-12
- **动作**：同切片移除入口、实现、schema、fixture、专属测试和术语
- **精确文件**：`tests/integration/deletion-obsolete-tools.test.mjs`、`core/dispatch-component.mjs`、`core/resolve-component.mjs`、`core/task-index.mjs`、`core/load-config.mjs`、`core/parse-framework-config.mjs`、`workflows/_spike/design-variant.mjs`、`workflows/_spike/design.mjs`、`workflows/_spike/intake.mjs`、`core/__tests__/task-index.test.mjs`、`core/__tests__/load-config.test.mjs`、`core/__tests__/parse-framework-config.test.mjs`、`tests/spike-intake-design.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`
- **boundary**：files: `tests/integration/deletion-obsolete-tools.test.mjs`、`core/dispatch-component.mjs`、`core/resolve-component.mjs`、`core/task-index.mjs`、`core/load-config.mjs`、`core/parse-framework-config.mjs`、`workflows/_spike/design-variant.mjs`、`workflows/_spike/design.mjs`、`workflows/_spike/intake.mjs`、`core/__tests__/task-index.test.mjs`、`core/__tests__/load-config.test.mjs`、`core/__tests__/parse-framework-config.test.mjs`、`tests/spike-intake-design.test.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`CONTEXT.md`、`README.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：一个独立可恢复的删除 diff 和证据边界；不自动 commit
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T044
- **gate_cmd**：`node tools/architecture/deletion-proof.mjs --slice=DEL-12 --require-user-confirmation && ./node_modules/.bin/vitest run tests/integration/deletion-obsolete-tools.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --slice=DEL-12`
- **expected_exit**：0
- **oracle**：ORACLE-DEL-12：旧入口明确失败，反向引用=0；替代路径、故障注入、Bundle、legacy、3 E2E、full/check 均通过
- **evidence_path**：`evidence/phase-5/del-12-green.txt`
- **STOP**：DEL-12 proof、用户确认、同一 RED、精确文件清单或完整质量矩阵任一不满足即 KEEP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：旧 dispatch/config/index/spike 删除不完整留下孤儿或局部绿掩盖全局退化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T046 — 复算全部删除归零项和跨切片回归

- **ID**：T046
- **Phase**：Phase 5：用户确认后的垂直删除
- **goal**：复算全部删除归零项和跨切片回归
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T045
- **依赖**：T045
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-RUN-001、FR-DEL-002、FR-INV-001
- **AC**：AC-07、AC-13、AC-14
- **动作**：执行跨切片引用和质量审计
- **精确文件**：`tests/integration/deletion-slices-summary.test.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/complexity-baseline.json`
- **boundary**：files: `tests/integration/deletion-slices-summary.test.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/complexity-baseline.json`; symbols/regions: 本 Task goal 对应区域
- **输出**：删除结果可复算
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：N/A — non-behavior change: 最终删除审计
- **paired_task**：N/A — non-behavior change
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/deletion-slices-summary.test.mjs && node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates`
- **expected_exit**：0
- **oracle**：ORACLE-DELETE-SUMMARY：确认删除项旧引用=0；硬归零项=0；KEEP 项仍可用
- **evidence_path**：`evidence/phase-5/deletion-summary.json`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：局部绿掩盖跨切片断裂。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

### Verify

- **Target**：12 个切片逐项完成或明确 KEEP；每个 DELETE 的旧引用为 0、质量矩阵全绿、归零清单可复算。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/deletion-slices-summary.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check`
- **expected_exit**：0
- **evidence_path**：`evidence/phase-5/phase-result.json`
- **display_cmd**：N/A — gate 输出已可读
- **Oracle**：./node_modules/.bin/vitest run tests/integration/deletion-slices-summary.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check

### Knowledge

- 每个 DEL-01..12 必须有完整 proof 和用户确认；未确认或缺证即 KEEP；删除不等于提交，Git 操作仍需关闭阶段独立授权。

### STOP

- 任何切片 proof 不完整、用户未确认、旧入口仍成功、focused/3 E2E/full/check 退化或需要跨切片大爆炸。

### Done

- 12 个切片逐项完成或明确 KEEP；每个 DELETE 的旧引用为 0、质量矩阵全绿、归零清单可复算。

### Risks and rollback

- **Risk**：隐藏消费者导致误删。
- **Prevention**：精确 boundary、同一 oracle、独立 review。
- **Rollback / recovery**：每个 GREEN 保持独立 diff/evidence/revert boundary；禁止补偿状态机或擅自 commit。

## Phase 6：全局 legacy 归零复核

### Goal

12 个删除切片后再次证明最终源码、CLI、schema、tests、Bundle、Runner 和 inventory 中不存在迁移脚手架、旧 writer 或双写。

### Files

- **NEW**：`tests/contract/legacy-zero.test.mjs`
- **MODIFY**：`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`package.json`
- **DO NOT TOUCH**：`docs/architecture/legacy-import-proof.json`、`core/task-handle.mjs`

### Tasks

#### T047 — 建立全仓 legacy-zero 合同

- **ID**：T047
- **Phase**：Phase 6：全局 legacy 归零复核
- **goal**：建立全仓 legacy-zero 合同
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T046
- **依赖**：T046
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-LEG-001、FR-INV-001、FR-DIST-001
- **AC**：AC-08、AC-10、AC-13
- **动作**：新增最终全仓归零 RED
- **精确文件**：`tests/contract/legacy-zero.test.mjs`
- **boundary**：files: `tests/contract/legacy-zero.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T048
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/legacy-zero.test.mjs && node tools/architecture/inventory.mjs --check`
- **expected_exit**：1
- **oracle**：ORACLE-LEGACY-ZERO-FINAL：源码、CLI、schema、tests、Bundle、Runner、inventory 全为 0
- **evidence_path**：`evidence/phase-6/legacy-zero-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：负测只扫描文件名漏掉动态入口。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T048 — 修复任何 legacy 残留并固化零值 guard

- **ID**：T048
- **Phase**：Phase 6：全局 legacy 归零复核
- **goal**：修复任何 legacy 残留并固化零值 guard
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T047
- **依赖**：T047
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-LEG-001、FR-INV-001、FR-DIST-001
- **AC**：AC-08、AC-10、AC-13
- **动作**：清除切片后残留引用并把零值检查纳入 focused/full
- **精确文件**：`tests/contract/legacy-zero.test.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`package.json`
- **boundary**：files: `tests/contract/legacy-zero.test.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`package.json`; symbols/regions: 本 Task goal 对应区域
- **输出**：最终 legacy=0
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T047
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/legacy-zero.test.mjs && node tools/architecture/inventory.mjs --check`
- **expected_exit**：0
- **oracle**：ORACLE-LEGACY-ZERO-FINAL：迁移证据存在且所有可执行/发布 legacy 入口归零
- **evidence_path**：`evidence/phase-6/legacy-zero-green.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：为通过扫描误删迁移证据或历史数据。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

### Verify

- **Target**：迁移证据可核验，legacy reader/importer/writer/schema/fixture/Bundle/Runner 引用全部为 0。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/legacy-zero.test.mjs && node tools/architecture/inventory.mjs --check`
- **expected_exit**：0
- **evidence_path**：`evidence/phase-6/phase-result.json`
- **display_cmd**：N/A — gate 输出已可读
- **Oracle**：./node_modules/.bin/vitest run tests/contract/legacy-zero.test.mjs && node tools/architecture/inventory.mjs --check

### Knowledge

- Phase 3 的迁移证据只读保留；真实旧数据和 Git 历史不改写。

### STOP

- 任何 legacy 入口、fixture、schema、公开命令、发布引用或双写残留。

### Done

- 迁移证据可核验，legacy reader/importer/writer/schema/fixture/Bundle/Runner 引用全部为 0。

### Risks and rollback

- **Risk**：删除切片重新引入旧术语或隐式 reader。
- **Prevention**：精确 boundary、同一 oracle、独立 review。
- **Rollback / recovery**：本 Phase 只加最终零值 guard；失败回到引入残留的 owning slice。

## Phase 7：按外部质量谓词精简测试

### Goal

机制删除完成后，对最终 inventory 的全部测试逐文件作 keep/merge/move/delete 处置，再按 contract/integration/e2e/fixtures 组织，保留 3 E2E 和 5 破坏样本。

### Files

- **NEW**：`tools/architecture/test-disposition.mjs`、`docs/architecture/test-disposition.tsv`、`tests/contract/test-disposition.test.mjs`、`tests/fixtures/mutations/identity-tree-hash.json`、`tests/fixtures/mutations/missing-completion.json`、`tests/fixtures/mutations/review-major.json`、`tests/fixtures/mutations/confirmation-authorization.json`、`tests/fixtures/mutations/bundle-pollution.json`、`tests/integration/mutation-guards.test.mjs`
- **MODIFY**：`package.json`、`vitest.config.mjs`、`tests/helpers/runner-fixture.mjs`、`tools/architecture/complexity-report.mjs`、`docs/architecture/repository-inventory.tsv`、`core/completion-predicates.mjs`、`core/skill-bundle-release.mjs`、`core/__tests__/artifact-dir.test.mjs`、`core/__tests__/canonical-review-result.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/check-anti-host.test.mjs`、`core/__tests__/check-contract.test.mjs`、`core/__tests__/check-extensibility.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/kernel.test.mjs`、`core/__tests__/load-config.test.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/parse-framework-config.test.mjs`、`core/__tests__/protected-paths.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/resolve-path.test.mjs`、`core/__tests__/run-checks.test.mjs`、`core/__tests__/runtime-mode.test.mjs`、`core/__tests__/skill-static-deps.test.mjs`、`core/__tests__/stage-acceptance-policy.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/storage-root.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/task-identity.test.mjs`、`core/__tests__/task-index.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-kernel-security.test.mjs`、`core/__tests__/task-recovery.test.mjs`、`core/__tests__/task-runner-root-migration.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`core/__tests__/validate-contract.test.mjs`、`core/__tests__/workspace-manager.test.mjs`、`core/__tests__/workspace-runner.test.mjs`、`scripts/__tests__/canonical-archive-skill-dispatch.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`scripts/__tests__/run-wh-review-audit-e2e.test.mjs`、`scripts/__tests__/run-wh-review-provider-smoke.test.mjs`、`scripts/__tests__/runner-replacement-bridge.test.mjs`、`scripts/__tests__/runner-unbinding-migration.test.mjs`、`scripts/__tests__/smoke-local-skill-dispatch.test.mjs`、`scripts/__tests__/stage-runtime-acceptance-publication.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`scripts/__tests__/task-bootstrap.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`skills/debate/__tests__/skill-contract.test.mjs`、`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs`、`skills/isolated-browser-qa/__tests__/skill-contract.test.mjs`、`skills/review-response/__tests__/skill-contract.test.mjs`、`skills/test-routing-advisor/__tests__/skill-contract.test.mjs`、`skills/wh-review/__tests__/human-brief-behavioral.test.mjs`、`skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs`、`skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`、`skills/wh-review/scripts/__tests__/review-controller.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`tests/baseline.test.mjs`、`tests/boundary-confirm.test.mjs`、`tests/build-code-capture.test.mjs`、`tests/build-code-diff-only.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/build-code-target.test.mjs`、`tests/canonical-source.test.mjs`、`tests/contract-freeze.test.mjs`、`tests/design-stage-skill-order.red.test.mjs`、`tests/execution-record.test.mjs`、`tests/facts-subschema.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/fixtures/derived-review-provider.mjs`、`tests/fixtures/interaction-quality/r9-spec-clarify.json`、`tests/fixtures/step-audit/duplicate.json`、`tests/fixtures/step-audit/missing.json`、`tests/fixtures/step-audit/normal.json`、`tests/fixtures/step-audit/out-of-order.json`、`tests/fixtures/step-audit/stale.json`、`tests/fixtures/step-audit/tampered-hash.json`、`tests/fixtures/step-audit/unexpected.json`、`tests/fixtures/step-audit/unknown.json`、`tests/fixtures/template-content-quality/retention-map.json`、`tests/helpers/formal-review.mjs`、`tests/helpers/human-confirmation.mjs`、`tests/host-independence.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/knowledge-card.test.mjs`、`tests/m12-reuse-registry.test.mjs`、`tests/m12-subskill-exclusion.test.mjs`、`tests/m12-templates.test.mjs`、`tests/m14a-audit-contract-layer.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`tests/metrics-smoke.test.mjs`、`tests/metrics-taskhandle-v2.test.mjs`、`tests/moat-skills-phase1.test.mjs`、`tests/moat-skills-phase2.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/p0-foundation-contracts.test.mjs`、`tests/per-invocation-doc-contract.test.mjs`、`tests/per-invocation-execution-identity.test.mjs`、`tests/phase-adjudication-correction-scope.test.mjs`、`tests/phase-gate.test.mjs`、`tests/requirement-lineage.test.mjs`、`tests/reuse-registry.test.mjs`、`tests/skill-provenance-strict.test.mjs`、`tests/smoke.test.mjs`、`tests/spec-content-profile.test.mjs`、`tests/spec-specify-template.test.mjs`、`tests/spike-intake-design.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/stage-content-continuation.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/stage-content-host-independence.test.mjs`、`tests/stage-content-publication.test.mjs`、`tests/stage-decision-contract.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`tests/stage-quality.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/step-manifest.test.mjs`、`tests/task-accepted-schema.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/task-record-paths-check.test.mjs`、`tests/template-content-quality-retention.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`tests/verify-code-capture.test.mjs`、`tests/verify-code-design-alignment.test.mjs`、`tests/verify-code-facts.test.mjs`、`tests/verify-code-freshness.test.mjs`、`tests/vitest-resource-policy.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`workflows/verify-code/phase-1-contract.test.mjs`
- **DO NOT TOUCH**：`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/integration/atomic-write-faults.test.mjs`、`tests/contract/legacy-zero.test.mjs`

### Tasks

#### T049 — 逐文件处置全部测试并按外部质量谓词重组

- **ID**：T049
- **Phase**：Phase 7：按外部质量谓词精简测试
- **goal**：逐文件处置全部测试并按外部质量谓词重组
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T048
- **依赖**：T048
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-TEST-001、FR-GOV-001、FR-MET-001
- **AC**：AC-12、AC-14、AC-15
- **动作**：生成 test-disposition.tsv，逐批执行机械合并/移动/删除；Phase 5 新增的 13 个 deletion migration tests（summary + 12 slices）在验证替代 oracle 后全部删除，不进入最终测试集
- **精确文件**：`package.json`、`vitest.config.mjs`、`tests/helpers/runner-fixture.mjs`、`tools/architecture/test-disposition.mjs`、`docs/architecture/test-disposition.tsv`、`tests/contract/test-disposition.test.mjs`、`tools/architecture/complexity-report.mjs`、`docs/architecture/repository-inventory.tsv`、`core/__tests__/artifact-dir.test.mjs`、`core/__tests__/canonical-review-result.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/check-anti-host.test.mjs`、`core/__tests__/check-contract.test.mjs`、`core/__tests__/check-extensibility.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/kernel.test.mjs`、`core/__tests__/load-config.test.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/parse-framework-config.test.mjs`、`core/__tests__/protected-paths.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/resolve-path.test.mjs`、`core/__tests__/run-checks.test.mjs`、`core/__tests__/runtime-mode.test.mjs`、`core/__tests__/skill-static-deps.test.mjs`、`core/__tests__/stage-acceptance-policy.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/storage-root.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/task-identity.test.mjs`、`core/__tests__/task-index.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-kernel-security.test.mjs`、`core/__tests__/task-recovery.test.mjs`、`core/__tests__/task-runner-root-migration.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`core/__tests__/validate-contract.test.mjs`、`core/__tests__/workspace-manager.test.mjs`、`core/__tests__/workspace-runner.test.mjs`、`scripts/__tests__/canonical-archive-skill-dispatch.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`scripts/__tests__/run-wh-review-audit-e2e.test.mjs`、`scripts/__tests__/run-wh-review-provider-smoke.test.mjs`、`scripts/__tests__/runner-replacement-bridge.test.mjs`、`scripts/__tests__/runner-unbinding-migration.test.mjs`、`scripts/__tests__/smoke-local-skill-dispatch.test.mjs`、`scripts/__tests__/stage-runtime-acceptance-publication.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`scripts/__tests__/task-bootstrap.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`skills/debate/__tests__/skill-contract.test.mjs`、`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs`、`skills/isolated-browser-qa/__tests__/skill-contract.test.mjs`、`skills/review-response/__tests__/skill-contract.test.mjs`、`skills/test-routing-advisor/__tests__/skill-contract.test.mjs`、`skills/wh-review/__tests__/human-brief-behavioral.test.mjs`、`skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs`、`skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`、`skills/wh-review/scripts/__tests__/review-controller.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`tests/baseline.test.mjs`、`tests/boundary-confirm.test.mjs`、`tests/build-code-capture.test.mjs`、`tests/build-code-diff-only.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/build-code-target.test.mjs`、`tests/canonical-source.test.mjs`、`tests/contract-freeze.test.mjs`、`tests/design-stage-skill-order.red.test.mjs`、`tests/execution-record.test.mjs`、`tests/facts-subschema.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/fixtures/derived-review-provider.mjs`、`tests/fixtures/interaction-quality/r9-spec-clarify.json`、`tests/fixtures/step-audit/duplicate.json`、`tests/fixtures/step-audit/missing.json`、`tests/fixtures/step-audit/normal.json`、`tests/fixtures/step-audit/out-of-order.json`、`tests/fixtures/step-audit/stale.json`、`tests/fixtures/step-audit/tampered-hash.json`、`tests/fixtures/step-audit/unexpected.json`、`tests/fixtures/step-audit/unknown.json`、`tests/fixtures/template-content-quality/retention-map.json`、`tests/helpers/formal-review.mjs`、`tests/helpers/human-confirmation.mjs`、`tests/host-independence.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/knowledge-card.test.mjs`、`tests/m12-reuse-registry.test.mjs`、`tests/m12-subskill-exclusion.test.mjs`、`tests/m12-templates.test.mjs`、`tests/m14a-audit-contract-layer.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`tests/metrics-smoke.test.mjs`、`tests/metrics-taskhandle-v2.test.mjs`、`tests/moat-skills-phase1.test.mjs`、`tests/moat-skills-phase2.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/p0-foundation-contracts.test.mjs`、`tests/per-invocation-doc-contract.test.mjs`、`tests/per-invocation-execution-identity.test.mjs`、`tests/phase-adjudication-correction-scope.test.mjs`、`tests/phase-gate.test.mjs`、`tests/requirement-lineage.test.mjs`、`tests/reuse-registry.test.mjs`、`tests/skill-provenance-strict.test.mjs`、`tests/smoke.test.mjs`、`tests/spec-content-profile.test.mjs`、`tests/spec-specify-template.test.mjs`、`tests/spike-intake-design.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/stage-content-continuation.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/stage-content-host-independence.test.mjs`、`tests/stage-content-publication.test.mjs`、`tests/stage-decision-contract.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`tests/stage-quality.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/step-manifest.test.mjs`、`tests/task-accepted-schema.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/task-record-paths-check.test.mjs`、`tests/template-content-quality-retention.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`tests/verify-code-capture.test.mjs`、`tests/verify-code-design-alignment.test.mjs`、`tests/verify-code-facts.test.mjs`、`tests/verify-code-freshness.test.mjs`、`tests/vitest-resource-policy.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`workflows/verify-code/phase-1-contract.test.mjs`
- **boundary**：files: `package.json`、`vitest.config.mjs`、`tests/helpers/runner-fixture.mjs`、`tools/architecture/test-disposition.mjs`、`docs/architecture/test-disposition.tsv`、`tests/contract/test-disposition.test.mjs`、`tools/architecture/complexity-report.mjs`、`docs/architecture/repository-inventory.tsv`、`core/__tests__/artifact-dir.test.mjs`、`core/__tests__/canonical-review-result.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/check-anti-host.test.mjs`、`core/__tests__/check-contract.test.mjs`、`core/__tests__/check-extensibility.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/kernel.test.mjs`、`core/__tests__/load-config.test.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/parse-framework-config.test.mjs`、`core/__tests__/protected-paths.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/resolve-path.test.mjs`、`core/__tests__/run-checks.test.mjs`、`core/__tests__/runtime-mode.test.mjs`、`core/__tests__/skill-static-deps.test.mjs`、`core/__tests__/stage-acceptance-policy.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/storage-root.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/task-identity.test.mjs`、`core/__tests__/task-index.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-kernel-security.test.mjs`、`core/__tests__/task-recovery.test.mjs`、`core/__tests__/task-runner-root-migration.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`core/__tests__/validate-contract.test.mjs`、`core/__tests__/workspace-manager.test.mjs`、`core/__tests__/workspace-runner.test.mjs`、`scripts/__tests__/canonical-archive-skill-dispatch.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`scripts/__tests__/run-wh-review-audit-e2e.test.mjs`、`scripts/__tests__/run-wh-review-provider-smoke.test.mjs`、`scripts/__tests__/runner-replacement-bridge.test.mjs`、`scripts/__tests__/runner-unbinding-migration.test.mjs`、`scripts/__tests__/smoke-local-skill-dispatch.test.mjs`、`scripts/__tests__/stage-runtime-acceptance-publication.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`scripts/__tests__/task-bootstrap.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`skills/debate/__tests__/skill-contract.test.mjs`、`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs`、`skills/isolated-browser-qa/__tests__/skill-contract.test.mjs`、`skills/review-response/__tests__/skill-contract.test.mjs`、`skills/test-routing-advisor/__tests__/skill-contract.test.mjs`、`skills/wh-review/__tests__/human-brief-behavioral.test.mjs`、`skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs`、`skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`、`skills/wh-review/scripts/__tests__/review-controller.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`tests/baseline.test.mjs`、`tests/boundary-confirm.test.mjs`、`tests/build-code-capture.test.mjs`、`tests/build-code-diff-only.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/build-code-target.test.mjs`、`tests/canonical-source.test.mjs`、`tests/contract-freeze.test.mjs`、`tests/design-stage-skill-order.red.test.mjs`、`tests/execution-record.test.mjs`、`tests/facts-subschema.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/fixtures/derived-review-provider.mjs`、`tests/fixtures/interaction-quality/r9-spec-clarify.json`、`tests/fixtures/step-audit/duplicate.json`、`tests/fixtures/step-audit/missing.json`、`tests/fixtures/step-audit/normal.json`、`tests/fixtures/step-audit/out-of-order.json`、`tests/fixtures/step-audit/stale.json`、`tests/fixtures/step-audit/tampered-hash.json`、`tests/fixtures/step-audit/unexpected.json`、`tests/fixtures/step-audit/unknown.json`、`tests/fixtures/template-content-quality/retention-map.json`、`tests/helpers/formal-review.mjs`、`tests/helpers/human-confirmation.mjs`、`tests/host-independence.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/knowledge-card.test.mjs`、`tests/m12-reuse-registry.test.mjs`、`tests/m12-subskill-exclusion.test.mjs`、`tests/m12-templates.test.mjs`、`tests/m14a-audit-contract-layer.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`tests/metrics-smoke.test.mjs`、`tests/metrics-taskhandle-v2.test.mjs`、`tests/moat-skills-phase1.test.mjs`、`tests/moat-skills-phase2.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/p0-foundation-contracts.test.mjs`、`tests/per-invocation-doc-contract.test.mjs`、`tests/per-invocation-execution-identity.test.mjs`、`tests/phase-adjudication-correction-scope.test.mjs`、`tests/phase-gate.test.mjs`、`tests/requirement-lineage.test.mjs`、`tests/reuse-registry.test.mjs`、`tests/skill-provenance-strict.test.mjs`、`tests/smoke.test.mjs`、`tests/spec-content-profile.test.mjs`、`tests/spec-specify-template.test.mjs`、`tests/spike-intake-design.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/stage-content-continuation.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/stage-content-host-independence.test.mjs`、`tests/stage-content-publication.test.mjs`、`tests/stage-decision-contract.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`tests/stage-quality.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/step-manifest.test.mjs`、`tests/task-accepted-schema.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/task-record-paths-check.test.mjs`、`tests/template-content-quality-retention.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`tests/verify-code-capture.test.mjs`、`tests/verify-code-design-alignment.test.mjs`、`tests/verify-code-facts.test.mjs`、`tests/verify-code-freshness.test.mjs`、`tests/vitest-resource-policy.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`workflows/verify-code/phase-1-contract.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：全部测试按外部质量谓词组织且处置可追溯
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：N/A — non-behavior change: 测试组织机械调整
- **paired_task**：N/A — non-behavior change
- **gate_cmd**：`node tools/architecture/test-disposition.mjs --check --require-all-inventory-tests && node tools/architecture/inventory.mjs --check --require-zero=phase5-migration-tests && ./node_modules/.bin/vitest run tests/contract/test-disposition.test.mjs && npm test && npm run check`
- **expected_exit**：0
- **oracle**：ORACLE-TEST-STRUCTURE：inventory 的每个 test row 恰好 keep/merge/move/delete；delete 绑定已删机制或替代 oracle；Phase 5 的 13 个迁移测试最终为 0；原有质量断言不减；focused/full/check 分工明确
- **evidence_path**：`evidence/phase-7/test-structure.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：只删测试未删机制、漏分类或通过合并巨型文件伪造瘦身。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T050 — 先证明五个破坏样本至少一个未被抓住

- **ID**：T050
- **Phase**：Phase 7：按外部质量谓词精简测试
- **goal**：先证明五个破坏样本至少一个未被抓住
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T049
- **依赖**：T049
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-TEST-001、FR-PUB-001、FR-REV-001
- **AC**：AC-05、AC-09、AC-10、AC-12
- **动作**：新增五 mutation RED
- **精确文件**：`tests/integration/mutation-guards.test.mjs`、`tests/fixtures/mutations/identity-tree-hash.json`、`tests/fixtures/mutations/missing-completion.json`、`tests/fixtures/mutations/review-major.json`、`tests/fixtures/mutations/confirmation-authorization.json`、`tests/fixtures/mutations/bundle-pollution.json`
- **boundary**：files: `tests/integration/mutation-guards.test.mjs`、`tests/fixtures/mutations/identity-tree-hash.json`、`tests/fixtures/mutations/missing-completion.json`、`tests/fixtures/mutations/review-major.json`、`tests/fixtures/mutations/confirmation-authorization.json`、`tests/fixtures/mutations/bundle-pollution.json`; symbols/regions: 本 Task goal 对应区域
- **输出**：真实 RED
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：RED
- **paired_task**：T051
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/mutation-guards.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-FIVE-MUTATIONS：五类破坏均被 verify 稳定拒绝
- **evidence_path**：`evidence/phase-7/mutations-red.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：mutation 绕过真实 verify seam。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T051 — 完成五个破坏样本的反脆弱验证

- **ID**：T051
- **Phase**：Phase 7：按外部质量谓词精简测试
- **goal**：完成五个破坏样本的反脆弱验证
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T050
- **依赖**：T050
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-TEST-001、FR-PUB-001、FR-REV-001
- **AC**：AC-05、AC-09、AC-10、AC-12
- **动作**：修复 mutation 暴露的保护缺口
- **精确文件**：`tests/integration/mutation-guards.test.mjs`、`tests/fixtures/mutations/identity-tree-hash.json`、`tests/fixtures/mutations/missing-completion.json`、`tests/fixtures/mutations/review-major.json`、`tests/fixtures/mutations/confirmation-authorization.json`、`tests/fixtures/mutations/bundle-pollution.json`、`core/completion-predicates.mjs`、`core/skill-bundle-release.mjs`
- **boundary**：files: `tests/integration/mutation-guards.test.mjs`、`tests/fixtures/mutations/identity-tree-hash.json`、`tests/fixtures/mutations/missing-completion.json`、`tests/fixtures/mutations/review-major.json`、`tests/fixtures/mutations/confirmation-authorization.json`、`tests/fixtures/mutations/bundle-pollution.json`、`core/completion-predicates.mjs`、`core/skill-bundle-release.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：关键保护被删时测试变红
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：GREEN
- **paired_task**：T050
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/mutation-guards.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-FIVE-MUTATIONS：identity/completion/review/auth/bundle 五类全拒绝
- **evidence_path**：`evidence/phase-7/mutations-green.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：用历史事故重放替代小型 mutation。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

### Verify

- **Target**：全部测试有可追溯处置；3 E2E、5 mutation、focused/full/check 均可执行；复杂度只报告软预算。
- **gate_cmd**：`node tools/architecture/test-disposition.mjs --check --require-all-inventory-tests && ./node_modules/.bin/vitest run tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/complexity-report.mjs --check-hard-gates`
- **expected_exit**：0
- **evidence_path**：`evidence/phase-7/phase-result.json`
- **display_cmd**：N/A — gate 输出已可读
- **Oracle**：node tools/architecture/test-disposition.mjs --check --require-all-inventory-tests && ./node_modules/.bin/vitest run tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/complexity-report.mjs --check-hard-gates

### Knowledge

- 先删机制再删专属测试；每个最终 test row 恰好一个 disposition；不得合并巨型文件伪造下降。

### STOP

- 任何测试未分类、唯一负向 oracle 无替代、delete 无被删机制或替代 oracle、变异不红，或 full tests 超时且根因未知。

### Done

- 全部测试有可追溯处置；3 E2E、5 mutation、focused/full/check 均可执行；复杂度只报告软预算。

### Risks and rollback

- **Risk**：误删唯一负向 oracle或把迁移测试永久保留。
- **Prevention**：精确 boundary、同一 oracle、独立 review。
- **Rollback / recovery**：每组测试移动保持独立 diff/evidence/revert boundary；失败恢复该组。

## Phase 8：最后机械搬目录与治理同步

### Goal

行为、兼容和测试稳定后，按冻结 move-map 机械移动剩余模块并写入长期结构规则。

### Files

- **NEW**：`runtime/evidence/.gitkeep`、`tests/integration/core-artifact-dir.test.mjs`、`tests/integration/core-canonical-review-result.test.mjs`、`tests/integration/core-capability-doctor.test.mjs`、`tests/integration/core-check-anti-host.test.mjs`、`tests/integration/core-check-contract.test.mjs`、`tests/integration/core-check-extensibility.test.mjs`、`tests/integration/core-check-skill-closure.test.mjs`、`tests/integration/core-invocation-identity.test.mjs`、`tests/integration/core-kernel.test.mjs`、`tests/integration/core-local-skill-resolver.test.mjs`、`tests/integration/core-protected-paths.test.mjs`、`tests/integration/core-receipt-writer.test.mjs`、`tests/integration/core-resolve-path.test.mjs`、`tests/integration/core-run-checks.test.mjs`、`tests/integration/core-skill-static-deps.test.mjs`、`tests/integration/core-stage-acceptance-policy.test.mjs`、`tests/integration/core-stage-context.test.mjs`、`tests/integration/core-stage-skill-runtime.test.mjs`、`tests/integration/core-storage-root.test.mjs`、`tests/integration/core-task-handle.test.mjs`、`tests/integration/core-task-identity.test.mjs`、`tests/integration/core-task-kernel-security.test.mjs`、`tests/integration/core-task-runner-root-migration.test.mjs`、`tests/integration/core-task-target-repo-migration.test.mjs`、`tests/integration/core-validate-contract.test.mjs`、`tests/integration/core-workspace-runner.test.mjs`、`runtime/evidence/audit-summary-carrier.mjs`、`runtime/evidence/boundary-confirm.mjs`、`runtime/review/canonical-review-result.mjs`、`runtime/evidence/canonical-source.mjs`、`runtime/evidence/canonical-utils.mjs`、`runtime/evidence/capability-doctor.mjs`、`runtime/evidence/check-skill-closure.mjs`、`runtime/evidence/fact-collector.mjs`、`runtime/task/git-worktree-snapshot.mjs`、`runtime/evidence/invocation-identity.mjs`、`runtime/evidence/kernel.mjs`、`runtime/adapters/local-skill-resolver.mjs`、`runtime/evidence/protected-paths.mjs`、`runtime/evidence/receipt-writer.mjs`、`runtime/evidence/requirement-ledger.mjs`、`runtime/adapters/resolve-path.mjs`、`runtime/review/review-flow-authority.mjs`、`runtime/review/review-result-consumer.mjs`、`runtime/evidence/runner-identity.mjs`、`runtime/schemas/ambiguity-ledger.v1.json`、`runtime/schemas/ambiguity-ledger.v2.json`、`runtime/schemas/bootstrap-review.v1.json`、`runtime/schemas/browser-qa-evidence.v1.json`、`runtime/schemas/decision-correction-appendix.v1.json`、`runtime/schemas/decision-coverage-audit.v1.json`、`runtime/schemas/decision-entry.v1.json`、`runtime/schemas/decision-log-contract.v1.json`、`runtime/schemas/decision-omission-acceptance.v1.json`、`runtime/schemas/plan-task-contract.v1.json`、`runtime/schemas/plan-task-contract.v2.json`、`runtime/schemas/risk-acceptance.v1.json`、`runtime/schemas/runner-replacement-bootstrap-provider-config.v1.json`、`runtime/schemas/runner-replacement-bootstrap-sealed-bundle.v1.json`、`runtime/schemas/runner-replacement-bootstrap-test-receipt.v1.json`、`runtime/schemas/runner-replacement-path-coverage-map.v1.json`、`runtime/schemas/stage-completion-facts.v1.json`、`runtime/schemas/stage-content-evidence.v1.json`、`runtime/schemas/stage-skill-invocation.v1.json`、`runtime/schemas/task-material-revision.v1.json`、`runtime/evidence/skill-static-deps.mjs`、`runtime/stage/stage-acceptance-policy.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/step-manifest.mjs`、`runtime/evidence/storage-root.mjs`、`runtime/task/task-identity.mjs`、`runtime/task/task-kernel.mjs`、`runtime/evidence/text-utils.mjs`、`runtime/evidence/validate-contract.mjs`、`runtime/task/workspace-runner.mjs`、`runtime/evidence/write-boundary-preflight.mjs`、`runtime/schemas/audit-summary.schema.json`、`runtime/schemas/human-confirmation.v1.schema.json`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/review-bundle.schema.json`、`runtime/schemas/skill-bundle.schema.json`、`runtime/schemas/skill-catalog.schema.json`、`runtime/schemas/skills-inventory.schema.json`、`runtime/schemas/source-manifest.schema.json`、`runtime/schemas/stage-skill-deps.schema.json`、`runtime/schemas/steps.schema.json`、`runtime/schemas/task-accepted.v2.schema.json`、`runtime/schemas/task-attempt.v2.schema.json`、`tests/integration/scripts-canonical-archive-skill-dispatch.test.mjs`、`tests/integration/scripts-ci-chain-check.test.mjs`、`tests/integration/scripts-migrate-task-v2.test.mjs`、`tests/integration/scripts-run-wh-review-audit-e2e.test.mjs`、`tests/integration/scripts-run-wh-review-provider-smoke.test.mjs`、`tests/integration/scripts-runner-replacement-bridge.test.mjs`、`tests/integration/scripts-runner-unbinding-migration.test.mjs`、`tests/integration/scripts-smoke-local-skill-dispatch.test.mjs`、`tests/integration/scripts-stage-runtime-acceptance-publication.test.mjs`、`tests/integration/scripts-stage-runtime-five-stage-e2e.test.mjs`、`tests/integration/scripts-task-bootstrap.test.mjs`、`tools/cli/audit-aggregate.mjs`、`tools/cli/check-anti-host.mjs`、`tools/cli/check-contract.mjs`、`tools/cli/check-extensibility.mjs`、`tools/cli/check-metrics-schema.mjs`、`tools/cli/check-stage-quality.mjs`、`tools/cli/check-task-record-paths.mjs`、`tools/cli/ci-chain-check.mjs`、`tools/cli/collect-task-facts.mjs`、`tools/cli/migrate-task-v2.mjs`、`tools/cli/noop.mjs`、`tools/cli/phase-gate.mjs`、`tools/cli/requirements-ledger.mjs`、`tools/cli/run-checks.mjs`、`tools/cli/run-wh-review-audit-e2e.mjs`、`tools/cli/run-wh-review-provider-smoke.mjs`、`tools/cli/scan-core-files.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`tools/cli/source-manifest.mjs`、`tools/cli/task-bootstrap.mjs`、`tools/cli/task-migrate-runner-root.mjs`、`tools/cli/task-migrate-target-repo.mjs`、`tools/cli/validate-field-mapping.mjs`、`tools/cli/verify-structure.mjs`、`runtime/interface/runtime-facade.mjs`、`runtime/interface/runner-contract.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/distribution/runner-release.mjs`、`runtime/task/material-revision.mjs`、`runtime/evidence/quality-fact.mjs`、`runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/publication.mjs`、`runtime/schemas/runner-release.schema.json`、`runtime/schemas/quality-fact.v1.json`、`runtime/schemas/publication.v1.json`、`docs/architecture/move-map.json`、`runtime/schemas/repository-structure.v1.json`、`tests/contract/repository-governance.test.mjs`
- **MODIFY**：`core/.gitkeep`、`core/__tests__/artifact-dir.test.mjs`、`core/__tests__/canonical-review-result.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/check-anti-host.test.mjs`、`core/__tests__/check-contract.test.mjs`、`core/__tests__/check-extensibility.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/kernel.test.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/protected-paths.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/resolve-path.test.mjs`、`core/__tests__/run-checks.test.mjs`、`core/__tests__/skill-static-deps.test.mjs`、`core/__tests__/stage-acceptance-policy.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/storage-root.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/task-identity.test.mjs`、`core/__tests__/task-kernel-security.test.mjs`、`core/__tests__/task-runner-root-migration.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`core/__tests__/validate-contract.test.mjs`、`core/__tests__/workspace-runner.test.mjs`、`core/audit-summary-carrier.mjs`、`core/boundary-confirm.mjs`、`core/canonical-review-result.mjs`、`core/canonical-source.mjs`、`core/canonical-utils.mjs`、`core/capability-doctor.mjs`、`core/check-skill-closure.mjs`、`core/fact-collector.mjs`、`core/git-worktree-snapshot.mjs`、`core/invocation-identity.mjs`、`core/kernel.mjs`、`core/local-skill-resolver.mjs`、`core/protected-paths.mjs`、`core/receipt-writer.mjs`、`core/requirement-ledger.mjs`、`core/resolve-path.mjs`、`core/review-flow-authority.mjs`、`core/review-result-consumer.mjs`、`core/runner-identity.mjs`、`core/schemas/ambiguity-ledger.v1.json`、`core/schemas/ambiguity-ledger.v2.json`、`core/schemas/bootstrap-review.v1.json`、`core/schemas/browser-qa-evidence.v1.json`、`core/schemas/decision-correction-appendix.v1.json`、`core/schemas/decision-coverage-audit.v1.json`、`core/schemas/decision-entry.v1.json`、`core/schemas/decision-log-contract.v1.json`、`core/schemas/decision-omission-acceptance.v1.json`、`core/schemas/plan-task-contract.v1.json`、`core/schemas/plan-task-contract.v2.json`、`core/schemas/risk-acceptance.v1.json`、`core/schemas/runner-replacement-bootstrap-provider-config.v1.json`、`core/schemas/runner-replacement-bootstrap-sealed-bundle.v1.json`、`core/schemas/runner-replacement-bootstrap-test-receipt.v1.json`、`core/schemas/runner-replacement-path-coverage-map.v1.json`、`core/schemas/stage-completion-facts.v1.json`、`core/schemas/stage-content-evidence.v1.json`、`core/schemas/stage-skill-invocation.v1.json`、`core/schemas/task-material-revision.v1.json`、`core/skill-static-deps.mjs`、`core/stage-acceptance-policy.mjs`、`core/stage-content-contracts.mjs`、`core/stage-review-disposition.mjs`、`core/stage-skill-runtime.mjs`、`core/step-manifest.mjs`、`core/storage-root.mjs`、`core/task-identity.mjs`、`core/task-kernel.mjs`、`core/text-utils.mjs`、`core/validate-contract.mjs`、`core/workspace-runner.mjs`、`core/write-boundary-preflight.mjs`、`schemas/audit-summary.schema.json`、`schemas/human-confirmation.v1.schema.json`、`schemas/requirement-ledger.schema.json`、`schemas/requirements-coverage.schema.json`、`schemas/review-bundle.schema.json`、`schemas/skill-bundle.schema.json`、`schemas/skill-catalog.schema.json`、`schemas/skills-inventory.schema.json`、`schemas/source-manifest.schema.json`、`schemas/stage-skill-deps.schema.json`、`schemas/steps.schema.json`、`schemas/task-accepted.v2.schema.json`、`schemas/task-attempt.v2.schema.json`、`scripts/__tests__/canonical-archive-skill-dispatch.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`scripts/__tests__/run-wh-review-audit-e2e.test.mjs`、`scripts/__tests__/run-wh-review-provider-smoke.test.mjs`、`scripts/__tests__/runner-replacement-bridge.test.mjs`、`scripts/__tests__/runner-unbinding-migration.test.mjs`、`scripts/__tests__/smoke-local-skill-dispatch.test.mjs`、`scripts/__tests__/stage-runtime-acceptance-publication.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`scripts/__tests__/task-bootstrap.test.mjs`、`scripts/audit-aggregate.mjs`、`scripts/check-anti-host.mjs`、`scripts/check-contract.mjs`、`scripts/check-extensibility.mjs`、`scripts/check-metrics-schema.mjs`、`scripts/check-stage-quality.mjs`、`scripts/check-task-record-paths.mjs`、`scripts/ci-chain-check.mjs`、`scripts/collect-task-facts.mjs`、`scripts/migrate-task-v2.mjs`、`scripts/noop.mjs`、`scripts/phase-gate.mjs`、`scripts/requirements-ledger.mjs`、`scripts/run-checks.mjs`、`scripts/run-wh-review-audit-e2e.mjs`、`scripts/run-wh-review-provider-smoke.mjs`、`scripts/scan-core-files.mjs`、`scripts/smoke-local-skill-dispatch.mjs`、`scripts/source-manifest.mjs`、`scripts/task-bootstrap.mjs`、`scripts/task-migrate-runner-root.mjs`、`scripts/task-migrate-target-repo.mjs`、`scripts/validate-field-mapping.mjs`、`scripts/verify-structure.mjs`、`core/runtime-facade.mjs`、`core/runner-contract.mjs`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`core/material-revision.mjs`、`core/quality-fact.mjs`、`core/freshness.mjs`、`core/completion-predicates.mjs`、`core/publication.mjs`、`schemas/runner-release.schema.json`、`schemas/quality-fact.v1.json`、`schemas/publication.v1.json`、`AGENTS.md`、`CLAUDE.md`、`CONSTITUTION.md`、`CONTEXT.md`、`README.md`、`constitution-checklist.md`、`package.json`、`vitest.config.mjs`、`skills/catalog.yaml`、`docs/architecture/repository-inventory.tsv`
- **DO NOT TOUCH**：`specs/workflowhub-complexity-governance-v2/decision-log.md`、`specs/workflowhub-complexity-governance-v2/spec.md`

### Tasks

#### T052 — 生成冻结 move-map 并机械移动剩余 core/scripts/schemas

- **ID**：T052
- **Phase**：Phase 8：最后机械搬目录与治理同步
- **goal**：生成冻结 move-map 并机械移动剩余 core/scripts/schemas
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T051
- **依赖**：T051
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-GOV-001、FR-INV-001
- **AC**：AC-13、AC-15
- **动作**：按精确 source/destination move-map 搬移并更新 import
- **精确文件**：`core/.gitkeep`、`core/__tests__/artifact-dir.test.mjs`、`core/__tests__/canonical-review-result.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/check-anti-host.test.mjs`、`core/__tests__/check-contract.test.mjs`、`core/__tests__/check-extensibility.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/kernel.test.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/protected-paths.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/resolve-path.test.mjs`、`core/__tests__/run-checks.test.mjs`、`core/__tests__/skill-static-deps.test.mjs`、`core/__tests__/stage-acceptance-policy.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/storage-root.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/task-identity.test.mjs`、`core/__tests__/task-kernel-security.test.mjs`、`core/__tests__/task-runner-root-migration.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`core/__tests__/validate-contract.test.mjs`、`core/__tests__/workspace-runner.test.mjs`、`core/audit-summary-carrier.mjs`、`core/boundary-confirm.mjs`、`core/canonical-review-result.mjs`、`core/canonical-source.mjs`、`core/canonical-utils.mjs`、`core/capability-doctor.mjs`、`core/check-skill-closure.mjs`、`core/fact-collector.mjs`、`core/git-worktree-snapshot.mjs`、`core/invocation-identity.mjs`、`core/kernel.mjs`、`core/local-skill-resolver.mjs`、`core/protected-paths.mjs`、`core/receipt-writer.mjs`、`core/requirement-ledger.mjs`、`core/resolve-path.mjs`、`core/review-flow-authority.mjs`、`core/review-result-consumer.mjs`、`core/runner-identity.mjs`、`core/schemas/ambiguity-ledger.v1.json`、`core/schemas/ambiguity-ledger.v2.json`、`core/schemas/bootstrap-review.v1.json`、`core/schemas/browser-qa-evidence.v1.json`、`core/schemas/decision-correction-appendix.v1.json`、`core/schemas/decision-coverage-audit.v1.json`、`core/schemas/decision-entry.v1.json`、`core/schemas/decision-log-contract.v1.json`、`core/schemas/decision-omission-acceptance.v1.json`、`core/schemas/plan-task-contract.v1.json`、`core/schemas/plan-task-contract.v2.json`、`core/schemas/risk-acceptance.v1.json`、`core/schemas/runner-replacement-bootstrap-provider-config.v1.json`、`core/schemas/runner-replacement-bootstrap-sealed-bundle.v1.json`、`core/schemas/runner-replacement-bootstrap-test-receipt.v1.json`、`core/schemas/runner-replacement-path-coverage-map.v1.json`、`core/schemas/stage-completion-facts.v1.json`、`core/schemas/stage-content-evidence.v1.json`、`core/schemas/stage-skill-invocation.v1.json`、`core/schemas/task-material-revision.v1.json`、`core/skill-static-deps.mjs`、`core/stage-acceptance-policy.mjs`、`core/stage-content-contracts.mjs`、`core/stage-review-disposition.mjs`、`core/stage-skill-runtime.mjs`、`core/step-manifest.mjs`、`core/storage-root.mjs`、`core/task-identity.mjs`、`core/task-kernel.mjs`、`core/text-utils.mjs`、`core/validate-contract.mjs`、`core/workspace-runner.mjs`、`core/write-boundary-preflight.mjs`、`schemas/audit-summary.schema.json`、`schemas/human-confirmation.v1.schema.json`、`schemas/requirement-ledger.schema.json`、`schemas/requirements-coverage.schema.json`、`schemas/review-bundle.schema.json`、`schemas/skill-bundle.schema.json`、`schemas/skill-catalog.schema.json`、`schemas/skills-inventory.schema.json`、`schemas/source-manifest.schema.json`、`schemas/stage-skill-deps.schema.json`、`schemas/steps.schema.json`、`schemas/task-accepted.v2.schema.json`、`schemas/task-attempt.v2.schema.json`、`scripts/__tests__/canonical-archive-skill-dispatch.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`scripts/__tests__/run-wh-review-audit-e2e.test.mjs`、`scripts/__tests__/run-wh-review-provider-smoke.test.mjs`、`scripts/__tests__/runner-replacement-bridge.test.mjs`、`scripts/__tests__/runner-unbinding-migration.test.mjs`、`scripts/__tests__/smoke-local-skill-dispatch.test.mjs`、`scripts/__tests__/stage-runtime-acceptance-publication.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`scripts/__tests__/task-bootstrap.test.mjs`、`scripts/audit-aggregate.mjs`、`scripts/check-anti-host.mjs`、`scripts/check-contract.mjs`、`scripts/check-extensibility.mjs`、`scripts/check-metrics-schema.mjs`、`scripts/check-stage-quality.mjs`、`scripts/check-task-record-paths.mjs`、`scripts/ci-chain-check.mjs`、`scripts/collect-task-facts.mjs`、`scripts/migrate-task-v2.mjs`、`scripts/noop.mjs`、`scripts/phase-gate.mjs`、`scripts/requirements-ledger.mjs`、`scripts/run-checks.mjs`、`scripts/run-wh-review-audit-e2e.mjs`、`scripts/run-wh-review-provider-smoke.mjs`、`scripts/scan-core-files.mjs`、`scripts/smoke-local-skill-dispatch.mjs`、`scripts/source-manifest.mjs`、`scripts/task-bootstrap.mjs`、`scripts/task-migrate-runner-root.mjs`、`scripts/task-migrate-target-repo.mjs`、`scripts/validate-field-mapping.mjs`、`scripts/verify-structure.mjs`、`core/runtime-facade.mjs`、`core/runner-contract.mjs`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`core/material-revision.mjs`、`core/quality-fact.mjs`、`core/freshness.mjs`、`core/completion-predicates.mjs`、`core/publication.mjs`、`schemas/runner-release.schema.json`、`schemas/quality-fact.v1.json`、`schemas/publication.v1.json`、`runtime/evidence/.gitkeep`、`tests/integration/core-artifact-dir.test.mjs`、`tests/integration/core-canonical-review-result.test.mjs`、`tests/integration/core-capability-doctor.test.mjs`、`tests/integration/core-check-anti-host.test.mjs`、`tests/integration/core-check-contract.test.mjs`、`tests/integration/core-check-extensibility.test.mjs`、`tests/integration/core-check-skill-closure.test.mjs`、`tests/integration/core-invocation-identity.test.mjs`、`tests/integration/core-kernel.test.mjs`、`tests/integration/core-local-skill-resolver.test.mjs`、`tests/integration/core-protected-paths.test.mjs`、`tests/integration/core-receipt-writer.test.mjs`、`tests/integration/core-resolve-path.test.mjs`、`tests/integration/core-run-checks.test.mjs`、`tests/integration/core-skill-static-deps.test.mjs`、`tests/integration/core-stage-acceptance-policy.test.mjs`、`tests/integration/core-stage-context.test.mjs`、`tests/integration/core-stage-skill-runtime.test.mjs`、`tests/integration/core-storage-root.test.mjs`、`tests/integration/core-task-handle.test.mjs`、`tests/integration/core-task-identity.test.mjs`、`tests/integration/core-task-kernel-security.test.mjs`、`tests/integration/core-task-runner-root-migration.test.mjs`、`tests/integration/core-task-target-repo-migration.test.mjs`、`tests/integration/core-validate-contract.test.mjs`、`tests/integration/core-workspace-runner.test.mjs`、`runtime/evidence/audit-summary-carrier.mjs`、`runtime/evidence/boundary-confirm.mjs`、`runtime/review/canonical-review-result.mjs`、`runtime/evidence/canonical-source.mjs`、`runtime/evidence/canonical-utils.mjs`、`runtime/evidence/capability-doctor.mjs`、`runtime/evidence/check-skill-closure.mjs`、`runtime/evidence/fact-collector.mjs`、`runtime/task/git-worktree-snapshot.mjs`、`runtime/evidence/invocation-identity.mjs`、`runtime/evidence/kernel.mjs`、`runtime/adapters/local-skill-resolver.mjs`、`runtime/evidence/protected-paths.mjs`、`runtime/evidence/receipt-writer.mjs`、`runtime/evidence/requirement-ledger.mjs`、`runtime/adapters/resolve-path.mjs`、`runtime/review/review-flow-authority.mjs`、`runtime/review/review-result-consumer.mjs`、`runtime/evidence/runner-identity.mjs`、`runtime/schemas/ambiguity-ledger.v1.json`、`runtime/schemas/ambiguity-ledger.v2.json`、`runtime/schemas/bootstrap-review.v1.json`、`runtime/schemas/browser-qa-evidence.v1.json`、`runtime/schemas/decision-correction-appendix.v1.json`、`runtime/schemas/decision-coverage-audit.v1.json`、`runtime/schemas/decision-entry.v1.json`、`runtime/schemas/decision-log-contract.v1.json`、`runtime/schemas/decision-omission-acceptance.v1.json`、`runtime/schemas/plan-task-contract.v1.json`、`runtime/schemas/plan-task-contract.v2.json`、`runtime/schemas/risk-acceptance.v1.json`、`runtime/schemas/runner-replacement-bootstrap-provider-config.v1.json`、`runtime/schemas/runner-replacement-bootstrap-sealed-bundle.v1.json`、`runtime/schemas/runner-replacement-bootstrap-test-receipt.v1.json`、`runtime/schemas/runner-replacement-path-coverage-map.v1.json`、`runtime/schemas/stage-completion-facts.v1.json`、`runtime/schemas/stage-content-evidence.v1.json`、`runtime/schemas/stage-skill-invocation.v1.json`、`runtime/schemas/task-material-revision.v1.json`、`runtime/evidence/skill-static-deps.mjs`、`runtime/stage/stage-acceptance-policy.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/step-manifest.mjs`、`runtime/evidence/storage-root.mjs`、`runtime/task/task-identity.mjs`、`runtime/task/task-kernel.mjs`、`runtime/evidence/text-utils.mjs`、`runtime/evidence/validate-contract.mjs`、`runtime/task/workspace-runner.mjs`、`runtime/evidence/write-boundary-preflight.mjs`、`runtime/schemas/audit-summary.schema.json`、`runtime/schemas/human-confirmation.v1.schema.json`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/review-bundle.schema.json`、`runtime/schemas/skill-bundle.schema.json`、`runtime/schemas/skill-catalog.schema.json`、`runtime/schemas/skills-inventory.schema.json`、`runtime/schemas/source-manifest.schema.json`、`runtime/schemas/stage-skill-deps.schema.json`、`runtime/schemas/steps.schema.json`、`runtime/schemas/task-accepted.v2.schema.json`、`runtime/schemas/task-attempt.v2.schema.json`、`tests/integration/scripts-canonical-archive-skill-dispatch.test.mjs`、`tests/integration/scripts-ci-chain-check.test.mjs`、`tests/integration/scripts-migrate-task-v2.test.mjs`、`tests/integration/scripts-run-wh-review-audit-e2e.test.mjs`、`tests/integration/scripts-run-wh-review-provider-smoke.test.mjs`、`tests/integration/scripts-runner-replacement-bridge.test.mjs`、`tests/integration/scripts-runner-unbinding-migration.test.mjs`、`tests/integration/scripts-smoke-local-skill-dispatch.test.mjs`、`tests/integration/scripts-stage-runtime-acceptance-publication.test.mjs`、`tests/integration/scripts-stage-runtime-five-stage-e2e.test.mjs`、`tests/integration/scripts-task-bootstrap.test.mjs`、`tools/cli/audit-aggregate.mjs`、`tools/cli/check-anti-host.mjs`、`tools/cli/check-contract.mjs`、`tools/cli/check-extensibility.mjs`、`tools/cli/check-metrics-schema.mjs`、`tools/cli/check-stage-quality.mjs`、`tools/cli/check-task-record-paths.mjs`、`tools/cli/ci-chain-check.mjs`、`tools/cli/collect-task-facts.mjs`、`tools/cli/migrate-task-v2.mjs`、`tools/cli/noop.mjs`、`tools/cli/phase-gate.mjs`、`tools/cli/requirements-ledger.mjs`、`tools/cli/run-checks.mjs`、`tools/cli/run-wh-review-audit-e2e.mjs`、`tools/cli/run-wh-review-provider-smoke.mjs`、`tools/cli/scan-core-files.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`tools/cli/source-manifest.mjs`、`tools/cli/task-bootstrap.mjs`、`tools/cli/task-migrate-runner-root.mjs`、`tools/cli/task-migrate-target-repo.mjs`、`tools/cli/validate-field-mapping.mjs`、`tools/cli/verify-structure.mjs`、`runtime/interface/runtime-facade.mjs`、`runtime/interface/runner-contract.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/distribution/runner-release.mjs`、`runtime/task/material-revision.mjs`、`runtime/evidence/quality-fact.mjs`、`runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/publication.mjs`、`runtime/schemas/runner-release.schema.json`、`runtime/schemas/quality-fact.v1.json`、`runtime/schemas/publication.v1.json`、`docs/architecture/move-map.json`、`docs/architecture/repository-inventory.tsv`、`package.json`、`vitest.config.mjs`、`skills/catalog.yaml`
- **boundary**：files: `core/.gitkeep`、`core/__tests__/artifact-dir.test.mjs`、`core/__tests__/canonical-review-result.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/check-anti-host.test.mjs`、`core/__tests__/check-contract.test.mjs`、`core/__tests__/check-extensibility.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/kernel.test.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/protected-paths.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/resolve-path.test.mjs`、`core/__tests__/run-checks.test.mjs`、`core/__tests__/skill-static-deps.test.mjs`、`core/__tests__/stage-acceptance-policy.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/storage-root.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/task-identity.test.mjs`、`core/__tests__/task-kernel-security.test.mjs`、`core/__tests__/task-runner-root-migration.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`core/__tests__/validate-contract.test.mjs`、`core/__tests__/workspace-runner.test.mjs`、`core/audit-summary-carrier.mjs`、`core/boundary-confirm.mjs`、`core/canonical-review-result.mjs`、`core/canonical-source.mjs`、`core/canonical-utils.mjs`、`core/capability-doctor.mjs`、`core/check-skill-closure.mjs`、`core/fact-collector.mjs`、`core/git-worktree-snapshot.mjs`、`core/invocation-identity.mjs`、`core/kernel.mjs`、`core/local-skill-resolver.mjs`、`core/protected-paths.mjs`、`core/receipt-writer.mjs`、`core/requirement-ledger.mjs`、`core/resolve-path.mjs`、`core/review-flow-authority.mjs`、`core/review-result-consumer.mjs`、`core/runner-identity.mjs`、`core/schemas/ambiguity-ledger.v1.json`、`core/schemas/ambiguity-ledger.v2.json`、`core/schemas/bootstrap-review.v1.json`、`core/schemas/browser-qa-evidence.v1.json`、`core/schemas/decision-correction-appendix.v1.json`、`core/schemas/decision-coverage-audit.v1.json`、`core/schemas/decision-entry.v1.json`、`core/schemas/decision-log-contract.v1.json`、`core/schemas/decision-omission-acceptance.v1.json`、`core/schemas/plan-task-contract.v1.json`、`core/schemas/plan-task-contract.v2.json`、`core/schemas/risk-acceptance.v1.json`、`core/schemas/runner-replacement-bootstrap-provider-config.v1.json`、`core/schemas/runner-replacement-bootstrap-sealed-bundle.v1.json`、`core/schemas/runner-replacement-bootstrap-test-receipt.v1.json`、`core/schemas/runner-replacement-path-coverage-map.v1.json`、`core/schemas/stage-completion-facts.v1.json`、`core/schemas/stage-content-evidence.v1.json`、`core/schemas/stage-skill-invocation.v1.json`、`core/schemas/task-material-revision.v1.json`、`core/skill-static-deps.mjs`、`core/stage-acceptance-policy.mjs`、`core/stage-content-contracts.mjs`、`core/stage-review-disposition.mjs`、`core/stage-skill-runtime.mjs`、`core/step-manifest.mjs`、`core/storage-root.mjs`、`core/task-identity.mjs`、`core/task-kernel.mjs`、`core/text-utils.mjs`、`core/validate-contract.mjs`、`core/workspace-runner.mjs`、`core/write-boundary-preflight.mjs`、`schemas/audit-summary.schema.json`、`schemas/human-confirmation.v1.schema.json`、`schemas/requirement-ledger.schema.json`、`schemas/requirements-coverage.schema.json`、`schemas/review-bundle.schema.json`、`schemas/skill-bundle.schema.json`、`schemas/skill-catalog.schema.json`、`schemas/skills-inventory.schema.json`、`schemas/source-manifest.schema.json`、`schemas/stage-skill-deps.schema.json`、`schemas/steps.schema.json`、`schemas/task-accepted.v2.schema.json`、`schemas/task-attempt.v2.schema.json`、`scripts/__tests__/canonical-archive-skill-dispatch.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`scripts/__tests__/run-wh-review-audit-e2e.test.mjs`、`scripts/__tests__/run-wh-review-provider-smoke.test.mjs`、`scripts/__tests__/runner-replacement-bridge.test.mjs`、`scripts/__tests__/runner-unbinding-migration.test.mjs`、`scripts/__tests__/smoke-local-skill-dispatch.test.mjs`、`scripts/__tests__/stage-runtime-acceptance-publication.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`scripts/__tests__/task-bootstrap.test.mjs`、`scripts/audit-aggregate.mjs`、`scripts/check-anti-host.mjs`、`scripts/check-contract.mjs`、`scripts/check-extensibility.mjs`、`scripts/check-metrics-schema.mjs`、`scripts/check-stage-quality.mjs`、`scripts/check-task-record-paths.mjs`、`scripts/ci-chain-check.mjs`、`scripts/collect-task-facts.mjs`、`scripts/migrate-task-v2.mjs`、`scripts/noop.mjs`、`scripts/phase-gate.mjs`、`scripts/requirements-ledger.mjs`、`scripts/run-checks.mjs`、`scripts/run-wh-review-audit-e2e.mjs`、`scripts/run-wh-review-provider-smoke.mjs`、`scripts/scan-core-files.mjs`、`scripts/smoke-local-skill-dispatch.mjs`、`scripts/source-manifest.mjs`、`scripts/task-bootstrap.mjs`、`scripts/task-migrate-runner-root.mjs`、`scripts/task-migrate-target-repo.mjs`、`scripts/validate-field-mapping.mjs`、`scripts/verify-structure.mjs`、`core/runtime-facade.mjs`、`core/runner-contract.mjs`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`core/material-revision.mjs`、`core/quality-fact.mjs`、`core/freshness.mjs`、`core/completion-predicates.mjs`、`core/publication.mjs`、`schemas/runner-release.schema.json`、`schemas/quality-fact.v1.json`、`schemas/publication.v1.json`、`runtime/evidence/.gitkeep`、`tests/integration/core-artifact-dir.test.mjs`、`tests/integration/core-canonical-review-result.test.mjs`、`tests/integration/core-capability-doctor.test.mjs`、`tests/integration/core-check-anti-host.test.mjs`、`tests/integration/core-check-contract.test.mjs`、`tests/integration/core-check-extensibility.test.mjs`、`tests/integration/core-check-skill-closure.test.mjs`、`tests/integration/core-invocation-identity.test.mjs`、`tests/integration/core-kernel.test.mjs`、`tests/integration/core-local-skill-resolver.test.mjs`、`tests/integration/core-protected-paths.test.mjs`、`tests/integration/core-receipt-writer.test.mjs`、`tests/integration/core-resolve-path.test.mjs`、`tests/integration/core-run-checks.test.mjs`、`tests/integration/core-skill-static-deps.test.mjs`、`tests/integration/core-stage-acceptance-policy.test.mjs`、`tests/integration/core-stage-context.test.mjs`、`tests/integration/core-stage-skill-runtime.test.mjs`、`tests/integration/core-storage-root.test.mjs`、`tests/integration/core-task-handle.test.mjs`、`tests/integration/core-task-identity.test.mjs`、`tests/integration/core-task-kernel-security.test.mjs`、`tests/integration/core-task-runner-root-migration.test.mjs`、`tests/integration/core-task-target-repo-migration.test.mjs`、`tests/integration/core-validate-contract.test.mjs`、`tests/integration/core-workspace-runner.test.mjs`、`runtime/evidence/audit-summary-carrier.mjs`、`runtime/evidence/boundary-confirm.mjs`、`runtime/review/canonical-review-result.mjs`、`runtime/evidence/canonical-source.mjs`、`runtime/evidence/canonical-utils.mjs`、`runtime/evidence/capability-doctor.mjs`、`runtime/evidence/check-skill-closure.mjs`、`runtime/evidence/fact-collector.mjs`、`runtime/task/git-worktree-snapshot.mjs`、`runtime/evidence/invocation-identity.mjs`、`runtime/evidence/kernel.mjs`、`runtime/adapters/local-skill-resolver.mjs`、`runtime/evidence/protected-paths.mjs`、`runtime/evidence/receipt-writer.mjs`、`runtime/evidence/requirement-ledger.mjs`、`runtime/adapters/resolve-path.mjs`、`runtime/review/review-flow-authority.mjs`、`runtime/review/review-result-consumer.mjs`、`runtime/evidence/runner-identity.mjs`、`runtime/schemas/ambiguity-ledger.v1.json`、`runtime/schemas/ambiguity-ledger.v2.json`、`runtime/schemas/bootstrap-review.v1.json`、`runtime/schemas/browser-qa-evidence.v1.json`、`runtime/schemas/decision-correction-appendix.v1.json`、`runtime/schemas/decision-coverage-audit.v1.json`、`runtime/schemas/decision-entry.v1.json`、`runtime/schemas/decision-log-contract.v1.json`、`runtime/schemas/decision-omission-acceptance.v1.json`、`runtime/schemas/plan-task-contract.v1.json`、`runtime/schemas/plan-task-contract.v2.json`、`runtime/schemas/risk-acceptance.v1.json`、`runtime/schemas/runner-replacement-bootstrap-provider-config.v1.json`、`runtime/schemas/runner-replacement-bootstrap-sealed-bundle.v1.json`、`runtime/schemas/runner-replacement-bootstrap-test-receipt.v1.json`、`runtime/schemas/runner-replacement-path-coverage-map.v1.json`、`runtime/schemas/stage-completion-facts.v1.json`、`runtime/schemas/stage-content-evidence.v1.json`、`runtime/schemas/stage-skill-invocation.v1.json`、`runtime/schemas/task-material-revision.v1.json`、`runtime/evidence/skill-static-deps.mjs`、`runtime/stage/stage-acceptance-policy.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/step-manifest.mjs`、`runtime/evidence/storage-root.mjs`、`runtime/task/task-identity.mjs`、`runtime/task/task-kernel.mjs`、`runtime/evidence/text-utils.mjs`、`runtime/evidence/validate-contract.mjs`、`runtime/task/workspace-runner.mjs`、`runtime/evidence/write-boundary-preflight.mjs`、`runtime/schemas/audit-summary.schema.json`、`runtime/schemas/human-confirmation.v1.schema.json`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/review-bundle.schema.json`、`runtime/schemas/skill-bundle.schema.json`、`runtime/schemas/skill-catalog.schema.json`、`runtime/schemas/skills-inventory.schema.json`、`runtime/schemas/source-manifest.schema.json`、`runtime/schemas/stage-skill-deps.schema.json`、`runtime/schemas/steps.schema.json`、`runtime/schemas/task-accepted.v2.schema.json`、`runtime/schemas/task-attempt.v2.schema.json`、`tests/integration/scripts-canonical-archive-skill-dispatch.test.mjs`、`tests/integration/scripts-ci-chain-check.test.mjs`、`tests/integration/scripts-migrate-task-v2.test.mjs`、`tests/integration/scripts-run-wh-review-audit-e2e.test.mjs`、`tests/integration/scripts-run-wh-review-provider-smoke.test.mjs`、`tests/integration/scripts-runner-replacement-bridge.test.mjs`、`tests/integration/scripts-runner-unbinding-migration.test.mjs`、`tests/integration/scripts-smoke-local-skill-dispatch.test.mjs`、`tests/integration/scripts-stage-runtime-acceptance-publication.test.mjs`、`tests/integration/scripts-stage-runtime-five-stage-e2e.test.mjs`、`tests/integration/scripts-task-bootstrap.test.mjs`、`tools/cli/audit-aggregate.mjs`、`tools/cli/check-anti-host.mjs`、`tools/cli/check-contract.mjs`、`tools/cli/check-extensibility.mjs`、`tools/cli/check-metrics-schema.mjs`、`tools/cli/check-stage-quality.mjs`、`tools/cli/check-task-record-paths.mjs`、`tools/cli/ci-chain-check.mjs`、`tools/cli/collect-task-facts.mjs`、`tools/cli/migrate-task-v2.mjs`、`tools/cli/noop.mjs`、`tools/cli/phase-gate.mjs`、`tools/cli/requirements-ledger.mjs`、`tools/cli/run-checks.mjs`、`tools/cli/run-wh-review-audit-e2e.mjs`、`tools/cli/run-wh-review-provider-smoke.mjs`、`tools/cli/scan-core-files.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`tools/cli/source-manifest.mjs`、`tools/cli/task-bootstrap.mjs`、`tools/cli/task-migrate-runner-root.mjs`、`tools/cli/task-migrate-target-repo.mjs`、`tools/cli/validate-field-mapping.mjs`、`tools/cli/verify-structure.mjs`、`runtime/interface/runtime-facade.mjs`、`runtime/interface/runner-contract.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/distribution/runner-release.mjs`、`runtime/task/material-revision.mjs`、`runtime/evidence/quality-fact.mjs`、`runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/publication.mjs`、`runtime/schemas/runner-release.schema.json`、`runtime/schemas/quality-fact.v1.json`、`runtime/schemas/publication.v1.json`、`docs/architecture/move-map.json`、`docs/architecture/repository-inventory.tsv`、`package.json`、`vitest.config.mjs`、`skills/catalog.yaml`; symbols/regions: 本 Task goal 对应区域
- **输出**：无行为变化的目标目录
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：N/A — non-behavior change: 纯路径迁移
- **paired_task**：N/A — non-behavior change
- **gate_cmd**：`npm test && npm run check`
- **expected_exit**：0
- **oracle**：ORACLE-MECHANICAL-MOVE：移动前后 public behavior、tests、hash contracts 等价
- **evidence_path**：`evidence/phase-8/mechanical-move.txt`
- **STOP**：move-map 未逐路径冻结、inventory 不同 tree 或测试结构未稳定时 STOP。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：移动文件过多导致隐藏语义变化。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T053 — 同步 AGENTS、CLAUDE、CONTEXT、ADR 与结构门

- **ID**：T053
- **Phase**：Phase 8：最后机械搬目录与治理同步
- **goal**：同步 AGENTS、CLAUDE、CONTEXT、ADR 与结构门
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T052
- **依赖**：T052
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-GOV-001、FR-RUN-001、FR-DIST-001
- **AC**：AC-10、AC-14、AC-15
- **动作**：写稳定结构规则并删除重复宿主说明
- **精确文件**：`AGENTS.md`、`CLAUDE.md`、`CONSTITUTION.md`、`CONTEXT.md`、`README.md`、`constitution-checklist.md`、`runtime/schemas/repository-structure.v1.json`、`tests/contract/repository-governance.test.mjs`、`docs/architecture/repository-inventory.tsv`
- **boundary**：files: `AGENTS.md`、`CLAUDE.md`、`CONSTITUTION.md`、`CONTEXT.md`、`README.md`、`constitution-checklist.md`、`runtime/schemas/repository-structure.v1.json`、`tests/contract/repository-governance.test.mjs`、`docs/architecture/repository-inventory.tsv`; symbols/regions: 本 Task goal 对应区域
- **输出**：协作规则不再漂移
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：N/A — non-behavior change: 长期治理文档与结构合同
- **paired_task**：N/A — non-behavior change
- **gate_cmd**：`node tools/cli/verify-structure.mjs && ./node_modules/.bin/vitest run tests/contract/repository-governance.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-GOVERNANCE：所有权/依赖/两单元/禁新增规则与实际结构一致
- **evidence_path**：`evidence/phase-8/governance.txt`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：AGENTS 写逐文件清单。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

### Verify

- **Target**：runtime/tests/tools/docs 结构稳定；AGENTS 记录职责和依赖；CLAUDE 仅引用。
- **gate_cmd**：`node tools/cli/verify-structure.mjs && ./node_modules/.bin/vitest run tests/contract/repository-governance.test.mjs && npm test`
- **expected_exit**：0
- **evidence_path**：`evidence/phase-8/phase-result.json`
- **display_cmd**：N/A — gate 输出已可读
- **Oracle**：node tools/cli/verify-structure.mjs && ./node_modules/.bin/vitest run tests/contract/repository-governance.test.mjs && npm test

### Knowledge

- move-map 在本 Phase 开始前绑定准确 source/destination；只做机械 import/path 更新。

### STOP

- move-map 与最终 inventory 不同、需要行为修改或存在未完成 legacy/delete slice。

### Done

- runtime/tests/tools/docs 结构稳定；AGENTS 记录职责和依赖；CLAUDE 仅引用。

### Risks and rollback

- **Risk**：机械移动掩盖行为变化。
- **Prevention**：精确 boundary、同一 oracle、独立 review。
- **Rollback / recovery**：按 move-map 分组 revert；禁止修补行为。

## Phase 9：最终验证、三方架构审查与用户确认

### Goal

在最终 tree 上执行 clean install、完整质量矩阵、正式三方 architecture review，并展示实际删除和 diff 供用户确认。

### Files

- **NEW**：`docs/architecture/final-complexity-report.json`、`docs/architecture/final-coverage-audit.md`、`tests/e2e/release-acceptance.test.mjs`、`tests/integration/final-review-facts.test.mjs`、`tests/contract/final-coverage.test.mjs`、`tools/architecture/clean-install.mjs`、`tools/architecture/verify-final-coverage.mjs`
- **MODIFY**：`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`docs/architecture/legacy-task-inventory.json`、`docs/architecture/legacy-import-proof.json`、`docs/architecture/test-disposition.tsv`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/distribution/runner-release.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/reference-audit.mjs`、`tools/architecture/complexity-report.mjs`、`tools/architecture/deletion-proof.mjs`、`tools/architecture/test-disposition.mjs`、`tools/architecture/verify-migration-proof.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`specs/workflowhub-complexity-governance-v2/decision-log.md`、`specs/workflowhub-complexity-governance-v2/spec.md`

### Tasks

#### T054 — 执行 clean install、完整测试、3 E2E、5 mutation 和直接 AC 覆盖审计

- **ID**：T054
- **Phase**：Phase 9：最终验证、三方架构审查与用户确认
- **goal**：执行 clean install、完整测试、3 E2E、5 mutation 和直接 AC 覆盖审计
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T053
- **依赖**：T053
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-FLOW-001、FR-RUN-001、FR-PUB-001、FR-DIST-001、FR-DIST-002、FR-TEST-001、FR-INV-001、FR-MET-001
- **AC**：AC-01、AC-03、AC-04、AC-05、AC-09、AC-10、AC-11、AC-12、AC-13、AC-14
- **动作**：先在 repository inventory 中逐项标记治理工具/文档为 `permanent` 或 `task-only`；永久保留 `inventory.mjs`、`reference-audit.mjs`、`complexity-report.mjs`、`clean-install.mjs`、`verify-final-coverage.mjs`，删除 task-only 的 `deletion-proof.mjs`、`test-disposition.mjs`、`verify-migration-proof.mjs` 及临时证明文档；再在 mktemp 空目录生成并验证两个发布单元，绑定 archive hash/tree，运行完整质量矩阵和可执行覆盖审计
- **精确文件**：`tests/e2e/release-acceptance.test.mjs`、`tests/contract/final-coverage.test.mjs`、`docs/architecture/final-complexity-report.json`、`docs/architecture/final-coverage-audit.md`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`docs/architecture/legacy-task-inventory.json`、`docs/architecture/legacy-import-proof.json`、`docs/architecture/test-disposition.tsv`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/distribution/runner-release.mjs`、`tools/architecture/clean-install.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/reference-audit.mjs`、`tools/architecture/complexity-report.mjs`、`tools/architecture/deletion-proof.mjs`、`tools/architecture/test-disposition.mjs`、`tools/architecture/verify-migration-proof.mjs`、`tools/architecture/verify-final-coverage.mjs`
- **boundary**：files: `tests/e2e/release-acceptance.test.mjs`、`tests/contract/final-coverage.test.mjs`、`docs/architecture/final-complexity-report.json`、`docs/architecture/final-coverage-audit.md`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`docs/architecture/legacy-task-inventory.json`、`docs/architecture/legacy-import-proof.json`、`docs/architecture/test-disposition.tsv`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/distribution/runner-release.mjs`、`tools/architecture/clean-install.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/reference-audit.mjs`、`tools/architecture/complexity-report.mjs`、`tools/architecture/deletion-proof.mjs`、`tools/architecture/test-disposition.mjs`、`tools/architecture/verify-migration-proof.mjs`、`tools/architecture/verify-final-coverage.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：当前 tree 的发布物可独立 clean install 并在 Multica-like 布局完成正式任务
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：N/A — non-behavior change: 最终验收
- **paired_task**：N/A — non-behavior change
- **gate_cmd**：`node tools/architecture/inventory.mjs --check --require-zero=task-only-governance && node tools/architecture/clean-install.mjs --verify-runner --verify-skill-bundle --verify-multica-layout --verify-current-tree && npm test && npm run check && ./node_modules/.bin/vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/integration/mutation-guards.test.mjs tests/e2e/release-acceptance.test.mjs tests/contract/final-coverage.test.mjs && node tools/architecture/verify-final-coverage.mjs --spec=specs/workflowhub-complexity-governance-v2/spec.md --require-ac=AC-01..AC-15 --bind-current-tree && node tools/architecture/complexity-report.mjs --check-hard-gates`
- **expected_exit**：0
- **oracle**：ORACLE-FINAL-GATES：task-only 治理工具/文档=0；空目录从当前 tree 生成并安装 Runner 和 Skill Bundle；Bundle 禁止内容=0、五 workflow+skill deps 可解析、与兼容 Runner 至少完成一个正式 Stage；缺/错版本不写正式记录；3 E2E、5 mutation、full/check、AC-01..15 直接证据和硬门全绿
- **evidence_path**：`evidence/phase-9/final-gates.json`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：复用源码仓 node_modules、旧测试 receipt 或手写 Markdown 冒充直接证据。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T055 — 通过正式 wh-review 执行三方独立 architecture review 并处置有效 finding

- **ID**：T055
- **Phase**：Phase 9：最终验证、三方架构审查与用户确认
- **goal**：通过正式 wh-review 执行三方独立 architecture review 并处置有效 finding
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T054
- **依赖**：T054
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-REV-001、FR-TEST-001
- **AC**：AC-05、AC-12、AC-15
- **动作**：由 build-code 的正式 wh-review seam 调用三 provider；本 Task 只验证 canonical review facts 和处置后同 tree 质量，不向产品仓增加 reviewer launcher
- **精确文件**：`docs/architecture/final-coverage-audit.md`、`docs/architecture/final-complexity-report.json`、`tests/integration/final-review-facts.test.mjs`
- **boundary**：files: `docs/architecture/final-coverage-audit.md`、`docs/architecture/final-complexity-report.json`、`tests/integration/final-review-facts.test.mjs`; symbols/regions: 本 Task goal 对应区域
- **输出**：独立审查事实、不可用诊断与 finding 处置均可验证
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：N/A — non-behavior change: 独立质量审查
- **paired_task**：N/A — non-behavior change
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/final-review-facts.test.mjs && node tools/architecture/clean-install.mjs --verify-runner --verify-skill-bundle --verify-multica-layout --verify-current-tree && npm test && npm run check`
- **expected_exit**：0
- **oracle**：ORACLE-FINAL-REVIEW：正式 wh-review 的 kimi/k3、claude-code/opus、cursor/grok 三份原始语义结果绑定同一最终 tree；provider 不可用或结果无效 fail-loud；原 verdict 保留；所有有效 finding 有验证处置；处置后重新运行最终质量门
- **evidence_path**：`evidence/phase-9/architecture-review.json`
- **STOP**：oracle 失败原因不是目标行为、需要弱化质量门、越出 Phase.Files 或出现新架构选择时 STOP
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：循环重跑制造 pass、用 health/exit status 冒充语义结果，或审查后未重跑最终 gate。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

#### T056 — 向用户展示最终删除清单、保留项、diff 和复杂度变化并确认

- **ID**：T056
- **Phase**：Phase 9：最终验证、三方架构审查与用户确认
- **goal**：向用户展示最终删除清单、保留项、diff 和复杂度变化并确认
- **design_state**：blocked-by-design
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"45c8636efbe544a06701ca1aaf90c6f11575a6bc9833e64cf95f72bc8ce55e04","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"},{"artifact_kind":"plan","ref":"specs/workflowhub-complexity-governance-v2/plan.md","hash":"b8fefc059b4bc966ddb030bc8051ce2158d8f96e5e618ee3bf0490cc8b7ceaac","id":"PLAN-WORKFLOWHUB-COMPLEXITY-V2"}]`
- **输入**：accepted spec、plan anchor、T055
- **依赖**：T055
- **并行**：否 — 依赖与文件所有权要求串行
- **FR**：FR-DEL-001、FR-GOV-001
- **AC**：AC-06、AC-07、AC-13、AC-15
- **动作**：展示最终事实并记录确认
- **精确文件**：`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`docs/architecture/final-complexity-report.json`、`docs/architecture/final-coverage-audit.md`
- **boundary**：files: `docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`docs/architecture/final-complexity-report.json`、`docs/architecture/final-coverage-audit.md`; symbols/regions: 本 Task goal 对应区域
- **输出**：可进入 verify-code；提交/推送/清理仍单独授权
- **Knowledge**：accepted spec、verified code anchors 与前序 evidence
- **verification_role**：N/A — non-behavior change: 最终人工确认
- **paired_task**：N/A — non-behavior change
- **gate_cmd**：`node tools/architecture/inventory.mjs --check --require-zero=task-only-governance && node tools/architecture/verify-final-coverage.mjs --spec=specs/workflowhub-complexity-governance-v2/spec.md --require-ac=AC-01..AC-15 --bind-current-tree`
- **expected_exit**：0
- **oracle**：ORACLE-FINAL-CONFIRM：永久 inventory 与 final coverage 证明最终事实；用户确认另行写入本 Task 的交互证据。用户看到并确认实际删除/KEEP/diff；不推断 Git 权限
- **evidence_path**：`evidence/phase-9/final-user-confirmation.json`
- **STOP**：用户未确认最终实际删除结果时 STOP，不得宣称交付。
- **recovery**：当前 Phase owner 恢复本 Task 独立 diff 并重跑同一 gate
- **task risk**：用早期删除计划替代最终实际 diff。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

### Verify

- **Target**：AC-01..15 直接证据齐全，Bundle/Runner 在 Multica-like 空目录完成正式 Stage，三方审查完成，用户确认实际删除结果。
- **gate_cmd**：`node tools/architecture/clean-install.mjs --verify-runner --verify-skill-bundle --verify-multica-layout --verify-current-tree && npm test && npm run check && ./node_modules/.bin/vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/integration/mutation-guards.test.mjs tests/e2e/release-acceptance.test.mjs tests/integration/final-review-facts.test.mjs tests/contract/final-coverage.test.mjs && node tools/architecture/verify-final-coverage.mjs --spec=specs/workflowhub-complexity-governance-v2/spec.md --require-ac=AC-01..AC-15 --bind-current-tree && node tools/architecture/complexity-report.mjs --check-hard-gates`
- **expected_exit**：0
- **evidence_path**：`evidence/phase-9/phase-result.json`
- **display_cmd**：N/A — gate 输出已可读
- **Oracle**：node tools/architecture/clean-install.mjs --verify-runner --verify-skill-bundle --verify-multica-layout --verify-current-tree && npm test && npm run check && ./node_modules/.bin/vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/integration/mutation-guards.test.mjs tests/e2e/release-acceptance.test.mjs tests/integration/final-review-facts.test.mjs tests/contract/final-coverage.test.mjs && node tools/architecture/verify-final-coverage.mjs --spec=specs/workflowhub-complexity-governance-v2/spec.md --require-ac=AC-01..AC-15 --bind-current-tree && node tools/architecture/complexity-report.mjs --check-hard-gates

### Knowledge

- 审查 providers 固定 kimi/k3、claude-code/opus、cursor/grok；通过正式 wh-review seam，不新增一次性 reviewer launcher；用户确认不等于 Git 授权。

### STOP

- 任一 AC 无直接证据、Skill Bundle 或 Runner clean install 失败、严重 finding 未处置、最终 inventory 非 0、用户未确认实际删除/diff。

### Done

- AC-01..15 直接证据齐全，Bundle/Runner 在 Multica-like 空目录完成正式 Stage，三方审查完成，用户确认实际删除结果。

### Risks and rollback

- **Risk**：最终快照漂移、审查材料错绑或一次性验收工具变成永久产品。
- **Prevention**：精确 boundary、同一 oracle、独立 review。
- **Rollback / recovery**：任何失败回到 owning Phase；不修改 WorkflowHub 以绕过 WorkflowHub。

## 3. Dependency Graph

```text
T001
T002 ← T001
T003 ← T002
T004 ← T001
T005 ← T003
T006 ← T005
T007 ← T006
T008 ← T007
T009 ← T008
T010 ← T009
T011 ← T010
T012 ← T011
T013 ← T012
T014 ← T013
T015 ← T014
T016 ← T015
T017 ← T016
T018 ← T017
T019 ← T018
T020 ← T019
T021 ← T020
T022 ← T021
T023 ← T022
T024 ← T023
T025 ← T024
T026 ← T025
T027 ← T026
T028 ← T027
T029 ← T028
T030 ← T029
T031 ← T030
T032 ← T031
T033 ← T032
T034 ← T033
T035 ← T034
T036 ← T035
T037 ← T036
T038 ← T037
T039 ← T038
T040 ← T039
T041 ← T040
T042 ← T041
T043 ← T042
T044 ← T043
T045 ← T044
T046 ← T045
T047 ← T046
T048 ← T047
T049 ← T048
T050 ← T049
T051 ← T050
T052 ← T051
T053 ← T052
T054 ← T053
T055 ← T054
T056 ← T055
```

- 图按 Task ID 与依赖生成；无环。
- 删除切片默认串行；只有 proof 证明文件和输入完全独立才允许改为并行。

## 4. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| FR-FLOW-001 | T017、T018、T019、T020、T054 | AC-01、AC-09 | Phase 4：切断历史推进许可证、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-RUN-001 | T005、T006、T018、T046、T053、T054 | AC-01、AC-07、AC-14 | Phase 1：窄 Runtime facade 与双发布单元、Phase 4：切断历史推进许可证、Phase 5：用户确认后的垂直删除、Phase 8：最后机械搬目录与治理同步、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-MAT-001 | T009、T010、T013、T014、T017、T018 | AC-02、AC-04 | Phase 2：单一材料修订与派生发布、Phase 3：新任务单写与迁移脚手架即时退出、Phase 4：切断历史推进许可证 | owning Task gate / evidence |
| FR-MAT-002 | T009、T010、T011、T012 | AC-02、AC-03 | Phase 2：单一材料修订与派生发布 | owning Task gate / evidence |
| FR-PUB-001 | T009、T010、T017、T018、T051、T054 | AC-01、AC-04、AC-05 | Phase 2：单一材料修订与派生发布、Phase 4：切断历史推进许可证、Phase 7：按外部质量谓词精简测试、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-PUB-002 | T011、T012、T014、T020 | AC-03、AC-04 | Phase 2：单一材料修订与派生发布、Phase 3：新任务单写与迁移脚手架即时退出、Phase 4：切断历史推进许可证 | owning Task gate / evidence |
| FR-REV-001 | T009、T010、T051、T055 | AC-05 | Phase 2：单一材料修订与派生发布、Phase 7：按外部质量谓词精简测试、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-DEL-001 | T002、T003、T021、T022、T023、T024、T025、T026、T027、T028、T029、T030、T031、T032、T033、T034、T035、T036、T037、T038、T039、T040、T041、T042、T043、T044、T045、T056 | AC-06、AC-07 | Phase 0：冻结基线与逐文件清单、Phase 5：用户确认后的垂直删除、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-DEL-002 | T003、T023、T025、T027、T029、T031、T033、T035、T037、T039、T041、T043、T045、T046、T056 | AC-06、AC-07 | Phase 0：冻结基线与逐文件清单、Phase 5：用户确认后的垂直删除、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-LEG-001 | T013、T014、T015、T016、T047、T048 | AC-08 | Phase 3：新任务单写与迁移脚手架即时退出、Phase 6：全局 legacy 归零复核 | owning Task gate / evidence |
| FR-DIST-001 | T004、T007、T008、T053、T054 | AC-10 | Phase 0：冻结基线与逐文件清单、Phase 1：窄 Runtime facade 与双发布单元、Phase 8：最后机械搬目录与治理同步、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-DIST-002 | T005、T006、T007、T008、T054 | AC-10、AC-11 | Phase 1：窄 Runtime facade 与双发布单元、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-TEST-001 | T019、T020、T022、T023、T024、T025、T026、T027、T028、T029、T030、T031、T032、T033、T034、T035、T036、T037、T038、T039、T040、T041、T042、T043、T044、T045、T049、T050、T051、T054、T055 | AC-12、AC-14 | Phase 4：切断历史推进许可证、Phase 5：用户确认后的垂直删除、Phase 7：按外部质量谓词精简测试、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-INV-001 | T001、T021、T046、T048、T052、T054、T056 | AC-13 | Phase 0：冻结基线与逐文件清单、Phase 5：用户确认后的垂直删除、Phase 6：全局 legacy 归零复核、Phase 8：最后机械搬目录与治理同步、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-GOV-001 | T049、T052、T053、T056 | AC-13、AC-15 | Phase 7：按外部质量谓词精简测试、Phase 8：最后机械搬目录与治理同步、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-MET-001 | T001、T046、T049、T054 | AC-14 | Phase 0：冻结基线与逐文件清单、Phase 5：用户确认后的垂直删除、Phase 7：按外部质量谓词精简测试、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |

## 5. 原始需求执行索引

| 原始需求 | Spec | Phase | Task | Gate / evidence |
| --- | --- | --- | --- | --- |
| 根因：历史许可阻塞业务 | FR-FLOW-001、FR-MAT-001 | Phase 2–4 | T009–T020 | 3 E2E + progression oracle |
| 五阶段和质量硬门保留 | FR-FLOW-001、FR-PUB-001、FR-REV-001 | Phase 2、4、9 | T009–T020、T054–T055 | completion/mutation/final review |
| 四材料单一修订 | FR-MAT-001、FR-MAT-002 | Phase 2–3 | T009–T014 | revision + atomic faults |
| 质量事实与派生发布 | FR-PUB-001、FR-PUB-002 | Phase 2 | T009–T012 | freshness + publication |
| 七个公开 Runtime 行为 | FR-RUN-001 | Phase 1、4 | T005–T006、T018 | facade contract |
| 12 类删除与逐项证明 | FR-DEL-001、FR-DEL-002 | Phase 0、5 | T002–T003、T021–T046 | proof + same before/after oracle |
| 删除前用户逐项确认 | FR-DEL-001 | Phase 5 | T021 | blocked-by-design user gate |
| 旧任务迁移证明后即时归零 | FR-LEG-001 | Phase 3、6 | T013–T016、T047–T048 | fixture proof + legacy-zero |
| node_modules 仅本地缓存 | FR-DIST-001 | Phase 0、1、9 | T004、T007–T008、T054 | untracked + clean install |
| Skill Bundle / Runner 分离 | FR-DIST-001、FR-DIST-002 | Phase 1、9 | T005–T008、T054 | closure + version mismatch |
| 3 条 E2E 与 5 个破坏样本 | FR-TEST-001 | Phase 4、7、9 | T019–T020、T050–T051、T054 | real CLI + mutation |
| 全量 tracked-file 逐文件分类 | FR-INV-001 | Phase 0、5、8、9 | T001、T021、T046、T052、T054 | inventory exact-one |
| 目录最后机械迁移 | FR-GOV-001 | Phase 8 | T052–T053 | move-map + behavior equivalence |
| AGENTS / CLAUDE 依赖治理 | FR-GOV-001 | Phase 8 | T053 | repository governance |
| 复杂度目标与硬归零门 | FR-MET-001 | Phase 0、5、7、9 | T001、T046、T049、T054 | complexity report |
| 最终三 provider 架构审查 | FR-REV-001、FR-TEST-001 | Phase 9 | T055 | kimi/k3 + opus + grok |
| 最终实际 diff 用户确认 | FR-DEL-001、FR-GOV-001 | Phase 9 | T056 | blocked-by-design user gate |
| 不重放事故、不跑 10 任务 | FR-TEST-001 | 全局 | T020、T050–T055 | synthetic only |
| 业务任务期间不得修改 Hub | FR-GOV-001 | Phase 4、9 | T019–T020、T054 | clean-install 只读 Runner + 源码树前后哈希一致 |

## 6. Final Boundary Check

- [x] 每个 Phase 八段完整，Files 与 plan 同一生成源。
- [x] 每个 Task 一张权威卡，精确文件属于 Phase NEW/MODIFY。
- [x] 行为变化有真实 RED → GREEN。
- [x] DAG 与 FR/Task/AC/gate 双向闭合。
- [x] Plan File Boundary 是 Phase 文件并集。
- [x] 每个 Phase 文件有 owning Task。
- [x] 每个 Task boundary 是所属 Phase 子集。
- [x] 每个 Task 只有一个完成区。
- [x] 没有未声明业务仓或外部任务依赖。

## Appendix A. Legacy migration proof

先对真实旧任务生成只读 inventory，并让用户逐项确认导入、归档或拒绝；active legacy 未归零就 STOP。冻结 fixture 只用于迁移证明，临时 importer 证明一次性正规化后在同一任务立即删除，最终不保留 legacy 入口或兼容期。下载方案中的“30 天/一个 release”建议已被后续用户口述明确覆盖。下载方案第 3 节仅作为历史三方盲审来源，最终新树仍由 T055 正式复审。
