# 原子台账限定范围成本核对

> build-plan 支撑事实，不是第五份权威材料。权威需求与验收仍在 `spec.md`。

## 实测范围

- 正式产品需求：14 条（FR-33～FR-46）。
- 正式验收判据：14 条（AC-33～AC-46）。
- 原子追踪面：28 个正式单元；`plan.md` 用 9 行聚合映射覆盖 14/14 FR 与 14/14 AC。
- 原始决定索引：R-001～R-029，共 29 条；只做 source→decision 索引，不复制正文。
- CARD-02 交还来源：79 条逐项对齐落在 `research/card02-79-alignment.md`，不进入正式原子台账正文。
- 当前材料体量（核对时）：`decision-log.md` 1614 行、`spec.md` 413 行、`plan.md` 418 行、`tasks.md` 25 行。

## 结论

采用 D-021 的限定范围：只给会成为正式 FR/AC 的 28 个单元建立原子追踪；不把 79 条来源、模块台账或全部历史文本扩成约 594 条的新需求账本。执行索引保持 3 个 phase 指针，不复制 task/oracle/status 正文。

## 成本与删除条件

- 当前维护动作：更新 spec 的 FR/AC 与 plan 的一张 traceability 表；无新 schema、store、public command、runtime writer 或 gate。
- 若后续发现任一 FR/AC 无 owner/oracle，追加对应映射；不扩大全量原子账本。
- 若这份支撑文件没有下游 consumer，build-plan 收口后可删除；其结论已由 `plan.md` 的 traceability 和风险处置消费。

## 非穷尽边界

28 个单元只代表当前已接受的正式需求与验收，不代表产品问题空间穷尽；79 条对齐也只代表当前已知 CARD-02 来源。
