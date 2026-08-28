# Decision Log

> feature: make-decision-requirement-convergence-20260828
> stage: make-decision（进行中）
> 宿主环境：DeepSeek Harness（codex-session-event 绑定不可用，按 AGENTS.md/ADR-0014 以已按任务工作区规则确认的现有 worktree/工作副本根目录四份材料为当前工作真相，直接维护本文件）
> worktree: `/Users/Hugh/Hugh/Project/workflowhub-make-decision-requirement-convergence-20260828`
> branch: `task/workflowhub/make-decision-requirement-convergence-20260828`（baseline `8cd189c05`）
> 术语说明：本日志中「认证 worktree/工作副本」均指**已按任务工作区规则确认的现有 worktree/工作副本**——路径/分支与当前任务工作区规则一致、可读写且材料保留；「认证」仅指按任务工作区规则确认，**不等于** session 事件绑定（codex-session-event 在当前宿主不可用，见 R-016）。

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | make-decision 的需求收敛不能随机：必须系统检查「原始需求是否满足、原始目标是否达到、验收目标是否清晰、所有需求方案是否收敛」，不能想到什么问什么。 | 用户原文：`现在make-decision的过程中的需求收敛完全是随机的，想到什么问题就问什么问题，完全没考虑原始需求是否满足、原始目标是否达到、验收目标是否清晰、所有需求方案是否收敛等。` | 待 Talk/Grill 收敛 |
| R-002 | 全部 talk/审查/grill 完成后，原始目标必须被真正问过并收敛；不能出现「原始目标一个问题都没问、原始需求完全没收敛」的状态。 | 用户原文：`最终所有talk、审查、grill都完成后，原始目标可能一个问题都没问过，原始需求完全没收敛。` | 待 Talk/Grill 收敛 |
| R-003 | 需求没收敛就导致后续 spec、plan 路线歪掉、没实现最初需求，这是必须消除的后果。 | 用户原文：`导致后续spec、plan的路子也是完全歪的。完全没实现最开始的需求。` | 后果/约束 |
| R-004 | spec-analyze 不能只检查基础文档内容，必须检查「需求收敛」这个语义部分（覆盖、目标达成、验收清晰、方案收敛）。 | 用户原文：`spec-analyze技能也完全没检查这个部分，只检查最基础了文档内容。` | 待 Talk/Grill 收敛 |
| R-005 | make-decision 结束时必须用大白话总结当前核心需求、核心目标和最终方案。 | 用户原文：`make-decision结束的时候也没用大白话总结当前核心需求、核心目标和最终方案。` | 待 Talk/Grill 收敛 |
| R-006 | grill 必须按 GitHub 最新 grill 标准一次问一组问题，不能总是一次只问一个问题。 | 用户原文：`现在grill并没有按照github上最新的grill标准，一次问一组问题，总是一次只问一个问题；` | 待调研；Talk R1 已选「调研上游标准」 |
| R-007 | build-spec 阶段绝大部分场景下 clarify 技能必须被正常使用。 | 用户原文：`build-spec阶段中，绝大部分场景下clarify技能都没有正常使用。` | 待 Talk 收敛（本阶段记录，归属 build-spec 契约） |
| R-008 | 本任务按标准 WorkflowHub 开始，从 make-decision 起步，不跳阶段，不依赖 build-spec 补需求。 | 用户原文：`请按标准 WorkflowHub 开始这个任务吧，从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。` | 本阶段硬约束 |
| R-009 | 基于原始需求，在 make-decision 中一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。 | 用户原文：`先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。` | 本阶段硬约束 |
| R-010 | Talk 用大白话说明选项、后果和风险。 | 用户原文：`Talk 请用大白话说明选项、后果和风险。` | 本阶段硬约束 |
| R-011 | decision-log 记录原始需求、关键事实、选择、理由和延期交接。 | 用户原文：`decision-log 记录原始需求、关键事实、选择、理由和延期交接。` | 本阶段硬约束 |
| R-012 | 正式任务开始前必须先有正确位置的任务 worktree；不能漏掉该步骤。 | 用户原文：`我没看见你创建的worktree啊？你是不是遗漏步骤了？` | 已补执行；worktree 已建立在主项目旁 |
| R-013 | 收敛检查不能只看「原始需求有处置状态」，还要确认所有 decision 能**完整解决**原始需求，覆盖业务目标、未来扩展、UI 交互、验收目标、影响范围等维度。 | 用户原文：`A，不仅要确认原始需求有处置状态，还要想办法确认所有decision可以完整的解决原始需求，包括原始业务需目标求、未来扩展、UI交互、验收目标、影响范围等。` | Talk R2 真实回复，选 A（R→D 覆盖矩阵 + 维度标注，spec-analyze 验收） |
| R-014 | decision-log、spec、plan 里不要出现 R-xxx、D-xxx 之类的 ID 黑话，直接用「需求」「决策」等人话表述。 | 用户原文：`我希望decision-log、spec、plan里不要写R、D之类的黑话了，这些id直接换成需求、决策之类的人话最好` | Talk R2 真实回复，选 A（人话为主，编号隐藏为内部引用） |
| R-015 | 本任务执行过程中遇到的各种阻塞都要登记进当前 decision-log，并在当前任务一并处理，避免以后 WorkflowHub 还有类似问题。 | 用户原文：`我想再加一些需求，当前任务在执行过程中的各种阻塞：codex会话绑定、task绑定、worktree没创建、材料交付方式错了、 frozen packet 无法读取等等问题，都加到当前decision-log中，放在当前任务一起处理。避免以后workflowhub还是有类似问题。` | covered / D-008（子项⑤）、D-009 |
| R-016 | codex 会话绑定不可用不能阻塞任务：`workflowhub-codex-session-event.mjs` 在非 Codex 宿主（如 DSH）直接失败（缺 js-yaml 且无 task 绑定），导致 step/skill 过程事件完全无法记录。 | 本会话真实事实：`node tools/host/workflowhub-codex-session-event.mjs start --stage=make-decision...` → `ERR_MODULE_NOT_FOUND: Cannot find package 'js-yaml'`；无 task 绑定命令直接失败。 | covered / D-008（子项①） |
| R-017 | task 绑定的可用性：task-bootstrap 依赖 codex session 状态绑定，非 Codex 宿主无此机制时任务无法正式初始化（task store 缺失），应明确降级路径或真实 unavailable 记录。 | 本会话事实：tools/cli/task-bootstrap.mjs 调用 bindCodexSessionTask + readCurrentCodexSession；DSH 环境无此状态。 | covered / D-008（子项①） |
| R-018 | worktree 未创建问题（R-012 的机制化）：make-decision 开头必须强制校验 worktree 存在，缺失时先建再开始，不能靠用户回头纠正。 | 本会话事实：step 0 漏建，用户在 Talk R1 纠正（`我没看见你创建的worktree啊？你是不是遗漏步骤了？`）后才补建。 | covered / D-008（子项②），R-012 机制化 |
| R-019 | 材料交付方式不能错：direction/detail 等异源审查必须通过 sealed attachments 包交付材料；裸 request（不带 attachments）会导致 provider 只见 prompt 不见材料，产出无效审查。 | 本会话事实：第一次 direction 调用未带 attachments，两个 provider 均报 frozen packet 无法读取 → 无效 attempt（direction-1）；补 attachments 后才成功（direction-2）。 | covered / D-008（子项③） |
| R-020 | 手工构造 sealed bundle 极易出错（size/sha 不一致、manifest_hash 漏 diff 项、hash 排序算法不统一），应提供可复用工具或走正式 runReview 打包通道，并给出清晰失败诊断。 | 本会话事实：手工构造踩 3 次坑（ATTACHMENT_HASH_MISMATCH → packet/manifest 不绑外层 manifest → 补 diff 项后才过）；canonicalMaterialManifestHash 等算法在 3rd-review lib 与 wh-review 侧需一致。 | covered / D-008（子项③） |
| R-021 | 长时 provider 调用不应被宿主默认超时杀掉：broker run 超过 60s 被 bash 工具 SIGTERM 终止，需后台运行或明确超时语义。 | 本会话事实：第一次 run 60s 超时被杀；后台运行后才完成（direction-2 耗时约 290s）。 | covered / D-008（子项④） |
| R-022 | 诊断 GPT/同类模型执行 build-spec 反复出问题的根因并在当前任务修复：工具参数反复报错、同参数重试、大规格写完才发现 production parser 风险、依赖子代理才能落盘等；区分 WorkflowHub 合同缺口、宿主工具问题、模型执行纪律三类来源；WorkflowHub 可控部分必须在当前任务新增可验收修复，外部宿主问题只如实登记边界，不伪造可修。 | 用户原文：`请检查为什么用gpt模型进行build-spec会有这么多问题，是否需要在decision-log和spec中新增一些需求来修复workflowhub，让以后不要出这么多问题？` | covered / D-010（实现仍属后续阶段） |
| R-023 | Git worktree 存在不等于 WorkflowHub TaskHandle/task store 存在；阶段开始前必须通过官方 bootstrap 在受信任 storage root 发布/打开任务目录，已有 worktree 用显式 existing 绑定复用；不手写 task.json，不因 session provenance unavailable 回滚已创建任务；当前任务缺目录的根因要记录并修复。 | 用户原文：`当前workflowhub任务没有在“/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks”中创建对应任务目录，所以找不到task.json，需要检查为什么没创建对应任务目录？应该如何修复？是否添加到当前需求中一起修复？` | covered / D-012（实现仍属后续阶段） |

## 目标

- 目标：让 `make-decision` 真正「收敛」——每轮 Talk/Grill 都在原始需求矩阵上推进，结束时原始需求逐条有处置、原始目标达成与否可判断、验收目标清晰、方案收敛，并用大白话收尾。
- 本任务要落在制品层面：make-decision 流程、talk/grill/spec-analyze/spec-clarify 技能、decision-log 结构、以及 build-spec 对 clarify 的使用契约，都要可执行、可检查、不依赖人工自觉。

## 成功/失败边界

- 成功边界（待 Talk 确认）：
  - make-decision 结束时原始需求逐条有 covered/deferred/rejected 处置，无静默遗漏；
  - 核心需求、核心目标、最终方案在结束时有大白话总结且用户确认；
  - spec-analyze 的 make-decision profile 检查需求收敛（覆盖/目标/验收/方案），不只是文档存在；
  - grill 按最新标准一次问一组独立问题，不退化逐题；
  - build-spec 明确 Clarify 归属与使用契约，绝大多数场景真实触发。
- 失败边界：
  - 原始需求有未处置条目仍宣称 stage 完成；
  - 结束卡缺核心需求/目标/方案的大白话总结；
  - spec-analyze 只查文件/ID 存在就放行；
  - grill 逐题单问、不组队；
  - build-spec 静默跳过 Clarify 或用 talk 代替。

## 范围

- 当前范围（待 Talk 确认）：make-decision 的收敛机制与检查；talk/grill/spec-analyze/spec-clarify 四个技能的合同与使用点；build-spec 的 Clarify 归属契约。
- 用户流程/结果只记索引和验收影响，细节进入 spec。

## 非目标

