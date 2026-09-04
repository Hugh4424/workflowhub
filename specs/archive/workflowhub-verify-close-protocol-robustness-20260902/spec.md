# 功能规格：verify-code / close 执行协议健壮性改造

> 基于已接受的 make-decision 决策（workflowhub-verify-close-protocol-robustness-20260902）。
> 本文件只写产品行为、边界和验收，不写实现类名、工程命令或任务步骤。

- **功能名**：执行协议减负（错误分层 + 绑定自动化 + 提交前预检 + close 诊断）
- **来源**：specs/workflowhub-verify-close-protocol-robustness-20260902/decision-log.md（D-001~D-016，用户已确认 accepted）
- **状态**：修订中（方向已由 make-decision D-012~D-016 收窄，待 build-spec 冻结）

## 速读卡（30 秒）

- **一句话需求**：运行 WorkflowHub 的 agent 在 verify-code/close（含 build-code 同款场景）填错"表格"（schema/绑定/receipt 字段）时，原地改正重发即可，不再整轮重跑 LLM；真正的质量问题该拦还拦。
- **核心改动点**：
  - 机械协议错误与质量失败分层：白名单内且发生在合法 handler result 之后的 publication 协议错误最多同次纯 publication 重试一次，白名单外及 handler/pre-handler 错误一律保持原有质量失败/错误语义；
  - verify-code 的审查绑定由 runtime 自动派生，agent 不再手工对齐；
  - 提交前预检工具（私有命令，经既有公共入口暴露），agent 自查 payload；
  - close 授权校验失败输出结构化诊断（哪一环、期望值、实际值）；
  - 协议错误留轻量痕迹事实，不算质量问题。
- **最大影响面**：stage-runner 的失败通道与 verify-code 绑定逻辑、task-kernel 的 close 授权校验链、stage-runtime 命令白名单、对应契约测试。
- **验收信号**：可分类的 publication 协议错误在同一次调用内最多纯 publication 重试且不重跑 handler/LLM；预检拦截可表达为纯 payload 的错误形状；绑定从当前已认证 Stage Agent outcome 精确派生且无需 agent 提供；resolved-review close 诊断到首个具体环节；旧记录字节不变。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001 | D-001/D-003/D-005/D-006 | FR-CLASS-001~003、FR-BIND-001/002、FR-PREFLIGHT-001/002、FR-DIAG-001、AC 全组 | current | — |
| R-002 | （流程约束） | 本阶段 15 步 manifest | current | — |
| R-003 | D-001/D-008/D-010 | FR-CLASS-002、AC-NONGOAL-001 | current | — |
| R-004 | （Talk 执行） | decision-log T-001~T-010 | current | — |
| R-005 | D-001/D-003 | FR-CLASS-001、AC-EXEC-001 | current | — |
| F-001（lessons 统计） | D-002/D-010 | FR-CLASS-003 白名单枚举、AC-EXEC-002/003 | current | — |
| F-002/F-003（源码锚点） | D-005/D-010 | FR-BIND-001、FR-DIAG-001 | current | — |
| FND-D01~D05 | D-009 | AC-EXEC-001/002/003、AC-PREFLIGHT-001、AC-BIND-001、AC-COMPAT-001 | current | — |
| FND-DD01~DD04 | D-009 | AC-PREFLIGHT-002、AC-CLASS-001、AC-BIND-002、AC-NONGOAL-001 | current | — |
| OPEN-004 | — | — | deferred | DSH 宿主 session-event 缺口→任务 B |
| DE-001/DE-002 | D-008 | — | deferred | 任务 C / 任务 B |

## 1. 问题与紧迫性

两项目 lessons 实测：verify-code 绑定类错误出现 7 次以上、schema 类错误 5 次以上，单任务 build-code 重跑 31 次，PaperBuilder f17 因 close 授权"not current"从未关闭。每次失败都是一整轮 LLM 阶段执行。这些失败几乎全是机械协议问题（格式、绑定、字段），与代码质量无关，却和质量失败走同一条失败通道，代价相同。与此同时，质量裁决的 fail-closed 是宪法底线，不能为提速而削弱。本需求把两类失败分开：机械的廉价自愈，质量的严格不变。

## 2. 背景、目标与范围

### 背景

- 现有机制：stage-runner 在 verify-code 发布前校验 host 提供的审查 ref 与 stage outcome 内绑定 ref 一致（三个 throw 分支）；task-kernel 的 resolved-review 授权校验链（6 个逻辑环节）任一失败抛笼统错误；stage payload 的 schema/shape 校验只在 handler 边界强制执行。
- 治理约束：公共行为仅七类；私有命令经既有公共行为暴露有先例（artifact/capture-evidence）；旧记录只读；质量事实 fail-closed。
- 相邻能力：wh-review broker 异步化属任务 C；task store 路径与快照哈希规则属任务 B；本任务不重叠。

### 目标

