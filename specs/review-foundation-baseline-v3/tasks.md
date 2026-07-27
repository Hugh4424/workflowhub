# 处理组 1：基础口径任务清单

#### T001 基础文档口径 RED

- **ID**: T001
- **动作**: 为显式 profile、workspace、实际目标、localhost 误判，以及三层验证缺失结论写文档契约测试。
- **精确文件**: `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **输入**: FR-001、FR-008、FR-012 与当前监控事故事实
- **输出**: 监控口径和三层验证模板缺失的稳定 RED
- **依赖**: 无
- **并行**: 可与 T003、T006、T008 并行
- **FR**: FR-001, FR-008, FR-012
- **AC**: AC-001, AC-007, AC-011
- **gate_cmd**: `npx vitest run skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **expected_exit**: 1
- **oracle**: 旧文档缺少显式目标、localhost 边界、三层字段或“部署验证未完成”结论时测试失败
- **evidence_path**: `evidence/tests/group1-monitoring-red.output`

#### T002 监控 SOP GREEN

- **ID**: T002
- **动作**: 新增最小监控规程，并写入一条实际执行的显式 profile + workspace 读取记录。
- **精确文件**: `docs/multica-monitoring-sop.md`, `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **输入**: T001 RED
- **输出**: 含目标、命令、Issue/run/评论读取结果的实际记录与 GREEN
- **依赖**: T001
- **并行**: 可与 T004、T007、T009 并行
- **FR**: FR-001, FR-012
- **AC**: AC-001, AC-011
- **gate_cmd**: `npx vitest run skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **expected_exit**: 0
- **oracle**: 文档包含一次实际远端读取的目标、命令和结果，并明确同环境默认 localhost 失败只属本地配置错误
- **evidence_path**: `evidence/tests/group1-monitoring-green.output`

#### T003 route 分级校验 RED

- **ID**: T003
- **动作**: 增加当前非法、非当前非法、重复 profile、priority/fallback/空 profiles fixture，并证明 doctor 命令尚不存在或不能严格扫描全部 route。
- **精确文件**: `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **输入**: FR-002～FR-004
- **输出**: 旧 loader 全局阻断行为的稳定 RED
- **依赖**: 无
- **并行**: 可与 T001、T006、T008 并行
- **FR**: FR-002, FR-003, FR-004
- **AC**: AC-002, AC-003, AC-004, AC-011
- **gate_cmd**: `npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **expected_exit**: 1
- **oracle**: 非当前非法 route 仍阻断当前请求、重复 profile 未被拒绝或 doctor 未严格失败时测试失败
- **evidence_path**: `evidence/tests/group1-route-red.output`

#### T004 route 纯校验函数 GREEN

