# WorkflowHub 路径与身份架构盲审材料

**Packet ID**：workflow-path-architecture-2026-07-15-v1
**性质**：真实故障调研；修复方案已由 ADR 0005 实施
**盲审要求**：先独立设计，再评价候选方案；不要把候选方案当标准答案。

## 审查任务

从第一性原理回答：WorkflowHub 在任意外部仓库、嵌套工具仓、多 worktree、外部 issue ID
与 workflow run ID 不同时，最少需要哪些稳定身份？哪些状态和兼容机制可以删除？如何让
五阶段、journal、review、route、close 共用一个不易误用的路径模型？

目标是比现状和候选设计更简单、稳定、易用、易维护、抗脆弱。允许删除现有机制、改变
目录模型、改变 CLI/阶段合同或拒绝长期兼容。

## 系统背景

WorkflowHub 有五阶段：make-decision、build-spec、build-plan、build-code、verify-code。
执行记录位于知识库的 `Projects/<project>/tasks/<task>/`；代码修改发生在业务项目
worktree。WorkflowHub 工具仓经常嵌套在业务项目目录内运行。

路径相关对象包括：

- task stage-result、journal、decision-log、evidence、review；
- `worktree.json`；
- spec、plan、tasks 等阶段交接产物；
- 当前执行 task、上游 workflow task、外部 issue ID；
- target repository、实际 worktree、当前命令 cwd。

## 真实症状与复现

业务项目是 KnowledgeDigest。当前 issue 是 `ZHI-138`，真实上游 workflow task 是
`kd-phase0-digest-spec`。从嵌套工具仓执行：

```bash
cd /Users/Hugh/Hugh/Project/KnowledgeDigest/workflowhub
env -u WORKFLOWHUB_TASK_DIR -u WORKFLOWHUB_PROJECT_KEY \
node /Users/Hugh/Hugh/Project/workflowhub/core/task-record-paths.mjs \
ZHI-138 stage-result-build-code.json --must-exist
```

稳定失败：

```text
[task-record-paths] FAIL: task record not found:
/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/ZHI-138/stage-result-build-code.json
```

显式设置：

```bash
WORKFLOWHUB_TASK_DIR=/Users/Hugh/Hugh/Knowledge/Projects/KnowledgeDigest/tasks
```

后，相同命令正确命中 KnowledgeDigest。切到 KnowledgeDigest 根 cwd 也能正确解析。故障由
cwd 的 Git remote 单变量稳定控制。

verify-code 真实报错：Step 1 无法从错误的 workflowhub task 根取得
`stage-result-build-code.json`，随后 `worktree.json`、plan、decision-log 也被报告缺失；
流程 fail-loud，Step 2–6 未执行。

## 已证实的全链路问题

1. `task-dir-parser` 在未显式设置环境变量时读取 `process.cwd()` 的 origin remote，将工具
   Git 仓库身份当成业务项目身份。
2. 五阶段都调用 `resolveTaskRecordPaths(taskId)`，没有传已经存在的显式
   `taskTrackingRoot` API 参数。
3. CLI 没有 `--task-tracking-root`；部分 helper、journal、route、report writer 会再次
   自行调用 parser，导致同一阶段的不同记录可能写入不同项目。
4. 单一 `task_id` 同时承担当前输出身份、上游 workflow 身份和外部 issue 身份。
   `ZHI-138 <- kd-phase0-digest-spec` 无法表达。
5. spec、plan、tasks 大量使用 cwd 相对 `specs/{task-id}`；修正 task record root 后仍可能
   读写工具仓。
6. make-decision 可能从当前工具 checkout 推断 target repo，并把错误固化到
   `worktree.json`。
7. build-spec、build-plan、build-code、verify-code 都假定上游与当前 task ID 相同。
8. verify-code 存在 bootstrap 死结：必须先知道正确 root 才能读取 build-code result，
   但正确 root 只存在于尚未读到的 result facts 中。
9. close/archive 使用 cwd 相对 spec 路径；branch 与 commit 前缀多处写死 `workflowhub`。
10. review 主入口要求显式 root，但 route/index 旁路仍可能 fallback parser。
11. worktree cleanup/close 没有统一 owner/context enforcement。
12. legacy migration 接收多条路径，却不证明它们属于同一 project/task/producer。
13. 相关 24 个测试全部通过，但 fixture 基本只覆盖 workflowhub remote、same-task 和 API
    显式 root；没有嵌套外部项目、CLI root、双 task ID 或 verify-code lineage 测试。

