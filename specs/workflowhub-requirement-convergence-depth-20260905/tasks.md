# 任务清单：工作流需求收敛深度改造（审查深化/争议对话/debate v2/调研机制/决策记录/执行模型）

- **Input**：`specs/workflowhub-requirement-convergence-depth-20260905/decision-log.md`（hash=085eb4d3509c18b6072a7fe470f828c678e770c42c17752f76f02b683f97c6ee）、`specs/workflowhub-requirement-convergence-depth-20260905/spec.md`（hash=bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f）、`specs/workflowhub-requirement-convergence-depth-20260905/plan.md`（hash=5e16d7e3c787887b5964669ee8672a9a839cc615367714bb7e732b8ae1baaff1）
- **Template version**：`plan-task.v4`
- **Implementation baseline（post-main sync）**：当前 worktree 已 fast-forward 到 `main@189f89e8d8a5e5775cc29d828531f0a0222985ec`。M17 repo-skills/multicli 作为上游基线，不改变本任务 FR/AC；P2 使用当前 `review-materials.mjs` 锚点 `stageReviewFocus(L958)`、`reviewInstructionsFor(L996)`，并保留 `wh-review/skill-bundle.json` 的 `runtime_dependencies` 与 `skills/catalog.yaml` 的 `metrics_enabled`。
- **Carry-forward implementation edits**：当前 worktree 尚有两处未提交修复：`skills/wh-review/scripts/review-provider-client.mjs` 的 `WH_REVIEW_BROKER_TIMEOUT_MS` 覆盖（默认 600s 不变）与 `runtime/stage/stage-handlers.mjs` 的 `decisionLog` 传递。它们不是新增 FR/AC，但必须纳入 build-code 实现快照并单独核对；本任务当前不把它们标为已完成。

## Phase P1 — 契约基础与 material_id 一致性

### Goal

result/attempt schema 携带可选 pair_id/role/disputed 字段（缺省兼容）；materialIdForInput 与 broker 规范算法一致（排除 manifest.json+canonical-evidence.json、按 path Buffer.compare 排序）；严格冻结路径真实往返不再 MATERIAL_INCOMPLETE；脱敏与错误码保留回归绿。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/attempt.schema.json`、`skills/wh-review/scripts/simple-review-runner.mjs`（materialIdForInput L191-205）、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`（口径核对）
- **DO NOT TOUCH**：`/Users/Hugh/Hugh/Project/3rd-review`（只读参照）、`runtime/review/canonical-review-result.mjs`（P2 才动）、`skills/wh-review/contracts/*.md`（P2 才动）

### Tasks

#### T101 — RED：material_id 对齐回归测试（含 manifest 条目+乱序 fixture、真实 broker 往返 fixture）

- **ID**：T101
- **Phase**：Phase P1 — 契约基础与 material_id 一致性
- **goal**：新增 materialIdForInput 对齐 broker 规范算法的目标断言（排除 manifest.json 与 canonical-evidence.json、按 path Buffer.compare 排序）；真实 broker 往返作为同卡外部观察项单独记录，不把本地 fixture 结果冒充 live broker 通过
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-605 → FR-REV-006 → AC-REV-006
- **输入**：accepted spec.md FR-REV-006/AC-REV-006 与 plan.md Phase P1 节；broker 规范算法参照 3rd-review `lib/attachments.mjs` L18-26（只读）
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-REV-006
- **AC**：AC-REV-006
- **动作**：在 simple-review-runner.test.mjs 中增加三类确定性目标断言用例（manifest 条目混入+乱序 fixture 的 material_id 期望值、空材料/单文件边界、严格冻结路径）；build-code 另按 T805 使用真实 broker/host 入口做往返观察，缺服务即记录 unavailable
- **精确文件**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`; symbols/regions: material_id 相关 describe/it 用例块（仅新增用例，不改既有用例）
- **输出**：RED 证据——目标断言以非零退出失败，落盘 `quality/tests/p1-matid-red.log`
- **Knowledge**：broker 规范算法=排除 manifest.json 与 canonical-evidence.json、按 path Buffer.compare 排序（3rd-review lib/attachments.mjs L18-26 只读参照）；当前 materialIdForInput 不排序且含 manifest 条目（simple-review-runner.mjs L191-205）；测试框架=vitest
- **verification_role**：RED
- **paired_task**：T102
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-MATID-01` — 新增 material_id 对齐断言（排序/排除 manifest/真实往返）在当前实现下失败，输出含目标断言失败信号
- **evidence_path**：`quality/tests/p1-matid-red.log`
- **STOP**：命令不可执行、vitest 环境损坏、需要改动测试文件以外文件或需要新设计时停止，回 plan.md Phase P1 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=撤销本卡新增用例，保持既有用例原样
- **task risk**：错误 RED（断言写法本身错误导致失败而非行为缺口）或 fixture 未覆盖 manifest 混入/乱序/单文件边界导致覆盖不足
- **test tier / test method**：fullstack — backend-testing；material_id 是 runner 与 broker 之间的协议/契约边界，须在真实组请求与材料冻结链路上验证
- **scenarios / commands / expected exit / oracle**：成功场景（排序+排除后 material_id 匹配 broker）、失败场景（manifest 混入/乱序输入）、边界场景（空材料、单文件）；同命令 `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`，RED 预期非零，oracle 同 ORACLE-MATID-01
- **fixtures_services**：fixture=含 manifest 条目+乱序的材料集、空材料、单文件；live broker 是外部依赖，不伪造为本地服务；清理责任=测试内临时目录自清理，外部观察只保留证据引用
- **coverage limits**：本命令覆盖 simple-review-runner 全文件用例（含 material_id 新用例与既有回归）；不覆盖 schema 校验（T103/T104）与脱敏（T105）

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 `simple-review-runner.test.mjs` 增加 broker canonical material_id 的排序/transport 条目排除、单文件与空材料边界断言；未修改 broker。
- **executed_commands**：RED `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` exit 1（21 passed/1 failed，目标断言失败）；配对 GREEN 同命令 exit 0（22/22）。
- **evidence_refs**：`quality/evidence/build-code/P1-phase-card.json` sha256 `b2a7cb9cf084cacc69828b62cb33ef8ff0302c4aa25d1d2f085669a038c03339`；`quality/tests/p1-matid-red.log` sha256 `65aa8f6a0638510920850085c413d638ecd9a5c0359552976460bf2e974012a3`；`quality/tests/p1-matid-green.log` sha256 `dfc03a4bc21cd6106b42639a41536a428f5b99bedfb2417144ca04384100bb8b`。
- **covered_ac**：`AC-REV-006=partial`；本地 canonical fixture 已通过，真实 broker 往返未在本卡伪造，按 T805/外部服务事实保留 unavailable。
- **review_fact**：与 T102 配对；P1 当前 Phase review 已执行一次，结果 `unavailable/REVIEW_EXECUTION_TIMEOUT`，无 findings；不可用事实保留，不改写为通过。
- **completed_at**：2026-09-05T23:02:20+0800
- **执行事实**：Phase Card 已落盘；RED 由 material_id 未排序且含 manifest 的行为缺口触发，GREEN 对齐为排除 `manifest.json`/`canonical-evidence.json` 后按 path `Buffer.compare` 排序；测试输出、限制和单次 review unavailable 已记录。下一项：T102。

#### T102 — GREEN：materialIdForInput 对齐 broker canonical 算法

- **ID**：T102
- **Phase**：Phase P1 — 契约基础与 material_id 一致性
- **goal**：让 T101 的目标断言通过并保留负例（manifest 混入/乱序输入仍产出规范 material_id）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-605 → FR-REV-006 → AC-REV-006
- **输入**：T101 的失败断言事实与 simple-review-runner.mjs materialIdForInput L191-205 实现锚点
- **依赖**：T101
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-006
- **AC**：AC-REV-006
- **动作**：修改 materialIdForInput：排除 manifest.json 与 canonical-evidence.json 条目、按 path Buffer.compare 排序后计算 material_id，满足目标行为的最小实现
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/simple-review-runner.mjs`; symbols/regions: materialIdForInput(L191-205)；测试文件仅允许修正 T101 新增用例中的断言笔误，不得弱化断言
- **输出**：GREEN——同命令退出 0，证据落盘 `quality/tests/p1-matid-green.log`
- **Knowledge**：T101 产出的真实失败事实；material_id 变化使既有 receipt/确认绑定失效，需以新材料重建确认（SCN-008）；旧 material_id 记录只读保留不回溯
- **verification_role**：GREEN
- **paired_task**：T101
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-MATID-01` — 全部 material_id 对齐断言通过且既有用例保持绿；负例（manifest 混入/乱序）仍被规范化处理
- **evidence_path**：`quality/tests/p1-matid-green.log`
- **STOP**：需要弱化 T101 断言、扩大 boundary 到 materialIdForInput 以外、或真实往返 fixture 对齐后仍 MATERIAL_INCOMPLETE（RISK-02 未关闭）时停止，回 spec.md FR-REV-006 验收口径+decision-log D-605；禁止改 broker 侧或加兼容 bridge
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡实现改动，回到 T101 RED 状态
- **task risk**：实现偏离 broker 算法细节（排序键、排除清单）或负例回归（对合法输入产生不同 material_id）
- **test tier / test method**：fullstack — backend-testing；material_id 是 runner↔broker 协议/契约边界，须在真实请求与材料冻结链路上验证
- **scenarios / commands / expected exit / oracle**：与 T101 相同的成功/失败/边界场景；同命令，GREEN 预期退出 0，oracle 同 ORACLE-MATID-01
- **fixtures_services**：与 T101 相同 fixture；清理责任=测试内临时目录自清理
- **coverage limits**：本命令覆盖 simple-review-runner 全文件用例；不覆盖 schema 校验与脱敏回归

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`materialIdForInput` 现在排除 `manifest.json` 与 `canonical-evidence.json`，规范化 sha256，并按 path 的 UTF-8 `Buffer.compare` 排序后计算哈希。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` exit 0（22/22）；`node --check skills/wh-review/scripts/simple-review-runner.mjs` exit 0；`git diff --check` exit 0。
- **evidence_refs**：`quality/tests/p1-matid-green.log` sha256 `dfc03a4bc21cd6106b42639a41536a428f5b99bedfb2417144ca04384100bb8b`；`quality/evidence/build-code/P1-test-routing.json` sha256 `8f06d912b02383551ebbdba725130e0d99647a3ab7a83f17c65f53c08a06fcc8`；`quality/reviews/results/P1-phase-review.json` sha256 `d8e2568f3413f28a0f53d94179ab7b87449c8005d763a118136ac850759cfb5c`。
- **covered_ac**：`AC-REV-006=partial`；本地 runner 与 canonical 规则一致，真实 broker 往返仍待 T805/外部依赖，不把本地 fixture 当 live 通过。
- **review_fact**：P1 当前 Phase review 一次，`unavailable`，`REVIEW_EXECUTION_TIMEOUT`，无 findings；未重复调用。
- **completed_at**：2026-09-05T23:02:20+0800
- **执行事实**：GREEN 已闭合 T101 的目标断言；实现边界仅为 `materialIdForInput`，未改 broker 或兼容桥。下一项：T103。

#### T103 — RED：schema 可选字段断言（接受 pair_id/role/disputed+缺省兼容+非法 role 拒绝）

- **ID**：T103
- **Phase**：Phase P1 — 契约基础与 material_id 一致性
- **goal**：新增 result/attempt schema 可选字段目标断言（携带 pair_id/role/disputed 的对象通过校验、缺省对象兼容通过、非法 role 值被拒绝），当前 schema 下断言失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-003 → AC-REV-003
- **输入**：accepted spec.md FR-REV-003/AC-REV-003 与 plan.md Phase P1 节；既有 schema=`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/attempt.schema.json`（无 pair_id/role/disputed）
- **依赖**：T102
- **并行**：否 — first RED for this behavior
- **FR**：FR-REV-003
- **AC**：AC-REV-003
- **动作**：在 schema-validator.test.mjs 中增加可选字段断言用例（正例携带字段、缺省兼容、非法 role 拒绝负例），不改 schema
- **精确文件**：`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/schema-validator.test.mjs`; symbols/regions: schema 可选字段相关 describe/it 用例块（仅新增用例）
- **输出**：RED 证据——目标断言以非零退出失败，落盘 `quality/tests/p1-schema-red.log`
- **Knowledge**：既有 result/attempt schema 无 pair_id/role/disputed 字段；schema 可选字段缺省不影响既有消费方；测试框架=vitest
- **verification_role**：RED
- **paired_task**：T104
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/schema-validator.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-SCHEMA-PAIR-01` — 可选字段断言（接受/缺省兼容/非法 role 拒绝）在当前 schema 下失败，输出含目标断言失败信号
- **evidence_path**：`quality/tests/p1-schema-red.log`
- **STOP**：命令不可执行、需要改动测试文件以外文件或需要新设计时停止，回 plan.md Phase P1 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=撤销本卡新增用例
- **task risk**：错误 RED（断言写法错误）或负例缺失（非法 role 拒绝未覆盖导致 schema 过宽）
- **test tier / test method**：fullstack — backend-testing；result/attempt schema 是审查结果跨组件流转的契约边界，须按契约校验链路验证
- **scenarios / commands / expected exit / oracle**：成功场景（携带字段通过、缺省通过）、失败场景（非法 role 拒绝）；同命令 `npx vitest run skills/wh-review/scripts/__tests__/schema-validator.test.mjs`，RED 预期非零，oracle 同 ORACLE-SCHEMA-PAIR-01
- **fixtures_services**：fixture=携带 pair_id/role/disputed 的结果对象、缺省对象、非法 role 对象；无外部服务；N/A 清理
- **coverage limits**：本命令覆盖 schema-validator 全文件用例；不覆盖 material_id 算法与脱敏

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 `schema-validator.test.mjs` 增加 result/attempt pair 元数据正例、缺省兼容和非法 role 负例。
- **executed_commands**：RED `npx vitest run skills/wh-review/scripts/__tests__/schema-validator.test.mjs` exit 1（6 passed/1 failed，`/pair_id additionalProperties`）；配对 GREEN 同命令 exit 0（7/7）。
- **evidence_refs**：`quality/tests/p1-schema-red.log` sha256 `fa0e96cdfcade57c5464257bdb80c581a960ebb1c045fad64a357f055d039d00`；`quality/tests/p1-schema-green.log` sha256 `de4087cf810c34bada24ecbe0c516eafd9efcc65cb1ac32b8958d2eeb56258c2`。
- **covered_ac**：`AC-REV-003=partial`；本地 schema contract 已通过，红蓝运行时 pair 校验与聚合由 P2 验证。
- **review_fact**：与 T104 配对；P1 当前 Phase review 一次，`unavailable/REVIEW_EXECUTION_TIMEOUT`，无 findings。
- **completed_at**：2026-09-05T23:02:20+0800
- **执行事实**：RED 命中既有 schema 的 additionalProperties 缺口；测试保持非法 role 拒绝目标。下一项：T104。

#### T104 — GREEN：result/attempt schema 增加可选字段

- **ID**：T104
- **Phase**：Phase P1 — 契约基础与 material_id 一致性
- **goal**：让 T103 的目标断言通过并保留负例（非法 role 仍被拒绝）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-003 → AC-REV-003
- **输入**：T103 的失败断言事实与既有 schema 文件锚点
- **依赖**：T103
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-003
- **AC**：AC-REV-003
- **动作**：在 result.schema.json 与 attempt.schema.json 增加可选 pair_id/role/disputed 字段（role 枚举受限、字段全部 optional 保持缺省兼容），最小实现
- **精确文件**：`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/attempt.schema.json`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`
- **boundary**：files: `runtime/review/schemas/result.schema.json`, `runtime/review/schemas/attempt.schema.json`; symbols/regions: schema properties 定义（新增可选字段）；测试文件仅允许修正 T103 新增用例断言笔误，不得弱化断言
- **输出**：GREEN——同命令退出 0，证据落盘 `quality/tests/p1-schema-green.log`
- **Knowledge**：T103 产出的真实失败事实；schema 可选字段缺省不影响既有消费方；revert 不影响既有消费（字段为可选）
- **verification_role**：GREEN
- **paired_task**：T103
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/schema-validator.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-SCHEMA-PAIR-01` — 可选字段断言全部通过且非法 role 拒绝负例保持拒绝；既有用例保持绿
- **evidence_path**：`quality/tests/p1-schema-green.log`
- **STOP**：需要弱化 T103 断言、扩大 boundary 到两份 schema 以外或需要新设计时停止，回 plan.md Phase P1 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡 schema 改动
- **task risk**：字段误设为必填破坏缺省兼容，或 role 枚举过宽使负例失效
- **test tier / test method**：fullstack — backend-testing；schema 是审查结果跨组件流转的契约边界，须按契约校验链路验证
- **scenarios / commands / expected exit / oracle**：与 T103 相同场景；同命令，GREEN 预期退出 0，oracle 同 ORACLE-SCHEMA-PAIR-01
- **fixtures_services**：与 T103 相同 fixture；N/A 清理
- **coverage limits**：本命令覆盖 schema-validator 全文件用例；不覆盖 material_id 与脱敏

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`result.schema.json` 增加可选 `pair_id`/`role`/`disputed`；`attempt.schema.json` 增加可选 `pair_id`/`role`，均保持缺省兼容并限制 role 为 `red|blue`。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/schema-validator.test.mjs` exit 0（7/7）；JSON parse 与 `node --check skills/wh-review/scripts/__tests__/schema-validator.test.mjs` exit 0；`git diff --check` exit 0。
- **evidence_refs**：`quality/tests/p1-schema-green.log` sha256 `de4087cf810c34bada24ecbe0c516eafd9efcc65cb1ac32b8958d2eeb56258c2`。
- **covered_ac**：`AC-REV-003=partial`；schema 载体与兼容性已验证，P2 的 pair 运行时校验、incomplete 和聚合标注尚未执行。
- **review_fact**：P1 当前 Phase review 一次，`unavailable`，`REVIEW_EXECUTION_TIMEOUT`，无 findings；没有重复审查。
- **completed_at**：2026-09-05T23:02:20+0800
- **执行事实**：schema 改动仅增加可选字段与 role 枚举，未升 v2、未改既有必填字段。下一项：T105。

#### T105 — 回归：material-redaction 测试转绿确认脱敏与 identity_degraded 错误码保留未受影响

- **ID**：T105
- **Phase**：Phase P1 — 契约基础与 material_id 一致性
- **goal**：运行 material-redaction 回归测试，确认 P1 的 material_id 算法与 schema 变更未影响脱敏行为与 identity_degraded 错误码保留
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-606 → FR-REV-007 → AC-REV-007
- **输入**：T102 与 T104 完成后的当前实现；material-redaction 既有测试口径
- **依赖**：T104
- **并行**：否 — 回归须读取前序任务完成事实
- **FR**：FR-REV-007
- **AC**：AC-REV-007
- **动作**：只运行既有 material-redaction 测试并核对口径，不新增行为、不改生产实现；仅当 fixture 口径与 material_id 新算法存在机械性不一致时做最小口径核对修正
- **精确文件**：`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/material-redaction.test.mjs`; symbols/regions: 仅口径核对，不新增不断言弱化
- **输出**：回归绿证据落盘 `quality/tests/p1-redaction-green.log`
- **Knowledge**：脱敏 redactProviderHostPaths 已合入 main（5c4a3b3f/6090fbc5），本任务只保持回归；identity_degraded 错误码保留为既有口径
- **verification_role**：N/A — non-behavior change: 回归确认卡：不引入新行为，仅执行既有测试确认未受影响，无 RED/GREEN 配对
- **paired_task**：N/A — 回归卡无 RED/GREEN 对
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-REDACT-01` — material-redaction 全部既有用例通过，脱敏与 identity_degraded 错误码保留事实成立
- **evidence_path**：`quality/tests/p1-redaction-green.log`
- **STOP**：回归出现真实失败（非口径问题）时停止，回 plan.md Phase P1 节定位是哪一步变更引入；命令不可执行时停止
- **recovery**：负责人=本任务执行 agent；最小恢复动作=回退最近引入失败的实现卡改动
- **task risk**：把真实回归失败误记为口径问题而修改测试掩盖事实
- **test tier / test method**：fullstack — backend-testing；脱敏发生在材料跨进程/跨 provider 传递的契约边界，须保持链路级回归
- **scenarios / commands / expected exit / oracle**：状态场景=既有脱敏与错误码保留用例全绿；命令 `npx vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs`，预期退出 0，oracle 同 ORACLE-REDACT-01
- **fixtures_services**：fixture=既有脱敏测试材料；无外部服务；清理责任=测试内自清理
- **coverage limits**：本命令覆盖 material-redaction 全文件既有用例；不覆盖新增行为（本 phase 无新增脱敏行为）

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：未修改 `material-redaction.test.mjs` 或脱敏生产代码；执行既有回归确认脱敏和 `identity_degraded` 错误码保留。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs` exit 0（2/2）。
- **evidence_refs**：`quality/tests/p1-redaction-green.log` sha256 `657055c6eb80571d66faab0e36b62151a4714d4acc8df52cb0e3f3267f22e26f`。
- **covered_ac**：`AC-REV-007=pass`（本地既有回归）；不覆盖真实 provider 运行观察。
- **review_fact**：P1 当前 Phase review 一次，`unavailable/REVIEW_EXECUTION_TIMEOUT`，无 findings；脱敏回归未触发新的行为变更。
- **completed_at**：2026-09-05T23:02:20+0800
- **执行事实**：既有 material-redaction 两个用例保持通过，未以口径修改掩盖失败。P1 任务完成，下一阶段：P2/T201。

### Verify

- **Target**：FR-REV-006/AC-REV-006（material_id 对齐）、FR-REV-003/AC-REV-003（schema 可选字段）、FR-REV-007/AC-REV-007（脱敏与错误码回归）
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`npx vitest run skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`npx vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p1-matid-red.log`、`quality/tests/p1-matid-green.log`、`quality/tests/p1-schema-red.log`、`quality/tests/p1-schema-green.log`、`quality/tests/p1-redaction-green.log`
- **Oracle**：ORACLE-MATID-01（material_id 对齐断言绿）、ORACLE-SCHEMA-PAIR-01（schema 可选字段断言绿）、ORACLE-REDACT-01（脱敏回归绿）

### Knowledge

broker 规范算法=排除 manifest.json 与 canonical-evidence.json、按 path Buffer.compare 排序（3rd-review lib/attachments.mjs L18-26 只读参照）；material_id 变化使既有 receipt/确认绑定失效，需以新材料重建确认（SCN-008），P2 pair 校验依赖此算法输出；schema 可选字段缺省不影响既有消费方。

### STOP

真实 broker 往返 fixture 在对齐后仍 MATERIAL_INCOMPLETE（RISK-02 未关闭）→ 停止并回 `specs/workflowhub-requirement-convergence-depth-20260905/spec.md`（FR-REV-006 验收口径）+decision-log D-605；禁止改 broker 侧或加兼容 bridge。

### Done

三条 gate_cmd 绿、RED/GREEN 证据成对落盘质量测试区；AC-REV-006 可判通过、AC-REV-007 回归确认；旧 material_id 记录只读保留未回溯；本 phase 一次异源审查（红或蓝）完成并记录。

### Risks and rollback

- **Risk**：算法对齐引入排序边界 case，导致真实往返失败（affected IDs：FR-REV-006/AC-REV-006，T101/T102）。
- **Prevention**：fixture 覆盖空材料/单文件/manifest 混入三类边界。
- **Rollback / recovery**：`git revert` 本 phase 提交，schema 字段为可选、revert 不影响既有消费。

## Phase P2 — 红蓝双发审查

### Goal

