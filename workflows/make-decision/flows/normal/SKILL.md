---
name: make-decision-normal
description: 普通任务在定方向内完成方案审、一次确认、实施与整次代码审，然后收口交付。
---

# 普通流程

## 材料、身份与读取点

先只读根 SKILL「入口路由」及 decision-log.md「级别与路线」，选中本路线后执行以下步骤；不重跑复杂15步。流程步骤、实施/审查、收口、验收各在到达时重新读取同一节，缺失按复杂并记具体缺口与owner，不把推荐当用户授权。七项事实与风险来源沿入口函数，级别不写入新字段。

本路线所有方案、确认、实施、测试、适用审查与收口都在 make-decision 内完成，只写 make-decision 一行阶段事实；不写 build-code 阶段行，也不写 verify-code 阶段行。spec、独立 Phase 与纯指针 phases/index.md 是材料，不是阶段执行。复用 spec-specify/spec-plan 原方法，按 AGENTS post 材料覆盖条款写入；不得新增运行时 Phase 数量 gate。

不写死问题数或轮数，收敛以真实未决清零为准；零未决写来源与理由，跳过是不调用，不用空跑或复制技能充数。每项未知保实际缺口与下一owner。


流程执行者选步骤前读取「级别与路线」；确认后实施与组装审查前读取「级别与路线」；反思与物理交付前读取「级别与路线」；逐 AC 对账前读取「级别与路线」。原 ref 缺失或不可回读、该节或关键事实缺失时记具体缺口与 owner，按复杂路线处理，不冒用户授权，不用另一节重复原值兜底。
## 中途重判

每次取得真实改动与影响证据、准备继续步骤或审查时，对照已选路线承诺的交付物、AC、独立用户故事是否变化；核跨层或层间影响，以及新增架构、迁移、权限、安全等未知风险。真实 diff 与影响证据用于说明变了什么，不凭 diff 大小或 Phase 数量改级或加审。

发现超出原判断的影响就暂停相关路径，按根 SKILL「入口路由」重新推荐并展示证据，回用户真实选择；未答不得改级，保留原选择和待答，其余授权内安全工作继续。已有授权继续有效，分别核对当前授权是否涵盖改动、真实写集是否越界；新增方向或范围未获许可时回用户选择，只停该相关路径，审查建议不能代用户改级。

在同一决策记录 decision-log.md「级别与路线」追加变更，保留旧级别与旧判断，写新推荐、证据原 ref、用户真实选择或未答、理由、新范围与影响；入口取值沿唯一原 ref，不复制原始返回，不改写历史判断。

升级保留已完成的方向、方案、spec/Phase 与实施，只补未做步骤与适用审查，已写代码补一次代码审，不重做调研；按根 SKILL「升级到复杂流程与材料接管」逐项核已有输入和真实缺口后接续。只有用户明确选择才降级，并记录理由与新范围；代理只能建议，不得自动降级。风险未变保持原级别与原路线，风险未变不加审；小改动仍无独立审查，不因“看起来大”改判。

## 步骤

### 1. `entry-route` — 入口与级别

**产物**：入口事实、推荐普通理由与真实用户选择写在决策记录同节。

**进入下一步条件**：同批展示推荐/高亮/理由与可覆盖选项，七项事实完整且风险无硬覆盖；缺失或未答按复杂并记缺口。

### 2. `outline-hypothesis` — 完整大纲

**产物**：目标、边界、模块方向假设、验收与推翻依据可读。

**进入下一步条件**：模块与独立交付结果能对应，假设不冒已定方案。

### 3. `internal-research-talk` — 内部调研与真实问答

**产物**：实际执行内部调研，按 knowledge-graph 先图后源，再用 talk-with-zhipeng 消费结论、候选与真实答复；外部仅按会改变方向的缺口。

**进入下一步条件**：真实内部原文/结论与未决可定位，不用空skipped代替；未答不当已选。

### 4. `module-convergence` — 逐模块收敛

**产物**：按模块消费 N6 调研/发散/收敛/就地讨论/定验收五段，方案、替代、验收、后果与真实决定有原件；深度随模块。

