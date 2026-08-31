# Decision Log — workflowhub / ui-e2e-delivery-contract-20260830

> 阶段：make-decision（已确认：17 个决策点与 Q11 宪法条文复核均已完成）
> 本文件是决策索引：每条决策给方向、理由、后果与风险；页面/接口/任务/测试细节由下游材料展开，不在此复制。

## 原始需求

（用户原话语义整理，完整原文见 Talk 记录与审查包）

1. UI 型需求全流程契约：make-decision 与用户讨论交互细节/交互流程/页面范围/数据状态/成功失败边界/非目标/延期项；build-spec 基于 Design.md 与 Experience.md 规范 + 既有前端组件生成高保真页面设计原型给用户确认（太难看时经用户同意可切换「设计提示词包」）；build-plan 前端实现单独成 task + 验收测试 task；build-code 真实起前后端端口调试测试并留痕，不能只做文本/代码测试。
2. 非 UI 需求同样必须有最终端到端验收测试 task；验收标准在 make-decision 定好，build-spec 细化验收任务设计，build-plan 建立 E2E 测试 task。
3. 端到端验收须真实环境 + 真实数据，禁止空环境空模拟；页面/操作/交互验收必须高质量。
4. 执行文件（qa-artifacts/tasks/evidence/quality 等）不得生成在项目仓库根目录、不得随任务提交进主分支；应落任务追踪文件夹；查明原因并改进。
5. Talk 用大白话说明选项/后果/风险；decision-log 记录原始需求/关键事实/选择/理由/延期交接。
6. make-decision 是 WorkflowHub 最重要阶段：目标/范围/方案/验收必须经 Talk/Grill/审查彻底收敛，未收敛继续谈，不可偷懒遗漏；后面四阶段几乎全自动，必须在此把需求定义清楚。
7. 方案必须检查是否违反 WorkflowHub 宪法。

| Requirement | Dimension | Decision | Disposition |
|---|---|---|---|
| R-001 交付目标与结果 | goal | D2、D13 | covered |
| R-002 用户流程与范围 | flow_or_surface | D3、D6 | covered |
| R-003 数据与状态 | data_or_state | D7、D8 | covered |
| R-004 成功失败边界 | success_failure_acceptance | D9、D13 | covered |
| R-005 非目标与延期 | constraint_non_goal_defer | D14 | covered |

## 核心需求

让 WorkflowHub 对 UI/交付验收契约负责：设计可见、端到端真实执行、证据进入任务存储，close 保留缺口而不漂白完成状态。

## 核心目标

用户已确认用五阶段契约把需求收敛、设计确认、计划验收、真实运行和证据归属串起来，并让缺失事实保持 `incomplete`/`unavailable`。

## 已选方向

用户已确认复用现有契约与技能，补上 UI 判定、四维收敛、证据发布、E2E 分档和 close 完整性事实；不新增公共阶段或命令。

## 收敛检查

| 维度 | 用户答案 | 事实/材料引用 | 可执行验收 |
|---|---|---|---|
| 目标 | 用户已确认：五阶段必须真实负责交付结果，没有事实不得宣称完成。 | D2、D13、decision-log.md | 场景：四场景 dogfooding；数据来源：任务存储事实；通过：四场景均有可复核事实；失败：任一事实没有记录则保持 incomplete。 |
| 范围 | 用户已确认：覆盖 WorkflowHub 契约、handler、证据发布、close 和本任务流程级验收；不改存量项目。 | D6、D10、D11、D14、decision-log.md | 场景：执行五阶段并检查侧车；数据来源：worktree 与任务存储；通过：范围内路径生效且无根目录产物；失败：越界改动或证据未落任务存储。 |
| 方案 | 用户已确认：采用完成判据与事实记录，不设推进阻断门。取舍：优先真实证据和可追溯性；被拒方案：执行者自证通过、仅靠 .gitignore、把 E2E 做成新公共 gate；无未决项。 | D8、D9、D11、D15、decision-log.md | 场景：缺证据、provider unavailable、侧车写入；数据来源：stage outcome、review 和 close facts；通过：如实记录缺口；失败：静默降级或伪造通过。 |
| 验收 | 用户已确认：D13 四场景作为本任务验收，回归测试必须保留。 | D13、成功/失败边界、decision-log.md | 场景：契约生效、证据落位与拦截、非 UI 验收底线、回归；数据来源：真实命令、测试输出、任务存储；通过：每场景事实可复核；失败：任一场景失败或证据不可绑定。 |

## 非目标

本任务不新增阶段或公共命令，不集成外部设计工具，不清理存量产物，不重写 Git 历史，不新增双写记录。

## 风险与延期交接

provider 不可用、真实环境不可用或证据链不完整时保持 `unavailable`/`incomplete`；存量产物迁移、F19 补录、设计提示词包规范和 E2E 全量强制留给后续 owner=用户 的任务。

## 调研重点（关键事实）

