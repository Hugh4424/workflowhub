---
name: backend-testing
description: 在 build-code 看到真实后端改动后执行风险导向测试；build-plan 只记录预判的 skill，不调用本技能。
version: 1.0.0
---

# Backend Testing

仅在 build-code 检查真实 changed files 后确认 backend/feature 范围时调用。post 读取当前 `spec.md`、所属 `phases/P<n>.md` 的预判和当前 Task，以及实际 task facts；pre/history 的 `tasks.md` 只读保留，不把历史预判改绑到当前 Phase。再按真实改动执行/补足业务行为、输入校验、错误边、权限、持久化/迁移、
并发和幂等的具体场景、命令、oracle、fixture 和证据路径；build-plan 不调用本技能，
也不依赖 testing-system-blueprint。
优先真实接口、真实序列化和真实数据边界；mock 只能补充，不能代替关键 seam。

策略必须记录 changed files、FR/AC、命令、expected exit、oracle、fixture/服务状态、
coverage limits 和本次实际代码/材料来源。post 只绑定当前 Phase 声明的改动与命令执行时的真实来源，不创建跨 Phase snapshot；pre/history 原 snapshot 只读保留。build-code 再补 exit code、stdout/stderr hash、
实际结果和跳过项。测试失败、服务不可用或环境缺失原样记录；不降级成“通过”，不把完整
回归复制到每个 Phase。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。
