# 功能规格：让完整有限检查真正接线生效

读者：build-code 实施者、verify-code 终末验收者、独立审查者与用户。

读完要能：定位本次要修的三类检查、17 条来源与 E-1…E-10 的逐项处置、N9 接口边界、F 块流程修复，以及每条验收判据的真实命令与失败条件。

- **功能名**：让完整有限检查真正接线生效（N10）
- **来源**：`specs/n10-finite-check-wiring-20261020/decision-log.md` 的 R-001…R-027、U-001…U-029、D-001…D-025、AC-CHECK-1…AC-PROCESS-8；父 PRD `specs/archive/skills-framework-redesign-20261014/prd.md` 的 N10 节与「已知既有红」节；ADR-0052。
- **状态**：草稿，待当前计划真实确认。确认前不进入 build-code。
- **任务路线**：复杂五阶段，worktree `workflowhub-n10-finite-check-wiring-20261020`，分支 `task/workflowhub/n10-finite-check-wiring-20261020`。

本类 P0 必留内容如下。该表是当前模板的人读选节指引，不是第二套必填结构清单。

| 必留内容（P0） | 本文件落点 | 状态 |
| --- | --- | --- |
| 目标场景与需求 | 1、3、5 节 | written |
| 全局实现设计与边界 | 实现设计（全局权威） | written |
| 唯一 Appendix A 的成功/失败/证据 | Appendix A | written |
| 真实测试表面与排除 | 测试标准、验收对象 | written |
| 关键依赖、风险、来源 | 来源与决策映射、12 节、Appendix C | written |

## 速读卡（30 秒）

- **一句话需求**：把仓库里已有但没真正生效的检查、来源登记、材料合同与方法规则接到真实消费者，给维护者一条可重跑的完整有限集合；N9 已合入，本卡只复验并接线，不把合并当已完成。
- **核心改动点**：
  - 三个 CLI 能区分合法、零输入、坏输入与真实违规；干净 index 模板不再永久误报。
  - 来源检查从「只看形状」扩到版本、声明、vendored 字节、退役投影与 capability decisions；只报告。
  - 材料合同接进总检查，只查显式材料根；轻档报「不适用」，伪轻档报真缺。
  - 17 条来源与 E-1…E-10 逐项处置；figure-it-out 落到 verify-code 检查可信度。
  - 复杂路线方向审在文本上先于模块收敛；N8 交付漏项修齐；N9 相关项保持未完成直到合入。
- **最大影响面**：`tools/cli` 三个检查入口、`runtime/stage/stage-content-contracts.mjs` 的只读复用、`skills/catalog.yaml`/声明/复用索引、`workflows/{make-decision,verify-code}` 与 N8 文档。
- **验收信号**：40 条 AC 中 34 条有机器可重放命令、6 条只给人工读回（METHOD 1–4、PROCESS 6/7）；17+E 表每行有处置；不新增 gate、第二权威或公共命令；N9 已合入，但 AC-SET-3、AC-SET-6 在复验执行前如实 `incomplete`。

## 来源与决策映射

本节只保存 ID 关系，不复制 decision-log 正文。每条 FR/AC 都能回到本表。

| 来源 ID | 决定 ID | FR / AC | 状态 / 受影响范围 |
| --- | --- | --- | --- |
| R-001 | D-001/D-002 | FR-CHECK-001…FR-SET-008 / AC-CHECK-1…AC-PROCESS-8 | current；总目标与分工 |
| R-002 | D-004 | FR-CHECK-001、FR-SOURCE-001、FR-MATERIAL-001 / AC-CHECK-1、AC-SOURCE-1、AC-MATERIAL-1 | current；复用面 |
| R-003 | D-006/D-007/D-008 | FR-CHECK-001…003、FR-SOURCE-001 / AC-CHECK-1…AC-CHECK-3、AC-SOURCE-2 | current；异常分诊 |
| R-004 | D-013 | FR-SET-003 / AC-SET-2 | current；figure-it-out |
| R-005 | D-002/D-018 | FR-CHECK-001…007、FR-SOURCE-001…006 / AC-CHECK-1…AC-PROCESS-8 | current；验收形状 |
| R-006 | D-004 | FR-CHECK-001、FR-SET-004 / AC-CHECK-1、AC-SET-3 | current；ORACLE 子域 |
| R-007 | D-001 | FR-SET-004、FR-SET-007 / AC-SET-3、AC-SET-6 | current；N9 依赖 |
| R-008 | D-004 | FR-SET-004、FR-SET-007 / AC-SET-3、AC-SET-6 | current；一次闭合 |
| R-009 | D-014 | FR-SET-005 / AC-SET-4 | current；验收不外包 |
| R-010 | D-004/D-005 | FR-CHECK-001、FR-SOURCE-001 / AC-CHECK-1、AC-SOURCE-1 | current；写主与复用 |
| R-011 | D-013 | FR-SET-003 / AC-SET-2 | current；必读与新增 |
| R-012 | D-004、D-026 | FR-CHECK-007 / AC-CHECK-6 | current；检查自身缺陷与既有红清零 |
| R-013 | D-004 | FR-SET-001 / AC-SET-1 | current；不可后置 |
| R-014 | D-004 | FR-CHECK-001、FR-MATERIAL-001 / AC-CHECK-1、AC-MATERIAL-1 | current；最小读取集 |
| R-015 | D-001/D-004 | FR-CHECK-001…FR-PROCESS-008 / AC-CHECK-1…AC-PROCESS-8 | current；五阶段产出 |
| R-016 | D-004 | FR-SET-001、FR-SET-002 / AC-SET-1 | current；有限集合口径 |
| R-017 | D-002/D-018 | 全部 Phase 的独立验收 / AC-CHECK-1…AC-PROCESS-8 | current；边做边验 |
| R-018 | D-003 | FR-MATERIAL-006、FR-SET-001 / AC-MATERIAL-5、AC-SET-1 | current；内容缺口由 N10 补 |
| R-019 | D-005 | FR-SOURCE-004、FR-SOURCE-005 / AC-SOURCE-4 | current；pointer-only |
| R-020 | D-015 | FR-SET-006 / AC-SET-5 | current；G1 覆盖 |
| R-021 | D-016 | FR-PROCESS-001…003 / AC-PROCESS-1…AC-PROCESS-3 | current；方向审前置 |
| R-022 | D-017 | FR-PROCESS-004 / AC-PROCESS-4 | current；N8 漏项 |
| R-023 | D-018 | FR-PROCESS-001…008 / AC-PROCESS-1…AC-PROCESS-8 | current；F 独立验收 |
| R-024 | D-021 | FR-PROCESS-004 / AC-PROCESS-4 | current；P7 不再跑 |
| R-025 | D-022 | FR-PROCESS-008 / AC-PROCESS-8 | current；审查根因与复验 |
| R-026 | D-023 | FR-SOURCE-007 / AC-SOURCE-6 | current；13 条原文 |
| R-027 | D-024 | FR-SET-007 / AC-SET-6 | current；N9 后复验 |

### 用户答复落点

| 来源 ID | 答复要点 | 落点 | 处置 |
| --- | --- | --- | --- |
| U-001 | 先读 PRD 的注意事项与验收标准 | R-001…R-016、A–F | 过程指令；已落到 56 行索引 |
| U-002 | 每张卡边做边验证 | R-017、全部 Phase | 过程约束；各 Phase 自带合法/负例/恢复 |
| U-003 | 外部引入内容逐项考虑、不遗漏 | R-011、R-016、Appendix B | 过程约束；17 行与 E 表逐项处置 |
| U-004 | 建 worktree、从 make-decision 起、不跳阶段 | D-001、本文件路线 | 过程约束；已执行 |
| U-005 | 调研、大纲、扩散、收敛、方案、验收六段 | R-001…R-016、批次 1–18 | 过程指令；载体为 decision-log 与 r1–r10 |
| U-006 | 大白话、提问工具、选项写后果、不用内部 ID | 用户可见汇报与提问 | 过程约束；不产生产品 AC |
| U-007 | 重活交子代理；方向/细节审各一次 | r1–r10、两次 partial 审查 | 过程约束；审查只做一次，已记录 partial |
| U-008 | N1–N8 完成、N9 在开发（后续 2026-10-21 已合入 `b8856e5e`） | PFACT-002、FR-SET-004 | 事实；N9 已合入 |
| U-009 | 内容缺口由 N10 直接补 | D-003、FR-MATERIAL-006 | 决定；已落内容补缺口任务 |
| U-010 | 五块与顺序 | D-004、P1–P5 | 决定；Phase 顺序 |
| U-011 | 连 pointer-only 也补 | D-005、FR-SOURCE-004 | 决定；B 块处置表 |
| U-012 | 报告只留屏幕、需要时重定向 | D-006、FR-CHECK-001 | 决定；不新增报告文件 |
| U-013 | 空输入报事实但退出 0 | D-007、AC-CHECK-2、AC-SOURCE-3、AC-MATERIAL-3 | 决定；只改文案不改 0/1 |
| U-014 | pointer-only 先诚实化，确有需要才加读者 | D-008、FR-SOURCE-004 | 决定；无读者项标未完成 |
| U-015 | 材料检查只查当前任务或显式目录 | D-009、FR-MATERIAL-002 | 决定；`--material-root` |
| U-016 | 轻档报「不适用」 | D-010、FR-MATERIAL-003 | 决定；级别事实与伪轻档 |
| U-017 | 作者产物仍靠材料合同与人工 | D-011、FR-MATERIAL-005 | 决定；只查模板结构 |
| U-018 | 方法类只读回＋一次变异演示 | D-012、FR-METHOD-001/002 | 决定；D 块 |
| U-019 | figure-it-out 落检查可信度，收口只加指针 | D-013、FR-SET-003 | 决定；E 块 |
| U-020 | 重跑复用总检查，N9 加任务参数 | D-014、FR-SET-005 | 决定；E 块 |
| U-021 | 字节允许增加，写清理由 | D-015、AC-SET-5 | 决定；覆盖 G1 严格口径 |
| U-022 | 复杂先方向审，普通不变 | D-016、FR-PROCESS-001 | 决定；F 块 |
| U-023 | 新增第六块 F | D-018、FR-PROCESS-001…008 | 决定；P6 单列 |
| U-024 | 只重开被挑战模块 | D-019、AC-PROCESS-6 | 决定；重开清单为空 |
| U-025 | 用可用来源收口但保留 partial | D-020、AC-PROCESS-7 | 决定；不写全绿 |
| U-026 | P7 四路不再跑 | D-021、AC-PROCESS-4 | 决定；保留历史 incomplete |
| U-027 | 审查根因 N9 后复验 | D-022、FR-PROCESS-008 | 决定；AC-PROCESS-8 |
| U-028 | 联网抓 13 条原文 | D-023、FR-SOURCE-007 | 决定；已抓 13/13 |
| U-029 | N9 依赖项合并后逐项复验 | D-024、FR-SET-007 | 决定；AC-SET-6 |

## 1. 需求解释：问题与紧迫性

当前仓库已经有三个检查入口、材料合同校验、来源目录与方法规则，但多数只「有壳」：检查报告只进屏幕、没有第二个读者；来源检查只验形状；决策链恒退出 0；空输入与真的没有问题不可区分；干净 index 模板被永久误报；材料合同校验不在总检查里；17 条外部来源缺少逐项处置；N8 的流程文档还留下自相矛盾。

维护者今天无法用一条命令回答「这套检查到底能不能抓错」。不修的结果是：检查结果继续被误读成全绿，外部来源继续以假版本登记，N9 的十环即使合入也没有可核消费，流程顺序问题下次还会重演。

## 2. 背景、目标与范围

### 背景

三个检查入口已挂进 `run-checks`：`check-anti-host`、`check-metrics-schema`、`skill-static-deps`、`check-skill-consistency`、`check-stage-quality`、`check-decision-log-chain`。`check-skill-consistency` 已读目录、阶段依赖、wh-review 必留集与 5 个作者模板；`check-decision-log-chain` 定位为 advisory；`run-checks` 无参数串行；N9 合入后另接受唯一的 `--task-path <任务根>` 并只输出十环 JSON。`validatePostPhaseContract` 已有真实审查消费者，但没有接进总检查。N9 已于 2026-10-21 合入 main `b8856e5e`，`runtime/task/final-chain.mjs`、`runtime/task/final-chain-runner.mjs` 与 `--task-path` 已在本 worktree；N10 不再等 N9，只做复验与材料/参数接线。N9 收口同时把 N2/N8/N9 材料移入 `specs/archive/`，本卡引用的路径按归档后的真实文件重定。

### 目标

- 三个检查入口在合法、零输入、坏输入、真实违规四类输入上给出可区分且具名的事实。
- 来源检查覆盖版本、声明、vendored 字节、退役投影与 capability decisions；只报告，不改变公共 0/1。
- 材料合同接进总检查，只查显式材料根；轻档报「不适用」，伪轻档报真缺。
- 17 条来源与 E-1…E-10 逐项处置；figure-it-out 一处权威、收口只加指针。
- F 块把复杂路线方向审的书面顺序、材料版本、wh-review 合同与 N8 漏项修齐；不新增 gate。
- 维护者用现有总检查一次重跑；N9 已合入，build-code 对十环/两行/任务参数逐项复验。

### 范围内

- `tools/cli/check-skill-consistency.mjs`、`check-decision-log-chain.mjs`、`run-checks.mjs`。
- `runtime/stage/stage-content-contracts.mjs` 只读复用，不改行为。
- `skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md`、相关 `skill-bundle.json` 的登记读回。
- `workflows/verify-code/SKILL.md`、`skills/stage-reflection/SKILL.md`、`workflows/make-decision/SKILL.md`、`steps.json`、`skills/wh-review/contracts/make-decision.md`、N8 更正件/normal flow、ADR-0052。
- 17 行来源、E-1…E-10、figure-it-out、N9 接口与负例。

## 3. 用户场景与状态覆盖

### SCN-001：维护者跑三个检查，合法材料与真实违规可区分

- **角色**：维护者
- **前提**：当前 worktree 的目录、声明、阶段依赖与模板可读
- **触发**：`node tools/cli/check-skill-consistency.mjs --root "$PWD"`、`node tools/cli/check-decision-log-chain.mjs --file specs/n10-finite-check-wiring-20261020/decision-log.md`、`node tools/cli/run-checks.mjs`
- **结果**：合法输入不新增无关失败；临时放入一处真实违规时该检查点名并失败/告警；撤销后同字节复跑恢复
- **回写**：结果写入 `quality/tests/` 的原始输出，回写 Appendix A 的 AC-CHECK-1、AC-CHECK-4

### SCN-002：零输入不再像全绿

- **角色**：维护者
- **前提**：合法根下没有可判输入（decision-chain 根没有 decision-log；材料根为空；来源输入为空文件/空数组）
- **触发**：同上命令与空输入夹具
- **结果**：输出「没有输入，未检查」一类具名事实，退出 0；不出现「全部通过」「consistent」
- **回写**：AC-CHECK-2、AC-SOURCE-3、AC-MATERIAL-3

### SCN-003：坏输入给一句人话

- **角色**：维护者
- **前提**：不存在的文件、相对 root、未知参数、缺值
- **触发**：三类坏输入命令
- **结果**：一句人话点名问题，退出 1，不以原始堆栈为唯一输出；合法路径不回归
- **回写**：AC-CHECK-3

### SCN-004：来源登记与真实消费者对不上

- **角色**：来源维护者
- **前提**：catalog、notice、reuse-registry、bundle.sources、capability decisions 存在；figure-it-out/swarm/correct/encode 有缺口
- **触发**：consistency 检查与 17 行读回
- **结果**：每个缺口有名有位置；能补消费者的补最小读者，不能补的标未完成；不自动删除
- **回写**：AC-SOURCE-1…AC-SOURCE-6、Appendix B

### SCN-005：材料合同与轻档

- **角色**：材料作者、审查者
- **前提**：N8/N9 合法材料、N2 显式材料、轻档只有 decision-log、伪轻档缺 Phase
- **触发**：`run-checks --material-root <path>`
- **结果**：合法 0 error；N2 两处真错显式可见；轻档「不适用」；伪轻档报缺段；空根报没有输入
- **回写**：AC-MATERIAL-1…AC-MATERIAL-6

### SCN-006：方法规则读回与变异演示

- **角色**：独立审查者
- **前提**：测试/审查/收口方法已交付；有真实消费者
- **触发**：读回表 + 一次受控变异（同义反复/按实现重算）
- **结果**：每条有 path:line 消费者或「只给人工」；变异能被真实测试揭出，撤销后恢复
- **回写**：AC-METHOD-1…AC-METHOD-4

### SCN-007：17 条来源逐项处置

- **角色**：维护者、verify-code
- **前提**：17 行与 E-1…E-10 已在 decision-log 固定
- **触发**：读 Appendix B 与原始证据
- **结果**：每行恰好一种处置；有消费者或未完成原因；不把两组相加
- **回写**：AC-SET-1、AC-SET-2

### SCN-008：N9 十环接口

- **角色**：verify-code、后续维护者
- **前提**：N9 已合入（main `b8856e5e`）
- **触发**：`node tools/cli/run-checks.mjs --task-path <任务根>`
- **结果**：接口已可用，但仍由 build-code 按稳定键/顺序/退出/负例复验；未执行前 AC-SET-3/AC-SET-6 记 `incomplete`，不写已接线
- **回写**：AC-SET-3、AC-SET-6

### SCN-009：流程修复

- **角色**：下一张复杂任务的主会话
- **前提**：make-decision 第 5/7/8/9 步与 N8 文档
- **触发**：读 SKILL/steps/N8 更正件/normal flow/contract
- **结果**：第 8 步前有禁入句；第 5 步只问方向轴；普通方案审不再漏写；P7 仍未跑
- **回写**：AC-PROCESS-1…AC-PROCESS-8

### SCN-010：终末验收与字节

- **角色**：用户、verify-code
- **前提**：全部 Phase 产物可读
- **触发**：P7 原 36 条验收 + P8 追加 4 条验收与字节表
- **结果**：40 条 AC 逐条给档位（P7 36 条 + P8 追加 4 条）；N9 相关在复验执行前保持 incomplete；字节增减有理由与分母
- **回写**：AC-CHECK-1…AC-PROCESS-8、AC-SET-5

### SCN-011：磁盘有界性（追加）

