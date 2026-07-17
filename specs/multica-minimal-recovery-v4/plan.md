# WorkflowHub × Multica 最小完整恢复计划

## 1. 实施原则

- Multica 流程问题只改 Multica Prompt、Skill 绑定和 Squad instructions；
- WorkflowHub 只改 review lens、make-decision Skill 闭包和 close 硬校验；
- 先原地修复，不新增 Agent、Squad、provider、adapter、状态机或发布框架；
- 所有 Multica 更新前后都用 production profile 回读，Skill `set` 前保存完整绑定，避免 replace-all 误删。

## 2. 第一组：review-only simplicity guard

在现有 `wh-review` 的 manifest、stage skill plan、stage contract、closure 和测试中，把 `simplicity-guard` 加到 make-decision detail、build-spec、build-plan、build-code 的 provider 材料。

build-code lens 只检查当前 diff 是否出现：未批准扩项、重复实现、投机抽象、兼容层、死代码或吞错兜底。它不得重开已 accepted 的产品范围，也不得因为 LOC、必要测试、输入校验、安全或可访问性要求而拒绝实现。

make-decision direction 和 verify-code 保持不加载。所有生成/实现步骤保持不调用。

## 3. 第二组：Multica 原地配置修复

实时基线已于 2026-07-17 回读。实际写入前再次回读 `updated_at`；若对象已变更，先重新计算字段差异，不盲目覆盖。

写配置前确认七个 WorkflowHub Agent 均为 idle，且不再给 Squad 分配新的生产任务；一个低风险 Canary 通过前不恢复生产派工。

### 工头

替换成短调度 Prompt：

1. 读取父 Issue 与现有子 Issue；
2. 创建或复用五个 stage Issue，标题 `{stage}｜{父任务标题}`；
3. stage 1 设 assignee 后转 `todo`，stage 2–5 保持 `backlog`；
4. 前一 stage `done` 后才推进下一 stage；
5. 等用户时只转发问题，不回答；恢复时在原 Issue 真实 mention 原 Agent；
6. verify-code close `completed` 后才关闭父 Issue。

删除 Launcher、checkout commit、bootstrap、runtime authority、task/generation、receipt、lineage、hash 等实现细节。Skill bindings 设为空；解绑 `caveman`。

补充业务仓边界：WorkflowHub 的 `core/`、`scripts/`、`docs/contracts/` 和 task tracking 只能来自已安装的 WorkflowHub 包；官方入口缺失时设 `blocked`，禁止在目标业务仓补造同名 runtime 文件。

### 五个 Stage Agent

保留“执行自己的 Skill、完成后回报工头”的短规则，删除 Launcher/runtime/identity/lineage 黑话。

- Decision Maker：实质歧义直接问用户；最终展示方向摘要和 `decision-log`，取得方向确认后才能 accepted；
- Spec Builder：产品口径问题在当前 Issue 直接问用户，工头只知会；
- Plan Builder：普通技术拆分自主完成，计划边界最终按宪法确认；
- Code Builder：按 accepted plan 自主推进 phase；删除“每个 phase 都等用户确认”；只有实质歧义、明显阻塞、权限、安全和不可逆动作才升级；
- Code Verifier：fresh 验证后执行 WorkflowHub close；没有 `completed` 不得宣称完成。

每个 Agent 只保留自己的 stage Skill，全部解绑 `caveman`。

### Coder

解绑 `build-code` 和 `caveman`。Prompt 只保留：按 phase Issue 和目标仓库 `AGENTS.md` 实现、测试、提交；不创建 Issue、不推进 stage、不处理 accepted/close。

### Squad

Squad instructions 只保留：Squad 只路由 leader；工头创建/复用五阶段；阶段 Agent 只在自己的 Issue 工作；未轮到 `backlog`；等待、阻塞和恢复遵循工头规则。删除 checkout/runtime 契约。

### make-decision Skill 闭包

通过现有 Skill import 机制重新部署 make-decision 包，确保其直接依赖 `talk-with-zhipeng`、`grill-with-docs`、`decision-log`、`intake-decision-review`、`wh-review` 可解析。依赖放在 Skill 闭包，不把所有子 Skill 绑给 Decision Maker。

上述五个源 Skill 已在本仓库 `skills/` 下确认存在，且当前 `workflows/make-decision/skill-deps.yaml` 已逐项声明；2026-07-17 `node core/check-skill-closure.mjs` 返回 `skill closure: ok`。部署前仍重跑，任一不可解析即非零失败。

## 4. 第三组：Issue、mention、status、恢复

这组只进入工头、Stage Agent 和 Squad instructions，不进入 WorkflowHub core。

