# 执行索引：[填写：功能名]

> 本文件是纯指针执行索引。工程正文只在 phase authority；本文件不复制任务卡、命令、
> 可执行命令、验收判据正文或执行状态。

- **decision authority**：`[填写：decision-log.md]`
- **spec authority**：`[填写：spec.md]`
- **phase authority**：`[填写：phase 工程正文路径]`

## Execution Index

| phase | authority ref | semantic anchor | write set | dependency | consumer |
| --- | --- | --- | --- | --- | --- |
| `P1` | `[填写：phase authority ref]` | `[填写：稳定语义锚点]` | `[填写：精确文件集 / N/A — reason]` | `[填写：P0 / none]` | `[填写：真实下游 consumer]` |

## 读取规则

- 要实施、测试、审查或判断完成时，先按 `authority ref` 与 `semantic anchor` 读取 phase 工程正文。
- 本索引只维护稳定指针、write set、dependency 和 consumer；任何正文变化只在 phase authority 修改。
- 缺 authority、anchor、write set、dependency 或 consumer 时标 `N/A — reason`，并返回 phase owner；不得补写第二份工程正文。

## 历史边界

pre cohort 或归档中的旧任务卡只读保留。它们不成为 post cohort writer、validator 或 completion gate。
