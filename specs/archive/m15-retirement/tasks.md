# 任务卡：M15 监控体系退役

- **Input**：`plan.md`（本目录）、`spec.md`、`decision-log.md`
- **Template version**：`plan-task.v3`
- **测试路由预判**：`feature`（单一功能域行为变化，test-routing-advisor 合同；build-code 执行技能 backend-testing）

---

### T-001

- **ID**：T-001
- **Phase**：0
- **goal**：安顿干净基线：无关在制品独立 commit 入库 + 历史数据 sha256 清单落盘
- **design_state**：committed
- **versioned_refs**：decision-log.md@953bf277…c03d、spec.md（当前冻结版）、plan.md（本版）
- **source_refs / decision_refs**：D-007、q-final-stash；AC-RETIRE-003、AC-HISTORY-001（前半）
- **输入**：主工作区 git status（`M runtime/stage/stage-agent-outcome-adapter.mjs`、`D apply/evidence/current-diff-ac-coverage.json`）
- **依赖**：无
- **并行**：否（一切工作的前置）
- **FR**：FR-RETIRE-003、FR-HISTORY-001
- **AC**：AC-RETIRE-003、AC-HISTORY-001
- **动作**：①主工作区把两个无关改动提交为一个独立 commit（仅含这两个改动，message 说明 AC 证据绑定修复）；②记录该 commit 哈希与任务基线 292f3b30a；③对 `~/Knowledge/Projects/workflowhub-monitor-data.js`、`workflowhub-monitor-facts.jsonl`、`workflowhub-monitor.html` 与全部任务目录 facts.jsonl 记录 sha256 清单
- **精确文件**：主工作区两个改动文件（commit 对象，非本 worktree）；证据写入 `quality/tests/baseline-sha256.txt`
- **boundary**：不改任何监控代码；不 push
- **输出**：基线 commit 哈希；哈希清单文件
- **Knowledge**：在制品性质已由 Grill 核实（AC 证据绑定修复，与监控无关）
- **verification_role**：setup
- **paired_task**：T-401（哈希清单的对照方）
- **gate_cmd**：`git -C /Users/Hugh/Hugh/Project/workflowhub status --short && git -C /Users/Hugh/Hugh/Project/workflowhub diff-tree --no-commit-id --name-only -r HEAD`
- **expected_exit**：0 且工作区干净、diff-tree 输出精确为两个目标文件
- **oracle**：ORACLE-CLEAN-BASELINE——工作区干净；HEAD 的父提交为原基线；`diff-tree --no-commit-id --name-only -r HEAD` 输出精确等于 `apply/evidence/current-diff-ac-coverage.json` 与 `runtime/stage/stage-agent-outcome-adapter.mjs` 两个文件，commit message 说明 AC 证据绑定修复
- **evidence_path**：`quality/tests/t001-baseline.log`、`quality/tests/baseline-sha256.txt`
- **STOP**：在制品内容与 Grill 核实结论不符（出现第三个改动文件或内容不无关）→ STOP 回 build-plan
- **recovery**：未 push，reset 即可
- **task risk**：低；误提交无关内容会污染拆除 diff 可审性
- **test tier/method**：simple / git 状态检查
- **scenarios**：SCN-001 前置
- **fixtures**：N/A
- **coverage limits**：不验证在制品修复本身的正确性（非本任务范围）

#### 完成区

- **status**：completed
- **实际改动**：主工作区两个已核实无关在制品以一个独立 commit `fae3ab5dc617472b7b4f800258779983d3056780` 入库；任务 worktree 未改动；记录 35 个仓外历史 facts/monitor 文件的 SHA-256 基线。
- **commands/exits**：`git status --short --branch`（0，main 与 task worktree 均 clean）；`git diff-tree --no-commit-id --name-only -r fae3ab5dc617472b7b4f800258779983d3056780`（0，精确 2 文件）；`git diff --check`（0）；`shasum -a 256 -c quality/tests/baseline-sha256.txt`（0，35/35 OK）。
- **evidence refs**：`quality/tests/t001-baseline.log`、`quality/tests/baseline-sha256.txt`、`quality/tests/t001-unrelated-commit.patch`、`quality/evidence/build-code/P0-phase-card.json`、`quality/evidence/build-code/P0-runtime-material-bootstrap.json`、`quality/reviews/results/build-code-P0-7f3798ebb49cb65e38b39e496967cad3a8f63268c34a2c74161515c32fcf0245.json`
- **covered ACs**：AC-RETIRE-003、AC-HISTORY-001（基线部分）
- **review fact**：异源 `wh-review` 可用；`kimi/coding` 与 `codex/luna` 均完成；4 个 major finding 已按原事实逐项修复并复核证据，未改写为 provider pass。
- **completion time**：2026-08-30T10:04:15Z
- **执行事实**：commit 成功但 Git 自动 gc 因历史坏对象输出错误；未 push，目标树、提交内容、任务 worktree 隔离性与 35 个历史文件哈希校验均通过；无关在制品本身正确性不在本任务范围。

