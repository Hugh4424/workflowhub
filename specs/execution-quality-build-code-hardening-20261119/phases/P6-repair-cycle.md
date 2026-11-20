# Phase P6 — 用原失败和真实差异约束修复

让实施者在有新事实时继续修复。
独立读者仅凭同一失败的多个原件、冻结判据和实际写入，就能复核取舍。
同因锚以目标行为、归因和入口定位问题，比一次执行的错误字符串稳定。

## 哪些节必须写，哪些可以省？

本段给出可独立交付、观察、回退的单个结果。

| 段落 | 状态 | 本段用法 |
| --- | --- | --- |
| 交付、依据、开工材料 | written | 定位可观察结果、来源及上游输入。 |
| 验收、写集、验证 | written | 找判据、实际写主和反例。 |
| 消费者、任务与机器字段 | written | 交已知输入及执行边界。 |
| 末验收 | not-applicable | 完整验收归第 10 段。 |

## 这一 Phase 交出什么？

实施阶段的失败记录带轮次、新事实、严重度、结果和选择。
每两轮完成修复与验收后回看片段，阻塞和高风险立即分诊。
同因连续两轮没有改变继续条件的事实时，停止原样修复并转查根因。
新的可复现事实、受影响验证及后续动作仍可接回原实施会话。

第 5 段交回实施派发入口。仅在已交回之后扩展实施期和收口部分。
第 7 至 9 段消费该方法和原件，末段核沿途结论。
旧失败只读保留。原先固定轮数的提案已经否决。
验收字节、审查 provider、任务事实模型及风险承担归它们的原 owner。
**配套与影响**：配套调整＝`workflows/build-code/SKILL.md` 的失败处置与分诊、`docs/standard-workflow.md` 的每 Phase 执行清单、`skills/spec-plan/templates/phase-template.md` 的执行交接指针；配套迁移＝旧审查日志保留、新阶段改写分诊行；配套移除＝`check-repair-log`、试点段与固定轮数上限；影响范围＝所有 Phase 的失败处置、成本读数与独立审查输入。

### 开工就绪表

开发开工前只跑一次这张表；本段只列失败处置方法与标准工作方法入口的只读条件。

| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |
| --- | --- | --- | --- | --- |
| `git rev-parse --verify HEAD` | 0 | quality/tests/p6-readiness-head.output | 机器 | 计划负责人 |
| `test -f workflows/build-code/SKILL.md` | 0 | quality/tests/p6-readiness-build-code.output | 机器 | 计划负责人 |
| `test -f docs/standard-workflow.md` | 0 | quality/tests/p6-readiness-standard-workflow.output | 机器 | 计划负责人 |
| 同因失败原件由原负责人保留并可回读 | 原件未被覆盖且可打开 | quality/evidence/p6-readiness-original-kept.md | 人 | 实施负责人 |

## 这一 Phase 怎么验收？

### 验收 1：同因失败能触发真实分诊吗？

独立读者先拿原件指针与两轮实际执行日志。
用已复现的同类失败组织 S 级对照，记录每轮命令、退出、目标锚点和影响。
先给旧机制仅改报错行号的输入，再给另一输入只换夹具而没有根因修复。
另给一份真实新发现做正对照，定位新事实改变哪项判断与后续复验。
通过要求阻塞或高风险有分诊，每两轮有实际复核，同因重复转查因。
真实段成本能回读。未上报 token 项显式留缺口，禁止猜值。
重复拖到后面、换行号冒新问题或换夹具换绿，都判不满足。
命令只核真实写集，是否同因、假设和后续动作由独立读者按原件判。

### 验收 2：冻结判据和实际写入能核对吗？

独立读者在提交前取得开工基准、声明路径和冻结判据哈希。
冻结是实现前固定原验收和测试字节，并保可读原件。
读当前实际 Git 差异，把同一阶段新增、改动和删除路径传给现报告。
对非本阶段已有脏字节须引用开工基准和交回记录，不推定是当前写入。
坏对照在隔离样本改一个受保护断言，并加一个声明外写入。
再做一份标已修但同一原断言仍失败的反例。
满足要求时，受保护字节相同或有对应该调整的真实具名裁决。
比对能从判据、差异和回执回到故障、尝试和定向重验。
缺实际差异、无有效裁决或原断言仍失败，保原件并保持未完成。

两项均为独立语义读回。
写集报告和现前置只提供程序事实，退出 0 不替代两条验收结论。
UI 不适用。本段只涉及失败处置、记录与阶段模板。

