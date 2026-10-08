# 功能规格：审查效率与失败可见性（workflowhub-review-efficiency-20261007）

- **功能名**：审查只作异源静态建议，失败必须看得见、成本可复算
- **来源**：`decision-log.md`（S 根；1,997 行 / 119,015 B / sha256 c1803e0e…；ADR-001…ADR-074，`## 验收面` A-01…A-14）；骨架件与澄清定案 C1…C28 见任务库根 `quality/evidence/research/2026-10-07-001-b5-build-plan-skeleton.md`（sha256 d506ffdd…）
- **状态**：草稿（一次 build-plan 审查已执行，发现已处置；当前计划待用户确认；修复后未重审）

基准目录（本文所有路径锚点按此解释，ADR-074）：

- 认证 worktree 根 W＝`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-review-efficiency-20261007`（HEAD `4dd348dc`，即 task.json `baseline_commit`）。无前缀的仓库路径以 W 为根。
- 任务库根 T＝`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007`。以 `quality/` 开头的路径以 T 为根；命令里写作 `$T`。
- 材料目录 S＝W 根 `specs/workflowhub-review-efficiency-20261007/`。

## 速读卡（30 秒）

- **一句话需求**：主会话跑 wh-review / OCR 审查时，provider 拒审、卡住、没输出都要记成具体失败事实，每条审查记录自带可复算的成本与覆盖事实，模板照抄不再被校验器拒。
- **核心改动点**：
  - 解析不再接受散文里夹的 JSON；可解析才计完成；上限 16 MiB（P1、P8）。
  - antigravity 有流式进展信号，5 个检查间隔无进展判 `PROCESS_STALLED` 终态失败（P3）。
  - 审查记录顶层带 `review_facts`、`material_coverage`、`usage_status`，0 字节输出不落盘（P1、P7、P8）。
  - 删零消费者代码、墙钟超时环境变量与 600 秒补充窗口；packet 按 `ttl_hours` 清理（P2、P4、P8）。
  - 四个文档模板改成标杆形状与真值示例（P5、P6）。
- **最大影响面**：wh-review runner、third-review 健康监控、审查记录 schema、task-store 游标。
- **验收信号**：每个 Task 的 oracle 由 RED（exit 1）转 GREEN（exit 0）；P10 逐条输出 AC-REV-001…032。

## 来源与决策映射

本表只存 ID 关系；R/U 与 ADR 的权威对应在 decision-log `## 决策→需求回指`。

| 来源 ID | 决定 ID | FR / Task | 状态 |
| --- | --- | --- | --- |
| R-002、R-004 | ADR-030、033、007、031、032、034、038 | FR-REV-001、002 / P1 | current |
| R-001、U-005、R-002、R-004、R-003、R-016 | ADR-008、002、013、010、041、042、028、036 | FR-REV-003…007 / P2 | current；C20 删除范围待用户确认 |
| R-011、R-012、R-001 | ADR-005、006、001、031 | FR-REV-008、009 / P3 | current；A-03 真实轮次合并后取 |
| R-002、R-003、U-005 | ADR-016、037、021、023、029 | FR-REV-010…012 / P4 | current |
| R-018、R-009、R-006、R-007 | ADR-014(1、3–6)、015、049–060、069–074 | FR-REV-013…015 / P5、P6 | current |
| R-004、R-013、R-015、U-003 | ADR-039、024、035、022、032、034 | FR-REV-016、017 / P7 | current |
| R-002、R-012、U-001、R-014、U-004、R-011 | ADR-012、030、009、026、005、025、038 | FR-REV-018…020 / P8 | current |
| R-013、U-002、R-015、U-003、R-003 | ADR-018、020、004、025 | FR-REV-021、022 / P9 | current |
| R-005、R-010、R-015、R-017 | ADR-003、019、039、040、043–048、061–068 | FR-REV-023 / P10 | current；MOD-7 只作执行纪律 |
| R-008 | 无 ADR 落点（原表 R-008 行：「不另立 ADR：覆盖矩阵即本件两表」） | 无仓库改动；由 decision-log「需求-决策覆盖矩阵」承接 | current；见下方注 |

R-008 的权威是 decision-log 的「需求-决策覆盖矩阵」，其原始落点即「本件两表」；本任务对它不做仓库改动，故在「需求到任务追踪」里单列一行、不挂 Task（不是遗漏，是不适用）。R-006、R-007 的承载者是 ADR-014、ADR-015（decision-log「原始需求索引」的登记事实：反转「决策→需求回指」表得不到这两条），故并入 P5、P6 行。R-016 的承载者是 ADR-013，故并入 P2 行。

无仓库改动的 ADR（C28）：

| ADR | 处置 | 理由 |
| --- | --- | --- |
| ADR-011 | 无仓库改动 | 引用更正，已在日志内完成 |
| ADR-017 | 无独立改动；作为 P6/T015 保护口径读入 | 按原文匹配是判法，不是代码 |
| ADR-019 | 无仓库改动；登记为已知缺口 | 任务库不是 git 仓库，`quality/**` 永远进不了 worktree diff |
| ADR-021 | 无仓库改动；历史 task.json 只读，登记并入 P4/T011 | 两字段在 runtime/tools/skills/workflows 下 `git grep` 零命中 |
| ADR-027 | 无仓库改动 | 红蓝配对保留两遍，维持现状 |
| ADR-040 | 无仓库改动；P10/T025 判 A-09 引述 | 只约束结论引述口径 |
| ADR-043…048 | 无仓库改动；见「执行纪律」 | 会话与派发纪律 |
| ADR-061…068 | 无仓库改动；P10/T025 对派发原件判 A-10、A-13、A-14 | 派发纪律，ADR-066 登记为不作自动防线 |
| ADR-056、ADR-072 | 明确不做 | 不新增校验器、不做节名封闭 |
| ADR-014 第 2、7、8 项 | 本轮不做（C25） | 不在 `## 要改哪些文件` |

## 1. 需求解释：问题与紧迫性

审查本应是异源静态建议，实测却成了最贵、最不可信的环节：两份真实拒审原件因 `firstJsonCandidate` 在散文里扫到 `{"findings":[]}` 被记为「评审通过、零问题」；antigravity 无活性信号，卡住时整轮墙钟等于最慢 provider；packet 目录只增不减（实测 11G）；`usage` 6/6 为 null 却被读成 0；零消费者的校验与字段让模板照抄就被拒。这些问题让人无法分辨「审过了」与「没审成」，必须先让失败可见、事实可复算，再谈成本。

## 2. 背景、目标与范围

### 背景

审查点 make-decision、build-plan、代码审查保留不动（ADR-002）。文档面走 wh-review → third-review broker，代码面默认 OCR，未安装或版本低于 1.12.9 才回退 wh-review。verify-code 继续审当前最终 worktree（`skills/wh-review/contracts/provider-protocol.md:78-79`）。

### 目标

- provider 未解析出 findings、停滞、0 字节输出时，记录里出现具体失败事实，`status` 不等于 `completed`。
- 每条审查记录带 provider 终态、是否真出意见、送审字节、token 与墙钟、复用命中、覆盖声明；未上报标 `not_reported`，不标 0。
- 墙钟超时与补充窗口不再以休眠形态存在；健康者等到自己的终态，停滞者提前判失败，不补派。
- 四个文档模板本身就是合法实例。

### 范围内

FR-REV-001…023 列出的行为；文件边界见「全局文件边界与依赖」。

## 3. 用户场景与状态覆盖

### SCN-001：provider 拒审只回散文

- **角色**：wh-review runner / OCR 适配器
- **前提**：provider 输出「我没有输出 `{"findings": []}`。没读到」
- **触发**：`parseReviewerOutput` 解析
- **结果**：抛 `OUTPUT_INVALID`，成员 `status:"failed"`、`parse_outcome:"invalid"`，不计完成

### SCN-002：antigravity 卡住

- **角色**：third-review health runner
- **前提**：stream-json 连续 5 个健康检查间隔无新事件
- **触发**：tick
- **结果**：`execute` 返回 `PROCESS_STALLED` 终态失败；健康兄弟成员继续等到终态；不补派

### SCN-003：同材料第二次送审

- **角色**：review-record-route
- **前提**：`quality/reviews/` 已有同 `material_id` 的记录
- **触发**：`recordSimpleReviewRequest`
- **结果**：照常派发，`review_facts.already_reviewed.hit` 为 true 并引用原记录

### SCN-004：route 引用 disabled provider

- **角色**：third-review-host-config
- **前提**：route 中一个 provider `enabled !== true`
- **触发**：选择 provider
- **结果**：该 provider 记 `PROVIDER_DISABLED` 失败并跳过，其余照常；全部不可用时整组失败

### SCN-005：作者照抄模板

- **角色**：build-plan / make-decision 作者
- **前提**：直接复制 spec / phase / prd / decision-log 模板
- **触发**：`validatePostPhaseContract` 读实现设计四小节
- **结果**：不报 `requires concrete`，`[填写：` 计数为 0

### 状态覆盖清单

- [ ] **默认态**：SCN-003
- [ ] **空态**：SCN-001（0 字节输出不落盘，见 FR-REV-016）
- [ ] **错误态**：SCN-001、SCN-004
- [ ] **加载态**：N/A — 无 UI
- [ ] **取消态**：显式取消仍得 `CANCELLED`（P3/T008 guard）
- [ ] **边界态**：16 MiB 上限（FR-REV-001）
- [ ] **权限态**：N/A — 不改认证授权
- [ ] **竞态**：N/A — 不改锁；同文件 Task 串行

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：两份真实拒审原件经 `firstJsonCandidate` 被接受为空 findings。状态 `verified`；来源 B-1、P1 交接知识实跑；关联 FR-REV-001、AC-REV-004。
- **PFACT-002**：`.wh-review-packets` 下 5,591 个目录 + 4 个文件，`du` 11G（2026-10-08 实测，见 P2 可观察接缝；决策日志引 F-003 时为 14 GB）。状态 `verified`；关联 FR-REV-007、AC-REV-019。
- **PFACT-003**：本轮审查记录 `usage=null` 6/6。状态 `verified`；来源 decision-log `## 验收面` 末段；关联 AC-REV-006、AC-REV-009。
- **PFACT-004**：生产 broker 运行主仓 `skills/third-review`，worktree 改动合并前不进真实轮次。状态 `verified`；来源 B-1 G2；关联 AC-REV-003。

