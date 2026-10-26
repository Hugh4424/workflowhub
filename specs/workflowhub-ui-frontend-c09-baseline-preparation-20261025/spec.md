# 功能规格：C09 前期准备（可复现实验台与步骤严格执行修复）

读者：实施者、独立审查者与下游验收读者。
读完要能：定位本任务要交付的两类结果（C09 前期准备的实验台、make-decision 步骤严格执行的修复）、每条需求的原来源、写集与唯一验收判据。

本规格基于已确认材料 `decision-log.md`（本任务）与发布 PRD `specs/workflowhub-ui-frontend-release-20261020/prd.md`；不重写产品目标，只把已确认的取舍落成可执行设计与唯一验收判据。AC 编号沿用 `decision-log.md#验收面` 已确认的 AC-01～AC-11（两处同号是 build-plan 的显式要求），不另行重命名。

- **功能名**：C09 前期准备与步骤严格执行修复
- **来源**：`decision-log.md` 的 R-001～R-021、D-001～D-011、AC-01～AC-11；发布 PRD 的 C09 卡（PRD:366-385）、S6（PRD:136-153）、S7（PRD:155-159）
- **状态**：build-plan 已批准；build-code 执行与终末审查中，整体未完成。真实批准见 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-001-build-plan-approved.json`，持续执行授权见 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-002-build-code-authorized.json`；原交接 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/handoff/2026-10-26-001-build-plan-handoff.md` 的“未确认”保留其历史时点，不冒全部通过或用户 AC 签核。
- **C04时序窄修例外**：009原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-009-build-code-c04-action-order-narrow-fix.json` 允许仅`skills/design-source-extraction/scripts/collect-design-source.mjs`中egoContext固定采样script逐个调用已有registered prepare动作，等待目标元素出现后继续，并在`tests/contract/design-source-extraction-collect.test.mjs`补对应SDK seam回归；具体测试名/命令由原execution_plan实际定位。registered prepare实现、API、actions键集仍禁止改，不新增动作/引擎/后端，不改页面或设计稿，不访问PaperBuilder。008视口范围继续有效；全4项采集/current及消费仍须新回执，不因授权当已完成。
- **C04视口窄修例外**：仅本轮008明确例外：允许`skills/design-source-extraction/scripts/collect-design-source.mjs`的`egoContext(plan,task,env)`固定采样script在取得page后、goto前调用现有`page.cdp('Emulation.setDeviceMetricsOverride',...)`设置plan中viewport，并在`tests/contract/design-source-extraction-collect.test.mjs`补对应SDK seam定向回归；不改prepare/new engine/后端/设计源，不访问PaperBuilder，其它C04代码/测试/归档结论仍禁止改。真实执行者已定位符号/现有回归文件，本材料writer不碰生产。授权原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-008-build-code-c04-viewport-narrow-fix.json`。 本run新probe/冻结/正式采集/freshness仍须真实回执，不因授权当已修复或接入。
- **当前授权边界**：本轮用户批准的当前范围以 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-007-build-code-nodraft-handoff-scope.json` 及推荐范围原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/2026-10-26-270-nodraft-approved-recommendation-scope.json` 为准：当前只做WorkflowHub检查器、两页前端载体、设计提取、样本指标、验证协议与交接；无稿部分只交接对象/接口/权限/结果/失败判据，真实业务执行及产品最终确认留完整C09重新选隔离授权环境；完全不访问/修改PaperBuilder；旧0写入/失败不改pass，示例不冒真业务。 原D-004/D-007及003许可保历史，不再授权当前访问PaperBuilder；旧业务AC04 incomplete/0 POST保真；当前交接合同须另取独立可执行性核验，不能自动改pass。 其它已批准旧基线、目标仓、有界样本、设计提取与持续build-code授权仍在原范围有效；不替代内容验收、Git/close的真实记录。

## 速读卡（30 秒）

- **一句话需求**：把后面真实对比要用的台子（旧版本、两页样本、无稿闭环、六指标口径、外部内容、输入冻结、证据判定）先搭好并逐项验证，同时让跳步能被查出来。
- **核心改动点**：
  - 仓内：修零留痕口径、加报告式步骤检查器、四阶段步骤到证据映射、方法纪律段、决策日志模板只加一行指针。
  - 仓外：新建最小 Next.js 两页仓、旧版本独立安装真跑、形成无稿业务验证交接合同，完全不访问PaperBuilder。
  - 任务库：把上述每一项落成可回读原件，最后出一张完备性判定表与一张交接表。
- **最大影响面**：`tools/cli/run-checks.mjs` 的既有零留痕口径、四个阶段的 `steps.json` 与 `SKILL.md`、任务库证据目录；仓外新建前端载体、设计提取与无稿零业务访问交接。
- **验收信号**：合成材料缺第 8 步能被报出；旧版本能在独立安装下真跑；六维与十条差异逐条可回读；无稿合同字段/来源/owner/条件经独立读者核可执行；六指标逐项有单位/分母/缺失写法；外部内容逐项落位（计数口径以清单原件为准，见 `OPEN-03`）；完备性逐项“已核验/具名未决＋负责人”。

## 来源与决策映射

本节只保存 ID 关系；原义留 `decision-log.md` 与 PRD 原件。

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| `R-001` | `D-001`～`D-008` | `FR-BASELINE-001` / `AC-01` | current；准备范围 | 无 |
| `R-002` | `D-007` | `FR-READY-001` / `AC-07` | current；完备性判定 | `OPEN-01` |
| `R-003` | `D-001`～`D-008` | `FR-BASELINE-002` / `AC-01` | current；逐包证据 | 无 |
| `R-004` | `D-006` | `FR-EXTERNAL-001` / `AC-06` | current；外部内容 | `OPEN-03` |
| `R-005` | `D-006` | `FR-EXTERNAL-002` / `AC-06` | current；前序任务依赖；C04 已交付 | 无 |
| `CARD-C04` | `D-006`、`D-009` | `FR-EXTERNAL-002`、`FR-EVIDENCE-002` / `AC-06`、`AC-10` | current；提取产物接入与隔离消费 | `OPEN-10` |
| `R-006` | `D-011` | `FR-REPAIR-001` / `AC-11` | current；流程执行 | 无 |
| `R-007` | `D-001`～`D-008` | `FR-SAMPLE-001` / `AC-03` | current；需求大纲 | 无 |
| `R-008` | `D-008` | `FR-HANDOFF-001` / `AC-08` | current；沟通与交接 | 无 |
| `R-009` | `D-008` | `FR-HANDOFF-001` / `AC-08` | current；派发纪律 | 无 |
| `R-010` | `D-011` | `FR-REPAIR-002` / `AC-11` | current；审查纪律 | 无 |
| `R-011` | `D-001`、`D-002` | `FR-BASELINE-001`、`FR-TARGET-001` / `AC-01`、`AC-02` | current；旧版本与目标仓 | 无 |
| `R-012` | `D-005` | `FR-METRIC-001` / `AC-05` | current；六指标 | `OPEN-02` |
| `R-013` | `D-003`、`D-004` | `FR-NODRAFT-001` / `AC-04` | current；无稿验证交接 | 无 |
| `R-014` | `D-005` | `FR-METRIC-002` / `AC-05` | current；历史旁证 | 无 |
| `R-015` | `D-005` | `FR-METRIC-002` / `AC-05` | current；不新增计量平台 | 无 |
| `R-016` | `D-002`、`D-006` | `FR-TARGET-002` / `AC-02` | current；非目标 | 无 |
| `R-017` | `D-008` | `FR-HANDOFF-001` / `AC-08` | current；向 C10 交接 | 无 |
| `R-018` | `D-001`、`D-005` | `FR-BASELINE-001` / `AC-01` | current；真跑基线 | 无 |
| `R-019` | `D-007` | `FR-READY-002` / `AC-07` | current；准备期全自动 | 无 |
| `R-020` | `D-009`、`D-010` | `FR-FREEZE-001`、`FR-EVIDENCE-001` / `AC-09`、`AC-10` | current；十包范围 | 无 |
| `R-021` | `D-011` | `FR-REPAIR-001`～`FR-REPAIR-007` / `AC-11` | current；步骤严格执行 | `OPEN-04` |
| `U-001` | `D-011` | `FR-REPAIR-001` / `AC-11` | current；需求变更 | 无 |
| `U-002` | `D-011` | `FR-REPAIR-003` / `AC-11` | current；收敛与完成检查 | 无 |
| `U-003` | `D-011` | `FR-REPAIR-003` / `AC-11` | current；逐包状态前置 | 无 |
| `PRD-C09-CARD` | `D-001`～`D-010` | `FR-SAMPLE-004`、`FR-READY-002` / `AC-03`、`AC-07` | current；PRD 卡正文与准备依赖 | `OPEN-01`、`OPEN-03` |
| `PRD-S6` | `D-005` | `FR-METRIC-003`、`FR-METRIC-004` / `AC-05` | current；六指标与原目标数值 | `OPEN-02` |
| `PRD-S7` | `D-010` | `FR-EVIDENCE-001`、`FR-EVIDENCE-002`、`FR-EVIDENCE-003` / `AC-10` | current；两条链证据要求 | 无 |

### C04 交付后的适用性更新（2026-10-26，main `05c36c90`）

C04 已把设计源提炼做成可复用能力：产物是单份 `design-source-extraction.json`（含 `source/scope/norm_basis/items/gaps/coverage/freshness/failures`），采集入口 `node skills/design-source-extraction/scripts/collect-design-source.mjs --plan <冻结计划>`，消费规则在 `references/isolated-consumption.md` 与 `references/norm-alignment.md`，方法在 `skills/design-source-extraction/SKILL.md`。对本规格的影响只有三处：①外部内容清单里“C04 局部验证输入”从“预留接入位”改成“已可接入”，落位表要写清接入命令、产物路径与 freshness 判定；②两页样本与证据计划可以引用该产物，但渲染值仍是一手依据，产物里的值不能当产品规范；③交接表把 C04 从“未交付”改成“已交付（main `05c36c90`）”。方向、范围与验收判据不变。

## 1. 需求解释：问题与紧迫性

C09 要回答“新旧两条路径做出同样两页，差多少”，而本任务只做前期准备。准备期最容易出的两个事故：一是把“能起”当成“可复现基线”，等到正式对比才发现依赖装不起来、输入两侧不一样；二是把没做的检查当成做过了——本轮 make-decision 自己就出现整步跳过、跨包合批、确认与推进混在一起，历史四份日志也都有缺步。

本规格因此同时交付两件事：一套可复现、每步留原件的实验台；一条能让跳步当场被看见的报告式检查路径。前者对应 AC-01～AC-10，后者对应 AC-11。

## 2. 背景、目标与范围

### 背景

- 旧版本 `b94c5e6a`（升级前最后一个主干提交）已被真跑过最小探针，但探针借用了主仓 `node_modules` 且处于 detached HEAD（`PFACT-001`、`PFACT-002`）。
- 全盘没有 Next.js 载体，目标仓尚未创建（`PFACT-003`）。
- 设计源是 Vite 原型、非 git、会漂移；本阶段只读，不改一个字节（`PFACT-004`）。
- PaperBuilder 的真实服务在 `:5176` 运行、无认证、真实库被在线服务持锁；用户已看过写入风险并选择直接使用（`PFACT-005`、ADR-0054、D-004）。
- 本任务 `facts.jsonl` 为 0 字节，本阶段没有任何逐步留痕原件（`PFACT-006`）——这正是修复包要解决的现实问题。
- C01、C02 已交付；C04 已于 2026-10-25 交付并合并到 main（`05c36c90`），归档在 `specs/archive/workflowhub-ui-frontend-c04-design-source-extraction-20261025/`。本任务可以实际接入它的提取产物 `design-source-extraction.json`，不再只是“预留接入位”（`PFACT-016`）。

### 目标

- 给 C09 后续与 C10 一套可回读的台子：固定旧版本、两页目标仓、六维清单、无稿闭环、六指标口径、外部内容落位、输入冻结、证据判定、完备性与交接。
- 让“步骤没留痕”在检查器里逐项可见，且只报告不阻断。
- 每一包各自留可运行证据，不把问题留到最后验收（R-003）。

### 范围内

- 仓内：本章程列出的两个 CLI、四个阶段映射、四份方法正文、一份模板、新增契约测试。
- 仓外：新建最小 Next.js 两页仓；旧版本独立安装与三条命令真跑；形成无稿对象/接口/权限/结果/失败判据与具名条件交接，不访问PaperBuilder。
- 任务库：上述每一项的原件，以及完备性判定表与交接表。

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

### SCN-001：换一台机器重建旧版本基线

- **角色**：后续 C09 执行者
- **前提**：拿到 `b94c5e6a` 与依赖记录
- **触发**：按记录做独立安装并跑启动、建任务、写材料三条命令
- **结果**：三条命令都 exit 0，提交可回读，依赖与清理有记录；借用主仓依赖时判失败
- **回写**：改动时同步本节与 `AC-01`

### SCN-002：打开两页目标仓

- **角色**：后续有稿对比执行者
- **前提**：目标仓已建、依赖已装
- **触发**：起 dev server，访问 `/simulation-board` 与 `/sim-workbench`
- **结果**：两页返回可用页面，版本与 lockfile 固定，仓可回读提交号
- **回写**：同步 `AC-02`

### SCN-003：按六维清单对照设计源与目标仓

- **角色**：样本负责人
- **前提**：设计源可渲染、目标仓两页可访问
- **触发**：逐维填表并登记十条已知差异
- **结果**：六维各有来源可回读；十条差异逐条有名有据；设计源版本有指纹
- **回写**：同步 `AC-03`

### SCN-004：无稿闭环改配置再改回

- **角色**：无稿验证交接作者与独立读者
- **前提**：本任务已有历史原件；不访问PaperBuilder，不把旧环境当当前可用
- **触发**：逐项核对象、接口、权限、业务真值、结果读回及失败/取消/恢复判据，登记隔离环境与授权缺口
- **结果**：读者能指出后续每步输入、输出、owner与停止条件；真实两写三读未执行，交完整C09重新选隔离授权环境；示例仅说明合同
- **回写**：同步 `AC-04`

### SCN-005：用一次真实事件走查六项指标

- **角色**：指标负责人
- **前提**：已有真实历史失败事件及原件可读；当前无稿交接不要求新增业务事件
- **触发**：按六项逐项记录同一次事件
- **结果**：六项各有单位、分母、记录位置、缺失写法；n=1 声明齐备
- **回写**：同步 `AC-05`

### SCN-006：按外部内容清单逐项核落位

- **角色**：执行阶段读者
- **前提**：清单原件在手
- **触发**：逐项追 PRD 行号或技能来源，写引入方式、时机、责任者、落位
- **结果**：每一项有落位或具名处置；被排除项写明理由
- **回写**：同步 `AC-06`

### SCN-007：判定准备是否完备并交接

- **角色**：用户与 C10 读者
- **前提**：前九包已交付原件
- **触发**：逐项判“已核验/具名未决＋负责人＋下一步”，再填交接表
- **结果**：当前旧基线、无稿交接完整性、指标分母分别有证据；未来业务环境/授权具名后置；准备完整性与产品效果分开报
- **回写**：同步 `AC-07`、`AC-08`

### SCN-008：照输入冻结与运行协议复放

- **角色**：后续对比执行者
- **前提**：冻结清单与运行步骤单在手
- **触发**：按同一份设计源、同一段任务说明、同一套验收协议跑两侧
- **结果**：两侧输入逐字一致；步骤可照着做；偏差有登记表
- **回写**：同步 `AC-09`

### SCN-009：按证据清单判定两条链

- **角色**：准备方案的独立异源判定人及用户
- **前提**：证据清单与四类资产证据点在手
- **触发**：逐点核计划落点与判定人身份，写达到/未达到/未覆盖
- **结果**：每步有落点或具名缺口；判定人不参与实施；用户对当前准备方案与交接作一次真实确认；真实两链执行与产品结果最终确认仍属完整 C09 未完成事项
- **回写**：同步 `AC-10`

### SCN-010：用合成材料与历史日志跑步骤检查

- **角色**：五阶段主会话
- **前提**：检查器与映射已就位
- **触发**：对缺第 8 步的合成材料、零留痕材料、真实历史日志各跑一次
- **结果**：缺步被逐项报出；零留痕不报“无缺失”；未配置阶段报“映射未配置”；退出码仍为 0
- **回写**：同步 `AC-11`

### 状态覆盖清单

- [x] **默认态**：SCN-002 目标仓两页可访问
- [x] **空态**：SCN-010 零留痕材料逐项列“未留痕”
- [x] **错误态**：SCN-004 读回不一致、409 冲突、库锁失败保留原始错误
- [x] **加载态**：N/A — 本任务不交付常驻界面，两页空壳只放标题与“待实现”文案
- [x] **取消态**：SCN-004 门禁不过即停该项，不用别的写操作替代
- [x] **边界态**：SCN-003 占位 tab、双数据口径等设计源自带行为不当实现缺陷
- [x] **权限态**：SCN-004当前只交接；旧“无认证”是历史环境事实，完整C09隔离环境的权限/凭据尚待其owner核定，本轮不访问PaperBuilder
- [x] **竞态**：SCN-004 真实库被在线服务持锁时保留原始错误、不重试放大

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：旧版本 `b94c5e6a` 能启动、能建任务、能写材料
  - **状态**：`verified`
  - **证据或来源**：`quality/evidence/decision-log-refs/2026-10-25-old-baseline-runnable-probe.md:15-25` 与 `quality/tests/` 三条回执
  - **关联**：`FR-BASELINE-001`、`AC-01`、`SCN-001`
- **PFACT-002**：探针借用了主仓 `node_modules` 且是 detached HEAD，不能直接当基线
  - **状态**：`verified`
  - **证据或来源**：探针原件 `:30-31`
  - **关联**：`FR-BASELINE-001`、`AC-01`、`RISK-01`
- **PFACT-003**：全盘没有 Next.js 仓，`/Users/Hugh/Hugh/Project/ui-workbench-target-20261025` 不存在
  - **状态**：`verified`
  - **证据或来源**：2026-10-25 本次实读该路径不存在；`decision-log.md:104` 内部调研结论
  - **关联**：`FR-TARGET-001`、`AC-02`、`SCN-002`
- **PFACT-004**：设计源为 Vite 原型、非 git、会漂移；本机 `:5173` 当前无监听
  - **状态**：`verified`
  - **证据或来源**：2026-10-25 实读 `/Users/Hugh/Downloads/UI设计稿` 存在、`curl :5173` 返回 `000`；`decision-log.md:104` 记录早前 preview HTTP 200
  - **关联**：`FR-SAMPLE-003`、`AC-03`、`RISK-03`
- **PFACT-005**：PaperBuilder 真实服务在 `:5176` 可用
  - **状态**：`verified`
  - **证据或来源**：2026-10-25 实读 `curl :5176/api/v2/simulation-cards` → 200；ADR-0054
  - **关联**：`FR-NODRAFT-001`、`AC-04`、`SCN-004`
- **PFACT-006**：本任务 `facts.jsonl` 为 0 字节，本阶段没有任何逐步留痕
  - **状态**：`verified`
  - **证据或来源**：2026-10-25 实读任务库 `facts.jsonl` 大小 0；`decision-log.md:402`
  - **关联**：`FR-REPAIR-001`、`AC-11`、`OPEN-04`
- **PFACT-007**：`run-checks` 现在零留痕放过、写一条反而变红，且这两条行为是被已验收的 AC-N11-25 冻结的
  - **状态**：`verified`
  - **证据或来源**：`tools/cli/run-checks.mjs:241-265`；冻结依据 `specs/archive/n11-same-condition-eval-20261022/phases/P2-需求讨论质量.md:18,69,70` 与现绿的 `tests/contract/n11-discussion-quality.test.mjs:87-91`；真实任务实测 exit 0、47 步全 `unavailable`（`quality/evidence/research/2026-10-25-003-repo-facts-for-stage-step-repair.md`）
  - **关联**：`FR-REPAIR-001`、`AC-11`、`RISK-02`、`OPEN-07`
- **PFACT-013**：步骤到证据的位置已写在既有 `steps.json` 每步的 `observable_result` 里（形如「判定消费：…；原件：…」），五份清单共 53 步（15/12/12/8/6）全部命中，含 build-prd；前段已被 `runtime/task/final-chain-runner.mjs:642` 当 `owner_ref` 读。`completion_evidence` 字段也在，但 `runtime/`、`tools/`、`skills/` 零消费者；唯一“步骤→事实”生产者是 `runFinalChainCheck` 与 `evaluateWorkflowSteps`
  - **状态**：`verified`
  - **证据或来源**：`quality/evidence/research/2026-10-25-004-norm-sources-and-ui-applicability.md` 冲突 2；`quality/evidence/research/2026-10-25-003-repo-facts-for-stage-step-repair.md` §3
  - **关联**：`FR-REPAIR-002`、`FR-REPAIR-004`、`AC-11`
- **PFACT-014**：`run-checks` 无参聚合是 CI 阻断面（`package.json` 的 `check` 消费它），`--task-path` 才是不阻断的报告投影；新检查器若挂进聚合会撞既有的逐字全等断言，且 `check-stage-quality.mjs` 是源码反模式扫描器，不是本包要的步骤检查器
  - **状态**：`verified`
  - **证据或来源**：`tools/cli/run-checks.mjs:1-4,143-147,241-265`、`package.json:7`、`tests/contract/final-chain-runner.test.mjs:344-348`、`core/__tests__/run-checks.test.mjs:23-45`、`tools/cli/check-stage-quality.mjs:174,233,341-351`
  - **关联**：`FR-REPAIR-002`、`AC-11`、`RISK-02`
- **PFACT-016**：C04 已交付并合并到 main `05c36c90`；提取产物契约、采集脚本与隔离消费规则可读可用
  - **状态**：`verified`
  - **证据或来源**：2026-10-26 实读归档 `specs/archive/workflowhub-ui-frontend-c04-design-source-extraction-20261025/spec.md`、`skills/design-source-extraction/SKILL.md`、`workflows/build-plan/SKILL.md` 第 5 步新增段
  - **关联**：`FR-EXTERNAL-001`、`FR-EXTERNAL-002`、`AC-06`、`OPEN-10`
- **PFACT-015**：本仓的项目级设计与前端规范正文不存在（`specs/design/*`、`specs/frontend/frontend.md` 两处检出都没有），后端/接口/验收三类有可读正文；仓内 `.css` 数为 0
  - **状态**：`verified`
  - **证据或来源**：`quality/evidence/research/2026-10-25-004-norm-sources-and-ui-applicability.md` A 节与 D 节
  - **关联**：`FR-TARGET-002`、`AC-02`、`OPEN-09`
- **PFACT-008**：ADR-0054“决定”段仍写“预检后取消/复制→丢弃→恢复”，与本任务 D-004 与批次 05 最终选择（费用配置改回）不一致
  - **状态**：`verified`
  - **证据或来源**：`docs/adr/0054-c09-no-draft-loop-uses-running-real-service.md:9` 对 `decision-log.md:156`、`:100`
  - **关联**：`FR-NODRAFT-002`、`AC-04`、`OPEN-05`
- **PFACT-009**：本机 Node 为 v24.14.0，Next 要求 ≥20.9
  - **状态**：`verified`
  - **证据或来源**：2026-10-25 实跑报错栈显示 `Node.js v24.14.0`；`decision-log.md:105` 外部调研
  - **关联**：`FR-TARGET-001`、`AC-02`
- **PFACT-010**：用最小壳承载两页不会预实现业务
  - **状态**：`inferred`
  - **证据或来源**：推断；依据 PRD 要求 Next.js 载体且不得同栈抄源码，实际壳内容按第 10 节边界执行
  - **关联**：`FR-TARGET-002`、`AC-02`、`RISK-04`
- **PFACT-011**：`decision-log.md` 的 R-012/R-013/R-015/R-017 落点写错包号
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md:75-80` 对 `:161-171`、`:149-159`、`:166-171`、`:197-207`
  - **关联**：`FR-READY-001`、`AC-07`、`OPEN-01`
- **PFACT-012**：外部内容计数 `12 显性/4 隐性/4 缺入口/8 排除` 与按 PRD 重算的 `9/7/5/8` 不一致
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md:175`、`:338` 对 `quality/evidence/research/2026-10-25-002-prd-c09-requirement-extract.md` C 节
  - **关联**：`FR-EXTERNAL-001`、`AC-06`、`OPEN-03`

## 5. 功能需求

### 步骤严格执行修复（REPAIR）

把“跳步不会被发现”的机制缺口修掉。四条纪律是：缺失即未完成、跨包不合批、确认与推进分开问、少打扰不等于可以跳过步骤。检查器只报告，不阻断。

- **FR-REPAIR-001**：零留痕时必须逐项列出“未留痕”，不再报“无缺失”；写一条留痕不得反而变红。关联 `PFACT-006`、`PFACT-007`、`SCN-010`、`AC-11`
  - **范围边界**：只改零留痕与单条留痕的判定口径；不新增运行时留痕写入。这条与已验收的 AC-N11-25 直接冲突，必须先由用户选定承接方式（`OPEN-07`）才能实施。
  - **依据**：D-011 ①；`decision-log.md:256`；冲突事实见 `PFACT-007`
  - **验收**：`AC-11`
- **FR-REPAIR-002**：提供报告式步骤检查器，按“步骤 → 既有证据位置”的映射逐项核对，输出人读清单与 JSON，退出码 0、不阻断命令。检查器是对既有 `runFinalChainCheck` 输出的只读投影并复用 `evaluateWorkflowSteps`，不自建第二套“几步有据”的判定。关联 `PFACT-007`、`PFACT-013`、`PFACT-014`、`SCN-010`、`AC-11`
  - **范围边界**：只读既有材料与既有证据位置；不新建证据库、不写运行时状态；不挂进 `runAggregate`、不改既有聚合 stdout、不动 `package.json` 的 `check`。删除条件：当五阶段主会话不再消费该检查器，或既有 `final-chain` 直接输出同等清单时删除，不保留第二权威。
  - **依据**：D-011 ②；`docs/adr/0043:3-20`（只报告例外）、`docs/adr/0037:20-21`、`docs/adr/0041:24`
  - **验收**：`AC-11`
- **FR-REPAIR-003**：模块收敛完备性、逐包状态与推进前置三项检查成立：每个模块 8 项非空内容（目标、边界、方案与取舍、验收、风险、依赖、消费者、未决或无）、每包收敛后立即标“已收敛”、未全部收敛不得进入细节审查；阶段收口前还必须过“步骤证据清单＋AC 逐条判定方式＋真实确认”三项，缺一不得收口。关联 `PFACT-006`、`SCN-010`、`AC-11`
  - **范围边界**：检查器只报告；停步由主会话看到未收敛记录后执行
  - **依据**：D-011 ⑥；`decision-log.md:269`
  - **验收**：`AC-11`
- **FR-REPAIR-004**：五阶段映射逐阶段给出“已配置/未配置”结论；映射读既有 `observable_result` 里已写好的「判定消费：…；原件：…」标记（五份清单 53 步全命中），不新增字段、不改词表、不改任何 `steps.json` 内容。哪个阶段有标记就报“已配置”，没有就报“未配置”，不预设阶段名单。D-011 原话写“四个 `steps.json` 加映射”，事实是映射位早已存在、缺的是读者（`PFACT-013`），因此本规格按“加读者、不改生产者”落地，并在审批时把该偏离说清。关联 `PFACT-013`、`SCN-010`、`AC-11`
  - **范围边界**：不动 `steps.json` 的键集与步数（`tests/contract/n10-process-repair.test.mjs:37,45`、`tests/contract/stage-closeout-step-contract.test.mjs:1,23-33`、`tests/contract/make-decision-flows.test.mjs:176,198` 冻结）；若标记读不出，停在盘点事实里，不自造第二套映射
  - **依据**：D-011 ⑤；`decision-log.md:134`
  - **验收**：`AC-11`
- **FR-REPAIR-005**：方法正文只加一段执行纪律与步骤证据指针；决策日志模板加一行“步骤证据清单指针”但不进「目录」表（`skills/decision-log/templates/decision-log-template.md:56` 规定目录每行对应正文顶层节）；入口级别在模板与方法正文里写成检查器能读的固定格式；既有决策日志不回改，检查器读不到时如实报“未读到级别事实”。关联 `PFACT-006`、`SCN-010`、`AC-11`
  - **范围边界**：只加短段与表外一行指针；不复制规范正文、不新增节
  - **依据**：D-011 ④；`decision-log.md:259-261`；级别正则见 `tools/cli/run-checks.mjs:179`
  - **验收**：`AC-11`
- **FR-REPAIR-006**：步骤证据只落既有位置（研究、审查、确认、测试回执、问答原件）；决策日志正文不得因步骤记录变厚。关联 `PFACT-006`、`SCN-010`、`AC-11`
  - **范围边界**：问答原件开头加一行“批次类型”；逐包过程记录移出决策日志
  - **依据**：D-011 ③；`decision-log.md:258`
  - **验收**：`AC-11`
- **FR-REPAIR-007**：修复自带可执行测试：合成材料缺第 8 步能被报出、零留痕不再绿、真实历史日志能列出已缺步骤、级别行能被解析、五阶段映射逐阶段有结论。关联 `SCN-010`、`AC-11`
  - **范围边界**：新测试落 `tests/contract/`；不改既有测试语义
  - **依据**：D-011 ⑤；`decision-log.md:262`
  - **验收**：`AC-11`

### 旧版本基线（BASELINE）

- **FR-BASELINE-001**：把旧版本固定为 `b94c5e6a`，在不借用主仓依赖的独立安装、正常分支上真跑“启动/身份检查、建任务身份、写一份材料”三条命令，逐条记录命令、退出码、输出原件。关联 `PFACT-001`、`PFACT-002`、`SCN-001`、`AC-01`
  - **范围边界**：只固定版本与记录；不采任何六指标数值
  - **依据**：D-001；`decision-log.md:120`
  - **验收**：`AC-01`
- **FR-BASELINE-002**：依赖安装方式、环境（Node 版本）、清理规则必须留档；历史 PB-T08 数字只作旁证，不得替代真基线。关联 `PFACT-001`、`SCN-001`、`AC-01`
  - **范围边界**：清理临时工作树与探针任务目录，保留命令回执
  - **依据**：D-001；R-014
  - **验收**：`AC-01`
- **FR-BASELINE-003**：探针遗留的两处缺陷必须在正式基线前补掉：独立安装、正常分支（非 detached）。关联 `PFACT-002`、`SCN-001`、`AC-01`
  - **范围边界**：只补这两项；不扩成完整基线运行
  - **依据**：D-001 风险段；`decision-log.md:122`
  - **验收**：`AC-01`

### 最小目标仓（TARGET）

- **FR-TARGET-001**：新建独立 git 仓（候选 `/Users/Hugh/Hugh/Project/ui-workbench-target-20261025`），用 Next 16.4.3／React 19.3.1／Tailwind 4.3.3、App Router 建 `/simulation-board` 与 `/sim-workbench` 两页空壳路由、根布局、全局样式、`next/font`，固定版本并提交 lockfile，记录启动命令与访问地址。关联 `PFACT-003`、`PFACT-009`、`SCN-002`、`AC-02`
  - **范围边界**：只搭壳；端口先用 3000，冲突改 3100 并记录
  - **依据**：D-002；外部调研 EV-E1-1～E1-4
  - **验收**：`AC-02`
- **FR-TARGET-002**：空壳边界必须守住：允许标题、空白状态文案“待实现”、导航骨架；禁止设计稿的 tsx/CSS 片段、任何业务组件或数据、减少依赖库、Pages Router。关联 `PFACT-010`、`SCN-002`、`AC-02`
  - **范围边界**：审查时逐文件核对有无设计稿代码
  - **依据**：D-002；R-016
  - **验收**：`AC-02`

### 两页样本与口径（SAMPLE）

- **FR-SAMPLE-001**：产出六维清单（页面/路由、状态、viewport、数据、依赖、设计源版本），每维有来源且可回读；状态清单逐组件读真实代码里的状态枚举与空态，不靠猜测。关联 `PFACT-004`、`SCN-003`、`AC-03`
  - **范围边界**：页面范围只含 `SimulationBoard`、`SimWorkbench` 及其直接子组件
  - **已批准采样范围**：用户本轮选择“现有样本的有界完整覆盖（推荐）”（原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-005-build-code-bounded-sample-approved.json`）：只取现有示例数据可达的结构、组件、状态和交互，由代理整理有限必需项并独立核对，不新增测试数据或产品状态。源码中声明但现有样本不可达的项仍逐项列未覆盖及原因，不静默删除；不把已观察项数量当作完整必需项分母。
  - **依据**：D-003；`decision-log.md:144`
  - **验收**：`AC-03`
- **FR-SAMPLE-002**：十条已知差异逐条登记：全 mock 无持久、模拟域双数据口径、占位 tab、伪随机图表需同种子、字体离线回退、hash 路由刷新丢视图、12 色中 8 色零用、无独立模拟详情页、assets 零引用、Figma 插件噪音。关联 `PFACT-004`、`SCN-003`、`AC-03`
  - **范围边界**：这些是设计源自带行为，不得当实现缺陷
  - **依据**：D-003；`decision-log.md:335`
  - **验收**：`AC-03`
- **FR-SAMPLE-003**：设计源版本以实际消费的具名最小文件集固定：逐项记录相对路径、大小、修改时间、内容 sha256，并按明确排序规则计算该范围的合成 hash；写明选择依据、消费范围与未覆盖限制，不保存全根/全目录清单或快照，不以局部指纹宣称整棵设计源未变。不依赖 git，不改设计源一个字节。关联 `PFACT-004`、`SCN-003`、`AC-03`
  - **范围边界**：只读；不提交设计源
  - **依据**：D-003；OI-012
  - **验收**：`AC-03`
- **FR-SAMPLE-004**：两页在准备期的“业务操作与结果读回”路径必须被登记（可读/不可读及原因），不留给最终验证才发现不可读回。来源 PRD:614；关联 `PFACT-003`、`SCN-003`、`AC-03`
  - **范围边界**：只登记可读性与缺口，不实现业务
  - **依据**：`PRD-C09-CARD`（PRD:614）；decision-log R 表无对应条目，见 `OPEN-01`
  - **验收**：`AC-03`

### 无稿真实闭环（NODRAFT）

- **FR-NODRAFT-001**：当前只交接无稿候选对象、接口/输入输出、权限与资格、真实业务操作、结果真值与读回、失败/取消/恢复判据；每步给owner、证据类型与取得条件，读不到写具名缺口。关联 `PFACT-005`、`SCN-004`、`AC-04`
  - **范围边界**：完全不访问或修改PaperBuilder（源码、文件、服务、API、数据库及启停）；只读本任务既有原件，旧端点为历史候选，不证明当前可用
  - **依据**：本轮用户范围决定 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-007-build-code-nodraft-handoff-scope.json`；原D-004/003只保历史
  - **验收**：`AC-04`
- **FR-NODRAFT-002**：业务执行及结果最终确认由完整C09重新选择隔离、明确授权的真实环境后执行；合同仍逐项规定改后结果、恢复结果、残留与可观察失败，不降低原真实链要求。关联 `SCN-004`、`AC-04`
  - **范围边界**：当前不运行写/读回，也不把合同例子、mock或HTTP200冒真业务；原两写三读始终未执行
  - **依据**：本轮范围决定；原业务成功/恢复标准保留为后续执行要求
  - **验收**：`AC-04`
- **FR-NODRAFT-003**：原服务失败与0业务写入/0新增残留保留immutable原件和incomplete；当前逐项区分已知历史、未核条件与后续owner，不重试原路径、不推断环境恢复。关联 `SCN-004`、`AC-04`
  - **范围边界**：当前交接合同的可执行性须独立人读；缺关键字段/owner/条件不判完整，范围决定不是内容验收
  - **依据**：本轮范围决定；099/044/051/118原件只读
  - **验收**：`AC-04`

### 六项指标（METRIC）

- **FR-METRIC-001**：六项指标逐项落成可执行定义（任务返工、缺陷、人工时间、验收确认、提取覆盖、视觉差异），每项有单位、分母、记录位置、缺失写法与 PRD S6 出处；分母按各指标自己的 S6 单位定义——页面/组件/状态型取两页样本清单，事件型取事件数，时间型取用户实际投入段——并在运行前具名；缺陷与视觉差异按 S5 分级（严重/中等/轻微）登记；小偏差按 S5 批量确认。关联 `PFACT-004`、`SCN-005`、`AC-05`
  - **范围边界**：只写口径与记录方式；不采完整数值
  - **采样分母承接**：页面/组件/状态及提取覆盖的有限必需项沿 FR-SAMPLE-001 的已批准现有样本范围枚举，运行前以可回读清单具名并经独立核对；观察数量不代分母，不可达声明保未覆盖限制。该采样决定不修改产品数值容差、既有覆盖阈值或其它指标单位，不据此宣称范围外完整覆盖。
  - **依据**：D-005；PRD-S6
  - **验收**：`AC-05`
- **FR-METRIC-002**：用一次真实事件走查六项记录方式；正式对比走异步一次性确认；无人值守段只记机器时间；人工时间按用户实际投入段记（有证据表明该段无投入才记 0；未观察到记 unknown 并写原因）；确认没发生则记 unknown，不填 0 或 1；n=1 不称统计显著。关联 `PFACT-005`、`SCN-005`、`AC-05`
  - **范围边界**：不建计量平台或第二数值账本；不跨版本复用截图阈值
  - **依据**：D-005；R-014、R-015
  - **验收**：`AC-05`
- **FR-METRIC-003**：无稿侧与旧侧无提取器的场合，提取覆盖都记 N/A 并写原因，不填 0 或 100%；提取器局部验证的覆盖≥90%、关键五类输入不缺、任务返工≤2 作为 C04 局部验证的判据登记。来源 PRD:138、PRD:146；关联 `SCN-005`、`AC-05`
  - **范围边界**：只影响无稿侧该项写法
  - **依据**：`PRD-S6`；decision-log 未单列，见 `OPEN-02`
  - **验收**：`AC-05`
- **FR-METRIC-004**：比较方法禁止项必须写明：不拿减少工作量证明收益、不换分母或阈值、不把无稿收益混入有稿比较。来源 PRD:151/374/153；关联 `SCN-005`、`AC-05`
  - **范围边界**：本阶段只写判据与禁令，不跑比较
  - **依据**：`PRD-S6`、`PRD-C09-CARD`；见 `OPEN-02`
  - **验收**：`AC-05`

### 外部内容与准备完备性（EXTERNAL／READY）

- **FR-EXTERNAL-001**：按清单把准备期8类逐项落位（旧版本、目标仓、设计源、基线研究原件、六指标口径、无稿授权/环境/真值交接、C04局部验证输入、采集接线）；业务真实环境/授权/结果执行条件允许具名后置，交接字段和owner当前核清，不能冒环境已验证，把 C01～C08 交付、两路完整 E2E、独立证据、C10 交接事实留到最终验证；C04 的局部验证输入已可接入（`design-source-extraction.json` 与采集命令），落位表要写清接入命令、产物路径、`freshness` 判定与“消费并核其与收益比较未混淆”的做法；每一项追到 PRD 行号或技能来源，并给引入方式、时机、责任者、落位或处置。关联 `PFACT-012`、`SCN-006`、`AC-06`
  - **范围边界**：不在本包安装或运行第三方代码；不把 C04 产物当已经消费过——接入要真读产物并核 `freshness`，未跑采集就写“未取得”
  - **依据**：D-006；R-004
  - **验收**：`AC-06`
- **FR-EXTERNAL-002**：前序任务依赖按真实原件引用：C01 已收口（一条验收缺证据）、C02 已交付、C04 已交付并归档（main `05c36c90`，`specs/archive/workflowhub-ui-frontend-c04-design-source-extraction-20261025/`），本任务接入其产物时按隔离消费规则单独跑、单独记。关联 `PFACT-016`、`SCN-006`、`AC-06`
  - **范围边界**：C04归档材料与旧结论只读；本轮仅008视口及009固定采样script动作调用顺序/等待与对应定向回归例外，精确范围见当前授权边界，其它代码/测试不改；不把提取产物当产品规范
  - **依据**：R-005；OI-005
  - **验收**：`AC-06`
- **FR-READY-001**：逐项判“已核验”或“具名未决＋负责人＋下一步”；当前不可后置的是旧基线独立可跑、无稿交接合同完整可执行、六指标分母；无稿真实对象/隔离环境/API授权及业务执行由完整C09核实，当前保具名缺口与触发条件，不以历史PaperBuilder可达记录代当前可用。关联 `SCN-007`、`AC-07`
  - **范围边界**：不用准备完成宣布 C09 达标
  - **依据**：D-007；PRD:376
  - **验收**：`AC-07`
- **FR-READY-002**：准备完整性与产品效果分开报告；判定表须写明“本次准备不是其它卡的开工或合并门”，本任务不提供合并许可证；不兜底前八卡功能缺陷。来源 PRD:149/376/377/791；关联 `SCN-007`、`AC-07`
  - **范围边界**：只报告与登记，不改兄弟卡规则或接管其 writer
  - **依据**：`PRD-C09-CARD`；R-019；见 `OPEN-01`
  - **验收**：`AC-07`
- **FR-HANDOFF-001**：交接表按版本/环境/样本/口径/未决五类给内容、原件指针与状态（可用/不可用/未覆盖），C09 后续与 C10 能按指针直接找到原件；交接只给指针，不复制第二份证据。关联 `PFACT-003`、`SCN-007`、`AC-08`
  - **范围边界**：不打包、不安装、不更新、不冒上线
  - **依据**：D-008；R-017
  - **验收**：`AC-08`

### 输入冻结与端到端证据（FREEZE／EVIDENCE）

- **FR-FREEZE-001**：冻结两侧同一份设计源版本与任务说明、允许/禁止读取范围、验收协议；设计源两侧都可读，禁读源码只用于 C04 提取器局部验证并单独记录；两侧拿到的文字与附件逐字一致，下发前留指纹。关联 `PFACT-004`、`SCN-008`、`AC-09`
  - **范围边界**：不把禁读扩大到所有任务
  - **依据**：D-009；PRD:151/153
  - **验收**：`AC-09`
- **FR-FREEZE-002**：运行顺序（旧侧先、新侧后）、每步记录位置、清理规则、偏差登记字段可照着做。关联 `SCN-008`、`AC-09`
  - **范围边界**：只写协议；不跑正式对比
  - **依据**：D-009；`decision-log.md:71-75`
  - **验收**：`AC-09`
- **FR-EVIDENCE-001**：流程链十段与业务链六个检查点各定证据落点、所需原件类型、owner 与取得条件；已有原件给可回读指针，未执行点写具名缺口，缺一段即记缺口；不以源码目录或孤立 fixture 代替整链，无后端时不人为加数据库，未知 consumer 不记作零。关联 `SCN-009`、`AC-10`
  - **范围边界**：不用文件按顺序出现代替流程链
  - **依据**：D-010；PRD S7
  - **验收**：`AC-10`
- **FR-EVIDENCE-002**：四类资产（设计组件、设计布局、前端组件、前端布局）各定“整理→应用→更新→验证”证据点，逐点规定如何证明“谁在用、用在哪、更新过什么、怎么验的”；已有事实引用原件，实际应用、更新、验证与后续消费未发生时保未完成，交完整 C09 执行。关联 `SCN-009`、`AC-10`
  - **范围边界**：不只写文件名
  - **依据**：D-010；`decision-log.md:228`
  - **验收**：`AC-10`
- **FR-EVIDENCE-003**：当前准备方案的判定人独立且异源、不参与实施，核计划落点与身份后向用户取得一次针对准备方案与交接的真实确认并留原件；完整 C09 的真实执行、独立结果判定及产品结果最终确认分别后置且保未完成；判定写法固定为达到/未达到/未覆盖，未覆盖必须写缺口、影响与负责人。关联 `SCN-009`、`AC-10`
  - **范围边界**：不新增判定平台；实施者不得自判
  - **依据**：D-010；`decision-log.md:230`
  - **验收**：`AC-10`

## 6. 模块划分

十一个模块按“可独立交付与独立验收”划分，依赖单向无环。这里是产品职责，不是实现文件。

### 修复模块（步骤严格执行）

- **负责什么**：让阶段步骤的缺口在检查器里逐项可见，只报告不阻断
- **对外提供什么**：人读清单与 JSON 的检查结果、四阶段映射、纪律段与一行模板指针
- **依赖谁**：既有 `run-checks`、既有阶段材料与既有证据位置
- **测试边界**：合成材料缺步、零留痕、历史日志回放、级别解析、五阶段映射各有具名用例

### 旧基线、目标仓、两页样本

- **负责什么**：把旧版本固定成可重现基线；把两页载体建起来；把两页口径固定成清单
- **对外提供什么**：三条命令的退出码与原件、仓与提交号、六维清单与十条差异、设计源指纹
- **依赖谁**：本机 node、git、既有设计源与本仓历史提交
- **测试边界**：命令退出码可重放；页面可访问可重放；清单逐条可回读

### 无稿闭环与六指标

- **负责什么**：无稿验证范围与条件交接，以及六项指标可执行口径
- **对外提供什么**：对象/接口/权限/结果/失败恢复合同与具名条件，旧失败原件指针，六指标定义与已有真实失败事件走查
- **依赖谁**：本任务既有历史原件、两页样本分母；不依赖或访问运行中的PaperBuilder
- **测试边界**：无稿交接字段/来源/条件可独立人读；六项逐项点名及已有失败事件记录方式可核

### 外部内容、输入冻结、证据判定、完备性与交接

- **负责什么**：把外部内容逐项落位；冻结两侧输入与协议；定两条链的证据点与判定规则；最后出完备性判定与交接表
- **对外提供什么**：落位表、冻结清单与运行步骤单、证据计划、判定表与交接表
- **依赖谁**：前七包的产出原件
- **测试边界**：逐项可追溯到行号或指针；判定表逐项有结论与负责人

## 7. 关键实体

- **基线记录**：
  - **定义**：一条可重现旧版本运行的事实集合
  - **字段和约束**：提交号、安装方式、三条命令与退出码、环境、清理规则；提交号必须逐字可回读
  - **关系**：一条基线对应唯一提交；不被其它包改写
- **两页条目**：
  - **定义**：六维清单中的一行
  - **字段和约束**：页面/路由、设计源位置、目标仓位置、状态清单、视口、数据来源、依赖与版本、差异、证据指针
  - **关系**：六维每维至少一条来源；十条已知差异各挂一行
- **指标事件**：
  - **定义**：一次真实事件在六项指标上的记录
  - **字段和约束**：事件编号、发生时间、来源（用户/代理/机器）、指标项、值、单位、证据指针；缺失写法为 unknown 或 N/A，不填 0 冒充实测
  - **关系**：一次事件可对应多条指标记录；人工时间按段记
- **外部内容条目**：
  - **定义**：PRD 要求引入的一项外部内容
  - **字段和约束**：名称、PRD 行号或技能来源、类型（显性/隐性/缺入口/排除）、引入方式、时机、责任者、落位或处置
  - **关系**：条目计数口径以清单原件为准，见 `OPEN-03`
- **检查结果条目**：
  - **定义**：某阶段某一步的证据核对结论
  - **字段和约束**：阶段、步骤、证据位置、判定（已留痕/未留痕/映射未配置）、缺口说明
  - **关系**：只报告；不产生阻断或状态写入
- **交接条目**：
  - **定义**：交接表中的一行
  - **字段和约束**：类别（版本/环境/样本/口径/未决）、内容、原件指针、状态（可用/不可用/未覆盖）
  - **关系**：每条指向一个真实原件；不复制正文

## 8. 数据和生命周期

- **数据粒度**：一次命令执行、一次读回、一次判定各为一条独立事实
- **数据时效**：证据原件写入即固定；同字节事实复用原 ref，不新写物理副本
- **缺失或迟到**：缺输入写 unknown 与缺口；未执行不写成通过
- **预览与正式**：本阶段只做最小可运行验证与口径冻结，不采完整数值
- **当前与历史**：历史 PB-T08 数字与旧任务材料只作背景，不替代本轮证据
- **归属与清理**：临时工作树与探针任务目录在收口时删除；旧版本与 PaperBuilder 的真实库残留按 WP4 登记，不做硬删

## 9. 兼容性预留

- **既有消费方**：`run-checks` 的既有聚合输出、`verify-structure` 与 markdownlint 检查链、`workflows/*` 的步骤读取、`decision-log` 模板的既有节结构保持可用
- **命名预留**：新增检查器用独立 CLI 文件名；不占用既有七个公共 runtime 命令名
- **容器预留**：N/A — 不新增持久化容器或第二进度权威
- **状态预留**：不新增阶段状态、质量状态或运行对象
- **扩展边界**：本期消费五阶段既有映射，不新增或改写映射；按实际标记报告配置情况，缺标记时报告“映射未配置”及具体缺口

## 10. 明确不做与默认必须成立

### 明确不做

- 不做完整 C09 双路径 E2E 与效果报告（R-001、`decision-log.md:324`）。真实两链、四资产生命周期执行、完整效果比较及产品结果最终确认由完整 C09 承接，仍未完成，不从原始需求删除。当前只验准备方案与交接，依据本轮用户决定原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-006-build-code-prep-boundary-approved.json`。
- 不实现两页业务、不新增后端或计量平台、不做打包/安装/发布/上线（R-016、R-015）。
- 不恢复四个独立试点，不扩整个业务项目，不负责 C10 的接入（R-016）。
- 不改 PaperBuilder 代码或数据，不做硬删、不批量操作（D-004）。
- 不在准备期采完整六指标数值，不拿历史数字替真基线，不跨版本复用截图阈值（D-005）。
- 不在决策日志正文加步骤记录或新节，不新增进度对象或运行时留痕写入（D-011）。
- 不把检查做成失败门：检查器退出 0、只报告（D-011，用户已选）。
- 不把新检查器挂进 `runAggregate`，不改既有聚合 stdout，不动 `package.json` 的 `check`（`PFACT-014`）。
- 不改 `steps.json` 的字段与内容；映射读既有 `observable_result` 标记，扩字段须另取用户答复（`PFACT-013`）。
- 不用启发式满意度、问卷或虚构体验数据充当效果证据（PRD:539）。
- 不接管前八卡的生产 writer，不替它们修功能缺陷（PRD:370、374、791）。

### 默认必须成立

- 历史原件只读；证据同字节即同一事实（AGENTS 证据硬规则）。
- 质量缺失如实记 unknown/unavailable/incomplete，不伪造通过。
- 真实业务库的写入只发生一次且可回滚，残留如实登记。
- 所有“已核验”结论必须有可回读原件；无原件即未核验。

## 验收流程

从场景入口 `SCN-001`～`SCN-010` 定位 FR，再到 `Appendix A` 的同号 AC、所属 Phase 的 `gate_cmd` 与可回读证据；每条 AC 的判定时点、执行 owner、所需条件与成功失败信号写在 Appendix A 同条正文，本节不复制判据。原文按 `decision-log.md#外置事实索引` 的到达条件回读。

## 测试标准

本节按项目声明的测试面写适用或不适用理由、oracle、证据类型与覆盖边界；精确命令归各 Phase。

- **静态面（结构合同）**：适用。`node tools/cli/run-checks.mjs --material-root=<认证 worktree 的 specs/<task-id>>` 检查 spec/index/Phase 机械合同；不代表行为或语义通过。证据类型：命令输出原件。
- **定向单元/契约面**：适用。新增检查器、零留痕口径、级别解析、映射覆盖率各有 `npx vitest run tests/contract/<file>` 用例；oracle 为具名断言。证据类型：vitest 输出与退出码。
- **命令面（真实环境）**：仅旧版本命令、目标仓两页与设计提取的本任务真实路径适用。无稿当前只核交接可执行性，不发PaperBuilder请求；两写三读保未执行。
- **浏览器端到端面**：本阶段为具名不适用——两页是空壳，本任务不交付业务界面；浏览器可见面的真实验收在 C09 最终验证阶段（`test tier` 归后续任务）。这里只登记“可访问/不可访问”，不冒充交互验证。
- **人工读面**：适用。六维清单、十条差异、六指标定义、外部内容落位、完备性判定、交接表都要由未参与实施的人按原件核对；命令输出不能替代。
- **覆盖率判据**：不使用覆盖率百分比或测试条数判通过；判据是具名断言与逐条结论。
- **规范来源与 UI 适用性**：`raw_requirement=true`（PRD 要两页 Next.js 有稿比较）、`project_inventory=false`（本仓无 `apps/`、无 `.tsx/.vue/.jsx`、`.css` 为 0）、`planned_or_changed_frontend_fact=true`（本次计划在仓外新建两页壳并读设计源渲染），合并为 UI 适用。适用规范：`specs/backend/*`、`specs/api/*`、`specs/acceptance/*` 有正文；`specs/design/*` 与 `specs/frontend/frontend.md` 两处检出都不存在，记 `missing` 并交原 owner（见 `OPEN-09`）。前端组件质量侧：两页壳是仓外 `add-local` 新增、无共享消费者（`unknown`），唯一 CSS/token owner 为目标仓 `app/globals.css`，本仓不新增组件。
- **审查 lens**：本阶段用一个合并审查包，lens 为 review、simplicity-guard、plan-eng-review，并按 UI 适用加 `plan-design-review`。
- **AC 唯一权威**：验收判据的唯一权威是本规格 `Appendix A`；审查包里的 `acceptance_criteria` 与 `draft_spec` 引用同一份材料，不另立第二份 AC 文件。
- **两件就绪件**：数据就绪件（验收数据与样本口径）与环境就绪件（服务与访问入口）各一件，写在 `P11` 的写入集里，状态只写 `ready`／`incomplete`／`unavailable`。
- **定向测试与命令**：改 `steps.json` 时同批跑 `tests/contract/{n10-process-repair,stage-closeout-step-contract,verify-code-page-refresh,make-decision-flows}.test.mjs`；改模板时跑后两份；新测试一律 vitest API（`vitest.config.mjs` 不在写集）；证据命令在认证 worktree 下执行。

### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c09-baseline-preparation-20261025",
  "service": "旧版本本机命令与目标仓 Next.js dev server已有真实运行原件114/137；137已清理自有服务，不表示当前在线；无稿当前不连接业务服务",
  "route": "/simulation-board、/sim-workbench",
  "state": "两页空壳态；无稿仅交接合同，真实业务状态未运行",
  "viewport": "1440×900（主）、1280×900（辅）",
  "owner": "用户"
}
```

workspace 取认证 worktree；service 与 route 的实际运行/释放事实读114/137，目标仓为 `/Users/Hugh/Hugh/Project/ui-workbench-target-20261025`，不以历史运行证明当前在线；state 与 viewport 取 `quality/evidence/decision-log-refs/2026-10-25-module-details.md:22-23` 的已确认取值。OPEN06保原规划时点；两页源渲染登记与当前准备范围读394/416。配置入口与规定尺寸不证明服务当前启动或全面页面已观察。

## 架构边界

产品边界：台子（旧基线、两页、无稿闭环、六指标、外部内容、输入冻结、证据判定、完备性、交接）与检查器两条交付线。
工程边界：检查器留在 `tools/cli/` 与 `tests/contract/`；方法正文留在 `workflows/*/SKILL.md`；映射留在四个 `steps.json`；模板只加一行；C09 侧产物留任务库，唯一仓外新增是目标仓。

## 实现设计（全局权威）

### 代码锚点

- **来源边界**：原始来源是发布 PRD（`PRD-C09-CARD`、`PRD-S6`、S7）与本任务 `decision-log.md`；本节不另建需求账本。
- **现状与目标差异**：`tools/cli/run-checks.mjs` 现在零留痕放过、写一条反而变红（`PFACT-007`）；目标是把缺口逐项报出且不再反向失败。目标仓 `/Users/Hugh/Hugh/Project/ui-workbench-target-20261025` 现在不存在（`PFACT-003`），目标是两页可访问的 Next.js 空壳。
- **读取顺序**：先读 `tools/cli/run-checks.mjs` 的零留痕判定与聚合出口，再读 `tools/cli/check-decision-log-chain.mjs` 的既有检查器形状，再读 `runtime/stage/stage-content-contracts.mjs` 的机械合同入口；C09 侧先读 `quality/evidence/decision-log-refs/2026-10-25-module-details.md` 与 `quality/evidence/decision-log-refs/2026-10-25-old-baseline-runnable-probe.md`。
- **代码锚点**：`skills/design-source-extraction/SKILL.md` 与 `skills/design-source-extraction/scripts/collect-design-source.mjs`（C04 交付的提取入口）；`tools/cli/run-checks.mjs` 的零留痕与聚合分支；新增 `tools/cli/check-stage-steps.mjs` 的导出入口（含步骤映射与报告输出）；`workflows/{make-decision,build-plan,build-code,verify-code}/steps.json` 的映射键；`workflows/{make-decision,build-plan,build-code,verify-code}/SKILL.md` 的纪律段位置；`skills/decision-log/templates/decision-log-template.md` 的「外置事实索引」行；`tests/contract/` 的新增用例文件名。行号只作导航，会漂移，不作契约。
- **运行条件**：本机 Node v24.14.0（`PFACT-009`）；目标仓依赖 Next 16.4.3／React 19.3.1／Tailwind 4.3.3；无稿业务运行环境由完整C09另选隔离授权环境，本任务不访问PaperBuilder。

### 接口与失败语义

- **选择的架构方案**：复用既有 `run-checks` 与既有材料检查入口，只改零留痕口径并新增一个只读检查器；复用既有 `steps.json` 承载映射，不新增进度对象。放弃在运行时写留痕（候选 B）与只修反向 bug（候选 C），两者都被用户约束否掉。
- **模块职责**：`run-checks` 聚合机械合同与零留痕判定 → 输出人读结论；新检查器消费 `steps.json` 映射与既有材料 → 输出逐项清单与 JSON；方法正文只承接纪律与指针；C09 侧各包生产证据，完备性包消费全部证据。
- **接口与数据流**：检查器输入＝阶段名 + 任务材料根 + `steps.json` 映射；输出＝人读清单（每步一行判定）与 JSON（阶段/步骤/证据位置/判定/缺口），退出码恒 0。零留痕输入时输出全部步骤“未留痕”。C09 侧数据流＝命令 → 原始输出原件 → 表/判定 → 交接指针。
- **失败语义**：材料缺失报“未留痕/映射未配置”，不报“无缺失”；读不到证据位置记缺口与负责人；命令行失败保原始错误；真实库写入失败不重试、不换写操作。
- **新增控制面**：只新增一个 CLI 检查器与一个测试文件；不新增公共 runtime 命令、不新增持久对象。

### 全局文件边界与依赖

- **新增**：`tools/cli/check-stage-steps.mjs`；`tests/contract/check-stage-steps.test.mjs`；`tests/contract/run-checks-zero-attestation.test.mjs`；仓外目标仓 `/Users/Hugh/Hugh/Project/ui-workbench-target-20261025`（其内具体文件由 P3 建）；任务库本阶段证据原件 15 份，逐份列在各 Phase 的写入集里。
- **修改**：`skills/design-source-extraction/scripts/collect-design-source.mjs`（仅008 viewport及009既有动作逐步调用/目标等待）；`tests/contract/design-source-extraction-collect.test.mjs`（仅008/009对应SDK seam定向回归）；`tools/cli/run-checks.mjs`；`workflows/make-decision/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；`skills/decision-log/templates/decision-log-template.md`。
- **禁止改动**：`runtime/`、`core/`、`contracts/`、`schemas/`（不新增运行时状态或第二进度权威）；`/Users/Hugh/Downloads/UI设计稿`（只读）；`/Users/Hugh/Hugh/Project/PaperBuilder`（当前完全禁止访问/修改，包含只读探针与API）；`specs/workflowhub-ui-frontend-release-20261020/**`（发布材料只读）；`specs/archive/workflowhub-ui-frontend-c04-design-source-extraction-20261025/**` 与 `skills/design-source-extraction/**`（C04交付材料只读；仅008视口及009既有动作调用顺序/目标等待的`skills/design-source-extraction/scripts/collect-design-source.mjs`固定script与`tests/contract/design-source-extraction-collect.test.mjs`对应回归例外，其它禁止保持）；`docs/adr/0054-*.md`（历史决定只读；本轮007/008不安排ADR改动，旧OPEN-05不再派P5写）；`decision-log.md`（本阶段不重写）。
- **全局依赖**：修复包、旧基线、目标仓与无稿交接可独立推进；样本等目标仓；六指标复用样本及既有失败事件；外部内容消费当前合同与具名未来条件，不依赖当前业务执行。串行理由写在各 Phase 契约头。
- **文件归属**：每个写集路径只有一个 Phase 持笔；跨 Phase 无共享路径。
- **回滚与恢复**：检查器改动可单 hunk 回退，不影响既有聚合输出；目标仓失败可整仓弃用重建；真实库改回失败按登记残留处理，不重试。

