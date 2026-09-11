# Decision Log

> task: `workflowhub-mechanism-simplification-20260910`
> worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-20260910`
> baseline: `35136234cff9f918e69c454f00b369065b4ec3a6`（main HEAD）
> stage: `make-decision`（进行中）

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 用户认为 `workflowhub-followup-tasks-20260910.md` 方案「就算实施了，未来也一样会出现很多阻塞和问题」，不接受它作为整改方案 | 用户原话（本会话）：「我觉得这个方案就算实施了，未来也一样会出现很多阻塞和问题」 | D-002 `rejected_alternatives` + `## 拒绝方案` + OI-018 |
| R-002 | 根因不是「这些遗漏」，而是「整个机制有极大的问题」：大量质量、流程、gate 在 stage 之间流转 | 用户原话：「不仅仅是这些遗漏，而是整个机制有极大的问题，大量的质量、流程、gate在stage之间流转」 | D-001/D-002/D-003 + OI-001~OI-004 |
| R-003 | 目标配比：执行任务时 token 和时间应主要花在任务本身；现状超过 50% 花在处理流程和机制上 | 用户原话：「只有不到50%的token和时间花在任务本身上面，超过50%的token和时间在处理这些流程和机制上面」 | D-001（口径标为推算）+ D-015（M1–M5）+ OI-001/OI-017 |
| R-004 | 每次改动 workflowhub 都可能在层层叠叠的质量流程上再加新东西，导致越来越难维护；要求整改方案本身不能再造成这个后果 | 用户原话：「每次改动workflowhub都可能会在层层叠叠的质量流程上增加新的东西，导致越来越难维护」 | D-013（零新产物守卫）+ D-014（宪法同步）+ D-015（M4）+ OI-016/OI-018 |
| R-005 | 交付物是基于 followup 方案**重新设计**一个更好、更优雅、未来更好维护的整改方案 | 用户原话：「基于这个方案，重新设计一个更好更优雅，未来更好维护的整改方案」 | D-002/D-013/D-015/D-019 + OI-007/OI-019 |
| R-006 | 目标状态：workflowhub 未来不要再出现类似阻塞；不要再出现越来越难维护的对象 | 用户原话：「希望workflowhub未来不要再出现类似的阻塞了，也不要再出现越来越难维护的对象了」 | D-013/D-016/D-024 + `## 阻塞分类学与防护` + OI-004/OI-005/OI-015/OI-029 |
| R-007 | 最终目标：每个 stage 执行时能正确执行所有 step、skill，记录该记录的、修改该修改的，但不要有那么多质量验证、流程文件、门禁阻挡任务推进 | 用户原话：「每个stage在执行时能正确的执行所有的step、skill，记录该记录的、修改该修改的，但是不要有那么多质量验证、流程文件、门禁阻挡任务的推进」 | D-003/D-004/D-005/D-006/D-011/D-022/D-023；**保留侧清单见 `## 保留记录清单`（K1–K9）**；step/skill 执行保证见 D-027⑥ 与 OI-009 |
| R-008 | 用户明确点名的阻塞对象族（认为它们都是宪法极力避免的东西）：producer、schema、writer、consumer、quality、product_release、canonical、证据链、review/snapshot/retry、runner、validator、currentness、task-store、outcome 等 | 用户原话所列清单 | **逐对象处置见 `## R-008 点名对象族处置`（16 个对象全部收口）**；其中 producer / runner / validator / retry(自动重发) / outcome(阶段级) / canonical-* 六个由 D-027 补处置 |
| R-009 | 流程纪律：按标准 WorkflowHub 执行——先建 worktree，从 make-decision 开始，不跳阶段 | 用户原话：「请按标准 WorkflowHub 开始这个调研和设计任务吧，先创建worktree，然后从 make-decision 开始，不要跳阶段」 | 已执行（worktree 已建） |
| R-010 | 本任务不做实现；make-decision 之后接 build-prd，设计一条完整的方案路线 | 用户原话：「最终目标不是一个任务完成所有工作，而是make-decision后接build-prd设计一个完整的方案路线」 | D-018（批次）+ D-019（本任务不实现）+ D-025② + OI-021 |
| R-011 | 交互纪律：主会话上下文控制 + 子代理派发；Talk 与 Grill 用大白话说明选项、后果、风险 | 用户原话：「注意主会话上下文控制和子代理派发。Talk 和grill请用大白话说明选项、后果和风险」 | 执行中 |
| R-012 | 调研输入（只读来源，非当前材料）：`workflowhub-build-verify-blocker-root-cause-20260910.md`、`workflowhub-task-execution-process-root-cause-and-optimization-20260910.md`、`workflowhub-workflowhub-make-decision-hardening-root-cause-audit-20260910.md`、`workflowhub-build-prd-session-retrospective-2026-09-10.md`、`workflowhub-task-C-...-gap-audit-20260910.md`、`workflowhub-followup-tasks-20260910.md`、`workflowhub-execution-simplification-postmortem-20260909.md` | 用户给出的文件路径清单 | 执行中 |
| R-013 | **不依赖外层 timeout**：审查进程的失败必须由 **3rd-review 的健康检查**自动关闭，保证流程健康与效率，不再被无止尽的审查浪费时间 | 用户原话（本会话）：「我不希望通过timeout来停止这种审查，还是要通过3rd-review的健康的检查来自动关闭失败的审查进程，保证workflowhub流程运行的健康和效率，再也不要被这种无止尽的审查浪费时间了」 | **本轮新增**：见 `#### D-030` 与 OI-030（`## 收敛大纲`）|

### 需求框架（先选一类，再逐步回填）

- **framework**：`functional`（背景→问题→目标→方案→验收→扩展）为外层，在「方案」节点下挂 `research` 子树（问题→论断→证据→裁决），因为本任务的方案必须由实测事实裁决，不能由偏好决定。
- **选择理由**：R-001~R-008 是产品/机制改造诉求（functional）；「流程开销是否真的超过任务开销」「哪些控制面没有真实 consumer」必须用实测证据裁决（research）。
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；不得另起一份需求清单。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | 背景 / 问题：机制开销与阻塞的真实构成 | open | pending | make-decision（子代理普查） | control-plane census 完成 |
| N-002 | 目标 / 论断：什么算「优雅且长期可维护」 | open | pending | 用户（talk-round-1/2） | 用户答复 |
| N-003 | 方案 / 证据 / 裁决：整改方案的形态与边界 | open | pending | make-decision + build-prd | Talk 收敛 |
| N-004 | 验收 / 扩展：如何证明整改成功且不会二次增殖 | open | pending | 用户 + build-prd | 方案成形 |

## 调研

| source_id | 调研点 | 结论来源 | 结论/证据 | 关联 D |
| --- | --- | --- | --- | --- |
| N-001-a | 「流程开销 > 任务开销」是否成立 | 会话日志实测（postmortem PM:35-36、process doc L103-104） | 成立（推算）：root 主会话 token 461,044,192 / 记录下限 896,744,068 ≈ **51%**；process doc root 4.61 亿 / 任务 8.9 亿 ≈ 52%。注：两文档均未直接给出该比值，此为本任务自行推算，不是原文档结论 | D-001 |
| N-001-b | 控制面总量 | 子代理普查（repo census） | 生产 46,116 行 + 测试 53,981 行；47 个 schema；288 个 validate/assert/check 函数；`runtime/` 1,412 个 `throw new`、97 个大写错误码；`runtime/stage/stage-content-contracts.mjs` 单文件 **6,485 行** | D-002 |
| N-001-c | 「每步完成证据」体系的真实消费 | 子代理普查 | **70/70 个 step 声明 `stage_outcome`**，但一个 stage attempt 只产 1 个 outcome 文件；70 条 `step_outcomes[]` 里**只有 2 条被 runtime 真读**（`stage-runner.mjs:441,509`）；`stage-outcome-proofs/*.json` 实测 168 个/任务，**内容无 reader**（只校验 ref 形状）；单个 outcome 文件约 435 KB | D-003 |
| N-001-d | 无生产 consumer 的持久化对象 | 子代理普查 | `publishVerifySummary` 零生产调用者（`quality-store.mjs:238`）；`index.json.facts[]` 与 `facts.jsonl` 均为 write-only（生产 writer 仅 `stage-runner.mjs:1588` 的 protocol error trace，零生产 reader）；status 的 `status_groups`/`quality_gaps`/`release_gaps` 为 print-only；`quality/stage-reflection/**` 与 `lessons/<stage>.jsonl` **无生产 reader** | D-003/D-004 |
| N-001-e | schema 层是否有效 | 子代理普查 | 47 个 schema 中 **14 个零 `.mjs` 引用**；Ajv 实际只编译 3 个；而最重要的 `workflowhub-stage-outcomes.v1` **没有 schema 文件**，同一校验手写 5 遍（`stage-runner.mjs:626`、`task-kernel-implementation.mjs:262`、`freshness.mjs:416`、`workflow-evolution.mjs:65`、`canonical-evidence-validators.mjs:57`） | D-004 |
| N-001-f | 重复执行 | 子代理普查 | `spec-analyze` 在 4 个 stage 重复同构执行（`stage-content-contracts.mjs:4662-4685`）；`stage-reflection` 在 5 个 stage 重复且产物无生产 reader；`wh-review` 在 build-code **每 Phase 一次** | D-005 |
| N-001-g | 真实硬阻断只剩几类 | 子代理普查 | 仅 3 类：输入协议 `stage-handlers.mjs:364`；**review 轮次预算** `review-record-route.mjs:804-805`；身份/哈希绑定失败。质量缺失本身在任何路径都不阻断同 task 修复 | D-006 |
| N-001-h | 单任务记录体量 | 只读盘点 + 子代理普查 | acceleration store：1,771 文件 / 13 MB；build-prd store：约 3,011 文件；另一真实 store：`quality/evidence/` **14,942 文件 / 151 MB**，task store 170 MB | D-002 |
| N-001-i | 前两次「简化」的净效果 | postmortem PM:10/89-90、root-cause doc L113-124 | close-readiness-governance：+11,337 / −163，net **+11,174**；execution-simplification：+9,063 / −1,024，net **+8,039**。两次都**没有净删除控制面**；结构性条目（DEFER-S3~S7）全部延期 | D-001/D-007 |
| N-001-j | 本次调研文档自身的倾向 | 五份根因/复盘文档抽取 | 五份文档提出的修复方案绝大多数是**新增控制面**：统一 canonical writer、新状态 `completed_with_quality_unavailable`、behavior/governance digest 拆分、executable compiler、`doctor --stage`、`execution-ledger.jsonl`、command fingerprint、contract report。这与本任务目标相反，必须先证伪 | D-007 |
| N-001-k | 宪法自证 | `CONSTITUTION.md:80`（F10 反例）vs 仓库现状 | F10 反例原文为「约 9.5 万行 gate/校验代码（单个 gate 引擎文件 6000+ 行）、33 个 schema……专门长出一套修闸工具箱」。本仓现状：单文件 6,485 行校验引擎 + 47 schema + 1,412 个 `throw` + 18 条 protocol error 白名单 + 自动重发。**宪法写着要避免的形态已经复现** | D-002 |
| N-001-l | 「修闸工具箱」已存在 | 子代理普查 | `protocol-error-whitelist.mjs`（216 行 / 18 条 `class_id`）+ `stage-runner.mjs:2257-2283` 分类后**自动重发一次 `publishStage()`** + `:1563` 落盘 trace；`:2263-2268` 把首次错误挂成 `initial_error` | D-004 |
| N-001-m | 无生产调用者的工具链 | 子代理普查 | 7 个 CLI/工具链合计 **197,422 B**（reflection 页面、consumption edges、evolution result、iteration brief 等）唯一调用者是 tests/ 与 move-map；`runtime/evidence/workflow-evolution.mjs` **1,448 行 / 108,472 B**，生产侧只借用 2 个锁函数 | D-004 |
| N-001-n | 本任务 make-decision 自身踩到的真实机制阻塞（一手实测，非引用） | 本任务 direction-advice 步骤真实执行记录 | 第 1 次：`dispatch_state=blocked_before_dispatch`，`error.code=MATERIAL_FORBIDDEN`（原因：material key `approved_direction` 不在 `runtime/review/stage-materials.json` 的 `make-decision/direction.semantic_fields` allowlist 内），**0 个 provider 被调用**；要修必须先读源码才知道正确 key。第 2 次：`dispatch_state=dispatched`，`error.code=PROTOCOL_INCOMPATIBLE`，`message="managed provider timing is invalid"`（red/blue 两个 role 同错）。两次都发生在「审查本身」这条链上，与任务内容无关 | D-003/D-006 |
| N-001-o | 单任务记录里最大的一类文件 | 只读盘点 acceleration task store | `quality/evidence/stage-outcome-proofs` **423 个文件** —— 是该 store 1052 个 evidence 文件里最大的一类（约 40%），而该类内容**已被普查确认无 reader** | D-003 |

**调研来源边界**：以上结论来自本任务派出的只读子代理普查与用户提供的只读文档；`workflowhub-mechanism-simplification-20260910` 不是这些来源的写入者，也未修改任何被调研文件。

## 三轮 talk

### T-1 Talk round 1（初始方向问题，6 题，用户已答）

| 编号 | 问题 | 用户答复 | 后果 | 风险 | 队列变化 |
| --- | --- | --- | --- | --- | --- |
| Q1 | 减法授权边界：允许删到什么程度 | **A** 允许删活控制面（连同读取者一起简化，允许改阶段/状态对外语义） | 能砍断链条而非末梢；这是唯一能降开销的选项 | 会出现「看起来质量变松」的窗口，须由 Q8 底线兜住 | 无 |
| Q2 | 阶段怎么算做完 | **A** 「材料写完 + 真实跑过一次」即算做完；审查/analyze/复盘不影响阶段结束 | stage 能顺畅结束，不再「活干完但状态永远不完整」 | 完成信号变弱，需要一处集中显示「哪些质量动作没做」 | Q11 部分修正：analyze 与 reflection 保留 |
| Q3 | 质量底线放哪 | **自定义**：「审查还是依赖 wh-review 进行，每个 stage 有不同的审查标准，这个不能改」 | wh-review 保持唯一异源审查入口，per-stage 审查标准不动 | 本项不简化，简化压力转移到审查的「绑定语义」（见 Q8） | 派生 Q8 |
| Q4 | 整改怎么落地 | **A** 先立「减法守卫」，再分批删 | 先立规矩再动手，能挡住「改一次长一层」 | 守卫自身是一行新机制，必须极简（见 R5） | 派生 R5 |
| Q5 | 怎么算成功 | **A** 双证：静态净减法 + 同规模真实任务回归 | 能证伪，能挡住「只是搬家」 | 回归要花一次真实任务的时间，需要合适样本 | 无 |
| Q6 | 历史任务怎么办 | **A** 只读冻结，不迁移、不做兼容桥 | 不会为历史再长一层兼容层 | 老任务在新命令下可能读不出，需明说「历史只读」 | 无 |

### T-2 Talk round 2（收敛问题，6 题，用户已答）

| 编号 | 问题 | 用户答复 | 后果 | 风险 | 队列变化 |
| --- | --- | --- | --- | --- | --- |
| Q7 | 「每步交一份完成证据」体系 | **A** 整体删除每步完成证据；每 stage 只留一份简短执行记录 | 直接砍掉最大的文件与 token 产生源（占总文件数九成以上） | 事后查单步交付的粒度变粗，靠 git 历史 + 测试记录补 | 无 |
| Q8 | 审查结果算不算通关条件 | **A** 五阶段统一：审查必须真发起、结果如实记录，但不作为阶段结束条件 | provider 挂掉不再把整个阶段拖死 | 审查问题靠人把关，材料须显式列出「审了什么/发现什么/哪些没处置」 | 无 |
| Q9 | provider 不可用时怎么算完 | **A + 补充**：「所有 provider 都不可用时，直接子代理执行 wh-review 就可以了，stage 结尾的时候这种降级审查需要说明一下」 | 死循环断掉；降级路径合法且须显式声明 | 降级是同源审查，可能与宪法 Q3「异源」冲突（见 R3） | 派生 R3 |
| Q10 | 改一个字就全部作废 | **A + 补充**：「我希望去掉哈希这件事，不要总是去检查哈希，正常改动是正常的流程，不用总是返工、重审」 | 砍掉最大的重复劳动链（自激反馈环） | 与宪法 F3/F9/Q2 的 fail-loud 可能冲突；需定最小身份底线（见 R1） | 派生 R1 |
| Q11 | spec-analyze ×4 / stage-reflection ×5 | **C** 两者都保留。理由：「analyze 是用来检查任务结果是否符合原始需求，不能遗失。reflection 是用来复盘的，目前每个 stage 都要执行」 | 保留真实的语义检查与复盘 | 在不删除前提下如何不变成纯开销（见 R4） | 派生 R4 |
| Q12 | status 输出怎么给人看 | **A** 只显示根因，不显示派生；同一件事只报一次 | 人一眼看到真正要处理的东西 | 改 status 输出形状会影响现有使用习惯 | 无 |

Talk 轮次状态：round 1 已完成（6/6 实答）；round 2 已完成（6/6 实答）；round 3 待执行（输入须显式包含 direction-advice 的 finding 争议清单）；round 4 仅在出现方向级或影响验收的争议时触发。

### T-3 direction-advice 审查事实（step 6）

| 项 | 值 |
| --- | --- |
| 结果文件 | `/tmp/wh-msd-direction-advice-result.json` |
| 请求 track | `make-decision/direction` |
| provider 放行结果 | **未取得任何 provider finding**（6 次 provider-role 派发，0 findings） |
| 处置 | **降级审查**：`status=available_degraded_same_source_subagent`；由独立子代理在独立上下文按 make-decision direction 审查标准执行。**它不是异源 provider 裁决，不构成宪法 Q3 意义上的异源质量事实**，仅作方向建议输入 |
| finding 数 | 15（R1–R7 待评审项逐条裁决 + A1–A8 审查者自行发现） |

**降级前的真实机制阻塞实录（一手实测，非引用）**

| # | 阶段 | error.code | 事实 | 是否必须读源码才能绕过 |
| --- | --- | --- | --- | --- |
| 1 | before_dispatch | `MATERIAL_FORBIDDEN` | material `approved_direction` 不在 direction track 允许列表内；`dispatch_state=blocked_before_dispatch`，**0 个 provider 被调用** | 是。`skills/wh-review/SKILL.md` 自己的 make-decision 示例就用了这个 key（实为 detail track 的 key），照文档写必然被拒 |
| 2 | before_dispatch | `MATERIAL_FORBIDDEN` | material `direction_constraints` 仍被拒。**仓内同时存在两套形似 allowlist**：`surfaces['make-decision/direction'].semantic_fields`（描述性，9 个 key）与 `stages['make-decision'].tracks.direction.required/optional`（真正强制执行）。按前者构造必被判 unknown | 是。区分二者必须读 preflight 实现 `simple-review-runner.mjs runMaterialAllowlistPreflight` |
| 3 | after_dispatch | `PROTOCOL_INCOMPATIBLE` | `managed provider timing is invalid`；`dispatch_state=dispatched`，6 次 provider-role 派发，0 findings。本地 `review-provider-client.mjs` 的 `validateV3Timing` 要求 `duration_ms === completed_at_ms - started_at_ms`，而 broker 以 v2 形状独立给出三个时序值 | 是。且该层属宿主/broker，调用方无法在不改宿主的前提下绕过 |

`blockers_before_any_provider_contact=2`；`blockers_needing_source_reading_to_discover_correct_key=2`。

**审查者发现且直接指向本方向的结构性缺陷（进入争议清单）**

| id | verdict | severity | 一句话 |
| --- | --- | --- | --- |
| A1 | valid | **blocking** | 「对方向做方向审查」在当前机制下**没有可用表面**：D-A~D-J 与 R1–R7 恰是 detail track 的 required payload，而 direction track 只接受需求+客观事实。修好之前，任何「方向审查已通过」的记录都不成立 |
| A2 | valid | major | 照 wh-review 自己的文档示例发起 review 会被判 `MATERIAL_FORBIDDEN`，且返回体形如「不可用」而非「你发错了 track」——把调用方错误转成运行时阻塞 |
| A3 | valid | major | 「0 个 provider 被派出」与「全部 provider 失败」在 status/outcome/findings 三个字段上完全同形，只有 `dispatch_state` 一个字段区分。若降级判据按「所有 provider 不可用」字面实现，输入协议错误会被误判成 provider 故障，降级条款会成为万能逃生门 |
| A4 | valid | major | 方向内部自相冲突：D-I 要求用这些计量做双证，而 D-G 要删的正是承载这些计量的派生投影 |
| A5 | partially_valid | major | 「机制开销 > 50%」是推算（root 主会话 token / 记录下限），会把任务本身的推理也算进机制开销；口径未定义时 D-I 可靠改分母任意通过 |
| A6 | valid | major | D-A/D-J 措辞未区分「删除读取它的代码」（合法）与「删除已落盘的历史 provenance 字节」（违反本仓治理边界） |
| A7 | valid | major | 替换物「每阶段运行记录」本身是一个新的持久化事实对象，方向未给它 owner / consumer / 完成 oracle / 失败语义 / 退出条件 —— 按 F11 属未登记控制面 |
| A8 | valid | major | provider 确实被派出（6 次），但公开结果里连一个 provider 身份都没留下，失败被折叠成一条组级 `PROTOCOL_INCOMPATIBLE` |

| R1 | partially_valid | major | D-E 把两类不同的「哈希」合并成一件：(a) 编辑后使既有证据失效并触发返工重审的链；(b) 正式写边界的身份绑定。只有 (a) 与宪法无冲突，(b) 是 F3/F9/Q2 明文要求 fail-loud 的 |
| R2 | valid | **blocking** | D-B 把完成声明重新定义为只含「材料 + 一段执行记录」，独立审查从完成谓词里整体消失 —— Q1 不再被违反只因为它要求的东西不再被声明，这是**掏空而非放宽** |
| R3 | valid | major | 子代理满足「独立上下文」但不满足「独立来源」；危险不在降级被允许，而在下游没有任何位置区分降级与异源 |
| R4 | partially_valid | major | reflection×5 是无 reader 的纯开销；spec-analyze×4 的问句是同构的（价值真实但重复真实）；原样保留等于保留 9 次执行而不解决任一缺口 |
| R5 | valid | major | 「减法守卫」按字面实现正是 F11 明文禁止的「为检查是否简单而另造计数器」；且它加在两次净增之后，没有删除预算与 owner，很可能成为第三次净增 |
| R6 | partially_valid | major | 用户否掉的是 followup 方案整体，未逐条裁决；真实缺口不在「新终态状态」这个对象上，而在「质量缺失这件事的表示」上 —— 用字段承接，不要用状态机承接 |
| R7 | valid | major | **硬顺序约束**：D-I 的回归证据正是 D-G 要删掉的派生投影产生的。先删仪器再测量 = 让 D-I 永久不可证伪；删除清单里混进了成功判据的测量工具 |

### T-4 Talk round 3（direction-advice 争议清单，6 题，用户已答）

| 编号 | 争议 | 用户答复 | 后果 | 风险 | 队列变化 |
| --- | --- | --- | --- | --- | --- |
| Q13 | R2 阻塞：审查被移出完成声明 = 掏空 Q1 | **A** 审查仍在完成声明里占位，但只要求「如实写了」：做了 / 不可用（附真实原因）/ 没做（附理由）三选一；结果好坏不作通关条件 | 保住宪法底线又不因 provider 挂掉卡住 | 多三个字段要填 | 采纳审查者 R2 建议 |
| Q14 | R5：「减法守卫」是不是又加一层 | **A** 零新产物：不加工具/schema/检查器/命令，只要求「删了什么、加了什么」写成已有材料（spec/plan）的必填小节，消费者是已有用户确认点，判定用已有 diff；**守卫自身计入第一次改动净增减（自指）** | 加层成本接近零且可证伪 | 靠材料纪律而非机器强制 | 采纳审查者 R5 建议 |
| Q15 | R7/A4/A5：先删仪器再测量 = 不可证伪 | **A + 收紧**：「我不想用真实任务采一份基线，太浪费时间了，你直接基于之前的任务判断基线即可」→ 用已有历史任务数据（acceleration store / build-prd store / 两份 postmortem）定基线，不新跑任务；口径仍须先写死；「>50%」保留「推算」标注 | 成功判据可证伪，且不额外花一次真实任务 | 历史数据口径可能不全，缺口如实标 unknown | 修订 R7 批次 0：从「跑一次真实任务采基线」改为「只读已有历史数据定基线」 |
| Q16 | A1/A2/A3：审查输入契约 | **自定义（否掉我的选项 A）**：「你这个问题我感觉又会新增一大堆对象和语义，提高项目维护成本，根本没必要这么复杂」 | 审查契约整改必须**零新增对象**：只保留「删掉重复的那一套允许名单」「错误提示直接给合法取值」「把已存在的 dispatch_state 显示出来」三类动作 | 不新增降级资格对象，降级判据写成一句规则由现有字段判定 | 派生 grill G1 确认 |
| Q17 | R1：哈希两刀怎么切 | **A** ①失效链全删；②只在「写正式记录」窄口保留**一次**身份核对（任务号 + 工作区路径 + 要写的确切内容），不匹配报错；被连带删掉的「同材料不重复调用审查」去重键须补替代物 | 「不再因哈希返工」完全实现，同时拦住写错任务目录类事故 | 这一层若做胖会慢慢长回原样，须写死只有这几项 | 采纳审查者 R1 建议 |
| Q18 | A7：替换物本身是未登记控制面 | **自定义（否掉新增对象）**：「我不想新增一个对象，请找找看原来是不是就有类似的文件记录这种信息，整个workflowhub任务应该只保留一个文件记录这种信息就可以了。请在task_dir的任务目录里找找」 | 见下方 T-5 只读核查结论 | 复用既有文件需要改它的 schema 与 reader，属于改而非加 | 派生 T-5 |

### T-5 只读核查：task_dir 任务目录里「已有的那个记录文件」（回应 Q18）

只读盘点 `~/Knowledge/Projects/workflowhub/tasks/<task-id>/`（acceleration / build-prd 两个 store）与相关实现，结论：

| 候选 | 现状 | 结论 |
| --- | --- | --- |
| **`facts.jsonl`** | **已经存在**：append-only JSONL，一次运行一行；已有唯一 writer `appendTaskFact`（`runtime/task/task-store.mjs:296`）、已有 store lock（`withStoreLock`）、已有 schema（`runtime/schemas/task-fact.v1.json`）、已有字段校验（`validateFact` `task-store.mjs:287`）。当前**唯一生产写入**是 protocol error trace（`stage-runner.mjs:1588`），**零生产 reader** | **这就是用户要的「一个文件」**。不需要新增对象；需要的是：①去掉 schema 里强制的 3 个 digest 字段（正是 Q17 要删的东西）、补上运行记录需要的字段；②让它真的有 reader（`status` 从它派生）。实测 acceleration store 的 `facts.jsonl` 为 **0 字节** —— 文件被初始化了却从未被真正使用 |
| `task.json` | 任务身份清单（bootstrap 写、只读） | 保留：它不是「执行记录」，是任务身份 |
| `index.json` | `facts` / `quality.reviews` / `quality.tests` / `archives` 四个数组**全为空**，且唯一读点是形状校验（`task-store.mjs:233`），三个 `readTaskIndex` 调用者均不读 `facts` | **删**（纯投影，无功能 consumer） |
| `identity/`（131 个文件） | `identity/executions/*.json`（每次调用身份）+ `identity/path-cards/**`（任务/工作区/操作路径卡） | 属「这次跑了什么」的记录，**折进 `facts.jsonl`** |

**结论**：task 目录最终只需要 **一个执行记录文件** = `facts.jsonl`；`index.json` 删除，`identity/**` 折进去。任务目录顶层只保留 `task.json`（身份）+ `facts.jsonl`（唯一执行记录）+ 被引用的原始证据（测试/审输出，按需，不再是 14,942 个文件）。

### T-6 Grill（frontier 批次，5 题，用户已答）

| 编号 | 轴 | 用户答复 | 结果 |
| --- | --- | --- | --- |
| G1 | 审查契约整改形态 | **A** | 只做四件零新增对象的事：删掉重复的那套允许名单 / 报错直接给合法取值 / 把已存在的 `dispatch_state` 显示出来 / 降级门槛写成一句规则由现有字段判定。不新增状态、不新增资格对象 |
| G2 | 宪法是否同步修订 | **A** | 同步修订：F3 把 `hash` 改为「任务与工作区身份」；F6 去掉「内容校验值」要求；净减法写成 F5/F11 的一句硬规则；同步改 checklist |
| G3 | 后续任务切法 | **A** | 切 3 个后续任务：①②③（删与记录重建）→ ④⑤⑥（语义收敛）→ ⑦⑧（治理同步与验收） |
| G4 | analyze / reflection 的 reader | **A** | 两者都保留执行；spec-analyze 四份检查表合并成一套（每 stage 仍各跑一次）；reflection 结论写进 `facts.jsonl` 的本阶段行并在 status 占一行 |
| G5 | 历史基线取哪几个 | **A** | ①`execution-acceleration-20260909` + ③`execution-simplification` postmortem + ④本任务现场实测为主；②`build-prd` 会话只取重复收据与墙钟数字作补充数据点 |

## 目标

- 目标：把 WorkflowHub 从「每层都加校验」的机制收敛回「薄核心 + 四份材料 + 一个执行记录」的形态，使五个 stage 能顺畅跑完；并让后续任何改动都趋向净减少控制面而不是净增加。

## 成功/失败边界

