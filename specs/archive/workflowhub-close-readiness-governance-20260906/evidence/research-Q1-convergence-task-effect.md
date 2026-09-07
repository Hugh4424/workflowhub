# 取证：问题 1 — requirement-convergence-depth 任务实现效果评估

> 取证人：make-decision 主会话；取证时间：2026-09-06（make-decision step 11 暂停期间）
> 任务材料：specs/archive/workflowhub-requirement-convergence-depth-20260905/（归档）
> 本文件用途：为 R-007（问题 1 分析）提供证据与结论，供 Talk 与审查引用。

## 一、实现落盘核查（以 main 工作树为准，HEAD=b16d5bcf）

**基线事实**：该任务已合并进 main（merge `699f0a6f`），实现提交为单个分支提交
`5a3af360 "workflowhub ephemeral workspace snapshot"`（父=189f89e8，64 文件 +7153/−150，
无逐 phase 提交，实施过程被折叠为单快照）；随后 `b16d5bcf` 将任务四材料归档到
`specs/archive/`。

### 8 个 phase 落盘状态（子代理审计 0b2049cb）

| Phase | 状态 | 证据（文件:行号） |
|---|---|---|
| P1 契约基础（pair_id/role/disputed + material_id 对齐） | ✅ 已合入 | `runtime/review/schemas/result.schema.json:20-22`、`attempt.schema.json:50-51`；`skills/wh-review/scripts/simple-review-runner.mjs` materialIdForInput |
| P2 红蓝双发 | ✅ 已合入 | `simple-review-runner.mjs:524` isPairedMakeDecisionInput、`:592-593` red/blue_incomplete；`canonical-review-result.mjs:92-96` disputed/consensus；`review-materials.mjs:958-984` role 分支（含 build-spec AC 专项） |
| P3 争议对话闭环（acceptReviewRisk/ask_user_reply） | ✅ 已合入 | `runtime/review/stage-review-disposition.mjs:7,82-110`（user_decided/source=user_reply）；`runtime/task/task-kernel-implementation.mjs:942`；`stage-runtime.mjs:717`；`workflows/make-decision/steps.json` step 14（Talk4 条件轮）；`workflows/build-spec/SKILL.md:195` |
| P4 debate v2（4 子代理+mailbox+2 轮封顶+法官禁言） | ✅ 已合入 | `skills/debate/SKILL.md:53,111-115` + references/ 4 文件 |
| P5 deep-research | ✅ 已合入 | `skills/deep-research/SKILL.md`+skill-bundle.json；`skills/catalog.yaml:59`；`stage-reflection/SKILL.md:66` |
| P6 执行模型 D-608（M/S/B/P） | ✅ 已合入 | `workflows/make-decision/SKILL.md:279` |
| P7 决策记录（决策链字段/轻量提醒） | ✅ 已合入 | `tools/cli/check-decision-log-chain.mjs`（advisory exit 0）；`runtime/run-checks.mjs:122-125`；`skills/decision-log/SKILL.md:21,46-48` |
| P8 治理登记（AGENTS.md 只跑受影响测试/CONTEXT.md） | ✅ 已合入 | `AGENTS.md:21`；`CONTEXT.md` 术语登记 |

**结论：落盘率 ≈100%。** 8 phase 与 10 项关键能力点全部在 main 工作树找到，与 spec/plan 一致，
无缺失项。本任务绝大多数改动为**技能文本层**（执行模型、问答工具卡、mailbox 契约），
运行时代码仅 P1/P2/P3 三处，符合"薄核心、窄契约、能力下沉技能层"的宪法取向。

## 二、实际使用核查（以当前任务 make-decision 执行事实为准）

| 升级能力 | 本任务是否真实使用 | 证据 |
|---|---|---|
| 红蓝双发（P2） | ✅ 方向审查 pair_status=complete；细节审查 pair_status=partial | `evidence/direction-review/result.json`（pair_id=56c91fcb…）；`evidence/detail-review/result.json`（pair_id=263bd8f5…，10 个 role 结果：6 completed/4 failed） |
| 四队辩论（P4） | ✅ 4 独立子代理 + mailbox 交叉质询 1 轮 + 法官裁决 | `evidence/debate/round-1/` 10 文件（案卷/4 立场书/4 质询书/裁决书/mailbox×4） |
| deep-research 流程（P5） | ✅ 内部文献调研子代理 + 历史任务核查子代理，报告落盘 | `evidence/`（research 摘要入 F-017~F-023；核查报告入 F-010~F-016） |
| 结构化 Talk（P3 问答工具） | ✅ 三轮 Talk 12 项问答，每项记录原话 | decision-log "三轮 talk" T-001~T-012 |
| 决策链/轻量提醒（P7） | ✅ check-decision-log-chain 可跑；本文件 D 表带 chain 字段 | decision-log D-001~D-207 结构 |
| execution model D-608（P6） | ✅ 调研/核查/辩论/审查均以子代理派发，主会话只收摘要 | step 4/6b 记录 |