- 不新增第五份当前材料（decision-log/spec/plan/tasks 四份边界不变）。（T-011 确认；D-001/D-003 拒绝「新建独立检查文件」）
- 不新增任何新的公共命令；不新增独立状态机；不新增任何机器 gate；不堆机器校验基建。（T-011 确认；D-002 拒绝「机器全量硬校验」、D-004 拒绝「grill ≥2 题强门」）
- 不做产品 GUI/UI 界面；不改宿主渲染层；不改 dsh-code-review；不重写 wh-review。（T-011 确认）
- 完全去除稳定编号不在范围（内部锚点保留，覆盖校验链兼容）。（D-007 拒绝「完全去 ID」；T-013）
- 不做真实端到端故意不收敛的对抗性 dogfood。（T-015 用户选择；D-009、RISK-004）
- 不为不存在的未来设计完整扩展方案（未来扩展只标影响不设计）。（G-001、D-002）
- 不新增第二打包工具；不保留无-task-store 的材料直写分支。（D-011 修正 D-008；T-022/T-023 用户选择）
- 不改 broker/宿主超时配置、不新增 broker 超时机制。（D-008 拒绝方案、D-011）
- 不新增写入校验器、写入门或重试状态机；宿主侧等价沙箱拒绝不在 WorkflowHub 内修。（D-010）
- 交互证据的完全机器强绑定不在本任务落地（延期至后续治理任务）。（D-005、RISK-003）

## R→D 覆盖矩阵（R-013 工件；detail 审查 FND-D02 修复后建立）

| 需求 | 处置状态 | 覆盖决策 | 业务目标维度 | 未来扩展维度 | UI 交互维度 | 验收目标维度 | 影响范围维度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-001 收敛不随机 | covered | D-001,D-002,D-003 | 目标达成判定标准写死 | 扩展点标注规则含于矩阵 | 消费面适用 | spec-analyze 验收 | decision-log/spec-analyze 契约 |
| R-002 目标必须被问过 | covered | D-001,D-002,D-003 | 目标达成=每条需求有处置+决策可见 | 同 R-001 | 同 R-001 | 结束卡+矩阵可核验 | 同上 |
| R-003 消除歪路线后果 | covered | D-001,D-002 | 收敛机制防歪 | 同 R-001 | 同 R-001 | dogfood 验证 | 四材料链 |
| R-004 spec-analyze 查收敛 | covered | D-003 | 目标/收敛验收字段 | 字段可扩展 | —— | 操作性判定标准+异源核验 | stage-content-contracts |
| R-005 结束大白话总结 | covered | D-006 | 核心需求/目标/已选方向摘要 | —— | 消费面 | 结束卡三要素可检查 | CONTEXT.md 用户完成卡 |
| R-006 grill 一次一组 | covered | D-004 | 批次规则 | —— | 消费面 | 批次编号输出可观察 | grill 技能/Sources/steps.json |
| R-007 clarify 正常使用 | covered | D-005 | 判定标准写死 | —— | —— | 批次痕迹可复核 | build-spec/spec-clarify SKILL |
| R-008 不跳阶段不靠 build-spec | covered | D-001~D-008 全程 | 阶段边界 | —— | —— | stage-end 检查 | 五阶段合同 |
| R-009 梳理流程/页面/数据/边界 | covered | D-001,D-002 | 矩阵含四维 | 同 R-001 | 消费面 | 矩阵可核验 | decision-log 结构 |
| R-010 Talk 大白话 | covered | D-001,D-006 | 决策卡人话 | —— | 消费面 | 结束卡人话 | talk 技能/CONTEXT |
| R-011 decision-log 记录五要素 | covered | D-001,D-002,D-006 | 日志结构 | —— | —— | 模板可检查 | decision-log 模板 |
| R-012 worktree 先建 | covered | D-008、D-012 | 预检机制 | —— | —— | load-context 预检 | make-decision SKILL |
| R-013 决策完整解决需求 | covered | D-002,D-003 | 本矩阵即产物 | 扩展点标注（G-001） | UI 交互维度列 | 矩阵完备=方案收敛 | decision-log/spec-analyze |
| R-014 人话化 | covered | D-007 | 呈现层人话 | —— | —— | 内部锚点保留可回指 | 模板/技能文本 |
| R-015 执行阻塞一并登记处理 | covered | D-008（子项⑤） | 五类阻塞全登记 | —— | —— | 子交付项验收 | 本任务范围 |
| R-016 非 Codex 宿主可初始化 | covered | D-008（子项①）、D-011 | 宿主能力检测降级 | —— | —— | 无绑定如实 unavailable | tools/host 脚本；D-011 删除直写分支 |
| R-017 task 绑定可用性 | covered | D-008（子项①）、D-011、D-012 | 与 R-016 同路径 | —— | —— | task-bootstrap 降级；初始化先于绑定（D-011）；任务身份/启动前置（D-012） | tools/cli |
| R-018 worktree 机制化 | covered | D-008（子项②） | 预检先建 | —— | —— | 缺则先建再开始 | make-decision SKILL |
| R-019 材料交付方式 | covered | D-008（子项③）、D-011 | sealed 包交付 | —— | —— | 裸请求诊断指向原因 | 正式入口复用 + 诊断/文档（D-011） |
| R-020 sealed 构造防错 | covered | D-008（子项③）、D-011 | 复用 3rd-review lib 哈希 | —— | —— | 失败诊断清晰 | 复用正式入口（不新增第二工具，D-011） |
| R-021 长时调用不杀 | covered | D-008（子项④） | 文档长时语义 | —— | —— | 后台运行建议 | 技能文档 |
| R-022 诊断 GPT build-spec 问题 | covered | D-010 | build-spec 稳定执行（单一形状权威） | ——（不涉及扩展设计） | 消费面适用（build-spec 执行面） | FR-AUTHORING-001/002、AC-AUTHORING-001/002（spec 侧新验收） | build-spec/decision-log/spec 契约；宿主等价沙箱拒绝只登记边界 |
| R-023 worktree≠TaskHandle 启动前置 | covered | D-012 | worktree 单独存在不算任务已初始化；阶段启动先确认/创建任务身份（任务目录，不手写 task.json） | ——（复用现有官方入口，不设计扩展） | —— | 缺失走官方 create-only 发布；已有 worktree 显式 existing 绑定只校验不覆盖；session provenance unavailable 不回滚；真实错误 fail-loud | 任务启动前置契约（复用官方 bootstrap，不新增入口） |

矩阵状态：23/23 covered（R-022 已由 D-010 覆盖，R-023 已由 D-012 覆盖，实现仍属后续阶段；R-016/017/019/020 由 D-008+D-011 覆盖，R-012/R-017 补 D-012 作「任务身份/启动前置」影响）；无其余未处置需求；无相互矛盾决策（D-011 修正 D-008 两片段，D-012 为新增决定不 supersede 历史决定，其余保持不变）；总决定数=12（D-001~D-012，含范围修正 D-011 与任务身份启动前置 D-012）；扩展点标注规则=「只标注扩展点及其影响的决策，不做扩展设计」（G-001 用户选择）。

## 决定

### D-001（方向总纲）
- question/final_option: 本次治理做到什么程度 / 全都要，按「机制→检查→收尾」顺序做（Talk R1 Q1=C）
- recommendation/plain_language: 推荐 C——只做机制或只做收尾都会留下同样的断链
- decision: make-decision 需求收敛治理覆盖三个层面：①收敛机制（原始需求矩阵逐条处置 + R→D 完整闭环）；②检查（spec-analyze 补目标达成/方案收敛 + 结束卡三要素）；③收尾（大白话结束卡 + 用户确认）
- source_type/reference/exact_excerpt: Talk R1 用户原文 `C、全都要，但按『机制→检查→收尾』顺序做`（q1-pain-priority）
- approval_binding: Talk R1 real reply；最终仍需 approve-decision
- facts_and_constraints: spec-analyze 后端已有 coverage/grill/确认门，缺「目标达成」「方案收敛」两块（F-004）；20260820 存档也未要求这两块（F-007）
- Logic: 三层缺失互相关联 -> 只修一层仍断链 -> 三层都做 -> 用窄改控制复杂度
- choice_reason/impact: 直接消除用户投诉的随机收敛、歪路线、未实现最初需求；影响 decision-log 结构、spec-analyze profile、四个技能文本、build-spec 契约
- consequences_and_risks: 范围中上；必须保持窄改、不加第五材料/新 gate（T-007、G-003）
- rejected_alternatives: 只改技能文本（纸面合规，盲审 FND-001 点名）；新建独立收敛文件（违反 F11）
- unresolved_items/owner: 无
- Supersedes: 无

### D-002（收敛标准）
- question/final_option: 什么算方案收敛 / 逐条处置 + 决定链闭合 + 结束卡三要素 + R→D 覆盖矩阵
- recommendation/plain_language: 推荐——问了不等于收敛，必须有可验收的痕迹
- decision: 每个原始需求 R 行有处置状态（covered/延期/拒绝）；每个决定有 supersedes 链；结束卡三要素齐全；R→D 矩阵逐条覆盖（业务目标/未来扩展/UI 交互/验收目标/影响范围维度标注）
- source_type/reference/exact_excerpt: Talk R2 用户原文 `A，不仅要确认原始需求有处置状态，还要想办法确认所有decision可以完整的解决原始需求，包括原始业务需求目标、未来扩展、UI交互、验收目标、影响范围等`（q2-convergence-def）
- approval_binding: Talk R2 real reply
- facts_and_constraints: R-013；未来扩展维度=只标注扩展点及影响决策，不做扩展设计（G-001）
- Logic: 处置状态只证明需求被处理 -> 决定链闭合才证明被完整解决 -> R→D 矩阵补齐维度 -> 收敛可验收
- choice_reason/impact: 把「收敛」从感受变成可核对事实；影响 decision-log 模板与 spec-analyze 校验输入
- consequences_and_risks: 模板结构要求变多；全部落在现有材料内
- rejected_alternatives: 只问过就算（弱）；机器全量硬校验（违反 F10）
- unresolved_items/owner: 无
- Supersedes: 无

### D-003（spec-analyze 补检查）
- question/final_option: 收敛检查放哪层 / 扩展 decision-log 结构 + spec-analyze 补目标/收敛验收
- recommendation/plain_language: 推荐——复用现有事实链，不加第五材料
- decision: spec-analyze 的 make-decision profile 增加两个验收维度：①目标达成（每条原始需求有处置记录且对应决策可见）；②方案收敛（R→D 矩阵完备、无未处置需求、无相互矛盾决策）；判定标准写死为操作性规则，dogfood 结果经异源 review 核验（不新增机器 gate）
- source_type/reference/exact_excerpt: Talk R2 Q1=A（q2-convergence-layer）+ Talk R3 Q4=A（q3-field-judge）
- approval_binding: Talk R2/R3 real replies
- facts_and_constraints: runtime 现无收敛字段（F-004）；spec-analyze 技能文本承诺语义检查但实现有差距（F-004）
- Logic: 后端已有 coverage/grill 门 -> 补两个缺口字段 -> 写死判定标准 -> 异源核验结果
- choice_reason/impact: 让用户投诉 #1（spec-analyze 只查基础文档）闭环；影响 stage-content-contracts 校验器与 stage-end 调用
- consequences_and_risks: 需小改运行时合同函数；不新增控制面（F11）
- rejected_alternatives: 只改技能文本（FND-001 纸面合规警告）；新建独立检查文件（F11）
- unresolved_items/owner: 无
- Supersedes: 无

### D-004（grill 批次）
- question/final_option: grill「一次一组」怎么保证 / 升级上游引用 + 消歧文本 + 可观察执行规则（批次编号输出）
- recommendation/plain_language: 推荐——文本已合规，根因在执行行为，需可观察规则+实测
- decision: ①把 grill-with-docs Sources pinned commit 从 66898f60（2026-07-13 旧版「一次一问」）升级到 85f83d3fde1d/6654f6b60cd9（round/frontier 模型），重写更新检查记录；②技能 15-16 行消歧为「同卡内多题、每题一轴，独立问题必须同卡成组展示」；③加可观察规则：grill 输出必须暴露编号后的本轮批次（每题编号+推荐项）与依赖题后置；④dogfood 实测该输出
- source_type/reference/exact_excerpt: Talk R2 Q3=A（q2-grill-batch）+ Talk R3 Q1=A（q3-grill-exec）+ 调研 F-001
- approval_binding: Talk R2/R3 real replies
- facts_and_constraints: 上游 2026-07-31 反转推翻「一次一问」（F-001）；本地文本/契约/测试均支持 batch（F-002/F-005）；纯文本技能无执行辅助，批量最小数无强门（F-005）
- Logic: 文本已含 batch -> 根因是执行误读 -> 升级引用消除旧标准误导 + 消歧 + 可观察规则 -> dogfood 实测
- choice_reason/impact: 同时治「旧标准误导」与「执行误读」两源头；影响 grill 技能文本、Sources、make-decision steps.json 表述
- consequences_and_risks: 不加强门（误伤依赖单题且违反 F10，T-006 已记录被拒项）；执行仍依赖遵循，但有了可观察痕迹
- rejected_alternatives: 加每批 ≥2 题机器强门（FND 误伤依赖题、违反 F10）；只升级引用（历史 G-002 已证复发）
- unresolved_items/owner: 无
- Supersedes: 本地 Sources「2026-07-26 检查 bytes 不变、不升级」结论（已失效）

