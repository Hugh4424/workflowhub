# WorkflowHub 整批治理 Inventory

日期：2026-08-25  
基线：`74a246ea542d82b1fd0d00bc721b0890911c3d52`  
工作树：`codex/workflowhub-batch-governance-20260824`  
边界：只读盘点；未改 WorkflowHub 代码、未 commit、未 push。原始 checkout `/Users/Hugh/Hugh/Project/workflowhub` 只读，且存在用户未提交修改。

## 1. 规模与事实

- UI contract 合并前后累计改动：相对 `7c44651`，23 个文件，`+925/-55`。
- trust recovery 合并相对 UI contract 基线：42 个文件，`+3685/-435`。
- 当前仓库扫描：runtime/tools/core 161 个文件，skills/workflows 203 个文件，tests 144 个文件。
- skill closure：36 个 skill bundle、8 个 review-bundle；bundle hash 与发布闭包定向检查通过。
- local skill dispatch：5 个 stage smoke 通过；stage invocation + legacy-zero：10 项通过。
- 聚焦质量链测试：6 个文件、78 项通过；另一组 runtime 定向检查为 6 个文件、124 项通过。两组是不同测试集合，不合并计数。
- 全量 `npm test`：`Test Files: 14 failed | 151 passed (165)`；`Tests: 34 failed | 1829 passed | 24 skipped (1887)`；`Exit code: 1`。失败事实保留，不归零、不伪装 release。

## 2. 当前唯一事实主链

```text
wh-review broker
  -> review_fact_intent
  -> stage-runtime 当前 task/snapshot/material revision 鉴权
  -> TaskKernel.publishVNextQualityFact
  -> quality/facts/<sha256>.json
  -> freshness
  -> deriveStageCompletion
  -> task-close / release-status
```

确认的 owner：

| 领域 | 当前 owner | 真实 consumer | 完成 oracle | 失败语义 |
| --- | --- | --- | --- | --- |
| Quality fact 写入 | `TaskKernel.publishVNextQualityFact` | stage runner、close、release | immutable fact identity + bytes hash | 身份冲突 fail-closed；同 identity 同 bytes 幂等 |
| 当前 snapshot/material | `TaskKernel.currentContext` | review、freshness、completion | current tree + current material revision | 不匹配拒绝当前 fact |
| stage material scope | `STAGE_FACT_MATERIALS` | stage runner/freshness | 阶段允许材料集合 | 越界材料拒绝 |
| serious finding | `isActionableSeriousFinding` / review disposition | verify-code、completion、close | finding 保留且未被处置 | `missing/findings`，不是 pass |
| stage completion | `deriveStageCompletion` | status、close、release | current facts + freshness + AC | 缺失/stale/unavailable 保持 incomplete |

## 3. Runtime / TaskHandle / bridge

| 表面 | 真实 consumer | 当前判断 | 保留/合并/删除边界 |
| --- | --- | --- | --- |
| `TaskHandle.writeRecordAtomic/createRecordAtomic` | legacy/task facts、monitoring、部分 skill | 公共 TaskHandle 可写范围与“TaskKernel 唯一质量 writer”注释不完全一致 | 收紧 `quality/**` 等 Kernel-owned 路径；保留普通非 canonical record 写入；测试 fixture 改走正确 writer |
| `TaskKernel.publishVNextQualityFact` | stage runner、freshness、close/release | 正式 quality fact 唯一 writer | 保留；不得新增第二 writer |
| `runtime/evidence/quality-store.mjs` | mini-task/legacy/status 兼容路径 | 仍有真实 legacy consumer；不能直接删除 | 保留为隔离兼容 writer；禁止写 canonical vNext quality root；所有 reader 迁移后删除 |
| `runtime/task/task-store.mjs` 的 `quality/verify.json` | bootstrap、status、public behavior、per-AC authority | 仍是当前兼容投影，不等同独立质量真相 | 暂保留只读/兼容投影；不能与 `quality/facts` 争主；所有 reader 迁移后删除 |
| `core/artifact-dir.mjs::reference` | artifact consumers | 同名方法重复定义，前实现被后实现覆盖 | 删除死实现；保留后一个真实实现 |
| `stage-completion-facts` + `stage-handlers.addCompletion` | stage result/disclosure | 有重复完成语义；主 oracle 已是 `deriveStageCompletion` | 保留 disclosure adapter；移除独立状态机含义和重复判定 |
| `deriveStageCompletion/deriveCurrentProductRelease` | status、close、release | 当前主完成 oracle 清晰 | 保留唯一 owner；不新增 persisted status |
| host bridge → outcome adapter → runner | host、stage runner、TaskKernel | 三层校验重复，但 bridge 是不可信边界，runner 最终鉴权不能删 | 共享纯 validator；保留 bridge 边界校验与 runner 最终认证 |
| bridge replay | stage outcome publication | 同 attempt 同字节幂等；异字节 `BRIDGE_REPLAY_CONFLICT`；缺失 outcome `unavailable` | 保留；这是现有 immutable publication 语义，不是第二状态机 |
| `TaskHandle.listStageAttemptRefs` + legacy `results/.../attempt-*` | make-decision stage context 的旧读取 | API 近似 retired，但旧读取仍存在 | 先清理所有 `validate-attempt`/旧 baseline reader；再删 API和兼容路径 |
| fact collector v1/v2 | monitoring、fact-indexes | 双轨仍有真实 reader | 暂保留；全部 v1 reader 迁移后删除 v1 |
| review/test evidence status | completion/freshness | review 损坏偏 missing，test 损坏偏 unavailable；语义不同 | 不合并；补契约测试，避免偷换失败语义 |

