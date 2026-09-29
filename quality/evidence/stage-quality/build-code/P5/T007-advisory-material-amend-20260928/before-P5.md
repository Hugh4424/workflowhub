# Phase P5 — 阶段末报告事实层（没做到逐条 + 路线适用 + 执行事实）

## L0

相位目标：把 D-005 的三条未决项（报告能否机器渲染 / 归档形态兼容面 / 一台产物还是两台）落实为事实层。T007 的 `runtime/stage/stage-end-report.mjs` 三个纯导出已在本地实现并有 8/8 定向测试，但这只证明转换器。CLI run 仍不返回完整同次 `acceptanceChain`，不能事后拼造逐 AC 来源；T008 真正的 P5 中途报告仍缺认证生产者，当前 `not_done`。2026-09-27 同任务修订在下文给 T008 精确私有接线范围和先后条件；未满足时不得生成貌似 P5 完成的三文件。全相位最终交付仍由 P13/T024 负责，聊天简短大白话独立执笔，不由本模块渲染。`runtime/stage/stage-handoff.mjs` 继续只读。

- **Global spec**: `specs/workflowhub-thin-core-card-04-20260919/spec.md`
- **Write set**: T007 仅 `runtime/stage/stage-end-report.mjs` 与经下文审查缺口修订的 `runtime/stage/stage-end-report.test.mjs`，修订前测试原字节另存 P5 证据；T008 写侧仅在 `runtime/stage/stage-runner.mjs` 的本次 build-code 私有发布完成后有界接线，并写受影响的 `tests/contract/p5-same-run-report-source.test.mjs` 与现有 Task store `quality/evidence/` 原始/内容哈希证据；工作树 P5 固定检查点仅 `report-facts.json`、`report.md`、`T008-delivery.txt`。本轮增加的只读消费写面仅为现有 `runtime/evidence/freshness.mjs` 的私有 P5 报告认证函数及同一针对性测试，不改 T007 纯转换器。`tools/cli/stage-runtime.mjs` 与公共输出边界只读；原八项测试的旧时点结论只读保留；未认证时三文件不写。
- **Dependency**: P4
- **Consumer**: 私有 P5 报告认证函数仅供 P6/T012 当前真实 E2E 与 P13/T024 最终聚合读取；verify-code 只经 P13 汇总消费，当前 CARD-04 无可认证的 P5 报告，保持 not_done/G2。
- **gate_cmd**: `npx vitest run runtime/stage/stage-end-report.test.mjs`
- **oracle**: ORACLE-P5-REPORT-FACTS — T007 的八个冻结 `it` 应全过（导出、逐条没做到、路线适用、空数组拒绝、渲染顺序与来源、缺文件、逐条 spec-analyze 判决、通过时负控），且输出可归因。当前本地 8/8 仅证纯转换器，当前材料版本的正式审查/阶段事实仍未建立；此门不证明 T008 来源或 P5 相位完成。
- **STOP**: T007 三个纯导出不得改 `stage-handoff.mjs` 或借 T008 来源接线放宽测试；T008 若拿不到同一次正式 run 的链、收据、材料/快照、成功发布事实及可用的同版独立审查，或只能凭游标触发，不产认证报告或三文件，并标 `not_done`。不改公共命令、旧归档形状或其它 stage 写面。
- **Done**: T007 三导出、冻结八项及同版独立审查成立；T008 另有真实 P5 作用域、同次来源原件和三检查点、正反例及当前版本独立审查。当前只有 T007 局部 8/8，T008 尚无来源/三文件，本相位未完成。P13/T024 负责未来最终交付。
- **evidence_path**: `quality/evidence/stage-quality/build-code/P5/`

## 2026-09-27 T007 独立审查后的有界修复（当前）

独立审查发现旧 8/8 只覆盖转换器旧夹具，不能证明真实报告可靠：`status=in_progress`、`work_status=blocked_by_missing_material` 及各自 `completion.missing`/`readiness.missing_materials` 可能漏入 `not_done`；逐 AC `evidence_refs=[{}]` 或空 `ref` 被非空数组误判为已有证据；空 `declared.exceptions` 被程序编造成人工例外，且普通字符串/缺 owner、影响范围、到期阶段的对象也被接受。原八项与输出保留，不把旧绿色倒改为通过这些新情形。