### D-005（build-spec clarify）
- question/final_option: clarify 缺口怎么处理 / 本任务写死判定标准 + 默认触发路径
- recommendation/plain_language: 推荐——归属已明确，缺的是判定标准可执行化
- decision: build-spec/SKILL.md 与 spec-clarify 加操作性判定标准：有歧义必须真实呈现一批独立问题（同卡多题）；无歧义必须显式写 trigger=false + 理由 + 零开放问题；material 歧义判定按 spec-clarify 十个维度（用户旅程/页面范围/数据状态/成功失败/权限角色/集成外部/非目标/延期/验收证据）；clarify outcome 需绑定真实批次痕迹（至少触发批次或显式跳过理由可被 stage-end 检查引用）
- source_type/reference/exact_excerpt: Talk R2 Q5=A（q2-clarify）+ 盲审 FND-002
- approval_binding: Talk R2 real reply
- facts_and_constraints: build-spec 归属独占表述完备（F-006）；缺口=歧义判定全凭执行者、outcome 自报（F-006）
- Logic: 归属已有 -> 判定标准写死为可执行规则 -> 批次痕迹可复核 -> 不再自报
- choice_reason/impact: 让 clarify 在绝大多数场景真实触发而非被跳过；影响 build-spec SKILL、spec-clarify SKILL、stage-end 检查引用点
- consequences_and_risks: 机器兜底（交互证据绑定）延期到后续任务（T-008 被拒项 B 记录）
- rejected_alternatives: 一并加交互证据绑定（改动面过大，吃掉 dogfood 时间）；全部延期（R-007 不落地）
- unresolved_items/owner: 交互证据机器绑定 → 延期交接（见风险表）
- Supersedes: 无

### D-006（结束卡）
- question/final_option: 结束卡「最终方案」定位 / = 已选方向摘要，细节留给后续阶段
- recommendation/plain_language: 推荐——符合 direction 阶段边界（不得交付拟定方案）
- decision: make-decision 结束卡三要素：①核心需求（大白话）；②核心目标；③已选方向摘要（最终方案=当前已选方向的中文摘要，不承诺完整方案）；到 detail 审查后如方向细化再刷新；CONTEXT.md「用户完成卡」定义并入三要素
- source_type/reference/exact_excerpt: Talk R3 Q3=A（q3-endcard）+ Grill G-002 + 盲审 FND-003
- approval_binding: Talk R3 real reply
- facts_and_constraints: direction 合同禁止交付拟定方案/方案比较（wh-review/contracts/make-decision.md 25-36 行）；用户完成卡已有定义（CONTEXT.md 旧 159-160）
- Logic: 用户要求结束卡大白话总结 -> 但方案细节属后续阶段 -> 三要素=需求+目标+已选方向摘要 -> detail 后刷新
- choice_reason/impact: 消除阶段错配与空占位风险；影响 decision-log 模板、CONTEXT.md（已改）
- consequences_and_risks: 无重大风险；随后续刷新机制保持新鲜
- rejected_alternatives: 结束卡写完整方案（违反 direction 合同，越级）
- unresolved_items/owner: 无
- Supersedes: CONTEXT.md 旧「用户完成卡」定义（已修订）

### D-007（人话化）
- question/final_option: R-xxx/D-xxx 黑话怎么处理 / 人话为主，编号隐藏为内部引用
- recommendation/plain_language: 推荐——用户可读性优先，机器锚点保留
- decision: decision-log/spec/plan 用户可见面全面人话化（「需求」「决策」等），R-NNN 等稳定编号降为内部机器锚点（渲染可隐藏、校验仍可回指）；spec-analyze 三处 R-NNN 硬校验保持兼容，不破坏覆盖链
- source_type/reference/exact_excerpt: Talk R2 Q7 补充（q2-r013-loop）+ T-013 A（q2-r014-extent）+ Grill G-004 自查
- approval_binding: Talk R2 real replies
- facts_and_constraints: R-NNN 在 stage-handlers/stage-content-contracts/run-checks 三处硬校验（G-004 自查）
- Logic: 用户要求不要黑话 -> 交互面人话化 -> 内部锚点保留 -> 校验链不破坏
- choice_reason/impact: 直接满足 R-014；影响模板与技能文本呈现、不加运行时大改
- consequences_and_risks: 执行时需保持「内部锚点可回指」，否则覆盖校验失效
- rejected_alternatives: 完全去 ID（破坏 R-NNN 覆盖校验链，T-013 记录）；保留现状（违反 R-014）
- unresolved_items/owner: 无
- Supersedes: 无

### D-008（执行阻塞修复：R-015~R-021）
- question/final_option: 本任务执行阻塞怎么处理 / 全部登记并纳入本任务，保持窄改
- recommendation/plain_language: 推荐——用户点名要一起处理，避免以后同类问题
- decision: ①R-016/017 非 Codex 宿主可初始化：tools/host 脚本加宿主能力检测与如实降级（无 task/session 绑定或依赖缺失时返回真实 unavailable，不伪造成功），并允许在无 task store 时以材料直写模式继续；②R-018 worktree 预检：make-decision load-context 增加明确预检（worktree 缺失先建：分支 task/<项目>/<任务>、主项目旁 workflowhub-<任务>）；③R-019/020 材料交付：提供可复用 sealed bundle 打包辅助 + 失败诊断指向原因；④R-021 长时调用：文档明确 provider 调用数分钟、需后台运行不被宿主短超时杀死；⑤R-015 作为总纲登记全部阻塞
- source_type/reference/exact_excerpt: 用户原文（R-015 表格）+ 新增批真实 replies（q4-host-binding / q4-worktree-precheck / q4-delivery-tool / q4-timeout）
- approval_binding: 新增批 real replies
- facts_and_constraints: codex-session-event 直接 import js-yaml 且依赖 codex session state（G-005）；worktree 目录/分支有确定规则（runtime/task/workspace.mjs 163-165 行）；sealed bundle 哈希算法在 3rd-review lib（F-003/R-020）
- Logic: 执行阻塞真实发生 -> 逐条登记 -> 保持窄改（工具/技能/文档，不动 runtime 核心校验器）-> dogfood 验证
- choice_reason/impact: 消除「以后还是类似问题」；影响 tools/host、make-decision SKILL、wh-review 打包路径、技能文档
- consequences_and_risks: R-016 个别点可能不够彻底（降级而非完整支持）；G-003 已确认接受
- rejected_alternatives: 只支持 Codex（用户环境跑不了）；运行时强制 worktree 校验（F11 过度）；改 broker/宿主超时配置（超出仓库范围，F10）
- unresolved_items/owner: 无
- Supersedes: 无
- **Superseded by: D-011**（仅两片段被修正：子项①中「允许在无 task store 时以材料直写模式继续」的直写分支被删除，因为 task/worktree/task store 已在 session 绑定前初始化，直写分支不存在；子项③「可复用 sealed bundle 打包辅助」明确为复用现有 buildReviewMaterials→ReviewProviderClient→3rd-review 正式入口并补诊断/文档，不新增第二工具。历史原文照录保留，以上片段以 D-011 为准。）

### D-009（dogfood 验证通过标准；detail 审查 FND-D01/FND-D06 修复）
- question/final_option: dogfood 怎么算验证成功 / 通过标准写死，只跑正常简单任务
- recommendation/plain_language: 推荐——验证=质量事实不是 gate；不搞对抗运行（用户选择）
- decision: dogfood 用一个真实简单任务从 make-decision 跑到交接，通过标准：①结束卡三要素齐全（核心需求/核心目标/已选方向摘要，大白话）；②R→D 矩阵逐条覆盖无未处置；③grill 出现同卡多题批次（编号+推荐项）；④spec-analyze 目标达成/方案收敛字段有值；⑤build-spec clarify 有触发痕迹或显式跳过理由；⑥非 Codex 宿主路径（tools/host）如实降级不伪造。术语统一为「验证/演练」，不用「验收」。
- source_type/reference/exact_excerpt: Talk R3 T-015 用户选择 B + detail 审查 FND-D01/FND-D06
- approval_binding: Talk R3 real replies + detail advice
- facts_and_constraints: 用户明确只跑正常任务（q3-dogfood-proof）；质量事实不是推进许可证
- Logic: 通过标准写死 -> 验证可判 -> 但不作 gate（F10/F11）-> 术语用验证统一
- choice_reason/impact: 消除 FND-D01（验收不可判）与 FND-D06（术语冲突）；影响 build-code 阶段的验证任务设计
- consequences_and_risks: T-015 问题轴仅为 dogfood 证明，用户 B 只排除「真实端到端、故意不收敛」的 dogfood，不排除本任务验收中 spec-analyze 判定规则（D-003 目标达成/方案收敛字段）的单元/契约级正反例回放——单元/契约负向样本属于当前任务验收范围；真实端到端对抗 dogfood 与机器强绑定延期（RISK-003/004）；不得伪称用户直接选择了负向测试
- rejected_alternatives: 对抗运行（用户未选）；dogfood 视为验收 gate（违反质量事实非许可证）
- unresolved_items/owner: 真实端到端对抗 dogfood 与机器强绑定 → 后续任务（RISK-003/004）；单元/契约负向样本属当前任务（spec-analyze 判定规则验收），不在延期项
- Supersedes: 无

### D-010（build-spec 模型执行防错合同）
- question/final_option: GPT/同类模型执行 build-spec 反复出错的防错合同怎么定 / 严格 production 形状唯一权威 + 写后即时校验 + 同参禁重试换写入者（不新增机制）
- recommendation/plain_language: 推荐——复用现有生产校验能力与验收最小要求，把错误挡在当前步骤，切断同参盲重试
- decision: ①严格 production profile 是新产出的唯一形状权威：兼容读取（宽容解析能读）绝不能作为写出标准；②写入完成后、冻结前立即运行现有 validateSpecContentProfile 与 acceptance minimum，任何校验错误在当前步骤内修复后再继续；③同一错误同一参数不得重复提交：首次失败先做失败分析，第二次必须切换既有 writer/callback 或受控子代理，并完整保留原始失败事实；④DSH 等价 sandbox 拒绝属于外部宿主事实，WorkflowHub 不修宿主，只停止循环、换路径、如实记录；⑤不新增 gate/命令/状态机，全部复用既有校验能力
- source_type/reference/exact_excerpt: 用户原文（R-022）：`请检查为什么用gpt模型进行build-spec会有这么多问题，是否需要在decision-log和spec中新增一些需求来修复workflowhub，让以后不要出这么多问题？`
- approval_binding: R-022 用户 scope revision 原文（授权检查并按需在 decision-log/spec 新增需求）
- facts_and_constraints: 结构审计已证实双标准事实——严格 parser checkbox 形状 vs 兼容 acceptance parser（spec 侧 PFACT-016）；validateSpecContentProfile 与 acceptance minimum 为现有校验能力（唯一复用点）
- Logic: 反复试错源于形状失配与同参盲循环 -> 写后立即校验把错误挡在当前步骤 -> 同参禁重试切断循环 -> 宿主拒绝只记边界 -> 不新增机制保持窄改
- choice_reason/impact: 直接消除「大规格写完才发现格式问题、同参数重复重试、依赖子代理才能落盘」；影响 spec 侧新增 AUTHORING 域（PFACT-016、FR-AUTHORING-001/002、SCN-015、AC-AUTHORING-001/002）
- consequences_and_risks: 校验仍复用现有能力（不新增 gate/命令/状态机）；宿主等价 sandbox 拒绝无法在 WorkflowHub 内消除，只登记边界、不伪造可修
- rejected_alternatives: 新建专门校验器/写入门（F11 新增重复控制面）；在 WorkflowHub 内「修复」宿主 sandbox 拒绝（宿主外边界，F10）；允许同参数无限重试（浪费与死循环）
- unresolved_items/owner: 无
- Supersedes: 无