## 三、效果度量（可量化指标）

| 指标 | 数值 | 说明 |
|---|---|---|
| 方向卡体积 | **6.9KB（v3 定稿）** | 简洁可读；一页以内给出方向/范围/边界/风险/延期 |
| 决策条目 | D 系列 6+17+7 条（D-001/002/101/201~207/401/402） | 全部带 choice_reason/consequences/rejected_alternatives |
| 需求-事实-决策覆盖 | R-001~R-006 ↔ F-001~F-030 ↔ D 系列 | 五维闭合（需求框架节） |
| 方向审查 | 23 findings，红蓝完整，1 次轮次收敛 | pair complete，无 provider 失败 |
| 细节审查 | 39 findings，3/5 provider×2role 完成（6/10 任务完成） | pair partial；grok/pi source_id=null 失败（F-030/OPEN-004） |
| 辩论 | 1 轮质询 + 1 份裁决书 | 7 组裁决进入 Talk3，4 项用户确认 |
| Talk | 三轮收敛，12 个决策点 | 无剩余 high/medium 开放项 |

## 四、与历史任务对比（make-decision 阶段体感）

- 用户评价参考："make-decision 还算可以控制"（vs build-spec/build-plan 花费数亿 token）。
- 本任务 make-decision stage 材料总量：decision-log.md 658 行 + direction-card 6.9KB +
  review 结果 2 份（约 130KB）+ debate 10 文件。**对比**：build-spec/build-plan 单任务材料
  常达 300-600KB（见问题 2 取证）。
- 机制效果：Talk→审查→辩论→Talk→Grill→草稿的收敛环在本任务全部真实运转，方向语义
  在 step 10 前全部锁定；step 11 仅剩整体确认（因用户暂停，非质量问题）。

## 五、残余问题（升级未覆盖/放大之处）

1. **红蓝双发放大 provider 不可用**：细节审查 10 个 role 任务中 4 个失败（grok/pi 两个
   provider 双双失败），pair_status=partial → outcome=partial → 完成判定信息不足时只能
   以"已处置+如实记录"收口（RISK-001 已记载）。
2. **provider 与"高智力"分层脱节**：审查实际选中 kimi/coding（编码模型）与
   antigravity/flash（gemini-3.8-flash 快模型），而非配置 tier[0]
   （antigravity/opus、opencode/pax3.8、codex/luna）；tier 存在但选择机制不保证智力层。
   另：grok/grok、pi/v4flash 等 provider 的 `source_id=null` → 身份校验失败
   （PROVIDER_IDENTITY_INVALID），配置可信度缺口（OPEN-004）。
3. **审查 CLI 语义矛盾**：detail review 产物标明"REVIEW_NO_SEMANTIC_RESULT"错误码，
   实际却汇集出 21+18 条语义 findings（组合逻辑怪癖，F-030 已记录）。
4. **实施过程被折叠**：任务实现只有 1 个 snapshot commit，过程无逐 phase 可追溯性
   （对"效果审计"不利，对"交付质量"不构成问题）。

## 六、总体判断（问题 1 结论，三句话）

1. **升级已真实落地并在此次执行中被完整使用**——不是纸面设计：红蓝、辩论、调研、结构化
   Talk、决策链全部有产物、有运行事实。
2. **make-decision 的收敛质量与成本控制确实改善**：把"需求收敛"变成可重复的收敛环
   （Talk 收敛 12 点 + 2 轮异源审查 62 findings + 1 轮辩论裁决），方向卡保持 6.9KB 可读。
3. **用户"make-decision 可控"的体感成立，但控制力来源=该阶段产出量小 + 收敛环存在**；
   升级没有解决、甚至放大了 provider 不可用与智力分层脱节两个问题（留待问题 3 统一处置）。
