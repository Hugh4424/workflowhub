# wh-review 简单可靠重建设计审查结论

日期：2026-07-15

审查对象：

- `2026-07-15-wh-review-simple-reliable-design.md`
- `2026-07-15-wh-review-simple-reliable-plan.md`

## 3rd-review 执行证据

第一轮 runtime：`586fe380-7b77-45c3-98c7-1fa18a3de1ba`

- Kimi：完成，session `64a4836b-1efd-4dc5-9982-8c14cae2466d`。
- OpenCode：附件 byte identity 已验证，360 秒后被 `PROCESS_STALLED` 终止，无有效意见。
- Claude Code：附件 byte identity 已验证，上游 `right.codes` 连续返回 HTTP 524，无有效意见。

第二轮 runtime：`4d731b0f-9267-4855-a483-a598a176cf8c`

- Kimi：完成，session `c4187705-d129-439c-b0d0-2f686ed6f904`。
- OpenCode：再次在 360 秒被 `PROCESS_STALLED` 终止，无有效意见。
- Claude Code：再次因上游 HTTP 524 失败，无有效意见。

两轮材料都使用 `file_only`，三家 provider 的 attachment byte identity 均为 `verified`。第二轮 provider-visible manifest hash 为 `15d74aa30340f2b1ec6574d4693379409ff2e1ec680221da11dfcb66a735098f`。

## 已吸收意见

- 明确定义 canonical manifest 的唯一序列化算法和跨平台固定 fixture。
- 公开合同改名为 `workflowhub-result.v1`，继续只调用现有 `3rd-review.mjs run`。
- 明确 continuation 仍使用公开 `runtime_id`，session 不能成为 gate。
- 固定聚合优先级为 `revise_required > unavailable > pass`。
- 两仓不再宣称“物理原子”；先发布 additive producer，再由 WorkflowHub 单提交切换。
- stage-result 删除 verdict 副本，只保留 result ref 和 snapshot tree；消费者必须读取唯一 result。
- direction 明确只接收盲审所需的完整审查对象，不能把方案文件放入 bundle 后再要求模型忽略。
- 新 review data root 必须在 source repo 外；旧 V4 状态不迁移、不参与新运行。
- 多 provider 全部结束后只聚合一次，并发完成顺序不能改变 result。
- 历史 ADR 保留原文，只标记 superseded。

## 未采纳意见

- 不给每个 stage 新增 JSON schema、`absent-materials.json` 或第二套 validator；现有 stage contract 足够。
- 不把 runtime/session/protocol transport 参数加入 `material_id`；它们不改变审查语义。精确审查指令必须进入 material_id。
- 不在多 merge-base 时任意选择一个 base；这可能漏审，宁可当前 attempt 明确 unavailable。
- 不强改 `core.autocrlf`；Git tree 已表示当前真实提交字节，修改配置反而可能改变审查对象。
- 不增加 correlation id；attempt id、runtime id 和 result ref 已能对账。
- 不为开发期旧 CLI 再造 feature flag；生产切换前它没有被生产入口调用。
- 不增加观察指标 gate、长期双协议或旧状态迁移。

## 最终判断

修订后的设计已经把 wh-review 的正确性压缩到两个身份：`material_id` 和 `snapshot_tree`；把持久数据压缩到 attempt/result；把用户操作压缩到 run/verify-final。失败只废弃当前 attempt，不会污染下一轮。这一部分足够简单、抗干扰、易维护。

尚有一个独立前置问题：当前 3rd-review 对 OpenCode 连续两次在固定 360 秒误判 `PROCESS_STALLED`。这不是 wh-review 状态机问题，但会降低 provider 可用率。实施时若要修改 health runner，必须单独限定为“修正 OpenCode 有效进展识别”，不能借机重写整个健康系统；该范围需用户确认。

Claude Code 的 HTTP 524 是外部网关失败。新设计会把它正确归为当前 attempt unavailable；它不会锁 task，也不需要在 wh-review 中增加恢复状态机。
