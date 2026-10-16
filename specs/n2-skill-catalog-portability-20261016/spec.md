# 功能规格：技能目录、来源与单技能搬运

读者：build-code 实施者、verify-code 验收者与维护者。读完能找到当前行为、全局设计、各 Phase 与唯一验收判据。

- 功能：`n2-skill-catalog-portability-20261016`；`content_profile: post`；范围 `non_ui`。
- 来源：[decision-log.md](decision-log.md) 的 R-001…R-012、U-001…U-009 与 D-001…D-032；父 PRD N2 段只读保留产品目标权威。
- 状态：build-plan 草稿，`unverified`；实施计划尚未取得用户选择，build-code 未开始；本轮按独立scope-approved另做四个共享文件补修，见“额外授权补修”，不代表N2计划获批。本文件写成不表示N2行为已实现、已验收或已交付。
- 身份与外置原件基准：worktree、分支、HEAD、任务库根以 [decision-log.md#任务身份](decision-log.md#任务身份) 为准；下文 `task:` 指该任务库根，`parent:` 指父任务库 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/skills-framework-redesign-20261014`。

## 速读卡（30 秒）

让阶段调用者按名读到真实技能，让人从一个索引找到正文；让维护者能查清采用内容、来源与取回事实，并手动判断上游变化。保留现有常驻策略。沿既有 catalog、正文、bundle 和工具面逐项修复；单技能复制只要求引用可读或如实声明同仓依赖。技术结果、整体成本、外部许可与 N10 接线分别判断；验收判据仅在 Appendix A。

## 材料导航

本导航可重生成，不是第二份进度或契约。

| 去哪里 | 读什么 | 何时读 |
| --- | --- | --- |
| 来源与决策映射 | 原始要求与当前翻译关系 | 核范围或追溯来源 |
| 第 3—5 节 | 场景、PFACT、FR | 实施前理解行为 |
| 测试标准、实现设计 | 对象、接口、文件边界与 Task | 选定具体改动时 |
| Appendix A | 唯一验收条件与预期证据 | 测试、审查、逐项验收 |
| 第 12 节、补充材料 | 风险、未知与原始材料 | 触及对应依赖时 |

## 来源与决策映射

R 与 U 的原义、来源地址、真实用户答复均由 decision-log 原节维护；本表只绑定当前翻译。D 编号是本任务原有来源 provenance，不把它们改写成新 ADR 决定。正式 ADR 仅引用已存在的 `docs/adr/0045-single-skill-portability-criterion.md` 与 `0046-single-source-registration-authority.md`，本规格不创建决定。

| 原始来源 | 既有决定 provenance | FR / AC（均 N2 域） | source_status / 场景 | 原件入口 |
| --- | --- | --- | --- | --- |
| R-001 | D-003、D-004、D-022、D-023、D-027 | 003、007 | current / SCN-003、006 | 原始需求 §1 第 8 项 |
| R-002 | D-003、D-010、D-023 | 003、008 | current / SCN-003、007 | 父 T11 开头质询 |
| R-003 | D-007、D-019、D-020、D-021、D-023 | 001、002、003 | current / SCN-001、002、003 | 父 PRD N2 FR-T2-001 |
| R-004 | D-002、D-006、D-008、D-026、D-031 | 004、006、012 | current / SCN-004、005 | 父 PRD N2 FR-T2-002；ADR 0045 |
| R-005 | D-003、D-016、D-022、D-024 | 003 | current / SCN-003 | 父 PRD N2 FR-T2-003；ADR 0046 |
| R-006 | D-004、D-027 | 007 | current / SCN-006 | 父 PRD N2 FR-T2-004 |
| R-007 | D-013、D-016、D-028 | 003、008 | current / SCN-003、007 | 父 decision-log AC-007 |
| R-008 | D-002、D-003、D-004、D-022 | 003、006、007、011 | current（8a/b/c、5b 的 N2 形态）；其余 non-goal / SCN-003、005、006、007 | 父 UNITS 8a/b/c、5b |
| R-009 | D-005、D-010、D-028 | 001、002、003、008 | current / SCN-001…007 | 父 PRD 54 项采用表 N2 八行 |
| R-010 | D-010、D-029 | 001、002、003、005、008 | current / SCN-001…004、007 | 父 PRD 17 来源表与 E-2/E-10 |
| R-011 | D-014、D-025、D-032 | 005、009、011 | current；具名风险 / SCN-004、007 | 父 PRD G1；U-009 |
| R-012、U-001…U-009 | D-001、D-009、D-011、D-012、D-015、D-017、D-018、D-030、D-031、D-032 | 001…012 | current / SCN-001…007 | 当前 decision-log 需求变更记录 |

每个表内数字指同号 `FR-N2-NNN` 与 `AC-N2-NNN`；例如 003 为 `FR-N2-003` / `AC-N2-003`。原 `AC-001…AC-012` 与本规格同序一一映射，仅增加 canonical DOMAIN，原编号保 provenance。全部既有 D-001…D-032 均在本表或其来源行具名，不新设要求分母。R-008 中各实际 owner 的 54 项整体生效与最终全量复核按第 10、12 节交接。

## 1. 需求解释：问题与紧迫性

当前调用者能看到登记，却可能被坏路径、过期状态、裸外部技能名和不真实的依赖清单带错。维护者同时面对 catalog、bundle、索引与正文里的重复来源事实；版本或 hash 并不能回答究竟采用了什么，也不能证明已经同步。先把这些实际入口修成可信内容，才能独立判断搬运与上游变化；继续增加登记副本只会扩大漂移面。

本卡承接父 PRD N2 的目录职责。外部三仓全部内容落地仍由各内容 owner 承担，本卡只对已分配采用和目录本职负责，N1技术交付及验收结论已可读，成本结论仍等待完整同条件样本。

## 2. 背景、目标与范围

### 背景

已有 `skills/catalog.yaml`、`skills/reuse-registry.md`、各技能正文/skill-bundle 与 notices。来源三层、机器权威、人读投影、vendored 字节与可搬运的术语归 `GLOSSARY.md`；两份正式决定归 ADR 0045、0046。D-029/030 的真实写入已发生于 make-decision，不在 build-code 冒报首次完成。

### 目标

调用者找到正文；维护者定位采用内容和真实来源；搬运者识别已声明依赖与断链；上游核对给出当时可证结果。技术可用、样本范围与整体效果保持可区分，具体完成条件见 Appendix A。

### 范围内

沿决定的七个工作包顺序交付：机器清单、人读索引、来源、引用/依赖、搬运、手动上游、其余采用与减法。后一个包只消费前包已首次验证的结果，终末只复核。独立 Phase 拆到单一判定器；共享 catalog、正文、bundle 同一时刻一个 writer，跨卡合入锁内重读。

## 3. 用户场景与状态覆盖

### SCN-001：阶段调用者按名读取，登记维护者改清单

阶段调用者从当前 workflow 依赖或 catalog 找技能；维护者先真读目标再写路径、消费者、阶段归属。活动、退役与漏登是不同状态；真实缺失停止当次写入并报告，已有无程序消费者的历史取舍与来源仓登记仍保留。产品翻译 FR-N2-001；判据 AC-N2-001、008。

### SCN-002：人从场景找到技能

读者按日常任务选择技能、从唯一人读索引走到正文。正文承担语义，catalog 承担登记事实；冲突交对应 owner 修正。旧 docs 副本仅作指针。三类测试技能正负 prompt 辨别其任务边界，description 相似只诊断。产品翻译 FR-N2-002；判据 AC-N2-002、008。

### SCN-003：维护者追来源并更新来源登记

维护者从采用内容走到固定来源的路径与章节，分别处理常规外部源、本地用户提供源、无版本历史包、未核许可与真正 vendored 字节。catalog 记录完整事实；便携小卡和正文随技能走，notice 对外给许可出口。产品翻译 FR-N2-003、008；判据 AC-N2-003、008。

### SCN-004：技能作者修正文引用与真实依赖

作者逐条阅读本地跨技能引用，区分同仓文件、外部来源与自引用，回写现有目录路径列表；机械提取只给候选。产品翻译 FR-N2-004、005；判据 AC-N2-004、005。

### SCN-005：搬运者复制单个技能目录

执行者把 `ui-project-init`、`stage-reflection`、`spec-specify` 各自复制到空目录，逐引用读回；至少一个样本含附加资源。副本里同仓引用可解析，或正文具名声明依赖且登记相符；外部引用按来源仓与技能名判断。宿主守卫读取实际闭包，检测技能面的宿主耦合。产品翻译 FR-N2-006、012；判据 AC-N2-006、012。

### SCN-006：维护者手动检查上游

维护者在来源登记的说明处按坐标只读核上游，首次保留真实基线，再作比较；网络失败、无版本历史和不能证明 commit 分别说明。默认不调用，无自动更新动作。产品翻译 FR-N2-007；判据 AC-N2-007。

### SCN-007：实现者分段交付，验收者核技术与成本

实现者在每个行为段验证、独立审查和提交，后段保全前段语义；验收者分别核八项采用、补充目录职责、双口径字节与 N1 成本结果。无数据保未知，旧红保持原样。产品翻译 FR-N2-008…011；判据 AC-N2-008…011。

### 状态覆盖清单

| 状态 | 适用场景 / 处置 |
| --- | --- |
| 默认 | SCN-001、002；合法清单与按名读取 |
| 空 | SCN-003、004；空依赖保空，空来源不冒完整 |
| 错误 | SCN-001、003、005、006；坏路径、非法来源、断链、联网失败分别显露 |
| 加载 | N/A — 同步 CLI/文件方法，没有加载视图 |
| 取消 | SCN-007；命令或审查取消保实际失败，不写通过；不新增取消机制 |
| 边界 | SCN-003、005、007；来源两型、空依赖、vendored 子集、双口径 |
| 权限 | SCN-001、003、007；真实授权范围和属主证据先于破坏动作 |
| 竞态 | SCN-001、007；共享文件唯一 writer、锁内重读；原 owner 局部修复 |

## 4. 产品事实与假设（PFACT）

- **PFACT-001** — **状态**：`verified`。当前方向与具名样本已确认。证据：当前 decision-log、`task:quality/evidence/human-confirmations/2026-10-16-001-make-decision-approve.json`；该确认只绑定路径与 HEAD，不提供所见字节 hash。关联 FR-N2-001…010、012；AC-N2-001…010、012。
- **PFACT-002** — **状态**：`verified`。清单/索引/引用与宿主守卫存在前置缺陷。证据：`task:quality/evidence/research/n2-repo-current-state.md`、`n2-module-design-facts.md`、`task:quality/tests/2026-10-16-001-host-independence-baseline.txt`；这是基线事实，非改后结果。关联 FR-N2-001、002、004、005、012；同号 AC。
- **PFACT-003** — **状态**：`verified`。来源字段形状与消费者缺口已有实测记录；两个来源字段首次建立，常驻复算/最终接线归 N10。证据：`task:quality/evidence/2026-10-16-006-module-convergence-brief.md` 与 `research/n2-module-design-facts.md`。关联 FR-N2-003、008；AC-N2-003、008。
- **PFACT-004** — **状态**：`unknown`。来源包许可链、真实固定版本与可取回性未全部核实。owner：build-code 来源维护者；影响 FR-N2-003、007 与 AC-N2-003、007，绑定 OPEN-002/003、RISK-002；下一动作由 P3/P6 逐来源读取 LICENSE、取回坐标并保真实缺口。
- **PFACT-005** — **状态**：`unknown`。N1工具、四阶段末步接线及整卡验收结论已可读；完整同条件成本样本仍缺，整体效果未知。精确来源与限制见第12节OPEN-004。owner：N1 owner；影响 FR-N2-011、AC-N2-011；绑定 OPEN-004、RISK-004。不能从字节数推断 token/耗时收益。
- **PFACT-006** — **状态**：`verified`。当前 G1 基线和具名口径风险已有原件。证据：`task:quality/evidence/2026-10-16-005-g1-baseline.txt`、decision-log D-032/AC-009 与 U-009 原件；关联 FR-N2-009、AC-N2-009。精确基线只在 Appendix A 引用。
- **PFACT-007** — **状态**：`unknown`。真实 service、route、viewport 未由 non_ui 合同提供。owner：build-plan 主会话；影响测试标准验收对象，不影响已知文件/CLI 检查；绑定 OPEN-005。缺项保 null，不编服务或浏览器观测。

## 5. 功能需求

### 目录与入口

机器清单承接登记事实，人读索引引导人找到正文。两者分工消除状态副本；名字/版本只留机器权威，文件头仍带可读标识。

- **FR-N2-001**：修真实活动路径、退役语义、漏登项目和文件头冲突；保留历史登记及其理由。来源 R-003、R-009、U-008；PFACT-001/002；SCN-001；AC-N2-001。
- **FR-N2-002**：人读索引只承接技能、适用场景与正文入口，旧 docs 副本退指针；以真实目标处理语义冲突。来源 R-003、R-010、U-008；PFACT-001/002；SCN-002；AC-N2-002。

### 来源、引用与搬运

每条采用先可定位，再区分证明到哪里；来源缺口不能通过格式一致或 hash 字样掩盖。单技能搬运允许显式同仓依赖，因此依赖登记先改真，再检查副本。

- **FR-N2-003**：完整来源事实归 catalog，便携小卡标明非权威；两型来源、采用描述、许可、取回、vendored 指纹及两个具名无源adapted矛盾按当前决定处理。来源 R-001、R-002、R-005、R-007、R-008、U-008；PFACT-001/003/004；SCN-003；AC-N2-003。
- **FR-N2-004**：正文区分本仓相对路径与外部“来源仓＋技能名”，修已识别坏引用。来源 R-004、R-008；PFACT-001/002；SCN-004；AC-N2-004。
- **FR-N2-005**：现有依赖目录路径列表与逐条确认的正文引用相符，自引用去除，空依赖留空。来源 R-004、R-010、U-006/008；PFACT-001/002；SCN-004；AC-N2-005。
- **FR-N2-006**：三个具名技能各自脱离仓根，按同一个单技能判据做真实引用读回。来源 R-004、R-008、U-008；PFACT-001/002；SCN-005；AC-N2-006。
- **FR-N2-007**：在来源登记处提供默认不跑的一次性只读上游核对方法，首次坐标基线和失败如实保留。来源 R-001、R-006、R-008；PFACT-001/004；SCN-006；AC-N2-007。

### 采用、验证与效果

采用在真实消费行为首次发生时交付，末段只回读。字节减少与主 Agent 效率分别可证，不能相互替代。

- **FR-N2-008**：本卡八项采用与补充目录职责在既有消费位置落地，各有能失败的反例；运行时/工具只加内容规则与校验判据，保现有报告和退出语义。来源 R-009、R-010、U-008；PFACT-001/003；SCN-001…007；AC-N2-008。
- **FR-N2-009**：按选定口径与全口径分别现场复算，列具名删除/合并对象，保留 D-032 风险。来源 R-011、U-009；PFACT-001/006；SCN-007；AC-N2-009。
- **FR-N2-010**：各行为段有针对性检查、独立审查及提交；现有已知红不改绿，缺质量真实记缺。来源 R-012、U-001/003/005；PFACT-001/002；SCN-007；AC-N2-010。
- **FR-N2-011**：成本结论消费 N1 完整结果并进行同任务同命令同条件同预算对照；未具输入保未知。来源 R-008、R-011、U-003；PFACT-005；SCN-007；AC-N2-011。
- **FR-N2-012**：宿主独立性用修复后的真实宿主守卫和单技能搬运两个动作判断，区分样本与整体主张。来源 R-004、U-008；PFACT-001/002；SCN-005；AC-N2-012。

## 6. 模块划分

| 产品模块 | 消费者与结果 | 依赖 | FR |
| --- | --- | --- | --- |
| 机器登记 | 阶段调用者/维护者；可信登记 | 实际目标文件 | 001 |
| 人读入口 | 按场景点名技能的人；正文入口 | 机器登记、目标正文 | 002 |
| 来源维护 | 更新者；可核采用与取回事实 | 来源材料、许可 | 003、007 |
| 引用与搬运 | 技能作者/搬运者；真实依赖与副本读回 | 登记、正文、bundle | 004、005、006、012 |
| 既有边界采用 | 工具调用者/下一维护者；安全且可理解的接口 | 既有写入口/schema/report | 008 |
| 分段验证与效果 | 实施者/最终验收者；质量与成本各自结论 | 每段原件、N1 | 009、010、011 |

## 7. 关键实体

- **技能登记**：catalog `skills` 活动项及退役项；`name`、版本、路径、`used_by_stages`、`dependency_closure` 保原字段职责；状态词表按所在区域解释，不能跨区域套用。
- **来源登记**：catalog `upstream` 是完整权威。常规外部源承载来源仓、相对路径、稳定章节、采用简述、许可与取回坐标；`adopted` 说明用了什么。`content_sha256` 仅用于实际 vendored 字节，检查器计算，不手填。
- **本地来源**：`kind: user-provided-local-source` 与 `authorization_basis` 保留真实授权/取回事实；无法提供的坐标逐字段留 owner 与缺口，不伪装 Git pin。
- **便携小卡**：技能目录内既有 bundle 的 `sources` 最小来源指针，非权威；完整事实不与 catalog 双写。正文来源段负责随技能可读；notice 是许可对外出口，不是第四来源层。
- **写入边界值**：允许根、目标至少下一层与操作前属主证据联合解释真实操作授权；形状合格不单独证明授权。无新持久对象、版本谱系或进度账本。

## 8. 数据和生命周期

维护者写入前先读实际目标和原来源；合并前逐字段比较两处登记，等价才去重复，不等价保差异并按机器权威规则处置。重复写同内容保持幂等；半途失败不冒成功，原 owner 修受影响 hunk。历史决定、测试、review 和报告只读保留；证据同字节复用原件，无法证明相等则保新件并记 deduplication unknown。

本卡不增加缓存、常驻漂移服务或自动更新。单技能副本只在任务隔离临时目录使用，失败保原技能目录；清理仅删除本次确认不再需要的临时副本，测试/readback 原件保留在任务库。跨卡共享文件按锁内重读与唯一 writer 串行合入。

## 9. 兼容性预留

合法既有 `checkSkillConsistency(root)` 返回 `failures` 与 `reports` 的职责、CLI 退出语义、bundle 非来源字段、现有窄工具调用方接口保持。来源 schema 在既有文件内扩充两型规则，不引 TS、brand 框架或无 consumer 类型层。公共 runtime 仍为七类。未来 N10 接线保全本卡已有 report 行为，不以等待 N10 阻止本卡修复，也不把本卡规则完成说成 N10 已生效。

## 10. 明确不做与默认必须成立

### 明确不做

- 不新增检查器、命令行工具、技能目录、第四份来源登记或第二台账；不拆 `tools/cli/lib`，不新增公共 runtime 命令、schema 文件、常驻服务或进度对象。现有 checker/schema 的内容改造属 D-028，不是新工具或新 schema。
- 不自动同步、默认跑漂移检查或据漂移阻断推进；不把有 hash 当已同步，不手填 vendored 指纹，不普遍给 adapted 条目加 hash。
- 不改变常驻策略，不修改宿主全局技能目录，不重建副本/索引权威，不造空目录对齐外仓；不以整依赖闭包复制替代单技能判据。
- 不改已知红、`tests/acceptance/card-03-current.*` 悬空清单或无关 thin-core 残留；宿主守卫的崩溃与已删阶段名属于本卡，不能援引该排除拒修。
- 不新增机器停机门，不把 report 接进 failures 或改变退出码；写前缺失停止当次写入是维护者行为规则，现有安全保护仍有效。
- 不把相似度阈值、英文 rank-1/95% 或固定字数门套成中文硬规则；不新增无真实选错案例的边界字段，不复制外部核心行为整段。
- 不重排旧 ADR 或新增第三份 ADR；不改旧 snapshot、历史报告、其它任务、旧 task 图或提出 recovery/reopen/rebind 等机制。
- 不承担各实际 owner 的 54 项全体内容生效或最终全量复核；本卡保 N2 形态与本职采用。许可无法核实不冒核实，不把登记覆盖缺口改写成许可冲突。
- 不做 UI、原型或浏览器验收；不以字节减少替代真实主 Agent 成本。

简化取舍：实际缺陷需要修，但既有登记、schema、report 与窄写入口已能承接；方案停在 simplicity-guard P1/P2。删除重复人读正文、来源双写、自引用与不可复算 hash；保住真实约束及历史理由。一次性人工/AI 读回能验的内容沿既有命令采集，不为语义判断造新 validator 或机器 gate。

### 默认必须成立

原作者与输入来源决定信任；合法调用和既有失败语义保持，真实错误明确暴露。逐项原件支持才报告实施/验证/质量/交付，不能从索引、字段存在或样本通过推整卡完成。

## 验收流程

从 SCN 进入 FR，再读 Appendix A 的同序 canonical AC，按本文件需求到任务追踪去对应 Phase 的 Task/命令及 oracle。原 `decision-log ## 验收面` 为上游交接索引，不在叙事或 Phase 复制 AC 正文。每行为段先形成首次判定；P12 逐项消费已有原件并报告剩余缺项，verify-code 独立搬运、上游与成本复跑不借兄弟卡新方法代替本卡首验。

## 测试标准

| 测试面 | 适用 / oracle | 证据类型 | 命令 owner / AC | 覆盖限制 |
| --- | --- | --- | --- | --- |
| 文件/登记内容 | 适用；ORACLE-N2-CATALOG、ORACLE-N2-HUMAN、ORACLE-N2-SOURCES、ORACLE-N2-DEPENDENCIES | 原始读回、目标断言输出 | P1—P4 / 001—005 | 静态读回不证明上游和搬运 |
| 真实单技能搬运 | 适用；ORACLE-N2-PORTABILITY | 三空目录逐引用读回 | P5 / 006、012 | 三样本，至少一含附加资源；不充分证明全部技能 |
| 真实宿主扫描 | 适用；HOST-INDEPENDENCE（现有 WorkflowHub host independence 测试组） | 目标测试原始输出 | P1/P5 / 001、012 | 检测面仅技能闭包，不证明所有宿主 |
| schema/纯函数/CLI 边界 | 适用；ORACLE-N2-REPORTONLY、ORACLE-N2-SAFETY、ORACLE-N2-BOUNDARY | 合法/非法受控反例输出 | P3/P7—P9 / 003、008 | 保原 failures 与 CLI 行为，最终接线未含 |
| 外部来源与手动上游 | 适用；ORACLE-N2-UPSTREAM | LICENSE/取回/基线/联网与断网事实 | P3/P6 / 003、007 | 无版本历史与不可取回各自保未知 |
| 字节与成本 | 适用；ORACLE-N2-BYTES、ORACLE-N2-COST | 双口径现场核算、N1原件及对照 | P10/P11 / 009、011 | 字节非性能；成本缺输入不全验 |
| 分段交付 | 适用；ORACLE-N2-ACCEPTANCE | 每段测试/review/commit引用 | 各 Phase / 010 | review unavailable不改写通过 |
| 浏览器/UI | N/A — non_ui，无产品页面或HTTP流程 | 无浏览器证据 | 不执行 | 不主张页面/视觉/浏览器端到端通过 |

精确可执行命令与 RED/GREEN 由上述 Phase 的 Task 唯一维护；本表 oracle 与 Appendix A 同义，不能以无失败断言的空命令充当验证。只跑受影响针对性检查，禁止无范围全量回归。

### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-n2-skill-catalog-portability-20261016",
  "service": null,
  "route": null,
  "state": "本任务认证工作树内的技能目录、来源、引用和依赖待实施状态",
  "viewport": null,
  "owner": "build-plan 主会话"
}
```

workspace 来源为 decision-log 任务身份；state 来源为当前范围与尚未实施状态。service、route、viewport 未由 non_ui 合同提供，分别缺真实服务配置、HTTP/页面路由、浏览器规定尺寸；提供者为 build-plan 主会话，影响仅为不能主张对应服务/浏览器验收。当前仍保 null。模板唯一 producer 已真实执行，命令退出 0，但返回 `ok=false`、`missing_fields=[service, route, viewport]`；唯一输入/返回原件为 `task:quality/evidence/2026-10-16-003-build-plan-acceptance-object.output`，对应执行记录 `.json`。该结果只披露最小输入缺失，不是业务失败或新推进门。若后续范围引入真实服务/UI，由原材料 owner 回读来源再补输入，不能给本次编造默认服务或尺寸。设计来源、数据、权限按来源与写入契约验，不把这五项当完整业务验收。

### 十维澄清结论

`trigger=false`；实质方向歧义 0。此为材料核对结论，不代用户答复或计划批准。

| 维度 | 当前结论 | 未知 / owner / 下一动作 |
| --- | --- | --- |
| 用户旅程 | current；SCN-001…007 | 无新方向问题 |
| 页面/表面 | non_ui；文件、CLI、来源、搬运 | service/route/viewport 缺项见验收对象 |
| 数据/状态迁移 | current；登记权威、两型来源、报告语义 | N10 接线 deferred；N10 owner承接 |
| 成功边界 | Appendix A 唯一承接 | 改后执行事实未产生；build-code/verify-code |
| 失败边界 | 已定；断链、缺失、不可核、报告/退出各有落点 | 联网真实性由 P3/P6 观测 |
| 权限/角色 | 写入前目标、属主和授权；最终close另确认 | 不把形状校验当授权 |
| 集成/外部效果 | 手动只读核对；无自动同步 | 许可、pin缺口由来源维护者逐项保留 |
| 非目标 | 第10节继承全部硬边界 | 不重开已回答选项 |
| 延期交接 | N1成本、N10复算/接线、非本卡残留 | 精确对象与取得时点见第12节 |
| 验收/观察证据 | 各Phase首次判定，终末逐项复核 | 缺原件保unknown/unavailable/incomplete |

依据：D-002/026 已统一搬运二分，D-024 已处理来源异形，D-005 已区分写前行为与机器门，D-028 已取代 D-013 的写入归属旧句，D-032 是已知情风险。无需重新问相同方向；环境事实由现有代码与来源读取，不转成用户选择。

## 架构边界

产品边界是“谁消费哪份事实”：catalog 供登记/检查；索引供人选技能；正文/便携小卡供搬运；notice 对外披露许可。工程边界是现有文件读取、写入、schema、纯报告函数和 CLI 的契约；新规则落真实过边界处，通用机制留内部、策略在边缘，文件系统与 Git 保护不能遗漏。公共输出不泄 transport/storage/framework/wire 内部表示。

## 实现设计（全局权威）

### 代码锚点

本节锚点由 Phase 架构作者实读并回传，当前作者复读核心源码核接口；行号会漂移，符号与行为语义才是契约。当前已核实方案：宿主守卫 `tests/host-independence.test.mjs` 的 `workflowStages` 与 `skillClosureSurfaceFiles`；清单 `skills` / `capability_decisions` / `projects`；checker `tools/cli/check-skill-consistency.mjs` 的导出 `checkSkillConsistency(root)`；既有 `runtime/interface/safe-write.mjs`、`runtime/schemas/skill-bundle.schema.json`。行号仅定位快照，不作契约。

宿主守卫从 workflow 依赖项 `path` 所在目录读真实 `skill-bundle.json` 与 `files`，移除已删阶段 `build-spec`；不为测试新增 manifest 键，五份 workflow manifest 不写。checked 目标仍为真实技能闭包，不削弱宿主 token 断言。

既有工具精确锚点：`safe-write.mjs` 的 `destination` / `publish` / `writeFileAtomic` / `createFileOnce`；`tools/cli/task-bootstrap.mjs` 的 `bootstrapTask` 及其调用 `createFileOnce` 的位置；`runtime/interface/runtime-facade.mjs` 的 `createRuntimeFacade` / `invokeRuntimeCommand`；`docs/quality/test-asset-registry.json` 的既有 `retirement_policy` 字符串。维护规则邻接现有符号，schema/报告仍由真实 consumer 验，静态注释不充当效果。

既有断言与已确认方向存在四处具名测试变更请求（TCR）。以下四项已连同原字节、实际旧失败/基线及完整材料送同一次独立 review（原件`task:quality/reviews/2026-10-16-019-build-plan-document.json`）；送审真实执行，逐TCR专项coverage为undetermined，不等于批准或质量通过。实施者保持原保护、记录实际结果和缺口，不自行改弱断言求绿，也不新增逐项显式许可门。发现新冲突回独立测试 owner，不扩本表范围。

| TCR | 精确对象 | 变更理由 / 受保护强度 | 写入归属 |
| --- | --- | --- | --- |
| TCR-N2-VERSION | `tests/contract/ui-skill-contract.test.mjs` 的 `assertFrontmatter`（实读82—87）及其三个skillSpecs调用 | D-019删重复头version；保frontmatter/name/description强断言，版本改查catalog.local_version合法，另判头version缺席，不删除版本真实性保护 | P1/T001；P3后续写同文件，严格P1→P3 |
| TCR-N2-UPSTREAM | 同文件 frontend-component-quality.upstream `assert.deepEqual`（实读190附近） | D-022加adopted；原github_url/commit/commit_url/license/reviewed_at/review_outcome/path/skill_url八字段及deepEqual全保，只扩下述具体采用数组 | P3/T003 |
| TCR-N2-REPORTONLY | `tests/n2-skill-catalog-portability.test.mjs` 的第二个ORACLE-N2-REPORTONLY case | 原hash漂移目标越过N10边界；改为真实非法来源组合报告，保healthyFixture前置failures=[]、实际报告断言、原failures不变及CLI exit0对照；旧目标原字节/RED保留，新目标另留真实RED | build-plan独立测试owner；实现Phase只消费冻结结果 |
| TCR-N2-CLOSEOUT | `tests/contract/stage-closeout-skill.test.mjs` 的 `resolves its declared graph dependency...`（实读27附近） | D-025去自引；保knowledge-graph，按正文38/100的真实引用补spec-specify，依赖集合明确为这两个其他技能且不含自身；原去重/相对路径/逐项catalog存在/validateSkillBundle身份断言全部保留 | P4/T004 |

P1的四个UI技能写集仍为ui-project-init、design-source-readiness、frontend-prototype-render、frontend-component-quality；其中assertFrontmatter实际只覆盖ui-project-init、design-source-readiness、frontend-component-quality三个skillSpecs，frontend-prototype-render由ORACLE-N2-CATALOG的全部活动技能头部断言覆盖。不因删version改变正文/description及已有UI触发职责。P4的排序集合期望为 `['skills/knowledge-graph', 'skills/spec-specify']`，仍显式 `not.toContain('skills/stage-closeout')`，不能用移除整条依赖断言替代。

P3 frontend-component-quality 的adopted期望固定为下列两字符串；固定源为原八字段中的commit和path，实际来源节已由架构作者在该commit primary raw中核读。它们是明确采用内容，不是新增笼统标签：

```json
[
  "skills/react-best-practices/AGENTS.md#1-eliminating-waterfalls — 从消除串行请求建议提炼组件质量检查，保留真实依赖顺序",
  "skills/react-best-practices/AGENTS.md#2-bundle-size-optimization — 从包体积建议提炼窄客户端边界与按需加载审查，收益仍须实测"
]
```

本地该AGENTS.md为compiled摘要，不据文件名或19行长度声称整篇上游原字节vendored；该upstream条目只扩adopted，不捏造content_sha256。只有逐字vendored对象才建立null指纹字段并留一次性真实复算事实，默认复算/回填归N10。指针按bundle/技能目录（`skills/<name>/`）解析，退一层到`skills/catalog.yaml`。十八个便携卡的精确形状统一为 `sources: [{"path":"../catalog.yaml#skills.<name>"}]`，<name>逐个替换为本节exact名单中的真实技能名；没有附带一套完整来源字段。

### 接口与失败语义

P3/T003具名修正 `workflowhub-host-protocol` 与 `workflowhub-multica-sync` 的 `status: adapted` / `upstream: []` 矛盾。架构作者已核原始登记：`55e56137d76cd18da54c66a3f53bea576d01231c:skills/catalog.yaml` 的host-protocol为native/upstream空；`fe991fac228f954b9a066989dcda162adaef2f38:skills/catalog.yaml` 两项均native/upstream空，后者首次新增multica-sync。结合当前本仓方法归属，P3来源维护者修两条status为`native`，upstream仍空，并在既有local_changes留更正理由与上述原始登记ref；不是凭通过测试猜native，不捏造外部来源。首次来源收口前由独立读者回读原始登记/当前正文/改后catalog；若观察推翻该事实，原owner如实报告具体差异并修真实来源，不给冻结SOURCES测试加豁免。两条属R-007既有真缺陷与本卡catalog写集，不扩为实现清理。

catalog 原字段 → 一次性读取与来源/依赖对账 → 既有 reports；来源单权威与两型真实事实 → catalog；便携指针 → 既有 bundle schema → 小卡合法性；技能正文与目录 → 单技能隔离副本 → 引用读回。sources 小卡只保指向权威的最小来源信息，禁止把 catalog 完整字段再抄回来。

`checkSkillConsistency(root)` 保既有 `{failures, reports}`；旧 failures 和 CLI 失败退出仍存在，N2 内容规则只追加 reports，不把“只报告”误读为把整个 CLI 改成永远 exit0。catalog `upstream[].adopted` 固定为非空采用描述数组（有 github_url 的来源适用）；`content_sha256` 仅真正 vendored 项建立、当前值为 null，另留一次性本地对象字节复算原件，不手工回填权威值。默认字节复算、漂移检测与真实回填均由 N10 接线，本卡 checker 只报告来源形状、采用说明缺失、非法字段组合。既有 schema 的 `properties.sources.items.oneOf` 只在当前三分支收紧：常规源保原字段并增 adopted 非空字符串数组、content_sha256 为64位小写hex或null；本地源保kind/path/license/authorization_basis/reviewed_at/review_outcome，snapshot_sha256改可选、真实缺项不伪造；最小便携指针只留path，复用 `../catalog.yaml#skills.<name>` 定位权威，$comment说明非权威。bundle只写指针、不双写完整登记；单技能副本的catalog指针可能不可解析，正文仍保必要来源名/取回线索并说明回原权威查完整事实，不能重建本地权威。

