# M14b：`runtime-facts.v2` 实施计划

## 目标与边界

在现有任务级事实采集器中新增独立的 `indexes/runtime-facts-v2.jsonl`。它只承载 `runtime-facts.v2` 的十类事实，能把已登记、可直接读取的机器记录转换为可验证、可合并、隐私安全的事实；没有直接来源时明确写 `missing`，读取或格式异常时明确写 `unknown`。现有 `runtime-facts.v1`、其六类事实、其索引、既有配置和消费者保持原样。

不做：注册新的真实成本、转录或编排来源；读取原始对话/工具正文；迁移或重写 v1；修改 M15 排名、趋势、流程诊断或其他消费者；用推测值、默认零值或跨文件补齐新事实。

## 已核对的现状

- `core/fact-indexes.mjs` 已提供 v1 的固定信封、确定性合并、冲突可见化和安全错误净化，适合复用这些通用原则，但 v2 必须有自己的常量、校验器、合并器和 JSONL 入口。
- `runtime/evidence/fact-collector.mjs` 已有受能力保护的来源 reader/registry、预检、任务锁和原子 JSONL 写入；生产 v1 运行事实来源配置为空。v2 应复用这条受控写入链，而不是另建采集流程。
- `tools/cli/collect-task-facts.mjs` 是唯一生产入口；现有测试已用真实 TaskHandle、accepted workspace 和写入失败钩子覆盖 v1。
- 任务已有可直接回读的正式 review、测试/verification、stage receipt/journal 与人工确认记录；usage、launcher/transcript metadata 与 orchestrator dispatch 仍没有登记来源。因此前者可在其记录存在且通过身份校验时生成 `present`，后者必须是 `missing/no_registered_source`。

## 实施阶段

### 阶段 1：定义并隔离 v2 合同

修改 `core/fact-indexes.mjs`，新增一组与 v1 并列但不共用版本判断的 v2 工厂、校验、合并、解析和序列化入口。

1. 固定 `runtime-facts.v2` 信封、十个闭集 `fact_type`，以及每个类型唯一允许的来源 class、主对象 ID 字段和值对象形状。
2. 固定 v2 scope：`run_id` 必填，`session_id`、`agent_id`、`stage`、`step`、`attempt_id` 可空。计算 `rf2_` ID 时，以 canonical JSON 对 `{fact_type, source.class, source.registration_id, source.object_id, scope}` 做 SHA-256；既不把前缀放进哈希，也不能漏掉可空 scope 字段。
3. 严格区分三种状态：`present` 必须同时有值、登记 ID、对象 ID、run ID 且 `reason/error` 为 null；`missing` 只能用 `no_registered_source` 或 `not_found`；`unknown` 只能用规定的四种原因和稳定、净化后的 error。禁止原始正文、私有路径、密钥样式字段和自由错误文本进入索引。
4. 为 cost、token、duration、tool_count、attribution、review、verification、stage_reconciliation、human_intervention、automation_rate 分别实现精确字段校验；包括 token 不强制相加、工具四计数之和、duration 的量法、review/verification 的公开摘要、stage 的四种观测状态、人工公开 actor、自动化 ppm 与正分母。
5. 对相同 v2 `fact_id` 做确定性去重；相同稳定内容幂等保留，冲突只产生同一 ID 的 `unknown/duplicate_id_conflict`，不选先后值。v1 ID、校验器、合并器和 `runtime-facts.jsonl` 解析分支不得改语义。

完成条件：所有 v2 记录在写前通过精确 schema 校验，v1 输入仍由原 v1 合同处理。

### 阶段 2：受控来源投影与独立持久化

修改 `runtime/evidence/fact-collector.mjs`，将现有“受登记 reader + 预检 + 单任务锁 + 原子写”模式扩展为独立 v2 投影路径；必要时新增仅声明 v2 来源描述的新配置模块，保留 `config/runtime-fact-sources.mjs` 不变。

1. 增加 v2 专用、封闭的来源 registry/reader 品牌校验。每个 entry 固定 source class、registration ID、格式/版本和读取能力；拒绝未知字段、重复登记和来源类型不匹配。直接读取的 canonical 记录也要经过该受控投影层，不允许业务代码传任意路径或裸 reader。
2. 实现十类投影的唯一来源规则：
   - cost/token 仅已登记 usage receipt；duration/tool_count 仅已登记 execution/usage record；attribution 仅已登记 launcher/transcript metadata；automation_rate 仅已登记 orchestrator dispatch aggregate。
   - review 仅正式 review result；verification 仅正式 verification/test receipt；stage_reconciliation 仅 stage topology 加 canonical journal/receipt；human_intervention 仅正式 human confirmation。
   - 缺登记来源的类型各写一条 `missing/no_registered_source`，已登记但找不到对象写 `missing/not_found`；读取、格式、坏行和相同 ID 冲突分别写规定的 `unknown`。绝不由 v1、artifact health、流程排序或正文推断补值。
3. 对 reconciliation 逐个 expected step 生成事实：以 manifest 为 expected，以 journal/receipt 为 observed；`completed`、`failed`、`skipped`、`missing-stage` 都是合法 present value，其中 skipped 必须有 skip receipt，missing-stage 的 terminal/skip 关联字段均为 null。
4. 对 automation rate 只消费已登记 aggregate，验证同 scope 正分母与 `automated + manual = denominator`，以确定性规则得到 ppm；分母缺失、不可验证或为零一律 `missing/not_found`，不将 v1 dispatch 当分母。
5. 将第六个索引加入 collector 的固定持久化列表，采用 v2 merge/parse 分支，在同一锁中独立原子写 `indexes/runtime-facts-v2.jsonl`。v2 生成或合并失败时保留原 v2 文件且报告该文件失败，不产生半写 v2 内容；v1 的五个既有索引和数据不迁移、不重编码。

