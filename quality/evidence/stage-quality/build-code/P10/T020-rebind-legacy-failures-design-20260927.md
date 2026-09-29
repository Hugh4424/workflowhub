# AC-REBIND-001 / 003 旧契约失败：只读修复设计

范围：只分析 tests/contract/freeze-classification-budget-usage-protocol.test.mjs:294-325 的两项失败；未改生产源码或测试，未运行测试。T020-adjacent-failures-audit-20260927.md 已证明这两项在本次 OI 补丁前也失败，因此目前这条邻近测试仍是失败，不能计为通过。

## 查到的事实

1. **AC-REBIND-001 不止路径过时。** 测试第 299 行读取 specs/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md，而 HEAD 中的实际历史文件为 specs/archive/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md（归档提交 fcb7078f）。归档原件说明四个 agent 自造的二级标题已删除，并将后续阶段事实放在 task store；测试以四个精确标题计数为零，只能证明这份归档样本不含这些标题。更重要的是，测试第 301 行还要求当前 make-decision 文本写着“step 11–14 只落 task store”；当前 workflows/make-decision/steps.json 实际只有 13 步，当前 SKILL.md:243-249 明写 step 11–13。只替换文件路径会暴露第二个过时断言。
2. **AC-REBIND-003 是旧材料形式的断言。** 测试第 321–323 行要求当前 build-plan 技能出现“确认后唯一可写区是 tasks.md 的执行状态填写区”“plan.md 语义段不得再改”，并要求标准文档有“build-plan step 12 … 人工确认”。旧版技能在 d8c74fdc 和 fcb7078f 的第 112 行确有那一句。当前 workflows/build-plan/SKILL.md:9-18,37-53,127-147、docs/standard-workflow.md:230-263 已规定：post 任务写 spec.md、独立 Phase 文件和纯指针索引，不生成 plan.md/tasks.md；pre/history 保留旧四材料；真实人工确认仍要发布。当前 post build-code 的执行事实落 task facts/quality evidence，见 workflows/build-code/SKILL.md:50-76。runtime/task/material-workspace.mjs:1-51 和 runtime/stage/completion-predicates.mjs:39-58 按 cohort 选择当前材料；runtime/task/task-store.mjs:228-251 的 build-code 阶段行可保存一个 Phase 续跑位置。把旧句补回当前技能、给 post 任务造 tasks.md，都会违背现行消费者。
3. 当前标准文档明确 post build-plan“发布并取得真实人工确认”（第 244 行），但不存在旧字面“build-plan step 12 … 人工确认”。旧测试第三条文字匹配即使越过前两个断言也可能失败。不能靠硬塞旧句证明真实确认；确认必须由现有原件及当前材料身份核验。

## 最小正确处理

### AC-REBIND-001

- **保留历史回归时**：将归档决策记录当作明确命名的历史 fixture，读真实 archive 路径并核验其归档身份；把“旧任务当时 14 步”的文本断言同“当前流程 13 步”的检查拆开。当前流程检查应从 steps.json 的实际步数和 SKILL.md 相应写入边界得出 11–13，不再强求 11–14。四个标题只对归档原件做精确 Markdown 标题检查，不把它外推为所有任务都遵守冻结规则。
- **若该测试旨在证明当前产品行为**：归档样本不足，应另用当前 task/材料与真实 writer 或材料边界消费者验证：确认后的阶段事实只进 task store，实质 decision-log 变化必须使先前确认失效。没有这样的行为测试就将当前行为状态留为未验证。
- 负控：在内存副本中插入四个禁止的精确二级标题之一，断言检查拒绝；改动确认后 decision-log 实质内容，断言旧确认不得复用；只新增合法 task-store 阶段事实，不应要求修改 decision-log。不要改动归档原件来喂测试。

### AC-REBIND-003

- **按 cohort 分两条契约**：pre/history 的日常执行记录仍允许在 tasks.md 指定填写区更新；计划语义如需修复，由 build-plan 材料 owner 处理并重新核对当前确认绑定，不把语义改动伪装成执行记录。post 的执行记录只落既有 task facts/quality，Phase 与索引不是进度账，post 无 plan.md/tasks.md。当前技能与标准文档应明确这个边界；若只想保留旧决策的考古测试，就读旧 commit/归档材料并标明不代表当前 contract。
- 对“人工确认”应检查当前 build-plan 的 publish-result-and-confirm 步及技能所述真实 reply/human-confirmation.v3 原件绑定；文字断言只辅助检查，不替代消费者行为。不可把旧 step 12 数字或旧中文句子补到当前文档求绿。
- 负控：post 任务缺 plan.md/tasks.md 仍能选择正确的 spec.md、Phase、索引；post 索引或 Phase 被写入进度必须被发现；pre 的 tasks.md 执行区变化可被识别，但 plan.md 语义变化不得被当成同一确认下的执行记录；无真实用户确认时不得报已确认。

## 退休条件

若维护者决定 AC-REBIND-001/003 只约束 2026-09-17 旧任务、已被当前 13 步/post 材料合同取代，就从**当前**邻近 gate 中诚实移出并保留不可变历史测试/证据（或标明历史 fixture 的单独测试）；登记旧测试为何失效、对应的新测试和实际消费者。不得简单删除失败断言、改为宽松正则、跳过测试或把整条 gate 记为通过。现有六项邻近失败中的另外四项仍需独立修复与复测。