- **角色**：用户、维护者、verify-code
- **前提**：2026-10-21 归属报告；任务库 3.06 GB/148,282 文件；PaperBuilder 不纳入
- **触发**：临时目录清理、任务预算、只读审计、review 写入
- **结果**：临时目录不新增；预算超限写前失败；审计只读分类；历史原件保真
- **回写**：AC-DISK-1…AC-DISK-4

### 状态覆盖清单

- [x] **默认态**：SCN-001 的合法检查
- [x] **空态**：SCN-002；合法根无可判输入
- [x] **错误态**：SCN-003；坏路径/坏参数/缺值
- [x] **加载态**：N/A — 三个检查是同步 CLI，无加载视图
- [x] **取消态**：N/A — 本卡不新增取消机制；审查取消事实仍按原记录保留
- [x] **边界态**：SCN-004/005；版本漂移、轻档/伪轻档、空来源
- [x] **权限态**：N/A — 不改变权限与认证；审查 provider 只读材料
- [x] **竞态**：N/A — 检查只读；共享文件按 P1→P2→P3 串行

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：三个检查入口与材料合同的当前行为、调用点、退出码与测试基线已实读。
  - **状态**：`verified`
  - **证据或来源**：`quality/evidence/build-plan-research/r8-code-implementation.md` §1–§6；关键 `tools/cli/check-skill-consistency.mjs:16,41-63,155-214,218-229`、`check-decision-log-chain.mjs:154,266-303`、`run-checks.mjs:114-172`、`stage-content-contracts.mjs:413-425`
  - **关联**：FR-CHECK-001…007、FR-SOURCE-001…006、FR-MATERIAL-001…007、AC-CHECK-1…AC-CHECK-6、AC-SOURCE-1…AC-SOURCE-6、AC-MATERIAL-1…AC-MATERIAL-6
- **PFACT-002**：N9 已合入 main `b8856e5e`（2026-10-21 08:57 +0800），`runtime/task/final-chain.mjs`、`final-chain-runner.mjs` 与 `run-checks --task-path` 已在本 worktree；本卡已实跑 `--task-path <N10 任务根>` 得到单份 JSON、10 环、exit 0。N10 的稳定键/负例复验尚未执行；N9 收口提交 `1e4df4b8` 把 N8/N2/N9 材料移入 `specs/archive/`。
  - **状态**：`verified`
  - **证据或来源**：`git log b8856e5e`、`node tools/cli/run-checks.mjs --task-path <N10 任务根>` 输出（10 环、`chain_state=unverified`、exit 0）、N9 归档 `specs/archive/n9-final-chain-verification-20261020/spec.md` FR-CHAIN-004
  - **负责人、影响**：N10 build-code；影响 FR-SET-004/007、AC-SET-3、AC-SET-6、P5 的 N9 任务
  - **关联**：FR-SET-004、FR-SET-007、AC-SET-3、AC-SET-6、RISK-01、OPEN-01
- **PFACT-003**：17 行与 E-1…E-10 的当前落点、消费者与缺口已逐项读回。
  - **状态**：`verified`
  - **证据或来源**：`r9-sources-content.md` §1–§2；`r4-seventeen-sources.md`
  - **关联**：FR-SET-001、FR-SET-002、AC-SET-1、AC-SET-2、Appendix B
- **PFACT-004**：13 条无原文来源已联网取得；pstack 采用内容对应 2026-10-14 快照，HEAD 有 4 份漂移。
  - **状态**：`verified`
  - **证据或来源**：任务库 `quality/evidence/source-originals/source-originals-index.md` 与 `.json`；快照 commit `1f0f9c3`
  - **关联**：FR-SOURCE-007、AC-SOURCE-6
- **PFACT-005**：两次审查均为 partial；根因 RC-1 调度等待、RC-2 输出解析、RC-3 顺序已记录。N9 合入后：RC-1 在代码/受控测试层已修（真实模型五窗口未验）；RC-2 未修（kimi 原始 stdout 为 ```json 围栏）；RC-3 由 N10 P6 设计承接。
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md`「审查问题根因」表与 D-025；`quality/evidence/direction-review-20261020/`、`detail-review-20261020/`；`specs/archive/n9-final-chain-verification-20261020/phases/P4-审查进展判定与-antigravity-真实读取.md`
  - **关联**：FR-PROCESS-007、FR-PROCESS-008、AC-PROCESS-7、AC-PROCESS-8
- **PFACT-006**：`validatePostPhaseContract` 已有三个只读消费者；对 N8 材料 `ok=true`，对 N2 材料有 2 条既有 error；对 N10 当前只有 decision-log。
  - **状态**：`verified`
  - **证据或来源**：`r8-code-implementation.md` §4；`stage-content-contracts.mjs:413-425,740-749`
  - **关联**：FR-MATERIAL-001…005、AC-MATERIAL-1…AC-MATERIAL-4
- **PFACT-007**：本任务没有 UI/前端表面；仓库无 `apps/`、无 `.tsx/.vue/.jsx` 页面改动。
  - **状态**：`verified`
  - **证据或来源**：`git ls-files` 与 r8 §0；本卡写集全部为 CLI/文档/测试
  - **关联**：测试标准的 UI 排除、验收对象的 CLI 分支
- **PFACT-008**：针对本任务的测试均可按文件定向运行；`package.json` 的 test:* 脚本受 `tests/contract/test-entry-grouping.test.mjs` 约束，不宜新增脚本。
  - **状态**：`verified`
  - **证据或来源**：`r8-code-implementation.md` §5；`package.json:7-19`、`vitest.config.mjs:17-38`
  - **关联**：测试标准、各 Phase 的 gate_cmd
- **PFACT-009**：N8 的根摘要、spec 三处摘要、normal 技能表 intake、31 矩阵降档与 P7 状态存在具名矛盾或漏项。
  - **状态**：`verified`
  - **证据或来源**：`r10-n9-f-block.md` §3；`workflows/make-decision/SKILL.md:195`、`specs/archive/n8-four-level-route-20261019/spec.md:31/98/285`、`flows/normal/SKILL.md` 的 `intake-decision-review` 行
  - **关联**：FR-PROCESS-004、AC-PROCESS-4
- **PFACT-010**：用户以 U-021/D-015 覆盖父 PRD G1 的严格「字节不增」，改为允许增加但写清理由与分母。
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md` D-015、U-021；`quality/evidence/decision-log-refs/talk-batches.md` 批次 11 题 18
  - **关联**：FR-SET-006、AC-SET-5、RISK-02
- **PFACT-011**：父 PRD 记载的 10 条既有红在当前基线不能按 10 条复现；2026-10-20 与 2026-10-21 两次实跑两个文件均为 3 failed / 47 passed / 1 skipped。用户 2026-10-21 明确不接受任何红，要求本任务清零；3 个红都在 `ocr-production-cutover.test.mjs` 的旧材料请求上，不由 OCR 生产代码造成。
  - **状态**：`verified`
  - **证据或来源**：`quality/tests/2026-10-20-n10-baseline-reds.output`、`quality/tests/2026-10-21-n10-post-n9-ocr-baseline.output` 与 `.exit`；父 PRD「已知既有红」节（7+3，注明原名未保留）；D-026
  - **关联**：FR-CHECK-007、AC-CHECK-6、OPEN-02、RISK-03、P1/T005
- **PFACT-012**：catalog 有 41 条 skills 与 73 条 capability decisions；唯一 vendored 字段 `content_sha256` 为 null；anysearch 脚本实算 sha256 已知；correct/encode 的 commit 与采用快照不符且 notice 缺失。
  - **状态**：`verified`
  - **证据或来源**：`r9-sources-content.md` §0、§3；`skills/catalog.yaml:243-249,155-172,1894-1910`；`THIRD_PARTY_NOTICES.md:16,47,49,68,70,102`
  - **关联**：FR-SOURCE-001…006、AC-SOURCE-1…AC-SOURCE-5、Appendix B
- **PFACT-013**：检查指名的内容缺口可能随 B/C 检查扩展而增加；本卡只补 17 行/E 项范围与检查点名的真实缺口。
  - **状态**：`unknown`
  - **证据或来源**：`decision-log.md` D-003、R-018/OI-005；`r9-sources-content.md` §4.2
  - **负责人、影响**：当前主会话；影响 FR-MATERIAL-006 与范围控制
  - **关联**：FR-MATERIAL-006、RISK-04、OPEN-03
- **PFACT-014**：N10 任务事实库当前有 1 行 build-plan 阶段行（`in_progress`，引用审查 003 与交接 004）；build-code/verify-code 行尚未写入。
  - **状态**：`verified`
  - **证据或来源**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n10-finite-check-wiring-20261020/facts.jsonl` 1 行、3,121 字节（2026-10-21 实读）；`r10-n9-f-block.md` 头部
  - **关联**：阶段收口、AC-SET-4 证据
- **PFACT-015**：R/U 唯一索引为 27+29=56 条，无缺号；decision-log 的四查「覆盖」行已更新为 27/29，requirement-index 的 G-6 仍写 23/25（以 decision-log 为准，索引待回写）。
  - **状态**：`verified`
  - **证据或来源**：`quality/evidence/decision-log-refs/requirement-index.md` 计数；`decision-log.md`「四查结论」覆盖行
  - **关联**：Appendix C、OPEN-04

## 5. 功能需求

### 检查内核与报告语义（CHECK）

- **FR-CHECK-001**：三个检查入口对合法输入给出具名、可读的事实；合法输入不新增无关失败；报告只走 stdout/stderr，需要留证时由调用者重定向。
  - **范围边界**：只改报告文本、退出分支与既有纯函数；不新增报告文件、JSON schema、第二读者。
  - **依据**：R-001、R-003、D-006；PFACT-001
  - **场景**：SCN-001
  - **验收**：AC-CHECK-1、AC-CHECK-5
- **FR-CHECK-002**：合法根下没有可判输入时，输出「没有输入，未检查」，退出 0；不得输出「全部通过」「consistent」或静默跳过。
  - **范围边界**：decision-chain 的根下无 decision-log；材料根为空；来源输入为空文件/空数组。缺 catalog 的 root 属于坏输入，不算零输入。
  - **依据**：R-003、D-007；PFACT-001
  - **场景**：SCN-002
  - **验收**：AC-CHECK-2
- **FR-CHECK-003**：不存在的文件、相对 root、未知参数、缺值等坏输入给一句人话并退出 1，不以原始堆栈为唯一输出。
  - **范围边界**：不改变合法输入与零输入的退出语义；不新增错误码枚举。
  - **依据**：R-003、D-007；PFACT-001
  - **场景**：SCN-003
  - **验收**：AC-CHECK-3
- **FR-CHECK-004**：决策链检查保持 advisory：链路告警只报告、退出 0；`run-checks` 不把其非 0 计入失败。
  - **范围边界**：只补具名事实与坏参数处理；不改 advisory 定位。
  - **依据**：R-003、D-006；PFACT-001
  - **场景**：SCN-001、SCN-003
  - **验收**：AC-CHECK-1、AC-CHECK-3
- **FR-CHECK-005**：决策链对 `D-*` 决定按实际出现的字段判形态，不再把所有 `D-*` 强制当 legacy；N10 自身材料的 92 条全假告警消除。
  - **范围边界**：只改形态推断；real legacy 材料仍按 legacy 四字段判。
  - **依据**：R-012、R-003；PFACT-001
  - **场景**：SCN-001
  - **验收**：AC-CHECK-1、AC-CHECK-4
- **FR-CHECK-006**：总检查无参数时仍走原六段聚合，退出 0/1 语义不变；新增段只在显式参数下运行。
  - **范围边界**：不要求 stdout 逐字不变；已列具名修复（D-* 误判、零输入提示）允许改变文本。
  - **依据**：R-003、D-007、D-009；PFACT-001
  - **场景**：SCN-001
  - **验收**：AC-CHECK-5
- **FR-CHECK-007**：本卡清零已知既有红：先复现 3 个失败，再把 `ocr-production-cutover.test.mjs` 的请求 materials 补到当前 allowlist；两文件最终 0 failed。不得删/弱化/跳过断言，不得放宽生产 allowlist；PRD 记 7+3 与实际 3 的差异如实记录，不硬写 10。
  - **范围边界**：只改测试请求的 materials 与必要的夹具数据；不改 OCR 生产代码、不改 `ocr-delegation-route.test.mjs` 的断言、不把 skip 改成 pass；1 skipped 若仍存在须写原因。
  - **依据**：R-012、D-026；PFACT-011
  - **场景**：SCN-001、SCN-010
  - **验收**：AC-CHECK-6

### 来源与目录（SOURCE）

- **FR-SOURCE-001**：来源检查从只验形状扩到固定版本/坐标、声明覆盖、vendored 字节复算、退役投影与 capability decisions；全部只报告。
  - **范围边界**：复用 `check-skill-consistency` 的 reports 通道；不建来源注册表、不自动修、不预填坏引用数。
  - **依据**：R-002、R-019、D-005；PFACT-012
  - **场景**：SCN-004
  - **验收**：AC-SOURCE-1、AC-SOURCE-2
- **FR-SOURCE-002**：五类受控违规（删已采用项、改固定版本、删第三方声明、改 vendored 脚本一字节、把退役技能加回阶段依赖）各自报出具体条目/位置。
  - **范围边界**：只报告、不改公共 0/1；恢复同字节后报告消失。
  - **依据**：R-002、R-012；PFACT-012
  - **场景**：SCN-004
  - **验收**：AC-SOURCE-2
- **FR-SOURCE-003**：合法根下来源输入为空（空文件或 `skills: []`）报「没有来源输入，未检查」，退出 0；缺 catalog 的 root 仍按坏输入退出 1。
  - **范围边界**：不把空来源当「一致」；不改变正常来源检查。
  - **依据**：R-003、D-007；PFACT-001
  - **场景**：SCN-002
  - **验收**：AC-SOURCE-3
- **FR-SOURCE-004**：对只有指针、没有真实读者的登记，先改诚实指针或明确「上游坐标、本地无入口」；只有能指出维护者真实用途且不加读者无法验证的项，才在既有纯函数加最小只读检查。
  - **范围边界**：不建通用解引用器、来源注册表或第二权威；无读者项在 Appendix B 标未完成或不采用并写理由。
  - **依据**：R-019、D-005、D-008；PFACT-003
  - **场景**：SCN-004
  - **验收**：AC-SOURCE-4
- **FR-SOURCE-005**：补齐 figure-it-out、swarm、correct、encode、poteto、bundle.sources 等具名缺口：能补登记的补登记，假版本改真坐标，未采用项按 consumer-only 诚实登记。
  - **范围边界**：不重复登记已存在的 setup-ts；不写 absorbed 给未采用项；不复制索引权威。
  - **依据**：R-011、R-019、D-005；PFACT-012
  - **场景**：SCN-004
  - **验收**：AC-SOURCE-4
- **FR-SOURCE-006**：新增来源检查接进总检查后，公共 0/1 退出不变；新增常驻字节与删除重复可对账。
  - **范围边界**：只报告；不阻断既有流程；不新增第二报告权威。
  - **依据**：R-002、R-003、D-006；PFACT-012
  - **场景**：SCN-004
  - **验收**：AC-SOURCE-5
- **FR-SOURCE-007**：13 条无原文来源的原文、坐标、sha256、许可与可得性可回读；pstack 采用内容按 2026-10-14 快照，不把 HEAD 冒版本；原文不 vendored 进仓库。
  - **范围边界**：只读证据与索引；不改 catalog/notice 的采用范围；不复制原文进仓库。
  - **依据**：R-026、D-023；PFACT-004
  - **场景**：SCN-007
  - **验收**：AC-SOURCE-6

### 材料与写作（MATERIAL）

- **FR-MATERIAL-001**：把既有 `validatePostPhaseContract` 接进 `run-checks` 的显式材料段；合法材料 0 error，缺段报具名错误。
  - **范围边界**：只复用既有 validator，不改其行为；不新增材料发现规则；不写第二报告。
  - **依据**：R-002、R-003、D-009；PFACT-006
  - **场景**：SCN-005
  - **验收**：AC-MATERIAL-1、AC-MATERIAL-2
- **FR-MATERIAL-002**：材料根只来自显式 `--material-root`；无参数时不默认扫 `specs/`。N9 的 `--task-path` 是另一条已交付的独立模式，材料参数不得吞掉或重定义它；`--task-path` 与 `--material-root` 同时出现时给一句人话并 exit 1。
  - **范围边界**：不加全仓默认扫描；不新增第二套发现规则；不把 `--task-path` 降级成材料根的别名。
  - **依据**：D-009、D-025、U-015；PFACT-002、PFACT-006
  - **场景**：SCN-005、SCN-008
  - **验收**：AC-MATERIAL-1、AC-MATERIAL-3
- **FR-MATERIAL-003**：材料检查按任务级别分诊：轻档没有 spec/Phase 时明确报「这个级别不适用」，不报缺段、不静默跳过；伪轻档（声明轻档但有 spec/index 缺 Phase）报真缺。
  - **范围边界**：级别事实只来自 decision-log「级别与路线」的可读文本；读不到写 unknown 并按完整材料检查，不猜；不提供显式覆盖参数。
  - **依据**：D-010、U-016；PFACT-006
  - **场景**：SCN-005
  - **验收**：AC-MATERIAL-4
- **FR-MATERIAL-004**：空 spec、缺 L1、index 无指针行、空目录/空文件/缺省材料根分别报「缺什么」或「没有输入/不适用」，退出 0；不出现全绿。
  - **范围边界**：不把缺段报成通过；不把空输入报成缺段。
  - **依据**：R-003、D-007、D-010；PFACT-006
  - **场景**：SCN-002、SCN-005
  - **验收**：AC-MATERIAL-2、AC-MATERIAL-3
- **FR-MATERIAL-005**：写作检查（WR001 可靠层）继续只查模板的必留标题、占位与句长参考；作者产出的 spec/decision-log/PRD 由材料合同查结构、写作语义留人工。
  - **范围边界**：不扩到作者产物语义判断；不新增第二套必填清单。
  - **依据**：D-011、U-017；PFACT-001
  - **场景**：SCN-005
  - **验收**：AC-MATERIAL-6
- **FR-MATERIAL-006**：检查指名的真实内容缺口由本卡直接补齐并读回；补前逐项写「缺什么、补哪个文件、怎么验证、影响谁」。
  - **范围边界**：只补 17 行/E 项与检查点名的缺口；不重做已通过验收的内容；不扩成全仓文档整理。
  - **依据**：R-018、D-003；PFACT-013
  - **场景**：SCN-004、SCN-005
  - **验收**：AC-SOURCE-4、AC-MATERIAL-5、AC-SET-1
