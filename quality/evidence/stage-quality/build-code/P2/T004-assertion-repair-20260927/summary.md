# P2/T004 有界测试断言修订：本地证据

- 认证工作树：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`；本次只改 `tests/contract/repository-inventory.test.mjs` 的原目标 `it` 断言和 `docs/architecture/complexity-baseline.json` 的 `formal_test_lines.actual` / `delta_from_target`。
- 改前测试原字节 SHA256 `fe4afe799f904027f2c6b5dea2c3df0802ee5a9f2cfac6cc975181cd21aaf9c7`，保存为 `pre-change-test.mjs`；改前 JSON SHA256 `62d4d1fc95cfeb9e8bd9a63ec8a0da8cb2d3935f1cbc55e976b117177f64f993`，保存为 `pre-change-baseline.json`；HEAD JSON 原字节另存 `head-baseline.json`。改前同一精确门 exit 0，1 passed / 8 skipped，原件见 `pre-change-gate.*`。
- 新测试加回 JSON 目标块外相对当前 HEAD 的逐字守卫，并检查块内字段、固定 target/limit、当前内存实测 actual、推导 delta/within_limit/倍数文字及副作用说明；保留原标题，使原 `-t "complexity baseline"` 命中同一目标。
- 修改测试后同一门实报目标 RED：`expected 83996 to be 84015`，1 failed / 8 skipped，exit 1；因为本测试增加 19 行，`buildReport()` 当前实测随之增加。原件见 `new-assertion-red.*`。随后仅同步 JSON 目标块 `actual=84015`、`delta_from_target=74015`。`within_limit=false` 由 84015 > 12000 推导，倍数按 `(84015/12000).toFixed(1)=7.0`，文字无需改。
- 同一精确门 GREEN：1 passed / 8 skipped，exit 0，见 `target-gate.*`；JS 语法与 JSON 语法均 exit 0，见 `js-syntax.*`、`json-syntax.*`。Vitest stderr 另有 `WebSocket server error: Port is already in use`，但本次测试进程返回 0，未作为质量通过依据。
- `negative-controls.mjs` 只在内存构造九种文本副本，不改生产文件：原样通过；块外字节、增字段、改 target/limit、旧倍数、错 within_limit、旧 delta 七种被对应判据拒绝；模拟真实行数降到 11999 且同步推导字段时通过。结果见 `negative-controls.json`。此探针验证判据行为，不冒充真实目标门的失败运行。
- 改前改后 JSON 除 `formal_test_lines` 外对象相同；`test-before-after.diff` 显示测试只在原目标断言处改变；`git diff --check` 对两文件 exit 0。
- 当前测试 SHA256 `6a27b37386882378d20f4e725dd3fee43918536d9be12a0381960844a49158ba`；当前 JSON SHA256 `f58b584cf698c49061ffbf2c5de2432cb7807b210210d733dabc5a1fd79f2c40`。

## 运行与源文件版本对照

| 运行原件 | 测试文件 SHA256 | JSON SHA256 | 证据强度 |
| --- | --- | --- | --- |
| `pre-change-gate.meta.json`，exit 0 | `fe4afe799f904027f2c6b5dea2c3df0802ee5a9f2cfac6cc975181cd21aaf9c7` | `62d4d1fc95cfeb9e8bd9a63ec8a0da8cb2d3935f1cbc55e976b117177f64f993` | 两份原字节在该命令前立即保存；meta 本身没有记录哈希。 |
| `new-assertion-red.meta.json`，exit 1 | `6a27b37386882378d20f4e725dd3fee43918536d9be12a0381960844a49158ba` | `62d4d1fc95cfeb9e8bd9a63ec8a0da8cb2d3935f1cbc55e976b117177f64f993` | 按本次先改测试、运行 RED、再改 JSON 的操作顺序及保存的改前/当前字节重建；命令运行时未单独采集源哈希或文件副本。 |
| `target-gate.meta.json`，exit 0 | `6a27b37386882378d20f4e725dd3fee43918536d9be12a0381960844a49158ba` | `f58b584cf698c49061ffbf2c5de2432cb7807b210210d733dabc5a1fd79f2c40` | 按本次 JSON 同步后的操作顺序及当前字节重建；命令运行时未单独采集源哈希或文件副本。 |

这张表是事后版本对照，不能冒充运行器当场写入的强绑定。`negative-controls.json` 来自内存副本探针，**不是 Vitest 负控运行**；实际 Vitest 原件只有上表三次目标门。

限制：本次是本地修复。当前新 spec/Phase 尚未完成正式材料确认；独立审查及同版本官方阶段事实待主会话处理，故不称 P2 完成。HEAD 对照只证明相对当前 HEAD 的非目标字节未改，不是旧历史版本的绝对签名。
