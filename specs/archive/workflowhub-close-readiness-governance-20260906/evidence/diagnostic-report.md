# 三问与收口治理诊断报告

- task_id：workflowhub-close-readiness-governance-20260906
- material_revision：build-spec 当前草案；Phase 4 只补充本 derived evidence
- 版本：v2（build-spec evidence，不是第五材料）
- build-plan 消费者：build-plan 只读消费综合结论和边界，不重写诊断来源。

## research-Q1

source: `decision-log.md#三问诊断`、本任务 make-decision 交接事实
evidence: `quality/evidence/direction-review/` 与当前四材料中的收敛记录
impact: 结构化问题卡、方向审查、Grill、最终确认和四材料责任边界改善前期收敛，但不替代实现和 verify 质量。
conclusion: 已核实为本任务内的过程事实；没有跨历史任务全量统计，因此不能推出后续交付必然通过。

## research-Q2

source: `decision-log.md#质量-成本治理`、`spec.md#上下文与审查边界`
evidence: `quality/evidence/context-baseline.json`、Phase 3 budget/observation execution facts
impact: 主会话反复携带大材料、findings 处置集中、审查 packet 缺少分层导航，会增加重复阅读和复核负担。
conclusion: 结构性根因得到支持；当前没有可信 token 计量，不能把用户体感或字符代理写成真实 token 降幅承诺。

## research-Q3

source: `spec.md#材料质量与上下文`、`tasks.md#AC 四段卡与任务 oracle`
evidence: `quality/evidence/build-plan/`、AC 四段卡和任务 oracle 合同测试
impact: 旧材料对低智力执行的保障度有限，主要风险是 AC 语义漂移、缺少 reject oracle、入口身份/快照与材料导航不完整。
conclusion: 四材料体系可追溯但只能在新增可检查合同、当前 packet 和真实测试事实存在时提高执行可靠性；缺失质量事实仍保持 incomplete/unavailable。

## 综合结论

source: `decision-log.md#收口边界`、`spec.md#六状态与统一回退协议`
evidence: Phase 1–4 contract tests、stage handler facts、独立审查结果（若 unavailable 则保留 unavailable）
impact: 标准 close、quality incomplete、product not released、physical close 和 delivered-with-risk 必须分开展示；协议错配应拒绝写入，证据缺失应事实化记录。
conclusion: 本任务继续在同一 task 内补齐冻结、路由、暂停、预算、观测、统一回退和材料边界；不修改历史任务，不新增公共入口、store、第五材料、第二状态机或 close gate。
