# 阶段交互与交接完整性实施计划

## 1. 实施原则

- 只修 R6 已证明的问题，不恢复 ZHI-102/ZHI-184。
- 旧accepted spec/plan/tasks保持只读审计记录，不删除或改写其中历史文字；最终验收以本增量spec的supersede条款排除旧Issue恢复。
- WorkflowHub 只写宿主无关合同；Multica Agent关系只写在线上 instructions。
- 不新增 Skill、schema、状态机、provider配置或平台代码。
- 每个源码 Phase完成测试和证据预检后，只对当前 snapshot/material做一次正式 `wh-review`；changed identity才允许新审。
- 三个源码 Phase全部通过后，只做一次最终全树审查。
- Multica Prompt集中修改后使用独立窄材料审查一次，不附完整源码树。

## 2. Phase 1：组件所有权对齐

### 目标

消除 Stage Skill、`skill-deps.yaml` 与 `wh-review` metadata之间的重复或错误所有权，不改变产品流程。

### 修改范围

- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-plan/SKILL.md`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-code/skill-deps.yaml`
- `workflows/verify-code/skill-deps.yaml`（只读核对；当前ownership正确时不制造修改）
- `skills/wh-review/manifest.json`
- `skills/wh-review/stage-skill-plan.json`
- `skills/wh-review`既有contract/closure metadata与聚焦测试

### 行为

- `spec-clarify` 统一为 build-spec conditional组件。
- build-plan 不再直接重复调用 lens-only `spec-analyze`。
- build-code review lens移除 `test-strategy`、`diagnosing-bugs`；`test-routing-advisor`、`diagnosing-bugs`、`review-response`只保留为Phase条件组件。
- verify diagnostic review不再把`test-strategy`或browser执行型Skill当provider lens。
- 静态测试保证review plan只装入lens-only Skill，同一组件没有双重所有权。

### 验证与审查

- 跑 ownership、wh-review contract、closure和宿主独立测试。
- 发布 `component-ownership` Phase evidence。
- 对该身份执行一次正式 `wh-review`；finding在原Phase修复，只有变化后的新身份允许一次新审查。

## 3. Phase 2：Stage交互与双向 handoff

### 目标

让五阶段主 Skill以宿主无关方式明确 `ask/wait/present`、组件执行/skip清单、完成卡和双向handoff；WorkflowHub源码不出现Multica/Issue/mention/用户UUID。

### 修改范围

- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/verify-code/SKILL.md`
- 既有human brief与交互/handoff合同测试
- 受影响closure metadata/hash

### 行为

- make-decision 三轮talk均有宿主可见checkpoint，需要答案才wait；grill结果可见。
- build-spec每次做歧义scan；有实质歧义才执行`spec-clarify`，否则记录skip。
- Stage完成信息包含组件事实、产物、证据、依赖、风险和下一责任人，不复制正文或日志。
- 组件executed/skip事实必须与`SKILL.md`、`skill-deps.yaml`、`wh-review` metadata及正式review refs交叉核对，不能只依赖Agent自报。
- 上游return、下游handoff和父任务进度使用宿主抽象表达，不写Multica术语。

### 验证与审查

- 聚焦测试覆盖talk/grill/clarify executed或skip、完成卡和handoff字段。
- 反向测试确保WorkflowHub Skill没有新增`Multica|mention://|Issue|status|用户UUID`宿主依赖。
- 发布 `stage-interaction-handoff` Phase evidence并执行一次正式 `wh-review`。

## 4. Phase 3：宿主无关 build-code 双部分与 Phase内闭环

### 目标

让 `build-code` 在任何宿主仍可由一个 Agent完整执行，同时允许 Multica把阶段协调和Phase执行分给现有两个Agent；Phase执行者在原Phase内完成开发、测试、Phase审查及finding修复后一次返回。

### 修改范围