---

### T-201

- **ID**：T-201
- **Phase**：1
- **goal**：摘除 stage-runtime 监控段 + 整删 evidence 监控四件套
- **design_state**：committed
- **versioned_refs**：同 T-001
- **source_refs / decision_refs**：D-002、附录 A、DEC-002；AC-RETIRE-001
- **输入**：附录 A 摘除清单；T-001 基线
- **依赖**：T-001
- **并行**：否（与 T-202 同阶段串行，先摘引用方）
- **FR**：FR-RETIRE-001
- **AC**：AC-RETIRE-001
- **动作**：⓪**RED 前置**：先给 `tests/integration/vnext-official-stage-run.test.mjs` 加负向断言（stage run 后 facts.jsonl 无监控 kind、无快照产出），运行并录 `quality/tests/red-t302.log`（此时监控副作用存在，断言必须失败）；①stage-runtime.mjs 摘除 normalizeCodexRollout / resolveDefaultMonitoringSource / outcomeCostFacts / runMonitoringSidecar 及 run 主路径两处调用与相关 import；②**task-store.mjs 同步下沉**：监控分类器改为行内 schema_version 字符串判断（:113-129、:325），删除 appendMonitoringFacts/readMonitoringFacts——与③同原子步，不得先删文件留 import（两盲审 blocking：ESM 静态解析崩溃）；③删除 monitoring-facts/diagnostics/projector/page.html 四文件；④doctor 冒烟验证加载正常
- **精确文件**：`tools/cli/stage-runtime.mjs`、`runtime/task/task-store.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`（仅加负向断言）；DELETE：`runtime/evidence/monitoring-facts.mjs`、`monitoring-diagnostics.mjs`、`monitoring-projector.mjs`、`monitoring-page.html`
- **boundary**：不动 adapter/fact-collector/dsh-transcript（T-202）；不动 session-event/session-hook
- **输出**：摘除后的 stage-runtime；四个删除
- **Knowledge**：projector 硬依赖 facts/diagnostics（Grill 纠缠一），四件必须同批删；run 主路径两处调用点是唯一 stage 触发口
- **verification_role**：producer
- **paired_task**：T-302（负向断言验证者）
- **gate_cmd**：`node tools/cli/stage-runtime.mjs doctor --action=workspace --project=workflowhub --task=m15-retirement`
- **expected_exit**：0（加载与 doctor 正常；若该子命令签名不符则以等价加载冒烟替代并在完成区记录真实命令）
- **oracle**：ORACLE-NO-MONITOR-SIDE-EFFECT 前置——stage-runtime 源码无监控符号、模块加载正常
- **evidence_path**：`quality/tests/t201-doctor.log`
- **STOP**：摘除后 stage-runtime 加载报错且无法在本卡边界内修复 → STOP 回 build-plan
- **recovery**：git restore 到 T-001 基线
- **task risk**：高——run 主路径手术，误伤会影响全部五阶段公共行为
- **test tier/method**：feature / 模块加载冒烟 + 后续套件
- **scenarios**：SCN-001、SCN-004
- **fixtures**：N/A
- **coverage limits**：不验证自记录细节（T-202/T-301/T-302 负责）

#### 完成区

- **status**：completed
- **实际改动**：stage-runtime 移除监控源/sidecar/投影与缺失结果 fallback；task-store 移除 appendMonitoringFacts/readMonitoringFacts 并将历史行分类下沉为行内 schema_version 判断；monitoring-facts、monitoring-diagnostics、monitoring-projector、monitoring-page.html 四文件删除；integration 负向断言先行写入并在配对修复后改用通用 facts 读接口。
- **commands/exits**：T-302 RED 前置 targeted vitest=1（79 条监控事实断言失败）；doctor=0；node module checks=0；git diff --check=0；T-302 negative assertion repair targeted vitest=0。
- **evidence refs**：quality/evidence/build-code/P1-phase-card.json；quality/tests/red-t302.log；quality/tests/t201-doctor.log；quality/tests/p1-review-fix-t302.log；quality/evidence/build-code/P1-review-repair-supplement.json。
- **covered ACs**：AC-RETIRE-001=partial（P1 生产引用清零，最终全仓扫描待 T-401）；AC-RETIRE-002=partial（配对负向断言已 GREEN，完整集成套件待 T-302 收尾）。
- **review fact**：build-code P1 wh-review available；kimi/coding 与 codex/luna 均 completed；3 条 finding 已逐条 fixed，原始 provider 事实保留，不能改写为 provider pass。
- **completion time**：2026-08-30T10:49:00Z
- **执行事实**：实际删除四件套并验证模块加载；P1-review 初始 packet 漏列删除 hunk，已用 supplement 补足直接删除证据；stage outcome/review 显式 usage 合同保留，非 M15 transcript usage 未误删。

