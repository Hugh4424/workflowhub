# workflowhub 本地技能闭包与上游溯源设计

日期：2026-07-14

## 1. 目标

workflowhub 只在执行对应 stage 时加载该 stage 声明的仓内技能，不把 workflowhub 技能注册到 Claude、Codex 或其他宿主的全局技能目录。除 `workflows/*/SKILL.md` 五个 stage orchestrator 外，workflowhub 自己声明并调用的所有 skill 必须位于项目 `skills/`，并进入发布包；不得从外仓、HOME 或全局同名目录加载 skill。

本次设计解决四个问题：

1. 删除本机 Superpowers、gstack 后，workflowhub 五阶段仍能独立运行。
2. 修复 AgentHub 迁移过程中真实遗漏的技能与能力，不恢复 AgentHub 的旧语义。
3. 保持 workflowhub 现有五阶段、`wh-review`、人工决策和证据合同为唯一主流程。
4. 用 `skills/reuse-registry.md` 记录所有技能与上游能力的来源、思路、版本和本地改造，支持未来追踪更新。

## 2. 宪法约束

设计遵守以下边界：

- 外部成熟技能可以搬入，但必须合宪改造，不能把整个框架带进仓库。
- 一阶段一个主技能；组件技能只能按需读取，不能形成第二套编排器。
- 任一本地 skill 或其运行资产缺失都表示安装包损坏，必须 fail loud；optional 只表示条件调用，不表示文件可以缺失。
- 不用 HOME、cwd、全局同名搜索或个人绝对路径解析 skill。`~/.workflowhub/config.json` 仍可作为 workflowhub 显式 task/repo/runtime 配置，不可作为 skill locator。
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
   - 输入固定为 changed files、phase count、test command；输出固定为 `routing_tier: simple|feature|fullstack`、非空 `routing_rationale`、`result: pass|fail`、ISO-8601 `ts`。advisor 负责判类和建议，实际 smoke command 仍由 build-code/capture 执行。

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
| debate | conditional-adopted | `skills/debate/` | 争议增强；未触发则不调用 |
| domain modeling | watch | 暂不进入运行闭包 | 有真实 stage 触发合同后再加入 |
| codebase design | watch | 暂不进入运行闭包 | 有真实 stage 触发合同后再加入 |

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

### 5.2 Conditional

```text
skills/
└── debate/
```

- `debate`：make-decision 的条件增强；skill 文件必须随包存在。没有争议时记 `not_invoked`；触发后执行失败时记录 diagnostic 并继续。
- `domain-modeling`、`codebase-design`：本轮只进入 registry 的 `watch`，不进入 stage manifest 或安装闭包。未来只有补齐触发、消费点和验证合同后才能转为 local skill。

### 5.3 不进入运行闭包

- Superpowers `using-superpowers`、完整 SDD、完整 writing-plans、第二 review/worktree/close 流程。
- gstack runtime、Bun 生成链、Playwright/Puppeteer daemon、gbrain、telemetry、自动更新。
- Matt Pocock issue tracker、setup、implement、to-tickets、deprecated 与 in-progress 技能。

## 6. Stage 按需加载合同

每个 active stage 必须恰有一个同目录 `skill-deps.yaml`。CI 从 `config/workflowhub.yaml` 和 `workflows/*/SKILL.md` 双向枚举；缺失、重复、孤儿 manifest，或 manifest stage 与目录/registry 不一致都 fail。

Manifest 分三类依赖：本地 skills、机器 runtime、外部 capability。optional 不用于表达“文件可以缺失”。

```yaml
stage: build-code
skills:
  - name: diagnosing-bugs
    path: skills/diagnosing-bugs/SKILL.md
    execution: independent
    invocation: conditional
    trigger: unexpected_failure
    bundle: skills/diagnosing-bugs/skill-bundle.json
runtime_capabilities:
  - id: node
    kind: cli
    version_policy: ">=24"
    doctor: ["node", "--version"]
    required_when: always
external_capabilities:
  - id: host-subagent
    kind: host
    required_when: unexpected_failure
```

解析规则：

1. 调用方显式传入 `workflowhub_package_root`。
2. 只执行 `resolve(package_root, declared_relative_path)`。
3. skill realpath 必须位于 `${package_root}/skills/`；stage orchestrator 只有 `workflows/*/SKILL.md` 这一项例外。
4. 到达 trigger 才读取 SKILL.md 与 bundle；条件未触发记 `not_invoked`。
5. 不读取全局同名 skill，不 fallback 到 HOME、cwd 或 AgentHub。
6. `execution: independent` 但宿主无独立上下文能力时 fail loud 并转人工，不静默 inline。
7. 调度 payload 必须携带 `{name,resolved_skill_path,resolved_bundle_paths,bundle_hash,source_manifest,package_root}`；禁止只传 skill name 给宿主做全局发现。
8. 所有本地 skill 在安装/preflight 时都必须存在；运行时只区分 always/conditional，不区分 required/optional 文件。