### D-011（范围修正：删除不存在的直写分支；打包辅助=复用现有正式入口）
- question/final_option: 范围修正两轴：①无 task store 时是否保留「材料直写」分支；②「可复用打包辅助」是否新增第二工具 / ①删除不存在的直写分支（task/worktree/task store 已在 session 绑定前初始化）；②复用现有正式入口 buildReviewMaterials→ReviewProviderClient→3rd-review 并补诊断/文档，不新增第二工具
- recommendation/plain_language: 推荐 A/A——初始化顺序已锁定，直写分支无使用场景；打包能力已存在，第二工具属重复建设
- decision: ①删除 D-008 子项①中「无 task store 时以材料直写模式继续」分支：task/worktree/task store 已在 session 绑定前初始化，不存在「无 task store」的正式起点，直写分支为不存在的使用场景，删除（用户确认 A）；②D-008 子项③「可复用打包辅助」精确解释为复用现有正式入口 buildReviewMaterials→ReviewProviderClient→3rd-review，并补失败诊断与文档，不新增第二打包工具（用户确认 A）；其余 R-015~R-021 处置不变
- source_type/reference/exact_excerpt: 本会话真实问答锚点：scope-revision-task-store=A（删除不存在的无-task-store 材料直写分支）、scope-revision-review-helper=A（复用现有正式入口，不新增第二工具）
- approval_binding: scope-revision 真实 reply（A/A 两项）
- facts_and_constraints: task/worktree/task store 初始化先于 session 绑定（D-008 子项①、R-017、spec FR-HOST-003/PFACT-004）；sealed 打包能力已存在（3rd-review lib、R-020）；用户确认直写分支不存在、第二工具不新增
- Logic: 初始化先于绑定 -> 无 task store 直写分支不存在 -> 删除；打包能力已有 -> 复用而非新造 -> 窄改保持
- choice_reason/impact: 消除「直写分支」与「第二打包工具」两份不存在/重复的残留表述；影响 D-008 两片段（Superseded by）、R→D 矩阵 R-016/017/019/020 映射、spec 的 FR-HOST/FR-REVIEW 与来源映射
- consequences_and_risks: 无新增机制；范围收窄于既有决定，不做行为重写
- rejected_alternatives: 保留直写分支（存在矛盾的初始化顺序，用户未选）；新增第二打包工具（重复控制面，F11，用户未选）
- unresolved_items/owner: 无
- Supersedes: D-008（仅两片段：①无 task store 直写分支；③打包辅助的形态表述（明确为复用正式入口，不新增第二工具）；其余子项不变）

### D-012（任务身份与启动前置：worktree ≠ TaskHandle/task store）
- question/final_option: worktree 与 TaskHandle/task store 的关系和任务启动语义怎么定 / 严格区分两物：每个正式阶段开始前调用/确认现有官方 task-bootstrap；task 目录缺失走 create-only 发布；已有按任务工作区规则确认的现有 worktree/工作副本传显式 workspace-root 只校验绑定、不覆盖材料
- recommendation/plain_language: 推荐——worktree 只是检出位置，不是任务身份；task store 初始化后 session binding 只是 supporting provenance，不可用不是回滚理由
- decision: ①严格区分 Git worktree 与 TaskHandle/task store：worktree 存在 ≠ 任务已初始化；②每个正式阶段开始前调用/确认现有官方 task-bootstrap（createTask→prepareTaskWorkspace→initializeTaskStore→bind session）；③task directory 缺失时走 create-only 发布/打开任务目录；已有按任务工作区规则确认的现有 worktree/工作副本传显式 workspace-root（existing 绑定）只校验绑定、不覆盖材料；④task store 初始化后 session binding 只是 supporting provenance，unavailable 不回滚已创建任务；⑤真实参数/身份/材料错误 fail-loud；⑥不新增 public command/schema/state machine，全部复用现有官方入口
- source_type/reference/exact_excerpt: 本会话真实问答锚点：task-handle-bootstrap-scope=A（用户确认纳入当前需求并修复）；用户原文见 R-023
- approval_binding: 用户真实确认 task-handle-bootstrap-scope=A
- facts_and_constraints: 诊断时（官方 bootstrap 执行前）的事实：worktree 存在但 Knowledge/Projects/workflowhub/tasks/<task-id> 任务叶子目录不存在、没有成功 bootstrap 记录，根因是只手工创建 Git worktree/手工写四份材料而漏执行官方 task-bootstrap，不是 session 绑定失败回滚；后续已通过官方 create-only bootstrap 成功创建任务目录与完整 task store（task.json 的 workspace_mode=existing、workspace_root 指向当前 worktree，index/facts/quality/verify 齐全），worktree 材料未被覆盖；bootstrap 输出中 session_binding.status=conflict 是 supporting provenance 异常，不影响任务目录创建
- Logic: worktree 与 task store 是两物 -> 阶段开始必须先 bootstrap -> 目录缺失走 create-only -> 绑定只是 provenance、不可用不回滚 -> 真实错误 fail-loud -> 全部复用现有入口
- choice_reason/impact: 消除「worktree 存在即任务已初始化」的误判与漏 bootstrap；影响任务启动前置契约、R→D 矩阵 R-023 行与 R-012/R-017 补标、spec 新增 TASK 域
- consequences_and_risks: 实现仍属后续阶段；不新增机制，只复用现有官方启动入口；若把 provenance 不可用误作回滚理由仍会丢任务，由 AC-TASK-002 验收兜底
- rejected_alternatives: 手写 task.json 绕过官方身份（跳过任务存储、无官方产物）；把 session binding 失败当作回滚理由（错误归因，用户未选）；新增 public bootstrap command（F11 重复控制面）
- unresolved_items/owner: 无
- Supersedes: 无

## 拒绝方案
| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 只改技能文本/文档 | 盲审 FND-001 点名纸面合规；用户投诉重演 | D-001/D-003 |
| 新建独立收敛检查文件 | 违反 F11 第五材料边界 | D-001 |
| 机器全量硬校验 | 违反 F10 | D-002 |
| grill 加 ≥2 题强门 | 误伤依赖单题、违反 F10 | D-004 |
| 结束卡写完整方案 | 违反 direction 合同（禁止交付拟定方案） | D-006 |
| 完全去掉 R-NNN ID | 破坏 spec-analyze 覆盖校验链 | D-007 |
| 只支持 Codex 宿主 | 用户环境（DSH）跑不了 | D-008 |
| 运行时强制 worktree 校验 | F11 过度 | D-008 |
| 改 broker/宿主超时配置 | 超出仓库范围、F10 | D-008 |
| build-spec 一并加交互证据绑定 | 改动面过大，机器兜底留后续任务 | D-005 |

## 三轮 talk

### Talk Round 1 — completed（真实 ask/reply）
- 批次卡：3 个独立决策轴（优先级 / 成功标准 / grill 调研），用户真实回复如下。
- Q1 优先级：**C 全都要，按「机制→检查→收尾」顺序做**。
- Q2 成功标准：**A 契约修正 + 轻量 dogfood：跑一个真实简单任务验证收敛卡**。
- Q3 grill 调研：**A 先调研 Matt Pocock 最新 grilling/grill-with-docs 标准**；同时用户纠正缺失 worktree（R-012，已补）。
- 队列变化：真实回复引入 R-012（worktree 必须先建），已入队并立即处置；Q1/Q2/Q3 均已收敛，Round 1 无剩余 high/medium 待答项。

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | 优先级：A 只做收敛机制 / B 只做收尾与检查 / C 全都要按机制→检查→收尾 | C 改动面最大；A 治本不治尾；B 治尾不治本 | C（全都要，按机制→检查→收尾顺序） | 无新增 | Talk R1 真实 reply（q1-pain-priority） |
| T-002 | 成功标准：A 契约修正+轻量 dogfood / B 只修合同+自动测试 / C 只改文档 | A 耗时但真实验证；B 快但变纸面合规；C 等于重演投诉 | A（契约修正 + 轻量 dogfood 跑真实简单任务验证收敛卡） | 无新增 | Talk R1 真实 reply（q2-success-criteria） |
| T-003 | grill 调研：A 先调研上游最新标准 / B 按现有 pinned 补执行 / C 只核对批次提问 | A 改动有据；B 可能落后上游；C 可能漏项 | A（先调研 Matt Pocock 最新标准）；另纠正 worktree 缺失 | 新增 R-012 并立即处置 | Talk R1 真实 reply（q3-grill-research） |

### Talk Round 2 — completed（真实 ask/reply，两批 10 轴）
- 第一批：收敛检查落点、收敛定义、grill 批次、改动面、clarify 处理、dogfood 形态。
- 第二批：R-013 闭环落地、非目标确认、页面范围/数据状态、R-014 人话化程度。
- 全部按影响排序提问，每题单轴 2~3 选项，用户真实回复；无剩余 high/medium 待答项。

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-004 | 收敛检查落点：A 扩展 decision-log + spec-analyze 补目标/收敛验收 / B 只改技能文本 / C 新建独立检查文件 | A 复用现有事实链不加第五材料；B 重演纸面合规；C 违反 F11 | A（扩展 decision-log 结构 + spec-analyze 补目标/收敛验收） | 无新增 | Talk R2 真实 reply（q2-convergence-layer） |
| T-005 | 收敛定义：A 逐条处置+决定链闭合+结束卡三要素 / B 问过就算 / C 机器全量硬校验 | A 落在模板内；B 问了不等于收敛；C 违反 F10 | A 并补充：要确认所有 decision 完整解决原始需求（业务目标/未来扩展/UI交互/验收目标/影响范围） | 新增 R-013 | Talk R2 真实 reply（q2-convergence-def） |
| T-006 | grill 批次：A 升级引用+消歧 / B 最小批量强门 / C 只升级引用 | A 轻量治执行；B 误伤单题依赖且违反 F10；C 效果有限 | A（升级上游引用 + 消歧文本） | 无新增 | Talk R2 真实 reply（q2-grill-batch） |
| T-007 | 改动面：A 窄改技能文本+模板+最小合同补丁 / B 宽改连宿主 / C 最小改 | A 中等可控；B 超纲；C R-001~R-007 不落地 | A（窄改：技能文本 + 模板 + 最小合同补丁） | 无新增 | Talk R2 真实 reply（q2-scope） |
| T-008 | clarify 缺口：A 写死判定标准+默认触发路径 / B 加交互证据绑定 / C 全延期 | A 治执行层；B 改动大；C R-007 不落地 | A（本任务写死判定标准 + 默认触发路径） | 无新增 | Talk R2 真实 reply（q2-clarify） |
| T-009 | dogfood：A 真实简单任务跑完整收敛链 / B 只写自动测试 / C 两者都做 | A 能证明非纸面；B 验不到真实对话；C 成本双份 | A（一个真实简单任务跑完整收敛链） | 无新增 | Talk R2 真实 reply（q2-dogfood） |
| T-010 | R-013 落地：A R→D 覆盖矩阵+维度标注，spec-analyze 验收 / B 只注明对应 R / C 全靠 Grill | A 查得出维度缺口；B 轻但查不出验收漏；C 重演 grill 只查细节 | A 并补充：decision-log/spec/plan 不要写 R、D 黑话，换成「需求」「决策」人话 | 新增 R-014 | Talk R2 真实 reply（q2-r013-loop） |
| T-011 | 非目标：A 确认清单 / B 增减 | 定了就不能偷扩 | A（确认：不新增第五材料/公共命令/状态机/gate；不改宿主渲染层；不做产品 UI；不改 dsh-code-review；不重写 wh-review；不堆机器校验基建） | 无新增 | Talk R2 真实 reply（q2-nongoals） |
| T-012 | 页面范围/数据状态：A 消费面+材料状态 / B 还有别的 | 符合 R-009 | A（页面范围=workflowhub 消费面；数据状态=四材料/质量事实状态） | 无新增 | Talk R2 真实 reply（q2-surface-data） |
| T-013 | R-014 人话化程度：A 人话为主编号内部隐藏 / B 完全去 ID / C 保留现状 | A 兼容校验器；B 破坏 R-NNN 覆盖校验链；C 违反人话要求 | A（人话为主，编号隐藏为内部引用） | 无新增；R-014 收敛 | Talk R2 真实 reply（q2-r014-extent） |

