# P11/T022 保护写面与真实浏览器路径提案（只读诊断）

日期：2026-09-26。任务：`workflowhub-thin-core-card-04-20260919`，分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。本文件是供主会话和跨卡 owner 审查的范围提案，不是生产写入许可或浏览器验收结果。

## 当前可核事实

- 原卡面命令 `npx vitest run tests/contract/post-business-browser-reconciliation.test.mjs` 当前 exit 1：2 collected，service 正控通过，browser 目标断言失败。原始输出、输入 SHA 和环境见 `T022-current.txt`。失败精确值：`P1/T022 acceptance_data[0].tier must be command or service for a post non-UI acceptance`，来自 `runtime/stage/stage-content-contracts.mjs:8067`。测试中的 `CASE-BROWSER-001`/settings page 是内存假设夹具；它没有运行页面、服务、API 或 DTO。
- `docs/quality/business-case-catalog.json` 仅有三个 CARD-04 CLI/证据类种子 case。其 `evolution.phase_obligations` 中 P11/T022 的 `case_id=null`、`consumer_status=unknown`、`business_rule_status=unknown`，并明确写无经认证的真实 page/API service trigger 或浏览器结果（该文件约 `:343-358`）。`docs/architecture/real-entry-inventory.md` 登记的是 CLI、Vitest 和报告入口；未登记可运行的产品页面、服务、API、DTO。当前没有可绑定的真实浏览器业务 case，不能据此把 UI 判 N/A。
- `runtime/stage/stage-handlers.mjs:1026-1040` 的 `inferImpactFromAuthenticatedImplementation` 只从 implementation receipt 的路径形状推 UI/backend；`controlledBrowserQaFacts` 在 `:1040-1140` 对已判为 `backend`/`non_ui` 的变化返回 `not_applicable`。决策日志若声明 `ui` 而认证差分只显 backend，则当前返回 `unknown`；两条路径都没有读取 catalog 的后台→页面业务关系，不能据此完成页面触发判定。它已有 `worker.runControlledUiQa`、身份/服务/API/DTO/快照核对、canonical ref/hash、fixture-only 和 cleanup 负控（约 `:1137-1339`），应复用这些边界。
- `runtime/stage/stage-handlers.mjs#acceptanceExecutionFacts`（约 `:1528-1610`）消费 post projection，却把所有 scenario 交 `worker.runAcceptanceScenario`；其中虽有 browser executor/canonical evidence 校验，尚未见从登记 case 与当前服务生成逐 case 浏览器场景的可信生产者。`runtime/stage/stage-runner.mjs#readCurrentE2eAcceptanceEvidence`、`#currentPostBuildCodeSpecAnalyze` 也消费同一个 projection；若扩展 browser 结果，须用真实执行原件核它们的逐 AC 读回。

## 候选最小接线，按依赖顺序审查

