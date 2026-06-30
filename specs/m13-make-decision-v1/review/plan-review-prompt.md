你是独立异源审查员（codex/gpt），审查 workflowhub 项目 M13 build-plan 阶段产物。这是 dogfooding：用项目自己的 vibecoding 五段流程构建 M13（深化 make-decision 阶段）。

请亲读以下文件（绝对路径）：
- 上游权威 spec：/Users/Hugh/Hugh/Project/workflowhub/specs/m13-make-decision-v1/spec.md
- 决策约束：/Users/Hugh/Hugh/Project/workflowhub/tasks/m13-make-decision-v1/decision-log.md
- 待审 plan：/Users/Hugh/Hugh/Project/workflowhub/specs/m13-make-decision-v1/plan.md
- 待审 tasks：/Users/Hugh/Hugh/Project/workflowhub/specs/m13-make-decision-v1/tasks.md
- 待审 analyze：/Users/Hugh/Hugh/Project/workflowhub/specs/m13-make-decision-v1/cross-artifact-analysis.md
- 剧本（评判依据）：/Users/Hugh/Hugh/Project/workflowhub/workflows/build-plan/SKILL.md

审查重点：
1. 跨产物一致性：plan/tasks/spec 之间术语、步骤数、FR 引用是否一致。**已知疑点：spec 自身在"11 步"与"12 步"间矛盾（line 11/39/47 写 12 步，line 67/69/71 写 11 步，FR-FLOW-01 枚举 S0,S0.5,S1..S10 实为 12 项），plan 跟着写 12 步。请判定正确步数并指出所有需统一的位置。**
2. tasks 完整性：每个 task 是否引用至少一个 FR；依赖排序是否有环或前后矛盾；stage 分组是否合理。
3. plan 是否覆盖 spec 全部 FR（含五动作 + 台账D28 + 六环境变量 + 验收AC）。
4. 宪法检查 21 条是否真实有判据、是否假绿（F9 可证伪）。
5. F10 门：是否有该删未删的过度工程机制。
6. 是否违反项目硬规则：薄核心窄契约、记录态非阻断（D5）、唯一硬门 S9、不自审自判。

输出格式：verdict（pass / revise_required）+ 分级 findings 列表（每条：severity[blocking/major/minor] + 位置 + 问题 + 建议修法）。只报真实缺陷，不凑数。结论写文件 /Users/Hugh/Hugh/Project/workflowhub/specs/m13-make-decision-v1/review/plan-review-r1.md 并在 stdout 给出 verdict 与 blocking 数。