| 验收 | 成本类别 | 活动分钟 | 上限与来源 | 重试 | 资源提供者 | 首判与末验 |
| --- | --- | ---: | --- | --- | --- | --- |
| 1 | 独立读回级 | 13 | 26 分钟，待校准 | 根因或所需原件变化后一次 | 原实施者给原失败，审查者读动作 | 实际分诊首判；末段读回 |
| 2 | 独立读回级 | 10 | 20 分钟，待校准 | 只重验受影响证明 | 主会话提供基准，独立审查者核差异 | 本段提交前首判；末段聚合 |

验收 2 用验收 1 确认的原失败和同一重验记录，按串行估算。
总账 13 + 10 + 合用准备 4 + 受影响复验 6 = 33 活动分钟。
估算依据是已核蓝图的两面、共用原件与最小对照，待校准。
`phase_budget={soft_min:45,hard_min:80,variance_threshold:1.5,source:provisional}`。
`execution_budget={window_minutes:65,command_cap:10,wait_cap:unknown,retry_reserve:6}`。
用户只在原授权确需更改验收或承接严重风险时等待决定。
审查及数据阶段回执等待分别在实际来源可读时结束，另记，未部署外部服务。

## 为什么现在做，依据是什么？

T13 历史样本有十六轮修复线索，许多轮没有改变继续条件。
决策日志第五包选择分诊、冻结判据和可复读的检查。
一次失败的运行签名保留原文字。它帮人找原件，同因判断仍看行为锚。
分诊沿原四类边界，只停止重复或依赖未获授权的路径。

## 开始前读什么？

读决策日志第五包、工具报告的研究记录和本段真实上游交回。
读 `workflows/build-code/SKILL.md` 的失败处置、目标测试和派发约定。
读 `docs/standard-workflow.md` 的证据保全、每 Phase 执行清单与收口。
读 `tools/cli/check-stage-quality.mjs:341` 的标准输入读取。
读 `runtime/stage/stage-content-contracts.mjs:558` 的实际写集事实。
适用专业源为 `specs/backend/architecture.md`、`specs/api/contract.md` 与
`specs/acceptance/acceptance.md`；复用真实现有读取器，失败保具名原件。

## 每个文件由谁改，先做什么？

本段开发在第 5 段交回后改失败方法、标准和共享模板。
先在现处置步骤写明确触发、根因复查和同一实施会话接续。
分诊记录在当前 Phase 已有执行清单或该步骤原件，卡内留指针。
独立读者需能定位发生轮次、新事实、严重度、结论与下一个动作。
该记录与执行清单的失败、测试和成本字段使用同一来源。
每段记录实际活动成本和墙钟、token 的真实读数或缺报。
整 stage 末仅现有成本工具记录一次，不另设每段账本或提前 --record。
现写集报告只读，不另加分诊脚本或退出门。

| 精确路径 | 本段落点或实际消费 |
| --- | --- |
| `workflows/build-code/SKILL.md` | 目标测试冻结、失败复现、方法 9 分诊和独立受影响复验；前段派发方法本段只读 |
| `docs/standard-workflow.md` | 专业质量与既有 Phase 执行清单消费当前失败、实际差异和成本 |
| `skills/spec-plan/templates/phase-template.md` | 第 5 段交回后，在现执行/验收交接处给失败指针，保先前五列 |

## 怎么验证？

在认证工作树，先用实际材料生成 JSON 输入，再喂给现报告命令。
`spec` 和 `index` 是当前正文字符串。
`phases` 是索引真实相对路径到完整 Phase 正文的映射。
`phase_id` 为当前段。`changeScope` 用
`{status:"recorded",changed_paths:[…]}` 承载从实际 Git 差异读出的路径。
现命令只读 stdin，没有 `--task-path` / `--phase` 参数，所以必须先生成文件再重定向。
下面三行是可复制执行的初始化，路径取本轮字面值。

