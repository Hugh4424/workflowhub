# 最终验证记录

## 验收输入

最终审查必须同时读取：

1. 已接受的 `spec.md`；
2. 用户后续明确修正和 R14 实测缺口 `r14-gap-amendment.md`；
3. R14、R15 Canary 结果；
4. Multica 部署回读证据。

其中“每轮至少两次问答”已被用户后续要求取代：三轮都有独立职责、动态问题队列、
每答重排和事实收尾，但提问次数由真正未决问题决定，不得凑数。

`tasks.md` 是已接受计划的不可变输入，不修改原字节或事后勾选。本文件按测试、Canary、
部署回读和最终审查记录实际完成事实。

## 本地验证

- 交互合同与 workflow-v2：31/31 通过。
- Skill closure：通过。
- `git diff --check`：通过。
- 结构、宪法锚点、anti-host、extensibility、contract、stage quality、task record path：
  全部通过。
- 五阶段本地 Skill dispatch smoke：通过。
- 本次相关 Markdown：0 error。
- 完整并行测试：914/917 通过；仅 `m14b-fact-collection` 三项超过固定 15 秒，
  无断言失败。原始输出 SHA-256：
  `b339c61a059290320b7add78e2cc70b77e602ff072711183df22f0bcbfe02615`。
- 同一 M14b 文件独立运行：22/22 通过，0 失败。原始输出 SHA-256：
  `b5efd89ae852682d5878e56363fb8aadd2735b68627ae6ef72f8f1f491c30bcc`。

并行套件的三个失败属于既有慢测试在负载下触发 15 秒超时；不通过修改测试超时、
跳过测试或加入兜底来掩盖。

## 真实宿主验证

- R14：五阶段、三轮 talk、grill、八次单轴 spec-clarify、计划确认、两 Phase、
  Phase review、最终全树 review、fresh verify、独立 close 和全部 Issue 收尾均跑通。
- R15：技术配置不升级用户、Phase 公开描述不泄漏内部字段、最新证据覆盖旧结论、
  已完成任务重复唤醒零输出均跑通。
- 所有 Canary 临时 Multica project、目标仓库、worktree 和临时 branch 已清理；核心实现
  worktree 保留到用户检查和最终合并授权。

## 范围

- WorkflowHub 只改宿主中立的 Skill、审查合同、文档和测试。
- Multica 只改现有 Agent instructions 并原位同步现有 Skill。
- 没有修改 Codex/Multica 平台代码，没有新增 runtime、schema、状态机或 Provider。
- 没有更改任何 Agent model、provider 或 runtime。