T007 owner 先保存现有测试原字节/哈希及当前定向 8/8 原件，随后仅在 `runtime/stage/stage-end-report.test.mjs` 增加上述可失败正反例，取得对当前代码的目标 RED，再仅改 `runtime/stage/stage-end-report.mjs` 三个纯导出内部实现。正式 vNext 阶段结果即使 `quality_status=passed`，`status` 未完成或 `work_status` 缺材料也须逐项进入 `not_done` 并带原始字段来源；`completion.missing[]` 应对照同一 `completion.predicates[subject].status`，真实 `conflict` 写 `inconsistent`，普通缺项才写 `missing`，不得把事实冲突误写成缺证；`work_status=ready` 本身只是材料齐备，不得误写成完成。逐 AC 证据至少有非空 `ref` 和合法哈希候选才算结构存在；本纯函数仍不得自称认证了 ref/hash，缺证要逐 AC 记录。只运行本文件定向测试与必要的相邻合同，保留旧/新 RED、GREEN、源码/材料/测试哈希，独立审查后才能判 T007 局部完成。

`exceptions` 的诚实表示涉及既有 D-004/DER-05「空数组不合法」与「例外必须是真实人写声明」同时成立时的冲突。用户已收到简短选择题；答复前不改该字段契约、不生成假例外，也不把 T007/本 Phase 判完成。答复后须同步 decision-log、spec、规则文档、T007 测试/实现，再以真实声明或明确无例外规则取证。T008 同次来源接线还须合取当前 T007 实现差分、同快照八项测试 receipt/output、P5 专属独立审查、已发布的质量事实及单行阶段记录；不存在单独的「T007 完成收据」，不能从游标或 whole-task 完成推断。

## L1

**2026-09-27 当前/历史分界**：下方 T007/T008 原任务字段保留 build-plan 预写时的 RED、冻结八项和旧 STOP provenance；其中「T007 空 stub/未运行」「T008 不准接线」「三文件只查存在即可」均是旧时点表述，不能覆盖本卡 L0 和末尾 `T008 同次真实来源修订`。当前 T007 纯转换器本地 8/8、尚缺同版正式审查；T008 生产者、真实 P5 正例和三文件未完成。实施者只按新修订的精确写面与认证负控推进，旧原件不删除、不改写成当时已完成。

### T007 — 阶段末报告事实层与渲染（D-005 未决三条收口）

