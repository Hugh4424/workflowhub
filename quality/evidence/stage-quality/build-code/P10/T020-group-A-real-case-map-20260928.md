# P10/T020：A 组七个产品路径的真实用例映射（只读调查）

## 结论

这七个路径不能当作“框架代码”排除。当前 P8 目录只有三例，触发路径均不含这七个；P9 独立测试登记只含那三例的 49 个叶测试。当前同一 Task 的选择因此仍会列出 A 组路径为未映射，整体为 `unavailable`。下面按五条**候选业务规则**归属七路径，供 P8 规则 owner、P9 独立测试 owner 分别审定；这不是新增的已生效 case，也不证明任何业务效果。

真实调用链：`tools/cli/stage-runtime.mjs` 的私有 `capture-tests` handler → `capture.mjs#runCapture` → 当前 Task 的测试回执 writer；固定命令时，外层 `capture.mjs` 从认证 Task 读执行前变化和独立 registry，选例并启动 `targeted-capture.mjs` 子进程；子进程重开 Task/worktree、重新读变化/目录/registry，调用 `case-selection.mjs`、`targeted-runner.mjs`，写逐例原始报告和 manifest；外层重读原件，调用 `case-reconciliation.mjs`。`run` 阶段结果若要称逐例完成，还需实际消费指定回执、逐 AC 质量事实和本次阶段行。纯对象的 `selectAffectedCases` 和 `reconcileCases` 不是独立来源。

## 建议的最小五例

一个目录 case 只能绑定一个 phase、一份执行目标。以下五种失败各有不同的生产责任和目标，不能只靠一个“全链绿”合并。`capture.mjs` 是多个规则的共同入口，触发关系可以重叠；七个路径至少在下表出现一次。

| 候选规则 / 真实来源 | 七路径中的触发；实际消费者 | 应独立看到的成功 / 失败 | 候选目标与旧回归 |
| --- | --- | --- | --- |
| A1 当前 Task 从真实起点计算变化，P9/T018，`phases/P9.md`，AC-32 | `change-scope.mjs`、`capture.mjs`；固定 capture、selector 读取 `snapshot_tree/source_digest/changed_paths` | 从认证 bootstrap 起点至当前 Git 快照，已提交、暂存、脏、未追踪、改名两边、删除均出现；错 Task、缺/改 bootstrap、旧快照必须 `unknown_change_scope`，不能生出空变化通过 | 新目标 `build-code-preexecution-source.test.mjs`；旧回归 `build-code-change-scope.test.mjs`、`diff-evidence-capture-point.test.mjs`。 |
| A2 独立测试库存与实际报告双向一致，P9/T019，`phases/P9.md`，AC-30（也是 AC-32 输入） | `test-asset-inventory.mjs`、`capture.mjs`；固定 capture、selector 和对账 reader 读取登记的目标/hash/完整叶 ID | 当前 worktree 中登记文件的真实字节和命令匹配；报告没有漏叶、多叶、跳过、重复或错文件；坏 registry、源码漂移、漏/多叶须失败，不可把三例有限库存冒充全项目 | 候选 `build-code-test-registry.test.mjs`；旧回归 `build-code-test-inventory.test.mjs`。现有 registry 测试硬断言“只有三目标”，扩库前须冻结原件并按新增真实资产修订；不可删此负控。 |
| A3 只选受影响 case，保留所有未映射路径，P10/T020，`phases/P10.md`，AC-32 | `case-selection.mjs`、`targeted-capture.mjs`；固定 capture 的内外两次选择及逐例 runner | 独立读 Git 差分后，仅真实触发/相关回归进入候选；有未知路径时原样列出，整体 `unavailable`；全部未知时不启动测试。错 Task/树、缺关联 case、退役 case、登记源不匹配不得 `selected` | 候选 `build-code-case-selection.test.mjs`；相邻实入口回归 `build-code-targeted-capture.test.mjs` 的 mixed/unknown/foreign/stale 场景。旧 `alpha/beta` 动态夹具仅证算法，不是 CARD-04 业务效果。 |
| A4 选中目标按固定、安全命令真实执行并保存失败原件，P10/T020，`phases/P10.md`，AC-32 | `targeted-runner.mjs`、`targeted-capture.mjs`、`capture.mjs`；固定 capture 外层 receipt、子进程及 Task 原始 reporter 消费 | 逐例真实启动、安全路径/唯一目标/完整叶/原始输出与退出码均可从 Task 复读；首例通过、次例失败时保留两例原件且整体失败；危险命令、缺目标、重复目标、跳过、输出过量、超时及存活孙进程不能算通过 | 候选 `build-code-targeted-capture.test.mjs`；旧回归 `build-code-targeted-runner.test.mjs`、`test-capture-reuse.test.mjs`、`official-component-receipts.test.mjs` 中测试进程清理场景。 |
| A5 当前运行逐例核报告、真实效果和本次消费，P10/T021，`phases/P10.md`，AC-33 | `case-reconciliation.mjs`、`capture.mjs`；同次 readback、正式 `run` 和 verify-code 只读抽查 | 重读外层 receipt→output→manifest→逐例 raw，目标、叶、Task/树/材料/hash 一致；另从当前质量事实与独立业务来源看效果，并绑定本次 `run` 真正使用的 receipt/阶段行。绿测试但无效果、旧回执、错 AC、缺 raw/质量事实/本次消费均保持 `unknown/unavailable` | 候选 `build-code-case-reconciliation.test.mjs`；相邻回归 `build-code-targeted-capture.test.mjs` 的 outer readback 和 `tests/integration/vnext-official-stage-run.test.mjs`。 |