**进入下一步条件**：每个未决项有处置，真实未决清零；零未决记录来源与理由，不写死问答轮数。

### 5. `write-light-materials` — 写方案与Phase

**产物**：spec 在极简五类节基础上加现状、备选与依赖；逐行POSIX写集、AC、oracle/测试命令与风险齐备；1–2 个 Phase 与纯指针 phases/index.md。

**读取**：方案作者先实际读取 skills/spec-clarify/SKILL.md 原方法，提供当前 spec、已确认上游决策材料与受控 named-artifact callbacks，沿原输入合同核对，不自行发现项目路径，也不启动 build-plan。

**分类**：逐条区分 Locked upstream decision（已答/已定上游决定）、Upstream unresolved item（上游明确留给规格的未决项）、New ambiguity（草稿中新发现歧义）。继承真实已答与适用范围、原选项/顺序/推荐和语义，不给已定决定换名重问。

**十维核对**：对原始需求与当前事实逐项核 user journey、page/surface、data/state、success、failure、permissions/actors、integrations/external effects、non-goals、deferred handoff、acceptance/evidence。unknown/deferred 保真实缺口，写影响范围、具名 owner 与下一动作，不补造事实或决定；这只索引未决，不另建规格或账本。

**分支与续步**：无实质歧义时显式记录 trigger=false、具名原因和零开放方向问题，这是已执行核对的结果，不是免读原方法。有实质歧义时仅当前 frontier 中已具前提的独立轴批问，不提前问依赖轴；发布卡即归还控制，结束当前调用。未获真实回复不修改 spec、不启动审查、不推断或代答；真实回复后按原方法续当前第5步，仅续已具前提轴，部分未答仍留未决，已答不复问。环境事实由 agent 核实，冲突 locked 决定的候选不伪装新选择；无法在原决定内成立就报告具体矛盾与修复条件，不能让用户补造选项。此处澄清不新增方案确认点；原一次确认顺序不变。

**进入下一步条件**：默认 1 个 Phase，确有独立交付单元才 2；数量是作者义务，不新增runtime gate。spec-specify/spec-plan 与 spec-clarify 原方法实际消费完，有驾驶舱则按下节更新。

### 6. `detail-review` — 一次方案审

**产物**：沿 wh-review 现有 detail 细节轨做整体方案审一次，完整材料、真实provider终态、原始finding/失败及处置可回读。

**进入下一步条件**：已完成逐模块收敛；不增加逐模块审，审查失败/不可用保持真实，方向与验收分歧交用户，不伪造通过。

### 7. `approve-solution` — 一次确认

**产物**：用户对方向＋方案的真实一次确认。

**进入下一步条件**：对 N6 两次确认的降级：跳过单独骨架确认，理由是方案审前已收敛，确认方案即确认骨架；未答停草稿，确认后才实施。

### 8. `implement-and-test` — 实施与目标测试

**产物**：确认后实施，逐项比较 git diff --name-only 的真实 diff 与声明写集；跑目标测试保存命令、cwd、退出、回执与AC结果。越界写及失败各记具体路径/测试名、原因和原件。

**进入下一步条件**：越界暂停该路径回用户选择，测试失败暂停物理交付，按 diagnosing-bugs 修到通过；无法修保原件，仅用户真实接受具名剩余风险/责任人后继续，未答不继续。

### 9. `implementation-review` — 整次实现审一次

**产物**：主动调用现有 review --action=record --stage=build-code 入口发起代码审，直接复用 workflows/build-code/SKILL.md 的审查面、材料与 provider；整次实施一次，不按 Phase 分审或裁剪整工作区真实 diff。输入含当前spec、完整AC/验收、目标测试回执/原件、真实改动路径与diff、声明写集、阶段合同及所需镜头。

**进入下一步条件**：请求/结果绑定同一 task_id；stage=build-code、review_scope=phase、subject_kind=phase、review_kind=null、phase_id=null，保持P2窄fulltuple，不省略身份冒null。审查记录挂 build-code 名下且落 quality/reviews；任务阶段仍是 make-decision，不写 build-code 阶段行，也不写 verify-code 阶段行。报告写清差异：「审查面是 build-code，任务阶段没跑 build-code」。按原build-code同次OCR与Standards/Spec补充方法保存各轴原件/失败/覆盖，不新增mini规则或逐Phase审查点；有效finding修复回原实施者，仅复验受影响case。

