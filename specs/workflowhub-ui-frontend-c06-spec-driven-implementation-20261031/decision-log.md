# 决策日志 — C06 规范驱动的前端实现

## 任务身份：这是什么任务？

本任务是普通任务，不是规划任务。身份依据是用户 2026-10-31 的直接要求与当前认证任务记录：把 C06 做成可独立验收的“前端实现能力”，不是交付某个页面，也不是某个产品仓的优化任务。

- **任务类型**：普通任务。
- **入口规模与路线**：只引用本日志「级别与路线」。

### UI 三源

- raw_requirement：PRD C06 卡与用户 2026-10-31 的三次方向纠正（能力交付、PaperBuilder 验证、五道判断）。
- project_inventory：WorkflowHub 现有 `frontend-component-quality`、`frontend-testing`、`wh-review`、build-plan/build-code；PaperBuilder `/business-logs` 页面、测试与规范。
- planned_or_changed_frontend_fact：C06 要新增的就绪方法、检查/审查链与 PaperBuilder 时区/ViewModel/映射合并改动。

## 级别与路线：走哪条路线？

- 推荐级别：复杂
- 用户选择：复杂
- 原 ref：`quality/evidence/talk/2026-10-31-001-direction-batch.md`
- 失效步骤：4、5、6、7、8、9、10、11、12、13、14、15；阶段：make-decision；重做范围：按 2026-11-01 新版 make-decision 规范重跑；未失效：1、2、3 的原始需求与调研结论（复用）。

按复杂任务做，因为 C06 要同时交付“什么时候用、规范/组件/规则够不够、怎么写、什么时候检查、什么时候修、怎么独立审查”这套能力，并用一个真实的小任务验证；任何单一产出都盖不住六条验收。

### 入口评估说了什么

入口评估返回「暂停」，理由是小任务前提不成立，并给了两条拆分路线。这个返回不是级别选择，也不是许可；级别后来由用户另行选定。
原始返回只存一处，本节不复制 raw：`quality/evidence/entry-evaluation-20261031.json`。
调用时刻是 2026-10-31T10:46:00+08:00，实际调用命令如下。

```
node --input-type=module -e "import {evaluateEntryRoute} from './workflows/make-decision/scripts/entry-evaluation.mjs'; console.log(JSON.stringify(evaluateEntryRoute({boundary_clear:false,single_outcome:false,limited_impact:false,major_architecture:true,migration:false,permission:false,security:false})))"
```

- 输入七项：边界清楚 false、单一结果 false、影响有限 false、重大架构 true、迁移 false、权限 false、安全 false。
- 返回 `status="paused"`，`expanded_risks=["major_architecture"]`，`choices=["shrink-scope","create-ordinary-five-stage-task"]`，`user_requested=false`。
- 返回未包含项写“未返回”，不补造。

### 七项判级事实

- 范围：跨能力方法、就绪判断、实现、检查、审查、外部规则与一个真实验证任务。
- 变更：会改 `frontend-component-quality` 工程段、build-plan/build-code 前端段、stylelint 接入、完整 Vercel 闭包与 PaperBuilder 新分支的小任务。
- 独立单元：6 个交付切片，按一条能力链累积验收；只有 WP5 外部闭包可独立验收，不宣称六个独立交付。
- 风险：规范缺口判断、外部许可、C07 模板与共享文件、PaperBuilder 真实仓改动、性能预算缺源。
- 凭证：不需要账号、密钥或付费服务；需要 PaperBuilder 新分支写权限与 Git 提交授权。
- 依赖：C01/C03/C04/C05 已交付输入、C07 已并入 main 的模板与页面审计、现 frontend-component-quality/frontend-testing/wh-review/build-code 链。
- 验收：六条 AC-C06-1～6，每条有真实对象、执行、原始输出与证据。

### 用户怎么说的

- 用户说 C06 的原始需求是让 WorkflowHub 能按规范、组件和布局实现真实前端页面，检查工程质量并做代码审查；让 WorkflowHub 能写出可维护的真实前端代码；要判断什么时候用这个能力、什么时候检查前端代码、什么时候优化前端代码、什么时候判断组件/规范/规则足不足、全不全、需不需要补。
- 用户明确：具体拿哪个任务验证是次要的；`ui-workbench-target` 规范不够，不应直接拿它做；改从 PaperBuilder main 拉新分支，做一个小页面或组件优化任务。
- 用户选择：验证任务用“业务日志时间筛选的时区回显”；能力放在现有前端质量方法和工作流里；界面显示浏览器本地时间并标注“本地时间”。
- 用户要求每张卡边做边验证，不把问题留到最后；外部内容逐项考虑、不遗漏。
- 对照原件：`quality/evidence/talk/2026-10-31-001-direction-batch.md`、`...-002-skeleton-decisions.md`、`...-003-direction-correction.md`。

### 两条拆分路线去哪了

两条路线是缩小范围或改走普通五阶段任务，都不是本任务选择。用户明确按复杂任务开始，两条拆分路线只保留为历史。暂停是输入，不是失败；建议不是许可。

## 原始需求：要解决什么？

C06 要让 WorkflowHub 在面对真实前端任务时，能判断该不该用、先查规范/组件/规则够不够、按真实资产写出可维护代码、在正确时机做检查、发现问题后修到复核通过，并留下独立代码审查证据；验证任务只是证明这套能力真的能跑。

| source_id | 需求/约束 | 来源引用 | 落点 |
| --- | --- | --- | --- |
| R-001 | 交付原技能的工程化接入、完整固定 Vercel 规则与适用样式检查、规范/资产消费及独立代码审查/修复链 | `specs/workflowhub-ui-frontend-release-20261020/prd.md:305` | WP1～WP6 |
| R-002 | React/Next.js 主要路径，核组件化、统一性、可维护性、性能四维；非 React 不套用 | `prd.md:306` | WP2、WP3 |
| R-003 | 读取已确认基准/五类输入，按真实资产实施，做类型/样式/定向测试与性能测量 | `prd.md:307` | WP2、WP3 |
| R-004 | 独立代码审查真实 diff 和消费者，修根因并复核；新增严、存量警告，不全仓扫修 | `prd.md:307` | WP3、WP4 |
| R-005 | 完整官方固定 Vercel 源、LICENSE/UPSTREAM 及薄适配实际被规划/编码/验证按需消费 | `prd.md:308-309`、`:814`、`:818`；ADR0016 | WP5 |
| R-006 | 重复 selector 与不合规 !important 负例能报具体违规，合法样例不误报，存量与新增处置明确 | `prd.md:308-309` | WP3 |
| R-007 | 既有组件质量方法核真实 consumer，不以窄 lint 冒完整扫描 | `prd.md:308-309` | WP2 |
| R-008 | 现代码审查与同源补充分工、定向回修复核，provider 不可用保原失败 | `prd.md:308-309`、`:134` | WP4 |
| R-009 | 关键类型/DTO、错误/重复操作、状态保留、布局阅读焦点/CSS 作用域及性能用例实际验证；静态不冒浏览器/a11y/性能 | `prd.md:309` | WP3 |
| R-010 | 删除/改接口能定位直接间接消费者及风险，未发现使用点不自动当零 | `prd.md:309` | WP6 |
| R-011 | 所有所用原能力按 S3 维护；外部内容登记来源、许可、固定版本与维护者 | `prd.md:107`、`:308` | WP5、WP6 |
| R-012 | 真实页面及源码可定位规范、组件、布局的实际消费与状态 owner，四维均有依据和负例 | `prd.md:309` | WP1、WP2、WP6 |
| R-013 | 全阶段执行必须按 `steps.json` 的下一步卡推进：只读当前步 ≤3 个路径、按步检查、旧文件/目录不算本步证据、跳步留具名缺口；不新建 stage/gate/账本 | 用户 2026-11-01；研究 008 | WP7 |
| R-014 | build-plan 每条验收写成本，Phase 写总预算；超 soft 拆/砍，超 hard 用户确认；整卡验收拆“便宜可证/真实环境”两段 | 用户 2026-11-01；研究 009/010 | WP8 |
| R-015 | build-code 有 Phase 预算、30 分钟/50 命令对照、1.5× 停扩、同失败 2 轮无新事实停、命令超时、子代理 deadline、验收/gate 冻结、证据同字节一份 | 用户 2026-11-01；研究 009/010/011 | WP9 |

### 后来改了什么，原件在哪里？

- 变更 1（方向纠正）：C06 不是目标仓页面交付，而是 WorkflowHub 的前端实现能力；验证任务改为 PaperBuilder main 新分支的小任务。原件 `quality/evidence/talk/2026-10-31-003-direction-correction.md`。这条变更 **supersede** 了草稿 v2 的 D-001（目标仓两页）和 D-003（目标仓规范基线）；旧稿保留，不静默覆盖。
- 变更 2：验证任务选“业务日志时间筛选的时区回显”；时区口径为“显示浏览器本地时间，标签注明本地时间，提交 UTC”。原件 `quality/evidence/talk/2026-10-31-007-timezone-source-branch-gates.md`。
- 变更 3：能力放现有前端质量方法和工作流，不新建独立技能。原件 `quality/evidence/talk/2026-10-31-003-direction-correction.md`。
- 变更 4：五道判断骨架（触发、就绪、实现、检查、优化/审查）获用户认可。原件 `quality/evidence/talk/2026-10-31-007-timezone-source-branch-gates.md`。
- 变更 5（2026-11-01）：追加 R-013/R-014/R-015、WP7/WP8/WP9。触发是用户对“所有 stage 漏步/跳步”和 PaperBuilder T03 一个 Phase 跑 15h+、整卡验收估 6-14h 的质疑；原件 `quality/evidence/research/2026-11-01-008..011`。这三包只改执行契约/成本控制，不改 T03 业务代码、不重跑 T03。
- 变更 6（2026-11-01 收敛，历史记录）：用户先选 7A+7B+8，随后明确“不搞两批，workflowhub 没有这种两批的做法，完成 make-decision 收口”，取消分批；当前 R-013/14/15 全部留在本卡，9A/9B 只是 WP9 内部顺序，不 deferred。阶段收口消费缺口但不改 checker exit；默认 2h/4h + 允许宿主回收卡死子进程组，数字待校准。原件 `talk/2026-11-01-010`、`talk/2026-11-01-011`。

## 一共分几个包，每个包是什么？

| 工作包 | 交付结果 | 消费者 | 来源需求 |
| --- | --- | --- | --- |
| 工作包 1 | 触发与就绪判断：什么时候用、规范/组件/规则够不够、缺了怎么补 | build-plan/build-code 作者、后续前端任务 | R-001、R-012 |
| 工作包 2 | 实现方法与真实资产消费：按规范/组件/布局写，复用优先，新增有据 | 实现者、独立审查者 | R-002、R-003、R-007 |
| 工作包 3 | 工程检查：类型、样式、定向测试、性能测量的时机与证据 | 实现者、独立测试 | R-003、R-004、R-006、R-009 |
| 工作包 4 | 独立代码审查与修复：OCR、同源补充、finding 处置、修后复核 | 独立审查者、实现者 | R-004、R-008 |
| 工作包 5 | 完整 Vercel 76 文件闭包、许可/上游/登记与 8 包逐项处置 | 后续前端任务、C10 | R-005、R-011 |
| 工作包 6 | PaperBuilder 验证任务、删除侧消费者、六条 AC 对账与交接 | C07、C08、C09、C10 | R-010、R-011、R-012 |
| 工作包 7 | 全阶段下一步卡：当前步、≤3 路径、按步检查、跳步留缺口；不新建状态 | 阶段主会话、独立审查者 | R-013 |
| 工作包 8 | build-plan 验收成本：单条成本、Phase 总预算、超限拆分、整卡拆两段 | build-plan 作者、用户 | R-014 |
| 工作包 9 | build-code 长跑控制：预算/watchdog/重试闸/子代理 deadline/验收冻结/证据去重 | build-code 开发、审查、测试 | R-015 |

