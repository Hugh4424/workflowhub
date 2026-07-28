# Progress

1. 基线：`main`=`f98b8428494cb077ac920a4a140b7cf5a447d09d`，隔离分支同起点，白名单无差异。
2. 顺序：retention map → 三套模板/SKILL → focused 断言与红绿 → 审查 → 验收提交。
3. 最大风险：保留 ID、字段、排序和 `spec-content.v3`/`plan-task.v3` 核心合同，同时消除职责重复。
4. 基线 lint：6 文件、54 个 `MD060`，集中 plan/tasks 模板。
5. 基线 focused tests 与 skill closure 因缺少本地 `vitest`/`js-yaml` 未启动；见 BLOCKED.md。
6. 任务 1 完成：retention map 先补职责断言；三份模板去除注释、占位符和 raw JSON，并保留 `spec-content.v3`、`plan-task.v3` 既有字段。
7. 三份 SKILL 明确 spec 是产品真相、plan 是工程证据与取舍、tasks 是紧凑执行投影；Markdown lint 已为 0 issues。
8. 任务 2 测试完成：focused retention 12/12、skip 0；删除 spec 的 `失败条件` 字段时 1 个专属断言失败，恢复后 GREEN。
9. 三个受影响 bundle manifest/hash 和 catalog hash 已更新；发现并同步既有 `wh-review` catalog hash，未改其内容、路由或审查引擎。
10. 审查预检完成：没有合法 TaskHandle 或 stage-bound canonical materials，未调用 `wh-review`，不伪造任务或材料；见 BLOCKED.md。
