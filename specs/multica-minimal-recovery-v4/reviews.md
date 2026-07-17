# 3rd-review 审查记录

## 材料

审查包包含 spec、plan、tasks、Multica Prompt 修改、production Multica 实时 Agent/Squad 基线、事故审计、Multica issue/mention 合同、宪法、真实 diff 和测试证据。附件经 3rd-review 的 file-only hash/size 校验后交付。

## 结果

- OpenCode 最终 `pass`：runtime `8a8d4916-697f-44ad-9b20-4b26381bbd3a`。
- Kimi 最终 `pass`：runtime `b1f409f1-4275-46a6-8ae0-4d5cd20d70ee`；blocking 0，medium 0。
- Claude Code 最终 `pass`：runtime `48871b48-8451-4b1a-8ca4-c3d36aeffee0`；未发现 blocking/medium。
- Codex CLI 未作为独立 reviewer 运行：当前 host_provider 是 `codex`，3rd-review 合同会自动排除同宿主 provider，不能伪装宿主身份绕过异源要求。

## 审查促成的修订

- 明确初次 todo 触发必须在 Canary 观察实际接手；恢复仍用真实 UUID mention；
- 新 generation 必须先经用户批准；整体进度只汇总父 Issue；
- Git 写动作由 Code Verifier 执行，WorkflowHub core 只读核实；
- close 先 fetch，并核实任务/archive commit 均进入已 push 的目标分支；
- 五个 Stage Agent 和 Coder 全部加入“禁止在业务仓补造 WorkflowHub runtime”边界；
- build-spec 保留 constitutional checklist，只移除 simplicity 生成步骤；
- make-decision simplicity trigger 独立统一；build-code manifest 与 stage plan 对齐。

## 本地证据

- `node core/check-skill-closure.mjs`：通过；
- wh-review 两个测试文件：26 tests 通过；
- `git diff --check`：通过。

## build-code 最终实现审查

- OpenCode（tier 0）`APPROVED`，findings 为空；runtime `e99efce0-8d7f-4a75-a543-cea28654accd`。
- Claude Code（tier 1）`APPROVED`，findings 为空；runtime `6da29d92-ec2a-4d04-8201-80c2bc76bb5e`。
- 两者读取同一份 file-only 冻结材料，sealed/provider-visible manifest hash 均为 `58a1969f912e5540d22802cc069d7c026ce13f8bf506eaef7661123393672042`。
- 实现前的独立 scope review 曾发现 archive 可篡改/夹带、评论引用只判非空；修复后复审 `PASS`，相应反例和全量测试均通过。
- 最新全量结果：94 个测试文件、749 项测试通过；Skill closure、structure、task record paths、anti-host、`git diff --check` 全部通过。
- 真实 Canary 仍是上线验收项，未在本节冒充完成。

## 真实 Canary 与后续修订

上述 build-code 审查只覆盖 commit `908827e` 及其冻结材料，不覆盖 Canary 后的最新 close 修订。

- 父 Issue：ZHI-204；五阶段：ZHI-209、ZHI-206、ZHI-205、ZHI-208、ZHI-207，均按顺序执行；
- build-code snapshot tree：`f6ed5c45ce1f249c2de2dc0dfca8e5177e1d3959`；verify snapshot commit：`c8356046d6a96d3e55daff9b5bac951614c997ab`；
- Canary 发现 `prepare` 错误要求候选先提交且 clean，导致 plan 无法在授权前生成；修复仅允许 parent/tree 双绑定的已验证 snapshot，不增加 Git executor；
- close plan hash：`94babe5e489e3ca3e2ab3d471112ac045425d8d8702c65397e3dc64a66304265`；最终本地/远端临时目标 OID：`3693c090a34ab2be17bd37cec9d39acc219028b4`；worktree 和本地任务分支均已清理；
- Code Builder 从旧 DeepSeek/OpenCode runtime 切换到现有 Codex runtime，是因为旧 runtime 两次越权自行实现或使用错误工作区；这是现有 Agent 的运行配置纠正，不是 provider 框架或新增产品需求；
- `project/task` 两值交接保留，因为 Canary 实际出现后续阶段身份缺失；只写在 Issue 末尾内部引用，不恢复 Launcher、lineage 或 provider 设计。

最新回归：全量 94 files、750 tests 全部通过。structure、Skill closure、task-record paths、anti-host、`run-checks`、five-stage smoke 和 `git diff --check` 均 exit 0。

旧快照正式复审因 provider 输出失败，状态为 `unavailable`，不冒充审查通过。最终范围审计随后发现实现违反 spec 的非目标：把 Multica 的真人交互约束扩成 WorkflowHub comment reference、`interaction_refs` 和 confirmation `source_ref` 硬门；这些内容已全部删除，未增加替代框架。最新 HEAD 的 tier0+tier1 正式复审以 TaskHandle 中的不可变结果为准，必须得到语义结果后才能完成任务。
