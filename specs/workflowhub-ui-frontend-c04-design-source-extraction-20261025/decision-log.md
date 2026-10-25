# 决策日志：设计源提炼与实现交接（C04）

## 任务身份

- **任务类型**：普通任务（母规划第四张卡）。
- **入口规模与路线评估**：只引用本文「级别与路线」。
- **原始需求来源**：母规划 `specs/workflowhub-ui-frontend-release-20261020/prd.md` C04 卡（259–278 行）、S5/S6（120–155 行）、S2/S3（57–107 行）；用户 2026-10-25 八批真实答复（逐字见任务库 `quality/evidence/decision-log-refs/requirement-index.md`）。

## 级别与路线

- **实际调用**：`node --input-type=module <inline: evaluateEntryRoute(input)>`，cwd＝本任务工作树；唯一原 ref `quality/tests/2026-10-25-003-c04-entry-evaluation.output`（前两次失败原样保留于 `001`、`002`，未用于判级）。
- **返回原值**（本节保存一次）：`status=paused`；`reason="mini-task suitability is not established"`；`expanded_risks=[]`；`choices=["shrink-scope","create-ordinary-five-stage-task"]`；`flags={boundary_clear:true, single_outcome:false, limited_impact:false, major_architecture:false, migration:false, permission:false, security:false}`。
- **逐项判级事实**：`boundary_clear=true`；`single_outcome=false`（七块）；`limited_impact=false`（改公共浏览器入口与三阶段消费点）；四项风险无触发证据，不等于无风险。
- **承诺的独立可交付验收单元数**：7 个工作包，映射 8 条 AC；1 个需真实执行者在场，1 个改公共入口；不涉及真实凭证。
- **推荐级别**：复杂（五阶段）。**用户真实选择**：复杂五阶段。
- **可选拆分路线**（paused 时必须给）：把②拆成独立前置段单独审。用户未选，按不拆分执行。
- **若改 `shrink-scope`**：流程契约、规范对齐、覆盖分母、来源差异均无落点，验收不能通过；不采用。
- **消费者**：第 8／13 步展示、实施前审查、收口与逐 AC 对账。

## 原始需求

| source_id | 需求/约束 | 来源引用 | 落点 |
| --- | --- | --- | --- |
| R-001 | 设计通用提炼方式，不为某项目定制 | 用户原话 | ①③④ |
| R-002 | 五类必要输入有源补齐，缺项只影响依赖实施 | `prd.md:122`、`264` | ①③ |
| R-003 | 事实与推断分开；截图不能证明 DOM/API/业务语义 | `prd.md:263`、`266` | ① |
| R-004 | 渲染值优先；源码声明另列并记差异 | `prd.md:266` | ①③ |
| R-005 | 提炼结果必须被真实实施者消费 | `prd.md:264`、`267` | ⑥ |
| R-006 | 局部禁读验证：覆盖≥90%、分母运行前具名、返工≤2 | `prd.md:138`、`267` | ③④⑥ |
| R-007 | 低保真取本次裁决；模型不可用不假给分、不误阻 | `prd.md:122`、`267` | ⑤ |
| R-008 | 采集可回读：源/URL/元素/状态/viewport/原命令 | `prd.md:264` | ②③ |
| R-009 | 三种来源差异化证据路径；未取得的分支如实未覆盖 | `prd.md:262`、`271` | ① |
| R-010 | 原工具按 S3 记录版本/许可/维护 | `prd.md:264`、`278` | ⑦ |
| R-011 | 三页真实样本：模拟记录列表、模拟工作台、策略工作台 | 用户原话 | ③ |
| R-012 | 不新增 stage/gate/进度权威；观察事实不晋升规范 | `prd.md:273`、`276` | 全部 |
| R-013 | 新增件登记唯一 consumer/owner/退出条件 | `AGENTS.md`、`prd.md:111` | ⑦ |
| R-014 | 采集失败保真 | `prd.md:263`、`267` | ①②③ |
| R-015 | 不等输入的局部试验不得冒充有稿收益对照 | `prd.md:267`、`153` | ④⑥ |
| R-016 | 提取器可读源码、实施者禁读，双向边界可说明 | `prd.md:264`、`267` | ③⑥ |
| R-017 | 原生采集主路径必须实跑，不得用 fallback 冒充 | `prd.md:267` | ②③⑦ |
| R-018 | 提炼必须正式接入流程并标准化（何时、存什么、谁引用、谁核、怎么过期与更新） | 用户原话、`prd.md:264` | ①⑥⑦ |
| R-019 | 浏览器操作优先 ego lite，缺装回退 | 用户原话 | ② |
| R-020 | 页面内代码只读、脚本入库可审、每次留原件 | 用户原话 | ② |
| R-021 | 以目标项目八类规范为尺子回答用什么/缺什么/要谈什么；方法通用不绑项目 | 用户原话 | ①③ |
| R-022 | 产物只出机器可读 JSON，不额外生成人读视图 | 用户原话 | ① |
| R-023 | 通用性要有第二套规范对账作证据 | 用户原话 | ③ |

