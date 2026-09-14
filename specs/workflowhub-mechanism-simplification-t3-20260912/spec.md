# 功能规格：任务Ⅲ 治理同步、双证验收与四条现场阻塞修复

> 基于已接受的需求来源（本任务 `decision-log.md`，用户确认「确认，收口make-decision吧」，2026-09-12）。本文件只写产品问题、行为、边界和验收；文件路径仅在治理文档本身是产品面时点名，代码符号与工程命令留给 plan.md 与 tasks.md。

- **功能名**：WorkflowHub 任务Ⅲ（C7 治理同步 + C8 双证验收 + PaperBuilder 四条现场阻塞修复）
- **来源**：`decision-log.md` 全部 16 条决定（D-001 ~ D-016）与原始需求 R-001 ~ R-019
- **状态**：草稿（build-spec 阶段产物，冻结后以本文件为当前规格唯一权威）

## 材料导航

| 章节 | 一句话 | 建议时机 |
| --- | --- | --- |
| 速读卡（30 秒） | 30 秒抓住本任务做什么、怎么算做完 | M |
| 1 ~ 2 | 问题、背景、目标、范围内 | M |
| 3 | 13 个用户场景与八态覆盖 | S |
| 4 | 17 条产品事实（PFACT） | S |
| 5 | 37 条功能需求（FR） | M |
| 6 ~ 9 | 模块、实体、数据生命周期、兼容性 | B |
| 10 | 唯一权威非目标清单与默认必须成立 | M |
| 11 | 32 条验收标准（AC） | M |
| 12 | 风险、未决、Clarify 结论、交接 | M |
| 13 | 业务影响与回归范围 | B |
| 附录 A | 宪法等治理文本改前改后对照草案（G2-A） | M |
| 附录 B | 四条修复的测试期望变更登记 | S |

M = 必读；S = 选读；B = 回溯时再读。本表是可再生导航，不是第二份真相。

## 速读卡（30 秒）

- **一句话需求**：任务Ⅲ 收口时，WorkflowHub 的已知阻塞全部消失——C7 让治理文字与代码事实逐条一致，C8 给出可复算的双证验收，PaperBuilder 现场撞出的四条阻塞被修好且有针对性测试。
- **核心改动点**：
  - 宪法 F3/F6 去掉 hash 与「内容校验值」表述；F11 写入「控制面净减法 + 默认不新增 hash」硬规则；负向条款（15 条拒绝方案）与八类阻塞分类学常驻；版本 1.8.0 → 1.9.0、条目数仍 22。
  - 四条阻塞修复排在 C7 之前：stage 行写侧指纹、旧审查记录内容绑定、spec-analyze 显式 skip 事实、direction_change 复用 fixed 终态。
  - C8 双证：静态净减法逐项 + M1–M5 对照 + 链路验收（用本任务材料）+ 逐条阻塞账 + 异源复核双轨。
- **最大影响面**：治理文档族（宪法、checklist、CONTEXT、AGENTS、CLAUDE、README、audit-contracts、ADR、两份 architecture json）、npm test 入口语义与 CI 配置、五个 runtime 修复站点、close 计划收敛面。
- **验收信号**：`npm run check` 相关步骤不劣化于本任务基线且范围内清零；逐条阻塞账可被第三方用同一条命令复算；宪法条目数 = checklist 条目数 = 22 的机器守卫通过。

## 来源与决策映射

| Source ID | Decision ID | 规格 FR | 规格 AC |
| --- | --- | --- | --- |
| R-001 | D-001 / D-007 | FR-GOV-001, FR-GOV-002, FR-GOV-003, FR-GOV-004, FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010, FR-GOV-011, FR-GOV-012, FR-GOV-013, FR-GOV-014, FR-GOV-015, FR-GOV-016, FR-GOV-017, FR-GOV-018, FR-GOV-019, FR-GOV-020, FR-FIX-001, FR-FIX-002, FR-FIX-003, FR-FIX-004, FR-ACC-001, FR-ACC-002, FR-ACC-003, FR-ACC-004, FR-ACC-005, FR-ACC-006, FR-ACC-007, FR-ACC-008, FR-ACC-009, FR-ACC-010, FR-ACC-011, FR-EXE-001, FR-EXE-002 | AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010, AC-GOV-011, AC-GOV-012, AC-GOV-013, AC-GOV-014, AC-GOV-015, AC-GOV-016, AC-FIX-001, AC-FIX-002, AC-FIX-003, AC-FIX-004, AC-ACC-001, AC-ACC-002, AC-ACC-003, AC-ACC-004, AC-ACC-005, AC-ACC-006, AC-ACC-007, AC-ACC-008, AC-ACC-009, AC-ACC-010, AC-EXE-001, AC-EXE-002 |
| R-002 | D-007 | FR-EXE-002 | AC-EXE-002 |
| R-003 | D-002 / D-003 | FR-ACC-001, FR-ACC-002, FR-ACC-003, FR-ACC-004, FR-ACC-005, FR-ACC-006, FR-ACC-007, FR-ACC-008, FR-ACC-009, FR-ACC-010, FR-ACC-011 | AC-ACC-001, AC-ACC-002, AC-ACC-003, AC-ACC-004, AC-ACC-005, AC-ACC-006, AC-ACC-007, AC-ACC-008, AC-ACC-009, AC-ACC-010 |
| R-004 | D-002 / D-014 | FR-GOV-005, FR-GOV-006, FR-GOV-007 | AC-GOV-003 |
| R-005 | D-001 / D-004 / D-005 | FR-FIX-001, FR-FIX-002, FR-FIX-003, FR-FIX-004 | AC-FIX-001, AC-FIX-002, AC-FIX-003, AC-FIX-004 |
| R-006 | D-014 / OI-17 | FR-EXE-001 | AC-EXE-001 |
| R-007 | §8 逐条落地 | FR-GOV-001, FR-GOV-002, FR-GOV-003, FR-GOV-004, FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010, FR-GOV-011, FR-GOV-012, FR-GOV-013, FR-GOV-014, FR-GOV-015, FR-GOV-016, FR-GOV-017, FR-GOV-018, FR-GOV-019, FR-GOV-020, FR-FIX-001, FR-FIX-002, FR-FIX-003, FR-FIX-004, FR-ACC-001, FR-ACC-002, FR-ACC-003, FR-ACC-004, FR-ACC-005, FR-ACC-006, FR-ACC-007, FR-ACC-008, FR-ACC-009, FR-ACC-010, FR-ACC-011, FR-EXE-001, FR-EXE-002 | AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010, AC-GOV-011, AC-GOV-012, AC-GOV-013, AC-GOV-014, AC-GOV-015, AC-GOV-016, AC-FIX-001, AC-FIX-002, AC-FIX-003, AC-FIX-004, AC-ACC-001, AC-ACC-002, AC-ACC-003, AC-ACC-004, AC-ACC-005, AC-ACC-006, AC-ACC-007, AC-ACC-008, AC-ACC-009, AC-ACC-010, AC-EXE-001, AC-EXE-002 |
| R-008 | D-014（T-015） | FR-GOV-017 | AC-GOV-015 |
| R-009 | D-015 / OI-23 | FR-EXE-001 | AC-EXE-001 |
| R-010 | §5 Talk 记录 | FR-GOV-001, FR-GOV-002, FR-GOV-003, FR-GOV-004, FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010, FR-GOV-011, FR-GOV-012, FR-GOV-013, FR-GOV-014, FR-GOV-015, FR-GOV-016, FR-GOV-017, FR-GOV-018, FR-GOV-019, FR-GOV-020, FR-FIX-001, FR-FIX-002, FR-FIX-003, FR-FIX-004, FR-ACC-001, FR-ACC-002, FR-ACC-003, FR-ACC-004, FR-ACC-005, FR-ACC-006, FR-ACC-007, FR-ACC-008, FR-ACC-009, FR-ACC-010, FR-ACC-011, FR-EXE-001, FR-EXE-002 | AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010, AC-GOV-011, AC-GOV-012, AC-GOV-013, AC-GOV-014, AC-GOV-015, AC-GOV-016, AC-FIX-001, AC-FIX-002, AC-FIX-003, AC-FIX-004, AC-ACC-001, AC-ACC-002, AC-ACC-003, AC-ACC-004, AC-ACC-005, AC-ACC-006, AC-ACC-007, AC-ACC-008, AC-ACC-009, AC-ACC-010, AC-EXE-001, AC-EXE-002 |
| R-011 | F-01 | — | — |
| R-012 | §8.1 / §8.2 | FR-GOV-001, FR-GOV-002, FR-GOV-003, FR-GOV-004, FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010, FR-GOV-011, FR-GOV-012, FR-GOV-013, FR-GOV-014, FR-GOV-015, FR-GOV-016, FR-GOV-017, FR-GOV-018, FR-GOV-019, FR-GOV-020, FR-ACC-001, FR-ACC-002, FR-ACC-003, FR-ACC-004, FR-ACC-005, FR-ACC-006, FR-ACC-007, FR-ACC-008, FR-ACC-009, FR-ACC-010, FR-ACC-011 | AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010, AC-GOV-011, AC-GOV-012, AC-GOV-013, AC-GOV-014, AC-GOV-015, AC-GOV-016, AC-ACC-001, AC-ACC-002, AC-ACC-003, AC-ACC-004, AC-ACC-005, AC-ACC-006, AC-ACC-007, AC-ACC-008, AC-ACC-009, AC-ACC-010 |
| R-013 | §8.1 | FR-GOV-001, FR-GOV-002, FR-GOV-003, FR-GOV-004, FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010, FR-GOV-011, FR-GOV-012, FR-GOV-013, FR-GOV-014, FR-GOV-015, FR-GOV-016, FR-GOV-017, FR-GOV-018, FR-GOV-019, FR-GOV-020 | AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010, AC-GOV-011, AC-GOV-012, AC-GOV-013, AC-GOV-014, AC-GOV-015, AC-GOV-016 |
| R-014 | §8.2 | FR-ACC-001, FR-ACC-002, FR-ACC-003, FR-ACC-004, FR-ACC-005, FR-ACC-006, FR-ACC-007, FR-ACC-008, FR-ACC-009, FR-ACC-010, FR-ACC-011 | AC-ACC-001, AC-ACC-002, AC-ACC-003, AC-ACC-004, AC-ACC-005, AC-ACC-006, AC-ACC-007, AC-ACC-008, AC-ACC-009, AC-ACC-010 |
| R-015 | D-006 / D-008 | FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010, FR-GOV-011, FR-GOV-012, FR-GOV-013, FR-GOV-014, FR-GOV-015, FR-GOV-016, FR-GOV-017, FR-GOV-018, FR-GOV-019, FR-GOV-020, FR-ACC-001, FR-ACC-002, FR-ACC-003 | AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010, AC-GOV-011, AC-GOV-012, AC-GOV-013, AC-GOV-014, AC-GOV-015, AC-GOV-016, AC-ACC-001, AC-ACC-002, AC-ACC-003 |
| R-016 | D-004 / D-005 / §4.2 / §4.4 | FR-FIX-001, FR-FIX-002, FR-FIX-003, FR-FIX-004 | AC-FIX-001, AC-FIX-002, AC-FIX-003, AC-FIX-004 |
| R-017 | D-001 ~ D-016 来源列 | FR-GOV-001, FR-GOV-002, FR-GOV-003, FR-GOV-004, FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010, FR-GOV-011, FR-GOV-012, FR-GOV-013, FR-GOV-014, FR-GOV-015, FR-GOV-016, FR-GOV-017, FR-GOV-018, FR-GOV-019, FR-GOV-020, FR-FIX-001, FR-FIX-002, FR-FIX-003, FR-FIX-004, FR-ACC-001, FR-ACC-002, FR-ACC-003, FR-ACC-004, FR-ACC-005, FR-ACC-006, FR-ACC-007, FR-ACC-008, FR-ACC-009, FR-ACC-010, FR-ACC-011, FR-EXE-001, FR-EXE-002 | AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010, AC-GOV-011, AC-GOV-012, AC-GOV-013, AC-GOV-014, AC-GOV-015, AC-GOV-016, AC-FIX-001, AC-FIX-002, AC-FIX-003, AC-FIX-004, AC-ACC-001, AC-ACC-002, AC-ACC-003, AC-ACC-004, AC-ACC-005, AC-ACC-006, AC-ACC-007, AC-ACC-008, AC-ACC-009, AC-ACC-010, AC-EXE-001, AC-EXE-002 |
| R-018 | D-014 | — | — |
| R-019 | D-009 / §8.3 | FR-GOV-003, FR-GOV-018 | AC-GOV-002, AC-GOV-016 |