- **FR-MATERIAL-007**：干净 index 模板不再永久误报「缺纯指针边界」；真实 index 缺指针行仍报缺。
  - **范围边界**：只改检查器对模板占位的判定；不改 `validatePostPhaseContract` 行为；不删掉真缺检查。
  - **依据**：R-012、D-011；PFACT-001
  - **场景**：SCN-005
  - **验收**：AC-MATERIAL-5

### 方法读回与验证（METHOD）

- **FR-METHOD-001**：对已交付的测试/审查/收口/来源规则逐条给真实消费者证据（阶段步骤、依赖触发、人读读者与 path:line）；无消费者标未完成。
  - **范围边界**：只读回，不重写 N3/N7 已交付方法；不为凑数造检测器。
  - **依据**：R-015、U-018、D-012；PFACT-008
  - **场景**：SCN-006
  - **验收**：AC-METHOD-1
- **FR-METHOD-002**：做一次受控变异演示：把一处真实测试改成同义反复或按实现重算，真实测试/审查能揭出假绿；撤销后恢复绿。
  - **范围边界**：用真实测试文件与真实断言；不用注入缝/字符串变异充数；只做一次，注明覆盖上限。
  - **依据**：D-012、U-018；PFACT-008
  - **场景**：SCN-006
  - **验收**：AC-METHOD-2
- **FR-METHOD-003**：不能机判的规则明写「只给人工」，不伪装机器通过；能机判的给命令与证据。
  - **范围边界**：不新增状态词或第二套质量状态。
  - **依据**：D-012、D-011；PFACT-008
  - **场景**：SCN-006
  - **验收**：AC-METHOD-3
- **FR-METHOD-004**：correct/encode 的 notice、swarm 的登记在 B 块修复后读回；仍缺的标未完成，不读成已生效。
  - **范围边界**：只读回 B 的输出，不在 D 重复修。
  - **依据**：R-019、D-012；PFACT-012
  - **场景**：SCN-004、SCN-006
  - **验收**：AC-METHOD-4

### 17 条与最终集合（SET）

- **FR-SET-001**：17 行逐项给「已生效读回／本次接线验证／不采用及理由」之一，并附消费者或未完成原因。
  - **范围边界**：不把 17 行与 E 项相加；不只写名称；不冒充已生效。
  - **依据**：R-016、R-011；PFACT-003
  - **场景**：SCN-007
  - **验收**：AC-SET-1
- **FR-SET-002**：E-1…E-10 逐项给机制处置与真实消费者；与 17 行分开计数。
  - **范围边界**：同一 consumer 可被多行共用，不硬拆；不把 54 项再算作本卡交付数。
  - **依据**：R-016、R-004；PFACT-003
  - **场景**：SCN-007
  - **验收**：AC-SET-1
- **FR-SET-003**：figure-it-out 的四条规则（错在范围修、通过太易先疑观察、结论三值、复发→具名检查）落到 `workflows/verify-code/SKILL.md` 的检查可信度段，作为唯一权威；`skills/stage-reflection/SKILL.md` 只加条件指针，不复制全文。
  - **范围边界**：不新增第二个检查技能；不把三值结论做成新状态机。
  - **依据**：R-004、D-013、U-019；PFACT-003
  - **场景**：SCN-007
  - **验收**：AC-SET-2
- **FR-SET-004**：N9 十环接口已合入，本卡只消费并复验：`--task-path`、单份 JSON、十环顺序/五态/分母、缺环不阻断、任务不可读 exit 2；未执行复验前不宣称已接线。
  - **范围边界**：不重写 N9 的十环实现；不复制 N9 P3 fixture；不按未定字段写死断言；`--task-path` 与材料参数互斥（P3 参数闸）。
  - **依据**：R-002、R-007、D-024、D-025；PFACT-002
  - **场景**：SCN-008
  - **验收**：AC-SET-3、AC-SET-6
- **FR-SET-005**：维护者用现有总检查一次重跑全部适用检查；N9 合入后带任务参数；不新增汇总脚本或第二入口。N1 的完整成本窗口不属本卡，交 N1/N11 复核，本卡只验重跑入口。
  - **范围边界**：报告在屏幕，需要留证时重定向；不新增报告文件。
  - **依据**：R-009、D-014、U-020；PFACT-001
  - **场景**：SCN-007、SCN-010
  - **验收**：AC-SET-4
- **FR-SET-006**：改动前后量受影响常驻文档字节，逐项写增减、理由与分母；重复内容优先删或外置；不声称严格不增。
  - **范围边界**：不把代码字节混进常驻文档分母；不只报净行数；不把新增藏到未统计文件。
  - **依据**：R-020、D-015、U-021；PFACT-010
  - **场景**：SCN-010
  - **验收**：AC-SET-5
- **FR-SET-007**：N9 已合入，build-code 对十环、prove-it-works、sequence-verifiable-units 与 `run-checks` 任务参数逐项复验；缺什么再设计。
  - **范围边界**：不把 N9 计划文字当已交付；不因复验停掉其他安全工作；未执行前保持 incomplete。
  - **依据**：R-027、D-024、D-025；PFACT-002
  - **场景**：SCN-008
  - **验收**：AC-SET-6
- **FR-SET-008**：13 条来源原文与 pstack 快照索引可回读；4 份漂移与采用快照可指认。
  - **范围边界**：不 vendored、不改采用范围、不新增 54 项。
  - **依据**：R-026、D-023；PFACT-004
  - **场景**：SCN-007
  - **验收**：AC-SOURCE-6

### 流程修复（PROCESS）

- **FR-PROCESS-001**：复杂路线 make-decision 第 8 步前有禁入句「第 7 步方向审查已回读，或其不可用与用户选择已具名；未达不开始逐包收敛」；第 5 步只问方向轴与骨架；第 7 步仍在前；15 个 slug 不变。
  - **范围边界**：只改方法文本与 steps 的 observable_result；不新增强制门、字段或执行器；真实执行顺序标未验证。
  - **依据**：R-021、D-016、U-022；PFACT-009
  - **场景**：SCN-009
  - **验收**：AC-PROCESS-1
- **FR-PROCESS-002**：方向审查包带被审大纲的可回读 ref＋sha256，能说清审了哪版；被引用的用户答复（如 U-021）原件在包内。
  - **范围边界**：版本身份不作继续工作/问题身份/阶段许可；不新增必填字段门。
  - **依据**：R-021、D-016；PFACT-005
  - **场景**：SCN-009
  - **验收**：AC-PROCESS-2
- **FR-PROCESS-003**：wh-review 的 direction 合同把「当前选择」限定为骨架级选择，不含逐模块方案结论、字段级取舍或实现细节。
  - **范围边界**：保留 reveal/challenge 分段；不改 provider 协议。
  - **依据**：R-021、D-016；PFACT-009
  - **场景**：SCN-009
  - **验收**：AC-PROCESS-3
- **FR-PROCESS-004**：修 N8 交付漏项：根摘要补普通方案审；新建 `specs/n10-finite-check-wiring-20261020/n8-corrections.md` 更正归档 N8 spec 的三处摘要（归档原文不改）；normal 技能表 intake 改回「跳过」；31 矩阵必需→按需降档登记在更正件；P7 四路与错序未跑如实留 incomplete，不重跑、不改历史。
  - **范围边界**：不改四级结构；不跑四路；不重写 P7 历史；不补假绿。
  - **依据**：R-022、R-024、D-017、D-021；PFACT-009
  - **场景**：SCN-009
  - **验收**：AC-PROCESS-4
- **FR-PROCESS-005**：F 块不新增强制门、审批、公共命令、facts 字段或第二进度权威；0/1 语义不变。
  - **范围边界**：只改文档、静态断言与既有 tests。
  - **依据**：R-023、D-018；PFACT-009
  - **场景**：SCN-009
  - **验收**：AC-PROCESS-5
- **FR-PROCESS-006**：方向审后只重开被挑战模块；未被挑战模块保留并标「方向审前确认」；不新增第二轮方向审。
  - **范围边界**：重开清单为空也如实记录；不因顺序曾反而全部重做。
  - **依据**：R-021、D-019、U-024；PFACT-005
  - **场景**：SCN-009
  - **验收**：AC-PROCESS-6
- **FR-PROCESS-007**：两次 partial 审查的记录如实保留 provider 失败、覆盖与 partial 事实；用户选择可用来源继续，但不写成完整通过。
  - **范围边界**：不伪造 provider 成功；不把空/失败当空 findings。
  - **依据**：R-023、D-020、U-025；PFACT-005
  - **场景**：SCN-009
  - **验收**：AC-PROCESS-7
- **FR-PROCESS-008**：两次审查的真实根因（RC-1/2/3）记录在案；N9 合并后做一次受控复验；未解决再在本任务设计最小修复；不新增 gate。
  - **范围边界**：复验只核 provider 启动/完成/收场与解析；不重复开完整审查；未执行保持 incomplete。
  - **依据**：R-025、D-022、U-027；PFACT-002、PFACT-005
  - **场景**：SCN-009
  - **验收**：AC-PROCESS-8

### 磁盘有界性（DISK，追加需求）

- **FR-DISK-001**：所有由 WorkflowHub 创建的临时目录（`workflowhub-ocr-*`、测试/审查临时根）在成功、失败、取消后必须清理本进程创建的目录；进程异常退出不保证即时清理，但下次只读 stale 扫描只能清“允许前缀 + owner marker + 超龄 + 原 pid 不活”的目录，不得按裸目录名前缀删除。
  - **范围边界**：不删历史/未知临时目录；不碰 `pb-*`/`paperbuilder-*`；不新增公共 runtime 命令。
  - **依据**：D-028；用户 2026-10-21 追加要求；2026-10-21 归属报告
  - **场景**：SCN-011
  - **验收**：AC-DISK-1
- **FR-DISK-002**：任务证据（`quality/evidence`、`quality/reviews`、`quality/tests`）有软/硬预算；超过 hard 时新写入必须在写前失败并给出具名错误，**不删除、不覆盖已有原件**；软阈值只告警。
  - **范围边界**：不自动清理历史 461 MB review-materials/35 MB facts/18 MB index；不改变 P7 的 36 条 AC；不新增第二套状态。
  - **依据**：D-028；归属报告
  - **场景**：SCN-011
  - **验收**：AC-DISK-2
- **FR-DISK-003**：只读审计按任务/目录/writer/mtime 统计 bytes/files，能把历史退役 writer（`review-materials`、旧 facts/index）与当前 active（`quality/reviews`）及 unknown 分开；审计前后原件字节/inode 不变。
  - **范围边界**：不写、不删、不把 PaperBuilder 纳入；不按目录名前缀归责。
  - **依据**：D-028；归属报告
  - **场景**：SCN-011
  - **验收**：AC-DISK-3
- **FR-DISK-004**：`review-record-route` 的 provider 原始输出与审查结果 JSON 在写前接任务预算；超 hard 时失败且不产生半截文件；已有字节相同复用继续生效，历史审查原件保真。
  - **范围边界**：不改 provider 协议；不复活 `review-materials` 旧 writer；不自动删旧审查。
  - **依据**：D-028；归属报告
  - **场景**：SCN-011
  - **验收**：AC-DISK-4

## 6. 模块划分

| 模块 | 负责什么 | 对外提供什么 | 依赖谁 | 测试边界 |
| --- | --- | --- | --- | --- |
| A 检查内核 | 报告语义、零输入、坏输入、D-* 形态、既有红基线 | 可区分且具名的检查事实 | 三个 CLI 与现有纯函数 | 合法/零/坏/违规/恢复 |
| B 来源与目录 | catalog/notice/registry/bundle/vendored/退役/decisions | 只报告的来源事实与补齐的登记 | A 的报告通道 | 五类受控违规与恢复 |
| C 材料与写作 | 材料合同接入、显式根、级别分诊、模板误报、skip 三态 | 合法/缺段/不适用/空输入可区分 | A、B；既有 validator | N8/N2/轻档/伪轻档 |
| D 方法读回 | 测试/审查/收口/来源规则的真实消费者与变异演示 | 读回表、一次变异原件、人工/机器分界 | A、B | 路径存在、变异被揭出、恢复 |
| E 17 条与最终集合 | 17 行、E-1…E-10、figure-it-out、N9 接口、重跑、字节 | 逐项处置表与可重跑入口 | A–D；N9 | 处置完整性、接口稳定性、字节表 |
| F 流程修复 | 方向审顺序、材料版本、wh-review 合同、N8 漏项 | 文档与一条防漂移断言 | 无（独立） | 静态读回 + 断言 |
| G 磁盘有界性 | 临时目录、任务预算、只读审计、review 写入 | 有界写入与归属报告 | 无（独立）；读 P1–P7 原件 | 临时目录/预算/审计/审查超限 |

## 7. 关键实体

- **检查事实**：
  - **定义**：一次检查运行输出的具名报告行与退出码。
  - **字段和约束**：检查名、输入根/文件、规则名、问题位置、可重跑命令；不持久化，不留报告文件。
  - **关系**：一次运行对应一个退出码；告警与失败分列。
- **来源登记**：
  - **定义**：catalog/notice/registry/bundle 中对一条外部来源的采用、版本、许可与消费者记录。
  - **字段和约束**：name、status、commit/坐标、license、local_path、adopted、content_sha256（仅 vendored）；假版本必须改成真实坐标或标 unknown。
  - **关系**：一条来源可对应多个消费者；未采用项不写 absorbed。
- **处置行**：
  - **定义**：Appendix B 中 17 行与 E-1…E-10 的一行。
  - **字段和约束**：行号/来源键、处置词、消费者或未完成原因、证据指针；恰好一种处置。
  - **关系**：E 行与 17 行分开计数，不相加。
- **材料检查结果**：
  - **定义**：`validatePostPhaseContract` 对显式材料根返回的 `{ok, errors, facts}`。
  - **字段和约束**：只读、不写材料；轻档返回「不适用」，伪轻档返回错误；不改 validator 行为。
  - **关系**：一个材料根一次检查；错误逐条可定位。
- **验收对象**：
  - **定义**：本任务要检查的 CLI 对象（非 UI）。
  - **字段和约束**：workspace、state、cli.command/entry_ref/sample_ref/oracle_ref；由 `checkAcceptanceObject` 检查结构。
  - **关系**：见「验收对象」节。

## 8. 数据和生命周期

- **数据粒度**：一次检查运行对应一份 stdout/stderr；一份材料根对应一次合同检查；一条来源登记对应一行 catalog/notice。
- **数据时效**：每次命令读当前文件；不缓存、不写报告。
- **缺失或迟到**：空输入报「没有输入」；缺文件报「无法读取」并退出 1；N9 已合入但复验未执行时报 incomplete。
- **预览与正式**：检查结果只显示本次；不生成预览文件。
- **当前与历史**：历史 decision-log、N8 P7、旧审查原件只读；本卡不重写。
- **归属与清理**：报告由调用者重定向到任务证据；本卡不新增持久对象；临时夹具用完清理。

## 9. 兼容性预留

- **既有消费方**：`run-checks` 无参数调用方、`check-decision-log-chain` 的 advisory 读者、`check-skill-consistency` 的失败/报告读者、`validatePostPhaseContract` 的三个既有 consumer。
- **命名预留**：不新增公共命令；只给 `run-checks` 增加 `--material-root` 一个窄参数；`--task-path` 是 N9 已交付的独立模式，本卡保留并回归，不重定义。
- **容器预留**：N/A — 不新增持久化容器或 schema。
- **状态预留**：保持成功/失败与检查告警；不新增状态机、历史 trace 或第二进度权威。
- **扩展边界**：本期只接检查、材料、来源、方法读回与 F 文档；不做 N11 评测、不跑 N8 四路。

## 10. 明确不做与默认必须成立

### 明确不做

- 不建新平台、第二检查权威、证据去重检查器或状态机；不新增公共命令（R-002、R-010）。
- 不自动写报告文件、不加写文件开关、不新增报告 JSON schema 或第二读者（D-006）。
- 不把零输入判失败、不改公共 0/1 退出语义（D-007）。
- 不默认扫 `specs/`、不为兼容加第二套材料发现规则（D-009）。
- 不把写作检查扩到作者产物语义判断（D-011）。
- 不为方法类规则硬造检测器、不恢复身份强制门（D-012）。
- 不提前实现 N9 十环、不把 N9 计划文字当已交付（D-024）。
- 不把 17 行与 E 项相加、不预填 28/29 或坏引用数（R-016）。
- 不跑 N8 P7 四路、不重写 P7 历史（D-021）。
- 不声称 G1 严格「字节不增」（D-015）。

### 默认必须成立

- `run-checks` 无参数仍走原六段聚合，退出 0/1（FR-CHECK-006）。
- 决策链告警仍 advisory，退出 0（FR-CHECK-004）。
- 干净 index 模板不再误报；真实缺指针仍红（FR-MATERIAL-007）。
- N9 已合入，但 AC-SET-3、AC-SET-6 在复验执行前保持 incomplete，不写已接线（FR-SET-004/007）。
- 父 PRD 的 7+3 既有红按实际 3 红复现，并由 P1/T005 清零到 0 failed：只补 `ocr-production-cutover.test.mjs` 三处请求 materials，不删/弱化/跳过断言、不放宽生产 allowlist、不把 3 写成 10（FR-CHECK-007/D-026）。
- 所有报告只走 stdout/stderr，需要留证时重定向（D-006）。

## 验收流程

从 decision-log 的「验收面」取可观察接口与成功/失败边界，按 SCN-001…010 定位 FR、Appendix A 的同号 AC、所属 Phase 命令与原始证据；附录 B 给 17/E 逐项处置。AC 判据只以 Appendix A 为准，本节不复制通过/失败条件。

## 测试标准

本任务无 UI/浏览器表面。测试面与适用性如下：

