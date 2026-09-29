# P10/T020：A1/A2 真实效果读取设计（只读）

## 本轮裁决

可先设计两条**有限**业务 case，但当前不能把它们登记为已生效或已通过。当前目录仍只有三例，独立测试登记仍只有三目标。A1/A2 的候选测试文件未登记完整实报叶；CARD-04 Task 尚无与这两例绑定的固定入口原始报告和逐 AC 业务事实。现有 `case-reconciliation.mjs#readCurrentEffect` 只特判旧三例中的两个，对新 ID 返回 `independent_effect_reader_unavailable`。即使将 case/目标写入 JSON、测试变绿，也不能得到独立业务效果结论。

本设计依据当前 `phases/P8.md`、`P9.md`、`P10.md`、`spec.md` 的 FR/AC-30/32/33，现有 `business-case-catalog.json`、`test-asset-registry.json`、P9 两个 reader、P10 固定入口及原始 Task 回执结构。旧 `T020-group-A-real-case-map-20260928.md` 是候选关系；其独立复核明确指出 A1/A2 效果和完整叶身份缺口。当前已见的 218 条变化、209 条未映射属于一次旧快照，不是接下来执行的固定分母。

## 两条候选规则与实际调用边

| 候选稳定 ID | 非测试规则、唯一目标 | 真实消费者与变化触发 | 有限业务效果 |
| --- | --- | --- | --- |
| `CARD04-AUTHENTICATED-TASK-CHANGE-SCOPE`（A1） | `phases/P9.md` T018、FR/AC-32；目标 `tests/contract/build-code-preexecution-source.test.mjs` | `capture.mjs#runFixedTargetedCapture` 与 `targeted-capture.mjs` 在执行前调用 `change-scope.mjs#capturePreExecutionTaskChangeScope`，再交 `case-selection.mjs`；触发至少 `workflows/build-code/change-scope.mjs`、`workflows/build-code/capture.mjs`、`phases/P9.md`。`capture.mjs` 与其他 case 共用，允许同时触发多个 case。 | 对认证 Task 启动 commit 与执行快照的原始 Git 差分，不漏已提交、暂存、脏、应纳入的未追踪、改名两边和删除；失败或错身份不产空集通过。 |
| `CARD04-INDEPENDENT-TEST-INVENTORY`（A2） | `phases/P9.md` T019、FR/AC-30；目标 `tests/contract/build-code-test-registry.test.mjs` | `capture.mjs` 和 `targeted-capture.mjs` 读取 `test-asset-inventory.mjs#readCurrentTestAssetRegistry`，后者由独立测试维护者从 `docs/quality/test-asset-registry.json` 读版本化目标/源码 SHA/完整叶 ID；P10 runner 与对账读取原始报告；触发至少 `workflows/build-code/test-asset-inventory.mjs`、`workflows/build-code/capture.mjs`、`docs/quality/test-asset-registry.json`、`phases/P9.md`。 | 当前**已登记且实际被选中**的目标文件、命令、原始 reporter 全部叶身份与独立 registry 双向相等；漏、多、跳过、重复、错文件/命令、源码漂移不能显示库存一致。未登记的旧测试仍 unknown。 |

两例各占一个物理目标文件；`targeted-capture.mjs` 会拒绝同一物理测试文件给两个 case。P8 owner 要独立核 P9 原文、实际消费者、规则版本和四种场景后才可更新唯一目录；不要从测试名反推规则。`related_case_ids` 不因“都经过 capture”自动互绑。旧 P9 obligation 指向 `build-code-change-scope.test.mjs` 与 `build-code-test-inventory.test.mjs`，新目标是补充，旧目标及受影响回归不能悄悄删除。新 case 的 `source.path` 和规则版本可指当前 P9 材料实字节，但写入时必须重新计算，不能复制本备忘录时点的 SHA。

## A1：当前 Task 上独立重算的判据

