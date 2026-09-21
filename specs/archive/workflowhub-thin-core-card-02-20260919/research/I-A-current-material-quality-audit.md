# I-A 现有任务材料质量问题盘点（只读分析）

- **分析对象**：`specs/<task-id>/` 下的四材料（decision-log / spec / plan / tasks）与规划任务的 prd.md
- **样本**：
  - S1 `workflowhub-workflowhub-thin-core-card-01-20260919/specs/workflowhub-thin-core-card-01-20260919/` 四材料全量
  - S2 `workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/`（decision-log.md + prd.md）全量
  - S3 历史对标：`specs/archive/` 下 48 个含 decision-log 的 task 目录做规模普查，其中 5 个做细读（`governance-runtime-execution-chain-20260827`、`executable-ui-fullstack-design-contract-20260826`、`workflowhub-cost-baseline-and-blocker-close-20260917`、`m15-retirement`、`workflowhub-mechanism-simplification-t3-20260912`）
- **方法**：`wc -l/-c`、`shasum -a 256`、标题骨架提取（awk/python 按标题层级切节并统计行数）、逐节打卡分桶统计信噪比、行号锚点批量复核、AC 字段正则抽取与长度统计。未修改任何文件。
- **口径声明**：所有"占比"均为**行数占比**；分桶口径在 §4 显式写明，可复算。

---

## 1. 量化基线

### 1.1 主样本逐份对照表

| 样本 | 文档 | 行数 | 字节 | 字符数 | 标题数 | 表格数 | 表格行 | 代码块 | 最长行(字符) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| S1 card-01 | decision-log.md | 741 | 105,029 | 59,711 | 41 | 14 | 140 | 2 | **2,703** |
| S1 card-01 | spec.md | 760 | 65,862 | 34,149 | 56 | 5 | 48 | 0 | 433 |
| S1 card-01 | plan.md | 803 | 104,262 | 64,959 | 82 | 11 | 122 | 1 | **1,445** |
| S1 card-01 | tasks.md | 652 | 73,830 | 52,401 | 59 | 1 | 7 | 1 | **1,926** |
| S1 小计 | — | **2,956** | **349,983** | **211,220** | 238 | 31 | 317 | 4 | — |
| S2 planning | decision-log.md | 1,002 | 118,162 | 64,432 | 71 | 16 | 171 | 2 | 732 |
| S2 planning | prd.md | 673 | 121,223 | 63,718 | 47 | 6 | 73 | 0 | **1,069** |
| S2 小计 | — | **1,675** | **239,385** | **128,150** | 118 | 22 | 244 | 2 | — |

补充指标（用于后面的问题定级）：

| 文档 | >800 字符的超长行 | 超长行行号 | 单节最大行数 | 该节占比 |
| --- | ---: | --- | ---: | ---: |
| S1 decision-log.md | 3 | L542, L554, L582 | 218（`#### OI records and consumers`） | 29.4% |
| S1 plan.md | 2 | L30, L41 | 142（`## Acceptance Criteria Cards`） | 17.7% |
| S1 tasks.md | 4 | L53, L231, L468, L580 | 39（单张任务卡） | — |
| S1 spec.md | 0 | — | 163（`## 11. 验收标准`） | 21.4% |

### 1.2 历史规模普查：这不是 card-01 个案

`specs/archive/` 下 **48 个**含 `decision-log.md` 的 task 目录，四材料合计行数分布：

| 分位 | 四材料合计行数 | 代表 task |
| --- | ---: | --- |
| 最小 / 中位 | 98 / **2,635** | `governance-runtime-execution-chain-20260827` = 2,608 |
| 上四分位 | 3,343 | — |
| >5,000 行的 task（5 个） | 5,129 | `workflowhub-cost-baseline-and-blocker-close-20260917` = 5,129 |
| 极端 | **17,933** | `workflowhub-mechanism-simplification-t3-20260912` |

极端案例解剖（最严重单点）：

- `specs/archive/workflowhub-mechanism-simplification-t3-20260912/plan.md` = **13,195 行 / 3,452,507 字节**
- 其中 `## hash 用法清单协议（AC-GOV-016 / FR-GOV-018 / R-019）`（L1372 起）单节 = **11,815 行 = 该文件 89.5%**
- 该节内部构成：11,805 个表格行，占 11,824 行；**分类计数 = 身份绑定 6,090、完整性校验 5,713、过程化产物 0**，也就是**每一行都是"登记保留"、零可执行动作**
- 同一节的自述明确写了这一点：「本任务删治理文字侧表述与过程化产物类；身份绑定与完整性校验类只登记不删」，实际删的只有 T19 的 5 个站点

→ 结论：**"把无界扫描清单 dump 进 plan"这一失效模式已经出现过一次，量级是 1 万行量级**，且当时的验收并未因此失败。这是模板级缺陷，不是某个 task 的写作失误。

---

## 2. 结构剖析

### 2.1 S1 card-01 / decision-log.md（741 行）

| 行范围 | 节 | 行数 | 占全文 |
| --- | --- | ---: | ---: |
| L3–19 | 任务身份（含"材料重建事实""基线对齐事实"） | 17 | 2.3% |
| L20–42 | 原始需求（R-001..R-015 表） | 23 | 3.1% |
| L43–48 | 需求框架 | 6 | 0.8% |
| L49–84 | 唯一 OI 大纲（Framework nodes / Fixed categories） | 36 | 4.9% |
| **L85–302** | **OI records and consumers（12 条 OI 的裸 JSON）** | **218** | **29.4%** |
| L303–332 | 目标 / 成功失败边界 / 范围 / 非目标 | 30 | 4.0% |
| L333–518 | 决定 D-001..D-010 | 186 | 25.1% |
| L519–559 | 三轮 talk / 调研 / grill | 41 | 5.5% |
| L560–601 | 审查处置（Step 6 + Step 10） | 42 | 5.7% |
| L602–614 | 最终确认 / 冻结包覆盖声明 | 13 | 1.8% |
| L615–667 | 拒绝方案 / 风险与延期交接 / 质量边界 | 53 | 7.2% |
| L668–719 | 未决项 / Supersedes / 文档结果 / Exit checks / 收敛检查 / 核心需求 | 52 | 7.0% |
| L720–741 | UI applicability（21 行 JSON） | 22 | 3.0% |

**篇幅集中点**：`OI records`（218 行）+ `决定`（186 行）+ `审查处置+talk/grill/调研`（83 行）= 487 行 = **65.7%**。

### 2.2 S1 card-01 / spec.md（760 行）

