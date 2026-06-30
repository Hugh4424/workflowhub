# M13 Skill Reuse Classification (D15)

分类依据 D15 三档：照搬开源 / 基于开源优化 / 完全自研

---

## 1. 双路调研 — muyu-search-mcp + anysearch

### 路 A：muyu-search-mcp（本地 MCP 插件）

**reuse_class**: 照搬接入（有必须修复的参数坑）

**upstream source**:
- 本地 MCP 插件，backed by Qwen via dmxapi
- 记忆条目：`/Users/Hugh/.claude/projects/-Users-Hugh-Hugh-Project-multica-agenthub/memory/muyu-search-empty-root-cause.md`

**注坑**:
- 默认 `extra_sources=0` → 零真实检索，LLM 自行编造引用（纯幻觉）
- **必须显式传 `extra_sources>=3`** 才有真实检索（Tavily/Firecrawl 后端）
- 完成后必须调用 `get_sources` 核对真实来源；`get_sources` 无法核实 → 视该路失败
- model path 上 `enable_search=false`，联网能力完全依赖 `extra_sources`

**what changes needed**: 无代码改动，编排层调用时硬传 `extra_sources>=3` + 后置 `get_sources` 验证

---

### 路 B：anysearch（开源 skill）

**reuse_class**: 照搬开源

**upstream source**:
- `/Users/Hugh/.claude/skills/anysearch/SKILL.md`（v2.1.0，独立开源 skill）

**能力**:
- 通用 web 搜索 + 垂直域（finance/academic/health/legal 等）
- 并行批量搜索 + URL 内容提取
- 真实联网，无需 MCP 服务器；匿名访问可用，API key 可选提升速率

**what changes needed**: 无改动，照搬引用；仅需在 reuse-registry.md 登记路径

**双路互证规则**:
- 任一路返空/报错/`get_sources` 核实失败 → 当场停下向用户报告，不得继续，不用执行者自身记忆替代
- 两路结论不一致 → 以可核实真来源的一路为准并登记分歧

---

## 2. talk-with-zhipeng

**reuse_class**: 基于开源优化（upstream 双源改造 + 自研部分）

**upstream source**:
- 源 A：`/Users/Hugh/.claude/skills/gstack/office-hours/SKILL.md`（gstack office-hours，六问框架）
- 源 B：`superpowers brainstorming skill`（一次一问交互模式）

**what changes needed**:
- 继承 office-hours 六维问题框架：问题/用户/现状/最小切口/未来适配/风险
- 继承 brainstorming 一次只问一个问题的交互模式
- **自研新增**：问题权重 + 影响排序机制（每答后重排剩余问题优先级，高影响问题先问）
- 这部分排序逻辑无现成上游，属完全自研

**integration shape**: Step 3 调用；输出结构化决策记录写回 decision-log；产出原文保存 `artifacts/make-decision-consultation.md`

---

## 3. 盲审三角度 — intake-direction-review / intake-framing-challenge / intake-scope-review

**reuse_class**: 走 3rd-review 异源（默认异源，非同源降级）

**upstream source**:
- `3rd-review` skill 链（agenthub 自研 skill；workflowhub reuse-registry.md 已登记外部依赖）
- 路径：`/Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/3rd-review/SKILL.md`

**三个角度分件说明**:

| 角度 | 输入约束 | 特殊要求 |
|------|----------|---------|
| intake-direction-review | 原始需求基线 + 拟定方向 | 禁含 framing 结论 |
| intake-framing-challenge | **只喂原始需求** | 明文禁含任何拟定方向（输入隔离最严） |
| intake-scope-review | 原始需求 + 四维结论（talk-with-zhipeng 产出） | 不含 framing/direction 中间结论 |

**what changes needed**:
- 各角度薄壳 prose 独立构造，接线需按 workflowhub 契约重做
- 硬护栏四条保留：覆盖率 / 强制审高风险 / 失败回退全量 / 独立性
- 独立性约束：3rd-review 链派发子代理 ≠ 裸派子代理（异源是入口要求）