- **Source / FR / AC**: R-004、R-002（decision-log D-003/D-004/D-005）/ FR-20、FR-21 / AC-20、AC-21
- **Files / symbols**: `runtime/stage/stage-end-report.mjs`（现存空壳；symbol：未来替换三个已声明导出 `buildStageEndReportFacts`、`renderStageEndReport`、`collectStageEndReportFacts` 的实现）、`runtime/stage/stage-end-report.test.mjs`（现存冻结文件，八个 it：导出面/没做到逐条/路线适用矩阵/空数组非法/渲染顺序与来源/缺文件不抛错/**`spec-analyze` 判决逐条入账**/判决通过时不得出现的负控；其中后两个 it 由 build-plan 期按用户 `a2=乙` 裁定纯追加）
- **Action**: build-code 获得明确授权后，T007 可独立实现三个纯导出并运行本地定向八-it gate `npx vitest run runtime/stage/stage-end-report.test.mjs`；该模块实现/单测不依赖 T008 的 CLI capture 或 provenance 认证。当前本轮仅审 build-plan，不实施或运行此 gate。authenticated task worktree/CWD、project/task identity、HEAD/source snapshot、canonical source 与官方 CLI 单次原始 capture 的要求仅属于 T008；其命令须另行设计和审查。显式 `--project`/`--task` 仅选择 CLI 身份，不认证调用者/来源。不得运行旧草案、生成貌似官方事实或重复执行阶段。旧 inline exporter 已移除。
- **Inputs**: 未来接口（当前不可执行）—— `runtime/stage/stage-runner.mjs:4197-4214`（acceptanceChain 构建区，行形状取源锚点，来自 T006；合并前锚点 `:3930-3950` 因 CARD-05 重写已过期；相关锚点：`currentPostBuildCodeSpecAnalyze` `:4116`、boundEvidence 助手 `:4155-4185`；该数组仅在运行期传给 validator，并不出现在 CLI 返回的 stageResult 中）；`specs/workflowhub-thin-core-card-04-20260919/spec.md` 第 7 节与 Interfaces and Failure Semantics。须先另行核准可信的 task worktree/CLI 身份、快照和 canonical 单次 capture 契约，方可设计命令；显式 `--project=<project-id> --task=<task-id>` 仅选择 CLI 身份，不认证调用者或来源。CLI `run` 在 `tools/cli/stage-runtime.mjs:1527-1534` 返回实际 `stageResult`，status 投影不是 run 结果。形状字段/本地 hash 只能提供核验线索，不会自行认证调用身份或来源。
- **Outputs / failure**: （future T007 criteria） 获授权实现后，三个导出函数与预置单测所需的 `stage-end-report-facts.v1` 事实对象；当前仍为空 stub、没有实现输出。失败 = 任一 it 断言失败（导出缺失、没做到被总结成一条、路线适用缺 reason、空数组被放行、渲染把没做到排在通过项之后、缺文件抛错均为失败）
- **Boundary / DO NOT TOUCH**: 不改 `runtime/stage/stage-handoff.mjs`、不改 `runtime/stage/stage-runner.mjs`、不改 `runtime/stage/stage-content-contracts.mjs` 与 `tools/cli/**`；不新增依赖；不填 `task_ids`/`review_ref`。PROVENANCE（DER-12）：预置测试 `runtime/stage/stage-end-report.test.mjs` 由 build-plan 阶段异源上下文产出并冻结，实现者只读不得修改
- **Dependency**: P4
- **Test tier / skill**: 模块层就近共置单测（第二个 runtime/ 共置例）/ build-code 实现
- **逐层计划（非执行结论）**：规划用 `testing-system-blueprint`；真实 diff 确认 backend/feature 后 build-code 选 `backend-testing`，记录 runner 完整测试身份、当前源码快照、命令/exit/stdout-stderr 原件及 hash；以下三层分别对 AC-20/21 与旧回归，不把预置 RED 或单一 exit 0 冒充业务通过。

  | 层/适用性 | 精确目标、环境/夹具、预期原始结果 | 可观察 pass / fail / unknown |
  | --- | --- | --- |
  | 单元：未来适用，三个纯导出有可隔离判定 | 获授权实现后执行 `npx vitest run runtime/stage/stage-end-report.test.mjs`；Node/Vitest、本地 fixtures；预期八个 frozen `it` 身份、exit 0、原始输出。历史 RED 仅为未找到原件的声明，不作现行证据 | 逐条 `not_done`、`N/A + reason`、路径/顺序及 advisory 负控均合断言才 pass；合并缺口或空数组漏检是 fail；当前未实现/未运行，记 unknown/not_done/G2。 |
  | 自动代码检查：未来适用，拟议 ESM 导出/契约形状 | 授权实现后可运行 `node --check runtime/stage/stage-end-report.mjs`，保存 Node 版本与原始结果；针对坏语法的定向副本负控应非零 | 未来语法检查与负控只证明语法层；当前 stub/未执行记 unknown/not_done/G2，不能代替行为检查或人工 review。 |
  | API/接口：未来适用，T007 模块导出契约 | 获授权实现后，针对三个真实 ESM 导出与测试内临时 `stage-result.json`/证据目录验证模块接口；不要求 T008 CLI capture/provenance，也不把未认证来源当阶段真值 | 当前无实现，记 unknown/not_done/G2；模块接口观察可与八-it 单测同命令，须与后续 T008 来源认证分开判定。 |