- agent 提交协议无效 payload 前可本地预检，拦截全部历史错误形状；
- 协议错误原地修正重发，不重跑 LLM 审查，且留轻量痕迹；
- verify-code 审查绑定由 runtime 自动派生，agent 不提供、不错配；
- close 授权失败时 agent 能直接读到哪一环不通过、期望什么、实际是什么；
- 质量失败与 unavailable 保持 fail-closed，可被正向验证未削弱。

### 范围内

- 错误分层（白名单 + 默认保守）与原地重发恢复语义；
- verify-code 绑定自动派生与 host 提供值的诊断性处置；
- 提交前预检私有命令（复用既有 schema 校验，零副作用）；
- close 授权校验链结构化诊断；
- build-code 同款协议错误（SCHEMA_VALIDATION_FAILED、acceptance_coverage 形状）纳入同一分层；
- 协议错误痕迹事实；
- 契约测试成对与旧记录只读兼容 fixture。

> 非目标只在第 10 节维护。

## 3. 用户场景与状态覆盖

> 本功能的"用户"是运行 WorkflowHub 的主会话 agent；任务 owner（人）通过更少的中断和更清楚的报错受益。

### SCN-001：提交前预检拦下填表错误

- **角色**：主会话 agent
- **Given**：agent 准备发布 build-code/verify-code 阶段结果，payload 中含历史出现过的错误形状（如 review_track 类型错误、receipt 多字段）；
- **When**：agent 按工作流指令先调用预检；
- **Then**：预检同步返回失败，指出具体字段、期望形状、实际值；agent 改正后预检通过再提交；全程无 LLM 调用、无外部写入。

### SCN-002：verify-code 绑定自动派生

- **角色**：主会话 agent
- **Given**：verify-code 代码审查已完成，且当前 task/stage、当前 snapshot/material 下的 Stage Agent outcome 已通过认证，并声明唯一的 `dsh-code-review` ref/hash；
- **When**：agent 发布阶段结果，**不提供**任何绑定 ref；
- **Then**：runtime 从当前已认证 Stage Agent outcome 派生该 ref/hash，写入本次新发布的 binding 位置；close 消费同一值；两者精确相等。
- **边界**：本场景不宣称 review attempt/result 自身带有 invocation provenance；跨 invocation 的 review-level 归属属于延期事项。host 若提供 ref 仅作等值断言，不得覆盖派生值。

### SCN-003：协议错误原地修正重发

- **角色**：主会话 agent
- **Given**：发布时仍触发白名单内协议错误（如 acceptance_coverage 形状错误）；
- **When**：agent 按诊断改正 payload 后重发；
- **Then**：发布成功；LLM 审查内容未重跑；facts 中留一条轻量痕迹（错误类型+已原地修复）；阶段质量结论不受痕迹影响。

### SCN-004：质量失败仍然拦

- **角色**：主会话 agent、任务 owner
- **Given**：审查返回 actionable serious finding，或审查 unavailable；
- **When**：阶段收尾；
- **Then**：与改造前完全一致：finding 未处置则 incomplete，unavailable 不是 pass；分层机制不产生任何放行。

### SCN-005：close 授权失败可诊断

- **角色**：主会话 agent
- **Given**：close 授权校验链某一环不通过（如 outcome 已不是 current、hash 不匹配、finding 未全覆盖）；
- **When**：agent 发起授权；
- **Then**：错误包含结构化诊断：失败环节名、期望值、实际值；agent 针对该环修复后重试，不整轮重来。

### SCN-006：旧记录只读兼容

- **角色**：任务 owner、审计者
- **Given**：改造前产生的旧 stage outcome、旧失败事实、旧授权记录；
- **When**：新逻辑运行；
- **Then**：旧记录字节、哈希、可读性不变；新逻辑只作用于新执行；任何修复只追加不回写。

### 状态覆盖清单

- [x] **默认态**：SCN-001/002/003
- [x] **空态**：SCN-002（agent 不提供 ref 的默认路径）
- [x] **错误态**：SCN-004/005
- [ ] **加载态**：N/A — 预检与发布均为同步本地操作，无加载交互
- [x] **取消态**：N/A — 无中途取消语义；发布失败即停止，无可取消子任务
- [x] **边界态**：SCN-003（白名单边界）、AC-CLASS-001（未列名错误默认质量失败）
- [ ] **权限态**：N/A — 无新权限面；预检为私有命令，授权仍走既有 confirm/authorize
- [x] **竞态**：SCN-002（派生与发布同一快照内完成，快照变化即失败而非错绑）；SCN-006（先到先得不可变发布语义不变）

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：verify-code 绑定类错误在三任务中反复出现（requires bound/is not bound/does not match/receipt fields），占 verify-code 失败多数。
  - **status**：`verified`
  - **证据或来源**：`~/Knowledge/Projects/workflowhub/lessons/verify-code.jsonl` 与 `~/Knowledge/Projects/PaperBuilder/lessons/verify-code.jsonl` 逐条统计；decision-log F-001
  - **关联**：FR-BIND-001、AC-BIND-001
