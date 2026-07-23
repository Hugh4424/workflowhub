# Kimi coding 审查闭环 001

状态：受控 advisory 审查；不替代正式 build-code phase gate。

## 审查记录

| 轮次 | provider / model | 思考 | 耗时 | 包 | 结论 |
| --- | --- | --- | --- | --- | --- |
| 初审 | `kimi/coding` / `kimi-code/kimi-for-coding` | 开 | 401,484ms | 149,879B | `revise_required` |
| 访问微审查 | `kimi/coding` / `kimi-code/kimi-for-coding` | 开 | 292,418ms | 74,969B | `pass` |
| 闭环微审查 | `kimi/coding` / `kimi-code/kimi-for-coding` | 开 | 115,323ms | 30,139B | `pass` |

`codex/terra` 三轮均因与 host 同源被 `SAME_SOURCE` 跳过。Kimi 三轮均为 native auth、无 retry；CLI 未提供 usage，因此 token 为 `null`。记录仅保留 session ID、输出摘要和 hash，不公开 runtime/session 文件绝对路径。

## 初审 findings 与处理

1. 阻塞：`hunksForChange()` 在 multiline 正则中使用 `$`，使文本 diff section 只保留首行，`change-map.json` 将文本变更误标为 `binary_or_metadata`。
   - 根因：section 终止条件错误。
   - 修改：改为稳健的 diff section 解析；新增文本 diff 必须生成 `unified` hunk 与 `@@` header 的回归。

2. 材料访问：Kimi 收到的相对 `bundle/...` 路径与实际附件目录不一致，且 `ReadFile` 要求绝对路径。
   - 根因：adapter 的 provider 私有提示和 attachment workspace 布局不一致。
   - 修改：broker 创建只读 bundle 视图；Kimi 私有提示给出唯一授权绝对根、允许文件清单和首个精确读取路径。公共 v2 结果不含该路径。

3. 重复材料：build-code 的 anchor 可重复投递已经由 `changes.diff` 覆盖的变更行。
   - 根因：`writeSelectedContext()` 未区分变更文件与直接依赖。
   - 修改：变更文件 anchor 默认拒绝；例外必须写 `outside_diff_reason`，且不得与 unified hunk 相交。`changes.diff` 是变更的唯一权威，`context/` 只补 diff 外直接依赖。

Kimi 的“`total` 未使用” minor 经源码核验被拒绝：它仍作为 `total_bytes` 返回。该决策说明聚合层必须以代码证据裁决，不能机械采纳 reviewer finding。

## 最终证据

- `npx vitest run skills/wh-review/scripts/__tests__`：10 files / 115 tests 通过。
- WorkflowHub `npm test`：102 files / 941 tests 通过。
- 3rd-review `npm test`：196 / 196 通过。
- 两个 worktree 的 `git diff --check` 均通过。
- 最终 Kimi 微审查：`pass`、0 findings；首次 `ReadFile` 直接成功，公共结果无私有绝对路径。