## 1. 问题与紧迫性

用户的痛点不是某一条具体缺陷，而是「WorkflowHub 总是反复出现同类阻塞」：PaperBuilder M1 任务现场撞出四条缺陷（stage 行写坏自己读不回来、旧审查记录触发即 exit 1、阶段末内容收敛检查静默跳过、一类 finding 永远没有「已修复」终态），而 PRD 登记的 51 条 X 与在研任务Ⅱ 都没有认领它们。同时任务Ⅲ 本身的 C7（治理同步）与 C8（双证验收）是整改线的收官：治理文字与代码事实仍有十余处矛盾，宪法还没有「控制面净减法」「默认不新增 hash」「八类阻塞分类学」这些防复发规则。

为什么现在必须处理：任务Ⅰ 已合入归档、任务Ⅱ 在研，任务Ⅲ 是三个交付组的末位；四条阻塞中的第二条会让消费旧审查记录的任务直接 exit 1，不修就继续卡现场；C7 若不做，「文档说的」和「代码做的」会持续漂移，下一次任务还会再撞一遍。

## 2. 背景、目标与范围

### 背景

- WorkflowHub 正按 PRD 的合并列车做机制简化：任务Ⅰ（C0–C3）已合入归档，任务Ⅱ（C4/C5/C6/C9）在研未合入，本任务 = 批次 ⑦ → ⑧（C7 → C8）+ 四条现场阻塞，一条合并列车（decision-log D-001）。
- 本任务开工 HEAD `3a061d4b` 实测基线：全仓 markdownlint 610 条（其中无关 specs 目录 500 条 / 22 文件）、path-guard 0 FAIL、verify-structure 2 个问题、父材料 82 条 lint（decision-log F-19）。
- 四条阻塞在 HEAD 逐条成立且无人认领，属 PRD 51 条 X 之外的新一类；本任务自身 make-decision 的 stage 行已确定性复现缺陷 1（decision-log §13.5），是最可控的现场标本。

### 目标

- 收口时「阻塞消失」可验证：逐条阻塞账（现象 → 根因 → 修复 → 验证命令 → 证据）+ 八类阻塞逐类防护与 owner（D-002）。
- 治理文字与代码事实在固定清单内逐条一致，宪法写入防复发规则，升版 1.9.0 且条目数仍 22。
- 四条阻塞有最小修复与针对性测试，唯一 exit 1 的那条不再触发。
- 全程零新增控制面、零延期项；build-code 等任务Ⅱ 完全合并后才开始（D-007）。

### 范围内

1. **四条现场阻塞修复**（排 C7 之前，D-004）：写侧行指纹、审查记录内容绑定、spec-analyze 显式 skip、direction_change 的 fixed 终态。
2. **C7 治理同步**：宪法 F3/F6/F11 修订 + 负向条款 + 分类学常驻 + checklist/版本/映射同步；治理文档对照表（约 15 项固定对象）；CONTEXT.md 术语修正；父材料 X1–X14 更正与 lint 清零；预存在红按「窄 ignores + 逐条修 + 不动守卫」处置；operations/close 多文件计划收敛。
3. **C8 双证验收**：静态净减法逐项、M1–M5 对照任务Ⅰ 归档 C0 口径、M4 按整条整改线、链路验收用本任务材料、不可证伪项标 unknown、适配代码计入净增减账、异源复核双轨。
4. **执行纪律**（R-009/OI-23）：重读量动作派子代理、主会话只收摘要，落进执行记录。

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

### SCN-001：治理同步主流程

- **角色**：执行 build-code 的主会话与子代理
- **Given**：任务Ⅱ 已完全合入、build-spec/build-plan 已定稿
- **When**：按批次先修四条、再做 C7 治理同步
- **Then**：每个批次有停止条件；治理文档与代码事实逐条一致；宪法升到 1.9.0 且机器守卫通过

### SCN-002：四条修复先行

- **角色**：执行 build-code 的主会话
- **Given**：五条以上 runtime 文件与任务Ⅱ 曾同文件
- **When**：批次排序把四条修复排在 C7 之前
- **Then**：C7 的对照表代码侧事实取自修复后的树；四条各自有针对性测试证据

### SCN-003：任务收口时 stage 行必须读得回来

- **角色**：任何跑完一个 stage 的任务（含本任务自己）
- **Given**：某 stage 结束时没有可用的会话绑定 outcome
- **When**：写侧落 stage 行、随后用 status 读回
- **Then**：行指纹 = 该 stage 自己的材料 scope 指纹，读回不报 stale；历史坏行被如实登记为不可恢复

### SCN-004：消费一份旧审查记录

- **角色**：审查事实读回方（status / close）
- **Given**：任务 store 里有一份结果文件名不等于旧命名规则的审查记录
- **When**：执行审查事实读回
- **Then**：按既有内容绑定模型校验通过，不再抛路径身份错误、不再 exit 1

### SCN-005：阶段末 analyzer 遇到不完整输入

- **角色**：阶段末 spec-analyze
- **Given**：decision-log 缺正文标题等门槛不成立
- **When**：执行内容收敛检查
- **Then**：返回结构里有一条显式 skip 事实，「没跑」与「跑过且通过」可区分

### SCN-006：方向改变类 finding 的收场

- **角色**：处置 review findings 的主会话
- **Given**：一条 finding 被分类为 direction_change 且材料已改好
- **When**：提交 finding 处置
- **Then**：允许走既有 fixed 终态，finding_dispositions 不再永久缺失

