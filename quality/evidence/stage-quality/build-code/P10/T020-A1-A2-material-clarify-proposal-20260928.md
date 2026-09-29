# P8/P9/P10：A1、A2 两条有限业务用例的材料澄清建议（只读）

## 结论和来源

建议由 build-plan 材料 owner 在当前 `spec.md`、`phases/P8.md`、`P9.md`、`P10.md` 的现行段落写入下列精确补充，旧 RED、旧材料时点和三条既有 case 的身份不改。本备忘录没有改材料、目录、登记源、代码、测试或 Task facts，也没有运行测试；它不是质量通过结论。

用户原话在 `decision-log.md` 的 U-6 第 1—4 句（约 2441—2444 行）：从原始需求和变更产生可复用功能/回归用例；build-code 实测效果；证据对照验收及结构/风险；失败后修复、重验并保留证据。其 R-011/R-013/R-014 决定项目唯一版本化业务索引及独立测试资产，R-012 要按交付面执行并同任务复测。当前 `spec.md` 的 FR-30/AC-30 要求有限索引、真实来源与独立库存；FR-32/AC-32 要求可信任务起点到当前快照的完整差分、自动选测和安全实跑；FR-33/AC-33 要求逐例真实报告、效果及失败修复对账。A1/A2 各只覆盖其中一个可观察的子规则，不能单独签 AC-30/32/33。

独立审查 `P10/T020-A1-A2-effect-reader-independent-review-20260928.md` 已准许按**有限范围**实施，但列出六项必补边界。`P9/T019-A1-A2-real-leaf-independent-review-20260928.md` 仅确认两个候选目标在当时源码下分别 7/7、8/8 真实叶通过；它们还未成为正式 registry 或 CARD-04 当前业务效果。实际改动前必须重读当前字节及 SHA，不能复制历史散列。

## 建议写入 P8：两条有限 case，不改旧义务

唯一可写业务索引仍是 `docs/quality/business-case-catalog.json`，由 P8 需求/规则 owner 维护。先以 `decision-log.md` 的 U-6、R-011—R-014/R-012 和 `spec.md` 的 FR/AC-30/32 认定原需求，再以 `phases/P9.md` T018/T019 的现行规则作 `rule`，分别重算两份真实文件 SHA；**不要让 `source.path` 与 `rule.revision` 都仅指 P9 计划文件，也不要从测试名倒推规则**。`source.path` 可落原始 `decision-log.md`，`rule.revision` 落当前 `P9.md`，并在来源绑定测试中固定这层分工及旧版/错路径负控。

| 稳定 ID | 有限规则、目标与真实消费者 | 效果合同及边界 |
| --- | --- | --- |
| `CARD04-AUTHENTICATED-TASK-CHANGE-SCOPE`（A1） | P9/T018 的执行前任务差分；唯一目标 `tests/contract/build-code-preexecution-source.test.mjs`。`change-scope.mjs#capturePreExecutionTaskChangeScope` 被 `capture.mjs` 固定入口、`targeted-capture.mjs` 和选择器实际消费。变化触发至少含 `change-scope.mjs`、共享 `capture.mjs` 及 P9 规则。 | 从认证 bootstrap 与原始 Git 差分独立重算当前快照应测路径、应选 case 和实际 manifest/报告；漏已提交、暂存、脏、未追踪、改名旧/新边、删除或错 Task 均不可局部通过。若合同要断言**外层当次返回的** `change_scope.changed_paths/changes` 完整，必须先将当次数组与同一 receipt/快照绑定为受信原件；现有 receipt/manifest 不存此数组，事后重算不能证明当次返回值。未绑定前将该子断言标 `not_yet_observed/unknown`，不偷换成“返回值已证”。 |
| `CARD04-INDEPENDENT-TEST-INVENTORY`（A2） | P9/T019 的有限独立库存；唯一目标 `tests/contract/build-code-test-registry.test.mjs`。`test-asset-inventory.mjs#readCurrentTestAssetRegistry` 被 `capture.mjs` 与 `targeted-capture.mjs` 实际消费，P10 runner/reader 消费实报。变化触发至少含库存 reader、共享 `capture.mjs`、`docs/quality/test-asset-registry.json`、P9 规则。 | 只对当前已登记、已选且**真实运行**的目标，独立核源码 hash、登记命令形状、真实启动 argv/CLI 路径、原始报告全部叶及状态双向相等；未运行目标为 `not_run`。当前 reader 不枚举其余真实测试入口，因此 `outside_scope=unknown`、两边都漏的资产及 FR-30 全范围均不宣称通过。 |

