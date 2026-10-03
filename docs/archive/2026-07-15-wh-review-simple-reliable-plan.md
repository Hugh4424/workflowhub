# wh-review 简单可靠重建实施计划

日期：2026-07-15

依据：`docs/superpowers/specs/2026-07-15-wh-review-simple-reliable-design.md`

## 执行原则

- 同一个 `wh-review` 技能内替换实现，不创建第二个技能。
- 不在旧 `ReviewRoundFacade` 上继续叠加修复。
- 新旧运行路径只在开发阶段共存；生产切换必须原子完成。
- 每个 phase 完成后跑本 phase 测试；全部完成后才做真实 provider E2E 和异源审查。
- 任何扩大范围的需求先向用户确认。

## Phase 0：钉死合同和 RED 验收

目标：先把“什么算简单、什么绝不能再卡住”写成可失败测试。

改动：

- 在现有 ADR 增加 superseded 注记和新设计链接；保留原文，不新建重复 ADR。
- 定义 attempt/result schema。
- 定义五 stage 最小材料矩阵。
- 定义 3rd-review `workflowhub-result.v1` 最小字段。
- attempt 的 provider 原始输出 create-only；全部调用结束后一次写 `attempt.json`。
- result 只允许 `pass | revise_required`；`unavailable` 只进入 attempt/CLI。
- 新增长期 worktree E2E harness，但先保持 RED。

RED 必须证明当前 V4 会失败：

- provider 前失败留下 source-context 后，main merge 导致永久冲突。
- session/runtime 失效要求 reset。
- producer/consumer attestation 字段漂移导致 provider 完成后废弃。
- projection 中断要求 recover。
- review-input 自引用进入下一次 snapshot。

完成条件：

- 测试只覆盖真实用户故障，不为旧内部状态补更多 fixture。
- 设计、schema、错误列表通过 constitution checklist。

## Phase 1：3rd-review 极小公开合同

仓库：配置指向的 3rd-review checkout，使用独立 worktree 开发。

目标：WorkflowHub 不再读取 broker 私有实现。

改动：

- doctor 声明 `workflowhub-result.v1`。
- run provider result 增加稳定 `material_id`。
- 明确 `output` 是未改写的 provider 最终文本。
- additive optional 字段不影响 consumer。
- continuation 允许同 provider session 接收新的完整材料。
- runtime/session 不可用返回明确可 fresh 的错误。
- 保留现有 file_only、health、cancel、raw event stream 内部实现。

不做：

- 不让 3rd-review 理解 stage、contract 或 verdict。
- 不把 WorkflowHub schema 放入 3rd-review。
- 不删除 broker 内部为附件复制所需的 size/hash 校验。

测试：

- 同一完整材料的 material_id 公开一致。
- public result 不泄露 workspace/宿主路径。
- 新完整材料可以续原 session。
- runtime 失效返回可 fresh 错误。
- doctor protocol mismatch 在 provider 前失败。
- Kimi/OpenCode/Claude adapter 共享同一公开结果形状。
- 现有 `run --request/--attachments/--attachments-root/--attachment-delivery` 是唯一调用入口；不增加新的 bundle/session CLI。

完成条件：3rd-review 全测通过，公开合同 fixture 可供 WorkflowHub 真实消费。

## Phase 2：Git snapshot 和材料模块

目标：用一个独立、可复现的材料构造路径替换 trusted base/source context。

新增内部模块：

- `review-source.mjs`：target/base/capture/snapshot/diff。
- `review-materials.mjs`：stage 材料、changed files、bundle、material_id。

改动：

- target 来自登记的 target repo 当前分支。
- 每次动态 merge-base，不写 task base。
- 两次 temporary-index capture 保证稳定。
- `build-code` phase 从当前 `phase-diff-scan.v1` 解析 baseline/implementation tree，只审完整 phase tree diff；最终 worktree review 仍使用动态 merge-base。
- 所有文件从 snapshot tree 读取。
- 所有运行产物放 source repo 外。
- 启动时配置 repo 外 `review_data_root`；不复制、不解释旧 V4 状态，旧文件只保留历史。
- 生成完整 changed files/current contents/requirements/evidence/skills bundle。

测试：

- staged、unstaged、untracked。
- add/delete/rename/mode/symlink。
- main merge 后 base 前移。
- 同一 worktree 已有累计历史时，phase review 只包含当前 phase；phase implementation 更新后旧 result 自然失效。
- target main 继续前进但 source 未 merge。
- source 捕获期间变化。
- ignored 文件。
- binary、gitlink、sparse、shallow、多 merge-base。
- 连跑十次 packet 不自增长。
- canonical material_id 固定样例。

完成条件：不读取或写入 source-context，不使用路径黑名单，不需要 commit。

## Phase 3：简单 runner、解析和结果

目标：实现新核心路径 `snapshot → materials → provider → result`。

新增内部模块：

- `review-runner.mjs`：单次编排。
- `review-provider-client.mjs`：只消费 3rd-review public result。
- `review-output.mjs`：最小 JSON 提取与 schema。
- `review-result.mjs`：attempt/result 原子写入与聚合。

CLI：

- `run` 调新 runner。
- `verify-final` 调新 snapshot 比较。
- 开发阶段旧 CLI 仍在，但生产尚未切换。

测试：

- transport completed/failed/cancelled。
- material_id match/mismatch。
- pure JSON、唯一 fenced JSON、多个/零候选。
- 一次同 session 格式修正。
- session 续跑成功、session 失效 fresh full review。
- 每 provider 尝试预算。
- 多 provider 固定聚合。
- 同一 attempt 的 provider 全部结束后只聚合一次，再原子写一个 result；并发完成顺序不影响结果。
- crash 只留 attempt。
- result create-exclusive、无半写 pass。
- verify-final 完整 tree match/drift。

