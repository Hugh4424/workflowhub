# P1 build-code handoff

交付：测试资产治理规则、真实入口库存、ADR-0032。ADR 已暂存，`git ls-files` 能找到；未提交。三份文档的当前语义边界仍以 `decision-log.md`、`spec.md` 和 P1 卡为准。

实跑：T001/T002/T003 各自目标 RED 为文件不存在或 ADR 未跟踪/缺节，修后同门 GREEN；P1 复合 Node/git 命令输出 `P1 doc assertions OK`、`ADR-0032 tracked`，exit 0。正式 `verify --action=execute` 曾生成 `quality/tests/card04-P1-doc-gate.json`（exit 0），但此后修复了审查 finding，原 receipt 的源码快照已过期，须在最终稳定快照重采。Node 实跑为 v24.14.0；P1 早期卡面写 Node 22，版本差异保留。

AC 限制：AC-16 的规则写法与本卡样本有可回读文件，但尚无全样本语义验收结论；AC-17 物理只读/隐藏隔离未建立；AC-21 的真实入口库存只登记帮助入口和未跑路线，尚未证明完整业务链。关键词 gate 只证必备节存在。

审查：官方一次 P1 OCR attempt 为 `quality/reviews/attempts/e7623be1-6f1d-5258-aded-9b1e72812074/attempt.json`，两个 provider 完成输出，但因并行改动触发 `REVIEW_SOURCE_DRIFT`，无 canonical result，正式 `phase_review` 保持 `unavailable/incomplete`。依 AC-REVIEW-011 仅执行一次未参与 P1 实施的独立替代审查；输出和身份/覆盖限制见 `architect-fallback-output.json`、`architect-fallback-invocation.json`。三条 finding 的修复证据见 `architect-fallback-dispositions.json`，原始证据未删。替代审查不能冒充 canonical OCR result。

仍未解决：P1 卡给 T001/T002 共用 `P1-DOC-ASSERTIONS`，P13 冻结测试给任务级不同 check ID；两种口径均写入各 GREEN `.meta.json`，最终聚合前须由材料 owner 澄清。ADR 0032 与 CARD-05 已跟踪 ADR 重号。下一任务按索引为 P2/T004，质量缺口随最终汇总披露。

2026-09-27 补充：[独立 AC-16 真 task 样本逐行语义审计](AC16-real-task-semantic-audit-20260926.md)绑定当前 decision-log SHA/material revision，以 AC-16..21 六行为分母，定义层四要素 6/6 可核、未标缺项 0。它没有执行坏样本负控或发布官方质量事实，AC-17..19 的执行样例仍显式 MISSING；因此上文“尚无全样本语义验收结论”已由这份**本地样本审计**补强，但 AC-16 正式完成及其它 AC 通过仍未证明。卡面所列 `check-decision-log-chain.mjs` 位置参数当前被忽略，脚本也只报 D-chain advisory；不得把 exit 0 当语义验收。

范围纠正：上述六行只是 `decision-log.md:1413-1420` 的局部表；当前 `spec.md:503-505` 将本卡全验收标准集定义为 Appendix A 加 `decision-log.md:1313-1340`。因此不能把 6/6 当作 AC-16 的 100% 分母，完整范围审计正在单独补做；在其结果出来前继续标 `incomplete`，保留这份局部审计原件。

后续[完整范围审计](AC16-full-acceptance-set-audit-20260927.md)已识别 Appendix A 的 AC16–34 共 19 个互异 ID，定义层逐项四要素 19/19 可失败；但 `spec.md:506` 指向的 `decision-log.md:1313-1340` 实际没有 AC 表，真实六行表在 `:1413-1420` 且与 Appendix 前六项重叠。错误来源指针未标 incomplete，若原意包含其它 AC，其额外分母未知。故“完整范围审计正在补做”现更新为“审计已做、材料指针待 owner 澄清”，AC-16 仍 `incomplete`，未发布正式质量事实。