每例按现有 catalog v1 形状填 owner、来源与规则版本、实际消费者/接口、风险/环境、四种场景、AC/Task/Phase、独立效果 reader 职责、正反谓词和缺证 `unknown`；`effect_observation.observation_status` 先为 `not_yet_observed`，不写实测通过。A1 对应 AC-32/T018/P9，A2 对应 AC-30/T019/P9。两例可共同被 `capture.mjs` 触发，但共享入口本身不构成 `related_case_ids`；仅有经证明的业务依赖才互绑。新目标是对原 `evolution.phase_obligations` 的补充：T018 旧 `build-code-change-scope.test.mjs`、T019 旧 `build-code-test-inventory.test.mjs` 及其 `not_done`/历史证据照留，不机械换目标或翻状态。旧三例和 `uncharted_legacy.status=unknown` 照留。P8 的 `business-case-source-binding.test.mjs` 可窄增新 ID 的来源当前字节、错来源、旧版与消费者负控；冻结的 `business-case-catalog.test.mjs` 不改求绿。

## 建议写入 P9：三目标扩五目标的真实库存

P9 测试资产 owner 只扩唯一 `docs/quality/test-asset-registry.json`；不从 P8 的期望叶数组抄写。先冻结旧 registry、`build-code-test-registry.test.mjs` 原字节及旧三目标的当前源码 hash、命令、各 6/28/15 个完整叶 ID 与原始报告；旧三份的路径、叶集合和漏/多/skip/重复/错命令/源码漂移负控必须保持可检验。两份候选原始单文件 JSON、退出码、源码及完整叶清单见 `P9/T019-A1-A2-real-leaf-discovery-20260928/`；分别为 7 与 8 个叶，审查时均 pass，新增登记须按**最终测试字节**重新跑并重算，尤其 A2 测试自身的正控修订会改变目标 SHA，改名也会改变完整叶 ID。

`build-code-test-registry.test.mjs` 的现行“恰三目标/叶数 [6,15,28]”正控需要合法窄修成：旧三份逐个身份和全部叶不退化；新两份各自等于独立发现的完整实报；五份目标均唯一、物理目标不重复，仍有有限 `outside_scope=unknown`。先保存该测试旧字节与有意义 RED，再修正测试，待最终字节稳定后重新发现 A2 叶和文件 SHA，最后填 registry 并以同一目标取 GREEN；不能只把数字 3 改 5，也不能删旧负控。`scope_note` 应从“仅三份”改为“仅五份”；不得写成项目全部资产。按影响再跑 `build-code-preexecution-source.test.mjs`、旧 `build-code-change-scope.test.mjs` 和 `build-code-test-inventory.test.mjs`，保留实际失败。

登记命令 `npx vitest run <target> --reporter=json` 是规范字符串；P10 固定 runner 实际调用受信 Node 加仓库解析的 `vitest/vitest.mjs`，argv 为 `[cli,"run",target,"--reporter=json"]`。两种表示分别核身份，不能要求字面相等。P9 的五目标仍只是有限库存；若要满足 FR-30 中“已发现但未登记目标也能指出”，须另有独立 Git/package/Vitest/Node 入口发现和未关联清单，不能靠 registry 自列目标与目录互相证明完整。

## 建议写入 P10：局部可读，整体仍不可用

P10 owner 在现有 `workflows/build-code/case-reconciliation.mjs` 的只读 reader 中给 A1/A2 分别核原始 Git/bootstrap、当前 catalog/registry、**指定** canonical receipt→output→manifest→case record→原始 JSON 报告及每层 ref/hash、当前 Task/树/材料和实际 argv。共享 AC 的 quality fact 只能验证该 AC 的来源链；A1/A2 每例还须独立观察自己的规则，不能由一个 `AC-32` 或 `AC-30` 通过反推两例通过。现有 `readCurrentEffect` 先要求当前逐 AC fact、acceptance wrapper 和指定 receipt 绑定；A1/A2 的有限观察不得绕过此链，也不能填假 acceptance 数据来求绿。