---

### T-202

- **ID**：T-202
- **Phase**：1
- **goal**：共享文件保留区修剪 + session-state 摘 token 统计（task-store 下沉已在 T-201 原子步执行）
- **design_state**：committed
- **versioned_refs**：同 T-001
- **source_refs / decision_refs**：D-002、附录 A、DEC-001；AC-PRESERVE-001/002（DEC-002 由 T-201 执行）
- **输入**：T-201 完成；附录 A 保留符号清单
- **依赖**：T-201
- **并行**：否
- **FR**：FR-PRESERVE-001、FR-PRESERVE-002
- **AC**：AC-PRESERVE-001、AC-PRESERVE-002、AC-RETIRE-001
- **动作**：⓪**usage 消费者普查**：`grep -rn "event.usage\|\.usage" tools/ runtime/ tests/`，证明唯一消费者是监控 cost 归因（同删），证据落 `quality/tests/t202-usage-census.log`；发现非监控消费者 → STOP；①codex-transcript-adapter.mjs 修剪至 isAuthenticatedRequirementResult / parseRegisteredRequirementTranscript / createRegisteredCodexSource（及它们的内部依赖）；②fact-collector.mjs 修剪至 authenticateRegisteredRequirementMessages / isTranscriptSourceReader / createTranscriptSourceReader；③dsh-transcript.mjs 修剪至需求快照/路径函数子集；④session-state.mjs 删 tokenUsageBetween(:429-453) 与 finishCodexSessionEvent(:658) 的 event.usage 行；⑤完成点运行 T-301 gate 录 `quality/tests/red-t301.log`
- **精确文件**：`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/evidence/fact-collector.mjs`、`runtime/evidence/dsh-transcript.mjs`、`tools/host/workflowhub-codex-session-state.mjs`
- **boundary**：只删监控符号；保留区符号与其行为一字不动；不改 import 路径（消费方零改动）
- **输出**：修剪后的五个文件；自记录功能保持
- **Knowledge**：保留符号消费方清单见附录 A（stage-agent-outcome-adapter.mjs:17,356、stage-runtime.mjs:448、tests/helpers/stage-outcome.mjs:8、session-state.mjs:26,258-269）
- **verification_role**：producer
- **paired_task**：T-301
- **gate_cmd**：`npx vitest run tests/m15-codex-session-hook.test.mjs tests/dsh-transcript.test.mjs`
- **expected_exit**：非零（此时测试尚未改造，监控断言引用已删符号而失败——这是预期 RED，日志落 `red-t301.log`）；关键核对点：失败只能来自监控断言引用缺失，不能来自自记录用例
- **oracle**：ORACLE-EVENT-NO-USAGE（RED 侧）；自记录用例在改造前不得因本卡改动而失败
- **evidence_path**：`quality/tests/t202-trim.log`
- **STOP**：保留符号无法行级分离（耦合超预期）→ STOP 回 build-plan（DEC-001 fallback）
- **recovery**：git restore
- **task risk**：高——五个共享文件手术；PLAN-RISK-001 主战场
- **test tier/method**：feature / 定向 vitest
- **scenarios**：SCN-001、SCN-005
- **fixtures**：tests/helpers/stage-outcome.mjs 既有 fixture
- **coverage limits**：codex 宿主完整验证延期（OPEN-101）

#### 完成区

- **status**：completed
- **实际改动**：codex-transcript-adapter 与 fact-collector 修剪为需求认证/注册源保留区；stage-runtime 的 Codex/DSH source reader 仅输出冻结需求消息；session-state 删除 tokenUsageBetween、event.usage 生成与投影；DSH 需求快照/路径与 generic task facts 保留。
- **commands/exits**：usage census post-trim=0 退休 session/transcript usage refs（命令本身=0）；backend-testing 定向 vitest=0（3 files/30 tests）；T-301 RED gate=1，失败仅为待迁移旧 source import/usage assertion；node module checks=0。
- **evidence refs**：quality/evidence/build-code/P1-test-strategy.json；quality/tests/t202-usage-census.log；quality/tests/t202-trim.log；quality/tests/t202-backend.log；quality/tests/red-t301.log。
- **covered ACs**：AC-PRESERVE-001=partial（generic facts/stage outcome/verify facts 30/30；需求认证专测仍待 T-301 GREEN）；AC-PRESERVE-002=partial（DSH 当前宿主 unavailable 边界保留，Codex 完整验证 OPEN-101 延期）；AC-RETIRE-001=partial（最终零引用扫描待 T-401）。
- **review fact**：同 P1 wh-review；3 条 finding 均已 fixed；usage census 已按 finding 要求重跑并保留剩余独立 usage 合同分类。
- **completion time**：2026-08-30T10:49:00Z
- **执行事实**：没有删除 stage-agent-outcome-adapter 或 review-record-route 的显式 usage 输入；它们不是 session event token 统计消费者。自记录相关代码未因共享文件修剪而发生模块加载错误。

