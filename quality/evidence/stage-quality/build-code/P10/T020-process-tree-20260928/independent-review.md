# P10 进程树局部修复：独立复核（2026-09-28）

审查范围：只读核对当前 `targeted-runner.mjs`、`targeted-capture.mjs`、`capture.mjs`、两份 P10 定向测试及本目录原始 RED/GREEN。未修改实现、测试、Phase 材料或 Task facts；未跑新测试。当前五份源码/测试的 SHA-256 与 `hashes.txt` 所列 GREEN 原件逐一相同。P10 Phase 的现行精确写面（`phases/P10.md:61-63`）覆盖这三处生产文件及两份测试，其中 `capture.mjs` 限于固定命令路径；实际 diff 符合该范围。

## 审查发现

本次已测的 POSIX 同组孙进程清理，没有发现阻断问题。`workflows/build-code/targeted-capture.mjs:124-248` 在最后一个子测试返回后检查取消，之后直到写出指针均为同步代码；Node 的 `SIGTERM`/`SIGINT` 回调不会在这段 JavaScript 中途运行。因此不能把“缺少后续 `signal.aborted` 检查”直接判成可复现缺陷，也不能声称多加一次检查即可消除外层时钟与同步写入之间的竞态。若超时恰逢这段写入，外层 canonical writer 仍应把该次记为超时失败，内层原件有无残留未经本次测试证明。`summary.md` 的“中断后停止发布该次内层成功原件”应理解为已测的**子测试执行中收到信号**场景；若要覆盖同步发布边界，需另做可控时序负控和外层/内层协调设计。

## 已核实的有限结果

- 旧源码的单目标 RED `exit 1`，失败点是 `build-code-targeted-capture.test.mjs:504` 的真实监听端口仍可连接；测试 `finally` 按该孙进程 PID 清理。相同命令在新源码上 `exit 0`、1/1；两个输出分别为 `red/test-output.txt`、`green/focused-output.txt`。
- 新源码的 runner 定向测试 11/11、固定入口定向测试 24/24，原始退出码均为 0。runner 的两个新增目标分别触发 `AbortSignal` 和超过 8 MiB 输出，确认测试当时孙进程的本地监听端口关闭；固定入口目标确认 4.5 秒外层超时后该端口关闭，外层回执状态为 124。`green/` 保存相应原始输出和退出码。
- POSIX 上每个内层测试独占进程组，取消、30 秒内层超时或输出超限向该组发送 `SIGKILL`；固定入口收到 `SIGTERM`/`SIGINT` 会中断当前 runner。普通留在该进程组里的孙进程由此一并终止。直接子进程及错误路径继续返回非通过；外层超时和输出上限仍由原 canonical writer 如实记录。固定入口的源代码与回读校验仍要求本轮指纹、Task/快照、内层 argv、原始报告及哈希匹配。
- 这组测试未覆盖真实 30 秒内层超时、外层 `SIGINT`、自行创建新会话/进程组的孙进程或 Windows。Windows 分支只终止直接子进程，不能凭本次 POSIX 结果声称进程树清理完成。端口关闭是对这两个测试夹具的有效观察，不证明任意被测程序都没有残留进程或副作用。

结论：本局部修复对已测 POSIX 同组孙进程清理有效，未发现该范围的阻断问题。同步发布边界、脱组孙进程和 Windows 均未证明。P10 整体、真实业务效果与完整 build-code 尚未验收。
