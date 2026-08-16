# Verify Code 审查合同

这是一次 post-repair 的异源架构验收，不是第二套证据审计，也不是 pass 门。
本次只调用 `wh-review` 一次；provider 只能审查冻结材料。
主 agent 已先完成一次架构检查和第一批修复；本合同只让 provider 独立看当前验收摘要，
指出真正影响交付的问题。审查完成后主 agent 只处理这一轮 findings，再做最后检查，
不重复调用 provider。

## 必需材料

- 验收标准；
- 主 agent 的 `architect_assessment`：需求、用户流程、架构、实现和 AC 的短结论；
- `final_test_summary`：当前测试命令、结果、快照和覆盖限制；
- `open_risks`：未决风险、延期项或 `无`；
- `review-instructions.md`；
- `manifest.json`。

这些材料只保留能影响判断的事实。默认不发送完整日志、完整 evidence tree、历史
requirement replay、旧 review ledger、provider session 或本机绝对路径。必要的实现
锚点由架构报告给出；没有锚点就标 `unknown`，不推断通过。

## 审查重点

- 原始需求、四份材料和实现是否一致；
- 用户流程、状态和成功/失败边界有没有漏；
- module/interface/seam 是否放对，是否重复造轮子或把复杂度推给调用方；
- 代码是否真的使用了设计中的消费者和失败处理；
- AC、测试和风险结论是否互相矛盾；
- 是否有会影响交付的严重遗漏。

对每条 AC 只有在同时看到真实场景、判定规则、实际结果、一个实现锚点和一个独立的测试/断言锚点时，才可以把它当作 `pass`；缺任何一项都只能是 `unknown/incomplete`。不同 AC 共用同一个实现锚点、测试锚点或嵌套证据时，也不能把它们算成独立证明。

审查返回的每个 canonical/reportable finding 都必须进入处理清单，普通 finding 也不能被
过滤掉。`fixed`、`rejected_invalid`、`accepted_risk`、`needs_human` 只表示主 agent 的
处理结果；`accepted_risk` 必须有绑定当前 finding/review/snapshot 的真实用户确认，不能
靠 provider 的 verdict 或空 findings 代替。

审查顺序固定为：交付声明 → 每条 AC → 实现和真实消费者 → 测试断言 → 实际结果 → 弱
oracle/假绿。重点攻击“看起来通过但用户仍会失败”的地方：测试没有走到关键分支、mock
绕过真实 seam、错误被吞掉、成功结果没有被真实入口消费、延期项被误写成完成。不要把
verify-code 变成材料考古或第二套 receipt 审计。

## 结果

只输出 provider protocol 要求的最小 JSON：只包含 `findings`。
findings、传输状态和 `unavailable` 都是质量事实。主 agent 必须逐条判断 finding；
stage 是否形成 `passed` 或 `incomplete` 由当前验收事实决定，不由 provider 输出结论，
也不通过重复审查制造绿色。
