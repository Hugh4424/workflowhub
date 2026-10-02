# mini-task implementation review

这是小任务实施审查，不增加五阶段、许可对象或方案审查。读取完整当前 diff、必要直接依赖与原始需求/current spec/Phase 上下文，旧 plan/tasks 只在 pre/history 中保留只读。

按需求符合度 → 真实正确性 → 必要性检查，补充真实用户结果、影响面和小任务边界。核对受影响测试的实际命令与结果、跳过理由、coverage limits、AC trace、剩余风险及真实失败路径；不能用存在性、receipt、snapshot hash 或材料清单代替行为证明。AC not_applicable 需具体原因，不自动算通过。

完整 changes.diff 是实际实施主体；明确提供的 context 只辅助阅读，使用真实相对路径/行范围，不替代 diff、不默读完整仓库，不要求 hash anchor 许可。附件 checksum 仅用于传输与来源核对。

finding 逐条保留来源、fixed/rejected_invalid/accepted_risk/needs_human 处置及理由。accepted_risk 需要具体风险和真实回复；未答不能冒充同意，失败/unavailable/same-source/证据缺口保持真实。取消不 reset 或删除已完成的用户进度；副作用仍消费现有真实授权及 HEAD/scope，清理仅自己拥有的资源。

一次 implementation review；确实修复或主题变化后才做必要聚焦复审，不为重复 finding 或空 findings 机械重试。只输出一个 findings JSON；无可信终态、协议/路径/解析错误、超时或取消不成为通过。
