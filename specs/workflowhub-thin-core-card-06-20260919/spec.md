# 功能规格：薄核心删除与窄工具保留（Card-06）

> 本文件是本实施 task 的产品行为与全局实现设计权威。每个 Phase 的差异、精确命令和执行卡只在 `phases/P<n>.md`；索引只存指针。逐文件处置的唯一权威是 [attachments/migration-table.md](attachments/migration-table.md)（迁移表，冻结后只允许 append-only 补记）。验收正文只在 Appendix A，叙事区只引用 AC ID。

- **功能名**：薄核心删除与窄工具保留
- **来源**：`decision-log.md` ADR-001～021、OI-001～018、U-001～004、V-001～021；母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` CARD-06（FR-27～32/51/52、AC-27～32/52/53）
- **状态**：设计材料已于冻结记录 `d3cd1cdfc99304f6700cb0f5c8a26f331a33a458` 固定；023 的限定登记例外已获具体用户批准（原件 `quality/confirmations/2026-10-01-001-build-code-accepted.json`）。设计冻结与该具体授权分别按原件读回，本状态行不证明正式 build-plan 阶段完成或整体质量接受。

## 速读卡（30 秒）

- **一句话需求**：把 WorkflowHub 里所有"机器保安"（kernel/fact graph、stage completion 认证、哈希/快照/材料身份/回执校验、双写、步数锁、强制 handoff）拆掉，pre 路径整体退役；只留你点头（confirm）和不可逆 Git 授权（authorize）两道人为门、5 个能单独运行的窄工具、可搬运技能和按分工保留的审查链；handoff 等流程技能保留执行但不再当门（ADR-024）。
- **核心改动点**：
  - 先在 `runtime/interface/` 新建 5 个零依赖窄工具 + 人为门记录工具，再把旧调用点逐批改接，最后删旧机制。
  - 八批删除（B0～B7 = P1～P8），每批前做消费者扫描与 G-3 安全扫描，每批后跑针对性测试并向你汇报。
  - 审查链按分工：文档审查走 wh-review，代码审查走 OCR（补齐审查合同；未装 OCR 时回退 wh-review 并留记录）。
- **最大影响面**：runtime/tools/core/scripts 约 190 个生产文件、约 350 个测试文件、5 个 post 工作流、全部治理文档；外置任务存储里 124 个历史 pre 任务转只读归档。
- **验收信号**：隔离目录里 5 个窄工具 5/5 真实可用；日常路径静态扫描零 kernel/校验机器调用点；迁移表每条四要素齐全且首删晚于冻结；每批有 backup 标签和 G-3 记录；本卡后半程与 verify-code 在无 kernel 下实跑走通。

## 材料导航

| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| `decision-log.md#决定` | ADR-001～021（ADR-018～021 为 build-plan 回流增量） | 所有下游 |
| `attachments/migration-table.md` | 七类面逐文件四要素 + 批次 + G-3 预处置 | 每批开工前 |
| `spec.md#迁移契约` | 冻结、快照、切换点、回退、dirty worktree | build-code 每批 |
| `spec.md#appendix-a--验收判据唯一权威` | 验收唯一正文 | build-code、verify-code |
| `phases/index.md#execution-index` | 8 个 Phase 的纯指针 | build-code 定位 |

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001、CARD-06 FR-27 | ADR-004、ADR-005 | FR-27 / AC-27 | current / 全部删除批次 | 无 |
| R-001、CARD-06 FR-28 | ADR-003、ADR-020 | FR-28 / AC-28 | current / runtime/interface | ⑤选记录锁（OPEN-005 本 spec 定死） |
| R-001、CARD-06 FR-29 | ADR-004、ADR-005 | FR-29 / AC-29 | current / 日常路径 | 自举演练由本卡 P6～P8 + verify-code 承担 |
| R-001、CARD-06 FR-30 | ADR-017 | FR-30 / AC-30 | current / P5 前置人为门 | 用户过目 |
| R-001、CARD-06 FR-31 | ADR-006 | FR-31 / AC-31 | current / 每批 | G-3 预处置 25 项待用户确认 |
| R-013、V-016～V-021 | ADR-018、ADR-019、ADR-021 | FR-32 / AC-32（本卡修订） | current / 审查链 | 母 PRD 原 AC-32 文本在本卡被取代 |
| R-001、CARD-06 FR-51 | ADR-004、ADR-005 | FR-51 / AC-52 | current / 迁移表 | 冻结=用户确认后提交 |
| R-001、CARD-06 FR-52 | ADR-005、ADR-004 | FR-52 / AC-53 | current / 每批 | 过渡基线 SD-16 按 ADR-018 转正式保留 |
| R-013、V-020 | ADR-021 | FR-THIN-001 / AC-THIN-001 | current / OCR 审查包 | 无 |
| R-013、V-021 | ADR-021 | FR-THIN-002 / AC-THIN-002 | current / doctor + 代码审查回退 | 无 |
| R-001、SD-17 | ADR-016 | FR-THIN-003 / AC-THIN-003 | current / 记录层 | 历史记录只读，不改名 |
| R-001、V-006、V-009 | ADR-002、ADR-012 | FR-THIN-004 / AC-THIN-004 | current / pre 退役 | 接续归 Card-08 |
| R-001、V-008 | ADR-010、ADR-007 | FR-THIN-005 / AC-THIN-005 | current / 治理文档 | 修宪条款 G3-20 已获用户授权（ADR-022） |
| R-014、V-022 | ADR-022 | FR-31、FR-51 / AC-31、AC-52 | current / G-3 与冻结 | G-3 25 项预处置留待独立审查裁定 |
| R-001、OI-013 | ADR-014、ADR-019 | FR-THIN-006 / AC-THIN-006 | current / 幸存者 | Card-08/09 协调 |

## 1. 问题与紧迫性

母 PRD R-018/R-019 原话："大量的质量、流程阻塞""大量哈希、sha、快照……导致任务无法推进"。Card-02/04/05/07 的执行会话都出现了"代码完成后证据循环数小时"的情况（F-003～F-006）。本卡调研（`quality/evidence/research/2026-09-30-0[1-7]-*.md`）确认：kernel 静态依赖把几乎所有存储原语拖进 29～51 个文件的闭包；5 个窄工具现在一个都不能单独运行；`npm run check` 在 main 基线就是红的。Group 1 新路径已就位（Card-03 收尾中），本卡是 Group 2 的先行串行卡，Card-08/09 等本卡完成。

## 2. 背景、目标与范围

### 背景

现有 WorkflowHub 通过 `tools/cli/stage-runtime.mjs`（2251 行单体）→ `runtime/interface/runtime-facade.mjs` → task kernel（`runtime/task/task-kernel-implementation.mjs`）→ stage runner/handlers → completion predicates/freshness/receipt writer 这条链推进每个阶段。两道人为门（confirm、authorize）只作为 kernel 方法存在，并绑定 material_revision + snapshot_tree。

### 目标

- 日常"发起→实施→验收"全程没有机器门禁；5 个窄工具在无 kernel 的隔离目录里 5/5 真实可用。
- 仓库里不存在换名复活的旧机制；每个删除都有消费者核对、快照和回退方式。
- 删除前的损失有书面承认；质量缺口如实带 `incomplete`，由你拍板。

### 范围内

- 七类面（runtime、CLI、skills、workflows/steps、manifest/schema、测试夹具、治理文档）的逐文件处置，见迁移表。
- 窄工具新建与改接；两道人为门从 kernel 抽出。
- 审查链按分工收敛（ADR-018/019/021），含 OCR 合同补齐、OCR 检测和未装回退。
- 记录层新命名（ADR-016）；pre 路径退役与外置 pre 任务只读归档。

> 非目标只在第 10 节维护。

## 3. 用户场景与状态覆盖

### SCN-001：日常路径无门禁

