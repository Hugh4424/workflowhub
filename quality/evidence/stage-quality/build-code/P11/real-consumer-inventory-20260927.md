# P11/T022 真实页面消费者与 UI 适用性：定向只读核查

- 2026-09-27；worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。原始字节 SHA-256：`spec.md` `41b61a820c95f4ae489ee96f1a47e683abed54f387acb4dce37cee2d3fb2f328`；`phases/P11.md` `10ad4f048ac3ea5c8d2b0953c75598c8c6767c95115074a56c6eef9c13f5a381`；`decision-log.md` `e7ddb0f1398ee675b4a8c0411283fe24b39b43736d6916e1da32bb5984a45268`；`docs/quality/business-case-catalog.json` `d0d601a77cc2ed7d96a75f646aa8fbacebb922c97f8a3ba9c5130af670021dfa`。本次没有运行测试、服务或浏览器，没有更改材料/源码/测试。

## 定向来源与发现边界

| 来源 | 实际事实 |
| --- | --- |
| `phases/P11.md:5,17,19,29-34,45-49,60,62` | P11 明定后台→页面关系必须由真实 business case、独立库存、服务/API/DTO、浏览器原件和官方逐 AC 消费核实；当前 `CASE-BROWSER-001`/settings page 是假设夹具，真实 adapter、服务 fixture、生产消费者未证，P11/T022 条件 STOP、`not_done/needs_business_case`。`:60` 限定只有核实无页面/交互消费者且差分确属非 UI 才可 N/A；缺服务/adapter 为 unavailable，关系不明为 unknown。 |
| `docs/quality/business-case-catalog.json:401-416` | P11 obligation 的 `case_id=null`、`consumer_status=unknown`、`business_rule_status=unknown`，触发路径只指冻结测试，文本明确没有经认证的真实 page/API service trigger 或 browser result。目录未登记可运行的 P11 业务 case。 |
| `tests/contract/post-business-browser-reconciliation.test.mjs:1-59` | 仅内存 `P1` Phase、虚构 `CASE-BROWSER-001`/settings page 与 `projectPostPhaseAcceptanceExecutionData` 的 service 正控/browser 表示负控；没有真实页面访问、服务请求或浏览器 runner。`runtime/stage/stage-content-contracts.mjs:8065-8067` 当前拒绝 post browser tier。 |
| `runtime/stage/stage-handlers.mjs:1040-1107` | 现有受控浏览器 QA 投影把已分类 `backend`/`non_ui` 直接报 `not_applicable`；若后台实际关联页面，该分支可能错判。无 adapter 且适用性未分类则返回 unknown。此 handler 的存在不证明 P11 的业务浏览器执行已接线。 |
| `package.json:6-34` 及定向文件清查 | npm scripts 是检查/测试/探针，无 `start`/`dev`/业务服务脚本；依赖仅 Ajv、js-yaml，开发依赖 markdownlint、Vitest。`rg --files runtime tools workflows tests` 按常见 web/app/client/pages/ui/server/api/front-end 路径与页面扩展名定向筛选，没有识别 P11 settings 业务页面、后端服务/API/DTO；这是**已查范围内未发现**，不是全仓或外部系统不存在的证明。 |
| `tools/cli/build-reflection-page.mjs:1-9,48-49`、`tests/fixtures/workflow-evolution/setup-browser-fixture.mjs:1-42`、`run-browser-qa.sh:35-61` | 仓库确有生成的 WorkflowHub monitor HTML。fixture 在临时目录生成页面，再以 `python3 -m http.server` 暴露静态文件供 QA；其数据是 stage reflection/确认等演示 task。它不是 P11 假设的 settings 业务页面，也无该 case 的服务 API/DTO。故不能用“仓库有 HTML/浏览器脚本”冒充 P11 已有可运行业务服务。 |
| `decision-log.md:1816-1839`、`:138`；`spec.md:306,552-556` | 旧 `non_ui` 记录的来源范围是 R-001..R-008 及当时 CLI/文档写面；`:138` 明说扩展后三输入/工作面须重核，并保留未来后台影响页面的可能。FR/AC-32..34 要按真实消费者、安全执行与独立事实判适用性；缺环境或接线不得转成 N/A/pass。 |

## 判定与所需输入

当前只能判定：**P11 没有经过认证的真实页面+服务/API/DTO+业务 case 可供本相位实跑**，不是“已证明不存在 UI 消费者”。旧 `non_ui` 来源范围与新增 AC-32..34 不同，且冻结测试的 settings 页面为假设，因此不能据缺文件、无服务或旧标签给 P11/相关 AC 写 `non_ui/N/A`。保持 P11/T022 `not_done/needs_business_case`、UI 逐 AC `unknown`；若已证 UI 适用但执行环境/adapter 不在，则记 `unavailable` 并列影响。

后续由 CARD-04 P11/T022 产品/业务 owner 与相应真实系统 owner 提供版本化业务来源、可信变更起点与实际差分、独立入口/测试库存、真实 page→API/DTO→service 消费关系、运行/权限/数据/清理入口及正反业务 oracle，供独立核查。若主张 N/A，须对**当前受影响变化**给出差分和消费者清查，证明没有页面/交互消费者，并在现有事实槽位写明理由；若找到消费者，则需服务/浏览器实际执行及官方逐 case/AC 原件。产品写面和受保护 runtime 接线仍依 P11 卡的单独授权边界处理。本证据只记录现状，不代替 owner 的业务结论或浏览器验收。
