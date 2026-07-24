# M14b 实施计划：task-local runtime-facts

## 1. 目标与交付

在现有四份任务内索引旁新增 `indexes/runtime-facts.jsonl`。它只记录六类直接机器事实：`cost`、`conversation`、`session`、`subagent`、`step_skip`、`automation`。每行遵守 `runtime-facts.v1`，可用稳定 `fact_id` 回溯到登记来源。

保留 `transcript-index.jsonl`、`artifact-index.jsonl`、`flow-health-facts.jsonl`、`skills-inventory.json` 的文件名、schema、写入顺序、去重和消费者行为。新事实不进入 flow health，也不成为流程 gate。

## 2. 已验证技术上下文

- 复用 `core/fact-indexes.mjs` 的严格字段校验、canonical JSON、合并去重与 JSONL 读写；不另建 schema 框架或第二套序列化器。
- 复用 `core/fact-collector.mjs` 的 StageContext 身份预检、TaskHandle 锁与单文件原子写入；新批次先完整校验、合并，再写入第五个文件。
- 复用 launcher-issued reader capability 和闭合 registry 模式。生产配置保持空 registry：当前没有获准的成本、归属或自动化来源。测试通过受控 capability 注入直接机器记录。
- 已检查当前实现：四旧索引只由既有 collector 负责。计划不修改 `core/stage-handlers.mjs`、TaskHandle 身份模型、旧索引 schema、私有日志或全局存储。

研究状态：已执行仓内调研；外部调研跳过，原因是接口、来源和验收均由已接受规格与现有代码锁定。

## 3. 数据与接口契约

### 3.1 runtime-facts.v1 行

- 在 `core/fact-indexes.mjs` 增加 runtime-fact 工厂、严格校验、稳定哈希、合并器和 JSONL 解析分支。字段固定为规格第 5 节定义的 12 个顶层字段；禁止额外字段。
- `fact_id` 只计算 canonical `{fact_type, source.class, source.registration_id, source.object_id}` 的 UTF-8 SHA-256，并加 `rf_` 前缀。重复且相同的 canonical payload 为 no-op；同 ID 的事实性冲突只写一条 `unknown/duplicate_id_conflict`，不保留任一冲突 value。
- `present` 只接受六类白名单 value；`missing` 和 `unknown` 的 value 恒为 `null`。`unknown` 只接受五个锁定原因且必须含去敏稳定 error。`run_id` 缺失、来源映射错误、未定义字段或不安全 error 均为 fail-loud。
- `schema_version` 固定 `runtime-facts.v1`。parser-only 改动只调整 `collector_version`；字段、枚举、类型、reason 或语义变化必须新 schema version。

### 3.2 受控来源

- 在 `core/fact-collector.mjs` 增加独立 runtime-fact reader capability、闭合 source registry 与 `fact_type → source.class` 唯一映射。registry 是唯一入口，不接收路径、目录扫描、裸 reader、原始对话或推断输入。
- 每个 registry entry 在读任何 source 前校验身份、类型、source class、registration ID 与 capability。重复登记、同类型多来源、跨任务身份或输入 schema 错误立即失败；runtime-facts 本批不写部分数据。
- 各 source adapter 仅投射规格第 6 节的白名单字段。conversation 明确拒绝 `body`、`content`、`text` 或可还原正文。session 和 subagent 的 parent 值只取 launcher 登记字段。cost 不从 token、模型、时长或价格表计算。
- 未登记来源为 `missing/no_registered_source`；已登记对象不存在为 `missing/not_found`；普通未跳步不生成 `step_skip` 缺口。读错、格式错、坏行、冲突和显式 legacy marker 映射到各自的 unknown reason。

### 3.3 持久化与兼容

- 扩展现有 `INDEX_REFS`、锁内编排和 CLI 组装，使第五个 index 与旧四索引由同一次受控 collection 返回，但不改变旧 index 的内容或 health 计算。
- 在开始任何写入前完成 runtime registry 与整批 candidate 校验；随后沿用现有 TaskHandle 单文件原子写入。写入错误保持稳定错误并使本次 collection 失败，绝不降级成 missing 或 unknown。
- 新增最小 `config/runtime-fact-sources.mjs`，只导出空的生产 registry 声明。`scripts/collect-task-facts.mjs` 只将该配置经受控 factory 传入 collector。未来真实 source 需单独批准输入契约，不能在此任务隐式启用。

## 4. 实施顺序

1. 先实现并单测纯数据契约、稳定 ID、合法状态、去重和历史 JSONL 解析。
2. 基于已完成契约实现 runtime source capability 与六类投影，先做输入校验再读取。
3. 将已验证批次接入既有收集锁、第五文件和空生产配置，确认旧四索引完全隔离。
4. 用受控 fixture 覆盖全部 AC、隐私、来源冲突、写入失败、兼容快照与来源可追溯性。
5. 先跑目标测试，再跑全套测试与结构检查；修复有效 finding 后按 build-code 阶段再次正式审查。

## 5. 测试策略与验收映射

| 需求 | 实现任务 | 证据 |
| --- | --- | --- |
| FR-001、FR-002、FR-004、FR-006、FR-009、FR-010 | T001 | runtime-facts 工厂、validator、hash、merge 与 JSONL 单测 |
| FR-003、FR-005、FR-007、FR-008、FR-011、FR-013、FR-014 | T002 | registry/capability、六类 projection、拒绝与隐私负例 |
| FR-001、FR-011、FR-012 | T003 | 第五 index 编排、空生产来源、旧四索引隔离回归 |
| AC-001 至 AC-012 | T004 | 表驱动集成 fixture、旧索引字节和消费者回归 |
| 全部 FR/AC | T005 | 目标测试、`npm test`、`npm run check` 与正式阶段审查 |

重点反例：重复 registry、source class 错配、伪造任务身份、无来源、not_found、五个 unknown reason、对话正文、重复及冲突 fact_id、旧 schema、legacy marker、原子写入失败、文本或顺序或 token 或默认值反推否证、三态序列化区分。

## 6. 风险、回滚与边界

- 风险：当前无登记的成本、归属与自动化 source。处理：生产结果诚实写 missing，不估算、不补采。
- 风险：新来源的宽松输入会泄露正文或伪造归属。处理：闭合 capability、白名单 value、稳定去敏错误和拒绝测试。
- 风险：新文件影响旧收集结果。处理：不改旧 merge/health/schema，并对四旧文件内容与消费者测试做回归。
- 回滚：撤回第五 index 的 collector 接线与新增模块即可；旧四索引没有格式或内容迁移。已写 v1 历史数据不原地改义；未来契约变化新开 schema version。

## 7. 最小化检查

- P0：六类可审计事实和 M15 输入已由接受规格授权。
- P1：现有 validator、registry、TaskHandle lock、atomic write、JSONL merge 可直接复用。
- P2：在 `fact-indexes` 和 `fact-collector` 做窄扩展，不复制旧 collector。
- P3：仅新增 runtime-facts 契约、空 source 配置和验收 fixture；不建 adapter、全局分析、迁移、LLM 或通用抽象。

## 8. 交付边界

build-code 的输入是本计划、`tasks.md`、已接受 `spec.md`，以及当前工作区中旧四索引实现。不得修改已接受规格，不得新增真实 billing、adapter 或 orchestrator 集成，不得读取私有日志、缓存或对话正文。