## 5. 功能需求

### 解析与计数（REV）

审查结论只能来自可解析的结构化输出；无法解析就是失败事实。

- **FR-REV-001**：`parseReviewerOutput` 只接受整份 JSON、JSONL 行与唯一 fence；散文内联 JSON 与超 16 MiB 输入抛 `OUTPUT_INVALID`。依据 ADR-030、ADR-033、C3、C10；场景 SCN-001；验收 AC-REV-004、AC-REV-015。
- **FR-REV-002**：成员仅在 `status==="completed"` 且 `parse_outcome==="ok"` 时计完成；三份 schema 共用 `$defs.materialCoverage`，登记 `usage_status`、`review_facts`、`parse_outcome`、`process_outcome`。依据 ADR-007、031、032、034、038、C2；验收 AC-REV-005、AC-REV-006。
- **FR-REV-003**：派发人数只由配置 `wh_review.stages.*.initial` 决定；`minimum_reviewers` 与两个零消费者访问器删除。依据 ADR-008、ADR-002；验收 AC-REV-016。
- **FR-REV-004**：删除 `validateDetailReviewInput` 与 `detail-minimum-input.test.mjs`；`make-decision.md` 合同改成人守口径。依据 ADR-013、ADR-010；验收 AC-REV-017。
- **FR-REV-005**：detail 审查 required 只含 `raw_requirement`、`approved_direction`；manifest 文件条目带 `derivation` 声明替换处数、字节差与派生件哈希。依据 ADR-041、ADR-042、C23；验收 AC-REV-008。
- **FR-REV-006**：route 引用未配置 / disabled / 无模型 provider 时记失败并跳过；全被跳过时整组失败。依据 ADR-028、C9；场景 SCN-004；验收 AC-REV-018。
- **FR-REV-007**：按阶段加载配置时，清理 `.wh-review-packets` 直属条目中超过 `ttl_hours` 的条目；`quality/reviews/` 与符号链接不动。依据 ADR-036、C20；验收 AC-REV-019。 本次当前覆盖：当前用户真实选择“禁止加载时自动删除，本轮清理延期（推荐）”（任务库004真实选择与079范围）：本轮不交付自动TTL清理，普通load无删除、无合法consumer的prune不保留；FR007/AC019未达成。原T007 A3/A5/A8目标真fail与原始输出保，其他target/guard/回归与AC018不豁免，不把rawfail转pass。
- **FR-REV-008**：antigravity 走 stream-json；连续 5 个检查间隔无进展判 `PROCESS_STALLED` 终态失败，有进展即清零，总时长无上限。依据 ADR-005、006、C11；场景 SCN-002；验收 AC-REV-003。
- **FR-REV-009**：`provider-protocol.md` 与 third-review `SKILL.md` 写明停滞是终态失败与真实收场机制，不写未实现的 ownerloss guardian。依据 ADR-001、005、006；验收 AC-REV-020。
- **FR-REV-010**：删除零消费者 `readUiApplicabilityFromDecisionLog` 及其 4 个测试。依据 ADR-016；验收 AC-REV-021。
- **FR-REV-011**：本任务退役项写进 move-map 既有条目的 consumer / delete_condition，不新增 status。依据 ADR-037、C21；验收 AC-REV-022。
- **FR-REV-012**：standard-workflow 写明 OCR 版本低于 1.12.9 也回退；wh-review SKILL 写明补派只由人发起。依据 ADR-023、ADR-029；验收 AC-REV-023。
- **FR-REV-013**：decision-log 模板改成标杆形状，顶层节不含四类过程内容。依据 ADR-049…060、069…073；验收 AC-REV-011、AC-REV-012。
- **FR-REV-014**：decision-log SKILL 与 make-decision SKILL / steps.json 只要求模板里有落点的东西。依据 ADR-051、052、054、055、058、070、074；验收 AC-REV-024。
- **FR-REV-015**：phase / spec / prd 三个模板占位改真值，照抄不被拒。依据 ADR-014(1)、015、071；验收 AC-REV-011。
- **FR-REV-016**：每条审查记录带 `review_facts`；`request.material_id` 键必在；复用命中只记事实不拒派；0 字节输出不落盘并记原因。依据 ADR-039、024、035、038、C6、C7、C19；场景 SCN-003；验收 AC-REV-001、AC-REV-025、AC-REV-026。
- **FR-REV-017**：OCR 侧 `read_confirmed` 拿不到证据写 null，usage 键名归一并带 `usage_status`，锚点只按投递相对路径 + 行号判，覆盖声明提到记录顶层。依据 ADR-022、030、032、034、C17；验收 AC-REV-006、AC-REV-027。
- **FR-REV-018**：runner 提示词布局中立；解析失败与无输出成员记失败。依据 ADR-012、022、030、031、C16；验收 AC-REV-002、AC-REV-028。
- **FR-REV-019**：移除 `WH_REVIEW_BROKER_TIMEOUT_MS` 来源与 600 秒补充窗口（client 侧 P8/T021，v3 契约侧 P1/T002）；补充 findings 一律并入。依据 ADR-009、026、C4、C5；验收 AC-REV-029。
- **FR-REV-020**：runner 每成员记 `usage_status` 与原件 `raw_output_ref` + `raw_output_sha256`；健康者等终态，不补派。依据 ADR-005、025、038、C8；验收 AC-REV-030。
- **FR-REV-021**：`phase_progress` 游标覆盖写当前 Phase 一个 `base_head`；材料体积基线经 `STAGE_ROW_KEYS` 记进 facts，只记录不设门。`base_head` 的**唯一消费者＝Phase 代码审查的 diff base**：HEAD 上没有任何代码把 `phase_progress` 当作 diff base（`tools/cli/stage-runtime.mjs:524` 调 `captureSource` 时不带 `baselineCommit`，`skills/wh-review/scripts/review-source.mjs:11` 的 `base` 恒取 `workspace.baselineCommit`），该读取面由 P9/T024 动作 6 在写入集内接线——新增私有 `phaseReviewDiffBase(context, request)` 读 build-code 游标的 `phase_progress`，要求游标存在、`phase_id === request.phase_id`、`base_head` 过既有 `GIT_OID` 校验，三者全满足时把 `base_head` 作 `captureSource` 的 `baselineCommit`（Phase 增量补丁基准），任一不满足即不传该键，由 `base = baselineCommit ?? workspace?.baselineCommit ?? capturedHead` 回落任务基线；不扩写入集到 `review-source.mjs`。依据 ADR-018、ADR-020、C18；验收 AC-REV-007、AC-REV-031。
- **FR-REV-022**：verify-code 只送 `git diff --name-only <baseline_commit>...HEAD` 改动集；stage-runtime 传 `onProviderResult`。依据 ADR-004、ADR-025、C6；验收 AC-REV-032。
- **FR-REV-023**：全任务验收逐条输出 AC-REV-001…032 档位与证据指针，并对 build-code 期间新落盘派发原件判 A-09、A-10、A-13、A-14。依据 ADR-003、019、039、040、061…068；验收 AC-REV-009、AC-REV-010、AC-REV-013、AC-REV-014。

## 10. 明确不做与默认必须成立

### 明确不做

- 继承 decision-log `## 范围与非目标` 已否决 13 项：不加闸门、不加墙钟超时、不加材料字节门、不减 provider、不恢复审查推进门、不自动权威化、不指向目标 worktree、不并行 v4、不动 `docs/standard-workflow.md:19`、不重列已删零消费者节、不靠压缩上下文、不用校验器强制文档形状、不做节名封闭。
- 不改 vendored broker `skills/third-review/lib/broker.mjs`（C12 修订、C16）；不扩 `process_outcome` 枚举。
- 不改 `tools/cli/check-decision-log-chain.mjs`（C15，H7 保持未决）。
- 不做 OCR 代码面健康监控（C1）与通用凭据交付方案（C14）。

### 默认必须成立

- 质量缺失保持 `unknown` / `unavailable` / `incomplete`，不能写成通过（AC-REV-002、AC-REV-006）。
- 不带新键的旧记录仍被 schema 接受（P1/T002 guard）。
- 复用命中仍派发（AC-REV-026）。

## 验收标准

判据唯一权威在本节。`$T`＝任务库根。每条「验证」命令的 oracle 由所属 Phase 写定；GREEN 原件由 build-code 用 `appendRecord` 以 `rev-p<n>-green` 发布到 `quality/tests/`。

