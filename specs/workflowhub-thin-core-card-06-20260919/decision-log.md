# Card-06 make-decision 决策日志

- 任务：workflowhub-thin-core-card-06-20260919「薄核心删除与窄工具保留」
- Cohort：post（材料形态 = decision-log.md + spec.md + phases/）
- 认证 worktree：/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-06-20260919
- 分支：task/workflowhub/workflowhub-thin-core-card-06-20260919（基线 main@56c8f267）
- 状态：make-decision 进行中（Talk 轮 1-2 已完成，等待删除面预调查事实回填）
- 日期：2026-09-30

## 〇、原始需求来源（导航）

本卡需求来源 = 规划 cohort 两份材料，以下条款为本卡权威依据：

- `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`：CARD-06 全文（L112 起）、AC-27/28/29/30/31/32/52/53、依赖与流程、R1/R2/R6/R7、SD-04/SD-07/SD-12、OI-012
- `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md`：OI-003（L235-254）、OI-006（L297-316）、OI-012（L420-437）、OI-013（L439-458）、保留工具删除职责节（L662-668）、G-3（L857）、"保留最小必需 runtime"延期重访条款（L694）

大白话任务定义：裁掉所有"机器保安"（哈希/快照/身份/材料/回执校验、stage completion 认证、task kernel/fact graph 强制依赖、evidence 多层包装、plan/tasks 双写、固定 Talk 轮次、强制 handoff），只留两道人为门（推进确认对话 + 不可逆 Git 授权）和 5 项窄工具（工作区核对、命令采集、安全写入、Git 授权、冲突中断保护）。先立新后拆旧。

## 一、开工节奏（用户拍板，Talk 轮 1）

- **决策 D-06-001**：现在就开工 make-decision 与 build-plan；**实际删除动作（build-code）等 Card-03 完成并合并后进行**。
- 理由（大白话）：删除面调查可以提前做；动手拆必须等 Card-03 收尾合并，否则两卡互相踩踏。
- 跟进红线：Card-03 合并时必须确保 `26786b61`（按用户 2026-09-29 裁决"审查入口不再要求/读取 host_provider"的修复）进入 main，否则 main 的 simple-review 路径在 HEAD 上必抛 `host_provider is required`（main 的 third-review-host-config.mjs:698 四参签名 vs 二参调用不匹配）。

## 二、删除范围与 cohort 边界（用户拍板，Talk 轮 2 + Grill 挑战）

- **决策 D-06-002**：post 新路径机器门禁全删 + **pre 路径整体退役**（pre 机制全删，未完成 pre 任务一律只读归档不再继续；历史记录保留只读可查；接续责任归 Card-08）。
- ⚠️ 本决策取代 Card-02 收口时"保留双 cohort"的临时安排。用户在 Talk 轮 2 明确知悉后果（pre 任务推进工具归零、只读归档、Card-08 接续面变窄）后拍板。依据：10 卡终点即薄核心，pre 迟早要拆，长痛不如短痛。
- G-3 风险面因此扩大：pre 机制的安全职责扫描必须全做，不允许因"它是 pre 的"而豁免。

## 三、窄工具落点（用户拍板，Talk 轮 2）

- **决策 D-06-003**：5 项窄工具落点为 `runtime/` 瘦身为纯工具模块——`runtime/interface/` 下只留窄工具实现，stage/task/evidence 等分区随删除清空。
- 被选方案 A。被否方案：B（新目录 tools/narrow/，消费者 import 全改、Card-08/09 幸存者跟着迁移）；C（融入 skills/，技能是"方法"不是"工具"，边界模糊，违反"工具可脱离 kernel 独立调用"）。

## 四、删除策略与批次顺序（用户拍板，Talk 轮 3）

- **决策 D-06-004**：方案 B——按七类面**逐批删除**，8 批顺序照下表执行。原则：先立新后拆旧、先删看守再删牢房。每批删除前做消费者扫描 + G-3 检查；每批删完跑针对性验证并向用户汇报结果。

