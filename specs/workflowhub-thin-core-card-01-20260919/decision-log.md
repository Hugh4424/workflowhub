# Decision Log

## 任务身份

在首次正式需求提问前填写一次；固定标签只能出现一条。

- **任务类型**：普通任务
- task_id：workflowhub-thin-core-card-01-20260919
- worktree：/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-01-20260919
- branch：task/workflowhub/workflowhub-thin-core-card-01-20260919
- 承接来源：母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` 的 CARD-01（prd.md L233-263），该 PRD 已 final（U-010 版，2026-09-19）
- 原始要求来源：当前用户会话；本 decision-log 只记方向、边界、验收口径与交接

选 `普通任务` 的理由：本卡要改的是入口、阶段拓扑、流程清单语义与门禁骨架位，这些都必须谈实现层落点才能被验收；`规划任务` 的提问边界明确禁止文件面、命令形态与 schema 形状类问题，会把实现细节整体推给 build-plan 自行猜测。

**材料重建事实（如实登记）**：本文件曾于 2026-09-19 建立并通过三处运行时校验，随后因外部对仓库执行 worktree 清理而作为未跟踪文件丢失（全盘与回收站均无副本，无对应 dangling commit）。本版本由主会话依据当前会话内的真实记录逐字重建，内容与丢失版本一致，并保留了丢失前的全部校验修正。该事故本身作为事实登记在「风险与延期交接」节（RK-007）。

**基线对齐事实**：重建时已将本 worktree 分支快进对齐到 `main`=`05f54ee9`（该提交包含母规划分支的合并与 `5a4ddf54 repair wh-review managed review protocol (F1-F7 transition baseline)`），分支与 main 完全一致。

## 原始需求

> 来源：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` L233-263（CARD-01 卡片全文）。
> 以下 R 编号沿用母 PRD「需求覆盖结论」逐条追踪表的编号，只摘取 CARD-01 责任范围内、或对本卡构成边界的条目；母 PRD 中归其他卡的 R 不在本表重复。

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 真实入口可发起规划任务，拓扑恰为 make-decision→build-prd，不含 build-plan/build-code/verify-code | prd.md L239 FR-01；L246 AC-01 | D-001 / 覆盖 |
| R-002 | 真实入口可发起实施/普通任务，拓扑恰为 make-decision→build-plan→build-code→verify-code | prd.md L240 FR-02；L247 AC-02 | D-001 / 覆盖 |
| R-003 | 任务类型由人工选择，不存在按任务大小的自动分流 | prd.md L241 FR-03；L248 AC-03 | D-001 / 覆盖 |
| R-004 | 固定 Talk 轮次、14 步顺序锁定、stage completion 通用认证不再构成任一阶段的前置阻断条件 | prd.md L242 FR-04；L249 AC-04 | D-002 / 覆盖 |
| R-005 | 曾被「缺认证/固定轮次」阻断的路径，移除阻断后相关事实如实记录，不漂白历史 | prd.md L243 FR-05；L250 AC-05 | D-002 / 覆盖 |
| R-006 | 任一阶段推进不依赖机器/流程门禁：revision 绑定链、快照树认证、材料身份/哈希/sha 校验、回执校验均非推进前置 | prd.md L244 FR-55；L251 AC-56 | D-002 / 覆盖 |
| R-007 | 新系统仅两道人为门：①推进中的人为确认对话；②不可逆 Git 授权（宪法级） | prd.md L235 结果与 consumer；SD-17 L94 | D-002 / 覆盖 |
| R-008 | 规则类要求（迁移表冻结、并行声明、接口蓝图冻结）降级为事实记录+验收核对；未做=验收失败事实，不阻断推进 | prd.md L235；SD-11 L70；OI-012 L177 | D-002 / 覆盖 |
| R-009 | 阶段状态使用窄状态集 7 值（not-started/in-progress/succeeded/failed/blocked/unverified/abandoned） | prd.md L237；SD-03 L38 | D-003 / 覆盖 |
| R-010 | 拓扑与 U-008 逐字一致；规划旅程不进代码阶段，到 build-prd 结束 | prd.md L237、L252 oracle；决策日志 L94-98 | D-001 / 覆盖 |
| R-011 | 本卡范围不含文档权威细则（CARD-02）、子代理方法（CARD-03）、删除执行（CARD-06）；共享写面须先冻结接口蓝图 | prd.md L236 范围；L256 合并依赖；L257 集成责任 | D-004 / 覆盖 |
| R-012 | owner/合并责任/验收责任在本 task 开工（make-decision）时指派 | prd.md L231；SD-14 L82 | D-004 / 覆盖 |
| R-013 | 局部风险：去阻断被误做成掩盖失败（R3）；拓扑纠正影响所有后续卡，改错代价全局 | prd.md L259 | D-005 / 覆盖 |
| R-014 | 可后置技术项：入口分流的内部实现形式（配置/参数）留本卡 build-plan 定 | prd.md L260 | D-005 / 覆盖 |
| R-015 | 本卡为规划任务产出的实施卡，母任务与兄弟卡材料只读；不触发母任务 close，不移动/删除其文件 | prd.md L262 五阶段开工说明 | D-004 / 覆盖 |

### 需求框架（先选一类，再逐步回填）

- **framework**：`functional`（背景→问题→目标→方案→验收→扩展）
- **选择理由**：本卡是需求翻译与流程拓扑改造，不涉及需要外部证据裁决的论断；用户方向决定已在母 PRD 中完成，本阶段只需把方向落成可实施、可验收的边界。
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；混合任务以 `functional` 为外层，在受影响节点下挂 `research` 子树。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | 背景 / 问题 | open | pending | make-decision | Talk round 3 或新事实出现 |
| N-002 | 目标 / 论断 | open | pending | make-decision | 目标边界变化 |
| N-003 | 方案 / 证据 / 裁决 | open | pending | make-decision | 方向建议或 Grill 提出新方案 |
| N-004 | 验收 / 扩展 | open | pending | make-decision | 验收口径变化 |

### 唯一 OI 大纲（current authority）

大纲只存在于本份 `decision-log.md`；不得另建需求账本、状态机或第五份材料。
本表在调研前建立，之后只在这里回填 OI。

- **outline_version**：`outline-v2`（2026-09-19 建立为 outline-v1；Talk round 1/2 答复回填；Grill G-001..G-003 后按材料变化升为 outline-v2）

#### Framework nodes

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background | OI-001 | false | 母 PRD CARD-01 的真实动机与历史阻断事实需落成可核对背景 |
| N-problem | problem | OI-004, OI-006 | false | 现有骨架的固定轮次/顺序锁/通用认证是否真的阻断推进，需定位与界定 |
| N-goal | goal | OI-001, OI-003, OI-009 | false | 两类旅程可达性、拓扑权威定义与类型读回是本卡目标核心 |
| N-solution | solution | OI-002, OI-004, OI-005, OI-006, OI-007, OI-010 | false | 入口位置、拓扑归属、流程清单语义、门禁边界、状态落点共同构成方案 |
| N-acceptance | acceptance | OI-008, OI-011 | false | 验收口径与卡间边界决定本卡能否被独立验收 |
| N-extension | extension | OI-012 | false | 延期项与后续卡消费关系需显式登记 |

#### Fixed categories

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-001, OI-002, OI-009 | false | 两条任务类型旅程的端到端流程与类型读回是本卡第一交付物 |
| page_scope | （无） | true | 本卡不新增页面、仪表盘或前端组件；母 PRD 已判 ui_applicability=non_ui（prd.md L22、L258），本卡改动面是流程定义、阶段清单与门禁骨架位，不含展示层 |
| data_state | OI-010 | false | 任务类型/阶段/状态信息的存放位置需要明确 |
| success_failure_boundary | OI-004, OI-006, OI-008, OI-011 | false | 去阻断边界、门禁底线、验收口径与验收责任都必须在本阶段写成可执行形式 |
| non_goals | OI-005, OI-007 | false | 非目标需逐条列出以免范围漂移 |
| deferred | OI-012 | false | 入口分流实现形式等延期项需显式登记 |

#### OI records and consumers

