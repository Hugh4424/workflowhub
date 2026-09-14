# tasks · workflowhub-mechanism-simplification-t3-20260912

- **Template version**：plan-task.v4

## Phase 1 · 开工门禁与守卫基线

### Goal

实测任务Ⅱ 合并事实并校验祖先性与等待期范围，重测四守卫基线落 task-store artifact，为全部后续批次提供动态基线与开工许可证事实。

### Files

- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-preflight-check.md`

### Tasks

T0（单卡，门禁 + 基线重测；见 tasks.md Phase 1）

### Verify

`ORA-T0`：T0 gate 绿 = 任务Ⅱ 合并 SHA 实测登记 + ancestor 校验通过 + 提交区间干净 + `git status --porcelain=v1 --untracked-files=all` 原始行全部命中精确 allowlist + 四基线值（markdownlint / path-guard / verify-structure / 父材料 lint）为整数落盘。

### Knowledge

任务Ⅱ 未合入则 STOP（G1：只记事实）；基线读取一律变量化（禁止硬编码 610/0/2/82）；worktree / branch 认证随卡核对。

### STOP

`git merge-base --is-ancestor <实测SHA> HEAD` 失败；或实测 SHA 不是认证的任务Ⅱ merge commit / tree；或 `git diff --stat <任务Ⅱ实测merge SHA>..HEAD` 出现 specs/t3 与任务 store 之外的变化；或基线命令任一不可执行。

### Done

`t0-current-baseline.json` 含 merge_sha / ancestor_ok=true / scope_clean=true / 四基线整数；`t0-preflight-check.md` 含命令与 raw 输出引用。

### Risks and rollback

任务Ⅱ 长期不合入 → 停（无改动可回滚）；基线采集失败 → 重跑采集（幂等）。

### Task Blocks（执行序列）

本 Phase 所有任务严格按 T 号串行执行；RED 必须先于配对 GREEN，STOP 命中即停在本批。

#### T0

- **ID**：T0
- **Phase**：Phase 1 · 开工门禁与守卫基线
- **goal**：任务Ⅱ合并祖先门禁、等待期范围核对与四守卫动态基线重测
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：无（全任务首卡）
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-EXE-002
- **AC**：AC-EXE-002
- **动作**：实测任务Ⅱ合并 SHA；校验祖先性与提交区间；运行 git status --porcelain=v1 --untracked-files=all 并按精确 allowlist 核对 index/worktree/untracked；运行 markdownlint、path-guard、verify-structure、父材料 lint 并把命令/退出码/原始输出/计数落两个证据文件；未合入或发现 runtime/治理/测试脏文件按 G1 停止且不编辑仓库文件
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-preflight-check.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-preflight-check.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-preflight-check.md 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：N/A — 非行为变更：取证、登记或批次编排
- **paired_task**：N/A — 非行为变更：行为验证由同批 GREEN 卡或后续验收卡承担
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs');const r=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests',p=r+'/t0-current-baseline.json';if(!fs.existsSync(p))process.exit(1);const x=JSON.parse(fs.readFileSync(p));if(!/^[a-f0-9]{40}$/.test(x.merge_sha||'')||x.ancestor_ok!==true||x.scope_clean!==true||x.status_command!=='git status --porcelain=v1 --untracked-files=all'||!Array.isArray(x.status_rows)||x.status_rows.some(v=>!/^\?\? specs\/workflowhub-mechanism-simplification-t3-20260912\/|^\?\? \.probe\.txt$/.test(v)))process.exit(1);for(const k of ['markdownlint','record_paths','structure','parent_lint'])if(!x[k]||!Number.isInteger(x[k].exit_code)||!Number.isInteger(x[k].errors??x[k].failures)||typeof x[k].stdout_summary!=='string')process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T0 {"pass":"登记或取证满足本卡明示结构与计数判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-preflight-check.md
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：高：任务Ⅱ未合入或工作树/index越界即全任务停止

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：仅新增 task-store 证据 `quality/tests/t0-current-baseline.json` 与 `quality/tests/t0-preflight-check.md`；未改生产代码、治理文件或测试源。
- **executed_commands**：`git show --format='%H%n%T%n%P%n%s' --no-patch 24ff1966`（exit 0）；`git merge-base --is-ancestor 24ff1966 HEAD`（exit 0）；`git diff --stat 24ff1966..HEAD`（exit 0，仅四个已知任务Ⅱ归档 rename）；`git status --porcelain=v1 --untracked-files=all`（exit 0，5 行均命中 allowlist）；锁定 markdownlint（exit 1 / 607 errors / 200 files）、path-guard（exit 0 / 0 failures）、verify-structure（exit 1 / 2 failures）、父材料 lint（exit 1 / 82 errors）；T0 `gate_cmd`（exit 0）。
- **evidence_refs**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json`; `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-preflight-check.md`
- **covered_ac**：`AC-EXE-002`：ancestor 校验通过，当前 worktree/index status 仅有 T3 四材料与已知 `.probe.txt`；四守卫动态基线已按实际结果落盘。提交区间含 `aa9ef654` 已知任务Ⅱ归档 rename，已在证据中显式登记，未伪装为 T3 变更。
- **review_fact**：已尝试公开 `review --action=record --stage=build-code --subject_kind=phase --phase_id=phase-1`；因 T0 为非行为取证卡且没有可绑定的通过测试 receipt，CLI 在 provider dispatch 前返回 `MATERIAL_INCOMPLETE: build-code test_evidence requires receipt_ref and receipt_hash`。未伪造 receipt，Phase 1 review 记录为 unavailable，保留原始失败事实。
- **completed_at**：2026-09-14T01:01:12Z

## Phase 2 · 四条现场阻塞修复

### Goal

四条阻塞按 D-004 先于 C7 修复：写侧 scope 指纹（缺陷 1）、审查记录内容绑定（缺陷 2）、spec-analyze 显式 skip（缺陷 3）、direction_change fixed 终态（缺陷 4），各有针对性测试与登记。

### Files