- **Scenario / fixture or service**: （frozen test contents, not a current run） 冻结测试源码内预置了夹具 `chainRows`（含一条空 `evidence_refs` 的行与一条 id 为空的负控行）、夹具 `stageResult`（`quality_missing` 两项）以及 mkdtemp 临时目录中的 `stage-result.json` 与一个证据文件；这描述测试输入，不构成已运行或已产出证据；无外部服务
- **RED/GREEN gate_cmd**: `npx vitest run runtime/stage/stage-end-report.test.mjs`
- **expected_exit**: （planned target only）RED 目标 exit 非零（nonzero/1：八-it 中任一目标断言失败）；GREEN exit 0（all eight frozen `it` assertions pass against an authorized implementation）。Historical RED declarations conflict: this phase previously said `Tests 7 failed | 1 passed (8)`, while the task-store prewritten RED README lists `6 tests / 5 failed`; the cited `.txt` original was not found in the checked workspace/task-store directories. Neither count, test identity, attribution, nor run provenance is verified. No current T007 run was established in this audit.
- **RED target failure**: ORACLE-REPORT-FACTS-TRUTH 目标失败断言（未来形态）：对当前 stub 运行八-it gate 时导出面断言失败（expected 三个导出为可调用函数，实际为空 stub），exit nonzero。provenance 说明：本相位旧文曾称 `Tests 7 failed | 1 passed (8)`，task-store README 则列 `6 tests / 5 failed`；对应 `quality/evidence/prewritten-red/P5-T007-report-facts-red.txt` 在已检查 workspace 与 task-store 预置目录均未找到。两种历史说法互相矛盾，均不作当前 RED 证据；此为位置限定查找，不推断从未运行。本轮未运行 T007 gate，无本轮 RED/GREEN/exit；不涉及 T008 CLI 命令或 capture。
- **GREEN oracle**: ORACLE-REPORT-FACTS-TRUTH — future pass signal: all eight `it`s pass (all three exports callable; not-done itemization and machine states; route matrix with reasons and `hard_requirements={command,exit,output}` booleans; non-empty disclosure for `coverage_limits`/`exceptions`; correct render ordering and source paths; missing `stageResultPath` returns `missing`; itemized `spec-analyze` decisions enter `not_done` and passing decisions do not). The frozen test assertions do not establish full source completeness.
- **Evidence**: （planned locations/history only） Current audit did not find `quality/evidence/prewritten-red/P5-T007-report-facts-red.txt` or any `quality/evidence/stage-quality/build-code/P5/` files. The cited RED count and future build-code GREEN/negative-control paths are unverified declarations, not present evidence; preserve their expected location only and require exact raw runner output, identity, snapshot, and status if recreated after authorization.
- **STOP / recovery**: 若通过测试需要改 `stage-handoff` 形状或接入 stage-runner，停止并回报主会话（越界）；若负控不变红，说明断言无效，停止并重写断言；若定向 vitest 出现其它 runtime 文件被误收集，收窄 include 模式（禁止以无范围全量 vitest 代替）
- **Coverage limit**: （planned T007 scope; not current behavior） 获授权实现后只产事实层与渲染文本，不自动接线进阶段流程、不写回 stage 记录、不产聊天叙述（叙述由独立子代理按规则文档执笔）；运行时自动归档行为不在 T007 范围；**F-10 披露**：冻结测试对 `sources` 字段与 `exceptions[].status` 只有排除性断言，没有正向断言——「sources 是否收集齐全」不由机器保证；`spec-analyze` 判决入账只证明 advisory 结论逐条进 `not_done` 且不写入 `status` 投影，不改变 gating 语义，生产者侧是否生成 advisory 条目不在本任务范围。当前 stub 不提供这些行为。
- **Done**: （未来验收条件，当前未满足） T007 的 build-code implementation scope 仅在获授权实现三个导出、八个 frozen `it` 全绿并保存该任务要求的模块实现证据后才算完成；模块门不依赖、也不证明 T008 CLI provenance/capture。当前 T007 为空 stub，未建立 RED/GREEN run；T008 blocked/not_done/G2，P13/T024 最终交付另行验收。

### T008 — P5 中途事实检查点：真实来源事实层落盘（非最终交付）

**当前状态：blocked / not_done / G2。** T007 `runtime/stage/stage-end-report.mjs` 仍为空 stub，且没有可核验的单次官方 CLI capture/canonical provenance 方案。下文历史 inline generator、报告命令、`T008-delivery.txt` receipt/index 说法均不是可执行指令或有效来源证明；不得运行、生成或将其记为证据。只有 T007 获独立批准实现并通过八-it gate、且 capture 机制/身份/快照绑定另经核验后，才重写并审查 T008 命令与证据契约。当前三文件结构 gate 仅是未来形状检查，不改变此阻塞。