- **角色**：用户 + 宿主 AI 助手
- **Given**：Card-06 完成后的仓库
- **When**：发起一个新任务，依次走 make-decision → build-plan → build-code → verify-code
- **Then**：没有任何环节调用 kernel/fact graph、没有 hash/快照/材料身份/回执校验作为前置；只在确认处出现 confirm、只在 commit/push/merge/清理前出现 authorize

### SCN-002：窄工具单独使用

- **角色**：任意宿主或脚本
- **Given**：一个只拷了 `runtime/interface/` 窄工具文件、没有 `node_modules` 的临时目录
- **When**：逐个调用 ①～⑤
- **Then**：每个都返回真实结果；把旧 `workspace-runner.mjs` 单独拷进去时必须报 `ERR_MODULE_NOT_FOUND`（证明检测会真报失败）

### SCN-003：授权后代码被改

- **角色**：执行不可逆 Git 动作的助手
- **Given**：用户已授权 push，授权记录写下分支与 HEAD 提交号
- **When**：之后又有新提交，再执行 push
- **Then**：④ 比对 HEAD 不一致，拒绝并要求重新授权（ADR-020）

### SCN-004：代码审查在没装 OCR 的机器上

- **角色**：build-code 每 phase 审查 / verify-code 终末审查
- **Given**：`ocr` 命令不存在或版本低于 1.12.9
- **When**：发起代码审查
- **Then**：doctor 报 `ocr: unavailable(not_installed)`；审查回退由 wh-review 执行同一审查面，记录里写明 `fallback.from=ocr`、原因和检测方式；若 OCR 已安装但审查失败，则不回退，按 unavailable 如实记录

### SCN-005：批前发现待删机制承担安全职责（G-3）

- **角色**：build-code 主会话
- **Given**：某批删除清单里出现迁移表未预处置的安全职责
- **When**：批前 G-3 扫描命中
- **Then**：当场停，大白话向用户回报，等拍板；不自行保留，不静默回写

### SCN-006：删到一半发现漏网消费者

- **Given**：迁移表已冻结，删除中发现一个未登记的消费者
- **When**：处理
- **Then**：在迁移表末尾 append-only 补记一行（`MT-<面>-A<NNN>`），立即向用户汇报；不修改已冻结行

### SCN-007：一批删坏了

- **Given**：批后针对性测试失败且当批无法修复
- **When**：回退
- **Then**：按"迁移契约"回退到该批 backup 标签对应状态；破坏性回退（reset）先征得用户授权

### 状态覆盖清单

- [x] **默认态**：SCN-001
- [x] **空态**：SCN-002（空隔离目录、无依赖）
- [x] **错误态**：SCN-004（OCR 已装但失败）、SCN-007
- [ ] **加载态**：N/A — 非 UI，无加载展示
- [x] **取消态**：SCN-005（G-3 停下等拍板）
- [x] **边界态**：SCN-003、SCN-006
- [x] **权限态**：SCN-003（未授权/授权过期拒绝）
- [x] **竞态**：SCN-002 的 ⑤ 记录锁双进程互斥

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：5 个窄工具现在都不能在无 kernel 环境真实调用；可复用的是函数体（`writeAtomicAt`、`createOnlyAt`、`withRecordLockAt`、`runWorkspaceCommand`），不是模块。
  - **status**：`verified`
  - **证据或来源**：`quality/evidence/research/2026-09-30-02-narrow-tools-and-record-layer.md` §0 K1/K2
  - **关联**：FR-28、AC-28
- **PFACT-002**：文档审查面（make-decision 方向/细节、build-plan 合并审查、build-prd）唯一执行者是 wh-review `runSimpleReview`；OCR 代码审查包过滤掉了 wh-review 的 build-code/verify-code 合同、provider 协议和 lens 正文。
  - **status**：`verified`
  - **证据或来源**：research 04 §2.2、research 07 Q1（`tools/cli/stage-runtime.mjs:485-499,544-545`）
  - **关联**：FR-32、FR-THIN-001、AC-32、AC-THIN-001
- **PFACT-003**：OCR 是仓库外 npm 全局包 `@alibaba-group/open-code-review`（命令 `ocr`，本机 1.12.9），doctor 不探测；没装时记 `blocked_before_dispatch`，同 scope 复用 attempt，装好后也补不回来。
  - **status**：`verified`
  - **证据或来源**：research 07 Q2/Q3（`ocr-delegation-adapter.mjs:257-264`、`review-record-route.mjs:684-709,1419-1423`）
  - **关联**：FR-THIN-002、AC-THIN-002
- **PFACT-004**：`npm run check` 在 main 基线已红（markdownlint 252 条、verify-structure、check-task-record-paths 7 条、closure 6 条、smoke 抛错）。
  - **status**：`verified`
  - **证据或来源**：research 03 §1
  - **关联**：FR-27、AC-27（不能直接当回归 oracle）
- **PFACT-005**：外置任务存储"pre 未 close 117 项"口径不可复现；按"非 post 且无 `operations/close/completed.json`"得 124 项（06/07/08/09 月 = 7/85/22/10），均无活跃任务。
  - **status**：`verified`
  - **证据或来源**：research 06 §2、附录 A
  - **关联**：FR-THIN-004、AC-THIN-004
- **PFACT-006**：G-3 候选合并去重后 25 项（G3-01～G3-25，见迁移表），超过 decision-log 推翻条件的 16 项阈值。
  - **status**：`verified`
  - **证据或来源**：research 01 §6、02 §7、03 §8、04 §5、05 §2、06 §4
  - **关联**：FR-31、AC-31；批次计划已按此重估（见 RISK-01）
- **PFACT-007**：（2026-10-01 更正）Card-03 已合并进 main（dd27a79a）并于本分支合并（741e1768）；它改动了约 36 个 skills/workflows 文件、16 个测试和 `stage-content-contracts.mjs`、`stage-handlers.mjs`、`material-workspace.mjs`。原表述「尚未合并」为 build-plan 起草时点状态，失效。
  - **status**：`verified`
  - **证据或来源**：`git merge-base --is-ancestor 26786b61 main` 非零；research 各报告 card03-touch 列
  - **关联**：FR-52、AC-53；P1/T001 开工对齐

## 5. 功能需求

### 删除执行（DEL）

删除按迁移表逐文件执行，每批前核对消费者，每批后跑针对性测试并汇报；删除的职责不许换名复活。