```sh
WH_TASK=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/execution-quality-build-code-hardening-20261119
WH_MAT=/Users/Hugh/Hugh/Project/workflowhub-execution-quality-build-code-hardening-20261119/specs/execution-quality-build-code-hardening-20261119
WH_PHASE_INPUT=$WH_TASK/quality/tests/p6-write-set-input.json
WH_PHASE_BASE=$(git rev-parse HEAD)   # 开工前替换为本段真实基准提交；未替换时差异为空
node --input-type=module -e 'import{readFileSync,writeFileSync}from"node:fs";import{execFileSync}from"node:child_process";const[d,out,base]=process.argv.slice(1);const phases={};for(const m of readFileSync(`${d}/phases/index.md`,"utf8").matchAll(/`(phases\/P\d+-[^`]+\.md)`/g))phases[m[1]]=readFileSync(`${d}/${m[1]}`,"utf8");const paths=execFileSync("git",["diff","--name-only",base,"--"],{encoding:"utf8"}).split("\n").filter(Boolean);writeFileSync(out,JSON.stringify({spec:readFileSync(`${d}/spec.md`,"utf8"),index:readFileSync(`${d}/phases/index.md`,"utf8"),phases,phase_id:"P6",changeScope:{status:"recorded",changed_paths:paths}}));' "$WH_MAT" "$WH_PHASE_INPUT" "$WH_PHASE_BASE"
node tools/cli/check-stage-quality.mjs --report < "$WH_PHASE_INPUT"
```

`WH_PHASE_BASE` 在实施前替换为本段开工提交；不替换时取当前 HEAD，差异为空，报告仍可跑但证明力为未取得。
生成文件是本次可再生输入，落在任务自有目录，跑完按现有清理职责回收，不进证据区。
当前写集范围的基准、差异、原材料与这次输入要同时可读。
以 `git diff --name-only -z "$WH_PHASE_BASE" --` 读 tracked 真实差异，
用 `git ls-files --others --exclude-standard -z` 对照开工前的未跟踪文件。
审后提交已存在时再用 `git diff --name-only "$WH_PHASE_BASE"..HEAD` 核该提交。
基准到当前不全属于本段时保差异与归属证据，不能按写集预过滤。
将 JSON 由当前唯一证据作者按现方法保存，再执行下方报告命令。
读返回的 `matched`、`out_of_scope` 与覆盖限制。
`unavailable` 或仅有零退出码时，写集报告仍缺有效判定事实。

G-2 以独立读者按现方法读回同一组正反输入。当前已完成隔离方法样本复验。
独立读者向既有报告命令的 stdin 传真实材料正文及受控路径。
正对照仅含 `docs/standard-workflow.md`，报告匹配该路径。
加入 `README.md` 后，报告给出该路径的具名范围外缺口。
仅移动 P6 文本行位再跑，仍给出同一缺口。
三个实际报告调用和外层断言均退出 0。原件见任务卡「证据」。
受控输入只证报告及方法读回。真实 Git 差异、连续两轮原件、冻结判据及修后复验待独立首判。

## 下一消费者拿什么继续？

后续段接一次具体失败及相应处理的已核原件。
遇到原断言仍失败、缺具名裁决、写集漂移，交本段原开发修复。
查清根因或补同一个失败原件后，只重验证据受影响的动作。
历史成本与旧故障保持原缺口，末段复读本次独立结果。

## 每张任务卡怎么写？

### 任务 6：让每个实施段能复读分诊与写入

为什么做：同一个失败只换行号或夹具会制造虚假进展。
交付什么：两轮分诊、冻结判据和实际差异可以独立对照。
不做什么：现只读检查器保持原职责，原始审查、测试和验收字节受保护；本段不建 `check-repair-log`、不设试点段、不设固定轮数上限。
前置：取得上一段派发方法、旧失败原件、当前基准和冻结判据。
怎么做：先改本段失败方法，后在既有执行清单和卡承接原件。
怎么验收：拿真实路径报告及同源正反输入，按两条观察协议复读。
证据：具名原失败、分诊、冻结 hash、真实 Git 差异和定向复验。
下游（含何时停）：重复无增量转根因。判据或范围冲突回原 owner。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T006
- **来源 / FR / AC**：R-002、R-003、R-012；需求 2；决策日志第五包、D-006；FR-WH-005，
  AC-P5-001、AC-P5-002。确证同因、冻结与实际差异。
- **输入**：G-2 文档无新增运行行为；P5/T005 的实施入口和交回；来自原实施者的两轮原回执、
  原验收和测试字节、实际 Git 基准与路径、当前材料及现独立裁决。
- **文件 / 符号**：`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、
  `skills/spec-plan/templates/phase-template.md`；N/A — 纯文档说明；只读符号 reconcileWriteSetDiff。
- **动作**：按 G-2 使当前实施方法和执行清单可消费同一原件；
  核根因、冻结和分诊，报告由实施外读者复核。
- **输出 / 失败**：独立读回能定位阻塞风险、无新事实的转向、原字节和差异；
  无原件、漂移、换夹具或违规改判据仍报缺口。