- **Source / FR / AC**: R-004、R-001（decision-log D-005）/ FR-21 / AC-21
- **Files / symbols**: `quality/evidence/stage-quality/build-code/P5/report-facts.json`、`quality/evidence/stage-quality/build-code/P5/report.md`、`quality/evidence/stage-quality/build-code/P5/T008-delivery.txt`（symbol: N/A — P5 中途检查点文件；消费 T007 的 `collectStageEndReportFacts`/`renderStageEndReport`；旧文件名仅为兼容冻结三文件结构 gate，内容必须标记为本地未认证索引，不是收据或官方质量事实）
- **Action**: 当前仅定义 T008 的阻塞事实，不提供可运行命令。T008 必须先有独立批准的 T007 实现及其本地八-it GREEN，再由独立审查确认 authenticated task worktree/CWD、project/task identity、HEAD/source snapshot、canonical source 与官方 CLI 单次原始 capture 机制。显式 `--project`/`--task` 仅选择身份，不认证调用者/来源。任一项不可验证即停止并保留 `unknown/not_done/G2`；不得运行旧草案、生成貌似官方事实或重复执行阶段。旧 inline exporter 已移除；未来导出命令须另行设计和审查。
- **Inputs**: （current blocker） T007 的预期三个导出与 `stage-end-report-facts.v1`（`specs/workflowhub-thin-core-card-04-20260919/spec.md` 第 7 节与 Interfaces and Failure Semantics）只是未来接口；当前 `runtime/stage/stage-end-report.mjs` 仍为空 stub，T008 必须等独立获批实现和八-it gate GREEN。未来候选来源为唯一一次 CLI 命令 `node tools/cli/stage-runtime.mjs run --action=execute --stage=build-code` 的原始 stdout（CLI 参数用 `--key=value`，即 `--stage=build-code`），但在 authenticated worktree/CWD、身份、HEAD/source snapshot、canonical provenance 与单次原始 capture 方案经审查前，此命令/导出串联不是可执行指令。不得用 `status --action=begin`，不得声称 CLI run 暴露 acceptanceChain。若未来真实来源获认证，advisory 逐条取自 run JSON 且 refs 与真实质量事实交叉核；无真实 acceptanceChain/AC 行时，缺口仍为 `incomplete/G2`，不得造 rows。
- **Outputs / failure**: 未来预期的三个 P5 中途检查点产物；当前未产生且不得补造。未来失败 = 缺任一产物、`schema_version` 不符、`not_done` 为空数组、渲染三段顺序错乱、输入来源/快照无法认证（仅 schema 或本地索引不构成认证）、把检查点冒充最终交付
- **Boundary / DO NOT TOUCH**: 不改 `runtime/stage/**`（不接线、不改形状）、不改 `tools/cli/**`、不新增依赖；若未来授权并执行 T008，检查点文件按现有 evidence 路径落盘而非新建发布记录；T008 的 authenticated `report-facts.json` 条目不得手工编造，必须来自经认证的真实来源调用。此来源认证不限制 T007 纯模块实现或本地单测 fixtures。最终独立叙述与汇总路径由 P13/T024 独占，P5 不写
- **Dependency**: T007（T007 implementation and its eight-it targeted gate must be GREEN first；当前 T007 为空 stub，本任务保持 blocked/not_done/G2，产物不得伪造）
- **Test tier / skill**: 真实来源中途事实检查点（不验收独立叙述）/ build-code 定向事实
- **逐层计划（非执行结论）**：设计用 `testing-system-blueprint`，真实中途检查点边界由 build-code 按 diff 选 `backend-testing`；绑定实际 build-code 阶段的 P5 范围、真实来源文件及原始记录，不把检查脚本的 GREEN 当作全相位事实或独立叙述已验收。

  | 层/适用性 | 精确目标、环境/夹具、预期原始结果 | 可观察 pass / fail / unknown |
  | --- | --- | --- |
  | 单元：当前不可判 N/A，T008 无实现且被阻塞 | 不运行 T008 专属单测；T007 八-it gate 仅在获授权实现后验证其自身 | T008 与消费者/变换代码均未实现，保持 unknown/not_done/G2；后续不得从 T007 测试绿推断 T008 完成。 |
  | 自动代码检查：未来适用，现有三文件 shape gate 未运行/未验证且不是来源或交付证明 | T008 blocked；只有在获批 T007 实现、八-it GREEN 及独立认证的 capture/provenance 方案建立后，才重审 gate 并执行 | 当前保持 unknown/not_done/G2；任何未来 gate GREEN 最多证明精确定义的文件结构，不能认证真实输入、来源、阶段完成、最终交付或独立叙述。 |
  | API/接口：当前不可执行，T007 是空 stub 且没有已认证的单次官方 capture 方案 | 仅在 T007 获独立批准实现/八-it GREEN、可信 worktree/任务/源码快照与 canonical 单次 capture 建立后重新设计并审查 | 当前不可执行、无已核准来源契约；保持 `unknown/not_done/G2`，不得伪造调用/产物/来源。 |

