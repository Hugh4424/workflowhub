# 功能规格：设计源提炼与实现交接（C04）

> 本规格消费 `decision-log.md`（D-001～D-013、R-001～R-023、U-001～U-013）与母规划 C04 卡，写全局实现设计与唯一验收判据。各 Phase 只写自身增量，不复制本节。

## 速读卡（30 秒）

- **要解决的问题**：现在把设计稿还原成代码靠人眼和猜测，提炼结果没有正式位置、没有消费者；新项目每次从零开始。
- **交付什么**：一套可搬运的提炼方法标准（八类规范为尺子、五维采集、四态判定）、一个能跑的最小采集器、浏览器入口的引擎选择改造、三页真实采集与覆盖统计、一处真实还原的消费闭环、三阶段接线与登记。
- **凭什么算成**：8 条 AC 在 Appendix A；每条有可重放命令与证据路径。
- **本次不做**：数值评分、人读表格、万能采集器、全库整理、第二套浏览器入口、静默升级外部工具。

## 来源与决策映射

| 来源 | 用途 |
| --- | --- |
| `specs/workflowhub-ui-frontend-c04-design-source-extraction-20261025/decision-log.md` | 方向、13 条决定、8 条 AC、13 条未决项；本规格与 phases 的唯一需求来源 |
| 母规划 `specs/workflowhub-ui-frontend-release-20261020/prd.md:259-278`、`:120-155` | C04 卡 6 FR / 5 AC、S5 五类输入与严重度、S6 覆盖与返工口径 |
| `quality/evidence/decision-log-refs/requirement-index.md` | 逐字答复与 R/U 索引（本任务库） |
| `quality/evidence/decision-log-refs/coverage-matrix-5d.md` | R/U 落点与缺口 |
| `quality/reviews/2026-10-25-005`、`009` | 方向与细节审查发现及处置 |
| `skills/project-norm-init/SKILL.md`（C02 交付，main `bd207d35`） | 「规范职责」与「非UI规范与索引」：本任务的适用类、路径、owner/consumer |
| `specs/acceptance/acceptance.md`、`evidence.md`、`done.md` | 验收判据形态、证据与完成规则 |
| `specs/api/contract.md`、`specs/backend/architecture.md` | 新脚本参数/错误语义与运行时边界的适用源（不适用写理由） |

### 决策覆盖（D-001～D-013 逐条落点）

| 决定 | 本规格落点 |
| --- | --- |
| D-001 复杂五阶段 | 本文件 + phases/P1～P7 全程 |
| D-002 方法标准+最小采集器 | 目标、模块划分、FR-EXTRACT-001/005 |
| D-003 可运行页面为主、截图辅助 | 目标、PFACT-03/06、FR-EXTRACT-005 |
| D-004 三页样本 | 范围内、FR-EXTRACT-006、P3/T006 |
| D-005 入口优先 ego lite、回退 | FR-EXTRACT-003、P2/T003 |
| D-006 流程与产物契约 | FR-EXTRACT-001/002、P1/T001、P1/T002 |
| D-007 入口与页面代码边界 | FR-EXTRACT-004、P2/T004 |
| D-008 提炼方法与采集 | FR-EXTRACT-005/007、P3/T005、P4/T007 |
| D-009 覆盖分母 | FR-EXTRACT-006、P3/T006 |
| D-010 低保真与评分 | 明确不做（数值评分记 unavailable）、AC-C04-5、P7/T013 |
| D-011 对照与实施消费 | FR-EXTRACT-009、P5/T009、P5/T010 |
| D-012 接线与维护 | FR-EXTRACT-010/011、P6/T011、P6/T012 |
| D-013 采集跑不通就停 | RISK-01、P3 的 STOP、P2/T003 |

### 材料形态与审查覆盖限制（如实记录）

- 本任务的验收判据唯一权威是本文 `## Appendix A`，不存在独立“验收标准”文件；build-plan 审查包里 `acceptance_criteria` 与 `draft_spec` 同字节，属材料形态限制，不冒充独立验收文件。
- D/R/U 的完整正文在 `decision-log.md` 与任务库 `requirement-index.md`；审查包未含这两份正文，审查对“是否忠实执行决定”只能部分核到，本限制如实保留。

### C02 交付后的适用性更新（2026-10-25，main `bd207d35`）

C02 已合入 main，对本任务的事实变化与处理：

| 变化 | 事实 | 本规格处理 |
| --- | --- | --- |
| 技能更名 | `skills/ui-project-init/` → `skills/project-norm-init/`，templates 扩到 11 份（含 acceptance/api-contract/backend-architecture/domain-semantics/frontend-engineering/visual-design-system） | 全材料改用新路径；decision-log 追加更名更正说明（不改原决定正文） |
| 新增非UI规范入口 | `project-norm-init` 新增「非UI规范与索引」（`:31`），build-plan `:24`、build-code `:26`、verify-code `:15` 要求先读适用后端/接口/验收源 | 本任务适用类：验收（oracle/证据/完成规则）、接口（脚本参数与错误语义）、后端（运行时边界）；设计/前端判不适用并写理由；P1/P3/P5/P7 读集与动作补齐 |
| 读取点行号变化 | build-plan `:23`（UI）+ `:24`（非UI）、build-code `:26`（非UI）+ `:36`（UI）、verify-code `:15`（非UI）+ `:40`（UI） | `spec` 代码锚点与 P6/T011 更新；接线必须保留 C02 新增段落 |
| skill-deps 变化 | build-plan 已有 project-norm-init；build-code/verify-code 正文引用但 deps 仍无该条目 | 记为 C02 遗留缺口（不在本卡修，避免扩大写集）；本卡只补 design-source-extraction |
| 共享文件状态 | C02 已合入，`move-map.json`、三份 workflow SKILL、deps 均已更新 | P6 的“C02 先写”条件已满足，C04 直接按序写 |
| 规范同步 | 新增 `skills/norm-sync/`：build-code 每 Phase 收口、verify 终末、reflection 前、closeout 前执行 | 本任务不改五类专业规范正文，各 Phase 收口按 norm-sync 记具名无变化 |