- [ ] **AC-REV-001**：（A-01）经 route 写出的审查记录顶层含 provider 终态、是否真出意见、送审字节、token 与墙钟、复用命中。关联 FR-REV-016。
验证：`node "$T/quality/tests/rev-p7-oracle.mjs" --task=T018`
通过：exit 0；`review_facts` 各键存在且过 result schema。
失败：缺任一键或 schema 拒收。
证据：RED `quality/tests/2026-10-07-011-rev-p7-red.log`；GREEN `*-rev-p7-green.log`。
- [ ] **AC-REV-002**：（A-02）provider 未解析出 findings 时记录出现具体失败事实，`status` 不等于 `completed`。关联 FR-REV-018。
验证：`node "$T/quality/tests/rev-p8-oracle.mjs" --task=T020`
通过：exit 0；该成员 `status:"failed"`、`parse_outcome` 为 `invalid` 或 `empty_output`。
失败：成员仍为 `completed` 或无 `error.code`。
证据：RED `quality/tests/2026-10-08-004-rev-p8-red.log`；GREEN `*-rev-p8-green.log`。
- [ ] **AC-REV-003**：（A-03）停滞判 failure 而非静默 running。关联 FR-REV-008。
验证：`node "$T/quality/tests/rev-p3-oracle.mjs" --task=T008`；合并后读真实轮次 `provider_results[].status` 与 `error.code`。
通过：exit 0；成员 `status:"failed"`、`error.code:"PROCESS_STALLED"`；`process_outcome` 保持 broker 既有取值，不作判据。
失败：停滞成员仍 running 或只写诊断。
证据：RED `quality/tests/2026-10-07-015-rev-p3-red.log`；真实轮次证据合并后取，未取得前记 `incomplete` 并列入 P10 的已声明缺口清单（不阻塞门禁，最终对账在 verify-code stage-handoff 一节）。
- [ ] **AC-REV-004**：（A-04）含散文 JSON 的样本不产出「评审通过、零问题」。关联 FR-REV-001。
验证：`node "$T/quality/tests/rev-p1-oracle.mjs" --task=T001`
通过：exit 0；两份真实拒审样本抛 `OUTPUT_INVALID`。
失败：任一样本返回空 findings。
证据：RED `quality/tests/2026-10-07-014-rev-p1-red.log`；GREEN `*-rev-p1-green.log`。
- [ ] **AC-REV-005**：（A-05）覆盖声明字段在记录顶层，每条 provider 一条。关联 FR-REV-002。
验证：`node "$T/quality/tests/rev-p1-oracle.mjs" --task=T002`
通过：exit 0；三份 schema 接受 `material_coverage`，拒收缺 `provider` 的条目。
失败：schema 无该键或形状错误被接受。
证据：同 AC-REV-004 的 P1 原件。
- [ ] **AC-REV-006**：（A-06）未上报用量记为 `not_reported` 而非 0。关联 FR-REV-002、FR-REV-017。
验证：`node "$T/quality/tests/rev-p1-oracle.mjs" --task=T002`；`node "$T/quality/tests/rev-p7-oracle.mjs" --task=T019`
通过：两条 exit 0；kimi 等无 usage 成员 `usage:null`、`usage_status:"not_reported"`。
失败：出现 `usage_status:"zero"` 或 usage 被补 0。
证据：P1、P7 的 RED/GREEN 原件。
- [ ] **AC-REV-007**：（A-07）材料体积基线可从 facts 行复算。关联 FR-REV-021。
验证：`node "$T/quality/tests/rev-p9-oracle.mjs" --task=T023`
通过：exit 0；build-code stage row 写入体积基线字段不再抛 `task row contains unsupported fields`。
失败：写入被拒或字段缺失。
证据：P9 RED/GREEN 原件（`quality/tests/*-rev-p9-*.log`）。
- [ ] **AC-REV-008**：（A-08）送审材料声明替换处数、与原件字节差、派生件哈希。关联 FR-REV-005。
验证：`node "$T/quality/tests/rev-p2-oracle.mjs" --task=T005`
通过：exit 0；manifest 条目带 `derivation` 三键，`material_id` 口径不变。
失败：缺键或 `material_id` 改变。
证据：RED `quality/tests/2026-10-08-003-rev-p2-red.log`；GREEN `*-rev-p2-green.log`。
- [ ] **AC-REV-009**：（A-09）「审查比实现贵」引述同时给出 thread `01a11378` 与 `01a111b6` 两侧数字。关联 FR-REV-023。
验证：`node "$T/quality/tests/rev-acceptance.mjs" --task=T025 --root="$W"`
通过：A-09 在 `rev-acceptance.mjs` 的内置检查里记 `pass`——回写区（`phases/P10.md` 的起止标记块）把两个 thread 并列给出数字，并如实登记实现侧并列事实因 `usage=null` 无法产出的缺口（pass-with-recorded-gap）。不要求实现侧数字本身本轮产出，也不要求全命令 `pass=32`。
失败：只引单侧或合成单一倍数；回写区未填写/未闭合、缺任一侧 thread、或未登记实现侧缺口（记 `incomplete`/`fail`，且因不在已声明缺口清单内而阻塞门禁）。
证据：P10 原件 `quality/tests/*-rev-acceptance-*.log`；回写区在 `phases/P10.md`。
- [ ] **AC-REV-010**：（A-10）build-code 期间新落盘的派发原件改动点可数、锚点唯一。关联 FR-REV-023。
验证：`node "$T/quality/tests/rev-acceptance.mjs" --task=T025 --root="$W"`
通过：exit 0；无「整体重写 / 全文对齐 / 覆盖全部 N 组」，每个锚点 `grep -n` 恰命中 1 处（排除引述行）。
失败：任一原件出现上述字样或锚点 0 / 多处命中。
证据：P10 原件；判定对象为空集时记 `incomplete` 并列入 P10 的已声明缺口清单。当前原通过／失败判法不变；用户真实选择仅允许任务库 `quality/tests/2026-10-08-124-p10-fixed-loss-full-mapping.json` 中本项已发生具名原件的格式损失保留 `fail`，其余工作完成后如实有损收尾（见 P10「有限既发生派发格式损失」）。只对该固定 path/hash/全部违规签名生效，后新增或新增违规不豁免，不转 `pass`／`incomplete`，不免产品测试或逐 Phase 审查，不表示整体通过。 本次另有[006真实两条选择](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007/quality/evidence/human-confirmations/2026-10-08-006-two-historical-format-failures-limited-delivery.json>)明确“允许仅这两条保留失败并如实收口”，仅本项一个不可变原件path/hash/完整signature（见P10追加边界）；旧003/124范围不改、AC013不扩。仅授权历史组织损失保留fail，新classifier另需独立TCR批准/after核，不预报GREEN/Done，不免业务验证或生产风险/close。
- [ ] **AC-REV-011**：（A-11）四个模板照抄不被拒。关联 FR-REV-013、FR-REV-015。
验证：`node "$T/quality/tests/rev-p5-oracle.mjs" --task=T013`；`node "$T/quality/tests/rev-p6-oracle.mjs" --task=T015`（同法 T016、T017）
通过：四条 exit 0；C24 包装式判法下 `requires concrete` 为 0，spec / phase 模板 `[填写：` 为 0。
失败：任一模板报 `requires concrete` 或计数非 0。
证据：RED `quality/tests/2026-10-08-002-rev-p5-red.log`、`quality/tests/2026-10-07-004-rev-p6-red.log`。
- [ ] **AC-REV-012**：（A-12）decision-log 顶层节不含「修改日志 / 参考 / 证据 / 过程记录」四类。关联 FR-REV-013。
验证：`node "$T/quality/tests/rev-p5-oracle.mjs" --task=T013`；P10 对新产出 decision-log 复判。
通过：exit 0；四类只以指针行出现。
失败：任一类成为 H2。
证据：P5 原件；新产出日志的复判归 P10，复判对象未落盘前记 `incomplete` 并列入 P10 的已声明缺口清单。
- [ ] **AC-REV-013**：（A-13）任务书每条路径锚点写明基准目录。关联 FR-REV-023。
验证：`node "$T/quality/tests/rev-acceptance.mjs" --task=T025 --root="$W"`
通过：exit 0；**每一条路径锚点（相对与绝对一律计入，判定规则与 A-10 的锚点集合相同）**同行或紧邻行有「认证 worktree 根」或「任务库根」。
失败：任一锚点未写明。
证据：P10 原件；判定对象为空集时记 `incomplete` 并列入 P10 的已声明缺口清单。当前原通过／失败判法不变；用户真实选择仅允许任务库 `quality/tests/2026-10-08-124-p10-fixed-loss-full-mapping.json` 中本项已发生具名原件的格式损失保留 `fail`，其余工作完成后如实有损收尾（见 P10「有限既发生派发格式损失」）。只对该固定 path/hash/全部违规签名生效，后新增或新增违规不豁免，不转 `pass`／`incomplete`，不免产品测试或逐 Phase 审查，不表示整体通过。
- [ ] **AC-REV-014**：（A-14）研究结论不内联进任务书。关联 FR-REV-023。
验证：`node "$T/quality/tests/rev-acceptance.mjs" --task=T025 --root="$W"`
通过：exit 0；研究结论以 ref + sha256 + ≤500 字摘要出现；摘要字数＝引用研究原件的那一行起、到空行为止的连续段落，去掉反引号路径、≥16 位十六进制串与全部空白后的字符数，500 字通过、501 字失败。
失败：出现整段研究原文（≥15 行连续原文）、引用研究原件但缺 `sha256`，或引述摘要超过 500 字。
证据：P10 原件；判定对象为空集时记 `incomplete` 并列入 P10 的已声明缺口清单。当前原通过／失败判法不变；用户真实选择仅允许任务库 `quality/tests/2026-10-08-124-p10-fixed-loss-full-mapping.json` 中本项已发生具名原件的格式损失保留 `fail`，其余工作完成后如实有损收尾（见 P10「有限既发生派发格式损失」）。只对该固定 path/hash/全部违规签名生效，后新增或新增违规不豁免，不转 `pass`／`incomplete`，不免产品测试或逐 Phase 审查，不表示整体通过。 本次另有[006真实两条选择](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-efficiency-20261007/quality/evidence/human-confirmations/2026-10-08-006-two-historical-format-failures-limited-delivery.json>)明确“允许仅这两条保留失败并如实收口”，仅本项一个不可变原件path/hash/完整signature（见P10追加边界）；旧003/124范围不改、AC013不扩。仅授权历史组织损失保留fail，新classifier另需独立TCR批准/after核，不预报GREEN/Done，不免业务验证或生产风险/close。
- [ ] **AC-REV-015**：解析上限 16 MiB。关联 FR-REV-001。
验证：`node "$T/quality/tests/rev-p1-oracle.mjs" --task=T001`
通过：exit 0；2,010,784 B 合法输出可解析，超限输入抛 `OUTPUT_INVALID`。
失败：上限仍为 128 KiB 或超限被接受。
证据：P1 原件。
- [ ] **AC-REV-016**：`minimum_reviewers` 与零消费者访问器的生产、配置、调用与导出残余为零；保持全仓原扫描范围及排除集，只允许两处指定人读退役说明保留原名。关联 FR-REV-003。
验证：`node "$T/quality/tests/rev-p2-oracle.mjs" --task=T003`
通过：exit 0；真实矩阵仍过 schema；原全仓命中仅可位于 `docs/architecture/move-map.json` 中 owner 为 `B4/P5 / MT-1-052`、destination 为 `runtime/review/review-policy.mjs`，或 owner 为 `B4/P5 / MT-3-087`、destination 为 `skills/wh-review/scripts/review-materials.mjs` 两个指定条目的 `delete_condition` 字段内，且仅在精确人读段「退役登记（ADR-008）：minimumReviewersFor 已删，派发人数唯一由宿主配置 wh_review.stages.*.initial 决定」中的原名。实际两处只在该字段，不将 `consumer` 纳入例外；每条至多该精确段一次。不排整个 docs、整个映射文件或整个命中行。
失败：除上述两处精确段内的原名外任一命中残留；`minimum_reviewers` 无例外，同符号在生产源码、配置、调用、导出、`module_consumers`、`destination`、`consumer`、任何其他字段／段／条目或其他 docs 出现仍失败。
证据：P2 原件。
- [ ] **AC-REV-017**：逐字节绑定死代码与其测试删除，合同措辞同步。关联 FR-REV-004。
验证：`node "$T/quality/tests/rev-p2-oracle.mjs" --task=T004`
通过：exit 0；direction 校验仍拒缺材料。
失败：符号或测试文件残留，或合同 `:15` 与 `:19` 仍矛盾。
证据：P2 原件。
- [ ] **AC-REV-018**：route 引用 disabled / 未配置 provider 记失败跳过。关联 FR-REV-006。
验证：`node "$T/quality/tests/rev-p2-oracle.mjs" --task=T006`
通过：exit 0；`skipped_providers` 带 C9 错误码；全不可用仍整组失败。
失败：整组抛错或静默丢弃。
证据：P2 原件。
- [ ] **AC-REV-019**：packet 按 ttl 清理，`quality/reviews` 不动。关联 FR-REV-007。
验证：`node "$T/quality/tests/rev-p2-oracle.mjs" --task=T007`
通过：exit 0；夹具中过期条目删除、未过期 / 符号链接 / `quality/reviews` 保留；doctor 路径不删。
失败：删出边界或 doctor 路径触发删除。
证据：P2 原件；真实首次删除另需用户确认记录，未取得前记 `incomplete` 并列入 P10 的已声明缺口清单（不阻塞门禁，最终对账在 verify-code stage-handoff 一节）。 本次当前覆盖：当前用户真实选择“禁止加载时自动删除，本轮清理延期（推荐）”（任务库004真实选择与079范围）：本轮不交付自动TTL清理，普通load无删除、无合法consumer的prune不保留；FR007/AC019未达成。原T007 A3/A5/A8目标真fail与原始输出保，其他target/guard/回归与AC018不豁免，不把rawfail转pass。
- [ ] **AC-REV-020**：provider-protocol 与 third-review SKILL 停滞措辞一致。关联 FR-REV-009。
验证：`node "$T/quality/tests/rev-p3-oracle.mjs" --task=T009`
通过：exit 0；保留「health/output 不作取消或继续的许可」语义。
失败：仍写 ownerloss guardian 已实现或新增 gate 措辞。
证据：P3 原件。
- [ ] **AC-REV-021**：UI 适用性零消费者 reader 删除。关联 FR-REV-010。
验证：`node "$T/quality/tests/rev-p4-oracle.mjs" --task=T010`
通过：exit 0；`readTaskTypeFromDecisionLog` 与 `validatePostPhaseContract` 仍导出。
失败：reader 残留或保留导出缺失。
证据：RED `quality/tests/2026-10-07-007-rev-p4-red.log`；GREEN `*-rev-p4-green.log`。
- [ ] **AC-REV-022**：退役登记写进 move-map 既有条目。关联 FR-REV-011。
验证：`node "$T/quality/tests/rev-p4-oracle.mjs" --task=T011`
通过：exit 0；7 个条目含「退役登记」+ ADR 编号 + 符号名，其余条目逐字节不变。
失败：新增 status 或改动其它条目。
证据：P4 原件。
- [ ] **AC-REV-023**：standard-workflow OCR 版本措辞与 wh-review 重派说明。关联 FR-REV-012。
验证：`node "$T/quality/tests/rev-p4-oracle.mjs" --task=T012`
通过：exit 0；`:19` 逐字不变。
失败：缺版本条件或补派写成自动。
证据：P4 原件。
- [ ] **AC-REV-024**：decision-log SKILL 与 make-decision 方法同步，悬空要求删除。关联 FR-REV-014。
验证：`node "$T/quality/tests/rev-p5-oracle.mjs" --task=T014`
通过：exit 0；steps.json 15 步 slug 不变，`thin-core-residue` 仍绿。
失败：悬空要求残留或步骤编号变化。
证据：P5 原件。
- [ ] **AC-REV-025**：0 字节输出不落盘并记原因。关联 FR-REV-016。
验证：`node "$T/quality/tests/rev-p7-oracle.mjs" --task=T018`
通过：exit 0；无 `.output` 文件，`discarded_facts` 有 `zero_bytes`；失败 provider 非空输出保留。
失败：写出空文件或丢弃非空失败输出。
证据：P7 原件。
- [ ] **AC-REV-026**：指纹复用只记事实不拒派。关联 FR-REV-016。
验证：`node "$T/quality/tests/rev-p7-oracle.mjs" --task=T018`
通过：exit 0；命中时 `already_reviewed.hit` 为 true 且派发 1 次。
失败：命中后未派发或报错。
证据：P7 原件。
- [ ] **AC-REV-027**：两套 findings 锚点规则统一到投递相对路径 + 行号。关联 FR-REV-017。
验证：`node "$T/quality/tests/rev-p7-oracle.mjs" --task=T019`
通过：exit 0；OCR 侧不再按引文包含判；越界行与未投递路径仍判无效。
失败：引文判据残留或越界被接受。
证据：P7 原件。
- [ ] **AC-REV-028**：路径提示布局中立。关联 FR-REV-018。
验证：`node "$T/quality/tests/rev-p8-oracle.mjs" --task=T020`
通过：exit 0；`RESULT_PROMPT` 不含 `bundle/review-instructions.md` 字面串，仍点名两件。
失败：字面前缀残留。
证据：P8 原件。
- [ ] **AC-REV-029**：墙钟超时环境变量与 600 秒窗口移除。关联 FR-REV-019。
验证：`node "$T/quality/tests/rev-p8-oracle.mjs" --task=T021`（client 侧）；`node "$T/quality/tests/rev-p1-oracle.mjs" --task=T002`（v3 契约侧）
通过：两条 exit 0；环境变量不改变行为；迟到补充 findings 并入；显式构造参数仍可 `PROCESS_TIMEOUT`；v3 契约不含字面 `600000`。
失败：常量残留或迟到 findings 被丢。
证据：P8 原件。
- [ ] **AC-REV-030**：健康者等终态、逐 provider 部分结果、token / 墙钟记账。关联 FR-REV-020。
验证：`node "$T/quality/tests/rev-p8-oracle.mjs" --task=T022`
通过：exit 0；每成员有 `usage_status`，有原件者有 `raw_output_ref` 与 `raw_output_sha256`；停滞成员是失败事实，健康兄弟仍计可用。
失败：usage 补 0、缺 sha256 或触发补派。
证据：P8 原件；生产早到落盘由 P9/T024 补足。
- [ ] **AC-REV-031**：游标存当前 Phase `base_head`，并由 Phase 代码审查读作 diff base。关联 FR-REV-021。
验证：`node "$T/quality/tests/rev-p9-oracle.mjs" --task=T023`（游标侧）；`node "$T/quality/tests/rev-p9-oracle.mjs" --task=T024`（消费者侧）
通过：两条 exit 0；游标覆盖写，只存一个 `base_head`，不形成序列；`prepareTaskBoundBuildCodeReviewBundle` 经私有 `phaseReviewDiffBase` 把游标 `base_head` 作 `captureSource` 的 `baselineCommit`，无游标 / 游标不属本 Phase / 形状非法时回落 `workspace.baseline_commit`。
失败：写入被拒、保留历史，或 `base_head` 合格时仍取任务基线。
证据：P9 原件。
- [ ] **AC-REV-032**：verify-code 只送本任务改动集。关联 FR-REV-022。
验证：`node "$T/quality/tests/rev-p9-oracle.mjs" --task=T024`
通过：exit 0；材料只含 `git diff --name-only 4dd348dc...HEAD` 的文件；`onProviderResult` 有生产传参。
失败：送入改动集外文件或回调仍为 null。
证据：P9 原件。