```json
{
  "ois": [
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-001",
      "category": "complete_user_flow",
      "source": "R-001, R-002, R-010 / prd.md L239-240, L246-247",
      "question": "两类任务（规划/实施）各自的完整旅程与终点是什么，是否需要新增第三个终点？",
      "resolution": "用户确认：规划任务=make-decision→build-prd，到 build-prd 结束、不进代码阶段；实施任务=make-decision→build-plan→build-code→verify-code；沿用仓库现有 workflows/build-prd（Grill G-001 补充：该 workflow 当前被硬编码排除名单挡住，本卡须真接线使其可从入口执行），不新增第三个终点",
      "status": "confirmed",
      "impact_dimensions": ["goal", "acceptance"],
      "selected_disposition": "规划任务=make-decision→build-prd 两阶段即结束，不进入 build-plan/build-code/verify-code；实施任务=make-decision→build-plan→build-code→verify-code 四阶段；复用现有 workflows/build-prd，不新增第三类旅程",
      "evidence": "R-001、R-002、R-010；Talk round 2 问题「规划旅程」用户选择「用现有 build-prd，接上入口」",
      "acceptance": "AC-01 与 AC-02：规划任务阶段列表逐字等于 make-decision→build-prd 且无第三阶段；实施任务四阶段齐备且顺序正确",
      "counterexample": "规划任务多出 build-plan/build-code/verify-code 任一阶段，或为规划任务另建第三个终点",
      "requires_user_decision": true,
      "visible_group_id": "G-旅行拓扑"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-002",
      "category": "complete_user_flow",
      "source": "R-003 / prd.md L241, L248",
      "question": "「任务类型由人工选择」发生在哪个位置——CLI 参数、会话开头提问，还是建任务后在 make-decision 内声明？",
      "resolution": "用户确认：先建任务，任务类型在 make-decision 内用受控值声明并由 readTaskTypeFromDecisionLog 读回；入口不新增类型参数、不新增自动分流",
      "status": "confirmed",
      "impact_dimensions": ["scope", "ordinary_detail"],
      "selected_disposition": "先建任务，任务类型在 make-decision 内声明（受控值 规划任务/普通任务），入口不新增类型参数；类型选择由人工做出，不按任务大小自动分流",
      "evidence": "R-003；Talk round 1 问题「真实入口」用户选择「先建任务，类型在 make-decision 里定」",
      "acceptance": "AC-03：构造两个体量显著不同的任务发起后均停留在人工选择处，无任何代码路径按任务大小自动改写任务类型",
      "counterexample": "任一任务被按体量自动分流，或类型由请求内容、文件名、历史记录或哈希推断得出",
      "requires_user_decision": true,
      "visible_group_id": "G-旅行拓扑"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-003",
      "category": "complete_user_flow",
      "source": "R-010, R-014 / prd.md L237, L260",
      "question": "两类任务的阶段拓扑（哪几个阶段、什么顺序）由什么东西权威定义？",
      "resolution": "用户确认：写进工作流定义，按任务类型分两条入口变体；阶段列表逐字可核对，不靠运行时动态拼接、不只写在文档里",
      "status": "confirmed",
      "impact_dimensions": ["goal", "acceptance"],
      "selected_disposition": "在工作流定义中按任务类型声明两条入口变体，各自写明经过哪些阶段；阶段列表可被逐字核对，不由启动代码动态拼接、不只写在文档里靠自觉",
      "evidence": "R-010、R-014；Talk round 2 问题「拓扑归属」用户选择「写进工作流定义，按类型分两支」",
      "acceptance": "AC-01 与 AC-02 的度量：阶段列表逐字可核对且与 U-008 拓扑一致，审查能直接读取该声明",
      "counterexample": "阶段序列只在运行时才知道、或只写在文档/技能说明里而无从逐字核对",
      "requires_user_decision": true,
      "visible_group_id": "G-旅行拓扑"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-004",
      "category": "success_failure_boundary",
      "source": "R-004 / prd.md L242, L249",
      "question": "「14 步顺序锁定」与「固定 Talk 轮次」要去掉，那各阶段现有流程清单怎么处置？",
      "resolution": "用户确认：保留流程清单作为「本阶段该干什么」的可核对参考，但取消其强制按序与凑步语义：不适用写真实原因跳过，发现新问题可追加，不因缺步或乱序阻断推进",
      "status": "confirmed",
      "impact_dimensions": ["scope", "ordinary_detail"],
      "selected_disposition": "保留各阶段流程清单作为可核对参考，取消强制按序与凑步的锁语义；缺步、乱序、跳过不再阻断推进，只需写真实原因；发现新问题可以追加",
      "evidence": "R-004；Talk round 2 问题「step 锁」用户选择「保留清单，但只当参考不当锁」",
      "acceptance": "AC-04：在缺 stage completion 认证、未走固定轮次的状态下推进真实任务不被阻断，且无伪造认证记录",
      "counterexample": "为凑满轮次或步数而提问，或因为缺步、乱序而阻断阶段推进",
      "requires_user_decision": true,
      "visible_group_id": "G-去阻断"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-005",
      "category": "non_goals",
      "source": "R-011 / prd.md L236, L256-257",
      "question": "本卡与 CARD-02..CARD-10 的边界划在哪里，哪些改动明确不做？",
      "resolution": "用户确认：严格按职责只做骨架——拓扑定义与接线、类型声明、去固定轮次与顺序锁、零机器门禁骨架位、接口蓝图；文档权威(02)、子代理方法(03)、验收标准(04)、审查链(05)、删除执行(06)、头脑风暴改造(07)全部不碰（Grill G-001 补充：接线所必需的核心 stage 定义与排除名单改动属于本卡，不算越界；build-prd 内部步骤内容与执行质量不在本卡）",
      "status": "confirmed",
      "impact_dimensions": ["scope"],
      "selected_disposition": "本卡只改骨架与入口：阶段拓扑定义与接线、任务类型声明与读回、去固定轮次与顺序锁、零机器门禁的骨架位、阶段/材料定义接口蓝图；其他卡职责范围内的一切改动不在本卡执行；build-prd 升为第六正式阶段与改动其内部 6 步内容均不做",
      "evidence": "R-011；Talk round 2 问题「卡间边界」用户选择「严格只做骨架」",
      "acceptance": "AC-01/02/03/04/05/56 全部落在骨架与入口面上，本卡改动不触碰 CARD-02..10 的交付物",
      "counterexample": "本卡顺手删掉阻断代码（CARD-06 职责）、改写文档权威规则（CARD-02）或改造 make-decision 头脑风暴机制（CARD-07）",
      "requires_user_decision": true,
      "visible_group_id": "G-卡间边界"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-006",
      "category": "success_failure_boundary",
      "source": "R-006, R-007, R-008 / prd.md L244, L251; SD-17 L94",
      "question": "「任一阶段推进零机器门禁」的底线划在哪里——哪些校验必须删，哪些根本不该被当成门禁？",
      "resolution": "用户最初答复为『只留两条物理底线』，当时展开成①worktree/任务身份建不起来则没有记录落点、②破坏性 Git 动作需人工授权；build-spec 正式审查暴露其与『仅两类人为门』重复后，用户最终裁决 supersede 该展开：只有①属于物理不可行；材料字节不可读仅使依赖其内容的具体动作报告失败并等待修复，不是普遍阶段 gate；不可逆操作授权只属于人为门 B，不重复算物理底线。revision 绑定、快照树认证、材料身份与哈希校验、回执校验一律不得构成推进前置，降为记录事实",
      "status": "confirmed",
      "impact_dimensions": ["goal", "scope", "acceptance"],
      "selected_disposition": "只保留一个物理不可行边界：worktree/任务身份建不起来时无记录落点。材料字节不可读是依赖内容动作的局部失败并可修复重试；不可逆操作授权只属于人为门 B；其余一切机器与流程校验不得构成任何阶段的推进前置",
      "evidence": "R-006、R-007、R-008；Talk round 1 原答复『只留两条物理底线』作为历史保留；build-spec 正式审查后用户最终裁决选 A，取代原两条展开",
      "acceptance": "AC-56：构造不带机器校验材料（无 revision 绑定、无快照认证、无回执校验记录）的推进场景，推进不被任何机器校验阻断，缺项被如实记录，两道人为门仍正常运作",
      "counterexample": "任一机器或流程校验（两道人为门之外）阻断推进，或该记却未记的事实被漂白",
      "requires_user_decision": true,
      "visible_group_id": "G-去阻断"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-007",
      "category": "non_goals",
      "source": "R-011, R-015 / prd.md L236, L262",
      "question": "本卡明确不做哪些事？",
      "resolution": "用户确认：不做按任务大小的自动分流；不新增页面或展示层；不实现校验机器的物理删除（CARD-06）；不给旧任务做兼容或迁移（CARD-08）；不改 build-prd 内部步骤内容；不实现入口分流的参数形态",
      "status": "confirmed",
      "impact_dimensions": ["scope"],
      "selected_disposition": "非目标=按体量自动分流；新增页面或展示层；校验机器的物理删除（CARD-06）；旧任务兼容与迁移（CARD-08）；build-prd 内部步骤内容改写；入口分流的参数形态实现",
      "evidence": "R-011、R-015；Talk round 2 问题「卡间边界」用户选择「严格只做骨架」",
      "acceptance": "本卡验收事实中不出现上述任一改动的交付声明；范围外改动不作为本卡完成条件",
      "counterexample": "把上述任一项做进本卡并据此声明完成或阻塞",
      "requires_user_decision": true,
      "visible_group_id": "G-卡间边界"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-008",
      "category": "success_failure_boundary",
      "source": "R-001, R-002, R-006 / prd.md L246-247, L251",
      "question": "本卡的「成功」用什么口径算——验收要真跑多少东西？",
      "resolution": "用户确认：两类任务都从真实入口真跑（规划任务真到 build-prd 停住且不多出代码阶段；实施任务真走完四个阶段），另加两个门禁场景：缺机器校验材料仍能推进、两道人为门仍生效",
      "status": "confirmed",
      "impact_dimensions": ["acceptance"],
      "selected_disposition": "成功口径=两类任务从真实入口真跑 + 缺机器校验材料仍能推进 + 两道人为门仍生效；不用「只跑实施旅程」代替，也不用「文件存在」代替执行",
      "evidence": "R-001、R-002、R-006；Talk round 2 问题「验收口径」用户选择「两类任务 + 门禁场景都真跑」",
      "acceptance": "AC-01/02/04/56 均有真实入口执行记录；失败判据见「成功/失败边界」节失败边界",
      "counterexample": "只核对拓扑定义文件与类型声明存在而不跑真实任务，或只真跑一条旅程却声明两类拓扑都已验",
      "requires_user_decision": true,
      "visible_group_id": "G-验收口径"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-009",
      "category": "complete_user_flow",
      "source": "R-003, R-010 / prd.md L237, L241",
      "question": "任务类型未声明、声明重复或值不在受控集内时怎么处置？",
      "resolution": "用户确认：按现有 reader 契约判定为无法识别并向用户澄清，不得从请求、文件名、历史记录或哈希推断；只暂停依赖类型的提问分支，不阻断与类型无关的准备",
      "status": "confirmed",
      "impact_dimensions": ["acceptance", "ordinary_detail"],
      "selected_disposition": "类型未声明、重复、冲突或值不在受控集内一律判为无法识别并向用户澄清，禁止推断；只暂停依赖任务类型的提问与内容分支，与类型无关的准备继续",
      "evidence": "R-003、R-010；prd.md L237 流程/状态；Talk round 1 问题「任务类型」用户选择「普通任务」确立了受控值语义",
      "acceptance": "类型未声明时 readTaskTypeFromDecisionLog 判为无法识别且真实发起澄清；与类型无关的准备不被阻断",
      "counterexample": "从请求、文件名、历史记录或哈希猜出任务类型并据此提问或跳过澄清",
      "requires_user_decision": true,
      "visible_group_id": "G-旅行拓扑"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-010",
      "category": "data_state",
      "source": "R-009, R-014 / prd.md L237; SD-03 L38",
      "question": "任务类型、当前阶段、阶段状态这些信息存在哪里？",
      "resolution": "用户确认：存在任务自己的记录里——阶段状态用窄状态集 7 值，任务材料落 worktree 的 specs/<task-id>/，执行事实落任务追踪目录；不新建状态机、不新增第五份材料",
      "status": "confirmed",
      "impact_dimensions": ["scope", "ordinary_detail"],
      "selected_disposition": "任务类型、当前阶段与阶段状态存在任务自己的记录里：材料落 worktree 的 specs/<task-id>/，执行事实落任务追踪目录；阶段状态用窄状态集 7 值；不新建状态机、不新增第五份材料",
      "evidence": "R-009、R-014；Talk round 1 问题「状态存放」用户选择「写在任务自己的记录里」",
      "acceptance": "阶段状态取值属于 7 值窄状态集；不存在第五份材料或独立状态机；未验证状态不被写成成功",
      "counterexample": "新建第二套状态机或第五份材料，或把未验证、未采集到的状态写成 succeeded",
      "requires_user_decision": true,
      "visible_group_id": "G-状态落点"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-011",
      "category": "success_failure_boundary",
      "source": "R-012 / prd.md L231; SD-14 L82",
      "question": "本卡的 owner、合并责任与验收责任怎么指派？",
      "resolution": "用户确认：本卡 owner=本 task 主会话；与 CARD-02 共享阶段/材料定义写面，本卡先冻结接口蓝图、CARD-02 在冻结接口上对齐；验收责任由本卡 verify-code 承担，总体验收由 CARD-10 以存在性核对承接",
      "status": "confirmed",
      "impact_dimensions": ["ordinary_detail"],
      "selected_disposition": "owner=本 task 主会话；合并责任=本卡先冻结阶段/材料定义接口蓝图，CARD-02 在冻结接口上对齐；验收责任=本卡 verify-code，总体验收由 CARD-10 做存在性核对",
      "evidence": "R-012；prd.md L231 与 L257 集成责任",
      "acceptance": "接口蓝图冻结事实存在且被 CARD-02 消费；本卡 verify-code 承担自身 AC 验收；CARD-10 只做存在性核对与抽验权",
      "counterexample": "本卡把总体验收当作自身完成条件，或 CARD-10 逐条复核各卡 AC 内容形成门禁",
      "requires_user_decision": false,
      "visible_group_id": "G-卡间边界"
    },
    {
      "task_id": "workflowhub-thin-core-card-01-20260919",
      "outline_version": "outline-v2",
      "oi_id": "OI-012",
      "category": "deferred",
      "source": "R-014 / prd.md L260",
      "question": "哪些事明确延期、由谁在何时解决？",
      "resolution": "用户确认：入口分流实现形式延期到本卡 build-plan；校验机器物理删除延期到 CARD-06；旧任务兼容与最小接续延期到 CARD-08；资源占用实测延期到 CARD-09；本卡验收用例参数细节延期到本卡 build-plan",
      "status": "deferred",
      "impact_dimensions": ["scope"],
      "selected_disposition": "四项延期：入口分流实现形式→本卡 build-plan；校验机器物理删除→CARD-06；旧任务兼容与最小接续→CARD-08；资源占用效果实测→CARD-09",
      "evidence": "R-014；prd.md L260 可后置技术项",
      "acceptance": "延期项在 build-plan 中各自落到具体用例参数或对应卡片；本卡完成不宣称这些延期项已交付",
      "counterexample": "把延期项当作本卡已完成交付，或在他人卡上重复实现",
      "owner": "本卡 build-plan 与 CARD-06/CARD-08/CARD-09",
      "trigger": "本卡 build-plan 开工；对应卡片开工",
      "scope": "入口分流参数形态、校验机器物理删除、旧任务兼容与最小接续、资源占用实测、验收用例参数细节",
      "impact": "不影响本卡骨架验收，但影响后续卡的实施顺序与 CARD-10 总体验收证据",
      "follow_up_acceptance": "在各承接卡的验收事实中存在对应交付或明确的未交付披露",
      "requires_user_decision": true,
      "visible_group_id": "G-延期项"
    }
  ]
}
```

## 目标

- 目标：让用户经宿主助手在真实入口可发起两类任务——规划任务（make-decision→build-prd）与实施/普通任务（make-decision→build-plan→build-code→verify-code）——且任一阶段推进除两类人为门（推进确认对话、不可逆操作独立授权）外零机器门禁；唯一物理不可行是任务身份/worktree 建不起来、没有记录落点。材料字节不可读只让依赖其内容的具体动作报告失败并等待修复，不是普遍阶段 gate；任务类型由人工在 make-decision 内以受控值声明并被读回，拓扑写进工作流定义按类型分两支、逐字可核对。
- 需求框架选择：`functional`（见「需求框架」节）

## 成功/失败边界

- 成功边界：AC-01 规划任务阶段列表逐字等于 make-decision→build-prd 且无第三阶段；AC-02 实施任务四阶段齐备且顺序正确；AC-03 两个体量显著不同的任务均停留在人工选择处、无按体量自动分流；AC-04 缺 stage completion 认证且未走固定轮次时任务仍可推进且无伪造认证记录；AC-05 移除阻断前后的历史事实均保留可查、无漂白；AC-56 缺失机器校验材料时推进不被阻断、缺失项被如实记录、两道人为门正常运作。
- 失败边界：规划任务出现 build-plan/build-code/verify-code 任一阶段；实施任务缺任一阶段或顺序错误；任一任务被按体量自动分流；缺认证即被阻断或为通过而补造认证事实；任一历史失败事实被改写为通过；任一机器/流程校验（两道人为门之外）阻断推进；缺失事实被漂白不记。

## 范围