- **PFACT-002**：build-code/build-plan 的 SCHEMA_VALIDATION_FAILED 与 acceptance_coverage 形状错误反复出现且为机械错误。
  - **status**：`verified`
  - **证据或来源**：两项目 lessons build-code.jsonl/build-plan.jsonl；decision-log F-001
  - **关联**：FR-CLASS-003、AC-EXEC-002/003
- **PFACT-003**：close 授权校验链有 6 个环节，当前任一失败抛笼统错误，f17 因此从未关闭。
  - **status**：`verified`
  - **证据或来源**：runtime/task/task-kernel-implementation.mjs:142-228 直读；PaperBuilder lessons verify-code.jsonl:3
  - **关联**：FR-DIAG-001、AC-DIAG-001
- **PFACT-004**：handler 边界存在可抽取的纯 payload envelope 与 acceptance_coverage shape 校验子集；完整 handler 校验还依赖任务记录、当前 worktree/material 和已认证 receipt，不能由 payload-only 预检复现。
  - **status**：`verified_with_scope`
  - **证据或来源**：runtime/stage/stage-handlers.mjs 的 RECEIPT_KEYS/validReceiptRef/acceptanceCoverageFacts 直读；本任务 build-code 审计
  - **关联**：FR-PREFLIGHT-001（纯子集）
- **PFACT-005**：私有命令经既有公共行为暴露有先例（artifact、capture-evidence、run:reflect 路由模式）。
  - **status**：`verified`
  - **证据或来源**：tools/cli/stage-runtime.mjs 命令白名单与公共路由表直读；decision-log G-002
  - **关联**：FR-PREFLIGHT-002
- **PFACT-006**：协议错误白名单的历史样例可枚举为 verify-code 4 类、close 授权 6 类、build-code/build-plan 5 类；该清单是分类事实，不等于每类已有生产恢复路径。
  - **status**：`verified_with_scope`
  - **证据或来源**：lessons 三文件逐条、task-kernel 校验链直读、本 spec 第 5 节 FR-CLASS-003 与 P1 fixture；本任务 build-code 审计
  - **关联**：FR-CLASS-003、AC-CLASS-001
- **PFACT-007**：改造前旧记录（stage outcome/失败事实/授权记录）必须只读保留。
  - **status**：`verified`
  - **证据或来源**：AGENTS.md 旧记录只读治理；decision-log D-007
  - **关联**：FR-COMPAT-001、AC-COMPAT-001

## 5. 功能需求

### 错误分层与恢复（CLASS）

把"填表错"和"质量差"分成两类事实，给前者一条廉价的原地恢复路径，给后者保留原有的严格语义。agent 不再需要为机械错误支付整轮 LLM 执行。

- **FR-CLASS-001**：协议错误原地修正重发。白名单内的协议错误在发布边界被识别后，返回结构化诊断（错误类型、字段、期望形状、实际值）；agent 改正后重发即可成功；LLM 审查内容、已认证事实不因此重跑或失效。
  - **范围边界**：仅发布/记录边界的协议错误；不含质量裁决、不含 handler 内部业务失败。
  - **依据**：D-003、PFACT-001/002
  - **场景**：SCN-003
  - **验收**：AC-EXEC-001
- **FR-CLASS-002**：默认保守分类。错误类型判定规则硬编码于 runtime 常量；凡未列入白名单的错误类型，一律按质量失败处理（拦），不得以配置或其他途径放宽；白名单的每次变更都是代码评审对象。
  - **范围边界**：判定规则为常量+契约测试；不引入配置文件、开关或环境变量。
  - **依据**：D-010、RISK-001
  - **场景**：SCN-003、SCN-004
  - **验收**：AC-CLASS-001
- **FR-CLASS-003**：协议错误白名单枚举（唯一权威清单，源自 lessons 历史样例，并包含一个仅供发布瞬态故障测试/适配器使用的显式 `stage_publication_transient` 类）：
  - verify-code 绑定类：①提供了审查 ref 但无 stage outcome；②有 outcome 但 outcome 未绑定审查 ref；③两 ref 不匹配；④receipt 含未声明字段（如 tests）；
  - close 授权链类（6 环节）：①授权未绑定 verify-code outcome；②outcome ref/hash 不匹配；③outcome 非 current/completed；④未绑定当前审查证据；⑤审查结果 hash/identity 不匹配；⑥actionable finding 缺合法 disposition 或未全覆盖；
  - build-code/build-plan schema 类：①review_kind 枚举错误；②review_track 类型错误；③acceptance_coverage 与当前 spec 验收集不匹配；④acceptance_coverage 状态词非法；⑤未覆盖项携带证据/证据引用无效。
  - **范围边界**：清单即全部；新增类型必须改代码过评审并补 lessons 证据。`stage_publication_transient` 是本任务为真实发布 seam 注入/适配而显式登记的唯一瞬态类，不把任意未知发布错误或 `EEXIST` 视为可重试。
  - **依据**：D-002、D-010、PFACT-006
  - **场景**：SCN-003
  - **验收**：AC-CLASS-001、AC-EXEC-002、AC-EXEC-003
