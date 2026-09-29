# P10/T020 A1/A2 效果读取设计：独立只读审查

## 裁决

**可按有限范围实施 A1/A2；目前不能登记为业务效果已通过，更不能据此签 AC-30/32/33 或 P10 完成。** 两条候选都有非测试规则和真实消费者：A1 由固定测试入口消费认证 Task 的变化范围，A2 由同一入口消费独立登记的目标与原始报告。两个目标文件不同，符合固定子进程拒绝重复物理目标的约束。设计明确保留未映射变化、未盘点旧业务和未运行目标为未知，方向正确。

## 实施前须补的边界

1. **A1 的“执行当时完整变化清单”没有持久原件。** `capture.mjs` 返回 `change_scope.changed_paths/changes`，但 canonical 测试 receipt 不含这两个数组；子进程 manifest 只保存已选 case、快照和报告。只凭 TaskHandle、receipt 和 manifest，可从 bootstrap 与原始 Git diff 独立重算**当前同一快照应测路径及应选 case**，并检查实际启动是否遗漏；不能倒推当时外层确实返回过一份完整数组。若要证明返回值本身，需在当次调用把它与指定 receipt/快照一起绑定，或在既有受信执行原件中持久保存；只改 `readCurrentEffect` 的返回词句不足。当前 `readCurrentEffect` 也没有收到 `change_scope` 参数。正负控应分别断言“重算选择一致”和“外层当次数组被绑定”，不能把前者冒称后者。
2. **A2 只对已登记、已选且实际运行的文件做完整叶对账。** `readCurrentTestAssetRegistry` 当前只遍历 registry 自列目标并核其源码 hash；`collectRegisteredTestInventory` 只比较一份指定 receipt。它们不枚举项目其余真实测试入口，无法发现 registry 与目录共同漏掉的文件/业务。设计已要求 `outside_scope=unknown`，必须保持；若称“已发现但未登记的测试目标也被找出”，还需独立的 Git/package/Vitest/Node 入口发现及未关联清单。这是 FR-30 全范围的真实缺口，不能通过把三目标改五目标解决。
3. **当前读取路径不会执行新增效果分支。** `reconcileCurrentTaskCases` 在 `partial`（存在未映射路径）时，读完 receipt/raw 后立即以 `unmapped_changed_path` 返回；`readCurrentEffect` 在其后才逐 case 调用。把 A1/A2 逻辑仅加进 `readCurrentEffect`，当前这类真实快照仍不会观察到效果。若需要局部观察，增加只读、逐 case 的诊断字段并保持整体 `unavailable`；不可让诊断改变正式状态或绕过逐 AC 事实链。此分支还须明确同一个 AC 被多个 case 共享时每个 case 的独立观察，不能由一个 AC 通过反推两例都通过。
4. **来源需锚回原需求。** `phases/P9.md` 的 T018/T019 和 spec FR/AC-30/32 支持这两条有限规则，但 P9 只作为计划卡，不足以单独证明原需求→规则关系。P8 owner 应独立读 `decision-log.md`、`spec.md` 的原需求及 FR/AC，再定 `source.path` 与规则文件，并核来源文本、真实消费者和四场景；不要只把 P9 文件 SHA 填到 source/rule 两栏，或从测试名反推规则。`business-case-source-binding.test.mjs` 需对新增 ID 固定独立来源标记、错来源和旧版负控。
5. **“精确命令”须区分登记文字和实际进程。** Registry 写的是 `npx vitest run <target> --reporter=json`，固定 runner 实际用受信 Node 可执行文件启动仓库解析到的 `vitest/vitest.mjs`，argv 为 `[cli, "run", target, "--reporter=json"]`。A2 读者应分别核登记命令的规范形状和真实 argv、CLI 解析路径、目标物理文件；不能把两种字符串要求字面相等。现有 `case-reconciliation` 对报告 argv 只检查包含目标和 reporter 标志，新增效果 reader 需补足精确身份反例。
6. **正式逐 AC 效果源仍缺。** 当前 `readCurrentEffect` 先要求同 Task/树/材料的唯一 AC 质量事实、验收包装、内部证据及指定 receipt ref/hash；A1/A2 的原始 Git/runner 观察不能替它们生产这些事实。当前 Task 未见两例对应的固定入口成功原件及逐 AC 业务事实；绿测试或重算 diff 不能写成“AC 已通过”。A1 只解决变化来源与选例的一个条件；A2 只解决有限登记目标与实报一致的一个条件。AC-32 还需适用层真实执行，AC-33 还需失败→修复→新快照复测和结构/风险对账。

## 最小可实施子集

1. P8 owner 先核原需求、P9 规则、真实调用边和旧回归关系，登记 A1/A2 的**有限** case 与 `not_yet_observed` 效果合同；变更触发可交叉包含 `capture.mjs`，不因共享入口自动给 `related_case_ids`。保留 P8/P9 原有义务的 `not_done`，不得把新 case 直接标为已验证效果。
2. P9 独立盘点两个目标文件的实际单文件 JSON 报告，保存命令/源码 hash/全部叶 ID/状态；冻结旧三目标原字节与实报身份后扩 registry。修订 `build-code-test-registry.test.mjs` 的“恰三、6/15/28”正控时保住旧三目标逐个身份及漏/多/skip/重复/错命令/漂移负控；旧 `build-code-change-scope.test.mjs`、`build-code-test-inventory.test.mjs` 仍按影响运行。不得只把总数 3 改成 5。
3. P10 reader 独立从 bootstrap、Git 原件、当前 catalog/registry、指定 receipt→output→manifest→逐例 raw 重算有限局部判断。用真实相互矛盾输入证明 Git 路径被漏、改名只保留一边、删除漏记、错 Task/旧树、raw 叶漏/多/skip/重复、错 argv/ref/hash 都不能得到局部通过。`partial` 分支只可报告诊断，整体仍 `unavailable`。若需要宣称“外层当时返回数组完整”，先解决第 1 项绑定缺口。
4. 最后在当前 CARD-04 Task 的**新快照**重算所有变化并重新选例；先前 218/209 只是旧诊断。其余路径仍未映射或逐 AC 事实/正式运行绑定缺失时，维持未知，继续处理完整范围。

## 审查范围

只读核了本设计、A 组候选映射和独立复核、当前 P8 catalog/P9 registry、P9/P10/spec 原文，以及 `change-scope.mjs`、`capture.mjs`、`targeted-capture.mjs`、`targeted-runner.mjs`、`test-asset-inventory.mjs`、`case-reconciliation.mjs` 和关联定向测试。未改代码、catalog、registry、材料或 Task facts，未跑全量或定向测试；本备忘录只给设计裁决，不签代码或阶段通过。