### FR → R 映射

| 母卡 FR | 覆盖的 R | 承接 |
| --- | --- | --- |
| C04-F1 自动采集与证据定位 | R-004、R-008、R-014 | ②③ |
| C04-F2 五类输入有源补齐、冲突显露 | R-002、R-003、R-004、R-021 | ①③ |
| C04-F3 对照含设计值/实现值/状态/证据并被真实读取 | R-005、R-018 | ⑥ |
| C04-F4 LOW_FIDELITY 与低于 0.8 按 S5 裁决 | R-007 | ⑤ |
| C04-F5 独立提取器局部验证区分双向禁读 | R-006、R-015、R-016 | ③⑥ |
| C04-F6 原工具维护与许可按 S3 | R-010、R-017 | ⑦ |

## 需求变更记录

完整变更见任务库 `quality/evidence/decision-log-refs/requirement-change-log.md`。最小决定：U-001 复杂五阶段；U-002 通用提炼+驱动实现；U-003 方法+最小采集器；U-004 可运行页面为主/截图辅助/Figma 待实核；U-005 三页取自设计稿项目；U-006 范围扩到流程接入与标准化；U-007 浏览器入口优先 ego lite；U-008 页面代码只读且可审；U-009 产物只出机器数据；U-010 以八类规范为尺子且方法通用；U-011 不生成人读视图；U-012 采集跑不通就停下等修；U-013 再加一套规范跑对账证明通用。

## 工作包与决定

### D-001 — 按复杂五阶段推进

- **做什么**：走完整五阶段并留原件。
- **不做什么**：不缩成最小提取器；不把决策当实施授权。
- **风险**：周期长；范围变更回本决定重判。
- **改动**：主会话唯一 writer。

### D-002 — 交付“提炼方法标准 + 最小采集器”

- **做什么**：交可搬运的方法与流程合同，并配真实可运行采集器；三页作实例。
- **不做什么**：不做平台/万能采集器；不锁旧 schema。
- **风险**：抽象过度或不足。缓解：三页跑通后再定抽象。
- **改动**：主会话。

### D-003 — 证据以可运行页面为主、截图辅助

- **做什么**：渲染值为一手事实；截图仅辅助并标注边界；Figma 先实核再写结论。
- **不做什么**：不把截图升为数值来源；不编造 Figma 结果。
- **风险**：设计稿项目自述示例数据，只能证明方法不能证明业务。
- **改动**：主会话；落点①。

### D-004 — 三页样本取自设计稿项目

- **做什么**：模拟记录列表、模拟工作台、策略工作台；每页真实到达并留原件。
- **不做什么**：不引入 PaperBuilder 产品页作样本。
- **风险**：策略工作台无 h1、模拟工作台需两次点击。
- **改动**：主会话；落点③。

### D-005 — 浏览器入口优先 ego lite，回退可解释

- **做什么**：入口按“优先 ego lite、缺装或启动失败回退 agent-browser”；回退前健康检测与残留清理；首版限本机 localhost 桌面视口单次短任务；失败熔断不静默重试；回退原因逐次记录。首跑做 ego lite 与直连 agent-browser 的**同证据 A/B**，用途是**验证既定优先选择并在结果不支持时回退默认**，比较标准：同一页面同一元素能否取到同字段证据、命令数、失败率、清理是否完整。
- **不做什么**：不并存第二套公共入口；不静默升级；不默认开放任意代码。
- **风险**：改公共入口影响后续卡；现链本机已失败。
- **改动**：主会话；落点②⑦。

### D-006 — 流程与产物契约（模块①）