- **Scenario / fixture or service**: 使用真实 P5 截止时的 build-code 阶段事实（至少含两条真实「没做到」项，例子不代替原始来源；未发生的后续相位绝不写通过）；无外部服务
- **RED/GREEN gate_cmd**: `bash -c 'for f in quality/evidence/stage-quality/build-code/P5/report-facts.json quality/evidence/stage-quality/build-code/P5/report.md quality/evidence/stage-quality/build-code/P5/T008-delivery.txt; do test -f "$f" || exit 1; done'`（旧三文件存在性检查的合同形态；本任务当前 blocked，禁止以手工构造或无认证文件运行求绿；任何未来实现需先审查并重写 shape gate 与独立来源认证方案）
- **expected_exit**: 旧 `test -f` 命令 exit 1 只表示至少一个文件缺失，exit 0 **只表示三个路径存在**；它不会读取内容或认证 provenance，伪造空文件也可能使它 exit 0，绝不能据此报 T008 GREEN。现行 T008 必须另核下文同次来源 ref/hash、任务/材料/快照和真实 P5 正反场景；当前三文件缺失且没有认证来源，任务仍 not_done。
- **RED target failure**: ORACLE-REPORT-DELIVERED 目标断言失败（provenance 未建立）——三文件齐备性断言 expected report-facts.json/report.md/T008-delivery.txt 同时存在，当前缺失即断言失败、exit 1。本计划未执行当前有效命令；既有结构合同/历史 RED 不能替代认证来源。没有可回读的当前原件，不报告本轮 RED/GREEN 或 exit。
- **GREEN oracle**: ORACLE-REPORT-DELIVERED（冻结旧标识，仅为 P5 检查点结构）— 通过信号：三产物存在；未来结构 gate 通过只表示经审查的文件 shape/顺序规则成立；来源、阶段状态、认证和 P5 完成仍需独立原件核验。当前 gate 未运行、T008 blocked，不能报告 GREEN
- **Evidence**: `quality/evidence/stage-quality/build-code/P5/T008-red.txt`、`T008-green.txt`、`T008-delivery.txt`（旧文件名；只允许本地未认证索引，不是收据/官方质量事实/P13/T024 最终交付记录）
- **STOP / recovery**: 若必须改 `runtime/stage/**` 接线才能产出三产物，停止并回报主会话（越界）；若 P5 真实阶段结果或其完整来源不可得，登记 `not_done` + owner 并保留原始缺口，不得用临时造数使 gate 转绿。最终独立子代理不可委派时由 P13/T024 如实登记 `unavailable`，不得由主会话自写自贴冒充
- **Coverage limit**: 旧结构 gate 不核验来源真伪或独立叙述；检查点不改 stage 记录，运行时自动报告不在 T007/T008 写面；最终全相位报告、独立执笔与原样聊天交付只在 P13/T024 验收
- **Done**: 未来仅在真实来源/capture 经认证、三个中途检查点文件齐、审查后的 gate 通过并逐条核验来源和未完成相位状态时；当前 T008 blocked/not_done/G2。

## 2026-09-27 T008 同次真实来源修订

上文 L1 的「不得改 `stage-runner.mjs` / `runtime/stage/**`」及「需要接线就停止」是来源机制未定义时的历史限制，仅保留当时记录；当前 T008 以本节和 L0 的精确写面为准。原三文件存在性门也只检查路径，不是允许手工补文件的办法。当前 [认证来源提案](../../../quality/evidence/stage-quality/build-code/P5/T008-authenticated-source-proposal-20260927.md)给出候选：由既有 build-code `run --action=execute` 的私有实现，在**同一次调用**完成身份/材料/快照预检、得到真实 `acceptanceChain`、当前 P5/T007 测试与可用的同版独立审查 ref/hash、成功发布质量事实及阶段行后，才把本次 `stageResult` 以确定序列化字节保存，连同链与 ref/hash 组成内容寻址来源；P5 三文件仅是可回读的中途索引/渲染，不是新的 canonical 进度账本。这份字节是私有对象序列化，**不是 CLI stdout 原字节**；CLI 输出须另行按实际公共入口留原件，绝不把对象重序列化冒称 stdout。