| 测试面 | 适用性/理由 | oracle 与证据 | 覆盖 AC | 所属 Phase 命令 |
| --- | --- | --- | --- | --- |
| CLI 行为与退出 | 适用；三个入口是本次核心 | 合法/零/坏/违规/恢复的命令、stdout、exit | AC-CHECK-1…AC-CHECK-6 | P1 `npx vitest run tests/contract/n10-check-core.test.mjs` |
| 来源登记数据 | 适用；catalog/notice/registry 是数据合同 | 五类受控违规、恢复、只报告 | AC-SOURCE-1…AC-SOURCE-5 | P2 `npx vitest run tests/contract/n10-source-registry.test.mjs` |
| 材料合同集成 | 适用；validator 与 run-checks 是真实接缝 | N8/N2/轻档/伪轻档/空根 | AC-MATERIAL-1…AC-MATERIAL-6 | P3 `npx vitest run tests/contract/n10-material-contract.test.mjs` |
| 方法读回与变异 | 适用；方法规则只能读回+一次演示 | path:line 消费者、变异被揭出、恢复 | AC-METHOD-1…AC-METHOD-4 | P4 `npx vitest run tests/contract/n10-method-readback.test.mjs` |
| 来源处置与内容 | 适用；17/E 表与 figure-it-out、13 条原文是文档+数据 | 表行数/处置词/消费者/正文唯一权威/索引可回读 | AC-SET-1、AC-SET-2、AC-SOURCE-6 | P5 `npx vitest run tests/contract/n10-source-disposition.test.mjs` |
| N9 接口 | 适用；N9 已合入，复验待执行 | 稳定键/顺序/退出/负例；未执行 incomplete | AC-SET-3、AC-SET-6 | P5 `node tools/cli/run-checks.mjs --task-path <task>` |
| 重跑与字节 | 适用；总检查与常驻文档 | 一次聚合、报告可重定向、字节增减表 | AC-SET-4、AC-SET-5 | P7 `npx vitest run tests/acceptance/n10-finite-check-acceptance.test.mjs` |
| 流程文档与断言 | 适用；F 是文档/静态合同 | 读回、一条防漂移断言、不新增 gate | AC-PROCESS-1…AC-PROCESS-8 | P6 `npx vitest run tests/contract/n10-process-repair.test.mjs` |
| UI/浏览器端到端 | 不适用 — 本卡无页面/路由/组件改动（PFACT-007） | N/A | — | — |
| 全量回归 | 不适用 — 仓规禁止无范围全量测试；基线红只跑两个具名文件 | 两个具名文件的失败集合 | AC-CHECK-6 | P1 `npx vitest run tests/contract/ocr-delegation-route.test.mjs tests/contract/ocr-production-cutover.test.mjs` |

### 验收对象