| 行范围 | 节 | 行数 | 占全文 |
| --- | --- | ---: | ---: |
| L10–33 | 材料导航 + 速读卡 | 24 | 3.2% |
| L34–49 | 来源与决策映射表 | 16 | 2.1% |
| L50–153 | §1–§3 问题/背景目标范围/9 个 SCN + 状态覆盖清单 | 104 | 13.7% |
| L154–190 | §4 产品事实与假设（PFACT-001..008） | 37 | 4.9% |
| L191–322 | §5 功能需求（23 条 FR，九节） | 132 | 17.4% |
| L323–395 | §6 模块划分 + §7 关键实体 + §8 数据和生命周期 | 73 | 9.6% |
| L396–468 | §9 兼容性预留（接口蓝图 / gate inventory / 排除名单 / 需求建议分界） | 73 | 9.6% |
| L469–493 | §10 明确不做 + 默认必须成立 | 25 | 3.3% |
| **L494–656** | **§11 验收标准（23 条 AC）** | **163** | **21.4%** |
| L657–734 | §12 风险、未决与交接 + 延期项 + 质量缺口 | 78 | 10.3% |
| L735–760 | §13 业务影响与回归范围 | 26 | 3.4% |

**篇幅集中点**：`§11 验收标准`(163) + `§5 功能需求`(132) + `§12 风险交接`(78) = 373 行 = **49.1%**。§11 单节 163 行里，实际可执行的测试程序是 0 行（见 P-07）。

### 2.3 S1 card-01 / plan.md（803 行）

| 行范围 | 节 | 行数 | 占全文 |
| --- | --- | ---: | ---: |
| L7–59 | 材料导航 + Quick Read + Technical Context + Code Anchors | 53 | 6.6% |
| L60–124 | Solution Design（含 4 个模块职责小节） | 65 | 8.1% |
| L125–161 | File Boundary（NEW 12 / MODIFY 6 / DO NOT TOUCH 16） | 37 | 4.6% |
| L162–295 | Canonical Inventory Freeze（6 个子表/契约） | 134 | 16.7% |
| L296–363 | Technical Decisions DEC-001..005 | 68 | 8.5% |
| L364–381 | Test Strategy | 18 | 2.2% |
| L382–442 | Rollback and Recovery + Deletion Proofs + Engineering Risk Handoff | 61 | 7.6% |
| L443–472 | Implementation Order + Dependencies + **Requirement and Verification Traceability（23 行表）** | 30 | 3.7% |
| **L473–614** | **Acceptance Criteria Cards（spec §11 的逐字转写）** | **142** | **17.7%** |
| L615–628 | Governance Synchronization Matrix | 14 | 1.7% |
| L629–654 | Constitution Check（S1–S8, Q1–Q3, F1–F11） | 26 | 3.2% |
| L655–803 | Phase P1–P4（4×38 行，高度对称） | 149 | 18.6% |

**篇幅集中点**：`Acceptance Criteria Cards`(142，纯转写) + `Phase P1–P4`(149，模板对称) + `Canonical Inventory Freeze`(134) = 425 行 = **52.9%**。其中 142 行是**逐字重复**（见 P-04），Phase 4 段 149 行里每段只有 Goal/Files/Tasks/Verify 是新增信息。

### 2.4 S1 card-01 / tasks.md（652 行）

| 行范围 | 节 | 行数 | 说明 |
| --- | --- | ---: | --- |
| L1–16 | 头 + 材料导航 | 16 | — |
| L17–154 | Phase P1（Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risks） | 138 | 含 T001、T002 两卡 |
| L155–292 | Phase P2 | 138 | T003、T004 |
| L293–430 | Phase P3 | 138 | T005、T006 |
| L431–651 | Phase P4（多 52 行，T007–T009） | 221 | — |
| L603–651 | Final aggregate / Dependency Graph / Final Boundary Check | 49 | — |

单张任务卡 = 37–39 行，字段数 ≈ 32 个 bullet；其中 **12 行固定为空白填写模板**（`##### 执行状态填写区（唯一完成权威）` + 8 条 `N/A — not started`）。9 张卡 × 12 = **108 行 = 全文 16.6%**；加上 YAML 式字段行，`N/A` 占位行共 **66 行 = 10.1%**，模板/空白/重复行合计 **195 行 = 29.9%**。

### 2.5 S2 rebuild-planning / decision-log.md（1,002 行）

| 行范围 | 节 | 行数 | 占全文 |
| --- | --- | ---: | ---: |
| L21–141 | 原始需求（U-001..U-010 用户原文全文 + 覆盖索引） | 121 | 12.1% |
| L142–155 | 范围 / 非目标 | 14 | 1.4% |
| L156–184 | 唯一 OI 大纲 | 29 | 2.9% |
| **L185–482** | **OI records（14 条 OI 的裸 JSON）** | **298** | **29.7%** |
| L483–513 | 背景资料与来源区分 + 执行准备与交互记录 | 31 | 3.1% |
| L514–705 | 当前方向审查事实 + 决定草案（含 D-001 与 10 个方向小节） | 192 | 19.2% |
| L706–800 | 细节审查 / 方向审查重跑 / detail 重跑 / Talk round 4（"续接会话"追加区） | 95 | 9.5% |
| L801–889 | Talk round 4 + make-decision 自身改造诊断 | 89 | 8.9% |
| **L890–938** | **CPU 与温度问题：实测诊断** | **49** | **4.9%** |
| L939–1002 | UI applicability / 收敛检查 / 大白话结束卡 / 成功失败边界 / 风险 / Talk round 5 | 64 | 6.4% |

**篇幅集中点**：`OI records`(298) + `方向审查/lab 记录区`(192+95+89=376) = 674 行 = **67.3%**。文件是**时间顺序追加体**：L706、L744、L771、L801、L862、L890、L993 的节标题都带「（2026-09-19 续接会话）」，当前权威散落在中段，"最新状态"实际在 L993 的 Talk round 5 和 L985 的风险节。

### 2.6 S2 rebuild-planning / prd.md（673 行）

| 行范围 | 节 | 行数 | 占全文 |
| --- | --- | ---: | ---: |
| L1–7 | 标题 + revision 绑定头 | 7 | 1.0% |
| L8–19 | 导航 + 产品总览（**单 bullet 1,069 字符**） | 12 | 1.8% |
| L20–69 | 共享定义 SD-01..SD-17（17 条，每条恰好 4 行） | 50 | 7.4% |
| L70–130 | 任务地图（卡片清单 / 依赖分组 / **需求覆盖结论 57 行**） | 59 | 8.8% |
| L131–172 | 最终展示稿确认（首次确认 17 行 + 加固版确认 20 行，**含 12 个 64 位哈希**） | 42 | 6.2% |
| L173–458 | 任务卡 CARD-01..CARD-10 | 286 | 42.5% |
| L459–515 | 总体集成验收套件 | 57 | 8.5% |
| L516–585 | 风险与交付说明（缺口/质量事实/审查事实/交付说明） | 70 | 10.4% |
| L586–607 | 变更说明 | 22 | 3.3% |