### SCN-007：双证验收执行

- **角色**：验收执行者（build-code 收尾 + verify-code）
- **Given**：代码与文档改动完成
- **When**：执行 C8 验收
- **Then**：净减账、M1–M5 对照、链路三步、逐条阻塞账、异源复核各有可复算结论；重复执行不产生重复行

### SCN-008：复核不可用或限流

- **角色**：异源复核调度方
- **Given**：provider 限流或不可用
- **When**：复核返回 partial 或 unavailable
- **Then**：如实登记（provider、错误码、耗时），判据保持 incomplete，不折算通过、不阻断同任务修复

### SCN-009：预存在红处置

- **角色**：build-code 主会话
- **Given**：全仓 610 条 lint、其中 500 条集中在无关 specs 目录
- **When**：执行 D-006 路线
- **Then**：无关目录加窄 ignores（理由 + owner）、其余逐条修、本任务材料 0 条、verify-structure 靠改 CONTEXT.md 清零、path-guard 保持 0

### SCN-010：任务Ⅱ 长期不合入

- **角色**：等待中的本任务主会话
- **Given**：任务Ⅱ 未合入
- **When**：每次会话核对
- **Then**：只如实记「仍在等」的事实；等待期 git 范围比较只允许 specs 本任务目录变化，不改仓库任何文件（G1）

### SCN-011：close 计划收敛与五动作落账

- **角色**：close 流程
- **Given**：任务收口需要物理交付
- **When**：执行 close 五动作
- **Then**：多文件计划对象收敛为一次性展示；五动作结果写入 close_action 行；人确认凭证与 plan hash 校验保留

### SCN-012：执行纪律核对

- **角色**：审查执行记录的人或审查者
- **Given**：build-code / verify-code 已执行
- **When**：读执行记录
- **Then**：每条重读量动作有 actor（主会话/子代理）、command、exit_code、结论摘要；主会话自行跑全仓扫描的记录不存在

### SCN-013：不可逆动作前的授权边界

- **角色**：用户与 close 流程
- **Given**：批次全部完成、需要 commit / merge / cleanup
- **When**：触发不可逆动作
- **Then**：先取得独立人工确认；build-code 开工前的祖先校验也已实测通过

### 状态覆盖清单

- [x] **默认态**：SCN-001 / SCN-002 / SCN-007 / SCN-009 / SCN-011
- [x] **空态**：N/A — 本任务无用户数据加载场景；所有输出为命令行文本与材料文件
- [x] **错误态**：SCN-003（读回 stale 即失败）/ SCN-005 / SCN-008（失败停在那条、如实记录）
- [x] **加载态**：N/A — 命令行工具无加载界面；长时间动作（审查）的完成事实由 receipt 承载
- [x] **取消态**：SCN-010（任务Ⅱ 未合入 = 推迟路径，只记事实不擅自行动）
- [x] **边界态**：SCN-003（无 stage outcome 的 stage end 恰为缺陷 1 边界）/ SCN-013
- [x] **权限态**：SCN-013（三处人工确认点与不可逆授权）/ SCN-011（close 授权）
- [x] **竞态**：SCN-007（stage 行原地替换语义，重放不产生重复行 = 幂等边界）

## 4. 产品事实与假设（PFACT）

- **PFACT-01**：本任务开工 HEAD 实测基线 = 全仓 markdownlint 610 条、path-guard 0 FAIL、verify-structure 2 个问题、父材料 82 条 lint；PRD 旧数字（554 / 10 / 2 / 82）只作历史。state: verified
- **PFACT-02**：任务Ⅱ 未合入：分支无独立提交、落后 main 两个提交、与本任务有五处 runtime 同文件关系。state: verified
- **PFACT-03**：四条阻塞在 HEAD 全部成立、PRD 51 条 X 与任务Ⅱ 均零命中认领，属新一类。state: verified
- **PFACT-04**：缺陷 1 已两次现场复现（含本任务自身 make-decision 行）：写侧回退整材料指纹、读侧期望 stage scope 指纹，数学上永不相等。state: verified
- **PFACT-05**：stage 行字段表冻结 16 键，新增字段会被拒绝；四条修复不得新增行字段、状态字面量、schema 或门禁。state: verified
- **PFACT-06**：四条最小修复面已核定：写侧两处回退改用 stage scope 指纹；旧审查记录改用既有内容绑定模型；analyzer 门槛不成立时落显式 skip 事实；direction_change 复用既有 fixed 终态只改一处路由。state: verified
- **PFACT-07**：两条现有测试固化了将被修复的行为（analyzer 静默跳过、direction_change 禁止 fixed），其期望变更必须显式登记、不得放宽断言凑绿。state: verified
- **PFACT-08**：宪法 F3 仍把 hash 列为写边界 fail-loud 条件、F6 正例仍写「合同内容校验值」；代码侧仍强制 hash——本任务删的是治理文字的「要求」，代码做得多不构成矛盾。state: verified
- **PFACT-09**：C7 对照表实测对象比 PRD 记录多两处（README、ADR 0027 重复编号组）、数字漂移五处（372 / 7 / 35 / 258 等），以实测为准。state: verified
- **PFACT-10**：path-guard 在 HEAD 已是 0 FAIL（任务Ⅰ 已清），C7-FR-15 改判为「保持 0、不得回升」。state: verified
- **PFACT-11**：verify-structure 的 2 个问题 = CONTEXT.md 缺第五阶段别名 test-acceptance、含三处触发 denylist 的 runtime 路径措辞。state: verified
- **PFACT-12**：父材料（本任务组上游活材料）1,979 行、82 条 lint，X1–X14 待更正；test / review / provenance 证据字节不在可改面内。state: verified
- **PFACT-13**：异源复核双轨（真实外部 provider 审查 + 独立子代理复核）不可互替已被 PRD 第四/五轮实测证明。state: verified
- **PFACT-14**：缺陷 2 的历史实例（旧审查记录逐对复算回归样本）尚未补实测，影响修复后的回归样本覆盖面、不影响方向。state: unknown
- **PFACT-15**：M1/M2 在历史数据上不可复现已由任务Ⅰ 证明，C8 该两项按不可证伪项如实登记并写明出处。state: verified
- **PFACT-16**：宪法条目数 22 有机器守卫（verify-structure 的条目数与编号集合校验），升版不得变成第 23 条。state: verified
- **PFACT-17**：npm test 现为 258 个测试文件的无范围全量，与仓库禁令、CI 实际运行三者冲突。state: verified

## 5. 功能需求

### 治理同步（GOV）

- **FR-GOV-001**：设计宪法 F3 的定义句不再把 hash 列为写成功前的 fail-loud 必要条件（task/worktree/runtime 身份、顺序与核心 publication 结构仍 fail-loud）；F6 正例删去「合同内容校验值」表述；两处改前/改后原文与实测行号进附录 A 对照表；升版四件（版本号、修订记录、旧→新映射、checklist 条目数）同步。
  - 依据：PFACT-08 / D-009 / D-016 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-001
- **FR-GOV-002**：「控制面净减法」与「默认不新增 hash」以硬规则写入 F11 正文同段；守卫三要件（登记字段、违反后果、范围与自适性含自指）齐备且不新增任何对象。
  - 依据：PFACT-16 / D-009 / T-023 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-002
- **FR-GOV-003**：宪法负向条款含母材料拒绝方案表全部 15 条（逐条可追溯、给 owner 与核对点），八类阻塞分类学与常驻规则（新阻塞先归类再登记、登记防护与 owner、归不进先扩表）同区写入。
  - 依据：PFACT-03 / D-002 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-003
- **FR-GOV-004**：约 15 项固定对象的「文档表述 ↔ 代码事实」对照表逐行一致、无「仍矛盾」行；对象 = 宪法、checklist、AGENTS、CLAUDE、README、CONTEXT、audit-contracts、package.json、两份 architecture json、六个 ADR、lint 配置、CI 配置 + 本任务实际改动文件。
  - 依据：PFACT-09 / D-008 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-004
- **FR-GOV-005**：`npm run check` 相关步骤不劣化于本任务基线（610 / 0 / 2 问题）且本任务范围内清零；新增红一律判失败。
  - 依据：PFACT-01 / D-006 ｜ 场景：SCN-009 ｜ 验收：AC-GOV-005
- **FR-GOV-006**：任务记录路径守卫保持 0 FAIL、不得回升、不得放宽守卫表凑绿。
  - 依据：PFACT-10 / D-006 ｜ 场景：SCN-009 ｜ 验收：AC-GOV-006
- **FR-GOV-007**：verify-structure 的 2 个问题靠改 CONTEXT.md 清零（第五阶段补「验收（test-acceptance）」别名、三处 runtime 路径措辞改写），守卫脚本不动。
  - 依据：PFACT-11 / T-016 ｜ 场景：SCN-009 ｜ 验收：AC-GOV-007
- **FR-GOV-008**：父材料 decision-log 用仓库锁定工具链报告 0 issues；X1–X14 复核表 14/14 无「仍矛盾」、批次计数全文只有「10 个具名批次」一个口径、decision_hash 两口径写清、聚合文件名以实际落盘为准。
  - 依据：PFACT-12 / D-011 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-008 / AC-GOV-009