### Talk Round 3 — completed（真实 ask/reply，4 轴方向建议处置）
- 批卡根据 direction 盲审 findings 排序；全部处置完毕，无剩余 high/medium 待答项。

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-014 | grill 防纸面合规：A 可观察执行规则+dogfood 实测 / B 只改文本 | A 轻微口头纪律治执行层；B 纸面合规 | A（加上可观察的执行规则：批次编号输出 + dogfood 实测） | FND-001 处置 | Talk R3 真实 reply（q3-grill-exec） |
| T-015 | dogfood 证明：A 通过标准写死+对抗运行 / B 只跑正常任务 | A 能证明检查咬人；B 快但 happy path | B（只跑正常简单任务）；保留通过标准写死 | FND-004 部分接受（无对抗运行） | Talk R3 真实 reply（q3-dogfood-proof） |
| T-016 | 结束卡定位：A 已选方向摘要 / B 完整方案 | A 符合阶段边界；B 越级违反 direction 合同 | A（『最终方案』= 已选方向摘要，细节留给后续阶段） | FND-003 处置 | Talk R3 真实 reply（q3-endcard） |
| T-017 | 字段判定主体：A 写死标准+异源核验 / B 自报 | A 不新增 gate、判定可复核；B 同 clarify 自报模式 | A（写死操作性判定标准 + dogfood 结果经异源核验） | FND-005 处置 | Talk R3 真实 reply（q3-field-judge） |

### 新增批（R-015~R-021 收敛）— completed（真实 ask/reply，4 轴）
- 依据用户新增需求（本任务执行阻塞全部登记并一起处理），补 4 个独立轴并收敛。

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-018 | 宿主绑定：A 非 Codex 宿主可初始化+失败如实降级 / B 只支持 Codex / C 只写文档 | A 治本但涉 runtime；B 未解决；C 下次还踩 | A（让非 Codex 宿主可初始化 + 失败如实降级） | R-016/R-017 处置 | 新增批真实 reply（q4-host-binding） |
| T-019 | worktree 预检：A 流程预检缺失先建 / B 运行时强制 / C 只留提醒 | A 轻量可执行；B 过度（F11）；C 靠自觉 | A（worktree 缺失先建再开始） | R-018 处置 | 新增批真实 reply（q4-worktree-precheck） |
| T-020 | 材料交付防错：A 可复用打包辅助+清晰诊断 / B 只写文档 / C 只记录 | A 省踩坑；B 还会手工拼错；C 问题保留 | A（可复用打包辅助 + 清晰失败诊断） | R-019/R-020 处置 | 新增批真实 reply（q4-delivery-tool） |
| T-021 | 长时调用超时：A 文档明确长时语义+工具提示 / B 改超时配置 / C 只记录 | A 小而有效；B 超出仓库范围（F10）；C 下次还杀 | A（文档明确长时语义 + 工具提示） | R-021 处置 | 新增批真实 reply（q4-timeout） |

### 范围修正批（D-011）— completed（真实 ask/reply，2 轴）
- 依据用户对 build-spec 阶段暴露问题的追加询问（R-022 之后），补 2 个独立轴并收敛；两问均真实回复 A。
- 队列变化：无新增需求；D-008 两片段被 D-011 修正（Superseded by）。

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-022 | 无 task store 时材料直写分支：A 删除（task/worktree/task store 已在 session 绑定前初始化） / B 保留直写分支 | A 与初始化顺序一致；B 直写分支不存在使用场景 | A（删除不存在的无-task-store 材料直写分支） | D-008 子项①直写片段 → D-011 | scope-revision 真实 reply（scope-revision-task-store） |
| T-023 | 打包辅助形态：A 复用现有正式入口 buildReviewMaterials→ReviewProviderClient→3rd-review + 诊断/文档 / B 新增第二打包工具 | A 复用不重复建设；B 违反窄改 F11 | A（复用现有正式入口，不新增第二工具） | D-008 子项③打包辅助片段 → D-011 | scope-revision 真实 reply（scope-revision-review-helper） |

### 任务身份启动前置批（R-023/D-012）— completed（真实 ask/reply，1 轴）
- 依据用户对「worktree 存在但任务目录缺失、找不到 task.json」的追加询问（build-spec 阶段暴露），补 1 个独立轴并收敛；用户真实确认 A。
- 队列变化：新增 R-023；新增 D-012（不 supersede 任何历史决定）。

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-024 | worktree 与任务身份/任务存储的关系及任务启动语义：A 纳入当前需求并修复（严格区分；阶段开始前官方 bootstrap；目录缺失 create-only；已有 worktree 显式 existing 绑定只校验不覆盖；不手写 task.json；session provenance unavailable 不回滚；根因记录并修复）/ B 只登记不修 | A 消除「worktree 存在误认为任务已初始化」的根因与漏启动；B 问题保留 | A（纳入当前需求并修复） | 新增 R-023 → D-012 | 用户真实确认（task-handle-bootstrap-scope=A） |

## 调研

### 调研 1：上游 grill 标准（子代理 e0ef8ced，2026-08-24 检查）
- 上游 `mattpocock/skills` main HEAD=`6654f6b60cd9`（2026-08-24）：`grilling`=28 行 round/frontier 模型；`grill-with-docs`=7 行薄壳（调用 grilling + domain-modeling）。
- 上游关键规则（grilling/SKILL.md）：
  1. 按轮工作；frontier=本轮可独立回答的所有决策；**一轮问整个 frontier**，每题编号+推荐答案，等用户回复后才进下一轮；
  2. 依赖未决问题的题放后续轮；
  3. 找事实是 Agent 自己的事，绝不问用户能自查的东西；
  4. 轮内问题用 HR 分隔（2026-08-20 commit `85f83d3fde1d` 新增）。
- **标准历史反转（关键事实）**：本地 pinned `66898f60`（2026-07-13）旧版明文「Ask the questions one at a time… Asking multiple questions at once is bewildering」；2026-07-31 commit `a4b2009a1a3a` 重写为 round/frontier 模型，反向推翻「一次一问」；2026-08-20 加 HR 分隔。本地 Sources「2026-07-26 检查 bytes 不变、不升级」结论已失效。
- 本地 vs 上游：本地 `skills/grill-with-docs/SKILL.md`（214 行改编融合版）第 11-21 行已含 batch 要求（同卡多题、依赖拆分、重排），不比上游弱；差异仅呈现仪式（编号/推荐/HR）。
- 「一次只问一个」最可能成因（按可能性排序）：
  1. **执行者遵循度**：本地 15-16 行中英混排，「每题仍只问一个决策轴」易被误读为「每次一问」；或执行者沿用上游 7-13 旧标准惯性（旧标准明文禁止多问）。证据：文本/合同/工作流三层均要求 batch（steps.json step 8、`runtime/stage/stage-content-contracts.mjs` Grill 校验、`tests/interaction-quality-contract.test.mjs`），技能文本缺失可排除。
  2. 宿主问答展示层逐题串行（`tools/host/` 无 batch 拆分逻辑；数据层支持多题一卡，是否逐题取决于宿主渲染）。
- 建议：升级 pinned commit 至 `85f83d3fde1d` 或 `6654f6b60cd9`，重写「更新检查」记录（2026-08-24，注明 7-31 反转）；可选窄修本地 15-16 行用语消歧；可选采用上游「编号+推荐+HR」仪式强化执行。

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 / mattpocock/skills@6654f6b60cd9 | 上游最新 grill 标准与本地差异 | round/frontier 一轮全 frontier；7-31 反转推翻旧「一次一问」；本地 pinned 过期；本地文本已含 batch | 已记录；升级 pinned 候选 | 待 D |
| F-002 / 本地 skills、steps.json、contracts、tests | 「一次只问一个」成因 | 执行遵循度最可能；合同层已强制 batch | 已记录；窄修用语候选 | 待 D |
| F-003 / ~/.config/workflowhub/config.json | 异源审查 provider 路由可用性 | third_review broker 命令与多 provider profiles（kimi/pi/opencode/cursor/grok/antigravity/claude-code）已配置 | direction/detail advice 可真实尝试 | 待 D |

### 调研 2：仓库现状审计（子代理 8e9794c5，只读）
- **spec-analyze 现状**：生产校验器 `validateStageSpecAnalyzeProfile`(stage-content-contracts.mjs:4029) + `validateStageMaterialContracts`(3982) + `validateRequirementCoverage`(1934)，stage-runner.mjs:367 强制调用。实际校验：四材料字节/快照绑定、证据 fresh 绑定、逐需求 coverage（semantic_match 为自报 expected/actual 浅字符串判断）、oracle/scenario 非空、make-decision 附加 launcher 认证消息五类覆盖 + grill_summary 全矩阵 + 最终确认。
- 四维结论（用户投诉对应）：
  1. 逐条覆盖=**部分**（需求列表主体自报，adapter:310 只绑 decision-log.md）；
  2. 目标达成=**无独立判定**（runtime 无目标达成字段）；
  3. 验收清晰=**部分**（共享 profile 只查 oracle_refs 非空；build-spec 有 AC 失败条件检查、build-code 有逐 AC chain）；
  4. 方案收敛=**完全缺失**（runtime 无收敛字段，grep 无命中）。
