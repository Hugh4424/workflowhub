# ORACLE-P2-PLAIN-PATH 定向结果（G-2）

- 命令：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs -t ORACLE-P2-PLAIN-PATH`
- exit code：`0`
- 原始输出：`oracle-p2-plain-path-20260922.log`
- 目标断言：只提交 `materials: { approved_spec: "spec.md" }`，不预置 sha、identity、snapshot 或 receipt；要求 `runRound` 被调用一次，结果为 `dispatched` 且有 attempt ref。
- 结果：目标断言 GREEN；测试收集和环境正常。`recordSimpleReviewRequest` 已能在这个输入形态下计算内部 material id 并派发，故不能把此测试登记为真实 RED。
- 边界：该入口把 `"spec.md"` 当成材料的文字值传入，而不读取文件内容。仅凭此断言不能证明 provider 实际审阅了 `spec.md` 文件字节；为制造 RED 而传未定义的 `material_paths` 字段或省略必需的 `materials` 会测试无契约输入，不能作为 FR-57/AC-58 的有效基线。原 ORACLE-P2-DRIFT 未改。