### 需求到任务追踪

| 来源 / 决定（decision-log ID） | 原义行为/强度 | FR / AC | Phase / Task | oracle 与判据 | 依赖 / 状态 |
| --- | --- | --- | --- | --- | --- |
| `R-021`、`U-001`、`D-011` | 零留痕逐项报出，写一条不得反向变红 | `FR-REPAIR-001` / `AC-11` | P1/T001 | ORACLE-P1-STAGE-STEPS：零留痕逐项在列、单条留痕不判失败 | none；current |
| `R-010`、`U-002`、`U-003`、`D-011` | 报告式检查器、模块 8 项、逐包状态、推进前置 | `FR-REPAIR-002`、`FR-REPAIR-003`、`FR-REPAIR-004` / `AC-11` | P1/T002 | ORACLE-P1-STAGE-STEPS：缺第 8 步被点名；五阶段映射各给结论 | none；current |
| `R-021`、`R-006`、`D-011` | 纪律段、模板一行指针、级别可核格式与测试 | `FR-REPAIR-005`、`FR-REPAIR-006`、`FR-REPAIR-007` / `AC-11` | P1/T003 | ORACLE-P1-STAGE-STEPS：四份正文同段、模板只多一行、级别字面可解析 | P1/T002；current |
| `R-011`、`R-018`、`R-014`、`D-001` | 旧版本独立安装真跑三条命令，依赖与环境留档 | `FR-BASELINE-001`、`FR-BASELINE-002`、`FR-BASELINE-003` / `AC-01` | P2/T004 | ORACLE-P2-BASELINE-RUN：三条命令 exit 0、独立安装 | none；current |
| `R-011`、`R-016`、`D-002` | 目标仓两页与空壳边界 | `FR-TARGET-001`、`FR-TARGET-002` / `AC-02` | P3/T005 | ORACLE-P3-TARGET-REPO：两页 200、壳内无设计稿片段 | none；current |
| `R-007`、`D-003`、`OI-012`、`PRD-C09-CARD` | 六维清单、十条差异、指纹、业务读回登记 | `FR-SAMPLE-001`、`FR-SAMPLE-002`、`FR-SAMPLE-003`、`FR-SAMPLE-004` / `AC-03` | P4/T006 | ORACLE-P4-SIX-DIMENSIONS：六维齐、十条差异、指纹可复算 | P3；current |
| `R-013`、本轮用户范围决定 | 无稿对象/接口/权限/结果/失败判据交接，真实执行后置 | `FR-NODRAFT-001`、`FR-NODRAFT-002`、`FR-NODRAFT-003` / `AC-04` | P5/T007 | ORACLE-P5-NODRAFT-HANDOFF结构/来源及独立可执行性人读；282/061/302/314承接TCR，旧oracle只历史 | none；current |
| `R-012`、`R-014`、`R-015`、`D-005`、`PRD-S6` | 六指标逐项定义、走查、N/A 与禁令 | `FR-METRIC-001`、`FR-METRIC-002`、`FR-METRIC-003`、`FR-METRIC-004` / `AC-05` | P6/T008 | ORACLE-P6-SIX-METRICS：六项逐项有单位/分母/记录位置/缺失写法 | P4,P5；current |
| `R-004`、`R-005`、`D-006`、`OI-005`、`PRD-C09-CARD` | 外部内容逐项落位与前序依赖 | `FR-EXTERNAL-001`、`FR-EXTERNAL-002` / `AC-06` | P7/T009 | ORACLE-P7-EXTERNAL：每项有出处、方式、时机、责任者、落位 | P2,P3,P4,P5,P6；current |
| `R-020`、`D-009` | 两侧同输入与运行协议 | `FR-FREEZE-001`、`FR-FREEZE-002` / `AC-09` | P8/T010 | ORACLE-P8-FREEZE：四项冻结与步骤单可照做 | P3,P4,P5,P6；current |
| `R-020`、`D-010`、`PRD-C09-CARD` | 两链证据点、四资产证据、判定独立 | `FR-EVIDENCE-001`、`FR-EVIDENCE-002`、`FR-EVIDENCE-003` / `AC-10` | P9/T011 | ORACLE-P9-EVIDENCE-PLAN：十段与四类资产各有落点 | P4,P5,P6；current |
| `R-002`、`R-019`、`D-007`、`PRD-C09-CARD` | 完备性逐项判定与分开报 | `FR-READY-001`、`FR-READY-002` / `AC-07` | P10/T012 | ORACLE-P10-READINESS：每项已核验或具名未决 | P1,P2,P3,P4,P5,P6,P7,P8,P9；current |
| `R-017`、`D-008` | 交接表可回读 | `FR-HANDOFF-001` / `AC-08` | P10/T013 | ORACLE-P10-HANDOFF：五类条目均有可读指针 | P10/T012；current |
| `R-021`、`D-011` | 全 AC 末次验收 | `FR-REPAIR-001`、`FR-BASELINE-001`、`FR-TARGET-001`、`FR-SAMPLE-001`、`FR-NODRAFT-001`、`FR-METRIC-001`、`FR-EXTERNAL-001`、`FR-READY-001`、`FR-HANDOFF-001`、`FR-FREEZE-001`、`FR-EVIDENCE-001` / `AC-01`、`AC-02`、`AC-03`、`AC-04`、`AC-05`、`AC-06`、`AC-07`、`AC-08`、`AC-09`、`AC-10`、`AC-11` | P11/T014 | ORACLE-P11-FINAL-ACCEPTANCE：逐 AC 一条结论与证据指针 | P1,P2,P3,P4,P5,P6,P7,P8,P9,P10；current |