- **做什么**：
  - **触发**：设计源准备之后、实施开工之前必须提炼一次；来源或规范版本变化后重提炼。
  - **产物**：单份机器可读 JSON，文件名 `design-source-extraction.json`，落任务证据区 `specs/<task-id>/quality/evidence/`；**不生成人读视图**（用户 U-011：体检式数据人审成本高，不花 token 造表格）；需要人看时用只读命令临时查看，不产出文件。
  - **顶层字段**（契约，不可省）：`source`（来源身份：路径/URL、版本或 commit、来源类型）、`scope`（声明的页/状态/视口/元素集/规范类别）、`norm_basis`（所用规范集身份与版本）、`inputs`（五类必要输入：设计来源、目标元素、属性数值、状态、验收点，各自的值与来源指针）、`items`（逐元素/属性：定位、结构事实、渲染值、源码声明值、四态、证据指针）、`gaps`（缺项与影响）、`norm_defects`（规范待修）、`coverage`（分母、已采、缺失、关键项）、`commands`（原命令与输出 ref）、`freshness`（生成时间、来源版本、过期判据）、`failures`（失败原文与类别）。
  - **五类输入的缺项与定向阻断**：每个 `inputs` 键要么有值＋来源指针，要么标 `missing` 并写影响对象（哪些元素/状态/实施步骤受影响）；下游按 `missing.blocks` 定向阻断，只停被点名的实施步骤，其余继续。
  - **不变量**：事实与推断分字段；渲染值与源码声明分字段；截图只能进 `evidence_kind=screenshot` 且不得填渲染值字段；`commands` 每条可回读。
  - **位置与晋升**：采集明细只在任务证据区；其中可复用的组件/token/pattern 事实，经**规范 owner 确认**后才晋升到目标项目规范正文（C01/C08 链），C04 不执行晋升；产物自带 `pending_review`（待议清单）交规范负责人。
  - **引用**：spec「验收对象」的来源（sources 自有 key）＋ Phase「本 Phase 材料导航」＋ 机读依赖登记。
  - **过期**：沿用 `missing`／`stale`／`unknown` 与 `freshness`，判据＝来源版本、规范版本或页面结构变化。
  - **更新边界**：C04 只报“规范缺/冲突/待修”，规范正文修改归 C01/C08。
- **不做什么**：不新建项目级规范文件；不造第二份人读真相；不把观察自动写成标准。
- **风险**：只出机器数据，人审靠工具；晋升需 owner；字段漂移要用契约测试兜。
- **改动**：新增提炼技能（正文含字段契约）＋采集脚本＋契约测试；主会话唯一 writer。

### D-007 — 浏览器入口与页面代码边界（模块②）

- **做什么**：
  - 在现 `isolated-browser-qa` 内加引擎选择：优先 ego lite，缺装/启动失败回退 agent-browser。
  - 允许动作清单：导航、快照、取样式、取几何、取文本/属性、截图、执行**已注册**采集脚本。
  - 页面代码边界：**fail-closed 白名单**——只允许版本库登记过的固定脚本标识；未登记标识执行前拒绝；脚本只读；采纳前验证并留存“页面写入被拒、网络请求被拒”的负向结果。
  - 失败分层：外层包装脚本失败（如 `RECEIVER_IDENTITY_CHANGED`，发生在场景之前）与内层引擎失败分开记；外层失败不靠内层回退解决，按 D-013 处理。
- **不做什么**：不开任意字符串 eval；不并存第二套入口；不静默升级。
- **风险**：公共入口影响面大；登录态复用边界；ego 无证据目录契约。
- **改动**：`skills/isolated-browser-qa/SKILL.md`、`scripts/browser-qa-session.mjs`、`references/*`；主会话。

### D-008 — 提炼方法与采集（模块③）

- **做什么**：
  - **以规范为尺子**：先读目标项目八类规范（领域/视觉/组件/布局/交互/工程/内容/质量），列适用条目（有稳定锚用锚，无锚用章节）；八类都过一遍，不适用写理由。
  - **五维采集**：页 × 状态 × 视口 × 元素集 × 规范类别。
  - **四态**：已有／缺／冲突／待议；规范自身有误另记“规范待修”。
  - **身份证**：元素＝结构树引用＋业务属性；规范条目＝稳定锚。
  - **事实优先**：渲染值优先，源码声明与设计意图另列并记差异。
  - **失败保真**：不存在元素、未就绪、受限 iframe、工具失败留原错误；不默认值、不类名猜像素、不截图补 DOM。
  - **通用性证据**：除 PaperBuilder 规范外，**再用一套规范（仓库自带 `skills/ui-project-init/templates/` 模板集）跑一次八类对齐对账**，证明方法可换项目；两套都只读，不改其正文。
- **不做什么**：不做全库整理；不替 owner 补业务规则；不把四态当规范批准。
- **风险**：跨仓只读；规范过期会抬高冲突数，需与“规范待修”分开。
- **改动**：提炼技能正文＋采集脚本；落点③。

### D-009 — 覆盖分母（模块④）

- **做什么**：正式计分前冻结“必采清单”（页×状态×视口×元素集×规范类别）与关键项，冻结后写变更记录才能改；先做一次**探测运行**摸清页面可达与元素密度，探测**不计入覆盖**、不产出计分数据；正式采集按冻结清单逐项统计，覆盖≥90%，关键项缺失单项否决。
- **不做什么**：不事后调分母；不用总体比例掩盖关键缺口；不把探测结果当正式采集。
- **风险**：两次运行成本；页面不稳导致清单冻结即过期，需重冻并记录。
- **改动**：采集脚本输出 `coverage` 段；落点④。

