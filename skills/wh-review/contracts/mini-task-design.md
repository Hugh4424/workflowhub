# mini-task design review

这是 mini-task 的方案审查，不是五阶段 stage，也不是实施审查。

## 方案审查重点

- 四份当前材料是否冻结了一个边界清楚、单一结果、影响面有限的小功能。
- 原始需求、事实、依赖、用户流程、状态、失败边界、AC、测试、回滚和 Git 交付是否一致。
- 是否存在重大架构、迁移、权限、安全或范围膨胀风险。

沿用 build-spec 的需求/流程/失败/AC 视角，再沿用 build-plan 的依赖/验证/回滚视角，
但只问这件小事是否仍然小、边界是否能独立交付。不要因为 mini-task 没有完整五阶段的
材料或流程痕迹就报问题；只有它会造成错误交付、越界改动或未来难以维护时才报告。

如果返回 finding，mini-task 必须逐条记录 `fixed`、`rejected_invalid`、`accepted_risk` 或
`needs_human`；普通 finding 不能省略，`accepted_risk` 必须有真实用户风险确认。

只返回 findings；不要输出 verdict、pass/fail、summary 或第二个 JSON。