## 实现设计（全局权威）

### 代码锚点

- **来源边界**：锚点于 2026-10-08 在 W 根 HEAD `4dd348dc` 实读；各 Phase「交接知识」有逐行记录。研究原件只引 ref：B-1 `quality/evidence/research/B-1-build-plan-review-runtime-health.md`（sha256 48782ef9…，审查运行时与健康监控 Q1–Q13）、B-2 `B-2-build-plan-materials-cost-acceptance.md`（a89b3447…，材料、成本与验收 Q1–Q9）、B-3 `B-3-build-plan-execution-efficiency.md`（87d7ec4f…，MOD-7 无仓库写集）、B-4 `B-4-build-plan-doc-templates.md`（e6758341…，模板回显与 C24 包装式判法）。
- **代码锚点**：
  - 解析：`runtime/review/review-output.mjs:7` `MAX_REVIEWER_OUTPUT_BYTES`（128 KiB）、`:170` `firstJsonCandidate`、`:188` `parseReviewerOutput`。
  - 计数：`runtime/review/canonical-review-result.mjs:233` `deriveVerifyCodeConclusion`（唯一调用方 `runtime/review/review-record-route.mjs:105`）。
  - 记录：`runtime/review/review-record-route.mjs:60` `recordSimpleReviewRequest`、`:79` `onProviderOutput`、`:100-107` 记录组装。
  - OCR：`runtime/review/ocr-delegation-adapter.mjs:986` `ocrFindingAnchorValid`、`:246` `onProviderResult` 参数、`:1841-1847` usage 透传。
  - runner：`skills/wh-review/scripts/simple-review-runner.mjs:99` `RESULT_PROMPT`、`:459` `waitForManagedTerminal`、`:1063` `publicProviderResult`、`:1566-1606` 成员映射。
  - client：`skills/wh-review/scripts/review-provider-client.mjs:18` 读 `WH_REVIEW_BROKER_TIMEOUT_MS`、`:265` `LATE_SUPPLEMENT_WINDOW_MS = 600000`。
  - 配置：`skills/wh-review/scripts/third-review-host-config.mjs:8` `PACKET_SOURCE_PREFIX`、`:531` `loadTrustedThirdReviewConfig`、`:692` `selectTrustedReviewProviderSelection`；`skills/third-review/lib/config.mjs:40` `ttl_hours` 默认 24。
  - 健康：`skills/third-review/lib/health-runner.mjs:54` 停滞只诊断一次；`skills/third-review/lib/broker.mjs:1190` `processOutcome`（非 ok 非 timeout / launch 写 `exit_nonzero`）、`:771`、`:1244` `executionTimeoutMs: null`。
  - 零消费者：`runtime/stage/stage-content-contracts.mjs:144` `readUiApplicabilityFromDecisionLog`；`runtime/review/review-policy.mjs:101` 与 `skills/wh-review/scripts/review-materials.mjs:609` `minimumReviewersFor`；`skills/wh-review/scripts/review-materials.mjs:210` `validateDetailReviewInput`。
  - 任务事实：`runtime/task/task-store.mjs:8` `STAGE_ROW_KEYS`、`:61` `validateCursor`（键 `phase_id`、`task_id`、`phases_head`、`recorded_at`）、`:65` 抛 `task row contains unsupported fields`。
  - 装配：`tools/cli/stage-runtime.mjs:1057` 只传 `rawOutputSink`，未传 `onProviderResult`；`:852` 读 `baseline_commit`；`runtime/review/review-input-bounds.mjs:63` `compactVerifyCodeMaterials` 原样返回、`diff: null`。
  - 校验器：`runtime/stage/stage-content-contracts.mjs:527` `validatePostPhaseContract`、`:244` `FIELD_LABEL_ALIASES`。
