# P3/T005 build-code handoff

## 本相位交付与边界

T005 只验证此前写入的 `tools/cli/stage-runtime.mjs` post `status` 材料检查收窄；本相位没有新的生产写面，冻结 `tests/contract/stage-runtime-material-check.test.mjs` 未改。缺 `spec.md` 的 post 夹具中，`make-decision`、`build-plan` 的 `status` 不再过早抛错，`build-code`、`verify-code` 仍以 `current task material missing or unreadable` 明确拒绝。此为真实 `stageRuntimeMain`/临时 Task 夹具的局部 CLI 合同，不覆盖 `run`、`preflight`、页面或完整业务旅程。

## 测试与来源

精确命令均为 `npx vitest run tests/contract/stage-runtime-material-check.test.mjs`。隔离同 HEAD checkout 的 [T005-red.txt](T005-red.txt) 记录 4 收集、早期两项目标断言失败、后期两项护栏通过、exit 1；当前工作区 [T005-green.txt](T005-green.txt) 记录同一冻结测试 4/4 通过、exit 0。两份原件的测试 SHA-256 均为 `7369285cde321c82180e9b07254e1295a3360771235d1bec11c03ae2849192d5`，源码 SHA-256 分别为 `46adacd537e0eb9a8242f970b1eee4a582451a7313f5f09356745120873fd7a5` 和 `a926c3217456cfa3397252945b483f78260009cdc9b393e265b921480eab079f`；隔离 checkout 已删除。RED/GREEN 原件 SHA-256 分别为 `666856fb2df52cad96836f77b1935758bc4a5692e2fc3ad052fdc24ac35ad09d` / `fd898d8b2a0feaf857be1fb7463d03e6f7e7ae2d5fc894562bdb6cd7ac038713`。

[T005-route.json](T005-route.json) 是 `test-routing-advisor` 的实际 `feature/pass` 判类：单一 CLI 行为域，无跨端、数据库、权限或部署变化。`backend-testing` 的实际补记位于同 Task 外置 `quality/evidence/stage-quality/build-code/P3/card04-P3-L0-official-20260926.backend-testing.md`；它是在 P2/P3/P4 官方 capture **完成后**读取技能并对账，不能倒称为 capture 前执行。其 oracle、夹具、命令、退出、快照与覆盖限制均有记录，未据此扩大测试。

官方 `verify --action=execute` 的 receipt `quality/tests/card04-P3-L0-official-20260926.json` SHA-256 `21890cd3ff1d756bf6462dda6676a1625373b6978671077d4dac596418818be0`，记录同一命令、测试 exit 0、1 file / 4 passed；输出 `quality/tests/output/card04-P3-L0-official-20260926.output` SHA-256 `f6d17adfa23c6bcbfe57910c421102d91518cd035fced4e5c26bcd7300eb2ca9` 已回读匹配。捕获源码身份为 HEAD `ef920f1fbd415fe87d50930359059b661e141acd`、`snapshot_tree=c4987d3e223a2861e735547658730d2bc7a33326`、`source_digest=5ab1b43b35e059a24204b42e343d8817c4e1b39b86ef3a103bef08eacab19d73`。

## 独立 Phase review 与 finding 处置边界

P3 canonical OCR result 为 `quality/reviews/results/build-code-simple-e0d109e4-be5d-5ad1-a137-cb7d47c5696c.json`，SHA-256 `9532018068653b0950affc090b9bf40d3423f62c6380b7b86e6a0f076106e7dc`；attempt 为 `quality/reviews/attempts/e0d109e4-be5d-5ad1-a137-cb7d47c5696c/attempt.json`。其 `build-code/phase/P3`、material revision `revision-b377a58c54a3d4016d4f302785139ff206547e627b7e12f27a0b83e14faf750c` 与上述 snapshot tree 和官方 receipt 一致；两位 provider 的实际原件保留于该 attempt。**这是本次修前快照的 review 身份**；后续源码/材料若变化，不能借此声称新快照已审。Review 提供 advice，不签功能或全卡通过。

| Finding | 实际路径 | 归属与处置 |
| --- | --- | --- |
| `F-43f84486636f` | `tests/e2e/card-04-real-entry-chain-e2e.test.mjs:276` | P6/T011–T012 的 ORACLE.json 字段合同；`schema` 与 `schema_version` 可共存，所谓冲突尚未证实。交 P6 owner 核；P3 不改。 |
| `F-446100afc988` | `tests/contract/repository-inventory.test.mjs:176` | P2 预写冻结复杂度断言/未来漂移风险；交 P2/build-plan 测试 owner，P3 不改。 |
| `F-b06de78e4d06` | `runtime/stage/stage-end-report.mjs:227` | 调用者 JSON 来源认证疑点属 P5/T007–T008；交 P5 owner 用真实消费者核，P3 不改。 |
| `F-e14a80e3213d` | `tests/e2e/card-04-real-entry-chain-e2e.test.mjs:293` | P6 E2E 将 `required_materials=[]` 固定为正控的风险，邻接 status 但超出 T005 的早期不抛/后期拒绝合同；交 P6 测试/规格 owner，P3 冻结测试不改。 |
| `F-ef43871ce16b` | `runtime/stage/stage-end-report.mjs:210` | Markdown 未转义输入风险属 P5 报告呈现；交 P5 owner 定向核，P3 不改。 |

五项均未命中 T005 的 CLI status 改动或其冻结测试，没有由本轮 OCR 证据触发的 P3 源码修复；上述归属不替代各 owner 的独立复核与正式 finding disposition。

## AC 与下一边界

当前证据支持 T005 的局部 G-2 两侧 RED→GREEN 对照及 `status` 缺料守卫；`AC-18/AC-19` 在全卡层还要求真实行为样例、纯文档样例及其披露，不能由这四项 status 测试单独宣布达成。`run`/`preflight` 材料路径、真实入口联通、UI 适用性与 P4/P5 后置集成仍按各 owner 的原件另核。下一安全工作是沿 P4 Phase Card 核 acceptanceChain 的来源、证据引用与披露，保留 P3 review 对 `c4987d3e...` 修前快照的身份。