- 成功边界：①控制面净减法成立（代码行数、每任务记录文件数、无 reader 对象数逐项净下降，并给出具名删除清单）；②用历史基线对照证明「花在任务本身的比例上升、机制阻塞次数下降」；③本任务整改自身的净增减被计入（自指可证伪）。
- 失败边界：任何一项把「删除」替换成「搬家 / 改名 / 加一层统一层」的，判失败。已实测的两次前车之鉴（净增 +11,174 / +8,039 行）即为反面样本。

## 范围

- 当前范围：只做调研、方向确认与路线设计（make-decision → build-prd）；本任务**不实现**任何删除。
- 用户流程/结果只记索引和验收影响，细节进入 spec。

## 非目标

- 不改 wh-review 的 per-stage 审查标准与审查 prompt（用户明确要求保留）。
- 不新增第五份材料、不新增 public command、不新增持久化对象、不新增状态机。
- 不改动已落盘的历史 provenance 字节；历史任务只读冻结。
- 不迁移历史任务、不做兼容桥、不建双写。
- 不在本任务内重写五个 stage 的 SKILL。
- **不产出任何延期项**（用户明确要求：本任务本身就是 PRD 类规划任务）。凡在本仓库范围内可交付的，一律编入 D-018 的批次；凡不在本仓库范围内的，按本节的明确排除处理。
- **宿主 / broker 实现不在本仓库范围内**（OI-023，D-026③）：宿主 lifecycle 与 `requirementAuthentication` 缺口、以及 broker→caller 腿的 `PROTOCOL_INCOMPATIBLE`，属宿主/broker 实现，不是 workflowhub 仓内可交付物。**影响面**：每个任务的 formal stage 事实会稳定显示为 `unavailable`；**这不阻断任何阶段结束**（D-005/D-006）。本任务只如实登记，不修宿主。

### T-7 主会话只读复核补充（为 build-prd 路线准备）

对 D-004 / D-009 的落点做了代码级复核，补充四条必须带进路线的事实：

| # | 事实 | 证据 | 对路线的影响 |
| --- | --- | --- | --- |
| 1 | `identity/**` 不是纯散件：`identity/path-cards/**` 由**写边界预检**（`runtime/evidence/write-boundary-preflight.mjs:139,234`）产出，`identity/executions/**` 由 `runtime/evidence/invocation-identity.mjs:78` 产出；`task-handle.mjs:850` 还校验 path-card 的路径形状 | 上述文件:行 | D-009② 要保留的那次写口身份核对**正是**产出 path-card 的地方。折进 `facts.jsonl` 意味着改预检的写入目标，属「改」不属「删」；任务Ⅰ 必须保证这次核对本身不被削弱 |
| 2 | 删除哈希失效链的落点比预期分散：`isStageSnapshotCurrent`、`evaluateFactFreshness`、`materialRevisionFromValues`、`stageMaterialScopeRevision`、`isMaterialOnlySnapshotDelta` 分散在 `freshness.mjs`、`completion-predicates.mjs`、`stage-runner.mjs`、`review-record-route.mjs`、`stage-agent-outcome-adapter.mjs`、`task-kernel-implementation.mjs`、`canonical-receipt-writer.mjs`、`stage-handlers.mjs` 共 8 个文件 | grep 全仓（生产侧） | 批次 ⑤（删失效链）必须排在批次 ③（记录重建）之后，且要按依赖闭包逐层拆，不能一次删光 |
| 3 | `workflows/build-prd/skill-deps.yaml` 的 `spec-prd` consumer 声明里带 `identity: ["task_id","stage","material_revision","snapshot_tree"]` | `workflows/build-prd/skill-deps.yaml` | D-009① 删 `material_revision`/`snapshot_tree` 会连带影响 build-prd 的依赖声明；本任务下一阶段（build-prd）自身就要用这条声明，须在路线里显式登记为待改点 |
| 4 | `operations/close/**` 每次 close 会写 `plan.json` + `steps/*.json`（5 个动作）+ `confirmation.json` + `completed.json`，是一组独立持久化对象 | `~/Knowledge/.../tasks/<id>/operations/close/**` 只读盘点 | 属「这次跑了什么」的同类信息，应与 `facts.jsonl` 一并收敛；但 close 计划需要事前展示给人确认，可做成一次性展示而非持久对象。列入任务Ⅲ 的治理同步范围 |

### T-8 detail-advice 审查事实与 finding 处置（step 10）

| 项 | 值 |
| --- | --- |
| 结果文件 | `/tmp/wh-msd-detail-advice-result.json`（54,414 B），sha256 `2eb919c91a8bf4cbc23a9b15125283ddd7d370a127e25af45e8817018246d12b` |
| 请求 track | `make-decision/detail`（真实强制三键） |
| provider 放行结果 | **通过**。3 个 provider 完成：`grok/grok` 12 条、`pi/v4flash` 7 条、`antigravity/flash` 3 条，共 **22 条真实 provider finding**；`codex/luna` 失败于 `ATTACHMENT_DELIVERY_UNSUPPORTED`；red 角色到达 broker `state=terminal, outcome=completed` |
| 重要更正 | 前一轮 direction 审查的 `PROTOCOL_INCOMPATIBLE` **未复现** —— 真实 provider 通道是通的，属间歇性失败，不是永久损坏 |
| 未记录证据声明 | CLI 被外层 `timeout 900` 杀死（约 15 分钟），**未写 stdout、未建 sink**，因此**没有 wh-review 正式结果 / receipt / review fact / material_revision 绑定**。22 条 finding 系从 broker 运行树（`/tmp/3rd-review/<run>/managed/public.json` 与 provider session jsonl）恢复的**原始 broker 证据**，属**未记录证据**，不得当作正式质量事实引用 |
| 降级状态 | `degraded_review.status = "not_applicable"` —— 真实通道未失败，写「降级审查」会伪造 provenance |

**finding 处置（每条都必须有处置）**

| id | severity | 处置 | 落到哪 |
| --- | --- | --- | --- |
| detail-1（3 provider 独立同判） | **blocking** | **已修复**：D-005 枚举补 `same_source_degraded`；补「`not_run` 必须附非空理由且 `review_origin` 必须在 status 可见」；D-021 再补一个已实测必要的取值以容纳「已派出但未收齐」 | D-005、D-021 |
| detail-2 | major | **已修复**：D-004 明确 path-cards 可折、`identity/executions` 是 D-009② 写口核对的必需输入，不作纯散件处理 | D-004、T-7#1 |
| detail-3 | **blocking** | **已修复**：D-009 增加修订段——删 snapshot 会断 D-009②；材料哈希同时是去重键/route identity/freshness 输入；去重替代物定为复用 `review_result_ref`（零新对象） | D-009 |
| detail-4 | major | **已修复**：D-009③ 替代物确定为 `review_result_ref`；并标注 D-010 删预算时两套去重不能同时消失 | D-009、D-010 |
| detail-5 | major | **已修复**：D-011 判据改为「下一阶段/人是否真读」，并标注「若为观测再加快回执对象则撞 F11」；spec-analyze 四 profile 本就是一套共享实现 + 4 行数据表，统一会丢 build-code 的 stage 特有检查 | D-011 |
| detail-6 | major | **已修复**：D-018 增加修订段——`index.json` 不是叶子，与 facts 写入同文件、同 try/catch；批次①与②③合并 | D-018 |
| detail-7 | **invalid/major** | **已修复（原方案被否）**：比例算不出；D-015 改用 M1–M4 四个可计算指标（M1 ≈ 20.0% 为记录实际值） | D-015 |
| detail-8 | **blocking** | **已修复（补新增）**：新增 D-020，显式登记 CI 授权表、`check-extensibility` 的 content hash、`core/task-close.mjs` 的 `quality_gaps` 依赖、测试暴露面 | D-020 |
| X1 | major | **已修复**：D-021① | D-021 |
| X2 | major | **已修复**：D-021② 降级门槛收紧为「收到并读取材料之后才失败」 | D-021 |
| X3 | major | **已修复**：D-021③「异源」按底层模型判定；并如实记录本轮 `pi/v4flash` 底层为 `deepseek-flash`、与本审查子代理同模型 | D-021 |

**共享工作区事实（非本任务所为，仅登记 provenance）**：detail 审查运行期间（2026-09-10 19:48:40），主仓 `skills/wh-review/scripts/simple-review-runner.mjs` 与 `tests/review/review-managed-lifecycle.test.mjs` 被**同一共享工作区的其他 agent** 修改（把 `DEFAULT_MANAGED_TERMINAL_WAIT_MS` 从 60 分钟改为 `null`）。本任务未修改主仓任何文件；该次审查运行使用的是**改前**代码，复现时须注意基线漂移。

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": "用户原始需求全程只谈 WorkflowHub 的机制、控制面、stage 流转、质量流程、门禁与可维护性；未提出任何页面、前端交互或视觉设计要求。",
    "project_inventory": "本任务目标对象是仓库的 runtime/tools/skills/workflows 与治理文档；不涉及前端路由、组件或样式系统。仓库内确实存在前端相关技能与 UI 阶段（build-spec 的 UI 设计确认、frontend-component-quality 等），但它们是本任务要评估的机制对象之一，不是本任务的交付界面。",
    "planned_or_changed_frontend_fact": "本任务不实现任何改动；build-prd 阶段的计划路线亦只涉及 runtime/CLI/治理文档与 stage 语义。"
  },
  "note": "三个来源均无 UI 信号，按三输入规则得出 non_ui。若后续 build-prd 的路线里出现需要人看的界面改动（例如 status 输出改版的交互稿），须重新计算本事实。"
}
```

## 收敛检查

| 维度 | 用户实际答复 / 无新需求 | 具体事实或材料引用 | 处置 |
| --- | --- | --- | --- |
| **target（目标）** | 实答：Talk Q1=A、Q2=A、Q4=A、Q5=A、Q6=A；Q3 自定义 | T-1 / T-2 / T-4 / T-6 各行的用户答复原文 | 目标定为「薄核心 + 四份材料 + 一个执行记录」，并按净减法立目标（D-002、D-019） |
| **scope（范围）** | 实答：Q7=A、Q8=A、Q9=A+补充、Q10=A+补充、Q11=C、Q12=A；Q13=A、Q14=A、Q15=A+收紧、Q16 自定义、Q17=A、Q18 自定义；G1–G5 全 A | 同上；Q18 的收紧原文见 T-5 | 范围锁定为「删与收敛」；不新增持久化对象；不改 per-stage 审查标准 |
| **solution（方案）** | 实答：G3=A（切 3 个后续任务）；Q14=A（守卫零新产物 + 自指） | D-004、D-005、D-009、D-013、D-018、D-020、D-021 | 方案 = 复用既有 `facts.jsonl` 作唯一执行记录 + 删失效链保留一次写口身份核对 + 审查解绑但占位 + 零新产物守卫；权衡与备选见各 D 条的 `rejected_alternatives` |
| **acceptance（验收）** | 实答：Q5=A、Q15=A+收紧（不新跑任务，用历史数据定基线） | D-015（M1–M4）、D-020、T-6 G5 | 场景=整改后按批次逐项验收；数据来源=已有历史任务 store 与两份 postmortem + 本任务现场实测；通过条件=静态净减法成立 + M1–M4 逐项不劣化且机制阻塞下降；失败条件=出现「删 A 补 B」的搬家、或净行数为正 |

**方案行的权衡、被否选项、未决项处置**：权衡 = 由「补一层统一 writer / 新状态机」改为「删与复用」；被否选项 = followup 方案（加统一 canonical writer + 新终态 + digest 拆分，R-001）、新建 `runs.jsonl`（Q18）、自动统计控制面的检查器（Q14 选项 C，撞 F11）、全部删哈希不做身份核对（Q17 选项 B，违反 F3/F9）；未决项处置 = 审查者 A1（方向审查无可用表面）与 detail-8（CI 授权表改法）已登记 owner（任务Ⅰ/任务Ⅱ）与触发点（D-008①、D-020①），不静默交给下游。

## 收敛大纲

> 按 main 分支合并进来的 ADR 0025 与 `workflows/make-decision/SKILL.md` 的 OI 契约建立，是本任务「本次必须收敛什么」的唯一清单；与需求框架节点是同一份记录，不新增材料、不建第二状态机。
> `outline_version`: `oi-v1`；`task_id`: `workflowhub-mechanism-simplification-20260910`。
> 当前全部条目为 `open`：本任务的 OI 将在同一轮 `approve-decision` 确认中按主题分组逐条收口，不新增第五处正常确认点。

### 框架节点

| framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- |
| background | OI-001, OI-002 | false | |
| problem | OI-003, OI-004, OI-005, OI-006 | false | |
| goal | OI-007 | false | |
| solution | OI-008, OI-009, OI-010, OI-011, OI-012, OI-013, OI-014, OI-015, OI-016 | false | |
| acceptance | OI-017, OI-018 | false | |
| extension | OI-019, OI-020 | false | |

### 固定类别

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-021, OI-024, OI-026, OI-028 | false | |
| page_scope | | true | 本任务为 `non_ui`：交付物是仓库机制、治理文档与路线设计，用户原始需求与三个输入来源均无页面/交互/视觉诉求（见 `## UI applicability`）。反例边界：若路线中出现需要人操作的新界面（例如 status 改版的交互稿），本行必须改为引用相应 OI 并重算 UI 适用性。 |
| data_state | OI-001, OI-008, OI-013, OI-022, OI-029 | false | |
| success_failure_boundary | OI-004, OI-012, OI-017, OI-018, OI-025, OI-027, OI-030 | false | |
| non_goals | OI-020, OI-023 | false | |
| deferred | | true | **依据 = 用户明确指示**：「我不希望有延期任务，当前任务本身就是prd类规划任务」。该指示直接决定了本任务不产出延期项，因此本类别为空是**指示的结果**，不是对「是否还有该延期的事」的判断。OI-005 问的「三类问题纳入本任务范围还是登记给后续任务」由该指示裁定为**纳入**（见 OI-005 的 selected_disposition），因此不产生 deferred 项。反例边界：若后续出现用户未涵盖、且既不属于已纳入范围也不属于明确排除范围的事项，本行必须改为引用相应 OI，不得以「本任务不产出延期项」为由掩去。 |

### OI 记录

```yaml
ois:
  - oi_id: OI-001
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "用户原始需求 R-003 + 只读基线普查 N-001-a/b/h/i/z"
    question: "机制开销与控制面总量的诊断事实和口径是否成立；净减法拿什么当基准？"
    status: confirmed
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: G1-诊断与问题认定
    selected_disposition: "采信为推算并按 HEAD 实测重建基线口径"
    evidence: "用户 Talk round 4 Q27 答复 + 第 5 轮冗余实测（N-001-z）"
    acceptance: "M1–M5 口径在批次⓪ 写死并可复算"
    counterexample_boundary: "若把推算当实测引用或口径不可复算，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-002
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "main 合并后的复核（N-001-p/u/v/w + control-plane-inventory.json）"
    question: "合并进来的新控制面（outline_closed/convergence_outline/stage-handoff/research-report/execution-outcome/control-plane-inventory）计入后，净减法基准怎么算？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G1-诊断与问题认定
    selected_disposition: "全部计入并作为首批改动的对照面"
    evidence: "用户 Talk round 4 答复 + 第 5 轮冗余实测（N-001-u/v）"
    acceptance: "新增控制面逐项出现在净增减账里"
    counterexample_boundary: "漏记任一新增控制面即视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-003
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "子代理控制面普查 N-001-c/d/e/o + 第 5 轮审计"
    question: "哪些控制面没有真实 consumer、哪些的 consumer 本身就是该被简化的控制面？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G1-诊断与问题认定
    selected_disposition: "以 consumer 为唯一取舍判据：无真实 consumer 即删，consumer 本身该简化则一并简化"
    evidence: "用户 Talk Q1=A、Q18 答复 + D-003/D-004/D-023"
    acceptance: "具名删除清单逐项有 consumer census 证据"
    counterexample_boundary: "保留无 consumer 对象或漏删有证据的无用对象，均视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-004
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "普查 N-001-g + 本任务实测 N-001-n"
    question: "三类真实硬阻断（输入协议/review 轮次预算/身份哈希绑定）删到什么程度，且删完不会让写错任务目录一类事故静默发生？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G1-诊断与问题认定
    selected_disposition: "删预算与哈希失效链；只保留写口一次身份核对（task_id + 工作区路径 + 待写字节）"
    evidence: "用户 Talk Q17=A + D-009/D-010"
    acceptance: "写错任务目录在写入前 fail-loud，且不存在轮次预算阻断"
    counterexample_boundary: "若保留任何自动轮次计数或删除写口核对，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-005
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "第 4/5 轮 8 份文档覆盖审计"
    question: "「一个根因被投影成几十条红字」「没有生产者类缺陷」「开工前无 preflight」这三类问题纳入本任务范围，还是登记给后续任务？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G1-诊断与问题认定
    selected_disposition: "全部纳入：投影归并进 D-012/D-023；没有生产者必须显式报缺（D-027①）；开工前 preflight 编入批次⑨"
    evidence: "用户 Talk Q12=A、Q27 答复 + D-027/D-029"
    acceptance: "三类各有具名条款与批次，且「没有生产者」有显式报缺判据"
    counterexample_boundary: "任一类只被提及而无条款或无批次，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-006
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "detail 审查 R2/R3 + 第 4/5 轮审计"
    question: "完成语义会不会把宪法 Q1「必须真实完成其声明的独立审查」掏空；降级审查与异源审查在下游如何区分？"
    status: confirmed
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: G1-诊断与问题认定
    selected_disposition: "完成行保留审查占位（三态四取值）；降级以 review_origin 显式标注且异源按底层模型判定"
    evidence: "用户 Talk Q13=A、Q9 补充 + D-005/D-007/D-021"
    acceptance: "完成行缺审查字段即完成不成立；降级结果不得写成独立审查已完成"
    counterexample_boundary: "若审查从完成声明消失或降级不可区分，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-007
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "用户 Talk Q1/Q2/Q4/Q5 + D-002/D-019"
    question: "目标形态（薄核心 + 四份材料 + 一个执行记录）与净减法判据是否成立？"
    status: confirmed
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: G1-诊断与问题认定
    selected_disposition: "成立并作为整改目标"
    evidence: "用户 Talk round 1 全部答复 + D-019"
    acceptance: "目标形态可由保留记录清单 K1–K9 + 净减法清单双向核对"
    counterexample_boundary: "若目标形态无法用保留/删除两侧清单核对，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-008
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "用户 Talk Q18 + T-5 只读核查 + D-004/D-017/D-029"
    question: "唯一执行记录是否就定为复用既有 facts.jsonl（删 index.json、identity 折入），并正式改写禁令、写死五要件？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G2-唯一记录与完成语义
    selected_disposition: "定为复用 facts.jsonl；正式改写禁令；按 F11 五要件登记；先删 monitoring-fact.v1 零生产者分支"
    evidence: "用户 Talk Q18 原文 + N-001-q/x/y"
    acceptance: "facts.jsonl 是唯一执行记录文件，且有真 reader 与五要件登记"
    counterexample_boundary: "若新增第二个记录文件或保留 index.json 作为权威，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-009
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "用户 Talk Q2/Q13 + 审查者 R2 + 第 5 轮审计"
    question: "阶段完成那一行到底写什么：只写审查三态，还是必须加「真实跑过哪些命令/测试」与四层状态？"
    status: confirmed
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: G2-唯一记录与完成语义
    selected_disposition: "写四组字段：审查三态 + 真实跑过的命令与退出码 + 四层状态 + 严重问题处置"
    evidence: "用户 Talk Q19=A + D-005 修订"
    acceptance: "四组字段齐备方成立；缺字段即完成不成立"
    counterexample_boundary: "若只有审查三态而无真实执行证据，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-013
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "第 4/5 轮四份审计共同指出的零覆盖项"
    question: "quality/verify.json（HEAD 上已有 kernel publisher 且是完成谓词）与 product-release 投影是收掉还是保留？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G2-唯一记录与完成语义
    selected_disposition: "连对象一起收掉；同批改 completion-predicates 的 verify 谓词与 close 侧依赖"
    evidence: "用户 Talk Q21 原文「我不要什么质量投影」+ N-001-v"
    acceptance: "质量投影对象不再存在，且完成判据不再读 verify.json 字节"
    counterexample_boundary: "若保留任何质量投影对象或留下无 reader 的投影，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-022
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "detail 审查 detail-3/6 + T-7#1 + build-prd 覆盖审计 Q4"
    question: "写坏怎么办：facts.jsonl 写失败/写一半/写后读回的行为定义；写口核对是否写死不再扩张？"
    status: confirmed
    impact_dimensions: [ordinary_detail]
    requires_user_decision: true
    visible_group_id: G2-唯一记录与完成语义
    selected_disposition: "写失败如实记失败且完成不成立、不阻断同 task 修复；写后读回一次；写口核对写死只有三项"
    evidence: "用户 Talk Q22=A + D-029④⑤"
    acceptance: "半提交有明确语义且写口核对项数固定"
    counterexample_boundary: "若半提交被静默忽略或写口核对扩张，视为缺口"
  - oi_id: OI-029
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "full-task postmortem L343 + L244"
    question: "status/close 的读取来源是否收敛为「只读 canonical 输出、不自行扫描旁路目录」？"
    status: confirmed
    impact_dimensions: [ordinary_detail]
    requires_user_decision: true
    visible_group_id: G2-唯一记录与完成语义
    selected_disposition: "收敛，并把来源枚举成具名 ref 集合写进决定"
    evidence: "用户 Talk Q26=A + D-029④"
    acceptance: "status 不再重复扫目录，且来源清单具名可核"
    counterexample_boundary: "若仍有目录扫描或来源未枚举，视为缺口"
  - oi_id: OI-010
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "用户 Talk Q3/Q8/Q20 + 第 4/5 轮审计"
    question: "审查不作通关条件之后，审查频率与「质量完成」这个词的去留怎么定？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G3-审查生命周期
    selected_disposition: "每 Phase 1 次核心审查；废除追零循环；只在大改动时一次 focus；不再有「质量完成」结论，只有如实记录"
    evidence: "用户 Talk Q20 原文 + D-022/D-029③"
    acceptance: "审查次数与去重键元组一致，且不存在追零语义"
    counterexample_boundary: "若保留追零循环或去重键锁死 focus 复审，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-011
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "用户 Talk Q9/Q16 + G1 + D-007/D-008/D-021/D-029"
    question: "审查输入契约是否只做四件零新增对象的事；降级门槛与标注是否定稿？"
    status: confirmed
    impact_dimensions: [ordinary_detail]
    requires_user_decision: true
    visible_group_id: G3-审查生命周期
    selected_disposition: "定稿为四件零新增对象的事；降级门槛为「收到并读取材料后才失败」；修复审查通道（必须修）"
    evidence: "用户 Talk Q16 原文 + D-029⑪⑫⑬⑭"
    acceptance: "审查包交付必需 lens；形似契约由四套收敛；dispatch_state 在聚合面可见"
    counterexample_boundary: "若审查通道修复被降级为登记或形似契约仍并存，视为缺口"
  - oi_id: OI-012
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "用户 Talk Q10/Q17 + G2 + D-009/D-014 + 第 4/5 轮审计"
    question: "哈希/snapshot 失效链全删、只留写口一次身份核对是否维持；删完后「绿灯还算不算数」用什么替代信号？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G4-身份新鲜度与入口
    selected_disposition: "维持全删 + 一次核对；绿灯不自动作废、不自动重跑，兜底交给后续测试/审查/verify-code"
    evidence: "用户 Talk Q22 原文「绿灯有过一次就可以了」+ D-009"
    acceptance: "不存在因编辑自动失效或自动重跑的链路"
    counterexample_boundary: "若任何编辑触发自动失效或重跑，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-026
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: complete_user_flow
    source: "full-task postmortem L17/L191-199/L208/L273/L373/L423"
    question: "所有入口是否统一为 project+task_id → 唯一 config resolver → canonical task path？"
    status: confirmed
    impact_dimensions: [ordinary_detail]
    requires_user_decision: true
    visible_group_id: G4-身份新鲜度与入口
    selected_disposition: "统一；--task-path 降为受控诊断 override 并记录来源"
    evidence: "用户 Talk Q25=A + D-024①"
    acceptance: "入口只有一个路径来源，override 可追溯"
    counterexample_boundary: "若仍存在多源路径解析，视为缺口"
  - oi_id: OI-027
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "full-task postmortem L149/L272/L387/L411"
    question: "任务期间 main 前进怎么办：冻结 base OID + 一次受控 rebase，还是只要求报 stale？"
    status: confirmed
    impact_dimensions: [ordinary_detail]
    requires_user_decision: true
    visible_group_id: G4-身份新鲜度与入口
    selected_disposition: "不冻结；只要求「不许静默用旧快照，必须报 stale」"
    evidence: "用户 Talk Q25=A + D-024②"
    acceptance: "main 变化会在 status 显示 stale，且不引入新状态对象"
    counterexample_boundary: "若静默使用旧快照或新增冻结状态，视为缺口"
  - oi_id: OI-014
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "用户 Talk Q11 + G4 + D-011"
    question: "spec-analyze 四份 profile 合并、reflection 结论写进执行记录——判据「下一阶段是否真读了」如何可观测而不新增回执对象？"
    status: confirmed
    impact_dimensions: [ordinary_detail]
    requires_user_decision: true
    visible_group_id: G5-保留项与展示
    selected_disposition: "合并同构实现；结论写入 facts.jsonl 同一行并在 status 显示；不新增回执对象"
    evidence: "用户 Talk Q11=C + D-011 + N-001-u"
    acceptance: "两者有真实 reader（人 + 下一 stage + status），且无新增回执对象"
    counterexample_boundary: "若为观测再新增回执对象，视为缺口"
  - oi_id: OI-015
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "用户 Talk Q12 + D-012 + D-020③ + 第 5 轮审计"
    question: "status/close 是「只报根因」还是「按层分栏 + 每栏报根因」；core/task-close 的依赖怎么同批改？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G5-保留项与展示
    selected_disposition: "只报根因 + 读取来源固定；close 侧 quality_gaps 依赖同批改（实测 10 处）"
    evidence: "用户 Talk Q12=A + D-023/D-029④"
    acceptance: "同一根因只出现一次，且 close 不同批改动不会坏"
    counterexample_boundary: "若同一根因仍展开成多条或 close 未同批，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-016
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "用户 G2 + D-013/D-014 + build-prd 覆盖审计 Q3"
    question: "宪法 F3/F6 修订与零新产物守卫的最终措辞；close 收口顺序是否纳入而不新增 public command？"
    status: confirmed
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: G6-治理守卫与范围
    selected_disposition: "F3/F6 同步修订；守卫零新产物并补三要件；close 收口顺序提到 commit 前且不新增命令"
    evidence: "用户 G2=A、Q14=A、Q24=A + D-013/D-014/D-025"
    acceptance: "宪法与实现一致；守卫有登记字段/违反后果/自适性；public runtime 仍七类"
    counterexample_boundary: "若宪法未同步或守卫缺任一要件或新增 public command，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-018
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "用户 Talk Q6 + D-016 + 第 4/5 轮审计"
    question: "历史只读边界，以及「必须明确作废」的条目清单如何写死以防 build-prd 反向采纳？"
    status: confirmed
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: G6-治理守卫与范围
    selected_disposition: "历史只读冻结；不采纳清单升级为宪法负向条款 + checklist 对照项"
    evidence: "用户 Talk Q6=A + D-029⑥"
    acceptance: "七类不采纳对象在 CONSTITUTION/checklist 有字，且历史 provenance 字节不被删"
    counterexample_boundary: "若清单只写在 decision-log 或历史字节被删，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-020
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: non_goals
    source: "用户 Talk Q3/Q6/Q16 + 第 4/5 轮审计"
    question: "非目标清单定稿：不改 per-stage 审查标准、不新增对象/命令、不迁移历史、本任务不实现删除；并裁定执行面四条是排除还是纳入"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G6-治理守卫与范围
    selected_disposition: "非目标定稿；执行面四条编入批次⑨（不排除、不延期）"
    evidence: "用户 Talk Q3/Q16/Q27 答复 + 用户「不希望有延期任务」"
    acceptance: "非目标节完整且无延期项"
    counterexample_boundary: "若出现延期项或执行面四条被排除，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-023
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: non_goals
    source: "make-decision-hardening 覆盖审计 B2 + full-task postmortem W4 + 用户要求"
    question: "宿主 lifecycle/requirementAuthentication 缺口与 broker→caller 的 PROTOCOL_INCOMPATIBLE 如何处置？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G6-治理守卫与范围
    selected_disposition: "明确排除出本仓库范围，写明影响面；只如实登记 unavailable，不修宿主"
    evidence: "用户 Talk Q28=A + 用户「不希望有延期任务」+ D-026③"
    acceptance: "非目标节写明理由与影响面；不阻断任何阶段结束；无延期项"
    counterexample_boundary: "若把仓外能力写成延期任务或硬编成仓内任务，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-017
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "用户 Talk Q5/Q15 + detail 审查 7 + D-015 + 第 5 轮审计"
    question: "验收定稿：静态净减法 + M1–M5 历史基线，并补一条「链路真的通」的功能验收；token 与墙钟口径冲突怎么裁？"
    status: confirmed
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: G7-验收与路线
    selected_disposition: "三项验收定稿；M1–M5 用已有历史数据复算；token 维度如实标记为不可得；链路功能验收写成 D-015③"
    evidence: "用户 Talk Q5=A、Q15 收紧 + D-015/D-029⑧"
    acceptance: "三项验收可复算；不可证伪项如实标记为不可证伪"
    counterexample_boundary: "若验收只有计数无链路验证，或不可证伪项被当结论，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-019
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: data_state
    source: "用户 Talk Q4 + G3 + D-018/D-020 + 第 5 轮审计"
    question: "落地切成 3 个后续任务、9 个批次是否成立；每个后续任务的独立终态怎么定？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G7-验收与路线
    selected_disposition: "成立；10 个具名批次（⓪ ① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨，执行序见 D-018）；每批带同文件同批约束与受影响面清单"
    evidence: "用户 G3=A + 第 5 轮 detail 审查 blocking 项 + 用户「不希望有延期任务」"
    acceptance: "9 个批次全部具名且每批可独立跑通；无未编入批次的决定"
    counterexample_boundary: "若任一批次无定义或任一决定未落批次，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-021
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: complete_user_flow
    source: "第 4/5 轮 7 份覆盖审计 + ADR 0025 的完整用户旅程要求"
    question: "整改完成后一个真实任务从 make-decision 到 close 的完整流程；非正式阶段任务按什么收口；close 要求的 prd.md 怎么办？"
    status: confirmed
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: G7-验收与路线
    selected_disposition: "完整流程由保留记录清单 K1–K9 + 10 个批次定义；build-prd 类只保证自己的材料；prd.md 明确永不产出"
    evidence: "用户 Talk Q24=A + D-025②③"
    acceptance: "流程每步有写者/读者/完成判据；non_stage 不被 5 阶段谓词考核"
    counterexample_boundary: "若非正式阶段仍被正式谓词考核或 prd.md 期望未澄清，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-024
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: complete_user_flow
    source: "make-decision-hardening 覆盖审计 A1/A2/A5 + execution-process §8.4/§8.6 + 用户要求"
    question: "慢测试切分、同命令去重、超时保留已完成部分、开工前 preflight 如何编入批次并验收？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G7-验收与路线
    selected_disposition: "编入 D-018 任务Ⅱ 批次⑨并给出四条验收判据"
    evidence: "用户 Talk Q27 答复 + 用户「不希望有延期任务」"
    acceptance: "四条各有可验收判据，且在批次⑨ 内完成"
    counterexample_boundary: "若四条仍为延期项或无验收判据，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-025
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "execution-process 覆盖审计 §13-1（该文件点名必须由用户确认）"
    question: "一张任务卡最多改几个生产文件：只作建议、硬拦截、还是不设数字？"
    status: confirmed
    impact_dimensions: [ordinary_detail]
    requires_user_decision: true
    visible_group_id: G7-验收与路线
    selected_disposition: "只作建议：超 10 个生产文件时 build-plan 必须写明为何必须一起改，但不拦截"
    evidence: "用户 Talk Q27=A"
    acceptance: "不新增卡级硬门；材料里有说明义务"
    counterexample_boundary: "若新增卡级硬拦截，视为缺口"
  - oi_id: OI-028
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: complete_user_flow
    source: "full-task postmortem L133/L145/L266/L306-308/L383/L418（RC-02、§7.2、§10-2）"
    question: "build-code 的任务粒度是否改成「一条 producer→consumer seam = 一个 task，write set 不相交才可同 wave，第一反馈有秒/分钟预算」？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G7-验收与路线
    selected_disposition: "写成 build-prd 材料的必填小节（seam 级切分 + write-set 互斥 + 第一反馈预算），不加硬约束"
    evidence: "用户 Talk Q26=A + D-026④ + 用户「不希望有延期任务」"
    acceptance: "任务粒度作为 build-prd 必填小节产出，可被人核对"
    counterexample_boundary: "若改成硬拦截或完全不要求，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
  - oi_id: OI-030
    task_id: workflowhub-mechanism-simplification-20260910
    outline_version: oi-v1
    category: success_failure_boundary
    source: "用户本会话新增需求 R-013 + 3rd-review 健康检查能力调查（只读子代理）"
    question: "审查进程的失败由谁终止：继续依赖外层 timeout，还是由 3rd-review 的健康检查自动关闭？"
    status: confirmed
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: G3-审查生命周期
    selected_disposition: "由 3rd-review 健康裁决终止：主机制 = manager 心跳过期判死（协议零变更、对全体 provider 有效）；有 probe 的 provider 由 PROCESS_STALLED 接成终态；wh-review 只消费不自造墙钟停滞判定；3rd-review 侧登记为跨仓交付项"
    evidence: "用户原话 R-013 + health-runner.mjs:32,47-56、broker.mjs:139-145,695、config.mjs:38-68、simple-review-runner.mjs:21,443"
    acceptance: "卡死的审查由 3rd-review 自行判死并进入终态；无任何审查需要外层 timeout 才能结束；stalled 有下游映射"
    counterexample_boundary: "若仍依赖外层墙钟终止、或 wh-review 自造停滞判定，视为缺口"
    interaction_ref: quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json
    interaction_hash: 59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab
```

