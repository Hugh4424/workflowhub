# post build-plan 缺 index 修复：CLI 子进程守卫补证

- 这是前件 `post-build-plan-missing-index-20260927.md` 后的同 task 范围修复补证；该前件的 RED/GREEN 原始输出和当时测试 SHA 保留不覆盖。`phases/P3.md` 的 P3/T005 写集为 `none`，只承接 status 路线；本补证**不称 P3/T005 已完成**，亦不改其冻结 E2E。
- 认证 worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。生产 `runtime/stage/stage-context.mjs` 未再改，SHA-256 `60aee6dcfc18f66739f44e5467e6a4447f7386998fe3dc19dc10b8b97bfd47fd`；补测后 `tests/contract/post-build-plan-missing-index.test.mjs` SHA-256 `c28df1638be546c906196e5ca74b1031855d2b769fe542740d24d489b89b0373`。
- 新增三项用 `spawnSync(process.execPath, [tools/cli/stage-runtime.mjs, ...])` 在隔离临时 post task 中走实际 CLI：①缺 index 时 exit 1、stderr 首行精确为 `Error: current task material missing or unreadable: phases/index.md`，全文不含 `ENOENT`；②相同缺料条件下 `run --action=draft --name=phases/index.md` exit 0 且文件真实落盘；③补齐 index 与 P1 后 `run --action=execute` 越过材料预检，进入下一层并因该 fixture 故意不具备可执行 plan 而报 `build-plan minimum executable contract failed`。第三项**不证明完整 build-plan 可发布**，只验证新增守卫不误拒已补齐材料。
- 新三项是在生产修复后编写，且本轮仅授权修改测试/证据，所以无法通过回退生产源码取得它们自己的有效 RED；**不伪称新增测试有 RED**。前件 1/1 RED 原件已证明同一缺料行为在修前泄漏原始 ENOENT；本补测只加固 CLI/相邻路径。

| 定向命令（CWD 为上列 worktree） | 结果 | 原始输出与 SHA-256 |
| --- | --- | --- |
| `/Users/Hugh/Hugh/Project/workflowhub/node_modules/.bin/vitest run tests/contract/post-build-plan-missing-index.test.mjs` | exit 0；4 collected / 4 pass（原公共函数合同 1 + 新 CLI 合同 3） | `post-build-plan-cli-contract-first-20260927.txt`；`a83af51399f64f2fd22c0c8048fb565cdff81a121c356e4ef42c859541ee104e` |
| `/Users/Hugh/Hugh/Project/workflowhub/node_modules/.bin/vitest run tests/contract/stage-runtime-material-check.test.mjs tests/contract/post-cohort-authoring-files.test.mjs` | exit 0；7 collected / 7 pass（作者 status、消费者 status、post 材料作者范围） | `post-build-plan-cli-contract-adjacent-20260927.txt`；`2785545826dc843bad69a86bca29e0f6657face261bf2a41b2393cc951bed7e9` |

测试文件 `node --check`、生产 `git diff --check` 均 exit 0。Vitest 两次仍有 `WebSocket server error: Port is already in use`，目标收集、断言与退出未受影响；未对该环境告警作归因。未运行全量测试、浏览器、冻结 E2E、真实 CARD-04 stage，也未改 Task store。