- **FR-CLASS-004**：协议错误痕迹事实。每次协议错误在同一次调用内成功完成纯 publication 重试后，在任务 facts 中留一条轻量记录（阶段、错误类型、发生时间、已原地修复）；痕迹不影响阶段质量结论，不作为 incomplete 依据，也不可静默省略。
  - **范围边界**：仅复用既有 task-fact.v1 十字段和 `appendTaskFact` 原子追加；`task_id` 由已认证 task root 注入，`material_digest` 使用既有四材料 `materialRevisionFromValues` 的 `revision-` 后 64-hex，`content_hash` 使用既有 `canonicalJson` 对 stage/class_id/occurred_at/status 四字段 trace payload 的 SHA-256（`occurred_at=created_at`），`output_ref` 固定为 `facts.jsonl`；append 返回的 ref、sha256 与 `index.json` 条目是新增行的权威定位和行哈希。不得新建独立账本、schema 字段、companion record 或质量 fact，不进入质量结论。若十字段无法在不改变既有 facts API 的前提下承载该语义，则停止退回规划，不发明新映射。
  - **依据**：D-016
  - **场景**：SCN-003
  - **验收**：AC-TRACE-001

### 绑定自动化（BIND）

verify-code 的审查结果与 stage outcome 的绑定关系由 runtime 在记录时自动派生，agent 从"猜对齐"中彻底解放。

- **FR-BIND-001**：绑定自动派生。verify-code 发布时，runtime 仅以**当前已认证 Stage Agent outcome** 中声明的 `dsh-code-review` 审查 ref/hash 为权威来源，把该规范 pair 派生写入本次新发布的 binding 位置；agent 不需要、也不应该提供该 ref；close 消费同一派生值，二者精确相等。
  - **范围边界**：来源 outcome 必须已经通过同 task、verify-code、当前 snapshot/material、manifest、step/skill 执行和 stage-review 结构的认证；必须存在且只声明一组完整 ref/hash。缺 outcome、认证失败、缺 ref/hash、ref/hash 不完整或 outcome 中无法唯一确定 canonical `dsh-code-review` 时，拒绝本次绑定并保留 `unavailable/incomplete` 诊断，不派生、不伪造绑定；这只限制本次质量 publication/完成判据，不阻止当前 task 继续执行、修复或补证据。只有 task/worktree/runtime 身份、payload 结构和核心 publication 写边界错误可以 fail-loud。review attempt/result 本身不新增 invocation 字段；跨 invocation 的 review-level provenance 延期。
  - **依据**：D-012、PFACT-001
  - **场景**：SCN-002
  - **验收**：AC-BIND-001
- **FR-BIND-002**：host 提供值的诊断性处置。agent 若仍提供绑定 ref：与 outcome 派生值一致则幂等接受；不一致则拒绝并给出协议错误诊断（期望=outcome 派生值，实际=host 提供值），不静默覆盖派生值。
  - **范围边界**：仅诊断与拒绝；不以 host 值替代派生值。
  - **依据**：D-005、FND-DD03
  - **场景**：SCN-002
  - **验收**：AC-BIND-002

### 提交前预检（PREFLIGHT）

给 agent 一个"提交前自查"的本地工具，把 handler 边界的 schema 拒绝提前到提交之前，消除试错循环。

- **FR-PREFLIGHT-001**：预检命令。提供 stage payload 预检私有命令：输入为待提交的阶段 payload（JSON 文件），只复用 handler 的纯 payload envelope 与 acceptance_coverage shape 校验；输出契约固定——通过=退出码 0 且无诊断；协议无效=退出码 2 + stdout 结构化诊断数组（字段路径、期望形状、实际值）；命令自身错误=退出码 1。预检与正式提交的等价性只覆盖这组纯校验，不覆盖 receipt 存在/hash、当前 snapshot/material、Stage Agent outcome 或 review 绑定认证。
  - **范围边界**：只读输入 JSON；零任务存储/worktree/material/review/invocation 读取，零外部写入、零 LLM/network/子进程调用；不得把纯预检结果当成质量通过或提交许可。
  - **依据**：D-015、PFACT-004（修订）
  - **场景**：SCN-001
  - **验收**：AC-PREFLIGHT-001、AC-PREFLIGHT-002
- **FR-PREFLIGHT-002**：暴露方式与工作流指令。预检为私有命令，经既有公共行为暴露（不新增公共行为类）；build-code/verify-code 的工作流技能增补一句"提交前先预检"指令。
  - **范围边界**：仅命令路由与一句技能指令；预检不成为新质量门——它拦截的只是 handler 本来就会拒绝的协议无效 payload。
  - **依据**：D-006、PFACT-005、FND-DD01
  - **场景**：SCN-001
  - **验收**：AC-PREFLIGHT-002

### close 诊断（DIAG）