direction/detail 两面各执行红+蓝两次组请求构成同一逻辑 review fact；pair_id/role 元数据随请求/结果携带；同 pair 同 material_id 运行时校验（不一致记 partial）；blue_incomplete/red_incomplete 降级标注；聚合=并集+provider×角色标注+disputed/consensus 争议标注落地 clusterRecord；build-spec 单次+指令强化+"AC 可判断性与验收盲区"专项；合同/测试/AC-011 审计三者成对转绿。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`、`runtime/review/canonical-review-result.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/requirements-completeness-audit-acceptance.test.mjs`、`tests/contract/review-materials-contract.test.mjs`
- **DO NOT TOUCH**：`skills/wh-review/contracts/provider-protocol.md`（broker 协议不动）、`runtime/schemas/decision-entry.v1.json`、`runtime/stage/stage-content-contracts.mjs`（本任务不动：round_count 动态校验已存在，Talk4 条件轮无需代码改动）、其余阶段合同（build-plan/build-code/verify-code/mini-task-*）

### Tasks

#### T201 — RED：红蓝调度契约测试（direction/detail 各两次组请求、同一 pair_id、role 元数据）

- **ID**：T201
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：新增红蓝调度目标断言（make-decision direction/detail 两面各发 red+blue 两次组请求、同一 pair_id、role 元数据随请求/结果携带），当前实现下断言失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-001 → AC-REV-001
- **输入**：accepted spec.md FR-REV-001/AC-REV-001 与 plan.md Phase P2 节；P1 完成事实（schema 可选字段与 material_id 对齐）
- **依赖**：T105
- **并行**：否 — first RED for this behavior
- **FR**：FR-REV-001、FR-REV-002
- **AC**：AC-REV-001、AC-REV-002
- **动作**：在 simple-review-runner.test.mjs 中增加红蓝调度断言用例（组请求次数=每面两次、pair_id 一致、role=red/blue 元数据携带），不改生产实现
- **精确文件**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`; symbols/regions: 红蓝调度相关 describe/it 用例块（仅新增用例）
- **输出**：RED 证据——目标断言以非零退出失败，落盘 `quality/tests/p2-redblue-red.log`
- **Knowledge**：当前每审查面单次组请求（runSimpleReview L357/runGroup L390-397）；红蓝仅适用 make-decision direction/detail 两面，其余阶段维持 single_round；组请求复用同一通道，无 per-provider prompt 通道（PFACT-01）
- **verification_role**：RED
- **paired_task**：T202
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-REDBLUE-01` — 红蓝调度断言（每面两次组请求/同一 pair_id/role 元数据）在当前实现下失败
- **evidence_path**：`quality/tests/p2-redblue-red.log`
- **STOP**：命令不可执行、需要改动测试文件以外文件或需要新设计时停止，回 plan.md Phase P2 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=撤销本卡新增用例
- **task risk**：错误 RED 或断言未覆盖 direction/detail 两面与 pair_id 一致性导致覆盖不足
- **test tier / test method**：fullstack — backend-testing；红蓝调度是 runner 与 broker/provider 之间的协议/契约边界，须在组请求链路上验证
- **scenarios / commands / expected exit / oracle**：成功场景（direction/detail 各 red+blue 两次组请求、pair_id 一致、role 元数据携带）；同命令，RED 预期非零，oracle 同 ORACLE-REDBLUE-01
- **fixtures_services**：fixture=模拟组请求通道的可断言 stub；无真实外部服务；清理责任=测试内自清理
- **coverage limits**：本命令覆盖 simple-review-runner 全文件用例（含 P1 material_id 用例回归）；不覆盖聚合标注（T207/T208）与合同文本

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 `simple-review-runner.test.mjs` 增加 direction/detail 红蓝双发、同一 `pair_id`、`role=red|blue` 请求/结果元数据断言；保留非 make-decision 单次请求断言。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；RED exit 1（`p2-redblue-red.log`），最终 GREEN exit 0，29/29（`p2-redblue-green.log`）。
- **evidence_refs**：`quality/evidence/build-code/P2-phase-card.json`、`quality/evidence/build-code/P2-test-routing.json`、`quality/tests/p2-redblue-red.log`、`quality/tests/p2-redblue-green.log`
- **covered_ac**：`AC-REV-001` 本地 RED/GREEN 闭合；`AC-REV-002` detail 调度断言闭合，真实 provider 事实另按 unavailable 保留。
- **review_fact**：`quality/reviews/results/P2-phase-review.json` 为一次源码绑定 review，结果 `unavailable`（`REVIEW_EXECUTION_TIMEOUT`）；未重复调用或将其写成通过。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：RED 目标失败、最终 GREEN 29/29；direction/detail 各发 red+blue，pair_id 共享，非目标阶段仍 single_round。

#### T202 — GREEN：runSimpleReview/runGroup 红蓝调度实现

- **ID**：T202
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：让 T201 的目标断言通过并保留负例（非 make-decision 阶段维持 single_round 不发红蓝）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-001 → AC-REV-001
- **输入**：T201 的失败断言事实与 runSimpleReview L357/runGroup L390-397 实现锚点
- **依赖**：T201
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-001、FR-REV-002
- **AC**：AC-REV-001、AC-REV-002
- **动作**：在 runSimpleReview/runGroup 实现红蓝调度：make-decision direction/detail 两面各发 red+blue 两次组请求，生成同一 pair_id，role 元数据随请求与结果携带（写入 P1 schema 可选字段），最小实现
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/simple-review-runner.mjs`; symbols/regions: runSimpleReview(L357)、runGroup(L390-397) 红蓝调度区域；测试文件仅允许修正 T201 新增用例断言笔误，不得弱化断言
- **输出**：GREEN——同命令退出 0，证据落盘 `quality/tests/p2-redblue-green.log`
- **Knowledge**：T201 产出的真实失败事实；红蓝 2× 成本逼近客户端超时窗（RISK-01），不延长超时窗；其余阶段维持 single_round
- **verification_role**：GREEN
- **paired_task**：T201
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-REDBLUE-01` — 红蓝调度断言全部通过；负例（非 make-decision 阶段 single_round 不变）保持
- **evidence_path**：`quality/tests/p2-redblue-green.log`
- **STOP**：需要弱化 T201 断言、扩大 boundary 到 runSimpleReview/runGroup 以外或需要新设计时停止，回 plan.md Phase P2 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡实现改动
- **task risk**：红蓝调度误伤其他阶段的 single_round 语义，或 pair_id 生成不稳定
- **test tier / test method**：fullstack — backend-testing；红蓝调度是 runner↔broker/provider 协议/契约边界，须在组请求链路上验证
- **scenarios / commands / expected exit / oracle**：与 T201 相同场景加负例（非 make-decision 阶段单轮）；同命令，GREEN 预期退出 0，oracle 同 ORACLE-REDBLUE-01
- **fixtures_services**：与 T201 相同 fixture；清理责任=测试内自清理
- **coverage limits**：本命令覆盖 simple-review-runner 全文件用例；不覆盖聚合标注与合同文本

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`simple-review-runner.mjs` 实现 make-decision direction/detail 的 red/blue 并发组请求、共享 `pair_id` 和 role 元数据；非 make-decision 保持单次路径。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；exit 0，29/29。
- **evidence_refs**：`quality/tests/p2-redblue-red.log`、`quality/tests/p2-redblue-green.log`、`quality/evidence/build-code/P2-backend-testing.json`
- **covered_ac**：`AC-REV-001`、`AC-REV-002` 本地 runner 语义闭合；provider 往返未取得，不宣称端到端通过。
- **review_fact**：同一 `P2-phase-review.json` 源码绑定 review，`unavailable`；无重复审查。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：共享 pair identity 和角色边界已落在请求、provider result、top-level result；RED/GREEN 成对保留。

#### T203 — RED：同 pair 同 material_id 校验测试（故意不一致记 partial）

- **ID**：T203
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：新增同 pair 同 material_id 运行时校验目标断言（红蓝两次请求 material_id 不一致时记 partial），当前实现下断言失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-003 → AC-REV-003
- **输入**：accepted spec.md FR-REV-003/AC-REV-003 与 plan.md Phase P2 节；T202 完成的红蓝调度事实
- **依赖**：T202
- **并行**：否 — first RED for this behavior
- **FR**：FR-REV-003
- **AC**：AC-REV-003
- **动作**：在 simple-review-runner.test.mjs 中增加 pair material 校验断言用例（一致时正常、故意构造不一致时结果记 partial），不改生产实现
- **精确文件**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`; symbols/regions: pair material 校验相关 describe/it 用例块（仅新增用例）
- **输出**：RED 证据——目标断言以非零退出失败，落盘 `quality/tests/p2-pairmat-red.log`
- **Knowledge**：material_id 算法已对齐 broker（T102）；同一 pair 两次请求共享 material 语义身份是 P3 对话材料可信的前提
- **verification_role**：RED
- **paired_task**：T204
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-PAIRMAT-01` — pair material_id 校验断言（一致通过/不一致记 partial）在当前实现下失败
- **evidence_path**：`quality/tests/p2-pairmat-red.log`
- **STOP**：命令不可执行、需要改动测试文件以外文件或需要新设计时停止，回 plan.md Phase P2 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=撤销本卡新增用例
- **task risk**：错误 RED 或不一致构造方式不真实（未走真实 material_id 计算路径）导致假覆盖
- **test tier / test method**：fullstack — backend-testing；pair material 校验是红蓝两次请求间的协议/契约边界，须在组请求链路上验证
- **scenarios / commands / expected exit / oracle**：成功场景（material_id 一致）、失败场景（故意不一致记 partial）；同命令，RED 预期非零，oracle 同 ORACLE-PAIRMAT-01
- **fixtures_services**：fixture=可构造 material_id 不一致的组请求 stub；无外部服务；清理责任=测试内自清理
- **coverage limits**：本命令覆盖 simple-review-runner 全文件用例；不覆盖聚合标注与合同文本

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 `simple-review-runner.test.mjs` 增加同 pair material_id 一致/不一致负例，要求不一致进入 partial 并保留 mismatch finding。
- **executed_commands**：同一 simple runner gate；RED exit 1（`p2-pairmat-red.log`），最终 GREEN exit 0，29/29（`p2-pairmat-green.log`）。
- **evidence_refs**：`quality/tests/p2-pairmat-red.log`、`quality/tests/p2-pairmat-green.log`、`quality/evidence/build-code/P2-phase-card.json`
- **covered_ac**：`AC-REV-003` 本地 mismatch/consistent 语义闭合；跨真实 broker 的一致性仍 unavailable。
- **review_fact**：`P2-phase-review.json` 源码 packet review timeout；保留 incomplete，不重复审查。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：故意构造不同 material_id 时得到 `PAIR_MATERIAL_MISMATCH`、`partial`，未静默通过。

#### T204 — GREEN：pair material 校验实现

- **ID**：T204
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：让 T203 的目标断言通过并保留负例（不一致必记 partial，不得静默通过）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-003 → AC-REV-003
- **输入**：T203 的失败断言事实与红蓝调度实现锚点
- **依赖**：T203
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-003
- **AC**：AC-REV-003
- **动作**：在 simple-review-runner.mjs 实现同 pair 同 material_id 运行时校验：红蓝结果 material_id 不一致时将该 pair 结果记 partial，最小实现
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/simple-review-runner.mjs`; symbols/regions: runSimpleReview/runGroup 红蓝结果汇合处 pair 校验区域；测试文件仅允许修正 T203 新增用例断言笔误
- **输出**：GREEN——同命令退出 0，证据落盘 `quality/tests/p2-pairmat-green.log`
- **Knowledge**：T203 产出的真实失败事实；partial 语义=结果可用但需降级标注，不得改写为质量通过
- **verification_role**：GREEN
- **paired_task**：T203
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-PAIRMAT-01` — pair 校验断言全部通过；负例（不一致静默通过）不存在
- **evidence_path**：`quality/tests/p2-pairmat-green.log`
- **STOP**：需要弱化 T203 断言或扩大 boundary 时停止，回 plan.md Phase P2 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡实现改动
- **task risk**：校验实现误把合法差异（如 provider 元数据差异）判为不一致
- **test tier / test method**：fullstack — backend-testing；pair material 校验是红蓝请求间协议/契约边界，须在组请求链路上验证
- **scenarios / commands / expected exit / oracle**：与 T203 相同场景；同命令，GREEN 预期退出 0，oracle 同 ORACLE-PAIRMAT-01
- **fixtures_services**：与 T203 相同 fixture；清理责任=测试内自清理
- **coverage limits**：本命令覆盖 simple-review-runner 全文件用例；不覆盖聚合标注与合同文本

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`simple-review-runner.mjs` 聚合红蓝 material identity，生成一致性/partial 状态和 `PAIR_MATERIAL_MISMATCH` finding。
- **executed_commands**：simple runner gate；exit 0，29/29。
- **evidence_refs**：`quality/tests/p2-pairmat-red.log`、`quality/tests/p2-pairmat-green.log`、`quality/evidence/build-code/P2-backend-testing.json`
- **covered_ac**：`AC-REV-003` 本地实现语义通过；真实 host 观察 unavailable。
- **review_fact**：一次源码绑定 P2 review `unavailable`；未把 timeout 当作 clean。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：一致 material_id 保持完整，不一致降为 partial，top-level material_id 不伪造为公共值。

#### T205 — RED：blue_incomplete/red_incomplete 降级标注测试（含单成员失败其余照用）

- **ID**：T205
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：新增降级标注目标断言（任一侧 partial/failed 记 available-with-failures 并标注 blue_incomplete/red_incomplete；组内单成员失败其余成员照用），当前实现下断言失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-003/FR-GOV-002 → AC-REV-003/AC-GOV-002；RISK-01
- **输入**：accepted spec.md FR-REV-003/AC-REV-003 与 plan.md Phase P2 节；T204 完成事实
- **依赖**：T204
- **并行**：否 — first RED for this behavior
- **FR**：FR-REV-003、FR-GOV-002（规则②③⑦ 测试门，plan 追溯表归属）
- **AC**：AC-REV-003、AC-GOV-002（规则②③⑦ 测试门，plan 追溯表归属）
- **动作**：在 simple-review-runner.test.mjs 中增加降级标注断言用例（蓝侧失败→blue_incomplete+available-with-failures；红侧失败→red_incomplete；组内单成员失败其余照用），不改生产实现
- **精确文件**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`; symbols/regions: 降级标注相关 describe/it 用例块（仅新增用例）
- **输出**：RED 证据——目标断言以非零退出失败，落盘 `quality/tests/p2-incomplete-red.log`
- **Knowledge**：蓝队超时为实证风险（RISK-01 实证 4/5 失败）；mitigation=incomplete 标注+同编成重试 1 次+不延长超时窗；聚合输入=完成集（蓝队 partial 时 debate 输入=已完成集）
- **verification_role**：RED
- **paired_task**：T206
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-INCOMPLETE-01` — 降级标注断言（blue_incomplete/red_incomplete/available-with-failures/单成员失败其余照用）在当前实现下失败
- **evidence_path**：`quality/tests/p2-incomplete-red.log`
- **STOP**：命令不可执行、需要改动测试文件以外文件或需要新设计时停止，回 plan.md Phase P2 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=撤销本卡新增用例
- **task risk**：错误 RED 或未覆盖红/蓝两侧各自失败与单成员失败三类场景
- **test tier / test method**：fullstack — backend-testing；降级标注发生在组请求失败汇合的协议/契约边界，须在请求链路上验证
- **scenarios / commands / expected exit / oracle**：失败场景（蓝侧失败、红侧失败、单成员失败）与状态场景（available-with-failures 标注）；同命令，RED 预期非零，oracle 同 ORACLE-INCOMPLETE-01
- **fixtures_services**：fixture=可注入失败的组请求 stub；无外部服务；清理责任=测试内自清理
- **coverage limits**：本命令覆盖 simple-review-runner 全文件用例；不覆盖聚合标注与合同文本

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：增加 red/blue incomplete、单 provider 失败但其余 provider 成功的断言。
- **executed_commands**：simple runner gate；RED exit 1（`p2-incomplete-red.log`），最终 GREEN exit 0，29/29（`p2-incomplete-green.log`）。
- **evidence_refs**：`quality/tests/p2-incomplete-red.log`、`quality/tests/p2-incomplete-green.log`、`quality/evidence/build-code/P2-phase-card.json`
- **covered_ac**：`AC-REV-003` 本地降级语义闭合；真实 provider lifecycle 仍 unavailable。
- **review_fact**：源码绑定 P2 review `unavailable`（timeout）；不重复。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：RED/BLUE 不完整分别标注，整体为 `available-with-failures`，成功 provider 成员未被丢弃。

#### T206 — GREEN：available-with-failures+incomplete 标注实现

- **ID**：T206
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：让 T205 的目标断言通过并保留负例（失败侧必须被标注，不得静默丢弃或改写为通过）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-003/FR-GOV-002 → AC-REV-003/AC-GOV-002；RISK-01
- **输入**：T205 的失败断言事实与红蓝调度/pair 校验实现锚点
- **依赖**：T205
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-003、FR-GOV-002（规则②③⑦ 测试门，plan 追溯表归属）
- **AC**：AC-REV-003、AC-GOV-002（规则②③⑦ 测试门，plan 追溯表归属）
- **动作**：在 simple-review-runner.mjs 实现降级标注：任一侧 partial/failed 时结果状态记 available-with-failures 并写入 blue_incomplete/red_incomplete 标注；组内单成员失败保留其余成员结果；同编成重试 1 次、不延长超时窗，最小实现
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/simple-review-runner.mjs`; symbols/regions: runGroup 失败处理与结果汇合标注区域；测试文件仅允许修正 T205 新增用例断言笔误
- **输出**：GREEN——同命令退出 0，证据落盘 `quality/tests/p2-incomplete-green.log`
- **Knowledge**：T205 产出的真实失败事实；审查深度打折但语义不破（consequence 口径）；失败事实必须保留不得改写为通过
- **verification_role**：GREEN
- **paired_task**：T205
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-INCOMPLETE-01` — 降级标注断言全部通过；负例（失败静默丢弃/改写为通过）不存在
- **evidence_path**：`quality/tests/p2-incomplete-green.log`
- **STOP**：需要弱化 T205 断言、扩大 boundary 或需要新设计时停止，回 plan.md Phase P2 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡实现改动
- **task risk**：重试逻辑引入额外超时或重复请求；标注字段与 P1 schema 可选字段不一致
- **test tier / test method**：fullstack — backend-testing；降级标注在组请求失败汇合的协议/契约边界，须在请求链路上验证
- **scenarios / commands / expected exit / oracle**：与 T205 相同场景；同命令，GREEN 预期退出 0，oracle 同 ORACLE-INCOMPLETE-01
- **fixtures_services**：与 T205 相同 fixture；清理责任=测试内自清理
- **coverage limits**：本命令覆盖 simple-review-runner 全文件用例；不覆盖聚合标注与合同文本

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`simple-review-runner.mjs` 按任一 role/成员不完整降级为 `available-with-failures`，并输出 `red_incomplete`/`blue_incomplete` 与完整 provider entries。
- **executed_commands**：simple runner gate；exit 0，29/29。
- **evidence_refs**：`quality/tests/p2-incomplete-red.log`、`quality/tests/p2-incomplete-green.log`、`quality/evidence/build-code/P2-backend-testing.json`
- **covered_ac**：`AC-REV-003` focused implementation semantics pass；live provider unavailable。
- **review_fact**：P2 源码绑定 review `unavailable`；未重跑。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：任一角色失败不再伪造完整，另一角色及成功 provider 结果保留。

#### T207 — RED：聚合=并集+provider×角色标注+disputed/consensus 标注测试（含一提出一沉默用例）

- **ID**：T207
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：新增聚合标注目标断言（红蓝 findings 并集、provider×角色标注、共识∪分歧三态矩阵落入 clusterRecord provenance 层 disputed/consensus 可选标注，含一方提出另一方沉默用例）；provider 身份与 red/blue role 必须是两个独立维度，不能把同一 provider 的两种 role 计成两个 provider
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-005 → AC-REV-005
- **输入**：accepted spec.md FR-REV-005/AC-REV-005 与 plan.md Phase P2 节；T206 完成事实；`runtime/review/canonical-review-result.mjs` L55-110（Must read before task）
- **依赖**：T206
- **并行**：否 — first RED for this behavior
- **FR**：FR-REV-005
- **AC**：AC-REV-005
- **动作**：在 review-runner.test.mjs 中增加聚合标注断言用例（并集去重、provider×角色标注、disputed/consensus 三态、一方提出一方沉默归为争议/单方事实口径）；显式断言同一 provider 的 red/blue 角色仍只算一个 provider，不改生产实现
- **精确文件**：`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/review-runner.test.mjs`; symbols/regions: 聚合标注相关 describe/it 用例块（仅新增用例）
- **输出**：RED 证据——目标断言以非零退出失败，落盘 `quality/tests/p2-disputed-red.log`
- **Knowledge**：clusterRecord L66-98、sameCluster L59-65（path+overlap≥0.7）、aggregateCanonicalProviderResults L100；争议标注落 provenance 层可选字段，reportable findings 语义不变；争议送用户过滤规则=方向级/影响验收→用户、实现级分歧→debate、实现级共识→主 agent 直接修复+登记
- **verification_role**：RED
- **paired_task**：T208
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-DISPUTED-01` — 聚合标注断言（并集/provider×角色/disputed/consensus/一提出一沉默）在当前实现下失败
- **evidence_path**：`quality/tests/p2-disputed-red.log`
- **STOP**：命令不可执行、需要改动测试文件以外文件或需要新设计时停止，回 plan.md Phase P2 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=撤销本卡新增用例
- **task risk**：错误 RED、三态矩阵用例不全（缺沉默方场景）或 provider identity 与 role 混计，导致争议判定覆盖不足
- **test tier / test method**：fullstack — backend-testing；聚合是多 provider 结果汇合的契约边界，争议标注改变下游 reportable findings 消费口径，须按聚合链路验证
- **scenarios / commands / expected exit / oracle**：成功场景（并集+标注）、争议场景（双方分歧记 disputed、双方共识记 consensus、一提出一沉默）；同命令 `npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs`，RED 预期非零，oracle 同 ORACLE-DISPUTED-01
- **fixtures_services**：fixture=红蓝双侧 findings 输入集（含重叠/分歧/沉默三态）；无外部服务；清理责任=测试内自清理
- **coverage limits**：本命令覆盖 review-runner 全文件用例；不覆盖 runner 调度（T201~T206）与合同文本

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 `review-runner.test.mjs` 增加同 finding 的 provider×role 并集、一角色提出另一角色沉默、consensus/disputed 断言。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs`；RED exit 1（`p2-disputed-red.log`），GREEN exit 0，19/19（`p2-disputed-green.log`）。
- **evidence_refs**：`quality/tests/p2-disputed-red.log`、`quality/tests/p2-disputed-green.log`、`quality/evidence/build-code/P2-phase-card.json`
- **covered_ac**：`AC-REV-005` 本地聚合 provenance 断言闭合；debate/用户过滤不是本 task 的已实现行为。
- **review_fact**：一次源码绑定 P2 review `unavailable`；不重复调用。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：RED 暴露原聚合丢角色事实；GREEN 保留 finding 并标注角色覆盖、共识和争议。

#### T208 — GREEN：clusterRecord 争议标注与聚合实现

- **ID**：T208
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：让 T207 的目标断言通过并保留负例（reportable findings 语义不变，标注仅在 provenance 层可选字段）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-005 → AC-REV-005
- **输入**：T207 的失败断言事实与 canonical-review-result.mjs L55-110 实现锚点
- **依赖**：T207
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-005
- **AC**：AC-REV-005
- **动作**：在 canonical-review-result.mjs 实现聚合扩展：红蓝 findings 并集+provider×角色标注，按共识∪分歧三态矩阵在 clusterRecord provenance 层写入 disputed/consensus 可选标注，最小实现
- **精确文件**：`runtime/review/canonical-review-result.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **boundary**：files: `runtime/review/canonical-review-result.mjs`; symbols/regions: clusterRecord(L66-98)、sameCluster(L59-65)、aggregateCanonicalProviderResults(L100) 聚合标注区域；测试文件仅允许修正 T207 新增用例断言笔误
- **输出**：GREEN——同命令退出 0，证据落盘 `quality/tests/p2-disputed-green.log`
- **Knowledge**：T207 产出的真实失败事实；聚合标注改变 reportable findings 语义即越界→回 spec.md FR-REV-005 口径
- **verification_role**：GREEN
- **paired_task**：T207
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-DISPUTED-01` — 聚合标注断言全部通过；负例（reportable findings 语义被改变）不存在
- **evidence_path**：`quality/tests/p2-disputed-green.log`
- **STOP**：需要弱化 T207 断言、扩大 boundary 或标注影响 reportable findings 语义时停止，回 spec.md FR-REV-005 口径
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡实现改动
- **task risk**：并集去重误判（sameCluster 阈值边界）或标注误写入必填路径破坏既有消费方
- **test tier / test method**：fullstack — backend-testing；聚合是多 provider 结果汇合的契约边界，须按聚合链路验证
- **scenarios / commands / expected exit / oracle**：与 T207 相同场景；同命令，GREEN 预期退出 0，oracle 同 ORACLE-DISPUTED-01
- **fixtures_services**：与 T207 相同 fixture；清理责任=测试内自清理
- **coverage limits**：本命令覆盖 review-runner 全文件用例；不覆盖 runner 调度与合同文本

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`canonical-review-result.mjs` 以完整 provider×role 输入聚合，输出 `roles`、`provider_roles`、`consensus`、`disputed`；`result.schema.json` 同步允许这些可选事实。
- **executed_commands**：review runner gate；exit 0，19/19。
- **evidence_refs**：`quality/tests/p2-disputed-red.log`、`quality/tests/p2-disputed-green.log`、`quality/evidence/build-code/P2-backend-testing.json`
- **covered_ac**：`AC-REV-005` 的本地 provider/role provenance 通过；完整用户决策分流仍非 P2 结论。
- **review_fact**：P2 源码绑定 review 为 `unavailable` timeout；保留该限制。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：同一 finding 的三条 provider×role 事实保留；一提出一沉默被标记 `disputed=true`，双 provider 形成 `consensus=true`。

#### T209 — RED：review-materials role 指令分支与 build-spec 专项断言

- **ID**：T209
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：新增指令生成目标断言（reviewInstructionsFor 仿 directionMode 分支按 role 生成红/蓝指令；build-spec 指令强化并含"AC 可判断性与验收盲区"专项），当前实现下断言失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-004 → AC-REV-004
- **输入**：accepted spec.md FR-REV-004/AC-REV-004 与 plan.md Phase P2 节；T208 完成事实；当前 main 基线的 review-materials.mjs stageReviewFocus(L958)/reviewInstructionsFor(L996)/directionMode 分支(L963/L966/L969)/build-spec 分支(L978-979)
- **依赖**：T208
- **并行**：否 — first RED for this behavior
- **FR**：FR-REV-004
- **AC**：AC-REV-004
- **动作**：在 review-materials-contract.test.mjs 中增加 role 指令分支与 build-spec 专项断言用例（role=red/blue 指令差异、build-spec 单次边界指令、专项指令存在），不改生产实现
- **精确文件**：`tests/contract/review-materials-contract.test.mjs`
- **boundary**：files: `tests/contract/review-materials-contract.test.mjs`; symbols/regions: role 指令与 build-spec 专项相关 describe/it 用例块（仅新增用例）
- **输出**：RED 证据——目标断言以非零退出失败，落盘 `quality/tests/p2-bsinstr-red.log`
- **Knowledge**：当前 main 基线的 directionMode 分支在 review-materials.mjs L963/L966/L969，build-spec 分支在 L978-979；红蓝仅适用 make-decision direction/detail 两面
- **verification_role**：RED
- **paired_task**：T210
- **gate_cmd**：`npx vitest run tests/contract/review-materials-contract.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-BSINSTR-01` — role 指令分支与 build-spec 专项断言在当前实现下失败
- **evidence_path**：`quality/tests/p2-bsinstr-red.log`
- **STOP**：命令不可执行、需要改动测试文件以外文件或需要新设计时停止，回 plan.md Phase P2 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=撤销本卡新增用例
- **task risk**：错误 RED 或断言只查字符串存在而未验证分支语义（纸面合规）
- **test tier / test method**：fullstack — backend-testing；指令文本是 runner 发给 provider 的协议/契约边界，须按合同测试链路验证
- **scenarios / commands / expected exit / oracle**：成功场景（role 分支指令生成、build-spec 专项存在）；同命令，RED 预期非零，oracle 同 ORACLE-BSINSTR-01
- **fixtures_services**：fixture=make-decision direction/detail 两面指令生成入参；无外部服务；N/A 清理
- **coverage limits**：本命令覆盖 review-materials-contract 全文件用例；不覆盖 runner 调度与聚合

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：增加 red/blue 指令差异、blue adversarial wording 和 build-spec 专项 lens 的契约断言。
- **executed_commands**：`npx vitest run tests/contract/review-materials-contract.test.mjs -t "paired make-decision roles"`；RED exit 1（`p2-bsinstr-red.log`），GREEN exit 0，1/1（`p2-bsinstr-green.log`）。
- **evidence_refs**：`quality/tests/p2-bsinstr-red.log`、`quality/tests/p2-bsinstr-green.log`、`quality/evidence/build-code/P2-test-routing.json`
- **covered_ac**：`AC-REV-004` 的指令存在性/分支断言闭合；真实 provider 输出仍 unavailable。
- **review_fact**：一次源码绑定 review timeout；没有重复审查。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：RED 命中 red/blue 指令相同缺口；GREEN 验证角色边界和 build-spec 验收盲区专项。

#### T210 — GREEN：reviewInstructionsFor 仿 directionMode 分支加 role+build-spec 指令强化与专项

- **ID**：T210
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：让 T209 的目标断言通过并保留负例（非 make-decision 阶段指令不含 role 分支）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-REV-004 → AC-REV-004
- **输入**：T209 的失败断言事实与当前 main 基线 review-materials.mjs L958-1037 实现锚点
- **依赖**：T209
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-004
- **AC**：AC-REV-004
- **动作**：在 review-materials.mjs 的 reviewInstructionsFor 仿当前 directionMode 分支（L963/L966/L969）增加 role 指令分支；build-spec 分支（L978-979）强化并加入"AC 可判断性与验收盲区"专项，最小实现
- **精确文件**：`skills/wh-review/scripts/review-materials.mjs`、`tests/contract/review-materials-contract.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-materials.mjs`; symbols/regions: stageReviewFocus(L958)、reviewInstructionsFor(L996)、directionMode 分支(L963/L966/L969)、build-spec 分支(L978-979)；测试文件仅允许修正 T209 新增用例断言笔误
- **输出**：GREEN——同命令退出 0，证据落盘 `quality/tests/p2-bsinstr-green.log`
- **Knowledge**：T209 产出的真实失败事实；指令强化不得引入 per-provider prompt 通道（PFACT-01）
- **verification_role**：GREEN
- **paired_task**：T209
- **gate_cmd**：`npx vitest run tests/contract/review-materials-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-BSINSTR-01` — role 指令分支与 build-spec 专项断言全部通过；负例（非 make-decision 阶段误加 role 分支）不存在
- **evidence_path**：`quality/tests/p2-bsinstr-green.log`
- **STOP**：需要弱化 T209 断言或扩大 boundary 时停止，回 plan.md Phase P2 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡实现改动
- **task risk**：指令文本改动与 T211 合同文本重述脱节（纸面合规风险前兆）
- **test tier / test method**：fullstack — backend-testing；指令文本是 runner→provider 协议/契约边界，须按合同测试链路验证
- **scenarios / commands / expected exit / oracle**：与 T209 相同场景；同命令，GREEN 预期退出 0，oracle 同 ORACLE-BSINSTR-01
- **fixtures_services**：与 T209 相同 fixture；N/A 清理
- **coverage limits**：本命令覆盖 review-materials-contract 全文件用例；不覆盖 runner 调度与聚合

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`review-materials.mjs` 增加 make-decision role 指令分支；build-spec 保持单次 request，并加入验收盲区、横向第三路、隐藏前提、防虚假共识、纵向否定四类 lens。
- **executed_commands**：同 T209 targeted gate exit 0，1/1；完整 contract gate 另行执行 39/39。
- **evidence_refs**：`quality/tests/p2-bsinstr-green.log`、`quality/evidence/build-code/P2-backend-testing.json`
- **covered_ac**：`AC-REV-004` 本地指令契约通过；provider 真实生成结果 unavailable。
- **review_fact**：P2-phase source review `unavailable`；不因本地绿而宣称 provider 通过。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：仅 make-decision direction/detail 使用 role 指令；build-spec 未扩成红蓝双发。

#### T211 — 合同成对：contracts/make-decision.md 重述红蓝契约+contracts/build-spec.md 单次边界与专项

- **ID**：T211
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：合同文本与已实现行为对齐：make-decision.md 重述"一个逻辑 review fact=红蓝两次组请求"，build-spec.md 写明单次边界+指令强化+"AC 可判断性与验收盲区"专项；三合同测试同步转绿且 skill-bundle.json sha256 同步
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-GOV-001/FR-GOV-002 → AC-GOV-001/AC-GOV-002；RISK-03
- **输入**：T202/T210 完成的红蓝调度与指令实现事实；contracts/make-decision.md 与 contracts/build-spec.md 当前文本
- **依赖**：T210
- **并行**：否 — 合同重述须与实现事实一致后再改
- **FR**：FR-GOV-001、FR-GOV-002（合同文本承接，plan 追溯表归属）
- **AC**：AC-GOV-001、AC-GOV-002（合同文本承接，plan 追溯表归属）
- **动作**：重述 contracts/make-decision.md 红蓝契约段落（红蓝两次组请求=同一逻辑 review fact、边界=仅 direction/detail 两面、其余阶段维持 single_round）；更新 contracts/build-spec.md 单次边界与专项段落；同步 skill-bundle.json 中两份合同的 sha256；运行三合同测试确认同步转绿；build-code 执行期对 AC-REV-004 与 FR-GOV-002 中无测试门的规则（①无争议直接修复登记、④debate 未决存疑清单入用户、⑤用户中止 talk 未答 user_deferred、⑥问答工具不可用降级文本卡）做真实 stage/host 运行观察并分别落盘 `quality/evidence/real-observation/ac-rev-004.json`、`quality/evidence/p2-rule-observations.md`
- **精确文件**：`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **boundary**：files: `skills/wh-review/contracts/make-decision.md`, `skills/wh-review/contracts/build-spec.md`, `skills/wh-review/skill-bundle.json`, `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`, `skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`, `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`; symbols/regions: 红蓝契约段落、build-spec 单次边界与专项段落、bundle files 条目 sha256 及三份配对断言；不得改 provider-protocol.md
- **输出**：合同文本与 bundle sha256 同步完成；三合同测试绿证据落盘 `quality/tests/p2-contracts-green.log`；AC-REV-004 与 FR-GOV-002 无测试门规则（①④⑤⑥）真实运行观察记录落盘 `quality/evidence/real-observation/ac-rev-004.json`、`quality/evidence/p2-rule-observations.md`
- **Knowledge**：合同真实路径=skills/wh-review/contracts/`{make-decision,build-spec}`.md；通用 skill-bundle.json 结构 `{schema_version:1,skill,files}`，当前 wh-review bundle 另含 `runtime_dependencies`，同步时不得删除；纸面合规（RISK-03）=合同与测试断言/AC-011 审计任一脱节
- **verification_role**：N/A — non-behavior change: 文本卡：合同/bundle 文本修改无独立行为断言，以既有三合同测试同步转绿作为可执行断言
- **paired_task**：N/A — 合同成对卡，与 T212 同步推进，无 RED/GREEN 对
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-CONTRACT-01` — 三合同测试全部通过，合同文本断言与 bundle sha256 一致
- **evidence_path**：`quality/tests/p2-contracts-green.log`
- **STOP**：合同文本与测试断言任一脱节（纸面合规，RISK-03）时停止，回 spec.md FR-GOV-001 核对；bundle sha256 无法对齐时停止
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡合同与 bundle 改动
- **task risk**：只改合同文本未同步 bundle sha256，或重述口径超出已实现行为（超前承诺）
- **test tier / test method**：fullstack — backend-testing；合同文本是技能对外的协议/契约边界，三合同测试覆盖合同↔断言一致性
- **scenarios / commands / expected exit / oracle**：状态场景=三合同测试全绿且 bundle sha256 同步；命令同上，预期退出 0，oracle 同 ORACLE-CONTRACT-01
- **fixtures_services**：fixture=合同测试既有解析用例（js-yaml）；无外部服务；N/A 清理
- **coverage limits**：本命令覆盖三份合同测试文件；不覆盖 runner/聚合行为（由 T201~T210 覆盖）与 AC-011 审计行（T212）；真实 stage/host 观察不由文本测试替代，缺失时保持 unavailable

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：同步 `make-decision.md` 红蓝两次组请求契约、`build-spec.md` 单次边界和四类专项；更新 `simple-contracts.test.mjs` 断言与 bundle hash；记录规则①④⑤⑥的真实观察边界。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；exit 0，45/45；bundle 28/28 hash 校验 exit 0。
- **evidence_refs**：`quality/tests/p2-contracts-green.log`、`quality/evidence/real-observation/p2-rule-observations.md`、`quality/evidence/build-code/P2-backend-testing.json`
- **covered_ac**：`AC-GOV-001` 本地合同/断言/bundle 一致性通过；`AC-GOV-002` 真实规则观察保持 partial/unavailable。
- **review_fact**：一次源码绑定 review timeout；摘要 packet 的不充分事实单独保留，未作为 clean review。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：规则①为 `not_applicable_to_P2`；④⑤⑥因后续阶段入口不存在记 `unavailable`，没有拿静态合同冒充 host 事实。

#### T212 — AC-011 审计成对：requirements-completeness-audit-acceptance.test.mjs L26 marker=single_round 语义行随合同红蓝重述同步改

- **ID**：T212
- **Phase**：Phase P2 — 红蓝双发审查
- **goal**：AC-011 审计行与合同红蓝重述同步：requirements-completeness-audit-acceptance.test.mjs L26 marker=single_round 语义行改为反映红蓝双发口径，审计测试转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：FR-GOV-001 → AC-GOV-001；AC-011；RISK-03
- **输入**：T211 完成的合同重述事实；requirements-completeness-audit-acceptance.test.mjs L26 当前 marker=single_round 语义行
- **依赖**：T211
- **并行**：否 — 审计行须随合同重述同步改
- **FR**：FR-GOV-001
- **AC**：AC-GOV-001
- **动作**：将 requirements-completeness-audit-acceptance.test.mjs L26 的 marker=single_round 语义行改为红蓝双发口径（与 T211 合同文本一致），运行审计测试确认转绿；不新增行为、不改生产实现
- **精确文件**：`tests/requirements-completeness-audit-acceptance.test.mjs`
- **boundary**：files: `tests/requirements-completeness-audit-acceptance.test.mjs`; symbols/regions: L26 marker=single_round 语义行（仅此行语义同步）
- **输出**：审计测试绿证据落盘 `quality/tests/p2-ac011-green.log`；合同↔断言↔审计三者一致核对记录
- **Knowledge**：AC-011 审计是纸面合规防线；合同↔断言↔审计三者一致为本 phase Done 条件之一
- **verification_role**：N/A — non-behavior change: 文本/审计同步卡：审计语义行修改无独立行为断言，以审计测试转绿作为可执行断言
- **paired_task**：N/A — 审计成对卡，与 T211 同步，无 RED/GREEN 对
- **gate_cmd**：`npx vitest run tests/requirements-completeness-audit-acceptance.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-AC011-01` — AC-011 审计测试通过，marker 语义行与合同红蓝重述口径一致
- **evidence_path**：`quality/tests/p2-ac011-green.log`
- **STOP**：审计行修改与合同文本口径不一致或审计测试出现其他真实失败时停止，回 spec.md FR-GOV-001 核对
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡审计行改动
- **task risk**：只改 marker 行未核对整体审计语义，留下隐性纸面合规
- **test tier / test method**：fullstack — backend-testing；AC-011 审计横跨合同与验收口径的契约边界，须按审计测试链路验证
- **scenarios / commands / expected exit / oracle**：状态场景=审计测试全绿且 marker 语义行与合同口径一致；命令同上，预期退出 0，oracle 同 ORACLE-AC011-01
- **fixtures_services**：fixture=审计测试既有输入；无外部服务；N/A 清理
- **coverage limits**：本命令覆盖 requirements-completeness-audit-acceptance 全文件用例；不覆盖合同测试（T211）与 runner 行为

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：将 AC-011 审计 marker 语义同步为 make-decision direction/detail 红蓝双发，同时保留非 make-decision `single_round` 路由断言。
- **executed_commands**：`npx vitest run tests/requirements-completeness-audit-acceptance.test.mjs`；exit 0，34/34。
- **evidence_refs**：`quality/tests/p2-ac011-green.log`、`quality/evidence/real-observation/p2-rule-observations.md`
- **covered_ac**：AC-011 审计同步本地通过；`AC-GOV-001` 相关语义未脱节。
- **review_fact**：复用同一次 P2 源码 review 事实 `unavailable`，未重复调用。
- **completed_at**：2026-09-05T23:39:51+0800
- **执行事实**：合同↔断言↔AC-011 marker 三者一致，审计 34/34 通过。

### Verify

- **Target**：FR-REV-001/002/003/004/005、FR-GOV-001/002 及 AC-REV-001/002/003/004/005、AC-GOV-001/002、AC-011 与跨任务 seam（runner 调度→pair 校验→降级标注→聚合标注→指令→合同→审计）
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`npx vitest run tests/contract/review-materials-contract.test.mjs`、`npx vitest run skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`npx vitest run tests/requirements-completeness-audit-acceptance.test.mjs`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p2-redblue-{red,green}.log`、`quality/tests/p2-pairmat-{red,green}.log`、`quality/tests/p2-incomplete-{red,green}.log`、`quality/tests/p2-disputed-{red,green}.log`、`quality/tests/p2-bsinstr-{red,green}.log`、`quality/tests/p2-contracts-green.log`、`quality/tests/p2-ac011-green.log`
- **Oracle**：ORACLE-REDBLUE-01（红蓝调度绿）、ORACLE-PAIRMAT-01（pair 校验绿）、ORACLE-INCOMPLETE-01（降级标注绿）、ORACLE-DISPUTED-01（聚合争议标注绿）、ORACLE-BSINSTR-01（指令分支与专项绿）、ORACLE-CONTRACT-01（三合同绿）、ORACLE-AC011-01（AC-011 审计绿）

### Knowledge

红蓝仅适用 make-decision direction/detail 两面，其余阶段维持 single_round（合同文本必须写明边界）；聚合输入=完成集（蓝队 partial 时 debate 输入=已完成集）；争议送用户过滤规则=方向级/影响验收→用户、实现级分歧→debate、实现级共识→主 agent 直接修复+登记；同一 pair 两次请求共享 material 语义身份是 P3 对话材料可信的前提。

### STOP

合同文本与测试断言/AC-011 审计任一脱节（纸面合规，RISK-03）→ 停止并回 `specs/workflowhub-requirement-convergence-depth-20260905/spec.md` FR-GOV-001 核对；聚合标注改变 reportable findings 语义 → 回 spec.md FR-REV-005 口径。

### Done

五条 gate_cmd 绿、RED/GREEN 证据成对；AC-REV-001/002/003/004/005 与 AC-GOV-001 可判通过；合同↔断言↔审计三者一致核对记录落盘；本 phase 一次异源审查完成并记录。

### Risks and rollback

- **Risk**：蓝队超时（RISK-01 实证 4/5 失败）导致审查深度打折但语义不破（affected IDs：FR-REV-001~005、FR-GOV-001）。
- **Prevention**：incomplete 标注+同编成重试 1 次+不延长超时窗。
- **Rollback / recovery**：`git revert` 本 phase 提交（schema 字段保留不影响，合同文本随 revert 回退）。

## Phase P3 — 争议对话闭环

### Goal

accepted_risk 经既有 confirm 语义扩展公共通道完成并绑定认证 receipt；needs_human 答复写回 user_decided（source=user_reply+evidence_ref=reply_ref）；Talk3 强绑定方向争议清单+debate 存疑项；Talk4 触发条件式（仅方向级/影响验收级争议）落地三件套；build-spec findings 处置对话=复用 spec-clarify（closure 仅文本、grill 独占不变）；三技能问答工具 IO 契约与降级文本成文；aggregate 动态轮数校验绿。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`tools/cli/stage-runtime.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/evidence/check-skill-closure.mjs`（仅文本）、`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`skills/talk-with-zhipeng/SKILL.md`、`skills/talk-with-zhipeng/skill-bundle.json`、`skills/grill-with-docs/SKILL.md`、`skills/grill-with-docs/skill-bundle.json`、`skills/spec-clarify/SKILL.md`、`skills/spec-clarify/skill-bundle.json`、`tests/stage-risk-acceptance.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/contract/make-decision-interaction-publication.test.mjs`、`tests/integration/distribution-closure.test.mjs`、`skills/grill-with-docs/SKILL.md`、`skills/grill-with-docs/skill-bundle.json`、`skills/spec-clarify/SKILL.md`、`skills/spec-clarify/skill-bundle.json`、`skills/talk-with-zhipeng/SKILL.md`、`skills/talk-with-zhipeng/skill-bundle.json`、`workflows/make-decision/SKILL.md`、`workflows/make-decision/skill-deps.yaml`、`workflows/make-decision/steps.json`
- **DO NOT TOUCH**：`runtime/evidence/check-skill-closure.mjs` L9 常量行、`runtime/stage/stage-content-contracts.mjs`（round_count 动态校验已存在 L1895-1900，Talk4 条件轮无需代码改动）、`runtime/schemas/decision-entry.v1.json`、`skills/wh-review/contracts/*.md`（P2 已定稿，本 phase 不重开）、公共行为清单（不新增第八类 behavior）

