# 治理文件豁免与依赖串行的共享写集

原先的写集独占判定与真实计划不符：12 份归档索引里的 15 条跨 Phase 重复写路径全部位于依赖串行的 Phase 对之间，治理文件重复为 0 条。决定对封闭 7 名治理文件集合豁免重复检查，并允许按 `Dependency` 构成祖先—后代关系（含传递依赖）的 Phase 共享实现文件；非串行同改仍报告原来的 `write set duplicates` 错误。这消除为绕过重复检查而合并独立 Phase 的诱因，保持既有接口与失败形状。

## 否掉了什么

不加数字阈值或最少 Phase 数校验，避免新字段与新门；不按 `docs/` 等路径前缀豁免，避免吞掉真实实现冲突。

## 后果与风险

治理文件的真实并发冲突不再由该检查拦住，仍由既有 `git diff --name-only` 与声明写集的独立审查兜底，不新增机制。白名单限于 `README.md`、`AGENTS.md`、`CLAUDE.md`、`CONTEXT.md`、`CONSTITUTION.md`、`GLOSSARY.md` 与 `architecture/components.yaml`（兼容 `.yml`，大小写不敏感）；新增治理文件名需要同步。串行判定只读取索引里的 `Dependency` 声明，不能证明实际执行顺序一致。

来源：本任务 `decision-log.md` 的 ADR-008 与 F4 修复设计原件第 1、2、5 节。生产 owner 与唯一消费者沿用 `validatePostPhaseContract` 及 build-plan 作者、build-code Phase 派发读取方；不创建新控制面。