### 工作包 1 — 触发与就绪判断

- **目标**：给 WorkflowHub 一套可执行的判断：什么前端任务该用这套能力；动手前八类规范、四类资产、设计输入、检查命令够不够；缺了是直接做、带缺口做、先补还是停受影响部分。
- **边界**：不新建 stage/gate/技能；不自造设计值；不把“没找到”当“没有”；能从现有来源推导的补最小条款，推导不出的交用户/设计决定。
- **方案与取舍**：在 `frontend-component-quality/SKILL.md` 加“触发与就绪”段，并写一份 `references/implementation-readiness.md` 判断表与记录格式：`项 | 来源 | 状态 | 补法/知会者 | 消费者 | 处置`；文件由技能自身引用；C07 已并入 main，build-plan/build-code 加最小指针并在本卡验证一次真实消费。被拒方案：新建独立技能（重复）；只写原则不写记录（不可验收）；把就绪判断做成新门（违反 S4）。
- **验收**：在 PaperBuilder 验证任务上产出一份真实就绪记录：每类规范/资产有来源、状态、补法/知会者、消费者、处置；缺项有处置；至少一条“规范不足→先补”的真实判断（时区条款）；纯后端/纯文档/无消费者样例写 N/A + 原因。
- **风险**：判断容易退化成打勾表；缺项知会者未具名；与 C01/C03/C04 边界重叠。
- **依赖**：C01 规范入口、C03 资产方法、C04 五类输入；C08 是下游消费者，不是本包依赖。
- 消费者是 build-plan/build-code 作者、后续前端任务。
- **未决/无**：OI-001 就绪记录的最小字段与是否需要窄校验器。

### 工作包 2 — 实现方法与真实资产消费

- **目标**：按真实规范、组件、布局、token、API/type 写代码；复用优先，新增/组合/提取有真实消费者依据；类型、状态、事件/ref/slot、DOM/焦点、CSS 归属、布局/滚动/浮层说清楚。
- **边界**：不做设计重做；不把同名当同义；不把 PaperBuilder 台账直接套到别的项目；不把 C05 样本当生产代码。
- **方案与取舍**：以 PaperBuilder `/business-logs` 时间筛选为验证对象，按 `specs/frontend/frontend.md`、`specs/design/interaction.md`、`quality.md` 和真实 `datetime-local` 行为实现；复用现有 `business-log-page.tsx` 结构与测试，不新建组件库。被拒方案：为演示新写一个页面；直接复制 C05 样本；大范围重构业务日志页。
- **验收**：真实源码 diff + 真实消费者（`/business-logs` 路由与测试）+ 规范/组件/布局消费点可定位；类型/状态/焦点/CSS 归属有依据；AC-C06-1、AC-C06-5 的代码部分。
- **风险**：时区策略是产品决定，需先补规范；DST/非法值边界；PaperBuilder 工作树有未提交改动，必须从 main 新分支、不带脏改动。
- **依赖**：WP1 就绪记录；C03 资产方法；C04 五类输入（对验证对象可能不适用，记 N/A + 原因）；C05 设计基准（本任务不涉设计改版）。
- 消费者是 实现者、独立审查者、C07。
- **未决/无**：OI-002 验证任务写集与分支边界。

### 工作包 3 — 工程检查的时机与证据

- **目标**：说清什么时候跑类型检查、样式检查、定向测试、性能测量；新增严、存量警告；静态检查不冒充浏览器/a11y/性能；工具报错不算通过。
- **边界**：不新建通用 AST/consumer 平台；不把现有 158 行窄 checker 当完整扫描；不把 stylelint 当浏览器/a11y/性能证据；不因全仓历史债阻塞本次。
- **方案与取舍**：目标项目接入 stylelint 17.16.0（`no-duplicate-selectors`、`declaration-no-important`），新增/目标文件 `--max-warnings 0`、存量 legacy 只 warning；类型检查用 PaperBuilder 现命令；定向测试用现 Vitest；性能在没有预算时记 unavailable，不造秒数。被拒方案：只扩正则 checker；全仓 `--max-warnings 0`；拿 lint 当浏览器证据。
- **验收**：AC-C06-3、AC-C06-5；至少 2 个非法负例、2 个合法正例；类型/定向测试/性能命令与原始输出；新增/存量分档记录。
- **风险**：PaperBuilder 是否接受新增 stylelint devDependency 需确认；合法 `!important` 例外需要理由/消费者；时区测试可能受运行环境时区影响。
- **依赖**：WP2 的真实改动；PaperBuilder `package.json`/Node 20.19+；stylelint 17.16.0 MIT。
- 消费者是 实现者、独立测试、目标项目维护者。
- **未决/无**：OI-003 stylelint 接入位置与合法例外清单。

### 工作包 4 — 独立代码审查与修复

- **目标**：对真实 diff、AC 承接、测试面发起独立代码审查；finding 逐条处置；修后只复验受影响面；provider 不可用保原失败。
- **边界**：不换执行者冒通过；不把同源补充当独立审查；不把空 findings 当未执行；不把外部 review-output 当证据权威。
- **方案与取舍**：代码面走 `stage-runtime review --action=record` 的 OCR 路径；同源补充按 `architect-code-review` 两个独立上下文；finding 回原开发修，受影响面复跑。被拒方案：开发者自审；用 C07 运行报告替代码审查；OCR 失败后换子代理。
- **验收**：AC-C06-4；审查原件、finding 原文/处置、修后命令/输出、覆盖限制。
- **风险**：OCR 1.13.3 可用但 C06 未跑过；同源补充无脚本；终末固定 OCR。
- **依赖**：WP2/WP3 的真实 diff 与检查；C07 已并入 main 的 wh-review/review 链。
- 消费者是 独立审查者、实现者。
- **未决/无**：OI-004 审查 packet；C07 已并入 main `50b51c96`。

### 工作包 5 — 完整 Vercel 闭包与外部规则

- **目标**：把 `vercel-labs/agent-skills@dd089a8c…` 的 76 个文件完整落地，保留来源/版本/上游地址记录与 MANIFEST（现有本地许可文本保留、不新增）；21 行摘要降为历史；逐项处置其余 7 个外部包。
- **边界**：不把摘要、HIGH+ 子集、镜像、宿主安装当完整源；不为凑 8/8 复制无消费者的包；不改 C03 资产语义。
- **方案与取舍**：Vercel 76 文件扩进现有 `skills/frontend-component-quality/upstream/react-best-practices/`，随技能打包；I-01 web-design-guidelines 完整 104 条规则闭包；I-02 better-ui 完整 8 文件；I-03 animate 本验证任务无动效，条件未触发；I-04 review-animations 只借概念；I-05 iterate 不整包；I-06 landing 不引入；I-07 view-transitions 无需求不引入。
- **验收**：AC-C06-2；76 文件清单 + SHA + 来源/版本记录 + 按需读取一条规则 + 适用性矩阵 + 负例；现有许可文本保留、不新增；上游许可未核实，材料不宣称合规。
- **风险**：上游无独立 LICENSE 文件；现有许可文本是本地重建；不新增许可，记偏差；打包路径；I-02 两份研究结论冲突；来源/版本维护。
- **依赖**：外部 004/005 研究；catalog/registry 维护者。
- 消费者是 后续前端任务、C10。
- **未决/无**：OI-005 外部包最终集合与落盘/打包方式。

### 工作包 6 — PaperBuilder 验证任务与整卡验收

- **目标**：用独立 `git worktree add` 从 PaperBuilder main `5bdf6f0b` 拉新分支，完成“业务日志时间筛选时区回显”小任务；先补时区规范条款，再改代码/测试，跑检查、独立审查、修复复核；六条 AC 逐条对账。
- **边界**：不动 PaperBuilder 当前工作树未提交改动；不改后端/API/设计系统；不做全页重构；不把验证任务当 C06 产品；不把 C07 浏览器报告替工程审查。
- **方案与取舍**：字段标签 `开始时间（本地时间）`/`结束时间（本地时间）`，提示“按浏览器本地时间显示，提交转 UTC”；改 `business-log-page.tsx` 的格式化/解析、时间筛选 ViewModel、合并两处重复非就绪映射；测试覆盖 UTC→显示、显示→UTC、DST/非法值、映射合并等价性；写集 PB 5 文件 + WorkflowHub 2 个 fixture + 一条规范。被拒方案：只改显示不补规范；显示 UTC 不加标签；大范围改筛选器。
- **验收**：AC-C06-1～6 在验证任务上有真实对象、diff、消费者、命令输出、审查与修复复核；时间用例至少含 UTC→本地显示（含非整点/跨日）、本地→UTC 提交、DST（America/New_York）、空值/非法值、非就绪映射等价性；AC6 内部映射合并列直接/间接/未知消费者，公开 API 删除 N/A + 原因 + C05 反例，AC6 整体记部分。
- **风险**：时区策略需用户确认（已选本地时间+标签）；DST/非法值；PaperBuilder 新分支与工作树隔离；C07 已收口，真实 Tab/a11y/交互耗时记 unknown + 承接人。
- **依赖**：WP1～WP5；PaperBuilder main；C07 已并入 main，审查链可用，但不把 C07 运行验证当 C06 证据。
- 消费者是 C07、C08、C09、C10。
- **未决/无**：OI-006 验证任务分支/提交/证据绑定；OI-007 删除侧证据是否 N/A。

### 工作包 7 — 全阶段下一步卡

- **目标**：让任何 stage 的主会话只看当前步就能正确执行；卡显示步号/slug、一句结果、入口/停止、≤3 个路径/锚、完成证据、`--step=N` 自查、是否需要真实答复；跳步留具名缺口，旧文件不算本步证据；同时删重复规则、处理 facts-only 步、记录每步阅读量/跳步/返工基线。
- **边界**：不新建 stage/gate/第二控制面；不新增 step 账本/游标；卡是投影，不落盘；不改 checker 的 exit 0 报告性质；不批量改旧记录。
- **方案与取舍**：扩展现有 `check-stage-steps.mjs` 加 `--card`/`--step=N`；`steps.json` 仍是唯一步骤合同；SKILL.md 每步加稳定锚，删 11KB 重复 observable_result 表；build-plan/build-code 补“留痕边界”；证据按步锚/路径身份，不按目录。被拒：新建 stage-run 服务、facts 新 step row、改 exit code 当门。
- **验收**：AC-C06-7；用 make-decision 第 5/6/8 步做回放：卡只显示当前步；旧目录文件不算；跳过仍停原步；`--step=6` 只判第 6 步+前置；contract 3 例。
- **风险**：卡被接成阻断门；锚点漂移；目录共用仍误判；规则三份又复制。
- **依赖**：现有 `steps.json`/`check-stage-steps`/final-chain；`quality/` 证据；不依赖新 runtime。
- 消费者是 阶段主会话、独立审查者。
- **未决/无**：OI-015 卡输出契约与 consumer。

