# tasks · workflowhub-mechanism-simplification-t2-20260911

- **Template version**：plan-task.v3

## Phase 1 · C9 执行面

### Goal

档位改名到底 + test:profile 入口 + 7 文件分档命令表 + preflight + receipt 复用取证 + 复用评估，C9 批 AC 全过。

### Files

- **MODIFY** `core/__tests__/run-checks.test.mjs`
- **MODIFY** `docs/adr/0027-test-feedback-runtime-profile.md`
- **MODIFY** `package.json`
- **MODIFY** `runtime/evidence/canonical-receipt-writer.mjs`
- **MODIFY** `runtime/stage/stage-content-contracts.mjs`
- **MODIFY** `tests/contract/runtime-profile-consumer-readback.test.mjs`
- **MODIFY** `tests/contract/stage-runtime-preflight.test.mjs`
- **MODIFY** `tests/contract/test-runtime-profile.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/decision-convergence-depth.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/requirement-convergence-regression.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/stage-completion.test.mjs`
- **READ-ONLY CONSUMER** `tests/e2e/vnext-five-stage-current.test.mjs`
- **READ-ONLY CONSUMER** `tests/integration/vnext-delivery-close.test.mjs`
- **READ-ONLY CONSUMER** `tests/integration/vnext-official-stage-run.test.mjs`
- **MODIFY** `tools/cli/measure-test-runtime-profile.mjs`
- **MODIFY** `tools/cli/run-checks.mjs`
- **MODIFY** `tools/cli/stage-runtime.mjs`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-c9-handoff.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-preflight-check.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`
- **NEW** `tests/contract/test-capture-reuse.test.mjs`

### Tasks

T0-T14（执行序：T0 前置核对、T1→T2 改名、T3 评估、T4→T13 实现对、T14 合入；见 tasks.md Phase 1）

### Verify

C9 批 gate 组全绿 + AC-C9-001~011 oracle 取证 + 守卫基线不劣化 + 旧档位名零残留（含 ADR）。

### Knowledge

同文件串行：C9 先于 C6 改 stage-runtime（本批只动 runPreflight 段与常量，不碰 C6 面）；Task I merge `9f9d0c44` ancestry 已满足；T0 只复核。

### STOP

`git merge-base --is-ancestor 9f9d0c44 HEAD` 失败；或批内任一 gate 红；或守卫劣化；或 test:profile 入口改了现有脚本语义。

### Done

npm run test:profile 真实 phase 调用产出 evidence（ceiling_ms=300,000）；aggregate 本地调用失败（CI-only）；7 文件分档表落 plan 执行证据；preflight 四类负例 ≤5 秒；receipt 复用与超时落盘取证；旧名零残留。

### Risks and rollback

改名漏点（权限/错误文案/ADR）→ 旧名零残留 grep 拦截；preflight 变门禁 → AC-C9-009 三条件反例拦截；回滚 = revert 本批。

### Task Blocks（执行序列）

本 Phase 任务块（RED/GREEN 成对，T 号顺序执行）：

#### T0

- **ID**：T0
- **Phase**：Phase 1 · C9 执行面
- **goal**：当前输入前置核对与 T0 重测（Task I ancestry/archive + worktree + frozen K2 + 守卫基线）
- **design_state**：设计已冻结（post-merge reconciliation）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：task store 执行文件 + 本仓四材料 + implementation input `35a6fb6f`
- **依赖**：无（本 Phase 第 0 步，最先执行）
- **并行**：无
- **FR**：N/A
- **AC**：AC-FLW-001, AC-TLD-001, AC-TLD-002, AC-TLD-003
- **动作**：验证 `git merge-base --is-ancestor 9f9d0c44 HEAD`；验证 Task I 四材料位于 archive 且 live predecessor path 不存在；验证 `runtime/task/task-store.mjs` frozen `record_kind:stage|close_action`、五个 `review_origin`、`review_result_ref`；认证 worktree/branch；在 `35a6fb6f` 当前输入运行三守卫并把 raw output、exit code、解析计数写入 `t0-current-baseline.json`，后续 gate 只读其变量；记录 Task I quality=`incomplete/unavailable/not_run`
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-preflight-check.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`
- **boundary**：files：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-preflight-check.md；$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json
- **输出**：ancestry/archive/K2/质量真相核对；当前守卫基线 artifact
- **Knowledge**：Task I 前置已满足；旧 612/35、10、2 仅历史，不作当前 gate
- **verification_role**：N/A — 非行为变更：流程前置与重测
- **paired_task**：N/A — 当前 artifact 由 T69/T70 只读比较
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require("child_process");const root=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911',input='35a6fb6f0bc0987644cbf903d915eff063879581';if(cp.spawnSync('git',['merge-base','--is-ancestor','9f9d0c44','HEAD']).status!==0||cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()!==input||!fs.existsSync('specs/archive/workflowhub-mechanism-simplification-t1-20260911')||fs.existsSync('specs/workflowhub-mechanism-simplification-t1-20260911'))process.exit(1);fs.mkdirSync(root+'/quality/tests',{recursive:true});const run=(cmd,args,name)=>{const r=cp.spawnSync(cmd,args,{encoding:'utf8'}),out=(r.stdout||'')+(r.stderr||'');fs.writeFileSync(root+'/quality/tests/'+name,out);return Number.isInteger(r.status)?r.status:1},mdExit=run('./node_modules/.bin/markdownlint-cli2',['**/*.md'],'t0-markdownlint.raw.log'),pathExit=run('node',['tools/cli/check-task-record-paths.mjs'],'t0-record-paths.raw.log'),structureExit=run('node',['tools/cli/verify-structure.mjs'],'t0-structure.raw.log'),read=n=>fs.readFileSync(root+'/quality/tests/'+n,'utf8'),md=read('t0-markdownlint.raw.log'),paths=read('t0-record-paths.raw.log'),structure=read('t0-structure.raw.log'),int=(re,s)=>{const m=s.match(re);return m?Number(m[1]):0},base={input,markdownlint:{exit_code:mdExit,errors:int(/(\\d+) error/,md),files:int(/(\\d+) file/,md),raw_ref:'t0-markdownlint.raw.log'},record_paths:{exit_code:pathExit,failures:int(/FAIL:\\s*(\\d+)/,paths),raw_ref:'t0-record-paths.raw.log'},structure:{exit_code:structureExit,failures:int(/FAIL:\\s*(\\d+)/,structure),raw_ref:'t0-structure.raw.log'}};fs.writeFileSync(root+'/quality/tests/t0-current-baseline.json',JSON.stringify(base,null,2)+'\\n');const store=fs.readFileSync('runtime/task/task-store.mjs','utf8'),note=fs.readFileSync(root+'/quality/tests/t0-preflight-check.md','utf8');if(!/TASK_RECORD_KINDS[\\s\\S]*\"stage\"[\\s\\S]*\"close_action\"/.test(store)||!/[\"']record_kind[\"']/.test(store)||!/[\"']dispatched_uncollected[\"']/.test(store)||!/[\"']review_result_ref[\"']/.test(store)||!['incomplete','unavailable','not_run'].every(x=>note.includes(x)))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T0 {"pass":"9f9d0c44 is ancestor; input=35a6fb6f; archive present; K2 frozen contract read back; current baseline artifact parseable"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-preflight-check.md; $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json
- **STOP**：任一前置不满足（不进入 T1）
- **recovery**：满足前置后重做
- **task risk**：低

#### T1

- **ID**：T1
- **Phase**：Phase 1 · C9 执行面
- **goal**：档位常量值一次性改名 inner/phase/aggregate 到底
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T0
- **并行**：无
- **FR**：FR-C9-001
- **AC**：AC-C9-001
- **动作**：RED：跑改名零残留断言（今失败：旧名仍在）
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`；`docs/adr/0027-test-feedback-runtime-profile.md`
- **boundary**：files：runtime/stage/stage-content-contracts.mjs；docs/adr/0027-test-feedback-runtime-profile.md
- **输出**：改名后的常量/权限/文案；grep 零残留记录
- **Knowledge**：改名是 C9 第一步（T-010 追加）；HANDOFF-T2-001 移交 C7 复核；执行序第 1
- **verification_role**：RED
- **paired_task**：T2
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/test-runtime-profile.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-C9-001 {"pass":"TEST_RUNTIME_PROFILE_NAMES exactly [inner,phase,aggregate]; LIMITS exactly {inner:60000,phase:300000,aggregate:null}; aggregate rejects local and accepts CI=true; ADR-0027 exact file uses new names","reject":{"input":"name/key/limit/CI mismatch","expected_rejection":"targeted contract test fails","observation":"export/readback behavior, not generic grep"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t1-rename-grep.txt
- **STOP**：旧名残留或 aggregate 出现契约数字
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：改名漏点连锁红（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T2

- **ID**：T2
- **Phase**：Phase 1 · C9 执行面
- **goal**：档位常量值一次性改名 inner/phase/aggregate 到底
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T1
- **并行**：无
- **FR**：FR-C9-001
- **AC**：AC-C9-001
- **动作**：GREEN：改 TEST_RUNTIME_PROFILE_NAMES 值与 LIMITS 键、权限语义、错误文案、ADR 表述；旧名零残留
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`；`docs/adr/0027-test-feedback-runtime-profile.md`
- **boundary**：files：runtime/stage/stage-content-contracts.mjs；docs/adr/0027-test-feedback-runtime-profile.md
- **输出**：改名后的常量/权限/文案；grep 零残留记录
- **Knowledge**：改名是 C9 第一步（T-010 追加）；HANDOFF-T2-001 移交 C7 复核；执行序第 1
- **verification_role**：GREEN
- **paired_task**：T1
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/test-runtime-profile.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-C9-001 {"pass":"TEST_RUNTIME_PROFILE_NAMES exactly [inner,phase,aggregate]; LIMITS exactly {inner:60000,phase:300000,aggregate:null}; aggregate rejects local and accepts CI=true; ADR-0027 exact file uses new names"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t1-rename-grep.txt
- **STOP**：旧名残留或 aggregate 出现契约数字
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：改名漏点连锁红（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T3

- **ID**：T3
- **Phase**：Phase 1 · C9 执行面
- **goal**：measure-test-runtime-profile 复用评估（档位改名后立即执行，D-005）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行
- **并行**：无
- **FR**：FR-C9-007
- **AC**：AC-C9-011
- **动作**：读工具实现与消费点；在改名后的新接口上判定能否复用（接受 phase 档）；产出结论与处置（复用接线或登记 HANDOFF-T2-004）
- **精确文件**：`tools/cli/measure-test-runtime-profile.mjs`
- **boundary**：files：tools/cli/measure-test-runtime-profile.mjs
- **输出**：评估结论记录
- **Knowledge**：改名（T2）后立即评估；先改名再评估避免在旧接口上误判；执行序第 2
- **verification_role**：N/A — 非行为变更：流程/评估/确认/移交记录
- **paired_task**：N/A — 非行为变更：验证由同批 GREEN 任务承担
- **gate_cmd**：bash -c 'test -s "$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t1-measure-reuse-assessment.md"'
- **expected_exit**：0
- **oracle**：`ORA-T1 {"pass": "评估结论存在且处置路径明确（复用接线或 HANDOFF-T2-004 登记）"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t1-measure-reuse-assessment.md
- **STOP**：工具不存在或结论缺失
- **recovery**：补记录后重做
- **task risk**：评估拖延阻塞批次（低）

#### T4

- **ID**：T4
- **Phase**：Phase 1 · C9 执行面
- **goal**：run-checks aggregate ceiling 语义 + 7 文件分档命令表（表见 plan Test Strategy）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C9-001
- **AC**：AC-C9-001, AC-C9-002, AC-C9-004
- **动作**：RED：跑 aggregate null 断言（今失败：aggregate 有数字契约）
- **精确文件**：`tools/cli/run-checks.mjs`
- **boundary**：files：tools/cli/run-checks.mjs
- **输出**：分档命令表与 ceiling 语义；启动次数核算记录
- **Knowledge**：两个 900 秒超时命令不再同层；CI=true 硬要求保留；执行序第 3
- **verification_role**：RED
- **paired_task**：T5
- **gate_cmd**：`./node_modules/.bin/vitest run core/__tests__/run-checks.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-T4 {"pass": "inner evidence ceiling_ms=60000 且 aggregate 无数字契约", "reject": {"input": "aggregate 分支存在数字契约上限", "expected_rejection": "数字预算即红", "observation": "ceiling null + 兜底单列"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t4-inner.json
- **STOP**：ceiling 语义写错或分档跨层混跑
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：CI 空等复现（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T5

- **ID**：T5
- **Phase**：Phase 1 · C9 执行面
- **goal**：run-checks aggregate ceiling 语义 + 7 文件分档命令表（表见 plan Test Strategy）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T4
- **并行**：无
- **FR**：FR-C9-001
- **AC**：AC-C9-001, AC-C9-002, AC-C9-004
- **动作**：GREEN：aggregate 分支改「契约 null + supervisor 兜底 900_000 单列」；7 文件分档命令表按 plan Test Strategy 落 run-checks 注释与执行证据；启动次数核算
- **精确文件**：`tools/cli/run-checks.mjs`
- **boundary**：files：tools/cli/run-checks.mjs
- **输出**：分档命令表与 ceiling 语义；启动次数核算记录
- **Knowledge**：两个 900 秒超时命令不再同层；CI=true 硬要求保留；执行序第 3
- **verification_role**：GREEN
- **paired_task**：T4
- **gate_cmd**：`./node_modules/.bin/vitest run core/__tests__/run-checks.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-T4 {"pass": "inner evidence ceiling_ms=60000 且 aggregate 无数字契约"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t4-inner.json
- **STOP**：ceiling 语义写错或分档跨层混跑
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：CI 空等复现（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T6

- **ID**：T6
- **Phase**：Phase 1 · C9 执行面
- **goal**：新增 npm script 入口 test:profile
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C9-006
- **AC**：AC-C9-010
- **动作**：RED：npm run test:profile（今失败：脚本不存在）
- **精确文件**：`package.json`
- **boundary**：files：package.json
- **输出**：入口存在；既有脚本输出与基线一致
- **Knowledge**：OI-08 三硬前置；入口未落地不得声明完成；执行序第 4
- **verification_role**：RED
- **paired_task**：T7
- **gate_cmd**：`bash -c 'out="$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t6-evidence.json"; npm run test:profile -- --evidence-path "$out" && node -e "const fs=require(\"fs\");const e=JSON.parse(fs.readFileSync(process.argv[1],\"utf8\"));if(!e)process.exit(1)" "$out"'`
- **expected_exit**：1
- **oracle**：`ORA-T6 {"pass": "入口真实 phase 调用产出 evidence 且既有脚本语义未变", "reject": {"input": "test:profile 脚本缺失", "expected_rejection": "npm 报错 exit 非 0", "observation": "入口可执行"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t6-test-profile.log
- **STOP**：入口改名或改了既有脚本
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：低
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-006
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T7

- **ID**：T7
- **Phase**：Phase 1 · C9 执行面
- **goal**：新增 npm script 入口 test:profile
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T6
- **并行**：无
- **FR**：FR-C9-006
- **AC**：AC-C9-010
- **动作**：GREEN：package.json 新增 test:profile（run-checks phase 档）；不改既有脚本语义
- **精确文件**：`package.json`
- **boundary**：files：package.json
- **输出**：入口存在；既有脚本输出与基线一致
- **Knowledge**：OI-08 三硬前置；入口未落地不得声明完成；执行序第 4
- **verification_role**：GREEN
- **paired_task**：T6
- **gate_cmd**：`bash -c 'out="$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t6-evidence.json"; npm run test:profile -- --evidence-path "$out" && node -e "const fs=require(\"fs\");const e=JSON.parse(fs.readFileSync(process.argv[1],\"utf8\"));if(!e)process.exit(1)" "$out"'`
- **expected_exit**：0
- **oracle**：`ORA-T6 {"pass": "入口真实 phase 调用产出 evidence 且既有脚本语义未变"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t6-test-profile.log
- **STOP**：入口改名或改了既有脚本
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：低
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-006
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T8

- **ID**：T8
- **Phase**：Phase 1 · C9 执行面
- **goal**：receipt 复用读取分支 + 超时保留取证（新增测试文件）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C9-002, FR-C9-003
- **AC**：AC-C9-006, AC-C9-007
- **动作**：RED：./node_modules/.bin/vitest run tests/contract/test-capture-reuse.test.mjs（今失败：文件不存在）
- **精确文件**：`runtime/evidence/canonical-receipt-writer.mjs`；`tests/contract/test-capture-reuse.test.mjs`
- **boundary**：files：runtime/evidence/canonical-receipt-writer.mjs；tests/contract/test-capture-reuse.test.mjs
- **输出**：复用分支与新增测试；退出码 0
- **Knowledge**：J-6 (b)；不造锁；并发在途如实登记；执行序第 5
- **verification_role**：RED
- **paired_task**：T9
- **gate_cmd**：./node_modules/.bin/vitest run tests/contract/test-capture-reuse.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：1
- **oracle**：`ORA-T5 {"pass": "复用零二次启动且超时落盘可读回", "reject": {"input": "receipt 复用/超时落盘取证缺失", "expected_rejection": "测试不存在或断言失败", "observation": "计数=1 且 output_ref 可读"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t5-capture-reuse.log
- **STOP**：复用判据被破坏
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：并发语义被误改（低）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-002
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T9

- **ID**：T9
- **Phase**：Phase 1 · C9 执行面
- **goal**：receipt 复用读取分支 + 超时保留取证（新增测试文件）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T8
- **并行**：无
- **FR**：FR-C9-002, FR-C9-003
- **AC**：AC-C9-006, AC-C9-007
- **动作**：GREEN：增强 reusableTestCapture 超时/中断后已完成部分可读回；新增 test-capture-reuse 测试（复用零二次启动+超时落盘可读回）
- **精确文件**：`runtime/evidence/canonical-receipt-writer.mjs`；`tests/contract/test-capture-reuse.test.mjs`
- **boundary**：files：runtime/evidence/canonical-receipt-writer.mjs；tests/contract/test-capture-reuse.test.mjs
- **输出**：复用分支与新增测试；退出码 0
- **Knowledge**：J-6 (b)；不造锁；并发在途如实登记；执行序第 5
- **verification_role**：GREEN
- **paired_task**：T8
- **gate_cmd**：./node_modules/.bin/vitest run tests/contract/test-capture-reuse.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：0
- **oracle**：`ORA-T5 {"pass": "复用零二次启动且超时落盘可读回"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t5-capture-reuse.log
- **STOP**：复用判据被破坏
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：并发语义被误改（低）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-002
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T10

- **ID**：T10
- **Phase**：Phase 1 · C9 执行面
- **goal**：preflight 三类校验实现
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C9-004, FR-C9-005
- **AC**：AC-C9-008, AC-C9-009
- **动作**：RED：preflight 不存在命令负例断言（今失败：空实现返回 valid）
- **精确文件**：`tools/cli/stage-runtime.mjs`；`tests/contract/stage-runtime-preflight.test.mjs`
- **boundary**：files：tools/cli/stage-runtime.mjs；tests/contract/stage-runtime-preflight.test.mjs
- **输出**：public `stageRuntimeMain(argv, {services,cwd})` preflight 实现；四类负例断言输出
- **Knowledge**：AC-C9-009 三条件同时成立；执行序第 6
- **verification_role**：RED
- **paired_task**：T11
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/stage-runtime-preflight.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-T7 {"pass": "四类负例返回非空三字段 diagnostics 且耗时 ≤5000ms", "reject": {"input": "不存在的命令/路径/超预算 packet/能力缺失", "expected_rejection": "返回 valid 空 diagnostics", "observation": "protocol_invalid + 三字段 ≤5s"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t7-preflight-negatives.txt
- **STOP**：preflight 变门禁或空 diagnostics
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：做成门禁阻塞推进（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-004
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T11

- **ID**：T11
- **Phase**：Phase 1 · C9 执行面
- **goal**：preflight 三类校验实现
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T10
- **并行**：无
- **FR**：FR-C9-004, FR-C9-005
- **AC**：AC-C9-008, AC-C9-009
- **动作**：GREEN：由 public `stageRuntimeMain(argv = process.argv.slice(2), { services = {}, cwd = process.cwd() } = {})` 调用 preflight 服务完成命令/路径/能力/packet 校验；测试只走 public seam，禁止导入私有 helper/fallback；protocol_invalid + 三字段 diagnostics ≤5 秒；不启子进程/不做门禁/可原地重试
- **精确文件**：`tools/cli/stage-runtime.mjs`；`tests/contract/stage-runtime-preflight.test.mjs`
- **boundary**：files：tools/cli/stage-runtime.mjs；tests/contract/stage-runtime-preflight.test.mjs
- **输出**：public `stageRuntimeMain(argv, {services,cwd})` preflight 实现；四类负例断言输出
- **Knowledge**：AC-C9-009 三条件同时成立；执行序第 6
- **verification_role**：GREEN
- **paired_task**：T10
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/stage-runtime-preflight.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-T7 {"pass": "四类负例返回非空三字段 diagnostics 且耗时 ≤5000ms"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t7-preflight-negatives.txt
- **STOP**：preflight 变门禁或空 diagnostics
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：做成门禁阻塞推进（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-004
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T12

- **ID**：T12
- **Phase**：Phase 1 · C9 执行面
- **goal**：C9 批全绿 + 守卫基线不劣化（批停止条件）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C9-001, FR-C9-002, FR-C9-003, FR-C9-004, FR-C9-005, FR-C9-006, FR-C9-007
- **AC**：AC-C9-001, AC-C9-002, AC-C9-003, AC-C9-004, AC-C9-006, AC-C9-007, AC-C9-008, AC-C9-009, AC-C9-010, AC-C9-011
- **动作**：RED：C9 批命令矩阵（今失败：改名断言未更新/新测试缺）
- **精确文件**：`tests/contract/test-runtime-profile.test.mjs`；`tests/contract/runtime-profile-consumer-readback.test.mjs`；`core/__tests__/run-checks.test.mjs`；`tests/contract/stage-runtime-preflight.test.mjs`
- **boundary**：files：tests/contract/test-runtime-profile.test.mjs；tests/contract/runtime-profile-consumer-readback.test.mjs；`core/__tests__/run-checks.test.mjs`；tests/contract/stage-runtime-preflight.test.mjs
- **输出**：批内全绿记录；计时实测；守卫前后输出
- **Knowledge**：禁止全量回归；守卫基线从 T0 artifact 动态读取；执行序第 7
- **verification_role**：RED
- **paired_task**：T13
- **gate_cmd**：`bash -c './node_modules/.bin/vitest run core/__tests__/run-checks.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/stage-runtime-preflight.test.mjs tests/contract/test-capture-reuse.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && test -z "$(grep -nE '\"(medium|large)\"' runtime/stage/stage-content-contracts.mjs | grep -viE 'impact|REQUIREMENT')" && ! grep -nE '\b(medium|large)\b' docs/adr/0027-test-feedback-runtime-profile.md'`
- **expected_exit**：1
- **oracle**：`ORA-T8 {"pass": "C9 批全绿 + 单文件 <743,014ms + aggregate <1,717.39s + 守卫不劣化（AC-C9-005 由 T15/T16 承担）", "reject": {"input": "改名/新测试/preflight 未落地", "expected_rejection": "批内任一红", "observation": "全绿 + 计时 + 守卫记录"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-c9-batch-green.log
- **STOP**：任一红或守卫劣化
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：守卫劣化污染 M4（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T13

- **ID**：T13
- **Phase**：Phase 1 · C9 执行面
- **goal**：C9 批全绿 + 守卫基线不劣化（批停止条件）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T12
- **并行**：无
- **FR**：FR-C9-001, FR-C9-002, FR-C9-003, FR-C9-004, FR-C9-005, FR-C9-006, FR-C9-007
- **AC**：AC-C9-001, AC-C9-002, AC-C9-003, AC-C9-004, AC-C9-006, AC-C9-007, AC-C9-008, AC-C9-009, AC-C9-010, AC-C9-011
- **动作**：GREEN：更新 profile 测试断言；跑 C9 批全部命令（含旧名全仓 grep）+ 计时实测 + 守卫三条前后比对
- **精确文件**：`tests/contract/test-runtime-profile.test.mjs`；`tests/contract/runtime-profile-consumer-readback.test.mjs`；`core/__tests__/run-checks.test.mjs`；`tests/contract/stage-runtime-preflight.test.mjs`
- **boundary**：files：tests/contract/test-runtime-profile.test.mjs；tests/contract/runtime-profile-consumer-readback.test.mjs；`core/__tests__/run-checks.test.mjs`；tests/contract/stage-runtime-preflight.test.mjs
- **输出**：批内全绿记录；计时实测；守卫前后输出
- **Knowledge**：禁止全量回归；守卫基线从 T0 artifact 动态读取；执行序第 7
- **verification_role**：GREEN
- **paired_task**：T12
- **gate_cmd**：`bash -c './node_modules/.bin/vitest run core/__tests__/run-checks.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/stage-runtime-preflight.test.mjs tests/contract/test-capture-reuse.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && test -z "$(grep -nE '\"(medium|large)\"' runtime/stage/stage-content-contracts.mjs | grep -viE 'impact|REQUIREMENT')" && ! grep -nE '\b(medium|large)\b' docs/adr/0027-test-feedback-runtime-profile.md'`
- **expected_exit**：0
- **oracle**：`ORA-T8 {"pass": "C9 批全绿 + 单文件 <743,014ms + aggregate <1,717.39s + 守卫不劣化（AC-C9-005 由 T15/T16 承担）"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-c9-batch-green.log
- **STOP**：任一红或守卫劣化
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：守卫劣化污染 M4（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T14

- **ID**：T14
- **Phase**：Phase 1 · C9 执行面
- **goal**：C9 批合入与批间交接记录
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行
- **并行**：无
- **FR**：N/A
- **AC**：N/A
- **动作**：C9 批 commit（逐任务提交边界内）；在 p1-batch-boundary.json 持久化 workflowhub repo_root/branch/BATCH_BASE/BATCH_HEAD full OID；写批交接记录
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-c9-handoff.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-batch-boundary.json`；`tests/contract/decision-convergence-depth.test.mjs`；`tests/contract/requirement-convergence-regression.test.mjs`；`tests/contract/stage-completion.test.mjs`；`tests/e2e/vnext-five-stage-current.test.mjs`；`tests/integration/vnext-delivery-close.test.mjs`；`tests/integration/vnext-official-stage-run.test.mjs`；批内已声明文件严格不可写（READ-ONLY CONSUMER 只读）
- **输出**：commit 链与交接记录
- **Knowledge**：合入排在任务Ⅰ 之后；D-016 合并序；执行序第 8
- **verification_role**：N/A — 非行为变更：流程/评估/确认/移交记录
- **paired_task**：N/A — 非行为变更：验证由同批 GREEN 任务承担
- **gate_cmd**：`node -e "const cp=require('child_process'),fs=require('fs');const phase='1',root=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/',e=JSON.parse(fs.readFileSync(root+'p1-batch-boundary.json','utf8')),text=fs.readFileSync('specs/workflowhub-mechanism-simplification-t2-20260911/tasks.md','utf8'),head='## Phase '+phase+' ',start=text.indexOf(head),tail=text.slice(start),stop=tail.indexOf('### Files'),section=tail.slice(stop+10,tail.indexOf('### Tasks'));if(start<0||stop<0||!Array.isArray(e.repositories))process.exit(1);const rows=section.split(String.fromCharCode(10)).filter(x=>x.startsWith('- **')).map(x=>[x.slice(7,x.indexOf('**',7)),x.slice(x.lastIndexOf(String.fromCharCode(96))+1)]),readonly=new Set(rows.filter(x=>x[0].trim()==='READ-ONLY CONSUMER').map(x=>x[1])),writable=new Set(rows.filter(x=>x[0].trim()!=='READ-ONLY CONSUMER').map(x=>x[1]).filter(x=>!x.startsWith('$WORKFLOWHUB_TASK_DIR'))),keys=['repo_root','branch','BATCH_BASE','BATCH_HEAD'];for(const r of e.repositories){for(const k of keys)if(!r[k])process.exit(1);if(cp.execFileSync('git',['merge-base','--is-ancestor',r.BATCH_BASE,r.BATCH_HEAD],{cwd:r.repo_root,stdio:'pipe'}).length)process.exit(1);const changed=cp.spawnSync('git',['diff','--name-only',r.BATCH_BASE+'..'+r.BATCH_HEAD],{cwd:r.repo_root,encoding:'utf8'}).stdout.trim().split(String.fromCharCode(10)).filter(Boolean),bad=changed.filter(x=>readonly.has(x)||!writable.has(x));if(bad.length)process.exit(1)}"`
- **expected_exit**：0
- **oracle**：`ORA-T9 {"pass": "从 p1 persisted OIDs 对 workflowhub 独立验 ancestry/diff，changed paths 仅 Phase Files writable 且 READ-ONLY 零改且证据链完整"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-c9-handoff.md
- **STOP**：证据缺失
- **recovery**：补记录后重做
- **task risk**：低

## Phase 2 · C4 审查生命周期

### Goal

主仓消费侧十项 + 跨仓判死实现（确认点后）+ T-11 + 通道修复 fixtures，C4 批 AC 全过。

### Files

- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/docs/archive/2026-07-12-v3-redesign-design.md`
- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`
- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs`
- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs`
- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/lib/provider-failure.mjs`
- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/lib/runtime.mjs`
- **MODIFY** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/reviews/results/`
- **MODIFY** `runtime/evidence/stage-content-evidence.mjs`
- **MODIFY** `runtime/review/review-record-route.mjs`
- **MODIFY** `runtime/review/schemas/attempt.schema.json`
- **MODIFY** `runtime/review/stage-materials.json`
- **MODIFY** `runtime/stage/stage-handlers.mjs`
- **MODIFY** `runtime/stage/stage-runner.mjs`
- **MODIFY** `runtime/task/material-workspace.mjs`
- **MODIFY** `runtime/task/task-store.mjs`
- **MODIFY** `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **MODIFY** `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **MODIFY** `skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`
- **MODIFY** `skills/wh-review/scripts/review-materials.mjs`
- **MODIFY** `skills/wh-review/scripts/review-provider-client.mjs`
- **MODIFY** `skills/wh-review/scripts/review-result.mjs`
- **MODIFY** `skills/wh-review/scripts/simple-review-runner.mjs`
- **MODIFY** `skills/wh-review/scripts/third-review-host-config.mjs`
- **MODIFY** `tests/contract/build-prd-review-contract.test.mjs`
- **MODIFY** `tests/contract/review-budget-namespace.test.mjs`
- **NEW** `tests/contract/stalled-consumer-delta.test.mjs`
- **MODIFY** `tests/contract/review-materials-contract.test.mjs`
- **MODIFY** `tests/contract/verify-architect-acceptance.test.mjs`
- **MODIFY** `tests/review/review-managed-lifecycle.test.mjs`
- **MODIFY** `tests/review/review-policy-compatibility.test.mjs`
- **MODIFY** `tests/review/review-record-route.test.mjs`
- **MODIFY** `tests/verify-code-facts.test.mjs`
- **MODIFY** `tests/integration/stage-row-publication.test.mjs`
- **MODIFY** `tests/integration/stage-row-verify-code.test.mjs`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-c4-handoff.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t18-crossrepo-tests.log`
- **NEW** `skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`

### Tasks

T15-T42（T27 跨仓确认门为 T28/T29 前置；见 tasks.md Phase 2）

### Verify

C4 批 gate 组全绿 + AC-C4-001~026 oracle 取证 + 跨仓自证三测试通过 + T-11 通道实跑退出码记录 + 守卫基线不劣化（含批准的 npm run check 例外一次）。

### Knowledge

C4 先于 C5 改 review-materials/review-record-route、先于 C6 改 stage-handlers；K2 frozen fields/enum 已存在，只做 regression 与真实事实传播。

### STOP

跨仓确认点未过（STOP 在本仓侧继续）；验证 T-11 实跑被计成审查轮次；通道修复复现丢包；出现第二份健康判死实现。

### Done

review_origin 五态可见；预算零命中且替代物可读；stalled 三处接受；异源按底层模型；verify 执行端读 ref 分区结论；跨仓终态判死自证通过；文档标注落地。

### Risks and rollback

跨仓误写 → 确认点协议拦截；T-11 撞 REQUEST_ID_CONFLICT → 停在 T25 修复；回滚 = revert 本批，跨仓侧按 git 历史回退并记录。

### Task Blocks（执行序列）

本 Phase 任务块（RED/GREEN 成对，T 号顺序执行）：

#### T15

- **ID**：T15
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：审查去重键按 spec FR-C4-001 元组 + 大改动判定人写死
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-001
- **AC**：AC-C4-001, AC-C9-005
- **动作**：RED：./node_modules/.bin/vitest run review-record-route 新增用例（今失败：同 track 不同 phase 被旧键锁死）
- **精确文件**：`runtime/review/review-record-route.mjs`；`tests/review/review-record-route.test.mjs`
- **boundary**：files：runtime/review/review-record-route.mjs；tests/review/review-record-route.test.mjs
- **输出**：去重键实现；针对性测试正例
- **Knowledge**：裁定 I-1；D-029③；spec 口径优先于 PRD 元组表述
- **verification_role**：RED
- **paired_task**：T16
- **gate_cmd**：./node_modules/.bin/vitest run tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：1
- **oracle**：`ORA-T10 {"pass": "同 stage 同 track 不同 phase 第二次可派发且 reused 路径正确； reused 零派发断言（AC-C9-005 由 C4 批承担）", "reject": {"input": "旧键缺 spec 元组维度", "expected_rejection": "第二次请求被锁死 reused", "observation": "五维元组在判断体内且可派发"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t10-dedup-key.log
- **STOP**：focus 复审被旧键锁死
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：重复派发或锁死（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T16

- **ID**：T16
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：审查去重键按 spec FR-C4-001 元组 + 大改动判定人写死
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T15
- **并行**：无
- **FR**：FR-C4-001
- **AC**：AC-C4-001, AC-C9-005
- **动作**：GREEN：findReusableReview 去重键按 spec FR-C4-001 元组 (stage, phase_id, track, review_kind, origin) 实现；大改动判定人=主会话、口径=跨接口/schema/安全边界/公共契约、误判处置=记录并回基线
- **精确文件**：`runtime/review/review-record-route.mjs`；`tests/review/review-record-route.test.mjs`
- **boundary**：files：runtime/review/review-record-route.mjs；tests/review/review-record-route.test.mjs
- **输出**：去重键实现；针对性测试正例
- **Knowledge**：裁定 I-1；D-029③；spec 口径优先于 PRD 元组表述
- **verification_role**：GREEN
- **paired_task**：T15
- **gate_cmd**：./node_modules/.bin/vitest run tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：0
- **oracle**：`ORA-T10 {"pass": "同 stage 同 track 不同 phase 第二次可派发且 reused 路径正确； reused 零派发断言（AC-C9-005 由 C4 批承担）"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t10-dedup-key.log
- **STOP**：focus 复审被旧键锁死
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：重复派发或锁死（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T17

- **ID**：T17
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：frozen K2 review fields 回归 + 删除 validateReviewBudget
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-002
- **AC**：AC-C4-002
- **动作**：RED：先以现有 task-store/stage-row tests 记录 frozen K2 `record_kind`、五值 `review_origin`、`review_result_ref` 已通过（regression-only），再证明 `validateReviewBudget` 定义/import/callers 仍存在而 RED；不得把 RED 写成字段缺失
- **精确文件**：`runtime/task/task-store.mjs`；`runtime/evidence/stage-content-evidence.mjs`；`runtime/review/review-record-route.mjs`；`runtime/stage/stage-handlers.mjs`；`runtime/stage/stage-runner.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/integration/stage-row-verify-code.test.mjs`
- **boundary**：files：runtime/task/task-store.mjs；runtime/evidence/stage-content-evidence.mjs；runtime/review/review-record-route.mjs；runtime/stage/stage-handlers.mjs；runtime/stage/stage-runner.mjs；tests/integration/stage-row-publication.test.mjs；tests/integration/stage-row-verify-code.test.mjs
- **输出**：K2 regression/merge readback；预算 symbol/use-site 零命中
- **Knowledge**：顺序硬约束：替代物先于删预算；裁定 G/K7
- **verification_role**：RED
- **paired_task**：T18
- **gate_cmd**：bash -c '! grep -rn validateReviewBudget runtime/ | grep -qv tests'
- **expected_exit**：1
- **oracle**：`ORA-T12 {"pass": "K2 行含 review_origin 与 review_result_ref 且生产零 validateReviewBudget 命中", "reject": {"input": "替代物未落地且预算函数仍在", "expected_rejection": "删预算后去重窗口丢失或 grep 命中", "observation": "字段可读 + grep exit=1"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t12-budget-zero.log
- **STOP**：字段被做成新文件/schema
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：去重窗口丢失（已用顺序规避）（低）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-002
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T18

- **ID**：T18
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：frozen K2 review fields 回归 + 删除 validateReviewBudget
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T17
- **并行**：无
- **FR**：FR-C4-002
- **AC**：AC-C4-002
- **动作**：GREEN：不创建/改名 K2 字段；保留 `record_kind` frozen 16-key validation，并将真实 review facts 合并/传播到同一 stage 行、避免 stage-end replacement 擦除；删除 `validateReviewBudget` 定义以及 review-record-route/stage-handlers imports/callers；以 regression tests + symbol/use-site scan 转绿
- **精确文件**：`runtime/task/task-store.mjs`；`runtime/evidence/stage-content-evidence.mjs`；`runtime/review/review-record-route.mjs`；`runtime/stage/stage-handlers.mjs`；`runtime/stage/stage-runner.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/integration/stage-row-verify-code.test.mjs`
- **boundary**：files：runtime/task/task-store.mjs；runtime/evidence/stage-content-evidence.mjs；runtime/review/review-record-route.mjs；runtime/stage/stage-handlers.mjs；runtime/stage/stage-runner.mjs；tests/integration/stage-row-publication.test.mjs；tests/integration/stage-row-verify-code.test.mjs
- **输出**：K2 regression/merge readback；预算 symbol/use-site 零命中
- **Knowledge**：顺序硬约束：替代物先于删预算；裁定 G/K7
- **verification_role**：GREEN
- **paired_task**：T17
- **gate_cmd**：bash -c '! grep -rn validateReviewBudget runtime/ | grep -qv tests'
- **expected_exit**：0
- **oracle**：`ORA-T12 {"pass": "K2 行含 review_origin 与 review_result_ref 且生产零 validateReviewBudget 命中"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t12-budget-zero.log
- **STOP**：字段被做成新文件/schema
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：去重窗口丢失（已用顺序规避）（低）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-002
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T19

- **ID**：T19
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：复审触发收紧 + focus 复审五项输入（不落盘）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-003, FR-C4-014
- **AC**：AC-C4-005, AC-C4-017
- **动作**：RED：assembleFocusReviewInput 存在性与五项断言（今失败：函数不存在）
- **精确文件**：`runtime/review/review-record-route.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`
- **boundary**：files：runtime/review/review-record-route.mjs；skills/wh-review/scripts/simple-review-runner.mjs
- **输出**：触发收紧实现；五项组装断言记录
- **Knowledge**：每 Phase 恰好一次核心审查；D-013+裁定 G
- **verification_role**：RED
- **paired_task**：T20
- **gate_cmd**：`node -e "import('./runtime/review/review-record-route.mjs').then(m=>{if(typeof m.assembleFocusReviewInput!=='function')process.exit(1);const i=m.assembleFocusReviewInput({finding_ref:'f',minimal_diff:'d',tests:'t',source_tree:'s',delta_verification:'v'});if(Object.keys(i).length!==5)process.exit(1);console.log('focus-five-ok')}).catch(()=>process.exit(1))"`
- **expected_exit**：1
- **oracle**：`ORA-T13 {"pass": "小修后 attempt 计数=1 且五项组装零落盘", "reject": {"input": "小修触发二次 attempt 或组装落盘", "expected_rejection": "attempt=2 或 porcelain 新增", "observation": "计数=1 + 五项齐备"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t13-focus-input.log
- **STOP**：组装落盘或缺项
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：窄修复包变持久对象（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-003
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T20

- **ID**：T20
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：复审触发收紧 + focus 复审五项输入（不落盘）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T19
- **并行**：无
- **FR**：FR-C4-003, FR-C4-014
- **AC**：AC-C4-005, AC-C4-017
- **动作**：GREEN：小修不触发复审；focus 输入一次性组装恰五项内存对象；node -e 断言 Object.keys==5；porcelain 无新增
- **精确文件**：`runtime/review/review-record-route.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`
- **boundary**：files：runtime/review/review-record-route.mjs；skills/wh-review/scripts/simple-review-runner.mjs
- **输出**：触发收紧实现；五项组装断言记录
- **Knowledge**：每 Phase 恰好一次核心审查；D-013+裁定 G
- **verification_role**：GREEN
- **paired_task**：T19
- **gate_cmd**：`node -e "import('./runtime/review/review-record-route.mjs').then(m=>{if(typeof m.assembleFocusReviewInput!=='function')process.exit(1);const i=m.assembleFocusReviewInput({finding_ref:'f',minimal_diff:'d',tests:'t',source_tree:'s',delta_verification:'v'});if(Object.keys(i).length!==5)process.exit(1);console.log('focus-five-ok')}).catch(()=>process.exit(1))"`
- **expected_exit**：0
- **oracle**：`ORA-T13 {"pass": "小修后 attempt 计数=1 且五项组装零落盘"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t13-focus-input.log
- **STOP**：组装落盘或缺项
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：窄修复包变持久对象（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-003
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T21

- **ID**：T21
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：dispatch_state 提升到配对聚合面
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-004
- **AC**：AC-C4-023
- **动作**：RED：./node_modules/.bin/vitest run simple-review-runner 顶层字段断言（今失败：聚合面无 dispatch_state）
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files：skills/wh-review/scripts/simple-review-runner.mjs；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **输出**：顶层字段断言记录
- **Knowledge**：FR-C4-004 补判据
- **verification_role**：RED
- **paired_task**：T22
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-T14 {"pass": "聚合结果顶层含 dispatch_state 且取值正确", "reject": {"input": "聚合结果无顶层 dispatch_state", "expected_rejection": "顶层字段缺失", "observation": "reused/dispatched 顶层可见"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t14-dispatch-state.log
- **STOP**：顶层缺失
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：低
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-004
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T22

- **ID**：T22
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：dispatch_state 提升到配对聚合面
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T21
- **并行**：无
- **FR**：FR-C4-004
- **AC**：AC-C4-023
- **动作**：GREEN：配对聚合结果顶层补 dispatch_state（不改逐 role 记录内现有字段）
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files：skills/wh-review/scripts/simple-review-runner.mjs；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **输出**：顶层字段断言记录
- **Knowledge**：FR-C4-004 补判据
- **verification_role**：GREEN
- **paired_task**：T21
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-T14 {"pass": "聚合结果顶层含 dispatch_state 且取值正确"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t14-dispatch-state.log
- **STOP**：顶层缺失
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：低
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-004
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T23

- **ID**：T23
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：packet 组装补 skills/ lens
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-005
- **AC**：AC-C4-007
- **动作**：RED：./node_modules/.bin/vitest run review-materials-contract bundle 断言（今失败：detail bundle 无 skills 子树）
- **精确文件**：`runtime/task/material-workspace.mjs`；`tests/contract/review-materials-contract.test.mjs`
- **boundary**：files：runtime/task/material-workspace.mjs；tests/contract/review-materials-contract.test.mjs
- **输出**：bundle 树 find 断言三条 SKILL.md
- **Knowledge**：detail track 必然含 skills 子树
- **verification_role**：RED
- **paired_task**：T24
- **gate_cmd**：./node_modules/.bin/vitest run tests/contract/review-materials-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：1
- **oracle**：`ORA-T15 {"pass": "detail bundle 含 3 条 SKILL.md", "reject": {"input": "detail bundle 无 skills/ 子树", "expected_rejection": "find 断言失败", "observation": "3 条 SKILL.md 存在"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t15-skills-lens.log
- **STOP**：bundle 无 skills 子树
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：低
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-005
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T24

- **ID**：T24
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：packet 组装补 skills/ lens
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T23
- **并行**：无
- **FR**：FR-C4-005
- **AC**：AC-C4-007
- **动作**：GREEN：buildStageInputPacket detail track 组含 simplicity-guard/plan-ceo-review/review 三 SKILL.md（manifest 对齐）
- **精确文件**：`runtime/task/material-workspace.mjs`；`tests/contract/review-materials-contract.test.mjs`
- **boundary**：files：runtime/task/material-workspace.mjs；tests/contract/review-materials-contract.test.mjs
- **输出**：bundle 树 find 断言三条 SKILL.md
- **Knowledge**：detail track 必然含 skills 子树
- **verification_role**：GREEN
- **paired_task**：T23
- **gate_cmd**：./node_modules/.bin/vitest run tests/contract/review-materials-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：0
- **oracle**：`ORA-T15 {"pass": "detail bundle 含 3 条 SKILL.md"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t15-skills-lens.log
- **STOP**：bundle 无 skills 子树
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：低
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-005
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T25

- **ID**：T25
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：异源判定按底层模型
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-006
- **AC**：AC-C4-008
- **动作**：RED：./node_modules/.bin/vitest run third-review-host-config（今失败：仍以 profile 键字符串相等判定）
- **精确文件**：`skills/wh-review/scripts/third-review-host-config.mjs`；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **boundary**：files：skills/wh-review/scripts/third-review-host-config.mjs；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **输出**：异源测试全绿；比较键断言
- **Knowledge**：最小异性要求不变；只改比较键
- **verification_role**：RED
- **paired_task**：T26
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-T16 {"pass": "同模型不同 profile 判同源、不同模型判异源", "reject": {"input": "profile 键相等即判同源", "expected_rejection": "同模型异 profile 被误判异源", "observation": "identity.model 比较"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t16-heterologous.log
- **STOP**：仍以 profile 键判定
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：异源退化致同源审查降级（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-006
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T26

- **ID**：T26
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：异源判定按底层模型
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T25
- **并行**：无
- **FR**：FR-C4-006
- **AC**：AC-C4-008
- **动作**：GREEN：sameSourceProfile 比较键改 broker identity.source_id 落到 identity.model；测试断言比较键写死
- **精确文件**：`skills/wh-review/scripts/third-review-host-config.mjs`；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **boundary**：files：skills/wh-review/scripts/third-review-host-config.mjs；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **输出**：异源测试全绿；比较键断言
- **Knowledge**：最小异性要求不变；只改比较键
- **verification_role**：GREEN
- **paired_task**：T25
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-T16 {"pass": "同模型不同 profile 判同源、不同模型判异源"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t16-heterologous.log
- **STOP**：仍以 profile 键判定
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：异源退化致同源审查降级（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-006
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T27

- **ID**：T27
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：跨仓人工确认点（人工门，不可逆动作前）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行
- **并行**：无
- **FR**：FR-C4-021
- **AC**：AC-C4-026
- **动作**：向用户呈报跨仓改动（改哪些文件/改成什么/怎么验收/失败怎么办）；用 portable Node `crypto.createHash('sha256')` 对 3rd-review 的 branch、HEAD、完整 pre-write `git status --porcelain=v2 -z --branch` 字节、tracked/index diff bytes、未跟踪路径与每个未跟踪文件内容哈希生成 full snapshot。把完整 snapshot、digest、用户原始答复、规范化 decision=`accepted|rejected|no_response` 与 branch 永久写入本 task-store evidence（不可只放 `/tmp`）。accepted 才允许 T28/T29，且每个跨仓写入口立即写前须重算并与该 snapshot 逐字节相等；rejected/no_response 跳过所有跨仓写并标 unknown，不停本仓。
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md`
- **boundary**：files：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md
- **输出**：持久化完整 pre-write snapshot、sha256、branch、用户原始答复与 accepted/rejected/no_response 分支
- **Knowledge**：D-008；不可逆动作经人确认；覆盖任何文件写入不只 commit 顺序；T28/T29 启动前置条件
- **verification_role**：N/A — 非行为变更：流程/评估/确认/移交记录
- **paired_task**：N/A — 非行为变更：验证由同批 GREEN 任务承担
- **gate_cmd**：`node -e "const fs=require('fs'),crypto=require('crypto');const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md',s=fs.readFileSync(p,'utf8'),m=s.match(/```json\n([\s\S]*?)\n```/);if(!m)process.exit(1);const e=JSON.parse(m[1]);if(!['accepted','rejected','no_response'].includes(e.decision)||!e.branch||!e.user_reply_raw||!e.pre_write_snapshot_full||crypto.createHash('sha256').update(e.pre_write_snapshot_full).digest('hex')!==e.pre_write_snapshot_sha256)process.exit(1);if(e.decision!=='accepted'&&e.crossrepo_write!=='skipped')process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T17 {"pass":"persistent evidence stores full pre-write snapshot, digest, branch, raw user decision; rejected/no_response requires skipped, accepted defers exact immediate pre-write equality to T28/T29","reject":{"input":"tmp-only/hash-only evidence, missing branch/reply, or rejected route writes","expected_rejection":"structured evidence validation fails","observation":"persisted decision branch and full snapshot"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md
- **STOP**：未确认先写
- **recovery**：补记录后重做
- **task risk**：跨仓误写不可逆（高）

#### T28

- **ID**：T28
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：跨仓健康判死实现（确认点 T27 之后）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-008, FR-C4-009, FR-C4-010, FR-C4-011
- **AC**：AC-C4-009, AC-C4-012, AC-C4-013, AC-C4-014, AC-C4-020
- **动作**：RED：cd 3rd-review && node --test 三文件（今失败：新判死/回收用例不过）
- **精确文件**：`/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs`；`/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`；`/Users/Hugh/Hugh/Project/3rd-review/lib/provider-failure.mjs`；`/Users/Hugh/Hugh/Project/3rd-review/lib/runtime.mjs`；`/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs`；`/Users/Hugh/Hugh/Project/3rd-review/docs/archive/2026-07-12-v3-redesign-design.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t18-crossrepo-tests.log`
- **boundary**：files：/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs；/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs；/Users/Hugh/Hugh/Project/3rd-review/lib/provider-failure.mjs；/Users/Hugh/Hugh/Project/3rd-review/lib/runtime.mjs；/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs；/Users/Hugh/Hugh/Project/3rd-review/docs/archive/2026-07-12-v3-redesign-design.md；$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t18-crossrepo-tests.log
- **输出**：跨仓 diff；node --test 三文件通过；文档标注 diff
- **Knowledge**：不改 managedPublic 五字段；公开 outcome 仍 4 值；RISK-003 随本任务验证或标 unknown；依赖 T27 确认门；GREEN 动作含「跨仓写入前重算 porcelain 哈希与 T27 快照比对」步骤（证据 t18-crossrepo-tests.log）；rejected/no-response 时本对跳过（不 STOP 本仓）并登记 unknown
- **verification_role**：RED
- **paired_task**：T29
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require("child_process"),crypto=require('crypto');const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md',s=fs.readFileSync(p,'utf8'),m=s.match(/```json\n([\s\S]*?)\n```/);if(!m)process.exit(1);const e=JSON.parse(m[1]);if(e.decision!=='accepted'){if(e.crossrepo_write!=='skipped')process.exit(1);process.exit(0)}const now=cp.execFileSync('git',['status','--porcelain=v2','-z','--branch'],{cwd:'/Users/Hugh/Hugh/Project/3rd-review'}),digest=crypto.createHash('sha256').update(now).digest('hex');if(digest!==e.pre_write_snapshot_sha256)process.exit(1);const r=cp.spawnSync('node',['--test','test/health-runner.test.mjs','test/managed-session-lifecycle.test.mjs','test/provider-failure.test.mjs'],{cwd:'/Users/Hugh/Hugh/Project/3rd-review',stdio:'inherit'});process.exit(r.status??1)"`
- **expected_exit**：1
- **oracle**：`ORA-T18 {"pass": "FakeClock 判死终态可达 + managed 端到端 terminal + 回收路径已验证", "reject": {"input": "判死不可达或回收缺口仍在", "expected_rejection": "decisions 为空或 state 恒 running", "observation": "PROCESS_STALLED 终态 + 回收验证"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t18-crossrepo-tests.log
- **STOP**：T27 答复为 rejected/no-response 时跳过本对（不 STOP 本仓），C4 批继续本仓任务并登记跨仓 AC 为 unknown
- **recovery**：skip-and-mark-unknown：跳过本对，$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md 登记分支，批完成条件按 unknown 出口核算
- **task risk**：跨仓侧拒绝（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-008
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T29

- **ID**：T29
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：跨仓健康判死实现（确认点 T27 之后）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T28
- **并行**：无
- **FR**：FR-C4-008, FR-C4-009, FR-C4-010, FR-C4-011
- **AC**：AC-C4-009, AC-C4-012, AC-C4-013, AC-C4-014, AC-C4-020
- **动作**：GREEN：health-runner 判死升级（PROCESS_STALLED 可发布终态，发布现有合法 outcome）；broker failed 枚举与内部 outcome 接线；config 墙钟拒绝保留；runtime.mjs 回收路径修复（RISK-003）；两份文档加方向修正标注
- **精确文件**：`/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs`；`/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`；`/Users/Hugh/Hugh/Project/3rd-review/lib/provider-failure.mjs`；`/Users/Hugh/Hugh/Project/3rd-review/lib/runtime.mjs`；`/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs`；`/Users/Hugh/Hugh/Project/3rd-review/docs/archive/2026-07-12-v3-redesign-design.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t18-crossrepo-tests.log`
- **boundary**：files：/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs；/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs；/Users/Hugh/Hugh/Project/3rd-review/lib/provider-failure.mjs；/Users/Hugh/Hugh/Project/3rd-review/lib/runtime.mjs；/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs；/Users/Hugh/Hugh/Project/3rd-review/docs/archive/2026-07-12-v3-redesign-design.md；$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t18-crossrepo-tests.log
- **输出**：跨仓 diff；node --test 三文件通过；文档标注 diff
- **Knowledge**：不改 managedPublic 五字段；公开 outcome 仍 4 值；RISK-003 随本任务验证或标 unknown；依赖 T27 确认门；GREEN 动作含「跨仓写入前重算 porcelain 哈希与 T27 快照比对」步骤（证据 t18-crossrepo-tests.log）；rejected/no-response 时本对跳过（不 STOP 本仓）并登记 unknown
- **verification_role**：GREEN
- **paired_task**：T28
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require("child_process"),crypto=require('crypto');const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md',s=fs.readFileSync(p,'utf8'),m=s.match(/```json\n([\s\S]*?)\n```/);if(!m)process.exit(1);const e=JSON.parse(m[1]);if(e.decision!=='accepted'){if(e.crossrepo_write!=='skipped')process.exit(1);process.exit(0)}const now=cp.execFileSync('git',['status','--porcelain=v2','-z','--branch'],{cwd:'/Users/Hugh/Hugh/Project/3rd-review'}),digest=crypto.createHash('sha256').update(now).digest('hex');if(digest!==e.pre_write_snapshot_sha256)process.exit(1);const r=cp.spawnSync('node',['--test','test/health-runner.test.mjs','test/managed-session-lifecycle.test.mjs','test/provider-failure.test.mjs'],{cwd:'/Users/Hugh/Hugh/Project/3rd-review',stdio:'inherit'});process.exit(r.status??1)"`
- **expected_exit**：0
- **oracle**：`ORA-T18 {"pass": "FakeClock 判死终态可达 + managed 端到端 terminal + 回收路径已验证"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t18-crossrepo-tests.log
- **STOP**：T27 答复为 rejected/no-response 时跳过本对（不 STOP 本仓），C4 批继续本仓任务并登记跨仓 AC 为 unknown
- **recovery**：skip-and-mark-unknown：跳过本对，$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md 登记分支，批完成条件按 unknown 出口核算
- **task risk**：跨仓侧拒绝（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-008
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T30

- **ID**：T30
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：stalled 消费侧三处接受 + review_origin 五态落地
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-007, FR-C4-009, FR-C4-010
- **AC**：AC-C4-006, AC-C4-013, AC-C4-024
- **动作**：RED：先运行 frozen predecessor precheck，精确断言 `REVIEW_ORIGINS` 等于 conducted/unavailable/not_run/same_source_degraded/dispatched_uncollected 且退出 0；再单独运行新 `stalled-consumer-delta` 聚焦用例，当前只因 attempt schema / downstream status 的 stalled delta 缺失而失败。precheck 与 RED delta 分开记录。
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs`；`skills/wh-review/scripts/review-result.mjs`；`runtime/review/schemas/attempt.schema.json`；`runtime/task/task-store.mjs`；`tests/contract/stalled-consumer-delta.test.mjs`
- **boundary**：files：skills/wh-review/scripts/review-provider-client.mjs；skills/wh-review/scripts/review-result.mjs；runtime/review/schemas/attempt.schema.json；runtime/task/task-store.mjs
- **输出**：三处源码比对；5 值 node -e 断言
- **Knowledge**：公开 envelope 仍 4 值；OPEN-002 定案
- **verification_role**：RED
- **paired_task**：T31
- **gate_cmd**：`bash -c 'node --input-type=module -e "import {REVIEW_ORIGINS} from \"./runtime/task/task-store.mjs\";const want=[\"conducted\",\"unavailable\",\"not_run\",\"same_source_degraded\",\"dispatched_uncollected\"];if(JSON.stringify(REVIEW_ORIGINS)!==JSON.stringify(want))process.exit(1)" && ./node_modules/.bin/vitest run tests/contract/stalled-consumer-delta.test.mjs --poolOptions.forks.singleFork --no-fileParallelism'`
- **expected_exit**：1
- **oracle**：`ORA-T19 {"pass":"predecessor 5-origin exact contract exits 0, then focused stalled downstream/schema/status delta passes","reject":{"input":"predecessor drift or missing stalled delta","expected_rejection":"precheck fails independently or focused delta test fails","observation":"separate precheck and delta logs"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t19-stalled-origin.log
- **STOP**：缺 stalled 或无名
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：低
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-007
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T31

- **ID**：T31
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：stalled 消费侧三处接受 + review_origin 五态落地
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T30
- **并行**：无
- **FR**：FR-C4-007, FR-C4-009, FR-C4-010
- **AC**：AC-C4-006, AC-C4-013, AC-C4-024
- **动作**：GREEN：先运行同一 frozen 5-origin predecessor precheck 且退出 0；再运行与 T30 相同的新 `stalled-consumer-delta` 用例，证明 provider/result/schema 三处接受 stalled、downstream status 映射正确，且既有 5-origin 合同未变。
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs`；`skills/wh-review/scripts/review-result.mjs`；`runtime/review/schemas/attempt.schema.json`；`runtime/task/task-store.mjs`；`tests/contract/stalled-consumer-delta.test.mjs`
- **boundary**：files：skills/wh-review/scripts/review-provider-client.mjs；skills/wh-review/scripts/review-result.mjs；runtime/review/schemas/attempt.schema.json；runtime/task/task-store.mjs
- **输出**：三处源码比对；5 值 node -e 断言
- **Knowledge**：公开 envelope 仍 4 值；OPEN-002 定案
- **verification_role**：GREEN
- **paired_task**：T30
- **gate_cmd**：`bash -c 'node --input-type=module -e "import {REVIEW_ORIGINS} from \"./runtime/task/task-store.mjs\";const want=[\"conducted\",\"unavailable\",\"not_run\",\"same_source_degraded\",\"dispatched_uncollected\"];if(JSON.stringify(REVIEW_ORIGINS)!==JSON.stringify(want))process.exit(1)" && ./node_modules/.bin/vitest run tests/contract/stalled-consumer-delta.test.mjs --poolOptions.forks.singleFork --no-fileParallelism'`
- **expected_exit**：0
- **oracle**：`ORA-T19 {"pass":"predecessor 5-origin exact contract exits 0, then focused stalled downstream/schema/status delta passes"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t19-stalled-origin.log
- **STOP**：缺 stalled 或无名
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：低
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-007
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T32

- **ID**：T32
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：允许名单收敛为一套
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-013
- **AC**：AC-C4-022
- **动作**：RED：./node_modules/.bin/vitest run review-materials-contract 负例（今失败：四套名单/报错不列值）
- **精确文件**：`runtime/review/stage-materials.json`；`skills/wh-review/scripts/review-materials.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`tests/contract/review-materials-contract.test.mjs`
- **boundary**：files：runtime/review/stage-materials.json；skills/wh-review/scripts/review-materials.mjs；skills/wh-review/scripts/simple-review-runner.mjs；tests/contract/review-materials-contract.test.mjs
- **输出**：负例测试记录；名单唯一性 grep
- **Knowledge**：报错必须列合法取值全列表
- **verification_role**：RED
- **paired_task**：T33
- **gate_cmd**：./node_modules/.bin/vitest run tests/contract/review-materials-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：1
- **oracle**：`ORA-T20 {"pass": "四套旧名单负例全部报错且枚举合法值", "reject": {"input": "第二份强制名单或报错不列值", "expected_rejection": "旧键名被放行", "observation": "唯一名单 + 枚举齐全"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t20-allowlist.log
- **STOP**：名单不一致复现误杀
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：误杀（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-013
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T33

- **ID**：T33
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：允许名单收敛为一套
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T32
- **并行**：无
- **FR**：FR-C4-013
- **AC**：AC-C4-022
- **动作**：GREEN：以 stage-materials.json stages.tracks 为唯一强制名单；其余三套删除或改引用；MATERIAL_FORBIDDEN 枚举全部合法值；四个旧键名负例断言
- **精确文件**：`runtime/review/stage-materials.json`；`skills/wh-review/scripts/review-materials.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`tests/contract/review-materials-contract.test.mjs`
- **boundary**：files：runtime/review/stage-materials.json；skills/wh-review/scripts/review-materials.mjs；skills/wh-review/scripts/simple-review-runner.mjs；tests/contract/review-materials-contract.test.mjs
- **输出**：负例测试记录；名单唯一性 grep
- **Knowledge**：报错必须列合法取值全列表
- **verification_role**：GREEN
- **paired_task**：T32
- **gate_cmd**：./node_modules/.bin/vitest run tests/contract/review-materials-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：0
- **oracle**：`ORA-T20 {"pass": "四套旧名单负例全部报错且枚举合法值"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t20-allowlist.log
- **STOP**：名单不一致复现误杀
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：误杀（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-013
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T34

- **ID**：T34
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：Phase review 复用判据 + verify 执行端读 review_result_ref + 方向审查 OI 绑定
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-015, FR-C4-016, FR-C4-017, FR-C4-018
- **AC**：AC-C4-015, AC-C4-018
- **动作**：RED：./node_modules/.bin/vitest run verify-code-facts 等（今失败：verify 端读不到 ref、结论不分区）
- **精确文件**：`runtime/stage/stage-handlers.mjs`；`runtime/review/review-record-route.mjs`；`tests/verify-code-facts.test.mjs`；`tests/contract/verify-architect-acceptance.test.mjs`；`tests/contract/build-prd-review-contract.test.mjs`
- **boundary**：files：runtime/stage/stage-handlers.mjs；runtime/review/review-record-route.mjs；tests/verify-code-facts.test.mjs；tests/contract/verify-architect-acceptance.test.mjs；tests/contract/build-prd-review-contract.test.mjs
- **输出**：读 ref 测试；分区结论断言；方向审查输入断言
- **Knowledge**：R-015③④ 裁定 I-4；I-4b verify 不调 wh-review；lens 不删改
- **verification_role**：RED
- **paired_task**：T35
- **gate_cmd**：./node_modules/.bin/vitest run tests/verify-code-facts.test.mjs tests/contract/verify-architect-acceptance.test.mjs tests/contract/build-prd-review-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：1
- **oracle**：`ORA-T21 {"pass": "verify 读 ref=0 且结论分区且方向审查输入含 decision_revision+OI", "reject": {"input": "verify 重审同批 finding 或 lens 被改", "expected_rejection": "读不到 ref 或 problem_order 被改写", "observation": "ref 可读 + 分区 + OI 绑定"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t21-verify-ref.log
- **STOP**：跨阶段复用误删 verify 自审
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：误删 verify 自审（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-015
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T35

- **ID**：T35
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：Phase review 复用判据 + verify 执行端读 review_result_ref + 方向审查 OI 绑定
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T34
- **并行**：无
- **FR**：FR-C4-015, FR-C4-016, FR-C4-017, FR-C4-018
- **AC**：AC-C4-015, AC-C4-018
- **动作**：GREEN：复用判据=具名输入逐项相同；verify 执行端读 Phase review 的 review_result_ref（K5 既有结果）并分区结论；方向审查输入绑定 decision_revision + OI 逐条 ref/sha256；outline_closed 如实登记
- **精确文件**：`runtime/stage/stage-handlers.mjs`；`runtime/review/review-record-route.mjs`；`tests/verify-code-facts.test.mjs`；`tests/contract/verify-architect-acceptance.test.mjs`；`tests/contract/build-prd-review-contract.test.mjs`
- **boundary**：files：runtime/stage/stage-handlers.mjs；runtime/review/review-record-route.mjs；tests/verify-code-facts.test.mjs；tests/contract/verify-architect-acceptance.test.mjs；tests/contract/build-prd-review-contract.test.mjs
- **输出**：读 ref 测试；分区结论断言；方向审查输入断言
- **Knowledge**：R-015③④ 裁定 I-4；I-4b verify 不调 wh-review；lens 不删改
- **verification_role**：GREEN
- **paired_task**：T34
- **gate_cmd**：./node_modules/.bin/vitest run tests/verify-code-facts.test.mjs tests/contract/verify-architect-acceptance.test.mjs tests/contract/build-prd-review-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：0
- **oracle**：`ORA-T21 {"pass": "verify 读 ref=0 且结论分区且方向审查输入含 decision_revision+OI"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t21-verify-ref.log
- **STOP**：跨阶段复用误删 verify 自审
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：误删 verify 自审（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-015
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T36

- **ID**：T36
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：T-11 请求身份协议版本 + 通道实跑
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-020
- **AC**：AC-C4-021
- **动作**：RED：协议版本字段存在性断言（今失败：managedRequestId 输入无协议版本）
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **boundary**：files：skills/wh-review/scripts/simple-review-runner.mjs
- **输出**：重跑无冲突记录；退出码证据
- **Knowledge**：D-023 通道验证口径；OI-13
- **verification_role**：RED
- **paired_task**：T37
- **gate_cmd**：node -e "const s=require('fs').readFileSync('skills/wh-review/scripts/simple-review-runner.mjs','utf8');if(!/protocol.?version/i.test(s))process.exit(1);console.log('t11-version-ok')"
- **expected_exit**：1
- **oracle**：`ORA-T22 {"pass": "同材料重跑零 REQUEST_ID_CONFLICT 且实跑退出码已记录", "reject": {"input": "改协议后重跑撞 REQUEST_ID_CONFLICT", "expected_rejection": "冲突复现", "observation": "24h TTL 内可重跑"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t22-t11-channel-run.txt
- **STOP**：仍撞冲突或实跑被计成审查轮次
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：协议冲突阻塞派发（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-020
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T37

- **ID**：T37
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：T-11 请求身份协议版本 + 通道实跑
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T36
- **并行**：无
- **FR**：FR-C4-020
- **AC**：AC-C4-021
- **动作**：GREEN：managedRequestId stableValue 输入本地加协议版本（不动 managedPublic exactKeys）；实跑一次定性=通道验证（只记退出码、不进 sink、不计轮次）
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **boundary**：files：skills/wh-review/scripts/simple-review-runner.mjs
- **输出**：重跑无冲突记录；退出码证据
- **Knowledge**：D-023 通道验证口径；OI-13
- **verification_role**：GREEN
- **paired_task**：T36
- **gate_cmd**：node -e "const s=require('fs').readFileSync('skills/wh-review/scripts/simple-review-runner.mjs','utf8');if(!/protocol.?version/i.test(s))process.exit(1);console.log('t11-version-ok')"
- **expected_exit**：0
- **oracle**：`ORA-T22 {"pass": "同材料重跑零 REQUEST_ID_CONFLICT 且实跑退出码已记录"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t22-t11-channel-run.txt
- **STOP**：仍撞冲突或实跑被计成审查轮次
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：协议冲突阻塞派发（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-020
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T38

- **ID**：T38
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：通道修复 fixtures 可证伪（三组+两组对照）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-012
- **AC**：AC-C4-016, AC-C4-025
- **动作**：RED：./node_modules/.bin/vitest run fixtures 五组（今失败：单侧/双侧/空包丢 findings 或未区分五态）
- **精确文件**：`tests/review/review-managed-lifecycle.test.mjs`；`skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/reviews/results/`（OPN-2 收取件）
- **boundary**：files：tests/review/review-managed-lifecycle.test.mjs；`skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`
- **输出**：fixtures 测试全绿记录
- **Knowledge**：FR-C4-012 必须修（两次实测复现 20/41 丢弃）
- **verification_role**：RED
- **paired_task**：T39
- **gate_cmd**：`./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-T23 {"pass": "五组 fixtures 全过且 findings 可回读且 OPN-2 收取件可读", "reject": {"input": "available-with-failures 被丢包", "expected_rejection": "exit 1 且 sink 无结果", "observation": "findings 回读 + 不降级"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t23-channel-fixtures.log
- **STOP**：丢包复现
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：丢包复现（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-012
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T39

- **ID**：T39
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：通道修复 fixtures 可证伪（三组+两组对照）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T38
- **并行**：无
- **FR**：FR-C4-012
- **AC**：AC-C4-016, AC-C4-025
- **动作**：GREEN：三组 fixture + 两组五态对照；断言不抛错、findings 从 sink/ref 读回、失败角色正确标记、不重复派发、正常 partial 不降级；补一次落 sink 收取（方向 20 + 细节 41 原始证据，保持 unavailable 身份，不作 conducted 使用）→ 关闭 OPN-2
- **精确文件**：`tests/review/review-managed-lifecycle.test.mjs`；`skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/reviews/results/`（OPN-2 收取件）
- **boundary**：files：tests/review/review-managed-lifecycle.test.mjs；`skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`
- **输出**：fixtures 测试全绿记录
- **Knowledge**：FR-C4-012 必须修（两次实测复现 20/41 丢弃）
- **verification_role**：GREEN
- **paired_task**：T38
- **gate_cmd**：`./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-T23 {"pass": "五组 fixtures 全过且 findings 可回读且 OPN-2 收取件可读"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t23-channel-fixtures.log
- **STOP**：丢包复现
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：丢包复现（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-012
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T40

- **ID**：T40
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：C4 批全绿 + 守卫例外命令（批停止条件）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C4-001, FR-C4-002, FR-C4-003, FR-C4-004, FR-C4-005, FR-C4-006, FR-C4-007, FR-C4-008, FR-C4-009, FR-C4-010, FR-C4-011, FR-C4-012, FR-C4-013, FR-C4-014, FR-C4-015, FR-C4-016, FR-C4-017, FR-C4-018, FR-C4-019, FR-C4-020, FR-C4-021
- **AC**：AC-C4-001, AC-C4-002, AC-C4-003, AC-C4-004, AC-C4-005, AC-C4-006, AC-C4-007, AC-C4-008, AC-C4-009, AC-C4-010, AC-C4-011, AC-C4-012, AC-C4-013, AC-C4-014, AC-C4-015, AC-C4-016, AC-C4-017, AC-C4-018, AC-C4-019, AC-C4-020, AC-C4-021, AC-C4-022, AC-C4-023, AC-C4-024, AC-C4-025, AC-C4-026
- **动作**：RED：C4 批命令矩阵（今失败：预算/去重/lens 改造未完成）
- **精确文件**：`tests/review/review-record-route.test.mjs`；`tests/review/review-policy-compatibility.test.mjs`；`tests/contract/review-materials-contract.test.mjs`；`tests/review/review-managed-lifecycle.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；`skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`；`tests/contract/review-budget-namespace.test.mjs`；`tests/verify-code-facts.test.mjs`；`tests/contract/verify-architect-acceptance.test.mjs`；本任务只消费既有测试，不修改它们的字节
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-batch-boundary.json`；`tests/review/review-record-route.test.mjs`；`tests/review/review-policy-compatibility.test.mjs`；`tests/contract/review-materials-contract.test.mjs`；`tests/review/review-managed-lifecycle.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；`skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`；`tests/contract/review-budget-namespace.test.mjs`；`tests/verify-code-facts.test.mjs`；`tests/contract/verify-architect-acceptance.test.mjs`；`skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`；批内已声明文件严格不可写（READ-ONLY CONSUMER 只读）
- **输出**：exact C4 matrix 结果；accepted 分支跨仓三测试；唯一 approved npm run check raw output；T0 动态 before/after/delta JSON
- **Knowledge**：AGENTS.md 例外条款；禁止其他全量
- **verification_role**：RED
- **paired_task**：T41
- **gate_cmd**：`bash -c './node_modules/.bin/vitest run tests/review/review-record-route.test.mjs tests/review/review-policy-compatibility.test.mjs tests/contract/review-materials-contract.test.mjs tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs tests/contract/review-budget-namespace.test.mjs tests/verify-code-facts.test.mjs tests/contract/verify-architect-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && node -e "const fs=require(\"fs\"),cp=require(\"child_process\");const root=process.env.WORKFLOWHUB_TASK_DIR+\"/workflowhub-mechanism-simplification-t2-20260911/quality/tests/\",c=fs.readFileSync(root+\"t17-crossrepo-confirmation.md\",\"utf8\");if(/\\\"decision\\\"\\s*:\\s*\\\"accepted\\\"/.test(c)){const r=cp.spawnSync(\"node\",[\"--test\",\"test/health-runner.test.mjs\",\"test/managed-session-lifecycle.test.mjs\",\"test/provider-failure.test.mjs\"],{cwd:\"/Users/Hugh/Hugh/Project/3rd-review\",stdio:\"inherit\"});if(r.status!==0)process.exit(1)}" && node -e "const fs=require(\"fs\"),cp=require(\"child_process\");const root=process.env.WORKFLOWHUB_TASK_DIR+\"/workflowhub-mechanism-simplification-t2-20260911/quality/tests/\",b=JSON.parse(fs.readFileSync(root+\"t0-current-baseline.json\",\"utf8\")),r=cp.spawnSync(\"npm\",[\"run\",\"check\"],{encoding:\"utf8\"}),out=(r.stdout||\"\")+(r.stderr||\"\"),n=(re)=>Number((out.match(re)||[])[1]||0),a={reason:\"PRD C4 card 3 approved exception: validate deleted check-chain budget consumer; no other broad test\",exit_code:r.status,raw:out,markdownlint:{errors:n(/(\\d+) error/)},record_paths:{failures:n(/FAIL:\\s*(\\d+)/)},structure:{failures:n(/FAIL:\\s*(\\d+)/)}};fs.writeFileSync(root+\"p2-c4-check.json\",JSON.stringify(a,null,2)+\"\\n\");if(r.status!==0)process.exit(1);for(const k of [\"markdownlint\",\"record_paths\",\"structure\"]){const before=b[k].errors??b[k].failures,after=a[k].errors??a[k].failures;if(!Number.isInteger(before)||!Number.isInteger(after)||after>before)process.exit(1)}"'`
- **expected_exit**：1
- **oracle**：`ORA-T24 {"pass":"exact declared C4 matrix passes; accepted crossrepo branch passes three tests; one approved npm run check executes and parsed counts are <= T0 artifact","reject":{"input":"missing matrix member, crossrepo failure, check nonzero or dynamic count regression","expected_rejection":"same gate fails","observation":"matrix log and p2-c4-check before/after/delta"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-c4-batch-green.log
- **STOP**：预算删除误伤守卫链
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：误伤守卫链（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T41

- **ID**：T41
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：C4 批全绿 + 守卫例外命令（批停止条件）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T40
- **并行**：无
- **FR**：FR-C4-001, FR-C4-002, FR-C4-003, FR-C4-004, FR-C4-005, FR-C4-006, FR-C4-007, FR-C4-008, FR-C4-009, FR-C4-010, FR-C4-011, FR-C4-012, FR-C4-013, FR-C4-014, FR-C4-015, FR-C4-016, FR-C4-017, FR-C4-018, FR-C4-019, FR-C4-020, FR-C4-021
- **AC**：AC-C4-001, AC-C4-002, AC-C4-003, AC-C4-004, AC-C4-005, AC-C4-006, AC-C4-007, AC-C4-008, AC-C4-009, AC-C4-010, AC-C4-011, AC-C4-012, AC-C4-013, AC-C4-014, AC-C4-015, AC-C4-016, AC-C4-017, AC-C4-018, AC-C4-019, AC-C4-020, AC-C4-021, AC-C4-022, AC-C4-023, AC-C4-024, AC-C4-025, AC-C4-026
- **动作**：GREEN：跑 C4 §17 命令矩阵；按 PRD C4-AC-3 例外跑一次 npm run check（证据写明理由=删 check 链上的东西、范围=三条守卫输出比对）；守卫基线不劣化
- **精确文件**：`tests/review/review-record-route.test.mjs`；`tests/review/review-policy-compatibility.test.mjs`；`tests/contract/review-materials-contract.test.mjs`；`tests/review/review-managed-lifecycle.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；`skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`；`tests/contract/review-budget-namespace.test.mjs`；`tests/verify-code-facts.test.mjs`；`tests/contract/verify-architect-acceptance.test.mjs`；本任务只消费既有测试，不修改它们的字节
- **boundary**：files：`tests/review/review-record-route.test.mjs`；`tests/review/review-policy-compatibility.test.mjs`；`tests/contract/review-materials-contract.test.mjs`；`tests/review/review-managed-lifecycle.test.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；`skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`；`tests/contract/review-budget-namespace.test.mjs`；`tests/verify-code-facts.test.mjs`；`tests/contract/verify-architect-acceptance.test.mjs`；跨仓三测试只在 accepted 分支执行，不落本仓写边界
- **输出**：exact C4 matrix 结果；accepted 分支跨仓三测试；唯一 approved npm run check raw output；T0 动态 before/after/delta JSON
- **Knowledge**：AGENTS.md 例外条款；禁止其他全量
- **verification_role**：GREEN
- **paired_task**：T40
- **gate_cmd**：`bash -c './node_modules/.bin/vitest run tests/review/review-record-route.test.mjs tests/review/review-policy-compatibility.test.mjs tests/contract/review-materials-contract.test.mjs tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs tests/contract/review-budget-namespace.test.mjs tests/verify-code-facts.test.mjs tests/contract/verify-architect-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && node -e "const fs=require(\"fs\"),cp=require(\"child_process\");const root=process.env.WORKFLOWHUB_TASK_DIR+\"/workflowhub-mechanism-simplification-t2-20260911/quality/tests/\",c=fs.readFileSync(root+\"t17-crossrepo-confirmation.md\",\"utf8\");if(/\\\"decision\\\"\\s*:\\s*\\\"accepted\\\"/.test(c)){const r=cp.spawnSync(\"node\",[\"--test\",\"test/health-runner.test.mjs\",\"test/managed-session-lifecycle.test.mjs\",\"test/provider-failure.test.mjs\"],{cwd:\"/Users/Hugh/Hugh/Project/3rd-review\",stdio:\"inherit\"});if(r.status!==0)process.exit(1)}" && node -e "const fs=require(\"fs\"),cp=require(\"child_process\");const root=process.env.WORKFLOWHUB_TASK_DIR+\"/workflowhub-mechanism-simplification-t2-20260911/quality/tests/\",b=JSON.parse(fs.readFileSync(root+\"t0-current-baseline.json\",\"utf8\")),r=cp.spawnSync(\"npm\",[\"run\",\"check\"],{encoding:\"utf8\"}),out=(r.stdout||\"\")+(r.stderr||\"\"),n=(re)=>Number((out.match(re)||[])[1]||0),a={reason:\"PRD C4 card 3 approved exception: validate deleted check-chain budget consumer; no other broad test\",exit_code:r.status,raw:out,markdownlint:{errors:n(/(\\d+) error/)},record_paths:{failures:n(/FAIL:\\s*(\\d+)/)},structure:{failures:n(/FAIL:\\s*(\\d+)/)}};fs.writeFileSync(root+\"p2-c4-check.json\",JSON.stringify(a,null,2)+\"\\n\");if(r.status!==0)process.exit(1);for(const k of [\"markdownlint\",\"record_paths\",\"structure\"]){const before=b[k].errors??b[k].failures,after=a[k].errors??a[k].failures;if(!Number.isInteger(before)||!Number.isInteger(after)||after>before)process.exit(1)}"'`
- **expected_exit**：0
- **oracle**：`ORA-T24 {"pass":"exact declared C4 matrix passes; accepted crossrepo branch passes three tests; one approved npm run check executes and parsed counts are <= T0 artifact"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-c4-batch-green.log
- **STOP**：预算删除误伤守卫链
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：误伤守卫链（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C4-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T42

- **ID**：T42
- **Phase**：Phase 2 · C4 审查生命周期
- **goal**：C4 批合入与跨仓结算登记
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行
- **并行**：无
- **FR**：N/A
- **AC**：N/A
- **动作**：C4 批 commit；在对应 p2-batch-boundary.json 持久化每仓 repo_root/branch/BATCH_BASE/BATCH_HEAD full OID；跨仓判死自证结果登记（通过/unknown）；被拒登记本仓消费侧完成事实
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-c4-handoff.md`
- **boundary**：files：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-c4-handoff.md
- **输出**：commit 链；跨仓结算登记
- **Knowledge**：合并序 C4 在 C5/C6 前；R4-Q3 出口
- **verification_role**：N/A — 非行为变更：流程/评估/确认/移交记录
- **paired_task**：N/A — 非行为变更：验证由同批 GREEN 任务承担
- **gate_cmd**：`node -e "const cp=require('child_process'),fs=require('fs');const phase='2',root=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/',e=JSON.parse(fs.readFileSync(root+'p2-batch-boundary.json','utf8')),text=fs.readFileSync('specs/workflowhub-mechanism-simplification-t2-20260911/tasks.md','utf8'),head='## Phase '+phase+' ',start=text.indexOf(head),tail=text.slice(start),stop=tail.indexOf('### Files'),section=tail.slice(stop+10,tail.indexOf('### Tasks'));if(start<0||stop<0||!Array.isArray(e.repositories))process.exit(1);const rows=section.split(String.fromCharCode(10)).filter(x=>x.startsWith('- **')).map(x=>[x.slice(7,x.indexOf('**',7)),x.slice(x.lastIndexOf(String.fromCharCode(96))+1)]),readonly=new Set(rows.filter(x=>x[0].trim()==='READ-ONLY CONSUMER').map(x=>x[1])),writable=new Set(rows.filter(x=>x[0].trim()!=='READ-ONLY CONSUMER').map(x=>x[1]).filter(x=>!x.startsWith('$WORKFLOWHUB_TASK_DIR'))),keys=['repo_root','branch','BATCH_BASE','BATCH_HEAD'];for(const r of e.repositories){for(const k of keys)if(!r[k])process.exit(1);if(cp.execFileSync('git',['merge-base','--is-ancestor',r.BATCH_BASE,r.BATCH_HEAD],{cwd:r.repo_root,stdio:'pipe'}).length)process.exit(1);const changed=cp.spawnSync('git',['diff','--name-only',r.BATCH_BASE+'..'+r.BATCH_HEAD],{cwd:r.repo_root,encoding:'utf8'}).stdout.trim().split(String.fromCharCode(10)).filter(Boolean),bad=changed.filter(x=>readonly.has(x)||!writable.has(x));if(bad.length)process.exit(1)}"`
- **expected_exit**：0
- **oracle**：`ORA-T25 {"pass": "从 p2 persisted OIDs 对 workflowhub 与 accepted 3rd-review 独立验 ancestry/diff/Phase Files allowlist，跨仓结算已登记"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-c4-handoff.md
- **STOP**：登记缺失
- **recovery**：补记录后重做
- **task risk**：低

## Phase 3 · C5 记录失效链

### Goal

按 OI-26 保留 K2/K5 身份与 immutable proof binding，只删除 freshness/currentness invalidation/rerun use sites；材料编辑不失效不重跑；收口 former validator output consumer；完成 write-boundary/path-card/声明/CONTEXT delta。

### Files

- **MODIFY** `CONTEXT.md`
- **MODIFY** `core/__tests__/check-extensibility.test.mjs`
- **MODIFY** `core/__tests__/check-skill-closure.test.mjs`
- **MODIFY** `core/__tests__/invocation-identity.test.mjs`
- **MODIFY** `runtime/evidence/canonical-receipt-writer.mjs`
- **MODIFY** `runtime/evidence/check-skill-closure.mjs`
- **MODIFY** `runtime/evidence/freshness.mjs`
- **MODIFY** `runtime/evidence/write-boundary-preflight.mjs`
- **MODIFY** `runtime/review/review-record-route.mjs`
- **MODIFY** `runtime/schemas/stage-skill-deps.schema.json`
- **MODIFY** `runtime/stage/completion-predicates.mjs`
- **MODIFY** `runtime/stage/stage-agent-outcome-adapter.mjs`
- **MODIFY** `runtime/stage/stage-handlers.mjs`
- **MODIFY** `runtime/stage/stage-runner.mjs`
- **MODIFY** `runtime/task/task-handle.mjs`
- **MODIFY** `runtime/task/task-kernel-implementation.mjs`
- **MODIFY** `runtime/task/task-store.mjs`
- **MODIFY** `skills/wh-review/scripts/wh-review-cli.mjs`
- **MODIFY** `tests/close/freshness-consistency.test.mjs`
- **MODIFY** `tests/contract/final-current-snapshot.test.mjs`
- **MODIFY** `tests/contract/per-ac-material-freshness.test.mjs`
- **MODIFY** `tests/integration/stage-row-publication.test.mjs`
- **MODIFY** `tests/integration/stage-row-verify-code.test.mjs`
- **MODIFY** `tests/left-shift/left-shift-suite.test.mjs`
- **MODIFY** `tools/cli/produce-final-current-snapshot.mjs`
- **MODIFY** `tools/cli/task-close.mjs`
- **MODIFY** `workflows/build-code/skill-deps.yaml`
- **MODIFY** `workflows/build-plan/skill-deps.yaml`
- **MODIFY** `workflows/build-prd/skill-deps.yaml`
- **MODIFY** `workflows/build-spec/skill-deps.yaml`
- **MODIFY** `workflows/make-decision/skill-deps.yaml`
- **MODIFY** `workflows/verify-code/skill-deps.yaml`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-c5-handoff.md`
- **NEW** `tests/contract/freshness-removal-preservation.test.mjs`

### Tasks

T43-T53（见 tasks.md Phase 3）

### Verify

K2/K5 positive preservation + material-edit no-invalidation/no-rerun + freshness symbol/use-site closure + former-output consumer closure + write-boundary/check-skill-closure targeted tests。

### Knowledge

C4 已改完 review-materials/review-record-route；C3（任务Ⅰ）已改完 task-handle 是本批动 task-handle 的前置；C5 先于 C6 改 stage-runtime/completion-predicates。

### STOP

A/K5 正向 round-trip/readback 失败；材料编辑仍使事实失效或 runner invocation delta >0；named B/D use-site 仍可达；动了 core/task-close.mjs planning 分支；四类口径缺一类；check-extensibility 判据被换。

### Done

K2/K5 positive preservation + named B/D freshness use-site behavioral closure + 字节比对新文案拦 + path card 无生产 consumer + 声明面全等 + 五维 dedup/ref readback 分工 + CONTEXT.md 句改写达标。

### Risks and rollback

误删身份/完整性面（OI-26 A 类）→ 四类口径 grep 拦截；字节比对弱化 → AC-C5-005 负例复跑；回滚 = revert 本批。

### Task Blocks（执行序列）

本 Phase 任务块（RED/GREEN 成对，T 号顺序执行）：

#### T43

- **ID**：T43
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：OI-26 A/K5 保留 + B/D freshness use-site 删除（四类行为口径）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C5-001
- **AC**：AC-C5-001, AC-C5-002
- **动作**：RED：新聚焦行为用例先正向写/读 stage 与 close-action K2 完整字段及 K5 ref/hash/binding，再编辑材料并断言事实仍 valid、runner invocation delta=0；同时以模块 import/export 图断言 named B/D freshness use-sites 不可达、former-output consumer absent。当前只因 B/D 行为仍可达而红，A/K5 保留必须先绿。
- **精确文件**：`runtime/evidence/freshness.mjs`；`runtime/stage/completion-predicates.mjs`；`runtime/stage/stage-runner.mjs`；`runtime/review/review-record-route.mjs`；`runtime/stage/stage-agent-outcome-adapter.mjs`；`runtime/task/task-kernel-implementation.mjs`；`runtime/evidence/canonical-receipt-writer.mjs`；`runtime/stage/stage-handlers.mjs`；`runtime/task/task-store.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/integration/stage-row-verify-code.test.mjs`；`tests/contract/per-ac-material-freshness.test.mjs`；`tools/cli/produce-final-current-snapshot.mjs`；`tests/contract/final-current-snapshot.test.mjs`
- **boundary**：files：`tests/contract/freshness-removal-preservation.test.mjs`；批内已声明文件严格不可写（READ-ONLY CONSUMER 只读）
- **输出**：聚焦行为记录：stage/close-action K2 全字段 round-trip、K5 ref/hash/binding 不变、材料编辑后 readback 仍 valid 且 runner invocation delta=0；named B/D use-site import/export closure；former-output consumer absent
- **Knowledge**：A 类与 K5 必须保留；仅 B/D 删除；不得总数或全局字面 0 代替分类；`snapshot_tree` 字面存在不是失败
- **verification_role**：RED
- **paired_task**：T44
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freshness-removal-preservation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-T26 {"pass":"K2/K5 bindings preserved; material edit keeps valid fact and starts zero reruns; freshness comparison symbols/use-sites unreachable; deleted validator and former-output consumer absent","reject":{"input":"material edit invalidates/re-runs or A/K5 binding is removed","expected_rejection":"behavioral assertion fails","observation":"positive preservation plus negative use-site closure"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t26-freshness-preservation.json
- **STOP**：误删 A 类身份面
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：误删身份面（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C5-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T44

- **ID**：T44
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：OI-26 A/K5 保留 + B/D freshness use-site 删除（四类行为口径）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T43
- **并行**：无
- **FR**：FR-C5-001
- **AC**：AC-C5-001, AC-C5-002
- **动作**：GREEN：同一聚焦行为用例证明 K2 `record_kind`/`material_digest`/`snapshot_tree` 与 K5 immutable binding 逐字保留；材料普通编辑后事实仍 valid 且 runner invocation delta=0；named B/D freshness functions/imports/callers 不可达，C 类测试变体不决定 status；retired validator/former-output consumer 均 absent。
- **精确文件**：`runtime/evidence/freshness.mjs`；`runtime/stage/completion-predicates.mjs`；`runtime/stage/stage-runner.mjs`；`runtime/review/review-record-route.mjs`；`runtime/stage/stage-agent-outcome-adapter.mjs`；`runtime/task/task-kernel-implementation.mjs`；`runtime/evidence/canonical-receipt-writer.mjs`；`runtime/stage/stage-handlers.mjs`；`runtime/task/task-store.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/integration/stage-row-verify-code.test.mjs`；`tests/contract/per-ac-material-freshness.test.mjs`；`tools/cli/produce-final-current-snapshot.mjs`；`tests/contract/final-current-snapshot.test.mjs`
- **boundary**：files：runtime/evidence/freshness.mjs；runtime/stage/completion-predicates.mjs；runtime/stage/stage-runner.mjs；runtime/review/review-record-route.mjs；runtime/stage/stage-agent-outcome-adapter.mjs；runtime/task/task-kernel-implementation.mjs；runtime/evidence/canonical-receipt-writer.mjs；runtime/stage/stage-handlers.mjs
- **输出**：聚焦行为记录：stage/close-action K2 全字段 round-trip、K5 ref/hash/binding 不变、材料编辑后 readback 仍 valid 且 runner invocation delta=0；named B/D use-site import/export closure；former-output consumer absent
- **Knowledge**：A 类与 K5 必须保留；仅 B/D 删除；不得总数或全局字面 0 代替分类；`snapshot_tree` 字面存在不是失败
- **verification_role**：GREEN
- **paired_task**：T43
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freshness-removal-preservation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-T26 {"pass":"K2/K5 bindings preserved; material edit keeps valid fact and starts zero reruns; freshness comparison symbols/use-sites absent; deleted validator/former-output consumer absent"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t26-freshness-preservation.json
- **STOP**：误删 A 类身份面
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：误删身份面（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C5-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T45

- **ID**：T45
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：写口三项核对 + 字节比对 + path card 整类删除
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C5-002, FR-C5-003
- **AC**：AC-C5-004, AC-C5-005, AC-C5-009
- **动作**：RED：./node_modules/.bin/vitest run invocation-identity + left-shift 三负例（今失败：path card 流程与多项核对仍在）
- **精确文件**：`runtime/evidence/write-boundary-preflight.mjs`；`runtime/task/task-handle.mjs`；`tools/cli/task-close.mjs`；`core/__tests__/invocation-identity.test.mjs`；`tests/left-shift/left-shift-suite.test.mjs`
- **boundary**：files：runtime/evidence/write-boundary-preflight.mjs；runtime/task/task-handle.mjs；tools/cli/task-close.mjs；`core/__tests__/invocation-identity.test.mjs`；tests/left-shift/left-shift-suite.test.mjs
- **输出**：三负例全绿；path card 零命中 grep
- **Knowledge**：D-019/J-3/§16.21#10；不弱化字节比对
- **verification_role**：RED
- **paired_task**：T46
- **gate_cmd**：`./node_modules/.bin/vitest run core/__tests__/invocation-identity.test.mjs tests/left-shift/left-shift-suite.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-T27 {"pass": "三负例均拦且字节项抛新文案且 path card 零命中", "reject": {"input": "改任一项仍 valid 或旧文案断言", "expected_rejection": "负例不拦", "observation": "三负例 + 新文案 + 零命中"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t27-write-boundary.log
- **STOP**：字节校验被连带弱化
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：弱化字节校验（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C5-002
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T46

- **ID**：T46
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：写口三项核对 + 字节比对 + path card 整类删除
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T45
- **并行**：无
- **FR**：FR-C5-002, FR-C5-003
- **AC**：AC-C5-004, AC-C5-005, AC-C5-009
- **动作**：GREEN：inspectWriteBoundary 收敛 task_id+工作区路径+待写字节；真实写入点内存比对；不符抛 write boundary source bytes mismatch；删 persistWriteBoundaryPathCard/createPathCardRecord/PATH_CARD_WRITERS/identity 写门/task-close.mjs:243 调用点
- **精确文件**：`runtime/evidence/write-boundary-preflight.mjs`；`runtime/task/task-handle.mjs`；`tools/cli/task-close.mjs`；`core/__tests__/invocation-identity.test.mjs`；`tests/left-shift/left-shift-suite.test.mjs`
- **boundary**：files：runtime/evidence/write-boundary-preflight.mjs；runtime/task/task-handle.mjs；tools/cli/task-close.mjs；`core/__tests__/invocation-identity.test.mjs`；tests/left-shift/left-shift-suite.test.mjs
- **输出**：三负例全绿；path card 零命中 grep
- **Knowledge**：D-019/J-3/§16.21#10；不弱化字节比对
- **verification_role**：GREEN
- **paired_task**：T45
- **gate_cmd**：`./node_modules/.bin/vitest run core/__tests__/invocation-identity.test.mjs tests/left-shift/left-shift-suite.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-T27 {"pass": "三负例均拦且字节项抛新文案且 path card 零命中"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t27-write-boundary.log
- **STOP**：字节校验被连带弱化
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：弱化字节校验（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C5-002
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T47

- **ID**：T47
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：声明面同步 + 五维 dedup identity 与 review_result_ref readback 分工
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C5-004, FR-C5-005, FR-C5-007
- **AC**：AC-C5-002, AC-C5-003
- **动作**：RED：运行同一聚焦合同：声明 identity 全等校验；构造两条只差五维之一的 review 证明不复用，五维完全相同才复用；匹配后按 `review_result_ref` 回读原结果。当前因旧材料哈希 identity / 声明面而失败；不得要求 A/K5 identity 字段为零。
- **精确文件**：`runtime/evidence/check-skill-closure.mjs`；`runtime/schemas/stage-skill-deps.schema.json`；`workflows/make-decision/skill-deps.yaml`；`workflows/build-spec/skill-deps.yaml`；`workflows/build-plan/skill-deps.yaml`；`workflows/build-code/skill-deps.yaml`；`workflows/verify-code/skill-deps.yaml`；`workflows/build-prd/skill-deps.yaml`；`tools/cli/produce-final-current-snapshot.mjs`；`skills/wh-review/scripts/wh-review-cli.mjs`；`runtime/review/review-record-route.mjs`
- **boundary**：files：runtime/evidence/check-skill-closure.mjs；runtime/schemas/stage-skill-deps.schema.json；workflows/make-decision/skill-deps.yaml；workflows/build-spec/skill-deps.yaml；workflows/build-plan/skill-deps.yaml；workflows/build-code/skill-deps.yaml；workflows/verify-code/skill-deps.yaml；workflows/build-prd/skill-deps.yaml；tools/cli/produce-final-current-snapshot.mjs；skills/wh-review/scripts/wh-review-cli.mjs；runtime/review/review-record-route.mjs
- **输出**：声明全等结果；五维 identity 差异矩阵；匹配后的 review_result_ref readback
- **Knowledge**：canonical dedup = 五维 identity；review_result_ref 仅是身份匹配后的 readback/reuse target；A/K5 identity 必须正向保留
- **verification_role**：RED
- **paired_task**：T48
- **gate_cmd**：`bash -c 'node runtime/evidence/check-skill-closure.mjs && ./node_modules/.bin/vitest run tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism -t "five-dimensional identity and review_result_ref readback"'`
- **expected_exit**：1
- **oracle**：`ORA-T28 {"pass":"declaration closure passes; dedup uses exact five-dimensional identity; differing dimension does not reuse; exact match reads existing review_result_ref","reject":{"input":"ref used as key, a dimension ignored, or declaration mismatch","expected_rejection":"focused identity/readback assertion fails","observation":"five-dimension matrix plus ref readback"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t28-skill-deps-zero.txt
- **STOP**：声明面不一致
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：consumer invalid（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C5-004
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T48

- **ID**：T48
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：声明面同步 + 五维 dedup identity 与 review_result_ref readback 分工
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T47
- **并行**：无
- **FR**：FR-C5-004, FR-C5-005, FR-C5-007
- **AC**：AC-C5-002, AC-C5-003
- **动作**：GREEN：PORTABLE_DEPENDENCY_IDENTITY 改身份三项并同步 schema/6 个 skill-deps/build-prd；canonical dedup identity 恰为 `(stage,phase_id,track,review_kind,origin)`，任一维不同不得复用；完全匹配后才按既有 `review_result_ref` 回读。删除材料哈希驱动，不把 ref 变成 key。
- **精确文件**：`runtime/evidence/check-skill-closure.mjs`；`runtime/schemas/stage-skill-deps.schema.json`；`workflows/make-decision/skill-deps.yaml`；`workflows/build-spec/skill-deps.yaml`；`workflows/build-plan/skill-deps.yaml`；`workflows/build-code/skill-deps.yaml`；`workflows/verify-code/skill-deps.yaml`；`workflows/build-prd/skill-deps.yaml`；`tools/cli/produce-final-current-snapshot.mjs`；`skills/wh-review/scripts/wh-review-cli.mjs`；`runtime/review/review-record-route.mjs`
- **boundary**：files：runtime/evidence/check-skill-closure.mjs；runtime/schemas/stage-skill-deps.schema.json；workflows/make-decision/skill-deps.yaml；workflows/build-spec/skill-deps.yaml；workflows/build-plan/skill-deps.yaml；workflows/build-code/skill-deps.yaml；workflows/verify-code/skill-deps.yaml；workflows/build-prd/skill-deps.yaml；tools/cli/produce-final-current-snapshot.mjs；skills/wh-review/scripts/wh-review-cli.mjs；runtime/review/review-record-route.mjs
- **输出**：声明全等结果；五维 identity 差异矩阵；匹配后的 review_result_ref readback
- **Knowledge**：canonical dedup = 五维 identity；review_result_ref 仅是身份匹配后的 readback/reuse target；A/K5 identity 必须正向保留
- **verification_role**：GREEN
- **paired_task**：T47
- **gate_cmd**：`bash -c 'node runtime/evidence/check-skill-closure.mjs && ./node_modules/.bin/vitest run tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism -t "five-dimensional identity and review_result_ref readback"'`
- **expected_exit**：0
- **oracle**：`ORA-T28 {"pass":"declaration closure passes; exact five-dimensional identity controls reuse; existing review_result_ref is read only after match"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t28-skill-deps-zero.txt
- **STOP**：声明面不一致
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：consumer invalid（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C5-004
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T49

- **ID**：T49
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：CONTEXT.md 判据句改写（只改一句）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C5-009
- **AC**：AC-C5-010
- **动作**：RED：CONTEXT.md 判据句概念 grep（今失败：概念仍在）
- **精确文件**：`CONTEXT.md`
- **boundary**：files：CONTEXT.md
- **输出**：CONTEXT.md diff（单行）
- **Knowledge**：D-020；C7 复核（HANDOFF-T2-007）；按 section/semantic contract 定位，禁止固定行号
- **verification_role**：RED
- **paired_task**：T50
- **gate_cmd**：`node -e "const cp=require('child_process'),fs=require('fs');const s=fs.readFileSync('CONTEXT.md','utf8');const section=(s.match(/## 阶段完成判据[^\n]*\n([\s\S]*?)(?=\n## |$)/)||[])[1];if(!section)process.exit(1);const hits=section.split(String.fromCharCode(10)).filter(x=>/task_id/.test(x)&&/facts\.jsonl/.test(x));if(hits.length!==1)process.exit(1);const x=hits[0];if(!/工作区路径/.test(x)||!/待写字节/.test(x)||!/具名 ref/.test(x)||/currentness|材料变化.*失效|material revision/.test(x))process.exit(1);const d=cp.execFileSync('git',['diff','--unified=0','--','CONTEXT.md'],{encoding:'utf8'});const removed=(d.match(/^-(?!-)/gm)||[]).length,added=(d.match(/^\+(?!\+)/gm)||[]).length;if(removed!==1||added!==1)process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-T29 {"pass": "该句无被删概念且含 identity 三项与具名 ref", "reject": {"input": "判据句仍引用被删概念", "expected_rejection": "grep 命中即红", "observation": "改写达标单句"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t29-context-diff.txt
- **STOP**：改了多句或概念残留
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：治理口径漂移（低）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C5-009
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T50

- **ID**：T50
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：CONTEXT.md 判据句改写（只改一句）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T49
- **并行**：无
- **FR**：FR-C5-009
- **AC**：AC-C5-010
- **动作**：GREEN：改写阶段完成判据句为 identity 三项 + facts.jsonl 本阶段行 + 六类具名 ref；只改该一句
- **精确文件**：`CONTEXT.md`
- **boundary**：files：CONTEXT.md
- **输出**：CONTEXT.md diff（单行）
- **Knowledge**：D-020；C7 复核（HANDOFF-T2-007）；按 section/semantic contract 定位，禁止固定行号
- **verification_role**：GREEN
- **paired_task**：T49
- **gate_cmd**：`node -e "const cp=require('child_process'),fs=require('fs');const s=fs.readFileSync('CONTEXT.md','utf8');const section=(s.match(/## 阶段完成判据[^\n]*\n([\s\S]*?)(?=\n## |$)/)||[])[1];if(!section)process.exit(1);const hits=section.split(String.fromCharCode(10)).filter(x=>/task_id/.test(x)&&/facts\.jsonl/.test(x));if(hits.length!==1)process.exit(1);const x=hits[0];if(!/工作区路径/.test(x)||!/待写字节/.test(x)||!/具名 ref/.test(x)||/currentness|材料变化.*失效|material revision/.test(x))process.exit(1);const d=cp.execFileSync('git',['diff','--unified=0','--','CONTEXT.md'],{encoding:'utf8'});const removed=(d.match(/^-(?!-)/gm)||[]).length,added=(d.match(/^\+(?!\+)/gm)||[]).length;if(removed!==1||added!==1)process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T29 {"pass": "该句无被删概念且含 identity 三项与具名 ref"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t29-context-diff.txt
- **STOP**：改了多句或概念残留
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：治理口径漂移（低）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C5-009
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T51

- **ID**：T51
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：C5 批全绿 + 绿灯不失效行为验证（批停止条件）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C5-001, FR-C5-002, FR-C5-003, FR-C5-004, FR-C5-005, FR-C5-006, FR-C5-007, FR-C5-008, FR-C5-009
- **AC**：AC-C5-001, AC-C5-002, AC-C5-003, AC-C5-004, AC-C5-005, AC-C5-006, AC-C5-007, AC-C5-008, AC-C5-009, AC-C5-010
- **动作**：RED：C5 批命令矩阵（今失败：失效链/写口/声明面改造未完成）
- **精确文件**：`core/__tests__/check-skill-closure.test.mjs`；`core/__tests__/check-extensibility.test.mjs`；`tests/close/freshness-consistency.test.mjs`；`tests/contract/per-ac-material-freshness.test.mjs`
- **boundary**：`files：core/__tests__/check-skill-closure.test.mjs`；`core/__tests__/check-extensibility.test.mjs`；tests/close/freshness-consistency.test.mjs；tests/contract/per-ac-material-freshness.test.mjs
- **输出**：批内全绿记录；行为验证记录
- **Knowledge**：C5 不跑 check 全链；守卫基线不劣化
- **verification_role**：RED
- **paired_task**：T52
- **gate_cmd**：`bash -c './node_modules/.bin/vitest run core/__tests__/check-skill-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run core/__tests__/check-extensibility.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run core/__tests__/invocation-identity.test.mjs tests/left-shift/left-shift-suite.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/close/freshness-consistency.test.mjs tests/contract/per-ac-material-freshness.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/integration/execution-snapshot-isolation.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/verify-code-freshness.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/contract/stage-skill-consumer-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && node runtime/evidence/check-skill-closure.mjs'`
- **expected_exit**：1
- **oracle**：`ORA-T30 {"pass": "七条全绿 + closure 0 + 造假负例真失败 + 不失效", "reject": {"input": "失效链残留或守卫恒真", "expected_rejection": "任一红或造假仍 PASS", "observation": "全绿 + 负例真失败 + 不失效"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-c5-batch-green.log
- **STOP**：失效链残留假绿
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：假绿（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C5-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T52

- **ID**：T52
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：C5 批全绿 + 绿灯不失效行为验证（批停止条件）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T51
- **并行**：无
- **FR**：FR-C5-001, FR-C5-002, FR-C5-003, FR-C5-004, FR-C5-005, FR-C5-006, FR-C5-007, FR-C5-008, FR-C5-009
- **AC**：AC-C5-001, AC-C5-002, AC-C5-003, AC-C5-004, AC-C5-005, AC-C5-006, AC-C5-007, AC-C5-008, AC-C5-009, AC-C5-010
- **动作**：GREEN：跑 PRD C5 §17 七条 + closure 单点；check-extensibility 负例可证伪复跑；改一个已审文件字节后读既有事实不失效不重跑的行为验证
- **精确文件**：`core/__tests__/check-skill-closure.test.mjs`；`core/__tests__/check-extensibility.test.mjs`；`tests/close/freshness-consistency.test.mjs`；`tests/contract/per-ac-material-freshness.test.mjs`
- **boundary**：`files：core/__tests__/check-skill-closure.test.mjs`；`core/__tests__/check-extensibility.test.mjs`；tests/close/freshness-consistency.test.mjs；tests/contract/per-ac-material-freshness.test.mjs
- **输出**：批内全绿记录；行为验证记录
- **Knowledge**：C5 不跑 check 全链；守卫基线不劣化
- **verification_role**：GREEN
- **paired_task**：T51
- **gate_cmd**：`bash -c './node_modules/.bin/vitest run core/__tests__/check-skill-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run core/__tests__/check-extensibility.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run core/__tests__/invocation-identity.test.mjs tests/left-shift/left-shift-suite.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/close/freshness-consistency.test.mjs tests/contract/per-ac-material-freshness.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/integration/execution-snapshot-isolation.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/verify-code-freshness.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/contract/stage-skill-consumer-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && node runtime/evidence/check-skill-closure.mjs'`
- **expected_exit**：0
- **oracle**：`ORA-T30 {"pass": "七条全绿 + closure 0 + 造假负例真失败 + 不失效"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-c5-batch-green.log
- **STOP**：失效链残留假绿
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：假绿（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C5-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T53

- **ID**：T53
- **Phase**：Phase 3 · C5 记录失效链
- **goal**：C5 批合入（C5 先合）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行
- **并行**：无
- **FR**：N/A
- **AC**：N/A
- **动作**：C5 批 commit；在对应 p3-batch-boundary.json 持久化每仓 repo_root/branch/BATCH_BASE/BATCH_HEAD full OID；交接记录（C6 注意点）
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-c5-handoff.md`
- **boundary**：files：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-batch-boundary.json`；批内已声明文件严格不可写（READ-ONLY CONSUMER 只读）
- **输出**：commit 链与交接记录
- **Knowledge**：合并序：C5 先于 C6；D-016
- **verification_role**：N/A — 非行为变更：流程/评估/确认/移交记录
- **paired_task**：N/A — 非行为变更：验证由同批 GREEN 任务承担
- **gate_cmd**：`node -e "const cp=require('child_process'),fs=require('fs');const phase='3',root=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/',e=JSON.parse(fs.readFileSync(root+'p3-batch-boundary.json','utf8')),text=fs.readFileSync('specs/workflowhub-mechanism-simplification-t2-20260911/tasks.md','utf8'),head='## Phase '+phase+' ',start=text.indexOf(head),tail=text.slice(start),stop=tail.indexOf('### Files'),section=tail.slice(stop+10,tail.indexOf('### Tasks'));if(start<0||stop<0||!Array.isArray(e.repositories))process.exit(1);const rows=section.split(String.fromCharCode(10)).filter(x=>x.startsWith('- **')).map(x=>[x.slice(7,x.indexOf('**',7)),x.slice(x.lastIndexOf(String.fromCharCode(96))+1)]),readonly=new Set(rows.filter(x=>x[0].trim()==='READ-ONLY CONSUMER').map(x=>x[1])),writable=new Set(rows.filter(x=>x[0].trim()!=='READ-ONLY CONSUMER').map(x=>x[1]).filter(x=>!x.startsWith('$WORKFLOWHUB_TASK_DIR'))),keys=['repo_root','branch','BATCH_BASE','BATCH_HEAD'];for(const r of e.repositories){for(const k of keys)if(!r[k])process.exit(1);if(cp.execFileSync('git',['merge-base','--is-ancestor',r.BATCH_BASE,r.BATCH_HEAD],{cwd:r.repo_root,stdio:'pipe'}).length)process.exit(1);const changed=cp.spawnSync('git',['diff','--name-only',r.BATCH_BASE+'..'+r.BATCH_HEAD],{cwd:r.repo_root,encoding:'utf8'}).stdout.trim().split(String.fromCharCode(10)).filter(Boolean),bad=changed.filter(x=>readonly.has(x)||!writable.has(x));if(bad.length)process.exit(1)}"`
- **expected_exit**：0
- **oracle**：`ORA-T31 {"pass": "从 p3 persisted OIDs 对 workflowhub 独立验 ancestry/diff，changed paths 仅 Phase Files writable 且 READ-ONLY 零改"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-c5-handoff.md
- **STOP**：证据缺失
- **recovery**：补记录后重做
- **task risk**：低

## Phase 4 · C6 收口状态

### Goal

投影连对象收掉、等值判定、入口统一、close 顺序、planning close 承接、current-close-projection 改写、三块底座点名，C6 批 AC 全过。

### Files

- **MODIFY** `AGENTS.md`
- **MODIFY** `CONTEXT.md`
- **MODIFY** `core/load-config.mjs`
- **MODIFY** `core/task-close.mjs`
- **MODIFY** `docs/architecture/control-plane-inventory.json`
- **MODIFY** `docs/architecture/deletion-plan.json`
- **MODIFY** `docs/architecture/move-map.json`
- **MODIFY** `docs/architecture/repository-inventory.tsv`
- **MODIFY** `docs/adr/0017-stage-quality-fact-freshness-scope.md`
- **MODIFY** `docs/adr/0020-close-five-actions-quality-transcription.md`
- **MODIFY** `docs/adr/0029-current-ac-and-close-state.md`
- **MODIFY** `docs/adr/0030-mechanism-simplification-deletion-boundary.md`
- **MODIFY** `docs/standard-workflow.md`
- **MODIFY** `runtime/distribution/runner-release.mjs`
- **MODIFY** `runtime/evidence/quality-store.mjs`
- **MODIFY** `runtime/stage/completion-predicates.mjs`
- **MODIFY** `runtime/stage/current-close-projection.mjs`
- **MODIFY** `runtime/stage/stage-agent-outcome-adapter.mjs`
- **MODIFY** `runtime/stage/stage-handlers.mjs`
- **MODIFY** `runtime/stage/stage-runner.mjs`
- **MODIFY** `runtime/task/task-handle.mjs`
- **MODIFY** `runtime/task/task-kernel-implementation.mjs`
- **MODIFY** `runtime/task/task-store.mjs`
- **MODIFY** `tests/close/close-contract.test.mjs`
- **MODIFY** `tests/contract/close-authorization-diagnostics.test.mjs`
- **MODIFY** `tests/contract/close-sidecar-and-archive.test.mjs`
- **MODIFY** `tests/contract/final-coverage.test.mjs`
- **MODIFY** `tests/contract/final-current-snapshot.test.mjs`
- **MODIFY** `tests/contract/four-domain-close-status.test.mjs`
- **MODIFY** `tests/contract/identity-resolution.test.mjs`
- **MODIFY** `tests/contract/per-ac-material-freshness.test.mjs`
- **MODIFY** `tests/contract/public-behavior-baseline.test.mjs`
- **MODIFY** `tests/contract/status-derivation.test.mjs`
- **MODIFY** `tests/contract/task-bootstrap-integrity.test.mjs`
- **MODIFY** `tests/contract/verify-authority-boundary.test.mjs`
- **MODIFY** `tests/contract/verify-final-coverage.test.mjs`
- **MODIFY** `tests/contract/verify-publication.test.mjs`
- **MODIFY** `tests/e2e/ui-e2e-contract-dogfood.test.mjs`
- **MODIFY** `tests/e2e/vnext-five-stage-current.test.mjs`
- **MODIFY** `tests/final-cutover-guards.red.test.mjs`
- **MODIFY** `tests/fixtures/public-behavior-baseline/v1/candidate.json`
- **MODIFY** `tests/integration/distribution-closure.test.mjs`
- **MODIFY** `tests/integration/projection-replacement.test.mjs`
- **MODIFY** `tests/integration/minimal-task-storage.test.mjs`
- **MODIFY** `tests/integration/runner-clean-install.test.mjs`
- **MODIFY** `tests/integration/stage-outcome-record-row-redirect.test.mjs`
- **MODIFY** `tests/integration/stage-row-publication.test.mjs`
- **MODIFY** `tests/integration/stage-row-verify-code.test.mjs`
- **MODIFY** `tests/integration/vnext-delivery-close.test.mjs`
- **MODIFY** `tests/integration/vnext-official-stage-run.test.mjs`
- **MODIFY** `tests/stage-risk-acceptance.test.mjs`
- **MODIFY** `tests/verify-code-facts.test.mjs`
- **MODIFY** `tools/architecture/public-behavior-baseline.mjs`
- **MODIFY** `tools/architecture/verify-final-coverage.mjs`
- **MODIFY** `tools/cli/produce-final-current-snapshot.mjs`
- **MODIFY** `tools/cli/stage-runtime.mjs`
- **MODIFY** `tools/cli/task-bootstrap.mjs`
- **MODIFY** `tools/cli/task-close.mjs`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-c6-handoff.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t32-tier-c-proof.json`
- **NEW** `tests/contract/current-close-projection-readback.test.mjs`
- **NEW** `tests/contract/tier-c-deletion-boundary.test.mjs`
- **NEW** `tests/integration/stage-row-merge-freshness-delta.test.mjs`
- **DELETE** `runtime/schemas/quality-verify.v1.json`
- **READ-ONLY CONSUMER** `docs/research/**`
- **READ-ONLY CONSUMER** `specs/archive/**`

### Tasks

T54-T68（见 tasks.md Phase 4）

### Verify

C6 批具名 targeted test matrix 全绿 + AC-C6-001~017 oracle 取证 + D-015③ 链路三步 + 守卫基线不劣化。

### Knowledge

C5 已改完 stage-runtime/completion-predicates；C6 先于 C7 合 close 主文件；non_stage 口径按裁定 J-2 只消费不决定。

### STOP

status 读不到 facts.jsonl 新行；重放产生重复行；谓词遍历被改成 STAGE_KEYS；proofs 读点被删。

### Done

status 输出 = 根因行 + 6 类 ref + 反射行；close 前置在 commit 前；planning close 通过且身份未清空；投影文件保留改写达标；底座 consumer 点名齐。

### Risks and rollback

close 不可逆动作顺序错 → DELIVERY_STEPS 顺序硬校验 + 人工确认；回滚 = revert 本批。

### Task Blocks（执行序列）

本 Phase 任务块（RED/GREEN 成对，T 号顺序执行）：

#### T54

- **ID**：T54
- **Phase**：Phase 4 · C6 收口状态
- **goal**：Tier-C schema/object/distribution/registry/fixture structured closure
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C6-001, FR-C6-002
- **AC**：AC-C6-001, AC-C6-002, AC-C6-003, AC-C6-004, AC-C6-005
- **动作**：RED：运行 focused `tier-c-deletion-boundary` 行为测试生成 structured JSON proof。测试逐项读取 Phase 4 exact boundary，验证 schema absence、每个具名 production writer/reader/import 已移除或迁移、current registries 为 tombstone/removal、Runner manifest 排除 schema并保留声明 data dependencies、clean install/status、具名 test/golden fixture assertions、active governance amendment 与 archive/research byte stability。当前因对象图与 registry/release residue 而红；允许 ADR tombstone/audit prose 与 immutable history refs。
- **精确文件**：`docs/research/**`；`specs/archive/**`；本 Phase 无独立可写文件，写边界完全由 boundary 的精确清单承担
- **boundary**：files：`AGENTS.md`；`CONTEXT.md`；`core/load-config.mjs`；`core/task-close.mjs`；`docs/architecture/control-plane-inventory.json`；`docs/architecture/deletion-plan.json`；`docs/architecture/move-map.json`；`docs/architecture/repository-inventory.tsv`；`docs/adr/0017-stage-quality-fact-freshness-scope.md`；`docs/adr/0020-close-five-actions-quality-transcription.md`；`docs/adr/0029-current-ac-and-close-state.md`；`docs/adr/0030-mechanism-simplification-deletion-boundary.md`；`docs/standard-workflow.md`；`runtime/distribution/runner-release.mjs`；`runtime/evidence/quality-store.mjs`；`runtime/stage/completion-predicates.mjs`；`runtime/stage/current-close-projection.mjs`；`runtime/stage/stage-agent-outcome-adapter.mjs`；`runtime/stage/stage-handlers.mjs`；`runtime/stage/stage-runner.mjs`；`runtime/task/task-handle.mjs`；`runtime/task/task-kernel-implementation.mjs`；`runtime/task/task-store.mjs`；`tests/close/close-contract.test.mjs`；`tests/contract/close-authorization-diagnostics.test.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`；`tests/contract/final-coverage.test.mjs`；`tests/contract/final-current-snapshot.test.mjs`；`tests/contract/four-domain-close-status.test.mjs`；`tests/contract/identity-resolution.test.mjs`；`tests/contract/per-ac-material-freshness.test.mjs`；`tests/contract/public-behavior-baseline.test.mjs`；`tests/contract/status-derivation.test.mjs`；`tests/contract/task-bootstrap-integrity.test.mjs`；`tests/contract/verify-authority-boundary.test.mjs`；`tests/contract/verify-final-coverage.test.mjs`；`tests/contract/verify-publication.test.mjs`；`tests/e2e/ui-e2e-contract-dogfood.test.mjs`；`tests/e2e/vnext-five-stage-current.test.mjs`；`tests/final-cutover-guards.red.test.mjs`；`tests/fixtures/public-behavior-baseline/v1/candidate.json`；`tests/integration/distribution-closure.test.mjs`；`tests/integration/projection-replacement.test.mjs`；`tests/integration/minimal-task-storage.test.mjs`；`tests/integration/runner-clean-install.test.mjs`；`tests/integration/stage-outcome-record-row-redirect.test.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/integration/stage-row-verify-code.test.mjs`；`tests/integration/vnext-delivery-close.test.mjs`；`tests/integration/vnext-official-stage-run.test.mjs`；`tests/stage-risk-acceptance.test.mjs`；`tests/verify-code-facts.test.mjs`；`tools/architecture/public-behavior-baseline.mjs`；`tools/architecture/verify-final-coverage.mjs`；`tools/cli/produce-final-current-snapshot.mjs`；`tools/cli/stage-runtime.mjs`；`tools/cli/task-bootstrap.mjs`；`tools/cli/task-close.mjs`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-batch-boundary.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-c6-handoff.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t32-tier-c-proof.json`；`tests/contract/current-close-projection-readback.test.mjs`；`tests/contract/tier-c-deletion-boundary.test.mjs`；`tests/integration/stage-row-merge-freshness-delta.test.mjs`；DELETE 组与 READ-ONLY CONSUMER 组（runtime/schemas/quality-verify.v1.json、docs/research 子树、specs/archive 子树）按 plan Phase 4 与 File Boundary 登记处置（owner=T54/T55）
- **输出**：t32-tier-c-proof.json：schema、named production closure、registry、release/clean-install、focused tests/fixture、active-doc amendment、immutable-history 七区 readback
- **Knowledge**：D-023①；连对象删除不做只读归档；schema 文件删除登记见 plan File Boundary DELETE 组
- **verification_role**：RED
- **paired_task**：T55
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/tier-c-deletion-boundary.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs tests/contract/verify-final-coverage.test.mjs tests/contract/final-current-snapshot.test.mjs tests/contract/public-behavior-baseline.test.mjs tests/e2e/ui-e2e-contract-dogfood.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-T32 {"pass":"schema/object/distribution/current registries retired; explicit Runner closure clean-installs; archive bytes unchanged","reject":{"input":"schema-only deletion, all-schema glob remains, registry KEEP remains, or archive changes","expected_rejection":"targeted closure/readback fails","observation":"full Tier-C deletion proof"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t32-tier-c-proof.json
- **STOP**：schema 存在；具名 writer/reader/import 任一可达；registry 非 tombstone/removal；manifest/clean-install/fixture readback 失败；active docs 未 amendment；或 immutable history 被改
- **recovery**：回退整个 Tier-C C6 isolated diff：同时恢复 schema、quality/verify object graph、Runner distribution closure、registries/inventory 与对应 tests；禁止仅加回 schema；归档 specs 始终不动
- **task risk**：断链（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T55

- **ID**：T55
- **Phase**：Phase 4 · C6 收口状态
- **goal**：Tier-C schema/object/distribution/registry/fixture structured closure
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T54
- **并行**：无
- **FR**：FR-C6-001, FR-C6-002
- **AC**：AC-C6-001, AC-C6-002, AC-C6-003, AC-C6-004, AC-C6-005
- **动作**：GREEN：完成 Phase 4 exact boundary 的 schema/object graph 删除与 diagnostics migration；Runner 改 explicit data dependency closure；current registries 进入 tombstone/removal；active governance 追加 supersession；更新全部具名 contract/integration/e2e tests 与唯一 golden fixture。运行与 T54 相同 focused behavior test，写出 t32-tier-c-proof.json，逐项 readback 全绿；archive/research historical refs 不改。
- **精确文件**：`docs/research/**`；`specs/archive/**`；本 Phase 无独立可写文件，写边界完全由 boundary 的精确清单承担
- **boundary**：files：`AGENTS.md`；`CONTEXT.md`；`core/load-config.mjs`；`core/task-close.mjs`；`docs/architecture/control-plane-inventory.json`；`docs/architecture/deletion-plan.json`；`docs/architecture/move-map.json`；`docs/architecture/repository-inventory.tsv`；`docs/adr/0017-stage-quality-fact-freshness-scope.md`；`docs/adr/0020-close-five-actions-quality-transcription.md`；`docs/adr/0029-current-ac-and-close-state.md`；`docs/adr/0030-mechanism-simplification-deletion-boundary.md`；`docs/standard-workflow.md`；`runtime/distribution/runner-release.mjs`；`runtime/evidence/quality-store.mjs`；`runtime/stage/completion-predicates.mjs`；`runtime/stage/current-close-projection.mjs`；`runtime/stage/stage-agent-outcome-adapter.mjs`；`runtime/stage/stage-handlers.mjs`；`runtime/stage/stage-runner.mjs`；`runtime/task/task-handle.mjs`；`runtime/task/task-kernel-implementation.mjs`；`runtime/task/task-store.mjs`；`tests/close/close-contract.test.mjs`；`tests/contract/close-authorization-diagnostics.test.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`；`tests/contract/final-coverage.test.mjs`；`tests/contract/final-current-snapshot.test.mjs`；`tests/contract/four-domain-close-status.test.mjs`；`tests/contract/identity-resolution.test.mjs`；`tests/contract/per-ac-material-freshness.test.mjs`；`tests/contract/public-behavior-baseline.test.mjs`；`tests/contract/status-derivation.test.mjs`；`tests/contract/task-bootstrap-integrity.test.mjs`；`tests/contract/verify-authority-boundary.test.mjs`；`tests/contract/verify-final-coverage.test.mjs`；`tests/contract/verify-publication.test.mjs`；`tests/e2e/ui-e2e-contract-dogfood.test.mjs`；`tests/e2e/vnext-five-stage-current.test.mjs`；`tests/final-cutover-guards.red.test.mjs`；`tests/fixtures/public-behavior-baseline/v1/candidate.json`；`tests/integration/distribution-closure.test.mjs`；`tests/integration/projection-replacement.test.mjs`；`tests/integration/minimal-task-storage.test.mjs`；`tests/integration/runner-clean-install.test.mjs`；`tests/integration/stage-outcome-record-row-redirect.test.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/integration/stage-row-verify-code.test.mjs`；`tests/integration/vnext-delivery-close.test.mjs`；`tests/integration/vnext-official-stage-run.test.mjs`；`tests/stage-risk-acceptance.test.mjs`；`tests/verify-code-facts.test.mjs`；`tools/architecture/public-behavior-baseline.mjs`；`tools/architecture/verify-final-coverage.mjs`；`tools/cli/produce-final-current-snapshot.mjs`；`tools/cli/stage-runtime.mjs`；`tools/cli/task-bootstrap.mjs`；`tools/cli/task-close.mjs`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-batch-boundary.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-c6-handoff.md`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t32-tier-c-proof.json`；`tests/contract/current-close-projection-readback.test.mjs`；`tests/contract/tier-c-deletion-boundary.test.mjs`；`tests/integration/stage-row-merge-freshness-delta.test.mjs`；DELETE 组与 READ-ONLY CONSUMER 组（runtime/schemas/quality-verify.v1.json、docs/research 子树、specs/archive 子树）按 plan Phase 4 与 File Boundary 登记处置（owner=T54/T55）
- **输出**：t32-tier-c-proof.json：schema、named production closure、registry、release/clean-install、focused tests/fixture、active-doc amendment、immutable-history 七区 readback
- **Knowledge**：D-023①；连对象删除不做只读归档；schema 文件删除登记见 plan File Boundary DELETE 组
- **verification_role**：GREEN
- **paired_task**：T54
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/tier-c-deletion-boundary.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs tests/contract/verify-final-coverage.test.mjs tests/contract/final-current-snapshot.test.mjs tests/contract/public-behavior-baseline.test.mjs tests/e2e/ui-e2e-contract-dogfood.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-T32 {"pass":"schema/object/distribution/current registries retired; explicit Runner closure clean-installs; archive bytes unchanged"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t32-tier-c-proof.json
- **STOP**：schema 存在；具名 writer/reader/import 任一可达；registry 非 tombstone/removal；manifest/clean-install/fixture readback 失败；active docs 未 amendment；或 immutable history 被改
- **recovery**：回退整个 Tier-C C6 isolated diff：同时恢复 schema、quality/verify object graph、Runner distribution closure、registries/inventory 与对应 tests；禁止仅加回 schema；归档 specs 始终不动
- **task risk**：断链（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T56

- **ID**：T56
- **Phase**：Phase 4 · C6 收口状态
- **goal**：risk_close 等值判定 + delivery.quality_gaps 收口
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C6-004
- **AC**：AC-C6-006
- **动作**：RED：stage-risk-acceptance 三例（今失败：旧判据/源读投影）
- **精确文件**：`core/task-close.mjs`；`runtime/stage/stage-handlers.mjs`；`tests/stage-risk-acceptance.test.mjs`
- **boundary**：files：tests/integration/projection-replacement.test.mjs；core/task-close.mjs；runtime/stage/stage-handlers.mjs；tests/stage-risk-acceptance.test.mjs
- **输出**：正/反两例执行记录
- **Knowledge**：裁定 J-7.2；比对源非已删投影
- **verification_role**：RED
- **paired_task**：T57
- **gate_cmd**：./node_modules/.bin/vitest run tests/stage-risk-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：1
- **oracle**：`ORA-T33 {"pass": "不等抛/空集抛/全等过三例齐备", "reject": {"input": "可填任意内容或源读投影", "expected_rejection": "非空即可", "observation": "三例齐备"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t33-risk-close-eq.log
- **STOP**：放行任意 quality_reasons
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：放行（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-004
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T57

- **ID**：T57
- **Phase**：Phase 4 · C6 收口状态
- **goal**：risk_close 等值判定 + delivery.quality_gaps 收口
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T56
- **并行**：无
- **FR**：FR-C6-004
- **AC**：AC-C6-006
- **动作**：GREEN：validateRiskCloseQualityReasons 改等值判定（具名 ref 集合去重排序全等；空集仍抛、不等仍抛）；按 semantic reader closure 具名列出并收口 `core/task-close.mjs` 与 `runtime/stage/stage-handlers.mjs` 所有 active `quality_gaps` readers，不把历史 10/9/7 等计数冻结为 gate
- **精确文件**：`core/task-close.mjs`；`runtime/stage/stage-handlers.mjs`；`tests/stage-risk-acceptance.test.mjs`
- **boundary**：files：core/task-close.mjs；runtime/stage/stage-handlers.mjs；tests/stage-risk-acceptance.test.mjs
- **输出**：正/反两例执行记录
- **Knowledge**：裁定 J-7.2；比对源非已删投影
- **verification_role**：GREEN
- **paired_task**：T56
- **gate_cmd**：./node_modules/.bin/vitest run tests/stage-risk-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：0
- **oracle**：`ORA-T33 {"pass": "不等抛/空集抛/全等过三例齐备"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t33-risk-close-eq.log
- **STOP**：放行任意 quality_reasons
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：放行（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-004
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T58

- **ID**：T58
- **Phase**：Phase 4 · C6 收口状态
- **goal**：入口统一 + main 前进 stale 行
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C6-005, FR-C6-006
- **AC**：AC-C6-010, AC-C6-011
- **动作**：RED：./node_modules/.bin/vitest run identity-resolution（今失败：--task-path 静默生效/来源未记录）
- **精确文件**：`tools/cli/stage-runtime.mjs`；`tools/cli/task-close.mjs`；`tools/cli/task-bootstrap.mjs`；`core/load-config.mjs`；`tests/contract/identity-resolution.test.mjs`
- **boundary**：files：tests/integration/distribution-closure.test.mjs；tests/integration/runner-clean-install.test.mjs；tests/integration/minimal-task-storage.test.mjs；tests/integration/stage-outcome-record-row-redirect.test.mjs；runtime/distribution/runner-release.mjs；tools/cli/stage-runtime.mjs；tools/cli/task-close.mjs；tools/cli/task-bootstrap.mjs；core/load-config.mjs；tests/contract/identity-resolution.test.mjs
- **输出**：入口行为验证记录；stale 行输出
- **Knowledge**：D-024①②；来源必录
- **verification_role**：RED
- **paired_task**：T59
- **gate_cmd**：./node_modules/.bin/vitest run tests/contract/identity-resolution.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：1
- **oracle**：`ORA-T34 {"pass": "--task-path 使用时来源已记录且 main 前进报 stale 不冻结", "reject": {"input": "--task-path 静默生效或硬失败", "expected_rejection": "来源未记录", "observation": "来源已录 + stale 行"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t34-entry-stale.log
- **STOP**：入口解析破坏 task 定位
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：定位破坏（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-005
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T59

- **ID**：T59
- **Phase**：Phase 4 · C6 收口状态
- **goal**：入口统一 + main 前进 stale 行
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T58
- **并行**：无
- **FR**：FR-C6-005, FR-C6-006
- **AC**：AC-C6-010, AC-C6-011
- **动作**：GREEN：三入口统一 project+task_id→config resolver→canonical path；--task-path 降受控诊断 override 并记录来源；main 前进不冻结 base OID；status 根因行报 stale 带具体来源
- **精确文件**：`tools/cli/stage-runtime.mjs`；`tools/cli/task-close.mjs`；`tools/cli/task-bootstrap.mjs`；`core/load-config.mjs`；`tests/contract/identity-resolution.test.mjs`
- **boundary**：files：tools/cli/stage-runtime.mjs；tools/cli/task-close.mjs；tools/cli/task-bootstrap.mjs；core/load-config.mjs；tests/contract/identity-resolution.test.mjs
- **输出**：入口行为验证记录；stale 行输出
- **Knowledge**：D-024①②；来源必录
- **verification_role**：GREEN
- **paired_task**：T58
- **gate_cmd**：./node_modules/.bin/vitest run tests/contract/identity-resolution.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：0
- **oracle**：`ORA-T34 {"pass": "--task-path 使用时来源已记录且 main 前进报 stale 不冻结"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t34-entry-stale.log
- **STOP**：入口解析破坏 task 定位
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：定位破坏（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-005
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T60

- **ID**：T60
- **Phase**：Phase 4 · C6 收口状态
- **goal**：close 前置检查移 commit 之前 + non_stage 谓词钉死
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C6-007, FR-C6-008
- **AC**：AC-C6-008, AC-C6-009
- **动作**：RED：close-sidecar 等（今失败：顺序/谓词改造未完成）
- **精确文件**：`core/task-close.mjs`；`runtime/stage/completion-predicates.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`；`tests/contract/close-authorization-diagnostics.test.mjs`；`tests/integration/vnext-delivery-close.test.mjs`
- **boundary**：files：tests/contract/final-coverage.test.mjs；tests/contract/four-domain-close-status.test.mjs；tests/contract/task-bootstrap-integrity.test.mjs；tests/contract/verify-authority-boundary.test.mjs；tests/contract/verify-publication.test.mjs；tests/verify-code-facts.test.mjs；core/task-close.mjs；runtime/stage/completion-predicates.mjs；tests/contract/close-sidecar-and-archive.test.mjs；tests/contract/close-authorization-diagnostics.test.mjs；tests/integration/vnext-delivery-close.test.mjs
- **输出**：merge 冲突 commit 前拦截观测记录；谓词遍历源码比对
- **Knowledge**：D-025①；裁定 J-2；复用现有检查零新增
- **verification_role**：RED
- **paired_task**：T61
- **gate_cmd**：./node_modules/.bin/vitest run tests/contract/close-sidecar-and-archive.test.mjs tests/contract/close-authorization-diagnostics.test.mjs tests/integration/vnext-delivery-close.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：1
- **oracle**：`ORA-T35 {"pass": "冲突在 commit 前拦截且谓词遍历仍 STAGES", "reject": {"input": "先 commit 后报冲突或遍历改 STAGE_KEYS", "expected_rejection": "顺序错或集合被改", "observation": "前置拦截 + STAGES 钉死"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t35-close-order.log
- **STOP**：不可逆 commit 先行
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：commit 先行（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-007
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T61

- **ID**：T61
- **Phase**：Phase 4 · C6 收口状态
- **goal**：close 前置检查移 commit 之前 + non_stage 谓词钉死
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T60
- **并行**：无
- **FR**：FR-C6-007, FR-C6-008
- **AC**：AC-C6-008, AC-C6-009
- **动作**：GREEN：sidecar 发布/merge 预检/允许清单/远端对象检查全部移到 commit-delivery 之前（复用现有检查函数调序）；不新增 --preflight-only；谓词遍历集合钉死 STAGES；build-prd 只按自己材料收口；含一次经人确认的观测 close（或隔离 dry-run harness）验证 merge/sidecar 检查先于不可逆 commit-delivery 发生，前后仓状态留证
- **精确文件**：`core/task-close.mjs`；`runtime/stage/completion-predicates.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`；`tests/contract/close-authorization-diagnostics.test.mjs`；`tests/integration/vnext-delivery-close.test.mjs`
- **boundary**：files：core/task-close.mjs；runtime/stage/completion-predicates.mjs；tests/contract/close-sidecar-and-archive.test.mjs；tests/contract/close-authorization-diagnostics.test.mjs；tests/integration/vnext-delivery-close.test.mjs
- **输出**：merge 冲突 commit 前拦截观测记录；谓词遍历源码比对
- **Knowledge**：D-025①；裁定 J-2；复用现有检查零新增
- **verification_role**：GREEN
- **paired_task**：T60
- **gate_cmd**：./node_modules/.bin/vitest run tests/contract/close-sidecar-and-archive.test.mjs tests/contract/close-authorization-diagnostics.test.mjs tests/integration/vnext-delivery-close.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
- **expected_exit**：0
- **oracle**：`ORA-T35 {"pass": "冲突在 commit 前拦截且谓词遍历仍 STAGES"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t35-close-order.log
- **STOP**：不可逆 commit 先行
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：commit 先行（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-007
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T62

- **ID**：T62
- **Phase**：Phase 4 · C6 收口状态
- **goal**：review/reflection merge delta + D-015/5-4-2 close routes regression + X47
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C6-009, FR-C6-010, FR-C6-011
- **AC**：AC-C6-007, AC-C6-014
- **动作**：RED：先跑独立 predecessor precheck：现有 D-015 publish/read/replay 与 close-contract 5/4/2 route/recordCloseActionRow 回归必须退出 0；并从起始提交 `35a6fb6f` 读取三数组的 exact JSON 值，断言当前值与顺序逐项相同。随后只运行新 `stage-row-merge-freshness-delta` 聚焦用例；RED 只能是 review/reflection merge preservation、planning freshness-removal 或 precheck-before-first-route-action 的新断言失败。
- **精确文件**：`runtime/stage/stage-runner.mjs`；`core/task-close.mjs`；`tests/close/close-contract.test.mjs`；`tests/integration/vnext-official-stage-run.test.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/integration/stage-row-verify-code.test.mjs`
- **boundary**：files：tests/integration/stage-row-merge-freshness-delta.test.mjs；runtime/stage/stage-runner.mjs；core/task-close.mjs；tests/close/close-contract.test.mjs；tests/integration/vnext-official-stage-run.test.mjs；tests/integration/stage-row-publication.test.mjs；tests/integration/stage-row-verify-code.test.mjs
- **输出**：predecessor log（D-015 + baseline/current 5/4/2 arrays，必须 0）与 delta log（merge/freshness/call-order）分列
- **Knowledge**：D-015 与 close writer/route 已实现，只作 regression；stage-outcome-proofs 是 K5 history 非 current authority；身份校验不得清空
- **verification_role**：RED
- **paired_task**：T63
- **gate_cmd**：`bash -c './node_modules/.bin/vitest run tests/close/close-contract.test.mjs tests/integration/stage-row-publication.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && node -e "const cp=require(\"child_process\"),fs=require(\"fs\");const names=[\"LEGACY_DELIVERY_STEPS\",\"UNARCHIVED_PLANNING_STEPS\",\"POST_CLEANUP_ARCHIVE_STEPS\"],parse=s=>Object.fromEntries(names.map(n=>{const m=s.match(new RegExp(\"const \\"+n+\" = Object\\\\.freeze\\\\(\\\\[([\\\\s\\\\S]*?)\\\\]\\\\);\"));if(!m)process.exit(1);return [n,[...m[1].matchAll(/\\\"([^\\\"]+)\\\"/g)].map(x=>x[1])] }));const base=parse(cp.execFileSync(\"git\",[\"show\",\"35a6fb6f:core/task-close.mjs\"],{encoding:\"utf8\"})),now=parse(fs.readFileSync(\"core/task-close.mjs\",\"utf8\"));if(JSON.stringify(base)!==JSON.stringify(now))process.exit(1)" && ./node_modules/.bin/vitest run tests/integration/stage-row-merge-freshness-delta.test.mjs --poolOptions.forks.singleFork --no-fileParallelism'`
- **expected_exit**：1
- **oracle**：`ORA-T36 {"pass":"predecessor D-015 and baseline-identical 5/4/2 arrays exit 0; focused delta preserves review/reflection, removes freshness rejection, and calls prechecks before route/first physical action","reject":{"input":"predecessor drift, array reorder, second row, erased fact, freshness rejection, or late precheck","expected_rejection":"precheck or focused delta fails with separate evidence","observation":"predecessor and delta logs"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t36-facts-chain.log
- **STOP**：事实行重复污染
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：重复污染（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-009
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T63

- **ID**：T63
- **Phase**：Phase 4 · C6 收口状态
- **goal**：review/reflection merge delta + D-015/5-4-2 close routes regression + X47
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T62
- **并行**：无
- **FR**：FR-C6-009, FR-C6-010, FR-C6-011
- **AC**：AC-C6-007, AC-C6-014
- **动作**：GREEN：先跑与 T62 相同 predecessor precheck 且退出 0；新聚焦 delta 用例证明 review/reflection 真实 facts 合并进 frozen 16-key stage 行且 replacement 不擦除，planning close 保留 materials sha256/prd attachment只删 freshness rejection，并以 spy call order 证明所有 precheck 函数在 route 执行前、首个物理 action 前调用。三数组本体从 `35a6fb6f` 起逐项不变，绝不把 precheck 插入或重排数组。
- **精确文件**：`runtime/stage/stage-runner.mjs`；`core/task-close.mjs`；`tests/close/close-contract.test.mjs`；`tests/integration/vnext-official-stage-run.test.mjs`；`tests/integration/stage-row-publication.test.mjs`；`tests/integration/stage-row-verify-code.test.mjs`
- **boundary**：files：runtime/stage/stage-runner.mjs；core/task-close.mjs；tests/close/close-contract.test.mjs；tests/integration/vnext-official-stage-run.test.mjs；tests/integration/stage-row-publication.test.mjs；tests/integration/stage-row-verify-code.test.mjs
- **输出**：predecessor log（D-015 + baseline/current 5/4/2 arrays，必须 0）与 delta log（merge/freshness/call-order）分列
- **Knowledge**：D-015 与 close writer/route 已实现，只作 regression；stage-outcome-proofs 是 K5 history 非 current authority；身份校验不得清空
- **verification_role**：GREEN
- **paired_task**：T62
- **gate_cmd**：`bash -c './node_modules/.bin/vitest run tests/close/close-contract.test.mjs tests/integration/stage-row-publication.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && node -e "const cp=require(\"child_process\"),fs=require(\"fs\");const names=[\"LEGACY_DELIVERY_STEPS\",\"UNARCHIVED_PLANNING_STEPS\",\"POST_CLEANUP_ARCHIVE_STEPS\"],parse=s=>Object.fromEntries(names.map(n=>{const m=s.match(new RegExp(\"const \\"+n+\" = Object\\\\.freeze\\\\(\\\\[([\\\\s\\\\S]*?)\\\\]\\\\);\"));if(!m)process.exit(1);return [n,[...m[1].matchAll(/\\\"([^\\\"]+)\\\"/g)].map(x=>x[1])] }));const base=parse(cp.execFileSync(\"git\",[\"show\",\"35a6fb6f:core/task-close.mjs\"],{encoding:\"utf8\"})),now=parse(fs.readFileSync(\"core/task-close.mjs\",\"utf8\"));if(JSON.stringify(base)!==JSON.stringify(now))process.exit(1)" && ./node_modules/.bin/vitest run tests/integration/stage-row-merge-freshness-delta.test.mjs --poolOptions.forks.singleFork --no-fileParallelism'`
- **expected_exit**：0
- **oracle**：`ORA-T36 {"pass":"predecessor D-015 and baseline-identical 5/4/2 arrays exit 0; focused delta preserves review/reflection, removes freshness rejection, and calls prechecks before route/first physical action"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t36-facts-chain.log
- **STOP**：事实行重复污染
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：重复污染（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-009
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T64

- **ID**：T64
- **Phase**：Phase 4 · C6 收口状态
- **goal**：current-close-projection 改写 + 三块底座点名
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C6-003, FR-C6-012, FR-C6-013
- **AC**：AC-C6-013, AC-C6-015, AC-C6-016, AC-C6-017
- **动作**：RED：运行新的聚焦 readback 用例，构造 K1–K6 具名 refs 与 K2 current stage/close rows，调用当前收口投影和 task-close reader；当前因仍读取 product_release 或未以 K2 为 status authority 而失败。测试同时断言 stage-outcome-proofs 只作 K5 readback、三块底座各自 consumer 行为可观察。
- **精确文件**：`runtime/stage/current-close-projection.mjs`；`tools/cli/task-close.mjs`；`docs/architecture/control-plane-inventory.json`；`runtime/stage/stage-runner.mjs`；`tests/contract/current-close-projection-readback.test.mjs`
- **boundary**：files：docs/architecture/move-map.json；docs/architecture/deletion-plan.json；docs/architecture/repository-inventory.tsv；runtime/task/task-handle.mjs；runtime/task/task-kernel-implementation.mjs；runtime/task/task-store.mjs；runtime/stage/current-close-projection.mjs；tools/cli/task-close.mjs；docs/architecture/control-plane-inventory.json；runtime/stage/stage-runner.mjs
- **输出**：K1–K6 behavior/readback、K2 authority、K5 history-only、三底座 consumer 与 registry readback
- **Knowledge**：D-013/OI-14/裁定 J-4/J-7；改写不删文件
- **verification_role**：RED
- **paired_task**：T65
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/current-close-projection-readback.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORA-T37 {"pass":"focused readback proves K1-K6 named refs, K2 current authority, K5 history-only, retained projection reader and three registered consumers","reject":{"input":"product-release read, directory-driven selection, missing K2/K5 readback or consumer mismatch","expected_rejection":"behavior/readback assertion fails","observation":"projected values and registry owner/consumer/replacement"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t37-projection-rewrite.log
- **STOP**：活 reader 断链
- **recovery**：回退整个 Tier-C C6 isolated diff：同时恢复 schema、quality/verify object graph、Runner distribution closure、registries/inventory 与对应 tests；禁止仅加回 schema；归档 specs 始终不动
- **task risk**：断链（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-003
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T65

- **ID**：T65
- **Phase**：Phase 4 · C6 收口状态
- **goal**：current-close-projection 改写 + 三块底座点名
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T64
- **并行**：无
- **FR**：FR-C6-003, FR-C6-012, FR-C6-013
- **AC**：AC-C6-013, AC-C6-015, AC-C6-016, AC-C6-017
- **动作**：GREEN：同一 readback 用例证明状态域不再读取 product_release，K2 行是 current authority，K1–K6 具名 refs 逐项读取且不由 readdir 决定，stage-outcome-proofs 仅按 K5 ref 读回；current-close projection 文件仍是 task-close 活 reader，三块底座 consumer 与 registry owner/replacement 一致。
- **精确文件**：`runtime/stage/current-close-projection.mjs`；`tools/cli/task-close.mjs`；`docs/architecture/control-plane-inventory.json`；`runtime/stage/stage-runner.mjs`；`tests/contract/current-close-projection-readback.test.mjs`
- **boundary**：files：runtime/stage/current-close-projection.mjs；tools/cli/task-close.mjs；docs/architecture/control-plane-inventory.json；runtime/stage/stage-runner.mjs
- **输出**：K1–K6 behavior/readback、K2 authority、K5 history-only、三底座 consumer 与 registry readback
- **Knowledge**：D-013/OI-14/裁定 J-4/J-7；改写不删文件
- **verification_role**：GREEN
- **paired_task**：T64
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/current-close-projection-readback.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORA-T37 {"pass":"focused readback proves K1-K6 named refs, K2 current authority, K5 history-only, retained projection reader and three registered consumers"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t37-projection-rewrite.log
- **STOP**：活 reader 断链
- **recovery**：回退整个 Tier-C C6 isolated diff：同时恢复 schema、quality/verify object graph、Runner distribution closure、registries/inventory 与对应 tests；禁止仅加回 schema；归档 specs 始终不动
- **task risk**：断链（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-003
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T66

- **ID**：T66
- **Phase**：Phase 4 · C6 收口状态
- **goal**：C6 具名 targeted matrix 全批取证（批停止条件）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C6-001, FR-C6-002, FR-C6-003, FR-C6-004, FR-C6-005, FR-C6-006, FR-C6-007, FR-C6-008, FR-C6-009, FR-C6-010, FR-C6-011, FR-C6-012, FR-C6-013
- **AC**：AC-C6-001, AC-C6-002, AC-C6-003, AC-C6-004, AC-C6-005, AC-C6-006, AC-C6-007, AC-C6-008, AC-C6-009, AC-C6-010, AC-C6-011, AC-C6-012, AC-C6-013, AC-C6-014, AC-C6-015, AC-C6-016, AC-C6-017
- **动作**：RED：C6 批命令矩阵（今失败：收口面改造未完成）
- **精确文件**：`tests/contract/status-derivation.test.mjs`；`tests/close/close-contract.test.mjs`；`tests/contract/public-behavior-baseline.test.mjs`；`tests/final-cutover-guards.red.test.mjs`
- **boundary**：files：tests/e2e/ui-e2e-contract-dogfood.test.mjs；tools/architecture/public-behavior-baseline.mjs；tools/architecture/verify-final-coverage.mjs；tools/cli/produce-final-current-snapshot.mjs；tests/fixtures/public-behavior-baseline/v1/candidate.json；docs/adr/0017-stage-quality-fact-freshness-scope.md；docs/adr/0020-close-five-actions-quality-transcription.md；docs/adr/0029-current-ac-and-close-state.md；docs/adr/0030-mechanism-simplification-deletion-boundary.md；AGENTS.md；CONTEXT.md；docs/standard-workflow.md；tests/contract/status-derivation.test.mjs；tests/close/close-contract.test.mjs；tests/contract/public-behavior-baseline.test.mjs；tests/final-cutover-guards.red.test.mjs
- **输出**：批内全绿记录
- **Knowledge**：禁止全量；九条为批内全部
- **verification_role**：RED
- **paired_task**：T67
- **gate_cmd**：bash -c './node_modules/.bin/vitest run tests/contract/status-derivation.test.mjs tests/close/close-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/contract/close-sidecar-and-archive.test.mjs tests/contract/close-authorization-diagnostics.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/integration/vnext-delivery-close.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/integration/build-prd-delivery.test.mjs tests/contract/build-prd-review-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/contract/identity-resolution.test.mjs tests/contract/verify-publication.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/integration/projection-replacement.test.mjs tests/contract/task-bootstrap-integrity.test.mjs tests/verify-code-facts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/stage-risk-acceptance.test.mjs tests/contract/human-confirmation-v3.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/contract/public-behavior-baseline.test.mjs tests/contract/control-plane-governance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/integration/vnext-official-stage-run.test.mjs tests/final-cutover-guards.red.test.mjs --poolOptions.forks.singleFork --no-fileParallelism'
- **expected_exit**：1
- **oracle**：`ORA-T38 {"pass": "九条全绿且守卫不劣化", "reject": {"input": "收口面改造未完成", "expected_rejection": "任一红", "observation": "九条绿 + 守卫记录"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-c6-batch-green.log
- **STOP**：收口面连锁红
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：连锁红（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T67

- **ID**：T67
- **Phase**：Phase 4 · C6 收口状态
- **goal**：C6 具名 targeted matrix 全批取证（批停止条件）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T66
- **并行**：无
- **FR**：FR-C6-001, FR-C6-002, FR-C6-003, FR-C6-004, FR-C6-005, FR-C6-006, FR-C6-007, FR-C6-008, FR-C6-009, FR-C6-010, FR-C6-011, FR-C6-012, FR-C6-013
- **AC**：AC-C6-001, AC-C6-002, AC-C6-003, AC-C6-004, AC-C6-005, AC-C6-006, AC-C6-007, AC-C6-008, AC-C6-009, AC-C6-010, AC-C6-011, AC-C6-012, AC-C6-013, AC-C6-014, AC-C6-015, AC-C6-016, AC-C6-017
- **动作**：GREEN：跑 PRD C6 §17 九条命令全绿；守卫基线不劣化；non_stage 收口（build-prd-delivery）验证
- **精确文件**：`tests/contract/status-derivation.test.mjs`；`tests/close/close-contract.test.mjs`；`tests/contract/public-behavior-baseline.test.mjs`；`tests/final-cutover-guards.red.test.mjs`
- **boundary**：files：tests/contract/status-derivation.test.mjs；tests/close/close-contract.test.mjs；tests/contract/public-behavior-baseline.test.mjs；tests/final-cutover-guards.red.test.mjs
- **输出**：批内全绿记录
- **Knowledge**：禁止全量；九条为批内全部
- **verification_role**：GREEN
- **paired_task**：T66
- **gate_cmd**：bash -c './node_modules/.bin/vitest run tests/contract/status-derivation.test.mjs tests/close/close-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/contract/close-sidecar-and-archive.test.mjs tests/contract/close-authorization-diagnostics.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/integration/vnext-delivery-close.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/integration/build-prd-delivery.test.mjs tests/contract/build-prd-review-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/contract/identity-resolution.test.mjs tests/contract/verify-publication.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/integration/projection-replacement.test.mjs tests/contract/task-bootstrap-integrity.test.mjs tests/verify-code-facts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/stage-risk-acceptance.test.mjs tests/contract/human-confirmation-v3.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/contract/public-behavior-baseline.test.mjs tests/contract/control-plane-governance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && ./node_modules/.bin/vitest run tests/integration/vnext-official-stage-run.test.mjs tests/final-cutover-guards.red.test.mjs --poolOptions.forks.singleFork --no-fileParallelism'
- **expected_exit**：0
- **oracle**：`ORA-T38 {"pass": "九条全绿且守卫不劣化"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-c6-batch-green.log
- **STOP**：收口面连锁红
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：连锁红（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C6-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T68

- **ID**：T68
- **Phase**：Phase 4 · C6 收口状态
- **goal**：C6 批合入（C6 后合）+ close 主文件交接
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行
- **并行**：无
- **FR**：N/A
- **AC**：N/A
- **动作**：C6 批 commit；在对应 p4-batch-boundary.json 持久化每仓 repo_root/branch/BATCH_BASE/BATCH_HEAD full OID；close 主文件交接 C7 登记
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-c6-handoff.md`
- **boundary**：files：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-c6-handoff.md
- **输出**：commit 链与交接记录
- **Knowledge**：C6 先于 C7 合 close 主文件；D-016
- **verification_role**：N/A — 非行为变更：流程/评估/确认/移交记录
- **paired_task**：N/A — 非行为变更：验证由同批 GREEN 任务承担
- **gate_cmd**：`node -e "const cp=require('child_process'),fs=require('fs');const phase='4',root=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/',e=JSON.parse(fs.readFileSync(root+'p4-batch-boundary.json','utf8')),text=fs.readFileSync('specs/workflowhub-mechanism-simplification-t2-20260911/tasks.md','utf8'),head='## Phase '+phase+' ',start=text.indexOf(head),tail=text.slice(start),stop=tail.indexOf('### Files'),section=tail.slice(stop+10,tail.indexOf('### Tasks'));if(start<0||stop<0||!Array.isArray(e.repositories))process.exit(1);const rows=section.split(String.fromCharCode(10)).filter(x=>x.startsWith('- **')).map(x=>[x.slice(7,x.indexOf('**',7)),x.slice(x.lastIndexOf(String.fromCharCode(96))+1)]),readonly=new Set(rows.filter(x=>x[0].trim()==='READ-ONLY CONSUMER').map(x=>x[1])),writable=new Set(rows.filter(x=>x[0].trim()!=='READ-ONLY CONSUMER').map(x=>x[1]).filter(x=>!x.startsWith('$WORKFLOWHUB_TASK_DIR'))),keys=['repo_root','branch','BATCH_BASE','BATCH_HEAD'];for(const r of e.repositories){for(const k of keys)if(!r[k])process.exit(1);if(cp.execFileSync('git',['merge-base','--is-ancestor',r.BATCH_BASE,r.BATCH_HEAD],{cwd:r.repo_root,stdio:'pipe'}).length)process.exit(1);const changed=cp.spawnSync('git',['diff','--name-only',r.BATCH_BASE+'..'+r.BATCH_HEAD],{cwd:r.repo_root,encoding:'utf8'}).stdout.trim().split(String.fromCharCode(10)).filter(Boolean),bad=changed.filter(x=>readonly.has(x)||!writable.has(x));if(bad.length)process.exit(1)}"`
- **expected_exit**：0
- **oracle**：`ORA-T39 {"pass": "从 p4 persisted OIDs 对 workflowhub 独立验 ancestry/diff，changed paths 仅 Phase Files writable 且 READ-ONLY 零改"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-c6-handoff.md
- **STOP**：证据缺失
- **recovery**：补记录后重做
- **task risk**：低

## Phase 5 · 任务级收尾

### Goal

守卫基线复核、三条总账只读计算、HANDOFF 登记移交，任务级判据收口。

### Files

- **READ-ONLY CONSUMER** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-flow-boundary.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-guard-baseline.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-handoff-ledger.md`

### Tasks

T69-T74（见 tasks.md Phase 5）

### Verify

三条守卫整改前后一致；M4 为负；记录文件数与无 reader 对象数对基线不劣化。

### Knowledge

四批全部合入后执行；consumer = 任务Ⅲ C8 的 M3/M4。

### STOP

M4 ≥ 0 或守卫劣化 → 回退批次定位赤字批次。

### Done

三条总账记录落 task-store quality/tests 证据区；001~003/005/007 active handoffs；004 仅保留与已删 predecessor 无关的剩余治理（如仍适用） 登记齐，006 closed/superseded/accepted 单列。

### Risks and rollback

总账劣化 → 定位到批次回补或回退。

### Task Blocks（执行序列）

本 Phase 任务块（RED/GREEN 成对，T 号顺序执行）：

#### T69

- **ID**：T69
- **Phase**：Phase 5 · 任务级收尾
- **goal**：守卫基线整改前后复核
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C9-001, FR-C4-002, FR-C5-001, FR-C6-002
- **AC**：AC-TLD-001, AC-TLD-002, AC-TLD-003
- **动作**：RED：读取 T0 `t0-current-baseline.json`，重跑相同三守卫并比较动态变量；当前只在任一计数劣化或本任务范围未清零时红
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-guard-baseline.json`
- **boundary**：files：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-guard-baseline.json（T0 artifact 只读）
- **输出**：T0 当前值、整改后值、delta 与 raw output refs
- **Knowledge**：旧 612/35、10、2 仅历史；gate 必须从 artifact readback
- **verification_role**：RED
- **paired_task**：T70
- **gate_cmd**：`node -e "const fs=require('fs');const root=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/';const b=JSON.parse(fs.readFileSync(root+'t0-current-baseline.json','utf8'));const a=JSON.parse(fs.readFileSync(root+'p5-guard-baseline.json','utf8'));for(const k of ['markdownlint','record_paths','structure']){const bk=b[k].failures??b[k].errors,ak=a[k].failures??a[k].errors;if(!Number.isInteger(bk)||!Number.isInteger(ak)||ak>bk)process.exit(1)}if(a.scoped_failures!==0)process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-T40 {"pass":"post counts <= T0 artifact counts and scoped files clean","reject":{"input":"missing artifact, increased count, or scoped failure","expected_rejection":"dynamic comparison fails","observation":"before/after variables and raw refs"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-guard-baseline.json
- **STOP**：基线劣化污染 C8
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：污染 C8（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T70

- **ID**：T70
- **Phase**：Phase 5 · 任务级收尾
- **goal**：守卫基线整改前后复核
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T69
- **并行**：无
- **FR**：FR-C9-001, FR-C4-002, FR-C5-001, FR-C6-002
- **AC**：AC-TLD-001, AC-TLD-002, AC-TLD-003
- **动作**：GREEN：重跑与 T0 相同三守卫，解析整改后 counts，从 task-store artifact 读基线变量逐项比较并写 delta；本任务范围内清零
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`；`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-guard-baseline.json`
- **boundary**：files：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-guard-baseline.json（T0 artifact 只读）
- **输出**：三守卫 before/after/delta 与 raw refs
- **Knowledge**：动态 readback；禁止硬编码历史数
- **verification_role**：GREEN
- **paired_task**：T69
- **gate_cmd**：`node -e "const fs=require('fs');const root=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/';const b=JSON.parse(fs.readFileSync(root+'t0-current-baseline.json','utf8'));const a=JSON.parse(fs.readFileSync(root+'p5-guard-baseline.json','utf8'));for(const k of ['markdownlint','record_paths','structure']){const bk=b[k].failures??b[k].errors,ak=a[k].failures??a[k].errors;if(!Number.isInteger(bk)||!Number.isInteger(ak)||ak>bk)process.exit(1)}if(a.scoped_failures!==0)process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T40 {"pass":"post counts <= T0 artifact counts and scoped files clean"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-guard-baseline.json
- **STOP**：基线劣化污染 C8
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：污染 C8（中）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T71

- **ID**：T71
- **Phase**：Phase 5 · 任务级收尾
- **goal**：任务级三条总账只读计算
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行（RED 先于 GREEN）
- **并行**：无
- **FR**：FR-C9-001, FR-C4-002, FR-C5-001, FR-C6-002
- **AC**：AC-TLD-004, AC-TLD-005, AC-TLD-006
- **动作**：RED：读取 declared baseline/current JSON 并现场复算：用 git diff --numstat 汇总 M4 additions-deletions；递归当前 task-store 仅按声明 record-file predicate 复算 M3；以 declared candidate_objects 与 active reader_refs 复算 no-reader count。拒绝只写结论文本；当前因 JSON/计算结果未产出而红。
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json`
- **boundary**：files：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json
- **输出**：declared baseline/current data + recomputed M3/M4/no-reader numeric JSON + exact equality assertions
- **Knowledge**：consumer=任务Ⅲ C8 M3/M4；只读计算
- **verification_role**：RED
- **paired_task**：T72
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require("child_process"),path=require('path'),p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json',e=JSON.parse(fs.readFileSync(p,'utf8')),walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)]),num=cp.execFileSync('git',['diff','--numstat',e.baseline.workflowhub_oid+'..'+e.current.workflowhub_oid],{encoding:'utf8'}).trim().split(String.fromCharCode(10)).filter(Boolean).reduce((a,l)=>{const [x,y]=l.split(/\s+/);return a+(x==='-'?0:+x)-(y==='-'?0:+y)},0),m3=walk(e.current.task_store_root).filter(x=>new RegExp(e.record_file_pattern).test(path.relative(e.current.task_store_root,x))).length,nr=e.current.candidate_objects.filter(o=>!e.current.reader_refs.some(r=>r.object===o&&r.active===true)).length;if(!Number.isInteger(num)||!Number.isInteger(m3)||!Number.isInteger(nr)||num!==e.calculated.M4||m3!==e.calculated.M3_current||nr!==e.calculated.no_reader_current||e.calculated.M4>=0||e.calculated.M3_current>e.baseline.M3||e.calculated.no_reader_current>e.baseline.no_reader)process.exit(1)"`
- **expected_exit**：1
- **oracle**：`ORA-T41 {"pass":"recomputed M4/M3/no-reader equal persisted numeric values and satisfy thresholds","reject":{"input":"missing declared data, calculation mismatch, M4>=0, M3/no-reader regression","expected_rejection":"calculation assertion fails","observation":"declared inputs and recomputed numeric JSON"}}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json
- **STOP**：M4 为正
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：M4 为正（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-001
- **semantic_review_reason**：RED=批前先失败取证，GREEN=实现后同命令转绿

#### T72

- **ID**：T72
- **Phase**：Phase 5 · 任务级收尾
- **goal**：任务级三条总账只读计算
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：T71
- **并行**：无
- **FR**：FR-C9-001, FR-C4-002, FR-C5-001, FR-C6-002
- **AC**：AC-TLD-004, AC-TLD-005, AC-TLD-006
- **动作**：GREEN：同一 command 从 declared baseline/current OID、task-store root、record-file predicate、candidate objects/reader refs 现场复算 M4/M3/no-reader；assert 复算值与 persisted calculated 字段完全相等，M4<0、M3 current<=baseline、no-reader current<=baseline；跨仓 numstat 单列。
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json`
- **boundary**：files：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json
- **输出**：declared baseline/current data + recomputed M3/M4/no-reader numeric JSON + exact equality assertions
- **Knowledge**：consumer=任务Ⅲ C8 M3/M4；只读计算
- **verification_role**：GREEN
- **paired_task**：T71
- **gate_cmd**：`node -e "const fs=require('fs'),cp=require("child_process"),path=require('path'),p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json',e=JSON.parse(fs.readFileSync(p,'utf8')),walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)]),num=cp.execFileSync('git',['diff','--numstat',e.baseline.workflowhub_oid+'..'+e.current.workflowhub_oid],{encoding:'utf8'}).trim().split(String.fromCharCode(10)).filter(Boolean).reduce((a,l)=>{const [x,y]=l.split(/\s+/);return a+(x==='-'?0:+x)-(y==='-'?0:+y)},0),m3=walk(e.current.task_store_root).filter(x=>new RegExp(e.record_file_pattern).test(path.relative(e.current.task_store_root,x))).length,nr=e.current.candidate_objects.filter(o=>!e.current.reader_refs.some(r=>r.object===o&&r.active===true)).length;if(!Number.isInteger(num)||!Number.isInteger(m3)||!Number.isInteger(nr)||num!==e.calculated.M4||m3!==e.calculated.M3_current||nr!==e.calculated.no_reader_current||e.calculated.M4>=0||e.calculated.M3_current>e.baseline.M3||e.calculated.no_reader_current>e.baseline.no_reader)process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T41 {"pass":"recomputed M4/M3/no-reader equal persisted numeric values and satisfy thresholds"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json
- **STOP**：M4 为正
- **recovery**：revert 本任务对；批内逐任务提交边界见 plan Rollback
- **task risk**：M4 为正（高）
- **semantic_review_status**：completed
- **semantic_review_ref**：spec.md#FR-C9-001
- **semantic_review_reason**：GREEN 依赖 RED，同 gate 同 oracle 转绿

#### T73

- **ID**：T73
- **Phase**：Phase 5 · 任务级收尾
- **goal**：HANDOFF-T2 登记与治理同步清单移交
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行
- **并行**：无
- **FR**：FR-C5-009, FR-C4-021
- **AC**：AC-FLW-001
- **动作**：汇总 001~003/005/007 active handoffs 的 owner/触发/关闭条件；004 仅登记与已删 predecessor 无关的 measure-profile 后续部分，不把已删 validator 复活为 active handoff，并把 006 记为 post-merge superseded/accepted closed；随任务级证据移交 C7/C8
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-handoff-ledger.md`
- **boundary**：files：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-handoff-ledger.md
- **输出**：HANDOFF 登记清单
- **Knowledge**：decision-log §3.5；只登记不代办
- **verification_role**：N/A — 非行为变更：流程/评估/确认/移交记录
- **paired_task**：N/A — 非行为变更：验证由同批 GREEN 任务承担
- **gate_cmd**：`node -e "const fs=require('fs');const p=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-handoff-ledger.md';const s=fs.readFileSync(p,'utf8');for(const id of ['001','002','003','005','007'])if(!s.includes('HANDOFF-T2-'+id))process.exit(1);if(!/HANDOFF-T2-006.*(closed|superseded|accepted)/i.test(s))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-T42 {"pass": "HANDOFF-T2-001~003/005/007 active handoffs 登记齐；004 不含已删 predecessor，仅保留其余后续治理（如仍适用），HANDOFF-T2-006 以 superseded/accepted closed 单列，且批次交接文件存在"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-handoff-ledger.md
- **STOP**：缺项
- **recovery**：补记录后重做
- **task risk**：低

#### T74

- **ID**：T74
- **Phase**：Phase 5 · 任务级收尾
- **goal**：流程边界取证（AC-FLW-001：主会话/子代理边界与执行入口前置）
- **design_state**：设计已冻结（build-plan 输出）
- **versioned_refs**：spec.md@6f47add9562a3753ca2aed217cd9e91a150e3d6d50dc15d97c562a8f3b338017;plan.md@1d76e0824f41318cf199bd3eb362011839f5ca5bdebbfb572eff566b4eae5d35;decision-log.md@a65f2c17e9d804c54eee094854c5153bda762092e457fa442da7c7b6ffc42bb5
- **输入**：见 plan.md 同批 Phase
- **依赖**：见 plan.md 依赖与并行
- **并行**：无
- **FR**：N/A
- **AC**：AC-FLW-001
- **动作**：抽查 interaction 聚合与问答凭证（按官方契约绑定，task store quality/evidence/interactions/）；子代理失败事实保留检查；每批开工前 worktree 认证与阶段准入核对记录汇总
- **精确文件**：`$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-flow-boundary.md`
- **boundary**：files：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-flow-boundary.md
- **输出**：四项抽查记录
- **Knowledge**：OI-25；执行入口三前置
- **verification_role**：N/A — 非行为变更：流程/评估/确认/移交记录
- **paired_task**：N/A — 非行为变更：验证由同批 GREEN 任务承担
- **gate_cmd**：`node -e "const fs=require('fs');const root=process.env.WORKFLOWHUB_TASK_DIR+'/workflowhub-mechanism-simplification-t2-20260911';const interactions=root+'/quality/evidence/interactions';const evidence=root+'/quality/tests/p5-flow-boundary.md';if(!fs.existsSync(interactions)||fs.readdirSync(interactions).length<1||!fs.existsSync(evidence))process.exit(1);const f=fs.readFileSync(evidence,'utf8');for(const n of ['worktree','K2','question','admission'])if(!f.includes(n))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORA-FLW {"pass": "interaction 聚合非空且抽查记录存在"}`
- **evidence_path**：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-flow-boundary.md
- **STOP**：interaction 证据缺失
- **recovery**：补记录后重做
- **task risk**：低