- 技能文本承诺「比较行为语义而非 ID/存在」（spec-analyze/SKILL.md:23-24）与实现有差距。
- **grill 现状**：技能文本已含一卡多题（grill-with-docs/SKILL.md:11-17）；宿主契约支持整批 frontier + 部分回答重排（stage-content-contracts.mjs:1784-1803），但批量最小数只要求 ≥1（1660-1662），无 ≥2 强门；纯文本技能无执行辅助；逐题单问属执行者行为；历史存档 `wh-review-execution-flow-improvement/decision-log.md:371`(G-002) 记录过同源问题。
- **build-spec clarify 现状**：trigger=`spec_ambiguity`（skill-deps.yaml:4）；steps.json:7 明确「Only when material specification ambiguity remains」——有歧义才触发、无歧义显式 trigger=false 带理由（stage-content-contracts.mjs:3811-3820）；归属独占表述明确（build-spec/SKILL.md:167-176、spec-clarify/SKILL.md:79-81）。缺口：歧义判定全凭执行者、clarify outcome 为 packet 自报（3773-3784 只能核对自证文本）。
- **20260820 存档对照**：R-011/R-012 要求前四 stage 覆盖原始需求/四材料/AC/结果与 Grill 全需求矩阵；已实现认证消息覆盖、grill_summary 门、结构化 spec 合同（D-008/D-009）；遗留为 transcript 独立认证实现目标 + 3 个 RED 实现风险；**「目标达成/方案收敛」即使在 20260820 设计中（TE-2026-08-20 以来）也未要求，仍是缺口**。

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-004 / stage-content-contracts.mjs、stage-runner.mjs | spec-analyze 实际校验能力 | 逐需求 coverage 部分自报；目标达成无判定；验收部分；方案收敛完全缺失 | 已记录；Talk R2 决策落点 | 待 D |
| F-005 / grill 技能、contracts、archive G-002 | grill 批次执行现实 | 文本/契约支持 batch；无 ≥2 强门；逐题属执行行为；历史同源记录 | 已记录；Talk R2 决策 | 待 D |
| F-006 / build-spec SKILL、steps.json、contracts | clarify 契约现实 | 归属独占、有歧义才触发；歧义判定凭执行者、outcome 自报 | 已记录；Talk R2 决策 | 待 D |
| F-007 / specs/archive/workflowhub-standard-stage-flow-hardening-20260820 | 历史任务既有决定 | 20260820 未要求目标达成/方案收敛校验，本任务为其补充 | 已记录 | 待 D |

## grill

### Grill 执行记录 — completed
- 覆盖矩阵（五类原始消息）：
  1. `goal`（R-001/002/003/005）：目标达成判定标准、结束卡三要素——Talk R2/R3 收敛；
  2. `flow_or_surface`（R-009/012/018）：页面范围=消费面、worktree 预检——Talk R2/新增批收敛；
  3. `data_or_state`（R-011/014/017）：材料/事实状态、人话化与 R-NNN 锚点共存——Talk R2/Grill 收敛；
  4. `success_failure_acceptance`（R-001/002/004/005/006/007）：验收清晰、grill 批次、clarify 判定——Talk R2/R3 收敛；
  5. `constraint_non_goal_defer`（R-008/010/013/015~021）：宪法边界、非目标、执行阻塞修复——Talk R2/新增批/Grill 收敛。
