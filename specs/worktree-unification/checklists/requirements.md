# Requirements Checklist — worktree-unification
task-id: worktree-unification
generated: 2026-07-04
source-spec: specs/worktree-unification/spec.md

---

## 产品可读性

- [ ] 无实现细节泄露（无编程语言、框架、API 名称）
- [ ] 聚焦用户价值与业务需求
- [ ] 非技术干系人可读
- [ ] 所有必填章节已完成

## 需求完整性

- [x] 所有 [NEEDS CLARIFICATION] 标记已解决（Q1/Q2 均已在 spec.md §6 标记 [RESOLVED] 并附消解依据）
- [ ] 所有功能需求可测试、无歧义
- [ ] 成功标准可度量
- [ ] 成功标准不含实现细节
- [ ] 所有验收场景已定义
- [ ] 边界情况已标识
- [ ] 范围已明确界定（Non-Goals 章节存在）
- [ ] 依赖和假设已记录

## 功能就绪

- [ ] FR-WORKTREE-CONTRACT-001：worktree.json 契约字段完整定义，有验收标准
- [ ] FR-WORKTREE-MAKEDECISION-002：make-decision D1-D5 规则章节，有验收标准
- [ ] FR-WORKTREE-ENVVAR-003：环境变量优先级规则，有具体验收场景
- [ ] FR-WORKTREE-COMMIT-004：per-stage commit 规则，有验收标准
- [ ] FR-WORKTREE-PUSH-005：push 仅 verify-code 收尾执行，有验收标准
- [ ] FR-WORKTREE-CLOSE-006：close 流程四步完整性，有验收标准
- [ ] FR-WORKTREE-FAILLOUD-007：僵尸检测 fail-loud，有验收标准
- [ ] 用户场景覆盖主要流程（全流程断链修复场景）
- [ ] 功能满足成功标准中定义的可度量目标
- [ ] 无实现细节泄漏进规格书

## 待澄清事项（NEEDS CLARIFICATION）

> 以下问题均已在 build-spec 阶段解决，状态全部 [RESOLVED]。

| # | 问题 | 所在章节 | 状态 | 消解依据 |
|---|------|---------|------|---------|
| Q1 | `workflowhub.yaml` 是否已有 `task_dir` 字段？若无，需在本任务中新增，还是由 build-code 另行处理？ | §3 FR-WORKTREE-ENVVAR-003 / §6 依赖 | [RESOLVED] | 已有 `task_dir` 字段；本任务统一使用 `WORKFLOWHUB_TASK_DIR` 环境变量覆盖（D1），yaml fallback 保留，build-code 无需另行处理 |
| Q2 | close 流程当前是否有现有脚本/SKILL.md？需要确认现有 close 流程的入口文件路径，再判断是补充还是新建。 | §3 FR-WORKTREE-CLOSE-006 | [RESOLVED] | verify-code/SKILL.md 中已有 Step10/11 收尾流程；本任务在现有 SKILL.md 内补充 3rd-review 前置步骤和 worktree 清理规则，不新建 close 入口文件 |

## 档位与 F10 结论

- **档位**：B 档（中等）
- **F10 结论**：四问均有明确答案，新机制有实际案例支撑（ZHI-65），无现有机制可复用，bypass 风险已通过 fail-loud 要求对冲，维护成本在可接受范围。无过度工程警告。
