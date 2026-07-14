---
name: test-routing-advisor
description: 根据改动范围为 build-code 选择 simple、feature 或 fullstack 测试层级；只判类，不执行测试。
---

# Test Routing Advisor

独立读取调用方传入的 `changed_files`、`phase_count`、`test_command`。禁止读取全局同名 skill，禁止执行测试，禁止修改仓库。

## 判类

- `simple`：只改文档、文案、静态配置，或单模块低风险改动；无接口、数据、权限、构建链变化。
- `feature`：一个功能域内的行为变化；需要目标单测和邻接集成测试，但无跨端或基础设施链路。
- `fullstack`：跨前后端、API/协议、数据库迁移、认证授权、部署配置、并发/事务，或改动边界无法可靠证明更窄。

风险不明时选更高一级。`phase_count > 1` 不是单独升级理由，但多个 phase 跨功能域时至少 `feature`。

## 输出合同

只输出一个 JSON 对象，不加 Markdown：

```json
{
  "routing_tier": "simple",
  "routing_rationale": "文档改动，不改变运行时行为",
  "result": "pass",
  "ts": "2026-07-14T00:00:00Z"
}
```

要求：

- `routing_tier` 只能是 `simple|feature|fullstack`。
- `routing_rationale` 必须非空，并引用实际 changed files/边界。
- `result` 正常判类为 `pass`；输入缺失、路径无法解析、输出无法满足合同为 `fail`。
- `ts` 必须是 UTC ISO-8601 时间。
- `result: fail` 时仍给出最保守可判定 tier；完全无法判定时用 `fullstack`。