### 工作包 8 — build-plan 验收成本与 Phase 拆分

- **目标**：每条 AC 有成本块（执行者/预计分钟/硬上限/资源/观察/重试/证据档）；Phase 有 `acceptance_cost_total` 与 `phase_budget`；超 soft 拆/砍，超 hard 用户确认；整卡验收拆“便宜可证/真实环境”两段。
- **边界**：不新增预算账本/对象；不设机器 exit gate；数字是用户确认上限；不设全任务轮次上限；不改 T03 业务代码。
- **方案与取舍**：在 `workflows/build-plan/SKILL.md:75` 与 `skills/spec-plan/templates/phase-template.md:214` 加字段与判据；`plan` 第 11 步读者抽 2 条重算；计划确认展示总额；T03 P7 回放拆 P7a/P7b。被拒：只写“预算内”无数字；把 11 AC 塞一个末 Phase。
- **验收**：AC-C06-8；T03 P1/P7 回放：P7 成本总额 >4h → 拆两段；缺成本块 → 拒绝进 Phase；计划确认件含总额/上限/拆分。
- **风险**：默认 2h/4h 不适合所有项目；拆分过碎；用户看不到真实成本；数字变成形式。
- **依赖**：`phase-template`、`spec-plan`、`spec-specify` 五问；T03 材料只读。
- 消费者是 build-plan 作者、用户、独立读者。
- **未决/无**：OI-016 默认 soft/hard 数值；OI-018 T03 回放证据。

### 工作包 9 — build-code 长跑控制

- **目标**：Phase 开工记预算（window_minutes/command_cap/wait_cap）；每 30 分钟/50 命令对照；1.5× 停扩；先分不可重试；同失败 2 轮无新事实停；命令 30/90 分钟超时；子代理 heartbeat/15 分钟 stage+ETA，2 次无回由宿主回收进程组；验收/gate 冻结；证据内容寻址且带 task/run/step/artifact 身份。
- **边界**：不新增全任务时长上限；不把预算停止当通过/失败；不新增 validator；不重跑 T03；不改变 review provider 的不可用口径。
- **方案与取舍**：在 `build-code/SKILL.md:43-48/:71/:91/:97/:151` 加预算/停止/回传规则；Phase 卡加 `execution_budget`；facts phase cursor 每 Phase 更新；T03 P3 回放 030/050/060/074/178。被拒：继续“无新事实但可换路无限跑”；用改 gate_cmd 吸收失败。
- **验收**：AC-C06-9；回放：030 13242s timeout → 停；050/060/074 同失败 2 轮 → 停；13:36 132→168 变更 → 拒绝；p3_executor 24h → deadline 停；51 预镜像 → ≤3 份唯一字节。
- **风险**：预算太紧误停真实环境；子代理 deadline 与长任务冲突；冻结挡住合法修复；证据去重误删不同事实。
- **依赖**：build-code steps/SKILL、facts、stage-reflection cost；T03 回执只读。
- 消费者是 build-code 开发、审查、测试、用户。
- **未决/无**：OI-017 冻结/变更批准 owner；OI-019 证据预算配置。

## 每个包定了哪些决定？


### D-001 — 把 C06 定为能力交付，不是页面交付

- **做什么**：交付“触发、就绪、实现、检查、优化/审查”这套可复用能力；验证任务只是载体。
- **不做什么**：不把某个产品仓的页面当 C06 产品；不把验证任务做成就事论事的页面优化。
- **风险**：能力容易写成原则而没有可执行记录；验证任务容易反客为主。
- **改动**：本日志、需求索引、覆盖表；`frontend-component-quality`、build-plan/build-code 前端段。

### D-002 — 用 PaperBuilder 新分支的小任务验证

- **做什么**：从 PaperBuilder main `5bdf6f0b` 拉新分支，做“业务日志时间筛选时区回显”；不带当前工作树未提交改动。
- **不做什么**：不用 `ui-workbench-target`；不在 C05 样本原地做；不改 PaperBuilder 后端/API/设计系统。
- **风险**：新分支与工作树隔离；提交/证据绑定；C07 对象适配。
- **改动**：PaperBuilder 新分支；C06 证据引用分支/提交。

### D-003 — 时区口径：本地显示 + 标签，提交 UTC

- **做什么**：`datetime-local` 显示浏览器本地时间，控件/标签注明“本地时间”；提交转 UTC；补一条最小规范条款。
- **不做什么**：不显示 UTC 不加说明；不只修换算不补规范；不把时区规则藏进代码注释。
- **风险**：跨时区协作看到不同时间；DST/非法值；URL 旧值兼容。
- **改动**：PaperBuilder `business-log-page.tsx`、`business-log-page.test.tsx`、相关规范/交互条款。

### D-004 — 五道判断放现有方法，不新建技能

- **做什么**：在 `frontend-component-quality/SKILL.md` 加“触发与就绪”段和 `references/implementation-readiness.md`；C07 已并入 main，build-plan 的 UI 适用性步骤加最小指针触发就绪，build-code 的 UI 段加最小指针按它停/补/查/修，wh-review 的优化 lens 只在有预算/实测时动性能；不改 C07 的运行验证正文。五道各有载体：触发=build-plan UI 适用性步骤；就绪=readiness 短表；实现=build-code UI 段；检查=build-code 检查步；优化/审查=wh-review lens。
- **不做什么**：不新建独立技能；不新增 stage/gate/第二状态机；不把能力做成 dashboard/tracker。
- **风险**：共享方法文件与 C07 冲突；判断表退化；新增引用文件无真实 consumer。
- **改动**：`skills/frontend-component-quality/SKILL.md`、`references/implementation-readiness.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`（C07 后）。

### D-005 — 就绪记录与四种处置

- **做什么**：就绪记录逐项写八类规范、四类资产、设计输入、检查命令的 `项 | 来源 | 状态 | 补法/知会者 | 消费者 | 处置`；处置为 `proceed`、`proceed-with-gap`、`supplement`、`stop-affected`；缺项不自己造。
- **不做什么**：不把“没找到”当“没有”；不把缺项写成 N/A 了事；不把补规范当 C06 自己的活。
- **风险**：字段过多变成打勾；知会者未具名；与 C01/C03/C04/C08 边界。
- **改动**：`references/implementation-readiness.md`；验证任务的就绪记录；必要时一个窄 JSON 校验器（先证明有真实 consumer）。

### D-006 — 实现按真实资产，复用优先

- **做什么**：读 PaperBuilder `specs/frontend/frontend.md`、`specs/design/interaction.md`、`quality.md`、真实组件/测试；复用现有页面结构；类型/状态/焦点/CSS 归属写清。
- **不做什么**：不重做设计；不新建组件库；不把同名当同义；不把 PaperBuilder 台账套到别的项目。
- **风险**：时区规范缺口；DST/非法值；写集扩散。
- **改动**：PaperBuilder `business-log-page.tsx` 与其测试；就绪记录引用规范。

### D-007 — 检查时机与证据

- **做什么**：实现后、审查前跑类型检查、定向测试、样式检查；改动前采构建体积基线，改动后复测；无预算只测不优化记 unknown；记录命令/exit/原始输出；静态检查不冒浏览器/a11y/性能。
- **不做什么**：不先改后测；不拿 lint/规则数/截图当全部通过；不因全仓历史债阻塞本次。
- **风险**：工具未装/报错；合法例外；时区测试受环境影响。
- **改动**：PaperBuilder 检查命令；C06 `quality/tests/` 原件。

### D-008 — stylelint 17.16.0 接样式检查

- **做什么**：在 PaperBuilder 加精确 `stylelint@17.16.0`，开 `no-duplicate-selectors`、`declaration-no-important`；新增/目标文件 `--max-warnings 0`，存量只 warning；非法/合法 fixture。
- **不做什么**：不扩正则 checker 冒充 AST；不全仓 `--max-warnings 0`；不无条件报合法 `!important`。
- **风险**：Project 是否接受新 devDependency；合法例外；Tailwind 4 语法误报。
- **改动**：PaperBuilder `package.json`、`stylelint.config.mjs`、fixtures、脚本；C06 证据。

### D-009 — 修根因、只复跑受影响面

- **做什么**：检查/审查发现问题先定位根因；设计问题归 C05/设计 owner，代码归实现者，运行验证归 C07，规范/资产升级归 C08；修后只复跑受影响 file/case。
- **不做什么**：不只改表象；不盲目重跑全量；不反改判据吞失败；不把设计问题自己改掉。
- **风险**：根因误判；范围扩散；修复引入新问题。
- **改动**：PaperBuilder 修复 diff；C06 修复/复跑记录。

### D-010 — 独立代码审查走现 OCR 链

- **做什么**：代码面用 `stage-runtime review --action=record` 选 OCR；同源补充两个独立上下文；finding 处置 fixed/rejected_invalid/accepted_risk/needs_human；provider 不可用保原失败。
- **不做什么**：不换执行者；不把同源补充当独立审查；不把空 findings 当未执行/通过；不把 C07 运行报告替代码审查。
- **风险**：OCR 可用但未跑；同源补充无脚本；终末固定 OCR。
- **改动**：C06 `quality/reviews/`；PaperBuilder diff/AC packet。

### D-011 — 完整 Vercel 76 文件闭包

- **做什么**：按 `dd089a8c…` 把 76 文件扩进现有 `skills/frontend-component-quality/upstream/react-best-practices/`；加来源/版本/上游地址记录与 MANIFEST；现有本地重建 MIT 文本保留不动、不新增；21 行摘要移到 `upstream/react-best-practices/history/AGENTS-21lines.md` 作历史，不再当规则源。
- **不做什么**：不新建 `upstream/vercel-react-best-practices/`；不删现有许可文本；不收摘要/HIGH+ 子集/镜像/宿主安装；不只收 AGENTS.md；不双写。
- **风险**：上游无独立 LICENSE 文件；现有许可文本是本地重建；与 PRD AC-C06-2 的字面冲突按用户决定记偏差；打包路径与 21 行引用迁移（catalog/契约测试/notices 要同步）。
- **改动**：`skills/frontend-component-quality/upstream/react-best-practices/**`、`skill-bundle.json`、`move-map.json`、catalog/registry/PRD 台账、契约测试（不新增许可段）。

### D-012 — 8 个外部包逐项处置

- **做什么**：I-08 Vercel 完整 76 文件；I-01 web-design-guidelines 完整 104 条规则闭包（表单/焦点有真实用途）；I-02 better-ui 完整 8 文件（组件工艺，和 C03 划界）；I-03 animate 本验证任务无动效，条件未触发；I-04 review-animations 只借概念；I-05 iterate 不整包；I-06 landing 不引入；I-07 view-transitions 无需求不引入。
- **不做什么**：不为凑 8/8 复制；不把 review-animations 登记为第二审查人；不改 C03 资产语义；不新增许可证文件。
- **风险**：I-02 两份研究结论冲突（本稿按用户选择引完整包）；三包放技能 upstream；I-07 来源未取得。
- **改动**：`skills/frontend-component-quality/upstream/react-best-practices/**`、`.../web-design-guidelines/**`、`.../better-ui/**`；`skill-bundle.json`、`move-map.json`、catalog、reuse-registry、PRD 台账、契约测试（不新增许可段）。

