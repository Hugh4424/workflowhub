# 任务清单：workflowhub close 机制修复与框架减法

> 由 plan.md 导出。每条任务独立可验证，失败时返回对应 STOP 条件。

## 任务列表

### T0-RED. close 机制行为变更测试 RED

- **ID**: T0
- **Phase**: build-code
- **goal**: 在修复前证明 close 行为测试当前失败。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-close-001]
- **输入**: `tests/close/close-contract.test.mjs` 草案；当前 close 实现。
- **依赖**: []
- **并行**: []
- **FR**: FR-CLOSE-001、FR-CLOSE-002
- **AC**: AC-02
- **动作**: 先创建 `tests/close/close-contract.test.mjs` 草案（覆盖五动作 + 一次确认绑定 + 五动作按 commit→merge→archive→push→cleanup 强制顺序执行并落账 + 恒 risk 入口不可达断言），再运行 close contract 测试，预期因行为未实现而失败。
- **精确文件**: `tests/close/close-contract.test.mjs`
- **boundary**: 只创建测试并记录 RED 事实；不改 close 实现；finalize/断点续跑用例由 T5 补充并按 RED→GREEN 执行。
- **输出**: 测试文件存在且可运行；退出码非 0；失败原因来自行为断言（而非文件缺失或语法错误），记录为 RED 证据。
- **Knowledge**: F9 要求行为变更先 RED 再 GREEN。
- **verification_role**: RED
- **paired_task**: T12
- **gate_cmd**: `npx vitest run tests/close/close-contract.test.mjs`
- **expected_exit**: 1
- **oracle**: 测试文件已创建且语法可运行；失败输出显示行为断言不通过（恒 risk 入口仍存在、existing 模式被拒绝），证明 RED 来自行为而非环境。
- **evidence_path**: `tests/close/close-contract.test.mjs`
- **STOP**: 若测试意外通过，说明 close 已修复或测试错误，重新评估。
- **recovery**: 删除该任务并保留 RED 事实。
- **task risk**: 测试文件不存在导致环境失败而非行为失败。

### T1. 实现 DSH transcript 读取与会话绑定