- 当前范围：①阶段拓扑定义（规划两阶段、实施四阶段）与任务类型到拓扑的映射，写进工作流定义按类型分两支；②规划旅程**真接线**——把 build-prd 从当前硬编码排除名单中放行，使其可从入口执行并停住（不含升为正式阶段、不含改动其内部步骤）；③任务类型的人工声明与受控值读回（沿用现有 reader 契约）；④去掉固定 Talk 轮次与流程清单的顺序锁语义，缺步/乱序/跳过不阻断推进；⑤零机器门禁的骨架位：revision 绑定、快照树认证、材料身份/哈希校验、回执校验不得构成推进前置，降为记录事实；⑥保留两类人为门与唯一物理不可行边界（任务身份/worktree 无法建立、没有记录落点），材料字节不可读仅为依赖内容动作的局部失败；⑦按 D-007 修掉「审查材料身份变化不得复用旧审查」这一条语义。
- 用户流程/结果只记索引和验收影响，细节进入 spec：完整用户旅程只在本节记拓扑索引（规划任务两阶段、实施任务四阶段），实现细节与文件落点进入本卡 spec。

## 非目标

- 按任务体量自动分流任务类型。
- 新增页面、仪表盘或前端组件（本卡 ui_applicability=non_ui）。
- 校验机器（revision 绑定链、快照树认证、材料身份/哈希、回执校验）的物理删除——归 CARD-06。
- 旧任务兼容链、交接记录与历史迁移——归 CARD-08。
- 文档权威分工与单一事实源规则——归 CARD-02。
- 五阶段子代理派发方法与并行规则——归 CARD-03。
- 真实验收标准写入与有条件 TDD——归 CARD-04。
- 审查链整体替换（换新代码审查工具、适配合同冻结、对比实验与 go/no-go）——归 CARD-05；本卡只修「材料身份不得复用」这一条语义。
- make-decision 头脑风暴平台改造（发散机制、逐字双层保真、append-only）——归 CARD-07。
- 改写 build-prd 内部步骤内容（本卡只接线，不改其 6 步内容，也不为其内部执行质量背书）。
- 把 build-prd 升为第六个正式阶段（与其自身 SKILL 自证约束相冲）。
- 入口分流的内部实现形式（参数/配置形态）——延期到本卡 build-plan。

## 决定

### D-001 两类任务的阶段拓扑与复用现有 build-prd

- question/final_option：规划任务与实施任务分别走哪条阶段序列，规划旅程是否沿用现有 build-prd？／final_option=规划任务=make-decision→build-prd（结束）、实施任务=make-decision→build-plan→build-code→verify-code、复用现有 workflows/build-prd
- recommendation/plain_language：推荐沿用仓库已有的规划旅程定义，只把「人工选类型→走哪条路」接上，改动面最小。
- decision：规划任务拓扑恰为 make-decision→build-prd，不进入 build-plan/build-code/verify-code；实施任务拓扑恰为 make-decision→build-plan→build-code→verify-code；规划旅程复用现有 workflows/build-prd，不新增第三类旅程。
- source_type/reference/exact_excerpt：user_reply／Talk round 2 问题「规划旅程」／用户逐字选择「用现有 build-prd，接上入口（推荐）」
- approval_binding：待 step 11 approve-decision 的最终确认绑定；本条方向由 Talk round 1–2 真实答复确立
- facts_and_constraints：仓库已存在 workflows/build-prd；母 PRD 已 final 且 CARD-01 为基座卡（prd.md L233-263）
- Logic：母 PRD 要求拓扑与 U-008 逐字一致且规划旅程不进代码阶段；现有仓库已有规划旅程定义，重造会与 CARD-10 总体验收证据冲突。
- choice_reason/impact：影响全部后续 9 张卡的接口蓝图（阶段与材料定义），是 Group 0 先冻结的接口。
- consequences_and_risks：若拓扑定义错误，代价是全局的（RK-002）；规划旅程复用现有实现意味着 build-prd 的内部质量不在本卡保证范围。
- rejected_alternatives：重新定义规划旅程的阶段组成（范围显著变大）；取消规划旅程（与母 PRD U-008 直接冲突）。
- unresolved_items/owner：无
- Supersedes：无
- module：阶段拓扑与入口
- requirement_ids：R-001, R-002, R-003, R-010
- derived_from：R-001, R-002, R-003, R-010
- artifacts：见「文档结果」节

### D-002 零机器门禁的边界与去固定轮次、去顺序锁

- question/final_option：哪些校验必须删除、哪些不该被当成门禁，流程清单是否保留？／final_option=只留两类人为门与一个物理不可行边界，其余降为记录；流程清单保留但取消锁语义
- recommendation/plain_language：推荐把「门禁」与「记录」彻底分开：能观察的事实照记，但不再拿它卡住下一阶段；只有根本没有任务记录落点才是物理上无法开始。
- decision：任一阶段推进除 A）推进中的既有人工确认对话、B）既有授权合同认定的不可逆操作独立授权外，不得被 revision 绑定链、快照树认证、材料身份/哈希/sha 校验、回执校验阻断。唯一物理不可行边界是任务身份/worktree 建不起来、没有记录落点；材料字节不可读只让依赖其内容的具体动作报告读取失败并等待修复，不是普遍阶段 gate；固定 Talk 轮次与流程清单顺序锁语义取消，缺步/乱序/跳过只记真实原因。
- source_type/reference/exact_excerpt：user_reply／Talk round 1 问题「零机器门禁」与 Talk round 2 问题「step 锁」原答复为「只留两条物理底线（推荐）」「保留清单，但只当参考不当锁（推荐）」；build-spec 正式审查后用户进一步裁决选 A：「只有任务身份/worktree 建不起来、没有记录落点属于物理不可行」，该裁决 supersede 原“两条”展开但保留历史原答复
- approval_binding：待 step 11 approve-decision 的最终确认绑定
- facts_and_constraints：SD-17（prd.md L94）；AC-56（prd.md L251）；风险 R3（把减阻塞误做成掩盖失败）与 R6（材料偷换无机器防护）
- Logic：机器校验当前既是记录又当门禁，导致阶段推进被「缺认证」卡住；把二者分开后仍保留真实执行、独立审查与人确认作为质量来源。
- choice_reason/impact：这是本卡与 CARD-06 的分界线——本卡只改骨架中的门禁位置，不执行物理删除。
- consequences_and_risks：材料被偷换时没有机器防护（RK-003），只能靠两类人为门、独立审查与真实执行兜底；去阻断可能被误做成掩盖失败（RK-001）。
- rejected_alternatives：保留「材料读不到就阻断整个阶段」的普遍兜底（容易退化回被删的校验；内容字节确实不可读时，依赖该内容的具体动作仍须真实失败并等待修复）；彻底什么都不报错（撞 RK-001）；继续强制按序走完流程清单（等于 CARD-01 白做）；删掉流程清单（审查失去「本阶段该干什么」的参照）。
- unresolved_items/owner：无
- Supersedes：无
- module：推进门禁
- requirement_ids：R-004, R-005, R-006, R-007, R-008
- derived_from：R-004, R-005, R-006, R-007, R-008
- artifacts：见「文档结果」节

### D-003 任务类型的声明位置与状态落点

- question/final_option：任务类型在何处人工选择、状态信息存哪里？／final_option=先建任务、类型在 make-decision 内以受控值声明并读回；状态存任务自己的记录，阶段状态用窄状态集 7 值
- recommendation/plain_language：推荐不在入口新增参数，沿用现有「声明+读回」契约，减少一处需要同步的入口形态。
- decision：入口不新增任务类型参数、不做按体量自动分流；任务类型在 make-decision 内用受控值声明一次并由 readTaskTypeFromDecisionLog 读回，缺失/重复/冲突/非法值记未知并向用户澄清；任务类型、当前阶段与阶段状态存任务自己的记录（worktree 材料 + 任务追踪目录），阶段状态用窄状态集 7 值，不新建状态机、不新增第五份材料。**受控值契约（detail 审查 DF-major-2 补入）**：受控值集合恰为 `{规划任务, 普通任务}` 两枚举；声明落点为 `decision-log.md` 的「任务身份」段、固定标签 `- **任务类型**：<值>` 恰好一条；读回机制为现有纯函数 `readTaskTypeFromDecisionLog(markdown)`（`runtime/stage/stage-content-contracts.mjs:2881-2918`），返回受控值或「无法识别」；记录位置即上述 decision-log 段，不另建 store。
- source_type/reference/exact_excerpt：user_reply／Talk round 1 问题「真实入口」「状态存放」／用户逐字选择「先建任务，类型在 make-decision 里定」「写在任务自己的记录里（推荐）」
- approval_binding：待 step 11 approve-decision 的最终确认绑定
- facts_and_constraints：现有 reader 契约（runtime/stage/stage-content-contracts.mjs:2881-2918）；SD-03 窄状态集 7 值（prd.md L38）
- Logic：入口不新增参数可以避免「同一事实两处声明」；沿用现有 reader 意味着不需要新 schema 或新控制面。
- choice_reason/impact：决定 CARD-01 是否需要改 CLI 入口形态；本选择使入口形态改动最小。
- consequences_and_risks：任务类型在 make-decision 之前无法识别，依赖类型的提问必须等待声明；这与「入口由人工选择」的字面表述存在张力，需在本卡 spec 中写清边界。
- rejected_alternatives：CLI 上显式选择类型参数；宿主助手会话开头提问；骨架层完全不存状态。
- unresolved_items/owner：无
- Supersedes：无
- module：入口与状态
- requirement_ids：R-003, R-009, R-010, R-014
- derived_from：R-003, R-009, R-010, R-014
- artifacts：见「文档结果」节

### D-004 与 CARD-02..10 的边界及集成责任

- question/final_option：本卡做多少、与谁共享写面、谁先冻结接口？／final_option=严格按职责只做骨架；与 CARD-02 共享阶段/材料定义写面，本卡先冻结接口蓝图
- recommendation/plain_language：推荐把本卡压到最小骨架，让后续卡在冻结接口上各自施工，避免同时改同一批文件。
- decision：本卡只做骨架与入口（拓扑定义与接线、类型声明与读回、去固定轮次与顺序锁、零机器门禁骨架位、接口蓝图）；「骨架」按**职责**界定而非文件范围——凡属「让两类任务能从真实入口走到各自终点且不被机器门禁阻断」的最小改动属于本卡；文档权威（02）、子代理方法（03）、验收标准写入（04）、审查链替换（05）、删除执行（06）、头脑风暴改造（07）均不在本卡执行；本卡先冻结阶段/材料定义接口蓝图，CARD-02 在冻结接口上对齐；owner=本 task 主会话，验收责任=本卡 verify-code。
- source_type/reference/exact_excerpt：user_reply／Talk round 2 问题「卡间边界」／用户逐字选择「严格只做骨架（推荐）」
- approval_binding：待 step 11 approve-decision 的最终确认绑定
- facts_and_constraints：母 PRD 卡片范围与共享资源冲突（prd.md L236、L256-257）；SD-14 集成责任规则（prd.md L82）
- Logic：Group 0 串行基座要求先冻结接口再供 Group 1 消费；范围外改动会制造重复控制面与被删对象复活（母 PRD 风险 R1/R2）。
- choice_reason/impact：决定本卡验收面与后续卡的开工顺序。
- consequences_and_risks：本卡验收时很多能力尚未到位，只能验骨架；若接口蓝图冻结不实，后续卡会在错误接口上施工。
- rejected_alternatives：顺手删掉阻断代码（撞 CARD-06「先立新后拆旧」）；只定规范不做实现（「可发起两类任务」失去实现归属）。
- unresolved_items/owner：无
- Supersedes：无
- module：卡间边界与集成
- requirement_ids：R-011, R-012, R-015
- derived_from：R-011, R-012, R-015
- artifacts：见「文档结果」节

### D-005 验收口径与风险、延期交接

