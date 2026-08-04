# 功能规格：WorkflowHub 复杂度治理 V3.2

- **功能名**：以四材料和质量事实驱动的简化 WorkflowHub
- **来源**：已接受的 `decision-log.md`；原始方案 SHA-256 `de3938ce359d281a46da5075ccc1097dcb4b4ef86960aa5544037498d3e7ad59`
- **状态**：审查修订完成，待独立复审

## 速读卡（30 秒）

- **一句话需求**：维护者应能用五阶段和七类公开行为完成任务，而不会被旧控制链卡住，也不会丢失质量证据。
- **核心改动点**：
  - 四份当前材料决定能否继续工作，质量事实决定能否宣称完成。
  - 删除 operational lineage，保留审查、测试、确认、授权和治理学习资料。
  - 用基线行为证据、新契约测试和三条 E2E 共同证明公开行为没有退化。
- **最大影响面**：任务目录、五阶段推进、独立审查、验证、CLI 行为和发行闭包。
- **验收信号**：七类公开行为对比通过，旧控制机制生产引用归零，历史任务零改写，完整验证事实可定位。

## 1. 问题与紧迫性

WorkflowHub 当前把材料、历史事实、当前指针、审查轮次、恢复关系和完成判断重复建模。材料的小修改会触发 replacement、snapshot、selector 或 recovery 一类控制链；旧事实反过来成为继续修复的许可证。结果是维护者花大量精力修流程状态，而不是交付任务。

本次必须先删除重复模型，再整理实现和目录。简化不能靠删质量工作换取：错误绑定仍须在正式写入前失败，测试、逐 AC、独立审查和人工交接仍决定完成质量，审查不可用永远不能伪装成通过。

## 2. 背景、目标与范围

### 背景

已接受方向固定为完整实施原始 V3.2 的 Phase 0–7，并增加基线行为证据。基线版本为 `main@c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`。本规格继承五阶段、四材料、七类公开行为、独立审查、三处业务确认和独立不可逆授权。

### 目标

- 当前工作真相只存在于 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。
- 质量事实保留且可回看，但不控制普通编辑和同任务修复。
- 新任务不产生 successor、selector、snapshot lineage、phase trace 或 replacement review。
- 七类公开行为在固定输入下保持产品语义，新增行为边界有独立测试。
- 历史任务和历史质量资料不迁移、不改写、不参与新任务推进。
- 复杂度预算只产生诊断反馈，不成为业务阶段 gate。

### 范围内

- Phase 0–7 的盘点、切换、垂直删除、目录与测试收敛、治理规则和最终验证。
- 五阶段对四材料、任务事实、质量事实和派生状态的行为。
- 七类公开行为：`doctor`、`status`、`run`、`review`、`verify`、`confirm`、`authorize`。
- 新任务最小外置记录、质量报告、原始输出引用和 M14–M17 索引。
- 基线行为采集、去噪、重放和新旧对比。

## 3. 用户场景与状态覆盖

### SCN-001：正常完成五阶段

- **角色**：WorkflowHub 使用者
- **Given**：新任务已创建，当前材料可读
- **When**：依次执行五个 stage 并完成必要质量工作
- **Then**：系统只更新当前材料和单条事实，最终派生为可确认状态

### SCN-002：材料缺失或被修订

- **角色**：任务执行者
- **Given**：四材料缺失，或编码中需要修订当前规格、计划、任务表
- **When**：读取状态或继续同一任务修复
- **Then**：缺材料时显示 `not_ready`；材料齐后无需 reopen、rebind 或 successor 即可继续

### SCN-003：质量失败或审查不可用

- **角色**：任务执行者与验证者
- **Given**：测试、AC、serious finding 失败，或独立审查不可用
- **When**：查看状态、修复并重新验证
- **Then**：系统如实显示 `needs_revision` 或 `incomplete`，允许同任务修复，不产生假 PASS 或控制链

### SCN-004：正式写入错绑或被中断

- **角色**：WorkflowHub 使用者
- **Given**：task、workspace、write set 或内容摘要错绑，或原子写入中断
- **When**：尝试正式发布事实或重跑相同动作
- **Then**：错绑在写成功前明确失败；中断不留下半份材料或重复状态链

### SCN-005：比较七类公开行为

- **角色**：维护者与验收者
- **Given**：同一固定输入可在基线版本和候选版本运行
- **When**：采集并归一化七类公开行为结果
- **Then**：语义字段可逐项比较，动态噪声被排除，内部旧机制不被固化为兼容要求

### SCN-006：垂直删除旧控制机制

- **角色**：维护者
- **Given**：一个旧机制族已有消费者和替代行为清单
- **When**：先证明新路径，再删除生产入口和附属资产
- **Then**：入口、处理器、schema、fixture、测试、文档、配置和术语中的生产引用归零，质量资料不被误删

### SCN-007：读取历史任务和治理学习资料

- **角色**：审计者与治理维护者
- **Given**：历史任务、审查原文或 M14–M17 数据存在
- **When**：新运行时处理新任务或治理工具读取历史资料
- **Then**：历史内容零改写；治理资料可回看并有索引，但不参与普通任务推进

### SCN-008：业务确认与不可逆授权

- **角色**：用户
- **Given**：方向、计划或最终验证等待确认
- **When**：用户确认业务结论，或另行授权不可逆操作
- **Then**：确认只记录业务结论，不能替代 commit、push、merge、archive、cleanup 的独立授权

