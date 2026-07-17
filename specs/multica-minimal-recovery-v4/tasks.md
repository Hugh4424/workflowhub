# WorkflowHub × Multica 最小完整恢复任务清单

## A. review-only simplicity guard

- [x] T001 在现有 `wh-review` manifest、stage skill plan、contracts 和 closure 中，把 `simplicity-guard` 加到 make-decision detail、build-spec、build-plan、build-code review；保持 direction、verify-code 和所有生成/实现步骤排除。映射：FR-001，AC-001。
- [x] T002 扩展现有测试：未批准扩项、重复实现、投机抽象、兼容层、死代码、吞错兜底必须 `revise_required`；批准范围内的必要测试和错误处理不得被误判。映射：FR-001，AC-001。

## B. Multica 配置原地修复

- [x] T003 用 production profile 只读回读 7 个 WorkflowHub Agent、Skill bindings、VibeCoding Squad instructions 和 workspace Skill 列表，确认线上基线。映射：FR-002–007。
- [x] T003a 写配置前确认相关 Agent 均为 idle，并暂停给 VibeCoding Squad 分配新生产任务；Canary 通过前不恢复。依赖：T003。
- [x] T004 按 `multica-prompts.md` 更新工头 instructions；Skill bindings 设为空；解绑 `caveman`；只有 close completed 后才把父 Issue 设 done。映射：FR-002、006、007、009，AC-002、003、006。依赖：T003a。
- [x] T005 更新五个 Stage Agent instructions；各只保留自己的 stage Skill；解绑 `caveman`；明确官方 WorkflowHub 入口缺失时阻塞，禁止在业务仓补造 runtime 文件；Code Verifier 只有 close completed 后才能完成。映射：FR-003–005、009，AC-002、004、005。依赖：T003a。
- [x] T006 更新 Coder instructions；解绑 `build-code` 和 `caveman`；明确只改 phase 允许范围，缺官方 WorkflowHub 入口时阻塞，禁止补造 runtime。映射：FR-003，AC-002。依赖：T003a。
- [x] T007 缩短 VibeCoding Squad instructions，只保留 leader 路由、五阶段和状态规则。映射：FR-002、006、007，AC-003、006。依赖：T003a。
- [x] T008 重新部署 make-decision Skill 闭包；回读证明 `skill-deps.yaml` 已声明 talk/grill/decision-log/intake-decision-review/wh-review，保存 `check-skill-closure` 成功输出；缺任一依赖时不得启动 Canary。映射：FR-005，AC-004。依赖：T003a。
- [x] T009 修改后实时回读全部对象，逐字段确认 instructions、bindings、leader 和 `updated_at`；不得只凭 update 命令成功声明完成。映射：AC-002。依赖：T004–008。

## C. make-decision 完成条件

- [x] T010 在现有 make-decision Skill/contract/tests 中明确：实质歧义直接问用户；talk/grill 不得模拟用户；最终必须展示 `decision-log` 并取得方向确认；缺项不得 accepted。映射：FR-004、005，AC-004、005。

## D. close 最小有效实现

- [x] T011 修改 `workflows/verify-code/SKILL.md`：冻结包含 commit/archive/merge/push/worktree cleanup/local branch cleanup 的 close plan；只取得一次独立 plan-hash 确认；Code Verifier 从主 checkout 执行六项 Git 写动作后，调用 `task-close.mjs complete` 核实。映射：FR-008、009。
- [x] T012 在 `core/task-close.mjs` 增加窄 delivery-state verifier；由 Code Verifier 先 fetch，core 只读探测 spec 路径、任务/archive commit 包含关系、目标分支/已刷新 remote ref 一致性、worktree 和本地任务分支是否存在。不得执行 Git 写命令、通用 shell command 或调用 Multica。映射：FR-008，AC-007。
- [x] T013 新增 `scripts/task-close.mjs` 的 `prepare|confirm|complete|status` 薄入口，复用现有 plan hash、confirmation 和 immutable completed record；任一事实不满足时非零失败；status 明确显示 merge 已完成但 push/cleanup 未完成等中间态。映射：FR-008、009，AC-007。依赖：T012。
- [x] T014 扩展现有 close 测试，分别制造漏 commit、archive、merge、push、worktree cleanup、branch cleanup；全部必须拒绝 completed；完整状态和重复 complete 必须稳定通过。映射：AC-007、008。依赖：T011–013。

## E. 整体验证与 Canary

- [x] T015 运行 wh-review、make-decision、close、five-stage E2E、offline、TaskKernel 及受影响测试，执行 lint 和 `git diff --check`；核对 close 生产代码 220–340 行、测试 220–350 行、新依赖/schema/通用抽象为 0。映射：AC-001、004、007、008。依赖：T001、T002、T010、T014。最新证据：全量 94 files、750 tests 全部通过；structure、closure、task-record、anti-host、run-checks、five-stage smoke 和 `git diff --check` 均 exit 0。
- [x] T016 创建一个低风险真实 Multica Issue，先验证 assignee + `backlog→todo` 确实让 Agent 接手，再完整验证五阶段顺序、可读 Issue、make-decision 交互、精确 `project/task` 交接、产品问题直达用户、真实 mention 恢复、业务仓无伪 runtime 文件和完整 close。失败先修复并重跑受影响部分，不机械创建第二个 Canary。映射：FR-010，AC-003–009。依赖：T009、T015。证据：父 Issue ZHI-204 及 stage ZHI-209/206/205/208/207 均 done；verify snapshot `c8356046d6a96d3e55daff9b5bac951614c997ab`；close plan `94babe5e489e3ca3e2ab3d471112ac045425d8d8702c65397e3dc64a66304265`；`task-close-completed.v1`；远端临时目标 `3693c090a34ab2be17bd37cec9d39acc219028b4`。

## 删除检查

进入 build-code 前，确认任务中不存在以下内容：trusted-human-confirmation、comment author 校验、token/签名/认证、Multica adapter、offline verifier 产品、统一 CLI、通用 Git executor、PR 自动化、第二套 generation、每 phase 人工确认。

最终范围审计发现并删除了误加的 comment reference、`interaction_refs` 和 confirmation `source_ref` 硬门；真人等待与恢复仅由 Multica Prompt/Skill 约束，WorkflowHub 只保留既有人工 acceptance 与 decision-log 必填。
