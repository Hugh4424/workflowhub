# Research: M14a 审计契约层

## 背景

workflowhub 已有 task record、metrics collector、worktree context、review artifact 与 stage-result 等执行事实，但这些事实分散在不同文件和阶段契约中。M14a 的目标不是新增诊断器或执行 gate，而是先建立一层窄、稳定、可追溯的审计契约，使后续实现与审查能区分机器事实、人类声明和未知状态。

本功能的关键约束来自上游决策：契约先行；事实来源必须可引用；未知不得假绿；failure taxonomy 只描述失败领域；skill registry 不等同于机器执行入口；harness surface 只声明边界与权限语义，不实现权限系统。

## 相关技术 / 已有实现

1. `metrics/record-schema.mjs` 与 `metrics/collector.mjs` 已提供执行记录核心字段、按 `execution_id` 更新、task/global 双写和写失败非阻断语义。新 execution trace 契约应明确与现有 metrics record 的映射或差异，避免形成两个含义相近但无法互操作的事实模型。
2. `core/task-record-paths.mjs` 与 `core/worktree-context.mjs` 已定义 task tracking root、task root、worktree context 等规范路径。`task_dir`、`target_repo_root`、`worktree_root` 等字段应引用这些现有解析结果，不另造路径发现规则。
3. 各 workflow 的 `stage-result-*.json`、review 产物和 evidence 目录已经体现 artifact-first 模式。`transcript_refs`、`artifact_refs`、`facts_refs`、`provenance` 应保存引用与来源元数据，不复制长日志正文。
4. `skills/wh-review/` 和 verify-code 相关流程已有 review round、人工确认、freshness 与 receipt 语义。审计 schema 应记录这些结果的可验证引用，但不得把 review/verify 的判断算法嵌入 schema。
5. JSON Schema 适合约束 execution trace 与 skills inventory 的字段、类型、枚举、必填项和版本标识；Markdown 适合表达 failure taxonomy、字段归属、harness surface 及兼容策略。两者应共享明确的版本规则，避免文档与 schema 漂移。

## 风险点

1. **重复事实模型**：若 execution trace 与现有 metrics execution record 字段同名异义，下游会无法判断权威来源。计划需给出字段归属表和现有字段映射。
2. **来源引用过宽**：仅用自由字符串数组可能允许空引用、不可定位路径或缺少来源类型。计划应评估最小 provenance 结构与 URI/path 约束，同时避免实现 parser。
3. **版本耦合**：把 schema 变化与 collector bugfix 共用一个 `version` 会制造无意义兼容变更。必须保留 `skill_version`、`schema_version`、`collector_version` 分离，并声明 collector 支持的 schema 范围。
4. **taxonomy 膨胀**：在 `failure_domain` 中混入 severity、root cause 或修复建议会把契约层变成诊断系统。九项首批枚举应保持封闭且窄。
5. **权限语义被误读为 enforcement**：`locked`、`append_only`、`editable`、`human_controlled` 只描述治理边界。文档必须显式说明本期不提供授权、阻断或自动修改能力。
6. **范围外实现混入**：per-skill `index.mjs`、采集 parser、blocking CI gate、自进化推荐均不属于 M14a。计划和任务必须把这些列为非目标，而非“顺手补齐”。
7. **可移植性**：已有上游材料含本机绝对路径。正式契约示例宜使用 repo-relative 或 task-root-relative 引用，并将不可移植路径视为 provenance 数据而非 schema 常量。

## 结论 / 建议

采用“schema + 解释性文档”的最小实现路径：完善 execution trace JSON Schema、failure taxonomy、skills inventory JSON Schema、harness surface 文档，并在 spec/计划中维护字段归属与 required reads。优先复用现有 task path、metrics、stage-result、review 和 evidence 机制；只定义可核查字段与来源约束，不新增采集器、诊断器、gate、权限系统或 per-skill runtime。

build-plan 应重点完成三项映射：新契约字段到现有事实源的映射、schema/collector 版本兼容映射、每项 FR 到具体契约文件及验证方式的映射。验证以 JSON Schema 可解析、枚举/required 字段静态检查、文档表格完整性和禁止项扫描为主。