### 状态覆盖清单

- [x] **默认态**：SCN-001
- [x] **空态**：SCN-002
- [x] **错误态**：SCN-003、SCN-004
- [x] **加载态**：N/A — CLI 为同步一次性动作，不向用户暴露持续加载态
- [x] **取消态**：SCN-004；取消或中断不得写出部分状态
- [x] **边界态**：SCN-002、SCN-005、SCN-006
- [x] **权限态**：SCN-008
- [x] **竞态**：SCN-004；并发或重复写入必须保持原子性和单事实语义

## 4. 产品事实与假设（PFACT）

- **PFACT-BASELINE**：本次治理的固定行为基线是 `main@c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`。
  - **status**：`verified`
  - **证据**：原始 V3.2 方案及已接受决策 D4
  - **关联**：FR-PUBLIC-001、FR-BASELINE-001；AC-001～AC-010
- **PFACT-MATERIAL**：四份当前材料是当前工作真相，质量事实不是继续工作的许可证。
  - **status**：`verified`
  - **证据**：已接受决策 D3、宪法 F3/Q1/Q2
  - **关联**：FR-MATERIAL-001、FR-QUALITY-001；AC-011～AC-016、AC-033、AC-041
- **PFACT-LINEAGE**：基线仍存在多套被生产入口或测试消费的 operational lineage。
  - **status**：`verified`
  - **证据**：原始 V3.2 §2.2 与已接受决策 D2
  - **关联**：FR-DELETION-001；AC-017～AC-019
- **PFACT-RETENTION**：审查报告、测试摘要、确认、授权、provenance 和 M14–M17 是质量或学习事实，不属于待删除控制链。
  - **status**：`verified`
  - **证据**：原始 V3.2 §2.4、§7.3、§7.4 与决策 D5
  - **关联**：FR-STORAGE-001、FR-LEARNING-001；AC-020～AC-025
- **PFACT-HISTORY**：历史任务不是本次迁移对象，只允许只读盘点。
  - **status**：`verified`
  - **证据**：原始 V3.2 Phase 5 与决策 D5
  - **关联**：FR-HISTORY-001；AC-026～AC-027
- **PFACT-AUTH**：三处业务确认与不可逆操作授权是两个独立边界。
  - **status**：`verified`
  - **证据**：决策 D6、宪法 F7
  - **关联**：FR-AUTH-001；AC-028～AC-029、AC-043
- **PFACT-GOV**：复杂度预算和 inventory 是架构诊断，不是普通任务推进许可。
  - **status**：`verified`
  - **证据**：原始 V3.2 §2.5、§11 与宪法 F5/F10
  - **关联**：FR-GOVERNANCE-001、FR-RULES-001；AC-037～AC-038、AC-042
- **PFACT-DIST**：Skill Bundle 与 Local Runner 是必须保留并重新验证的发行边界。
  - **status**：`verified`
  - **证据**：原始 V3.2 §7.3、§8.2 与决策 D1
  - **关联**：FR-DISTRIBUTION-001；AC-039～AC-040
- **PFACT-CONSUMERS**：旧控制机制的全部隐藏消费者尚需在实施前完成最终盘点。
  - **status**：`unknown`
  - **owner、影响**：build-plan/build-code；遗漏会造成半迁移或隐藏 reader 继续作 gate，关联 RISK-CONSUMER
  - **关联**：FR-DELETION-001；AC-017～AC-019
- **PFACT-RUNTIME**：基线正式 stage 执行仍存在 legacy writer 与 vNext task 边界。
  - **status**：`unknown`
  - **owner、影响**：build-plan/build-code；若不修复，标准流程无法在新任务上完成正式 publication，关联 RISK-RUNTIME
  - **关联**：FR-STAGE-001、FR-SAFETY-001；AC-030～AC-033

## 5. 功能需求

### 公开行为与基线（PUBLIC）

- **FR-PUBLIC-001**：系统必须只向使用者提供 `doctor`、`status`、`run`、`review`、`verify`、`confirm`、`authorize` 七类稳定行为，并保持各自公开职责。
  - **范围边界**：不保证旧内部 publish、receipt、recovery、selector、phase 命令继续公开。
  - **依据**：PFACT-BASELINE、D4
  - **场景**：SCN-005
  - **验收**：AC-001～AC-007
- **FR-BASELINE-001**：七类行为必须使用固定输入在基线和候选版本真实采集，可重算归一化结果并逐项比较。
  - **范围边界**：去除时间、UUID、run/invocation ID、临时或绝对路径、耗时等非语义噪声；保留 exit code、错误类别、公开 JSON 形状、状态/verdict、确认与授权效果。
  - **依据**：PFACT-BASELINE、D4
  - **场景**：SCN-005
  - **验收**：AC-008～AC-010

#### 七类公开行为基线契约

所有 case 使用独立、全新的隔离环境，固定 task/project/branch、Git 身份、初始空提交、HOME、task storage 和只读 Runner；禁止依赖前一个 case 的残留状态。原始与归一化样本统一保存到仓库测试 fixture 的 `public-behavior-baseline/v1` 版本目录，manifest 绑定基线 commit、collector hash、Node/平台/Runner contract、argv、输入 hash、原始 stdout/stderr hash、归一化 hash、写集合及内容 hash。具体仓库落点由 plan 登记，但不得更改该逻辑目录和 schema 责任。