---

### T-203

- **ID**：T-203
- **Phase**：2
- **goal**：schema/孤儿 CLI/空 config 删除 + 登记表与 move-map 同步
- **design_state**：committed
- **versioned_refs**：同 T-001
- **source_refs / decision_refs**：D-002、附录 A；AC-RETIRE-001/002
- **输入**：T-201/T-202 完成
- **依赖**：T-202
- **并行**：否
- **FR**：FR-RETIRE-001
- **AC**：AC-RETIRE-001、AC-RETIRE-002
- **动作**：①删两个 monitoring schema、collect-task-facts.mjs、三个空 config registry；②check-task-record-paths.mjs 删监控登记项（:81-82/:99/:226 附近）；③move-map.json 监控条目（:1620-1625/:1638-1661 附近）登记为已退役
- **精确文件**：DELETE：`runtime/schemas/monitoring-fact.v1.json`、`monitoring-projection.v1.json`、`tools/cli/collect-task-facts.mjs`、`config/transcript-sources.mjs`、`config/runtime-fact-sources.mjs`、`config/runtime-fact-v2-sources.mjs`；MODIFY：`tools/cli/check-task-record-paths.mjs`、`docs/architecture/move-map.json`
- **boundary**：不动其他 config/schema
- **输出**：六个删除 + 两个登记更新
- **Knowledge**：三 config 唯一引用者是 collect-task-facts.mjs（Grill 核实），须同批删
- **verification_role**：producer
- **paired_task**：T-401
- **gate_cmd**：`npm run check`
- **expected_exit**：0
- **oracle**：ORACLE-SUITE-GREEN（结构检查部分）
- **evidence_path**：`quality/tests/t203-check.log`
- **STOP**：check 出现非监控相关失败 → STOP 排查误删
- **recovery**：git restore
- **task risk**：中——登记类文件格式错误会破坏 check
- **test tier/method**：simple / 结构检查
- **scenarios**：SCN-004
- **fixtures**：N/A
- **coverage limits**：不验证运行时行为（Phase 3 负责）

#### 完成区

- **status**：completed
- **实际改动**：删除 `runtime/schemas/monitoring-fact.v1.json`、`runtime/schemas/monitoring-projection.v1.json`、`tools/cli/collect-task-facts.mjs`、`config/transcript-sources.mjs`、`config/runtime-fact-sources.mjs`、`config/runtime-fact-v2-sources.mjs`；删除 `check-task-record-paths.mjs` 中三处已退役监控登记；move-map 将累计已删除的 10 个 M15/采集路径登记为 `deleted-final-cleanup`，补登记三项 config 与仓内页面模板，保留 T-300 五个尚存测试条目的当前登记和删除条件。
- **commands/exits**：`node --check` 变更 JS=0；move-map/evidence JSON parse=0；六个 P2 删除路径均不存在=0；P2 生产 consumer allowlist assertion=0；保留模块直接加载=0；generic backend tests=30/30；`git diff --check`=0；`node tools/cli/check-task-record-paths.mjs`=1（与 baseline main 相同的 7 条非 M15 失败）；`npm run check`=1（markdownlint、既有结构/技能包基线问题，已原样记录）。
- **evidence refs**：`quality/evidence/build-code/P2-phase-card.json`；`quality/evidence/build-code/P2-test-strategy.json`；`quality/evidence/build-code/P2-review-repair-supplement.json`；`quality/tests/t203-check.log`；`quality/tests/t203-backend.log`；`quality/tests/p2-consumer-scan.log`；`quality/tests/p2-diff-scan.log`。
- **covered ACs**：AC-RETIRE-001=partial（P2 删除路径、生产引用与 move-map 累计登记完成；最终全仓零引用待 T-401）；AC-RETIRE-002=partial（P2 结构/引用断言与 30/30 邻接回归通过；纯监控测试待 T-300）；未把 repository-wide baseline failure 伪造为通过。
- **review fact**：独立 wh-review available，`kimi/coding` + `codex/luna` 两个 provider，3 条 major finding；3/3 已 fixed，原始结果与 repair supplement 均保留；provider available 不等于质量通过。
- **completion time**：2026-08-30T11:08:00Z
- **执行事实**：P2 未改其他 config/schema；五个 T-300 纯监控测试仍存在，避免跨阶段删除；历史 `repository-inventory.tsv` 仅为只读登记，不是运行时 consumer；task-store 的 `monitoring-fact.v1` 仅保留 DEC-002 允许的历史只读分类字符串。