- question/final_option：本卡用什么口径算成功，风险与延期项如何交接？／final_option=两类任务真跑+两个门禁场景；风险按 RK-001..RK-008 登记；延期项六项
- recommendation/plain_language：推荐两种任务都真跑一遍，再加一个「故意缺机器校验材料」的场景，否则无法证明阻断真的没了。
- decision：成功口径=规划任务真实跑到 build-prd 停住且无代码阶段、实施任务真实走完四阶段、缺机器校验材料仍能推进、两道人为门仍生效；验收只验拓扑与门禁，不验 build-prd 产出质量；局部风险登记 RK-001（去阻断被误做成掩盖失败）与 RK-002（拓扑改错代价全局）；延期项=入口分流实现形式（本卡 build-plan）、校验机器物理删除（CARD-06）、旧任务兼容与最小接续（CARD-08）、资源占用实测（CARD-09）、验收用例参数细节（本卡 build-plan）、审查链整体替换（CARD-05）。
- source_type/reference/exact_excerpt：user_reply／Talk round 2 问题「验收口径」与 Talk round 3 问题「完成边界」／用户逐字选择「两类任务 + 门禁场景都真跑（推荐）」「只验拓扑与门禁（推荐）」
- approval_binding：待 step 11 approve-decision 的最终确认绑定
- facts_and_constraints：AC-01/02/03/04/05/56（prd.md L246-251）；局部风险与可后置技术项（prd.md L259-260）
- Logic：母 PRD SD-05 要求整体从真实入口联通实跑才算完成；只核对文件存在会被判验收失败。
- choice_reason/impact：决定本卡 verify-code 的工作量与证据形态。
- consequences_and_risks：验收成本高，需要真跑两条链路与两个门禁场景；延期项若无人承接会在后续卡之间悬空。
- rejected_alternatives：只真跑实施旅程（AC-01 无真实执行记录）；只核对文件存在（用产物存在代替完成判据）；连 build-prd 产出质量一起验（超出本卡与母 PRD CARD-01 范围且无卡承接）。
- unresolved_items/owner：无
- Supersedes：无
- module：验收与交接
- requirement_ids：R-001, R-002, R-006, R-013, R-014
- derived_from：R-001, R-002, R-006, R-013, R-014
- artifacts：见「文档结果」节

### D-006 规划旅程真接线：让 build-prd 进入可执行阶段范围

- question/final_option：既然现状盘点证明 `workflows/build-prd` 被硬编码五阶段清单排除、规划旅程当前不可执行，本卡要接多深？／final_option=真接线，让规划任务能从真实入口跑到 build-prd 停住；但不把 build-prd 升为第六个正式阶段
- recommendation/plain_language：推荐真接线——否则「真实入口可发起规划任务」只是一句声明，AC-01 拿不到任何真实执行记录。
- decision：本卡负责把规划旅程接到真实入口上，使规划任务能经 make-decision 走到 build-prd 并停住、不进入 build-plan/build-code/verify-code；接线范围包含当前拒绝 build-prd 的排除名单；**只放行「可执行」，不把 build-prd 加入正式阶段集合、不改其内部步骤内容**；build-prd 内部执行质量不由本卡背书。**排除名单边界（detail 审查 DF-major-3 裁决）**：排除名单的逐处清点与冻结**留待本卡 build-plan**（依据 RS-001 已盘点的 8 处排除点：step-manifest/stage-context/stage-acceptance-policy/completion-predicates/stage-handlers/task-kernel-implementation/stage-agent-bridge/dispatch-component），make-decision 只定接线方向与「不升为正式阶段」的边界；AC-01 的可执行性核对在 build-plan 冻结名单后进行。
- source_type/reference/exact_excerpt：user_reply／Talk round grill G-001 与 Talk round 3 问题「接线风险」／用户逐字选择「真接线：让规划任务能跑（推荐）」「只放行可执行，不升为正式阶段（推荐）」
- approval_binding：待 step 11 approve-decision 的最终确认绑定
- facts_and_constraints：RS-001 证据（`runtime/stage/step-manifest.mjs:4-10`、`:161-162`，及另外 7 处同款排除）；`config/workflowhub.yaml:14-17` 已把 build-prd 注册为 `kind: portable_workflow` 且注释声明会被通用 dispatcher 拒绝；`workflows/build-prd/SKILL.md:119-121` 自证约束「不要加进五阶段」；母 PRD FR-01（prd.md L239）
- Logic：AC-01 要求阶段列表逐字等于 make-decision→build-prd 且有真实执行记录；若 build-prd 仍在排除名单里，规划任务无法启动，AC-01 与 E2E-1 均无法成立。
- choice_reason/impact：这是本卡实施范围的实际边界变化——文件面从「工作流定义」扩展到「核心 stage 定义与排除名单」，需在 build-plan 中逐处核查消费者。
- consequences_and_risks：接线触及 stage-runtime/step-manifest/stage-context 等核心文件（RK-005），与 CARD-03/CARD-05/CARD-09 写面存在交叉可能，须按 SD-11 先冻结接口；把 build-prd 误升为第六正式阶段会与 build-prd 自证约束冲突。
- rejected_alternatives：不接线、只用「拓扑声明逐字核对」代替真跑（破 D-005 验收口径与母 PRD SD-05）；把 build-prd 升为第六个正式阶段（与 build-prd 自身 SKILL 约束相冲，超出本卡范围）。
- unresolved_items/owner：排除名单的逐处清单留本卡 build-plan 核查
- Supersedes：无
- module：阶段拓扑与入口
- requirement_ids：R-001, R-010
- derived_from：R-001, R-010
- artifacts：见「文档结果」节

### D-007 审查复用缺陷的归属与处置（本卡执行，跨卡交接）

- question/final_option：在 make-decision 阶段发现「真实材料无法触发新方向审查」的复用缺陷，修复归属如何处置？／final_option=用户裁定在本卡分支上修掉，避免后续所有任务被同一缺陷卡住
- recommendation/plain_language：推荐至少要让「材料变了就必须重审」，否则每个任务都会拿到别人的旧审查结论。
- decision：用户裁定「就改在本卡分支上，目标是不要再出现任何阻塞了；移到 CARD-05 再做会导致前面几个任务都无法正常推进」。据此本卡承接该修复，但**只接受「材料身份变化不得复用」这一条不可协商的语义**；其范围、实现与验收由本卡 build-plan 细化，并在完成后把「审查链整体替换」仍留给 CARD-05。
- source_type/reference/exact_excerpt：user_reply／Talk round 3 追问「修复归属」／用户逐字答复「就改在 card-01 分支上，我说过了，目标是不要在出现任何阻塞了，移到 05 再做，那么前面几个任务都无法正常推进了」
- approval_binding：待 step 11 approve-decision 的最终确认绑定
- facts_and_constraints：诊断证据——`runtime/review/review-record-route.mjs:518-565` 的 `findReusableReview` 复用键只含五维元组+subject+evidence，签名不接 `materialId`（调用点 `:1205` 传入但函数未声明该参数）；`:550-556` 注释自称 material identity "deliberately absent from the reuse key"；result-only 导入路径 `:1698-1703` 却强制比对 `material_id/material_revision/snapshot_tree`；`CONTEXT.md:412` 明文「大纲变更后旧方向审查结果作废」；实测同任务换材料后仍 `reused:true` 且 `pair_id` 不变、findings 指向旧材料。
- Logic：同一份代码里两条复用路径口径不一致，且请求路径违反 `CONTEXT.md:412`；材料变了却复用旧审查，会让下游把旧结论当成对新材料的独立审查。
- choice_reason/impact：决定本卡实施范围再扩一项（触及全 stage/track 共享的审查复用实现），并需要改写若干把缺陷固化为规格的既有测试。
- consequences_and_risks：该实现是所有 stage/track 共用的唯一复用实现，改动影响全部审查面（RK-008）；此前的用户选择曾倾向把缺陷当阻塞停下（与「零机器门禁」张力），最终以「在本卡修掉」落地，但本卡仍不得借此扩成审查链替换。
- rejected_alternatives：另开独立修复 task（用户否决，理由是会让前面几个任务无法正常推进）；归到 CARD-05 名下（用户否决，理由同上）；把复用缺陷当阻塞停止推进（用户先前选择，随后以本决策取代）。
- unresolved_items/owner：修复范围与验收细节由本卡 build-plan 定；审查链整体替换仍归 CARD-05
- Supersedes：本决策取代 Talk round 3 中「当成阻塞停下来修」的处置选择（该选择保留在 T-010 作为历史事实）
- module：审查链缺陷修复
- requirement_ids：R-006, R-013
- derived_from：R-006, R-013
- artifacts：见「文档结果」节

### D-008 规划旅程的终止语义（detail 审查 DF-major-4 补入）

- question/final_option：规划旅程「到 build-prd 停住」缺终止状态、执行边界、结果记录与失败行为的可核对定义，detail 审查要求补入／final_option=现在写清终止语义，不留待 build-spec
- recommendation/plain_language：规划旅程终点必须能逐字核对——什么算到了 build-prd、停下时记什么、失败怎么办，否则 AC-01 的「停住」无法验证。
- decision：规划旅程的终止语义为——①执行边界：规划任务经 make-decision 进入 build-prd，完成 build-prd 现有 6 步（load-parent-decision→draft-outline-and-task-map→confirm-map-and-conditional-design→expand-single-prd→confirm-final-displayed-draft→report-facts-and-handoff）即到达终点，**不进入 build-plan**；②终止状态：build-prd 6 步完成记 `succeeded`，此为规划旅程的最终阶段状态，任务随之收口（不触发 build-plan/build-code/verify-code）；③结果记录：build-prd 的产出与执行事实记入任务追踪目录，build-prd 不当正式阶段、不进入五阶段通用 completion 认证；④失败行为：build-prd 任一步失败记 `failed`，按真实原因修复后可重入 build-prd 该步，但不因失败滑入代码阶段；⑤「不把 build-prd 升为正式阶段」与「build-prd 有 succeeded/failed 阶段状态」并存——状态记录属于任务自己的事实，不等于把 build-prd 纳入正式五阶段集合。
- source_type/reference/exact_excerpt：user_reply／detail 审查 DF-major-4 + 用户结构化裁决「现在写清规划终止语义（推荐）」
- approval_binding：待 step 11 approve-decision 的最终确认绑定
- facts_and_constraints：D-001 拓扑、D-006 接线、OI-001 终点；detail 审查 red finding「planning route ... no terminal state, execution boundary, result record, failure behavior」
- Logic：母 PRD AC-01 要求规划任务「到 build-prd 结束且无第三阶段」，必须有一个可核对的终止语义才能验收；终点语义不清会让「停住」无法验证。
- choice_reason/impact：把规划旅程终点从「一句结束」落成可核对的五元语义（边界/状态/记录/失败/并存）。
- consequences_and_risks：build-prd 有 succeeded/failed 状态但不属正式阶段，需在 build-code 实现时确保状态记录与正式阶段集合解耦（RK-005）。
- rejected_alternatives：留给 build-spec 定（detail 审查指出这不够，终点语义当下含糊）。
- unresolved_items/owner：无
- Supersedes：无
- module：阶段拓扑与入口
- requirement_ids：R-001, R-010
- derived_from：R-001, R-010
- artifacts：见「文档结果」节

### D-009 迁移期与四阶段生效边界（build-spec 正式审查后追加）

- question/final_option：当前 task 正按旧五阶段 authoring lifecycle 执行 build-spec，而 D-001 的目标新普通任务拓扑不含 build-spec；四阶段何时正式启用、在途任务如何处理？／final_option=当前在途任务按启动时五阶段跑完；CARD-01 verify-code 只验能力；变更正式进入 main/release 且被真实入口消费后，仅对新普通任务启用四阶段
- recommendation/plain_language：不要让正在跑的任务中途换轨，也不要把“代码验收通过”误当成“产品已启用”。先验能力，再正式发布并由入口消费，之后新任务才走四阶段。
- decision：①current_authoring_lifecycle：本 task 按启动时现行五阶段 `make-decision→build-spec→build-plan→build-code→verify-code` 跑完；创建 task 身份与 worktree、获得记录落点时只冻结 activation cohort（pre/post），不冻结具体拓扑，cohort 作为任务自己的执行事实落任务追踪目录，具体 schema/字段形态留 build-plan；②target_new_task_topology：D-001 目标保持 `make-decision→build-plan→build-code→verify-code`；③type_after_cohort：人工选类型后，规划任务不论 cohort 均走 `make-decision→build-prd`；普通任务 pre-activation cohort 走旧五阶段，post-activation cohort 走目标四阶段；暂停/恢复或晚声明类型不改变 cohort，不维护两套永久拓扑；④activation_condition：CARD-01 verify-code 只做能力级预演，不启用新拓扑；变更进入正式 main/release 且正式入口实际消费该发布时形成 activation，由 CARD-01 owner 在消费后采集并关闭 activation 验收事实；⑤retirement_condition：CARD-06 负责旧基础设施退休，CARD-10 仅核对 activation 验收事实存在并作总体完成宣称，不重复内容验收，也不是首次启用点。
- source_type/reference/exact_excerpt：user_reply／build-spec 第三次与第六次 canonical review 方向问题卡／用户裁决迁移时点四条及 cohort×类型规则、后置 activation 验收 owner
- approval_binding：当前用户直接裁决，绑定本次 build-spec 对话
- facts_and_constraints：D-001 目标拓扑不改；当前 task 已真实进入 build-spec；旧任务不得中途改道；发布与入口消费是生效事实
- Logic：区分“当前 authoring lifecycle”“能力验收”“正式激活”“旧基础设施退休”和“总体完成宣称”，即可消除当前 task 与目标拓扑的表面冲突，而不把两套拓扑永久化。
- choice_reason/impact：避免 activation 前任务被强制迁移，保留 D-001 的四阶段目标，并给正式入口一个唯一可验收的首次生效时点。
- consequences_and_risks：activation 证据若只证明 merge/release 而未证明正式入口实际消费，则新拓扑仍未启用；cohort 若未在任务自己的执行事实中保留，晚声明/跨 activation 恢复会失去可判定依据；CARD-06/CARD-10 不得被误作首次启用许可证。
- rejected_alternatives：立刻让当前 task 中途跳过 build-spec；把 build-spec 永久改为 out-of-band 双生命周期；activation 前创建的所有任务不分类型一律五阶段（会破坏规划拓扑）；用类型声明时点代替 task 创建/记录落点时点；等 CARD-06 或 CARD-10 才首次启用。
- unresolved_items/owner：cohort 与 activation 的具体 schema、发布标识与入口采样参数由本卡 build-plan/verify-code 细化；发布后 activation 验收由 CARD-01 owner 采集并关闭，CARD-10 只核对事实存在；不得改变上述 cohort×类型和时点语义
- Supersedes：无；本条解释 D-001 的迁移时点，不改变 D-001 目标拓扑
- module：阶段拓扑、发布与迁移
- requirement_ids：R-002, R-010, R-014
- derived_from：D-001, D-004, D-005
- artifacts：spec.md「迁移期与生效边界」

