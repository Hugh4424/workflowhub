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

## 结果

只输出 provider protocol 要求的最小 JSON：只包含 `findings`。
findings、传输状态和 `unavailable` 都是质量事实。主 agent 必须逐条判断 finding；
stage 是否形成 `passed` 或 `incomplete` 由当前验收事实决定，不由 provider 输出结论，
也不通过重复审查制造绿色。