- **精确接线与 owner**：`runtime/stage/stage-runner.mjs` 只在本次受验证的 handler 结果完成私有发布、反思/阶段行成功落地并回读后，保留同次链，将返回的 `stageResult` 确定序列化为来源字节并传递；不能在发布前或仅凭 `phase_progress` 发射。新增代码和定向测试/证据仅服务这一私有接线；`tools/cli/stage-runtime.mjs` 和 stdout 输出边界不改。若将来必须把 stdout 字节本身绑定到报告，需另作材料修订：CLI 实际输出边界先 capture 完整字节，之后同次私有后处理生成报告，且报告 ref 不回写到该 stdout 形成自引用。`runtime/stage/stage-end-report.mjs` 保持 T007 纯转换器，产出的 `source_binding=unavailable` 不删除、不靠调用者传 `verified=true` 改写。T008 的**独立来源认证单**只能由已认证的 stage-runner 在核实原始 refs/hash 后写入，包含本次来源 ref/hash 和转换器事实 hash；P5/P6/P13 消费者必须重新核认证单的 Task/材料/快照和原字节，不能仅信一个字段。现有 Task store `quality/evidence/` 保存内容哈希来源；固定 P5 路径首次 create-only，同源重试复用，不同来源显式冲突或新版本，不覆盖原件。owner 为现有 build-code 官方运行生产者，消费者仅 P5/T008、P6/T012、P13/T024；取代未认证手工/静态报告，完整机制被经审查的单一报告路径替代时删除，不留兼容桥。
- **触发和失败关闭**：单独 `phase_progress=P5`、任意 build-code run、whole-task `phase_completion.status=completed` 都不是 P5/T007 完成证明。须有当前 P5/T007 真实代码/测试、同快照 canonical receipt、对该版 T007 实现可用的独立审查、任务/材料/快照同次身份以及成功发布和阶段行回读。缺链、错 task/worktree/branch、旧材料/快照、坏 ref/hash、失败或部分发布、审查不可用、未证明 P5 工作时均不得产认证报告或 P5 三文件；保留原始失败/不可用记录并标 `not_done/incomplete`。P1-only 夹具必须不产生 P5 三文件。
- **T008 完成判据中的两种来源表述**：纯转换器事实内的 `source_binding=unavailable` 永远只表示**该函数自身不认证输入**，可以原样留在报告 `not_done`；外层来源是否已核仅由独立认证单及 P5/P6/P13 消费者重读 ref/hash 裁定。T008 若其它条件满足，可以披露这条转换器限制并完成**中途来源检查点**，但不能把报告正文自身称为来源已核，也不能用认证单删除其它真实未完成项。若面向用户的呈现因此含糊，须另经审查改呈现，不静默删 warning。
- **定向验收**：先保留 P6/T012 原 17 项中 4 失败的冻结原件，随后把其中 P1-only 期待 P5 文件的错误断言改成“无 P5 报告”负控，并新增真实 P5 夹具正例。该冻结测试修订仅由本次 build-plan owner 指定的这两处断言/夹具承担，不删其它用例；旧字节和旧 RED 保留，修订后的行为目标 RED 先于生产接线取得。T008 还须核同次来源原始字节、三文件内容、逐 AC 缺口、同源重试，以及坏 task/tree/material/receipt/链/写中断的失败关闭。仅跑 T007 八项、窄来源测试、修订后的 P6 E2E 及受影响邻接测试，不跑无范围全量。
- **当前状态**：T007 仅局部 8/8；T008 来源生产者、P1 负控与真实 P5 正例均未实现，三文件仍缺。当前计划修订不是 GREEN、正式审查或阶段完成事实。

### 2026-09-27 T008 报告消费补界（当前修订）

上段“来源生产者未实现”是写侧接线前的历史状态：当前 `runtime/stage/stage-runner.mjs` 已有本地私有 T008 hook 和隔离夹具定向原件，按 source、certificate、`report.md`、`T008-delivery.txt` 顺序写入并回读，**最后**才以 create-only 写 `report-facts.json` 作为报告完成标记。单文件写入故障可能留下前四者的孤儿；本卡当前没有真实 P5 phase review、用户的 `## 人工例外声明` 或已认证的 CARD-04 三文件报告，隔离夹具中的 review/声明不能冒充它们。既有 writer 复核不代替下面独立读者的认证。

- **Owner / 唯一读路 / 删除条件**：P5 evidence owner 在现有 `runtime/evidence/freshness.mjs` 增加一个私有只读 P5 报告认证函数，唯一消费者是 P6/T012 当前真实 E2E 与 P13/T024 最终聚合；定向测试只在现有 `tests/contract/p5-same-run-report-source.test.mjs` 增量验证读回。它不写 fact、收据、进度或公共 CLI，不新增 schema、stage、gate、状态账本。经独立审查的等价现有读路接管 P6/P13 且旧原件保留时删除此专用函数；与 P11 同文件读者的修改须串行，不能覆盖其投影。
- **认证次序**：先从已认证 Task 的固定 P5 路径读取 `report-facts.json` 原字节；没有该完成标记，即使 source/certificate/`report.md`/`T008-delivery.txt` 存在也只报 `missing`，不继续采信孤儿。存在时才逐字读 delivery、certificate、source、report、facts，核固定路径和内容寻址 ref/文件名/sha256 相互一致；从当前 Task/workspace **重新取得**材料 revision、Git snapshot/tree、阶段行及 P5 游标，不接受调用者自报绑定。source/certificate 还须逐条重读 implementation/tests/review 收据、tests output、quality fact 及 decision-log 声明原字节/哈希，核 Task、材料、tree、同次阶段行、P5 review 与来源身份；用已认证来源重算 T007 facts 和渲染正文，要求与固定文件字节一致。认证只说明这份中途报告的来源链可读，不把其中逐 AC 状态或 `source_binding=unavailable` 洗成通过，也不把夹具声明当 CARD-04 用户授权。
- **失败与目标**：缺 facts、坏/缺 certificate、错 ref/hash、错 Task/material/tree、报告正文篡改、半写孤儿均返回“没有可认证报告”的 `missing` 和具体原因；实际读取能力不可用单列 `unavailable`。先保存测试原字节，新增上述负控与同次真实 P5 夹具正例取得目标 RED，再做只读实现并复测；P6/P13 各自的消费者断言另归其 owner。旧三文件存在性门即使 exit 0 也不能作 T008 完成依据；当前 CARD-04 没有真实 P5 报告，P5 相位仍 `not_done`。