### D-010 Review 是普通 workflow step，不因下游修改自动回跳

- question/final_option：D-007 的 recorder currentness 是否意味着 finding 处置或材料修改后必须自动重审？／final_option=否；它只约束调用方在 workflow 正处 review step 且明确调用 recorder 时不能复用错材料
- recommendation/plain_language：review 到步骤时真实执行并留下异源意见，随后处置 findings 并继续 analyze/publish；修改材料不是回跳信号。
- decision：所有正式 stage 的每个既有 review step 都按 manifest 作为普通独立步骤执行。真实 advice（或真实 unavailable/错误事实）记录后，按 `depends_on` 前移；finding disposition、repair 或 material edit 不自动重新派发已完成 review，也不为 clean/pass 重审。只有后来证明该 review step 本身未真实完成或执行错误，才像其他普通步骤一样修复重做。direction/detail、phase/integration 与 verify-code 的不同命名/scope 仍是各自既有独立 review step。D-007 仅保证显式 recorder 调用不复用错误材料，不触发 workflow 回跳。
- source_type/reference/exact_excerpt：user_reply／本次窄修复真实需求与新增完成条件
- facts_and_constraints：build-spec manifest 为 freeze→review→dispose→analyze→publish 单向链；非 build-code review 不要求绑定修订后 final snapshot；底层 material-change tests 只描述调用方显式再次调用 recorder 的行为
- consequences_and_risks：本任务历史 7 次 build-spec review 属执行偏差；全部 provenance 只读保留，不把第七次或任何历史次数当作重审许可证
- Supersedes：澄清 D-007 的 workflow 含义，不改写其 recorder currentness 修复事实
- module：正式 stage review 步骤推进
- requirement_ids：R-006, R-013
- derived_from：D-007

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | 本 task 宣告为哪种任务类型？（普通任务／规划任务） | 普通任务可追问实现细节；规划任务禁止文件面/函数名/schema/命令形态类问题，会把实现细节推给 build-plan 猜测 | 「普通任务（推荐）」 | 该轮其他问题依赖此选择，同批一并回答 | 主会话结构化问答卡；`## 任务身份` |
| T-002 | 人工选择任务类型发生在哪里？（CLI 参数／会话开头提问／建任务后在 make-decision 内定） | CLI 参数需多记一个参数；会话开头提问在任务未建立时无落点；make-decision 内声明与现有 reader 契约最契合 | 「先建任务，类型在 make-decision 里定」 | 决定 D-003 | 主会话结构化问答卡 |
| T-003 | 任务类型、当前阶段、阶段状态存在哪里？（任务自己的记录／只靠追加事实行／骨架层不存） | 任务记录仍属事实记录；只靠事实行不易读；骨架层不存会重现已踩过的坑 | 「写在任务自己的记录里（推荐）」 | 决定 D-003；`data_state` 槽由 OI-010 承接 | 主会话结构化问答卡 |
| T-004 | 「任一阶段推进零机器门禁」的底线在哪里？（只留两条物理底线／保留材料读不到就报错／彻底不拦） | 当时认为两条边界清晰；后续正式审查证明第二条与人为门 B 重复。保留「读不到就阻断整个阶段」易退化回被删的校验；彻底不报局部读取失败会撞 RK-001 | 历史原答复：「只留两条物理底线（推荐）」；build-spec 正式审查后最终裁决选 A：仅任务身份/worktree 无记录落点属物理不可行，材料不可读是局部动作失败，不可逆授权只属人为门 B；后者 supersede 原展开 | 决定 D-002 | 主会话结构化问答卡；build-spec 正式审查问题卡与用户裁决 |
| T-005 | 规划旅程沿用现有 build-prd 还是要重新定？（沿用／重新定／取消） | 沿用改动面最小；重新定范围显著变大；取消与母 PRD U-008 冲突 | 「用现有 build-prd，接上入口（推荐）」 | 决定 D-001 | 主会话结构化问答卡 |
| T-006 | 流程清单（steps.json）怎么处置？（保留但不当锁／删掉／继续强制按序） | 保留但不当锁兼顾可核对与不阻断；删掉会让审查失去参照；继续强制按序等于 CARD-01 白做 | 「保留清单，但只当参考不当锁（推荐）」 | 决定 D-002 | 主会话结构化问答卡 |
| T-007 | 阶段拓扑由什么权威定义？（工作流定义按类型分两支／启动代码动态决定／只写在文档里） | 分两支可逐字核对；动态决定难验收；只写文档会让 AC-01/02 基本失效 | 「写进工作流定义，按类型分两支（推荐）」 | 决定 D-001/D-003 | 主会话结构化问答卡 |
| T-008 | 与 CARD-02..10 的边界？（严格只做骨架／顺手删阻断代码／只定规范不做实现） | 只做骨架避免撞车；顺手删会撞 CARD-06 顺序；只定规范会让结果失去实现归属 | 「严格只做骨架（推荐）」 | 决定 D-004 | 主会话结构化问答卡 |
| T-009 | 本卡的验收口径？（两类任务+门禁场景都真跑／只真跑实施旅程／只核对文件存在） | 都真跑才有 AC-01/02/04/56 证据；只跑一条与 SD-05 冲突；只核对文件等于用产物存在代替完成判据 | 「两类任务 + 门禁场景都真跑（推荐）」 | 决定 D-005 | 主会话结构化问答卡 |
| T-010 | 真实材料的方向审查拿不到（通道复用缺陷），怎么处置？（记未证实并披露／补独立替代审查／当阻塞停下修） | 记未证实可保留缺口；补替代审查能拿到意见但成本花在即将被替换的通道；当阻塞会与「零机器门禁」和卡间边界相冲 | 「当成阻塞停下来修」→ 经追问澄清为「任务暂停，先派子代理彻底修复该缺陷，修复完成后回到当前任务继续」→ 后续 T-013 再次修正 | 触发任务暂停（OP-004）；该处置后被 D-007 取代 | 主会话结构化问答卡；用户追问答复原文 |
| T-011 | 接线会让 build-prd 进入可执行范围，这条线怎么划？（只放行可执行／连正式阶段身份一起给） | 只放行可执行可验收且不越界；连正式阶段身份会与 build-prd 自证约束相冲并超出本卡范围 | 「只放行可执行，不升为正式阶段（推荐）」 | 收窄 D-006 范围 | 主会话结构化问答卡 |
| T-012 | 本卡验收时「规划任务能跑」验到什么程度？（只验拓扑与门禁／连产出质量一起验） | 只验拓扑与门禁可执行可复现；连产出质量超出本卡与母 PRD CARD-01 验收范围且无卡承接 | 「只验拓扑与门禁（推荐）」 | 收窄 D-005/D-006 验收面 | 主会话结构化问答卡 |
| T-013 | 审查复用缺陷的修复落在哪个分支？（另开独立修复 task／归 CARD-05 名下／就在 CARD-01 分支上改） | 独立 task 最干净但多一个 task 要管；归 CARD-05 会把前置卡住；在 CARD-01 分支上改会让本卡承受跨卡改动 | 「就改在 card-01 分支上，我说过了，目标是不要在出现任何阻塞了，移到 05 再做，那么前面几个任务都无法正常推进了」 | 决定 D-007；恢复本任务继续 | 主会话结构化问答卡；用户逐字答复 |
| T-014 | 任务 worktree 与 decision-log 被外部清理后怎么走？（重建 worktree + 逐字重建 materials／先查清清理来源／不用 worktree） | 重建可保住已谈定结论；先查清更稳但任务挂起；不用 worktree 会把材料未提交地放在主线工作区 | 「重建 worktree + 逐字重建 materials（推荐）」；并补充「worktree我找回来了，请确认和main分支一致，里面的decision-log我还是找不回来」 | 本文件重建；分支对齐 main=05f54ee9 | 主会话结构化问答卡；用户逐字答复 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| RS-001 仓库现状盘点 | 现有骨架的入口、规划旅程可达性、固定轮次与顺序锁的强制点、通用认证的阻断点、两道人为门的实现位置 | ①任务创建唯一官方入口=`tools/cli/task-bootstrap.mjs`（自述 L5-12），入口层没有任何任务类型声明，唯一声明点就是本 decision-log 的任务身份段（读器 `runtime/stage/stage-content-contracts.mjs:2881`，消费者 `core/task-close.mjs:1207,2690`）。②规划旅程定义存在（`workflows/build-prd/steps.json` 6 步：load-parent-decision→draft-outline-and-task-map→confirm-map-and-conditional-design→expand-single-prd→confirm-final-displayed-draft→report-facts-and-handoff），且 `config/workflowhub.yaml:14-17` 注册为 `kind: portable_workflow`（注释声明会被通用 dispatcher 拒绝），但未被 stage-runtime 接住：硬编码五阶段清单 `runtime/stage/step-manifest.mjs:4-10 CANONICAL_STAGE_SLUGS` 把 build-prd 排除，`loadStageManifest` L161-162 直接抛 `Unknown canonical stage: build-prd`；同款排除还在 `runtime/stage/stage-context.mjs:17-23`、`stage-acceptance-policy.mjs:1-14`、`completion-predicates.mjs:5,250`、`stage-handlers.mjs:400-401`、`task-kernel-implementation.mjs:33`、`tools/host/workflowhub-stage-agent-bridge.mjs:31`、`core/dispatch-component.mjs:12-17`；而 `workflows/build-prd/SKILL.md:119-121` 又自证「不要加进五阶段」。③「14 步顺序锁」=清单自校验（`step-manifest.mjs:46 validateStepManifest`，order 连续 L92-94、depends_on 先序 L106-107）+ legacy outcome 认证（`stage-runner.mjs:716`「must contain every declared step exactly once」、`validateStepOutcome` L171-172）；官方 vNext 路径 `runOfficialStage`（`stage-runner.mjs:3438`）在 `useLegacyStageOutcome=false` 时置 stageOutcome=null（L3465），不按步号做运行时顺序强制。④「固定 Talk 轮次」没有「必须 3 或 4 轮」的机器断言：`round_count` 只要求 ≥1 且等于 lifecycle_rounds 长度（`stage-content-contracts.mjs:2467,2473`），唯一「恰好 3 轮」在 `runtime/evidence/stage-content-evidence.mjs:228-231`，其入口只被测试调用，不在生产推进路径；真实阻断点是 `stage-handlers.mjs:701-703,709-710`（round_count<1 或 lifecycle 非法）。⑤会真正阻断推进的机器校验共 24 项，集中在四类：outcome/confirmation 字节哈希（`stage-runner.mjs:683-684`、`task-kernel-implementation.mjs:946-947`）、聚合 decision ref/hash 与 snapshot 新鲜度（`task-kernel-implementation.mjs:691-702`、`stage-handlers.mjs:679-682`）、review/acceptance 材料 sha256 冻结（`canonical-receipt-writer.mjs:216,228,677,683`）、receipt 身份与命名空间（`stage-handlers.mjs:757-781`）、步数完整（`stage-runner.mjs:716`）。明确仅记录不阻断的有 `stage-runner.mjs:696-700`（envelope 的 snapshot/material_revision 是 provenance）、`completion-predicates.mjs:93-100`（review 与 stage_end_spec_analyze 在 make-decision/build-spec/build-plan 为 advisory）。⑥两道人为门：推进确认=`confirm --action=decision`→`publishHumanConfirmation`（`task-kernel-implementation.mjs:879-993`，v3 绑定校验 `canonical-evidence-validators.mjs:409-435`）；不可逆 Git 授权=`authorize --action=commit\|push\|merge\|archive\|cleanup`→`publishIrreversibleAuthorization`（`task-kernel-implementation.mjs:994-1008`，要求 subject_ref 是已 accepted 的人为确认且 material_revision+snapshot_tree 等于当前，否则 L1004-1005 抛 stale）。 | 已消费并回填 | D-001, D-002, D-003, D-006 |
| RS-002 契约调研：decision-log 校验 | 任务身份、原始需求表、OI 记录、收敛检查、UI applicability 的运行时校验契约 | 任务类型 reader 读回「普通任务」；UI applicability 记录为 non_ui；OI 记录必需字段与终态字段清单已确认；占位词子串黑名单（未回答／待确认／待定／tbd／todo／未知／unknown／缺失）会令字段被判缺失，已按此调整文案 | 已消费 | 全部 |
| RS-003 外部调研 | 是否需要外部资料支持方向判断 | 不适用：本卡是仓库内部骨架改造，方向已由母 PRD 与用户答复决定，外部资料无法改变方向 | skipped（真实原因：答案不能改变方向） | 全部 |
| RS-004 审查复用缺陷诊断 | `review --action=record` 的复用判定键、material_id 计算、pair_id 生命周期 | 复用判定在 `runtime/review/review-record-route.mjs:518-565 findReusableReview`（调用点 `:1205`）；键=五维元组（`:538-542`）+subject sha256（`:549`）+authenticated_evidence sha256（`:550`），verify-code 另加 snapshot（`:556`）；签名不接 `materialId`，材料身份不在键内；`material_id` 计算本身正确且对材料敏感（`review-packet-identity.mjs:103-139`，由 `tools/cli/stage-runtime.mjs:1041` 注入、`review-record-route.mjs:1114` 已算出）；`pair_id` 由 `simple-review-runner.mjs:1718 randomUUID()` 生成，复用命中时从 `entry.pairSummary` 回旧值（`:562`），故非判定键；同文件 result-only 导入路径 `:1698-1703` 却强制比对 material_id/revision/snapshot，两条路径口径不一致；`classifyScope`（`:961-986`）丢弃调用方 `:1170-1180` 传入的 materialRevision/snapshotTree。实测复现：同 task 换材料后仍 `reused:true`、`pair_id` 不变、findings 指向旧材料。 | 已消费 | D-007 |
| RS-005 测试面与回归风险地图 | 复用/material_id/pair_id 的测试覆盖与改动回归风险 | 有 5 组测试把「材料变仍复用」固化为期望：`tests/contract/review-material-change-redispatch.test.mjs:92-130`、`tests/review/review-record-route.test.mjs:528-555/1016-1034/1177-1185`、`tests/contract/review-budget-deletion.test.mjs:117-131`、`tests/contract/freeze-classification-budget-usage-protocol.test.mjs:433-468/512-525`；`findReusableReview` 是全 stage/track 唯一共享实现，改动影响所有审查面；已知与本缺陷无关的既有失败：`freeze-classification-budget-usage-protocol` 的 AC-REBIND-001、`review-public-entrypoints.test.mjs:152`。 | 已消费 | D-007 |