### 全局验证策略

- **验证策略**：修复包用契约测试与真实回放（合成材料、零留痕材料、真实历史日志）；C09 侧用真实命令与真实服务，每条 AC 有可重放命令或人工读回。静态合同用 `node tools/cli/run-checks.mjs --material-root=<认证 worktree 的 specs/workflowhub-ui-frontend-c09-baseline-preparation-20261025>`。
- **RED/GREEN 设计**：每个行为 Task 在 Phase 卡里写同一条 `gate_cmd`，RED 是具名断言失败、GREEN 是同断言通过；未执行不宣称 RED/GREEN。非行为 Task（纯文档）按 G-2 写具名客观替代与风险。
- **最终聚合**：唯一末 Phase `P11` 逐条消费前十个 Phase 的原件，补必要未闭环 case，逐 AC 一条结论；不重跑全量。
- **不能证明的内容**：结构合同通过不证明语义、不证明真实环境健康、不证明 C09 效果达标。

## Appendix A — 验收判据（唯一权威）

每条 AC 的判定时点为其承接 Phase 收口之后，执行 owner 是未参与实施的判定人；需用户在场的条件在条目里单独注明。AC-03、AC-05、AC-06、AC-07 中带“来源 PRD”字样的附加条件来自 PRD 直接要求、decision-log 的 R 表无落点；用户在 2026-10-25 明确选择“并进现有验收”，因此这些条件从本次起生效（原件 `quality/evidence/human-confirmations/2026-10-25-002-build-plan-decision.json`）。AC-06 的计数以清单原件逐项为准，两套数字的差异写进报告。