- **doctor**：固定输入为 workspace 检查、make-decision stage 和固定 task；保留 exit code、检查项、worktree 与 baseline commit 的关系，路径 token 化。
- **status**：固定输入为 make-decision 的 begin 及固定 reason；保留 stage、run 序号、同次 workflow ID 的一致性、写入 namespace、重复调用语义，UUID 段 token 化。
- **run**：固定输入包含一个成功的 scope case，以及一个新 task 的 execute case；保留 receipt/ref、公开结构、exit code 和错误类别。基线 `legacy attempt writer is unavailable for vNext tasks` 记为“已知缺陷”，修复后只能分类为 `approved_bug_fix`，不能要求永久保留。
- **review**：固定输入包含一次确定性 `unavailable` provider 结果和一次 `triggered=false`；保留请求绑定、provider 状态、规范化 verdict、事实引用、错绑失败和零部分写入，绝不把“不触发”代替 unavailable。
- **verify**：固定输入包含一个确定性成功测试和一个非零退出测试；保留命令、exit code、stdout/stderr 通道、receipt/output ref/hash、snapshot 关系和失败不转 PASS。
- **confirm**：固定输入为合法且未确认的 make-decision attempt，以及一个错绑 attempt；保留 task/stage/attempt/decision 绑定、错绑非零退出、确认后尚未出现 accepted result。
- **authorize**：固定输入为上述 attempt 和精确 confirmation ref，另含缺失/错绑 confirmation；保留失败语义、accepted 与 attempt/confirmation 关系，并证明没有隐式 commit、push、merge、archive 或 cleanup。

所有样本必须先验证原始字节的 hash/ref/snapshot/task/workspace 关系，再生成语义投影。对象键可规范排序，数组顺序、stdout/stderr 通道、字段名和类型不得改写。对比结论只能是 `preserved`、`approved_internal_change`、`approved_bug_fix`、`behavior_regression`；golden 不得自动更新。

### 当前材料与阶段推进（FLOW）

- **FR-MATERIAL-001**：系统必须只从四份当前材料派生是否可继续工作；四材料缺失为 `not_ready`，齐全即可在同一任务继续。
  - **范围边界**：accepted、receipt、review、checkpoint、snapshot 或历史事实不得成为进入许可证。
  - **依据**：PFACT-MATERIAL、D3
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-011～AC-013
- **FR-STAGE-001**：五个 stage 必须围绕同一组四材料完成各自职责，失败和修订留在同一 task。
  - **范围边界**：不创建 successor、replacement、reopen、rebind、continuation 或 recovery 流程节点。
  - **依据**：PFACT-MATERIAL、PFACT-RUNTIME、D1
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-014、AC-030～AC-032

#### 五阶段最小完成谓词

以下谓词只决定能否如实声称该 stage 达到对应业务结论，不是进入下一次编辑或修复的许可证：

- **make-decision**：方向已写入 decision-log，四材料已创建，真实 direction/detail review 或真实 unavailable 已记录，用户作出方向确认；缺材料为 `not_ready`，缺 review/确认或 review unavailable 为 `incomplete`，确认接受后为 `accepted`。
- **build-spec**：当前 spec 可读、所有重大歧义已解决或明确 STOP、逐 FR/AC 可追踪、真实独立 review 事实和审查处置已记录；缺 spec 为 `not_ready`，缺歧义账本/review/处置或 review unavailable 为 `incomplete`，serious finding 未修为 `needs_revision`，事实齐且无未处置 serious finding 才完成规格交接。
- **build-plan**：同一 plan 和 tasks 已细化全部 FR/AC、依赖、风险、focused 验证、回滚和删除证明，真实独立 review 及处置已记录，用户作出计划确认；缺 plan/tasks 为 `not_ready`，缺 review/处置为 `incomplete`，质量事实齐后为 `ready_for_confirmation`，确认接受后为 `accepted`。
- **build-code**：tasks 中当前实现行均有结果和证据，核心交付存在，受影响 focused tests 与必要 phase/integration review 事实已记录；失败或未修 serious finding 为 `needs_revision`，缺测试/review/交接为 `incomplete`，事实齐且通过才完成实现交接。
- **verify-code**：缺失、失败、过期或受影响的测试已重跑，每条 AC 有当前结论，真实独立 review 和交接已记录，无未处置 serious finding；缺事实或 unavailable 为 `incomplete`，失败为 `needs_revision`，全部满足为 `ready_for_confirmation`，用户确认后为 `accepted`。

#### Phase 0–7 依赖与退出追踪

Phase 必须按 0→7 顺序执行；每个 Phase 的文件、命令和回滚点由 `plan.md` 冻结，以下产品退出条件不得改写：