P3先以同一schema做合法/非法真实检查；P8复用已安装 `ajv` 8.17.1 的 `ajv/dist/2020.js`，按模块相对 `new URL('../../runtime/schemas/skill-bundle.schema.json', import.meta.url)` 读取并编译既有 `properties.sources.items`；常规catalog项把github_url投影url，并仅取既有合法字段及adopted/content_sha256，local保kind后走本地分支。输出仅入reports；不用fixture根新造schema，不增$defs/独立类型层/文件/registry，不做hash。该schema由真实checker消费，字段位存在仍不等于机器指纹已生效。

safe-write 现 API 仅 `(root, relPath, bytes)`，底层路径/符号链接/原子文件身份保护不能独自证明允许清单或属主授权。三条件由真实调用方/维护者在操作前联验；合法对照实际调用既有入口，不匹配候选在调用前拒绝且目标零写入，独立读者依据操作前证据核判。规则增加不扩调用方授权或公共参数流程，不宣称底层已强制属主授权。重复同内容与半途失败由既有写入口语义承接，不引新恢复状态。

### 全局文件边界与依赖

全局方案按 P1—P12 串行交付：目录基础 → 索引 → 来源 → 依赖/引用 → 搬运 → 手动上游 → 安全边界 → 报告规则 → 方法/接口职责 → 字节减法 → 成本 → 已有结果复核。包⑦只剩独立行为才拆后续 Phase；P3 schema、P2 人读采用等首次 consumer 已在前包落地，不拖终末迁移。

