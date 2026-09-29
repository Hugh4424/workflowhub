# P10 定向执行进程树修复证据（2026-09-28）

- 工作区：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`
- 分支：`task/workflowhub/workflowhub-thin-core-card-04-20260919`
- 基准 HEAD：`ef920f1fbd415fe87d50930359059b661e141acd`
- 范围：固定入口外层超时、独立 runner 取消与输出上限。只改 P10 已列代码和定向测试；未改材料、runtime 或其它流程。

## 复现与修复

测试创建真实 Node 孙进程，令其忽略 `SIGTERM` 并监听随机本地端口。旧实现的外层超时只向同组进程发 `SIGTERM`，孙进程仍占端口。定向 RED 命令：

```
npx vitest run tests/contract/build-code-targeted-capture.test.mjs -t 'releases a TERM-resistant grandchild'
```

`red/test-output.txt` 与 `red/exit.txt`：exit 1，断言实测端口仍开放；测试的 `finally` 随后按本次孙进程 PID 清理。旧源码及测试字节在 `red/`；各原件 SHA 见 `hashes.txt`。

修复后，每个内层测试使用自己的进程组。固定入口收到外层 `TERM/INT` 时中断正在执行的 runner；runner 对该测试进程组发 `SIGKILL`。固定入口在中断后停止发布该次内层成功原件。外层仍由原 canonical capture 记录超时失败。

## 定向结果

- `npx vitest run tests/contract/build-code-targeted-runner.test.mjs`：exit 0，11/11；含真实孙进程的取消、输出上限两项，均检查监听端口释放。
- `npx vitest run tests/contract/build-code-targeted-capture.test.mjs`：exit 0，24/24；含外层超时后孙进程端口释放及已有正常、失败、身份绑定案例。
- 与 RED 完全相同的 `-t 'releases a TERM-resistant grandchild'` 命令在最终源码上 exit 0、1/1；原件为 `green/focused-output.txt`。
- `node --check` 三个受影响生产文件：各 exit 0。
- 原始 GREEN 输出和退出码在 `green/`。本次结果只覆盖上述执行路径；不是整个 P10、CARD-04 或 build-code 完成结论。

宪法检查：未加 public 命令、持久状态或质量 gate（F1/F2/F5/F8/F11）；失败仍由原 capture 记录，未改成通过（F3/F9/Q1/Q2）；独立质量审查仍需由异源审查者给出（F4/Q3）。其余条款所管的材料、授权和技能结构未改。