- **FR-GOV-009**：D-025③ 措辞更正为「prd.md 不是第五份材料」；当前材料文件集合仍为 4 项、close 不要求 prd.md。
  - 依据：D-011 / C7-FR-13 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-010
- **FR-GOV-010**：不存在的顶层 schemas 引用三处（AGENTS、CLAUDE、README）与 audit-contracts 死对象表述同批修正；ADR 编号重复组（0025×3、0009×2、0002×2、0027×2）逐组给处置与理由。
  - 依据：PFACT-09 / C7-FR-10 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-004
- **FR-GOV-011**：npm test 不再是无范围全量：改显式分组并给出「新分组 → 覆盖原范围」映射与并集覆盖全部 258 文件的计数证明；CI 逐组调用；文档例外条款写清；test:exclusive 语义保留。
  - 依据：PFACT-17 / D-010 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-011
- **FR-GOV-012**：两份 architecture json 的登记义务同步：move-map 条目数与 control-plane 清单按实测（372 / 7 全 retain）重核，X51 按 7 条重判。
  - 依据：PFACT-09 / C7-FR-11 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-004
- **FR-GOV-013**：operations/close 多文件计划对象收敛为一次性展示；close 五动作结果写入 close_action 行；人确认凭证与 plan hash 校验保留。
  - 依据：C7-FR-12 / SCN-011 ｜ 场景：SCN-011 ｜ 验收：AC-GOV-013
- **FR-GOV-014**：父材料视为本任务组上游活材料：允许更正 X1–X14 与修 82 条 lint；受保护路径（quality、archive、历史 task store）以基线 hash 冻结、改动前后比对。
  - 依据：PFACT-12 / D-011 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-008 / AC-GOV-014
- **FR-GOV-015**：无关 specs 目录的 lint 加窄 ignores 并写明理由与 owner（沿用既有先例）；其余 lint 逐条修；父材料不得进 ignores。
  - 依据：PFACT-01 / D-006 ｜ 场景：SCN-009 ｜ 验收：AC-GOV-005 / AC-GOV-014
- **FR-GOV-016**：每条具名控制面净增减有改前/改后行数实测与净值；净值为正必须写明理由（治理文字属 PRD 承认的唯一合法净增）。
  - 依据：D-012 / C7 卡净增减申报条 ｜ 场景：SCN-007 ｜ 验收：AC-GOV-012
- **FR-GOV-017**：六类边界（用户流程、页面、数据状态、成功失败、非目标、延期）与四条新增非目标、零延期项在材料中具名落盘，可与 decision-log §3 逐条对账。
  - 依据：D-014 / OI-17 ~ OI-22 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-015
- **FR-GOV-018**：R-019 hash 净减：产出 tracked 全集的 hash 用法清单（每条含路径行号、类别、处置、理由、绑定对象），本任务删治理文字侧表述与过程化产物类，身份绑定与完整性类只登记，不新增任何 hash 字段或校验。
  - 依据：PFACT-08 / D-009 / OI-24 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-002 / AC-GOV-016
- **FR-GOV-019**：可扩展性检查的宪法/文档表述与删哈希后的实现一致；实现替代归任务Ⅱ，本任务的表述同步在任务Ⅱ 合入后按其实现事实写。
  - 依据：PFACT-02 / C7-FR-8 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-004
- **FR-GOV-020**：AGENTS 与 CLAUDE 的保留清单（外置索引与验证投影两项）与上游已确认决定的冲突修正；须在任务Ⅱ（C5/C6）合入后按代码实际结果改写。
  - 依据：PFACT-02 / C7-FR-9 ｜ 场景：SCN-001 ｜ 验收：AC-GOV-004

### 四条现场阻塞修复（FIX）

- **FR-FIX-001**：stage 行写侧在无 stage outcome 的 stage end 上改用该 stage 自己的材料 scope 指纹，不再回退整材料指纹；新增一条窄回归测试覆盖 make-decision 与 build-spec 的行指纹路径；受害任务（含本任务自身）的历史坏行如实登记为不可恢复，不迁移、不改写、不建兼容桥。
  - 依据：PFACT-04 / PFACT-05 / D-005 ｜ 场景：SCN-003 ｜ 验收：AC-FIX-001
- **FR-FIX-002**：旧审查记录的路径身份校验改用既有内容绑定模型（逐项校验 ref、内容哈希、canonical 集合、schema、互链与 provenance），不再以「结果文件名 = 旧命名规则」作为身份判据。
  - 依据：PFACT-06 / D-004 ｜ 场景：SCN-004 ｜ 验收：AC-FIX-002
- **FR-FIX-003**：spec-analyze 的门槛不成立时显式落一条可读的 skip 事实进返回结构，「没跑」与「跑过且通过」可区分；被固化的旧期望用例同步更新。
  - 依据：PFACT-06 / PFACT-07 ｜ 场景：SCN-005 ｜ 验收：AC-FIX-003
- **FR-FIX-004**：direction_change 类 finding 允许走既有 fixed 终态（只改一处路由，复用已在终态集、处置白名单与冻结行词汇中的既有字面量）；被固化的旧期望用例同步更新。
  - 依据：PFACT-05 / PFACT-06 / PFACT-07 ｜ 场景：SCN-006 ｜ 验收：AC-FIX-004

### 双证验收（ACC）

- **FR-ACC-001**：静态净减法按任务Ⅰ 归档的 C1 最终具名删除清单逐项验收：每项不存在、每项附「无真实 consumer」证据、白名单对象（stage-outcome-proofs、workflow-evolution、protocol-error 族）不在删除面。
  - 依据：D-003 / C8-FR-1 ｜ 场景：SCN-007 ｜ 验收：AC-ACC-001
- **FR-ACC-002**：M1–M5 逐项对照任务Ⅰ 归档 C0 口径表判定（净减 / 不劣化 / 劣化 / unknown），劣化项有具名归因；本任务不新增仪器。
  - 依据：PFACT-15 / C8-FR-2 ｜ 场景：SCN-007 ｜ 验收：AC-ACC-002
- **FR-ACC-003**：M4 = 任务Ⅰ、任务Ⅱ、任务Ⅲ 三个合并提交各自首父 numstat 的 added − removed 合计为负；单看任务Ⅲ 允许为正并写明「治理文字属 PRD 承认的唯一合法净增」。
  - 依据：D-012 / C8-FR-3 ｜ 场景：SCN-007 ｜ 验收：AC-ACC-003
- **FR-ACC-004**：M1/M2 给出复测值或如实标 unknown 并写明缺什么（预期：历史数据不可复现，引任务Ⅰ 出处）。
  - 依据：PFACT-15 / C8-FR-4 ｜ 场景：SCN-007 ｜ 验收：AC-ACC-004
- **FR-ACC-005**：链路验收用本任务自己的材料与 store 执行三步：材料写完 → status 立即可读 → 重放不产生重复行；不新开真实任务，覆盖面限制写进验收账。
  - 依据：D-012 / C8-FR-5 ｜ 场景：SCN-007 ｜ 验收：AC-ACC-005
- **FR-ACC-006**：不可证伪项显式登记 unknown（至少含 token 维度、M1/M2 历史出处、本验收自指），任何一项不得写成通过。
  - 依据：C8-FR-6 ｜ 场景：SCN-007 ｜ 验收：AC-ACC-006
- **FR-ACC-007**：净增减账包含 CI 授权表与测试矩阵的新增适配代码，不只算生产代码。
  - 依据：C8-FR-7 ｜ 场景：SCN-007 ｜ 验收：AC-ACC-007
- **FR-ACC-008**：异源复核双轨：一次真实异源审查（非本任务主会话、不同底层模型）+ 一次独立子代理复核，分开记录 provider/身份/结论；不可用如实登记、绝不折算通过。
  - 依据：PFACT-13 / D-013 ｜ 场景：SCN-008 ｜ 验收：AC-ACC-008
- **FR-ACC-009**：历史任务的结论只能逐项对照引用，不做直接平均。
  - 依据：C8-FR-9 ｜ 场景：SCN-007 ｜ 验收：AC-ACC-002
- **FR-ACC-010**：本任务不新跑真实任务采基线。
  - 依据：C8-FR-10 / E-19 ｜ 场景：SCN-007 ｜ 验收：AC-ACC-005
- **FR-ACC-011**：逐条阻塞账落盘：51 条 X 逐条 + 现场四条 + 八类分类学逐类扫描结论，每行含 ID、现象、根因、修复、验证命令、证据；八类逐类有防护与 owner 行；清单写明纳入判据与排除项（编号分段不连续是既有事实，不得写成连续编号）。
  - 依据：D-002 / D-003 / OI-05 ｜ 场景：SCN-007 ｜ 验收：AC-ACC-010

### 执行纪律与开工门禁（EXE）

- **FR-EXE-001**：重读量动作点（全仓 grep、多文件对标、跑测试/采证据）由子代理执行，主会话只收「路径 + exit_code + 清单」摘要；执行记录含 actor、command、exit_code、结论摘要；不新增任何对象。
  - 依据：D-015 / OI-23 ｜ 场景：SCN-012 ｜ 验收：AC-EXE-001
