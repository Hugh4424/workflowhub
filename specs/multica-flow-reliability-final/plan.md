# WorkflowHub × Multica 流程可靠性修复实施计划

## 1. 计划基线

- canonical task：`workflowhub/multica-flow-reliability-final`
- 实施分支：`task/workflowhub/multica-flow-reliability-final`
- 起始基线：`8c83722ff275d13294a5ad9315041dd46ac05d56`
- accepted spec：`specs/multica-flow-reliability-final/spec.md`
- 实施原则：先修 WorkflowHub 宿主无关缺陷，再更新 Multica 配置；全过程不修改 ZHI-102、ZHI-184。

## 2. 交付边界

### WorkflowHub 仓库

只修改现有 runtime、core、五阶段 Skill、human brief 和测试。下列复用目标已在当前基线确认存在；最终是否需要修改由阶段 0 的提交取舍和 RED 证据决定，不把路径清单当成必须全部改动：

- `scripts/stage-runtime.mjs`
- `core/stage-runner.mjs`
- `core/stage-handlers.mjs`
- `core/task-kernel-implementation.mjs`
- `core/git-checkpoint.mjs`
- `core/workspace.mjs`
- `core/task-close.mjs`
- `scripts/task-close.mjs`
- `skills/wh-review/scripts/review-runner.mjs`
- `skills/wh-review/scripts/review-source.mjs`
- `docs/human-brief-template.md`
- `workflows/{build-spec,build-plan,build-code,verify-code}/SKILL.md`
- 对应现有测试文件。

只有在现有测试文件无法承载跨阶段 E2E 时，才新增测试文件；不新增生产依赖、后台服务、通用状态机、schema、Multica adapter 或 Coder Skill。

### Multica 线上配置

只原位修改：

- 工头、五个 Stage Agent、Coder 的 instructions；
- 现有 Squad instructions；
- 五个现有 WorkflowHub Skill 的内容。

保持 Agent、Squad、Skill ID 和绑定不变；不新增对象，不把 Multica 逻辑写进 WorkflowHub。

## 3. 执行顺序

```text
基线取舍
  ├─ WorkflowHub runner/阶段/证据/返工修复
  ├─ WorkflowHub close 修复
  └─ Multica 配置草案与静态审查
          ↓
WorkflowHub 全量测试 + build-code 独立审查
          ↓
原位发布 Multica 配置并回读
          ↓
外部小项目 Canary
          ↓
合并 WorkflowHub → 归档本任务 → 清理本任务资源
```

WorkflowHub 代码修复和 Multica 配置草案可以并行准备；线上部署必须等 WorkflowHub candidate 冻结。Canary 必须在部署后执行，旧任务必须在 Canary 成功后串行恢复。

## 4. 分阶段实施

### 阶段 0：基线与事故提交取舍

目标：只带入已证实必要的修复，避免把 detached 事故链整串合并。

动作：

1. 记录 local main、origin/main、当前 accepted spec checkpoint 和事故 detached commits。
2. 按 FR/AC 检查事故提交：已有且正确的保留；缺测试的先补测试；超范围的拒绝移植。
3. 冻结改动文件 allowlist、现有测试基线和无 Multica 核心测试结果。
4. 建立需求—测试—证据台账，只用 Markdown，不新增 runtime schema。

完成标准：

- 没有 merge/cherry-pick 整段事故提交历史；
- 每个拟改文件对应至少一个 FR/AC；
- 当前回归基线和已知失败可重现。

### 阶段 1：runner 身份与自动阶段闭环

目标：消除 runner 自托管递归、accepted 后停住和错误 Workspace 写入。

动作：

1. 在现有 task/bootstrap/runtime 入口记录宿主无关 `runner_root/runner_oid`。
2. 每次 stage 写入前回读 runner OID；candidate Workspace 只能承载业务候选，不得充当 runner。
3. 只允许显式 migration 更新 runner 身份；漂移时在任何 task/Workspace 写入前 fail-loud。
4. build-spec、build-code 的 `run` 在 attempt 发布成功后调用现有 accept；模拟 publish 后中断时，由现有显式 `accept` 恢复。
5. 保持 make-decision、build-plan、verify-code 和 close 的人工边界不变。

