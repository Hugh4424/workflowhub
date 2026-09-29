# P11/T022 当前页面消费者只读核查（2026-09-28）

## 结论

工作树中存在一个真实的静态任务监控页面，但目前没有证据证明它消费本卡已登记的三项业务功能；也没有找到这三项功能的真实业务页面、HTTP 服务、API/DTO 路由或可复现业务 URL。因此 P11 的页面适用性仍为 `unknown`，不能写 `N/A` 或通过；T022 仍未完成。本次没有启动服务或浏览器，没有运行测试，也没有修改产品代码、计划材料或 Task facts。

## 已核对的范围和实际调用关系

- 身份：工作树 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`，分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，本次读到 HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。工作树有未提交改动，不能把 HEAD 当作当前源码快照。
- 要求：`specs/workflowhub-thin-core-card-04-20260919/spec.md:306-307,566-568` 要求后台变化在有页面消费者时执行真实服务浏览器检查，缺消费者关系或服务时记 `unknown/unavailable`；`phases/P11.md` 明记真实页面、服务/API/DTO 与浏览器实跑仍未知。P1 `docs/architecture/real-entry-inventory.md` 只登记 CLI/检查入口，明确入口存在不等于业务验收。
- 仓库入口：`package.json:6-25` 只有检查、探针和测试脚本，没有 `start`、`dev` 或业务服务启动脚本。限域查 `runtime/interface`、`runtime/stage`、`runtime/evidence`、`tools/cli/stage-runtime.mjs`、`workflows/build-code` 的 `.mjs`，没有 `createServer`、`.listen(`、`fetch(`、常见 HTTP URL、Express/Fastify 路由命中。按 `.html/.jsx/.tsx/.vue/.svelte` 及常见页面目录查仓库文件，唯一页面文件为 `tools/cli/build-reflection-page-template.html`；没有找到本卡三项功能的页面组件或服务路由。这是已查范围内的观察，不排除仓库外消费者。
- 三条已登记业务用例在 `docs/quality/business-case-catalog.json`：`CARD04-DECISION-LOG-CENSUS` 的实际接口是 `deriveDecisionLogOriginalSourceCensus`，消费者是 `runtime/stage/stage-content-contracts.mjs` 和定向测试；`CARD04-ACCEPTANCE-MACHINE-CLASSES`、`CARD04-DEFERRED-ACCEPTANCE-REGRESSION` 的实际接口/消费者在 `runtime/evidence/acceptance-evidence-validator.mjs`、`freshness.mjs`、`quality-store.mjs`、`runtime/stage/stage-runner.mjs`、`stage-handlers.mjs` 与定向测试。限域反查这些符号在 `runtime`、`tools/cli`、`workflows` 的引用，找到 CLI、阶段执行、证据读取与用例对账，未找到页面或 HTTP/DTO 调用者。目录自身把 P11/T022 的 `case_id` 留空、消费者与业务规则记 `unknown`；目录不等于完整消费者清单。
- 静态监控页的生产者为 `tools/cli/build-reflection-page.mjs:408-455,627-710,830-849`：读取 Task 的 `quality/stage-reflection`、课程和演进数据，生成内嵌数据的 `workflowhub-monitor.html` 及 `data.js`。页面模板 `tools/cli/build-reflection-page-template.html:236-238,422` 从内嵌 `globalThis.__WH_MONITOR_DATA__` 渲染，没有网络 API/DTO 调用。仓库中的可复现本地地址只出现在历史浏览器**夹具** `tests/fixtures/workflow-evolution/run-browser-qa.sh:39-61`：临时 `python3 -m http.server` 提供该静态文件；它不是真实 CARD-04 三项业务的运行服务或验收 URL。监控页未来可能受 Task 反思内容的间接变化影响，当前未建立这三项功能→监控页字段的版本化关系，不能据此断定页面无关。
- `tests/contract/post-business-browser-reconciliation.test.mjs` 的 `CASE-BROWSER-001`/settings page 是内存测试夹具，不是找到的真实页面。`runtime/stage/stage-handlers.mjs:1027-1103` 当前用改动文件名推断 UI/backend，并可对 backend/non_ui 直接给 `not_applicable`；这个分支没有核对业务用例→页面消费者关系，后台被页面使用时可能漏检。

## 仍缺的证据

1. 当前可信任务起点到最新源码快照的完整变化与每个变化的业务消费者映射。`quality/evidence/stage-quality/build-code/P10/T020-current-selection-readonly-20260928-rerun/summary.md` 对当时树 `accb627d...` 实测 218 条改动路径，9 条有目录触发关系，209 条未映射，选择结果 `unavailable`、测试未跑；随后工作树还会变化，不能把这份快照当作永久最新范围，也不能从未映射路径推出无页面。更早的 `P11/T022-real-ui-consumer-audit-20260928.md` 使用 217/208 的旧快照。
2. 这三项功能是否由仓库外页面、生成页面、插件或下游服务消费；若有，需真实页面地址、调用的 API/DTO、服务启动入口、权限、数据与清理方式。当前仓库内查找不能排除它们。
3. 若取得上述真实关系和可运行服务，按 `skills/isolated-browser-qa/SKILL.md` 在隔离浏览器检查受影响用例的正常、拒绝、边界和恢复，并保留页面、网络、控制台和清理的原始结果。服务或浏览器不可用时记 `unavailable`。若经完整消费者核对证明确无页面关系，才可有依据地判此层 `N/A`。

本记录是只读定位结果，不是浏览器验收事实。
