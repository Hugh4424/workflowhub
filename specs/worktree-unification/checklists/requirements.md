# Requirements Checklist — worktree-unification
task-id: worktree-unification
generated: 2026-07-04
source-spec: specs/worktree-unification/spec.md

---

## 产品可读性

- [x] 无实现细节泄露（无编程语言、框架、API 名称）— spec 以 git 命令为必要操作工具，非实现框架泄露；所有 FR 描述业务行为
- [x] 聚焦用户价值与业务需求 — FR 聚焦 worktree 生命周期管理、commit 追溯、close 安全收尾
- [x] 非技术干系人可读 — §1 速读卡、§7 非目标均为业务语言描述
- [x] 所有必填章节已完成 — §1概述/速读卡、§3 FR、§5 成功标准、§6 影响范围、§7 非目标、§8 场景均已完成

## 需求完整性

- [x] 所有 [NEEDS CLARIFICATION] 标记已解决（Q1/Q2 均已在 spec.md §6 标记 [RESOLVED] 并附消解依据）
- [x] 所有功能需求可测试、无歧义 — 每个 FR 均有明确 Given/When/Then 场景，含 fail-loud 条件
- [x] 成功标准可度量 — §5 成功标准列出 4 条编号成功标准（含可观测结果），各 FR 的详细验收标准在 §3 各 FR 条目中展开（9 个 FR 共 9 组验收标准）
- [x] 成功标准不含实现细节 — 验收标准以文件存在/git log/worktree list 输出为检查依据，不指定语言框架
- [x] 所有验收场景已定义 — §8 Given/When/Then 覆盖全部 9 个 FR（CONTRACT-001 ~ SCOPE-009）
- [x] 边界情况已标识 — 僵尸 worktree、双缺失 task_dir、occupied 分支、partial-close 失败均有场景
- [x] 范围已明确界定（Non-Goals 章节存在）— §7 非目标明确排除经验提取、多仓库并发、自动修复僵尸
- [x] 依赖和假设已记录 — §6 影响范围列出下游 stage 依赖，§2 背景列出假设（D1-D6 decision-log）

## 功能就绪

- [x] FR-WORKTREE-CONTRACT-001：worktree.json 契约字段完整定义，有验收标准 — 6 字段（target_repo_root/worktree_root/branch/created_by_stage/push_policy/status，与 decision-log 验收标准第1条一致）已定义，含写权限规则、值域校验、分层校验；验收标准要求文件存在且全部字段可查
- [x] FR-WORKTREE-MAKEDECISION-002：make-decision D1-D5 规则章节，有验收标准 — R1-R7 规则（含 D1 task_dir 读取、D2 target_repo_root 固化、D3 task-id 规范化、D4 冲突检测、D5 commit 责任）均已定义，验收标准要求 SKILL.md 中存在独立 worktree 章节
- [x] FR-WORKTREE-ENVVAR-003：环境变量优先级规则，有具体验收场景 — 三场景（env 优先/yaml fallback/双缺失 fail-loud）均已定义
- [x] FR-WORKTREE-COMMIT-004：per-stage commit 规则，有验收标准 — 5-stage 枚举、phase 级提交规则、commit 覆盖矩阵（6行分母）、no-change 记录要求均已定义
- [x] FR-WORKTREE-PUSH-005：push 仅 verify-code 收尾执行，有验收标准 — 8 步线性序列已定义，push gate 要求 user_decision=true，验收标准含 push 未发生场景
- [x] FR-WORKTREE-CLOSE-006：close 流程四步完整性，有验收标准 — 五步（入口校验/质量事实/3rd-review/不可逆动作/stage-result）已定义，含 pre-merge revise_required 契约和 partial-close 失败契约
- [x] FR-WORKTREE-FAILLOUD-007：僵尸检测 fail-loud，有验收标准 — 定义僵尸目录场景（路径存在未注册）、fail-loud 不自动删除、场景 A/B 已补齐
- [x] 用户场景覆盖主要流程（全流程断链修复场景）— §8 场景覆盖 contract/makedecision/envvar/commit/push/close/failloud/scope-008/scope-009
- [x] 功能满足成功标准中定义的可度量目标 — 每个 FR 验收标准与 §5 成功标准逐条对应
- [x] 无实现细节泄漏进规格书 — git 命令作为观测手段（`git worktree list --porcelain`），非实现语言；已核查无 Node.js/Python/框架名称

## 待澄清事项（NEEDS CLARIFICATION）

> 以下问题均已在 build-spec 阶段解决，状态全部 [RESOLVED]。

| # | 问题 | 所在章节 | 状态 | 消解依据 |
|---|------|---------|------|---------|
| Q1 | `config/workflowhub.yaml` 是否已有 `task_dir` 字段？若无，需在本任务中新增，还是由 build-code 另行处理？ | §3 FR-WORKTREE-ENVVAR-003 / §6 依赖 | [RESOLVED] | 已有 `task_dir` 字段；本任务统一使用 `WORKFLOWHUB_TASK_DIR` 环境变量覆盖（D1），yaml fallback 保留，build-code 无需另行处理 |
| Q2 | close 流程当前是否有现有脚本/SKILL.md？需要确认现有 close 流程的入口文件路径，再判断是补充还是新建。 | §3 FR-WORKTREE-CLOSE-006 | [RESOLVED] | verify-code/SKILL.md 中已有 Step10/11 收尾流程；本任务在现有 SKILL.md 内补充 3rd-review 前置步骤和 worktree 清理规则，不新建 close 入口文件 |

## 档位与 F10 结论

- **档位**：B 档（中等）
- **F10 结论**：四问均有明确答案，新机制有实际案例支撑（ZHI-65），无现有机制可复用，bypass 风险已通过 fail-loud 要求对冲，维护成本在可接受范围。无过度工程警告。