### D-010 — 低保真与评分（模块⑤）

- **做什么**：本次**不实现数值评分**，评分子项记 `unavailable` 并写明原因；`LOW_FIDELITY` 用非数值判据：**任一类必要输入缺失且无法有源补证、或关键项缺失、或冲突率超声明阈值**（阈值在正式采集前与清单一起写死），触发时按 S5 取得设计 owner 实际裁决；工具失败单独记，不与低保真混。
- **不做什么**：不自造分数；不把“没评分”说成通过；不因评分缺失阻塞输入已齐的实施。
- **风险**：AC-C04-5 的“实际低评分”子项本次无实现，按 unavailable 呈现。
- **改动**：无需代码；落点⑤。

### D-011 — 对照与实施消费（模块⑥）

- **做什么**：对照表由产物派生（页面事实／规范条目／四态／证据）；从三页挑一处区块，在**隔离实施目录、只拿到产物**的条件下还原，再实测回填；事后核对未读设计源码；局部实施有**自己的分母**（只含“所选区块的必要属性/状态”，与三页采集分母分开记，不混算）；初始未实现项保留，返工按 S6 计；局部验证不冒充有稿收益对照。
- **不做什么**：不整页还原；不等后续卡页面；不做假实现凑验收。
- **风险**：同机隔离非硬隔离；一处区块证明力有限，结论边界写死。
- **改动**：实现落隔离目录（非产品代码）；落点⑥。

### D-012 — 接线与维护（模块⑦）

- **做什么**：引用走 spec 验收对象 sources 与 Phase 材料导航，并把新增依赖登记到机读依赖清单（先确认是登记缺口）；新增件在 `docs/architecture/move-map.json` 登记唯一 consumer/owner/退出条件；跨任务复用只针对经 owner 确认后进入规范的部分，任务级明细不跨任务复用，带新鲜度；外部内容：ego lite 首选并记版本、agent-browser 回退、`style-ref-gen` **不采用**（许可未声明）；与 C02 物理隔离与串行。
- **不做什么**：不新增第二权威或专用读取入口；不改 C01 规范正文；不复制未声明许可的技能。
- **风险**：与 C02 并发；机读依赖表改动需确认性质。
- **改动**：三处 workflow 消费点、move-map、skill-deps、提炼技能；落点⑦。

### D-013 — 采集跑不通就停下等修，不降级

- **做什么**：采集路径（含外层隔离脚本或内层引擎）失败时，停止该路径并如实报告失败原件与影响范围，等修复后再继续；**不换直连替代、不带缺口收口**（用户 U-012）。
- **不做什么**：不把“换了条路采到数”当同一证据；不静默降级。
- **风险**：整卡可能等修；其它不依赖采集的工作可继续，但依赖采集的验收项保持未完成。
- **改动**：采集脚本失败分支与阶段收口语义；落点②③。

### 工作包依赖顺序

① → ② → ③（真采＋规范对齐＋第二套对账）→ ④（探测后冻结分母再计分）→ ⑤ → ⑥ → ⑦（与 C02 串行）。

### 方向审查（第 7 步）逐条处置

原件 `quality/reviews/2026-10-25-005-make-decision-direction.json`，`available-with-failures`（kimi 失败，另两路 completed+ok）。

| 发现 | 严重度 | 处置与依据 |
| --- | --- | --- |
| F0 `style-ref-gen` 无 LICENSE 仍列候选 | blocking | fixed：直接关闭为“不采用”，依据其无 LICENSE 与用户 S3 约束 |
| F12 无“已选方向”可挑战 | blocking | rejected_invalid：方向轨按设计是盲审，只给问题不给选择；provider 协议本身是重建→揭示→挑战 |
| F1/F8 产物只作任务证据会导致下游读不到 | major | fixed：改分层（D-006 位置与晋升段） |
| F2/F9 评分可选化混淆低保真与覆盖底线 | major | fixed：D-010 解耦，覆盖与低保真必保 |
| F3 C02 并发覆盖只列风险无方案 | major | fixed：D-012 物理隔离与串行 |
| F4 回退前未考虑现链已失败与残留 | major | fixed：D-005 健康检测＋熔断＋范围限制 |
| F5 `page.evaluate` 缺运行时白名单 | major | fixed：D-007 fail-closed 白名单＋负向验证 |
| F6 ego lite 无证据优势、回退未定 | major | fixed：D-005 A/B 目的与比较标准 |
| F7 三页是示例数据不能声称真实产品覆盖 | minor | fixed：结论边界写入 D-003/D-004 |
| F10 又提“是否补真实产品页”与已定范围冲突 | major | fixed：关闭该问题，范围锁三页 |
| F11 与 F0 重复 | minor | fixed：同 F0 |