- [ ] **AC-01**：在不借用主仓依赖的独立安装与正常分支上，按记录步骤启动旧版本、建任务、写一份材料；关联 `FR-BASELINE-001`～`FR-BASELINE-003`
验证：由未参与实施的人在认证 worktree 外的新临时目录按证据副本重放三条命令；owner 为执行者，时点为 P2 收口后；成功看退出码与原件，失败看是否借用主仓依赖。机器可判。
通过：提交 `b94c5e6a` 可回读；独立安装成功；三条命令都真跑且 exit 0；依赖、环境与清理规则有记录；无新能力混入。
失败：版本未核；借用主仓 `node_modules` 充数；启动失败却写可运行；用当前主干替代；detached HEAD 当正常分支。
证据：P2 的三条命令回执与安装记录原件。

- [ ] **AC-02**：新建目标仓后按记录启动并打开两页路由；关联 `FR-TARGET-001`、`FR-TARGET-002`
验证：判定人按记录命令起 dev server 并请求两页；owner 为执行者；机器可判（HTTP 状态与页面体）。
通过：临时目标仓目录可读，文件 hash 与 lockfile 已冻结可回读（不要求 Git 提交或提交号）；两页路由可访问；版本与 lockfile 固定；壳内无设计稿代码或业务数据。
失败：仓不存在；页面 404；版本浮动；壳内出现设计稿 tsx/CSS 片段或业务组件。
证据：临时仓目录、冻结文件 hash 与 lockfile、真实启动输出、两页 HTTP 与页面截图原件。用户本轮免临时仓提交决定见 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-004-build-code-p3-no-temp-commit.json`；不改变主仓每 Phase 提交与最终确认规则。

- [ ] **AC-03**：按六维清单逐项对照设计源与目标仓；关联 `FR-SAMPLE-001`～`FR-SAMPLE-004`
验证：人工读清单与原件，逐维核来源；owner 为样本负责人；只能人读（判据是清单语义完整性，命令输出不构成结论）。
通过：六维（页面/路由、状态、viewport、数据、依赖、设计源版本）各有来源且可回读；十条已知差异逐条有名有据；设计源指纹可复算；两页业务操作与结果读回的可读性已登记。
失败：只写文件名；未真渲染；缺维度；漏列已知差异；用条数代替逐条；指纹不可复算；业务读回无登记。
证据：六维表原件、设计源渲染证据、指纹清单、读回登记。

- [ ] **AC-04**：核无稿验证范围与条件交接的可执行性；关联 `FR-NODRAFT-001`～`FR-NODRAFT-003`
验证：未参与作者工作的独立读者逐项读合同与本任务已有原件；owner为执行者；完全不访问PaperBuilder。
通过：对象/接口输入输出/权限资格/结果真值与读回/失败取消恢复/残留规则逐项有据或具名缺口；缺口有影响、owner、下一条件；后续隔离授权环境的选择责任与执行前资格写清；读者能按合同判断何时能执行、何时停止；旧0写入和连接失败与真实两写三读未执行保持原档位，示例明确不是业务证据；当前合同取得独立可执行性结论，内容确认沿用户真实答复。
失败：缺关键字段或owner；仍要求本任务访问PaperBuilder；把环境/权限未知写可用；用示例或历史200冒当前业务完成；把旧失败改pass；以范围决定代内容验收。
证据：当前无稿验证交接合同及独立回读、具名条件与历史原件指针；完整C09另取隔离授权真实执行原件和产品最终确认。当前修订不自动使AC-04通过。

- [ ] **AC-05**：用一次真实事件走查六项指标记录方式；关联 `FR-METRIC-001`～`FR-METRIC-004`
验证：人工读定义表与走查记录，逐项对上 PRD S6；owner 为指标负责人；只能人读（逐项点名与语义完整性）。
通过：逐项点名任务返工、缺陷、人工时间、验收确认、提取覆盖、视觉差异，各有单位、分母、记录位置、缺失写法与 PRD S6 出处；分母来自两页样本清单；无稿侧记 N/A 与原因；n=1 声明写法齐备；比较禁止项在表内。
失败：用“六项”概括而不点名；口径含糊；分母事后改；拿旧案例数字替真记录；无稿提取填 0 或 100%。
证据：六指标定义表、走查记录、PRD S6 对照。

- [ ] **AC-06**：按外部内容清单逐项核落位；关联 `FR-EXTERNAL-001`、`FR-EXTERNAL-002`
验证：人工逐项追行号/来源与落位；owner 为执行者；只能人读（逐项可追溯）。
通过：每一项追到 PRD 行号或技能来源，并给引入方式、时机、责任者、落位或处置；准备期8类各有当前交付或真实具名处置；业务环境/授权/真值执行条件按P5合同具名后置，不冒已验证；C04局部验证输入与采集接线仍须当前实际接入、真读产物并核`freshness`及隔离消费，不能只留接入位；其它最终验证项明确后置；前序依赖按真实原件引用。
失败：只报条数；漏项；把最终验证项提前承诺；把未交付依赖当已落位；计数口径与清单原件不一致却不说明。
证据：外部内容清单原件与落位表。

- [ ] **AC-07**：逐项判准备完备性；关联 `FR-READY-001`、`FR-READY-002`
验证：人工读判定表逐项核；owner 为用户；只能人读（结论语义）。
通过：每项是“已核验”或“具名未决＋负责人＋下一步”；当前旧基线独立可跑、无稿交接完整可执行、六指标分母有据；无稿真实隔离环境/权限/业务执行具名后置且未完成，不要求本任务访问PaperBuilder；准备完整性与产品效果分开报；报告写明本次准备不是开工或合并门。
失败：用准备完成宣布 C09 达标；未测项写成已测；把当前三项交付推到正式实验；把未来真实业务未执行写成已执行；报告被读成放行信号而未声明。
证据：完备性判定表、逐项证据指针。

- [ ] **AC-08**：用交接表回读版本、环境、样本、口径与未决；关联 `FR-HANDOFF-001`
验证：由未参与实施的人按表逐条打开原件；owner 为用户；只能人读（可回读性）。
通过：C09 后续与 C10 能按指针直接找到原件；未覆盖状态可见；不复制第二份证据。
失败：只有摘要无法回读；指针指向不存在文件；C10 需要再来问。
证据：交接表与指针清单。

- [ ] **AC-09**：按输入冻结清单与运行步骤单逐项核对；关联 `FR-FREEZE-001`、`FR-FREEZE-002`
验证：人工按冻结清单复放，核两侧输入指纹；owner 为执行者；只能人读（协议可执行性）。
通过：两侧同一份设计源版本与任务说明；允许/禁止读取范围写明且禁读只用于提取器局部验证；步骤、记录位置、清理与偏差登记可照着做。
失败：两侧输入不同；步骤无法执行；清理缺失；禁读混入因果比较。
证据：输入冻结清单、运行步骤单、偏差登记表。

- [ ] **AC-10**：按证据清单逐点核准备方案落点、判定人与准备交接确认；关联 `FR-EVIDENCE-001`～`FR-EVIDENCE-003`
验证：独立异源判定人逐点核计划落点与可执行性，用户核判定人身份并对当前准备方案与交接作真实确认；owner 为用户；只能人读（独立性与计划完整性判断）。
通过：流程链十段与业务链六个检查点逐步有证据落点、原件类型、owner 与取得条件；四类资产各有整理→应用→更新→验证证据点；规范/经验实际消费有核查清单；已有原件可回读，未执行处逐项写缺口、影响、负责人及下一条件；当前准备方案判定人独立且异源、不参与实施，身份与独立判断原件可回读；有一次用户针对当前准备方案与交接的真实确认原件；达到/未达到/未覆盖写法明确。
失败：某步无落点或未执行却冒充已执行；四类资产只写文件名；判定人即实施者或同源；没有针对准备方案与交接的用户确认；失败被写成通过。
证据：证据清单、消费核查清单、判定规则、独立异源身份与判断原件、用户准备方案与交接确认原件。真实两链、四资产生命周期运行、完整六指标比较与产品结果最终确认留到完整 C09，仍未完成；本条通过也不证明那些事项已执行。本轮边界决定原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-baseline-preparation-20261025/quality/evidence/human-confirmations/2026-10-26-006-build-code-prep-boundary-approved.json` 不替代修订后材料的独立审查或用户内容确认；当前 AC-10 保持 incomplete，待实际证据逐项重判。

