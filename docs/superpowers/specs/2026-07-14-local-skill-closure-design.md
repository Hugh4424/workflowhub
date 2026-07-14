# workflowhub 本地技能闭包与上游溯源设计

日期：2026-07-14

## 1. 目标

workflowhub 只在执行对应 stage 时加载该 stage 声明的仓内技能，不把 workflowhub 技能注册到 Claude、Codex 或其他宿主的全局技能目录。

本次设计解决四个问题：

1. 删除本机 Superpowers、gstack 后，workflowhub 五阶段仍能独立运行。
2. 修复 AgentHub 迁移过程中真实遗漏的技能与能力，不恢复 AgentHub 的旧语义。
3. 保持 workflowhub 现有五阶段、`wh-review`、人工决策和证据合同为唯一主流程。
4. 用 `skills/reuse-registry.md` 记录所有技能与上游能力的来源、思路、版本和本地改造，支持未来追踪更新。

## 2. 宪法约束

设计遵守以下边界：

- 外部成熟技能可以搬入，但必须合宪改造，不能把整个框架带进仓库。
- 一阶段一个主技能；组件技能只能按需读取，不能形成第二套编排器。
- required 依赖缺失时 fail loud；optional 依赖缺失时记录 `skipped + reason`。
- 不用 HOME、cwd、全局同名搜索或个人绝对路径兜底。
- 异源审查只走 `wh-review/ReviewRoundFacade`；不新增第二条 review 路径。
- 不因迁移增加 telemetry、自动更新服务、浏览器 daemon、gbrain 或宿主专属 runtime。

## 3. 调研基线

AgentHub 基线：

- `packages/core/agenthub/workflows/vibecoding/contract.md`
- `packages/core/agenthub/workflows/vibecoding/stages/*.md`
- `packages/core/agenthub/workflows/vibecoding/stages/apply.contract.yaml`

上游快照：

- Matt Pocock skills：`66898f60e8c744e269f8ce06c2b2b99ce7660d5f`
- Superpowers：`d884ae04edebef577e82ff7c4e143debd0bbec99`，v6.1.1
- gstack：`7c9df1c568a9ea745508f679a329332b2c338063`，v1.60.1.0

三者均为 MIT。任何复制或派生文件必须保留对应版权与许可声明。

## 4. AgentHub 迁移裁决

### 4.1 已吸收，不复制

- `superpowers-test-driven-development`：由 build-code RED/GREEN、`capture.mjs`、假绿检查承接。
- `superpowers-subagent-driven-development`：由 phase executor、独立上下文、`PHASE_RESULT` 承接。
- `superpowers-requesting-code-review`：由 `wh-review` sealed packet、异源 provider、receipt 承接。
- `superpowers-verification-before-completion`：由 verify-code fresh capture、freshness、AC coverage、L2/L3 承接。
- `superpowers-finishing-a-development-branch`：由 verify-code close、人工 merge、worktree 清理承接。
- `stage-summary`：由各 stage human brief 承接；只统一短模板，不恢复旧 host skill。
- `verify-change --light/full/close`：由 verify-code 分层验证和 close 合同承接。
- AgentHub `3rd-review`：由 workflowhub `wh-review` V4 承接。

### 4.2 有意删除，不恢复

- AgentHub setup、全局技能软链和框架 bootstrap。
- `handoff/receive-handoff` 强制换会话协议。
- 每 phase 强制浏览器 QA；保留 verify-code 最终条件验收。
- `testing-system-blueprint` 与 backend/frontend/full-chain 多执行器框架。
- AgentHub 已删除的 `intake-review-orchestrator`。workflowhub 删除陈旧引用，使用现有 `intake-decision-review + wh-review`。
- 原 `capture-workflow-feedback` 的 BrainInbox、host journal 和 gate 绑定。

### 4.3 需要恢复或补强

1. `isolated-browser-qa`
   - AgentHub 把它作为 UI 验收能力；workflowhub 当前只有 `workflows/verify-code/isolated-browser-qa.md`，不是完整、可独立调用的 skill。
   - 搬入用户提供的完整 skill、references 和 scripts，去掉个人绝对路径；verify-code 继续只在 UI 条件成立时调用。

2. `test-routing-advisor`
   - 当前 build-code 跨仓锁定 AgentHub commit，仓内缺失。
   - 搬为 workflowhub 专用纯路由组件，固定输出 stage 当前需要的 JSON schema。
   - 不要求 backend/frontend/full-chain 执行器存在。

3. 根因调试
   - 新建 `skills/diagnosing-bugs/`，以 Matt Pocock `diagnosing-bugs` 为主来源，吸收 Superpowers `systematic-debugging` 与 gstack `investigate` 的有效规则。
   - 条件触发：测试异常、实现异常、finding 根因未知、同类修复重复失败。
   - 输出：`root_cause`、`hypothesis`、`evidence_ref`、`fix_scope`、`verification_ref`。
   - 三个独立假设失败后停止补丁循环，转架构检查或人工决策。