## 1. 需求解释：问题与紧迫性

设计稿到代码之间现在缺一层可信的“事实交接”：实施者拿到的是截图和口头描述，取值靠试，缺项靠猜，做完了也没有可对照的基准。结果是还原偏差只能在验收时被发现，返工轮次和人工时间都花在猜与争。C04 要把这层交接做成有位置、有字段、有引用、有核对、有过期判定的流程，并且用一次真实还原证明它驱动了实现。

## 2. 背景、目标与范围

### 背景

- 仓内现状：`skills/design-source-readiness/SKILL.md` 只给方法不落盘；三个阶段的真实读取点只读目标项目的八类规范正文（`workflows/build-plan/SKILL.md:23`、`workflows/build-code/SKILL.md:36`、`workflows/verify-code/SKILL.md:40`）；没有提炼产物、没有设计值与实现值的对照表、没有覆盖分母（仓内 grep 无命中）。
- 实测事实：设计稿项目可运行在 `http://localhost:8443/`，三页可达；`agent-browser get styles/get box` 与 ego lite `page.evaluate` 都能取到真实 computed 值与几何；隔离浏览器链在本机连续两次 `RECEIVER_IDENTITY_CHANGED`，场景未执行。
- 外部事实：``style-ref-gen`` 许可未声明且强制移动化；覆盖率在业界有三种不可互换口径，“还原质量分”没有公认定义。

### 目标

让实施者与检查者拿到可信、可核对、缺项可见、能对齐规范、过期可判的提炼产物，并在现有阶段入口真实消费。

### 范围内

- 提炼方法标准与产物契约（含五类输入、四态、身份证、冻结分母、失败保真、过期与晋升边界）。
- 浏览器入口：优先 ego lite、缺装回退 agent-browser；页面代码 fail-closed 白名单。
- 最小采集器与三页真实执行；覆盖统计与关键项。
- 八类规范对齐与第二套规范对账。
- 一处区块的隔离实施与实测回填。
- 三阶段消费点接线与治理登记。

## 3. 用户场景与状态覆盖

### SCN-001：实施者按提炼产物还原一处区块

有稿开发者拿到 `design-source-extraction.json` 与待议清单，在看不到设计源码的隔离目录里还原一处区块，再按对照表回填实测值；缺项时只停被点名的步骤。

### SCN-002：检查者核对提炼结果

检查者按 AC 逐条重放命令：看事实是否交叉回读、缺项是否定向阻断、覆盖是否按冻结分母统计、四态是否成立。

### SCN-003：来源或规范变化后重提炼

规范版本变化或页面结构变化后，按 `freshness` 与 `stale` 判据判定旧产物过期，触发重提炼，不静默沿用旧值。

### SCN-004：浏览器入口不可用

首选引擎缺失或失败时按回退语义处理；外层包装脚本失败（场景执行前）按 D-013 停下等修，不换直连、不带缺口收口。

### 状态覆盖清单

| 状态 | 触发 | 期望可观察结果 |
| --- | --- | --- |
| 正常采集 | 页面可达、引擎可用 | 产物含 items、coverage、commands，exit 0 |
| 元素不存在 | 选择器/结构引用失效 | `failures` 记原错误，exit 非 0，不写空值 |
| 元素未渲染 | `display:none` 等 | 零尺寸被显式判为失败，不当作真实盒子 |
| 引擎缺失 | ego lite 未安装 | 回退 agent-browser 并记录原因 |
| 外层链失败 | 场景执行前报错 | 停止该路径，保留原错误，不换路 |
| 规范缺条目 | 八类中该类无适用条目 | 四态记“缺”，不改写规范 |
| 规范与实现冲突 | 实现值超出规范条目 | 四态记“冲突”，并列差异 |
| 必要输入缺失 | 五类任一类无源补证 | `missing.blocks` 点名受影响步骤 |
| 来源过期 | 版本/结构变化 | `freshness` 判 stale，触发重提炼 |

## 4. 产品事实与假设（PFACT）

- **PFACT-01**：三阶段现在只读八类规范正文，读不到提炼产物（`workflows/build-code/SKILL.md:36`）。
- **PFACT-02**：`design-source-readiness` 不落盘，只给字段方法（`skills/design-source-readiness/SKILL.md:12-19`）。
- **PFACT-03**：`agent-browser get styles|get box` 返回真实 computed 值与 border-box 几何；`display:none` 时 `get box` 仍返回 success 与 0（陷阱）。
- **PFACT-04**：ego lite 已安装，`ego-browser nodejs` 从 stdin 读脚本，`page.evaluate` 可批量取值；仓内此前无 ego 引用。
- **PFACT-05**：隔离链 `browser-qa-context.sh --run` 本机两次 `RECEIVER_IDENTITY_CHANGED`（场景前失败）。
- **PFACT-06**：设计稿项目页脚自述“示例数据，仅用于设计评审”，只能证明方法，不证明业务。
- **PFACT-07**：PaperBuilder 有九份真实规范（`specs/design/*`、`specs/frontend/*`，带 PB- 前缀稳定锚）。
- **这推断**：三页的元素定位需以结构树引用为主、业务属性为辅；纯类名不稳（依据：设计稿项目大量使用原子类，`src/components/*.tsx` 中 `className` 为 Tailwind 工具类）。

## 5. 功能需求

### 提炼流程与产物（EXTRACT）

- **FR-EXTRACT-001**：提炼必须发生在“设计源准备之后、实施开工之前”，并可被来源/规范版本变化触发重提炼；引用走 spec 验收对象 sources 与 Phase 材料导航。
- **FR-EXTRACT-002**：提炼产物为单份 `design-source-extraction.json`，含 `source/scope/norm_basis/inputs/items/gaps/norm_defects/coverage/commands/freshness/failures`；五类输入缺项写 `missing.blocks` 定向阻断；不生成人读视图。