### T-9 Talk round 4（8 份文档覆盖审计后的收敛轮，10 题，用户已答）

| 编号 | 轴 | 用户答复 | 对决定的影响 |
| --- | --- | --- | --- |
| Q19 | 阶段完成那一行写什么 | **A** | D-005 扩展为四字段（审查三态 + 真实跑过的命令与退出码 + 四层状态 + 严重问题处置）；承载位置 = `facts.jsonl` 阶段行，status 从它派生 |
| Q20 | build-code 审查频率 | **B + 关键澄清**：原文「所有代码都开发完成再审查的话，返工成本太大了。虽然每个 phase 都要审查，但是没必要每个 phase 都审查到没有 findings 为止，和其他 stage 的审查一样，**1 次核心审查，如果有大改动再来一次 focus 审查就可以了，没必要改一点点东西就重新审查一次**，审查是帮助找 findings 的流程，**有做过就可以了**」 | **每个 Phase 保留 1 次核心审查**；**废除「追查到 findings 清零」的循环**；只有**大改动**才允许一次 focus 复审。→ 改写 D-009③/D-010 的重试语义：去重键 `review_result_ref` 覆盖的是「本 Phase 本 track 已有 conducted 结果即不再派发」，与「大改动才 focus」一致 |
| Q21 | verify.json 与 release 投影 | **A + 强表态**：原文「我不要什么质量投影，纯纯的流程垃圾，浪费时间和token，产生阻塞和冗余的垃圾设计」 | `quality/verify.json` 与 product-release 投影**一起收掉**；不保留任何「质量投影」对象；与 `core/task-close.mjs` 的 `quality_gaps` 依赖同批改 |
| Q22 | 删完失效链后的替代信号 | **A + 补充**：原文「绿灯有过一次就可以了，后续的测试、审查和verify-code来兜底，不要改一点就变一下」 | **彻底不判**：跑完记一行（命令/退出码/时间点），不因改动自动作废、不要求重跑；兜底交给后续测试、审查与 verify-code |
| Q23 | facts.jsonl 禁令改写 + 链路功能验收 | **A** | 正式改写「不要把 facts.jsonl 补写成第二权威」这条禁令；它成为唯一执行记录并按五要件登记；补一条最小功能验收（写完 → status 立即可读 → 重放不产生重复） |
| Q24 | close 收口链 + build-prd 类收口 | **A** | sidecar 发布 / merge 预检 / 允许清单 / 远端检查提到 commit 之前，**不新增 `close --preflight-only`**；build-prd 类只保证自己的材料与事实，不按 5 个正式阶段谓词收口；`prd.md` 明确永不产出 |
| Q25 | task 路径单一来源 + main 并发 | **A** | 所有入口统一为「项目 + 任务号 → 唯一配置解析 → canonical 任务目录」；`--task-path` 降为受控诊断覆盖并记录来源；main 并发**不冻结 base OID**，只要求「不许静默用旧快照，必须报 stale」 |
| Q26 | status 读取来源 + 任务粒度 | **A** | status/close **只读 canonical 输出、禁止自行扫旁路目录**；任务粒度只写成 build-prd 材料纪律的必填小节，不加硬约束 |
| Q27 | 卡文件数上限 + 执行面四条 | **A，后经用户收紧** | 卡文件数只作**建议**（超 10 个文件必须写明为何必须一起改，但不拦）；执行面四条**原定为延期项，用户随后明确要求「不希望有延期任务，当前任务本身就是prd类规划任务」→ 已改判为编入 D-018 任务Ⅱ 批次⑨** |
| Q28 | 宿主能力缺口 | **A** | 明确定成「本机能力缺口，永久不修、只登记 `unavailable`」，写明理由与影响面，不阻断任何阶段结束 |

**收敛结果**：OI-001~OI-029 全部获得实答；核心项（影响目标/范围/验收）将在 `approve-decision` 的同一轮整体确认中绑定交互凭证后收口，不新增第五处正常确认点。

## 阻塞分析文档覆盖审计（第 4 轮，用户派单）

对用户指定的 7 份文档各派一个独立子代理，按「当前决定 D-001~D-021 + 收敛大纲 OI-001~OI-025」做逐条覆盖判定。**所有子代理均为只读，未修改任何文件。**

| # | 被审文档 | 条目数 | fully | partially | none | contradicted | 一句话结论 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | `workflowhub-build-verify-blocker-root-cause-20260910.md` | 62 | 27 | 27 | 1 | 7 | 覆盖了它「降开销/去重复/按根因报状态/删失效链」的全部方向；净缺口是 `quality/verify.json` 与两条量级决定 |
| 2 | `workflowhub-followup-tasks-20260910.md` | 59 | 6 | 27 | 6 | 11（+9 superseded） | 整体已被 R-001 否；它指出的最大真实断点（`verify.json` 无人认领）至今无决定接住 |
| 3 | `阻塞分析/workflowhub-task-execution-root-cause-audit-20260910.md`（最新） | 47 | 7 | 7 | 33 | 8 | 与当前决定只对齐 14%，**是另一条整改路线的完整主张**；8 处方向级冲突 |
| 4 | `阻塞分析/workflowhub-task-execution-process-root-cause-and-optimization-20260910.md` | 44 | 12 | 21 | 5 | 6 | 目标层同向、机制层系统性互斥；十条优化里**删除类 0 条、净增控制面 6 条**；§13 四项无一项被正面处理 |
| 5 | `阻塞分析/workflowhub-build-prd-session-retrospective-2026-09-10.md` | 84 | 13 | 36 | 30 | 5 | 抓住了两条主干，**完全没承接第三条主干「收口与交付链」**（close preflight / 测试验收回执 / 开工前 preflight 共 30 条零对应） |
| 6 | `阻塞分析/workflowhub-task-C-...-gap-audit-20260910.md` | 34 | 8 | 17 | 7 | 2（+8 新增控制面） | 症状在射程内，**药方多数是把审计语言固化成新对象**；完全没写的只有「没有生产者」与「验收侧死锁」两类 |
| 7 | `阻塞分析/workflowhub-workflowhub-make-decision-hardening-...-audit-20260910.md` | 15+15+10 | — | — | — | — | 审计对象其实是该任务的 build-code 执行；13 条结构性问题中 3 条已被该任务自己修掉、2 条被删除路线吸收、**8 条完全未覆盖**（其中 3 条与减法目标正交的执行面） |
| 8 | `阻塞分析/workflowhub-full-task-execution-postmortem-20260910.md`（用户后补，22:11） | 98 | 12 | 47 | 15 | 24 | 8 份里唯一给出「四层状态分离 + 任务粒度 + 主分支并发」三块新主张；§9「不应采取」7 条与当前决定高度同向，但 §7/§8 药方仍是「新增统一 writer / 编译产物 / 预算 / 依赖闭包缓存」；**需新增 4 条 OI（OI-026~OI-029）** |

**跨 7 份的收敛结论**

- **多数审计的药方是「加一层」，与本任务方向相反**：统一 canonical writer、新终态状态机、digest 分层、executable compiler、contract report、command fingerprint、`doctor --stage`、`execution-ledger.jsonl`、provider preflight、统一读回链。这些与 R-001/Q14/Q16/Q18 的用户答复直接冲突，**须在路线里显式标注为「已裁定不采纳」以防 build-prd 反向采纳**（OI-018）。
- **真正无人认领的净缺口收敛为 7 条**：①`quality/verify.json` 与 release 投影的归属（OI-013）；②完成判据缺「真实跑过一次」与「物理完成/质量完成」分栏（OI-009）；③build-code 审查频率零覆盖（OI-010）；④close 收口链 8 步与 build-prd 类非正式阶段的收口语义（OI-021）；⑤验收只有指标计数、没有「链路真的通」的功能验收（OI-017）；⑥宿主 lifecycle / requirementAuthentication 缺口无 owner（OI-023）；⑦`facts.jsonl` 从「闲置文件」变「唯一执行记录」与 followup §5-5 禁令冲突，需正式改写（OI-008）。
- **一处材料内部不自洽（须修）**：D-010 删 review 预算**未落进 D-018 任何批次**，而 D-009 修订③ 要求「去重替代物先落地、两套去重不能同时消失」。→ 已在 D-010 补记批次归属（见下）。
- **一处事实已因 merge 过期（须更正）**：见 N-001-p。
- **第 8 份文档追加的净缺口（须补进路线）**：①`index.json` 的**写侧**连带面未登记 —— 除 D-018③ 已承认的读侧读者与 `appendTaskFact` 同 try/catch 外，还有 `runtime/evidence/quality-store.mjs:216-240 publishQualityFact` 与 `runtime/task/task-kernel-implementation.mjs:810-815`（后者自带 read-back `:807`）；批次③ 删 `index.json` 会在质量发布路径半路炸。②task path / canonical handle 无任何 OI（新 OI-026）。③main 并发零覆盖（新 OI-027）。④status 的**读取来源**未定（新 OI-029）。⑤任务粒度未定（新 OI-028）。

| source_id | 更正后的调研事实 | 来源 | 关联 |
| --- | --- | --- | --- |
| N-001-p | **N-001-d 部分过期**：main 合并（`216a546d`）后 `quality/verify.json` **已有真 publisher** —— `runtime/task/task-kernel-implementation.mjs:742 publishVerifySummary` 在 `tools/cli/stage-runtime.mjs:961` 的 run 路径被调用并更新 index；且 `runtime/evidence/quality-store.mjs:239` **已补上 canonical-root guard**。因此「零生产调用者 / 无 guard 的第二 writer」这两条在 HEAD 上**已不成立**；仍成立的只有「`quality-store.mjs:238` 那个同名函数零生产调用者（仅 tests）」。同理 `appendTaskFact` 的生产调用点已由 `stage-runner.mjs:1588` 移到 `:1804`。→ 批次①的删除清单与所有引用旧行号的证据必须按 HEAD 重核 | 第 4 轮子代理在 `216a546d` 上的只读实测 | OI-013、D-018① |
| N-001-q | `core/task-close.mjs:19` 只 `import readTaskFacts`、**零调用点**（在 `35136234` 与 `216a546d` 上均如此）→ N-001-d 的「零生产 reader」结论成立，但**「给它装 reader」是新建工作，不是「文件本来就在用」**，批次③的工作量须按新建计 | 同上 | OI-008、D-018③ |
| N-001-r | **N-001-p 再收紧**：`runtime/task/task-kernel-implementation.mjs:756-766` 的 verify publisher 只派生 `passed/failed/incomplete` 且要求 criteria 与 spec 的 AC 完全一致；而真实 store（`_noncanonical-archive-…-20260820`）的 `quality/verify.json` **仍是初始化形状**（`ac_id=task-store-initialization` / `status=unknown`）→ 「已有真 publisher」在**真实任务上从未产出过**。结论：`quality/verify.json` 至今没有任何一次真实产出，其归属仍是零覆盖（→ OI-013） | full-task postmortem 子代理在 HEAD 上的只读复核 | OI-013 |
| N-001-s | `index.json` 的**写侧**连带面比 D-018③ 已承认的更多：除 `appendTaskFact`（同 try/catch）与读侧 `quality-store.mjs:84,223,248`、`task-kernel-implementation.mjs:801,818` 外，还有 `runtime/evidence/quality-store.mjs:216-240 publishQualityFact` 与 `runtime/task/task-kernel-implementation.mjs:810-815`（后者自带 read-back）。→ 批次③ 删 `index.json` 必须在同一批处理这四处写入者，否则会在质量发布路径半路失败 | 同上 | D-018③、OI-008 |
| N-001-t | `docs/standard-workflow.md:377-383` **已经写好**四层状态读法（implementation / stage quality / Git delivery / task close，含「任何一层的绿色事实都不能覆盖另一层」）；full-task postmortem 的 §1/L34 与 §7.6 只是**引用**它并加成验收项。→ OI-009 的答案一半早在仓库规范里，缺的只是**承载位置**与 reader | 同上 | OI-009、OI-015 |

## 保留记录清单（回应 R-007「记录该记录的」）

> 第 5 轮独立覆盖审查指出：方案只列了**删除侧**，没有**保留侧**清单，而用户要的是「记录该记录的」，不是「尽量少记」。本节是保留侧的唯一清单；与 `## 决定` 里的删除清单成对使用。

### 必留（阶段完成与下游消费依赖它）

| # | 记录 | 承载位置 | 谁写 | 谁读 | 保留期 |
| --- | --- | --- | --- | --- | --- |
| K1 | 任务身份 | `<task_dir>/<task-id>/task.json` | `task-bootstrap` | 所有入口的写边界核对 | 永久（只读） |
| K2 | **阶段执行记录行**：审查三态 + 真实跑过的命令与退出码 + 四层状态 + 严重问题处置 | `<task_dir>/<task-id>/facts.jsonl`（唯一执行记录文件） | 该 stage 主会话（经写口核对） | 下一 stage、status 根因行、Talk 输入、close | 永久（append-only，只读） |
| K3 | 四份材料 | worktree `specs/<task-id>/{decision-log,spec,plan,tasks}.md` | 各 stage | 人 + 下游 stage | 永久，随任务归档 |
| K4 | 人确认与不可逆授权 | 现有 `quality/confirmations/` 与 `quality/authorizations/`（**保留**，不属被删的「质量投影」） | `task-kernel` | 完成判据的凭证核对、close 授权 | 永久（只读） |
| K5 | 被引用的原始证据（测试输出、审查原始结果） | 现有证据目录，**按引用存在**（不再是 14,942 个自证文件） | 命令/审查 | 人复核、验尸、回归对照 | 随任务，只读 |

### 该留但落点未定（第 5 轮审查的四条，必须在本阶段定死）

| # | 记录 | 现状问题 | 本轮处置 |
| --- | --- | --- | --- |
| K6 | spec-analyze 结论 | D-011① 只说「四份 profile 合并成一套」，未说产物落哪 | **写入 K2 的同一行**（`spec_analyze` 字段），不新建文件 |
| K7 | wh-review 正式结果 / receipt / review fact | 删掉 `material_revision` 绑定后绑什么未定 | **保留审查原始结果文件**（K5），K2 行只记 `review_origin` + `review_result_ref`；不再有 receipt/review fact 三件套 |
| K8 | close 动作记录 | T-7#4 说「应与 facts.jsonl 一并收敛」，但 D-018 任务Ⅲ 未列 | **写入 K2**（close 的五个物理动作各记一行的结果）；`operations/close/**` 的多文件计划对象收掉，计划改为一次性展示。已同步进 D-018 任务Ⅲ |
| K9 | 测试记录 | D-003 说「靠 git 历史 + 测试记录补」，但写者/读者未定 | **按引用进 K5**（原始输出），K2 行记命令 + 退出码；不新建测试记录对象 |

### 明确不留（删除侧，与 `## 决定` 各 D 一致）

每步完成证据 / `stage-outcome-proofs` / 单步 `stage_outcome` / `quality/facts/**` / `index.json` / `quality/verify.json` / product-release 投影 / review attempt-result-report 三件套 / `snapshot tree` 与 `material revision` / `identity/**`（折入 K2）/ `operations/close/**` 多文件计划 / 14 个零引用 schema / 无调用者工具链 / `workflow-evolution.mjs` / protocol-error 白名单与自动重发 / `stage-reflection` 独立产物（结论进 K2）。

## R-008 点名对象族处置（逐对象收口）

> 用户原始需求 R-008 逐字点名了这一串对象。第 5 轮审查指出：16 个对象里 6 个没有具名落点，且 R-008 在需求表里当时仍标「待处理」（**现已回填**，见 `## 原始需求` 表）。本节逐个收口。

| 对象 | 处置 | 承接 | 回应点名原因 |
| --- | --- | --- | --- |
| **producer** | **本轮新增处置（D-027①）**：删除「每步 producer」；保留的唯一 producer 是「该 stage 主会话写 K2 那一行」。**「没有生产者」类缺陷必须显式报缺，不许静默**（此前无任何条款） | D-003、D-027① | 是：producer 断链正是孤儿证据的成因 |
| **schema** | 删 14 个零引用 schema；`task-fact.v1.json` 去掉 3 个强制 digest 字段；`workflowhub-stage-outcomes.v1` 那 5 遍手写校验随 D-003 删除对象一并消失 | D-018①、D-018③、D-004 | 是：schema 层既不是契约也不是文档 |
| **writer** | 唯一 writer = 写 K2 那一行；`index.json` 的全部写入者（含 N-001-s 列出的 4 处）同批处理 | D-004、D-018③、N-001-s | 是 |
| **consumer** | 保留为唯一取舍判据：「没有真实 consumer 就删」（D-011③、D-023①） | OI-003、D-011③、D-023① | 是 |
| **quality** | 解除通关角色（D-006）+ 质量投影连对象收掉（D-023①）。**体量面目标本轮补入 D-015（M1–M5）** | D-006、D-023、D-015 | 是 |
| **product_release** | 连对象收掉（含 `deriveProductRelease` / release reasons） | D-023①、D-020③ | 是 |
| **canonical** | 「统一 canonical writer」明确作废；「canonical 作为唯一读取来源」保留并强化（D-023③）。`canonical-evidence-validators.mjs` / `canonical-receipt-writer.mjs` 的**存活部分随其消费对象一起重新界定**（D-027③） | OI-018、D-023③、D-027③ | 是 |
| **证据链** | 删两条子链（每步证据、哈希失效链）；保留链 = K5 原始证据 + K2 引用。**保留侧形态/读者/保留期已在保留清单 K1–K9 定死** | D-003、D-009、D-023②、保留清单 | 是 |
| **review / snapshot / retry** | review：保留能力与 per-stage 标准，删通关语义与追零循环，改输入契约（D-006/007/008/021/022）。snapshot：删（D-009）。retry：删轮次预算（D-010）+ 删追零（D-022②）+ **发布自动重发（修闸工具箱）本轮补删（D-027②）** | 同左 + D-027② | 是 |
| **runner** | **本轮新增处置（D-027③）**：`stage-runner.mjs` 与 6,485 行 `stage-content-contracts.mjs` 是「gate 引擎」本体，必须给出**减法落点**（随被删对象收缩，不整体重写） | D-027③、D-018 | 是（此前完全未作为对象处置） |
| **validator** | **本轮新增处置（D-027③）**：288 个 validate/assert/check + 1,412 个 `throw` + 97 个错误码给出**族级目标**：随被删对象消失的校验一并删除，不得保留「为已删对象服务的校验」 | D-027③、D-002 | 是（此前只删了个别函数） |
| **currentness** | 删；并在 OI-018 的「必须明确作废」清单正文里写死 | D-009①、OI-018 | 是 |
| **task-store** | 改造：「删 index.json + 改 facts 字段 + 给 reader」同批 | D-004、D-018③、N-001-q/s | 是 |
| **outcome** | 每步 outcome 删；**阶段级 outcome 对象本轮补入删除清单（D-027③）**，其作用由 K2 行承接 | D-003、D-027③ | 是（此前阶段级未处置） |

## 阻塞分类学与防护（回应 R-006「未来不要再出现类似阻塞」）

> 第 5 轮审查：R-006 是用户给出的**目标状态**，但方案只有「已知几例」的枚举，没有分类学；且 **E 编排/上下文类（5 条）在 D/OI 层面零防护**，F 工程/测试类 8 条只有 1 条有防护。本节按类型给出防护与 owner。

| 类型 | 该类的阻塞 | 防护落在哪 | owner | 本轮状态 |
| --- | --- | --- | --- | --- |
| 事实/状态类 | 写不进 / 读不到 / 状态空 / 投影不一致 / 半提交 / conflict→missing | 唯一执行记录（D-004）+ 读取来源固定（D-023③）+ 半提交与冲突语义（**新增 D-027④⑤**） | 任务Ⅰ/Ⅱ | **本轮补全** |
| 门禁/流程类 | gate、谓词、确认点、预算、绑定校验 | 五阶段审查解绑（D-006）+ 删预算（D-010）+ 删追零（D-022）+ 守卫（D-013/D-014） | 任务Ⅱ/Ⅲ | 已覆盖 |
| 依赖外部类 | provider / 宿主 / 测试环境 | 降级路径与门槛（D-007/D-021）+ 宿主/broker 能力**明确排除出仓范围**（D-026③，按 `non_goals` 登记并写明影响面）+ provider 生命周期**编入批次⑨**（D-026② 修订） | 任务Ⅱ | **已覆盖（无延期项）** |
| 新鲜度/身份类 | hash、snapshot、currentness、重绑定 | 两刀切（D-009）+ 入口单一来源（D-024①）+ main stale（D-024②） | 任务Ⅱ | 已覆盖 |
| **编排/上下文类** | 主会话爆上下文、子代理职责不清、轮询等待、handoff 误扫、串行无 wave | **本轮新增 D-027⑥**：把「主会话只收摘要」变成**可核对的产出纪律**（写进 build-prd 材料必填小节）+ handoff 读取面定界 | 任务Ⅲ + build-prd | **本轮首次给出防护** |
| **工程/测试类** | 慢测试、重复执行、超时丢结果、packet 过大、CLI 不自描述 | **本轮新增 D-027⑦**（packet 体积与 compact projection，零新对象）+ **其余四条编入 D-018 任务Ⅱ 批次⑨（不再延期，带四条验收判据）** | 任务Ⅱ | **已覆盖（无延期项）** |
| 交付/收口类 | close、merge、sidecar、路径 | close 前置（D-025①）+ non_stage 收口（D-025②③）+ close 记录（保留清单 K8） | 任务Ⅲ | 已覆盖 |
| 治理/增殖类 | 新对象、新 schema、新命令、维护成本 | 零新产物守卫（D-013）+ 宪法同步（D-014）+ 防反向采纳（OI-018）+ **守卫三要件（D-013 修订）** | 任务Ⅲ | **本轮补全三要件** |

**分类学的常驻规则（新增，写进 D-014 的宪法修订）**：任何新登记的阻塞必须**先归入上表八类之一**，并在同一处登记该类对应的防护与 owner；归不进任何一类的，必须先扩表再登记——防止「一次性枚举」再次成为唯一形态。

## 第 5 轮独立复核（原始需求覆盖 + 8 份文档去重 + 冗余实测）

三份独立子代理复核（只读）的结论与**必须的更正**。第三份（冗余实测）在 HEAD `216a546d` 上重测了方案的删除清单与全部引用数字。

### 覆盖度结论

| 复核 | 口径 | 结果 |
| --- | --- | --- |
| 原始需求覆盖 | R-001~R-012 + R-008 点名的 16 个对象 | 覆盖约 **75%**；原缺 3 处（R-008 无逐对象处置、无保留记录清单、无阻塞分类学）→ **已由本轮新增的 `## 保留记录清单`、`## R-008 点名对象族处置`、`## 阻塞分类学与防护`、D-027 补全** |
| 8 份文档去重 | 468 条原始 → **59 条去重** | addressed 32 / partially 20 / **not_addressed 4** / rejected 3；**E 编排/上下文类 5 条 0 addressed**（整类零防护）、F 工程/测试类 8 条仅 1 addressed → **4 条零防护由 D-027 补全，E 类首次给出防护** |
| 冗余实测 | 删除清单逐项复核 + 净减法数字重测 | 约 **80% 条目仍成立**，**3 处结论已失效**、**C 组 7 个数字里 5 个不可复现或已漂移**、**漏掉 9 类真实冗余** → 见下 |

### 已失效的结论（必须更正，否则 build-prd 会照旧施工）

| source_id | 更正 | 证据 | 影响 |
| --- | --- | --- | --- |
| N-001-u | **「`quality/stage-reflection/**` 无生产 reader」在 HEAD 上已失效** —— 合并带入的新消费面：`runtime/stage/stage-handoff.mjs:305` 经 `readRecord` 真读，入口 `stage-runner.mjs:1109 publishStageHandoff`。→ D-011② 的「给它一个 reader」不再是新建工作，而是**已经存在**；改法是让 K2 行与 handoff 保持一致，不是再找 reader | 冗余实测子代理在 `216a546d` | D-011、OI-014 |
| N-001-v | **`quality/verify.json` 是 verify-code 的完成谓词**（`runtime/stage/completion-predicates.mjs:1124-1132`），不只是「有 publisher 但没产出」。→ D-023① 删它**必须同批改这个谓词**，否则 verify-code 完成判据半路炸；此前 D-023 只提了 `core/task-close.mjs` | 同上 | D-023①、D-020③ |
| N-001-w | `index.json` 实测 **5 个写点 / 6 个读点**（N-001-s 只列了 4 个写者）：补 `runtime/evidence/quality-store.mjs:236`（`replaceTaskIndex`）与 `runtime/task/task-kernel-implementation.mjs:815-818`（完整写回） | 同上 | D-018③、N-001-s |
| N-001-x | **T-5「`facts.jsonl` 已有 schema」是假象**：`runtime/schemas/task-fact.v1.json` **从未被加载**（全仓唯一引用是 inventory 文档），真正的校验是 `runtime/task/task-store.mjs:287-294` **手写**，硬要求 3 个 digest（`:291`）。→ 应改为「去掉 `validateFact` 里的 3 个 digest 强制」，并删除这个零引用 schema 文件；批次③工作量须按**手写校验改写**计 | 同上 | T-5、D-004、D-018③ |
| N-001-y | **`facts.jsonl` 里还有第二套零生产者语义**：`monitoring-fact.v1` 分支（`task-store.mjs:147-196`，32 行手写校验 + 约 10 个常量集），**全仓零 writer**。→ 不先删它，新 reader 会面对两种形状，等于在「唯一记录」里再造一个双写分歧点 | 同上 | D-004、OI-008 |
| N-001-z | **净减法数字在 HEAD 上重测**（方案值 → HEAD 实测）：生产行数 46,116 → **48,532**；测试 53,981 → **57,070**；`runtime/` `throw new` 1,412 → **1,476**；`stage-content-contracts.mjs` 6,485 → **6,806**；schema 47 → **45**；validate/assert/check 288 → **301**（基线实测 294，**288 在基线也不成立**）；大写错误码 97 → **117**。仍成立：零引用 schema **14 个**、`workflow-evolution.mjs` 1,448 行、`protocol-error-whitelist.mjs` 216 行/18 class_id。另：`protocol-error-whitelist.mjs` 在 `runtime/stage/` **不是** `runtime/evidence/`；自动重发块在 `stage-runner.mjs:2498-2507`（方案写 `:2257-2283`）；review 预算执行点漂到 `review-record-route.mjs:886-893` 且**有第二个消费点** `stage-handlers.mjs:2338-2343` | 同上 | D-002、D-015 M5、D-010、D-018 |

