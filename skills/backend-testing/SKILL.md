---
name: backend-testing
description: 在 build-code 看到真实后端改动后执行风险导向测试；build-plan 只记录预判的 skill，不调用本技能。
version: 1.0.0
---

# Backend Testing

仅在 build-code 检查真实 changed files 后确认 backend/feature 范围时调用。读取 tasks.md
的预判和当前 Task，再按真实改动执行/补足业务行为、输入校验、错误边、权限、持久化/迁移、
并发和幂等的具体场景、命令、oracle、fixture 和证据路径；build-plan 不调用本技能，
也不依赖 testing-system-blueprint。
优先真实接口、真实序列化和真实数据边界；mock 只能补充，不能代替关键 seam。

策略必须记录 changed files、FR/AC、命令、expected exit、oracle、fixture/服务状态、
coverage limits 和当前 snapshot 绑定。build-code 再补 exit code、stdout/stderr hash、
实际结果和跳过项。测试失败、服务不可用或环境缺失原样记录；不降级成“通过”，不把完整
回归复制到每个 Phase。