### 浏览器入口（ENTRY）

- **FR-EXTRACT-003**：浏览器入口优先 ego lite，缺装或启动失败回退 agent-browser，回退原因逐次记录；外层包装失败与内层引擎失败分开记。
- **FR-EXTRACT-004**：页面内代码只允许已登记脚本标识（fail-closed）；未登记标识执行前拒绝；脚本只读，并留存“页面写入被拒、网络请求被拒”的负向结果。

### 采集与覆盖（COLLECT）

- **FR-EXTRACT-005**：采集器按冻结清单取值，每条命令与输出留原件；不存在元素/未渲染/工具失败保留原错误，不默认值、不类名猜像素、不截图补 DOM。
- **FR-EXTRACT-006**：正式计分前冻结必采清单与关键项；探测运行不计分；覆盖按冻结分母统计，关键项缺失单项否决。

### 规范对齐（NORM）

- **FR-EXTRACT-007**：以目标项目八类规范为尺子，逐类列适用条目（稳定锚或章节），每个元素/属性给四态（已有/缺/冲突/待议），规范自身缺陷记“规范待修”。
- **FR-EXTRACT-008**：除 PaperBuilder 规范外，用仓库模板集（`skills/project-norm-init/templates/`，C02 交付后路径）再跑一次对齐，证明方法可换项目。

### 消费与接线（WIRE）

- **FR-EXTRACT-009**：对照表由产物派生；一处区块在隔离实施目录、只拿到产物条件下还原并实测回填；局部实施有独立分母；事后核对未读设计源码。
- **FR-EXTRACT-010**：三处消费点（build-plan 设计源准备、build-code 实施输入、verify-code 对照核验）真实读取产物；新增件在 `docs/architecture/move-map.json` 登记 consumer/owner/退出条件；机读依赖按实际性质登记。
- **FR-EXTRACT-011**：外部内容处置：ego lite 与 agent-browser 记录版本、许可状态、维护者；`style-ref-gen` 不采用并记理由。
- **FR-EXTRACT-012**：低保真用非数值判据触发，并记录 owner 裁决三种行为（批准/拒绝/未答），非批准时 `blocked_scope` 内实施不启动。
- **FR-EXTRACT-013**：来源差异化证据：渲染值为一手事实，截图只作辅助类别，Figma 无合法源时写 `unavailable` 与影响；三类来源各自的可观察记录与未覆盖状态可回读。

## 6. 模块划分

| 模块 | 职责 | 主要文件 |
| --- | --- | --- |
| 方法与契约 | 提炼流程、产物字段、四态、过期与晋升边界 | `skills/design-source-extraction/SKILL.md` |
| 浏览器入口 | 引擎选择、回退、代码白名单 | `skills/isolated-browser-qa/SKILL.md`、`scripts/browser-qa-session.mjs`、`references/agent-browser.md` |
| 采集器 | 按清单取值、覆盖统计、证据绑定 | `skills/design-source-extraction/scripts/collect-design-source.mjs` |
| 规范对齐 | 八类对齐、四态、规范待修、第二套对账 | `skills/design-source-extraction/references/norm-alignment.md` |
| 消费 | 对照表派生、隔离实施、回填 | `skills/design-source-extraction/references/isolated-consumption.md` |
| 接线与登记 | 三处读取点、move-map、catalog、deps | `workflows/build-plan/SKILL.md` 等 |

## 7. 关键实体

- **提炼产物**（`design-source-extraction.json`）：顶层字段见 FR-EXTRACT-002；`items[]` 每项含 `locator`（结构引用+业务属性）、`structure`、`rendered`、`declared`、`norm_state`（已有/缺/冲突/待议）、`norm_anchor`、`evidence_ref`。
- **必采清单**（`scope.checklist`）：页×状态×视口×元素集×规范类别；冻结后写 `scope.frozen_at` 与变更记录。
- **四态**：`present|missing|conflict|pending_review`，另 `norm_defect` 记规范自身问题。
- **五类输入的缺项写法（唯一路径）**：`inputs` 为对象，每个键（`design_source`、`target_elements`、`properties`、`states`、`acceptance_points`）取值或 `{"status":"missing","reason":"…","blocks":["<步骤或元素标识>"]}`；缺项同时汇总到顶层 `gaps[]`（元素、影响、补齐路径）。契约测试断言 `inputs.<key>.status` 与 `blocks` 这两个具体路径。
- **证据类别**：`items[].evidence_kind` 取 `rendered|declared|screenshot`；`screenshot` 只能进辅助字段，不得填 `rendered` 数值；Figma 无合法源时在 `source.figma` 写 `{"status":"unavailable","reason":"…"}`。
- **低保真与裁决**：`low_fidelity` 对象含 `triggered`（布尔）、`reasons[]`（非数值判据：任一类必要输入缺失且无法补证、关键项缺失、冲突率超预声明阈值）、`ruling`（`pending|approved|rejected|no_response`）、`blocked_scope[]`；`ruling` 非 `approved` 时 `blocked_scope` 内的实施不启动。
- **对照表**（`comparison[]`）：`item_ref`、`design_value`、`implementation_value`、`state`、`evidence_ref`。

## 8. 数据和生命周期

- 产物落任务证据区 `specs/<task-id>/quality/evidence/`，不写目标项目规范正文。
- 可复用事实经规范 owner 确认后才晋升（C01/C08 链），C04 只出 `pending_review` 清单。
- `freshness` 记生成时间、来源版本/commit、规范版本；`stale` 判据：来源版本变化、规范版本变化、页面结构变化。
- 失败与工具不可用写 `failures`，不进入 items 的空值。

## 9. 兼容性预留