- **ID**: T1
- **Phase**: build-code
- **goal**: 让 workflowhub 能读取 DSH 多帧 zstd transcript 并从中认证需求消息。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-port-001]
- **输入**: 决策阶段的需求消息哈希；DSH 会话 ID；~/.dsh/sessions 路径。
- **依赖**: []
- **并行**: []
- **FR**: FR-PORT-001、FR-SUB-002
- **AC**: AC-06
- **动作**: 新增 `runtime/evidence/dsh-transcript.mjs`，修改 `tools/host/workflowhub-codex-session-state.mjs` 与 `tools/cli/stage-runtime.mjs`；在 `CONTEXT.md` 增补 host 声明机制说明，明确可执行契约字段：宿主经环境变量（DSH_SESSION_ID 映射 CODEX_SESSION_ID）声明会话身份；transcript 路径约定 `~/.dsh/sessions/<cwd 编码>/<session-id>/session.jsonl.zstd`；会话经 session locator 校验身份与 cwd 绑定；认证消息从 transcript 提取用户文本消息并冻结内容哈希；非 Codex 宿主经同一 `registerCodexSession` 钩子进入 bootstrap。
- **精确文件**: `runtime/evidence/dsh-transcript.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`tools/cli/stage-runtime.mjs`、`CONTEXT.md`
- **boundary**: 只解析 DSH transcript 并生成 requirement_message JSONL；不实现 DSH reviewer adapter。
- **输出**: DSH transcript 解析通过 `tests/dsh-transcript.test.mjs`；make-decision 需求快照可被 DSH 宿主修复；CONTEXT.md 含 host 声明机制说明。
- **Knowledge**: DSH transcript 是多帧 zstd JSONL；`zstdDecompressSync` 只读首帧。
- **verification_role**: test
- **paired_task**: T2
- **gate_cmd**: `npx vitest run tests/dsh-transcript.test.mjs`
- **expected_exit**: 0
- **oracle**: 全部 9 个测试通过，包含多帧 walking、用户消息过滤、会话绑定、空快照修复。
- **evidence_path**: `tests/dsh-transcript.test.mjs`
- **STOP**: 若 DSH 解析失败，停止 close 核心改动，先修 transcript。
- **recovery**: 回退新增文件并恢复 Codex-only 路径。
- **task risk**: DSH 会话路径编码与真实环境不一致。

### T2. 修复决策收敛检查支持非 Codex 宿主

- **ID**: T2
- **Phase**: build-code
- **goal**: 当认证消息缺少 message_class 字段时，从 coverage 输出推导类别，不阻塞 stage 收尾。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-port-001]
- **输入**: `requirementCoverageOutputs`；认证消息列表。
- **依赖**: [T1]
- **并行**: []
- **FR**: FR-PORT-001
- **AC**: AC-06
- **动作**: 修改 `runtime/stage/stage-content-contracts.mjs` 的 `analyzeDecisionConvergence` 与 boundRow 检查。
- **精确文件**: `runtime/stage/stage-content-contracts.mjs`
- **boundary**: 不新增 message_class 到 DSH transcript；只修改判定逻辑。
- **输出**: `tests/contract/requirement-convergence-regression.test.mjs` 通过。
- **Knowledge**: coverage 输出已按消息 hash 绑定类别，可信。
- **verification_role**: test
- **paired_task**: T1
- **gate_cmd**: `npx vitest run tests/contract/requirement-convergence-regression.test.mjs`
- **expected_exit**: 0
- **oracle**: 11 个回归测试全部通过。
- **evidence_path**: `tests/contract/requirement-convergence-regression.test.mjs`
- **STOP**: 若收敛检查仍要求 message_class，停止并重新评估 derivation 方案。
- **recovery**: 回退 `stage-content-contracts.mjs` 修改。
- **task risk**: 改变收敛规则可能影响 make-decision 历史数据。

### T3. 修复 wh-review workspace 绑定

- **ID**: T3
- **Phase**: build-code
- **goal**: detail 审查能获取当前 vNext material revision，不触发本地认证错误。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-left-002]
- **输入**: `wh-review` 调用参数；task worktree。
- **依赖**: []
- **并行**: []
- **FR**: FR-LEFT-002
- **AC**: AC-05
- **动作**: 修改 `skills/wh-review/scripts/wh-review-cli.mjs` 的 `resolveTrustedReviewSubject` 传 `readOnly:true`；更新回归测试。
- **精确文件**: `skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **boundary**: 只改 make-decision detail 路径的 binding 参数；不改 review 协议；FR-LEFT-001/003/004/005 由 T7 交付。
- **输出**: wh-review-cli 测试 24/24 通过；catalog hash 同步更新。
- **Knowledge**: vNext material revision 在 readOnly 绑定下才可访问。
- **verification_role**: test
- **paired_task**: T4
- **gate_cmd**: `npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **expected_exit**: 0
- **oracle**: 测试断言 `currentVNextMaterialRevision()` 返回 revision-hash。
- **evidence_path**: `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **STOP**: 若 readOnly 绑定破坏其他 stage，停止并评估显式 mode 参数。
- **recovery**: 回退 binding 参数并保留问题记录。
- **task risk**: readOnly 模式可能影响写操作能力。

### T4. 重构 close 五个动作并删除 risk close 平行机制