1. 用 `TaskHandle` 打开**当前 CARD-04 Task** 和其认证 worktree，直接读 `identity/executions/bootstrap-{taskId}.json` 原字节；核完整 manifest hash、Task/项目、已关闭创建交易、工作树根与分支、启动 commit/tree。独立从 Git 验证该 commit 是回执 `snapshot_commit` 的祖先，`git rev-parse <commit>^{tree}` 与回执 `snapshot_tree` 一致；同时核 Task 当前源码快照、材料版本、目录与登记源和该回执一致。这里不能调用被观察的 `change-scope.mjs` 返回值来当 expected。
2. 对启动 commit 与回执 snapshot commit 单独执行 `git diff --no-ext-diff --name-status -z -M <start> <snapshot> --`；按已审定的 runtime-only/close-sidecar 排除规则解释 NUL 字段，改名同时保留旧/新路径，删除保留原路径。这个“原始 Git 期望集合”与固定入口外层**当次可取得**的 `change_scope.changed_paths/changes` 双向比较，也与独立按 P8 触发关系重算的应选 case IDs、子进程 manifest 的 `selected_case_ids` 和实际报告 target 比对。子进程 manifest 本身未保存 diff 清单，不能把它独自当作变化完整性的证明；`change_scope` 也只是返回投影，并非持久 Task 原件。如果只剩 TaskHandle 和 receipt，reader 可从 Git 原件重算期望选择并核 manifest 的实际选例，但不能追称外层当次返回的完整路径数组已经被持久认证；要主张这一点须在现有受信执行证据内绑定当次返回，不能事后臆造。
3. 正例：当前 Task 若有上述六类实际变化，所有应包含的路径在集合中，A1 被选中且其独有目标真实执行、完整叶报告与登记匹配；不属于变化的路径不凭空出现。反例：换 Task/worktree、缺或篡改 bootstrap、旧回执树、漏 committed-clean 路径、改名只取一边、删除漏记、运行中源码漂移，均为 `unknown_change_scope` / 不一致，不能算 A1 业务效果通过。针对某种变化类型的**正例**只有当前 Task 真有该类型时才能称当次观察；其余类型靠隔离真实 Git 正反例证能力，不能假装当前 Task 已出现。
4. 同一快照读回指定 canonical receipt→output→manifest→A1 raw reporter，逐层核 Task/树/材料/source digest/目录与 registry hash、固定命令、实际 argv、exit、完整 leaf IDs。若仍有其它未映射路径，A1 可留下局部观察，整体选择与 AC-32 仍 `unavailable`；不得因为 A1 局部满足而把 AC-32 写成 `passed`。

## A2：独立登记与原始 reporter 双向判据

1. P9 测试资产 owner 先从仓库**真实测试文件和真实单文件 runner**独立盘点 A1/A2 目标。读当前文件原始字节 SHA、精确 `npx vitest run <target> --reporter=json` 命令及一整份 JSON reporter；要求只有一个实际文件且路径在认证 worktree，`assertionResults` 非空。每叶 ID 按 `<目标相对路径> > <ancestorTitles[0]> > ... > <title>` 组装；`it.each` 展开后的名字也从实际 reporter 取。核 `fullName`、全部计数、退出码、`success`、skip/todo/pending、重复 ID。完整集合不得从 P8 目录或本备忘录的重点测试名复制。
2. 登记后，在当前 CARD-04 Task 的固定入口原始 `quality/evidence/build-code-targeted/raw-{sha}.txt` 中，沿外层 canonical receipt→output→pointer→manifest→每例 case record→原始 reporter 的 ref/hash 读取 A2 及本次其他**被选中目标**。对每个目标重读独立 registry 当前原字节、目标文件 SHA、命令和完整登记叶集合；实报集合与登记集合互减均为空，逐叶 `passed`、exit 0、无 skip/todo/pending/重复。`manifest.reports[].full_ids`、case record observations 和原始 JSON 也须完全相同，不能只信 manifest 自报。A2 自己的测试报告只能证明其测试执行；对其它目标的库存效果要逐份读其它目标的真实报告。
3. 正例：同一 Task/树/材料/目录/registry 版本上的每份**选中**报告满足上述双向判据，且 A2 独有目标已被实际启动。反例：registry 旧 SHA、错命令/错文件、未登记新叶、登记叶未跑、跳过/todo/失败、0 叶、重复 leaf 或报告/record 任一 ref/hash 错，均不认证库存一致。没有运行的登记目标标 `not_run`，不能用已选目标的绿结果代它；仓库其它尚未盘点测试资产及两边均未知的旧业务维持 `unknown`，不能将有限登记说成项目全覆盖。
4. `collectRegisteredTestInventory` 目前能对**单一 canonical receipt**和登记源作双向比较；固定定向入口的每例原始报告由 P10 `case-reconciliation.mjs` 另读。新独立效果读取可以复用其安全解析规则，但必须沿 Task 原件重新读真实字节，不接受 `selection`、测试断言或目录中的 `expected=actual` 文字自证。若将“已发现未登记测试文件”也作为 AC-30 判据，需另有真实测试入口/文件发现与关联列表；现有 reader 没有这项全仓可枚举性证明。