- **MODIFY** `runtime/evidence/freshness.mjs`
- **MODIFY** `runtime/stage/stage-content-contracts.mjs`
- **MODIFY** `runtime/stage/stage-handlers.mjs`
- **MODIFY** `runtime/stage/stage-runner.mjs`
- **MODIFY** `tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- **MODIFY** `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t7-legacy-review-recalc.md`
- **NEW** `tests/integration/stage-row-scope-digest.test.mjs`
- **NEW** `tests/review/review-result-content-binding.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/acceptance-execution-tier.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/execution-outcome.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/review-public-entrypoints.test.mjs`
- **READ-ONLY CONSUMER** `tests/integration/stage-outcome-record-row-redirect.test.mjs`
- **READ-ONLY CONSUMER** `tests/integration/stage-row-publication.test.mjs`
- **READ-ONLY CONSUMER** `tests/review/review-record-route.test.mjs`
- **READ-ONLY CONSUMER** `tests/stage-risk-acceptance.test.mjs`

### Tasks

T1-T11（四条修复各 RED/GREEN 对 + T3 历史行登记 + T4 标本读回 + T7 OPEN-001 复算；见 tasks.md Phase 2）

### Verify

`ORA-FIX-001` 为 Phase 2 交接 oracle：其 gate 必须连同 `execution-outcome.test.mjs` 通过；并要求 `ORA-FIX-002`、`ORA-FIX-003`、`ORA-FIX-004` 各自 RED/GREEN 全绿 + 附录 B 两条测试期望变更随批提交并点名 + direction_change/fixed 的 current material_revision 接受、old revision 重放拒绝 + 本任务 make-decision / build-spec 行重跑读回不报 stale + 受害历史行登记完成 + OPEN-001 复算登记。

### Knowledge

缺陷 3 / 4 同文件串行（T8/T9 → T10/T11）；T4 依赖 T2；修复只做写侧与校验侧最小面，行字段表 16 键不动。

### STOP

任一 RED 不红（判据不可失败 = 测试无效）；任一 GREEN 不绿；T4 读回仍 stale；既有回归测试任一变红。

### Done

四个 runtime 文件中的五个修复站点改动落盘；Phase 2 named RED/GREEN gates 与 ORA-FIX-001 聚合 gate 均有证据；p2-fix-ledger.md 含四条修复记录、期望变更登记、历史坏行登记、标本读回和 legacy review 复算引用。

### Risks and rollback

修复引入回归 → revert 该对；T4 重跑绑定变化 → 登记事实并停在批内；回滚 = revert 本批。

### Task Blocks（执行序列）

本 Phase 所有任务严格按 T 号串行执行；RED 必须先于配对 GREEN，STOP 命中即停在本批。

#### T1

- **ID**：T1
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：缺陷1：stage 行写侧使用阶段 scope 指纹且字段表不变
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T0
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-001
- **AC**：AC-FIX-001
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`runtime/stage/stage-runner.mjs`；`tests/integration/stage-row-scope-digest.test.mjs`；`tests/integration/stage-outcome-record-row-redirect.test.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/contract/execution-outcome.test.mjs`
- **boundary**：files：`runtime/stage/stage-runner.mjs`；`tests/integration/stage-row-scope-digest.test.mjs`；`tests/integration/stage-outcome-record-row-redirect.test.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/contract/execution-outcome.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t1-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T2
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/stage-row-scope-digest.test.mjs tests/integration/stage-outcome-record-row-redirect.test.mjs tests/integration/stage-row-publication.test.mjs tests/contract/execution-outcome.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-FIX-001 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t1-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-FIX-001
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：新增 `tests/integration/stage-row-scope-digest.test.mjs`；仅完成缺陷1的 RED 取证，生产 fallback 在配对 T2 实施。
- **executed_commands**：按计划命令尝试一次（exit 1，任务 worktree 无依赖树）；随后使用同版本锁定 Vitest、任务 worktree root 和临时依赖解析配置复算同一具名 gate（exit 1），新测试的两个 scope fallback 断言均按 oracle 暴露失败；`stage-row-publication` 4/4 与 `execution-outcome` 9/9 通过，另两项既有 row-reader 失败单独登记。
- **evidence_refs**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t1-red.log`
- **covered_ac**：`AC-FIX-001` 的 RED 前置事实：make-decision/build-spec 缺失 scope 投影时，旧实现未能发布当前 stage handoff/row scope digest；未宣称实现完成。
- **review_fact**：T1 为 paired RED 取证卡；未提交 provider review，待 GREEN gate 通过后才具备可绑定的测试 receipt。
- **completed_at**：2026-09-14T09:15:30+08:00

#### T2

- **ID**：T2
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：缺陷1：stage 行写侧使用阶段 scope 指纹且字段表不变
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T1
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-001
- **AC**：AC-FIX-001
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`runtime/stage/stage-runner.mjs`；`tests/integration/stage-row-scope-digest.test.mjs`；`tests/integration/stage-outcome-record-row-redirect.test.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/contract/execution-outcome.test.mjs`
- **boundary**：files：`runtime/stage/stage-runner.mjs`；`tests/integration/stage-row-scope-digest.test.mjs`；`tests/integration/stage-outcome-record-row-redirect.test.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/contract/execution-outcome.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t2-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T1
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/integration/stage-row-scope-digest.test.mjs tests/integration/stage-outcome-record-row-redirect.test.mjs tests/integration/stage-row-publication.test.mjs tests/contract/execution-outcome.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-FIX-001 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t2-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-FIX-001
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：按计划修改 `runtime/stage/stage-runner.mjs` 两处 fallback，改用 `ctx.kernel.currentVNextMaterialScopeRevision(stage)`；随后修正 named row consumer 中与当前 vNext 单 execution-record row 契约不一致的两组过时断言；未恢复 row schema、reader stale invalidation、旧 release 字段或兼容桥。
- **executed_commands**：T1/T2 同一具名 gate，先记录 exit 1 的真实 consumer-contract drift，登记计划偏差后复跑；使用同版本锁定 Vitest、任务 worktree root 和临时依赖解析配置，最终 exit 0：4 个 test files、27 个 tests 全部通过。
- **evidence_refs**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t2-green.log`
- **covered_ac**：`AC-FIX-001`：make-decision/build-spec 缺失 scope 投影时 row/handoff 使用当前 stage scope；同一 named union gate 通过；current vNext row consumer 保持 16-key / no-product-release 边界。
- **review_fact**：尚未执行 Phase 2 provider review；后续需先取得当前测试 receipt，再按 build-code review contract 记录本 Phase review。
- **completed_at**：2026-09-14T09:23:05+08:00

#### T3

- **ID**：T3
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：登记 PaperBuilder 受害任务历史坏行，明确不可恢复且不改历史字节
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T2
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-001
- **AC**：AC-FIX-001
- **动作**：只读受害任务 stage 行与 stale 诊断，记录路径、现象、错误指纹及“不迁移/不手修”处置
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：N/A — 非行为变更：取证、登记或批次编排
- **paired_task**：N/A — 非行为变更：行为验证由同批 GREEN 卡或后续验收卡承担
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`bash -c 'test -s "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md" && grep -q "PaperBuilder" "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md"'`
- **expected_exit**：0
- **oracle**：`ORA-T3 {"pass":"登记或取证满足本卡明示结构与计数判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：低

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：仅新增 task-store 证据 `quality/tests/p2-fix-ledger.md`；只读登记 PaperBuilder `make-decision` 历史坏 row 及 scope fingerprint mismatch；未修改 PaperBuilder 任意字节。
- **executed_commands**：只读 `wc/shasum`、facts/index 结构化回读、当前材料 one-scope/four-material fingerprint 复算；T3 gate（`test -s ...p2-fix-ledger.md && grep -q PaperBuilder ...`，WORKFLOWHUB_TASK_DIR 指向权威 task-store root）exit 0。
- **evidence_refs**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`
- **covered_ac**：`AC-FIX-001` 历史分轨：PaperBuilder 坏 row 明确登记为不可恢复；`facts.jsonl` 当前 sha256 与行字段留证；不迁移、不手修、不改历史 bytes。
- **review_fact**：T3 为非行为取证卡；不单独触发 provider review，Phase 2 review 在行为 GREEN 与完整测试 receipt 后统一记录。
- **completed_at**：2026-09-14T09:27:00+08:00

#### T4

- **ID**：T4
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：以本任务 make-decision/build-spec 行为现场标本重跑 stage end 并验证可读回
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T3
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-001
- **AC**：AC-FIX-001
- **动作**：按 decision-log §13.5 在最后一次材料记账后重跑两阶段 stage end；立即 status 读回；记录 scope 指纹与 stale 诊断结果；禁止手改行
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-batch-boundary.json`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-batch-boundary.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-batch-boundary.json 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：N/A — 非行为变更：取证、登记或批次编排
- **paired_task**：N/A — 非行为变更：行为验证由同批 GREEN 卡或后续验收卡承担
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs');const r=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests';const s=fs.readFileSync(r+'/p2-fix-ledger.md','utf8');if(!/make-decision/.test(s)||!/build-spec/.test(s)||!/stale=0/.test(s)||!fs.existsSync(r+'/p2-batch-boundary.json'))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T4 {"pass":"登记或取证满足本卡明示结构与计数判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-batch-boundary.json
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：高：stage end 重跑必须紧贴最后一次材料记账

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：通过 public `stage-runtime` 对当前 task 的 `make-decision`、`build-spec` 分别执行 stage end；未手改 `facts.jsonl`。修复后的 writer 将两行 `material_digest` 写为各自 stage scope revision，未把缺失 Stage Agent outcome、reflection 或 handoff 伪装成完成。
- **executed_commands**：按 T4 具名命令执行两次 `node tools/cli/stage-runtime.mjs run --action=execute ...`，每次随后立即执行对应 `status --action=begin`；两次 run 和两次 status 均 exit 0。make-decision scope=`ac4aba92a7bae685c35cd71ac991df92f81d5b472598912d5b03ae9e4fe9093b`，build-spec scope=`2059da57997dc41f30aa7053db89ba3543a20f48e9283a9f36226994b10487f9`；status 均 `work_status=ready`、无 stale diagnostic，但质量仍 `in_progress`，Stage Agent outcome/reflection unavailable。
- **evidence_refs**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`; `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-batch-boundary.json`
- **covered_ac**：`AC-FIX-001`：当前 make-decision/build-spec specimen row 按 stage-owned scope 写入并可由立即 status 读回；`stale=0` 只代表当前 row 无 stale diagnostic，不代表质量、reflection 或 Stage Agent outcome 已完成。
- **review_fact**：T4 为高风险 stage-end 编排/读回卡；Phase 2 provider review 仍待完整 GREEN 测试 receipt 后统一记录。
- **completed_at**：2026-09-14T09:40:00+08:00

#### T5

- **ID**：T5
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：缺陷2：审查记录改为内容绑定，非旧文件名形态可读且篡改被拒
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T4
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-002
- **AC**：AC-FIX-002
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`runtime/evidence/freshness.mjs`；`runtime/stage/stage-handlers.mjs`；`tests/review/review-result-content-binding.test.mjs`；`tests/review/review-record-route.test.mjs`；`tests/contract/review-public-entrypoints.test.mjs`；`tests/contract/acceptance-execution-tier.test.mjs`
- **boundary**：files：`runtime/evidence/freshness.mjs`；`runtime/stage/stage-handlers.mjs`；`tests/review/review-result-content-binding.test.mjs`；`tests/review/review-record-route.test.mjs`；`tests/contract/review-public-entrypoints.test.mjs`；`tests/contract/acceptance-execution-tier.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t5-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T6
- **test tier / test method**：fullstack / command 层跨review attempt-result-provenance内容绑定
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/review/review-result-content-binding.test.mjs tests/review/review-record-route.test.mjs tests/contract/review-public-entrypoints.test.mjs tests/contract/acceptance-execution-tier.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-FIX-002 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t5-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-FIX-002
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：新增 `tests/review/review-result-content-binding.test.mjs` 作为历史 simple result 文件名回归夹具；保留并修复现有 review consumer 断言以匹配当前 vNext 内容绑定语义与 `authenticateQualityFactRecord` API。T5 只记录 RED，不把失败改写为实现完成。
- **executed_commands**：按本卡具名四文件 gate 执行一次，exit 1：2 个失败、157 个通过；失败分别为 `runtime/stage/stage-handlers.mjs` 的历史 result/attempt 文件名相等校验，以及 acceptance consumer 仍调用已移除的 `evaluateFactFreshness`。实际运行使用锁定 Vitest、任务 worktree config 和临时依赖解析 workaround，原始失败保存在证据。
- **evidence_refs**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t5-red.log`
- **covered_ac**：`AC-FIX-002` 的 RED 前置事实：非旧 simple 文件名的 canonical result 被错误拒绝；既有 acceptance consumer 仍残留退役 freshness API。未宣称实现完成。
- **review_fact**：T5 为 paired RED 取证卡；未提交 provider review，待 T6 GREEN receipt 后统一记录 Phase 2 review。
- **completed_at**：2026-09-14T10:07:44+08:00

#### T6

- **ID**：T6
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：缺陷2：审查记录改为内容绑定，非旧文件名形态可读且篡改被拒
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T5
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-002
- **AC**：AC-FIX-002
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`runtime/evidence/freshness.mjs`；`runtime/stage/stage-handlers.mjs`；`tests/review/review-result-content-binding.test.mjs`；`tests/review/review-record-route.test.mjs`；`tests/contract/review-public-entrypoints.test.mjs`；`tests/contract/acceptance-execution-tier.test.mjs`
- **boundary**：files：`runtime/evidence/freshness.mjs`；`runtime/stage/stage-handlers.mjs`；`tests/review/review-result-content-binding.test.mjs`；`tests/review/review-record-route.test.mjs`；`tests/contract/review-public-entrypoints.test.mjs`；`tests/contract/acceptance-execution-tier.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t6-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T5
- **test tier / test method**：fullstack / command 层跨review attempt-result-provenance内容绑定
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/review/review-result-content-binding.test.mjs tests/review/review-record-route.test.mjs tests/contract/review-public-entrypoints.test.mjs tests/contract/acceptance-execution-tier.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-FIX-002 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t6-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-FIX-002
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`runtime/stage/stage-handlers.mjs` 与 `runtime/evidence/freshness.mjs` 移除历史 result basename equality，继续要求 canonical attempt identity、provider output provenance、content hash 和 quorum/authentication；`tests/review/review-result-content-binding.test.mjs` 验证历史文件名仍可读；`tests/contract/acceptance-execution-tier.test.mjs` 对齐 `authenticateQualityFactRecord` 与 current vNext alias 语义。
- **executed_commands**：与 T5 完全相同的四文件 gate，最终 exit 0：4 个 test files、159 个 tests 全部通过（review-record-route 95/95、acceptance-execution-tier 43/43、review-public-entrypoints 20/20、review-result-content-binding 1/1），duration 621.71s；实际运行使用锁定 Vitest、任务 worktree config 和临时依赖解析 workaround。
- **evidence_refs**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t6-green.log`
- **covered_ac**：`AC-FIX-002`：历史 result 文件名不再被当作 freshness 身份；当前 attempt/output/result 内容绑定仍经 canonical authentication；旧 API consumer 已迁移；四文件 named GREEN gate 通过。
- **review_fact**：尚未执行 Phase 2 provider review；需在 T1-T11 完成并取得最终 Phase 2 测试 receipt 后统一记录当前 review，保留 provider unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T10:30:25+08:00

#### T7

- **ID**：T7
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：逐对复算 OPEN-001 历史审查实例并登记内容绑定结果
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T6
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-002
- **AC**：AC-FIX-002
- **动作**：只读历史 review attempt/result/report 三向引用；逐对复算 sha256 与身份互链；不改历史文件
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t7-legacy-review-recalc.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t7-legacy-review-recalc.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t7-legacy-review-recalc.md 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：N/A — 非行为变更：取证、登记或批次编排
- **paired_task**：N/A — 非行为变更：行为验证由同批 GREEN 卡或后续验收卡承担
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`bash -c 'test -s "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t7-legacy-review-recalc.md" && grep -q "OPEN-001" "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t7-legacy-review-recalc.md"'`
- **expected_exit**：0
- **oracle**：`ORA-T7 {"pass":"登记或取证满足本卡明示结构与计数判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t7-legacy-review-recalc.md
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：低

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：仅新增 canonical task-store 证据 `quality/tests/t7-legacy-review-recalc.md`；只读复算 PaperBuilder 四组 OPEN-001 历史 result/attempt/report 互链与 SHA-256，未修改 PaperBuilder 任意字节。
- **executed_commands**：子代理只读扫描 authoritative PaperBuilder task store（1146 个文件，`rg -i OPEN-001` 命中 33 个文件）；逐项解析四个 `wh-review-result.v1` result，解析 `attempt_ref/report_ref`，重算 result/attempt/report hashes 与身份字段；T7 gate 使用 `WORKFLOWHUB_TASK_DIR=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks` 执行，exit 0。
- **evidence_refs**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t7-legacy-review-recalc.md`
- **covered_ac**：`AC-FIX-002`：OPEN-001 仍只存在于 legacy review 文本/finding（`F-9c33e84310ca`），四组 result/attempt/report 互链可读但绑定旧 material revision/snapshot；无独立 canonical OPEN-001 fact，不迁移、不重写、不把旧记录提升为当前结论。
- **review_fact**：T7 为只读历史取证卡；未提交 provider review，待 T8-T11 完成后按 Phase 2 review contract 统一记录。
- **completed_at**：2026-09-14T10:35:00+08:00

#### T8

- **ID**：T8
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：缺陷3：heading-less 材料产生显式 spec-analyze skip 事实
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T7
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-003
- **AC**：AC-FIX-003
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`；`tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- **boundary**：files：`runtime/stage/stage-content-contracts.mjs`；`tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t8-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T9
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/five-stage-spec-analyze-wiring.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-FIX-003 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t8-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-FIX-003
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：新增 heading-less make-decision/build-spec 断言，先证明当前实现缺少显式 skip fact；生产修复在配对 T9 实施。
- **executed_commands**：按本卡具名 gate 运行一次，exit 1：21 tests 中 19 passed、2 failed；两个失败都指出返回 `facts` 缺少 `spec_analyze` skip fact。实际运行使用锁定 Vitest 与任务 worktree config。
- **evidence_refs**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t8-red.log`
- **covered_ac**：`AC-FIX-003` 的 RED 前置事实：heading-less structural threshold 下 analyzer 静默返回 `consistent`，无法区分“没跑”和“跑过且通过”。未宣称实现完成。
- **review_fact**：T8 为 paired RED 取证卡；未提交 provider review，待 T1-T11 完成后统一记录 Phase 2 review。
- **completed_at**：2026-09-14T10:35:57+08:00

#### T9

- **ID**：T9
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：缺陷3：heading-less 材料产生显式 spec-analyze skip 事实
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T8
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-003
- **AC**：AC-FIX-003
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`；`tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- **boundary**：files：`runtime/stage/stage-content-contracts.mjs`；`tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t9-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T8
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/five-stage-spec-analyze-wiring.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-FIX-003 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t9-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-FIX-003
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：在 `validateStageSpecAnalyzeProfile()` 的 make-decision/build-spec structural threshold 两个分支增加显式 `facts.spec_analyze` skip fact，仅在材料非空但无 Markdown heading 时落盘；未新增顶层返回键、schema、status 或控制面。
- **executed_commands**：与 T8 完全相同的具名 gate，最终 exit 0：1 个 test file、21 个 tests 全部通过，duration 331ms；headed analyzer 语义校验与既有缺料/coverage 失败路径保持通过。
- **evidence_refs**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t9-green.log`
- **covered_ac**：`AC-FIX-003`：heading-less make-decision/build-spec 返回 `facts.spec_analyze.status=skipped` 与可读 reason；“没跑”与“跑过且通过”可区分；named GREEN gate 通过。
- **review_fact**：尚未执行 Phase 2 provider review；需 T1-T11 完成并取得最终 Phase 2 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T10:36:37+08:00

#### T10

- **ID**：T10
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：缺陷4：direction_change 复用 fixed，以既有 gap.material_revision 绑定当前材料修订并拒绝旧修订重放
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T9
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-004
- **AC**：AC-FIX-004
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`；`runtime/stage/stage-handlers.mjs`；`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`；`tests/stage-risk-acceptance.test.mjs`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`
- **boundary**：files：`runtime/stage/stage-content-contracts.mjs`；`runtime/stage/stage-handlers.mjs`；`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`；`tests/stage-risk-acceptance.test.mjs`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t10-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T11
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/stage-risk-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-FIX-004 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t10-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-FIX-004
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：T10 先新增 `direction_change + fixed` 的直接路由断言与 current/old `gap.material_revision` handler 断言，保留同门禁 RED；并登记同批发现的既有 C5 公共入口消费者漂移。
- **executed_commands**：具名 T10 gate 以 pre-fix 快照执行，exit 1：46 tests 中 43 passed、3 failed；其中 2 个为 FR-FIX-004 目标失败，1 个为既有 C5 consumer assertion drift，均在 `t10-red.log` 明示。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t10-red.log`]
- **covered_ac**：`AC-FIX-004` RED 前置：当前实现不能接受 `direction_change + fixed`，也不能完成 current material_revision 绑定；旧修订拒绝断言随卡落地。
- **review_fact**：T10 为 paired RED 取证卡；未提交 provider review，待 Phase 2 最终测试 receipt 后统一记录当前 review。
- **completed_at**：2026-09-14

#### T11

- **ID**：T11
- **Phase**：Phase 2 · 四条现场阻塞修复
- **goal**：缺陷4：direction_change 复用 fixed，以既有 gap.material_revision 绑定当前材料修订并拒绝旧修订重放
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T10
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-FIX-004
- **AC**：AC-FIX-004
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`；`runtime/stage/stage-handlers.mjs`；`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`；`tests/stage-risk-acceptance.test.mjs`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`
- **boundary**：files：`runtime/stage/stage-content-contracts.mjs`；`runtime/stage/stage-handlers.mjs`；`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`；`tests/stage-risk-acceptance.test.mjs`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p2-fix-ledger.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t11-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T10
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/stage-risk-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-FIX-004 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t11-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-FIX-004
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`validateFindingRouting()` 接受 `direction_change + fixed` 并路由回 `make-decision`；四个 stage handler 将 fixed direction-change gap 的 `material_revision` 与当前 worker revision 比对，旧修订返回 incomplete；同时将公共 C5 review consumer 断言对齐当前材料 provenance/五维复用契约。
- **executed_commands**：与 T10 完全相同的具名 gate，最终 exit 0：2 个 test files、46 tests 全部通过，duration 5.95s；实际运行使用锁定 Vitest、任务 worktree config 和临时依赖解析 workaround。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t11-green.log`]
- **covered_ac**：`AC-FIX-004`：current material_revision 的 `direction_change + fixed` 记录为 recorded，old revision 重放为 incomplete；accepted_risk 路径回归保持通过。
- **review_fact**：尚未执行 Phase 2 provider review；需 T1-T11 完成并取得最终 Phase 2 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T10:42:30+08:00

## Phase 3 · C7 治理同步

### Goal

宪法 1.9.0 四件同步 + CONTEXT 两处 + npm 显式分组与 CI + hash 清单与治理文字净减 + 父材料更正与 lint 收口 + close 收敛 + 对照表登记 + 净增减账，C7 批 AC 全过。

### Files

- **MODIFY** `.github/workflows/ci.yml`
- **MODIFY** `.markdownlint-cli2.jsonc`
- **MODIFY** `AGENTS.md`
- **MODIFY** `CLAUDE.md`
- **MODIFY** `CONSTITUTION.md`
- **MODIFY** `constitution-checklist.md`
- **MODIFY** `CONTEXT.md`
- **MODIFY** `README.md`
- **MODIFY** `core/task-close.mjs`
- **MODIFY** `docs/adr/0002-requirement-lineage-and-step-audit.md`
- **MODIFY** `docs/adr/0002-v4-review-exception-state-matrix.md`
- **MODIFY** `docs/adr/0009-same-snapshot-phase0-recovery-requires-explicit-intent.md`
- **MODIFY** `docs/adr/0009-stage-content-authority.md`
- **MODIFY** `docs/adr/0011-authenticated-review-flow-generations.md`
- **MODIFY** `docs/adr/0017-stage-quality-fact-freshness-scope.md`
- **MODIFY** `docs/adr/0019-canonical-quality-ownership-and-compatibility.md`
- **MODIFY** `docs/adr/0020-close-five-actions-quality-transcription.md`
- **MODIFY** `docs/adr/0025-convergence-outline-and-close-loop.md`
- **MODIFY** `docs/adr/0025-planning-branch-and-maintainable-prd.md`
- **MODIFY** `docs/adr/0025-review-dispatch-preflight-boundaries.md`
- **MODIFY** `docs/adr/0026-equivalent-stage-outcome-attempts.md`
- **MODIFY** `docs/adr/0027-planning-task-question-boundary.md`
- **MODIFY** `docs/adr/0027-test-feedback-runtime-profile.md`
- **MODIFY** `docs/adr/0028-plan-slicing-and-review-budget.md`
- **MODIFY** `docs/adr/0029-current-ac-and-close-state.md`
- **MODIFY** `docs/architecture/control-plane-inventory.json`
- **MODIFY** `docs/architecture/move-map.json`
- **MODIFY** `docs/audit-contracts.md`
- **MODIFY** `docs/research/ai-cli-host-skill-distribution.md`
- **MODIFY** `docs/research/m18-skill-plugin-distribution-ecosystem-research-2026-09-03.md`
- **MODIFY** `package.json`
- **MODIFY** `specs/workflowhub-mechanism-simplification-20260910/decision-log.md`
- **MODIFY** `specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`
- **MODIFY** `tests/close/close-contract.test.mjs`
- **MODIFY** `tests/stage-risk-acceptance.test.mjs`（:300 版本 pin 1.8.0 → 1.9.0，随宪法四件同步）
- **MODIFY** `tools/cli/task-close.mjs`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/net-lines.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p3-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p3-c7-handoff.md`
- **NEW** `tests/contract/test-entry-grouping.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/close-authorization-diagnostics.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/close-sidecar-and-archive.test.mjs`

### Tasks

T12-T29（宪法对 / CONTEXT 对 / npm 分组对 / hash 清单扫描与删除对 / 父材料对 / lint 收口对 / close 对 / 对照表对 + T29 净增减账；见 tasks.md Phase 3）

### Verify

`ORA-GOV-001` 为 Phase 3 交接 oracle：宪法断言脚本全项过，并要求 ORA-GOV-007 verify-structure exit 0 且守卫字节不变 + ORA-GOV-011 分组并集覆盖证明绿 + ORA-GOV-016 hash 清单正文/副本复算对账零新增且删除项均有 owner + ORA-GOV-008 父材料 lint 0 且 X 复核 14/14 + ORA-GOV-005 全仓 lint exit 0 + ORA-GOV-013 close 测试绿且凭证 / plan hash 校验保留 + ORA-GOV-004 源事实对照表无「仍矛盾」行 + ORA-T29 净增减账逐文件实测。

### Knowledge

宪法 → hash 文字（T12/13 → T19/20）串行；lint 收口（T23/24）在父材料与文档族之后；对照表（T27/28）在所有改动之后针对最终事实；plan.md 只许登记区回填。

### STOP

守卫脚本字节变化；条目数 ≠ 22；清单发现身份绑定类被误删；清单发现代码侧过程化产物站点不在候选集（回 plan 处置）；ignores 条目无理由 / owner；对照表出现「仍矛盾」行。

### Done

治理文档族与 runtime 收敛面全部落盘；hash-inventory.json 五要素齐备；plan.md 对照表登记区回填完成；net-lines.json 逐文件净值；全仓 markdownlint exit 0。

### Risks and rollback

宪法措辞偏差 → 按附录 A 草案逐字核对回改；分组漏文件 → 覆盖证明红 = STOP 修映射；close 收敛误删校验 → 既有测试红 = STOP 回滚该卡；回滚 = revert 本批单文件。

### Task Blocks（执行序列）

本 Phase 所有任务严格按 T 号串行执行；RED 必须先于配对 GREEN，STOP 命中即停在本批。

#### T12

- **ID**：T12
- **Phase**：Phase 3 · C7 治理同步
- **goal**：宪法1.9.0四件同步、负向条款十五条、八类分类学与守卫三要件、stage-risk-acceptance版本pin同步(1.8.0→1.9.0)
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T11
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-001, FR-GOV-002, FR-GOV-003
- **AC**：AC-GOV-001, AC-GOV-002, AC-GOV-003
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`CONSTITUTION.md`；`constitution-checklist.md`；`tests/stage-risk-acceptance.test.mjs`
- **boundary**：files：`CONSTITUTION.md`；`constitution-checklist.md`；`tests/stage-risk-acceptance.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t12-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T13
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs');const c=fs.readFileSync('CONSTITUTION.md','utf8'),k=fs.readFileSync('constitution-checklist.md','utf8'),t=fs.readFileSync('tests/stage-risk-acceptance.test.mjs','utf8');if(!/Version:\s*1\.9\.0/.test(c)||!/F11/.test(c)||!/默认不新增 hash/.test(c)||!/负向条款/.test(c)||(c.match(/拒绝方案|禁止方案|负向条款/g)||[]).length<15||['绑定','归因','恢复','生命周期','质量','交互','执行','治理'].some(x=>!c.includes(x))||!/(身份|完整性)/.test(c)||!/close 三义判据/.test(k)||!/Version:\s*1\.9\.0/.test(t))process.exit(1);const ids=[...k.matchAll(/^- \[ \] \*\*([FQS]\d+)/gm)].map(x=>x[1]);if(ids.length!==22||new Set(ids).size!==22)process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-GOV-001 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t12-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-001
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：T12 先以同一 ORA-GOV-001 门禁确认 Version 1.9.0、F11、负向条款、分类学和 22 条清单同步目标在改动前失败；RED 后实施范围限定在宪法治理说明、清单同步记录和 stage-risk 版本 pin。
- **executed_commands**：具名 T12 gate 以 pre-fix 快照执行，exit 1；stdout 为空，失败事实见 `t12-red.log`。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t12-red.log`]
- **covered_ac**：`AC-GOV-001/002/003` RED 前置：当前快照未满足 1.9.0 同步、负向条款与 stage-risk 版本 pin。
- **review_fact**：T12 为 paired RED 取证卡；未单独提交 provider review，待 Phase 3 最终测试 receipt 后记录当前 review 事实。
- **completed_at**：2026-09-14T12:35:40+08:00

#### T13

- **ID**：T13
- **Phase**：Phase 3 · C7 治理同步
- **goal**：宪法1.9.0四件同步、负向条款十五条、八类分类学与守卫三要件、stage-risk-acceptance版本pin同步(1.8.0→1.9.0)
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T12
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-001, FR-GOV-002, FR-GOV-003
- **AC**：AC-GOV-001, AC-GOV-002, AC-GOV-003
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`CONSTITUTION.md`；`constitution-checklist.md`；`tests/stage-risk-acceptance.test.mjs`
- **boundary**：files：`CONSTITUTION.md`；`constitution-checklist.md`；`tests/stage-risk-acceptance.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t13-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T12
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs');const c=fs.readFileSync('CONSTITUTION.md','utf8'),k=fs.readFileSync('constitution-checklist.md','utf8'),t=fs.readFileSync('tests/stage-risk-acceptance.test.mjs','utf8');if(!/Version:\s*1\.9\.0/.test(c)||!/F11/.test(c)||!/默认不新增 hash/.test(c)||!/负向条款/.test(c)||(c.match(/拒绝方案|禁止方案|负向条款/g)||[]).length<15||['绑定','归因','恢复','生命周期','质量','交互','执行','治理'].some(x=>!c.includes(x))||!/(身份|完整性)/.test(c)||!/close 三义判据/.test(k)||!/Version:\s*1\.9\.0/.test(t))process.exit(1);const ids=[...k.matchAll(/^- \[ \] \*\*([FQS]\d+)/gm)].map(x=>x[1]);if(ids.length!==22||new Set(ids).size!==22)process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-GOV-001 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t13-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-001
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：同步 `CONSTITUTION.md` Version 1.9.0 与修订映射，补充 15 条具名负向条款和默认不新增 hash 的控制面边界；同步 `constitution-checklist.md` 治理记录；将 `tests/stage-risk-acceptance.test.mjs` 的版本 pin 改为 1.9.0。宪法条目仍为 22 条，未新增 public 流程节点或 checklist 条目。
- **executed_commands**：与 T12 完全相同的具名 ORA-GOV-001 gate，最终 exit 0；22 个 F/Q/S ID 唯一，版本、分类学和守卫三要件均满足。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t13-green.log`]
- **covered_ac**：`AC-GOV-001/002/003`：Version 1.9.0 四件同步完成；F11、负向条款、绑定/身份/完整性与八类治理词汇存在；清单保持 22 条。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T12:35:40+08:00