- **ID**: T4
- **Phase**: build-code
- **goal**: close 回归 commit/merge/archive/push/cleanup + 一次人工确认；删除恒 risk 入口。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-close-001~005]
- **输入**: `spec.md` close 域定义；`core/task-close.mjs` 当前实现。
- **依赖**: [T0, T1, T2, T3]
- **并行**: []
- **FR**: FR-CLOSE-001、FR-CLOSE-002、FR-CLOSE-003、FR-CLOSE-004、FR-CLOSE-005
- **AC**: AC-02
- **动作**: 修改 `core/task-close.mjs`；断开恒 risk 入口使其不可达（代码暂留，由 T8 凭零引用扫描证据物理删除）；调整质量状态字段；实现批次确认与按动作 authorize 的状态交接——确认记录绑定五个动作批次，任一动作 authorize 被拒绝时 close 停止并保留断点。
- **精确文件**: `core/task-close.mjs`
- **boundary**: 不新增公共命令；不新增 ownership 对象；risk plan 死路的物理删除不在本任务，避免无证据删除。
- **输出**: close contract/integration 测试通过；恒 risk 入口不可达；确认缺失与授权拒绝两条路径各有测试。
- **Knowledge**: ADR-0020 定义 close 为五个动作 + 确认；质量状态抄写不裁判。
- **verification_role**: test
- **paired_task**: T5
- **gate_cmd**: `npx vitest run tests/close/close-contract.test.mjs`
- **expected_exit**: 0
- **oracle**: close 测试覆盖正常/带缺口/existing 路径，断言五动作按 commit→merge→archive→push→cleanup 强制顺序执行落账，以及确认缺失拒绝与单动作授权拒绝两条边界；existing 模式完整通过依赖 T5 清理分支，T4/T5 共同使同一测试转绿；断点续跑与 finalize 用例由 T5 交付。
- **evidence_path**: `tests/close/...`
- **STOP**: 若断开 risk close 导致其他任务无法收尾，停止并改为带缺口 close 收尾，不恢复 risk 入口。
- **recovery**: 整体回退 close 改动到修复前状态，不单独恢复 risk 入口。
- **task risk**: close 改动影响本任务自身 dogfood close。

### T5. 实现 cleanup 分支、断点续跑与 finalize 补记

- **ID**: T5
- **Phase**: build-code
- **goal**: deterministic 模式删除自建目录，existing 模式只记录；失败后能恢复并完成。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-close-003~004]
- **输入**: `workspace_mode`；`core/task-close.mjs` 当前状态。
- **依赖**: [T4]
- **并行**: []
- **FR**: FR-CLOSE-003、FR-CLOSE-004
- **AC**: AC-02
- **动作**: 先在 `tests/close/cleanup-resume-finalize.test.mjs` 补充断点续跑/finalize/清理三重校验用例并确认失败（RED）；再修改 `core/task-close.mjs` 与 `runtime/task/workspace.mjs` 实现至通过（GREEN）：deterministic 删除前执行 realpath、公共父目录、分支归属三重安全校验，任一失败即拒绝删除；断点续跑持久状态契约——每个动作落账记录含任务身份、动作名、完成时间与物理证据引用（提交 hash/合并结果/归档路径/推送结果/工作区状态），续跑读取既有落账记录并跳过已完成动作、不重复落账；finalize 为既有 `tools/cli/task-close.mjs` 新增的 `finalize` 子命令（同一 CLI 同一授权语义，不新增公共命令），逐一核对五类物理完成证据，证据齐全才补写 completed.json，缺项即拒绝，且只写物理交付事实不写质量字段。
- **精确文件**: `core/task-close.mjs`、`runtime/task/workspace.mjs`、`tools/cli/task-close.mjs`、`tests/close/cleanup-resume-finalize.test.mjs`
- **boundary**: 不新增 ownership 字段；不自动重跑完整 close。
- **输出**: existing 模式 close 测试通过；finalize 补记测试通过（模拟手工物理完成后调用补记路径并核对 completed.json）；realpath/公共父目录/分支三重校验任一失败的拒绝删除测试通过；续跑跳过已完成步骤且不重复落账的测试通过。
- **Knowledge**: F7 要求 cleanup 独立授权；existing 目录非任务创建。
- **verification_role**: test
- **paired_task**: T4
- **gate_cmd**: `npx vitest run tests/close/cleanup-resume-finalize.test.mjs`
- **expected_exit**: 0
- **oracle**: existing 任务正常 close；finalize 写 completed.json 但不漂白质量。
- **evidence_path**: `tests/close/...`
- **STOP**: 若 cleanup 分支破坏 deterministic 任务，停止。
- **recovery**: 回退 workspace.mjs 清理改动。
- **task risk**: 清理逻辑误删用户目录。

### T6. 统一 close 与 status 事实新鲜度判定

