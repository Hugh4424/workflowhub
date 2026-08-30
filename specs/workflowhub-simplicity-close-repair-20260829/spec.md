# 功能规格：workflowhub close 机制修复与框架减法

> 基于已接受的需求来源。本文件只写产品问题、行为、边界和验收，不写文件路径、代码符号或工程命令。

- **功能名**：workflowhub close 机制修复与框架减法
- **来源**：specs/workflowhub-simplicity-close-repair-20260829/decision-log.md（R-001~R-014、D-001~D-010、AC-01~AC-06、范围与非目标、风险）与 docs/adr/0020-close-five-actions-quality-transcription.md
- **状态**：已批准
- **内容格式**：spec-content.v3

## 速读卡（30 秒）

- **一句话需求**：让按官方路径执行的 workflowhub 任务在 verify-code 结束后，能正常完成提交、合并、归档、推送、清理这五个收尾动作，而不是被迫 risk close；同时把框架里冗余的控制面和死路代码删掉，让 workflowhub 重新变回简洁优雅的开发框架。
- **核心改动点**：
  - close 回归"五个动作 + 一次人工确认"的朴素定义，删除 risk close 平行机制。
  - 质量状态由 verify-code 负责，close 只如实抄写，不漂白、不裁判。
  - 错误发现点左移到写边界与 review 调用前；子代理崩溃必须留占位证据。
  - 支持 DSH 等非 Codex 宿主会话；只评估双轨事实，不合并结构。
- **最大影响面**：所有使用 workflowhub 官方路径关闭任务的开发者；现有 close 脚本、workspace 清理逻辑、review 入口错误处理、session 宿主适配。
- **验收信号**：本任务自身能正常 close；close 相关 contract/integration 测试全绿；不新增公共 runtime 命令、新持久对象或新控制面。

### 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001 | D-001、D-009 | N/A — 任务组织约束 | covered | T-001 确认：单任务执行，不拆分 |
| R-002 | D-001 | N/A — 流程约束 | covered | 五阶段不跳阶段 |
| R-003 | D-001 | N/A — 流程约束 | covered | 需求在 make-decision 收敛，不依赖 build-spec 补需求 |
| R-004 | D-009 | FR-CLOSE-001~005、FR-LEFT-001~005、FR-SUB-001~003、FR-EVAL-001 | covered | 先修一致性再做减法 |
| R-005 | D-002 | FR-CLOSE-001~005、AC-01、AC-02 | covered | close 阻塞修复 |
| R-006 | D-003、D-008 | AC-03、FR-CLOSE-001~005、FR-LEFT-001~005 | covered | 修复需过宪法检查 |
| R-007 | D-003、D-008 | AC-03、AC-04 | covered | 修复方案合宪性 |
| R-008 | D-001 | N/A — Talk 形式约束 | covered | Talk 用大白话说明选项、后果、风险 |
| R-009 | D-003 | N/A — 记录约束 | covered | decision-log 记录原始需求、关键事实、选择、理由、交接 |
| R-010 | D-009 | FR-LEFT-001~005、FR-SUB-001~003、FR-EVAL-001、AC-05、AC-06 | covered | 提高执行质量与效率 |
| R-011 | D-003 | AC-03 | covered | 基于事故文件 + 实现 + 宪法的既有分析 |
| R-012 | D-010 | FR-PORT-001、FR-SUB-002、AC-06 | covered | DSH 宿主快照限制已消除 |
| R-013 | D-009、D-010 | AC-04、FR-SUB-001~003 | covered | 不新增概念/对象，优先做减法 |
| R-014 | D-002 | FR-CLOSE-001~005、AC-01、AC-02 | covered | close 朴素定义落地 |
| AC-01 | D-002、D-003 | FR-CLOSE-001~005 | covered | dogfood close 验收 |
| AC-02 | D-002、D-003 | FR-CLOSE-001~005 | covered | close 机制测试验收 |
| AC-03 | D-003、D-008 | 所有 FR | covered | 宪法依据与 checklist 同步 |
| AC-04 | D-009、D-010 | 所有 FR | covered | 不新增控制面验收 |
| AC-05 | D-007、D-009 | FR-LEFT-001~005 | covered | 左移防护测试验收 |
| AC-06 | D-009、D-010 | FR-SUB-001~003、FR-PORT-001、FR-EVAL-001 | covered | 减法与移植交付判定 |

每条 FR/AC 都可通过上表回到决策来源；范围修订只追加受影响映射和修订备注，不另建需求账本。

## spec-clarify

spec-clarify: trigger = false, reason = "make-decision 已锁定 Q1-Q7 与 T-009~T-012，build-spec 未引入新材料歧义", open_direction_changing_questions = 0

## 1. 问题与紧迫性

workflowhub 最近进入收尾阶段时"关不了门"：任务 verify-code 之后，提交、合并、归档、推送、清理这五个收尾动作从未正常跑通过，每次都要被迫以 risk 模式强行关闭。根因不是某个具体 bug，而是 close 在实现里兼任了太多角色——质量裁判、风险登记员、完成宣称者——导致正常 close 路径事实上不可达。

同时框架侧的控制面、兜底逻辑和重复概念越堆越多，用起来像工程模板而不是顺手工具。用户明确要求：修复 close 阻塞、让收尾回归朴素定义，并且做减法而非加新概念。问题紧迫，因为当前每个任务都要承担 risk close 的事实失真与额外人工收尾成本。