### Tasks

#### T301 — RED：accepted_risk 经 confirm 公共通道路由测试（无路由失败）

- **ID**：T301
- **Phase**：Phase P3 — 争议对话闭环
- **goal**：新增 accepted_risk 经既有 confirm 语义扩展公共通道完成并绑定认证 receipt 的目标断言，当前无路由实现下断言失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-003/R-004/R-005/R-015 → D-203 → FR-TALK-004 → AC-TALK-004
- **输入**：accepted spec.md FR-TALK-004/AC-TALK-004 与 plan.md Phase P3 节；既有 confirm 语义与 acceptReviewRisk 单点（stage-runtime/task-kernel 当前实现）
- **依赖**：T212（P2 末卡，P1+P2 完成后顺序进入 P3）
- **并行**：否 — first RED for this behavior
- **FR**：FR-TALK-004
- **AC**：AC-TALK-004
- **动作**：在 tests/stage-risk-acceptance.test.mjs 中增加目标断言用例（accepted_risk 经 confirm 公共通道路由、认证 receipt 绑定、无公共路由时 fail-loud），不改生产实现
- **精确文件**：`tests/stage-risk-acceptance.test.mjs`
- **boundary**：files: `tests/stage-risk-acceptance.test.mjs`; symbols/regions: accepted_risk confirm 路由相关 describe/it 用例块（仅新增用例，不改既有用例）
- **输出**：RED 证据——目标断言以非零退出失败，落盘 `quality/tests/p3-risk-red.log`
- **Knowledge**：confirm 语义扩展的边界=仅 accepted_risk 授权与既有确认语义，不得扩张为通用写回通道；不新增第八类公共 behavior；测试框架=vitest
- **verification_role**：RED
- **paired_task**：T302
- **gate_cmd**：`npx vitest run tests/stage-risk-acceptance.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-RISKCONFIRM-01` — accepted_risk confirm 路由与 receipt 绑定断言在当前实现下失败，输出含目标断言失败信号
- **evidence_path**：`quality/tests/p3-risk-red.log`
- **STOP**：命令不可执行、vitest 环境损坏、需要改动测试文件以外文件或需要新设计时停止，回 plan.md Phase P3 节与 spec.md FR-TALK-004、decision-log D-203
- **recovery**：负责人=本任务执行 agent；最小恢复动作=撤销本卡新增用例，保持既有用例原样
- **task risk**：错误 RED（断言写法本身错误导致失败而非行为缺口）或未覆盖 receipt 绑定 fail-loud 负例导致覆盖不足
- **test tier / test method**：fullstack — backend-testing；confirm 路由跨越 stage-runtime 公共接口与 task-kernel 的公共行为契约边界，须在真实 stage 链路上验证
- **scenarios / commands / expected exit / oracle**：成功场景（accepted_risk 经 confirm 路由完成并绑定认证 receipt）、失败场景（无路由/缺 receipt fail-loud）；同命令 `npx vitest run tests/stage-risk-acceptance.test.mjs`，RED 预期非零，oracle 同 ORACLE-RISKCONFIRM-01
- **fixtures_services**：fixture=accepted_risk 处置输入与认证 receipt 样例；无外部服务；清理责任=测试内临时目录自清理
- **coverage limits**：本命令覆盖 stage-risk-acceptance 全文件用例（含新增路由用例与既有回归）；不覆盖 needs_human 写回（T303/T304 共用本文件但按用例块划分）与 interaction 契约

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 accepted_risk 经既有 confirm 行为路由的 RED 用例与真实临时 task/review/reply fixture；未改生产实现。
- **executed_commands**：`npx vitest run tests/stage-risk-acceptance.test.mjs`（RED，exit_code=1）
- **evidence_refs**：`quality/tests/p3-risk-red.log`
- **covered_ac**：`AC-TALK-004`（confirm 路由缺口被真实失败锁定）
- **review_fact**：由 T302 paired GREEN 事实闭合；不重复 provider 审查。
- **completed_at**：`2026-09-05T23:54:22+08:00`
- **执行事实**：T301 RED 失败原因为现有 confirm 路由要求 `--reply-text`，未将 risk input dispatch 到 authenticated risk acceptance；失败输出已落盘。

#### T302 — GREEN：stage-runtime confirm 路由+task-kernel 接线（不新增公共 behavior 名）

- **ID**：T302
- **Phase**：Phase P3 — 争议对话闭环
- **goal**：让 T301 的目标断言通过并保留负例（缺 receipt 仍 fail-loud、不新增第八类公共 behavior）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-003/R-004/R-005/R-015 → D-203 → FR-TALK-004 → AC-TALK-004
- **输入**：T301 的失败断言事实与 tools/cli/stage-runtime.mjs、runtime/task/task-kernel-implementation.mjs 实现锚点
- **依赖**：T301
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-TALK-004
- **AC**：AC-TALK-004
- **动作**：在 stage-runtime 增加 accepted_risk 经既有 confirm 语义的路由（仅接 acceptReviewRisk 单点）并在 task-kernel 完成接线，满足目标行为的最小实现，不新增公共 behavior 名
- **精确文件**：`tools/cli/stage-runtime.mjs`、`runtime/task/task-kernel-implementation.mjs`、`tests/stage-risk-acceptance.test.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`, `runtime/task/task-kernel-implementation.mjs`; symbols/regions: confirm 路由分支与 acceptReviewRisk 接线点；测试文件仅允许修正 T301 新增用例断言笔误，不得弱化断言
- **输出**：GREEN——同命令退出 0，证据落盘 `quality/tests/p3-risk-green.log`
- **Knowledge**：T301 产出的真实失败事实；材料变更须重建确认（SCN-008）；路由仅接 acceptReviewRisk 单点，不得扩张为通用写回通道
- **verification_role**：GREEN
- **paired_task**：T301
- **gate_cmd**：`npx vitest run tests/stage-risk-acceptance.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-RISKCONFIRM-01` — 全部 confirm 路由断言通过且既有用例保持绿；负例（缺 receipt fail-loud）保持失败语义
- **evidence_path**：`quality/tests/p3-risk-green.log`
- **STOP**：需要弱化 T301 断言、扩大 boundary 到两份实现文件以外、或出现第八类公共 behavior/confirm 语义被滥用时停止，回 spec.md FR-TALK-004 与 decision-log D-203
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡实现改动，回到 T301 RED 状态
- **task risk**：路由实现扩张 confirm 语义（变成通用写回通道）或接线遗漏导致 receipt 绑定失效
- **test tier / test method**：fullstack — backend-testing；confirm 路由跨越 stage-runtime 公共接口与 task-kernel 的公共行为契约边界，须在真实 stage 链路上验证
- **scenarios / commands / expected exit / oracle**：与 T301 相同的成功/失败场景；同命令，GREEN 预期退出 0，oracle 同 ORACLE-RISKCONFIRM-01
- **fixtures_services**：与 T301 相同 fixture；清理责任=测试内临时目录自清理
- **coverage limits**：本命令覆盖 stage-risk-acceptance 全文件用例；不覆盖 needs_human 写回与 interaction 契约

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tools/cli/stage-runtime.mjs` 读取 confirm JSON risk input，严格白名单并映射到现有 `context.kernel.acceptReviewRisk`；未新增公共 behavior 名，未改 task-kernel 既有认证写入实现。
- **executed_commands**：`npx vitest run tests/stage-risk-acceptance.test.mjs`（GREEN，exit_code=0）
- **evidence_refs**：`quality/tests/p3-risk-green.log`
- **covered_ac**：`AC-TALK-004`
- **review_fact**：P3 独立 review 已记录于 `quality/reviews/results/P3-phase-review.json`，处置记录见 `quality/evidence/build-code/P3-review-dispositions.json`；不重复 P2 provider 审查。
- **completed_at**：`2026-09-05T23:55:09+08:00`
- **执行事实**：10/10 通过；成功路径经 `confirm:decision` 写出 content-addressed risk acceptance，并从 task store 回读确认 `finding_id`、`selected_option`、`reply_ref`、`reply_hash`；现有普通 confirm 分支保持不变。

#### T303 — RED：needs_human→user_decided 写回测试（source=user_reply+evidence_ref=reply_ref）

- **ID**：T303
- **Phase**：Phase P3 — 争议对话闭环
- **goal**：新增 needs_human 答复写回 user_decided 的目标断言（source=user_reply、evidence_ref=reply_ref、accepted_risk 缺 receipt fail-loud），当前实现下断言失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-003/R-004/R-005/R-015 → D-203 → FR-TALK-004 → AC-TALK-004
- **输入**：accepted spec.md FR-TALK-004/AC-TALK-004；runtime/review/stage-review-disposition.mjs 当前 needs_human 处置实现
- **依赖**：T302
- **并行**：否 — first RED for this behavior
- **FR**：FR-TALK-004
- **AC**：AC-TALK-004
- **动作**：在 tests/stage-risk-acceptance.test.mjs 中增加写回目标断言用例（needs_human→user_decided 状态写回、source=user_reply、evidence_ref=reply_ref、accepted_risk 缺 receipt fail-loud），不改生产实现
- **精确文件**：`tests/stage-risk-acceptance.test.mjs`
- **boundary**：files: `tests/stage-risk-acceptance.test.mjs`; symbols/regions: needs_human 写回相关 describe/it 用例块（仅新增用例，不改 T301/T302 用例与既有用例）
- **输出**：RED 证据——目标断言以非零退出失败，落盘 `quality/tests/p3-writeback-red.log`
- **Knowledge**：用户答复绑定 finding（答复引用进入处置证据、source=user_reply）；用户中止=已答保留+未答 user_deferred 进风险表（SCN-004）；测试框架=vitest
- **verification_role**：RED
- **paired_task**：T304
- **gate_cmd**：`npx vitest run tests/stage-risk-acceptance.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-WRITEBACK-01` — needs_human→user_decided 写回断言（source/evidence_ref/缺 receipt fail-loud）在当前实现下失败，输出含目标断言失败信号
- **evidence_path**：`quality/tests/p3-writeback-red.log`
- **STOP**：命令不可执行、需要改动测试文件以外文件或需要新设计时停止，回 plan.md Phase P3 节与 spec.md FR-TALK-004
- **recovery**：负责人=本任务执行 agent；最小恢复动作=撤销本卡新增用例
- **task risk**：错误 RED（断言写法错误）或未覆盖缺 receipt fail-loud 负例导致写回闭环不可信
- **test tier / test method**：fullstack — backend-testing；处置写回跨越 review-disposition 与 stage outcome 的公共行为契约边界，须在真实处置链路上验证
- **scenarios / commands / expected exit / oracle**：成功场景（答复写回 user_decided 且 source/evidence_ref 正确）、失败场景（accepted_risk 缺 receipt fail-loud）、状态场景（用户中止未答 user_deferred）；同命令 `npx vitest run tests/stage-risk-acceptance.test.mjs`，RED 预期非零，oracle 同 ORACLE-WRITEBACK-01
- **fixtures_services**：fixture=needs_human 处置输入、用户答复与 reply_ref 样例、缺 receipt 负例；无外部服务；清理责任=测试内临时目录自清理
- **coverage limits**：本命令覆盖 stage-risk-acceptance 全文件用例；不覆盖 confirm 路由（T301/T302 用例块）与 interaction 契约

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `user_decided` 写回结构断言与 accepted_risk 缺 receipt 负例；补齐 validator import，未改生产实现。
- **executed_commands**：`npx vitest run tests/stage-risk-acceptance.test.mjs`（RED，exit_code=1）
- **evidence_refs**：`quality/tests/p3-writeback-red.log`
- **covered_ac**：`AC-TALK-004`（source/evidence_ref 写回缺口被真实失败锁定）
- **review_fact**：由 T304 paired GREEN 事实闭合；不重复 provider 审查。
- **completed_at**：`2026-09-05T23:57:57+08:00`
- **执行事实**：当前 validator 对 `user_decided` 报 status invalid；accepted_risk 无 receipt 仍返回 incomplete，未被错误放行。

#### T304 — GREEN：stage-review-disposition 写回实现（accepted_risk 缺 receipt fail-loud）

- **ID**：T304
- **Phase**：Phase P3 — 争议对话闭环
- **goal**：让 T303 的目标断言通过并保留负例（accepted_risk 缺 receipt 仍 fail-loud）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-003/R-004/R-005/R-015 → D-203 → FR-TALK-004 → AC-TALK-004
- **输入**：T303 的失败断言事实与 runtime/review/stage-review-disposition.mjs 实现锚点
- **依赖**：T303
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-TALK-004
- **AC**：AC-TALK-004
- **动作**：在 stage-review-disposition 实现 needs_human→user_decided 写回（source=user_reply、evidence_ref=reply_ref、accepted_risk 缺 receipt fail-loud），最小实现
- **精确文件**：`runtime/review/stage-review-disposition.mjs`、`tests/stage-risk-acceptance.test.mjs`
- **boundary**：files: `runtime/review/stage-review-disposition.mjs`; symbols/regions: needs_human 处置写回分支；测试文件仅允许修正 T303 新增用例断言笔误，不得弱化断言
- **输出**：GREEN——同命令退出 0，证据落盘 `quality/tests/p3-writeback-green.log`
- **Knowledge**：T303 产出的真实失败事实；写回闭环与 receipt 绑定结构检查为本 phase Done 条件之一；用户中止=已答保留+未答 user_deferred 进风险表（SCN-004）
- **verification_role**：GREEN
- **paired_task**：T303
- **gate_cmd**：`npx vitest run tests/stage-risk-acceptance.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-WRITEBACK-01` — 全部写回断言通过且 T301/T302 用例与既有用例保持绿；缺 receipt 负例保持 fail-loud
- **evidence_path**：`quality/tests/p3-writeback-green.log`
- **STOP**：需要弱化 T303 断言、扩大 boundary 到 stage-review-disposition 以外或需要新设计时停止，回 spec.md FR-TALK-004 与 decision-log D-203
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡实现改动
- **task risk**：写回字段（source/evidence_ref）口径偏差或把缺 receipt 写成静默降级（掩盖失败）
- **test tier / test method**：fullstack — backend-testing；处置写回跨越 review-disposition 与 stage outcome 的公共行为契约边界，须在真实处置链路上验证
- **scenarios / commands / expected exit / oracle**：与 T303 相同场景；同命令，GREEN 预期退出 0，oracle 同 ORACLE-WRITEBACK-01
- **fixtures_services**：与 T303 相同 fixture；清理责任=测试内临时目录自清理
- **coverage limits**：本命令覆盖 stage-risk-acceptance 全文件用例；不覆盖 interaction 契约与 closure 文本

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/review/stage-review-disposition.mjs` 增加 `user_decided` 状态，并强制该状态使用 `source=user_reply`；accepted_risk 无认证 receipt 的既有 fail-closed 逻辑保留。
- **executed_commands**：`npx vitest run tests/stage-risk-acceptance.test.mjs`（初次 GREEN，exit_code=0；复核修复后同命令 15/15，exit_code=0）
- **evidence_refs**：`quality/tests/p3-writeback-green.log`、`quality/tests/p3-post-review-repair-green.log`
- **covered_ac**：`AC-TALK-004`
- **review_fact**：P3 独立 review 已记录；本卡后续修复事实见 `quality/tests/p3-post-review-repair-green.log`，不重复 P2 provider 审查。
- **completed_at**：`2026-09-05T23:58:29+08:00`
- **执行事实**：初次 12/12，复核修复后 15/15；`user_decided` 只能由绑定答复从 `needs_human` 写回，保留 `evidence_ref=reply_ref` 并要求 `source=user_reply`；accepted_risk 缺 receipt 明确返回 incomplete；显式 malformed `findings` fail-loud。

#### T305 — make-decision 三件套：Talk3 强绑定争议清单+Talk4 触发条件式+aggregate 动态轮数口径对齐