**篇幅集中点**：任务卡 286 行 = 42.5%（这是最有用的部分），但每张卡的「来源/设计」字段都重复同一串 revision（见 P-11）。

### 2.7 骨架稳定性：模板是固定的

对照 S3 的 `governance-runtime-execution-chain-20260827/plan.md` 与 S1 card-01 `plan.md`，章节序列**完全一致**：

```
Quick Read → Technical Context → Code Anchors → Solution Design → UI Delivery Contract
→ File Boundary → (Canonical Inventory Freeze) → Technical Decisions → Test Strategy
→ Rollback and Recovery → Implementation Order → Dependencies and Parallelism
→ Requirement and Verification Traceability → (Acceptance Criteria Cards)
→ Governance Synchronization Matrix → Constitution Check → Phase P1..P4
```

→ 结论：**问题主要是模板设计问题**，改模板可以一次性影响所有后续 task；反之任何单文件修补都会被下一个 task 复制。

---

## 3. 问题清单（逐条附证据）

### P-01｜规模失控，且四材料总量无上限约束（严重）

**证据**
- S1 四材料合计 **2,956 行 / 349,983 字节**；S2 两份合计 **1,675 行 / 239,385 字节**。
- S3 普查：`specs/archive/` 下 48 个含 decision-log 的 task，四材料合计中位 **2,635 行**、上四分位 3,343 行、5 个 task 超 5,000 行，极端 **17,933 行**。
- `workflowhub-mechanism-simplification-t3-20260912/plan.md` 单文件 **13,195 行 / 3.45 MB**，其中 11,815 行（89.5%）是一节不需要动作的清单（见 §1.2）。

**判读**：没有任何机制在任何一次 build-plan / verify-code 里对"本 task 材料行数"提出异议；规模膨胀从未产生失败事实。

### P-02｜过程记录、审计流水与被审计内容同文件同层级（严重）

**证据**
- `decision-log.md` L542 单行 **2,703 字符**，是一整篇仓库现状调研报告塞进一个表格单元格：

  > `| RS-001 仓库现状盘点 | 现有骨架的入口、规划旅程可达性、固定轮次与顺序锁的强制点、通用认证的阻断点、两道人为门的实现位置 | ①任务创建唯一官方入口=...②规划旅程定义存在...⑤会真正阻断推进的机器校验共 24 项，集中在四类：... | 已消费并回填 | D-001, D-002, D-003, D-006 |`

- `decision-log.md` L560–601「审查处置」42 行含 `pair_id=38d9f3f1-d432-4076-b9d6-e30118dd7b37`、`red attempt=quality/reviews/attempts/58e842e4-.../attempt.json`、12 条 finding 的逐条处置表——这些在同一 task 的 `quality/reviews/**` 原件里已完整存在。
- `rebuild-planning/decision-log.md` L744–770 一条审查结果就是 7 行连续的 `SHA256=<64位hex>`。
- 全文件哈希密度：S1 `decision-log.md` 有 43 行引用 `L<数字>` 行号、`plan.md` 有 21 处 sha/哈希字样；S2 `prd.md` 有 **55 处 40+ 位十六进制串**，其中同一 Decision revision `9ede5110…` 重复出现 **6 次**，`469aef50…` **6 次**，`e6af6bae…` **4 次**。

**判读**：审计事实本身必须保留（宪法要求 provenance 不可覆盖），问题在于**它被写在 build-code 必读的同一份材料同一层级里**，与"（M 主会话常驻）"的读取承诺冲突。

### P-03｜重要内容被压缩成一句，或塞进单行（严重）

**证据**
1. **关键行号引用本身就是错的**（P-10 详述）。
2. `plan.md` L30 单行 **1,445 字符**，把 `Before / Unresolved facts` 三个未决点全压成一行；L41 单行 **1,016 字符**。
3. `tasks.md` L580 单行 **1,926 字符**，把 T009 的 8 个 `acceptance_data` 场景压成一行 JSON。
4. `tasks.md` L468/L517 的 `oracle` 字段各 **886 / 800+ 字符**，是一整行内嵌 JSON，其中 `pass`/`reject.input`/`reject.expected_rejection`/`reject.observation` 四段关键验收内容挤在同一行。
5. 真正的关键约束反而只有一行：`spec.md` L215「FR-TOPO-002：activation 后新建普通任务的工作流定义必须逐字表达 `make-decision→build-plan→build-code→verify-code`」——**"逐字表达"具体是哪个文件、哪个变量、什么格式，spec 未写**；`spec.md` L223 的 cohort→拓扑映射同理，只有一句「cohort 的 schema/字段形态留 build-plan」。

**判读**：**长短与重要性反相关**——过程记录（L542）2703 字符，接口契约（L215）约 80 字符。

### P-04｜spec §11 被逐字转写进 plan.md，98.9% 重复（严重）

**证据**
- `plan.md` L473–614 `## Acceptance Criteria Cards` 开头自述：

  > 「本节按 spec.md《11. 验收标准》原样转写 23 条 AC 卡（标题与 验证/通过/失败/证据 四段逐字一致），供 build-code/verify-code 直接消费；不改写 spec 的验收语义。」

- 程序化比对：23 条 AC × 4 个字段 = 92 个可比字段中，**91 个逐字相同 = 98.9%**；唯一差异是 AC-MIG-001 的 `需求：FR-MIG-001` 行未被转写。
- 体量：`spec.md` L494–656 = 163 行 / 18,217 字节；`plan.md` L473–614 = 142 行 / 17,920 字节。**同一内容在材料里存了两份**。
- 转写时**丢掉了 `需求：FR-xxx` 行**，即 AC→FR 的追溯在 plan 副本里比 spec 更弱——这是"复制即漂移"的即时例证。

### P-05｜OI 记录以裸 JSON 存储，字段级重复近 30%（中等）

**证据**
- `decision-log.md` L85–302 是 12 条 OI 的裸 JSON，`"task_id"`、`"outline_version"`、`"oi_id"` 各出现 **12 次**；每条 OI 都重复完全相同的 `"task_id": "workflowhub-thin-core-card-01-20260919"` 与 `"outline_version": "outline-v2"` → **24 行纯冗余**。
- `rebuild-planning/decision-log.md` L185–482 更严重：14 条 OI，`"task_id"`/`"outline_version"`/`"oi_id"`/`"impact_dimensions"`/`"requires_user_decision"`/`"visible_group_id"` 各 14 次 → **约 28 行纯冗余**。
- 同一批 OI 的内容在 `decision-log.md` 里已经以「原始需求」表（L25–41）+「Framework nodes」表（L65–72）+「Fixed categories」表（L76–83）+ 目标/范围/非目标节表达过。