- [ ] **AC-11**：用合成材料与真实历史日志各跑一次步骤检查，并对 11 个模块跑收敛完备性检查；关联 `FR-REPAIR-001`～`FR-REPAIR-007`
验证：判定人在认证 worktree 跑检查器与契约测试，核输出与决策日志 diff；owner 为执行者；机器可判（命令输出与退出码可重放）。
通过：缺第 8 步的合成材料能被报出；零留痕不再报“无缺失”；真实历史日志能列出已缺步骤；11 个模块 8 项逐项有证据指针且状态为“已收敛”；报告出现未收敛包时主会话停在该步并留记录；五阶段映射逐阶段给“已配置/未配置”，未配置不写通过；决策日志正文无新增步骤节；级别行能被解析。
失败：检查器只报“通过”；零留痕仍是绿；清单被空话填满；有包未收敛仍继续；未配置阶段写成通过；靠新增日志节充数。
证据：检查器输出、历史回放原件、模块状态表、五阶段映射表、决策日志 diff。

## 12. 风险、未决与交接

- **RISK-01**：旧基线独立安装失败
  - **受影响 ID**：`PFACT-002`、`FR-BASELINE-001`、`AC-01`
  - **触发条件**：独立安装非零退出或依赖缺失
  - **后果**：基线不可复现，AC-01 不通过
  - **缓解或停止**：保留原始错误，补依赖记录；必要时停该项并请用户选择
  - **处理阶段**：P2
  - **验证**：重放三条命令与安装记录