- **ID**：T305
- **Phase**：Phase P3 — 争议对话闭环
- **goal**：make-decision 三件套（SKILL.md/steps.json/skill-deps.yaml）落地 Talk3 强绑定方向争议清单+debate 存疑项、Talk4 触发条件式（仅方向级/影响验收级争议）、aggregate 动态轮数口径对齐，interaction 两测试转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-003/R-008 → D-201 → FR-TALK-001 → AC-TALK-001；R-004 → D-201 → FR-TALK-002 → AC-TALK-002
- **输入**：accepted spec.md FR-TALK-001/FR-TALK-002 与 AC-TALK-001/AC-TALK-002；workflows/make-decision 三件套当前文本；interaction 两测试当前口径
- **依赖**：T304
- **并行**：否 — 三件套文本须与已实现的写回/路由事实一致后再改
- **FR**：FR-TALK-001、FR-TALK-002
- **AC**：AC-TALK-001、AC-TALK-002
- **动作**：改写 workflows/make-decision/SKILL.md Talk3 节（材料显式包含方向面红蓝 findings 争议清单+debate 裁决书存疑项，问答工具批次呈现）与 Talk4 节（触发条件=仅方向级/影响验收级争议、无争议不发起、主 agent 直接修复并登记）；steps.json 同步轮次结构；aggregate 动态轮数口径对齐（round_count 按实际轮数动态校验，无争议可为 3、有争议≥4，不升 v2）；skill-deps.yaml 同步
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`
- **boundary**：files: `workflows/make-decision/SKILL.md`, `workflows/make-decision/steps.json`, `workflows/make-decision/skill-deps.yaml`; symbols/regions: Talk3/Talk4 节、轮次结构与 aggregate 动态轮数口径、deps 同步条目；interaction aggregate 不升 v2
- **输出**：三件套文本完成；interaction 两测试绿证据落盘 `quality/tests/p3-agground-green.log`
- **Knowledge**：round_count 动态校验以已落盘 round_count=5 事实为准；无争议时主 agent 直接修复并登记（与 FR-GOV-002 规则①一致）；interaction aggregate 不升 v2（T-023 定案口径）
- **verification_role**：N/A — non-behavior change: 文本卡：技能三件套文本修改无独立行为断言，以 interaction 两测试同步转绿作为可执行断言
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`npx vitest run tests/stage-interaction-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-AGGROUND-01` — interaction 两测试全部通过，aggregate 动态轮数校验与三件套文本口径一致
- **evidence_path**：`quality/tests/p3-agground-green.log`
- **STOP**：aggregate 被升 v2 或三件套文本与测试断言脱节时停止，回 spec.md FR-TALK-001/FR-TALK-002 核对
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡三件套改动
- **task risk**：Talk4 触发条件写得过宽（非方向级争议也发起对话）或动态轮数口径与已落盘事实不符
- **test tier / test method**：fullstack — backend-testing；interaction 契约是 make-decision 对外交互发布的协议边界，两测试覆盖文本↔断言一致性
- **scenarios / commands / expected exit / oracle**：状态场景=interaction 两测试全绿且动态轮数口径一致；命令同上，预期退出 0，oracle 同 ORACLE-AGGROUND-01
- **fixtures_services**：fixture=interaction 测试既有输入；无外部服务；N/A 清理
- **coverage limits**：本命令覆盖两份 interaction 测试文件；不覆盖 confirm 路由/写回（T301~T304）与 closure 文本（T307）

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`workflows/make-decision/SKILL.md`、`steps.json`、`skill-deps.yaml` 明确 Talk3 输入绑定红蓝方向 findings 争议清单与 debate 存疑项；Talk4 仅在方向级/影响验收级争议触发，无争议时主 agent 直接修复并登记；aggregate `round_count` 按实际 3/4 轮。
- **executed_commands**：`npx vitest run tests/stage-interaction-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs`（初次 34/34，exit_code=0；复核修复后 36/36，exit_code=0）
- **evidence_refs**：`quality/tests/p3-agground-green.log`、`quality/tests/p3-post-review-repair-green.log`
- **covered_ac**：`AC-TALK-001`、`AC-TALK-002`
- **review_fact**：P3 独立 review 已记录；本卡后续修复事实见 `quality/tests/p3-post-review-repair-green.log`，不重复 P2 provider 审查。
- **completed_at**：`2026-09-06T00:03:41+08:00`
- **执行事实**：初次 34/34，复核修复后 36/36；未新增 step、schema 或公共 behavior，interaction aggregate 继续使用 v1。

#### T306 — workflows/build-spec/SKILL.md 分工段：findings 处置对话=复用 spec-clarify vs Talk/Grill 独占

- **ID**：T306
- **Phase**：Phase P3 — 争议对话闭环
- **goal**：build-spec/SKILL.md 增加分工段：争议 findings 处置对话=复用 spec-clarify，talk-with-zhipeng 不进 build-spec 声明、技能闭包维持 grill 独占
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-005/R-009/R-015 → D-202（经 T-023 收窄）→ FR-TALK-003 → AC-TALK-003
- **输入**：accepted spec.md FR-TALK-003/AC-TALK-003；workflows/build-spec/SKILL.md 当前文本
- **依赖**：T305
- **并行**：否 — 顺序推进，避免与 T305 的 make-decision 改动口径脱节
- **FR**：FR-TALK-003
- **AC**：AC-TALK-003
- **动作**：在 workflows/build-spec/SKILL.md 增加分工段（findings 处置对话=复用 spec-clarify、对话生命周期沿用既有 stage outcome 侧校验与交互 receipt、不新增技能、grill 独占边界声明），不新增行为
- **精确文件**：`workflows/build-spec/SKILL.md`
- **boundary**：files: `workflows/build-spec/SKILL.md`; symbols/regions: findings 处置对话分工段（仅新增该段，不改既有段落）
- **输出**：分工段成文；断言证据落盘 `quality/tests/p3-bsfinding-green.log`
- **Knowledge**：closure 仅文本调整、grill 独占不变（T-023 定案口径）；interaction aggregate 不升 v2
- **verification_role**：N/A — non-behavior change: 文本卡：分工段为文本约束无独立行为断言，以可执行 grep 断言确认成文
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`bash -c "grep -q 'findings 处置对话' workflows/build-spec/SKILL.md && grep -q '复用 spec-clarify' workflows/build-spec/SKILL.md && grep -q 'grill 独占' workflows/build-spec/SKILL.md && echo PASS"`
- **expected_exit**：0
- **oracle**：`ORACLE-BSFINDING-01` — build-spec/SKILL.md 含"findings 处置对话=复用 spec-clarify"与 grill 独占分工的特征短语成文，断言输出 PASS
- **evidence_path**：`quality/tests/p3-bsfinding-green.log`
- **STOP**：grill 独占边界被破坏或分工段写成新增技能/新增 gate 时停止，回 spec.md FR-TALK-003（T-023 定案口径）
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡文本改动
- **task risk**：分工段措辞含糊导致 spec-clarify 与 Talk/Grill 消费场景混淆
- **test tier / test method**：fullstack — backend-testing；分工段是 build-spec 对技能闭包契约的文本边界，须与 closure 测试口径联动核对
- **scenarios / commands / expected exit / oracle**：状态场景=分工段成文且 grep 断言 PASS；命令同上，预期退出 0，oracle 同 ORACLE-BSFINDING-01
- **fixtures_services**：N/A — 纯文本断言，无 fixture 与外部服务
- **coverage limits**：本命令仅断言分工段关键表述成文；closure/provenance 测试联动由 T307 覆盖

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`workflows/build-spec/SKILL.md` 增加 findings 处置对话分工：复用 spec-clarify、沿用 stage outcome/interaction receipt，保持 talk-with-zhipeng 不进入 build-spec、grill 独占。
- **executed_commands**：`bash -c "grep -q 'findings 处置对话' workflows/build-spec/SKILL.md && grep -q '复用 spec-clarify' workflows/build-spec/SKILL.md && grep -q 'grill 独占' workflows/build-spec/SKILL.md && echo PASS"`（exit_code=0）
- **evidence_refs**：`quality/tests/p3-bsfinding-green.log`
- **covered_ac**：`AC-TALK-003`
- **review_fact**：P3 独立 review 已记录于 `quality/reviews/results/P3-phase-review.json`，处置记录见 `quality/evidence/build-code/P3-review-dispositions.json`；不重复 P2 provider 审查。
- **completed_at**：`2026-09-06T00:06:26+08:00`
- **执行事实**：grep 输出 PASS；仅增加文本分工，不新增技能、状态机或 gate。

#### T307 — check-skill-closure 契约文本调整（L9 常量不动）+closure/provenance 受影响测试同步转绿

- **ID**：T307
- **Phase**：Phase P3 — 争议对话闭环
- **goal**：check-skill-closure.mjs 契约文本调整（仅限文本、L9 常量行不动），closure/provenance 受影响测试同步转绿
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-005/R-009/R-015 → D-202（经 T-023 收窄）→ FR-TALK-003 → AC-TALK-003
- **输入**：T306 完成的分工段事实；runtime/evidence/check-skill-closure.mjs 当前文本；tests/integration/distribution-closure.test.mjs 当前口径
- **依赖**：T306
- **并行**：否 — closure 文本须与分工段口径一致后再改
- **FR**：FR-TALK-003
- **AC**：AC-TALK-003
- **动作**：调整 runtime/evidence/check-skill-closure.mjs 契约文本（仅限文本注释/契约表述，L9 常量行不动、不改校验逻辑）；同步 distribution-closure、stage-interaction-contract、make-decision-interaction-publication 三份受影响测试口径并确认转绿
- **精确文件**：`runtime/evidence/check-skill-closure.mjs`、`tests/integration/distribution-closure.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/contract/make-decision-interaction-publication.test.mjs`
- **boundary**：files: `runtime/evidence/check-skill-closure.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/stage-interaction-contract.test.mjs`, `tests/contract/make-decision-interaction-publication.test.mjs`; symbols/regions: 契约文本注释区（L9 常量行禁止改动）与三份测试的既有 closure/provenance 断言块；测试仅做口径同步，不得弱化断言
- **输出**：closure 测试绿证据落盘 `quality/tests/p3-closure-green.log`；L9 常量未变 grep 断言记录
- **Knowledge**：DO NOT TOUCH=check-skill-closure.mjs L9 常量行；技能闭包维持 grill 独占（其他调整仅限契约文本）
- **verification_role**：N/A — non-behavior change: 文本/口径同步卡：契约文本调整无新行为断言，以 closure 测试转绿+L9 常量未变 grep 断言作为可执行断言
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`npx vitest run tests/integration/distribution-closure.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-CLOSURE-01` — distribution-closure 测试全部通过，含 L9 常量未变 grep 断言成立
- **evidence_path**：`quality/tests/p3-closure-green.log`
- **STOP**：需要改动 L9 常量行或校验逻辑（超出文本范围）时停止，回 spec.md FR-TALK-003 与 plan.md Phase P3 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡文本与测试口径改动
- **task risk**：以口径同步为名弱化 closure 断言，掩盖真实闭包破坏
- **test tier / test method**：fullstack — backend-testing；技能闭包是 distribution 链路的契约边界，须按集成测试链路验证
- **scenarios / commands / expected exit / oracle**：状态场景=closure 测试全绿且 L9 常量未变；命令同上，预期退出 0，oracle 同 ORACLE-CLOSURE-01
- **fixtures_services**：fixture=closure 测试既有技能包样例；无外部服务；清理责任=测试内自清理
- **coverage limits**：本命令覆盖 distribution-closure 全文件用例；不覆盖 interaction 契约（T305）与问答 IO 文本（T308）

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/evidence/check-skill-closure.mjs` 契约注释与三份 closure/provenance 测试口径同步；修复测试文件读取导入；同步继承的 `skills/catalog.yaml` wh-review `local_bundle_hash`，L9 常量未改。
- **executed_commands**：`npx vitest run tests/integration/distribution-closure.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs`（exit_code=0）
- **evidence_refs**：`quality/tests/p3-closure-green.log`
- **covered_ac**：`AC-TALK-003`
- **review_fact**：P3 独立 review 已记录于 `quality/reviews/results/P3-phase-review.json`，处置记录见 `quality/evidence/build-code/P3-review-dispositions.json`；不重复 P2 provider 审查。
- **completed_at**：`2026-09-06T00:16:20+08:00`
- **执行事实**：3 个测试文件 42/42 通过；distribution closure 通过；L9 `MAKE_DECISION_ONLY_SKILLS` 常量保持不变。

#### T308 — 三技能问答工具化文本（IO 契约+降级文本卡）+三 bundle 同步

- **ID**：T308
- **Phase**：Phase P3 — 争议对话闭环
- **goal**：talk-with-zhipeng/grill-with-docs/spec-clarify 三技能 SKILL.md 成文问答工具 IO 契约（入 question_id/axis/options≤3/recommended；出 answers+reply_ref/reply_hash；无工具降级文本卡并记录）+三 skill-bundle.json 同步
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-015 → D-204 → FR-TALK-005 → AC-TALK-005
- **输入**：accepted spec.md FR-TALK-005/AC-TALK-005；三技能 SKILL.md 与 skill-bundle.json 当前文本
- **依赖**：T307
- **并行**：否 — 顺序推进，IO 契约须与 T305/T306 对话口径一致
- **FR**：FR-TALK-005
- **AC**：AC-TALK-005
- **动作**：在三技能 SKILL.md 成文问答工具 IO 契约段落（入参=question_id/axis/options（≤3，含后果与风险）/recommended；出参=answers（option_id 或 free_text）+reply_ref/reply_hash（宿主认证）；宿主无问答工具时降级为文本卡并如实记录工具降级事实；选项用大白话说明后果与风险）；同步三 skill-bundle.json 的 files 条目 sha256
- **精确文件**：`skills/talk-with-zhipeng/SKILL.md`、`skills/talk-with-zhipeng/skill-bundle.json`、`skills/grill-with-docs/SKILL.md`、`skills/grill-with-docs/skill-bundle.json`、`skills/spec-clarify/SKILL.md`、`skills/spec-clarify/skill-bundle.json`
- **boundary**：files: `skills/talk-with-zhipeng/SKILL.md`, `skills/talk-with-zhipeng/skill-bundle.json`, `skills/grill-with-docs/SKILL.md`, `skills/grill-with-docs/skill-bundle.json`, `skills/spec-clarify/SKILL.md`, `skills/spec-clarify/skill-bundle.json`; symbols/regions: 问答工具 IO 契约与降级段落、bundle files 条目 sha256
- **输出**：三技能 IO 契约成文且 bundle 同步；断言证据落盘 `quality/tests/p3-talkio-green.log`
- **Knowledge**：IO 契约字段名固定为 question_id/axis/options/recommended/answers/reply_ref/reply_hash；降级事实必须如实记录，不得伪造工具调用
- **verification_role**：N/A — non-behavior change: 文本卡：技能文本与 bundle 同步无独立行为断言，以 plan 指定的可执行 grep 断言命令确认成文
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`bash -c "grep -q 'question_id' skills/talk-with-zhipeng/SKILL.md && grep -q 'reply_ref' skills/grill-with-docs/SKILL.md && grep -q 'reply_hash' skills/spec-clarify/SKILL.md && echo PASS"`
- **expected_exit**：0
- **oracle**：`ORACLE-TALKIO-01` — 三技能 SKILL.md 含问答 IO 契约关键字段表述（question_id/reply_ref/reply_hash），断言输出 PASS 且三 bundle sha256 同步
- **evidence_path**：`quality/tests/p3-talkio-green.log`
- **STOP**：IO 契约字段口径与 spec.md FR-TALK-005 不一致或 bundle sha256 无法对齐时停止，回 spec.md FR-TALK-005 核对
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡文本与 bundle 改动
- **task risk**：只改 SKILL.md 未同步 bundle sha256，或降级记录义务漏写导致工具缺席时静默
- **test tier / test method**：fullstack — backend-testing；问答 IO 契约是三技能对宿主交互的协议边界，须与 bundle 登记联动核对
- **scenarios / commands / expected exit / oracle**：状态场景=三技能 IO 契约成文且 grep 断言 PASS；命令同上，预期退出 0，oracle 同 ORACLE-TALKIO-01
- **fixtures_services**：N/A — 纯文本断言，无 fixture 与外部服务
- **coverage limits**：本命令仅断言三技能 IO 契约关键字段成文；bundle sha256 一致性以执行事实记录核对，不覆盖运行时问答工具真实调用（AC-TALK-005 运行观察待真实运行证据）

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：三份技能文档新增统一问答工具 IO 与无工具文本卡降级契约；三份 skill bundle 的 `SKILL.md` sha256 已同步，catalog bundle hash 亦同步。
- **executed_commands**：`bash -c "grep -q 'question_id' skills/talk-with-zhipeng/SKILL.md && grep -q 'reply_ref' skills/grill-with-docs/SKILL.md && grep -q 'reply_hash' skills/spec-clarify/SKILL.md && echo PASS"`（exit_code=0）
- **evidence_refs**：`quality/tests/p3-talkio-green.log`
- **covered_ac**：`AC-TALK-005`
- **review_fact**：P3 独立 review 已记录于 `quality/reviews/results/P3-phase-review.json`，处置记录见 `quality/evidence/build-code/P3-review-dispositions.json`；AC-TALK-005 运行观察仍保留为 acceptance 未完成事实。
- **completed_at**：`2026-09-06T00:18:05+08:00`
- **执行事实**：IO 关键字段 grep PASS；三 skill bundle 验证通过，resolved bundle hashes 已写入 catalog。

### Verify

- **Target**：FR-TALK-001~005 及 AC-TALK-001~005 与跨任务 seam（confirm 路由→写回→三件套→分工段→closure 文本→IO 契约）
- **gate_cmd**：`npx vitest run tests/stage-risk-acceptance.test.mjs`、`npx vitest run tests/stage-interaction-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs`、`npx vitest run tests/integration/distribution-closure.test.mjs`、`grep -q 'question_id' skills/talk-with-zhipeng/SKILL.md && grep -q 'reply_ref' skills/grill-with-docs/SKILL.md && grep -q 'reply_hash' skills/spec-clarify/SKILL.md && echo PASS`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p3-*-{red,green}.log`、`quality/tests/p3-post-review-repair-green.log`、`quality/reviews/results/P3-phase-review.json`、`quality/evidence/build-code/P3-review-dispositions.json`
- **Oracle**：ORACLE-RISKCONFIRM-01（confirm 路由绿）、ORACLE-WRITEBACK-01（写回绿）、ORACLE-AGGROUND-01（interaction 两测试绿）、ORACLE-CLOSURE-01（closure 绿，含 L9 常量未变 grep 断言）、ORACLE-TALKIO-01（IO 契约断言 PASS）

### Knowledge

confirm 语义扩展的边界=仅 accepted_risk 授权与既有确认语义，不得扩张为通用写回通道；治理登记（owner=build-spec 及相关 stage；consumer=处置校验 receipt 绑定检查；删除条件=风险接收机制被替代）在 P8/T803 落 AGENTS.md；build-spec 对话生命周期=沿用既有 stage outcome 侧校验与交互 receipt、aggregate 不升 v2；用户中止=已答保留+未答 user_deferred 进风险表（SCN-004）。

### STOP

公共行为面被扩张（出现第八类 behavior 或 confirm 语义被滥用）→ 回 `specs/workflowhub-requirement-convergence-depth-20260905/spec.md` FR-TALK-004 与 decision-log D-203；grill 独占边界被破坏或 aggregate 被升 v2 → 回 spec.md FR-TALK-003（T-023 定案口径）。

### Done

四条 gate_cmd 绿、RED/GREEN 证据成对；P3 一次异源审查已完成并逐条处置；AC-TALK-001~005 中 003/004 可判通过（001/002/005 待真实运行观察证据）；写回闭环与 receipt 绑定结构检查通过。阶段复盘输入已准备，但固定 `build-code` 复盘记录不可覆盖，公共入口返回 EEXIST，事实见 `quality/evidence/build-code/P3-reflection-route.log`；未重复 P2 审查。

### Risks and rollback

- **Risk**：affected IDs：FR-TALK-001~005；trigger=confirm 路由与既有确认流程冲突；consequence=确认 receipt 绑定失效。
- **Prevention**：mitigation=路由仅接 acceptReviewRisk 单点+材料变更重建确认（SCN-008）。
- **Rollback / recovery**：`git revert` 本 phase 提交（kernel 接线为增量代码，revert 后 acceptReviewRisk 回到无公共路由的既有事实状态）。

## Phase P4 — debate v2（宿主中立重写）

### Goal

skills/debate 去除 Claude teammate 依赖，重写为 4 独立上下文子代理（甲/乙/丙/丁）+文件 mailbox（单消息单文件 JSON：from/to/round/seq/body|body_ref/ts）+主代理法官禁言+2 轮封顶+共享 FS 前提+降级路径记录；references 四件套落入反偏见硬约束（匿名化/交换顺序/rubric/预算声明/保留分歧）与裁决分级（方向级→用户；实现级→辩论角色按 rubric 出建议+独立复核子代理复核、主代理只登记；评委不是第 5 角色）；bundle/catalog/inventory 同步。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`skills/debate/SKILL.md`、`skills/debate/references/role-spawn-templates.md`、`skills/debate/references/arbitration-protocol.md`、`skills/debate/references/output-template.md`、`skills/debate/references/anti-bias-guardrails.md`、`skills/debate/skill-bundle.json`、`skills/debate/__tests__/skill-contract.test.mjs`、`skills/catalog.yaml`（debate 条目）、`docs/architecture/repository-inventory.tsv`（同步行）、`skills/debate/references/anti-bias-guardrails.md`、`skills/debate/references/arbitration-protocol.md`、`skills/debate/references/output-template.md`、`skills/debate/references/role-spawn-templates.md`
- **DO NOT TOUCH**：`skills/debate/pk-rules.ts`、`skills/debate/pk-rules.test.ts`、`skills/debate/LICENSE`、`skills/debate/examples/`（本 phase 不重开）；任何运行时代码（debate 为纯技能层）

### Tasks

#### T401 — RED：skill-contract 测试新断言（无 teammate 措辞、4 子代理+mailbox+法官禁言+2 轮封顶+降级路径）

- **ID**：T401
- **Phase**：Phase P4 — debate v2（宿主中立重写）
- **goal**：在 skill-contract 测试中新增宿主中立目标断言（无 teammate 措辞、4 独立上下文子代理+文件 mailbox+主代理法官禁言+2 轮封顶+降级路径记录），当前文本下断言失败
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-006/R-007/R-008 → D-301 → FR-DEB-001 → AC-DEB-001；R-006 → D-302 → FR-DEB-002 → AC-DEB-002；R-003/R-004/R-005/R-006 → D-303 → FR-DEB-003 → AC-DEB-003；RISK-05
- **输入**：accepted spec.md FR-DEB-001/002/003 与 AC-DEB-001/002/003；skills/debate/SKILL.md 当前 Claude teammate 依赖文本
- **依赖**：none — P4 与 P3 并行：本 phase 全部修改文件位于 skills/debate/、skills/catalog.yaml debate 条目与 repository-inventory.tsv 同步行，与 P3 修改文件集无交集（plan 依赖设计=P3∥P4）
- **并行**：是 — 与 P3 并行（独立文件集）；本卡为 P4 first RED
- **FR**：FR-DEB-001、FR-DEB-002、FR-DEB-003
- **AC**：AC-DEB-001、AC-DEB-002、AC-DEB-003
- **动作**：在 skills/debate/__tests__/skill-contract.test.mjs 中新增目标断言用例（SKILL.md 无 teammate 措辞、含 4 子代理/mailbox/法官禁言/2 轮封顶/降级路径表述），不改技能文本
- **精确文件**：`skills/debate/__tests__/skill-contract.test.mjs`
- **boundary**：files: `skills/debate/__tests__/skill-contract.test.mjs`; symbols/regions: 宿主中立契约相关 describe/it 用例块（仅新增用例，不改既有用例）
- **输出**：RED 证据——目标断言以非零退出失败，落盘 `quality/tests/p4-debate-red.log`
- **Knowledge**：当前 SKILL.md 依赖 Claude teammate（L43/L55-61/L204-210 为改写锚点）；测试框架=vitest；debate 为纯技能层，不改运行时代码
- **verification_role**：RED
- **paired_task**：T402
- **gate_cmd**：`npx vitest run skills/debate/__tests__/skill-contract.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-DEBATE-01` — 宿主中立断言（无 teammate/4 子代理/mailbox/法官禁言/2 轮封顶/降级路径）在当前文本下失败，输出含目标断言失败信号
- **evidence_path**：`quality/tests/p4-debate-red.log`
- **STOP**：命令不可执行、需要改动测试文件以外文件或需要新设计时停止，回 plan.md Phase P4 节与 spec.md FR-DEB-001
- **recovery**：负责人=本任务执行 agent；最小恢复动作=撤销本卡新增用例
- **task risk**：错误 RED（断言写法错误）或断言措辞过宽（重写后仍含隐性宿主依赖也能通过）
- **test tier / test method**：simple — backend-testing；纯技能文本契约断言，单文件 vitest 契约测试，无服务与复杂 fixture 依赖
- **scenarios / commands / expected exit / oracle**：成功场景（重写后断言通过）、失败场景（teammate 措辞残留/缺 mailbox 或降级表述）；同命令 `npx vitest run skills/debate/__tests__/skill-contract.test.mjs`，RED 预期非零，oracle 同 ORACLE-DEBATE-01
- **fixtures_services**：fixture=SKILL.md 文本读取；无外部服务；N/A 清理
- **coverage limits**：本命令覆盖 skill-contract 全文件用例；不覆盖 mailbox 格式契约段落登记（T403）与 pk-rules（DO NOT TOUCH）

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增宿主中立目标断言；未改 SKILL.md 以制造 RED。
- **executed_commands**：`npx vitest run skills/debate/__tests__/skill-contract.test.mjs` → exit 1，5 passed / 1 failed（预期 RED）。
- **evidence_refs**：`quality/tests/p4-debate-red.log`
- **covered_ac**：`AC-DEB-001`、`AC-DEB-002`、`AC-DEB-003`（RED 基线）
- **review_fact**：与 T402 配对的 RED/GREEN 事实已完成；不单独重复审查。
- **completed_at**：2026-09-06
- **执行事实**：目标断言在旧文本下按预期失败，进入 T402。

#### T402 — GREEN：SKILL.md 宿主中立重写+references 四件套修订（反偏见+裁决分级）

- **ID**：T402
- **Phase**：Phase P4 — debate v2（宿主中立重写）
- **goal**：让 T401 的目标断言通过并保留负例（不出现第 5 个评委角色、不写"辩论通过"质量门）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-006/R-007/R-008 → D-301 → FR-DEB-001 → AC-DEB-001；R-006 → D-302 → FR-DEB-002 → AC-DEB-002；R-003/R-004/R-005/R-006 → D-303 → FR-DEB-003 → AC-DEB-003；RISK-05
- **输入**：T401 的失败断言事实与 SKILL.md L43/L55-61/L204-210 改写锚点、references 四件套当前文本
- **依赖**：T401
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-DEB-001、FR-DEB-002、FR-DEB-003
- **AC**：AC-DEB-001、AC-DEB-002、AC-DEB-003
- **动作**：SKILL.md 宿主中立重写（L43/L55-61/L204-210 改写：4 独立上下文子代理+文件 mailbox+主代理法官禁言+2 轮封顶+共享 FS 前提+降级路径记录、宿主能力判定、DSH 原生消息仅作加速）；references 四件套修订（反偏见硬约束=匿名化/交换顺序/rubric/预算声明/禁止附和/保留分歧；裁决分级=方向级→用户、实现级→辩论角色按 rubric 出建议+独立复核子代理复核、主代理只登记）
- **精确文件**：`skills/debate/SKILL.md`、`skills/debate/references/role-spawn-templates.md`、`skills/debate/references/arbitration-protocol.md`、`skills/debate/references/output-template.md`、`skills/debate/references/anti-bias-guardrails.md`、`skills/debate/__tests__/skill-contract.test.mjs`
- **boundary**：files: `skills/debate/SKILL.md`, `skills/debate/references/role-spawn-templates.md`, `skills/debate/references/arbitration-protocol.md`, `skills/debate/references/output-template.md`, `skills/debate/references/anti-bias-guardrails.md`; symbols/regions: SKILL.md L43/L55-61/L204-210 改写区与四件套反偏见/裁决分级段落；测试文件仅允许修正 T401 新增用例断言笔误，不得弱化断言
- **输出**：GREEN——同命令退出 0，证据落盘 `quality/tests/p4-debate-green.log`
- **Knowledge**：DSH 原生父子消息实测可用但仅作加速，mailbox 文件为权威交锋记录（裁决书必须引用）；2 轮封顶未决→存疑清单呈用户不静默（SCN-005）；评委不是第 5 角色
- **verification_role**：GREEN
- **paired_task**：T401
- **gate_cmd**：`npx vitest run skills/debate/__tests__/skill-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-DEBATE-01` — 全部宿主中立断言通过且既有用例保持绿；负例（teammate 措辞残留/第 5 评委角色/"辩论通过"门措辞）不出现
- **evidence_path**：`quality/tests/p4-debate-green.log`
- **STOP**：重写后仍依赖任何单一宿主特性（teammate 或 DSH 私有 API 作为必要前提）时停止，回 spec.md FR-DEB-001；出现第 5 个评委角色或"辩论通过"门措辞时停止，回 spec.md FR-DEB-003
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡文本改动
- **task risk**：重写引入隐性宿主依赖（如假定 DSH 私有 API）或裁决分级措辞滑向主代理裁决
- **test tier / test method**：simple — backend-testing；纯技能文本契约断言，单文件 vitest 契约测试，无服务与复杂 fixture 依赖
- **scenarios / commands / expected exit / oracle**：与 T401 相同场景；同命令，GREEN 预期退出 0，oracle 同 ORACLE-DEBATE-01
- **fixtures_services**：与 T401 相同 fixture；N/A 清理
- **coverage limits**：本命令覆盖 skill-contract 全文件用例；不覆盖 mailbox 格式契约登记（T403）与真实多宿主运行（PFACT-17 inferred，由降级路径兜底）

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：SKILL.md 与 references 四件套改为四个独立上下文子代理、文件 mailbox、主代理法官禁言、两轮封顶、宿主能力判定与降级路径；补齐 mailbox 文件名冲突规避、锚点/触发文案、spawn 占位清理与无并行能力时的条件式降级裁决书；保留实现级独立复核分工，不引入第 5 角色或“辩论通过”质量门。
- **executed_commands**：`npx vitest run skills/debate/__tests__/skill-contract.test.mjs` → initial GREEN 6 passed；审查后回归 exit 0，7 passed。
- **evidence_refs**：`quality/tests/p4-debate-green.log`、`quality/tests/p4-post-review-green.log`
- **covered_ac**：`AC-DEB-001`、`AC-DEB-002`、`AC-DEB-003`
- **review_fact**：`quality/reviews/results/P4-phase-review.json` 已完成一次当前 P4 源码审查；处置见 `quality/evidence/build-code/P4-review-dispositions.json`。不重复 P2/P3，也不因修复再次调用 provider。
- **completed_at**：2026-09-06
- **执行事实**：GREEN 已闭合 T401 目标断言；审查后补齐降级输出、mailbox 冲突规则、文案清理并回归 7/7。

#### T403 — mailbox 格式契约段落+bundle/catalog/inventory 同步

- **ID**：T403
- **Phase**：Phase P4 — debate v2（宿主中立重写）
- **goal**：SKILL.md 落 mailbox 格式契约段落（单消息单文件 JSON 字段表+轮次目录+body_ref 长正文规则+降级=父代理串行转发并记录）+skill-bundle.json/catalog.yaml/repository-inventory.tsv 三处同步，并用同一字节级哈希校验阻止登记漂移
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-006/R-007/R-008 → D-301 → FR-DEB-001 → AC-DEB-001；RISK-05
- **输入**：T402 完成的宿主中立重写事实；skill-bundle.json/catalog.yaml/repository-inventory.tsv 当前 debate 条目
- **依赖**：T402
- **并行**：否 — 契约段落与登记须在重写事实完成后同步
- **FR**：FR-DEB-001
- **AC**：AC-DEB-001
- **动作**：在 SKILL.md 增加 mailbox 格式契约段落（单消息单文件 JSON：from/to/round/seq/body|body_ref/ts 字段表、按轮次组织目录、body_ref 长正文规则、降级=父代理串行转发并记录降级事实）；同步 skills/debate/skill-bundle.json files 条目 sha256、skills/catalog.yaml debate 条目、docs/architecture/repository-inventory.tsv 同步行
- **精确文件**：`skills/debate/SKILL.md`、`skills/debate/skill-bundle.json`、`skills/catalog.yaml`、`docs/architecture/repository-inventory.tsv`
- **boundary**：files: `skills/debate/SKILL.md`, `skills/debate/skill-bundle.json`, `skills/catalog.yaml`, `docs/architecture/repository-inventory.tsv`; symbols/regions: mailbox 格式契约段落（新增）、bundle files 条目 sha256、catalog debate 条目、inventory 同步行
- **输出**：mailbox 契约段落成文且三处登记一致；bundle files 每个 sha256 与实际字节一致；断言证据落盘 `quality/tests/p4-mailbox-green.log`
- **Knowledge**：Codex 仅 collab、Multica @mention，跨宿主运行性靠降级路径兜底（PFACT-17 inferred）；catalog/inventory/bundle 三处登记一致为本 phase Done 条件之一
- **verification_role**：N/A — non-behavior change: 文本/登记卡：契约段落与登记同步无独立行为断言，以可执行 grep 断言确认成文与登记一致
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`node -e "const fs=require('node:fs'),c=require('node:crypto');const b=JSON.parse(fs.readFileSync('skills/debate/skill-bundle.json'));for(const f of b.files){const p=f.path||f.ref;const h=c.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(h!==f.sha256)process.exit(1)};const s=fs.readFileSync('skills/debate/SKILL.md','utf8'),cat=fs.readFileSync('skills/catalog.yaml','utf8'),inv=fs.readFileSync('docs/architecture/repository-inventory.tsv','utf8');if(!s.includes('单消息单文件')||!s.includes('body_ref')||!cat.includes('debate')||!inv.includes('debate'))process.exit(1);console.log('PASS')"`
- **expected_exit**：0
- **oracle**：`ORACLE-DEBATE-MAILBOX-01` — mailbox 契约段落特征短语（单消息单文件/body_ref）成文且 catalog/inventory 登记存在，断言输出 PASS
- **evidence_path**：`quality/tests/p4-mailbox-green.log`
- **STOP**：三处登记无法对齐或契约段落与 T402 重写文本冲突时停止，回 plan.md Phase P4 节核对
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡文本与登记改动
- **task risk**：只改 SKILL.md 未同步 bundle sha256/catalog/inventory，留下登记脱节
- **test tier / test method**：simple — backend-testing；纯文本与登记断言，单命令 grep 核对，无服务依赖
- **scenarios / commands / expected exit / oracle**：状态场景=契约段落成文且三处登记一致、断言 PASS；命令同上，预期退出 0，oracle 同 ORACLE-DEBATE-MAILBOX-01
- **fixtures_services**：N/A — 纯文本断言，无 fixture 与外部服务
- **coverage limits**：本命令仅断言 mailbox 契约关键字段与登记存在；不覆盖 skill-contract 行为断言（T401/T402）

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 mailbox 单消息单文件 JSON 契约（轮次目录、body/body_ref、发送方+nonce+排他创建、降级记录）；同步 debate bundle 文件哈希、catalog 的 canonical bundle hash、repository inventory 的当前字节哈希，并在 catalog 明确 bundle 测试排除与两类 hash 域。
- **executed_commands**：修正 bundle 资产按 `skills/debate/` 相对路径解析后执行契约检查 → exit 0，PASS；`npm run check:skill-closure` → exit 0，ok；P4 审查后定向回归见 `quality/tests/p4-post-review-green.log`。
- **evidence_refs**：`quality/tests/p4-mailbox-green.log`、`quality/tests/p4-post-review-green.log`
- **covered_ac**：`AC-DEB-001`
- **review_fact**：`quality/reviews/results/P4-phase-review.json` 已完成一次当前 P4 源码审查；处置见 `quality/evidence/build-code/P4-review-dispositions.json`。不重复 P2/P3，也不因修复再次调用 provider。
- **completed_at**：2026-09-06
- **执行事实**：mailbox 关键字段与登记闭环通过；原任务卡命令的相对路径会误读仓库根 LICENSE，已按权威 resolver 语义修正执行并保留该事实。

### Verify

- **Target**：FR-DEB-001/002/003 及 AC-DEB-001/002/003 与跨任务 seam（契约断言→宿主中立重写→mailbox 契约与登记同步）
- **gate_cmd**：`npx vitest run skills/debate/__tests__/skill-contract.test.mjs`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p4-debate-{red,green}.log`、`quality/tests/p4-mailbox-green.log`、`quality/tests/p4-post-review-green.log`、`quality/reviews/results/P4-phase-review.json`、`quality/evidence/build-code/P4-review-dispositions.json`
- **Oracle**：ORACLE-DEBATE-01（skill-contract 绿）、ORACLE-DEBATE-MAILBOX-01（mailbox 契约与登记断言 PASS）

