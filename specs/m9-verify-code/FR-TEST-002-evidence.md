# FR-TEST-002 验收出口记录

FR-TEST-002 要求 M9 自举端到端实跑（make-decision → build-code → verify-code 三段闭环）。

按 D-M9-7/F10：不单列实现 task，不堆额外 E2E 框架。

**验收证据**：M9 自举完成后，verify-code 产出的 `specs/{task-id}/stage-result-verify-code.json` 即为端到端实跑证据。

**当前状态**：M9 verify-code v1 代码已交付（apply 阶段完成），但自举实跑尚未执行（需在 test-acceptance 或后续会话中运行完整三段闭环）。本文件标注证据 pend，不伪造 pass。
