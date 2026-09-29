# P11/T022 真实页面消费者只读核查（2026-09-28）

## 结论

目前既不能证明「本次改动无需浏览器检查」，也没有可绑定并实跑的真实业务页面。P11 的浏览器业务效果保持 `unknown`，T022 保持 `not_done`。没有启动服务或浏览器；没有修改产品代码、测试、材料或既有证据。

## 本次所查来源

- 正确工作树分支为 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。P10 的**当时快照**在 `quality/evidence/stage-quality/build-code/P10/T020-current-selection-readonly-20260928/summary.md:3-5`：tree `4381e90d43a7072ba12d1a4359ba757c3ddd5786`，material revision `revision-30e50b760cb29e92f9b114a9be6db6105647a76b7c3c8caeb15a4a949a4975b6`，catalog SHA-256 `a16fd876ad2935fd812835c56f863a4b91bd33ac4f618b3edca32d5d763a32d9`，registry SHA-256 `b5f7c79668c9fcaa91b6fa4beea96b292e878534fe5e32ca13938fcb79f0e957`。原始选例对象为同目录 `raw.json`（本次读回 SHA-256 `465eeabc321140ecbd868c6720d314ea6a8fbd3d27dec6764bf5d7634b128966`）。后续改动可能使此 tree 过时，不能把该结果称为最新正式验收。
- 此快照含 217 条 changed paths；目录触发关系精确命中 9 条，208 条未映射，选择结果为 `unavailable / unmapped_changed_path`，测试状态 `not_run`（上述 `summary.md:5,20`）。本次逐条筛查 `raw.json` 的 217 个路径：没有 `.html/.css/.tsx/.jsx/.vue/.svelte` 文件，也没有常见 `web/frontend/ui/public/pages/app/api/dto/server` 目录路径。该**文件名筛查**不能排除后台结果被外部页面使用，尤其不能解决 208 条未映射关系。
- `docs/quality/business-case-catalog.json` 的 3 条现有 case 分别是 `CARD04-DECISION-LOG-CENSUS`、`CARD04-ACCEPTANCE-MACHINE-CLASSES`、`CARD04-DEFERRED-ACCEPTANCE-REGRESSION`；其 `consumers` 指向 `runtime/stage/stage-content-contracts.mjs`、`runtime/evidence/freshness.mjs`、`runtime/evidence/quality-store.mjs` 和相应测试，没有页面调用链。目录的 P11/T022 项仍为 `case_id: null`、`consumer_status: unknown`、`business_rule_status: unknown`，并直说没有经认证的真实 page/API/service 触发与浏览器结果（`:518-533`）。这只说明目录尚未登记，并不证明外部消费者不存在。
- `tests/contract/post-business-browser-reconciliation.test.mjs:4-38` 自己说明是内存表示层夹具；其中 `CASE-BROWSER-001`、settings page/service 都是测试文字，不是可访问的页面地址或服务。
- `package.json:6-25,27-33` 的 scripts 是检查、探针和测试，没有 `start`/`dev` 或业务服务启动入口；依赖为 Ajv、js-yaml，开发依赖为 markdownlint、Vitest。在排除 `quality/**`、`specs/**`、`node_modules/**` 后按页面扩展名查文件，唯一 HTML 是 `tools/cli/build-reflection-page-template.html`。这只限定仓库内已查范围。
- 该 HTML 是**静态任务监控页**：`tools/cli/build-reflection-page.mjs:48,800-802,824-850` 读取模板、投影任务数据并写 `workflowhub-monitor.html` 与 `data.js`；模板 `:414-424` 从嵌入的监控数据渲染任务状态。测试夹具 `tests/fixtures/workflow-evolution/setup-browser-fixture.mjs:5-40` 构造模拟任务后调用 writer；`tests/fixtures/workflow-evolution/run-browser-qa.sh:35-61` 用本地 `python3 -m http.server` 提供静态页面并让浏览器打开。该 writer→页面 reader 路径核的是历史任务监控显示，不是上述 3 条 CARD04 用例的真实 settings 页面→API/DTO→服务消费者链；不能拿它冒充 P11 的业务浏览器结果。
- `runtime/stage/stage-handlers.mjs:1028-1043` 只根据改动路径形状分类 UI/backend；`:1094-1103` 对 `backend` 或 `non_ui` 直接返回 `not_applicable`。这里没有读取 3 条业务 case 的页面消费关系。若后台接口实际供页面使用，仅凭路径判断会漏检；若材料声明与路径分类冲突，`:1071-1092` 可退到 `unknown`，仍不能证明 N/A。

## 何时才能下结论

1. **可判无需浏览器检查**：先对可信任务起点到当前完整改动（含 committed、staged、dirty、untracked）重算范围，解决未映射路径；再从每条受影响的版本化业务规则追到真实调用者和消费者，独立证实没有页面或交互消费者，并将理由绑定当前 Task、材料版本和代码快照。只有仓库没有页面文件、旧 `non_ui` 声明或没有服务脚本，都不够。
2. **必须做浏览器检查**：一旦证实受影响的后台结果被真实页面使用，就取得该页面的实际 URL、服务/API/DTO 身份、可控测试数据、权限及清理方式；在当前服务上按 `skills/isolated-browser-qa/SKILL.md` 用隔离浏览器核正常、拒绝、边界及恢复，保留逐 case/AC 原始结果与读回。没有服务或浏览器执行条件时，应写 `unavailable`，不能写 N/A 或通过。

## 后续最小可失败负控设计（未实施）

- 构造仅含 `backend` 路径的**经认证改动回执**，并提供同一任务、材料版本和快照下经独立校验的目录关系：该路径的输出由一条真实页面 case 使用。调用现有 build-code 浏览器适用性入口；期望为需做浏览器检查。若无可用服务或 adapter，应得到 `unavailable/unknown`，绝不能得到 `not_applicable`。此例要能在当前 `stage-handlers.mjs:1098-1103` 的直接 N/A 分支上失败，修复后通过。
- 保持同一 backend-only 改动，但去掉经过认证的消费者关系或使关系来源/版本不符；期望为 `unknown`，绝不能因文件后缀自动 N/A，也不能靠调用者自称「有页面」触发假浏览器通过。相邻正控是经认证且无页面/交互消费者时才允许 N/A。
- 用当前 P11 的 settings **内存夹具**只证明逻辑不会误判，不把它当作真实页面、真实服务或业务通过。上述负控须在 P4 当前官方审查绑定快照不再受影响、保护写面明确后才落到测试和生产代码；本次没有编辑二者。

本次两个条件都未证成；最小下一步是刷新 P10 当前范围并补齐业务 case→真实消费者关系。此前 `quality/evidence/stage-quality/build-code/P11/real-consumer-inventory-20260927.md` 是更早快照，本记录不改写其历史事实。
