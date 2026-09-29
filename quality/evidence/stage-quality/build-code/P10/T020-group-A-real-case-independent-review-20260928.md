# P10/T020 A 组七路径候选业务用例：独立只读复核

## 裁决

**五项可作为分工明确的候选规则，当前一项也不能直接登记为已生效、已通过的真实业务用例。** 七条路径均确有产品调用者，不应因“内部代码”而过滤。现行目录只有三例、登记库存只有三个目标；五个候选目标未登记，完整 runner 叶身份尚未独立枚举，当前 Task 的 209 条未映射路径不会因本组方案自动消失。该备忘录不签发质量通过结论。

读到的调用链成立：`stage-runtime.mjs` 私有 `capture-tests` → `capture.mjs#runCapture` → 受信测试回执；固定命令时，外层先读当前变化、目录和 registry，子进程 `targeted-capture.mjs` 重读三者后逐例调用 selector/runner，写 manifest 与原始报告，外层再核对。`capture.mjs` 是 A1/A2/A3/A4/A5 共用入口，可以出现在多个 `change_triggers` 中；一次源码变化可以选择多例，不能把它只归给其中一例。`targeted-capture.mjs` 拒绝两个 case 使用同一物理测试文件，故五例若落地，五个执行目标必须互不重复。

## 分项复核

| 候选 | 可证实的调用边与用户可观察结果 | 独立反例和现有限制 | 裁决 |
| --- | --- | --- | --- |
| A1 真实变化范围 | `change-scope.mjs` 的结果被 `capture.mjs`、固定子进程及 selector 消费；漏掉已提交、暂存、脏、未追踪、改名或删除路径会让应跑的检查被跳过。`build-code-preexecution-source.test.mjs` 用真正的临时 Git/Task bootstrap 核变化，且包含错 Task、缺或篡改 bootstrap。 | 现有目标主要证明“变化被算出”，没有单独证明该变化最终被选中、执行及在当前 CARD-04 上生效。把此目标升为整条 AC-32 业务通过会过度推断。保留 `build-code-change-scope.test.mjs`、`diff-evidence-capture-point.test.mjs` 中受影响旧回归，不能仅替换它们。 | **先可登记的有限规则候选**，效果观察需独立 Git diff 对照实际选择和 Task 原件。 |
| A2 库存与报告双向一致 | `test-asset-inventory.mjs` 给外层和子进程读取登记资产，真实错字节、漏叶、多叶、跳过会令测试身份不可用；这是 AC-30 可观察的“漏测不能冒成覆盖”。`build-code-test-registry.test.mjs` 有真实 Node TAP 叶的正反例。 | 该测试首例目前**明确要求恰好三目标和 6/15/28 叶**。新增资产前须保存旧源码、原目标与当时结果，并把正控改为“既有三目标仍在且 hash/身份不退化，新增目标由独立发现核全”；保留缺/多/跳过、重复、错命令、漂移反例。不能简单删整项或仅改数量。旧 `build-code-test-inventory.test.mjs` 的 runner 解析回归仍需按影响核。 | **先可登记的有限规则候选**，但 registry 扩库与冻结断言合法修订是硬前置。 |
| A3 正确选例 | `case-selection.mjs` 在外层及子进程都被调用；选错、漏旧回归或把未知路径吞掉，会改变实际启动目标。当前实现对部分未知保留路径并让总体 `unavailable`；全未知不启动。`build-code-case-selection.test.mjs` 有真实 Git 夹具及纯对象反例。 | 纯 `selectAffectedCases` 对象返回不是认证结果；须对照当前 Git 差分、目录、registry 和子进程 manifest 中实际 `selected_case_ids`。旧 `build-code-targeted-capture.test.mjs` 的 mixed/unknown/foreign/stale 场景也属相邻回归。未登记路径必须仍显示原名。 | **可设计为独立用例，尚未证实完整业务效果。** |
| A4 安全实跑 | `targeted-runner.mjs` 由固定子进程逐例启动，返回 exit、完整叶和 raw；`targeted-capture.mjs` 写成功或失败原件。`build-code-targeted-capture.test.mjs` 已含混合变化、第二例实败和 TERM-resistant 孙进程超时情形。 | 一份测试文件的绿灯不等于当前 Task 上按当前目录选出的真实执行。须核 outer receipt、每例 raw/stderr/exit、完整叶和进程清理；旧 `build-code-targeted-runner.test.mjs`、`test-capture-reuse.test.mjs`、`official-component-receipts.test.mjs` 的受影响负控不能遗漏。 | **可设计为独立用例，仍需当前同版实跑。** |
| A5 逐例对账及修复后效果 | `case-reconciliation.mjs` 可重读回执→output→manifest→逐例 raw，且有本次 `run` 消费来源验证入口。报告/质量事实错绑会导致“测试跑了”冒称“功能好了”。 | **阻断生效**：`readCurrentEffect` 当前只为三个既有 seed 的部分结果写了特定判断；对任意新 A1–A5 ID 落到 `independent_effect_reader_unavailable`。它还要求逐 AC 质量事实指向指定回执；当前 Task 仍缺真实逐 AC 业务效果及完整失败→修复→新快照链。候选测试中的 runner/夹具并非 AC-33 的独立效果来源。 | **目前只能保留候选，不得标业务通过。** |

