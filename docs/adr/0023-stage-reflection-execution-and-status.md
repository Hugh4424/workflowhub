# ADR 0023：stage-reflection 执行闭环、诚实状态与一次性历史导入

## 状态

Draft（workflowhub-stage-reflection-usability-20260901 make-decision 阶段，待用户确认后 Accepted）

## 背景

ADR 0021 落地了复盘判断层（judgment≠fact；每 stage 结束由当前主会话执行 skills/stage-reflection），
但生产路径上没有任何宿主提供执行器（`stageReflectionExecutor` 全仓仅测试注入），
每次真实任务复盘恒落 `status:failed ("executor was not provided")`；M16 因此没有有效上游数据
（M16 T008 执行事实保留 "stage-reflection executor unavailable"）。同时：

- schema v1 `stage_status` 仅 completed/failed、`status` 仅 ok/degraded/failed，无法区分
  "没人执行/没触发/失败"三类事实；
- 20 个 Codex 历史任务的经验教训已由离线回填收集（Downloads 离线包），但格式与正式
  lessons 契约不兼容（entry_kind/record_kind、source_refs 结构、unknown task_id），
  M16 早期候选池数据稀缺；
- M16 已合入 main（只读 Evolution 趋势区/候选池/质量税消费复盘产物），PFACT-003 指出
  上游真实任务质量验证未完成=本任务缺口。

## 决策

- **执行方式**：新增私有 CLI 命令（暂名 `reflect`）：会话在 stage 末产出 judgment JSON →
  命令完成机器闭环（raw prelude 校验、validateReflectionValue、lessons 合并、固定路径
  immutable 发布），复用 `runStageEndReflection` 现有批处理逻辑；`stage-runtime run`
  仅在注入 executor 时自动调度，无 executor 时不发布"失败"记录（只留真实未执行事实）；
  五份 workflow SKILL.md 与 docs/standard-workflow.md 补一句阶段末执行指令。与仓库既有
  机制（session-event/bridge/validator 的 CLI+文件约定）同构；DSH/Codex 双宿主可用；
  符合宪法 F1/F2/F10/F11/S8。
- **诚实状态**：schema 状态枚举扩 `unavailable`（无人执行）与 `not_scheduled`（未触发：
  preflight/启动/身份失败、中断、未启动、会话未执行复盘）；状态转移表逐路径定义
  writer；runner 允许两处最小改动（无 executor 不发布失败记录；未触发路径落 not_scheduled
  事实），不动五阶段主骨架语义。
- **一次性历史导入**：修订 M16 的"历史任务不回填"约束为"用户批准的**一次性**历史回顾
  导入"（非每任务回填机制）；分项目存储（WorkflowHub→workflowhub lessons；
  PaperBuilder→paperbuilder 或离线标注）；一次性转换适配器（字段映射、source_refs
  对象化、unknown task_id 保留并标注"历史回放"、全量预演跑 validator+幂等/失败回滚）；
  transcript 索引文件落正式存储（文件级引用）；补一轮人工介入提取；severity 校准
  （occurrence_count≥2 或用户确认→high；单次→medium；体验→low）。
- **信息质量**：SKILL.md 重写（按用户五类问题引导收集、结构化输出区块、机器链描述与
  实际一致）+ schema v2 事实投影三件套（status_matrix 五栏状态/identity 快照/
  source_completeness），operational_tail 延期；judgment≠fact 保持（ADR 0021）。
- **schema 版本策略**：状态枚举在 v1 原地扩展（向后兼容）；三件套新建
  `stage-reflection.v2.json`；M16 消费方式改进（认 v1+v2 并存）纳入本任务范围——
  M16 任务完成开发后 merge 进当前分支，再在**当前分支**修改消费侧（不在 M16 任务侧
  增加需求）。
- **页面**：仅最小生效面——schema 枚举 + 模板 stateNames/stateLabel 补 not_scheduled
  （unavailable 已存在，已核实）+ 契约测试同步；M16 Evolution 趋势区与任务视图其他字段
  不动。
- **验收**：确定性契约测试绿（含旧记录兼容 fixture/新状态 fixture/M16 投影+质量税契约）+
  独立审查完成 + 最小真机验证（构造场景经正式入口跑通 reflect 全链：成功/失败/未调度/
  验证失败路径+页面显示+M16 候选池消费）；真实业务任务端到端+用户抽查复盘质量 →
  延期交接（DE，用户拍板：不等待真实任务数据完成，后续有问题重开任务——与 M16 D-005 一致）。

## 后果（trade-off）

- 优点：复盘器生产路径真实可用（CLI 闭环+诚实状态）；"没人执行/没触发/失败"三类事实
  可区分；M16 候选池/质量税立即有历史样本（仅供参考档）与后续真实样本；判断质量
  可校验（结构化区块+validator 完整性规则）；共享 schema 演进向后兼容。
- 代价与风险：复盘仍依赖主会话合规（自愿执行→not_scheduled 可见性兜底，最小真机验证
  缓解）；M16 后续合并时机不确定（消费改进需等合并）；历史导入记录带"历史回放"身份
  （两档分层仅供参考档+标注）；与 M16 共享 schema/投影器需契约测试保绿。
- 不违反"指标不当 gate"：复盘失败/不可用不阻断 stage/close；SCN 原样保留（D30）；
  不违反"判断≠事实"：事实投影仅记录机器可验状态，不推导质量结论。

## 三项判据

- 难以反转：是。执行模式（CLI 命令+run 调度语义改动）、记录语义（failed→四态）与
  历史导入（修订既定"不回填"约束）均为后续任务普遍依赖；回退需重走决策。
- 无背景会意外：是。只读 schema 的消费方会看到"复盘失败"语义改变与 v1/v2 并存，却
  不知道这是对"恒 failed"缺陷的修复与一次性导入授权。
- 存在真实取舍：是。CLI 命令（会话合规依赖）→ 换取不违宪/双宿主可用；一次性导入 →
  换取 M16 早期样本但带入"历史回放"身份；v1 扩枚举+v2 新文件 → 换取兼容清晰但 M16
  消费需改。

## 关联

- 上游：ADR 0021（判断层）、ADR 0022（候选池判断白名单）；M16（PFACT-001/003；
  R-013 被本任务一次性命中修订）；stage-reflection 任务归档（D-002 设计意图）；
  move-map stage-reflection 条目（consumer="current-session host reflection executor"）。
- 术语登记：CONTEXT.md 复盘执行闭环（reflect）、unavailable/not_scheduled 复盘状态、
  status_matrix 事实投影、历史回放导入。
