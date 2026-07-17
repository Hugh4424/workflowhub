# 宪法检查

- F1/F2：Multica 配置与 WorkflowHub core 分责；Prompt 不复制 runtime 实现，Skill 闭包保持自包含。
- F3/Q2：close 不以质量分数阻断；只在物理交付事实缺失时拒绝写 `completed`，属于机器强制入口校验。
- F4：阶段质量仍由独立 `wh-review` 产出；`simplicity-guard` 只是其中一个只读 lens。
- F5/F10：新增检查均有 ZHI-183/184/189/194 或 close 漏项的真实事故来源；Canary 验证可证伪行为。
- F7：只保留方向、计划、最终验证和具体 close plan 四个用户边界；不让每个 phase 等确认。
- F8：不新增认证、adapter、provider、状态机或通用 Git 框架；优先原地改 Prompt、binding 和现有 close core。
- F9：真实 mention、产物、Git 包含关系、remote、worktree 和 branch 都以平台/Git 事实为准；缺失即明确失败。
- S2/S8：WorkflowHub 不依赖 Multica，Multica 配置不进入 core；各 Skill 仍可独立调用和搬运。

结论：修订后方案不触发宪法禁止项。close 入口和四个用户边界是宪法已有要求，不是新增扩张。