## 最小实施位置与不能偷换的通过条件

- **P8 目录：** 在 `docs/quality/business-case-catalog.json` 增上述两个 case，填真实 P9 source/rule SHA、owner、消费者、触发路径、风险/环境、四场景、`ac_ids`、`execution` 及 `effect_observation`；状态仍是有限 case，观察字段先 `not_yet_observed`。`business-case-source-binding.test.mjs` 需扩新例的当前源码/规则错绑反例。目录不可替 P9 库存自证。
- **P9 registry：** `docs/quality/test-asset-registry.json` 由独立 owner 追加两个互不重复目标的当前 SHA、精确命令、完整真实 reporter 叶 ID 和发现原件 ref/hash，`outside_scope=unknown` 保留。修订 `tests/contract/build-code-test-registry.test.mjs` 中“恰三目标/6、15、28 叶”正控前，先冻结旧测试/登记字节、旧命令/结果；新正控必须保住旧三项各自 hash/ID/身份且独立核新目标，保留漏/多/skip、重复、错命令和漂移负控。不能简单删除断言或只把 3 改 5。旧 `build-code-test-inventory.test.mjs` 按影响跑回归。
- **P10 reader：** 在 `workflows/build-code/case-reconciliation.mjs` 给 A1/A2 各自独立效果分支或受限只读 helper。当前 `readCurrentEffect` 已核当前逐 AC fact→acceptance wrapper→stage-quality 原件与指定 receipt ref/hash，但新 ID 必须另核上述 Git/registry/raw/manifest 判据。事实链与业务观察分开返回；同一 AC 被多个 case 使用时，每 case 要有可核自身观察，不得由一个 AC `passed` 反向证明所有 case。当前 `reconcileCurrentTaskCases` 遇任一未映射路径会先返回 `unavailable`，若要保留 A1/A2 局部观察，最多在这个分支附只读诊断，**整体仍 unavailable**。P10/T021 的当次 `run` 消费绑定、逐 AC 事实生产仍须独立完成，不能借此两分支绕过。
- **定向测试：** 新 reader 测试须让原始 Git/Task 原件与被测模块输出故意矛盾，验证错起点、漏路径、改名/删除、旧树、错 Task、漏/多/skip/重复 reporter、换 ref/hash、两例共用目标，以及“目标全绿但效果错/逐 AC 原件缺/209 其它路径未映射”仍不通过；保留受影响 `build-code-preexecution-source.test.mjs`、`build-code-test-registry.test.mjs`、`build-code-case-reconciliation.test.mjs` 的旧失败与同目标修复后结果。新生产测试文件先经 move-map owner 登记；遵守只跑受影响目标、异源审查。

结论边界：A1/A2 的 reader 即使按此实现并在当前 Task 得到局部正例，只解决 A 组两条有限规则。旧快照的 209 条未映射路径必须在**执行当时**重新计算并逐条处理；未知路径原名保留，整体状态继续 `unavailable`。本轮没有改目录、registry、代码、材料或 Task facts，也没有运行测试或宣称业务通过。
