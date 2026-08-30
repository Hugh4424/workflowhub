# 任务清单：stage-reflection 每阶段自动复盘器与判断层页面

> 由 plan.md 导出。每条任务独立可验证，失败时返回对应 STOP 条件。RED/GREEN 对共享同一 gate_cmd 与 oracle。完成区（status/执行事实）初始为 pending，执行后填写。

## 任务列表

### T0. Phase 0 硬约束：m15-retirement 合并 main 复核

- **ID**: T0
- **Phase**: Phase 0（build-code 前置硬约束）
- **tier**: simple
- **goal**: 确认 m15-retirement 已合并 main，复核其最终 diff 与保留符号集，确认本任务不依赖任何被删文件。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#ac-011]
- **source_refs**: [decision-log.md#R-011, decision-log.md#F-014, decision-log.md#RISK-005]
- **decision_refs**: [decision-log.md#D-008, decision-log.md#D-012]
- **输入**: main 分支当前 HEAD；m15-retirement 分支（预期 `task/workflowhub/m15-retirement`，以实际为准）；m15-retirement 的 spec/plan。
- **依赖**: []
- **并行**: []
- **FR**: （过程约束，无对应 FR 编号；绑定 AC-011）
- **AC**: AC-011
- **动作**: 证据化核验五项（**禁止关键词放行**；每项须附可复跑命令与真实输出摘要，五项未齐前 build-code 不得开工）：①main 检出中监控四件套逐文件断言不存在——四个文件路径以 `absent: <path>` 行写入复核记录，gate 逐条 `test ! -e` 机器复验；②保留符号集 grep 断言存在——以 `present: <符号>@<文件>` 行写入记录，gate 逐条 grep 机器复验（保留符号集=需求认证/step-skill 事件/stage outcome/facts 通用读写）；③task-store 分类器状态符合 m15-retirement 后期望（附分类器命令、退出码与输出摘要）；④m15 最终 diff 摘要人工复核记录（diff 摘要 + 复核人 + 复核结论）；⑤用户确认记录（用户显式确认 m15 已合并 main 且与本计划无冲突，含确认人与时间）；另检查 m15-retirement 分支已合并 main（ancestry 检查；m15 worktree git 对象库损坏时以远端或用户提供证据替代并如实记录），对照本任务目标文件清单（plan.md 关键文件节）确认零依赖被删文件；全部结论写入 `quality/evidence/m15-merge-review.md`。
- **精确文件**: `quality/evidence/m15-merge-review.md`
- **boundary**: 无代码改动；不修改 m15-retirement 的任何材料或代码；不动历史数据。
- **输出**: 五项证据化核验落盘且①②由 gate 机器复验通过；合并事实与保留符号集有据可查；五项未齐前 build-code 不得开工。
- **Knowledge**: m15 监控四件套已删未提交；对象库损坏无法看 log；阶段自记录机制写死保留。
- **verification_role**: manual
- **paired_task**: T20
- **gate_cmd**: `bash -c 'set -e; f=quality/evidence/m15-merge-review.md; test -s "$f"; for s in 四件套 保留符号 分类器 "diff 摘要" 用户确认; do grep -q "$s" "$f"; done; grep "^absent: " "$f" | cut -d" " -f2- | while read -r p; do test ! -e "$p" || { echo "GATE FAIL 仍存在: $p"; exit 1; }; done; grep "^present: " "$f" | cut -d" " -f2- | while read -r l; do grep -q "${l%%@*}" "${l##*@}" || { echo "GATE FAIL 缺符号: $l"; exit 1; }; done; git merge-base --is-ancestor task/workflowhub/m15-retirement main || grep -q "替代证据" "$f"'`
- **expected_exit**: 0
- **oracle**: 复核记录含五项核验小节；①②由 gate 对记录内 absent/present 清单逐条机器复验（非关键词放行）；每项附可复跑命令与真实输出摘要/退出码；ancestry 检查通过，或记录中显式含替代证据说明（对象库损坏情形下不伪造 git 事实）；用户确认记录含确认人与时间。
- **evidence_path**: `quality/evidence/m15-merge-review.md`
- **STOP**: m15-retirement 未合并 main、五项核验任一缺失或机器复验失败、或复核发现保留符号集与本计划冲突——停止一切 build-code 工作，升级人工并同步 spec/plan。
- **recovery**: 无代码回滚；修订计划后重新复核。
- **task risk**: 分支名与预期不符；对象库损坏导致 ancestry 检查不可用。
- **完成区**: status: completed；执行事实: 2026-08-30 五项核验全部通过（①监控删除面 10/10 不存在 ②保留符号集 6/6 存在 ③task-store 零残留 ④merge ff6e5cd18 diff 复核：与本任务触碰面唯一重叠=move-map.json（加法登记无冲突）⑤用户确认「我已经把 m15-retirement 合并到 main」）；任务分支 fast-forward 至 4746eaba8，四材料与 ADR 0021 完好；证据：quality/evidence/m15-merge-review.md。

### T1-RED. 数据面行为测试 RED

- **ID**: T1
- **Phase**: Phase 1（build-code）
- **tier**: simple
- **goal**: 在实现前证明数据面四个测试当前失败。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-out-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-edge-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-lesson-001]
- **source_refs**: [decision-log.md#F-009, decision-log.md#F-010]
- **decision_refs**: [decision-log.md#D-004, decision-log.md#D-005, decision-log.md#D-007]
- **输入**: spec §5.1~5.7 schema 草案；现有白名单位置行号。
- **依赖**: [T0]
- **并行**: [T7]
- **FR**: FR-OUT-001~004、FR-EDGE-001~002、FR-LESSON-001~004
- **AC**: AC-002、AC-004、AC-005
- **动作**: 先创建四个测试文件：`tests/contract/stage-reflection-schema.test.mjs`（加载 runtime/schemas/stage-reflection.v1.json 并校验正/反例 fixture：record_kind=judgment、七取值、无质量打分字段、evidence_refs 非编造形态）、`tests/contract/stage-reflection-paths.test.mjs`（quality/stage-reflection/&lt;stage&gt;.json 被四处白名单接受且不被 quality-fact 通道校验）、`tests/contract/derive-consumption-edges.test.mjs`（fixture outcome 派生消费边：有引用→边、无引用→unknown；input_refs 字符串数组与 evidence_refs {ref,sha256} 对象数组两种形态）、`tests/contract/lessons-jsonl.test.mjs`（append CLI 追加 raw_observation；merged_lesson 行格式；失败不合并），再运行，预期因 schema/白名单/脚本不存在而失败。
- **精确文件**: `tests/contract/stage-reflection-schema.test.mjs`、`tests/contract/stage-reflection-paths.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/lessons-jsonl.test.mjs`
- **boundary**: 只创建测试并记录 RED 事实；不改任何生产文件。
- **输出**: 四个测试文件存在且可运行；退出码非 0；失败来自行为/文件缺失断言而非语法错误，记录为 RED 证据。
- **Knowledge**: F9 要求行为变更先 RED 再 GREEN。
- **verification_role**: RED
- **paired_task**: T6
- **gate_cmd**: `npx vitest run tests/contract/stage-reflection-schema.test.mjs tests/contract/stage-reflection-paths.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/lessons-jsonl.test.mjs`
- **expected_exit**: 1
- **oracle**: 测试文件已创建且语法可运行；失败输出显示目标文件/行为缺失（schema 不存在、白名单拒绝、CLI 不存在），证明 RED 来自未实现而非环境。
- **evidence_path**: `tests/contract/stage-reflection-schema.test.mjs`
- **STOP**: 若测试意外通过，说明能力已存在或测试错误，重新评估。
- **recovery**: 删除测试文件并保留 RED 事实。
- **task risk**: 测试引用不存在的模块导致 import 错误被误判为行为 RED——oracle 已区分。
- **完成区**: status: pending；执行事实: 待填。

### T2. 新增 runtime/schemas/stage-reflection.v1.json

- **ID**: T2
- **Phase**: Phase 1（build-code）
- **tier**: simple
- **goal**: 把 spec §5.1~5.3 定稿为正式 JSON Schema 文件。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-out-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-sev-001]
- **source_refs**: [decision-log.md#R-005, decision-log.md#R-014, decision-log.md#F-012]
- **decision_refs**: [decision-log.md#D-005, decision-log.md#D-006]
- **输入**: spec §5.1~5.4（schema 草案 + severity 三档）；T1 RED 测试。
- **依赖**: [T1]
- **并行**: [T7, T8, T9]
- **FR**: FR-OUT-001~004、FR-SEV-001~002
- **AC**: AC-002
- **动作**: 新增 `runtime/schemas/stage-reflection.v1.json`：`schema_version` 固定 `stage-reflection.v1`；`record_kind` 枚举仅 `judgment`；`stage` 枚举五阶段；`stage_status∈{completed,failed}`；`status∈{ok,degraded,failed}`；`error` 条件非空（status=failed 时 summary 非空字符串，否则 null）；judgments[] 条目七取值 classification（keep/optimize/simplify/merge/remove_candidate/add/needs_evidence）、severity/confidence 三档、evidence_refs 数组、reason/next_review_trigger 非空；interventions[] 与 lessons_added[] 按 §5.3；**禁止任何质量打分字段**（schema 中不存在 score/grade/quality 字段，测试断言）；在 `docs/architecture/move-map.json` 登记（唯一 consumer=stage-reflection 技能与页面投影器/owner=workflowhub runtime/删除条件=技能退役）。
- **精确文件**: `runtime/schemas/stage-reflection.v1.json`、`docs/architecture/move-map.json`
- **boundary**: 不新增 human-confirmation v3 独立 schema 文件（§5.5 决策：v3 内联跟随 v2 模式）；不改 `runtime/schemas/human-confirmation.v1.schema.json`；不改 `quality-fact.v1.json`。
- **输出**: schema 测试（stage-reflection-schema）转绿；move-map 登记齐备。
- **Knowledge**: 文件身份判断层，judgment≠fact（ADR 0021）。
- **verification_role**: test
- **paired_task**: T3
- **gate_cmd**: `npx vitest run tests/contract/stage-reflection-schema.test.mjs`
- **expected_exit**: 0
- **oracle**: 正例 fixture 通过、反例（缺 record_kind/非法 classification/含打分字段/error 形态错）全部拒绝。
- **evidence_path**: `runtime/schemas/stage-reflection.v1.json`
- **STOP**: 若 schema 需要引用质量打分概念才能闭合，停止——规格冲突，升级人工。
- **recovery**: 删除 schema 文件并保留 RED 事实。
- **task risk**: schema 过严把合法 degraded/failed 记录判非法。
- **完成区**: status: pending；执行事实: 待填。

### T3. quality/stage-reflection/ 路径白名单登记

- **ID**: T3
- **Phase**: Phase 1（build-code）
- **tier**: simple
- **goal**: 四处路径白名单接受 `quality/stage-reflection/` 为合法任务产物路径。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-out-001]
- **source_refs**: [decision-log.md#R-005]
- **decision_refs**: [decision-log.md#D-005]
- **输入**: 已核实的登记点行号；T1 RED 测试。
- **依赖**: [T1, T2]
- **并行**: [T7, T8]
- **FR**: FR-OUT-001
- **AC**: AC-002
- **动作**: 在 `runtime/stage/stage-handlers.mjs:64-71,224`、`runtime/stage/stage-runner.mjs:38`、`runtime/task/task-kernel-implementation.mjs:29,74`、`runtime/evidence/canonical-evidence-validators.mjs:219` 四处白名单登记 `quality/stage-reflection/`；登记时确保 stage-reflection 文件走独立 schema 通道（stage-reflection.v1），**不进入** quality-fact 校验通道（quality-fact.v1.json 的 stage 枚举写死五阶段且 additionalProperties:false，不得为登记而修改它）。
- **精确文件**: `runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/evidence/canonical-evidence-validators.mjs`
- **boundary**: 只加白名单条目；不改 quality-fact.v1.json 的 stage 枚举与 additionalProperties；不改任何校验逻辑语义。
- **输出**: stage-reflection-paths 测试转绿；既有 quality/evidence 相关回归不破坏。
- **Knowledge**: 行号来自 build-plan 调研锚点，执行时以符号定位复核行号漂移。
- **verification_role**: test
- **paired_task**: T2
- **gate_cmd**: `npx vitest run tests/contract/stage-reflection-paths.test.mjs`
- **expected_exit**: 0
- **oracle**: fixture 的 quality/stage-reflection/&lt;stage&gt;.json 被写入与校验路径接受；quality-fact.v1.json 内容零改动（测试断言其 stage 枚举与 additionalProperties 保持原值）。
- **evidence_path**: `tests/contract/stage-reflection-paths.test.mjs`
- **STOP**: 若登记破坏既有 quality/evidence 校验（回归失败），停止并回退，重新评估登记点。
- **recovery**: git revert 四处登记改动。
- **task risk**: 行号漂移导致误登记到错误白名单段。
- **完成区**: status: pending；执行事实: 待填。

### T4. 补丁 B：tools/cli/derive-consumption-edges.mjs 消费边派生

- **ID**: T4
- **Phase**: Phase 1（build-code）
- **tier**: feature
- **goal**: 纯脚本从 stage outcome 派生消费边，无引用记 unknown，零 AI 成本。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-edge-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-edge-002]
- **source_refs**: [decision-log.md#T-006, decision-log.md#F-009]
- **decision_refs**: [decision-log.md#D-004, decision-log.md#G-002]
- **输入**: `quality/evidence/stage-outcomes/<stage>/<sha256>.json`（schema workflowhub-stage-outcomes.v1）；T1 RED 测试。
- **依赖**: [T1]
- **并行**: [T7, T8, T9]
- **FR**: FR-EDGE-001~002
- **AC**: AC-004、AC-010
- **动作**: 新增 `tools/cli/derive-consumption-edges.mjs`（CLI 惯例：ESM + 严格 --key=value 白名单 + 入口守卫 + stdout JSON + 失败 exit 1 + --root 支持 fixture）：遍历任务各 stage outcome，逐 step_outcomes 提取 `input_refs`（字符串数组形态）与 `evidence_refs`（{ref,sha256} 对象数组形态，取 ref 字段）——两种形态分别处理不得混用；按 spec §5.7 派生规则生成消费边（X 的 evidence_refs 引用出现在同任务后续 Y 的 input_refs → 边 X→Y）；保守语义：无后续引用的产出记 `unknown`，不得判无用；引用未登记/记录缺失/历史任务一律 unknown；只读重算，不回写历史；move-map 登记（consumer=build-reflection-page 与复盘 remove 门槛/owner/删除条件）。
- **精确文件**: `tools/cli/derive-consumption-edges.mjs`、`docs/architecture/move-map.json`
- **boundary**: 不新增任何运行时埋点；不修改 outcome 写入方；不判"无用"。
- **输出**: derive-consumption-edges 测试转绿（有引用→边、无引用→unknown、双形态解析）。
- **Knowledge**: step_outcomes[i].input_refs=字符串数组、evidence_refs={ref,sha256} 对象数组（调研锚点）。
- **verification_role**: test
- **paired_task**: T5
- **gate_cmd**: `npx vitest run tests/contract/derive-consumption-edges.test.mjs`
- **expected_exit**: 0
- **oracle**: fixture 中已登记引用的产出显示消费边；无引用产出显示 unknown 且输出中不出现"无用/unused"判定；两种引用形态各自解析正确；缺失记录输入不崩溃、记 unknown。
- **evidence_path**: `tools/cli/derive-consumption-edges.mjs`
- **STOP**: 若派生需要改写历史 outcome 才能成立，停止——规格要求只读派生。
- **recovery**: 删除脚本与 move-map 条目，保留 RED 事实。
- **task risk**: outcome 真实结构与锚点描述不符（行内联调时以实际 fixture 为准并记录差异）。
- **完成区**: status: pending；执行事实: 待填。

### T5. lessons 机器追加 CLI 与 JSONL 读写约定

- **ID**: T5
- **Phase**: Phase 1（build-code）
- **tier**: feature
- **goal**: 机器零 AI 成本无条件追加 raw_observation（runner 机器前奏为主消费）；merged_lesson 写回约定成型且可测试。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-lesson-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-lesson-004]
- **source_refs**: [decision-log.md#R-010, decision-log.md#FND-004]
- **decision_refs**: [decision-log.md#D-007, decision-log.md#G-003]
- **输入**: spec §5.6 两类行格式；T1 RED 测试。
- **依赖**: [T1]
- **并行**: [T4, T7, T8, T9]
- **FR**: FR-LESSON-001~004
- **AC**: AC-005
- **动作**: 新增 `tools/cli/append-lesson-observation.mjs`（CLI 惯例同上）：参数 `--root=<storageRoot> --proj=<proj> --stage=<stage> --task-id=<id> --text=<观察原文> --reflection-ref=<path>`，向 `<storageRoot>/Projects/<proj>/lessons/<stage>.jsonl` 追加一行 raw_observation（entry_id 生成、observed_at、merged:false）；目录不存在则创建；追加失败 exit 1 且 stdout JSON 含错误摘要；测试同时固化 merged_lesson 行格式 fixture（occurrence_count/source_refs/supersedes）与"失败不合并"语义（只追加 raw，不产 merged）；move-map 登记（consumer=stage-runner 机器前奏（主消费：runner 在执行复盘技能前自动调用，零 AI 成本，不依赖主会话是否启动技能；技能超时/未启动/失败时 raw 已落盘）与 build-reflection-page/owner/删除条件）。
- **精确文件**: `tools/cli/append-lesson-observation.mjs`、`docs/architecture/move-map.json`
- **boundary**: 合并去重写回（merged_lesson）不在本 CLI——由复盘会话按 SKILL.md 协议执行（T11）；本 CLI 只做无条件追加；接线由 runner 机器前奏承担（T23），技能超时/未启动/失败三场景的 raw 落盘测试见 T22/T24；不写仓内路径。
- **输出**: lessons-jsonl 测试转绿（追加正确、格式 fixture 合规、失败语义）。
- **Knowledge**: 写回与复盘成败解耦防污染（FND-004/D-007）；冷启动从零积累（G-003）。
- **verification_role**: test
- **paired_task**: T4
- **gate_cmd**: `npx vitest run tests/contract/lessons-jsonl.test.mjs`
- **expected_exit**: 0
- **oracle**: 追加后文件含合法 raw_observation 行（字段齐备、merged:false）；重复追加不丢行；merged_lesson fixture 通过格式校验；模拟复盘失败路径不产生 merged 行且既有 merged 行字节级不变。
- **evidence_path**: `tools/cli/append-lesson-observation.mjs`
- **STOP**: 若追加需要改写既有行才能实现，停止——违反"无条件追加、不改写"约定。
- **recovery**: 删除脚本与 move-map 条目。
- **task risk**: storageRoot 解析在不同宿主不一致（--root 显式传参兜底）。
- **完成区**: status: pending；执行事实: 待填。

### T6-GREEN. 数据面行为测试 GREEN

- **ID**: T6
- **Phase**: Phase 1（build-code）
- **tier**: simple
- **goal**: 实现完成后证明数据面四个测试全部通过。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-out-001]
- **source_refs**: [decision-log.md#D-004, decision-log.md#D-005, decision-log.md#D-007]
- **decision_refs**: [decision-log.md#D-004, decision-log.md#D-005, decision-log.md#D-007]
- **输入**: T2~T5 完成；T1 RED 失败记录。
- **依赖**: [T2, T3, T4, T5]
- **并行**: [T9, T10]
- **FR**: FR-OUT-001~004、FR-EDGE-001~002、FR-LESSON-001~004
- **AC**: AC-002、AC-004、AC-005
- **动作**: 复跑 T1 同一 gate_cmd，预期 exit 0；记录 GREEN 事实。
- **精确文件**: `tests/contract/stage-reflection-schema.test.mjs`
- **boundary**: 只运行测试并记录 GREEN 事实；不修改测试断言掩盖问题。
- **输出**: 四个测试文件全绿；move-map 三条登记（schema、两个 CLI）复核齐备。
- **Knowledge**: F9 先 RED 后 GREEN。
- **verification_role**: GREEN
- **paired_task**: T1
- **gate_cmd**: `npx vitest run tests/contract/stage-reflection-schema.test.mjs tests/contract/stage-reflection-paths.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/lessons-jsonl.test.mjs`
- **expected_exit**: 0
- **oracle**: 与 T1 完全相同的命令在实现后退出 0；任一断言失败即非 GREEN。
- **evidence_path**: `tests/contract/stage-reflection-schema.test.mjs`
- **STOP**: 若测试仍失败，停止后续 Phase 并修复实现。
- **recovery**: 回退对应实现并重跑 RED。
- **task risk**: 测试覆盖不足导致假绿——T20 构造场景复验兜底。
- **完成区**: status: pending；执行事实: 待填。

### T7-RED. 补丁 A 行为测试 RED

- **ID**: T7
- **Phase**: Phase 2（build-code，与 Phase 1 并行）
- **tier**: feature
- **goal**: 在实现前证明 human-confirmation v3 行为测试当前失败。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-conf-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-conf-002]
- **source_refs**: [decision-log.md#T-006, decision-log.md#RISK-004]
- **decision_refs**: [decision-log.md#D-004, decision-log.md#G-001]
- **输入**: spec §5.5；当前 v2 写入点 `runtime/task/task-kernel-implementation.mjs:523`；读取方清单。
- **依赖**: [T0]
- **并行**: [T1]
- **FR**: FR-CONF-001~002
- **AC**: AC-003
- **动作**: 创建 `tests/contract/human-confirmation-v3.test.mjs`：writer 用例（confirm 落盘记录 schema_version=human-confirmation.v3、含非空 reply_text 与 step_slug、v2 既有字段语义不变、authorize 记录 irreversible-authorization.v1 不变）；compat 用例（全部读取方只读接受 v1/v2/v3 三版本 fixture、旧记录不改写、独立 authorize 无前置 v3 时归因降级语义）。运行预期失败（v3 未实现）。
- **精确文件**: `tests/contract/human-confirmation-v3.test.mjs`
- **boundary**: 只创建测试并记录 RED；不改写入点与读取方。
- **输出**: 测试文件存在；退出码非 0；失败来自 v3 行为缺失。
- **Knowledge**: 单写入源升级，禁双写（G-001）。
- **verification_role**: RED
- **paired_task**: T10
- **gate_cmd**: `npx vitest run tests/contract/human-confirmation-v3.test.mjs`
- **expected_exit**: 1
- **oracle**: 失败输出显示 writer 仍产 v2 / 缺 reply_text、step_slug，证明 RED 来自行为而非环境。
- **evidence_path**: `tests/contract/human-confirmation-v3.test.mjs`
- **STOP**: 若测试意外通过，说明 v3 已存在或测试错误，重新评估。
- **recovery**: 删除测试文件并保留 RED 事实。
- **task risk**: fixture 与真实 v2 记录结构漂移——以 task-kernel 实际产出为准校准 fixture。
- **完成区**: status: pending；执行事实: 待填。

### T8. confirm 写入点升级 v3（reply_text + step_slug）

- **ID**: T8
- **Phase**: Phase 2（build-code）
- **tier**: feature
- **goal**: 单一写入点产出 human-confirmation.v3，含用户回复原文与 step 锚点。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-conf-001]
- **source_refs**: [decision-log.md#T-006]
- **decision_refs**: [decision-log.md#D-004]
- **输入**: T7 RED 测试；confirm 调用链中 reply_text 与当前 step_slug 的可得性。
- **依赖**: [T7]
- **并行**: [T2, T3, T4, T5]
- **FR**: FR-CONF-001
- **AC**: AC-003
- **动作**: 修改 `runtime/task/task-kernel-implementation.mjs:523` 写入点：schema_version 升 `human-confirmation.v3`，新增 `reply_text`（用户回复原文，非空）与 `step_slug`（确认/授权发生时所处 step 锚点，非空）；v1 既有可选字段（attempt_ref、checkpoint_plan_hash）与 v2 字段（subject_ref/material_revision/snapshot_tree）语义不变；调用链补齐两参数来源；authorize（:593-602）保持不变。不新增独立 schema 文件（v3 内联跟随 v2 模式）。
- **精确文件**: `runtime/task/task-kernel-implementation.mjs`
- **boundary**: 只改 confirm 写入点与必要传参；不改 authorize 记录；不改任何读取方（T9 负责）；不双写。
- **输出**: writer 用例转绿。
- **Knowledge**: `tools/host/workflowhub-codex-session-event.mjs` 经核实不含确认/授权写入点（只是会话生命周期标记工具），不在本任务改动面。
- **verification_role**: test
- **paired_task**: T9
- **gate_cmd**: `npx vitest run tests/contract/human-confirmation-v3.test.mjs -t writer`
- **expected_exit**: 0
- **oracle**: writer 用例断言 v3 记录字段齐备且非空、v2 字段语义不变、authorize 记录不变；compat 用例允许在 T9 前仍失败。
- **evidence_path**: `runtime/task/task-kernel-implementation.mjs`
- **STOP**: 若 reply_text/step_slug 在写入点不可获得，停止并升级人工（不得用占位值伪造非空）。
- **recovery**: 写入点退回 v2 常量并保留 RED 事实。
- **task risk**: 上游调用方未传新参数导致运行时缺字段——测试覆盖缺参 fail-loud 路径。
- **完成区**: status: pending；执行事实: 待填。

### T9. 读取方 v1/v2/v3 只读兼容 + 受影响测试断言更新

- **ID**: T9
- **Phase**: Phase 2（build-code）
- **tier**: feature
- **goal**: 全部 v2 消费点只读兼容三版本；历史记录不改写；受影响测试断言更新并回归。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-conf-002]
- **source_refs**: [decision-log.md#RISK-004]
- **decision_refs**: [decision-log.md#D-004]
- **输入**: T8 完成；读取方清单（九处 + 测试断言）。
- **依赖**: [T8, T3]
- **并行**: [T4, T5]
- **FR**: FR-CONF-002
- **AC**: AC-003
- **动作**: 逐一复核并按需修改读取方：`runtime/stage/completion-predicates.mjs:534,647`、`runtime/stage/stage-runner.mjs:958`、`runtime/stage/stage-handlers.mjs:990`、`runtime/evidence/freshness.mjs:197`、`runtime/evidence/canonical-evidence-validators.mjs:219`（与 T3 同文件不同关切，本任务后行）、`core/task-close.mjs:278,565,1348`、`skills/mini-task/scripts/mini-task-runner.mjs:123`、`tools/architecture/public-behavior-baseline.mjs:365`——版本分派接受 v1/v2/v3，未知版本 fail-loud；旧记录只读不改写不回填；更新 `tests/e2e/vnext-five-stage-current.test.mjs:460` 等受影响断言，每条断言变更在执行事实中记录理由；跑 e2e 回归。
- **精确文件**: 上述九处读取方 + `tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**: 只读兼容；不改写历史 v1/v2 记录；不新增回填机制；断言更新不得掩盖真实回归（逐条记录理由）。
- **输出**: compat 用例转绿；e2e 回归全绿。
- **Knowledge**: 读取旧记录时介入原文能力如实降级（reply_text=null、confidence≠high）。
- **verification_role**: test
- **paired_task**: T8
- **gate_cmd**: `bash -c 'npx vitest run tests/contract/human-confirmation-v3.test.mjs -t compat && npx vitest run tests/e2e/vnext-five-stage-current.test.mjs'`
- **expected_exit**: 0
- **oracle**: compat 用例断言三版本 fixture 均被所有读取方接受、旧记录 sha256 不变（不改写）、独立 authorize 降级语义正确；e2e 回归全绿。
- **evidence_path**: `tests/contract/human-confirmation-v3.test.mjs`
- **STOP**: 若兼容改造需要改写历史记录才能通过，停止——违反 provenance 保留，升级人工。
- **recovery**: 读取方改动整体 revert，保留断言变更理由清单。
- **task risk**: 漏掉清单外的隐藏读取方——执行时反向引用扫描 schema_version 字面量补全清单并记录。
- **完成区**: status: pending；执行事实: 待填。

### T10-GREEN. 补丁 A 行为测试 GREEN 收口

- **ID**: T10
- **Phase**: Phase 2（build-code）
- **tier**: feature
- **goal**: v3 全量测试 + v2 消费点回归证明补丁 A 生效且兼容。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-conf-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-conf-002]
- **source_refs**: [decision-log.md#RISK-004]
- **decision_refs**: [decision-log.md#D-004]
- **输入**: T8、T9 完成；T7 RED 记录。
- **依赖**: [T8, T9]
- **并行**: [T6]
- **FR**: FR-CONF-001~002
- **AC**: AC-003
- **动作**: 复跑 T7 同一 gate_cmd（全文件）+ e2e 回归，预期 exit 0；抽查任务存储中既有 v1/v2 历史记录 sha256 与基线一致（未改写）；记录 GREEN 事实。
- **精确文件**: `tests/contract/human-confirmation-v3.test.mjs`
- **boundary**: 只运行测试与只读抽查；不修改断言掩盖问题。
- **输出**: 全量 v3 测试绿；e2e 回归绿；历史记录未改写证据。
- **Knowledge**: AC-003 以既有 v2 消费点回归通过为兼容证明。
- **verification_role**: GREEN
- **paired_task**: T7
- **gate_cmd**: `bash -c 'npx vitest run tests/contract/human-confirmation-v3.test.mjs && npx vitest run tests/e2e/vnext-five-stage-current.test.mjs'`
- **expected_exit**: 0
- **oracle**: 与 T7 相同的测试文件在实现后全绿（writer+compat）；e2e 回归全绿；历史记录抽查 sha256 不变。
- **evidence_path**: `tests/contract/human-confirmation-v3.test.mjs`
- **STOP**: 若仍失败，停止后续挂载工作并修复实现。
- **recovery**: 回退 T8/T9 改动并重跑 RED。
- **task risk**: 回归套件未覆盖全部读取方导致假绿——T9 的反向引用扫描清单兜底。
- **完成区**: status: pending；执行事实: 待填。

### T11. skills/stage-reflection/ 技能本体（SKILL.md + skill-bundle.json）

- **ID**: T11
- **Phase**: Phase 3（build-code）
- **tier**: feature
- **goal**: 交付会话内执行协议完整的 stage-reflection 技能。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-exec-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-out-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-gate-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-fail-001]
- **source_refs**: [decision-log.md#R-008, decision-log.md#R-009, decision-log.md#R-012, decision-log.md#F-012]
- **decision_refs**: [decision-log.md#D-002, decision-log.md#D-003, decision-log.md#D-005, decision-log.md#D-006, decision-log.md#D-009]
- **输入**: spec §4/§5 全量契约；lessons JSONL 约定（T5）；派生脚本输出形态（T4）。
- **依赖**: [T6, T10]
- **并行**: []
- **FR**: FR-EXEC-001~002、FR-OUT-001~004、FR-GATE-001~002、FR-FAIL-001~002、FR-LESSON-003~004
- **AC**: AC-002、AC-007、AC-008
- **动作**: 新增 `skills/stage-reflection/SKILL.md` 与 `skills/stage-reflection/skill-bundle.json`。SKILL.md 会话内执行协议必备条款：①触发=当前 stage 既有 step 序列完成后由主会话执行（不另起子代理、不读 transcript/四份材料全文）；②输入三来源=会话记忆 + `<storageRoot>/Projects/<proj>/lessons/` 索引 + 本 stage step/skill outcome（含 v3 确认记录与消费边派生结果）；③机器先行=runner 机器前奏在执行本技能前已自动调用 append-lesson-observation CLI 追加 raw_observation（零 AI 成本，不依赖主会话是否启动技能；技能超时/未启动/失败时 raw 已落盘），技能自身不再承担追加职责；④输出=按 stage-reflection.v1 写 `quality/stage-reflection/<stage>.json`，六类判断 + needs_evidence，evidence_refs 必须真实（冷启动允许空数组且 confidence≠high）；⑤remove 机器门槛=技能执行时显式调用 derive-consumption-edges.mjs CLI 派生消费边作为 remove 门槛输入：零消费 ∧（人工 rejected ∨ 同 step_slug 重复介入≥2），双硬信号不齐只能 needs_evidence，unknown≠零消费；⑥interventions 归因=v3 记录取 reply_text/step_slug，v1/v2 记录 reply_text=null 且 confidence≠high，独立 authorize 同样降级；⑦失败语义=落 status:failed（含错误摘要）不阻断 stage/close（由 runner `blocking:false` 调度语义兜底），lessons 不合并不写回 merged；⑧部分输入缺失=status:degraded 缺失维度记 unknown；⑨复盘成功后合并去重写回 merged_lesson（occurrence_count/source_refs/supersedes，被合并 raw 行 merged 置 true）；⑩显式标注 judgment≠fact；⑪机器核验=复盘输出落盘后必须经 validate-stage-reflection.mjs 机器核验（remove 双硬信号强制降级 + evidence_refs 存在性解析），核验可改写输出（降级 remove_candidate→needs_evidence、悬空引用判断 confidence 强制非 high、status 落 degraded）并记录降级事实，核验/降级后方为终态。新增 `tests/contract/stage-reflection-skill-contract.test.mjs` 断言上述条款在 SKILL.md 中齐备（关键条款锚点 grep + bundle JSON 结构校验）。
- **精确文件**: `skills/stage-reflection/SKILL.md`、`skills/stage-reflection/skill-bundle.json`、`tests/contract/stage-reflection-skill-contract.test.mjs`
- **boundary**: 技能只产出 judgment 文件与 lessons 写回；不写 facts、不做质量裁决、不阻断任何流程；不恢复遥测。
- **输出**: skill-contract 测试通过；协议条款与 spec §5 逐条对应。
- **Knowledge**: 自评偏差由机器门槛兜底（RISK-001）；阈值 2 为初定，可按实测复核调整并记录理由（§5.8）。
- **verification_role**: test
- **paired_task**: T13
- **gate_cmd**: `npx vitest run tests/contract/stage-reflection-skill-contract.test.mjs`
- **expected_exit**: 0
- **oracle**: 测试断言 SKILL.md 含输入三来源、六类+needs_evidence、remove 双硬信号（含 derive-consumption-edges.mjs 显式接线）、runner 机器前奏追加 raw、validate-stage-reflection.mjs 机器核验降级、status:failed 不阻断、degraded 语义、lessons 合并写回、interventions 降级、judgment≠fact 标注十类条款锚点；skill-bundle.json 结构合法。
- **evidence_path**: `skills/stage-reflection/SKILL.md`
- **STOP**: 若协议条款与 spec §5 冲突，停止并以 spec 为准修订（spec 是唯一验收源）。
- **recovery**: 删除技能目录并保留事实。
- **task risk**: 协议描述与实际可执行性漂移——T20 构造场景按协议实走一遍兜底。
- **完成区**: status: pending；执行事实: 待填。

### T12-RED. 五 stage 挂载 wiring 测试 RED

- **ID**: T12
- **Phase**: Phase 3（build-code）
- **tier**: simple
- **goal**: 在挂载前证明 wiring 测试当前失败。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-trig-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-trig-002]
- **source_refs**: [decision-log.md#R-004, decision-log.md#F-009]
- **decision_refs**: [decision-log.md#D-001]
- **输入**: steps.json 7 字段结构与 schema_version 2.0.0；skill-deps.yaml 登记结构；T11 技能目录。
- **依赖**: [T11]
- **并行**: []
- **FR**: FR-TRIG-001~002
- **AC**: AC-002
- **动作**: 创建 `tests/contract/stage-reflection-wiring.test.mjs`：断言五个 workflow（make-decision/build-spec/build-plan/build-code/verify-code，含 verify-code——见 plan.md 裁决 P-001）的 steps.json 各含 stage-reflection step（既有 7 字段齐备 + 声明式调度字段 `on_stage_end:true` 与 `blocking:false`——见裁决 P-002，order 在既有 step 序列之后、depends_on 合理）；五个 skill-deps.yaml 各登记 {name,path,execution,trigger,bundle,owner,consumer:{target,inputs[],identity[],result}}；skills/catalog.yaml 含 stage-reflection 条目且 hash 与 skill-bundle.json 同步。运行预期失败（未挂载）。
- **精确文件**: `tests/contract/stage-reflection-wiring.test.mjs`
- **boundary**: 只创建测试并记录 RED；不改 workflow 文件。
- **输出**: 测试存在；exit 非 0；失败来自挂载缺失。
- **Knowledge**: 通用 step/skill outcome 通道已核实支持，无需专用强校验槽（F-009）；on_stage_end/blocking 调度语义由 T22–T24 runner 小幅扩展落地（P-002）。
- **verification_role**: RED
- **paired_task**: T14
- **gate_cmd**: `npx vitest run tests/contract/stage-reflection-wiring.test.mjs`
- **expected_exit**: 1
- **oracle**: 失败输出显示五个 steps.json 缺 stage-reflection step / skill-deps 缺登记，证明 RED 来自未挂载而非环境。
- **evidence_path**: `tests/contract/stage-reflection-wiring.test.mjs`
- **STOP**: 若测试意外通过，说明已挂载或测试错误，重新评估。
- **recovery**: 删除测试并保留 RED 事实。
- **task risk**: verify-code 的 steps.json 结构与其他 stage 不同导致挂载形态需调整——测试先暴露真实结构。
- **完成区**: status: pending；执行事实: 待填。

### T13. 五 workflow 挂载 + catalog 登记

- **ID**: T13
- **Phase**: Phase 3（build-code）
- **tier**: feature
- **goal**: 五个 stage 的 steps.json/skill-deps.yaml 完成挂载，catalog 同步。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-trig-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-trig-002]
- **source_refs**: [decision-log.md#R-004]
- **decision_refs**: [decision-log.md#D-001]
- **输入**: T12 RED 测试；T11 技能目录；T24 runner 调度扩展 GREEN。
- **依赖**: [T12, T24]
- **并行**: []
- **FR**: FR-TRIG-001~002
- **AC**: AC-001、AC-002
- **动作**: 五个 `workflows/*/steps.json` 各增 stage-reflection step（既有 7 字段 + `on_stage_end:true` + `blocking:false` 声明式调度字段，order 排在 stage 末位、不破坏既有 entry_conditions/depends_on；runner 调度语义由 T23/T24 落地，见裁决 P-002）；五个 `workflows/*/skill-deps.yaml` 登记 skills/stage-reflection（consumer.target=该 workflow 的 stage-reflection step，inputs/identity/result 按现有条目同构）；`skills/catalog.yaml` 登记并同步 hash；`docs/architecture/move-map.json` 登记 skills/stage-reflection/ 目录（consumer=五个 workflow/owner/删除条件=技能退役时移除挂载后删除）。
- **精确文件**: `workflows/make-decision/steps.json`、`workflows/build-spec/steps.json`、`workflows/build-plan/steps.json`、`workflows/build-code/steps.json`、`workflows/verify-code/steps.json`、五个 `workflows/*/skill-deps.yaml`、`skills/catalog.yaml`、`docs/architecture/move-map.json`
- **boundary**: 只加声明不改校验器核心（runner 调度扩展在 T23 单独落地）；不改五阶段主骨架；不新增 steps.json 顶层字段（step 级新增 on_stage_end/blocking 两声明式字段，其余 step 省略取默认值）。
- **输出**: wiring 测试转绿（T14 复跑确认）。
- **Knowledge**: verify-code 挂载裁决与理由见 plan.md「关键裁决记录 P-001」。
- **verification_role**: test
- **paired_task**: T11
- **gate_cmd**: `npx vitest run tests/contract/stage-reflection-wiring.test.mjs`
- **expected_exit**: 0
- **oracle**: 五 stage steps.json 各含合法 stage-reflection step；skill-deps 五处登记结构完整；catalog hash 与 bundle 同步。
- **evidence_path**: `tests/contract/stage-reflection-wiring.test.mjs`
- **STOP**: 若挂载导致任一 stage 既有 step 序列校验失败，停止并调整 step 顺序，不得削弱既有约束。
- **recovery**: 移除五个 step 条目与 skill-deps 行，回退 catalog。
- **task risk**: 挂载顺序与 stage-end-spec-analyze 冲突——复盘 step 排在其后。
- **完成区**: status: pending；执行事实: 待填。

### T14-GREEN. 挂载 wiring 测试 GREEN

- **ID**: T14
- **Phase**: Phase 3（build-code）
- **tier**: simple
- **goal**: 复跑 wiring 测试证明五 stage 全挂。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-trig-001]
- **source_refs**: [decision-log.md#R-004]
- **decision_refs**: [decision-log.md#D-001]
- **输入**: T13 完成；T12 RED 记录。
- **依赖**: [T13]
- **并行**: []
- **FR**: FR-TRIG-001~002
- **AC**: AC-002
- **动作**: 复跑 T12 同一 gate_cmd，预期 exit 0；记录 GREEN 事实。
- **精确文件**: `tests/contract/stage-reflection-wiring.test.mjs`
- **boundary**: 只运行测试；不改断言。
- **输出**: wiring 测试绿。
- **Knowledge**: 未声明的 stage 不复盘（manifest 强约束保证声明后才通过，D-001）。
- **verification_role**: GREEN
- **paired_task**: T12
- **gate_cmd**: `npx vitest run tests/contract/stage-reflection-wiring.test.mjs`
- **expected_exit**: 0
- **oracle**: 与 T12 完全相同的命令退出 0。
- **evidence_path**: `tests/contract/stage-reflection-wiring.test.mjs`
- **STOP**: 若仍失败，停止并修复挂载。
- **recovery**: 回退 T13 并重跑 RED。
- **task risk**: catalog hash 同步遗漏导致假绿——测试含 hash 断言兜底。
- **完成区**: status: pending；执行事实: 待填。

### T15-RED. 页面投影器测试 RED

- **ID**: T15
- **Phase**: Phase 4（build-code）
- **tier**: feature
- **goal**: 在实现前证明页面投影测试当前失败。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-page-001]
- **source_refs**: [decision-log.md#R-006, decision-log.md#F-014]
- **decision_refs**: [decision-log.md#D-008]
- **输入**: spec §5.4 聚合规则与 §6 页面契约；仓外蓝本（只读）；fixture 复盘产物。
- **依赖**: [T6, T11]
- **并行**: []
- **FR**: FR-PAGE-001~006
- **AC**: AC-006、AC-009、AC-010
- **动作**: 创建 `tests/contract/build-reflection-page.test.mjs` 与 fixture（若干任务 quality/stage-reflection/* 合法样本 + lessons jsonl + 缺数据/失败/旧 v1 确认记录变体）：断言 CLI 生成仓外 data.js（`globalThis.__WH_MONITOR_DATA__` freeze 常量）；overall pending 按 §5.4 排序（权重 3/2/1、30 天窗口、任务×stage 去重）；任务视图两区块与三维筛选数据齐备；unknown/unavailable/degraded/failed/empty 各态如实呈现且不补零；judgment 身份标注存在；safeRef 防路径注入（恶意 ref fixture 被拒绝/转义）；m15 历史样本 sha256 不变（只读）。运行预期失败（CLI 不存在）。
- **精确文件**: `tests/contract/build-reflection-page.test.mjs`
- **boundary**: 只创建测试与 fixture 并记录 RED；蓝本只读不复制代码。
- **输出**: 测试存在；exit 非 0；失败来自 CLI 缺失。
- **Knowledge**: M15 空壳教训——oracle 必须断言真实数据驱动渲染而非字段存在。
- **verification_role**: RED
- **paired_task**: T17
- **gate_cmd**: `npx vitest run tests/contract/build-reflection-page.test.mjs`
- **expected_exit**: 1
- **oracle**: 失败输出显示 build-reflection-page CLI 不存在，证明 RED 来自未实现。
- **evidence_path**: `tests/contract/build-reflection-page.test.mjs`
- **STOP**: 若意外通过，重新评估。
- **recovery**: 删除测试与 fixture 并保留 RED 事实。
- **task risk**: fixture 与真实复盘产物漂移——T11 协议定稿后校准。
- **完成区**: status: pending；执行事实: 待填。

### T16. tools/cli/build-reflection-page.mjs + 静态页面模板

- **ID**: T16
- **Phase**: Phase 4（build-code）
- **tier**: feature
- **goal**: 遍历任务复盘产物 + lessons 生成仓外 data.js；静态页面模板对标蓝本。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-page-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-page-006]
- **source_refs**: [decision-log.md#R-006, decision-log.md#F-014]
- **decision_refs**: [decision-log.md#D-008]
- **输入**: T15 RED 测试与 fixture；仓外蓝本 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub-monitor.html`（只读模式参考）。
- **依赖**: [T15]
- **并行**: []
- **FR**: FR-PAGE-001~006、FR-SEV-002
- **AC**: AC-006、AC-009、AC-010
- **动作**: 新增 `tools/cli/build-reflection-page.mjs`（CLI 惯例；--root/--tasks-root/--out 参数）与静态页面模板：显式调用 derive-consumption-edges.mjs 生成消费图作为投影输入（不自行重复派生逻辑）；遍历各任务 `quality/stage-reflection/*` + `<storageRoot>/Projects/<proj>/lessons/`；按 §5.4 聚合 overall pending（30 天窗口、权重 3/2/1、得分降序→频次降序→最近出现降序）；生成仓外 data.js（freeze 常量注入）与单文件 HTML（内联 CSS、document.createElement 渲染、中文 label 映射、任务视图+overall pending 双视图、任务/stage/六类三维筛选、stale/partial/fatal 状态显式、safeRef 防路径注入、judgment≠fact 显著标注、空数据 empty 合法态）；投影失败显示 fatal/stale 与原因，不展示陈旧数据冒充新数据；零 AI 成本运行；move-map 登记（注明替代 ADR 0012 退役条目；唯一 consumer=用户浏览器/M16 数据输入；owner；删除条件）。
- **精确文件**: `tools/cli/build-reflection-page.mjs`、页面模板文件、`docs/architecture/move-map.json`
- **boundary**: 只读任务质量目录与 lessons；不写历史数据目录（m15 三件套字节级不动）；无服务依赖；不做导出/高级可视化（DEFER-003）。
- **输出**: T17 复跑转绿；仓外页面用 fixture 可打开。
- **Knowledge**: 页面仅展示 judgment；聚合零 AI（M0，AC-010）。
- **verification_role**: test
- **paired_task**: T15
- **gate_cmd**: `npx vitest run tests/contract/build-reflection-page.test.mjs`
- **expected_exit**: 0
- **oracle**: fixture 驱动下 data.js 结构与聚合排序正确、各状态态如实、safeRef 拦截恶意 ref、m15 历史样本 sha256 不变。
- **evidence_path**: `tools/cli/build-reflection-page.mjs`
- **STOP**: 若生成需要写历史数据目录或引入服务依赖，停止——形态违规，回到纯静态只读设计。
- **recovery**: 删除新模块与 move-map 条目。
- **task risk**: 模板与蓝本差异导致状态呈现遗漏——测试逐态断言兜底。
- **完成区**: status: pending；执行事实: 待填。

### T17-GREEN. 页面投影测试 GREEN

- **ID**: T17
- **Phase**: Phase 4（build-code）
- **tier**: feature
- **goal**: 复跑页面测试证明投影器与模板达标（含历史只读）。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-page-001]
- **source_refs**: [decision-log.md#R-006]
- **decision_refs**: [decision-log.md#D-008]
- **输入**: T16 完成；T15 RED 记录。
- **依赖**: [T16]
- **并行**: []
- **FR**: FR-PAGE-001~006
- **AC**: AC-006、AC-009、AC-010
- **动作**: 复跑 T15 同一 gate_cmd，预期 exit 0；记录 GREEN 事实；把 fixture 生成的页面与 data.js 作为样本证据留存。真实浏览器 QA：用 fixture 生成页面后用浏览器实际加载（主会话 agent-browser 技能），操作任务视图/overall pending 两视图与任务/stage/六类三类筛选，逐一验证 unknown/degraded/failed/fatal/empty 五种状态如实呈现；真实截图与操作日志落 `quality/evidence/stage-reflection-page-qa/`（禁止仅以测试断言充当浏览器证据）。
- **精确文件**: `tests/contract/build-reflection-page.test.mjs`
- **boundary**: 只运行测试；不改断言掩盖问题。
- **输出**: 页面测试全绿。
- **Knowledge**: 失败边界②——字段存在不算数，真实数据驱动渲染才算。
- **verification_role**: GREEN
- **paired_task**: T15
- **gate_cmd**: `bash -c 'npx vitest run tests/contract/build-reflection-page.test.mjs && test -s quality/evidence/stage-reflection-page-qa/qa-log.md && ls quality/evidence/stage-reflection-page-qa/*.png >/dev/null'`
- **expected_exit**: 0
- **oracle**: 与 T15 完全相同的命令退出 0；m15 历史样本 sha256 比对不变；QA 目录含真实操作日志（逐视图逐筛选记录操作与观察结果）与五种状态真实截图。
- **evidence_path**: `tests/contract/build-reflection-page.test.mjs`、`quality/evidence/stage-reflection-page-qa/`
- **STOP**: 若仍失败，停止并修复投影器。
- **recovery**: 回退 T16 并重跑 RED。
- **task risk**: fixture 覆盖不到真实任务多样性——T20 构造场景复验 + AC-001 真实任务兜底。
- **完成区**: status: pending；执行事实: 待填。

### T18. FR-DOC-001 文档修正四处

- **ID**: T18
- **Phase**: Phase 5（build-code）
- **tier**: simple
- **goal**: 把四份材料落点写死为 worktree `specs/<task-id>/`。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-doc-001]
- **source_refs**: [decision-log.md#R-015, decision-log.md#F-013]
- **decision_refs**: [decision-log.md#D-012]
- **输入**: F-013③ 修正清单（四处文档行号）。
- **依赖**: [T14]
- **并行**: [T15, T16, T17]
- **FR**: FR-DOC-001
- **AC**: AC-012
- **动作**: 修正 `docs/standard-workflow.md:9`、`workflows/make-decision/SKILL.md:58`、`workflows/build-spec/SKILL.md` 与 `workflows/build-plan/SKILL.md` 同条款、`AGENTS.md` 治理边界条——明确四份材料落 worktree `specs/<task-id>/`，任务追踪目录只放执行文件（task.json/facts.jsonl/quality/index.json）；只写落点约定不设新门禁；m15-retirement 会话的材料迁移不动（F-013④ 由其会话执行）；仓外孤儿目录 `~/Knowledge/Projects/workflowhub/tasks/Projects/` 清理已移出本任务范围（见 plan.md「延期与备注」，建议用户手工处理或由 m15-retirement 会话处理），本任务不动仓外目录。
- **精确文件**: `docs/standard-workflow.md`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`AGENTS.md`
- **boundary**: 零代码改动（core/artifact-dir.mjs:73,81-82 约定本已正确）；不改 skill 行为语义；不动其他任务材料；不动仓外目录。
- **输出**: grep gate 通过。
- **Knowledge**: 偏离性质是 agent 会话行为漂移 + 文档空白（F-013②），文档写死即修复。
- **verification_role**: manual
- **paired_task**: T19
- **gate_cmd**: `bash -c 'grep -q "specs/<task-id>" docs/standard-workflow.md && grep -q "specs/<task-id>" workflows/make-decision/SKILL.md && grep -q "specs/<task-id>" workflows/build-spec/SKILL.md && grep -q "specs/<task-id>" workflows/build-plan/SKILL.md && grep -q "specs/<task-id>" AGENTS.md'`
- **expected_exit**: 0
- **oracle**: 五处文档均含写死的 specs/<task-id>/ 落点表述（未修改时命令必失败）。
- **evidence_path**: `docs/standard-workflow.md`
- **STOP**: 若修正措辞被误读为新门禁或改变 skill 行为语义，停止并重新措辞。
- **recovery**: git revert 文档改动。
- **task risk**: 文档措辞扩散为行为约束——只写落点约定。
- **完成区**: status: pending；执行事实: 待填。

### T19. CONTEXT.md 术语补录（FR-TERM-001）

- **ID**: T19
- **Phase**: Phase 5（build-code）
- **tier**: simple
- **goal**: 补录 stage-reflection 与「判断层 vs 事实层」术语。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-term-001]
- **source_refs**: [decision-log.md#R-014]
- **decision_refs**: [decision-log.md#D-005, decision-log.md#grill_summary]
- **输入**: 已定稿 schema（T2）；Grill no-change 理由（schema 定稿后一次性补录）。
- **依赖**: [T2, T11]
- **并行**: [T15, T16, T17, T18]
- **FR**: FR-TERM-001
- **AC**: AC-012
- **动作**: 在 `CONTEXT.md` 补录两条术语：`stage-reflection`（每 stage 结束主会话自动复盘的判断层机制，ADR 0021）；「判断层（judgment）vs 事实层（fact）」（判断层为 LLM 归因记录、record_kind=judgment、非机器事实、不作质量裁决；事实层为机器采集的物理事实）。
- **精确文件**: `CONTEXT.md`
- **boundary**: 只补术语解释；不改既有术语；不设门禁。
- **输出**: grep gate 通过。
- **Knowledge**: OPEN-009 关闭路径——schema 已定稿，术语可固化。
- **verification_role**: manual
- **paired_task**: T18
- **gate_cmd**: `bash -c 'grep -q "stage-reflection" CONTEXT.md && grep -q "判断层" CONTEXT.md && grep -q "事实层" CONTEXT.md && grep -q "judgment" CONTEXT.md'`
- **expected_exit**: 0
- **oracle**: CONTEXT.md 含两条新术语且含 judgment/fact 区分表述（未修改时命令必失败）。
- **evidence_path**: `CONTEXT.md`
- **STOP**: 若术语与 ADR 0021 表述冲突，停止并以 ADR 为准修订。
- **recovery**: git revert CONTEXT.md 改动。
- **task risk**: 术语过早固化后续 schema 变更需同步——schema 已定稿，风险低。
- **完成区**: status: pending；执行事实: 待填。

### T20. 构造场景端到端验证 + AC 全量映射

- **ID**: T20
- **Phase**: Phase 6（build-code 收口）
- **tier**: fullstack
- **goal**: 构造场景覆盖 AC-002~AC-012 可构造部分，产出 AC 全量映射表。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#ac-002, specs/workflowhub-stage-reflection-20260830/spec.md#ac-010]
- **source_refs**: [decision-log.md#T-008, decision-log.md#FND-D2]
- **decision_refs**: [decision-log.md#D-010]
- **输入**: T6/T10/T14/T17/T24/T27 GREEN；T18/T19 完成；SKILL.md 执行协议。
- **依赖**: [T6, T10, T14, T17, T18, T19, T24, T27]
- **并行**: []
- **FR**: 全部 FR
- **AC**: AC-002~AC-012（AC-001 标注交接）
- **动作**: 新增 `tests/contract/stage-reflection-e2e-constructed.test.mjs`（构造 fixture 任务按 SKILL.md 协议实走）：①stage completed 与 stage failed 双态各产合规复盘文件（SCN-001/002）；②人为使复盘失败一次：status:failed 落盘、流程照常、lessons raw 保留且不合并（AC-008/SCN-003）；③remove 门槛证伪：复盘输出经 validate-stage-reflection.mjs 机器核验，无机器硬信号输入时机器强制降级 needs_evidence（含降级事实记录），双硬信号齐备 fixture 才保留 remove_candidate（AC-007）；④v3 确认记录在构造 confirm 流程落盘且旧 v1/v2 fixture 被只读兼容（AC-003 构造级）；⑤消费边派生有引用→边、无引用→unknown（AC-004 构造级）；⑥lessons 生命周期全链（AC-005）；⑦用构造产物跑 build-reflection-page 生成页面（AC-006 构造级）；⑧历史样本 sha256 比对（AC-009）；⑨聚合零 AI（AC-010）；⑩文档/术语/过程约束证据齐（AC-011/012 引用 T0/T18/T19 证据）。产出 `quality/evidence/stage-reflection-ac-mapping.md`：12 行 AC 映射表（每行 AC→证据路径→覆盖方式 构造/真实/过程），AC-001 显式标注 `deferred_to_next_real_task`。
- **精确文件**: `tests/contract/stage-reflection-e2e-constructed.test.mjs`、`quality/evidence/stage-reflection-ac-mapping.md`
- **boundary**: 构造场景不得冒充真实任务背书；AC-001 不得标绿；不修改既有测试断言掩盖问题。
- **输出**: e2e constructed 测试绿；AC 映射表 12 行齐备。
- **Knowledge**: M15 空壳教训——映射表每行必须指向真实存在的证据文件。
- **verification_role**: test
- **paired_task**: T21
- **gate_cmd**: `bash -c 'npx vitest run tests/contract/stage-reflection-e2e-constructed.test.mjs && test -s quality/evidence/stage-reflection-ac-mapping.md && test $(grep -c "^| AC-" quality/evidence/stage-reflection-ac-mapping.md) -eq 12 && grep -q "deferred_to_next_real_task" quality/evidence/stage-reflection-ac-mapping.md'`
- **expected_exit**: 0
- **oracle**: 构造场景测试全绿（双态复盘/失败语义/门槛证伪/lessons/页面各用例）；映射表恰 12 行且 AC-001 行标注 deferred_to_next_real_task；任一证据路径不存在时测试必失败。
- **evidence_path**: `quality/evidence/stage-reflection-ac-mapping.md`
- **STOP**: 若任一 AC 无法由构造场景或既有证据覆盖，停止并升级人工决策——不得以 unavailable 判绿。
- **recovery**: 修复实现缺口后重跑；不删 RED 事实。
- **task risk**: 构造场景与真实任务行为漂移——AC-001 真实任务复核兜底（T21）。
- **完成区**: status: pending；执行事实: 待填。

### T21. AC-001 真实任务交接 + 用户抽查确认卡

- **ID**: T21
- **Phase**: Phase 6（verify-code 交接）
- **tier**: fullstack
- **goal**: AC-001 证据来源口径显式交接下一真实任务；产出用户抽查确认卡。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#ac-001]
- **source_refs**: [decision-log.md#T-008, decision-log.md#R-012]
- **decision_refs**: [decision-log.md#D-010]
- **输入**: T20 完成（AC 映射表）。
- **依赖**: [T20]
- **并行**: []
- **FR**: FR-TRIG/EXEC/OUT（端到端面）
- **AC**: AC-001
- **动作**: 产出 `quality/evidence/stage-reflection-user-review-card.md` 用户抽查确认卡：①下一个真实 WorkflowHub 任务需抽查的清单（每 stage 是否产出合规复盘、失败 stage 是否也复盘、confirm 是否落 v3 含原文、页面是否展示真实数据、复盘失败是否未阻断）；②判断质量审查指引（六类判断是否合理、confidence 是否如实、remove_candidate 是否有机器信号）；③AC-001 状态=`deferred_to_next_real_task`，evidence 允许来自下一个真实任务，届时由用户审查判断质量后确认并回填映射表；④明确本任务 close 前 AC-002~AC-012 已由 T20 构造场景 + T0/T18/T19 过程证据覆盖。
- **精确文件**: `quality/evidence/stage-reflection-user-review-card.md`
- **boundary**: 不伪造 AC-001 通过；不把构造场景写成真实任务证据；不新增流程节点。
- **输出**: 确认卡落盘；AC-001 交接口径显式。
- **Knowledge**: D-010 验收=真实任务端到端 + 用户审查判断质量后确认。
- **verification_role**: manual
- **paired_task**: T20
- **gate_cmd**: `bash -c 'test -s quality/evidence/stage-reflection-user-review-card.md && grep -q "deferred_to_next_real_task" quality/evidence/stage-reflection-user-review-card.md && grep -q "判断质量" quality/evidence/stage-reflection-user-review-card.md && grep -q "AC-001" quality/evidence/stage-reflection-ac-mapping.md'`
- **expected_exit**: 0
- **oracle**: 确认卡非空且含 deferred 口径与判断质量抽查指引；映射表 AC-001 行存在且未标绿。
- **evidence_path**: `quality/evidence/stage-reflection-user-review-card.md`
- **STOP**: 若用户要求本任务 close 前必须完成真实任务端到端，停止 close 并等待真实任务窗口。
- **recovery**: 无代码回滚；按用户决定调整 AC-001 处置口径并修订映射表。
- **task risk**: 下一真实任务间隔过长导致 AC-001 长期悬空——确认卡含回填指引，页面 unknown 状态可见。
- **完成区**: status: pending；执行事实: 待填。

### T22-RED. stage-runner on_stage_end 调度语义 + 机器前奏集成测试 RED

- **ID**: T22
- **Phase**: Phase 3（build-code，可与 Phase 1/2 并行）
- **tier**: feature
- **goal**: 在 runner 扩展前证明 on_stage_end 调度语义与机器前奏集成测试当前失败。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-trig-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-fail-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-lesson-001]
- **source_refs**: [decision-log.md#R-004, decision-log.md#F-009, decision-log.md#FND-004]
- **decision_refs**: [decision-log.md#D-001, decision-log.md#D-009, plan.md#P-002]
- **输入**: 裁决 P-002（声明式 stage 结束 step + runner 小幅扩展）；steps.json step 9 字段结构；append-lesson-observation CLI 契约（T5）。
- **依赖**: [T0]
- **并行**: [T1, T7, T25]
- **FR**: FR-TRIG-001~002、FR-FAIL-001~002、FR-LESSON-001
- **AC**: AC-002、AC-005、AC-008
- **动作**: 创建 `tests/contract/stage-runner-on-stage-end.test.mjs`（fixture stage + steps 声明，走真实 stage-runner 入口）：①stage 前置 step 失败时，声明 `on_stage_end:true` 的复盘 step 仍被执行（失败 stage 也复盘）；②复盘 step（`blocking:false`）自身失败时只记录 outcome status（含错误摘要），stage 完成状态不翻转、close 照常；③stage completed 时复盘 step 照常执行且 close 照常；④机器前奏：runner 在执行复盘技能前先自动调用 append-lesson-observation——技能未启动、技能超时、技能失败三种场景下 raw_observation 均已追加落盘。运行预期失败（runner 未识别标记、无前奏）。
- **精确文件**: `tests/contract/stage-runner-on-stage-end.test.mjs`
- **boundary**: 只创建测试与 fixture 并记录 RED 事实；不改 stage-runner 与任何生产文件。
- **输出**: 测试存在；exit 非 0；失败来自调度语义/前奏缺失而非语法错误。
- **Knowledge**: 普通 step 语义两头堵（失败 stage 轮不到复盘 / 复盘失败拖挂 stage），P-002 裁决 runner 小幅扩展（不改校验器核心）。
- **verification_role**: RED
- **paired_task**: T24
- **gate_cmd**: `npx vitest run tests/contract/stage-runner-on-stage-end.test.mjs`
- **expected_exit**: 1
- **oracle**: 失败输出显示 runner 在前置失败时未执行 on_stage_end step / 复盘失败翻转了 stage 完成状态 / 前奏未追加 raw，证明 RED 来自未实现而非环境。
- **evidence_path**: `tests/contract/stage-runner-on-stage-end.test.mjs`
- **STOP**: 若测试意外通过，说明能力已存在或测试错误，重新评估。
- **recovery**: 删除测试并保留 RED 事实。
- **task risk**: fixture stage 与真实 runner 配置漂移——以真实 stage-runner 入口构造 fixture 并记录差异。
- **完成区**: status: pending；执行事实: 待填。

### T23. stage-runner 小幅扩展（on_stage_end 调度语义 + 机器前奏）

- **ID**: T23
- **Phase**: Phase 3（build-code）
- **tier**: feature
- **goal**: runner 识别声明式 stage 结束 step 并承担 raw 观察机器前奏；不改校验器核心。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-trig-002, specs/workflowhub-stage-reflection-20260830/spec.md#fr-fail-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-lesson-001]
- **source_refs**: [decision-log.md#R-004, decision-log.md#F-009]
- **decision_refs**: [decision-log.md#D-001, decision-log.md#D-009, plan.md#P-002]
- **输入**: T22 RED 测试；append-lesson-observation CLI（T5）。
- **依赖**: [T22, T5]
- **并行**: []
- **FR**: FR-TRIG-001~002、FR-FAIL-001~002、FR-LESSON-001
- **AC**: AC-002、AC-005、AC-008
- **动作**: 修改 `runtime/stage/stage-runner.mjs` 增加调度语义（只加调度、不改校验器核心）：①识别 `on_stage_end:true` 的 step——无论 stage 前置 step 成败都调度执行它；②`blocking:false` 的 step 自身失败只记录 outcome status（含错误摘要），不翻转 stage 完成状态、不阻断 close；③机器前奏：执行复盘技能前自动调用 append-lesson-observation CLI 追加 raw_observation（零 AI 成本；前奏自身失败只记 outcome，不阻断）；④未声明两字段的既有 step 行为零变化（默认值 `on_stage_end:false`、`blocking:true`）。
- **精确文件**: `runtime/stage/stage-runner.mjs`
- **boundary**: 不改校验器核心；不改既有 step 调度语义；不新增公共命令；不新增独立 facts/记录类型；不触碰 T9 的读取方行位（:958 确认读取）关切。
- **输出**: T24 复跑转绿；既有 stage-runner 相关回归不破坏。
- **Knowledge**: 白名单登记在 T3（stage-runner.mjs:38）；本任务只动调度路径。
- **verification_role**: test
- **paired_task**: T22
- **gate_cmd**: `bash -c 'npx vitest run tests/contract/stage-runner-on-stage-end.test.mjs && npx vitest run tests/e2e/vnext-five-stage-current.test.mjs'`
- **expected_exit**: 0
- **oracle**: 集成测试全绿（前置失败仍复盘 / 复盘失败 stage 仍 completed / close 照常 / 三场景 raw 已追加）；既有 v2 主骨架 e2e 回归全绿（既有 step 行为零变化）。
- **evidence_path**: `runtime/stage/stage-runner.mjs`
- **STOP**: 若实现需要改校验器核心或新增公共命令才能成立，停止——违反 P-002 边界，升级人工。
- **recovery**: git revert stage-runner 改动，保留 RED 事实。
- **task risk**: 调度扩展影响既有 step 序列——默认值兜底 + e2e 回归断言既有行为零变化。
- **完成区**: status: pending；执行事实: 待填。

### T24-GREEN. runner 调度语义测试 GREEN

- **ID**: T24
- **Phase**: Phase 3（build-code）
- **tier**: simple
- **goal**: 复跑 runner 集成测试证明 on_stage_end 调度与机器前奏达标。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-trig-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-fail-001]
- **source_refs**: [decision-log.md#R-004]
- **decision_refs**: [decision-log.md#D-001, decision-log.md#D-009, plan.md#P-002]
- **输入**: T23 完成；T22 RED 记录。
- **依赖**: [T23]
- **并行**: []
- **FR**: FR-TRIG-001~002、FR-FAIL-001~002、FR-LESSON-001
- **AC**: AC-002、AC-005、AC-008
- **动作**: 复跑 T22 同一 gate_cmd，预期 exit 0；记录 GREEN 事实。
- **精确文件**: `tests/contract/stage-runner-on-stage-end.test.mjs`
- **boundary**: 只运行测试并记录 GREEN 事实；不修改测试断言掩盖问题。
- **输出**: runner 集成测试绿；T13 挂载解除阻塞。
- **Knowledge**: F9 先 RED 后 GREEN。
- **verification_role**: GREEN
- **paired_task**: T22
- **gate_cmd**: `npx vitest run tests/contract/stage-runner-on-stage-end.test.mjs`
- **expected_exit**: 0
- **oracle**: 与 T22 完全相同的命令在实现后退出 0；任一断言失败即非 GREEN。
- **evidence_path**: `tests/contract/stage-runner-on-stage-end.test.mjs`
- **STOP**: 若仍失败，停止后续挂载工作并修复 runner 扩展。
- **recovery**: 回退 T23 并重跑 RED。
- **task risk**: fixture 覆盖不到五 workflow 真实差异——T20 构造场景 + AC-001 真实任务兜底。
- **完成区**: status: pending；执行事实: 待填。

### T25-RED. 复盘确定性校验器测试 RED

- **ID**: T25
- **Phase**: Phase 1（build-code）
- **tier**: feature
- **goal**: 在实现前证明 validate-stage-reflection 校验器测试当前失败。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-gate-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-gate-002, specs/workflowhub-stage-reflection-20260830/spec.md#fr-out-002]
- **source_refs**: [decision-log.md#R-009, decision-log.md#RISK-001]
- **decision_refs**: [decision-log.md#D-005, decision-log.md#D-006]
- **输入**: spec §5.2 judgments 契约、§5.5 confirmation v3 形态、§5.7 派生规则；stage-reflection.v1 schema 草案。
- **依赖**: [T0]
- **并行**: [T1, T7, T22]
- **FR**: FR-GATE-001~002、FR-OUT-002
- **AC**: AC-007、AC-002
- **动作**: 创建 `tests/contract/validate-stage-reflection.test.mjs` 与真实输入 fixture（复盘输出 + derive-consumption-edges 派生结果 + confirmation 记录）：①remove_candidate 双硬信号核验——仅当 30 天窗口内零消费 ∧（rejected ∨ 同 step_slug 人工介入≥2 次）同时成立时保留；②缺任一信号 → 机器强制改写降级为 needs_evidence 且记录降级事实；③unknown≠零消费——消费状态 unknown 的输入不算零消费，必须降级；④真实输入用例覆盖窗口边界（恰好 30 天内 / 31 天前）、零消费、rejected、同 step_slug 重复介入≥2；⑤evidence_refs 存在性解析——解析当前 task 的 quality/ 下 outcome/confirmation/evidence 记录，悬空引用 → 该判断 confidence 强制非 high 且复盘 status 落 degraded。运行预期失败（CLI 不存在）。
- **精确文件**: `tests/contract/validate-stage-reflection.test.mjs`
- **boundary**: 只创建测试与 fixture 并记录 RED；不改任何生产文件。
- **输出**: 测试存在；exit 非 0；失败来自 CLI 缺失。
- **Knowledge**: 机器强制降级兜底自评偏差（RISK-001）；校验器是确定性脚本，零 AI 成本。
- **verification_role**: RED
- **paired_task**: T27
- **gate_cmd**: `npx vitest run tests/contract/validate-stage-reflection.test.mjs`
- **expected_exit**: 1
- **oracle**: 失败输出显示 validate-stage-reflection.mjs 不存在，证明 RED 来自未实现而非环境。
- **evidence_path**: `tests/contract/validate-stage-reflection.test.mjs`
- **STOP**: 若意外通过，说明能力已存在或测试错误，重新评估。
- **recovery**: 删除测试与 fixture 并保留 RED 事实。
- **task risk**: fixture 与真实复盘产物/确认记录漂移——T2 schema 与 T8 writer 定稿后校准。
- **完成区**: status: pending；执行事实: 待填。

### T26. tools/cli/validate-stage-reflection.mjs 确定性校验器

- **ID**: T26
- **Phase**: Phase 1（build-code）
- **tier**: feature
- **goal**: 机器强制核验 remove 双硬信号与 evidence_refs 存在性，缺信号即降级并记录降级事实。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-gate-001, specs/workflowhub-stage-reflection-20260830/spec.md#fr-gate-002]
- **source_refs**: [decision-log.md#R-009, decision-log.md#RISK-001]
- **decision_refs**: [decision-log.md#D-005, decision-log.md#D-006]
- **输入**: T25 RED 测试与 fixture；stage-reflection.v1 schema（T2）；derive-consumption-edges 输出形态（T4）。
- **依赖**: [T2, T4, T25]
- **并行**: [T5, T7, T8, T9]
- **FR**: FR-GATE-001~002、FR-OUT-002
- **AC**: AC-007、AC-002
- **动作**: 新增 `tools/cli/validate-stage-reflection.mjs`（CLI 惯例：ESM + 严格 --key=value 白名单 + 入口守卫 + stdout JSON + 失败 exit 1 + --root 支持 fixture）：读复盘输出 `quality/stage-reflection/<stage>.json` + derive-consumption-edges.mjs 派生结果 + `quality/confirmations/` 记录；①逐条核验 remove_candidate 双硬信号——30 天窗口内零消费（派生结果 unknown 一律不算零消费）∧（confirmation rejected ∨ 同 step_slug 人工介入≥2 次）；缺任一信号机器强制改写该判断为 needs_evidence，并在输出中记录降级事实（downgraded_from / downgrade_reason / 核验时间）；②evidence_refs 存在性解析——逐条解析当前 task quality/ 下 outcome/confirmation/evidence 记录路径，悬空引用 → 该判断 confidence 强制非 high、复盘 status 落 degraded 并记录悬空清单；③核验幂等，只改 judgments/classification/confidence/status 与降级记录，不改写输入事实源（outcome/confirmation 只读）；move-map 登记（consumer=stage-reflection 复盘流程技能后机器核验与 CI/owner/删除条件=技能退役）。
- **精确文件**: `tools/cli/validate-stage-reflection.mjs`、`docs/architecture/move-map.json`
- **boundary**: 只读事实源；不做质量打分；不阻断流程（降级即输出修订，不 gate 推进）；不重复派生消费边（消费 derive CLI 输出）。
- **输出**: T27 复跑转绿；move-map 登记齐备。
- **Knowledge**: 降级事实必须落盘可审计（F6 统一外置执行记录）。
- **verification_role**: test
- **paired_task**: T25
- **gate_cmd**: `npx vitest run tests/contract/validate-stage-reflection.test.mjs`
- **expected_exit**: 0
- **oracle**: fixture 全绿：双信号齐备保留 remove_candidate；缺任一信号 / unknown 消费输入强制降级且降级事实落盘；窗口边界正确；悬空引用 → confidence 非 high + status degraded。
- **evidence_path**: `tools/cli/validate-stage-reflection.mjs`
- **STOP**: 若核验需要改写 outcome/confirmation 事实源才能成立，停止——违反 provenance 保留，升级人工。
- **recovery**: 删除脚本与 move-map 条目，保留 RED 事实。
- **task risk**: 窗口与「同 step_slug 介入≥2」口径与 spec 漂移——以 spec §5.7/§5.8 为准并在测试中固化。
- **完成区**: status: pending；执行事实: 待填。

### T27-GREEN. 复盘校验器测试 GREEN

- **ID**: T27
- **Phase**: Phase 1（build-code）
- **tier**: simple
- **goal**: 复跑校验器测试证明机器强制降级与存在性解析达标。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-stage-reflection-20260830/spec.md#fr-gate-001]
- **source_refs**: [decision-log.md#R-009]
- **decision_refs**: [decision-log.md#D-006]
- **输入**: T26 完成；T25 RED 记录。
- **依赖**: [T26]
- **并行**: [T9, T10]
- **FR**: FR-GATE-001~002、FR-OUT-002
- **AC**: AC-007、AC-002
- **动作**: 复跑 T25 同一 gate_cmd，预期 exit 0；记录 GREEN 事实；move-map 登记复核齐备。
- **精确文件**: `tests/contract/validate-stage-reflection.test.mjs`
- **boundary**: 只运行测试并记录 GREEN 事实；不修改断言掩盖问题。
- **输出**: 校验器测试全绿；Phase 1 Done 条件达成（T6 + T27）。
- **Knowledge**: F9 先 RED 后 GREEN。
- **verification_role**: GREEN
- **paired_task**: T25
- **gate_cmd**: `npx vitest run tests/contract/validate-stage-reflection.test.mjs`
- **expected_exit**: 0
- **oracle**: 与 T25 完全相同的命令在实现后退出 0；任一断言失败即非 GREEN。
- **evidence_path**: `tests/contract/validate-stage-reflection.test.mjs`
- **STOP**: 若仍失败，停止后续 Phase 并修复校验器实现。
- **recovery**: 回退 T26 并重跑 RED。
- **task risk**: 测试覆盖不足导致假绿——T20 构造场景按协议实走兜底。
- **完成区**: status: pending；执行事实: 待填。
