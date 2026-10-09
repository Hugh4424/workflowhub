---
name: frontend-testing
description: 在 build-code 看到真实 UI 改动后执行状态和交互测试；build-plan 只记录预判的 skill，不调用本技能。
version: 1.0.0
---

# Frontend Testing

仅在 build-code 检查真实 changed files 后确认 frontend/UI 范围时调用。除了默认态，还要
覆盖 loading、empty、error、cancel、boundary、permission 和重复操作；检查用户
可见文案、状态恢复、键盘/可访问性和与后端契约的边界。真实 UI 流程按仓库的
isolated browser QA 路由执行，截图和清理事实必须保留。

执行事实必须绑定 FR/AC、场景/oracle、命令和 expected exit、截图/证据路径、changed files、
本次实际代码/材料来源、coverage limits 和不适用理由。post 按当前 spec、所属 Phase 与实际 task facts 定位，只记录本 Phase 改动和命令实际来源；pre/history 的旧 snapshot 只读保留，不重绑历史。build-code 只做真实流程执行；只做组件快照
不能冒充完整用户流程验收。

## UI 交付合同

每个 UI phase/task 必须写清 component action、real consumer、state owner、typed ViewModel、
CSS/token owner、fixture、viewport/responsive、browser、keyboard/a11y、performance、
screenshot 和 coverage limits。没有可执行 route 时写 `N/A — reason`；不能用 `not_applicable`
掩盖真实的 blocked/unknown。

状态与负例（negative fixtures）至少覆盖 loading、empty、error、cancel、boundary、permission、重复操作和
恢复路径。质量检查要拒绝 duplicate component、无 real consumer（no consumer）的删除、少于 two consumers
就 extract-shared、缺 state owner、CSS 泄漏、global override 和 `!important`；这些是失败事实，
不是推进 gate。失败、blocked、unknown 均保留 failure reason 和截图数量事实。

## build-code 实际消费

build-code 当前主会话按真实 changed files 选择一次具体测试路径，并把 UI 适用性、Design.md/Experience.md identity、consumer census 和 AC 绑定到同一份证据。现有 handler 的执行原件如实消费；不把尚未运行的官方 handler 当作主会话工作的前置条件。Skill 被声明或被解析不等于执行；未触发、已触发但未执行和已执行必须分别记录。

需要真实页面时，当前执行者通过既有 isolated-browser-qa 的受控执行链调用一次。证据必须带当前
service instance、API/DTO contract、隔离 profile、invocation、viewport、console/network/focus/overflow
观察、视觉/a11y/performance oracle 和 cleanup。fixture-only 只能证明组件，不得冒充页面通过；服务
身份不匹配、取消、浏览器失败或 cleanup 失败保持 `failed`/`blocked`/`unknown`，不能被默认值改成绿灯。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。