每 Phase 一位实施 owner，另有独立测试/审查上下文；实现 frontier 因既定顺序为单 Phase，2—4 并发用于独立准备、测试、审查，不并写共享文件。原 owner 修复失败分支，回滚局部 hunk 保先写方行为；不整份 checkout、不改旧报告。build-plan 实际写入包括冻结 oracle 与其 move-map entry，不能称全是规划文档；正式计划确认前不做N2业务实现；本轮额外四个共享文件补修按下文003授权单独说明，不据此扩后续N2 Phase写集。

**NEW**：`tests/n2-skill-catalog-portability.test.mjs`；消费方为 P1/P3/P4/P5/P8 的目标行为验证，owner 为独立测试作者，补齐本卡缺失 oracle、无生产替代；删除条件为经独立审查的等强度替代已迁移其消费者。`docs/architecture/move-map.json` 同步单 entry；先写测试后登记的顺序偏差由主会话如实记录，当前补登记已完成，不属生产实现；P1只读核对现有entry，不再次登记，也不修改move-map。

**MODIFY：共享文件**（唯一当次 writer 按 Phase 顺序）：

| 文件 | 精确字段/符号 | 写入 Phase | 真实消费者 |
| --- | --- | --- | --- |
| `skills/catalog.yaml` | `skills`、`capability_decisions`、`projects`及抬头来源说明 | P1→P3→P4→P6 | 现阶段调用者/维护者/checker |
| `skills/reuse-registry.md` | 抬头、场景入口/正文指针、旧hash | P2 | 人读选择者 |
| `docs/reuse-registry.md` | 重复正文退单行指针；不删整文件 | P2 | 旧入口读者 |
| `THIRD_PARTY_NOTICES.md` | 许可来源表及采用出处 | P3 | 对外许可读者 |
| `runtime/schemas/skill-bundle.schema.json` | `properties.sources.items.oneOf` | P3 | bundle校验及P8来源内容检查 |
| `tests/host-independence.test.mjs` | `workflowStages`、`skillClosureSurfaceFiles` | P1 | 技能闭包守卫 |
| `tests/contract/ui-skill-contract.test.mjs` | P1 assertFrontmatter版本归catalog；P3 upstream八字段deepEqual扩精确adopted | P1→P3（上述两TCR） | 既有精确契约 |
| `tests/contract/stage-closeout-skill.test.mjs` | graph dependency集合去自引、保真实他技能及逐bundle强断言 | P4（上述TCR） | 现有独立closeout消费者 |
| `runtime/interface/safe-write.mjs` | `destination`/`publish`/`writeFileAtomic`/`createFileOnce`邻接内容规则 | P7 | 写入口维护者/调用者 |
| `tools/cli/task-bootstrap.mjs` | `bootstrapTask`与`createFileOnce`调用邻接规范 | P7 | CLI维护者 |
| `tools/cli/check-skill-consistency.mjs` | `checkSkillConsistency(root)`的`reports`来源分支 | P8 | 现报告读者 |
| `runtime/interface/runtime-facade.mjs` | `createRuntimeFacade`、`invokeRuntimeCommand`职责 | P9 | 公共调用者/维护者 |
| `docs/quality/test-asset-registry.json` | 既有`retirement_policy`字符串；不加字段 | P9 | 质量登记维护者 |
| `AGENTS.md`、`CLAUDE.md` | 登记义务/真实consumer、薄核心/窄契约邻接 | P9 | 实际维护者/调用者 |
| `docs/architecture/move-map.json` | 已完成新test单entry；后续只维护既有owner最小职责 | build-plan已写→P3→P7→P8→P9；P1只读核entry | 现职责读者 |

