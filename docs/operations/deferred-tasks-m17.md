# workflowhub M17 延期任务清单

> 来源：2026-08-31 M17 范围调研（基于 roadmap draft-v3.3、decision-log D24/D26-D35、仓内结构证据）。
> 本文档收录从 M17 范围中裁出、转到以后执行的任务，已按天然耦合关系收敛为最少的 3 个任务。
> 每个任务含：背景、分析、目标。

---

## F1. 多 CLI seam 泛化 + cli_map 兑现（随 Kimi/第四宿主落地）

### 背景

- requirement 事实认证的唯一归一化点 `resolveRequirementSource()` 硬编码在核心 CLI 文件 `tools/cli/stage-runtime.mjs:270-322`，目前只有 Codex / DSH 两个分支。M17 将加入 Claude 第三分支。
- 每接一个新宿主都要改这个核心文件，与 `docs/audit-contracts.md:19-21,42-46` 确立的"宿主在仓外归一、core 只收 CanonicalSourceInput"原则相违。
- `cli_map` 是 m2-microkernel 显式留给 M17 的配置键（`specs/archive/m2-microkernel/spec.md:27,150`）：`core/load-config.mjs:14,65-75` 白名单含它但只做 shape 校验，全仓零 reader，`config/workflowhub.yaml` 无实例。它是为多宿主分派准备的配置面。
- m15 系列决策（`m15-process-degradation-dashboard/decision-log.md:158,310`、`m15-runtime-observability-repair/decision-log.md:1021-1022`）把 opencode/kimi/pi/grok/claude code 统一接入交给 M17，但 M17 实际只做 Claude adapter + Kimi spike，泛化本身被裁出。
- capability 扩展（`codex-transcript-adapter.mjs:59` 目前只认 `requirement_message`）属旧遥测域：M14b 已撤回，roadmap 明文"不因兼容验证恢复旧遥测"，m15 当年移除的 Claude adapter 也是遥测语境。

### 分析

- M17 后 stage-runtime 将有 Codex/DSH/Claude 三个硬编码分支。按 rule of three，第四个宿主（Kimi 或其他）出现时泛化的收益才真实兑现；提前泛化是没有消费者的推测性抽象，撞宪法"简单优先"和治理"无消费者不新增控制面"。
- seam 泛化与 cli_map 是天然一体：泛化后的 adapter 注册表正是 cli_map 的第一个真实消费者；分开做会造出"有配置无 reader"或"有 reader 无配置"的半成品。
- Kimi adapter 是否可做取决于 M17 的 Kimi 会话存储格式 spike 结论：有可读 transcript 则按 dsh-transcript.mjs 模板实现；没有则 Kimi 只走 outcome-packet 轨，泛化触发点顺延到下一个宿主。
- capability 扩展有双重否决（零真实消费者 + 遥测红线），除非出现真实新消费者，否则永久不碰；恢复时必须区分 observability adapter（红线不恢复）与 requirement/outcome 接线（合法）。

### 目标

1. 把 `resolveRequirementSource` 的双/三宿主硬编码改为薄 adapter 注册/分派机制，locate+normalize 下沉到 `runtime/evidence/<host>-transcript.mjs` 或 `tools/host/`，新宿主接入不再改核心 CLI 文件；requirement hash 认证行为逐测保持不变。
2. 兑现 cli_map：定义值语义（CLI 名 → adapter/可执行映射）+ 唯一 reader，登记 consumer/owner/删除条件。
3. 若 M17 Kimi spike 结论可行，按模板实现 Kimi transcript adapter；不可行则记录 unsupported 结论与降级策略。
4. 更新 `docs/audit-contracts.md` 与 `skills/workflowhub-host-protocol/SKILL.md`，消除"仓外归一原则 vs 仓内归一实现"的漂移。
5. 明确非目标：不新增 requirement_message 之外的 capability；不恢复任何旧遥测采集。

---

## F2. task-close / artifact-dir 兼容区迁移 + facts 双轨合并

### 背景

- `core/`、`scripts/` 是历史兼容区，只保留 move-map 登记文件。core/ 9 个生产文件中 8 个有"留在原位"登记（excluded-not-in-T052），但生产 runtime 仍在深度依赖其中两个大件：
  - `core/task-close.mjs`（2,109 行）：交付关闭唯一编排权威（plan 准备/确认/执行/完成 + 五动作执行器 + 人工确认绑定，ADR 0018），消费者 `tools/cli/task-close.mjs:20`、`mini-task-runner.mjs:19` + 6 测试；应落 `runtime/task/`，但 move-map 未登记去向。
  - `core/artifact-dir.mjs`：9 生产 + ~31 测试 import；与 task-close 存在兄弟 import（task-close → ./artifact-dir.mjs），二者必须同批迁移。
- 隐藏耦合：`check-task-record-paths.mjs:79/104/110/125/258/268` 硬编码路径权威、`task-handle.mjs` 的公共 re-export 与 WeakSet brand 单实例、`freshness-consistency.test.mjs` 按路径读源码、`review-materials.mjs:134/1191` 枚举。全量迁移面：~8 源文件 × ~19 生产 import + ~40 测试 import + ~10 字符串/文档耦合。
- facts 双轨：simplicity-close-repair 的 deferred 项（`decision-log.md:79`，延期-1）。原评估报告已随仓根 quality/ 清理被删（仅存 git 历史 commit 292f3b30a），且统计口径基于旧 `quality/facts/` 布局，与当前 vNext 布局（quality/reviews|tests|verify.json）不符；`scripts/dual-track-evaluate.mjs` 路径口径已过时，move-map.json:2123 已登记该脚本在合并实现时退役。
- 现状：`facts.jsonl`（task-fact.v1）的唯一生产 writer/reader 都是 `core/task-close.mjs`（writer=`task-store.mjs:278`）；quality facts（quality-fact.v1）canonical writer 已是 TaskKernel（`task-kernel-implementation.mjs:527-538`），`quality-store.mjs:76-82` 对 canonical root 显式拒绝直写；`task-store.mjs:172-173` 硬隔离两轨。

