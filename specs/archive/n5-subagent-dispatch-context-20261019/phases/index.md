# Phase 索引 — 子代理派发与回传合同

> 指向各 Phase 独立权威的纯指针。由 Phase 契约头重新生成；本文件没有实现或完成权威。
> 每个 `phases/P<n>-<结果短名>.md` 恰好一行；引用与字段从实际契约头读取，不以 hash/认证 readback 判完成，也不承载命令、oracle、证据或执行状态。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-派发与回传合同.md` | `L0 — 结果与变更` | `AGENTS.md`；`GLOSSARY.md` | none | P2 研究技能作者、P3 登记作者、五阶段派发者与子代理 |
| `P2` | `phases/P2-研究技能对齐.md` | `L0 — 结果与变更` | `skills/deep-research/SKILL.md` | P1 | 研究技能读者、使用 deep-research 的派发者、verify-code |
| `P3` | `phases/P3-采用登记.md` | `L0 — 结果与变更` | `skills/catalog.yaml`；`THIRD_PARTY_NOTICES.md`；`skills/reuse-registry.md` | P1、P2 | 来源维护者、技能搬运者、catalog/notices/registry 读者与 verify-code |
| `P4` | `phases/P4-G1核算.md` | `L0 — 结果与变更` | none（只读消费与外置原件；无仓库写入） | P1、P2、P3 | 规则 owner、verify-code、后续同 cohort 卡作者 |
| `P5` | `phases/P5-全验收复核.md` | `L0 — 结果与变更` | none（只读消费与外置原件；无仓库写入） | P4 | 用户、verify-code 与后续同 cohort 卡作者 |

纯指针说明：正文契约、程序与判据由各 Phase 维护；本文件只导航实际 Phase，不复制 L0/L1/L2、命令、oracle、证据路径或执行状态。旧 pre cohort 任务卡只读保留，在本文件中没有有效行。