## 2. 背景、目标与范围

### 背景

- ADR 0018 曾把 close 定为唯一完整交付动作并要求"全部物理事实成立后才写 completed.json"。
- 实践中该要求与 `workspace_mode=existing`（绑定已有工作目录）自相矛盾：existing 目录不是任务创建的，删除被禁止，于是 existing 任务永远无法正常 close。
- close 实现里又叠加了质量裁判（质量缺口自动转 risk）和风险 close 平行机制，导致所有任务只能"强行风险 close"。
- 宪法 F3/F4/F7/F9/Q1/Q2 已明确推进资格、发布结构、完成判据、不可逆授权和质量事实的关系，但实现层理解出现偏差。
- ADR 0020 已接受：close 回归五个交付动作，质量状态抄写而非裁判。

### 目标

- 让按官方路径执行的 workflowhub 任务能正常 close（非 risk）。
- close 回归"提交、合并、归档、推送、清理 + 一次人工确认"的朴素定义。
- 质量状态由 verify-code 阶段负责，close 只如实抄写，不漂白、不裁判。
- 统一 close 与 status 的事实新鲜度判定，消除 material-only delta 豁免宽严分裂。
- 把错误发现点左移到写边界与 review 调用前，子代理结果必留证据。
- 精简冗余控制面和死路代码，不新增公共 runtime 命令、新持久对象或新控制面。
- 支持 DSH 等非 Codex 宿主会话；双轨事实只出评估结论，不合并结构。

### 范围内

- close 重新定稿：五个动作 + 一次人工确认；正常/带缺口 close 共用一条路径；删除 risk close 平行机制；清理按现有 workspace_mode 分支；支持断点续跑与 finalize 手工补记。
- 事实新鲜度统一：close 与 status 共用同一判定函数。
- 左移防护包：写边界身份断言、review 统一 preflight、fallback 拆 invalid_input/unavailable、子代理结果契约、code_review 一等事件。
- 宪法解释段与 checklist 同步：在治理边界节加"close 三义"解释段，checklist 加四条判据。
- 减法：close 编排精简、死代码删除/修通、session 宿主可移植化、双轨事实评估（仅出结论）。

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

> 场景覆盖正常、边界、失败和权限路径，并说清“谁、在什么条件下、做什么、看到什么”。

### SCN-001：正常 close

- **角色**：任务执行者。
- **Given**：任务按官方路径完成 verify-code；质量状态为绿；workspace_mode=deterministic；无真实 material drift。
- **When**：执行 close，查看确认清单（显示真实质量状态），一次人工确认后五个动作顺序执行。
- **Then**：
  - completed.json 记录五个物理动作各自的落账记录和一次人工确认绑定。
  - quality_status 与 product_release_status 保持原值，未被漂白。
  - deterministic 工作目录在 realpath/common-dir/branch 三重校验后清理。

### SCN-002：带缺口 close

- **角色**：任务执行者。
- **Given**：verify-code 已完成，但 quality_status=incomplete；workspace_mode=existing（绑定已有工作目录）。
- **When**：执行 close 并确认。
- **Then**：
  - close 正常完成，不转 risk 模式。
  - completed.json 只证物理交付；quality_status 保持 incomplete，product_release_status 保持 not_released。
  - existing 工作目录不删除，cleanup 步骤记为 not_applicable_recorded。

### SCN-003：close 中途失败并恢复

- **角色**：任务执行者。
- **Given**：close 启动后某一步（如合并）失败；人确认授权继续。
- **When**：修复问题后从断点续跑；或在手工完成物理交付后使用 finalize 补记。
- **Then**：
  - 续跑从失败步骤继续执行；已落账的完成步骤跳过并保留原落账记录，不重复落账。
  - finalize 仅核对并补写物理交付事实，不修改 quality_status/product_release_status。

### SCN-004：DSH 等非 Codex 宿主任务

- **角色**：使用 DSH 等非 Codex 宿主的任务执行者。
- **Given**：宿主声明为 dsh；session/transcript 路径不在 Codex sessions 目录。
- **When**：任务 bootstrap 与 close。
- **Then**：
  - 宿主身份被接受；requirement_messages 能正确加载认证消息。
  - close 能正常完成，不因为宿主不是 Codex 而被拒绝。

### SCN-005：review 预检失败

- **角色**：调用 review 的任务执行者或子代理。
- **Given**：调用 review 时存在输入错误（如缺 review_track、缺 direction_selection、forbidden 字段、宿主不支持）或子代理超时/崩溃。
- **When**：review 入口 preflight 或 fallback 处理。
- **Then**：
  - 输入错误（字段/结构错）被分类为 invalid_input 并当场响铃，不落 unavailable 事实。
  - 能力缺失（provider/路由/预览不可得）记 unavailable 事实。
  - 子代理崩溃后产生占位证据并纳入现有 canonical receipt 槽位。

### SCN-006：死代码触发并删除

- **角色**：维护者。
- **Given**：反向引用扫描发现某段代码无消费者（如 risk plan 死路、临时 bridge）。
- **When**：删除或修通该代码。
- **Then**：
  - 扫描证据显示零消费者。
  - 受影响路径的测试仍通过；不引入新对象或新控制面替代被删代码。

### 状态覆盖清单

