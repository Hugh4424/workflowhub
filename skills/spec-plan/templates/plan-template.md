# 实现计划：[填写：功能名]

- **Input**：`[填写：decision-log.md ref]`、`[填写：spec.md ref]`
- **Template version**：`plan-task.v3`

## 1. 实现方案

- **目标**：[填写：实现完成后的可观察结果]
- **之前**：[填写：当前行为或缺口]
- **之后**：[填写：目标行为]
- **方案**：[填写：最小实现及关键数据流]
- **不做**：[填写：明确排除项及来源 ID]

## 2. 边界

### NEW

- `[填写：精确文件路径 / N/A — 不新增文件]`

### MODIFY

- `[填写：精确文件路径]`

### DO NOT TOUCH

- `[填写：精确文件路径]`

- **接口边界**：[填写：会改变的接口、签名或数据流 / N/A — 理由]
- **兼容边界**：[填写：必须保持的行为 / N/A — 理由]

## 3. 依赖

- `[填写：producer task]` → `[填写：consumer task]`：[填写：必须串行的原因]
- **外部依赖**：[填写：已核实依赖 / N/A — 理由]
- **可并行项**：[填写：输入、依赖和文件互不重叠的任务 / N/A — 理由]

## 4. 测试计划

build-plan 只设计 RED/GREEN，不执行命令。RED 与 GREEN 使用同一 `gate_cmd` 和 oracle identity。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| [填写：FR/AC] | [填写：T-ID] | RED | `[填写：可执行命令]` / `[填写：非零]` | `[填写：ORACLE-ID、目标失败信号、task-relative 路径]` |
| [填写：FR/AC] | [填写：T-ID] | GREEN | `[填写：同一命令]` / `0` | `[填写：同一 ORACLE-ID、成功与负例信号、task-relative 路径]` |

## 5. 风险

- **风险**：[填写：触发条件和可观察后果]
- **预防或停止条件**：[填写：最小措施]
- **Affected IDs**：[填写：source/FR/AC/T-ID]

## 6. 回滚

- [填写：边界内最小、可逆的回滚动作]
- [填写：回滚后的验证命令和 oracle]

## 7. 任务映射

| Source / decision | FR | AC | Task | Depends on | Exact files | Gate / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| [填写：R*/D*] | [填写：FR ID] | [填写：AC ID] | [填写：T-ID] | [填写：T-ID / none] | `[填写：精确路径]` | `[填写：gate_cmd / ORACLE-ID]` |

发布前确认：每个 source、FR、AC、Task 都能正向和反向定位；每个 Task 的依赖存在且无环；每个文件都在边界内。