测试：

- runner OID 匹配/漂移；
- runner 与 candidate 分离；
- build-spec/build-code 自动 accepted；
- publish 后中断再 accept；
- 其他人工边界未变化。

完成标准：AC-002、AC-003 全部通过。

### 阶段 2：receipt、review 和质量事实

目标：消除 create-only `EEXIST`、重复审查、假 pass 和质量事实丢失。

动作：

1. build-spec/build-plan 先形成草稿，执行一次初审；有实质 finding 时只允许一次修订复审；最后只写一次正式 receipt。
2. 正常任务不创建 revision receipt，不覆盖已有 record。
3. 将 `revise_required`、测试失败、AC gap、provider `unavailable` 写入现有 facts/human brief。
4. 不把这些质量事实升级成新硬门；身份、Workspace、provenance、安全、权限和不可逆授权仍然硬阻断。
5. 保留 `simplicity-guard` 在 make-decision detail、build-spec、build-plan、build-code 的审查材料中。

测试：

- review 修订后无 `EEXIST`；
- 同一业务问题最多初审一次、复审一次、正式 receipt 一次；
- 四类失败事实不可被序列化成 pass；
- provider unavailable 仍可在既有人工边界被看到。

完成标准：AC-004、AC-005 全部通过。

### 阶段 3：checkpoint、AC 覆盖、handoff 与 Coder 合同

目标：让下游一次拿全输入，并在 build-code 当场发现漏验收。

动作：

1. build-code 开工前、implementation receipt 前复查 accepted spec/plan/tasks 和认证 Workspace。
2. 修复合法 no-diff checkpoint；有额外 changed path 时继续拒绝。
3. Code Builder 对每个 accepted AC 输出 `covered/missing/unknown` 和证据引用，写入现有 test evidence/human brief。
4. 扩展现有 human brief 文本：结果、决定、产物、测试/审查、依赖、风险、下一步、canonical refs；不复制大段正文。
5. Code Builder 给 Coder 完整 Phase 卡片：目标、AC IDs、Workspace、允许文件、非目标、测试命令、上游 finding。
6. Coder 在存在正确 seam 时先 RED 后最小 GREEN，运行聚焦测试和必要回归，检查 scoped diff；不得 commit/review/accept/merge/push/close。

测试：

- 合法 no-diff 和额外 changed path；
- AC 漏项进入 `missing/unknown`；
- 下游只读 handoff 即可定位正式产物，不再询问数据根、路径或 AC；
- Coder 行为不越权。

完成标准：AC-006、AC-008、AC-010、AC-011 全部通过。

### 阶段 4：verify 返工闭环

目标：让 fresh verify 发现缺陷后回到原 build task，产生新 attempt，再 fresh verify。

动作：

1. 复用现有 verify failure publication 和 controlled reopen；不新增 generation/recovery 平台。
2. 闭合 `build accepted → verify fail → reopen → revised build accepted → fresh verify`。
3. 保留旧 accepted bytes 和 archive；更新 active accepted pointer；同一 reopen 请求只消费一次。
4. 返工复用原 build-code Issue/Phase；不新建重复逻辑 Phase。
5. 将 verify finding 原样传回 Code Builder/Coder，修复后附证据恢复原 verify。

测试：

- 端到端返工；
- 旧 accepted bytes 不变；
- active pointer 指向新 accepted；
- archive 无冲突；
- reopen 重放快速失败或 no-op；
- fresh verify 不复用旧结论。

完成标准：AC-007 全部通过。

### 阶段 5：close 缺陷修复

目标：让已经验证通过的任务可靠完成 archive、remote 校验和中断恢复。

动作：

1. archive 前创建父目录，保持完整 spec 目录内容不变。
2. `ls-remote` 只有 exit 0 且读到不同 OID 时才报告 baseline changed。
3. 网络、认证、代理错误保留真实 exit/stderr，不伪装远端变化。
4. 同 plan 且零 Git 写入时复用原 confirmation；Git 状态已前进时继续使用现有 reconcile。
5. 保持 non-force push、无自动 rebase/rollback 和独立 close 授权。