| 顺序 | 精确文件/符号 | owner 与真实 consumer | 必须实现的行为及负控 |
| --- | --- | --- | --- |
| 1：表示边界 | `runtime/stage/stage-content-contracts.mjs#projectPostPhaseAcceptanceExecutionData`，复用 `acceptanceExecutionErrors` | 保护写面 owner=CARD-05 runtime/stage 维护者；consumer=`stage-handlers.mjs#acceptanceExecutionFacts`、`stage-runner.mjs#readCurrentE2eAcceptanceEvidence`/`#currentPostBuildCodeSpecAnalyze` | 允许合法 post `browser` tier 进入只读 projection；browser 场景仍禁止 service/command 专用 `execution`。没有显式 UI 范围或真实页面关系时投影只能表达“待证明”，不能据语法 `eligible_for_pass` 推浏览器实际通过。保留 service/command 正控、非法字段、缺 source/sample/scenario、未知 tier、错 AC 负控。冻结 P11 两断言只验证本行的表示能力，不证明真实业务关系。 |
| 2：后台→页面判定和当前执行 | `runtime/stage/stage-handlers.mjs#inferImpactFromAuthenticatedImplementation`、`#controlledBrowserQaFacts`、`#acceptanceExecutionFacts` | 保护写面 owner=CARD-05 runtime/stage 维护者，或其明确授权的跨卡实现者；consumer=现有 build-code handler、task quality facts、verify-code 的逐 AC 读取 | 以经认证的 P8 case 来源/版本、P9 可信变更快照与独立库存、P10 选择/逐例关系证明后台文件影响真实页面；不能只看 changed-file 后缀，也不能接受调用者自称有页面。对每个受影响 case/AC 将真实服务/API/DTO、路由/页面、浏览器 profile 和场景绑定到当前 controlled QA invocation；只用已有 `runControlledUiQa` 与 canonical browser evidence。缺关系、adapter、服务或绑定记 `unknown/unavailable`，不变成 N/A/pass。错误服务/API/DTO/AC/快照、仅 fixture、跳过或 0 测试、取消及 cleanup 失败必须不能 pass。保留 service/command 执行与旧失败原件。 |
| 3：只在第 2 行原件显示消费者缺口时 | `runtime/stage/stage-runner.mjs#readCurrentE2eAcceptanceEvidence`、`#currentPostBuildCodeSpecAnalyze`；必要时同文件现有 AC quality fact 发布边 | 保护写面 owner=CARD-05 runtime/stage 维护者；consumer=verify-code 现有独立抽查与授权确认 | 仅补经证实缺失的 browser item/ref/hash→AC 来源读取，不新建进度对象或公共命令。负控：旧快照/错 material revision、错 AC、缺 canonical bytes、review/confirmation 缺失、旧失败被新绿覆盖，均保留 incomplete/unknown。若现有读取已支持，删除本行候选，不为对称性改文件。 |

当前不创建 `workflows/build-code/browser-case-reconciliation.mjs`：先验证 P10 现有 case 选择、runner 与对账结果能否提供上述已认证关系。若确实缺消费者，再登记该私有模块的唯一 owner、调用方、测试和删除条件，并另行裁定；不得形成第二份 case/AC 权威。

## 实施前必须补齐的来源与验证

1. 后续业务 owner 提供**真实**产品页面、服务实例、API、DTO、业务规则版本和消费者链，给 P8 catalog 一个稳定 case ID，含后台变动触发、正常/拒绝/边界/恢复的业务 oracle 与邻近旧回归。当前目录与假设 settings 夹具不能代替。CARD-04 当前 Phase 明定不建设业务页面/服务样例；真实浏览器路径归后续获授权卡。
2. 对该 case 认证 P9 task-start commit/tree、当前 committed/staged/dirty/untracked 差分及独立测试身份，再核 P10 自动安全选测和逐例观察；缺起点或未登记关系保持 `unknown_change_scope`/unknown。执行只用固定 argv 和既有官方 handler。
3. 先补可失败的定向测试：现有 P11 service 正控/browser 目标断言；backend-only changed file + 已认证页面 consumer 仍触发 UI；无真实 consumer 不得假称 N/A；无 adapter、错服务/API/DTO、fixture-only 伪 pass、cleanup 失败、错快照/AC 和 skip/0 tests 均不得写通过。保护写面修订须经独立审查，再用同一目标命令取得 GREEN。纯合同 GREEN 只说明表示层。
4. 真实服务和浏览器具备后，由 `isolated-browser-qa` 在隔离 profile 中实跑正反/恢复；保存登录态是否复用、runner 身份、请求/响应、截图、console、取消与 cleanup、canonical ref/hash、逐 case/AC 当前快照对账。缺环境或浏览器工具时保留 `unavailable`，不使用假页面、mock、普通 shell exit 0 替代。

## 回退与当前结论

每一候选 hunk 都以当前 HEAD/工作树原字节及目标 RED 为回退点；若负控失败，撤销**本次候选 hunk**，保留原始失败证据、service/command 既有行为及 CARD-05 其它改动。已发布 task quality 原件只追加新事实，不覆写或改称旧失败为通过。当前仅 CARD-05 落地和可失败表示层负控可核；精确保护写面授权、真实业务 case、服务/adapter、逐 AC consumer 和浏览器原件均未到位。T022、AC-32/33 的浏览器效果保持 `not_done/unknown`；主会话可用本提案完成独立准备后，才把确切文件/符号与 owner 提交后续裁定。