## 4. Quality intent / provenance / freshness

| 表面 | 当前事实 | 风险 | 治理边界 |
| --- | --- | --- | --- |
| `quality_fact_intent` vs `review_fact_intent` | 没有两个独立 producer；实际 schema/传输名是 `workflowhub-quality-fact-intent.v1` / `review_fact_intent` | 术语漂移会误导 owner 和 consumer | 只保留 `review_fact_intent` 作为传输字段；文档统一，不新增 adapter object |
| `material_revision` | 基于当前四份材料 | 绑定材料事实，不能只看 tree | 保留为全局当前材料 owner |
| `material_scope_revision` | 阶段固定输入范围 | 与全局 revision 语义不同 | 保留，不合并；二者均进入 freshness/identity |
| `snapshot_tree` | 当前 source tree 绑定 | 不能代替 material revision | 保留作为 source identity，不当 selector/gate |
| review provenance | provider/profile/model、attempt/result/finding 原始事实保留 | 摘要可能遮蔽来源 | 保留原始 provenance；不可用不改为空 findings/pass |
| serious finding | `unavailable`、stale、hash mismatch、actionable serious 都不能变成 pass | 误删或降级会制造假绿 | 保留当前 fail-closed 语义 |
| `material_id` | 主要做 intent ↔ review evidence 相等性绑定 | 仍需确认是否由当前 canonical evidence 重算，存在旧 packet 重放风险 | 后续只补当前 TaskKernel/stage-runtime 认证；不新增 evidence store |

## 5. Verify-code 的双 `code_review` seam

存在两条生产链：

1. `wh-review`：broker → `review_fact_intent` → stage runner → quality fact。
2. `dsh-code-review`：stage-agent outcome → host bridge → stage runner `code_review`。

当前正式质量事实读取 `receipts.quality_review`，而 stage outcome 也携带 `code_review`；没有明确的 `result_ref == review_fact_intent.evidence[0].ref` 绑定。

影响：stage outcome 可能展示 dsh 结果，close/quality fact 使用 wh-review 结果，二者可能不一致。此项不是新增 provider，而是统一同一 canonical result/ref/hash，或把两个结果改为不同 subject 名并明确各自 consumer。

## 6. Skill catalog / dependency / bundle

运行时事实源应是 `workflows/*/skill-deps.yaml` 加 `skills/wh-review/stage-skill-plan.json`；catalog 是描述性投影，不应反向制造 consumer。