### Knowledge

DSH 原生父子消息实测可用但仅作加速，mailbox 文件为权威交锋记录（裁决书必须引用）；Codex 仅 collab、Multica @mention，跨宿主运行性靠降级路径兜底（PFACT-17 inferred）；2 轮封顶未决→存疑清单呈用户不静默（SCN-005）；debate 在 make-decision 的接线（6b/10b）由 P3 三件套引用本技能文本完成。

### STOP

重写后仍依赖任何单一宿主特性（teammate 或 DSH 私有 API 作为必要前提）→ 回 `specs/workflowhub-requirement-convergence-depth-20260905/spec.md` FR-DEB-001；出现第 5 个评委角色或"辩论通过"门措辞 → 回 spec.md FR-DEB-003。

### Done

gate_cmd 绿、RED/GREEN 证据成对；审查后定向回归与 skill closure 绿；AC-DEB-001/002/003 的文本与结构部分可判（真实跨宿主四队运行仍是 PFACT-17 inferred/unavailable，不冒充 acceptance-green）；catalog/inventory/bundle 三处登记一致；本 phase 仅一次异源审查完成并逐条处置，未重复 P2/P3。

### Risks and rollback

- **Risk**：affected IDs：FR-DEB-001~003；trigger=非 DSH 宿主无共享 FS（RISK-05）；consequence=角色独立性打折。
- **Prevention**：mitigation=降级路径成文+降级事实记录义务写入 SKILL.md。
- **Rollback / recovery**：`git revert` 本 phase 提交（纯技能文本，零运行时影响）。

## Phase P5 — 调研机制（deep-research）

### Goal

新建 skills/deep-research（R0 缺口问题/R1-R2 并行深读/R3 三角测量/R4 落盘 research-report.v1 content-addressed 到任务质量证据区/R5 独立复核；停止条件=≤3 轮/问题+连续 2 轮无新增=饱和+时间盒；跳过需论证；工具路由表=外部 anysearch+web_fetch+子代理深读、内部 glob+grep+read+git+ast-grep；纯 agent 无工具检索=不合格事实记录不阻断）；spec-research 注明分工；make-decision 调研条款节（"Research is an input to Talk, not a review." 段）改写引用契约；stage-reflection 增调研深度维度（不新增 gate）；catalog/inventory 登记。

### Files

- **NEW**：`skills/deep-research/SKILL.md`、`skills/deep-research/skill-bundle.json`
- **MODIFY**：`skills/spec-research/SKILL.md`、`skills/spec-research/skill-bundle.json`、`workflows/make-decision/SKILL.md`（调研条款节，"Research is an input to Talk, not a review." 段）、`skills/stage-reflection/SKILL.md`、`skills/stage-reflection/skill-bundle.json`（六区块内插入调研深度维度）、`skills/catalog.yaml`（deep-research 登记，格式参考 spec-research 条目）、`docs/architecture/repository-inventory.tsv`（两行新登记）
- **DO NOT TOUCH**：`workflows/make-decision/SKILL.md` 的 Talk 节与执行规划节插入区（P3 已改/P6 待改，本 phase 只动调研条款节）、`runtime/`（调研为纯技能层）、`skills/spec-research/SKILL.md` 的既有调用契约（只补分工注明）

### Tasks

#### T501 — NEW skills/deep-research/SKILL.md：R0-R5 子流程契约+停止条件预算+跳过论证义务+工具路由表+降级记录语义

- **ID**：T501
- **Phase**：Phase P5 — 调研机制（deep-research）
- **goal**：新建 skills/deep-research/SKILL.md，成文 R0 缺口问题/R1-R2 并行深读/R3 三角测量/R4 落盘 research-report.v1 content-addressed/R5 独立复核子流程契约+停止条件预算+跳过论证义务+工具路由表+降级记录语义
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-009/R-013/R-016/R-019 → D-401 → FR-RES-001 → AC-RES-001；R-013 → D-402 → FR-RES-002 → AC-RES-002；R-016/R-019 → D-403 → FR-RES-003 → AC-RES-003
- **输入**：accepted spec.md FR-RES-001/002/003 与 AC-RES-001/002/003；本任务 dogfood 实证的 R0-R5 口径（PFACT-16）
- **依赖**：T308、T403（P3 末卡与 P4 共享登记收敛卡；P5 调研条款改写卡与 P3 Talk 绑定卡改同一文件 workflows/make-decision/SKILL.md，且 P5 只在 P4 共享登记 owner 收敛后启动）
- **并行**：否 — 与 P3 共享 make-decision/SKILL.md，须串行
- **FR**：FR-RES-001、FR-RES-002、FR-RES-003
- **AC**：AC-RES-001、AC-RES-002、AC-RES-003
- **动作**：新建 skills/deep-research/SKILL.md：R0-R5 子流程契约（R0 缺口问题由需求框架骨架生成、R1 迭代检索必须读原文+查询重写+中英双语、R2 并行深读、R3 三角测量、R4 落盘 research-report.v1 content-addressed 到任务质量证据区、R5 独立复核）；停止条件预算（≤3 轮/问题+连续 2 轮无新增=饱和+时间盒）；跳过调研必须论证；工具路由表（外部 anysearch+web_fetch+子代理深读、内部 glob+grep+read+git+ast-grep）；纯 agent 无工具检索=不合格事实记录不阻断
- **精确文件**：`skills/deep-research/SKILL.md`
- **boundary**：files: `skills/deep-research/SKILL.md`; symbols/regions: 新文件全文（R0-R5 契约/停止条件/跳过论证/工具路由表/降级记录各节）
- **输出**：SKILL.md 成文；断言证据落盘 `quality/evidence/build-plan-or-T501.log`
- **Knowledge**：技能文本以本任务 dogfood 实证口径为准（R0-R5 跑通+三版落盘+R5 复核 8 条处置，PFACT-16）；调研契约不得写成推进 gate 或 pass 判据（F4/FR-RES-001 边界）
- **verification_role**：N/A — non-behavior change: 文本卡：新技能文本无独立行为断言，以 plan 指定的可执行断言命令确认成文
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`bash -c "grep -q 'R0 缺口' skills/deep-research/SKILL.md && grep -q 'R5 独立复核' skills/deep-research/SKILL.md && grep -q 'research-report.v1' skills/deep-research/SKILL.md && echo PASS"`
- **expected_exit**：0
- **oracle**：`ORACLE-DEEPRES-01` — SKILL.md 含 R0 缺口与 R5 独立复核子流程契约及 research-report.v1 落盘表述，断言输出 PASS
- **evidence_path**：`quality/evidence/build-plan-or-T501.log`
- **STOP**：调研契约被写成推进 gate 或 pass 判据（违反 F4/FR-RES-001 边界）时停止，回 spec.md FR-RES-001
- **recovery**：负责人=本任务执行 agent；最小恢复动作=删除本卡新建文件（NEW 文件无 revert 负担）
- **task risk**：契约口径偏离 dogfood 实证（超前承诺）或把降级记录写成可静默跳过
- **test tier / test method**：feature — backend-testing；新技能契约横跨 R0-R5 多节文本与落盘/工具路由口径，须按功能级断言命令核对关键契约成文
- **scenarios / commands / expected exit / oracle**：状态场景=SKILL.md 成文且 R0/R5 断言 PASS；命令同上，预期退出 0，oracle 同 ORACLE-DEEPRES-01
- **fixtures_services**：N/A — 纯文本断言，无 fixture 与外部服务
- **coverage limits**：本命令仅断言 R0/R5 关键契约成文；bundle 合法性由 T502 覆盖，登记由 T506 覆盖

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新建 `skills/deep-research/SKILL.md`，写入 R0-R5、停止预算、跳过/降级语义、工具路由和非 gate 边界；审查提出的工具枚举缺口已补齐。
- **executed_commands**：`grep` 断言 T501；`npx vitest run skills/debate/__tests__/skill-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/integration/distribution-closure.test.mjs tests/reuse-registry.test.mjs tests/skill-provenance-strict.test.mjs`
- **evidence_refs**：`quality/evidence/build-plan-or-T501.log`、`quality/tests/p5-register-green.log`、`quality/reviews/results/P5-phase-review.json`、`quality/evidence/build-code/P5-review-dispositions.json`
- **covered_ac**：`AC-RES-001`、`AC-RES-002`、`AC-RES-003`
- **review_fact**：P5 当前材料独立审查执行 1 次；工具枚举 finding 已 fixed；stage-reflection runtime 路径 finding 属 P5 外既有事实，已 rejected_invalid 并保留 residual fact；不重试 provider。
- **completed_at**：2026-09-06T01:59:32+0800
- **执行事实**：T501 gate exit 0；deep-research SKILL.md 最终 sha256=`2a1bf9e8a6a1e86b963c320d7b060b7eab7a136c76eb8dcf7977a0eda6453664`。

#### T502 — NEW skills/deep-research/skill-bundle.json（`{schema_version:1,skill,files}`）+bundle 合法性断言通过

- **ID**：T502
- **Phase**：Phase P5 — 调研机制（deep-research）
- **goal**：新建 skills/deep-research/skill-bundle.json（`{schema_version:1,skill,files}`，files 条目含 sha256），bundle 合法性断言通过
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-009/R-013/R-016/R-019 → D-401 → FR-RES-001 → AC-RES-001
- **输入**：T501 完成的 SKILL.md 事实；skill-bundle.json 结构约定（`{schema_version:1,skill,files}`）
- **依赖**：T501
- **并行**：否 — bundle 须与 SKILL.md 成文事实一致
- **FR**：FR-RES-001
- **AC**：AC-RES-001
- **动作**：新建 skills/deep-research/skill-bundle.json，按既有 bundle 结构登记 skill 与 files 条目（含 SKILL.md sha256）
- **精确文件**：`skills/deep-research/skill-bundle.json`
- **boundary**：files: `skills/deep-research/skill-bundle.json`; symbols/regions: 新文件全文（schema_version/skill/files 条目）
- **输出**：bundle 成文且合法性断言通过；证据落盘 `quality/evidence/build-plan-or-T502.log`
- **Knowledge**：bundle 结构=`{schema_version:1,skill,files}`（与既有技能一致）；files 条目 sha256 与 SKILL.md 字节一致
- **verification_role**：N/A — non-behavior change: 文本/登记卡：bundle 文件无独立行为断言，以 plan 指定的 node 合法性断言命令确认
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`node -e "const b=require('./skills/deep-research/skill-bundle.json');if(b.schema_version!==1)process.exit(1)" && echo PASS`
- **expected_exit**：0
- **oracle**：`ORACLE-DEEPRES-BUNDLE-01` — skill-bundle.json 可解析且 schema_version===1，断言输出 PASS
- **evidence_path**：`quality/evidence/build-plan-or-T502.log`
- **STOP**：bundle 结构与既有技能约定不一致或 sha256 无法对齐时停止，回 plan.md Phase P5 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=删除本卡新建文件
- **task risk**：files 条目 sha256 与 SKILL.md 实际字节不一致，留下登记失真
- **test tier / test method**：feature — backend-testing；bundle 合法性是技能分发契约的功能级断言，须以可执行 node 命令核对
- **scenarios / commands / expected exit / oracle**：状态场景=bundle 可解析且 schema_version===1、断言 PASS；命令同上，预期退出 0，oracle 同 ORACLE-DEEPRES-BUNDLE-01
- **fixtures_services**：N/A — 纯文件断言，无 fixture 与外部服务
- **coverage limits**：本命令仅断言 bundle 结构与 schema_version；files sha256 与字节一致性以执行事实记录核对

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新建并同步 `skills/deep-research/skill-bundle.json`，files 条目按 bundle-relative 路径绑定 SKILL.md 字节哈希。
- **executed_commands**：bundle JSON/schema/sha256 node 断言；`npm run check:skill-closure`；`git diff --check`
- **evidence_refs**：`quality/evidence/build-plan-or-T502.log`、`quality/tests/p5-register-green.log`、`quality/reviews/results/P5-phase-review.json`、`quality/evidence/build-code/P5-review-dispositions.json`
- **covered_ac**：`AC-RES-001`
- **review_fact**：P5 当前材料独立审查执行 1 次；bundle 相关 finding 已通过本地 hash/closure 回归修复；不重试 provider。
- **completed_at**：2026-09-06T01:59:32+0800
- **执行事实**：T502 gate exit 0；bundle raw sha256=`cc727b0e3945c882271d3db4d10840552a45c7a991236f4a2a286a015af0ca1b`，SKILL.md sha256=`2a1bf9e8a6a1e86b963c320d7b060b7eab7a136c76eb8dcf7977a0eda6453664`。

#### T503 — skills/spec-research/SKILL.md 注明分工+bundle 同步

- **ID**：T503
- **Phase**：Phase P5 — 调研机制（deep-research）
- **goal**：spec-research/SKILL.md 注明分工（build-plan 轻量规划问题 vs deep-research=make-decision 深度调研）+skill-bundle.json 同步
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-009/R-013/R-016/R-019 → D-401 → FR-RES-001 → AC-RES-001
- **输入**：T501 完成的 deep-research 契约事实；skills/spec-research/SKILL.md 当前文本（既有调用契约只补分工注明）
- **依赖**：T502
- **并行**：否 — 分工注明须引用已定稿的 deep-research 契约
- **FR**：FR-RES-001
- **AC**：AC-RES-001
- **动作**：在 skills/spec-research/SKILL.md 补分工注明段（spec-research=build-plan 轻量规划问题与后续阶段点状疑问通道；deep-research=make-decision 深度调研），不改既有调用契约；同步 skill-bundle.json sha256
- **精确文件**：`skills/spec-research/SKILL.md`、`skills/spec-research/skill-bundle.json`
- **boundary**：files: `skills/spec-research/SKILL.md`, `skills/spec-research/skill-bundle.json`; symbols/regions: 分工注明段（仅新增）、bundle files 条目 sha256；既有调用契约段落禁止改动
- **输出**：分工注明成文且 bundle 同步；断言证据落盘 `quality/tests/p5-specresearch-green.log`
- **Knowledge**：spec-research 保留为后续阶段点状疑问通道（spec.md FR-RES-001）；分工混淆（两个技能同一消费场景）→ 回 decision-log D-401 分工口径
- **verification_role**：N/A — non-behavior change: 文本卡：分工注明无独立行为断言，以可执行 grep 断言确认成文
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`bash -c "grep -q 'deep-research' skills/spec-research/SKILL.md && grep -q 'make-decision 深度调研' skills/spec-research/SKILL.md && echo PASS"`
- **expected_exit**：0
- **oracle**：`ORACLE-SPECRES-DIVISION-01` — spec-research/SKILL.md 含 deep-research 分工注明特征短语（make-decision 深度调研），断言输出 PASS
- **evidence_path**：`quality/tests/p5-specresearch-green.log`
- **STOP**：分工注明改动既有调用契约或与 D-401 分工口径冲突时停止，回 decision-log D-401
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡文本与 bundle 改动
- **task risk**：分工措辞含糊导致两个技能同一消费场景混淆
- **test tier / test method**：feature — backend-testing；分工注明是跨技能消费场景边界的功能级文本断言
- **scenarios / commands / expected exit / oracle**：状态场景=分工注明成文且断言 PASS；命令同上，预期退出 0，oracle 同 ORACLE-SPECRES-DIVISION-01
- **fixtures_services**：N/A — 纯文本断言，无 fixture 与外部服务
- **coverage limits**：本命令仅断言分工注明成文；既有调用契约回归由既有测试覆盖，本卡不新增

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：补充分工说明；明确 `spec-research` 服务 build-spec/build-plan 的轻量问题，`deep-research` 服务 make-decision 深度调研；补充 `version: 1.0.0` 并同步 bundle。
- **executed_commands**：`grep` 分工断言；bundle sha256 校验；`npx vitest run tests/reuse-registry.test.mjs tests/skill-provenance-strict.test.mjs`
- **evidence_refs**：`quality/tests/p5-specresearch-green.log`、`quality/tests/p5-register-green.log`、`quality/reviews/results/P5-phase-review.json`、`quality/evidence/build-code/P5-review-dispositions.json`
- **covered_ac**：`AC-RES-001`
- **review_fact**：P5 当前材料独立审查执行 1 次；spec-research 版本与 consumer 口径 findings 已 fixed；不重试 provider。
- **completed_at**：2026-09-06T01:59:32+0800
- **执行事实**：T503 gate exit 0；spec-research SKILL.md sha256=`2b25a831b7c640fd4bcdb45bfcfd206f0a20ad48f30b7126252ef15f2f3afb0e`，bundle raw sha256=`369dc7f0b293a9c057422ab5457205ab670a1716bbde9ce450800ea33a0ba1ba`。

#### T504 — workflows/make-decision/SKILL.md 调研条款节改写（引用 R0-R5 契约、R0 缺口由需求框架骨架生成）

- **ID**：T504
- **Phase**：Phase P5 — 调研机制（deep-research）
- **goal**：make-decision/SKILL.md 调研条款节（含 "Research is an input to Talk, not a review." 段，即"research 是 Talk 的输入、非 review"段）改写为引用 deep-research R0-R5 契约（R0 缺口由需求框架骨架生成），不动 Talk 节与执行规划节插入区
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-009/R-013/R-016/R-019 → D-401 → FR-RES-001 → AC-RES-001
- **输入**：T501 完成的 R0-R5 契约事实；workflows/make-decision/SKILL.md 调研条款节当前文本（P3 Talk 节已定稿）
- **依赖**：T503
- **并行**：否 — 与 P3 共享 make-decision/SKILL.md，本卡在 P3 末卡之后串行推进
- **FR**：FR-RES-001
- **AC**：AC-RES-001
- **动作**：改写 workflows/make-decision/SKILL.md 调研条款节（含 "Research is an input to Talk, not a review." 段）：引用 skills/deep-research 的 R0-R5 契约（不复制正文）、R0 缺口问题由需求框架骨架生成、跳过调研必须论证；仅限该节
- **精确文件**：`workflows/make-decision/SKILL.md`
- **boundary**：files: `workflows/make-decision/SKILL.md`; symbols/regions: 调研条款节（含 "Research is an input to Talk, not a review." 段，仅此节）；Talk 节（P3 定稿）与执行规划节插入区（P6 待改）禁止改动
- **输出**：调研条款改写成文；断言证据落盘 `quality/tests/p5-mdresearch-green.log`
- **Knowledge**：make-decision 调研条款引用该契约（spec.md FR-RES-001）；行区间重叠冲突按 PLAN-RISK-003 串行规则处理
- **verification_role**：N/A — non-behavior change: 文本卡：调研条款改写无独立行为断言，以可执行 grep 断言确认成文
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`bash -c "grep -q 'deep-research' workflows/make-decision/SKILL.md && grep -q 'R0-R5' workflows/make-decision/SKILL.md && echo PASS"`
- **expected_exit**：0
- **oracle**：`ORACLE-MDRESEARCH-01` — make-decision/SKILL.md 调研条款含 deep-research 与 R0-R5 引用表述，断言输出 PASS
- **evidence_path**：`quality/tests/p5-mdresearch-green.log`
- **STOP**：改动越出调研条款节（触及 Talk 节或执行规划节插入区）时停止，按 PLAN-RISK-003 串行规则回 plan.md Phase P5 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡文本改动
- **task risk**：改写复制 deep-research 正文（造成双写）而非引用契约，或改动越出调研条款节破坏 P3 定稿
- **test tier / test method**：feature — backend-testing；调研条款是 make-decision 对调研机制的功能级引用断言
- **scenarios / commands / expected exit / oracle**：状态场景=调研条款引用成文且断言 PASS；命令同上，预期退出 0，oracle 同 ORACLE-MDRESEARCH-01
- **fixtures_services**：N/A — 纯文本断言，无 fixture 与外部服务
- **coverage limits**：本命令仅断言调研条款引用成文；Talk 节与执行规划节由 P3/P6 各自覆盖

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：调研条款改为引用 `deep-research` R0-R5、R0 缺口来源、跳过论证和非 gate 边界；未改 Talk 节或执行规划节。
- **executed_commands**：`grep` deep-research/R0-R5 断言；`npm run check:skill-closure`；`git diff --check`
- **evidence_refs**：`quality/tests/p5-mdresearch-green.log`、`quality/tests/p5-register-green.log`、`quality/reviews/results/P5-phase-review.json`、`quality/evidence/build-code/P5-review-dispositions.json`
- **covered_ac**：`AC-RES-001`
- **review_fact**：P5 当前材料独立审查执行 1 次；web-fetch 能力缺失 finding 已补为显式 diagnostic capability；不重试 provider。
- **completed_at**：2026-09-06T01:59:32+0800
- **执行事实**：T504 gate exit 0；`workflows/make-decision/skill-deps.yaml` 已登记 `web-fetch`，原有无工具/不可用降级语义保留。

#### T505 — skills/stage-reflection/SKILL.md 增调研深度维度（不新增 gate）+bundle 同步

- **ID**：T505
- **Phase**：Phase P5 — 调研机制（deep-research）
- **goal**：stage-reflection/SKILL.md 六区块内插入调研深度维度（一手来源率/收敛率/OPEN 数/工具使用记录；缺省 not_applicable；不新增 gate）+skill-bundle.json 同步
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-009 → D-404 → FR-RES-004 → AC-RES-004
- **输入**：accepted spec.md FR-RES-004/AC-RES-004；skills/stage-reflection/SKILL.md 六区块当前文本
- **依赖**：T504
- **并行**：否 — 顺序推进
- **FR**：FR-RES-004
- **AC**：AC-RES-004
- **动作**：在 skills/stage-reflection/SKILL.md 六区块内插入调研深度维度（一手来源率/收敛率/OPEN 数/工具使用记录；缺省 not_applicable；明确不新增 gate、缺失不阻断只记录）；同步 skill-bundle.json sha256
- **精确文件**：`skills/stage-reflection/SKILL.md`、`skills/stage-reflection/skill-bundle.json`
- **boundary**：files: `skills/stage-reflection/SKILL.md`, `skills/stage-reflection/skill-bundle.json`; symbols/regions: 六区块插入区（调研深度维度）、bundle files 条目 sha256
- **输出**：调研深度维度成文且 bundle 同步；断言证据落盘 `quality/tests/p5-reflect-green.log`
- **Knowledge**：阶段复盘维度是事实记录不是 gate（spec.md FR-RES-004）；缺省值固定为 not_applicable
- **verification_role**：N/A — non-behavior change: 文本卡：复盘维度文本无独立行为断言，以 plan 指定的可执行断言命令确认成文
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`bash -c "grep -q '一手来源率' skills/stage-reflection/SKILL.md && grep -q 'not_applicable' skills/stage-reflection/SKILL.md && echo PASS"`
- **expected_exit**：0
- **oracle**：`ORACLE-REFLECT-01` — stage-reflection/SKILL.md 含一手来源率与 not_applicable 表述，断言输出 PASS
- **evidence_path**：`quality/tests/p5-reflect-green.log`
- **STOP**：调研深度维度被写成新增 gate 或 pass 判据时停止，回 spec.md FR-RES-004 与 FR-RES-001 边界
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡文本与 bundle 改动
- **task risk**：维度措辞滑向阻断判据（违反"事实不是许可证"边界）
- **test tier / test method**：feature — backend-testing；复盘维度是阶段复盘结构的功能级文本断言
- **scenarios / commands / expected exit / oracle**：状态场景=维度成文且断言 PASS；命令同上，预期退出 0，oracle 同 ORACLE-REFLECT-01
- **fixtures_services**：N/A — 纯文本断言，无 fixture 与外部服务
- **coverage limits**：本命令仅断言维度关键表述成文；既有六区块其余内容由既有材料覆盖，本卡不改

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：增加一手来源率、收敛率、OPEN 数、工具使用记录等事实维度；明确不新增 gate；补齐 judgment item 示例的必填字段；同步 bundle。
- **executed_commands**：`grep` 维度/not_applicable 断言；`npx vitest run tests/integration/distribution-closure.test.mjs tests/contract/review-materials-contract.test.mjs`
- **evidence_refs**：`quality/tests/p5-reflect-green.log`、`quality/tests/p5-register-green.log`、`quality/reviews/results/P5-phase-review.json`、`quality/evidence/build-code/P5-review-dispositions.json`
- **covered_ac**：`AC-RES-004`
- **review_fact**：P5 当前材料独立审查执行 1 次；judgment 示例字段 finding 已 fixed；既有 runtime validator/schema 路径风险未扩大范围，保留 residual fact；不重试 provider。
- **completed_at**：2026-09-06T01:59:32+0800
- **执行事实**：T505 gate exit 0；stage-reflection SKILL.md sha256=`cfa76728d64c37d2ff619678c6ac54c9b4277d1bcea4de24c26175ef05b13152`。

#### T506 — catalog.yaml+repository-inventory.tsv 登记（含 sha256）

