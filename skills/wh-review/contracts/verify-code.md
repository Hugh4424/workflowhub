# Verify Code 异源代码审查合同

这是一次 post-repair 的异源代码审查，不是材料审计、AC 覆盖审计或证据 pass 门。
本次只调用 `wh-review` 一次；provider 审查当前代码 diff、真实 consumer、相关测试和代码风险。
主 agent 已先完成一次架构代码检查和第一批修复；provider 只找真正影响交付的问题。
审查完成后主 agent 只处理这一轮 findings，再做最后检查，不重复调用 provider。

## 必需材料

- 当前代码 diff 和真实实现上下文；
- 主 agent 的 `implementation_assessment`：入口、consumer、接口、生命周期、安全和失败边界的短结论；
- `test_context`：相关测试是否走到真实入口、关键分支和失败边界；不要求测试 receipt；
- `open_risks`：未决代码风险或 `无`；
- `review-instructions.md`；
- `manifest.json`。

这些材料只保留能影响代码判断的事实。禁止发送或要求完整 evidence tree、AC coverage、
requirement replay、task completion、receipt、旧 review ledger、provider session 或本机绝对路径。
必要的实现锚点由代码 diff 和架构报告给出；没有锚点就报告代码风险，不能假设通过。

## 审查重点

- 当前实现的真实入口、consumer 和接口两端是否一致；
- 状态、生命周期、并发、取消、资源释放和成功/失败边界有没有漏；
- module/interface/seam 是否放对，是否重复造轮子或把复杂度推给调用方；
- 代码是否真的被真实 consumer 使用，失败处理是否可观察；
- 测试是否测到关键入口、外部状态和失败分支，而不是只靠 mock 或绿色命令；
- 是否有安全、权限、数据泄漏和并发问题；
- 是否有会影响交付的严重遗漏。

审查返回的每个代码 finding 都必须进入处理清单。`fixed`、`rejected_invalid`、
`accepted_risk`、`needs_human` 只表示主 agent 的代码 finding 处置结果；不要求为材料
缺口创建处置记录。

审查顺序固定为：代码入口 → 真实消费者 → 接口与状态 → 测试断言 → 实际结果 →
弱 oracle/假绿。重点攻击“看起来通过但用户仍会失败”的地方：测试没有走到关键分支、mock
绕过真实 seam、错误被吞掉、成功结果没有被真实入口消费。不要把 verify-code 变成材料考古或
第二套 receipt 审计。

## 结果

只输出 provider protocol 要求的最小 JSON：只包含 `findings`。
findings、传输状态和 `unavailable` 都是代码质量事实。主 agent 必须逐条判断 finding；
stage 是否形成 `passed` 或 `incomplete` 只由代码 review 结果和代码 finding 处置决定，不由
AC/evidence/receipt 完整度决定，也不通过重复审查制造绿色。