| 条目 | 实际消费 | 漂移/判断 | 处理边界 |
| --- | --- | --- | --- |
| `decision-log`、`talk-with-zhipeng`、`grill-with-docs` | make-decision | 真实消费明确 | 保留 |
| `spec-clarify/spec-specify/spec-research` | build-spec；spec-research 也被 build-plan 使用 | 基本一致 | 保留，纠正文案如有需要 |
| `spec-plan/spec-tasks/plan-eng-review` | build-plan | `spec-plan.used_by_stages` 虚报多个 stage | 修正 catalog，只写真实 stage |
| `spec-analyze` | make-decision/build-spec/build-plan/build-code | 一致 | 保留，仍是唯一 stage-end lens |
| `dsh-code-review` | verify-code | 一致 | 保留，需与 wh-review code review seam 对齐 |
| `wh-review` | 五个 stage，内部递归 lens | release 实际递归打包，但 catalog 闭包只写自身 | 补 effective closure 表达；不新增 bundle |
| `review` | 实际 delegated 到五个 stage，catalog 只写三 stage | consumer 漂移 | 修正 `used_by_stages` |
| `ui-project-init/design-source-readiness` | build-spec | catalog 写空 consumer | 修正 catalog；不新增 UI stage |
| `frontend-component-quality` | build-plan/build-code/verify-code | catalog 写空 consumer，旧测试仍断言空 | 修正 catalog 和测试 |
| `testing-system-blueprint` | build-plan | 文案声称 build-code consumer，但 manifest 排除 | 修正文案，不新增 dependency |
| `backend/frontend/fullstack-slice-testing` | build-code 条件依赖 | 一致 | 保留 |
| `requirement-lineage` | 仅 config 注册，无 manifest/runtime import | 幽灵 skill | 删除 catalog/bundle/注册项；保留历史决策文本 |
| `qa-only/verify-change` | 无 manifest/wh-review stage consumer | 与 verify-code+dsh 重复 | 删除 catalog/review-bundle；保留历史记录 |
| `resolving-merge-conflicts` | 无当前 host/procedure consumer | 仅声明不触发 | 删除 skill 声明/bundle；close 文档保留必要步骤 |
| `isolated-browser-qa` | verify-code workflow 文档有引用，manifest 无实际消费 | 两套边界重复 | 保留现有 verify-code workflow 文档；无 standalone consumer 则删除 standalone catalog/bundle |
| `anysearch`、`debate`、`diagnosing-bugs` | standalone/外部能力，不是 stage dependency | 不应伪装成 stage skill | 只有明确 operator/CLI consumer 才保留 bundle，否则删除 |
| `mini-task`、`workflowhub-host-protocol`、`workflowhub-multica-sync` | 需逐项核对 CLI/operator 入口 | 非正式 stage consumer | 有真实入口则保留并注明 standalone；无入口删除，不接入 stage |
| absorbed/rejected/watch 条目 | 只有 decision catalog | 非 callable | 保留历史决策，不创建 bundle |

## 7. Registry / 旧记录

- `skills/reuse-registry.md` 与 `docs/reuse-registry.md` 并存；当前机器真相应只保留 skills registry，另一份改成历史说明或删除重复表述。
- 旧 `receipts/`、`reviews/`、`evidence/` 不能冒充当前 quality namespace；read-only 测试保留。
- 旧 flat attempt ref `quality/reviews/attempts/mini-task.json` 当前会被 canonical path 判 stale。若没有真实历史 reader，删除旧 fixture；若有真实 reader，只保留最小只读 adapter。

## 8. 测试失败分层

| 层 | 事实 | 治理判断 |
| --- | --- | --- |
| review policy/fixture | `final-cutover-guards.red.test.mjs` 14 项，缺 `wh_review.v2` policy | 契约/fixture 漂移，不能用修复 writer 掩盖 |
| legacy writer | `minimal-task-storage`、`projection-replacement` 等仍期待旧 quality-store writer | 明确 legacy 兼容边界；迁移或保留只读，不恢复第二 vNext writer |
| old review path | `verify-freshness-selection` 使用旧 flat attempt ref | 迁移/删除 fixture，或证明真实 reader 后加最小 adapter |
| runtime/session | vnext e2e、interrupted recovery、runtime-mode、component receipts | 需要区分 host/session 环境事实与治理代码；保留 unavailable/timeout |
| structure/docs | foundation inventory、requirements completeness、filled-plan validator | 目录/文本与当前契约漂移，先对账再改实现 |
| status semantics | `quality_status=passed` 可能与 `status=in_progress` 并存 | 收紧语义，不能让 quality summary 冒充 completion/release |

## 9. 明确不新增

- 不新增 public stage。
- 不新增 public gate。
- 不新增第二状态机、第二 writer、第二 evidence store。
- 不新增 compatibility ledger、latest pointer、per-round writer、replacement state object。
- 不把 catalog 对账测试升级成工作许可；它只产生质量事实。

## 10. 执行交接

本文件前文是只读调查快照；之后的一次性治理在独立 worktree 中执行，未写入原始 checkout，未 commit/push/merge。

- 已执行：`dsh-code-review` canonical `code_review` 与 wh-review `independent_review` advisory 的 ref/hash seam；`TaskHandle` 的 `quality/facts/**` kernel-owned 边界；catalog projection 修正；已有 wh-review bundle 哈希同步；漂移测试夹具修复。
- 未新增：public stage、public gate、状态机、writer、evidence store、skill 或 bundle。
- 未删除：仍有真实 reader 的 `quality/verify.json`、legacy quality-store、旧 registry 和 ghost 条目；reader migration、删除 oracle 和历史只读迁移另开任务。
- 验证：skill closure 与 5-stage local package smoke 通过；vNext official stage 37/37 通过；全量 `npm test` 仍按前文基线保留失败，不能称绿色或 release。