- `workflows/build-code/SKILL.md`
- `scripts/stage-runtime.mjs`
- 现有runtime/helper中与Phase evidence发布直接相关的最小位置
- build-code、phase evidence、review reuse与职责组合的聚焦测试
- 受影响bundle/catalog/closure hash

### 行为

- `build-code` Skill只使用宿主无关术语，拆为可组合的“阶段协调”和“Phase执行”两部分。
- 单 Agent宿主依次执行两部分，行为保持完整。
- 阶段协调部分负责Phase拆分、事实卡、phase-gate、最终全树review、Stage run/accept和verify reopen。
- Phase执行部分负责RED/GREEN、真实测试、scoped diff、canonical Phase evidence、独立 `wh-review`、finding核实与同Phase修复。
- Phase Card只携带从 authenticated StageContext/accepted records复制的事实，不携带流程或provider规则。
- 在现有 `stage-runtime.mjs` 增加窄 Phase evidence发布命令：只认证身份并生成/publish diff scan与phase result；继续复用现有capture-tests/receipt/review入口。
- 新命令拒绝调用方路径、commit range、provider/model和通用输出路径。

### 验证与审查

- 聚焦测试覆盖首Phase、后续Phase、修订snapshot、错误身份/refs/allowlist、同身份review复用和单Agent组合。
- 跑build-code/runtime/wh-review/closure相关回归。
- 发布 `phase-execution-ownership` Phase evidence并执行一次正式 `wh-review`。
- 三个Phase通过后，预检完整测试receipt、原始输出、SHA和canonical evidence，运行相关全量测试，再执行一次最终full-worktree review与`verify-final`。

## 5. Multica 配置与窄审

### 线上修改

- 等Agent idle后回读并保存工头、五个Stage Agent、Coder、Squad、五个Skill和绑定基线。
- 保留所有Agent provider、model、runtime和现有Skill ID。
- 原位同步五个已审WorkflowHub Skill closure。
- 给Coder绑定现有`build-code` Skill ID；Code Builder绑定不变。
- Code Builder instructions只映射阶段协调部分；Coder instructions只映射Phase执行部分。
- 五个Stage Agent、Coder和Squad统一使用短标题/列表、决策卡、完成卡、return handoff和真实mention规则。
- Prompt不复制Stage Skill步骤、不写provider选择、不固定review provider。

### 审查

- 只冻结“线上旧值→拟更新值→绑定差异→需求映射”的窄材料。
- 预检材料与hash后，按当前3rd-review配置审一次；禁止附WorkflowHub完整源码diff。
- 审查通过后原位更新并逐项回读；不新建Agent/Squad/Skill。

## 6. 唯一新 Canary

- 使用新的外部测试项目和新的父Issue，不复用ZHI-102/ZHI-184。
- make-decision注入一个会改变方向的问题，验证真实member mention、推荐选项和等待；按用户授权代回推荐项。
- build-spec注入一个实质歧义，验证`spec-clarify`真实交互；无歧义skip由本地fixture验证。
- build-plan验证组件清单、计划确认和自动handoff。
- build-code至少两个Phase；Coder读取同一`build-code` Skill的Phase部分，在各自Phase内完成开发、测试、Phase review与finding修复，通过后一次返回；Code Builder不重复Phase review。
- verify-code注入一次确定性失败，验证唯一reopen、原Phase复用、fresh verify和最终review复用。
- 执行独立close确认和六步close，核对全部有效Issue为done、废弃项cancelled。
- 除Agent决策卡的推荐回复和close授权外，任何外部“继续/提醒/恢复”comment都使Canary失败。
- 无论成功或失败，都删除临时Multica project、candidate/runner worktree和branch；核心实现worktree保留到最终验收。

## 7. 完成条件

- AC-001～AC-011逐项有可复算证据。
- 核心测试、closure、三次Phase审查、一次最终全树审查与一次Prompt窄审均有效。
- 新Canary零救火通过，所有临时资源清理完成。
- 之后才恢复原核心任务的最终verify、close、合并、归档和核心worktree清理。
