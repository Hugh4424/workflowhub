# 验收草案（make-decision 产出，供 detail 审查与用户确认）

- task_id: `workflowhub-research-handoff-hardening-20260909`
- 关联决定：`decision-log.md` D-001…D-009
- 颗粒度约定（T3-Q7=A）：本文件锁死**需求边界、用户流程、数据状态、成功/失败边界、AC 通过判据**；具体字段名、时限数值、schema 细节属实现参数，留 build-spec，但每项都有 owner 与退出条件（见 §6）。
- 本文件不是第五份材料；它是 make-decision 的验收事实，供 `spec.md` 引用。

## 1. 用户流程（端到端）

### UF-1 做一次 make-decision 调研（人/AI 视角）
1. 主会话读取原始需求与四份当前材料，从需求框架五维生成缺口问题（R0）。
2. 判断"答案是否会改变方向"：不会 → 记录 `skipped` + 理由 + 依据事实；会 → 进入检索。
3. 检索：首选 anysearch；每轮记录查询、语言、结果范围；关键结论必须读原文并留定位。
4. 失败处理：单次失败先重试一次；仍失败 → 向用户申请一次降级批准 → 批准后用宿主 `web_search`/`web_fetch` 继续；**未批准或无答复 → 按 §2 的映射记 research 事实=`unavailable` 且 reason=`awaiting_user_approval`（或 `declined`），继续其它不依赖外部检索的工作，并在阶段末列为待补项。**
5. 落盘：产出 `research-report.v1` 写 `quality/evidence/research/<sha256>.json`，sha256=报告原始 canonical JSON 字节。
6. 阶段末：六项大白话摘要中显示调研状态（completed / skipped+理由 / unavailable+原因）与待补问题。

### UF-2 stage 切换（工头/Stage Agent 视角）
1. 宿主 Stage Agent 通过 bridge 提交 `session` 或 `unavailable`，生成 outcome 信封。
2. 工头调用 `run --action=execute` 发布阶段事实。
3. 阶段末 hook 执行复盘（reflection）→ 生成 handoff 文件 → 主会话输出六项摘要（含 handoff 绝对路径）。
4. 任意一次 `status --action=begin` 不再因为"合法重试"报 `conflict`/假 `missing`。

### UF-3 新会话从 handoff 续接（用户视角）
1. 用户复制阶段末通告的 handoff 绝对路径。
2. 在新会话里粘贴该路径 → 新会话读该文件 → 得到任务身份、背景目标、进度、重要决策、核心方案、踩过的坑、参考调研、未决项、下一步与待读清单。
3. 新会话按"下一步动作"继续下一个 stage；四份材料仍是正式事实来源。

## 1b. 页面范围与交互表面（R-010 要求）

本任务**没有面向最终用户的页面**；交互表面只有两类，必须逐项写清：

| 表面 | 内容 | 谁可见 | 成功 | 失败 |
| --- | --- | --- | --- | --- |
| CLI 输出（`doctor`/`status`/`run`/`review`/`verify`/`confirm`/`authorize`） | 七个公共命令的 JSON 输出；新增/变更字段：`execution_outcome`、`quality_missing` 收敛后的别名 | 工头、人 | 字段语义与本文档一致 | 结构错误 fail-loud；质量缺口如实显示 |
| 阶段末大白话摘要（六项） | 主会话在阶段结束时对用户说的话；必须含 handoff 绝对路径 | 用户 | 六项齐全 + 路径可复制 | 缺项或 handoff 未生成 → **如实披露缺失项与原因，不阻断 stage 完成**（F11"记录事实而非阻断"） |
| 文件产物 | `quality/evidence/research/<sha256>.json`、`<taskPath>/quality/evidence/handoff/<stage>.md`、`quality/stage-reflection/…` | 用户、下游会话 | 内容寻址/稳定命名/原子写 | 写失败记 unavailable 并通告原因 |

不涉及：Web UI、移动端、图形界面、浏览器交互；因此不触发 `ui_applicability=ui` 的设计确认流程（三输入规则由 make-decision 的 `## UI applicability` 记录）。

## 2. 数据状态

