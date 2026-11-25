# WorkflowHub 代码改动域规则表

定位：代码改动域规则表入口，五列五行，一行一组；不含任何规则正文。读者：四个非 UI 读点（`build-plan` 第 6 步、`build-code` 第 1 步、`make-decision` 开工上下文、`build-prd` 第 1 步）与 `AGENTS.md`「代码改动」行的读者。边界：只导航。规则正文在五个组文件；字段/协议归 `specs/api/contract.md`，模块与依赖归 `specs/backend/architecture.md`。

| 规则 | 正文锚点 | 靠什么强制 | 状态 | 什么时候读 |
| --- | --- | --- | --- | --- |
| 动代码前先定唯一写主与共享路径的前后写者 | [ownership.md#规则](ownership.md#规则) | 审查问句 | 已强制 | 派发/开工前 |
| 写失败路径前定显式暴露与默认值 owner，不静默兜底 | [defaults.md#规则](defaults.md#规则) | 审查问句 | 已强制 | 写错误处理前 |
| 改接口前写处置结论（真实 caller/是否跨模块/纯函数） | [interface.md#规则](interface.md#规则) | 审查问句 | 已强制 | 改接口前 |
| 加技能或改调用前登记真实 consumer、登记位置与删除条件 | [wiring.md#规则](wiring.md#规则) | 结构 | 已强制 | 加技能/改调用前 |
| 交活前跑受影响测试并留原始件，退出码要真实 | [records.md#规则](records.md#规则) | 结构＋检查器 | 已强制 | 报完成前 |

本表只导航；逐条规则正文见本目录五份组文件，已有原权威不复制。