下列每组只授权指定文件与节，是 exact 写集；没有列入的技能不写。

- **P1文件头**：`skills/<name>/SKILL.md` 的重复version：anysearch、backend-testing、deep-research、design-source-readiness、frontend-component-quality、frontend-prototype-render、frontend-testing、fullstack-slice-testing、knowledge-graph、resolving-merge-conflicts、spec-prd、stage-closeout、stage-handoff、stage-reflection、testing-system-blueprint、ui-project-init、wh-review；另third-review仅纠正头部name。不改description调用策略。
- **P3来源段**：`skills/<name>/SKILL.md` 的来源段/来源指针：anysearch、architect-code-review、backend-testing、diagnosing-bugs、frontend-component-quality、frontend-testing、fullstack-slice-testing、grill-with-docs、isolated-browser-qa、plan-ceo-review、plan-design-review、plan-eng-review、review、spec-clarify、spec-plan、spec-specify、test-routing-advisor、testing-system-blueprint、deep-research、spec-prd、stage-reflection、talk-with-zhipeng、decision-log、simplicity-guard、knowledge-graph、stage-closeout、wh-review、ui-project-init。前十八个技能同Phase修改`skills/<name>/skill-bundle.json`的非空sources为最小指针；五个原空sources bundle维持不写。
- **P4引用/依赖段**：`skills/<name>/SKILL.md` 的真实依赖声明、本仓相对路径与外部引用：anysearch、architect-code-review、backend-testing、decision-log、deep-research、design-source-readiness、diagnosing-bugs、frontend-component-quality、frontend-prototype-render、frontend-testing、fullstack-slice-testing、grill-with-docs、intake-decision-review、isolated-browser-qa、knowledge-graph、plan-ceo-review、plan-design-review、plan-eng-review、review、simplicity-guard、spec-analyze、spec-clarify、spec-plan、spec-prd、spec-specify、stage-closeout、stage-handoff、stage-reflection、talk-with-zhipeng、test-routing-advisor、testing-system-blueprint、third-review、ui-project-init、wh-review、workflowhub-multica-sync。八处已识别裸外部引用落ui-project-init/stage-reflection；其余逐条对账，WR001规范正文不重写。

P1→P3→P4对重叠正文严格串行，只写对应节；ui-skill-contract.test.mjs由P1版本TCR后P3来源TCR串行持笔，P4 closeout测试按已送审TCR保持原保护修改；逐TCR coverage未证，不改写成批准。bundle保其payload与非来源契约字段。P5/P10/P11/P12仓库写集none，P6仅catalog说明；命令/外置事实沿现producer，不是新增材料写集。

**DO NOT TOUCH**：五份workflow `skill-deps.yaml`、宿主全局目录、其它任务/归档材料、旧reports/snapshots、已知红断言、无关thin-core/acceptance清单。GLOSSARY与ADR0045/0046已由make-decision写好，当前计划只读；当前材料的范围修订仍归材料owner。

### 采用到首次消费者

条件与正反强度只在AC-N2-008；本表定位首writer与实际消费，末包不作首次迁移。

| 来源键 | 首writer | 精确落点 | oracle / 消费 |
| --- | --- | --- | --- |
| addyosmani::security-and-hardening | P7/T007 | safe-write四符号、task-bootstrap.bootstrapTask邻接规则 | ORACLE-N2-SAFETY；受控候选判定与底层合法对照 |
| addyosmani::using-agent-skills | P2/T002；P8保报告 | reuse-registry场景入口；checker.reports | ORACLE-N2-HUMAN/ORACLE-N2-REPORTONLY；三测试技能prompt |
| pstack::setup-pstack | P1/T001、P3/T003；P9登记政策 | catalog路径/consumer/used_by_stages；test-asset-registry.retirement_policy | ORACLE-N2-CATALOG/ORACLE-N2-BOUNDARY；写前真读 |
| pstack::poteto-help | P2/T002 | reuse-registry抬头、旧docs指针 | ORACLE-N2-HUMAN；按入口读目标 |
| pstack::principle-make-operations-idempotent | P7/T007 | task-bootstrap.bootstrapTask/createFileOnce、safe-write.publish | ORACLE-N2-SAFETY/ORACLE-N2-BOUNDARY；重复/半失败调用 |
| pstack::principle-type-system-discipline | P3/T003；P8保全 | skill-bundle.schema.sources.oneOf；checker来源内容 | ORACLE-N2-SOURCES/ORACLE-N2-REPORTONLY；真实schema/函数 |
| pstack::principle-boundary-discipline | P9/T009 | runtime-facade两符号、AGENTS登记义务、CLAUDE薄核心窄契约 | ORACLE-N2-BOUNDARY；真实调用/维护动作 |
| pstack::principle-experience-first | P9/T009 | AGENTS真实consumer邻接 | ORACLE-N2-BOUNDARY；具名使用动作 |
| pstack::correct | P3/T003 | catalog/notice/stage-reflection来源段 | ORACLE-N2-SOURCES；目录本职，不认领N7内容 |
| pstack::redesign-from-first-principles | P3/T003、P4/T004 | catalog/dependency_closure/十八bundle | ORACLE-N2-SOURCES/ORACLE-N2-DEPENDENCIES；同项同步 |
| pstack::fix-root-causes | P1/T001、P4/T004 | catalog坏路径/依赖及正文引用 | ORACLE-N2-CATALOG/ORACLE-N2-DEPENDENCIES；同类具名修复 |
| pstack::poteto-mode | P2/T002 | 唯一索引、旧docs指针 | ORACLE-N2-HUMAN；族与叶子入口 |
| E-2来源三层 | P2/T002、P3/T003 | catalog/notice/来源正文 | ORACLE-N2-HUMAN/ORACLE-N2-SOURCES；权威分工 |
| E-10过期投影 | P2/T002 | reuse-registry过期条目 | ORACLE-N2-HUMAN；对照catalog与目标 |