- [x] **默认态**：SCN-001 — 正常 close 路径。
- [ ] **空态**：N/A — close 前必须有 verify-code 完成事实，不存在空态启动。
- [x] **错误态**：SCN-003、SCN-005 — close 步骤失败与 review 预检失败。
- [ ] **加载态**：N/A — close 执行过程不暴露中间加载状态给用户。
- [ ] **取消态**：N/A — 取消 close 不产生完成事实；需显式重跑或 finalize 补记。
- [x] **边界态**：SCN-002 — 带缺口 close 与 existing 工作目录。
- [x] **权限态**：SCN-003、SCN-004 — 人工确认授权与宿主身份接受。
- [ ] **竞态**：N/A — 本任务不处理并发 close；由工作区绑定保证单一执行身份。

## 4. 产品事实与假设（PFACT）

> 这是 WorkflowHub 在 AgentHub 正文上的事实层。每条只选择一种状态，其他状态字段删除。

- **PFACT-01**：verified — close 阻塞事实
  - **status**：`verified`
  - **证据或来源**：F-001（core/task-close.mjs 恒以 riskClose:true 调 prepare；workspace.mjs:542 existing 模式无条件抛错；risk plan 被 execute/complete 拒收；手工物理完成不写 completed.json；新鲜度拒绝 material-only delta 豁免）。R-005。
  - **owner、影响**：主代理；影响 FR-CLOSE-001~005、AC-01、AC-02。
  - **关联**：FR-CLOSE-001~005、AC-02。

- **PFACT-02**：verified — 用户朴素定义
  - **status**：`verified`
  - **证据或来源**：R-014（用户 Talk round 2 原文："close不就是在verify-code结束之后进行提交、合并、归档、推送、清理动作的步骤吗"；T-008 确认"就按这个办"）。
  - **owner、影响**：用户/主代理；影响 close 行为边界。
  - **关联**：FR-CLOSE-001、AC-01。

- **PFACT-03**：verified — 宪法约束
  - **status**：`verified`
  - **证据或来源**：R-006、R-007；F-003（子代理 C 宪法对照结论：宪法已支持"incomplete 不得宣称完成、禁伪造通过、写边界 fail-loud、 cleanup 独立授权"；实现违宪源于理解偏差）。
  - **owner、影响**：主代理；所有修复必须有宪法依据。
  - **关联**：AC-03、FR-CLOSE-001~005、FR-LEFT-001~005。

- **PFACT-04**：verified — 质量裁判职责与 close 未分离
  - **status**：`verified`
  - **证据或来源**：F-001（close 兼任质量裁判，质量缺口自动转 risk 事实）；R-006、R-007。F-004 workspace 身份机制定位了 existing 放行与 close 清理要求 task-owned 的矛盾，同属 close 职责错位佐证。
  - **owner、影响**：主代理；影响质量状态隔离设计。
  - **关联**：FR-CLOSE-002、AC-01、AC-02。

- **PFACT-05**：verified — DSH 宿主限制已消除
  - **status**：`verified`
  - **证据或来源**：R-012、F-006（DSH transcript 原不被接受；本阶段 DSH transcript 可移植化落地，快照修复为 msg-1/msg-2，content_hash 经 transcript 重放校验一致）。
  - **owner、影响**：主代理；影响 session 宿主可移植化交付。
  - **关联**：FR-PORT-001、FR-SUB-002、AC-06。

- **PFACT-06**：verified — 审查资源与错误发现时机
  - **status**：`verified`
  - **证据或来源**：F-005（无统一 preflight，材料错误调用后才落成 unavailable；fallback 吞错四位置；子代理结果契约空白）；direction/detail 双轨审查已完成（attempt c8721e74、83ad538a）。
  - **owner、影响**：主代理；影响左移防护包设计。
  - **关联**：FR-LEFT-001~005、AC-05。

## 5. 功能需求

> 沿用 AgentHub 的“叙述层 + 编号字段层”：先讲清完整行为，再做机器追溯。

### close 交付域（CLOSE）

本域解决 close 阻塞问题：把 close 从"质量裁判 + risk 登记员"还原为 verify-code 之后的五个物理交付动作，并保证失败后有回头路。

- **FR-CLOSE-001**：close 回归五个交付动作，开始前进行一次人工确认清单。
  - **范围边界**：包含提交、合并、归档、推送、清理五个动作的编排与人工确认；不包含质量裁决、新增 risk close 入口。
  - **依据**：D-002；PFACT-01、PFACT-02；SCN-001、SCN-002、SCN-003；AC-01、AC-02；宪法 F7（不可逆操作独立授权）、F9（可证伪不假绿）、Q2（推进资格、发布结构与完成判据分离）。
  - **场景**：SCN-001、SCN-002、SCN-003。
  - **验收**：AC-01、AC-02。

- **FR-CLOSE-002**：正常 close 与带缺口 close 共用一条路径，删除 risk close 平行机制。
  - **范围边界**：包含恒 risk 入口移除、risk plan 死路删除、质量缺口时不阻塞物理交付；不包含"质量不绿不许 close"的硬门。
  - **依据**：D-002；PFACT-01、PFACT-04；SCN-002；AC-02；宪法 Q1（质量事实不作准入证）、F11（正常执行优先、控制面受限）。
  - **场景**：SCN-002。
  - **验收**：AC-02。

