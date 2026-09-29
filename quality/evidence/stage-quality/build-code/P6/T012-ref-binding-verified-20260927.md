# T012 来源绑定复测

独立复核指出：只信被引用 JSON 自写的 `stage=build-code` 仍可错引。现行 E2E 在同一诚实性用例内核对验收文件阶段目录、事实引用阶段目录、引用 SHA-256 与事实原始字节、事实内阶段和当前 Task ID；每条 build-code 事实必须有分析器判断，且至少出现一条。原值、非通过结果及无分析器时的 `missing/deferred` 断言仍在。

`T012-ref-binding-verified-20260927.meta.json` 在运行前后现场记录测试、`stage-runner.mjs` 和 P6 材料 SHA-256、UTC 起止时间、精确命令、退出码及原始输出哈希。三份文件运行前后哈希一致。仅运行 `npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs`：exit 0，17/17 通过；同名前缀 `.stdout.txt`、`.stderr.txt`、`.exit.txt` 保存原件。此前 `T012-ref-binding-20260927.*` 虽有 17/17 输出，但没有现场写入运行时哈希，不能代替本次绑定记录。

本结果只覆盖 P6/T012 当前样例与 AC26 的局部来源/判断链。真实 P5 报告正例、P6 其它检查、三项补做样例和正式 build-code 阶段事实尚未完成。