- **读取顺序**：本文「验收标准」→ 所属 `phases/P<n>.md` → 上列锚点 → 交接知识列出的邻接消费者；无需全仓扫描。
- **运行条件**：Node ESM；测试只用 `npx --no-install vitest run <单个文件>`；无新依赖。

### 接口与失败语义

- **选择的架构方案**：全部复用既有生产写入方与既有 schema（C13）；新事实是既有记录上的字段，不新增文件、目录、命令、gate 或持久对象。放弃方案：墙钟超时、统一 bundle 视图、v4 契约、改 broker。
- **模块职责**：
  - `review-output.mjs` 只判可解析；`canonical-review-result.mjs` 只按 `parse_outcome` 计数；三份 schema 共用逐字相同的 `$defs.materialCoverage`（键 `provider`、`read`、`unread`、`undetermined`）。
  - `review-record-route.mjs` 是审查记录唯一 producer：组装 `review_facts`（`providers[]` 各含 `provider`、`status`、`opinion_returned`、`findings_count`、`duration_ms`、`usage`、`usage_status`；另含 `material_bytes`、`wall_clock_ms`、`usage_coverage`、`already_reviewed`）与顶层 `material_coverage`。
  - runner 产出成员 `parse_outcome`（`ok` / `invalid` / `empty_output`）、`usage_status`（`reported` / `not_reported`）、`raw_output_ref`、`raw_output_sha256`。
  - health runner 产出 `PROCESS_STALLED` 终态；broker 照既有路径记成员 `status:"failed"`。
  - task-store 只保存一行当前游标；P10 只读汇总，不写记录。
- **接口与数据流**：provider 原始字节 → 既有 `quality/reviews/*-provider-N.output` sink（0 字节跳过）→ 解析 → 成员事实 → route 组装正式记录一次写盘（ADR-025）；早到成员经 `onProviderResult` 作部分结果（P9 接线）。verify-code 材料＝`git diff --name-only <baseline_commit>...HEAD` 的文件（C6）。原计划为带 `requestedStage` 的 `loadTrustedThirdReviewConfig` 清理 packet 并返回 `packetRetention`；该计划已被用户004/范围079的本轮延期选择覆盖，当前实际普通 load 不删 packet、无清理执行/retention 返回事实，FR-REV-007/AC-REV-019未达成（见本条证据覆盖），不把原计划当已交付。
- **失败语义**：
  - 散文 JSON、超 16 MiB、无候选：`OUTPUT_INVALID`，成员 failed，不计覆盖，不补派（ADR-031）。
  - 停滞：`PROCESS_STALLED` 终态失败；`process_outcome` 保持 broker 既有取值（多为 `exit_nonzero`），A-03 只用 `status` + `error.code` 判（C12 修订）。
  - provider 不可用：`PROVIDER_NOT_CONFIGURED` / `PROVIDER_DISABLED` / `PROVIDER_MODEL_UNKNOWN` 进 `skipped_providers`；全跳过时整组抛错并挂事实。
  - `material_id` 拿不到写 null，保留原失败事实（C7）；复用查表遇坏文件只跳过。
  - 原 packet 单条删除失败进 `errors` 的语义属于延期前计划；用户004/079禁止加载时自动删除并延期本轮清理，当前 load/doctor 均不清理，不产生删除成功或失败的 `packetRetention` 执行事实。未来清理需明确真实 consumer 与范围另设计，当前T007原目标失败如实保留，不宣称已实现。
  - 未上报用量：`usage:null` + `usage_status:"not_reported"`，任何路径不补 0。
- **新增控制面**：N/A — 只在既有记录 / schema / 游标上加字段；退役登记写进 move-map 既有条目（C21）。

### 全局文件边界与依赖