> 调研处置说明：RS-003 跳过是真实判断而非遗漏——本卡全部未决问题都是「本仓库要把拓扑与门禁改成什么样」，其答案来自用户答复与仓库现有事实，检索外部资料不会改变结论。

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 接线的真范围 | 现状盘点（RS-001）证明 `workflows/build-prd` 虽存在，却被硬编码五阶段清单排除：`runtime/stage/step-manifest.mjs:4-10 CANONICAL_STAGE_SLUGS` 无此项，`loadStageManifest` L161-162 直接抛 `Unknown canonical stage: build-prd`，同款排除还散落在 `stage-context.mjs:17-23`、`stage-acceptance-policy.mjs:1-14`、`completion-predicates.mjs:5,250`、`stage-handlers.mjs:400-401`、`task-kernel-implementation.mjs:33`、`tools/host/workflowhub-stage-agent-bridge.mjs:31`、`core/dispatch-component.mjs:12-17`。冲突：D-004 写的是「严格只做骨架」，而母 PRD FR-01（真实入口可发起规划任务）在当前状态下为假 | 用户裁定「真接线：让规划任务能跑」——本卡必须让规划任务真能从入口跑到 build-prd 停住；据此把 D-004 的「骨架」边界按**职责**重述为「拓扑接线 + 类型声明 + 去锁 + 门禁骨架位 + 接口蓝图」，而不是按文件范围；同时明确本卡**不**把 build-prd 升为第六个正式阶段 | 不改 CONTEXT.md/ADR：接线只改排除名单与拓扑映射，不改术语；四项退出=范围（写清接线面）、接口（阶段/材料定义蓝图先冻结）、失败语义（接线后仍须停住、多出代码阶段即失败）、延期（build-prd 内部质量不在本卡） | Talk round grill G-001；证据见 RS-001 |
| G-002 两套共存 | 冲突：D-002 要求「任一阶段推进零机器门禁」，但本卡严格只做骨架意味着旧校验代码仍在仓库中，只是不再位于推进路径上 | 用户裁定「接受两套共存」——本卡只把门禁位置改对并留下接口蓝图，删除执行归 CARD-06；本卡验收以「推进不被阻断」为证据，不以「校验代码不存在」为证据 | 不改术语/ADR；四项退出=范围（不删代码）、接口（删除面归 CARD-06）、失败语义（若旧校验仍位于推进路径上即本卡失败）、延期（物理删除归 CARD-06，DF-002） | Talk round grill G-002 |
| G-003 本卡完成含义 | 冲突：若不定义完成含义，「真实入口可发起两类任务」容易被读成「规划任务全链路质量已达交付标准」 | 用户裁定「只背骨架，不背 build-prd 内部质量」——本卡交付=两类拓扑定义 + 类型声明与读回 + 去锁 + 门禁骨架位 + 接口蓝图，且可用真实任务跑出 AC-01/02/04/56 证据；build-prd 内部 6 步的执行质量不由本卡背书 | 不改术语/ADR；四项退出=范围（build-prd 内部质量不在本卡）、接口（build-prd 契约只按现有定义接入）、失败语义（本卡失败判据限于拓扑与门禁，不含 build-prd 内部质量）、延期（build-prd 内部质量改进无归属，登记为边界事实） | Talk round grill G-003 |

**Grill 对决策的更新（decision_updates）**：①新增 D-006，把「真接线让规划任务可跑」确立为本卡实施范围的一部分；②D-004 的「严格只做骨架」按职责重述，文件面扩展不再视为越界；③新增风险 RK-005（接线触及 stage-runtime/step-manifest 等核心文件，与 CARD-03/CARD-05/CARD-09 存在写面交叉可能）；④登记边界事实「build-prd 内部执行质量无卡承接」（RK-006）。

## 审查处置

### Step 6 direction-advice（provider 审查事实 + 输入不匹配缺陷）

**当前处置：已由 D-007 接管**。用户先裁定「任务暂停，先派子代理彻底修复审查复用缺陷」，随后在追问中改为「就改在 card-01 分支上修掉」；因此本任务不再暂停，方向审查缺口保持**未获得**状态，直到修复落地后用真实材料重跑验证。

**执行事实**：`node tools/cli/stage-runtime.mjs review --action=record --stage=make-decision --review_track=direction`，`host_provider=dsh`，材料=`raw_requirement`/`objective_facts`/`convergence_outline`（按 `stages["make-decision"].tracks.direction` 的 allowlist；`review_instructions` 为 runner-generated，调用方不得传入）。返回 `status=recorded`、`semantic_status=available`、红蓝双 role 均 `coverage=satisfied`；`pair_id=38d9f3f1-d432-4076-b9d6-e30118dd7b37`；red attempt=`quality/reviews/attempts/58e842e4-039f-59d9-a0c6-82626b106237/attempt.json`，blue attempt=`quality/reviews/attempts/7eec3f7e-8100-5cc3-a956-9d01e35cc1b0/attempt.json`；report=`quality/reviews/reports/make-decision-simple-c30461b8-498d-5c34-adb4-fd085bf26f15.md`。

**输入不匹配缺陷（如实披露，不漂白）**：本次返回的 findings 文案明确指向探针的占位输入而非本任务真实材料——F-2910e3a656b6 把 raw_requirement 描述为「CARD-01 骨架改造」这个裸标题；F-a2caf928aa51/F-1896f1ddfcbb/F-659a000519c5 描述 objective_facts「自标为『占位客观事实』」；F-aef4e703b0c6/F-0d6137e8cf5f 引用 `OI-CARD01-A`/`OI-CARD01-B`（探针的占位 OI 编号，不是本任务的 OI-001..OI-012）。主会话随后用真实材料连发两次（第二次含把 `outline_version` 升为 `outline-v2`），两次均返回 `reused: true` 且 `pair_id` 不变。结论：本任务当前没有获得针对真实材料的方向审查意见；上述 review 事实只证明「provider 在本任务上跑通过一次」，不证明「本任务材料已被独立审查」。

**已尝试的补救**：真实材料请求 2 次（材料内容变更、`outline_version` 变更），均被复用；未尝试改 task 身份或伪造 material_id（那会伪造 provenance）。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| F-2910e3a656b6 | kimi/coding 对 `materials/01-raw_requirement.md` 的 major：raw_requirement 只是裸卡名，没有问题描述、上下文与验收标准，无法判断方向是否用最小有用范围解决所述问题 | 对占位输入成立；对本任务真实材料不成立——真实 raw_requirement 已写明两类旅程、类型声明、零门禁边界、接线要求与不做范围 | rejected_invalid（就本任务真实材料而言） | 证据：本文件「原始需求」「范围」「非目标」三节 | owner=make-decision；consumer=build-plan；retain（保留原始事实） |
| F-a2caf928aa51 / F-1896f1ddfcbb / F-659a000519c5 | kimi/coding 与 codex/luna 对 `materials/02-objective_facts.json` 的 major：唯一客观事实自标为占位、属未测量断言，方向前提无法验证 | 对占位输入成立；本任务真实材料提供 10 条带文件行号的客观事实（见 RS-001），不含占位内容 | rejected_invalid（就本任务真实材料而言） | 证据：本文件「调研」节 RS-001 行 | owner=make-decision；retain（保留原始事实） |
| F-aef4e703b0c6 / F-e7f20942bc06 / F-0d6137e8cf5f（blocking）/ F-e1e9d133b1f8 | kimi/coding 与 codex/luna 对 `materials/03-convergence_outline.json` 的 major/blocking：outline 只有 open 的 OI 条目，没有已选方向、候选范围与被拒替代方案，reconstruct→reveal→challenge 无内容可挑战 | 该 blocking 判断建立在占位输入上；同时它揭示一个接口层真实约束：direction 轨按契约只接收 questions-only 投影（`deriveQuestionsOnlyOutline`）；
  该投影内条目的 status 恒为 `open`（原值，仅此一处、非未决方向问题），被拒方案、取舍、约束与失败后果都在 decision-log 主体而不在投影里——所以「投影里没有被拒方案」是设计使然，不是材料缺陷 | fixed（接口约束已在本条说明并登记为边界事实） | 证据：`runtime/stage/stage-content-contracts.mjs` 的 `deriveQuestionsOnlyOutline` 与 `buildDirectionReviewInput`（entries 只含 oi_id/category/source/question/status） | owner=make-decision；consumer=CARD-05（审查链替换）；retain（保留原始事实，作为 CARD-05 输入证据） |
| F-9fb66a7daf41 | kimi/coding 对 `materials/01-raw_requirement.md` 的 major：OI 条目引用的需求来源 `R-CARD01-A`/`R-CARD01-B` 在提交的需求里不存在，可追溯性断裂 | 对占位输入成立；本任务真实材料的 OI source 逐条引用 `R-001..R-015` 与 `prd.md` 行号，可追溯 | rejected_invalid（就本任务真实材料而言） | 证据：本文件「唯一 OI 大纲」各 OI 的 `source` 字段 | owner=make-decision；retain（保留原始事实） |

**方向审查缺口登记**：本任务的方向审查事实为「provider 跑通一次，但审查输入与真实材料不匹配」，真实材料的独立方向意见保持未获得；按 D-007 修复复用缺陷后用真实材料重跑验证。该缺口同时作为 CARD-05「审查链替换」的真实输入证据（复用缺陷 + 投影字段不足），并登记为 RK-008。

