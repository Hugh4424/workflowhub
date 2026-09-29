# P8/P9/P10 固定执行入口：供 build-plan 作者审定的增量草案

状态：**材料草案，不是已实施事实、获批写集、质量结论或新阶段**。截至本草案，P10 三个定向合同测试合跑为 **26/29，exit 1**。失败项是 `mismatched_snapshot`、`alpha` 和 `beta` 两个合成账户正例；原始命令、文件 SHA 和输出见 `P10-official-gate-current.meta.json` 及相邻 stdout/stderr。不能放宽这三项断言、硬编码夹具值，或把失败写成通过。

## 当前真实接点与缺口

1. Public `verify --action=execute --stage=build-code` 在 `tools/cli/stage-runtime.mjs` 转为私有 `capture-tests`。当前输入白名单只有 `command/receipt_ref/output_ref/timeout_ms`。`workflows/build-code/capture.mjs#runCapture` 调 canonical writer **先执行**命令，随后才从已完成 receipt 计算 `change_scope`；只有内部调用者显式给 `registeredTestIds` 才返回 `test_inventory`。现有 CLI 不提供该列表，官方 P9 receipt 的 `change_scope` 可见，`test_inventory` 不见。这不是固定 P10 业务入口。
2. P8 `docs/quality/business-case-catalog.json` 当前 `.3` 修订有三个有限 CARD-04 case，其 `execution.registered_test_ids` 共 49 个叶身份。它们是**业务 owner 所登记的期望**，不可同时充当独立测试资产登记来源。目录当前只写自然语言场景，没有可执行的、独立读取的效果规则。目录中 `source.revision` 必须对照执行当时真实文件 SHA；若 decision-log、Phase 或规则变更，旧 revision 要作废并由规则 owner 重审，不能仅改 hash。
3. P9 `captureTaskChangeScope({task,workspace,receipt})` 用认证 `TaskHandle`、worktree、bootstrap 起点、当前 Git 快照和**先前已完成**的 canonical receipt；`collectTestInventory({task,workspace,receipt,registeredTestIds})` 读取同 Task receipt/output 并解析完整叶身份。二者具备可复用的真实性检查，但没有预执行快照接口、无生产 registry 提供者。`docs/architecture/test-asset-inventory.md` 是说明，不是已认证机器 registry。
4. P10 `selectAffectedCases` 只比较调用者给的 scope/catalog/inventory；返回 `provenance=supplied_unverified`。`runTargetedCases` 用 `shell:false` 跑受限 Node/Vitest 目标，但返回 `canonical_receipt:false`。`reconcileCases` 读取调用者给的绝对路径，缺 `TaskHandle`、规则版本 reader、canonical receipt reader，最多给 `observed`，不能签业务通过。三模块尚无已证实的生产调用者。

## 建议写入 P8、P9、P10 材料的实施合同

### P8：业务规则和测试资产各有主人

- 在**现有唯一业务目录**为每个拟实际执行的 case 增加经业务规则 owner 审定的 `rule.id/revision` 对应效果合同：输入来源、受控环境、before/after 可读事实、版本化谓词、错误/缺证处理、AC 关联、实际 reader owner。具体字段名、schema 修改和现有三个 case 哪些能升格，由 P8 材料 owner 核实后定；草案不冒称接口已存在。
- `CARD04-DECISION-LOG-CENSUS` 要从认证当前 decision-log 字节独立读出 U/V/R 结构与负控；不能再调用被测 parser 当“独立”效果。`CARD04-ACCEPTANCE-MACHINE-CLASSES` 要有 P7 owner 确认的八类输入/结果表和不同于测试断言的质量事实读取。`CARD04-DEFERRED-ACCEPTANCE-REGRESSION` 当前规则来源指向测试文件，须先找到并绑定独立决策/规格来源。若找不到，保留 `unknown`，不生产 pass。
- 合成的账户取消/余额 `alpha/beta` **不是** P8 三个 CARD-04 case。若要把它们当产品业务正例，先由有权业务 owner 建立真实 case、规则版本、独立账户效果 reader 和隔离环境，再改正例输入并保留旧 RED。不能把夹具自身写的 before/after JSON 或 `balance_*` 字段当独立证明。若该业务并非 WorkflowHub 产品范围，应由材料 owner明确把合成正例换成真实 CARD-04 正例；仍需验证正反两种效果和专属拒绝原因，不得删去正控目标。
- **独立测试登记源目前不存在。** 由项目测试资产 owner 先按真实仓库文件枚举、受影响目标的 Node/Vitest 发现结果、入口命令和完整 leaf ID 建立有限版本化 registry，逐项核 owner/退役/适用环境；与 P8 目录分开维护，不跑无范围全量测试。候选是新增 `docs/quality/test-asset-registry.json`，但文件名/schema/消费者须经 build-plan 审定并先登记 move-map 与职责。P9 每轮从真实 runner output 发现实报叶，再与该 registry 和 P8 期望做双向核对。复制 `catalog.execution.registered_test_ids` 到一个变量、由测试夹具临时给数组，均不算独立来源。未知旧业务与未盘点测试继续为 `unknown`，不能以空库存判无影响。