**判读**：OI JSON 是"机器结构"，人读时信息密度低；且它重复了四层索引（R 表 → node 表 → category 表 → OI JSON）。

### P-06｜决策块样板行逐块重复（中等）

**证据**（`decision-log.md`）

| 样板行 | 重复次数 |
| --- | ---: |
| `- approval_binding：待 step 11 approve-decision 的最终确认绑定` | 8 |
| `- artifacts：见「文档结果」节` | 8 |
| `- Supersedes：无` | 8 |
| `- unresolved_items/owner：无` | 6 |
| `- module：` / `- requirement_ids：` / `- derived_from：` | 各 10 |

- 其中 `requirement_ids` 与 `derived_from` 在 D-001..D-008 中**逐字相同**（如两者都是 `R-001, R-002, R-003, R-010`），只有 D-009/D-010 不同 → 8 个块 × 1 行 = 8 行纯重复。
- **且该样板行已过期**：8 个块都写「待 step 11 approve-decision 的最终确认绑定」，但 L602「最终确认」已写「状态：accepted」，L608「冻结包覆盖声明」还专门声明「本文件只声明冻结包覆盖范围，不复制可能漂移的审批绑定」。**同一文件里两种互斥说法并存。**
- D-001..D-009 每个块**恰好 19 行**——固定模板所致，不是内容需要。

### P-07｜23 条 AC 里 0 条含可执行 oracle（严重）

**证据**
- `spec.md` §11 的每一条 AC 结构都是 `验证：<自然语言指令>` / `通过：<不变量>` / `失败：<反例>` / `证据：<产物名>`，**没有任何一条给出命令、测试文件、退出码或断言名**。
- 正则统计（S1 spec + S3 四个历史 spec，共 **101 条 AC**）：`验证` 字段中含 `vitest` / `npm` / `node` / `gate_cmd` / 反引号内 `.mjs` 可执行文件的条数 = **0**。
- 唯一可执行的绑定在别处：`plan.md` L364–380 §Test Strategy（**17 行 / 9 行表 / 5 个不同 gate_cmd 覆盖 23 条 AC**）、`tasks.md` 每卡的 `gate_cmd` 字段。
- spec 自己在 L10 导航里把 §11 标为 **「P（build-code/verify-code）」**，即 spec 是被指定给实现/验收阶段读的材料，而它不含可执行验收程序。
- `spec.md` L724 DEFER-003 把「验收 fixture、采样方式、环境假设和精确命令」明确延期到 build-plan——**即"验收怎么跑"在设计上就被推迟出 spec**。

**判读**：这正是 owner 说的"缺少合理的验收标准和测试流程"。AC 写的是"要证明什么"，缺的是"用什么跑出来证明"，且该缺口被 DEFER 制度化。

### P-08｜AC 字段 schema 跨任务漂移，出现 6 字符的占位"验证"（严重）

**证据**（S3 历史样本）

| task | AC 字段名形态 | 条数 | 验证字段长度 中位 / 最小 |
| --- | --- | ---: | --- |
| S1 card-01 | `需求：`+`验证：`+`通过：`+`失败：`+`证据：` | 23 | 63 / 28 |
| `executable-ui-fullstack-design-contract-20260826` | `- **需求**：`+`验证：`+`- **通过条件**：`+`失败：`+`- **证据类型**：` | 23 | **11 / 6** |
| `governance-runtime-execution-chain-20260827` | `需求：`+`场景：`+`验证：`+`通过：`+`失败：`+`证据类型：` | 23 条标题但仅 17 条有 `验证：`、12 条有 `通过：` | 42 / 19 |
| `workflowhub-cost-baseline-and-blocker-close-20260917` | 六字段同名但排版不同 | 38 | 56 / 12 |
| `m15-retirement` | **无 `验证` 字段**，改用 `方法`，且六字段压成一行 `- **FR**｜**方法**｜**通过条件**｜**失败条件**｜**证据类型**｜**影响状态**` | 8 | — |

- 最极端的原文（`executable-ui.../spec.md` §11）：

  > `- [ ] **AC-001**：UI 项目能识别唯一 Design 与唯一 Experience，且二者职责不重叠。`
  > `  - **需求**：FR-DOC-001、FR-DOC-002`
  > `  验证：合同与模板验证`
  > `  - **通过条件**：...`

  `验证：合同与模板验证` = **7 个字符**，等于没写测试方法。

- 同一 task 内 `governance-runtime...` 还有 23 条 AC 标题 vs 17 条 `验证：` 的内部缺口。

**判读**：AC 是四材料里唯一"契约性最强"的部分，但它连字段名都不稳定；`验证` 字段退化成占位词时，下游只能自行发明测试。

### P-09｜测试流程只有一句 gate_cmd，缺环境/fixture/清理/失败处置（严重）

**证据**
- `plan.md` §Test Strategy（**L364–380，17 行**）共 9 行表数据，5 个不同命令。全文对流程的说明只有一句：

  > 「设计 RED/GREEN，不在 build-plan 执行命令。两者使用同一 `gate_cmd` 与 oracle identity；`gate_cmd` 只是测试命令，不是工作许可证。所有 targeted 命令固定 singleFork/no-fileParallelism；只跑受影响测试，不做全量回归。」

- **缺失项**：无环境准备（Node 版本、依赖安装、所需 env）、无 worktree/temp 目录创建步骤、无 fixture 数据来源说明（唯一提及是 `tasks.md` L63「内存 Markdown fixture（六类 decision-log 任务身份段）；无网络/provider/browser；测试自清 temp」）、无失败后如何定位/回滚的具体步骤、无测试数据清理验证。
- 对"真实入口夹具"这个最关键的测试手法，只有一句否定式约束：`tasks.md` L508「夹具走真实 `stage-runtime.mjs`/`task-bootstrap.mjs`，夹具直调不冒充真实入口」——**没有说夹具长什么样、放在哪、谁造**。
- `tasks.md` 每卡的 `fixtures_services` 都是两三个短语（如「临时 Git/worktree + task 追踪目录 + activation 标记 fixture」），无一处可直接照做。

### P-10｜行号锚点已腐化：plan 指向 spec 的错误行（严重）

**证据**（`plan.md` 引用 `spec.md:<行号>` 共 20 处，逐行复核）

