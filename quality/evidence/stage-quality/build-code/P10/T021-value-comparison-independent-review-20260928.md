# P10/T021 结构值比较材料独立复核（2026-09-28）

结论：**本次精确材料补界范围内无阻断**；这是材料可实施性复核，不是代码或 P10 通过裁决。

- 当前 `runtime/stage/stage-runner.mjs#verifyOfficialEvidence` 从 Task 原件独立 `JSON.parse` receipt，却对 `receiptValue[key] !== tests[key]` 一律用对象身份比较。`behavior_fingerprint`、`runtime_profile`、`capability_proof` 若来自另一次 JSON 解析，即使结构值相同也会误拒。`canonicalJson` 已在同文件定义，可对这三个 JSON 结构值做稳定比较。
- `spec.md` 实施段、`phases/P10.md` 和 `phases/index.md` 的 P10 行只增加这一函数及受影响集成测试的精确写面；没有改 FR/AC、阶段行、回执 schema、公开命令或三个 seed 场景的验收状态。owner 是当前 build-code 官方 stage producer；consumer 是该函数对官方 run 的 receipt/facts 核对；同等严格的统一结构认证接管时删除局部特例，边界齐备。
- 现有函数在比较前仍核 evidence ref/hash、receipt ref/hash、canonical receipt 的 Task/stage/tree/command hash/schema、在比较后仍核状态与 exit code、output 原始字节 hash。材料明确只让三个对象/数组字段按值比较，命令、时间、路径、hash、树等标量仍严格相等；没有要求删减这些 guard。
- 目标测试可执行：两次**独立** `JSON.parse` 同一结构值，旧实现应报 `facts.behavior_fingerprint are not bound` 等目标错误，新实现应通过；改变嵌套 `run_id` 或目录 hash 应继续拒。旧树负控须让 receipt 的树与受信当前树（或传入的当前 `tests.snapshot_tree`）实际不同，不能仅把 receipt 和 facts 一起改成同一旧树后调用这个局部函数；后者不是当前树判定器。应保存同目标 RED/GREEN、原始输出和异源代码复核。
- 三个 seed 场景的真实适配器、独立业务判定和逐 AC 回执来源仍未知；这次值比较修复不能把它们写成通过，也不填 `acceptance_role/data`。

只读核对：`spec.md` SHA-256 `ca14640ec1fe6b2b683bc4983b28534be114fd192e052190d938d56b85665663`；`P10.md` `cd0b89a093961acad7a3e8cf9139edaeef6691c984d11fb2e857fba3d01994c7`；`index.md` `bb517ed53cd6d4e4a7ad71d0a2004fdb4a1705cabd0391b6dfa5d034c89573a0`。未改代码、材料或 Task facts，未运行测试。
