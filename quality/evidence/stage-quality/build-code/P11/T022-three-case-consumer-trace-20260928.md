# P11/T022 三条业务用例的页面消费者补查（只读，2026-09-28）

工作树：`task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。本记录补充 `T022-real-ui-consumer-audit-20260928.md`；没有运行服务、浏览器或测试，没有改产品代码、材料和任务事实。

## 逐条结论

| 业务用例 | 当前已确认的真实消费者 | 页面结论 |
| --- | --- | --- |
| `CARD04-DECISION-LOG-CENSUS` | 决策日志普查函数在 `runtime/stage/stage-runner.mjs:4235,4324` 和 `tools/cli/stage-runtime.mjs:1212,1252` 被调用；当前目录登记的是 `runtime/stage/stage-content-contracts.mjs` 与定向测试（`docs/quality/business-case-catalog.json:58-73`）。 | **未知**：已查仓内没有这条结果通向业务页面的调用链；还没有证明所有仓外消费者都不存在。 |
| `CARD04-ACCEPTANCE-MACHINE-CLASSES` | 验收值校验、事实读回和质量检查被运行时、命令行和用例对账器使用（`runtime/evidence/acceptance-evidence-validator.mjs:27`；`runtime/evidence/freshness.mjs:820-823`；`workflows/build-code/case-reconciliation.mjs:334-375`）；目录登记见 `docs/quality/business-case-catalog.json:176-195`。 | **未知**：仓内已查路径未发现业务页面，不能仅凭没有页面文件认定仓外没有页面读取其汇总结果。 |
| `CARD04-DEFERRED-ACCEPTANCE-REGRESSION` | 缺失验收仍延期的真实读回位于 `workflows/build-code/case-reconciliation.mjs:371-374`；目录列出运行时 helper 和测试（`docs/quality/business-case-catalog.json:326-346`）。 | **未知**：同上；未发现具体页面/API/服务身份。 |

## 页面与入口的核对边界

- 当前仓库 `package.json:6-33` 没有业务服务的 `dev`/`start` 入口。仓内找到的 `tools/cli/build-reflection-page-template.html` 由 `tools/cli/build-reflection-page.mjs:824-850` 嵌入任务监控数据；writer 在 `:408-453` 读取阶段反思和阶段结果，未读取这三条业务用例的逐条结果。它是静态任务监控页，不是三条用例的业务页面。
- P11 测试写明只是表示层夹具（`tests/contract/post-business-browser-reconciliation.test.mjs:4-9`）；其中 `CASE-BROWSER-001`、settings page/service 出自内存文字（`:18-38`），没有实际 URL 或服务。
- 两个相邻 `workflowhub-ui-*` 工作树分别在独立旧分支；其仓内页面文件清单也只找到任务监控模板。它们不提供当前 CARD-04 的页面消费关系，不能拿来当当前浏览器验收。
- 当前目录的 P11 项明确为 `case_id: null`、消费者状态 `unknown`，并注明没有经认证的真实页面、API、服务和浏览器结果（`docs/quality/business-case-catalog.json:517-533`）。当前浏览器适用性实现只按改动路径归类；后台路径可直接得到 `not_applicable`（`runtime/stage/stage-handlers.mjs:1027-1033,1094-1103`），并未对上述三条用例逐条追页面消费者。

结论：**三条目前均为“页面关系未知”，不能写“确无页面”或“浏览器已通过”。** 仓内可以确认的是当前没有已定位的三条用例专属业务页面；要把任一条改判为“无需浏览器”，还需用当前完整改动范围和经过认证的跨仓应用/调用清单排除页面消费者。若发现真实页面，至少需要该页面 URL、页面→API/DTO→服务的实际调用证据、可运行入口、测试数据与清理方法，才能按隔离浏览器规则执行；目前没有可提供的真实服务启动命令。