### D-013 — 不新增控制面或第二规范权威

- **做什么**：复用 `frontend-component-quality`、`frontend-testing`、`wh-review`、build-code、task facts 与现有 catalog；新增文件先登记 owner/consumer/替代/退出。
- **不做什么**：不建新 stage/gate/状态机/score/dashboard/tracker；不建第二规范权威或第二审查人。
- **风险**：为就绪/检查/审查另建平台会撞 S2/S4；事实不阻断修复，不等于缺失可冒完成。
- **改动**：`docs/architecture/move-map.json` 只追加真实新文件；catalog 只加真实条目；AGENTS 复用现有行。

### D-014 — 删除/改接口消费者证据

- **做什么**：删/改 export/API/type/props/事件/slot/布局/CSS 前，列直接/间接/未知消费者与风险；静态+类型+运行+页面四层；未知写原因/owner；删除后跑受影响面。
- **不做什么**：不把 `rg` 没命中当零；不把测试引用当生产；不把同名当同义；不全量测试换安心。
- **风险**：无扫描器；动态 import/portal/字符串 class 可能漏；本验证任务可能无删除侧，需 N/A + 原因 + C05 反例参考。
- **改动**：PaperBuilder diff、消费者清单、风险/复核记录；C06 证据。

### D-015 — 六条 AC 逐条对账、边做边验

- **做什么**：每个工作包完成一个可观察单元就跑对应命令/样例，保留原始输出；六条 AC 各有成功/失败/证据；整卡终末逐条对账。
- **不做什么**：不等最后一次性验收；不用规则数/截图/文件存在代替真实消费；不把 C07 运行证据替工程验收。
- **风险**：跨仓证据绑定；验证任务小，部分 AC 只能 N/A + 原因。
- **改动**：C06 `quality/evidence/`、`quality/tests/`、最终 handoff。

### D-016 — C07 先合，C06 后写共享文件

- **做什么**：C07 已并入 main（`50b51c96` 含 P8 交付）；C06 可在 build-plan/build-code 的 UI 段加最小指针；不改 C07 的运行验证正文；`implementation-readiness.md` 先由 `frontend-component-quality/SKILL.md` 自身消费，再加 workflow 指针。
- **不做什么**：不并发改共享文件；C07 已并入 main，但仍不改 `frontend-testing`/`isolated-browser-qa`/`review` 正文。
- **风险**：C07 已合入但模板可能再变；C06 只加最小指针，不改运行验证正文；接线后要跑一次真实消费。
- **改动**：build-plan 锁 C07 commit；C06 只碰独占文件（frontend-component-quality 工程段、external、PaperBuilder 分支）。

### D-017 — 就绪记录用短表，缺口自己补最小条款

- **做什么**：build-code 实现者在写代码前写就绪记录，放 `quality/evidence/readiness-<phase>.md`（或 decision-log 指定节）；逐项写八类规范、四类资产、设计输入、检查命令的 `项 | 来源 | 状态 | 补法/知会者 | 消费者 | 处置`。相关缺口=影响本次 diff 的文件/组件/行为/验收，按“用户已确认的决定/设计源 > 现有测试与平台语义 > 现有代码”顺序取证，现有代码只证明现状、不证明应然；能推导就补最小条款，写清适用/不适用、正例/负例、消费者、验证用例；推不出再交用户/设计决定。无关缺口记录后继续，不阻塞本次。
- **不做什么**：不把当前代码反推为应然标准；不引入“原负责人必须先补”的等待；不把缺项写成 N/A 了事；不自造设计值；不另建第二规范权威；不让实现者自判走查通过。
- **风险**：自补条款可能越权或过度；把 bug 写成规范；短表容易退化成打勾；相关/无关缺口边界被扩大。
- **改动**：`frontend-component-quality/references/implementation-readiness.md`；PaperBuilder `specs/design/interaction.md` 的时区条款；验证任务的就绪记录。

### D-018 — 验证任务范围：时区修复 + ViewModel + 重复映射合并

- **做什么**：在 PaperBuilder `/business-logs` 时间筛选上做三件小事：①本地时间显示 + “本地时间”标签、提交 UTC；②加时间筛选 ViewModel 类型与本地↔UTC 转换函数；③合并 `asyncStateForPage` 与 `BusinessLogView` 内联的非就绪状态映射，删重复分支。
- **不做什么**：不改后端/API 合同；不重构整个筛选区；不新建组件库；不动 PaperBuilder 当前未提交改动。
- **风险**：三项改动在同一文件/测试，边界要清楚；DST/非法值；重复映射合并可能改变边界状态；写集 7 文件（含 stylelint 配置/fixtures）。
- **改动**：`frontend/src/business-log-page.tsx`、`frontend/src/business-log-page.test.tsx`、`specs/design/interaction.md`；PaperBuilder 新分支从 main `5bdf6f0b`。

### D-019 — 检查在实现后统一跑，stylelint 进 PaperBuilder

- **做什么**：实现完成后、独立审查前统一跑类型检查、定向测试、stylelint；stylelint 精确 `17.16.0` 进 PaperBuilder devDependency 与项目配置；新增/目标文件 `--max-warnings 0`，存量只 warning；改动前采构建体积基线，改动后复测；筛选交互耗时归 C07 或 unknown，预算缺源记 unknown。命令写死：`pnpm --dir frontend run typecheck`、`pnpm --dir frontend exec vitest run src/business-log-page.test.tsx`、`pnpm --dir frontend exec stylelint "src/**/*.css"`、`pnpm --dir frontend run build`。构建体积不设硬阈值，记录字节；任何增长要解释，不写“无回归”除非有数字。
- **不做什么**：不每改一行就跑；不全仓 `--max-warnings 0`；不把 lint 当浏览器/a11y/性能证据；不自造性能秒数。
- **风险**：PaperBuilder 是否接受新 devDependency；Tailwind 4 语法误报；合法 `!important` 例外；性能测量环境噪声。
- **改动**：PaperBuilder `package.json`、`stylelint.config.mjs`、fixtures、`lint:css` 脚本；C06 `quality/tests/`。

### D-020 — 一次独立 OCR 全审 + 同源补充，修根因限本次范围

- **做什么**：审查真实 diff、测试、规范条款与 AC；一次独立 OCR 全审 + 同源补充；finding 修根因，范围限这次改动及直接影响；修后只复跑受影响 file/case。
- **不做什么**：不两路 OCR；不只做同源补充；不顺同一文件全修；不把设计/运行问题自己改掉。
- **风险**：OCR 可用但未跑；同源补充无脚本；修复扩散；C07 运行证据混入。
- **改动**：C06 `quality/reviews/`；PaperBuilder 修复 diff 与复跑记录。

### D-021 — 外部三包进技能 upstream，不新增许可证文件

- **做什么**：完整引入 Vercel react-best-practices（`dd089a8c…`，76 文件）、web-design-guidelines（`434b7f9…` 的 104 条规则闭包）、better-ui（`1eb03d2…` 的上游 8 文件）；路径与许可按 D-023 落地（沿用现有 Vercel upstream、保留历史许可文本但不新增）；每包写独立 UPSTREAM（源仓/commit/包内路径/逐文件 SHA/维护触发）；21 行摘要降为历史。
- **不做什么**：不放 `skills/external/`（偏离 PRD 路径，写清理由）；不为其他包凑数；不新增许可文件；不把 review-animations 当第二审查人。
- **风险**：与 PRD AC-C06-2 的 LICENSE 字面冲突：不新增许可证文件，上游许可未核实，不宣称合规；打包路径要核；三包各自 pin 不同；旧 21 行引用迁移。
- **改动**：按 D-023 的路径与 bundle 清单；`frontend-component-quality/SKILL.md`、catalog/reuse-registry/PRD 台账/契约测试（不写许可字段）。

### D-022 — PaperBuilder 新分支交付，AC 不适用项写清原因

- **做什么**：用独立 `git worktree add <task-dir> -b <branch> 5bdf6f0b` 从 PaperBuilder main 开新工作树，不碰用户脏工作树、不 stash；审查修完后提交；证据绑分支/提交/diff/sha；命令沿 D-019；stylelint 安装被拒时用临时配置跑目标文件；AC5 的后端 DTO/API 记 N/A + 原因，类型/ViewModel/状态/焦点/错误/时间用例实跑；AC6 以“内部映射合并”为本任务验收对象，公开 API 删除明确排除、AC6 记部分，不写通过；审查/检查发现逐条处置，修复后重跑受影响检查，再做一次最终 diff 审查。
- **不做什么**：不带 PaperBuilder 当前未提交改动；不只改工作树不提交；不跳过 AC5/AC6；不把 N/A 写成通过。
- **风险**：提交授权已取得（2026-11-01 Grill：允许提交）；新分支与脏工作树隔离；N/A 范围被误读；合并映射改变状态边界。
- **改动**：PaperBuilder 新分支与提交；C06 证据引用分支/提交；`quality/evidence/`。

### D-023 — 外部路径沿用现有 upstream，保留历史许可文本但不新增

- **做什么**：Vercel 76 文件扩进现有 `skills/frontend-component-quality/upstream/react-best-practices/`；21 行摘要移作历史件；web-design-guidelines、better-ui 新建 `upstream/web-design-guidelines/`、`upstream/better-ui/`；三包各写 UPSTREAM（源仓/commit/包内路径/逐文件 SHA/维护触发），并把文件列入 `skill-bundle.json` 与 `move-map.json`；现有本地重建 MIT 文本保留不动，不新增许可文件。
- **不做什么**：不新建 `upstream/vercel-react-best-practices/`；不删现有许可文本；不改 ADR0016 正文；不把“无新增许可”写成“许可已满足”。
- **风险**：旧 21 行位置/引用迁移；bundle 文件多、打包校验；ADR0016 仍称旧闭包；三包各自 pin 不同；不新增许可与 AC2 字面冲突。
- **改动**：`skills/frontend-component-quality/upstream/react-best-practices/**`、`.../web-design-guidelines/**`、`.../better-ui/**`；`skill-bundle.json`、`move-map.json`、catalog、PRD 台账、`THIRD_PARTY_NOTICES`（只改路径/角色，不新增许可段）、契约测试（21 行历史位置同步）；web-design-guidelines 只搬规则体 104 条，不搬无许可 wrapper；better-ui 记上游 MIT/pin，不宣称镜像许可；ADR0016 只提案，owner 裁决。

### D-024 — 五道判断各一条对账，并做一次独立走查

- **做什么**：在能力材料加“五道判断对账表”：每道写“写在哪、谁执行、看什么事实、本次证据”；触发=真实页面/组件/样式+真实消费者；就绪=短表+补法；实现=真实 diff/消费者；检查=命令/输出；优化审查=有预算/实测/审查发现才动性能，无预算只测不优化记 unknown。另请一个独立上下文只拿方法与同一份 diff 走一遍五道，记录“能否做决定”。
- **不做什么**：不新增 stage/gate；不把走查做成第二审查人；不把六条 AC 当五道判断的替代；不在无预算时优化性能。
- **风险**：走查变成走过场；触发/优化仍只有文字；独立上下文缺同一材料。
- **改动**：`frontend-component-quality/references/implementation-readiness.md` 的五道对账；C06 `quality/reviews/` 的走查记录；AC1/AC5 证据。