- **FR-DIAG-001**：授权校验结构化诊断。close 的 resolved-review 授权校验链任一环节失败时，错误携带结构化诊断：失败环节名（六个逻辑桶之一）、该环期望值、实际值；按既有 fail-fast 顺序只报告第一个失败，不收集后续依赖检查；agent 可针对该环修复后重试。physical close 的计划/确认/五项不可逆操作授权不属于这六个逻辑桶。
  - **范围边界**：仅诊断输出增强；校验标准本身一项不放宽；physical close 的 commit/merge/archive/push/cleanup 五项授权流程不改。
  - **依据**：D-014、PFACT-003
  - **场景**：SCN-005
  - **验收**：AC-DIAG-001

### 兼容（COMPAT）

- **FR-COMPAT-001**：旧记录只读。新逻辑只作用于新执行；改造前的旧 stage outcome、失败事实、授权记录的**原始字节与内容哈希**不变、可读性不变；痕迹与新事实一律通过既有 `appendTaskFact` 追加为 facts.jsonl 新行，`output_ref` 为 `facts.jsonl`，并以返回的 ref（格式为 facts.jsonl#行号）、sha256 及对应 `index.json` 条目作为新增行的权威定位和行哈希，绝不修改旧记录字节流；契约测试含旧格式 fixture。
  - **范围边界**：只读兼容分支；不做旧记录迁移或修复工具。
  - **依据**：D-007、PFACT-007
  - **场景**：SCN-006
  - **验收**：AC-COMPAT-001

## 6. 模块划分

> 只写产品职责，不写实现类名。

### 错误分类器

- **负责什么**：把发布边界的错误判定为协议错误（白名单）或质量失败（默认）。
- **对外提供什么**：分类结果 + 协议错误的结构化诊断。
- **依赖谁**：FR-CLASS-003 白名单常量。
- **测试边界**：每类历史错误归对类；未列名错误归质量失败。

### 绑定派生器

- **负责什么**：verify-code 发布时派生审查绑定 ref 并处理 host 提供值。
- **对外提供什么**：stage outcome 内的权威绑定；host 不一致输入的诊断拒绝。
- **依赖谁**：当前 task/stage、snapshot/material 和 manifest 已认证的 Stage Agent outcome；不枚举或修改 review 存储。
- **测试边界**：派生值与 close 消费值精确相等；无审查记录时不伪造。

### 预检器

- **负责什么**：提交前本地校验阶段 payload。
- **对外提供什么**：通过/失败 + 字段级诊断 + 固定退出码。
- **依赖谁**：既有 schema 校验规则。
- **测试边界**：拦截可表达为纯 payload 的历史错误形状；明确不覆盖 record-backed 认证；零副作用。

### 诊断器

- **负责什么**：close 授权链失败的结构化输出。
- **对外提供什么**：环节名 + 期望值 + 实际值。
- **依赖谁**：既有校验链（不放宽）。
- **测试边界**：resolved-review 六个逻辑桶各有一次首个失败可诊断样例；不测试多失败聚合；physical close 五项不可逆授权链不在本次诊断范围。

## 7. 关键实体

- **协议错误白名单条目**：包含错误类型标识、适用阶段、匹配规则、诊断模板；权威来源为 runtime 常量。
- **绑定派生记录**：包含 stage outcome 绑定 ref/hash、当前已认证 Stage Agent outcome 的 canonical dsh-code-review ref/hash 派生来源和快照/material 标识；只在当前新发布中派生，不扩展 review attempt/result provenance。
- **痕迹事实**：包含阶段、错误类型、发生时间和处置=已原地修复；轻量，不入质量结论。
- **诊断负载**（wire contract，close 与预检共用形状）：诊断记录包含 check_id、expected、actual 三字段；close 的 resolved-review 校验按既有 fail-fast 顺序只返回第一个失败诊断，不聚合后续依赖检查；六个逻辑桶与顺序为：`bind_outcome`（授权/主体未绑定 outcome）→ `outcome_ref`（ref/hash/记录读取或解析不匹配）→ `outcome_current`（非 current/completed）→ `review_binding`（outcome 中缺失或输入未绑定当前审查证据）→ `review_identity`（审查结构/hash/identity 不匹配）→ `finding_coverage`（finding 缺合法 disposition/未全覆盖）。预检诊断标识为字段路径；physical close 五项不可逆操作授权不使用这组六桶。

## 8. 数据和生命周期

- 白名单：代码常量，随版本演进，变更=代码评审+契约测试+lessons 证据。
- 绑定 ref：内容寻址，不可变；只从当前已认证 Stage Agent outcome 派生并在本次发布瞬间写入新 outcome，不回写旧 outcome；review attempt/result schema/storage 不变。
- 痕迹 facts：只在 publication retry 成功后调用既有 `appendTaskFact` 一次；append/index 失败按 facts writer 原有错误返回，不重试 publication、不重跑 handler/LLM，也不伪称痕迹已持久化；append 返回的 ref 与 sha256 是该新行的证据定位。
- 痕迹事实：追加写入任务 facts，只增不改。
- 旧记录：只读，永久保留，无迁移。

