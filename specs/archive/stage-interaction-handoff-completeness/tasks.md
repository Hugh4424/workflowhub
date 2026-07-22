# 阶段交互与交接完整性任务清单

## Phase 1：组件所有权对齐

依赖：accepted build-spec。Phase 1通过前不得开始Phase 2。

- [ ] T001 冻结accepted spec、baseline和当前provider配置；核对supersede条款确保最终验收不执行旧Issue恢复，同时保持旧accepted记录只读。
- [ ] T002 统一`spec-clarify`、`spec-analyze`的Stage/review ownership。
- [ ] T003 收敛`test-strategy`、`isolated-browser-qa`、`test-routing-advisor`、`diagnosing-bugs`、`review-response`等Skill ownership；正确的verify deps只读验证、不为形式修改。
- [ ] T004 同步`wh-review` manifest/stage plan/contract与closure metadata。
- [ ] T005 增加review plan只装入lens-only Skill、同一组件无双重ownership的测试。
- [ ] T006 运行ownership、wh-review contract、closure和宿主独立测试。
- [ ] T007 发布`component-ownership` Phase evidence并执行一次正式Phase review。

## Phase 2：Stage交互与双向handoff

依赖：T007 Phase 1 review通过。T013完成后才能执行T014。

- [ ] T008 为make-decision补三轮talk、grill和完成清单的宿主可见合同。
- [ ] T009 为build-spec补always歧义scan、conditional clarify及skip事实。
- [ ] T010 为build-plan/verify-code补组件清单、完成卡和handoff合同。
- [ ] T011 补充宿主无关的ask/wait/present、return与父子进度规则。
- [ ] T012 增加交互、执行/skip、完成卡、handoff与anti-host聚焦测试。
- [ ] T013 更新受影响closure metadata/hash并运行相关回归。
- [ ] T014 发布`stage-interaction-handoff` Phase evidence并执行一次正式Phase review。

## Phase 3：build-code双部分与Phase闭环

依赖：T014 Phase 2 review通过。T022完成后才能执行T023；T023通过后才能执行T024/T025。

- [ ] T015 在宿主无关`build-code` Skill中定义可组合的阶段协调与Phase执行部分。
- [ ] T016 明确单Agent完整执行、Phase事实卡和两部分职责边界。
- [ ] T017 让Phase执行部分覆盖RED/GREEN、测试、canonical证据、Phase review、finding修复和一次返回。
- [ ] T018 让阶段协调部分覆盖拆Phase、phase-gate、最终review、Stage accept和verify reopen。
- [ ] T019 在现有`stage-runtime.mjs`增加窄Phase diff/result发布入口，复用现有scanner/writer。
- [ ] T020 增加首/后续Phase lineage、错误身份/ref/allowlist、非法参数和修订snapshot测试。
- [ ] T021 增加单Agent组合、分工执行、同身份review复用和新身份单次review测试。
- [ ] T022 更新受影响bundle/catalog/closure并运行build-code/runtime/wh-review回归。
- [ ] T023 发布`phase-execution-ownership` Phase evidence并执行一次正式Phase review。
- [ ] T024 预检最终测试receipt、原始输出、SHA与canonical evidence并运行相关全量测试。
- [ ] T025 对最终源码树执行一次正式full-worktree review并运行`verify-final`。

## Multica配置与Prompt窄审

依赖：T025最终源码review与`verify-final`通过。T027完成且T030通过后才能执行T031。

- [ ] T026 等Agent idle，回读工头、五Stage Agent、Coder、Squad、五Skill、绑定及provider/model/runtime基线。
- [ ] T027 原位同步五个已审WorkflowHub Skill closure并回读内容/hash/ID。
- [ ] T028 生成结构化Prompt差异：真实mention、决策卡、完成卡、双向handoff、组件清单和自动收口。
- [ ] T029 映射Code Builder到阶段协调部分，映射Coder到Phase执行部分，并给Coder绑定现有`build-code` Skill ID。
- [ ] T030 组装仅含Prompt/绑定差异的窄材料，预检hash后按当前配置执行一次独立审查。
- [ ] T031 审查通过后原位更新并逐项回读，确认provider/model/runtime未变。

## Canary与最终收口

依赖：T031线上回读通过。T032～T037完成后才能close；T038完成后立即执行T039。

- [ ] T032 创建新的外部Canary项目、父Issue、五阶段Issue和受控工作区。
- [ ] T033 验证make-decision真实talk/grill/决策卡/member mention。
- [ ] T034 验证build-spec真实clarify交互和无歧义fixture skip。
- [ ] T035 验证build-plan组件清单、确认和双向handoff。
- [ ] T036 验证两个build-code Phase由Coder各自闭环测试/review/finding并一次返回。
- [ ] T037 验证verify失败、唯一reopen、fresh verify、最终review复用和零外部救火。
- [ ] T038 授权并执行六步close，核对全部Issue终态。
- [ ] T039 删除Canary project/worktree/branch，保留核心改动worktree直到最终验收。
- [ ] T040 汇总AC-001～AC-011证据；只有Canary通过后恢复核心任务final verify/close/merge/archive/cleanup。