## 要改哪些文件

| 文件 | 改什么 | 工作包 | 决定 |
| --- | --- | --- | --- |
| `skills/isolated-browser-qa/SKILL.md` | 引擎选择、允许动作、回退健康检测与熔断、页面代码白名单、失败分层 | ② | D-005/D-007 |
| `skills/isolated-browser-qa/scripts/browser-qa-session.mjs` | 引擎路由与回退记录 | ② | D-005/D-007 |
| `skills/isolated-browser-qa/references/agent-browser.md` | 补 `get styles`/`get box`、ego lite 参考、取值陷阱 | ② | D-007 |
| `skills/design-source-extraction/SKILL.md`（新增） | 方法标准与产物字段契约（含五类输入与定向阻断、四态、身份证、冻结分母、失败保真、过期与晋升边界） | ①③④ | D-006/D-008/D-009 |
| `skills/design-source-extraction/scripts/*`（新增） | 采集器：按冻结清单取值、输出 `design-source-extraction.json`、覆盖统计、原命令 | ③④ | D-008/D-009 |
| `workflows/build-plan/SKILL.md` | 设计源准备后引用提炼契约（何时必须提炼、产物在哪、引用字段） | ⑦ | D-012 |
| `workflows/build-code/SKILL.md` | 实施开工输入加读取产物与 `pending_review` 待议项 | ⑦ | D-012 |
| `workflows/verify-code/SKILL.md` | 对照核验读产物、覆盖结果与 `gaps.blocks` | ⑦ | D-012 |
| `workflows/*/skill-deps.yaml` | 机读依赖登记（先确认性质） | ⑦ | D-012 |
| `docs/architecture/move-map.json` | 新增件登记（consumer/owner/退出条件） | ⑦ | D-012 |
| `tests/contract/design-source-extraction-contract.test.mjs`（新增） | 契约测试：顶层字段、四态取值、分母冻结、`blocks` 定向阻断、失败保真、截图不得填渲染值 | ③④⑦ | D-006/D-009 |
| 第二套规范对账记录（任务证据） | 用 `skills/ui-project-init/templates/` 模板集跑八类对齐 | ③ | D-008 |

## 范围与非目标

- **目标**：让实施者拿到可信、可核对、缺项可见、能对齐规范、过期可判的提炼产物，并在现有阶段入口真实消费。
- **范围**：方法标准与产物契约、浏览器入口改造、三页真实采集与八类规范对齐、两套规范对账、覆盖分母、低保真判决、对照与一次真实消费、接线与维护。
- **非目标**：万能采集器/通用 AST 平台；全项目设计资产整理；观察自动晋升规范；新增阶段/门/第二进度权威；Figma 全库与真实上线；第二套公共浏览器入口；静默升级外部工具；数值质量评分；人读渲染视图。
- **Supersedes**：无。

## 验收面

可观察用例：UC-01 同元素结构与渲染值交叉回读；UC-02 逐缺一类必要信息与定向阻断；UC-03 实施者按产物还原并回填；UC-04 禁读源码下局部实施与独立分母覆盖；UC-05 低保真按非数值判据触发裁决、工具失败单独记；UC-06 换消费者或换项目仍能读到并登记齐全；UC-07 新任务沿用与过期判定；UC-08 八类规范读一页并给四态；UC-09 换第二套规范仍能对账。

| AC 编号 | 可观察用例 | 成功条件 | 失败条件 | 证据 | 承接 | UC |
| --- | --- | --- | --- | --- | --- | --- |
| AC-C04-1 | UC-01 | 两类事实可交叉回读；冲突有原因；未观察项与证据强度明确 | 截图推断 API/语义；类名猜像素；源码声明当渲染值 | unavailable | ①③ | UC-01 |
| AC-C04-2 | UC-02 | 五类输入逐项有值或 `missing.blocks`；只停被点名步骤 | 补默认值；缺项不写影响；评分缺失误阻已齐输入 | unavailable | ①⑤ | UC-02 |
| AC-C04-3 | UC-03 | 实施者按产物还原；初始未实现项不报通过；消费点真实读取 | 只验格式/文件存在；接线无真实读取 | unavailable | ⑥⑦ | UC-03/UC-06 |
| AC-C04-4 | UC-04 | 局部实施有独立分母且运行前冻结；覆盖≥90%；对照驱动；返工≤2 | 换分母/缩范围凑比例；等输入冒充有稿对照；双向禁读说不清 | unavailable | ③④⑥ | UC-04 |
| AC-C04-5 | UC-05 | 低保真按非数值判据触发并取得本次裁决；工具失败单独记；评分子项记 unavailable 且不冒充通过 | 未答/拒绝当同意；评分缺失当完成；失败回空结果；熔断后换路冒充 | unavailable | ②③⑤ | UC-05 |
| AC-C04-6 | UC-06 | 消费点真实读到产物；外部工具/技能有版本、许可、维护者与不采用理由；新增件有唯一 consumer/owner/退出条件 | 只登记不消费；未声明许可当已授权；新增第二权威 | unavailable | ⑦ | UC-06 |
| AC-C04-7 | UC-07 | 新任务能用同一流程与产物；来源/规范变化判 stale 并触发重提炼；回退与升级路径可执行 | 每任务重造；来源变了仍用旧值；静默升级 | unavailable | ①②⑦ | UC-07 |
| AC-C04-8 | UC-08/UC-09 | 八类逐类有适用条目或具名不适用；四态之一；规范缺陷可报；第二套规范对账仍能产出四态 | 只量页面不对规范；四态混写；方法写死在一个项目 | unavailable | ①③ | UC-08/UC-09 |

