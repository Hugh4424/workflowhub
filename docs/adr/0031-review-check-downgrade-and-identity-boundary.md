# ADR-0031：审查管线中「非身份类严格判定」的降级边界

## 状态

已确认（2026-09-19，任务 `workflowhub-deferred-closeout-20260919` 的 make-decision 阶段）。
决定来源：用户 talk-round-1 / talk-round-2 / talk-round-3 逐条裁定，以及 step 6 方向审查当场复现后的增量裁定。

## 决定

审查管线中不承载身份、顺序、hash 或必需产物绑定的检查，一律降级为质量事实（partial / warn / 记录），
不再阻断；身份类检查（含跨仓 `material_id`）不改变 fail-loud 强度，只统一其算法。

## 背景

实测触发计数（扫描全部 49 个任务库的 `quality/reviews/attempts/*/attempt.json`；只有 `attempt.json`
是真实触发记录，把 `quality/evidence/interactions/*.json` 等聚合文件计入会系统性放大所有数字）：
`MATERIAL_INCOMPLETE` 153、`PROTOCOL_INCOMPATIBLE` 80、`PROVIDER_OUTPUT_INVALID` 75、
`PUBLIC_RESULT_INVALID` 52、`OUTPUT_INVALID` 42、`MATERIAL_FORBIDDEN` 38、
`EVIDENCE_ANCHOR_INVALID` 20、`MATERIAL_TOO_LARGE` 7、`REVIEW_WAIT_EXCEEDED` 3。

- **单次最贵事件**：收口窗口 `11:29:22→12:36:48` = **67.4 分钟**（主会话纯空等 62.7 分钟），
  一条完全相同的用户回复被要求确认 **4 次**。
- **真实浪费 = 146.7 provider-分钟**。常被引用的「493 provider-分钟」是全部 attempt 的总耗时
  （含成功），不是浪费。
- **当场复现**：`material_id` 跨仓不一致导致 `review --action=record` 返回
  `PROTOCOL_INCOMPATIBLE`、`dispatch_state=blocked_before_dispatch`、`result_ref=null`，
  红蓝两路零 finding，审查完全无法运行。
- **既有语义要求本已支持本方向，是当前代码违反它**：`CONTEXT.md:282-283` 要求「外部系统返回的
  原始错误码必须原样保留；分类只用于汇总，不能覆盖原始事实」；`CONTEXT.md:285-286` 要求模型调用
  失败与 finding 证据无效是两层事实。把 finding 级缺陷升级为整轮失败违反后者。
- **宪法约束**：`CONSTITUTION.md:28` 要求结构错误必须 fail-loud；身份、顺序、hash、必需产物错绑
  属于「只能确定判断」的一类，因此身份类检查不得放宽
  （另见 `docs/adr/0010-serious-review-disposition.md:11`、
  `docs/adr/0007-phase-and-integration-review-material-architecture.md:4-7`）。

## 逐条决定（2026-09-19 用户已裁定，不在本 ADR 重新讨论）

1. **跨仓 `material_id`**：把 WorkflowHub 侧对齐到 3rd-review 公开 v3 算法并冻结该算法。
   `runtime/review/review-packet-identity.mjs:121-157` 的语义材料哈希需排除非语义条目
   （`canonical-evidence.json`、`authenticated-evidence.json`、`review-instructions.md`），
   与 `3rd-review/lib/attachments.mjs:18-26` 的 `canonicalWorkflowHubMaterialId` 一致。
   **不得**通过取消比较来实现。权威依据：
   `docs/research/workflowhub-wh-review-material-identity-incident-20260825.md:10-11,28`。
   范围是 **3 个互不相同的哈希实现 + 4 个独立相等点**（`skills/wh-review/scripts/review-provider-client.mjs:687`、
   `skills/wh-review/scripts/simple-review-runner.mjs:680`、`:1397`、
   `runtime/review/review-record-route.mjs:146`），不是一处。
2. **整组私有路径扫描**（`3rd-review/lib/workflowhub-result-v3.mjs:200`）改为仅成员级，组记为 `partial`。
3. **回退未提交的 `secret|data` token**（`3rd-review/lib/workflowhub-result-v3.mjs:32`）。
4. **删除死代码 `PHASE_DIFF_MAX_DELIVERY_BYTES`**（`skills/wh-review/scripts/review-materials.mjs:57`）；
   实际生效的是 `REVIEW_PACKET_MAX_DELIVERY_BYTES`（`:2218`）。
