# 决策日志（decision-log）

本件是 make-decision 第 12 步草稿：只记方向与依据。
实现细节归 spec，执行事实归 task facts。
结论前置；一段一主题；可枚举的用表，因果论证用散文。

本件按普通任务粒度写，故不写规划任务专用的 OI 账本。
若干零消费者节本次直接删除或退役，
理由与清单见 ADR-015、ADR-016 与「范围与非目标」第 10 项。

## 任务身份

分组维度：审查定位｜材料形态｜派发调度｜失败可见｜产出治理｜验收口径｜执行效率｜产出精炼。
下面一行是唯一机器读取字段。

- **任务类型**：普通任务

`runtime/stage/stage-content-contracts.mjs` 的
`readTaskTypeFromDecisionLog` 只读本节：
恰好一个任务身份标题 + 恰好一行任务类型声明。

## 大纲地图

本文档的节目录（按出现顺序）：

- 任务身份 / 大纲地图
- 需求-决策覆盖矩阵 / 需求变更记录（U-019：010 当前日志迁移；确认边界见范围与非目标）
- 原始需求索引 / 决策→需求回指
- 工作模块（MOD-1、MOD-2、MOD-3、MOD-4、MOD-5、MOD-6、MOD-2 续、MOD-7、MOD-8、MOD-7 续、MOD-8 续）
- MOD-7（续）承载 ADR-061…ADR-068（派发机制缺口）
- MOD-8（续）承载 ADR-069…ADR-074（产出文档瘦身落点）
- MOD-9 承载 ADR-075（008 真实新增：close 默认安全清理）
- 要改哪些文件
- 验收面
- 范围与非目标
- Supersedes（被替代记录）
- 未决项

## 需求-决策覆盖矩阵

本节负责一件事：按**覆盖维度**说明「哪一维被谁处置、处置成什么」。
它不负责 R / U / V 与 ADR 的逐条对应关系——那张表只此一张，
在 `## 决策→需求回指`；本节「落点」列出现 ADR 编号时，
含义是「该维度由这些 ADR 处置」，不是「这些 ADR 与某个 R 的对应关系」。
两处关系因此不重叠：本节按维度看覆盖，回指表按编号看服务对象。

| 覆盖维度 | 覆盖的需求 / 会话答复 | 本任务的处置 | 落点 |
| --- | --- | --- | --- |
| 业务目标 | R-001 审查只作异源建议、不当瓶颈 | 定位收窄为异源静态建议；三审查点保留但压单次成本 | ADR-001、ADR-002 |
| 流程/表面 | R-002 两阶段审查失败且耗时；R-007 不跳阶段 | 路径契约按真实投递结构；模板按真实写法；源材料精简 | ADR-012…ADR-016、ADR-023 |
| 数据/状态 | R-013 只审本 Phase 增量 | Phase 起点映射 + 游标覆盖写；游离字段清理；体积基线 | ADR-018…ADR-021 |
| 成功失败验收 | R-003、R-004 耗时 token 大且质量无保障 | 解析收紧；判失败不补派；每条记录自带可复算事实 | ADR-030、ADR-031、ADR-033、ADR-034、ADR-039、ADR-040 |
| 约束/非目标/延期 | R-012、R-014、R-016 的三次否决 | 把三次否决固化为硬约束；把 5 项登记为未决 | ADR-005、ADR-008、ADR-009、ADR-028、ADR-029；见「范围与非目标」与「未决项」 |
| 新增工作包（中途加入） | R-017 执行效率；R-018 文档精炼正式生效 | 按同一日志新增大纲模块 MOD-7 / MOD-8，不新增步骤 | ADR-043、ADR-044、ADR-045、ADR-046、ADR-047、ADR-048、ADR-049、ADR-050、ADR-051、ADR-052、ADR-053、ADR-054、ADR-055、ADR-056、ADR-057、ADR-058、ADR-059、ADR-060；另见 ADR-034、ADR-036、ADR-037、ADR-038、ADR-041、ADR-042 |

## 需求变更记录

全文（U-001…U-005、U-016、U-017 的来源、逐字锚点与处置）见任务库
`quality/evidence/decision-log-refs/log-ref-requirement-changes.md`。
本节目的是把「改变了方向的真实答复」与逐字原文分开：逐字原文的
唯一权威位置是 `log-ref-verbatim-layer.md`。
编号连续性事实登记：U-001…U-005 与 U-016/U-017 为本件实际使用的编号，
U-006…U-015 在本任务 worktree 与任务库中均未使用（F-027 实测零命中），
故本件编号从 U-005 直接跳到 U-016。

### U-018 — close 默认安全清理（新增真实范围）

2026-10-08 真实新增：用户要求检查并修正 close 每次建议保留工作区/分支的默认策略。原话唯一来源为任务库根 `quality/evidence/human-confirmations/2026-10-08-008-close-default-cleanup-request.json:5`；该件第 6 行是主会话范围解释，不冒用户逐字。V-021 仅导航此原件，处置见 MOD-9 / ADR-075；本次不执行最终 close，不解除 004 packet TTL 延期。

### U-019 — 010 当前日志过程内容迁移（本任务新增范围）