覆盖结论：R-001～R-023、U-001～U-013 均有落点，尚无一条经过真实执行；逐项见 `quality/evidence/decision-log-refs/coverage-matrix-5d.md`。

## 未决项

| OI 编号 | 问题与来源 | 状态与处置 | 解决者与下一步 |
| --- | --- | --- | --- |
| OI-001 | 字段集能否覆盖三页真实结构 | open；③ 首跑回填（字段名已定，取值待验证） | 主会话 |
| OI-002 | 必采清单尚未枚举 | open；③ 探测后冻结 | 主会话 |
| OI-003 | 评分是否实现 | closed：不实现，子项 unavailable（D-010） | 主会话 |
| OI-004 | 与 C02 共享文件顺序；C01 readiness 串行 | open；⑦ 定稿前确认 C02 状态 | 主会话 |
| OI-005 | `style-ref-gen` 是否采用 | closed：不采用 | 主会话 |
| OI-006 | 外层隔离脚本失败（场景前 RECEIVER_IDENTITY_CHANGED）的处置 | open；按 D-013 停下等修；内层引擎回退不解决外层失败 | 主会话 |
| OI-007 | Figma 是否有可访问源 | open；① 收敛前实核 | 主会话 |
| OI-008 | 三页稳定可达性 | open；③ 首跑确认 | 主会话 |
| OI-009 | `skill-deps.yaml` 无 UI 条目是正文级接线还是登记缺口 | open；⑦ 核实 | 主会话 |
| OI-010 | ego lite 升级时机 | open；升级前问用户 | 用户 |
| OI-011 | ego lite 与直连 A/B 结果 | open；② 首跑做，按 D-005 比较标准定默认 | 主会话 |
| OI-012 | 晋升 owner 与入口 | open；①⑦ 说明为 C01/C08 链，产物出待议清单 | 主会话 |
| OI-013 | 第二套规范（仓库模板集）的粒度和适用面 | open；③ 对账时确认 | 主会话 |

## 风险与延期交接

| 内容 | 触发与后果 | 处理阶段与 owner | 来源 |
| --- | --- | --- | --- |
| 改公共浏览器入口 | 破坏后续卡页面验证 | ②⑦；主会话 | D-005 |
| 页面代码边界失控 | 变任意代码执行 | ②；主会话 | U-008/D-007 |
| 只出机器数据 | 人审靠工具 | ①；主会话 | U-011 |
| 设计稿项目是示例数据 | 只证方法不证业务 | ①⑥；主会话 | 项目页脚 |
| 外层隔离脚本失败 | 采集整体不可用，按 D-013 停 | ②③；主会话 | `quality/tests/2026-10-25-004/005` |
| 与 C02 并发改共享文件 | 断引用、覆盖写 | ⑦；主会话 | C02 工作区实测 |
| 零尺寸冒充成功 | display:none 取盒子返回 0 且 success | ②③；主会话 | 外部调研 |
| 跨仓读 PB 规范 | 过期规范抬高冲突数 | ③；主会话 | PB 规范 README |

### 质量边界

材料、实施、测试、独立审查与物理交付分别报告；未执行保留具体缺口。

## 退役登记

本任务暂无退役对象。母卡已退役的旧做法（旧固定提取工具、旧三 schema、旧双文件规范中心制）由母规划决定；来源 `prd.md:63`、`447-448`。

## 外置事实索引

基准目录＝`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c04-design-source-extraction-20261025`。