- **Phase 0 冻结与盘点**：当前 baseline 可重算，消费者与未分类生产文件已识别；对应 AC-008、AC-017、AC-037。
- **Phase 1 四材料与最小 task_dir**：新任务可创建、读取、编辑、重启，材料不复制，写入原子；对应 AC-011、AC-012、AC-020、AC-023。
- **Phase 2 前三阶段切换**：make-decision/build-spec/build-plan 只更新当前材料，业务确认不作许可证；对应 AC-014、AC-028、AC-029。
- **Phase 3 build-code/verify-code 切换**：同任务执行和验证，三条最小 E2E 通过；对应 AC-030～AC-036。
- **Phase 4 垂直删除**：每个旧机制族完成 consumer→replacement→negative test→delete→reference audit；对应 AC-017～AC-019。
- **Phase 5 历史只读**：历史 task 摘要前后一致，新运行时不读历史链；对应 AC-026～AC-027。
- **Phase 6 目录与测试收敛**：生产引用归零，发行闭包和必要 mutation/full suite 有证据；对应 AC-018、AC-039～AC-041。
- **Phase 7 治理固化与交付**：治理文档一致、clean install 通过、用户 review pack 可定位；对应 AC-040、AC-042、AC-043。
- **FR-QUALITY-001**：测试、逐 AC、独立审查、确认和授权必须作为质量事实派生完成结论，而不是控制普通修复。
  - **范围边界**：`unknown`、`incomplete`、普通 finding 或 stale 事实允许继续修复，但不得变成 pass 或正式完成。
  - **依据**：PFACT-MATERIAL、D3
  - **场景**：SCN-003
  - **验收**：AC-015～AC-016、AC-033、AC-041

### 安全写入与恢复（SAFETY）

- **FR-SAFETY-001**：正式事实写入必须验证 task、workspace、write set 和内容绑定，且采用原子写入。
  - **范围边界**：结构真实性只约束正式写成功，不阻止普通编辑。
  - **依据**：PFACT-RUNTIME、D3
  - **场景**：SCN-004
  - **验收**：AC-034～AC-036

### 控制链删除与质量保留（GOVERNANCE）

- **FR-DELETION-001**：每个旧控制机制族必须按“消费者与替代事实、反向证明、生产删除、附属资产删除、引用审计”的顺序垂直删除。
  - **范围边界**：只删除 operational control plane；单条事实 provenance 不属于 lineage。
  - **依据**：PFACT-LINEAGE、PFACT-CONSUMERS、D2、D5
  - **场景**：SCN-006
  - **验收**：AC-017～AC-019
- **FR-STORAGE-001**：新任务外置记录必须收敛为 task identity、append-only facts、quality 和 index；四材料只存在于任务工作区。
  - **范围边界**：热路径固定为 `task.json`、`facts.jsonl`、`quality/reviews/`、`quality/tests/`、`quality/verify.json`、`index.json`；质量报告可归档但不可覆盖或静默删除；外置记录不得形成 current/parent/generation 链。`index.json` 至少保存逻辑引用、hash、schema/version、关联 task 和外部 raw/governance archive 引用。
  - **依据**：PFACT-RETENTION、D5
  - **场景**：SCN-006、SCN-007
  - **验收**：AC-020～AC-023
- **FR-LEARNING-001**：M14a、M14b、M15、M16、M17a、M17b 必须保留为旁路治理学习资料。
  - **范围边界**：缺失可记 `unknown`；任何治理学习资料不得改变普通任务推进资格。
  - **依据**：PFACT-RETENTION、D5
  - **场景**：SCN-007
  - **验收**：AC-024～AC-025
- **FR-HISTORY-001**：历史任务和历史质量资料必须保持原路径、原内容、只读，不进入新运行时推进逻辑。
  - **范围边界**：不提供 importer、迁移写回、新旧双写或永久兼容 reader。
  - **依据**：PFACT-HISTORY、D5
  - **场景**：SCN-007
  - **验收**：AC-026～AC-027
- **FR-GOVERNANCE-001**：复杂度、文件数、对象数和测试时长预算必须仅用于诊断与人工复盘。
  - **范围边界**：超预算不得阻塞业务 stage、自动生成 gate 或诱导删除关键质量覆盖。
  - **依据**：PFACT-GOV、D2、原始 V3.2 §11
  - **场景**：SCN-006
  - **验收**：AC-037～AC-038
- **FR-RULES-001**：四材料唯一当前真相、operational lineage 归零、质量事实不作许可证、provenance 保留和新增机制需真实消费者的边界必须固化到维护规则、宪法、宪法清单和术语上下文。
  - **范围边界**：四份治理材料必须互相一致；宪法条目变更必须同步 checklist，术语上下文不得保留冲突旧定义。
  - **依据**：PFACT-GOV、D1、D2、原始 V3.2 §10/§12
  - **场景**：SCN-006、SCN-007
  - **验收**：AC-042

### 确认、授权和发行（DELIVERY）

- **FR-AUTH-001**：系统必须保留 make-decision、build-plan、verify-code 三处业务确认，并把不可逆操作授权保持为独立动作。
  - **范围边界**：任何阶段确认均不自动执行 commit、push、merge、archive 或 cleanup。
  - **依据**：PFACT-AUTH、D6
  - **场景**：SCN-008
  - **验收**：AC-028～AC-029、AC-043
- **FR-DISTRIBUTION-001**：简化后的五阶段必须通过可搬运 Skill Bundle 和干净 Local Runner 安装执行。
  - **范围边界**：发行包不携带 tests、node_modules 或 history；不为 clean install 新增永久兼容桥。
  - **依据**：PFACT-DIST、D1、原始 V3.2 §7.3/§8.2
  - **场景**：SCN-001
  - **验收**：AC-039～AC-040