### P9：在执行前取可信范围，执行后核同一快照

- 在现有私有 build-code 实现内增加一个**只读预执行取值**：接收真实 `TaskHandle` + `openCurrentTaskWorkspace(task)`，复用 `change-scope.mjs` 的 bootstrap 验证和 `captureExecutionSnapshot`，拿起点 commit/tree、当前 snapshot commit/tree/source digest、变化路径。新接口须能在**尚无本轮测试 receipt** 时工作；若现有逻辑不能安全拆出，P9/Task owner 审定窄范围新增函数。不能用当前 HEAD 伪装起点，也不能拿尚未生成的最终 receipt 给自己验自己。
- 预执行取值只供选择和执行，状态为候选/待完成，**不是** canonical 测试 receipt、质量事实或推进许可。若复用上一轮 receipt，必须先证明同 Task、同 worktree、同 snapshot/source digest；旧 receipt 不能跨源码变化复用。
- 固定运行完成后，从既有 canonical writer 获得新的 receipt/output ref/hash，重新读原件，并对照预执行 snapshot/tree/digest、Task id、材料版本、P8 目录 hash、registry revision/hash。中途变更或缺失均 fail-closed 并保留已写原件，下一轮换新 ref；不能在 writer 锁内嵌套 capture。
- P9 的 `collectTestInventory` 应由独立 registry 的认证 reader 供 `registeredTestIds`，而不是外部请求或 P8 目录投喂。实际 reporter 的新增、缺失、跳过、失败、错文件/命令分别报出；P8 关系表只能在它之后做业务匹配。

### P10：私有固定 launcher 与三模块真实调用

- 固定入口属于现有 public `verify --action=execute --stage=build-code` 的**私有执行路径**，或由现有 build-code 调用方使用它；不能增第八类公共命令、stage、gate 或独立账本。候选形态是 `workflows/build-code/` 下一个固定 launcher，由 `capture.mjs` / CLI 当前认证 context 提供 `TaskHandle` 和 workspace；具体导出名、文件名、调用时点须先由 owner 核真实运行路径。外层 canonical capture 目前 `/bin/sh -c`，所以传给它的只能是审定的**字面量固定命令**；动态 case/文件名必须在内层经 allowlist 检查后用 `shell:false` argv 执行，不拼 shell 字符串。不接受用户给的任意工作目录/绝对文件路径。
- 入口顺序固定：① 验 Task/worktree/post 材料身份和 P8 目录/独立 registry 的真实字节、来源 revision、hash；② P9 只读取可信起点及当前快照；③ 从 P8 的变化触发关系选 case 与回归，且由入口**重新读 P9 原件**核对 selector 输入；④ 对每个目标先核 registry 的完整 leaf 集、允许命令和 file realpath，再调用现有 `runTargetedCases`；共享测试文件需一轮执行并给每个 case 单独可验证的 leaf 分区，不能给两个 case 复制同一份“已通过”；⑤ 把 runner 的 argv、exit、完整 leaf/status、原始 JSON/TAP、子输出 hash 和独立效果 before/after ref/hash 通过现有 Task 认证 writer 留在 `quality/tests/` 或必要的 `quality/evidence/`；⑥ 外层 canonical receipt 结束后再次绑定并读取每项，调用扩展后的 `reconcileCases` 给每 case/AC 的事实和限制。旧失败 ref 保留；修复后换新快照、新 receipt、重选重跑，不覆盖旧原件。
- `case-selection.mjs` 可以保留纯函数供测试，但生产 caller 必须把 Task/P9 原件身份与同一快照 inventory 当独立权威再核。当前 `mismatched_snapshot` 冻结反例只篡改**单个调用者对象**，另一个 inventory 没有 Task/receipt/snapshot 身份，纯函数不可能区分另一个有效树与伪造树。材料 owner 应在保留原 RED 和 `invalid_change_provenance` 目标的前提下，把冻结反例改为“有独立认证 receipt/inventory 树，另给篡改 scope 树”；不可按特定树字符串或当前 HEAD 猜错。
- `targeted-runner.mjs` 继续负责不经 shell 的固定目标执行和真实 reporter 叶身份；生产 caller/Task owner负责它的 raw output 与 canonical ref/hash 绑定。`case-reconciliation.mjs` 要停止把任意绝对路径和 `cancellation preserves account balance` 标题当授权：按受控 Task ref 重读 reporter/effect、核 rule revision/source hash/AC/环境/快照，对每 case 的**所有**登记叶检查零叶、漏叶、额外叶、重复、skip/todo/fail 和 exit，按 P8 版本化谓词看独立效果。缺认证或缺业务规则为 `unknown/unavailable`，绝不产 `passed`。

## 写面、归属和退出条件（待 build-plan owner 核定）