- 旧的 `design-source-readiness` 字段与方法不变，只被引用不被改写。
- 三处消费点只新增读取与引用，不改既有步骤编号与语义；`skill-deps.yaml` 若确认无 UI 条目属登记缺口，则增补条目而不改既有条目。
- ego lite 未安装时行为与现状等价（走原 agent-browser 路径）。

## 10. 明确不做与默认必须成立

### 明确不做

- 数值质量评分（子项记 unavailable）；人读渲染视图；万能采集器/通用 AST 平台；不锁旧 schema（格式与工具按缺口选）；全项目设计资产整理；观察自动晋升规范；第二套公共浏览器入口；静默升级外部工具；Figma 全库与真实上线。

### 默认必须成立

- 任何失败都保留原错误与原件；不把缺失写成通过；不把探测当正式采集；不改规范正文；不改既有测试断言来凑绿。

## 验收流程

从 SCN 入口定位 FR → Appendix A 同号 AC → 所属 Phase 命令 → 可回读证据。每条 AC 的执行 owner 与判定时点写在 Appendix A 内；证据落任务证据区。

## 测试标准

本节声明本任务的测试面（逐面理由、oracle、证据类型、覆盖边界），每个要测的面指向所属 Phase 的可执行命令。

| 测试面 | 测/不测与理由 | oracle | 证据类型 | 覆盖 AC | 命令所在 |
| --- | --- | --- | --- | --- | --- |
| 契约结构（产物字段/四态/缺项阻断） | 测；新契约必须能证伪字段缺失与非法取值 | ORACLE-EXTRACT-CONTRACT | 契约测试输出（退出码+断言） | AC-C04-2、AC-C04-7 | P1/T002 |
| 浏览器入口选择与回退 | 测；入口是公共能力，必须能证明优先与回退 | ORACLE-EXTRACT-ENTRY | 契约测试输出（含缺失/失败注入） | AC-C04-5 | P2/T004 |
| 页面代码白名单 | 测；这是安全边界，必须有负向结果 | ORACLE-EXTRACT-GUARD | 契约测试输出（未登记拒绝、写入/请求被拒） | AC-C04-5 | P2/T004 |
| 采集器行为与失败保真 | 测；采集是证据源头，必须能证明失败不返回空 | ORACLE-EXTRACT-COLLECT | 命令退出码+原始输出+产物片段 | AC-C04-1、AC-C04-4 | P3/T006 |
| 覆盖统计与冻结分母 | 测；分母冻结是可复算前提 | ORACLE-EXTRACT-COVERAGE | 产物 coverage 段+命令原件 | AC-C04-4 | P3/T006 |
| 规范对齐四态与第二套对账 | 测；换规范仍能产出四态是通用性判据 | ORACLE-EXTRACT-NORM | 两次对账产物+命令原件 | AC-C04-8 | P4/T008 |
| 对照与隔离实施消费 | 测；必须证明实施者真读了产物 | ORACLE-EXTRACT-CONSUME | 对照表+实施产物+事后核对记录 | AC-C04-3、AC-C04-4 | P5/T010 |
| 三阶段接线与登记 | 测；接线是“不是空壳”的判据 | ORACLE-EXTRACT-WIRE | 契约测试输出（读取点断言）+登记 diff | AC-C04-6 | P6/T012 |
| 真实浏览器端到端（三页） | 条件测；本机外层链已两次失败，若修复后跑通则作为 AC-C04-4 的端到端补充，否则如实记 unavailable | ORACLE-EXTRACT-E2E | 采集命令原件+页面截图/快照 | AC-C04-1、AC-C04-4 | P3/T006（浏览器面） |
| 性能与 a11y | 不测；本任务产出是方法与脚本，不新增产品页面；性能/可访问性属后续页面卡。具名理由：写集无产品页面、无渲染路径 | N/A — 无产品页面 | N/A | N/A | N/A |

### 验收对象

真实对象（规划态：`state.execution=not_run`；三项 UI 事实均为 false，理由见下）：

```json
{
  "workspace": "workflowhub 认证工作树 workflowhub-workflowhub-ui-frontend-c04-design-source-extraction-20261025",
  "service": "本地命令与脚本（无网络服务）",
  "route": "skills/design-source-extraction/scripts/collect-design-source.mjs",
  "state": "planning",
  "viewport": "not_observed",
  "owner": "用户",
  "cli": {
    "command": "node skills/design-source-extraction/scripts/collect-design-source.mjs --plan quality/evidence/collection-plan.json",
    "entry_ref": "planned_scope",
    "sample_ref": "real_samples",
    "oracle_ref": "oracle"
  }
}
```

三源事实与理由：

- `raw_requirement`：用户要的是“通用提炼方法、规范对齐、流程接线与三阶段消费”，不是页面实现；source_ref `raw_requirement`。
- `project_inventory`：本仓是 CLI/工作流工具仓，无 `apps/`、无产品 `.tsx/.vue/.jsx`；浏览器技能是方法技能不是产品页面；source_ref `project_inventory`。
- `planned_or_changed_frontend_fact`：本次写集为 `.md/.mjs/.json/.test.mjs`，无组件/CSS/路由/API 实现；source_ref `planned_scope`。

`viewport` 记 `not_observed` 而非编造尺寸；`state.execution=not_run` 表示规划入口未执行。

## 架构边界

- 产品边界：提炼是“任务级证据”，不是项目规范；规范正文归原 owner。
- 工程边界：采集器是窄脚本（读清单→取值→写产物），浏览器入口是既有技能的引擎选择扩展；两者都不引入新控制面、不新增 stage 或 gate。

## 实现设计（全局权威）

### 代码锚点