## 6. 模块划分

### 任务材料

- **负责什么**：保存当前方向、规格、计划和执行任务表。
- **对外提供什么**：当前可读真相和可执行任务。
- **依赖谁**：用户输入与当前任务身份。
- **测试边界**：四材料齐缺、修订和原子替换行为。

### 质量事实

- **负责什么**：保存测试、AC、review、确认、授权和来源事实。
- **对外提供什么**：可回看证据及即时完成判断输入。
- **依赖谁**：当前材料摘要和真实外部执行结果。
- **测试边界**：不可用、失败、错绑、stale 和严重 finding 的真实语义。

### 治理学习

- **负责什么**：保存 M14–M17 观测、诊断、候选和兼容报告。
- **对外提供什么**：旁路趋势与人工决策资料。
- **依赖谁**：只读事实采集。
- **测试边界**：资料缺失不阻塞任务，索引可定位原始资料。

### 公开运行接口

- **负责什么**：承载七类用户可见行为并编排五阶段。
- **对外提供什么**：稳定职责、明确错误和派生状态。
- **依赖谁**：当前材料、质量事实、受控写入边界。
- **测试边界**：基线行为对比、契约测试、三条最小 E2E 和 clean install。

## 7. 关键实体

- **当前材料集**：恰好四份可读材料；同一任务只有一份当前内容。
- **质量事实**：一条不可覆盖的发生记录；含 task、stage、来源、状态、内容摘要和输出引用，不含 parent、previous、generation、selector 或 successor。
- **派生状态**：`not_ready`、`working`、`needs_revision`、`incomplete`、`ready_for_confirmation`、`accepted`、`delivered`；不作为新的持久 current projection。
- **审查报告**：一次真实独立请求的规范化结果和原始输出引用；结果只能真实表达 pass、revise_required 或 unavailable。
- **授权事实**：绑定明确不可逆操作的独立用户授权；不能由阶段确认推导。
- **基线行为样本**：固定输入、原始输出、归一化输出、退出码和采集身份的可重算证据；不记录内部控制链为兼容要求。

## 8. 数据和生命周期

- **数据粒度**：每个 task 一组当前材料；每次测试、审查、确认、授权或治理采集一条独立事实。
- **数据时效**：材料修改后相关质量事实可变 stale；stale 降低完成结论但不阻止修复。
- **缺失或迟到**：写 `unknown` 或 `incomplete`，不得补写 pass。
- **预览与正式**：普通编辑可持续进行；正式事实必须完成身份、绑定和原子写验证。
- **当前与历史**：当前材料覆盖更新；事实追加且不可覆盖；历史 task 保持原样。
- **归属与清理**：task 保留质量索引和报告；大原文可进入只读归档并保留 hash/ref；清理需独立授权。

## 9. 兼容性预留

- **既有消费方**：七类公开行为职责保持；内部旧命令和持久对象不承诺兼容。
- **命名预留**：公开行为和五阶段名称稳定；新增内部函数不能变成新流程节点。
- **容器预留**：quality 与 governance-learning 可增加不控制推进的事实类型。
- **状态预留**：质量状态保持 pass/fail/unknown/incomplete 语义；新增状态不得把历史记录变成 gate。
- **扩展边界**：未来机制必须有真实失败、唯一消费者、替代对象和删除条件。

## 10. 明确不做与默认必须成立

### 明确不做

- 不重放 KnowledgeDigest 或 PaperBuilder 事故。
- 不连续执行十个真实业务任务，不修改业务项目来证明架构质量。
- 不删除五阶段、Skill Bundle、Local Runner、独立审查、质量事实、三处业务确认或独立授权。
- 不把外部 provider 的 transport、session 或 retry 状态搬进 WorkflowHub。
- 不迁移、重写、补 hash、重新分类或删除历史 task 数据。
- 不建立 importer、新旧双写、长期兼容 reader 或双轨窗口。
- 不把复杂度预算、旧 evidence、review finding 或 unavailable 变成推进 gate 或假 PASS。
- 不为降低 LOC 删除真正覆盖用户接口的测试，不反复运行无新增信息的全量测试。
- 不在本次业务确认中自动 commit、push、merge、archive、cleanup 或删除工作树。

### 默认必须成立

- 所有修复留在同一 task，关联 FR-MATERIAL-001、FR-STAGE-001；AC-013、AC-032。
- 正式错绑 fail-loud，关联 FR-SAFETY-001；AC-034。
- 质量资料可回看且不作许可证，关联 FR-QUALITY-001、FR-STORAGE-001；AC-016、AC-022。
- 历史任务零改动，关联 FR-HISTORY-001；AC-026。
- `confirm` 与 `authorize` 永不互换，关联 FR-AUTH-001；AC-028、AC-029。

## 11. 验收标准

