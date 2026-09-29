# P10/T020 case status 修复：独立窄审查

审查范围：只读比对 `selector-before.mjs`、`test-before.mjs` 与当前 `workflows/build-code/case-selection.mjs`、`tests/contract/build-code-case-selection.test.mjs`；读取 `red/`、`green-targeted/`、`green-file/` 原始输出和元数据；对照 P10/T020、AC-32、`CONSTITUTION.md` 与 `constitution-checklist.md` 的 F3/F9/F11/Q1/Q3。我没有改生产或测试文件，也没有运行测试。当前 worktree 分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。

## 结论

**本次精确修复未发现阻止合入当前工作树的代码问题。** 结论只覆盖 case 状态筛选，不是 P10、AC-32 或 build-code 完成裁决。

- **写面**：生产 diff 仅在 P10 自有 `case-selection.mjs` 增加 `active|retired` 状态枚举校验，并将直接选择与关联遍历的条件收紧为 `active`。测试 diff 仅给原动态正例补 `active` 状态，并增加 5 个状态负控；没有删除或放松旧断言。两文件均在 P10/T020 当前材料写集和本轮 `phase-card.md` 范围内；未新增 schema、public 命令、持久化或 gate。
- **行为**：缺失、`unknown`、`pending` 状态在 catalog 遍历时返回 `unavailable/missing_inventory_identity`、空 `cases`；active 直接命中仍可选，关联项必须 active；retired 直接命中不会选中，关联 retired 会被拒绝。这些分支从当前代码逐行可见。未知状态即使出现在本次未命中的 catalog case 中也会拒绝整个 catalog；这是对输入完整性的保守处理，未见与本轮合同冲突。
- **RED/GREEN**：修复前精准命令输出 4 failed、1 passed、16 skipped、exit 1；四个失败均是未知状态错误地返回 `selected`，不是 import/setup 故障。修复后同测试 SHA `731328a04c528f51b631d91cf448557ee8485c0eac5ba07e275e6522b6c26e23`、生产 SHA 从 `5801544f09b9481129231f7fb610571701a5c3f52a939a07671884b5bb3a7400` 变为 `ebada9e65f73c39712e62db990bb276b0c1e111811837269a4184cf9577768c4`，精准命令 5 passed、16 skipped、exit 0。相邻单文件命令随后 21/21 passed、exit 0、无跳过，含旧动态选例、可信起点可发现冲突、registry/库存负控。元数据绑定同 Task 和材料 `revision-30e50b760cb29e92f9b114a9be6db6105647a76b7c3c8caeb15a4a949a4975b6`；修复后两次测试绑定树 `4d9183a215c19a0af0a87ac1befab95eaadd4ed5`。证据见本目录三个运行子目录的 `run-metadata.json` 与 `stdout.raw.txt`。

## 宪法与清单核对

- **F3**：本补丁只在既有 P10 选择函数 fail closed；不改变 post 当前材料进入条件或正式 publication。测试身份与工作树另行记录，不能从此处推断正式阶段写入通过。
- **F9**：同测试字节修复前确实因目标错误失败，修复后通过；未知 case 状态不能假装 active。局部绿色不冒充真实业务或 AC-32 完成。
- **F11**：无新控制面或持久对象。合法 active 用例仍可选择；缺失/非法状态拒绝选测是既有用例关系安全边界。此拒绝不应被扩展为阻止同 Task 继续修复的阶段门。
- **Q1**：当前质量事实仅证明本次针对性修复；P10 的真实业务效果、未映射改动、完整逐 AC 和交接仍须单独核实，不能报整个 Phase 已完成。
- **Q3**：本审查由未实施此补丁的独立子代理只读产出；RED/GREEN 的执行身份只证明所跑版本和结果，不替代独立业务质量裁决或人工最终确认。

**保留限制**：`selectAffectedCases` 接受调用者提供的纯对象，无法独立认证 P9 来源、实际 Git 差分、runner、业务效果或真实页面。`retired` 作为关联项的分支可从代码确认，但这轮新增测试只显式执行直接 retired 负控；如后续修改关联逻辑，应增加对应目标测试。此处没有观察到能推翻本次局部修复的缺陷，也不能据此签发完整 P10 通过。