## L2

删除证明：不涉及删除——本相位写集仅含上列 NEW 文件，零删除项；无文件、无功能、无测试被移除。

**Phase P5 逐层评估与跨 Task 旅程（仅计划，实际执行/技能调用/结果写 build-code 事实）**：用 `testing-system-blueprint` 设计；实际 backend 变更优先 `backend-testing`，跨边界真实链按 diff 改用 `fullstack-slice-testing`；原 gate_cmd 不变，任何四层结论均绑定运行快照、runner 身份及原件。

| 层/适用性 | 独立 Phase 目标、环境/夹具、预期原始结果 | 可观察 pass / fail / unknown |
| --- | --- | --- |
| 单元：T007 本地八-it gate 仅在获授权实现后适用；T008 当前阻塞 | 获授权后运行 T007 定向 gate 验证纯模块；不运行 T008 专属测试 | T007 当前未实现/未运行，T008 与消费者未实现，均保持 unknown/not_done/G2；不得从 T007 绿推断 T008 完成。 |
| 自动代码检查：T007 实现后可做语法检查；T008 当前阻塞 | 未来分别对获授权 T007 和另行审查的 T008 shape gate 做 scoped 检查 | T007 语法 GREEN 不认证 T008 输入/来源；当前无 T008 运行结果，保持 unknown/not_done/G2。 |
| API/接口：T007 模块导出契约未来适用；T008 来源认证当前不可执行 | T007 获授权后以真实 ESM 导出及测试夹具核模块接口；T008 仅在另经批准的可信 worktree/任务/源码快照与 canonical 单次 capture 建立后重新设计审查 | T007 当前 `unknown/not_done/G2`；T008 无已核准来源契约，保持 `unknown/not_done/G2`，不得伪造调用/产物/来源；AC 行缺失继续 `incomplete/G2`。 |
| 真实 UI：当前 `unknown/provisional`，不得判 N/A；P1 真实入口/消费者 inventory 仍 RED，且须以完整库存和真实 diff 独立确认无页面/交互消费者后才可重评 | 当前不宣称无浏览器命令/截图即可满足 N/A；若 inventory 或真实 diff 指向页面消费者，按 `frontend-testing`/`isolated-browser-qa` 的真实服务/隔离浏览器路线重新计划；库存未完成或 adapter 不可用均为 unknown/unavailable | 仅在已完成且可核验的无消费者库存证据下才可 N/A；不能由“没有前端改动”推断；环境不可用绝非 N/A。 |

**独立跨任务用户旅程 P5-J1（当前阻塞计划）**：未来需真实 build-code 原件、经认证 T007 导出及逐 AC 映射后方可执行；负控包含删缺口、错来源、误报 advisory、将未来相位标通过。预期原件与身份/快照须由届时另行审查的 capture 契约定义；旧 `T008-delivery.txt` 只能是本地未认证索引，绝非来源证明。当前未发生，记 `unknown/not_done/G2`，不造数；P13/T024 另核全相位最终交付。

相位验证：T007 定向八-it gate 仅在获授权实现后运行；T008 当前 blocked，不报告真实输入/导出/gate GREEN。未来相位 gate、真实 P5 中途事实及独立来源认证须在 T007 与 capture 契约确定后另行审查。
相位 Done：T007 获授权实现及其八-it gate GREEN，且 T008 经审查的 capture/provenance 契约、真实 P5 事实导出和独立认证均完成；否则保持 not_done/G2。最终独立叙述、原样贴出和全相位交付由 P13/T024 完成。
相位 STOP：越界改归档形状或负控失效即停；无法取得真实 P5 来源即如实登记 `not_done` + owner；最终独立叙述若不可得由 P13/T024 登记 `unavailable`。