- 现状：读取点分 UI 与非UI 两路——`workflows/build-plan/SKILL.md:23`（UI，project-norm-init 规范职责）与 `:24`（非UI，后端/接口/验收）；`workflows/build-code/SKILL.md:26`（非UI）与 `:36`（UI）；`workflows/verify-code/SKILL.md:15`（非UI）与 `:40`（UI）。`skills/isolated-browser-qa/scripts/browser-qa-session.mjs` 的 `runBrowserQa` 在 `:341-392` 处理引擎、导航、场景与清理。
- 目标：新增 `skills/design-source-extraction/`（SKILL.md + scripts + references + skill-bundle.json），并在 `catalog.yaml` 与 `reuse-registry.md` 登记；在 `isolated-browser-qa` 内加引擎选择，引擎分支同时存在于 `browser-qa-session.mjs` 与 `browser-qa-doctor.sh`／`browser-qa-cleanup.sh`／`browser-qa-context.sh`（三处 shell 的 case 不同步会导致新引擎清理报 unsupported）；三处消费点各加一段读取描述。
- 读取顺序：先 `skills/isolated-browser-qa/scripts/browser-qa-session.mjs` 的 `runBrowserQa`，再 `skills/isolated-browser-qa/SKILL.md` 允许动作段，最后三处 workflow 读取点。
- 代码锚点：`runBrowserQa(args, env)`（引擎选择与回退插入点）；新增 `collectDesignSource(plan)` 与 `validateExtraction(doc)`；以上符号在 P1～P3 由对应 Task 落地，行号为生成时刻导航，不作契约。

### 接口与失败语义

- **选择的架构方案**：复用既有浏览器技能与 CLI 风格，新增一个窄技能与一个窄脚本；放弃在 readiness 里塞采集能力（它只组织来源），放弃新建平台。
- **模块职责**：清单（输入）→ 采集器（取值与证据）→ 产物（JSON）→ 规范对齐（四态）→ 消费（对照与回填）；各段不互相裁决质量。
- **接口与数据流**：`collection-plan.json`（页/状态/视口/元素集/规范类别/脚本标识）→ `design-source-extraction.json`（items/coverage/commands/failures）→ 对照表 → 实施回填。
- **失败语义**：未登记脚本标识拒绝执行；元素不存在/未渲染/引擎失败返回非 0 并列原错误；外层链失败停止该路径；探测与正式采集分开。
- **新增控制面**：N/A — 无新 stage、gate 或进度权威；仅新增技能与脚本。

### 全局文件边界与依赖