| 批次 | 内容 | 备注 |
|---|---|---|
| 0 | 5 窄工具独立化 | AC-28 前置：先立新，逐项验证脱离 kernel 可调用 |
| 1 | 只保护流程形状的测试夹具 | 先让旧机制"看守"下岗 |
| 2 | workflows/steps + config（固定轮次、14 步锁） | 流程形状层 |
| 3 | skills/ 绑死旧流程部分（wh-review/broker 退出正常审查路径） | AC-32；历史只读、不换名搬 Skill |
| 4 | runtime/stage、task、evidence（kernel、fact graph、completion 认证、多层 evidence） | 机制核心层，最大删除面 |
| 5 | tools/cli 旧入口 + schemas 旧对象（verify.v1、product_release、status_groups） | CLI/schema 依赖前面机制 |
| 6 | runtime/ 瘦身为纯工具模块 + move-map.json 更新 | 窄工具落点收尾 |
| 7 | 治理文档改写（AGENTS.md/CONTEXT.md/CONSTITUTION.md 相关段落） | 最后改，描述删完后的真实状态 |

## 五、执行弹性三细节（用户拍板，Talk 轮 3）

- **决策 D-06-005**：
  1. 迁移表冻结后允许 **append-only 补记**（执行中发现漏网消费者 → 补记 + 立即向用户汇报）；不许静默改已冻结条目；不许"宁可整批回滚也不补记"。
  2. 每批删除前打 git 快照点（`backup/card-06-b<N>` 标签）= AC-53 的可回滚点。
  3. AC-29 日常路径演练对象 = **本卡自己的 build-code→verify-code 流程自举**（真实、不额外造任务）。

## 六、G-3 安全闸执行协议（用户确认，Talk 轮 2）

- **决策 D-06-006**：删除任何一批之前，子代理先做"安全职责扫描"（该机制除当门禁外是否还在干别的：授权前脏目录预检、防误删、防冲突等）。一旦发现：
  1. 当场停——该批不动手；
  2. 大白话回报用户——"这个文件在替 XX 干活，删了会怎样"；
  3. 等用户拍板——保留 / 改写后删 / 删。禁止自行决定，禁止静默回写 PRD/材料。

## 七、约法三章——本卡执行纪律（用户确认 7 条全生效，Talk 轮 2）

1. 每批删除执行完即向用户汇报结果，不攒到最后。
2. 正式审查每 Phase 最多 2 轮，超了带 incomplete 停下问用户。
3. 所有 gate 命令 timeout 先实测标定再写材料。
4. 逐 AC 结构化产出在 build-plan 阶段声明，不让 verify-code 空转。
5. 开发/测试/审查/调查全走子代理短任务（一次性派出、不反复 followup 同一代理），主会话只当工头。
6. 每次上下文压缩后第一时间读 phase_progress 游标 + phases/index.md，不信旧 handoff。
7. 带 incomplete 收官前必须由用户明确拍板，不自行宣布完成。

## 八、历史会话教训转化（预调查事实，来自 4 份 codex 执行会话分析）

本卡开工前对 Card-02/04/05/07 四次执行会话做了完整调研（43MB/82MB/375MB/110MB 转录）。教训与本卡对策：

| 教训（来源） | 本卡对策 |
|---|---|
| 进度丢失：Card-05 三次退回 P3/P4、一次退回 P1，用户两次发火 | 约法三章第 6 条；开工第一件事确认 phase_progress 游标可用 |
| 主会话当代工头失败：Card-05 主会话 8493 次 exec、49 次压缩、6650 万 token；Card-04 单代理被 followup 121 次、等待占 42.5% | 约法三章第 5 条：短任务一次性子代理 |
| 证据循环失控：Card-02/07/04 代码完成后数小时耗在证据/审查循环，用户三次打断 | 约法三章第 1/2/7 条 |
| 验收契约坑：Card-02 因 AC 断言格式未前置声明卡 1 小时 | 约法三章第 4 条 |
| timeout 愿望 vs 事实：声明 240s 实测 13.1 分钟 | 约法三章第 3 条 |
| 墙钟超时杀审查被用户否决（Card-05 600s 硬截止） | 用健康信号等真实终态，不用墙钟杀 |
| 换名搬家/假绿风险：Card-06 三道红线 R1/R2/R3 | AC-27 消费者 100% 核对；审查工具失败记录不按"通过"处理 |
| 特殊利好：本卡是删除卡，旧 receipt 随机制删除而失效是正常态，不需保旧证据 | 验收聚焦"删干净 + 新路径活"，AC-27/29 覆盖 |

