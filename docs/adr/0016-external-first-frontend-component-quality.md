# 前端组件质量采用外部优先的薄适配

## 状态

Accepted — 2026-08-22

WorkflowHub 为组件化和前端代码质量增加 `frontend-component-quality`，但它只把组件动作、真实消费者、状态/CSS 责任和项目实际验证接入既有五阶段。React/Next 项目优先直接借用 Vercel 官方 MIT `react-best-practices` 的性能 code-lens：固定来源为 `vercel-labs/agent-skills` commit `dd089a8c752c966dee8bf0f27cb625ba193ffd9e` 的 `skills/react-best-practices/AGENTS.md` compiled guide（metadata version `1.0.0`）；实际只读闭包已在 `skills/frontend-component-quality/upstream/react-best-practices/`，保留 LICENSE/UPSTREAM，由现 `frontend-component-quality` 消费，不把尚不存在的 `skills/external/vercel-react-best-practices/` 当当前运行源。跨框架部分保留为窄适配，不复制外部规则、不增加 gate、执行器或第二份质量材料。唯一维护 owner 是 WorkflowHub skill bundle maintainer；唯一调用者是 Build-plan、Build-code、Verify-code。无调用者，或固定上游完整覆盖薄适配时，先迁移调用者再移除该适配。这个选择避免把 UI 设计检查误当代码质量，也避免为了通用性重写已有成熟技能。

## Consumer / owner / removal

Owner 是 build-plan/build-code/verify-code 的 UI 交接合同；真实消费者是 Component Quality Map、前端测试和 verify-code 的设计对齐检查。若唯一消费者撤销或通用合同完全覆盖，先迁移消费者，再删除上游闭包和登记。

## 2026-11-02 历史摘要路径决定

上述 2026-08-22 原记录保留。C06 的旧 21 行派生摘要曾待裁决；用户于 2026-11-02 选择逐字节移至 `skills/frontend-component-quality/upstream/react-best-practices/history/AGENTS-21lines.md`，原 `AGENTS.md` 路径用于固定上游文件；catalog、契约测试及相关引用按摘要的历史身份同步。原答复：`quality/evidence/human-confirmations/2026-11-02-003-build-code-history-path.json`（C06 任务目录）。

摘要为单独历史件，不是规则源，也不计入 76 个上游文件；本决定不证明迁移、引用同步或测试已完成。上游许可与再分发权利仍未完整核实，本地个人研究范围不等于已获许可。
