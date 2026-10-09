---
name: fullstack-slice-testing
description: 在 build-code 看到真实跨边界改动后执行最小真实链路测试；build-plan 只记录预判的 skill，不调用本技能。
version: 1.0.0
---

# Fullstack Slice Testing

仅在 build-code 检查真实 changed files 后确认改动跨越前端/API/后端/数据库、认证、协议、
并发或边界不清时调用。按一个
用户可观察 slice 贯通：启动/健康状态、输入、真实请求、服务处理、持久化、返回
状态、前端呈现和失败/恢复。记录端口、进程、fixture、schema/协议、命令、oracle 和
清理；mock-only 测试不能代替这条 seam。build-plan 不调用本技能；build-code 按实际范围执行
这条 slice。

策略必须绑定 FR/AC 和场景/oracle，记录每条命令、expected exit、fixture/service、
截图（如适用）、本次实际代码/材料来源、coverage limits 和未覆盖 seam；post 读取当前 spec、所属 Phase 的当前 Task/预判及实际 task facts，只记录本 Phase 改动和命令实际来源；pre/history 旧 tasks/snapshot 只读保留，不重新绑定；build-code 再补 exit code、
输出 hash、实际结果和失败事实。它是风险证据，不成为 `pass` gate，也不要求每个 Phase
重跑无关的全量测试。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。