原话只读[010 确认原件第 5 行](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007/quality/evidence/human-confirmations/2026-10-08-010-log-migration-packet-cleanup-final-close.json#L5>)，V-022 仅导航此来源，第 6 行是主会话解释。本次允许整理当前真实整件日志的四类过程内容为原件指针，保全部决定与来源；仅在本 task 覆盖旧“不回填当前日志”的范围冻结，不改变历史 ADR 的原义或另立产品方向。packet 与四 memo/最终 close 的具名授权边界见「范围与非目标」当前确认边界；授权不是已执行结果。

## 原始需求索引

本节负责登记反转权威表得不到的事实，不复制 R / U / V 与 ADR 的对应关系；
该关系只留一张权威表，在 `## 决策→需求回指`。逐条事实（R 编号连续性、
R-006 / R-007 / R-008 / R-009 的承载者、两表合并前的对账与删除前原表逐字）见任务库
`quality/evidence/decision-log-refs/log-ref-requirement-index-pointer.md`。

V-001…V-020 原始需求与 Talk 逐字及未取证状态，只读[逐字原件](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007/quality/evidence/decision-log-refs/log-ref-verbatim-layer.md>)；其它节引用 V 编号时以该原件为准。V-021 只导航 U-018 所引 008 第 5 行，V-022 只导航 U-019 所引 010 第 5 行，不复制进旧逐字原件。
全部研究/审查原件及覆盖关联，只读[现有外置索引](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007/quality/evidence/decision-log-refs/log-ref-evidence-index.md>)；MOD-8（续）ADR-069…074 的 H-001/H-002 与复算来源只读[现有 MOD-8 指针件](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007/quality/evidence/decision-log-refs/log-ref-mod8-doc-slimming.md>)。派发原件与回执分别只读[003 原任务书](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007/quality/evidence/dispatch/2026-10-07-003-review-efficiency-mod8-dispatch-brief.md>)、[004 原回执](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007/quality/evidence/dispatch/2026-10-07-004-review-efficiency-mod8-dispatch-receipt.md>)。

## 决策→需求回指

本节负责 R / U / V 与 ADR 关系的**唯一权威表**：逐条列出
ADR-001…ADR-074 服务的 R / U / V 编号；无需求依据的写「无需求依据」，
并给出取证事实编号。他处不复制本关系：`## 原始需求索引` 已压成指针，
`## 需求-决策覆盖矩阵` 只按覆盖维度看维度归属。

| ADR | 服务的需求 / 变更 | 依据 |
| --- | --- | --- |
| ADR-001 | R-001 | 原 `## 原始需求索引` R-001 行（迁移） |
| ADR-002 | R-001 | 原 `## 原始需求索引` R-001 行（迁移） |
| ADR-003 | R-010、R-014 | 原 `## 原始需求索引` R-010 / R-014 行（迁移） |
| ADR-004 | R-003 | 原 `## 原始需求索引` R-003 行（迁移） |
| ADR-005 | R-011、R-012 | 原 `## 原始需求索引` R-011 / R-012 行（迁移） |
| ADR-006 | R-012 | 原 `## 原始需求索引` R-012 行（迁移） |
| --- | --- | --- |
| ADR-007 | R-004 计数与解析口径 | F-013 |
| ADR-008 | 无需求依据 | 取证事实 F-007、F-018 |
| ADR-009 | R-012、U-001 | V-007、V-008 |
| ADR-010 | 无需求依据 | 取证事实 F-018 |
| ADR-011 | 无需求依据 | 取证事实 F-018 |
| ADR-012 | R-002 | V-001 |
| ADR-013 | U-005 | V-016、V-017 |
| ADR-014 | R-002、R-007 | V-001、V-005 |
| ADR-015 | R-002、R-007、R-009 | V-001、V-005 |
| ADR-016 | 无需求依据 | 取证事实 F-016 |
| ADR-017 | 无需求依据 | 取证事实 F-016、F-018 |
| ADR-018 | R-013、U-002 | V-009、V-010 |
| ADR-019 | 无需求依据 | 取证事实 F-015、F-018 |
| ADR-020 | R-015、U-003 | V-015 |
| ADR-021 | 无需求依据 | 取证事实 F-013、F-018 |
| ADR-022 | 无需求依据 | 取证事实 F-017 |
| ADR-023 | 无需求依据 | 取证事实 F-006 |
| ADR-024 | R-013、R-014、U-002、U-004 | V-009、V-010、V-013 |
| ADR-025 | 无需求依据 | 取证事实 F-017 |
| ADR-026 | R-014、U-004 | V-012 |
| ADR-027 | R-011 | V-006 |
| ADR-028 | 无需求依据 | 取证事实 F-017 |
| ADR-029 | 无需求依据 | 取证事实 F-017 |
| ADR-030 | R-002、R-004 | V-001、V-002 |
| ADR-031 | R-004 | V-002 |
| ADR-032 | R-004 | V-002 |
| ADR-033 | R-003、R-004 | V-002 |
| ADR-034 | 无需求依据 | 取证事实 F-013 |
| ADR-035 | R-003 | V-002 |
| ADR-036 | 无需求依据 | 取证事实 F-003 |
| ADR-037 | 无需求依据 | 取证事实 F-003、F-006 |
| ADR-038 | 无需求依据 | 取证事实 F-013 / F-019 |
| ADR-039 | R-004、R-015、U-003 | V-002、V-015 |
| ADR-040 | R-005、R-015 | V-002、V-015 |
| ADR-041 | 无需求依据 | 取证事实 X-002、Y-002 |
| ADR-042 | 无需求依据 | 取证事实 X-002、Y-002 |
| ADR-043 | R-017 | 原 `## 原始需求索引` R-017 行（迁移） |
| ADR-044 | R-017 | 原 `## 原始需求索引` R-017 行（迁移） |
| ADR-045 | R-017 | 原 `## 原始需求索引` R-017 行（迁移） |
| ADR-046 | R-017 | 原 `## 原始需求索引` R-017 行（迁移） |
| ADR-047 | R-017 | 原 `## 原始需求索引` R-017 行（迁移） |
| ADR-048 | R-017 | 原 `## 原始需求索引` R-017 行（迁移） |
| ADR-049 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-050 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-051 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-052 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-053 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-054 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-055 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-056 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-057 | R-018、R-009 | 原 `## 原始需求索引` R-018 / R-009 行（迁移） |
| ADR-058 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-059 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-060 | R-018 | 原 `## 原始需求索引` R-018 行（迁移） |
| ADR-061 | R-017 | 本件 `## 工作模块 MOD-7（续）` |
| ADR-062 | R-017 | 本件 `## 工作模块 MOD-7（续）` |
| ADR-063 | R-017 | 本件 `## 工作模块 MOD-7（续）` |
| ADR-064 | R-017 | 本件 `## 工作模块 MOD-7（续）` |
| ADR-065 | R-017 | 本件 `## 工作模块 MOD-7（续）` |
| ADR-066 | R-017 | 本件 `## 工作模块 MOD-7（续）` |
| ADR-067 | R-017 | 本件 `## 工作模块 MOD-7（续）` |
| ADR-068 | R-017 | 本件 `## 工作模块 MOD-7（续）` |
| ADR-069 | R-018 | 本件 `## 工作模块 MOD-8（续）` |
| ADR-070 | R-018 | 本件 `## 工作模块 MOD-8（续）` |
| ADR-071 | R-018 | 本件 `## 工作模块 MOD-8（续）` |
| ADR-072 | R-018 | 本件 `## 工作模块 MOD-8（续）` |
| ADR-073 | R-018 | 本件 `## 工作模块 MOD-8（续）` |
| ADR-074 | R-017、R-018 | 本件 `## 工作模块 MOD-8（续）` |
| ADR-075 | U-018 | V-021；任务库根 `quality/evidence/human-confirmations/2026-10-08-008-close-default-cleanup-request.json:5` |

R-006 的承载者是 ADR-014、ADR-015（**反转本表得不到**：本表 ADR-014 / ADR-015
两行只登记了 R-002、R-007、R-009，未登记 R-006）；R-008 无 ADR 落点，
其权威是 `## 需求-决策覆盖矩阵`。逐条说明见任务库
`quality/evidence/decision-log-refs/log-ref-requirement-index-pointer.md`。
## 工作模块 MOD-1 — 审查定位与职责边界

审查只做异源静态建议；运行期缺陷归现场测试。
单次成本由材料、调度、卫生三条线各压一段。

### ADR-001 — 审查是异源静态建议工具

- 决定：审查只审 diff 与材料的自洽性、契约违背、明显缺陷；
  真实运行验证明确归现场测试。
- 为什么：实测审查的强项是静态一致性与契约违背，
  弱项是运行期缺陷——verify-code 11 条真实缺陷里只有 4 条（36.4%）
  来自审查，其余 7 条（63.6%）来自现场测试（F-005）。
  职责分开，审查才能收窄范围，且不再为漏掉运行期缺陷担责。
- 否掉了什么：把审查当作能覆盖运行期缺陷的完整质量网；
  以「审查漏了运行期缺陷」为理由继续扩大送审范围。
- 后果与风险：现场测试成为最大发现来源，
  它必须有独立性，否则等于把责任移给同源角色（见 ADR-003）。
- 影响面：`skills/wh-review/contracts/provider-protocol.md` 的定位措辞；
  spec 的审查定义节；不改任何 gate。

### ADR-002 — 三个审查点全留，只压单次成本

- 决定：保留 build-plan 合并审查、build-code 每 Phase 审查、
  verify-code 终末审查。
- 为什么：审查点由既有合同确定；
  实测成本来自单次体积与等待，不是点太多。
- 否掉了什么：删审查点；把多个审查点合并成一轮。
- 后果与风险：点数不变 ⇒ 收益只能来自单次成本三条线，
  幅度受各模块落地进度约束。
- 影响面：`runtime/review/review-policy.mjs` 的审查点定义（只读，不改）。

### ADR-003 — 现场验证交独立子代理，收尾分列两条来源

- 决定：现场验证改由独立子代理执行，不再由主会话自查；
  收尾把「现场验证发现」与「provider 审查发现」
  分列两条事实并标来源。
- 为什么：AGENTS.md 要求质量裁决由独立来源独立上下文产出、
  禁止自审自判；而现场测试是最大发现来源（比例见 ADR-001）。
  不改，等于让最关键的结论留在无独立性角色手里。
- 否掉了什么：主会话自查；把两类发现合并成一条无来源的结论。
- 后果与风险：凭据与环境若交付不成，本决定退化成「换个名字的自查」；
  交付方式尚未取证（未决 H2）。
- 影响面：build-code / verify-code 的收尾事实格式；
  spec 的现场验证执行节。

### ADR-004 — verify-code 保持全量口径

- 决定：verify-code 继续审当前最终 worktree，不改成增量；
  但只送本任务的改动集，并缩小包体。
- 为什么：`skills/wh-review/contracts/provider-protocol.md:78-79`
  明文「build-code 只用当前 phase，verify-code 审当前最终 worktree」。
  改增量会与合同冲突，早期 Phase 缺陷也会失去静态复审网。
- 否掉了什么：把「只审 Phase 增量」套到 verify-code；取消终末全量。
- 后果与风险：verify-code 仍是单次最大成本项；
  收益只能靠「只送本任务改动集」与缩包取得，幅度未测。
- 影响面：`runtime/review/review-input-bounds.mjs`、
  `tools/cli/stage-runtime.mjs` 的 verify-code 材料装配。

### ADR-005 — 一轮收场：健康者等终态，不健康者提前结束

- 决定：所有 provider 必须挂健康监控；健康的等到自己的终态；
  不健康的会话提前结束（记失败并跳过）。
- 为什么：整轮墙钟恒等于最慢 provider（六轮误差 ≤4.6 s），
  最慢实测 41.6 分钟；只有健康监控能区分
  「卡住」与「在慢慢干活」，墙钟超时不能。
- 否掉了什么：用墙钟超时判卡住；等所有 provider 都到终态才收场。
- 后果与风险：**不实现 ownerloss guardian**——文档写了它，
  代码零实现，措辞按实际机制（显式调用方取消）改写，
  不得写成已实现。
- 影响面：`skills/third-review/lib/health-runner.mjs`、
  `skills/wh-review/scripts/simple-review-runner.mjs` 的等待循环；
  另加 `skills/wh-review/contracts/provider-protocol.md`——
  `:13` 的 owner loss 清除表述、`:25` 的两处 ownerloss guardian。
- 开放问题：antigravity 用哪个信号（未决 H1）。

### ADR-006 — 给 antigravity 补活性信号；停滞提升为终态失败

- 决定：给 antigravity 补活性信号；
  把 `skills/third-review/lib/health-runner.mjs:54`
  的 `PROCESS_STALLED` 从「只诊断」提升为终态失败。
- 为什么：antigravity 是唯一既无 probe 也无 terminal 事件的 provider
  （`skills/third-review/lib/adapters/antigravity.mjs` 全文 35 行）；
  codex / pi / opencode 分别有 `createCodexProbe` /
  `createPiProbe` / `createOpenCodeProbe`。
  无信号时健康监控永久空转，ADR-005 对它不可能触发。
- 否掉了什么：把 ADR-005 限定为「只对具备 probe 的 provider 生效」、
  其余交给人工取消的降级方案。
- 后果与风险：要反转四处反向契约
  （`health-runner.mjs:29-31`、`:69-72`、
  `skills/wh-review/contracts/provider-protocol.md:25`）。
  引用更正：`skills/third-review/SKILL.md:49` 实测是订阅 CLI 的
  `auth.type` 那条，不含 ownerloss / health 语义，
  故该处不再作为反向契约的引用点（F-027 实测）。
  末者逐字写「以显式调用方取消与 ownerloss guardian 收场，
  health/output 只作诊断」，与「停滞判终态失败」直接相反，
  须一并改写该措辞；改写时保留
  「health/output 不作取消或继续的许可」这层语义边界。
  停滞结论写入既有字段
  （`provider_results[].status` / `error` /
  `execution.process_outcome`），**不新造字段**——
  本轮记录 6/6 无 `health` 键，新键无从承载。
  **不得回退成「仅诊断」**，理由见 U-001
  与「范围与非目标」第 2 项。
  会破 4 个测试文件
  （`skills/third-review/test/health-runner.test.mjs:85` / `:111`、
  `codex-health.test.mjs:130`、
  `tests/contract/stalled-consumer-delta.test.mjs:14/74/110`），需同步。
- 影响面：上述适配器、健康监控、SKILL 契约、
  provider-protocol 合同与 4 个测试文件。

### ADR-007 — 改 v3 契约与计数口径

- 决定：给 `skills/wh-review/contracts/workflowhub-result.v3.json`
  的 `$defs.member`（现为 `additionalProperties:false`）加上所需键
  （解析结果、过程结果、覆盖声明）；
  把 `runtime/review/canonical-review-result.mjs:243-244` 的
  `providers_completed` 从 `status==="completed"`
  改为「输出可解析且满足 findings 约束」；
  三份 schema 里同名 `coverage` 的含义对齐。
- 为什么：`additionalProperties:false` 使新键根本写不进去；
  `status==="completed"` 会把拒审算成完成（见 ADR-030）。
  同名 `coverage` 三处各说各话：
  `runtime/review/schemas/result.schema.json` 无定义且放行、
  `attempt.schema.json` 用 `additionalProperties:false`、
  v3 放在 `$defs.member`。
- 否掉了什么：只改一处口径；新增 v4 契约并行。
- 后果与风险：schema 收紧会破现有写入方，
  必须与 ADR-030、ADR-032 同批落地。
- 影响面：v3 契约、canonical 结果、三份 schema。

### ADR-008 — 删 minimum_reviewers 与两个零消费者访问器

- 决定：删 `minimum_reviewers`
  （`runtime/review/stage-materials.json` 共 9 处写 1）
  与两个零消费者访问器
  （`runtime/review/review-policy.mjs:101`、
  `skills/wh-review/scripts/review-materials.mjs:609`）。
  派发人数唯一由 `/Users/Hugh/.config/workflowhub/config.json`
  的 `wh_review.stages.*.initial` 决定。
- 为什么：该字段全部写 1 且无人读，
  真实人数由配置 route 决定；一处权威好过三处口径并存。
- 否掉了什么：把配置值改成与 route 一致（改值无行为变化）；
  保留双口径。
- 后果与风险：`/Users/Hugh/.config/workflowhub/config.json`
  内容不动；需同步处置
  `tests/contract/build-prd-review-contract.test.mjs:8`。
- 影响面：stage-materials.json、review-policy、
  review-materials 与 1 个测试文件。

### ADR-009 — 移除 WH_REVIEW_BROKER_TIMEOUT_MS

- 决定：移除 `skills/wh-review/scripts/review-provider-client.mjs:17-22`
  的 `WH_REVIEW_BROKER_TIMEOUT_MS`。
- 为什么：它是休眠的墙钟超时门：默认未设 ⇒ 现状无超时，
  但一旦有人设了就会复活已否决的机制（V-008）。
- 否掉了什么：保留但标注「默认禁用」；完全不动。
- 后果与风险：会动该环境变量相关的测试，
  需先确认那些注入是故意的还是历史遗留。
- 影响面：review-provider-client.mjs 及其超时测试。

### ADR-010 — questions-only 投影接受「人守」

- 计划：questions-only 投影接受「人守」，由 build-plan 把这句
  写进 `skills/wh-review/contracts/make-decision.md`；
  执行者＝build-plan，落点＝该合同文件；producer 侧维持现状。
- 为什么：现在只有 `workflows/make-decision/SKILL.md:24` 有文字，
  代码零 producer；再造 producer 等于给没有消费者的控制面加实现。
- 否掉了什么：新增机器 producer；给投影加校验器。
- 后果与风险（执行状态）：该词在合同里当前 0 命中（F-027 实测），
  本条仍是待执行的计划，不是已实现状态；
  写入后「人守」仍不可机器验证，只能靠合同措辞与人工执行。
- 影响面：`skills/wh-review/contracts/make-decision.md`。

### ADR-011 — 引用更正

- 决定：`skills/architecture-code-review` 不存在，
  实为 `skills/architect-code-review/`；
  「每个 role 一次公共请求」与「逐字节」的真实位置是
  `skills/wh-review/contracts/make-decision.md:3` / `:15`。
- 为什么：`workflows/make-decision/SKILL.md` 是纯人读的工作流说明，
  它的 `:3` / `:15` 分别是 YAML 描述与 `load-context` 步骤；
  照旧引用会「看起来改了、实际没改」。
- 否掉了什么：给两个同名文件都加改动；把改动写进纯人读文件。
- 后果与风险：同类误引用会再次发生，
  故本条写入日志作为后续口径。
- 影响面：本任务材料与后续派发信；不改人读工作流文件。

## 工作模块 MOD-2 — 送审材料形态

材料形态改两件事：按真实投递布局给路径，按真实写法定模板。
其余是删除与清理，不新增校验器。

### ADR-012 — 修路径契约：按实际投递结构生成路径

- 决定：提示词按实际投递结构生成路径。
- 为什么：实测三种形态——无 `bundle/`：antigravity、codex；
  有 `bundle/`：kimi / pi / grok / cursor / claude-code（根 `work/<key>`）；
  根即 `bundle/`：opencode。
  提示词写死 `bundle/review-instructions.md` 与 `bundle/manifest.json`，
  与布局不符时 provider 直接拒审。
- 否掉了什么：给所有 provider 统一建 `bundle/` 视图
  （会改动现有成功映射）。
- 后果与风险：触点集中在
  `skills/wh-review/scripts/simple-review-runner.mjs:97-99`
  （`RESULT_SAMPLE` 在 `:97`、「锚点永不带 bundle/」语义在此）；
  改错一处会同时影响路径与锚点校验。
- 影响面：上述提示词生成点与投递层。

### ADR-013 — 删逐字节绑定死代码与它本就红的测试；不加锚

- 决定：删 `skills/wh-review/scripts/review-materials.mjs:210`
  的 `validateDetailReviewInput`（零生产调用方），
  以及它那条本来就红的测试
  `skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`；
  不加 sha256 锚（V-016）。
- 为什么：该函数在现行生产路径上从未被调用；
  其测试实测 2 failed | 7 passed，是既有红。
  锚只能证同源、不能证投影保真，并被用户判为过度工程化。
- 否掉了什么：把死校验接回 `buildReviewMaterials`；
  在投影条目上携带 `source_sha256`。
- 合同句一并处置：`skills/wh-review/contracts/make-decision.md:15`
  逐字称 `approved_direction` 的硬校验由 `review-materials.mjs` 的
  `validateDetailReviewInput` 负责，而该函数零生产调用方（F-027 实测）
  ——合同句与函数一并处置，执行者＝build-plan，
  落点＝该合同文件与 review-materials.mjs。
- 合同口径矛盾（同批处置）：`skills/wh-review/contracts/make-decision.md:15`
  （`approved_direction` 必须逐字节等于当前 decision-log）
  与 `:19`（不要求额外 material revision/hash receipt）
  互相矛盾，须一并改净。
- 后果与风险：断掉「摘要静默替换当前决定」的名义防线，
  换来一条长期红测试清零；决定来源见 U-005 与 V-017。
- 影响面：review-materials.mjs、detail-minimum-input.test.mjs、
  `skills/wh-review/contracts/make-decision.md:15` 的措辞。

### ADR-014 — 源材料精简按实测可删清单执行

- 决定：按 F-016 实测可删清单执行；
  1–8 项合计 19,704 B ≈ 16.4%。
- 为什么：可删项集中在「零消费者 + 零填充」的骨架规格；
  最大单笔是
  `skills/spec-plan/templates/phase-template.md:271-294`
  的「T001 卡片示例」3,454 B（零消费者、零测试绑定）。
- 否掉了什么：动产物内容；碰必保锚点；新增校验器或字数门。
- 后果与风险：清单里有两项风险中高
  （OI 三表牵动 `empty: true` 机制），需逐项取舍，
  不由本条自动放行。
- 影响面：decision-log / phase / prd / spec 四类模板与相关 SKILL 方法节。

### ADR-015 — 模板以真实写法为准

- 决定：8 列文件表 → 4 列、5 列验收表 → 7 列；
  ADR-023 骨架降为「推荐」而非「必须」；
  `skills/spec-specify/templates/spec-template.md` 的
  115 处 `[填写：` 换成非占位写法
  （F-027 实测现值为 115；旧记的 106 属另一时点口径，本件按现值写）。
- 为什么：实测模板规格 0/63 采用，真实写法才是事实；
  占位写法会让模板自身不是合法实例——
  `runtime/stage/stage-content-contracts.mjs:436-441` 的
  `placeholderOrTemplateNoise` 会拒绝照它填出来的内容。
- 否掉了什么：保留列数规格并新增校验器；
  把骨架真正写进 8 个模板。
- 后果与风险：改后与归档产物一致；
  但「精确路径」列消失，路径口径改由 ADR 的影响面字段承载。
- 影响面：`skills/decision-log/templates/decision-log-template.md`、
  `skills/spec-specify/templates/spec-template.md` 等模板。

### ADR-016 — 删两个零消费者节与它们的 SKILL 要求

- 决定：删 `runtime/stage/stage-content-contracts.mjs:144`
  的 `readUiApplicabilityFromDecisionLog`（零生产调用方）
  与它的 4 个测试；
  删 `## 收敛检查` 的 SKILL 要求。
- 为什么：模板 0 命中，读它的代码已删；
  `## UI 判定` 被写成「不要求 JSON」，
  却由该 reader 强制要求一个 JSON fact。
  据此本日志不写这两个节。
- 否掉了什么：把这两节写进模板并补 reader。
- 后果与风险：历史产物里的同名节保留「旧产物可读」，不重写。
- 影响面：stage-content-contracts.mjs、
  `workflows/make-decision/SKILL.md:31` 与 4 个测试文件。

### ADR-017 — AC-19 锚点改为按原文匹配

- 决定：AC-19 锚点改为「按原文匹配，不按行号」；
  重新盘 8 文件的 live reader；
  AC-19 降级为历史事实，本任务另立验收锚点。
- 为什么：归档件只读、不改历史原件；
  实测旧行号 `:35` / `:50` / `:54` / `:198-217` 全失效，
  真实位置为 `:43` / `:62` / `:66` / `:252-270`；
  按行号逐字保护会保护错行（`:50` 是空行）。
- 否掉了什么：改归档 decision-log 的行号；
  恢复被删的 560 行代码。
- 后果与风险：AC-19 指定的 4 个 reader 全仓不存在，
  「逐字未改」的追溯性改由内容子串匹配的既有测试承担。
- 影响面：`skills/spec-plan/templates/phase-template.md` 的保护口径；
  本任务验收锚点。

### ADR-018 — Phase 增量：单独提交 + per-Phase 起点映射 + 游标覆盖写

- 决定：每 Phase 结束单独提交；
  新增 per-Phase 代码起点映射，base = 本 Phase 开始时的 HEAD；
  走既有 `phase_progress` 游标**覆盖写**，不形成历史序列。
- 为什么：实测并发偏序使「上一 Phase 的 commit」作 base 无定义；
  覆盖写兼容 `CONSTITUTION.md:174`。
- 否掉了什么：用「上一 Phase 的 commit」作 base；
  新开历史序列或旁路投影。
- 后果与风险：需先放开 `runtime/task/task-store.mjs:8-11`
  的 `STAGE_ROW_KEYS`——`:65` 现在对新字段直接抛
  `task row contains unsupported fields`。
- 影响面：task-store 的 `STAGE_ROW_KEYS`；
  build-code 的提交与游标写入。

### ADR-019 — 补 quality/** 缺口

- 决定：把「任务库的 `quality/**` 进不了 worktree diff」
  写成已知缺口，验收证据的引用方式随之调整。
- 为什么：任务库不是 git 仓库，验收证据永远进不了 worktree diff；
  实测有 Phase 评审包缺自己产出的 `quality/tests/*.mjs`。
- 否掉了什么：把 task 库纳入 git；
  把 quality 证据复制一份进 worktree。
- 后果与风险：AGENTS.md 的「证据只留原始件」仍须遵守，
  缺口以事实形式保留，不伪造覆盖。
- 影响面：build-code / verify-code 的证据装配与验收口径。

### ADR-020 — 材料体积基线记进 facts

- 决定：把材料体积基线记进 facts，只记录，不是门。
- 为什么：在不定阈值的前提下，回涨只能靠基线被看见（未决 H5）。
- 否掉了什么：体积阈值；体积告警；体积校验器。
- 后果与风险：基线字段需过 task-store 白名单，
  与 ADR-018 是同源改动。
- 影响面：facts 行字段；build-plan 与 verify-code 的取材。

### ADR-021 — 删两个游离字段

- 决定：删 `entry_release_commit`
  （8 个 `task.json` 里有，零 reader / writer）
  与 `finding_dispositions[].repair_commit`（无 writer 无校验）。
- 为什么：两个字段都没有读者或写者，属于纯残留面。
- 否掉了什么：给它们补 reader；保留为兼容字段。
- 后果与风险：历史 `task.json` 里的值只读保留，不重写。
- 影响面：task.json 写入面；disposition 记录面与其消费点。

### ADR-022 — 统一两套 findings 锚点规则

- 决定：统一到「必须命中投递目录里的相对路径」
  （`skills/wh-review/scripts/simple-review-runner.mjs:969-972` 那套）；
  `runtime/review/ocr-delegation-adapter.mjs:998-1000`
  的「内容包含」判据并入。
- 为什么：两套规则并存会让同一条 finding
  在一侧通过、在另一侧被丢。
- 否掉了什么：保留两套规则；放宽为「内容包含」。
- 后果与风险：会破 6 个测试文件，需同批同步。
- 影响面：上述两处锚点校验与 6 个测试文件。

### ADR-023 — 更正 docs/standard-workflow.md:15 措辞

- 决定：改为「代码面默认 OCR，只有未安装才回退 wh-review」。
- 为什么：实测本机 OCR v1.12.12 已装、`detectOcr()` = installed，
  OCR 是活路径而不是回退路径；
  措辞错会让人按 wh-review 的成本模型优化错对象。
- 否掉了什么：不动；另加一行「本机实测状态」。
- 后果与风险：只改一行措辞，无行为变化。
- 影响面：`docs/standard-workflow.md:15`。

## 工作模块 MOD-3 — 派发与等待调度

派发侧只加记录与跳过，不加门。
等待侧把最慢者的成本从关键路径上摘掉。

### ADR-024 — 指纹复用只记事实，不拒绝派发

- 决定：把 `request.material_id`（含指令的整包哈希）
  提升为每条记录必记的顶层字段，并加一条查表路径；
  命中即写 `already_reviewed` 事实并引用原记录，
  **不拒绝派发、不新增门**。
- 为什么：该字段实测存在于 56/226 = 24.78% 的记录；
  顶层另有一个同名 `material_id`（5/226 = 2.21%），
  两者零重叠——要做的是补记，不是换键。
- 否掉了什么：按命中拒绝派发（那是闸门）；
  用顶层同名 `material_id` 作复用键。
- 后果与风险：指令措辞一变就视为新主题，命中率可能偏低；
  误判无害，所以不设门。
- 影响面：review 记录的 `request` 写入面与查表路径。
- 开放问题：命中率是否够用，先用 ADR-039 的可复算事实证伪。

### ADR-025 — 逐 provider 落部分结果，正式记录仍一次写盘

- 决定：逐 provider 落部分结果（原始字节 + 该 provider 自己的结论）；
  整轮结束时再合成正式记录。
- 为什么：`runtime/review/ocr-delegation-adapter.mjs:1896-1908`
  的逐 provider 回调**已实现**，
  测试 `tests/contract/ocr-delegation-route.test.mjs:417` / `:427` 背书；
  但 `onProviderResult` 没有生产消费者
  （`tools/cli/stage-runtime.mjs:1055-1057` 未传，恒为 null）。
- 否掉了什么：每到达一次就写一次正式记录；
  放弃「正式记录一次写盘」。
- 后果与风险：保留
  `runtime/review/review-record-route.mjs:108` 的单次写盘，
  意味着早到结果只作为部分结果存在，处置仍等整轮。
- 影响面：ocr-delegation-adapter 回调、stage-runtime 传参、
  review-record-route 写盘。

### ADR-026 — 取消 600 秒补充窗口

- 决定：取消补充窗口
  （`skills/wh-review/scripts/review-provider-client.mjs:265`、
  `:882`、`:911-913`）。
- 为什么：生产数据依赖为 0——publication / `initial_result_ref` /
  非空 supplements 全是 0；留着它只会静默丢弃后到的 findings。
- 否掉了什么：保留窗口但调小或调大；
  达到 quorum 就取消其余 provider（V-014 已否决）。
- 后果与风险：「一轮审查结束」由 ADR-005 的健康终态承担；
  迟到 findings 的处置顺序需在 spec 写明。
- 影响面：review-provider-client.mjs 的窗口判定与结果合并。

### ADR-027 — 红蓝配对保留两遍，不做条件化

- 决定：保留两遍，不做条件化；
  删掉方向里的 D12 文字。
- 为什么：实测 23/23 轮 red 与 blue 用同一组 provider
  （差异只在 role 提示词）；
  253 条 red findings 与 blue 精确重合 0 条、近似重合 1 条（0.4%），
  但 96% 落在同一批文件上——
  blue 独家贡献 496 条里的 243 条（49%），不是重复劳动。
  「分歧才跑第二遍」的判据恒真，省不到东西。
- 否掉了什么：D12 的条件化二次跑；删除配对本身。
- 后果与风险：direction 每轮派发翻倍的成本保留；
  `skills/wh-review/contracts/make-decision.md:3`
  的「每个 role 一次公共请求」边界保持成立。
- 影响面：direction 派发结构；本任务方向文字。

### ADR-028 — route 引用 disabled / 未配置 provider 时记录失败并跳过

- 决定：wh-review 侧从整组抛错改为记录失败并跳过
  （`skills/wh-review/scripts/third-review-host-config.mjs:704-708`、
  `:711-713`），且必须同步 `:720` 与 `:723-725`，
  否则只是换个地方抛。
- 为什么：OCR 侧已在 `selectTrustedOcrProviders`
  （`runtime/review/ocr-delegation-adapter.mjs:602+`）做到，
  有 5 条测试背书；组级本可容忍单点失败。
- 否掉了什么：保持整组抛错；只改前半段、不改后两处。
- 后果与风险：**如实记录：该现象在 48 条历史失败里 0 命中**。
  本条是合同一致性修复，不是已发生故障的修复。
- 影响面：third-review-host-config 的 route 校验与跳过路径。

### ADR-029 — 定向重派保留人工路径

- 决定：定向重派保留人工路径，不做默认自动。
- 为什么：与「判失败不补派」（ADR-031）一致；
  重派机制虽已实现，但历史样本全 0
  （`only_providers` / `dispatch_reason` / `supplements` 全 0）。
- 否掉了什么：失败后默认自动补派；按失败率自动降权。
- 后果与风险：长尾失败仍由人决定是否重派；
  provenance 不被自动改写。
- 影响面：`skills/wh-review/SKILL.md` 的重派说明与 supplement 参数面。

## 工作模块 MOD-4 — 失败可见性与覆盖声明

先让失败可见，再谈删原始件与权威化。
失败与「没发现问题」必须在记录里分开。

### ADR-030 — 收紧解析：不认散文里夹的 JSON

- 决定：解析不再接受「散文里夹的 JSON」。
- 为什么：`runtime/review/review-output.mjs:91-118` / `:170-186`
  的 `objectSpans` / `firstJsonCandidate` 在整段散文里扫花括号对象；
  两个真实拒审文件（650 B / 717 B）
  因散文里字面写了 `{"findings": []}`
  被解析成「评审通过、零问题」。
- 否掉了什么：靠体积或关键词做启发式识别（实测误报高）；
  只在一侧修。
- 后果与风险：该处是单点纯函数，可同时修两条路径；
  另需处理
  `skills/wh-review/scripts/simple-review-runner.mjs:1606` 的 fallthrough、
  `:1052-1058` 的 `catch {}`、
  `runtime/review/ocr-delegation-adapter.mjs:1849`。
- 影响面：review-output 解析、simple-review-runner、ocr 适配器。

### ADR-031 — 判失败之后：记失败 + 不计覆盖 + 不补派

- 决定：判失败之后记失败、不计覆盖、不补派。
- 为什么：现状把「没读到材料」记成完成，
  等于把失败写成质量通过；是否补派交给人（ADR-029）。
- 否掉了什么：失败自动重试或补派；把失败静默降级为 partial。
- 后果与风险：覆盖数字会短期下降——
  这是把既有假覆盖暴露出来，不是退步。
- 影响面：provider 终态记录、覆盖率计数与收尾事实。

### ADR-032 — 覆盖声明提到记录顶层

- 决定：覆盖声明提到记录顶层，每条 provider 一条：
  读到了哪些材料 / 哪些没读到 / 哪些没法判；
  并修 `runtime/review/canonical-review-result.mjs:315-319`
  的静默丢弃；计数口径随 ADR-007。
- 为什么：现在没有任何 schema 字段要求声明
  「provider 到底评没评」，
  「没评」与「评了没问题」在记录里必然同形。
- 否掉了什么：把覆盖声明留在 provider 内部，
  或只写进原始输出。
- 后果与风险：必须与 ADR-007 的 schema 改动同批，
  否则新键写不进去。
- 影响面：canonical-review-result；
  result / attempt / v3 三份 schema。

### ADR-033 — 抬高解析上限

- 决定：抬高 128 KiB 解析上限
  （`runtime/review/review-output.mjs:7`）。
- 为什么：实测落盘输出 max 2,010,784 B、p90 620,788 B；
  216 份里 44 份超限，重跑解析 123 个抛错。
  目的是让 `parse_outcome=ok` 事后可从落盘产物复现。
- 否掉了什么：保持上限，并把超限一律视为合法失败。
- 后果与风险：上限抬高后解析成本上升，
  需与 ADR-025 的逐 provider 落盘配套。
- 影响面：review-output 的上限常量与解析调用点。

### ADR-034 — kimi 用量标「未上报」；usage 键名归一；拆 read_confirmed guard

- 决定：kimi 用量标「**未上报**」，不标 0；
  把 usage 的键名归一化；
  `read_confirmed` 拆掉 antigravity-only guard
  （`runtime/review/ocr-delegation-adapter.mjs:1762-1766`），
  并随覆盖声明重做。
- 为什么：实测其 CLI 流里根本不存在 usage 字段
  （442,790 B / 85 行样本逐行查过）；
  且 `input_tokens` / `input` / `totalTokens`
  三种键名混用，跨 provider 不可求和。
  guard 只对 antigravity 生效 ⇒ 其余 provider 的 `read_confirmed`
  恒为字面 false。
- 否掉了什么：把缺失用量记成 0；保留 provider 专属 guard。
- 后果与风险：历史成本数字标「未上报」后不可直接相加，
  引用时必须带口径。
- 影响面：ocr-delegation-adapter 的 usage 解析与 coverage 写入。

## 工作模块 MOD-5 — 成本与产出治理

产出治理的前提是失败可见（MOD-4）。
先登记再退役，不新增控制面。

### ADR-035 — 原始输出只留「真出意见」或「真失败」

- 决定：provider 原始输出只留「真出意见」或「真失败」的；
  死槽（0 字节、纯宿主启动噪声、事后无引用）不再落盘。
- 为什么：实测 410 份 `.output` 共 83.9 MiB，
  其中 66 份 0 字节、154 份 <2 KiB，
  多数是宿主启动噪声且事后无引用。
- 否掉了什么：全量无条件落盘；按体积阈值一刀切。
- 后果与风险：**前提是先做 MOD-4**——
  失败可见性还没建立就删原始件会丢线索。
- 影响面：review-record-route 的输出落盘面与保留判定。

### ADR-036 — 清理历史 packet 并加保留期

- 决定：清理历史 packet，并加保留期。
- 清理边界：范围仅限 packet 目录与系统临时目录；
  `quality/reviews/` 下的审查原件**一律保留**，
  不随本条的不可逆动作处置。
- 为什么：packet 目录整体 14 GB，
  最大单包 951.4 MiB 且被逐轮物理复制 8 份。
- 否掉了什么：不清理；另建第二套 packet 目录。
- 后果与风险：沿用 `skills/third-review/lib/config.mjs`
  已有的 `ttl_hours` 先例，不新增配置面；
  清理不可逆，需人确认范围。
- 影响面：packet 目录与 ttl 配置。

### ADR-037 — 死代码退役登记

- 计划：按 AGENTS.md 走退役登记，不直接删无登记者。
  本条登记两项：
  ① `runtime/review/stage-review-disposition.mjs` 全族 7 个导出
  （零非测试消费者，实测 717/720 disposition 为 null）；
  ② 4 个已不存在符号
  （`analyzeDecisionConvergence` / `analyzeDecisionOutline` /
  `meaningfulSectionBody` / `structuredConvergenceFacts`）
  的残留引用。
  另有一批退役项已由前文各条决定，此处只并入同一份登记：
  `entry_release_commit` 与 `repair_commit` 见 ADR-021、
  `minimumReviewersFor` ×2 见 ADR-008、
  `readUiApplicabilityFromDecisionLog` 见 ADR-016。
- 为什么：这些符号没有当前消费者；
  直接删会丢掉「为什么删」的理由与来源。
- 否掉了什么：先接线再当活机制；不登记直接删。
- 后果与风险：disposition 族是不是主会话人工约定未经 owner 确认，
  报告间也有冲突（F-003 判死、F-006 判活），退役前需 owner 确认。
- 落点登记（如实登记为缺口）：本件不新建登记表文件，登记内容
  落在 `docs/architecture/move-map.json` 的退役段；
  执行者＝build-plan 与 owner 确认后的人工动作。
  F-027 实测「退役登记」在仓库内只命中归档历史文档，
  本任务当前没有落点文件，故登记为缺口而非已完成。
- 影响面：move-map 的退役段与相关测试。

### ADR-038 — token/时间记账与写覆盖率

- 决定：加 token / 时间记账与写覆盖率；
  没上报的标「未上报」，不当 0。
- 为什么：现状 311 次调用只有 80 次有 usage，账本只是下界；
  记账与覆盖率是「可复算」的前提。
- 否掉了什么：用 0 补齐缺失值；跨 provider 直接求和。
- 后果与风险：口径变化后历史数字不可与新值直接比较，
  需同时记口径。
- 影响面：usage 记账面、覆盖率写入面与记录 schema。

## 工作模块 MOD-6 — 验收口径

验收只要求可复算，不设阈值。
代价结论按 thread 分别引用。

### ADR-039 — 每个审查记录自带可复算事实

- 决定：每个审查记录自带可复算事实——
  provider 终态、是否真出意见、送审字节、
  provider token 与墙钟、是否复用命中；
  任务收尾给一张本任务汇总；
  **不做跨任务基线、不设阈值**。
- 为什么：验收只要求「现象消失」（V-015）；
  在不定阈值的前提下，只有可复算事实能让人看见变化，
  而跨任务基线与阈值会把正常任务判失败。
- 否掉了什么：固定阈值与评分器；跨任务基线快照。
- 可被测试打破的边界（不设阈值、不引跨任务基线、不加门）：
  为已解决的故障行为补可断言用例，判据只写
  「某具体失败事实必须出现 / 某取值必须不出现」——
  例如 provider 未能解析出 findings 时，
  记录里必须出现具体失败事实，不得是 `completed`；
  停滞必须判 failure 而非静默 running（ADR-006）；
  散文里夹的 JSON 必须被拒（ADR-030）；
  覆盖声明字段必须出现（ADR-032）。
- 实现侧对照：判定「审查比实现贵」是否消失，
  须用同一任务的实现侧与审查侧**并列事实**
  （两侧各记改动/送审字节、token、墙钟，
  缺失按 ADR-038 标「未上报」），
  不能只用历史 thread 比率（ADR-040）。
  本轮 6/6 `usage=null` ⇒ 这条判定**目前不可完成**，
  如实登记为验收缺口。
- 后果与风险：「现象消失」只要求可复算、不设门
  ⇒ 无断言用例的部分仍靠人读。
- 影响面：记录字段、收尾汇总件与 spec 的验收口径。

### ADR-040 — 「审查比实现贵」按 thread 分别引用

- 决定：按 thread 分别引用，不得只取单侧。
- 为什么：实测 thread `01a11378` = 0.63×、
  thread `01a111b6` = 1.53×，两个方向都存在；
  只引一侧会得出相反结论。
- 否掉了什么：取单侧数字作结论；合并成单一倍数。
- 后果与风险：口径更啰嗦，
  但避免用单个 thread 外推到全部任务。
- 影响面：本任务的成本结论引述与验收汇总。

## 工作模块 MOD-2（续）— 送审对象与脱敏声明

送审对象必须是可核对的原件；
材料若被派生改写，该事实必须随材料一起交给审查方。

### ADR-041 — detail 审查的对象是完整 decision-log

- 决定：detail 轨以**完整 `decision-log.md`** 为审查对象，
  不用「只摘录决定行」的投影。
- 为什么：摘录件没有流程、状态与失败边界，
  也没有可被测试打破的验收判据，
  审查方核对不了「方向已被转成完整方案」。
- 否掉了什么：让 detail 的对象 =「真正的规格/验收草案」——
  那要求在 make-decision 阶段额外产出草案，
  与「spec 由 build-plan 写」的边界冲突。
- 后果与风险：完整日志体积可接受（43,399 B）；
  代价是 detail 轨从此没有「验收草案」这一审查面，
  该缺口被制度化。
- 覆盖限制（如实登记）：第 10 步 detail-advice 送的是
  ≤25 KB 投影 `X-002-detail-draft-acceptance.md`（11,683 B），
  不是完整日志；3 条 blocking 中 2 条由此而来。
  该 25 KB 上限的派发原件未落盘，未取证。

### ADR-042 — 送审材料必须声明脱敏派生事实

- 决定：送审材料必须**显式声明派生事实**——
  替换了几处宿主路径、与原件差多少字节、
  以及派生件自己的哈希。
- 为什么：本轮 2 条假阳性（含 1 条 blocking）的根因是
  packet 侧 `redactProviderHostPaths` 改写了字节，
  而审查方看不到这件事：`X-002-detail-request.json`
  声明的是原件哈希 `48867f36…f002`，
  manifest 里是派生件 `0784b91d…7978`，两者差 140 B。
- 否掉了什么：加哈希锚或校验门——
  用户已判定其过度工程化（V-016、V-017；ADR-013）。
- 后果与风险：不做校验门 ⇒ 派生事实靠声明而非校验，
  声明本身写错时无人拦。

## 工作模块 MOD-7 — 执行效率

耗时、token 与缓存命中率是同一根因的三个面：
主会话与子代理反复往返，每次往返重发整段上下文。
三个会话的 make-decision + build-plan 合计 47h09m
（WH 23h18m / PB07 12h23m / PB02 11h28m）。
这张分段表不跨会话拼接：PB02 会话内没有 build-plan，
WH 会话内没有 build-code / verify-code（在 Codex 侧）。
这些时间的去向：等子代理 28h55m（61.3%）、
主会话模型输出 6h47m（14.4%）、
等外部命令 5h41m（12.1%）。
「每个子代理 30 分钟」不成立：1385 次派发的中位是
4.7 分钟，只有 4.4% ≥30 分钟；用户看到的是进程存活
中位 36.6 分钟（其中 active 仅 6.6 分钟、idle 27.4 分钟）。
主因是往返次数 × 每次重发的上下文：
corr(时长, nresp)=0.920，平均每次调用输入 203,500 token；
单次响应延迟随上下文 9.5s(<64K) → 16.9s(128–256K)
→ 30.8s(256–384K)。
工具不是瓶颈：17,344 条 exec 合计 6.12h（占 2.6%），
81.7% <0.5s；但 corr(exec 命令数, nresp)=+0.976，
命令多是往返多的结果，不是原因。
主会话自身 token 2323.2M，等于子代理总量的 49%。

缓存口径先分开：DSH 是 hit = cacheRead/(cacheRead+input)，
codex 是 hit = cached/input，跨源不能混用。
opencode + `deepseek-v4-flash` 基准 99.72–99.75%
（08-07 / 08-10，复现于 `~/.local/share/opencode/opencode.db`，
平均每次 cacheRead 523,140、未命中仅 1,287）。
DSH 日聚合：09-11..09-16 为 99.69–99.77%、
09-22 为 97.64%、10-05/06/07 为 92.68/94.69/92.18%；
10-05 起 237 个会话里 99 个（42%）低于 90%。
四个会话：PB Card02 89.80%、当前会话 91.69%、
WH 93.55%、PB07 95.54%；
DSH 子代理 10-05..10-07 区间 66.70%–98.4%。
Codex 家族 47 rollout / 11,666 请求合计 97.89%
（主 98.43 / 子 97.38）——跨源不能与上面直接比。
结构律：377 个会话样本 corr(hit%, unc/call) = −0.914。
成本随之走：miss 溢价从基准 $0.00082–0.00328 / 1M cacheRead
升到 10-04..10-07 的 $0.0101–0.0154（10–13×）；
09-22..10-07 相对 99.7% 多付 $27.90（10-06 单日 $7.68）。
子代理侧更差：下滑期比主会话低 3.57pp，
其 token 占比已从 32.1% 涨到 77.4%，
可省的 $21.54 里 84% 在子代理侧。

口径提醒：「审查比实现贵」的引用一律带 thread 名
（thread `01a11378` 与 thread `01a111b6`，比例见 ADR-040）；
DSH 侧审查只占段墙钟 7%–32%，不是耗时大头。

### ADR-043 — 不再引入改写已发上下文的工具

- 决定：不再启用任何会改写会话已发上下文的插件或工具。
- 用户裁决（依据）：「那7个工具都是billion-context插件
  带来的，我已经彻底卸载这个插件了，应该没有这个问题了。」
- 事实登记一：那 7 个工具（`compress` / `decompress` /
  `search_context` / `acp_cache` / `acp_status` / `absorb` /
  `acp_rule`）由 **`billion-context` 插件**提供。
- 事实登记二：用户已于 2026-10-07 08:28:18 卸载该插件。
  `.dsh-market` 日志逐字两条：
  `2026-10-07T08:27:54.513Z toggle billion-context -> off: fiber=true`
  `2026-10-07T08:28:18.346Z uninstall billion-context exit=0 live-removed=true`
  （`~/.dsh/profiles/desktop/.dsh-market/log.ndjson`）。
- 事实登记三：工具集随后于 2026-10-07 16:30 从注册表
  移除（F-019 实测）。
- 事实登记四：故「停用」这个动作已由用户完成，
  本条不再是一条待执行动作。
- 为什么（保留结论的依据）：这批工具改写会话「最旧」
  消息区间，令前缀整体失效，占命中率取证那份 2.92M
  miss 的 26.8%（真正新增内容只占 11.7%）；
  且净亏 1.69×——21 次调用丢 656,000 token 前缀、
  只换 389,133 token 收益，回本需 85–112 次后续请求。
- 为什么（锚点）：2026-09-22 11:37:35 工具数 34→58、
  同日 cR/call 从 526,403 崩到 101,909，
  此前 compress 调用为 0。
- 否掉了什么：靠「压缩上下文」省 token 的做法（实测反向）。
- 后果与风险：预期 PB Card02 命中率回升至 ~96%
  （基线见本节导语的会话命中率行）；残余风险＝同类能力
  可能被任何插件再次引入，故保留为「不再引入」的结论，
  不是一次性动作。
- 影响面：DSH 平台侧配置（非本仓库代码）。

### ADR-044 — 冻结工具注册表

- 决定：一个会话生命周期内不增删工具。
- 为什么：工具注册表中途变更占同一份 miss 分解的 17.6%；
  实测一次 tool-removal 就让下一请求未命中 513,553、
  命中率落到 0.40%（`pbc44` seq1269→seq1270）。
- 纪律边界：该纪律与具体插件无关——实测危害来自
  「任何」会话中途的工具集增删。
- 事实登记（只登记，不判定）：另一个插件
  `dsh-context@0.64.0` 仍安装且启用中。依据三条：
  它在 `~/.dsh/profiles/desktop/package.json` 的
  `bundles` 列表内；
  `~/.dsh/profiles/desktop/cordis.patch.yml:271-274`
  有其配置项且无 `disable`；market log 只有 `update`
  无 `uninstall`。它与那 7 个工具无字符串关联
  （F-019 实测该插件全树无相关字符串）。
- 用户裁定（来源：用户 make-decision Talk，2026-10-07）：
  该插件**不处理**。
- 否掉了什么：会话中途加载 / 卸载工具的做法。
- 后果与风险：预期当前会话命中率同向回升
  （目标位同 ADR-043）；风险是临时需要某工具时
  只能开新会话。
- 影响面：DSH 平台侧配置。

### ADR-045 — 挂机超时即处理；用拆会话替代会话内压缩

- 决定①：主会话连续空转超过 5–10 分钟就必须处理
  （干活、拆会话或收工落盘），不做马拉松式挂机。
- 决定②：优先用「拆短会话」代替会话内 compaction，
  把压缩放到会话之间做。
- 决定③：长会话不靠压缩维持。
- 用户裁决（依据）：「其他的问题还是要解决的，比如别让
  主会话长时间挂机（>5~10 分钟）、减少 compaction 触发
  （拆短会话、在会话之间压缩，而不是马拉松式长会话）」
  ——同段另点并行派发与同范围审查只跑一次，
  分别归 ADR-047、ADR-048。
- 为什么：gap≥10min 有 25.6% 概率丢 >10k token 前缀、
  ≥30min 为 33.3%；空闲 TTL 占 miss 的 13.4%、
  compaction/prune 占 23.5%，合计 36.9%；
  当前会话单次 11.5 分钟空闲丢 438,656 token，
  等于全会话 miss 的 26.1%。
- 否掉了什么：长挂机 + 事后 compress 的组合；
  靠会话内 compaction 维持超长会话。
- 后果与风险：预期回收各会话 miss 的 6.9%–26.1%；
  风险是拆会话会失去部分上下文连续性，
  须用落盘的中间产物（交接件、facts、审查原件）
  承接，而不是靠会话记忆。
- 影响面：DSH 使用方式 + 主会话执行纪律。

### ADR-046 — 单次派发往返上限 ≤20

- 决定：单次子代理派发的模型往返数上限 20；
  超限必须停手落盘，由新派发接续。
- 为什么：nresp≥21 的派发占 22.3%，
  却吃掉 60.7% 的时间 + 62.2% 的 token；
  实测投影 4707M → 3020M（−35.8%），
  限到 ≤10 则 2078M（−55.9%）；
  劈开几乎不增成本——冷启动只占 0.15%。
- 否掉了什么：把穷举核对全压进一个上下文。
- 后果与风险：token 至少 −35.8%；
  风险是跨任务上下文连续性下降，
  需要落盘的中间产物更完整。
- 影响面：主会话派发纪律 + 子代理任务书模板。

### ADR-047 — 真正并行派发

- 决定：相邻子代理调用的执行区间必须重叠；
  不得串行等一个回来再发下一个。
- 为什么：16 次派发落 11 批、12 次落 7 批，
  约 2/3 是单发；实测相邻 one-shot 调用的
  [start,end] 零重叠；主会话纯空转 19h38m（41.6%）。
  子代理侧也并行不了：`subagent depth 2 exceeds
  maxDepth 1` 真实发生（单会话 24–33 次），
  有子代理自述「本会话无法派子代理……
  全部工作在本会话用 bash/python 抽取完成」。
- 否掉了什么：一次只等一个子代理的做法。
- 后果与风险：保守回收空转 30% ≈ 每任务省 1h58m；
  风险是并发下的写冲突，需按只读 / 无依赖拆分。
- 影响面：主会话执行纪律（无代码改动）。

### ADR-048 — 同 stage 同 scope 的审查只跑一次

- 决定：同一 stage、同一 scope 的审查只跑一次；
  结果先落盘，再决定是否需要重跑。
- 为什么：PB02 的方向审查跑了两遍——
  第一遍已出 17 条 findings 并登记处置，
  1.5 小时后整轮重跑 23 分钟；
  WH 同一份 decision-log 被重写 9 次
  （子代理墙钟 3h45m）；
  PB02 的细节审查拆 3 段串行 1h20m。
- 否掉了什么：把「重跑」当默认动作。
- 后果与风险：三会话合计省约 2h20m；
  风险是修复后确实需要复验时，
  须走定向重派，而不是全量重跑。
- 影响面：主会话执行纪律 + 审查派发约定。

## 工作模块 MOD-8 — 产出文档精炼正式生效

目标不是让文档变短，而是让含义各归其位：
同一条含义只有一个权威位置，
每个任务都要的内容留在主文档，
只有部分任务用得到的放到指针后。
行数与字节都不是判据——实测标杆 641 行 / 108,922 B，
本次改写前的本任务产物 900 行 / 48,939 B，
行更多而字节只有前者的 44.9%。
断点在「落地 → 新任务实际产出」，不是没合并：
8 个文件全部在 main、骨架 8/8 齐全；
其后只有 `37296b29` 改过 1 行，且是加强。
真因是三份规范互相矛盾：标杆只命中当前模板 6/13 节；
SKILL 明确要求 4 样模板里没有落点的东西——
重开条件（`workflows/make-decision/SKILL.md:26`）、
`## 收敛检查`（`:31`）、五点覆盖矩阵（`:17`）、
偏离理由（`:29`）；标杆自己也不符现 SKILL
（无收敛检查、无偏离理由）。
「生成者不读模板」被证伪：反例照抄了当前模板 19/33 节
（含工作包则 24/33），它真的读了模板；
但它被 SKILL 逼着自创节并逐模块重复 ≈98+ 行。
也不是散文膨胀：反例增量 2,185 行的形式分布为
代码块 +912（41.7%）、表格 +391、空行 +351、
标题 +149、ADR 字段 +116、符号 +105、散文仅 +81（3.7%）；
标杆的结构化占 92.7%，散文只 4.8%。
只做减法的上限：现场基线 2,826 行，
只删重复与自创节得 2,325 行（−17.7%），到不了标杆量级；
再加 OI 表格化得 1,610 行（−43%）；
再加外置得 1,104 行（−60.9%），仍是标杆的 1.7×。
标杆的「薄」是外置换来的：主文档之外还有
`quality/evidence/` 下 10 个 `log-archive-*` 共 2,333 行，
总量 2,974 行，比反例还多；先例仅 1/121 份。
目标量级本身合理：标杆的行数接近仓库中位
（workflowhub 63 份中位 674 行、超过标杆的占 54%；
PaperBuilder 58 份中位 474 行）。

### ADR-049 — 唯一形状来源：把模板改成标杆的形状

- 决定：模板改成标杆的节结构、ADR **5 字段**、
  `## 大纲地图` = 本文节目录；
  模板与 SKILL 的落地由 build-plan 执行，
  落点＝`skills/decision-log/templates/decision-log-template.md`
  与 `skills/decision-log/SKILL.md`。
- 为什么：「像标杆」与「照模板」互斥——
  标杆对任何历史模板版本的命中最高只有 4/13；
  让模板本身等于标杆形状，互斥即消失。
  ADR 5 字段有机器消费者：
  `skills/wh-review/contracts/make-decision.md:17`
  逐字要求关键决定说明「后果」；
  方向审查焦点逐字含
  `failure consequences, and rejected alternatives`
  （`runtime/review/review-packet-identity.mjs:7`）；
  `runtime/review/stage-materials.json:9` 有
  `failure_consequence`。
  形状反证（时点：本次 MOD-8 改写之前）：本任务自己的
  decision-log 当时实测骨架 0、
  `## 要改哪些文件` / `## 验收面` / `## 大纲地图` 全 0、
  ADR 5 字段 42/42，编号用 `### ADR-0NN`
  （模板是 `#### ADR-001`）——当时连本任务都没按模板写。
  本次已按 F-027 的 B-1 补齐上述三节。
- 否掉了什么：让产物去模仿标杆（不可复核）；
  保留 4 字段（少一个有消费者的字段）。
- 后果与风险：预期主文档落到 600–700 行量级；
  风险是改模板会波及既有测试绑定，需逐个核对。
- 影响面：`skills/decision-log/templates/decision-log-template.md`、
  `skills/decision-log/SKILL.md`。

### ADR-050 — 模板节清单：核心三块 + 有消费者的节

- 决定：模板保留以下节，其余删除或外置。
  核心三块：`## 工作包`（含 ADR 5 字段）、
  `## 要改哪些文件`、`## 验收面`。
  机器与元：`## 任务身份`（全库唯一有生产机器读者的节）、
  `## 大纲地图`（本文节目录）、`## 范围与非目标`。
  有消费者的辅助：`## 原始需求`、
  `## 需求变更记录`（行级）、
  `## 未决项`（恢复：填充 63%，且 detail 合同要求）、
  `Supersedes`（恢复：填充 31/63，且
  `workflows/make-decision/SKILL.md:26` 至今要求）、
  `## 风险与延期交接`（含质量边界）、`## 外置事实索引`。
  删：`读者：` / `读完要能：`（0/63、代码读者 0）、
  `## 补充材料`（0/63）、
  `## UI 判定`（零生产调用方、0/63）。
- 为什么：逐节判定都基于实测填充率与真实消费者；
  三块核心正是 build-plan 真正使用的部分。
  那次任务的删除面被记错了：用户列的 5 节里，
  只有 `Supersedes` 与独立退役登记（6%）真在模板里被删；
  `整体成败` / `过程产物落点` 从来没进过模板
  （是标杆产物的节）；`Talk 批次` 没被删、还在模板里；
  原始记录是「用到 6 条 / 保留 7 条 / 删降级 6 条」，
  不是「三块」。
- 否掉了什么：按「零消费者」删节——
  「零消费者」只禁新增、不授权删除：
  24 节里只有 `## 任务身份` 有生产消费者，
  用它当理由会删掉整份文档；
  可删的正当理由是重复权威 / 已被取代。
- 后果与风险：形状统一后生成者不再需要发明第四种；
  风险是既有产物形状与新模板不一致（不回填旧日志）。
  `tools/cli/check-decision-log-chain.mjs` 的
  四字段契约因此断裂，处置登记为未决 H7，本条不定论。
- 影响面：模板与 `skills/decision-log/SKILL.md`，
  另加 `workflows/make-decision/SKILL.md`（执行者＝build-plan）。
- 本日志实际节与清单的差异：本件已补 `## 大纲地图`、
  `## 要改哪些文件`、`## 验收面`、`## 范围与非目标`、`Supersedes`
  五节；`## 工作包` 一项仍以 `## 工作模块 MOD-n` 形态存在，
  名称差异登记为待 build-plan 统一。

### ADR-051 — 删掉 SKILL 里的悬空要求

- 计划：`workflows/make-decision/SKILL.md` 的 4 条无落点要求
  （重开条件、`## 收敛检查`、五点覆盖矩阵、偏离理由）
  从 SKILL 删掉。
- 为什么：模板里从来没有落点，标杆自己也没有；
  它们正是那些自创节的直接原因（增量见导语）。
- 否掉了什么：把它们加进模板（会让产物继续比标杆长）。
- 后果与风险：SKILL 与模板不再互相矛盾；
  风险是这 4 条此前被当作质量要求，删除须说明理由。
- 影响面：`workflows/make-decision/SKILL.md`、
  `workflows/make-decision/steps.json:104`
  的措辞同步（执行者＝build-plan）。

### ADR-052 — OI 记录从 YAML 改成一表一行

- 计划：OI 记录改为一张表、一条一行（告别 4 段 YAML）；
  执行者＝build-plan，落点＝模板与两个 SKILL。
- 为什么：4 段 YAML 共 772 行 / 55 条，
  生产消费者为零——`grep oi_id|selected_disposition|
  outline_version runtime/ tools/ workflows/ tests/` 零命中，
  解析器已作死链删除；改后 57 行，省 715 行（−25%）。
- 否掉了什么：保留 YAML 形状。
- 后果与风险：零代码改动、涉及 3 个文件；
  风险是若有外部读者依赖 YAML 形状（实测无）。
- 影响面：模板 + `skills/decision-log/SKILL.md` +
  `workflows/make-decision/SKILL.md`。

### ADR-053 — `## 大纲地图` 改为本文节目录

- 决定：`## 大纲地图` 是本文档的节目录（6–12 行），
  不再是工作包清单。
- 为什么：模板现在要求「6–10 行工作包地图」，
  与后面的 `## 工作包` 重复权威；
  同一名字两个含义是生成者发明第三种形状的土壤
  （ASD-STE100 一词一义）。
- 否掉了什么：保留「工作包地图」的含义。
- 后果与风险：只改 1 处；
  风险是既有产物的大纲地图含义不同（不回填）。
- 影响面：模板（执行者＝build-plan，
  落点＝`skills/decision-log/templates/decision-log-template.md`）。

### ADR-054 — 事实外置：只移动，不复制

- 计划与已执行：逐字层全文、Talk 批次、grill、调研与
  审查处置明细移出主文档，放进参考文件夹；主文档只留指针。
  执行者＝本件与 build-plan，
  落点＝任务库 `quality/evidence/decision-log-refs/`。
- 为什么：标杆的「薄」是外置换来的（数字见导语）；
  不外置到不了标杆量级。
- 否掉了什么：把过程事实留在主文档；
  以及「镜像一份到参考文件夹」——
  撞 AGENTS.md「每类事实只留一份原始件」，只能移动。
- 后果与风险：主文档能到标杆量级；
  风险是读文档时要跳一次；先例数见导语。
- 影响面：`skills/decision-log/SKILL.md`、模板、
  `workflows/make-decision/SKILL.md`。

### ADR-055 — 两个标准的落点 = 形状即标准

- 决定：ASD-STE100 与 ISO 24495-1:2023 的核心思想
  落到模板形状上，不写散文规则清单。
  ISO 24495-1 **Relevant** → 有消费者才有节；
  **Findable** → 固定节 + 固定顺序 + ADR 固定 5 字段 +
  `## 大纲地图` 为本文节目录；
  **Understandable** → 结论前置（每节首句即结论）+
  一句一义 + 主动语态，字段名本身即提示；
  **Usable** → 核心三块 + 可 grep 的固定字段。
  ASD-STE100 **一词一义** → 同一概念全文只用一个词；
  **一句一义** → 一个 ADR 字段一句话；
  **同一事实只出现一次** → 逐字 / Talk / grill /
  调研 / 审查处置一律外置。
  三方一致：STE 的这两条就是**单一权威**——同一含义只允许一个权威位置，
  重复会让该含义在读者心里的权重超过它的真实等级；
  ISO 的四原则就是**信息层级 + 就近归置 + 完成判据**。
  两个标准给的是原则，落地机制是信息层级（ADR-057）。
- 为什么：上一轮把标准写成散文规则清单放进 SKILL，
  实测传播为 0——`grep STE100|24495|简明语言` 全仓
  只命中归档的 2 个文件；
  形状即标准时，生成者按模板填即自动满足，
  不需要知道标准存在。
- 否掉了什么：沿用归档 ADR-023 `:306` 的否决——
  照搬全部规则、英文许可词表、字数门、
  句法上限、评分器。
- 后果与风险：标准不再是「声明」而是「形状」；
  风险是它仍依赖模板被遵守（见 ADR-056）。
- 影响面：模板 + 两个 SKILL。

### ADR-056 — 明确不做：不新增任何校验器

- 决定：MOD-8 不新增任何校验器、指标、审查焦点；
  不恢复 `a74a9f2d` 删掉的那批断言代码；
  不把「像不像标杆」写进 wh-review 合同。
- 为什么：F-026 的结论是「在『不加校验』约束下
  无法自动防住」——失效点是承诺与制品之间没有机器连接。
  路径 1（让下游真实失败）经实测不可行：
  build-plan 侧零代码读 decision-log 正文；
  decision-log 连 build-plan 审查包的合法键都不是
  （传进去抛 `MATERIAL_INCOMPLETE: forbidden`）；
  现有测试 fixture 用一行 `# Decision log` 即通过全部契约；
  按体积拒绝材料已被本仓主动删除
  （`runtime/review/review-input-bounds.mjs:59-62`
  逐字写 `no longer rewrites or rejects material by local size`）。
  那次交付的其他事实一并登记：同一 commit `a74a9f2d`
  净删 560 行 / 新增 0（1365→805，HEAD 884），
  删掉 21 个函数 + 2 个常量、21 种报错串形状，
  而 P7 计划只点名 5 个导出；commit message 只有标题、
  正文 0 字节；模板改动=P5、删解析器=P7，
  目的分列、后果耦合。
  为什么没被发现：这条要求从来没被翻译成任何断言——
  验收 driver 对该 AC 只有 3 个读回键、无锚点键；
  删掉那批断言的 P7 由另一条 AC 的 oracle 以
  「符号必须不存在」反向断言判 pass；两条 AC 互不引用；
  12 份 review JSON、92 条 finding 中提及
  锚点 / 函数名 / 行数变化的 0 条；
  唯一近命中的处置是 `fixed` = 把锚点检查一起删掉；
  发布前检查根本没覆盖。
  自禁令自身也矛盾：AC-AFH-019 的失败条件逐字用「或」
  并列「新增任何校验器」与「任一必保锚点改坏」——
  锚点靠 reader 才存在，reader 就是校验器，两支互斥；
  而删除授权（Q13）的唯一理由是「零调用者」，
  F-026 §四 的全部意义正是「调用者计数不是删除判据」。
- 否掉了什么：加结构校验器 / 加自数指标 /
  写进审查焦点 / 恢复被删断言。
- 后果与风险（后果登记）：**这条不构成自动防线**。
  它的有效性依赖「三份规范不再互相矛盾 + 形状统一」，
  这两项由 ADR-049…ADR-055 的模板与 SKILL 改动交付，
  执行者＝build-plan，落点＝模板与两个 SKILL。
  缺失时的表现：模板与 SKILL 仍互相矛盾、形状未统一，
  产物照旧膨胀而没有任何机器读者会拦。
- 影响面：无代码改动。

### ADR-057 — 模板形态 = 步骤层 + 参考层 + 指针层

- 决定：模板按**信息层级**组织。
  步骤层：按什么顺序写哪几节，每节自带完成判据；
  参考层：形如 ADR 五字段的字段定义，供随时查；
  指针层：标杆作为示例放在末尾，按指针取用。
- 为什么：现在的模板是「286 行骨架 + 规则散文」，
  其中 60 行是规则描述，而该描述的实测传播为 0
  （见 ADR-055）；
  按信息层级，规则应变成字段定义与每节的完成判据，
  不是一段要读要记的散文。
  完成判据要给到「可判定」与「有强度」两档，
  例如「每个工作包的决定都写明了影响面」、
  「每条验收标准都有证据指针」、
  「文件表里每个路径都是仓库相对路径」；
  不写「理解到位」「内容完整」这类模糊边界
  （会诱发提前收工）。
- 否掉了什么：把规范写成散文规则清单（上一轮的做法）；
  把规则留在 SKILL 而不进模板形状。
- 后果与风险：规则量大幅减少，但每条都要能被判定；
  风险是部分写作要求只能靠范例传达，需依赖指针层。
- 影响面：`skills/decision-log/templates/decision-log-template.md`、
  `skills/decision-log/SKILL.md`。

### ADR-058 — 披露判据 = 分支测试

- 计划：一个节放主文档还是放参考文件夹，判据是分支测试——
  每个任务都要的留在主文档；
  只有部分任务才会用到的，放到指针对外。
  留主文档：任务身份、大纲地图、工作包与决定、
  要改哪些文件、验收面、范围与非目标。
  放指针后：原始需求全文与索引、需求变更记录全文、
  逐字声明层、Talk 批次、grill 记录、调研登记、
  审查处置明细、Supersedes 明细、未决项明细。
- 为什么：这给「外置」一个可复用的判据，
  不再只是「学标杆」（先例数见导语，不可复制）；
  也符合 ISO 24495-1 的 Relevant。
- 否掉了什么：以「零消费者」为理由删节
  （同一否决见 ADR-050）；以「标杆这样」为唯一理由。
- 后果与风险：判据可复用到其它文档；
  风险是判据本身需要判断力，边界案例会有分歧。
- 影响面：`skills/decision-log/SKILL.md`、模板（执行者＝build-plan）。

### ADR-059 — 要求写成肯定式

- 决定：模板与 SKILL 里的要求一律陈述目标行为
  （写成「写成什么样」，而不是「别写成什么样」）。
- 为什么：禁止式会把被禁的行为一并拉进上下文，
  让该行为更容易发生。
  已有的反面例子是模板里那些「不是质量门」的自我声明——
  它们把「质量门」这个概念反复说进上下文。
- 否掉了什么：用禁止句约束生成者（把目标行为写成反面清单）。
- 后果与风险：少数硬护栏仍可能需要禁止式，
  须与肯定目标配对出现；风险是改写工作量。
- 影响面：模板 + 两个 SKILL。

### ADR-060 — 清掉 no-op 与「查得到的东西」

- 决定：模板与 SKILL 里，凡是模型默认就会遵守的句子
  整句删除，不做逐字精简；
  凡是在环境里一查就能得到的东西
  （文件清单、命令用法、目录结构）不写进文档。
- 为什么：骨架头两行零采用的成因就是它们是 no-op，
  白付代价（采用数见 ADR-050）；
  而环境本身就是权威来源，文档复述它只会过期。
- 否掉了什么：保留「读者：/读完要能：」这类自述；
  把命令用法抄进 SKILL。
- 后果与风险：文档变短，但需要判断哪些是 no-op；
  判断是相对于模型默认的，需要实测而不是争论。
- 影响面：模板 + 两个 SKILL。

## 工作模块 MOD-7（续）— 派发机制缺口

本节补齐 MOD-7 缺的那一半：MOD-7 已测出「成本在往返次数 × 每次重发的
上下文」，但当时的落点全是纪律（ADR-043…ADR-048）。
本节把其中能变成机制的两条落成机制（ADR-061、ADR-064），
其余六条如实登记为纪律（ADR-062、ADR-063、ADR-065、ADR-066、ADR-067、ADR-068）。
本节位置在 MOD-8 之后、`## 要改哪些文件` 之前，理由有二：
「（续）」与 `## 工作模块 MOD-2（续）` 同形，且 ADR 编号按出现顺序
仍严格递增（ADR-061…ADR-068 接在 ADR-060 之后）。

### ADR-061 — 派发模板（七节 + 落盘一份原始件）

- 决定：主会话派发子代理的任务书固定七节、固定顺序——
  ①头（四句：为什么干 / 边界 / 能查的不许问 / 不许静默停下）
  ②我替主会话拍的板（放最前，一表三列：问题 / 默认值 / 猜错的代价）
  ③白名单地界 + 冻结区（用白名单，不用黑名单）
  ④前提（已实测，每条带来源）
  ⑤任务 0＝核对前提（跑指定命令核对 ④ 的每条数字与路径；
  对不上就停、只做不受影响的部分、把差异写进回执的未闭合项）
  ⑥你要回答的问题（一个）
  ⑦交付与完成条件（放最后）。
  任务 0 的依据：本轮执行者自发做了这一步，并当场报出派发方
  **5 处前提错误**——任务库根差一层目录、引用上一轮的字节数当本轮、
  重复行锚点指到表头、把类型名当字面串、条款数写错。
  把「核对前提」从派发方的自觉变成执行者的第一步，是有效的。
  配套机制＝**任务书与回执各落盘一份原始件**，
  落盘位＝任务库 `quality/evidence/dispatch/`，
  文件名含 UTC 日期与三位序号；
  消费者＝接手会话 / 审计者 / 复跑验收者。
- 为什么：现在「派发」这一类事实恰恰没有留档——
  派发信原文在 Codex rollout 里是 Fernet 加密串、明文不可还原
  （`F-005:311-312`、`F-020:271`），G-003 统计的 17 处任务书违规
  只能靠子代理报告转述，无法回读原文；而 `AGENTS.md` 的证据硬规则
  要求每类事实只留一份原始件。没有原始件，任务书自身的事实
  （前提对不对、写了几个问题、实跑了几条命令）无法被独立复核。
  事实登记：全仓 `dispatch_record` / `dispatchRecord` /
  `inherit_mode` / `inheritMode` 四词零命中；「派发记录」与
  「继承模式」各只有 1 处名字、无字段表（G-001 ③ 实测）。
- 否掉了什么：再往 `AGENTS.md` 加一段散文。
  那会成为第 13 条零机制规则——G-001 实测现有 15 条规则里
  零机制 12 条、唯一 reader `tests/acceptance/card-03-current.mjs`
  已悬空（指向的规格目录已归档，33 个基线文件 31 个不存在），
  且只在 `AGENTS.md:25` 禁止的全量 vitest 里才会跑到。
- 后果与风险：**本条仍然依赖主会话照它写**——模板与落盘位都不是
  自动防线：没有任何程序会因为七节缺失或原始件未落盘而报错；
  如实的登记见 ADR-066。落盘件的代价是任务库多一类文件、
  主会话每次派发多写一次盘。
- 影响面：任务库 `quality/evidence/dispatch/`（新增落盘位）
  + 主会话派发纪律；不改仓库内任何文件。

### ADR-062 — 任务书只写查不到的东西

- 决定：任务书里的材料一律给 `ref` + `sha256` + ≤500 字摘要，
  不内联正文（`AGENTS.md:19` 已有同向要求，本条把它落到任务书）；
  并且**派发前提必须实测**——凡会改变结论的前提，由派发方
  实测过一次并带日期：路径存在、字段存在、命令存在、数字正确。
- 为什么：实测 **5/32** 份报告报出派发信自身的**事实错误**——
  `F-003:155/466` 给的路径 `skills/architecture-code-review` 不存在
  （真实是 `architect-code-review/`）、`F-011:9` 三条前提全部不成立、
  `F-017:1293` 写「224 条记录」实测 226、`F-020:27` 写 74 MB
  实测 105.99 MB、`F-021:339` 两份报告的 token 快照不可直接相加。
  另一半理由是可复算的量：内联材料直接进入每次往返的重发量，
  平均每次调用输入 **203,500 token**（MOD-7 导语）。
- 否掉了什么：把材料内联进任务书；
  以及用字数上限（leader 的 `≤4000 字符`）代替上面两条——
  workflowhub 用 `subagent` 派发、不存在粘贴天花板，
  超字数的代价不是「粘不进」而是「派发信本身写错」（G-002 C-1）。
- 后果与风险：依赖主会话执行实测；本条不构成自动防线（ADR-066）。
  风险是「实测」本身要花主会话往返，故实测范围必须收窄到
  「会改变结论的前提」（见 ADR-063）。
- 影响面：主会话派发纪律 + 任务书模板（ADR-061 的②④两节）。

### ADR-063 — 一个任务书一个问题 + 一文件一次脚本抽取

- 决定：一份任务书只回答一个问题；
  实跑范围收窄到「会改变结论的前提」；
  同一文件的多处抽取用一次脚本批量取完，
  禁逐条 `sed` / `ls` / `cat` 式实跑。
- 为什么：`corr(exec 命令数, nresp)=+0.976`、`Σexec/Σnresp=0.665`，
  而 17,344 条 exec 合计 6.12h、只占 2.6% 时间——
  命令多是往返多的**结果**，不是原因；「穷举 + 必须实跑」的写法
  是往返放大器（MOD-7 导语，F-020 同向）。
- 否掉了什么：把「穷举核对 + 每条都必须实跑」当默认写法。
- 后果与风险：单份任务书变窄，复杂问题要拆成多份任务书，
  主会话派发次数会上升；拆分点选错会丢掉交叉结论。
  属执行纪律、不构成自动防线（ADR-066）。
- 影响面：主会话派发纪律（无代码改动）。

### ADR-064 — 允许一级子代理扇出

- 决定：改宿主 `maxDepth`，让一级子代理能再派**只读取证**子代理；
  二级只读、不再向下。
- 为什么：`subagent depth 2 exceeds maxDepth 1` 真实命中
  `session-29866529` 24 次、`session-3b9547fc` 33 次、
  另三个会话各 25 次；子代理自己写下后果「本会话无法派子代理……
  全部工作在本会话用 bash/python 抽取完成」（`F-020:364`）。
  命中场景全在 nresp≥41 桶，该桶占 **40.3% 时间 / 39.3% token**。
  其机制后果：本该再扇一层的穷举核对被压进一个上下文，
  正是 ADR-046 要限的那个「nresp 大的派发」。
- 否掉了什么：把「子代理自己拆着做」当纪律要求——
  实测它做不到，这是宿主配置限制、不是纪律问题；
  也否掉了「不动宿主配置、只在文档里提醒」的做法。
- 后果与风险：**这是机制（改配置），不是纪律**——
  它是本节六条里唯一能真正降低单次派发往返数的一条。
  风险三条：并发写冲突（二级只读可规避）、
  宿主升级会覆盖该配置（需在宿主侧留配置说明）、
  更深的扇出会再次抬高总 token（故上限锁在二级只读）。
- 影响面：DSH / 宿主侧配置（`maxDepth`），非本仓库代码。

### ADR-065 — 一次定形不返工

- 决定：同一产物不得分多轮增量补齐；
  形状（模板 / 节清单 / 表格列）先定下来，再一次写全。
- 为什么：本任务 decision-log 经历多轮改写
  （可复算轮次、净变化量与 sha256 见 `## 最终确认` 的更正段），
  每轮都要求子代理整读全文；而单写者文件使并行不可能——
  返工只能串行。同向实测：同一份 decision-log 被重写 9 次、
  子代理墙钟 3h45m（ADR-048）。
- 否掉了什么：先写骨架、再逐轮补节的增量写法。
- 后果与风险：形状决策全部前移到第一次落笔之前，
  前期需要更多取证；形状定错会把错误放大到整份产物。
  属执行纪律、不构成自动防线（ADR-066）。
- 影响面：主会话写作纪律 + MOD-8 的模板与节清单
  （ADR-057 的三层形状）。

### ADR-066 — 纪律类不作自动防线的诚实登记

- 决定：MOD-7 里凡属纪律的条目（ADR-045、ADR-046、ADR-047、
  ADR-048、ADR-061、ADR-062、ADR-063、ADR-065、ADR-067、ADR-068）
  一律登记「依赖遵守、不构成自动防线」。
- 为什么：F-026 的结论是——在「不上校验」约束下
  （本件 ADR-056 与「范围与非目标」第 12 项），纪律无法自动防住。
  本次派发自证同向：任务书普遍 2,000–3,000 词、连续串行派发、
  每次调用未命中 18,329 token＝基准未命中（1,287）的 14 倍
  （自证值的原件＝本次任务书与回执，落盘于
  `quality/evidence/dispatch/2026-10-07-001-*.md` 与
  `2026-10-07-002-*.md`）。
- 否掉了什么：把纪律条目当作「机制已补齐」来宣称；
  也否掉了为此加校验器——那会撞 ADR-056 的「不新增任何校验器」。
- 后果与风险：读者不会误以为这些条目有机器消费者；
  风险是「登记为纪律」会被读成「不必执行」——
  本条的登记是**诚实标注，不是免除**。
- 影响面：本日志 MOD-7 / MOD-8 各条 ADR 的「后果与风险」
  字段表述口径；无代码改动。

### ADR-067 — 产物切分（解串行）

- 决定：派发前先看产物形状——能不能把待改内容变成多个小文件
  （每个文件有独立写者，可并行）；不能，就把改动点压到 ≤5 处。
  **不派发「整体修改一个大文件」的任务。**
- 为什么：单文件 ⇒ 单写者 ⇒ 编辑必须串行 ⇒
  全部改动只能塞给一个子代理 ⇒ 它必然跑几十个模型往返。
  实测机制是「时长 ≈ 往返次数 × 每次重发上下文」，
  平均每次调用重发 **203,500 token**（MOD-7 导语）；
  本任务 decision-log 经历五轮整体改写
  （807 → 900 → 1392 → 1458 → 1455 行；其中 807、900、1458、1455
  四轮有原件可复算，1392 一轮无原件可证——
  逐轮来源、净变化量与 sha256 见 `## 最终确认` 的更正段），
  每轮都是「整体修改一个文件」。
  **病根是产物形状，不是任务书写法。**
- 否掉了什么：把「写更好的任务书」当作唯一解
  （ADR-061…ADR-063 治的是派发写法，治不了单文件串行）；
  把「拆成多个并行子代理」用在同一个文件上（写冲突）。
- 后果与风险：ADR-054 的事实外置**不只是为了缩短文档，
  它把单写者变成多写者**，是这条的前提。
  残余风险＝多文件后**接缝没人接**（leader 的「接缝没人接是
  头号事故」），故多文件时必须写明每个文件的唯一归属与接缝。
- 影响面：主会话派发纪律；与 ADR-054、ADR-065 互为前提。
- 自检判据（可当场执行、不依赖自觉）：任务书里**数得出改动点**。
  数不出来——出现「整体重写」「全文对齐」「覆盖全部 N 组」
  这类词——即违规。

### ADR-068 — 任务书必须给改动点清单

- 决定：任务书对每个改动点写明①**锚点**（一段可 `grep -n` 命中的
  现成文本）②**改什么**（目标文本或明确动作）③**改完怎么核**
  （一条命令或一个可观察结果）。**不给「整体重写」「全文对齐」
  「覆盖全部 N 组」这类无锚点的目标。**
- 为什么：单文件多改动本身不慢，**慢的是让执行者去「发现」范围**——
  grep、读、判断边界、改、再核，每一步都是一次模型往返，
  而实测「时长 ≈ 往返次数 × 每次重发上下文」（`corr=0.939`），
  平均每次调用重发 **203,500 token**（MOD-7 导语）。
  锚点由派发方一条 `grep -n` 即可算出，
  **把发现成本从执行者转移到派发方，是净收益**。
- 否掉了什么：用「写得更短」代替「写得更准」
  （ADR-062 治宽度，本条治**精度**）；
  把「自己找范围」作为执行者的职责。
- 后果与风险：派发方多花一条 `grep`；残余风险＝锚点会随文件改动漂移，
  故**锚点必须写成现成文本片段而不是行号**，行号只作参考。
- 影响面：主会话派发纪律；与 ADR-062、ADR-063、ADR-067 互为前提。
- 自检判据（**派发前必须执行，并把输出贴进任务书**）：每个锚点
  `grep -n` 能命中**且恰好命中 1 处**；命中 0 处、命中 >1 处、
  或命中的位置不是目标位置，均不合格。**判据不执行即等于没有**——
  依据：本轮任务书 5 处前提错误（任务库根差一层目录、
  引用上一轮的字节数当本轮、重复行锚点指到表头、
  把类型名当字面串、条款数写错）**全部可由这条判据当场发现**，
  而派发方未执行它。

## 工作模块 MOD-8（续）— 产出文档瘦身落点

本节补 MOD-8 缺的落点：MOD-8 已定「含义各归其位」的方向，
但没说**哪一类产出文档真的瘦得下来**，也没清掉模板自身的硬 bug。
本节落六条决定（ADR-069…ADR-074），全部依据可复算实测；
逐类行数、节名清单与复算命令的唯一汇总位置是任务库
`quality/evidence/decision-log-refs/log-ref-mod8-doc-slimming.md`，
被引研究原件 `H-001`（sha256 `24d7764e…`）/`H-002`（sha256 `90b63ac8…`）均未改动。

### ADR-069 — 瘦身着力点按实测排序，只改 decision-log 一类

- 决定：产出文档瘦身**只对 `decision-log.md` 做结构改造**；
  `spec.md` / `prd.md` / `phases/P<n>.md` **不做强制外置**，
  它们只做两件事——清掉模板回显、不新增过程类内容。
- 为什么：四类的可外置体量实测差两个数量级——
  decision-log **73.1%**（7,465 / 10,208 行），
  而 spec **4.7%**、prd **15.2%**、phase **7.5%**；
  spec 与 phase 的可外置部分已集中在 `材料导航`、`L2 可删除参考`、
  `补充材料` 三个纯指针节，本身已是最短形态（spec 必要内容占 **95.3%**）。
  给瘦不下来的文档强加瘦身规则有两个恶果：
  **删掉必要内容**、且**规则本身零收益**。
- 否掉了什么：对所有产出文档一刀切「必须外置」；
  按文档类平均用力。
- 后果与风险：收益集中在一类；若日后 cohort 变化（例如 spec 长出过程类节），
  本条须按新实测重判。风险是「只改一类」被误读成「其余三类不用管」——
  其余三类仍有「清回显 + 不新增过程类内容」两条义务。
- 影响面：`skills/decision-log/SKILL.md` 与
  `skills/decision-log/templates/decision-log-template.md`；
  其余三类模板不改结构（回显除外，见 ADR-071）。

### ADR-070 — 只有「必要内容」有资格当顶层节，过程类只能作指针

- 决定：**不封闭节名；但要规定「什么有资格成为顶层节」**——
  只有「下游要用的必要内容」有资格成为顶层节；
  **四类过程内容（修改日志 / 参考 / 证据 / 过程记录）不得成为顶层节，
  只能作为指针行存在。**
- 为什么：膨胀的来源不是「写得啰嗦」，而是
  **过程类内容拿到了顶层节的资格**。
  实测 14 份 live 产物出现 **97 个不同顶层节名，其中 74 个不在 24 个模板节内**，
  多出来的名字就是会话过程本身——
  `Talk round 5`、`CPU 与温度问题:实测诊断`、`build-plan 开始与技术补漏`。
  中位产物只有 **302 行 / 19 个顶层节**，并不离谱；
  **要治的是尾部**（MAX **2,945 行 / 525,209 B / 35 个顶层节**）。
  判据因此不是节名白名单（H-002 已证伪其可行性，见 ADR-072），
  而是一句人工可判定的问话：「**这一节去掉之后，下游会不会做错事？**」
  会 ⇒ 必要内容，有资格作顶层节；不会 ⇒ 过程类，只能作指针。
- 否掉了什么：**按节名白名单封闭**（H-002 实测 0.93% 通过率、
  做成校验器会自证违规）；**以及以「行数 / 字数是问题」为前提**
  ——实测中位 302 行并不离谱，要治的是尾部。
- 后果与风险：**优先对象**是 decision-log 的过程类·证据 **3,091 行**与
  过程类·过程记录 **2,023 行**——两者在 `quality/evidence`、`quality/reviews`
  已有单点原件，**只移动不复制**（复制违反证据只留原始件）。
  风险是判据需判断力、边界案例会有分歧（与 ADR-058 同一风险），
  故本条**不设阈值、不做机器校验器**。
- 影响面：`skills/decision-log/SKILL.md`、
  `skills/decision-log/templates/decision-log-template.md`；
  与 ADR-058（分支测试）、ADR-050（可删理由）互为前提。

### ADR-071 — 模板回显换成真值示例

- 决定：把四个模板里的占位写法换成**真值示例**。
  `spec-template.md` **115** 处 `[填写：`（含占位符行 **106** = 350 行的 **30.3%**）、
  `phase-template.md` **15** 处（**13 处落在表格行内**）改为真值；
  `prd-template.md`（**48** 处 `{{mustache}}`）与
  `decision-log-template.md`（**45** 个方括号占位 token）
  **按「照抄它会被拒吗」判**，会拒就改。
- 为什么：模板自身必须是**合法实例**。
  `runtime/stage/stage-content-contracts.mjs:436-441` 的 `placeholderOrTemplateNoise`
  （全仓唯一调用点 `:764`）作用于 spec.md `## 实现设计（全局权威）`
  下 4 个 H3 子节的节体；最小复现走真实导出 `validatePostPhaseContract` 实测：
  原样照抄模板 → **4 条 `requires concrete` 错误**；
  换真值 → **0**；写 `{…}` → 4；写 HTML 注释 → 4；写一行裸 `TBD` → 4；写在句中 → 0。
  即**「照模板填」必被拒**——这是模板自身的硬 bug。
  产物侧回显≈0（14 份 decision-log 的 `[填写：` = 0、`{{}}` = 2；spec = 0；prd = 0），
  **成本全部落在模板自身**。
- 否掉了什么：保留占位、加一句「请替换」；
  用「删掉占位」代替「给真值」（删占位会同时删掉该节的写作意图）。
- 后果与风险：模板变成可照抄的合法实例；风险是真值示例可能与读者仓库无关，
  须靠「照抄形状、勿照抄文字」的措辞与 ADR-060 的 no-op 判据配合。
  改模板会同时改动四个文件的体积，须逐文件复算行数。
- 影响面：`skills/spec-specify/templates/spec-template.md`、
  `skills/spec-plan/templates/phase-template.md`、
  `skills/spec-prd/templates/prd-template.md`、
  `skills/decision-log/templates/decision-log-template.md`。

### ADR-072 — 不做节名封闭（这是决定，不是未决项）

- 决定：**明确不做「产出文档顶层节名封闭」**；
  不做 runtime 校验器、不做指标、不做审查强制节名。
- 为什么：三条独立理由，每条可复算（来源 H-002）。
  ①**实测通过率 0.93%**：全量 215 份产物
  （63 decision-log + 98 spec + 54 phase）中，
  同时过「计数」与「节名逐字节落点」的只有 **2 份**，
  且这两份各只有 **4** 个顶层节——「通过」的形态是「节更少」；
  逐类 decision-log **0/63**、spec **0/98**。
  最强反例：`acceptance-flow-hardening-20261006/spec.md`
  顶层节数正好 **20 = 模板 20**，但 **5 个节名全错**
  （计数判「通过」、节名判「违规」，两者结论相反）。
  ②**会自证违规**：做成 runtime 校验器就必须在 `runtime/` 里写出节名，
  而 AC-AFH-015 要求 `grep -rn '验收面' runtime tools tests lib config workflows` = 0
  （本轮实测 = 0）。
  ③**22/24 无消费者**：24 个模板节里只有 `## 任务身份` 与 `## UI 判定`
  两个有机器读者，其余 22 个在 `runtime/`、`tools/`、`schemas/` grep 全 0 命中。
  此外还撞 CONSTITUTION 五条（F5 / F8 / F10 / F11 / Q1）、
  `CLAUDE.md:13`/`:14` 与 `AGENTS.md:63/66/77`（来源 H-002 `:202-216`）。
- 否掉了什么：把节名封闭登记成「以后再说的未决项」
  （写成未决项会被反复重提，故本条落成决定）；
  以「换个更宽的节名白名单」绕开 0.93%。
- 后果与风险：文档形状继续靠人工判据（ADR-070）而非常量校验，
  收益上限低于自动防线；这是**明知的取舍**，不是遗漏。
  风险是日后有人以「加个校验器更省事」重提，须回到本条的
  0.93% 与「自证违规」两条事实。
- 影响面：无仓库改动（本条是「不做」的决定）；
  与 ADR-056（不用校验器 / 指标强制文档形状）一致。

### ADR-073 — 模板层级与产物对齐：本轮不做降级，以模板为准

- 决定：**本轮不做层级降级**；只登记「模板与产物的层级写法不一致」这一事实，
  并规定**以模板为准、产物按模板层级**；
  改动落在模板侧（若模板自身前后不一致，就在模板里统一）。
- 为什么：实测降级**收益不成立**——
  `## 工作包` 在模板（`decision-log-template.md:156`）与产物里**都是 H2**；
  把工作包降为 H3 只对 `card-02` 那一份有效（顶层节 35 → 30），
  对其余 live decision-log **净 0**（它们没有工作包节，或用 `## 决定` 承载）。
  且模板把 `### 决定` 定为 H3（`:164`）而产物用 `## 决定`（H2），
  说明真实产物把模板标题当「形状参考」、不当「逐字名」。
  单向对齐（以模板为准）比双向改造成本低，且不新增控制面。
- 否掉了什么：本轮做工作包降 H3；
  按产物侧写法反向改模板（产物侧 97 个节名里 74 个不在模板内，
  反向收敛无终点）。
- 后果与风险：层级不一致这一事实被**保留而非消除**，
  须在模板里至少做到自身前后一致；风险是「以模板为准」这条
  在模板自身不一致时无解，故附带要求先统一模板内部。
- 影响面：`skills/decision-log/templates/decision-log-template.md`
  （只在模板自身不一致处统一，不新增降级）。

### ADR-074 — 子规则：锚点必带基准目录 + 研究结论走 ref

- 决定：①任务书里**每条路径锚点必须写明基准目录**
  （认证 worktree 根 / 任务库根），否则执行者必须自己找；
  ②**研究结论也走 `ref` + `sha256` + ≤500 字摘要，不内联**。
- 为什么：两条都有本轮现场实例。
  ①任务书写的任务库根
  `/Users/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007`
  **实测不存在**（`ls -l` 与 `stat` 均 `No such file or directory`），
  真实根是 `/Users/Hugh/Hugh/Knowledge/Projects/...`（多一级 `Hugh`）——
  执行者为此多付一次全盘 `find` 往返；这正是 ADR-068 要治的「发现成本」，
  只是漏在基准目录这一层。
  ②派发原件 `2026-10-07-001-…-dispatch-brief.md` 实测 **151 行 / 16,666 B**
  （本任务书所引 16,666 B 即此件），其中约两千字是内联研究结论；
  本轮任务书 `2026-10-07-003-…-dispatch-brief.md` 实测 **106 行 / 12,407 B**，
  其「# 4 前提」一节同为内联研究结论——**违反 ADR-062 本身**
  （任务书只写查不到的东西；原文应给 ref）。
- 否掉了什么：把「基准目录」当成可推断的上下文而不写；
  把研究结论内联进任务书（理由常是「省一次取件」，
  实测代价是任务书体积翻倍、且原件与副本会漂移）。
- 后果与风险：任务书变短、复算更容易；派发方每轮多写基准目录与 ref。
  风险是基准目录写错会让全部锚点失效——须以「先 `ls` 基准目录再发」自检
  （本轮任务书即在此步失守）。
  本条属执行纪律，不构成自动防线（ADR-066）。
- 影响面：主会话派发纪律 + 任务书模板（ADR-061 的①节）；
  与 ADR-062、ADR-068、ADR-066 互为前提。

## 工作模块 MOD-9 — 008 真实新增：close 默认安全清理

来源与研究只定位原件：U-018 / V-021；任务库根 `quality/tests/2026-10-08-231-close-default-cleanup-readonly-audit.md:5-22`、`quality/tests/2026-10-08-232-close-default-new-decision-material-audit.md:5-23`。当前宪法与方法没有默认永久保留 task-owned 工作区/分支的决定；本次 210 候选因未知独有备忘暂保现场，不推成每任务默认。旧 ADR-001…074、004 TTL 选择及原交接均保正文；本条新增当前方法缺口的决定，不虚构旧 ADR 被 supersede。

### ADR-075 — close 最后默认安全清理已交付任务工作区与分支

- 决定：沿 U-018 的真实用户选择，将当前普通 close 方法明确为：最终一次展示结果、质量限制、已交付证明与精确动作范围并取得确认后，默认归档当前 task 材料，正常移除 task-owned 工作区、删除已交付本地任务分支；精确远端任务 ref 存在且已交付时正常删除。主仓 main 与用户既有非 task-owned 工作区保留。先处理具名未交付提交、未知私料与唯一原件；范围未确认或安全条件未满足时保现场并如实报告具体未完成动作。未来会话备忘从创建时使用既有外置任务目录的普通具名件；本次四份旧备忘是否可丢仍在最终一次范围确认中展示，不假称已外置保管。仅按目录名识别 sidecar 不足以授权删除唯一 raw，既有清理消费者须保这一反例。此条是拟方法/实现范围，不是已完成或立即删除授权。
- 为什么：008 原话希望任务最终 close 默认清理；当前方法只写最终确认边界而缺正常收尾清单，210 对独有 ignored 内容的本次保护被误泛化为一般保留建议。231 独立审计区分方法空白、安全阻碍与本次例外；默认清理和唯一来源保护应同时到真实消费者，不靠反复推荐保留解决。
- 否掉了什么：把 task-owned 工作区/分支永久保留作为通用默认；忽略 ignored/untracked 或只凭目录名强删；默认删除 main/用户既有工作区；用 force、`-D`、新公共 close 命令、旧 plan/对象图、质量 gate 或重复 metadata 账本完成收尾；把本次 close 清理偷换成 004 明确延期的 packet TTL / load 删除。
- 后果与风险：最终范围确认必须列精确 archive/worktree/local/remote 路径、tip、已交付关系与私料/唯一原件保管或明确丢弃选择，随后即时按实际 cwd/branch/HEAD record/consume 并分别保存动作原件。先消除可解决的阻碍，而不是把可丢 task memo 变成永久保留要求；无法证明内容可丢、仍有未交付提交或权限错误时不强删，只保相应现场与失败事实。独立受影响复验尚待实际执行；实际 task close、旧 memo 丢弃与 packet TTL 均未发生。本次新增真实决定不重排旧日志四类 H2，AC-REV-012 仍 incomplete，不用本模块单独通过替整件日志判据。
- 影响面：认证 worktree 根 `docs/standard-workflow.md`、`workflows/verify-code/SKILL.md`、`skills/stage-handoff/SKILL.md` 三现有方法；现有清理 owner `runtime/task/workspace.mjs` 与 `tests/contract/workspace-cleanup.test.mjs`，必要既有职责登记 `docs/architecture/move-map.json` 由实施 owner 据真实 consumer 修。材料唯一持笔仅本 `decision-log.md`、`spec.md` 末尾 008 增量、`phases/P10.md` 原 T025 外续节；不增 Phase/公共命令/schema/文件框架，不改原 32AC、oracle、历史原件。普通主会话依最终确认消费标准方法，具体 `git worktree remove` / `git branch -d` / 远端精确 ref 正常删除范围由实际安全检查确定，未执行不填成功。

## 要改哪些文件

本表由各 ADR 的「影响面」字段汇总派生；只列日志中 ADR 已要求的改动，
路径均为仓库相对路径。

| 路径 | 改什么 | 由哪条 ADR 要求 |
| --- | --- | --- |
| `runtime/stage/stage-content-contracts.mjs` | 删零消费者 reader `readUiApplicabilityFromDecisionLog` | ADR-016 |
| `runtime/task/task-store.mjs` | 放开 `STAGE_ROW_KEYS` 以容纳新增字段 | ADR-018、ADR-020 |
| `runtime/review/review-output.mjs` | 收紧解析、抬高解析上限 | ADR-030、ADR-033 |
| `runtime/review/canonical-review-result.mjs` | 改计数口径、修静默丢弃 | ADR-007、ADR-032 |
| `runtime/review/ocr-delegation-adapter.mjs` | 拆 antigravity-only guard、并锚点规则、统一 usage 键名 | ADR-022、ADR-034、ADR-030 |
| `runtime/review/review-record-route.mjs` | 原始输出保留判定 | ADR-035 |
| `runtime/review/review-policy.mjs` | 删零消费者访问器（审查点定义本身只读） | ADR-008、ADR-002 |
| `runtime/review/review-input-bounds.mjs` | verify-code 材料装配 | ADR-004 |
| `runtime/review/stage-materials.json` | 删 `minimum_reviewers` | ADR-008 |
| `runtime/review/schemas/attempt.schema.json` | `coverage` 含义对齐 | ADR-007、ADR-032 |
| `runtime/review/schemas/result.schema.json` | `coverage` 含义对齐 | ADR-007、ADR-032 |
| `runtime/review/stage-review-disposition.mjs` | 退役登记（全族 7 个导出） | ADR-037 |
| `skills/wh-review/scripts/simple-review-runner.mjs` | 路径契约、锚点规则、解析 fallthrough | ADR-012、ADR-022、ADR-030 |
| `skills/wh-review/scripts/review-provider-client.mjs` | 移除休眠墙钟超时、取消补充窗口 | ADR-009、ADR-026 |
| `skills/wh-review/scripts/review-materials.mjs` | 删逐字节校验死代码、删访问器 | ADR-013、ADR-008 |
| `skills/wh-review/scripts/third-review-host-config.mjs` | route 校验改为记失败并跳过 | ADR-028 |
| `skills/wh-review/contracts/workflowhub-result.v3.json` | `$defs.member` 加所需键 | ADR-007、ADR-032 |
| `skills/wh-review/contracts/provider-protocol.md` | 改 ownerloss / health 定位措辞 | ADR-001、ADR-005、ADR-006 |
| `skills/wh-review/contracts/make-decision.md` | 改逐字节口径与合同句处置 | ADR-013、ADR-010 |
| `skills/third-review/lib/health-runner.mjs` | 停滞提升为终态失败 | ADR-005、ADR-006 |
| `skills/third-review/lib/broker.mjs` | 协议级不设墙钟超时 | ADR-009 |
| `skills/third-review/lib/config.mjs` | 沿用既有 `ttl_hours` 保留期先例 | ADR-036 |
| `skills/third-review/SKILL.md` | 改 ownerloss / health 语义引用 | ADR-006 |
| `skills/wh-review/SKILL.md` | 改重派说明与 supplement 参数面 | ADR-029 |
| `skills/decision-log/templates/decision-log-template.md` | 改成标杆形状、清 no-op、改大纲地图含义、清占位回显、统一模板内部层级 | ADR-049、ADR-050、ADR-053、ADR-057、ADR-060、ADR-069、ADR-070、ADR-071、ADR-073 |
| `skills/decision-log/SKILL.md` | 同步模板与标准落点、写明「四类过程内容只能作指针」 | ADR-049、ADR-050、ADR-054、ADR-055、ADR-057、ADR-058、ADR-069、ADR-070 |
| `skills/spec-plan/templates/phase-template.md` | 删 T001 卡片示例、改保护口径、占位写法改为真值示例 | ADR-014、ADR-017、ADR-071 |
| `skills/spec-specify/templates/spec-template.md` | 占位写法改为真值示例（115 处 `[填写：`） | ADR-015、ADR-071 |
| `skills/spec-prd/templates/prd-template.md` | 占位写法按「照抄它会被拒吗」判并改为真值示例（48 处 `{{}}`） | ADR-071 |
| `skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs` | 随死代码一并删除 | ADR-013 |
| `workflows/make-decision/SKILL.md` | 删 4 条悬空要求、同步 OI 形状 | ADR-051、ADR-052 |
| `workflows/make-decision/steps.json` | 同步措辞 | ADR-051 |
| `tools/cli/stage-runtime.mjs` | 传 `onProviderResult`、verify-code 材料装配 | ADR-025、ADR-004 |
| `docs/standard-workflow.md` | 更正 OCR 路径措辞 | ADR-023 |

008 / ADR-075 的新增授权路径与当前 consumer 只读 `spec.md#008-真实新增范围close-默认安全清理`「精确写集与现消费者」；此处保原文件表，不把新方法/cleanup 范围冒作旧 ADR 已交付。

## 验收面

判定方式都是可复算的命令或字段；本表不设阈值、不做跨任务基线。
判据来源是 ADR-039 的可断言用例与 MOD-6 的「每条记录自带可复算事实」。

| 编号 | 可观察的行为或事实 | 判定方式（可复算的命令 / 字段） | 由哪条 ADR 要求 |
| --- | --- | --- | --- |
| A-01 | 每条审查记录自带可复算事实 | 记录顶层含 provider 终态、是否真出意见、送审字节、provider token 与墙钟、是否复用命中 | ADR-039 |
| A-02 | provider 未解析出 findings 时出现具体失败事实 | 读该记录：`status` 取失败取值，断言其不等于 `completed` | ADR-039、ADR-030 |
| A-03 | 停滞判 failure 而非静默 running | 读 `provider_results[].status` 与 `execution.process_outcome` | ADR-039、ADR-006 |
| A-04 | 散文里夹的 JSON 被拒 | 对含散文 JSON 的样本跑解析，断言不产出「评审通过、零问题」 | ADR-039、ADR-030 |
| A-05 | 覆盖声明字段出现在记录顶层 | 读记录：覆盖声明字段存在且每条 provider 一条 | ADR-039、ADR-032 |
| A-06 | 未上报用量记为「未上报」 | 读 usage 字段：取值是「未上报」而非 0 | ADR-038、ADR-034 |
| A-07 | 材料体积基线可复算 | 读 facts 行里的体积基线字段 | ADR-020 |
| A-08 | 送审材料声明脱敏派生事实 | 读送审材料：含替换处数、与原件字节差、派生件哈希 | ADR-042 |
| A-09 | 「审查比实现贵」按 thread 分别引用 | 检查引述同时给出 thread `01a11378` 与 `01a111b6` 两侧数字 | ADR-040 |
| A-10 | 派发任务的改动点可数出，且锚点唯一 | 数任务书里的改动点（出现「整体重写」/「全文对齐」/「覆盖全部 N 组」即不合格）；对每个锚点跑 `grep -n '<锚点文本>'`，断言恰好命中 1 处（0 处或 >1 处即不合格） | ADR-067、ADR-068 |
| A-11 | 四个模板自身是合法实例（照抄不被拒） | 对四个模板跑 `placeholderOrTemplateNoise` 的最小复现（走真实导出 `validatePostPhaseContract`），断言 `requires concrete` 错误数 = 0；另 `grep -o '\[填写：'` 断言 spec / phase 两模板 = 0 | ADR-071 |
| A-12 | decision-log 的顶层节不含四类过程内容 | 读新产出的 `decision-log.md`，`grep -n '^## '` 列出的节名里不出现「修改日志 / 参考 / 证据 / 过程记录」四类；它们只以指针行出现 | ADR-069、ADR-070 |
| A-13 | 任务书每条路径锚点写明基准目录 | 读任务书，对每个路径锚点断言同一行或紧邻行给出「认证 worktree 根」或「任务库根」；未写明即不合格 | ADR-074 |
| A-14 | 研究结论不内联进任务书 | 读任务书，研究结论处以 `ref` + `sha256` + ≤500 字摘要出现；出现整段研究原文即不合格 | ADR-074 |

不设阈值，也不做跨任务基线：这是本任务验收口径的一部分（V-015）。
本轮已知缺口如实保留：记录 6/6 `usage=null`，
故 A-09 的实现侧并列事实当前无法产出（ADR-039 已登记）。

008 新增的 UC-CLOSE-DEFAULT / PROTECT / MEMO 只读 `spec.md#008-真实新增范围close-默认安全清理` 与 `phases/P10.md` 原 T025 外续节，不加入本旧 A-01…A-14 表或改变原 32AC 的计数/评分。真实 RED/GREEN 与最终动作各据其独立原件，本日志不预判通过。

## Supersedes（被替代记录）

本件取代下列先前主张；每条只留一行，来源为日志内既有材料。

| 被取代的主张 | 来源 | 由本件哪条取代 |
| --- | --- | --- |
| 精炼投影 + 全文 sha256 锚 | F-012 的 D4 | V-017 与 ADR-013 |
| 红蓝配对按分歧条件化 | F-012 的 D12 | MOD-3 的 ADR-027 |
| build-plan 只用到三块 | 上一轮口径（ADR-050 自承记错） | 实测原文「用到 6 条 / 保留 7 条 / 删降级 6 条」（ADR-050） |
| 每个子代理 30 分钟 | 用户陈述 V-018 | 实测 1385 次派发中位 4.7 分钟（MOD-7 导语） |
| 审查点太多是成本主因 | ADR-002 的否决项 | 实测成本来自单次体积与等待（ADR-002） |
| 靠压缩上下文省 token | ADR-043 的否决项 | 实测净亏 1.69×（ADR-043） |
| 材料按本地体积被拒绝或改写 | ADR-056 引用的既有字节语义 | `runtime/review/review-input-bounds.mjs:59-62`（ADR-056） |
| 用零消费者作删节的正当理由 | ADR-050 的否决项 | 可删理由是重复权威 / 已被取代（ADR-050） |
| 保留 4 字段（少一个消费者字段） | ADR-049 的否决项 | ADR 固定 5 字段（ADR-049） |
| 让产物去模仿标杆 | ADR-049 的否决项 | 让模板本身等于标杆形状（ADR-049） |
## 范围与非目标

本次的范围边界与已否决各项如下；重开任何一项须先给新事实。

### 已否决（13 项）

1. 不新增任何闸门或 gate（含重复审查的闸门）。
2. 不加 provider 墙钟超时（与 V-007 / V-008 一致）。引用更正：原记的 `skills/third-review/lib/broker.mjs:476` 实测是 `workflowHubResultV2` 定义区，不含「协议级禁止墙钟超时」的文本；该结论改由 ADR-009 与 ADR-005 承担（F-027 实测）。
3. 不加材料字节上限作为门。
4. 不减 provider 数量、不把 provider 降到 1 个。
5. 不把审查恢复成推进门。
6. 本次不给审查结果自动权威化。
7. 不把 provider 指向目标 worktree （provider 读到的字节不再可证，四道完整性闸门会同时失效）。
8. 不新增 v4 契约并行。
9. 不动 `docs/standard-workflow.md:19` 「完成声明的上限 = 独立来源的结论」。
10. 本日志不含 ADR-015 与 ADR-016 所删的零消费者节；本节只声明它们不出现，不重复枚举。
11. 不靠压缩上下文省 token （净亏实测见 ADR-043）。
12. 不用校验器 / 指标 / 审查强制文档形状（在「不加校验」约束下无法自动防住，见 ADR-056）。
13. 不做产出文档的顶层节名封闭（0.93% 实测通过率、做成校验器会自证违规、24 个模板节里 22 个无机器消费者，见 ADR-072）。

### 非目标

本件只记方向与依据：实现细节归 spec，执行事实归 task facts。
本件不新增闸门、校验器或指标（见 ADR-032 与 ADR-056）。

### 当前确认边界

- 方向依据仍是当时实际 make-decision 展示稿确认，以及后来的 U-018 / U-019。两份历史确认直接读[001 原件](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007/quality/evidence/human-confirmations/2026-10-07-001-make-decision-make-decision-final.json#L4-L7>)、[002 原件](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007/quality/evidence/human-confirmations/2026-10-07-002-make-decision-make-decision-final-r2.json#L4-L7>)；两者 `material_refs` 均为 `[]`，只证明所见稿的真实答复，不回证当前字节。首次确认已被后次展示确认取代；历史轮三及当时缺失来源仍未取证，不编补。make-decision 确认不是 Git 或 close 授权，历史更正、001/002 检查与阶段值不倒写。
- 完整历史确认及更正保在 Git 原始字节，不复制成第二日志。人类在主仓执行下列只读命令，再按原行 169–178（逐字层指针）、1854–2010（157 行确认/更正全过程）、2011–2022（原索引）定位；ADR-065/067 中原「最终确认」更正引用也沿此历史范围读取。这个 commit/path 是 Git 来源，不是可直接 read 的本地文件 URL，未来归档不改该历史路径。

  `git -C /Users/Hugh/Hugh/Project/workflowhub show 17f71af780c975921d28f8f25808a50b3636532f:specs/workflowhub-review-efficiency-20261007/decision-log.md`

- 010 第 5 行真实新增本次结构整理、保护范围内 packet 历史派生目录清理、一起 close 与四份会话备忘可丢弃的范围。仅本 task 当前材料按 U-019 迁移，75 条 ADR 与原需求/验收/禁项/未决完整保留；当前整件结构结论待非作者 73 实际 after，不凭授权、节数或 hash 自判。packet 清理保护四直属普通文件、符号链接、活跃/无法确认安全包与外置唯一原件；这不是恢复 load 自动 TTL，也不把 AC019 持续功能记通过。具体 Git/归档/删除结果由主会话按真实具名范围另行执行与读回，本材料不预填已完成。

## 未决项

逐条给出编号、一句话与 owner / 完成条件；完整说明与来源见任务库
`quality/evidence/decision-log-refs/log-ref-open-items.md`。

| 编号 | 未决内容 | owner / 完成条件 |
| --- | --- | --- |
| H1 | antigravity 用哪个信号做健康监控 | build-plan；判定口径见 ADR-006 |
| H2 | 现场验证的凭据与环境如何交付给独立子代理 | build-plan；判定口径见 ADR-003 |
| H3 | 「受影响面」如何定义 | 本轮不做；将来收窄 verify-code 才需要 |
| H4 | ADR-023 骨架的实测采用数是否算通过 | 无法判定：分母为 0，无 post-骨架 cohort |
| H5 | 精炼后体积是否回涨 | 靠 ADR-020 的体积基线观察，不设阈值 |
| H6 | V-007…V-015 的原会话 Talk 文本 | 本任务不补取证；日后只能回到报告转引层 |
| H7 | `tools/cli/check-decision-log-chain.mjs` 怎么处置 | 待裁；两条路见参考件，本件不定论 |
| H8 | MOD-7 三条 ADR 的遗留（已关闭） | 无遗留；ADR-043 的停用已由用户完成 |