- **新增**（逐条列出，保证每个 Phase 写入集都是本边界的子集）：任务库根 `quality/tests/rev-p1-oracle.mjs`、`quality/tests/rev-p2-oracle.mjs`、`quality/tests/rev-p3-oracle.mjs`、`quality/tests/rev-p4-oracle.mjs`、`quality/tests/rev-p5-oracle.mjs`、`quality/tests/rev-p6-oracle.mjs`、`quality/tests/rev-p7-oracle.mjs`、`quality/tests/rev-p8-oracle.mjs`、`quality/tests/rev-p9-oracle.mjs`、`quality/tests/rev-acceptance.mjs`（各 Phase 与验收 Phase 的判定器，build-plan 写定后冻结）；W 根 `specs/workflowhub-review-efficiency-20261007/phases/P10.md`。仓库内不新增生产或测试文件。
- **删除**：`skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`（P2）。
- **修改**（逐字取自各 Phase 写入集）：
  - P1：`runtime/review/review-output.mjs`；`runtime/review/canonical-review-result.mjs`；`runtime/review/schemas/result.schema.json`；`runtime/review/schemas/attempt.schema.json`；`skills/wh-review/contracts/workflowhub-result.v3.json`；`skills/wh-review/scripts/__tests__/review-runner.test.mjs`；`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`。
  - P2：`runtime/review/stage-materials.json`；`runtime/review/schemas/stage-materials.schema.json`；`runtime/review/review-policy.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`skills/wh-review/contracts/make-decision.md`；`skills/wh-review/scripts/third-review-host-config.mjs`；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；`tests/contract/build-prd-review-contract.test.mjs`。
  - P3：`skills/third-review/lib/health-runner.mjs`；`skills/third-review/lib/adapters/antigravity.mjs`；`skills/third-review/lib/process.mjs`；`skills/third-review/SKILL.md`；`skills/wh-review/contracts/provider-protocol.md`；`skills/third-review/docs/exceptions.md`；`skills/third-review/test/health-runner.test.mjs`；`skills/third-review/test/process.test.mjs`；`skills/third-review/test/codex-health.test.mjs`；`skills/third-review/test/antigravity-adapter.test.mjs`；`skills/third-review/test/fake-antigravity-cli.mjs`。
  - P4：`runtime/stage/stage-content-contracts.mjs`；`tests/contract/ui-design-confirmation-gate.test.mjs`；`runtime/review/stage-review-disposition.mjs`；`docs/architecture/move-map.json`；`docs/standard-workflow.md`；`skills/wh-review/SKILL.md`。
  - P5：`skills/decision-log/templates/decision-log-template.md`；`skills/decision-log/SKILL.md`；`workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`。
  - P6：`skills/spec-plan/templates/phase-template.md`；`skills/spec-specify/templates/spec-template.md`；`skills/spec-prd/templates/prd-template.md`。
  - P7：`runtime/review/review-record-route.mjs`；`runtime/review/ocr-delegation-adapter.mjs`；`tests/review/review-record-route.test.mjs`；`tests/contract/ocr-delegation-adapter.test.mjs`；`tests/contract/ocr-delegation-route.test.mjs`。
  - P8：`skills/wh-review/scripts/simple-review-runner.mjs`；`skills/wh-review/scripts/review-provider-client.mjs`；`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`；`tests/contract/external-supplement-window.test.mjs`；`skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`。
  - P9（骨架写集）：`runtime/task/task-store.mjs`；`tests/integration/minimal-task-storage.test.mjs`；`tools/cli/stage-runtime.mjs`；`runtime/review/review-input-bounds.mjs`。认证 worktree 根追加已独立批准测试 `tests/contract/stage-progress-contract.test.mjs`（公开游标真实run/status/五键与首次起点消费者，097/108/109/119）与 `tests/contract/ocr-review-contract-bundle.test.mjs`（T024提交集changed-lens装配与控制冲突测试消费者，129/133/138），共六个当前仓库文件且唯一Phase owner均为P9；批准、独立after与动态原件的任务库根指针见P9契约头，不复制证据/新增生产文件或验收规则。
- **禁止改动**：`skills/third-review/lib/broker.mjs`（C12 修订、C16）；`skills/third-review/lib/workflowhub-result-v3.mjs`（不扩枚举）；`skills/third-review/lib/recovery-policy.mjs`（`PROCESS_STALLED` 不入恢复码）；`skills/third-review/lib/runtime-guardian.mjs`；`skills/third-review/lib/config.mjs`（`ttl_hours` 已存在，C20 不加键）；`skills/wh-review/scripts/wh-review-cli.mjs`；`tools/cli/check-decision-log-chain.mjs`（C15）；`workflows/verify-code/design-alignment.mjs`；`tests/contract/stalled-consumer-delta.test.mjs`；`tests/stage-risk-acceptance.test.mjs`；`CONSTITUTION.md`；`package.json`；`specs/workflowhub-review-efficiency-20261007/decision-log.md`；`specs/archive/**`、`docs/research/**`；任务库根已有原件。
- **与日志文件表的差异**：`## 要改哪些文件` 列了 `skills/third-review/lib/broker.mjs`（ADR-009）与 `skills/third-review/lib/config.mjs`（ADR-036），实读两者已满足（`:771`、`:1244` 无墙钟；`:40` 有 `ttl_hours`），故不进写集。写集多出的 adapter、process、schema、move-map 与测试文件由 C11、C21 与 Phase 作者实读加入。
- **全局依赖**：P4←P2（访问器先删再登记）；P7←P1（schema 键与解析）；P8←P1、P2、P3、P7（解析、runner 导入方、停滞终态；P7 改 route 回调协议后返回 `null`，runner 侧必须先有 P8 的 `onProviderOutput` 防御过滤，否则 P7 落地会带红 P8 写入集外的 runner 测试）；P9←P7、P8（记录事实与回调形状）；P10←P1…P9。波次：①P1、P2、P3、P5、P6；②P4、P7；③P8；④P9；⑤P10（P8 不与 P7 同波次，避免上述竞态）。
- **文件归属**：每个路径只属一个 Phase（`validatePostPhaseContract` 查重）；同文件 Task 在 Phase 内串行。
- **回滚与恢复**：每 Phase 单独提交（ADR-018），回滚＝revert 该 Phase 提交。P2/T007 真实删除不可回滚是延期前计划的风险 RISK-01，本轮已按用户004/079禁止加载删除并延期，当前未执行真实 packet 删除；未来只有明确真实 consumer 与范围另设计后才涉及该不可回滚后果，不以当前交付授权推定未来删除许可。

### 当前并行方案（计划分工，尚未派发或实施）

- **授权与计数口径**：本节只补现有计划的并发、职责与写集引用；计划仍待用户确认，未授权实施。逐 Task 的 2 个工作上下文来自当前会话的 2–5 并发指引，不冒称 build-plan 磁盘方法原有条款。每队＝1 个本 Phase 稳定实施 owner（唯一写者）＋1 个该 Task 只读事实助手；主会话负责范围、资源排队与用户选择，不是额外实施者。
- **全局预算**：同时最多两支 2 人 Task 队伍＋主会话＝5 个上下文；普通工作最少主会话＋一支队伍＝3。所有正在工作的审查者、事实助手与任何子扇出都计入活动上下文，不暗增。既有独立审查开展时先结束本轮事实助手工作或停止安排另一队的新写入，在相关写者静止后按实际 provider 占用预留位置，使活动上下文保持 2–5；这是普通角色调度规划，不是运行 Team 的暂停授权。未分配或等待结果的上下文不冒记正在执行；若既有审查调用本身无法满足预算，报告主会话调整安排，不减少已定 provider、不增加审查点。五波次只是 ready 分组，第一波 5 个 Phase 排队取至多两支队伍，不是 5 个 Phase 各自再 fanout；事实助手不再扇出。
- **稳定 owner 与互斥**：下表同一 Phase 的 owner 名称代表同一个规划写者角色，跨 Task 复用同一实施会话；每个真实文件仍只有该 Phase 的写者。该写者一次只写一个 Task，不能为同时开两队而另派同 Phase 第二写者。原依赖不增删，可并行的 Task 允许因资源或稳定 owner 复用排队，不把排队新增为材料依赖。同文件 Task 必须串行；P1 的 T001/T002 只有真实写集互斥且稳定 owner 可顺序交付时才安排其读前准备并行，若出现共享文件不得同时写；P6 三 Task 最多两项同时做只读准备，生产写入仍由稳定 owner 逐项交付；P8 保持 T020→T021→T022 串行。
- **事实助手边界**：只读本 Task 的输入、消费者与受影响验证准备，回传路径、符号和覆盖限制；对仓库写集只读，不写生产／测试源码、材料、facts 或既有原件，不改冻结 oracle，不执行 Git、宿主或清理动作，不冒称 reviewer、不自判质量。测试只能在写者已交付静止写集后执行：由主会话安排该助手在停止所有可能影响测试输入的写入后运行既有针对性命令，按现有工具将 stdout/stderr/exit 保存为一份新的唯一原件；此项测试原件记录是助手唯一允许的证据写入，不复制镜像，不并行测试观察正在写的树。本节不新增测试命令、测试框架、每 Task 固定审查或门。
- **质量与风险不变**：独立质量仍用既有每 Phase OCR（按既有条件 fallback）与 verify-code 终末审查；同 scope 计划不重审。表中名字仅是未来可指派的计划角色，不是实际代理身份、派发事实、执行事实或真人风险接受签名。FR、AC、oracle、已声明缺口、依赖、风险与不可逆动作授权边界全部保留；失败仍回原 Task owner 的同一会话修复，助手不代用户承接风险。
- **允许写集引用口径**：下表每条只引用 S 根对应物理 Phase 的 Task 卡「文件 / 符号」与「边界 / 禁止改动」；真实路径、符号及该 Phase 契约头按该物理正文读，不以本表扩写集。Phase 写集中的任务库 oracle 属 build-plan 冻结件，不因写集引用变成实施者可改；P10 owner 只复用既有汇总机制与现有回写区，不新增记录 writer、永久文件或进度账本，仍仅按原契约允许的证据指针／post 条件与回写区范围处理，不改档位或缺口清单。

| Task | 工作上下文并发数 | 稳定实施 owner（唯一写者，计划角色） | 只读事实助手（计划角色） | 允许写集权威引用（S 根） |
| --- | --- | --- | --- | --- |
| T001 | 2 | P1-解析契约-owner | T001-事实助手 | `phases/P1.md` 的 T001 卡「文件 / 符号」「边界 / 禁止改动」 |
| T002 | 2 | P1-解析契约-owner | T002-事实助手 | `phases/P1.md` 的 T002 卡「文件 / 符号」「边界 / 禁止改动」 |
| T003 | 2 | P2-材料配置-owner | T003-事实助手 | `phases/P2.md` 的 T003 卡「文件 / 符号」「边界 / 禁止改动」 |
| T004 | 2 | P2-材料配置-owner | T004-事实助手 | `phases/P2.md` 的 T004 卡「文件 / 符号」「边界 / 禁止改动」 |
| T005 | 2 | P2-材料配置-owner | T005-事实助手 | `phases/P2.md` 的 T005 卡「文件 / 符号」「边界 / 禁止改动」 |
| T006 | 2 | P2-材料配置-owner | T006-事实助手 | `phases/P2.md` 的 T006 卡「文件 / 符号」「边界 / 禁止改动」 |
| T007 | 2 | P2-材料配置-owner | T007-事实助手 | `phases/P2.md` 的 T007 卡「文件 / 符号」「边界 / 禁止改动」；仅夹具验证，真实删除另需确认 |
| T008 | 2 | P3-健康终态-owner | T008-事实助手 | `phases/P3.md` 的 T008 卡「文件 / 符号」「边界 / 禁止改动」 |
| T009 | 2 | P3-健康终态-owner | T009-事实助手 | `phases/P3.md` 的 T009 卡「文件 / 符号」「边界 / 禁止改动」 |
| T010 | 2 | P4-退役登记-owner | T010-事实助手 | `phases/P4.md` 的 T010 卡「文件 / 符号」「边界 / 禁止改动」 |
| T011 | 2 | P4-退役登记-owner | T011-事实助手 | `phases/P4.md` 的 T011 卡「文件 / 符号」「边界 / 禁止改动」；disposition 只登记不真删 |
| T012 | 2 | P4-退役登记-owner | T012-事实助手 | `phases/P4.md` 的 T012 卡「文件 / 符号」「边界 / 禁止改动」 |
| T013 | 2 | P5-决策模板-owner | T013-事实助手 | `phases/P5.md` 的 T013 卡「文件 / 符号」「边界 / 禁止改动」 |
| T014 | 2 | P5-决策模板-owner | T014-事实助手 | `phases/P5.md` 的 T014 卡「文件 / 符号」「边界 / 禁止改动」 |
| T015 | 2 | P6-三模板-owner | T015-事实助手 | `phases/P6.md` 的 T015 卡「文件 / 符号」「边界 / 禁止改动」 |
| T016 | 2 | P6-三模板-owner | T016-事实助手 | `phases/P6.md` 的 T016 卡「文件 / 符号」「边界 / 禁止改动」 |
| T017 | 2 | P6-三模板-owner | T017-事实助手 | `phases/P6.md` 的 T017 卡「文件 / 符号」「边界 / 禁止改动」 |
| T018 | 2 | P7-记录OCR-owner | T018-事实助手 | `phases/P7.md` 的 T018 卡「文件 / 符号」「边界 / 禁止改动」 |
| T019 | 2 | P7-记录OCR-owner | T019-事实助手 | `phases/P7.md` 的 T019 卡「文件 / 符号」「边界 / 禁止改动」 |
| T020 | 2 | P8-runner收场-owner | T020-事实助手 | `phases/P8.md` 的 T020 卡「文件 / 符号」「边界 / 禁止改动」 |
| T021 | 2 | P8-runner收场-owner | T021-事实助手 | `phases/P8.md` 的 T021 卡「文件 / 符号」「边界 / 禁止改动」 |
| T022 | 2 | P8-runner收场-owner | T022-事实助手 | `phases/P8.md` 的 T022 卡「文件 / 符号」「边界 / 禁止改动」 |
| T023 | 2 | P9-任务装配-owner | T023-事实助手 | `phases/P9.md` 的 T023 卡「文件 / 符号」「边界 / 禁止改动」 |
| T024 | 2 | P9-任务装配-owner | T024-事实助手 | `phases/P9.md` 的 T024 卡「文件 / 符号」「边界 / 禁止改动」 |
| T025 | 2 | P10-逐项验收-owner | T025-事实助手 | `phases/P10.md` 的 T025 卡「文件 / 符号」「边界 / 禁止改动」与冻结 oracle 限制 |

### 需求到任务追踪

| 来源 / 决定 | FR / AC | Phase / Task | oracle / 正负判据 | 依赖 |
| --- | --- | --- | --- | --- |
| R-002、R-004 / ADR-030、033 | FR-REV-001 / AC-REV-004、AC-REV-015 | P1/T001 | ORACLE-REV-T001；正＝JSONL、唯一 fence、整份 JSON 可解析；负＝散文 JSON、超限抛错 | none |
| R-004 / ADR-007、031、032、034、038 | FR-REV-002、FR-REV-019（v3 契约侧）/ AC-REV-005、AC-REV-006、AC-REV-029（v3 契约侧） | P1/T002 | ORACLE-REV-T002；正＝合法新键被接受；负＝`parse_outcome` 非 ok 不计完成、形状错误被拒 | none |
| R-001 / ADR-008、002 | FR-REV-003 / AC-REV-016 | P2/T003 | ORACLE-REV-T003；正＝矩阵仍过 schema；负＝残留命中 | none |
| U-005、R-016 / ADR-013、010 | FR-REV-004 / AC-REV-017 | P2/T004 | ORACLE-REV-T004；正＝direction 仍拒缺材料；负＝死代码残留 | T003 |
| R-002 / ADR-041、042 | FR-REV-005 / AC-REV-008 | P2/T005 | ORACLE-REV-T005；正＝`derivation` 三键；负＝其它阶段缺材料仍 incomplete | T004 |
| R-004 / ADR-028 | FR-REV-006 / AC-REV-018 | P2/T006 | ORACLE-REV-T006；正＝跳过事实；负＝全不可用仍失败 | none |
| R-003 / ADR-036 | FR-REV-007 / AC-REV-019 | P2/T007 | ORACLE-REV-T007；正＝过期删除；负＝doctor、符号链接、`quality/reviews` 不动 | T006 |
| R-011、R-012 / ADR-005、006、031 | FR-REV-008 / AC-REV-003 | P3/T008 | ORACLE-REV-T008；正＝5 间隔无进展判停；负＝持续进展不判停、取消仍 CANCELLED | none |
| R-001、R-011、R-012 / ADR-001、005、006 | FR-REV-009 / AC-REV-020 | P3/T009 | ORACLE-REV-T009；正＝措辞一致；负＝无 gate 措辞 | T008 |
| R-002 / ADR-016 | FR-REV-010 / AC-REV-021 | P4/T010 | ORACLE-REV-T010；正＝任务类型仍读出；负＝reader 残留 | none |
| R-003、U-005 / ADR-037、021、008、016、013 | FR-REV-011 / AC-REV-022 | P4/T011 | ORACLE-REV-T011；正＝7 条目登记；负＝其它条目变化 | T010、P2 |
| R-002 / ADR-023、029 | FR-REV-012 / AC-REV-023 | P4/T012 | ORACLE-REV-T012；正＝版本条件在；负＝`:19` 变化 | none |
| R-018、R-009、R-006、R-007 / ADR-049…073、014、015 | FR-REV-013 / AC-REV-011、AC-REV-012 | P5/T013 | ORACLE-REV-T013；正＝模板合法；负＝`## 任务身份` 非恰一次 | none |
| R-018 / ADR-051、052、054、055、058、070、074 | FR-REV-014 / AC-REV-024 | P5/T014 | ORACLE-REV-T014；正＝悬空要求删除；负＝步骤 slug 变化 | T013 |
| R-018、R-006、R-007 / ADR-014、071、017 | FR-REV-015 / AC-REV-011 | P6/T015 | ORACLE-REV-T015；正＝无占位；负＝G-2 示例首行变化 | none |
| R-018 / ADR-015、071 | FR-REV-015 / AC-REV-011 | P6/T016 | ORACLE-REV-T016；正＝照抄不报 requires concrete；负＝五个 H3 缺失 | none |
| R-018 / ADR-071 | FR-REV-015 / AC-REV-011 | P6/T017 | ORACLE-REV-T017；正＝无 mustache；负＝16 字段缺失 | none |
| R-004、R-013、R-014、R-015、U-002、U-003、U-004 / ADR-039、024、035、038 | FR-REV-016 / AC-REV-001、AC-REV-025、AC-REV-026 | P7/T018 | ORACLE-REV-T018；正＝`review_facts` 齐全；负＝命中仍派发、失败输出保留 | P1 |
| R-004 / ADR-032、022、034、030 | FR-REV-017 / AC-REV-006、AC-REV-027 | P7/T019 | ORACLE-REV-T019；正＝锚点统一、usage 归一；负＝越界行无效 | T018 |
| R-002、R-004 / ADR-012、030、022、031 | FR-REV-018 / AC-REV-002、AC-REV-028 | P8/T020 | ORACLE-REV-T020；正＝失败成员非 completed；负＝合法 findings 仍 completed | P1、P2 |
| R-012、U-001、R-014、U-004 / ADR-009、026 | FR-REV-019（client 侧）/ AC-REV-029（client 侧） | P8/T021 | ORACLE-REV-T021；正＝窗口删除；负＝显式 timeoutMs 仍生效 | T020 |
| R-011、R-012 / ADR-005、025、038、031、028 | FR-REV-020 / AC-REV-030、AC-REV-018 | P8/T022 | ORACLE-REV-T022；正＝usage_status 与 sha256、被跳过 provider 的失败事实进记录；负＝未上报不为 0 | T020、P3 |
| R-013、U-002、R-015、U-003 / ADR-018、020 | FR-REV-021 / AC-REV-007、AC-REV-031 | P9/T023 | ORACLE-REV-T023；正＝游标与体积基线写入；负＝不形成历史序列 | P7、P8 |
| R-003 / ADR-004、025 | FR-REV-022 / AC-REV-032、AC-REV-031（消费者侧） | P9/T024 | ORACLE-REV-T024；正＝只送改动集、回调接线、Phase 审查 diff base 取游标 base_head；负＝改动集外文件不进材料、无游标时回落任务基线 | T023 |
| R-005、R-010、R-015、R-017 / ADR-003、019、039、040、061…068 | FR-REV-023 / AC-REV-009、AC-REV-010、AC-REV-013、AC-REV-014 | P10/T025 | ORACLE-REV-T025；正＝逐条档位 + 证据；负＝缺行或计数代替逐条 | P1…P9 |
| R-008 / 无 ADR 落点 | 无 FR — 需求面自身（原表 R-008 行：覆盖矩阵即本件两表） | 无仓库改动、无 Task（不适用，不是遗漏） | 由 decision-log「需求-决策覆盖矩阵」与「决策→需求回指」两表自身承接 | none |

### 全局验证策略

- **验证策略**：每 Task 一个 oracle 脚本参数，行为改动用真实导入或针对性单文件 vitest 子进程，文档改动用可证伪读回；不跑全量 vitest / `npm test` / `test:safe`。HEAD 已有红测试（B-1 末段、B-2 §0），按测试名归因，不看文件级退出码。
- **RED/GREEN 设计**：同一命令 RED exit 1 且失败的是具名目标断言，GREEN exit 0 且 guard 仍 PASS。各 Phase gate 与 RED 原件（任务库根）：
  - P1：`node "$T/quality/tests/rev-p1-oracle.mjs" --task=all`；RED `quality/tests/2026-10-07-014-rev-p1-red.log`（sha256 3a69b4dd…；旧原件 `-010-` 保留）
  - P2：`node "$T/quality/tests/rev-p2-oracle.mjs"`；RED `quality/tests/2026-10-08-003-rev-p2-red.log`（3d2a731c…）
  - P3：`node "$T/quality/tests/rev-p3-oracle.mjs" --task=T008` 与 `--task=T009`；RED `quality/tests/2026-10-07-015-rev-p3-red.log`（af931311…；旧原件 `-012-` 保留）
  - P4：`node "$T/quality/tests/rev-p4-oracle.mjs"`；RED `quality/tests/2026-10-07-007-rev-p4-red.log`（0c6e1aa5…）
  - P5：`node "$T/quality/tests/rev-p5-oracle.mjs" --task=T013`、`--task=T014`，加 `npx --no-install vitest run tests/contract/thin-core-residue.test.mjs`；RED `quality/tests/2026-10-08-002-rev-p5-red.log`（c2c91cf8…）
  - P6：`node "$T/quality/tests/rev-p6-oracle.mjs" --task=T015`（T016、T017 同），加 `npx --no-install vitest run tests/contract/post-build-plan-missing-index.test.mjs`；RED `quality/tests/2026-10-07-004-rev-p6-red.log`（c84b15cd…）
  - P7：`node "$T/quality/tests/rev-p7-oracle.mjs" --task=all`；RED `quality/tests/2026-10-07-011-rev-p7-red.log`（3286cb9f…）
  - P8：`node "$T/quality/tests/rev-p8-oracle.mjs" --task=T020`（T021、T022 同）；RED `quality/tests/2026-10-08-004-rev-p8-red.log`（8f481c61…；旧原件 `-009-`、`-013-`、`-016-` 保留）
  - P9：`node "$T/quality/tests/rev-p9-oracle.mjs" --task=T023 --root="$W"`、`node "$T/quality/tests/rev-p9-oracle.mjs" --task=T024 --root="$W"`（oracle 由 build-plan 写定后冻结，实施者不改）；RED `quality/tests/2026-10-08-005-rev-p9-red.log`（sha256 a6aee2ef…，45 行 / 5,203 B；这是本卡现行 P9 RED 原件，旧 `2026-10-07-019-rev-p9-red.log` 只读保留，旧编号 `-017-` 在任务库中不存在）
  - P10：`node "$T/quality/tests/rev-acceptance.mjs" --task=T025 --root="$W"`（oracle 由 build-plan 写定后冻结，实施者不改档位口径与已声明缺口清单）；RED `quality/tests/2026-10-08-006-rev-acceptance-red.log`（sha256 f78101d2…，42 行 / 32,820 B；旧原件 `quality/tests/2026-10-08-001-rev-acceptance-red.log` 与 `quality/tests/2026-10-07-020-rev-acceptance-red.log` 保留不改）
- **最终聚合**：P10 逐条输出 AC-REV-001…032 各一行档位与证据路径；**门禁语义：exit 0 ⟺ 32 行逐条都有真实档位与具名证据指针、无 `fail`、无 `unavailable`、且所有 `incomplete` 都在 P10 契约头冻结的「已声明缺口清单」内；exit 0 不等于 32 条 AC 全部达成（整体通过只在 32 行全 `pass` 时可报），`pass` 之外的档位一律不折成通过**。材料自检用 `validatePostPhaseContract` 读 spec、index 与全部 Phase。收尾汇总按 C22 放进 verify-code stage-handoff 一节，不新增文件。上述为默认口径；本次仅003真实选择、073完整范围、124固定30条已发生格式损失及128引用错误披露所限的旧违规可保 `fail` 有损收尾（P10有限说明），新增/其他 `fail` 仍阻完成；清理按004真实选择/079范围本轮延期，FR007/AC019未达成，不把延期记功能通过，也不扩大旧格式损失例外。
- **不能证明的内容**：真实 provider 轮次下的停滞判定（合并后取，AC-REV-003，P10 记 `incomplete` 并列入已声明缺口）；真实 token 数值（usage=null）；实现侧与审查侧并列成本的**实现侧数字**（A-09 实现侧缺口；AC-REV-009 按 pass-with-recorded-gap 口径记 `pass` 并在回写区如实登记缺口）；`quality/**` 不进 worktree diff（ADR-019），Phase 代码审查包须另附 oracle 路径 + sha256。

## 执行纪律（MOD-7 指针）

本节不新增 stage、gate 或校验器，只指向已确认纪律：派发按 ADR-061 七节任务书并落盘一份原件；任务书只写查不到的东西（ADR-062），一书一问（ADR-063），给改动点清单且锚点唯一（ADR-068），锚点带基准目录、研究走 ref（ADR-074）；允许一级子代理扇出（ADR-064），真正并行派发（ADR-047），单次派发往返 ≤20（ADR-046），挂机超时即处理、拆会话代替压缩（ADR-045），同 stage 同 scope 审查只跑一次（ADR-048），工具注册表冻结（ADR-044、ADR-043）。这些纪律不作自动防线（ADR-066），由 P10/T025 对 build-code 期间新落盘的派发原件判 A-10、A-13、A-14，排除引述行（C27）。

## 12. 风险、未决与交接

- **RISK-01**：P2/T007 首次运行会删除约 11G、5,595 个 packet 顶层条目（2026-10-08 实测；骨架 C20 曾记约 14G）。
  - **受影响 ID**：FR-REV-007、AC-REV-019
  - **触发条件**：合并后主仓任一审查调用 `loadTrustedThirdReviewConfig` 且带 `requestedStage`
  - **后果**：历史 packet 不可逆删除
  - **缓解或停止**：删除边界锁死在 `.wh-review-packets` 直属条目、跳过符号链接、只删超 ttl；合并前由主会话向用户展示范围并取得确认，否则不合并
  - **处理阶段**：`verify-code`（close 前展示）
  - **验证**：用户确认记录 + P2 GREEN 原件
- **RISK-02**：A-03 真实轮次证据只能合并后取（生产 broker 运行主仓 `skills/third-review`）。
  - **受影响 ID**：AC-REV-003
  - **触发条件**：合并前验收
  - **后果**：只有夹具证据
  - **缓解或停止**：未取得前 AC-REV-003 记 `incomplete`，不写通过
  - **处理阶段**：`verify-code`
  - **验证**：合并后一轮真实记录的 `status` 与 `error.code`
- **RISK-03**：C12 修订。原定案「停滞时 `process_outcome` 写 null」做不到：`skills/third-review/lib/broker.mjs:1190` 对非 ok 非 timeout / launch 写 `exit_nonzero`，broker 不进任何写集。现定：`process_outcome` 保持 broker 既有取值，A-03 只用 `status` + `error.code` 判。
  - **受影响 ID**：AC-REV-003、FR-REV-008
  - **触发条件**：读停滞成员记录
  - **后果**：`process_outcome` 读到 `exit_nonzero`
  - **缓解或停止**：判据不读该字段
  - **处理阶段**：`build-code`
  - **验证**：ORACLE-REV-T008
- **RISK-04**：`workflows/verify-code/design-alignment.mjs:4` 在 HEAD 即加载失败（导入 `stage-content-contracts.mjs` 不存在的导出 `buildConsumerCensus`，2026-10-08 实跑）。范围外既有事实，本任务不修。
  - **受影响 ID**：AC-REV-021（P4 删导出时不得误归因）
  - **触发条件**：任何导入该文件的测试或运行
  - **后果**：加载即抛错
  - **缓解或停止**：按测试名归因；登记交后续任务
  - **处理阶段**：`verify-code`（如实列出）
  - **验证**：`node -e 'import("./workflows/verify-code/design-alignment.mjs")'` 在 HEAD 已失败
- **RISK-05**：`skills/third-review/docs/exceptions.md:19` 原写「cursor 静止只写诊断、绝不终止活子进程」，与 P3 相反；已由 P3 跨 Phase 修补纳入 P3 写入集（T009 改写）。
  - **受影响 ID**：FR-REV-009、AC-REV-020
  - **触发条件**：T009 漏改该行
  - **后果**：两份文档口径相反
  - **缓解或停止**：ORACLE-REV-T009 读回该文件
  - **处理阶段**：`build-code`
  - **验证**：`node "$T/quality/tests/rev-p3-oracle.mjs" --task=T009`
- **OPEN-01**：C1 OCR 代码面 `runOcrProviderProcess` 健康监控 deferred；负责人＝后续任务；本轮只覆盖 third-review 文档面。
- **OPEN-02**：C14 通用凭据交付 deferred；本任务现场验证子代理与主会话同机，直接用宿主既有 provider 配置，任务书只写配置文件路径与键名，不写值。
- **OPEN-03**：确认原件 `material_refs` 为空（decision-log 更正三），确认不绑当前材料字节；如实保留。

H1–H8 去向：

| 编号 | 去向 |
| --- | --- |
| H1 | 由 C11 定案，P3/T008 实施（stream-json 进展游标 + 5 间隔判停） |
| H2 | 本任务按 C14 同机使用宿主配置；通用方案 deferred（OPEN-02） |
| H3 | 本轮不做；C6 的「本任务改动集」独立定义，不等 H3 |
| H4 | 保持未决：分母为 0，无法判定 |
| H5 | 由 P9/T023 体积基线供观察，不设阈值 |
| H6 | 本任务不补取证 |
| H7 | 保持未决；C15 不动 checker |
| H8 | 已关闭，无遗留 |

## 13. 业务影响与回归范围

### 审查记录读者

- **既有行为**：散文 JSON 可算通过；usage null 被读成 0；空输出落盘。
- **本需求影响**：失败事实变多、记录键变多；旧记录仍可读。
- **回归路径**：各 Phase 交接知识列出的单文件 vitest 基线，只允许原本红的保持红。
- **验收**：AC-REV-001、AC-REV-002、AC-REV-006

- **可能受冲击的业务规则**：`material_id` 口径不变；审查点定义只读；`quality/reviews/` 只增不删。
- **明确无影响**：public runtime 七类命令；Git 授权面；`docs/standard-workflow.md:19`。

## 补充材料

决策权威 `decision-log.md`（S 根）；编号与写集权威 骨架件（任务库根，sha256 d506ffdd…）；派发任务书 `quality/evidence/dispatch/2026-10-07-005-build-plan-authoring-brief.md`（任务库根，sha256 9a35b865…）；各 Phase 的实读记录在 `phases/P<n>.md`「交接知识」。