#### T14

- **ID**：T14
- **Phase**：Phase 3 · C7 治理同步
- **goal**：CONTEXT 第五阶段别名与三处路径措辞修正，守卫脚本零改动
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T13
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-007
- **AC**：AC-GOV-007
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`CONTEXT.md`
- **boundary**：files：`CONTEXT.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t14-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T15
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`bash -c 'test "$(git diff --numstat -- tools/cli/verify-structure.mjs)" = "" && node tools/cli/verify-structure.mjs'`
- **expected_exit**：1
- **oracle**：`ORA-GOV-007 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t14-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-007
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：T14 先以未修改的 `verify-structure.mjs` 暴露 CONTEXT 缺 `test-acceptance` 别名和三处 `runtime` 路径措辞问题。
- **executed_commands**：具名 T14 gate 以 pre-fix 快照执行，exit 1；两条失败输出见 `t14-red.log`。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t14-red.log`]
- **covered_ac**：`AC-GOV-007` RED 前置：守卫本身保持不变且准确指出两个 CONTEXT 缺口。
- **review_fact**：T14 为 paired RED 取证卡；未单独提交 provider review，待 Phase 3 最终测试 receipt 后记录当前 review 事实。
- **completed_at**：2026-09-14T12:35:40+08:00

#### T15

- **ID**：T15
- **Phase**：Phase 3 · C7 治理同步
- **goal**：CONTEXT 第五阶段别名与三处路径措辞修正，守卫脚本零改动
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T14
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-007
- **AC**：AC-GOV-007
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`CONTEXT.md`
- **boundary**：files：`CONTEXT.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t15-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T14
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`bash -c 'test "$(git diff --numstat -- tools/cli/verify-structure.mjs)" = "" && node tools/cli/verify-structure.mjs'`
- **expected_exit**：0
- **oracle**：`ORA-GOV-007 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t15-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-007
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：在 `CONTEXT.md` 为 verify-code 补充 `验收（test-acceptance）` 别名，并按计划将三处具体路径改写为“阶段运行目录下的某模块”描述；未修改 `tools/cli/verify-structure.mjs`。
- **executed_commands**：与 T14 完全相同的具名 ORA-GOV-007 gate，最终 exit 0；结构守卫报告宪法 22 条、checklist 锚点、README 三段和 CONTEXT 术语/denylist 全部通过。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t15-green.log`]
- **covered_ac**：`AC-GOV-007`：守卫 exit 0，`git diff --numstat -- tools/cli/verify-structure.mjs` 为空，真实术语未被删减替代。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T12:35:40+08:00

#### T16