每个可运行 local skill 都必须有 `skill-bundle.json`。纯单文件 skill 的最小 bundle 也必须列出 SKILL.md；有资产时继续列 references、templates、scripts、共享资产、sha256、license/provenance。校验 Markdown 相对链接、常见资源引用和 Node import；发现未入 bundle 的运行依赖即 fail。skill 目录和 bundle 文件不得是 symlink、特殊文件或越界 hardlink。`review-bundle.json` 必须复用同一公共 bundle schema，作为 review lens 的受限投影或兼容输入，不能形成第二份独立闭包真相。

现有 `dispatch-component.mjs` 只能执行 Node entry，不是 Markdown skill loader。本次新增独立薄 execution resolver/preflight，不修改 kernel 去猜文件类型。`wh-review/required-skill-resolver` 继续解析 review lens，但必须复用同一个底层 local-bundle 校验器；stage preflight 校验 `stage manifest ∪ stage-skill-plan ∪ review-bundle` 的联合闭包。

### 6.1 当前五阶段完整技能基线

以下不是“新增清单”，而是首批 manifest 必须覆盖的完整运行闭包：

- make-decision：`talk-with-zhipeng`、`grill-with-docs`、`decision-log`、`intake-decision-review`、`wh-review`；条件 `anysearch`、`debate`；wh-review 间接 lens `plan-ceo-review`、`review`。
- build-spec：`spec-specify`、`spec-clarify`、`simplicity-guard`、`wh-review`；间接 lens `plan-ceo-review`、`review`，UI 条件 lens `plan-design-review`。
- build-plan：`spec-research`、`simplicity-guard`、`spec-plan`、`spec-tasks`、`spec-analyze`、`wh-review`；间接 lens `spec-analyze`、`plan-eng-review`、`review`。
- build-code：`wh-review`；新增条件 `test-routing-advisor`、`diagnosing-bugs`、`review-response`。
- verify-code：`test-strategy`、`wh-review`；UI 条件 `isolated-browser-qa`；间接 lens `qa-only`、`verify-change`。

`scope-triage`、TDD、SDD、writing-plans、verification、branch finish 等已内联能力进入 registry 的 `absorbed`，但不是 stage runtime skill 引用。`decision-log` 仍由 make-decision 明确调用，必须保留为 local runtime skill。陈旧 `intake-review-orchestrator` 引用必须删除，不能加入 manifest。

### 6.2 非 skill 依赖边界

下列能力不复制进 `skills/`，但必须在 manifest 明确声明并有 doctor/失败语义：

- runtime：Node.js、git、shell、目标项目测试命令。
- browser runtime：`agent-browser` 或条件 `browser-use` CLI、浏览器本体。
- host capability：subagent/独立上下文。build-code 使用宿主原生 subagent backend；删除未解析的 Worker-Mode/issue-tracker fallback。verify-code 的 `test-strategy` 独立上下文为 required capability。
- review capability：`wh-review` broker、provider executable、credentials/config；继续引用既有 V4 合同。
- MCP/network：`muyu-search-mcp`、AnySearch API。MCP 是工具能力，不是 SKILL.md 来源。
- workflowhub config：`~/.workflowhub/config.json` 仅提供 task/repo/runtime mapping。

外部 capability 缺失按 `required_when` 处理；不得伪装成缺失 skill，也不得从外部服务加载远程 prompt 代替本地 skill。

## 7. `reuse-registry.md` 新合同

新增 `skills/catalog.yaml` 作为机器真相，`skills/reuse-registry.md` 是由 catalog 生成或校验的人读投影。两者覆盖：

- 仓内现有全部 skills。
- 新增、改名、合并或拆分后的 skills。
- 被 stage 内联吸收、未保留独立目录的上游能力。
- 明确拒绝迁入但需要持续观察的上游技能。

每项必须包含：