### D-025 — AC 分层：C06 代码级，浏览器/视觉/交互耗时归 C07 或 unknown

- **做什么**：C06 做 jsdom 状态/焦点/错误/时间往返 + typecheck + stylelint + 构建体积前后；真实 Tab 顺序/视觉焦点/a11y/交互耗时归 C07 或记 unknown；AC6 用“合并重复非就绪映射”做内部接口改动的直接消费者/风险证据，公开 API 删除记 N/A + 原因 + C05 `BacktestWorkbench`/`EquityCurve` 反例参考。
- **不做什么**：不借 C07 浏览器报告冒充 C06 通过；不把内部映射合并说成公开接口删除；不把 unknown 写成 pass；不为 AC5/6 扩成浏览器/后端大改。
- **风险**：N/A 被误读为完成；内部改动证据弱；构建体积受环境影响；AC6 公开接口删除未实测。
- **改动**：PaperBuilder 测试/构建命令；C06 `quality/tests/`；AC5/AC6 证据表；C07 输入清单。

### D-026 — 下一步卡是 steps.json 的投影，不新增状态

- **做什么**：在 `check-stage-steps.mjs` 加 `--card` 与 `--step=N`：卡显示当前步号/slug、一句结果、入口条件、停止条件、≤3 个只读路径/锚、完成证据、自查命令、是否需要真实答复；`--step=N` 只判本步+前置；旧目录文件不算本步证据；跳步写具名缺口并停在原步；允许 `--skip-with-gap` 显式记录原因/owner/恢复条件后前进，卡显示“跳过·具名”，阶段收口消费缺口。SKILL.md 每步加稳定锚，删重复 observable_result 表；build-plan/build-code 补“留痕边界”。
- **不做什么**：不新建 stage/gate/第二控制面；不新增 step 账本/游标；不改 checker exit 0 报告性质；不批量改旧 `#方法` 锚；不把卡接成阻断门。
- **风险**：卡被误用成门；锚漂移；目录共用仍误判；规则三份再复制。
- **改动**：`tools/cli/check-stage-steps.mjs`、`tests/contract/check-stage-steps.test.mjs`；`workflows/{make-decision,build-plan,build-code}/SKILL.md` 与 `steps.json`；不新增 runtime 对象。

### D-027 — build-plan 每条 AC 写成本，Phase 写总预算

- **做什么**：AC 成本块=`executor/estimate_min/hard_cap_min/resources/observation/retry_cap/evidence_tier`；Phase=`acceptance_cost_total`+`phase_budget{soft_min,hard_min,variance_threshold,source}`；超 soft 拆/砍，超 hard 用户确认；整卡拆“便宜可证/真实环境”两段；计划确认展示总额/上限/拆分；超 hard 要 postmortem/根因，不静默停；P0/安全/合法修复走例外，不冻结全部工作。
- **不做什么**：不新增预算账本/对象；不设机器 exit gate；不设全任务轮次上限；不把“预算内”写成无数字断言；不把 11 AC 塞一个末 Phase。
- **风险**：默认 2h/4h 不适合所有项目；拆分过碎；用户看不到真实成本；数字变形式。
- **改动**：`workflows/build-plan/SKILL.md`、`steps.json`、`skills/spec-plan/templates/phase-template.md`；`spec-specify` 五问引用；不新建 validator。

### D-028 — build-code 有预算、重试闸、watchdog、子代理 deadline

- **做什么**：Phase 开工记 `execution_budget{window_minutes,command_cap,wait_cap}`；每 30 分钟/50 命令对照；1.5× 停扩；先分可重试/不可重试：权限、输入非法、合同不成立、provider 不可用等不可重试失败第一次即停；同失败签名连续 2 轮无新事实停该路径，第 3 轮需新证据/用户；命令 30/90 分钟超时；长步骤用 heartbeat/阶段回报（不只 deadline），子代理每 15 分钟一行 stage+ETA，2 次无回停轴；禁 45s 空转 sleep；facts phase cursor 每 Phase 更新。
- **不做什么**：不新增全任务时长上限；不把预算停止当通过/失败；不新增 validator；不改变 review provider 不可用口径；不用 wait/sleep 代替干预。
- **风险**：预算太紧误停真实环境；deadline 与长任务冲突；子代理回传变形式；证据去重误删。
- **改动**：`workflows/build-code/SKILL.md`、`steps.json`、Phase 模板、facts 读回说明；`stage-reflection` 成本口径只读/最小改。

### D-029 — 验收与 gate 命令冻结，改必须走变更批准

- **做什么**：实现开始后只冻结 AC 判据与 `gate_cmd`，不冻结合法 bug 修复；失败后不得改材料/改 gate 让失败变可过；必须变更时写 CR、成本影响、独立审查批准、重新确认；P0/安全例外，超预算走 postmortem；T03 的 132→168 作为反例。
- **不做什么**：不禁止合法修 bug；不把冻结变成新 gate；不允许实现者自批；不把“改材料”当修复。
- **风险**：冻结挡住真实判据错误；CR 变成形式；独立批准者缺位。
- **改动**：`workflows/build-code/SKILL.md`、`build-plan` Phase 卡、`docs/standard-workflow.md` 变更段；不新建对象。

### D-030 — 证据同字节只留一份，Phase 游标按 Phase 更新

- **做什么**：同一事实同字节复用；预镜像/备份内容寻址，只留唯一字节；去重只去存储字节，保留来源/引用/时间/消费者；目录快照禁止；证据预算按库大小×3 预检；facts phase cursor 每 Phase 更新，超预算/超时升级。
- **不做什么**：不新增证据账本；不删历史原件；不把“有文件”当证据；不用 gzip 重复包同一字节。
- **风险**：去重误删不同事实；预算预检低估；旧原件不可变约束。
- **改动**：`docs/standard-workflow.md` 证据段、`workflows/build-code/SKILL.md`、`runtime/task` 预算读取说明；T03 只读回放。

### D-031 — 用 T03 材料做一次只读回放，不改 T03

- **做什么**：用 T03 的 P1/P3/P7 材料做回放：新成本块/总预算/拆分/停止规则能否在 030、050/060/074、132→168、51 预镜像、24h 子代理这些点上停住；产出 `quality/evidence/t03-replay.md`，只读，不跑 T03、不改 T03。
- **不做什么**：不重跑 T03；不改 T03 代码/材料；不把回放当 T03 验收通过；不新增 T03 任务。
- **风险**：回放材料不全；P7 未实跑；回放结论被当真实执行。
- **改动**：C06 `quality/evidence/t03-replay.md`；不碰 T03 工作树。

### D-032 — 方向审查后的调整：先精简，再控制，缺口要被收口消费

- **做什么**：
  1. WP7 不只做卡，还要做“材料精简”：删 `make-decision/SKILL.md:271-285` 重复的 observable_result 表（11073B）；build-code 7 个 facts-only 步按 D-032 第 8 条逐项补真实证据（1 决策/规格/Phase、3 diff/commit、6 AC/UI、7 diff scan、10 acceptance trace、11 spec-analyze、12 handoff），不再留“要么补要么并”的开放分支；每步卡只读 ≤3 个路径/锚；用“每步读多少字节/路径、跳步数、返工数、Phase 时长”做前后基线。
  2. 阶段收口必须消费缺口：卡仍只报告、不改 checker exit；但阶段 close/交接读取 `steps_unattested`/跳步缺口，缺口未清就写 incomplete，不新增 gate；负例回放=checker exit 0 且有缺口，收口不得写完成。
  3. WP9 的停止要能真正终止：宿主/主会话是子进程组 owner；heartbeat/超时触发后用现有 host cancel/kill 回收进程组；没有回收能力就记 unavailable 并停，不只写规则；做一次有界 live 测试（起一个 sleep 子进程，触发超时，断言进程组消失）。
  4. 审批等待有上限：超 hard 预算或 CR 等用户确认，等待 15 分钟无答复就停该路径、保留现场、记 awaiting_user；不自动批准、不无限挂起。
  5. 阈值先标“待校准”：soft=120/hard=240、30/90min、15min、2 轮都是 provisional；用 T03 回放 + 2 个代表性 stage 校准，产出误停/漏停表，再由用户确认。
  6. 证据身份：内容 hash 只做存储去重；每条证据还要带 task_id/run_id/step_slug/artifact_sha/created_at；旧运行同字节不能当当前证据。
  7. 不分交付批次：R-013/14/15、WP7/8/9 全在当前卡；9A 重试/超时/进程回收 → 9B 冻结/CAS 只是 WP9 内部实施顺序，不是 deferred；每段可独立验收，但不拆成两张卡。
  8. build-code 7 个 facts-only 步的处置：1 read-current-task-documents → decision-log/spec/phase refs；3 implement-change → diff/commit；6 inspect-acceptance-and-ui → AC/UI contract；7 scan-diff → diff scan output；10 run-final-aggregate-and-ac-trace → acceptance trace；11 stage-end-spec-analyze → spec-analyze record；12 closeout → handoff。不是“要么补要么并”的开放分支。
  9. 7A 的当前运行身份：证据路径 + task_id/run_id/phase/commit 至少一项；旧运行同字节不算当前证据。9B 再做完整 CAS。
  10. `docs/standard-workflow.md` 只最小改成本/停止/证据段，其余正文只读；收口消费缺口规则写 build-code/SKILL 与 decision-log。
  11. 下一阶段 build-plan 对 WP1～WP9 一次设计，不先 WP7/WP8；WP9 的 9A→9B 只是内部实现顺序，不是交付批次。build-plan 的 spec/Phase 必须同时覆盖原有前端能力（WP1～6）和新增执行/成本控制（WP7～9）。
- **不做什么**：不把卡接成通用 exit gate；不新建 stage-run 服务；不重跑 T03；不自动批准预算/CR；不把“同字节”当“同一次运行”。
- **风险**：精简删掉有用规则；阶段收口消费缺口变成新门；host kill 权限/误杀；审批超时误停；校准样本不足。
- **改动**：`check-stage-steps.mjs` + tests；`make-decision/build-plan/build-code` SKILL/steps；`skills/spec-plan/templates/phase-template.md`；`docs/standard-workflow.md` 收口/证据段；不新增 runtime 对象。

### 增量切片

| 切片 | 内容 | 前置 | 验收 |
| --- | --- | --- | --- |
| 7A | 卡：当前步/入口/停止/≤3 路径/证据/交互 | 无 | AC7 卡部分 |
| 7B | 精简：删重复表、处理 facts-only 步、每步 ≤3 路径、基线指标 | 7A | AC7 精简部分 |
| 8 | 预算：AC 成本块、Phase 总预算、拆分、确认 | 7A | AC8 |
| 9A | 控制：不可重试/2 轮/超时/heartbeat/进程组回收/审批超时 | 7B+8 | AC9 控制部分 |
| 9B | 冻结/CR/CAS 证据身份/校准 | 9A | AC9 冻结/证据部分 |

## 每包交付什么，为什么这样定？