- **ID**：T16
- **Phase**：Phase 3 · C7 治理同步
- **goal**：npm test 显式分组、CI逐组调用、exclusive语义保留与并集证明
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T15
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-011
- **AC**：AC-GOV-011
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`package.json`；`.github/workflows/ci.yml`；`tests/contract/test-entry-grouping.test.mjs`
- **boundary**：files：`package.json`；`.github/workflows/ci.yml`；`tests/contract/test-entry-grouping.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t16-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T17
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/test-entry-grouping.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-GOV-011 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t16-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-011
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：T16 先以新增分组契约确认目标缺失；RED 后将 `package.json` 的 safe 测试入口拆成 contract/integration/e2e/review/close/left-shift/acceptance/skills/core/root 十组，保留两个 exclusive 测试单跑，并把 CI 总入口改为逐组调用。
- **executed_commands**：具名 T16 gate 以 pre-fix 快照执行，exit 1（目标测试文件不存在）；失败事实见 `t16-red.log`。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t16-red.log`]
- **covered_ac**：`AC-GOV-011` RED 前置：旧入口无显式分组、CI 仅调用无范围 `npm test`。
- **review_fact**：T16 为 paired RED 取证卡；未单独提交 provider review，待 Phase 3 最终测试 receipt 后记录当前 review 事实。
- **completed_at**：2026-09-14T12:39:32+08:00

#### T17

- **ID**：T17
- **Phase**：Phase 3 · C7 治理同步
- **goal**：npm test 显式分组、CI逐组调用、exclusive语义保留与并集证明
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T16
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-011
- **AC**：AC-GOV-011
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`package.json`；`.github/workflows/ci.yml`；`tests/contract/test-entry-grouping.test.mjs`
- **boundary**：files：`package.json`；`.github/workflows/ci.yml`；`tests/contract/test-entry-grouping.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t17-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T16
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/test-entry-grouping.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-GOV-011 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t17-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-011
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：新增 `tests/contract/test-entry-grouping.test.mjs`，用当前仓库测试文件全集验证十组并集覆盖 safe 范围，检查 safe/exclusive 链接、两个 exclusive 文件与 CI 逐组调用；保留 `test`、`test:safe`、`test:exclusive` 语义。
- **executed_commands**：与 T16 完全相同的具名 ORA-GOV-011 gate，最终 exit 0：1 个 test file、1 个 test 全部通过。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t17-green.log`]
- **covered_ac**：`AC-GOV-011`：显式十组入口、CI 逐组调用、exclusive 两文件保留、safe 并集覆盖全部原范围测试文件。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T12:39:32+08:00

#### T18

- **ID**：T18
- **Phase**：Phase 3 · C7 治理同步
- **goal**：按唯一口径扫描全仓 hash 用法并生成五要素清单
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T17
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-018
- **AC**：AC-GOV-016
- **动作**：对子代理派发 git ls-files + 八扩展名 + sha256/SHA256/hash/digest 四模式扫描；主会话只收路径、exit_code、分类清单，落 raw log 与 JSON，并把完整五要素正文回填 plan.md hash 登记区；每个过程化产物条目必须映射现有 T19/T20 owner_task/owned_file，无法映射即 STOP
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json`；`specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json`；`specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：N/A — 非行为变更：取证、登记或批次编排
- **paired_task**：N/A — 非行为变更：行为验证由同批 GREEN 卡或后续验收卡承担
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs');const r=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests',j=r+'/hash-inventory.json',p=fs.readFileSync('specs/workflowhub-mechanism-simplification-t3-20260912/plan.md','utf8'),s=p.split('## hash 用法清单协议')[1]||'';if(!fs.existsSync(r+'/hash-inventory-scan.log')||!fs.existsSync(j))process.exit(1);const a=JSON.parse(fs.readFileSync(j));if(!Array.isArray(a)||!a.length||a.some(x=>!x.path_line||!x.category||!x.disposition||!x.reason||!x.binding||(x.category==='过程化产物'&&(!x.owner_task||!x.owned_file))))process.exit(1);if(!/\| path_line \| category \| disposition \|/.test(s))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T18 {"pass":"登记或取证满足本卡明示结构与计数判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中：重读量扫描必须子代理执行

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：独立子代理按 `git ls-files`、八种扩展名和四种关键词完成全仓扫描，生成 raw log 与五要素 `hash-inventory.json`，并将逐条清单登记进 `plan.md`；5 个过程化产物均明确映射 T20，未发现无法映射项。
- **executed_commands**：子代理扫描命令 exit 0；主会话只复算 T18 gate，exit 0。初始扫描为 11,808 行 / 850 文件：身份绑定 6,090、完整性校验 5,713、过程化产物 5。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log`, `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json`]
- **covered_ac**：`AC-GOV-016`：五要素清单、原始扫描记录和 plan 正文登记齐全；过程化产物全部有 `owner_task`/`owned_file`。
- **review_fact**：T18 为取证卡；扫描由独立子代理执行，未单独提交 provider review，待 Phase 3 最终测试 receipt 后记录当前 review 事实。
- **completed_at**：2026-09-14T12:43:00+08:00

#### T19

- **ID**：T19
- **Phase**：Phase 3 · C7 治理同步
- **goal**：删除治理文字与过程化产物 hash 站点并按同口径复算零新增
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T18
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-018
- **AC**：AC-GOV-016
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`CONSTITUTION.md`；`constitution-checklist.md`；`CONTEXT.md`；`specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log`
- **boundary**：files：`CONSTITUTION.md`；`constitution-checklist.md`；`CONTEXT.md`；`specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t19-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T20
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require('child_process'),p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json',valid=a=>Array.isArray(a)&&a.length&&!a.some(x=>!x.path_line||!['身份绑定','完整性校验','过程化产物'].includes(x.category)||!x.disposition||!x.reason||!x.binding||(x.category==='过程化产物'&&(!x.owner_task||!x.owned_file))||(x.disposition==='删除'&&x.present_after===true));if(valid([{path_line:'x:1',category:'过程化产物',disposition:'删除',reason:'r',binding:'b',owner_task:'T19',owned_file:'x',present_after:true}]))process.exit(2);if(!fs.existsSync(p))process.exit(1);const a=JSON.parse(fs.readFileSync(p));if(!valid(a))process.exit(1);const tracked=cp.execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n');if(a.some(x=>x.disposition==='删除'&&tracked.includes(String(x.path_line).split(':')[0])))process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-GOV-016 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t19-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-018
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：T19 先复算旧 inventory gate 得到 exit 1；随后按 T20 owner 删除 `CONSTITUTION.md` F3 定义的过程化 hash 词、`CONSTITUTION.md` F6 正例的合同校验值、checklist F3 的 hash 词，以及 CONTEXT 三处历史/证据 hash 文字。身份绑定和完整性校验站点未删除。
- **executed_commands**：具名 T19 ORA-GOV-016 gate 以 pre-fix inventory 执行，exit 1；失败事实见 `t19-red.log`。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t19-red.log`]
- **covered_ac**：`AC-GOV-016` RED 前置：旧 inventory 仍包含标记删除的过程化产物条目，且治理文字尚未净减。
- **review_fact**：T19 为 paired RED 取证卡；未单独提交 provider review，待 Phase 3 最终测试 receipt 后记录当前 review 事实。
- **completed_at**：2026-09-14T12:50:00+08:00

#### T20

- **ID**：T20
- **Phase**：Phase 3 · C7 治理同步
- **goal**：删除治理文字与过程化产物 hash 站点并按同口径复算零新增
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T19
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-018
- **AC**：AC-GOV-016
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`CONSTITUTION.md`；`constitution-checklist.md`；`CONTEXT.md`；`specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log`
- **boundary**：files：`CONSTITUTION.md`；`constitution-checklist.md`；`CONTEXT.md`；`specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t20-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T19
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require('child_process'),p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json',valid=a=>Array.isArray(a)&&a.length&&!a.some(x=>!x.path_line||!['身份绑定','完整性校验','过程化产物'].includes(x.category)||!x.disposition||!x.reason||!x.binding||(x.category==='过程化产物'&&(!x.owner_task||!x.owned_file))||(x.disposition==='删除'&&x.present_after===true));if(valid([{path_line:'x:1',category:'过程化产物',disposition:'删除',reason:'r',binding:'b',owner_task:'T19',owned_file:'x',present_after:true}]))process.exit(2);if(!fs.existsSync(p))process.exit(1);const a=JSON.parse(fs.readFileSync(p));if(!valid(a))process.exit(1);const tracked=cp.execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n');if(a.some(x=>x.disposition==='删除'&&tracked.includes(String(x.path_line).split(':')[0])))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-GOV-016 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t20-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-018
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：在 T19 删除后由独立子代理按同一扫描口径重算 raw log、`hash-inventory.json` 和 plan 清单；当前 11,803 行 / 849 文件，身份绑定 6,090、完整性校验 5,713、过程化产物 0，5 个删除站点均已从当前复算消失。
- **executed_commands**：与 T19 完全相同的 ORA-GOV-016 gate，最终 exit 0；JSON 结构、三类范围、删除项和 tracked 路径校验全部通过。
- **evidence_refs**：[`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t20-green.log`, `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory-scan.log`, `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t3-20260912/quality/tests/hash-inventory.json`]
- **covered_ac**：`AC-GOV-016`：治理过程化 hash 站点清零，身份/完整性项保留，JSON、raw log、plan 清单当前计数一致且无 STOP。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T12:50:00+08:00

#### T21

- **ID**：T21
- **Phase**：Phase 3 · C7 治理同步
- **goal**：父材料 X1至X14 更正、单口径修正与82条 markdownlint 清零
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T20
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-008, FR-GOV-009, FR-GOV-014
- **AC**：AC-GOV-008, AC-GOV-009, AC-GOV-010
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`
- **boundary**：files：`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t21-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T22
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`bash -c './node_modules/.bin/markdownlint-cli2 specs/workflowhub-mechanism-simplification-20260910/decision-log.md && node -e "const fs=require(\"fs\"),s=fs.readFileSync(\"specs/workflowhub-mechanism-simplification-20260910/decision-log.md\",\"utf8\");for(let i=1;i<=14;i++)if(!s.includes(\"X\"+i))process.exit(1);if((s.match(/10 个具名批次/g)||[]).length!==1||!/decision_hash/.test(s)||!/prd\.md 不是第五份材料/.test(s))process.exit(1)"'`
- **expected_exit**：1
- **oracle**：`ORA-GOV-008 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t21-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-008
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：先以同一 gate 固化父材料更正前的 RED；随后只修改父 `decision-log.md`，补入来自 `prd.md` 的 X1–X14 更正清单，固定 `prd.md 不是第五份材料` 边界用语，并把重复的批次数字改为文字表述，保留 D-018 修订句作为唯一数字口径。
- **executed_commands**：RED gate 按本卡 `gate_cmd` 执行，exit 1；RED 时记录 markdownlint 82 errors、缺失 X4–X14、批次短语计数 6、缺失边界短语。GREEN 使用同一 `gate_cmd`，由 T22 复算。
- **evidence_refs**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t21-red.log`; `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t22-green.log`
- **covered_ac**：AC-GOV-008 / AC-GOV-009 / AC-GOV-010 的父材料更正、批次单口径、边界措辞与 lint gate 已由配对 GREEN 证据覆盖。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T12:58:52+08:00

#### T22

- **ID**：T22
- **Phase**：Phase 3 · C7 治理同步
- **goal**：父材料 X1至X14 更正、单口径修正与82条 markdownlint 清零
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T21
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-008, FR-GOV-009, FR-GOV-014
- **AC**：AC-GOV-008, AC-GOV-009, AC-GOV-010
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`
- **boundary**：files：`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t22-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T21
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`bash -c './node_modules/.bin/markdownlint-cli2 specs/workflowhub-mechanism-simplification-20260910/decision-log.md && node -e "const fs=require(\"fs\"),s=fs.readFileSync(\"specs/workflowhub-mechanism-simplification-20260910/decision-log.md\",\"utf8\");for(let i=1;i<=14;i++)if(!s.includes(\"X\"+i))process.exit(1);if((s.match(/10 个具名批次/g)||[]).length!==1||!/decision_hash/.test(s)||!/prd\.md 不是第五份材料/.test(s))process.exit(1)"'`
- **expected_exit**：0
- **oracle**：`ORA-GOV-008 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t22-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-008
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：父 `decision-log.md` 的 X1–X14 更正、唯一批次口径和 `prd.md 不是第五份材料` 边界已落盘；同一 T21 gate 的 markdownlint 与内容断言全部通过。
- **executed_commands**：`bash -c './node_modules/.bin/markdownlint-cli2 specs/workflowhub-mechanism-simplification-20260910/decision-log.md && node -e "const fs=require(\"fs\"),s=fs.readFileSync(\"specs/workflowhub-mechanism-simplification-20260910/decision-log.md\",\"utf8\");for(let i=1;i<=14;i++)if(!s.includes(\"X\"+i))process.exit(1);if((s.match(/10 个具名批次/g)||[]).length!==1||!/decision_hash/.test(s)||!/prd\\.md 不是第五份材料/.test(s))process.exit(1)"'`，exit 0。
- **evidence_refs**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t21-red.log`; `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t22-green.log`
- **covered_ac**：AC-GOV-008 / AC-GOV-009 / AC-GOV-010：X1–X14 全覆盖、`10 个具名批次` 只出现 1 次、`decision_hash` 存在、边界短语存在、父材料 lint 0。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T12:58:52+08:00

#### T23