### 方案漏掉的冗余（9 类，全部补入删除清单）

| # | 冗余 | 证据 | 体量 |
| --- | --- | --- | --- |
| R1 | `runtime/evidence/` 的零 importer 死模块：`requirement-ledger.mjs`、`receipt-schema.mjs`、`audit-summary-carrier.mjs`、`boundary-confirm.mjs`、`capability-doctor.mjs`、`text-utils.mjs` 等 | 全模块零生产 import，仅 inventory / move-map 登记 | 8 文件 / 1,416 行 / 27,018 B |
| R2 | **34 个死导出**（名字含 validate/assert/check/publish/record/derive），其中 `stage-content-contracts.mjs` 一个文件占 7 个 | 符号名在自身文件其余部分与全部其他生产文件中均不出现 | 约 1,200+ 行 |
| R3 | `tools/cli/` 与 `tools/architecture/` 的零调用者工具：方案漏了 `check-contract.mjs`、`check-metrics-schema.mjs`（互引闭环）、`verify-final-coverage.mjs`、`retention-audit.mjs`、`phase0-deletion-disposition.mjs`、`scripts/{dead-code-scan,dual-track-evaluate,constitution-mapping-check}.mjs`、`workflows/_spike/*`、`skills/wh-review/scripts/lib/safe-id.mjs` | 全仓零外部调用者 | 16 个 / 约 71,000 B |
| R4 | `runtime/task/task-index.mjs` 整文件死（4 个导出） | 唯一 importer 是测试 | 与 `index.json` 同批删 |
| R5 | **`workflows/verify-code/*.mjs` 4 个文件未被任何生产代码 import**（freshness 373 / design-alignment 443 / facts-assembly 59 / metrics-writer 25） | `stage-runtime.mjs:26` 只 import `capture.mjs` | 4 文件 / 900 行 |
| R6 | **重复实现**：`publishQualityFact` 两份不同签名（活 `quality-fact.mjs:73` / 死 `quality-store.mjs:216`）；`STAGE_REFLECTION_REF` 正则 **4 份**；`CLOSE_PLAN_REF` **2 份**；stage-outcome 形状校验手写 **≥5 处**；`/^[a-f0-9]{64}$/` 在 **48 个生产文件位置**重复 | 逐处 `文件:行` | 常量合并到 1 处 |
| R7 | **`check-task-record-paths.mjs` 有 4 张硬编码授权表，不是 2 张**（`STAGES` / `RUNTIME_SIDECARS_AND_HELPERS` / `FIXTURE_ALLOWLIST` / `GLOBAL_IDENTITY_DISCOVERY_ALLOWLIST` / `FORBIDDEN_PATTERNS`） | `tools/cli/check-task-record-paths.mjs:14,22,35,136,145` | 更正 D-020① |
| R8 | **治理文档自相矛盾**：`AGENTS.md:37` 与 `CLAUDE.md:23` 指向**不存在**的顶层 `schemas/`；`docs/audit-contracts.md:5` 把两个零引用死 schema 称为「唯一拓扑权威」；**`package.json:24-26` 的 `npm test` 就是全量回归，与 `AGENTS.md`「禁止全量回归」硬规则直接冲突** | 逐处 `文件:行` | 同批修正，属 D-014 治理同步范围 |
| R9 | `core/task-close.mjs` 的 `quality_gaps` 实测 **10 处**（不是 8 处）；`tools/host/workflowhub-stage-agent-bridge.mjs`（594 行）+ `workflowhub-stage-agent-protocol.mjs` 是治理边界的唯一实现却**完全未登记** | 逐处 `文件:行` | 更正 D-020③；bridge 补登记 |

### 方案实施后仍然存在的最大维护负担（必须记入路线）

| # | 负担 | 事实 |
| --- | --- | --- |
| Z1 | **`stage-content-contracts.mjs` 删完仍是 6,806 行 / 365,862 B** | 方案只删它的 7 个死导出，主体不动 → `CONSTITUTION.md:80` 的 F10 反例（单个 gate 引擎 6000+ 行）**在整改后仍然成立** |
| Z2 | `runtime/stage/` 三个巨人不动：`stage-handlers.mjs` 3,956 行、`stage-runner.mjs` 3,161 行、`completion-predicates.mjs` 1,259 行 | 方案删的是它们**消费的对象**，不是它们本身 |
| Z3 | 常量与校验的重复未列入任何批次（R6） | 删哈希失效链只删「调用点」，48 处内联正则会留下继续漂移 |
| Z4 | `facts.jsonl` 的 reader 是**新建**不是复用 | 批次③实际工作量 = 写新 reader + 改手写校验 + 删 5 个 index 写点，是本路线最重的一批 |
| Z5 | `stage-reflection` 成为 handoff 的输入后，`stage-handoff.mjs:291-330` 同一段代码里**同时有** D-009① 要删的哈希链与 D-009② 要保留的写口核对 | 方案把它们分成批次④/⑤，但代码在同一处 → 必须同批 |

### T-10 第 5 轮真实 provider 细节审查（make-decision/detail）与处置

| 项 | 值 |
| --- | --- |
| 请求 | stage=make-decision，track=detail，host_provider=pi/v4flash；material_id `73c8ffb5…`；provider_input ≈180 KB |
| 真实通道结果 | **`status=unavailable`，`error.code=PROTOCOL_INCOMPATIBLE`，`message="managed provider timing is invalid"`；red 与 blue 两 role 同错；`provider_results=[]`**；CLI 退出码 0；23:06:42 → 23:43（≈37 分钟） |
| broker 侧真实往返 | red：antigravity completed（127,796 ms / 6 findings）、grok **failed `PROVIDER_HEALTH_FAILED` 2,235,659 ms（≈37 分钟）**、codex failed `ATTACHMENT_DELIVERY_UNSUPPORTED`、pi 同源排除；blue：antigravity completed（135,768 ms / 7）、grok completed（1,141,890 ms / 0）、codex failed 同上。**broker→provider 腿健康，broker→caller 腿稳定失败** |
| 降级判定 | `available_degraded_same_source_subagent`（provider 确已收到并读取材料：manifest `byte_identity=verified`，antigravity 两次产出真实 findings） |
| 结果文件 | `/tmp/wh-msd-r2-detail-review-report.md`（sha256 `1322c127…`）；13 条 provider finding 属**未记录证据**（`/tmp/wh-msd-r2-recovered-broker-findings.json`），不得当已记录审查事实引用 |

**重要更正**：T-8 曾写「`PROTOCOL_INCOMPATIBLE` 未复现、属间歇性失败」——**本轮在 red+blue 两个 role 同时复现且 `provider_results=[]`，该更正不成立**。真实情况是：provider 腿健康、caller 腿稳定失败。→ D-021④ 由「登记」**升级为「必须修」**（见 D-029）。

**八项裁决与处置**

| # | 裁决 | severity | 问题 | 处置 |
| --- | --- | --- | --- | --- |
| 1 | partially_valid | **blocking** | D-005 四字段可写，但 ③ 四层状态今天由 status 自己派生（`stage-runtime.mjs:700-772`），回写进 status 的输入文件 = 自指；`facts.jsonl` 是**精确键集封闭 record**（`task-store.mjs:9` 十键 + `:287` 全等校验），四组字段必扩到 25+ 键 | **D-029①**：写死四层状态的计算者与时机（禁止 stage 自算自写）；命令组限定「真实执行过的外部命令」，纯设计阶段允许显式 `none`；给事实行字段数上限与嵌套分组规则 |
| 1b | invalid | **blocking** | D-005④「空或套话即缺项」**无 consumer**——`readTaskFacts` 生产侧零调用点；机器识别套话 = 新增校验层 | **D-029②**：明确「防套话 = 材料纪律」，并入 D-013 同一句守卫；不假装它可执行 |
| 2 | **invalid** | **blocking** | **D-022 与 D-009③ 直接矛盾**：去重键「本阶段行已有 conducted 即不再派发」会**永久锁死** D-022③ 的 focus 复审；且去重粒度是「阶段行」而 D-022 是「每 Phase」，`facts.jsonl` 的 `stage` 是 5 值枚举、**无 phase 维度** | **D-029③**：去重键改为 **`(stage, phase_id, track, review_kind, origin)` 元组**；写死「大改动」判定人与误判后果；补齐 `review_origin` **第 5 个取值**的字面量名（D-005 仍只列 4 个） |
| 3 | partially_valid | major | D-023「同批」只覆盖读侧。**未登记**：`initializeTaskStore` 每次 bootstrap 以 createOnly 写 `index.json` + `quality/verify.json`（`task-store.mjs:261-264`，调用点 `task-bootstrap.mjs:38,80`）、`task-handle.mjs:417` 硬编码 special case、`public-behavior-baseline.mjs:226,265`。`status` 数据来源**不是** facts.jsonl，而是 `quality/facts/*` + `quality/evidence/stage-outcomes/*` + `snapshot_tree`/`material_revision` + `currentProductReleaseView`；「canonical 输出」草案未定义 | **D-029④**：把 status 读取来源枚举成**具名 ref 集合**写进 D-023；上述三处与批次③ 绑同批 |
| 4 | valid | major | `facts.jsonl` 会变胖且**无上限、无分组、无拆分规则**：单行同时承载阶段行 + review 三态 + 命令与退出码 + 四层状态 + reflection 结论 + 严重问题处置 + 写口身份核对，同时还要删 3 个 digest | **D-029⑤**：稳定外壳（`task_id`/`stage`/`phase_id`/`kind`/`at`）+ 按 `kind` 分子对象；写死「新增字段须先登记消费者」与量化拆分阈值 |
| 5 | partially_valid | major | **只写 decision-log 不够，而且清单现在不存在**：OI-018 仍 open；7 类「不采纳」对象在 CONSTITUTION / ADR / checklist / AGENTS 里零字；下游 agent 真读的是 AGENTS / CONSTITUTION / standard-workflow 与下一个任务自己的决策材料 | **D-029⑥**：至少进 `CONSTITUTION.md` 负向条款（D-014 的 F5/F11 旁）+ `constitution-checklist.md` 一条对照项；decision-log 只留来源引用；给清单 owner 与核对点 |
| 6 | **invalid** | **blocking** | **批次② 全文无定义**（只有 0/①/③/④/⑤/⑥/⑦/⑧）；D-018 括号与同条修订对 ① 的定义冲突、把「定基线口径」与批次 0 重复 ⇒ OI-019 的「8 个批次」**无法核验**。未落进任何批次：D-011① spec-analyze 四 profile 合并、D-011② reflection 改写入 facts（旧生产者 `quality/stage-reflection/**`、`lessons/<stage>.jsonl`、`validate-stage-reflection.mjs`，不处理=第二写入路径）、D-024、D-025、D-026、D-005/D-006 删阶段完成谓词、D-009① 的 6 个 `workflows/*/skill-deps.yaml`（47 处 `material_revision`）、D-014 的 `verify-structure.mjs:14-17` 不变量、`AGENTS.md:58`、`move-map.json`（362 entries）、`control-plane-inventory.json`、`public-behavior-baseline` | **D-029⑦**：补批次② 定义；上述每一项**显式编入批次**并加「同文件同批」约束；划批前先跑受影响面清单 |
| 7 | partially_valid | major | 父任务说的「新补链路功能验收」**在草案里还不存在**（只是 OI-017 一行问题 + Q23 一行答复，**没有 D 采纳**，D-015 只有 ①②）；M1 无变更后测量路径；M2 同样需新任务；M3 跨任务规模不可控；M4 是唯一可复算项；D-013「守卫自身计入净增减」**不可证伪**（零产物 → 行数恒为 0）⇒ 能证伪「没净删 / 在搬家」，**不能证伪 R-003/R-006 的未来阻塞减少** | **D-029⑧**：显式声明哪些结论本轮**不可证伪**并以 `unknown` 登记；M1/M2 复测**编入批次⑧ 的验收动作**（**不写成延期登记表**——用户要求不产出延期项）；把「链路功能验收」正式写成 D-015③ |
| 8 | valid | **blocking** | 七处未提及的失败源（见下） | **D-029⑨~⑮** 逐项编入批次 |

**第 8 项的七处失败源**

| 编号 | 失败源 | 证据 | 处置 |
| --- | --- | --- | --- |
| (a) | `check-skill-closure.mjs:154` 把 `["task_id","stage","material_revision","snapshot_tree"]` 写死为**强制值**（`:290` 全等校验）→ 删 D-009① **直接挂 `npm run check`**；D-020① 只点名了 `check-task-record-paths` | `runtime/evidence/check-skill-closure.mjs:154,290` | D-029⑨ |
| (b) | `public-behavior-baseline`（测试的 `TEN_ENTRY_MATRIX` 把 status 定为 "all four views"、close 定为 "physical_delivery/quality_gaps"） | `tools/architecture/public-behavior-baseline.mjs:226,265` | D-029⑨ |
| (c) | `move-map.json`（362 entries）与 `control-plane-inventory.json` 的**登记义务**（后者由 `control-plane-governance.test.mjs` 强制） | 同左 | D-029⑨ |
| (d) | **`AGENTS.md:44/:58` 明写保留 `index.json` 与 `quality/verify.json`，与 D-004/D-023 直接冲突**；而批次⑦ 不含 `AGENTS.md`/`CLAUDE.md` | `AGENTS.md:44,58` | D-029⑩ |
| (e) | 测试暴露面实测：`snapshot_tree` 155 文件 / 79 repo、`materialRevision` 43/23、`step_outcomes` 31/17、`workflow-evolution` 28/18、`verify.json` 20/12、`index.json` 21/10、`evaluateFactFreshness` 13/10、`publishVerifySummary` 7/4；`control-plane-governance.test.mjs:42` 直接用 `deriveStatusGroups` 断言 release/quality 分栏 | 测试目录 53,638 行 / 253 文件 | D-029⑨ |
| (f) | **审查包未交付 `skills/`**：本 run provider-visible manifest 只有 `review-instructions` + 4 份 material，而 `contracts/make-decision.md` 明写 detail 包**必须包含** `simplicity-guard` P0–P3 lens，manifest 亦声明 `required_skills_by_track.detail` ⇒ **simplicity 轴从未被执行** | 本 run manifest | D-029⑪ |
| (g) | **第四套形似契约**：detail 合同强制的 `oi_terminal_records`/`confirmation_groups` **不在强制 allowlist**——实测传它会 `MATERIAL_FORBIDDEN`（0 provider 被调用）。D-008① 由「三套」改为「**四套**」 | 本 run 实测 | D-029⑫ |
| (h) | `dispatch_state` **只在 `role_results.red/blue` 内、不在聚合结果上**；顶层与「provider 派出后失败」同形 | 本 run 结果 | D-029⑬ |

**追加 finding 与处置**

| id | severity | 问题 | 处置 |
| --- | --- | --- | --- |
| X-A | **blocking** | 本 run 在 **red+blue 两 role 同时**复现 `PROTOCOL_INCOMPATIBLE` 且 `provider_results=[]` ⇒ T-8「未复现 / 属间歇性」**不成立**；broker→provider 腿健康、broker→caller 腿稳定失败 | D-029⑭（D-021④ 升级为必须修） |
| X-B | major | `simple-review-runner.mjs:21 DEFAULT_MANAGED_TERMINAL_WAIT_MS=null` + `waitForManagedTerminal:443` 无上限无停滞检测 ⇒ 卡住的 provider 让 CLI 空转 37 分钟且永不返回，与 D-026③「不阻断任何阶段结束」冲突；「去掉外层 timeout 900」≠ 有界 | D-029⑭ |
| X-C | major | 异源判定是**精确字符串相等**（`third-review-host-config.mjs:642-647` `provider === hostProvider`）⇒ 上次 detail 用裸 adapter `codex` 与 `codex/luna` 不等，**什么都没排除** | D-029⑮ |
| X-D | minor | `quality/verify.json` **并非「从未产出」**——每次 bootstrap 以 createOnly 写初始化形状（`task-store.mjs:261-262`，`ac_id=task-store-initialization`）→ N-001-r 应精确为「**从未被 verify-content 写入过**」 | 已并入 N-001-r 更正 |
| X-E | info | 公开命令确为 7 类（`runtime-facade.mjs:4-10`），D-025① 边界陈述成立 | 无需处置 |
| X-F | major | 同 8(f)：simplicity 轴未执行却要承担 D-004/D-017 的「已如实记录」 | D-029⑪ |
| X-G | major | **D-003「整体删除每步完成证据体系」未区分** `stage-outcome-proofs`（内容无 reader）与 `stage-outcomes/<stage>/*.json`（**status 与 acceptance 绑定的真实输入**：`canonical-evidence-validators.mjs:53`、`stage-runner.mjs:92`、`freshness.mjs:412`）⇒ **有误删 status 数据源的风险** | D-029⑯ |

**审查者给出的两句总结**

- 最大**可执行性**风险：「D-018 的批次划分与真实依赖闭包不一致——批次② 无定义、D-011/D-024/D-025 无批次、`material_revision`/`snapshot_tree` 在 6 个 workflow 声明与 `check-skill-closure` 里被硬编码为强制值却未登记，导致『每批都能独立跑通』不成立，整改必然半路撞守卫再补一层（正是前两次的剧本）」。
- 最大**覆盖缺口**：「草案没有解决它自己赖以成立的审查通道——detail 合同要求的 `oi_terminal_records`/`confirmation_groups` 被强制 allowlist 拒绝（实测 `MATERIAL_FORBIDDEN`）、强制的 `simplicity-guard` lens 从未随包交付、本轮真实通道又以 `PROTOCOL_INCOMPATIBLE` + `provider_results:[]` 收场，因此 D-005/D-017/D-021 赖以成立的『审查已如实记录』这条完成依据**目前既不可提交、也不可核验**」。

## 最终确认

> 本节的完整内容见下方「最终确认」表；原小节标题的 `（approve-decision）` 已按内容契约去掉。

| 项 | 值 |
| --- | --- |
| 确认状态 | **`confirmed`**（含后续新增需求 R-013 的指示） |
| 用户真实答复 | 「**确认**」 |
| 答复来源 | `user`（本会话直接回复） |
| 确认卡 | 本文档「最终决策卡」正文（大白话文本卡：方向 / 会删什么 / 会保留什么 / 完成行四组字段 / 10 个批次 / 验收 / 已修掉的 5 个阻塞级问题 / 明确不做） |
| 绑定内容 | `decision_hash = ca12f0b01c2dc3ac7b076766f17a4868dccfae3e19f152e584b72ba00211b548`（含 R-013 新增需求后的当版 decision-log 全部内容；前一次确认绑定 `e357a72d…`，新增需求由用户本会话直接指示） |
| 交互聚合 | `quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json`（immutable，含 30 条 `oi_dispositions`） |
| 工具降级事实 | 结构化问答工具在本轮被用户取消，改用**大白话文本卡**取得答复；如实登记该降级事实，**未伪造工具调用凭证** |
| 收口范围 | **30 条 OI** 全部收口为 `confirmed`（**23 条**核心项绑交互凭证）；不新增第五处正常确认点 |
| 该确认不是什么 | 不是 build-code/verify-code 的进入许可证；不是不可逆操作授权（commit/push/merge/archive/cleanup 仍需独立 `authorize`）；不是质量结论 |

## 决定

### Module A：问题认定与整改原则

#### D-001
- question/final_option: 「机制开销大于任务开销、且每次改动都在加层」是否成立？→ 成立（比值属推算）
- recommendation/plain_language: 推荐采信，但要标明这是推算不是实测：现有日志能严谨确认的是 root 主会话 token 占记录下限约一半、以及两次「简化」任务都净增数千行。
- decision: 把「机制开销过高 + 控制面自我增殖」作为整改的正当性依据；同时把「比值是推算」这一事实固定写入材料，禁止下游当实测引用。
- source_type/reference/exact_excerpt: 用户原始需求 R-003 + 只读基线数据。用户原文：「只有不到50%的token和时间花在任务本身上面，超过50%的token和时间在处理这些流程和机制上面」。实测：postmortem 记录 root 461,044,192 / 总下限 896,744,068；process 文档 root 约 4.61 亿 / 任务约 8.9 亿。
- approval_binding: 待 approve-decision 绑定本次 decision-log 内容范围与用户真实答复
- facts_and_constraints: 两份文档均**未**直接给出该比值；净增数据为 close-readiness-governance +11,337/−163、execution-simplification +9,063/−1,024。
- Logic: 用户体感（机制开销过半）-> 日志只支持约一半的 root token 占比 -> 不足以当实测，但足以支撑「机制开销显著」的判断 -> 采信并标注口径
- choice_reason/impact: 影响整改正当性与 D-015 的验收口径设计。
- consequences_and_risks: 若口径不写死，验收可靠改分母通过（审查者 A5）。
- rejected_alternatives: 把 >50% 当成实测结论引用；或因其为推算而否掉整个整改诉求。
- unresolved_items/owner: 基线分子/分母定义须在批次 0 写死（owner：后续任务）。
- Supersedes: none

```text
module: 问题认定与整改原则
requirement_ids: [R-002, R-003, R-004]
derived_from: []
artifacts: [spec.md#FR-001]
```

