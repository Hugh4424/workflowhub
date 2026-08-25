# ADR-0019：质量事实单一归属与最小旧记录兼容

**状态**：Accepted — 2026-08-25

本批治理统一 `code_review` 的完成归属：由现有 verify-code stage outcome / `dsh-code-review` 作为完成语义的唯一 owner；`wh-review` 继续提供独立建议和 provenance，但不再与它并列成为第二个同名完成事实。现有真实消费者仍需要的旧 quality projection 只保留最小只读兼容层；所有 reader 迁移并有负向删除测试后删除，无真实消费者的旧记录直接删除。这样保留旧任务可读性，同时避免第二 writer、第二状态机或并列质量真相。