| 对象 | 状态取值 | 谁写 | 出现在哪 | 成功条件 | 失败/降级条件 |
| --- | --- | --- | --- | --- | --- |
| research 事实 | `completed` / `skipped` / `unavailable`（**三者互斥且穷尽**） | make-decision | `quality/evidence/research/<sha256>.json`（`completed`）或同目录下的 `skip`/`unavailable` 记录（后两者同样内容寻址落盘） | `completed`：报告含 question/decision_axis/sources/evidence/triangulation/saturation/tool_usage 且满足 AC1 下限 | `skipped`：写"哪个问题被跳过 + 为什么不会改变方向 + 依据哪些现有事实"；`unavailable`：写失败分类（含 `awaiting_user_approval`/`declined`/工具失败）+ 待补问题。**三种状态都必须是机器可读事实，运行时据此生成阶段摘要** |
| anysearch 调用 | `ok` / `usage_error` / `auth_error` / `http_error` / `timeout` / `tls_unreachable` / `quota` | anysearch 调用壳 | 研究报告的 `tool_usage` | `ok` 且有结果 | 分类失败 + 重试一次 + 用户批准降级 |
| 降级批准 | `not_requested` / `awaiting_user_approval` / `approved` / `declined` | 主会话（真实用户答复） | 研究报告 `tool_usage` 与阶段末摘要 | `approved` 后使用宿主检索 | **映射**：`awaiting_user_approval`/`declined` → research 事实=`unavailable` 且 reason 分别为 `awaiting_user_approval`/`declined`；获批后写**新的** `completed` 记录（内容寻址，不覆盖旧记录） |
| stage outcome 投影 | **public 词表**：`completed` / `skipped` / `incomplete` / `unavailable` / `failed`（与 `stage-runner.mjs:48` 一致）。**内部标签**（不进入 public status）：`conflict`（同 attempt 异字节）、`ambiguous`（同毫秒无法定序） | 运行时派生 | `status` 输出（`execution_outcome`） | 至少 1 个与当前 snapshot+材料绑定的 authenticated completed **或** 真实的 skipped/unavailable/failed 执行事实 | 同 attempt 异字节 → 内部 `conflict` + fail-loud；同毫秒 → 内部 `ambiguous` + 如实标注；无任何 outcome → `unavailable` |
| `execution_outcome` | 同 stage outcome 投影的 public 词表（独立字段） | 运行时派生 | `status` 输出 | — | 永不进 `missing`/`predicates`/`quality_status` |
| `execution_outcome.attempt_count` | 整数（只读披露） | 运行时派生 | `status` 输出 | 与当前 snapshot+材料绑定的 attempt 数量 | 不做排序、不选 winner |
| integration_review | `recorded` / `unavailable` / `missing` | 运行时派生 | `quality/facts/*` | `wh_review.v2` 的 `recorded` | `unavailable` → 不满足谓词但**不阻断推进** |
| reflection | `ok` / `degraded` / `failed` / `unavailable` / `not_scheduled` | stage-reflection hook | `quality/stage-reflection/<stage>/…` | 自动执行成功 | 失败记真实状态，不阻断 stage 完成 |
| handoff 文件 | `present` / `unavailable` | stage-reflection hook 内的 stage-handoff | `<taskPath>/quality/evidence/handoff/<stage>.md` | 13 区块齐全 + 原子写 + 路径通告 | 写失败 → 记 unavailable + 通告原因，不阻断 |

## 2b. 推进资格 / 阶段完成 / 整体交付的边界（必须三分）

| 层 | 由什么决定 | 不因什么改变 | 本文档相关项 |
| --- | --- | --- | --- |
| 推进资格（能否继续工作 / 能否进下一 stage） | 四份当前材料存在且可读（`deriveStageProgress`） | 质量事实缺失、research 缺席、integration_review unavailable、reflection/handoff 失败**都不改变** | 全部 AC 失败都不阻断继续工作 |
| 阶段完成（能否宣称本 stage 完成） | 该 stage 的 `STAGE_PREDICATES` 全部满足 + 必要的确认事实；**`stage_outcome` 不是谓词**，缺失时只把 `execution_outcome.status` 记为 `unavailable` | 不因"文档存在"或"材料可读"而成立 | **只有 AC4/AC5/AC6 改变完成投影**；AC1/AC2/AC3/AC7/AC8/AC9 只产生事实与披露，**不进任何 stage 的完成谓词**（AC1/AC8 只约束本任务最终交付判定） |
| 整体交付（close） | 用户明确执行 close；质量不足时带风险交付并保留 `quality_status=incomplete` 与 `quality_gaps` | 不因阶段完成而自动授权 | 本阶段不做 close |

**下一 stage 是否允许开始**：只看推进资格（四材料可读）+ 工头调度；不看本 stage 的 `quality_status` 是否为 completed。这与宪法 F3/Q2 一致。