- **ID**：T506
- **Phase**：Phase P5 — 调研机制（deep-research）
- **goal**：skills/catalog.yaml 登记 deep-research（格式参考 spec-research 条目）+docs/architecture/repository-inventory.tsv 两行新登记（含 sha256），三处登记一致
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：R-009/R-013/R-016/R-019 → D-401 → FR-RES-001 → AC-RES-001
- **输入**：T501/T502 完成的 deep-research 文件事实；当前 main 基线 `skills/catalog.yaml`（保留 M17 的 `metrics_enabled` 与既有条目）及 spec-research 条目格式参照；repository-inventory.tsv 当前登记
- **依赖**：T505、T403（T403 先完成 debate 条目与 inventory 共享登记，避免与本卡写同一登记文件）
- **并行**：否 — 登记须在全部文本定稿后执行
- **FR**：FR-RES-001
- **AC**：AC-RES-001
- **动作**：只在 skills/catalog.yaml 追加 deep-research 登记，不改 M17 已有条目和 `metrics_enabled`；在 docs/architecture/repository-inventory.tsv 新增两行登记（SKILL.md 与 skill-bundle.json，含 sha256、职责与消费者）；用同一条字节级 sha256 校验核对 catalog/inventory/bundle 三处一致，并将 hash mismatch 作为失败而非 grep 通过
- **精确文件**：`skills/catalog.yaml`、`docs/architecture/repository-inventory.tsv`
- **boundary**：files: `skills/catalog.yaml`, `docs/architecture/repository-inventory.tsv`; symbols/regions: deep-research 新登记条目（catalog 一条、inventory 两行），不得改写 M17 既有条目或 `metrics_enabled`
- **输出**：两处登记完成且与 bundle 一致；断言证据落盘 `quality/tests/p5-register-green.log`
- **Knowledge**：catalog/inventory/bundle 三处登记一致为本 phase Done 条件之一；登记含 sha256 与唯一消费者/删除条件
- **verification_role**：N/A — non-behavior change: 登记卡：登记条目无独立行为断言，以 plan 指定的可执行断言命令确认登记存在
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`node -e "const fs=require('node:fs'),c=require('node:crypto');const b=JSON.parse(fs.readFileSync('skills/deep-research/skill-bundle.json'));for(const f of b.files){const p=f.path||f.ref;const h=c.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(h!==f.sha256)process.exit(1)};const cat=fs.readFileSync('skills/catalog.yaml','utf8'),inv=fs.readFileSync('docs/architecture/repository-inventory.tsv','utf8');if(!cat.includes('deep-research')||!inv.includes('deep-research'))process.exit(1);console.log('PASS')"`
- **expected_exit**：0
- **oracle**：`ORACLE-DEEPRES-REGISTER-01` — catalog 与 inventory 均含 deep-research 登记，断言输出 PASS
- **evidence_path**：`quality/tests/p5-register-green.log`
- **STOP**：登记格式与 spec-research 条目参照不一致或三处登记无法对齐时停止，回 plan.md Phase P5 节
- **recovery**：负责人=本任务执行 agent；最小恢复动作=`git revert` 本卡登记改动
- **task risk**：登记缺 sha256 或消费者/删除条件，留下治理缺口
- **test tier / test method**：feature — backend-testing；登记一致性是技能治理的功能级断言
- **scenarios / commands / expected exit / oracle**：状态场景=两处登记存在且断言 PASS；命令同上，预期退出 0，oracle 同 ORACLE-DEEPRES-REGISTER-01
- **fixtures_services**：N/A — 纯文本断言，无 fixture 与外部服务
- **coverage limits**：本命令仅断言两处登记存在；sha256 与字节一致性以执行事实记录核对

##### Delivery contract fields

- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：登记 `deep-research` catalog、bundle、inventory、make-decision dependency 和 reuse-registry projection；审查后补齐 stage-reflection 两行 inventory 登记并同步所有受影响 raw/canonical hash。
- **executed_commands**：T506 bundle-relative sha256/catalog/inventory 断言；`npm run check:skill-closure`；`git diff --check`；受影响 Vitest 5 文件 61 tests。
- **evidence_refs**：`quality/tests/p5-register-green.log`、`quality/reviews/results/P5-phase-review.json`、`quality/evidence/build-code/P5-review-dispositions.json`、`docs/architecture/repository-inventory.tsv`
- **covered_ac**：`AC-RES-001`
- **review_fact**：P5 当前材料独立审查执行 1 次；登记、consumer、bundle 和 closure findings 已 fixed；M17 既有 SELF/其他 skill provenance 事实保留为 phase 外事项；不重试 provider。
- **completed_at**：2026-09-06T01:59:32+0800
- **执行事实**：T506 gate exit 0；`npm run check:skill-closure` exit 0；catalog deep closure=`dffd2fb2b64f945b7915cdc2344c4dd0c1f9e8fbbbe934b4229c9eb37d90b3c5`；inventory raw hash=`bb709384262f885ef5a32d1ace3d9155ee0d1fb632f5c017c7611054e3374bcc`。

### Verify

- **Target**：FR-RES-001/002/003/004 及 AC-RES-001/002/003/004 与跨任务 seam（SKILL.md→bundle→spec-research 分工→make-decision 调研条款→stage-reflection 维度→登记）
- **gate_cmd**：`node -e "const b=require('./skills/deep-research/skill-bundle.json');if(b.schema_version!==1)process.exit(1)" && grep -q 'R0 缺口' skills/deep-research/SKILL.md && grep -q 'R5 独立复核' skills/deep-research/SKILL.md && grep -q 'research-report.v1' skills/deep-research/SKILL.md && echo PASS`、`grep -q '一手来源率' skills/stage-reflection/SKILL.md && grep -q 'not_applicable' skills/stage-reflection/SKILL.md && echo PASS`；catalog/inventory 登记与 bundle 字节哈希只由 T506 统一校验
- **expected_exit**：0
- **evidence_path**：`quality/evidence/build-plan-or-T501.log`、`quality/evidence/build-plan-or-T502.log`、`quality/tests/p5-specresearch-green.log`、`quality/tests/p5-mdresearch-green.log`、`quality/tests/p5-reflect-green.log`、`quality/tests/p5-register-green.log`、`quality/reviews/results/P5-phase-review.json`、`quality/evidence/build-code/P5-review-dispositions.json`、`quality/evidence/build-code/P5-reflection-input.json`、`quality/evidence/build-code/P5-reflection-route.log`
- **Oracle**：ORACLE-DEEPRES-01（deep-research 契约与 bundle 断言 PASS）、ORACLE-REFLECT-01（stage-reflection 维度断言 PASS）

### Knowledge

research-report.v1 落盘=任务质量证据区 content-addressed（命名=内容 sha256 与字节一致），decision-log 只引 path+hash 不复制正文；本任务已 dogfood 实证 R0-R5 跑通+三版落盘+R5 复核 8 条处置（PFACT-16），技能文本以实证口径为准；P6 执行规划节将引用本 phase 的并行上限（研究 4）。

### STOP

调研契约被写成推进 gate 或 pass 判据（违反 F4/FR-RES-001 边界）→ 回 `specs/workflowhub-requirement-convergence-depth-20260905/spec.md` FR-RES-001；与 spec-research 分工混淆（两个技能同一消费场景）→ 回 decision-log D-401 分工口径。

### Done

T501~T506 均完成；AC-RES-001/002/003/004 的文本、bundle、能力登记与治理登记部分可判，相关本地回归 5 个文件共 61 tests 通过；当前工作树未重新观察真实 deep-research producer-to-consumer 运行，保留 PFACT-16/P5 当前运行未观察事实，不把文本契约当成 acceptance-green；catalog/inventory/bundle/closure 一致；本 phase 一次异源审查完成并记录，未重试 provider；stage reflection 因既有 immutable 文件冲突保留 EEXIST。

### Risks and rollback

- **Risk**：affected IDs：FR-RES-001~004；trigger=工具不可用（anysearch/web_fetch 缺席）；consequence=调研降级但不可静默。
- **Prevention**：mitigation=降级显式记录义务写入工具路由表。
- **Rollback / recovery**：`git revert` 本 phase 提交+按登记删除条件移除 skills/deep-research/（NEW 目录整体删除）。
## Phase P6 — 执行模型（make-decision 调度器）

### Goal

workflows/make-decision/SKILL.md 执行规划节成文（插入点=Procedure 节内、"Completion and fact writing" 节前）：M/S/B/P 执行器矩阵+上下文守恒 6 规则（全量产物落盘 ref+sha256+≤500 字摘要/子代理回传强制结构化/并行上限=研究 4+debate 4+红蓝 2/交互 M 独占/候选外包+裁决分级/主会话旧步骤不回读）。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`workflows/make-decision/SKILL.md`（仅执行规划节插入区）
- **DO NOT TOUCH**：`workflows/make-decision/SKILL.md` 的 Talk 节（P3 定稿）与调研条款（P5 定稿）、`workflows/make-decision/steps.json`、`runtime/`（执行模型为文本层约束，不改阶段契约）

### Tasks

#### T601 — 执行规划节成文（M/S/B/P 矩阵+上下文守恒 6 规则+摘要模板口径+并行上限）

- **ID**：T601
- **Phase**：Phase P6 — 执行模型（make-decision 调度器）
- **goal**：在 SKILL.md Procedure 节内、"Completion and fact writing" 节前插入执行规划节：14 步 step×executor 的 M/S/B/P 矩阵、上下文守恒 6 规则、摘要模板口径（研究/草稿/汇总≤500 字；复核类一行一条 finding）、并行上限（研究 4+debate 4+红蓝 2），grep 断言通过。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-608、OPEN-02 → FR-GOV-005 / AC-GOV-005
- **输入**：decision-log 的 "Step×Executor 矩阵" 节与 "上下文守恒规则" 节（唯一事实源）；P5 定稿后的 `workflows/make-decision/SKILL.md`。
- **依赖**：T506（P5 末卡，共享 `workflows/make-decision/SKILL.md`，按 PLAN-RISK-003 串行规则排在调研条款落地之后）
- **并行**：否 — 与 P3/P5 同文件分段，必须串行
- **FR**：FR-GOV-005
- **AC**：AC-GOV-005（文本部分）
- **动作**：在指定插入区间写入执行规划节文本（矩阵+6 规则+摘要模板口径+并行上限），不触碰 Talk 节、调研条款、steps.json 与 runtime/。
- **精确文件**：`workflows/make-decision/SKILL.md`
- **boundary**：files: `workflows/make-decision/SKILL.md`; symbols/regions: 仅 Procedure 节内、"Completion and fact writing" 节前的执行规划节插入区
- **输出**：执行规划节成文且 grep 断言 PASS；证据落盘 `quality/tests/p6-execmodel-green.log`。
- **Knowledge**：矩阵口径以 decision-log "Step×Executor 矩阵" 节与 "上下文守恒规则" 节为唯一事实源；D-608/OPEN-02 已定稿摘要模板；执行方式约束不改变阶段契约（FR-GOV-005 范围边界）；本任务运行方式已实证符合（PFACT-16）。
- **verification_role**：N/A — non-behavior change: 文本卡，无行为变化；以可执行断言命令验证文本成文事实
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`node --input-type=module -e "import {readFileSync} from 'node:fs';const s=readFileSync('workflows/make-decision/SKILL.md','utf8');const a=s.indexOf('## Execution model (M/S/B/P)'),b=s.indexOf('## Completion and fact writing');if(a<0||b<=a)throw new Error('execution model boundary');const x=s.slice(a,b);for(const q of ['| 1 load-context |','| 14 stage-reflection |','| 第4轮 talk（detail findings） | M |','| 12 stage-end-spec-analyze | S+B |','### Context conservation rules','主会话摘要≤500字','研究 4','debate 4','红蓝 2'])if(!x.includes(q))throw new Error('missing '+q);if((x.match(/^\d+\./gm)||[]).length!==6)throw new Error('context rules');console.log('PASS-T601-STRICT')" && git diff --check && echo PASS`
- **expected_exit**：0
- **oracle**：`ORACLE-EXECMODEL-01` — 严格命令校验执行规划边界、14 个编号步骤、条件 Talk4、step12 执行器、6 条上下文规则、500 字摘要上限和三个并行上限，并输出 PASS-T601-STRICT
- **evidence_path**：`quality/tests/p6-execmodel-green.log`
- **STOP**：执行模型被写成运行时强制（新增校验代码或 gate）→ 回 `specs/.../spec.md` FR-GOV-005 范围边界（仅文本约束）；与 P3/P5 已改段落行区间重叠冲突 → 按 PLAN-RISK-003 串行规则重排后停止上报。
- **recovery**：owner=build-code 执行者；最小动作=依据本卡记录的 phase-scoped commit 或 inverse patch 只回退执行规划插入区，再按插入点重做；禁止使用会抹掉前序阶段/用户改动的 `git checkout -- workflows/make-decision/SKILL.md`。
- **task risk**：插入文本与既有 Procedure 节结构冲突导致技能文本自相矛盾；缓解=插入点限定 Procedure 节内、"Completion and fact writing" 节前+改后人工通读 Procedure 节一次。
- **test tier / test method**：simple — 纯文本 grep 断言，无服务、无 fixture、无构建。
- **scenarios / commands / expected exit / oracle**：成功场景=同 gate_cmd，exit 0，输出 PASS；失败场景=节缺失或并行上限未写，grep 无命中，exit 非 0；seam 场景=与 P3 Talk 节/P5 调研条款同文件共存，断言不依赖行号只依赖文本锚点，同命令同 oracle。
- **fixtures_services**：N/A — 纯文本断言，无 fixture、无服务、无清理责任。
- **coverage limits**：仅覆盖执行规划节文本存在性与关键口径锚点；不覆盖运行时是否遵守矩阵（运行一致性由 PFACT-16 实证与 AC-GOV-005 运行部分承担）；不覆盖 steps.json 阶段契约。
- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 `workflows/make-decision/SKILL.md` 的指定插入区写入 M/S/B/P 执行矩阵、条件 Talk4、step12=S+B、6 条上下文守恒规则；同时将 T601 gate 升级为 bounded source assertion。
- **executed_commands**：严格源边界断言 + `git diff --check`；exit 0；输出 `PASS-T601-STRICT`。
- **evidence_refs**：`quality/tests/p6-execmodel-green.log`（sha256 `f9813c65737134cffefc654684b2a297cf426d67793b70cc67536a4c2fd87462`）；`quality/reviews/results/P6-phase-review.json`（sha256 `d4647718d86a73492e2fd456cf45e5c44ed97402f741a91dda55fc84d44d15c1`）；`quality/evidence/build-code/P6-review-dispositions.json`（sha256 `c704b66160156cad576750641de62abe6bf70c5b0f38b227083e1f1274b14ab7`）。
- **covered_ac**：AC-GOV-005 文本部分；执行规划与 decision-log 矩阵 seam；主会话≤500字、研究4/debate4/红蓝2 上限。
- **review_fact**：当前 P6 一次异源审查可用（kimi/coding + codex/luna，runtime `8a466662-7e30-49fd-88f7-746d9fd67115`，material `0a62ce07e89e425836c3a2dd36217d0cf03d168a0a9b32d65cdefc87662d938c`，provider retry=0）；8 findings 已逐条处置，前序 P3 风险保留为 rejected_invalid，不重复审查。
- **completed_at**：`2026-09-06T02:16:04+0800`
- **执行事实**：P6 文本实现与严格断言完成；未修改 Talk、P5 调研条款、steps.json、runtime；reflection route 仍需按既有固定路径事实处理。

### Verify

- **Target**：FR-GOV-005、AC-GOV-005 文本部分；与 P3/P5 同文件 seam。
- **gate_cmd**：同 T601 严格断言命令，另执行 `git diff --check`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p6-execmodel-green.log`
- **Oracle**：ORACLE-EXECMODEL-01 — 输出 PASS。

### Knowledge

矩阵口径以 decision-log 的 "Step×Executor 矩阵" 节与 "上下文守恒规则" 节为唯一事实源（D-608/OPEN-02 已定稿摘要模板）；执行方式约束不改变阶段契约（FR-GOV-005 范围边界）；本任务运行方式已实证符合（PFACT-16）。

### STOP

执行模型被写成运行时强制（新增校验代码或 gate）→ 回 `specs/.../spec.md` FR-GOV-005 范围边界（仅文本约束）；与 P3/P5 已改段落行区间重叠冲突 → 按 PLAN-RISK-003 串行规则重排。

### Done

严格源边界断言通过；AC-GOV-005 文本部分可判（运行一致性仍由 PFACT-16/后续真实观察承担）；本 phase 一次异源审查完成并记录，8 条 finding 已逐条处置；前序 P3 aggregate owner/confirmation 风险保留，不冒充 P6 已修复。

### Risks and rollback

- affected IDs：FR-GOV-005；trigger=文本与既有 Procedure 节结构冲突；consequence=技能文本自相矛盾；mitigation=插入点限定 Procedure 节内、"Completion and fact writing" 节前+改后人工通读 Procedure 节一次；rollback=`git revert` 本 phase 提交（单文件单节）。

## Phase P7 — 决策记录结构（需求框架+模块分组+链字段告警）

### Goal

skills/decision-log SKILL.md+模板升级：组合式需求框架 2 类 preset（功能类=背景-问题-目标-方案-验收-扩展；研究类=问题-论断-证据-裁决）+决策挂骨架节点+节点待补证据声明式标记；决定区按模块 h3 分组+D-ID+derived_from 跨模块引用；文本层链字段 derived_from/module/requirement_ids/artifacts；run-checks 新增不阻断告警 checker（RED/GREEN 成对）；既有机器强制边界（16 h2/覆盖/五维/R-NNN）全绿不破。

### Files

- **NEW**：`tools/cli/check-decision-log-chain.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`
- **MODIFY**：`skills/decision-log/SKILL.md`、`skills/decision-log/skill-bundle.json`、`skills/decision-log/templates/decision-log-template.md`、`tools/cli/run-checks.mjs`（L115 后注册告警 checker）
- **DO NOT TOUCH**：`runtime/schemas/decision-entry.v1.json`（按 spec PFACT-12 的 20 个必填字段口径不动）、`runtime/stage/stage-content-contracts.mjs` 的 REQUIRED_MAIN_SECTIONS L25-28 与 validateMain L2060-2072（16 h2 机器强制不改）、既有 6 个 checker 行为

### Tasks

#### T701 — decision-log SKILL.md+模板：需求框架 2 preset+决策挂节点+待补证据标记

- **ID**：T701
- **Phase**：Phase P7 — 决策记录结构（需求框架+模块分组+链字段告警）
- **goal**：SKILL.md 与 decision-log-template.md 成文组合式需求框架 2 类 preset（功能类=背景-问题-目标-方案-验收-扩展；研究类=问题-论断-证据-裁决）、决策挂骨架节点写法、节点待补证据声明式标记；文本层改动不破坏 16 h2 机器强制。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-501、D-502 → FR-DLOG-001 / AC-DLOG-001
- **输入**：accepted spec FR-DLOG-001 与 plan P7 设计；本任务 decision-log 试运行样本（PFACT-16）作为模板结构基准。
- **依赖**：none — 独立文件（skills/decision-log 下），可与 P3–P6 并行
- **并行**：是 — 与 P3–P6 无共享文件
- **FR**：FR-DLOG-001
- **AC**：AC-DLOG-001
- **动作**：在 SKILL.md 与模板中写入 2 类 preset、决策挂骨架节点、待补证据声明式标记文本；不改 runtime schemas 与 stage-content-contracts。
- **精确文件**：`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`
- **boundary**：files: `skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`; symbols/regions: 需求框架节与模板主体文本区；不触碰 16 h2 机器强制相关结构声明
- **输出**：preset/挂节点/待补证据标记成文；既有 decision-log 结构校验（16 h2/覆盖/五维/R-NNN）保持全绿；证据落盘 `quality/evidence/build-plan-or-T701.log`。
- **Knowledge**：链字段仅在文本层，decision-entry.v1 机器消费者无感；模板以本任务 decision-log 样本结构为准（PFACT-16）。
- **verification_role**：N/A — non-behavior change: 文本卡，无行为变化；以可执行结构校验命令验证机器强制边界未破
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`npx vitest run tests/stage-decision-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-DLOGSTRUCT-01` — 模板改动后既有 decision-log 结构校验全绿，证明 16 h2/覆盖/五维/R-NNN 机器强制边界未破
- **evidence_path**：`quality/evidence/build-plan-or-T701.log`
- **STOP**：模板改动导致 16 h2/覆盖矩阵/五维/R-NNN 任一校验红 → 停止并回 decision-log D-501/D-502 与 spec.md FR-DLOG-001 边界（X-003 不得提前触发）。
- **recovery**：owner=build-code 执行者；最小动作=`git checkout -- skills/decision-log/SKILL.md skills/decision-log/templates/decision-log-template.md` 后按样本结构重写成文。
- **task risk**：文本改动意外破坏 16 h2 机器强制或与本任务既有 decision-log 结构不兼容；缓解=以 PFACT-16 样本为基准+改后立即跑结构校验。
- **test tier / test method**：feature — 需运行既有 vitest 契约测试套件验证模板与运行时校验的兼容，属单模块功能级验证。
- **scenarios / commands / expected exit / oracle**：成功场景=同 gate_cmd，exit 0，契约测试全绿；失败场景=模板破坏 16 h2 或覆盖矩阵，测试红，exit 非 0；seam 场景=模板与本任务 decision-log 样本双向兼容，同命令同 oracle。
- **fixtures_services**：N/A — 复用 tests/stage-decision-contract.test.mjs 自带 fixture；无新增服务，清理责任归该测试套件自身。
- **coverage limits**：覆盖模板与 SKILL.md 文本改动对机器强制边界的兼容性；不覆盖 preset 内容的语义质量（AC-DLOG-001 的人工阅读部分另判）；不覆盖链字段告警（T703/T704 承担）。
- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：decision-log SKILL 与模板新增 functional/research 需求框架、节点 pending 标记、决定模块/链字段填写规范；模板保留 16 个 h2。
- **executed_commands**：T701 bounded text assertion；P7 GREEN `npx vitest run tests/contract/decision-log-chain-warnings.test.mjs tests/stage-decision-contract.test.mjs`；exit 0。
- **evidence_refs**：`quality/evidence/build-plan-or-T701.log`；`quality/tests/p7-dlogwarn-green.log`。
- **covered_ac**：AC-DLOG-001（文本/结构部分）。
- **review_fact**：纳入 P7 一次当前异源审查（kimi/coding + codex/luna，P7-F1/F6 等已修复）；不重复前序审查。
- **completed_at**：`2026-09-06T02:35:17+0800`
- **执行事实**：框架 preset、骨架节点和待补证据语义已落盘；人工语义质量仍按 AC-DLOG-001 留事实边界。

#### T702 — 决定区模块 h3 分组+链序+跨模块 D-ID+derived_from 引用+链字段四字段写法

- **ID**：T702
- **Phase**：Phase P7 — 决策记录结构（需求框架+模块分组+链字段告警）
- **goal**：决定区成文按模块 h3 分组与链序排列规则、跨模块 D-ID+derived_from 引用写法、文本层链字段 derived_from/module/requirement_ids/artifacts 四字段的填写规范。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-501、D-502 → FR-DLOG-002 / AC-DLOG-002
- **输入**：T701 定稿的模板结构；spec FR-DLOG-002 链字段口径。
- **依赖**：T701
- **并行**：否 — 同模板文件续写，串行
- **FR**：FR-DLOG-002
- **AC**：AC-DLOG-002（manual — 待人工阅读）
- **动作**：在 SKILL.md 与模板决定区写入模块 h3 分组、链序、D-ID+derived_from 跨模块引用与四链字段写法；保持 16 h2 不变。
- **精确文件**：`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`
- **boundary**：files: `skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`; symbols/regions: 决定区（Decisions）相关节与模板对应区
- **输出**：分组与链字段写法成文；grep 命中 derived_from 等字段锚点；结构校验保持全绿。
- **Knowledge**：链字段仅在文本层，decision-entry.v1 机器消费者无感；跨模块引用用 D-ID+derived_from，不引入新 schema 字段。
- **verification_role**：N/A — non-behavior change: 文本卡，无行为变化；以可执行断言命令验证字段锚点成文且机器边界未破
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`bash -c "grep -q 'derived_from' skills/decision-log/templates/decision-log-template.md && grep -q 'requirement_ids' skills/decision-log/templates/decision-log-template.md && npx vitest run tests/stage-decision-contract.test.mjs"`
- **expected_exit**：0
- **oracle**：`ORACLE-DLOGSTRUCT-01` — 链字段锚点命中且既有 decision-log 结构校验全绿
- **evidence_path**：`quality/evidence/build-plan-or-T702.log`
- **STOP**：链字段被写入 schema 或机器校验（越界升 schema）→ 回 spec.md FR-DLOG-002 文本层边界；结构校验任一红 → 回 D-501/D-502。
- **recovery**：owner=build-code 执行者；最小动作=回退决定区改动后按 T701 定稿结构重写。
- **task risk**：链字段写法与 T704 告警 checker 的判定口径不一致；缓解=写法与 checker 用例（T703）共用同一字段名与示例。
- **test tier / test method**：feature — grep 锚点+vitest 契约测试组合，单模块功能级验证。
- **scenarios / commands / expected exit / oracle**：成功场景=同 gate_cmd，exit 0；失败场景=字段锚点缺失或结构校验红，exit 非 0；seam 场景=与 T701 preset 区共存不互相覆盖，同命令同 oracle。
- **fixtures_services**：N/A — 复用既有契约测试 fixture；无新增服务。
- **coverage limits**：覆盖链字段文本锚点与机器边界兼容；不覆盖链字段长期维护质量（由 T703/T704 告警+复盘结构维度承担）；AC-DLOG-002 语义判定留人工。
- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：决定区新增按模块 h3 分组、因果链序、跨模块 D-ID+derived_from，以及 module/requirement_ids/derived_from/artifacts 四字段文本写法。
- **executed_commands**：T702 grep 锚点断言；P7 GREEN `npx vitest run tests/contract/decision-log-chain-warnings.test.mjs tests/stage-decision-contract.test.mjs`；exit 0。
- **evidence_refs**：`quality/evidence/build-plan-or-T702.log`；`quality/tests/p7-dlogwarn-green.log`。
- **covered_ac**：AC-DLOG-002（文档结构事实，人工阅读仍单独判定）。
- **review_fact**：纳入 P7 一次当前异源审查（P7-F1/F6/F5 已修复）；不重复前序审查。
- **completed_at**：`2026-09-06T02:35:17+0800`
- **执行事实**：链字段仅保留在文本层，未新增 schema 字段或 runtime gate。

#### T703 — RED：checker 告警测试（故意缺失/非法/引用不存在用例告警且 exit 0）

- **ID**：T703
- **Phase**：Phase P7 — 决策记录结构（需求框架+模块分组+链字段告警）
- **goal**：新增契约测试：故意缺失链字段、非法字段值、derived_from 引用不存在 D-ID 三类用例应产生告警且进程 exit 0、不升 schema、不进 gate；当前 checker 不存在，测试预期失败。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-104、OPEN-02 → FR-DLOG-003 / AC-DLOG-003
- **输入**：T702 定稿的链字段写法；spec FR-DLOG-003 告警语义（只打印不 exit 1、不升 schema、不进 gate）。
- **依赖**：T702
- **并行**：否 — first RED for this behavior
- **FR**：FR-DLOG-003
- **AC**：AC-DLOG-003
- **动作**：只新增失败测试 `tests/contract/decision-log-chain-warnings.test.mjs`（三类告警用例+不阻断断言），不实现 checker，不改生产代码。
- **精确文件**：`tests/contract/decision-log-chain-warnings.test.mjs`
- **boundary**：files: `tests/contract/decision-log-chain-warnings.test.mjs`; symbols/regions: 新测试文件全部用例
- **输出**：RED 证据——测试因 checker 模块不存在/告警未实现而失败，落盘 `quality/tests/p7-dlogwarn-red.log`。
- **Knowledge**：告警 checker 语义=告警只打印不 exit 1、不升 schema、不进 gate（OPEN-02 定稿）；run-checks 注册段必须显式不写进 failures 数组。
- **verification_role**：RED
- **paired_task**：T704
- **gate_cmd**：`npx vitest run tests/contract/decision-log-chain-warnings.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-DLOGWARN-01` — 目标断言失败信号：checker 模块不存在或告警逻辑未实现导致用例红
- **evidence_path**：`quality/tests/p7-dlogwarn-red.log`
- **STOP**：环境失败（vitest 不可用）、命令损坏、需要改动既有 6 个 checker 或 schema 才能写测试 → 停止并回 spec.md FR-DLOG-003 边界。
- **recovery**：owner=build-code 执行者；最小动作=删除该测试文件后按 OPEN-02 口径重写用例。
- **task risk**：RED 用例断言过宽（把阻断行为也断言为合法）或覆盖不足（漏掉"引用不存在"类）；缓解=三类用例与"exit 0 不阻断"负例都写全。
- **test tier / test method**：feature — 针对单个 CLI checker 模块的契约级测试，vitest 运行，无服务依赖。
- **scenarios / commands / expected exit / oracle**：成功（RED 达成）=同 gate_cmd，exit 1，checker 缺失类失败；失败（误绿）=exit 0 说明已有实现或断言错误，须停止核查；seam 场景=与既有 6 个 checker 共存互不影响，同命令同 oracle。
- **fixtures_services**：测试内置临时 decision-log fixture（缺失/非法/引用不存在三类样本），由测试自身创建并清理；无外部服务。
- **coverage limits**：仅覆盖告警 checker 的三类用例与不阻断语义；不覆盖链字段写法本身（T702）与结构校验（T701）。
- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增三类链字段告警测试，并补充 fenced 示例与 run-checks 非阻断 wiring 覆盖。
- **executed_commands**：`npx vitest run tests/contract/decision-log-chain-warnings.test.mjs` RED exit 1（checker 缺失）；配对 GREEN exit 0。
- **evidence_refs**：`quality/tests/p7-dlogwarn-red.log`；`quality/tests/p7-dlogwarn-green.log`。
- **covered_ac**：AC-DLOG-003 RED/GREEN 断言部分。
- **review_fact**：纳入 P7 一次当前异源审查（P7-F2/F7/F8 已修复）；不重复前序审查。
- **completed_at**：`2026-09-06T02:35:17+0800`
- **执行事实**：RED 事实保留，随后由 T704 配对实现转绿；不阻断语义已通过 forced-failure aggregate 用例验证。

#### T704 — GREEN：check-decision-log-chain.mjs 实现+run-checks.mjs 注册（只打印不进 failures 不 exit 1）

- **ID**：T704
- **Phase**：Phase P7 — 决策记录结构（需求框架+模块分组+链字段告警）
- **goal**：实现 `tools/cli/check-decision-log-chain.mjs` 并在 `tools/cli/run-checks.mjs` L115 后注册为不阻断告警 checker，使 T703 的三类用例与不阻断断言全部转绿；同步 skills/decision-log/skill-bundle.json。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-104、OPEN-02 → FR-DLOG-003 / AC-DLOG-003
- **输入**：T703 的失败断言与三类用例；run-checks.mjs L115 注册点。
- **依赖**：T703
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-DLOG-003
- **AC**：AC-DLOG-003
- **动作**：最小实现告警 checker（检测缺失/非法/引用不存在并打印告警），在 run-checks.mjs 注册段显式不写入 failures 数组、不 exit 1；更新 skill-bundle.json 同步技能包。
- **精确文件**：`tools/cli/check-decision-log-chain.mjs`、`tools/cli/run-checks.mjs`、`skills/decision-log/skill-bundle.json`、`tests/contract/decision-log-chain-warnings.test.mjs`（仅必要修正）
- **boundary**：files: `tools/cli/check-decision-log-chain.mjs`、`tools/cli/run-checks.mjs`、`skills/decision-log/skill-bundle.json`; symbols/regions: 新 checker 模块全体；run-checks.mjs 仅 L115 后注册段；不触碰既有 6 个 checker 行为
- **输出**：同命令转绿，证据落盘 `quality/tests/p7-dlogwarn-green.log`；run-checks 汇总中该 checker 告警不阻断实证记录。
- **Knowledge**：T703 的真实失败事实；告警只打印不 exit 1、不升 schema、不进 gate（OPEN-02）；decision-entry.v1 机器消费者无感。
- **verification_role**：GREEN
- **paired_task**：T703
- **gate_cmd**：`npx vitest run tests/contract/decision-log-chain-warnings.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-DLOGWARN-01` — 与 T703 相同 oracle：三类告警用例全绿且进程 exit 0、告警未进 failures 的负例断言保持
- **evidence_path**：`quality/tests/p7-dlogwarn-green.log`
- **STOP**：需要弱化 T703 断言、把告警写成阻断、或扩大边界改既有 checker/schema → 停止并回 spec.md FR-DLOG-003 边界。
- **recovery**：owner=build-code 执行者；最小动作=`git revert` 本卡提交并删除 checker 新文件，保留 T703 测试回 RED 状态。
- **task risk**：实现把告警意外接入 failures 或 exit code（变成阻断门）；缓解=注册段显式注释+测试含"不阻断"负例断言。
- **test tier / test method**：feature — 与 T703 相同的 checker 契约级 vitest 测试。
- **scenarios / commands / expected exit / oracle**：与 T703 相同场景、命令与 oracle；成功=exit 0 全绿；失败=任一用例红或不阻断负例被破坏，exit 非 0；seam=run-checks 汇总实证告警不阻断。
- **fixtures_services**：与 T703 相同——测试内置三类临时 fixture，测试自身清理；无外部服务。
- **coverage limits**：覆盖告警 checker 实现与注册不阻断语义；不覆盖链字段长期防腐（由复盘结构维度+告警失效触发 X-003 评估承担）。
- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：实现 `tools/cli/check-decision-log-chain.mjs`，支持缺失/非法/不存在引用告警；在 run-checks 注册为 non-blocking；同步 decision-log bundle 哈希与 inventory。
- **executed_commands**：`npx vitest run tests/contract/decision-log-chain-warnings.test.mjs tests/stage-decision-contract.test.mjs`；`node tools/cli/run-checks.mjs`；`npm run check:skill-closure`；均 exit 0。
- **evidence_refs**：`quality/tests/p7-dlogwarn-green.log`；`quality/reviews/results/P7-phase-review.json`（sha256 `3d40c155fd7b3437c399c73bb582efe6aac9163eb483638746c41175622dcc25`）；`quality/evidence/build-code/P7-review-dispositions.json`（sha256 `e73442b4f05402b74b117c197a638891ee31c06e0e41ad3746de9e6405265287`）。
- **covered_ac**：AC-DLOG-003；告警打印但 exit 0、不进 failures、不改 decision-entry.v1 schema。
- **review_fact**：P7 一次异源审查可用（kimi/coding + codex/luna，runtime `554b5f06-4840-4a3d-84c3-7ddd7dfab8c3`，material `9e2ce652cce4280ccab5ecc234f9495aecfc376f222af7161b284060dc3ab623`，provider retry=0）；10 findings 已逐条处置。
- **completed_at**：`2026-09-06T02:35:17+0800`
- **执行事实**：告警规则保持文档/CLI 分离；run-checks seam 实证非阻断；不触碰 schema、既有 6 个 checker 或 stage-content-contracts 结构。

### Verify

- **Target**：FR-DLOG-001/002/003；AC-DLOG-001/002/003；模板与机器强制边界 seam、checker 与既有 6 checker seam。
- **gate_cmd**：`npx vitest run tests/contract/decision-log-chain-warnings.test.mjs` 与 `npx vitest run tests/stage-decision-contract.test.mjs`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p7-dlogwarn-{red,green}.log`、`quality/evidence/build-plan-or-T701.log`、`quality/evidence/build-plan-or-T702.log`
- **Oracle**：ORACLE-DLOGWARN-01（告警 checker 转绿且不阻断）、ORACLE-DLOGSTRUCT-01（结构校验全绿，机器强制边界未破）。