完成条件：collector 只从允许来源生成 v2；每次运行都能同时保留 v1 和 v2，且 v2 失败可见、无部分 v2 写入。

### 阶段 3：接入正式入口并锁定消费者边界

修改 `tools/cli/collect-task-facts.mjs`，通过唯一生产入口创建 v2 registry 并传给 collector；若新增 v2 配置模块，默认只声明已批准的空/直接 canonical 来源能力，不注册新的外部数据源。

1. 保持启动参数、StageContext 预检、metrics 的 warn-only 行为和 v1 registry 调用不变；为 v2 使用同一执行 run scope，但不复用 v1 record 或 ID。
2. 让直接 canonical adapters 仅通过 TaskHandle/TaskKernel 可验证记录读取并验证 task、stage、attempt 和对象身份，再公开最小字段；不能泄露 review 原始输出、测试日志、对话正文、私有会话位置或完整 actor/调用内容。
3. 用 fixture 明确消费者边界：v1 的 `step_skip`/raw dispatch 与 v2 的 reconciliation/aggregate rate 是两套独立输入；本阶段不增加 M15 读取、汇总、排序、迁移或跨文件合并代码。

完成条件：命令产生或报告六个独立索引结果；生产空来源时十类 v2 均为正确的 missing，而已有 canonical 记录仍可通过受控 adapter 形成 present。

### 阶段 4：行为、失败与兼容验证

扩展 `tests/m14b-fact-collection.test.mjs` 的索引清单与 v1 回归断言，并新增聚焦 v2 的测试文件（命名以实现时现有测试布局为准）。

1. 单元测试十类值对象、固定信封、来源 class/对象主键、scope、精确 `rf2_` canonical hash、状态矩阵、未知错误净化、隐私字段拒绝、确定性排序和重复冲突。
2. 用真实 TaskHandle fixture 测试受控 registry、没有来源、每种 canonical present、找不到对象、读错、格式错、坏行、冲突、错误 scope、跳步 receipt 和自动化分母边界；断言没有零值或猜测值替代 missing/unknown。
3. 覆盖 reconciliation 的 completed/failed/skipped/missing-stage 全状态与 automation rate 的 ppm 公式；验证 verification/review 只公开允许摘要，human intervention 只公开允许 actor。
4. 覆盖 collector 全链：v1 与 v2 文件并存、v1 字节和语义不变、v2 不跨读 v1、坏 v2 batch/写失败不覆盖旧 v2 内容、预检失败不读取来源或写任一索引。
5. 按顺序执行 `vitest` 的 M14b 聚焦文件、`npm test`、`npm run check`。任何失败先修复实现/测试契约，再重新执行受影响的命令。

完成条件：每条 v2 验收标准都有可失败的自动化证据；全套回归和结构检查通过。

## 依赖与交付顺序

1. 阶段 1 先锁定 v2 合同和 ID，避免 collector 在不稳定 schema 上写数据。
2. 阶段 2 依赖阶段 1；阶段 3 依赖阶段 2 的 registry/collector 接口。
3. 阶段 4 从阶段 1 起逐步添加测试，但只在阶段 2、3 完成后进行全链与全套回归。
4. 每个实现阶段完成后先跑相关聚焦测试；所有源代码、测试与入口改动完成后才跑完整测试和检查，并接受 build-code 的正式阶段审查。

## 验收映射

| 验收标准 | 实现落点 | 自动化证据 |
| --- | --- | --- |
| AC-V2-001、002、003、017 | 阶段 1 的信封、十类 schema、唯一来源/对象/run 绑定与 `rf2_` ID | 十类记录与 canonical hash 单测 |
| AC-V2-004、005、006、007、008 | 阶段 1/2 的状态、直接来源、cost/token、duration、attribution | 无来源、错误和隐私 fixture |
| AC-V2-009、010、011 | 阶段 2 的 canonical review/verification、reconciliation、automation aggregate | 各 canonical fixture、四种 stage 状态、ppm 边界 |
| AC-V2-012、014、016 | 阶段 1/2 的 deterministic merge、工具计数与 fail-loud 写入 | 重复、计数不等、坏 batch/写失败测试 |
| AC-V2-013、015 | 阶段 2/3/4 的双索引隔离和 fixture-only consumer boundary | v1 字节/语义回归与无跨文件消费断言 |

## 风险与控制

- 正式记录的字段或可读性可能与 v2 值合同不完全一致：按 `unknown/unsupported_format` 暴露，而不是添加宽松解析或猜测。
- 直接 canonical 记录多、身份关系强：所有 adapter 必须先验证 task/stage/attempt，再投影最小公开字段；测试要覆盖伪造和错任务记录。
- v2 扩展可能意外改变 v1：保持独立常量、文件名、ID 前缀、合并入口和测试基线；不重用 v1 schema 分支。
- 原子写路径的部分失败：在 v2 写前完成全部 v2 候选验证/合并，并用现有写入失败钩子证明旧文件保持可读。