## 3. 成功/失败边界

### 成功（AC 全过时才算完成）
- 调研在需要时产出可复核报告；不需要时给出可核验的跳过理由。
- anysearch 失败可分类、可重试、可经批准降级，且降级事实留痕。
- 同一 stage 的合法重试不再产生 `conflict`/假 `missing`；真身份矛盾仍 fail-loud。
- 执行事实永不进入 `missing`/`predicates`/`quality_status`；缺口归因正确（外部不可用 → `external_unavailable`）。
- 四个作者阶段自动产出 handoff 文件，阶段末摘要含其绝对路径。
- 每 stage 自动复盘并记录（reflection 真跑）。
- 死门/静默失效/重复投影/治理登记按 D-007 处置并交付可审计清单。

### 失败（必须如实保留，不得改写成通过）
- 调研工具不可用且用户未批准降级 → `unavailable` + 待补问题。
- provider 不可用 → `integration_review: unavailable`，完成判据不满足，但不阻断继续修复。
- reflection/handoff 失败 → 记真实状态 + 阶段末披露，不阻断 stage 完成。
- 同 attempt 异字节 → 真冲突，fail-loud。
- 用户拒绝某个方向 → 记 `declined`，不伪造确认。

## 4. 非目标

1. 不改仓库外 `~/.claude/skills/handoff` 与 `receive-handoff`。
2. 不新增 stage、不新增质量门、不改四份材料既有 schema、不引入新状态机/ledger/投影。
3. 本阶段不做 commit/push/merge/archive/cleanup/close。
4. verify-code 的 handoff 不在本轮（DEFER-001）。
5. 不把 `capability proof` 升格为 build-code 谓词。
6. 不做"自动补写缺失事实"的兜底。

## 5. 验收标准（AC1–AC9，映射 D-001…D-009）

| AC | 内容 | 通过判据（可观察） | 失败判据 | 映射 |
| --- | --- | --- | --- | --- |
| AC1 | 调研可核验 | 需要调研时存在 `quality/evidence/research/<sha256>.json`，hash 与字节一致，schema=research-report.v1，runtime 能读到；且报告至少含 1 个缺口问题、≥3 个来源（其中 ≥1 一手来源）、每条关键结论有 `read_original=true` 的原文定位、`triangulation.status` 非空、`saturation` 有明确取值与理由 | 报告缺失、hash 不符、只能塞进测试回执，或来源/原文/三角测量为空却声称完成；**合法 `skipped` 时**以内容寻址的 skip 记录（问题/理由/依据事实）为通过条件，只有"该调研却无任何记录"才算失败 | D-001 |
| AC2 | 调研缺席可见但不阻断 | 阶段末摘要的调研状态**由机器可读事实生成**（`completed` 的 `research-report.v1`，或 `skipped`/`unavailable` 的内容寻址记录），并列出待补问题；`quality_status` 不因 research 非 completed 而改变 | research 进入完成谓词；或披露是自由文本、无机器事实支撑 | D-002 |
| AC3 | 兜底可执行 | 失败被分类（含 TLS/超时/HTTP/配额/用法错误）；重试一次；经用户批准后使用 `web_search`/`web_fetch`；两者都在 deep-research 工具路由表登记 | 静默降级、把用法错误当"技能不可用"、只登记其一 | D-003 |
| AC4 | 合法重试不阻塞 | **在其它谓词已满足的前提下**：同 task+stage+snapshot+材料下多个 authenticated completed outcome 不再被判 conflict/假 missing；`quality_missing` 不含 `stage_outcome`；`execution_outcome.attempt_count` 如实披露数量 | 仍报 conflict 或假 missing；或披露缺失；或在谓词未满足时据此判 completed | D-004 |
| AC5 | 执行事实不冒充质量谓词 | `status` 中 `execution_outcome` 独立呈现；`unavailable` 落 `external_unavailable`；同毫秒歧义显式标注 | 仍折叠成 missing、仍进 `actionable_now` | D-005 |
| AC6 | build-code 三项缺口处置正确 | `integration_review` 仍只认 `recorded`；envelope 与 fact 对同一份 review 结论一致；`capability proof` 未进谓词 | 让 unavailable 满足谓词，或把 capability proof 加进谓词 | D-006 |
| AC7 | 治理处置可审计 | 交付控制面清单（每对象 → 生产者/消费者/owner/阻塞路径/保留或删除决策）；**每项按结论落地**（死门删除或写明保留理由；重复投影别名只剩一个派生源；core/ 活控制面各有 owner/consumer/删除条件；三个僵尸函数删除；move-map 补 7 个漏登文件；task-close 矛盾条目修正）；`findingDispositions` arity 修复且守卫为**记录型**（如实标记 stale finding、不阻断推进）；skip 守卫逐条给出恢复/退役+替代覆盖/延后结论 | 只给聚合数字、无逐项清单；或只标注不落地 | D-007 |
| AC8 | 自动复盘真跑（**五个 stage**） | 五个正式 stage 的 reflection 记录必须带**生产 executor 的运行证据**：executor 标识 + 运行 attempt + 输出 hash，且 `status ∈ {ok, degraded}`；`quality/stage-reflection/<stage>/…` 存在且绑当前 snapshot/material | **`status=unavailable` 且 reason 为 `executor_not_injected`/`not_scheduled` → AC8 失败**（这是本任务要修的缺陷本身）；只有 executor 已注入但执行真失败（reason 非 `executor_not_injected`/`not_scheduled`）才允许记 `failed` 并保留缺口 | D-008 |
| AC9 | handoff 可用且路径通告 | 四个作者阶段末尾存在 `<taskPath>/quality/evidence/handoff/<stage>.md`，含 13 区块、内容与当前 stage/snapshot/material 绑定（非陈旧）；由 reflection hook 内调用 `stage-handoff` 生成；**阶段末大白话摘要含其完整绝对路径**（R-020）；写失败记 unavailable 且不阻断 | 文件缺失且无通告；摘要只写"已生成"不给路径；文件是旧版本却当作当前 | D-009 |