- **FR-CLOSE-003**：清理按现有 workspace_mode 字段分支，框架自建目录才删除，绑定目录只记录。
  - **范围边界**：包含 deterministic/existing 判定、删除前 realpath/common-dir/branch 三重校验；不包含新增 ownership 字段或对象。
  - **依据**：D-004；PFACT-01；SCN-001、SCN-002、SCN-004；AC-02；宪法 F3（写边界 fail-loud）、F7（cleanup 不可逆授权）。
  - **场景**：SCN-001、SCN-002、SCN-004。
  - **验收**：AC-02。

- **FR-CLOSE-004**：close 失败后可断点续跑，手工物理完成可经核对补记 completed.json。
  - **范围边界**：包含失败步骤落账后从该步骤恢复、finalize 仅补写物理交付事实；不包含失败后自动重跑完整 close。
  - **依据**：D-005；PFACT-01；SCN-003；AC-02；宪法 F7（不可逆操作独立授权）、F9（可证伪不假绿）。
  - **场景**：SCN-003。
  - **验收**：AC-02。

- **FR-CLOSE-005**：close 与 status 共用同一事实新鲜度判定。
  - **范围边界**：包含 material-only delta 豁免对齐、真实 material 变化时强制重 verify；不包含新建 current tuple 注册表或 lineage 机制。
  - **依据**：D-006；PFACT-01；SCN-001、SCN-005；AC-02；宪法 F8（简单优先，不建 replacement 平台）、F11（控制面受限）。
  - **场景**：SCN-001、SCN-005。
  - **验收**：AC-02。

### 左移防护域（LEFT）

本域把"调用后才发现错误"改成"写入边界与调用前当场响铃"，同时保证子代理崩溃不留真空。

- **FR-LEFT-001**：写边界身份断言。
  - **范围边界**：写事实前断言 runner/task/cwd 三者一致；cwd 不在任务 worktree 时 fail-loud；不包含开工准入预检。
  - **依据**：D-007；PFACT-06；SCN-005；AC-05；宪法 F3（写边界 fail-loud）、F11（控制面受限）。
  - **场景**：SCN-005。
  - **验收**：AC-05。

- **FR-LEFT-002**：review 统一 preflight 分类报错。
  - **范围边界**：调用前按缺 stage/缺 host_provider/缺 materials、route 未配置、provider 输出非法、传输失败分类报错；输入错误记 invalid_input，不落 unavailable 事实；旧调用方多传的任务/工作区字段一律忽略，不成为审查门。
  - **依据**：D-007；PFACT-06；SCN-005；AC-05；宪法 F3、F4（质量靠异源审查，finding 不锁死修复）。
  - **场景**：SCN-005。
  - **验收**：AC-05。

- **FR-LEFT-003**：fallback 拆 invalid_input 与 unavailable。
  - **范围边界**：把调用方输入错误与能力缺失分开处理；删除通过消息正则猜测错误码的做法；存活消费点为 stage-runtime、stage-runner、stage-agent-outcome-adapter、stage-agent-bridge 与 wh-review simple 路径错误分类；不包含新增错误码体系。
  - **依据**：D-007；PFACT-06；SCN-005；AC-05；宪法 F4、F9（可证伪不假绿）。
  - **场景**：SCN-005。
  - **验收**：AC-05。

- **FR-LEFT-004**：子代理结果契约。
  - **范围边界**：结果文件必写；超时/崩溃写占位证据；复用现有 canonical receipt 槽位；不新增持久对象。
  - **依据**：D-007；PFACT-06；SCN-005；AC-05；宪法 F2（窄契约）、F11（控制面受限）。
  - **场景**：SCN-005。
  - **验收**：AC-05。

- **FR-LEFT-005**：code_review 一等事件。
  - **范围边界**：把完成判据中已引用的 code_review 概念从寄生字段提升为正式事件；删除临时 bridge；不新增概念。
  - **依据**：D-007；PFACT-06；SCN-001、SCN-002；AC-05；宪法 F1（薄核心）、F11（控制面受限）。
  - **场景**：SCN-001、SCN-002。
  - **验收**：AC-05。

### 可移植与评估域（PORT / EVAL）

本域解决 session 宿主可移植化与双轨事实评估结论产出。

- **FR-PORT-001**：session 宿主可移植化。
  - **范围边界**：session/transcript 校验不再 Codex-only；host 声明机制文档化；broker 侧 dsh 支持作为环境事实交接；不包含 DSH reviewer adapter。
  - **依据**：D-009、D-010；PFACT-05；SCN-004；AC-06；宪法 F6（统一外置执行记录）、S8（自定义技能可搬运）。
  - **场景**：SCN-004。
  - **验收**：AC-06。

- **FR-EVAL-001**：双轨事实评估（仅出结论）。
  - **范围边界**：评估 facts.jsonl 与 quality facts 双轨并产出结论报告；不修改、不合并任何一侧的结构。
  - **依据**：D-009；PFACT-06；SCN-001；AC-06；宪法 F4（质量事实浮现）、Q1（质量事实不作准入证）。
  - **场景**：SCN-001。
  - **验收**：AC-06。

### 框架减法域（SUB）

本域删除冗余和死路，保持能力不变。

- **FR-SUB-001**：死代码扫描与删除。
  - **范围边界**：扫描零消费者代码（如 risk plan 死路、临时 bridge）并删除或修通；删除前需反向引用扫描证据。
  - **依据**：D-009；PFACT-01、PFACT-06；SCN-006；AC-06；宪法 F8（简单优先）、F10（自动化按真实收益）、F11（控制面受限）。
  - **场景**：SCN-006。
  - **验收**：AC-06。