| 当前节／内容族 | 下游何处用 | 主文与原件分工 |
| --- | --- | --- |
| 任务身份 | build-plan 读类型与根 | 身份/范围留主文 |
| 级别与路线 | 流程/审查/收口/验收前读 | 唯一入口事实只在本节 |
| 原始需求 | spec 写来源与验收边界 | 原义、FR 对号留主文 |
| 需求变更记录 | build-plan 取真实选择 | 每 U 最小决定留主文 |
| 工作包与决定 | build-plan 拆结果与 writer | 四字段决定与依赖顺序留主文 |
| 要改哪些文件 | build-plan 分写集 | 具体改动与 owner 留主文 |
| 范围与非目标 | build-plan 继承边界 | 取舍与理由留主文 |
| 验收面 | spec 承接同号 Appendix A | AC 表与 UC 留主文 |
| 未决项 | build-plan 处理未决输入 | 问题/状态/owner 留主文 |
| 风险与延期交接 | spec-analyze 核边界 | 触发/后果/阶段/owner 留主文 |
| 退役登记 | build-plan 继承退出决定 | 对象/理由/决定人留主文 |
| 外置事实索引 | 定位来源 | 基准目录/唯一 ref |

| 原件定位 | 到达条件 | 主文留什么 |
| --- | --- | --- |
| `quality/tests/2026-10-25-003-c04-entry-evaluation.output` | 核对入口分级 | 本节原值与 ref |
| `quality/tests/2026-10-25-004/005-*isolated-chain-probe*` | 核对隔离链失败 | 失败签名与次数 |
| `quality/tests/2026-10-25-006/010/013-c04-*` | 核对取值能力 | 字段与实测值 |
| `quality/tests/2026-10-25-007/008/009/011-*` | 核对三页可达性 | 路径与限制 |
| `quality/evidence/research/2026-10-25-design-source-extraction-外部一手调研.md` | 核对覆盖/评分/许可/截图结论 | 结论与 candidate |
| `quality/evidence/research/2026-10-25-ego-lite-capability.md` | 核对 ego lite 能力 | 能力与未做 |
| `quality/reviews/2026-10-25-005-make-decision-direction.json` | 回读方向审查 | 发现与覆盖 |
| `quality/reviews/2026-10-25-009-make-decision-detail.json` | 回读细节审查 | 发现与覆盖 |
| `quality/evidence/decision-log-refs/requirement-index.md` | 按 R 编号定位原义 | R 原义与落点 |
| `quality/evidence/decision-log-refs/requirement-change-log.md` | 回读 U 完整变更 | 每 U 最小决定 |
| `quality/evidence/decision-log-refs/coverage-matrix-5d.md` | 核 R/U 落点或缺口 | 覆盖结论与缺口 |
| `quality/evidence/decision-log-refs/attack-self-check.md` | 回读攻击自查 | 结论与可推翻条件 |
| `quality/evidence/decision-log-refs/divergent-candidates.md` | 复核被否候选 | 候选与取舍 |
| `quality/evidence/decision-log-refs/review-dispositions.md` | 处置 finding | 编号与结论 |
| `quality/evidence/human-confirmations/` | 核对用户确认 | 确认范围与来源 |

## 阶段核对（第 14 步，确认后只读核对）

确认原件：`quality/evidence/human-confirmations/2026-10-25-001-make-decision-approved.json`，decision=approved，reply 原话为“同意……不要催着我往下进下一个阶段”，materialRefs 指向本 decision-log，记录时 HEAD `86695f18332b5f61ccab534821eeace9f6bfbdfd`。

| 核对项 | 结果 | 依据 |
| --- | --- | --- |
| 原始需求逐条 | R-001～R-023 在覆盖矩阵各有一行落点；U-001～U-013 各有一行落点 | `quality/evidence/decision-log-refs/coverage-matrix-5d.md` |
| 当前决策与用户所见一致 | D-001～D-013 与 9 批答复一致；未把未选路线写成已选 | `quality/evidence/decision-log-refs/requirement-index.md` 一/七/九 |
| 真实问答 | 9 批，逐字保留；用户 3 次自由答复原样入索引 | 同上 |
| 审查与处置 | 方向 13 条、细节 12 条，逐条 fixed/rejected 与理由 | `quality/evidence/decision-log-refs/review-dispositions.md`、`quality/reviews/2026-10-25-005/009-*` |
| 术语写入读回 | GLOSSARY.md 新增“提炼产物／规范对齐四态／必采清单／隔离实施目录”，写入后读回在第 135/138/141/144 行 | `GLOSSARY.md` |
| 流程检查 | `run-checks` exit 0；`missing_steps=[]`；`steps_unattested` 为 make-decision 15、build-plan 12、build-code 12、verify-code 8 步未留痕；`chain_state=unverified`；10 环多数 unavailable | `quality/tests/2026-10-25-020-c04-run-checks.output` |
| 冲突与漏项 | 无未修的功能性漏项；遗留缺口：facts 阶段行未写（公共命令不代填阶段事实，未伪造）、成本无记录（start-ref 未唯一匹配，工具 exit 2 已留原件）、未做任何 Git/提交 | 本日志与 `quality/tests/2026-10-25-021-c04-make-decision-cost.output` |

