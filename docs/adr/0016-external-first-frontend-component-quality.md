# 前端组件质量采用外部优先的薄适配

## 状态

Accepted — 2026-08-22

WorkflowHub 为组件化和前端代码质量增加 `frontend-component-quality`，但它只把组件动作、真实消费者、状态/CSS 责任和项目实际验证接入既有五阶段。React/Next 项目优先直接借用 Vercel 官方 MIT `react-best-practices` 的性能 code-lens：固定来源为 `vercel-labs/agent-skills` commit `dd089a8c752c966dee8bf0f27cb625ba193ffd9e` 的 `skills/react-best-practices/SKILL.md`（metadata version `1.0.0`），实施时完整放入 `skills/external/vercel-react-best-practices/` 并保留 LICENSE/UPSTREAM。跨框架部分保留为窄适配，不复制外部规则、不增加 gate、执行器或第二份质量材料。唯一维护 owner 是 WorkflowHub skill bundle maintainer；唯一调用者是 Build-plan、Build-code、Verify-code。无调用者，或固定上游完整覆盖薄适配时，先迁移调用者再移除该适配。这个选择避免把 UI 设计检查误当代码质量，也避免为了通用性重写已有成熟技能。

## Consumer / owner / removal

Owner 是 build-plan/build-code/verify-code 的 UI 交接合同；真实消费者是 Component Quality Map、前端测试和 verify-code 的设计对齐检查。若唯一消费者撤销或通用合同完全覆盖，先迁移消费者，再删除上游闭包和登记。