- **FR-SUB-002**：workflowhub 侧 DSH 可移植化。
  - **范围边界**：workflowhub 侧接受非 Codex 宿主（transcript 校验、env、host 声明文档化）；broker 侧已完成并作为环境事实交接；不包含 DSH reviewer adapter。
  - **依据**：D-009、D-010；PFACT-05；SCN-004；AC-06；宪法 F6、S8。
  - **场景**：SCN-004。
  - **验收**：AC-06。

- **FR-SUB-003**：双轨结论报告交付。
  - **范围边界**：在 quality/evidence/ 下产出真实的双轨评估结论文件；不修改 facts.jsonl 或 quality facts 结构。
  - **依据**：D-009；PFACT-06；SCN-001；AC-06；宪法 F4、Q1。
  - **场景**：SCN-001。
  - **验收**：AC-06。

### 审查优化域（REV）

本域消除 wh-review 的三类长期浪费：审查前做过多的任务/工作区校验导致审查未调用先失败、provider 成功后严格 v3 group 校验把成功结果判失败、修复后无限复审没有终止规则。

- **FR-REV-001**：审查输入只认提交材料。
  - **范围边界**：wh-review 公共入口只校验 stage/host_provider/materials 与 route 可用性；不打开或校验 Workspace、TaskHandle、Git、快照、材料版本、阶段状态；旧调用方多传的任务/工作区字段一律忽略；旧 task/workspace 绑定审查路径死代码连零消费者证据一并删除。
  - **依据**：D-007；PFACT-06；SCN-005；AC-07；宪法 F8（简单优先）、F11（控制面受限）、S8（技能可搬运不绑死宿主）。
  - **场景**：SCN-005。
  - **验收**：AC-07。

- **FR-REV-002**：审查结果宽松协议投影与统一 findings 格式。
  - **范围边界**：provider 成功返回后公共结果以宽松投影为准（provider/status/identity/error/timing/usage 与 findings）；严格 v3 group 校验不再使已成功的审查整体失败；单个 provider 输出非法只记该 provider 的 failed 事实；找不到 route 时返回诚实 unavailable；审查提示词附带最终结果 sample（一条填好的完整 finding 示例 + 空 findings 示例 + 字段枚举与路径/行号纪律），引导各 provider 返回统一格式 findings。
  - **依据**：D-007；PFACT-06；SCN-005；AC-07；宪法 F9（可证伪不假绿）、F4（质量靠异源审查，finding 不锁死修复）。
  - **场景**：SCN-005。
  - **验收**：AC-07。

- **FR-REV-003**：审查结果落账路径。
  - **范围边界**：wh-review 不写任务状态；调用 stage 经现有公共 `review` behavior 把返回结果记录为不可变审查记录与质量事实并返回 result_ref 供 receipts.review 绑定；落账时为每条 finding 分配稳定 id 供 finding_dispositions 引用；不新增公共命令。
  - **依据**：D-007；PFACT-06；SCN-005；AC-07；宪法 F6（统一外置执行记录）、F11（控制面受限）。
  - **场景**：SCN-005。
  - **验收**：AC-07。

- **FR-REV-004**：审查一轮处置闭环。
  - **范围边界**：每个 stage 每个审查面做一轮异源审查并逐条处置 findings（fixed/rejected_invalid/accepted_risk/needs_human）即闭环；仅当上一轮未返回任何语义建议且具体传输/材料问题已改变时才重试；不以"零 findings"为终止条件；规则写入 CONTEXT.md 术语。
  - **依据**：D-007；PFACT-06；SCN-005；AC-07；宪法 F4、F8（简单优先）、Q1（质量事实不作准入证）。
  - **场景**：SCN-005。
  - **验收**：AC-07。

## 6. 模块划分

> 只写产品职责，不写实现类名。整节不适用时写 `N/A — 具体理由`。

### close 交付模块

- **负责什么**：编排 verify-code 之后的五个物理交付动作；在开始不可逆操作前取得一次人工确认；按 workspace_mode 决定清理策略；失败时支持断点续跑与 finalize 补记。
- **对外提供什么**：给任务生命周期一个物理完成事实（completed.json）和落账记录；不改变质量状态语义。
- **依赖谁**：依赖 verify-code 输出的质量事实；依赖工作区绑定与执行身份认证；依赖用户对手工确认和不可逆操作的授权。
- **测试边界**：正常 close、带缺口 close、existing 模式 close、断点续跑、finalize 不漂白质量。

### 写边界与 review 入口模块

- **负责什么**：在写事实前验证 runner/task/cwd 身份一致；在 review 调用前分类检查配置、材料、绑定、能力四类错误；把调用方输入错误与能力缺失分开处理。
- **对外提供什么**：给调用方一个 fail-loud 的输入错误信号，或一个真实的 unavailable 事实记录。
- **依赖谁**：依赖工作区绑定信息、manifest 中的 workspace_mode 与 host 声明、review provider 能力声明。
- **测试边界**：cwd 错位写入被拒、review preflight 四类错误各一条测试、fallback 错误分类测试。

### 子代理结果与事件模块

- **负责什么**：保证子代理结果文件必写；超时或崩溃时写占位证据；把 code_review 作为一等事件纳入完成判据。
- **对外提供什么**：给下游完成判据一个可直接消费的 code_review 事件事实；不依赖临时 bridge 字段。
- **依赖谁**：依赖现有 canonical receipt 槽位；依赖子代理调用契约。
- **测试边界**：子代理崩溃占位证据测试、code_review 事件被完成判据直接消费测试。