### 10. `reflect-and-handoff` — 一致性核对与反思收口

**产物**：验收者再读级别与路线，按 spec-analyze 对照真实原件与缺口；stage-reflection 写业务仓 specs/Improvements.md 经验或具名无发现依据，越界不可用不回落工具仓；内部 stage-handoff 发布并读回唯一绝对路径。

**进入下一步条件**：归纳→分类→真实阶段成本→发布→报告沿原owner，同一窗口只测一次；失败写本阶段无记录与原因，不填0。反思不做Git，审查身份差异与实际测试限制同报。

在原出页条件已触发或已有当前驾驶舱时，逐AC结论形成后按 skills/answer-as-page/SKILL.md 共同接口首次核对并刷新页面与同名侧车；未触发具名说明，不强制出页。

### 11. `closeout` — 物理交付

**产物**：实现与适用审查结束、有效finding处置后调用 stage-closeout；PR正文读当前spec，按授权执行提交/PR/合并，最终归档清理前展示实际范围并沿原owner取得一次真实确认。

**进入下一步条件**：收口执行者再读级别与路线与真实测试/审查原件，确认stage随实际make-decision；交接可独立读回，物理交付与反思分开，失败/未执行/清理分别说明。

物理交付/PR完成后在同一出页条件下按 skills/answer-as-page/SKILL.md 同一共同接口第二次核对并刷新页面与同名侧车、保旧件；仍属make-decision，不新增verify-code阶段或审查。环10只取报告事实，无真实交付声明不伪填PR，声明待交付时记skipped。

## 技能清单

下表逐项承接父 PRD 原31共用技能分母，必需／按需／跳过写在各自流程，不建中央矩阵。除退役项外统一读取 skills/<name>/SKILL.md 的唯一原定义，条件未命中就在当前日志写具体未触发理由，不因表中有名字而加载或调用全部技能。