## 完整测试身份与目录约束

- 候选备忘录列出的是源码中可见的**重点叶名**，不是 Vitest 对各文件实报的完整 `full_id` 集合。`it.each`、suite 标题、skip/todo 和 runner 版本均会影响身份。此次未运行 runner，也未取得这五文件的独立完整 JSON reporter；不能把那张重点列表复制成 registry 或 P8 期望。
- 先由 P9 资产 owner 用固定的单文件 Vitest JSON 命令逐个盘点五文件的全叶 ID、状态、源码 hash、命令和 runner 版本，并对原报告双向比较；P8 规则 owner 独立核非测试来源、消费者、风险、变化触发、正反观察，再登记预期；两边不得互抄。P8 现行 `business-case-source-binding.test.mjs` 只锚定旧三例，新例要有等价来源/版本错绑负控。
- `business-case-catalog.json` 的 `evolution.phase_obligations` 目前仍把 P9/T018、T019 和 P10/T020、T021 标为 `not_done`；其中 T018、T019、runner 的旧候选目标分别为 `build-code-change-scope.test.mjs`、`build-code-test-inventory.test.mjs`、`build-code-targeted-runner.test.mjs`，与 A1/A2/A4 这份提案的目标**不同**。`business-case-catalog.test.mjs` 硬核这七条 obligation 的 target/status/consumer。若改目标，须先由 owner 对照旧测试及真消费者决定是补充还是替换，保留旧失败及可追溯身份，再修订断言；不能改 JSON、改断言一同求绿或把 `not_done` 机械翻成 `active`。
- `business-case-catalog.test.mjs` 没有对总 case 数硬设“恰三例”，它核旧三例与目录内每例基础结构。真正“恰三目标”的冻结断言在 `build-code-test-registry.test.mjs`，且 registry `scope_note` 也写了“Only three ...”。扩库时两处均须按真实资产更新；`uncharted_legacy/outside_scope` 仍为 `unknown`，不得写项目已全覆盖。

## 可实施最小顺序及仍未解决的阻断

1. **第一批只处理 A1/A2 的来源、独立效果合同及测试库存**：两者非测试来源可在 P9/AC-30、AC-32 找到，调用者是现有固定入口，观察可以分别从当前 Git 原始差分和真实 runner 报告取得。先冻结旧目录/registry/目标测试字节与旧失败，再由不同 owner 审定两条来源与完整叶身份、修订三目标冻结正控并保留负控；写入后的选择仍须因剩余未知路径为 `unavailable`。这是可实施的**有限子集**，不是 A 组或 P10 完成。
2. A3/A4 可在同一规则审核后逐项接入，但必须用当前 Task 的真实 diff→实际选择→子进程/Task 原件证明；先查目标测试的真实叶集合与 P8 关系。`capture.mjs` 同时触发多例，五目标不能重复。
3. **A5 先解产品来源缺口**：由 P10/T021 明确新规则的独立效果 reader、逐 AC 真实生产来源、质量事实与指定 receipt 的绑定，并做失败→同 Task 修复→新源码快照复测；只改目录/registry 无法过当前 reader。P8 目录不是业务效果的生产者，不能在其中写一个“已观察”字符串顶替原件。
4. 本组七条全映射后，仍需重新读取**执行当时**全部变化，处理 B/C/D 组、测试/材料及其它未映射路径；先前 218/209 是旧快照诊断，不是当前固定分母。留一条真实有调用者但未登记的 A 组路径做反例，总体须继续 `unavailable` 并列出原路径。

本复核只读当前材料、目录、registry、调用边与定向测试源码；未运行测试，未改业务目录、registry、代码、材料或 Task facts，亦未生成正式阶段结论。
