# WorkflowHub × Multica 最小完整恢复规格

## 1. 目标

只解决已经发生的三类问题：

1. Multica 工头和阶段 Agent 没有按五阶段工作，Issue、mention、status、恢复混乱；
2. make-decision 没有与用户交互，也没有产出 `decision-log`；
3. verify-code 口头完成 close，实际漏掉 commit、archive、merge、push 和 cleanup。

同时让 `simplicity-guard` 进入方案审查，阻止再次把小问题扩成平台重构。

## 2. 已核实事实

事实来自 2026-07-17 对 Multica production workspace `Zhipeng` 的只读回读，以及事故审计文档：

- 工头仍绑定 `make-decision`、`build-spec`、`build-plan`、`build-code`、`verify-code` 和 `caveman`；
- 工头 Prompt 仍要求 Launcher、`task-bootstrap.mjs`、runtime authority、task/generation/receipt/lineage；
- Coder 仍绑定完整 `build-code` 和 `caveman`；
- Decision Maker 只绑定 `make-decision` 和 `caveman`；Multica workspace 中没有 `talk-with-zhipeng`、`grill-with-docs`、`decision-log`、`intake-decision-review`、`wh-review`；
- Squad instructions 仍要求固定 checkout/commit 和 runtime 契约；
- ZHI-183 直接派 Coder；ZHI-184 跳过 make-decision、工头代答产品问题；ZHI-189 没有真实交互和 `decision-log`；ZHI-194 所谓“重新触发”没有真实 mention；
- WorkflowHub `verify-code` 文档声称 close 覆盖 commit/push/merge/archive/cleanup，但 `core/task-close.mjs` 当前只有 ancestry 检查和 remove-worktree 两种 executor；
- AgentHub 原版 close 能执行 archive、merge、删除 worktree和本地分支，但没有 push，也没有 Multica Issue close。

## 3. 责任边界

### Multica 配置负责

- Agent Prompt、Skill 绑定、Squad instructions；
- 五阶段 Issue 的创建、标题、描述、assignee、status、mention 和恢复；
- 哪些问题由 Agent 自主处理，哪些问题直接问用户；
- WorkflowHub close 成功后把阶段 Issue 和父 Issue 设为 `done`。

### WorkflowHub 仓库负责

- `wh-review` 在指定审查阶段加载 `simplicity-guard`；
- make-decision Skill 包的依赖闭包和 `decision-log` 完成条件；
- verify-code 的 close 清单、一次独立人工授权和交付结果硬校验；
- 对上述行为的现有测试扩展。

WorkflowHub core 不读取 Multica 评论、不判断“是否真人”、不引用 Multica API，也不新增 adapter、token、签名或认证模块。

## 4. 功能要求

### FR-001 审查时检查范围扩张

`simplicity-guard` 只作为 provider 的 review lens，加载到：make-decision detail、build-spec、build-plan、build-code review。

它不得参与 stage 生成或代码实现，不进入 make-decision direction review 和 verify-code review。

发现未被原始需求要求的系统、抽象、兼容层、未来接口或重复流程时，review 必须给出具体删除项并返回 `revise_required`。不得用增加新要求的方式解决扩张。

### FR-002 工头只做调度

工头必须创建或复用固定五个 stage Issue，只启动 make-decision，根据已完成 stage 推进下一 stage，并维护 Issue、assignee、status、真实 mention 和恢复动作。

工头不得绑定五阶段 Skill，不得直接派 Coder，不得执行 stage，不得替用户回答产品、范围、验收或不可逆操作问题，不得创建第二套 generation，也不得要求 Launcher、bootstrap、runtime authority、receipt 或 lineage。

### FR-003 阶段 Agent 保持最小权限

- 五个 Stage Agent 各只绑定自己的 stage Skill；
- Coder 不绑定完整 `build-code`，只按 phase Issue 和目标仓库规则实现；
- 上述 Agent 全部解绑 `caveman`，Prompt 不再强制黑话压缩；
- Code Builder 只在 build-code 内创建 phase Issue；其他 Agent 不创建 stage 链或兄弟 Issue。

### FR-004 人工边界不扩大

按 WorkflowHub 宪法保留四个真正边界：方向确认、实施计划确认、最终验证确认、绑定具体 close 动作的独立确认。

阶段内部只有以下情况直接问用户：目标、范围、产品口径或验收标准存在会改变结果的歧义；权限、安全或不可逆动作；明显阻塞且现有材料无法继续。

普通技术选择、可逆实现细节和职责内问题由执行 Agent 自主处理。工头只转发和恢复，不作裁决。

### FR-005 make-decision 必须真实交互并闭合产物

- `talk-with-zhipeng` 和 grill 不能由 Agent 静默模拟成人类回复；
- 有实质歧义时，Decision Maker 在当前 stage Issue 直接向用户提问；
- 最终必须向用户展示可读的方向摘要和 `decision-log`，取得方向确认；
- 缺 `decision-log`、缺方向确认或 review 未通过时，不得发布 accepted result；
- 仅出现 `results/make-decision/accepted.json` 路径不算完成。

make-decision 依赖组件必须作为可解析的 Skill 闭包随包部署；不要求把所有子组件绑定成 Agent 的顶层 Skill。

### FR-006 Issue 必须让人看懂

五个 stage Issue 标题固定为：`{stage name}｜{父任务标题}`。技术 ID 只放正文末尾。make-decision 完成评论必须附官方入口实际使用的 `project/task`；工头将其原样写入后续 stage Issue 末尾的“内部引用”，缺值时回原 Issue mention Decision Maker 补齐，禁止推断。