**D-007 修复事实（2026-09-19，已提交 `0f792a9b` + `33319b90`，审查已走通）**：复用缺陷与材料身份漂移均已修复，方向审查现在真实跑到 provider 并产出可用结论。两层根因：①`findReusableReview` 复用键漏材料身份（`0f792a9b` 加守卫）；②`review-packet-identity.mjs` 内部 `reviewPacketMaterialId` 与 `deliveredMaterialId` 排除集被 merge `05f54ee9` 拆散，导致 declared≠delivered、自检误杀每次 dispatch（`33319b90` 抽共享 `canonicalBundleEntries` 对齐 broker 规则，自检保留且按构造恒等通过）。测试去过度工程：删第三份写死排除集副本与硬编码 frozen 哈希向量，改行为断言。修复后 direction 审查 `semantic_status=available`、红蓝双 available、拿到针对真实 OI 的真实 findings；`simple-review-runner` 101 绿、`review-record-route` 108 绿、`review-material-change-redispatch` 8 绿、`review-budget-deletion`/`review-materials-contract` 绿。**方向审查缺口已闭合**。**OP-007/OP-008 已裁决关闭**（snapshot 归 CARD-05、接受调和定位）。**剩余诚实披露**：WorkflowHub↔broker 跨系统 material_id 活校验曾因依赖私有序列化 helper 而脆弱，已改为行为断言；一个持久的跨系统活校验需要暴露公共 bundle 序列化接口，归 CARD-05 审查链重构时一并处理（不影响审查走通）。

**D-007 修复后暴露的更深事实及最终解决（已修复，不漂白）**：复用修复生效后，重跑方向审查曾暴露 `MATERIAL_IDENTITY_MISMATCH: declared b934a6f5... != delivered 520bceb7...`、`provider_attempts=0`——根因是 `review-packet-identity.mjs` 内部 `reviewPacketMaterialId`（四元素排除集）与 `deliveredMaterialId`（两元素排除集）被 merge `05f54ee9` 拆散，与 broker 规则漂移，与既有 63 项 `MATERIAL_IDENTITY_MISMATCH` 测试失败同根因，只是过去被复用缺陷挡住。**该不一致已由 `33319b90` 修复**：抽共享 `canonicalBundleEntries`（broker 两元素规则）使 declared==delivered 恒等、自检保留且通过，方向审查随之走通（`available`、拿到真实 findings）。详细修复事实见上一条。

### Step 10 detail-advice（细节审查事实，已走通）

**执行事实**：`node tools/cli/stage-runtime.mjs review --action=record --stage=make-decision --review_track=detail`，`host_provider=dsh`，材料=`raw_requirement`/`approved_direction`/`draft_spec_or_acceptance`（真实决策内容）。返回 `status=recorded`、`reused:false`、`semantic_status=available`、`partial:false`、红蓝双 role available 且有 result_ref——**细节审查在修复后的代码上真实走通**。red findings 12 条、blue findings 9 条，关键有效发现如下（逐条处置见下）。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| DF-blocking-1 | red+blue blocking：D-007 是 detail 阶段新增的方向性架构决策，违反 detail 契约「detail must not substitute for direction or invent OI answers」 | 程序性争议：D-007 是审查缺陷的处置决策，由用户在 Talk round 3 真实裁定做在本卡，属方向而非 detail 可发明 | rejected_invalid（D-007 来源是用户真实裁定与增量需求，非 detail 发明；但**该契约边界提示有效**，见 DF-major-6） | 证据：T-013/D-007 用户逐字答复 | owner=make-decision；consumer=build-plan；retain |
| DF-major-2 | red+blue major：母需求「类型由人工在 make-decision 内以受控值声明并读回」，但材料未定义受控值集合、声明落点与格式、读回机制 | 真实需求缺口：OI-002/OI-009 定了「声明+读回」方向，但未把受控值集合与读回落点写成可核对契约 | fixed（用户裁决「现在写清」：受控值集合恰为 `{规划任务, 普通任务}`、声明落点为 decision-log 任务身份段固定标签、读回为 readTaskTypeFromDecisionLog、记录位置即该段——已补入 D-003） | 证据：D-003 受控值契约、OI-002、OI-009 | owner=make-decision；consumer=build-spec |
| DF-major-3 | red+blue major：D-006 把 build-prd 排除名单「留待 build-plan 逐处核查」，未冻结足以证明规划入口可执行的范围 | 真实边界缺口：排除名单若不冻结，接线范围不确定，AC-01 可执行性无法当下核对 | fixed（用户裁决「接受留待 build-plan」：排除名单逐处清点与冻结归本卡 build-plan，依据 RS-001 已盘点 8 处排除点，make-decision 只定接线方向与「不升为正式阶段」边界——已补入 D-006） | 证据：D-006 排除名单边界、RS-001 | owner=make-decision；consumer=build-plan |
| DF-major-4 | red+blue major：规划旅程同时被描述为「到 build-prd 结束/到 build-prd 停止/不把 build-prd 当正式阶段」，但未定义终止状态、执行边界、结果记录、失败行为 | 真实语义缺口：规划旅程的「停住」缺一个可核对的终止语义（什么算到了 build-prd、停下时记什么状态、失败怎么办） | fixed（用户裁决「现在写清」：新增 D-008 五元终止语义——执行边界=build-prd 6 步完成、终止状态=succeeded、结果记录=入任务追踪不当正式阶段、失败=failed 可重入该步不滑入代码阶段、状态与正式阶段集合解耦并存） | 证据：D-008 | owner=make-decision；consumer=build-spec |
| DF-major-5 | red major：D-002 许可阻断列表里原「两条物理底线」的第二条「破坏性 Git 动作需授权」与「不可逆操作授权」人为门 B 重复，边界含糊 | 原处置曾误称已澄清为「①身份建不起来②材料不可读」，但 D-002/OI-006 未同步且会把局部读取失败误解为普遍 gate；build-spec 正式审查再次暴露冲突 | fixed（用户最终裁决选 A：只有任务身份/worktree 无记录落点属于物理不可行；材料字节不可读仅使依赖其内容的具体动作失败并等待修复；不可逆操作授权只属于人为门 B。D-002/OI-006/目标/范围/T-004/核心需求已同步，历史原答复保留并标 superseded） | 证据：D-002、OI-006、build-spec canonical review `quality/reviews/results/build-spec-simple-2effef49-e4c0-57b9-a8dd-a8740021ca00.json`、用户裁决选 A | owner=make-decision/build-spec；retain |
| DF-major-6 | blue major：D-007「材料身份变化不得复用」未与 D-002「材料身份/哈希校验不得阻断推进」建立边界，实现者可能把身份不匹配做成机器门禁或放宽到复用旧审查 | 真实契约缺口：D-007 的复用语义与 D-002 的去门禁语义需显式调和，避免实现者误把身份校验做成推进门禁 | fixed（已在 D-007 与 OP-007/OP-008 明确：复用判定只影响「是否重派审查」，不构成任何阶段推进前置；snapshot 归 CARD-05） | 证据：D-007、OP-007/OP-008 裁决 | owner=make-decision；consumer=build-code；retain |
| DF-major-7 | blue major：`draft_spec_or_acceptance` 通篇只有 D-007 一条决策，成功/失败边界整体外指到未提交的 decision-log，受审材料里验收标准缺失 | 输入构造限制：detail 审查输入只能从 decision-log 抽取，无法把整个决策主体塞进 `draft_spec_or_acceptance` 一个字段 | fixed（属 detail 输入投影的固有边界，非决策缺陷；决策主体在本文件完整存在） | 证据：detail 材料契约（source_bundle=none） | owner=make-decision；retain |

**细节审查结论**：细节审查真实走通并产出有效发现。DF-major-2/3/4 三条原 needs_human 缺口经用户裁决后已分别补入 D-003（受控值契约）、D-006（排除名单边界）、D-008（规划终止语义）并关闭；DF-major-5/6/7 fixed，DF-blocking-1 rejected_invalid。detail 审查的 needs_human 项已全部处置，无未决。

## 最终确认

- 状态：accepted
- 原始确认出处（provenance）：用户原文「确认，走完 make-decision 收口」；确认凭证=`quality/confirmations/78c61b92a93f0218453a8c9d5800cef374b7d9765f33e14a0e4afd2e079a80c9.json`，绑定 `material_revision=revision-ceb45bf987af53b4dd7b72dad18b68f40b77f396cd4e6c240e9d04e4535eee14` 与 `snapshot_tree=0cd0b23e568ecd01ca86f00002c9b714316d7caa`（历史事实，不改写）。
- 当前修订的逐项审批绑定**不在本文件正文声明**：它由 canonical 人为确认记录承载（`quality/confirmations/<sha256>.json` 的 `human-confirmation.v3`），由 stage runner 以认证来源读取并在 `decision_freeze` 校验中比对当前修订与 snapshot。本文件只声明冻结包覆盖范围（见下节），不复制可能漂移的审批绑定，也不以正文自证审批。
- 未确认内容：无。后续用户进一步裁决：make-decision 按「实质完成、`outline_closed` 缺失如实披露」收口并进入 build-spec；该缺失不被伪造为 passed。

## 冻结包覆盖声明（freeze packet coverage）

- 覆盖范围：用户流程（两类任务的入口到终点路径）、数据状态（七值状态与 cohort 两值的允许取值与转换）、成功/失败边界（各阶段成功行为与失败/缺验证语义）、非目标（本卡明确不做项）。
- 说明：本节只声明覆盖范围；审批与修订绑定由 canonical 确认记录承载（见上节），避免正文自证与修订号自引用循环。
- 方向层面遗留问题：无（`## 未决项` 中的 OP-* 均为实现/交接事项，不构成方向层面遗留）。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| CLI 上显式选择任务类型参数 | 需多记一个参数，且与现有「声明+读回」契约重复一处入口形态 | D-003 |
| 宿主助手会话开头提问任务类型 | 任务尚未建立时问答没有落点，容易被当成重问一遍 | D-003 |
| 骨架层完全不存状态 | 会重现已踩过的坑：谁也不知道另一个阶段做到哪里 | D-003 |
| 保留「材料读不到就阻断整个阶段」的普遍兜底 | 该兜底容易退化回被明确要求删除的校验机器；材料字节确实不可读时只让依赖其内容的具体动作真实失败并等待修复 | D-002 |
| 保留流程清单的强制按序语义 | 等于保留 CARD-01 明确要去掉的 14 步顺序锁定 | D-002 |
| 删掉各阶段流程清单 | 审查会失去「本阶段该干什么」的参照，只剩结果好坏 | D-002 |
| 由启动代码动态拼接阶段拓扑 | 阶段列表变成运行时才知道，AC-01/02 无法逐字核对 | D-001 |
| 阶段拓扑只写在文档/技能说明里 | 无法验收「阶段列表逐字等于预期」，AC-01/02 基本失效 | D-001 |
| 本卡顺手删除阻断代码 | 撞 CARD-06 写面，且违反「先立新后拆旧」的依赖顺序 | D-004 |
| 只定规范不做实现 | CARD-01 的结果「可发起两类任务」将失去实现归属 | D-004 |
| 只真跑实施旅程、规划旅程用定义核对代替 | AC-01 没有真实执行记录，与 SD-05（真实入口联通实跑）冲突 | D-005 |
| 只核对拓扑定义与类型声明存在 | 用产物存在代替完成判据，验收失败 | D-005 |
| 不接线，只把 build-prd 写进拓扑声明 | 规划任务无法从入口启动，AC-01 与 E2E-1 都不成立 | D-006 |
| 把 build-prd 升为第六个正式阶段 | 与 build-prd 自身 SKILL.md:119-121 的自证约束相冲，且超出本卡范围 | D-006 |
| 另开独立修复 task 修审查复用缺陷 | 用户否决：会让前面几个任务都无法正常推进 | D-007 |
| 把审查复用缺陷修复归到 CARD-05 名下 | 用户否决：CARD-05 尚未开工，会把前置卡住 | D-007 |
| 把审查复用缺陷当阻塞、暂停任务等修好 | 与「零机器门禁、不建阻塞」及卡间边界相冲；已被 D-007 取代 | D-007（Supersedes T-010） |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RK-001 | 去阻断被误做成掩盖失败（母 PRD 风险 R3） | 触发：把「缺认证不阻断」实现成「缺事实不记录」；后果：历史失败事实被漂白，AC-05 失败 | 本卡 build-code/verify-code 与 CARD-04；owner=本卡主会话 |
| RK-002 | 拓扑定义改错代价全局（母 PRD CARD-01 局部风险） | 触发：阶段序列或类型映射写错；后果：后续 9 张卡在错误接口上施工 | 本卡 build-plan 冻结接口蓝图；owner=本卡主会话 + CARD-02 对齐 |
| RK-003 | 材料偷换无机器防护（母 PRD 风险 R6） | 触发：删除校验机器后材料被替换；后果：只能靠两道人为门、独立审查与真实执行兜底 | 跨卡；本卡明示该取舍 |
| RK-004 | 记录层停用内容寻址后文件名碰撞/覆盖（母 PRD 风险 R7） | 触发：普通文件名命名不规范；后果：追加记录被覆盖 | CARD-06/CARD-08；本卡不改记录层命名规则，只登记风险 |
| RK-005 | 规划旅程接线触及核心 stage 定义与排除名单（Grill G-001） | 触发：接线改动落到 stage-runtime/step-manifest/stage-context 等共享文件；后果：与 CARD-03/CARD-05/CARD-09 写面交叉，产生覆盖写入 | 本卡 build-plan 先冻结接口蓝图并核查逐处消费者；交叉面按 SD-11 协调 |
| RK-006 | build-prd 内部执行质量无卡承接（Grill G-003 边界事实） | 触发：用户首次真用规划任务，期望 PRD 质量有保障；后果：本卡只保证骨架与拓扑，不保证 build-prd 产出质量 | 边界事实登记；后续如需改进须另立卡 |
| RK-007 | 外部清理静默带走未提交的任务材料（2026-09-19 实际发生） | 触发：仓库被外部执行 worktree/分支清理时，未跟踪的 `decision-log.md` 随 worktree 一起消失（全盘与回收站无副本、无 dangling commit）；后果：本任务材料需从会话记录重建，且重建过程本身可能引入与丢失版本的不一致 | 本卡已完成逐字重建并保留校验修正；根治归 CARD-08（历史边界与最小接续）与 close 纪律；owner=本卡主会话登记、CARD-08 承接 |
| RK-008 | 审查复用实现是全 stage/track 共享实现（D-007 范围） | 触发：在 `findReusableReview` 加材料身份守卫；后果：影响 make-decision/build-spec/build-plan/build-code/verify-code/mini-task 全部审查面，并使若干把「材料变仍复用」固化为期望的既有测试转红 | 本卡承接修复；测试按新语义改写；整体审查链替换仍归 CARD-05 |
| DF-001 | 入口分流的内部实现形式（参数/配置形态） | 延期到本卡 build-plan | 本卡 build-plan |
| DF-002 | 校验机器的物理删除（revision 绑定链/快照树认证/材料身份/哈希/回执校验前置机制） | 延期到 CARD-06 | CARD-06 |
| DF-003 | 旧任务兼容与最小接续（窄状态集 7 值 + 回读检查） | 延期到 CARD-08 | CARD-08 |
| DF-004 | 资源占用产品层修复的效果实测 | 延期到 CARD-09 | CARD-09 |
| DF-005 | 本卡验收用例的具体参数细节（fixture、采样命令、环境假设） | 延期到本卡 build-plan | 本卡 build-plan |
| DF-006 | 审查链整体替换（换新代码审查工具、适配合同冻结、对比实验与 go/no-go） | 延期到 CARD-05；本卡只修「材料身份不得复用」这一条语义 | CARD-05 |