- **ID**: T6
- **Phase**: build-code
- **goal**: close 与 status 使用同一函数判定 material-only delta 豁免。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-close-005]
- **输入**: close 与 status 当前判定逻辑。
- **依赖**: [T4]
- **并行**: []
- **FR**: FR-CLOSE-005
- **AC**: AC-02
- **动作**: 在 `runtime/evidence/freshness.mjs` 提取共享判定函数；`runtime/task/git-worktree-snapshot.mjs` 是 `isMaterialOnlySnapshotDelta` 的现有持有方，本任务只从其迁出判定逻辑供共享函数复用，不新增机制；status 侧消费者 `runtime/stage/completion-predicates.mjs` 与 close 侧消费者 `core/task-close.mjs` 都改调同一函数。
- **精确文件**: `core/task-close.mjs`、`runtime/task/git-worktree-snapshot.mjs`、`runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`
- **boundary**: 不新建 current tuple 注册表或 lineage 机制。
- **输出**: material-only delta 对齐测试通过。
- **Knowledge**: F8 禁止 replacement 平台；F11 控制面受限。
- **verification_role**: test
- **paired_task**: T7
- **gate_cmd**: `npx vitest run tests/close/freshness-consistency.test.mjs`
- **expected_exit**: 0
- **oracle**: 测试断言两端可观察行为一致（status 输出的新鲜度结论与 close 的拒绝/放行决定），而非仅比对函数返回值：(a) material-only delta 豁免，两端均判 current；(b) 真实 material 变化，两端均判 stale 且 close 拒绝推进。
- **evidence_path**: `tests/close/...`
- **STOP**: 若判定合并导致循环依赖，停止。
- **recovery**: 回退并保留双判定。
- **task risk**: status 与 close 调用层级不同。

### T7. 实现左移防护五件套（生产改动 + 测试）