| 工作包 | 交付结果 | 来源需求 | 决定 |
| --- | --- | --- | --- |
| 工作包 1 | 触发与就绪判断方法 + 验证任务的就绪记录 | R-001、R-012 | D-001、D-004、D-005 |
| 工作包 2 | 按真实规范/组件/布局的实现方法与验证任务源码 diff | R-002、R-003、R-007 | D-002、D-003、D-006 |
| 工作包 3 | 类型/样式/定向测试/性能的检查时机与证据 | R-003、R-004、R-006、R-009 | D-007、D-008 |
| 工作包 4 | OCR 审查、同源补充、finding 处置、修后复核 | R-004、R-008 | D-009、D-010 |
| 工作包 5 | 76 文件闭包 + 8 包处置 + 登记 | R-005、R-011 | D-011、D-012 |
| 工作包 6 | PaperBuilder 验证任务、删除侧消费者、六条 AC 对账 | R-010、R-011、R-012 | D-014、D-015 |
| 工作包 7 | 全阶段下一步卡 + 按步检查 | R-013 | D-026 |
| 工作包 8 | build-plan 成本/预算/拆分 | R-014 | D-027 |
| 工作包 9 | build-code 预算/停止/子代理/证据 | R-015 | D-028、D-029、D-030 |
| 工作包 8/9 验证 | T03 只读回放 | R-014、R-015 | D-031 |

## 五道判断对账

这不是新增阶段或门，而是把 C06 的产品说清楚：六条 AC 之外，五道判断各要有落点和本次证据。

| 判断 | 写在哪 | 谁执行 | 看什么事实 | 本次证据 |
| --- | --- | --- | --- | --- |
| 触发 | `frontend-component-quality/SKILL.md` 触发段 | build-plan/build-code 作者 | 真实页面/组件/样式改动 + 真实消费者；纯文档/后端/无消费者样例写 N/A + 原因 | PaperBuilder 验证任务的触发记录 + 一条 N/A 样例 |
| 就绪 | `references/implementation-readiness.md` | 实现者 | 八类规范/四类资产/设计输入/检查命令的来源、状态、补法；缺口的四种处置 | PaperBuilder 就绪记录：时区规范缺口 + 补最小条款 |
| 实现 | WP2 + Component Quality Map | 实现者 | 真实 diff、真实消费者、规范/组件/布局消费点、类型/状态/CSS 归属 | PaperBuilder diff + 消费者清单 |
| 检查 | WP3 | 实现者/独立测试 | 类型、定向测试、stylelint、构建体积；命令/exit/原始输出 | 检查原件；浏览器/视觉/交互耗时归 C07 或 unknown |
| 优化/审查 | WP4 + D-024 | 独立审查者 | 有预算/实测/审查发现才动性能；无预算只测不优化记 unknown；finding 修根因并复跑 | OCR 审查 + 修复复核 + 独立走查记录 |

**判定分支（AC1 场景）**：

| 场景 | 输入 | 判定 | 输出/去向 |
| --- | --- | --- | --- |
| 非 UI 任务 | 纯后端/文档/无消费者 | 不触发，写 N/A + 原因 | 不建就绪记录 |
| UI 任务，规范/资产齐 | 真实页面/组件/样式 + 消费者 | 触发，短表全绿 | 进实现 |
| UI 任务，相关缺口可推导 | 影响本次 diff 的规范/资产缺口 | 补最小条款（来源/范围/正负例/消费者/验证） | 进实现，记录补法 |
| UI 任务，非阻塞缺口 | 不影响本次 diff 的规范/资产缺口 | proceed-with-gap：记录知会者/影响/复核点 | 进实现，缺口保持可见 |
| UI 任务，缺口不可推导 | 无用户决定/测试/设计源 | 停受影响路径 | 交用户/设计决定，其余继续 |
| build-code 缺就绪记录 | UI 改动前 | 停 | 先补记录，再写代码 |
| 修后复入 | finding 修完 | 重跑受影响检查/审查 | 通过才继续 |

**独立走查**：另请一个未参与写作的上下文，只拿这套方法和同一份 PaperBuilder diff，逐道判断“能不能做决定”，记录每道的结果（可决定/需补/不可用）与依据；走不通就说明能力未交付。走查记录落 `quality/reviews/`，不替代六条 AC，也不新增阶段。

## 方向审查说了什么，我们怎么处置？

独立方向审查原件：`quality/reviews/2026-10-31-direction-review.md`。结论是 Recycle，不建议 Kill。回读时点：2026-11-01 第 5 步骨架确认后；审查基于 v3，v4 已按下列处置修改，未发现新的方向问题。逐项处置如下。

| 审查发现 | 处置 | 落点 |
| --- | --- | --- |
| 六条 AC 可能全绿但“触发/优化”没交付 | 增加五道判断对账表 + 一次独立走查；触发/优化各一条可执行条款 | 本日志「五道判断对账」；D-024 |
| “从现有代码推导”会把 bug 写成规范 | 来源顺序改为“用户已确认决定/设计源 > 测试与平台语义 > 现有代码（只证现状）”；补条款要带正负例/消费者/验证用例 | D-017 |
| 三项改动扩大写集；AC6 用内部重构凑删除侧；AC5 借 C07 | 保留三项小改但分层：C06 只做代码级 jsdom/typecheck/stylelint/构建体积；浏览器/视觉/交互耗时归 C07 或 unknown；AC6 公开 API 删除 N/A + C05 反例，内部映射合并只作部分证据 | D-025；AC5/AC6 表 |
| 外部三包路径/许可/打包冲突 | 沿用现有 `upstream/react-best-practices/` 扩 76 文件；web/better-ui 新建子目录；现有本地许可文本保留、不新增；三包各自 UPSTREAM + bundle/move-map | D-021、D-023 |
| “6 个独立验收包”不成立；C07 未合时方法文件无 consumer | 改称“一条能力链 + 6 个交付切片”；只有 WP5 独立；C07 已并入 main，方法文件由 `frontend-component-quality/SKILL.md` 自身消费，并在 build-plan/build-code 加最小指针 | 模块表；D-016 |
| stylelint/分支提交/设计条款需外部点头 | 保留主路径，同时写 fallback：stylelint 可临时配置跑目标文件；分支不授权时证据绑 diff+sha256；设计条款由用户确认 | D-019、D-022、D-025 |

未处置/保留：C07 模板可能再变；AC6 公开接口删除未实测；无新增许可与 AC2 字面冲突；这三项在 OI/风险中保持可见，不写成通过。

## 验收面

AC-C06-1～9 全部在本卡验收；build-prd 不在本卡范围（不是批次，是范围排除）。；失败是任一验收只有文档、规则计数或样例告警，没有真实页面源码、真实消费者、原始输出或修后复核。

| AC 编号 | 可观察用例 | 成功条件 | 失败条件 | 证据 | 承接负责人 | 对应 UC |
| --- | --- | --- | --- | --- | --- | --- |
| AC-C06-1 | 真实页面与源码定位规范、组件、布局的实际消费和状态 owner；四维各有依据与负例 | 能指到文件/符号/消费者；四维（组件化/统一性/可维护性/性能）各有至少一条正向依据和一条负例；就绪记录有来源/状态/补法/消费者/处置；至少一条“规范不足→补”的真实判断；五道判断独立走查能逐道做决定 | 只写规则数/样例告警；就绪判断只打勾；走查走过场；不读真实 diff/使用点 | 源码 diff、消费者清单、就绪记录、走查记录（未执行） | C06 实施者与独立审查者 | UC-C06-1 |
| AC-C06-2 | 三包完整闭包与来源可核；许可/分发不宣称合规 | Vercel 76 文件/70 规则/8 类、web 104 条规则、better-ui 8 文件各有文件清单/SHA/UPSTREAM；三包都列进 `skill-bundle.json`，从现有打包产物读一次；C10 正式发布包读取归 C10，C06 只验现有打包产物；不新增许可证文件；现有本地重建 MIT 文本保留；上游许可未核实，不宣称合规；许可/分发按项目所有者“本地个人研究”范围接受风险，AC2 整体记部分 | 21 行摘要/HIGH+ 子集/镜像冒充完整源；把“不新增许可”写成“许可已满足” | 文件清单与 sha256、上游 pin、来源记录、读取记录、许可偏差记录（未取得完整闭包落地） | C06 实施者与独立审查者 | UC-C06-2 |
| AC-C06-3 | 重复 selector 与不合规 !important 报具体位置 | 负例报文件/行/列；合法不误报；新增严/存量警告有记录；实际调用有效 | 工具报错冒通过；只留未运行规则包 | stylelint 命令、exit、原始 JSON、fixtures（未执行） | C06 实施者与独立测试 | UC-C06-3 |
| AC-C06-4 | 独立代码审查、finding 处置、修后复核可读 | OCR 原件、finding 原文/处置、修后 file/case 复跑齐全；provider 不可用保原失败 | 换执行者冒通过；同源补充当独立审查 | 审查原件、处置、复跑输出（未执行） | 独立审查者与 C06 实施者 | UC-C06-4 |
| AC-C06-5 | 类型/ViewModel、错误/重复操作、状态保留、布局阅读焦点/CSS 作用域、时间往返、构建体积实际验证（用户 2026-10-31 已选 C06 只做代码级） | C06 跑 jsdom 状态/焦点/错误/时间往返/重复提交/快速连续筛选/单端筛选/分页重置 + typecheck + CSS 作用域静态检查 + 构建体积前后；时间用例含 UTC→本地跨日、本地→UTC、DST 跳时拒绝/回拨取较早、非法/空/旧 URL、开始晚于结束；错误有 role=alert 容器、aria-invalid、焦点到首个非法输入；真实 Tab/视觉焦点/a11y/交互耗时记 unknown + 承接人（C09 E2E 后续或用户人工验收；C07 已收口不再指向），C06 不写通过 | 静态检查冒充浏览器/a11y/性能；无预算自造阈值；把 C07 结果当 C06 通过 | typecheck、定向测试、构建体积前后（未执行）；C07/unknown 项清单 | C06 实施者与独立测试 | UC-C06-5 |
| AC-C06-6 | 内部映射合并的直接/间接/未知消费者与风险；公开 API 删除明确排除（用户 2026-10-31 已选） | 内部改动列直接/间接/未知消费者、风险与等价性测试；公开 API 删除记 N/A + 原因 + C05 `BacktestWorkbench`/`EquityCurve` 反例参考；AC6 整体记部分，不写通过；未知不当零 | 用内部重构冒充公开接口删除；未发现使用点自动当零；已知不一致静默忽略 | 映射合并 diff、测试、消费者清单、C05 反例引用（未执行） | C06 实施者与独立审查者 | UC-C06-6 |
| AC-C06-7 | 三个主 stage（make-decision/build-plan/build-code）的下一步卡能按步执行、不跳步、旧证据不冒充；build-prd 不在本卡范围；阅读基线可核（先交基线，不宣称降幅） | `check-stage-steps --card` 输出当前步号/slug、入口/停止、≤3 路径/锚、完成证据、`--step=N`；旧目录/旧运行文件不算本步；`--skip-with-gap` 写原因/owner/恢复条件；阶段收口消费缺口，负例不得写完成；删重复 observable_result 表；7 个 facts-only 步按映射补证据；每步读路径/字节、跳步、返工有基线（先交基线，不宣称降幅）；checker exit 仍 0、不接通用门；contract 3 例通过 | 卡显示全部步骤/无锚；目录/旧运行文件算本步；跳过无 gap 自动前进；把卡接成 exit gate | CLI 输出、contract 测试、make-decision 5/6/8 回放 | C06 实施者与独立审查者 | UC-C06-7 |
| AC-C06-8 | build-plan 每条 AC 有成本、Phase 有总预算、超限拆/确认 | AC 成本块七字段齐；Phase `acceptance_cost_total=sum(estimate_min 串行)+max(并行)+shared_prep+retry_reserve`，`phase_budget` soft/hard/variance；T03 P7 回放总额 >4h → 拆 P7a/P7b（预期 6-8h）；缺成本块拒绝进 Phase；计划确认展示总额/上限/拆分；超 hard 有 postmortem/例外 | 只写“预算内”无数字；11 AC 塞一个末 Phase；超 4h 不确认；拆了但不写成本 | T03 P1/P7 回放、Phase 模板、计划确认件 | C06 实施者与独立读者 | UC-C06-8 |
| AC-C06-9 | build-code 有预算/watchdog/重试闸/子代理回收/证据身份 | T03 P3 回放：030 13242s timeout 停；050/060/074 同失败 2 轮停；132→168 变更拒绝；p3_executor 24h heartbeat 停并由宿主回收进程组；审批等待 15min 无答复停；51 预镜像 ≤3 份唯一字节且带 task/run/step/artifact 身份；facts 游标每 Phase 更新；live 测试断言进程组消失 | 无时间/命令/尝试上限；改 gate_cmd 让失败可过；wait/sleep 空转；证据无上限 | T03 回执回放、Phase 预算、facts、证据清单 | C06 实施者与独立测试 | UC-C06-9 |

