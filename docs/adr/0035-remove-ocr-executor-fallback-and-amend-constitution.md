# 0035 — 删除 OCR 替代执行者并修改治理口径

旧治理把 OCR 缺失或低版本与换执行者绑定，tools/cli/stage-runtime.mjs 的 fallback 闭包与 executor:"wh-review" 使失败可能被替代结果遮蔽。根据当前 decision-log 的 ADR-007、U-005 与 U-020 第 2 项，删除该闭包与 nativePacketFallback 参数链，runtime/review/ocr-delegation-adapter.mjs 如实说明未使用替代执行者，让 architect-code-review 仅作为与 OCR 可用性无关的独立同源补充轴，并将 CONSTITUTION 升至 1.9.3、逐条对照记录写入 constitution-checklist.md。选择保留真实 unavailable/unknown 而舍弃自动换执行者，避免同源结果冒充异源审查；公共结果 schema 本次不收窄，旧 provenance 与报告保持只读。