- **RISK-02**：检查器误报或漏报使清单不可信
  - **受影响 ID**：`PFACT-007`、`FR-REPAIR-002`、`AC-11`、`OI-016`
  - **触发条件**：真实历史日志回放出现无法归因的报警或漏报
  - **后果**：执行者忽略真实缺口
  - **缓解或停止**：逐条登记误报漏报、必要时收窄映射；不为此改运行时规则
  - **处理阶段**：P1
  - **验证**：历史回放清单与人工核对结果对照
- **RISK-03**：设计源无版本号导致视觉基准漂移
  - **受影响 ID**：`PFACT-004`、`FR-SAMPLE-003`、`AC-03`、`OI-012`
  - **触发条件**：文件清单或内容 hash 变化
  - **后果**：后续无法复现同一基准
  - **缓解或停止**：清单＋mtime＋sha256＋合成 hash；漂移即登记并重新固定
  - **处理阶段**：P4
  - **验证**：复算指纹与当前字节比对
- **RISK-04**：目标仓空壳边界守不住，变成“抄源码”
  - **受影响 ID**：`PFACT-010`、`FR-TARGET-002`、`AC-02`
  - **触发条件**：仓内出现设计稿 tsx/CSS 片段或业务数据
  - **后果**：有稿对照失效
  - **缓解或停止**：逐文件核对；发现即删并留记录
  - **处理阶段**：P3
  - **验证**：仓内文件清单与设计源指纹比对