每条具名反例、实际输入与独立读者回传由首Task定义。规则字面、关键词测试或健康采样不能替代实际消费；无真实消费原件则对应采用未完成。

### 需求到任务追踪

本表逐Task写完整canonical FR/AC，供现有reader与人读同用；原始条件只在Appendix A，精确命令只在对应Phase。AC-N2-008的唯一首次owner集合为P1/T001、P2/T002、P3/T003、P4/T004、P7/T007、P8/T008、P9/T009；P6无该首次职责，P12只回读该集合。

| 来源 | 原义/本Task职责 | FR / AC | Phase / Task | oracle / 状态 |
| --- | --- | --- | --- | --- |
| R-003、R-009、R-010、U-008 | 清单/身份与宿主基础；含采用首验 | FR-N2-001、FR-N2-008、FR-N2-010、FR-N2-012 / AC-N2-001、AC-N2-008、AC-N2-010、AC-N2-012 | P1/T001 | ORACLE-N2-CATALOG；planned |
| R-003、R-009、R-010、U-008 | 唯一索引/路由与旧投影 | FR-N2-002、FR-N2-008、FR-N2-010 / AC-N2-002、AC-N2-008、AC-N2-010 | P2/T002 | ORACLE-N2-HUMAN；planned |
| R-001、R-002、R-005、R-007、R-008、R-009、U-008 | 来源两型/单权威/具名无源矛盾 | FR-N2-003、FR-N2-008、FR-N2-010 / AC-N2-003、AC-N2-008、AC-N2-010 | P3/T003 | ORACLE-N2-SOURCES；planned |
| R-004、R-008、R-010、R-012、U-008 | 全部引用/依赖真实，非样本代整体 | FR-N2-004、FR-N2-005、FR-N2-008、FR-N2-010 / AC-N2-004、AC-N2-005、AC-N2-008、AC-N2-010 | P4/T004 | ORACLE-N2-DEPENDENCIES；planned |
| R-004、R-008、R-012、U-008 | 单技能实搬与宿主双动作 | FR-N2-006、FR-N2-010、FR-N2-012 / AC-N2-006、AC-N2-010、AC-N2-012 | P5/T005 | ORACLE-N2-PORTABILITY；planned |
| R-001、R-006、R-008、R-012 | 只读上游，真实基线/断网 | FR-N2-007、FR-N2-010 / AC-N2-007、AC-N2-010 | P6/T006 | ORACLE-N2-UPSTREAM；planned |
| R-009、R-012、U-008 | 调用方安全候选与幂等 | FR-N2-008、FR-N2-010 / AC-N2-008、AC-N2-010 | P7/T007 | ORACLE-N2-SAFETY；planned |
| R-007、R-009、R-012、U-008 | 只报告来源内容，保退出语义 | FR-N2-008、FR-N2-010 / AC-N2-008、AC-N2-010 | P8/T008 | ORACLE-N2-REPORTONLY；planned |
| R-009、R-010、R-012、U-008 | 维护者/接口/登记边界 | FR-N2-008、FR-N2-010 / AC-N2-008、AC-N2-010 | P9/T009 | ORACLE-N2-BOUNDARY；planned |
| R-011、R-012、U-009 | 双口径真实字节与风险 | FR-N2-009、FR-N2-010 / AC-N2-009、AC-N2-010 | P10/T010 | ORACLE-N2-BYTES；planned |
| R-008、R-011、R-012 | 完整N1输入的成本结论 | FR-N2-011、FR-N2-010 / AC-N2-011、AC-N2-010 | P11/T011 | ORACLE-N2-COST；planned |
| R-012、U-003、U-005 | 只消费各段首次原件，不首次补效果 | FR-N2-001、FR-N2-002、FR-N2-003、FR-N2-004、FR-N2-005、FR-N2-006、FR-N2-007、FR-N2-008、FR-N2-009、FR-N2-010、FR-N2-011、FR-N2-012 / AC-N2-001、AC-N2-002、AC-N2-003、AC-N2-004、AC-N2-005、AC-N2-006、AC-N2-007、AC-N2-008、AC-N2-009、AC-N2-010、AC-N2-011、AC-N2-012 | P12/T012 | ORACLE-N2-ACCEPTANCE；planned |

P12/T012只消费上述首次原件，逐AC报告完成、缺失、失败与限制；没有新能力或首次通过判定。表中P12绑定所有AC用于最终回读，不使其成为各采用的首次owner。

### 全局验证策略

全局材料结构检查复用现有 `phaseFilesFromIndex` 与 `validatePostPhaseContract`，从索引读取实际Phase map；输入为当前spec/index/Phase原文，只输出真实结果，ok=false时exit1。它消费全局材料/trace，不是任何Phase业务gate，不复制Phase测试命令，不新增脚本或validator，也不证明业务、环境或独立读回已通过。在认证worktree执行唯一命令：

`node --input-type=module -e "import fs from 'node:fs';import {phaseFilesFromIndex} from './runtime/task/material-workspace.mjs';import {validatePostPhaseContract} from './runtime/stage/stage-content-contracts.mjs';const root='specs/n2-skill-catalog-portability-20261016';const index=fs.readFileSync(root+'/phases/index.md','utf8');const phases=Object.fromEntries(phaseFilesFromIndex(index).map(ref=>[ref,fs.readFileSync(root+'/'+ref,'utf8')]));const result=validatePostPhaseContract({spec:fs.readFileSync(root+'/spec.md','utf8'),index,phases});console.log(JSON.stringify(result));process.exitCode=result.ok?0:1;"`

先记录针对性基线，区分预期断言 RED 与环境/工具崩溃；当前 host baseline 是崩溃而非有效业务 RED。按行为段使用同命令正负 oracle，不改断言换绿，合法控制样本保持。每段保原始输出、正式独立 review 或 unavailable 与提交事实；字节相同复用原件，不镜像 evidence。

静态/fixture 只能证明声明与函数行为，真实复制证明样本搬运，真实上游核对证明当时网络读数。技术 AC 可先完成各自判定；成本、许可或 N10 接线未知不能伪装整卡通过，也不阻止独立安全修复。verify-code 再独立逐 AC 复跑；OCR 缺失按既有路线 unavailable，不换执行者，同源补充不是异源裁决。

#### 索引验收输入

本节是P2/T002与AC-N2-002共同消费的固定输入；Phase引用fixture ID、实际复放动作与结果，不复制本节数据或AC判据。索引作者提供P2完整成稿、当前catalog及backend-testing/frontend-testing/fullstack-slice-testing真实正文；未参与P2撰写的本任务verify-code/审查读者在P2成稿后、P2收口前独立实读并逐案选路、记理由与拒绝的错误路线。输入、owner与时点相同，不能只dump文件成功即GREEN。

| fixture ID | 原样输入 | 供六用例复用的路由 |
| --- | --- | --- |
| N2-INDEX-B | 只改Node REST /items参数校验、仅后端代码，无UI/协议/DB变化 | backend-testing |
| N2-INDEX-F | 只改React按钮loading/error/keyboard、API不变 | frontend-testing |
| N2-INDEX-X | 按钮提交→POST→worker写DB→UI读回 | fullstack-slice-testing |

六个正负用例绑定：B+用B，B−用F且拒backend；F+用F，F−用B且拒frontend；X+用X，X−用B且拒fullstack。每案实际选择仍由独立读者按完整索引与技能正文作出，不把预期表当实际执行。

相似模板对照N2-INDEX-TEMPLATE将同一前缀“已完成build-code改动，请按真实changed files验证：”分别接B/F/X三条原样输入，实际预期仍依次backend-testing/frontend-testing/fullstack-slice-testing；只有尾部真实写集不同，不能因模板相似诊断语义冲突或套阈值。另复放旧spec-tasks误路由反例。全部结果与错路由处置、独立读者来源留P2唯一读回；当前均为计划输入，没有补造执行。

#### 当前材料reader失败的逐项处置

正式审查原件`task:quality/reviews/2026-10-16-019-build-plan-document.json`中的F3/F6报告旧preflight false。旧输出与失败原件保留，以下逐错解释，不把reader布尔值当质量结论。N2材料修补与下文已单独获授权的共享template/runtime补修分别报告。

| 旧错误族 | 根因分类 | 当前材料处置 | owner / 影响 |
| --- | --- | --- | --- |
| unknown AC-N2-* / accepted AC为空 | 作者声明形状缺口；并非域ID不支持 | 现AC regex支持DOMAIN；每AC唯一正文内加纯ID机器定位行，判据仍只一份 | spec作者；使现consumer可发现十二原AC |
| trace missing FR/AC/Task或oracle不匹配 | 作者简写不被consumer读取 | 本节上方按每Task写全canonical FR/AC/Phase/Task/oracle，不复制判据/命令 | spec作者；恢复逐Task机器追踪 |
| P1/T001 dependency literal | Phase字段真实格式缺口 | 原Phase作者将唯一字段改none，解释留Inputs | Phase作者；修当前可读值，不改依赖设计 |
| P2 G-2 objective alternative / expected_exit | Phase替代动作与退出表达缺口 | P2引用上述固定输入，由具名独立读者逐案判定；dump成功只说明读取，不能代效果通过 | Phase作者；替代未实跑仍未完成 |
| Global Verification Strategy requires a concrete command | 作者误把全局材料检查与Phase业务gate视为同一判定对象 | 本节新增现有两函数的一次性只读全局结构调用；业务命令仍由Phase独占，不复制或造空命令 | 当前spec作者补真实consumer调用；结果仍按实际返回，不以结构检查代业务/质量 |
| `phases/P6-手动上游核对.md T006 G-2 missing concrete documentation-only owned write set` | 历史方法总则与模板纯.md窄合同不一致；当时runtime按模板实现，不是单独实现bug | 原false保留；本轮额外授权已使模板/reader支持严格逐路径YAML注释方法声明，细则只读现模板；P10本次范围补齐前的025观察为ok=true/errors[]；本版最终复验尚待 | 既有模板/reader owner；不据共享测试绿冒P6合同已验，不构成整个任务拒绝 |
| `phases/P6-手动上游核对.md T006 expected_exit must distinguish RED target failure from GREEN 0` | 历史同一窄合同未接纳YAML注释方法后的退出要求 | 原消息保留；git正常/断网结果仍是环境观察，不是方法目标RED；P10本次范围补齐前的025结构观察已无该消息，成稿独立消费仍不预填GREEN | P6方法owner保真实失败边界；不塞非零/0绕过分支，不把旧false当当前终态 |