- **ID**: T7
- **Phase**: build-code
- **goal**: cwd 断言、review preflight、fallback 分类、子代理占位、code_review 事件各有生产改动与对应测试。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-left-001~005]
- **输入**: 左移防护包设计；事故复盘五子项。
- **依赖**: [T3, T4]
- **并行**: []
- **FR**: FR-LEFT-001、FR-LEFT-002、FR-LEFT-003、FR-LEFT-004、FR-LEFT-005
- **AC**: AC-05
- **动作**: 先补 `tests/left-shift/left-shift-suite.test.mjs` 五子项用例并确认失败（RED）；再实现至通过（GREEN）：FR-LEFT-001 在 `runtime/stage/stage-runner.mjs` 写入路径前断言任务身份、runner 执行身份一致且 cwd 位于任务 worktree 内，三者任一不满足即拒绝写入；FR-LEFT-002 在 `skills/wh-review/scripts/review-runner.mjs` 统一 preflight，把配置/材料/绑定/能力四类错误分开 fail-loud；FR-LEFT-003 在 `skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs` 六个真实 fallback 消费点统一拆为 invalid_input 与 unavailable 两类；FR-LEFT-004 复用现有 canonical receipt 接口：子代理超时/崩溃时由 `runtime/stage/stage-runner.mjs` 写入 `agent_outcome` 类 unavailable receipt（生产者，不新增持久对象），`runtime/stage/stage-content-contracts.mjs` 按现有 receipt 校验拒绝缺失结果（消费者），测试覆盖成功/超时/缺失/无效四类子代理结果的落账与消费路径；FR-LEFT-005 在 `tools/host/workflowhub-codex-session-event.mjs` 把 code_review 记录为一等会话事件，`runtime/stage/completion-predicates.mjs` 作为直接消费者据其判定 review 事实存在性。
- **精确文件**: `runtime/stage/stage-runner.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/completion-predicates.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`tools/host/workflowhub-codex-session-event.mjs`、`tests/left-shift/left-shift-suite.test.mjs`
- **boundary**: 测试只验证 fail-loud 行为与事件消费；不验证完整 review 结果；不新增持久对象。
- **输出**: AC-05 五子项测试全绿。
- **Knowledge**: F3/F4/F9 要求错误发现左移并真实报错。
- **verification_role**: test
- **paired_task**: T3
- **gate_cmd**: `npx vitest run tests/left-shift/left-shift-suite.test.mjs`
- **expected_exit**: 0
- **oracle**: 每个左移点至少有一条 RED→GREEN 测试，且测试在生产改动前真实失败、改动后通过。
- **evidence_path**: `tests/left-shift/left-shift-suite.test.mjs`
- **STOP**: 若某左移点无法测试，停止并升级人工决策；AC-05 缺口存在时 T12/T11 不得判绿，不得以 unavailable 继续。
- **recovery**: 移除对应改动并保留问题记录。
- **task risk**: 测试依赖内部实现细节。

### T8. 死代码扫描与删除

- **ID**: T8
- **Phase**: build-code
- **goal**: 删除零消费者死代码与临时 bridge，保留反向引用扫描证据。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-sub-001]
- **输入**: 死代码扫描结果；临时 bridge 位置。
- **依赖**: [T4, T5, T6, T7]
- **并行**: []
- **FR**: FR-SUB-001
- **AC**: AC-06
- **动作**: 新增 `scripts/dead-code-scan.mjs` 反向引用扫描并在 `docs/architecture/move-map.json` 登记；扫描以标识符级（risk plan 死路相关函数/常量/分支）与文件级双粒度出具零引用证据；对每一个实际删除对象（`core/task-close.mjs` 中 risk plan 死路代码段、`tools/host/workflowhub-stage-agent-bridge.mjs` 中临时 bridge 段）在报告中列出删除前零消费者证据，删除后 `riskClose` 等标识符零残留。
- **精确文件**: `scripts/dead-code-scan.mjs`、`docs/architecture/move-map.json`、`core/task-close.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`
- **boundary**: 不删除仍有测试或脚本引用的代码。
- **输出**: 扫描报告文件 + 删除记录；删除后的测试基线由 T12 统一把关；risk close 平行机制形成"断开入口（T4）→ 证据删除（T8）→ 全绿验证（T12）"完整闭环。
- **Knowledge**: F8/F10/F11 要求精简控制面。
- **verification_role**: evidence
- **paired_task**: T9
- **gate_cmd**: `bash -c 'node scripts/dead-code-scan.mjs --verify && test -s quality/evidence/dead-code-scan/report.json'`
- **expected_exit**: 0
- **oracle**: 报告按标识符级与文件级双粒度列出各删除对象的零引用证据；`--verify` 对删除标识符清单逐一断言零残留，任一待删对象仍有引用或报告为空时退出非 0，空报告或固定成功结果无法支撑删除。
- **evidence_path**: `quality/evidence/dead-code-scan/...`
- **STOP**: 若删除后测试基线严重失败，停止并恢复。
- **recovery**: git revert 删除提交。
- **task risk**: 误删仍有隐藏消费者的代码。

### T9. 双轨事实评估结论报告

- **ID**: T9
- **Phase**: build-code
- **goal**: 评估 facts.jsonl 与 quality facts 双轨并产出结论文件，不合并结构。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-eval-001、fr-sub-003]
- **输入**: 任务存储的 `facts.jsonl`、`quality/facts/` 事实文件；事故复盘文件；统计时点的任务快照身份。
- **依赖**: [T8]
- **并行**: []
- **FR**: FR-EVAL-001、FR-SUB-003
- **AC**: AC-06
- **动作**: 新增 `scripts/dual-track-evaluate.mjs`（在 `docs/architecture/move-map.json` 登记），从 `facts.jsonl` 与 `quality/facts/` 实际统计生成 `quality/evidence/dual-track-evaluation-report.md`；报告必须产出明确结论段，每轨给出三态判定（一致/差异/数据不足）与建议（保留/合并候选/重评），判定规则写入报告；每条计数附统计命令与数据快照身份；脚本对缺失/损坏/空数据 fail-loud 报错退出非 0，对快照漂移在报告中标注统计时点快照身份；`--check` 模式重新统计并验证计数与结论段三态标记，不一致即退出非 0。
- **精确文件**: `scripts/dual-track-evaluate.mjs`、`docs/architecture/move-map.json`、`quality/evidence/dual-track-evaluation-report.md`
- **boundary**: 只读不写结构；合并推迟到后续任务。
- **输出**: 评估报告文件存在且计数可由脚本复算；dogfood close 落账后由 T11 重新生成并校验同一报告。
- **Knowledge**: F4/Q1 质量事实浮现但不作为准入证。
- **verification_role**: evidence
- **paired_task**: T8
- **gate_cmd**: `node scripts/dual-track-evaluate.mjs --check`
- **expected_exit**: 0
- **oracle**: `--check` 重新统计 facts.jsonl 与 quality/facts 并与报告比对；静态占位文档或手改计数与真实数据不一致时命令必失败。
- **evidence_path**: `quality/evidence/dual-track-evaluation-report.md`
- **STOP**: 若用户要求合并双轨，停止并单独立项。
- **recovery**: 删除报告文件。
- **task risk**: 报告被误读为合并方案。

### T10. 宪法解释段与 checklist 同步

- **ID**: T10
- **Phase**: build-code
- **goal**: 在 CONTEXT.md 增补"close 三义"解释段，在 constitution-checklist.md 新增 close 三义判据，并逐条核对 15 条 FR 的宪法依据。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#ac-03]
- **输入**: 宪法 F3/F4/F7/F9/Q1/Q2/F11；FR 依据字段。
- **依赖**: [T1, T2, T3, T4, T5, T6, T7, T8, T9]
- **并行**: []
- **FR**: 所有 FR
- **AC**: AC-03、AC-04
- **动作**: 在 `CONSTITUTION.md` 治理边界节增补"close 三义"解释段（只解释不设门，不改条款编号与判据本文）；在 `CONTEXT.md` 增补同名术语解释；在 `constitution-checklist.md` 新增四条判据；用脚本逐条提取 spec.md 15 条 FR 的"依据"字段条款号，连同 AC-04 的 `git diff --name-only` 核对输出写入 `quality/evidence/constitution-mapping-checklist.md`，产物末尾给出四行结构化结论：新增公共命令：无 / 新增材料：无 / 新增 manifest 字段：无 / 新增控制面：无（每行附 diff 依据）。
- **精确文件**: `CONSTITUTION.md`、`CONTEXT.md`、`constitution-checklist.md`、`quality/evidence/constitution-mapping-checklist.md`
- **boundary**: 只解释不设门；不新增门禁；不改宪法条款本文。
- **输出**: CONSTITUTION.md 治理边界节与 CONTEXT.md 各增"close 三义"段；checklist 新增"close 三义判据"小节，含 CLOSE-F9、CLOSE-Q1、CLOSE-F7、CLOSE-F3 四条判据；FR 依据与 AC-04 核对结果写入 `quality/evidence/constitution-mapping-checklist.md` 供复核。
- **Knowledge**: AC-03 要求每条 FR 标注宪法条款且 checklist 同步。
- **verification_role**: manual
- **paired_task**: T11
- **gate_cmd**: `bash -c 'grep -q "close 三义" CONSTITUTION.md && grep -q "close 三义" CONTEXT.md && test $(grep -c "CLOSE-" constitution-checklist.md) -ge 4 && test $(grep -c "FR-" quality/evidence/constitution-mapping-checklist.md) -ge 15 && grep -q "git diff" quality/evidence/constitution-mapping-checklist.md && grep -q "新增公共命令：无" quality/evidence/constitution-mapping-checklist.md && grep -q "新增材料：无" quality/evidence/constitution-mapping-checklist.md && grep -q "新增 manifest 字段：无" quality/evidence/constitution-mapping-checklist.md && grep -q "新增控制面：无" quality/evidence/constitution-mapping-checklist.md && test $(node -e 'import("./runtime/interface/runtime-facade.mjs").then((m)=>console.log(m.RUNTIME_BEHAVIORS.length))') -eq 7 && test -z "$(git status --porcelain -- workflows/)" && test -z "$(git status --porcelain -- tools/cli/ | grep "^??")" && test $(ls specs/workflowhub-simplicity-close-repair-20260829/*.md | wc -l) -eq 4'`
- **expected_exit**: 0
- **oracle**: 三处文件各含本次新增的"close 三义"文字与 CLOSE- 判据标记（文件未修改时命令必失败）；核对产物含 15 行以上 FR 依据提取结果、git diff 核对段与四行"无新增"结构化结论；并直接断言公共 runtime 行为仍为七类（活模块枚举）、workflows/ 清单零改动、tools/cli/ 零新增文件、specs 目录仍为四份材料，任一被违反时命令必失败。
- **evidence_path**: `constitution-checklist.md`
- **STOP**: 若 checklist 被误读为新门禁，重新措辞。
- **recovery**: 回退 checklist 修改。
- **task risk**: 措辞被实现为 gate。

### T11. dogfood close 验收（本任务五阶段收口）

- **ID**: T11
- **Phase**: verify-code
- **goal**: 本任务自身完成五阶段并正常 close；completed.json 记录五个动作与一次确认。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#ac-01~ac-02]
- **输入**: 所有前置任务完成；官方路径。
- **依赖**: [T8, T9, T10, T12]
- **并行**: []
- **FR**: 所有 FR
- **AC**: AC-01、AC-02
- **动作**: 通过既有 close 唯一用户入口 `tools/cli/task-close.mjs` 实际执行 close（`prepare→confirm→execute→complete` 或 `close` 一站命令）：每次执行触发对应物理动作并落账，非仅授权痕迹；开始前完成一次人工确认；若某动作已手工物理完成，走同一 CLI 的 `finalize` 子命令补记；新增 `tests/close/dogfood-close.test.mjs`，由测试按仓库配置解析任务存储路径并核对 completed.json 内容。
- **精确文件**: `tests/close/dogfood-close.test.mjs`
- **boundary**: 只做当前工作树内可验证的测试；不清理主仓历史对象；测试不硬编码宿主绝对路径。
- **输出**: completed.json 存在，记录五个动作与一次确认绑定，close_mode 非 risk，且不写入质量字段（质量状态在 quality/facts 独立存在）。
- **Knowledge**: AC-02 测试先绿（T12），再执行 AC-01 dogfood。
- **verification_role**: evidence
- **paired_task**: T10
- **gate_cmd**: `bash -c 'npx vitest run tests/close/dogfood-close.test.mjs && node scripts/dual-track-evaluate.mjs --write && node scripts/dual-track-evaluate.mjs --check'`
- **expected_exit**: 0
- **oracle**: 测试断言 completed.json 符合 plan 数据契约（五动作落账含 evidence_ref、close_mode 非 risk、confirmation_ref 绑定批次确认、不含质量字段）；任务存储存在 task-close CLI 生成的 close plan 记录链（prepare/confirm/execute/complete）与五阶段 completed 事实（质量事实独立存在、原值未改写）；dogfood 后重新生成并校验双轨报告；dogfood 执行前文件不存在，命令必失败。
- **evidence_path**: `operations/close/completed.json`
- **STOP**: 若 close 失败且无法 finalize 补记，停止并人工收尾。
- **recovery**: 手工完成五步并由 finalize 补记。
- **task risk**: close 使用正在修改的代码自举。

### T12-GREEN. close 机制行为变更测试 GREEN

- **ID**: T12
- **Phase**: build-code
- **goal**: 修复后证明 close 行为测试通过。
- **design_state**: approved
- **versioned_refs**: [specs/workflowhub-simplicity-close-repair-20260829/spec.md#fr-close-001]
- **输入**: `tests/close/close-contract.test.mjs` 修复后的实现；T0-RED 失败记录。
- **依赖**: [T0, T1, T2, T3, T4, T5, T6, T7, T8]
- **并行**: []
- **FR**: FR-CLOSE-001、FR-CLOSE-002
- **AC**: AC-02、AC-05、AC-06
- **动作**: 运行 close contract、左移防护、宿主移植与收敛回归全部相关测试，预期通过。
- **精确文件**: `tests/close/close-contract.test.mjs`
- **boundary**: 只运行测试并记录 GREEN 事实；不修改测试断言以掩盖问题。
- **输出**: 测试退出码为 0；close contract 全绿。
- **Knowledge**: F9 要求行为变更先 RED 再 GREEN；测试失败真报。
- **verification_role**: GREEN
- **paired_task**: T0
- **gate_cmd**: `npx vitest run tests/close/close-contract.test.mjs tests/close/cleanup-resume-finalize.test.mjs tests/close/freshness-consistency.test.mjs tests/left-shift/left-shift-suite.test.mjs tests/dsh-transcript.test.mjs tests/contract/requirement-convergence-regression.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **expected_exit**: 0
- **oracle**: close contract、断点续跑/finalize、新鲜度一致性、左移防护、DSH 宿主、收敛回归、wh-review 绑定测试在修复后全部通过；dogfood 验收测试不属于本任务，由 T11 单独运行。
- **evidence_path**: `tests/close/close-contract.test.mjs`
- **STOP**: 若测试仍失败，停止 dogfood close 并修复实现。
- **recovery**: 回退 close 核心改动并重新运行 RED。
- **task risk**: 测试覆盖不足导致假绿。
