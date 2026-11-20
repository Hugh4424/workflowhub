# 决策日志（v2：build-plan 输入版）

> 旧版已归档到任务库 `quality/evidence/archive/decision-log/`；本文件是当前唯一日志。

## 0. 怎么读

- 读者：build-plan 作者、build-code 实现者、独立审查者；默认读者没读过聊天记录。
- 顺序：先读入口和需求，再读包目录，按包读设计；最后读跨包共享和证据索引。
- 每包十项：原始需求、最初方案、发散与被否、调研、最终决定、完整方案、配套与影响、验收、风险/回退、未决/消费者/证据。
- 验收在每个包里面，用 `AC-P<包号>-<序号>` 编号；最后一个包做完整验收。5.0 只做 AC 索引（编号、命令、证据、观察者），判据仍以包内为准，不另立第二套验收面。

## 1. 入口

### 1.1 任务是什么

workflowhub 的开发任务质量差、build-code 浪费大、上一轮方案没有真正生效。本任务用多个 Phase 修掉能复现的问题，并让门、检查、页面、收口真正生效。

### 1.2 走哪条路线

复杂路线。会改运行时机制、证据形状、页面和收口；影响面跨任务，不能按轻档一次做完。

### 1.3 原始需求（翻译后）

原话只作来源，不作需求本身。

**需求 1**
- 原话：“把所有既有调研、表现和设计记录清楚”。
- 要什么：把调研、失败表现、设计写成 build-plan 能直接用的材料；每条有来源、有决定、有验收，不是流水账。
- 为什么：上一轮材料只有结论，build-plan 取不到细节，只能重读聊天或猜。
- 怎么算完成：build-plan 不重读聊天也能写 spec/phases；每包十项齐。
- 落到：包 2、3、10。

**需求 2**
- 原话：“查清 T13/T8 build-code 耗时、token、返工的根因，以及为什么前期没预料到”。
- 要什么：用真实数据解释时间/token 花在哪、返工由什么触发、计划阶段为什么没发现；结论要变成计划检查和修复循环，不是事后复盘。
- 为什么：上一轮十几轮返工、子代理占输入约九成，计划期没拦住。
- 怎么算完成：根因有排序和证据；每条根因落到包 4、5、8 的具体机制。
- 落到：包 4、5、8。

**需求 3**
- 原话：“开一个新任务，彻底解决开发质量与 build-code 问题”。
- 要什么：一个任务分多个 Phase，修掉能复现的问题；门、检查、页面、收口真正生效，每项有反例和证据。
- 为什么：上一轮门红了还写成功，方案没落地。
- 怎么算完成：10 包实现；包 10 做完整验收；没有“假成功”。
- 落到：全部包。

**需求 4：归档先于提交**
- 原话/来源：“收口要先归档再提交，specs 不留漏归档目录”（2026-11-19 对话）。
- 要什么：先确认 archive；`git add -A`；整目录 `git mv`；同一 commit；归档存在且源不存在；两条推送记录；不用永久例外表。
- 为什么：上一轮有漏归档、手工 mv、merge 后才 archive。
- 怎么算完成：归档断言过；一次 commit；两条授权记录；c09 负例不通过。
- 落到：包 9。

**需求 5：测试不复用真实产品库**
- 原话/来源：“测试不要默认用真实产品库；每个项目固定标准数据集；build-plan 设计 Phase 0/测试环境/数据”（2026-11-19 对话）。
- 要什么：build-plan 写四件事——来源/上限、一条能重复跑的命令、版本落后即失败、清理四问；复用 `testing-system-blueprint`；不建 P0.md、不设第二 owner；跨项目迁移记具名缺口。
- 为什么：开发/测试一直用真实库；临时目录留大量文件；备份压力大。
- 怎么算完成：四件齐；一条命令能重复跑；版本落后会失败；清理四问有答案；负例不通过。
- 落到：包 8。

**需求 6：逐包收敛做成 decision-maker 技能**
- 原话/来源：“把逐包收敛写成技能；每包多子代理；主会话唯一 writer；并行”（2026-11-19 对话）。
- 要什么：每包调研、设计、审查三个角色；上下文包一页；十一格卡；冷读六问、对抗九问；脚本/模板放技能内；复杂度预算；每包最多 3 个子代理。
- 为什么：上一轮卡片是需求转译；子代理占输入约九成，成本失控。
- 怎么算完成：每包三角色回传；卡；冷读/对抗；缺一项不算收敛；`validate-card` 能跑。
- 落到：包 3。

**需求 7：answer-as-page 要能追溯**
- 原话/来源：“answer-as-page 改了很多轮还是差；包全缺；要能追溯”（2026-11-19 对话）。
- 要什么：流程产出状态模型；渲染器只渲染；三道门（结构含契约/指针/计数+指纹）；级别规则写死；模型失败不出页。
- 为什么：页面只认旧编号，9/9 包全缺；36 条契约错还发布。
- 怎么算完成：页面显示 10 包/级别/验收；三道门缺一不发布；材料变指纹变；负例不通过。
- 落到：包 6。

**需求 8：知识图谱不挡收口**
- 原话/来源：“图更新浪费时间/失败；不挡收口；当前任务材料直接读”（2026-11-19 对话）。
- 要什么：当前任务材料直接读；handoff 更新本阶段文档图；close 只更新代码图；不全量重抽；不每 worktree 复制。
- 为什么：图 28.7MB、65% 文档节点、60% 归档；100MB+ 是复制；全量更新 34 分钟。
- 怎么算完成：handoff 文档图回执；close 代码图回执；图失败记“未更新”，不挡收口。
- 落到：包 9。

**需求 9：验收完全可验证**
- 原话/来源：“所有任务开发完后完全可验证；不能验的写清”（2026-11-19 对话）。
- 要什么：每包验收有命令、期望、反例、owner/时点；不能验的写“留 build-code，谁、什么命令、什么时候”；最后一个包做完整验收。
- 为什么：AC 全是空位；门红了还写成功。
- 怎么算完成：每包 AC 能跑或具名缺口；最后红证明、回放、声明对账、签字齐。
- 落到：全部包，包 10 汇总。

**需求 10：主会话少读、及时汇报、提问用工具**
- 原话/来源：“主会话少读、及时汇报；提问用工具、大白话、选项/后果/风险”（2026-11-19 对话）。
- 要什么：主会话只派发/汇总；不大量阅读；talk 用提问工具；大白话；每个选项写后果和风险。
- 为什么：上下文膨胀；过去出现黑话和长文。
- 怎么算完成：主会话不重读材料；每次 talk 用工具；卡上无黑话；进度及时汇报。
- 落到：全部包，包 3 落规则。

**需求 11：material-writing 要容得下设计历程**
- 原话/来源：“material-writing 是不是要基于这个 decision log 稍微优化一下？”（2026-11-19 对话）。
- 要什么：不改十一条主规则；在模板例外块声明“每包十项是记录节”——标题用事实名、首句写事实、AC 随验收表、缺口计数只作校验器读数；不把“短/先结论”压到设计历程上。
- 为什么：现规则会把原始需求/最初方案/被否方案压成一句结论，build-plan 看不到过程。
- 怎么算完成：记录节能完整写十项；十一条仍约束普通段落；反例：设计历程被压成“已决定”。
- 落到：包 10。

**需求 12：三类审查输入要读新模板**
- 原话/来源：“方向审查、细节审查、build-plan 审查的输入是否要调整？”（2026-11-19 对话）。
- 要什么：方向审查的 alternatives 必须含“最初方案+谁否+为什么”；细节审查逐包核十项；build-plan 核 spec/phases 是否消费了每包设计；baseline 要把每包设计收进去。
- 为什么：审查还按旧结构读，会漏接口/写集/验收/风险；baseline 现在跑本日志 exit 1。
- 怎么算完成：方向 packet 有最初方案；细节有逐包十项检查；build-plan baseline 含每包设计；两套 contract 测试通过；反例：本日志跑 baseline 仍 exit 1。
- 落到：包 10。

**需求 13：每包都要写配套调整、迁移、移除、影响范围**
- 原话/来源：“每一个需求的方案里面都应该有配套调整/迁移/移除/影响范围，否则 build-plan 会漏”（2026-11-19 对话）。
- 要什么：每包“完整方案”后固定四项——配套调整（调用方/配置/文档/测试）、配套迁移（旧数据/旧合同/旧版本）、配套移除（旧开关/旧代码/旧文档/旧测试）、影响范围（哪些包/消费者/现有功能）。
- 为什么：只做新功能不改配套，功能落不了地；旧东西不删，项目越改越脏。
- 怎么算完成：每包四项齐；缺项具名 owner/时点；build-plan 据此排 Phase。
- 落到：全部包，包 10 模板。

**需求 14：spec-analyze 与 build-plan 对账**
- 原话/来源：“make-decision 结尾用 spec-analyze 查原始需求覆盖；build-plan phase 拆分后粗查、审查后细查 decision-log 与 spec/phases”（2026-11-19 对话）。
- 要什么：三张表——A 在 make-decision 第 13 步逐条原始需求→包/决定/验收/缺口 owner；B 在 build-plan 第 6 步末只粗查“包/需求是否都有 Phase、依赖、独立交付”；C 在第 10 步审查后细查 decision-log 十项 vs spec/phases、findings 是否闭合。
- 为什么：现在 spec-analyze 只在 build-plan 收口跑；拆分后不查每包十项，审查后不核一致性。
- 怎么算完成：A/B/C 表有行、缺口有 owner；B 不查接口/写集/AC 细节；C 覆盖十项和 findings；反例：需求只在合并句出现、Phase 与包对不上、标 fixed 但 diff 里原断言还在。
- 落到：包 10（扩包，不新开）。

### 1.4 范围和不做什么

- 范围：workflowhub 本仓的技能、运行时检查、页面、收口、测试数据规则、知识图谱更新规则。
- 不做：PaperBuilder 业务实现；T13/T8 本体修复；真实交易/行情/账户环境；历史证据重写；把“准备阶段”复活成新 Phase。
- 跨项目命令（建库、迁移、对账）不在本仓执行，记具名缺口，不写成已验。

### 1.5 怎么算整体完成

10 包各自验收通过；包 10 做完整验收：每包红证明、历史失败回放、三种交付声明对证据、独立签字；链检查 0 warning；没有未解释的缺口。

## 2. 要解决什么，用户确认了什么

### 2.1 要解决什么

1. **技能装了但用不上**：装 repo 根对别的项目无效；完成门缺“技能加载”证据，缺材料/缺检查还能过。→ 包 1。
2. **证据靠补记、交接靠摘要**：原件缺失、U 表指向日志自身、下游没读。→ 包 2。
3. **逐包收敛变成“需求转译”**：没有调研、没有备选、冷读/对抗流于形式，子代理成本失控。→ 包 3。
4. **开工条件到写代码才发现**：环境、依赖、数据、权限、表结构、外部服务、回滚没有槽位。→ 包 4。
5. **返工十几轮**：同因重复、验收标准被实现者改、写集漂移、成本看不见。→ 包 5。
6. **页面全缺**：自由文本当接口，解析器每轮补写法，材料对不上还发布。→ 包 6。
7. **门红了还写成功**：门结果不落盘，交接/收口不读，交付声明没证据。→ 包 7。
8. **测试用真实产品库**：没有来源/上限、没有一条命令、没有版本落后断言、没有清理。→ 包 8。
9. **归档和图拖慢收口**：归档漏、授权不够、图全量重抽、失败挡收口。→ 包 9。

### 2.2 用户确认了什么