测试：

- archive 父目录不存在；
- remote OID 变化；
- 网络/认证/代理失败；
- 同 plan 零写入重试；
- 每一步中断后恢复；
- 原 close 和通用 executor 回归。

完成标准：AC-009 全部通过。

### 阶段 6：WorkflowHub 候选验证与审查

目标：证明 WorkflowHub 修复本身独立、完整、没有 V1～V3 式扩张。

动作：

1. 运行所有新增定向测试、现有五阶段 E2E、close、review、Skill closure 和完整测试。
2. 在无 Multica 环境运行 WorkflowHub 核心测试和 anti-host 扫描。
3. 检查 diff allowlist、依赖、生产文件数量和是否出现新 schema/service/platform。
4. 生成冻结 build-code 材料；OpenCode 和 Kimi 审同一快照。
5. 人工复核 reviewer finding：只接受与 accepted spec、事故证据和 simplicity 原则一致的 finding。

完成标准：

- AC-001～AC-011、AC-017 可重算；
- 全量测试通过；
- 两个异源 provider 无 blocking/major；
- 没有 Multica 代码进入 WorkflowHub。

### 阶段 7：Multica 配置发布与外部 Canary

目标：用真实平台证明留言、升级、交接、触发、generation、状态和最终收口。

发布前：

1. 等全部相关 Agent idle。
2. 导出工头、五个 Stage Agent、Coder、Squad 和五个 Skill 的现状快照。
3. 对 Prompt/Skill 做静态对照：每条规则必须对应 FR-012～FR-019，不加无来源规则。

原位更新：

1. 所有 Agent 使用大白话状态模板和决策卡。
2. 当前 Agent 自修；上游输入错时执行“上游 comment + mention → 修复 → 原下游 comment + mention”握手。
3. 根 Issue、stage、Phase 的 assignee/status/父子结构固定；返工复用原 Issue。
4. 原生 barrier 负责正常推进，return handshake 只用真实 mention；同步命令有界等待，陈旧事件快速 no-op。
5. 单活动 generation；替换后旧链全部 cancelled。
6. verify accepted 后继续 close，工头最后清理所有子 Issue 再关闭父 Issue。
7. 五个 Skill 原位覆盖，Coder 不绑定完整 build-code Skill。

回读：

- Skill ID、supporting files、Agent 绑定、Prompt 和 Squad instructions 与计划一致。

Canary：

1. 选择一个非 WorkflowHub 的外部小项目，创建包含两个 Phase 的小任务。
2. 跑完整五阶段。
3. 注入一次确定性 AC 漏项，让 fresh verify 触发一次返工。
4. 验证上游 comment/真实 Agent mention 会在无用户评论、无新 Issue 时产生原下游新 run 并恢复 `in_progress`。
5. 注入一次陈旧或重复 completion，验证快速 no-op。
6. 完成 close；有效链全部 done、废弃链 cancelled、父 Issue 最后 done。
7. 检查 Canary 的全部 Agent comment；统计总时间、run、用户评论、重复 review/test 和人工救火，只写一次性报告，不建监控服务。

失败处理：

- mention 不产生 run、出现重复 generation、无界轮询、重复业务 review/test、用户救火或 close 未清理时，Canary 失败；
- 恢复发布前 Multica 配置快照；
- 不恢复旧任务；
- 真实 mention 触发故障交给 Multica 平台独立修复，不在 WorkflowHub 增加轮询兜底。

完成标准：AC-012～AC-019 全部通过。

### 阶段 8：合并与本任务收尾

目标：交付稳定候选，并只清理本任务资源。

动作：

1. Canary 通过后，按独立 close 计划合并并 push WorkflowHub candidate。
2. 归档本任务的 spec、plan、tasks、测试、审查、Canary 和配置快照。
3. 清理本任务创建的 Canary Issue、worktree 和 branch；保留失败 TaskHandle 作为证据。
4. 不恢复、不修改 ZHI-102 或 ZHI-184；它们由用户自行结束。

