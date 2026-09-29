# README post 材料导航修正：规格与实现设计

## 身份与方向

- Task：`workflowhub-readme-post-materials-20260927`；普通任务；冻结 cohort 为 `post`。
- 决策来源：`decision-log.md` D-001/D-002；用户仅答复「可以，就改这一行」。
- 交付目标：README 的 post 路线指向当前实际材料；用同一个可失败检查留下修前失败和修后通过的原始记录。

## 材料导航

| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| 当前事实与范围 | 旧文案、真实运行时材料和单行写面 | 实施前 |
| 需求与验收、验收标准 | 两项需求及修前失败、修后通过的判据 | 编写和运行检查时 |
| Implementation Design | 代码锚点、输入输出、来源追溯与全局核验 | 审查计划及独立验收时 |
| 风险和证据界限 | 字符串检查与完整质量结论的边界 | 阶段收口时 |

## 当前事实与范围

`runtime/task/material-workspace.mjs` 的 post 读取器使用 `decision-log.md`、`spec.md`、`phases/index.md`，再从纯指针索引读取独立 `phases/P<n>.md`。`docs/standard-workflow.md` 同向。pre/history 仍保留旧四材料。当前 README 的 post 行误写 `plan.md`、`tasks.md`。

产品改动只准修改 `README.md` 的 post 一行。pre 行、运行时、仓库测试、其它任务和历史材料不在写面内。本 Task 自己的 `decision-log.md`、`spec.md`、`phases/P1.md`、`phases/index.md` 是正常 post 材料；可失败检查脚本与运行原件只在本 Task 外置 `quality/evidence/`，不构成仓库代码改动。

## 需求与验收

### FR-DOC-001：正确导航

将 README post 行中的 `spec.md, plan.md, tasks.md` 改为 `spec.md`、独立 `phases/P<n>.md`、纯指针 `phases/index.md`，保留该行其余路线内容和 README pre 行。

### FR-DOC-002：纯文档检查

外置只读脚本 `quality/evidence/readme-post-materials-check.mjs` 是本 Task 的专属检查。build-plan 在旧 README 上用它取得目标 RED，build-code 仅改单行后用**相同字节、相同命令**取得 GREEN；记录脚本哈希、README 前后哈希、命令、退出码和原始输出。verify-code 独立核对生产读取器、标准流程与实际 Git diff。

检查脚本的六项断言依次为：`pre README line remains unchanged`、`post README line names current materials`、`runtime post base materials agree`、`runtime pre materials remain historical`、`workflow says post has independent phases`、`workflow rejects post plan/tasks double-write`。具体代码与当前哈希以本 Task 外置检查脚本原字节为准；本清单供独立审查逐项对账。

### AC-DOC-001：错误可被检查抓住

- 条件：README post 行仍写旧 `plan.md/tasks.md`，生产读取器与标准流程保持当前版本。
- 动作：运行外置专属脚本，参数为本 Task 工作区。
- 结果：`post README line names current materials` 这一项失败且退出码非零；pre、运行时与标准流程的其它断言仍通过。导入失败或零检查不算目标 RED。
- 反例：把脚本改成接受旧文案，或只引用早前预检输出，均不满足本 Task 的正式 RED。

### AC-DOC-002：修正后的同一检查

- 条件：仅 README post 一行改为当前材料说明，脚本字节与命令保持 AC-DOC-001 的版本。
- 动作：再次运行外置专属脚本，复核 Git diff 和 pre 行。
- 结果：六项断言通过、退出码零；仓库交付差分仅为 README 与本 Task Markdown 材料。
- 反例：pre 行变化、运行时/仓库测试文件变化，或脚本原字节变化，均不能记为这项验收通过。

## 验收标准

