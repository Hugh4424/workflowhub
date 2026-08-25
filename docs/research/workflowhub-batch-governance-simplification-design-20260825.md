# WorkflowHub 整批治理简化设计

状态：已被 `workflowhub-execution-first-redesign-20260825.md` 覆盖；仅保留为历史研究事实，未进入代码。  
原则：审计、合并、删除、简化已有能力；不扩张产品方向，不增加控制面。

## 1. 目标设计

保留一条主链：

```text
五阶段 workflow manifest / wh-review stage plan
  -> 当前四材料与 snapshot/material revision
  -> 一个 review intent 入口
  -> 一个 TaskKernel quality fact writer
  -> freshness / serious finding
  -> 一个 stage completion oracle
  -> status / close / release 消费
```

catalog、旧记录、兼容投影、测试、桥接层都只能描述或适配这条主链，不能反向成为第二真相。

## 2. 保留、合并、删除

| 项目 | 动作 | 唯一 owner | 真实 consumer | 完成 oracle | 失败语义 |
| --- | --- | --- | --- | --- | --- |
| `TaskKernel.publishVNextQualityFact` | 保留 | TaskKernel | stage runner/close/release | immutable identity + hash | 冲突 fail-closed；同字节幂等 |
| `quality_fact_intent` / `review_fact_intent` | 合并术语 | wh-review producer + stage runner consumer | review fact publication | 当前 task/snapshot/material revision 认证 | unavailable/stale/hash mismatch 不得 pass |
| `material_revision` / `material_scope_revision` | 保留两层 | TaskKernel + stage scope | freshness/review/completion | 各自绑定完整材料与阶段范围 | 任一不匹配保持 incomplete |
| `snapshot_tree` | 保留身份字段 | TaskKernel current context | review/freshness/fact | 当前 source tree | 不匹配拒绝 current fact |
| serious finding | 保留并共享判定 adapter | review disposition | verify-code/close | finding 保留且处置完整 | `missing/findings`，不降级 clean |
| `deriveStageCompletion` | 唯一 completion owner | completion-predicates | status/close/release | current facts + freshness + AC | missing/unavailable/incomplete |
| stage completion facts | 降为 disclosure adapter | stage handlers | 用户摘要/diagnostic | 读取主 oracle | 不得写第二状态或覆盖主 oracle |
| bridge/adapter/runner 三层校验 | 合并纯 validator，保留边界 | bridge + runner 各自边界 | host outcome publication | replay/hash/schema/current binding | `BRIDGE_REPLAY_CONFLICT`、unavailable、fail-closed |
| `quality/verify.json` | 保留兼容投影，禁止争主 | task-store legacy projection | 现有 status/public behavior/per-AC readers | 与 canonical facts 一致 | 旧投影不得生成 current quality fact |
| `quality-store` | 保留隔离 legacy | legacy owner | mini-task/legacy reader | legacy contract | 禁写 canonical vNext root |
| v1/v2 fact collector | 暂保留双轨 | collector | 仍在用的 v1/v2 readers | reader migration evidence | 迁移完成前不可删 v1 |
| catalog ↔ manifest 对账 | 合并进现有 closure checker | existing skill closure | CI/diagnostic | manifest + stage plan + catalog projection match | 质量事实失败，不是 public gate |
| 双 registry | 删除重复说明 | `skills/reuse-registry.md` | catalog/维护者 | 唯一当前 registry | 旧文档标历史，不再作为事实源 |
| `requirement-lineage` | 删除无 consumer 的 catalog/bundle/注册 | 无 | 无 | 无 | 保留历史决策文本 |
| `qa-only` / `verify-change` | 删除无 consumer 的 catalog/review-bundle | 无 | 无 | 无 | 不恢复旧 review lens |
| `resolving-merge-conflicts` | 删除无 consumer 的 skill 声明/bundle | close 文档承载必要步骤 | 无当前 skill consumer | 无 | 历史记录保留 |
| standalone `isolated-browser-qa` | 删除重复 standalone；保留 verify-code workflow 文档 | verify-code workflow | 文档消费 | 当前 verify-code procedure | 未执行仍是 unknown |
| `spec-plan`、UI skills、`review` 等 catalog 漂移 | 修正投影 | 各 stage manifest | catalog readers/closure | 对账测试 | mismatch 报告，不阻断工作 |
| `core/artifact-dir.reference` 重复实现 | 删除死实现 | ArtifactDir | 当前调用方 | 单一方法行为 | 既有异常保留 |
| `publishReviewFactIntent` | 先确认外部 API；无 repo consumer 则删除 | stage runner | 当前 repo 无调用方 | 无 | 若外部契约存在则 deprecated 转唯一路径，不新建路径 |

## 3. Verify-code provenance 方案

推荐：不保留两个同名 `code_review` 真相。

最小改法：

1. `dsh-code-review` 仍负责 verify-code 的 stage-agent execution review。
2. `wh-review` 仍可提供异源质量建议，但结果必须写入不同 subject，或统一进入同一 canonical `code_review` ref/hash。
3. close、completion、quality fact 只消费 canonical ref/hash；stage outcome 展示必须绑定同一 ref/hash。
4. 原始 provider result、attempt、finding、provenance 继续保留；不做二次聚合 writer。