- 走复杂路线；只改 workflowhub，不改 PaperBuilder。
- 12 包合并为 9 包，另加第 10 包（decision-log 优化）；每包 3 个角色；主会话唯一 writer。新增包 10 的答复登记为 U-020（本次对话转录，原答复时点未取得）。
- 技能安装只做安装、可发现、加载事件；不做宿主注入，不反转 ADR-0024。
- 测试数据复用 `testing-system-blueprint`，不建 P0.md、不设第二 owner。
- 收口先归档再提交；两条推送记录；不用永久例外表。
- 知识图谱：当前任务材料直接读；交接更新文档图；收口只更新代码图；图失败不挡收口。
- 跨项目命令、P7 人读分诊、P9 原件已失，接受为具名缺口；build-code 实现本仓能做的。
- 原始需求要翻译，不把三句原话当需求；decision-log 要能被 build-plan 直接消费。

### 2.3 方向审查处置

- 原件：`quality/reviews/2026-11-19-005-make-decision-direction.json`；62 条 findings（5 blocking B1–B5、15 fixed、47 needs_human），kimi 27 条、codex 35 条。
- 5 条 blocking 已修（本版复验未取得，见 5.3）；其余 47 条按包处置，未闭合的进 5.3；不写“通过”。
- 11 条要用户定，build-plan 前逐条给 owner/时点。

### 2.4 细节审查处置

- 原件：`quality/reviews/2026-11-19-006-make-decision-detail.json`；37 条 = 6 blocking + 31 major。
- 6 条 blocking 已修（本版定向复验未取得，`mc10-blocking-recheck` 记录不在可读证据区，见 5.3）；31 条 major 按 needs_human 记，build-plan 前逐条给 owner/处置，不写成已解决。
- 定向复验见 `mc10-blocking-recheck` 记录；未闭合项进 5.3 全局未决。

### 2.5 旧 12 包 → 新 10 包映射

旧 1+2→1；3+4→2；5→3；6→4；7→5；8→6；9→7；10→8；11+12→9；新增 10（decision-log 优化）。旧 12 包段只作素材，不再作为验收单位。

### 2.6 原话与答复索引

- 原始请求逐字：`quality/evidence/original-request.md`；本日志 1.3 是翻译稿，不替代原话。
- 答复共 22 条；U-011…U-019 是 backfilled/转录，不作为当时原件；U-020 是本次对话转录，只登记“新增包 10”这一事实。

| 编号 | 答复摘要 | 原件/状态 |
| --- | --- | --- |
| U-001 | 走复杂路线 | talk/001 |
| U-002 | 页面沿用现有模板 | talk/002 |
| U-003 | 内部+外部调研 | talk/003 |
| U-004..U-007 | 结构四问：交接包、页面只修缺陷、读取器修根因、并行 | talk/004..007 |
| U-008 | 首批清理授权（磁盘清理第一批；**不是**新增包 10 的依据） | `talk/2026-11-19-003-cleanup-batch1-answer.md:10` |
| U-009 | 12 包骨架确认（历史） | talk/004-skeleton-12 |
| U-010 | 遗留归档 | talk/010 |
| U-011 | P10 定稿 | talk/006-p10 |
| U-012 | P11 定稿 | talk/007-p11 |
| U-013 | P12 定稿 | talk/008-p12 |
| U-014 | P1 定稿 | talk/009-p1 |
| U-015 | P2 定稿 | talk/010-p2 |
| U-016 | P3 定稿 | talk/011-p3 |
| U-017 | P4 定稿 | talk/012-p4 |
| U-018 | P2 v2 定稿 | talk/013-p2-v2 |
| U-019 | 9 包整体确认，进细节审查（整体确认，不代逐包确认） | `talk/2026-11-19-014-p9pack-merge-answer.md:9`；转录，无调用 id |
| U-020 | 新增包 10（decision-log 优化） | 本次对话转录，无调用 id；不是当时原件；原答复时点未取得 |
| U-021 | 十包全部确认 | `talk/2026-11-19-015-all-packages-confirm-answer.md:9`；转录，无调用 id |
| U-022 | 需求 11–14 认可转写 | `talk/2026-11-19-016-req11-14-transcript-answer.md:9`；转录，无调用 id |

> 旧 `U-011..U-018` 的 P 编号是 12 包期的旧包号（P10/P11/P12/P1/P2/P3/P4/P2-v2），合并后不自动等于现十包中同号包，也不能当现包逐包确认；`U-019` 是 9 包整体确认。现十包已由 U-021 明确全部确认；历史逐包答复按旧包号映射，不冒充新包；详见需求索引 §2.1。

## 3. 包目录

1. **技能安装与完成门** —— 装得上、看得见、加载有证据；完成门只认证据。
2. **证据与交接** —— 原始请求和答复有原件；交接用不可变引用，不靠摘要。
3. **decision-maker** —— 每包调研、设计、审查三角色；没有这些不算收敛。
4. **开工就绪** —— 计划阶段先查开工条件；不过就补，不带着问题写代码。
5. **修复循环** —— 每阶段验收一次；每两轮按严重程度决定分诊；不原样硬修。
6. **页面** —— 页面从结构化模型渲染，不再猜散文；材料对不上不发布。
7. **全链验收** —— 红证明、历史回放、声明对账、独立签字。
8. **测试数据** —— 复用现有测试标准；build-plan 写清四件事。
9. **收口与知识图谱** —— 先归档再提交；交接文档图、收口代码图。
10. **decision-log 优化** —— 让日志成为 build-plan 的完整输入；最后一个包做完整验收。

清单：`quality/evidence/decision-log-refs/convergence-checklist.md`

## 4. 每包设计

### 4.1 技能安装与完成门

**原始需求**：技能装了但用不上；完成门缺“技能加载”证据，缺材料/缺检查还能过。来源：2026-11-19 对话。

**最初方案**：只装到 repo 根，靠“文件存在”判完成；被否：对别的项目无效，而且没有“读过”的证据。

**发散与被否**：
- A 只装技能：成本最低，但没有生产者，完成门还是“文件存在”。否。
- B 安装+加载事件+完成门：多一个事件，但能证明“读过”。选。
- C 恢复宿主注入：能更强，但违反 ADR-0024。否。

**调研**：
- ADR-0024 已删除宿主会话绑定；不能靠注入/回执恢复。
- `reading_baseline` 只写字节数、没有 sha；`check-stage-steps` 对缺失/ENOENT/complete=false 仍 exit 0。
- T13/T8 出现“只读主技能、0 子技能、装 repo 根对别的项目无效”。
来源：`docs/adr/0024-*`、`tools/cli/check-stage-steps.mjs`、T13/T8 审计。

**最终决定**：选 B；加载事件只证明文件被读取，不证明模型理解；缺加载/材料/检查记 unknown，检查非 pass 记 failed；v1 不启用跳过。

**完整方案**：
- 安装：装到配置的宿主根，记录实际根；新会话能看到；不做注入/回执/拒绝。
- 事件：`{stage, step, skill_path, sha256, bytes, at}` 写入 `facts.jsonl`；步骤入口写。
- 完成门：`check-stage-steps` 读事件、材料、检查三样；自写 complete 不算。
- 写集：`tools/cli/check-stage-steps.mjs`、`runtime/stage/` 的步骤入口、`reading_baseline` 读取处；依赖无；消费者包 2/3/4。

**配套与影响**：
- 配套调整：`reading_baseline`、`check-stage-steps`、`facts` 读取；安装根记录。
- 配套迁移：旧任务没有加载事件记 unknown；新会话重新安装/记录。
- 配套移除：旧“文件存在即完成”判断、旧跳过逻辑。
- 影响范围：包 2/3/4、现有任务完成门、新会话可见性。

**验收**：
- **AC-P1-1 完成门只认本次加载事件**：命令 `node tools/cli/check-stage-steps.mjs --stage=<stage>`。期望通过：exit 0，输出含本次 `{stage, step, skill_path, sha256, bytes, at}` 事件，且材料/检查两项齐、`complete` 由检查器给出。期望失败：缺事件/缺材料/缺检查 → `unknown`（不得当 pass）；检查非 pass → `failed` 且 exit≠0。反例：同任务旧版本事件冒充本次、只读主技能 0 子技能、自写 `complete=true`。证据：`quality/tests/2026-11-19-p1-stage-steps.txt`（**未取得：任务库 `quality/tests/` 无此文件，stdout 原件未产出**；owner=运行时 owner/包 1；恢复条件=包 1 实现后重跑 `check-stage-steps` 并把 stdout 存为该路径并登记 sha，或改引届时真实产出的读数文件；取得前本 AC 不得判通过）。观察者：运行时 owner（不写本包代码者）。时点：build-code 实现后。
  可跑性：命令现在可跑，但实现前缺材料/缺检查仍 exit 0，**现状读数不得判通过**；owner=包 1。
- **AC-P1-2 安装可见且 baseline 有 sha**：人工操作：在配置的宿主根执行 `ls`，并读 `reading_baseline`。期望通过：新会话能发现技能，baseline 行含 bytes+sha256。期望失败：只装 repo 根、baseline 无 sha。反例：装 repo 根后别的项目看不到、baseline 只有字节数。证据：安装根记录 + baseline 输出。观察者：运行时 owner。时点：build-code 实现后。
- 对应决定/索引：D-002；AC 索引见 5.0。

**风险/回退**：不同宿主根可能不同；事件只证明读取；回退到“只安装”，完成门记缺口。

**未决/消费者/证据**：宿主根清单谁维护；包 2/3/4 消费；证据：`quality/evidence/research/2026-11-19-prior-audit-synthesis.md`；sha256 `0129a36f4842aee3d844405afcc66add5639ace420a257115ef82bd0e81061a8`（§2.4 技能可发现性、T13/T8 审计段；2026-11-20 读取）。
### 4.2 证据与交接

**原始需求**：证据靠补记、交接靠摘要；U 表指向日志自身，下游没读。来源：2026-11-19 对话。

**最初方案**：写九字段摘要/脚本生成合同；被否：摘要会漂移，生成合同是第二权威。

**发散与被否**：
- A 手写九字段摘要：好读，但会漂移。否。
- B 脚本生成合同：一致，但造第二权威。否。
- C 不可变引用+开放问题：最小，下游能核。选。

**调研**：
- `commit:path` 可取 blob；行号相对 blob；工作树哈希会过期。
- T13/T8 出现“声明串行、实际并行”“下游没读交接”。
- 上一轮 U 文件缺失/预填、U 表指向日志自身。
来源：`core/task-close.mjs`、`quality/evidence/decision-log-refs/`、T13/T8 审计。

**最终决定**：选 C；确认哈希和下游回执入 facts；行号只作定位，读时按 blob 核；backfilled 标“不是当时原件”。

**完整方案**：
- 交接清单：`commit:path` + blob id；开放问题由 owner 写。
- 确认：展示哈希；回执记 ref、行、决定、时间。
- 写集：`specs/<task>/decision-log.md`、`quality/evidence/`、`facts.jsonl`；依赖包 1；消费者 build-plan/build-code。
- 不建第二份证据账本；U 表只存指针。

**配套与影响**：
- 配套调整：talk/U/refs/facts、确认回执。
- 配套迁移：旧摘要交接转 refs；backfilled 标注。
- 配套移除：第二份证据账本、九字段合同。
- 影响范围：build-plan/build-code、旧任务交接。

**验收**：
- **AC-P2-1 原件与 ref 可核**：命令：对每条 ref 跑 `git cat-file -e <blob>`，对原件跑 `shasum -a 256 <路径>`。期望通过：blob 存在、行号相对 blob、sha 与登记一致。期望失败：ref 指向日志自身/工作树/行号漂移 → 要求重核，回执记新 ref，旧确认保留。反例：自引用、把补记当当时原件。证据：`quality/evidence/decision-log-refs/` 确认回执。观察者：材料 owner。时点：本轮可核（索引 §5 已登记 sha）。
- **AC-P2-2 下游读回执与阶段边界**：人工操作：build-plan 起始记录本次读到的 ref+blob；命令 `node tools/cli/check-decision-log-chain.mjs --file <log>` 作边界辅助。期望通过：读回执存在且 blob 一致。期望失败：回执存在但下游未读 → 记 `incomplete`；build-plan 改上一阶段日志。反例：摘要代替 ref、回执在但下游没读。证据：facts 回执 + 链检查输出。观察者：独立审查者。时点：build-plan 后。
- 对应决定/索引：D-003/D-004；AC 索引见 5.0。