| plan.md 行 | 引用 | spec.md 该行实际内容 | 判定 |
| --- | --- | --- | --- |
| L172 | `spec.md:267` | `  - **场景**：SCN-004` | **错**（A 类人为门定义实际在 L269 FR-GATE-002） |
| L180 | `spec.md:267` | 同上 | **错** |
| L191 | `spec.md:267` | 同上 | **错** |
| L225 | `spec.md:263` | `  - **验收**：AC-FLOW-003` | **错**（outline_closed 范围边界实际在 L270） |
| L294 | `spec.md:230` | （空行） | **错**（"不改变六项内容与内部质量要求"实际在 L232） |
| L229/L239 | `spec.md:295` | `  - **场景**：SCN-001..009` | 可疑（七值状态转换实际在 L286–290） |
| L189 | `spec.md:436` | 「失败后的原阶段重入…」 | 勉强对（但引用处谈的是十类机器事实） |

- **4 处确定指错、2 处可疑**。而同一文件的 `versioned_refs` 还 pin 了 spec 的 sha256（见 P-11），声称"已绑定当前修订"。
- 后果：实现者按 `plan.md` L172「A 类 = 当前阶段或 portable workflow 既有合同明确要求的推进确认对话（`spec.md:267`）」去 spec 找定义，**落到 SCN-004 的场景行，找不到 A/B 人为门的定义**。

### P-11｜版本哈希 pin 与内容哈希不一致，且无人失败（严重）

**证据**（`shasum -a 256` 实测）

| pin 位置 | 声称哈希 | 实际哈希 | 结果 |
| --- | --- | --- | --- |
| `tasks.md` L3 / `plan.md` L3 `decision-log.md@cf6c62ac…` | `cf6c62ac0774421733d7872357d0b27390f1fd072bdf15af4b02db2a979a039b` | **`aae2d5aaa9024945da6ec0fc32ae4180251d6784ef28100c5a37ad320f808d1f`** | **不匹配** |
| `tasks.md`/`plan.md` `spec.md@9c0a5c0b…` | `9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6` | 同 | 匹配 |
| `tasks.md`/`plan.md` `plan.md@34e2de57…` | `34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad` | 同 | 匹配 |

- 即 **plan.md / tasks.md 每张卡都 pin 了 decision-log 的错哈希**（T001..T009 共 9 张卡重复同一错值），而 spec/plan 自身哈希是对的 → decision-log 在 plan/tasks 生成后又被改过，两个下游文件都没刷新。
- 该失配在文件里**没有任何登记**：既没有"decision-log 已变更、锚点待刷新"的事实行，也没有对应的 `missing/incomplete` 标记——与仓库"缺质量事实不能声称完成"的规则相冲突。

### P-12｜隐含假设未写明，读者必须猜（严重）

**证据**

1. **"六类契约" vs 表里 10 行接口**：`spec.md` L629–631 AC-IFACE-001 要求蓝图「逐项核对 FR-IFACE-001 枚举的**六类**契约（受控值、类型→拓扑、正式/portable 身份、七值状态、材料/事实归属、推进/完成分离）」，而 `spec.md` L412–425 的「产品边界接口蓝图」表列了 **10 行接口**（多出 portable workflow 执行、人工边界、审查重派、正式入口）。实现者要自己决定"哪 6 行算契约、另外 4 行算不算"。`plan.md` L289 又写「蓝图须有六类契约行…**另加「人工边界与审查重派」附加接口行**」→ 变成 6+1，与 spec 的 10 行仍不对齐。
2. **"14 步顺序锁定"没有定义**：`decision-log.md` L30、L623 反复使用「14 步顺序锁定」，但**全仓 spec/plan/tasks 里没有"14"这个数字**，`decision-log.md` L542 的 RS-001 也只说「"14 步顺序锁"=清单自校验（`step-manifest.mjs:46 validateStepManifest`）+ legacy outcome 认证」，未验证 14 从何而来。spec 改用 `FR-GATE-001` 的「step completeness/顺序」表述，**没有给出 14↔该表述的映射**。
3. **"八处" vs "18+" 两套计数**：`decision-log.md` L434/L594 与 `spec.md` L442/L445 都说 build-prd 排除名单是 **8 处**；`plan.md` 却另立 **"18+ 处五阶段硬编码面"**（L21、L144、L150、L300）。两套计数覆盖的文件有交叠（`stage-handlers.mjs`、`task-kernel-implementation.mjs` 同时出现在两边），**文件里没有任何一行说明二者关系**。
4. **24 vs 18 谓词**：`spec.md` L264/L582 与 `plan.md` 多处写「RS-001 的 24 项现状阻断谓词」，`plan.md` L217/L221 与 `tasks.md` L445 改为 **18 个谓词站点 / 5 族**。`plan.md` L221 诚实登记了差异（"不裁决、不伪造"），**但 spec 与 tasks.md L11/L440 仍写 24**，同一材料集内两个数并存，读者必须自己读 `plan.md` L219–221 才知道哪个生效。

### P-13｜术语与编号不一致（中等）

**证据**

1. **FR/AC 跳号**：`prd.md` CARD-01 的 FR 序列是 `FR-01..FR-05` 然后跳到 **`FR-55`**，AC 序列是 `AC-01..AC-05` 然后跳到 **`AC-56`**（`prd.md` CARD-01 卡的 FR/AC 列表）。`decision-log.md` L32 也照抄「prd.md L244 FR-55；L251 AC-56」。FR-06..FR-54 / AC-06..AC-55 从未出现 → 读者无法判断是否有 49 条被删掉的 FR。
2. **"五阶段"一词至少 4 个能指**：`五阶段`（dec 10 / spec 19 / plan 36 / tasks 17 次）、`正式阶段集合`（dec 3 / spec 5）、`WORKFLOW_STAGES`（plan 5 / tasks 4）、`CANONICAL_STAGE_SLUGS`（dec 2 / plan 2）。四者是否同一集合，文件从未说明。
3. **spec 内部矛盾**：`spec.md` L354「任务拓扑…**字段和约束**：规划两项、**普通四项**，顺序固定」，但同一文件的 L92、L215、L223 明确 **pre-activation 普通任务走五阶段**（含 build-spec），L406 还确认「本 task 作为 pre-activation 普通任务按启动时五阶段…跑完」。→ §7 关键实体给出的拓扑定义与 §5 功能需求冲突。
4. **AC 编号语义漂移**：`decision-log.md` L102 引用「AC-01 与 AC-02」，`spec.md` 里对应的是 `AC-TOPO-001/002`；`decision-log.md` L32 引用「AC-56」，spec 里是 `AC-GATE-001`。跨文件引用时编号体系未统一。

### P-14｜"实现者到底要做什么"的入口被导航表埋掉（中等）

**证据**
- 三份材料各有一张「材料导航」表，且记号未定义：
  - `spec.md` L10–19：`M/S/B/P 读取时机`——**M/S/B/P 四个字母全文只在导航表出现，无定义**。
  - `plan.md` L7–15 与 `tasks.md` L8–16 同样是 `M/S/B/P`。