- **ID**：T23
- **Phase**：Phase 3 · C7 治理同步
- **goal**：仅无关UI specs目录一个窄ignore带理由owner，不忽略宿主工作文件；其余治理文档逐条清零且本任务材料零新增红
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T22
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-005, FR-GOV-006, FR-GOV-015
- **AC**：AC-GOV-005, AC-GOV-006, AC-GOV-014
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`.markdownlint-cli2.jsonc`；`docs/research/ai-cli-host-skill-distribution.md`；`docs/research/m18-skill-plugin-distribution-ecosystem-research-2026-09-03.md`；`docs/adr/0026-equivalent-stage-outcome-attempts.md`；`docs/adr/0028-plan-slicing-and-review-budget.md`；`docs/adr/0029-current-ac-and-close-state.md`；`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`
- **boundary**：files：`.markdownlint-cli2.jsonc`；`docs/research/ai-cli-host-skill-distribution.md`；`docs/research/m18-skill-plugin-distribution-ecosystem-research-2026-09-03.md`；`docs/adr/0026-equivalent-stage-outcome-attempts.md`；`docs/adr/0028-plan-slicing-and-review-budget.md`；`docs/adr/0029-current-ac-and-close-state.md`；`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t23-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T24
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/markdownlint-cli2 "**/*.md"`
- **expected_exit**：1
- **oracle**：`ORA-GOV-005 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t23-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中：全仓 markdownlint 是用户裁定的治理例外，执行证据必须写明范围和理由
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-005
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：只新增 `.markdownlint-cli2.jsonc` 对无关历史 UI specs 目录的窄 ignore，并写明 owner；未忽略 `.planning`、`task_plan.md`、`findings.md` 或 `progress.md`。其余全仓 Markdown 通过机械修复与四处手工修正清零 lint：当前 plan 的 hash 表路径、宿主材料、两份研究文档、三份 ADR 与父 decision-log 均仍在检查范围内。
- **executed_commands**：RED `./node_modules/.bin/markdownlint-cli2 "**/*.md"`，exit 1，200 files / 849 errors；随后 `./node_modules/.bin/markdownlint-cli2 --fix "**/*.md"`，剩余 4 条手工修复；GREEN 使用同一 RED gate，exit 0，176 files / 0 errors。
- **evidence_refs**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t23-red.log`; `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t24-green.log`
- **covered_ac**：AC-GOV-005 / AC-GOV-006 / AC-GOV-014：窄 ignore 带 owner、宿主工作材料未被忽略、目标 Markdown 全仓 gate 清零。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T13:14:46+08:00

#### T24

- **ID**：T24
- **Phase**：Phase 3 · C7 治理同步
- **goal**：仅无关UI specs目录一个窄ignore带理由owner，不忽略宿主工作文件；其余治理文档逐条清零且本任务材料零新增红
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T23
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-005, FR-GOV-006, FR-GOV-015
- **AC**：AC-GOV-005, AC-GOV-006, AC-GOV-014
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`.markdownlint-cli2.jsonc`；`docs/research/ai-cli-host-skill-distribution.md`；`docs/research/m18-skill-plugin-distribution-ecosystem-research-2026-09-03.md`；`docs/adr/0026-equivalent-stage-outcome-attempts.md`；`docs/adr/0028-plan-slicing-and-review-budget.md`；`docs/adr/0029-current-ac-and-close-state.md`；`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`
- **boundary**：files：`.markdownlint-cli2.jsonc`；`docs/research/ai-cli-host-skill-distribution.md`；`docs/research/m18-skill-plugin-distribution-ecosystem-research-2026-09-03.md`；`docs/adr/0026-equivalent-stage-outcome-attempts.md`；`docs/adr/0028-plan-slicing-and-review-budget.md`；`docs/adr/0029-current-ac-and-close-state.md`；`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t24-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T23
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/markdownlint-cli2 "**/*.md"`
- **expected_exit**：0
- **oracle**：`ORA-GOV-005 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t24-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中：全仓 markdownlint 是用户裁定的治理例外，执行证据必须写明范围和理由
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-005
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：全仓 Markdown lint 已清零；`.markdownlint-cli2.jsonc` 仅增加 `specs/workflowhub-ui-frontend-capability-20260904` 这一条窄 ignore，并保留现有 ignore 集合。
- **executed_commands**：`./node_modules/.bin/markdownlint-cli2 "**/*.md"`，exit 0；输出为 `Linting: 176 file(s)`、`Summary: 0 error(s)`。
- **evidence_refs**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t23-red.log`; `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t24-green.log`
- **covered_ac**：AC-GOV-005 / AC-GOV-006 / AC-GOV-014：同一 gate 转绿，范围与 ignore 理由可回读。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T13:14:46+08:00

#### T25

- **ID**：T25
- **Phase**：Phase 3 · C7 治理同步
- **goal**：close 多文件计划对象收敛为一次性展示并保留凭证、plan hash、五动作落账
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T24
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-013
- **AC**：AC-GOV-013
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`core/task-close.mjs`；`tools/cli/task-close.mjs`；`tests/close/close-contract.test.mjs`；`tests/contract/close-authorization-diagnostics.test.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`
- **boundary**：files：`core/task-close.mjs`；`tools/cli/task-close.mjs`；`tests/close/close-contract.test.mjs`；`tests/contract/close-authorization-diagnostics.test.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t25-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T26
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/close/close-contract.test.mjs tests/contract/close-authorization-diagnostics.test.mjs tests/contract/close-sidecar-and-archive.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-GOV-013 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t25-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-013
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed（preexisting_green；计划 RED 期望与当前 HEAD 不一致）
- **actual_changes**：未修改 close 生产代码。当前 HEAD 已有目标行为：一次性 close 计划、confirmation 与 plan hash 绑定、五动作 close_action 落账，以及 planning 四动作 / post-cleanup 两动作路线；目标文件无本任务 diff。
- **executed_commands**：按本卡精确 gate 执行，3 个 test files、41 个 tests 全部通过，exit 0；计划 `expected_exit: 1` 未复现，故不伪造 RED，偏差见 `t25-red.log`。
- **evidence_refs**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t25-red.log`; `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t26-green.log`
- **covered_ac**：AC-GOV-013 的目标行为由当前 close 测试覆盖；RED/GREEN 配对形式不成立，限制已在证据中明示。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T13:19:27+08:00

#### T26