| 技能 | 适用 | 触发或未触发理由 |
| --- | --- | --- |
| `mini-task` | 跳过 | 原31分母保留其名；独立路线已退役，入口能力改由 workflows/make-decision/scripts/entry-evaluation.mjs 承接，不读已删技能。 |
| `talk-with-zhipeng` | 必需 | 大纲、模块或任务卡收敛中的真实问答消费原方法；未答保待答。 |
| `decision-log` | 必需 | 每次来源、决定与未决项写入当前唯一日志前读取原方法。 |
| `deep-research` | 必需 | 调研步骤按真实缺口读原 R0–R5 方法；内部必做，外部仅按缺口与授权。 |
| `anysearch` | 按需 | deep-research 的外部发现获准且有真实缺口才调用；否则写未触发理由。 |
| `grill-with-docs` | 按需 | 出现已解决领域术语/冲突或需要质询时读原 owner；无触发留有源 no change 理由。 |
| `spec-clarify` | 必需 | 第5步先消费原方法的三分类与十维核对，再判问答；无实质歧义显式 trigger=false、具名原因和零开放方向问题，已答不复问。 |
| `spec-specify` | 必需 | 写方案步骤复用原方法与 WR001，产本级 spec，不启动 build-plan。 |
| `spec-prd` | 跳过 | 当前路线不写PRD，已有真实需求材料直接消费。 |
| `spec-analyze` | 必需 | 确认后及收口前按原方法核材料、真实答复与实际原件，一致性不冒验收。 |
| `testing-system-blueprint` | 按需 | 需要确定新测试方案时消费；已有明确目标 oracle 则直接使用，不重建体系。 |
| `test-routing-advisor` | 必需 | 实施前按真实 changed files 选择 simple/feature/fullstack 与针对性测试路线。 |
| `backend-testing` | 按需 | 命中后端/合同面才实际读并执行目标正反例；无后端写集写不适用。 |
| `frontend-testing` | 按需 | 真实前端写集才读与执行；无前端改动不调用。 |
| `fullstack-slice-testing` | 按需 | 跨端真实调用链才读；超出本级风险先沿级别与路线回用户选择。 |
| `isolated-browser-qa` | 按需 | 产生页面或真实浏览器可见变更并需要验收才读；无页面/浏览器面写不适用，不冒截图通过。 |
| `project-norm-init` | 按需 | 已授权目标确需新UI工程时读；无新工程不调用，风险扩大先重判。 |
| `design-source-readiness` | 按需 | 存在需消费的真实设计来源时读取；无来源或无UI设计面写未触发。 |
| `frontend-prototype-render` | 按需 | 需要真实原型帮助用户选择且在授权内才读；不靠原型替正式实现或验收。 |
| `frontend-component-quality` | 按需 | 真实UI组件改动触发原质量检查；无组件写集不调用。 |
| `wh-review` | 必需 | 方案审沿 detail 轨一次；整次实施一次代码审沿 build-code 面/provider。 |
| `intake-decision-review` | 跳过 | 普通不另开方向审查点；不把 intake 方向 lens 塞进 detail 包。 |
| `plan-ceo-review` | 按需 | 方案/方向审查真实选中产品镜头才读，不额外发起审查轮。 |
| `review` | 必需 | 整次实现审引用 build-code 同源 Standards/Spec 方法与同scope材料，轴不增审查点。 |
| `simplicity-guard` | 必需 | 当前方案取舍或已有审查 packet 使用原 P0–P3/并发镜头；不单开审查。 |
| `plan-design-review` | 按需 | 存在实际设计面且当前方案审选择该镜头时消费；否则记录未触发。 |
| `architect-code-review` | 必需 | 代码审同次补充轴复用原方法与完整AC，不增加逐Phase审查。 |
| `diagnosing-bugs` | 按需 | 真实测试RED/失败或性能回退时读原紧反馈方法；无失败不空跑诊断。 |
| `stage-reflection` | 必需 | 阶段末一次归纳、经验、交接、真实成本；局部Phase不另开成本窗口。 |
| `stage-handoff` | 必需 | stage-reflection 内部发布并独立读回同一份交接，不重复发布。 |
| `resolving-merge-conflicts` | 按需 | 已授权物理交付遇真实merge/rebase冲突时读；无冲突不调用。 |

材料作者另须在写方案步骤读 skills/spec-plan/SKILL.md 原 Phase+纯指针索引方法；它不替换31分母。 answer-as-page 与 stage-closeout 也不替换原31分母：前者按下节出页条件消费；后者在最后一步物理交付消费 skills/stage-closeout/SKILL.md，授权与最终close确认沿原owner。

## 驾驶舱

到达出页条件时调用 skills/answer-as-page/SKILL.md 原方法：三个以上相关概念、分支、多维对比或层级关系适合出页；没有这些信息形状时记录未触发理由。符合条件才由本流程主会话作为生成 owner 调用，不以示例数据或产物存在冒真实生成。

出页后四类更新时点为：骨架确认后、每细化完一包、方向/范围/验收实质变化、Phase 定稿或收口前；只改措辞或指针不生成。路径由调用者指定，默认任务库证据区 overview-<date>.html 与同名 .nodes.json；同一页面 owner 串行更新，先读旧页/侧车，安全原子写，中断保旧件与真实失败。

页面按skills/answer-as-page/SKILL.md 原 owner 的当前页面结构读取当前材料、task facts、测试、审查、真实改动；缺环标「缺」，未产生写「尚未产生＋到时会填什么」。顶部显示 decision-log 的 sha256/字节/行数指纹、时间与当前步骤。页面是只读派生，不新增进度账本，不反写任务事实；来源、比较基准或工具缺失如实记录。生成/QA 仍沿 answer-as-page 与 isolated-browser-qa 的真实场景；未生成不报页面通过。

## 方法来源与失败

方法写作指向 skills/spec-specify/SKILL.md「技能写作规范（WR001）」；本流程仅编排，不复制专业方法。原始执行、测试、审查与用户答复沿现有记录接口保单份，失败和未执行保持真实。表与正文通过只证明材料契约，真实调用/页面/同范围减负与成本必须按当前spec验收，未取得写 incomplete 与具体条件/owner。