- **边界 / 禁止改动**：`tools/cli/check-stage-quality.mjs`、测试判据、
  历史 review、facts schema、运行执行器和原 AC。
- **依赖**：T005
- **测试层级 / 技能**：`simple`。现有 CLI 功能和 S 级受控人读；主技能 backend-testing。
  文档与运行数据交接均由未参与作者回读。浏览器和全量数据不适用。
- **场景 / 夹具或服务**：同因仅行号变化、改夹具换绿、已有新证据、
  未审批判据变更、额外路径和 fixed 但原断言仍失败；同进程回收受控样本。
- **RED/GREEN 门禁命令**：`node tools/cli/check-stage-quality.mjs --report < "$WH_PHASE_INPUT"`
- **预期退出码**：G-2 既有报告客观检查预期 0；不执行 RED。
  结构接纳不等于 GREEN 或阶段完成；坏 JSON 退出 2。
- **RED 目标失败**：G-2 对照 ORACLE-REPAIR-CYCLE。独立观察给同锚两轮无新事实，
  对照断言为原样继续、换夹具或改断言冒通过应被独立读者拒绝。
- **RED 证据**：N/A — 理由：纯文档流程无新增运行行为；风险为后续实施者误把换行号当新事实；客观替代为独立逐步文档审查和现报告复放。
- **GREEN 判定器**：ORACLE-REPAIR-CYCLE 读回实际转向、固定判据和真实差异原件。
  具名冻结断言保留原字节。合法新事实须能解释继续与定向复验。
- **证据**：规划阶段 G-2 受控样本为 `quality/tests/2026-11-19-025-build-plan-p6-repair-method-readback.mjs`，
  原始输出为 `quality/tests/2026-11-19-026-build-plan-p6-repair-method-readback.output`。
  实施计划仍用 `quality/evidence/p6-repair-observation.md` 和 `quality/tests/p6-write-set-report.output`。
- **覆盖上限**：已读回受控报告的路径归类和只移行位的复验。实际差异、成本和沿原判据修复的结果尚未取得。
- **停止 / 恢复**：缺原失败、实际基准或发现无具名判据更改时暂停该结论，
  本段原 owner 定位并复验，历史失败留原件。
- **完成**：前置（不作完成条件）：真实 stdin 报告和范围可读。
  完成条件（只写效果）：独立读者按两个正反观察判出分诊、冻判和真实差异。
  AC-P5-001：incomplete，证据 `quality/evidence/p6-repair-observation.md:92–95`；缺口 owner=本段独立审查者，恢复=真实两轮修复与验收原件（历史不可重建，只能具名保留）。
  AC-P5-002：incomplete，证据 `quality/tests/p6-write-set-report.output`；缺口 owner=独立审查者，恢复=提交前冻结判据哈希与独立裁决（历史不可重建，只能具名保留）。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **Write set**：`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、
  `skills/spec-plan/templates/phase-template.md`
- **Dependency**：P5
- **消费者**：P7 至 P9 的实施主会话与独立验收者、末段对账读者
- **gate_cmd**：`node tools/cli/check-stage-quality.mjs --report < "$WH_PHASE_INPUT"`
- **oracle**：ORACLE-REPAIR-CYCLE
- **evidence_path**： planned: `quality/evidence/p6-repair-observation.md`
- **STOP**：原失败、基准或授权裁决不可回读时暂停相关结论，原 writer 修后复验。
- **覆盖 AC**：AC-P5-001、AC-P5-002
- **Done**：前置（不作完成条件）：stdin 报告、工作区和真实差异可读；档位据 `quality/reviews/2026-11-20-final-ac-reconciliation.md` §10.2（sha256 `e93d6741…`）。
  完成条件（只写效果）：AC-P5-001：incomplete——方法侧五要素与两轮回看可读，无真实两轮修复与验收原件，语义反例自记未执行；证据 `quality/evidence/p6-repair-observation.md:92–95`；缺口 owner=本段独立审查者，恢复=真实两轮修复/验收原件（历史不可重建，只能具名保留）。
  AC-P5-002：incomplete——声明写集与真实 diff 可对账（3 路径 matched、README.md 反例 out_of_scope），冻结判据哈希与提交前独立裁决未取得；证据 `quality/tests/p6-write-set-report.output`；缺口 owner=独立审查者，恢复=提交前冻结判据哈希与独立裁决（历史不可重建，只能具名保留）。
