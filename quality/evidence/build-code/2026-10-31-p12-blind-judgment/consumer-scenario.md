# 消费场景（真实使用一次）

当前任务 id 是 `task-c`，它的事实文件是 `fixtures/c.jsonl`，里面已有两条事实记录：
第一条阶段是 `build-code`，最后一条阶段是 `review`。
用户需要拿到该任务当前（最后一条）阶段，并按 R-PILOT-001 核对：
最后一条记录的 `stage` 应当是 `review`。
交付 A 放在 `consumer/A/`，交付 B 放在 `consumer/B/` 仅供负控对照。
请实际调用 `stageFor(resolve('fixtures/c.jsonl'))`，记录环境、输入、实际结果、是否需要作者解释。
