# P5/T008 同次机器判断原件认证：局部实施证据

日期：2026-09-28。只改 `runtime/stage/stage-runner.mjs`、`runtime/evidence/freshness.mjs`、`tests/contract/p5-same-run-report-source.test.mjs`。本目录为局部测试证据，不是 CARD-04 正式 P5 报告，也未写当前 Task facts。

## 结果

- `test-before.mjs` 和 `before-sha256.txt` 冻结修改前测试与三份源码哈希。新增目标测试后的首次有效 `red.txt` / `red.exit`：exit 1，目标 `authenticateP5AdvisorySources is not a function`，1 failed、24 passed、6 skipped。首次调用因 worktree 的 `node_modules` 只有 `.vite`、缺 Vitest 而 exit 127，不算 RED，随后临时软链主仓已装的 Vitest `v2.1.9`，每次用 EXIT trap 恢复原目录。
- `green-target.txt` / `.exit`：1 passed、30 skipped。正例沿质量事实、验收包装、阶段质量原件核原字节哈希；隔离夹具里四种机器原词面逐一核通用状态、结果值，缺失/重复/错序/坏哈希/旧 freshness/多条 ref 等负例拒绝。无真人确认，未发布报告。
- `green-error-path.txt` / `.exit`：3 passed、31 skipped。写侧读取机器判断原件遇 `EACCES`、`EPERM`、`EIO` 均使官方 run 明确失败，未写 `report-facts.json`。
- `green-focused.txt` / `.exit`：目标合同 28 passed、6 skipped，exit 0。
- `green-adjacent.txt` / `.exit`：T007 单测 60 passed，P6 真实入口测试 18 passed。P13 最终报告合同 1 passed、2 failed；两项失败同因 `quality/evidence/stage-quality/build-code/P13/final-aggregate.json` 尚不存在。该文件属于未完成的最终交付，本轮不创建它求绿。
- `node --check` 三份修改文件通过；`git diff --check` 两份已跟踪生产文件通过。末次哈希见 `after-sha256.txt`。临时依赖链接已撤销，worktree 原 `node_modules/.vite` 保留。

## 边界

写侧在正式报告第一件文件之前认证本次 advisory 列表和唯一 `stage_end_spec_analyze` 原件；读侧在重算报告事实前重读该链。缺真实 P5 人工例外确认，正式报告路径仍关闭。当前隔离测试没有建立一份真实已发布报告后的读侧故障注入样本；读侧三类读盘故障沿现有 `authenticateP5StageEndReport` 外层分类为 `unavailable`，仍需独立审查。缺文件/内容不符的写侧预检维持返回而不发布，尚无单独持久诊断字段。P5/T008、P5 相位和整卡均不能据此宣称完成。