4. review finding 消费纪律
   - 新建 `skills/review-response/`。
   - 逐条复述 finding、核实事实、按根因聚类、检查同类调用方、做最小修复、补针对性测试、通过同一 continuation flow 重审。
   - reviewer 意见不是自动命令；技术上错误的建议必须用证据拒绝。

5. planning 质量
   - 不复制 `superpowers-writing-plans`。
   - 在现有 `spec-plan/spec-tasks` 中补 Task Right-Sizing、Global Constraints、Interfaces，以及 `Goal / Files / Tasks / Verify / Knowledge / STOP` 的明确映射。

6. TDD 质量
   - 不复制第二套 TDD 编排器。
   - 吸收 Matt Pocock `tdd` 与 Superpowers `testing-anti-patterns.md` 中的测试设计、mock、test-only production API 等规则，作为 build-code/test-strategy reference。

7. `grill-with-docs`
   - 保留 workflowhub 的四项退出合同。
   - 吸收最新 `grilling + domain-modeling` 的组件思路。
   - skill 失败时转人工；只有用户明确跳过才能继续。

8. workflow friction
   - 不恢复旧 skill。
   - 五个 stage 统一内联 `[FRICTION]` 记录合同，写入现有 task execution record。

## 5. 首批技能闭包

恢复项到本地承接点必须一一对应：

| 恢复或补强项 | 状态 | 本地承接点 | 触发与验证 |
|---|---|---|---|
| 浏览器 QA | adopted | `skills/isolated-browser-qa/` | verify-code UI 条件；截图、console、L3 报告 |
| 测试路由 | adapted | `skills/test-routing-advisor/` | build-code L2；固定 JSON schema |
| 根因调试 | adapted | `skills/diagnosing-bugs/` | 异常/未知根因；结构化根因证据 |
| review 消费 | adapted | `skills/review-response/` | revise_required；同 flow 重审 |
| planning 质量 | absorbed | `skills/spec-plan/`、`skills/spec-tasks/` | 模板字段与行为测试 |
| TDD 质量 | absorbed | build-code/test-strategy references | anti-pattern checklist |
| grill 质量 | adapted-existing | `skills/grill-with-docs/` | make-decision；失败转人工 |
| workflow friction | absorbed | 五个 stage execution record | `[FRICTION]` 写入测试 |
| debate | optional-adopted | `skills/debate/` | 争议增强；失败记录后继续 |
| domain modeling | optional-adapted | `skills/domain-modeling/` | 术语或不可逆模型变化 |
| codebase design | optional-adapted | `skills/codebase-design/` | 新模块、公共接口、复杂重构 |

### 5.1 Required

```text
skills/
├── isolated-browser-qa/
├── test-routing-advisor/
├── diagnosing-bugs/
└── review-response/
```

已有 required 组件继续保留并补强，不重复出现在新增目录树中：

- `skills/grill-with-docs/`
- `skills/spec-plan/`
- `skills/spec-tasks/`
- build-code/test-strategy 的 TDD references

### 5.2 Optional

```text
skills/
├── debate/
├── domain-modeling/
└── codebase-design/
```

- `debate`：make-decision 的可选增强；不可达时记录并继续。
- `domain-modeling`：仅在术语或不可逆领域决策变化时调用。
- `codebase-design`：仅在新模块、公共接口或复杂重构时由 simplicity 规则条件路由。

### 5.3 不进入运行闭包

- Superpowers `using-superpowers`、完整 SDD、完整 writing-plans、第二 review/worktree/close 流程。
- gstack runtime、Bun 生成链、Playwright/Puppeteer daemon、gbrain、telemetry、自动更新。
- Matt Pocock issue tracker、setup、implement、to-tickets、deprecated 与 in-progress 技能。

## 6. Stage 按需加载合同

每个 stage 维护显式 repo-relative 依赖清单。建议新建每阶段同目录 `skill-deps.yaml`，字段固定：

```yaml
stage: build-code
skills:
  - name: diagnosing-bugs
    path: skills/diagnosing-bugs/SKILL.md
    required: true
    execution: independent
    trigger: unexpected_failure
    assets:
      - skills/diagnosing-bugs/scripts/hitl-loop.template.sh
```

解析规则：

1. 调用方显式传入 `workflowhub_package_root`。
2. 只执行 `resolve(package_root, declared_relative_path)`。
3. realpath 必须仍位于 package root 内。
4. 到达 trigger 才读取 SKILL.md 与 assets。
5. 不读取全局同名 skill，不 fallback 到 HOME、cwd 或 AgentHub。
6. `execution: independent` 但宿主无独立上下文能力时 fail loud 并转人工，不静默 inline。

现有 `dispatch-component.mjs` 只能执行 Node entry，不是 Markdown skill loader。本次新增独立薄 resolver/preflight，不修改 kernel 去猜文件类型。

## 7. `reuse-registry.md` 新合同

`skills/reuse-registry.md` 成为唯一人工可读溯源台账，覆盖：

- 仓内现有全部 skills。
- 新增、改名、合并或拆分后的 skills。
- 被 stage 内联吸收、未保留独立目录的上游能力。
- 明确拒绝迁入但需要持续观察的上游技能。