完成标准：AC-020 通过，本任务交付和资源清理完成。

## 5. 需求与问题覆盖矩阵

| 用户需求/调研问题 | 实施位置 | 验收 |
|---|---|---|
| 留言说清状态和下一步 | 阶段7 Prompt | AC-012 |
| 决策给推荐和后果 | 阶段7 决策卡 | AC-012 |
| Agent 先自修再返回上游 | 阶段7 握手 | AC-013 |
| 只在真实阻断找用户 | 阶段2、7 | AC-005/012 |
| 阶段交接产物证据依赖 | 阶段3 human brief | AC-010 |
| Coder 会TDD测试留痕 | 阶段3 Phase卡片 | AC-011 |
| 工头最终清理子Issue | 阶段7、8 | AC-016 |
| runner自托管和版本漂移 | 阶段1 | AC-002 |
| accepted后不自动推进 | 阶段1 | AC-003 |
| receipt提前冻结/EEXIST | 阶段2 | AC-004 |
| review重复和假pass | 阶段2 | AC-004/005 |
| no-diff误阻断 | 阶段3 | AC-006 |
| AC遗漏导致晚期返工 | 阶段3 | AC-008 |
| verify返工无法reopen | 阶段4 | AC-007 |
| accepted历史/指针冲突 | 阶段4 | AC-007 |
| close目录和远端误报 | 阶段5 | AC-009 |
| 下游不知道上游决定 | 阶段3、7 | AC-010/013 |
| 重复Phase和多generation | 阶段7 | AC-014/015 |
| barrier不闭合/双触发 | 阶段7 | AC-014/015 |
| 无界等待和人工催促 | 阶段7 | AC-015/019 |
| verify通过但收尾不结束 | 阶段7、8 | AC-016/020 |
| WorkflowHub与Multica独立 | 阶段6 | AC-017 |

结论：用户五项新增要求、ZHI-102/ZHI-184 审计中的共同根因和两个任务各自的真实代码缺陷均有实施动作和可证伪验收；没有把 PR、监控服务、通用 recovery/generation 平台或 Multica adapter 混入当前交付。

## 6. 风险与控制

- **旧事故提交污染 main**：逐提交取舍，禁止整串 merge。
- **runner 身份修复影响现有任务**：先定向回归和无 Multica E2E，再发布 Skill。
- **自动 accept 越过人工边界**：只开放 build-spec/build-code，策略回归锁定其他阶段。
- **质量事实变成新硬门**：只写现有 facts/human brief，审查扫描禁止新 schema/gate。
- **Multica Prompt 变长又互相矛盾**：按角色最小差异修改，逐条映射 FR，部署前后回读。
- **真实 mention 平台不触发**：Canary fail、回滚配置、暂停推广；不在 WorkflowHub 写兜底。
- **Canary 假绿**：必须含两个 Phase、一次 verify 返工、一次 return handshake、一次陈旧事件和完整 close。
- **旧任务相互干扰**：本任务不恢复或修改 ZHI-102、ZHI-184。

## 7. 宪法与简洁性检查

- F7/F8：人工方向、计划、最终验证、close 边界保留；正常自动阶段自动推进。
- F10/Q1/Q2：质量缺口记录为事实，不新增硬门或“证明系统”。
- 独立性：WorkflowHub 无 Multica API/Issue/mention/status/generation 代码。
- 复用优先：使用现有 accepted/checkpoint/reopen/reconcile/human brief/barrier/mention。
- 明确不做：新依赖、新生产服务、新通用状态机、新 schema、新 Skill、轮询兜底、常驻监控。

## 8. 最终证据包

交付完成时必须保存：

- 基线与事故提交取舍表；
- FR/AC 对应测试和结果；
- WorkflowHub 全量测试、Skill closure、anti-host 结果；
- OpenCode、Kimi 对同一冻结快照的审查结果；
- Multica 发布前后配置快照和回读结果；
- 外部 Canary 全部 Issue/comment/run/status/close 证据；
- 用户范围修订记录：ZHI-184、ZHI-102 不在本任务执行范围。