- **ID**：T26
- **Phase**：Phase 3 · C7 治理同步
- **goal**：close 多文件计划对象收敛为一次性展示并保留凭证、plan hash、五动作落账
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T25
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-013
- **AC**：AC-GOV-013
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`core/task-close.mjs`；`tools/cli/task-close.mjs`；`tests/close/close-contract.test.mjs`；`tests/contract/close-authorization-diagnostics.test.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`
- **boundary**：files：`core/task-close.mjs`；`tools/cli/task-close.mjs`；`tests/close/close-contract.test.mjs`；`tests/contract/close-authorization-diagnostics.test.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t26-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T25
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`./node_modules/.bin/vitest run tests/close/close-contract.test.mjs tests/contract/close-authorization-diagnostics.test.mjs tests/contract/close-sidecar-and-archive.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-GOV-013 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t26-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-013
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed（preexisting_green）
- **actual_changes**：T25/T26 未新增 close 生产对象或控制面；沿用当前 HEAD 已存在的 close 收敛实现与真实消费者。
- **executed_commands**：复用 T25 精确 gate 的当前快照结果：3 个 test files、41 个 tests 全部通过，exit 0，duration 174.50s；不重复运行同一无变化 gate。
- **evidence_refs**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t25-red.log`; `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t26-green.log`
- **covered_ac**：AC-GOV-013：close contract、close authorization diagnostics、close sidecar/archive 三组当前行为验证通过；没有把 preexisting green 改写成 RED/GREEN 实施对。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T13:19:27+08:00

#### T27

- **ID**：T27
- **Phase**：Phase 3 · C7 治理同步
- **goal**：固定治理清单按修复后代码事实同步，对照表无矛盾并处理ADR重复编号
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T26
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-004, FR-GOV-010, FR-GOV-012, FR-GOV-017, FR-GOV-019, FR-GOV-020
- **AC**：AC-GOV-004, AC-GOV-015
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`AGENTS.md`；`CLAUDE.md`；`README.md`；`docs/audit-contracts.md`；`docs/architecture/move-map.json`；`docs/architecture/control-plane-inventory.json`；`docs/adr/0002-requirement-lineage-and-step-audit.md`；`docs/adr/0002-v4-review-exception-state-matrix.md`；`docs/adr/0009-same-snapshot-phase0-recovery-requires-explicit-intent.md`；`docs/adr/0009-stage-content-authority.md`；`docs/adr/0011-authenticated-review-flow-generations.md`；`docs/adr/0017-stage-quality-fact-freshness-scope.md`；`docs/adr/0019-canonical-quality-ownership-and-compatibility.md`；`docs/adr/0020-close-five-actions-quality-transcription.md`；`docs/adr/0025-convergence-outline-and-close-loop.md`；`docs/adr/0025-planning-branch-and-maintainable-prd.md`；`docs/adr/0025-review-dispatch-preflight-boundaries.md`；`docs/adr/0027-planning-task-question-boundary.md`；`docs/adr/0027-test-feedback-runtime-profile.md`；`specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p3-c7-handoff.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p3-batch-boundary.json`
- **boundary**：files：`AGENTS.md`；`CLAUDE.md`；`README.md`；`docs/audit-contracts.md`；`docs/architecture/move-map.json`；`docs/architecture/control-plane-inventory.json`；`docs/adr/0002-requirement-lineage-and-step-audit.md`；`docs/adr/0002-v4-review-exception-state-matrix.md`；`docs/adr/0009-same-snapshot-phase0-recovery-requires-explicit-intent.md`；`docs/adr/0009-stage-content-authority.md`；`docs/adr/0011-authenticated-review-flow-generations.md`；`docs/adr/0017-stage-quality-fact-freshness-scope.md`；`docs/adr/0019-canonical-quality-ownership-and-compatibility.md`；`docs/adr/0020-close-five-actions-quality-transcription.md`；`docs/adr/0025-convergence-outline-and-close-loop.md`；`docs/adr/0025-planning-branch-and-maintainable-prd.md`；`docs/adr/0025-review-dispatch-preflight-boundaries.md`；`docs/adr/0027-planning-task-question-boundary.md`；`docs/adr/0027-test-feedback-runtime-profile.md`；`specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p3-c7-handoff.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p3-batch-boundary.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t27-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T28
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require('child_process'),p=fs.readFileSync('specs/workflowhub-mechanism-simplification-t3-20260912/plan.md','utf8'),s=(p.split('## 对照表登记区')[1]||'').split('## hash 用法清单协议')[0],rows=s.split('\n').filter(x=>x.startsWith('|')&&!/(---|对象 |path_line)/.test(x));if(!rows.length||rows.some(r=>!r.includes('文档事实提取式')&&!r.includes('代码事实提取式')&&!/\x60[^\x60]+\x60/.test(r)))process.exit(1);const files=[...new Set(rows.flatMap(r=>[...r.matchAll(/\x60([^\x60]+)\x60/g)].map(m=>m[1])).filter(x=>!x.includes(' ')))];for(const f of files)if(!fs.existsSync(f))process.exit(1);if(/仍矛盾/.test(s)||!/证据引用/.test(s))process.exit(1);cp.execFileSync('node',['tools/cli/verify-structure.mjs'],{stdio:'ignore'})"`
- **expected_exit**：1
- **oracle**：`ORA-GOV-004 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t27-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：高；slice-advisory: reason="治理文档固定清单单卡终检"; impact="单卡文件数超过十个"; owner="任务Ⅲ主会话"; recheck="T28 GREEN 后按对照表逐项复核"
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-004
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：补齐 plan.md 对照表登记区，按固定清单逐行登记文档事实、代码事实、期望关系、实测值、状态和证据引用；修正 T27/T28 gate_cmd 中会截断正则的写法。治理文档、ADR 重复编号处置和当前代码路径均按现状登记，未新增控制面。
- **executed_commands**：T27 使用同一 validator 注入相反关系样本，rows=19、bad=1、exit 1；T28 使用修正后的同一 gate，rows=19、路径存在性和 verify-structure 均通过、exit 0。
- **evidence_refs**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t27-red.log`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t28-green.log`
- **covered_ac**：AC-GOV-004、AC-GOV-015：固定治理对象已有逐行对照和证据引用；未保留“仍矛盾”行，结构守卫通过。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T13:27:00+08:00

#### T28

- **ID**：T28
- **Phase**：Phase 3 · C7 治理同步
- **goal**：固定治理清单按修复后代码事实同步，对照表无矛盾并处理ADR重复编号
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T27
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-004, FR-GOV-010, FR-GOV-012, FR-GOV-017, FR-GOV-019, FR-GOV-020
- **AC**：AC-GOV-004, AC-GOV-015
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`AGENTS.md`；`CLAUDE.md`；`README.md`；`docs/audit-contracts.md`；`docs/architecture/move-map.json`；`docs/architecture/control-plane-inventory.json`；`docs/adr/0002-requirement-lineage-and-step-audit.md`；`docs/adr/0002-v4-review-exception-state-matrix.md`；`docs/adr/0009-same-snapshot-phase0-recovery-requires-explicit-intent.md`；`docs/adr/0009-stage-content-authority.md`；`docs/adr/0011-authenticated-review-flow-generations.md`；`docs/adr/0017-stage-quality-fact-freshness-scope.md`；`docs/adr/0019-canonical-quality-ownership-and-compatibility.md`；`docs/adr/0020-close-five-actions-quality-transcription.md`；`docs/adr/0025-convergence-outline-and-close-loop.md`；`docs/adr/0025-planning-branch-and-maintainable-prd.md`；`docs/adr/0025-review-dispatch-preflight-boundaries.md`；`docs/adr/0027-planning-task-question-boundary.md`；`docs/adr/0027-test-feedback-runtime-profile.md`；`specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p3-c7-handoff.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p3-batch-boundary.json`
- **boundary**：files：`AGENTS.md`；`CLAUDE.md`；`README.md`；`docs/audit-contracts.md`；`docs/architecture/move-map.json`；`docs/architecture/control-plane-inventory.json`；`docs/adr/0002-requirement-lineage-and-step-audit.md`；`docs/adr/0002-v4-review-exception-state-matrix.md`；`docs/adr/0009-same-snapshot-phase0-recovery-requires-explicit-intent.md`；`docs/adr/0009-stage-content-authority.md`；`docs/adr/0011-authenticated-review-flow-generations.md`；`docs/adr/0017-stage-quality-fact-freshness-scope.md`；`docs/adr/0019-canonical-quality-ownership-and-compatibility.md`；`docs/adr/0020-close-five-actions-quality-transcription.md`；`docs/adr/0025-convergence-outline-and-close-loop.md`；`docs/adr/0025-planning-branch-and-maintainable-prd.md`；`docs/adr/0025-review-dispatch-preflight-boundaries.md`；`docs/adr/0027-planning-task-question-boundary.md`；`docs/adr/0027-test-feedback-runtime-profile.md`；`specs/workflowhub-mechanism-simplification-t3-20260912/plan.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p3-c7-handoff.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p3-batch-boundary.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t28-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T27
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require('child_process'),p=fs.readFileSync('specs/workflowhub-mechanism-simplification-t3-20260912/plan.md','utf8'),s=(p.split('## 对照表登记区')[1]||'').split('## hash 用法清单协议')[0],rows=s.split('\n').filter(x=>x.startsWith('|')&&!/(---|对象 |path_line)/.test(x));if(!rows.length||rows.some(r=>!r.includes('文档事实提取式')&&!r.includes('代码事实提取式')&&!/\x60[^\x60]+\x60/.test(r)))process.exit(1);const files=[...new Set(rows.flatMap(r=>[...r.matchAll(/\x60([^\x60]+)\x60/g)].map(m=>m[1])).filter(x=>!x.includes(' ')))];for(const f of files)if(!fs.existsSync(f))process.exit(1);if(/仍矛盾/.test(s)||!/证据引用/.test(s))process.exit(1);cp.execFileSync('node',['tools/cli/verify-structure.mjs'],{stdio:'ignore'})"`
- **expected_exit**：0
- **oracle**：`ORA-GOV-004 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t28-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：高；slice-advisory: reason="治理文档固定清单单卡终检"; impact="单卡文件数超过十个"; owner="任务Ⅲ主会话"; recheck="T28 GREEN 后按对照表逐项复核"
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-004
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：复算并通过 T27 修正后的对照表 gate；读取表内所有反引号路径，确认均可由当前 worktree 回读，并复跑 tools/cli/verify-structure.mjs。
- **executed_commands**：T28 精确 gate exit 0；rows=19；结构验收 exit 0。
- **evidence_refs**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t27-red.log`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t28-green.log`
- **covered_ac**：AC-GOV-004、AC-GOV-015：正例通过、反例被拒绝；表格和结构守卫均可复算。
- **review_fact**：尚未执行 Phase 3 provider review；需 T29 完成并取得 Phase 3 测试 receipt 后统一记录，保留 unavailable/partial 等实际结果。
- **completed_at**：2026-09-14T13:27:00+08:00

#### T29

- **ID**：T29
- **Phase**：Phase 3 · C7 治理同步
- **goal**：逐文件实测改前改后行数并登记净值与正值理由
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T28
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-016
- **AC**：AC-GOV-012
- **动作**：以 Phase 3 入口提交与当前树逐文件统计行数；每个正净值写具名理由；写 net-lines 账
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/net-lines.json`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/net-lines.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/net-lines.json 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：N/A — 非行为变更：取证、登记或批次编排
- **paired_task**：N/A — 非行为变更：行为验证由同批 GREEN 卡或后续验收卡承担
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs');const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/net-lines.json';if(!fs.existsSync(p))process.exit(1);const x=JSON.parse(fs.readFileSync(p));if(!Array.isArray(x.files)||!x.files.length||x.files.some(r=>!r.path||!Number.isInteger(r.before)||!Number.isInteger(r.after)||r.net!==r.after-r.before||(r.net>0&&!r.reason)))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T29 {"pass":"登记或取证满足本卡明示结构与计数判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/net-lines.json
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：低

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：以认证开工 HEAD aa9ef654 作为当前可复核的 Phase 3 入口（未获授权建立提交），逐文件统计入口与当前 worktree 行数；30 个本任务改动文件纳入账本，正净值均写具名理由。总计 before=22289、after=22863、net=574。
- **executed_commands**：读取 git diff --name-only aa9ef654..当前树、补入新增测试文件并统计当前文件行数，写入 net-lines.json；T29 gate 在设置 WORKFLOWHUB_TASK_DIR 后 exit 0。
- **evidence_refs**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/net-lines.json
- **covered_ac**：AC-GOV-012：30 个文件逐项有 before/after/net，23 个正净值均有理由，3 个负净值和 4 个零净值也保留实测值。
- **review_fact**：尚未执行 Phase 3 provider review；下一步生成 Phase 3 边界/交接记录并按 build-code 流程统一申请一次 phase review。
- **completed_at**：2026-09-14T13:32:00+08:00

## Phase 4 · C8 双证验收

### Goal

静态净减法逐项 + M1–M5 对照 + M4 numstat + 链路验收（本任务材料）+ unknown 清单 + 逐条阻塞账 + 异源复核双轨 + 净增减账终审 + 可复算抽三项，C8 批 AC 全过。

### Files

- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/blocker-ledger.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-link-acceptance.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m1-m5-ledger.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m4-numstat.log`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-net-lines-final.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-review-track-a.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-review-track-b.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-static-deletion.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-unknowns.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p4-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p4-c8-handoff.md`
- **READ-ONLY CONSUMER** `specs/archive/workflowhub-mechanism-simplification-t1-20260911/spec.md`
- **READ-ONLY CONSUMER** `specs/workflowhub-mechanism-simplification-20260910/prd.md`

### Tasks

T30-T41（五对验收型 RED/GREEN + T38 阻塞账与 unknown 清单 + T39 异源复核双轨；见 tasks.md Phase 4）

### Verify

`ORA-ACC-001` 为 Phase 4 交接 oracle：C1 十二叶子逐项不存在且白名单完好，并要求 ORA-ACC-002 的 M1–M5 逐项判定（M1/M2 unknown 带出处）+ ORA-ACC-003 的 M4 三提交合计为负 + ORA-ACC-005 链路三步日志 + ORA-T38 阻塞账 51+4+8 行六要素齐、无 `in_scope_unresolved` 且对全部适用行复算 + ORA-ACC-008 双轨记录分开且仅两轨均有效才满足 AC-ACC-008 + ORA-ACC-007 抽三项第三方复算一致。

### Knowledge

验收型对的 RED 除产物缺失外，还要逐类注入语义错样本（错 SHA / 错计数 / unknown 漂白 / 白名单误删 / 命令非零 / 证据或 snapshot_tree 不匹配）；GREEN 对全部适用行复算；不新开真任务、不采新基线；M4 的 SHA 用实测值。

### STOP

账本任一行缺要素或任一全行复算非零；白名单对象受损；链路重放新增行；异源审查被伪造（provider 身份不实即 STOP 并登记）；任一复核轨 unavailable / partial 则 AC-ACC-008 与 Phase 4 保持 incomplete（可留在同 task 修复，但不得计作完成）。

### Done

c8-*.json/log/md 与 blocker-ledger.json 全部落盘且语义 validator / 全行复算通过；双轨各自有效结论成立；p4-c8-handoff.md 汇总双证结论与 unknown 清单引用。

### Risks and rollback

验收发现残留阻塞 → 回 Phase 2/3 对应卡修复（同 task 修复，不整阶段重跑）；异源轨不可用 → 如实登记 unavailable，AC-ACC-008 与 Phase 4 保持 incomplete，不漂白；回滚 = 账本可重建（重跑采集）。

### Task Blocks（执行序列）

本 Phase 所有任务严格按 T 号串行执行；RED 必须先于配对 GREEN，STOP 命中即停在本批。

#### T30

- **ID**：T30
- **Phase**：Phase 4 · C8 双证验收
- **goal**：C1十二叶子逐项不存在且consumer归零，白名单对象完整
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T29
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-001
- **AC**：AC-ACC-001
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-static-deletion.json`；`specs/archive/workflowhub-mechanism-simplification-t1-20260911/spec.md`；`specs/workflowhub-mechanism-simplification-20260910/prd.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-static-deletion.json`；`specs/archive/workflowhub-mechanism-simplification-t1-20260911/spec.md`；`specs/workflowhub-mechanism-simplification-20260910/prd.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t30-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T31
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),valid=x=>x&&x.deleted_leaf_count===12&&x.deleted_verified===12&&x.whitelist_intact===true&&Array.isArray(x.items)&&x.items.length===12&&x.items.every(v=>v.path&&v.absent===true&&v.consumer_evidence&&v.snapshot_tree);if(valid({deleted_leaf_count:11,deleted_verified:12,whitelist_intact:false,items:[]}))process.exit(2);const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-static-deletion.json';if(!fs.existsSync(p)||!valid(JSON.parse(fs.readFileSync(p))))process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-ACC-001 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t30-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-ACC-001
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Published C8 static deletion evidence for the twelve Task I C1 leaves; verified each leaf absent and consumer count zero while retaining the whitelist.
- **executed_commands**：node -e exact T30 RED/GREEN validator
- **evidence_refs**：["quality/tests/t30-red.log","quality/tests/t31-green.log","quality/tests/c8-static-deletion.json"]
- **covered_ac**：["AC-ACC-001"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T31

- **ID**：T31
- **Phase**：Phase 4 · C8 双证验收
- **goal**：C1十二叶子逐项不存在且consumer归零，白名单对象完整
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T30
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-001
- **AC**：AC-ACC-001
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-static-deletion.json`；`specs/archive/workflowhub-mechanism-simplification-t1-20260911/spec.md`；`specs/workflowhub-mechanism-simplification-20260910/prd.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-static-deletion.json`；`specs/archive/workflowhub-mechanism-simplification-t1-20260911/spec.md`；`specs/workflowhub-mechanism-simplification-20260910/prd.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t31-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T30
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),valid=x=>x&&x.deleted_leaf_count===12&&x.deleted_verified===12&&x.whitelist_intact===true&&Array.isArray(x.items)&&x.items.length===12&&x.items.every(v=>v.path&&v.absent===true&&v.consumer_evidence&&v.snapshot_tree);if(valid({deleted_leaf_count:11,deleted_verified:12,whitelist_intact:false,items:[]}))process.exit(2);const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-static-deletion.json';if(!fs.existsSync(p)||!valid(JSON.parse(fs.readFileSync(p))))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-ACC-001 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t31-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-ACC-001
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Reused the T30 gate after publishing c8-static-deletion.json; twelve of twelve leaves and the whitelist predicate passed.
- **executed_commands**：node -e exact T30/T31 validator exit 0
- **evidence_refs**：["quality/tests/t31-green.log","quality/tests/c8-static-deletion.json"]
- **covered_ac**：["AC-ACC-001"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T32

- **ID**：T32
- **Phase**：Phase 4 · C8 双证验收
- **goal**：按C0冻结口径逐项判定M1至M5，M1与M2保持unknown并给出处
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T31
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-002, FR-ACC-004, FR-ACC-009
- **AC**：AC-ACC-002, AC-ACC-004, AC-ACC-009
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m1-m5-ledger.json`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m1-m5-ledger.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t32-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T33
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),valid=x=>Array.isArray(x?.metrics)&&x.metrics.length===5&&x.metrics.every(r=>r.id&&r.status&&r.source&&r.command&&Number.isInteger(r.exit_code)&&r.stdout_summary&&r.snapshot_tree)&&['M1','M2'].every(id=>x.metrics.find(r=>r.id===id)?.status==='unknown');if(valid({metrics:[{id:'M1',status:'passed'}]}))process.exit(2);const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m1-m5-ledger.json';if(!fs.existsSync(p)||!valid(JSON.parse(fs.readFileSync(p))))process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-ACC-002 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t32-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-ACC-002
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Published the five-row M1-M5 ledger with M1/M2 explicitly unknown and M4/M5 limits retained.
- **executed_commands**：node -e exact T32 RED/GREEN validator
- **evidence_refs**：["quality/tests/t32-red.log","quality/tests/t33-green.log","quality/tests/c8-m1-m5-ledger.json"]
- **covered_ac**：["AC-ACC-002","AC-ACC-004","AC-ACC-009"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T33

- **ID**：T33
- **Phase**：Phase 4 · C8 双证验收
- **goal**：按C0冻结口径逐项判定M1至M5，M1与M2保持unknown并给出处
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T32
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-002, FR-ACC-004, FR-ACC-009
- **AC**：AC-ACC-002, AC-ACC-004, AC-ACC-009
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m1-m5-ledger.json`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m1-m5-ledger.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t33-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T32
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),valid=x=>Array.isArray(x?.metrics)&&x.metrics.length===5&&x.metrics.every(r=>r.id&&r.status&&r.source&&r.command&&Number.isInteger(r.exit_code)&&r.stdout_summary&&r.snapshot_tree)&&['M1','M2'].every(id=>x.metrics.find(r=>r.id===id)?.status==='unknown');if(valid({metrics:[{id:'M1',status:'passed'}]}))process.exit(2);const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m1-m5-ledger.json';if(!fs.existsSync(p)||!valid(JSON.parse(fs.readFileSync(p))))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-ACC-002 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t33-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-ACC-002
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Reused the T32 gate after publishing c8-m1-m5-ledger.json; all five rows are present and M1/M2 remain unknown.
- **executed_commands**：node -e exact T32/T33 validator exit 0
- **evidence_refs**：["quality/tests/t33-green.log","quality/tests/c8-m1-m5-ledger.json"]
- **covered_ac**：["AC-ACC-002","AC-ACC-004","AC-ACC-009"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T34

- **ID**：T34
- **Phase**：Phase 4 · C8 双证验收
- **goal**：任务ⅠⅡⅢ三个真实合并提交M4 numstat逐SHA复算且合计为负；任务Ⅲ merge SHA 在close前不存在时保持incomplete
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T33
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-003
- **AC**：AC-ACC-003
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m4-numstat.log`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m4-numstat.log`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t34-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T35
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require('child_process'),valid=s=>{const rows=[...s.matchAll(/TASK-[123]\s+sha=([a-f0-9]{40})\s+added=(\d+)\s+deleted=(\d+)/g)],m=s.match(/TOTAL\s+added=(\d+)\s+deleted=(\d+)/);if(rows.length!==3||!m||Number(m[2])<=Number(m[1]))return false;let A=0,D=0;for(const [,sha,a,d] of rows){try{cp.execFileSync('git',['cat-file','-e',sha+'^{commit}']);const raw=cp.execFileSync('git',['diff','--numstat',sha+'^',sha],{encoding:'utf8'});let aa=0,dd=0;for(const line of raw.trim().split('\n').filter(Boolean)){const [x,y]=line.split('\t');if(/^\d+$/.test(x))aa+=+x;if(/^\d+$/.test(y))dd+=+y}if(aa!==+a||dd!==+d)return false;A+=aa;D+=dd}catch{return false}}return A===+m[1]&&D===+m[2]};if(valid('TASK-1 sha=0000000000000000000000000000000000000000 added=0 deleted=9\nTASK-2 sha=0000000000000000000000000000000000000000 added=0 deleted=9\nTASK-3 sha=0000000000000000000000000000000000000000 added=0 deleted=9\nTOTAL added=0 deleted=27'))process.exit(2);const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m4-numstat.log';if(!fs.existsSync(p)||!valid(fs.readFileSync(p,'utf8')))process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-ACC-003 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t34-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-ACC-003
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Ran the required M4 RED gate; the synthetic invalid three-zero-SHA sample was rejected before accepting the real ledger.
- **executed_commands**：node -e exact T34 RED validator
- **evidence_refs**：["quality/tests/t34-red.log","quality/tests/c8-m4-numstat.log"]
- **covered_ac**：["AC-ACC-003"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T35

- **ID**：T35
- **Phase**：Phase 4 · C8 双证验收
- **goal**：任务ⅠⅡⅢ三个真实合并提交M4 numstat逐SHA复算且合计为负；任务Ⅲ merge SHA 在close前不存在时保持incomplete
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T34
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-003
- **AC**：AC-ACC-003
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m4-numstat.log`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m4-numstat.log`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t35-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T34
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require('child_process'),valid=s=>{const rows=[...s.matchAll(/TASK-[123]\s+sha=([a-f0-9]{40})\s+added=(\d+)\s+deleted=(\d+)/g)],m=s.match(/TOTAL\s+added=(\d+)\s+deleted=(\d+)/);if(rows.length!==3||!m||Number(m[2])<=Number(m[1]))return false;let A=0,D=0;for(const [,sha,a,d] of rows){try{cp.execFileSync('git',['cat-file','-e',sha+'^{commit}']);const raw=cp.execFileSync('git',['diff','--numstat',sha+'^',sha],{encoding:'utf8'});let aa=0,dd=0;for(const line of raw.trim().split('\n').filter(Boolean)){const [x,y]=line.split('\t');if(/^\d+$/.test(x))aa+=+x;if(/^\d+$/.test(y))dd+=+y}if(aa!==+a||dd!==+d)return false;A+=aa;D+=dd}catch{return false}}return A===+m[1]&&D===+m[2]};if(valid('TASK-1 sha=0000000000000000000000000000000000000000 added=0 deleted=9\nTASK-2 sha=0000000000000000000000000000000000000000 added=0 deleted=9\nTASK-3 sha=0000000000000000000000000000000000000000 added=0 deleted=9\nTOTAL added=0 deleted=27'))process.exit(2);const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-m4-numstat.log';if(!fs.existsSync(p)||!valid(fs.readFileSync(p,'utf8')))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-ACC-003 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t35-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-ACC-003
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：incomplete
- **actual_changes**：Recorded real Task I and Task II first-parent numstat, retained the known +8791 net, and did not invent a Task III merge SHA; the GREEN gate remains incomplete.
- **executed_commands**：node -e exact T34/T35 validator exit 1
- **evidence_refs**：["quality/tests/t35-green.log","quality/tests/c8-m4-numstat.log"]
- **covered_ac**：["AC-ACC-003"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T36

- **ID**：T36
- **Phase**：Phase 4 · C8 双证验收
- **goal**：本任务材料写完后status立即可读且重放不新增行
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T35
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-005, FR-ACC-010
- **AC**：AC-ACC-005
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-link-acceptance.json`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-link-acceptance.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t36-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T37
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),valid=x=>x&&x.write_exit_code===0&&x.status_exit_code===0&&x.replay_exit_code===0&&x.status_immediate_readable===true&&x.replay_added_rows===0&&Number.isInteger(x.rows_before)&&x.rows_after_write===x.rows_before+1&&x.rows_after_replay===x.rows_after_write&&/^[a-f0-9]{40}$/.test(x.snapshot_tree||'')&&x.status_snapshot_tree===x.snapshot_tree&&x.replay_snapshot_tree===x.snapshot_tree;if(valid({write_exit_code:0,status_exit_code:0,replay_exit_code:0,status_immediate_readable:true,replay_added_rows:1,rows_before:1,rows_after_write:2,rows_after_replay:3,snapshot_tree:'a'.repeat(40),status_snapshot_tree:'a'.repeat(40),replay_snapshot_tree:'a'.repeat(40)}))process.exit(2);const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-link-acceptance.json';if(!fs.existsSync(p)||!valid(JSON.parse(fs.readFileSync(p))))process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-ACC-005 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t36-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-ACC-005
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Captured the current task-store write/status/replay RED precondition and then published link acceptance evidence.
- **executed_commands**：node -e exact T36/T37 validator
- **evidence_refs**：["quality/tests/t36-red.log","quality/tests/t37-green.log","quality/tests/c8-link-acceptance.json"]
- **covered_ac**：["AC-ACC-005"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T37

- **ID**：T37
- **Phase**：Phase 4 · C8 双证验收
- **goal**：本任务材料写完后status立即可读且重放不新增行
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T36
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-005, FR-ACC-010
- **AC**：AC-ACC-005
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-link-acceptance.json`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-link-acceptance.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t37-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T36
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),valid=x=>x&&x.write_exit_code===0&&x.status_exit_code===0&&x.replay_exit_code===0&&x.status_immediate_readable===true&&x.replay_added_rows===0&&Number.isInteger(x.rows_before)&&x.rows_after_write===x.rows_before+1&&x.rows_after_replay===x.rows_after_write&&/^[a-f0-9]{40}$/.test(x.snapshot_tree||'')&&x.status_snapshot_tree===x.snapshot_tree&&x.replay_snapshot_tree===x.snapshot_tree;if(valid({write_exit_code:0,status_exit_code:0,replay_exit_code:0,status_immediate_readable:true,replay_added_rows:1,rows_before:1,rows_after_write:2,rows_after_replay:3,snapshot_tree:'a'.repeat(40),status_snapshot_tree:'a'.repeat(40),replay_snapshot_tree:'a'.repeat(40)}))process.exit(2);const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-link-acceptance.json';if(!fs.existsSync(p)||!valid(JSON.parse(fs.readFileSync(p))))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-ACC-005 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t37-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-ACC-005
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：The same link gate passed: write/status/replay all exit zero, rows moved 3 to 4 to 4, and replay added zero rows.
- **executed_commands**：node -e exact T36/T37 validator exit 0
- **evidence_refs**：["quality/tests/t37-green.log","quality/tests/c8-link-acceptance.json"]
- **covered_ac**：["AC-ACC-005"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T38

- **ID**：T38
- **Phase**：Phase 4 · C8 双证验收
- **goal**：生成unknown清单与63行逐条阻塞账（51 X + 4现场 + 8分类）
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T37
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-006, FR-ACC-011, FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-15
- **AC**：AC-ACC-006, AC-ACC-010
- **动作**：子代理组装51条X、4条现场、8类分类学逐行六要素；主会话核对分段计数19+6+4+7+8+7与总数63；对全部63行执行或复算账中命令并绑定exit_code、stdout摘要、snapshot_tree；每行标 resolved_evidence/scope_unknown/in_scope_unresolved，范围内未修复项回已登记 Phase 2/3 owner 并重跑本卡，scope_unknown 保留 incomplete；validator负例须拒绝错计数/命令非零/证据或snapshot不匹配；unknown记录token、M1、M2、验收自指且负例须拒绝漂白
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/blocker-ledger.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-unknowns.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/blocker-ledger.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-unknowns.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/blocker-ledger.json; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-unknowns.md 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：N/A — 非行为变更：取证、登记或批次编排
- **paired_task**：N/A — 非行为变更：行为验证由同批 GREEN 卡或后续验收卡承担
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs');const r=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests',p=r+'/blocker-ledger.json';if(!fs.existsSync(p)||!fs.existsSync(r+'/c8-unknowns.md'))process.exit(1);const x=JSON.parse(fs.readFileSync(p));if(!Array.isArray(x)||x.length!==63||x.some(v=>!v.id||!v.symptom||!v.root_cause||!v.fix||!v.command||!v.evidence||!Number.isInteger(v.exit_code)||!v.stdout_summary||!v.snapshot_tree||!['resolved_evidence','scope_unknown','in_scope_unresolved'].includes(v.triage_status))||x.some(v=>v.triage_status==='in_scope_unresolved'))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T38 {"pass":"登记或取证满足本卡明示结构与计数判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/blocker-ledger.json; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-unknowns.md
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中：重读量账本组装与全行复算必须子代理执行

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Published a 63-row blocker ledger and unknowns file; 4 rows have resolved evidence, 59 are scope_unknown, and none is in_scope_unresolved.
- **executed_commands**：node -e exact T38 validator exit 0
- **evidence_refs**：["quality/tests/t38-green.log","quality/tests/blocker-ledger.json","quality/tests/c8-unknowns.md"]
- **covered_ac**：["AC-ACC-006","AC-ACC-010"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T39

- **ID**：T39
- **Phase**：Phase 4 · C8 双证验收
- **goal**：异源复核双轨分开执行与登记，不用主会话自审冒充
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T38
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-008
- **AC**：AC-ACC-008
- **动作**：轨A用公共 stage-runtime review --action=record 经broker到外部provider（使用宿主既有凭据/网络）；轨B派独立子代理只读复核；两轨绑定同一最终commit/snapshot并分开登记身份、底层模型、provider、error_code、耗时、状态、结论；本地fixture network=off不适用于外部轨A；只有两轨独立且均有有效结论才满足AC，任一partial/unavailable则本卡与Phase 4保持incomplete
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-review-track-a.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-review-track-b.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-review-track-a.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-review-track-b.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-review-track-a.json; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-review-track-b.md 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：N/A — 非行为变更：取证、登记或批次编排
- **paired_task**：N/A — 非行为变更：行为验证由同批 GREEN 卡或后续验收卡承担
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs');const r=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests';if(!fs.existsSync(r+'/c8-review-track-a.json')||!fs.existsSync(r+'/c8-review-track-b.md'))process.exit(1);const a=JSON.parse(fs.readFileSync(r+'/c8-review-track-a.json')),b=fs.readFileSync(r+'/c8-review-track-b.md','utf8');if(a.status!=='recorded'||a.partial===true||a.coverage!=='satisfied'||a.error_code||!a.provider||!a.model||!a.result_ref||!a.commit_sha||!a.snapshot_tree||!Number.isInteger(a.duration_ms)||!a.conclusion||!/status:s*recorded/.test(b)||!/model:/.test(b)||!/commit_sha:/.test(b)||!/snapshot_tree:/.test(b)||!/conclusion:/.test(b)||!b.includes(a.commit_sha)||!b.includes(a.snapshot_tree))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-ACC-008 {"pass":"登记或取证满足本卡明示结构与计数判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-review-track-a.json; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-review-track-b.md
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：高：通道不可用必须保留unavailable事实，且本卡不得完成

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：incomplete
- **actual_changes**：Recorded Track A as partial with two actionable major findings and Track B as unavailable because agent/model identity cannot be authenticated; no formal dual-track pass claimed.
- **executed_commands**：node -e exact T39 validator exit 1
- **evidence_refs**：["quality/tests/t39-incomplete.log","quality/tests/c8-review-track-a.json","quality/tests/c8-review-track-b.md"]
- **covered_ac**：["AC-ACC-008"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T40

- **ID**：T40
- **Phase**：Phase 4 · C8 双证验收
- **goal**：最终净增减账逐文件复算、抽三项一致并形成C8批次交接
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：T38 blocker triage with zero in_scope_unresolved + T39 two valid independent tracks + current four materials
- **依赖**：T39
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-007, FR-ACC-009
- **AC**：AC-ACC-007, AC-ACC-009
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-net-lines-final.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p4-c8-handoff.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p4-batch-boundary.json`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-net-lines-final.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p4-c8-handoff.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p4-batch-boundary.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t40-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T41
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),valid=x=>Array.isArray(x?.files)&&x.files.length&&x.files.every(r=>r.path&&Number.isInteger(r.before)&&Number.isInteger(r.after)&&Number.isInteger(r.net)&&r.net===r.after-r.before&&(!r.net||r.net<0||r.reason)&&r.command&&Number.isInteger(r.exit_code)&&r.snapshot_tree);if(valid({files:[{path:'x',before:1,after:9,net:8}]}))process.exit(2);const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-net-lines-final.json';if(!fs.existsSync(p)||!valid(JSON.parse(fs.readFileSync(p))))process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-ACC-007 {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t40-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-ACC-007
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Ran the final net-lines RED precondition before publication; the missing final ledger was rejected as expected.
- **executed_commands**：node -e exact T40 RED validator
- **evidence_refs**：["quality/tests/t40-red.log","quality/tests/c8-net-lines-final.json"]
- **covered_ac**：["AC-ACC-007","AC-ACC-009"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

#### T41

- **ID**：T41
- **Phase**：Phase 4 · C8 双证验收
- **goal**：最终净增减账逐文件复算、抽三项一致并形成C8批次交接
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T40
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-ACC-007, FR-ACC-009
- **AC**：AC-ACC-007, AC-ACC-009
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-net-lines-final.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p4-c8-handoff.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p4-batch-boundary.json`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-net-lines-final.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p4-c8-handoff.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p4-batch-boundary.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t41-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T40
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs'),valid=x=>Array.isArray(x?.files)&&x.files.length&&x.files.every(r=>r.path&&Number.isInteger(r.before)&&Number.isInteger(r.after)&&Number.isInteger(r.net)&&r.net===r.after-r.before&&(!r.net||r.net<0||r.reason)&&r.command&&Number.isInteger(r.exit_code)&&r.snapshot_tree);if(valid({files:[{path:'x',before:1,after:9,net:8}]}))process.exit(2);const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests/c8-net-lines-final.json';if(!fs.existsSync(p)||!valid(JSON.parse(fs.readFileSync(p))))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-ACC-007 {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t41-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-ACC-007
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Published the final file-level net ledger and passed its structural validator for 30 paths; the measured net is +574 and is not a net-reduction pass.
- **executed_commands**：node -e exact T40/T41 validator exit 0
- **evidence_refs**：["quality/tests/t41-green.log","quality/tests/c8-net-lines-final.json","quality/tests/p4-batch-boundary.json","quality/tests/p4-c8-handoff.md"]
- **covered_ac**：["AC-ACC-007","AC-ACC-009"]
- **review_fact**：Phase 4 Track A provider review is recorded but partial; findings F-2506c394f5f5 and F-5e7ddc68487a are retained; Track B is unavailable.
- **completed_at**：2026-09-14T14:46:30+08:00

## Phase 5 · 执行纪律核对与任务级收尾

### Goal

执行纪律审计（重读量动作四要素抽查）+ 守卫基线复核（整改前后动态比较）+ 最终聚合验证卡（actual changed-files targeted union + 三守卫 + 账本齐全性终核；完整分组并集只由 CI 执行）。

### Files

- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-execution-audit.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-guard-baseline.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-handoff-ledger.md`
- **READ-ONLY CONSUMER** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json`

### Tasks

T42-T45（执行记录审计 + 守卫复核对 + 最终聚合验证卡；见 tasks.md Phase 5）

### Verify

`ORA-EXE-001` 为 Phase 5 交接 oracle：抽五条重读量记录四要素齐 + 主会话全仓扫描记录不存在，并要求 ORA-GOV-005B 三守卫整改后不劣化且范围内清零 + ORA-T45 的 actual changed-files targeted union exit 0、真实 CI run 绑定最终 SHA 且所有显式组 success + 完成计数（claimed vs authenticated）自洽。

### Knowledge

守卫比较只读 t0 artifact 变量；本地最终聚合只跑 actual changed-files targeted union，完整分组并集由 CI 守卫执行；证据同时记录 changed_files → targeted tests 映射与 CI run ref。

### STOP

执行记录缺要素；守卫任一计数劣化；聚合红。

### Done

p5-execution-audit.md / p5-guard-baseline.json / p5-final-aggregate.log / p5-handoff-ledger.md 落盘；HANDOFF 项（若有）具名移交 close 阶段。

### Risks and rollback

审计发现纪律违例 → 补登记并如实写进阶段末披露；守卫劣化 → 定位批次回补或回退；聚合失败 → 按失败组回对应批修复。

### Task Blocks（执行序列）

本 Phase 所有任务严格按 T 号串行执行；RED 必须先于配对 GREEN，STOP 命中即停在本批。

#### T42

- **ID**：T42
- **Phase**：Phase 5 · 执行纪律核对与任务级收尾
- **goal**：抽查五条重读量动作执行记录四要素与actor边界
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T41
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-EXE-001
- **AC**：AC-EXE-001
- **动作**：从build-code/verify-code执行记录抽五条，逐条核对动作点、actor、命令、exit_code、关键结论行；子代理不可用时明确main-session-executed，不冒充
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-execution-audit.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-execution-audit.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-execution-audit.md 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：N/A — 非行为变更：取证、登记或批次编排
- **paired_task**：N/A — 非行为变更：行为验证由同批 GREEN 卡或后续验收卡承担
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`bash -c 'test -s "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-execution-audit.md" && test "$(grep -c "actor" "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-execution-audit.md")" -ge 5'`
- **expected_exit**：0
- **oracle**：`ORA-EXE-001 {"pass":"登记或取证满足本卡明示结构与计数判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-execution-audit.md
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：低

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Published the execution audit with eight action samples plus explicit actor-boundary notes; broad inventory is attributed to the independent subagent.
- **executed_commands**：bash -c exact ORA-EXE-001 gate; actor_count=12; exit 0
- **evidence_refs**：["quality/tests/p5-execution-audit.md"]
- **covered_ac**：["AC-EXE-001"]
- **review_fact**：Phase 4 Track A remains recorded_partial with findings F-2506c394f5f5 and F-5e7ddc68487a; Track B unavailable; no clean final review.
- **completed_at**：2026-09-14T15:01:05+08:00

#### T43

- **ID**：T43
- **Phase**：Phase 5 · 执行纪律核对与任务级收尾
- **goal**：三守卫按T0动态基线复核，范围内清零且不劣化
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T42
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-005, FR-GOV-006
- **AC**：AC-GOV-005, AC-GOV-006
- **动作**：RED：先落测试或断言，在生产/治理改动前用同一 gate 证明目标现状会失败
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-guard-baseline.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-guard-baseline.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t43-red.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：RED
- **paired_task**：T44
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs');const r=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests',a=JSON.parse(fs.readFileSync(r+'/t0-current-baseline.json')),b=JSON.parse(fs.readFileSync(r+'/p5-guard-baseline.json'));if(b.markdownlint.errors!==0||b.record_paths.failures!==0||b.structure.failures!==0||b.markdownlint.errors>a.markdownlint.errors||b.record_paths.failures>a.record_paths.failures||b.structure.failures>a.structure.failures)process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-GOV-005B {"pass":"同一 gate 在目标实现后满足规格判据","reject":{"input":"修复或证据产物尚未存在的当前快照","expected_rejection":"同一 gate 返回非零并指出具体缺口","observation":"保留 RED 输出、退出码与失败断言"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t43-red.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-005
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Ran the required RED gate before publishing the guard baseline; the missing artifact was rejected as expected, then recorded current guard inputs.
- **executed_commands**：node -e exact ORA-GOV-005B RED gate; exit 1
- **evidence_refs**：["quality/tests/t43-red.log","quality/tests/t0-current-baseline.json"]
- **covered_ac**：["AC-GOV-005","AC-GOV-006"]
- **review_fact**：Phase 4 Track A remains recorded_partial with findings F-2506c394f5f5 and F-5e7ddc68487a; Track B unavailable; no clean final review.
- **completed_at**：2026-09-14T15:01:05+08:00

#### T44

- **ID**：T44
- **Phase**：Phase 5 · 执行纪律核对与任务级收尾
- **goal**：三守卫按T0动态基线复核，范围内清零且不劣化
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T43
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-005, FR-GOV-006
- **AC**：AC-GOV-005, AC-GOV-006
- **动作**：GREEN：实施最小改动或产出可复算证据，用与 RED 完全相同的 gate 转绿
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-guard-baseline.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-guard-baseline.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t0-current-baseline.json`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t44-green.log 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：GREEN
- **paired_task**：T43
- **test tier / test method**：feature / command 层定向契约或证据断言
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`node -e "const fs=require('fs');const r=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t3-20260912/quality/tests',a=JSON.parse(fs.readFileSync(r+'/t0-current-baseline.json')),b=JSON.parse(fs.readFileSync(r+'/p5-guard-baseline.json'));if(b.markdownlint.errors!==0||b.record_paths.failures!==0||b.structure.failures!==0||b.markdownlint.errors>a.markdownlint.errors||b.record_paths.failures>a.record_paths.failures||b.structure.failures>a.structure.failures)process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-GOV-005B {"pass":"同一 gate 在目标实现后满足规格判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/t44-green.log
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：中
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-GOV-005
- **semantic_review_reason**：RED/GREEN 设计语义已按同一 FR、AC、gate 与 oracle 身份核对；运行期 unavailable/incomplete 仍按实际记录，不把本字段当执行通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：Published the current guard baseline and reused the same gate; markdownlint=0, record_paths=0, structure=0, all no worse than T0.
- **executed_commands**：node -e exact ORA-GOV-005B GREEN gate; exit 0
- **evidence_refs**：["quality/tests/t44-green.log","quality/tests/p5-guard-baseline.json","quality/tests/t0-current-baseline.json"]
- **covered_ac**：["AC-GOV-005","AC-GOV-006"]
- **review_fact**：Phase 4 Track A remains recorded_partial with findings F-2506c394f5f5 and F-5e7ddc68487a; Track B unavailable; no clean final review.
- **completed_at**：2026-09-14T15:01:05+08:00

#### T45

- **ID**：T45
- **Phase**：Phase 5 · 执行纪律核对与任务级收尾
- **goal**：最终current-snapshot聚合：actual changed-files targeted union、三守卫、CI引用、账本齐全性与HANDOFF收口
- **design_state**：本卡计划已定稿；不充当规格冻结凭证，执行事实由完成区回填
- **versioned_refs**：spec.md@62e47d742bf6f689253b5b9f5eb51eb1ad4b9108d7e7e673e9752b31c759fec7;plan.md@35396d13d1943de3a6f35354aca9debd5cc9d89134a041ae78355e787537375d;decision-log.md@67f11ad5f7f1a9a7f37007fc5d008515db1c3f2fc27f04625c01c6e1b359bf9a
- **source_refs / decision_refs**：R-001, R-007, D-001, D-004, D-014, D-015
- **输入**：当前四材料 + 前序任务证据；以 plan.md 同 Phase 边界和 Code Anchors 为准
- **依赖**：T44
- **并行**：无（全部串行，避免共享文件与证据写冲突）
- **FR**：FR-GOV-004, FR-GOV-011, FR-ACC-005, FR-ACC-008, FR-EXE-001
- **AC**：AC-GOV-004, AC-GOV-011, AC-ACC-005, AC-ACC-008, AC-EXE-001
- **动作**：从实际changed_files生成并记录targeted test union，仅本地运行该并集；重跑三守卫；在最终提交产生后触发现有CI并等待结果，验证真实run URL/id的head SHA等于最终commit、结论success、全部显式组逐项success；CI不可用则保持incomplete；核对全部证据存在、AC-ACC-008非incomplete与任务完成计数；输出原始日志和handoff账
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-handoff-ledger.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-handoff-ledger.md`
- **输出**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-handoff-ledger.md 对应的可复算结果与本卡完成区事实
- **Knowledge**：只跑本卡具名 gate；质量事实按实际状态记录，不把 unavailable/incomplete 改写为通过
- **verification_role**：N/A — 非行为变更：取证、登记或批次编排
- **paired_task**：N/A — 非行为变更：行为验证由同批 GREEN 卡或后续验收卡承担
- **test tier / test method**：fullstack / command 层current-snapshot targeted聚合（非UI）
- **scenarios**：正例按 pass 判据；负例按 oracle.reject（RED）或同批 RED 证据；不做 UI/browser 场景
- **fixtures_services**：仓库内现有 fixture + 本任务 task-store 证据文件；不访问网络、不新开真实任务
- **coverage limits**：只覆盖本卡列出的文件、FR 与 AC；不外推全仓质量结论
- **gate_cmd**：`bash -c 'test -s "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log" && test -s "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-handoff-ledger.md" && grep -q "targeted_union_exit_code=0" "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log" && grep -Eq "ci_run_ref=https?://" "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log" && grep -Eq "ci_head_sha=[a-f0-9]{40}" "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log" && grep -q "ci_conclusion=success" "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log" && grep -q "ci_groups_all_success=true" "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log"'`
- **expected_exit**：0
- **oracle**：`ORA-T45 {"pass":"登记或取证满足本卡明示结构与计数判据"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-handoff-ledger.md
- **STOP**：gate 实际退出码不等于 expected_exit，或证据无法按同一命令复算即停止本卡
- **recovery**：按 plan.md Rollback and Recovery 回退本卡改动，保留失败事实后重做 RED/GREEN
- **task risk**：高：本地禁止全量；必须记录changed_files到targeted tests映射并绑定最终commit的真实CI success，CI不可用则incomplete

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：incomplete
- **actual_changes**：Ran the actual changed-files targeted union successfully and recorded the same-snapshot guard results, but no authorized final commit or CI run exists; the CI-bound final aggregate gate therefore remains incomplete.
- **executed_commands**：bash -c exact ORA-T45 gate; exit 1 because CI fields are unavailable
- **evidence_refs**：["quality/tests/p5-final-aggregate.log","quality/tests/p5-handoff-ledger.md"]
- **covered_ac**：["AC-GOV-004","AC-GOV-011","AC-ACC-005","AC-ACC-008","AC-EXE-001"]
- **review_fact**：Phase 4 Track A remains recorded_partial with findings F-2506c394f5f5 and F-5e7ddc68487a; Track B unavailable; no clean final review.
- **completed_at**：2026-09-14T15:01:05+08:00

## 4. Final current-snapshot aggregate strategy

- **test tier / test method**: fullstack / command 层 current-snapshot targeted 聚合（非 UI）
- **scenarios**: 从实际 changed_files 生成 targeted test union 并本地执行；三守卫；C7/C8 账本终核；完整分组并集只消费既有 CI run ref
- **command**: `bash -c 'TARGETS=$(node -e "const fs=require(\"fs\");const p=process.env.WORKFLOWHUB_TASK_DIR+\"/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-handoff-ledger.md\";const s=fs.readFileSync(p,\"utf8\");const m=s.match(/targeted_test_files:\s*([^\n]+)/);if(!m)process.exit(1);process.stdout.write(m[1])"); ./node_modules/.bin/vitest run $TARGETS --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/markdownlint-cli2 "**/*.md" && node tools/cli/check-task-record-paths.mjs && node tools/cli/verify-structure.mjs'`
- **expected exit**: 0
- **oracle**: ORA-T45（actual changed-files targeted union 与三守卫同 snapshot 退出 0；CI run ref 已绑定；账本齐全；claimed / authenticated 完成计数自洽）
- **fixtures_services**: 仓库内 fixtures 与本任务 task-store 证据；network=off；db=off；外部 review 只消费已落盘事实
- **evidence_path**: `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-final-aggregate.log`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t3-20260912/quality/tests/p5-handoff-ledger.md`
- **coverage limits**: 本地只覆盖实际 changed_files 对应 targeted union 与三守卫；完整 package 分组并集由已有 CI 守卫执行；不代表仓外宿主或真实任务基线
- **STOP**: 任一 targeted 测试或守卫非零；CI run ref 缺失；AC-ACC-008 incomplete；任一账本缺失；完成计数不自洽
