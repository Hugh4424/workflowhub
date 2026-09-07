# 取证：问题 2 — build-spec/build-plan 阶段 token 消耗根因与优化方向

> 取证人：make-decision 主会话；2026-09-06。
> 数据源：任务档案层（~/Knowledge/Projects/.../tasks/<task-id>/）、认证 worktree 材料、3rd-review 配置。
> 本文件用途：为 R-008（问题 2）提供证据与结论。

## 一、可量化事实（先说能拿到的数）

### 1.1 系统没有 token 度量（这是第一根因：无法控制无法测量的东西）

| 数据源 | token 字段 | 实际值 |
|---|---|---|
| `tasks/task-metrics.jsonl`（全局指标文件，仅 6 行） | `tokens` | **全部 null** |
| 各任务 `task.json`/`index.json` | 无 | 纯元数据 |
| `quality/reviews/attempts/*/attempt.json` 的 provider usage | 仅 **failed** 调用有值 | 见下 |
| 全部 `quality/stage-reflection/*.json`、`quality/evidence/stage-outcomes/*.json`、interactions/*.json | 无 | grep "tokens" 0 命中 |
| ~/.local/state/（opencode 等） | 无 usage 统计 | 只有 model.json/prompt-history.jsonl |

**唯一真实 usage 值（全部来自失败调用，合计约 145 万 token）**：
- build-plan review grok-4.6（failed）：`total_tokens=534,365`（input 266,208 / cache_read 259,776 / output 8,381 / reasoning 7,800）
- 同轮 pi/v4flash（failed）：totalTokens=161,372
- build-plan review 第 2 轮 grok：148,721；make-decision review grok：136,867 与 121,826；deepseek-v4-flash：94,043 与 56,526
- 唯一带 cost 的 completed 调用（20260828 任务 pi/coding）：totalTokens=66,872，cost=0.0669 USD

**结论**：主阶段（spec/plan 起草与处置的 stage agent）token 消耗在档案层**零记录**；"几亿 token"无法从档案层证实或证伪——该数字大概率来自 CLI 客户端/Web GUI 本地统计（opencode、Claude Code、DSH 会话页），**任务档案层不下发**。

### 1.2 可量化的"材料规模 × 轮次"代理指标（成本结构证据）

| 任务 | 阶段 | 指标 | 数值 |
|---|---|---|---|
| WH requirement-convergence | build-spec | review 输入字符 | raw 7,449 + decision 71,495 + draft_spec 40,381 = **119,325 字符**（input.json 210,733 字节） |
| 同上 | build-plan | review 输入字符 | 7,449 + spec 45,643 + acceptance 11,466 + plan 67,204 + tasks 150,408 = **282,170 字符**（input.json 432,482 字节；曾致审查客户端 600s 超时） |
| 同上 | build-plan | tasks.md 最终体积 | 206,736 字节（272,705 字节含归档版；43 张任务卡） |
| 同上 | build-plan | 审查轮次 | 2 轮（第 1 轮 5 provider：kimi✓ antigravity✓ grok/pi/codex✗；第 2 轮 3/5 完成） |
| PB T12 | build-spec+plan | 材料体积 | spec 36,413 + plan 17,534 + tasks 7,825 = **61,772 字节** + research 6 份 203KB + design-prompts 17KB |
| PB T12 | 全部 | 提交历史 | tasks.md 被整篇修订 5 次、spec.md 3 次、plan.md 3 次 |
| 本任务（make-decision） | 对比 | 材料体积 | decision-log 658 行 + direction-card 6.9KB + review 结果约 130KB + debate 10 文件 |

### 1.3 审查 provider 完成率（放大因子证据）

- **convergence 任务**：make-decision 4 次审查 16 个 role 任务：12 completed / 4 failed（75%）；build-spec 1 次 2/3；build-plan 2 轮 2/5、3/5；build-code 6 available + 2 TIMEOUT + 1 CANCELLED；verify-code 0 provider（unavailable）。
- **失败模式**：grok-4.6 `PROVIDER_IDENTITY_INVALID`（source_id=null）、pi/v4flash `PROVIDER_OUTPUT_INVALID`、codex/luna `PUBLIC_RESULT_INVALID`/`EVIDENCE_ANCHOR_INVALID`。
- 即：**每次审查约有 1/3~1/2 的 provider 调用为空转**（失败仍然烧 token——失败调用恰恰是唯一有 usage 记录的那些，单次高达 53.4 万 token）。

## 二、成本构成模型（为什么一个任务 spec+plan 要烧这么多）

设 token 密度按中文 1 字符≈1 token 保守估算：

| 构成 | 量级估算 | 依据 |
|---|---|---|
| ①材料本体（4 份材料 + 证据） | 30-60 万 token | WH 任务 587KB；T12 121KB+203KB 调研 |
| ②主会话全文重读（起草→审查→处置→终检→修复→复查，每轮全量） | 材料×8~15 次 ≈ **300-900 万** | read 工具每次返回带行号全文；findings 处置逐条引用原文 |
| ③审查输入（每 provider 读全量材料） | build-spec 12 万×3 + build-plan 28 万×5×2轮 ≈ **320 万** | 实测字符数（§1.2） |
| ④审查失败空转 | +15-50% | §1.3（失败调用单次 5-53 万 token） |
| ⑤子代理上下文（调研/起草/处置各自完整读材料+工具输出） | 每子代理材料级输入，约 20-60 万×6-10 个子代理 ≈ **200-600 万** | T12 3 路调研、WH 4 路调研 + 起草/处置子代理 |
| ⑥模型生成输出 | tasks.md 21 万 + plan 7 万 + 每次修订重写全文 ≈ **100-200 万** | 实测字节 |
| ⑦编辑往返开销（无差分心智：改一处后全文重读再校验） | 混入②；templates 口径返工 2 轮 | WH 建 plan 返工两轮记录 |

**合计量级：单任务 spec+plan 阶段 1000 万~3000 万 token（仅档案层可量化部分）。
"几亿"需要叠加 CLI 客户端/Web GUI 的会话全量（每轮携带全部历史上下文+截图+工具输出），
在 DSH 交互式界面下完全可能达到——结构一致，绝对值无法验证。**

## 三、根因分层（为什么 make-decision 便宜而 build-spec/plan 贵）

| 层 | 根因 | 证据 |
|---|---|---|
| 结构性 | **无 token 度量**：task-metrics.jsonl 定义了 tokens 字段但从没采集（全 null） | §1.1 |
| 结构性 | **材料体量随阶段递增**：decision-log 58KB → spec 86KB → plan 109KB → tasks 273KB；make-decision 方向卡 6.9KB | §1.2 |
| 结构性 | **审查是全量材料注入**：28 万字符 ×5 provider ×2 轮；无"摘要层+引用层" | §1.2 |
| 结构性 | **红蓝/异源审查只强化了 make-decision**：isPairedMakeDecisionInput 限定 make-decision；build-spec/plan 无差分审查也不差（单发）但同样全量 | simple-review-runner.mjs:524 |
| 流程性 | **主会话（工头）仍在读全量**：R-020/D-608 只把"起草/调研"下放，没有把"发现复用/处置/复查"下放；findings 处置 39 条×每条约 1-2KB 引用都在主会话 | 本任务与 WH/T12 执行记录 |
| 流程性 | **无差分级校验**：机检每次全量跑（结构机检+终检），改 1 处也要重跑全部 | WH 建 plan "修正依赖图卡号+结构机检" |
| 流程性 | **模板口径不统一造成返工**：任务卡 ID 写法/固定措辞与机检器不一致 → 返工两轮（已写入 lessons） | WH 会话复盘 |
| 机制性 | **provider 失败空转**：失败调用反而烧最多（grok 53.4 万/次），且配置 source_id=null 是已知未修复问题（OPEN-004） | §1.3 |

## 四、优化方向（候选机制，供 Talk 收敛）

| 候选 | 内容 | 对成本预期效果 | 风险/代价 |
|---|---|---|---|
| OPT-A 材料分层索引 | 每份材料生成 compact index（节/摘要/行号），主会话默认读 index，按需读片段（文件 offset+limit） | 主会话读量 -70~85% | 索引与正文可能漂移（需联动更新）；多一个文件/持久对象治理 |
| OPT-B 子代理派发扩展 | D-608 执行模型从 make-decision 扩展到 build-spec/build-plan（起草、findings 处置、终检复查、调研全部子代理化；主会话只审摘要） | 主上下文占用显著下降；token 总量不一定降（上下文转移不等于消除） | 派发编排成本（任务卡组装）、子代理质量不均 |
| OPT-C 审查瘦身 | 审查 payload 从"全量注入"改为"摘要+关键段+文件引用"（子代理读文件而非注入）；或对超大材料自动分片 | 审查输入 -60~80% | 审查者可能漏上下文 → 需评估 FIND 召回影响 |
| OPT-D token 度量和预算 | 每阶段记录执行/审查的 input/output token（host 提供 usage → 写入 facts/指标）；阶段预算提醒（80% 预警） | 先有度量才能管理；预算抑制失控 | 触碰"不新增持久对象"边界——以 facts 事实记录形态落地，不新建 store |
| OPT-E 差分级校验 | 机检输出"差异检查清单"（只报变更处违规），不做全量复查 | 复查轮次 -50% | 校验器改动面；可能的漏洞（跨节一致性检查仍要全量） |
| OPT-F 模板单源 | 任务卡模板与机检规则同源（模板驱动校验配置），消除口径返工 | 返工轮次 -1~2 | 模板/校验器重构 |
| OPT-G 审查可靠性 | 修复 source_id 缺失（OPEN-004）；失败重试策略（重试=同 provider 或换 provider）；异源完成率作为 route 选择信号 | 空转 -15~50% | 配置修复属现有开放项；重试成本 |

## 五、问题 2 结论（三句话）

1. **主因不是"模型笨"，而是"机制缺度量 + 材料全量重读 + 审查全量注入 + 往返轮次多"**；
   make-decision 之所以便宜，是因为它材料小（6.9KB 方向卡）且有收敛环（Talk→审查→辩论→Talk），
   while build-spec/plan 承担了"把决策翻译成 300-600KB 规格"的全部重量且无同等收敛环。
2. **可以做 make-decision 式上下文管理/子代理派发优化**，且与 make-decision 升级同构
   （M/S/B/P 执行模型 + 独立审查 + 收敛环），但需要先补 token 度量（OPT-D），否则无法验证优化效果。
3. **建议组合**：OPT-A+B+C+F（立竿见影、不动宪法边界）+ OPT-D（先度量）+ OPT-G（配置修复，
   属既有 OPEN-004 范围）。OPT-E 視投入产出可延后。