> 2026-11-02 修正：上表 AC-C06-9 行内“030 timeout、132→168 拒绝、51 预镜像”是旧回放说法，已由 D-033 与 spec Appendix A 修正；当前判据以 spec 为准。

### 验收可执行性

每条 AC 在写进 spec 前要能回答“谁做、靠什么、看什么、证据在哪”。下表是 make-decision 的可执行性核对，不是执行结果。

| AC | 执行者/成本 | 资源来源 | 观察方式 | 证据落点 | 当前可判 |
| --- | --- | --- | --- | --- | --- |
| AC-C06-1 | C06 实施者 + 独立审查者，约半天 | PaperBuilder 分支、规范/资产文件、就绪记录 | 真实 diff、消费者清单、就绪表、五道走查记录 | C06 `quality/evidence/`、`quality/reviews/` | 可判；walkthrough 未执行 |
| AC-C06-2 | C06 实施者 + 独立审查者，约 1-2 小时 | 固定 tarball、现有 upstream、bundle/目录 | 76 文件清单/SHA、按需读取一条、偏差记录 | 上游目录、catalog/bundle、读取回执 | 可判；许可部分只能记偏差 |
| AC-C06-3 | C06 实施者 + 独立测试，约 2 小时 | stylelint 17.16.0、PB 配置、fixtures | 负例报行列、合法不误报、新增/存量分档 | 命令/exit/JSON、fixtures | 可判；未执行 |
| AC-C06-4 | 独立审查者，约 1-2 小时 | OCR、真实 diff、AC 承接、测试面 | 审查原件、finding 处置、修后复跑 | `quality/reviews/`、复跑输出 | 可判；未执行 |
| AC-C06-5 | C06 实施者 + 独立测试，约 2 小时 | PB 测试/typecheck/build、jsdom | 状态/焦点/错误/时间往返、构建体积前后；浏览器项归 C07/unknown | `quality/tests/`、PB 命令输出 | 可判；未执行 |
| AC-C06-6 | C06 实施者 + 独立审查者，约 1 小时 | 映射合并 diff、C05 反例、消费者清单 | 直接消费者/风险/等价性；公开 API 删除 N/A | diff、测试、消费者清单 | 可判；未执行 |
| AC-C06-7 | C06 实施者 + 独立审查者，约 2 小时 | `check-stage-steps` 现有步骤表、contract 测试 | 卡输出/按步检查/旧证据负例/跳过负例 | CLI 输出、测试 | 可判；未执行 |
| AC-C06-8 | C06 实施者 + 独立读者，约 2 小时 | T03 P1/P7 材料、Phase 模板 | 成本总额/拆分/确认件 | 回放、模板、确认件 | 可判；未执行 |
| AC-C06-9 | C06 实施者 + 独立测试，约 2 小时 | T03 回执、build-code 规则、facts | 030/050/060/074/178 回放、24h 子代理、89 预镜像（历史 51） | 回放、命令/证据 | 可判；未执行 |

不能判为通过：依赖未取得且不能就地制造的样张、需要别 Phase 产出、判据无法观察、许可未核实却写“许可已满足”。这些写 `unknown`/`unavailable`/偏差，不写通过。

## 哪些文件由谁改？