### 会话与执行记录模块

- **负责什么**：接受非 Codex 宿主会话（如 DSH）；正确加载认证 requirement_messages；把 host 声明作为执行身份事实记录。
- **对外提供什么**：给任务生命周期提供与宿主无关的 bootstrap 和 close 能力。
- **依赖谁**：依赖宿主提供的 env/transcript 声明；依赖 3rd-review broker 对 dsh host-identity-only 支持的环境事实。
- **测试边界**：DSH 宿主任务能正常 bootstrap 与 close；非 Codex session 路径测试或文档化验收。

## 7. 关键实体

> 只写影响行为的字段和关系。整节不适用时写 `N/A — 具体理由`。

- **任务（Task）**：
  - **定义**：workflowhub 工作流的一次执行实例，有业务身份和执行上下文。
  - **字段和约束**：task id、workspace_mode（deterministic / existing）、host 声明（如 codex / dsh）。
  - **关系**：关联一个工作区、一份 manifest、一组质量事实、一次 close 结果。

- **manifest**：
  - **定义**：任务 bootstrap 时写入的认证配置，是写边界校验的依据。
  - **字段和约束**：workspace_mode（现有字段，取 deterministic 或 existing）、host 声明。
  - **关系**：一个任务对应一份 manifest；close 清理策略直接读取 workspace_mode。

- **completed.json**：
  - **定义**：close 产出的物理交付事实记录。
  - **字段和约束**：close_mode（非 risk）、五个动作各自的落账记录、一次人工确认绑定；不持有 quality_status / product_release_status（二者独立存在）。
  - **关系**：只证物理交付；消费者不得把它读成质量通过。

- **quality_status / product_release_status**：
  - **定义**：verify-code 阶段产生的语义状态事实。
  - **字段和约束**：quality_status 可取 incomplete 等；product_release_status 可取 not_released 等。
  - **关系**：由 verify-code 阶段写入并在 close 中保持独立，不被 completed.json 漂白。

- **session / transcript**：
  - **定义**：宿主执行环境与认证消息载体。
  - **字段和约束**：host 家族声明、requirement_messages（认证消息列表）。
  - **关系**：bootstrap 读取并校验；close 时不因宿主非 Codex 而被拒绝。

- **review result / receipt**：
  - **定义**：独立审查者产出的质量事实或子代理结果占位证据。
  - **字段和约束**：必须写入结果文件；崩溃时写占位证据；code_review 作为一等事件。
  - **关系**：进入现有 canonical receipt 槽位，供完成判据消费。

## 8. 数据和生命周期

> 数据驱动需求必须填写；不涉及时写 `N/A — 具体理由`。

- **数据粒度**：一次 close 执行产生一条 completed.json 物理交付记录；每个物理动作有独立落账记录；质量状态与发布状态作为独立事实保持原值。
- **数据时效**：completed.json 在 close 成功结束时写入；质量状态基于 verify-code 完成时的最新事实；material drift 触发重 verify 后重新判定。
- **缺失或迟到**：若 close 中途失败，已执行步骤的落账保留；修复后从断点续跑；若手工完成物理交付，使用 finalize 核对后补记 completed.json。
- **预览与正式**：N/A — close 无预览状态，只有正式完成或不完成。
- **当前与历史**：completed.json 代表当前任务的物理完成事实；历史 close 记录保留在 operations/close/ 下，作为只读事实。
- **归属与清理**：completed.json 归任务持有；deterministic 工作目录经独立授权后清理；existing 目录不归任务，只记录 not_applicable_recorded。

## 9. 兼容性预留

> 分阶段交付时必须填写；不涉及时写 `N/A — 具体理由`。

- **既有消费方**：task-close CLI 作为 close 唯一用户入口保持不变；completed.json 的既有消费者继续只读取物理交付事实，不得将其解读为质量通过。
- **命名预留**：close 五个动作名沿用现有命名；不新增公共 runtime 命令名。
- **容器预留**：N/A — 本任务不新增持久容器或 schema。
- **状态预留**：workspace_mode 现有字段继续承载 deterministic / existing；不新增 ownership 字段或对象。
- **扩展边界**：双轨事实合并不在本任务，后续任务需单独立项；任何新增控制面必须同时登记唯一 consumer、owner、替代关系和删除条件。

## 10. 明确不做与默认必须成立

### 明确不做

- 不重做 PaperBuilder 侧问题（D-010）。
- 不改 3rd-review broker 内部（D-010；broker 侧 dsh host-identity-only 支持已在 3rd-review main 5ecf055 完成，作为环境事实交接）。
- 不清理主仓历史孤儿 git 对象；gc repack 失败仅登记为环境风险，owner=用户（D-010、风险-2）。
- 不新增阶段/材料/公共 runtime 命令/新概念对象（R-013、D-010）。
- 不做 UI（D-010）。
- 历史 M14–M17 归档不重构（D-010）。
- 双轨事实只评估不合并；合并另开任务（D-009、D-010、延期-1）。
- DSH 作为 reviewer adapter 非本任务目标；3rd-review dsh 支持仅限 host-identity-only（D-009、D-010）。

### 默认必须成立