#### D-002
- question/final_option: 控制面总量是否已复现宪法 F10 反例形态？→ 是
- recommendation/plain_language: 推荐直接承认：宪法自己写下的永久警示（约 9.5 万行 gate 代码、单个 gate 引擎 6000+ 行、33 个 schema、专门长出一套修闸工具箱），本仓已经复现到同量级。
- decision: 整改按「净减控制面」立目标，不按「补漏」立目标。
- source_type/reference/exact_excerpt: `CONSTITUTION.md:80`（F10 反例原文）+ 子代理普查。现状：生产 46,116 行 + 测试 53,981 行；47 个 schema；288 个 validate/assert/check 函数；`runtime/` 1,412 个 `throw new`、97 个大写错误码；`runtime/stage/stage-content-contracts.mjs` 单文件 6,485 行；`protocol-error-whitelist.mjs` 216 行 / 18 条 class_id + 分类后自动重发一次 `publishStage()`。
- approval_binding: 同上
- facts_and_constraints: 14 个 schema 零 `.mjs` 引用；Ajv 实际只编译 3 个；最重要的 `workflowhub-stage-outcomes.v1` 反而没有 schema，同一校验手写 5 遍。
- Logic: 宪法列出该形态为反面 -> 本仓指标与之同量级 -> 继续「补一层校验」只会加重 -> 目标必须改为净减
- choice_reason/impact: 决定了 D-012 的批次数与 D-015 的验收方式。
- consequences_and_risks: 净减会触碰 public 行为，需要有 D-009 的身份底线兜住。
- rejected_alternatives: 继续沿用「补漏 + 加统一层」路线（用户已明确否掉，且两次前车之鉴均净增）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 问题认定与整改原则
requirement_ids: [R-001, R-002, R-004]
derived_from: [D-001]
artifacts: [spec.md#FR-002]
```

#### D-003
- question/final_option: 「每步交一份完成证据」体系保留还是删除？→ 整体删除
- recommendation/plain_language: 推荐删除：70 个 step 全都声明要交这份证据，实际只有 2 条被程序真读过；一个任务光这类「证明文件」就有 423 份，内容无人消费。
- decision: 删除「每步完成证据」体系；每个 stage 只留**一行**执行记录（见 D-004/D-005）。
- source_type/reference/exact_excerpt: 用户 Talk round 2 Q7 = A。事实：70/70 step 声明 `stage_outcome`；每 stage attempt 只产 1 个 outcome 文件（约 435 KB）；70 条 `step_outcomes[]` 只有 2 条被真读（`stage-runner.mjs:441,509`）；`quality/evidence/stage-outcome-proofs` 实测 **423 个文件**（该 store 1052 个 evidence 文件里最大一类），内容无 reader。
- approval_binding: 同上
- facts_and_constraints: 单个真实 store 的 `quality/evidence/` 实测 14,942 文件 / 151 MB，task store 170 MB。
- Logic: 声明 70 处 -> 实际消费 2 处 -> 其余为满足声明形状而写 -> 删除不损失任何真实消费 -> 显著减少文件与 token
- choice_reason/impact: 这是最大的单一文件与开销产生源。
- consequences_and_risks: 单步交付粒度变粗，靠 git 历史与测试记录补。
- rejected_alternatives: 保留但压缩成材料里一行（易退化成勾选走过场）；保留现状（已证实 68/70 无人读）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 问题认定与整改原则
requirement_ids: [R-007]
derived_from: [D-002]
artifacts: [spec.md#FR-003]
```

### Module B：唯一状态层

#### D-004
- question/final_option: 执行记录放在哪？→ 复用**已存在**的 `facts.jsonl`，不新增对象
- recommendation/plain_language: 推荐复用：任务目录里本来就有一个「一次运行一行」的 append-only 记录文件 `facts.jsonl`，有 schema、有锁、有唯一写入函数，只是从来没被真正用起来（实测 0 字节）。我们要的不是新建一个对象，是把这个闲置的用起来，并把旁边的投影和散件收掉。
- decision: task 目录只保留**一个**执行记录文件 = `facts.jsonl`；删除 `index.json`；`identity/**` 折入 `facts.jsonl`。
- source_type/reference/exact_excerpt: 用户 Talk round 3 Q18 原文：「我不想新增一个对象，请找找看原来是不是就有类似的文件记录这种信息，整个workflowhub任务应该只保留一个文件记录这种信息就可以了」。核查：`appendTaskFact`（`runtime/task/task-store.mjs:296`）+ `validateFact`（`:287`）+ `withStoreLock` + `runtime/schemas/task-fact.v1.json` 均已存在；唯一生产写入是 protocol error trace（`stage-runner.mjs:1588`），零生产 reader；acceleration store 的 `facts.jsonl` 为 **0 字节**。
- approval_binding: 同上
- facts_and_constraints: `index.json` 的 `facts`/`quality.reviews`/`quality.tests`/`archives` 四数组全空，唯一读点是形状校验（`task-store.mjs:233`）；`identity/` 有 131 个记录文件（executions + path-cards）。`task.json` 保留（它是任务身份，不是执行记录）。
- Logic: 已有 append-only 记录文件 -> 它有 writer/schema/lock 但无 reader 且从未使用 -> 收掉投影（index.json）与散件（identity）-> 全任务只有一个执行记录文件 -> 零新增对象
- choice_reason/impact: 直接回应「只保留一个文件」的要求，且不引入新的持久化对象（回应审查者 A7）。
- consequences_and_risks: 需要改 `task-fact.v1.json` 的字段（现状强制 3 个 digest 字段，正是 D-009 要删的东西）并给它真实 reader；这是「改」不是「加」。
- rejected_alternatives: 新建 `runs.jsonl`（用户明确否掉）；把记录写进四份材料（会污染材料，下游读到无关历史）。
- unresolved_items/owner: `facts.jsonl` 新字段集与 reader 由后续任务定义（owner：任务Ⅰ）。
- Supersedes: none

```text
module: 唯一状态层
requirement_ids: [R-007, R-008]
derived_from: [D-003]
artifacts: [spec.md#FR-004]
```

#### D-005
- question/final_option: 阶段「做完」的定义？→ 材料写完 + `facts.jsonl` 有本阶段一行（含审查三态字段）
- recommendation/plain_language: 推荐：一个阶段算做完，只看两件事——它负责的那份材料写好了，以及记录文件里有一行如实写了这个阶段干了什么。不再要求一堆质量谓词同时满足。
- decision: 阶段完成判据 = ①本阶段材料存在且可读；②`facts.jsonl` 存在本阶段记录行，且该行含 `review_origin` ∈ {`conducted`, `unavailable`(附真实错误码), `not_run`(附理由), **`same_source_degraded`**}、`review_result_ref`、`actionable_finding_disposition`。缺字段则完成声明不成立（属缺项事实，不新增 gate）。③`review_origin` 必须在 status 中可见（不隐藏）。④`not_run` 必须附理由，且理由字段不得为空或套话（空理由 = 缺项，完成不成立）。
- **修订（Talk round 4 Q19 = A）**：完成行固定写**四个字段组**：①审查三态；②**真实跑过的命令与退出码**；③**四层状态各一格**（实现完成 / 阶段质量 / Git 交付 / 任务收口 —— 该读法**已写在 `docs/standard-workflow.md:377-383`**，本轮只是给它承载位置）；④严重问题处置。承载位置 = `facts.jsonl` 的阶段行，`status` 从它派生。防套话要求同 ④：命令/退出码为空或套话即缺项。
- source_type/reference/exact_excerpt: 用户 Q2=A、Q13=A；审查者 R2 修正。审查原文：「Q1 的约束力来自限定语『其声明的』——D-B 把完成声明重新定义为只含『材料 + 一段执行记录』，独立审查从完成谓词里整体消失，于是 Q1 不再被违反只因它要求的东西不再被声明，这是掏空而非放宽」。detail 审查（3 个 provider 独立同判）追加：原文「D-006 把约束力全权委派给含 `not_run` 的闭集，『必须真发起』零机械约束；且枚举无 `same_source_degraded`，使 D-007 的合法降级必然完不成」。
- approval_binding: 同上
- facts_and_constraints: 现状 build-code 需 5 谓词 + stage_outcome，verify-code 需 `code_review` + 条件 stage_outcome；`STAGE_ADVISORY_PREDICATES`（`completion-predicates.mjs:108-116`）已把 make-decision/build-spec/build-plan 的 review 降为 advice。
- Logic: 宪法要求完成必须包含「其声明的独立审查或真实 unavailable」-> 只要完成声明仍含审查占位，Q1 就不被掏空 -> 把「审查结果好不好」与「审查有没有如实记录」分开 -> 既不卡住也不掏空
- choice_reason/impact: 这是审查者唯一判为 blocking 的点的解法。
- consequences_and_risks: 三态字段必须真实；`not_run` 无理由即完成不成立。
- rejected_alternatives: 把审查完全移出完成判据（审查者判为掏空 Q1）；审查结果仍是硬条件（用户一开始就要去掉的阻塞）。
- unresolved_items/owner: F4 的 serious finding 处置绑定保留（已认证 actionable+major|blocking 仍须先修复或显式承担风险）。
- Supersedes: none

```text
module: 唯一状态层
requirement_ids: [R-007]
derived_from: [D-004]
artifacts: [spec.md#FR-005]
```

### Module C：审查生命周期

#### D-006
- question/final_option: wh-review 的绑定语义？→ 保留、标准不变、结果不作通关条件、但必须在完成声明里占位
- recommendation/plain_language: 审查照旧由 wh-review 做、每个阶段的标准一个字不改；审查结果不再决定这个阶段能不能结束，但「审了什么、结果如何、严重问题怎么处置」必须如实写出来。
- decision: 五阶段统一：审查必须真发起；结果如实记录；不作为阶段结束条件；D-005 的三态字段是其唯一机制约束。
- source_type/reference/exact_excerpt: 用户 Q3 原文：「审查还是依赖wh-review进行，每个stage有不同的审查标准，这个不能改」；Q8=A。
- approval_binding: 同上
- facts_and_constraints: 现状硬阻断只有三类，其中一类就是 review 轮次预算（`review-record-route.mjs:804-805`）；build-code `integration_review` + `finding_dispositions`、verify-code `code_review` 仍是 `/5` 谓词。
- Logic: 保留审查能力与标准 -> 去掉它作为通关条件的角色 -> 用「如实记录」承接 Q1/F4 -> provider 挂掉不再拖死阶段
- choice_reason/impact: 直接影响全部五个 stage 的结束体验。
- consequences_and_risks: 审查问题改由人把关；材料/记录必须显式列出未处置项。
- rejected_alternatives: 保留 verify-code 硬条件（provider 不可用时仍卡最后一步）；全部可选（放弃 Q3）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 审查生命周期
requirement_ids: [R-007, R-008]
derived_from: [D-005]
artifacts: [spec.md#FR-006]
```

#### D-007
- question/final_option: provider 全不可用时怎么办？→ 允许降级为子代理审查，但必须可区分且门槛严格
- recommendation/plain_language: provider 全挂了就派子代理审，别卡住；但要在阶段末尾说清「这是降级审查」，因为子代理虽然上下文独立，来源并不独立，不能当异源裁决用。
- decision: ①降级判据：必须确实派出过 provider 且至少一条真实 provider 失败；输入协议错误（如 `blocked_before_dispatch` / `MATERIAL_FORBIDDEN`）**一律不许降级**。②降级结果记 `review_origin=same_source_degraded`，并在 status 与阶段末摘要可见。③降级不得写成「独立审查已完成」。
- source_type/reference/exact_excerpt: 用户 Q9 原文：「所有provider都不可用时，直接子代理执行wh-review就可以了，stage结尾的时候这种降级审查需要说明一下」；审查者 R3/A3 修正。
- approval_binding: 同上
- facts_and_constraints: 本任务实测：`blocked_before_dispatch`（0 provider）与 dispatched 后 `PROTOCOL_INCOMPATIBLE`（6 次 provider-role 派发、0 findings）在 status/outcome/findings 三字段上完全同形，仅 `dispatch_state` 区分。
- Logic: 用户要降级路径 -> 但 blocked 与 provider 故障同形 -> 不设门槛则降级成万能逃生门 -> 用现有字段设门槛 + 标注来源
- choice_reason/impact: 决定 Q3 异源要求是否名存实亡。
- consequences_and_risks: 门槛只用已有字段，不新增资格对象（用户 Q16 明确否掉新增）。
- rejected_alternatives: 不允许降级（provider 不可用即卡死）；允许任意失败降级（会把「发错了」误判成「provider 挂了」）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 审查生命周期
requirement_ids: [R-006, R-008]
derived_from: [D-006]
artifacts: [spec.md#FR-007]
```

#### D-008
- question/final_option: 审查输入契约怎么整？→ 只做四件零新增对象的事
- recommendation/plain_language: 不改语义、不加对象：删掉重复的那套允许名单；报错直接告诉你合法取值是什么；把已经存在的 dispatch_state 显示出来；降级门槛写一句规则。
- decision: ①形似的允许名单**有三套**（不是两套），只留真正强制执行的那一套，删掉另两套（描述性副本 + 被测试强制但生产未调用的 `validateDetailReviewInput`）；②`MATERIAL_FORBIDDEN` 之类错误必须直接列出合法取值；③「未派出」与「派出但失败」在下游显示必须不同（复用已有 `dispatch_state`）；④不新增降级资格字段。
- source_type/reference/exact_excerpt: 用户 Q16 原文：「你这个问题我感觉又会新增一大堆对象和语义，提高项目维护成本，根本没必要这么复杂」；G1=A。实测：`skills/wh-review/SKILL.md` 自己的 make-decision 示例用的是 `detail` track 的 key，照文档写必被拒；仓内三套形似契约：`surfaces[...].semantic_fields`（描述性，9 key）、`stages[...].tracks.direction.required/optional`（真正强制）、`validateDetailReviewInput`（`review-materials.mjs:341`，硬要 `revision-<sha256>`，被 `detail-minimum-input.test.mjs` 强制但生产未调用）。detail 审查原文：「D-008① 把它算漏（写成『两套』）」。
- approval_binding: 同上
- facts_and_constraints: 本次为此耗费约 7 分 50 秒、3 个机制障碍、其中 2 个在任何 provider 被联系之前发生、2 个必须读源码才能自纠、最终 0 条可用 finding。
- Logic: 三处阻塞都不需要新对象 -> 删重复清单 / 改错误文案 / 显示已有字段即可 -> 零维护成本上升
- choice_reason/impact: 直接消除实测复现的机制自阻塞。
- consequences_and_risks: 改的是审查入口校验与错误文案，属 public 行为，需单独测试。
- rejected_alternatives: 新增降级资格对象、新增 track、新增错误状态（用户明确否掉）。
- unresolved_items/owner: 「方向挑战」到底归 direction 还是 detail track，属机制缺口，须在整改中单列（审查者 A1 判为 blocking）。
- Supersedes: none

```text
module: 审查生命周期
requirement_ids: [R-006]
derived_from: [D-007]
artifacts: [spec.md#FR-008]
```

### Module D：身份与新鲜度

#### D-009
- question/final_option: 「去掉哈希」具体切在哪？→ 删失效链；只在写口保留一次身份核对
- recommendation/plain_language: 「哈希」要分两刀：让证据因编辑而失效、逼你返工重审的那条链，全删；写正式记录前确认「没写错任务/工作区」的那一次核对，保留。前者是你烦的东西，后者是宪法明文要求必须报错的东西。
- decision: ①**全删**：材料整体哈希、snapshot tree、currentness 重算、fact 级 freshness 评估，以及由它们派生的「改一个字段 → 既有证据失效 → 重跑审查/测试」链条。②**保留一次**：写入正式记录前做一次窄预检，只含 task_id + 工作区路径 + 即将写入的确切字节/写集合，不匹配则 fail-loud。③被连带删掉的「同一材料不重复调用审查」去重键必须给出替代物，否则退化为重复调用。
- **修订（detail 审查 item 3/4，blocking）**：①删 snapshot 会**直接断掉 ②** —— `inspectWriteBoundary` 消费 `captureGitWorktreeSnapshot` / `assertCurrentSourceDigest`（`runtime/evidence/write-boundary-preflight.mjs`）。→ 处置：写口预检改为直接对「即将写入的确切字节 + task_id + 工作区路径」做核对，**不再经 snapshot**；`git-worktree-snapshot.mjs` 的 snapshot 捕获能力随之从写路径移出。②材料整体哈希**同时**是 wh-review 去重键、route identity 与 `review-record-route.mjs:40` freshness 的输入。→ 处置：去重键替代物采用 **D-005 已强制的 `review_result_ref`**（本阶段行已有本 track 的 `review_result_ref` 且 `review_origin=conducted` 则不再派发）——零新增对象，且同时充当完成 oracle；备选是按 invocation 作用域去重。**被否的替代物**：snapshot OID、bareSink 材料 digest（两者正是 D-009① 要删的哈希）。③注意 D-010 同批删除预算机制，两套去重不能同时消失，必须按 ②的替代物先落地。
- source_type/reference/exact_excerpt: 用户 Q10 原文：「我希望去掉哈希这件事，不要总是去检查哈希，正常改动是正常的流程，不用总是返工、重审」；Q17=A；审查者 R1。宪法：`CONSTITUTION.md:28`（F3）「task/worktree/runtime 身份、hash、顺序与核心 publication 结构错误必须在写成功前 fail-loud」。detail 审查原文：「(a) `inspectWriteBoundary` 消费 `captureGitWorktreeSnapshot/assertCurrentSourceDigest` → **删 snapshot 就断了 D-009②**；(b) 材料整体哈希**同时**是 wh-review 去重键（bareSinkKey←material_id）与 route_identity 与 review-record-route.mjs:40 freshness」。
- approval_binding: 同上
- facts_and_constraints: `isStageSnapshotCurrent`（`completion-predicates.mjs:58`）、`evaluateFactFreshness`（`freshness.mjs`）、`materialRevisionFromValues`（`git-worktree-snapshot.mjs:552`）、`quality-fact.mjs:38` 强制 `revision-<sha256>`。前车之鉴：一次材料修改丢掉约 40 分钟已完成的 provider 结果；审查包从 407,560 B 涨到 1,008,828 B 并直接导致 provider prompt too long。
- Logic: 失效链无宪法依据且是最大重复劳动源 -> 删；写边界身份是 F3/F9/Q2 明文 -> 留一次 -> 两刀分开即无不可调和冲突
- choice_reason/impact: 这是「自激反馈环」的唯一根治法。
- consequences_and_risks: 保留的那一层若做胖会慢慢长回原样，须写死只有这几项；wh-review 的去重键须补替代物。
- rejected_alternatives: 全部删掉不检查（违反 F3/F9，且「写错 task store 路径」事故历史上真实发生过）；保留现状（自激环不变）。
- unresolved_items/owner: 去重键替代物由后续任务定义。
- Supersedes: none

```text
module: 身份与新鲜度
requirement_ids: [R-003, R-006, R-008]
derived_from: [D-004]
artifacts: [spec.md#FR-009]
```

#### D-010
- question/final_option: review 轮次预算保留吗？→ 删除
- recommendation/plain_language: 「同一份材料只允许发几轮审查、超了就报 EXHAUSTED」这套预算机制删掉。它已经实测出过错（按历史记录推断，把没发出去的调用也算成消耗了预算），而且它正是三大硬阻断之一。
- decision: 删除 review 轮次预算机制（`validateReviewBudget` 及其消费点）；重试改为「人/agent 判断 provider 或材料确已变化时手动发起」，不做自动计数。
- source_type/reference/exact_excerpt: 用户 Q9=A。事实：`validateReviewBudget`（`runtime/evidence/stage-content-evidence.mjs:312`），唯一执行点 `review-record-route.mjs:804-805`；实测出现 `REVIEW_RETRY_BUDGET_UNKNOWN` / `REVIEW_RETRY_BUDGET_EXHAUSTED`。
- approval_binding: 同上
- facts_and_constraints: 普查确认运行时硬阻断只剩三类，预算为其一。
- **修订（第 4 轮覆盖审计指出的材料内部不自洽）**：D-018 的批次表**未点名**删除本机制，而 D-009 修订③ 又要求「去重替代物先落地、两套去重不能同时消失」——两者不自洽。→ 处置：把「删 review 轮次预算」正式编入 **D-018 任务Ⅱ 的批次④（审查解绑）**，并写死顺序约束：**先落地 D-009③ 的 `review_result_ref` 去重替代物，再删预算**；同批次必须包含 D-018 修订里合并进去的 `task-store.mjs` 改动之外的审查侧改动。批次④的验收须证明「同 track 已有 `conducted` 结果时不再派发」生效。
- Logic: 预算按历史推断而非当前真实 attempt -> 实测出过错 + 是硬阻断 -> 删除 -> 重试改成显式人工判断
- choice_reason/impact: 直接消除一类硬阻断。
- consequences_and_risks: 失去自动去重；由 D-008③ 的显示与 D-009③ 的去重键替代。
- rejected_alternatives: 保留预算 + 人工一键放行（决定权又回到人，且预算算法本身已出错）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 身份与新鲜度
requirement_ids: [R-006]
derived_from: [D-009]
artifacts: [spec.md#FR-010]
```

### Module E：保留项与展示

#### D-011
- question/final_option: spec-analyze ×4 与 stage-reflection ×5 怎么办？→ 都保留执行，但必须有真实 reader
- recommendation/plain_language: 两个都留着（你说了 analyze 是查结果对不对得上原始需求、reflection 是复盘，都不能丢）。但它们现在一个在 4 个阶段问同一个问题、另一个写出来根本没人看。做法是：analyze 四份检查表合并成一套（每阶段仍各跑一次），reflection 的结论写进记录文件的当阶段行并在状态里显示一行——让人真能看到。
- decision: ①spec-analyze 保留在 4 个 stage 各跑一次，但 profile 合并为一套共享实现；②stage-reflection 保留在 5 个 stage 各跑一次，结论写入 `facts.jsonl` 本阶段行并在 status 占一行；③判据 = 下一阶段/人是否真读了它。
- source_type/reference/exact_excerpt: 用户 Q11 原文：「analyze 是用来检查任务结果是否符合原始需求，不能遗失。reflection 是用来复盘的，目前每个stage都要执行」；G4=A。审查者 R4 修正原文：「没 reader 就给它一个 reader，或者折进已经有 reader 的对象」。
- approval_binding: 同上
- facts_and_constraints: `stage-content-contracts.mjs:4662-4685` 四份 profile 的六字段总结/finding 形状/quality-fact 写法完全同构；`quality/stage-reflection/**` 与 `lessons/<stage>.jsonl` 无生产 reader（唯一页面 reader `build-reflection-page.mjs` 无生产调用者）。
- Logic: 用户要求保留 -> 保留执行但消除重复实现 -> 把产物接到真有人的地方 -> 不再是纯开销
- choice_reason/impact: 在尊重用户要求的前提下解决审查者 R4。
- consequences_and_risks: reflection 从独立文件变成记录里一段，导出历史复盘要重新拼。
- rejected_alternatives: 删除两者（用户明确否掉）；保留但只去重实现（reflection 仍无人看）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 保留项与展示
requirement_ids: [R-007]
derived_from: [D-004]
artifacts: [spec.md#FR-011]
```

#### D-012
- question/final_option: status 输出形态？→ 只报根因
- recommendation/plain_language: 现在一个根因会被展开成几十条红字（实测 30 条里只有 2–4 个真问题），而且这些展开没有任何程序在读，纯粹打给人看。改成只显示根因，同一件事只报一次，派生的表象收起来。
- decision: status 只输出按根因归并的条目；派生投影不再作为独立条目展示；同一根因只出现一次。
- source_type/reference/exact_excerpt: 用户 Q12=A。事实：`deriveStatusGroups`（`tools/cli/stage-runtime.mjs:322`）产出 `quality_gaps`/`release_gaps`/`close_preparation_gaps`/`actionable_now`，**无任何仓内文件读 `status_groups`**，不持久化，属 print-only。
- approval_binding: 同上
- facts_and_constraints: 前车之鉴：CLI 把同一根因展开成 30 条 release reason，实际只对应 2–4 个真问题。
- Logic: 投影无程序消费 -> 只服务人 -> 人的问题是找不到根因 -> 只报根因
- choice_reason/impact: 直接改善人的判断效率。
- consequences_and_risks: 会改现有 status 输出形状，影响使用习惯。
- rejected_alternatives: 保留现状只做分类展示（根因仍被淹没）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 保留项与展示
requirement_ids: [R-006, R-007]
derived_from: [D-004]
artifacts: [spec.md#FR-012]
```

### Module F：防再增殖与验收

#### D-013
- question/final_option: 「减法守卫」用什么形态？→ 零新产物 + 自指
- recommendation/plain_language: 守卫不能做成一个「统计控制面数量」的工具——那正是宪法明文禁止的「另造计数器来检查是否足够简单」，会是第三次加层。做法是：不加工具、不加 schema、不加检查器、不加新命令，只要求本次改动「删了什么、加了什么」写成 spec/plan 里一个必填小节，看的人就是已有的那个用户确认点。而且守卫自己要算进第一次改动的账里，否则它不可证伪。
- decision: 约定「控制面净增减申报」为已有材料（spec/plan）的必填小节；consumer = 已有用户确认点；owner = 已有 stage；判定用已有代码改动对比；守卫自身计入第一次改动净增减（自指）。
- **修订（第 5 轮审查：缺三要件）**：原措辞只有「批准人 / 判定方式 / 自指」，缺三件，本轮补全且**不加新对象**：
  - ①**登记字段**：把 `AGENTS.md` 已有的五项要求（职责 / 真实 consumer / owner / 测试 / 删除或保留条件）上升为**任何新增控制面的通用登记字段**（原本只写在 `facts.jsonl` 的 D-017 五要件里），并**追加两项**：`替代关系`（替代了谁，无则写 none）与 `净增减自陈`（本次删了什么、加了什么）。登记位置 = spec/plan 的必填小节。
  - ②**违反后果**：登记缺失或净增未申报时，**用户确认点不通过**（该确认点本就需要人看，不加机器检查器）。这是「靠人看」的具体落点，不是新 gate。
  - ③**范围与自适性**：守卫适用于**本任务及其后续三个任务的每一次改动**，包括本轮自己新增的东西——D-021④ 的 `review_origin` 枚举取值、D-026 与 D-027 新增的必填小节、OI-026~OI-029 本身，都**必须回填进第一次改动的净增减账**。守卫自指不只覆盖守卫自身。
- **补记**：**阻塞分类学常驻规则**（见「阻塞分类学与防护」节）作为 D-014 宪法修订的一部分一并写入：新登记的阻塞必须先归入八类之一并登记该类防护与 owner。
- source_type/reference/exact_excerpt: 用户 Q14=A。宪法 `CONSTITUTION.md:85`（F11）：「不得另造计数器、schema、运行时 gate 或测试框架来检查『是否足够简单』」。审查者 R5：「按字面实现（申报⇒计数⇒核对⇒产物）它正是 F11 明文禁止的……并且它加在两次『简化』都净增之后，没有删除预算与 owner，很可能成为第三次净增」。
- approval_binding: 同上
- facts_and_constraints: 前两次「简化」净增 +11,174 / +8,039 行，均无删除预算与 owner。
- Logic: 要防止再增殖 -> 但计数器本身就是增殖 -> 用零产物的材料纪律 + 自指可证伪
- choice_reason/impact: 决定「以后不会再长出难维护的对象」是否真的有约束力。
- consequences_and_risks: 靠材料纪律而非机器强制，人得真的看；这是刻意选的，因为机器强制会违反 F11 且抬维护成本。
- rejected_alternatives: 做自动统计检查器（违反 F11）；只定「删除预算」不给 owner（易为凑数删错）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 防再增殖与验收
requirement_ids: [R-004, R-006]
derived_from: [D-002]
artifacts: [spec.md#FR-013]
```

#### D-014
- question/final_option: 宪法要不要同步修订？→ 要
- recommendation/plain_language: 你要删的两样东西宪法里都写了字：F3 说「身份、**hash**、顺序」必须报错，F6 要求每次正式写入认证「合同内容校验值」。不同步改就会出现「实现没做但宪法写着要做」，下一个任务会拿宪法当依据把它改回来。
- decision: 同步修订 F3（`hash` → 「任务与工作区身份」）、F6（去掉「内容校验值」要求）；把「控制面净减法」写成 F5 或 F11 的一句硬规则；同步更新 `constitution-checklist.md`、版本号、修订记录与旧→新映射。ADR 侧同步修订 freshness / canonical ownership / close transcription / review generation / same-snapshot recovery / review dispatch preflight 相关条目。
- source_type/reference/exact_excerpt: 用户 G2=A。宪法原文 `CONSTITUTION.md:28`、`:49`、`:100`。
- approval_binding: 同上
- facts_and_constraints: 仓内已有文档漂移先例：`AGENTS.md:31` 与 `CLAUDE.md` 声明顶层 `schemas/` 为历史兼容区，实际该目录不存在。
- Logic: 实现要删 hash -> 宪法明文要求 hash -> 不改宪法则实现长期违宪 -> 下一个任务会加回来 -> 必须同步改
- choice_reason/impact: 决定整改的持久性。
- consequences_and_risks: 改宪法要走版本号 + 修订记录 + 映射 + checklist 条目数一致，是一次正式治理动作。
- rejected_alternatives: 只改实现不改宪法（长期不一致）；先改实现回归后再改宪法（中间期实现违宪，易被回滚）。
- unresolved_items/owner: 具体条目措辞由后续任务起草并须用户批准。
- Supersedes: none

```text
module: 防再增殖与验收
requirement_ids: [R-004, R-006]
derived_from: [D-009, D-013]
artifacts: [spec.md#FR-014]
```

#### D-015
- question/final_option: 怎么证明整改成功？→ 双证，基线取自已有历史数据，不新跑任务
- recommendation/plain_language: 两样都要：①静态净减法——代码行数、每个任务的记录文件数、没人看的对象数，逐项必须净降，并且要有具名删除清单；②历史基线对照——拿之前那几个任务的现成数据当对照，看「花在任务本身的比例」有没有上升、机制阻塞有没有下降。不为了量基线专门再跑一个真实任务。
- decision: 验收 = ①静态净减法（具名删除清单 + 逐项计数净降）；②**历史基线对照，但改用可计算的指标**。基线口径须在批次 0 先写死。
- **修订（detail 审查 item 7，invalid/major）**：原方案想算的「花在任务本身 vs 花在机制上」的**比例算不出来** —— acceleration store 的 `facts.jsonl` 是 0 字节、`index.json` 三数组全空，没有任何时间/token 分段；postmortem 的 token 是会话标量且含任务自身推理（审查者 A5）。→ 处置：改用四个**可从现有数据算出**的指标：
  - **M1 机制记录墙钟占比** =（正式测试累计 12,182.1 s + broker review 墙钟 6,054.384 s）/ 会话跨度 91,234 s ≈ **20.0%**（三项均为记录实际值，非推算）
  - **M2 每任务机制阻塞次数**（本任务 make-decision 实测 3 条，其中 2 条发生在任何 provider 被联系之前）
  - **M3 每任务记录文件数 / 其中无 reader 的比例**（acceleration：1,771 / 1,052 evidence，其中 423 为无 reader 的 proofs）
  - **M4 git 净行增减**（对照：close-readiness-governance +11,174、execution-simplification +8,039）
  - 「>50%」保留为**推算**并明确标注，禁止当实测引用。
- **修订（第 5 轮审查：补 M5 与两条口径）**：
  - 新增 **M5 控制面体量面**（补 R-008「quality / validator」的体量目标与 R-003 的 token 维度缺口）：`validate/assert/check` 函数数、`throw` 站点数、错误码数、schema 文件数、单文件最大行数 —— 五项在整改后**逐项净减**。基线（HEAD 实测）：288 / 1,412 / 97 / 47 / 6,485 行。
  - **token 维度**：M1–M4 无一项度量 token，而 R-003 的原始表述是 token 与时间。**不新增仪器**（历史数据里 token 分层不可得）；改为在批次 0 的口径里写明「token 维度在历史数据上不可得，如实标 `unknown`」，并把 R-003 的 >50% 永久标注为**推算**。
  - **新增适配代码计入净增减**：为适配 CI 授权表（D-020①）与测试矩阵（D-020④）新增的代码，**必须计入 D-013 的净增减账**。
- source_type/reference/exact_excerpt: 用户 Q5=A、Q15=A + 收紧原文：「我不想用真实任务采一份基线，太浪费时间了，你直接基于之前的任务判断基线即可」；G5=A。审查者 R7：「删除清单里混进了成功判据的测量工具……先删仪器再测量等于让 D-I 永久不可证伪」。detail 审查原文：「**比例算不出**……**可算替代**：M1 机制记录墙钟占比 =（测试 12,182.1s + broker review 6,054.384s）/ 91,234s ≈ **20.0%**」。
- approval_binding: 同上
- facts_and_constraints: 可用历史数据：acceleration store 1,771 文件 / 13 MB / evidence 1,052（proofs 423）/ facts.jsonl 0 字节；execution-simplification 25h20m / token 下限 8.97 亿 / root 约占一半 / 962 文件 / 45 次测试共 12,182 秒 / 16 次审查；本任务 make-decision 实测 3 个机制障碍、0 条审查结果、约 7 分 50 秒。
- Logic: 要能证伪「只是搬家」-> 需静态与动态双证 -> 动态证需要仪器 -> 仪器正被删除 -> 必须先定口径并用历史数据定基线
- choice_reason/impact: 决定整改是否可证伪。
- consequences_and_risks: 历史任务规模/阶段不同，比值不可直接平均，只能逐项对照；口径缺口如实标 unknown。
- rejected_alternatives: 只做静态盘点（说不出没重演）；新跑一次真实任务采基线（用户明确否掉，太费时间）。
- unresolved_items/owner: 批次 0 口径定义（owner：任务Ⅰ）。
- Supersedes: none

```text
module: 防再增殖与验收
requirement_ids: [R-005, R-006]
derived_from: [D-001, D-013]
artifacts: [spec.md#FR-015, plan.md]
```

### Module G：边界

#### D-016
- question/final_option: 历史任务与已落盘 provenance 怎么处理？→ 只读冻结，只删读取它的代码
- recommendation/plain_language: 老任务的记录原样留着，不迁移、不做兼容桥、不新增写入者。要分清楚「删掉读它的代码」和「删掉已经落盘的历史字节」是两件事——前者可以，后者不行。
- decision: ①历史任务只读冻结，不迁移、不兼容、不双写；②删除只针对读取它的代码与未来的写入路径，**不删**已落盘的历史 provenance / review / 失败事实字节；③新机制只对新任务生效。
- source_type/reference/exact_excerpt: 用户 Q6=A；审查者 A6：「D-A/D-J 的措辞未区分『删除读取它的代码』与『删除已落盘的历史 provenance 字节』」。`AGENTS.md`：「provenance、原始 review 事实和失败事实必须保留，不能用摘要覆盖来源」。
- approval_binding: 同上
- facts_and_constraints: 19 个归档任务，单任务 1,771–3,011 个文件。
- Logic: 历史是事实不是负担 -> 冻结 -> 删除只作用于代码与未来路径 -> 既不丢事实也不留兼容层
- choice_reason/impact: 划清删除边界，避免整改被读成「删历史」。
- consequences_and_risks: 老任务在新命令下可能读不出，需明说「历史只读」。
- rejected_alternatives: 迁移历史（大规模、只服务历史、易改写历史事实）；归档到仓外（动历史文件、不可逆）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 边界
requirement_ids: [R-006]
derived_from: [D-004]
artifacts: [spec.md#FR-016]
```

#### D-017
- question/final_option: `facts.jsonl` 这个沿用对象要不要登记？→ 要，按 F11 五要件写死
- recommendation/plain_language: 就算是沿用已有的文件，只要它开始承载新职责，就得写清它有主、谁看、怎么算完成、失败了算什么、什么时候能删——不然它就是下一个难维护的东西。
- decision: 为复用后的 `facts.jsonl` 登记五要件：owner = 该 stage 主会话；consumer = 下一 stage + status 根因行 + Talk 轮次输入；oracle = 文件存在且当阶段行含 D-005 三态字段；失败语义 = 缺字段则完成声明不成立；退出条件 = 被经过审查的替代记录机制取代。
- source_type/reference/exact_excerpt: 审查者 A7：「替换物本身是一个新的持久化事实对象，而方向未给它 owner、consumer、完成 oracle、失败语义与退出条件——按 F11 这是一个未登记的控制面」；用户 Q18 明确不新增对象、只复用已有。
- approval_binding: 同上
- facts_and_constraints: 仓内反例：7 个 CLI 工具链合计 197,422 B 唯一调用者是 tests 与 move-map；`workflow-evolution.mjs` 1,448 行 / 108,472 B。
- Logic: 沿用已有对象解决了「新增」问题 -> 但它承接新职责仍需登记 -> 按 F11 五要件写死
- choice_reason/impact: 直接回应审查者 A7，且不引入新对象。
- consequences_and_risks: 需要改 `task-fact.v1.json` 字段并给它真实 reader。
- rejected_alternatives: 新建 runs.jsonl（用户否掉）；不登记先用起来（正是仓内 7 个无调用者工具的成因）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 边界
requirement_ids: [R-007, R-008]
derived_from: [D-004]
artifacts: [spec.md#FR-017]
```

### Module H：落地路线

#### D-018
- question/final_option: 后续怎么切任务？→ 3 个后续任务
- recommendation/plain_language: 切成三块：第一块删掉没人看的东西并把记录文件重建起来；第二块收敛语义（审查解绑、删哈希失效链、状态只报根因）；第三块做治理同步（宪法/ADR/清单）与双证验收。
- decision: 任务Ⅰ = 批次①②③（定基线口径 / 删无 reader 叶子 / 每步证据→`facts.jsonl` 每阶段一行）；任务Ⅱ = 批次④⑤⑥（审查解绑+降级+审查契约四项 / 删哈希失效链只留写口一次核对 / status 只报根因）；任务Ⅲ = 批次⑦⑧（宪法/ADR/checklist 同步 + 双证验收）。
- **修订（第 5 轮 detail 审查：blocking —— 原批次表不可核验）**：原表**批次② 无定义**、括号与修订自相冲突、把「定基线口径」与批次 0 重复。**重建为 10 个具名批次（⓪ ① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨；划批前必须跑「受影响面清单」）**。计数口径以此处为唯一来源，其他小节一律引用本句：
  - **批次⓪**（先做，零删除）：只读定基线口径 —— 用已有历史数据（G5）写死 M1–M5 的分子/分母定义，采基线，登记不可证伪项为 `unknown`。不新跑任务。
  - **批次①**：删**与 `task-store.mjs` 无关的**无 reader 叶子 —— `stage-outcome-proofs/**`、`quality-store.mjs:238` 那个零调用者函数、14 个零引用 schema（含 `task-fact.v1.json`）、`runtime/evidence/` 8 个零 importer 死模块、34 个死导出、16 个零调用者工具、`task-index.mjs`、`workflows/verify-code/*.mjs` 4 个未 import 文件、`workflow-evolution.mjs`、protocol-error 白名单与自动重发组。
  - **批次②**（**本轮首次定义**）：删**与 `task-store.mjs` 相关的**剩余死物并合并重复实现 —— `facts.jsonl` 里 `monitoring-fact.v1` 零生产者分支（`task-store.mjs:147-196`）、4 类重复实现的常量合并（`STAGE_REFLECTION_REF` ×4、`CLOSE_PLAN_REF` ×2、stage-outcome 形状校验 ×5、`/^[a-f0-9]{64}$/` 48 处）、4 张 CI 授权表改为按职责。
  - **批次③**：删 `index.json` + 改 `facts.jsonl` 字段 + 给 reader（**同文件同批**）：含 5 个 `index.json` 写点 / 6 个读点、`completion-predicates.mjs:1124-1132`（verify 谓词）、`initializeTaskStore` 的 createOnly 写（`task-store.mjs:261-264`、`task-bootstrap.mjs:38,80`）、`task-handle.mjs:417`、`public-behavior-baseline.mjs:226,265`、`quality-store.mjs`、`task-kernel-implementation.mjs:810-818`、`stage-handoff.mjs:291-330`（哈希链与写口核对同段，Z5）、`verify-structure.mjs:14-17`、`stage-outcomes/<stage>/*.json` **先迁移后删**（D-029⑯）。
  - **批次④**：审查解绑 + 降级 + 审查契约四项 + **审查通道修复（必须修）** + **审查进程健康终止（R-013 / D-030，含跨仓交付项）** —— 去重键改元组、`review_origin` 第 5 取值、`dispatch_state` 提到聚合面、packet 组装补 `skills/` lens、异源按底层模型判定、删轮次预算（顺序：先落替代物再删）；**并交付 D-030**：①3rd-review 仓（`/Users/Hugh/Hugh/Project/3rd-review`）manager 心跳 + `managedStatus` 心跳过期判死（协议零变更、对全体 provider 有效）②`PROCESS_STALLED` 补进失败枚举并接成终态（`health-runner.mjs:54` → `broker.mjs:1335` 的 `outcome:"stalled"`）③wh-review 侧把 `stalled` 接到下游结果映射、`waitForManagedTerminal` 改为等待健康裁决、**禁止自造墙钟停滞判定** ④同步修正 `docs/adr/0001-v4-cli-contract.md:123` 与归档设计文档中「沉默不杀进程」的旧决策。**验收**：卡死审查由 3rd-review 自行判死并进入终态；**无任何审查需要外层 timeout 才能结束**；21 分钟空转零产出不再可能。
  - **批次⑤**：删哈希失效链，只留写口一次身份核对 —— 含 `check-skill-closure.mjs:154,290`（**否则直接挂 `npm run check`**）、6 个 `workflows/*/skill-deps.yaml`（47 处 `material_revision`）、8 文件闭包、`git-worktree-snapshot.mjs` 的写路径移出。
  - **批次⑥**：status/close 只报根因 + 读取来源收敛为具名 ref 集合 + `quality/verify.json` 与 release 投影连对象收掉。**先补 D-015③ 的链路功能验收**。
  - **批次⑦**：治理同步 —— 宪法 F3/F6 修订 + checklist + ADR + **`AGENTS.md`/`CLAUDE.md`（含 `:44/:58` 与 D-004/D-023 的冲突）** + `move-map.json`（362 entries）+ `control-plane-inventory.json` + `docs/audit-contracts.md` + `package.json` 的 `npm test` 与「禁止全量回归」冲突 + 「已裁定不采纳」清单进宪法负向条款。
  - **批次⑧**：双证验收 —— 静态净减法 + M1–M5 对照 + D-015③ 链路功能验收；不可证伪项如实标 `unknown`。
  - **批次⑨**（**本轮新增：执行面四条，不再延期；任务Ⅱ 内最先做**，因为它是纯工程改造、不依赖任何语义变更，且做完能降低后续批次的运行成本）：慢测试切分（三层节奏 + 硬时间预算：inner 分钟级、phase 3–5 分钟、aggregate 每任务一次）、同命令去重（同输入不重复启动，复用现有 fingerprint 判定）、超时保留已完成部分（timeout 不抹掉已完成的 provider member 与已跑完的测试文件）、开工前 preflight（命令与路径存在性、provider/host 能力、packet 体积在昂贵动作前校验，5 秒内返回具体原因）。**验收**：两个 900 秒超时与 1,717.39 秒单次门不再复现；同一命令启动次数 ≤ 计划数；超时场景下已完成部分可读回；不存在的命令/文件在开工前即被拦下。
  - **批次执行序（唯一口径）**：任务Ⅰ = ⓪ → ① → ② → ③；任务Ⅱ = **⑨（最先）** → ④ → ⑤ → ⑥；任务Ⅲ = ⑦ → ⑧。共 **10 个具名批次**。⑨ 之所以在任务Ⅱ 最先做：它是纯工程改造、不依赖任何语义变更，做完能降低后续批次的运行成本。
- **修订（detail 审查 item 6，major）**：`index.json` **不是无 reader 叶子** —— `readTaskIndex` 有生产读者（`runtime/evidence/quality-store.mjs:84,223,245`），**且被 facts 写入者自己调用**（`task-store.mjs:316`）；`appendTaskFact` 在同一个 try/catch 里原子写 `facts.jsonl` 与 `index.json` 两个文件（`:320-327`）；要删的 3 个 digest 正是 `validateFact:287` 与 `task-fact.v1.json` 的必填项。→ 批次①与②③改的是同一个 `task-store.mjs`，**不具备独立性**。处置：把「删 `index.json` + 改 `facts.jsonl` 字段 + 给 reader」合并为**同一个批次**（新批次③），批次①只保留「删与 `task-store.mjs` 无关的叶子」（stage-outcome-proofs、`publishVerifySummary`、无引用 schema、无调用者工具链、`workflow-evolution.mjs`）。批次 0 用 `status` 本身安全（D-012 在批次⑥），但需记录「批次③ 改字段后 status 读数形状会变」这一基线漂移事实。
- source_type/reference/exact_excerpt: 用户 G3=A；审查者 R7 的批次建议。detail 审查原文：「`index.json` **不是无 reader 叶子**……批次①与②③改同一文件，**不具备独立性**（R7 的『删叶子不可能破坏验证』不成立）」。
- approval_binding: 同上
- facts_and_constraints: 审查者 R7 明确「批次 1 删无生产 reader 的叶子对象，删它们不可能破坏任何验证」「批次 3 才删新鲜度/失效链，因为它目前挂在证据产物上」「批次 4 最后改阶段终态语义与 status 形状」。
- Logic: 先删无风险的 -> 再重建记录 -> 再动语义 -> 最后治理与验收；每批都能独立跑通
- choice_reason/impact: 决定路线图的骨架（进入 build-prd 的主要产物）。
- consequences_and_risks: 中间态会有「旧机制删了一半」的时期，每批必须能跑通。
- rejected_alternatives: 2 个大任务（第一个体量偏大，易重蹈大任务覆辙）；8 个小任务（任务自身开销变成新成本）。
- unresolved_items/owner: 每个任务的具体体量与验收细节由 build-prd 定义。
- Supersedes: none

```text
module: 落地路线
requirement_ids: [R-005, R-010]
derived_from: [D-015]
artifacts: [plan.md, tasks.md]
```

#### D-019
- question/final_option: 本任务交付到哪？→ make-decision 定方向，build-prd 出完整路线
- recommendation/plain_language: 这个任务不删任何代码。它把方向定死、把路线画出来；真正的删除由后续三个任务分批做。
- decision: 本任务（`workflowhub-mechanism-simplification-20260910`）只产出方向与路线设计，不实现；build-prd 承接并设计完整方案路线。
- source_type/reference/exact_excerpt: 用户 R-010 原文：「最终目标不是一个任务完成所有工作，而是make-decision后接build-prd设计一个完整的方案路线」。
- approval_binding: 同上
- facts_and_constraints: 前两次「简化」都是单任务大改（83 文件 / +9,063 行），结构性条目全部延期。
- Logic: 大任务切分错误是前两次失败的首条根因 -> 本任务只做设计 -> 实现分批
- choice_reason/impact: 决定本任务的完成标准。
- consequences_and_risks: 方向确认后需要 build-prd 阶段真正把路线写细。
- rejected_alternatives: 本任务直接开删（重蹈大任务覆辙）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 落地路线
requirement_ids: [R-010]
derived_from: [D-018]
artifacts: [spec.md]
```

#### D-020
- question/final_option: 草案完全没提、但会让整改失败的连带面有哪些？→ 四条必须显式进路线
- recommendation/plain_language: 有几处「拆了这边、那边就断」的暗线，草案里一个字都没写。不写清楚，整改一定会在半路卡住，然后又补一层绕过——这正是前两次的剧本。
- decision: 以下四项必须在 build-prd 路线里显式登记、在对应批次处理：
  1. **CI 守卫链**：`npm run check` 从没被提及。`tools/cli/check-task-record-paths.mjs` 有**两张按文件路径硬编码的授权表**，覆盖 `write-boundary-preflight` / `task-store` / `quality-store` / `workflow-evolution` / `core/task-close` / `review-materials` / `review-runner` 等 —— 删除或搬动其中任一文件，守卫即失败。→ 每批必须同步改这两张表，或把表改成按职责而非按路径。
  2. **`check-extensibility.mjs` 用 `scanCoreFiles()` 的 content hash 度量 runtime 零改动**，与 D-009①「去掉哈希」直接冲突。→ 必须在任务Ⅲ 一并处置，否则「删哈希」和「核心零改动检查」二者必有一废。
  3. **`core/task-close.mjs` 依赖 `deriveCurrentProductRelease`（`:1959`）与 `delivery.quality_gaps`（8 处）**，且 `validateRiskCloseQualityReasons` 要求 `risk_close` 与当前 `quality_gaps` **完全一致**（`:1772`）。→ 删投影而不改 close，会直接破坏 close。D-012 必须包含 close 侧的改造，不能只改 status。
  4. **测试暴露面**：`snapshot_tree` 84 文件 / 589 命中、`materialRevision` 20/114、`evaluateFactFreshness` 10/48、`index.json` 11/72、`step_outcomes` 17/41；而 `AGENTS.md` 禁止全量回归。→ 每批必须给出**受影响测试清单**并只跑这些；纯删除类里最低风险的是 `validateReviewBudget`（1 文件 / 7 命中）。
- source_type/reference/exact_excerpt: detail 审查 item 8 原文：「(a) `npm run check` 链从没被提及；`check-task-record-paths.mjs` 有**两张按文件路径硬编码的授权表**……删或搬任一文件即守卫失败；(b) `check-extensibility.mjs` 用 `scanCoreFiles()` **content hash** 度量 runtime-zero-diff，与『去掉哈希』直接冲突；(c) **core/task-close.mjs** 依赖 `deriveCurrentProductRelease`(:1959) 与 `delivery.quality_gaps`(8 处) 且 `validateRiskCloseQualityReasons` 要求 risk_close 与当前 quality_gaps **完全一致**(:1772)……(d) 测试暴露面 snapshot_tree **84 文件/589 命中**…」。
- approval_binding: 同上
- facts_and_constraints: 上述计数与路径均为 detail 审查在生产代码上的实测 grep 结果。
- Logic: 整改表面是删对象 -> 实际牵动守卫表/CI 度量/close 依赖/测试矩阵 -> 不显式登记就会在半路发现 -> 半路发现就会临时补一层 -> 就是第三次净增
- choice_reason/impact: 决定路线是否可执行。
- consequences_and_risks: 每批的改动面因此变大，必须按 D-018 修订后的「同一文件同批」原则重新划批。
- rejected_alternatives: 先删再说，遇到问题再补（前两次的剧本）。
- unresolved_items/owner: 两张授权表的「按职责改写」方案由任务Ⅰ 产出（owner：任务Ⅰ）。
- Supersedes: none

```text
module: 落地路线
requirement_ids: [R-004, R-005]
derived_from: [D-018]
artifacts: [plan.md, tasks.md]
```

#### D-021
- question/final_option: 审查 provenance 与降级门槛要不要收紧？→ 要，三条实测漏洞
- recommendation/plain_language: 这次审查实测暴露三个问题，都会让「审过了」变成假话：①provider 其实已经审出 22 条问题，但调用方没收到，这种情况现在的三个状态装不下；②「读都没读到材料就失败」也算「provider 真实失败」，可以骗到降级资格；③号称「异源」的 provider 里有一个底层模型跟审查者自己是同一个。
- decision: ①`review_origin` 增加一个已实测必要的取值以区分「已派出但未收齐」；②降级门槛由「有真实 provider 失败」收紧为「**已收到并读取材料之后**才失败」；③`minimum_heterologous` 的判定必须按**底层模型**而非 provider 名；④provider 被派出但失败时，`provider_results` 必须保留每个 provider 的真实身份与逐 provider 错误，不得折叠成一条组级错误码。
- source_type/reference/exact_excerpt: detail 审查追加项 X1/X2/X3。X1：「provider 已产出 22 条 finding、调用方未收取 → 既非 conducted 也非 not_run」；X2：「`ATTACHMENT_DELIVERY_UNSUPPORTED` 发生在**读到任何审查字节之前**，却满足 D-007①『真实 provider 失败』字面条件而获得降级资格」；X3：「被 route 计入 `minimum_heterologous:1` 的 `pi/v4flash` 底层模型是 `deepseek-flash`，**与本审查子代理同一模型**」。
- approval_binding: 同上
- facts_and_constraints: 本轮实测：3 个 provider 完成（grok 12 条 / pi 7 条 / antigravity 3 条，共 22 条 finding），codex 失败于 `ATTACHMENT_DELIVERY_UNSUPPORTED`；CLI 被外层 `timeout 900` 杀死，未写 stdout、未建 sink，因此**没有 wh-review 正式结果**；22 条 finding 从 broker 运行树恢复，属**未记录证据**，不得当作正式质量事实。
- Logic: 实测三个漏洞都让 provenance 失真 -> 逐个收紧 -> 且不新增对象（`review_origin` 枚举值、门槛一句话、provider 身份复用已有字段）
- choice_reason/impact: 决定「审查事实」是否可信。
- consequences_and_risks: `provider_results` 保留逐 provider 身份会增加少量记录体积，但这是 AGENTS.md 明文要求（provenance 必须保留）。
- rejected_alternatives: 保持现状三态（装不下已实测的真实情形）；按 provider 名判异源（同模型会被算成异源）。
- unresolved_items/owner: 22 条 finding 若要成为正式质量事实，须由主会话补一次能走完并落 sink 的收取；在此之前它们只是未记录证据（owner：本任务）。
- Supersedes: none

```text
module: 审查生命周期
requirement_ids: [R-006, R-008]
derived_from: [D-006, D-007, D-008]
artifacts: [spec.md#FR-018]
```

### Module I：第 4 轮收敛新增决定（Talk round 4 实答）

#### D-022
- question/final_option: 审查生命周期怎么改写？→ 每 Phase 保留 1 次核心审查；废除「追查到 findings 清零」的循环；只有大改动才允许一次 focus 复审
- recommendation/plain_language: 每个 Phase 该审还是要审，但**不要求审到没有 findings 为止**。审一次，拿到 findings 就往下走；只有出现大改动才再来一次 focus。审查是帮着找问题的流程，**做过就算数**。
- decision: ①build-code 每个 Phase 保留 **1 次核心审查**（per-stage 审查标准不变）；②**删除「反复重审直到 findings 清零」的语义**；③只有**大改动**（跨越原审查覆盖面：接口、schema、安全边界、公共契约）才允许一次 focus 复审；④「小修后再审」不再触发。
- source_type/reference/exact_excerpt: 用户 Talk round 4 Q20 原文：「所有代码都开发完成再审查的话，返工成本太大了。虽然每个 phase 都要审查，但是没必要每个 phase 都审查到没有 findings 为止，和其他 stage 的审查一样，1 次核心审查，如果有大改动再来一次 focus 审查就可以了，没必要改一点点东西就重新审查一次，审查是帮助找 findings 的流程，有做过就可以了」。
- approval_binding: 待 approve-decision 绑定本次 decision-log 与用户真实答复
- facts_and_constraints: 实测 build-code 共 51 次 review attempt / 17 份 manifest（其中 **10 份 unavailable**）/ 24 reports / 11 results；D-009③ 的去重键（本 Phase 本 track 已有 `conducted` 即不再派发）与本决定一致，不需改。
- Logic: 审查价值在「找问题」不在「清零」-> 追零循环把 provider 故障与往返次数放大一个数量级 -> 改为 1 次核心 + 大改动才 focus -> 保留审查质量同时砍掉重复
- choice_reason/impact: 直接回应 D-006「审查不作通关条件」，并把「审查次数」这一零覆盖项定死。
- consequences_and_risks: 中间 Phase 的 findings 可能未被修完就进入下一 Phase；由 D-005 的 `actionable_finding_disposition` 字段如实记录处置，不静默丢弃。
- rejected_alternatives: stage 末只审一次（用户明确反对：返工成本太大）；保持「审到清零」（放大故障面）。
- unresolved_items/owner: none
- Supersedes: 修订 D-009③ 的复审触发条件（去重键本身不变）

```text
module: 审查生命周期
requirement_ids: [R-003, R-007]
derived_from: [D-006, D-009, D-010]
artifacts: [spec.md#FR-019]
```

#### D-023
- question/final_option: 质量投影与 status 读取来源？→ 投影全删；status/close 只读 canonical 输出
- recommendation/plain_language: 不要质量投影。`quality/verify.json`、release 投影这些「再存一份质量结论」的东西全部收掉；status 也不许自己到处扫目录，只读 canonical 输出。
- decision: ①`quality/verify.json` 与 product-release 投影（`deriveProductRelease` / release reasons）**一起收掉**，不再作为独立对象；②只保留 `facts.jsonl` + 被引用的原始证据；③**status/close 只读 canonical 输出，禁止自行扫描旁路目录**；④改动与 `core/task-close.mjs` 的 `quality_gaps` 依赖**同批**完成。
- source_type/reference/exact_excerpt: 用户 Talk round 4 Q21 原文：「我不要什么质量投影，纯纯的流程垃圾，浪费时间和token，产生阻塞和冗余的垃圾设计」；Q26 = A。
- approval_binding: 同上
- facts_and_constraints: 实测 `quality/verify.json` **至今没有任何一次真实产出**（真实 store 仍是 `status=unknown` 初始化形状）；`deriveProductRelease` 把 1 个根因展开成几十条 reason（30 条里只对应 2–4 个真问题）；status 一次操作重复读 quality facts 2 遍、stage outcomes 3 遍。
- Logic: 投影无功能 consumer 且是阻塞与红字的主要来源 -> 连对象一起收 -> 读取来源固定为 canonical -> 红字不再被旁路文件重新灌满
- choice_reason/impact: 这是「一个根因几十条红字」的根治，也是 D-012 的读取侧补全。
- consequences_and_risks: 需要改完成判据里「只认 verify.json 字节」的读点，属 public 行为；`core/task-close.mjs` 若不同批改会直接坏。
- rejected_alternatives: 保留 verify.json 并给它真 reader（正是审计说的「第二个权威读模型」）；保留但只展示（又一个 print-only）。
- unresolved_items/owner: none
- Supersedes: 补全 D-012 的读取来源；收掉 D-013 未覆盖的 verify/release 投影

```text
module: 保留项与展示
requirement_ids: [R-003, R-006, R-007]
derived_from: [D-012, D-013]
artifacts: [spec.md#FR-020]
```

#### D-024
- question/final_option: 入口与外部变化契约？→ 路径单一来源；main 变化只报 stale
- recommendation/plain_language: task 目录只由「项目 + 任务号」解析出来，别的地方不许自己拼路径（上次就是这里把 close 卡死了）。任务期间主线前进了，不许装作没看见——如实报「已过期」，但不冻结、不强绑。
- decision: ①所有入口统一为「`project` + `task_id` → 唯一 config resolver → canonical task path」；`--task-path` 降为**受控诊断 override** 并记录来源；②任务期间 main 前进**不冻结 base OID**，只要求「**不许静默使用旧快照，必须报 stale**」。
- source_type/reference/exact_excerpt: 用户 Talk round 4 Q25 = A。事实：close 曾因省略 `--task-path` 时的路径解析缺陷真实卡死最后一步（已有修复提交 `e13b10b3`）；「任务期间外部世界变化」是 8 份文档里唯一一类此前 21 条决定与 29 条 OI 都未覆盖的根因。
- approval_binding: 同上
- facts_and_constraints: 现有 `check-task-record-paths.mjs` 的两张按路径硬编码授权表（D-020①）与本决定同批处理可减少一次改动。
- Logic: 多源路径解析 -> 真实事故 -> 收敛为单一来源；外部变化不可控 -> 不假装可控，只要求如实报 stale
- choice_reason/impact: 决定「开工到收口」的入口契约与外部变化的可见性。
- consequences_and_risks: ① 动的是全部 CLI 入口，测试面大；② 需要一处显示 stale 的位置（并入 status 根因行）。
- rejected_alternatives: 冻结 base OID + 一次受控 rebase（给每个任务加新状态，与净减法相左）；只登记不处理（路径错卡死 close 无防护）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 唯一状态层
requirement_ids: [R-006, R-008]
derived_from: [D-004, D-020]
artifacts: [spec.md#FR-021]
```

#### D-025
- question/final_option: close 收口链 + build-prd 类非正式阶段怎么收口？→ 前置检查提到 commit 前；非正式阶段只保证自己的材料
- recommendation/plain_language: close 之前先把该检查的查完（sidecar、能不能干净合并、允许清单、远端对象），再动手提交——上次是先提交才发现 86 个 sidecar 和 5 组合并冲突，白返工两轮。另外 build-prd 这种便携工作流，别拿正式阶段的完成谓词来考它，它只要保证自己的材料对就行。
- decision: ①sidecar 发布 / merge 预检 / 允许清单 / 远端对象检查**提到 commit 之前**，用现有命令的顺序，**不新增 `close --preflight-only`**（public runtime 仍只有七类行为）；②build-prd 类 `non_stage` 工作流只保证自己的材料与事实，**不按 5 个正式阶段的谓词收口**；③`prd.md` 明确**永不产出**（不新增第五份材料）。
- source_type/reference/exact_excerpt: 用户 Talk round 4 Q24 = A。事实：上次 close 第一轮撞 **86 个 worktree-only sidecar**，第二轮撞 **5 组冲突文件**，而整改要动的 `review-record-route.mjs`（D-010 唯一执行点）与 `simple-review-runner.mjs`（D-008 改文案处）**正在那 5 组里**；build-prd 是 `non_stage` 却被 5 阶段谓词考核，close 一直要求一个设计上拒绝产出的 `prd.md`。
- approval_binding: 同上
- facts_and_constraints: `docs/standard-workflow.md` 的 close 三义已写明「close 只记物理事实、不写质量结论」，与本决定一致。
- Logic: 两轮 close 返工的成因是检查顺序 -> 提到 commit 前 -> 省两轮；非正式阶段被正式谓词考核是设计错配 -> 明确各自的收口口径
- choice_reason/impact: 决定整改自己会不会在 close 时重演返工，以及下一阶段（build-prd）的完成标准。
- consequences_and_risks: close 前多几步，感觉慢一点，但能省两轮返工。
- rejected_alternatives: 新增 `close --preflight-only`（违反「不新增 public command」与 vNext 七类边界）；让 build-prd 补齐正式阶段质量（会让它变成「一个任务包办六件事」，正是审计的第一根因）。
- unresolved_items/owner: none
- Supersedes: none

```text
module: 落地路线
requirement_ids: [R-005, R-010]
derived_from: [D-018, D-020]
artifacts: [spec.md#FR-022, plan.md]
```

#### D-026
- question/final_option: 卡文件数上限怎么定？执行面四条与仓外能力怎么处置？→ 卡文件数只作建议；执行面四条编入批次⑨；仓外能力按 non_goals 明确排除
- recommendation/plain_language: 这一轮不留任何「以后再说」：仓库里能做的全部编进批次，仓库范围外的（宿主/broker）明确说清「这不是本仓的东西」并写明影响面。
- decision: ①**卡文件数上限只作建议**（超过 10 个生产文件时 build-plan 必须写明为什么必须一起改，但不拦截）；②**执行面四条编入任务Ⅱ 批次⑨（本轮修订：不再延期）**：慢测试切分（三层节奏 + 硬时间预算）、同命令去重（同输入不重复启动）、超时保留已完成部分（timeout 不抹掉已完成的 provider member / 已跑完的测试文件）、开工前 preflight（命令与路径存在性、provider/host 能力、packet 体积在昂贵动作前校验）；③**宿主能力缺口**：明确定成「**不在本仓库范围内**」（它属宿主/broker 实现，不是 workflowhub 仓内的可交付物），按 `non_goals` 登记并写明理由与影响面，不阻断任何阶段结束；④任务粒度（seam 级 / wave / write-set）写成 build-prd 材料纪律的**必填小节**（不是延期项，是本阶段就要写出来的东西）。
- **修订（用户要求：本任务本身就是 PRD 类规划任务，不产出延期项）**：原 ②③ 的「延期 + 触发条件」表述**全部撤销**。凡在本仓库范围内可交付的，一律编入批次；凡不在本仓库范围内的（宿主/broker 能力），按 `non_goals` 明确排除并写明理由与影响面，**不以「延期」形态留在材料里**。
- source_type/reference/exact_excerpt: 用户 Talk round 4 Q27 = A、Q28 = A、Q26 = A；**用户后续明确要求**：「要，我不希望有延期任务，当前任务本身就是prd类规划任务」。
- approval_binding: 同上
- facts_and_constraints: 执行面四条可直接归因的最大几笔浪费：两个 900 秒超时 + 一次 1,717.39 秒的单次门 + 同一命令至少启动 8 次；**这四条不需要任何新对象即可治理**（慢测试切分=改命令分组；命令去重=复用现有 fingerprint 判定；超时保留=现有 member 落盘点；开工前 preflight=已有 `dispatch_state` 与错误文案）。宿主实测拿不到 Stage Agent 过程数据与「需求来源认证」，且 broker→caller 腿的 `PROTOCOL_INCOMPATIBLE` 属宿主/broker 实现。
- Logic: 规划任务的产出必须完整 -> 「延期」等于把已知问题留给未来 -> 仓内可交付的一律编入批次；仓外的明确排除并写明影响面 -> 材料里不留「以后再说」
- choice_reason/impact: 决定路线图是否完整、以及 R-006「未来不要再出现类似阻塞」是否可验收。
- consequences_and_risks: 任务Ⅱ 增加一个批次，改动面变大；但四条都是纯工程改造，不依赖任何语义变更，可独立验收。
- rejected_alternatives: 保留「延期 + 触发条件」（触发条件写成「出现同型浪费复现证据」= 再犯一次才处理，与用户要求冲突）；把仓外的宿主能力也硬编成仓内任务（不可交付）。
- unresolved_items/owner: 批次⑨ 的具体任务卡由 build-prd 出；宿主能力缺口登记为本任务的 `non_goals` 并写明影响面。
- Supersedes: 撤销 D-026②③ 的延期表述
- approval_binding: 同上
- facts_and_constraints: 执行面四条可直接归因的最大几笔浪费：两个 900 秒超时 + 一次 1,717.39 秒的单次门 + 同一命令至少启动 8 次；且这四条**不需要任何新对象**即可治理。宿主实测拿不到 Stage Agent 过程数据与「需求来源认证」。
- Logic: 原两条都被写成「延期/不设数字」-> 用户要求规划任务不留延期 -> 仓内可交付的编入批次⑨，仓外的按 non_goals 排除并写明影响面 -> 路线图无悬空项（材料里不再有 deferred 条目）
- choice_reason/impact: 决定本任务与后续任务的边界。
- consequences_and_risks: 大单元可能重现（上次 83 文件 / +9,063 行）；那几笔浪费下一轮可能再发生——已登记触发条件，不静默丢弃。
- rejected_alternatives: 卡文件数硬拦截（新增卡级硬门，与用户要求与 D-005 冲突）；执行面四条本轮纳入（范围明显扩大）；宿主缺口「不修就不算完成」（与用户要求相反）。
- unresolved_items/owner: 执行面四条的 owner = 后续任务；触发条件 = 出现同型浪费复现证据。宿主缺口 owner = 登记在案，无修复计划。
- Supersedes: none

```text
module: 边界
requirement_ids: [R-005, R-006]
derived_from: [D-015, D-018]
artifacts: [spec.md#FR-023]
```

#### D-027
- question/final_option: 第 5 轮独立覆盖审查发现的四个「零防护」缺口与两个对象族缺口怎么补？→ 按 7 条逐一补，全部零新增对象
- recommendation/plain_language: 第五轮审查（独立子代理，只读）指出：删掉的东西本身会**制造**新缺口，而且有两整类阻塞在方案里一条防护都没有。这七条必须现在补，否则下一轮会以新形态复现。
- decision: 七条：
  1. **「没有生产者」必须显式报缺**：验收型产物（AC 结果、oracle 承诺的引用、verification-only 卡）若没有 producer，必须在 K2 行如实写 `producer_missing`，**不许因为没有投影可读而静默通过**。owner = 该 stage 主会话；这一条同时补 A8（8 份文档审计「完全无防护」第 1 条）。
  2. **删除发布路径的自动重发（修闸工具箱）**：`protocol-error-whitelist.mjs`（216 行 / 18 条 `class_id`）+ 分类后自动重发一次 `publishStage()` + 失败 trace，整组删除；发布失败就如实失败。（补 N-001-l 无落点、D-018① 未列）
  3. **runner / validator 族给出减法落点**：`stage-runner.mjs`、`stage-content-contracts.mjs`（6,485 行）、`stage-outcome` 阶段级对象、`canonical-evidence-validators.mjs` 与 `canonical-receipt-writer.mjs` 的存活部分，**随被删对象一起收缩**；规则 = 不得保留「为已删对象服务的校验」，且 288 个 validate/assert/check + 1,412 个 `throw` + 97 个错误码必须给出**族级净减目标**（不设数字，给规则）。
  4. **半提交语义**：K2 行写入失败 / 写一半 → 如实记失败、阶段完成声明不成立，**不阻断同 task 修复**；写后立即读回一次并核对（复用 `task-kernel-implementation.mjs:807` 已有的 read-back 模式）。补 OI-022。
  5. **冲突与幂等语义**：同一身份多个结果 → 显式 `conflict`，**禁止折叠成 `missing`**；同身份同内容重放 → 复用已有行、不新增（幂等）。这是删除 currentness/selector 后**必须**搬到 K2 上的语义（补 D6，8 份文档审计「完全无防护」第 2 条）。
  6. **编排/上下文类首次给出防护**：把「主会话只收摘要、子代理一次一责、恢复只读 K2 不重扫历史」写成 build-prd 材料必填小节的**可核对产出**（子代理回传须带 ref + ≤500 字摘要）；**handoff 读取面定界**为「只读 K2 与四份材料，禁止默认重扫 transcript / MEMORY」。owner = 任务Ⅲ + build-prd。这一条补整类零防护的 E 类（5 条）。
  7. **review packet 体积与 compact projection**：审查输入设**体积上限**，超限只发 compact projection（**零新对象**，复用现有 packet 机制）；禁止整包重发。补 F4（8 份文档审计「完全无防护」第 4 条）。
- source_type/reference/exact_excerpt: 第 5 轮独立覆盖审查（原始需求覆盖审查 75%、8 份文档去重后 59 条 = addressed 32 / partially 20 / **not_addressed 4** / rejected 3）。审查原文：「**整类零防护**：E 编排/上下文类（5 条 0 addressed）——唯一在 D/OI 层面没有任何硬防护的阻塞类型，且与 R-003『超过 50% 花在机制上』直接相关」；「方案拆掉了原本承担冲突语义的 currentness 与 selector，却没把『同身份多结果怎么办』搬到 `facts.jsonl` 上……这是删除动作**自身制造**的新缺口」。
- approval_binding: 同上
- facts_and_constraints: 四条「完全无防护」= ①无生产者类（[5][6][7]）②conflict→missing/幂等（[6][7]）③handoff 读取面（13m27s 误扫、1.25GB corpus）④review packet 体积（665KB → `prompt too long`；407,560 B → 1,008,828 B）。E 类 5 条 0 addressed；F 类 8 条仅 1 addressed。
- Logic: 删除动作会移除原有语义的承载层 -> 若不显式搬走，语义以「静默通过」或「再刷新一次」的形态复现 -> 七条把语义搬回唯一记录层与材料纪律，且全部零新增对象
- choice_reason/impact: 直接决定 R-006「未来不要再出现类似阻塞」是否可验收。
- consequences_and_risks: 第 7 条需要改审查输入侧（public 行为）；第 6 条靠材料纪律而非机器强制（与 D-013 同样的取舍，刻意选择）。
- rejected_alternatives: 保留修闸工具箱（正是宪法 F10 的反例形态）；新增 `producer` 对象或 `gap record` 对象（撞「不新增持久化对象」）；给 packet 体积新增一个预算对象（用现有机制即可）。
- unresolved_items/owner: 第 3 条的族级净减目标由任务Ⅰ 给出具体清单；第 6 条的 handoff 契约由任务Ⅲ 定稿。
- Supersedes: none

```text
module: 边界
requirement_ids: [R-006, R-007, R-008]
derived_from: [D-013, D-018, D-022, D-023, D-026]
artifacts: [spec.md#FR-024, plan.md]
```

#### D-028
- question/final_option: 第 5 轮冗余实测发现的 9 类漏删对象、5 处失效结论、5 个漂移数字、5 项遗留负担怎么处置？→ 全部登记并写入批次，不改方向
- recommendation/plain_language: 第五轮实测发现：删除清单方向对，但**漏了 9 类真冗余**（其中 3 类与已点名对象同量级），**3 处结论在合并后已失效**，**7 个数字里 5 个对不上**。最关键的一条：**按现有清单删完，那个 6,806 行的巨型校验引擎仍然原样在**——宪法拿它当永久警示的形态，整改后还成立。这不是方向错，是清单不完整，必须补齐。
- decision: 五条：
  1. **删除清单补 9 类**（见「第 5 轮独立复核」节的 R1–R9）：`runtime/evidence/` 8 个零 importer 死模块、34 个死导出、16 个零调用者工具、`task-index.mjs`、`workflows/verify-code/*.mjs` 4 个未 import 文件、4 类重复实现、4 张 CI 授权表、3 处治理文档矛盾、`quality_gaps` 10 处与 bridge 未登记。**全部零新增对象。**
  2. **5 处失效结论按更正版施工**（N-001-u/v/w/x/y/z）：`stage-reflection` 已有 reader → 不再是新建；`verify.json` 是完成谓词 → 同批改 `completion-predicates.mjs:1124-1132`；`index.json` 5 写 6 读；`task-fact.v1.json` 从未被加载、校验是手写 → 改 `validateFact` 而非改 schema；`facts.jsonl` 的 `monitoring-fact.v1` 零生产者分支先删；净减法基线改用 HEAD 实测值。
  3. **遗留负担 Z1–Z5 写进路线**：`stage-content-contracts.mjs`（6,806 行）与 `runtime/stage/` 三个巨人**必须给出主体级减法落点**，不能只删它们的死导出——否则 R-006「不要再出现越来越难维护的对象」不成立。落点方式：随被删对象收缩（不整体重写），并给出**批次级的行数净减目标**。
  4. **批次③扩围**：D-018 任务Ⅰ 批次③ 除 `task-store.mjs` / `quality-store.mjs` / `task-kernel-implementation.mjs` 外，**必须同批包含** `completion-predicates.mjs`（verify 谓词 + index 读点）、`stage-handoff.mjs:291-330`（哈希链与写口核对同段，对应 Z5）、`task-index.mjs` 删除。
  5. **治理文档三处矛盾同批修正**（属 D-014 范围）：不存在的顶层 `schemas/` 引用、`audit-contracts.md` 把死 schema 称权威、**`package.json` 的 `npm test` 与 `AGENTS.md`「禁止全量回归」直接冲突**。
- source_type/reference/exact_excerpt: 第 5 轮冗余实测子代理（HEAD `216a546d`，只读，import 图遍历全部 155 个生产 `.mjs`）。原文：「**`runtime/stage/stage-content-contracts.mjs` 依然是 6,806 行 / 365,862 B 的单文件**。方案只删它的 7 个死导出（B5），主体不动；`CONSTITUTION.md:80` 的 F10 反例（单个 gate 引擎 6000+ 行）在整改后仍然成立。这是最大的一处未处理负担。」
- approval_binding: 同上
- facts_and_constraints: 数字更正见 N-001-z；`stage-handoff.mjs:305 readRecord` 与 `stage-runner.mjs:1109 publishStageHandoff` 为新增消费面；`completion-predicates.mjs:1124-1132` 为 verify 完成谓词。
- Logic: 方向正确但清单不完整 -> 漏删的对象会在整改后被当成「剩下的机制」继续维护 -> 5 处失效结论会让批次③ 半路炸 -> 全部登记并扩围 -> 零新增对象
- choice_reason/impact: 决定「净减法」是否真的成立，以及 R-006 是否可验收。
- consequences_and_risks: 批次③ 与批次扩围后改动面变大；`runtime/stage/` 三个巨人的主体减法需要单独的收窄方案（由 build-prd 细化）。
- rejected_alternatives: 只删死导出、不动巨人主体（F10 反例整改后仍成立）；照旧结论施工（会在批次③ 半路失败）。
- unresolved_items/owner: Z1/Z2 的主体级减法方案由 build-prd 出；R6 的常量合并清单由任务Ⅰ 出。
- Supersedes: 更正 N-001-d/p/q 的残留部分与 T-5 的 schema 表述

```text
module: 落地路线
requirement_ids: [R-004, R-006, R-008]
derived_from: [D-002, D-018, D-020, D-023, D-027]
artifacts: [spec.md#FR-025, plan.md, tasks.md]
```

#### D-029
- question/final_option: 第 5 轮真实 provider 细节审查的 8 项裁决 + 7 项追加 finding（含 5 个 blocking）怎么处置？→ 16 条逐一处置，其中批次表与审查通道两条必须改决定文本
- recommendation/plain_language: 这轮真实 provider 审查（虽然通道最后挂了）挖出五个阻塞级问题，最要命的两个：**①我们的批次表是坏的**——批次② 根本没定义，八条决定没有落进任何批次，「每批都能独立跑通」这句话不成立；**②我们赖以成立的那条审查通道自己不可用**——审查包缺了必需的 lens、合同要求的字段被允许名单拒绝、provider 腿健康但调用方腿稳定失败。这两条不改，整改一定半路撞墙再补一层。
- decision: 16 条：
  1. **四层状态消自指**：写死四层状态由 **close/status 侧的单一计算者**产出并写入事实行，**禁止 stage 自算自写**；命令组限定「真实执行过的外部命令」，纯设计阶段允许显式 `none`；给事实行**字段数上限与嵌套分组规则**。
  2. **防套话降级为材料纪律**：承认它**不可机器执行**（`readTaskFacts` 生产侧零调用点，机器识别=新增校验层撞 F11），并入 D-013 同一句守卫，不再假装它是完成判据的一部分。
  3. **审查去重键改为元组 `(stage, phase_id, track, review_kind, origin)`**（修 D-022 与 D-009③ 的正面矛盾：旧键会永久锁死 focus 复审）；写死「大改动」的**判定人与误判后果**；补齐 `review_origin` **第 5 个取值的字面量名**。
  4. **status 读取来源枚举为具名 ref 集合**写进 D-023；把 `initializeTaskStore` 的 createOnly 写（`task-store.mjs:261-264`，调用点 `task-bootstrap.mjs:38,80`）、`task-handle.mjs:417` 硬编码 special case、`public-behavior-baseline.mjs:226,265` 与批次③ 绑**同批**。
  5. **事实行拆分规则**：稳定外壳（`task_id`/`stage`/`phase_id`/`kind`/`at`）+ 按 `kind` 分子对象；写死「新增字段须先登记消费者」与量化拆分阈值。
  6. **「不采纳清单」升级为治理文字**：进 `CONSTITUTION.md` 负向条款（D-014 的 F5/F11 旁）+ `constitution-checklist.md` 一条对照项；decision-log 只留来源引用；给清单 owner 与核对点。**不再只写在 decision-log 里。**
  7. **批次表重建**（修 blocking）：补**批次② 定义**；把 D-011①/D-011②/D-024/D-025/D-026、D-005/D-006 的阶段完成谓词删除、D-009① 的 6 个 `workflows/*/skill-deps.yaml`（47 处 `material_revision`）、D-014 的 `verify-structure.mjs:14-17`、`AGENTS.md:58`、`move-map.json`（362 entries）、`control-plane-inventory.json`、`public-behavior-baseline` **逐项显式编入批次**；加「同文件同批」约束；划批前先跑受影响面清单。
  8. **不可证伪声明**：显式声明哪些结论本轮**不可证伪**（M1/M2 需新任务复测、M3 跨任务规模不可控、D-013 自指在零产物下恒为 0），并以 `unknown` 登记；M1/M2 的复测**编入批次⑧ 的验收动作**（不写成「以后再看」）；「链路功能验收」正式写成 **D-015③**（此前只是 OI-017 的一行问题）。
  9. **CI 守卫链扩围**：`check-skill-closure.mjs:154,290`（把 `material_revision`/`snapshot_tree` 写死为强制值，删 D-009① 会**直接挂 `npm run check`**）、`public-behavior-baseline`、`move-map.json`、`control-plane-inventory.json`（由 `control-plane-governance.test.mjs` 强制）与测试暴露面（`snapshot_tree` 155/79、`materialRevision` 43/23、`step_outcomes` 31/17、`workflow-evolution` 28/18、`verify.json` 20/12、`index.json` 21/10、`evaluateFactFreshness` 13/10、`publishVerifySummary` 7/4）全部编入对应批次。
  10. **治理文字冲突修正**：`AGENTS.md:44/:58` 明写保留 `index.json` 与 `quality/verify.json`，与 D-004/D-023 **直接冲突** → 批次⑦ 必须包含 `AGENTS.md` 与 `CLAUDE.md`。
  11. **审查包缺 lens 必须先修**：detail 包**必须交付 `skills/`**（`contracts/make-decision.md` 与 manifest 的 `required_skills_by_track.detail` 都要求 `simplicity-guard` P0–P3 lens，本 run 未交付 ⇒ simplicity 轴从未执行）→ 修 runner 的 packet 组装，**或在修复前把缺 lens 如实记成 `incomplete`**。
  12. **形似契约由「三套」改为「四套」**：detail 合同强制的 `oi_terminal_records`/`confirmation_groups` 不在强制 allowlist，实测传它 `MATERIAL_FORBIDDEN`（0 provider 被调用）→ D-008① 的计数与修法范围同步更新。
  13. **`dispatch_state` 提到聚合面**：它现在只在 `role_results.red/blue` 内，顶层与「provider 派出后失败」同形 → D-008③ 必须同时改聚合面。
  14. **审查通道失败升级为「必须修」**：本 run 在 red+blue **两 role 同时**复现 `PROTOCOL_INCOMPATIBLE` 且 `provider_results=[]`，T-8 的「未复现/间歇性」**不成立**；且 `DEFAULT_MANAGED_TERMINAL_WAIT_MS=null` + 无停滞检测导致 **37 分钟空转且永不返回** → D-021④ 由「登记」升级为**必须修**，并加**有界等待**要求（「去掉外层 timeout」≠ 有界）。
  15. **异源判定层与比较键写死**：现为精确字符串相等（`third-review-host-config.mjs:642-647`），裸 adapter `codex` 与 `codex/luna` 不等 ⇒ 曾「什么都没排除」→ 必须按**底层模型**判定并写明比较键。
  16. **D-003 区分两类对象**（修误删风险）：`stage-outcome-proofs`（内容无 reader）**删**；`stage-outcomes/<stage>/*.json`（**status 与 acceptance 绑定的真实输入**）是 K2 行的数据源之一，**必须先迁移再删**，不得随「每步证据」一起删。
- source_type/reference/exact_excerpt: 第 5 轮 detail 审查报告（`/tmp/wh-msd-r2-detail-review-report.md`，sha256 `1322c127…`）。审查原文：「D-018 的批次划分与真实依赖闭包不一致——批次② 无定义、D-011/D-024/D-025 无批次、`material_revision`/`snapshot_tree` 在 6 个 workflow 声明与 `check-skill-closure` 里被硬编码为强制值却未登记，导致『每批都能独立跑通』不成立，整改必然半路撞守卫再补一层（正是前两次的剧本）」；「detail 合同要求的 `oi_terminal_records`/`confirmation_groups` 被强制 allowlist 拒绝（实测 `MATERIAL_FORBIDDEN`）、强制的 `simplicity-guard` lens 从未随包交付……『审查已如实记录』这条完成依据**目前既不可提交、也不可核验**」。
- approval_binding: 同上
- facts_and_constraints: provider 腿健康（6 次真实往返、antigravity 两次 completed 共 13 findings、grok 一次 `PROVIDER_HEALTH_FAILED` 2,235,659 ms、codex 两次 `ATTACHMENT_DELIVERY_UNSUPPORTED`），caller 腿稳定失败；13 条回收 finding 属**未记录证据**，不得引用为已记录审查事实。
- Logic: 批次表坏 + 审查通道坏 -> 两条都是「整改赖以成立的前提」-> 不修则必定半路撞墙 -> 逐条修并扩围 -> 方向不变、可执行性成立
- choice_reason/impact: 决定整改能否真的「每批独立跑通」，以及完成声明是否可核验。
- consequences_and_risks: 批次③/⑦ 明显扩围；审查通道修复与有界等待属 public 行为改动；第 8 条的「不可证伪」需在验收里如实写成 `unknown`。
- rejected_alternatives: 只登记不修审查通道（D-005/D-017/D-021 的完成依据继续不可核验）；照旧批次表施工（半路撞 `check-skill-closure` 再补一层）；把 `stage-outcomes/<stage>/*.json` 与 proofs 一起删（会删掉 status 的数据源）。
- unresolved_items/owner: 批次② 的具体内容由 build-prd 细化为可执行任务卡；审查通道修复（packet 组装 + 有界等待 + 聚合面 dispatch_state）由任务Ⅱ 承接。
- Supersedes: 更正 T-8 的「未复现」表述与 N-001-r 的「从未产出」

```text
module: 落地路线
requirement_ids: [R-005, R-006, R-007]
derived_from: [D-003, D-008, D-015, D-018, D-021, D-022, D-023, D-026]
artifacts: [spec.md#FR-026, plan.md, tasks.md]
```

## grill

Grill 于 direction-advice 与 Talk round 3 之后、写决定草案之前执行（技能 `grill-with-docs`），按上游 round/frontier 协议只发**一批互相独立**的问题，使用真实 `ask → wait → 用户回复 → resume → 重排` 生命周期。详细问答见 `### T-6 Grill`。

- 批次规模：**5 个独立决策轴**（审查契约整改形态 / 宪法是否同步修订 / 后续任务切法 / analyze-reflection 的 reader / 历史基线取哪几个）。
- 用户答复：G1–G5 **全部选 A**（推荐项）。
- 覆盖矩阵（五类原始消息）：目标与成功意图 → OI-007/OI-017；用户旅程与入口范围 → OI-021/OI-026/OI-028；数据与状态 → OI-008/OI-013/OI-022/OI-029；成功失败与验收边界 → OI-004/OI-012/OI-017/OI-018/OI-025/OI-027；约束非目标与风险 → OI-020/OI-023。
- **Grill 不产生 review 事实、不写 review finding、不创建 review 结论**：全程未调用 wh-review。
- 无「不提问」的零问题情形：本批 5 轴均会改变方向或范围，故全部发问。

## 审查处置

本阶段共发生 **4 次正式审查事实 + 2 次真实 provider 通道尝试**，逐条处置汇总（明细见对应 T 小节）：

| 来源 | 类型 | finding 数 | 处置结果 |
| --- | --- | --- | --- |
| T-3 direction-advice | 真实 provider 失败 → 降级子代理 | 15（R1–R7 + A1–A8） | 逐条处置；2 条 blocking（A1 方向审查无可用表面、R2 完成语义掏空）分别落到 D-008 与 D-005 |
| T-8 detail-advice | 真实 provider（3 provider 完成，22 findings） | 11（detail-1~8 + X1–X3） | 逐条处置并落到 D-005/D-008/D-009/D-011/D-015/D-018/D-020/D-021 |
| 第 4 轮 8 份文档覆盖审计 | 子代理只读 | 468 条原始 → 459 条判定 | 净缺口 7 条全部落 OI；跨文档冲突逐条裁定 |
| 第 5 轮（原始需求覆盖 + 8 份去重 + 冗余实测） | 子代理只读 ×3 | 覆盖 75% / 59 条去重 / 9 类漏删 | 6 处失效结论更正（N-001-u/v/w/x/y/z）；9 类漏删登记（D-028）；缺失三件（保留清单 / 对象族处置 / 阻塞分类学）补齐 |
| 第 5 轮 detail 真实 provider | 真实 provider 失败 → 降级 | 8 项裁决 + X-A~X-G | 5 个 blocking 全部处置（D-029 十六条） |

**处置原则**：发现的问题**必须在当前 stage 修复**，不静默交给下游；确实修不了的（第 5 轮 detail 审查指出的审查通道自身缺陷）**升级为「必须修」并编入批次④**，不写成延期项。

## 拒绝方案

被明确否决的方案与否决理由（完整表述见各 D 条的 `rejected_alternatives`）：

| 被拒方案 | 提出者 | 否决理由 |
| --- | --- | --- |
| `workflowhub-followup-tasks-20260910.md` 整体方案 | 用户（R-001） | 「就算实施了，未来也一样会出现很多阻塞和问题」——它继承「加法」倾向 |
| 统一 canonical writer + 原子更新 index/facts/verify | 8 份审计中的 6 份 | 属新增控制面；且 index.json 无功能 consumer，删比修省 |
| 新增终态状态机 `completed_with_quality_unavailable` | 根因文档 §7 P2 | 用户 Q13/R6 明确选择「用字段承接，不要用状态机承接」 |
| behavior / governance digest 分层 | 根因文档 §7 P4 | 目标已由「删失效链」以更彻底方式达成；两层 digest 属新增机制 |
| executable compiler / contract report | Task-C 审计 §5 | 新增控制面，与 R-001/Q16/Q18 冲突；替换物为材料必填小节 |
| command fingerprint + active-attempt lock / `doctor --stage` / `execution-ledger.jsonl` | make-decision-hardening 审计 | 新增对象或 public command；去重替代物已定为 `review_result_ref`；记录载体已复用 `facts.jsonl` |
| 依赖闭包 freshness（保留 fresh 但缩窄） | execution-process §5.1 等 4 份 | 用户 Q10 明确「去掉哈希，不要改一点就变一下」 |
| 每 Phase 审到 findings 清零 | 现状 | 用户 Q20：「审查是帮助找 findings 的流程，有做过就可以了」 |
| 保留 review 轮次预算 + 人工放行 | 备选 | 预算算法已实测出错，且是三大硬阻断之一 |
| 新建 `runs.jsonl` 作为运行记录 | 我的初稿 | 用户 Q18：「整个 workflowhub 任务应该只保留一个文件记录这种信息」 |
| 自动统计控制面数量的检查器（减法守卫的机器版） | 我的初稿 | 撞宪法 F11「不得另造计数器来检查是否足够简单」 |
| 硬拦截「一张卡最多改 N 个文件」 | execution-process §13-1 | 新增卡级硬门，与用户「不要门禁阻挡」冲突；定为只作建议 |
| 卡文件数之外的延期处理 | 我的初稿 | 用户：「我不希望有延期任务，当前任务本身就是prd类规划任务」 |
| 为历史任务补质量验收 | followup §7-3 | 与「历史只读冻结、不新增 writer」冲突 |
| 迁移历史 task-store / 兼容桥 / 双写 | followup 任务 B | 只服务历史、易改写历史事实；D-016 定为只读冻结 |

## 风险

| # | 风险 | 影响 | 处置 |
| --- | --- | --- | --- |
| RK-1 | D-009② 保留的写口身份核对若做胖，会慢慢长回现状 | 自激环复现 | 写死只有三项（task_id + 工作区路径 + 待写字节），列入批次⑤ 验收 |
| RK-2 | D-013 的守卫靠材料纪律而非机器强制 | 可能被忽略 | 为遵守 F11 刻意选的代价；补三要件并进宪法负向条款 |
| RK-3 | 历史基线口径可能不全 | 验收部分不可证伪 | 不可证伪项如实标记；M1/M2 复测编入批次⑧ |
| RK-4 | `stage-content-contracts.mjs`（6,806 行）与 `runtime/stage/` 三个巨人的主体级收窄方案未定 | 宪法 F10 反例整改后仍成立 | 已写进 D-028③ 与 Z1/Z2，由 build-prd 出具体拆分 |
| RK-5 | 审查通道自身缺陷（packet 缺 lens / 形似契约 / caller 腿稳定失败） | 「审查已如实记录」这条完成依据不可提交不可核验 | 升级为「必须修」，编入批次④（D-029⑪⑫⑬⑭） |
| RK-6 | 慢测试与重复执行若不在批次⑨ 内真正做掉 | 工程/测试类阻塞复现 | 已编入批次⑨ 并给出四条验收判据（D-026② 修订） |
| RK-7 | 共享工作区有其他 agent 并发改主仓 | 基线漂移 | 已在 T-8/T-10 如实登记；复现时须核对 HEAD |

## 未决项

| # | 未决项 | owner | 关闭条件 |
| --- | --- | --- | --- |
| OPN-1 | 「对方向做方向审查」在当前 track 划分下没有可用表面（审查者 A1，blocking） | 批次④ | direction/detail 两 track 的载荷边界改写完成，且带 OI 快照的方向审查能跑通 |
| OPN-2 | 22 + 13 条 provider 回收 finding 属**未记录证据** | 批次④ | 补一次能走完并落 sink 的收取；在此之前不得引用为已记录审查结论 |
| OPN-3 | `stage-content-contracts.mjs` 与三个巨人的主体级收窄方案 | build-prd | 给出批次级行数净减目标与拆分方式 |
| OPN-4 | 常量与重复实现的合并清单（48 处内联正则等） | 任务Ⅰ 批次② | 清单产出且合并到单一位置 |
| OPN-5 | 本任务 make-decision 的方向审查尚未带上 OI 快照（`outline_closed` 的 `direction_snapshot` 分支未满足） | 本 stage | 带快照的方向审查完成，或如实记录为不可用 |

## Supersedes

| 被取代的对象 | 取代者 | 说明 |
| --- | --- | --- |
| `workflowhub-followup-tasks-20260910.md` 的两个后续任务 A/B 划分 | 本 decision-log 的 D-018（3 任务 9 批次） | 整体方案被否，任务划分重做 |
| 本 decision-log 初稿 D-026②③ 的「延期 + 触发条件」表述 | D-026 修订 + D-029 | 用户要求不产出延期项 |
| T-8 的「`PROTOCOL_INCOMPATIBLE` 未复现、属间歇性」表述 | T-10 + D-029⑭ | 第 5 轮在 red+blue 两 role 同时复现 |
| N-001-d 关于 `quality/verify.json`「零生产调用者 / 无 guard」的结论 | N-001-p + N-001-r + N-001-v | 合并后已有 publisher 与 guard，且它本身是完成谓词 |
| N-001-d 关于 `stage-reflection` 无生产 reader 的结论 | N-001-u | 合并带入 `stage-handoff` 真 reader |
| T-5 关于 `facts.jsonl`「已有 schema」的表述 | N-001-x | 该 schema 从未被加载，校验是手写的 |
| 本 decision-log 初稿「无保留记录清单」的状态 | `## 保留记录清单` K1–K9 | 第 5 轮审查指出缺失后补齐 |
| 本 decision-log 初稿「无阻塞分类学」的状态 | `## 阻塞分类学与防护` | 同上 |
| 其他任务决策材料中的 D-006② / D-007（编号撞车） | 本 decision-log 的 D-006 / D-007 | 编号相同但属不同任务；引用时须带任务名 |

## 文档结果

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| `specs/workflowhub-mechanism-simplification-20260910/decision-log.md` | **产出（本阶段唯一材料）** | 本文件 |
| `quality/evidence/interactions/8b44558e….json` | 产出（外置任务记录） | immutable 交互聚合，含 30 条 `oi_dispositions` |
| `docs/architecture/control-plane-inventory.json` | 只读引用（main 合并带入） | 其 6 条 `retain` 已按 N-001-p/r 复核 |
| `CONTEXT.md`、`docs/adr/0025`、`docs/standard-workflow.md` | 只读引用（main 合并带入） | 本阶段按其中的收敛大纲契约执行 |
| 仓库实现代码 | **未改动** | D-019 明确本任务不实现；`git status` 仅本任务 specs 目录为新增 |

## Exit checks

| 检查 | 结果 |
| --- | --- |
| 本阶段负责的材料（`decision-log.md`）存在且可读 | ✅ |
| 原始需求 R-001~R-013 全部有处置（无「待处理」） | ✅ |
| R-008 点名的 16 个对象逐个有具名处置 | ✅ |
| 收敛大纲 OI 清单齐备（6 框架节点 + 6 固定类别 + 30 条 OI；**引用与记录并集覆盖完整**，非双向完整映射，见 D-R8） | ✅ 校验器 `structure=passed` |
| 无未处置 `open` 项 | ✅ 校验器 `no_open_items=passed` |
| 每条终态满足字段表（confirmed 四字段齐备） | ✅ 校验器 `terminal_fields=passed` |
| 影响目标/范围/验收的条目带可核验的用户处置凭证 | ✅ 校验器 `interaction_proof=passed`（22 条核心项已绑） |
| 方向审查材料含与当前大纲版本一致的 questions-only 快照 | ❌ **未满足**：审查以 `unavailable` 结束（X-B 活体复现 + D-R4 机制缺口，见「带 OI 快照的方向审查：终止记录与发现」）；未满足前**不得宣称 `outline_closed`**，关闭条件见 OPN-5 |
| 用户真实确认已取得并绑定 | ✅（`decision_hash = e357a72d…`） |
| Talk 四轮 + Grill 一轮均为真实用户答复 | ✅ |
| 独立审查事实已记录（4 次 + 2 次 provider 失败） | ✅ |
| 每个 finding 都有处置 | ✅（T-3 / T-8 / T-10 处置表） |
| 无延期项 | ✅（`deferred` 类别为 `empty: true`） |
| 本阶段未实现任何删除 / 未改仓库实现代码 | ✅ |
| 不可逆操作未越过人执行 | ✅（无 commit/push/merge/archive/cleanup） |

## 决定（补记：非目标与风险）

- **非目标**：见 `## 非目标` 节。
- **剩余风险与未决项**：已分别归入 `## 风险`（RK-1~RK-7）与 `## 未决项`（OPN-1~OPN-5）两节，本节不再重复维护，以免出现第二份清单。

#### D-030
- question/final_option: 审查进程的失败由谁终止？→ **由 3rd-review 的健康检查自动关闭**，不依赖外层 timeout
- recommendation/plain_language: 「去掉外层 900 秒」不等于「有界」——本次实测证明了这一点：进程空转 21 分钟、零产出，最后只能靠人手动杀。**正确的做法是让审查系统自己知道「这个审查已经失败了」并自己终结**，而不是在外面架一个定时炸弹。
- decision:
  1. **主机制在 3rd-review 侧（机制层）**，采用**心跳过期判死**：给 managed session 的 manager 加心跳，把 `managedStatus` 现有的「owner 进程已死」扩展为「**owner 已死 或 心跳过期**」→ 复用**现有的** `SESSION_MANAGER_LOST` / managed failure group 与 wh-review 现有的轮询循环，**协议零变更**。这条路对**所有 provider**都有效（不依赖 probe 支持），且检测的是「审查进程本身没在推进」而不是「provider 没吐字」。
  2. **有 probe 的 provider 走更细的信号**：把 3rd-review 已有的 `PROCESS_STALLED` 诊断（`health-runner.mjs:54`，当前**只诊断不终止**）接成终态决策，并把 `PROCESS_STALLED` 补进失败枚举（`provider-failure.mjs:3-22`）。**三段其实已经就位、只差接线**：诊断 → broker 已预留的 `outcome:"stalled"`（`broker.mjs:75,1335`）→ wh-review 已接受 `stalled`（`review-provider-client.mjs:122`）；因为枚举里没有它，`outcome:"stalled"` 目前**不可达**。
  3. **WorkflowHub 侧只做消费，不自造停滞判定**：①把 `stalled` 接到下游结果映射（`review-result.mjs` 目前无 `stalled` 映射）；②`waitForManagedTerminal` 的 `DEFAULT_MANAGED_TERMINAL_WAIT_MS = null` 语义改为「**等待 3rd-review 的健康裁决**」，外层墙钟不再是主机制。
  4. **明确禁止**：wh-review **不得**自行实现基于本地墙钟的停滞判定。managed 活跃信封**没有任何进度字段**（`broker.mjs:139-145`），wh-review 唯一能观测的是「进程还活着 + 本地墙钟」——**那本质就是外层 timeout 换皮，正是用户否掉的方案**。若确需兜底，只能作为**次要**防线且必须显式标注为兜底，不得成为主机制。
  5. **跨仓交付项，登记 owner，不写延期**：本决定要求的能力分布在**两个仓库** —— WorkflowHub 仓（③④）与 3rd-review 仓（①②，路径 `/Users/Hugh/Hugh/Project/3rd-review`）。3rd-review 侧不是「仓外不可交付物」，而是**本路线明确要求的跨仓交付项**：必须登记接收方、接口契约与验收判据，按可验收任务排入批次，**不以延期形态留在材料里**。
- source_type/reference/exact_excerpt: 用户原话（本会话）：「我不希望通过timeout来停止这种审查，还是要通过3rd-review的健康的检查来自动关闭失败的审查进程，保证workflowhub流程运行的健康和效率，再也不要被这种无止尽的审查浪费时间了」。调查证据（只读子代理）：`health-runner.mjs:32`「`if (!probeSession) { schedule(); return; }`」；`health-runner.mjs:47-56`「连续 5 次 probe 返回 busy 且 cursor 未变 → diagnose("PROCESS_STALLED")，仅诊断不终止」；`broker.mjs:695`「managedStatus 只在 manager 进程已死时才判 terminal（ownerConfirmedDead）」；`simple-review-runner.mjs:21`「`DEFAULT_MANAGED_TERMINAL_WAIT_MS = null`」、`:443` 每 1000ms 轮询且**无停滞判定**；`config.mjs:38-39,47-48,66-68`「`idle_timeout_ms`/`max_duration_ms` 被显式拒绝、`max_wall_clock_ms` 强制 null、per-provider `deadline_ms` 被拒绝」⇒ **当前没有任何 stall 阈值配置项**；`review-provider-client.mjs:133-142`「`validateV3Timing` 只有下界、**没有上界** ⇒ 21 分钟的 duration 完全合法」。
- approval_binding: 用户本会话直接指示；随本次材料细化一并绑定
- facts_and_constraints: ①**只有 opencode 有 `probeSession`**（`opencode.mjs:157`），antigravity/codex/pi **既无 probe 也从不发 terminal 事件** ⇒ 对事故涉及的 provider，3rd-review 目前**完全没有自动关闭能力**，唯一终结者仍是 cancel 或进程自己退出；②`health-runner.mjs:32` 在无 probe 时**直接空转**；③managed 公开信封只有 `{version, request_id, runtime_id, state, material_id}`，**活跃态零进度信息、零时间戳**；④`managedPublic` 的 `exactKeys` 校验（`review-provider-client.mjs:400-404`）意味着**给信封加字段会直接 `PROTOCOL_INCOMPATIBLE`** —— 这是选择「心跳过期判死」（协议零变更）而非「把进度暴露到信封」的决定性理由；⑤legacy（非 managed）路径反而有富字段（`last_progress_at_ms`/`process_alive_at_ms`/`progress_events`），但 managed runtime 走不到；⑥停滞阈值硬编码 = 5 × `healthCheckIntervalMs`，而 broker 从不设该值 ⇒ 默认约 **5 分钟**。
- Logic: 外层 timeout 会误杀健康审查、又会放任卡死审查 -> 必须是机制层的健康裁决 -> 3rd-review 已有心跳/诊断但未接线且对多数 provider 无 probe -> 选「心跳过期判死」为对全体 provider 有效且零协议变更的主机制，probe 路径做增强 -> wh-review 只消费不自造 -> 跨仓项登记 owner 排入批次
- choice_reason/impact: 直接决定 R-013 是否成立，以及「再也不要被无止尽的审查浪费时间」是否可验收。
- consequences_and_risks: ①既有设计**故意**不让沉默杀进程（`docs/adr/0001-v4-cli-contract.md:123`、归档设计文档「沉默只产生 idle_warning/stalled_suspected，不自动杀进程」）——本次变更是**有意的方向修正**，必须同步改这两处文档，否则下一个 agent 会按旧 ADR 把它改回去；②心跳过期仍需一个阈值与「manager 忙但活着」的区分（`runManagedOperation` 当前是单次长 `await this.run`，需改成带定时器的结构；`runtime-guardian.mjs` 的 1s tick 是现成的同构参考）；③误杀慢 provider 的风险由「心跳」而非「无输出」来界定，故慢但活着的审查不会被误杀。
- rejected_alternatives: ①**单靠 wh-review 侧做 stall 判定**（managed 活跃信封无进度字段，只能看墙钟 ⇒ timeout 换皮，用户已否）；②**把进度暴露到 managed 公开信封让 wh-review 判**（改 managed 公开 schema，`exactKeys` 跨仓同步发布，且对无 probe 的 provider 仍只是「静默」信号）；③**只把 `PROCESS_STALLED` 接成终态**（对无 probe 的 antigravity/codex/pi 完全无效，覆盖不了本次事故）；④**保留外层 timeout 作为主机制**（用户已否）。
- unresolved_items/owner: ①3rd-review 侧心跳与 `PROCESS_STALLED` 接线的**具体阈值**需在实现时定（owner：跨仓交付项，本路线批次④）；②`stalled` 在下游结果映射中的语义（是否等同 unavailable、如何计入阶段完成行）由批次④ 定义；③`docs/adr/0001-v4-cli-contract.md:123` 与归档设计文档的方向修正须同批完成。
- Supersedes: 修正 D-029⑭ 的「有界等待」表述 —— 由「加有界等待」升级为「**由 3rd-review 健康裁决终止**，外层墙钟不作主机制」

```text
module: 审查生命周期
requirement_ids: [R-006, R-013]
derived_from: [D-007, D-021, D-029]
artifacts: [spec.md#FR-027, plan.md, tasks.md]
```

## 六项大白话总结（stage-end spec-analyze）

**1. 这个阶段做了什么（stage_work）**
把「workflowhub 机制太重、流程和门禁吃掉一半以上时间」这个诉求，做成了一份可执行的整改方向。共 30 条决定 + 30 条收敛大纲条目（OI），全部经真实用户确认；期间跑了四轮 Talk + 一轮 Grill，做了两次正式异源审查、八份文档逐份覆盖审计、以及四份独立复核（含一次真实 provider 细节审查）。

**2. 原始需求覆盖到什么程度（requirement_coverage）**
R-001~R-013 全部有处置，无「待处理」项（R-013 为本会话新增：审查进程的失败必须由 3rd-review 健康检查自动关闭，不依赖外层 timeout → D-030 / OI-030）。R-008 逐字点名的 16 个对象逐个收口，其中 6 个（producer / runner / validator / 发布自动重发 / 阶段级 outcome / canonical-*）此前无落点，由 D-027 补齐。独立复核给出的覆盖度约 75%，缺的三处（保留记录清单、对象族逐项处置、阻塞分类学）已全部补齐。八份文档去重后 59 条阻塞：已接住 32、部分 20、明确不采纳 3、**零防护 4 条已由 D-027 补全**。

**3. 与上游产物、实际语义和证据是否一致（upstream_alignment）**
一致，但有 **6 处旧结论因 main 合并而过期**，已全部更正（`N-001-p/u/v/w/x/y/z`）：`verify.json` 已不是「无 publisher 无 guard」而是完成谓词本身；`stage-reflection` 已不是「无 reader」而是 handoff 的输入；`facts.jsonl` 的 schema 从未被加载（校验是手写的）；`index.json` 是 5 写 6 读不是 4 写；`facts.jsonl` 里还有一套零生产者的分支；净减法数字在 HEAD 上全部重测。**凡引用旧行号或旧结论处均已标注须按 HEAD 重核。**

**4. 当前阶段当场修复了什么（current_stage_repairs）**
- 5 个阻塞级问题：批次表损坏（批次② 无定义）→ 重建为 10 个具名批次（计数唯一来源 = D-018 修订句）；审查通道自身不可用 → 升级为「必须修」；审查去重键与 focus 复审正面对撞 → 改元组；两个哑弹（`check-skill-closure` 硬编码 `material_revision`/`snapshot_tree`、`AGENTS.md` 明文保留 `index.json`/`verify.json`）→ 编入批次；按原清单删完巨型校验引擎仍在 → 写主体级减法落点要求
- 材料内部不自洽：D-010 删预算未落批次 → 编入批次④并写死顺序
- 用户的两次收紧：撤销全部延期项；执行面四条编入批次⑨
- 3 处文档缺陷：重复的「目标/范围/非目标」章节、内容契约缺 10 个必备章节、`deferred` 类别未清空

**5. 剩余风险、未决和延期（remaining_risks）**
剩余风险 RK-1~RK-7、未决 OPN-1~OPN-5 见对应两节。**没有延期项**（`deferred` 类别为 `empty: true`）。最需要下游继续处理的是 OPN-3（`stage-content-contracts.mjs` 6,806 行与 `runtime/stage/` 三个巨人的主体级收窄方案）和 OPN-5（本阶段的方向审查尚未带上 OI 快照）。

**6. 下游可以直接消费什么、不能自行猜什么（next_stage_boundary）**
- **可以直接消费**：本 decision-log 的 30 条决定与 30 条 OI、10 个批次定义、保留记录清单 K1–K9、对象族处置表、阻塞分类学、以及标记为「已裁定不采纳」的清单。
- **不能自行猜**：①不得采纳被明确否决的方案（统一 canonical writer / 新终态状态机 / digest 分层 / executable compiler / contract report / command fingerprint / `doctor --stage` / `execution-ledger.jsonl` / 依赖闭包 freshness）；②不得把「延期」重新引入材料；③不得自行启用宿主/broker 的仓外能力；④不得把 22+13 条 provider 回收 finding 当作已记录审查事实；⑤不得在未重核 HEAD 的情况下引用本材料中的旧行号。

## 阶段收口状态（诚实登记）

### 官方入口的实测结果（不是推断）

本阶段已通过官方 bridge 提交过**一次真实的 stage outcome**（`unavailable`，非伪造）：

```
outcome_ref    quality/evidence/stage-outcomes/make-decision/09e16e90….json
outcome_status unavailable
producer       stage-agent / dsh-web-session / dsh-web/no-host-session-lifecycle
reason         host does not expose an authenticated stage-session lifecycle or
               requirement transcript source; recorded as unavailable rather than fabricated
```

`status --stage=make-decision` 的即时派生（实测）：

| 字段 | 值 | 含义 |
| --- | --- | --- |
| `work_status` | **`ready`** | 四份材料可读 —— **可以继续工作** |
| `continuation_allowed` | **`true`** | 同上（宪法 F3/Q2 的推进资格满足） |
| `quality_status` | **`in_progress`** | 阶段完成判据未满足 |
| `execution_outcome` | `unavailable`（attempt_count 1 / completed 0） | 真实记录，未阻断 |

`quality_missing`（12 项，实测）：`scope` · `non_goals` · `risks` · `requirement_coverage` · `goal_achievement` · `acceptance_clarity` · `solution_convergence` · `plain_language_card` · `outline_closed` · `stage_end_spec_analyze` · `human_confirmation` · `stage_outcome`

### 这 12 项到底是什么性质

**注意：其中 8 项的「实质内容」在本材料里全都存在**（范围、非目标、风险、需求覆盖、目标达成、验收清晰度、方案收敛、大白话卡）。它们缺的不是内容，是**把内容注册成 quality fact 的发布路径**——该路径由 `run --action=execute` 的 stage handler 承担，而 handler 需要宿主 session 提供的 receipts。

因此这 12 项的准确性质是：

| 类别 | 项 | 缺什么 | 能否在本环境补 |
| --- | --- | --- | --- |
| 发布路径缺失 | `scope` `non_goals` `risks` `requirement_coverage` `goal_achievement` `acceptance_clarity` `solution_convergence` `plain_language_card` `human_confirmation` `stage_end_spec_analyze` | 宿主 session receipts（`run --action=execute` 的输入） | **不能** —— 属已登记的仓外能力（`## 非目标`），且**不得手工伪造 quality fact** |
| 被 R-013 阻断 | `outline_closed` | 带 OI 快照的方向审查未跑通（3rd-review 无界等待，D-030 要修） | **不能** —— 正是 R-013 要解决的问题本身 |
| 真实不可用 | `stage_outcome` | 已发布为 `unavailable`，谓词要求 `completed` | 不能且不应 —— 本环境确实没有宿主 session |

### 结论

| 步骤 | 状态 | 事实 |
| --- | --- | --- |
| 1–11（含四轮 Talk / Grill / 两次审查 / 用户确认） | **已完成** | 见各 T 小节；`decision_hash = ca12f0b0…`；交互聚合 `59f1998e…` |
| 12 stage-end spec-analyze | **已完成** | 六项大白话总结已产出；OI 校验 4/5 通过（`structure`/`no_open_items`/`terminal_fields`/`interaction_proof`） |
| 13 publish-decision | **实质完成、形式未发布** | stage outcome 已按官方 bridge 如实发布为 `unavailable`；quality facts 的注册需要宿主 session 路径，本环境不提供 |
| 14 stage-reflection | **未完成（如实不可用）** | v2 judgment 草稿已产出（`/tmp/wh-msd/reflection-judgment.json`），但公共入口要求 `stage_status ∈ {completed, failed}`；本阶段派生态为 `in_progress`，故**正确拒绝发布**，未伪造完成状态 |

**一句话**：make-decision 的**工作做完了**（方向已定、30 条决定与 30 条 OI 经用户确认、大纲校验通过），但**形式收口被两件事挡住**——①宿主 session 能力（仓外，已排除）②3rd-review 无界等待（R-013 / D-030，已排入批次④）。两者都是已登记的真实事实，不是遗漏。

**对下游的影响**：`work_status=ready` / `continuation_allowed=true` ⇒ 按宪法 F3/Q2「四材料可读即可继续」，**build-prd 可以直接开工**，只消费已确认的方向，不依赖 stage completion。

## 六项大白话总结（stage-end spec-analyze）

**1. 这个阶段做了什么（stage_work）**
把「workflowhub 机制太重、流程和门禁吃掉一半以上时间」这个诉求，做成了一份可执行的整改方向。共 30 条决定 + 30 条收敛大纲条目（OI），全部经真实用户确认；期间跑了四轮 Talk + 一轮 Grill，做了两次正式异源审查、八份文档逐份覆盖审计、以及四份独立复核（含一次真实 provider 细节审查）。

**2. 原始需求覆盖到什么程度（requirement_coverage）**
R-001~R-013 全部有处置，无「待处理」项（R-013 为本会话新增：审查进程的失败必须由 3rd-review 健康检查自动关闭，不依赖外层 timeout → D-030 / OI-030）。R-008 逐字点名的 16 个对象逐个收口，其中 6 个（producer / runner / validator / 发布自动重发 / 阶段级 outcome / canonical-*）此前无落点，由 D-027 补齐。独立复核给出的覆盖度约 75%，缺的三处（保留记录清单、对象族逐项处置、阻塞分类学）已全部补齐。八份文档去重后 59 条阻塞：已接住 32、部分 20、明确不采纳 3、**零防护 4 条已由 D-027 补全**。

**3. 与上游产物、实际语义和证据是否一致（upstream_alignment）**
一致，但有 **6 处旧结论因 main 合并而过期**，已全部更正（`N-001-p/u/v/w/x/y/z`）：`verify.json` 已不是「无 publisher 无 guard」而是完成谓词本身；`stage-reflection` 已不是「无 reader」而是 handoff 的输入；`facts.jsonl` 的 schema 从未被加载（校验是手写的）；`index.json` 是 5 写 6 读不是 4 写；`facts.jsonl` 里还有一套零生产者的分支；净减法数字在 HEAD 上全部重测。**凡引用旧行号或旧结论处均已标注须按 HEAD 重核。**

**4. 当前阶段当场修复了什么（current_stage_repairs）**
- 5 个阻塞级问题：批次表损坏（批次② 无定义）→ 重建为 10 个具名批次（计数唯一来源 = D-018 修订句）；审查通道自身不可用 → 升级为「必须修」；审查去重键与 focus 复审正面对撞 → 改元组；两个哑弹（`check-skill-closure` 硬编码 `material_revision`/`snapshot_tree`、`AGENTS.md` 明文保留 `index.json`/`verify.json`）→ 编入批次；按原清单删完巨型校验引擎仍在 → 写主体级减法落点要求
- 材料内部不自洽：D-010 删预算未落批次 → 编入批次④并写死顺序
- 用户的两次收紧：撤销全部延期项；执行面四条编入批次⑨
- 3 处文档缺陷：重复的「目标/范围/非目标」章节、内容契约缺 10 个必备章节、`deferred` 类别未清空

**5. 剩余风险、未决和延期（remaining_risks）**
剩余风险 RK-1~RK-7、未决 OPN-1~OPN-5 见对应两节。**没有延期项**（`deferred` 类别为 `empty: true`）。最需要下游继续处理的是 OPN-3（`stage-content-contracts.mjs` 6,806 行与 `runtime/stage/` 三个巨人的主体级收窄方案）和 OPN-5（本阶段的方向审查尚未带上 OI 快照）。

**6. 下游可以直接消费什么、不能自行猜什么（next_stage_boundary）**
- **可以直接消费**：本 decision-log 的 30 条决定与 30 条 OI、10 个批次定义、保留记录清单 K1–K9、对象族处置表、阻塞分类学、以及标记为「已裁定不采纳」的清单。
- **不能自行猜**：①不得采纳被明确否决的方案（统一 canonical writer / 新终态状态机 / digest 分层 / executable compiler / contract report / command fingerprint / `doctor --stage` / `execution-ledger.jsonl` / 依赖闭包 freshness）；②不得把「延期」重新引入材料；③不得自行启用宿主/broker 的仓外能力；④不得把 22+13 条 provider 回收 finding 当作已记录审查事实；⑤不得在未重核 HEAD 的情况下引用本材料中的旧行号。

## 阶段收口状态（诚实登记）

| 步骤 | 状态 | 事实 |
| --- | --- | --- |
| 11 approve-decision | **完成** | 用户真实答复「确认」（含后续新增需求 R-013 的直接指示）；`decision_hash = ca12f0b0…`；交互聚合 `59f1998e…` 已 immutable 落盘；**30 条 OI** 全部收口 |
| 12 stage-end spec-analyze | **完成** | 六项大白话总结已产出；校验器 `structure / no_open_items / terminal_fields / interaction_proof` 四项 `passed`，`direction_snapshot` 待满足 |
| 13 publish-decision | **未完成** | 官方 publication 需要宿主 bridge 提供 `authenticated_requirement_messages` 等认证输入；本机不提供该能力（属已登记的范围外能力，见 `## 非目标`）。**未伪造 outcome，也未走旁路写入。** |
| 14 stage-reflection | **未完成（不可用）** | 已产出 v2 judgment 草稿（`/tmp/wh-msd/reflection-judgment.json`），但公共入口 `run --action=reflect` 要求 `stage_status ∈ {completed, failed}`；本阶段因 `direction_snapshot` 未满足而保持 `in_progress`，故**如实拒绝发布**，未伪造完成状态。 |

**为什么不是「没做完」**：本阶段的方向、决定、收敛大纲、验收口径与用户确认**全部已完成**；未完成的两项分别卡在「宿主能力范围外」与「审查通道自身缺陷（已升级为批次④ 必须修）」，二者都是**已登记的真实事实**，不是遗漏。

**下一步（进入 build-prd 的前提已满足）**：四份材料中本阶段负责的一份（`decision-log.md`）已可读且含已确认方向；按宪法 Q2「四材料可读即可继续」，build-prd 可以直接消费本材料。`direction_snapshot` 满足后应回填本表并把 `outline_closed` 置为 `passed`。

## 带 OI 快照的方向审查：终止记录与发现

### 终止事实（健康度检查后由用户指示结束）

| 项 | 值 |
| --- | --- |
| 启动 | `wh-review` CLI 于 2026-09-11 00:00 启动（外层 `timeout 1800`） |
| 终止 | 2026-09-11 00:22 由主会话主动结束（进程 + 子代理），终止时已运行 **21 分 34 秒** |
| stdout / stderr | **均为 0 字节** |
| review sink | 最后一次写入 **23:43**，此后 **39 分钟无任何新产出** |
| 阻塞点 | `waitForManagedTerminal`（`simple-review-runner.mjs:443`） |
| 结果 | **`unavailable`**：无 wh-review 正式结果、无 sink、无 provider_results。**未伪造任何 outcome。** |

**这是一次 X-B 缺陷的活体复现**（第 5 轮 detail 审查 X-B 已预言）：`DEFAULT_MANAGED_TERMINAL_WAIT_MS = null` + 无停滞检测 ⇒ provider 卡住时 CLI **无限空转且永不返回**，只有外层 `timeout` 能结束它。**「去掉外层 900 秒超时」≠「有界」** —— 本次实测把这句话从推断升级为事实，强化 D-029⑭ 的「必须修」并新增一条验收判据：**CLI 必须在无 terminal 进展时自行有界退出，不得依赖外层 timeout。**

### 终止前产出的部分分析（工作稿，非审查结论）

子代理在被终止前留下了 `/tmp/wh-msd-r3-direction-analysis.md`（(A) 大纲完整性核对基本完成，(B) 方向 findings 仅部分）。**它是子代理的自产工作稿，不是异源 provider 审查结论**，按 provenance 要求如实标注。其中三条经主会话复核成立，已就地修复：

| # | 发现 | 复核 | 处置 |
| --- | --- | --- | --- |
| D-R1 | **A-Q6 假绿**：`Exit checks` 与六项总结声称「R-001~R-012 全部有处置（无「待处理」）」，而 R-001~R-006、R-010 末列**逐字仍写「待处理」**（此前只回填了 R-007/R-008） | **成立** —— 这是本材料自身的一处假绿 | **已修**：7 行逐行回填真实处置（D/OI 编号） |
| D-R2 | **B1 批次计数不自洽**：D-018 修订写「8 个具名批次」，其他 6 处写「9 个」，实际枚举 10 个标记且 ⑨ 插在 ④ 与 ⑤ 之间（乱序）；同类缺陷第 5 轮已判过 blocking | **成立** —— 「修复」把计数从 8 改成 9，重新引入了同一类不可核验 | **已修**：统一为 **10 个具名批次**并指定「计数唯一口径 = D-018 修订句」；新增「批次执行序（唯一口径）」；⑨ 移到 ⑧ 之后 |
| D-R3 | **A-Q4 `deferred: empty` 理由自证**：原理由同时用了用户的明确指示**和**「所有仓内可交付项一律编入批次」这个**结论**，而 OI-005 恰在问该结论 | **成立** | **已修**：理由改为**只依据用户明确指示**（「我不希望有延期任务」），并写明 OI-005 由该指示裁定为「纳入」，附反例边界 |

**登记但不在本阶段修（属机制与后续批次）**：

| # | 发现 | 归属 |
| --- | --- | --- |
| D-R4 | **B2 direction 表面无大纲完整性指令**：`contracts/make-decision.md` 把 direction 的职责定为「方向完整性」并要求入料 OI 快照，但真正下发给 provider 的 `review-instructions.md` 仍用旧 FOCUS 文本，且明写「不要把时间花在……是否完整走过步骤上」⇒ 该强制动作**靠操作者 brief 承接，不靠机制** | 批次④（审查通道修复） |
| D-R5 | **B3 材料在研究期间可变且快照无版本绑定**：审查窗口内 decision-log 由 198,505 B / 1,676 行变为 212,604 B / 1,805 行，而快照只有 `outline_version: oi-v1`，与任何 decision-log 修订**无 hash 绑定** ⇒ 「快照与当前大纲版本一致」这一合取项目前不可机械核验 | 批次④（OI-018 的「作废清单」+ OI-019） |
| D-R6 | **A-Q2 问题清单的封闭化措辞**：29 条 OI 中约 12 条以「是否…」发问（OI-008/OI-010/OI-011/OI-012/OI-014/OI-016/OI-024/OI-026/OI-028/OI-029 等），且全部带 `selected_disposition` ⇒ 清单实际功能是**追认票**而非**发现清单** | build-prd（材料纪律）；下一轮 make-decision 应改为「命名未知优先」的开放问法 |
| D-R7 | **A-Q3 重复轴**：OI-001↔OI-002（净减法基准，最明确）、OI-006↔OI-011（降级）、OI-003↔OI-013（无 consumer 的类与实例）、OI-020↔OI-023（纳入/排除的类与实例） | 同上 |
| D-R8 | **A-Q5 结构记录的文档完整性**：9 条 OI（OI-021~OI-029）只挂固定类别行、无框架节点；12 条 OI 只挂框架节点、无固定类别行。校验器 `structure=passed`（并集覆盖即可），但 `Exit checks` 原措辞「引用与记录一一对应」易被读成双向完整映射 | **已修措辞**：`Exit checks` 改为「引用与记录并集覆盖完整（校验器口径）」 |

### 对 `outline_closed` 的影响

`direction_snapshot` 分支**本阶段不满足**（审查以 `unavailable` 结束，非通过）。因此：

- **不得宣称 `outline_closed = passed`**；
- 未满足的原因已如实记录（X-B 活体复现 + D-R4 机制缺口），**不是遗漏**；
- 关闭条件写入 OPN-5：批次④ 修复「有界退出」与「direction 完整性指令入包」后重跑本次审查。