> 当前延期寄存器以 DF-001..DF-006 六项为准。OI-012 早期 selected_disposition 的“四项”只统计跨卡/实现主项，其 resolution 另含验收参数；D-005 将审查链整体替换补齐为第六项。spec.md 的 DEFER-001..007 是执行交接展开：其中“八处排除名单逐处冻结”是 D-006/DF-001 的 build-plan 义务，不是新增第七个产品延期方向。

### 质量边界

- build-spec 审查收口裁决（2026-09-20）：连续派发 fresh build-spec review 直至第七次属于执行偏差，不是 WorkflowHub 要求；正式 attempts 共 7 次，原始 attempt/result/report provenance 全部只读保留。第七次 `c6110d77-8ab5-5be9-a005-3e6f9a8606b1` 已完成，`semantic_status=available`、`coverage=satisfied`，三 provider 均 completed，报告保留其 findings。按用户裁决，以已有 canonical review 事实收口，不因 findings 修改材料或发起第八次审查；这些 findings 作为 build-plan/实现输入，若 publication 被 review/quality gate 拦截则如实登记门禁事实，不以重审修复。
- 质量事实（当前）：本 decision-log 的任务类型声明经 `readTaskTypeFromDecisionLog` 读回为「普通任务」；UI applicability 经 `readUiApplicabilityFromDecisionLog` 读回为 `non_ui`。D-007 修复后 direction/detail 独立审查均已针对真实材料走通并处置 findings，最终确认状态为 accepted；仅 host interaction aggregate 未由本 GUI 通道产生，故 `outline_closed=missing` 保留。
- 历史状态 superseded：此前「方向审查输入与真实材料不匹配、真实方向意见未获得」「细节审查待执行」「最终确认 pending、方向审查缺口未闭合」均是 D-007 修复与最终确认之前的历史快照，已被本节当前事实取代，不得再作为当前状态；原始失败过程仍在「审查处置」节保留。
- 推进资格：make-decision 内容、direction/detail 审查与最终确认已实质收口；`outline_closed=missing` 是当前唯一该阶段已知质量缺口，质量事实不构成推进许可证。
- 完成判据：Talk 各轮真实答复已记录、必要调研已真实处置（含 skipped 理由）、Grill 已执行、decision-log 为当期、direction/detail 独立审查真实走通且 finding 已处置、用户明确确认；host interaction aggregate 未由本 GUI 交互通道产生，故 `outline_closed` 保持 `missing`，不得伪造为通过。
- 实质收口裁决：用户明确选择「实质完成但 `outline_closed` 如实披露缺失、先进 build-spec」。因此 make-decision 的内容、审查和人确认按实质完成交接；缺失质量事实作为事实随任务进入 build-spec，不构成推进许可证，也不阻断同 task 继续工作。
- 不可逆授权边界：用户已明确授权将审查修复合入 main；main 已 fast-forward 到 `33319b90`（包含 `0f792a9b`）。push/archive/cleanup 等其他不可逆动作仍未授权。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OP-001 | 现有骨架中固定轮次、顺序锁与通用认证的确切强制点清单 | 已由 RS-001 回填，本条待关闭确认 | 本卡 make-decision 已回填 |
| OP-002 | 本卡验收用例的具体参数细节（fixture、采样命令、环境假设） | 延期项 DF-005 | 本卡 build-plan |
| OP-003 | 入口分流的参数/配置形态 | 延期项 DF-001 | 本卡 build-plan |
| OP-004 | 审查复用与材料身份漂移修复 | 已完成：`0f792a9b` + `33319b90`，针对性测试全绿，direction/detail 审查真实走通；用户授权后已 fast-forward 合入 main | 已关闭；后续整体审查链替换仍归 CARD-05 |
| OP-005 | 方向审查在真实材料上的独立意见 | 已获得：修复后 direction 审查 `available`、红蓝双 role available，并产出针对真实 OI 的 findings | 已关闭 |
| OP-009 | `outline_closed` host interaction aggregate 缺失 | Talk/Grill 真实发生且已写入本文件，但本 GUI 问答未走 host interaction recorder，无法合法生成内容寻址 aggregate；不得事后伪造 | 如实保持 `missing`，随任务进入 build-spec；host 接入问题后续处理 |
| OP-006 | 被外部清理的 worktree/分支是否会再次发生 | 清理来源未查明；本卡无法控制外部动作 | 需要用户确认清理来源；根治归 CARD-08 |
| OP-007 | 非 verify-code 阶段的 code snapshot 变化是否也应触发重审 | D-007 只裁定材料身份；用户裁决「只修材料身份，snapshot 归 CARD-05」，不在本卡扩展 | 已裁决：归 CARD-05 在换审查链时一并定 |
| OP-008 | 材料身份在复用语义中的定位（第六维 vs 五维之外的 currentness precondition）与 FR-C4-001 的张力 | 用户裁决「接受调和定位」——五维仍是 FR-C4-001 的 dedup key，材料身份是额外当前性门槛，不触碰 FR-C4-001 文本 | 已裁决：接受调和定位；若后续独立审查要求，再显式补 FR-C4-001 |

## Supersedes

无。本卡为母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` 的 CARD-01 承接任务，母任务材料只读，不触发母任务 close。

材料层面：本文件是 2026-09-19 丢失版本的重建版，替代丢失版本作为本 task 的当前 `decision-log.md`；丢失事件本身作为 RK-007 事实保留。

## 文档结果

| 产物 | 位置 | 状态 |
| --- | --- | --- |
| decision-log.md | `specs/workflowhub-thin-core-card-01-20260919/decision-log.md`（本 task worktree） | 已重建（step 1–10 写材料） |
| spec.md / plan.md / tasks.md | 由本卡 build-plan 产出 | 未创建（本阶段不假设其存在） |
| CONTEXT.md / ADR | 本卡不改动术语与 ADR；若 Grill 产生术语或 ADR 冲突在本节登记 | Grill 未发现术语/ADR 冲突 |
| 不复制 spec 的边界 | 本 decision-log 只记方向、边界、验收口径与交接；实现细节、文件落点与测试路线进入本卡 spec | 遵循 |

### Exit checks

- [x] 上下文一致：任务类型、拓扑、门禁边界、状态落点、卡间边界、接线范围与验收口径在 OI、决定、收敛检查三处一致。
- [x] owner：owner、合并责任、验收责任已登记（OI-011 / D-004）。
- [x] 接口一致：与 CARD-02 共享阶段/材料定义写面，本卡先冻结接口蓝图（D-004）。
- [x] 失败语义明确：成功/失败边界与 AC-01/02/03/04/05/56 的失败判据逐条写明。
- [x] 范围与延期明确：非目标 10 条、延期项 6 条（DF-001..DF-006）、风险 8 条（RK-001..RK-008）。

## 收敛检查

| 维度 | 用户答案 | 事实与材料引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户确认：规划任务到 build-prd 结束、实施任务走四阶段；任务类型在 make-decision 内以受控值声明；拓扑写进工作流定义按类型分两支 | R-001、R-002、R-003、R-010、OI-001、OI-002、OI-003 | 见「验收」行 |
| 范围 | 用户确认：严格按职责只做骨架与接线，CARD-02..10 范围不碰；状态写进任务自己的记录 | R-004、R-009、R-011、OI-004、OI-005、OI-010 | 见「验收」行 |
| 方案 | 用户确认：保留流程清单但取消其强制按序与凑步的锁语义；取舍：牺牲「流程清单的强制力」换取「不因缺步或乱序阻断推进」；被拒方案：删掉各阶段流程清单、继续强制按序、由启动代码动态拼接阶段拓扑、只写在文档里靠自觉；无未决项 | R-006、R-007、R-008、D-002、OI-006、OI-008 | 见「验收」行 |
| 验收 | 用户确认：两类任务都从真实入口真跑，另加不带机器校验材料仍能推进与两道人为门仍生效两个场景；只验拓扑与门禁，不验 build-prd 产出质量 | R-001、R-002、R-006、AC-01、AC-02、AC-56、OI-008 | 场景：从真实入口分别发起规划任务与实施任务，并构造不带机器校验材料（无 revision 绑定、无快照认证、无回执校验记录）的推进场景。数据来源：阶段事实记录与决策日志任务类型声明、入口交互记录、facts.jsonl 当前行。通过：规划任务阶段列表逐字等于 make-decision→build-prd 且无第三阶段、实施任务四阶段齐备且顺序正确、不带机器校验材料时推进不被阻断且两道人为门正常运作、历史阻断事实保留可查。失败：出现 build-plan/build-code/verify-code 任一阶段、阶段顺序错误、任一机器校验阻断推进、任一历史失败事实被改写为通过 |

## 核心需求

- **核心需求**：用户要在真实入口发起两类任务——规划任务（make-decision→build-prd）与实施/普通任务（make-decision→build-plan→build-code→verify-code）——任务类型由人工声明、不由体量自动分流；任一阶段推进除两类人为门外零机器门禁，唯一物理不可行是任务身份/worktree 没有记录落点，材料字节不可读仅使依赖内容的动作局部失败并等待修复；固定 Talk 轮次与流程清单顺序锁不再阻断推进。
- **核心目标**：让「可发起两类任务」与「推进零机器门禁」成为可核对的骨架事实：拓扑写进工作流定义按类型分两支、逐字可核对；规划旅程真接线、可从入口执行并停住；类型用受控值声明并读回；历史阻断事实与失败事实保留可查、不漂白。
- **已选方向**：复用现有 workflows/build-prd 作为规划终点并把接线做到可执行，不新增第三类旅程、不升为第六正式阶段；保留各阶段流程清单但取消其强制按序与凑步的锁语义；类型在 make-decision 内声明并读回，入口不新增类型参数；本卡严格按职责只做骨架与接线，先冻结阶段/材料定义接口蓝图供 CARD-02 及 Group 1 消费；审查复用缺陷按 D-007 在本卡修掉「材料身份不得复用」这一条语义。

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": {
      "result": "non_ui",
      "description": "母 PRD CARD-01 原文只涉及阶段拓扑、任务类型入口与推进门禁，未提出任何页面、交互或视觉要求（prd.md L233-263）"
    },
    "project_inventory": {
      "result": "non_ui",
      "description": "本仓为 Node CLI 与 runtime 项目，由 .mjs/.md/.json 构成，无前端框架、无路由表、无组件目录"
    },
    "planned_or_changed_frontend_fact": {
      "result": "non_ui",
      "description": "本卡改动面是流程定义、阶段清单语义与门禁骨架位，不计划也不包含任何展示层改动；母 PRD 已判 non_ui（prd.md L22、L258）"
    }
  }
}
```