- **F19 取证**：任务追踪目录 `.../tasks/f19-manual-yaml-editor/` 的 quality/tests 为空、facts.jsonl 0 字节、无 evidence；而 main 提交 `5566905`（51 文件）包含 `quality/evidence/f19-qa/`（8 截图 + CLOSE-REPORT）与 specs/f19 四份材料；CLOSE-REPORT 自称「未提交待用户 commit」，实际被手动提交。对照组 f14/frontend-ui-workflowhub 任务目录有 evidence+tests——F19 是唯一完全空样本。
- **系统性**：PaperBuilder main 已跟踪约 214 个历史产物文件（≥8 个任务的截图/证据/材料混在仓库根）；.gitignore 无质量目录排除；连 workflowhub 自己 main 也曾在 08-30 被人工清理 164 个根目录产物（「should live in the task store, not the repo」）。
- **机制**：官方入口（publishCanonicalRecord/capture-tests/review/stage-outcome）全部写任务存储；但不存在「worktree 截图/报告 → 任务存储」的发布通道；快照排除前缀含 evidence/、quality/ 但已提交字节会被 preserve 并入 main；qa-artifacts/、tasks/ 不在排除前缀内；cleanup 只删/还原侧车、不归档。
- **契约现状**：UI 条件路径已存在（UI applicability 三输入；build-spec UI Contract 含 display_before_reply+human_approved；build-code controlledBrowserQaFacts；verify-code design-alignment），但触发全依赖调用方自报 contract_facts，不传即静默 non_ui / return null；make-decision 完成条件无 ui_applicability；build-plan 校验无前端/E2E task；isolated-browser-qa 未接线（used_by_stages=[]）。
- **历史三轮**：quality-v1（定义未强制，未 close）；ui-frontend（建成技能/ADR，用户 D-030「无设计稿也可推进」+D-028/D-029 拒绝记录确认人/SHA，技能暂不接入）；executable-ui（纯函数接进 handler，触发仍靠自报）。三轮自身均五阶段未完成 + manual-risk-close。
- **宪法**：22 条（F1-F11/Q1-Q3/S1-S8）+ close 三义。与方案直接相关的：F5（gate 按需补）、F7 与 1.3.0 修订（确认仍只三处，build-spec 不新增日常确认）、F10（9.5 万行 gate 教训）、F11（控制面受限）、Q1/Q2（质量事实不作准入证、缺项不得宣称完成）、Q3（异源裁决禁止自审自判）、F3/F9（四材料推进、结构 fail-loud、不假绿）。

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": {
      "conclusion": "non_ui",
      "reason": "本任务交付的是 WorkflowHub workflow/runtime 契约与任务存储机制改造，不交付 WorkflowHub 产品页面、路由或交互。"
    },
    "project_inventory": {
      "conclusion": "non_ui",
      "reason": "D14 已记录 WorkflowHub 仓库自身无前端，故本任务不涉及其项目级前端变更。"
    },
    "planned_or_changed_frontend_fact": {
      "conclusion": "non_ui",
      "reason": "plan.md 的 UI Delivery Contract 已限定 workflowhub 无前端代码、当前为契约/机制改造；P6 的 PaperBuilder UI 演示是外部后续任务，不能作为本任务前端 consumer。"
    }
  }
}
```

## Talk（三轮问答矩阵：问题 → 用户选择 → 理由）

| 轮次 | 问题 | 用户选择 | 理由（简述） |
|---|---|---|---|
| R1-Q1 | UI 需求判定 | 自动判定 + 判不出（unknown）必须问用户 | 防静默降级；不增加每次任务的负担 |
| R1-Q2 | make-decision 讨论内容 | 四组问题全强制（交互流程/页面范围、数据状态、成功失败边界、非目标延期），答案进决策日志 | 页面细节在起点就定死，防后续加戏 |
| R1-Q3 | build-spec 设计产物 | 基于 Design.md/Experience.md + 现有组件直接生成**高保真原型**；太难看经用户同意改给提示词包 | 线框图不足以判断真实效果 |
| R1-Q4 | build-plan 任务结构 | UI 需求必有前后端相关 task；**所有任务**（含非 UI）必有最终端到端验收 task；验收标准 make-decision 定 | 交付必须满足最初验收标准；文本/代码测试不算端到端 |
| R1-Q5 | build-code 真实运行 | 强制真实环境 + **真实数据**，禁止空环境空模拟 | 高质量页面/交互验收的前提 |
| R1-Q6 | 产物落位 | 三管齐下：官方发布通道 + close 校验 + .gitignore 约定 | 单点防不住 |
| R1-Q7 | 存量产物 | 本次只修机制，不动存量（另任务处理） | 跨仓库动历史风险大 |
| R2-Q3-2 | 原型载体 | 真实组件渲染的原型页（浏览器截图+可预览） | 最贴最终效果 |
| R2-Q3-3 | 设计确认流程 | 迭代式，你满意为止；可主动切提示词包 | 真实设计协作 |
| R2-Q3-4 | 覆盖历史 D-030 | 确认覆盖：默认必须出原型确认；仅用户明确同意才降级；人工确认即可、不设硬门 | 与用户 08-30 新要求一致 |
| R2-Q4-2 | E2E 判据 | 分档判据表不豁免（浏览器级/服务级/流程级） | 防钻空子且不误伤 |
| R2-Q5-2 | 真实数据来源 | 现有真实数据 + build-plan 写明来源/样本/场景 | 用户不备数据，但强制证明真实 |
| R2-自验收 | 本任务验收标准 | 认可 4 场景 dogfooding | 真实命令/任务流验证 |
| R3-Q8-1 | 自检命令 | 只列出缺口，**不阻塞任务执行** | 尊重手工合并习惯 |
| R3-Q8-2 | 无设计规范项目 | 设计源盘点：有 Design.md/Experience.md 就用，没有就从现有页面/组件反推最小设计基线 | 不强制项目先补规范 |
| R3-Q8-3 | 范围修正 | **范围扩大**：make-decision 必须把目标/范围/方案/验收彻底收敛（未收敛继续 Talk/Grill），并检查宪法合规 | 后四阶段全自动，第一站不能偷懒 |
| R4-Q9 | 宪法 F7 处置（D5） | **A：修订宪法 F7**，登记「UI 型需求 build-spec 设计确认」为第四处限定确认（v1.7.0 同步版本/修订记录/映射/checklist） | 忠实「设计确认后才进 build-plan」时序；F11 曾有先例 |
| R4-Q10 | E2E 强制范围 | **分两阶段**：本次先强制 UI/全栈/高风险用户可见任务；其余任务（纯后端/纯材料）下一轮扩 | 采纳独立盲审建议（F5 按故障补检查、避免最小范围之外的成本） |

## Grill（挑战与自查）

- **用户监督**（R3）：make-decision 不只是四要素，而是「目标/范围/方案/验收四维全部经 Talk/Grill/审查收敛」；方案须过宪法检查。（接受，见 D2/D15）
- **宪法自查**（本 agent + 独立宪法提取子代理交叉）：
  - 兼容：F5（F19 是真实故障→补最小检查合规）；Q1/Q2（缺项不得宣称完成→完成判据而非推进门）；F9（侧车入快照=结构错误 fail-loud）；F3（四材料推进不变）。
  - 冲突 1（最高风险）：build-spec 设计确认 vs 宪法 F7/1.3.0「build-spec 不新增日常确认」→ **未决**：要么修订宪法（v1.7.0，登记第四处确认，限定 UI 需求），要么设计确认并入 build-plan 确认（时序改为「设计定稿随计划一次确认」）。待用户最终拍板（见 D5）。
  - 冲突 2：build-spec 产出「真实组件渲染原型页」是否触碰「build-spec 只细化同一份材料」边界（AGENTS.md）→ 倾向：原型页作为 build-spec 的**设计材料**（specs/<task>/ 内或 quality/evidence/design/ 内），不是实现代码；build-spec 不写产品代码。
  - 冲突 3：全任务强制 E2E vs F5/F10（不预设关卡）→ 以「分档判据表 + 完成判据 + 单点故障出事后补」落地，而不是堆自动化 gate 基建；E2E 是每个任务的 plan 结构要求 + build-code 完成事实，不新增 schema 炸弹。
  - 冲突 4（Q3）：执行 agent 自跑 E2E 只能产出**物理事实**（跑通/截图/日志），「是否满足验收标准」的**裁决**由独立审查（wh-review）与用户确认产出；不得由执行者自下 verdict。
- **独立方向建议审查（wh-review, make-decision/direction, provider=codex/luna）**：`/tmp/direction-review-input.json`（blind: 原始需求+客观事实+硬约束+非目标）。结果见 D15 与「审查事实」节。

## 核心决策（D*）

### D1 UI 需求判定：三输入自动合并 + unknown 必问用户
- **问题**：系统如何判定「这需求碰不碰界面」，决定后续所有 UI 要求是否触发？
- **最终选项**：沿用三输入（原始需求 / 项目前端清单 / 计划或已变前端事实）合并出 ui/non_ui/unknown；unknown 与可信证据冲突时，make-decision 必须停下问用户，不得默认为 non_ui。
- **推荐**：是（推荐项已被选）。**选择与理由**：不增加常态负担（有证据自动判），只堵住「判不出就静默降级」的洞。
- **事实与约束**：F19 即静默降级实例；现有契约本有三输入合并逻辑但无消费强制。
- **影响**：make-decision 增加一项 completion 事实（ui_applicability 非 unknown / 或用户裁决记录）。
- **后果与风险**：用户偶被多问一句；若三输入全缺仍会 unknown → 必问，杜绝静默。
- **被拒**：每次任务手动声明（费用户事）；维持现状（F19 重演）。
- **Supersedes**：none（新增强化现有条件路径的强制消费）。

### D2 make-decision 收束强化：目标/范围/方案/验收四维收敛检查
- **问题**：make-decision 如何保证「想清楚了才放行」，而不是四要素走过场？
- **最终选项**：make-decision 完成判据新增「四维收敛」检查——①目标（业务目标与用户结果）②范围（页面/流程/功能边界、波及面）③方案（方向+取舍+被拒方案+未决项）④验收（可执行验收标准：场景/数据来源/过了怎么算/失败了怎么算）；任一项未收敛（缺 Talk 答案、缺用户确认、缺事实依据、验收不可验证）→ 保持 in_progress，**继续 Talk/Grill/审查**，不进入 build-spec。
- **推荐**：是。**理由**：用户明确「后四阶段几乎全自动，第一站不能偷懒」；现有 analyzeDecisionConvergence 只查矩阵存在与段落非空，语义层不足。
- **事实与约束**：宪法 Q1/Q2——收敛检查是「完成判据」不是「推进准入」（四材料可读仍可推进）；F4——不设 review pass gate。
- **影响**：make-decision 判定逻辑扩展（handler/contract 层）；决策日志成为下游唯一的「事实裁决来源」；build-spec 不得补需求/发明方向（已有 validateSpecClarifyAndDirectionFidelity）。
- **后果与风险**：make-decision 变重（Talk/审查增多）→ 正是用户要的取舍；风险：收敛标准过主观 → 用「可验证判据」落地（每维必须能引用到具体材料/事实/答案）。
- **被拒**：只保持现有五维矩阵（内容不校验）；把收敛挪到 build-spec 补（用户明确禁止）。
- **Supersedes**：delivery-flow-quality-v1 的 FR-PREP-001/D-011「方向完成条件」的文档层定义（本轮给运行时落地）；executable-ui 的 D-011 同名清单。

### D3 build-spec 高保真原型：基于规范文件与既有组件，真实组件渲染
- **问题**：UI 需求的设计产物做成什么形式、给谁看、怎么确认？
- **最终选项**：UI 需求 build-spec 必产出**高保真原型**——基于 Design.md/Experience.md（无则先设计源盘点反推，见 D4）+ 既有前端组件与设计 token，生成真实组件渲染的原型页；以浏览器截图 + 可交互预览呈现给用户；迭代到用户满意或用户主动同意切换。
- **推荐**：是。**理由**：线框图无法判断真实效果；用户 08-30 明确「直接生成高保真页面设计原型」。
- **事实与约束**：现有 UI Contract 契约字段（page_or_region/interaction flow/visible labels/state matrix/preview refs）可复用；display_before_reply + human_approved 已有但仅条件触发；宪法无「build-spec 不写实现代码」明文，但 AGENTS.md 阶段边界要求原型作为**设计材料**而非产品代码（见 Grill 冲突 2）。
- **影响**：build-spec 增加设计盘点与原型生成工作；原型材料落位 specs/<task>/ 或 quality/evidence/design/；build-spec 完成判据增加「用户确认事实」（处理方式见 D5）。
- **后果与风险**：设计成本上升（生成+迭代）；风险：原型复用现有组件依赖项目脚手架 → 技能层实现（S7/S8），不做核心逻辑。
- **被拒**：静态设计稿图（不基于组件）；build-code 阶段才设计（用户否决：太晚）。
- **Supersedes**：ui-frontend-delivery-contract D-030（「没有设计稿也可以推进」）——经用户 R2-Q3-4 确认覆盖；保留其「人工确认即可、不设硬门」精神。

### D4 设计源盘点：有规范用规范，无规范从现有页面/组件反推
- **问题**：高保真原型依赖 Design.md/Experience.md，但仅 PaperBuilder 有；其他 UI 项目怎么办？
- **最终选项**：UI 需求进 build-spec 先做设计源盘点：①有规范文件 → 直接作为设计权威；②无 → 从现有页面/组件/文案反推最小设计基线（设计 token、组件清单、交互要点），经用户确认后作为设计权威。
- **推荐**：是。**理由**：不强制项目补规范（成本），但保证「设计有依据而非凭空发挥」；已有 design-source-readiness 技能可扩展。
- **影响**：build-spec UI 路径增加「设计源盘点」前置步骤；设计权威版本绑定进 UI Contract。
- **后果与风险**：反推基线可能与用户审美不符 → 迭代+用户确认兜底。
- **被拒**：硬要求先补规范（前期成本大）；只支持已规范项目（新项目体验差）。

### D5 build-spec 设计确认时序：修订宪法 F7（已决，A）
- **问题**：宪法 F7 与 1.3.0 修订记录明确「正常业务确认仍只保留 make-decision/build-plan/verify-code 三处；build-spec、build-code 不新增日常确认」，而用户要求 build-spec 阶段设计确认（确认后才进 build-plan）。
- **最终选项（用户 R4-Q9 拍板）**：**修订宪法 F7**——把「UI 型需求（ui_applicability=ui）在 build-spec 阶段的设计确认」登记为**第四处限定确认**（仅 UI 需求触发，不扩大为普通确认）；同步宪法版本 v1.7.0、修订记录、旧条目映射与 constitution-checklist（条目数仍 22；F7 条文同步修改）。宪法修订文本属本任务交付物，由 build-spec 设计、build-code 实施，最终宪法文本须附用户确认（宪法变更可追溯要求）。
- **推荐**：是（用户选择与推荐一致）。**理由**：忠实「设计确认后才进 build-plan」时序；F11 的先例证明该变更路径可行。
- **事实与约束**：宪法变更规则（CONSTITUTION.md 治理节）：版本号/修订记录/映射/checklist 条目数须同步；变更须追溯回需求权威源（本决策即权威源）。
- **影响**：本任务交付物包含 CONSTITUTION.md v1.7.0 修订；build-spec 设计确认成为正式第四处确认（owner=build-spec，触发条件=ui_applicability=ui，确认人=用户）。
- **后果与风险**：宪法版本升级影响所有下游任务（向后兼容：非 UI 任务无感知）；若宪法修订被拒（用户后续反悔），设计确认退回 B 路径（并入 build-plan 确认）——保留为备选，记录被拒方案 B/C 及理由。
- **被拒**：B（并入 build-plan 确认——时序后移）；C（挪进 make-decision 确认——设计稿尚未产出，时序矛盾）。
- **Supersedes**：1.3.0 修订记录中「build-spec、build-code 不新增日常确认」的适用范围（限定 UI 设计确认除外，其余不变）。

### D6 build-plan 强制 task 结构：E2E 验收 task（本次范围：UI/全栈/高风险用户可见）+ 前端实现 task（UI 需求）
- **问题**：plan/tasks 如何保证「有验收、有实现、验收对得上最初标准」？
- **最终选项（R1-Q4 + R4-Q10 合并）**：①**本次强制范围**：UI/全栈/高风险用户可见任务的 plan 必须含至少一个**端到端验收测试 task**（通常为最后 phase 的最终 task），其 gate/验收场景引用 make-decision 验收标准与 spec AC；②UI 需求另强制**前端实现 task**（与后端 task 分开）；③所有 task 必须写明**验收数据来源/样本/场景**（无豁免）；④**纯后端/纯材料任务本次**：要求「验收测试 task + 验收场景引用」按档轻化（流程级/服务级深度），E2E 全量强制列入延期交接（下一轮）。
- **推荐**：是（用户按盲审建议选择分两阶段）。**理由**：F5 按故障补检查；避免简单任务成本失控；同时「不豁免验收测试」底线保留。
- **事实与约束**：现有 validatePlanTaskContract/validateExecutablePlanTaskMinimum 无 UI/E2E 检查；盲审 F-1/F-7 建议分层；用户 R1-Q4 原「所有任务强制 E2E」被本决策**部分 supersede**（保留：全部任务须有验收测试；调整：E2E 全量强制=延期）。
- **影响**：plan 校验扩展；tasks.md 模板约定；make-decision 验收标准成为 plan 引用源；延期交接项新增（见 D14）。
- **后果与风险**：过渡期纯后端任务可能只有单元/集成级验证（用户知情接受）；风险：分档判据判定错误 → 用户确认兜底。
- **被拒**：仅 UI 需求强制（用户否决）；验收挪到 verify-code 补（太晚）。
- **Supersedes**：本任务早先 Talk 的「所有任务强制 E2E」表述（部分：验收测试底线保留，E2E 全量强制延期）。

### D7 E2E 验收分档判据表（不豁免，深度按档）
- **问题**：不同类型任务的「真实环境+真实数据」怎么定义才可判、可防钻空子？
- **最终选项**：三档判据表：①UI/全栈 = 真浏览器 + 真实数据走完整用户流程 + 截图/日志；②纯后端（高风险） = 真实服务 + 真实数据走真实调用链；③纯材料/文档/流程类 = 真实命令/工具链执行验证（计划中定义该档判据；本任务即此档）。本次强制范围=①+②+用户可见高风险任务；③档作为所有任务的「验收测试」最低深度。（与 R4-Q10 分两阶段对齐：本次不做全量强制的任务按其档位做到验收测试深度。）
- **推荐**：是。**理由**：分档可判、不豁免；盲审 F-7 支持（无前端项目用流程级 oracle）。
- **影响**：验收标准模板带档位声明；build-code 按档执行 E2E 并发布证据。
- **后果与风险**：实现工作量控制在技能/文档层；档位判定错误由用户确认兜底。
- **被拒**：统一一句话原则；允许种子上模拟（用户明确禁止）。

### D8 build-code 真实运行 + 真实数据 + 证据发布（不静默）
- **问题**：build-code 如何保证真的跑了、用真数据、证据在任务存储？
- **最终选项**：①按档位强制真实运行（起真实前后端/服务、真实数据）；②不再静默——缺 UI 契约/组件质量图/浏览器 adapter/证据时，产出显式 missing_items 事实（而非 return null / not_applicable 默认）；③运行证据（截图/日志/报告）通过**证据发布通道**写入任务存储 quality/evidence/…，并作为 build-code 完成判据的事实来源。
- **推荐**：是。**理由**：调查显示静默降级是 F19 的直接渠道；证据进任务存储是 close 校验的前提。
- **事实与约束**：宪法 Q3——运行证据=物理事实（可自采）；「验收通过」裁决=独立审查+用户确认；screenshot_refs 已有 quality/evidence/browser-qa/* 约定。
- **影响**：build-code handler 校验增强；新增「证据发布」私有能力（见 D10）。
- **后果与风险**：环境起不来时如实记录 unavailable（宪法 F9）——任务可继续修但不宣称完成；绝不伪造截图。
- **被拒**：维持 may invoke；允许无环境降级（用户明确要求真实运行）。

### D9 验收裁决独立性（宪法 Q3）
- **问题**：E2E 验收「通过/不通过」由谁裁定？
- **最终选项**：执行者采集物理事实（跑通、截图、日志、数据来源）；「满足最初验收标准」的裁决由独立审查（wh-review 验收 lens）+ 用户确认产出；执行者自报通过不能作为完成依据。
- **推荐**：是。**理由**：宪法禁止自审自判且是用户「F19 没让我验收」问题的根治点。
- **影响**：verify-code 完成判据增加「E2E 事实 + 独立审查/用户确认」两层；wh-review 的 verify-code/集成面需消费 E2E 材料。
- **后果与风险**：多一次审查成本；provider unavailable 时如实留痕（not 当作通过）。
- **被拒**：执行者自证通过（违宪）。

### D10 证据发布通道：worktree → 任务存储（唯一 canonic，登记四问）
- **问题**：worktree 中产生的截图/日志/报告如何进入任务存储（且不双写）？
- **最终选项**：新增/扩展现有「证据发布」能力：从 worktree 材料（quality/evidence/…、qa 产物）经 TaskHandle 发布到任务存储 quality/evidence/…（复用现有 kernel publishCanonicalRecord 单写机制）；发布前登记：唯一 consumer（build-code/verify-code 完成判据与 close 校验）、owner（build-code）、替代关系（取代「直接写 worktree 并提交」的旧做法）、删除条件（任务关闭后随任务存储归档/保留策略）。
- **推荐**：是。**理由**：全工程无此通道是 F19 证据脱轨的机制缺口。
- **事实与约束**：C:172 新增控制面四问；禁双写（worktree 副本仅临时，close cleanup 已有删除逻辑）；不新增公共命令 → 走 stage-runtime 内部能力/技能步骤。
- **影响**：构建证据发布实现+登记；close 校验该通道是否被正确使用。
- **后果与风险**：实现成本；发布失败保持 unavailable 不伪造。
- **被拒**：仅靠 .gitignore（证据仍不进任务存储）；close 时从 worktree 拾取搬运（双写风险）。

### D11 close 收紧：完成判据 + 侧车拦截 + 自检不阻塞
- **问题**：close 如何既「缺事实不宣称完成」又不「卡死用户手工流程」？
- **最终选项**：①close 交付动作集：快照/任务分支含执行侧车路径（quality/evidence、qa-artifacts、evidence、tasks 骨架等）→ 结构错误 fail-loud（F9），不作为质量结论；②质量记录归档：任务存储缺 E2E 事实/AC 覆盖/阶段完成事实 → close 状态输出「缺口清单」，保持 incomplete/未知，不得漂白为正常完成；用户可在明确承接受限事实后走 manual-risk-close（必须列具体缺失 + 用户明确授权，替代现状「只要 user-requested 即可」）；④自检命令（复用 status/现有入口）只列缺口，**不阻塞任务执行**；⑤close 的不可逆动作仍独立 authorize（F7），证据齐备也不自动触发交付动作集。
- **推荐**：是。**理由**：用户 Q6 三管齐下 + Q8-1「自检只列不拦」；宪法 close 三义（交付/收口/归档）分开，质量结论不混入物理交付记录。
- **事实与约束**：CLOSE-Q1「close 不把质量通过作为前提，质量判定保留在 verify-code/quality facts」→ 因此「拦截」实为「归档完整性事实 + 结构校验」；manual-risk-close 现状过宽（历史三轮 5 阶段 unbound 也 close）。
- **影响**：task-close 逻辑增强（结构校验 + 缺口清单输出）；status 自检输出扩展。
- **后果与风险**：用户主动选择承担风险时仍可 close（保留弹性）；结构侧车拦截可能拦到「合法提交的设计材料」（如 specs/ 下材料不在排除之列，不受影响）。
- **被拒**：把质量和侧车做成机器硬 gate 拦死一切 close（违 F11/CLOSE-Q1）；只加 .gitignore（堵不住已提交字节）。

### D12 项目仓库 .gitignore 约定（模板层）
- **问题**：如何防未来任务项目仓库再次把质量目录提交进 main？
- **最终选项**：为下游项目（PaperBuilder 类）提供标准 .gitignore 片段约定（排除 quality/、qa-artifacts/、evidence/、tasks/<任务骨架>/ 等执行侧车），随任务创建/文档给出；存量仓库本次不动（另任务处理）。登记 consumer（任务项目仓库）、owner（workflowhub 文档/模板）、替代（close 校验之外的第二防线）、删除条件（close 校验完全可靠后可移除）。
- **推荐**：是。**理由**：三层防线（发布通道/close 校验/仓库忽略）用户已选三管齐下。
- **影响**：新增约定文档 + 任务创建提示；不改任何既存仓库文件（存量 Q7 不动）。
- **后果与风险**：约定能力依赖项目方执行；如果项目 .gitignore 含白名单会失效 → close 校验兜底。
- **被拒**：本次直接改 PaperBuilder .gitignore（Q7 用户拒绝动存量）。

### D13 本任务验收标准（dogfooding，4 场景）
- **问题**：本次改进本身怎么验收（这是对「make-decision 定验收标准」的直接实践）？
- **最终选项**：（用户已认可）①**契约生效**：用新代码真实创建最小 UI 型任务（以 PaperBuilder 或现成项目为例），从 make-decision 跑到 build-code，验证：UI 判定触发+unknown 必问、四维收敛检查拦截、build-spec 高保真原型+确认事实、build-plan 前端 task+E2E task 被强制、build-code 真实环境+真实数据+证据进任务存储；②**证据落位与拦截**：任务运行后任务目录出现 evidence；故意把侧车文件写入任务分支验证 close 结构校验生效；正常 close 五步（commit/merge/archive/push/cleanup）跑通；③**非 UI 验收底线**：一个普通后端/非 UI 任务 plan 缺「验收测试 task + 验收场景引用」时校验必失败（E2E 全量强制属延期项，不在本场景断言全量）；④**回归**：全部既有契约测试（含 18 个 UI 契约测试）与核心测试不破。
- **推荐**：是。**理由**：真实故障场景验证，不造假。
- **影响**：build-plan 将包含这些场景的 task 设计（流程级档：真实命令 + 任务存储真实数据）。
- **后果与风险**：场景①需要真实创建任务（会在 Knowledge 存储留下测试任务痕迹 → 用独立任务名+完成后标记/归档，或复用临时项目）；严格遵守「不在主仓库改代码/跑测试」的纪律。
- **被拒**：只验收①②（覆盖不全）；本任务豁免（等于没验收）。

### D14 非目标与延期交接
**非目标**（用户确认）：不新增阶段/公共命令（自检走现有 status 类入口）；不集成外部设计工具（Figma 等，提示词包为文本交付）；不做证据 SHA 硬校验（沿用 D-029 轻量原则：可复核引用+独立审查抽查）；不清理存量产物、不重写 git 历史；不新增「双写」记录。
**延期交接**：①PaperBuilder 存量 214 个产物文件清理/迁移（另开任务或用户手工）；②F19 证据补录任务追踪目录（如用户需要，另开小任务）；③WorkflowHub 仓库自身无前端故本任务不涉及项目级 .gitignore 变更；④「设计提示词包」模板的质量标准（如用户后续高频使用再补充）；⑤**E2E 全量强制**（纯后端/纯材料任务的端到端验收升级）——下一轮工作项，观察首批全栈任务模板效果后由用户决定扩面（owner=用户）。

### D15 宪法合规小结与独立审查事实
- **宪法对照结论**：方案落地形态为「完成判据 + 结构事实 + 归档完整性 + 独立授权」，非「推进阻断门」；F19 真实故障对应 F5 的最小检查；Q1/Q2/Q3/F3/F9 全部兼容；唯一直接冲突为 build-spec 设计确认（D5，待定）；新增能力（原型生成、设计源盘点、证据发布、E2E 判据）全部下沉技能层/内部能力并登记四问，不新增公共命令。
- **独立方向建议审查（wh-review direction，盲审，participants: kimi/coding + grok/grok 完成，codex/luna 因 SAME_SOURCE 被拒）**：blind 审查「原始需求+客观事实+硬约束+非目标」（未含任何方案），仅审问题定义与约束矛盾。8 条 findings 及处置：

| Finding | 来源 | 内容 | 处置 |
|---|---|---|---|
| F-1 major | kimi | 把 F19 单 UI 故障泛化为所有任务 E2E，超出最小范围，碰 F10/F5 | 用户 R1-Q4 显式要求「所有任务」；接受为已承担风险；以 D7 分档判据表控制深度（每档有 oracle），build-plan 分两条工作线（证据机制线先行） |
| F-2 major | kimi | build-spec 确认 vs F7 未决不该留给下游 | 采纳：D5 必须在本阶段结束前由用户拍板，否则不进入 build-spec |
| F-3 major | kimi | 产物落位要求缺机制映射 | 已解决：D10 证据发布通道 + D11 close 校验即机制落地（blind 未见方案） |
| F-4 blocking | grok | 约束集自相矛盾（方向集为空）；须先解决 4a/4b/4c；UI 确认三选一；E2E 作验收标准而非新 gate | 采纳：4a=D5（用户拍板）；4b=原型作为设计材料（非产品代码）；4c=D7 分档 + E2E 作为完成判据（非推进门）——三项均在 D 条目解决，不留下游 |
| F-5 major | grok | 产物落位与 UI 契约是两件事，建议拆交付、A 先行 | 部分采纳：用户确认一次交付；build-plan 按「证据机制线（先行）→ UI/E2E 契约线（依赖前者）」分层设计 |
| F-6 major | grok | ui_applicability 应为 make-decision 完成条件；unknown 继续 Talk/Grill | 与 D1/D2 一致，已覆盖 |
| F-7 major | grok | 全任务 E2E 对无前端/CLI 项目无 oracle，会假绿或卡死 | 与 D7 一致：流程级档=真实命令/工具链+真实任务存储验证；本任务验收即该档（D13） |
| F-8 minor | grok | 待决问题应给命名选项+后果+被拒方案 | 采纳：最终确认卡给出 A/B 选项与后果（本轮履行） |

- **审查事实**：transport 2/3 完成、1 失败（codex/luna SAME_SOURCE，宿主与 provider 同源被拒——如实记录，不重审、不伪造）；findings 无 pass/不 pass 概念（advice-only，F4）；全部 8 条处置如上，未改变任何用户已选决策，未新增方案。
- **执行边界**：本任务全部改动在认证 worktree `/Users/Hugh/Hugh/Project/workflowhub-ui-e2e-delivery-contract-20260830` 内完成；主仓库只读；提交/合并/推送等不可逆操作等待后续独立授权（F7）。

### D16 当前任务范围收敛（2026-08-31）
- **问题**：D13 把本任务的本地机制验收与 PaperBuilder 外部 UI 浏览器 dogfood 绑成一条完成链，导致非 UI 的 WorkflowHub 任务被外部仓库、浏览器、用户确认和异源 reviewer 身份拖住。
- **最终选项**：保留 D13 作为历史验收设计事实；当前任务只执行 WorkflowHub 本地 S2（close/证据）、S3（非 UI 验收 task 底线）、S4（聚焦回归）。S1（PaperBuilder 原型/浏览器/独立身份/verify-code）拆为独立后续 UI 任务，不再是当前任务完成依赖。
- **边界**：本次不启动 DSH Desktop，不创建或修改 PaperBuilder 任务，不要求外部 provider 或执行者身份绑定；UI 任务自身的身份、冻结材料和独立审查契约仍保留，由后续真实 UI 任务验证。
- **理由**：符合 F4/F6/F11 的 anti-gate 边界；质量事实 unavailable/incomplete 只降低质量结论，不阻塞同任务修复和本地验收。
- **处置**：D13 的 S1 仅在当前任务中标记 deferred，D13 原文与历史 RED 证据保留；当前成功边界改为 S2-S4 真实事实齐全，S1 另行跟踪。

## 成功/失败边界（本任务验收标准）

- **成功**：D16 当前范围的 S2-S4 全部有真实事实；决策日志/规格/计划/任务四材料真实反映本决策；close 时（若走到）交付动作集干净（无侧车、无质量结论漂白）。
- **失败（不可宣称完成的情况）**：S2-S4 任一场景失败或被伪造；证据未发布任务存储；D5 未决未定。S1 缺失只表示外部后续任务 deferred，不得改写为当前任务通过。
- **部分成功/风险承担**：①D5 若用户选 B（并入 build-plan 确认），build-spec 审批时序按 B 记录；②若方向/细节审查 provider unavailable，如实记录不伪造；③外部 S1 后续任务若受宿主限制（非 Codex 无 session 绑定），由该后续任务记录 unavailable，不回写当前任务结论。

## 风险与处置

| 风险 | 影响 | 处置 |
|---|---|---|
| 执行者「凑证据」/伪造截图 | 验收失真 | 独立审查抽查 + 用户确认 + 真实数据来源可复核 + 宪法 Q3 裁决分离 |
| 契约收紧导致简单任务流程变重 | 成本上升 | 分两阶段（R4-Q10）：本次只强制 UI/全栈/高风险任务；分档判据表控制深度；F5 原则只补真实故障对应检查 |
| 宪法修订文本争议 | build-spec 时序依赖 | F7 修订原则已由用户拍板（A）；最终条文在 build-spec 定稿时交用户确认后实施 |
| wh-review provider 不可用 | 审查事实缺失 | 如实 unavailable 留痕，不伪造；方向/细节建议为 advice-only 不阻断（本轮 direction 已有 2/3 provider 完成） |
| 本任务 dogfooding 在任务存储留测试痕迹 | 存储污染 | 用独立临时项目/任务名，完成后标记或清理（不可逆操作前征求授权） |
| build-spec 原型页被当作实现代码提交 | 阶段边界被破坏 | 原型页作为设计材料放 specs/<task>/（或 quality/evidence/design/），不进 src/ |

## 延期交接（Deferred Handoff）

- 存量产物清理/迁移：**owner=用户**（另任务或手工），本次不做。
- F19 证据补录任务目录：**owner=用户**（需要则另开任务）。
- 证据 SHA 硬校验：不采用（D-029 精神保留）；未来若发现伪造频发，由用户决策是否加（F5 出事再补）。
- 完整设计提示词包规范：延期（高频使用后再补）。

## 用户最终确认（R4 完成后）

- 决策条目 D1-D15 全部收敛；D16 为当前任务验收范围修正，不新增产品方向；用户确认点：R1-Q1..Q7、R2-Q3-2..自验收、R3-Q8-1..Q8-3、R4-Q9（A：修订宪法 F7）、R4-Q10（分两阶段）——共 17 个产品决策点全部有真实答复（见 Talk 矩阵）。
- 用户最终确认状态：**已确认原则；宪法 F7 修订条文文本已于 build-plan 确认时（Q11）随计划一并复核通过**，T009 按该文本落字。
- Supersedes 汇总：D-030（ui-frontend-delivery-contract 2026-08-22「没有设计稿也可以推进，人工确认即可」）→ 被 D3 覆盖；1.3.0「build-spec 不新增日常确认」适用范围 → 被 D5 限定修正（UI 设计确认除外）；D-011/FR-PREP-001 文档层定义 → 被 D2 运行时落地；本任务早先「所有任务强制 E2E」→ 被 D6 部分覆盖（验收测试底线保留、E2E 全量强制延期）。

## 大白话总结卡（Stage-end Summary 草案）

- **核心需求**：让 WorkflowHub 对「涉及界面的需求」和「任务交付验收」真正负责——设计要给你看、端到端要真跑、证据要进任务追踪目录、close 要拦住漏网。
- **核心目标**：五阶段契约 + 机制改造，保证「最初想清楚（make-decision 收敛）→ 设计看得见（build-spec 高保真原型）→ 计划有验收（build-plan E2E task）→ 运行是真的（build-code 真实环境+真实数据）→ 证据有归属（任务存储）+ close 有底线（归档完整+结构干净）」。
- **选定方向**：复用已存在的 UI 契约纯函数与技能，把「条件触发+静默降级」改为「UI 判定必问 + 完成判据强制 + 证据发布通道 + close 结构校验/归档完整性 + 自检只列不拦」；全部以「完成判据与事实记录」形态落地，不设推进阻断门、不新增公共命令、不堆自动化基建。
- **范围**：五阶段契约与handler/校验（含因 D5 新增的**宪法 F7 v1.7.0 修订**）、证据发布通道、close 机制、设计源盘点与高保真原型技能、E2E 分档判据表（本次强制 UI/全栈/高风险任务，其余为延期）、项目 .gitignore 约定、测试与回归；本任务 P6 只执行本地 S2-S4，外部 S1 deferred；**不含**：存量清理/外部设计工具/哈希硬门/重写历史。
- **非目标**：如上；**风险**：执行者凑证据（独立审查+用户确认兜底）；**未决项**：无重大未决（宪法 F7 最终条文文本在 build-spec 复核）；**延期**：存量、F19 补录、提示词包规范、纯后端/纯材料任务 E2E 全量强制。
