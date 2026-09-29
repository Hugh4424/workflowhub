# P10/T020 A1/A2 材料澄清：独立只读审查

## 裁决

**准许 build-plan 材料 owner 先作有限澄清；尚不准据此宣称 P8/P9/P10、AC-30/32/33 或两例业务效果完成。** 当前提案的来源链和写面方向成立，但必须保留以下界线。本文只审材料提案，不批准生产结果；未改材料、目录、registry、代码、Task facts，未跑测试。

## 核对事实

- 原始 `decision-log.md` 的 U-006 第 1—4 句，以及 R-011/R-013/R-014，确实要求项目版本化、可复用业务用例与原位测试、真实测试和证据；R-012 要求按风险/交付面测试、同任务修复复测并留旧证据。`spec.md` FR/AC-30/32/33 把独立测试发现、可信差分与自动安全实跑、逐例效果及修复链写成更完整的要求。P9/T018 是变化来源，T019 是独立库存；两个候选各是其中一条**有限**规则，不是完整 AC。
- 现有 `docs/quality/business-case-catalog.json` 仅三例，旧三例的 `effect_observation` 均是 `not_yet_observed`，`uncharted_legacy=unknown`。七条 `evolution.phase_obligations` 仍指原目标；T018 `build-code-change-scope.test.mjs` 与 T019 `build-code-test-inventory.test.mjs` 仍为 `not_done`。`business-case-catalog.test.mjs` 对七条目标写有固定身份和升格审查要求，不能为求绿改掉旧目标或负控。
- `docs/quality/test-asset-registry.json` 仍只有三份目标，当前文件 SHA 与登记值相符，完整叶数分别 6/28/15，`outside_scope=unknown`。独立的 A1/A2 真实叶复核记录 7/7 与 8/8；本次只读重算两份候选源码 SHA 分别仍为 `e5ec0396366b1936784e2736265de74b9d4733cbe47dc6265920853d130d76af` 与 `9afc2b3bb98103f09b0e0f77053e130b6532b6c1d8131fb3dc502f0f27661d2e`。这不代替改后实跑，尤其 A2 测试自身修订会改变自己的 SHA 和可能改变叶 ID。
- `targeted-capture.mjs` 允许有未映射变化时执行已选例，但 `case-reconciliation.mjs` 当前在 `partial` 分支验证报告后立即返回 `unmapped_changed_path`，不会调用后面的逐例效果 reader。现有 `readCurrentEffect` 对 A1/A2 没有独立规则观察，且先要求当前逐 AC 事实链。`P10/T020-A1-A2-effect-reader-independent-review-20260928.md` 指出的六个缺口仍成立。
- `docs/architecture/move-map.json` 已为业务目录、独立 registry、A1/A2 两份现有测试文件作 `status:add` 登记。提案列出的 catalog、registry、两个现有测试、现有 reader 和现行材料若只作原位修改，**不需要再新增文件登记**。若实施时增生产文件/测试文件，须先按该文件的 owner、唯一 consumer、替代及删除条件另行登记。

## 材料必须先写清的边界

1. 在 `spec.md` 与 P8/P9/P10 的现行段落明确：A1/A2 是原 FR-30/32/33 下两个新补充 case，分别只证明认证变化来源与**已登记、已选且实跑**目标的有限对账。旧三 case、旧两份 T018/T019 测试及七条义务的 `not_done`/历史 RED 保留。要说明“新增 case 已登记”与“原 Task/Phase 义务完成”是两回事；若以后升格原义务，须依 P8 原有规则有实际 source、consumer、runner/oracle 与独立审查 ref，而非用新目标自动替换。
2. P8 case 的 `source.path` 应锚原始 `decision-log.md` 的 U-006 和适用 R 项，`rule.revision` 对当前 P9/T018 或 T019 的**最终材料字节**，`source.revision` 对原来源当前字节；测试须固定原文标记、规则标记、真实 consumer 与错来源/旧版反例。不能让 `source` 和 `rule` 都只指计划卡，也不能从测试名倒推业务规则。P9 卡若先改，须在定稿后重算 SHA 再写 catalog。
3. A1 目前最多核“当前 Git/bootstrap 原件重算的应测路径、应选 case 与指定 manifest/实报一致”。receipt/manifest 没有持久保存外层当次返回的 `change_scope.changed_paths/changes`；未补同次可信绑定前，这一子句只能 `unknown/not_yet_observed`。A2 最多核有限已登记并实跑的目标；当前 registry reader 不独立枚举其余真实测试入口，`outside_scope=unknown` 不能改为全面覆盖。未运行目标须列 `not_run`。
4. `partial` 仅可附逐例**只读诊断**。诊断须分开“原始报告身份已核”“独立规则已观察”“逐 AC 质量事实已绑定”，不能把前两项当作第三项。即使 A1/A2 有局部正例，只要其它改动仍未映射，整体仍 `status=unavailable`、`business_effect_status=unknown`，原路径原样保留；同一 AC 对应多个 case 时必须各验自己的原件和规则。当前 Task 无对应正式成功回执与逐 AC 效果事实，不能预填通过。
5. P9 扩 registry 前冻结旧三目标的原字节、当前源码 hash、命令、6/28/15 **全部**叶 ID/原始报告；旧漏/多/skip/重复、错命令、漂移负控保留。A1/A2 各一个不同物理文件；按最终测试字节重新单文件实跑和登记。A2 的 `build-code-test-registry.test.mjs` “恰三目标/[6,15,28]”正控须合法窄改为旧三份逐个不退化、新两份逐个取真实报告、五份目标唯一，并先保留旧字节与有意义 RED。同一目标 GREEN 和相邻旧合同都要核，不能仅改计数。登记的 `npx vitest run ...` 是规范命令文字，真实 runner 的 Node+仓库 Vitest CLI/argv 要分别核，不作字面字符串相等。

## 最小可实施许可与阻断

顺序：材料 owner 先修现行 spec/P8/P9/P10 并取得异源审查；P8 owner 才在唯一 catalog 加两个 `not_yet_observed` case 及现有来源绑定测试的目标 RED→GREEN；P9 owner 独立按最终实报扩唯一 registry、窄修其自测并保留旧负控；P10 owner 最后在现有 `case-reconciliation.mjs` 加两例只读 reader 和 `partial` 诊断，以互相矛盾的 Git/Task/报告/ref/hash/argv 输入验证 fail closed，并由另一上下文审查代码。正式 CARD-04 Task 新快照实跑与逐 AC 事实另核。

**当前阻断“已通过”声明的实物缺口**：A1 当次返回数组没有持久绑定；A2 全项目测试入口没有独立发现；P10 当前 `partial` 提前返回；逐 AC 真实效果事实和本次官方消费尚缺；其它未映射变化仍未知。不能用 7/7、8/8、目录五目标或旧快照数字替代这些证据。若某一步需要新 schema/公共字段/持久文件或越过现有写面，先停该步并补材料、owner/consumer 与 move-map 登记；不要暗中扩大写面。

审查输入：上述材料提案、A1/A2 效果 reader 独立审查、P9 真实叶独立复核；当前 `decision-log.md`、`spec.md`、P8/P9/P10、catalog、registry、两份候选测试、`business-case-catalog.test.mjs`、`business-case-source-binding.test.mjs`、`build-code-test-registry.test.mjs`、`targeted-capture.mjs`、`case-reconciliation.mjs` 与 move-map。没有执行测试。