目前 `reconcileCurrentTaskCases` 在 `partial`（有未映射变化）时读完报告即返回 `unmapped_changed_path`，根本不会调用后面的 `readCurrentEffect`。可在此分支增加**只读逐例诊断**，标清每例已观察/未知及各自反证，同时保留 `status=unavailable`、未映射原路径、总体业务 `unknown`；不得让诊断改正式选择、阶段或 AC 状态。A1 若只证明“当前 Git 原件重算的应选 case 与 manifest 一致”，需按此窄句报告；“外层当次返回数组完整”须先满足上述持久绑定。A2 只可说“已登记且当次运行的目标叶一致”；未运行和未发现资产分别列为未知。正反测试要使独立原件与被测返回矛盾：漏 Git 路径、改名缺一边、删除漏记、错 Task/旧树、报告漏/多/skip/重复/0 叶、错真实 argv/CLI、换 ref/hash、一个 AC 共用多例、其它未映射路径仍在，都不能得到总体通过。

此 P10 reader 只解决有限局部。正式 `run` 当次消费证据、逐 AC 真实事实生产、适用单元/代码/接口/UI 层、AC-33 失败→同任务修复→新快照重选重跑及结构/风险对账仍按原 P10/P11 计划独立完成。旧“218 变化/209 未映射”仅一次历史诊断；下一次必须按**当时当前快照**重算，未映射未清完时仍是 `unavailable`。

## 写面、测试及顺序

1. build-plan 材料 owner 先把上述边界写入现行 `spec.md` 与 P8/P9/P10 当前段落，明确这是原 FR-30/32/33 的有限实现，不添新 FR、AC、stage 或门；保留旧时点记录。异源审查材料后再动生产字节。
2. P8 owner 审原需求和当前 P9 规则，冻结旧目录与目标证据，只改唯一 catalog 和现有来源绑定目标，取得同测试目标的有意义 RED→GREEN。P9 owner 独立冻结旧三目标，按最终真实报告扩 registry 并合法窄修正控/保留负控；双方不得互抄身份。A1/A2 两个物理测试文件必须不同。
3. P10 owner 实作局部 reader 与 `partial` 诊断，用真实相互矛盾输入做目标负控，按影响运行相邻 P9/P10 合同；异源代码审查后，在当前 CARD-04 Task 的**新快照**实跑固定入口并核当次原件。最后再处理其它未映射变化、完整资产发现、逐 AC 来源和适用层，不能拿这两例结算全卡。

预计只需改**现有** catalog、registry、`tests/contract/business-case-source-binding.test.mjs`、`build-code-test-registry.test.mjs`、`workflows/build-code/case-reconciliation.mjs` 及现行材料；复用现有 v1 JSON 形状即可，不预设新字段、第二账本或新 schema。若必须持久证明 A1 的外层当次数组，先定位现有受信执行原件可否绑定；确需新持久字段/文件或新测试文件时，先列唯一 producer、consumer、owner、替代与删除条件，并由 move-map owner 对**新文件**作 `status:add` 登记后实施。此备忘录是 `quality/evidence/` 中的只读提案，不作生产文件登记。旧冻结测试、原 RED/GREEN 和失败原件一律不覆盖。

## STOP 条件

- 找不到与原始需求及当前 P9 规则独立对应的来源，或当前 SHA/消费者/测试叶已变且未重核：停在 `unknown`，不刷新 hash 求绿。
- A1 当次返回数组无受信绑定、A2 其余测试入口无独立发现：只报已证明的重算选择/有限已运行目标，不扩大成完整变化或全库覆盖。
- `partial` 仍提前返回、逐 AC 链缺失/错绑、真实报告未运行或 ref/hash/argv/叶矛盾：不得报局部通过，更不得把总体 `unavailable` 改为 passed。
- 需要越过上述既有写面、新增公共命令/状态/schema/持久文件，或窄测试只因 import/setup 失败：先停相关实现，修材料及 ownership/登记并取得可审查的目标 RED；旧原件保留。