- **FR-EXE-002**：build-code 开工前实测任务Ⅱ 的合并提交是 HEAD 祖先（SHA 写实测值）；等待期只允许本任务 specs 目录与任务 store 变化；任务Ⅱ 长期不合入只记事实、到期由用户重新裁定。
  - 依据：D-007 / PFACT-02 ｜ 场景：SCN-010 / SCN-013 ｜ 验收：AC-EXE-002

## 6. 模块划分

### 治理文档族

- **负责什么**：宪法、checklist、CONTEXT、AGENTS、CLAUDE、README、audit-contracts、ADR、两份 architecture json、lint 配置的表述与代码事实一致
- **对外提供什么**：治理文字这层「产品界面」与运行时行为一致；防复发规则有常驻位置
- **依赖谁**：四条修复后的代码事实（对照表代码侧）、任务Ⅱ 合入结果（AGENTS 保留清单等）
- **测试边界**：verify-structure 退出 0、条目数 22、markdownlint 基线、对照表无矛盾行

### 执行入口与持续集成

- **负责什么**：npm test 入口语义与 CI 的分组调用
- **对外提供什么**：本地与 CI 都能按具名分组跑测试，不再存在无范围全量入口
- **依赖谁**：测试文件的分组映射（plan.md 排布）
- **测试边界**：分组并集覆盖原 258 文件的计数证明、CI 配置不劣化

### 运行时记录面

- **负责什么**：stage 行、close_action 行、审查 attempt/result 的写与读
- **对外提供什么**：收口读回不 stale；旧审查记录可消费；close 五动作落账
- **依赖谁**：四条修复的最小改动
- **测试边界**：AC-FIX-001 ~ AC-FIX-004 的具名测试

### 验收与复核面

- **负责什么**：净减账、M1–M5 对照、链路验收、逐条阻塞账、异源复核
- **对外提供什么**：第三方可复算的验收结论
- **依赖谁**：C1 归档清单、C0 口径表、本任务材料与 store
- **测试边界**：AC-ACC-001 ~ AC-ACC-009

## 7. 关键实体

- **宪法条目**：F3（推进与写边界）、F6（外置执行记录）、F11（控制面受限）等 22 条；本任务改写 F3/F6/F11 的表述并在治理节增写负向条款，条目数不变。
- **负向条款**：治理节内的新增条款组，含 15 条已裁定不采纳清单、八类分类学常驻规则、守卫三要件；不是第 23 条。
- **checklist 对照项**：非条款区的一条对照（绑定负向条款），与 22 条主清单并存、不占用条目数。
- **stage 行**：任务外置记录的单行事实，字段表冻结 16 键；幂等键 = stage 名原地替换；读者 = status 与 close。
- **close_action 行**：close 五动作结果的单行事实；幂等键 = 动作名。
- **审查 attempt/result**：内容寻址的审查事实；身份 = 内容绑定（ref 集合 + 哈希 + 互链），不再是文件名规则。
- **阻塞账**：逐条阻塞的「现象 → 根因 → 修复 → 验证命令 → 证据」账本，含 51 条 X、四条、八类扫描结论。
- **hash 用法清单**：tracked 全集的 hash 逐条分类账（身份绑定 / 完整性校验 / 过程化产物 + 处置与理由）。
- **四份当前材料**：decision-log、spec、plan、tasks；prd.md 不是第五份材料。

## 8. 数据和生命周期

- **数据粒度**：一条 stage 行 = 一个 stage 的一次收口事实；一条 close_action 行 = 一个 close 动作的结果；一条审查事实 = 一次审查的一个角色结果。
- **数据时效**：stage 行按 stage 原地替换（重放不新增行）；审查事实只追加不改写；质量事实缺失保持 unknown/unavailable。
- **缺失或迟到**：无 stage outcome 的 stage end 用该 stage 的 scope 指纹写行（FR-FIX-001）；审查 provider 不可用时该事实记 unavailable，读者看到真实状态。
- **预览与正式**：四份材料即正式面；无单独预览态。
- **当前与历史**：历史任务的记录只读；本任务的历史坏行登记为不可恢复事实、不改写。
- **归属与清理**：材料由主会话写、下游只读；任务 store 由运行时写；m15 退休迁移与仓外清理不属本任务。

## 9. 兼容性预留

- **既有消费方**：status / close 的读回方、审查事实读回方、npm test 的 CI 调用方；入口名称与调用位置保留，npm test 的语义按 FR-GOV-011 变更为显式分组。
- **命名预留**：宪法条目编号 F/Q/S 体系不变，新规则以治理节条款组形式落，不占用编号。
- **容器预留**：stage 行字段表冻结 16 键不加字段；新事实进既有结构（errors / facts）。
- **状态预留**：finding 处置终态复用既有四个（fixed / rejected_invalid / user_decided / accepted_risk），不新增字面量。
- **扩展边界**：不承诺为历史任务修复坏行；不承诺仓外宿主能力；不承诺新控制面。

## 10. 明确不做与默认必须成立

### 明确不做

- E-1：workflowhub-followup-tasks 整体方案（用户 R-001 否决）。
- E-2：统一 canonical writer + 原子更新 index / facts / verify（删对象不修机制）。
- E-3：新增终态状态机 completed_with_quality_unavailable（用字段承接）。
- E-4：behavior / governance digest 分层（删失效链已达成目标）。
- E-5：executable compiler / contract report（材料必填小节替代）。
- E-6：command fingerprint + active-attempt lock / doctor --stage / execution-ledger。
- E-7：依赖闭包 freshness 的保留缩窄（去哈希失效链）。
- E-8：每 Phase 审到 findings 清零（审查做过即可）。
- E-9：review 轮次预算 + 人工放行（预算算法已出错）。
- E-10：新建 runs.jsonl（运行记录复用 facts.jsonl）。
- E-11：自动统计控制面数量的检查器（撞 F11）。
- E-12：硬拦截一张卡最多改 N 个文件（只作建议）。
- E-13：卡文件数之外的延期处理（零延期）。
- E-14：为历史任务补质量验收（历史只读冻结）。
- E-15：迁移历史 task-store / 兼容桥 / 双写。
- E-16：本任务不交付纯规划产物（普通任务，要改代码与治理）。
- E-17：宿主 / broker 仓外能力（如实显示 unavailable，不阻断阶段结束）。
- E-18：改 wh-review 的 per-stage 审查标准与 prompt。
- E-19：新跑真实任务采基线。
- E-20：宿主自建 worktree 增殖（按非目标登记，本仓不造机制）。
- 新增①：不为四条缺陷新增任何控制面（检查器 / schema / 门禁）。
- 新增②：不改历史证据字节（test / review / provenance 与已完成任务的证据记录只读；父材料属上游活材料、不在此列）。
- 新增③：不修宿主 / broker / 3rd-review 的仓内能力。
- 新增④：不重跑真实任务采基线。

### 默认必须成立

- 守卫脚本（verify-structure、check-task-record-paths）不改口径；改守卫凑绿即失败（关联 AC-GOV-006 / AC-GOV-007）。
- 任何计数相对本任务基线上升即失败；基线 = 开工 HEAD 重测值（关联 AC-GOV-005）。
- 本任务不新增 hash 字段或校验；误删身份绑定类 hash 导致记录绑定失效即失败（关联 AC-GOV-002）。
- 三处人工确认点不变：方向确认（已过）、规格冻结（本文件）、close 授权（关联 SCN-013）。
- 批次顺序：四条修复先于 C7；build-code 晚于任务Ⅱ 完全合并（关联 AC-EXE-002）。
- 成功判据具名清单（OI-20）：成功 = 治理 16 条 + 修复 4 条 + 验收 10 条 + 执行 2 条 AC 全过；失败停点 = 任一 AC 不成立即停在那条、不放宽、不回退已过批次；可原地重试 = 测试/命令失败、provider unavailable（换时间或换路重派）；必须重新确认 = 方向改变、范围变化、风险接受；卡点暴露 = status 根因行 + 材料登记。

## 11. 验收标准

### 治理同步验收

- [ ] **AC-GOV-001**：F3 定义句不再含 hash 作为写边界必要条件；F6 正例不再含「合同内容校验值」；两处改前/改后原文与实测行号进附录 A 对照表；版本号、修订记录、旧→新映射、checklist 条目数四件同步。
场景：核对宪法 diff 与附录 A。
验证：比对 F3/F6 改前改后原文与实测行号；确认版本号为 1.9.0、修订记录新增一条、映射段追加、checklist 条目数 = 22。
通过：两处表述按附录 A 草案落地、四件齐备、守卫退出 0。
失败：任一处仍要求 hash/校验值；或改了表述但四件缺一；或守卫条目数 ≠ 22。
证据：宪法与 checklist 的 diff、verify-structure 退出 0 的实测输出。