- **新增**：`skills/design-source-extraction/SKILL.md`、`skills/design-source-extraction/skill-bundle.json`、`skills/design-source-extraction/scripts/collect-design-source.mjs`、`skills/design-source-extraction/references/norm-alignment.md`、`skills/design-source-extraction/references/isolated-consumption.md`、`tests/contract/design-source-extraction-contract.test.mjs`、`tests/contract/browser-engine-selection.test.mjs`、`tests/contract/design-source-extraction-collect.test.mjs`、`tests/contract/design-source-extraction-norm.test.mjs`、`tests/contract/design-source-extraction-consumption.test.mjs`、`tests/contract/design-source-extraction-wiring.test.mjs`、`tests/e2e/design-source-extraction-acceptance.test.mjs`。
- **修改**：`skills/isolated-browser-qa/SKILL.md`、`skills/isolated-browser-qa/references/agent-browser.md`、`skills/isolated-browser-qa/scripts/browser-qa-session.mjs`、`skills/isolated-browser-qa/scripts/browser-qa-doctor.sh`、`skills/isolated-browser-qa/scripts/browser-qa-cleanup.sh`、`skills/isolated-browser-qa/scripts/browser-qa-context.sh`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`docs/architecture/move-map.json`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`（OI-009 已核实：build-code/verify-code 的 deps 缺 UI 条目属登记缺口，本次补登）。
- **禁止改动**：`skills/spec-specify/templates/spec-template.md`（C01 冻结的验收对象 producer）、`tests/contract/acceptance-object-*.test.mjs`、目标项目 `specs/design/*` 与 `specs/frontend/*`（规范正文归原 owner）、`skills/design-source-readiness/SKILL.md` 的语义（只被引用不变更）。
- **全局依赖**：P1→P2→P3→P4→P5→P6→P7 串行；P6 与 C02 在本机另一工作树并发，共享文件先生成独立件、共享文件按顺序单写。
- **文件归属**：每个 Phase 独享其写入集；`skills/design-source-extraction/SKILL.md` 只在 P1 写，P4/P5 写各自的 `references/` 文件，避免同路径跨 Phase 并发。
- **回滚与恢复**：契约字段或引擎选择出错时回滚对应 Phase 的改动，保留既有读取点原文；不整树回退。
- **受保护面实读记录**：`skills/spec-specify/templates/spec-template.md:270` 的 marker 与 `:272` 的 `export function checkAcceptanceObject(input, context = {})`、两份 `tests/contract/acceptance-object-*.test.mjs` 的断言名、`browser-qa-cleanup.sh:9-10` 的 `agent-browser|browser-use` case 标签，均为本阶段实读（原件 `quality/tests/2026-10-25-038-c04-protected-boundary-reads.output`，含 `date -u` 与 `npx vitest --version`）；未实读项不进本清单。

### 需求到任务追踪

| 来源 / 决定 | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 | 依赖 / 状态 |
| --- | --- | --- | --- | --- | --- |
| R-018、R-002 / D-006 | 提炼必须接进流程并标准化：何时、存什么、谁引用、谁核、怎么过期 | FR-EXTRACT-001、FR-EXTRACT-002 / AC-C04-2 | P1/T001 | ORACLE-EXTRACT-CONTRACT：字段齐全且缺项定向阻断；反例：缺 `missing.blocks` 即失败 | none；planned |
| R-022 / U-009 | 产物只出机器可读 JSON，不造人读表格 | FR-EXTRACT-002 / AC-C04-2、AC-C04-7 | P1/T002 | ORACLE-EXTRACT-CONTRACT：顶层字段齐全且无第二文件；反例：生成 view 表格即失败 | P1/T001 |
| R-019、R-007 / D-005 | 浏览器入口优先 ego lite、回退可解释 | FR-EXTRACT-003 / AC-C04-5 | P2/T003 | ORACLE-EXTRACT-ENTRY：缺失走回退并记录；反例：静默失败 | P1 |
| R-020 / U-008 | 页面代码只允许已登记脚本且只读 | FR-EXTRACT-004 / AC-C04-5 | P2/T004 | ORACLE-EXTRACT-GUARD：未登记标识拒绝、写入与请求被拒 | P2/T003 |
| R-004、R-003、R-008、R-014、R-017 / D-008 | 渲染值优先、证据可回读、失败保真 | FR-EXTRACT-005 / AC-C04-1 | P3/T005 | ORACLE-EXTRACT-COLLECT：真实值与命令原件；反例：失败返回空值 | P2 |
| R-006、R-011、R-015 / D-009 | 覆盖≥90%、分母运行前冻结、三页真实执行、不冒充对照 | FR-EXTRACT-006 / AC-C04-4 | P3/T006 | ORACLE-EXTRACT-COVERAGE：冻结时间与分母可复算 | P3/T005 |
| R-021、R-009 / D-008 | 以八类规范为尺子，四态判定，规范缺陷可报 | FR-EXTRACT-007 / AC-C04-8 | P4/T007 | ORACLE-EXTRACT-NORM：八类各有着落；反例：只量页面对不上规范 | P3 |
| R-010、R-013 / D-012 | 外部工具版本、许可、维护者记录 | FR-EXTRACT-011 / AC-C04-6 | P6/T012 | ORACLE-EXTRACT-WIRE：外部工具记录表 | P6 |
| R-023 / U-013 | 第二套规范对账证明通用 | FR-EXTRACT-008 / AC-C04-8 | P4/T008 | ORACLE-EXTRACT-NORM：两套规范均出四态 | P4/T007 |
| R-002、R-018 / D-006 | 契约引用验收规范（oracle/证据形态） | FR-EXTRACT-001、FR-EXTRACT-002、FR-EXTRACT-012 / AC-C04-2、AC-C04-7、AC-C04-5 | P1/T001 | ORACLE-EXTRACT-CONTRACT：契约引用 `specs/acceptance` 规则或写不适用理由 | none |
| R-004、R-008 / D-008 | 脚本参数与错误语义对齐接口规范 | FR-EXTRACT-005、FR-EXTRACT-013 / AC-C04-1、AC-C04-4 | P3/T005 | ORACLE-EXTRACT-COLLECT：参数/错误语义有源或具名不适用 | P2 |
| R-018 / D-012 | 接线保留非UI读取段并接产物 | FR-EXTRACT-010 / AC-C04-6 | P6/T011 | ORACLE-EXTRACT-WIRE：三处读取点含 UI 与非UI 两路 | P5 |
| R-005 / D-011 | 对照表由产物派生，待议可读 | FR-EXTRACT-009 / AC-C04-3 | P5/T009 | ORACLE-EXTRACT-CONSUME：对照表齐全、空产物报错 | P4 |
| R-016 / D-011 | 隔离实施、回填、事后核 | FR-EXTRACT-009 / AC-C04-3、AC-C04-4 | P5/T010 | ORACLE-EXTRACT-CONSUME：三件记录齐全且回填一致 | P5/T009 |
| R-018、R-012 / D-012 | 三处消费点真实读取产物 | FR-EXTRACT-010 / AC-C04-6 | P6/T011 | ORACLE-EXTRACT-WIRE：三处读取点命中 | P5 |
| R-010、R-013 / D-012 | 新增件登记与外部内容处置 | FR-EXTRACT-010、FR-EXTRACT-011 / AC-C04-6 | P6/T012 | ORACLE-EXTRACT-WIRE：登记含版本、许可与不采用理由 | P6/T011 |
| R-007 / D-010 | 低保真非数值判据与 owner 裁决三态 | FR-EXTRACT-012 / AC-C04-5 | P1/T001 | ORACLE-EXTRACT-CONTRACT：`low_fidelity.ruling` 三态与 `blocked_scope` | P1 |
| R-009 / D-003 | 三源差异化与未覆盖记录 | FR-EXTRACT-013 / AC-C04-1 | P3/T005 | ORACLE-EXTRACT-COLLECT：`evidence_kind` 与 `source.figma.unavailable` | P3 |
| R-018 / D-013 | 八条 AC 逐条验收与失败闭环 | FR-EXTRACT-001、FR-EXTRACT-002、FR-EXTRACT-003、FR-EXTRACT-004、FR-EXTRACT-005、FR-EXTRACT-006、FR-EXTRACT-007、FR-EXTRACT-008、FR-EXTRACT-009、FR-EXTRACT-010、FR-EXTRACT-011 / AC-C04-1、AC-C04-2、AC-C04-3、AC-C04-4、AC-C04-5、AC-C04-6、AC-C04-7、AC-C04-8 | P7/T013 | ORACLE-EXTRACT-ACCEPT：8 行档位齐全；反例：缺证据仍记 pass | P6 |

### 全局验证策略

- **验证策略**：每个面用一条可执行契约测试/脚本命令证明；端到端以三页采集为条件证据，外层链不可用则如实 unavailable，不冒充。
- **RED/GREEN 设计**：7 份预写测试已在本阶段实跑 RED（exit 1，具名目标断言失败，原件 `quality/tests/2026-10-25-031`～`037`），实现后按同一命令转 GREEN；契约测试先写目标断言（RED 非 0），再实现使 GREEN；命令为 `npx vitest run tests/contract/design-source-extraction-contract.test.mjs`、`npx vitest run tests/contract/browser-engine-selection.test.mjs`、`npx vitest run tests/contract/design-source-extraction-collect.test.mjs`、`npx vitest run tests/contract/design-source-extraction-norm.test.mjs`、`npx vitest run tests/contract/design-source-extraction-consumption.test.mjs`、`npx vitest run tests/contract/design-source-extraction-wiring.test.mjs`、`npx vitest run tests/e2e/design-source-extraction-acceptance.test.mjs`；同一 ORACLE 编号贯穿；未执行前写 unavailable，不宣 RED。
- **最终聚合**：P7 逐条消费 P1～P6 证据与命令原件核对 8 条 AC；不新增报告文件类型。
- **不能证明的内容**：不证明真实三页之外的项目可用；不证明业务正确；不证明数值评分（本次不做）。

## Appendix A — 验收判据（唯一权威）

- [ ] **AC-C04-1**：同一真实元素的结构/意图与渲染值可交叉回读，冲突有原因，未观察项与证据强度明确；关联 FR-EXTRACT-005
验证：由采集 Task 对三页取同一元素的结构事实与渲染值并写进 `items[]`；独立执行者用 P3 命令重放并核对 `rendered` 与 `declared` 分字段、`evidence_ref` 可回读；ORACLE-EXTRACT-COLLECT。判定时点：build-code P3 完成时；执行 owner：P3 实施者，检查者独立重放。
通过：两类事实同时存在且分字段；冲突项有原因；截图不填渲染值字段；未观察项标 unknown 并写影响。
失败：用截图推断 API/语义；用类名猜像素；把源码声明值当渲染值；缺失项写成空值或 0。
证据：`quality/tests/<date>-c04-p3-collect.out`（实际路径由执行者发布，此处不是执行结果）

- [ ] **AC-C04-2**：五类必要输入逐项有值或有 `missing` 且 `blocks` 点名受影响步骤，只停被点名步骤；关联 FR-EXTRACT-002
验证：P1 契约测试构造“缺设计来源/缺状态/缺验收点”三类输入，断言产物给出 `missing` 与 `blocks`；独立执行者重放 P1 命令并读产物；ORACLE-EXTRACT-CONTRACT。
通过：缺项具名、影响具名、无关步骤仍可执行；字段与四态取值合法。
失败：补默认值；缺项不写影响；因评分缺失误阻已齐输入；产物出现第二份人读文件。
证据：`quality/tests/<date>-c04-p1-contract.out`

- [ ] **AC-C04-3**：真实实施者按产物还原一处区块，初始未实现项不报通过，产物成为实现与检查依据；关联 FR-EXTRACT-009
验证：P5 在隔离实施目录按产物还原并回填对照表，事后核对未读设计源码；独立检查者读实施产物与回填记录；ORACLE-EXTRACT-CONSUME。
通过：实施产物存在且对应 `items[]`；回填的实测值与产物一致；未实现项保留为未实现。
失败：只验格式或文件存在；接线无真实读取；实施者读过设计源码却声明未读。
证据：`quality/evidence/p5-isolated-implementation/`（执行后由 P5 发布）

- [ ] **AC-C04-4**：局部实施有独立分母且运行前冻结，覆盖≥90%、对照驱动实现、返工≤2；关联 FR-EXTRACT-006
验证：P3 冻结必采清单并统计覆盖；P5 对所选区块另建**局部独立分母**（只含该区块必要属性/状态）并产出 `quality/evidence/p5-coverage.json`；独立执行者用 `npx vitest run tests/contract/design-source-extraction-consumption.test.mjs` 与 `npx vitest run tests/contract/design-source-extraction-collect.test.mjs` 复算两套分母；ORACLE-EXTRACT-COVERAGE。
通过：`scope.frozen_at` 早于正式采集；两套分母各自可复算（全局与局部不混算）；关键项全在；返工次数有记录且 ≤2；`p5-coverage.json` 可回读。
失败：换分母或缩范围凑比例；用探测结果当正式采集；不等输入冒充有稿对照。
证据：`quality/tests/<date>-c04-p3-coverage.out` 与 `quality/evidence/p5-coverage.json`

- [ ] **AC-C04-5**：低保真按非数值判据触发并取得本次裁决；工具失败单独记；评分子项记不可用且不冒充通过；关联 FR-EXTRACT-003/004
验证：P1 契约测试断言 `low_fidelity.triggered/reasons/ruling/blocked_scope` 路径与非法取值；P2 契约测试构造引擎缺失、未登记脚本标识、页面写入与网络请求尝试，断言回退、拒绝与副作用被拒；P3 构造元素不存在/未渲染；P5 构造 `ruling=pending|rejected|no_response` 三种情形，断言 `blocked_scope` 内实施不启动；独立执行者重放；ORACLE-EXTRACT-CONTRACT/ENTRY/GUARD。
通过：回退有记录；未登记标识在执行前被拒；写入与请求被拒的负向结果留存；失败项写 `failures` 且非 0 退出；评分子项写 unavailable。
失败：未答/拒绝当同意；评分类缺失当完成；失败回空结果；熔断后换路冒充。
证据：`quality/tests/<date>-c04-p2-entry.out`、`...-p2-guard.out`

- [ ] **AC-C04-6**：三处消费点真实读到产物；外部工具与技能有版本、许可、维护者与不采用理由；新增件有唯一 consumer/owner/退出条件；关联 FR-EXTRACT-010/011
验证：P6 契约测试断言三处读取点文本与登记条目；P7 另要求三处各留一次“真实读取产物”的可观察记录（读取命令＋读到的字段值），只有文本断言不判 pass；独立执行者读 diff、登记原件与读取记录；ORACLE-EXTRACT-WIRE。
通过：三处读取点各有真实读取描述；move-map 条目字段齐全；catalog/bundle 条目存在；`style-ref-gen` 不采用理由在位。
失败：只登记不消费；把未声明许可当已授权；新增第二权威或专用读取入口。
证据：`quality/tests/<date>-c04-p6-wire.out`

- [ ] **AC-C04-7**：新任务能用同一流程与产物；来源/规范变化能判 stale 并触发重提炼；回退与升级路径可执行；关联 FR-EXTRACT-001
验证：P1 契约测试断言 `freshness` 判据与 stale 触发；P6 读取点为新任务入口；独立执行者按判据构造一次过期场景；ORACLE-EXTRACT-CONTRACT。
通过：`freshness` 字段齐全；来源版本变化即判 stale；触发重提炼的入口可执行；升级须先问用户。
失败：每任务重造；来源变了仍用旧值；静默升级外部工具。
证据：`quality/tests/<date>-c04-p1-contract.out`（过期分支）

- [ ] **AC-C04-8**：八类规范逐类有适用条目或具名不适用；元素/属性四态之一；规范自身缺陷可报；换第二套规范仍能对账；关联 FR-EXTRACT-007/008
验证：P4 用 PB 规范与仓库模板集各跑一次对齐，产出四态与 `norm_defects`；独立执行者对比两份对账产物；ORACLE-EXTRACT-NORM。
通过：八类各有着落；四态取值合法；`norm_defects` 有实例或具名无；第二套规范同样产出四态。
失败：只量页面不对规范；四态混写；方法写死在一个项目（换规范后产出为空）。
证据：`quality/evidence/p4-norm-alignment-pb.json` 与 `...-template.json`

## 12. 风险、未决与交接

- **RISK-01**：外层隔离链失败导致采集不可用
  - **受影响 ID**：FR-EXTRACT-003/005、AC-C04-1、AC-C04-4
  - **触发条件**：`browser-qa-context.sh --run` 在场景执行前报错
  - **后果**：三页采集与端到端证据缺失
  - **缓解或停止**：按 D-013 停止该路径并保留原错误；不换直连；依赖采集的 AC 保持未完成
  - **处理阶段**：build-code P3；owner 为 P3 实施者
  - **验证**：原错误与停止记录可回读
- **RISK-02**：公共浏览器入口改动影响后续卡
  - **受影响 ID**：FR-EXTRACT-003、AC-C04-5
  - **缓解或停止**：优先 ego lite、缺失回退、回退原因记录；不影响既有 `--run` 语义
  - **处理阶段**：P2；owner P2 实施者
- **RISK-03**：只出机器数据导致人审困难
  - **受影响 ID**：FR-EXTRACT-002
  - **缓解或停止**：字段命名自解释、`evidence_ref` 可回读；不生成第二份真相
  - **处理阶段**：P1；owner P1 实施者
- **RISK-05**：C02 遗留的 deps 缺口影响接线可查性
  - **受影响 ID**：FR-EXTRACT-010、AC-C04-6
  - **触发条件**：build-code/verify-code 正文引用 project-norm-init 但 skill-deps 无条目
  - **后果**：机读依赖检查查不到该读取关系
  - **缓解或停止**：本卡只补 design-source-extraction 条目，遗留缺口如实记录交其 owner；不改他人写集
  - **处理阶段**：P6；owner P6 实施者
- **RISK-04**：与 C02 并发改共享文件
  - **受影响 ID**：FR-EXTRACT-010
  - **缓解或停止**：C04 新件独立；共享文件按 Phase 顺序单写；与 C02 状态对齐后再动
  - **处理阶段**：P6；owner P6 实施者
- **未决项**：OI-001 字段取值首跑验证；OI-002 分母枚举；OI-004 C02 顺序；OI-006 外层链失败；OI-007 Figma；OI-008 三页可达；OI-009 deps 性质；OI-011 A/B；OI-012 晋升 owner；OI-013 第二套规范粒度（见 decision-log 未决项表，本规格不复制状态）。

## 13. 业务影响与回归范围

- 受影响：新增技能与脚本；`isolated-browser-qa` 的引擎选择；三处 workflow 读取点；治理登记文件。
- 回归面：既有 `--run` 语义与清理契约、既有契约测试（`tests/contract/*`）、`skills/catalog.yaml` 一致性检查。
- 不影响：目标项目规范正文、`design-source-readiness` 语义、产品页面与后端。

## 补充材料

- decision-log、requirement-index、coverage-matrix、两份审查原件、外部调研与 ego lite 能力记录（路径见 decision-log 外置事实索引）。

## 当前执行更正：复用已开 ego（2026-10-25）

真实方向与覆盖边界唯一回 decision-log.md「本次用户更正：复用已开 ego，避免打断」。FR-EXTRACT-003/004本任务ego分支改为已开实例内的新owned TaskSpace；不启动浏览器/新窗口/初始化，不用户命名、不CUA、不focus或触碰既有tab。先核guide与真实后台行为；会抢焦点即停该调用。其它FR、Appendix A八条AC及原分母保持原文。

TaskSpace是页面生命周期范围，不等Cookie/cache/storage独立。auth none表示不主动读/export/inject凭据，不表示匿名，固定采集不读Cookie/storage。agent-browser/browser-use保原fresh实例与源票据能力剥离流程；复用现有profile不是其隐式替代。P2移除本次未交付独立ego实例、初始化、偏好及PID承接代码，只保所需SDK调用/owned页面清理/注册只读边界，不新增控制面。历史原件保留；实际consumer仍P3冻结清单采集与后续页面QA，登记仍由P6承接。

当前执行边界补正（主会话2026-10-25中继用户“直接已开ego新工作区”，继此前要求“不再启动/初始化新窗口”）：默认复用已开ego模式无隐式启动回退。缺运行实例、获取失败、权限或取消均明确报错，不能自动打开agent-browser/新窗口；原FR-EXTRACT-003内“内层启动失败回退”在该模式由用户最新指令覆盖，不冒原回退通过。显式agent-browser/browser-use原隔离路径保留；引擎缺失的纯选择/回退记录仍可测，不能据此声称当前模式实际启动其它引擎。AC-C04-5按当前模式核拒绝、非零失败、记录与无换路，完整低保真裁决仍由对应后续Phase承接。此解释待独立Spec核，不由实施者自签。