---

### T-300

- **ID**：T-300
- **Phase**：3
- **goal**：整删五个纯监控测试文件（FND-301：必须有任务认领）
- **design_state**：committed
- **versioned_refs**：decision-log.md@953bf277…c03d、spec.md（冻结版）、plan.md（评审修复版）
- **source_refs / decision_refs**：D-002、附录 A；AC-RETIRE-002（测试清单受控）
- **输入**：T-201/T-202/T-203 完成（生产侧已摘除）
- **依赖**：T-203
- **并行**：否（判定口径防污染，见 gate_cmd；F-5）
- **FR**：FR-RETIRE-001
- **AC**：AC-RETIRE-002
- **动作**：删除 `tests/m15-monitoring-facts.test.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/m15-monitoring-projector.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-integration.test.mjs`；产出测试清单 diff 供 T-401 核对
- **精确文件**：上述五个测试文件（DELETE）
- **boundary**：只删附录 A 列明的五个；任何第六个文件 = 越界 STOP
- **输出**：五个删除 + `quality/tests/t300-test-inventory-diff.log`
- **Knowledge**：附录 A 为唯一权威清单
- **verification_role**：deletion
- **paired_task**：T-401（清单核对者）
- **gate_cmd**：`git status --porcelain tests/`（在本卡删除落盘后、T-301/T-302 改动落盘前执行——本卡相对它们显式串行，防并行污染判定）
- **expected_exit**：0 且输出中 status=D 的文件集合精确等于附录 A 列明的五个测试文件（基线哈希 292f3b30a 由 T-001 证据记录）
- **oracle**：ORACLE-SUITE-GREEN 前置——删除集合受控
- **evidence_path**：`quality/tests/t300-test-inventory-diff.log`
- **STOP**：diff 出现清单外文件 → STOP 回 build-plan
- **recovery**：git restore
- **task risk**：低
- **test tier/method**：simple / 清单核对
- **scenarios**：SCN-004
- **fixtures**：N/A
- **coverage limits**：不改造混测（T-301/T-302 负责）

#### 完成区

- **status**：completed
- **实际改动**：精确删除附录 A 五个纯 M15 测试文件；未删除清单外测试；同步 move-map 五条测试路径为 `deleted-final-cleanup`。
- **commands/exits**：`git status --porcelain tests/` 受控删除集合=0（除既有 T-302 integration 修改）；附录 A 精确集合核对=0。
- **evidence refs**：`quality/tests/t300-test-inventory-diff.log`；`quality/tests/p3-diff-scan.log`。
- **covered ACs**：AC-RETIRE-002=partial（删除集合与登记完成；完整集成 gate 的既有失败保留在 T-302 事实中）。
- **review fact**：P3 独立 wh-review 可用；无针对 T-300 删除集合的新未处置 finding。
- **completion time**：2026-08-30T11:45:00Z
- **执行事实**：五个删除路径均不存在；P3 没有改生产代码；move-map 中 M15/collection 相关 15 条 `deleted-final-cleanup` 源路径全部不存在。

---

### T-301

- **ID**：T-301
- **Phase**：3
- **goal**：session-hook 测试改造：摘除监控断言、保留自记录覆盖、落地 ORACLE-EVENT-NO-USAGE
- **design_state**：committed
- **versioned_refs**：同 T-001
- **source_refs / decision_refs**：D-002、FR-PRESERVE-002；AC-PRESERVE-002
- **输入**：T-202 完成（符号已摘除）
- **依赖**：T-202
- **并行**：可与 T-302 并行（不同文件）
- **FR**：FR-PRESERVE-002
- **AC**：AC-PRESERVE-002
- **动作**：改造 `tests/m15-codex-session-hook.test.mjs`、`tests/helpers/stage-outcome.mjs` 与 `tests/dsh-transcript.test.mjs`：删监控相关断言与 import，迁移到保留区符号；新增/保留断言：事件体不含 usage 字段、事件记录本体正常、需求快照用例保留
- **精确文件**：`tests/m15-codex-session-hook.test.mjs`、`tests/helpers/stage-outcome.mjs`、`tests/dsh-transcript.test.mjs`
- **boundary**：不改生产代码；自记录相关用例数不减少
- **输出**：改造后测试转 GREEN
- **Knowledge**：该文件 841 行混测（Grill 核实）；helper 被 8 个非监控测试依赖
- **verification_role**：RED/GREEN pair 1
- **paired_task**：T-202
- **gate_cmd**：`npx vitest run tests/m15-codex-session-hook.test.mjs tests/dsh-transcript.test.mjs`
- **expected_exit**：RED（T-202 完成点已录得，同命令）→ GREEN 0
- **oracle**：ORACLE-EVENT-NO-USAGE——事件体无 usage 且自记录用例全绿
- **evidence_path**：`quality/tests/red-t301.log`、`quality/tests/green-t301.log`
- **STOP**：自记录用例无法在不改生产代码的前提下转绿 → STOP 回 build-plan
- **recovery**：git restore
- **task risk**：中——helper 改造波及 8 个非监控测试
- **test tier/method**：feature / 定向 vitest
- **scenarios**：SCN-005
- **fixtures**：helper 既有 fixture
- **coverage limits**：DSH 宿主 unavailable 语义不在这条 RED/GREEN 内（AC-PRESERVE-002 在 FINAL 核对）