**风险/回退**：行号会随 blob 变；旧任务要例外；回退保留旧交接和回执。

**未决/消费者/证据**：backfilled 何时换真实记录；build-plan/build-code 消费；证据：`quality/evidence/original-request.md`；sha256 `a7d0dc0e7144fd809701d3615c65b2930c602bbcea1b52fd3e2ce3217f1afde6`；`quality/evidence/decision-log-refs/four-checks-2026-11-19.md`；sha256 `a116b7df3a98cf826f68d49e24f29fbca8dc08a18b787039d1b68c9c6338be4f`（2026-11-20 读取）。
### 4.3 decision-maker

**原始需求**：最初只是“优化逐包收敛”这个过程，并没有 decision-maker 技能这个概念；目标是让每包收敛有调研、有方案、有验收，不再把需求转译成卡。

**最初方案**：在 make-decision 里加步骤/检查表，让主会话逐包写卡；主会话兼写兼审。被否：还是流程补丁，没有角色分工；主会话自审；成本会失控。

**发散与被否**：
- A 5 角色（调研、发散、设计、冷读、对抗）：覆盖最好；60 次子代理，成本最高。否。
- B 2 角色（调研+对抗）：成本低；冷读和对抗挤在一起，容易漏。否。
- C 3 角色：调研（调研+发散）、设计（方案+收敛）、审查（冷读+对抗）；主会话 writer/派发。选。
- 用户提出：把它做成独立技能 `decision-maker`，脚本/模板放技能里，不放 `tools/`；主会话唯一 writer，能并行。选。

**调研**：
- 内部失败模式：12 包逐项失败，横向 12 类（转译、错误 owner、证据倒填、验收不可执行、过度设计、黑话、路径错、冷读形式化、边界不清、只加不删、提前写收敛、补丁式修复）。
- 外部：ADR/RFC/Design Doc 都要求“背景、目标、方案+备选、接口、数据、验收、风险、依赖、开放问题、来源”；只写决定+指针会丢理由/备选。
- 成本：T13 56 个子代理占输入 90.1%；5 角色×12 包约 60 次，复制病因。
来源：`2026-11-19-decision-maker-failure-modes.md`、`2026-11-19-dl-external-research.md`（**未取得：任务库中不存在该文件**；owner=日志/调研负责人；恢复条件=补交该外部调研原件并登记 sha，或改引真实存在的 `2026-11-19-dl-build-plan-input-audit.md` 外部格式段）。

**最终决定**：
- 做成独立技能 `decision-maker`；每包 3 个角色；每包最多 3 个子代理；主会话唯一 writer；不搞五角色×12。
- 卡必须十一格；冷读六问；对抗九问；复杂度预算；没有这些不算收敛。

**完整方案**：
- 技能文件：`skills/decision-maker/SKILL.md`；`templates/package-context.md`、`card.md`、`cold-read.md`、`adversarial.md`；`scripts/validate-card.mjs`、`dispatch.mjs`、`status.mjs`。
- 上下文包：包号/名称、目标、需求原文、现状证据、调研来源、前序决定、边界/非目标、卡模板、验收三件套、开放问题、输出路径；一页+引用；只给任务库路径，不给整段会话。
- 调研角色：内部（仓库/审计）+外部（检索）；交事实、来源、候选；不提最终方案。
- 设计角色：至少 3 个方案（含结构性方案：技能/脚本/并行/复用现有机制）；选最小；写卡；每个新机制说清防哪个真实失败；必须写“配套与影响”四项——配套调整、配套迁移、配套移除、影响范围。
- 审查角色：冷读六问（改什么、为什么、边界、怎么验、还有什么没定、配套迁什么）+ 对抗九问（调研范围、现状、优雅、验收可行、隐藏假设、更简单替代、太复杂、防御性编程）；另问“是不是只做了新功能，漏了配套调整/迁移/移除/影响范围”；答不出/blocking 就改卡。
- 主会话：写 decision-log、派发、汇总；不重读材料；不兼写兼审；talk 只问歧义。
- 并行：独立包并行；包内调研→设计→审查顺序；审查的冷读+对抗同一人做；talk 队列串行。
- 卡：十一格——一句话结果、对应需求、现状缺口、方案与取舍、边界、数据与状态、配套与影响、验收、风险与回退、未决（谁定）、白话复述；卡上不许黑话/内部编号。
- 验收三件套：命令/检查、反例、证据路径；现在不能跑写“留 build-code，owner/命令/时点”。
- 脚本：`validate-card` 机械检查十一格/黑话/AC 三件套/配套四项；`dispatch` 生成三角色 brief；`status` 看包状态；脚本不代替冷读/对抗/用户判断。
- 输出：每包卡、三角色回传、冷读/对抗原件、decision-log 该包十项。
- 十项定义唯一来源：`skills/decision-log/templates/decision-log-template-v2.md`；本技能与包 3 只引用，不另立第二份。

**配套与影响**：
- 配套调整：make-decision/decision-log 引用；`skills/decision-maker/` 模板/脚本。
- 配套迁移：旧卡/五角色引用改三角色；旧包卡补十项。
- 配套移除：五角色×12、主会话兼审。
- 影响范围：全部包收敛、成本、审查。

**防再发（build-plan 审查后）**：
- `validate-card` 增加：验收格必须含“通过/失败/至少一个反例”，禁止同一段并存通过/失败判词；缺一项 exit 1。
- 并入 AC-P3-001，不新增 AC；owner 技能 owner；时点 build-code 首个包前。

**验收**：
- **AC-P3-1 三角色/十一格卡/冷读对抗可机检**：命令 `node skills/decision-maker/scripts/validate-card.mjs <card.md>`。期望通过：exit 0（十一格、黑话、AC 三件套、配套四项齐），且有 3 份角色回传 + 冷读六问/对抗九问原件。期望失败：缺任一格/审查 → exit≠0。反例：只有卡没审查、主会话兼写兼审、卡上有未解释的 R/P 编号。证据：卡、回传、审查原件放 `decision-log-refs/`。观察者：技能 owner。时点：build-code 实现后，先一个包试跑。
  可跑性：脚本未实现 → 未取得；owner=包 3。
- **AC-P3-2 逐包用户收敛是真实事件**：人工操作：十包逐包用提问工具 talk，答复落 `talk/` 并带 `source_id`；索引 §2.1 标“已确认”。期望通过：每包一条可回读答复。期望失败：拿整体确认或转录当逐包确认 → 该包记“未取得”。反例：用 U-019 一次整体确认代替逐包确认。证据：索引 §2.1 + talk 原件。观察者：主会话 + 独立审查者。时点：需用户逐包答复；U-021 已明确全部确认。
- 对应决定/索引：D-001；AC 索引见 5.0。

**风险/回退**：角色交接丢信息；审查一人做冷读+对抗可能漏；子代理成本仍可能高；回退保留旧卡和回传，按包回滚。

**未决/消费者/证据**：卡校验字段清单；make-decision 各包消费；证据：`quality/evidence/research/2026-11-19-decision-maker-failure-modes.md`；sha256 `b9ba5e435e9f88ff51a1020241932c2560bfed3bf91443c856b6a9968132ab4e`（2026-11-20 读取）。

### 4.4 开工就绪

**原始需求**：环境、依赖、数据、权限、表结构、外部服务、回滚没有槽位，到写代码才发现。来源：2026-11-19 对话。

**最初方案**：加 Phase 0/检查表；被否：与测试标准冲突，而且靠 agent 记性。

**发散与被否**：
- A 只加检查表：靠记性。否。
- B 检查表+新命令：多一套命令和双调用。否。
- C 现有校验器+收口一次：最小，能机器查。选。

**调研**：
- 三份技能零命中七类条件；“第 0 阶段”只是建议，T13/T8 静默跳过。
- `validatePostPhaseContract` 存在但调用点在 review 组包/终末，晚于写代码。
- 实测已 close 任务仍报 6/36/241 条缺项。
来源：`2026-11-19-p6-readiness-design.md`。

**最终决定**：选 C；机器项红就停该阶段；人判项没证据只记“未核实”；数据内容归包 8；跨项目命令记具名缺口。

**完整方案**：
- 模板“开工就绪”表五列：命令、期望、证据、机器或人判、负责人；规格写全局项，阶段写增量。
- **谁执行机器项**：由 build-code 阶段入口执行——`tools/cli/stage-runtime.mjs` 的 run/execute 首步；材料侧同一函数 `validatePostPhaseContract` 已由 `tools/cli/run-checks.mjs --material-root` 调用，前移不新增命令。
- **结果落盘**：`facts.jsonl` 一行，含 `phase`、`material_sha256`、`probe`、`status`（`pass`/`failed`/`missing`/`stale`）、`runner`、`at`；沿用现有 stage row 键，不建新对象、不建第二账本。
- **缺失/过期/红如何停**：`missing`/`stale`/`failed`（红）→ 首步 exit≠0，该阶段不产生写集内写入；人判项无证据只记“未核实”，不阻断。
- **如何重跑**：材料或环境变化后重跑同一入口；旧结果行保留，不覆盖；重跑前不手工改状态。
- 写集：`skills/spec-plan/templates/phase-template.md`、`skills/spec-plan/SKILL.md`、`workflows/build-plan/SKILL.md`、`tools/cli/stage-runtime.mjs`、`tools/cli/run-checks.mjs`、`runtime/stage/stage-content-contracts.mjs`；依赖包 3/8；消费者 build-code。

**配套与影响**：
- 配套调整：phase-template/spec-plan/build-plan。
- 配套迁移：旧“第 0 阶段”建议删；旧任务补就绪表。
- 配套移除：“第 0 阶段”建议、双调用。
- 影响范围：build-code 第一步、测试数据。

**验收**：
- **AC-P4-1 机器项探针执行并落盘**：执行者=build-code 阶段入口（`stage-runtime` run/execute 首步；当前 `validatePostPhaseContract` 调用点在 review 组包/终末，需前移到首步）。命令（现在可跑）：`node tools/cli/run-checks.mjs --material-root <任务材料绝对路径> --stage=build-plan`。期望通过：就绪表五列齐、机器项全 `pass`、`facts.jsonl` 有上述六字段行。期望失败：`missing`/`stale`/`failed` → exit≠0 且 build-code 首步停止；`facts` 缺行不得当通过。反例：**表格式合法，但数据库权限探针失败**（或外部服务不可达）→ 必须红并停止，且没有写集内写入。证据：run-checks stdout + facts 行。观察者：计划 owner。时点：实现后（本轮只可跑失败基线）。
- **AC-P4-2 红就绪不得开写**：人工操作：看 build-code 首步日志 + `git status --porcelain`。期望通过：红就绪时首步 exit≠0 且工作树无写集内改动。期望失败：删命令/改错期望仍开写、红仍写代码。反例：预置一条红就绪事实仍进入实现。证据：首步日志 + git status。观察者：独立审查者。时点：实现后。
- 对应决定/索引：D-005；AC 索引见 5.0。

**风险/回退**：材料漂移；探针成本；跨项目命令不能本仓验；回退保留就绪表。

**未决/消费者/证据**：哪些机器/人判；build-code 消费；证据：`quality/evidence/research/2026-11-19-p6-readiness-design.md`；sha256 `8b487cd9f1367d3899ed283ef7468ee6048d50afdd3c679c15658c48a89809ab`（2026-11-20 读取）。
### 4.5 修复循环