## 6. 实现参数与 owner（T3-Q7=A：留 build-spec，但必须有 owner 与退出条件）

| item | 内容 | owner | 退出条件 |
| --- | --- | --- | --- |
| OPEN-001 | research 事实 NAMESPACE 与 receipt kind 命名 | build-spec | `spec.md` 给出命名且 runtime 校验通过 |
| OPEN-002 | anysearch 失败回执的单次/总时限数值 | build-spec | 数值写入 spec 且被实现引用 |
| OPEN-003 | "内容等价"的精确比对字段 | build-spec | 字段写入 spec 且有针对测试 |
| OPEN-004 | reflection executor 实现方式 | build-plan | plan 给出实现路径与超时/失败语义 |
| OPEN-005 | `stage-handoff` 在 reflection hook 内的调用点与 13 区块字段名 | build-spec | spec 给出字段表且 handoff 生成通过 |
| OPEN-006 | 21 处 skip 守卫逐条分类结果 | build-plan/build-code | 每条有恢复/退役/延后结论 |
| OPEN-007 | `execution_outcome` 字段形状与 `ambiguous` 取值 | build-spec | 字段形状写入 spec 且 AC5 可核验 |
| OPEN-008 | 调研缺口披露字段的具体形状 | build-spec | 字段形状写入 spec 且 AC2 可核验 |
| OPEN-009 | envelope skill 行修复方案 | build-spec | 方案写入 spec 且"两套投影结论一致"有测试 |
| OPEN-010 | 控制面清单格式与分期边界 | build-plan | 清单格式与 P0/P1/P2 边界写入 plan |

## 6b. 复核类未决项（非实现参数）

| item | 内容 | owner | 退出条件 |
| --- | --- | --- | --- |
| OPEN-011 | `research-report` 的独立复核（deep-research R5） | 本 stage 主会话 | 复核结论落盘并更新报告 `review.status` |

## 7. 延期与风险（摘要；权威登记见 decision-log「风险与延期交接」表）

| id | 内容 | owner | 触发条件 |
| --- | --- | --- | --- |
| DEFER-001 | verify-code 的 handoff | 后续任务 | 用户要求全覆盖时 |
| DEFER-002 | muyu-search-mcp 是否退役 | 后续任务 | 需要第二检索通道时 |
| RISK-001 | handoff 只靠手动贴路径 | 用户 | 用户忘记贴路径时会话退回读四份材料 |
| RISK-002 | 158 个任务无一 build-code 达 5/5 | make-decision/build-code | 修复后仍需真实 AC/审查事实 |
| RISK-003 | 降级需用户批准，用户不在场会等待 | 实施阶段 | 记录等待语义并继续其它工作 |
| RISK-004 | handoff 与 reflection 同处一个 hook，任一方失败可能互相影响 | build-plan/build-code | 保证 handoff 失败不阻断 reflection 发布，反之亦然 |