5. **移除 `review_mode` 重发门**（`3rd-review/lib/broker.mjs:1243,1282,1387`；
   `lib/recovery-policy.mjs:14,26`）。
6. **`EVIDENCE_ANCHOR_INVALID` 不再把整轮判失败**：丢掉那条 finding 并记显式事实，
   不影响其它 finding 与成员。
7. **私有路径只扫结构化字段**，不扫成员正文。
8. **身份降级时保留原始 provider 错误码 + `cause_code`**，不再覆写成 `PUBLIC_RESULT_INVALID`。
9. **材料未知键改为丢弃 + 记一条显式事实**（不静默、不中止）；真正的 `rule.forbidden` 键与固定
   指令模板不符仍然失败。
10. **（已由合并修复，本任务不做）** 空 `catch{}` 已在合并中移除：`skills/wh-review/scripts/simple-review-runner.mjs`
    的 pre-merge `:1315-1316` 空 catch 已被 `catch (error)` + `parse_error: redactHostPaths(parseError)` 取代
    （处置清单第 9 条原记 `:1315-1316`）。合并提交 `d8c74fdc`（经 `e74d9a72` 合入）；
    同一提交在 `runtime/review/review-output.mjs:9-12,14-19` 新增 `safeParseError`/`parse_error`；
    测试锁定于 `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs:1666`。
11. **`PROTOCOL_INCOMPATIBLE` 区分两种情形**：「信封里多了未知 provider」与「少了已配置 provider」；
    只容忍前者，不容忍额外的 provider 结果。
12. **材料 revision / snapshot 确认读侧对称**：复用 `isExecutionRecordOnlyMaterialDelta` /
    `isStageMaterialOnlySnapshotDelta` 的既有语义
    （`runtime/stage/stage-runner.mjs:1681`；`git-worktree-snapshot.mjs:503-526`）。
13. **错误码注册表保持开放**：未知码原样透传并标 `unknown`，不新增严格判定。
14. **20 分钟墙钟等待维持不变**；只登记「源码注释与归档记录不一致」这一事实。
15. **`cancelManaged` 接通**：把 6 处「绝不取消」守卫
    （`tests/review/review-managed-lifecycle.test.mjs:378,433,478,507,540,584`；真正的墙钟守卫在
    `:526-558`）改为「仅在源漂移事实下调用」，并**新增**一条禁止因墙钟计时而调用的断言。
16. **不新增任何严格判定、不新增验收机制或采集面。**

## 本次不改宽松度的边界（防止被读成「全面放宽」）

- **身份、顺序、hash、必需产物绑定类检查不改宽松度。** 本 ADR 只统一身份算法，不降低身份判定的
  强度；第 1 条的 4 个相等点仍然比较，只是两侧算法对齐。
- **放宽后的每一处都必须留下显式事实**（partial / warn / dropped 记录），不得静默通过；
  `CONTEXT.md:383-384` 要求缺失事实保持 `unknown`/`unavailable`/`incomplete`。
- **零事故证据的检查本次保留不动**：红线 ③ quorum（`minimum_heterologous`）、⑥ 信封/组/成员必需键、
  ⑦ 非 minor finding 的必需证据字段（`runtime/review/review-output.mjs:18-21,29-34`）。
  注意 ⑦ 是必填字段检查，与第 6 条已裁 REMOVE 的 `EVIDENCE_ANCHOR_INVALID` 锚点有效性检查不是同一条。
- 跨仓 `3rd-review` 的 commit/push 授权属 OI-22 / step 11，不由本 ADR 授予。

## 被否决的替代方案

- **取消 `material_id` 比较**：违反 `CONSTITUTION.md:28`，等于让身份不可确定。
- **让 3rd-review 反向消费 WorkflowHub 的摘要**：改动公开 wire 契约，改动面更大。
- **新增 `material_digest` 字段**：等于改 wire 契约 + 新增字段，属本次明确非目标。
- **缩短或删除 20 分钟墙钟等待**：与 D-030③ 冲突，缺 ADR 承担。
- **收紧错误码注册表**：属新增加严，与本决定直接冲突。

## 影响与边界

- 本 ADR 只记录已裁定的降级方向与身份边界；不新增 stage、public command、schema、持久对象、
  gate、双写或采集面，不改变五阶段拓扑。
- 「零触发红线保留」是本次决定的一部分，不是遗漏；后续若有人按「统一降级」的口径继续拆 ③⑥⑦，
  必须先推翻本 ADR 的边界条目。
- 每一项改动的验收只由**既有针对性测试**证明，不做前后计数、不新增验收账本。