核对结论：材料对应用户实际所见内容；缺口与未执行项如实保留，不因本核对扩大为实施或质量结论。

## C02 交付后的更名与读取点更正（2026-10-25，main `bd207d35`）

- **事实**：C02 已合入 main（`3bd265b8` 合并、`bd207d35` 归档）。`skills/ui-project-init/` 更名为 `skills/project-norm-init/`，模板扩到 11 份（含 acceptance/api-contract/backend-architecture/domain-semantics/frontend-engineering/visual-design-system）；新增「非UI规范与索引」（`skills/project-norm-init/SKILL.md:31`），build-plan `:24`、build-code `:26`、verify-code `:15` 要求先读适用的后端/接口/验收源；新增 `skills/norm-sync/`、`skills/stage-closeout/`、`specs/{acceptance,api,backend}/`。
- **影响与处置**（不改原决定的取舍与验收）：
  - D-008 中的“仓库模板集”路径更正为 `skills/project-norm-init/templates/`；决定内容不变（仍以仓库自带模板集作第二套规范对账）。
  - 本任务适用非UI 类：验收（oracle/证据/完成规则）、接口（脚本参数与错误语义）、后端（运行时边界）；设计/前端判不适用并写理由；相应读集与动作补进 P1/P3/P5/P7。
  - P6 的“C02 先写、C04 后写”条件已满足，C04 直接按序写，并在写入时保留 C02 新增的非UI 段落。
  - C02 遗留：build-code/verify-code 正文引用 project-norm-init 但 `skill-deps.yaml` 无该条目；本卡只补 design-source-extraction，遗留缺口如实记入风险（RISK-05）。
- **未改**：原决定正文、R/U 编号、八条 AC、范围与非目标；本次只做上游改名与读取点的适配。
- **确认状态**：build-plan 计划确认（`quality/evidence/human-confirmations/2026-10-25-002-build-plan-approved.json`）早于本次上游适配；本次适配属引用与读集更新，未改范围与判据。如用户认为构成计划变更，按 build-plan 重新确认处理。
- **证据**：合并提交 `bd207d35`；材料重发布后的契约校验 ok；P4 预写测试路径更新后重跑 RED（`quality/tests/2026-10-25-044-c04-red-norm-after-c02.output`，exit 1，目标断言失败）。

## 本次用户更正：复用已开 ego，避免打断（2026-10-25）

来源为当前会话用户决定，由主会话明确中继授权本次修订；本段不是用户逐字聊天原件。用户要求停止反复新建ego实例、窗口和初始化，改为复用已开ego中的新owned TaskSpace；不要求用户命名、不用CUA、不focus或操作原有tab。此前独立实例研究与生产尝试及失败原件全部保留，不能把那些结果迁作本路线通过。资源停止读回见任务库 quality/evidence/2026-10-25-074-c04-p2-stop-owned-readback.json。

本次只覆盖D-005/D-007在本任务ego分支的执行形态与通用isolated-browser-qa默认fresh实例要求；agent-browser/browser-use原隔离流程、D-007注册只读边界和八条AC原分母不变。TaskSpace仅承接页面生命周期隔离，其profile的Cookie/cache/storage可能共享；不声明独立存储或匿名。auth none只表示本方法不主动读取、export或inject凭据，浏览器正常请求仍可能附带该profile现有凭据；固定采集不得读Cookie/storage。票据复用仍沿原显式授权规则，不把现有登录态当额外读取授权。

执行者先消费官方guide及真实后台行为研究，再调用新owned TaskSpace；API若会抢焦点，停该调用，保持unavailable，不通过新窗口/初始化或操作用户tab补救。实际真QA限受控localhost、一次必要范围；页面写入/fetch/XHR负例仍须生产wrapper执行、保证副作用为零并恢复。当前AC-C04-5保持incomplete，旧owned双实例存储事实不证明此路线存储隔离；不变更其它AC或扩大任务范围。

当前执行边界补正（主会话2026-10-25中继用户“直接已开ego新工作区”，继此前要求“不再启动/初始化新窗口”）：默认复用已开ego模式无隐式启动回退。缺运行实例、获取失败、权限或取消均明确报错，不能自动打开agent-browser/新窗口；原FR-EXTRACT-003内“内层启动失败回退”在该模式由用户最新指令覆盖，不冒原回退通过。显式agent-browser/browser-use原隔离路径保留；引擎缺失的纯选择/回退记录仍可测，不能据此声称当前模式实际启动其它引擎。AC-C04-5按当前模式核拒绝、非零失败、记录与无换路，完整低保真裁决仍由对应后续Phase承接。此解释待独立Spec核，不由实施者自签。
