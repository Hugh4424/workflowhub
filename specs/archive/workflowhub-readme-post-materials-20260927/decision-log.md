# README post 材料路径修正：方向记录

## 任务身份

- task_id: `workflowhub-readme-post-materials-20260927`
- project: `workflowhub`
- activation_cohort: `post`（以外置 `task.json` 的冻结值为准）
- worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-readme-post-materials-20260927`
- branch: `task/workflowhub/workflowhub-readme-post-materials-20260927`
- **任务类型**：普通任务
- 状态：用户已明确同意只修 README 的 post 一行；正式阶段完成事实仍待实际运行核对。

## 原始需求

| id | 原始要求与来源 | 处置状态 | 当前落点 |
| --- | --- | --- | --- |
| R-001 | 用户在 CARD-04 结构化问答中选择界面选项「补做三项，目标是全部完成（推荐）」；这是选项答复，不是用户亲自指名 README。 | covered（补做方向，非本 Task 材料确认） | D-001/D-002 提出真实样例。 |
| R-002 | 母 PRD CARD-04 AC-19：一个完整纯文档 Task 须有理由、风险和验收披露的豁免，或一条可失败检查；直接跳过且无披露为失败。 | covered（判据已映射，执行未完成） | D-002 采用专属可失败检查。 |
| R-003 | 仓库一手事实：`README.md` post 行写旧 `plan.md/tasks.md`，与 `runtime/task/material-workspace.mjs` 及 `docs/standard-workflow.md` 相矛盾；本会话据此选择 README 修正作真实样例。 | covered（agent 提案，须本 Task 确认） | D-001 只修错文案，不冒充用户原话。 |
| R-004 | pre/history 的运行时 `CURRENT_MATERIAL_FILES` 仍含 decision-log/spec/plan/tasks；README pre 行只写五阶段路线，未列具体材料。旧已产出 task 由各自材料和存档保留，本 Task 不迁移它们。 | covered（历史与反例边界） | D-001 守住 pre 行原文，不把旧材料错判为 post。 |
| R-005 | 用户针对本任务的具体 README 单行方案答复：「可以，就改这一行」。该答复同意修改范围，不代表用户亲自设计外置检查或证明后续阶段已完成。 | covered（真实用户答复） | D-001；D-002 的检查办法仍由 R-002 的验收要求推出。 |

- 用户在 CARD-04 任务中选择界面选项「补做三项，目标是全部完成（推荐）」。这是选择了一项选项，不是用户亲自指定 README 文件或技术实现。
- 母需求 AC-19 要求检查一个真实纯文档 task：有理由、风险和验收披露的豁免，或一条可失败检查；直接跳过且不披露即失败。CARD-04 整体包含代码，不能把其中的文档工作项冒充完整纯文档 task。
- 本任务作为这个样例，修正仓库顶层 `README.md` 的真实错误：它把 post cohort 的 build-plan 产物写成 `spec.md`、`plan.md`、`tasks.md`。当前生产来源 `runtime/task/material-workspace.mjs` 和 `docs/standard-workflow.md` 指向 `spec.md`、独立 `phases/P<n>.md`、`phases/index.md`；pre/history 仍保留四材料。README 修正是本会话选择的最小真实文档工作，不冒充用户逐字提出的文件名。
- 权威核对：项目 `AGENTS.md` 的 vNext 永久实施边界明确 post 的 `spec.md`、独立 Phase 和纯指针 index；生产读取器 `materialFilesForCohort("post")` 与 `docs/standard-workflow.md:250-251` 同向。已存在的 CARD-04 post Task 实际有 `spec.md`、`phases/P1.md`、`phases/index.md`，没有 post `plan.md/tasks.md`。pre 读取器仍返回旧四材料，README pre 行仅陈述路线。这组独立来源确立 README post 文案为错，不是只凭两个文档互相投票。
- 数据状态：pre/history 仍读 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`；post 读 `decision-log.md`、`spec.md`、`phases/index.md` 和索引指向的独立 Phase。这里只修 README 的说明，不迁移既有 Task 数据。
- 身份：官方 task bootstrap 创建独立 post Task，外置记录在 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-readme-post-materials-20260927`；本分支从 `ef920f1fbd415fe87d50930359059b661e141acd` 建立。CARD-04 工作树不在本任务写面内。

## 唯一 OI 大纲（current authority）

`outline_version=r0`。以下只有一个当前大纲，问题来源见 R-001..R-005；R-005 仅确认 README 的单行修正，其余实现细节按一手事实和 R-002 处理。

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background | OI-001 | false | post/pre 当前材料来源须核对。 |
| N-problem | problem | OI-002 | false | README post 文案已与当前代码冲突。 |
| N-goal | goal | OI-003 | false | 用户要求补一个真实文档样例。 |
| N-solution | solution | OI-004 | false | README 最小修法及外置检查位置待本 Task 确认。 |
| N-acceptance | acceptance | OI-005 | false | 需真实失败检查、修后通过及纯文档 diff。 |
| N-extension | extension |  | true | 没有第二功能或后续机制。 |

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-002, OI-003, OI-005 | false | 新任务作者应由 README 找到正确 post 材料。 |
| page_scope |  | true | README 文字修正不触及页面或交互。 |
| data_state | OI-001 | false | pre/post 文件形态须以当前运行时代码核实。 |
| success_failure_boundary | OI-005 | false | 旧文案应让检查失败，正确文案通过且 pre 不误改。 |
| non_goals | OI-004 | false | 不改 runtime、仓库测试、stage/public API；另外两项补做仍归 CARD-04。 |
| deferred |  | true | 没有已经识别的延期交付；新发现须增量登记。 |

```yaml
task_id: workflowhub-readme-post-materials-20260927
outline_version: r0
oi_id: OI-001
category: data_state
source: R-003
question: post 与 pre 的当前材料各是什么？
status: resolved
answer: post 使用 spec.md、独立 phases/P<n>.md、纯指针 phases/index.md；pre/history 保留旧四材料。
answer_source: R-003, R-004, runtime/task/material-workspace.mjs, docs/standard-workflow.md
impact_dimensions: [scope, acceptance]
requires_user_decision: false
visible_group_id: readme-post-direction
```

```yaml
task_id: workflowhub-readme-post-materials-20260927
outline_version: r0
oi_id: OI-002
category: complete_user_flow
source: R-003
question: README 的旧 post 路径会怎样误导新任务作者？
status: resolved
answer: 旧 post 行会让新任务作者寻找不存在的 plan.md、tasks.md，遗漏当前 Phase 文件。
answer_source: R-003, README.md:29, runtime/task/material-workspace.mjs
impact_dimensions: [goal, acceptance]
requires_user_decision: false
visible_group_id: readme-post-direction
```

```yaml
task_id: workflowhub-readme-post-materials-20260927
outline_version: r0
oi_id: OI-003
category: complete_user_flow
source: R-001, R-002, R-005
question: 是否用这处真实 README 错误补做纯文档 Task 样例？
status: resolved
answer: 用户答复「可以，就改这一行」；限 README post 行。
answer_source: R-005
impact_dimensions: [goal, scope]
requires_user_decision: true
visible_group_id: readme-post-direction
```

```yaml
task_id: workflowhub-readme-post-materials-20260927
outline_version: r0
oi_id: OI-004
category: non_goals
source: R-003
question: 是否只改 README post 行、把专属检查留外置 Task store，并保持仓库生产/测试代码不动？
status: resolved
answer: 只修改 README post 一行；pre 行和运行时、仓库测试代码不动，检查脚本只在外置 Task store。
answer_source: R-003, R-004, R-005, D-001, D-002
impact_dimensions: [scope, ordinary_detail]
requires_user_decision: false
visible_group_id: readme-post-direction
```

```yaml
task_id: workflowhub-readme-post-materials-20260927
outline_version: r0
oi_id: OI-005
category: success_failure_boundary
source: R-002, R-003
question: 如何依项目永久边界、生产读取器与真实 post Task 证明 README 是错的一侧，并取同一检查先失败后通过？
status: resolved
answer: 同一外置检查在旧文案上目标失败，在改单行后通过，并保存真实命令、退出码、原始输出与脚本字节哈希。
answer_source: R-002, R-003, D-002
impact_dimensions: [acceptance]
requires_user_decision: false
visible_group_id: readme-post-direction
```

## 核心需求

补做一项**完整纯文档 Task** 的真实验收样例。它必须修一个实际文档错误，并用专属可失败检查或有完整理由、风险、验收披露的豁免证明未跳过检查。当前 README 错误是本会话发现并提议的样例，不是用户指定的文件。

## 目标

使新任务作者从 README 找到 post 的正确材料；完成一项可独立核对的纯文档任务，保留真实失败与修复后通过的原始检查记录。方向尚需本 Task 的真实用户答复。

## 验收标准

- 条件：README 仍写 post=`spec.md`、`plan.md`、`tasks.md`。行为：专属只读检查必须因内容断言失败，输出指名缺 `phases/P<n>.md` 或 `phases/index.md`，exit 非零；导入/环境/零检查错误不算目标 RED。
- 条件：README 只修正 post 一行。行为：同一检查脚本/命令应通过，pre 路线原文不变；保存命令、exit、原始输出和检查字节身份。
- 条件：独立核完整 Task。行为：仓库 Git 差分只含 README 和本任务 Markdown 材料，独立审查把新文字对照当前 `materialFilesForCohort("post")` 及标准流程；若出现生产/仓库测试改动或只靠关键词绿而无语义复核，验收失败。

## 范围

- 当前提案写面：`README.md` 的 post 普通任务路线一行；本 Task 的 `specs/workflowhub-readme-post-materials-20260927/` 当前材料为阶段作者写面；检查脚本/原件仅在外置 Task store `quality/evidence/` 保存，不进入仓库代码/测试差分。

## 非目标

- 不改 `runtime/**`、`tools/**`、`tests/**`、CARD-04 工作树、pre/history 材料契约、已完成的旧 task 产物、公共命令或任务推进门。AC-17 的真实受限开发者与 AC-18 的行为改动样例仍由 CARD-04/P6/T025–T026 承担，本 Task 只做 AC-19 的纯文档样例。不提交、合并、推送或归档作为本 Task 的验收替代。

## 决定

### D-001 — 改正 post 材料导航（用户已确认单行范围）

- **source**: R-001、R-003；`README.md` 普通任务路线段，`runtime/task/material-workspace.mjs` 与 `docs/standard-workflow.md` 当前来源。
- **decision**: 只改 README 的 post 行，写明 `spec.md`、`phases/P<n>.md`、`phases/index.md`，保持 pre 路线原文。
- **rationale**: README 是使用者入口，旧 post 行与生产材料读取器和标准流程文档不一致；改一行即可消除具体误导。
- **consequence**: 新任务作者能找到正确文件；若 README 其它位置仍有冲突，须独立清查并在本任务内如实修订范围。
- **supersedes**: N/A；此任务会替换 README 当前错误 post 文案，不追改历史决定。
- **原始声明层**: R-001 用户选择补做；R-003 为本会话核出的具体缺陷，非用户逐字指定。
- **三级追溯**: R-001/R-003 → 本地代码与流程文档核查 → D-001。
- **status**: accepted；**evidence_status**: R-005 的真实答复；正式确认与阶段完成以外置 Task 记录实跑为准。
- **approval_binding**: R-005「可以，就改这一行」，只绑定 README post 单行范围；不借 CARD-04 的补做答复。
- **owner/next_action**: build-plan 按已确认范围细化并采正式 RED。
- decision/logic: 只改 README post 一行，保留 pre 路线原文；不改运行时。
- module: 文档入口
- requirement_ids: [R-001, R-003]
- derived_from: []
- artifacts: [README.md]

### D-002 — 用可失败检查证明此文档修正（由验收要求推出）

- **source**: R-002、R-003；母 AC-19 与当前 README 错字节。
- **decision**: build-plan 先保存并执行外置只读检查得目标 RED，build-code 只改 README 后同命令得 GREEN；verify-code 独立对照代码/流程来源和完整 Task 文档差分。
- **rationale**: 完整 Task 必须纯文档；把检查脚本放仓库测试文件会使样例失格，外置执行侧车可保留专属可失败检查和纯文档 Git 差分。
- **consequence**: 结构检查只能证明这一处文字，语义正确性仍需独立审查；脚本/原始失败与通过输出须可回读。
- **supersedes**: N/A；补 AC-19 的样例证据。
- **原始声明层**: R-002，不能把本会话技术选择写成用户原话。
- **三级追溯**: R-002/R-003 → 一手 README 与 runtime 对照 → D-002。
- **status**: selected；**evidence_status**: R-002 要求真实检查或完整豁免；正式 build-plan RED 未采。
- **approval_binding**: R-005 只同意 README 一行；外置检查办法是本任务为满足 R-002 选择的执行方法，不冒称用户逐字批准。
- **owner/next_action**: build-plan 保存检查字节并取得目标 RED；build-code 同命令 GREEN；verify-code 独立核。
- decision/logic: build-plan 在实现前保存检查脚本原字节并执行目标 RED；build-code 只改 README 后用同一脚本取得 GREEN，验证 pre 文案未被误改；verify-code 独立对照当前运行时、标准流程和最终 Markdown diff。脚本存于外置 Task store 质量证据，不增加仓库测试文件，以保持完整 Task 为纯文档改动。检查只证明本处文字契约，不能替代独立语义审查。
- module: 文档验收
- requirement_ids: [R-002, R-003]
- derived_from: [D-001]
- artifacts: [quality/evidence/readme-post-materials-check.mjs, quality/evidence/readme-post-materials-red.txt, quality/evidence/readme-post-materials-green.txt, quality/evidence/readme-post-materials-formal-stage-runs.json]

## 调研、Grill 与替代方案

- 内部一手来源：项目 `AGENTS.md` vNext 永久边界；`runtime/task/material-workspace.mjs` 的 `POST_BASE_MATERIAL_FILES`、`CURRENT_MATERIAL_FILES`、`materialFilesForCohort`、`phaseFilesFromIndex`；`docs/standard-workflow.md` 的 post/pre 产物节；已有 CARD-04 post Task 的真实 `spec.md`、`phases/P1.md`、`phases/index.md`；`README.md` 当前 pre/post 两行。项目规则、生产读取器和真实 post 产物同向，README 是错侧。此问题范围小且来源在仓库内，无需外部资料；若来源将来冲突，停止并重新裁定。
- 方案自检：只改 README 能否解决用户误导？能，当前错误就在导航文字；会否改变 pre/history 说明？不能，必须以针对性检查和独立审查守住；外置脚本会否使任务差分含代码？不会，脚本仅在 Task store 执行侧车，但要在证据中清楚披露。这里不是独立 Grill 的执行原件。
- 拒绝方案：修改运行时去匹配 README 旧文案，会破坏已冻结 post 契约；仅手工改 README 而不留可失败检查，无法满足 AC-19 样例；把检查写进仓库测试会使完整 Task 不再纯文档。

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": {
      "fact": "用户选择补做三项；其中母 AC-19 要求一个纯文档任务样例，没有页面或交互要求",
      "conclusion": "non_ui"
    },
    "project_inventory": {
      "fact": "目标变更仅 README post 路线文字；当前静态页面不消费该行",
      "conclusion": "non_ui"
    },
    "planned_or_changed_frontend_fact": {
      "fact": "计划写面只有 README 和本任务 Markdown 材料，不改页面、API、DTO、服务或前端构建",
      "conclusion": "non_ui"
    }
  },
  "gate": false
}
```

实际差分若出现前端文件或消费者关系，必须重算本事实；这里不是浏览器验收通过。

## 收敛检查

| 维度 | 用户答案或无新需求 | 事实/材料引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户先选择补做三项，又对本任务答复「可以，就改这一行」。 | R-001、R-002、R-005、README.md:29 | 本任务修后 post 行指向真实材料；若仍写 plan/tasks 则失败。 |
| 范围 | 用户同意本会话提出的 README post 单行修正，未要求改运行时或 pre 行。 | R-003、R-005、D-001、当前 Git diff | 完整 Task 的仓库差分只含 README 与本任务 Markdown 材料；出现 runtime、工具或仓库测试文件即不能作为纯文档 Task。 |
| 方案 | 用户答复「可以，就改这一行」。取舍：只修 README post 一行，外置检查用于满足 R-002；被拒方案：修改运行时去迎合旧文案；未决项：无方向未决，正式质量证据待核。 | R-002、R-003、R-005、D-001、D-002 | 旧 README 的目标断言非零，修后同一检查为零；只靠导入/环境错误或改检查求绿即失败。 |
| 验收 | 用户选择补做三项；母 AC-19 允许可失败检查或完整豁免，本任务提议走检查。 | R-001、R-002、docs/standard-workflow.md:250 | 场景=读 README post 与 pre 两行；数据来源=当前 README、运行时代码、标准流程及检查原始输出；通过=post 三材料正确、pre 不误改、同检查 RED→GREEN、独立审查；失败=旧文件名残留、原件找不到或 Task 差分含代码。 |

## 审查处置

- 已通过公开 `review --action=record` 派发一次方向审查：pair `2f6d1868-fd40-4954-8bae-26019f13410e`，red/blue 均有 canonical 结果，但 `partial=true`；各角色只有 `kimi/coding` 成功，`antigravity/flash` 失败、`codex/luna` 因 SAME_SOURCE 未执行。两角色各四条 finding 均属单来源，不称多来源完整审查通过。原 review request 短包保存在外置 Task store `quality/evidence/review-direction-request.json`，它没有包括整份本材料；以下按原 finding 逐条处置，不重派只为得到 clean 标签。

| finding | 处置 | 当前材料和未完成边界 |
| --- | --- | --- |
| red F-702fbc4a9a82 | fixed | R-004 与调研段补 pre 的 runtime/README/标准流程事实；pre 原行保持。 |
| red F-c5911baecbb7 | fixed | R-005 记录本 Task 用户真实答复；正式确认回执与阶段事实仍须核对。 |
| red F-ccc1be90b791 | fixed | R-003 和调研段补项目永久边界、生产读取器及真实 CARD-04 post 材料三处同向来源。 |
| red F-deff90cc3289 | fixed | D-002 明定专属只读检查在外置 Task store 保存/执行，仓库差分仍纯文档；真正 RED/GREEN 尚待 build-plan/build-code。 |
| blue F-33709040d37f | fixed | 同 D-002；审查短包遗漏外置检查位置，本材料不遗漏，执行仍待后续阶段。 |
| blue F-c26221fd2c7f | fixed | 本 Task 只交付 AC-19；另两项在 CARD-04/P6/T025–T026，完整三项由 CARD-04 聚合，README 不冒充全部完成。 |
| blue F-d4a82e294f76 | fixed | 非目标已排除旧 task 产物迁移；本 Task 修当前 README 导航，不追改历史材料。 |
| blue F-d9774d93e90c | fixed | R-005 确认 README 单行范围；D-002 的检查方法是实现选择，不冒称用户原话。 |

方向和细节审查均有正式调用；两者的 `recorded` 与局部来源不等于完整独立审查通过。若 provider、Grill 或阶段事实缺失，质量状态如实保留 partial/incomplete。

### 本次细节审查的真实处置

- 官方 `review --action=record` 第一次输入因缺 `approved_direction` 在派发前被拒，结果 `semantic_status=unavailable`；该失败原件保留，不算独立审查。
- 修正输入后派发 pair `45a85838-8fbb-4bd0-b06c-30dbf5035a75`，red/blue 各有一条 minor finding，均只来自 `kimi/coding`；`partial=true`，不称多来源完整审查。
- red `F-1dc9c9ca9094`：fixed。五个 OI 中原只有 OI-003 有 `answer/answer_source`；现给其它四个 resolved OI 补事实答案及来源。
- blue `F-4fce5c3c01b2`：fixed。D-002 增列外置 `readme-post-materials-formal-stage-runs.json`，正式运行时须在其中留同一脚本哈希、命令、exit 和原始输出引用；已有 preflight 元数据不替代正式运行。
- 两条 finding 的修复尚未由第二次独立审查重核，质量仍保持 partial；不为求 clean 反复派发。

## 最终确认

- 状态：用户已答复「可以，就改这一行」。这只批准 README post 单行修正；正式 `confirm --action=decision` 及 `run` 的结果须以实际外置 Task 记录为准。
- CARD-04 的“补做三项”不是本 Task 的材料确认；外置检查的具体写法也不是用户原话。

## 风险与延期交接

- README 其它位置可能仍有旧说法，独立审查应做有限文本/消费者清查；检查脚本只查字符串，语义需独立来源对照运行时和 pre 路线。
- 若完整 Task Git 差分不再纯文档，则 AC-19 样例失效并如实报告；外置 `.mjs` 只是检查证据工具，不是仓库产品交付。

## 未决项

- 用户单行方向已确认；正式确认记录、细节 review/run、build-plan、实施与 verify-code 尚未完成，缺事实保持 pending/incomplete。

## 阶段收口边界

make-decision 的 Talk、Grill、两轮审查、正式确认、官方运行和复盘按实际发生逐项登记；R-005 只证明用户的单行答复，缺任何其它一步留 `incomplete/unavailable`，不造 stage outcome。build-plan 另写当前 `spec.md`、`phases/P1.md` 和纯指针 `phases/index.md`；build-code 与 verify-code 的实跑和审查仍在后面。
