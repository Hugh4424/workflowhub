# P9/P10 当前选例只读快照（2026-09-28 再采）

只运行本目录 `capture.mjs`（exit 0）：以现有 `openTask`/`openCurrentTaskWorkspace` 认证 CARD04 Task 和正确 worktree；调用 `capturePreExecutionTaskChangeScope`、`readCurrentTestAssetRegistry`、`selectAffectedCases`，并逐项重读 catalog 三项来源/规则 SHA。前后两次范围、材料、catalog、registry 相同。**没有运行目标测试、固定入口或业务效果检查，没有写 Task facts。** 完整返回对象与逐路径清单在 `raw.json`。

| 身份 | 当次值 |
| --- | --- |
| Task | `workflowhub-thin-core-card-04-20260919` |
| worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919` |
| Task 起点 commit/tree | `35a881ac3c3288249677597a9079d445949de778` / `61b56b594f5c22c71c8743ca908fad85c017574f` |
| 当前 HEAD/树 | `ef920f1fbd415fe87d50930359059b661e141acd` / `accb627d32ed3cddc335fa36f4eb1c41d164c143` |
| 材料版本/source digest | `revision-c3347ac05005768bd35cd02cff2ee89cf8201252f42cc7369e46baa1525d2739` / `b68f6759ac098d8f53164e4374c044747edb67dc9505c9b1772058ee005ae7ee` |
| catalog | revision `2026-09-28.card04-current-source-rebind.12`；SHA-256 `269e8ed894b2d0d4ed7a7f55ff8cbebe69117549419118de9932b9c3c56be343` |
| registry | SHA-256 `b5f7c79668c9fcaa91b6fa4beea96b292e878534fe5e32ca13938fcb79f0e957` |

当前真实差分 **218** 路径，三例的显式触发路径 **9**，未对应 **209**。返回 `unavailable/unmapped_changed_path`；候选仍为 `CARD04-ACCEPTANCE-MACHINE-CLASSES`、`CARD04-DEFERRED-ACCEPTANCE-REGRESSION`、`CARD04-DECISION-LOG-CENSUS`。selector 返回的来源标签是 `supplied_unverified`，目标测试状态 `not_run`；三例来源/规则 SHA 均与当前材料相符，但这不证明三例实际运行或业务效果。

三例来源绑定的实际 SHA-256：decision-log `01a9cb30dee551d30ffc929752ac137f76f14313e30de8e05837ea23ce6bbd40`，其 P6 规则 `35b15b6739106d5f4e2ac8e2e0f69b3c1b365f81ce45bf4efcfd9471b85967c3`；另两例共用 P7 来源/规则 `d8e15fd017d53ff91fcb3bd4197f424bcb0779deb156d7a7daef24de3e3bb097`。逐例声明值、实际值、匹配布尔值均在 `raw.json/source_bindings`。

| 类别 | 改动 | 已对应 | 未对应 |
| --- | ---: | ---: | ---: |
| CARD05 归档材料 | 51 | 0 | 51 |
| CARD04 当前材料 | 16 | 3 | 13 |
| runtime | 22 | 6 | 16 |
| tests | 75 | 0 | 75 |
| skills | 21 | 0 | 21 |
| workflows | 15 | 0 | 15 |
| docs | 11 | 0 | 11 |
| tools | 3 | 0 | 3 |
| core | 1 | 0 | 1 |
| 根文件 | 3 | 0 | 3 |

与旧 `T020-current-selection-readonly-20260928/raw.json` 的 217/208 比，**唯一新增的改动路径**是 `tests/contract/post-acceptance-chain-source-index.test.mjs`（SHA-256 `76e20fa6eca21ada108a6a0632fd8b6d57ac02587da053697ffdcf93eefcdf84`），属于未对应的测试文件；无路径退出旧清单。P5/T007 当前字节涉及 `runtime/stage/stage-end-report.mjs`（SHA `367c04f2f5fb6a039f250ecc7e6ad9568457f1529cc4769caebe57e6b902227a`）、同名测试（`036cdb5476e98d068f7f7fbb163113e86e1c34dc159761002b367fae40acb08d`）及 `phases/P5.md`（`d714d9e07bf0baffd77ab4333633fbd0ab266a34661710edd640794a93ac18a8`），三路径仍未对应。P10 新 `verifyOfficialEvidence` 位于 `runtime/stage/stage-runner.mjs`（当前 SHA `98b88655f70b371104f751c51aeae72a845add2e17b03f614e769806103fbb94`）：该**路径**是九个已对应路径之一，但现有三例的触发关系并不证明新 P5/P10 行为已测。上述 SHA 和清单可由本目录原始 JSON 与工作树重读，不得把路径命中理解为业务通过。

本目录 `capture.mjs` SHA-256 `eca14247602f15597e4ab03d84639b370ae954cef0ca368437259c179787d4ae`；`raw.json` SHA-256 `8dd525c608e77c13c904cce06edd947e2e5eba0c847642d7ee575f4eca34a361`；`summary.json` SHA-256 `2f28412c4ed6d56d8c2183e39b22bc642aca75c59475b520ea3307da066f73e4`。外置 Task `facts.jsonl` 前后均为 SHA-256 `c1550f6226c123bf6345d8af187ce5e557e92f097f3348cce6d25bcc952d6b82`。前一轮 217/208 属旧树 `4381e90d...`，仅供历史比较；当前整体仍不能宣称通过。