- 公共 runtime 命令仍是 doctor、status、run、review、verify、confirm、authorize 七类（AC-04、宪法 F9/Q1/Q2）。
- 四份当前材料（decision-log.md、spec.md、plan.md、tasks.md）仍是唯一工作真相（宪法治理边界）。
- commit、push、merge、archive、cleanup 等不可逆操作须经独立授权（宪法 F7）。
- 质量事实只记录、不阻塞修复；缺失质量事实不得宣称完成（宪法 Q1/Q2）。
- 新机制不得新增门面、概念对象或控制面；新增控制面必须有唯一 consumer、owner、替代关系和删除条件（R-013、AC-04、宪法 F11）。

## 11. 验收标准

- [ ] **AC-01**：本任务自身通过官方路径走完五阶段并正常 close。
  - **需求**：FR-CLOSE-001、FR-CLOSE-002、FR-CLOSE-003、FR-CLOSE-004、FR-CLOSE-005。
  验证：检查本任务 operations/close/completed.json 的实际内容。
  - **通过条件**：completed.json 存在；close_mode 非 risk；包含五个物理动作各自的落账记录与一次人工确认绑定；completed.json 不写入 quality_status/product_release_status，二者在 quality/facts 独立存在且未被漂白。
  - **失败条件**：文件缺失、close_mode=risk、缺少动作记录或确认绑定、质量字段缺失或被漂白。
  - **证据类型**：`evidence`。

- [ ] **AC-02**：close 机制修复有测试且全绿。
  - **需求**：FR-CLOSE-001、FR-CLOSE-002、FR-CLOSE-003、FR-CLOSE-004、FR-CLOSE-005。
  验证：运行 contract/integration 测试覆盖：恒 risk 分离、existing 模式 close 可行、risk plan 死路移除、material-only delta 豁免对齐、断点续跑、finalize 手工补记（含不漂白质量）。
  - **通过条件**：所有相关测试通过。
  - **失败条件**：任一测试红或缺失。
  - **证据类型**：`test`。

- [ ] **AC-03**：每条修复有宪法条款依据且 constitution-checklist.md 同步。
  - **需求**：所有 FR（FR-CLOSE-001~005、FR-LEFT-001~005、FR-PORT-001、FR-EVAL-001、FR-SUB-001~003、FR-REV-001~004）。
  验证：逐条核对 FR 的"依据"字段是否标注宪法条款号；检查 constitution-checklist.md 是否新增 F9 伪造通过、Q1 completed 三分、F7 cleanup ownership、F3 preflight 位置四条判据。
  - **通过条件**：每条 FR 都有宪法依据；checklist 已同步。
  - **失败条件**：出现无宪法依据的新机制；checklist 未同步。
  - **证据类型**：`manual`。

- [ ] **AC-04**：不引入新推进门禁/新控制面/新概念对象。
  - **需求**：FR-CLOSE-001~005、FR-LEFT-001~005、FR-PORT-001、FR-EVAL-001、FR-SUB-001~003、FR-REV-001~004。
  验证：比对公共 runtime 命令清单、四份材料清单、manifest 字段清单。
  - **通过条件**：公共 runtime 命令仍是七类；四份材料不变；manifest 无新字段；未新增门面、概念对象或控制面。
  - **失败条件**：新增公共命令、新增材料、manifest 新增字段、新增控制面或概念对象。
  - **证据类型**：`manual`。

- [ ] **AC-05**：左移防护五子项各有验收入口测试。
  - **需求**：FR-LEFT-001、FR-LEFT-002、FR-LEFT-003、FR-LEFT-004、FR-LEFT-005。
  验证：运行各子项最小验收入口测试。
  - **通过条件**：cwd 错位时写入被拒、review preflight 分类错误（缺 stage/缺 host_provider/缺 materials、route 未配置、provider 输出非法）各有一条测试、fallback 错误分类测试、子代理崩溃占位证据测试、code_review 事件被完成判据直接消费测试全部通过。
  - **失败条件**：任一测试缺失或失败。
  - **证据类型**：`test`。

- [ ] **AC-06**：减法与移植交付判定。
  - **需求**：FR-SUB-001、FR-SUB-002、FR-SUB-003、FR-PORT-001、FR-EVAL-001。
  验证：反向引用扫描、session 非 Codex 宿主测试或文档化验收、双轨结论报告文件检查。
  - **通过条件**：死代码删除有零消费者扫描证据；session 非 Codex 宿主支持有测试或文档化验收；双轨事实评估结论报告已作为 quality/evidence/ 下真实文件交付。
  - **失败条件**：任一证据缺失。
  - **证据类型**：`evidence`。

- [ ] **AC-07**：wh-review 优化验收。
  - **需求**：FR-REV-001、FR-REV-002、FR-REV-003、FR-REV-004。
  验证：运行 wh-review simple 路径测试与 review 落账路由测试；检查旧 task/workspace 绑定审查路径死代码的零消费者删除证据；执行一次真实 dsh 宿主 review 端到端冒烟。
  - **通过条件**：simple 路径只凭 stage/host_provider/materials 完成一次真实审查并返回 findings；严格 v3 校验不再使成功审查整体失败；review 落账返回可绑定的 result_ref；旧死路径删除有零消费者证据；相关测试全绿。
  - **失败条件**：审查仍因 Workspace/TaskHandle/v3 严格校验失败；落账路径缺失；死代码无证据删除；任一测试红。
  - **证据类型**：`test`。

## 12. 风险、未决与交接

