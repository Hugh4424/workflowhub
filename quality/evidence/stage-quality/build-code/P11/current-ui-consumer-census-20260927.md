# P11 当前页面消费者清查（2026-09-27）

## 身份与范围

- 仓库：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`；分支：`task/workflowhub/workflowhub-thin-core-card-04-20260919`；HEAD：`ef920f1fbd415fe87d50930359059b661e141acd`。
- 本次只读检查当前 tracked 差分、未跟踪文件、P8 三条业务用例、P11 合同测试及所指消费者。未启动服务、浏览器，未运行测试。本记录不证明仓库外系统不存在页面。
- 当次文件 SHA-256：`decision-log.md=790d009a07600a9d23e64e6a20dfa0d55804d18abcb6975cbee47aaa43b9c652`；`spec.md=e45b08dbb973ce8547cac01b494953ecd3c8906fd3c206200444f572c177aa8a`；`phases/P11.md=10ad4f048ac3ea5c8d2b0953c75598c8c6767c95115074a56c6eef9c13f5a381`；`docs/quality/business-case-catalog.json=d0d601a77cc2ed7d96a75f646aa8fbacebb922c97f8a3ba9c5130af670021dfa`。

## 有界核查

| 来源 | 观察 |
| --- | --- |
| `git diff --name-only HEAD`、`git ls-files --others --exclude-standard` | 当前产品相关差分是 `runtime/evidence/**`、`runtime/review/**`、`runtime/stage/**`、`tools/cli/stage-runtime.mjs`、`workflows/build-code/**`、技能、架构/业务目录及合同测试；未在本次清单发现 P11 真实业务页面、页面服务、API 或 DTO 文件。`specs/**` 和 `quality/**` 中大量材料与证据不算产品页面。此为已查差分的阴性发现，不是全项目无页面的证明。 |
| `docs/quality/business-case-catalog.json:18-96,99-204,208-301` | 三条 active seed 分别是 decision-log 原始来源普查、验收状态枚举、旧 deferred 行为回归。各自 `consumers` 指向 runtime helper 与定向测试，未登记 page、service、API、DTO；case ID 在 `runtime/`、`tools/`、`workflows/` 的精确反向引用均为零。目录声明三条只是有限种子、旧业务未盘点（`:11-14`、`:304-308`），不能由此证明所有消费关系已查全。 |
| 来源版本 | 目录首条 seed 的 `source.revision` 是 `sha256:e7ddb0f1398ee675b4a8c0411283fe24b39b43736d6916e1da32bb5984a45268`（`:22-25`），当前 `decision-log.md` 是 `790d009a...43b9c652`；这条来源绑定已漂移。另两条 seed 指向的 `phases/P7.md` SHA-256 为 `f84be26579271b7bad51ea4aae587ad4a5cb9dff4a93762906cb3ea98e6442aa`，与目录 `:103-109,:212-218` 一致。目录本身不能作为当前 P11 页面排除证明。 |
| `docs/quality/business-case-catalog.json:400-416` | P11/T022 obligation 的 `case_id=null`、`consumer_status=unknown`、`business_rule_status=unknown`，明确尚无认证的真实 page/API service 触发或浏览器结果。 |
| `tests/contract/post-business-browser-reconciliation.test.mjs:13-22,50-58`、`phases/P11.md:29,34` | `CASE-BROWSER-001` 和 settings page 是内存测试的假设场景。没有连接真实设置页面、服务请求或浏览器运行。`runtime/stage/stage-content-contracts.mjs:8058-8071` 当前还拒绝 post browser tier。 |
| `runtime/stage/stage-handlers.mjs:1040-1107` | 现有浏览器 QA 路由对分类为 `backend`/`non_ui` 的变化返回 `not_applicable`；适用性不明且无 adapter 时返回 `unknown`。该路由存在不证明 P11 的后台→页面业务关系已接线。 |
| `tools/cli/build-reflection-page.mjs:48-49`、`tests/fixtures/workflow-evolution/setup-browser-fixture.mjs:7-42`、`tests/fixtures/workflow-evolution/run-browser-qa.sh:35-61` | 仓库的 `build-reflection-page-template.html` 用临时任务的 stage reflection/确认数据生成静态 `workflowhub-monitor.html`；测试脚本用 `python3 -m http.server` 暴露该静态文件。这不是 P11 的 settings 业务页面，也没有对应服务 API/DTO。不能因仓库有 HTML 与浏览器脚本便把假设业务场景算成真实消费者。 |
| `decision-log.md:1816-1839,2379,2411`、`phases/P11.md:17,19,60,62` | 旧 `non_ui` 答复针对当时验收规则/CLI/文档范围；新增方向要求对当前受影响变化重新核页面消费者。无服务或 adapter 是执行缺口，不能自动改成 UI `N/A`。 |

反向查找范围：对三条 seed ID 在 `runtime tools workflows` 做精确 `rg -F`，零命中；对 `runtime tools workflows tests` 的 `.html/.tsx/.jsx/.vue/.svelte` 与常见 `pages/app/client/server/api/frontend` 路径做定向文件筛选，仅识别静态 monitor 模板。这些阴性结果只覆盖所列仓库路径与当前文件，不涵盖仓库外业务系统、未登记关系或历史页面。

## 当前结论与补证条件

**目前不能判 P11 页面测试 `N/A`。** 已查范围内没有认证的 P11 真实 page→API/DTO→service 消费链和可执行环境；也没有证明当前受影响变化完全不触及页面。保持 `P11/T022=not_done/needs_business_case`，逐 AC 的 UI 适用性为 `unknown`。若随后证实 UI 适用而服务或 adapter 不可用，执行结果记 `unavailable`，不可倒写为 `N/A` 或通过。

下一步由 P11 产品/业务 owner 与实际系统 owner 提供：当前可信任务起点和完整变化范围、版本化业务来源与 case 关系、独立入口/测试库存、真实 page→API/DTO→service 及调用者、服务运行/权限/数据/清理方式、正反业务 oracle。若主张 `N/A`，须对**当前差分**独立反查消费者并给出无页面/交互影响的可复核理由；若发现页面消费者，须按 P11 卡取得真实服务/浏览器及官方逐 case/AC 原件。静态 monitor、假设 settings fixture、旧 `non_ui` 与缺服务本身均不足以支持 `N/A`。
