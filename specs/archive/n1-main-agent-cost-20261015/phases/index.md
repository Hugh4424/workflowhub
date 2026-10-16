# Phase 索引 — 主Agent成本观测

本件只导航实际Phase；工程设计与AC归spec，任务程序与验证归相应Phase，执行事实归task facts。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1.md` | L0 — 结果与变更 | `tools/cli/measure-main-agent-cost.mjs`；`docs/architecture/move-map.json`；`THIRD_PARTY_NOTICES.md`；`skills/catalog.yaml`；`skills/reuse-registry.md` | none | 显式CLI使用者与P2/T002自动留账实施者 |
| `P2` | `phases/P2.md` | L0 — 结果与变更 | `tools/cli/measure-main-agent-cost.mjs`；`docs/architecture/move-map.json`；`workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/build-plan/SKILL.md`；`workflows/build-plan/steps.json`；`workflows/build-code/SKILL.md`；`workflows/build-code/steps.json`；`workflows/verify-code/SKILL.md`；`workflows/verify-code/steps.json`；`skills/stage-reflection/SKILL.md` | P1 | 四阶段主会话、账本使用者与verify-code验收者 |