- **RISK-01**：需求快照为空（R-012，DSH 宿主限制）。
  - **受影响 ID**：FR-PORT-001、FR-SUB-002、AC-06。
  - **触发条件**：DSH 宿主 transcript 不被接受导致 requirement_messages=[]。
  - **后果**：需求来源缺失，影响合宪性审查与验收。
  - **缓解或 STOP**：DSH transcript 可移植化已落地，快照修复为 msg-1/msg-2 两条认证消息，content_hash 经 transcript 重放校验一致。
  - **处理 Stage**：`make-decision`。
  - **验证**：msg-1=5da79eec-cf85-414f-9098-f0cdcfa1822e，msg-2=5305a902-3fba-4e43-8362-71fcdf41bacc；哈希校验一致。

- **RISK-02**：主仓 git gc 因历史对象不可读失败。
  - **受影响 ID**：FR-CLOSE-001、AC-01。
  - **触发条件**：close 的 push 步骤触发主仓历史孤儿 git 对象完整性问题。
  - **后果**：push/merge 可能需人工介入，但不阻塞 merge/push 本身。
  - **缓解或 STOP**：owner=用户；在 close 时若触发则如实报失败；用户另行安排维护窗口清理。
  - **处理 Stage**：`verify-code`。
  - **验证**：push 失败时错误信息明确指向历史对象问题，且不影响其他任务正常 close。

- **RISK-03**：用修复中的 close 代码关闭本任务自身存在自举风险。
  - **受影响 ID**：AC-01、AC-02。
  - **触发条件**：本任务 close 使用正在修改的 close 代码。
  - **后果**：可能因 close 代码未经验证而失败。
  - **缓解或 STOP**：close 改动先经 AC-02 测试验证后才执行本任务 close；失败时回退手工五步并由 finalize 补记（该能力本身在范围内）。
  - **处理 Stage**：`verify-code`。
  - **验证**：AC-02 测试先绿，再执行 AC-01 dogfood；失败路径有 finalize 补记证据。

- **RISK-04**：宪法解释段措辞被误读为新门禁。
  - **受影响 ID**：AC-03、FR-CLOSE-001~005、FR-LEFT-001~005。
  - **触发条件**："close 三义"解释段被实现为阶段 gate 或准入条件。
  - **后果**：重新引入被禁止的门禁控制面，违宪。
  - **缓解或 STOP**：detail 细审复核；措辞只解释不设门；verify 阶段审查无歧义。
  - **处理 Stage**：`build-spec` / `verify-code`。
  - **验证**：审查实现未新增 public gate，公共 runtime 命令仍是七类。

- **OPEN-01**：facts.jsonl 与 quality facts 双轨合并。
  - **受影响 ID**：FR-EVAL-001、FR-SUB-003。
  - **owner**：后续任务。
  - **影响**：本任务只出评估结论；不解决则双轨结构长期并存，增加维护成本。
  - **处理 Stage**：后续任务 `make-decision`。
  - **关闭条件或 STOP**：本任务交付的评估结论经 review 后单独立项，或用户明确决定不合并。

## 13. 业务影响与回归范围

### close 交付

- **既有行为**：close 恒以 risk 模式调用，existing 模式无法完成，质量缺口自动转 risk，手工完成不写 completed.json。
- **本需求影响**：close 回归五个动作 + 一次人工确认；正常/带缺口共用一条路径；risk close 机制删除；existing 模式可正常 close；失败可续跑或 finalize 补记。
- **回归路径**：正常 close → 带缺口 close → existing 模式 close → 断点续跑 → finalize 补记。
- **验收**：AC-01、AC-02。

### 事实新鲜度

- **既有行为**：close 与 status 对 material-only delta 豁免宽严不一，真实 material 变化偶尔被误伤。
- **本需求影响**：close 与 status 共用同一判定函数；真实 material 变化仍强制重 verify，material-only delta 豁免一致。
- **回归路径**：有 material 变化时重 verify → 无真实 material 变化时允许 close。
- **验收**：AC-02。

### review 与左移防护

- **既有行为**：review 输入错误调用后才落成 unavailable；fallback 吞错；子代理崩溃无证据；code_review 寄生在临时字段。
- **本需求影响**：写边界身份断言、review preflight 分类报错、fallback 拆 invalid_input/unavailable、子代理崩溃占位证据、code_review 一等事件。
- **回归路径**：review 正常调用 → 四类输入错误 fail-loud → 子代理崩溃留证据 → 完成判据直接消费 code_review 事件。
- **验收**：AC-05。

### 宿主可移植与减法

- **既有行为**：session/transcript 只认 Codex 宿主；DSH 任务需求快照为空；冗余代码与死路控制面存在。
- **本需求影响**：接受非 Codex 宿主；删除死代码与冗余控制面；双轨事实只评估不合并。
- **回归路径**：DSH 宿主任务 bootstrap → close；死代码删除后全仓测试仍绿。
- **验收**：AC-04、AC-06。

- **可能受冲击的业务规则**：
  - close 不得担任质量裁判；completed.json 不得被读作质量通过。
  - 不可逆操作必须经独立授权，不能被阶段确认顺带授权。
  - 公共 runtime 命令数量与四份当前材料清单保持不变。
  - workspace_mode 现有字段是清理判定的唯一依据。
- **明确无影响**：3rd-review broker 内部、PaperBuilder 侧、主仓历史孤儿对象清理、UI、M14–M17 归档重构。
