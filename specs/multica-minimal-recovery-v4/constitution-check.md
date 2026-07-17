# 宪法检查

- [x] F1 薄核心：core 只增加窄的只读 close 事实核实，Git 写动作仍在 verify-code Skill。
- [x] F2 窄契约：close 仅传 task、plan hash、分支、commit 和 spec 路径等明确字段。
- [x] F3 物理事实靠机器校验但不阻断：日常质量事实只记录；snapshot 精确匹配和 close completed 属于不可逆入口校验。
- [x] F4 质量靠异源审查与人：阶段质量由 wh-review 独立来源审查，方向、计划、验证与 close 保留人工边界。
- [x] F5 gate 谨慎添加：make-decision 与 close 校验分别来自 ZHI-189 和真实 Canary 失败；未增加预防性认证门。
- [x] F6 统一外置执行记录：阶段 attempt、review、confirmation 和 completed record 继续写入 task tracking。
- [x] F7 不越过人：可逆中间步骤自动推进；需求歧义直达用户；具体 close plan 独立授权。
- [x] F8 简单优先：原地改 Prompt、binding 和现有 close core；不建 adapter、provider、统一 CLI 或状态机。
- [x] F9 可证伪不假绿：缺 decision-log、错误 mention、snapshot 漂移或任一交付事实缺失均明确失败。
- [x] F10 自动化按真实收益添加：新增 close 校验来自真实漏提交、漏归档、漏 push、漏清理及 Canary 合同冲突。
- [x] Q1 记事实而非阻断：审查结果和运行证据外置记录；只有合同入口与不可逆动作条件会拒绝推进。
- [x] Q2 gate 三类划分：物理入口校验、记录采集、人工确认分开；未把质量分数做成阻断门。
- [x] Q3 异源审查加人工把关：最终实现使用独立 provider、独立上下文审查，并由用户确认关键边界。
- [x] S1 能用外部就不造轮子：复用现有 Skill、wh-review、TaskKernel 和 Git，没有复制通用能力。
- [x] S2 外部技能按项目改造合宪：simplicity-guard 只作为指定 review lens 接入，不进入生成或实现步骤。
- [x] S3 迭代时就地检查：本次基于实时 Multica 配置、现有 Skill manifest 和 Canary 证据修订。
- [x] S4 自定义技能有指标系统：沿用 task tracking、review receipt 和测试结果，不新增旁路指标。
- [x] S5 方便子代理调用：各 stage Skill 与 review bundle 保持窄输入，重审可在独立上下文执行。
- [x] S6 参考成熟方案：复用现有 AgentHub close 行为与 WorkflowHub 已有不可变记录，不另造协议。
- [x] S7 一阶段一技能一目录：五阶段目录和 Skill 边界不变，未新增第六阶段或第二套 generation。
- [x] S8 可独立调用可搬运：WorkflowHub Skill 不依赖 Multica；Multica 只消费独立 Skill 与 Prompt 配置。

结论：21 项均符合。Canary 后 close 修复和 `project/task` 两值交接都有真实故障来源；没有引入长期理想架构范围。
