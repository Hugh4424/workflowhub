# ADR-0055：复杂任务三阶段与终末职责合并

- 状态：Accepted（方向）；实施与独立验收以当前任务实际原件为准。
- 日期：2026-10-27
- 来源任务：workflowhub-build-code-efficiency-verify-merge-20261026

## 背景

原 verify-code 阶段的验证、修复与报告在实施后另做一次交接，增加会话重建与状态分叉。用户选择把完整职责并入最后 Phase，并保独立判断与失败原件。

## 决定

复杂开发路线为 make-decision → build-plan → build-code；build-prd 仍是独立规划路线。原 verify-code 已并入 build-code 最后 Phase，16 项职责沿其终末表逐项保执行者、输入、证据和原判据。终末审查身份是 stage=build-code、review_scope=terminal，面名 build-code/terminal；阶段名单只读 stage-registry。

迁移按先并存后收缩执行：运行时、材料与真实消费者接通后，才退旧身份及目录。历史 verify-code 任务、ADR、研究、归档与审查只读保留，不重写原结论。最后 Phase 的普通审与终末整卡独立审合并同一次，整 stage 成本只在末次记录。

终末独立 reader 核唯一不可变 final-report 及实际证据后，现 run 只保存其引用，现 status 只投影独立事实；原审查与修复复验分别呈现。status、review、测试与报告都不成为继续、Git 或关闭许可证。关闭沿 stage-close 的既有授权、最终范围确认与安全边界，不自动接受风险。

## 后果

- 默认末尾交最终报告，不再自动 stage-handoff 或进入旧验证阶段；用户额外续接指针不变成新流程节点。
- 局部测试、材料齐全、原 provider 空 findings 都不证明业务或整个任务完成。每项真实缺口保 unknown/unavailable/incomplete。
- 当前方法和消费者同 Phase 迁移并首验；不能把首次消费拖到末 Phase。

## 备选方案

- 保留原五阶段：保留重复交接成本，未采用。
- 只改文档：运行时与真实 caller 仍断裂，未采用。
- 增第四个终末阶段：重新引入阶段身份与交接，未采用。

## 依据

当前任务 decision-log 的已确认方向及 spec 的 FR-MERGE-001…005、FR-CLOSE-001；P8 终末职责与 P9 身份实现；P10 当前方法及其首次消费者。历史原件不因本 ADR 改写，独立质量仍由真实审查与验收原件说明。
