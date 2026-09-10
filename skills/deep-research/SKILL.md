---
name: deep-research
description: 为 make-decision 提供可复核、可停止、可降级的深度调研契约。
version: 1.0.0
---

# Deep Research

## 目的与边界

本技能只负责把会改变产品方向的问题调研成可复核的研究报告，供
`make-decision` 的 Talk 使用。它不是 review、不是质量门、不是用户确认，不能
替代 `spec-research` 的轻量规划疑问，也不能自行写 `decision-log.md`。

研究结论必须绑定来源原文、证据和不确定性。缺工具、缺来源、来源冲突或复核
不可用，都要记录真实事实；不能用搜索摘要、默认知识或空报告伪造完成。

## R0 缺口问题：从需求框架生成

1. 读取当前需求框架骨架和已确认方向，只从五个维度生成缺口：业务目标、流程/表面、数据/状态、成功/失败/验收、约束/非目标/延期。
2. 每个问题绑定一个决策轴、可能改变的方向和当前证据；不把实现偏好包装成方向问题。
3. 没有能改变方向的问题时返回 `status: skipped`，并写明跳过理由；不能为了显得做过调研而硬开检索。

## R1：迭代检索与原文阅读

1. 用批准的外部搜索能力（`anysearch`、`web_fetch`）检索；每轮都记录查询、查询重写、语言和结果范围。
2. 需要外部来源时同时覆盖中英文查询，优先一手来源、规范、原始数据和官方文档。
3. 搜索结果只是候选入口，关键结论必须读取原文页面或文件并记录定位信息；摘要、标题和二手转述不能单独成为证据。
4. 每个问题最多 3 轮检索。连续 2 轮没有新增可改变方向的证据即视为饱和；达到时间盒也必须停止并记录原因。

## R2：并行深读

对仍未饱和的问题并行派最多 4 个独立上下文子代理。每个子代理只读分配给它的
来源包，返回来源、关键证据、冲突、置信度和未决项；不得共享未验证结论或把同一
来源复制成多个独立来源。并行能力不足时串行深读，并记录降级事实。

## R3：三角测量

对关键结论至少做来源类型或立场独立的交叉核对：

- 区分一手来源、权威二手来源和推断，不把同一原始来源的转载算成独立确认；
- 对冲突逐条列出双方证据、时间、适用范围和无法裁出的部分；
- 给出 `confirmed`、`supported`、`disputed` 或 `unresolved`，并保留反例和未决项；
- 结论必须说明它会改变哪个决策轴，不能只堆链接。

## R4：落盘 research-report.v1

报告写入当前任务质量证据区，不写仓库源码。使用内容寻址文件名：
`quality/evidence/research/<sha256>.json`，文件名中的 sha256 必须等于报告原始 JSON
字节的 SHA-256；写入后回读并校验 hash。生产接线把完整报告作为 make-decision
`stage-runtime run --action=execute` 输入的 `research_report` 字段提交；runtime 通过现有
canonical writer 发布后，只把返回的 ref 交给 stage handler，调用方不得自己写 ref 或同时提交
`receipts.research`。

报告至少包含：

```json
{
  "schema_version": "research-report.v1",
  "question": "缺口问题",
  "decision_axis": "决策轴",
  "rounds": 1,
  "sources": [{"url_or_ref":"...","source_tier":"primary|secondary|inferred","read_original":true}],
  "evidence": [{"claim":"...","source_ref":"...","locator":"...","confidence":"high|medium|low"}],
  "triangulation": {"status":"confirmed|supported|disputed|unresolved","conflicts":[]},
  "open_items": [],
  "coverage": {"dimensions":[],"first_party_ratio":null},
  "saturation": {"status":"saturated|timeboxed|not_saturated","reason":"..."},
  "tool_usage": [{"tool":"anysearch|web_fetch|subagent|glob|grep|read|git|ast-grep|none","question_id":"Q-1","queries":[],"attempts":[]}],
  "review": {"status":"pending|completed|unavailable","evidence_ref":null},
  "skip": null
}
```

`first_party_ratio`、收敛率、OPEN 数和工具使用记录是事实维度，不是通过条件。
缺省值使用 `not_applicable` 或 `null` 并说明原因；报告不完整时保留
`incomplete`/`unavailable`，不降级成空 findings 或通过。

## R5 独立复核

由独立上下文复核当前报告的来源绑定、原文阅读、三角测量、冲突和 hash。复核只给
建议和 findings，不给产品方向 verdict。复核不可用时报告
`review.status: unavailable` 及错误类别；这不阻断 Talk，但也不能宣称研究已被独立
复核通过。

## 受控降级状态

首选路由失败时只记录一次 `awaiting_user_approval`，不自动调用兜底。用户明确批准后状态为 `approved`，且必须同时记录 `web_search` 与 `web_fetch` provenance；用户拒绝为 `declined`。`awaiting_user_approval` 和 `declined` 都生成 `unavailable`，后续成功必须写新 `completed` 原件，不能覆盖旧事实。

## 跳过、降级和停止

- 跳过调研必须写：哪个问题被跳过、为什么不会改变方向、依据哪些现有事实；
- 外部工具缺席时可记录不合格调研事实和待补问题，不能用纯 agent 猜测填来源；
- 工具路由、并行能力或网络失败都要记录具体错误和影响范围；
- 满足“每问题最多 3 轮”“连续 2 轮无新增”或时间盒任一条件即停止，并说明是饱和、时间盒还是未完成；
- 本技能没有 `pass`、`approved` 或推进 gate。研究事实可作为 Talk 输入，但不自动改变决策。

## 工具路由

| 场景 | 工具 | 约束 |
|------|------|------|
| 外部发现 | `anysearch` | 记录查询、语言和结果范围 |
| 外部原文 | `web_fetch` | 必须读取原文并留定位 |
| 外部并行深读 | 独立上下文子代理 | 最多 4 个，来源包隔离 |
| 内部定位 | `glob` / `grep` / `read` / `git` / `ast-grep` | 只读当前允许材料 |
| 无工具 | `none` | 只记录不合格事实，不伪造来源 |

## 消费与所有权

`make-decision` 是唯一业务消费者和 owner；它只把报告的 path+hash 作为 Talk 输入，
不复制研究正文。研究机制被正式替代且没有消费者后，才可按仓库治理规则删除本技能
和对应登记；旧报告只读保留。