#### 完成区

- **status**：completed
- **实际改动**：`tests/m15-codex-session-hook.test.mjs` 与 `tests/dsh-transcript.test.mjs` 改用保留的 `resolveRequirementSource`；session event 断言不再接受 `usage`；需求快照与自记录覆盖保留。
- **commands/exits**：`npx vitest run tests/m15-codex-session-hook.test.mjs tests/dsh-transcript.test.mjs`=0，2 files/40 tests passed。
- **evidence refs**：`quality/tests/green-t301.log`；`quality/evidence/build-code/P3-test-strategy.json`。
- **covered ACs**：AC-PRESERVE-002=partial（40/40 focused green；DSH unavailable-host 语义仍是最终边界事实）。
- **review fact**：P3 独立 wh-review 1 条环境隔离 finding 已 fixed；无自记录覆盖减少。
- **completion time**：2026-08-30T11:45:00Z
- **执行事实**：没有改生产代码；原始 `token_count` fixture 仅用于证明不投影到 semantic event，事件本体仍可正常记录。

---

### T-302

- **ID**：T-302
- **Phase**：3
- **goal**：integration 测试与 dsh-transcript 测试改造：落地监控副作用负向断言
- **design_state**：committed
- **versioned_refs**：同 T-001
- **source_refs / decision_refs**：D-002、FND-206；AC-RETIRE-002
- **输入**：T-201/T-202/T-203 完成
- **依赖**：T-203
- **并行**：否（判定口径防污染，见 gate_cmd；F-5）
- **FR**：FR-RETIRE-001、FR-PRESERVE-001
- **AC**：AC-RETIRE-002、AC-PRESERVE-001
- **动作**：（RED 已在 T-201 ⓪前置完成：负向断言已加入且 `red-t302.log` 已录，与本卡 gate 同一命令）本卡收尾：摘监控断言（:27 import readMonitoringFacts、:19/:311/:1016 附近），保留负向断言并确认其转 GREEN；`tests/dsh-transcript.test.mjs` 改造已移至 T-301（保证 RED/GREEN 同命令）
- **精确文件**：`tests/integration/vnext-official-stage-run.test.mjs`
- **boundary**：不改生产代码；自记录用例数不减少
- **输出**：两测试改造后转 GREEN，负向断言生效
- **Knowledge**：负向断言是 FND-206 的直接修复
- **verification_role**：RED/GREEN pair 2
- **paired_task**：T-201
- **gate_cmd**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs`
- **expected_exit**：RED（改造前负向断言失败）→ GREEN 0
- **oracle**：ORACLE-NO-MONITOR-SIDE-EFFECT
- **evidence_path**：`quality/tests/red-t302.log`、`quality/tests/green-t302.log`
- **STOP**：负向断言在正确摘除后仍失败（说明有未知监控触发路径）→ STOP 回 build-plan
- **recovery**：git restore
- **task risk**：中
- **test tier/method**：feature / 集成测试
- **scenarios**：SCN-001、SCN-004
- **fixtures**：integration 测试既有临时任务 fixture
- **coverage limits**：不覆盖真实仓外数据（用临时目录）

#### 完成区

- **status**：completed
- **实际改动**：保留 official stage-run 无监控副作用负向测试；隔离五个 transcript/source discovery 环境变量；断言 CLI 实际消费 `outcome.ref` 并返回 completed build-spec；facts 与外部 monitoring 目录仍无副作用。
- **commands/exits**：完整 `npx vitest run tests/integration/vnext-official-stage-run.test.mjs`=1（40 passed/6 unrelated failures）；新增 oracle 定向命令=0（1 passed/45 skipped）。
- **evidence refs**：`quality/tests/green-t302.log`；`quality/evidence/build-code/P3-review-repair-supplement.json`；`quality/tests/p3-diff-scan.log`。
- **covered ACs**：AC-RETIRE-002=partial、AC-PRESERVE-001=partial（改变的 no-monitor oracle 完成；完整文件的六个既有契约失败未改写为通过）。
- **review fact**：P3 独立 wh-review 2 个 provider 可用；3 条 actionable finding fixed，1 条因当前生产 consumer 已退役而 `rejected_invalid`；原始结果保留。
- **completion time**：2026-08-30T11:45:00Z
- **执行事实**：完整集成文件失败集中在四个 analyzer fixture convergence gap、一个当前 clarify gap 预期和一个 quality fact 数量预期；这些不在 P3 测试改造变更内。新增负向 oracle 已在修复后 exit=0，未改生产代码。

---

### T-303

- **ID**：T-303
- **Phase**：4
- **goal**：仓外页面加"已退役"静态提示条
- **design_state**：committed
- **versioned_refs**：同 T-001
- **source_refs / decision_refs**：D-003、FND-106；FR-PAGE-001/002
- **输入**：代码侧全绿（T-301/T-302 完成）
- **依赖**：T-001（哈希清单）、T-301、T-302（串行：代码若回滚，页面不留退役提示）
- **并行**：否（FND-308）
- **FR**：FR-PAGE-001、FR-PAGE-002
- **AC**：AC-PAGE-001、AC-PAGE-002
- **动作**：①记录 html 原 sha256，并把**原始字节备份**到 `quality/tests/t303-monitor-html.backup.html`（哈希只用于校验不作恢复手段）；②在 `<body>` 顶部插入静态提示条（纯文本+内联样式，无脚本），文案："本监控面板已退役，数据冻结于退役时点，后续由离线复盘器任务重建"；③记录新 sha256；④浏览器打开验证渲染正常、提示可见、原数据展示不变；⑤恢复校验：确认备份字节 sha256 与原值一致
- **精确文件**：`~/Knowledge/Projects/workflowhub-monitor.html`（仓外）
- **boundary**：只改 html 一个文件；不动 data.js / facts.jsonl
- **输出**：带提示条的冻结页面
- **Knowledge**：页面自包含已实测（PFACT-02），`<script src="workflowhub-monitor-data.js">` 在 :239 行附近
- **verification_role**：acceptance
- **paired_task**：T-401
- **gate_cmd**：`shasum -a 256 ~/Knowledge/Projects/workflowhub-monitor.html`（改动前后各一次）
- **expected_exit**：0（两次哈希不同且均记录）
- **oracle**：AC-PAGE-001/002 浏览器观察
- **evidence_path**：`quality/tests/t303-page.log`（含前后 sha256 与观察记录）
- **STOP**：提示条插入后页面渲染破坏 → 恢复原字节并 STOP
- **recovery**：写回原字节
- **task risk**：低
- **test tier/method**：simple / 浏览器人工观察
- **scenarios**：SCN-002
- **fixtures**：N/A
- **coverage limits**：不做页面内容重做（任务 B）

#### 完成区

- **status**：completed
- **实际改动**：仅修改仓外 `workflowhub-monitor.html`：在 `<body>` 顶部加入无脚本静态退役提示条；中间尝试的桌面页面高度调整已恢复，最终差异只有提示条；`workflowhub-monitor-data.js` 与 `workflowhub-monitor-facts.jsonl` 未改。
- **commands/exits**：原 html sha256=`566679483c9de5b855babc42f4181505a04c2456bd9dd1776d40faf33edb876a`；新 sha256=`c368dd2975e6718c5d577e7a723023a30b57157a39ad930ffbb154ce0c06c171`；浏览器复验 DOM 加载=0，data script count=1；备份 sha256 与原值一致。
- **evidence refs**：`quality/tests/t303-page.log`；`quality/tests/t303-monitor-html.backup.html`；截图 `/tmp/workflowhub-monitor-retired.png`。
- **covered ACs**：AC-PAGE-001=met（静态文案可见、无脚本）；AC-PAGE-002=met（原数据展示仍为快照 8/30 16:33、共 78 个任务；data/facts 哈希不变）。
- **review fact**：浏览器使用 `agent-browser`，session `codex-qa-workflowhub-m15-retirement`，未复用登录态；清理完成，残留进程与临时目录均为 0。
- **completion time**：2026-08-30T12:46:15Z
- **执行事实**：已保存原始 HTML 字节备份；页面复验截图显示提示条位于顶端且页面正常渲染；最终只允许的仓外 HTML 文件发生变化。

---

### T-401（FINAL 聚合验证卡）

- **ID**：T-401
- **Phase**：FINAL
- **goal**：八条 AC 的证据全量归档
- **design_state**：committed
- **versioned_refs**：同 T-001
- **source_refs / decision_refs**：D-005；spec §8 全部 AC
- **输入**：T-201~T-303 全部完成
- **依赖**：T-201、T-202、T-203、T-300、T-301、T-302、T-303
- **并行**：否（收尾）
- **FR**：全部
- **AC**：全部
- **动作**：①`npm test && npm run check`；②零引用扫描（plan Test Strategy 的扩展 grep 命令，15 个符号 × runtime/tools/workflows/config/tests/core/scripts/package.json，退出码 1 为零命中；move-map 退役登记与历史文档文字引用属白名单）；③sha256 比对（对照 T-001 清单，html 豁免并核对新哈希）；④抽样读取 3 个代表性旧任务 facts.jsonl + 仓外 facts.jsonl 头几行，验证可解析只读；⑤测试清单 diff 对照附录 A；⑥真实任务逐项断言（本任务 verify-code 阶段即载体：需求认证/快照/事件/stage 结果/事实读写逐项标注；DSH 下会话事件 unavailable 诚实标注）；⑦页面浏览器观察记录
- **精确文件**：证据写入 `quality/tests/final-*.log`
- **boundary**：只产生证据，不改代码
- **输出**：AC 证据矩阵
- **Knowledge**：任何证据缺失=不宣称完成（宪法）
- **verification_role**：aggregate
- **paired_task**：无（最终卡）
- **gate_cmd**：`npm test && npm run check`
- **expected_exit**：0
- **oracle**：ORACLE-SUITE-GREEN + ORACLE-ZERO-REF + ORACLE-HISTORY-INTACT + 逐项断言记录
- **evidence_path**：`quality/tests/final-suite.log`、`final-zeroref.log`、`final-history.log`、`final-acceptance-matrix.md`
- **STOP**：任一 AC 无证据 → STOP 回 build-code，不宣称完成
- **recovery**：N/A（只读证据）
- **task risk**：低
- **test tier/method**：feature / 全量套件+扫描+人工观察
- **scenarios**：SCN-001~005 全量
- **fixtures**：N/A
- **coverage limits**：codex 宿主完整验证除外（OPEN-101 延期，不计入本任务完成宣称）

#### 完成区

- **status**：completed
- **实际改动**：生成并重跑 T-401 聚合证据；后续 build-code 修复与页面复验均保留在 `final-repair-targeted.log`、T-303 与终审 repair supplement 中。
- **commands/exits**：`npm test`=1（safe suite：31 failed files/143 passed files，123 failed tests/1723 passed tests/24 skipped，961.63s）；`npm run check`=1（markdownlint 22 errors）；可执行零引用 oracle=0 且无匹配；历史校验=1（仅仓外 HTML 允许例外，其余 baseline entries=OK）；抽样 JSONL 解析=0；页面复验见 T-303。
- **evidence refs**：`quality/tests/final-suite.log`；`quality/tests/final-repair-targeted.log`；`quality/tests/final-zeroref.log`；`quality/tests/final-history.log`；`quality/tests/final-acceptance-matrix.md`。
- **covered ACs**：AC-RETIRE-001=met；AC-RETIRE-002=not_met（仓库既有全量套件与静态检查未绿）；AC-RETIRE-003=met；AC-PRESERVE-001=partial；AC-PRESERVE-002=met with OPEN-101 defer；AC-PAGE-001/002=met；AC-HISTORY-001=met。
- **review fact**：最终聚合事实不替代独立实现审查；保留 `npm test`/`npm run check` 失败，不改写为通过。
- **completion time**：2026-08-30T12:46:15Z
- **执行事实**：聚合证据已按最终修复快照更新；原始需求的总体 acceptance 仍未宣称完成，下一步执行 build-code 阶段末独立复审与 stage-end-spec-analyze，再按标准进入 verify-code。
  - [human-alignment｜append-only] build-plan 阶段用户确认：「接受，请收尾吧，但是不要进入build-code，等我通知」（2026-08-30）；确认事实 quality/confirmations/920212875fad529f5d92ad9c1c5294958f482801e415d67d5b501ab2963ca1f5.json。本记录不改变 status 与完成判定。


## 终检 spec-analyze 处置（step 11）

- 执行事实：独立终检初判 incomplete（2 HIGH + 4 MEDIUM + 3 LOW）。
- 处置：F-1 fixed（保留区补 createRegisteredCodexSource/createTranscriptSourceReader 两个真实消费工厂函数，decision-log 附录 A/plan/tasks 三处同步）；F-2 fixed（T-301 收编 dsh-transcript 测试使 RED/GREEN 同命令；T-302 单文件命令）；F-3 fixed（T-202 goal 陈旧文本清扫，DEC-002 归 T-201）；F-4 fixed（T-401 依赖补 T-300）；F-5 fixed（T-300 改 porcelain 判定+显式串行+基线来源）；F-6 fixed（decision-log DEF-001/003/004 补关闭条件）；F-7 fixed（成功边界①白名单表述消矛盾）；F-8 fixed（plan 白名单删不命中项）；F-9 fixed（追溯表 T-303 表述）。
- 复查：无遗留 HIGH/MEDIUM；终检结论 **complete**。