- **FR-27**：删除清单经 build-plan 核查后执行，每项删除的活跃消费者逐一核对，无"换名不改消费者"。
  - **范围边界**：迁移表中处置为 DELETE/NARROW 的全部行；不含 docs/research/**、specs/archive/**
  - **依据**：ADR-004、ADR-005、PFACT-004
  - **场景**：SCN-001、SCN-006
  - **验收**：AC-27
- **FR-29**：日常工作路径无 task kernel/fact graph 强制依赖，亦无 revision 绑定链、快照树认证、材料身份/哈希、回执 readback 校验作为推进、审查或测试前置。
  - **范围边界**：workflows、skills、runtime、tools 中仍存活的生产代码与方法文本；Git 自带提交号比对（ADR-020）不属于校验机器
  - **依据**：ADR-002、ADR-016、ADR-020、PFACT-001
  - **场景**：SCN-001
  - **验收**：AC-29
- **FR-30**：删除通用事实引擎（P5）前，存在经用户过目确认的书面损失清单（SD-12 四项逐项承认 + 缓解）。
  - **范围边界**：SD-12 四项 + G3-09、G3-18 等因删除而失去的自动防护
  - **依据**：ADR-017
  - **场景**：SCN-007
  - **验收**：AC-30
- **FR-31**：G-3：发现待删机制承担安全职责即停下回报用户，不静默保留。
  - **范围边界**：每批前扫描；迁移表 G-3 预处置经 build-plan 确认后生效，未预处置的新发现一律停下
  - **依据**：ADR-006、PFACT-006
  - **场景**：SCN-005
  - **验收**：AC-31

### 窄工具与人为门（TOOL）

- **FR-28**：5 项窄工具（①工作区/范围核对 ②命令 exit/output 采集 ③安全/原子写入 ④不可逆 Git 授权 ⑤冲突中断保护=记录锁）脱离 kernel 独立可调用。
  - **范围边界**：`runtime/interface/` 下单文件，只 import `node:*`；同时提供 CLI 与可 import 函数
  - **依据**：ADR-003、ADR-020、PFACT-001
  - **场景**：SCN-002、SCN-003
  - **验收**：AC-28

### 审查链（REVIEW）

- **FR-32**（本卡修订，ADR-018/019/021 取代母 PRD 原文）：审查链按分工运行——文档审查面由 wh-review 执行；代码审查面（build-code 每 phase、verify-code 终末）由 OCR 执行，仅当 OCR 未安装时回退 wh-review 并留记录；wh-review 中只服务代码面且已被取代的部分删除；三审查点（build-plan 合并、build-code 每 phase、verify-code 终末）保留；旧流程不换名搬进 Skill。
  - **范围边界**：`skills/wh-review/**`、`runtime/review/**`、`tools/cli/stage-runtime.mjs` 的 review 路由
  - **依据**：ADR-018、ADR-019、ADR-021、PFACT-002
  - **场景**：SCN-004
  - **验收**：AC-32
- **FR-THIN-001**：OCR 代码审查包包含 build-code/verify-code 审查合同、provider 协议、审查重点（stageReviewFocus）与 lens 技能正文。
  - **范围边界**：只搬合同文本，不搬旧执行流程
  - **依据**：ADR-021、PFACT-002
  - **场景**：SCN-004
  - **验收**：AC-THIN-001
- **FR-THIN-002**：doctor 报告 OCR 可用性；代码审查在 OCR 未安装时回退 wh-review 并在审查记录写明回退事实；OCR 已装但失败时不回退；依赖真实 OCR 的测试在未安装时显式跳过并报告。
  - **范围边界**："未安装"= `ocr` 命令不存在（ENOENT）或 `ocr --version` 低于 1.12.9
  - **依据**：ADR-021、PFACT-003
  - **场景**：SCN-004
  - **验收**：AC-THIN-002

### 迁移契约（MIG）

- **FR-51**：迁移表冻结为必做事实记录——覆盖七类面，每条列"现有消费者→目标消费者→保留/删除→回滚方式"；首次删除动作晚于冻结提交。
  - **范围边界**：`attachments/migration-table.md`；冻结后只 append-only 补记
  - **依据**：ADR-005、OI-008
  - **场景**：SCN-006
  - **验收**：AC-52
- **FR-52**：删除执行前写明并遵守：删除前快照（每批 `backup/card-06-b<N>` 本地标签）、切换点、失败回退、dirty worktree 处置；过渡基线（SD-16）在迁移表有显式条目。
  - **范围边界**：见"迁移契约"节
  - **依据**：ADR-005、ADR-018、PFACT-007
  - **场景**：SCN-007
  - **验收**：AC-53

### 记录层、退役与治理（REC）

- **FR-THIN-003**：幸存写入者（测试记录、人确认、授权及消费、审查记录、调研报告）新写入使用 `YYYY-MM-DD-NNN-<slug>.<ext>` 普通文件名、append-only、记录间纯文本路径引用；不新增内容寻址文件名。
  - **范围边界**：新写入；历史记录只读不改名；facts.jsonl 单行游标形态不变
  - **依据**：ADR-016、SD-17
  - **场景**：SCN-001
  - **验收**：AC-THIN-003
- **FR-THIN-004**：pre cohort 机制从仓库删除（无可执行路径）；外置任务存储中 124 个 pre 历史任务只读归档：根目录写 `README-ARCHIVED.md`（为什么归档、怎么只读查、接续归 Card-08、归档清单），不删除、不移动、不补造 close。
  - **范围边界**：只加 README，不改任务目录（形态 A，research 06 §2.4）
  - **依据**：ADR-002、ADR-012、PFACT-005
  - **场景**：SCN-001
  - **验收**：AC-THIN-004
- **FR-THIN-005**：治理文档（AGENTS.md、CLAUDE.md、CONTEXT.md、CONSTITUTION.md、constitution-checklist.md、README.md、docs/standard-workflow.md 等）改写为薄核心现状；开工横幅在收口时删除；宪法修订按其自身同步规则（版本、修订记录、映射、22 项清单）。
  - **范围边界**：docs/adr/** 原位保留为历史；过时说明文档转 `docs/archive/`
  - **依据**：ADR-010、ADR-004 批次 7
  - **场景**：SCN-001
  - **验收**：AC-THIN-005
- **FR-THIN-006**：显式幸存者不被误删：三审查点的现行实现、Card-08 回读候选（task-store 读写、phase_progress 游标读回、current-close-projection、portable-workflow-run 7 值）、Card-09 写入量基线（P5 删除前采集一次文件数）。
  - **范围边界**：迁移表 SURVIVOR/NARROW 行中标注"幸存者"的条目
  - **依据**：ADR-014、ADR-019、OI-013
  - **场景**：SCN-001
  - **验收**：AC-THIN-006

## 6. 模块划分

### 窄工具层（runtime/interface/）

- **负责什么**：工作区核对、命令采集、原子写、Git 授权、记录锁、人确认记录
- **对外提供什么**：CLI + 可 import 函数；公共入口 doctor/status/run/review/verify/confirm/authorize 的后端
- **依赖谁**：只依赖 `node:*`
- **测试边界**：每个工具一份定向测试 + 一份隔离测试

### 审查链（runtime/review/、skills/wh-review/、skills/review 等）

- **负责什么**：三审查点的派发、结果落盘、finding 校验与并集
- **对外提供什么**：`review --action=record`
- **依赖谁**：窄工具 ②③⑤；OCR（可选）；3rd-review broker（文档面与回退）
- **测试边界**：OCR 合同包测试、OCR 回退测试、既有审查功能测试（去哈希断言后）

### 方法层（workflows/、skills/）

- **负责什么**：阶段方法说明、技能正文、人为门出现位置、审查点位置
- **对外提供什么**：宿主可直接读取的 SKILL.md 与极简 steps/skill-deps
- **依赖谁**：窄工具与审查链的公共入口
- **测试边界**：残留扫描（不再要求 receipts/hash/run --action 认证）

## 7. 关键实体

- **迁移表行**：
  - **定义**：一个仓库路径的处置记录
  - **字段和约束**：id（`MT-<面>-NNN`，补记为 `MT-<面>-A<NNN>`）、path、现有消费者、目标消费者、处置、批次（唯一 owner Phase）、回滚方式、G-3、card03、备注
  - **关系**：一路径一行一批次；G-3 列引用 G3-NN
- **授权记录（④）**：
  - **定义**：一次不可逆动作的用户授权
  - **字段和约束**：operation（commit/push/merge/archive/cleanup）、branch、head（`git rev-parse HEAD`）、confirmation_ref（纯文本路径）、created_at；消费记录额外含 step_id、consumed_at、authorization_ref
  - **关系**：一条授权只能被一个 step 消费；同 step 重试返回同一消费记录
- **人确认记录**：
  - **定义**：用户对某阶段材料的真实答复
  - **字段和约束**：stage、decision、reply（逐字）、material_refs（纯文本路径）、head、created_at
  - **关系**：授权记录的 confirmation_ref 指向它

## 8. 数据和生命周期

- **数据粒度**：一次命令、一次确认、一次授权、一次审查各一个文件
- **数据时效**：写入即不可变；更正=新文件 + `supersedes: <path>` 行
- **缺失或迟到**：缺失保持 unknown/incomplete，不补造
- **预览与正式**：N/A — 无预览态
- **当前与历史**：新记录用新命名；历史记录（含 `<sha256>.json`、`attempts/<uuid>/`）只读保留，旧 reader 不再是写者
- **归属与清理**：记录属于 task 目录；本卡不做清理

## 9. 兼容性预留

- **既有消费方**：公共七类入口名字不变（doctor/status/run/review/verify/confirm/authorize），后端改为窄工具；删除的私有 op 无公共入口
- **命名预留**：窄工具文件名按职责命名，不带版本号
- **容器预留**：N/A — 不新增持久对象类型
- **状态预留**：审查记录新增可选 `fallback` 字段（ADR-021）
- **扩展边界**：不承诺旧 pre 任务可继续推进；不承诺历史记录可被新 reader 解析

## 10. 明确不做与默认必须成立

### 明确不做

- 审查工具重新选型（Card-05 owner）；集成审查重建（ADR-019）
- 回读检查新机制（Card-08）；写入量优化本身（Card-09，本卡只采基线）
- token/时间统计、后台执行平台、UI 改动（OI-018）
- 历史记录改名或迁移；为旧 pre 任务建兼容
- 母 PRD、兄弟卡材料、`specs/archive/**`、`docs/research/**` 的任何修改

### 默认必须成立

- 两道人为门在任何中间批次都可用（先抽出后删除）
- 三审查点在任何中间批次都可用（ADR-019）
- 真实测试失败必须修复或如实带 incomplete，不写成通过（ADR-015）
- 只跑受影响针对性测试，禁止无范围全量回归（AGENTS 测试硬规则）

## 验收流程

从场景入口依次定位 FR、Appendix A 的 AC、所属 Phase 的 Task 卡与 gate_cmd，执行后读回 task 目录下的测试记录；最终聚合在 P8/T029 逐 AC 回读。

## 测试标准

每个行为切片在 Appendix A 指向同一 oracle 与证据类型；精确命令只在各 Phase。窄工具、OCR 合同与回退是行为测试（RED→GREEN）；删除批次用迁移台账测试与残留扫描测试（同一测试按 backup 标签推导当前批次、逐批启用断言）；纯文档任务用残留扫描作为可证伪检查（G-2）。

## 架构边界

产品边界：用户只面对两道人为门与三审查点；其它都是宿主可选使用的窄工具。工程边界：`runtime/interface/` 是窄工具唯一落点；`runtime/review/` 因 Card-05 所有权与 ADR-018/019 保留（与 OI-006"其余分区清空"字面冲突，见 RISK-04）。

## 迁移契约

- **冻结**：用户已授权（ADR-022）本 build-plan 完成后提交一次（迁移表 + spec + phases + 决策补记），该提交即冻结点，提交号写入迁移表"冻结记录"节。首个删除提交必须是冻结提交的后代且晚于它。冻结后只允许 append-only 补记行并立即向用户汇报。 新G-3动议034尚未批准；仅在用户明确批准该提案实际patch后，允许对主表 MT-1-066 / MT-1-071 及 MT-6-138 三行的批次、对应回滚批次和误分类/consumer理由作定点纠正（MT-1-066/071：B1/P2→B4/P5；MT-6-138：B1/P2→B5/P6），并同步P2/P5/index；其它冻结主表行与冻结锚不变。此单次材料修正不是执行记录回写或新的通用改表许可。
- **删除前快照**：每批第一个改动提交之前，在当时 HEAD 打本地标签 `backup/card-06-b<N>`（N=批次号 0～7）。不推送标签。
- **切换点**：P5/T017 的提交是"公共入口后端从 kernel 切到窄工具"的切换点；P5/T023 之前旧机制仍在仓库中可回退。
- **失败回退**：批内失败先在同 task 修复；无法修复时，用 `git revert` 撤销该批提交（非破坏性，可直接执行）；若需要 `git reset --hard backup/card-06-b<N>`，先向用户说明并取得授权。
- **dirty worktree 处置**：每批开工前 `git status --porcelain` 必须为空；不为空则停下向用户报告文件清单，不 stash、不自动提交、不丢弃。
- **过渡基线（SD-16）**：Card-03 的 wh-review/runtime/review 修复按 ADR-018 转为正式保留代码，迁移表逐文件登记（SURVIVOR 或 NARROW），不静默留存。
- **执行记录位置**：每批的 G-3 扫描、消费者核对、测试输出、汇报写在 task 目录 `quality/evidence/card06-batches/` 与 `quality/tests/`（新命名），不回写本 spec、Phase 或迁移表冻结行。 上述034三行定点纠正仅是需具体批准的build-plan材料修正，不把后续执行进度写回权威材料。

## 执行纪律（ADR-007、ADR-015、ADR-023）

1. 每批删完即向用户汇报：删了什么、消费者核对结果、测试结果、未验证项。
2. 每个 Phase 代码审查至多 2 轮；超了带 incomplete 停下问。
3. gate 超时以实测为准，首次运行记录耗时再定超时，不预设墙钟。
4. 逐 AC 在 P8/T029 结构化产出（每条 AC 一条记录：命令、exit、原始输出路径、判定）。
5. grep 全仓扫描、跑测试、读多文件对标都派子代理，主会话只收摘要。
6. 上下文压缩后第一时间读 `status` 的 phase_progress 游标和 `phases/index.md`。
7. 带 incomplete 收官必须用户明确拍板。
8. 真实验收、有效 RED、oracle 分离、回读检查四项不降级；任何降级提议直接拒绝并回报。
9. **质量缺项永不构成停止前置**（ADR-023①）：`unknown/unavailable/incomplete` 只记录、只汇报，不自动标 blocked、不空转等用户；goal 续跑不得把"代码完成 + 验收缺证据"留在同一未完成目标里循环；收口停在人工边界，"按计划 close、保留缺口"由用户说出口才算数。
10. **校验器批量报错先怀疑读取器**（ADR-023②）：同类结构错误一次性达数十条时，先查读取器兼容性与格式识别，不得整批计为分析/材料失败。
11. **派发继承最小化 + 回传清单**（ADR-023③）：子代理只带任务必需材料（原文 ref + sha256 + ≤500 字摘要），结论以路径 + exit_code + 清单回传；消息发出后无响应不得空等，按工作类型重派或上报。
12. **每 stage 结尾执行 handoff 技能**（ADR-024）：主会话执行 `skills/stage-handoff` 产出 `quality/evidence/handoff/<stage>.md`（冻结锚点/材料现状/下一步要点，窄工具③写入），供用户向其它会话交接进度；**执行不是门**——缺失只记录汇报（ADR-023①），不阻塞推进。

## 实现设计（全局权威）

> 本节行号基于 main `56c8f267`；Card-03 已进 main（dd27a79a）并于本分支合并（741e1768），行号已漂移——执行时一律以符号定位，行号仅作历史参考。合并核对结果见任务目录 `quality/evidence/card06-merge-check.md`。

### Code Anchors

- **来源边界**：母 PRD 与 decision-log 只作来源映射；逐文件边界只在迁移表。
- **现状与目标差异**：公共入口 `tools/cli/stage-runtime.mjs` `stageRuntimeCliMain`（L2127-2229，公共→私有映射 L2192-2209）经 `runtime/interface/runtime-facade.mjs` `invokeRuntimeCommand` 进入 `stageRuntimeMain`，所有非 doctor/status 入口先过 `assertRuntimeAuthority`（L1501）、`bootstrapStage`（L1571，建 kernel）、`authenticateStageWriteBoundary`（L1743-1755）。目标：七类入口直接调用窄工具，不建 kernel。
- **读取顺序**：先读迁移表当批行 → 当批 Phase 卡 → 卡里列出的符号；不要全仓扫描。
- **代码锚点**：
  - 原子写与锁：`runtime/task/task-handle.mjs` `writeAtomicAt`/`createOnlyAt`/`withRecordLockAt`（L410-472，L26 静态 import kernel）；`runtime/task/task-store.mjs` `atomicWrite`（L64）/`withStoreLock`（L103）/`writeStageRow`（L417-449）；`core/artifact-dir.mjs` `writeAtomic`；`runtime/task/material-workspace.mjs` `replaceMaterialAtomic`
  - 命令采集：`runtime/task/workspace-runner.mjs` `runWorkspaceCommand`/`runCandidateWorkspaceCommand`
  - 工作区核对：`runtime/task/workspace.mjs` `inspectTargetStatus`/`inspectWorktreeCleanup`/`prepareTaskWorkspace`（L425 冲突拒绝）
  - 人为门：`runtime/task/task-kernel-implementation.mjs` `publishHumanConfirmation`、`publishIrreversibleAuthorization`（L1091-1094 stale 绑定）、`consumeIrreversibleAuthorization`（L1110-1160）；消费方 `core/task-close.mjs` `executeClosePlan`（close.execution.lock L1371/L1599/L2975/L3389）、`skills/mini-task/scripts/mini-task-runner.mjs`（L759）
  - 审查：`runtime/review/review-record-route.mjs` `recordSimpleReviewRequest`（retry 剥离 L1419-1423、attempt 复用 L684-709、缺配置 L1635-1647）；`runtime/review/ocr-delegation-adapter.mjs`（规则 L188-218、未装 L257-264、`runConfiguredOcrHostReview` L1392）；`tools/cli/stage-runtime.mjs` `ocrReviewInstructionsFor`（L485-499）、`projectOcrCodeReviewBundle` 过滤（L544-545）、`prepareTaskBoundBuildCodeReviewBundle`（L600-614）、runRound 选择（L1941-1956）、doctor（L1757-1768）
  - 游标：`tools/cli/stage-runtime.mjs` `derivePhaseProgressStatus`（L1014-1028）、`writeBuildCodePhaseProgressCursor`（L1072-1129）
  - hash 双层：`skills/catalog.yaml` `local_bundle_hash`（43 条）、各 `skills/*/skill-bundle.json` sha256（86 条）、`runtime/evidence/check-skill-closure.mjs`
- **运行条件**：Node ≥24；worktree 需先 `npm ci`（使用已提交的 `package-lock.json`，版本锁定）；OCR 可选（`npm i -g @alibaba-group/open-code-review@1.12.9`）；Card-03 已合并进 main 并合入本分支。

### Interfaces and Failure Semantics

- **选择的架构方案**：reuse 函数体 + 新建单文件窄工具（narrow extension），不新建机制。放弃：新目录 `tools/narrow/`（ADR-003 已拒）、把窄工具融入 skills（ADR-003 已拒）、一次性大删除（ADR-004 已拒）。
- **模块职责**：
  - `safe-write.mjs`（③）：`writeFileAtomic(root, relPath, bytes)`、`createFileOnce(root, relPath, bytes)`（同字节幂等、异字节 `RECORD_CONFLICT`）、`appendRecord(dir, slug, ext, bytes)`（分配 `YYYY-MM-DD-NNN-<slug>.<ext>`，EEXIST 则序号+1）；拒绝路径逃逸、symlink 目标、祖先目录替换（O_NOFOLLOW + dev/ino 复核）。
  - `record-lock.mjs`（⑤，OPEN-005 定死为记录锁）：`withLock(dir, name, fn, {waitMs})`；O_EXCL 锁文件写 pid/host/started_at/nonce；同机死进程锁可回收；活锁超时 exit 75 并报持有者。
  - `workspace-check.mjs`（①）：`inspectWorkspace({root, target, baseline, expectBranch})` → registered、branch、head、dirty 计数、changed_paths；`assertCleanTarget`；冲突拒绝不自动修复。
  - `run-command.mjs`（②）：`captureCommand({cwd, recordDir, slug, argv|shell, timeoutMs})` → 真实 exit、stdout/stderr 原样落盘（新命名）、超时杀进程组 exit 124、输出上限 8 MiB 截断并标记。
  - `git-authorize.mjs`（④，ADR-020）：`record({operation, confirmationRef})` 写 branch+HEAD；`consume({operation, stepId})`：未授权 → `IRREVERSIBLE_AUTHORIZATION_REQUIRED`；HEAD 变化 → `AUTHORIZATION_HEAD_MISMATCH`；同 step 重试返回同一消费记录；另一 step → 拒绝；只接受 commit/push/merge/archive/cleanup。
  - `human-confirm.mjs`：`recordConfirmation({stage, decision, reply, materialRefs})`，用 ③⑤ 写入，不绑定 material_revision/snapshot_tree。
- **接口与数据流**：公共入口 → runtime-facade 名单 → 窄工具函数 → task 目录记录文件（纯文本路径互引）。审查：`review --action=record` → OCR 可用？是：OCR 委托（审查包含合同）；否（未安装）：wh-review 同审查面 + `fallback` 记录；文档面：wh-review。
- **失败语义**：所有窄工具失败返回非零 exit 与稳定错误码，不吞错；缺失事实保持 unknown/unavailable；OCR 已安装但失败 → unavailable，不回退；G-3 新发现 → 停下。
- **新增控制面**：
  - 窄工具 6 个文件：consumer=七类公共入口、task-close、mini-task、审查链；owner=runtime/interface；测试=tests/contract/narrow-tool-*.test.mjs；删除条件=被经审查的替代实现取代。替代关系：取代 kernel 内人为门与散落的原子写/锁/采集实现（旧实现随 P5 删除，不双写）。
  - 审查记录 `fallback` 字段：consumer=verify-code 与用户读回；owner=runtime/review；删除条件=OCR 成为仓库内依赖或回退被经审查的替代机制取代。
  - 迁移台账测试与残留扫描测试：consumer=本卡 build-code/verify-code；owner=本卡；删除条件=本卡 close 后，残留扫描只保留"生产代码不 import 已删模块"一组作为回归，其余删除。

### 全局文件边界与依赖

- **NEW / MODIFY / DELETE**：唯一权威为 `attachments/migration-table.md`，每个路径一行、一个批次（=唯一 owner Phase）；唯一的同文件串行 MODIFY 例外仅为下述已获023具体用户批准的 move-map 六工具登记与后续迁移更新（批准原件与范围见下述），迁移主表仍保留该路径一行。build-plan 新增并冻结的 oracle 测试：`tests/contract/narrow-tool-*.test.mjs`（6 个）、`tests/contract/narrow-tools-isolation.test.mjs`、`tests/contract/card06-migration-ledger.test.mjs`、`tests/contract/thin-core-residue.test.mjs`、`tests/contract/ocr-review-contract-bundle.test.mjs`、`tests/contract/code-review-ocr-fallback.test.mjs`。
- **DO NOT TOUCH**：`specs/workflowhub-thin-core-rebuild-planning-20260919/**`（母材料）、`specs/archive/**`、`docs/research/**`、`docs/adr/**` 既有文件正文、外置任务存储中任何已有任务目录与记录、本卡 `decision-log.md`（只允许 make-decision 增量）、迁移表冻结行（除已获034具体批准后的三行定点纠正，以及动议053获得绑定六项候选的真实具体批准后才允许的MT-1-031、MT-3-084/086/088/094/091六行限定修正及对应计数；053当前未批准，尚不生效）、上述 build-plan 预写测试的断言（改动须走 test change request + 独立审查）。
- **全局依赖**：P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8，严格串行（ADR-004）。串行原因：先立新后拆旧；P5 前人为门与审查链必须已有替代；P6 的 hash 字段删除依赖 P5 已删除 closure 以外的全部消费者；P8 文档依赖前面批次删除了守护文档文本的测试。
- **文件归属**：迁移表批次列唯一；多批次都需要改的共享文件按"最早一次改完、会打断存活消费者则推后"合并到一个批次（迁移表备注写合并原因）。上述合并原则仅对下述已获023具体用户批准的 move-map 元数据限定例外作唯一豁免（批准原件与范围见下述）；除此以外不得跨 Phase 分拆同路径修改。合并过程中的 14 条判据见迁移表 `#3-聚合裁定`（A-1～A-14）。
- **既有创建/删除交接例外**：开工横幅 `CARD-06-IN-PROGRESS.md` 由 P1 创建（迁移表 MT-7-114，owner=P1），P8/T027 执行其声明的收口删除。为避免同一路径出现两个 Phase owner，它只登记在 P1 写集；这是本卡唯一一处"创建 Phase 与删除 Phase 不同"的路径，已在迁移表 A-14 登记。
- **新增元数据串行修改例外（023具体批准已记录）**：仅 `docs/architecture/move-map.json`，P1/T008 在既有 `entries` 预登记六个 `runtime/interface/{safe-write,record-lock,workspace-check,run-command,git-authorize,human-confirm}.mjs` 的职责、owner、真实当前消费者、替代/删除条件；当前首次实施已先创建，首次只能如实补登记，不能回填事前事实。P7/T026 在 P1～P6 完成后更新迁移完成的真实职责/消费者，保留并复用六条 P1 登记，不丢弃或重复登记。仅此元数据文件分别列入 P1/P7 写集、严格串行，不并行双写；主表 MT-5-048 的 B6/P7 主迁移 owner 与路径唯一性不变，其余路径仍按单 owner 合并原则。迁移表 §9 的 `MT-7-A001` 明确对原 A-2 及全局共享文件规则的限定修正；它不新增生产接口、registry、schema、对象或命令。本例外的具体批准已由唯一原件 `quality/confirmations/2026-10-01-001-build-code-accepted.json` 证明（SHA256 `ea10e39dc293431bc838842decf75a69c3c12236da06b9d56f06c2fc8134357a`），HEAD `ec9dec41caaee0d5d45e073f585ec7e3b45feb5e`，material_refs 绑定 `2026-10-02-023-p1-registration-and-raw-path-final-candidate.md` 与同stem patch。021是方案设计来源，023是实际批准/应用字节；此例外现已生效，仅限已批准范围，不将该授权解释成正式stage或整体质量接受。
- **回滚与恢复**：见"迁移契约"。

### Requirement-to-Task Trace

| source / decision (decision-log ID/location; upstream ref if applicable) | original behavior/strength | FR / AC | Phase / task | positive + negative oracle / evidence | dependency / status |
| --- | --- | --- | --- | --- | --- |
| R-003、V-002、ADR-001、PFACT-007 | build-code 前 Card-03 合并且带 26786b61 | FR-52 / AC-53 | P1/T001 | ORACLE-B0-PRECONDITION：26786b61 是 HEAD 祖先；未合并时非零 | none |
| R-001、CARD-06 FR-28、ADR-003 | ③ 原子写 + create-only + 普通命名 | FR-28、FR-THIN-003 / AC-28、AC-THIN-003 | P1/T002 | ORACLE-NT-SAFE-WRITE：覆盖/逃逸/symlink 被拒 | T001 |
| R-001、CARD-06 FR-28、OPEN-005 | ⑤ 记录锁互斥与陈旧锁回收 | FR-28 / AC-28 | P1/T003 | ORACLE-NT-RECORD-LOCK：双进程不同时进入 | T002 |
| R-001、CARD-06 FR-28 | ① 工作区/范围核对 | FR-28 / AC-28 | P1/T004 | ORACLE-NT-WORKSPACE：错分支/脏目标被报 | T001 |
| R-001、CARD-06 FR-28 | ② 真实 exit/output | FR-28、FR-THIN-003 / AC-28、AC-THIN-003 | P1/T005 | ORACLE-NT-RUN-COMMAND：exit 不被吞、超时杀进程组 | T002 |
| R-013、V-018、ADR-020 | ④ 授权核对 HEAD、一次性消费 | FR-28、FR-31 / AC-28、AC-31 | P1/T006 | ORACLE-NT-GIT-AUTH：HEAD 变化拒绝、两 step 不可共用 | T002、T003 |
| R-001、ADR-017 人为门① | 人确认记录不绑 revision | FR-28、FR-THIN-003 / AC-28、AC-THIN-003 | P1/T007 | ORACLE-NT-CONFIRM：逐字保存、并发不丢 | T002、T003 |
| R-001、CARD-06 AC-28 | 无 kernel 隔离 5/5 | FR-28 / AC-28 | P1/T008 | ORACLE-NT-ISOLATION：反证对照必须报 ERR_MODULE_NOT_FOUND | T002～T007 |
| R-001、CARD-06 FR-27/FR-51 | 只保护流程形状的测试删除、台账核对 | FR-27、FR-51 / AC-27、AC-52 | P2/T009 | ORACLE-LEDGER-B1：B1 DELETE 路径不存在、四要素齐 | P1 |
| R-001、AGENTS 测试硬规则 | 测试入口收敛、无全量聚合 | FR-27 / AC-27 | P2/T010 | ORACLE-RESIDUE-B1：package.json 无全量聚合 | T009 |
| R-001、CARD-06 FR-52 | 回退演练一次 | FR-52 / AC-53 | P2/T011 | ORACLE-ROLLBACK-DRILL：revert 后 B1 文件恢复 | T009 |
| R-001、OI-007、ADR-004 批次 2 | 工作流去步数锁/哈希/认证 | FR-29、FR-32 / AC-29、AC-32 | P3/T012 | ORACLE-RESIDUE-B2：steps/skill-deps 无 hash/认证目标 | P2 |
| R-001、V-006、ADR-002 | pre 专用 build-spec 与 _spike 退役 | FR-THIN-004、FR-27 / AC-THIN-004、AC-27 | P3/T013 | ORACLE-LEDGER-B2：build-spec 不存在 | T012 |
| R-001、R2 风险、ADR-004 批次 3 | 技能正文不再要求 run/receipts/hash | FR-29、FR-27 / AC-29、AC-27 | P4/T014 | ORACLE-RESIDUE-B3：SKILL.md 无认证要求 | P3 |
| R-013、V-016、ADR-018 | wh-review 按分工瘦身，不换名搬家 | FR-32、FR-27 / AC-32、AC-27 | P4/T015 | ORACLE-LEDGER-B3：只删登记的孤儿/重复文件 | T014 |
| R-001、CARD-06 FR-30、ADR-017、ADR-006 | 删引擎前损失清单经用户过目 | FR-30、FR-31、FR-THIN-006 / AC-30、AC-31、AC-THIN-006 | P5/T016 | ORACLE-LOSS-ACK：四项齐且有确认记录路径 | P4 |
| R-001、CARD-06 FR-29、ADR-003 | 公共入口改接窄工具（切换点） | FR-29、FR-28 / AC-29、AC-28 | P5/T017 | ORACLE-RESIDUE-B4-ENTRY：入口不 import kernel | T016 |
| R-013、V-018、ADR-020 | close/mini-task 改接 ①④⑤，安全检查语义保留 | FR-28、FR-31 / AC-28、AC-31 | P5/T018 | ORACLE-RESIDUE-B4-CLOSE：close 不 import kernel、授权走 ④ | T017 |
| R-001、OI-013、ADR-016 | 审查链剥离哈希身份机器、审查记录新命名 | FR-29、FR-THIN-003、FR-THIN-006 / AC-29、AC-THIN-003、AC-THIN-006 | P5/T019 | ORACLE-RESIDUE-B4-REVIEW：审查模块无材料身份哈希 | T017 |
| R-013、V-020、ADR-021 | OCR 审查包含合同 | FR-THIN-001、FR-32 / AC-THIN-001、AC-32 | P5/T020 | ORACLE-OCR-CONTRACT：包内含四类合同正文 | T019 |
| R-013、V-021、ADR-021 | 检测 OCR、未装回退 wh-review、已装失败不回退 | FR-THIN-002、FR-32 / AC-THIN-002、AC-32 | P5/T021 | ORACLE-OCR-FALLBACK：两条路径分别成立 | T020 |
| R-001、OI-013、ADR-016 | 接续记录收窄、游标新鲜度改用 Git | FR-THIN-003、FR-THIN-006、FR-29 / AC-THIN-003、AC-THIN-006、AC-29 | P5/T022 | ORACLE-RESIDUE-B4-CURSOR：游标 stale 判定不用内容哈希 | T017 |
| R-001、CARD-06 FR-27/FR-29 | 删除机制核心及随附测试 | FR-27、FR-29 / AC-27、AC-29 | P5/T023 | ORACLE-LEDGER-B4：B4 DELETE 路径不存在、无 import 残留 | T018～T022 |
| R-001、ADR-013 | 双层 hash 随校验机器删，先拆消费者 | FR-27、FR-29 / AC-27、AC-29 | P6/T024 | ORACLE-RESIDUE-B5-HASH：catalog/bundle 无 hash 字段 | P5 |
| R-001、ADR-004 批次 5 | 旧 CLI、schema、诊断工具删除 | FR-27 / AC-27 | P6/T025 | ORACLE-LEDGER-B5：B5 DELETE 路径不存在 | T024 |
| R-001、ADR-003、OI-006 | runtime 瘦身归位、move-map 重写 | FR-27、FR-THIN-006 / AC-27、AC-THIN-006 | P7/T026 | ORACLE-LEDGER-B6：move-map 覆盖全部存活生产文件 | P6 |
| R-001、ADR-010、ADR-004 批次 7 | 治理文档改写、横幅删除、修宪 | FR-THIN-005 / AC-THIN-005 | P8/T027 | ORACLE-RESIDUE-B7：文档无旧机制现行描述、横幅不存在 | P7 |
| R-001、V-009、ADR-012 | pre 历史只读归档 README | FR-THIN-004 / AC-THIN-004 | P8/T028 | ORACLE-PRE-ARCHIVE：README 清单与存储一致、目录未改 | T027 |
| R-001、CARD-06 AC-27～32/52/53 | 逐 AC 最终聚合与自举读回 | FR-27、FR-28、FR-29、FR-30、FR-31、FR-32、FR-51、FR-52、FR-THIN-001、FR-THIN-002、FR-THIN-003、FR-THIN-004、FR-THIN-005、FR-THIN-006 / AC-27、AC-28、AC-29、AC-30、AC-31、AC-32、AC-52、AC-53、AC-THIN-001、AC-THIN-002、AC-THIN-003、AC-THIN-004、AC-THIN-005、AC-THIN-006 | P8/T029 | ORACLE-FINAL-AGGREGATE：每条 AC 一条记录，失败如实保留 | T028 |

### Global Verification Strategy

- **验证策略**：三类测试。①行为测试：窄工具、OCR 合同、OCR 回退（backend-testing，feature tier，本地临时 git 仓库夹具，无网络）。②台账测试 `tests/contract/card06-migration-ledger.test.mjs`：解析迁移表，断言七类面齐、每行四要素齐、路径唯一、批次合法、冻结提交存在且为首个删除提交的祖先；对 `批次 ≤ 当前批次` 的 DELETE 行断言路径已不存在、仓库内无对其路径/模块名的引用（排除 archive/research/历史只读区）。③残留扫描 `tests/contract/thin-core-residue.test.mjs`：按批次分组的换名复活与调用点扫描（被删模块 import、`receipts.`、`run --action=` 认证要求、`<sha256>.json` 新写入、`snapshot_tree`/`material_revision` 标识、catalog/bundle hash 字段、横幅文件）。②③批次判定用本地标签推导（不新增控制面）：测试读取 `git tag -l 'backup/card-06-b*'`，取存在的最大 N 作为当前批次；断言只覆盖批次 ≤ N 的行与文件，未打任何标签时按批次 0 处理（新建 clone 场景）。某批的 RED 是该批断言失败，GREEN 是该批完成后同命令 exit 0。
- **RED/GREEN 设计**：build-plan 在用户确认初稿后写入并实跑以上测试，保存真实 RED；build-code 只改实现使同命令 GREEN，不改断言。命令示例：`npx --no-install vitest run tests/contract/card06-migration-ledger.test.mjs --reporter=dot`。
- **最终聚合**：P8/T029 逐 AC 执行各自 gate 并读回原始输出，写一条逐 AC 记录；AC-29 另由本卡 P6～P8 build-code 与 verify-code 在无 kernel 下实跑作为自举证据。
- **不能证明的内容**：静态扫描不能证明动态拼接的 import 不存在（research 01 §8），由 AC-29 自举实跑补足；OCR 回退测试用假 `ocr` 与桩 provider，不证明真实审查质量；G-3 预处置的正确性依赖用户确认。

## Appendix A — 验收判据（唯一权威）

- [ ] **AC-27 — 删除清单逐项执行**
  - **需求**：FR-27
  - **验证方法**：每批后跑台账测试与残留扫描（当前批次由 backup 标签推导）；每批执行记录含消费者 grep 反查。
  - **通过条件**：每个 DELETE/NARROW 行有"文件→消费者→处置"执行记录，消费者核对 100%；无换名残留。
  - **失败条件**：任一被删职责以新名字重新出现且消费者未变。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-28 — 窄工具独立可用**
  - **需求**：FR-28
  - **验证方法**：隔离测试：临时目录只拷 `runtime/interface/` 窄工具文件，不拷 node_modules，逐项调用。
  - **通过条件**：5/5 返回真实结果；反证对照报 `ERR_MODULE_NOT_FOUND`。
  - **失败条件**：任一工具必须经 kernel 才能工作，或反证对照不报错。
  - **证据类型**：`test`
- [ ] **AC-29 — 日常路径无 kernel**
  - **需求**：FR-29
  - **验证方法**：残留扫描 B4～B5 组 + 本卡 P6～P8 build-code 与 verify-code 在无 kernel 下实跑。
  - **通过条件**：存活生产代码与方法文本零 kernel/fact graph 调用点、零校验机器前置；自举全程无阻断。
  - **失败条件**：任一环节因 kernel 缺失而阻断，或被任一校验机器卡住。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-30 — 损失清单书面承认**
  - **需求**：FR-30
  - **验证方法**：P5 第一个删除提交前核对 `attachments/loss-acknowledgement.md` 与用户确认记录。
  - **通过条件**：SD-12 四项逐项承认且注明缓解；用户确认记录早于 P5 首个删除提交。
  - **失败条件**：未承认即删，或清单缺项。
  - **证据类型**：`evidence` + `manual`
- [ ] **AC-31 — G-3 安全闸**
  - **需求**：FR-31
  - **验证方法**：核对每批 G-3 扫描记录；核对真实触发时的停下回报（build-plan 已有一次：授权绑定 → V-018）。
  - **通过条件**：每批有扫描记录；每次触发都有停下、回报、用户决定三段记录。
  - **失败条件**：自行保留并静默回写，或触发后继续删除。
  - **证据类型**：`evidence`
- [ ] **AC-32 — 审查链按分工（本卡修订）**
  - **需求**：FR-32
  - **验证方法**：残留扫描审查组 + OCR 回退测试 + 三审查点各一次真实记录读回。
  - **通过条件**：文档面记录显示 wh-review 执行；代码面记录显示 OCR 执行，或在"OCR 未安装"时 wh-review 执行且带 fallback 记录；三审查点均有记录；无旧执行流程换名搬进 Skill。
  - **失败条件**：代码面在 OCR 已安装时调用 wh-review；回退无记录；任一审查点丢失；旧流程换名复活。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-52 — 迁移表七类面**
  - **需求**：FR-51
  - **验证方法**：台账测试结构断言 + 冻结提交与首删提交的 Git 祖先关系。
  - **通过条件**：七类面齐；每行四要素齐；首删晚于冻结。
  - **失败条件**：任一面缺失、任一行缺要素，或未冻结即删。
  - **证据类型**：`test`
- [ ] **AC-53 — 快照与回退**
  - **需求**：FR-52
  - **验证方法**：`git tag -l 'backup/card-06-b*'` 与各批首个提交的祖先关系；回退演练记录；每批 dirty 检查记录；过渡基线条目。
  - **通过条件**：8 个标签齐且各早于当批首个改动；演练一次成功；dirty 检查每批有记录；SD-16 条目逐文件有处置。
  - **失败条件**：无快照即删、切换点缺失、dirty 被静默处置、过渡基线静默留存。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-THIN-001 — OCR 审查包含合同**
  - **需求**：FR-THIN-001
  - **验证方法**：构造 build-code phase 与 verify-code 终末两种审查包并读取内容。
  - **通过条件**：两种包都含对应阶段合同、provider 协议、审查重点与 lens 正文。
  - **失败条件**：任一被过滤，或只剩通用短指令。
  - **证据类型**：`test`
- [ ] **AC-THIN-002 — OCR 检测与回退**
  - **需求**：FR-THIN-002
  - **验证方法**：三种夹具：无 `ocr`、低版本 `ocr`、已装但退出 1 的假 `ocr`。
  - **通过条件**：前两种 doctor 报 not_installed 且审查由 wh-review 执行并带 fallback 记录；第三种不回退、记 unavailable；依赖真实 OCR 的测试在未装时显示 skipped。
  - **失败条件**：未装时无代码审查执行者；已装失败时静默回退；回退无记录。
  - **证据类型**：`test`
- [ ] **AC-THIN-003 — 记录层新形态**
  - **需求**：FR-THIN-003
  - **验证方法**：窄工具测试断言新文件名；残留扫描断言存活写入者不再生成内容寻址文件名。
  - **通过条件**：新写入均为 `YYYY-MM-DD-NNN-<slug>.<ext>`，重复写入不覆盖，引用为纯文本路径。
  - **失败条件**：新写入出现 `<sha256>` 或 hash 型 uuid 文件名，或发生覆盖。
  - **证据类型**：`test`
- [ ] **AC-THIN-004 — pre 退役与只读归档**
  - **需求**：FR-THIN-004
  - **验证方法**：残留扫描 cohort 分支；核对外置存储根 README 与实际目录。
  - **通过条件**：仓库无 pre 可执行分支；README 列出 124 项且与存储一致；任务目录字节未改。
  - **失败条件**：pre 仍可执行、归档对象被删/移动/改写、README 清单缺项。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-THIN-005 — 治理文档同步**
  - **需求**：FR-THIN-005
  - **验证方法**：残留扫描 B7 组 + `node tools/cli/verify-structure.mjs`。
  - **通过条件**：治理文档描述薄核心现状；宪法修订符合其同步规则；横幅已删；verify-structure exit 0。
  - **失败条件**：文档仍把已删机制写成现行要求，或横幅残留。
  - **证据类型**：`test`
- [ ] **AC-THIN-006 — 幸存者保护**
  - **需求**：FR-THIN-006
  - **验证方法**：台账测试核对幸存者行路径仍存在；Card-09 基线文件存在且早于 P5 首删。
  - **通过条件**：三审查点实现、Card-08 回读候选均存在且其定向测试 exit 0；写入量基线已采集。
  - **失败条件**：任一幸存者被删，或基线缺失。
  - **证据类型**：`test` + `evidence`

## 12. 风险、未决与交接

- **RISK-06**：删除面误删流程产物（ADR-024 红线复审）
  - **受影响 ID**：FR-27、FR-29、FR-32
  - **触发条件**：build-plan 复审（2026-10-01，用户指正触发）
  - **后果**：用户仍在用的技能/文档被一并删除
  - **缓解或 STOP**：红线=「人仍在使用的流程产物不得因机器绑定被一并删除」；复审结论：handoff 已改保留（ADR-024）；requirement-lineage 经用户确认删除（ADR-025）；397 DELETE 分类无其它误删
  - **处理 Stage**：build-plan（已完成）
  - **验证**：ADR-024/025 + 迁移表批次列

- **RISK-01**：G-3 候选 25 项超过 16 项推翻阈值
  - **受影响 ID**：PFACT-006、FR-31、AC-31
  - **触发条件**：已触发（build-plan 汇总）
  - **后果**：批次中途频繁停下
  - **缓解或 STOP**：迁移表逐项登记候选、预处置建议与批次；按 ADR-022 由**后续独立审查**逐项裁定，不在 build-plan 定死；批次计划不变，批次内 G-3 扫描收窄为"未预处置的新发现"
  - **处理 Stage**：独立审查（build-plan 之后的合并审查）
  - **验证**：迁移表 G-3 节 + 审查裁定记录
- **RISK-02**：审查链内的哈希身份机器与 ADR-014/019 必留审查点缠在同一文件
  - **受影响 ID**：FR-32、FR-29、AC-32、AC-29
  - **触发条件**：P5/T019 剥离
  - **后果**：剥离不当会打断三审查点
  - **缓解或 STOP**：剥离后先跑审查定向测试与一次真实 phase 审查，再进入 T023
  - **处理 Stage**：`build-code`
  - **验证**：ORACLE-RESIDUE-B4-REVIEW + 真实审查记录
- **RISK-03**：Card-03 合并后行号与内容漂移
  - **受影响 ID**：PFACT-007、FR-52
  - **触发条件**：P1/T001 合入 main
  - **后果**：迁移表 card03 行需复核
  - **缓解或 STOP**：T001 复核 card03=是 的行，差异 append-only 补记并汇报
  - **处理 Stage**：`build-code`
  - **验证**：补记行 + 汇报记录
- **RISK-04**：OI-006"runtime/interface 以外分区清空"与 runtime/review 必留冲突
  - **受影响 ID**：FR-28、FR-32
  - **触发条件**：P7 瘦身
  - **后果**：字面不符
  - **缓解或 STOP**：保留 `runtime/review/`（Card-05 owner），在 move-map 登记理由；已在本次汇报中向用户说明
  - **处理 Stage**：`build-plan`
  - **验证**：用户确认
- **RISK-05**：P5 规模大（切换点、审查剥离、记录层、删除核心在同一批）
  - **受影响 ID**：FR-27、FR-29
  - **触发条件**：P5 执行
  - **后果**：审查轮次与回退成本高
  - **缓解或 STOP**：P5 内按 T016→T023 分提交；每个 Task 后跑定向测试；T023 前任何失败都可只回退当 Task
  - **处理 Stage**：`build-code`
  - **验证**：每 Task 测试记录

- **OPEN-01**：G-3 预处置 25 项逐项裁定
  - **受影响 ID**：FR-31
  - **owner**：独立审查（findings 由用户处置）
  - **影响**：未裁定的项在触发时对应批次停下
  - **处理 Stage**：build-plan 之后的合并审查
  - **关闭条件或 STOP**：审查逐项给出裁定并记录（ADR-022）
- **OPEN-03**：宪法条款修订（G3-20）
  - **受影响 ID**：FR-THIN-005
  - **owner**：build-code（B7/P8 执行）
  - **影响**：不修订则 CONSTITUTION 与 OI-013 冲突
  - **处理 Stage**：`build-code`（P8/T027）
  - **关闭条件或 STOP**：已获用户授权（ADR-022），按宪法同步规则修订并留下版本记录
- **OPEN-02**：make-decision 两条审查（DIR-001/DTL-001）补跑
  - **受影响 ID**：无（make-decision 质量事实）
  - **owner**：原 make-decision 会话
  - **影响**：make-decision 完成判据仍 incomplete
  - **处理 Stage**：`make-decision`
  - **关闭条件或 STOP**：Card-03 合并后各补跑一次

## 13. 业务影响与回归范围

### 日常阶段流程

- **既有行为**：每阶段经 official stage run 发布、认证、反思、handoff
- **本需求影响**：阶段只按 SKILL.md 方法执行；确认与授权是仅有的门；审查三点照常；handoff 技能每 stage 结尾执行、产出交接 md（ADR-024，非门）
- **回归路径**：本卡 P6～P8 build-code 与 verify-code 自举
- **验收**：AC-29、AC-32

- **可能受冲击的业务规则**：不可逆 Git 动作必须先授权；代码审查必须有执行者；真实测试失败不能写成完成
- **明确无影响**：UI、母 PRD、兄弟卡材料、历史记录内容