- [ ] **AC-GOV-002**：「控制面净减法」与「默认不新增 hash」以硬规则出现在 F11 正文同段；守卫三要件齐备；未新增计数器、schema、gate 或检查器。
场景：核对 F11 与治理节新增条款。
验证：grep 宪法正文确认两条硬规则与三要件；审查 diff 确认无新对象。
通过：两条硬规则在 F11 正文、三要件（登记字段 / 违反后果 / 范围自适性含自指）齐全。
失败：规则只写在 decision-log 或 checklist 而未进宪法；或做成新检查器（撞 F11）。
证据：宪法 diff 与对照表行。

- [ ] **AC-GOV-003**：宪法负向条款含拒绝方案表全部 15 条（逐条可追溯）与八类分类学 + 防护 + owner；checklist 条目数 = 宪法条目数 = 22。
场景：逐条数清单。
验证：把负向条款 15 条与母材料拒绝方案表逐行对账；确认八类每类有防护与 owner；运行结构守卫。
通过：15/15 无遗漏、八类齐、22 = 22。
失败：漏任一条；或分类学只写类名没有防护与 owner；或条目数变化。
证据：宪法治理节文本、checklist diff、守卫退出 0。

- [ ] **AC-GOV-004**：对照表逐行「文档表述 ↔ 代码事实」一致，无「仍矛盾」行；对象 = 固定清单（宪法、checklist、AGENTS、CLAUDE、README、CONTEXT、audit-contracts、package.json、两份 architecture json、六个 ADR、lint 配置、CI 配置 + 本任务改动文件）。
场景：逐行审对照表。
验证：固定清单逐项存在性检查；每行给出文档表述与代码事实两侧；重核 move-map 372 / 控制面 7 全 retain、ADR 重复编号组有处置。
通过：无「仍矛盾」行、无缺行。
失败：任一未消解矛盾；或漏检对象；或重复编号组无处置。
证据：对照表（落 plan.md）与逐项 test -e 记录。

- [ ] **AC-GOV-005**：npm run check 相关步骤不劣化于本任务基线（全仓 markdownlint 610 / path-guard 0 / verify-structure 2 问题）且本任务范围内清零。
场景：基线三步重跑。
验证：仓库锁定工具链重跑三步；范围内对象（宪法/checklist/AGENTS/CLAUDE/README/CONTEXT/ADR/父材料/本任务材料）逐对象 lint 为 0。
通过：三计数不上升、范围内 0 条。
失败：任一计数上升；或范围内仍有红；或用 npx 口径凑数。
证据：三步退出码与计数实测。

- [ ] **AC-GOV-006**：任务记录路径守卫保持 0 FAIL。
场景：守卫重跑。
验证：运行路径守卫。
通过：PASS、0 FAIL。
失败：FAIL 大于 0；或放宽守卫表凑绿。
证据：守卫退出 0。

- [ ] **AC-GOV-007**：verify-structure 退出 0；CONTEXT.md 补第五阶段 test-acceptance 别名、三处 runtime 路径措辞改写；守卫脚本零改动。
场景：结构守卫重跑。
验证：运行结构守卫；并用版本控制 diff 确认守卫脚本本身零改动。
通过：退出 0、守卫字节不变。
失败：仍有 FAIL；或改了守卫口径；或为清零删掉真实术语。
证据：守卫退出 0 + 守卫文件 diff 为空。

- [ ] **AC-GOV-008**：父材料 decision-log 用仓库锁定工具链报告 0 issues；X1–X14 复核表 14/14 无「仍矛盾」。
场景：父材料 lint 与更正核对。
验证：锁定工具链单文件 lint；X 复核表逐项对账。
通过：0 issues、14/14 通过、父材料未进 ignores。
失败：issues 大于 0；或用 npx 口径；或加 ignores 无理由。
证据：lint 退出 0、复核表。

- [ ] **AC-GOV-009**：父材料批次计数全文只有「10 个具名批次」一个口径；decision_hash 两个口径写清；聚合文件名以实际落盘为准。
场景：父材料全文 grep。
验证：数批次口径；核对 decision_hash 两值与落盘文件名。
通过：单一口径、两口径并列说明、文件名与落盘一致。
失败：仍出现「9 个批次」；或两口径混用。
证据：grep 记录与复核表行。

- [ ] **AC-GOV-010**：「prd.md 不是第五份材料」措辞落盘；当前材料集合仍 4 项；close 不要求 prd.md。
场景：措辞与常量核对。
验证：查 D-025③ 更正行；确认当前材料文件集合常量 = 4。
通过：措辞更正、常量不变。
失败：仍写「永不产出」；或常量变 5 项。
证据：父材料对应段与常量 grep。

- [ ] **AC-GOV-011**：npm test 改为显式分组；分组映射证明并集覆盖原 258 文件；CI 逐组调用；test:exclusive 语义保留；CI 不劣化。
场景：脚本与 CI 配置核对。
验证：读 scripts 与 CI diff；逐组 collect 计数并集核对。
通过：映射 + 覆盖证明齐、CI 变绿语义不劣。
失败：仍可无范围全量；或未证明覆盖；或 CI 变红。
证据：scripts/CI diff 与分组计数记录。

- [ ] **AC-GOV-012**：每个点名文件有改前/改后行数实测与净值；净值为正写明理由。
场景：净增减申报核对。
验证：wc 改前改后对比。
通过：逐文件有实测净值。
失败：只写预计；或正值无理由。
证据：净增减账行。

- [ ] **AC-GOV-013**：代码侧改动面恰为 close 收敛面（六处落盘点 + 读取面）+ 四条修复的五个 runtime 文件 + package.json + CI 配置；确认凭证与 plan hash 校验保留；五动作结果有 close_action 落点。
场景：改动清单比对。
验证：改动文件清单与本条比对；确认人确认凭证与 plan hash 校验仍在；close_action 行落点存在。
通过：无清单外生产行为改动；三边界全守。
失败：清单外改动；或半删状态；或删掉确认凭证/校验。
证据：改动清单 diff 与 close 测试。

- [ ] **AC-GOV-014**：无关 specs 目录的窄 ignores 写明理由与 owner；其余 lint 逐条修；父材料不在 ignores。
场景：lint 配置 diff 核对。
验证：读 ignores 新增条目；核对每条附理由与 owner。
通过：窄条目有理由与 owner、父材料未进表。
失败：无理由/owner；或把父材料加进 ignores。
证据：配置 diff。

- [ ] **AC-GOV-015**：六类边界与四条新增非目标、零延期项在材料中具名落盘。
场景：与 decision-log §3 对账。
验证：逐项核对材料非目标节与延期节。
通过：逐条在册、延期为空集。
失败：出现延期项；或六类缺项。
证据：材料节文本。