**原始需求**：十几轮返工、同因重复、验收标准被实现者改、写集漂移。来源：2026-11-19 对话。

**最初方案**：固定 2 轮上限；被否：会砍掉真新事实的第三轮，降质量。

**发散与被否**：
- A 固定 2 轮上限：便宜，但会砍真新事实。否。
- B 不限轮：保质量，但成本失控。否。
- C 每两轮按严重程度判断：保质量、可控。选。

**调研**：
- T13 P4 16 轮；同因多为 flake/装置改动；多数轮不是新事实。
- `failure_signature` 是运行级签名，不能当同因键；`check-stage-quality --report` 可核写集。
来源：`2026-11-19-p7-repair-design.md`。

**最终决定**：选 C；阻塞/高风险必须分诊；轻微且有新证据可继续；同锚无新证据不许原样修；验收标准冻结 hash。

**完整方案**：
- 阶段正文记“修复轮次与分诊”：第几轮、新假设、严重程度、结论、选择。
- 两个计数：全局“每两轮修复+验收”做严重程度判断；单失败“同锚连续两轮无新证据”禁止原样修。
- 成本每阶段一行 token/时间；写集用 `check-stage-quality --report`。
- 写集：`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、Phase 文件；依赖包 4；消费者 build-code 各 Phase。

**配套与影响**：
- 配套调整：build-code SKILL/standard-workflow/Phase 文件。
- 配套迁移：旧审查日志保留；新阶段写分诊。
- 配套移除：check-repair-log、试点段、固定轮数。
- 影响范围：所有 Phase、成本、审查。

**防再发（build-plan 审查后）**：
- `validatePostPhaseContract` 粗查：gate_cmd 裸变量、写集派生件、AC 与写集范围、需求对账；缺项具名，不假过。
- 并入 AC-P5-002；只在现有 gate_cmd 内加，不新增阶段/命令；owner 校验器 owner；时点 phase 拆分后+审查后。
**验收**：
- **AC-P5-1 分诊与同锚判据**：命令 `node tools/cli/check-stage-quality.mjs --report <phase>`（核写集）+ 人工核分诊行。期望通过：每两轮一行（轮次/新假设/严重程度/结论/选择）；阻塞/高风险有分诊；同锚连续两轮无新证据未原样修。期望失败：16 轮无分诊、原样硬修、实现者改测试。反例：同一故障只换行号、换夹具后转绿、第 16 轮仍无新证据。证据：Phase 文件 + `--report` 输出。观察者：独立审查者。时点：build-code 每 Phase。
- **AC-P5-2 验收标准冻结与写集一致**：命令 `git diff --name-only <base>..HEAD`。期望通过：测试/验收文件改动为空，或每处有具名裁决；`git diff` 写集与卡并集一致。期望失败：实现者改测试/AC 文本、写集漂移。反例：标 fixed 但 diff 里原断言还在。证据：diff 原文。观察者：独立审查者。时点：每 Phase。
- 对应决定/索引：D-006；AC 索引见 5.0。

**风险/回退**：严重程度判断有偏见；一次测试漏；回退保留原测试和失败。

**未决/消费者/证据**：谁做严重程度判断（独立审查者）；build-code 消费；证据：`quality/evidence/research/2026-11-19-p7-repair-design.md`；sha256 `def2cdc739e94274ccd8a22d2183f8316ecc13ca249db8973d118bf0738715b2`（2026-11-20 读取）。
### 4.6 页面

**原始需求**：answer-as-page 改了很多轮还是差；包全缺、契约错还发布。来源：2026-11-19 对话。

**最初方案**：继续修解析器；被否：自由文本当接口，根因不改。

**发散与被否**：
- A 继续修解析器：每轮补一种写法，根因不改。否。
- B 结构化状态模型：流程写模型，渲染器只渲染。选。
- C 不要页面，只留状态表：信息少，用户要追溯。否。

**调研**：
- `build-page-data.mjs` 无旧编号映射就 9/9 全缺；`check-page-content.mjs` 读顶层字段永不触发、只比两个文件时间；发布不以校验为门。
- 真实坏页 9/9 缺、36 条契约错、阶段仍显示“写计划”。
来源：`2026-11-19-p8-root-cause.md`。

**最终决定**：选 B；模型是唯一来源；材料只做指针；三道门缺一不发布；级别规则写死。

**完整方案**：
- UI 设计基准：本任务不是新 UI；不新增路由；沿用 `overview-template`；不重做视觉；截图受环境限制。
- 模型字段：包、级别、验收、来源指针、计数、指纹；不装状态。
- 三道门：结构（含契约）、指针、计数+指纹；级别映射 `:`/`=`/“复杂”，两种都没有或同时出现记 unknown。
- 命令：`validate-status-model`、`render-answer-page --model`、`check-page-content`。
- 写集：`skills/answer-as-page/` 的脚本和模板；页面 `quality/evidence/cockpit/overview.html`；依赖包 2/5；消费者用户/build-plan。

**配套与影响**：
- 配套调整：answer-as-page 脚本/模板/cockpit。
- 配套迁移：旧页面重渲染；旧编号映射。
- 配套移除：解析器、mtime 判陈旧、旧编号兼容。
- 影响范围：用户页面、build-plan 追溯。

**验收**：
- **AC-P6-1 三道门与 10 包可核**：命令 `node skills/answer-as-page/scripts/build-page-data.mjs --task <task>` → `node skills/answer-as-page/scripts/render-answer-page.mjs --model <model.json>` → `node skills/answer-as-page/scripts/check-page-content.mjs <page.html>`。期望通过：页面显示 10 包/级别/验收、契约错 0、指针可解析、指纹输入清单含 `phases/*`。期望失败：契约错仍发布、只改 `phases` 页面不判过期、旧编号映射缺失致包区全缺。反例：只改 `phases/P1.md`，页面仍显示“未过期”。证据：页面 + 三命令 stdout。观察者：页面 owner。时点：build-code 实现后。
- **AC-P6-2 状态投影与旧页过期**：人工/浏览器：当前 phase 与 facts 一致、旧页标过期。期望通过：页面 stage 与 facts 一致、发布失败保留旧页并标过期。期望失败：显示旧“写计划”、失败仍当新页。反例：旧页未标过期仍被读。证据：截图/DOM capture（环境不可用记 `unavailable`）。观察者：用户 + 页面 owner。时点：实现后。
- 对应决定/索引：D-007；AC 索引见 5.0。

**风险/回退**：模型 schema 维护；旧页迁移；截图看环境；回退保留旧页。

**未决/消费者/证据**：模型 schema 谁定；用户/build-plan 消费；证据：`quality/evidence/research/2026-11-19-p8-root-cause.md`；sha256 `eda3dd1f3fcc0aede88b22463f5b63df2d95c3cdb4e0e873292b749317dd4b97`（2026-11-20 读取）。
### 4.7 全链验收

**原始需求**：门红了还写成功；交付声明没证据；六组负例 0 次执行。来源：2026-11-19 对话。

**最初方案**：列六组负例；被否：历史 0 次执行，容易变成仪式。

**发散与被否**：
- A 手工六组负例：易仪式化，历史已证 0 次执行。否。
- B 只做回放：能防“该红变绿”，不碰声明。否。
- C 回放+声明对账+签字：能防假成功。选。

**调研**：
- 门结果只到 stdout，没有落盘对象；交接/收口都不读。
- 三种交付声明没有各自证据 ref；六组负例 0 次执行。
- T6/T16 失败六类：伪造原件、脚本代写、全标 fixed、`spec_analyze=null`、门红被解释、跨阶段改日志。
- 原件已失，只能复制 fixture 回放。
来源：`2026-11-19-p9-acceptance-design.md`、T6/T16 审计。

**最终决定**：选 C；案例带环境 hash；环境不符记“不可比”，不算通过；签字人≠作者。

**完整方案**：
- **门结果落盘**：每道门跑完写 `quality/evidence/gate-results/<stage>-<phase>.json`（命令、exit、stdout sha256、材料指纹、环境 hash、时点）；stdout 不再是唯一载体。
- **三种声明各绑一份证据**：`implemented` 读门结果 + `git diff`；`verified` 读门结果 + 测试回执；`accepted` 读 `verdict.json` + 签字指纹。声明缺对应证据 ref → `check-delivery-claims` exit 1。
- **签字与消费**：`verdict.json` 记签字人、被审材料指纹、结论；收口入口（`core/task-close.mjs`）必读 verdict 与 gate-results，且指纹=当前材料才允许收口；签后改材料 → 指纹不匹配 → 声明失效、需重签。
- **未读对账**：收口读回 gate-results 与 verdict 并记读回执；无读回执不得声明 `accepted`。
- `replay-cases.json`：输入 sha、目标检查器、期望退出码/缺口、环境 hash。
- `check-replay`、`check-delivery-claims`（三声明+签字）。
- 写集：`tools/cli/check-replay.mjs`、`tools/cli/check-delivery-claims.mjs`、`core/task-close.mjs`、`quality/evidence/replay-cases/`、`quality/evidence/gate-results/`；依赖包 5/6/9；消费者收口。

**配套与影响**：
- 配套调整：checkers/replay/verdict/claims。
- 配套迁移：旧 review 记录保留；新案例。
- 配套移除：六组负例、独立 check-verdict。
- 影响范围：收口、交付声明、签字。

**验收**：
- **AC-P7-1 门结果→声明→签字→消费**：命令 `node tools/cli/check-delivery-claims.mjs --task <task>`（未实现）。期望通过：三种声明各绑一条证据 ref；门结果已落盘且 status 可读；签字人≠作者；签字指纹=当前材料；收口有读回执。期望失败：门红仍写成功、声明缺证据、指纹不匹配、无读回执。反例三件：**门红仍写成功**（exit 1）、**签字后改材料**（指纹不匹配→声明失效）、**未读对账**（无读回执→不得声明 `accepted`）。证据：`verdict.json` + `gate-results/` + 读回执。观察者：验收 owner。时点：build-code 实现后。
  可跑性：`check-delivery-claims`/`gate-results` 未实现 → 未取得；owner=包 7。
- **AC-P7-2 历史回放可判**：命令 `node tools/cli/check-replay.mjs --cases quality/evidence/replay-cases/replay-cases.json`（未实现）。期望通过：每 case 期望红且 environment hash 匹配；夹具失败与目标红分开。期望失败/不可比：环境不符记“不可比”不算通过；夹具失败冒充目标红不通过。反例：替换夹具后转绿仍标“已回放”。证据：replay 输出 + 原件/夹具。观察者：验收 owner。时点：实现后。
- 对应决定/索引：D-008；AC 索引见 5.0。

**风险/回退**：原件已失；环境差异；签字独立性；回退保留原证据。

**未决/消费者/证据**：案例谁维护；收口消费；证据：`quality/evidence/research/2026-11-19-p9-acceptance-design.md`；sha256 `da2a3ffb84bcb619d14871c3ab844497f46154ebd224aa7e82cf3de4a2bc8d97`（2026-11-20 读取）。
### 4.8 测试数据

**原始需求**：测试默认用真实产品库；没有数据规划，磁盘/备份压力大。来源：2026-11-19 对话。

**最初方案**：建 P0.md/固定配额；被否：第二 owner，与 phase 模板冲突。

**发散与被否**：
- A 新建 P0.md：与现有 owner 冲突。否。
- B 本任务设第二 owner：重复控制面。否。
- C 复用现有 owner，只写四件事。选。

**调研**：
- `testing-system-blueprint` 已拥有每 Task 测试策略；`phase-template` 说准备不是 Phase；T13/T8 跳过准备。
- 真实库、临时目录、反复全量备份造成磁盘压力。
来源：`2026-11-19-test-data-audit.md`、`2026-11-19-test-db-lifecycle-audit.md`（**未取得：任务库与工作树均无此文件**；owner=测试数据 owner（包 8）；恢复条件=补交该审计原件并登记 sha，或经内容核对后改引真实存在的 `2026-11-19-test-data-audit.md`/`2026-11-19-resource-lifecycle.md` 对应段；未核对前不当作同一原件）。

**最终决定**：选 C；数据内容归测试标准 owner；build-plan 只写四件事；跨项目迁移记具名缺口。

**完整方案**：
- 四件事：数据来源/每 Task 上限、一条能重复跑的命令、版本/账本落后即失败、清理四问。
- 写集：`workflows/build-plan/SKILL.md`、`skills/testing-system-blueprint/SKILL.md` 的引用；依赖包 3；消费者 build-code。
- 不建 P0.md、不设第二 owner、不写固定配额。

**配套与影响**：
- 配套调整：build-plan/testing-system-blueprint。
- 配套迁移：旧测试库/数据保留；迁移格式。
- 配套移除：P0.md、固定配额、第二 owner。
- 影响范围：测试、磁盘、build-code。

**验收**：
- **AC-P8-1 build-plan 四件事齐**：人工核 phases 段（数据来源/每 Task 上限、一条能重复跑的命令、版本/账本落后即失败、清理四问）+ 命令 `node tools/cli/run-checks.mjs --material-root <path> --stage=build-plan`。期望通过：四件齐、errors=0。期望失败：缺项 → 具名缺口、版本落后不报、临时复制产品库。反例：没有数据段、命令不可重复跑。证据：Phase 文件 + run-checks 输出。观察者：测试数据 owner。时点：build-plan 后。
- **AC-P8-2 不碰产品库，跨项目记缺口**：命令 `git status --porcelain` + 测试运行日志。期望通过：无产品库副本/连接，测试数据按 blueprint 生成或复用标准数据集。期望失败：出现真实库连接或副本。反例：env 缺失回退产品库。跨项目迁移（建库/迁移/对账）不在本仓执行 → 具名缺口，owner=测试数据 owner，时点=跨项目任务。证据：运行日志。观察者：测试数据 owner。时点：实现后。
- 对应决定/索引：D-009；AC 索引见 5.0。

**风险/回退**：跨项目不能本仓验；数据大小；回退保留旧测试策略。

**未决/消费者/证据**：迁移范围/备份保留 N/水位阈值（用户定）；build-code 消费；证据：`quality/evidence/research/2026-11-19-test-data-audit.md`；sha256 `f41f8bcbea2ac42b5a28177e86f97c661bec7d02d424e060e4dcc3041d6c4301`（2026-11-20 读取）。
### 4.9 收口与知识图谱

**原始需求**：归档漏、授权不够、图全量重抽、失败挡收口。来源：2026-11-19 对话。

**最初方案**：一条 push 授权/图全量重抽；被否：覆盖不了两次推送，图太贵。

**发散与被否**：
- A 一条 push 授权：覆盖不了 push-task+push。否。
- B 两条记录、一次用户授权：能覆盖。选。
- C 图全量重抽：太贵，失败挡收口。否。

**调研**：
- `core/task-close.mjs` 归档在 merge 后；`check-specs-archive` 未建。
- 图 28.7MB、65% 文档节点、60% 归档；复制图造成 100MB+；全量更新 34 分钟。
来源：`2026-11-19-close-order-audit.md`、`graph-update-audit.md`。

**最终决定**：选 B；归档先于提交；图分阶段更新；包 10 做完整验收。

**完整方案**：
- 归档顺序：检查 archive、`git add -A`、整目录 `git mv`、同一 commit、push-task、push；两条记录。
- 图：handoff 增量更新本阶段文档；close 只更新代码；失败记“未更新”，不挡收口。
- 数字口径：28.7MB/34 分钟是 workflowhub 2026-11-19 实测；120MB/63.6 分钟/3349 文件是 PaperBuilder 旧数据，不混用。
- 写集：`core/task-close.mjs`、`tools/cli/check-specs-archive.mjs`、`skills/stage-close/SKILL.md`、`skills/knowledge-graph/SKILL.md`；依赖包 5/8；消费者下一个任务/收口。

**配套与影响**：
- 配套调整：task-close/check-specs-archive/graph。
- 配套迁移：旧归档/图保留；增量。
- 配套移除：图提交前更新、全量重抽、每 worktree 副本、永久例外表。
- 影响范围：收口、下一个任务、图。

**验收**：
- **AC-P9-1 归档与提交同一次完成**：命令 `node tools/cli/check-specs-archive.mjs --task <task-id>`（未实现）+ `git log -1 --name-status`。期望通过：archive 存在且源不存在、同一 commit 含整目录移动、两条推送记录、移动前后内容对账一致。期望失败：手删源目录、逐文件移动、merge 后才归档、目录存在但内容不全。反例：**手删源目录 + 归档目录存在** → 必须失败（内容对账/移动记录不一致）。证据：命令输出 + commit 记录。观察者：收口 owner。时点：build-code 实现后。
- **AC-P9-2 图三态且不挡收口**：人工/命令：handoff 文档图回执、close 代码图回执；三态 `已更新`/`无变化`/`未更新`。期望通过：回执存在且三态明确，图失败记“未更新”仍完成收口。期望失败：图失败挡收口、`无变化` 读成“已更新”。反例：图超时后收口未完成。证据：回执 + 图命令 stdout。观察者：收口 owner。时点：实现后。
- 对应决定/索引：D-009；AC 索引见 5.0。

**风险/回退**：源目录被手删会假过；分支/merge 顺序；图滞后一个阶段；回退保留原归档和图。

**未决/消费者/证据**：迁移范围/备份 N；下一个任务消费；证据：`quality/evidence/research/2026-11-19-close-order-audit.md`；sha256 `555d58838b4ddac0abd12531ed9dd2a6e542caaef5fcf7199f24a8451d2a9f6f`；`quality/evidence/research/2026-11-19-graph-update-audit.md`；sha256 `ad6c9e2d74d03eaf6d629f312f20e1ad26608813bdb6071b47ee3d1a2c75284d`（2026-11-20 读取）。
### 4.10 decision-log 优化

**原始需求**：日志太薄，只有九包骨架、决定、包表；build-plan 需要的背景、调研、方案、接口、写集、验收、风险都丢了。

**最初方案**：加 10 段/加厚主文，把每包设计直接写进主文。被否：没有先设计整份日志结构，10 段会和包目录/决定记录重复；也没有解决“哪些该外置”。

**发散与被否**：
- A 加厚主文：最好读，主文长、维护低。否。
- B 主文决定+附件：完整，但依赖必读。部分选。
- C 按 build-plan 输入倒排：一次性成本高，长期最稳。选 C 定契约，B 做载体，加完整性检查。

**调研**：
- 内部审计：根因排序流程 30%、技能 25%、9 包合并 20%、模板 15%、material-writing 10%；模板本身有 11 列/十格卡/写集表/验收面，但被当“索引/摘要”，我们只填了 3 块。
- 外部：ADR/RFC/Design Doc 的必需字段；只写决定+指针丢理由/备选；主文留必需字段，过程外置。
- 字段映射：方向/非目标/包级依赖/风险够用；验收只有草案；代码锚点/接口/写集/RED/GREEN/oracle/证据为零。
来源：`2026-11-19-dl-build-plan-input-audit.md`、`2026-11-19-dl-external-research.md`（**未取得：任务库中不存在该文件**；owner=日志/调研负责人；恢复条件=补交原件并登记 sha，或改引 `2026-11-19-dl-build-plan-input-audit.md` 的外部格式段）、`2026-11-19-dl-buildplan-input-map.md`（**未取得：任务库中不存在该文件**；owner=日志/调研负责人；恢复条件=补交字段映射原件并登记 sha，或把映射改引 `2026-11-19-dl-build-plan-input-audit.md` 的字段映射段）。

**最终决定**：
- 日志六段：入口、需求与确认、包目录、每包设计、跨包共享、证据索引。
- 每包十项，每项带设计历程：原始需求、最初方案、发散与被否、调研、最终决定、完整方案、**配套与影响**、验收、风险/回退、未决/消费者/证据。
- 验收在包内，用 `AC-P<包号>-<序号>` 编号；包 10 做完整验收。
- 新模板按这个结构改，唯一模板文件是 v2；更新规则归技能，不写进日志。

**完整方案（新模板）**：
1. 文件：`skills/decision-log/templates/decision-log-template-v2.md` 按六段重排；保留 11 列表、十一格卡、决定四字段、写集表、验收面，作为每包十项的载体，不另造一套。旧模板 `decision-log-template.md` 保持只读，不再改造。
2. 每包十项及必填内容：
   - **原始需求**：问题是什么，不带方案；来源。
   - **最初方案**：一开始想怎么做；谁否、为什么。
   - **发散与被否**：至少 2 个备选，含 1 个被否；取舍、代价。
   - **调研**：事实、假设、来源；哪些改变方向；原始材料外置+ref。
   - **最终决定**：选了什么、为什么、代价；跨包决定给编号。
   - **完整方案**：接口（签名、失败语义、消费者）、数据/状态、写集（文件/符号）、依赖、顺序、流程。
   - **配套与影响**：配套调整、配套迁移、配套移除、影响范围；四项各自看下一节。
   - **防再发（build-plan 审查后）**：
- baseline 对 14 条需求全命中，不只 3 条；每条有 AC 或“已声明不做”。
- 并入 AC-P10-001；owner 日志作者；时点 build-plan 收口前。
**验收**：AC 号、命令、期望、反例、owner/时点；最后包做完整验收。
   - **风险/回退**：触发、后果、缓解、回滚。
   - **未决/消费者/证据**：谁定、下游谁读、ref+sha。
3. 包目录：像目录，一行一个包；只导航，不重复内容。
4. 验收：每包都有“怎么验收”；最后包有“完整验收”节；不设跨包验收表，只在 5.0 做 AC 索引。
5. build-plan 消费映射：spec 用入口+跨包+每包设计；phases 用每包验收/写集/依赖/风险；task 卡用验收命令/反例/RED-GREEN/证据。
6. 完整性检查：`validate-decision-log`（build-code 实现）逐包核十项；缺项记具名缺口+owner。
7. 迁移：v1→v2；旧 12 包段落只作素材，原件在 `quality/evidence/archive/decision-log/2026-11-19-decision-log-v1-original.md`；10 包目录；不覆盖 v1。
8. spec-analyze/build-plan 对账表定义（文本先行，脚本后到）：
   - A 表（make-decision 第 13 步）：需求 → 包 → 决定 → 验收 → 缺口 owner；由 spec-analyze 新增 caller 执行；本轮交付物 = 需求索引 §1 的 14 行。
   - B 表（build-plan 第 6 步末）：包 → Phase → 需求 → 依赖/独立交付 → 缺口 owner；只做粗查，不查接口/写集/AC 细节。
   - C 表（第 10 步审查后）：decision-log 十项 → spec/phases 落点；findings 闭合；只列被触及行；不一致记 owner。
   - 检查是静态对号报告，不是新 gate；C 作 wh-review 输入，不替代审查。

**配套与影响**：
- **配套调整**：`skills/material-writing/SKILL.md` 模板例外块声明“每包十项是记录节”（不改十一条）；方向审查 `workflows/make-decision/SKILL.md:14` 与 `skills/wh-review/scripts/review-materials.mjs` 的 alternatives 必含“最初方案+谁否+为什么”；细节审查 `make-decision` 第 10 步与 `review-materials.mjs` 各加“逐包核十项”；build-plan `skills/spec-plan/scripts/build-decision-baseline.mjs` 收每包设计、`workflows/build-plan/SKILL.md` 核“spec/phases 是否消费接口/写集/验收/风险”；包 3 的十项定义改引 v2 模板，不再引 `skills/decision-log/SKILL.md` 作唯一来源；索引/覆盖矩阵消费者改读 10 包。
- **配套迁移**：v1→v2；旧 12 包与旧 9 包行只作素材，逐项迁到现十包（需求索引 §0/§1/§3）；迁移失败回退保留 v1 指针，不改写历史。
- **配套移除**：旧模板改造方案（不再改 `decision-log-template.md`）；旧 69 个 AC 槽位与索引空槽（由 `AC-Pn-x` 取代）；包 3 对 `skills/decision-log/SKILL.md` 的“唯一十项来源”声明（改指 v2 模板）。退役对象保留原文件可回读，不删原件。
- **影响范围**：build-plan 作者、审查者、baseline；包 1–9 的验收/写集由 5.0 AC 索引串起；四查/覆盖矩阵/链检查的读取口径。不在本包处理的脚本实现（`validate-decision-log`、B/C caller、链检查扩列）→ build-code，owner=包 10，时点=实现后。

**验收**：
- **AC-P10-1 日志十项与索引 14 条**（本轮可核）：命令 `node tools/cli/check-decision-log-chain.mjs --file <log>` + 人工逐包核。期望通过：10 包十项齐；索引 14 条各有原文 ref、sha256（或未取得+owner）、答复位置与旧 R 映射；缺项有具名 owner。期望失败：仍是旧 9 包口径、AC 空槽、无答复位置。反例：设计历程被压成“已决定”。证据：本日志 + 需求索引 §1/§2.1。观察者：日志 owner。时点：本轮。
- **AC-P10-2 A 表**（本轮交付）：人工/文本：需求索引 §1 有 14 行（需求 → 原文 ref+sha → 答复位置 → 包 → 决定 → AC → 缺口）。期望通过：无空行、每行可回读。期望失败：需求只在合并句出现、A 表仍用旧 9 包。反例：A 表填旧 AC 槽位。证据：索引 §1。观察者：独立审查者。时点：make-decision 第 13 步。
- **AC-P10-3 B/C 表**（设计已交、实施后验）：build-plan 第 6 步末粗查（包/需求→Phase/依赖/独立交付）、第 10 步审查后细查（十项 vs spec/phases、findings 闭合）；命令 `node skills/spec-plan/scripts/build-decision-baseline.mjs --task <task>` + 人工。期望通过：B 行齐、C 覆盖十项与 findings。期望失败：Phase 与包对不上、标 fixed 但 diff 里原断言还在。反例：需求只在合并句。证据：baseline 输出 + C 表。观察者：build-plan 作者 + 独立审查者。时点：build-plan 后（当前不写成已验）。
- **AC-P10-4 合同测试**（设计已交、实施后验）：命令 `npx vitest run tests/contract/spec-analyze-classes.test.mjs tests/contract/decision-evidence-consumption.test.mjs tests/contract/review-decision-baseline.test.mjs tests/contract/review-materials-contract.test.mjs`。期望通过：exit 0。期望失败：任一失败 → build-code 修。反例：baseline 跑本日志仍 exit 1。证据：测试输出。观察者：日志 owner。时点：build-code 实现后。
> A 表恢复条件（2026-11-20 补，P10 F14）：需求 8、11–14 的恢复条件已逐条落在 `quality/evidence/decision-log-refs/requirement-index.md` §1 对应行；本日志不复制 A 表行。
- **A/B/C 与包 7/9/10 时序**：当前（make-decision 收口）**只做 A 表**；B 表在 build-plan 第 6 步末；C 表在第 10 步审查后。顺序是：包 7 交红证明/回放/三声明对账/签字结果 → 包 9 据此收口并交归档/图回执 → 包 10 用 A/B/C + 包 7/9 产物做最终签收。A/B/C 的验收一律写“设计已交、实施后验”，不写成当前已验。
- 对应决定/索引：D-010；AC 索引见 5.0。

**风险/回退**：主文变长；包目录与正文重复；引用过期；回退保留 v1，按 v2 逐包补。

**未决/消费者/证据**：模板改动何时落 build-code（owner=包 10，时点=实现后）；build-plan 消费；证据：`quality/evidence/research/2026-11-19-dl-build-plan-input-audit.md`；sha256 `5254825fa29434b0c0309a324935c1cc1ed5d9ec021df5a705fbd4eb11dadc0e`；`quality/evidence/decision-log-refs/requirement-index.md`；sha256 `152ffd214bc959edc2e355de4dd7940cc9d555bd0a1f2becfa6b9d758b8323ee`（A 表 14 行与恢复条件；2026-11-20 读取）；另见 5.4。

## 5. 跨包共享

**共享接口**：`facts.jsonl`（加载事件、确认/回执、阶段游标）；`reading_baseline`（技能字节+sha）；`status-model.json`（页面唯一来源）；`replay-cases.json`（回放案例）；`validatePostPhaseContract`（开工就绪）；`check-stage-quality --report`（写集）。

**数据约定**：任务材料在 `specs/<task>/`；证据在任务库 `quality/evidence/`；答复在 `decision-log-refs/talk/`；审查在 `quality/reviews/`；页面在 `quality/evidence/cockpit/`。

**依赖顺序**：1 → 2 → 3 → 8 → 4 → 5 → 6 → 9 → 7 → 10。7 消费 5/6/9 的红证明；10 最后，因为它要审整份日志和全部包。

**跨包风险**：子代理成本（包 3 限 3 个）；跨项目命令（包 4/8 记缺口）；补记 U（包 2 最终确认前替换或降级）；T6/T16 原件已失（包 7 用 fixture，环境不符记不可比）；页面旧模板迁移（包 6）。

**全局未决**：见 5.3 表（每项有 owner 与时点）。

### 5.0 验收（AC）总表

本表只做索引：判据、反例与观察者以各包第 7 项为准，不替代包内验收，也不新增验收面或 gate。
“可跑性”说明当前能不能跑；不能跑的写 build-code 的 owner、命令与时点。

| AC | 包 | 命令或人工操作 | 期望通过 | 期望失败 | 反例 | 证据路径 | 观察者 / 时点 | 决定 | 可跑性 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-P1-1 | 1 | `node tools/cli/check-stage-steps.mjs --stage=<stage>` | exit 0；本次事件 + 材料/检查齐 | 缺项→unknown；检查非 pass→failed/非 0 | 旧事件冒充本次、0 子技能、自写 complete | `quality/tests/2026-11-19-p1-stage-steps.txt` | 运行时 owner / 实现后 | D-002 | 可跑，行为待实现 |
| AC-P1-2 | 1 | 人工：宿主根 `ls` + 读 `reading_baseline` | 新会话可见；baseline 有 bytes+sha | 只装 repo 根；baseline 无 sha | 装 repo 根别的项目看不到 | 安装根记录 + baseline 输出 | 运行时 owner / 实现后 | D-002 | 可跑（人工） |
| AC-P2-1 | 2 | `git cat-file -e <blob>`（逐条 ref）+ `shasum -a 256` | blob 在；行号相对 blob；sha 一致 | 自引用/行漂移 → 重核并记新 ref | 补记当当时原件 | `decision-log-refs/` 确认回执 | 材料 owner / 本轮 | D-003 | 可跑 |
| AC-P2-2 | 2 | build-plan 起始读回执 + `node tools/cli/check-decision-log-chain.mjs --file <log>` | 读回执存在且 blob 一致 | 回执在但下游未读 → `incomplete` | 摘要代替 ref；build-plan 改日志 | facts 回执 + 链检查输出 | 独立审查者 / build-plan 后 | D-004 | 部分可跑 |
| AC-P3-1 | 3 | `node skills/decision-maker/scripts/validate-card.mjs <card.md>` | exit 0；3 份回传 + 冷读/对抗原件 | 缺格/缺审查 → exit≠0 | 只有卡没审查；主会话兼写兼审 | `decision-log-refs/` 卡与回传 | 技能 owner / 实现后 | D-001 | 未实现 |
| AC-P3-2 | 3 | 人工：十包逐包 talk（提问工具），答复落 `talk/` | U-021 明确全部确认；历史答复按旧包映射 | 无答复包 → 未取得 | U-019 一次整体确认代逐包 | 索引 §2.1 + `talk/` 原件 | 主会话 + 审查者 / 用户已答 | D-001 | 已确认 |
| AC-P4-1 | 4 | `node tools/cli/run-checks.mjs --material-root <path> --stage=build-plan`（执行者=build-code 首步） | 五列齐；机器项全 pass；facts 六字段行齐 | missing/stale/failed → exit≠0 并停首步 | 表合法但数据库权限探针失败 | run-checks stdout + facts 行 | 计划 owner / 实现后 | D-005 | 可跑基线 |
| AC-P4-2 | 4 | 人工：build-code 首步日志 + `git status --porcelain` | 红就绪 → exit≠0 且无写集内改动 | 红仍开写 | 预置红就绪仍进入实现 | 首步日志 + status | 独立审查者 / 实现后 | D-005 | 未实现 |
| AC-P5-1 | 5 | `node tools/cli/check-stage-quality.mjs --report <phase>` + 人工核分诊行 | 每两轮一行分诊；同锚无新证据未原样修 | 16 轮无分诊；原样硬修；改测试 | 同故障只换行号；换夹具转绿 | Phase 文件 + `--report` 输出 | 独立审查者 / 每 Phase | D-006 | 部分可跑 |
| AC-P5-2 | 5 | `git diff --name-only <base>..HEAD` | 测试/AC 无改动或每处有具名裁决 | 实现者改测试/AC；写集漂移 | 标 fixed 但 diff 里原断言还在 | diff 原文 | 独立审查者 / 每 Phase | D-006 | 可跑 |
| AC-P6-1 | 6 | `build-page-data.mjs` → `render-answer-page.mjs --model` → `check-page-content.mjs` | 10 包/级别/验收；契约错 0；指纹含 `phases/*` | 契约错仍发布；只改 phases 不判过期 | 只改 `phases/P1.md` 页面仍“未过期” | 页面 + 三命令 stdout | 页面 owner / 实现后 | D-007 | 部分可跑 |
| AC-P6-2 | 6 | 人工/浏览器：phase 与 facts 对照；旧页标过期 | stage 与 facts 一致；失败保留旧页并标过期 | 显示旧“写计划”；失败仍当新页 | 旧页未标过期仍被读 | 截图/DOM（不可用记 unavailable） | 用户 + 页面 owner / 实现后 | D-007 | 环境受限 |
| AC-P7-1 | 7 | `node tools/cli/check-delivery-claims.mjs --task <task>` | 三声明各绑证据；指纹=材料；有读回执 | 门红写成功、签后改材料、未读对账 | 同上三件 | `verdict.json` + `gate-results/` + 回执 | 验收 owner / 实现后 | D-008 | 未实现 |
| AC-P7-2 | 7 | `node tools/cli/check-replay.mjs --cases <replay-cases.json>` | 每 case 期望红且 env hash 匹配 | 环境不符记“不可比”；夹具失败冒充目标红 | 换夹具转绿仍标已回放 | replay 输出 + 原件/夹具 | 验收 owner / 实现后 | D-008 | 未实现 |
| AC-P8-1 | 8 | 人工核 phase 段 + `run-checks --material-root --stage=build-plan` | 四件齐；errors=0 | 缺项；版本落后不报 | 无数据段；命令不可重复跑 | Phase 文件 + stdout | 测试数据 owner / build-plan 后 | D-009 | 部分可跑 |
| AC-P8-2 | 8 | `git status --porcelain` + 测试运行日志 | 无产品库副本/连接 | 出现真实库连接或副本 | env 缺失回退产品库 | 运行日志 | 测试数据 owner / 实现后 | D-009 | 部分可跑 |
| AC-P9-1 | 9 | `node tools/cli/check-specs-archive.mjs --task <task-id>` + `git log -1 --name-status` | archive 在、源无、同 commit、两 push、内容对账 | 手删源；逐文件移动；merge 后归档 | 手删源目录 + 归档存在 | 命令输出 + commit 记录 | 收口 owner / 实现后 | D-009 | 未实现 |
| AC-P9-2 | 9 | 人工/命令：handoff 文档图、close 代码图回执 | 三态明确；失败不挡收口 | 图失败挡收口；无变化读成已更新 | 图超时后收口未完成 | 回执 + 图 stdout | 收口 owner / 实现后 | D-009 | 未实现 |
| AC-P10-1 | 10 | `node tools/cli/check-decision-log-chain.mjs --file <log>` + 人工 | 10 包十项齐；索引 14 条 ref+sha+答复位置 | 9 包口径；AC 空槽；无答复位置 | 设计历程压成“已决定” | 本日志 + 索引 §1/§2.1 | 日志 owner / 本轮 | D-010 | 可跑 |
| AC-P10-2 | 10 | 人工/文本：索引 §1 的 14 行 | 无空行；每行可回读 | 需求只在合并句出现 | A 表仍填旧 AC 槽 | 索引 §1 | 独立审查者 / 第 13 步 | D-010 | 可跑 |
| AC-P10-3 | 10 | `build-decision-baseline.mjs --task <task>` + 人工（B/C） | B 行齐；C 覆盖十项与 findings | Phase 与包对不上；标 fixed 但断言还在 | 需求只在合并句 | baseline 输出 + C 表 | 作者 + 审查者 / build-plan 后 | D-010 | 实施后验 |
| AC-P10-4 | 10 | `npx vitest run tests/contract/spec-analyze-classes.test.mjs tests/contract/decision-evidence-consumption.test.mjs tests/contract/review-decision-baseline.test.mjs tests/contract/review-materials-contract.test.mjs` | exit 0 | 任一失败 → build-code 修 | baseline 跑本日志仍 exit 1 | 测试输出 | 日志 owner / 实现后 | D-010 | 实施后验 |

| AC-P3-3 | 3 | 人工：派发 brief、实际读取记录、提问回执 | 少读、及时汇报、选项+后果+风险齐全 | 黑箱派发、代答、术语当说明 | talk + facts + 派发 brief | 独立审查者 / 实现后 | D-001 | 部分可跑 |
| AC-P10-5 | 10 | 人工：根因表 + 证据 | 根因排序、证据、落包 | 只列现象、无排序 | 根因表 + 原件 | 日志 owner / build-plan 后 | D-010 | 未实现 |
| AC-P10-6 | 10 | 人工：material-writing 技能 + 样例 | 十项作为记录节保留 | 普通写作规则压掉设计历程 | 技能字节 + 样例 | 日志 owner / 实现后 | D-010 | 未实现 |
| AC-P10-7 | 10 | 人工：10 包配套四项表 | 10/10 四项齐 | 只有 P3 有、其余缺 | 10 包卡 + 表 | 日志 owner / build-plan 后 | D-010 | 部分可跑 |
| AC-P10-8 | 10 | `build-decision-baseline.mjs` + 消费者测试 | A 现在可核；B/C 实施后验 | B/C 未实施却标通过 | baseline 输出 + 测试 | 日志 owner / build-code 后 | D-010 | 未实现 |
### 5.0.1 build-plan 审查后 AC 回填（2026-11-20）

本节是对 5.0 旧行的补充，不删除旧行；冲突时以本节和 spec Appendix A 为准。

- **AC-P2-2 扩展**：清单缺引用/不可读/越界/错包/旧清单 → 判失败，不再“仍判当前通过”。
- **AC-P3-1 扩展**：卡验收格必须有通过/失败/至少一个反例；同一段并存通过/失败判失败。
- **AC-P3-2 扩展**：U-021 确认现十包 + 历史缺口 owner/时点 + U-022 接受转写即通过，不要求补齐历史原件。
- **AC-P5-2 扩展**：gate_cmd 裸变量、写集派生件（catalog→repo-skills.manifest.json）、AC 与写集范围、14 条需求对账；缺项具名。
- **AC-P8-2 扩展**：只证 fixture 级隔离；真实测试入口与配置解析者写具名缺口（owner/命令/时点），不声称已证。
- **AC-P10-1 扩展**：baseline 对 14 条需求全命中，不只 3 条；缺项具名 owner/时点。
- **新增 AC-P3-3**：主会话少读、及时汇报、提问工具、大白话选项。
- **新增 AC-P10-5**：根因排序有可回读证据并落到当前材料。
- **新增 AC-P10-6**：material-writing 把每包十项接纳为记录节。
- **新增 AC-P10-7**：十包各有配套调整/迁移/移除/影响范围。
- **新增 AC-P10-8**：A/B/C 三表在实施后由真实消费者验证（当前 incomplete）。

### 5.1 退役/不建清单

- 不建：`check-repair-log`、独立 `check-verdict`、试点段、`P0.md`、第二 owner、永久例外表、每 worktree 图副本。
- 退役：旧 69 个 AC 位、旧索引 AC 位、图在提交前更新、全量图重抽、旧 12 包验收单位。
- build-plan 不得把这些重新规划成新机制。

### 5.2 决定索引

| 决定 | 内容 | 落点 |
| --- | --- | --- |
| D-001 | 12 包合并为 9 包，另加第 10 包；每包 3 角色 | 包 3/10 |
| D-002 | 技能安装只做安装、可发现、加载事件 | 包 1 |
| D-003 | 证据只认原件，补记标注 | 包 2 |
| D-004 | 交接用不可变引用+开放问题 | 包 2 |
| D-005 | 开工就绪放 build-plan，现有校验器 | 包 4 |
| D-006 | 修复循环每两轮按严重程度判断 | 包 5 |
| D-007 | 页面用状态模型，三道门 | 包 6 |
| D-008 | 全链验收=红证明+回放+对账+签字 | 包 7 |
| D-009 | 测试数据复用现有 owner；收口+图分阶段 | 包 8/9 |
| D-010 | decision-log 六段/每包十项/v2 模板 | 包 10 |

以下四字段每个决定只写一次，别处只引编号。

#### D-001 12 包合并为 9 包并另加第 10 包

- **做什么**：12 包合并为 9 包，另加第 10 包（decision-log 优化）；每包 3 角色；主会话唯一 writer；日志六段、每包十项。
- **不做什么**：不按旧 12 包做验收单位；不新开第二份日志；不把旧包答复当现包逐包确认。
- **风险**：旧包答复与新包设计不是一一对应，逐包确认可能缺失；缓解：索引 §2.1 逐包写“未取得+owner”，不冒充已确认。
- **改动**：`specs/<task>/decision-log.md`（本文件）、`quality/evidence/decision-log-refs/requirement-index.md`；包 3/10；writer=主会话。

#### D-002 技能安装只做安装、可发现、加载事件

- **做什么**：装到配置宿主根并记录实际根；步骤入口写 `{stage, step, skill_path, sha256, bytes, at}` 到 facts；完成门读事件/材料/检查三样。
- **不做什么**：不做宿主注入/回执/拒绝，不反转 ADR-0024；v1 不启用跳过。
- **风险**：事件只证明文件被读、不证明理解；不同宿主根可能不同；缓解：缺事件记 unknown，回退到只安装并记缺口。
- **改动**：`tools/cli/check-stage-steps.mjs`、`runtime/stage/` 步骤入口、`reading_baseline` 读取处；writer=运行时 owner。

#### D-003 证据只认原件，补记标注

- **做什么**：证据只收原始件，补记标“不是当时原件”；同一事实同字节只留一份。
- **不做什么**：不把摘要/转录当原件；不复制原件造第二账本。
- **风险**：旧任务补记多、原件缺；缓解：缺失写未取得+owner，其余安全工作继续。
- **改动**：`quality/evidence/`、`facts.jsonl`；writer=材料 owner。

#### D-004 交接用不可变引用加开放问题

- **做什么**：交接清单用 `commit:path` 加 blob id；行号相对 blob；确认哈希与读回执入 facts。
- **不做什么**：不造第二份证据账本；不用工作树路径当 ref。
- **风险**：行号随 blob 变、旧任务要例外；缓解：读时按 blob 核，旧任务保留旧交接。
- **改动**：`specs/<task>/decision-log.md`、`quality/evidence/`、`facts.jsonl`；writer=材料 owner。

#### D-005 开工就绪放 build-plan 并前移现有校验器

- **做什么**：phase 模板加“开工就绪”五列表；`validatePostPhaseContract` 在 build-code 首步执行，结果落 facts，missing/stale/failed 即停。
- **不做什么**：不建新命令、不设第二 owner、不把就绪表当质量结论。
- **风险**：探针成本、材料漂移；跨项目命令本仓不能验；缓解：人判项只记未核实，跨项目记缺口。
- **改动**：`skills/spec-plan/templates/phase-template.md`、`skills/spec-plan/SKILL.md`、`workflows/build-plan/SKILL.md`、`tools/cli/stage-runtime.mjs`、`tools/cli/run-checks.mjs`、`runtime/stage/stage-content-contracts.mjs`；writer=计划 owner。

#### D-006 修复循环每两轮按严重程度判断

- **做什么**：每两轮做一次严重程度判断；阻塞/高风险必须分诊；同锚连续两轮无新证据禁止原样修；验收标准冻结 hash。
- **不做什么**：不设固定轮数上限；不因轮数自动停止；不允许改测试或验收标准。
- **风险**：分诊有偏见；缓解：独立审查者判断，保留失败原件。
- **改动**：`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、Phase 文件；writer=阶段 owner。

#### D-007 页面用状态模型加三道门

- **做什么**：流程产出状态模型，渲染器只渲染；结构/指针/计数加指纹三道门；指纹输入含 `phases/*`；级别规则写死。
- **不做什么**：不再修自由文本解析器；不新增路由或视觉重做；模型失败不出页。
- **风险**：模型 schema 维护、旧页迁移；缓解：旧页重渲染并标过期，回退保留旧页。
- **改动**：`skills/answer-as-page/` 脚本与模板、`quality/evidence/cockpit/overview.html`；writer=页面 owner。

#### D-008 全链验收等于红证明加回放加对账加签字

- **做什么**：门结果落盘；三种交付声明各绑证据；`verdict.json` 记签字人与被审指纹；收口读 verdict 与 gate-results。
- **不做什么**：不设新 gate；不让作者自签；环境不符不算通过。
- **风险**：T6/T16 原件已失、环境有差异；缓解：fixture 回放并标不可比，保留原失败。
- **改动**：`tools/cli/check-replay.mjs`、`tools/cli/check-delivery-claims.mjs`、`core/task-close.mjs`、`quality/evidence/replay-cases/`、`quality/evidence/gate-results/`；writer=验收 owner。

#### D-009 测试数据复用现有 owner 且收口与图分阶段

- **做什么**：build-plan 写四件事；测试数据复用 `testing-system-blueprint`；归档先于提交、整目录 `git mv`、同一 commit；图分 handoff/close 两阶段，失败不挡收口。
- **不做什么**：不建 P0.md、不设第二 owner、不写死配额；不全量重抽图。
- **风险**：跨项目迁移不能本仓验；源目录被手删会假过；缓解：内容对账加具名缺口。
- **改动**：`workflows/build-plan/SKILL.md`、`skills/testing-system-blueprint/SKILL.md`、`core/task-close.mjs`、`tools/cli/check-specs-archive.mjs`、`skills/stage-close/SKILL.md`、`skills/knowledge-graph/SKILL.md`；writer=测试数据/收口 owner。

#### D-010 decision-log 六段加每包十项加 v2 模板

- **做什么**：六段结构；每包十项（含配套与影响）；验收用 AC 编号；唯一模板是 `skills/decision-log/templates/decision-log-template-v2.md`。
- **不做什么**：不改旧模板；不建第二套记录；不把脚本实现写成本轮已验。
- **风险**：主文变长、引用过期；缓解：包目录只导航，证据索引留 ref+sha。
- **改动**：`skills/decision-log/templates/decision-log-template-v2.md`、`specs/<task>/decision-log.md`、`quality/evidence/decision-log-refs/requirement-index.md`；writer=日志 owner。

### 5.3 全局未决

| 未决 | 来源/影响 | 状态 | 谁定、时点 |
| --- | --- | --- | --- |
| 跨项目迁移范围 | 包 8；R-020、D-050 | open | 用户；build-plan 前 |
| 备份保留 N | 包 8；D-050 | open | 用户；build-plan 前 |
| 磁盘水位阈值 | 包 8；D-052 | open | 用户；build-plan 前 |
| 机器项/人判项怎么分 | 包 4；D-005 | open | 用户 + 计划 owner；build-plan 前 |
| 页面模型 schema 谁定 | 包 6；D-007 | open | 页面 owner；build-code 前 |
| 严重程度判断人 | 包 5；D-006 | confirmed | 独立审查者；每 Phase |
| 最终签字人 | 包 7；D-008 | open | 用户；最终确认前 |
| 页面截图是否必须 | 包 6；AC-P6-2 | open | 用户；build-code 前 |
| 回放案例维护人 | 包 7；D-008 | open | 验收 owner；build-code 后 |
| 宿主根清单谁维护 | 包 1；AC-P1-2 | open | 运行时 owner；实现后 |
| 卡校验字段清单 | 包 3；AC-P3-1 | open | 技能 owner；实现前 |
| 旧 6 条 blocking“已修”的 v2 复验 | 2.4；审查 006 | open（复验未取得） | make-decision 主会话；build-plan 前 |
| 两份缺失调研原件（包 3/10 依据） | 6.2；审查 008 | open（原件未取得） | 证据 owner；最终确认前 |
| 十包现行设计的逐包确认 | 2.6；索引 §2.1 | open（均未取得） | 用户；build-plan 前 |
| 需求 11–14 答复原件 | 索引 §2.1 | open（未取得） | 主会话/用户；build-plan 前 |
| T6/T16 原件已失 | 包 7；AC-P7-2 | deferred | 验收 owner；fixture 回放，环境不符记不可比 |
| 跨项目命令（建库/迁移/对账） | 包 4/8 | deferred | 测试数据 owner；跨项目任务 |

### 5.4 上一轮 G-01..G-30 处置

每条对到现行包、决定与 AC；“无法重放/已退役/跨项目/延期”都写恢复条件或 owner。

| G | 未实现项（压缩） | 现包 | 现行决定/落点 | AC | 处置 | 恢复条件/owner |
| --- | --- | --- | --- | --- | --- | --- |
| G-01 | 12 条 AC 无独立通过判定 | 5 | 验收判定与具名观察者 | AC-P5-1 | 本轮可核（AC 已编号） | build-code 后逐条跑；阶段 owner |
| G-02 | 三任务回放全 ENOENT | 7 | 原件改指 `RAW/prior-*.md` | AC-P7-2 | 需恢复条件 | 原件不可恢复 → fixture 回放；验收 owner |
| G-03 | 九张历史页逐字段对比未执行 | 6 | 历史页对照 | AC-P6-2 | 延期 | 需历史页快照；页面 owner |
| G-04 | 环 6 写集 null 与索引 18 条不一致 | 6 | 旧页数据退役 | AC-P6-1 | 已退役（旧页重渲染） | 旧页只读；页面 owner |
| G-05 | 页面“结束/ended”状态取不到 | 6 | 状态投影 | AC-P6-2 | 需恢复条件 | 需真实 ended 任务样本；页面 owner |
| G-06 | 测试节点未按命令聚合 | 6 | render 测试区 | AC-P6-1 | 本轮可核（需页面） | 实现后跑三道门；页面 owner |
| G-07 | 200% 缩放/键盘/导航未观察 | 6 | 浏览器观察 | AC-P6-2 | 延期 | 需可用浏览器环境；页面 owner |
| G-08 | AC-009 六组负例一次未跑 | 7 | 回放案例 | AC-P7-2 | 需恢复条件 | 原件已失 → fixture；验收 owner |
| G-09 | 真实聊天回执未取得 | 2 | 答复原件绑定 | AC-P2-1 | 延期 | 需真实 ask 回执；主会话 |
| G-10 | P8 用替代 oracle（原基线自绿） | 7 | oracle 独立持有 | AC-P7-2 | 需恢复条件 | 需独立 oracle；验收 owner |
| G-11 | P10 写集外改动未裁决 | 5 | 写集核账 | AC-P5-2 | 本轮可核 | diff + 具名裁决；独立审查者 |
| G-12 | P11 修后未再送独立审查 | 7 | 审后复验 | AC-P7-1 | 需恢复条件 | 新审查记录；审查者 |
| G-13 | 收敛台账机检走不到 | 2 | `check-stage-steps` 收敛台账 | AC-P2-2 | 需实现 | 实现后机检；运行时 owner |
| G-14 | P5 两条低残留 | 5 | 检查器与对应用例 | AC-P5-1 | 本轮可核 | 修后复跑；阶段 owner |
| G-15 | 四文件门禁常红 | 7 | 门禁夹具 | AC-P7-1 | 需恢复条件 | 修 `checkout -B` 撞主工作树/缺 `verify-code`；build-code |
| G-16 | 页面路径无唯一规范 | 6 | 出页路径约定 | AC-P6-1 | 需决定 | 定唯一路径；页面 owner |
| G-17 | 旧整体确认原话未取得 | 2 | 来源登记 | AC-P2-1 | 延期 | 原件未取得；主会话 |
| G-18 | 轻档/普通无真实样本 | 5 | 轻档回放 | AC-P5-1 | 延期 | 需真实轻档任务；阶段 owner |
| G-19 | P9 依赖 P5 聊天/冷读自证 | 3 | 证据与收敛共用原件 | AC-P3-1 | 需实现 | 实现后共用；技能 owner |
| G-20 | 逐包收敛“顺序本身”无机检 | 3 | 顺序检查 | AC-P3-1 | 需实现 | `dispatch`/`status` 脚本；技能 owner |
| G-21 | 五段顺序只由关键词正则把关 | 2 | 阶段边界机检 | AC-P2-2 | 需实现 | 扩检查器；运行时 owner |
| G-22 | 页面对 `phases/*` 不触发过期 | 6 | 指纹输入含 phases | AC-P6-1 | 本轮可核（需页面） | 只改 phases 反例；页面 owner |
| G-23 | 旧编号映射缺失致包区全缺 | 6 | 编号映射 | AC-P6-1 | 已退役（新模型） | 旧解析器退役；页面 owner |
| G-24 | `P11-FINAL` 归档后不可复现 | 9 | 末验收入口 | AC-P9-1 | 需恢复条件 | 归档先行后重跑；收口 owner |
| G-25 | 第 13 步 spec-analyze 两次未按序 | 10 | A 表 caller | AC-P10-2 | 本轮可核（A 表已交） | B/C 实现后；日志 owner |
| G-26 | 原始请求从未逐条登记 | 2 | 来源 #0 | AC-P2-1 | 本轮可核（索引 §5 已登记 sha） | 材料 owner |
| G-27 | 未做浏览器真实打开/截图 | 6 | 浏览器观察 | AC-P6-2 | 延期 | 需浏览器；页面 owner |
| G-28 | 29 条细节审查全标 fixed | 7 | 交付记录更正 | AC-P7-1 | 需恢复条件 | 真实 diff 复核；审查者 |
| G-29 | T15 `material-contract` exit 1 未记 | 9 | 门禁与 handoff 记录 | AC-P9-1 | 需恢复条件 | 重跑并记；收口 owner |
| G-30 | build-plan 越界改 decision-log | 2 | 阶段边界机检 | AC-P2-2 | 需实现 | 扩检查器；运行时 owner |

> 说明：G-04/G-23 随旧页面解析退役，原件只读保留；G-03/G-07/G-17/G-18/G-27 与 G-09 是延期或未取得，owner 与时点见上表；其余在 build-code 实现后可核。包号已全部换成现十包，不再用旧 12 包或旧 9 包编号。

## 6. 证据索引

### 6.1 事实 raw

- `quality/evidence/research/raw/prior-t6.md`、`prior-t16.md`：T6/T16 失败。
- `raw/t13-build.md`、`raw/t8-build.md`：T13/T8 build-code 过程、16 轮、子代理占比。
- `raw/research-enforcement.md`、`research-provenance.md`、`research-build-cost.md`、`research-traceability.md`：执行/证据/成本/追溯审计。
- `raw/disk-facts.md`、`cleanup-batch1.md`、`cleanup-batch2.md`、`resource-inventory.md`、`phase0-history.md`：磁盘、清理、资源、Phase 0 历史。
- `quality/evidence/decision-log-refs/four-checks-2026-11-19.md`、`chain-checks-2026-11-19.md`：四查、链检查。
- 需求索引：`quality/evidence/decision-log-refs/requirement-index.md`（需求 1–14、U 答复、旧 R 映射、AC 与证据 sha 的落点）。

### 6.2 设计产物

- `2026-11-19-decision-maker-failure-modes.md`：逐包失败、横向模式、技能设计。
- `2026-11-19-p6-readiness-design.md`、`p7-repair-design.md`、`p8-root-cause.md`、`p9-acceptance-design.md`：四包专项。
- `quality/evidence/research/2026-11-19-dl-build-plan-input-audit.md`（真实存在）：日志输入审计；`2026-11-19-dl-external-research.md`（**未取得：任务库中不存在该文件**；owner=日志/调研负责人；恢复条件=补交原件并登记 sha，或改引上述审计的外部格式段）；`2026-11-19-dl-buildplan-input-map.md`（**未取得：任务库中不存在该文件**；owner=日志/调研负责人；恢复条件=补交字段映射原件并登记 sha，或改引上述审计的字段映射段）。
- `quality/reviews/2026-11-19-005-make-decision-direction.json`、`006-make-decision-detail.json`、`007-spec-analyze.md`：方向/细节/一致性审查。
- `quality/evidence/decision-log-refs/requirement-index.md`、`coverage-matrix-5d.md`：需求/覆盖索引（旧 12 包行只作素材）。

### 6.3 调研台账 C 索引

C-01…C-31 全量见 v1 第 112–144 行与 `raw/`；关键项：C-01 子代理成本、C-02 T13/T8、C-03 早失败、C-04 冷读、C-05 粒度、C-08 自审、C-12 页面、C-16 交接、C-19/C-20 收口、C-22 成本、C-23 Phase 0、C-26 磁盘、C-28 归档、C-29 图谱。各包“调研”引用对应 C 号。

### 6.4 编号对照

| 正文编号 | 机器编号 | 说明 |
| --- | --- | --- |
| 需求 1–14 | 旧 R-001..R-022 | 多对一；逐条映射见需求索引 §1 与「旧 R 编号映射」 |
| 包 1–10 | 沿用“包 N” | 包号即编号；不再使用旧 12 包或旧 9 包编号 |
| 决定 1–10 | D-001..D-010 | 与需求索引的“派生需求 D-001..D-075”是不同命名空间，引用时写“决定 D-xxx”“派生 D-xxx” |
| 验收 | AC-P1-1 … AC-P10-8（27 条） | 验收编号；判据以各包第 7 项为准，5.0 只做索引 |

> 证据 sha256 见需求索引 §5（主原件已登记）：`original-request.md`=a7d0dc0e…；审查 005/006/008、四查、链检查、覆盖矩阵、v1 归档均已登记。本日志与索引自身的 sha 是自引用，未取得，见索引 §5 缺口行。