正文只写七项：背景、本阶段目标、不做什么、已有输入、产物、完成标准、完成后交给谁。不得让 runtime、hash、lineage、receipt 等内部术语占据正文。

状态固定为：未轮到 `backlog`；可启动时设置 assignee 后转 `todo`；执行中 `in_progress`；等用户 `in_review`；技术阻塞 `blocked`；产物和 stage 合同均完成才 `done`。

### FR-007 mention 与恢复必须真实

- 初次启动使用 assignee + `backlog → todo`，不重复 mention；
- 恢复在原 stage Issue 使用 `[@Name](mention://agent/<实时 UUID>)`；
- 纯文本 `@name`、`@all`、Squad mention 或“已重新触发”的文字不能代替真实 Agent mention；
- 恢复评论包含已解决事项和下一动作，然后把原 Issue 恢复为 `in_progress`；
- 普通返工不得新建第二套五阶段 Issue。
- 任何新 generation 或第二套五阶段 Issue 都必须先取得用户明确批准；
- 阶段细节只写当前 stage Issue，整体进度和交接只汇总到父 Issue，不发到过期或兄弟线程。

### FR-008 close 必须完成真实交付

verify-code 通过后生成并展示具体 close plan：发布已验证的候选 snapshot commit、归档当前 spec 并 commit、从主 checkout 合并任务分支、push 目标分支、删除任务 worktree、删除已合并的本地任务分支。

`prepare` 允许候选 snapshot 尚未发布到任务分支，但必须同时满足：snapshot commit 的父提交等于当前任务分支 tip，且 freshly captured 工作区 tree 精确等于该 snapshot tree。任何额外改动都必须失败。close 授权后先把任务分支更新到该 snapshot commit，并确认工作区字节不变且变为 clean，再执行后续动作。

用户对该 plan 一次确认后，由 Code Verifier 执行；无需为每条命令再次确认。

close 入口只有在机器核实以下事实后才能写 `completed`：工作区无未提交交付内容；archive commit 已包含在目标分支、archive 目标存在且原 spec 路径不存在；任务提交已包含在目标分支；Code Verifier 已先 fetch，入口只读确认已刷新 remote ref 与目标分支一致；任务 worktree 和已合并的本地任务分支均不存在。

任一事实不成立时明确失败，保留可恢复状态，不得以 Issue 评论或空 steps 写成完成。

这是宪法 Q2 的机器强制入口校验，不是用质量分数阻断人工决策；符合 F3、F7 和 F9。

### FR-009 Multica 完成状态依赖 close

Code Verifier 只有取得 WorkflowHub close `completed` 后才能把 verify-code Issue 设为 `done`。工头随后才可把父 Issue 设为 `done`。Multica 状态更新留在 Prompt，不接入 WorkflowHub core。

### FR-010 只做一次真实 Canary

配置与自动化测试通过后，运行一个低风险真实 Issue，验证五阶段顺序、make-decision 交互、产品问题直达用户、真实恢复 mention、可读 Issue、完整 close。Canary 失败先修复，不为追求“两次通过”机械重复运行。

## 5. 验收标准

- AC-001：四个指定 review bundle 含 `simplicity-guard`，两个排除项和所有生成步骤不含；
- AC-002：实时回读显示工头无 stage Skill、Coder 无 `build-code`、七个执行 Agent 无 `caveman`；
- AC-003：新父 Issue 只产生一套五阶段 Issue，标题和正文符合 FR-006，后续 stage 能从内部引用取得精确 `project/task`；
- AC-004：make-decision 有真实用户交互、可读 `decision-log` 和方向确认，缺任一项时不能 accepted；
- AC-005：普通技术选择自主完成，实质需求歧义直接问用户，工头不代答；
- AC-006：ZHI-194 类恢复使用原 Issue 的真实 UUID mention，Agent 能重新接手；
- AC-007：故意省略 archive、merge、push 或 cleanup 任一项时，close 拒绝 `completed`；全部完成后可重入地返回同一完成结果；
- AC-008：现有五阶段、offline、TaskKernel 和 close 测试保持通过，WorkflowHub 无 Multica 配置也能运行；
- AC-009：一个真实 Canary 完整通过，平台事实可回读。

## 6. 明确不做

- WorkflowHub trusted-human-confirmation 模块或 schema 改造；
- task-scoped token、签名、认证中间件、HumanApprovalProvider；
- `adapters/multica/`、offline verifier 产品、统一 CLI、bundle/release/routing；
- 新 DAG、TaskKernel、状态机、数据库或通用 Git 发布框架；
- PR 自动化、Multica API 接入 WorkflowHub core、远程任务分支管理；
- 每个 phase 都等待用户确认；
- 第二套 generation、第二套证据系统或长期预留接口。

## 7. 复杂度预算

- Multica：修改现有 7 个 Agent、1 个 Squad、现有 Skill 包和绑定；不新增 Agent/Squad；
- WorkflowHub review：只改现有 manifest、contracts、closure 和测试；
- WorkflowHub close：最多 3 个生产文件，生产代码约 220–340 行，测试约 220–350 行；
- 新依赖、新 schema、新通用抽象、目录迁移均为 0。

超过预算或需要“明确不做”中的能力时，必须返回 make-decision，不能在 build-plan/build-code 中顺手加入。