### Knowledge

告警 checker 语义=告警只打印不 exit 1、不升 schema、不进 gate（OPEN-02 定稿），run-checks 注册段必须显式不写进 failures 数组；链字段仅在文本层，decision-entry.v1 机器消费者无感；本任务 decision-log 已是试运行样本（PFACT-16），模板以样本结构为准。

### STOP

告警被实现为阻断（exit 非 0 或进 failures）→ 回 `specs/.../spec.md` FR-DLOG-003 边界；模板改动导致 16 h2/覆盖矩阵/五维/R-NNN 任一校验红 → 回 decision-log D-501/D-502 与 spec.md FR-DLOG-001 边界（X-003 不得提前触发）。

### Done

两条 gate_cmd 绿、RED/GREEN 证据成对；AC-DLOG-001/003 可判通过、AC-DLOG-002 待人工阅读（manual）；run-checks 汇总中该 checker 告警不阻断实证记录；本 phase 一次异源审查完成并记录。

### Risks and rollback

- affected IDs：FR-DLOG-001~003；trigger=链字段长期不维护腐烂（RISK-04）；consequence=决策链退化；mitigation=告警+复盘结构维度双重暴露、告警失效触发 X-003 评估；rollback=`git revert` 本 phase 提交+删除两个 NEW 文件（checker 与测试），run-checks 注册段随 revert 回退。

## Phase P8 — 治理登记与文档

### Goal

AGENTS.md"给 agent 的规则"节增测试硬规则（只跑受影响针对性测试、禁止全量 vitest/test:safe，除用户/CI 明确要求；引 docs/standard-workflow.md L310）；CONTEXT.md 核心概念术语节登记四术语（争议 findings/红蓝审查/需求框架/决策链）；AGENTS.md 当前治理边界节登记两条新控制面（结构化问答工具卡、accepted_risk confirm 语义扩展，各含 owner/consumer/删除条件）；各 phase 验收记录汇总核对（FR-GOV-003）。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`AGENTS.md`（L11 规则节后+当前治理边界节）、`CONTEXT.md`（核心概念术语节 L23）
- **READ-ONLY INPUTS**：`skills/decision-log/templates/decision-log-template.md`、`tests/contract/decision-log-chain-warnings.test.mjs`、`workflows/make-decision/SKILL.md`；P8 只核对其事实，不在本 phase 修改
- **DO NOT TOUCH**：`AGENTS.md` 既有治理边界条目（只追加不改写）、`docs/standard-workflow.md`（只引用不修改）、`CONSTITUTION.md`、`constitution-checklist.md`、spec 第 10 节（非目标唯一权威，不在 AGENTS.md 复制第二份清单）

### Tasks

#### T801 — AGENTS.md 测试硬规则成文（只跑受影响针对性测试+禁止全量+例外=用户/CI 明确要求）

- **ID**：T801
- **Phase**：Phase P8 — 治理登记与文档
- **goal**：在 AGENTS.md 当前 "给 agent 的规则"节既有条目之后追加测试硬规则：只跑受影响针对性测试、禁止全量 vitest/test:safe，例外仅"用户或 CI 守卫明确要求"，并引用 docs/standard-workflow.md L310；保留 M17 已有 Stage Agent/vNext 规则；grep 断言通过。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-607 → FR-GOV-004 / AC-GOV-004
- **输入**：decision-log D-607 硬规则定稿口径；docs/standard-workflow.md L310（只引用不修改）；P3 落地后的仓库文档基线。
- **依赖**：T308（P3 末卡落地后登记，确保治理文档基线稳定）
- **并行**：否 — P8 首卡，后续 T803 同文件串行
- **FR**：FR-GOV-004
- **AC**：AC-GOV-004
- **动作**：只追加测试硬规则条目（含例外口径逐字写清与 standard-workflow.md L310 引用），不改写既有条目。
- **精确文件**：`AGENTS.md`
- **boundary**：files: `AGENTS.md`; symbols/regions: 当前 "给 agent 的规则"节末尾追加区；不得覆盖 M17 已有 Stage Agent/vNext 规则
- **输出**：硬规则成文且 grep 断言 PASS；证据落盘 `quality/tests/p8-agents-green.log`。
- **Knowledge**：D-607 硬规则的例外只有"用户或 CI 守卫明确要求"；本任务后续全部验证（含 phase 验收）按此执行并留记录（AC-GOV-004 证据）。
- **verification_role**：N/A — non-behavior change: 文本卡，无行为变化；以可执行断言命令验证规则成文事实
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`bash -c "grep -q '只跑受影响针对性测试' AGENTS.md && grep -q '禁止全量' AGENTS.md && echo PASS"`
- **expected_exit**：0
- **oracle**：`ORACLE-AGENTRULE-01` — 命令输出 PASS：硬规则特征短语（只跑受影响针对性测试/禁止全量）成文
- **evidence_path**：`quality/tests/p8-agents-green.log`
- **STOP**：出现第二份非目标清单（把 spec 第 10 节内容复制进 AGENTS.md）→ 停止并回 `specs/.../spec.md` 第 10 节唯一权威口径；与既有条目表述冲突需改写旧条目 → 停止上报。
- **recovery**：owner=build-code 执行者；最小动作=`git checkout -- AGENTS.md` 后按只追加原则重写。
- **task risk**：硬规则与既有 AGENTS.md 条目表述冲突导致规则歧义被绕过；缓解=只追加不改写既有条目+例外口径逐字写清。
- **test tier / test method**：simple — 纯文本 grep 断言，无服务、无 fixture。
- **scenarios / commands / expected exit / oracle**：成功场景=同 gate_cmd，exit 0，输出 PASS；失败场景=锚点缺失，exit 非 0；seam 场景=与既有规则节条目共存不互相改写，同命令同 oracle。
- **fixtures_services**：N/A — 纯文本断言，无 fixture、无服务、无清理责任。
- **coverage limits**：仅覆盖硬规则文本成文锚点；不覆盖规则被实际遵守的程度（由本任务后续验证记录承担 AC-GOV-004 证据）。
- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：只在 AGENTS.md 规则节追加测试硬规则；未改写 M17 Stage Agent/vNext 条目。
- **executed_commands**：strict AGENTS/CONTEXT assertions；exit 0；`PASS-T801-STRICT`；最终聚合 grep 亦命中。
- **evidence_refs**：`quality/tests/p8-agents-green.log`
- **covered_ac**：`AC-GOV-004`
- **review_fact**：`quality/reviews/results/P8-phase-review.json` — unavailable，单次调用无 provider 输出，不重试。
- **completed_at**：`2026-09-06T02:58:23+0800`
- **执行事实**：规则成文并通过定向断言；规则遵守程度仍由本任务后续验证事实约束，未伪造 acceptance-green。

#### T802 — CONTEXT.md 术语登记（争议 findings/红蓝审查/需求框架/决策链）

- **ID**：T802
- **Phase**：Phase P8 — 治理登记与文档
- **goal**：在 CONTEXT.md 当前核心概念术语节登记四个尚缺术语：争议 findings、红蓝审查、需求框架、决策链；先复用 M17 已有术语，不重复定义，每条新增定义回指 spec 对应章节。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-602、A-04 → FR-GOV-006 / AC-GOV-006
- **输入**：spec.md 中四术语的定义章节；CONTEXT.md 核心概念术语节现有结构。
- **依赖**：T308（P3 落地后登记，术语定义以 P3 定稿口径为准）
- **并行**：是 — 与 T801 不同文件（CONTEXT.md vs AGENTS.md），可并行
- **FR**：FR-GOV-006
- **AC**：AC-GOV-006
- **动作**：只追加四条术语条目（一句话定义+回指 spec），不改写既有术语。
- **精确文件**：`CONTEXT.md`
- **boundary**：files: `CONTEXT.md`; symbols/regions: 核心概念术语节 L23 追加区
- **输出**：四术语成文且 grep 锚点命中；证据落盘 `quality/evidence/build-plan-or-T802.log`。
- **Knowledge**：术语定义必须与 spec 唯一权威一致，不产生第二份定义；R-010/R-012 锚定 spec 第 10 节"默认必须成立"（A-04 定案口径）。
- **verification_role**：N/A — non-behavior change: 文本卡，无行为变化；以可执行断言命令验证术语成文事实
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`bash -c "grep -q '争议 findings' CONTEXT.md && grep -q '红蓝审查' CONTEXT.md && grep -q '需求框架' CONTEXT.md && grep -q '决策链' CONTEXT.md && echo PASS"`
- **expected_exit**：0
- **oracle**：`ORACLE-GOVREG-01` — 四术语锚点全部命中，输出 PASS
- **evidence_path**：`quality/evidence/build-plan-or-T802.log`
- **STOP**：术语定义需要与 spec 不一致的表述 → 停止并回 spec.md 对应章节修正唯一权威后再登记。
- **recovery**：owner=build-code 执行者；最小动作=`git checkout -- CONTEXT.md` 后按 spec 口径重写四条目。
- **task risk**：术语一句话定义与 spec 长文口径漂移；缓解=每条显式回指 spec 章节号，定义只写索引级一句话。
- **test tier / test method**：simple — 纯文本 grep 断言，无服务、无 fixture。
- **scenarios / commands / expected exit / oracle**：成功场景=同 gate_cmd，exit 0，输出 PASS；失败场景=任一术语锚点缺失，exit 非 0；seam 场景=与既有术语节共存不改写旧条目，同命令同 oracle。
- **fixtures_services**：N/A — 纯文本断言，无 fixture、无服务、无清理责任。
- **coverage limits**：仅覆盖四术语成文锚点；不覆盖术语在技能文本中的一致使用（由各 phase 文本卡与异源审查承担）。
- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：只在 CONTEXT.md 核心术语节追加四条定义并回指 spec §5；未改写既有术语。
- **executed_commands**：strict CONTEXT assertions；exit 0；`PASS-T802-STRICT`；最终聚合亦命中。
- **evidence_refs**：`quality/evidence/build-plan-or-T802.log`
- **covered_ac**：`AC-GOV-006`
- **review_fact**：`quality/reviews/results/P8-phase-review.json` — unavailable，单次调用无 provider 输出，不重试。
- **completed_at**：`2026-09-06T02:58:23+0800`
- **执行事实**：四术语定义成文并通过定向断言；运行时语义不因术语登记被宣称通过。

#### T803 — AGENTS.md 治理边界节两条新控制面登记（问答工具卡+confirm 语义扩展）

- **ID**：T803
- **Phase**：Phase P8 — 治理登记与文档
- **goal**：在 AGENTS.md 当前治理边界节追加两条新控制面登记：①结构化问答工具卡（owner=各交互 stage 主会话；consumer=stage outcome 交互校验；删除条件=机制被替代）；②accepted_risk confirm 语义扩展（owner=build-spec 及相关 stage；consumer=处置校验 receipt 绑定检查；删除条件=风险接收机制被替代）；保留 M17 已有治理条目。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：D-602、A-04 → FR-GOV-006 / AC-GOV-006
- **输入**：T801 定稿后的 AGENTS.md；两条新控制面的 owner/consumer/删除条件口径（spec FR-GOV-006）。
- **依赖**：T801（同文件 AGENTS.md，串行避免冲突）
- **并行**：否 — 与 T801 同文件
- **FR**：FR-GOV-006
- **AC**：AC-GOV-006
- **动作**：只追加两条控制面登记条目，每条含 owner/consumer/删除条件三要素，不改写既有治理边界条目。
- **精确文件**：`AGENTS.md`
- **boundary**：files: `AGENTS.md`; symbols/regions: 当前治理边界节追加区
- **输出**：两条登记成文且 grep 锚点命中；证据落盘 `quality/evidence/build-plan-or-T803.log`。
- **Knowledge**：新控制面登记是 FR-GOV-006 的强制义务；删除条件触发时回 make-decision 评估移除；三要素缺一即不合规。
- **verification_role**：N/A — non-behavior change: 文本卡，无行为变化；以可执行断言命令验证登记成文事实
- **paired_task**：N/A — 文本卡无 RED/GREEN 对
- **gate_cmd**：`node -e "const s=require('node:fs').readFileSync('AGENTS.md','utf8');for(const n of ['结构化问答工具卡','confirm 语义扩展']){const i=s.indexOf(n);const x=s.slice(i,i+500);if(i<0||!x.includes('owner=')||!x.includes('consumer=')||!x.includes('删除条件='))process.exit(1)}console.log('PASS')"`
- **expected_exit**：0
- **oracle**：`ORACLE-GOVREG-01` — 两条控制面登记条目名（结构化问答工具卡/accepted_risk confirm 语义扩展）命中，输出 PASS
- **evidence_path**：`quality/evidence/build-plan-or-T803.log`
- **STOP**：治理登记缺 owner/consumer/删除条件任一要素 → 停止并回 spec.md FR-GOV-006；需要改写既有边界条目 → 停止上报。
- **recovery**：owner=build-code 执行者；最小动作=回退追加区后按三要素齐全口径重写两条目。
- **task risk**：登记要素不全或与 T801 追加区行区间冲突；缓解=与 T801 串行+追加区分离+三要素 checklist 逐条核对。
- **test tier / test method**：simple — 纯文本 grep 断言，无服务、无 fixture。
- **scenarios / commands / expected exit / oracle**：成功场景=同 gate_cmd，exit 0，输出 PASS；失败场景=要素锚点缺失，exit 非 0；seam 场景=与 T801 规则节追加区共存不互相覆盖，同命令同 oracle。
- **fixtures_services**：N/A — 纯文本断言，无 fixture、无服务、无清理责任。
- **coverage limits**：仅覆盖两条控制面登记文本锚点；不覆盖控制面机制本身正确性（由各机制所属 phase 承担）。
- **acceptance_role**：`implementation`
- **ui_scope**：`non_ui`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 AGENTS.md 当前治理边界节追加两条控制面登记；每条含 owner/consumer/删除条件；未改写既有条目。
- **executed_commands**：strict control-plane assertions；exit 0；`PASS-T803-STRICT`；最终聚合亦命中。
- **evidence_refs**：`quality/evidence/build-plan-or-T803.log`
- **covered_ac**：`AC-GOV-006`
- **review_fact**：`quality/reviews/results/P8-phase-review.json` — unavailable，单次调用无 provider 输出，不重试。
- **completed_at**：`2026-09-06T02:58:23+0800`
- **执行事实**：两条登记成文并通过三要素断言；未新增 stage/gate/公共入口。

#### T805 — build-code 真实运行观察与 phase evidence ledger

- **ID**：T805
- **Phase**：Phase P8 — 治理登记与文档
- **goal**：在 build-code 完成各 phase 实现与针对性测试后，执行真实 broker/host/dogfood 观察并汇总每 phase 的开发、测试绿、用户确认、异源审查四类证据；不能用 grep、旧 dogfood 或本地 fixture 冒充真实观察。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`；执行时若材料变化必须刷新
- **source_refs / decision_refs**：D-603、D-604、D-608 → AC-REV-004、AC-REV-006、AC-TALK-001~005、AC-DEB-001~003、AC-RES-001~003、AC-GOV-002/003/005
- **输入**：T101/T102 的确定性材料身份断言、T211 的合同断言、T305/T308 的交互实现、T401~T403 的 debate 产物、T501~T506 的 research 产物、P1~P8 当前质量事实。
- **依赖**：T403、T506、T601、T704、T801、T802、T803
- **并行**：否 — 读取全部 phase 末卡事实并在 T804 前汇合
- **FR**：FR-REV-004、FR-REV-006、FR-TALK-001~005、FR-DEB-001~003、FR-RES-001~003、FR-GOV-002/003/005
- **AC**：AC-REV-004、AC-REV-006、AC-TALK-001~005、AC-DEB-001~003、AC-RES-001~003、AC-GOV-002/003/005
- **动作**：使用现有公共 stage runtime 入口执行 make-decision/build-spec 的真实 host/provider 观察：node tools/cli/stage-runtime.mjs run --action=execute --stage=make-decision ... 与 node tools/cli/stage-runtime.mjs run --action=execute --stage=build-spec ...；按 skills/debate/SKILL.md 运行 debate mailbox/downgrade 观察，按 skills/deep-research/SKILL.md 运行 R0-R5 观察。每个 AC 写一个独立 JSON 观察证据，记录 command、exit、host/provider、material identity、结果状态、失败原因和证据 hash；外部服务缺失写 unavailable。最后写质量区的 phase-evidence-ledger.json，T804 只读核对该 ledger，不创建第二份完成权威。
- **精确文件**：`AGENTS.md`、`CONTEXT.md`
- **boundary**：只写任务质量区 evidence，不修改仓库生产文件；每个观察文件只绑定一个 AC 集合和当前 task/material identity；缺失外部依赖不得补写 pass。
- **输出**：真实运行观察证据与 phase-evidence-ledger.json；每个 phase 明确 development_ref、test_green_ref、human_confirmation_ref、heterologous_review_ref、status、unavailable_reason（如适用）。
- **Knowledge**：review/test/research/confirmation 都是事实；AC-REV-006 的 live broker 往返、AC-TALK-001/002/003/005、AC-DEB-001~003、AC-RES-001~003 的运行部分在本卡前不得宣称完成；用户确认必须来自用户实际回复。
- **verification_role**：N/A — non-behavior change: 真实观察与 phase evidence ledger 只记录质量事实，无 RED/GREEN 实现对
- **paired_task**：N/A — real-observation aggregate
- **gate_cmd**：node -e "const fs=require('node:fs');const p='quality/evidence/real-observation';const names=['ac-rev-004.json','ac-rev-006.json','ac-talk.json','ac-debate.json','ac-research.json'];for(const n of names){const v=JSON.parse(fs.readFileSync(p+'/'+n));if(!v.ac_ids||!v.status||!v.material_revision||!v.snapshot_tree)process.exit(1)};const l=JSON.parse(fs.readFileSync('quality/evidence/phase-evidence-ledger.json'));for(const phase of ['P1','P2','P3','P4','P5','P6','P7','P8']){const r=l.phases?.[phase];if(!r||!('development_ref' in r)||!('test_green_ref' in r)||!('human_confirmation_ref' in r)||!('heterologous_review_ref' in r)||!('status' in r))process.exit(1)}console.log('PASS-OBSERVATIONS')"
- **expected_exit**：0
- **oracle**：ORACLE-REAL-OBSERVATION-01 — 每个观察证据绑定当前 identity，phase ledger 四类 evidence 字段齐全；缺失项只产生 unavailable/incomplete，不伪造通过
- **evidence_path**：quality/evidence/real-observation/*.json、quality/evidence/phase-evidence-ledger.json
- **STOP**：任一观察缺 host/provider/identity/exit/失败原因，或把 unavailable 改写为 pass，停止并回 owning phase；不得通过补 grep 或重用旧 receipt 修复。
- **recovery**：保留原始观察输出，只重跑失败的单个 AC 观察；不删除失败事实，不回退整棵 worktree。
- **task risk**：把本地契约测试误当真实行为、把旧 receipt 当当前确认、或漏掉 phase 级用户确认/异源审查。
- **test tier / test method**：fullstack — backend-testing；真实 stage/host/provider seam + 任务质量 ledger 核对。
- **scenarios / commands / expected exit / oracle**：成功=全部可用观察与 ledger 字段齐全，exit 0；失败=外部 broker/host 不可用，保留原始失败并记 unavailable；状态=某 phase 用户确认未发生，ledger 记 incomplete；seam=观察文件与 ledger 使用相同 task/material identity。
- **fixtures_services**：真实 broker/provider/host 依赖按实际环境记录；不新增本地假服务；测试 fixture 仅用于确认 ledger 负例，执行后自清理。
- **coverage limits**：覆盖指定 AC 的真实运行部分与 phase 四类证据字段；不把文本断言、旧 dogfood、异源 review 内容本身当成行为通过。
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"quality/evidence/real-observation/ac-rev-006.json","sample":"live broker 往返结果与 material identity","scenario":"AC-REV-006 真实材料身份观察","tier":"service"},{"source":"quality/evidence/phase-evidence-ledger.json","sample":"P1-P8 四类 evidence ref/status","scenario":"AC-GOV-003 phase evidence ledger 汇合","tier":"command"}]`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：只写任务质量区 real-observation/*.json、phase-evidence-ledger.json 与 T805 日志；未修改仓库生产文件。
- **executed_commands**：make-decision/build-spec 公共 stage-runtime 各两次（最终一次绑定当前快照，均 exit 0/in_progress/incomplete）；T805 ledger gate exit 0；broker/debate/research 未执行部分按 unavailable 记录。
- **evidence_refs**：`quality/evidence/real-observation/ac-rev-004.json`、`ac-rev-006.json`、`ac-talk.json`、`ac-debate.json`、`ac-research.json`、`quality/evidence/phase-evidence-ledger.json`、`quality/evidence/build-code/T805-observation.log`
- **covered_ac**：`AC-REV-004`、`AC-REV-006`、`AC-TALK-001~005`、`AC-DEB-001~003`、`AC-RES-001~003`、`AC-GOV-002/003/005`
- **review_fact**：`quality/reviews/results/P8-phase-review.json` — unavailable；不把旧 dogfood 或旧 receipt 当成当前运行通过。
- **completed_at**：`2026-09-06T02:58:23+0800`
- **执行事实**：观察字段和当前 identity 完整；live broker、用户确认、debate、R0-R5 仍分别为 unavailable/incomplete，未伪造通过。

#### T804 — FINAL：各 phase 验收记录汇总核对+全量最终聚合验证

- **ID**：T804
- **Phase**：Phase P8 — 治理登记与文档
- **goal**：按 plan.md 预先设计的最终路线验证全部适用 AC、跨 phase seam 和当前完整测试事实；汇总核对每 phase 四类完成证据（开发+契约/测试绿+用户验收+异源审查），失败 phase 必须有 unavailable 记录；全任务 28 FR/28 AC 的 Traceability 表逐行可核对。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"872d97964496cc88d301bb789a3e88b99fe294711ad06c7b50b721fb438ddf85","id":"plan"}]`
- **source_refs / decision_refs**：全部适用 R*/D*（D-501/502、D-607、D-608、OPEN-02、A-04 等）→ 全部适用 FR/AC（28 FR / 28 AC，见 spec.md Traceability）
- **输入**：P1–P8 全部已完成 phase 的任务事实与证据；最终聚合路线（本卡 gate_cmd）。
- **依赖**：T506、T403、T601、T704、T801、T802、T803、T805（全 phase 末卡、真实观察 ledger 与并行分支汇合）
- **并行**：否 — aggregate reads all preceding task facts
- **FR**：FR-GOV-003（汇总核对）；其余 27 FR 由各 phase 卡承接（见 plan.md Traceability 表）
- **AC**：全部适用（28 AC，含 AC-GOV-003 汇总核对）
- **动作**：只执行一次最终聚合检查并记录真实退出码、oracle、覆盖范围和剩余风险；只读核对 T805 的 phase-evidence-ledger.json，逐 phase 检查 development_ref、test_green_ref、human_confirmation_ref、heterologous_review_ref；缺失或失败 phase 记 unavailable/incomplete；不创建新的状态权威。
- **精确文件**：`AGENTS.md`、`CONTEXT.md`
- **boundary**：files: `AGENTS.md`, `CONTEXT.md`; symbols/regions: P8 治理规则与术语只读核对；cross-phase inputs: skills/decision-log/templates/decision-log-template.md、tests/contract/decision-log-chain-warnings.test.mjs、workflows/make-decision/SKILL.md 与 phase-evidence-ledger.json；不修改任何生产或文档文件
- **输出**：最终测试与交接事实：聚合命令真实退出码、ORACLE-FINAL 判定、各 phase 证据汇总核对记录、剩余风险清单。
- **Knowledge**：所有前序任务的真实结果（各 phase quality/tests/ 证据与异源审查记录）；失败保留原始输出，不用重跑掩盖。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`bash -c "grep -q 'M/S/B/P' workflows/make-decision/SKILL.md && grep -q '研究 4' workflows/make-decision/SKILL.md && npx vitest run tests/contract/decision-log-chain-warnings.test.mjs && npx vitest run tests/stage-decision-contract.test.mjs && grep -q '只跑受影响针对性测试' AGENTS.md && grep -q '禁止全量' AGENTS.md && grep -q '红蓝审查' CONTEXT.md && grep -q '结构化问答工具卡' AGENTS.md && grep -q 'confirm 语义扩展' AGENTS.md && test -s quality/evidence/phase-evidence-ledger.json && echo PASS-FINAL"`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL` — 全部适用 AC 的机器可判部分、跨 phase seam（同文件分段共存、checker 不阻断、机器强制边界未破）与最终测试事实一次通过，输出 PASS-FINAL
- **evidence_path**：`quality/evidence/final-aggregate.log`
- **STOP**：最终命令不可执行、AC 缺失无法判定、需要越界修改文件或需要新决策 → 停止并回 owning material（spec.md/plan.md）。
- **recovery**：owner=build-code 执行者；最小动作=保留失败原始输出，回受影响的单个 task 修复后仅重跑该 task gate，再重跑本 FINAL 一次。
- **task risk**：聚合覆盖遗漏（漏掉某 phase seam）或把质量事实误写成通过；缓解=命令显式覆盖 P6/P7/P8 全部 gate 锚点+unavailable 如实记录。
- **test tier / test method**：fullstack（backend-testing）— 聚合命令横跨 CLI checker 契约测试、结构契约测试与多文件文本断言，属后端全链路聚合，无 UI/浏览器层。
- **scenarios / commands / expected exit / oracle**：成功场景=同 gate_cmd，exit 0，输出 PASS-FINAL；失败场景=任一锚点或测试红，exit 非 0，保留原始输出回受影响 task；状态场景=某 phase 质量事实缺失时记 unavailable 不伪造通过；seam 场景=P6 执行规划节与 P3/P5 同文件共存、P7 checker 不阻断、P8 治理登记三要素，全部同命令同 oracle。
- **fixtures_services**：复用 P7 测试自带 fixture；无新增服务；本卡只读运行，无清理责任。
- **coverage limits**：覆盖 P6/P7/P8 全部 gate 锚点、T805 phase ledger 字段与跨 phase seam 的机器可判部分；明确未覆盖=AC-DLOG-002 等 manual 判定项（留人工阅读记录）与各 phase 异源审查质量本身（审查记录仅核对存在性）。
- **acceptance_role**：acceptance
- **ui_scope**：`non_ui`
- **acceptance_data**：`[{"source":"workflows/make-decision/SKILL.md 执行规划节","sample":"grep 'M/S/B/P' 与 '研究 4' 命中","scenario":"P6 执行模型文本断言（ORACLE-EXECMODEL-01）","tier":"command"},{"source":"tests/contract/decision-log-chain-warnings.test.mjs","sample":"三类告警用例全绿且不阻断负例保持","scenario":"P7 告警 checker RED/GREEN 成对验证（ORACLE-DLOGWARN-01）","tier":"command"},{"source":"tests/stage-decision-contract.test.mjs","sample":"16 h2/覆盖/五维/R-NNN 结构校验全绿","scenario":"P7 机器强制边界未破（ORACLE-DLOGSTRUCT-01）","tier":"command"},{"source":"AGENTS.md 与 CONTEXT.md 治理登记","sample":"grep '只跑受影响针对性测试'/'禁止全量'/'红蓝审查'/'结构化问答工具卡'/'confirm 语义扩展' 命中","scenario":"P8 硬规则+术语+控制面登记断言（ORACLE-AGENTRULE-01/ORACLE-GOVREG-01）","tier":"command"},{"source":"各 phase 验收记录（quality/tests/ 与审查记录）","sample":"每 phase 四类完成证据齐全或失败 phase 有 unavailable 记录","scenario":"FR-GOV-003 汇总核对（AC-GOV-003）","tier":"command"}]`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：未修改生产文件；只读核对 AGENTS.md、CONTEXT.md、P6/P7 锚点和 phase-evidence-ledger。
- **executed_commands**：最终聚合修正路径后执行一次；两组定向 Vitest 共 34 tests 通过；phase ledger 字段检查通过；exit 0；`PASS-FINAL`。
- **evidence_refs**：`quality/evidence/build-code/T804-final-gate.log`
- **covered_ac**：全部适用 AC 的机器可判部分；人工确认、live broker、debate、research 与审查质量本身仍按 ledger 保留缺口。
- **review_fact**：不新增审查；P8 唯一审查事实见 `quality/reviews/results/P8-phase-review.json`，状态 unavailable。
- **completed_at**：`2026-09-06T02:58:23+0800`
- **执行事实**：`ORACLE-FINAL` 机器聚合通过；不能据此把整体任务或 phase ledger 宣称 acceptance-green。

### Verify

- **Target**：FR-GOV-003/004/006；AC-GOV-003/004/006；与既有治理文档 seam（只追加不改写）。
- **gate_cmd**：`bash -c "grep -q '只跑受影响针对性测试' AGENTS.md && grep -q '禁止全量' AGENTS.md && echo PASS"` 与 `grep -q '红蓝审查' CONTEXT.md && grep -q '结构化问答工具卡' AGENTS.md && grep -q 'confirm 语义扩展' AGENTS.md && echo PASS`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p8-agents-green.log`、`quality/evidence/build-plan-or-T802.log`、`quality/evidence/build-plan-or-T803.log`
- **Oracle**：ORACLE-AGENTRULE-01（硬规则成文）、ORACLE-GOVREG-01（术语+控制面登记成文）。

