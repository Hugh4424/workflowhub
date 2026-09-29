# P10/T021 — 固定测试回执结构值核对

- 目标：`verifyOfficialEvidence` 对两次独立 JSON 读取的同值 `behavior_fingerprint`、`runtime_profile`、`capability_proof` 不误拒；嵌套错值、错树、错原件仍拒。
- 本批唯一生产写面：`runtime/stage/stage-runner.mjs#verifyOfficialEvidence`。测试限已列 `tests/contract/build-code-case-reconciliation.test.mjs` 或 `tests/integration/vnext-official-stage-run.test.mjs`。
- 先用 P10 隔离 Task 真正运行固定受控测试，得到 canonical receipt/output/manifest/reporter；同值不同对象正例先取目标 RED。负控改嵌套 run_id、目录 hash、旧源码树（使 receipt 与 facts 树不同），不能靠同对象夹具假绿。
- 最小修复：仅三类结构字段用已有 `canonicalJson` 比值；其余标量仍严格相等。原 receipt hash、schema、output、Task/tree/固定命令认证不松。
- 仅证明此误拒修复，不补逐 AC→回执生产来源、不写消费原件、locator 或业务通过；若后续还有独立阻碍，记录并停。