**integration shape**: Step 4 并行三路；各路独立 checkpoint 落盘；Step 8 orchestrator 读回 framing 结果做 debate 评估

---

## 4. debate

**reuse_class**: 照搬开源（外部 repo 完整依赖）

**upstream source**:
- `/Users/Hugh/Hugh/Project/debate/SKILL.md`（独立外部 repo，完整独立技能）

**what changes needed**: 无改动——整体照搬引用，make-decision 编排层直接调用

**触发时机**:
- 第一次：Step 4-trigger，三角度盲审出 `severity:blocking` finding 且 blocking 数 >2 或方向级分歧
- 第二次：Step 8，intake-review-orchestrator 产出 `severity:blocking` finding

**运作要点**:
- 环境不具备时自动降级（debate/SKILL.md 内置探测逻辑）
- 丙/丁组产新想法 → D15 回退判定规则处理
- 红线：禁止在审查前自造争点触发辩论

---

## 5. grill — grill-with-docs-lite

**reuse_class**: 基于开源优化（OMC grill-with-docs 薄壳改造）

**upstream source**:
- 外部 skill `grill-with-docs`（OMC 开源 skill）
- M0 实现：`/Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/grill-with-docs-lite/SKILL.md`

**what changes needed**:
- 去掉外部 grill-with-docs 全文注入（不加载外部 skill 正文进上下文）
- 只保留盘问流程骨架（FR-SKILL-002 "交互类→重做内部薄壳"）
- 退出条件：连续 3 问明确 + 能复述四件事（做了什么/为何/不做什么/怎么验证）
- 盘问边界结果写回 decision-log

**integration shape**: Step 6 调用；产出原文 `artifacts/make-decision-grill-with-docs.md`；40 行单文件薄壳

---

## 6. scope-triage / decision-log

**reuse_class**: workflowhub 已有（直接复用）

**upstream source**: workflowhub 内部现有 skill

**what changes needed**: 无改动，按契约调用

---

## 7. intake-review-orchestrator

**reuse_class**: 基于已有改造（接入 make-decision 契约）

**upstream source**:
- `intake-review-orchestrator/SKILL.md`（agenthub 自研；workflowhub M13 适配版）

**what changes needed**:
- framing-challenge 已在 Step 4 前置跑，orchestrator 本步不重复跑 framing
- Step 8 只执行漂移/盲点/细节三类审查
- orchestrator 做 debate 评估时必须读回 Step 4 framing 落盘结果
- framing blocking 优先列入，不被漂移对照「覆盖良好」压制

---

## 汇总表

| skill | reuse_class | upstream source |
|-------|-------------|-----------------|
| 双路调研 muyu-search-mcp | 照搬接入（须修参数坑：extra_sources>=3 + get_sources 验证） | 本地 MCP 插件（dmxapi/Qwen），记忆条目 muyu-search-empty-root-cause.md |
| 双路调研 anysearch | 照搬开源 | `/Users/Hugh/.claude/skills/anysearch/SKILL.md` v2.1.0 |
| talk-with-zhipeng | 基于开源优化 | gstack office-hours（六问）+ superpowers brainstorming（一次一问）改造；问题权重+影响排序自研 |
| 盲审三角度（direction/framing/scope） | 走 3rd-review 异源（默认异源，非同源降级） | agenthub 自研 3rd-review skill；workflowhub 已登记外部依赖 |
| debate | 照搬开源 | `/Users/Hugh/Hugh/Project/debate/SKILL.md` 完整外部 repo |
| grill-with-docs-lite | 基于开源优化 | OMC grill-with-docs 薄壳改造，去全文注入 |
| scope-triage | workflowhub 已有 | — |
| decision-log | workflowhub 已有 | — |
| intake-review-orchestrator | 基于已有改造 | agenthub 自研；M13 适配接入 make-decision 契约 |
