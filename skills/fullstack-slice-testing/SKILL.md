---
name: fullstack-slice-testing
description: 为 build-plan 的跨服务、API、数据或端到端 Task/Phase 设计最小真实链路测试策略；build-code 执行已记录策略并留痕。
version: 1.0.0
---

# Fullstack Slice Testing

仅在改动跨越前端/API/后端/数据库、认证、协议、并发或边界不清时，在 build-plan 调用。按一个
用户可观察 slice 贯通：启动/健康状态、输入、真实请求、服务处理、持久化、返回
状态、前端呈现和失败/恢复。记录端口、进程、fixture、schema/协议、命令、oracle 和
清理；mock-only 测试不能代替这条 seam。build-code 不重新设计这条 slice。

策略必须绑定 FR/AC 和场景/oracle，记录每条命令、expected exit、fixture/service、
截图（如适用）、snapshot、coverage limits 和未覆盖 seam；build-code 再补 exit code、
输出 hash、实际结果和失败事实。它是风险证据，不成为 `pass` gate，也不要求每个 Phase
重跑无关的全量测试。
