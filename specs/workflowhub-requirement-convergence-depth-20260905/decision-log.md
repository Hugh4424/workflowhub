# Decision Log — workflowhub-requirement-convergence-depth-20260905

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | make-decision 阶段的方向审查（direction review）不够详细，无法获得足够深刻的异源审查建议，导致后续返工 | 用户原话："make-decision阶段的方向审查和细节审查都不够详细，无法获得足够深刻的异源审查建议，导致后续很多返工" | 已覆盖（D-101~D-608） |
| R-002 | make-decision 阶段的细节审查（detail review）同样不够详细 | 同 R-001 原话 | 已覆盖（D-101~D-608） |
| R-003 | 方向审查之后没有基于有争议 findings 和用户进行 talk | 用户原话："方向审查和细节审查之后，都没有基于有争议的findings和我进行talk" | 已覆盖（D-101~D-608） |
| R-004 | 细节审查之后同样没有基于有争议 findings 的 talk | 同 R-003 原话 | 已覆盖（D-101~D-608） |
| R-005 | build-spec 阶段的审查不够彻底，审查之后也没有基于有争议 findings 和用户 talk | 用户原话："build-spec阶段的审查也是一样，不够彻底，审查之后也没有基于有争议的findings和我进行talk" | 已覆盖（D-101~D-608） |
| R-006 | 审查方式参考 skills/debate：每个 provider 同时扮演 2 个角色（甲队、乙队、丙队、丁队等），结合多个 provider 多角色的辩论结果获得更有价值的审查建议 | 用户原话："审查的方式能够参考skills/debate的方式，让每一个provider同时扮演2个角色…结合各个provider多个角色的辩论结果获得更有价值的审查建议" | 已覆盖（D-101~D-608） |
| R-007 | debate 技能目前几乎没用（原基于 Claude Code teammate 功能）；现在一般用 DSH 或 Codex；需要不依赖 teammate 的跨宿主机制 | 用户原话："现在这个debate技能几乎没用，因为原来是基于claude code的teammate功能做的，现在我一般用dsh或codex" | 已覆盖（D-101~D-608） |
| R-008 | 希望子代理之间能互相聊天；若有该机制则裁决辩论更方便 | 用户原话："还有没有类似的子代理之间互相聊天的机制了吧？如果子代理之间互相能聊天，那就更方便了" | 已覆盖（D-101~D-608） |
| R-009 | make-decision 调研浅薄的根因改造：参考《make-decision调研深度优化方案.md》，把研究机制（R0-R5、research-report.v1、deep-research 技能或 spec-research 升级、stage-reflection 挂钩）纳入一起考虑 | 用户原话："除了这些需求，我还有一些额外的需要也考一起做，请参考：/Users/Hugh/Downloads/make-decision调研深度优化方案.md" | 已覆盖（D-101~D-608） |
| R-010 | 必须按标准 WorkflowHub 流程执行：从 make-decision 开始、先创建 worktree、不跳阶段、不依赖 build-spec 补需求 | 用户原话："请按标准 WorkflowHub 开始这个任务吧，从 make-decision 开始，先创建worktree，不要跳阶段，也不要依赖 build-spec 补需求" | 已覆盖（D-101~D-608） |
| R-013 | 调研结果必须正确落盘到 task_dir 的任务追踪目录中，方便后续复盘 | 用户原话："我希望调研结果能正确落盘到task_dir的任务追踪目录中，方便后续复盘" | 已覆盖（D-101~D-608） |
| R-014 | 改造 decision-log 技能：make-decision 开始时先设计当前任务的需求框架（如 背景/调研/方案/验收 或 背景/问题/教训/目标/方案/扩展 或其他更专业结构，需调研不同任务类型）；调研/talk/审查/grill 均基于该框架逐步扩展补充；最终 decision-log 为"先大纲、再细化决策逻辑、再收敛为具体功能和方案"；每个决策有完整链条（为什么有此决策/上级决策/归属模块/产生什么具体功能/怎么来的）；最终结构与链条形成完整方案设计，阅读者能判断需求考虑是否清楚 | 用户原话："我希望改造一下decision-log技能：现在的最终decision-log是一个扁平的文件结构…我希望在make-decision开始的时候先设计一下当前任务的需求框架…每个单独的决策应该有详细的链条…" | 已覆盖（D-101~D-608） |
| R-015 | Talk/问答不要用聊天内容，改为**问答工具**呈现（结构化选项） | 用户原话："问答不要用聊天内容，改成问答工具" | 已覆盖（D-101~D-608） |
| R-016 | make-decision 调研机制需包含**工具选型**：外部调研用 anysearch；内部调研（代码/研发历史/文档资产）需调研用什么工具或技能合适；纯 agent 调研（无工具）效果很差 | 用户原话："make-decision的调研应该调研一下使用哪些工具，外部调研可以用anysearch，内部调研需要搜索一下应该用那些工具或技能比较合适。纯agent调研效果很差！" | 已覆盖（D-101~D-608） |
| R-017 | 审查机制=每 provider 每审查面指派两次：红队（wh-review 正常审查）一次 + 蓝队（对抗性审查：所有 decision 不成立/不值得改、纵向逐条否定、横向第三路/拽回"明确不做"/戳隐藏前提/防虚假共识）一次；方向审查=无方向摘要盲审组 + 含方向需求对抗组；全部结果后由主 agent 用改造后 debate 技能对所有歧义 debate 获得最终 findings | 用户原话："简单一些吧，每个provider同时指派两次：红队（wh-review的正常审查）一次，蓝队（对抗性审查……）一次。拿到所有结果后，再由主agent使用改造后的debate技能对所有歧义进行debate，获得最终findings。" 与 "方向审查同步进行两次，一次是没有方向摘要的盲审，一次是有方向和需求内容的对抗性审查" | 已覆盖（D-101~D-608） |
| R-018 | 同任务内 phase 制：一次全做，多分 phase，每 phase 独立开发、测试、验收、审查 | 用户原话："一次全做，可以多分一些phase，每个phase独立开发、测试、验收、审查！" | 已覆盖（D-101~D-608） |
| R-019 | 内部调研不能只用简单工具；需调研市面代码知识库/知识图谱工具并选型 | 用户原话："内部调研不能只用这些简单的工具，需要调研一下市面上比较好的代码知识库或知识图谱工具" | 已覆盖（D-101~D-608） |
| R-020 | make-decision 整个流程非常长，主会话上下文易爆炸导致后续任务质量下降；需设计 make-decision 所有 step/skill 的执行规划：哪些步骤用子代理执行、哪些可并行子代理、只回传最终结果；主会话只做派发、消息回传、整体规划；所有与用户交互相关的技能必须主代理执行（人工确认与交互结果） | 用户原话："make-decision整个流程非常长，会导致主会话上下文很轻松就爆炸…主会话只进行子代理任务的派发、消息的回传、整体任务的规划即可。所有和用户交互相关的技能必须主代理执行" | 已覆盖（D-101~D-608） |
| R-011 | 在 make-decision 过程中与用户一起仔细梳理：完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项 | 用户原话："在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项" | 已覆盖（D-101~D-608） |
| R-012 | 用户 Talk 用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接 | 用户原话："Talk 请用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接" | 已覆盖（D-101~D-608） |

## 需求-决策覆盖矩阵（五维 disposition）

| 维度 | 需求条目 | 当前处置 |
| --- | --- | --- |
| 业务目标 | R-001/R-002/R-005 审查深度；R-006/R-007/R-008 辩论机制；R-009/R-013/R-016/R-019 调研深度与工具；R-014 决策记录 | 已覆盖（D-101~D-104、D-201~D-204、D-301~D-303、D-401~D-404、D-501~D-502、D-608） |
| 流程/表面 | R-003/R-004/R-005 talk 接线；R-010 标准流程；R-015 问答工具化；R-018 phase 制 | 已覆盖（D-201~D-204、D-603、D-602；流程按标准走） |
| 数据/状态 | R-011 数据状态（阶段事实状态机契约） | 已覆盖（D-604 状态转移矩阵 + 事实契约入 spec） |
| 成功/失败/验收 | R-011 成功/失败边界；R-009 验证方式（用户提示次数=0） | 已覆盖（目标/成功失败边界 + 三重验证 T-021） |
| 约束/非目标/延期 | R-017 契约演进；不新增 stage/gate/第五材料；build-plan 等阶段不同构；X-001~X-004 | 已覆盖（D-101/D-202/D-602；D-603 phase；X 表） |

## 核心需求

- 核心需求：让需求收敛流程具备"审查深、争议必达、调研有契约、决策有结构"四项能力并落地可执行——机制落地 + 三重验证达成，返工根因（验收标准不清）对治完成。

## 目标

- 目标：达成并交付四能力（深度审查/争议真对话/跨宿主裁决辩论/有契约调研）+ decision-log 结构升级（需求框架+决策链+模块化），可执行验收见收敛检查；消除三类现象的目标由三重验证确认可达成。

## 成功/失败边界

- 成功边界（机制落地 + 三重验证，T-021）：
  - 审查：make-decision direction/detail 各执行红+蓝两次组请求（合同演进完成，AC-011 与配套测试绿）；build-spec 单次请求但指令含蓝队要素+验收专项；
  - 对话：方向/细节/build-spec 存在争议 findings 时，用户收到问答工具化的真实 ask→reply（make-decision Talk3/Talk4、build-spec findings 处置对话），用户决定写回 disposition/风险接收链；
  - debate：4 独立子代理+文件 mailbox 可在 DSH 运行（本任务内 dogfood 验证），Codex/Multica 有降级路径说明；产物落 debate/round-N/；
  - 调研：deep-research 技能契约落地（R0-R5+工具路由+落盘+复核）；本任务自身已实证（R0-R5 跑通、落盘、R5 复核、红蓝审查、Talk 工具化）；
  - decision-log：需求框架+模块化分组+链字段（含轻量告警）落地；本文档即为试运行样本；
  - 下任务实证：下一个含方向性调研的任务一轮跑通，用户提示次数=0（验证方式）。
- 失败边界：
  - 合同/测试未同步演进（纸面合规）→ 失败；
  - 争议 findings 未呈现或用户决定无写回 → 失败；
  - debate 依赖 Claude Code teammate 或单上下文角色扮演冒充独立子代理 → 失败；
  - 新机制引入 stage/gate/第五材料/新公共入口类（未登记）→ 违宪，失败；
  - 调研无工具路由或跳过无论证 → 失败（R1 强制）。

## 范围

- 当前范围：workflowhub 仓库自身的 `workflows/{make-decision,build-spec}/`、`skills/{wh-review,debate,talk-with-zhipeng,spec-research}/`（或 deep-research）、`runtime/` 中受影响的契约与校验、对应测试与 catalog/bundle/inventory 同步。用户只需要在使用阶段看到：审查更深、争议 findings 会被问到、多 provider 多角色结论汇总。
- 用户流程/结果只记索引和验收影响，细节进入 spec：用户流程 = 主 agent 每轮 stage 执行流程（talk 前有审查、审查后有 findings 对话）；本次无页面。
- 页面范围：非 UI——本任务不改任何页面/前端；`ui_applicability` 见下节。
- 数据状态：审查结果状态机（available/unavailable/single_round）、finding 处置状态（fixed/rejected_invalid/accepted_risk/needs_human）、talk 生命周期（ask/wait/reply/resume）均沿用现有事实模型，不新增状态机。

## 非目标