owner来源为`docs/architecture/move-map.json`当前实读登记：`runtime/stage/stage-content-contracts.mjs`的owner原文是“B4/P5 / MT-1-063”，职责原文是“现行合同面（本文件，拆分后保留 post phase/decision/交互 IO 合同文本）”；`skills/spec-plan/SKILL.md`的owner原文是“B3/P4 / MT-3-041”，职责原文是“宿主读、spec/phases 作者”。这两项是既有登记，不推定为当前父任务某卡（当前父卡未定位，unknown）。本次以现有两函数完成全局材料检查的真实调用，与`skills/spec-specify/SKILL.md`“Phase files own exact gate commands and local STOP”/单权威第5条保留的Phase业务gate职责不同；不扩本卡生产写集，不新建兼容reader或许可门。

P6这两条消息的历史观察原件为`task:quality/tests/2026-10-16-010-build-plan-final-material-preflight.json`；额外修复前只读复核亦返回相同两条、`ok=false`，该旧事实保留。原`skills/spec-plan/SKILL.md`的Test design and quality总则允许纯文档/纯方法的具名G-2替代，而当时phase-template的G-2示例与stage-content-contracts reader均只接受owned全.md；因此原问题是共享合同范围不匹配，不是reader单独误判。当前模板和reader已按下述独立授权补修，模板成为严格逐路径YAML注释方法声明的唯一规范来源，本规格不复写详细语法或把旧限制当现状。实际生产消费者`tools/cli/stage-runtime.mjs`的`captureScopedReviewSource`与`phaseReviewSourceProjection`仍读取`facts.phase_rows`和当前Phase写集，并只拒绝各自具名不安全/缺失写集；它们没有将所有`parsed.ok=false`一概升级为全局拒绝。当前P6已由原作者同步Files/Inputs，P10本次范围补齐前的结构复验已由025原件报告ok=true/errors[]，最终材料复验尚待；方法独立消费尚待，不能由共享测试绿或材料结构绿推出业务通过。P6的pin、上游观测基线及无基线反例仍只归P6原文，本规格不复制命令或判据。

**额外授权补修（仅四个共享文件，不是N2计划批准）**：用户已在`task:quality/evidence/human-confirmations/2026-10-16-003-build-plan-scope-approved.json`明确回复“允许额外修复这4个共享文件（推荐）”，decision为`scope-approved`。授权只覆盖原候选中的四个既有共享文件：`skills/spec-plan/templates/phase-template.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/post-build-plan-missing-index.test.mjs`、`tests/contract/card05-author-material-consumer.test.mjs`。这是本轮build-plan补修的额外生产scope，不是N2实施计划approve，也不改本文件前述后续N2 Phase写集或认领N2业务完成。

原共享补修writer已实施：模板统一严格逐路径YAML注释方法声明，既有runtime G-2消费同一声明并保理由、风险、客观替代、source/oracle、写集及失败披露检查；两个既有测试文件覆盖纯注释合法声明、数据/未分类负例并保混合代码拒绝。细则一处归模板，不增加N2特例、脚本、公共节点或持久对象。当前已读取的四文件SHA256如下，原始字节仍留工作树：

- `skills/spec-plan/templates/phase-template.md`：`dabc53b3973f1a747ee759c5a91943683b17d8c3dae4b059af25a4ee7cda2e12`
- `runtime/stage/stage-content-contracts.mjs`：`99390a14af25f347410ed22ed5c595642e16c96d851720dcb99c56979be86d66`
- `tests/contract/post-build-plan-missing-index.test.mjs`：`6a994357d7229d220a8ac2f5ac3ffb1d81e389eb5adced627d1f8d9b6048818d`
- `tests/contract/card05-author-material-consumer.test.mjs`：`c6533e7182082f8b3fb06bf7ee3b6437a9429c954cdc8545b321b142a10bf299`

共享补修的历史首次GREEN为112/112、exit0，原件`task:quality/tests/2026-10-16-021-g2-final-green.txt`及`2026-10-16-022-g2-final-green-execution.json`保留。随后独立同源Standards/Spec双轴各发现一条major，归同一跨字段范围矛盾；原writer已补Action/Outputs的数据字段矛盾保护，先真实RED（2失败/113通过、exit1，`task:quality/tests/2026-10-16-026-g2-cross-field-red.txt`与`2026-10-16-027-g2-cross-field-red-execution.json`），再最终GREEN（115/115、exit0，`task:quality/tests/2026-10-16-028-g2-cross-field-green.txt`与`2026-10-16-029-g2-cross-field-green-execution.json`）。两批全文件检查实际argv均为`/usr/local/bin/node node_modules/vitest/vitest.mjs run tests/contract/post-build-plan-missing-index.test.mjs tests/contract/card05-author-material-consumer.test.mjs`，本规格作者只读既有原件，没有重跑。

独立审查者已实际读回修复落点，并做针对性finding check：7通过/108跳过、exit0，原件为`task:quality/tests/2026-10-16-030-shared-g2-finding-check.output`与同名`.json`。该读回覆盖两调用缝、否定/.md/普通行为及混合代码保护；原发现与原始输出保留在task facts所引唯一原件。正式OCR的`task:quality/reviews/2026-10-16-020-build-code-phase.json`仍为未派provider的unavailable，没有更换executor，不能称异源代码审查通过。测试、同源审查/修复读回与正式OCR分别报告，质量完整事实以task facts原件为准；共享测试绿不证明P6方法已被独立消费，也不证明N2业务或整卡验收通过。

P10原作者已将本轮额外四文件纳入原“所有受影响方法”核算：template/runtime两个方法文件净额计selected，两个测试文件支持增量另报、不抵扣selected，不新增预算豁免。计量命令与逐路径范围只归`phases/P10-字节减法核算.md`（本次读回SHA256 `e1cb4a4ae4967feb03e421605f87978a8467c2f01ff214a4503bc5beb0d99a74`），本规格不重复命令，Appendix A原判据保持。P10范围补齐不等于最终字节验收已执行。
P10本次范围补齐前的reader观察原件为`task:quality/tests/2026-10-16-025-build-plan-repaired-material-preflight.json`：真实activation_cohort=post、caller=null，phase_contract为ok=true/errors[]、12Phase/12Task；这是当时结构观察，不是本版最终材料复验或全量字节验收，本版最终材料preflight待当前spec冻结后由主会话执行。024原件是调用方漏传post参数的调用错误，原样保留，不作材料缺陷。以上历史处分不改写旧010失败。结构修复不证明方法已真实消费；原N2文档正式审查不重跑，新增共享scope的同源审查/修复读回及OCR unavailable已分别如实记录。四TCR专项coverage仍undetermined。

## Appendix A — 验收判据（唯一权威）

以下每条均 `status: planned`，不是执行事实。每条继承同序原 AC；来源/FR/PFACT/场景见上文对应记录，下面保完整可判条件。证据只声明类型，实际唯一原件由执行者按现有 task producer 发布。

### AC-N2-001：机器清单与技能身份可读

- [ ] **AC-N2-001**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-001、R-003、U-008；FR-N2-001；SCN-001；oracle ORACLE-N2-CATALOG、HOST-INDEPENDENCE；P1/T001。

验证：逐条实读活动路径、退役目录、历史能力取舍及项目登记；修前修后各读一次；读取技能文件头与 catalog 对照，运行修复后的宿主闭包读取。
通过：坏路径、死路径与不存在技能记录逐项修正；活动路径可达，退役条目去失效路径但保名称、理由、来源，漏登补齐；两块无程序消费者登记保留且不新增消费者。catalog 为名字/版本唯一权威，文件头保可读标识、去重复 version，并修正名字不符。
失败：任一活动路径仍不存在、历史理由被删、退役记录被整条删、漏项未补、预填缺陷数冒实读；头部仍冲突或去掉可读名字；测试仍以 undefined 崩溃而报告通过。
证据：具名修前/修后路径与字段读回、目标测试原始输出；旧 baseline 原件引用。

### AC-N2-002：唯一人读索引仍可作入口

- [ ] **AC-N2-002**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-002、R-003、R-009/010；FR-N2-002；SCN-002；oracle ORACLE-N2-HUMAN；P2/T002。

验证：从索引按任务定位技能并读目标正文；逐条比 catalog，核旧 docs 副本；三类测试技能各用正负 prompt，保模板相似的对照案例。
通过：索引只讲技能、适用场景、正文入口，不再抄状态/版本/来源；实测十三处冲突逐条消除（唯一数量出处为 decision-log D-021）；docs 旧副本退为指针；冲突说明明确登记信 catalog、语义信目标、谁改哪处。三类测试技能任务边界能区分，模板相似不冒语义冲突，不硬套英文阈值。
失败：仍抄机器事实、任一冲突残留、指针到不了正文、出现第二人读权威；用相似度阈值直接作中文失败门；无真实prompt读回。
证据：索引入口/冲突逐条读回、prompt与路由结果、旧指针反例与处置原件。

### AC-N2-003：来源事实单权威且证明边界真实

- [ ] **AC-N2-003**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-003、R-001/002/005/007/008、U-008；FR-N2-003；SCN-003；oracle ORACLE-N2-SOURCES；P3/T003。

验证：逐采用项定位来源与采用内容；合并前逐字段比 catalog upstream/bundle sources；通过真实 schema consumer 验合法与非法组合；核 notice、LICENSE、vendored 对象与可复算事实。
通过：常规外部来源能定位“来源仓＋相对路径＋稳定章节＋采用简述＋许可＋取回坐标”，无稳定章节才补行段；本地来源保授权依据与取回事实，缺项各有 owner/下一步。完整登记仅在 catalog，bundle 退最小便携小卡且人读流程标非权威。两个无源adapted项按实现设计中的原始登记证据修为native并由独立者回读，不通过测试豁免绕过；adopted/content_sha256 字段首次建立；仅实际 vendored 对象另留一次性可复算事实，权威字段本卡为 null；默认机器复算与真实回填归 N10，如实标未生效；不可复算旧 hash 删除或升级可复算对象。核不到许可/commit按具体缺口保留，补登 notice 以实际读许可为前置。
失败：只给 hash 不说明采用内容，手填指纹，普加改造项 hash，把未接线写已生效；便携卡继续完整双写或自称权威；本地来源被强套 Git 形状/假 pin；许可未知写已核、登记覆盖不全写许可冲突；非法组合被真实 consumer 接受。
证据：逐项定位和合并差异读回、schema合法/非法测试输出、真实LICENSE/取回事实、vendored复算原件及N10依赖说明。

### AC-N2-004：内外引用写法一致

- [ ] **AC-N2-004**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-004、R-004/008；FR-N2-004；SCN-004；oracle ORACLE-N2-DEPENDENCIES；P4/T004。