## 9. 兼容性预留

- 旧格式 stage outcome/授权记录：只读兼容，契约测试 fixture 钉死。
- host 仍提供绑定 ref 的旧习惯：FR-BIND-002 诊断路径，不破坏执行。
- 预检未接入前的工作流：行为不变（预检是提前发现问题，不改变 handler 语义）。

## 10. 明确不做与默认必须成立

- 公共行为七类枚举（AC-NONGOAL-001 的核对基准）：`doctor`、`status`、`run`、`review`、`verify`、`confirm`、`authorize`——本任务不新增、不删除、不改语义。
- 不做：①质量 fail-closed 语义任何放宽；②wh-review broker 异步化（任务 C）；③task store 路径/快照哈希规则（任务 B）；④新增公共行为类；⑤跨调用断点续跑/恢复框架或 retry token；⑥review attempt/result invocation provenance；⑦白名单配置化；⑧旧记录迁移工具；⑨新增 facts 账本、字段、companion record 或 quality fact。
- 默认必须成立：质量失败与 unavailable 仍是 incomplete/不是 pass；公共行为仍七类；旧记录只读；分层判定默认保守；五个 stage 的 `run` 只以四份当前材料决定能否继续，任何上游 completion/outcome 缺口只能进入 quality/product-release 诊断，不能变成当前 stage 的执行门禁或 `rerun` 动作。

## 11. 验收标准

> 每条 AC 含方法、通过 oracle、失败条件、证据类型。全部 AC 的可证伪性经两轮异源审查加固（FND-D01~D05、FND-DD01~DD04）。

- **AC-EXEC-001**（FR-CLASS-001，分层矩阵）：
  - 方法：契约测试重放 FR-CLASS-003 全部白名单错误样例 + 一组质量失败/unavailable 样例。
  - 通过：每个可在合法 handler result 后归类为 publication 协议错误的样例，在同一次 `runStage` 调用内最多纯 publication 重试一次，且断言：①handler/LLM 只调用一次；②重试仍使用同一执行/stage 身份；③已成功步骤不重复执行；④既有已认证结果字节不被覆盖；⑤verify-code 与 close 各有独立场景。每个质量失败/unavailable 样例=仍 incomplete/不通过，无任何放行路径；重试失败不伪造 repaired fact。
  - 失败：任一白名单样例触发整阶段重跑、重复执行已成功步骤、或覆盖既有结果；任一质量样例被放行。
  - 证据：契约测试输出 + facts 痕迹。
- **AC-EXEC-002**（FR-CLASS-003，build-code schema 类）：
  - 方法：重放 build-code 的 SCHEMA_VALIDATION_FAILED（review_kind 枚举/review_track 类型/receipt 字段）历史样例；仅对已产生合法 handler result 后的 publication 失败断言 retry。
  - 通过：原地修正重发成功，不重跑 LLM。
  - 失败：触发整阶段重跑或错误无法定位。
  - 证据：契约测试输出。
- **AC-EXEC-003**（FR-CLASS-003，acceptance_coverage 类）：
  - 方法：重放 acceptance_coverage 三类历史样例（不匹配/状态词非法/未覆盖项带证据）。
  - 通过：同上。
  - 失败：同上。
  - 证据：契约测试输出。
- **AC-CLASS-001**（FR-CLASS-002，默认保守）：
  - 方法：专项测试——构造一个不在白名单的新错误类型。
  - 通过：被按质量失败处理（拦）；白名单为代码常量且无配置覆盖途径。
  - 失败：未列名错误被当协议错误放行；存在配置化放宽路径。
  - 证据：契约测试输出 + 常量审查。
- **AC-BIND-001**（FR-BIND-001，状态级绑定）：
  - 方法：verify-code 发布集成测试，host 不提供 ref。
  - 通过：runtime 从已认证、当前且 completed 的 verify-code Stage Agent outcome 中唯一 canonical `dsh-code-review` ref/hash 派生并写入 binding；close 消费同一值；缺 outcome、认证失败、缺 ref/hash、不完整 pair 或无法唯一确定 canonical dsh review 均诊断拒绝且不派生。该 AC 不声称 review attempt/result 自身含 invocation provenance。
  - 失败：绑定缺失、错绑、宿主猜值参与，或任一负向 fixture 被派生。
  - 证据：集成测试输出 + outcome 记录。
- **AC-BIND-002**（FR-BIND-002，负向）：
  - 方法：host 提供不一致 ref 的负测试。
  - 通过：拒绝+协议错误诊断（期望=派生值，实际=提供值）；派生值不被覆盖。host 提供一致 ref：幂等接受。
  - 失败：host 值静默生效或无诊断。
  - 证据：契约测试输出。