- [ ] **AC-001**：`doctor` 能报告 Runner、Bundle、Node、配置和 workspace 的可执行性。需求：FR-PUBLIC-001。方法：契约测试和基线对比。通过：成功与失败结构及退出语义一致。失败：关键检查缺失或错误被吞。证据：test/evidence。
- [ ] **AC-002**：`status` 从当前材料、任务和事实即时派生状态。需求：FR-PUBLIC-001。方法：契约测试。通过：不读取旧控制链作为 gate。失败：需要 current pointer 或历史 accepted 才返回。证据：test。
- [ ] **AC-003**：`run` 能执行五个 stage 或更新当前材料/任务表。需求：FR-PUBLIC-001。方法：契约测试和 E2E。通过：五阶段均可走通。失败：新 task 依赖 legacy writer 才能正式完成。证据：test。
- [ ] **AC-004**：`review` 写入一次真实独立审查事实。需求：FR-PUBLIC-001。方法：独立审查集成测试。通过：pass/revise_required/unavailable 如实保存。失败：产生 selector、round chain 或 unavailable→pass。证据：test/evidence。
- [ ] **AC-005**：`verify` 执行必要测试、逐 AC 和新鲜度判断。需求：FR-PUBLIC-001。方法：集成测试。通过：只重跑缺失、失败、过期或受影响验证。失败：缺事实仍报完成。证据：test。
- [ ] **AC-006**：`confirm` 只记录三处业务确认。需求：FR-PUBLIC-001。方法：负向契约测试。通过：不产生不可逆授权。失败：确认隐式授权交付动作。证据：test。
- [ ] **AC-007**：`authorize` 只授权明确绑定的不可逆操作。需求：FR-PUBLIC-001。方法：负向契约测试。通过：操作、task 和授权范围匹配。失败：可被阶段确认替代。证据：test。
- [ ] **AC-008**：七类基线样本均由固定基线真实运行生成。需求：FR-BASELINE-001。方法：重算采集。通过：样本带基线身份、固定输入、原始/归一化结果和退出码。失败：手写或来源不明。证据：evidence。
- [ ] **AC-009**：归一化只移除非语义动态字段。需求：FR-BASELINE-001。方法：归一化契约测试。通过：保留错误类别、公开形状、状态/verdict 和授权效果。失败：删除语义差异或保留随机噪声。证据：test。
- [ ] **AC-010**：候选版本与基线逐行为对比，并对有意改变的旧内部语义明确排除。需求：FR-BASELINE-001。方法：差异报告。通过：七项均有结论和证据。失败：只给总 PASS 或冻结 lineage。证据：evidence/manual。
- [ ] **AC-011**：任一当前材料缺失或不可读时状态为 `not_ready`。需求：FR-MATERIAL-001。方法：契约测试。通过：缺失项明确。失败：继续并伪造材料。证据：test。
- [ ] **AC-012**：四材料齐全时可开始或继续当前任务。需求：FR-MATERIAL-001。方法：集成测试。通过：旧事实缺失/stale 不阻塞。失败：要求 accepted/checkpoint/receipt。证据：test。
- [ ] **AC-013**：修改 spec、plan 或 tasks 后可直接在同一 task 修复。需求：FR-MATERIAL-001。方法：最小 E2E。通过：无 reopen/rebind/selector/successor。失败：创建新任务或控制链。证据：test。
- [ ] **AC-014**：make-decision 创建 plan，build-spec/build-plan 细化同一材料，build-code/verify-code 以 tasks 为主表。需求：FR-STAGE-001。方法：五阶段 E2E。通过：无平行 accepted/current 投影。失败：出现第二份当前真相。证据：test。
- [ ] **AC-015**：失败、stale、unavailable 和 serious finding 不阻止同任务修复。需求：FR-QUALITY-001。方法：集成测试。通过：状态为 needs_revision/incomplete 且可继续。失败：冻结任务。证据：test。
- [ ] **AC-016**：缺测试、逐 AC、真实 review 或交接时不能宣称完成。需求：FR-QUALITY-001。方法：完成谓词测试。通过：保持 incomplete。失败：自动 PASS。证据：test。
- [ ] **AC-017**：每个待删机制族均有消费者、替代事实和删除顺序。需求：FR-DELETION-001。方法：只读 inventory 与人工审阅。通过：无未分类生产文件/消费者。失败：存在未知 reader。证据：evidence/manual。
- [ ] **AC-018**：旧控制机制在入口、handler、schema、fixture、测试、文档、配置、术语的生产引用归零。需求：FR-DELETION-001。方法：引用审计与负向测试。通过：归零清单无漏项。失败：任一生产 reader/writer 残留。证据：test/evidence。
- [ ] **AC-019**：删除前的新路径反向测试通过，删除后最小回归保持。需求：FR-DELETION-001。方法：focused tests。通过：替代行为可证。失败：靠兼容桥维持。证据：test。
- [ ] **AC-020**：新 task_dir 只保留 identity、append-only facts、quality 和 index，四材料不复制。需求：FR-STORAGE-001。方法：目录契约测试。通过：无 current/parent/generation 控制对象。失败：双真相或 lineage。证据：test。
- [ ] **AC-021**：审查报告、规范化 verdict、测试/verify 摘要、确认和授权事实可定位。需求：FR-STORAGE-001。方法：证据索引审计。通过：报告及 raw ref/hash 可回看。失败：覆盖、静默删除或来源丢失。证据：evidence。
- [ ] **AC-022**：质量事实只影响完成结论，不影响普通推进。需求：FR-STORAGE-001。方法：反 gate 测试。通过：缺失写 unknown/incomplete。失败：质量记录成为许可证。证据：test。
- [ ] **AC-023**：事实追加和材料替换具备原子性。需求：FR-STORAGE-001。方法：故障注入。通过：中断无半条事实或半份材料。失败：部分写入可见。证据：test。
- [ ] **AC-024**：M14–M17 的契约、索引、诊断、候选、skill 和 CLI 兼容资料被保留或有只读引用。需求：FR-LEARNING-001。方法：保留清单审计。通过：每类资料可定位。失败：误删或无索引。证据：evidence。
- [ ] **AC-025**：M14–M17 缺失或 unknown 不阻塞普通任务。需求：FR-LEARNING-001。方法：集成测试。通过：仅生成诊断事实。失败：变成 stage gate。证据：test。
- [ ] **AC-026**：历史 task 数据在实施前后内容摘要一致。需求：FR-HISTORY-001。方法：只读前后清单。通过：零改动。失败：迁移、补写或删除。证据：evidence。
- [ ] **AC-027**：新运行时不读取历史链作为推进许可。需求：FR-HISTORY-001。方法：负向集成测试。通过：新任务独立运行。失败：需要 legacy reader/importer。证据：test。
- [ ] **AC-028**：make-decision、build-plan、verify-code 的确认不能授权不可逆操作。需求：FR-AUTH-001。方法：负向契约测试。通过：授权事实缺失时操作拒绝。失败：确认可替代授权。证据：test。
- [ ] **AC-029**：每个不可逆操作需要独立且精确绑定的授权。需求：FR-AUTH-001。方法：权限测试。通过：错 task/错 op 拒绝。失败：广泛或隐式授权。证据：test。
- [ ] **AC-030**：正常新任务从创建到 verify 可完成同一条五阶段流程。需求：FR-STAGE-001。方法：最小 E2E。通过：最终 ready_for_confirmation。失败：依赖旧 stage-result 链。证据：test。
- [ ] **AC-031**：材料修订后 focused verify 在同一 task 完成。需求：FR-STAGE-001。方法：最小 E2E。通过：不生成控制链。失败：reopen/rebind/selector。证据：test。
- [ ] **AC-032**：写入中断或 review unavailable 后可重跑同一动作。需求：FR-STAGE-001。方法：最小 E2E。通过：无重复状态链且无假绿。失败：需 successor/recovery。证据：test。
- [ ] **AC-033**：serious finding 允许修复，但未修复或未明确承担风险时最终 verify 不得 PASS。需求：FR-QUALITY-001。方法：完成谓词测试。通过：结论真实。失败：finding 被抹平。证据：test。
- [ ] **AC-034**：task、workspace、write set、内容摘要任一错绑时正式写入 fail-loud。需求：FR-SAFETY-001。方法：负向测试。通过：写前失败且无产物。失败：错绑写成功。证据：test。
- [ ] **AC-035**：正式执行身份对应实际干净已提交内容。需求：FR-SAFETY-001。方法：identity 测试。通过：dirty 内容不伪装成 HEAD。失败：来源证明不实。证据：test。
- [ ] **AC-036**：普通编辑不被正式 publication 身份检查阻塞。需求：FR-SAFETY-001。方法：集成测试。通过：材料可继续修订。失败：运行身份成为编辑 gate。证据：test。
- [ ] **AC-037**：complexity/inventory 基线可从当前树重算并只输出诊断事实。需求：FR-GOVERNANCE-001。方法：基线重算。通过：失败不阻塞业务 stage。失败：报告成为许可证。证据：evidence/test。
- [ ] **AC-038**：超预算只停止扩大治理范围并形成待人工复盘项。需求：FR-GOVERNANCE-001。方法：规则审计。通过：不自动新增 gate。失败：预算触发业务阻断。证据：test/manual。
- [ ] **AC-039**：Multica Skill Bundle 不含 tests、node_modules 或 history，且包含五阶段运行所需闭包。需求：FR-DISTRIBUTION-001。方法：bundle closure 测试。通过：内容边界正确。失败：缺运行依赖或带开发资产。证据：test。
- [ ] **AC-040**：Local Runner 干净安装可执行五个 stage。需求：FR-DISTRIBUTION-001。方法：clean install 验收。通过：五阶段最小动作成功。失败：依赖仓库外隐式状态。证据：test。
- [ ] **AC-041**：风险相关的必要 mutation 测试与一次必要 full suite 在最终交付前完成且证据可定位。需求：FR-QUALITY-001。方法：verify-code 交付级测试审计。通过：mutation 覆盖声明的关键失败语义，full suite 只在最终集成有新增信息时执行一次并通过。失败：关键负向语义未被 mutation 证明、最终集成未做必要全测，或无新增信息反复跑全测。证据：test/evidence。
- [ ] **AC-042**：维护规则、宪法、宪法 checklist 和术语上下文完整固化并互相一致。需求：FR-RULES-001。方法：规则审计、checklist diff 和引用检查。通过：四材料真相、lineage 归零、质量非 gate、provenance 保留和新增机制约束均可定位且无冲突，宪法与 checklist 同步。失败：任一规则缺失、冲突、版本/条目不同步或术语仍宣称旧控制链。证据：test/evidence/manual。
- [ ] **AC-043**：verify-code 用户确认前，删除清单、保留清单、M14–M17 影响说明和最终 diff/change summary 均可直接定位。需求：FR-AUTH-001。方法：人工交接包审阅。通过：四项齐全时才可 `ready_for_confirmation`；用户确认后仍需独立 close authorization。失败：任一项缺失仍报可确认/accepted，或确认自动触发 close。证据：evidence/manual。