验证：逐条改正基线识别的八处坏引用后复读同段；确认来源仓与真实目标。
通过：八处按真实来源改正；本仓技能写仓内相对路径，外部源写来源仓＋技能名，规则在既有文档内可发现；来源不明保缺口。
失败：仍以裸技能名冒充本仓路径、明显不存在目标、规则只存在提交说明，或给来源不明项猜仓名。
证据：具名八处修前/修后文本读回与引用规则定位。

### AC-N2-005：全部依赖记录是真话

- [ ] **AC-N2-005**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-005、R-004/010、U-006/008；FR-N2-005；SCN-004；oracle ORACLE-N2-DEPENDENCIES；P4/T004。

验证：逐条阅读全部技能正文的同仓跨技能引用，与现有 dependency_closure 的目录路径数组对账；记录候选提取与人工确认的区别。
通过：全部记录与真实依赖一致，只列其他技能；自引用不写、空依赖留空；有一次完整真实对账读回，常驻机器检查交 N10。
失败：系统性低报/高报、仍自引用、以正则输出直接生成结论、无真实对账；新增依赖形状/常驻门。
证据：每技能引用与依赖字段的单份对账原件、声明与正文对应位置。

### AC-N2-006：三个具名技能单目录搬运

- [ ] **AC-N2-006**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-006、R-004/008；FR-N2-006；SCN-005；oracle ORACLE-N2-PORTABILITY；P5/T005。

验证：把 ui-project-init、stage-reflection、spec-specify 各自复制到自己的空目录，逐正文引用读回；至少一个样本含附加资源目录。
通过：外部引用写“来源仓＋技能名”；同仓引用在副本可解析，或正文具名声明依赖且与 catalog 一致；明显不存在文件如实报告为失败。全程不改宿主全局目录，原目录保留，不复制索引权威；披露样本区分度与范围。
失败：未声明断链、明显不存在文件、正文声明与登记不符；用整闭包复制顶替单技能判据，覆盖宿主目录、造空目录、样本通过冒充分证明全部技能搬运。
证据：三样本各自临时目录身份、逐引用结果、附加资源读回、清理事实；仓内原目录不作证据快照。

### AC-N2-007：手动上游核对可复跑且未知不冒无变化

- [ ] **AC-N2-007**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-007、R-001/006/008；FR-N2-007；SCN-006；oracle ORACLE-N2-UPSTREAM；P6/T006。

验证：在 catalog 来源使用说明按登记坐标真实只读核对一次，并执行一次断网条件；首次留真实上游坐标基线；无历史包按真实归档指纹/取回坐标处理。
通过：方法可照做、默认不跑、只报告不自动改；有基线才能比较变化。真实不可取回记 unavailable/原因，无版本历史、不适用、未知与未变化分别呈现，结果仅证明当时读到的状态。
失败：只有登记没有核对方法、没有基线称未变化、断网称没变化、把未知/不适用写未变化、自动更新或默认接线。
证据：使用说明定位、真实联网核对与断网原始输出、首次上游基线或 unavailable 原因。

### AC-N2-008：采用在真实消费处生效并可证伪

- [ ] **AC-N2-008**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-008、R-009/010、U-008；FR-N2-008；SCN-001…007；oracle ORACLE-N2-SAFETY/ORACLE-N2-REPORTONLY/ORACLE-N2-BOUNDARY与各内容oracle；首次owner见实现设计。

验证：逐条核本卡八项采用及六项补充目录职责，按首次消费者运行具名正例与真能失败反例。以具体文件/符号定位，不以目录/通配符当已生效。
通过：security-and-hardening在既有破坏操作边界由调用方/维护者联验允许根、至少下一层、操作前属主；以真实受控候选和操作前证据交独立读者判定，合法对照实际执行现入口，不匹配候选在调用前拒绝且目标零写入，形状检查不冒授权、底层API不冒强制属主授权；using-agent-skills在索引任务语义路由与三测试技能正负prompt生效，相似度只诊断；setup-pstack在catalog/docs质量登记写前真实探测，缺失停止当次写入并报告，重复整覆写内容幂等；poteto-help引用先读目标、登记/语义各信原owner、旧指针显露；make-operations-idempotent在受影响既有写入口验证重复/半途失败/内容一致、不重复事实；type-system-discipline在真实schema/检查consumer拒非法组合并保合法组合，不造无消费者层；boundary-discipline在AGENTS/CLAUDE/interface全部落点有边界/纯函数判据且公共面不泄内部表示；experience-first在真实consumer登记点名维护者/调用者的实际动作、无consumer不实施。correct目录读回、redesign的catalog/deps/bundle同步、fix-root-causes同类登记修复、poteto-mode索引/指针、E-2三层、E-10过期投影分别在已有内容包完成，并与各内容oracle对应。新checker内容仅进reports，保原failures、退出码与不新增拦门；不等N10代本卡首次验。
失败：只登记标题、缺可运行反例、负例恒真、落点仍为目录/通配符就称生效、任一声明consumer只落一半；改报告/退出语义、新拦门、新工具/类型层/宿主安装流程；把目录本职夸成全部54项内容已生效。
证据：每采用来源→具体文件/符号→首次Task→具名正负例→原始输出的读回；后继N10保全依赖说明。

### AC-N2-009：双口径字节事实与减法对象可核

- [ ] **AC-N2-009**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-009、R-011、U-009；FR-N2-009；SCN-007；oracle ORACLE-N2-BYTES；P10/T010。

验证：按同一开工基线现场复算两口径净额；逐项列具名删除/合并对象及保全位置。唯一基线原件 task:quality/evidence/2026-10-16-005-g1-baseline.txt，decision-log AC-009补更正值。
通过：选定口径含每卡必读方法、模板、技能正文与清单类常驻内容且字节不增；实际方法/内容规则按承载文件现场净额计入，不因.mjs或.json后缀归为supporting。明确计入runtime/interface/safe-write.mjs、tools/cli/check-skill-consistency.mjs、tools/cli/task-bootstrap.mjs、runtime/schemas/skill-bundle.schema.json、runtime/interface/runtime-facade.mjs，以及docs/quality/test-asset-registry.json的文件净额。排除项仅术语表新增与两份新ADR。全口径把二者加回，两个数字均现场核算；全口径上升如实报上升额。测试与move-map辅助文件逐路径另报净额，不抵扣selected、不作为第三验收口径，也不能借辅助分类移走实际方法规则或新增例外。基线技能正文305,088 B、catalog85,143 B、技能索引23,956 B、notice4,367 B；GLOSSARY开工20,627 B、make-decision写后22,548 B，差额1,921 B；两份新ADR8,511 B；docs重复人读副本及所有本次受影响方法/模板按原件与现场清单计入。删除/合并对象明确为旧人读副本正文、bundle sources重复、死记录多余路径、不可复算hash/抄录状态、正文重复转述与自引用等实际发生项。保D-032与OI-013 accepted_risk；若父规则owner/后续复核不接受选定口径，按全口径判定。
失败：隐去任一增长、只报一口径、只有一数字现场核算、扩大排除到方法/模板/正文/清单、把承载规则的代码/JSON转supporting逃避统计、丢约束或搬未统计文件凑数、未列对象称已删除；将口径风险改写成已满足G1。
证据：原基线引用、改后路径+hash与字节聚合的现场原件、双净额、具名删除/合并与原义保全读回；不保存目录快照。确认接口未含材料hash/字节的既有证明限制保留为undetermined，owner为原接口产出方，不新增绑定机制。

### AC-N2-010：各行为段真实验证与交付

- [ ] **AC-N2-010**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-010、R-012、U-001/003/005；FR-N2-010；SCN-007；oracle ORACLE-N2-ACCEPTANCE；各Phase。

验证：逐Phase读取针对性检查、独立审查、修复与提交事实，区分原有红和本卡引入问题；终末逐项读原件。
通过：每段独立形成当段技术结果、针对性测试与正式独立审查或真实unavailable记录，并按授权提交；可修发现回原实施会话修复。已知红/历史原件不动，末段只复核不首次造结论。无provider结果如实unknown/unavailable/incomplete，不替换执行者或假绿。
失败：跳验证/审查、把问题攒终末、用自审代独立、改弱旧红、无原件称绿、把样本或登记当完成。
证据：每段唯一原始测试输出、正式review原件/失败、发现处置与commit引用。make-decision历史审查只作来源，不替代当前实施审查。

### AC-N2-011：整体成本按完整N1输入判断

- [ ] **AC-N2-011**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-011、R-008/011；FR-N2-011；SCN-007；oracle ORACLE-N2-COST；P11/T011。

验证：取得N1“主Agent成本观测”整卡完整结果后，核同任务、同命令、同条件、同预算，读取原始样本与全部尝试并报告波动；字段不齐保持缺项。
通过：本卡成本结论实际消费该完整结果，提供可回读同条件对照、次数/波动、全部尝试与限制。沿父PRD G1，主Agent四组指标分别保 `wall_s`、`input/output/cacheRead`、`steps/turns`、`subagent/bash` 调用数；缺字段或解析失败记unavailable，provider未报usage记not_reported，不用provider token/材料字节替代主Agent token。成本收益要求 `cacheRead` 与 `wall_s` 均不劣化，`steps` 或 `cacheRead` 至少一项下降；质量或数据不足不宣称收益。技术结果与整体收益分报，未测保unknown/unavailable而不宣称整卡全验。
失败：未测称全验、以字节/别的数字替代缺字段、只摘N1片段、条件不同仍称收益、隐去失败尝试或波动。
证据：N1完整结果的真实路径/hash、原始样本与本卡同条件对照读回；不可得则具名输入缺口/owner/取得条件，不是通过证据。

### AC-N2-012：宿主独立性有两个真实动作

- [ ] **AC-N2-012**

状态：`planned`；原始编号仅 provenance，不新增验收项。

来源：原 AC-012、R-004、U-008；FR-N2-012；SCN-005；oracle HOST-INDEPENDENCE/ORACLE-N2-PORTABILITY；P1/P5。

验证：独立复跑修好的宿主守卫并读技能闭包扫描结果，再按AC-N2-006真实单目录搬运；两个动作各有读回。
通过：守卫不再崩溃、能真实报告技能面的宿主耦合；搬运按同一三分引用判据执行并披露样本限制。两动作执行结果与覆盖范围分别如实记录。
失败：一句规则声明顶替执行、守卫仍崩却记过、弱化宿主断言、拿样本通过称整体主张已充分证明。
证据：宿主守卫目标命令原始输出与搬运唯一原件引用；共享AC-N2-006同字节证据不再复制。

## 12. 风险、未决与交接

### 风险

