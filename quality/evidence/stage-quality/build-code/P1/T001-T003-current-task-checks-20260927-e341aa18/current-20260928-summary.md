# P1 当前有界收尾（2026-09-28）

本次仅执行 P1 三项任务检查和联合检查，未修改三份交付文档、Phase/spec/index、运行时代码或测试，未发布正式阶段事实、未发起审查。原件与身份统一见同目录 `current-20260928.evidence.json`，四份 `*-current-20260928.transcript.txt` 各以唯一 COMMAND 开头、EXIT=0 收尾；未覆盖或复制旧原件。

## 当前结果与身份

T001 `rules doc OK`、T002 `entry inventory OK`、T003 `ADR-0033 OK`、联合检查 `P1 doc assertions OK` + `ADR-0033 tracked`，四条命令均 exit 0。Node v24.14.0。前后七份材料的 SHA-256 一致，运行时身份也一致：材料 `revision-ee00eb3ef867736fc6d57d01923e9f2c7b862421136c9e2ef7fcbdf0a2b455b7`，当前工作树 `8123e0fa6225d377f222b7003d03a781afc867f7`。Phase 指定的 HEAD tree `2a0e21e65488fba4e4507e4491f9edcab8e4585b` 另列在原件，不能把它当作未提交工作区身份。Task 整体仍 partial，旧阶段行 stale；本次不宣称整卡完成。

## 实际来源和消费者核对

- T001 对照 `spec.md:293-298,326-337` 的需求/DER，以及规则文档 `:5-47`：九个 DER、可失败标准、只读/隐藏、有效 RED、路线适用、预算诊断、命名及不对称呈现均有对应文本；`vitest.config.mjs:26` 明确引用规则文档。权限样例仅按 `rules:15` 的局部边界引用，不冒充整个 AC-17 通过。
- T002 对照 CLI `stage-runtime.mjs:1987-2057`、facade `runtime-facade.mjs:3-11`、`package.json:6-25`、报告工具 `complexity-report.mjs:432-456`：七类公共行为、路由与 npm 包裹关系符合来源；默认复杂度报告确实会写基线。本次没有运行这些业务入口，库存“未核实”保留，不因文档检查通过升级。库存 `:53-55` 三面均列 CARD-10 为未来消费者，尚未跨卡验收。
- P4 真正调用 `buildPostAcceptanceChainRows` 见 `stage-runner.mjs:4264,4450`；P5 三个报告导出见 `stage-end-report.mjs:54,237,310`。库存 `:54-55` 已把实现存在与真实消费未验收分开，旧“仍为空壳/未导出”不再是现行缺口。
- T003 对照 ADR `:3,11,19` 与 `decision-log.md` D-002/D-004/D-005/D-008：保留聊天交付、独立执笔、逐条坏消息、缺事实不阻断；已区分新增报告文件/schema 与不新增推进门。ADR 已在 index 跟踪，未提交。P2–P5 引用的接口/报告任务仍各自验收，不由 P1 关键词检查代证。

## 审查处置与剩余限制

原 `architect-fallback-output.json` 及 `architect-fallback-dispositions.json` 是既有一次替代审查，未新建审查：P1-ALT-01 的检查身份本次已重采；ALT-02 的 ADR 文件/schema 冲突已在 ADR-0033:11 修正；ALT-03 的帮助入口原件仍由库存:7 引 `T002-help.txt`。原 official attempt `e7623be1` 为 REVIEW_SOURCE_DRIFT/unavailable；这些修后字节未重新审查，不能写“现版正式审查通过”。后续只复用旧原件和处置，不再为 P1 开新 OCR 或替代审查。

规则文档:45 与当前 spec:417 仍写 exceptions 空数组不合法；用户已允许“没有例外”，其单一可信来源和机器表达由 P5 当前 owner 落实，本轮不擅自修改契约。真实 UI 消费关系仍 unknown；真实权限、CLI 业务效果、P5 报告和 CARD-10 对齐仍属对应阶段，不因本次四条绿而通过。

## 纯文档 G-2 与宪法边界

G-2 理由：本轮没有新生产行为，采用原四条可失败 Node/git 检查及真实来源读回，不人为制造行为 RED；历史缺文件/缺节 RED 只保留原身份。影响仅 AC-16 定义/规则、AC-17 规则文本、AC-21 入口库存文本。风险是关键词不能代证语义/权限/业务效果；最终 verify-code 继续核现版文字及各真实验收原件，不能把此说明当豁免通过。

按 `constitution-checklist.md` 22 条逐项核本轮边界：F1/F2/F5/F8/F10/F11（无代码、接口、新门/控制面）；F3/F6/F9（当前材料/真实原件和 HEAD/工作区身份分开，未发布）；F4/F7/Q1/Q2/Q3（不重审、不新增确认、不提交，既有 unavailable 与现版未审明确保留，不作质量通过裁决）；S1/S2/S3/S4/S5/S6/S7/S8（本轮无技能/依赖/分发改动，沿现有技能和证据目录，技能设计项不适用）。此核对只说明本轮操作边界，不替代独立质量裁决。