若现有外部消费者要求两个结果都叫 `code_review`，先标记 `needs_human`，不得擅自删除或改名。

## 4. 质量状态语义

修正为三件事分离：

- `quality_status`：已写入的质量事实本身是否通过。
- `completion.status`：阶段必需事实、AC、当前性、review/测试是否完整。
- `product_release`：五阶段与逐 AC 完成条件是否满足。

`quality_status=passed` 不能被解释为阶段完成；输出必须显式显示 `status=in_progress` 时仍不可 release。若下游确实需要放行判断，只读 `deriveStageCompletion`/release oracle，不改名、不新增 gate。

## 5. 兼容与删除条件

统一规则：

1. 先找真实 reader/consumer：代码调用、manifest、CLI、测试不是单独充分条件。
2. 有 consumer：保留最小只读适配；禁止写 current fact、close、release。
3. 无 consumer：删除 catalog、bundle、注册、死 fixture 和重复文档；历史决策只读保留。
4. 删除前写明唯一 owner、consumer、oracle、失败语义和回滚点。
5. 旧记录绝不回填为当前 snapshot/material revision；旧失败事实保留。

删除条件：

- `quality/verify.json`：所有现有 status/public behavior/per-AC reader 迁移到 canonical facts，并有同等负向测试后删除。
- `quality-store`：mini-task/legacy reader 全迁移后删除。
- v1 fact collector：全部 v1 reader 迁移并完成旧记录只读验证后删除。
- old flat attempt ref：确认无真实历史 reader 后删除 fixture；否则保留只读 adapter。
- TaskHandle legacy attempt API：所有 `validate-attempt` 与旧 baseline reader 移除后删除。
- standalone ghost skills：当前 repo、manifest、host、CLI 全无 consumer 后删除。

## 6. 测试与维护成本

只增加已有测试层的对账和负向场景，不新增测试框架或 public command：

- catalog ↔ manifest ↔ wh-review stage plan 对账；覆盖 `used_by_stages`、effective closure、幽灵 skill。
- TaskHandle 禁写 Kernel-owned path；保留普通 record 写入测试。
- code review ref/hash 一致性；冲突、缺失、unavailable、serious finding 保留。
- `quality_status=passed + status=in_progress` 明确输出，不得被 close/release 消费为 pass。
- 旧记录只读；旧记录不能冒充 current snapshot/material revision。
- 每个删除项至少一个“无 consumer/旧记录仍可读或明确不可用”的 oracle。

不把上述检查变成新的推进 gate。测试失败只产生 `incomplete`/`unavailable` 质量事实；修复继续留在同一 task。

## 7. 宪法与交付质量影响

- F1/F2：减少重复 owner、重复 adapter 和宽写入口，核心更薄、契约更窄。
- F3/Q2：保留四材料与现有 completion 分离；不把 quality fact 变成推进许可证。
- F4/Q3：保留异源 review、原始 provenance 和 serious finding；不以空 findings 伪造通过。
- F5/F8/F10：删除无 consumer 的 gate/skill/fixture；不为机器可校验新增控制面。
- F9/Q1：保留 fail-closed、unknown/unavailable/incomplete 和当前 snapshot/material binding。
- S7/S8：五阶段和现有可搬运 skill 边界不变；catalog 只修正事实，不新增 stage。

交付风险：删除错误会损害历史读取；双 `code_review` 未统一前不能称 provenance 完整；全量 npm test 当前 34 failures，治理完成前不能称绿色或 release。

## 8. 回滚

- 本批不自动 commit/push/merge；工作树修改可直接丢弃或逐文件回退。
- 任何删除先保留历史决策/归档引用和删除前 inventory；恢复只恢复真实 consumer 需要的最小只读路径。
- 不使用 `git reset --hard`、`clean`、`prune`；不触碰原始 checkout。

## 9. 本阶段结论

- 不新增 public gate/stage/state/evidence writer。
- 不删除当前 TaskKernel quality fact writer、completion oracle、freshness、serious finding 或当前有效 review provenance。
- 优先治理：catalog 对账、幽灵 skill、双 registry、死实现、TaskHandle 宽写入口、双 `code_review` provenance、`quality_status` 语义冲突和旧 fixture/旧 writer 测试漂移。
- 进入代码前仍需 Talk Round 2/3、方向/细节 advice、Grill、用户最终确认。

## 10. 本批执行交接

本设计已按“一次性批处理、不扩张控制面”的边界落到独立 worktree；没有拆成后续零散 WorkflowHub 修改，也没有 commit/push/merge。

- 已落地：唯一 canonical `code_review` owner、已有 advisory subject、当前 ref/hash 绑定、serious finding 保留、kernel-owned quality fact 写入边界、catalog/bundle projection 同步。
- 按设计延期：legacy reader 全迁移、ghost skill/bundle 删除、双 registry 清理、全量测试债务和正式阶段/产品 release 验收。
- 任何延期项继续前都必须另开 reader-migration 或测试债务任务，先给出 owner、consumer、oracle、删除条件；不在 PaperBuilder 任务中顺手加 gate 或对象。