### Knowledge

D-607 硬规则的例外只有"用户或 CI 守卫明确要求"，本任务后续全部验证（含 phase 验收）按此执行并留记录（AC-GOV-004 证据）；新控制面登记是 FR-GOV-006 的强制义务，删除条件触发时回 make-decision 评估移除；R-010/R-012 两条贯穿性约束的锚定=spec 第 10 节"默认必须成立"（A-04 定案口径），验收分别挂 AC-GOV-003/005 与 AC-TALK-005/AC-DLOG-001。

### STOP

出现第二份非目标清单（AGENTS.md 复制 spec 第 10 节内容）→ 回 `specs/.../spec.md` 第 10 节唯一权威口径；治理登记缺 owner/consumer/删除条件任一要素 → 回 spec.md FR-GOV-006。

### Done

两条断言命令通过；AC-GOV-004/006 可判通过、AC-GOV-003 汇总核对记录落盘；本 phase 一次异源审查完成并记录；全任务 28 FR/28 AC 的 Traceability 表逐行可核对。

### Risks and rollback

- affected IDs：FR-GOV-003/004/006；trigger=硬规则与既有 AGENTS.md 条目表述冲突；consequence=规则歧义被绕过；mitigation=只追加不改写既有条目+例外口径逐字写清；rollback=`git revert` 本 phase 提交（纯文档追加，零行为影响）。

## Phase P9 — 当前四阻塞修复与重跑

### Goal

只修复当前 verify-code 质量链中已定位的四类阻塞：Stage Agent 结果缺失的可诊断性、wh-review broker 失败时的路由事实保留、human confirmation 的外部完成条件、以及 unavailable Stage Agent outcome 内层代码审查身份为空导致的二次 `stage_outcome_invalid`。复用现有 bridge、ReviewProviderClient、TaskKernel、`confirm` 路由和官方 stage runtime；不把 unavailable 改写为通过，不新增 stage/gate/public command/状态源/第五材料。

### Files

- **NEW**：N/A — 只修既有控制面和回归测试。
- **MODIFY**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`。
- **READ-ONLY INPUTS**：`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/task/task-kernel-implementation.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、当前 task store 的 canonical quality facts。
- **DO NOT TOUCH**：`CONSTITUTION.md`、`constitution-checklist.md`、`runtime/stage/stage-runner.mjs` 的 fail-closed 身份校验、`runtime/task/task-kernel-implementation.mjs` 的 confirm 语义、外部 `3rd-review` broker、旧 quality records；不新增 Stage Agent runner。

### T901 — 修复 unavailable verify-code 的内层 identity

- **ID**：T901
- **Phase**：Phase P9 — 当前四阻塞修复与重跑
- **goal**：unavailable verify-code outcome 的 `code_review` 与外层使用同一当前 `snapshot_tree/material_revision`，让真实 unavailable 进入 valid-unavailable 路径，而不是被误判为 `stage_outcome_invalid`。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"9fc5edfd0a2e7a393832b14a44ff81a048edc9e2cecf74f49bffd3dd5189d17f","id":"plan"}]`
- **source_refs / decision_refs**：D-607、D-608 → F9/F11/Q1/Q2；当前 blocker 4 诊断
- **输入**：现有 `publishUnavailableStageAgentOutcome`、`publishStageAgentOutcome`、`stage-runner` current identity 校验。
- **依赖**：T308、T704；无外部 provider 依赖
- **并行**：否 — 与 T902 共用 bridge producer contract，先修 publisher identity
- **FR**：不新增 FR；修复当前任务质量链绑定
- **AC**：不新增 AC；验证当前 valid-unavailable/invalid 分界
- **动作**：捕获一次当前 stage identity，传入 unavailable execution 和既有 publisher；不放宽 validator；补 verify-code bridge/outcome 回归断言。
- **精确文件**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/contract/host-outcome-bridge.test.mjs`
- **boundary**：`unavailableExecution`、`publishStageAgentOutcome`、`publishUnavailableStageAgentOutcome`；测试只验证内外层 identity 相等
- **输出**：current-bound unavailable outcome；旧 invalid record 不改写
- **Knowledge**：当前 stage runner 的 null/mismatch 拒绝是正确边界，修复 producer serializer，不改消费端 fail-closed 逻辑。
- **verification_role**：implementation
- **paired_task**：N/A — serializer repair
- **gate_cmd**：`npx vitest run tests/contract/host-outcome-bridge.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P9-BRIDGE-IDENTITY-01` — verify-code unavailable 内外层 snapshot/material identity 完全相等
- **evidence_path**：`quality/tests/p9-t901-host-outcome-green.log`
- **STOP**：出现 validator 放宽、null 被视为 current、或旧 record 被覆盖 → 停止回滚并回 stage adapter
- **recovery**：保留旧 canonical record，只回退本 task 的 adapter/test 增量
- **task risk**：publisher 与 unavailable builder 重新各自捕获 identity 造成竞态；缓解=同一 captured object 贯穿两者
- **test tier / test method**：contract — vitest fixture，无真实 provider
- **scenarios / commands / expected exit / oracle**：current unavailable=exit 0/identity equal；invalid stale input=既有测试仍拒绝；重复调用=同 attempt 不改写
- **fixtures_services**：复用 host-outcome fixture；无服务
- **coverage limits**：不证明真实 dsh/provider 可用，只证明 serializer 不再制造 invalid
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`stage-agent-outcome-adapter.mjs` 让 unavailable verify-code 的内层 code_review 复用同一 captured identity；未放宽 stage-runner validator。
- **executed_commands**：`npx vitest run tests/contract/host-outcome-bridge.test.mjs`；exit 0；9/9。
- **evidence_refs**：`quality/tests/p9-t901-host-outcome-green.log`
- **covered_ac**：N/A — repair task
- **review_fact**：不新增审查；按当前任务 review 事实保持 unavailable

### T902 — 强化 Stage Agent producer 边界与诊断

- **ID**：T902
- **Phase**：Phase P9 — 当前四阻塞修复与重跑
- **goal**：宿主没有 Stage Agent session 时明确要求 `session` 或 `unavailable` 恰好一个，并在 unavailable 中保留显式 source identity；不新增 WorkflowHub 内部 agent runner。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"9fc5edfd0a2e7a393832b14a44ff81a048edc9e2cecf74f49bffd3dd5189d17f","id":"plan"}]`
- **source_refs / decision_refs**：D-607、D-608 → F1/F6/F9/F11/Q1
- **输入**：现有 bridge stdin contract、Stage Agent handoff protocol、当前 dsh-code-review missing fact。
- **依赖**：T901
- **并行**：否 — 与 T901 共用 bridge contract
- **FR**：不新增 FR；修复 producer 失败的可诊断性
- **AC**：不新增 AC；当前 dsh missing fact 仍由外部 producer 完成
- **动作**：复用 bridge 增加 `BRIDGE_STAGE_AGENT_RESULT_MISSING` 明确错误；unavailable producer 保留 `source_id/source_family`；真实 session 仍只能由宿主提交。
- **精确文件**：`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/contract/host-outcome-bridge.test.mjs`
- **boundary**：bridge 输入分支与 unavailable provenance；不读旧 session/env、不扫描 transcript
- **输出**：缺 producer 的可定位错误或 truthful unavailable 记录
- **Knowledge**：dsh-code-review 不是 WorkflowHub 可自证的本地测试；没有宿主 session 就不能生成 code-review fact。
- **verification_role**：implementation
- **paired_task**：N/A — protocol repair
- **gate_cmd**：`npx vitest run tests/contract/host-outcome-bridge.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P9-PRODUCER-01` — 缺输入明确报 producer missing；unavailable 保留 source identity
- **evidence_path**：`quality/tests/p9-t902-producer-green.log`
- **STOP**：自动读取旧 session、自动猜测 dsh 结果、或启动第二 worker → 停止
- **recovery**：回退 bridge 诊断增量，保留原始 unavailable 事实
- **task risk**：错误码被误当成质量 gate；缓解=只作为 bridge 输入诊断，官方质量仍按 unavailable/incomplete
- **test tier / test method**：contract — vitest fixture
- **scenarios / commands / expected exit / oracle**：session/unavailable 恰好一个=exit 0；缺失/重复=明确 bridge error；旧 binding=不读取
- **fixtures_services**：复用 host-outcome fixture；无服务
- **coverage limits**：不提供真正 dsh session；需宿主后续补事实
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：bridge 缺 producer 时返回 `BRIDGE_STAGE_AGENT_RESULT_MISSING`；unavailable provenance 保留 source_id/source_family；未新增 agent runner。
- **executed_commands**：`npx vitest run tests/contract/host-outcome-bridge.test.mjs`；exit 0；9/9。
- **evidence_refs**：`quality/tests/p9-t902-producer-green.log`
- **covered_ac**：N/A — repair task
- **review_fact**：不新增审查；当前 dsh producer fact 仍 unavailable

### T903 — 保留 wh-review broker 失败的 route facts

- **ID**：T903
- **Phase**：Phase P9 — 当前四阻塞修复与重跑
- **goal**：broker 启动/timeout/cancel/无 semantic output 时，结果仍保留已经选定的 provider route；沿用现有 600s client wait 和 `deadline_ms:null`，不增加重试或新生命周期。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"9fc5edfd0a2e7a393832b14a44ff81a048edc9e2cecf74f49bffd3dd5189d17f","id":"plan"}]`
- **source_refs / decision_refs**：D-605、D-607 → F4/F9/F10/F11/Q1
- **输入**：`simple-review-runner` route selection、`ReviewProviderClient` timeout/deadline contract、当前 wh-review `REVIEW_CANCELLED` fact。
- **依赖**：T901；与 T902 可独立测试但在 P9 汇合
- **并行**：是 — 与 T902 不改同一运行时函数
- **FR**：不新增 FR；修复当前 provider failure observability
- **AC**：不新增 AC；当前 semantic review 仍需真实 provider output
- **动作**：在已有 `unavailableResult` 中保留 selected provider identities；回归 default timeout、request deadline null、错误码不降级成 provider unavailable。
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **只读回归输入**：`skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`
- **boundary**：`runSimpleReviewSingle` broker catch；不改 `provider-protocol.md`、不改外部 broker
- **输出**：带 route facts 的 truthful unavailable result
- **Knowledge**：外层 shell timeout 不能由 runner 消除；未来调用不得用短于默认窗口的 wrapper 终止真实 review；无结果不等于空 findings。
- **verification_role**：implementation
- **paired_task**：N/A — observability repair
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P9-WHREVIEW-01` — route facts preserved; default wait >=600s; protocol deadline null; timeout/cancel remains unavailable
- **evidence_path**：`quality/tests/p9-t903-wh-review-green.log`
- **STOP**：把 timeout/cancel 改为 clean/findings=[]、自动重试旧 attempt、或新增 broker state store → 停止
- **recovery**：回退 result observability 增量；保留已有 unavailable record
- **task risk**：新增字段被误当完成信号；缓解=字段只供诊断，quality fact 仍按 semantic output 判定
- **test tier / test method**：contract — vitest injected broker
- **scenarios / commands / expected exit / oracle**：route failure=exit 0/result unavailable+selection；default timeout=client >=600s；request deadline=null；malformed/timeout preserve typed code
- **fixtures_services**：注入 client/command fixture；无真实 provider
- **coverage limits**：不证明 provider authentication/model readiness；需要 T904 外部观察
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：broker invocation 失败时保留 selected provider route；沿用 600s default wait 与 `deadline_ms:null`，未加 retry/state store。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`；exit 0；31/31。
- **evidence_refs**：`quality/tests/p9-t903-wh-review-green.log`
- **covered_ac**：N/A — repair task
- **review_fact**：当前 wh-review semantic result 未产生，保持 unavailable

### T904 — 补齐四项外部事实，不由代码代填

- **ID**：T904
- **Phase**：Phase P9 — 当前四阻塞修复与重跑
- **goal**：在修复后的当前 identity 上，分别取得真实 dsh-code-review session、真实 wh-review semantic result、当前 verify-code e2e acceptance、用户当前 human confirmation；缺任一项就保持 incomplete。
- **design_state**：blocked_by_external_fact
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"9fc5edfd0a2e7a393832b14a44ff81a048edc9e2cecf74f49bffd3dd5189d17f","id":"plan"}]`
- **source_refs / decision_refs**：D-607、D-608 → F4/F7/F9/Q1/Q2/Q3
- **输入**：P9 T901/T902/T903 结果、当前 material revision/snapshot、用户真实 reply
- **依赖**：T901、T902、T903、T905 前置诊断
- **并行**：否 — 必须绑定同一 current identity
- **FR**：不新增 FR；完成当前质量事实闭环
- **AC**：当前 verify-code review/confirmation completeness
- **动作**：宿主通过 bridge 提交一个 current-bound session 或 truthful unavailable；wh-review 只执行一次当前 attempt 并写 canonical result/attempt；补齐当前 verify-code e2e acceptance；用户通过既有 `confirm` 路由提交 reply-text/step-slug。不可用时只记录原因。
- **精确文件**：外部 task quality 区 `quality/facts/`、`quality/reviews/`、`quality/evidence/stage-outcomes/`；仓库代码只读
- **boundary**：不生成 dsh/provider/user 事实，不接受旧 snapshot/旧 confirmation
- **输出**：四类当前 quality facts 或明确 unavailable/missing/incomplete
- **Knowledge**：confirmation 不是 commit/push/merge/close 授权；质量事实不是推进许可证。
- **verification_role**：acceptance
- **paired_task**：N/A — external evidence closure
- **gate_cmd**：`node tools/cli/stage-runtime.mjs status --action=begin --stage=verify-code --project=workflowhub --task=workflowhub-requirement-convergence-depth-20260905`
- **expected_exit**：0
- **oracle**：`ORACLE-P9-EXTERNAL-01` — 当前 identity 下四类事实逐项可追溯；缺失项保持明确状态
- **evidence_path**：task store canonical quality facts and current stage outcome
- **STOP**：任何旧 receipt、summary、placeholder、empty findings 被当作当前事实 → 停止
- **recovery**：只补缺失的单项外部事实，不重复未变化的 review
- **task risk**：把 producer unavailable 当成实现缺陷，或把 confirmation 当 close authorization；缓解=分别记录 owner/状态/identity
- **test tier / test method**：service/manual — host/provider/user seam
- **scenarios / commands / expected exit / oracle**：四者齐=可继续验收；任一缺=exit 0/incomplete，不伪造完成
- **fixtures_services**：真实 host/provider/user；不新增 fixture service
- **coverage limits**：当前环境无法自行制造外部事实；最终状态以 task store 记录为准
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"quality/facts/","sample":"当前 dsh-code-review、E2E、Stage Agent、human_confirmation 四类事实状态","scenario":"P9 外部质量事实闭环核对（ORACLE-P9-EXTERNAL-01）","tier":"command"}]`

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`incomplete`
- **actual_changes**：先核查 dsh-code-review 入口，确认当前宿主没有可执行文件；把最终验收的 E2E 契约修正为 T905 的 `e2e_scope=not_required`，不伪造浏览器或服务 E2E；材料刷新后仅通过 bridge 写入新的 truthful Stage Agent unavailable outcome。此前 human_confirmation 绑定旧 material identity，刷新后不再冒充当前确认。
- **executed_commands**：`command -v dsh-code-review`（未找到）；任务 acceptance projection 修正后 `status=ready`、`e2e_scope=not_required`、无 contract errors；bridge attempt `attempt-verify-code-p9-current-20260906-v3` 使用 `agent_run_id === attempt_id`，结果 unavailable；官方 verify-code/status 待最后一次执行。
- **evidence_refs**：`quality/evidence/stage-outcomes/verify-code/` 当前 attempt、原始 E2E deferred 证据、旧 human_confirmation（仅作历史 provenance，不作当前通过）
- **covered_ac**：当前 verify-code quality completeness（未完成）
- **review_fact**：current human confirmation 已满足；dsh-code-review、wh-review/e2e 与 stage outcome 仍为当前 missing/unavailable/incomplete，未改写为通过

### T905 — 修复后官方重跑与阻塞核对

- **ID**：T905
- **Phase**：Phase P9 — 当前四阻塞修复与重跑
- **goal**：修复后只重跑一次官方 verify-code/status，确认 serializer invalid blocker 消失，并输出剩余外部阻塞。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-requirement-convergence-depth-20260905/spec.md","hash":"bf1d203fa92b4ff3881ef40912fd67a2acbfe6c2975ea90a058ac74b9347e72f","id":"spec"},{"artifact_kind":"plan","ref":"specs/workflowhub-requirement-convergence-depth-20260905/plan.md","hash":"9fc5edfd0a2e7a393832b14a44ff81a048edc9e2cecf74f49bffd3dd5189d17f","id":"plan"}]`
- **source_refs / decision_refs**：D-607、D-608 → F9/F11/Q1/Q2
- **输入**：T901/T902/T903 定向测试、当前 stage outcome、current task facts
- **依赖**：T901、T902、T903
- **并行**：否 — 汇合检查
- **FR**：不新增 FR；当前任务重跑
- **AC**：当前 verify-code completeness status
- **动作**：发布一个新 attempt 的 truthful unavailable outcome（不重放旧 attempt），运行官方 stage route 和 status；只报告现状，不重试 provider/user。
- **精确文件**：`tools/cli/stage-runtime.mjs`、外部 task quality 区（执行事实）；不修改旧 record
- **boundary**：只读仓库材料+写一个新 current outcome/质量事实；不提交/推送/合并/归档/清理
- **输出**：当前 stage outcome diagnostic、quality missing/actionable_now、剩余阻塞列表
- **Knowledge**：valid unavailable 仍是 incomplete；只有实际 semantic review、current dsh result、user reply 到达后才可能收敛。
- **verification_role**：acceptance
- **paired_task**：N/A — aggregate rerun
- **gate_cmd**：`node tools/cli/stage-runtime.mjs status --action=begin --stage=verify-code --project=workflowhub --task=workflowhub-requirement-convergence-depth-20260905`
- **expected_exit**：0
- **oracle**：`ORACLE-P9-RERUN-01` — 不再出现 inner-null 导致的 stage_outcome_invalid；剩余 blocker 逐项保留
- **evidence_path**：`quality/evidence/build-code/p9-t905-rerun.log`
- **STOP**：status 仍指向旧 identity、命令改写旧 facts、或把 unavailable 变成 completed → 停止
- **recovery**：保留新诊断，回 T901/T902/T903 对应 owner，不重复 unchanged review
- **task risk**：只看 exit 0 误判完成；缓解=同时核对 quality_status、missing、diagnostic reason 和 identity
- **test tier / test method**：integration — official stage runtime/status
- **scenarios / commands / expected exit / oracle**：current unavailable=exit 0/incomplete；inner identity mismatch 不应出现；missing external facts 明确列出
- **fixtures_services**：复用当前 task store；无新增服务
- **coverage limits**：不覆盖真实 provider semantic quality、用户判断质量、发布/关闭
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **e2e_scope**：`not_required`
- **acceptance_data**：`[{"source":"quality/evidence/build-code/p9-t905-rerun.log","sample":"当前 verify-code identity、外部事实状态与官方重跑诊断","scenario":"P9 当前质量事实闭环核对（ORACLE-P9-RERUN-01）","tier":"command"}]`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：修正最终验收任务的 typed E2E 契约位置，使 acceptance projection 恢复 `ready`；材料刷新后使用新 attempt 重新绑定当前 Stage Agent unavailable outcome，未修改旧 facts。
- **executed_commands**：bridge attempt `attempt-verify-code-p9-current-20260906-v3`；随后只执行一次官方 `stage-runtime run --action=execute --stage=verify-code` 与 `stage-runtime status --action=begin --stage=verify-code`。
- **evidence_refs**：`quality/evidence/build-code/p9-t905-rerun.log`
- **covered_ac**：当前 verify-code quality completeness
- **review_fact**：不新增审查；只复核当前 facts

### Verify

- `npx vitest run tests/contract/host-outcome-bridge.test.mjs` → 0（ORACLE-P9-BRIDGE-01）。
- `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs` → 0（ORACLE-P9-WHREVIEW-01）。
- 官方 `stage-runtime run --action=execute --stage=verify-code` 与 `stage-runtime status` 只运行一次；`stage_outcome_diagnostic.reason` 不得再是由 inner null identity 引起的 `stage_outcome_invalid`。

### Knowledge

Stage Agent、异源 provider 和用户确认是外部生产者/用户事实。F1/F10 禁止把它们的 runner、重试、后台生命周期或新状态机塞回 WorkflowHub；F4/F9/Q1 要求缺失事实保持 unavailable/missing/incomplete。T901 只修 serializer，T902/T903 只提高现有边界的可诊断性；若外部事实仍缺，P9 可以物理完成但当前任务不能宣称 acceptance-green。

### STOP

需要放宽 `stage-runner` 当前 identity 校验、把 broker timeout/cancel 改成 clean、自动写 human confirmation、启动第二个 Stage Agent/worker、或新增 public command/gate → 停止并回 decision-log/spec，不在本 phase 越界。

### Done

T901/T902/T903 的定向测试通过；官方重跑能区分 valid unavailable 与 invalid outcome；T904 只有收到四类真实外部事实后才可完成，否则保留缺失项；T905 输出当前质量状态与剩余阻塞，不把机器测试绿当 acceptance-green。

### Risks and rollback

- affected IDs：当前 verify-code 的质量事实绑定与失败可诊断性，不新增 FR/AC；trigger=host serializer、bridge 输入或 broker transport 失败；consequence=真实 unavailable 被二次误报 invalid，或 provider 路由无法追溯；mitigation=同一 identity 绑定、显式 producer 错误、保留 provider_selection、回归测试；rollback=`git revert` P9 代码/测试变更，旧 canonical records 只读保留不删除。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack / backend-testing — 聚合命令横跨 CLI checker 契约测试、结构契约测试与多文件文本断言，后端全链路聚合，无 UI/浏览器层。
- **scenarios**：全部适用 AC（28 AC）的机器可判场景+成功/失败/状态场景+跨 phase seam：P6 执行规划节与 P3/P5 同文件分段共存、P7 告警 checker 只打印不阻断、P7 模板改动后 16 h2 机器强制边界未破、P8 治理登记三要素齐全且只追加不改写；manual 判定项（AC-DLOG-002 等）留人工阅读记录，不伪造通过。
- **command**: `grep -q 'M/S/B/P' workflows/make-decision/SKILL.md && grep -q '研究 4' workflows/make-decision/SKILL.md && npx vitest run tests/contract/decision-log-chain-warnings.test.mjs && npx vitest run tests/stage-decision-contract.test.mjs && grep -q '只跑受影响针对性测试' AGENTS.md && grep -q '禁止全量' AGENTS.md && grep -q '红蓝审查' CONTEXT.md && grep -q '结构化问答工具卡' AGENTS.md && grep -q 'confirm 语义扩展' AGENTS.md && echo PASS-FINAL`
- **expected exit**：0
- **oracle**：`ORACLE-FINAL` — 与 T804 FINAL 卡同命令同 oracle：全部适用 AC 机器可判部分、跨 phase seam 与最终测试事实一次通过，输出 PASS-FINAL。
- **fixtures_services**：复用 P7 测试自带 fixture；无新增服务；聚合只读运行，无清理责任。
- **evidence_path**：`quality/evidence/final-aggregate.log`
- **coverage limits**：覆盖 P6/P7/P8 全部 gate 锚点与跨 phase seam 机器可判部分；明确未覆盖=manual 判定项（人工阅读记录）与各 phase 异源审查质量本身（仅核对记录存在性）。
- **STOP**：命令损坏、AC 缺失无法判定、边界越界或需要新决策 → 回 owning material（spec.md/plan.md）。
- **execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task 修复，不用全量重跑掩盖局部失败。

## Dependency Graph

- **order**：T101 → … → T105（P1）→ T201 → … → T212（P2）→ T301 → … → T308（P3 末）→ T401 → T402 → T403（P4 登记收敛）→ T501 → … → T506（P5 末）→ T601（P6）→ T801 → T803 → T805（真实观察 ledger）→ T804（历史 FINAL）；P4 的技能文件可与 P2/P3 并行，但 T403 在 P5 前汇合；P7 为并行分支（T701 依赖 none，与 P3–P6 并行），在 T804 前汇合；T802 与 T801 并行；T804 全局终验依赖全 phase 末卡、T805 与并行分支汇合（T506、T403、T601、T704、T801、T802、T803、T805）。P9 修复轨道：T901 → T902；T901 → T903；T901/T902/T903 → T905 → T904。

```text
主线：T101 → … → T105 (P1) → T201 → … → T212 (P2) → T301 → … → T308 (P3)
                                                              │
P4 并行分支：T401 → T402 → T403 (P4，与 P2/P3 并行，登记文件在 P5 前汇合) ──────────┤
                                                              ▼
                                        T501 → … → T506 (P5) → T601 (P6) ─┐
                                                                              ▼
P7 并行分支：T701 → T702 → T703 (RED) → T704 (GREEN)（独立文件，与 P3–P6 并行）→ T804 前汇合
                                                                              ▼
                              T801 (依赖 T308) ──并行── T802 (依赖 T308)
                                   │
                                   ▼
                              T803 (依赖 T801，同文件串行)
                                   │
                                   ▼
                              T805 (真实观察 ledger) → T804 (FINAL，依赖 T506、T403、T601、T704、T801、T802、T803、T805)
```

## Final Boundary Check

- [ ] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [ ] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [ ] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [ ] 依赖无环，FR/AC 双向追溯闭合，未知事实没有被写成假设或通过。
- [ ] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。