- 未提问决策轴：全部有用户选择或「不提问」事实理由；无遗漏消息类。

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 未来扩展维度做到什么程度 | A：只标注扩展点及其影响的决策，不做扩展设计（避 F8 为不存在的未来堆设计） | 无 ADR/四项退出（未构成取舍） | 用户真实 reply（g1-future-extension） |
| G-002 | 结束卡与现有「用户完成卡」术语冲突 | A：修订「用户完成卡」并入三要素，单一术语 | CONTEXT.md 已修订 | 用户真实 reply（g2-endcard-term） |
| G-003 | 新增执行阻塞需求后改动面 | A：保持窄改，R-016 用降级路径（工具/技能/文档层） | 无 ADR/四项退出（未构成取舍） | 用户真实 reply（g3-scope-after-new-reqs） |
| G-004 | 自查：R-NNN 硬依赖点 | stage-handlers/stage-content-contracts/run-checks 三处硬校验 → 人话化必须保留内部锚点 | 与 T-013 选择一致 | runtime 文件 grep |
| G-005 | 自查：codex-session-event 依赖 | 直接 import js-yaml（package.json 已声明）且依赖 codex session state → R-016 修复点在 tools/host/ | worktree 无 node_modules 需注意 | tools/host/*.mjs |

### 文档结果（Grill 后）
- CONTEXT.md：**changed**——「用户完成卡」定义并入结束卡三要素（核心需求/核心目标/已选方向摘要），引用 `CONTEXT.md:159-161`（worktree 根目录）。
- ADR：**not needed**——三项判据评估：难以反转=否（流程/技能层契约，可逆修改）；无背景意外=部分（技能文档会写明）；真实取舍=部分（人话化 vs 锚点、机器 gate vs 轻量）。非全部为真，不创建。
- ADR criteria：hard to reverse=false / surprising without context=partial / genuine trade-off=partial。
- 术语/ADR 冲突及处理：「结束卡三要素」并入既有「用户完成卡」，避免双术语（G-002）。
- 不复制 spec 的边界：本日志只记决策索引，页面/接口/任务细节留 spec。

### Exit checks（Grill 四项客观退出）
- 外部依赖接口已核实真实定义：**pass**——3rd-review broker 本会话真实调用（doctor/run/sealed attachments 多轮失败后成功），非文档假设（F-003、R-019/R-020）。
- 字段/路径命名唯一权威：**pass**——worktree 路径（`workflowhub-<taskId>`）、分支（`task/<project>/<task>`）、结束卡三要素（CONTEXT.md 用户完成卡）、R-NNN 锚点（runtime 三处硬校验）。
- 失败路径/异常语义明确：**pass**——R-016~R-021 每条有降级/真实 unavailable 语义；direction attempt-1 失败事实保留。
- 范围边界写死、无隐性扩大：**pass**——非目标（T-011 确认）+ 改动面窄改（T-007/G-003）+ 新增需求全部纳入（R-015~021）。

### grill_summary
- status: completed；direction_changing_challenges_resolved: true
- context: { status: changed, reason: 用户完成卡并入结束卡三要素, file: CONTEXT.md }
- adr: { status: not-needed, reason: 三项判据非全真 }
- conflicts: { status: resolved, disposition: 单一术语 }
- requirement_coverage: { status: complete, message_classes: [goal, flow_or_surface, data_or_state, success_failure_acceptance, constraint_non_goal_defer], uncovered: [] }
- exit_checks: { external_interfaces: pass, canonical_names: pass, failure_semantics: pass, scope_boundaries: pass }

## 审查处置

### direction advice（step 6，已完成 → Talk Round 3 处置中）
- 异源 provider 真实调用完成（pi/coding + opencode/v4flash，broker runtime 908b1961，attempts/direction-2/result.json）。
- direction-review.v1 flow 执行；材料严格按合同（raw_requirement/objective_facts/当前选择/备选/假设，无 spec/plan 细节）。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 | grill 批次修复靠文本消歧可能纸面合规（成因是执行者遵循度非文本缺失） | 同层文本修了等于没修 | pending（Talk R3） | 建议：可观察执行规则+dogfood 实测；attempts/direction-2 | main agent → 用户处置 |
| FND-002 | clarify 判定标准硬化停在文本，outcome 自报未消除 | 判定偏差依旧 | pending（Talk R3） | 建议：判定结果绑定可复核点（批次/显式跳过理由） | main agent → 用户处置 |
| FND-003 | 结束卡「最终方案」与 make-decision 阶段边界冲突（direction 在前、detail 在后） | 空占位或方案前移 | pending（Talk R3） | 建议：「最终方案」=已选方向摘要，detail 后刷新 | main agent → 用户处置 |
| FND-004 | dogfood 无可观察通过标准，只跑 happy path 无法证明机制生效 | 复现纸面合规 | pending（Talk R3） | 建议：写死通过标准+至少一次对抗性运行（预期检查失败） | main agent → 用户处置 |
| FND-005 | 「目标达成/方案收敛」字段判定仍由执行者自报（同 clarify 失败模式） | 用户投诉 #1 未被独立确认 | pending（Talk R3） | 建议：写死操作性判定标准+异源核验，不新增 gate | main agent → 用户处置 |
| FND-006 | dogfood 叫「验收」与「质量事实不是推进许可证」语义冲突 | 易误解为 gate | pending（Talk R3） | 建议：重新表述为验证/演练 | main agent → 用户处置 |
| FND-007 | 人话化隐藏编号缺少内部锚点映射证据 | 可能破坏 R-NNN 覆盖校验链 | pending（Talk R3） | 建议：明确内部机器可读锚点映射 | main agent → 用户处置 |

### detail advice（step 10，已完成 → 处置中）
- 异源 provider 真实调用完成（pi/coding completed，duration 227684ms；opencode/v4flash failed——真实失败事实保留）。broker runtime ff4af4c4，attempts/detail-2/result.json。
- 9 个 findings（2 blocking / 3 major / 4 minor），全部处置如下。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 | direction 盲审：grill 批次修复靠文本消歧可能纸面合规 | 同层文本修了等于没修 | fixed | D-004 采纳：升级引用+消歧+可观察批次编号输出+dogfood 实测 | main agent / 决策日志 | 
| FND-002 | direction 盲审：clarify 判定标准停在文本、outcome 自报 | 判定偏差依旧 | fixed | D-005 采纳：判定标准写死（有歧义成批/无歧义显式理由+零开放问题）+批次痕迹可复核 | main agent / 决策日志 |
| FND-003 | direction 盲审：结束卡「最终方案」与阶段边界冲突 | 空占位或方案前移 | fixed | D-006 采纳：最终方案=已选方向摘要；CONTEXT.md 已修订 | main agent / 决策日志 |
| FND-004 | direction 盲审：dogfood 无可观察通过标准 | 无法证明机制生效 | fixed | D-003/D-009 采纳：通过标准写死（见 D-009）；用户 T-015 选择只跑正常任务（对抗运行不做，已记录） | main agent / 决策日志 |
| FND-005 | direction 盲审：目标/收敛字段判定仍由执行者自报 | 同 clarify 自报模式 | fixed | D-003 采纳：操作性判定标准写死+异源核验（T-017） | main agent / 决策日志 |
| FND-006 | direction 盲审：dogfood 叫「验收」与质量事实非许可证冲突 | 易误解为 gate | fixed | 术语统一为「验证/演练」；D-009 使用「验证」 | main agent / 决策日志 |
| FND-007 | direction 盲审：人话化缺内部锚点映射证据 | 可能破坏覆盖校验链 | fixed | D-007 采纳：内部锚点保留（三处 R-NNN 硬校验兼容，G-004） | main agent / 决策日志 |
| FND-D01 | detail 盲审（blocking）：dogfood/实测缺可观察通过标准 | 验收不可判 | fixed | D-009 新增：通过标准写死 | main agent / 决策日志 |
| FND-D02 | detail 盲审（blocking）：R→D 覆盖矩阵缺失 | 原始需求收敛无法核验 | fixed | 本日志新增「R→D 覆盖矩阵」节（21/21） | main agent / 决策日志 |
| FND-D03 | detail 盲审（major）：FND-002/005 的机器可复核点未成接口约定 | 自报模式未彻底消除 | fixed/accepted_risk | D-003/D-005 补 stage-end 引用点描述；机器强绑定留后续任务（见延期表） | main agent / 决策日志 |
| FND-D04 | detail 盲审（major）：D-008 未拆分子交付项 | 范围膨胀风险 | fixed | D-008 拆 5 个子项（①~⑤）；RISK-001 更新 | main agent / 决策日志 |
| FND-D05 | detail 盲审（major）：新增工具缺复用论证 | 重复建设风险 | fixed | D-008 facts 补复用点：workspace 模块/3rd-review lib | main agent / 决策日志 |
| FND-D06 | detail 盲审（minor）：dogfood「验收」术语未统一 | 术语冲突 | fixed | 统一为「验证/演练」（见 D-009） | main agent / 决策日志 |
| FND-D07 | detail 盲审（minor）：D-007 缺锚点映射工件 | 覆盖链风险 | accepted_risk | 映射规则由 build-spec 细化（渲染隐藏+内部回指）；本任务定原则 | main agent / build-spec |
| FND-D08 | detail 盲审（minor）：D-005 延期项未登记风险表 | 跟踪链断裂 | fixed | 新增 RISK-003（交互证据机器绑定延期） | main agent / 决策日志 |
| FND-D09 | detail 盲审（minor）：D-008 缺精确来源摘录 | 来源锚点不足 | fixed | D-008 补新增批问题锚点（q4-* 已引用）；本表即锚点索引 | main agent / 决策日志 |

## 最终确认

### 初始最终确认（scope revision 前，历史快照）
- 状态：accepted
- 用户原文与 host-visible 绑定：用户经本会话最终确认卡选择「A. 确认，进入 build-spec」（final-approval 真实 reply；时间事实：发生于 step 11 approve-decision，早于 step 14~16 的 R-022/R-023 等 scope revision）
- 未确认内容：无（决策卡已确认；机器强绑定等延期项以 RISK-003/004 显式登记）

### 范围修订后的当前确认（追加，非独立新卡）
- 状态：accepted（沿用初始确认，以各 scope revision 批的真实回复作为追加确认证据，不另设确认卡）
- 追加确认事实：T-022（scope-revision-task-store=A）、T-023（scope-revision-review-helper=A）、T-024（task-handle-bootstrap-scope=A）均为用户真实 A 回复；连同 R-022 的 scope revision 授权（step 14），当前 23 条需求（R-001~R-023）与 12 项决定（D-001~D-012）均已确认进入 build-spec
- 延期项：仍按 RISK-003/004 显式登记（机器强绑定与端到端对抗性用例，见风险表与未决项 OPEN-003）
- 说明：本段只是把 scope revision 后的追加确认事实显式化，**不存在也不声称存在独立的「最终总确认卡」**；追加确认证据为 T-022~T-024 等真实回复（见对应 talk 批次表）

## 任务身份与启动前置诊断事实（R-023/D-012，可复核）

诊断时（官方 bootstrap 执行前）的事实——保留原始漏执行历史，不被后续修复覆盖：
- Git worktree 创建记录存在（见 step 0 · worktree 准备）；TaskHandle/createTask 产物不存在——诊断时受信任 storage root 的任务叶子目录缺失、未见 task.json。
- 本次实际走的是官方入口之外的路径：只手工创建 Git worktree/手工写四份材料而漏执行官方 task-bootstrap；未发现真实 bootstrap 成功调用（不声称有成功 bootstrap）。故根因是 bootstrap 漏执行，不是 session 绑定失败回滚。
- 官方入口顺序为 createTask → prepareTaskWorkspace → initializeTaskStore → bind session；task store 初始化后 session binding 的 provenance 不可用不回滚已创建任务。

后续修复事实（官方 create-only bootstrap 已执行，2026-08-29）：
- 已通过官方 create-only bootstrap 成功创建任务目录与完整 task store：task.json 的 workspace_mode=existing、workspace_root 指向当前已按任务工作区规则确认的现有 worktree/工作副本，index/facts/quality/verify 齐全（facts 为空属 vNext 初始态），worktree 内四份材料未被覆盖。
- bootstrap 输出中 session_binding.status=conflict 是 supporting provenance 异常，不影响任务目录创建，不构成失败或回滚理由。
- 隔离复现边界风险（本次诊断发现的待评估缺陷，非本次成功运行失败）：若官方入口在 create-only 发布后、工作区/存储准备阶段失败，可能留下半创建目录并令重试被 create-only 冲突卡住；此为待 build-plan/build-code 评估的缺陷，不新增公共状态机/恢复面。

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 本任务范围可能过大（四个技能 + 流程 + 契约 + 执行阻塞修复），需要控制最小改动面 | 范围膨胀、维护成本上升 | 已拆 D-001~D-009 + D-008 五子项；G-003 确认窄改 |
| RISK-002 | 已按任务工作区规则确认的现有 worktree/工作副本不含 node_modules（git worktree 只检出 tracked 文件），后续阶段跑测试需要安装依赖或复用主仓库环境 | 验证成本、环境不一致 | build-plan/build-code 时处理 |
| RISK-003 | 延期：交互证据机器绑定（clarify outcome 绑定真实批次、FND-002/005 完全机器化）与机制「咬人」对抗性用例 | 执行层依赖遵循；spec-analyze 测试覆盖留后续 | 后续 WorkflowHub 治理任务；本任务只写死标准与可观察规则 |
| RISK-004 | 对抗性运行不做（用户 T-015 选 B） | dogfood 只证明 happy path；检查「会咬人」由 spec-analyze 测试覆盖 | 后续任务（并入 RISK-003） |
| RISK-005 | 隔离复现边界风险：官方入口在 create-only 发布后、工作区/存储准备阶段失败，可能留下半创建目录并令重试被 create-only 冲突卡住（登记自「任务身份与启动前置诊断事实」节；该缺陷在本次官方 bootstrap 成功执行后未实际发生，属待评估缺陷，非本次成功运行失败） | 重试被 create-only 冲突卡住；半创建目录被误判为任务已初始化 | build-plan/build-code 时明确成功/完整事实（task.json + index.json + facts.jsonl + quality/ 全部存在），缺失任一即 fail-loud，不视为 unavailable 成功；操作员可复用现有官方入口（open + initializeTaskStore 幂等重入）或人工检查，不新增恢复状态机/回滚机制/第二启动路径/公共命令 |

## 质量边界

- 质量事实：本阶段仅本决策日志；host 会话事件记录不可用（已说明）。
- 推进资格：Talk 真实回复后继续。
- 完成判据：原始需求逐条处置 + 用户最终确认 + stage-end 收敛检查。
- 不可逆授权边界：本阶段不写实现代码；不授权任何不可逆动作。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 原始需求里的「页面范围」指什么？本任务是 workflowhub 自身的流程/技能治理，可能没有产品页面。 | 需要在 Talk 里与用户对齐「页面范围」的语义 | 已关闭：Talk R2 T-012 真实 reply——页面范围=workflowhub 消费面（Talk 卡/结束卡/决策日志结构/spec-analyze 输出），数据状态=四材料与质量事实状态 |
| OPEN-003 | 交互证据的完全机器强绑定与机制「咬人」端到端对抗性用例延期（非材料歧义，material ambiguity=0） | 与 spec.md 的 OPEN-003 同义：本任务只写死可复核判定标准与可观察规则，机器兜底/对抗用例交后续治理任务 | 后续 WorkflowHub 治理任务（含于 RISK-003/004，不阻塞当前 build-spec 草稿） |

## Supersedes

- 无（新任务）。

## 文档结果

- CONTEXT.md：待 grill 后判断。
- ADR：待 grill 后判断。

## Exit checks

> ⚠️ 快照说明：以下四项与「stage-end spec-analyze（step 12）」结果均为 **scope revision 前历史快照**——当时范围 21 条需求、D-001~D-009、Talk T-001~T-021（三轮 17 轴 + 新增批 4 轴）；它们证明 scope revision 前那次收敛检查通过，**不能冒充**当前 23 条需求/12 项决定/24 轴的复核证据；scope revision 后未再次运行 validateStageSpecAnalyzeProfile 的完整 packet（不声称有重跑）。范围修订后的当前事实见本节末尾追加段。

- 上下文一致：通过——spec-analyze make-decision profile 真实运行 status=consistent（21/21 covered，evidence fresh 绑定 decision-log sha256 + worktree HEAD）。
- owner/接口一致：通过——D-001~D-009 各决定有来源/理由/拒绝项/未决项；R→D 矩阵 21/21。
- 失败语义明确：通过——FND-001~007 + FND-D01~D09 全部处置（fixed/accepted_risk），RISK-001~004 有 owner/阶段。
- 范围与延期明确：通过——非目标确认（T-011）、窄改（G-003）、RISK-003/004 显式延期。

### stage-end spec-analyze（step 12，completed；scope revision 前历史快照）
- 输入：21 条原始需求 + decision-log 全文 + fresh evidence（sha256/HEAD 绑定）。
- 结果：`status=consistent, ok=true, covered_count=21/21`，无 errors（从主仓库 node_modules 运行 len，worktree 无依赖）。
- 本次运行同时验证了 F-004 的修复方向：后端校验器本就能查收敛，缺的是执行层构造真实覆盖输入（R-004/D-003 落点正确）。

### 范围修订后的当前事实（追加，非重跑）
- 当前矩阵：R-001~R-023 共 23 条需求全部 covered（见 R→D 覆盖矩阵节，23/23）。
- 当前决定：D-001~D-012 共 12 项（含范围修正 D-011 与任务身份启动前置 D-012）。
- 当前 Talk/Grill 轴数：T-001~T-024 共 24 轴（R1 3 轴 + R2 10 轴 + R3 4 轴 + 新增批 4 轴 + 范围修正批 2 轴 + 任务身份批 1 轴），全部收敛、均用户真实回复。
- 当前任务身份：官方 create-only bootstrap 已成功创建任务目录与完整 task store（existing 绑定，材料未被覆盖），见「任务身份与启动前置诊断事实」节。
- 状态边界：当前 build-spec 仍未完成，本日志仍为 make-decision 材料；上文 stage-end spec-analyze（step 12）的 21/21 仅代表 scope revision 前那次运行，validateStageSpecAnalyzeProfile 的完整 packet 在 scope revision 后未重新运行。

### 六段大白话总结（step 13 publish 卡；scope revision 前历史快照）
1. **本阶段做了什么**：从 make-decision 起步跑完标准 13 步——全需求登记（21 条）、三轮 Talk（17 轴真实问答）、两次独立盲审（direction 7 findings + detail 9 findings 全部处置）、全需求 Grill（五类覆盖矩阵 + 四项退出全过）、决策草案 + 用户确认、stage-end 收敛检查通过。
2. **原始需求覆盖到什么程度**：21/21 逐条处置（covered），R→D 矩阵逐条对应决策与五个维度标注（业务目标/未来扩展/UI 交互/验收目标/影响范围）；原始投诉五条（随机收敛、spec-analyze 只查文档、无大白话收尾、grill 逐题、clarify 未用）全部有决定。
3. **与上游产物和实际语义是否一致**：一致——spec-analyze 真实运行 consistent；两轮异源盲审 findings 全部处置，无未处置项；CONTEXT.md 已修订（用户完成卡并入三要素）。
4. **本阶段当场修复了什么**：worktree 先行（R-012，用户纠正后已建）；R-015~R-021 执行阻塞全部登记并给出修复方案；R→D 覆盖矩阵补齐（detail 盲审 blocking 发现）；dogfood 通过标准写死（D-009）。
5. **剩余风险、未决和延期**：机器强绑定与对抗性用例延期（RISK-003/004）；R-016 降级偏轻；worktree 无 node_modules（RISK-002）；执行层遵循仍需 dogfood 验证（D-009 通过标准已定）。
6. **下游可以直接消费什么、不能自行猜什么**：build-spec 可消费 D-001~D-009 的锁定方向与 R→D 矩阵，必须遵守「有歧义才 Clarify、无歧义显式理由」契约；不得重新问 Talk/Grill 已收敛的方向，不得新增产品方向，不得把 R-015~R-021 的修复静默扩展或丢弃（含 RISK-003/004 延期交接）。

> 以上六段为 scope revision 前历史快照（21 条/D-001~D-009/17 轴/step 12 的 21/21）；当前事实补充如下，不覆盖历史原文。

### 范围修订后的事实补充（当前）
1. **当前需求与决定总数**：R-001~R-023 共 23 条（追加 R-015~R-021 新增批、R-022 写入防错、R-023 任务身份启动前置），D-001~D-012 共 12 项；上文六段中的 21 条/D-001~D-009/17 轴均为 scope revision 前快照，不是当前 23/12 证据。
2. **当前收敛与任务身份**：R→D 矩阵 23/23 covered；官方 create-only bootstrap 已成功补建任务目录与完整 task store（existing 绑定、材料未被覆盖、session_binding conflict 为 provenance 异常）；但当前 build-spec 仍未完成，本总结不代表 build-spec 已开始或完成。
3. **下游消费更新**：build-spec 可消费 D-001~D-012 的锁定方向与 23/23 矩阵（含 D-010 AUTHORING 域、D-011 范围修正、D-012 TASK 域），仍须遵守「有歧义才 Clarify、无歧义显式理由」、非目标与 RISK-003/004/OPEN-003 延期契约。

---

## Step outcomes（追加）

### step 0 · worktree 准备 — completed（用户纠正后补执行）
- 用户原文：`我没看见你创建的worktree啊？你是不是遗漏步骤了？`
- 已创建并按任务工作区规则确认的现有 worktree/工作副本：`/Users/Hugh/Hugh/Project/workflowhub-make-decision-requirement-convergence-20260828`，branch `task/workflowhub/make-decision-requirement-convergence-20260828`，baseline `8cd189c05`。
- 误放于主仓库 `specs/make-decision-requirement-convergence-20260828/` 的初版决策日志已删除；当前材料统一放 worktree 根目录（ADR-0014）。
- 已登记为 R-012：正式任务开始前必须先有正确位置的任务 worktree。

### step 1 · load-context — completed
- 已读便携包 `workflows/make-decision/SKILL.md`、`steps.json`、`skill-deps.yaml`；已读 Talk/Grill/decision-log/spec-analyze/spec-clarify 技能；已读原件（用户本次消息）。
- 已确认标准流程步骤序列 step1..step13；确认 Talk=R1/R2/R3 + research + direction advice + grill + draft + detail advice + approve + stage-end analyze + publish。
- 宿主 codex-session-event 绑定在当前 DSH 会话不可用；按 AGENTS.md/ADR-0014 直接维护 worktree 根目录四份材料。

### step 2 · triage-scope — completed
- 原始需求已编译为 R-001..R-014（见上表）；非目标已由 Talk R2 确认；范围初步圈定为 process/skill/contract 三个层面。
- OPEN-001 已关闭：页面范围=workflowhub 消费面（Talk 卡/结束卡/决策日志结构/spec-analyze 输出），数据状态=四材料与质量事实状态（Talk R2 T-012 真实回复）。
- （scope revision 后当前说明：本 step 的 R-001..R-014 为当时快照；需求总数现已扩展为 R-001~R-023 共 23 条——追加 R-015~R-021（新增批）、R-022（step 14）、R-023（step 16）。）

### step 3 · talk-round-1 — completed
- 三题独立批次（优先级/成功标准/grill 调研），真实回复：C / A / A + worktree 纠正（R-012）。
- （scope revision 后当前说明：Talk 轴最终共 T-001~T-024 计 24 轴——R1 3 轴 + R2 10 轴 + R3 4 轴 + 新增批 4 轴 + 范围修正批 2 轴 + 任务身份批 1 轴，全部收敛；本 step 的 3 题为本轮当时记录。）

### step 4 · research-inputs — completed
- 调研 1（上游 grill 标准）与调研 2（仓库现状审计）已由两个独立子代理完成并落档（F-001..F-007）。
- 关键事实：「目标达成/方案收敛」在 spec-analyze 运行时完全未检查；grill 文本已合规、逐题属执行行为；clarify 归属已明确、缺口在判定标准。

### step 5 · talk-round-2 — completed
- 两批 10 轴独立问题全部真实回复（T-004..T-013）：收敛检查落点 A、收敛定义 A+R-013、grill 批次 A、改动面 A、clarify A、dogfood A、R-013 落地 A+R-014、非目标 A、页面/数据 A、人话化程度 A。
- 收敛状态：本轮无剩余 high/medium 待答项，本轮收敛。

### step 6 · direction-advice — completed
- 已按 direction-review.v1 合同构造请求（reconstruct → reveal → challenge，只含原始需求+客观事实+约束+非目标+当前选择，不含 spec/plan 细节）。
- broker doctor 通过；provider 路由可用（F-003）；真实 provider 调用完成（attempts/direction-2，5+ findings 已入「审查处置」表）。
- attempt direction-1（裸 request 无附件，provider 只见 prompt）按真实失败保留；方向审查结论：可观察执行规则、可复核判定、结束卡时序、dogfood 通过标准、字段判定主体（R-019 相关经验已登记）。

### step 7 · talk-round-3 — completed
- direction 盲审 findings 4 轴处置（T-014..T-017），真实回复收敛；用户选择 dogfood 只跑正常任务（对抗运行不做，已在原需求处置中记录）。

### step 7.5 · 新增需求批（R-015~R-021）— completed
- 用户补充：本任务执行阻塞（codex 会话绑定、task 绑定、worktree 未建、材料交付方式错、frozen packet 读取失败、超时）全部登记进本任务一并处理。
- 已编译 R-015..R-021；4 轴收敛（T-018..T-021）：宿主可初始化+如实降级、worktree 流程预检、可复用打包辅助+诊断、文档长时语义+提示。

### step 8 · grill-with-docs — completed
- 覆盖矩阵五类原始消息（goal/flow_or_surface/data_or_state/success_failure_acceptance/constraint_non_goal_defer）全部收敛，无遗漏类、无未处置轴。
- G-001~G-005 记录；CONTEXT.md 已修订「用户完成卡」并入结束卡三要素；ADR not needed（三项判据非全真）；四项退出检查全 pass。
- 完整记录见「grill」节。
### step 9 · write-decision-draft — completed
- D-001~D-009 + 拒绝方案表 + R→D 覆盖矩阵（21/21）写入本日志。

### step 10 · detail-advice — completed
- pi/coding completed（227684ms，9 findings）+ opencode/v4flash failed（真实保留）。
- 9 findings 处置：FND-D01~D09（8 fixed / 1 accepted_risk），见「审查处置」表。

### step 11 · approve-decision — completed
- 用户最终确认卡真实 reply：A（确认，进入 build-spec）；「最终确认」节状态 accepted。

### step 12 · stage-end-spec-analyze — completed（scope revision 前历史快照）
- validateStageSpecAnalyzeProfile('make-decision') 真实运行 consistent / 21/21（详见 Exit checks 节；该次运行为 scope revision 前 21 条需求的快照，scope revision 后未重跑完整 packet）。

### step 13 · publish-decision — completed
- 六段大白话总结卡已向用户呈现；本阶段真实完成，交接 build-spec。

### step 14 · build-spec scope revision 处置（R-022 → D-010）— diagnosed / decision fixed（实现仍属后续阶段）
- 用户原文：`请检查为什么用gpt模型进行build-spec会有这么多问题，是否需要在decision-log和spec中新增一些需求来修复workflowhub，让以后不要出这么多问题？`
- scope revision 事实：用户提出本条 scope revision，明确授权检查「GPT/同类模型执行 build-spec 问题多」的原因，并授权按需要在 decision-log 与 spec 中新增需求来修复 workflowhub；本条是已接受的 scope revision（授权检查、按需新增需求），现诊断完成、决定已锁定（D-010），实现仍属后续阶段。
- 人话需求（已登记 R-022）：诊断 GPT/同类模型执行 build-spec 时反复工具参数错误、同参重试、大规格写完才发现 production parser 风险、依赖子代理才能落盘等问题；区分 WorkflowHub 合同缺口、宿主工具问题、模型执行纪律三类来源；WorkflowHub 可控部分必须在当前任务新增可验收修复，外部宿主问题只如实登记边界、不伪造可修。
- 处置结果（outcome：diagnosed / decision fixed）：诊断完成——防错合同锁定为 D-010（production 形状唯一权威、写后即时校验、同参禁重试换写入者、宿主等价沙箱拒绝只登记边界、不新增机制）；R-022 状态更新为 covered/D-010，R→D 矩阵 22/22；spec 侧已新增来源映射 R-022→D-010、PFACT-016、FR-AUTHORING-001/002、SCN-015、AC-AUTHORING-001/002 与 Clarify/调研/简单性记录更新。实现（执行纪律落地）仍属后续阶段（build-spec 完成 + build-plan/build-code 实施），本日志只锁决定，不自称生产校验通过。

### step 15 · build-spec scope revision 范围修正（D-011）— decision fixed（实现仍属后续阶段）
- 用户原文：build-spec 阶段追加询问后形成的两轴范围修正——①无 task store 时材料直写分支是否保留；②打包辅助是否新增第二工具。
- scope revision 事实：两问均真实回复 A（锚点 scope-revision-task-store / scope-revision-review-helper）：删除不存在的无-task-store 直写分支（task/worktree/task store 已在 session 绑定前初始化）；打包辅助=复用现有正式入口 buildReviewMaterials→ReviewProviderClient→3rd-review 并补诊断/文档，不新增第二工具。
- 处置结果（outcome：decision fixed）：新增 D-011；D-008 两片段标注 Superseded by D-011（历史原文保留）；R→D 矩阵 R-016/017/019/020 映射补 D-011；总决定数更新为 11（D-001~D-011），需求仍为 22。spec 侧同步：来源映射加 D-011、直写/第二打包器相关表述清理并改挂 D-011/PFACT-004/PFACT-006、FR-HOST/FR-REVIEW 范围边界更新。实现（模板/契约/运行时形状）仍属后续阶段，本日志不自称生产校验通过。

### step 16 · 任务身份启动前置 scope revision 处置（R-023 → D-012，task-handle-bootstrap-scope=A）— decision fixed（实现仍属后续阶段）
- 用户原文：`当前workflowhub任务没有在“/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks”中创建对应任务目录，所以找不到task.json，需要检查为什么没创建对应任务目录？应该如何修复？是否添加到当前需求中一起修复？`
- scope revision 事实：用户真实确认 task-handle-bootstrap-scope=A——把「Git worktree 存在不等于 TaskHandle/task store 存在；阶段开始前必须经官方 bootstrap 在受信任 storage root 发布/打开任务目录；已有 worktree 用显式 existing 绑定复用；不手写 task.json；不因 session provenance unavailable 回滚已创建任务；当前任务缺目录的根因记录并修复」纳入当前需求并修复；本条是已接受的 scope revision（授权检查并修复）。
- 人话需求（已登记 R-023）：见原需求表（covered / D-012，实现仍属后续阶段）。
- 诊断事实（保留原始漏执行历史）：诊断时 worktree 创建记录存在、task 叶子目录与 createTask 产物不存在、未发现真实 bootstrap 成功调用；官方入口顺序 createTask→prepareTaskWorkspace→initializeTaskStore→bind session，task store 初始化后 binding provenance unavailable 不回滚；实际走的是官方入口之外的路径（只手工创建 Git worktree/手工写四份材料而漏执行官方 task-bootstrap），不声称有成功 bootstrap。
- 处置结果（outcome：decision fixed）：新增 R-023/D-012（TaskHandle 批 T-024 真实回复 A）；R→D 矩阵 23/23（R-012/R-017 补 D-012 作「任务身份/启动前置」影响），总决定数更新为 12（D-001~D-012）；本日志「任务身份与启动前置诊断事实」节已登记可复核事实：诊断时任务目录缺失、根因是漏执行官方 task-bootstrap，原始漏执行历史保留；后续已通过官方 create-only bootstrap 成功补建任务目录与完整 task store（task.json 的 workspace_mode=existing、workspace_root 指向当前 worktree，index/facts/quality/verify 齐全），worktree 材料未被覆盖，bootstrap 输出中 session_binding.status=conflict 是 supporting provenance 异常、不影响任务目录创建，不构成失败或回滚。spec 侧同步：来源映射 R-023→D-012、PFACT-017、FR-TASK-001/002、SCN-016、AC-TASK-001/002、Clarify 第 3 批（task-handle-bootstrap-scope）与 SRES-006。实现（把任务启动前置契约固化进运行时/技能、供后续任务复用现有官方入口）仍属后续阶段（build-spec 完成后阶段实施），本日志只锁决定，不自称生产校验通过。另登记隔离复现边界风险（RISK-005，见风险表）：官方入口在 create-only 发布后若工作区/存储准备失败，可能留下半创建目录并令重试被 create-only 冲突卡住——待 build-plan/build-code 评估，非本次成功运行失败，不新增状态机/恢复面，详见「任务身份与启动前置诊断事实」节。