## 九、dirty worktree 处置事实（AC-53 相关）

- 2026-09-30 调查：main 工作区 `runtime/review/review-route-identity.mjs` 有一处未提交改动，判定为**无任务归属的孤儿编辑**（违背用户 2026-09-29"审查入口不再要求/读取 host_provider"裁决，把 host_provider 回接调用点；全库含 5 条 stash 查无出处；mtime 为当日 13:33）。
- **处置（用户拍板）：直接还原**（git checkout），已执行，main 工作区恢复干净。
- 正解跟进：Card-03 分支 `26786b61` 为权威修复，合并时必须进 main（见 D-06-001 红线）。

## 十、验收标准转化（PRD 8 条 AC → 本卡可执行检查项）

| AC | 本卡执行形态 |
|---|---|
| AC-27 删除清单逐项执行 | 每文件「文件→消费者→处置」记录；消费者核对 100%；换名复活 = 失败 |
| AC-28 窄工具独立可用 | 批次 0 在隔离目录（只拷窄工具文件、无 kernel）逐项调用，5/5 真实结果 |
| AC-29 日常路径无 kernel | 本卡 build-code→verify-code 自举实跑，全程无 kernel/fact graph 调用点、无校验机器前置 |
| AC-30 损失清单书面承认 | 删除前落书面清单，SD-12 四项逐项承认（自动拒错绑证据/跨宿主版本批准/自动恢复/机器可查状态） |
| AC-31 G-3 | 按 D-06-006 协议执行；任何自行保留静默回写 = 失败 |
| AC-32 旧审查路径退出 | wh-review/broker 退出正常审查路径；历史原件只读；无路径把它当可执行 fallback；换名搬进 Skill = 失败 |
| AC-52 迁移表七类面 | 七类面 × 四要素（现有消费者→目标消费者→保留/删除→回滚方式）；build-plan 完成时冻结；首次删除晚于冻结；缺失 = 验收失败事实 |
| AC-53 快照与回退 | 每批 backup 标签；切换点/失败回退/dirty worktree 处置写明且遵守；过渡基线（runtime/review/*、skills/wh-review/*）按表处置不静默留存 |

## 十一、风险登记

- R1 换名不改消费者 → AC-27 消费者核对防。
- R2 旧流程搬技能 → AC-32 + 批次 3 删除时逐文件核。
- R6 删校验机器后材料偷换无机器防护 → 两道人为门 + 独立审查 + 真实执行兜底（明示取舍）。
- R7 文件名碰撞/覆盖 → 不可变命名（日期+序号+描述）+ append-only。
- G-3 触发面因 pre 全删而扩大 → D-06-006 协议 + 每批前扫描。
- Card-06 删除动作期间 Card-03 已合并 → 若合并引入新消费者，按 D-06-005 补记。
- "保留最小必需 runtime"被否方案**延期重访条款**（decision-log L694）继承：若删除后出现无法用窄工具+真实验收发现的实际失败，重访最小 runtime 方案。

## 十二、待决 / 开放问题

1. 删除面预调查（机制层 + 方法/治理/pre 任务层两个子代理）结果未回——回来后 append 事实章节，充实迁移表候选条目。
2. 具体删除文件清单：按 PRD Q8 不在 make-decision 定死，由 build-plan 核查产出。
3. 未完成 pre 任务的具体归档动作（逐个转只读）在批次执行时逐任务确认。

---

*本文件 append-only。后续 Talk/Grill 轮次、调查事实、决定草案更新按日期追加。*
