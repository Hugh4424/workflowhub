# Build-code Phase P2 Card — 3rd-review 严格判定收敛

## Goal

完成 T003–T014：只拆已有事故证据对应的 provider 结果严格判定，保留真实结构化私有路径与协议红线；BR 脏 worktree 的既有改动视为当前真实来源，不回滚制造 RED。

## Allowed files / symbols

- BR `/Users/Hugh/Hugh/Project/3rd-review`：
  - `lib/workflowhub-result-v3.mjs`：成员级聚合、正文 token、结构化字段扫描。
  - `lib/broker.mjs`：恢复门、降级错误、request provider allowlist。
  - `lib/recovery-policy.mjs`：review_mode 恢复门。
  - `test/workflowhub-result-v3.test.mjs`、`test/workflowhub-result-v3-hardening.test.mjs`、`test/output-sanitization.test.mjs`、`test/recovery-policy.test.mjs`、`test/broker.test.mjs`、`test/attachments-protocol.test.mjs`：仅相关回归断言。
- WH 当前认证 worktree：`.planning/*`、`specs/.../tasks.md` 执行事实。
- 不改 BR 原有 8 文件中与本 Phase 无关的用户脏改动；不 commit/push。

## AC / scope

- `AC-STRICT-001/002/004/007/008/009`：成员级部分成功、正文普通词不误伤、恢复不由 review_mode 阻断、结构化字段仍 fail-closed、降级保留原码 + `cause_code`、未知 allowlist extra 不阻断且全未知报告缺失。
- T003/T004 已在 BR worktree 初始状态具备成员级行为；保留事实，不用 destructive rollback 造 RED。
- health provider 集合精确匹配真实落点是 WH `validateManagedHealthProviders`，留给 P3 T023/T024；不伪造 BR health 行号。
- 非目标：取消接线、adapter 对外 PROCESS_TIMEOUT 统一、WH bounds/skip/finding 等 P3 行为。

## Test route

- 实际 route：`fullstack`（跨仓 provider protocol/broker boundary）；具体 gate 使用 `fullstack-slice-testing` 语义，但本 Phase 的可观察 slice 是 BR broker/v3 direct `node --test`，无外部服务。
- RED：T005/T009/T011 共用 v3 test 的 exit 1；T007 recovery-policy exit 1；T013 broker exit 1。T003/T004 RED `unavailable_due_to_preexisting_behavior`。
- GREEN：v3/hardening/output-sanitization 27/27；recovery-policy 5/5；broker 36/36；attachments-protocol 47/47，均 exit 0。
- phase review：只发起一次 WH public `review --action=record`；provider incompatible 则保留 `unavailable`，不重跑 unchanged review。

## Stop conditions

- 需要放宽红线、修改公共 broker API、回滚 BR 用户脏改动、或 health 路径只能靠臆造行号定位。
- 测试失败若不能区分实现失败与 fixture/environment 失败，先停并记录。

## Expected handoff

回填 T003–T014 唯一执行状态、route 选择、BR direct test 事实、health seam PENDING、一次 Phase review 与 finding disposition；完成后进入 P3。