- 导航表本身占 13 + 9 + 10 = 32 行，且与文档自身标题层级重复（`spec.md#11-验收标准`、`spec.md#canonical-gate-inventory` 等锚点是可自动生成的）。
- `plan.md` 的 `## Phase P1 — …` 段落里同时有 Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risks 八个小节，**Tasks 小节只有 5 行**，真正的任务定义在 `tasks.md`；即"同一批 Phase 骨架在 plan.md 与 tasks.md 各写一遍"（plan P1–P4 149 行 vs tasks Phase 146+146+146+221 行）。
- 实现者要开工，需自行完成：读 tasks.md 材料导航 → 跳到 T001 → 回头读 plan.md §File Boundary + §Test Strategy + §Canonical Inventory Freeze（134 行）→ 再读 spec.md §5/§11（295 行）。**没有一处写"按这个顺序做这 5 件事"**。

### P-15｜表格单元格承载整篇报告（中等，属 P-02 的形态）

**证据**：`decision-log.md` L542 单元格 2,703 字符（属 4 列表格的第 3 列）；`decision-log.md` L706–743 的「本次结果」用 7 行 bullet 承载 pair_id + 4 个 SHA256 路径 + 1 个 finding 计数；`prd.md` L12「产品总览」单 bullet 1,069 字符承载首轮+次轮 decision revision/decision chain。

**判读**：Markdown 表格列宽在编辑器和 diff 里都难以阅读；把 2,703 字符放进去等于不可读。

### P-16｜空白模板占近三成（中等）

**证据**：`tasks.md` 652 行中，模板/空白/`N/A` 行合计 **195 行 = 29.9%**；`N/A` 占位行 66 行 = 10.1%；9 张卡各有一模一样的 12 行「执行状态填写区（唯一完成权威）」，内容为 `- **status**：`pending`` + 8 条 `N/A — not started` + `- [ ] **任务完成**`。

**判读**：这是"为未来填写预留"的结构，代价是当前读者要跳过 108 行噪声；而真正的完成权威在 task 追踪目录（`facts.jsonl` / `quality/**`），此处是二次权威的空白副本。

### P-17｜无界清单可直接进入 plan.md（严重，历史已发生）

**证据**：见 §1.2。`workflowhub-mechanism-simplification-t3-20260912/plan.md` L1372 起的 `## hash 用法清单协议` 一节 11,815 行，其中 **11,803 行是"登记保留"、0 行是"过程化产物"，即 0 行需要动作**；实际动作只有同节 bullet 里的 5 个删除站点。

**判读**：该材料完整通过了 build-plan / build-code / verify-code 的流程——说明**流程对"材料里塞入无动作清单"没有任何检测**。

---

## 4. 信噪比分析

### 4.1 分桶口径（可复算）

按行归属到**最内层章节**（每个标题行只归一个桶），逐行分类：

| 桶 | 定义 |
| --- | --- |
| `build` | 可直接指导 build-code：需求、决策方向、边界、接口、文件清单、命令、oracle、AC |
| `mix` | 半实现半过程：OI 记录、PFACT、兼容性预留、Phase 概览、风险交接、rollback、Governance 矩阵 |
| `proc` | 过程/证据/审计：talk、grill、调研、审查处置、最终确认、Supersedes、文档结果、质量边界、UI applicability、Constitution Check、UI Delivery Contract |
| `tmpl` | 纯模板/逐字转写副本/空白填写区：Exit checks、材料导航、Traceability 表、Acceptance Criteria Cards、Verify、Dependency Graph、Final Boundary Check、执行状态填写区 |

### 4.2 结果

| 文档 | 总行 | build | 占比 | mix | proc | tmpl |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| S1 decision-log.md | 741 | 170 | **22.9%** | 381 | 182 | 8 |
| S1 spec.md | 760 | 543 | **71.4%** | 188 | 0 | 29 |
| S1 plan.md | 803 | 366 | **45.6%** | 214 | 41 | 182 |
| S1 tasks.md | 652 | 422 | **64.7%** | 59 | 0 | 171 |
| S1 合计 | 2,956 | 1,501 | **50.8%** | 842 | 223 | 390 |

### 4.3 判读（比数字更重要）

1. **`build` 占比高 ≠ 对实现者有用**。`spec.md` 的 71.4% 主要来自 §11 验收标准（163 行）——而 P-07 已证其中 **0 条含可执行 oracle**；这 163 行告诉实现者"要证明什么"，不告诉"怎么跑"。若把"可执行性"作为 `build` 的真门槛，`spec.md` 的有效 build 占比降到约 **30%**（§5 FR 132 行 + §7 实体 + §10 明确不做）。
2. **`decision-log.md` 只有 22.9% 是实现相关**，其余 77.1% 是 OI 结构、过程记录与审计（含 182 行 `proc`）。它是被 spec/plan/tasks 三份文件重复引用的"上游权威"，实现者按导航表"常驻"读它，实际 3/4 的行不产生实现动作。
3. **`tmpl` 390 行**里最大两块是 `plan.md` 的 AC 转写（142 行，98.9% 与 spec 重复）和 `tasks.md` 的空白填写区（171 行）。这是**纯可删除/可外置**的体量，占 S1 总量 **13.2%**。
4. **过程/审计内容（`proc` 223 行 + decision-log 的过程部分）按仓库规则必须保留**，所以出路不是"删掉"，而是"外置到 `quality/**` 原件 + 材料里只留一行引用"。
5. **信噪比在历史样本上更差**：S3 极端案例 `plan.md` 有 89.5% 的行是零动作清单（P-17），`governance-runtime-execution-chain-20260827/spec.md` 735 行中 `§11 验收标准` 134 行 + `§12 风险未决交接` 78 行 = 28.8% 且同样无命令。

---

## 5. 优秀片段（应保留的写法）