### 分析

- 两个任务天然一体：facts.jsonl 的唯一消费者就是 task-close.mjs，迁移 task-close 必然触碰 facts 读写链路，分两次做等于在同一条认证链路上动两次刀。
- facts 合并不是纯运行时改动，有三重治理红线：①vNext 实施边界明文保留 facts.jsonl（AGENTS.md），废它需先修订治理边界；②"不得新增双写/永久 compatibility bridge"决定必须一次性 cutover，禁止桥接过渡；③"旧记录只读"禁止改写历史数据。
- 现有评估数据已过时，不能直接作为合并决策依据；必须先校准评估脚本重出评估（旧报告结论：test 类一致→保留；acceptance/confirmation/review 类差异→合并候选；other 数据不足）。
- 风险集中在路径权威硬编码和 WeakSet brand 单例——迁移必须保持对象同一性和路径契约不变，有 contract 测试兜底但需逐一核对。

### 目标

1. 准备步：校准 `scripts/dual-track-evaluate.mjs` 到当前 vNext 布局，重出双轨评估报告，据此做合并/保留决策（写进当次任务 decision-log）。
2. 迁移 `core/task-close.mjs` + `core/artifact-dir.mjs` 同批落 `runtime/task/`：改全部 import 方（含 ~40 测试）、更新 `check-task-record-paths.mjs` 路径权威、处理 task-handle re-export 与 WeakSet brand、move-map 登记新去向与删除条件。
3. 若决策为合并：定唯一权威 schema，facts 写入收口到 TaskKernel，三处读者（completion-predicates/task-close/wh-review-cli）迁移，一次性 cutover，旧记录保持只读；同步修订 AGENTS.md vNext 边界条款。
4. 若决策为保留双轨：写明保留理由和两轨各自的职责边界，消除"待合并"悬置状态。
5. 退役 `dual-track-evaluate.mjs`（move-map 已登记）。

---

## F3. stage 层结构深化拆分（函数级拆分 + 去 barrel + 剩余巨头评估）

### 背景

- M17 对 `runtime/stage/stage-content-contracts.mjs`（5,772 行）只做"方案三纯归位"：物理拆成目录 + 原路径 barrel re-export，零逻辑改动。以下深化项被裁出：
  - `validateAcceptanceDesignMinimum`（L2934-3778，单函数 845 行）和 `validatePlanTaskContract`（~454 行）两个巨型函数；
  - barrel 的逐域拆除（方案二跟进：让 import 方直连域文件，最终去掉 barrel）；
  - 约 20 个外部未引用导出（含全部 13 个 UI 枚举常量）——M17 不可顺手删，因为 `tests/contract/spec-stage-artifact-closure.test.mjs:36-41` 用正则解析源码文本消费这些常量。
- stage/ 一区占 runtime/ 总行数 55%（14,662/26,770 行），除本文件外还有 `stage-handlers.mjs`（3,385 行，独引 stage-content-contracts 22 个符号的深绑定聚合器）、`stage-runner.mjs`（2,376 行）。
- 增长模式已查明：每次"阶段流/治理链加固"feature 都往默认倾倒场追加新域校验器（两个月 1,581→5,772 行，3.7 倍），与宪法 F10"6000+ 行 gate 引擎"反例同量级。

### 分析

- 深化拆分必须在 M17 归位之后做：barrel 存在期间，函数级拆分和死导出清理的爆炸半径被 barrel 收敛，是安全窗口期。
- 函数级拆分是行为敏感的（845 行校验函数的内部分支只有特定 stage 输入才触发），`public-behavior-baseline.mjs` 端到端兜底粒度不足，真正的 golden 是 19 个域级契约测试 + e2e（vnext-five-stage-current）；拆函数前需先确认对应域的测试覆盖密度，必要时先补测试。
- 死导出清理须走"先证明再删除"流程：先改 `spec-stage-artifact-closure.test.mjs` 的正则消费方式（改为从域文件读或改断言），再删常量；禁止在证明前动手。
- stage-handlers/stage-runner 的拆分属于更大动作，M17 归位后它们与域文件的耦合关系会更清晰，届时按消费者分布重新评估是否值得拆；不预设一定要拆。
- 治理红线：F11 禁止新增复杂度计数器/gate 类基建；本任务纯做结构收敛，不新增任何控制面。

### 目标

1. 拆分 `validateAcceptanceDesignMinimum`（845 行）与 `validatePlanTaskContract`（454 行）为可命名的子校验器，行为不变，域级契约测试全绿。
2. 逐域推进去 barrel：import 方（生产 10 模块 + 测试 19 文件）改为直连域文件，最终删除 barrel；`stage-handlers.mjs` 的 22 符号聚合 import 最后处理。
3. 清理死导出：先改造源码正则测试的消费方式，再凭"零消费者证明"逐批删除 ~20 个未引用导出。
4. 基于归位后的结构事实，评估 `stage-handlers.mjs` / `stage-runner.mjs` 是否需要拆及怎么拆，出评估结论（拆则另立执行项）。
5. 全程 move-map 同步登记；不新增任何复杂度监控基建。

---

## 附：明确无限期延期的项

- **capability 扩展**（requirement_message 之外的 transcript 能力）：零真实消费者 + 撞"不恢复旧遥测"红线。除非出现真实新消费者并在 decision-log 立项，否则不碰。
