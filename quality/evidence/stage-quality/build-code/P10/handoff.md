# P10 build-code handoff — T020/T021

状态：局部实现和定向负控已落盘；**AC-32、AC-33 与 P10 跨 Task 旅程均为 `not_done/G2`**。此文只汇总已有原件，不是官方 Task receipt、独立质量 verdict 或业务通过证明。

## 当前实施与原件

| 边界 | 已实现、已观察 | 原件及限制 |
| --- | --- | --- |
| T020 选择 | `case-selection.mjs` 按提供的变更范围、P8 case 关系和 P9 runnable inventory 扩展受影响 case/关联回归；缺目标、重复/缺失 leaf、未映射路径、冲突的范围/库存字段拒绝。纯对象输入仍为 `supplied_unverified`，无法独立认证 Task 起点、Git snapshot 或 receipt。 | `T020-implementation-evidence.md` 与 `T020-{red,final}.raw.txt`；选择器冻结测试现为 6/7，剩余 `mismatched_snapshot`。 |
| T020 runner | `targeted-runner.mjs` 将安全相对测试路径变为固定 Node/Vitest argv，以 `shell:false` 实跑，核 reporter 的文件、完整 leaf ID、计数、状态、exit 与输出 hash；拒绝路径逃逸、错命令/身份、零测试、失败、skip/todo、abort/timeout。返回 `canonical_receipt:false`。 | `T020-vitest-runner-evidence.md`、`T020-vitest-runner-final.meta.json`、`T020-probe-final.stdout.txt`；冻结 runner 9/9。真实 P8 三条测试文件当时给出 6+28+15=49 个 passed runnable ID，逐项等于目录登记；该 direct probe 用目录 revision `.2`。P8 的 `T017-source-fix-evidence.md` 证明 revision `.3` 仅修第三条来源/规则，保留三个 target 与 49 IDs；这不等于在 `.3` 下重新执行了 direct runner。 |
| T021 对账 | `case-reconciliation.mjs` 核选择项、逐 AC、TAP 身份、report/ref/hash、before/after 效果文件与明确的夹具矛盾；原因码负控 11/11。有效夹具仅给 `observed/unauthenticated_business_oracle`，不签发 `passed`。现接口按一 case 一条 Node TAP observation 核对，不能直接消费 P8 的多 leaf Vitest 结果。 | `T021-implementation-evidence.md`、`T021-{red,final}.raw.txt`、`T021-oracle-design.md`；冻结 11/13，两个业务正例仍 RED。 |

## OCR finding 的后续修复

- `F-9e7c4ea5b6ed`（跨到 P10/T020）：此前 Node TAP skip/todo 误归 reporter 身份，且非通过报告无逐测试诊断。`T020-nonpassing-red.meta.json`/`.stdout.txt` 保留 RED exit 1；`T020-nonpassing-final.meta.json`、`T020-nonpassing-final-probe.stdout.txt` 保留 GREEN exit 0。当前有效非通过报告返回 `observations=[]`，真实状态只在 `diagnostic_observations`，每项 `diagnostic_only:true`、`canonical_receipt:false`；错身份/零测试不造诊断身份。修后冻结 runner 9/9、语法 exit 0。
- `F-02b644404ec7`（跨到 P10/T021）：此前选择 `[A]`、合法 A 加唯一额外 B 时末尾数量分支误报 `duplicate_runner_identity`。`T021-unselected-observation-{red,green}.raw.txt` 和同名 `.meta.txt` 保留 exit 1→0；修后 B 为 `runner_identity_mismatch`、entries 空，真正重复 A 仍为 `duplicate_runner_identity`，两者均无 passed entry。`T021-unselected-observation-evidence.md` 给源码/测试/输出 SHA；冻结仍 11/13、语法 exit 0。旧 P8 OCR result 与当前修后源码不是同一 snapshot，不能用旧 result 作修后 verdict。
- `F-15099745c7b1`（P9 OCR 发现、归 P10/T020）：[共享目标定向原件](T020-shared-target-evidence.md)在修前真实 P8 目标两 case 时观察到错误 `completed/12 observations`；修后于任何子进程前拒绝重复实路径，探针 exit 0、`unavailable/reporter_identity_mismatch`、0 observation，冻结 runner 9/9、语法 exit 0。独立只读复核确认能阻止假归属；合法共享文件的逐 case leaf 分区仍需独立登记和新合同。P9 OCR 绑定修前快照，不是修后质量结论。

## 最新三文件 L0 与三个剩余 RED

精确命令：`npx vitest run tests/contract/build-code-case-selection.test.mjs tests/contract/build-code-targeted-runner.test.mjs tests/contract/build-code-case-reconciliation.test.mjs`。`P10-L0-current-20260926.meta.json` 绑定 CWD、HEAD/tree、六个源码/测试 SHA、stdout/stderr SHA，exit **1**；`P10-L0-current-20260926.stdout.txt` 为 **29 collected、26 passed、3 failed**（selection 6/7、runner 9/9、reconciliation 11/13）。

1. Selection `mismatched_snapshot`：夹具只改调用者提供的 `snapshot_tree` 为另一个有效树；纯对象 selector 无独立 Task/Git/receipt 读取权，不能识别该一致伪造。不能用字符串启发式或一律拒绝合法快照换绿。Owner：P9/Task 起点及认证来源 owner，与 P10 消费者一起接入可信预执行快照校验。
2. T021 alpha 正例：测试拥有的取消 TAP 名称和 before/after 夹具可核结构与局部矛盾，但缺独立版本化业务规则、效果读取器、Task/Phase/AC 来源绑定及 canonical receipt；要求 `reconciled`/`passed` 仍 RED。Owner：P8 业务规则 owner 确定 oracle，P10 对账消费者认证并执行。
3. T021 beta 正例：与 alpha 同一根因；另一个夹具不增加独立业务权威。Owner 同上。保留两条旧失败，不把 `observed` 改名为 `passed`。

## 接线与下一步

`selectAffectedCases`、`runTargetedCases`、`reconcileCases` 当前只是 importable seams；`workflows/build-code/SKILL.md` 指示 agent 使用固定可信命令，**尚无实际固定 launcher 或 build-code 官方消费者**。P10 owner 应在现有 Task 执行链接入固定命令：先由 P9/Task owner 提供认证 bootstrap 起点与当前快照的只读预执行来源，再按当前 P8/P9 revision 自动选 case，用受控 argv 实跑，最后让 canonical Task writer/reader 绑定外层命令、快照、原始 reporter/ref/hash、逐 leaf 身份与 receipt。现有 capture 外层使用 shell，故只允许字面量固定命令，动态测试路径须留在内层已验证 argv；不要在 receipt 写锁中嵌套 capture。P8 规则 owner 还需提供独立、版本化的效果谓词和效果读取路径，P10 才能逐 case/AC/Task/Phase/snapshot 对账并保留旧失败→同任务修复的新原件。设计边界见 `T021-oracle-design.md`。

真实 UI/服务适用性与浏览器原件仍未建立；由对应产品/UI consumer owner 确认是否适用，适用时按 P10 Phase 卡的隔离浏览器路径实测，不能将未清查写作 N/A。以上来源、launcher、receipt、业务 oracle、必要 UI 和跨 Task 旅程缺失期间，AC-32/33 保持 `not_done/G2`；局部 26 pass 只说明列出的定向断言。