## 12. 风险、未决与交接

- **RISK-CONSUMER**：隐藏 reader/writer 造成半迁移
  - **受影响 ID**：PFACT-CONSUMERS、FR-DELETION-001、AC-017、AC-018
  - **触发条件**：删除生产入口后仍有旧机制消费者
  - **后果**：新流程仍被旧链控制或运行时失败
  - **缓解或 STOP**：未完成消费者清单和反向证明时停止删除该机制族
  - **处理 Stage**：build-plan、build-code
  - **验证**：逐机制引用审计和 focused test
- **RISK-BASELINE**：golden 误保留随机噪声或误删语义
  - **受影响 ID**：PFACT-BASELINE、FR-BASELINE-001、AC-008、AC-009、AC-010
  - **触发条件**：归一化字段无契约或样本手写
  - **后果**：产生伪差异或伪稳定
  - **缓解或 STOP**：固定输入、保留原始输出、测试归一化器；无法解释差异时不得报行为保持
  - **处理 Stage**：build-plan、build-code、verify-code
  - **验证**：重算与语义字段差异报告
- **RISK-RETENTION**：误删质量报告或治理学习资料
  - **受影响 ID**：PFACT-RETENTION、FR-STORAGE-001、FR-LEARNING-001、AC-021、AC-024
  - **触发条件**：把 task_dir 瘦身理解为整目录清理
  - **后果**：无法复盘质量或追踪原始输出
  - **缓解或 STOP**：删除前完成保留清单和 hash/ref 索引；引用不完整时不得删除
  - **处理 Stage**：build-plan、build-code
  - **验证**：保留清单和索引回读
