# ADR 0007 — Phase 与集成审查使用不同的最小充分材料

build-code 的单个 Phase 继续以完整冻结 diff 严格审查至 pass；最终审查改为绑定同一最终快照的集成审查，只交付连续 Phase PASS 覆盖链、自动生成的跨 Phase seam 索引（索引本身带每个 seam 的最终锚点或显式未知/不适用项），以及 AC 到改动和测试/证据的追踪。这样保留对真实代码改动的完整检查，避免把已审过的历史 diff 再次交给高成本 reviewer 重做；WorkflowHub 仍只消费 3rd-review 的公共结果，绝不读取或公开 broker 私有 state/session 文件。

## Considered Options

- 每次最终审查都投递完整 worktree diff：历史重复会淹没跨 Phase 交互，成本随 Phase 累积，并让 reviewer 重做已完成的工作。
- 只给概要或测试结果：无法核查跨 Phase seam，且会削弱最终审查。
- 采用 Phase 完整审查加最终集成审查：保留完整改动审查，同时把最终视角聚焦在尚未被单 Phase 覆盖的交互。

## Consequences

最终审查身份必须明确为 `review_scope=integration`，并且覆盖链、seam 索引、AC 追踪和材料地图都必须可证伪；材料不足或违规材料如实记录，不能伪装为通过或用字节、时间、token 上限替代判断。
