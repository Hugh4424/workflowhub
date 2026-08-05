---
name: backend-testing
description: 为 build-plan 的后端或服务端 Task/Phase 设计风险导向测试策略；build-code 执行已记录策略并留痕。
version: 1.0.0
---

# Backend Testing

仅在 `test-routing-advisor` 选中 backend/feature 范围时，在 build-plan 调用。先读 blueprint，
再按实际改动设计业务行为、输入校验、错误边、权限、持久化/迁移、并发和幂等的具体
场景、命令、oracle、fixture 和证据路径；build-code 不重新调用本技能。
优先真实接口、真实序列化和真实数据边界；mock 只能补充，不能代替关键 seam。

策略必须记录 changed files、FR/AC、命令、expected exit、oracle、fixture/服务状态、
coverage limits 和当前 snapshot 绑定。build-code 再补 exit code、stdout/stderr hash、
实际结果和跳过项。测试失败、服务不可用或环境缺失原样记录；不降级成“通过”，不把完整
回归复制到每个 Phase。