- WorkflowHub 能力文件：`skills/frontend-component-quality/SKILL.md`（触发/就绪/检查/回修段）、`skills/frontend-component-quality/references/implementation-readiness.md`（新增）、`workflows/build-plan/SKILL.md`（UI 准备最小指针）、`workflows/build-code/SKILL.md`（UI 检查/停/修最小指针）。`skill-bundle.json` 唯一 writer=WP5，WP1 只读。
- 执行契约/成本控制：`tools/cli/check-stage-steps.mjs`、`tests/contract/check-stage-steps.test.mjs`；`workflows/{make-decision,build-plan,build-code}/SKILL.md` 与 `steps.json`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-code/SKILL.md` 的控制/冻结段；`docs/standard-workflow.md` 的成本/停止/证据段（只最小改这些段，其余正文只读）。
- 外部闭包：`skills/frontend-component-quality/upstream/react-best-practices/**`、`.../web-design-guidelines/**`、`.../better-ui/**`；`skill-bundle.json`、`skills/catalog.yaml`、`docs/architecture/move-map.json`（只追加真实新文件，不建新账本）；`reuse-registry`/PRD 台账/`THIRD_PARTY_NOTICES` 只在现有条目需要同步时最小改，不新增账本/许可段；现有许可文本保留、不新增许可段。
- PaperBuilder 验证分支：从 main `5bdf6f0b` 拉新分支；写集见下表。

| 文件 | 改什么 |
| --- | --- |
| `frontend/src/business-log-page.tsx` | 时区回显/提交、ViewModel 转换、合并重复非就绪映射 |
| `frontend/src/business-log-page.test.tsx` | UTC↔本地往返、空值/非法值/DST、映射合并等价性、状态/焦点 |
| `specs/design/interaction.md` | 一条“本地时间显示、UTC 提交”的交互条款 |
| `frontend/package.json` | 精确 `stylelint@17.16.0` 与 `lint:css` 脚本 |
| `frontend/stylelint.config.mjs` | `no-duplicate-selectors`、`declaration-no-important`、存量 warning 分档 |
| WorkflowHub `skills/frontend-component-quality/tests/fixtures/stylelint/{illegal,legal}/*.css` | 负例/正例放能力测试包，不放业务仓 |
- 共享文件：`workflows/build-code/SKILL.md`、`skill-deps.yaml`、`catalog.yaml`、`move-map.json`、`skills/frontend-component-quality/skill-bundle.json`；只加最小指针/登记。`wh-review/**`、`review/SKILL.md`、`plan-design-review`、`GLOSSARY`、`standard-workflow`、`frontend-testing/**`、`isolated-browser-qa/**` 只读，不改正文。
- ADR0016：C06 只提案，ADR owner 裁决；不静默改。

## 这次覆盖什么，排除什么？

覆盖：五道判断能力、就绪记录、真实实现方法、工程检查、独立审查与修复、完整 Vercel 76 文件闭包与 8 包处置、PaperBuilder 业务日志时间筛选验证任务、六条 AC 证据；追加 WP7 下一步卡/材料精简+指标、WP8 build-plan 验收成本/预算、WP9 build-code 长跑控制，以及 T03 只读回放。9A/9B 是 WP9 内部顺序，不 deferred。

排除：`ui-workbench-target` 实现；C07 的浏览器/视觉/a11y 运行验证；C08 的规范/资产升级；C09 的整体 E2E 与六指标；C10 的发布包；C05 原型重做；PaperBuilder 大重构/后端/API/设计系统；营销页/3D/装饰特效；新 stage/gate/第二控制面；T03 代码修改/重跑/验收通过；build-prd 卡不在本卡范围。

## 还有什么没定，谁来定？

| OI 编号 | 问题 | 来源 | 状态 | 影响 | 解决者 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- |
| OI-001 | 就绪记录字段与窄校验器 | D-017 | 已定 | 能力可执行性/验收 | C06 build-plan | 字段=`项/来源/状态/补法/知会者/消费者/处置`；不建窄校验器（无真实 consumer） |
| OI-002 | 验证任务写集与分支边界 | D-018 | 已定 | 改动范围/提交 | C06 | 独立 worktree 新分支；7 文件 + 一条规范；不带 PB 未提交改动 |
| OI-003 | stylelint 接入位置与合法例外 | D-019 | 已定 | AC3 | C06 | 17.16.0 进 PB；合法例外用带理由的 disable-next-line |
| OI-004 | 审查 packet 与 C07 合并事实 | D-020、D-016 | 已定 | AC4/共享写集 | C06 | C07 已并入 main `50b51c96`；C06 只加最小指针，不改 C07 运行验证正文 |
| OI-005 | 外部包最终集合与落盘/打包 | D-021 | 已定 | 写集/来源 | C06 | Vercel/web/better-ui 三包进 skill upstream；现有许可文本保留、不新增 |
| OI-006 | 验证任务提交/证据绑定 | D-022 | 已定 | 跨仓证据 | C06 | 审查修完后提交；证据绑分支/commit |
| OI-007 | 删除侧证据口径 | D-025 | 已定 | AC6 | C06 | 内部映射合并=部分证据；公开 API 删除=N/A+原因+C05 反例 |
| OI-008 | 性能测量口径 | D-019、D-025 | 已定 | AC5 | C06 | C06 测构建体积前后；筛选交互耗时归 C07/unknown；无预算记 unknown |
| OI-009 | 无新增许可偏差 | D-023 | 已定（用户） | AC2 字面 | 项目所有者 | 现有文本保留、不新增；只留来源/版本；材料写偏差 |
| OI-010 | C07 模板/共享文件顺序 | D-016 | 已定 | 材料返工 | C06 | C07 已并入 main `50b51c96`；C06 只加最小指针，不改运行验证正文 |
| OI-011 | 76 文件进 skill-bundle/move-map | D-023 | 部分 | 打包/消费者 | C06 + ADR0016 owner | 逐文件列 bundle；move-map 登记新目录；ADR0016 历史件处置待 owner |
| OI-014 | ADR0016 历史件/路径处置 | D-023 | 待 owner | AC2/路径 | ADR0016 owner | ADR 裁决前保留现有 21 行文件并标“待裁决”，不执行迁移；AC2 保持部分 |
| OI-012 | 五道判断独立走查 | D-024 | 已定 | AC1 证据 | C06 + 独立上下文 | 走查记录落 quality/reviews |
| OI-013 | 现有本地许可文本保留/不新增 | D-023 | 已定（用户本地个人研究） | AC2 字面 | 项目所有者 | 保留历史文本，不新增；不宣称合规；AC2 部分；再分发需重裁 |
| OI-015 | 下一步卡输出契约与 consumer | D-026 | 已定 | AC7 | C06 + 阶段主会话 | `--card`/`--step=N`；不接阻断门；contract 3 例 |
| OI-016 | build-plan 默认 soft/hard 预算数值 | D-027 | 已定（provisional） | AC8 | 用户 + C06 | 默认 soft=120min、hard=240min；T03 回放+2 stage 校准后定稿；超 hard 必须确认 |
| OI-020 | 宿主回收卡死子进程组 | D-032 | 已定（用户） | AC9 | 宿主/主会话 | heartbeat/超时后回收进程组；无能力记 unavailable |
| OI-021 | 阶段收口消费缺口 | D-032 | 已定（用户） | AC7 | 阶段 close/交接 | 未清缺口记 incomplete；不改 checker 通用 exit |
| OI-022 | 9A/9B 实施顺序 | D-032 | 已定（用户） | AC9 | C06 | 不搞两批；build-plan 一次设计 WP1～9；9A 重试/超时/回收 → 9B 冻结/CAS 只是 WP9 内部顺序 |
| OI-023 | build-prd 卡不在本卡范围 | D-026 | 已定（范围） | AC7 | C06 + build-prd owner | 本卡覆盖 make-decision/build-plan/build-code；build-prd 后续同合同接入 |
| OI-017 | 验收/gate 冻结与变更批准 owner | D-029 | 已定 | AC9 | 独立审查者 + 用户 | 实现开始后冻结；改需 CR/成本影响/独立批准 |
| OI-018 | T03 只读回放证据范围 | D-031 | 待 build-plan | AC8/9 | C06 + 独立读者 | 用 P1/P3/P7 材料与回执；不重跑 T03 |
| OI-019 | 证据预算配置 owner | D-030 | 已定 | AC9 | runtime/task owner + C06 | 按库大小×3 预检（D-033 保留采集前预检）；不足改归档，不中途 blocked |

## 什么风险交给谁？

| 风险 | 影响 | 承接人 | 处置 |
| --- | --- | --- | --- |
| 能力写成原则、没有可执行记录 | 验收空转 | C06 实施/审查 | 就绪记录 + 真实任务 + 六条 AC |
| 时区规范缺口被实现自己猜 | 规范权威被绕过 | 用户/设计 owner | 先补最小条款，再实现 |
| 外部许可/再分发 | 不能复制/必须标注 | 项目所有者 | 如实登记，不宣称已获许可 |
| 21 行摘要冒充完整源 | AC2 失败 | C06 实施/审查 | 76 文件 + SHA + 按需读取负例 |
| 样式检查误报/漏报 | AC3 失败 | C06 实施/测试 | 正负例 + 新增/存量分界 |
| 审查 provider 不可用 | AC4 假绿 | 独立审查者 | 保留原失败，不换执行者 |
| 静态检查冒充浏览器/a11y/性能 | AC5 假绿 | C06 实施/测试 | 分开记，缺证据 unknown |
| PaperBuilder 工作树脏/分支错 | 改动混入 | 用户/C06 | 从 main 新分支，不带未提交改动 |
| C07 模板变化 | 返工 | C06 | C07 已合入；C06 只加最小指针，模板变化时重核 |
| 验证任务太小、部分 AC N/A | 证明力不足 | C06 + 审查者 | N/A + 原因 + 真实反例/后续任务 |
| 下一步卡被接成阻断门 | 变成新 gate | C06 + 审查者 | 卡只报告，不改 exit；不写新状态 |
| 预算数字太硬/太软 | 误停或放行 | 用户 + C06 | 默认 2h/4h 可改；超 hard 必须确认 |
| 验收/gate 冻结挡住合法修复 | 返工/假绿 | 独立审查者 | CR + 成本影响 + 独立批准；不禁止修 bug |
| 子代理 deadline 与真实环境冲突 | 误停长任务 | 开发 + 用户 | 长动作拆任务；deadline 可显式延长 |
| T03 回放被当真实执行 | 假证据 | C06 + 审查者 | 只读回放，不写 T03，不宣称 T03 通过 |

### 质量边界

- 未执行的检查不写成通过；unknown/unavailable/incomplete 保持原词与原因。
- 静态检查不冒浏览器、a11y、性能事实；C07 的运行结果不替 C06 工程审查。
- 审查 provider 失败、空 findings、规则计数、截图、文件存在都不等于质量通过。

## 什么已经退出？

| 日期 | 哪张 | 为什么退役 | 谁决定 | 原来的需求编号 |
| --- | --- | --- | --- | --- |
| 2026-10-31 | 目标仓 `ui-workbench-target` 两页作为 C06 落点 | 规范不够；C06 是能力交付，验证任务次要 | 用户（Talk 003） | R-001、R-012 |
| 2026-10-31 | 21 行摘要作为规则源 | 完整 76 文件闭包替代；摘要只留历史 provenance | 用户（Talk 002） | R-005 |
| 2026-10-31 | 8 包全部完整引入 | 只有 Vercel 强制；其余按条件/消费者 | 用户（Talk 002） | R-011 |
| 2026-10-31 | 新建独立前端技能/stage/gate | 用现有方法扩展，PRD 与 S4 明确不做 | 用户 + PRD | R-001 |

## 大纲地图

- 任务身份：这是什么任务？
- 级别与路线：为什么按复杂做，用户怎么选的。
- 原始需求：R-001～R-015 与来源。
- 后来改了什么：方向纠正与 supersede。
- 工作包 1～9：目标、边界、方案、验收、风险、依赖、消费者、未决。
- D-001～D-031：每个包定了什么、拒绝什么。
- 验收面：AC-C06-1～9 与证据。
- 哪些文件由谁改：能力文件 + PaperBuilder 分支 + C07 顺序。
- 这次覆盖什么，排除什么。
- 还有什么没定：OI-001～019。
- 什么风险交给谁。
- 什么已经退出。
- 外置事实索引：需求索引、覆盖表、收敛清单、研究、Talk。

## 外置事实索引

本任务基准目录：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c06-spec-driven-implementation-20261031/quality/evidence/`

| 原件 | 相对 ref | 何时读 |
| --- | --- | --- |
| 收敛清单 | `quality/evidence/convergence-checklist.md` | 逐包收敛与 8 项证据 |
| 方向 Talk 01 | `talk/2026-10-31-001-direction-batch.md` | 调研范围/载体/C07 顺序 |
| 方向 Talk 02 | `talk/2026-10-31-002-skeleton-decisions.md` | 目标仓/闭包/规范/外部包（部分被纠正） |
| 方向纠正 Talk | `talk/2026-10-31-003-direction-correction.md` | 能力交付/PaperBuilder/五道判断/时区 |
| 需求索引 | `decision-log-refs/requirement-index.md` | R/U/外部义务原义（需按本稿更新） |
| 覆盖矩阵 | `decision-log-refs/coverage-matrix-5d.md` | 每 R/U 落点与缺口（需按本稿更新） |
| 四查原件 | `decision-log-refs/four-check.md` | 旧稿缺口的独立四查（旧方向，部分失效） |
| PaperBuilder 候选 | `research/2026-10-31-007-paperbuilder-validation-candidates.md` | 验证任务候选与测试事实 |
| C06 原始需求研究 | `research/2026-10-31-001-prd-c06-requirements.md` | AC/风险/未决 |
| 上游依赖研究 | `research/2026-10-31-002-upstream-dependencies.md` | C01/C03/C04/C05/C07 输入 |
| 仓库现状研究 | `research/2026-10-31-003-repo-frontend-state.md` | C05 构建/样式/审查能力 |
| 外部来源研究 | `research/2026-10-31-004-external-sources.md` | Vercel/stylelint 版本/许可 |
| 六包研究 | `research/2026-10-31-005-website-skills-packages.md` | I-01～I-06 来源/许可/处置 |
| 外部义务地图 | `research/2026-10-31-006-external-obligations-map.md` | 8 包/概念行/登记规则 |
| 大纲攻击自查 | `outline-attack-check.md` | 过早锁定/隐藏前提/更小路径 |

## D-033 — 2026-11-02 长任务治理与并行验收（用户追加）

- **做什么**：
  1. 采用 A+B：测试数据 S/M/L、按影响选测、事件等待、大件证据指针；计划×2 或连续无新增验收事实时停-复盘，不自动判失败。
  2. 每个 Phase 开发+审查结束后，主会话派至少两个独立只读测试代理并行执行该 Phase 的 AC；代理不共享写入，结果合并，冲突保留。
  3. 只有 AC/范围变化、缺外部原件/凭证或不可逆动作才找人；普通测试失败、代理冲突、环境重试由主会话和测试代理处理。
  4. 全量数据和完整 AC 仍在最终验收跑一次；S/M 只作前置快速反馈。
- **不做什么**：不新增自动全任务硬上限；不按命令数/代理数设质量门；不按 1GB/8MB 删不同证据；不按 3 轮/3 次门禁硬杀合法修复；不降低任何 AC 覆盖。
- **与旧决定关系**：R-015、D-028、D-030 中“30/50 命令停扩”“库大小×3”的旧执行细节由本决定替代；旧文本保留为历史，当前按本决定、spec Appendix A 与 Phase 卡执行。
- **T03 回放事实修正**：030 是 13242 秒 SIGINT/130，不是系统超时；24 小时轴实测 24.2h/0 次停止，132→168 实际改了并重跑，二者只能作反事实；预镜像至少 87 份（76 份同型 40MB），51 是旧快照。至少一项真实 124 才可判 AC9 通过，否则 partial。
- **来源**：用户 2026-11-02；`quality/evidence/2026-11-02-004-long-running-governance-decision.md`；C06 计划提交 `0a3254ba`。

## D-034 — 2026-11-02 明确查询按钮（补记）

- **做什么**：业务日志筛选区采用“明确查询”模型：时间、对象、结果、关键词、事件类型、动作先形成草稿，点“查询”后才更新列表、计数、空态和错误摘要；非法草稿保留上次有效查询，不静默替换。
- **不做什么**：不改后端/API/设计系统；不把草稿模型扩大到无关页面；不删除时间筛选之外的原筛选能力。
- **与旧决定关系**：本决定补充 D-018 的交互范围；D-018 的“不重构整个筛选区”仍约束不新增组件库、不改后端，但查询应用模型以本决定为准。
- **来源**：用户 2026-11-01/02 明确选择“明确查询按钮”；`quality/evidence/2026-11-02-003-design-review-query-disposition.md`；原型 QA `2026-11-02-015`。
- **流程缺陷**：该选择应在 make-decision 收敛；本次在 build-plan 补记，后续按 D-035。

## D-035 — 2026-11-02 执行策略在 make-decision 收敛

- **做什么**：任务形状（AC/模块/数据量/最长测试/外部输入）、测试数据 S/M/L、测试选择、事件等待、证据指针、检查点和可并行测试面，在 make-decision 形成用户可读的执行策略并取得真实答复；build-plan 只消费和核对，不再重新规划。
- **不做什么**：不新增 stage、gate、第二状态机或独立技能；不把执行策略写成固定数值机器门；不降低 AC/全量数据验收。
- **缺项处置**：make-decision 缺执行策略时不得收口；build-plan 发现缺失时回 make-decision 补，不在 build-plan 重开方向或自行补默认值。
- **来源**：用户 2026-11-02；`quality/evidence/2026-11-02-004-long-running-governance-decision.md`；`quality/evidence/2026-11-02-long-running-task-design.md`。