- Issue 正文使用七段大白话模板；内部 ID 置底；
- 初次启动靠 assignee + `backlog → todo`，避免状态触发和 mention 双重派工；
- 该触发语义来自 Multica working-on-issues 合同；Canary 首项必须观察 Agent 实际接手，未接手则停止并修订，不用双触发兜底掩盖；
- 等用户：执行 Agent 直接提出“问题、建议、影响”，Issue 设 `in_review`；
- 技术阻塞：Issue 设 `blocked`，写原因、责任方、解除标准、恢复位置；
- 恢复：原 Issue 写真实 Agent UUID mention、裁决/修复结论和下一动作，再设 `in_progress`；
- 完成：产物与 stage 合同满足后才 `done`；工头再推进下一 stage；
- 不使用纯文本 @、`@all`、Squad mention 或新建 generation 作为恢复手段。
- 任何新 generation 先取得用户明确批准；阶段细节留在 stage Issue，整体进度只汇总到父 Issue。

## 5. 第四组：close 的最小有效实现

采用“Code Verifier 执行动作 + WorkflowHub 机器核实”的方式，不建设完整 Git 执行器。

### 计划与授权

修改 `workflows/verify-code/SKILL.md`，在 verify accepted 后冻结具体 close plan。plan 写明目标仓库、任务分支、目标分支、remote、任务 commit、spec 源/归档路径和六项动作。用户只确认一次 plan hash。

### 执行动作

Code Verifier 从主 checkout 执行：

1. 确认任务 worktree 已提交且干净；
2. 在任务分支 `git mv` spec 到 archive 并 commit，随后该 archive commit 必须被合并到目标分支；
3. 合并任务分支到目标分支；
4. push 目标分支；
5. 删除任务 worktree；
6. 在确认任务提交已进入目标分支后删除本地任务分支。

每步失败立即停止。重试先读取 Git 物理事实，从未完成处继续，不重复已经满足的动作。

### 硬校验入口

新增薄脚本 `scripts/task-close.mjs`，复用现有 close plan/confirmation/completed records；在 `core/task-close.mjs` 增加一个窄的 delivery-state verifier。脚本只提供 `prepare`、`confirm`、`complete`、`status`：

- `prepare` 冻结上述计划和前置 Git facts；
- `confirm` 复用现有 plan-hash confirmation；
- Code Verifier 在调用 `complete` 前显式 fetch remote；`complete` 只读探测最终 Git/spec 事实，核实任务 commit 和 archive commit 均在目标分支、已刷新 remote ref 与目标分支一致、路径与 cleanup 状态正确；全部成立后调用现有完成记录；
- `status` 回读完成记录并显示当前物理事实；若 merge 已完成但 push 或 cleanup 未完成，明确列出已完成和未完成动作，不把部分完成显示成 completed。

脚本不自动猜 remote/default branch，不创建 PR，不更新 Multica，不实现通用 command executor。Git 写动作全部由 Code Verifier 按 Skill 执行，core verifier 只读核实。缺少明确 target branch/remote 时在 prepare 阶段失败并请用户确认。

## 6. 验证

自动化只增加现有套件中的行为用例：

- simplicity lens 四个包含、两个排除、生成步骤排除、扩张样例 `revise_required`；
- make-decision 缺依赖、缺 `decision-log`、缺方向确认时失败；
- close 分别缺 commit/archive/merge/push/worktree cleanup/branch cleanup 时 `complete` 失败；
- close 全部完成时写唯一 `completed`，重复调用稳定；
- 现有 five-stage E2E、offline、TaskKernel、close 测试全通过。

配置回读和自动化通过后，只运行一个低风险 Multica Canary。保存父/子 Issue、用户交互、恢复 mention、stage accepted 和 close completed 的平台引用。

## 7. 文件与改动量

### WorkflowHub review

- 约 10–13 个现有 manifest/contract/closure/test 文件；
- 生产逻辑 0；主要是声明和测试；
- 来源：用户明确要求四个阶段审查使用 `simplicity-guard`。

### WorkflowHub make-decision

- 约 2–4 个现有 Skill closure/contract/test 文件；
- 不新增 runtime；
- 来源：ZHI-189 缺交互、缺 `decision-log`，线上依赖闭包缺失。

### WorkflowHub close

- 修改 `workflows/verify-code/SKILL.md`、`core/task-close.mjs`；新增 `scripts/task-close.mjs`；
- 生产代码约 220–340 行，测试约 220–350 行；
- 新依赖、新 schema、新通用抽象均为 0；
- 来源：用户明确反馈漏 commit/push/merge/archive/cleanup，且现有文档与实现不一致。

### Multica

- 原地修改 7 个 Agent、1 个 Squad、1 个 make-decision Skill 包；
- 不新增 Agent、Squad 或平台代码；
- 来源：ZHI-183/184/189/194 与线上 Prompt/Skill 绑定的直接证据。

## 8. 停止条件

若实现需要认证、签名、adapter、provider registry、第二状态机、通用 Git 发布器、PR 自动化或超出 close 预算，停止并返回 make-decision，不把它包装成“完整修复”的必要条件。