- **RISK-05**：生产库写入残留
  - **受影响 ID**：`PFACT-005`、`FR-NODRAFT-002`、`AC-04`、`OI-014`
  - **触发条件**：卡片更新时间或费用来源字段变化
  - **后果**：19G 真实库留痕
  - **缓解或停止**：历史003许可与0写入事实保留；当前007完全禁止访问PaperBuilder，真实业务留完整C09隔离授权环境
  - **处理阶段**：P5
  - **验证**：当前只核历史原件与交接条件；未来真实执行的前后值/残留验证仍未完成
- **RISK-06**：截图阈值语义漂移
  - **受影响 ID**：`FR-METRIC-002`、`AC-05`
  - **触发条件**：跨版本复用阈值
  - **后果**：视觉差异数字不可比
  - **缓解或停止**：同机同版本采集；不跨版本复用
  - **处理阶段**：P6
  - **验证**：采集记录里的版本与机器标识
- **OPEN-01**：PRD 有、decision-log R 表无落点的 11 项（对应 `2026-10-25-002-prd-c09-requirement-extract.md` 的 D-1～D-11）
  - **受影响 ID**：`FR-SAMPLE-004`、`FR-METRIC-003`、`FR-METRIC-004`、`FR-READY-002`、`AC-03`、`AC-05`、`AC-06`、`AC-07`
  - **负责人**：用户（只对需要改验收条件的三项决定承接方式）
  - **影响**：D-3、D-4、D-6、D-7、D-8、D-9、D-10 已由现有 AC 判据与非目标承接；D-1、D-2、D-11 三项要进 AC 判据就属于改已确认验收条件，须用户答复
  - **处理阶段**：本次计划确认
  - **关闭条件或停止**：已关闭——用户 2026-10-25 选“并进现有验收”，原件 `quality/evidence/human-confirmations/2026-10-25-002-build-plan-decision.json`