- **RISK-RUNTIME**：legacy writer/vNext 边界阻断标准五阶段
  - **受影响 ID**：PFACT-RUNTIME、FR-STAGE-001、FR-SAFETY-001、AC-003、AC-030、AC-034
  - **触发条件**：新任务正式执行仍调用 legacy attempt writer
  - **后果**：只能靠临时绕过完成阶段，证据不可复现
  - **缓解或 STOP**：将该边界列为首个实现任务，以真实失败测试固定后做最小修复；未修复不得宣称五阶段 E2E 完成
  - **处理 Stage**：build-plan、build-code
  - **验证**：新 task 正式 run E2E
- **RISK-FAKEPASS**：unavailable、stale 或 serious finding 被改写为通过
  - **受影响 ID**：FR-QUALITY-001、AC-015、AC-016、AC-033、AC-041
  - **触发条件**：完成谓词复用推进资格或 fallback
  - **后果**：用户得到虚假完成结论
  - **缓解或 STOP**：保持四值质量语义和独立审查事实；假 PASS 测试失败时停止交付结论
  - **处理 Stage**：build-code、verify-code
  - **验证**：完成谓词和 review unavailable 负向测试
- **RISK-NEWGATE**：复杂度治理再次长成新 gate 平台
  - **受影响 ID**：FR-GOVERNANCE-001、FR-RULES-001、AC-037、AC-038、AC-042
  - **触发条件**：预算、inventory 或证据缺口被用于阻塞业务 stage
  - **后果**：复杂度以新名字回流
  - **缓解或 STOP**：诊断工具只输出事实；任何新增 gate 必须有真实失败和人工决定
  - **处理 Stage**：build-plan、build-code、verify-code
  - **验证**：反 gate 测试和宪法审计

N/A — 已接受方向和本规格没有需要用户重新决定的开放问题。PFACT-CONSUMERS 与 PFACT-RUNTIME 是后续工程调查项，不改变产品范围或验收语义。

## 13. 业务影响与回归范围

### 五阶段任务流程

- **既有行为**：五阶段存在，但正式运行仍消费多套历史控制对象。
- **本需求影响**：五阶段只围绕当前材料和单条质量事实推进。
- **回归路径**：正常五阶段、材料修订、不可用/中断三条 E2E。
- **验收**：AC-030～AC-032

### 审查与验证

- **既有行为**：真实审查和质量事实存在，但 review-flow、round、selector 与完成判据耦合。
- **本需求影响**：每次 review 只追加真实事实；verify 即时计算完成质量。
- **回归路径**：pass、revise_required、unavailable、serious finding、stale 事实。
- **验收**：AC-004、AC-005、AC-015、AC-016、AC-033

### 任务存储与历史资料

- **既有行为**：task_dir 含多套 current、accepted、receipt、flow 和 lineage 投影。
- **本需求影响**：新任务只保留最小 identity/facts/quality/index；历史任务零改写。
- **回归路径**：目录契约、原子写、保留索引、历史前后摘要。
- **验收**：AC-020～AC-027

### 发行和跨宿主使用

- **既有行为**：Bundle 与 Runner 已分离，但当前树闭包需重新验证。
- **本需求影响**：简化后的五阶段继续可搬运、可干净安装。
- **回归路径**：Bundle closure 与 Local Runner clean install。
- **验收**：AC-039～AC-040

- **可能受冲击的业务规则**：错绑 fail-loud、review unavailable 不 PASS、serious finding 不锁修复但约束完成、确认与授权分离。
- **明确无影响**：历史 task 内容、外部 provider 内部 retry、业务项目数据和不可逆交付状态。