- **AC-PREFLIGHT-001**（FR-PREFLIGHT-001，fixture 覆盖）：
  - 方法：对可表达为 payload 的 build-code/verify-code envelope 与 acceptance_coverage shape 错误 fixture 逐个预检。
  - 通过：纯 payload 错误全部拦截，失败退出码为 2，诊断字段契约（字段路径/期望/实际）完整；合法纯 payload 退出码为 0 且无诊断；与正式 handler 的等价性只覆盖相同纯校验子集，不把 record-backed 检查当作已覆盖。
  - 失败：任一样例漏拦、诊断缺字段，或预检声称完成 receipt/currentness/review 认证。
  - 证据：fixture 清单 + 测试输出。
- **AC-PREFLIGHT-002**（FR-PREFLIGHT-002，顺序与副作用）：
  - 方法：工作流技能文本检查 + 预检进程监测。
  - 通过：build-code/verify-code 技能含"提交前先预检"指令；预检执行零外部写入、零 LLM 调用（无网络/子进程 LLM 痕迹）；预检经既有公共行为暴露，公共行为仍七类。
  - 失败：预检有隐写副作用或新增公共行为类。
  - 证据：技能 diff + 进程/写监测事实。
- **AC-DIAG-001**（FR-DIAG-001，close 六环节）：
  - 方法：对 resolved-review 授权链六个逻辑环节各构造一个失败样例。
  - 通过：每个失败按既有顺序只输出第一个结构化诊断（环节名+期望值+实际值）；校验标准未放宽；physical close 的五项不可逆操作授权保持既有行为。
  - 失败：任一环节仍抛笼统错误。
  - 证据：契约测试输出。
- **AC-TRACE-001**（FR-CLASS-004，痕迹）：
  - 方法：触发协议错误并原地修复后检查 facts。
  - 通过：存在轻量痕迹（阶段+错误类型+已原地修复）；阶段质量结论不含该痕迹影响；无静默省略。
  - 失败：痕迹缺失或弄脏质量结论。
  - 证据：facts 记录 + 阶段结论。
- **AC-COMPAT-001**（FR-COMPAT-001，旧记录不变量）：
  - 方法：旧格式 fixture 回归 + 修复路径审计。
  - 通过：分项断言——①旧记录原始字节哈希不变；②旧记录可读性不变（旧 fixture 可解析）；③新痕迹在新记录中可见且可关联。三条各自独立判定。
  - 失败：任一旧记录字节被改写，或痕迹无处可见。
  - 证据：fixture 哈希对比 + 测试输出。
- **AC-NONGOAL-001**（第 10 节，范围漂移）：
  - 方法：交付审查清单。
  - 通过：无新公共行为类；无 fail-closed 放宽；无 checkpoint/recovery 机制；无白名单配置化；任务 B/C 边界文件零改动。
  - 失败：任一非目标被违反。
  - 证据：diff 审计 + 公共行为面检查。

## 12. 风险、未决与交接

| risk/open_id | 内容 | 触发/后果 | 处理/owner/关闭条件 |
| --- | --- | --- | --- |
| RISK-001 | 分层误判把质量问题错标为协议错误 | 白名单设计错误 | FR-CLASS-002 默认保守兜底；关闭条件=AC-CLASS-001 通过 |
| RISK-002 | 绑定自动派生少一层人工交叉验证 | 已认证 outcome 本身若错误声明 review ref 仍可能错绑 | AC-BIND-001/002 钉死 outcome 认证、唯一 pair 和 host 等值断言；review-level invocation provenance 明确延期 |
| RISK-003 | 预检与 handler 校验规则漂移 | 纯预检只覆盖 handler 的一个子集，record-backed 规则不可见 | 纯校验函数由 handler/preflight 共用；AC-PREFLIGHT-001 明确等价性范围；record-backed 检查继续由正式发布负责 |
| OPEN-001 | DSH 宿主 session-event/spec-analyze 官方认证位不可用 | 宿主能力缺口 | 本任务全程如实记 missing/unavailable；根治属任务 B |
| DE-001 | wh-review broker 异步化 | 任务 C | 任务 C owner |
| DE-002 | task store 路径/快照哈希治理 | 任务 B | 任务 B owner |

## 13. 业务影响与回归范围

- **受益**：verify-code/close/build-code 的协议类失败成本从"整轮 LLM"降为"一次本地重发"；agent 工作流指令更短（不用学绑定对齐）。
- **回归面**：stage-runner 失败通道、verify-code 绑定分支、close 授权校验链、stage-runtime 命令白名单、既有契约测试——全部需保持绿；旧任务记录读取不受影响。

## 14. UI 合同事实

`N/A — decision-log UI applicability=non_ui（三源事实均判定无页面/前端改动，decision-log 已记录 machine-readable fact）。`

## 15. 简洁与方向自查（simplicity-guard / plan-ceo-review，inline lens）

