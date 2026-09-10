# Task Plan: WorkflowHub build-spec 与 build-plan

## Goal
在认证 task/worktree 内，按两个 stage manifest 的原始顺序完成 build-spec 15 步和 build-plan 13 步；每阶段形成当前材料、独立审查、finding 处置、strict spec-analyze、completed stage outcome 与 stage reflection，且不把本阶段规格缺口推给下游。

## Next Step
执行 build-plan steps 1–3：读取 portable package 与当前 decision/spec，判断 conditional research，并建立不执行测试的 testing-system blueprint。

## Current Phase
Phase 4 — build-plan load, blueprint, plan/tasks

## Phases

### Phase 1: build-spec steps 1–3 — load, conditional research, clarify
- [x] 核对 task/worktree 与阶段状态
- [x] 读取 build-spec manifest
- [x] 读取 portable package、依赖与 current decision-log
- [x] 执行 conditional spec research，记录当前与目标合同差距及宿主来源限制
- [x] 完成十维歧义检查；`trigger=false`，0 个方向性开放问题
- **Status:** complete

### Phase 2: build-spec steps 4–10 — specify and freeze
- [x] 编写完整 spec.md
- [x] 执行 simplicity guard 与 CEO review
- [x] 记录 non-UI steps 7–9 为 not applicable
- [x] 冻结包含 requirements/flows/states/boundaries/FR/AC/non-goals/deferred 的 spec
- **Status:** complete

### Phase 3: build-spec steps 11–15 — review, analyze, publish, reflect
- [x] 对冻结 spec 发起一次真实独立 review
- [x] 逐条处置 finding 并完成最后材料修订
- [x] 执行 strict stage-end spec-analyze
- [x] 发布 completed stage outcome 与普通话 handoff
- [x] 发布 stage-reflection.v2
- **Status:** complete

### Phase 4: build-plan steps 1–8 — load, blueprint, plan/tasks
- [ ] 读取 build-plan portable package 与当前 decision/spec
- [ ] 记录 conditional planning research 事实
- [ ] 建立逐行为测试蓝图
- [ ] 编写 plan.md（phase/boundary/dependency/risk/rollback/verification）
- [ ] 执行 simplicity guard、engineering review、test routing advisor
- [ ] 编写有序可执行 tasks.md
- **Status:** pending

### Phase 5: build-plan steps 9–13 — review, analyze, confirm, publish, reflect
- [ ] 对 current plan/tasks 发起一次真实独立 review
- [ ] 逐条处置 finding 并完成最后材料修订
- [ ] 执行 current five-input strict spec-analyze
- [ ] 给用户普通话 handoff 并取得当前材料绑定的真实确认
- [ ] 发布 completed stage outcome 与 stage-reflection.v2
- **Status:** pending

### Phase 6: Final verification and delivery
- [ ] status 验证 build-spec completed / missing=[]
- [ ] status 验证 build-plan completed / missing=[]
- [ ] 核对主 checkout 干净、无提交/合并/推送/close
- [ ] 总结主要产物与证据
- **Status:** pending

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 严格先 build-spec 后 build-plan | build-plan 缺 `spec.md`，manifest 明确依赖；用户也指定顺序 |
| 只跑受影响针对性测试 | AGENTS.md 硬规则；禁止无范围全量回归 |
| 重读量与独立分析交给子代理 | AGENTS.md 要求控制主上下文；独立质量裁决不可自审自判 |
| 复用当前认证 worktree/task | 当前 branch、task、make-decision outcome 已认证完成，不能另起或跳过来源 |
| 规划文件放 `.planning/...` | 避免污染四份当前材料；这些仅为 agent 工作记忆，不是 WorkflowHub 控制面或质量 gate |

## Errors Encountered
| Error | Resolution |
|-------|------------|
| 初次文件发现用 `workflows/{build-spec,build-plan}/**/*` 未匹配 | 改用精确路径直接读取两个 `steps.json`，不重复同一失败 glob |
| build-spec 正式 review dispatch 期间写入 non-UI N/A，触发 `review source changed while dispatching; result was not recorded` | 保留失败事实；先完成全部已知修订，再冻结 worktree 重新调用一次；第二次 dispatch 期间禁止任何 worktree 写入 |
| 首次 build-spec bridge analyzer 因映射缺 `R-*` 根来源、coverage actual 文本不含 expected 而拒绝 | 在 spec 映射声明 `R-ORIGINAL`，按 strict packet 合同重建 16/16 coverage；第二次 bridge 成功 |
| 首次 public status 未带 action，exit 1 | 改用 `status --action=begin` |
| 首次 official run 未传 review/outcome receipts，未识别已发布 outcome | 构造显式 run input，传 canonical review、stage outcome 与 dispositions |
| disposition classification 初稿不匹配 runtime 枚举；下一次又带 unsupported `evidence_status` | 按 `classifyFinding` 改为 implementation_defect/invalid_finding，并移除 disposition schema 不支持字段后重跑 |
