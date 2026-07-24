# M14b 任务清单：task-local runtime-facts

## 执行规则

- 串行关键路径：T001 → T002 → T003 → T004 → T005。
- T001 的纯数据测试可先 RED；每个实现任务只改本任务列出的区域。
- 不新增生产 source。生产 runtime registry 为空，这是本规格要求的真实缺口表达。

## T001 — 建立 runtime-facts.v1 纯数据契约

- 动作：在 `core/fact-indexes.mjs` 增加 runtime record factory、严格字段和值 validator、source/type 映射校验、canonical fact ID、去重冲突处理和 runtime JSONL parse/serialize 支持。
- 影响区域：`core/fact-indexes.mjs`；新增或扩展紧邻事实索引的单测。
- 需求：FR-001、FR-002、FR-004、FR-006、FR-009、FR-010；AC-001、AC-006、AC-007、AC-008。
- 依赖：无。
- 验证：六类合法行、固定字段、present/missing/unknown 组合、collector-only version、拒绝额外字段和非法枚举；相同输入幂等，冲突只产出 `duplicate_id_conflict`。
- 并行：可与 T004 的 fixture 设计并行；代码实现是后续阻塞项。

## T002 — 接入受控来源与六类投影

- 动作：在 `core/fact-collector.mjs` 增加 runtime reader capability、闭合 source registry、整批预校验和六个白名单 adapter。先校验 source identity/registration/type 再读；生成 missing、not_found、unknown 和 present。
- 影响区域：`core/fact-collector.mjs` 及受控测试 helper。
- 需求：FR-003、FR-005、FR-007、FR-008、FR-011、FR-013、FR-014；AC-002 至 AC-006、AC-009。
- 依赖：T001。
- 验证：重复或错配来源、伪造任务身份和非法 value 在 reader 调用前失败且 runtime index 未改；conversation 不落正文；跳步 receipt 生成一条事实、普通未跳步不生成行；五个 unknown reason 都有稳定去敏错误。
- 并行：与 T003 不并行，T003 依赖投影接口稳定。

## T003 — 写入第五索引并保持旧链不变

- 动作：把 `indexes/runtime-facts.jsonl` 加入既有 collection 编排；复用锁和原子单文件写入。新增 `config/runtime-fact-sources.mjs` 的空生产声明，并让 `scripts/collect-task-facts.mjs` 仅通过受控 factory 注入它。
- 影响区域：`core/fact-collector.mjs`、`scripts/collect-task-facts.mjs`、新增 `config/runtime-fact-sources.mjs`、相关 CLI 单测。
- 需求：FR-001、FR-011、FR-012；AC-003、AC-009、AC-010。
- 依赖：T002。
- 验证：空 registry 不读取私有位置，写出规定 missing 行且不造 step_skip 缺口；写入失败为可断言失败；四旧 index 的 schema、内容快照和 consumer 输入保持不变，flow health 不读取 runtime-facts。
- 并行：无，完成后才能跑完整集成验收。

## T004 — 完成 AC 级别 fixture 与回归

- 动作：扩展 `tests/m14b-fact-collection.test.mjs` 或紧邻的 runtime-facts 测试，使用临时 TaskHandle、固定 clock 和受控 reader 覆盖十二项 AC。
- 影响区域：`tests/m14b-fact-collection.test.mjs` 与必要的 fixtures；不得新增真实 adapter、私有日志 fixture 或外部服务。
- 需求：FR-001 至 FR-014；AC-001 至 AC-012。
- 依赖：T001、T002、T003。
- 验证：全六类 source、无来源、not_found、隐私拒绝、skip、五种 unknown、稳定 dedupe/conflict、版本边界、fail-loud 与四旧索引兼容；每条 present 能以 registration/object ID 或 receipt ref 回溯；构造文本、顺序、token 或默认值可得的伪成本和父子归属输入，断言不生成 present；对同一事实分别断言 present、missing、unknown 在 status、value、reason、error 上无歧义可区分。
- 并行：可将纯 fixture 编写提前，但最终绿测依赖 T003。

## T005 — 运行质量验证并准备阶段证据

- 动作：先运行目标事实采集测试，再运行完整测试和结构检查；收集命令结果作为 build-code 的测试证据，并在每个代码阶段完成后跑正式 wh-review。
- 影响区域：无产品代码；测试和阶段证据。
- 需求：全部 FR/AC。
- 依赖：T004。
- 验证：`npx vitest run tests/m14b-fact-collection.test.mjs`、`npm test`、`npm run check` 全部通过；无有效 review finding，或已用同一需求映射修复并复审。
- 并行：无。

## 完成定义

T005 完成且正式 build-code 审查通过，才可交给 verify-code。验证不应把 missing 或 unknown 当失败；只有身份、注册表、输入 schema 或写入完整性错误才应失败。