- **P0 需要存在吗**：需要——lessons 实测故障（PFACT-001/002/003），非 YAGNI。
- **P1 已有覆盖**：预检复用既有 Ajv schema（不重写校验）；绑定派生复用既有审查记录 ref（不新建存储）；诊断复用既有校验链（不放宽）。
- **P2 复用改造**：stage-runtime 私有命令模式（先例 artifact/capture-evidence）直接沿用。
- **P3 新增**：仅四处——白名单常量、派生逻辑、预检命令路由、诊断负载；无可再删项。
- **CEO 视角**：最窄范围=只修机械错误通道，不碰质量语义；前提=白名单可完整枚举（PFACT-006 verified）；方向替代=只加工具不改契约已被决策拒绝（D-001 拒绝项）；最大风险=RISK-001 已有兜底。

## 16. 独立审查事实与处置

- **传输事实**（2026-09-02，build-spec 冻结审查）：status=available，outcome=completed，minimum_heterologous=1 满足；material_id=27f3e66a…9527eacd。provider：antigravity/flash=completed（0 findings）、codex/luna=completed（6 findings，anchor 全 true）；**grok/grok=failed/PROVIDER_IDENTITY_INVALID**（原始错误保留，不改写）。advice only，不当 pass。

| finding_id | 原始事实/来源 | status | next_action |
| --- | --- | --- | --- |
| FND-S01 | codex/luna major：白名单与七类行为只有计数没有逐项清单 | fixed | spec §10 枚举七类行为；FR-CLASS-003 白名单逐项（送审摘要曾压缩）；AC 映射齐备 |
| FND-S02 | codex/luna major："原地重发"缺状态不变量（同执行/步骤不重复/不覆盖既有结果），缺 verify-code/close 重放场景 | fixed | AC-EXEC-001 增加五条状态断言与两阶段独立重放场景 |
| FND-S03 | codex/luna major：绑定权威记录选择不确定（多条/过期/跨执行未定义） | superseded_by_D012 | D-012 将来源收窄为当前已认证 Stage Agent outcome 的唯一 canonical dsh-code-review ref/hash；review-level invocation provenance 与跨记录选择延期 |
| FND-S04 | codex/luna major：预检 wire contract 未定（入口/输入输出/退出码/等价性） | superseded_by_D015 | D-015 将等价性收窄为纯 payload envelope/acceptance shape 子集，并明确零 task/worktree/material/review/invocation side effect |
| FND-S05 | codex/luna major：close 诊断缺机器可消费 schema | superseded_by_D014 | §7 保留六个固定逻辑桶与顺序，但明确按 fail-fast 只返回首个诊断记录（字段为 check_id、expected、actual），不做聚合 |
| FND-S06 | codex/luna major："只追加"与"哈希不变"表面矛盾 | superseded_by_D016 | FR-COMPAT-001/AC-COMPAT-001 保留旧记录只读；D-016 进一步固定痕迹使用既有 facts 十字段 API，不新增账本或字段 |

## 17. 阶段收口校验（spec-analyze，2026-09-02）

- **Clarify 记录**：spec-clarify trigger=false，理由：全部材料歧义已在 make-decision 三轮 Talk 收敛（T-001~T-010 真实回复），无材料歧义，开放方向性问题=0。
- **spec-research 记录**：skipped，理由：所需接口/数据/兼容事实均已核实（PFACT-001~007 verified，源码锚点直读）。

镜头：build-spec packet（原始需求 + decision-log + 本 spec）。逐条核对：D-001~D-016 均有当前 FR/AC 或明确非目标/计划承载；R-001~R-005 在来源映射表中无孤儿；旧审查 finding 的后来 scope reduction 已由 D-012~D-016 标注 superseded；非目标与 DE/OPEN 均有 owner 去向。语义检查（非 ID 存在性）：同次 publication-only retry 有状态不变量；绑定来源是当前已认证 Stage Agent outcome；预检仅纯 payload 且零副作用；诊断是首个失败；trace 只能复用既有十字段 facts API；兼容不变量无自相矛盾。

### 六段大白话总结

1. **本阶段做了什么**：根据 D-001~D-016 将功能收窄为同次 publication-only retry、authenticated-outcome binding、first-failure resolved-review diagnostics、pure payload preflight 和既有十字段 trace。
2. **需求覆盖**：当前 FR/AC 与决策、风险和延期项双向可追溯；D-012~D-016 的范围收窄均有明确边界和 STOP 条件。
3. **上游一致性**：不发明 review-level invocation provenance、跨调用 recovery、facts 新 schema/账本或新公共行为；质量 fail-closed 保持。
4. **当场修复**：移除同 invocation review-record 选择、多失败聚合、完整 handler 等价性等过宽承诺，并标注旧 finding 的 superseded 状态。
5. **剩余风险**：RISK-001~004（各有 AC 兜底）；OPEN-001（DSH 官方认证位缺失，如实保留）。
6. **下游边界**：build-plan 可直接消费当前 FR/AC/场景/wire contract；不得自行猜测：白名单内容（FR-CLASS-003）、outcome 派生规则（FR-BIND-001）、预检纯子集/退出码（FR-PREFLIGHT-001）、首个失败 check_id 顺序（§7）、既有十字段 trace mapping（FR-CLASS-004）。
