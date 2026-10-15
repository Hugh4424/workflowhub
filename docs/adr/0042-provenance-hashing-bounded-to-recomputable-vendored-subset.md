# 来源登记零新增字段优先，哈希只用于可复算的 vendored 子集

## Status

accepted（2026-10-14，make-decision 阶段，任务 `skills-framework-redesign-20261014`）

外部技能来源登记的处理顺序定为：**先用零新增字段把已有缺陷报出来**，再谈新增字段。
实测这一步就能报出两条真实自相矛盾——`skills/catalog.yaml:456` 与 `:470` 两条
`status: adapted` 却 `upstream: []`。新增字段只有两个，且**条件式必填**：
`adopted`（数组，"用了哪些内容"）与 `content_sha256`。
`content_sha256` **仅对字节级 vendored 项成立**（当前本仓只有 `frontend-component-quality` 一项），
且**必须由检查器复算回填，禁止手工填写**。检查追加进
`tools/cli/check-skill-consistency.mjs` 现有的 `reports` 数组，**永不进 `failures`、不动退出码**。

## Considered Options

- **给全部 `adapted` 项加内容哈希**：撞上 `docs/adr/0013`——该 ADR 因"手工同步必然遗漏、
  保留即保留缺陷"已删除 catalog 的 `local_bundle_hash`／`snapshot_sha256`，
  并明文拒绝收敛到单一来源（"修=变相保留机器"）。
- **完全不做哈希**：安全，但放弃了"我抄的那一份动了没"这个现有 pin 回答不了的问题。
- **新增独立检查工具**：会造出无真实 consumer 的新控制面。

## 三项判据

1. **难以反转**：真——它同时触及 `docs/adr/0013` 已确认的边界与来源登记的整体形状。
2. **无背景会意外**：真——读者会问"为什么别的项目都记哈希，这里只给一个项目记"，
   答案在 0013 的历史里，不在代码里。
3. **存在真实取舍**：真——在"来源可核"与"不重新引入 0013 已否决的手工哈希维护"之间
   选了后者，代价是 18 条 `adapted` 项仍然没有内容哈希。

## Consequences

- **哈希不能证明"已同步"**：它只能证明 pin 未被替换，**发现不了上游发了新版**；
  上游漂移检测因此默认不跑（涉网、假阳性高），只提供人工／可选入口。
- `skills/reuse-registry.md:91` 现存的不可核 sha256 必须处置（升级进 catalog 由检查器复算，
  或删除 hash 字样），不得维持现状。
- 补登 `backnotprop/pstack` 前必须先联网核实其实际 license。
