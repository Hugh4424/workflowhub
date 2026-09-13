# Task Plan: WorkflowHub build-spec 与 build-plan

## Goal
在认证 task/worktree 内，按两个 stage manifest 的原始顺序完成 build-spec 15 步和 build-plan 13 步；每阶段形成当前材料、独立审查、finding 处置、strict spec-analyze、completed stage outcome 与 stage reflection，且不把本阶段规格缺口推给下游。

## Next Step
两个阶段已 completed 并已交接。下一步由用户决定：提交四材料 / 另起 build-code 会话（交接文档 `quality/evidence/handoff/build-plan-to-build-code.md`）。

## Current Phase
Phase 7 完成 — 两阶段已按合并后材料重新发布并交接

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
- [x] build-spec 官方 run/reflection 已发布
- [x] build-plan 官方 run/reflection 与用户确认已发布
- [x] 总结主要产物与真实质量缺口
- **Status:** complete

### Phase 7: Merge completed predecessor task and reconcile
- [x] 检查当前分支、工作区改动与 main 的任务Ⅰ提交
- [x] 安全保存未提交改动并合并 main
- [x] 恢复本任务改动、解决冲突并确认无数据丢失
- [x] 对照任务Ⅰ实际实现复核 decision-log/spec/plan/tasks 的陈旧假设
- [x] 按用户裁决修订四材料并重新运行合同校验
- [x] 重发布 build-spec / build-plan outcome、确认与 reflection
- [x] 产出 build-code 交接文档
- **Status:** complete

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
| `git stash pop` 恢复 A2 时 `wh-review-cli.mjs` 与 main 同行冲突 | main 已包含三值 allowlist；保留简短解释注释和 A2 回归测试，标记冲突解决；stash 暂保留为安全备份 |
| 误用 `node --test` 运行 Vitest 测试文件，报 Vitest internal state | 改用 `./node_modules/.bin/vitest run ...`，34/34 通过 |