- [ ] **AC-GOV-016**：hash 用法清单覆盖 tracked 全集；每条含路径行号、类别（身份绑定/完整性校验/过程化产物）、处置、理由、绑定对象；本任务删治理文字侧与过程化产物类；身份与完整性类只登记。
场景：清单逐条核对。
验证：用唯一权威扫描口径复算——git ls-files 取 tracked 全集（扩展名 *.mjs/*.js/*.cjs/*.json/*.jsonc/*.yaml/*.yml/*.md，含 .github 下全部），对全集逐条 grep 匹配 sha256、SHA256、hash、digest 四模式，清单条目与扫描输出逐项对账；与任务Ⅱ 删失效链重叠的条目以任务Ⅱ 结果为准、不重复删；本任务不新增任何 hash 字段或校验。
通过：无缺项、五要素齐、处置与理由自洽、无新增 hash。
失败：清单缺项；误删身份绑定类；新增 hash 字段。
证据：清单与扫描复算记录。

### 四条修复验收

- [ ] **AC-FIX-001**：写侧两处回退改用该 stage 的 scope 指纹；新增窄回归测试覆盖 make-decision 与 build-spec 行指纹路径并通过；两类历史行分轨处置——受害任务（PaperBuilder）的历史坏行如实登记为不可恢复、字节未改写、不重跑，本任务自己的 stage 行按 decision-log §13.5 作为现场标本：修复后重跑该 stage end 必须可读回、最后一次材料记账在最后一次 run 之前。
场景：无 stage outcome 的 stage end 读回。
验证：跑新回归测试与既有行相关用例；修复后重跑本任务 stage end 并复算行指纹 = 该 stage scope 指纹。
通过：新测试与既有用例全绿、本任务行读回不报 stale、受害历史行登记在册且字节未动。
失败：仍回退整集指纹；或无新测试；或受害历史行被改写/迁移/重跑；或本任务行在修复后仍读不回。
证据：测试记录、读回输出、登记段。

- [ ] **AC-FIX-002**：结果文件名不等于旧命名规则的审查记录（如验收形态记录）被内容绑定模型接受，不再抛路径身份错误、不再 exit 1。
场景：消费旧审查记录。
验证：跑新用例（非旧命名形态 result 仍被接受）与既有审查路由用例。
通过：内容绑定成立即接受；既有用例全绿。
失败：仍按文件名判身份；或 exit 1 复现。
证据：测试记录。

- [ ] **AC-FIX-003**：analyzer 门槛不成立时返回结构含显式 skip 事实；被固化的旧期望用例同步更新而非放宽断言。
场景：heading-less decision-log 用例。
验证：跑接线用例，断言返回结构有 skip 事实。
通过：skip 事实存在、用例期望更新且语义更严。
失败：仍静默跳过；或靠放宽断言凑绿。
证据：测试记录。

- [ ] **AC-FIX-004**：direction_change 类 finding 可判 fixed 并通过处置校验；fixed 处置必须与当前材料修订绑定（处置记录引用修复后的材料 revision，旧修订下重放不成立）；被固化的旧期望用例同步更新。
场景：材料修复后的 finding 收场。
验证：跑路由用例与处置校验用例，断言 fixed 处置携带当前材料修订绑定。
通过：fixed 判通过且绑定当前修订、用例期望更新。
失败：仍无终态；或新增状态字面量；或 fixed 处置不绑定材料修订。
证据：测试记录。

### 双证验收

- [ ] **AC-ACC-001**：C1 具名删除清单逐项不存在且每项附无真实 consumer 证据；白名单对象不在删除面。
场景：静态净减法逐项。
验证：逐项存在性检查 + 证据核对。
通过：清单来自任务Ⅰ 归档、逐项通过、白名单完好。
失败：清单自造；任一项仍存在；证据只有「没人 import」；白名单被删。
证据：逐项检查记录。

- [ ] **AC-ACC-002**：M1–M5 逐项有判定；劣化项有具名归因；历史任务结论逐项对照不平均。
场景：M1–M5 对照。
验证：消费任务Ⅰ 归档 C0 口径表逐项判。
通过：每项有判定或 unknown。
失败：任一项无判定；或劣化写成不劣化；或直接平均。
证据：对照表行。

- [ ] **AC-ACC-003**：三个合并提交 numstat 合计为负；SHA 写实测值；单任务豁免写明。
场景：净减账复算。
验证：三条首父 numstat 命令复算。
通过：合计小于 0、口径写明。
失败：合计大于等于 0；或占位符未解析。
证据：三条命令输出。

- [ ] **AC-ACC-004**：M1/M2 有复测值或 unknown + 缺什么说明。
场景：M1/M2 口径。
验证：核对材料登记。
通过：如实 unknown 且引任务Ⅰ 出处。
失败：无命令/出处声称复测。
证据：登记行。

- [ ] **AC-ACC-005**：链路验收三步在本任务材料与 store 上全过且重放不新增行；不新开真实任务。
场景：链路三步。
验证：status 读回 + 二次写入计数不变。
通过：三步全过、计数不变。
失败：任一步失败；或声称跑了真任务；或重放产生重复行。
证据：读回与计数记录。

- [ ] **AC-ACC-006**：unknown 清单显式登记（至少 token 维度、M1/M2 历史出处、本验收自指）。
场景：清单核对。
验证：读 unknown 节。
通过：三项齐、无一项写成通过。
失败：清单为空；或某项被写成通过。
证据：材料节。

- [ ] **AC-ACC-007**：净增减账含 CI 授权表与测试矩阵的新增代码。
场景：账本核对。
验证：逐行读账本。
通过：适配代码在账。
失败：只算生产代码。
证据：账本行。

- [ ] **AC-ACC-008**：异源复核由非本任务主会话、独立上下文、不同底层模型产出；两条轨分开记录；不可用如实登记不折算通过。
场景：复核记录核对。
验证：读两份复核记录的 provider/身份/结论字段。
通过：异源属实、双轨分立、结论带具名证据。
失败：自审自判；同源复核；unavailable 写成通过。
证据：两份复核记录。

- [ ] **AC-ACC-009**：每项验收结论可被第三方用同一条命令复算出同一数。
场景：抽三项复算。
验证：按账中命令重跑。
通过：三个抽项复算一致。
失败：结论依赖未写死口径。
证据：复算记录。

- [ ] **AC-ACC-010**：逐条阻塞账落盘——51 条 X 逐条处置 + 现场四条逐条 + 八类扫描结论；每行六要素（ID / 现象 / 根因 / 修复 / 验证命令 / 证据）；八类每类有防护与 owner；纳入判据与排除项写明。
场景：账本与 decision-log §10.2 对账。
验证：按分段前缀逐段计数（各段 grep 后相加 = 51 + 4）并抽五行核对六要素；核对八类行各有防护与 owner。
通过：行数与要素齐、无一行缺证据、无一类缺 owner。
失败：只列一部分；某行缺命令或证据；某类无 owner；把 51 写成连续编号。
证据：账本行与计数记录。

### 执行纪律与开工门禁

- [ ] **AC-EXE-001**：build-code / verify-code 执行记录含 actor、command、exit_code、结论摘要；重读量动作的 actor = 子代理；无新增对象。
场景：执行记录审计。
验证：抽五条重读量动作记录核对四要素。
通过：四要素齐、actor 正确。
失败：可事后补写；或主会话自己跑全仓扫描。
证据：执行记录。

- [ ] **AC-EXE-002**：build-code 开工前任务Ⅱ 合并提交是 HEAD 祖先（实测 SHA）；等待期范围比较只允许本任务 specs 目录与任务 store 变化。
场景：开工核对。
验证：祖先校验命令 + 范围比较命令。
通过：两命令均成立。
失败：未合并即改仓库文件；或等待期有范围外改动。
证据：两命令输出。

## 12. 风险、未决与交接

- **RISK-01**：任务Ⅱ 长期不合入导致 build-code 无法开工。
  - 受影响 ID：FR-EXE-002 / AC-EXE-002
  - 触发条件：任务Ⅱ 合入持续延迟
  - 后果：交付时点延后
  - 缓解或 STOP：只记事实不擅自行动；到期由用户重新裁定（G1）
  - 处理 Stage：build-spec 后全程
  - 验证：每次会话的核对记录
- **RISK-02**：四条修复与任务Ⅱ 在途改动冲突。
  - 受影响 ID：FR-FIX-001 ~ FR-FIX-004
  - 触发条件：并行改动同文件
  - 后果：返工
  - 缓解或 STOP：build-code 等任务Ⅱ 完全合并 + 祖先校验
  - 处理 Stage：build-code
  - 验证：开工校验记录
- **RISK-03**：hash 清单误删身份绑定类导致记录绑定失效。
  - 受影响 ID：FR-GOV-018 / AC-GOV-016
  - 触发条件：分类错误
  - 后果：K2/K5 绑定失效、记录不可读
  - 缓解或 STOP：反例写死；身份/完整性类只登记；STOP = 任一行误删即失败
  - 处理 Stage：build-code
  - 验证：清单复算 + 抽样绑定测试
- **RISK-04**：npm/CI 改动引入回归。
  - 受影响 ID：FR-GOV-011 / AC-GOV-011
  - 触发条件：分组映射错误或 CI 配置错误
  - 后果：CI 变红
  - 缓解或 STOP：判据 = 不劣化；test:exclusive 语义保留
  - 处理 Stage：build-code
  - 验证：分组覆盖证明 + CI 结果
- **RISK-05**：窄 ignores 被读成掩盖问题。
  - 受影响 ID：FR-GOV-015 / AC-GOV-014
  - 触发条件：ignores 条目无理由或 owner
  - 后果：假绿
  - 缓解或 STOP：每条必附理由与 owner（撞 F9 即失败）
  - 处理 Stage：build-code
  - 验证：配置 diff 审查
- **RISK-06**：父材料更正改变其整文件哈希、与历史确认值不一致。
  - 受影响 ID：FR-GOV-014 / AC-GOV-008
  - 触发条件：X1–X14 更正落盘
  - 后果：历史绑定值不可复现（X4 已登记的既有事实）
  - 缓解或 STOP：只更正内容不伪造历史；两口径写清
  - 处理 Stage：build-code
  - 验证：复核表与 decision_hash 说明
- **RISK-07**：四条修复改变现有测试期望。
  - 受影响 ID：FR-FIX-003 / FR-FIX-004
  - 触发条件：修复触及固化旧行为的断言
  - 后果：测试红
  - 缓解或 STOP：变更显式登记（附录 B）；不得放宽断言凑绿
  - 处理 Stage：build-code
  - 验证：附录 B 与测试记录
- **RISK-08**：provider 限流或不可用导致复核事实不完整。
  - 受影响 ID：FR-ACC-008 / AC-ACC-008
  - 触发条件：RATE_LIMITED 等
  - 后果：复核 partial / unavailable
  - 缓解或 STOP：如实登记、不判通过、不阻断同任务修复
  - 处理 Stage：verify-code
  - 验证：复核记录的错误码与耗时

- **OPEN-001**：缺陷 2 的历史实例回归样本尚未逐对复算（PFACT-14）。
  - 受影响 ID：PFACT-14 / FR-FIX-002
  - owner：build-code 主会话（子代理执行复算）
  - 影响：修复后回归样本覆盖面
  - 处理 Stage：build-code
  - 关闭条件或 STOP：在权威任务根下完成逐对复算并登记；复算不可行则登记 unknown 与原因
- **OPEN-002**：八类分类学逐类扫描可能带出新阻塞项（D-003 已登记的「当前不可知」）。
  - 受影响 ID：FR-ACC-008 / RISK-08
  - owner：build-code 主会话
  - 影响：阻塞账行数
  - 处理 Stage：build-code
  - 关闭条件或 STOP：扫描结论落账（无新项或逐项登记处置）；发现需方向改变的新类时 STOP 并回用户裁定

**spec-clarify**：trigger=false；理由：24 条 OI 全部终态、16 条决定已经用户确认，本规格无方向改变级歧义；开放方向性问题：0。

**交接给 build-plan**：批次顺序（四条 → C7 → C8 → 执行纪律核对）、两条测试期望变更（附录 B）、开工门禁（AC-EXE-002）、对照表固定清单（AC-GOV-004）、hash 清单扫描口径（AC-GOV-016）均已写死；build-plan 不得重开方向，只需排布与细化。

## 13. 业务影响与回归范围

### 五阶段命令行为

- **既有行为**：status / run / confirm / review / authorize 七类公共入口各自有既有语义。
- **本需求影响**：收口读回不再误报 stale；旧审查记录可消费；阶段末 analyzer 有显式 skip 事实。
- **回归路径**：五阶段命令在受影响任务上各跑一次；stage 行读回；审查事实读回。
- **验收**：AC-FIX-001 ~ AC-FIX-004、AC-ACC-005。

### 测试入口与 CI

- **既有行为**：npm test 是无范围全量；CI 直接调用它。
- **本需求影响**：入口改显式分组；CI 逐组调用。
- **回归路径**：分组并集覆盖证明；CI 一次完整运行。
- **验收**：AC-GOV-011。

### 治理文档面

- **既有行为**：宪法 1.8.0 / 22 条；CONTEXT 第五阶段无 test-acceptance 别名；多处文档与代码漂移。
- **本需求影响**：宪法 1.9.0 表述修订 + 治理节新增条款组；CONTEXT 两处修正；对照表清零。
- **回归路径**：verify-structure、路径守卫、markdownlint 三步 + 对照表逐行。
- **验收**：AC-GOV-001 ~ AC-GOV-010。

### close 流程

- **既有行为**：多文件计划对象分散落盘。
- **本需求影响**：收敛为一次性展示；五动作落 close_action 行；凭证与校验保留。
- **回归路径**：close 前置检查与五动作测试。
- **验收**：AC-GOV-013。

- **可能受冲击的业务规则**：条目数 22 不变、行字段 16 键冻结、守卫口径不可改、计数基线不上升。
- **明确无影响**：wh-review 的 per-stage 审查标准与 prompt（E-18）；宿主 / broker 仓外能力（E-17）；3rd-review 跨仓判死逻辑；历史任务的其余记录。

## 附录 A：治理文本改前改后对照草案（G2-A）

> 本附录是 G2-A 的草案，build-code 照此落地；改前原文为开工 HEAD 实测文本，改后是提案措辞。宪法实际行号以 build-code 当时重读为准（冻结前行号已实测：F3 定义句在 28 行附近、F6 正例在 51 行附近）。

### A-1 宪法 F3 定义句（改前 → 改后）

- **改前**：「task/worktree/runtime 身份、hash、顺序与核心 publication 结构错误必须在写成功前 fail-loud。」
- **改后**：「task/worktree/runtime 身份、顺序与核心 publication 结构错误必须在写成功前 fail-loud。」
- **说明**：删去「hash、」三字；身份与结构仍 fail-loud，符合 D-009 与 R-019（宪法不再要求 hash，代码侧现有校验不因此构成矛盾）。

### A-2 宪法 F6 正例（改前 → 改后）

- **改前**：「每次调用把 run、stage、已核验的 WorkflowHub 提交和合同内容校验值写入 create-only 记录，任务清单只保存业务身份与执行模式。」
- **改后**：「每次调用把 run、stage、已核验的 WorkflowHub 提交写入 create-only 记录，任务清单只保存业务身份与执行模式。」
- **说明**：删去「和合同内容校验值」；F6 定义句本就无该词，本次只改正例（行号以实测 51 行为准，PRD 记的 49 行为过期值）。

### A-3 宪法 F11 定义段追加（净减法 + 默认不新增 hash）

- **追加句**：「控制面净减法是硬规则：新增任何控制面之前，必须先评估删除或收敛既有对象能否以同等保护达成目标；能删不得增。默认不新增 hash：新引入的任何哈希字段、校验值或摘要，必须先证明其属于身份绑定或完整性校验的必要最小集，并把证明写进材料；过程工程化产物类的哈希一律不新增。」
- **说明**：落在 F11 定义段末尾同段；不新增条目、不动四段结构。

### A-4 宪法治理节新增「负向条款（已裁定不采纳，永不复用）」

- 草案条款组（治理节内，非第 23 条）：以下 15 条方案已裁定不采纳、不得在未来的改动中复活——
  1. workflowhub-followup-tasks 整体方案；2. 统一 canonical writer + 原子更新 index / facts / verify；3. 终态状态机 completed_with_quality_unavailable；4. behavior / governance digest 分层；5. executable compiler / contract report；6. command fingerprint + active-attempt lock / doctor --stage / execution-ledger；7. 依赖闭包 freshness 保留缩窄；8. 每 Phase 审到 findings 清零；9. review 轮次预算 + 人工放行；10. 新建 runs.jsonl；11. 自动统计控制面数量的检查器；12. 硬拦截一张卡最多改 N 个文件；13. 卡文件数之外的延期处理；14. 为历史任务补质量验收；15. 迁移历史 task-store / 兼容桥 / 双写。
- **owner**：宪法治理节；**核对点**：与母材料拒绝方案表 15 行逐条对账（AC-GOV-003）。

### A-5 宪法治理节新增「阻塞分类学常驻规则」

- 草案条款组：八类阻塞 = 事实/状态类、门禁/流程类、依赖外部类、新鲜度/身份类、编排/上下文类、工程/测试类、交付/收口类、治理/增殖类。任何新登记的阻塞必须先归入八类之一，并在同一处登记该类对应的防护与 owner；归不进任何一类的，必须先扩表再登记。本任务收口时八类各有防护与 owner 的登记行。
- **核对点**：与 decision-log 阻塞账的八类行一致。

### A-6 宪法负向条款旁「守卫三要件」

- 要件一（登记字段）：任何新控制面必须登记职责、真实 consumer、owner、测试、删除或保留条件与替代关系，并自陈净增减。
- 要件二（违反后果）：未登记的新控制面 = 对应用户确认点不通过。
- 要件三（范围与自适性）：适用本任务及后续三个任务的每次改动，含本规则自身的自指。

### A-7 版本与记录同步（升版四件）

- 版本行改前：`Version: 1.8.0 | **Ratified**: 2026-06-22 | **Last Amended**: 2026-09-09`；改后：Version 1.9.0、Last Amended 2026-09-12（以 build-code 当日为准）。
- 修订记录新增一条：「1.9.0（日期）：修订 F3（写边界不再要求 hash）、F6（正例不再写合同内容校验值）、F11（增写控制面净减法与默认不新增 hash 硬规则）；治理节增写负向条款（15 条已裁定不采纳）、八类阻塞分类学常驻规则与守卫三要件；条目数仍为 22。来源：任务Ⅲ C7 治理同步（用户确认 G2-A 措辞）。」
- 旧→新映射段追加：「1.8.0 → 1.9.0 保留 22 条宪法条目和原编号；F3/F6/F11 仅修订表述，负向条款与分类学为治理节新增条款组，不构成第 23 条。」
- checklist：主 22 条不动；文件末尾新增非条款区对照项「负向条款与八类分类学对照」（绑定治理节条款组，不占条目数）。

### A-8 CONTEXT.md 两处修正

- 第五阶段别名改前：「概念别名：独立代码审查（code-review）。」改后：「概念别名：独立代码审查（code-review）；验收（test-acceptance）。」
- 三处 runtime 路径措辞改写（守卫 denylist 词边界触发，守卫不动）：把阶段运行目录下 stage 子目录的 current-close-projection 模块、review 子目录的 stage-materials 清单、stage 子目录的 completion-predicates 谓词模块三处路径写法，改写为「阶段运行目录下的某模块」式描述措辞（冻结前实测行号 87 / 411 / 414，build-code 落笔时按当时文本重读）。

## 附录 B：四条修复的测试期望变更登记（decision-log §4.4 硬约束 2）

- **登记-1（对应 FR-FIX-003 / AC-FIX-003）**：spec-analyze 接线用例中「heading-less decision-log 下仍返回 ok 且 consistent」的期望改为「返回结构含显式 skip 事实」；该用例当前固化的是静默跳过行为，变更后语义更严（可区分没跑与跑过）。
- **登记-2（对应 FR-FIX-004 / AC-FIX-004）**：冻结分类预算协议用例中「direction_change + fixed 判不通过」的期望改为「判通过」；只此一处路由语义变化，无新状态字面量。
- 两条登记的共同纪律：期望值变更随代码改动同批提交、在批次说明中点名；不得通过放宽断言的其它部分凑绿。