- **OPEN-02**：六指标原目标数值（返工≤2、缺陷≤10、人工≤2 小时、确认 1 次、严重缺陷为零）只在 PRD S6，未进 decision-log
  - **受影响 ID**：`FR-METRIC-001`、`AC-05`
  - **负责人**：样本与指标负责人（P6）
  - **影响**：本规格按“定义表引用 PRD:138 的目标值”处理，不改 AC 判据；若下游要按阈值判达标，须另立判据
  - **处理阶段**：P6
  - **关闭条件或停止**：定义表出现 PRD:138 出处与数值即关闭
- **OPEN-03**：外部内容计数口径冲突（decision-log 的 12/4/4/8 与按 PRD 重算的 9/7/5/8）
  - **受影响 ID**：`PFACT-012`、`FR-EXTERNAL-001`、`AC-06`
  - **负责人**：用户
  - **影响**：AC-06 按四个计数判会判不清；按清单原件逐项判则可执行
  - **处理阶段**：本次计划确认
  - **关闭条件或停止**：已关闭——用户 2026-10-25 选“以清单原件逐项为准，报告写明两套数的差异”
- **OPEN-04**：检查器映射的误报与漏报率未实测
  - **受影响 ID**：`FR-REPAIR-002`、`AC-11`、`OI-016`
  - **负责人**：执行者（P1）
  - **影响**：清单可能不可信
  - **处理阶段**：P1
  - **关闭条件或停止**：历史回放清单与误报漏报登记完成后关闭
- **OPEN-05**：ADR-0054 决定段与 D-004／批次 05 的最终选择不一致
  - **受影响 ID**：`PFACT-008`、`FR-NODRAFT-002`、`AC-04`
  - **负责人**：make-decision 作者（用户决定是否改 ADR）
  - **影响**：执行者可能按 ADR 走“预检后取消”或“复制→丢弃→恢复”，与本规格冲突；ADR 还写了“门禁不过退回只读闭环”与“软删行残留”，与 D-004 的“判准备不完整、不用只读替代”和“不做新增对象的写”也不一致；decision-log 的写集表把 PaperBuilder 写成“只读、不改数据”，与 D-004 的一次业务写入冲突。历史时点执行以D-004为准；现行访问边界由007替代，完全不访问PaperBuilder，不再按该旧写许可执行
  - **处理阶段**：本次计划确认
  - **关闭条件或停止**：历史关闭依据：用户2026-10-25曾授权修正旧记录；历史实际修改事实沿P5旧原件，不补造。当前007把P5改为交接，取消当前ADR修改动作，ADR保持只读，不能再将此条派给P5
- **OPEN-06**：历史规划时点目标仓未创建、设计源 `:5173` 当时无监听
  - **受影响 ID**：`PFACT-003`、`PFACT-004`、`AC-02`、`AC-03`
  - **负责人**：执行者（P3、P4）
  - **影响**：原规划时点service/route未取得；当前137已取得目标仓运行/两路由/冻结及自有服务清理，394补源渲染登记，不证明服务现在在线
  - **处理阶段**：P3、P4
  - **关闭条件或停止**：原条件由137及394的具名运行原件承接，当前范围沿416；未来实际运行前重新核服务身份/地址/端口，不为修本文启动服务
- **OPEN-07**：零留痕口径与已验收的 AC-N11-25 冲突
  - **受影响 ID**：`PFACT-007`、`FR-REPAIR-001`、`AC-11`
  - **负责人**：用户（必须选承接方式）
  - **影响**：直接改 `run-checks` 的零留痕出口会让 AC-N11-25 的原文与现绿测试 `tests/contract/n11-discussion-quality.test.mjs:87-91` 失效；不改则 AC-11 的“零留痕不再报无缺失”没有落点
  - **处理阶段**：本次计划确认（实施在 P1/T001）
  - **关闭条件或停止**：已关闭——用户 2026-10-25 选①：保留 exit 0 与 `steps_unattested`，新增逐项“未留痕”清单，同批微调 `tests/contract/n11-discussion-quality.test.mjs` 的断言并留变更请求
- **OPEN-08**：PRD 要求的四个旧卡来源（OLD T01/T04/T09/T10）与真实 baseline 研究没有可到达入口
  - **受影响 ID**：`FR-EXTERNAL-001`、`AC-06`
  - **负责人**：外部内容负责人（P7）
  - **影响**：AC-06 要求每项追到 PRD 行号或技能来源；这四项只能追到编号，追不到原件
  - **处理阶段**：P7
  - **关闭条件或停止**：落位表给“只到编号、原件未取得”的具名未决与负责人，即关闭；补入口需用户提供
- **OPEN-10**：C04 提取产物怎么真正接进来（接入命令、产物路径、freshness 判定、隔离消费怎么证“未与收益比较混淆”）还没定成可执行步骤
  - **受影响 ID**：`PFACT-016`、`FR-EXTERNAL-002`、`FR-EVIDENCE-002`、`AC-06`、`AC-10`
  - **负责人**：外部内容负责人与证据计划负责人（P7、P9）
  - **影响**：只写“已交付”而不写怎么接入，执行时可能把 C04 产物当摆设，也可能把它当产品规范
  - **处理阶段**：P7、P9
  - **关闭条件或停止**：落位表与证据计划写出接入命令、产物路径、freshness 判定与隔离消费的判定方法即关闭
- **OPEN-09**：项目级设计与前端规范正文缺失（`specs/design/*`、`specs/frontend/frontend.md`），`step-consumer-design.md` 不存在
  - **受影响 ID**：`PFACT-015`、`FR-TARGET-002`、`AC-02`、`AC-10`
  - **负责人**：原设计内容 owner、前端工程 owner、前端方法 owner
  - **影响**：两页壳的视觉/组件口径没有项目级正文可依；本规格按其“不引组件库、不抄稿”的边界执行，视觉依据直接用设计源渲染
  - **处理阶段**：P3 之前登记，交原 owner 补
  - **关闭条件或停止**：缺口已登记并写明影响即关闭；正文补全由其 owner 决定

## 13. 业务影响与回归范围

### 既有检查链

- **既有行为**：`npm run check` 聚合 markdownlint、`verify-structure.mjs` 与 `run-checks.mjs`；`run-checks` 对材料做机械合同检查
- **本需求影响**：只改零留痕与单条留痕的判定口径，聚合出口与退出语义保持；新增检查器是独立命令，不进既有聚合
- **回归路径**：改动后跑一次 `node tools/cli/run-checks.mjs --material-root=<认证 worktree 的 specs/workflowhub-ui-frontend-c09-baseline-preparation-20261025>`，核既有检查项与新增项都能读
- **验收**：AC-11

- **可能受冲击的业务规则**：`steps.json` 增加映射键后，既有读取方若按固定键遍历需保持兼容；`SKILL.md` 加段不得改动既有步骤编号与顺序
- **明确无影响**：不改 `runtime/`、`core/`、`contracts/`、`schemas/`；不改发布 PRD 与发布决策；不改设计源与 PaperBuilder 代码

## 补充材料

- 原方向与取舍：`decision-log.md`（本任务）。
- 方向级细化（路径、路由、端点、分母、落位、协议、证据点）：`quality/evidence/decision-log-refs/2026-10-25-module-details.md`。
- 旧版本探针：`quality/evidence/decision-log-refs/2026-10-25-old-baseline-runnable-probe.md`。
- PRD 抽取与缺口清单：`quality/evidence/research/2026-10-25-002-prd-c09-requirement-extract.md`。
- 修复包代码事实：`quality/evidence/research/2026-10-25-003-repo-facts-for-stage-step-repair.md`。
- 规范来源与 UI 适用性：`quality/evidence/research/2026-10-25-004-norm-sources-and-ui-applicability.md`。
- 知识复用四判：`quality/evidence/research/2026-10-25-005-knowledge-reuse-and-history.md`。
- C04 交付材料：`specs/archive/workflowhub-ui-frontend-c04-design-source-extraction-20261025/spec.md` 与 `skills/design-source-extraction/SKILL.md`。