| 部分 | 建议 owner / 唯一生产 consumer | 对现有机制的关系 / 删除条件 |
| --- | --- | --- |
| P8 规则效果合同 | P8 业务规则 owner；P10 私有入口消费 | 扩展现有唯一目录，不另建业务目录；目录被审定替代时删扩展字段/reader。 |
| 独立测试 registry | 项目测试资产 owner；P9 inventory reader 消费 | 补当前缺失的独立来源，不从 P8 复制；如现有项目已有权威 registry，先核实并复用，新候选文件不创建；权威来源替代时迁移/删除。 |
| 预执行可信范围 | P9/Task owner；P10 私有入口消费 | 复用 bootstrap/Git snapshot，补 `captureTaskChangeScope` 必须先有 receipt 的时序空位；若 canonical writer 将来提供同等只读预执行事实，则删此私有 helper。 |
| 固定 launcher / 三模块接线 | build-code/P10 owner；现有 verify/capture 路径消费 | 调用已存在 P9/P10 转换，不加公共流程；若 `capture.mjs` 直接承担同一职责可不新建文件。由等效且受审查的唯一入口替代时删除。 |
| 独立效果 reader 与对账 | 各业务规则 owner 给规则，P10 owner 写有限 reader；当前 Task build-code 质量事实消费 | 替代 `case-reconciliation.mjs` 的任意绝对路径/夹具标题逻辑；对应规则退役时连同受控 reader 删除或迁移。 |

具体源写集的候选仅为 `docs/quality/business-case-catalog.json`、经审定的独立 registry、`workflows/build-code/change-scope.mjs`、`test-asset-inventory.mjs`、`capture.mjs`、P10 三模块及**必要时** `tools/cli/stage-runtime.mjs` 的私有转发。现行 P8/P9/P10 Phase 卡不覆盖上述全部写面，须由 build-plan owner 同步 `spec.md` 与 `phases/P8.md/P9.md/P10.md`、冻结测试变更理由及每文件 owner/consumer/替代/删除条件，再进入实施。若确需新生产文件、schema 或持久对象，先登记 `docs/architecture/move-map.json` 和唯一消费方；不触碰 runtime 受保护目录、Task row 或公共输入白名单，除非当前路径实证表明必需并经材料另行界定。

## 有意义的 RED / GREEN 与坏例

1. **材料 RED 保留：** 原 P10 三文件 26/29 原始输出和冻结测试旧字节。新目标若修订，只改不可实现的缺权威输入或错误业务夹具，保留 `mismatched_snapshot`、两类独立效果正例的目标及相应反例；先记录测试 SHA、命令、原始 RED/exit，再实现。
2. **P9 接线 GREEN：** 精确定向跑 P9 两合同及私有入口测试；真实 Task 的 bootstrap 起点、committed/staged/dirty/rename/delete/untracked 当前快照、独立 registry 与 reporter 双向库存同版可回读。坏例：换 TaskHandle、删 bootstrap、旧 receipt、改 source digest、删/加/跳过一个 leaf、registry 与 P8 自证、未映射路径，均明确 fail/unknown。
3. **P10 执行 GREEN：** 在真实认证 Task 上从当前变更只选受影响 case/旧回归，固定命令启动实际子进程，证据含子进程副作用、argv、完整叶、reporter 原件、canonical receipt/output hash；未受影响 case 不执行。坏例：恶意路径无副作用、共享文件不得伪归属、错 tree/规则版/目录 hash/receipt/output hash/leaf/exit 均专因拒绝。
4. **业务对账 GREEN：** 由规则 owner 认可的至少正、反效果样本，独立 reader 读取与测试断言不同的受控事实；正确效果才允许对相关 case/AC 出具受限完成判断。坏效果即使 TAP/Vitest 通过也不通过；无 reader、无规则版本或原件缺失为 `unknown/unavailable`。合成账户 fixture 在获得真实业务来源前维持 RED，不把读到 JSON 就算业务通过。
5. **阶段裁决：** 仅跑受影响定向命令和必要负控，留每 Phase RED/GREEN 原件、独立审查、官方现有路径 receipt 与当前材料修订绑定。局部绿不代表 P8 全量业务覆盖、P9 完整独立库存、P10 业务对账或 CARD-04 总完成。

## 目前还拿不到、必须真实取得的输入

- **P8 效果规则/reader：** 找到 P6/P7 决策和实际消费者，请各规则 owner 定稿；对没有独立来源的 case 保持 unknown。账户夹具不属于本卡业务，不能自行升格。
- **测试 registry：** 由测试资产 owner 对真实仓库受影响文件逐项盘点，以每个目标完整的 runner 发现结果签版本及命令，单独维护；未盘点范围保持 unknown，不跑无范围全量测试。P8 目录内 49 个 ID 只是待核期望。
- **认证预执行快照：** 从本 Task 的 bootstrap 身份和当前 workspace/Git 读取；不是用 `node --version` receipt 或目前的 HEAD 倒填。先前 receipt 仅同源码快照才能作时序桥。
- **生产消费者与 canonical 逐例原件：** 要在现有 verify/capture 真调用内补齐；当前三个 P10 模块只有测试 import，`runTargetedCases` 的内存结果不等于认证 Task 事实。

因此本草案只能供 build-plan owner 修订边界；在真实输入、当前材料授权、定向验证和独立审查完成前，P10 仍是 **未完成**。