- **RISK-001**：全部依赖改真与共享文件冲突；影响FR/AC 001—005、008。触发为机械提取代人工确认或跨卡并写，后果为批量低报/高报及先写行为丢失；P4原owner逐条对账、各Phase锁内重读，相关oracle复验，不能扩大无关清理。
- **RISK-002**：许可/版本/网络不能核；影响PFACT-004、FR/AC003/007。触发为来源不可取回或无历史，后果为无法证明固定版本或许可；P3/P6真实读取与缺口登记，核不到保unavailable，不改成无变化；维护者后续取回关闭。
- **RISK-003**：双口径与G1文义冲突；影响PFACT-006、FR/AC009。D-032/OI-013是既有accepted_risk；P10及verify-code并列真实净额，最终汇报实际影响，若父规则owner不接受则全口径判定；不隐藏或扩例外。
- **RISK-004**：N1技术交付已可读，但完整同条件成本样本及N10接线仍未齐；影响PFACT-003/005、FR/AC003/008/011。字段存在、局部绿不能证明整体收益或N10生效；P11给真实缺项，P12/verify-code保incomplete，不估数。
- **RISK-005**：历史/当前审查混读；影响FR/AC010及全部完成结论。旧方向pair partial、缺reveal与细节材料覆盖undetermined均保来源；build-plan当前审查及各实现段独立产出，不以旧结论顶替。方法不能靠目录/标题静态出现就称已消费。

**知识使用与历史收口的当前来源/风险说明**：本轮用户在`task:quality/evidence/human-confirmations/2026-10-16-004-build-plan-revise.json`选择继续修订当前计划，阶段仍为`unverified`，revise不是approve。本说明只承接已有调研与消费者边界，不新增FR、AC、Phase或生产scope。当前综合原件为`task:quality/evidence/2026-10-16-024-n2-knowledge-closeout-synthesis.md`（SHA256 `66b8fb798e2fe625fb8320872b356d94ae0635a255e919b9d73ad62f13e2bdf4`）；知识使用、接线/归档、原任务验收分别回读其“三份审计原件”所指021/022/023，逐调用与归因回读其“纠正强收益的归因”“两阶段的实得与缺口”内002/010/012/013及原始执行ref，归档回读其“未归档的精确原因与后续”内原scope与cleanup授权/消费ref，不另抄审计或建账本。

知识图谱已接线、能查询；N2 make-decision逐调用原件不足以确认完整方法执行，build-plan有002的query/god/explain原始执行回执与回源。REPORTONLY纠错有明确落点，但D-022边界本就在输入，不能归为图独有发现或省token；012是freeze后补跑，不能倒填开工时已完成。图只导航回源，原graphify集成任务的五阶段实际效果、完整成本、缓存安全重放、5条误边与173条未定仍归原owner，N2不代填完成或收益。

Multica是实际catalog消费者，具体为`skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs`；mainRef读取边界与skills区retired/absorbed选择器风险原调研未具名收口。现有P1/P3由原作者补只读前后集合/真实下游影响核查，分别报告未改变、本次受影响或既有不一致交原owner；两条adapted→native仍属managed集合，不能冒作该风险已解决。此处不授权改同步脚本、外发Multica操作或新增gate，也不把缺线上读数写成已发生误删/漏删。

原graphify任务当时已verify-code、merge、push和物理close，但业务验收仍3项pass、10项incomplete、quality unavailable、stage unverified；这些历史欠账保留，不是功能实现百分比。当时自家specs未归档的直接依据为原执行侧最终scope第19行保留该路径，未证用户逐字批准该例外，不能扩大成人类明确接受或直接断言越权。本轮main维护提交`8accb3b9e2bf2167e9bb73c3d37511e200e7cf67`已将11份材料字节不变归档至`specs/archive/graphify-knowledge-integration-20261015/`、迁接8处活动引用并修正规则；当前N2只消费该main交付，不另行归档旧材料。原历史依据见既有T027调查原件；本轮原graphify归档补件为`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/graphify-knowledge-integration-20261015/quality/evidence/2026-10-16-001-archive-bytes-supplement.md`（主会话读回提供：11/11 Git blob实比、11项hash齐备）。外置facts/review/raw、原验收欠账和provenance保留。图文档路径未更新，不能从材料归档推断知识图谱新鲜或业务验收完成。

### 未决与延期对象

本节不重抄原OI理由，以下继承当前状态、真实consumer、输入与时点。

| OPEN / 上游OI | 状态与影响 | owner / 要取的对象 | 何时 / 关闭条件 |
| --- | --- | --- | --- |
| OPEN-001 / OI-001 | open；旧34/37/74不作当前分母；FR/AC001/008 | build-code；逐项真实路径与同类缺陷集 | P1/P4实读并留前后，不需新用户决定 |
| OPEN-002 / OI-002 | open；许可未全核，PFACT-004、FR/AC003 | 来源维护者；每来源实际LICENSE正文与取回坐标 | P3首次登记前逐源读取；不可得保具体缺口，补notice须真实核许可 |
| OPEN-003 / OI-003 | open；来源包无历史，PFACT-004、FR/AC003/007 | 来源维护者；归档原件指纹、真实取回事实与上游观察坐标 | P3登记/P6首次核对；仅关闭可证部分，不伪造commit等同 |
| OPEN-004 / 成本卡 | 技术交付与整卡结论已可读；PFACT-005、FR/AC011整体效果仍unknown | N1 owner；下方具名验收原件已取得，仍需原始成本样本及同任务/命令/条件/预算、次数/波动和全部尝试 | P11首次成本判定前核样本齐备；缺则unavailable，P12不补假数 |
| OPEN-005 / 验收对象 | unknown；PFACT-007 | build-plan主会话；真实service/route/viewport输入 | 当前合同无此提供；保null和缺项，不造环境；若范围改变交原owner补 |
| OPEN-006 / OI-004/005 | open；本卡只报告无关悬空验收清单/thin-core | 各归属卡owner；归属判断与实际修复 | 本卡保故障ref、不改实现断言；归属owner另行定案 |
| OPEN-007 / OI-009/012 | confirmed责任/open接线；PFACT-003、FR/AC003/008 | N10 owner；checkSkillConsistency内容规则、adopted/content_sha256字段/实际vendored对象与本卡合法/反例原件 | 本卡P3/P8先交；N10首次接线时保全既有reports/exit，再证明常驻机器复算。此前不称已生效 |
| OPEN-008 / OI-010 | open；历史方向审查送达限制，不是方向缺陷 | N3审查政策owner；盲审初投与reveal合同衔接 | N3评估；本卡不改合同、不据此重派同scope轮次 |
| OPEN-009 / OI-011 | open；旧ADR重号与悬空引用 | ADR目录归属owner；旧引用/重号处置 | 本卡只避号保事实，不动旧档；0045/0046已真实存在 |
| OPEN-010 / OI-013 | accepted_risk；FR/AC009 | 父规则owner/后续复核者；P10双口径现场事实 | 按RISK-003处理；不把用户已承担风险改为fixed |
| OPEN-011 / U-009与确认接口 | unknown历史证明边界；FR/AC009/010 | make-decision主会话与原确认接口producer；第二次询问问题卡未保存、确认未含字节hash | 保原缺口，不补造原话/绑定，不扩大本卡实施范围 |

N1本次只读来源：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n1-main-agent-cost-20261015/quality/evidence/2026-10-16-131-verify-code-functional-acceptance.md`第19–49行及不可变补件`2026-10-16-133-verify-code-functional-supplement.md`第25–32行（同目录，SHA256 `7e765dd212bf6f8b7b34bd00e5a658d28ee3fbe1adf88ea933965c75b684a5a1`），执行事实以该task的`facts.jsonl`当前verify-code行及close_action行为准。AC-001–013只在具名样本范围observed_pass；AC-014仍unknown，缺make-decision/build-plan真实主会话调用；business_effect unknown、semantic_test_adequacy inadequate（正式临时TaskHandle删除序列未验）、code_review incomplete（终末OCR零provider完成），verify-code unverified。真实verify成本行已发布但incomplete、exit1；不以物理合并/归档/推送/清理改写质量，也不把工具、接线或该账行当本卡同条件收益样本。N1交付原端点为main `0c43823c67f701fbb4bea349a52d09c8302d5ed3`；本轮main维护端点为`8accb3b9e2bf2167e9bb73c3d37511e200e7cf67`，N2已合入该main，实际合入提交为`732f2919dac00b95fdfeb7f4356ea2dccd50a7f6`，本轮读回HEAD一致。

本次main合入与N2增量分账：历史开工到8accb3b9为main增量，8accb3b9到最终合入提交为N2已有草稿/共享修复净差，合入提交到现场为后续N2变化；N2自身合计仍取现场减8accb3b9。历史开工基线和AC判据不变，重叠hunk限制及逐路径计量只归P10。当前及后续stage成本留账复用合入后四阶段方法正文：图更新/非破坏性收口结果之后、最终stage-handoff之前，由真实阶段主会话调用既有CLI并回读任务账本；首笔绑定真实开工事件，未触发或失败明确“本阶段无记录”及原因，已发布缺口行如实披露，不因exit1重跑造绿；until后的清理/发布/回复未计入。build-code只在整个stage末调用，P11比较与stage留账各保原职责，不新增writer或门。

OI-006/007/008 已由 D-005/016/008/026 解决，OI-009责任已定；已回答项不重问。R-008 的5b“54条整体搬迁/内容生效”由各实际owner首次实现验收，最终复核归N10；N2只交形态和自身八项采用，保明确non-goal，不假覆盖。

## 13. 业务影响与回归范围

阶段按名读技能和人按场景找正文的合法路径保持；有问题登记变得可信，活动/退役语义保持可分。单技能携带附加资源和非权威来源卡，不扩宿主常驻成本。checker现有failures仍能影响原CLI退出，新内容只进入reports。安全边界合法动作保持，非法破坏动作真实拒绝；重复同内容与半途失败分别检查。schema消费者合法旧非来源字段保持，新来源组合显式区分。

受影响回归只覆盖这些入口及具名正反例；旧已知红、历史报告和无关残留不改。技术验收、来源可证范围、N10机器接线、N1整体成本、Git交付与最终close分别报告。

## 补充材料

- 产品目标/采用原文：父只读PRD `/Users/Hugh/Hugh/Project/workflowhub/specs/archive/skills-framework-redesign-20261014/prd.md` 的 N2、17来源表、E-2/E-10、54采用表N2八行；`parent:quality/evidence/raw-requirements/2026-10-14-skills-framework-redesign.md` §1第8项与第5项；`parent:quality/evidence/decision-log-refs/s3/T11-external-skill-migration.md` 开头质询。只在需要核原义强度时读。
- 模块真实答复：`task:quality/evidence/2026-10-16-006-module-convergence-brief.md`；模块字段实测 `task:quality/evidence/research/n2-module-design-facts.md`。归因D-018…D-032时必须读真实答复，不以旧审查未送达的摘要冒覆盖。
- 减法、来源与历史推导：decision-log外置事实索引中的四份research原件、`requirement-change-log.md`、`coverage-matrix-5d.md` 与 `review-dispositions.md`，按对应到达条件读，原件不复制。
- WR001作者自检：本稿按单权威分工将AC只放Appendix A、来源理由指原owner、Phase命令归Phase；Q01/02/03/05/08/09控制入口/条件指针与同概念位置，Q04/06/07保量词/失败/硬边界，Q10/11/12去重复/过期而保真实缺口。实际agent消费、真人阅读成本及输出用量未观测，不据篇幅宣称优化效果。