每项必须包含：

```text
local_name
local_path
status: adopted | adapted | absorbed | rejected | watch
purpose
design_idea
used_by_stages
upstream_project
upstream_github_url
upstream_skill_url
upstream_commit
upstream_path
upstream_license
local_changes
dependency_closure
last_reviewed_at
update_policy
```

规则：

- 多来源改造允许列多个 `upstream`。
- `absorbed` 必须写入本地承接路径和等价条款。
- `rejected` 必须写拒绝原因，防止未来重复评估。
- commit 不得只写 `main/latest`。
- 原始 GitHub URL 与 commit URL 都要保留。
- 新建 `THIRD_PARTY_NOTICES.md`，集中保留 MIT notice；技能目录可再放局部 LICENSE。
- 更新只做人工 diff 和合宪复核，不增加自动同步 bot。

## 8. 三个上游项目的采纳计划

### 8.1 Matt Pocock skills

优先级最高：

- Adopt：`diagnosing-bugs`。
- Adapt：`domain-modeling`、`grilling`、`codebase-design`。
- 吸收：`tdd` 的 tests/mocking；`code-review` 的 Standards/Spec 双轴；`research` 的 primary-source/citation；`to-tickets` 的 blocking edges/tracer bullet。
- 暂不进入主流程：`prototype`。只作为高不确定问题的未来条件能力观察。
- Reject：`implement`、setup、issue tracker、deprecated、in-progress、personal skills。

### 8.2 Superpowers

- Adopt/Adapt：`systematic-debugging` 的四阶段根因法，合并进 `diagnosing-bugs`。
- Adapt：receiving-code-review 六步；writing-plans 的 Task Right-Sizing、Global Constraints、Interfaces；SDD 的 preflight、文件 handoff、durable ledger、明确终态；TDD anti-patterns。
- Reject：`using-superpowers` 和与 workflowhub 主流程重复的 orchestrator、review、worktree、finish、verification skill。

### 8.3 gstack

原样迁入 0 个技能，只抽方法：

- QA：diff-aware routes、quick fallback、复现步骤、截图、console、baseline delta。
- Review：`DIFF-VERIFIABLE / CROSS-REPO / EXTERNAL-STATE / CONTENT-SHAPE` 证据可见性分类；按 scope signal 条件选择 lens。
- Plan：状态/异步/跨边界任务要求最小 state/data-flow 图；输出 AC→风险→测试层→证据类型。
- Design：真实页面、before/after、responsive、states、accessibility 证据规则。
- Investigate：单一可证伪假设、三次失败停机、敏感信息脱敏后再外搜。
- Ship：仅吸收 standalone distributable 的 release pipeline 检查。
- Canary：留给未来独立 deploy-observe workflow，不进入当前五阶段。

## 9. 失败语义

- required SKILL.md 或 asset 缺失：stage 启动前失败，错误必须含 stage、声明路径、package root。
- optional skill 缺失：记录 `skipped + reason`，不搜索本机替代品。
- 路径越界或绝对路径：立即失败。
- grill 关键输入失败：转人工，不能自动继续。
- debate 失败：记录后继续。
- debugging 不处理必需输入、配置或权限缺失；这些错误直接 fail loud。
- 3rd-review transport、认证、材料或 hash 失败：只记 diagnostic，不产生审查 verdict。

## 10. 验证方案

1. 静态闭包：遍历所有 stage manifest，校验 required skill/assets 存在且路径不越界。
2. 无框架 smoke：临时 HOME 不安装 Superpowers、gstack、AgentHub，全局 skill 目录为空，五阶段仍能解析依赖。
3. 按需读取：build-spec 不得读取 build-code 的调试或路由技能。
4. 同名冲突：全局放置假 skill，解析结果仍必须命中仓内路径。
5. 缺失测试：删除一个 required reference，preflight 必须非零退出。
6. 宿主能力：禁用 subagent 后执行 required independent skill，必须明确失败或转人工。
7. 语义回归：为 AgentHub 迁移矩阵中的每个 `absorbed/adapted` 项建立可定位合同或行为测试。
8. 异源审查：设计、计划和实现继续只走 `wh-review/3rd-review`，审查材料冻结且 provider 不访问真实仓库。

## 11. 实施顺序

1. 重建完整 `reuse-registry.md` 和 `THIRD_PARTY_NOTICES.md`。
2. 建 stage skill manifest 与静态 preflight。
3. 修复 `intake-review-orchestrator` 陈旧引用和绝对路径。
4. 搬入 `isolated-browser-qa`、`test-routing-advisor`、optional `debate`。
5. 新建 `diagnosing-bugs`、`review-response`。
6. 补强 `spec-plan/spec-tasks`、TDD references、grill/domain-modeling。
7. 吸收 gstack QA/review/plan 小规则。
8. 在无全局框架环境运行五阶段 smoke。
9. 通过独立 `wh-review/3rd-review` 后，人工确认是否删除本机 Superpowers、gstack。

删除本机框架属于不可逆操作，不在本设计实施范围内；必须在无框架 smoke 通过后由用户单独确认。
