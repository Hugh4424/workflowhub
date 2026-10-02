# mini-task design review

这是小任务方案审查，不增加五阶段、许可对象或实施审查。只读 bundle 中完整当前需求、decision-log、spec 与必要 Phase/索引或 pre/history 的旧 plan/tasks 上下文，不认证“四材料冻结”身份。

检查边界是否小且清楚、单一结果是否完整、实际依赖/消费者、流程/状态、失败恢复、验收与测试、回滚和 Git 副作用保护是否一致。重大架构、迁移、权限、安全或范围扩大会改变交付，应具体指出；没有完整五阶段文档或漂亮流程痕迹本身不是问题。

finding 逐条说明 fixed、rejected_invalid、accepted_risk 或 needs_human，普通 finding 不省略。风险接收对应具体后果与真实用户回复；未知/未答保留，真实安全保护不被“接受损失”取消。来源与传输 checksum 是事实，不作为 WorkflowHub 身份认证或继续许可。

只输出一个 findings JSON；没有真实终态、超时、取消、路径/协议/解析错误保持 unavailable/incomplete。空 findings 不表示完成或批准，不输出 verdict/pass/fail/summary。
