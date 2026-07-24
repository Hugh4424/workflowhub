# M14b：`runtime-facts.v2` 实施任务

## T1｜建立独立 v2 事实合同

**依赖：** 无

**修改：** `core/fact-indexes.mjs`

**工作：**

- 增加 v2 专属常量、十类闭集、来源 class 映射、值对象主键映射、scope 和固定信封；保留所有 v1 导出和行为。
- 实现 v2 `create`、`validate`、`merge`、`factId`、JSONL parse/serialize 路由，使用全 scope 的 canonical SHA-256 和 `rf2_` 前缀。
- 逐类校验 cost/token/duration/tool_count/attribution/review/verification/stage_reconciliation/human_intervention/automation_rate；执行 present、missing、unknown、隐私和安全 error 规则。
- 对同 ID 一致内容做幂等合并，对冲突只生成规定 unknown 记录并稳定排序。

**验收与测试：** AC-V2-001、002、003、004、005、012、013、016、017；新增纯合同测试，包含十类合法值、非法字段、对象 ID、scope 变化导致 ID 变化、确定性合并和错误净化。

## T2｜实现 v2 受控来源与投影

**依赖：** T1

**修改：** `core/fact-collector.mjs`，必要时新增 v2 专属来源配置模块

**工作：**

- 沿用现有 capability reader/registry 思路，增加封闭的 v2 registration 校验，禁止裸路径、未知字段、重复类型登记和不匹配 source class。
- 为十类事实建立唯一来源 projector：只允许 usage、launcher/transcript、正式 review、正式 verification/test、stage topology+journal/receipt、正式 human confirmation、orchestrator aggregate 中各自指定的一类。
- 为缺登记、对象不存在、读错、格式错、坏行和冲突生成准确状态；禁止从 v1、health、正文、流程顺序或估算值补齐。
- 实现 stage reconciliation 的四状态和 skip receipt 约束；实现 automation ppm 的同 scope 分母/分子校验。

**验收与测试：** AC-V2-004、005、006、007、008、009、010、011、012、016；fixture 覆盖每个允许来源的 present、所有缺失/未知分支、四种 stage 对照状态、工具计数之和、自动化率分母和私有字段拒绝。

## T3｜接入独立索引和唯一生产入口

**依赖：** T2

**修改：** `core/fact-collector.mjs`、`scripts/collect-task-facts.mjs`，以及 T2 所需的 v2 配置模块

**工作：**

- 把 `indexes/runtime-facts-v2.jsonl` 作为独立第六索引接入既有预检、单任务锁、merge 和原子写链；v2 失败不得覆写旧 v2 内容。
- 在唯一 CLI 入口构造 v2 registry 并传入 collector；保持 v1 registry、参数、metrics、预检和五个既有索引不变。
- 对直接 canonical adapter 验证 task/stage/attempt/object 身份，并只投影允许的公开最小摘要。
- 明确不注册新的真实 usage、转录或 dispatch 来源；生产空来源时十类 v2 均输出 missing，不以零值代替。

**验收与测试：** AC-V2-001、003、004、009、010、011、013、014；真实 TaskHandle 全链测试验证六文件结果、v2 原子失败、预检先于 reader、v1/v2 并存与 v1 回归。

## T4｜锁定消费者边界并完成回归验证

**依赖：** T1、T2、T3

**修改：** `tests/m14b-fact-collection.test.mjs` 和新增的 v2 聚焦测试文件

**工作：**

- 更新既有索引期望，保留原 v1 断言；新增 v2 合同、投影、持久化和失败注入测试。
- 用 fixture 证明 v1 raw step skip/dispatch 与 v2 reconciliation/aggregate rate 分开保存、分别读取；本任务不修改 M15 或添加跨索引 consumer。
- 运行聚焦 Vitest、`npm test`、`npm run check`，修复实现或测试中发现的真实回归后重跑受影响命令。

**验收与测试：** AC-V2-012、013、014、015、017，及所有 AC-V2-001 至 AC-V2-017 的端到端回归映射。

## 交付检查表

- [ ] `runtime-facts.v2` 与 v1 分文件、分 schema、分 ID、分 merge 路径。
- [ ] 十类事实都仅由唯一允许来源产生；无来源和异常不被伪装成数值。
- [ ] canonical review、verification、stage、human 数据被最小化投影且完成身份校验。
- [ ] v2 批次无效或写入失败时旧 v2 索引不被部分覆盖。
- [ ] M15、v1、外部来源注册和原始内容均不在改动范围。
- [ ] 聚焦测试、完整测试和结构检查通过，并附 build-code 阶段的正式审查证据。