## 不能接受的修复

- 复制、补造或伪造上游 stage-result、decision-log、spec；
- 搜索目录、猜“最新”、根据 branch/worktree 名模糊匹配；
- 只修 verify-code 或要求用户永远手工 export 环境变量；
- 让五阶段、journal、review、close 各自保留一套路径解析；
- 用长期双模式兼容把复杂度永久保留下来。

## 候选方案 A：ADR 0003 摘要

候选 A 引入显式 `task_tracking_root`、current/upstream 双 resolver、结构化 upstream、
stage-result v2 身份、producer artifact locator、带 journal 的 worktree ownership handoff。
优点是保留现有 task 目录模型并强化审计。疑虑是概念多、迁移面大、handoff 生命周期和
兼容规则维护成本高。

## 候选方案 B：Run 模型草案

候选 B 只保留两个显式事实：绝对 `run_dir` 与 `run.json` 中的 `worktree_root`。

- 一个 workflow 从 make-decision 到 verify-code 永不更换 run 目录或 run ID；
- `ZHI-138` 只是 `run.json.issue_ids[]` 元数据，不产生新任务目录；
- `run.json` 最少包含 immutable run ID、target repo、worktree、status、issue IDs；
- stage 只接收 `--run-dir` 或 `WORKFLOWHUB_RUN_DIR`，禁止读取 cwd remote/config；
- stage-result、journal、review、evidence、spec、plan、tasks 共置于 run_dir；
- spec/plan/tasks 放 `run_dir/artifacts/`，不依赖 producer worktree；
- 默认读取同 run 的前序结果；真正跨 run 复用时显式传绝对 `from_result`，只读 source；
- 唯一 Run module 提供 `openRun()`、`previousResult()`、`artifact()`、
  `publishResult()`；所有 writer 必须使用它；
- 删除 upstream task alias、current/source 双 resolver、worktree handoff journal、artifact
  locator、stage 内 project/config/remote fallback；
- legacy task dir 只作为有期限 adapter，迁完删除。

代价：必须接受 issue ID 不等于 workflow run ID，spec/plan/tasks 默认是外置 workflow
artifact；若需要入业务仓，在 verify 后显式 export/commit。

## 必须评价的问题

1. 根因模型是否完整？
2. 从零设计时，最小概念模型和唯一权威状态是什么？
3. 至少比较两个整体方案，其中一个必须激进简化。
4. cwd、Git remote、env、config、worktree.json、stage-result 分别应该承担什么？
5. current/upstream lineage 是否必要？真正跨 run 该如何表达？
6. 是否需要 handoff、locator、hash、stage-result v2？逐项证明或删除。
7. 如何确保五阶段及所有旁路不再各自解析路径？
8. 如何让错误在入口一次暴露？
9. 如何迁移并最终删除旧模式？
10. 指出候选 A、B 各自正确、过度设计和欠设计之处。

## 输出合同

输出必须是可解析 JSON，不加 Markdown code fence：

```json
{
  "verdict": "replace|major_simplification|adopt_with_changes|adopt",
  "confidence": "high|medium|low",
  "proven_facts": [],
  "unknowns": [],
  "root_cause_model": [{"cause":"","evidence":"","blast_radius":""}],
  "minimal_invariants": [],
  "delete_or_deprecate": [{"item":"","reason":""}],
  "alternatives": [{"name":"","model":"","pros":[],"cons":[],"migration_cost":"","failure_modes":[]}],
  "recommended_design": {
    "summary":"",
    "authoritative_state":"",
    "stage_interface":"",
    "path_resolution":"",
    "lineage":"",
    "worktree_lifecycle":"",
    "failure_semantics":""
  },
  "candidate_reviews": {
    "A":{"keep":[],"remove":[],"change":[]},
    "B":{"keep":[],"remove":[],"change":[]}
  },
  "migration": [],
  "acceptance_tests": [],
  "top_risks": [{"risk":"","mitigation":""}],
  "blocking_questions": []
}
```

至少列出五个可删除/弃用机制。覆盖五阶段、journal、review、route、close。区分材料证明的
事实、推断与未知。不得调用其他 reviewer，不得读取其答案。