完成条件：新 runner 不读取旧 flow、receipt、source context、projection 或 broker private state。

## Phase 4：五 stage 和消费者接线

目标：同一个提交更新所有生产消费者，避免半新半旧。

改动范围：

- 五个 stage 技能/工作流调用。
- wh-review SKILL 和五份 stage contract。
- 保留现有七字段 stage-result 合同及各 stage 业务 facts；只把 `facts.review` 改为
  `{result_ref, snapshot_tree}`，不新建第二套 validator。
- phase-gate、CI chain、facts assembly、commit/merge guard。
- make-decision direction/detail 调用和轻量聚合。
- build-code/verify-code 的 result ref 与 verify-final。
- 用反向引用扫描列出所有仍读取 core receipt、projection、flow、source-context 的生产消费者，清单归零后才能切换；不凭猜测新增 dashboard 或通知系统。

新 stage review fact：

```json
{
  "result_ref": "reviews/results/...json",
  "snapshot_tree": "..."
}
```

规则：

- stage-result 只引用正式 result。
- 任何 gate 都必须读取 result_ref 指向的 result，并核对 result.snapshot_tree 与当前推进对象；不得信任缓存 verdict。
- unavailable 不能写成 pass。
- 人工风险接受写 execution record，不修改 review result。
- direction/detail 保留两个独立结果，stage 只做固定三态聚合。
- commit/merge 必须先 `verify-final`；其他 stage gate 必须核对 result 的 snapshot 正是当前推进对象。

完成条件：所有 stage 消费者只认识新 result，不读取 core receipt/projection/flow。

## Phase 5：真实 E2E 和故障注入

目标：证明长期 worktree 不再需要修闸。

真实场景：

- WorkflowHub audit worktree。
- PaperBuilder worktree。
- 五个 stage 最小样例。
- OpenCode、Kimi、Claude Code。

必须覆盖：

- provider 连续失败十次，第十一次成功。
- logout/auth failure 后重新登录直接成功。
- runtime/session 失效自动 fresh。
- R1 pass/revise，修复后 R2 优先续 session。
- main merge 后只审 feature diff。
- dirty tree 全范围捕获。
- 427KB+ 和 512KB+ file_only。
- provider 说明文字 + JSON。
- broker protocol mismatch 修复后直接重跑。
- 捕获期间代码变化。
- 审查后 tree 漂移。
- make-decision direction/detail 一方失败。

证据：

- material_id。
- snapshot_tree。
- provider/session/transport。
- 首、中、尾 marker。
- raw provider output。
- result 和 verify-final。

完成条件：真实用户路径不执行 reset/recover/migration，不读取 broker private state。

## Phase 6：协调切换

目标：先发布向后兼容的 producer，再用 WorkflowHub 的一个原子提交切断旧控制状态。两个仓库不假装能物理原子提交。

3rd-review 先发布 additive `workflowhub-result.v1`，旧 consumer 不受影响。随后 WorkflowHub 在同一个提交内：

- CLI production `run/verify-final` 指向新 runner。
- 删除 production `reset/recover` 路由。
- 停止读取和写入 source-context、flow、reset approval、core receipt、projection guard/journal。
- 切换五 stage 和所有消费者。
- 旧文件保持原地，只作为历史。
- active task 下一次推进时重新审查当前 snapshot。
- 新 runner 的 `review_data_root` 必须在 source repo 外；旧 repo 内审查文件不迁移、不参与新运行。

禁止：

- 先停写、继续读旧状态。
- 把新 result 伪装成旧 core receipt。
- 新旧路径长期双跑。
- 为旧失败状态写 migration。

回滚：

- 切换前记录两仓 commit/tag。
- 失败时只 revert WorkflowHub 切换提交；3rd-review 的 additive 协议可以保留，不影响旧 consumer。
- 新 attempts/results 可以留存，旧 V4 不读取。
- 不给旧 V4 新增 migration 补丁。

完成条件：fresh 全测、真实 E2E、constitution checklist 和异源审查全部通过。

## Phase 7：删除旧实现

目标：真正降低维护成本，而不是留下双倍代码。

删除：

- `ReviewRoundFacade` 旧运行实现。
- old BrokerClient private state/workspace audit。
- reset/recover/flow/source-context/projection/finding lifecycle。
- 旧 schemas、fixtures 和只验证旧状态机的测试。
- 不再被 production 引用的旧实现说明；历史 ADR 原文保留并标记 superseded。

保留：

- 历史任务文件。
- 必需 stage contract 内容。
- provider 隔离、材料完整、raw、transport/semantic、verify-final 测试。

规模目标：

- 核心编排 ≤ 500 行。
- wh-review production ≤ 2,500 行。
- 持久概念两类。
- CLI 两个命令。
- 无 reset/recover/migration 用户操作。

完成条件：删除后全测和真实 smoke 继续通过；`rg` 确认 production 不再引用旧控制状态。

## 最终发布顺序

1. 3rd-review `workflowhub-result.v1` 实现、测试、提交，保持旧 consumer 可用。
2. WorkflowHub Phase 0–5 实现和验证。
3. 两仓真实跨仓 E2E。
4. WorkflowHub 单提交切换到已发布的新公开结果。
5. 观察一轮真实 stage 使用。
6. 删除旧死代码。
7. 两仓合并 main。

任何 phase 出现范围扩张，停止并用大白话说明新增内容、推荐方案和风险，等用户确认后再继续。