- **FR-DOC-001**：README post 单行指向当前 `spec.md`、独立 Phase 文件和纯指针索引，pre 行不变。
- **FR-DOC-002**：同一外置检查保留正式修前 RED、修后 GREEN 和可核的字节身份。
- **AC-DOC-001**：旧文案时仅 post 文案断言失败，其他五项通过，退出码 1；正式原始输出可读。
- **AC-DOC-002**：修后同脚本六项通过、退出码 0；README 前后完整哈希和纯文档差分可读。

## 实施设计与消费者

唯一实施相位为 `phases/P1.md`，唯一工作项为 T001。README 的真实消费者是阅读普通任务路线的新任务作者；外置检查仅供本 Task build-code、verify-code 与 CARD-04 的 AC-19 样例核对。该脚本不进入生产仓库，不新增公共命令或质量门。无页面、API、服务或状态迁移；UI applicability 为 `non_ui`。

## Implementation Design

### Code Anchors

产品写面为 `README.md` 的 post 普通任务路线一行；事实来源为 `runtime/task/material-workspace.mjs` 和 `docs/standard-workflow.md`。专属检查原字节在仓外本 Task `quality/evidence/readme-post-materials-check.mjs`，不写仓库代码。

### Interfaces and Failure Semantics

检查脚本读取工作区 README、生产材料读取器和标准流程文档。输入为 Task 工作区路径；输出是逐项 PASS/FAIL 行及进程退出码。旧文案应只产生一个目标 FAIL 和退出码 1；修后六项 PASS、退出码 0。导入错误、路径缺失、脚本换版或只凭绿色命令都不能宣称验收完成。

### Requirement-to-Task Trace

| 原始来源 | FR | AC | Phase/Task | oracle |
| --- | --- | --- | --- | --- |
| R-005 | FR-DOC-001 | AC-DOC-002 | P1/T001 | ORACLE-README-POST-MATERIALS |
| CARD-04 AC-19、R-002 | FR-DOC-002 | AC-DOC-001、AC-DOC-002 | P1/T001 | ORACLE-README-POST-MATERIALS |

### Global Verification Strategy

在旧 README 上运行 `node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-readme-post-materials-20260927/quality/evidence/readme-post-materials-check.mjs /Users/Hugh/Hugh/Project/workflowhub-workflowhub-readme-post-materials-20260927`，要求目标 RED；实施后用同一命令取得 GREEN。核对脚本和 README 的完整 SHA-256、命令、退出码、原始输出及 Git 差分。只跑此受影响检查；独立审查另读生产来源和 pre 行。

## 风险和证据界限

精确字符串检查只能证明这一行与当前来源相符，不能单独证明整仓文档都正确；verify-code 须独立读代码与标准流程。此前候选一行与预检 RED/GREEN 是历史准备证据，不能当作正式 build-plan/build-code 执行。任何正式阶段缺 review、确认或复盘，保留 `incomplete/unavailable`，不借绿色脚本宣称整 Task 通过。无 close、提交、合并或推送授权。

## build-plan 审查处置

官方 build-plan 审查返回一份 canonical result（单次审查仍须保留 provider provenance），四条 finding 均按原件处理：`F-0a0f41571f72` 已补脚本六项断言清单；`F-2404a8181a5e` 已把仓内写面与仓外证据分开；`F-5f3880a55125` 已给逻辑调用写法并保留当前机器可执行命令；`F-b49b4287c2a9` 已在 P1 输出与证据要求中逐字补 README 前后完整文件哈希。最后一条是审查报告中的 major，修复内容须由独立审查或 verify-code 核对，不能因本文自述就算通过。原审查结果与审查前材料均保留在外置 Task store。

## 来源映射

| 来源 | 需求 | 验收 | Phase |
| --- | --- | --- | --- |
| 用户本 Task 单行答复；D-001 | FR-DOC-001 | AC-DOC-002 | P1/T001 |
| CARD-04 AC-19；D-002 | FR-DOC-002 | AC-DOC-001、AC-DOC-002 | P1/T001 |