```text
local_name
local_path
status: native | adopted | adapted | absorbed | rejected | watch
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
- `native` 用于 workflowhub 自研 skill：`upstream: []`，必须记录本地设计来源、local version 和 dependency closure；不强造上游 URL。
- 上游字段完整性只约束 adopted/adapted/absorbed/rejected/watch；其中 absorbed/rejected/watch 可以没有 local_path，但必须有承接点或拒绝原因。
- CI 校验集合关系：磁盘 runtime skill IDs = catalog 中 `native|adopted|adapted` 且 local_path 非空的集合；stage manifest local refs 必须是该集合子集；每个 active stage 的实际 runtime skill 引用必须与其 manifest refs 相等。
- catalog 中未被五阶段调用的 local skill 必须显式 `standalone: true`；否则视为孤儿。absorbed/rejected/watch 不参与磁盘 runtime skill 等式。
- adopted/adapted/absorbed/rejected/watch 均须登记；本地 bundle hash 或 local version 变化时，provenance review 字段必须同步变化。
- `upstream_commit` 必须是完整 SHA；URL、commit URL、license、dependency closure 不得为空。
- `THIRD_PARTY_NOTICES.md` 必须覆盖所有 adopted/adapted 第三方来源。用户提供但无许可证的 `isolated-browser-qa` 必须先确认自有/授权来源；Downloads 版 `test-routing-advisor` 不原样复制，使用 AgentHub 固定版本或按本地合同独立实现。

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

- 任一本地 SKILL.md 或 bundle asset 缺失：stage 启动前失败，错误必须含 stage、声明路径、package root。
- conditional skill 未触发：记录 `not_invoked`；文件缺失仍是安装损坏，不允许继续。
- 路径越界或绝对路径：立即失败。
- grill 关键输入失败：转人工，不能自动继续。
- debate 失败：记录后继续。
- debugging 不处理必需输入、配置或权限缺失；这些错误直接 fail loud。
- 3rd-review transport、认证、材料或 hash 失败：只记 diagnostic，不产生审查 verdict。

## 10. 验证方案

1. `npm run check:skill-closure`：校验所有 stage manifest、skill bundle、catalog、registry、review lens 的联合闭包和第 7 节定义的集合关系。
2. 引用反查：扫描 active runtime surfaces 中的 skill locator、绝对路径、AgentHub/GitHub raw locator；所有运行引用必须映射 manifest，来源 URL 只能出现在 catalog/NOTICE。
3. 资产反查：缺 SKILL、漏 asset、未声明 import、孤儿目录、重复 id、symlink/hardlink 越界都必须红。
4. 包产物 smoke：在实际打包目录、clean HOME/profile 中不安装 Superpowers、gstack、AgentHub；逐 stage 至少真实走到 skill dispatch 和产物合同，不只解析路径。
5. 按需读取：build-spec 不得读取 build-code 的调试或路由技能。
6. 同名冲突：HOME、cwd、全局目录放置同名假 skill，子代理回报的路径/hash 仍必须命中仓内 bundle。
7. runtime doctor：Node/git、subagent、browser CLI、AnySearch/MCP、wh-review provider 按 `required_when` 验证；缺失时产生规定 diagnostic。
8. 宿主能力：禁用 required independent context 后必须明确失败或转人工，不能 inline 假成功。
9. 语义回归：AgentHub 全量迁移矩阵中的每个 adopted/adapted/absorbed/rejected/watch 项都有 registry 记录和可定位合同/行为测试。
10. registry completeness：磁盘 skills、catalog、stage manifests、review bundles、NOTICE 必须一致，完整 SHA/URL/license/closure 非空。
11. 异源审查：设计、计划和实现只通过 `wh-review/ReviewRoundFacade` 调用 3rd-review broker；审查材料冻结，provider 不访问真实仓库。
12. `npm run check` 必须包含 `check:skill-closure`；CI、发布包检查和本地 check 使用同一入口。

上述检查通过后，workflowhub 能保证：所有由 workflowhub stage 声明、解析和调用的本地 skill 及静态运行资产都位于发布包 `skills/` 中，并通过 repo-relative resolved path 注入。该保证不声称能控制宿主自身系统提示自动注入的全局技能；因此验收必须使用禁用全局 skill auto-discovery 的受控 profile 或 clean HOME。

本期 canonical 发布单元定义为“指定 commit 的干净 Git checkout”，不是当前开发工作树，也不是未定义的 npm tarball。发布 smoke 使用 fresh clone 或 `git archive` 展开后的 artifact root；必须包含 `workflows/`、`skills/`、`core/`、`scripts/`、`config/`、运行合同和模板，以及 package manifest/lockfile。不得包含 `.git/`、task 运行数据、review private evidence、个人配置、HOME 路径或外仓 checkout。未来若改成 npm/tarball，必须先更新唯一 artifact build command、包含规则和同一套 smoke，不能同时维护两种模糊发布定义。

## 11. 实施顺序

1. 建强制 stage manifest、`skills/catalog.yaml`、bundle schema、公共 resolver 与 `check:skill-closure`，先封住新增外部依赖。
2. 重建完整 `reuse-registry.md` 和 `THIRD_PARTY_NOTICES.md`。
3. 修复 `intake-review-orchestrator` 陈旧引用和绝对路径。
4. 搬入 `isolated-browser-qa`、`test-routing-advisor`、conditional `debate`。
5. 新建 `diagnosing-bugs`、`review-response`。
6. 补强 `spec-plan/spec-tasks`、TDD references、`grill-with-docs`；`domain-modeling` 保持 watch。
7. 吸收 gstack QA/review/plan 小规则。
8. 在实际发布包、clean HOME/profile、无全局框架环境运行五阶段真实 smoke。
9. 通过 `wh-review/ReviewRoundFacade` 调用 3rd-review broker 完成独立审查后，人工确认是否删除本机 Superpowers、gstack。

删除本机框架属于不可逆操作，不在本设计实施范围内；必须在无框架 smoke 通过后由用户单独确认。