| # | 位置 | 好在哪里 |
| --- | --- | --- |
| G-01 | `plan.md` L243–258「八处排除名单逐处冻结」表 | 冻结字段统一四项（是否阻断/consumer/最小变更含可复核理由/验证映射），**每行都给出"最小变更"与理由**，且第 1–8 行明确哪些是"零改动"并说明为什么不需要改。这是全材料信息密度最高的段落之一，且可直接逐行施工。 |
| G-02 | `plan.md` L227–241「七值状态冻结」表 | 七个值逐行给语义 + 独立一段写"转换/重入"，并显式写反例约束（「机器或质量事实缺失**不得**包装为 blocked」）。既可实现也可验收。 |
| G-03 | `plan.md` L260–270「activation 三事实契约」 | 给了三事实（能力验收/发布标识/入口消费证据）+ JSON 形状 + **fail-safe 判定规则**（「任一项缺失、空标记、JSON 非法或引用不可解析 ⇒ `pre`」）+ 与 AC 失败判据的显式对应。这是"规格可执行"的正面样本。 |
| G-04 | `plan.md` L443–472「Requirement and Verification Traceability」表（表体 L445–469） | 23 行把 `D/R → FR → AC → Phase/Task → Depends on → Exact files → Command/oracle` 串起来，是全套材料里唯一一张"从需求直达文件与命令"的映射表。 |
| G-05 | `plan.md` L364–380「Test Strategy」表 | 明确 RED/GREEN 与同一 `gate_cmd`/oracle identity、`expected_exit`、`evidence_path`，并写「`gate_cmd` 只是测试命令，不是工作许可证」「只跑受影响测试，不做全量回归」。方法正确，只是缺环境与步骤（见 P-09）。 |
| G-06 | `spec.md` L412–425「产品边界接口蓝图」表 | 每行给 `接口 / 输入 / 可观察输出 / 失败缺失语义 / Consumer` 五列，下游卡可直接消费；失败语义列写得具体（如「无法识别触发澄清，只暂停类型相关分支」）。 |
| G-07 | `spec.md` L23–32「速读卡（30 秒）」 | 一句话需求 + 3 条核心改动点 + 最大影响面 + 验收信号 + 紧迫性，五行给出全貌。**这是"短而不漏"的正面样本，值得推广成每份材料的固定首节。** |
| G-08 | `tasks.md` 每卡的 `goal / 精确文件 / boundary / gate_cmd / expected_exit / oracle / STOP / recovery / coverage limits` | 单卡字段设计本身很完整：给了精确文件、给了停止条件（「实现要求入口新增类型参数…时，停止回 spec/plan」）、给了覆盖率边界（「不证明真实入口接线（T002/T008 覆盖）」）。问题只在**字段太多太长**（P-03），不在字段本身。 |
| G-09 | `plan.md` L146–161「File Boundary」的 `DO NOT TOUCH` 区域级表述 | 区分"文件级"与"区域级"不改动（「仅允许改动 24 项谓词在推进路径上的调用位；这四个文件内的五阶段名单常量…是 DO NOT TOUCH 区域」），把"改哪里/不改哪里"讲到可断言（「P4 的 RED/GREEN 必须断言名单常量逐字未变」）。 |
| G-10 | `plan.md` L219–221 的 24↔18 差异登记 | 面对计数不一致，做法是**显式登记差异并禁止凑数**（「不得为凑 24 而虚构谓词」「原文未定义计数规则（数 `if`、数 `throw` 或数复合子句）」）。这是"不漂白"的正面样本——问题只在于这个登记没有回灌到 spec 与 tasks（P-12.4）。 |
| G-11 | `prd.md` CARD-01 卡 | 单卡结构：`结果与 consumer / 范围 / 流程状态 / FR / AC / oracle / 准备依赖 / 实现依赖 / 验收依赖 / 合并依赖 / 共享资源冲突与集成责任 / 来源设计 / 局部风险 / 可后置技术项 / 最小读取集 / 五阶段开工说明`。其中 **AC 用了"条件=…；行为=…；度量=…；失败场景=…"四段式**，比 spec 的 `验证/通过/失败/证据` 更接近可测形式（有"度量"）。 |
| G-12 | `decision-log.md` L615–635「拒绝方案」表 | 每条拒绝都带理由与关联 D 编号（如「阶段拓扑只写在文档/技能说明里 → 无法验收"阶段列表逐字等于预期"，AC-01/02 基本失效 → D-001」）。可直接反向校验设计。 |
| G-13 | `spec.md` AC 的 `失败：` 字段普遍存在 | 23/23 条 AC 都有明确反例（如「失败：任一机器/流程校验（两道人为门之外）阻断推进，或缺失事实被漂白不记」）。**"可证伪"这条做到了**——这在同类文档里不常见。 |

---

## 6. 改进方向假设（候选，不做决定）

> 每条只列候选改法，标注它主要解决哪个问题、代价是什么。**未做取舍。**

### 6.1 针对规模与篇幅（P-01/P-02/P-17）

- **C1-A｜给四材料设行数/字符软上限**（如单文件 ≤600 行、单行 ≤400 字符），超限时由 verify-code 记一条 `over_budget` 事实（记事实、不阻断——与现有"质量事实≠许可证"一致）。
  代价：需要定义"什么算一个行"，且历史 task 会立刻全部超限（可只对新 task 生效）。
- **C1-B｜把无界清单/扫描结果强制外置**：材料里只留"口径 + 结果摘要 + 唯一路径引用"，清单本体放 `quality/evidence/`。
  代价：读者需跳转一次；好处是 `plan.md` 不会再出现 11,815 行清单，也顺带解决 P-15。
- **C1-C｜给每节设"预算"**：模板里直接写明每个章节的推荐行数区间（如 `Canonical Inventory Freeze ≤ 80 行`），超出的内容必须外置。

### 6.2 针对过程/审计内容的位置（P-02/P-15）

- **C2-A｜process 内容物理外置**：talk/grill/调研/审查处置/最终确认/收敛检查移入 `quality/**` 原件（这些事实**本来就有** store 副本），`decision-log.md` 只保留"本轮结论 + 一行引用 + hash"。保留 provenance 的规则不变（引用而非摘要覆盖来源）。
  代价：decision-log 不再是"自足"的单文件；需要一个新的"结论索引"节。
- **C2-B｜只清理"形态"不清内容**：把长单元格（L542 的 2,703 字符）改成"摘要 + 引用"，把 SHA256 列表折叠进代码块，把 revision 串只在文件头出现一次。
  代价：改动小、风险低，但不解决 89.5% 清单那类问题。
- **C2-C｜把 U-001..U-010「用户原文全文」外置**：原文放 `quality/` 或 task 追踪目录，材料里只留"用户原话要点 + 引用路径"。
  代价：与"逐字双层保真"（SD-09）的当前实践有张力，需要确认保真要求是否接受"引用式保真"。

### 6.3 针对重复转写（P-04/P-05/P-06/P-16）

- **C3-A｜单一权威 + 生成**：AC 只在 `spec.md` 定义，`plan.md` 不再转写，改为一句引用（或由脚本生成副本并标注 `generated, do not edit`）。
  代价：build-code 需在两文件间跳转；好处是消除 98.9% 重复与"转写时丢掉 `需求：` 行"这类漂移。
- **C3-B｜样板字段改为表头**：`decision-log.md` 的 D-00x 块把 19 行 bullet 改成一张 N 列表格（`decision | source | rejected_alternatives | requirement_ids | …`），公共字段（`approval_binding`、`artifacts`、`Supersedes`）提升为节级一次声明。
  代价：表格单元格会变宽（与 P-15 反向），需要配合 C1-A 的字符上限。
