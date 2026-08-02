# ADR 0009 — 同 snapshot Phase recovery（已废止）

**状态**：Superseded
**日期**：2026-07-26

本 ADR 曾为 `phase-pointer` 恢复建立一次性凭证与阶段翻转。复杂度治理后，历史
checkpoint、recovery generation 和 review 不再充当业务执行许可；正常任务始终依据当前
`decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 推进，并为正式完成重新采集当前质量事实。
本文件只保留旧记录的解释价值，不定义可调用入口。