以上五例的业务观察不能只读各自单元测试的 `expect`：A1 可独立读 Git bootstrap 与 diff；A2 可独立读测试源、registry 和原始 reporter；A3 可独立对照原始 diff/目录和实际启动列表；A4 可读真实子进程及 Task 内容寻址原件；A5 须有当前逐 AC 质量事实、独立效果 reader 和本次阶段行。A5 目前是最大缺口：现有三个种子只覆盖 AC-26/27 的局部来源，不能代替 AC-33 的修复后效果，也没有完整的当前 Task 本次消费链。

## 精确执行目标与叶身份边界

候选命令均须由独立 P9 owner 登记为 `npx vitest run <target> --reporter=json`，工作目录为认证 worktree；`target` 分别为 `tests/contract/build-code-preexecution-source.test.mjs`、`tests/contract/build-code-test-registry.test.mjs`、`tests/contract/build-code-case-selection.test.mjs`、`tests/contract/build-code-targeted-capture.test.mjs`、`tests/contract/build-code-case-reconciliation.test.mjs`。现行固定 runner 会核**该文件全部实际叶 ID**与 registry 的完整集合，不能只登记下列重点叶：

| 候选 | 源中可定位的完整重点叶 ID（`文件 > suite > 测试名`） |
| --- | --- |
| A1 | `tests/contract/build-code-preexecution-source.test.mjs > ORACLE-P9-PREEXECUTION: current change source before test capture > reads the authenticated task start and committed, dirty, staged, untracked, rename and delete paths before a receipt`；同 suite 的 `does not accept another task's workspace`、`does not invent a task start when the authenticated bootstrap record is missing`。 |
| A2 | `tests/contract/build-code-test-registry.test.mjs > ORACLE-P9-REGISTRY: source-owned tests versus actual runnable leaves > reads an authenticated private registry and accepts exactly the two passing Node TAP leaves`；同 suite 的 `reports missing leaves instead of certifying the reporter`、`reports extra leaves instead of certifying the reporter`、`reports skipped leaves instead of certifying the reporter`。 |
| A3 | `tests/contract/build-code-case-selection.test.mjs > P10 pre-run registered case selection > selects an affected candidate from P9's pre-run registry without claiming a test ran`；同 suite 的 `keeps known cases and each unknown path visible without calling partial coverage selected`、`keeps an entirely unknown change unavailable with no runnable case`。 |
| A4 | `tests/contract/build-code-targeted-capture.test.mjs > P10 fixed targeted capture > runs known cases for mixed changes but reports every unknown path and no overall pass`；同 suite 的 `preserves first pass and second real failure raw and stderr through the failed outer receipt`、`releases a TERM-resistant grandchild and its listening port on outer timeout`。 |
| A5 | `tests/contract/build-code-case-reconciliation.test.mjs > ORACLE-P10-CURRENT-CASE: outer receipt and per-target reporter are separate facts > reads all bound reporter leaves, then keeps the missing business effect unknown`；同 suite 的 `does not turn an older matching receipt into a new run through a caller dispatch claim`；`tests/contract/build-code-case-reconciliation.test.mjs > ORACLE-P10-T021: explicit current run consumption source > reads only this run's receipt and exact AC fact, then rejects a swapped locator, missing AC and replaced row`。 |

上述为准确的**重点 ID，不是全叶清单**；本轮没有执行测试或取得独立完整 reporter 目录，所以完整集合、测试文件 SHA、runner 版本与实际通过状态均未认证。P9 需要从真实 test runner 另盘点每个文件的完整 `full_id`、skip/todo、命令与源码 hash，做漏/多叶双向比较；P8 才能写同集合的期望，且两者不得互抄。当前 `docs/quality/test-asset-registry.json` 只登记三例，以上五目标均未登记。即使补齐五例，现有三例的源码及其他 209 条未映射路径、目录和 registry 自身的变化仍要按当前快照重新选例，不能凭本备忘录宣布全量覆盖。

## 可失败负控和下一步

1. 留一个真实有调用者的 A 组改动路径不登记：selector 必须列出原路径并使整体 `unavailable`；不能过滤为“内部文件”。
2. 同一源树换 Task/材料/registry hash，或运行中修改源码：固定 capture/对账必须拒绝旧 receipt；子例实败、0 叶、漏叶、跳过、重复文件、错误报告 hash、外层超时后孙进程残留均不能升级为通过。
3. runner 全绿但当前逐 AC 原件不存在、效果与规则相反或正式 `run` 没有消费指定 receipt：A5 仍 `unknown/unavailable`；必须保留旧失败，修复后在新快照重选、重跑、逐例重读。

本轮只读 `P10/T020-26-code-path-mapping-plan-20260928.md`、当前 P8 目录/P9 registry、七个模块、当前 P9/P10 材料、CLI 调用边及相关定向测试源码；仅新增此调查备忘录。未改目录/registry/代码/Task facts，未跑测试，也未产生质量通过结论。