本节填当前 `spec.md` 的实际验收对象数据；这是 CLI/后端任务，三源 UI 适用性均为 false。对象由 `checkAcceptanceObject` 检查结构，不证明服务已启动或业务通过。

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-n10-finite-check-wiring-20261020",
  "state": {
    "stage": "build-plan",
    "execution": "not_run",
    "description": "检查命令在 build-code/verify-code 真实执行"
  },
  "cli": {
    "command": "node tools/cli/run-checks.mjs --material-root /Users/Hugh/Hugh/Project/workflowhub-n10-finite-check-wiring-20261020/specs/archive/n8-four-level-route-20261019",
    "entry_ref": "spec#实现设计（全局权威）",
    "sample_ref": "spec#测试标准",
    "oracle_ref": "spec#Appendix A — 验收判据（唯一权威）"
  },
  "owner": "用户"
}
```

三源适用性输入：`raw_requirement` 指向父 PRD N10 与 decision-log（原始要求为 CLI/文档检查，无页面/交互）；`project_inventory` 指向当前仓库（无 `apps/`、无 `.tsx/.vue/.jsx` 页面，检查入口在 `tools/cli`）；`planned_or_changed_frontend_fact` 指向本 spec（计划无前端改动）。三项均 `ui_scope=false`，理由为非 UI 的真实任务事实。

## 架构边界

产品边界是「维护者能看懂并重跑检查」；工程边界是三个 CLI + 既有 validator + catalog/notice/registry 的只读检查。真实消费者是维护者、build-code/verify-code 与后续 N9。兼容责任：无参数 `run-checks`、advisory 决策链、既有 validator 调用方、`check-skill-consistency` 的失败/报告读者。全局架构方案见下一节，各 Phase 只承接差异。

## 实现设计（全局权威）

### 代码锚点

- **来源边界**：PRD/decision-log 只作来源映射；本节的代码事实来自 r8/r9/r10 的实读与实测，行号是生成时快照，会漂移，不作契约。
- **现状与目标差异**：
  - `check-skill-consistency.mjs:16` 的 `checkSkillConsistency(root)` 返回 `{failures,reports}`；`:41-63` 只验 upstream 形状；`:155-214` 只读 5 模板；`:218-229` 只收 `--root <abs>`。
  - `check-decision-log-chain.mjs:154` 把所有 `D-*` 当 legacy；`:266-303` 坏参数静默、坏文件抛栈、空输入打「0 warning(s)」。
  - `run-checks.mjs:114-160` 六段聚合；`:168-171` 只接受唯一的 `--task-path`、拒绝其它参数；`:148-150` 是材料段插入点。
  - `stage-content-contracts.mjs:413` 的 `validatePostPhaseContract` 返回 `{ok,errors,facts}`；`:740-749` facts；`readTaskTypeFromDecisionLog`（`:40-77`）只识 `规划任务/普通任务`，不提供轻档级别事实。
- **读取顺序**：先读 P1 的三个 CLI 与其测试，再读 P2 的 catalog/notice/registry/bundle，再读 P3 的 validator 与材料工作区，再读 P5 的 verify-code/stage-reflection，最后读 P6 的 make-decision/N8 文档。
- **代码锚点**：`checkSkillConsistency(root)`、`validatePostPhaseContract({spec,index,phases})`、`runAggregate()`、`main(args)`、`checkDecisionLogChain({markdown,source_ref})`、`inputFiles({file,root})`、`parseArgs(args)`；不新增运行时公共导出。
- **运行条件**：Node v24.14.0，ESM，vitest 定向文件；不跑全量。

### 接口与失败语义

- **选择的架构方案**：复用现有三个 CLI 与既有纯函数；只在 `check-skill-consistency` 的 reports 通道追加来源检查，在 `run-checks` 尾部追加材料段，在 `check-decision-log-chain` 修输入分诊。`validatePostPhaseContract` 不改行为。
- **模块职责**：
  - `check-skill-consistency`：目录/阶段/模板/来源/声明/哈希/退役的只读报告；failures 只保留原有阻断项。
  - `check-decision-log-chain`：文本链告警；零输入/坏输入分诊；保持 advisory。
  - `run-checks`：六段聚合；显式 `--material-root` 时加材料段；无参数不变。
  - `validatePostPhaseContract`：材料合同；只被调用，不被修改。
- **接口与数据流**：
  - `run-checks` 无参数：原六段 → 汇总。
  - `run-checks --material-root <abs>`：原六段 + 材料段 → 汇总；材料错误计入 failures 时退出 1；轻档不适用/空输入退出 0。
  - `check-skill-consistency --root <abs>`：reports → stdout，failures → stderr；来源段全部 report-only。
  - `check-decision-log-chain [--file <path> | --root <dir>]`：告警行 + 汇总；零输入具名行；坏输入一行 + exit 1。
- **失败语义**：
  - 缺 catalog/root 不可读：exit 1，一句人话。
  - 空 catalog/空来源：exit 0，「没有来源输入，未检查」。
  - 缺材料/坏材料：显式根时列出 validator 错误，exit 1；轻档「不适用」exit 0；无参数不跑材料段。
  - 决策链告警：exit 0；坏参数/坏文件：exit 1。
  - N9 已合入：`--task-path` 可用；本卡不改 N9 实现，只在 P3 参数闸保留它；复验未执行时记 incomplete。
- **新增控制面**：一个 `run-checks` 参数（`--material-root`）；无新命令、无新持久对象、无新 schema。

### P8 磁盘设计与正常写入分母

本节补全D-028原需实现设计，不修改FR-DISK-001…004或Appendix A原4AC。原计划作者的OCR禁句及review-only预算遗漏保在外置原件129；修正依据为091、116、121、122，具体出处与精确写集在P8 Phase。P1/T005清旧红的局部OCR/allowlist/冻结断言边界保持不变。P8待P7结束才实施；当前材料修正不是实现证据。

#### 正常task写入A–H

| 面 | 当前owner与真实caller | P8接线结果 |
| --- | --- | --- |
| A 普通create/write/append | task-handle:95–96；build-code/verify-code/standard/stage-closeout实际保存方法 | 同已认证task方法写quality；现safe-write序号/原子发布保留。 |
| B review | review-record-route:126/145/250，wh-review CLI/stage-runtime调用 | 空provider、新bytes及最终JSON逐写接executor；已认证同bytes复用先返回。 |
| C research | research-report.publishResearchReport:382–390 | 现recordDir核task身份后同evidence executor发布。 |
| D portable | portable-workflow-run.writeTerminal:89–96 | 现task校验后同evidence executor，不增加step/进度状态。 |
| E native | stage-runtime verify:1298–1307；build-code/capture、targeted-capture、verify-code/capture | 同task.captureCommand，output创建/chunk/marker/receipt各步原子核预算。 |
| F 人确认 | stage-runtime confirm:1344 -> human-confirm.recordConfirmation:304–325 | 同task.recordConfirmation，原cwd/HEAD/真实回复及公共字段不变。 |
| G Git record/consume | stage-runtime authorize:1346–1355；stage-closeout:28–35 | task方法同进程调用generic record/consume，显式cwd与真实grant/ref/step，保原branch/HEAD授权检查。 |
| H close确认 | stage-runtime confirm:1333–1342 -> core/task-close.confirmClosePlan:394–411 | 仅现入口timeout evidence及confirmed/rejected human-confirm接task owner；不激活旧prepare/execute close流程。 |

以上是人读覆盖分母，不生成writer registry或许可列表。外部手工cp/恶意直写不属OS级配额；正常task方法不能继续裸append/CLI后称unsupported。artifact-dir:117–119/214是worktree/specs而非quality，091该项误判已纠正；material-workspace规格、task-store根facts/task.json不扩大。新文件职责/consumer/owner/替代与删除条件按P8表、实施前登记现move-map，当前不写map。

#### 已落定内部task接口

复用现 `openTask(taskPath,{projectName,taskId})` 及真实branded handle；下列方法计划在 `runtime/task/task-handle.mjs` 实现，不是现已存在的能力：

- `task.createRecord(ref,bytes)`、`task.writeRecordAtomic(ref,bytes)`保现参数。quality三组接executor；其它task记录保原行为，pre/history仍只读。已有真正同bytes create-only复用先返回；不改变generic overwrite缺省语义来伪造复用。
- `task.appendRecord({dir,slug,ext,bytes})`：dir为task内相对quality子目录，验证属于三组；委派现safe-write.appendRecord，序号算法不复制。返回现原件path。普通阶段保存、授权范围原件、handoff和closeout备忘实际改用它；先按现证据规则确认同bytes则引用原件，不新写副本。
- `task.captureCommand({cwd,slug,argv,shell,timeoutMs,signal,resolveOutputRef})`：recordDir绑定task的quality/tests，保原argv/shell互斥及可选参数语义；内部调现generic capture并传executor，返回原执行事实。stage-runtime verify同进程调用。
- 三个workflow薄入口保原 `runCapture` / `runPrivateTargetedCapture` 导出名，接 `{task,cwd,recordDir,slug,argv,shell,timeoutMs,signal,resolveOutputRef}`；assertTaskHandle后调用上述方法；recordDir若提供须等于该task质量测试目录，错误task拒绝。没有task的独立通用使用仍可直接导入generic工具，正常task方法始终带真实task。
- `task.recordConfirmation(fields,{cwd})`：fields保stage/decision/reply/materialRefs；dir绑定quality/evidence/human-confirmations，内部generic context增加performWrite与lockDir（task根）。现public confirm及close.confirmClosePlan human分支消费。
- `task.recordGitAuthorization({cwd,operation,confirmationRef,phase})` / `task.consumeGitAuthorization({cwd,operation,stepId,authorizationRef,phase})`：dir绑定quality/evidence/git-authorizations；调用现generic record/consume，传显式cwd、lockDir=task根及executor；不process.chdir，不spawn后幻想callback跨进程。stage-runtime authorize与stage-closeout record/consume是实际consumer。generic缺省cwd保旧通用能力。
- core.confirmClosePlan沿现taskDir认证打开同task；timeout用task.appendRecord的close目录，confirmed/rejected用task.recordConfirmation；仅上述现public入口两写，不泛重构core旧writer。

正常方法给可执行Node module调用形状：从已定位包导入openTask，用当前task根与原项目/task identity打开；普通保存 `await task.appendRecord({dir:"quality/evidence",slug:"build-note",ext:"md",bytes})`；实际Git动作前分别 `await task.recordGitAuthorization({cwd,operation,confirmationRef,phase})`、`await task.consumeGitAuthorization({cwd,operation,stepId,authorizationRef:grant.path,phase})`。真实cwd/ref/step来源不变，不虚构新runtime action；已有七类CLI及普通Node内部方法足够。

#### 阈值、usage与写入峰值

| quality子目录 | soft bytes | hard bytes | hard文件数 |
| --- | --- | --- | --- |
| evidence | 384 MiB | 512 MiB | 20000 |
| reviews | 192 MiB | 256 MiB | 5000 |
| tests | 128 MiB | 256 MiB | 10000 |

MiB=1024*1024；显式soft/hard为准，删除80%歧义。soft只stderr告警；files仅hard。允许恰hard，超过hard写前抛DISK_BUDGET_EXCEEDED；错误含subdir/current_bytes/incoming_bytes/hard_bytes及current_files/incoming_files/hard_files，不输出provider raw。limits只用于明确调用配置/小fixture，不静默上调掩失败。

readTaskDiskUsage只读quality三组，拒symlink不跟随；bytes按同一dev+ino的实际数据只计一次，files按regular-file目录项计（含hardlink每个pathname）；owned原子tmp与原有业务锁也是实际占用，不能简单过滤未知前缀。目录本身不计regular-file数。create/link发布峰值为新增两pathname、一个新inode的数据；overwrite为旧+temp两个inode并存、额外一个pathname；output创建+1文件、append chunk新增bytes不增files。usage与预算描述同口径，不能只用最终净增预测峰值。峰值预检可保守，descriptor明确bytes/files是峰值增量而非提交后delta。已有历史超hard只读保留，已知bytes复用不新增可继续。

单一 `runtime/evidence/disk-budget.mjs` 提供readTaskDiskUsage/assertTaskDiskBudget/内部 `createTaskDiskWriteExecutor({taskRoot,limits})`；仅读实际目录，不存缓存/计数/预留账本。实际写executor形状 `performWrite({kind,path,bytes,incomingFiles},writeActual)`，bytes是本次峰值新增字节数、incomingFiles是峰值新增目录项数；writeActual仅本次有限FS动作，不调用其他task writer或child。task owner构造，不从public JSON接受函数。generic safe-write/run-command/human-confirm/git-authorize保单文件node:*，无callback保原通用行为。

#### 锁、stream与失败事实

复用record-lock：budget锁固定在task根、每quality组一个名字。每次真实写严格 `lock -> read usage -> assert peak -> writeActual -> unlock`；await锁后实际写内再次沿原snapshot验证，不以放锁后的write制造TOCTOU。budget是叶子锁，不跨spawn/等待child/provider，不能整capture持锁，不能预算锁内再进task writer。同task被测child可写research/record而不死锁。

simplicity P1/P2选择复用现锁算法、只调task锁storage：review外锁与provider-output锁的withLock第一个参数由quality/reviews改为已核task根，name/scope保持；human-confirm context与git record/consume可选lockDir由task owner传task根，缺省通用调用仍原storage。业务数据仍原quality目录，原算法及owner/no-follow/nonce/死pid判据不改，record-lock.mjs不增hook、不扩写。task根review/provider/human/Git/budget名称各异；provider root锁内仍先比同源不可变bytes，再对真正新写申请budget锁，所以超hard复用不先消耗quality锁。旧quality内锁不删/不迁，计真实usage；切换前先核本task旧writer已settle，真实仍活持有者沿现锁等待/报告，不能以目录移动绕过并发保护，不增永久双锁compat。无task子进程/锁等待在budget叶子锁内，锁释放仍只删本进程自有锁。

safe-write将已验证目标的完整单文件publish交executor；append冲突重试保旧算法，每次实际尝试都核。既有bytes复用在预算前；overwrite不凭新规则跳过。review逐写原子不是整轮事务，合法前序provider原件保留。AC-DISK4“第二次零新文件”fixture明确该调用第一个新写即超限；另测provider成功写而JSON失败，保前件、不留半截JSON。

native output-create、chunk、8MiB truncation-marker及receipt逐写用同执行器。stdout/stderr共一有序队列按观察顺序入队；等待预算锁暂停两pipe并限制积压；close先等队列后fsync/close/receipt，不能借旧同步假设提前finish。abort/timeout立即终止进程组，不等队列；拒写后恢复drain或销毁pipe使child close可达；队列错误settle一次、拒绝后待写chunk不再落盘。保现8MiB语义，budget拒写不冒正常truncation/success。

预算拒写保实际已写prefix，标不完整；receipt也可被拒。此时具名错误向真实CLI serializer透出execution（exit/signal/timed_out/cancelled/原error/output_ref）与receipt未保存，无假receipt_ref；原命令失败不能被budget错误覆盖。stage-runtime仅有真实receipt才回读/记录原stage evidence；无receipt分支准确报告执行与保存失败，不造facts。满目录不承诺新receipt必能落盘。fresh capture事前不知道新输出字节是否同旧件，不能用末端dedup承诺超hard重跑仍成功。

#### 临时生命周期、审计与回退

helper首consumer为provider-client #invokeCli wh-review-public，创建marker失败清本次新目录，下次同consumer实际跑stale；条件为允许前缀+合法owner marker+超龄+原pid已证死，权限/未知/无marker/symlink/PaperBuilder不删。OCR仅修两次分配同一try及已分配目录清理，保现dispose/cancel流程。12producer逐项回读既有正确owner与真实测试，不泛迁移，不以helper单测冒全FR；真实剩余缺口保持incomplete并回owner。

审计CLI只接受--task-root绝对路径并输出只读JSON；预算reader限三组，审计另读取该task根facts/index及review-materials的有限归属元数据。review-materials已证退役writer可标historical；当前合法facts/index仍是active owner，不按文件名一律判历史；只有历史cohort/已证旧M15来源才historical，缺身份/来源为unknown。quality/reviews当前writer属active，未知子目录不猜；按任务/目录/已证writer/mtime给bytes/files，mtime只作时间事实不作归责。拒symlink、删除/清理参数，不全盘扫描/PaperBuilder；前后bytes/inode不变。

恢复先保原错误、已写原件及未保存面，用户另决定历史归档/预算配置；不自动删旧件/降原FR。回退仅本Phase具体hunk，不整树回退；新增文件替代/删除条件见P8登记表。正式收口需T037–T040每条真实caller证据与独立质量事实，规划/静态检查不冒实现GREEN。

### 全局文件边界与依赖

- **新增**：`tests/contract/n10-check-core.test.mjs`、`tests/contract/n10-source-registry.test.mjs`、`tests/contract/n10-material-contract.test.mjs`、`tests/contract/n10-method-readback.test.mjs`、`tests/fixtures/n10-method-readback.json`、`tests/contract/n10-source-disposition.test.mjs`、`tests/contract/n10-n9-interface.test.mjs`、`tests/contract/n10-process-repair.test.mjs`、`tests/acceptance/n10-finite-check-acceptance.test.mjs`、`docs/research/n10-finite-check-acceptance-runbook.md`；P8 新增 `runtime/interface/temp-dir.mjs`、`runtime/evidence/disk-budget.mjs`、`tools/cli/audit-disk-usage.mjs`、`tests/contract/n10-disk-boundedness.test.mjs`、`docs/research/n10-disk-boundedness.md`。
- **修改**：`runtime/review/review-record-route.mjs`（P8/T039 预算检查）、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`（P8/T037 4 处 cleanup）、`tools/cli/check-skill-consistency.mjs`、`tools/cli/check-decision-log-chain.mjs`、`tools/cli/run-checks.mjs`、`skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md`、`skills/spec-plan/templates/index-template.md`、`workflows/verify-code/SKILL.md`、`skills/stage-reflection/SKILL.md`、`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`skills/wh-review/contracts/make-decision.md`、`specs/n10-finite-check-wiring-20261020/n8-corrections.md`、`workflows/make-decision/flows/normal/SKILL.md`、`docs/adr/0052-direction-review-before-module-convergence.md`、既有测试 `tests/n2-skill-catalog-portability.test.mjs`、`tests/contract/make-decision-flows.test.mjs`、`core/__tests__/run-checks.test.mjs`、`tests/contract/ocr-production-cutover.test.mjs`。
- **禁止改动**：`runtime/stage/stage-content-contracts.mjs`（只读复用；若必须改回用户）、`tests/contract/ocr-delegation-route.test.mjs` 的既有断言（P1/T005 只改 production-cutover 的请求 materials）、`specs/archive/n8-four-level-route-20261019/phases/P7-四级验收与成本对照.md`（保留历史 incomplete）、`specs/archive/**`（含 N8 spec，只读；修正只在 `n8-corrections.md`）、`docs/archive/**`。
- **P8追加修改**（仅磁盘设计接线，原各Phase范围不变）：`tests/contract/card05-runtime-target-behavior.test.mjs`；`skills/wh-review/scripts/review-provider-client.mjs`；`skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`；`runtime/review/ocr-delegation-adapter.mjs`；`tests/contract/ocr-delegation-adapter.test.mjs`；`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`runtime/interface/safe-write.mjs`；`tests/contract/narrow-tool-safe-write.test.mjs`；`runtime/interface/run-command.mjs`；`tests/contract/narrow-tool-run-command.test.mjs`；`runtime/task/task-handle.mjs`；`tests/contract/task-handle.test.mjs`；`runtime/review/review-record-route.mjs`；`runtime/evidence/research-report.mjs`；`tests/contract/research-report-current.test.mjs`；`runtime/task/portable-workflow-run.mjs`；`tests/contract/portable-workflow-run.test.mjs`；`tools/cli/stage-runtime.mjs`；`tests/contract/confirmation-authorization.test.mjs`；`workflows/build-code/capture.mjs`；`workflows/build-code/targeted-capture.mjs`；`workflows/verify-code/capture.mjs`；`runtime/interface/human-confirm.mjs`；`tests/contract/narrow-tool-human-confirm.test.mjs`；`runtime/interface/git-authorize.mjs`；`tests/contract/narrow-tool-git-authorize.test.mjs`；`core/task-close.mjs`；`tests/contract/light-close-confirm.test.mjs`；`docs/standard-workflow.md`；`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；`skills/stage-closeout/SKILL.md`；`docs/architecture/move-map.json`。职责/真实consumer/TCR以P8表为准；map在实施前登记，本轮不写。
- **全局依赖**：P1 → P2 → P3 → P4 → P5 → P7 → P8；P6（F）不依赖 P1–P5，但按阶段顺序排在 P5 后；P7 消费 P1–P6，P8 消费 P1–P7。P2/P3 都改 `check-skill-consistency.mjs`，P1/P3 都改 `run-checks.mjs`，串行定序。
- **文件归属**：`check-skill-consistency.mjs` 唯一写主顺序 P1→P2→P3；`run-checks.mjs` P1→P3；`tests/n2-skill-catalog-portability.test.mjs` P1→P2→P3。P5 不改 P2 的 catalog/notice，只读回。
- **回滚与恢复**：每个 Phase 的改动按文件 hunk 回退；恢复用同字节复跑；不整树 checkout。

### 需求到任务追踪

| 来源 / 决定 | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 |
| --- | --- | --- | --- | --- |
| R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-CHECK-002；AC-CHECK-2、AC-CHECK-3、AC-CHECK-1 | P1/T001 | ORACLE-N10-CHECK-CORE 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-CHECK-003；AC-CHECK-2、AC-CHECK-3、AC-CHECK-1 | P1/T001 | ORACLE-N10-CHECK-CORE 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-CHECK-004；AC-CHECK-2、AC-CHECK-3、AC-CHECK-1 | P1/T001 | ORACLE-N10-CHECK-CORE 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-012、R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-CHECK-005；AC-CHECK-1、AC-CHECK-4 | P1/T002 | ORACLE-N10-CHECK-CORE 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-012 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-CHECK-001；AC-CHECK-1、AC-CHECK-3、AC-CHECK-5、AC-CHECK-6 | P1/T003 | ORACLE-N10-CHECK-CORE 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-012 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-CHECK-003；AC-CHECK-1、AC-CHECK-3、AC-CHECK-5、AC-CHECK-6 | P1/T003 | ORACLE-N10-CHECK-CORE 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-012 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-CHECK-006；AC-CHECK-1、AC-CHECK-3、AC-CHECK-5、AC-CHECK-6 | P1/T003 | ORACLE-N10-CHECK-CORE 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-012 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-CHECK-007；AC-CHECK-1、AC-CHECK-3、AC-CHECK-5、AC-CHECK-6 | P1/T003 | ORACLE-N10-CHECK-CORE 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-012 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-CHECK-007；AC-CHECK-6 | P1/T005 | ORACLE-N10-ZERO-RED 同命令 exit 0，两文件 0 failed；证据见 Phase 卡与 Appendix A |
| R-003、R-012 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-CHECK-001；AC-CHECK-4、AC-CHECK-1 | P1/T004 | ORACLE-N10-CHECK-CORE 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-002、R-019 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-001；AC-SOURCE-1、AC-SOURCE-2 | P2/T006 | ORACLE-N10-SOURCE-REGISTRY 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-002、R-019 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-002；AC-SOURCE-1、AC-SOURCE-2 | P2/T006 | ORACLE-N10-SOURCE-REGISTRY 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-019 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-004；AC-SOURCE-2、AC-SOURCE-4 | P2/T007 | ORACLE-N10-SOURCE-REGISTRY 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-019 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-005；AC-SOURCE-2、AC-SOURCE-4 | P2/T007 | ORACLE-N10-SOURCE-REGISTRY 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-019 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-004；AC-SOURCE-2、AC-SOURCE-4 | P2/T008 | ORACLE-N10-SOURCE-REGISTRY 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-019 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-005；AC-SOURCE-2、AC-SOURCE-4 | P2/T008 | ORACLE-N10-SOURCE-REGISTRY 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-011、R-019 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-005；AC-SOURCE-4 | P2/T009 | ORACLE-N10-SOURCE-REGISTRY 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-002、R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-002；AC-SOURCE-2、AC-SOURCE-3、AC-SOURCE-5 | P2/T010 | ORACLE-N10-SOURCE-REGISTRY 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-002、R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-003；AC-SOURCE-2、AC-SOURCE-3、AC-SOURCE-5 | P2/T010 | ORACLE-N10-SOURCE-REGISTRY 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-002、R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-006；AC-SOURCE-2、AC-SOURCE-3、AC-SOURCE-5 | P2/T010 | ORACLE-N10-SOURCE-REGISTRY 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-002、R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-001；AC-MATERIAL-1、AC-MATERIAL-3 | P3/T011 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-002、R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-002；AC-MATERIAL-1、AC-MATERIAL-3 | P3/T011 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-002、R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-003；AC-MATERIAL-4、AC-MATERIAL-6 | P3/T012 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-002、R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-005；AC-MATERIAL-4、AC-MATERIAL-6 | P3/T012 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-012、R-018 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-006；AC-MATERIAL-5 | P3/T013 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-012、R-018 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-007；AC-MATERIAL-5 | P3/T013 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-003 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-004；AC-MATERIAL-2、AC-MATERIAL-3 | P3/T014 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-009、R-017 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-001；AC-MATERIAL-1、AC-MATERIAL-3 | P3/T015 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-009、R-017 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-002；AC-MATERIAL-1、AC-MATERIAL-3 | P3/T015 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-012、R-018 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-005；AC-MATERIAL-5、AC-MATERIAL-6 | P3/T016 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-012、R-018 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-MATERIAL-007；AC-MATERIAL-5、AC-MATERIAL-6 | P3/T016 | ORACLE-N10-MATERIAL-CONTRACT 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-015、U-018 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-METHOD-001；AC-METHOD-1、AC-METHOD-3 | P4/T017 | ORACLE-N10-METHOD-READBACK 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| U-018 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-METHOD-002；AC-METHOD-2 | P4/T018 | ORACLE-N10-METHOD-READBACK 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-019 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-METHOD-003；AC-METHOD-3、AC-METHOD-4 | P4/T019 | ORACLE-N10-METHOD-READBACK 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-019 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-METHOD-004；AC-METHOD-3、AC-METHOD-4 | P4/T019 | ORACLE-N10-METHOD-READBACK 同命令 exit 0；证据见 Phase 卡与 Appendix A |
| R-004、R-011、U-019 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-003；AC-SET-2 | P5/T021 | ORACLE-N10-FINITE-SET；证据见 Phase 卡与 Appendix A |
| R-016、R-011、R-013 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-001；AC-SET-1、AC-SET-2 | P5/T022 | ORACLE-N10-FINITE-SET；证据见 Phase 卡与 Appendix A |
| R-016、R-011、R-013 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-002；AC-SET-1、AC-SET-2 | P5/T022 | ORACLE-N10-FINITE-SET；证据见 Phase 卡与 Appendix A |
| R-006、R-007、R-008 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-004；AC-SET-3、AC-SET-6 | P5/T023 | ORACLE-N10-FINITE-SET；证据见 Phase 卡与 Appendix A |
| R-006、R-007、R-008 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-007；AC-SET-3、AC-SET-6 | P5/T023 | ORACLE-N10-FINITE-SET；证据见 Phase 卡与 Appendix A |
| R-026、U-028 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SOURCE-007；AC-SOURCE-6、AC-SET-1 | P5/T024 | ORACLE-N10-FINITE-SET；证据见 Phase 卡与 Appendix A |
| R-026、U-028 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-008；AC-SOURCE-6、AC-SET-1 | P5/T024 | ORACLE-N10-FINITE-SET；证据见 Phase 卡与 Appendix A |
| R-021、R-022 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-001；AC-PROCESS-1、AC-PROCESS-4、AC-PROCESS-6 | P6/T026 | ORACLE-N10-PROCESS-REPAIR 的同一 `T026` 测试退出 0：真实文本四处断言全过，受控副本各自被拒绝；证据见 Phase 卡与 Appendix A |
| R-021、R-022 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-004；AC-PROCESS-1、AC-PROCESS-4、AC-PROCESS-6 | P6/T026 | ORACLE-N10-PROCESS-REPAIR 的同一 `T026` 测试退出 0：真实文本四处断言全过，受控副本各自被拒绝；证据见 Phase 卡与 Appendix A |
| R-021、R-022 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-006；AC-PROCESS-1、AC-PROCESS-4、AC-PROCESS-6 | P6/T026 | ORACLE-N10-PROCESS-REPAIR 的同一 `T026` 测试退出 0：真实文本四处断言全过，受控副本各自被拒绝；证据见 Phase 卡与 Appendix A |
| R-021 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-001；AC-PROCESS-1、AC-PROCESS-2、AC-PROCESS-3 | P6/T027 | ORACLE-N10-PROCESS-REPAIR 的同一 `T027` 测试退出 0：真实 `steps.json`/合同全过，受控副本被拒绝；证据见 Phase 卡与 Appendix A |
| R-021 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-002；AC-PROCESS-1、AC-PROCESS-2、AC-PROCESS-3 | P6/T027 | ORACLE-N10-PROCESS-REPAIR 的同一 `T027` 测试退出 0：真实 `steps.json`/合同全过，受控副本被拒绝；证据见 Phase 卡与 Appendix A |
| R-021 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-003；AC-PROCESS-1、AC-PROCESS-2、AC-PROCESS-3 | P6/T027 | ORACLE-N10-PROCESS-REPAIR 的同一 `T027` 测试退出 0：真实 `steps.json`/合同全过，受控副本被拒绝；证据见 Phase 卡与 Appendix A |
| R-021、R-023 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-002；AC-PROCESS-2、AC-PROCESS-3、AC-PROCESS-7 | P6/T028 | ORACLE-N10-PROCESS-REPAIR 的同一 `T028` 测试退出 0；证据见 Phase 卡与 Appendix A |
| R-021、R-023 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-003；AC-PROCESS-2、AC-PROCESS-3、AC-PROCESS-7 | P6/T028 | ORACLE-N10-PROCESS-REPAIR 的同一 `T028` 测试退出 0；证据见 Phase 卡与 Appendix A |
| R-021、R-023 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-007；AC-PROCESS-2、AC-PROCESS-3、AC-PROCESS-7 | P6/T028 | ORACLE-N10-PROCESS-REPAIR 的同一 `T028` 测试退出 0；证据见 Phase 卡与 Appendix A |
| R-022 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-004；AC-PROCESS-4 | P6/T029 | ORACLE-N10-PROCESS-REPAIR 的同一 `T029` 测试退出 0；证据见 Phase 卡与 Appendix A |
| R-022、R-024 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-004；AC-PROCESS-4、AC-PROCESS-5 | P6/T030 | ORACLE-N10-PROCESS-REPAIR 的同一 `T030` 测试退出 0；证据见 Phase 卡与 Appendix A |
| R-022、R-024 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-005；AC-PROCESS-4、AC-PROCESS-5 | P6/T030 | ORACLE-N10-PROCESS-REPAIR 的同一 `T030` 测试退出 0；证据见 Phase 卡与 Appendix A |
| R-021 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-001；AC-PROCESS-1 | P6/T031 | ORACLE-N10-PROCESS-REPAIR 的同一测试退出 0：真实文件四项全过、四类受控副本被拒绝、原 15-slug 基线与既有 17 条 case 仍通过（TCR 段不回归）。；证据见 Phase 卡与 Appendix A |
| R-023、R-025 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-005；AC-PROCESS-5、AC-PROCESS-8、AC-PROCESS-1、AC-PROCESS-4、AC-PROCESS-6、AC-PROCESS-7 | P6/T032 | ORACLE-N10-PROCESS-REPAIR 同一文件退出 0：`T026`–`T030` 与 `AC-PROCESS-5` 全过；证据见 Phase 卡与 Appendix A |
| R-023、R-025 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-PROCESS-008；AC-PROCESS-5、AC-PROCESS-8、AC-PROCESS-1、AC-PROCESS-4、AC-PROCESS-6、AC-PROCESS-7 | P6/T032 | ORACLE-N10-PROCESS-REPAIR 同一文件退出 0：`T026`–`T030` 与 `AC-PROCESS-5` 全过；证据见 Phase 卡与 Appendix A |
| D-028；R-012 | 临时目录生命周期；stale 只清允许前缀+owner marker+超龄+pid 不活 | FR-DISK-001；AC-DISK-1 | P8/T037 | ORACLE-N10-DISK-BOUNDED；before/after `wh-review-*` 计数 delta=0；负例不误删 `paperbuilder-*` |
| D-028；R-012 | 任务证据 soft 告警、hard 写前失败；不删/不覆盖旧件 | FR-DISK-002；AC-DISK-2 | P8/T038 | ORACLE-N10-DISK-BOUNDED；`DISK_BUDGET_EXCEEDED`；前后 bytes/sha256 不变 |
| D-028；R-012 | 只读审计按历史/当前/unknown 分类；不扫 PaperBuilder、不按前缀删 | FR-DISK-003；AC-DISK-3 | P8/T038 | ORACLE-N10-DISK-BOUNDED；审计 JSON 分类；前后 sha256 不变 |
| D-028；R-012 | review 写入接预算；超限零新文件、无半截 JSON；相同 bytes 复用 | FR-DISK-002、FR-DISK-004；AC-DISK-2、AC-DISK-4 | P8/T039 | ORACLE-N10-DISK-BOUNDED；`-t T039` 超限零新文件；复用不增文件 |
| D-028；R-012 | P8 四 AC 收口、报告与只读复核 | FR-DISK-001、FR-DISK-002、FR-DISK-003、FR-DISK-004；AC-DISK-1、AC-DISK-2、AC-DISK-3、AC-DISK-4 | P8/T040 | ORACLE-N10-DISK-BOUNDED；四条 AC 原件齐备；历史原件保真 |
| R-009、R-017 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-005；AC-CHECK-1、AC-CHECK-2、AC-CHECK-3、AC-CHECK-4、AC-CHECK-5、AC-CHECK-6、AC-SOURCE-1、AC-SOURCE-2、AC-SOURCE-3、AC-SOURCE-4、AC-SOURCE-5、AC-SOURCE-6、AC-MATERIAL-1、AC-MATERIAL-2、AC-MATERIAL-3、AC-MATERIAL-4、AC-MATERIAL-5、AC-MATERIAL-6、AC-METHOD-1、AC-METHOD-2、AC-METHOD-3、AC-METHOD-4、AC-SET-1、AC-SET-2、AC-SET-3、AC-SET-4、AC-SET-5、AC-SET-6、AC-PROCESS-1、AC-PROCESS-2、AC-PROCESS-3、AC-PROCESS-4、AC-PROCESS-5、AC-PROCESS-6、AC-PROCESS-7、AC-PROCESS-8 | P7/T033 | ORACLE-N10-FINAL-ACCEPTANCE；证据见 Phase 卡与 Appendix A |
| R-009、R-017 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-006；AC-CHECK-1、AC-CHECK-2、AC-CHECK-3、AC-CHECK-4、AC-CHECK-5、AC-CHECK-6、AC-SOURCE-1、AC-SOURCE-2、AC-SOURCE-3、AC-SOURCE-4、AC-SOURCE-5、AC-SOURCE-6、AC-MATERIAL-1、AC-MATERIAL-2、AC-MATERIAL-3、AC-MATERIAL-4、AC-MATERIAL-5、AC-MATERIAL-6、AC-METHOD-1、AC-METHOD-2、AC-METHOD-3、AC-METHOD-4、AC-SET-1、AC-SET-2、AC-SET-3、AC-SET-4、AC-SET-5、AC-SET-6、AC-PROCESS-1、AC-PROCESS-2、AC-PROCESS-3、AC-PROCESS-4、AC-PROCESS-5、AC-PROCESS-6、AC-PROCESS-7、AC-PROCESS-8 | P7/T033 | ORACLE-N10-FINAL-ACCEPTANCE；证据见 Phase 卡与 Appendix A |
| R-009、R-017 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-007；AC-CHECK-1、AC-CHECK-2、AC-CHECK-3、AC-CHECK-4、AC-CHECK-5、AC-CHECK-6、AC-SOURCE-1、AC-SOURCE-2、AC-SOURCE-3、AC-SOURCE-4、AC-SOURCE-5、AC-SOURCE-6、AC-MATERIAL-1、AC-MATERIAL-2、AC-MATERIAL-3、AC-MATERIAL-4、AC-MATERIAL-5、AC-MATERIAL-6、AC-METHOD-1、AC-METHOD-2、AC-METHOD-3、AC-METHOD-4、AC-SET-1、AC-SET-2、AC-SET-3、AC-SET-4、AC-SET-5、AC-SET-6、AC-PROCESS-1、AC-PROCESS-2、AC-PROCESS-3、AC-PROCESS-4、AC-PROCESS-5、AC-PROCESS-6、AC-PROCESS-7、AC-PROCESS-8 | P7/T033 | ORACLE-N10-FINAL-ACCEPTANCE；证据见 Phase 卡与 Appendix A |
| R-009 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-005；AC-SET-3、AC-SET-6、AC-PROCESS-8、AC-SET-4、AC-SET-5 | P7/T034 | ORACLE-N10-FINAL-ACCEPTANCE；证据见 Phase 卡与 Appendix A |
| R-009 | 该 Task 的可观察行为与失败强度见 5 节与 Phase 卡 | FR-SET-007；AC-SET-3、AC-SET-6、AC-PROCESS-8、AC-SET-4、AC-SET-5 | P7/T034 | ORACLE-N10-FINAL-ACCEPTANCE；证据见 Phase 卡与 Appendix A |

### 全局验证策略

- **验证策略**：每个 Phase 用定向 vitest 文件或具名 CLI 命令；AC 的判据只在 Appendix A；Phase 卡给精确命令、RED 目标失败与 GREEN oracle。报告需要留证时由执行者重定向到 `quality/tests/`。
- **RED/GREEN 设计**：行为改动先在 Phase 指定的测试文件写目标断言并实跑 RED；RED 必须是目标断言失败，不是环境/收集失败。纯文档/方法卡按 G-2 用可证伪读回或客观替代；不制造仪式性 RED。`validatePostPhaseContract` 本身不改，不为它造 RED。
- **最终聚合**：P7 验收原 36 条 AC；P8 验收追加 4 条 AC。P7 消费 P1–P6 原件；P8 消费 P1–P7 与归属报告。最终聚合命令分别为 `npx vitest run tests/acceptance/n10-finite-check-acceptance.test.mjs` 与 `npx vitest run tests/contract/n10-disk-boundedness.test.mjs`；报告按 AC 分组输出并重定向到 `quality/tests/`。
- **不能证明的内容**：不证明真实 provider 理解、不证明 N8 四路行为、不证明 N11 评测效果、不证明全仓无其它失败。

## Appendix A — 验收判据（唯一权威）

编号映射：`AC-CHECK-n` = decision-log `AC-An`，`AC-SOURCE-n` = `AC-Bn`，`AC-MATERIAL-n` = `AC-Cn`，`AC-METHOD-n` = `AC-Dn`，`AC-SET-n` = `AC-En`，`AC-PROCESS-n` = `AC-Fn`；n 为原编号。其余判据与原 AC 同义，只把编号扩成 validator 可识别的三段式；有意变更的是 AC-CHECK-5 收窄、AC-MATERIAL-3 改缺省根判据、AC-SET-3 增补 N9 稳定键，均见下表。AC-CHECK-5 的「逐字一致」改为「六段与 0/1 语义不变、已列具名修复允许改变文本」，因为修复 D-* 假告警和零输入提示必然改变文本。

### 父 PRD 继承与 build-plan 判据变更记录

父 PRD 的原号保留，不重造历史；本卡只承接其中归 N10 的部分。继承关系如下：

| 原号（父 PRD） | 原义（按 prd:250/285 的责任句） | 本卡落点 | 处理 |
| --- | --- | --- | --- |
| FR-T0-001/002 | 完整检查机制与有限 consumer 接线 | FR-CHECK-001…007、FR-SOURCE-001…007、FR-MATERIAL-001…007、FR-SET-001…008 | 原号只读保留，本卡用新 FR 执行 |
| AC-T0-1…3 | 合法/缺段/名字错/零输入可区分 | AC-CHECK-1…3、AC-MATERIAL-1…4、AC-SOURCE-1…3 | 同义拆分，原号不重写 |
| AC-010 检查子条 | 检查机制/负例；真实效果子条归 N11 | AC-CHECK-1…6、AC-MATERIAL-1…6、AC-SET-1 | 只接检查子条，不替 N11 |
| ORACLE-T0 A/B | 检查器合法/负例/零输入/恢复 | ORACLE-N10-CHECK-CORE、ORACLE-N10-MATERIAL-CONTRACT、ORACLE-N10-SOURCE-REGISTRY | 新名是执行面，原号保留 |

**build-plan 判据变更（待用户计划确认，不改 decision-log 历史）**：
- AC-CHECK-5（原 AC-A5）由「输出与退出逐字一致」改为「六段与 0/1 语义不变、stderr 恰一行材料未运行事实、已列具名修复允许改变文本」；理由：修 D-* 假告警与零输入提示必然改文本。
- AC-MATERIAL-3 把「缺省材料根」明确为「不运行材料段，向 stderr 恰输出一行 `[run-checks] material check not run: no --material-root`」；stdout 保持 N9 冻结的六段逐字不变；没有这行就无法区分「未跑」与「跑过全绿」。
- AC-SET-3 增补 N9 报告的稳定键/五态/分母公式，不改变「复验执行前 incomplete」的结论。
- 新增 AC-CHECK-6、AC-SOURCE-6、AC-SET-6、AC-PROCESS-8，分别承接 R-012/R-026/R-027/R-025；新增理由、来源与证据见各 AC。
- `run-checks` 新增 `--material-root`（D-009/U-015 支持）；级别只读 decision-log「级别与路线」，读不到按完整材料检查并记 unknown。
这些是 build-plan 对执行判据的细化，不是对用户选择的重写；用户确认当前计划时一并确认，未确认前保持草稿。

每条 AC 用四行式；编号与 decision-log 的对照见本节开头映射，新增 AC 在编号后注明“新增”。判据只在本节维护。

- [ ] **AC-CHECK-1**：对当前真实任务材料跑三个检查，合法输入 exit 0，不出现与 N10 无关的硬失败；来源模板报告不再出现干净 index 模板的永久误报。
验证：维护者在 build-code/verify-code 执行 `node tools/cli/check-skill-consistency.mjs --root "$PWD"`、`node tools/cli/check-decision-log-chain.mjs --file specs/n10-finite-check-wiring-20261020/decision-log.md`、`node tools/cli/run-checks.mjs`；输入为当前 worktree 与当前 decision-log；执行 owner 是 build-code 实施者，verify-code 复核；时点为三个 CLI 改完后。
通过：三条命令 exit 0；`check-skill-consistency` 无 `FAIL`，不再报 `index-template.md 必留项 缺失 纯指针边界`；决策链不再对 N10 自身 `D-*` 产生 92 条全假告警；总检查走原六段并退出 0。
失败：干净 N10 材料被误报硬失败、模板误报仍在、或总检查退出码变化。
证据：`quality/tests/2026-10-20-n10-consistency-baseline.output` 作为改动前对照；改动后同命令原始输出与 exit 存入 `quality/tests/`。

- [ ] **AC-CHECK-2**：合法根下没有可判输入时，输出「没有输入，未检查」，exit 0，不出现「全部通过」或「consistent」。
验证：build-code 实施者用空目录跑 `check-decision-log-chain --root <empty>`，用空材料根跑 `run-checks --material-root <empty>`，用空 catalog（0 字节或 `skills: []`）跑 `check-skill-consistency --root <fixture>`；这些根都存在且合法，只是没有输入；执行 owner 是 P1/P3 实施者，verify-code 复核。
通过：三个场景各出现「没有输入/未检查」或等价具名行；exit 0；stdout 不含 `ALL CHECKS PASSED`、`current declarations consistent` 或 `0 warning(s)` 冒充通过。
失败：零输入报全绿、静默跳过、或退出码变为 1；缺 catalog 的 root 被误当零输入（应归 AC-CHECK-3）。
证据：三类空输入命令的 argv、cwd、exit、stdout 原件存入 `quality/tests/`。

- [ ] **AC-CHECK-3**：不存在的文件、相对 root、坏参数、缺值给一句人话点名问题，exit 1，不以原始堆栈为唯一输出。
验证：P1 实施者执行 `check-decision-log-chain --file <不存在>`、`--file` 缺值、`--bogus`；`check-skill-consistency --root relative`、`--root <不存在>`；`run-checks --bogus`；输入为真实路径/坏参数，执行 owner 是 P1 实施者，verify-code 复核。
通过：每条命令 stderr/stdout 有一句可读的「无法读取/参数无效/缺少值」类事实并点名输入；exit 1；不出现 `Node.js v24` 原始堆栈作为唯一输出；合法路径仍按 AC-CHECK-1 通过。
失败：只抛堆栈、静默回落到默认扫描、或退出码不可区分。
证据：六类坏输入的 argv、exit、stdout/stderr 原件。

- [ ] **AC-CHECK-4**：临时放入一处真实违规再撤销：违规时该检查点名并失败/告警；撤销后同字节复跑恢复。
验证：P1 实施者在临时根复制最小 catalog/阶段依赖，制造一处重复注册（或删除必填字段）作为真实违规；另用一份真实 decision-log 副本删除一个必填字段制造链告警；执行 owner 是 P1 实施者，verify-code 复核；撤销后用 `cmp`/字节比较确认恢复原字节。
通过：违规时 `check-skill-consistency` exit 1 并点名条目/位置，或 decision-chain 输出具名 WARNING；撤销后同一条命令 exit 0 且无该告警；恢复字节与原件一致。
失败：违规不报、恢复后仍红、或恢复字节不一致。
证据：违规前后命令、exit、stdout 与字节比较原件。

- [ ] **AC-CHECK-5**：总检查不带参数时仍走原六段聚合，退出 0/1，stdout 不是 final-chain JSON；不出现因新增材料段而多跑的段。
验证：P1/P3 实施者在改动前后跑 `node tools/cli/run-checks.mjs`，记录六段 checker 名、exit、stdout 是否含 `final-chain`/材料段标记；执行 owner 是 build-code 实施者，verify-code 复核；改动前的基线见 `quality/tests/2026-10-20-n10-run-checks-baseline.output`。
通过：仍出现六个既有 checker 名；exit 0；stdout 不含 final-chain JSON；stdout 六段与 N9 冻结基线逐字一致；stderr 恰有一行 `[run-checks] material check not run: no --material-root`，不含 `[run-checks][material]` 材料段；无参数路径不因 `--material-root` 逻辑被触发。N9 的 no-argument 测试按 P3/T015 的窄 TCR 只放宽 `stderr` 断言，stdout/exit/顺序不变。
失败：无参数行为变化、退出码改变、或材料段在无参数时运行。
证据：改动前后同命令的 stdout、exit；不要求逐字一致，已列具名修复（D-* 误判、零输入提示）允许文本变化，需在证据中列出差异。

- [ ] **AC-CHECK-6**（新增，承接 R-012/PFACT-011、D-026）：本任务清零已知既有红；两个具名测试文件最终 `0 failed`，且没有通过删/弱化/跳过断言或放宽生产 allowlist 达成。
验证：P1/T005 先复现当前 3 failed，改 `tests/contract/ocr-production-cutover.test.mjs` 的三处请求 materials 后执行 `npx vitest run tests/contract/ocr-delegation-route.test.mjs tests/contract/ocr-production-cutover.test.mjs`；执行 owner 是 P1/T005 实施者，verify-code 复核；基线原件为 `quality/tests/2026-10-21-n10-post-n9-ocr-baseline.output`（3 failed / 47 passed / 1 skipped）。
通过：最终 0 failed；3 个具名失败消失；`ocr-delegation-route` 原有断言仍通过；1 skipped 若仍在须写原因；只改请求 materials/必要夹具，未改生产 allowlist、未删断言；PRD 7+3 与实际 3 的差异如实记录。
失败：仍有 failed、靠删断言/跳过/放宽 allowlist 变绿、改生产 OCR 行为、或把 3 写成 10。
证据：改动前后 vitest 原始输出、exit、失败测试名、测试 diff、PRD 引。

- [ ] **AC-SOURCE-1**：对现有目录、能力决定、声明、复用索引跑检查，合法输入不新增误报，退出语义不变。
验证：P2 实施者执行 `node tools/cli/check-skill-consistency.mjs --root "$PWD"` 与 `node tools/cli/run-checks.mjs`；输入为当前 catalog（41 skills/73 decisions）、notice、reuse-registry、bundle.sources；执行 owner 是 P2 实施者，verify-code 复核。
通过：consistency exit 0；新增来源段只出现在 reports，不把合法输入变成 failures；总检查 exit 0；不预填坏引用数。
失败：合法输入被新检查误红、退出码变化、或新增段写成阻断。
证据：改动前后 consistency stdout/exit 与总检查输出；基线 `quality/tests/2026-10-20-n10-consistency-baseline.output`。

- [ ] **AC-SOURCE-2**：五类受控违规各自报出具体条目/位置；恢复同字节后报告消失；公共 0/1 不变。
验证：P2 实施者用临时根复制最小 catalog/notice/reuse-registry/阶段依赖，分别制造：删已采用项、改固定版本、删第三方声明、改 vendored 脚本一字节、把 `debate` 加回阶段依赖；执行 owner 是 P2 实施者，verify-code 复核；每例恢复后用字节比较确认。
通过：每例 reports 点名具体 name/path/字段；不新增 exit 1（只报告）；恢复后同名报告消失；第五例若走既有失败通道则 exit 1 且点名 retired，恢复后 exit 0。
失败：任一类不报、恢复后仍报、或把只报告项升成阻断。
证据：五组命令、stdout、exit、恢复字节比较。

- [ ] **AC-SOURCE-3**：合法根下来源输入为空（空文件或 `skills: []`）报「没有来源输入，未检查」，exit 0；缺 catalog 的 root 仍按坏输入 exit 1。
验证：P2 实施者用两个临时根：一个 `skills/catalog.yaml` 为空文件，一个 `skills: []` 但阶段文件最小合法；另用缺 catalog 的 root；执行 owner 是 P2 实施者，verify-code 复核。
通过：前两例出现具名「没有来源输入」/「未检查」并 exit 0，不出 `current declarations consistent`；第三例 exit 1 并点名缺 catalog。
失败：空来源报一致/全绿，或缺 catalog 被当零输入 exit 0。
证据：三组命令、stdout、exit。

- [ ] **AC-SOURCE-4**：figure-it-out、setup-ts、swarm、correct/encode、poteto、bundle.sources 在目录/声明有唯一机器条目或许可出口；假版本改真坐标；pointer-only 要么有真实读者，要么在 Appendix B 标未完成/不采用并写理由；不重复登记 setup-ts。
验证：P2/P5 实施者读回 `skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md`、相关 bundle 与 Appendix B；执行 owner 是 P2/P5 实施者，verify-code 复核；用 grep/节点解析确认唯一 name、commit/坐标、license、local_path。
通过：figure-it-out 有 catalog/notice 条目与真实 local_path；swarm 有 consumer-only 诚实登记（不写 absorbed）；correct/encode 的 commit 改为采用快照 `1f0f9c3` 且有 notice；poteto 保持「上游坐标、本地无入口」；bundle.sources 自指被说明；setup-ts 只有一条登记；无读者项在 Appendix B 标未完成或不采用并写理由。
失败：仍缺登记、假版本仍在、pointer-only 被写成已接线、或 setup-ts 重复。
证据：catalog/notice/registry 读回片段、Appendix B 对应行、`rc` 命令。

- [ ] **AC-SOURCE-5**：新增来源检查接进总检查后，只报告、不改公共 0/1；新增常驻字节与删除重复可对账。
验证：P2 实施者跑 `node tools/cli/run-checks.mjs`，对比改动前后 exit、报告行；用 `wc -c` 量 catalog/notice/registry 与新增报告文本；执行 owner 是 P2 实施者，verify-code 复核。
通过：总检查 exit 0；新增来源报告在 stdout；无新增阻断；字节表列出增加/减少、理由与分母，重复内容被删或外置。
失败：新检查阻断既有流程、退出码变化、或只增不减且无理由。
证据：改动前后 run-checks stdout/exit、字节表。

- [ ] **AC-SOURCE-6**（新增，承接 R-026）：13 条来源原文的 URL/坐标/sha256/许可/可得性可回读（索引实际键为 `status`，旧称 `fetch_status`）；pstack 采用内容按 2026-10-14 快照，4 份 HEAD 漂移可指认；原文不 vendored 进仓库。
验证：P5 实施者运行只读脚本读 `quality/evidence/source-originals/source-originals-index.json`，核对 13 条 `status`（实际键；旧称 `fetch_status`）、`sha256`、`license`、`url`、`commit_or_coordinate`；比对 pstack 快照与 HEAD 的 4 个文件；执行 owner 是 P5 实施者，verify-code 复核；不联网。
通过：13 条全部 `fetched`；每条字段非空；4 份漂移列出；仓库内 `git ls-files` 不含这些原文副本；不把 HEAD 当采用版本。
失败：条数不足、字段缺失、用 HEAD 冒充快照、或把原文复制进仓库。
证据：索引 JSON 读回、4 份漂移对照、`git ls-files` 结果。

- [ ] **AC-MATERIAL-1**：对 N8/N9 合法材料、显式指向 N2 材料：合法材料 0 error；N2 两处真错误在显式指向时可见；默认检查不被历史错误拖红。
验证：P3 实施者执行 `node tools/cli/run-checks.mjs --material-root /Users/Hugh/Hugh/Project/workflowhub-n10-finite-check-wiring-20261020/specs/archive/n8-four-level-route-20261019`、`--material-root /Users/Hugh/Hugh/Project/workflowhub-n10-finite-check-wiring-20261020/specs/archive/n9-final-chain-verification-20261020`、`--material-root /Users/Hugh/Hugh/Project/workflowhub-n10-finite-check-wiring-20261020/specs/archive/n2-skill-catalog-portability-20261016`、不带参数；执行 owner 是 P3 实施者，verify-code 复核。
通过：N8 与 N9 材料各 0 error 且 exit 0；N2 显式指向时列出 2 条既有 error（T006 G-2 / expected_exit）；无参数时不跑材料段、不被 N2 拖红。
失败：合法材料误红、N2 错误不可见、或无参数默认扫 `specs/`。
证据：三组命令 argv、stdout、exit。

- [ ] **AC-MATERIAL-2**：空 spec、缺 L1、index 无指针行：缺什么报什么；撤销后同字节复跑恢复。
验证：P3 实施者在临时材料根复制 N8 合法材料，分别制造空 spec、删 L1、删 index 指针行；执行 owner 是 P3 实施者，verify-code 复核；恢复用字节比较。
通过：每例报出具体缺项与文件/字段；exit 1（显式根）；恢复后 0 error、exit 0、字节一致。
失败：缺段不报、恢复后仍红、或报错位置不可定位。
证据：三组命令、stdout/exit、恢复字节比较。

- [ ] **AC-MATERIAL-3**：空目录、空文件、缺省材料根：报「没有输入/不适用」，exit 0；不出现全绿。
验证：P3 实施者用空目录、空文件、不带 `--material-root` 三种输入；执行 owner 是 P3 实施者，verify-code 复核。
通过：空目录/空文件出现具名「没有输入/不适用」并 exit 0；不带参数时不运行材料段，且 stderr 恰输出一行 `[run-checks] material check not run: no --material-root`；不出现 `ALL CHECKS PASSED` 被材料段冒用。
失败：空输入报全绿、静默跳过、或退出 1。
证据：三组命令、stdout、exit。

- [ ] **AC-MATERIAL-4**：轻档只有 decision-log；伪轻档有 spec/index 但缺 Phase：前者报「不适用」，后者报缺段。
验证：P3 实施者构造两个临时材料根：轻档 decision-log 含 `推荐级别：轻档`、无 spec/index；伪轻档同一行但有 spec/index、无 Phase；执行 owner 是 P3 实施者，verify-code 复核。
通过：轻档报「这个级别不适用」并给出级别依据、exit 0；伪轻档报具体缺 Phase、exit 1；不把两者混为一谈。
失败：轻档报缺段、伪轻档报不适用、或级别依据缺失。
证据：两组命令、stdout、exit、级别依据行。

- [ ] **AC-MATERIAL-5**：干净 index 模板不再永久误报；真实 index 缺指针仍红；检查指名的内容缺口有逐项登记表（`content-gaps.json`，每项写缺什么/补哪个文件/怎么验证/影响谁），空表写“无”。
验证：P3 实施者跑 `node tools/cli/check-skill-consistency.mjs --root "$PWD"`；另用临时真实 index 删指针行跑材料段；再读 `quality/evidence/n10-finite-check-wiring-20261020/content-gaps.json`，逐项检查四字段（缺什么/补哪个文件/怎么验证/影响谁）或空数组写“无”；执行 owner 是 P3 实施者，verify-code 复核。
通过：干净模板不再出现 `index-template.md 必留项 缺失 纯指针边界`；临时真实 index 缺指针仍报 `requires an Execution Index...` 或具名缺项；`content-gaps.json` 存在、每项四字段非空或空数组写“无”；不删掉真缺检查。
失败：模板仍误报、真缺不报、缺口表缺失或字段为空。
证据：改动前后 consistency stdout、临时 index 命令输出/exit、`content-gaps.json` 读回。

- [ ] **AC-MATERIAL-6**：跳过理由三态：裸 N/A 红；N/A 带理由绿；deferred 缺责任卡红。
验证：P3 实施者在临时 Phase 文件中分别写裸 `N/A`、`N/A — 具体理由`、`deferred` 无责任卡；跑 `run-checks --material-root`；执行 owner 是 P3 实施者，verify-code 复核。
通过：CLI 材料段的 `triageSkipReasons` 对显式状态声明中的裸 N/A 报错；带理由通过；deferred 缺责任卡由同一窄检查报出；三种输入可区分。本次只纠正诊断 producer 为已批准的 CLI 窄检查，不改变成功/失败判据、validator、FR/AC 编号或范围。
失败：裸 N/A 通过、带理由误红、或 deferred 缺责任卡不报。
证据：三组材料命令、stdout、exit。

- [ ] **AC-METHOD-1**：逐条读已交付的测试/审查/收口/来源规则：每条有真实消费者（阶段步骤/依赖触发/人读读者）与 path:line 证据；无消费者标未完成。
验证：P4 实施者产出读回表，覆盖 r9 §5.3 的 13 条消费者与 r9 §5.4 的人工边界；执行 owner 是 P4 实施者，verify-code 复核；逐条打开路径确认。
通过：每条有 path:line 与触发方式；无消费者的条目写「未完成」；不把正文存在当读者。
失败：只写规则名、路径不存在、或把人工项写成机器验证。
证据：`quality/evidence/` 的读回表、`n10-method-readback.test.mjs` 对行数与路径存在性的断言。

- [ ] **AC-METHOD-2**：把一处测试改成同义反复或按实现重算，真实测试/审查能指出假绿；撤销后恢复绿。
验证：P4 实施者在临时副本中把 `tests/contract/n6-decision-unit-target.test.mjs` 的一处目标断言改成同义反复（或按实现重算），跑原测试；执行 owner 是 P4 实施者，verify-code 复核；不修改真实测试文件。
通过：变异后的测试仍能被执行，但原断言意图被破坏时真实测试/独立审查能指出；恢复原字节后同一命令通过；演示不声称覆盖所有假绿形态。
失败：改了也不报、恢复后不绿、或用注入缝/字符串变异充数。
证据：变异前后测试文件字节、命令、exit、失败断言；恢复后字节比较。

- [ ] **AC-METHOD-3**：不能机判的规则明写「只给人工」，不伪装机器通过；处置表人工/机器分列。
验证：P4 实施者读回表逐条标注 `machine`/`manual`/`both`；执行 owner 是 P4 实施者，verify-code 复核；抽 3 条人工项核对没有机器断言冒充。
通过：每条有分列与理由；人工项不写成 pass；机器项有命令/路径。
失败：用文字存在冒充机器验证、或人工项缺失。
证据：读回表、抽样核对。

- [ ] **AC-METHOD-4**：correct/encode 的 notice、swarm 的登记在 B 块修复后读回；仍缺的标未完成。
验证：P4 实施者读 `THIRD_PARTY_NOTICES.md`、`skills/catalog.yaml`、Appendix B；执行 owner 是 P4 实施者，verify-code 复核。
通过：correct/encode 有 notice 与真实坐标；swarm 有 consumer-only 登记；仍缺项在 Appendix B 标未完成；不把登记读成已生效行为。
失败：登记缺口被读回成已生效、或仍缺却不标。
证据：三文件读回片段、Appendix B 对应行。

- [ ] **AC-SET-1**：17 行与 E-1…E-10 逐项处置：每行给「已生效读回／本次接线验证／不采用及理由」之一，并有消费者或未完成原因；两组分开计数。
验证：P5 实施者读 Appendix B，逐行核对 17+10 行；执行 owner 是 P5 实施者，verify-code 复核；用 `n10-source-disposition.test.mjs` 断言行数与处置词。
通过：17 行与 10 行各有且仅有一种处置；9/10 本次接线验证（N9 已合入，待 P5/T023）；13/15/17 不采用；不把两组相加成 27 个新机制。
失败：有行只写名称、无处置、或冒充已生效。
证据：Appendix B、测试输出、逐行读回。

- [ ] **AC-SET-2**：figure-it-out 落点与收口指针：`verify-code` 检查可信度段可读到四条规则；`stage-reflection` 只有指针；无第二份全文。
验证：P5 实施者读 `workflows/verify-code/SKILL.md` 与 `skills/stage-reflection/SKILL.md`；执行 owner 是 P5 实施者，verify-code 复核；对比两处文本，确认只有一处全文。
通过：verify-code 段有四条规则（检查错在其范围修、通过太易先疑观察、结论分已验证/未验证/无法判断、复发修正→具名检查）；stage-reflection 有一行指向 verify-code 的条件指针；无第二份全文。
失败：两处各写全文、收口读不到、或只有 catalog 登记无正文。
证据：两文件读回片段、diff/重复文本检查。

- [ ] **AC-SET-3**：N9 接口已合入：`--task-path` 任务参数可解析、缺环有具名结论、exit 0；无参数输出/退出不变；未执行复验时标 incomplete。
验证：P5/verify-code 在认证 worktree（cwd）执行 `node tools/cli/run-checks.mjs --task-path <N10 任务根>` 与无参数命令；执行一次并把 stdout/exit 留原件；断言 `material_root` 以 `/specs/n10-finite-check-wiring-20261020` 结尾；执行 owner 是 P5 实施者，verify-code 复核。
通过：stdout 单份 JSON、可 parse、rings 1..10、五态、`counted_in_denominator` 公式、缺环负例仍 exit 0、任务不可读 exit 2；无参数仍走聚合；未执行时 AC 为 incomplete，不写 pass。
失败：用计划文字/字段存在冒充已接线、改生产代码迁就未定字段、或无参数行为变化。
证据：`--task-path` stdout/exit、无参数 stdout/exit、N9 merge commit `b8856e5e`。

- [ ] **AC-SET-4**：维护者一次重跑完整集合：现有总检查能跑全部适用检查并点名问题；报告可重定向留证。G1 的 N1 成本读数不属本卡，交 N1/N11 复核，本卡只验重跑入口。
验证：P7 实施者执行 `node tools/cli/run-checks.mjs`（N9 已合入，另跑 `--task-path`），把 stdout 重定向到 `quality/tests/`；执行 owner 是 P7 实施者，verify-code 复核。
通过：一条命令覆盖六段 + 材料段（显式根时）；报告点名失败项；可重定向；不要求记三条命令；未跑项明确列出。
失败：需要多入口/漏跑、报告不可留证、或把未跑写成已跑。
证据：聚合命令 argv、stdout 原件、exit。

- [ ] **AC-SET-5**：改动前后常驻文档字节逐项给增减、理由与分母；重复被删或外置；不声称严格不增。
验证：P7 实施者用 `wc -c` 量 `skills/spec-specify/SKILL.md`、`skills/spec-plan/templates/*.md`、`workflows/{make-decision,verify-code}/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/flows/normal/SKILL.md`、`skills/wh-review/contracts/make-decision.md`、`specs/n10-finite-check-wiring-20261020/n8-corrections.md`、`docs/adr/0052-direction-review-before-module-convergence.md`、`skills/stage-reflection/SKILL.md`、`skills/catalog.yaml`、`THIRD_PARTY_NOTICES.md`、`skills/reuse-registry.md`；执行 owner 是 P7 实施者，verify-code 复核；代码字节不计入分母。
通过：每项有改动前后字节、增减、理由与分母；重复内容被删或外置；报告明写「本卡不声称严格不增」。
失败：只报净行数、把新增藏到未统计文件、或仍宣「字节不增」。
证据：字节表、`wc -c` 输出、改动前后文件。

- [ ] **AC-SET-6**（新增，承接 R-027）：N9 已合入，build-code 对十环、prove-it-works、sequence-verifiable-units 与 `run-checks --task-path` 逐项复验；未执行前保持 incomplete。
验证：P5/verify-code 跑十环报告与缺环负例，读 9/10 两行 Appendix B；执行 owner 是 P5 实施者，verify-code 复核。
通过：十环报告与两行来源有真实消费者/证据；缺环负例具名；任务参数可用；未执行时 AC 明确 incomplete、不写 pass。
失败：用 N9 计划文字当交付、或把未执行写成已完成。
证据：N9 merge commit `b8856e5e`、十环 stdout、Appendix B 9/10 行。

- [ ] **AC-PROCESS-1**：读 make-decision 第 5/7/8/9 步与 steps.json：第 8 步前有「方向审已回读/未达不逐包」禁入句；第 5 步只问方向轴；第 7 步仍在前；15 slug 不变；真实执行顺序标未验证。
验证：P6 实施者读 `workflows/make-decision/SKILL.md` 与 `steps.json`；执行 owner 是 P6 实施者，verify-code 复核；静态断言检查顺序与文本。
通过：第 8 步前有禁入句；第 5 步文本只问方向轴/骨架；第 7 步仍第 7；15 个 slug 与顺序不变；报告明写「只保证书面顺序，真实执行顺序未验证」。
失败：禁入句缺失、第 7 步被移到第 9 步后、或把文本断言说成已强制真实顺序。
证据：两文件读回、`n10-process-repair.test.mjs` 断言输出。

- [ ] **AC-PROCESS-2**：方向审查请求/记录：被审大纲有可回读 ref＋sha256，能说清「审了哪版」；被引用的用户答复（如 U-021）原件在包内。
验证：P6 实施者读方向审查请求/记录与当前包；执行 owner 是 P6 实施者，verify-code 复核；核对 ref 可解析、sha256 与大纲字节一致、答复原件在包内。
通过：请求含 `{ref,sha256}`，或内联字节的 sha256 加可回读原件位置（两者至少一项可复核）；sha256 与原件一致；U-021 等引用答复在包内有原件；不把版本当许可；只有口头“等价事实”而无 sha/位置的记 incomplete。
失败：只有内联文本、事后无法指认版本、或引用包外答复。
证据：请求 JSON、审查记录、答复原件、sha256 复算。

- [ ] **AC-PROCESS-3**：wh-review 的 make-decision 合同：direction 的「当前选择」只指骨架级，不含逐模块方案结论。
验证：P6 实施者读 `skills/wh-review/contracts/make-decision.md`；执行 owner 是 P6 实施者，verify-code 复核。
通过：合同明确「当前选择＝骨架级」；不含模块方案/字段级取舍；保留 reveal/challenge 分段。
失败：模块结论混入方向包、或合同仍写全量当前选择。
证据：合同读回片段。

- [ ] **AC-PROCESS-4**：N8 根 SKILL、更正件、normal 技能表、31 矩阵、P7：普通方案审不再漏写；归档 spec 矛盾由更正件消除且归档未改；intake 改回跳过；降档有登记；P7 未跑项标未完成。
验证：P6 实施者逐文件读回；执行 owner 是 P6 实施者，verify-code 复核；检查 P7 仍为 incomplete，不改历史。
通过：`SKILL.md:195` 按级别写普通方案审；更正件三处摘要与 `:121/:619` 一致；normal `intake-decision-review` 行为跳过；31 矩阵降档登记在更正件；归档 N8 spec 未改；P7 仍 incomplete；错序负例仍标 incomplete/未跑，不补假绿。
失败：任一矛盾仍在、或把文档改齐当行为通过。
证据：各文件读回片段、P7 状态行。

- [ ] **AC-PROCESS-5**：不新增强制门、审批、公共命令、facts 字段或第二进度权威；0/1 语义不变。
验证：P6 实施者读 diff 与 `AGENTS.md`/stage-runtime 约束；执行 owner 是 P6 实施者，verify-code 复核。
通过：改动只在文本/steps observable_result/测试；无新命令/字段/schema；`run-checks` 与检查退出语义不变。
失败：新增 gate/状态机/第二权威。
证据：`git diff --name-only`、diff 读回、命令输出。

- [ ] **AC-PROCESS-6**：方向审后只重开被挑战模块；未被挑战模块保留并标「方向审前确认」；不新增第二轮方向审。
验证：P6 实施者读 decision-log OI-013 与 F 块；执行 owner 是 P6 实施者，verify-code 复核。
通过：重开清单为空；五块保留并标「方向审前确认」；无第二轮方向审记录。
失败：全部重做/全部不重做、或伪称方向审通过。
证据：decision-log 审查节、重开清单。

- [ ] **AC-PROCESS-7**：两次 partial 审查记录如实写 partial/provider 失败/覆盖；用户选择用可用来源继续（U-025）；不写成完整通过。
验证：P6 实施者读 decision-log 审查节与 provider 原件；执行 owner 是 P6 实施者，verify-code 复核。
通过：记录保留 partial、codex/kimi 完成、opencode/antigravity 失败/取消；不伪造成功或空 findings。
失败：把 partial 改成全绿、伪造 provider 成功或覆盖。
证据：审查节、provider-raw 原件、U-025。

- [ ] **AC-PROCESS-8**（新增，承接 R-025）：两次审查的真实根因记录在案；N9 已合入，build-code 做一次受控复验；未解决再在本任务设计最小修复；不新增 gate。
验证：P6 实施者读 decision-log 根因表；执行一次受控探针（只核 provider 启动/完成/收场与解析）；执行 owner 是 P6/T032，verify-code 复核。
通过：RC-1/2/3 各有现象、根因证据与未解决时处置；N9 后复验结果如实记录（RC-1 已修/RC-2 未修/RC-3 设计承接）；未解决时给出 D-025 的最小设计或明确待办；不新增 gate。
失败：没有根因、没复验就写已解决、或复验再开完整审查。
证据：根因表、N9 merge commit `b8856e5e`、复验记录。

- [ ] **AC-DISK-1**（新增，承接 D-028/FR-DISK-001）：WorkflowHub 临时目录有生命周期；成功/失败/取消后本进程目录无残留；stale 扫描只清允许前缀+owner marker+超龄+pid 不活，不按裸前缀删。
验证：P8/T037 跑 `npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`，统计前后 `wh-review-*` 数量；T040 写 before/after count 与负例。
通过：测试 exit 0；before/after delta=0；`paperbuilder-*` 与无 marker 目录不被清理；本进程目录退出后为 0。
失败：测试后仍新增目录、误删非自有目录、或把历史 110 个目录算成本次清理。
证据：`quality/tests/2026-10-21-n10-p8-t033-{before,after}.output` 与 `.count`。

- [ ] **AC-DISK-2**（新增，承接 D-028/FR-DISK-002）：任务证据预算 soft 只告警、hard 写前失败；超限不删除/覆盖旧件；错误携带 subdir/current/incoming/hard。
验证：P8/T038 用临时任务根与小 limits 注入；T039 在 review 路由重放；执行 owner 是 P8 实施者，verify-code 复核。
通过：软阈值 stderr 一行告警；hard 抛 `DISK_BUDGET_EXCEEDED`；失败前目录 bytes/files 不变；旧件 sha256 不变。
失败：超限仍写、删旧件、错误无字段、或把告警当失败。
证据：`n10-disk-boundedness.test.mjs -t T038/T039` 输出、错误对象、前后 bytes/sha256。

- [ ] **AC-DISK-3**（新增，承接 D-028/FR-DISK-003）：只读审计输出按历史/当前/unknown 分类；审计前后原件字节/inode 不变；不扫 PaperBuilder、不按前缀清理。
验证：P8/T038 在 fixture 上运行 `node tools/cli/audit-disk-usage.mjs --task-root <fixture>`；T040 在 N10 任务根只读跑一次。
通过：JSON 有 `historical`/`active`/`unknown`；`review-materials`/旧 facts/index 归 historical；`quality/reviews` 归 active；前后 sha256 相同；无删除参数。
失败：审计写文件/删文件、把历史归 active、或把 PaperBuilder 算入。
证据：审计 JSON、前后 sha256、fixture 目录清单。

- [ ] **AC-DISK-4**（新增，承接 D-028/FR-DISK-004）：review 路由在 hard 预算前失败；不产生半截 JSON；相同 provider bytes 复用不新增文件；旧审查原件保真。
验证：P8/T039 用临时任务根 + 注入 `runRound`；先写一次，再超限写；执行 owner 是 P8 实施者，verify-code 复核。
通过：第一次成功；第二次 `DISK_BUDGET_EXCEEDED` 且零新文件；旧文件 sha256 不变；相同 bytes 复用不增文件。
失败：超限仍写、半截 JSON、复用失效、删旧文件。
证据：`-t T039` 输出、前后目录 bytes/files、错误对象、复用断言。

## Appendix B — 有限集合逐项处置

本节承接 R-016/R-011。17 行与 E-1…E-10 是两套粒度，不能相加。处置词只有四种：已生效读回、本次接线验证、未完成、不采用。

### B.1 17 条来源行

| # | 来源键 | 处置 | 消费者 / 未完成原因 | 本轮证据 |
| --- | --- | --- | --- | --- |
| 1 | mattpocock::tdd | 已生效读回 | `skills/backend-testing/SKILL.md:16-20`；frontend/fullstack 指针；build-code skill-deps | r9 §1；AC-METHOD-1 |
| 2 | mattpocock::writing-for-agents | 本次接线验证 | WR001 正文与 ≥10 处写前必读；修 index 模板误报、补模板负例 | P3/T013；AC-MATERIAL-5、AC-MATERIAL-6 |
| 3 | mattpocock::setup-ts-deep-modules | 本次接线验证 | 登记已在 `catalog:1894-1910`、`notice:49`；补合法→违规→恢复负例 | P2/T010；AC-SOURCE-2 |
| 4 | addyosmani::code-review-and-quality | 已生效读回 | `workflows/verify-code/SKILL.md:51-55`；wh-review 合同 | r9 §1；AC-METHOD-1、AC-METHOD-2 |
| 5 | pstack::correct | 本次接线验证 | 方法已交付；commit 改采用快照、notice 补齐 | P2/T009；AC-SOURCE-4、AC-METHOD-4 |
| 6 | pstack::show-me-your-work | 已生效读回 | `skills/wh-review/SKILL.md:28`；build-code 审查触发 | r9 §1；AC-METHOD-1 |
| 7 | pstack::tdd | 已生效读回 | 与 #1 同一 consumer；不另造 TDD 技能 | r9 §1；AC-METHOD-1 |
| 8 | pstack::encode-lessons-in-structure | 本次接线验证 | 方法已交付；commit 改采用快照、notice 补齐 | P2/T009；AC-SOURCE-4、AC-METHOD-4 |
| 9 | pstack::prove-it-works | 本次接线验证 | N9 已合入，`runtime/task/final-chain.mjs`/`final-chain-runner.mjs` 在场；本卡复验十环与两行来源 | P5/T023；AC-SET-3、AC-SET-6 |
| 10 | pstack::sequence-verifiable-units | 本次接线验证 | 同 #9；材料侧 STOP/Done/evidence 已有，N9 consumer 已合入，待本卡复验 | P5/T023；AC-SET-3、AC-SET-6 |
| 11 | pstack::subtract-before-you-add | 已生效读回 | `skills/simplicity-guard/SKILL.md:32`；build-plan 触发 | r9 §1；AC-METHOD-1 |
| 12 | pstack::foundational-thinking | 已生效读回 | `skills/simplicity-guard/SKILL.md:64`；与 #11 同一 consumer | r9 §1；AC-METHOD-1 |
| 13 | pstack::redesign-from-first-principles | 不采用 | 仅 `catalog:49` 注释；bundle.sources 全自指；无真实 reader/本地正文；不采用，不补登记（D-027） | P5/T022；AC-SET-1 |
| 14 | pstack::fix-root-causes | 已生效读回 | 窄信号 `run-checks.mjs:19-25,150-158`；verify-code:51；测试 `n2-skill-catalog-portability.test.mjs:341-352` | r9 §1；AC-METHOD-1 |
| 15 | pstack::poteto-mode | 不采用 | `catalog:2533-2555` 仅 prototype、commit unresolved；`AGENTS.md:50-56` 只有文本指针，本地无正文入口；不采用（D-027） | P5/T022；AC-SET-1 |
| 16 | pstack::swarm | 本次接线验证 | 消费者真实（AGENTS 派发/回传）但未按名登记；补 consumer-only（watch），不写 absorbed | P2/T009；AC-SOURCE-4 |
| 17 | pstack/benny::reproduce-and-fix-issues | 不采用 | 整包弱于 `diagnosing-bugs`；依赖本仓不存在的配置/媒体 consumer；退役登记已有 | decision-log 退役登记；AC-SET-1 |

**figure-it-out（固定新增 1 项，不在 17 行）**：处置＝本次接线验证。catalog/notice 补登记；正文落 `workflows/verify-code/SKILL.md` 检查可信度段；`skills/stage-reflection/SKILL.md:30` 只加指针。证据：P2/T009、P5/T021、AC-SET-2。

### B.2 E-1…E-10

| 机制 | 处置 | 消费者 / 缺口 | 本轮落点 |
| --- | --- | --- | --- |
| E-1 WR001 | 本次接线验证 | 规范与写前必读已交付；修 index 模板误报、补负例；作者产物语义仍人工 | P3/T013；AC-MATERIAL-5、AC-MATERIAL-6 |
| E-2 来源三层 | 本次接线验证 | 只形状 → 扩引用/状态/固定来源/集合/vendored/豁免/投影；豁免类无统一字段的条目报 unknown，不冒充已覆盖 | P2/T006-T010；AC-SOURCE-1、AC-SOURCE-2、AC-SOURCE-5 |
| E-3 材料检查 | 本次接线验证 | validator 完整但未接总检查；接显式材料根 | P3/T011；AC-MATERIAL-1…AC-MATERIAL-4 |
| E-4 完成判据回填 | 本次接线验证 | N9 已交付并按十环消费；本卡复验完成判据与两行来源 | P5/T023；AC-SET-3、AC-SET-6 |
| E-5 mutation-proof | 本次接线验证 | 方法已交；补本轮每个新增/扩展检查的合法→违规→恢复 | P1/P2/P3 测试；AC-CHECK-4、AC-SOURCE-2、AC-MATERIAL-2 |
| E-6 测试反模式 | 已生效读回 | `backend-testing:16-20` 一处定义；frontend/fullstack 真指针；build-code 触发 | P4/T017；AC-METHOD-1 |
| E-7 AGENT-BRIEF | 已生效读回 | phase/decision-log 模板读者/读完要能；decision-log 第 10 步 | P4/T017；AC-METHOD-1 |
| E-8 skip 理由 | 本次接线验证 | 三态文本已在；裸 N/A 已拒；补 deferred 责任卡负例 | P3/T012；AC-MATERIAL-6 |
| E-9 pstack notice | 本次接线验证 | correct/encode 假 commit、notice 缺；与 E-2 同一纯函数 | P2/T009；AC-SOURCE-4 |
| E-10 过期投影 | 已生效读回 | `debate` retired；active 引用会 hard fail；造恢复负例 | P2/T010；AC-SOURCE-2 |

## Appendix C — 56 条 R/U 覆盖索引

本节逐条落 27 条 R 与 29 条 U；`有落点` 指 FR/AC/Phase/Task 或过程载体。56 行之外不新增 R/U。

| 来源 | 落点 | 状态 |
| --- | --- | --- |
| R-001 | FR-CHECK-001…FR-SET-008；P1–P5 | 有落点 |
| R-002 | FR-CHECK-001、FR-SOURCE-001、FR-MATERIAL-001；P1–P3 | 有落点 |
| R-003 | FR-CHECK-001…003、FR-SOURCE-001；P1/P2 | 有落点 |
| R-004 | FR-SET-003；P5/T021 | 有落点 |
| R-005 | AC-CHECK-1…AC-PROCESS-8；全部 Phase | 有落点 |
| R-006 | AC-CHECK-1、AC-SET-3；P1/P5 | 有落点 |
| R-007 | FR-SET-004/007；P5/T023 | 有落点（N9 已合入，复验执行前 AC incomplete） |
| R-008 | FR-SET-004/007；P1–P5 | 有落点 |
| R-009 | FR-SET-005；P7 | 有落点 |
| R-010 | FR-CHECK-001、FR-SOURCE-001；P1/P2 | 有落点 |
| R-011 | FR-SET-003；P5 | 有落点 |
| R-012 | FR-CHECK-007；P1/T003 | 有落点（基线差异见 AC-CHECK-6） |
| R-013 | FR-SET-001；P5 | 有落点 |
| R-014 | FR-CHECK-001、FR-MATERIAL-001；P1–P3 | 有落点 |
| R-015 | 全部 FR/AC；五阶段材料 | 有落点 |
| R-016 | FR-SET-001/002；P5、Appendix B | 有落点 |
| R-017 | 全部 Phase 的独立验收 | 有落点 |
| R-018 | FR-MATERIAL-006；P3/T013 | 有落点 |
| R-019 | FR-SOURCE-004/005；P2 | 有落点 |
| R-020 | FR-SET-006；P7/T034 | 有落点 |
| R-021 | FR-PROCESS-001…003；P6 | 有落点 |
| R-022 | FR-PROCESS-004；P6 | 有落点 |
| R-023 | FR-PROCESS-001…008；P6 | 有落点 |
| R-024 | FR-PROCESS-004；P6 | 有落点（P7 历史保持 incomplete） |
| R-025 | FR-PROCESS-008；P6/T032 | 有落点（N9 后复验，AC-PROCESS-8 可 incomplete） |
| R-026 | FR-SOURCE-007；P5/T024 | 有落点 |
| R-027 | FR-SET-007；P5/T023 | 有落点（N9 已合入，复验执行前 AC incomplete） |
| U-001 | 过程载体：decision-log 原始需求、r1–r10 | 有落点（过程指令） |
| U-002 | R-017；全部 Phase 的独立验收 | 有落点 |
| U-003 | R-011/R-016；Appendix B | 有落点 |
| U-004 | D-001；本文件路线/worktree | 有落点 |
| U-005 | decision-log 批次 1–18；D-001…D-024 | 有落点（过程指令） |
| U-006 | 用户可见汇报与提问 | 有落点（过程约束） |
| U-007 | r1–r10；两次 partial 审查 | 有落点（过程约束） |
| U-008 | PFACT-002；FR-SET-004 | 有落点（事实） |
| U-009 | D-003；FR-MATERIAL-006 | 有落点 |
| U-010 | D-004；P1–P5 | 有落点 |
| U-011 | D-005；FR-SOURCE-004 | 有落点 |
| U-012 | D-006；FR-CHECK-001 | 有落点 |
| U-013 | D-007；AC-CHECK-2、AC-SOURCE-3、AC-MATERIAL-3 | 有落点 |
| U-014 | D-008；FR-SOURCE-004 | 有落点 |
| U-015 | D-009；FR-MATERIAL-002 | 有落点 |
| U-016 | D-010；FR-MATERIAL-003 | 有落点 |
| U-017 | D-011；FR-MATERIAL-005 | 有落点 |
| U-018 | D-012；FR-METHOD-001/002 | 有落点 |
| U-019 | D-013；FR-SET-003 | 有落点 |
| U-020 | D-014；FR-SET-005 | 有落点 |
| U-021 | D-015；FR-SET-006 | 有落点 |
| U-022 | D-016；FR-PROCESS-001 | 有落点 |
| U-023 | D-018；FR-PROCESS-001…008 | 有落点 |
| U-024 | D-019；AC-PROCESS-6 | 有落点 |
| U-025 | D-020；AC-PROCESS-7 | 有落点 |
| U-026 | D-021；AC-PROCESS-4 | 有落点（P7 历史） |
| U-027 | D-022；FR-PROCESS-008 | 有落点（N9 后复验） |
| U-028 | D-023；FR-SOURCE-007 | 有落点 |
| U-029 | D-024；FR-SET-007 | 有落点（N9 后复验） |

## 12. 风险、未决与交接

- **RISK-01（N9 字段/环语义漂移）**：N9 已合入 `b8856e5e`，字段/环语义仍可能与本卡断言有偏差。
  - **受影响 ID**：FR-SET-004/007、AC-SET-3、AC-SET-6、P5/T023
  - **触发条件**：N9 合入前试图实现十环或写死字段
  - **后果**：返工或假接线
  - **缓解或停止**：只定稳定键/顺序/退出/负例；先跑真实报告再对齐字段；复验执行前保持 incomplete
  - **处理阶段**：P5；verify-code
  - **验证**：AC-SET-3、AC-SET-6 的复验与 incomplete 路径
- **RISK-02（G1 覆盖）**：用户允许字节增加，但 N11/G1 可能按严格口径判不达标。
  - **受影响 ID**：FR-SET-006、AC-SET-5
  - **触发条件**：只报净增、不写理由/分母，或声称严格不增
  - **后果**：验收不通过或假账
  - **缓解或停止**：逐项字节表、删重复、写清分母与理由
  - **处理阶段**：P7
  - **验证**：AC-SET-5
- **RISK-03（10 红基线不一致）**：PRD 记 10 红，当前实测 3 红；D-026 要求全部清零，P1/T005 目标 0 failed；PRD 7 条历史红去向仍未核实。
  - **受影响 ID**：FR-CHECK-007、AC-CHECK-6、OPEN-02
  - **触发条件**：把 10 当硬指标，或把 3 写成 10
  - **后果**：假验收或漏掉回归
  - **缓解或停止**：改动前后同一命令、失败集合比较、如实写差异；不修测试
  - **处理阶段**：P1/P7
  - **验证**：AC-CHECK-6
- **RISK-04（内容缺口扩张）**：检查指名的新缺口可能超出 17/E 范围。
  - **受影响 ID**：FR-MATERIAL-006、PFACT-013、OPEN-03
  - **触发条件**：把未命名旧差额塞进本卡
  - **后果**：范围膨胀、字节失控
  - **缓解或停止**：只补 17/E 与检查点名缺口；超范围写 OPEN 交用户
  - **处理阶段**：P2/P3/P5
  - **验证**：Appendix B 与 AC-SET-1
- **RISK-05（共享文件串行）**：`check-skill-consistency.mjs` 被 P1/P2/P3 改，`run-checks.mjs` 被 P1/P3 改。
  - **受影响 ID**：P1/P2/P3 写集
  - **触发条件**：并行改同一文件
  - **后果**：覆盖/hunk 冲突
  - **缓解或停止**：P1→P2→P3 串行；每文件同一时刻一个写者；边界点名前写者/后写者
  - **处理阶段**：build-code
  - **验证**：index 依赖与 git diff

- **OPEN-01（N9 合入）**：N9 已合入 `b8856e5e`；按 AC-SET-3、AC-SET-6 复验。owner：N10 build-code；处理阶段：P5/verify-code；关闭条件：十环/任务参数复验通过。
- **OPEN-02（既有红差异）**：PRD 10 红 vs 实测 3 红；owner：当前主会话；处理阶段：P1/T005、verify-code；关闭条件：两文件 0 failed 原件齐备，PRD 7 条历史红去向如实记录，不声称 10。
- **OPEN-03（内容缺口边界）**：检查可能指名新缺口；owner：当前主会话/用户；处理阶段：P2/P3/P5；关闭条件：逐项判断在 17/E 内则补、超范围写 OPEN 待用户。
- **OPEN-04（索引覆盖行滞后）**：decision-log 四查「覆盖」已更新为 27/29；requirement-index 的 G-6 仍写 23+25，属证据索引滞后，不是 decision-log 当前事实；本 spec Appendix C 已列 56 条；owner：requirement-index 维护者；处理阶段：build-plan 收口前如实记录，不改历史决定。

## 13. 业务影响与回归范围

- **既有行为**：无参数 `run-checks` 六段聚合；决策链 advisory；`check-skill-consistency` 的 failures/reports；`validatePostPhaseContract` 的三个 consumer；N8 P7 历史 incomplete。
- **本需求影响**：检查报告文本与新增来源/材料段；catalog/notice/registry 登记；verify-code/stage-reflection 的 figure-it-out 落点；make-decision 第 5/8 步文本、steps observable、wh-review 合同、N8 文档。
- **回归路径**：P1 跑三个 CLI 合法/零/坏/违规/恢复；P2 跑五类来源违规；P3 跑 N8/N2/轻档/伪轻档；P4 跑读回与变异；P6 跑静态断言；P7 跑全 AC。
- **可能受冲击的业务规则**：无参数总检查输出文本（D-* 假告警修掉会变化）、catalog/notice 字节、N8 文档行号。
- **明确无影响**：不改变权限/认证、不改变 provider 协议、不改变 N9 代码、不改变 N8 四级结构、不跑 P7 四路。