- **C3-C｜OI 记录去冗余**：把 `task_id`/`outline_version` 提到 JSON 顶层一次，OI 数组内不再重复；或改为表格化 OI。
  代价：需同步 reader（存在 `readTaskTypeFromDecisionLog` 类解析器的兼容风险，需先确认读法）。
- **C3-D｜`tasks.md` 空白填写区外置**：完成权威已在 task 追踪目录，材料里改为一行引用。
  代价：需要确认没有消费者依赖材料内联的完成区（可先 grep consumer）。

### 6.4 针对验收标准与测试流程（P-07/P-08/P-09）

- **C4-A｜AC 必须带可执行字段**：AC 模板增加必填 `gate_cmd` / `oracle_id` / `evidence_path`（`plan.md` Test Strategy 已有这三样，只是没进 AC）。缺该字段即记 `incomplete` 验收事实。
  代价：spec 阶段可能还不知道命令（DEFER-003 就是为此延期），需要决定"谁补齐、在哪一步补齐"。
- **C4-B｜AC 字段名固定为 5 项并写进模板校验**：`需求 / 验证 / 通过 / 失败 / 证据` 逐字固定，且 `验证` 字段设"非占位"下限（如必须含可执行命令或明确的测试文件）。
  代价：历史 5 种形态需统一；`m15-retirement` 那类单行六字段需要重排。
- **C4-C｜把"测试流程"做成独立必填节**：新增 `## Test Procedure`（环境准备 / fixture 来源 / 命令 / 期望退出码 / 失败处置 / 清理验证），并把 `Test Strategy` 的 5 行扩到每 AC 一行。
  代价：材料变长（与 C1-A 冲突），需要用"每 AC 一行、总表引用"来控体量。
- **C4-D｜引入"占位检测"**：对 `验证` 字段做最小长度/关键词检查，出现「合同与模板验证」这类 6–11 字符占位时拒绝通过 build-plan。
  代价：可能误伤合理的短描述，需要白名单。

### 6.5 针对锚点与哈希一致性（P-10/P-11）

- **C5-A｜禁止行号锚点，改标题锚点**：`spec.md#11-验收标准` / `#fr-gate-002` 这类锚点不受行号漂移影响（文档站/编辑器普遍支持）。
  代价：需统一 slug 规则（现已有 `spec.md#canonical-gate-inventory` 的用法，可复用）。
- **C5-B｜锚点+哈希做成可校验项**：把 `versioned_refs` 的哈希校验接成一个 targeted 检查（脚本读材料、算 sha256、比对），失配即记 `stale` 事实。
  代价：需要新增一个检查（注意仓库"不新增控制面"的约束——可挂在既有 verify 路径上而不是新增 gate）。
- **C5-C｜哈希与 revision 去重**：同一 revision 只在文件头声明一次，其余位置引用别名（如 `R-dec`）；`首次确认`/`加固版确认` 的 12 个 64 位哈希压成"当前/历史"两行加一个引用。
  代价：需要确认"确认绑定"的法律/流程语义是否允许别名。

### 6.6 针对隐含假设与术语（P-12/P-13）

- **C6-A｜新增"未定义术语/计数"清单节**：把「14 步」「八处 vs 18+」「24 vs 18」「六类 vs 10 行」这类悬空计数集中登记（`plan.md` L221 已有单点范例，推广成固定节）。
  代价：会增加一节，但可直接消除"读者要猜"。
- **C6-B｜FR/AC 编号连续性校验**：build-plan 阶段检查编号是否连续，跳号必须写理由（`FR-55`/`AC-56` 这类继承自 prd 的编号需显式标注"继承母 PRD 编号，非本卡跳号"）。
  代价：需与 prd 的编号体系协商（可能是上游约束）。
- **C6-C｜术语表收口**：「五阶段 / 正式阶段集合 / WORKFLOW_STAGES / CANONICAL_STAGE_SLUGS」在 CONTEXT.md 里定一个唯一能指，材料内只用一个词。
  代价：需要确认这四个在代码里是否真是同一集合（若不同，则要在材料里写明差异）。
- **C6-D｜内部矛盾自检**：把"实体定义 vs 功能需求"这类跨节矛盾做成检查项（如 `spec.md` L354「普通四项」vs L215/L223 五阶段）。
  代价：需要定义检查规则，可能只能靠独立审查发现。

### 6.7 针对"实现者入口"（P-14）

- **C7-A｜每份材料首节改为"从这里开始"**：明确"先读什么、按什么顺序、第一步做什么、做完一步看什么"。
  代价：与现有 `材料导航` 的 M/S/B/P 记号并存会重复，需要替换而非新增。
- **C7-B｜定义 M/S/B/P**：或直接删掉，改为"谁在什么时候读这一节"的中文一句话。
  代价：几乎无成本，是最低风险的一个改动。
- **C7-C｜plan 与 tasks 的 Phase 骨架去重**：Phase 的 Goal/Files 只在 `tasks.md` 写一次，`plan.md` 只保留 Phase 划分依据与顺序理由。
  代价：`plan.md` 会失去"独立可读性"（需要与 tasks 一起读）。

### 6.8 跨条目的结构性问题（值得单独一条候选）

- **C8-A｜把"模板"作为一等交付物**：由于 S1/S3 的骨架完全一致、S3 极端案例也照样通过流程，说明单文件修补会被模板复制。候选做法是先改模板 + 加一条材料级检查，再看看是否需要回改历史。
  代价：模板变更影响全部在途 task；需要评估在途 task 是否重写。
- **C8-B｜给"材料里塞无动作内容"定义失败事实**：把 P-17 那类（89.5% 零动作清单）定义为一种可登记的验收失败事实（仍不阻断推进，符合"质量事实≠许可证"）。
  代价：需要能自动区分"需要动作的行"与"登记保留的行"。

---

## 附：本次分析用到的可复算命令

```bash
# 规模
wc -l -c <doc>.md
# 章节骨架 + 每节行数
awk '/^#{1,6} /{ if(h!="") print NR-start"\t"h; h=$0; start=NR } END{ print NR-start+1"\t"h }' <doc>.md
# 哈希 pin 复核
shasum -a 256 decision-log.md spec.md plan.md tasks.md
# AC 字段抽取与长度（见 §3 P-08 表）
# 行号锚点批量复核：抽 spec.md:<N> 并打印 spec.md 第 N 行
grep -o 'spec\.md:[0-9]*' plan.md | sort -u
# 重复率：逐 AC 逐字段比对 spec.md §11 与 plan.md Acceptance Criteria Cards
```