- **ID**: T004
- **动作**: 抽出共享纯校验函数，新增“同一路径重复 profile 非法”判定，并让正常加载只严格校验当前 route。
- **精确文件**: `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`
- **输入**: T003 RED
- **输出**: 当前错误 fail loud、重复 profile 非法、其他错误 warning 且路由不变
- **依赖**: T003
- **并行**: 可与 T007、T009 并行
- **FR**: FR-002, FR-003
- **AC**: AC-002, AC-003, AC-011
- **gate_cmd**: `npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **expected_exit**: 0
- **oracle**: current route 错误退出非零且消息包含 stage、track、profile、字段；其他 route warning 且选择结果不变
- **evidence_path**: `evidence/tests/group1-route-green.output`

#### T005 doctor 薄入口

- **ID**: T005
- **动作**: 在现有 wh-review CLI 增加只读 doctor 命令，复用 T004 校验函数扫描全部 route。
- **精确文件**: `skills/wh-review/scripts/wh-review-cli.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/SKILL.md`, `skills/wh-review/manifest.json`, `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **输入**: T004 纯校验结果
- **输出**: 合法配置退出 0、任一非法配置退出 1
- **依赖**: T004
- **并行**: 可与 T007、T009 并行
- **FR**: FR-004
- **AC**: AC-004, AC-011
- **gate_cmd**: `npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **expected_exit**: 0
- **oracle**: doctor 与正常 route 加载对同一非法项给出一致定位
- **evidence_path**: `evidence/tests/group1-doctor-green.output`

#### T006 resolution 暂停 RED

- **ID**: T006
- **动作**: 复现 actionable finding 已被 verified resolution 完整处置但仍错误暂停。
- **精确文件**: `tests/official-make-decision-cli.test.mjs`, `tests/stage-risk-acceptance.test.mjs`, `tests/final-cutover-guards.red.test.mjs`
- **输入**: FR-005～FR-007
- **输出**: 旧 handler 的稳定 RED 与负向 fixture
- **依赖**: 无
- **并行**: 可与 T001、T003、T008 并行
- **FR**: FR-005, FR-006, FR-007
- **AC**: AC-005, AC-006, AC-011
- **gate_cmd**: `npx vitest run tests/official-make-decision-cli.test.mjs tests/stage-risk-acceptance.test.mjs tests/final-cutover-guards.red.test.mjs`
- **expected_exit**: 1
- **oracle**: verified zero-risk resolution 仍进入 serious pause 时正向用例失败
- **evidence_path**: `evidence/tests/group1-resolution-red.output`

#### T007 resolution 暂停修复 GREEN

- **ID**: T007
- **动作**: 在现有 reviewFacts/bindFinalReview 顺序中先验证同 flow resolution，再决定是否暂停。
- **精确文件**: `core/stage-handlers.mjs`, `tests/official-make-decision-cli.test.mjs`, `tests/stage-risk-acceptance.test.mjs`, `tests/final-cutover-guards.red.test.mjs`
- **输入**: T006 RED
- **输出**: 正向完成、全部负向边界保持 fail loud
- **依赖**: T006
- **并行**: 可与 T004、T009 并行
- **FR**: FR-005, FR-006, FR-007
- **AC**: AC-005, AC-006, AC-011
- **gate_cmd**: `npx vitest run tests/official-make-decision-cli.test.mjs tests/stage-risk-acceptance.test.mjs tests/final-cutover-guards.red.test.mjs`
- **expected_exit**: 0
- **oracle**: 原 verdict 保留、resolution evidence 绑定、missing_items 为空；accepted risk 仍暂停
- **evidence_path**: `evidence/tests/group1-resolution-green.output`

#### T008 attempt 分类 RED

- **ID**: T008
- **动作**: 用表驱动 fixture 冻结分类、原始码、UNKNOWN、duration/retry 和质量分母。
- **精确文件**: `skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **输入**: FR-009～FR-011
- **输出**: 旧报告缺少分层投影的稳定 RED
- **依赖**: 无
- **并行**: 可与 T001、T003、T006 并行
- **FR**: FR-009, FR-010, FR-011
- **AC**: AC-008, AC-009, AC-010, AC-011
- **gate_cmd**: `npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **expected_exit**: 1
- **oracle**: 任一固定错误码分类、原码、UNKNOWN warning 或分母不符即失败
- **evidence_path**: `evidence/tests/group1-attempt-red.output`

#### T009 attempt 报告投影 GREEN

- **ID**: T009
- **动作**: 在报告投影层实现固定分类和失败事实展示，不改 canonical records。
- **精确文件**: `skills/wh-review/scripts/review-result.mjs`, `skills/wh-review/contracts/provider-protocol.md`, `skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **输入**: T008 RED
- **输出**: 分类、原码、耗时、retry 和分母 GREEN
- **依赖**: T008
- **并行**: 可与 T002、T004、T007 并行
- **FR**: FR-009, FR-010, FR-011
- **AC**: AC-008, AC-009, AC-010, AC-011
- **gate_cmd**: `npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **expected_exit**: 0
- **oracle**: 失败 attempt 不生成 finding 且不进入质量分母，原始码逐字保留
- **evidence_path**: `evidence/tests/group1-attempt-green.output`

#### T010 三层验证模板

- **ID**: T010
- **动作**: 在现有 E2E 文档补源仓、active runner、fresh process 证据字段与缺层结论。
- **精确文件**: `docs/wh-review-e2e.md`, `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **输入**: FR-008 与实际 runner 边界
- **输出**: 可执行三层模板，不增加 runner 发现或同步逻辑
- **依赖**: T002
- **并行**: 可与 T009 并行
- **FR**: FR-008, FR-012
- **AC**: AC-007, AC-011
- **gate_cmd**: `npx vitest run skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **expected_exit**: 0
- **oracle**: 缺任一层时文档要求写“部署验证未完成”
- **evidence_path**: `evidence/tests/group1-three-layer-green.output`

#### T012 规格编号覆盖兼容 GREEN

- **ID**: T012
- **动作**: 让现有计划覆盖校验识别已接受规格的 `FR-001 / AC-001` 编号，并保持原有长编号兼容。
- **精确文件**: `core/stage-content-contracts.mjs`, `core/schemas/plan-task-contract.v1.json`, `tests/stage-plan-task-contract.test.mjs`
- **输入**: 当前 plan-task contract 的 0/0 误报
- **输出**: FR 12/12、AC 11/11 的真实双向覆盖
- **依赖**: 无
- **并行**: 可与 T002、T004、T007、T009 并行
- **FR**: FR-012
- **AC**: AC-011
- **gate_cmd**: `npx vitest run tests/stage-plan-task-contract.test.mjs`
- **expected_exit**: 0
- **oracle**: 两种编号格式均被识别，未知编号和遗漏覆盖仍失败
- **evidence_path**: `evidence/tests/group1-plan-contract-green.output`

#### T011 最终聚焦验证 GREEN

- **ID**: T011
- **动作**: 运行本组完整测试命令、Skill closure、宪法和 diff 检查；正式实现审查由 build-code 阶段自身记录。
- **精确文件**: `skills/catalog.yaml`, 本任务全部改动文件
- **输入**: T005、T007、T009、T010、T012
- **输出**: 完整测试证据和检查结果
- **依赖**: T005, T007, T009, T010, T012
- **并行**: 否
- **FR**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012
- **AC**: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011
- **gate_cmd**: `npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/official-make-decision-cli.test.mjs tests/stage-risk-acceptance.test.mjs tests/final-cutover-guards.red.test.mjs tests/stage-plan-task-contract.test.mjs`
- **expected_exit**: 0
- **oracle**: 所有聚焦测试退出 0，结构、宪法和 diff 检查通过
- **evidence_path**: `evidence/tests/group1-final-green.output`