- 不改 build-plan / build-code / verify-code 的审查与对话流程（同构改造=延期 X-002，出现真实消费再评估）。
- 不新增 stage、不新增第五材料；新控制面（问答工具、risk-accept 路由）必须登记 owner/consumer/删除条件。
- 不做跨 provider 的第二轮交叉质询（X-001：3rd-review 多 phase 协议；触发条件=红蓝+debate 实证后仍显不足）。
- 不把审查/debate 变成推进 gate 或 pass 判据（F4/Q1）。
- 不升级 decision-entry.v2 机器强制 schema（X-003：待真实机器消费者出现）。
- 不做本任务内额外真实样例任务（X-004：三重验证已替代，T-021）。

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "conclusion": "non_ui", "reason": "原始需求全部关于审查/talk/辩论/调研机制，无页面、交互或前端诉求" },
    "project_inventory": { "conclusion": "non_ui", "reason": "workflowhub 自身为编排运行时，改动面在 workflows/skills/runtime；无前端路由或页面 consumer 涉及本次改动" },
    "planned_or_changed_frontend_fact": { "conclusion": "non_ui", "reason": "本任务无计划前端改动；参考文件亦明确为决策侧机制，与前端能力任务独立" }
  }
}
```

## 收敛检查

| 维度 | 用户答案或无新需求 | 事实或材料引用 | 可执行验收标准 |
| --- | --- | --- | --- |
| 目标 | 用户已确认目标=机制落地+三重验证（Talk R2/Q2=①；T-021） | D-608、T-002、T-021、需求框架§5 | 场景：机制交付；数据来源：任务 docs/测试；通过：三重验证清单全绿；失败：任一机制不可运行或争议无写回 |
| 范围 | 用户已确认=审查+对话+debate+调研+decision-log 全做（一次全做多 phase） | D-603、T-001、T-005、T-015 | 场景：phase 交付；数据来源：每 phase 验收+异源审查；通过：所有 phase 全绿；失败：任一 phase 未过验证 |
| 方案 | 用户已选择：红蓝两次仅 make-decision（G1）、同编成 2×（G2）、4 独立子代理+mailbox（G4）、契约演进（T-019）、文本层+轻量告警（T-020）；取舍：同编成 2× 成本换蓝队完整率；被拒方案：单请求两阶段、全阶段红蓝、v2 schema 强制、试炼样例任务；未决项：OPEN-004（grok/pi 路径泄漏）、OPEN-005（编码细节） | D-101~D-608、G-001~G-004 | 场景：审查对话闭环；数据来源：合同/测试/产物；通过：红蓝合同与测试绿+争议闭环有写回；失败：契约或写回缺失 |
| 验收 | 用户已确认=三重验证（本任务 dogfood+每 phase 独立验收审查+下任务实证） | T-021、FND-DB04、D-603 | 场景：下任务含方向性调研；数据来源：实际任务记录；通过：用户提示次数=0；失败：≥1 次提示加深 |


## 关键事实（本次会话勘探证据）

| fact_id | 事实 | 来源/证据 | 处理状态 |
| --- | --- | --- | --- |
| F-001 | wh-review 每审查面只发一次 group request，所有 provider 共享同一 packet+prompt；无 per-provider prompt 通道 | skills/wh-review/scripts/simple-review-runner.mjs:378-385；review-provider-client.mjs:365-381；3rd-review lib/broker.mjs:476,835 | 设计输入 |
| F-002 | findings 聚合只有 cluster 级 disposition（actionable/needs_corroboration/invalid_evidence/nonblocking_minor），无"争议/disputed"概念；provider 分歧只留 adjudication.clusters provenance | runtime/review/canonical-review-result.mjs:72-79,92,167；stage-review-disposition.mjs:46-55 | 设计输入 |
| F-003 | 运行时对"talk round 3 用审查发现"无强制绑定；仅 talk-with-zhipeng 技能文本声明 Round 3=盲审发现 | workflows/make-decision/steps.json:11；skills/talk-with-zhipeng/SKILL.md:24-25；stage-content-contracts.mjs:1730-1857 | 设计输入 |
| F-004 | make-decision detail 审查（step 10）后无任何用户对话，直接 approve（step 11） | workflows/make-decision/steps.json:14-17 | 设计输入 |
| F-005 | build-spec 被三个硬契约锁死不可 Talk：check-skill-closure.mjs:9 MAKE_DECISION_ONLY_SKILLS={talk-with-zhipeng,grill-with-docs}；stage-routing-and-concrete-testing.test.mjs:37-41,70-75,96；workflow-v2-contract.test.mjs:55-62；且 interaction aggregate 硬性 stage===make-decision（stage-content-contracts.mjs:1870） | 同上 | 设计输入 |
| F-006 | debate 技能全仓 0 调用方；parallel_agent_capability 无宿主适配器；完整依赖 Claude Code teammate 措辞 | skills/catalog.yaml:426-439（used_by_stages:[]）；skills/debate/SKILL.md:24-25,157-160 | 设计输入 |
| F-007 | DSH 宿主实测：子代理可持续化、父↔子 send_message 双向可用、角色间可由父代理中转通信 | 本会话实测（子代理 fd3d2375 验证） | 设计输入 |
| F-008 | Codex CLI 仅有 collab 特性（显式指示 spawn 子代理），无法自定义子代理消息协议；跨宿主通用方案=文件 mailbox，DSH 原生消息可作加速 | Codex 官方讨论 #11041（collab=true） | 设计输入 |
| F-009 | 评审发现的"人在环"机制已有半成品：serious finding → risk-pause 卡（card_hash 绑定）已实现，但 kernel.acceptReviewRisk 无 public 路由 | runtime/review/stage-review-disposition.mjs:107-150；task-kernel-implementation.mjs:942-965；tools/cli/stage-runtime.mjs:649-660 | 设计输入 |
| F-010 | make-decision 调研条款"只有答案能改变方向才调研"+跳过只需一句话+无完成标准/无读原文要求；spec-research 仅 16 行且被动应答 | workflows/make-decision/SKILL.md:142-145；skills/spec-research/SKILL.md | 参考文件与核查一致 |
| F-011 | 宪法红线：不得新增 gate/确认点/公共入口/第五材料；single_round 语义（一轮语义 advice）；质量裁决不得自审自判（Q3）；review 不作 pass 门；改动 debate 需同步 bundle sha256/catalog.hash/repository-inventory.tsv | CONSTITUTION.md F4/F7/Q3/F11；CONTEXT.md:81-82；check-skill-closure.mjs:259-263 | 设计约束 |
| F-012 | 潜在 bug：wh-review materialIdForInput（含 manifest.json、未排序）与 broker canonicalWorkflowHubMaterialId（排除 manifest.json、排序）算法不一致，严格冻结路径（dispatchFrozenProviderInput）真实往返可能 MATERIAL_INCOMPLETE | simple-review-runner.mjs:183-193 vs 3rd-review lib/attachments.mjs:18-26 | 待修复评估（可延期） |
| F-013 | 用户返工主因：验收标准定得不够清楚——build-code 时 agent 自己发现遗漏，verify-code 用户验收时发现更多 agent 发现不了的遗漏 | Talk Round 1 用户原话："这属于验收标准定的不够清楚导致的" | 新增：验收标准可判断性成为本任务审查要点之一 |
| F-014 | decision-entry.v1 已覆盖来源/逻辑/理由/影响/后果/被拒/未决/Supersedes 20 必填字段；缺正向链接/模块归属/需求回链/下游产物 | runtime/schemas/decision-entry.v1.json（20 required, additionalProperties:false） | 设计输入（R-014） |
| F-015 | 机器强制：16 个 h2 精确标题（REQUIRED_MAIN_SECTIONS）+ coverage 恰好一次 + analyzeDecisionConvergence 五维/收敛检查 + R-NNN 索引 | runtime/stage/stage-content-contracts.mjs:25-38,2068,2420 | 设计约束（文本层安全的边界） |
| F-016 | make-decision V3.2.0 已有 需求-决策覆盖矩阵五维/收敛检查四行表/UI applicability（框架雏形） | workflows/make-decision/SKILL.md:110-139 | 复用输入（R-014） |
| F-017 | spec-research 仅 16 行且被动应答（不写文件）；anysearch 提供通用/垂直域/URL 抽取；deep-research 机制为参考文件提议未落地 | skills/spec-research/SKILL.md；skills/anysearch/SKILL.md；参考文件 §5 | 设计输入（R-009） |
| F-018 | 宪法约束：不得新增 stage/gate/第五材料/公共入口类；Q3 禁止自审自判；F4 review 不作 pass 门；"答案能改变方向才调研"条款无完成标准 | CONSTITUTION.md F4/F7/Q3/F11；workflows/make-decision/SKILL.md:142-145 | 设计约束 |
| F-019 | 技能改造须同步 skill-bundle.json sha256、catalog.yaml、docs/architecture/repository-inventory.tsv；新控制面须登记 owner/consumer/删除条件 | check-skill-closure.mjs:259-263；AGENTS.md 治理边界 | 实施约束 |
| F-020 | 蓝队/红队大量 provider 失败的根因：①`simple-review-runner.mjs` 的 bundle 未做宿主绝对路径脱敏（`redactProviderHostPaths` 已存在于 review-materials.mjs 但未被 simple 路径使用），材料含 `/Users/Hugh/Downloads/...` 等绝对路径；②provider 输出引用该路径→3rd-review hasPrivatePath 出口拦截（PUBLIC_RESULT_INVALID）→成员身份被降级为 provider 字面值→wh-review 客户端报 PROVIDER_IDENTITY_INVALID 掩盖真实原因。取证：原始 v3 group 五家全部 completed+identity 正确（脚本抓包确认）；修复=材料脱敏+身份降级时保留原始错误码（commit 5c4a3b3f / merge 6090fbc5，已入 main）；3rd-review 行为正确 | 本会话取证（raw group 抓包）+ 修复 commit | 已修复并重试 |
| F-021 | 测试策略规则：docs/standard-workflow.md:310"只跑必要的受影响检查"；repository 内不允许任何阶段跑全量 vitest（npm run test:safe 全量）——用户明确抱怨此问题反复出现；本次修复子代理指令误加全量跑导致拖时 | docs/standard-workflow.md:310 + 用户原话（"是不是一直在进行全量回归测试…太浪费时间了，为什么现在还是经常出现这个问题"） | 教训：本任务后续全部验证只跑针对性测试；规则强化登记 D-607 |

## 调研重点（R0 缺口问题清单，按参考文件 R0-R5）

| gap_id | 问题 | 影响的决策轴 | 不知道答案会怎样 | 现状 |
| --- | --- | --- | --- | --- |
| G-001 | 各宿主（DSH/Codex/Multica）的子代理互聊能力与限制是什么 | debate v2 机制形态（文件 mailbox vs 宿主原生消息） | 会选错机制导致不可搬运 | 已实测 DSH（F-007/F-008）；Codex 文档级证据 unverified |
| G-002 | 多角色对抗裁决的证据与业界实践（D3/MAD-M²/LLM-as-judge 偏差） | 是否值得做、角色结构 | 可能为"堆机制"（F10 违宪风险） | debate 反偏见文档已引用 6 篇文献；建议三角测量 |
| G-003 | wh-review 单轮契约演进到"单请求内双角色对抗"的最小合规路径 | 审查深化实现层 | 触碰 single_round 契约与多组测试 | 已勘探（F-001/F-011），待设计确认 |
| G-004 | build-spec 放开"findings 处置对话"对宪法 F7/独占契约的解释边界 | talk 接线形态 | 违宪或过度改动 | 已勘探（F-005/F-009），待设计确认 |
| G-005 | 深度调研机制业界最佳实践（deep research 循环/预算/饱和判定） | R0-R5 细节 | 重新发明或过度设计 | 参考文件已含 jina + arXiv 一手文献，经复核降置信度 |
| G-006 | 用户实际返工量/失败案例（用哪几次任务、什么现象） | 问题严重度/是否值得做 | 无法证明收益（F8/F10） | Talk Round 1 已答（Q4→验收标准不清，见 F-013） |
| G-007 | 决策记录/需求框架的成熟结构（ADR、IBIS、Design Doc、QDD、spec-kit、RFC 等）与适用任务类型 | R-014 decision-log 结构改造 | 只能沿用扁平结构或自创低质量结构 | 已调研（v1.2）；组合式方案经独立复核修正 |
| G-008 | 决策链条的数据结构（上级决策/模块归属/下游功能/来源）如何表达 | R-014 决策链条 | 链条无法追溯 | 已调研（文本层安全加法；模块化文件结构） |
| G-009 | 需求框架如何驱动"调研→talk→审查→grill"逐步扩展补充 | R-014 结构即流程容器 | talk/审查与结构脱节 | 已调研（声明式定位 + 现有校验兜底） |
| G-010 | 本任务自身内部调研面：workflowhub 历史决策文档结构（specs/archive、docs/adr、requirement-lineage 等） | R-014 复用内部资产 | 内部已有好结构而重复造轮子（S1） | 已调研（子代理盘点完成） |
| G-011 | 内部调研（代码/研发历史/文档资产）应使用哪些工具或技能；外部调研工具选型 | R-016 调研工具选型 | 纯 agent 调研效果差，缺口发现不全 | 已调研（v1.2 新增；工具矩阵见调研要点 7） |

## 需求框架（R-014 组合式骨架·草案——先大纲，待方向审查/grill/决定定稿后细化填充）

> 本任务为"机制设计+实现"复合型：采用 研究类骨架（问题-论断-证据-裁决）为主体，叠加 feature 类骨架（背景-目标-方案-验收-扩展）作为产出视图。

### 1. 背景（为什么现在做）

- 用户在做 workflowhub 前端能力调研任务（20260904）期间三处痛点：审查浅（返工）、审查后有争议发现但没对话、调研要反复人工提示才加深。
- 本任务在上一个需求收敛任务（20260828：R→D 矩阵/spec-analyze 补检查）基础上再进一步——从"覆盖完整"走向"结构清晰+深度审查+人在环裁决"。

### 2. 问题（节点：待裁决）

- P-001 审查深度：单轮线性清单式审查，无对抗性结构；provider 之间互不可见 → 异源建议浅（用户原话 R-001/R-002/R-005）
- P-002 人在环缺失：方向/细节/build-spec 审查后，有争议发现未与用户对话；needs_human 无写回位置（F-006；R-003/R-004/R-005）
- P-003 调研浅：无完成标准/无读原文/无迭代/无来源分层/跳过太容易/自产自判（R-009 + 参考文件 §2）
- P-004 决策记录扁平：无需求框架、决策无链、阅读者无法判断"考虑是否清楚"（R-014）
- P-005 debate 技能失效：Claude teammate 依赖、零调用方（R-007）
- P-006 验收标准不清（用户 Q4 反馈）：build-code 自漏 + verify-code 用户验收发现更多（F-013）

### 3. 论断（调研证据裁决——初版结论，待 Talk3/grill 确认）

- V-001 审查深化=单请求内双角色对抗（零 broker 改动）+ 独立上下文裁决辩论（防偏措施落地层）（G-002/G-003 证据）
- V-002 人在环=make-decision Talk3/Talk4 + build-spec findings 处置对话（问答工具化 R-015），回复写入 finding_dispositions/风险接收链（F-006/F-009 边界）
- V-003 调研=R0-R5 子流程 + research-report.v1 落盘 task_dir（R-013）+ 工具选型（anysearch 外部/glob+grep+git+子代理 内部，R-016）
- V-004 决策记录=组合式骨架（2 类 preset）+ 文本层链字段 + 模块化分组（R-014；零机器校验改动）
- V-005 debate v2=宿主中立（文件 mailbox 通用 + DSH 原生消息加速；F-011 证据）
- V-006 验收标准治理=build-spec 审查"AC 可判断性+验收盲区"专项（T-007）

### 4. 方案（模块 → 决策节点，待 D- 编号）

- 模块 A 审查深化：A1 双角色对抗指令（direction=丙+甲、detail=乙+丁、build-spec=丙+乙）；A2 验收专项；A3 争议标记（disputed flag）
- 模块 B 争议对话：B1 make-decision Talk3 绑定方向 findings；B2 detail 后 Talk4；B3 build-spec findings 处置对话（契约演进）；B4 问答工具化
- 模块 C debate v2：C1 角色子代理+文件 mailbox；C2 反偏见（匿名/交换/rubric/预算/2 轮封顶）；C3 bundle/catalog/inventory 同步
- 模块 D 调研机制：D1 deep-research 技能（R0-R5）；D2 research-report.v1 落盘；D3 工具选型；D4 stage-reflection 调研深度维度
- 模块 E decision-log：E1 需求框架骨架；E2 链字段（文本层）；E3 模块化文件组织
- 模块 F 契约与合规：F1 single_round 保留（单请求）；F2 build-spec 独占解除（3 处契约+测试）；F3 宪法红线清单对照

### 5. 验收（机制落地维度）

- 验收 A：三处审查指令含双角色对抗条款；争议 findings 出现时用户收到真实对话且决定有记录；debate 技能可在 DSH/Codex/Multica 任一宿主运行（能力判定+文档）且产物落 debate/round-N/；下一个含方向性调研任务跑通 R0-R5 无需用户提示。
- 验收 B（本任务实证维度）：本 make-decision 自身=试运行（调研 R0-R5 已跑、落盘已验、R5 复核已验、Talk 工具化进行中）。

### 6. 扩展/延期

- X-001 跨 provider 第二轮交叉质询（broker 多 phase）——延期
- X-002 build-plan/build-code/verify-code 同构改造——延期
- X-003 机器级决策链校验（decision-entry.v2）——待有真实消费后评估


## 决定

> 组织方式（R-014 试运行）：按模块分组（h3=模块），每条 D 条目含 decision-entry.v1 全字段 + 文本层链字段（derived_from / module / requirement_ids / artifacts）；框架节点引用见「需求框架」节。

### 模块 A — 审查深化

#### D-101（红蓝两次组请求 + 契约演进）
- question/final_option: 每 provider 审查面如何实现"扮演两次" / 红队组（正常/盲审）一次 + 蓝队组（对抗）一次，正式写入合同（同一逻辑 review fact = 红+蓝两次组请求）
- recommendation/plain_language: 推荐——用户 T-013/T-016 拍板，三 provider 一致确认单请求无法表达该语义
- decision: make-decision 的 direction/detail 两审查面各执行两次组请求：红队（direction=无方向摘要盲审；detail=正常 detail 审查）+ 蓝队（对抗：所有 decision 不成立/不值得改、纵向逐条否定、横向第三路、拽回明确不做、戳隐藏前提、防虚假共识；direction 蓝队=含方向+需求）；不为此追求空 findings 复审；"一次 public request"条款按"一个逻辑 fact"重述为"红蓝两次组请求"，其余阶段（build-plan/build-code/verify-code）维持 single_round
- source_type/reference/exact_excerpt: Talk R3 T-013/T-016 + T-019（契约演进）+ Grill G-001（仅 make-decision 两面）；蓝队三 provider blocking 原话（FND-DB01）
- approval_binding: Talk R3 后续批次 real reply（问答工具）+ Grill real reply
- facts_and_constraints: F-004 单轮契约；AC-011；simple-contracts/direction-reveal/route-mode 等测试断言；蓝队 blocking×3
- Logic: 用户要"两次扮演" -> 单请求无法承载 -> 契约演进为"一个逻辑 fact=红蓝两次组请求" -> 更新合同/测试（含 AC-011 审计） -> 红线保留（不空 findings 复审、不复审 loop）
- choice_reason/impact: 收益=盲审与对抗分离、方向审查深度根因修复（FND-DR04）；影响 wh-review 合同、simple-contracts/make-decision-direction-reveal/third-review-host-config/review-provider-client-v3 测试、AC-011 审计、build-spec 合同文本（红蓝仅 make-decision）
- consequences_and_risks: 请求数×2、耗时×2（超时 600s 不变）；**红蓝关联契约**：两次请求共享同一 material_id 语义身份 + pair_id（role=red|blue）元数据，runtime 校验同 pair 同 material（未满足则 record partial，不伪装成完整红蓝）；**蓝队降级语义**：蓝队 outcome=partial/失败时，review fact=available-with-failures 并显式标注 blue_incomplete，成功边界相应降级为"红+蓝（蓝 incomplete 如实记录）"，不得当作完整红蓝通过
- rejected_alternatives: 单请求两阶段（盲/显边界靠指令，机器不可见，被用户契约演进方案替代）；维持纯盲审（不解决 FND-DR04）
- unresolved_items/owner: 无
- Supersedes: none（本任务新增）
- derived_from: 无（根决策；框架节点=方案·模块A）
- module: 审查深化
- requirement_ids: R-001, R-002, R-006, R-007, R-017
- artifacts: wh-review 合同（make-decision.md）、simple-review-runner.mjs（role 阶段指令 + role/pair 元数据）、contracts 测试、AC-011

#### D-102（build-spec 审查深化：单次请求 + 强化指令 + 验收专项）
- question/final_option: build-spec 审查深度如何提升 / 单次请求 + 蓝队要素强化指令 + "AC 可判断性与验收盲区"专项
- recommendation/plain_language: 推荐——G1 选择保持单次，深度靠指令与对话
- decision: build-spec 审查保持 single_round 单次组请求；指令强化（横向第三路/戳隐藏前提/防虚假共识/纵向逐条否定候选方案）+ 新增验收专项：检查"AC 能否被真实测试打破、失败路径是否可验收、用户验收时会发现的 agent 盲区"（F-013）
- source_type/reference/exact_excerpt: Talk R2 T-007 + Grill G-001
- approval_binding: Talk R2 real reply + Grill real reply
- facts_and_constraints: F-013 用户返工主因；build-spec 合同"审查顺序：需求覆盖→旅程→失败边界→可打破的验收→范围/维护成本"
- Logic: 返工根因=验收不清 -> 审查专项对治 -> 单次请求+指令强化 -> 验收盲区 findings 经争议对话确认
- choice_reason/impact: 针对 F-013 精准补强；影响 build-spec 合同 + review-materials/instructions + 测试
- consequences_and_risks: 指令变长（保持 ≤128KB 输出/512KB prompt 上限内）；依赖 provider 遵循指令（配合争议对话兜底）
- rejected_alternatives: AC 硬校验（与"测试不是推进门"冲突）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-101（同审查机制族）
- module: 审查深化
- requirement_ids: R-005, R-011
- artifacts: contracts/build-spec.md、review-materials.mjs、review lens 测试

#### D-103（争议判定：共识+分歧双定义 + 三态矩阵）
- question/final_option: 什么算"有争议 findings" / 共识（≥2 provider 独立提出同一问题）或分歧（provider 间 severity/evidence_kind 冲突或一提出一沉默）
- recommendation/plain_language: 推荐（T-017）
- decision: 争议=共识（≥2 provider 独立提出同一问题）∪分歧（provider 间 severity/evidence_kind 冲突或一提出一沉默）；判定矩阵三态（支持/沉默/反对×provider）；映射现有 cluster 分类；clusterRecord 增加 disputed/consensus 标注（provenance 保留，reportable findings 不变）；**送用户过滤规则（G3）**：方向级或影响验收标准的争议→用户；实现级分歧→debate 独立上下文裁决；实现级共识→主 agent 直接修复并登记（不送用户，避免无效交互）
- source_type/reference/exact_excerpt: Talk R3 T-017 + 蓝队 FND-DB06 + 蓝队 FND-DT（共识过滤缺失，codex major）+ Grill G3
- approval_binding: Talk R3 real reply
- facts_and_constraints: F-003 现有聚合无争议概念；FND-DB06
- Logic: 用户要"有争议 findings" talk -> 先定义争议 -> 三态矩阵 -> 争议清单供 debate/talk
- choice_reason/impact: 双向覆盖（共识=可信、分歧=需裁决）；影响 canonical-review-result.mjs clusterRecord + result schema（可选字段）+ 测试
- consequences_and_risks: 轻微 schema 增字段（provenance 层）；reportable findings 语义不变（不成为 gate）
- rejected_alternatives: 只做共识聚类（漏"一提出一沉默"）；只做 needs_human 转达
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-101
- module: 审查深化
- requirement_ids: R-003, R-004, R-005
- artifacts: canonical-review-result.mjs、result.schema.json、review 测试



### 模块 E — decision-log 结构

#### D-104（文本层字段 + 轻量告警）
- question/final_option: 决策链字段怎么保证可维护 / 文本层增强（T-006）+ 格式轻量告警（不阻断、不升 schema、不进 gate）
- recommendation/plain_language: 推荐（T-020 用户拍板）
- decision: D 条目新增可选链字段 derived_from/module/requirement_ids/artifacts；决定区按模块 h3 分组；run-checks 类检查对链字段做格式告警（缺失/非法仅告警）：精确规则=①derived_from/module 为 `D-\d+`/模块名标识符；②requirement_ids/artifacts 为逗号分隔 ID（R-\d+|D-\d+|路径）；③引用目标存在性软检查（decision-log 内 D-ID 存在）；告警输出到 run-checks 汇总；decision-entry.v2 schema 延期（X-003）
- source_type/reference/exact_excerpt: Talk R2 T-006 + Talk R3 后续批次 T-020 + 蓝队 FND-DB03 + 蓝队 FND-DT（链字段规则缺失，codex major）
- approval_binding: Talk R2/R3 real replies
- facts_and_constraints: F-015 机器强制清单（16 h2/entry schema/coverage/五维/R-NNN）不可破坏；文本层安全（markdownSectionBody 只被同级标题截断、schema 校验对象是 JSON entries）
- Logic: 链字段承载"决策链条" -> 无校验必腐烂 -> 格式+存在性轻量告警 -> 不动机器强制面
- choice_reason/impact: 治腐烂且不违 F10/F11；影响 decision-log 技能/模板、run-checks（轻量告警检查与测试）
- consequences_and_risks: 告警不阻断=仍可能腐烂（接受，靠 stage-reflection 维度暴露）
- rejected_alternatives: v2 schema 强制（改动大，延期 X-003）；纯声明式（无告警，腐烂无感）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-501
- module: 决策记录
- requirement_ids: R-014
- artifacts: skills/decision-log、模板、run-checks/新测试

### 模块 B — 争议对话

#### D-201（make-decision 争议 Talk 接线：Talk3 强绑定方向 findings + 新增 Talk4）
- question/final_option: 两审查面的争议 findings 如何到用户 / direction：Talk3 以方向红蓝 findings+debate 裁决争议清单为材料（问答工具批次）；detail：审查后新增 Talk4
- recommendation/plain_language: 推荐（R-003/R-004 原需求 + 用户 T-008/流程修订）
- decision: make-decision 增加第 4 轮 talk（detail findings 处置）；Talk3 材料显式含"争议清单（共识+分歧）+ debate 裁决书存疑项"；aggregate round_count 3→4（动态校验支持）
- source_type/reference/exact_excerpt: T-008 流程修订 + talk-with-zhipeng Round 3 职责
- approval_binding: Talk R2/T-008 real reply
- facts_and_constraints: F-008 运行时无绑定（技能文本级指引）；aggregate round_count 动态（stage-content-contracts.mjs:1895-1900）
- Logic: 用户要"审查后有争议 talk" -> direction 已有 Talk3 槽位（强绑定）+ detail 新增 Talk4 -> 真实 ask→wait→reply→resume（问答工具）
- choice_reason/impact: 最小改动（talk-with-zhipeng 加 Round 4 职责 + steps.json + SKILL.md + 生命周期校验测试）
- consequences_and_risks: 交互多一轮（用户接受）；findings 处置决策需写回（D-203）
- rejected_alternatives: 只在 approve 前展示卡（对话质感弱）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-103（争议定义为其输入）
- module: 争议对话
- requirement_ids: R-003, R-004, R-008
- artifacts: workflows/make-decision/{SKILL.md,steps.json,skill-deps.yaml}、talk-with-zhipeng、interaction aggregate 测试

#### D-202（build-spec findings 处置对话——正式放开）
- question/final_option: build-spec 如何与用户讨论争议 findings / 正式放开：findings 处置对话（非 Talk/Grill/Clarify 语义；由 talk-with-zhipeng 的 findings 模式或专属技能承载）
- recommendation/plain_language: 推荐（T-014 正式放开）
- decision: check-skill-closure MAKE_DECISION_ONLY_SKILLS 改为仅 grill-with-docs（talk-with-zhipeng 放开给 build-spec 的 findings 模式）；更新 stage-routing/workflow-v2-contract/aggregate 三处契约与测试；build-spec SKILL.md 删除"Do not run Talk or Grill"并写明分工（findings 处置对话 vs 方向 Talk）
- source_type/reference/exact_excerpt: Talk R3 T-014 + 蓝队 FND-DR02/FND-DB（正式放开与硬契约）
- approval_binding: Talk R3 real reply
- facts_and_constraints: F-009 三处硬契约；F-006 needs_human 无写回；interaction aggregate stage 硬校验（stage-content-contracts.mjs:1870）
- Logic: 用户选放开 -> 契约演进（grill 仍独占）-> build-spec 对话生命周期落点（stage outcome 内校验或 aggregate v2 findings_talk）-> 写回 D-203
- choice_reason/impact: 满足 R-005；影响 check-skill-closure、3 组契约测试、stage-content-contracts（aggregate 增 findings_talk 或 stage outcome lifecycle 校验）、build-spec steps/skill-deps/SKILL
- consequences_and_risks: 契约面修改大（用户已确认）；不新增确认点语义（对话是事实处置不是新确认门）
- rejected_alternatives: 变通通道（风险卡+spec-clarify）；治理决议先行（慢）
- unresolved_items/owner: 生命周期落点（stage outcome vs aggregate v2）——build-spec 定稿时选择
- Supersedes: none
- derived_from: D-103
- module: 争议对话
- requirement_ids: R-005, R-015, R-009
- artifacts: check-skill-closure、stage-content-contracts、stage-routing/workflow-v2 测试、build-spec 三件套

#### D-203（处置写回闭环 + accept-risk public 路由）
- question/final_option: 用户裁定（fixed/rejected/accept_risk 或方向级决策）如何写回 / finding_dispositions 增加 user_decided 语义 + accepted_risk 补 public 路由（kernel.acceptReviewRisk 接线）
- recommendation/plain_language: 推荐（蓝队 FND-DB02/DB 一致指出最后一环断裂）
- decision: ①用户对话答复绑定 finding（card/reply 引用进 disposition evidence_ref + source=user_reply）；②needs_human 处置后状态写回（user_decided）；③accepted_risk 经现有风险接收链补 public 路由（确认接口或既有 confirm 语义扩展），quality/evidence/risk-replies 落盘
- source_type/reference/exact_excerpt: 蓝队 FND-DB02 + kimi minor FND-DR08 + F-006/F-009
- approval_binding: Talk R3 real reply（问答工具）
- facts_and_constraints: validateReportableFindingDispositions 已要求 accepted_risk 绑定认证 receipt（stage-review-disposition.mjs:94-97）；kernel.acceptReviewRisk 无 public route（task-kernel-implementation.mjs:942-965）
- Logic: 争议 talk 的答案没有写回=半成品 -> 补 public 路由与 disposition 绑定 -> 闭环（争议→debate→talk→decision-log 登记）
- choice_reason/impact: 直接修补断链；影响 stage-review-disposition、stage-runtime（public 路由）、task-kernel-implementation（接线）与测试
- consequences_and_risks: public 路由新增需按治理登记（owner/consumer/删除条件）——按 R-015 落实
- rejected_alternatives: 只记录不改（断链保留）
- unresolved_items/owner: public 路由的语义命名——build-spec 定稿
- Supersedes: none
- derived_from: D-202
- module: 争议对话
- requirement_ids: R-003/R-004/R-005/R-015
- artifacts: stage-review-disposition.mjs、stage-runtime.mjs、task-kernel-implementation.mjs、risk 测试

#### D-204（问答工具化）
- question/final_option: 交互呈现方式 / 结构化问答工具（2-3 选项、推荐项、后果/风险）替代聊天体
- recommendation/plain_language: 推荐（R-015）
- decision: talk 卡片以宿主结构化问答工具呈现（本会话即 ask 工具）；技能文本说明"工具优先"；工具新控制面登记 consumer=stage outcome 交互校验、owner=对应 stage、删除条件=机制被替代
- source_type/reference/exact_excerpt: T-011 用户原话（"问答不要用聊天内容，改成问答工具"）+ kimi minor FND-DR07
- approval_binding: Talk R2 real reply
- facts_and_constraints: 宿主 ask→wait→reply→resume 缝隙在宿主侧（stage-content-contracts 只校验契约形状）；IO 契约需定义（蓝队 codex major"问答工具没有定义输入输出契约"）
- Logic: 用户要求工具化 -> talk-with-zhipeng 适配层改为"结构化问题卡"（即工具选项）-> **IO 契约**：入参=question_id/axis/options(≤3 含 consequence/risk)/recommended；出参=answers[{question_id, option_id|free_text}] + reply_ref/reply_hash（宿主认证）-> 映射到 finding_dispositions（source=user_reply, evidence_ref=reply_ref）或 risk-acceptance receipt
- choice_reason/impact: 交互质量提升、选项可点选、**写回可绑定**；影响 talk/grill/spec-clarify 技能文本与样例
- choice_reason/impact: 交互质量提升、选项可点选；影响 talk/grill/spec-clarify 技能文本与样例
- consequences_and_risks: 宿主无问答工具时降级为文本卡（如实记录）
- rejected_alternatives: 纯文本聊天（现状）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-202
- module: 争议对话
- requirement_ids: R-015
- artifacts: talk-with-zhipeng、grill-with-docs、spec-clarify 技能文本

### 模块 C — debate v2

#### D-301（4 独立子代理 + 文件 mailbox）
- question/final_option: debate 角色执行形态 / 甲/乙/丙/丁 4 个独立子代理（角色立场书独立产出）+ 文件 mailbox 交锋 + 主代理法官禁言
- recommendation/plain_language: 推荐（G4 用户拍板；R-008 子代理互聊偏好）
- decision: host 能力判定（host-subagent）；4 角色各自独立上下文；Phase2 用 mailbox（{output-root}/debate/round-N/mailbox/）轮转或宿主原生消息（DSH send_message 中转）作为加速；2 轮封顶；Judge=主代理全程禁言
- source_type/reference/exact_excerpt: Grill G4 + F-011（三宿主能力）+ 蓝队 FND-DB05
- approval_binding: Grill real reply
- facts_and_constraints: DSH 父↔子消息实测；Codex 发布版无 agent-to-agent；Multica @mention；文件共享前提+降级路径（父代理串行转发）
- Logic: 用户要角色辩论 -> 4 独立子代理提供真独立上下文 -> mailbox 跨宿主 -> DSH 消息加速
- choice_reason/impact: 防从众/防自偏最强形态；debate 技能 v2 重心
- consequences_and_risks: 子代理×轮次成本；规则纪律（≤200 字/立场锁死/致命缺陷自述）必须强约束
- rejected_alternatives: 单子代理多角色（上下文共享易自偏）；2 子代理折衷
- unresolved_items/owner: mailbox 文件格式细节——build-spec
- Supersedes: 原技能"Claude Code teammate"机制
- derived_from: 无（根决策；T-013 用户意图）
- module: debate 裁决
- requirement_ids: R-006, R-007, R-008
- artifacts: skills/debate/{SKILL.md,references/role-spawn-templates,arbitration-protocol}、skill-bundle.json/catalog/inventory

#### D-302（反偏见措施与轮次预算）
- question/final_option: 辩论防偏 / 匿名+随机交换、rubric 评分、预算封顶、2 轮封顶、禁止附和、保留分歧
- recommendation/plain_language: 推荐（G-002 证据 + 原 debate 7 约束）
- decision: 沿用并强化原 7 条反偏见硬约束 + 新增：裁决前匿名化与交换顺序、rubric 化（每条 finding 按代价/收益/证据）、预算声明、分歧保留为证据（不强行共识，MAD-M² 掩码错误记忆）
- source_type/reference/exact_excerpt: 调研 G-002（2305.14325/2410.04663/2603.20215/2306.05685/2605.00914）+ anti-bias-guardrails
- approval_binding: 调研裁决（用户已采纳"必须结构化"）
- facts_and_constraints: 从众 85.5%（同质无角色限定）；LLM-judge 偏差；D3 匿名化/预算停止
- Logic: 辩论有效但必须结构化 -> 反偏见措施落地 -> 防偏清单自检
- choice_reason/impact: 证据驱动的机制设计；影响 anti-bias-guardrails 更新
- consequences_and_risks: 措施增加流程复杂度（受控：规则固定）
- rejected_alternatives: 不设防偏（盲目辩论）
- unresolved_items/owner: 无
- Supersedes: 原 7 条（继承）
- derived_from: D-301
- module: debate 裁决
- requirement_ids: R-006
- artifacts: anti-bias-guardrails.md、arbitration-protocol.md、pk-rules 测试

#### D-303（裁决权限分级）
- question/final_option: 辩论结果谁说了算 / 主 agent 综合裁决 + 方向级争议必达用户（G3 分级）；裁决书不构成质量 pass
- recommendation/plain_language: 推荐（G3 用户拍板 + 宪法 F4/Q3）
- decision: 实现级争议→由 debate 的独立上下文角色（丙/丁评委）产出裁决建议+独立复核子代理复核，主 agent 只登记；方向级与"影响验收标准"争议→用户；裁决书含裁决者标注（谁提出/谁反驳/谁裁决）、引用幸存/被驳论点；产物不可变（debate/round-N/）；不设"辩论通过"门（Q3：主 agent 不得单方裁决针对自身产物的异源质疑）
- source_type/reference/exact_excerpt: Grill G3 + 蓝队 FND-DB07 + 红队 FND-DT（Q3 自审自判红线，antigravity major）+ CONSTITUTION F4/Q3
- approval_binding: Grill real reply
- facts_and_constraints: Q3 禁止自审自判（辩论输入=已有异源 findings 取舍）；F4 review 不作 pass 门
- Logic: 分级减少无效交互 -> 方向级必达用户 -> 主 agent 只裁决实现级 -> 全程可追溯
- choice_reason/impact: 符合宪法且交互可控；影响裁决书模板与输出模板
- consequences_and_risks: 分级判定本身需一致（MR-2 分类复用）
- rejected_alternatives: 全部过用户（疲劳）；主 agent 全揽（自审自判风险）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-302
- module: debate 裁决
- requirement_ids: R-003/R-004/R-005/R-006
- artifacts: output-template.md、arbitration-protocol.md

### 模块 D — 调研机制

#### D-401（deep-research 技能：R0-R5 契约化）
- question/final_option: 调研深度如何机制化 / 新建 skills/deep-research：R0 规划→R1 迭代检索（中英双语、读原文、查询重写）→R2 并行深读→R3 三角测量→R4 research-report.v1 落盘→R5 独立复核
- recommendation/plain_language: 推荐（R-009 参考文件方案 + 本任务实证）
- decision: 新建 deep-research 技能（R0-R5 契约 + 停止条件预算（≤3 轮/问题、连续 2 轮无新增=饱和、时间盒）+ 跳过需论证 + 工具路由（D-403））；make-decision SKILL.md 调研条款引用该技能；spec-research 保留（build-plan 点状疑问通道），在其 SKILL.md 注明与 deep-research 分工
- source_type/reference/exact_excerpt: 参考文件 §5 + R5 复核 RV-08 + Talk R2/R3 决策
- approval_binding: Talk R2 T-003（完整深调研）+ 用户 Q6 工具路由
- facts_and_constraints: F-010 旧条款无完成标准；G-005 业界实践一手核实；本任务自身即试运行（已跑）
- Logic: 调研浅=无契约 -> 技能固化 R0-R5 -> 停止条件+预算 -> 落盘+复核 -> 深度成为可验收事实
- choice_reason/impact: 直接对治 R-009；影响 skills/catalog、make-decision skill-deps（新依赖+consumer 登记）、stage-reflection（D-404）
- consequences_and_risks: 新技能需 bundle/闭包同步；调研耗时上升（用户已接受）
- rejected_alternatives: 只改 make-decision 一段话（无契约）；升级 spec-research 为双模式（职责混杂）
- unresolved_items/owner: 技能的正式名称与 catalog 登记细节——build-spec
- Supersedes: none
- derived_from: 无（根决策）
- module: 调研机制
- requirement_ids: R-009, R-013, R-016, R-019
- artifacts: skills/deep-research/（新建）、catalog.yaml、make-decision/SKILL.md、spec-research/SKILL.md

#### D-402（research-report.v1 落盘 task_dir）
- question/final_option: 调研产物往哪放 / content-addressed research-report.v1 落盘 task_dir 任务追踪目录 quality/evidence/
- recommendation/plain_language: 推荐（R-013 用户明确要求；本任务已实证落盘）
- decision: schema research-report.v1（questions[question/decision_axis/rounds/key_sources(tier/read_full)/evidence/confidence/open_items] + coverage + saturation_note + internal_vs_external + primary_source_rate + review_status）；落盘 `<task_dir>/quality/evidence/research-report-<sha256>.json`；decision-log 只引用 path+hash；vNext 化需要 consumer/owner/删除条件登记（deep-research 技能）
- source_type/reference/exact_excerpt: R-013 用户原话 + RS-001 实证（v1.0~v1.3 已落盘）
- approval_binding: Talk R2 T-011/R-013
- facts_and_constraints: task_dir 结构（quality/verify.json 等）；四材料不承载（decision-log 引用）
- Logic: 复盘要求落盘 -> 内容寻址 -> 引用不复制 -> 可复核
- choice_reason/impact: 满足 R-013；影响 deep-research 技能输出契约
- consequences_and_risks: sha256 命名需与字节一致（已实现）
- rejected_alternatives: 落 worktree（不入 task_dir，不便于全局复盘）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-401
- module: 调研机制
- requirement_ids: R-013
- artifacts: deep-research 技能、本任务 quality/evidence/（实证）

#### D-403（调研工具路由：外部+内部）
- question/final_option: 调研用什么工具 / 外部=anysearch+web_fetch+子代理深读；内部=glob+grep+read+git log/show+子代理并行+方法论技能（diagnosing-bugs/grill-with-docs）+（G-012 选型）git/rg/ast-grep 基础栈、可选 GitHub MCP/repomix、大仓 CodeGraph
- recommendation/plain_language: 推荐（R-016/R-019 用户要求 + G-011/G-012 实证）
- decision: deep-research 技能写死工具路由表；纯 agent 无工具检索视为不合格（R1 强制"必须用工具"）；显式降级：无 anysearch→记录 unavailable；无子代理→串行深读
- source_type/reference/exact_excerpt: R-016/R-019 + G-011/G-012 调研结论 + 用户"纯agent调研效果很差"
- approval_binding: Talk R2 T-012 + Talk R3 T-018
- facts_and_constraints: G-012 最小可行栈（git/rg/ast-grep 零依赖零索引；CodeGraph 大仓；Sourcegraph/SCIP/Neo4j/embedding=长期基建 F10）
- Logic: 工具缺失=调研浅 -> 路由固化 -> 降级显式 -> 效果可验证
- choice_reason/impact: 治根；影响 deep-research 正文
- consequences_and_risks: ast-grep 需安装（可选装；未装则用 grep+git 降级并记录）
- rejected_alternatives: 自建知识图谱/embedding 栈（F10）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-401
- module: 调研机制
- requirement_ids: R-016, R-019
- artifacts: deep-research 技能、G-012 报告引用

#### D-404（stage-reflection 调研深度维度）
- question/final_option: 复盘如何盯住"调研浅" / stage-reflection 增加维度：一手来源率、收敛率、[OPEN] 数、工具使用记录
- recommendation/plain_language: 推荐（参考文件 §5.6）
- decision: stage-reflection judgment 增加调研深度区块（维度缺省 not_applicable 时说明）；不新增 gate
- source_type/reference/exact_excerpt: 参考文件 §5.6
- approval_binding: 参考文件方案（用户引用）+ Talk 决策
- facts_and_constraints: stage-reflection 已有六区块格式；S4 技能指标
- Logic: 复盘可见 -> 浅调研无处遁形
- choice_reason/impact: 轻量；影响 stage-reflection 技能与判断 JSON
- consequences_and_risks: 无
- rejected_alternatives: 无
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-401
- module: 调研机制
- requirement_ids: R-009
- artifacts: stage-reflection 技能

### 模块 E — decision-log 结构

#### D-501（组合式需求框架：2 类 preset）
- question/final_option: 需求框架用什么结构 / 组合式：功能类=背景-问题-目标-方案-验收-扩展；研究类=问题-论断-证据-裁决；决策挂节点+节点带"待补证据"标记
- recommendation/plain_language: 推荐（T-005 + G-007 调研）
- decision: decision-log 开头新增"需求框架"节（h2）+ 骨架节点；make-decision 开始时先按任务类型建骨架（R0 由骨架缺口生成）；其余任务类型用 mini 骨架（精简）；节点声明式"待补证据"标记（R5 复核 RV-05：声明式定位+现有 section 级校验兜底）
- source_type/reference/exact_excerpt: T-005 + G-007（spec-kit 式 preset）+ 蓝队 FND-DR10
- approval_binding: Talk R2 real reply
- facts_and_constraints: 16 个 h2 为硬校验（新增 h2 不被禁止）；覆盖矩阵/收敛检查/UI applicability 不动
- Logic: 结构=容器 -> 骨架驱动 R0/talk/审查/grill 回填 -> 大纲→细化→收敛
- choice_reason/impact: 满足 R-014 核心；影响 decision-log 技能/模板/make-decision SKILL
- consequences_and_risks: 骨架复杂度预算（本任务用 1 主骨架+模块）；声明式依赖遵循（复盘兜底）
- rejected_alternatives: 单一通用结构（研究/迁移类挤变形）；每次自定义（无法沉淀）
- unresolved_items/owner: preset 数量（2 类起步，其余验证后增）——build-spec
- Supersedes: none
- derived_from: 无（根决策）
- module: 决策记录
- requirement_ids: R-014
- artifacts: skills/decision-log、模板、make-decision/SKILL.md、本任务 decision-log（试运行）

#### D-502（模块化文件组织）
- question/final_option: 相关决策如何聚集 / 决定区按模块 h3 分组；每个模块=同主题决策集合；模块内 D 条目按链序排列
- recommendation/plain_language: 推荐（T-006 用户"文件结构也要增强，相关决策放在同一个模块之内；方便人类阅读"）
- decision: decision-log"决定"节内按模块（h3=模块名）分组；模块列表由需求骨架方案节点驱动；跨模块引用用 D-ID + derived_from
- source_type/reference/exact_excerpt: T-006 用户原话
- approval_binding: Talk R2 real reply
- facts_and_constraints: markdownSectionBody 只被同级标题截断（h3 分组安全）；决定区 h2 不变
- Logic: 平铺不可读 -> 模块聚簇 -> 人读友好
- choice_reason/impact: 直接满足 R-014"看清需求考虑得清楚"
- consequences_and_risks: 模块划分需一致（按骨架方案节点=天然稳定）
- rejected_alternatives: 纯 h3 无模块语义（用户明确要模块）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-501
- module: 决策记录
- requirement_ids: R-014
- artifacts: decision-log 技能/模板、本任务（试运行）

### 模块 F — 契约与合规

#### D-601（契约演进边界与测试更新清单）
- question/final_option: 红蓝/对话放开的契约面 / 集中更新：wh-review 合同（make-decision 红蓝）、build-spec 合同（单次+专项）、check-skill-closure、interaction aggregate、契约/审计测试（simple-contracts/direction-reveal/route-mode/AC-011/stage-routing/workflow-v2/review-provider-client-v3）
- recommendation/plain_language: 推荐（演进边界=仅 make-decision；G1）
- decision: 按 G1/G2 边界执行；全部测试同步（新断言+旧断言修订）；AC-011 审计更新；不为空 findings 复审保留
- source_type/reference/exact_excerpt: G-001/G-002 + FND-DB01
- approval_binding: Grill real replies
- facts_and_constraints: F-011 红线；F-019 技能同步
- Logic: 契约演进必须成对更新 -> 清单化 -> 每 phase 验收覆盖
- choice_reason/impact: 防"纸面合规"（历史教训 FND-001 类）
- consequences_and_risks: 改动面大（用户已知情同意）
- rejected_alternatives: 只改文本不改测试（纸面合规）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-101/D-202
- module: 契约与合规
- requirement_ids: R-006/R-007/R-011
- artifacts: 前述全部契约/测试文件

#### D-603（phase 制：每 phase 独立开发/测试/验收/异源审查）
- question/final_option: 一次全做如何控制风险 / 按模块划 phase（A 审查深化→B 争议对话→C debate v2→D 调研机制→E decision-log→F 契约合规），每 phase 独立开发+测试+验收+异源审查后进入下一 phase
- recommendation/plain_language: 推荐（T-015 用户拍板，对治蓝队 FND-DB08/codex blocking"无交付边界"）
- decision: phase 划分=模块边界（相互依赖序：契约 F 先行或随 A/B 并行，由 build-plan 排定）；每 phase 完成标志=开发+本 phase 契约/测试绿+本 phase 用户验收+一次异源审查（红或蓝，视 phase 性质）；phase 失败不阻断其他 phase 的独立部分（记录 unavailable）
- source_type/reference/exact_excerpt: T-015 用户原话 + 红队 FND-DT（R-018 无 D 条目承载，kimi major）
- approval_binding: Talk R3 real reply
- facts_and_constraints: R-018；runtime 步骤无 phase 概念（phase 是组织/交付粒度，不新增控制面）
- Logic: 全做但不失控 -> 模块化 phase -> 每 phase 独立验收 -> 风险逐块消化
- choice_reason/impact: 满足 R-018；影响 build-plan phase 排程与验收节奏
- consequences_and_risks: phase 间重复实现少量基础设施（可复用部分提前抽象）
- rejected_alternatives: 一次性交付（无验收风险点）；拆任务（R-009 用户已并）
- unresolved_items/owner: phase 排程细节——build-plan
- Supersedes: none
- derived_from: D-602
- module: 契约与合规
- requirement_ids: R-018
- artifacts: build-plan/tasks.md（phase 清单与验收点）

#### D-604（状态转移矩阵：审查/对话/调研失败语义）
- question/final_option: 失败与降级的下一步规则 / 显式转移矩阵（无争议/部分 unavailable/蓝队超时/debate 失败/用户中止/问答工具不可用）
- recommendation/plain_language: 推荐（红队+蓝队一致指出"只有状态名称没有转移规则"，codex major×2）
- decision: 定义矩阵并落入合同文本：①无争议+无分歧→不入 debate 不入 talk，直接主 agent 修复+登记；②红队 complete 蓝队 partial/failed→available-with-failures 标注 blue_incomplete，debate 输入=已完成集，用户告知蓝队不完整；③全部 unavailable→review fact unavailable，修复路由/材料后重试一次；④debate 无裁决或 2 轮未决→存疑清单入用户（D25/人工裁决，不静默）；⑤用户中止 talk→保留已答部分，未答项标记 user_deferred 进入风险表（不推断）；⑥问答工具不可用→降级文本卡并记录工具降级事实；⑦蓝队/红队 provider 单成员失败→其余成员结果照用（partial 事实保留）
- source_type/reference/exact_excerpt: 红队 FND-DT（codex major"没有可执行转移规则"）+ 蓝队 FND-DT（codex major 蓝队失败降级）
- approval_binding: Talk R3/后续批次 real replies（规则源于已定级 G3/T-017/T-019）
- facts_and_constraints: 现有 single_round 拒绝语义（unavailable 可重试仅当缺失路由/材料改变）；reportable findings 处置校验
- Logic: 明确语义 -> 失败不伪装 -> 如实记录 -> 不阻塞
- choice_reason/impact: 可验收的失败语义；影响合同文本与测试
- consequences_and_risks: 矩阵条目需维护（随机制演进）
- rejected_alternatives: 不定义（蓝队失败被当正常完成——蓝队指出）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-101/D-202/D-301
- module: 契约与合规
- requirement_ids: R-003/R-004/R-005/R-017
- artifacts: wh-review 合同、build-spec 合同、测试

#### D-605（material_id 算法一致性修复）
- question/final_option: F-012 潜在 bug 是否纳入本任务 / 修复 materialIdForInput 与 broker canonicalWorkflowHubMaterialId 一致性（排除 manifest.json、按 path 排序）+ 回归测试
- recommendation/plain_language: 推荐（红队/蓝队均点名该风险未处置；若不修，严格冻结路径 dispatchFrozenProviderInput 真实往返会 MATERIAL_INCOMPLETE）
- decision: 统一本地 materialIdForInput 与 broker 算法（canonicalMaterialManifest 排序 + 排除 manifest.json 条目）并加回归测试（含真实 broker 往返 fixture）；设计文档注明"packet 身份=材料身份"语义
- source_type/reference/exact_excerpt: F-012 + 红队 FND-DT09/codex major + 蓝队（material_id 风险）
- approval_binding: 本任务修复决策（低风险、防返工）
- facts_and_constraints: 两个算法差异已实测（含 manifest/不排序 vs 排除 manifest/排序）
- Logic: 不修则严格路径必挂 -> 统一算法 -> 回归测试 -> 消除
- choice_reason/impact: 防后续 review 隐藏故障；影响 simple-review-runner.mjs + 测试
- consequences_and_risks: 改变 material_id 值与历史记录（新值，不回溯旧记录——旧记录只读保留）
- rejected_alternatives: 延期（风险持续存在）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-101
- module: 契约与合规
- requirement_ids: R-001/R-002/R-005（审查可靠性）
- artifacts: simple-review-runner.mjs、review 测试

#### D-606（审查材料宿主路径脱敏 + 身份降级错误码保留）
- question/final_option: 蓝队大量失败的真因如何处置 / bundle 材料脱敏（reuse redactProviderHostPaths）+ identity 降级时保留原始错误码
- recommendation/plain_language: 推荐（用户："找到根本原因就直接修复、测试、提交、合并，然后再次重试"）
- decision: ①simple-review-runner buildBundle/materialIdForInput 对全部材料先脱敏（与 material_id 同源计算）；②identity-invalid 分支保留 broker 原错误码+identity_degraded 标注；③已入 main（commit 5c4a3b3f，merge 6090fbc5）；④蓝队重试（用户指令）
- source_type/reference/exact_excerpt: F-020 取证 + Talk 4 用户指令
- approval_binding: Talk 4 用户指令（修复/测试/提交/合并/重试）
- facts_and_constraints: redactProviderHostPaths 已有实现；3rd-review hasPrivatePath 行为正确（不改）
- Logic: 材料含宿主路径 -> provider 引用 -> 出口拦截 -> 身份降级掩盖 -> 脱敏+错误码保留 -> 重试
- choice_reason/impact: 一次修复消灭系统性失败；影响 simple-review-runner + 测试（已提交）
- consequences_and_risks: material_id 语义变化（新值，不回溯）
- rejected_alternatives: 只改重试策略（不除根）；改 3rd-review 放行私有路径（错误方向）
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-101
- module: 契约与合规
- requirement_ids: R-001/R-002/R-017
- artifacts: simple-review-runner.mjs、material-redaction.test.mjs、simple-review-runner.test.mjs

#### D-607（测试策略规则强化：只跑必要的受影响检查）
- question/final_option: 全量回归反复出现如何根治 / 把 docs/standard-workflow.md:310"只跑必要的受影响检查"写入 AGENTS.md 硬规则 + 本任务后续验证一律只跑针对性测试
- recommendation/plain_language: 推荐（用户抱怨："根本没必要在任何时候进行这个全量测试…为什么现在还是经常出现这个问题"）
- decision: AGENTS.md 增加硬规则："任何阶段、任何修复、任何子代理指令，只运行受影响的针对性测试（vitest 指定文件/目录或指定脚本），禁止全量 vitest/npm run test:safe 除非用户或 CI 守卫明确要求"；本任务后续所有验证（含 phase 验收）按此执行
- source_type/reference/exact_excerpt: docs/standard-workflow.md:310 + 用户原话 + F-021
- approval_binding: Talk 4 用户原话（隐含授权）
- facts_and_constraints: 既有文档规则存在但 agent 不遵守；root cause=指令设计未引用规则
- Logic: 规则在文档 -> 不在指令 -> 反复违反 -> 写入 AGENTS.md 硬规则 + 本任务示范
- choice_reason/impact: 直接根治；影响 AGENTS.md（实施在 build-spec 阶段登记）
- consequences_and_risks: 无（纯减少浪费）
- rejected_alternatives: 仅口头强调（无效）
- unresolved_items/owner: AGENTS.md 增补实施——build-spec（本任务内）；本任务内遵守
- Supersedes: none
- derived_from: 无
- module: 契约与合规
- requirement_ids: R-011（流程质量）
- artifacts: AGENTS.md（build-spec 实施）

#### D-608（make-decision 主会话上下文预算模型）
- question/final_option: make-decision 长流程如何不炸主会话 / step×executor 矩阵（M/S/B/P）+ 上下文守恒 6 规则
- recommendation/plain_language: 推荐（R-020；本任务全程实证=执行模型样本）
- decision: 采用"主会话=调度器"模型：交互类（talk×4/grill/approve/confirm/reflection/发布）M 独占；重活（检索/深读/草稿/汇总/校验/复核）S/P 下沉；命令（wh-review 红蓝、文件、hash）B 后台落盘；全量产物 content-addressed 落盘、主会话只收 ref+≤500 字摘要；子代理回传强制结构化（结论+证据 ref+置信度）；并行上限=研究 4/debate 4/红蓝 2；候选生成外包、决策在主
- source_type/reference/exact_excerpt: R-020 用户原话 + AGENTS.md"重活派子代理" + 本任务实证（4 勘探+3 深读+1 复核并行、红蓝后台、3 版落盘摘要）
- approval_binding: 本任务用户确认（待最终卡）
- facts_and_constraints: talk/grill/spec-clarify 需人工确认=主会话；文档规则"只跑必要受影响检查"同样约束子代理指令
- Logic: 主会话炸=质量降 -> 调度器模型 -> 交互独占+重活下沉+落盘摘要 -> 上下文守恒 6 规则 -> 每步只留决策语义
- choice_reason/impact: 直接治 R-020；影响 make-decision SKILL.md/技能文本（build-spec 实施）+ 未来所有阶段复用；裁决分级遵循 G3（方向级必达用户，实现级独立上下文裁决、主 agent 只登记）
- consequences_and_risks: 子代理结果质量依赖指令完备（补：模板化回传格式）；并行资源配额（上限防抖）；执行规划经独立复核修订（debate 行/归属/字数额度/裁决分级）
- rejected_alternatives: 保持全主会话（现状，炸）；把交互也外包（违反人工确认）
- unresolved_items/owner: 摘要模板/子代理回传 schema 定稿——build-spec
- Supersedes: none
- derived_from: D-101（同审查机制族共享执行模型）
- module: 契约与合规
- requirement_ids: R-020
- artifacts: workflows/make-decision/SKILL.md（build-spec 实施）、执行规划节（本文件）

#### D-602（非目标与延期确认）
- question/final_option: 边界确认 / 非目标=不新增 stage/gate/公共入口类/第五材料；延期=跨 provider 第二轮交叉质询（X-001）、build-plan/build-code/verify-code 同构改造（X-002）、dec-entry.v2 机器校验（X-003）、本任务内额外样例任务（X-004，被三验证替代）
- recommendation/plain_language: 推荐（T-010/T-021）
- decision: 登记并保持可见；延期项各附触发条件（如出现真实消费再评估）
- source_type/reference/exact_excerpt: T-010 + T-021
- approval_binding: Talk R2/R3 real replies
- facts_and_constraints: 宪法 F11（无 consumer 不新增）
- Logic: 边界清晰 -> 演进有序
- choice_reason/impact: 防范围蔓延
- consequences_and_risks: 延期项可能在 build-code 后被重提（按触发条件）
- rejected_alternatives: 无
- unresolved_items/owner: 无
- Supersedes: none
- derived_from: D-102
- module: 契约与合规
- requirement_ids: R-011
- artifacts: 本文件风险延期表



## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/三项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 红蓝两次契约演进的边界：全部五阶段 vs 仅需求收敛面 | 仅 make-decision 两面（direction/detail）；build-spec 保持单次请求+强化指令+验收专项+争议对话 | ADR created；hard to reverse=是/surprising=是/true trade-off=是 | Grill 用户回答 |
| G-002 | 蓝队成本与 provider 编成 | 同编成（红队全量 provider），成本≈2×，报告标注角色；无独立蓝路由（简化） | 与 G-001 合并成 ADR | Grill 用户回答 |
| G-003 | 争议裁决人在环分级 | 方向级争议→必达用户；实现级→主 agent 经 debate 裁决+登记；"影响验收标准"的争议也必达用户 | ADR：人在环分级准则 | Grill 用户回答 |
| G-004 | debate v2 执行形态 | 4 个独立子代理（甲/乙/丙/丁）+ 文件 mailbox 交锋 + 主代理法官禁言；DSH 原生消息可选加速 | 与 ADR 合并 | Grill 用户回答 |


## make-decision 执行规划（R-020：主会话上下文预算模型）

> 设计依据：本任务自身全程运行即实证（并行子代理、落盘摘要、后台 CLI、独立复核均已实操）；AGENTS.md"重活派子代理"；docs/standard-workflow.md:310"只跑必要受影响检查"；talk 类技能必须主会话（人工确认语义）。

### 执行器分类
- M（主会话）：只做派发、接收摘要、决策与用户交互、定稿与发布。
- S（子代理，独立上下文）：重活执行者——检索/深读/分析/生成草稿/复核/汇总；只回传结构化摘要（≤500 字）与 ref。
- B（后台任务/脚本）：零上下文的命令执行（CLI 运行、文件操作、hash、校验），输出只落盘。
- P（并行）：研究 R2 深读（2-4 个 S 并行）、debate 四角色（4 个 S 并行）、红蓝两请求（2 个 B 并行）。

### Step×Executor 矩阵

| step | 执行器 | 子代理分工 | 主会话最小输入/输出 |
| --- | --- | --- | --- |
| 1 load-context | M+S | S 读原始需求/仓库/技能 → 摘要+需求-决策覆盖矩阵草案 | 入：无；出：摘要卡+矩阵草案（M 校验定稿） |
| 2 triage-scope | M+S | S 产三分类/不确定性/非目标草案 | 出：草案卡（M 定稿） |
| 3 talk-r1 | **M（交互）** | S（可选）给候选问题池 | 出：问题卡+用户回复（登记 T 表） |
| 4 research-inputs | S 为主 | R0 规划：M 定 gap 清单（S 出候选）；R1-R2：2-4 个 S 并行深读（每 S 负责 1-2 gap，搜索+精读+摘录）；R3：M 三角测量或 S 汇总+M 审；R4：S 写 research-report.json（content-addressed 落盘）；R5：独立 S 复核（并行） | 入：gap 清单；出：report hash+结构化摘要+复核 finding |
| 5 talk-r2 | **M（交互）** | S（可选）选项卡草案 | 出：问题卡+用户回复 |
| 6 direction-advice | B+S | B：wh-review CLI 红/蓝两请求**并行**（输出落盘 task_dir `quality/evidence/review-results/`）；S（汇总者）：解析+跨 provider 主题归纳+争议点清单（与 D-103 运行时 disputed 标注同源，S 只做归纳不做裁决） | 出：归纳（≤2 页）+原始结果 ref |
| 6b debate 裁决（方向面） | S 并行（M 法官） | 角色 S（甲/乙/丙/丁）×4 **并行** + 文件 mailbox + 2 轮封顶 + 独立复核 S；M 只登记（D-301/D-303），收裁决书 ref + 歧义条目摘要（每条一行） | 出：裁决书 ref + 歧义清单（方向级→M 呈用户；实现级→独立上下文裁决 M 登记） |
| 7 talk-r3 | **M（交互）** | 无（方向级争议由 6b 输出直接入卡；M 按 G3/MR-2 分级） | 出：问题卡+用户回复 |
| 8 grill-with-docs | **M（交互）** | S（可选）前沿问题候选池 | 出：问题卡+用户回复 |
| 9 write-decision-draft | S+M | S：从 decision-log（T 表/框架大纲/事实表）生成完整 D 条目草稿；M：审核修正（链字段/模块归属/覆盖矩阵/宪法红线） | 入：材料 ref；出：草稿（M 只留"修订点摘要"） |
| 10 detail-advice | B+S | 同 step6（红/蓝并行；detail 材料=当前 decision-log+验收节；失败降级按 D-604：blue_incomplete 告知用户、unavailable 修复材料后一次重试） | 出：归纳+ref |
| 10b debate 裁决（细节面） | S 并行（M 法官） | 同 6b | 出：裁决书 ref + 歧义清单 |
| 第4轮 talk（detail findings） | **M（交互）** | 无（10b 输出直接入卡） | 出：问题卡+用户回复 |
| 11 approve-decision | **M（交互）** | S：提炼"最终确认卡"材料（M 编辑后发布）；B：脚本组装 interaction aggregate+确认 receipt（hash/文件），M 签发确认 | 出：确认记录+aggregate（B 组装/M 签发） |
| 12 stage-end-spec-analyze | S+B | S 运行语义校验（spec-analyze 项）、返回 gaps 摘要；M 决策修复 | 入：材料 ref；出：gap 清单（M 处置）；**若修复改变决策→M 重新确认+重建 aggregate（B 组装）**；六部分总结与阶段末披露随 publish 卡（step13）产出 |
| 13 publish-decision | M | S 草拟手off卡 | 出：发布卡（通知） |
| 14 stage-reflection | **M**（判断性，需会话记忆） | S：统计事实（耗时/tool 数/子代理数/落盘 ref）供 M 引用 | 出：judgment JSON |

### 上下文守恒规则（写入 make-decision SKILL.md/技能文本，build-spec 实施）

1. **全量产物只落盘**：research-report/审查原始结果/debate 产物/草稿全文 → task_dir `quality/evidence/` 或 worktree artifacts（content-addressed）；主会话只保留 `ref + sha256 + 结构化摘要（≤500 字）`。
2. **子代理回传格式强制**：结论条目 + 证据 ref + 置信度；禁止回传原始输出/长文/完整工具日志。**字数额度分两类**：研究/草稿/汇总类回传 ≤500 字；复核类（R5、debate 评委、独立复核）按条目限字（每条 finding 一行：severity|位置|问题|建议），不得压扁逐条结论。
3. **并行上限**：研究深读 ≤4（防 provider/资源配额）；debate 角色 =4；红蓝 =2；阶段间串行依赖（talk 依赖 review 归纳、review 依赖草案）不强行并行。
4. **交互卡唯一来源**：问题卡与回复事件只登记在 decision-log T 表（不重复携带会话原文）；交互由主会话发出（M 独占）。
5. **候选生成外包、裁决分级**：所有"可选/草案/候选"由 S 出，M 只做选择题；**裁决分级（G3/MR-2）**：方向级/影响验收争议→M 呈用户；实现级争议→debate 独立上下文角色（丙/丁评委）+独立复核产出，M 只登记，不得单方裁决（D-303/FND-DB28，Q3 红线）。
6. **旧步骤不回读（仅约束主会话输入）**：主会话每步只依赖上一步的决策摘要与材料 ref；子代理（S）可读全量落盘材料（decision-log、T 表、事实表、框架大纲——step9 所需），不受此约束。

### 与既有机制的衔接
- wh-review 红蓝组请求：B 后台并行执行（已实证；超时窗=DEFAULT_REVIEW_BROKER_TIMEOUT_MS 600s；原始结果落盘 task_dir `quality/evidence/review-results/`——已实做，作为规则固化）。
- 全量产物落盘规则：主会话不保留审查原始结果/长报告，一律 content-addressed 落盘 task_dir；主会话只收 ref+摘要。
- 调研 R3 三角测量：由汇总 S 合并来源矩阵（含一手率/置信度），M 审定（R3 不做主会话内推理）。
- debate v2：四角色 S 并行 + mailbox；主会话=法官只收各角色立场摘要与裁决书 ref。
- 调研：R1-R2 并行 S（本任务已实证 3 深读并行+1 复核）。
- spec-analyze/stage-reflection：S 执行校验、M 执行判断（reflection 判断性）。


## 三轮 talk

### Round 1（真实痛点、成功标准、是否需要调研）— 已收敛

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | 改造范围：①仅审查+talk+debate；②加调研深度机制；③再扩展 build-plan/build-code/verify-code | ②改动面大但一次解决两类痛点；③最易失控 | 选择②："我希望调研结果能正确落盘到task_dir的任务追踪目录中，方便后续复盘" | 范围收敛为 ② + 落盘约束（R-013） | Talk Round 1 用户回答 |
| T-002 | 成功标准：①机制落地+下任务实证；②本任务内找试炼场；③仅机制落地 | ②会打断现有任务；③风险是"看起来改了实际不顺手" | 选择①（机制落地 + 下一个真实任务实证） | 成功边界更新：提示次数=0 移到下任务验证 | Talk Round 1 用户回答 |
| T-003 | 本任务调研投入：①用已有勘探+补1-2缺口；②完整 R0-R5 深调研；③跳过 | ②耗时明显增加但本任务自身即 R0-R5 首个样本 | 选择②（完整跑一轮深调研） | 本任务调研升级为完整 R0-R5 | Talk Round 1 用户回答 |
| T-004 | 返工典型：①审查没发现问题；②发现问题但没和你确认；③审查太浅只给通用建议 | 校准"深"的标准 | 都不是："主要在 build-code 时 agent 自己发现很多遗漏，在 verify-code 我验收功能时能发现更多 agent 发现不了的遗漏，这属于验收标准定得不够清楚导致的" | 新增关键事实 F-013；验收标准质量成为本任务焦点之一 | Talk Round 1 用户回答 |

### Round 2（方向、范围、非目标、关键取舍、风险、数据状态、流程、延期）— 已收敛

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-005 | 需求框架结构：①组合式（2 类骨架+决策挂节点）；②单一通用；③每任务自定义 | ②研究/迁移类被挤变形；③无法沉淀 | 选择①："Q1:1"；另要求 Q2 文件结构也增强 | 决策：组合式骨架（feature 类=背景-问题-目标-方案-验收-扩展；研究类=问题-论断-证据-裁决） | Talk Round 2 用户回答 |
| T-006 | 决策链条：①文本层增强；②机器可校验 v2；③先只做分组 | ①零机器校验改动（内部盘点证实）；②改动面大；③目标打折 | 选择①，并明确："除了文本层增强，文件结构也要增强，相关的决策需要放在同一个模块之内；方便人类阅读" | 决策：链条=文本层行（上级/派生自、模块、需求回链、下游产物）+ 决定区按**模块**组织（模块=同主题决策聚合区，人类阅读友好） | Talk Round 2 用户回答 |
| T-007 | 验收标准不清的治理：①审查专项（AC 可打破/失败路径/验收盲区）；②保持现状；③AC 硬校验 | ③与"测试不是推进门"冲突 | 选择① | 决策：build-spec 审查重点加"AC 可判断性与验收盲区"专项 | Talk Round 2 用户回答 |
| T-008 | 用户流程视图：①确认；②调整；③仅 make-decision 完整 | ③build-spec 诉求只完成一半 | 选择①并修正："方向审查（双角色对抗）应该改成方向审查（双角色对抗）+debate吧，debate改版应该也在当前计划内吧。细节审查应该改成细节审查+debate" | 流程修订：方向审查（双角色对抗）→ debate 裁决→ Talk3；细节审查（双角色对抗）→ debate 裁决→ Talk4 | Talk Round 2 用户回答 |
| T-009 | 数据状态边界：①spec 事实契约；②decision-log 记录；③沿用现状 | ③F-013 根未除 | 选择① | 决策：spec 写"阶段事实状态机"契约（审查/处置/talk 生命周期/调研落盘） | Talk Round 2 用户回答 |
| T-010 | 非目标与延期：①确认；②调整 | — | 选择①确认（跨 provider 交叉质询/同构改造/试炼场均延期；不新增 stage/gate/公共入口） | 非目标与延期定稿 | Talk Round 2 用户回答 |
| T-011 | 问答形式：聊天内容改成问答工具 | 工具化呈现更结构、可选项更明确 | "问答不要用聊天内容，改成问答工具" | 新增 R-015（后续 talk 用结构化问答工具呈现） | Talk Round 2 用户回答 |
| T-012 | 调研工具选型：外部 anysearch；内部需调研合适工具/技能 | 纯 agent 调研效果差 | "make-decision的调研应该调研一下使用哪些工具，外部调研可以用anysearch，内部调研需要搜索一下应该用那些工具或技能比较合适。纯agent调研效果很差！" | 新增 R-016 + G-011 调研 | Talk Round 2 用户回答 |

### Round 3（盲审 findings、矛盾、关键假设、剩余风险）— 已收敛（问答工具形式，R-015）

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-013 | 双角色实现形态（协议冲突） | 同 prompt 双角色=角色相同；差异化=broker 小改；两次指派=深度最大 | "简单一些吧，每个provider同时指派两次：红队（wh-review的正常审查）一次，蓝队（对抗性审查，当前所有decision都不成立/不值得改，纵向逐条否定，同时横向构思都没想到的第三路、把'明确不做'拽回来质疑、戳隐藏前提、专防虚假共识）一次。拿到所有结果后，再由主agent使用改造后的debate技能对所有歧义进行debate，获得最终findings。" | 新增 R-017：**每 provider 每审查面指派两次**（红队组织一次 + 蓝队对抗一次 = 同 provider 两次扮演）；红/蓝为同一逻辑 review fact 的两次组请求；之后 debate 裁决歧义 → 最终 findings | Talk Round 3 用户回答 |
| T-014 | build-spec 对话与宪法 F7 冲突 | 正式放开需改契约+测试 | 选择"正式放开（推荐）" | 决策：正式放开（check-skill-closure 改为 grill 独占；3 组契约测试更新；interaction aggregate 支持 build-spec findings_talk） | Talk Round 3 用户回答 |
| T-015 | 范围控制（F8/F10） | 分阶段拆任务 vs 一次全做 | "一次全做，可以多分一些phase，每个phase独立开发、测试、验收、审查！" | 新增 R-018：同任务内 phase 制（每 phase 独立开发+测试+验收+异源审查） | Talk Round 3 用户回答 |
| T-016 | 方向审查深度（blind vs challenge） | — | "按照之前的决策，方向审查同步进行两次，一次是没有方向摘要的盲审，一次是有方向和需求内容的对抗性审查" | 决策（合并入 R-017）：direction 面=盲审组（无方向摘要）+ 对抗组（含方向+需求）两次组请求 | Talk Round 3 用户回答 |
| T-017 | 争议闭环定义 | — | 选择"共识+分歧双定义（推荐）" | 决策：争议=共识（≥2 provider 独立提出）或分歧（severity/evidence 冲突）；闭环=争议→debate→用户 talk→decision-log 登记 | Talk Round 3 用户回答 |
| T-018 | 调研工具路由 + 内部调研工具升级 | — | "1，写进技能正文，但是内部调研不能只用这些简单的工具，需要调研一下市面上比较好的代码知识库或知识图谱工具。" | 新增 R-019 + G-012：内部调研需调研市面代码知识库/知识图谱工具（Sourcegraph/Glean/ast-grep/SCIP 等）并选型入技能正文 | Talk Round 3 用户回答 |

### Round 3 后续批次（蓝队 findings 方向级争议）— 已收敛

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-019 | 红蓝两次 vs single_round 契约（三 provider blocking） | 契约演进=合同+十几处测试断言修改；单请求两阶段=零改动但盲/显边界靠指令 | 选择"契约演进（推荐）" | 决策：同一逻辑 review fact = 红+蓝两次组请求正式写入合同（make-decision/build-spec 合同文本 + simple-contracts/direction-reveal/route-mode/AC-011 等测试）；保留"不为空 findings 复审"约束 | Talk Round 3 后续批次用户回答 |
| T-020 | 文本层字段无校验=腐烂（major×3） | 轻量告警=治腐烂不动机器强制面；v2 schema=改动最大 | 选择"文本层+轻量告警（推荐）" | 决策：文本层字段 + 轻量格式告警（run-checks/阶段收尾，缺省告警不阻断、不升 schema、不进 gate） | Talk Round 3 后续批次用户回答 |
| T-021 | 试炼场/验收闭环（kimi major 自洽性盲区） | — | 选择"三重验证（推荐）" | 决策：三重验证=①本任务 dogfood 试炼；②每 phase 独立开发/测试/验收/异源审查；③下任务实证（用户提示次数=0） | Talk Round 3 后续批次用户回答 |
| T-022 | 蓝队失败策略（Talk4 Q1；实测 4/5→根因→修复→重试） | 全量跑浪费时间 | "我选1，现在需要先调研一下这么多失败的根本原因…找到根本原因就直接在子代理中修复、测试、提交、合并，然后再次重试" | 决策：同编成+重试1次并**先根因排查**；已排因并两轮修复（材料脱敏 5c4a3b3f/6090fbc5；3rd-review 工作区净化 99d6a3c）；剩余 grok/pi 记为 OPEN-004 停止追 | Talk 4 用户回答 |
| T-023 | build-spec 对话承载技能（Talk4 Q2） | 影响闭包登记 | 选择"复用 spec-clarify" | 决策：build-spec findings 处置对话=**复用 spec-clarify**（基于争议发现的规格澄清批次；不新增技能/talk-with-zhipeng 不进 build-spec 声明；check-skill-closure 沿用 grill 独占+其他调整仅限契约文本） | Talk 4 用户回答 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| RS-001 | R0-R5 完整深调研（11 缺口问题：宿主通信/辩论实证/单轮契约/独占契约/deep research 实践/返工案例/需求框架/决策链/框架驱动/内部资产/内部调研工具选型） | 调研报告 v1.2 已落盘，见下方引用 | 已完成（questions_total=11, converged=11）；独立复核已完成（8 findings 已处置） | R-013/R-014/R-006/R-009/R-016 等 |
| RS-001-引用 | 调研结果落盘引用（R-013） | `quality/evidence/research-report-536c3d1cce3e8e1b7c61b238dfade34bcab48e6f17e5b26a495dca60c4f53202.json`（v1.0 历史）、`quality/evidence/research-report-9175f849efa477482b5e8bf1779453c05239884c20319c6fdd3997bfcd0522ba.json`（v1.1）、`quality/evidence/research-report-3fdea2af475c886f56f9d5490c8c0f59b8f9057832c272b0766268459337453f.json`（v1.2 当前口径） | 已落盘 task_dir 任务追踪目录（content-addressed） | R-013 |

### 调研报告独立复核处置（R5；独立上下文子代理，防自审自判）

| finding_id | 原始事实/来源 | 后果 | status | next_action | owner/consumer |
| --- | --- | --- | --- | --- | --- |
| RV-01 | 解析器行为断言缺来源行号（major） | 承重事实不可溯源 | fixed | v1.1 补 stage-content-contracts.mjs:25-38,2068,2420 与 third-review-host-config.mjs:435-440 | 主 agent/决策 |
| RV-02 | 同上下文双角色无法落地 D3 防偏措施；引用真实性抽查全部真实（minor→核实通过） | 防偏作用有限 | accepted_risk | 分层设计：审查内双角色（深查）+ 裁决辩论（独立上下文，防偏落地）；裁决层采用匿名/rubric/预算/2 轮封顶 | 主 agent/决策 |
| RV-03 | 文件 mailbox 缺共享文件系统正向证据（major） | 跨宿主前提不成立 | fixed | v1.1 明确前提+降级路径（父代理串行转发）；逐宿主 FS 验证记为 [OPEN] | 主 agent/决策 |
| RV-04 | 框架复杂度负担未评估（major） | 违 F8 | fixed | 复杂度预算：本任务只固化 2 类骨架（feature/研究型），其余 mini-doc 降级 | 主 agent/决策 |
| RV-05 | '节点声明证据'与'零机检'矛盾（major） | 装饰化风险 | fixed | 明确声明式定位（agent 遵循+现有 section 级校验+stage-reflection 兜底）；不为机器校验堆基建（F10） | 主 agent/决策 |
| RV-06 | 元数据口径问题（minor） | 统计失真 | fixed | v1.1 修正 internal/external 归类与样本统计口径 | 主 agent/决策 |
| RV-07 | 关键来源 read_full=false 仍标 high；'业界共识'仅 2 来源（minor） | 置信度虚高 | fixed | v1.1 降级为 medium 并注明实测/全文证据 | 主 agent/决策 |

### 调研要点（大白话，供用户决策参考）

1. **需求框架选型**（R-014）：业界没有单一完美结构。最有价值组合 = **spec-kit 式"按任务类型选骨架" + ADR 式"决策节点带关系边"**（supersedes/depends_on/归属模块）+ **IBIS 式"问题→立场→论据"**（讲清决策怎么来的）+ **RFC 式"稳态收敛"**（没有新论据才算收敛）。
2. **决策链条**（R-014）：现有 decision-entry.v1 已经记了"来源/逻辑/后果/被拒/未决/被谁取代"，缺的是**正向链接**（上级决策、派生自）、**模块归属**、**需求回链**、**下游产物**——而且按内部盘点，这些都可以加在文本层（不动机器校验），风险低。
3. **多角色辩论**（R-006）：实证支持"值得做但必须结构化"——魔鬼代言人 + 独立评审、2 轮封顶、匿名+交换顺序+评分标准、预算封顶；最大风险是从众（同质小模型可达 85.5%）与评审自身偏差；简单任务/同质无角色模型不做辩论。
4. **宿主子代理通信**（R-008）：DSH 稳定层**父↔子**双向可用（本会话已实测），兄弟互发要 experimental 层；Codex 发布版无 agent-to-agent（主代理转发）；Multica 用 @mention 评论。**文件 mailbox 是跨宿主通用方案**，DSH 原生消息作加速。
5. **单轮契约**（R-003）："每 provider 在同一 prompt 内扮演双角色"零协议改动即可实现（角色指令进 prompt，不进 packet）；跨 provider 互读 findings 需改 broker 多 phase（延期）。
6. **deep research 机制**（R-009）：参考文件的 jina/arXiv 结论经一手核实成立；本任务自身就是该机制的试运行。
7. **调研工具选型**（R-016）：外部调研通道=anysearch（general/垂直域/code 子域）+ web_fetch 精读原文 + 并行子代理深读；内部调研通道=宿主 glob（找文件）+ 宿主 grep（检索）+ read 精读 + git log/git show（研发历史）+ 子代理并行盘点（主上下文只收摘要）+ 方法论技能（diagnosing-bugs 调查法 / grill-with-docs 对抗追问）；纯 agent 无工具检索效果差（本会话实证：无工具=靠记忆，首轮 anysearch 直接失败、摘要列表即被 R1 拦截）。
8. **内部调研工具栈**（R-019/G-012）：最小可行栈=git（log -S/-G/blame，进阶 GitQL）+ ripgrep/grep + ast-grep（tree-sitter 语法感知搜索，零索引）；MCP 可选接 GitHub 官方或 repomix --mcp 一个；大仓（≥数十万行/多语言/多仓）用 CodeGraph（69.6k★，100% 本地预索引）；Sourcegraph/SCIP/Neo4j/自建 embedding=长期基建不默认（F10）；查证：Sourcegraph 未转向 Glean（Glean 复用 SCIP，2026-03 SCIP 移交社区治理）。

## 审查处置

### direction review（step 6；blind advice，非 pass 门）

- review 事实：status=available；outcome=completed；material_id=`22cb07ab004a06c09b03111e21b9d98ff541b2543d265c84972f647945f0f186`；runtime_id=05b72542-d650-4ef8-8f6c-39663d07e56b；providers=kimi/coding、antigravity/flash、codex/luna（completed×3）；原始结果留痕：task 外 /tmp/direction-review-result.json（本会话磁盘，未入 task_dir——按阶段 outcome 记录方式将在 stage-end 汇总）。
- findings：15 条（blocking 3 / major 9 / minor 3）。跨 provider 主题归纳：
  1. **协议冲突**（kimi major / antigravity blocking / codex major）："每 provider 双角色+跨 provider 角色轮换"与"单请求+共享 prompt/packet"协议冲突；需要 per-provider prompt 通道或接受"同 prompt 内双角色"。
  2. **宪法冲突**（antigravity blocking）：build-spec 引入基于 findings 的 Talk 直接违反 F7/独占契约；需用户裁决（放开 vs 变通）。
  3. **范围风险**（antigravity major）：review+talk+debate+research 同时扩张，违 F8/F10；建议分阶段。
  4. **方向审查深度缺口**（codex blocking："No concrete candidate direction is submitted"）：生产 direction 路径是纯盲审，无 reconstruct→reveal→challenge 的 reveal 阶段——provider 无法挑战当前方向；这可能是"审查不深"的机制根因之一。
  5. **争议闭环缺失**（codex major）："finding 如何变成 disputed、如何回写"未定义。
  6. **调研契约缺失**（codex major）：无完成契约/工具路由/迭代循环/产物边界——本任务参考文件方案恰好对治；确认入设计。
  7. **问答工具控制面**（kimi minor）：R-015 需登记 consumer/owner/删除条件（设计时落实）。
  8. **accept-risk 半接线**（kimi minor）：本任务补 public 路由。
  9. **build-spec parity 分工**（codex major）：与 make-decision 分工说明缺失（设计时补）。
  10. **组合式框架数据表示**（codex major）：文本层 vs schema 的取舍——用户已拍板文本层（T-006），向审查说明。

- 处置状态：以上 findings 已按 Talk 3 用户裁决逐条登记（见下表）。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-DR01 | 双角色/角色轮换与单请求共享 prompt+packet 协议冲突（kimi major） | 用户期望的"每 provider 多角色"不可实现 | fixed | 按 R-017/T-013：红蓝两次指派=同一逻辑 review fact 的两次组请求（协议与合同演进；不为空 findings 复审约束保留） | 主 agent→build-spec 契约演进；保留 |
| FND-DR02 | build-spec talk 违反 F7/独占契约（antigravity blocking） | 违宪 | fixed | 按 T-014：正式放开（check-skill-closure 只留 grill 独占；3 组契约测试更新；aggregate 支持 build-spec findings_talk） | 主 agent→build-spec；保留 |
| FND-DR03 | review+talk+debate+research 同时扩张违 F8/F10（antigravity major） | 范围失控 | fixed | 按 T-015：一次全做+phase 制，每 phase 独立开发/测试/验收/异源审查 | 主 agent→build-plan phase 划分；保留 |
| FND-DR04 | 生产 direction 路径无 reveal 阶段，provider 无法挑战当前方向（codex blocking） | 方向审查浅的机制根因 | fixed | 按 T-016/R-017：direction=盲审组+对抗组两次；对抗组含方向与需求 | 主 agent→build-spec；保留 |
| FND-DR05 | "finding 如何变 disputed、如何回写"未定义（codex major） | 争议 talk 无闭环 | fixed | 按 T-017：共识+分歧双定义；闭环=争议→debate→用户 talk→decision-log 登记 | 主 agent→build-spec；保留 |
| FND-DR06 | 调研无完成契约/工具路由/迭代循环/产物边界（codex major） | 调研机制不完整 | fixed | deep-research 技能正文固化（R-016 工具路由 + R-019/G-012 知识库工具选型 + research-report.v1） | 主 agent→build-spec；保留 |
| FND-DR07 | 问答工具新控制面缺 consumer/owner 登记（kimi minor） | 治理不合规 | fixed | R-015 实施时登记：findings-talk 的 owner=对应 stage；consumer=stage outcome interaction 校验；删除条件=机制被替代 | 主 agent→build-spec；保留 |
| FND-DR08 | accept-risk 机制半接线（kimi minor） | 用户接受风险无 public 通道 | fixed | 补 public 路由（confirm/authorize 语义内扩展），接线 kernel.acceptReviewRisk | 主 agent→build-spec；保留 |
| FND-DR09 | build-spec parity 与 make-decision 分工说明缺失（codex major） | 职责边界不清 | fixed | build-spec SKILL.md 增加"findings 处置对话 vs make-decision Talk/Grill 独占"分工段 | 主 agent→build-spec；保留 |
| FND-DR10 | 组合式框架与决策链无数据表示（codex major） | 结构无法走查 | fixed | 文本层字段即数据表示（derived_from/module/requirement_ids/artifacts + h3 模块分组；T-006）；machine 级校验延期 | 主 agent→build-spec；保留 |

### direction review 蓝队（step 6 第二次；对抗性审查，含当前选择）

- review 事实：status=available；outcome=completed；material_id 记录于 /tmp/direction-blue-result.json（红/蓝为两次独立 3rd-review 组请求的试运行）；providers=kimi/coding、antigravity/flash、codex/luna（completed×3）；findings=22（blocking 4 / major 13 / minor 5）。
- 跨 provider 一致要害：
  1. **红蓝两次组请求违反 single_round/一次 public request 契约**（kimi+antigravity+codex 均 blocking）——方向级争议，待用户裁决（MR-2 方向级→debate 场景）。
  2. **needs_human 无写回=闭环最后一环断裂**（kimi major/antigravity major/codex blocking）——本任务设计已含写回（FND-DR 系列），build-spec 落实。
  3. **文本层字段无校验=必腐烂**（kimi minor/antigravity major/codex major）——方向级近似：文本层 vs 最小机检 vs v2 schema，待用户裁决。
  4. **自洽性盲区：没有真实需求走通新链路**（kimi major；antigravity minor）——本任务自身即试炼场（dogfood：R0-R5/落盘/R5 复核/蓝队/Talk 工具化均已实操），下任务实证（Q2=①）对治。
  5. **debate 依赖未证明可在目标宿主运行**（kimi/antigravity/codex major）——本任务产出 debate v2；设计含 DSH 实测+文件 mailbox 降级证明。
  6. **争议定义未覆盖"一提出一沉默"**（codex major）——build-spec 细化三态矩阵（支持/沉默/反对）。
  7. **主 agent 综合 vs 质量裁决权限**（codex major）——debate 产物不可变落盘 debate/round-N/；不设质量 pass 判定（F4）。
  8. **R0-R5/工具路由仍是名称清单**（codex major；kimi minor）——build-spec 固化可验收契约；知识库工具调研中（G-012）。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-DB01 | 红蓝两次违反 single_round（三 provider blocking） | 治理契约冲突 | fixed | 用户裁决：契约演进（T-019）——同一逻辑 fact=红蓝两次组请求正式入合同+测试更新 | 用户/主 agent；保留 |
| FND-DB02 | needs_human 无写回（三 provider） | 闭环断裂 | fixed | build-spec 设计"争议→debate→用户 talk→decision-log 登记"写回路径（findings_talk + 处置状态 user_decided） | 主 agent→build-spec；保留 |
| FND-DB03 | 文本层无校验=腐烂（三 provider） | 结构退化 | fixed | 用户裁决：文本层+轻量告警（T-020）——格式告警不阻断、不升 schema、不进 gate | 用户/主 agent；保留 |
| FND-DB04 | 无真实需求走通链路（kimi major） | 机制未验证 | fixed | 用户裁决：三重验证（T-021）=本任务 dogfood+每 phase 独立验收审查+下任务实证 | 主 agent；保留 |
| FND-DB05 | debate 未证明可运行（三 provider major） | 产出可能不可用 | fixed | build-spec 设计含跨宿主运行性证明（DSH 实测 + 文件 mailbox 降级 + Multica @mention 备注） | 主 agent→build-spec；保留 |
| FND-DB06 | 争议定义未覆盖一提出一沉默（codex major） | 漏判 | fixed | build-spec 争议判定三态矩阵（支持/沉默/反对×provider 计数） | 主 agent→build-spec；保留 |
| FND-DB07 | 综合 vs 裁决权限（codex major） | 自审自判风险 | fixed | debate 裁决书标注裁决者=主 agent 综合+用户裁决争议项；产物不可变落盘；不设质量 pass | 主 agent→build-spec；保留 |
| FND-DB08 | 调研机制仍是名称清单（codex major/kimi minor） | 不可验收 | fixed | deep-research 技能契约固化（含 G-012 知识库工具选型结论） | 主 agent→build-spec；保留 |


### detail review 红队（step 10；正常审查，5 provider 编成）
- review 事实：status=available；outcome=completed；providers：kimi/coding、antigravity/flash、codex/luna completed；grok/grok、pi/v4flash **failed（传输失败，如实保留）**；findings=27（blocking 3/major 14/minor 10——其中多数针对"材料冻结时刻"的早版本文档，已按本文件当前版本处置）。
- 有效问题（已修复）：成功边界与 D-101 矛盾（已改目标/边界）、五维矩阵未回填（已回填）、F-015/F-019 事实缺口（已补）、R-018 无 D 条目（新增 D-603）、D-303 违 Q3 自审自判（改为独立上下文裁决+复核）、共识过滤缺失（D-103 改）、失败转移规则缺失（新增 D-604）、IIO 契约缺失（D-204 补）、D-101 漏 R-017（补）、D-104 模块错位（移至模块 E）、F-012 未处置（新增 D-605）、material_id 风险处置（D-605）；draft 材料只含决定节（审查快照早于后补的验收/边界节）——已说明。
- FND-DT 处置表（要点）：FND-DT01（成功边界矛盾 blocking×2）fixed→已重写边界；FND-DT02（draft 缺验收节 blocking×2）fixed→验收节已补齐并纳入后续材料；FND-DT03（Q3 自审自判 major）fixed→D-303 修正；FND-DT04（F-015/19 缺口 major）fixed→事实表补齐；FND-DT05（R-018 无载体 major）fixed→D-603；FND-DT06（转移规则 major×2）fixed→D-604；FND-DT07（public route 红线矛盾 major）fixed→D-203 明确为既有 confirm 语义扩展（登记 owner/consumer）；FND-DT08（红蓝数据契约 major）fixed→D-101 pair_id 语义；FND-DT09（G-012 证据不在 manifest major）fixed→decision-log 引用+证据落盘记录；FND-DT10（链字段规则 major）fixed→D-104 精确规则；FND-DT11（问答 IO 契约 major）fixed→D-204 契约；FND-DT12（minor 组：R-017 遗漏/模块错位/编号错引/重复残留）fixed→全部修正。

### detail review 蓝队（第一次 partial；修复后重试 completed×3，grok/pi 待 3rd-review 根修）

- retry 事实（修复脱敏+错误码保留+3rd-review 工作区路径净化后）：status=available；outcome=**partial**；providers：kimi/coding、antigravity/flash、codex/luna completed（24 findings）；grok/grok、pi/v4flash 仍 failed（**OPEN-004**：疑似 grok/pi 工作区前缀 %2F 编码差异或工具回显未被净化覆盖；已重试 2 轮，按 G2/Talk4 停止，蓝队结论以 3/5 完成集为准并如实标注 blue_incomplete）——**最终根因（F-020 终版）**：grok/pi adapter 启用工具（read_file/grep/list_dir），工具回显 provider 私有工作区真实绝对路径（/private/tmp/3rd-review/<runtime>/work/<provider>/bundle/...，原始输出 541KB 实锤），模型在最终文本引用 → broker hasPrivatePath 拦截 → 公共无效成员（身份降级）→ 客户端身份错误掩盖。修复：3rd-review 侧精确替换"该 provider 私有工作区前缀→bundle 占位"（其余绝对路径仍拦截）；wh-review 材料脱敏已在 main（5c4a3b3f/6090fbc5）。
- 蓝队 findings 26 条处置：见下方 FND-DB2 表（多数为对既有决议的再批评；其中"细节推迟 build-spec 违反'不依赖 build-spec 补需求'"为实质缺口→已就地补齐 T-022/T-023）。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-DB21 | 契约演进被批"语义重述纸面合规"（kimi blocking） | 文义合规不等于可执行 | fixed | D-101 已含 pair_id/蓝队降级/红蓝关联契约；合同文本在 build-spec 以"语法与测试成对"执行（T-019） | 主 agent→build-spec；保留 |
| FND-DB22 | debate 运行性/FS 前提未闭环（kimi major） | 跨宿主未验证 | fixed | D-301 补"共享 FS 前提+降级路径 D-604"；mailbox 格式 build-spec 定稿时以实测（本会话）为准 | 主 agent→build-spec；保留 |
| FND-DB23 | 阶段复盘兜底不成立（kimi major） | 文本层腐烂 | accepted_risk | D-104 轻量告警已入 run-checks；stage-reflection 维度为辅助；若告警失效再评估 X-003 | 主 agent；保留 |
| FND-DB24 | 自洽性盲区（kimi major） | 机制互相印证无实证 | fixed | 三重验证（T-021）且本任务 dogfood 证据链完整（R0-R5/落盘/复核/红蓝/debate 降级/talk 工具化） | 主 agent→验收；保留 |
| FND-DB25 | 第三路缺失：X-001 跨 provider 质询被拒但红蓝同样 2×（kimi major） | 拒绝理由不一致 | rejected_invalid | X-001 与红蓝本质不同（红蓝=同一 provider 两次角色；X-001=provider 间互读+修改 broker 多 phase 协议）；触发条件保留 | 主 agent；保留 |
| FND-DB26 | D-202 合规辩护是命名区分（kimi major） | F7 风险 | fixed | 已确认正式放开（T-014）：契约演进而非命名游戏（check-skill-closure/3 测试/aggregate 同步改） | 主 agent→build-spec；保留 |
| FND-DB27 | 成功判据不可观测（kimi major） | 无法验收 | fixed | 三重验证含"本任务 dogfood 证据清单"（可观测）；下任务实证为第二层（外部观测） | 主 agent→验收；保留 |
| FND-DB28 | D-303 主 agent 裁决=自审自判（kimi major） | Q3 违反 | fixed | D-303 已改：实现级争议由 debate 独立上下文角色+独立复核产出，主 agent 只登记 | 主 agent；保留 |
| FND-DB29 | draft_spec_or_acceptance 只含决定节（kimi minor+antigravity blocking+codex blocking） | 细节审无法验收 | fixed | 材料快照早于验收节补齐；此后材料均含完整验收/边界/用户流程（本文件当前版本） | 主 agent；保留 |
| FND-DB30 | 未决项表与结论矛盾（kimi minor） | 结构不一致 | fixed | 未决项表已更新为 OPEN-004/005（见下） | 主 agent；保留 |
| FND-DB31 | 细节推迟 build-spec 违反"不依赖 build-spec 补需求"（antigravity+codex blocking） | **实质缺口** | fixed | 就地补齐：T-022 build-spec 承载=spec-clarify（用户已答）；T-023 生命周期落点=stage outcome 校验（定案）；红蓝关联=pair_id+materials 同源（D-101 已有）；退化记录=用户可见（D-604 补） | 主 agent；保留 |
| FND-DB32 | 红蓝未定义关联/聚合（codex major） | debate 输入不可靠 | fixed | pair_id 语义+角色标注进 attempt/result 元数据（build-spec 实施）；聚合=各自 findings 集合并集+provider×角色标注 | 主 agent→build-spec；保留 |
| FND-DB33 | 验收标准与阶段决策矛盾（codex major） | build-spec 职责不清 | fixed | G1 边界（红蓝仅 make-decision；build-spec 单次+强化）已明确 | 主 agent；保留 |
| FND-DB34 | 争议路由把共识/沉默也送用户（codex major） | 无效交互 | fixed | G3 过滤已定（方向级/影响验收才达用户；实现级共识主 agent 处置） | 主 agent；保留 |
| FND-DB35 | dogfood 证据不可从 manifest 验证（codex major） | 自证 | fixed | 验收清单（三重验证第一层）落在本任务 quality/evidence 与 decision-log 引用（可复核：研究报 3 版 hash、R5 复核、红蓝结果、修复 commit） | 主 agent→验收；保留 |
| FND-DB36 | 退化需强制记录+用户可见（codex major） | 问题可能复发 | fixed | D-604 增加：任何退化（unavailable/partial/debate 未决/工具降级）必须记录事实+向用户简报说明 | 主 agent；保留 |
| FND-DB37 | 问答契约无验收+允许降级违背"不要聊天"（codex major） | R-015 弱化 | fixed | D-204 已定义 IO 契约（question_id/axis/options/recommended→answers+reply_ref）；降级路径仅在宿主无工具时，且记录工具降级事实并明确告知 | 主 agent→build-spec；保留 |
- review 事实：status=available（minimum_heterologous=1）；outcome=partial；providers：codex/luna completed；kimi/coding、grok/grok、pi/v4flash、antigravity/flash **failed**——蓝队请求在本次运行中大量失败（传输/资源，如实保留）；findings=8（blocking 2/major 5/minor 1，均 codex/luna）。
- 有效问题（已修复）：draft 非完整验收契约（已补验收节+状态契约+用户流程；材料快照早于修订）、exit checks 与未完成状态矛盾（已补齐闭环记录与确认流程）、蓝队失败降级语义（D-604①-③/dev）、build-spec 对话承载技能未定（D-202 补：talk-with-zhipeng findings 模式或专属技能，build-spec 定稿选择）、跨宿主可运行性契约（D-301 补共享 FS 前提+降级+mailbox 格式 build-spec）、共识过滤（D-103）、调研证据 manifest（D-401 落盘引用）、链字段规则（D-104）。
- 蓝队 partial 事实：dogfood 揭示"蓝队失败概率高于红队"（本运行 4/5 失败）——已记录为 RISK-001 实证，build-spec 蓝队路由/重试策略需考虑（蓝队编成与超时预算）。

## 最终确认

- 状态：accepted
- 用户原文与 host-visible 绑定：用户回复"确认"（接受最终决策卡；方向=审查深化+争议对话+debate v2+调研机制+decision-log 结构；范围=一次全做多 phase；风险/延期见登记）
- host-visible 绑定：`quality/confirmations/edc83d7e42ac51dee8d0b22c07fb965433e1d080caa6a772db95cef973cb66de.json`（human-confirmation.v3，accepted；material_revision=revision-4cf419…；snapshot_tree=94cb9b6e）
- interaction aggregate：`quality/evidence/interactions/b9fca3153865929bccc5f30511444789aa11a8dfcec1e33ffaf1a07f902ed49b.json`（workflowhub-interaction-aggregate.v1；talk round_count=5 含 detail findings 轮；绑定当前 decision hash 86516d9b 与 revision-1852fd75；经运行时契约校验 valid；内容寻址与字节一致；前一版 94000883/09ba225a 保留为历史）
- 未确认内容：无（grok/pi OPEN-004 属实施期风险，非需求未决）

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 跨 provider 第二轮交叉质询（本轮内做） | 需改 3rd-review broker 多 phase 协议 + 约 2 倍成本；先交付红蓝+debate，触发条件满足再评估（X-001） | D-602 |
| 单请求两阶段（盲/显同调用） | 盲审—对抗边界靠指令，机器不可验证；用户选定契约演进（正式两请求） | D-101/FND-DB01 |
| 全五阶段红蓝两次 | 后续阶段收益边际递减、成本全面抬升 | D-101（G1） |
| v2 schema 机器强制 | 改动最大、无当前机器消费者（F11）；先文本层+轻量告警 | D-104 |
| AC 硬校验（验收标准治理） | 与"测试不是推进门"宪法原则冲突 | D-102 |
| 本任务内额外真实样例任务 | 三重验证已覆盖（T-021）；额外任务成本高 | D-602 |
| 单子代理多角色 debate | 角色同上下文，自偏与从众风险高（G-002 证据） | D-301 |

## 风险

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 红蓝两次组请求×2 成本与 600s 客户端超时 | 长审查可能超时变 unavailable（如实记录，可重试） | 实施期检测；不可用按事实记录（不阻塞） |
| RISK-002 | material_id 算法不一致 bug（F-012） | 严格冻结路径（dispatchFrozenProviderInput）真实往返可能 MATERIAL_INCOMPLETE | 本任务修复评估（F-012，优先修复） |
| RISK-003 | 契约演进改动面大（合同+十几处测试+AC-011） | 遗漏一处即"纸面合规" | 每 phase 验收含契约测试清单核对 |
| RISK-004 | 文本层链字段仍可能腐烂（告警不阻断） | 结构退化 | stage-reflection 调研/结构维度暴露；触发 X-003 评估 |
| RISK-005 | debate 在 Codex/Multica 宿主只能降级运行 | 角色独立性打折 | 降级路径记录；DSH 优先（本任务 dogfood 在 DSH） |
| X-001 | 延期：跨 provider 第二轮交叉质询 | 触发条件=红蓝+debate 实证后仍显不足 | 后续任务评估 |
| X-002 | 延期：build-plan/build-code/verify-code 同构改造 | 触发条件=本任务机制在真实任务跑稳 | 后续任务评估 |
| X-003 | 延期：decision-entry.v2 机器校验 | 触发条件=出现链字段真实机器消费者 | 后续任务评估 |
| X-004 | 取消：本任务内额外真实样例任务 | 被三重验证替代（T-021） | — |

## 质量边界

- 质量事实：审查/调研/talk 全部照实记录；unavailable 不写成 pass。
- 推进资格：四材料可读即可继续，与质量事实分离。
- 完成判据：Talk 收敛 + 调研事实 + 审查发现处置 + 用户确认 + interaction aggregate。
- 不可逆授权边界：commit/push/merge/archive/cleanup 另行授权。

## 阶段末遗漏披露（大白话）

- 未完成/降级：①`run --action=executed` 正式收口未执行（需宿主凭 receipts 调用，见下）；②make-decision 的 review 未生成 canonical `quality/reviews/results/` 记录（交互路径以 `quality/evidence/review-results/*` + 决策日志处置表承载——如实标注为事实差异，非伪造）；③蓝队 3/5 完成（grok/pi OPEN-004）；④stage-end spec-analyze 语义检查通过（16 节+五维+收敛检查+核心需求卡），但其"正式 stage outcome"记录未生成。
- 已知不适用：UI 流程（non_ui 已记录）；页面范围（n/a，本任务无前端）。
- 无遗漏项：无（其余步骤按 manifest 顺序已执行并记录）。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-004 | grok/pi 在蓝队/多 provider 组持续 PROVIDER_IDENTITY_INVALID（疑似工作区路径 %2F 编码差异或适配器工具回显未被净化覆盖） | 已两轮根修仍未覆盖该两 provider；非阻塞（蓝队 3/5 完成集可作结论；红队 3/5） | build-spec 阶段如再出现同一 provider 失败即实施：适配器层路径掩码或禁用工具回显；成本≤1 phase |
| OPEN-005 | build-spec 定稿细节项清单（mailbox 文件格式、pair_id 元数据、风险回复 public route 命名、蓝队重试窗口、聚合规则、轻量告警规则文件） | 属实现细节，方向已定（全部有 D 条目锚点）——按用户"不依赖 build-spec 补需求"约束，仅限**编码细节**范畴 | build-spec（编码契约），不在需求面 |

## Supersedes

- none

## 文档结果

- CONTEXT.md：change（本任务落地后，"争议 findings/红蓝审查/需求框架/决策链"成为术语，登记 CONTEXT 词条；实施在 build-spec）
- ADR：created（红蓝两次契约演进 + 4 子代理 mailbox debate + findings 处置对话 + R0-R5 调研机制 + 需求框架组合式 + 执行规划调度器模型）
- ADR criteria：hard to reverse（契约与测试面大）/ surprising without context（是）/ genuine trade-off（是）——六项成立
- 术语/ADR 冲突及处理：见"findings 处置对话 vs Talk/Grill/Clarify"概念区分（D-202）
- 术语/ADR 冲突及处理：talk（用户对话）与"findings 处置问询"概念区分，避免与宪法 F7 冲突
- 不复制 spec 的边界：本文件只记决策索引，不写技能正文/协议细节

## 阶段末总览（六部分大白话）

1. 本阶段做了什么：需求在 5 轮 Talk（问答工具）+Grill+红蓝异源审查（方向×2、细节×2）下收敛为 20+ 条决策（6 模块），并完成 2 个真 bug 的根因修复（材料/工作区路径泄漏，均已合入 main）。
2. 需求覆盖情况：R-001~R-020 全部有处置（已覆盖/延期），五维矩阵与收敛检查四行表齐全；运行时语义检查 converge ok=true。
3. 上游对齐：原始需求与参考文件方案均被逐条处置；宪法红线（不新增 stage/gate/第五材料/公共入口）全部保持。
4. 本阶段修复：调研报告 3 版迭代+R5 复核 8 条；红蓝发现 15+8+27+24 条全部逐条处置；2 个运行时 bug 修复并测试。
5. 剩余风险：OPEN-004（grok/pi 路径泄漏）；OPEN-005（编码细节清单）；蓝队 partial 降级语义；文本层告警非阻断。
6. 下一步边界（build-spec）：把本决策落实为 spec——红蓝契约演进细节、findings 对话（spec-clarify 承载）、debate v2 技能、R0-R5 deep-research 技能、decision-log 模板升级、执行规划矩阵写入 SKILL.md、AGENTS.md 测试规则、material_id 修复（D-605）；不得重做方向决策，不得私自扩展 X-001~X-004。

## Exit checks

- 上下文一致：是（16 个 h2 标题唯一且齐全；T 表/决定/审查处置三处互引一致；aggregate 契约校验 valid）
- owner/接口一致：make-decision 独占 Talk/Grill 边界按裁决结果调整（grill 仍独占；talk 按 findings 模式开放给 build-spec——契约演进待 build-spec 实施），其余保持一致
- 失败语义明确：是（成功/失败边界 + D-604 状态转移矩阵；蓝队 partial 如实降级）
- 范围与延期明确：是（非目标/延期 X-001~X-004；OPEN-004/005）
