# WorkflowHub 机制简化 · 任务组 PRD

> Status: `final`（**全部修正已由用户确认，含裁定 A–J；J-10 已答复「接受 A」**） | Decision revision: `sha256:9c5c45a2c06ff5cb01809a2712064577e84f69ef1e46ca2be97be262220bae68`
> Source revision: 见「共享定义 · 来源绑定」 | Map revision: `build-prd-map-v1`（`sha256:08786646602e535d8101612ab323cc3455b071e2080e7633c04cd42b09115b4d`）
> Writer: `spec-prd` | Write target: `specs/workflowhub-mechanism-simplification-20260910/prd.md`
> 本文件**不是第五份当前材料**：不进 `CURRENT_MATERIAL_FILES`；`close` **不得要求它**（**目标态**；实测当前 `core/task-close.mjs:1722-1723` 的 planning 分支**仍在读 `prd.md`**，属 C6 要改掉的现状，不是已成立的事实）。

## 导航

| Section | Purpose | Read when |
| --- | --- | --- |
| 产品总览 | 已确认方向、范围、非目标、当前状态 | 总是 |
| 共享定义 | 卡片共同引用的定义与唯一口径 | 读任何卡之前 |
| 任务地图 | 3 个交付组 / 10 张卡 / 依赖图 / 需求覆盖 | 地图核对时 |
| 最终展示稿确认 | 四版本绑定 + 展示稿 hash + 两个布尔 | 定稿前 |
| 任务卡 | 10 张卡 × 18 个必填字段 | 开工任一卡之前 |
| 风险与交付说明 | 缺口与受影响范围、**异源审查 findings 处置表（17 条）**、质量事实、交付说明 | 交接前 |
| 本 PRD 不声称的事 | 七条诚实边界（未形式收口 / 母材料不自洽 / 未改代码 / 基线不可信 / `decision_hash` 不可复现 / 跨仓未验证 / 宿主不可用） | 引用本 PRD 任何结论之前 |
| 变更说明 | 归档维护证据与承诺影响 | 维护时 |

---

## 产品总览

- **母决定与确认**：`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`（1,979 行 / 239,459 B / 30 条决定 D-001~D-030 / 30 条收敛大纲条目 OI-001~OI-030）。用户于本会话真实答复「确认」；随后追加 R-013。**绑定口径见「共享定义 · 来源绑定」**（`decision_hash` 的当前事实与三处不一致已如实登记，见「风险与交付说明 · 缺口」的 **X4 / X15 / X16**）。
- **目标与范围**：把 WorkflowHub 从「每层都加校验」的机制收敛回「薄核心 + 四份材料 + 一个执行记录」的形态，使五个 stage 能顺畅跑完；并让后续任何改动都趋向净减少控制面而不是净增加。**按 D-002 立目标**：整改以「**净减控制面**」为准，不是补漏 —— 因此本路线每张卡都以「删 / 合并」为主体，凡把删除替换成「加一层」的形态一律判失败。**本 PRD 只做路线设计，不改任何代码**（D-019）。
- **非目标**：不改 wh-review 的 per-stage 审查标准与 prompt；不新增第五份材料 / public command / 持久化对象 / 状态机；不改动已落盘的历史 provenance 字节；不迁移历史任务、不做兼容桥、不建双写；不在本任务内重写五个 stage 的 SKILL；**不产出任何延期项**；宿主 / broker 实现不在本仓库范围内。
- **规划对象设计适用性**：`non_ui`。**第 4 步复核理由（母材料的 `non_ui` 事实重算）**：本路线改动面全部落在 `runtime/`、`tools/cli/`、`skills/wh-review/`、`workflows/*/skill-deps.yaml` 与治理文档；**唯一"人看的输出"是 C6 的 `status` 文本行**，它是命令行文本而非页面 / 前端交互 / 视觉设计，因此不翻转三输入判据。若后续某张卡引入需要人看的界面改动（交互稿、页面、视觉规格），必须**重新计算本事实**。
- **当前状态**：`draft`（地图已由用户确认；任务卡已展开；等待定稿确认）。

---

## 共享定义

### 唯一口径（禁止在别处另立）

| 口径 | 唯一来源 | 含义 |
| --- | --- | --- |
| **批次计数** | 母材料 D-018 修订句（`## 决定` L1380–1391） | **10 个具名批次**：⓪①②③④⑤⑥⑦⑧⑨。母材料其余处出现的「9 个批次」为残留，**不采用**（见缺口 X9） |
| **批次执行序** | 母材料 D-018「批次执行序（唯一口径）」句（L1391） | 任务Ⅰ = ⓪→①→②→③；任务Ⅱ = **⑨（最先）**→④→⑤→⑥；任务Ⅲ = ⑦→⑧ |
| **卡号** | 本 PRD 第 4 步 | 卡号 = 批次号（`C0`=⓪ … `C9`=⑨），不另立映射表 |
| **交付组** | 本 PRD 第 4 步 | 交付组 = 一个后续标准开发任务 = 一条合并列车 |
| **M1–M5 分子/分母** | C0 写死后为准 | 本 PRD 只给定义草案；**C0 在 HEAD 重测写死唯一值**（缺口 X2/X3） |
| **卡级字段** | 本 PRD「任务卡」节 | 18 个必填字段，见下 |

### 术语

- **控制面（control plane）**：任何会让任务停下来等它的东西 —— 门禁、完成谓词、确认点、预算、绑定校验、投影、**无真实 consumer 的持久对象**。
- **净减法**：代码行数、每任务记录文件数、无 reader 对象数**逐项净降**，且给出**具名删除清单**。把「删除」替换成「搬家 / 改名 / 加一层统一层」判失败。
- **无 reader 对象**：写出来但没有任何**生产**代码读它的持久文件或字段。「只在测试里被读」不算有 reader。
- **具名 ref**：一个**具体路径或 ID**（例如 `quality/reviews/<file>`），不是一个目录扫描或一个"平台"。
- **审查五态**（原「审查三态」；**取值集合在此定稿，不再留成「由 C4 定稿」的菜单**）：`review_origin ∈ {conducted, unavailable, not_run, same_source_degraded, dispatched_uncollected}`，**恰好五个**（D-005② + D-021①；第 5 取值字面量名 = **裁定 J-1**）。语义逐个写死：`conducted` = 审查真做过且调用方收到结果；`unavailable` = **已收到并读取材料之后**才失败（D-021② 收紧后的降级门槛）；`not_run` = 没跑（必须写理由，禁套话）；`same_source_degraded` = 审查者与执行者同**底层模型**（D-021③）；**`dispatched_uncollected` = 已派出且 provider 已产出，但调用方未收取 / 未收齐**（D-005 与 D-021① 的 X1 实测情形：既非 `conducted` 也非 `not_run`）。
- **四层状态**：实现完成 / 阶段质量 / Git 交付 / 任务收口 —— 各自一格，**不合并**（D-005 修订）。
- **阶段执行记录行（K2）**：`facts.jsonl` 里的一行，**行型由 `record_kind` 区分，恰好两种**（**裁定 J-2**）：① `record_kind:"stage"` —— **每个 stage 一行**（5 个正式 stage + `non_stage` 工作流各一行；同一 stage 不得有两行）；② `record_kind:"close_action"` —— close 的**五个物理动作各一行**（K8）。**「每 stage 一行」是行型 ① 的唯一性约束，不是「文件里只有 stage 行」** —— close 动作行**是** K2 行的一种，不是第二种记录文件。两种行型共用同一 `facts.jsonl` 与同一字段表，但必填子集不同：行型 ① 必填 = 审查五态 + 真实跑过的命令与退出码（含失败签名）+ 四层状态 + 严重问题处置；行型 ② 必填 = 动作名 + 结果 + 具名 ref + 命令与退出码（不适用时写 `null` + 理由）。**本路线里唯一写者** = 该 stage 主会话（经写口核对）；行型 ② 的写者 = `task-kernel`。
- **写口身份核对**：唯一保留的一次核验 = `task_id` + 工作区路径 + 待写字节。**只有三项**，不得长胖。
- **绿灯**：一次通过过的事实。**不再自动失效、不再自动重跑**。
- **诚实缺口**：`unknown` / `unavailable` / `incomplete` 是**事实**，不是失败；禁止伪造通过，也**不得**用它阻断同任务的修复。

### 保留侧清单（K1–K9，删除时必须逐项比对，K 优先）

| # | 记录 | 承载位置 | 谁写 | 谁读 |
| --- | --- | --- | --- | --- |
| K1 | 任务身份 | `<task_dir>/<task-id>/task.json` | `task-bootstrap` | 所有入口的写边界核对 |
| K2 | **阶段执行记录行**（见术语） | `<task_dir>/<task-id>/facts.jsonl`（唯一执行记录文件） | 该 stage 主会话 | 下一 stage、`status` 根因行、Talk 输入、close |
| K3 | 四份材料 | worktree `specs/<task-id>/{decision-log,spec,plan,tasks}.md` | 各 stage | 人 + 下游 stage |
| K4 | 人确认与不可逆授权 | 现有 `quality/confirmations/` 与 `quality/authorizations/` | `task-kernel` | 完成判据的凭证核对、close 授权 |
| K5 | 被引用的原始证据（测试输出、审查原始结果） | 现有证据目录，**按引用存在** | 命令 / 审查 | 人复核、验尸、回归对照 |
| K6 | spec-analyze 结论 | **写入 K2 同一行**（`spec_analyze` 字段） | 该 stage 主会话 | 下一 stage、`status` |
| K7 | wh-review 正式结果 / receipt / review fact | 原始结果进 **K5**；K2 行只记 `review_origin` + `review_result_ref` | 审查 | 人复核；**不再有 receipt/review fact 三件套** |
| K8 | close 动作记录 | **写入 K2**（close 的五个物理动作各一 **`record_kind:"close_action"` 行**，与 stage 行同一文件同一字段表，见术语「阶段执行记录行（K2）」）；`operations/close/**` 多文件计划改为一次性展示 | `task-kernel` | 人复核 |
| K9 | 测试记录 | 原始输出进 **K5**；K2 行记命令 + 退出码 | 命令 | 人复核；**不新建测试记录对象** |

### 删除侧对象族（**族级**清单，不等于任何单张卡的删除清单）

> ⚠️ **与「裁定 H」的边界**：下面是**族级**清单（「这类东西要收掉」），**不等于**任何单张卡的删除清单。**裁定 H 已裁定**：`stage-outcome-proofs/**`、`workflow-evolution.mjs`、protocol-error 白名单与自动重发组**在 HEAD 上有真实 consumer，不在 C1 删除**。**`stage-outcome-proofs` 的终局已由裁定 J-4 定死 = 保留（归 K5，不迁移、不删除）**，本行的 `stage-outcome-proofs` 字样只作族级留痕。凡引用本节清单执行删除的，**必须先过 D-013 的「没有真实 consumer 就删」判据**。

每步完成证据 / `stage-outcome-proofs`（**实测有活生产 reader，改判为 K5，见裁定 J-4**） / 单步 `stage_outcome` / **阶段级 `stage_outcome` 对象** / `quality/facts/**` / `index.json` / `quality/verify.json` / product-release 投影 / review attempt-result-report 三件套 / snapshot tree 与 material revision / `identity/**`（折入 K2；其中 **`identity/path-cards/**` 零 reader，整类删除，见裁定 J-3**） / `operations/close/**` 多文件计划 / 14 个零引用 schema / 无调用者工具链 / `workflow-evolution.mjs` / protocol-error 白名单与自动重发 / `stage-reflection` 独立产物（结论进 K2）/ `runtime/task/task-index.mjs`（裁定 B）。

### 阻塞分类学（八类，新阻塞必须先归类再登记）

事实/状态类 · 门禁/流程类 · 依赖外部类 · 新鲜度/身份类 · **编排/上下文类** · **工程/测试类** · 交付/收口类 · 治理/增殖类。
**常驻规则**：任何新登记的阻塞必须**先归入八类之一**，并在同一处登记该类对应的防护与 owner；归不进任何一类的，必须先扩表再登记。

### 卡级 18 个必填字段（每张卡缺一不可）

1 结果与 consumer · 2 范围 · 3 流程/状态 · 4 FR · 5 AC（每条带失败判据）· 6 oracle · 7 准备依赖 · 8 实现依赖 · 9 验收依赖 · 10 合并依赖 · 11 共享资源冲突与集成责任 · 12 来源/设计 · 13 局部风险 · 14 可后置技术项（**默认 `none`；不得出现任务级延期**）· 15 最小读取集（必读/条件读/正常不读）· 16 五阶段开工说明 · 17 受影响测试清单与命令 · 18 控制面净增减申报。

> 第 17、18 项是本任务按 **D-020④**（测试暴露面）与 **D-013 守卫 + OPN-3**（控制面净增减 + 主体级行数净减目标）加的，不是模板新发明。

### 来源绑定

| 来源 | revision | 说明 |
| --- | --- | --- |
| `specs/<task>/decision-log.md` | `sha256:9c5c45a2c06ff5cb01809a2712064577e84f69ef1e46ca2be97be262220bae68`（1,979 行 / 239,459 B） | 母决定。**当前文件值** |
| 同上（确认时绑定值） | `sha256:ca12f0b01c2dc3ac7b076766f17a4868dccfae3e19f152e584b72ba00211b548` | **已不可复现**：那是确认那一刻的**整文件**哈希，而文件在确认后又被追加并就地重写（缺口 X4）。代码对整文件取哈希，**没有任何"按章节取哈希"的实现**，因此该值无法恢复 |
| 交互聚合 | `quality/evidence/interactions/59f1998edc6e13d297fdf67863ef014eadac65d801b9175590b93b46ef995dab.json` | 30 条 `oi_dispositions`。母材料 `## 文档结果` 写的 `8b44558e…` 是残留（缺口 X5） |
| 仓库 HEAD | `216a546d4ec33ca3804a188a14a9536a2968f77c` | 本 PRD 所有实测数字的基线；主仓与 worktree 的 `runtime/` 逐字节相同 |
| 本 PRD 地图 | `build-prd-map-v1` / `sha256:08786646602e535d8101612ab323cc3455b071e2080e7633c04cd42b09115b4d` | 用户已确认 |

---

## 任务地图

**卡 = D-018 的 10 个具名批次；交付组 = 3 个后续标准开发任务（合并列车）。**

| 执行序 | 卡 | 批次 | 交付组 | 结果（可独立验证） | consumer | owner | 合并依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **C0** | ⓪ | 任务Ⅰ | 整改有了可被他人独立复算的基线口径 | C8、C1–C7 的逐批验收 | 任务Ⅰ 主会话 | 首发；必须先于 C1 合入 |
| 2 | **C1** | ① | 任务Ⅰ | 与 `task-store.mjs` 无关、**且经 consumer 扫描确认无真实 consumer** 的叶子不再占地方 | C2、C3、C7；M3 | 任务Ⅰ 主会话 | 依赖 C0 合入 |
| 3 | **C2** | ② | 任务Ⅰ | 同一个概念在仓库里只有一处定义 | C3、C5、C7 | 任务Ⅰ 主会话 | 依赖 C1 合入（同 `task-store.mjs`） |
| 4 | **C3** | ③ | 任务Ⅰ | 任务目录里只剩**一个**执行记录文件，且它**有人读** | C4、C5、C6；`status` 根因行 | 任务Ⅰ 主会话 | 依赖 C2 合入；**同文件同批** |
| 5 | **C9** | ⑨ | 任务Ⅱ | 不再有 900 秒空等、不重复跑同一命令、超时不丢已完成结果、坏命令开工前被拦下 | C4、C5、C6 的运行成本 | 任务Ⅱ 主会话 | 任务Ⅱ 首发；依赖 C3 合入 |
| 6 | **C4** | ④ | 任务Ⅱ | 审查**做过就算数**；卡死的审查由 3rd-review **自己判死**，不靠 timeout | C5、C6、C8 | 任务Ⅱ 主会话（跨仓项在 3rd-review 仓） | 依赖 C9 合入 |
| 7 | **C5** | ⑤ | 任务Ⅱ | 改一个文件**不会**让之前的绿灯失效，也不自动重跑 | C6、C8 | 任务Ⅱ 主会话 | 依赖 C4 合入；批内含 CI 度量处置 |
| 8 | **C6** | ⑥ | 任务Ⅱ | `status`/`close` 只报根因，读取来源只有具名 ref | C7、C8 | 任务Ⅱ 主会话 | 依赖 C5 合入 |
| 9 | **C7** | ⑦ | 任务Ⅲ | 文档说的和代码做的一致；下次想加东西时宪法先拦住 | C8；未来的所有改动 | 任务Ⅲ 主会话 | 依赖 C6 合入 |
| 10 | **C8** | ⑧ | 任务Ⅲ | 能看到这次整改**真的净减**了，而不是搬了家 | 用户；本 PRD 的验收 | 任务Ⅲ 主会话（异源复核） | 依赖 C7 合入；末位 |

### 依赖图

```text
任务Ⅰ   C0 ─→ C1 ─→ C2 ─→ C3
                              │
任务Ⅱ                        ▼
         C9 ─→ C4 ─→ C5 ─→ C6
                              │
任务Ⅲ                        ▼
                        C7 ─→ C8
跨批约束  C3 ─→ C5   （记录重建必须先于删失效链）
批内约束  C5 内含 check-extensibility 度量处置（否则 npm run check 与 npm test 两条链一路红）
能力前置  C4 ─→ OPN-5 / outline_closed（本任务 make-decision 的形式收口）
```

### 需求覆盖（R-001 ~ R-015）

| 需求 | 负责卡 | 验收 oracle | 或明确排除 |
| --- | --- | --- | --- |
| R-001 不接受 followup 方案 | 全体（方案形态即回应） | 本 PRD 与 followup 方案逐条差异 | 排除：followup 整体方案 |
| R-002 机制有极大问题 | C1 C2 C3 C4 C5 C6 | 各卡 oracle | — |
| R-003 >50% 花在机制上 | C0（口径）C8（对照） | M1–M5 逐项净减 / 不劣化 | token 维度标 `unknown`；>50% 永久标**推算** |
| R-004 改动会再加东西 | C7（宪法负向条款 + 守卫三要件）C8（M4） | 零新产物守卫自指可证伪 | — |
| R-005 重新设计更优雅方案 | 本 PRD 自身；C1–C8 | M4 git 净行数为负 | — |
| R-006 未来不再阻塞 | C4（审查类）C9（工程/测试类）C7（分类学常驻规则） | 八类阻塞逐类有防护与 owner | — |
| R-007 step/skill 正确执行 + 记录该记录的 + 少门禁 | C3（唯一记录 K2）C4/C6（少门禁）C1/C5（保留侧不误删） | K1–K9 逐项仍存在；门禁条目净减 | — |
| R-008 点名对象族（16 个） | C1 C2 C3 C5 C6 + C4 | 母材料 `## R-008 点名对象族处置` 逐对象核销 | — |
| R-009 流程纪律（不跳阶段） | 每张卡的「五阶段开工说明」 | 后续 3 个任务各自走完五阶段 | — |
| R-010 本任务不实现 | — | — | **排除**：本任务只出 PRD（D-019） |
| R-011 交互纪律 | 执行事实，不立新规 | — | — |
| R-012 调研输入 7 份 | 只读来源，已消费 | — | — |
| R-013 不靠 timeout 关闭审查 | **C4** | 故意空转的审查由健康裁决进终态；全流程无 timeout 外层命令 | — |
| **R-014 窄修复包**：审查是把 **73 个文件、665KB 材料**整包发给多个 provider 的；修完一个 finding、材料一改，原审查结果立刻「过期」，下次又要整包重发。要求：给每个 finding 配窄修复包（**原 finding 的 ref + 受影响文件的最小 diff + 对应测试 + 当前源码树 + delta 的验证结果**）；**只有越界时才重跑完整审查**（改公共接口 / schema / 安全边界 / 跨原审查模块）。来源：**用户本会话追加（build-prd 阶段）**；关联处置：**裁定 I** | **C4** | focus 复审的**最小输入形态**可核验（一次性组装、不落盘、零新增文件）；「越界才重跑」沿用 D-022③ 原文，**不重复登记** | 不新增任何「防 stale」机制（C5 删哈希失效链后修 finding **不会**让审查结果 stale）；为它新增落盘持久对象即判不通过 |
| **R-015 Phase 循环瘦身与 RED/GREEN 证据卫生**：① RED 只留**简短失败签名**，不再每次复制成完整长期证据包；② 证据**按消费者去重**；③ 输入没变时**安全复用 Phase review**；④ Phase review 花约 **600 秒**却「既没阻止后续开发、也没成为 verify 能复用的正式质量事实」，verify 又做一遍 full review；⑤ build-code 阶段开了**好几十棵 worktree**。来源：**用户本会话追加（build-prd 阶段）**；关联处置：**裁定 I** | **C3**（①）**C4**（③④）**C7**（⑤） | 各卡 FR / AC / oracle；① 的字段形态写进 **K2 行字段表**（命令 + 退出码 + 失败签名） | ①②③ 已由 **K9 / K5 / D-003 / 批次⑨ / C5** 覆盖，**只补具名形态**；⑤ 是**宿主行为**，按 `non_goals` 登记（裁定 I-6），本仓不造机制 |

> **R-014 / R-015 的来源与分派（必读）**：R-014 / R-015 是 **build-prd 阶段由用户追加**的需求，**不是 make-decision 阶段的产物**（母材料 `decision-log.md` 里没有这两条）；已按**裁定 I** 分派到**已有卡**（C3 / C4 / C7），**未新增卡、未新增持久对象**。

### 明确排除（已裁定，不属遗漏）

下表**逐条覆盖**母材料 `## 拒绝方案` 表的**全部 15 行**（E-1 ~ E-15；「对应行」= 该表自上而下的第 N 行），另加 5 条本 PRD 自身的排除项（E-16 ~ E-20）。`C7-AC-3` 的判据 = **覆盖全部 15 行且逐条可追溯**。

| # | 排除项 | 母材料 `## 拒绝方案` 对应行 | 依据 | 影响面 |
| --- | --- | --- | --- | --- |
| E-1 | `workflowhub-followup-tasks-20260910.md` **整体方案** | 第 1 行 | R-001（用户原话「就算实施了，未来也一样会出现很多阻塞和问题」）；D-002 `rejected_alternatives` | 本 PRD 与它逐条差异；它的后续任务 A/B 划分由 D-018 重做 |
| E-2 | 统一 canonical writer + 原子更新 `index` / `facts` / `verify` | 第 2 行 | D-013 零新产物守卫；`index.json` 无功能 consumer（X29） | 改为**删对象**，不改写机制 |
| E-3 | 新增终态状态机 `completed_with_quality_unavailable` | 第 3 行 | D-005②（用户 Q13/R6：**用字段承接，不要用状态机承接**） | 由 K2 行字段 `review_origin` 承接（裁定 G） |
| E-4 | behavior / governance digest 分层 | 第 4 行 | D-009①「删失效链」已以更彻底方式达成目标 | 不引入两层 digest（C5 删既有哈希失效链） |
| E-5 | executable compiler / contract report | 第 5 行 | R-001 / Q16 / Q18；替代物 = 材料必填小节 | 不新增控制面 |
| E-6 | command fingerprint + active-attempt lock / `doctor --stage` / `execution-ledger.jsonl` | 第 6 行 | D-026②；去重替代物 = `review_result_ref`；记录载体 = `facts.jsonl`（K2） | C9 去重落点按 X31 裁定；不新增对象 / public command |
| E-7 | 依赖闭包 freshness（保留 fresh 但缩窄） | 第 7 行 | D-009（用户 Q10：**去掉哈希，不要改一点就变一下**） | C5 删 `material_revision` / `snapshot_tree` 链 |
| E-8 | 每 Phase 审到 findings 清零 | 第 8 行 | 用户 Q20「审查是帮助找 findings 的流程，有做过就可以了」；build-prd 契约「findings 不是规划完成」 | C4 只保证「做过就算数」，不做追零循环 |
| E-9 | 保留 review 轮次预算 + 人工放行 | 第 9 行 | D-010（预算算法已实测出错，且是三大硬阻断之一） | C4 删轮次预算（实测行号见 X32） |
| E-10 | 新建 `runs.jsonl` 作为运行记录 | 第 10 行 | 用户 Q18「整个 workflowhub 任务应该只保留一个文件记录这种信息」；K2 | 运行记录复用 `facts.jsonl`，不新建文件 |
| E-11 | 自动统计控制面数量的检查器（减法守卫的机器版） | 第 11 行 | `CONSTITUTION.md` F11「不得另造计数器来检查是否足够简单」 | 减法守卫靠材料纪律 + 三要件，不新增检查器 |
| E-12 | 硬拦截「一张卡最多改 N 个文件」 | 第 12 行 | 与「不要门禁阻挡」冲突（D-026①） | 只作**建议**，不阻断 |
| E-13 | 卡文件数之外的**延期处理** | 第 13 行 | 用户「我不希望有延期任务，当前任务本身就是 prd 类规划任务」；D-026②③ 修订 | 本 PRD **零延期项**；卡内解决或如实标 `unknown` |
| E-14 | 为历史任务补质量验收 | 第 14 行 | 与「历史只读冻结、不新增 writer」冲突；D-016 | 历史任务只读冻结 |
| E-15 | 迁移历史 task-store / 兼容桥 / 双写 | 第 15 行 | D-016 | 历史任务只读冻结；老任务在新命令下可能读不出 |
| E-16 | 本任务不实现任何删除 | —（不适用） | D-019 | 本次只交付 PRD |
| E-17 | 宿主 / broker 仓外能力（lifecycle、`requirementAuthentication`、broker→caller `PROTOCOL_INCOMPATIBLE`） | —（不适用） | D-026③ | 每个任务的 formal stage 事实稳定显示 `unavailable`；**不阻断任何阶段结束** |
| E-18 | 改 wh-review 的 per-stage 审查标准与 prompt | —（不适用） | 用户明确要求保留 | C4 只改**输入契约与生命周期** |
| E-19 | 新跑真实任务采基线 | —（不适用） | 用户明确否掉 | C0 只用已有历史数据 |
| E-20 | **宿主每会话 / 每 phase 自建 worktree**（实测 workflowhub 只建一棵确定性 worktree：`runtime/task/workspace.mjs:419,435`） | —（不适用） | **D-026③ + 裁定 I-6** | build-code 期间 worktree 数量由宿主决定，**不阻断任何阶段结束**，本仓不造机制 |

**这 15 条同时进 C7 的宪法负向条款**（`C7-FR-6`），永不复用。

---

## 最终展示稿确认（第二次调用后）

> 本节在定稿确认时填写。**不是第三次内容调用。**

- **展示稿状态**：`final`
- **展示稿 hash**（`displayed_draft_hash`）：`sha256:4dfeb9ff813f2e11397afad77bf171232724a31c3474aeda0c835911ade25a26`（3,811 行 / 403,117 B）—— 这是**用户实际看到并确认的那一版**，`markdownlint-cli2`（仓库自身配置，`default: true`）实测 **0 error**
- **Decision revision**：`sha256:9c5c45a2c06ff5cb01809a2712064577e84f69ef1e46ca2be97be262220bae68`（1,979 行 / 239,459 B）
- **Source revision**：见「共享定义 · 来源绑定」（含仓库 HEAD `216a546d4ec33ca3804a188a14a9536a2968f77c`）
- **Map revision**：`build-prd-map-v1` / `sha256:08786646602e535d8101612ab323cc3455b071e2080e7633c04cd42b09115b4d`
- **PRD revision**：`sha256:4dfeb9ff813f2e11397afad77bf171232724a31c3474aeda0c835911ade25a26`（= 被确认的那一版）
- **最终确认 revision**：`sha256:4dfeb9ff813f2e11397afad77bf171232724a31c3474aeda0c835911ade25a26`（与四个 revision 逐个一致，**无错版**）
- **display_before_reply**：`true`（完整 PRD 先在会话中展示并同时在侧边栏打开，之后才收到用户答复）
- **human_approved**：`true`（用户原话：**「定稿确认」**）—— 绑定的是 `4dfeb9ff…` 那一版
- **确认结果与缺口**：首版确认**通过**，用户在确认的同时接受了**裁定 F**（`npm run check` 的 oracle 从「退出码 0」改为「不劣化于 HEAD 基线 + 本卡范围内清零」）。裁定 A/B/C/D/E/G/**H** 见下。

### ⚠️ 确认后的修正记录（**必须重新确认**）

首版（`4dfeb9ff…`）确认后，两次**独立上下文的异源复核**（一次逐条对母材料核验，一次专门证伪 7 个完成性主张）在首版中发现**阻塞级缺陷**。缺陷属「验收口径与删除边界」的**实质变化**，按本 PRD 自己的「变更说明」规则，**不得默认沿用原确认**。修正如下：

| # | 首版的问题（复核实测） | 修正 |
| --- | --- | --- |
| **M-1** | **C8 的「静态净减法」具名删除清单同时踩两种失败模式**：`runtime/evidence/protocol-error-whitelist.mjs` **路径写错**（真实在 `runtime/stage/`，且被 `stage-runner.mjs:943,2500` 活调用）与 `quality/evidence/stage-outcome-proofs`（**不是仓库路径**）会 `test ! -e` **真空通过 = 假绿**；`workflow-evolution.mjs`（C1 明写不删）与 `task-index.mjs`（裁定 B 归 C3）留在 C1 段会诱导**真删活模块** | 整段重写为 **四类对象各自 oracle**（仓库文件 / 任务实例对象 / 代码符号 / 整类目录），并显式列出**必须留在表外**的四个活对象 |
| **M-2** | `tests/contract/task-record-paths-check.test.mjs` **不存在**（真实路径 = `tests/task-record-paths-check.test.mjs`），出现 3 处，其中 1 处紧接着写「全部 EXISTS，无一 MISSING」→ **PRD 用自己的证据块自证其完成性主张为假** | 3 处全部改为真实路径 |
| **M-3** | **C3 缺 AC**：「改 `facts.jsonl` 字段表」会让 **19 行已落盘历史 provenance** 因 `validateFact` 的**精确 10 键集相等**判定而抛 `unsupported fields` —— 这是「不删历史字节」之外的**等价破坏路径**，而 C3 是唯一改该文件的卡 | 新增 **C3-AC-7**（历史 task-fact 行仍可读）+ **C3-AC-8**（`STAGES` vs `non_stage` 的 K2 行写入冲突，与 C6-FR-8 同批裁定）；并列入 C3 局部风险最高优先项 |
| **M-4** | `C1-FR-2` 把 `stage-outcome-proofs` 定性为「内容无 reader」，与**同卡 §范围**（不删）和 **X20 实测**（3 处活生产引用）自相矛盾 → 照 FR 执行会误删 | FR-2 改写为「**本卡不删 proofs，它归 C3**」 |
| **M-5** | **C0 第 17 与第 18 字段互斥**：一个要求「新增测试文件」，另一个写「新增任何文件即判不通过」 | 第 17 字段改为「第 18 的零新增约束优先；测试载体改为一条 `node -e` 断言命令，不新增文件」 |
| **M-6** | **C2 的两条 oracle 不可达**：`STAGE_REFLECTION_REF` / `CLOSE_PLAN_REF` 的 grep 数的是**声明+调用点**，写成「期望 1」永远达不到 | 拆成「声明数 → 1」+「定义处以外全部 import 自同一定义」两条可达判据 |
| **M-7** | `X30`（`review_origin` 在 HEAD **全仓 0 命中** → 它是**新增字段**而非「枚举补第 5 值」）在原稿只留「需一次显式裁定」= **变相延期**，且与排除项「不新增持久化对象」正面冲突 | 新增 **裁定 G**：`review_origin` **不算新增持久化对象**（「对象」指独立文件/schema/command/状态机，**K2 行内的字段不属于该粒度**），并要求 **C7 把「字段 ≠ 对象」写进宪法负向条款**；连带把 C9-FR-6 的落点定到 C4 |
| **M-8** | 三处行数写「实测存在，**行数未测**」→ `unknown`，而**同一份 PRD 别处已实测**（`freshness.mjs` 781 / `quality-store.mjs` 293 / `task-kernel-implementation.mjs` 1,177 / `completion-predicates.mjs` 1,259） | 四处填实测值 |
| **M-9** | 拼写/路径错误：`--poolOptions.forks.singleForks`（真实 flag = `singleFork`）；`tests/contract/official-component-receipts.test.mjs`（真实 = `tests/official-component-receipts.test.mjs`） | 全部更正 |
| **M-10** | 两个 oracle **把验证推给别人的仓**：C4 的 O-6.3（判死逻辑推给 3rd-review 仓）、C9 的 O-5（`/tmp/3rd-review/<runtime_id>/` **占位符 + 依赖某次已发生的 run**，第三方不可复现） | 两处显式标为**本仓不可闭合**，并给出**仓内可闭合的替代 oracle**；跨仓部分标 `unknown` |
| **M-11** | `X24` 的「49 个历史 `facts.jsonl` 全部读取失败」不精确（实测 33 个是 0 字节，非空的 16 个） | 更正为「16 个非空」 |

**第一轮修正后的 revision**：`sha256:acdd7be35fa78b71d2c0a3e7e64785f2150e6bb331cd2852a6b6938feab2f069`（3,832 行），对应 M-1 ~ M-11。

#### ⚠️ 第二轮修正（第二次异源复核 A–H）

第一轮修正后，第二份独立复核（逐条对母材料核验，抽检 41 处）又发现 **8 组**问题。已全部更正：

| 组 | 问题 | 更正 |
| --- | --- | --- |
| **A** | **C1 删除清单与已确认地图正面冲突，且只给「建议裁定」= 变相延期** | 新增 **裁定 H**：那三项**以实测为准不删**（判据 D-013「没有真实 consumer 就删」—— 它们**有** consumer）；地图 C1 的「结果」改写为「经 consumer 扫描确认无真实 consumer 的叶子不再占地方」；C8 §18 的 C1 行同步移出这三项 |
| **B** | **裁定 F 只写在裁定节、没落到卡上**：C4-AC-3 / C5 结果 / C7-AC-5,6,7 仍写「退出码 0」；C5 §16 与 §17 自相矛盾 | 8 处统一为「不劣化于 HEAD 基线 + 本卡范围内清零」；C5 的 §16/§17 矛盾消解为「C5 不跑全链，只跑针对性测试 + 单点 `check-skill-closure.mjs`；全链由 C8 末次跑一次记退出码，判据=不劣化」 |
| **C** | **C8 §18 整表沿用母材料旧值**，与本 PRD 各卡实测逐项冲突 | 7 项全换实测值（12 / ×5三正则 / ×6 / 107处55文件 / 6写点6读点 / 10处 / `:1763`） |
| **D** | **14 处硬性数字失配** | 全部按实测更正（35条目33唯一 / 33 / 9条 / 28 / `runPreflight:527` / `CI=true:133` / `task-close.mjs:1976` / 28处 / `docs/adr` 30 / markdownlint **82** 且**无 MD060** / 17 / 54 / 9vs6 写清口径 / C8 §18） |
| **E** | **X 计数三套并存**（14 / 14+3 / 29+重复计入） | 统一为 **共 51 条**（X1–X19 + X20–X25 + X26–X29 + X30–X36 + X40–X47 + X50–X56） |
| **F** | **「拒绝方案」清单缩水**（母材料 15 行，PRD 只列 10 项且 C7-AC-3 只要 ≥12） | 明确排除表扩到 19 行（E-1~E-15 逐条覆盖母材料 15 行 + E-16~E-19 本 PRD 自身排除项）；C7-AC-3 判据改为「覆盖全部 15 条，逐条可追溯」 |
| **G** | 文件头「`close` 不得要求它」把**目标态写成了事实**（实测 `core/task-close.mjs:1722-1723` 的 planning 分支**仍在读 `prd.md`**）；C0 oracle 与「不声称 M1–M5 有可信基线」打架；导航缺「不声称」节 | 三处全部更正 |
| **H** | `stage-outcome-proofs/*.json` 数 19,937 已漂移 | 6 处改为 **20,149** + 注明「活目录随并发写入漂移（G-5），C8 不得当固定验收数」 |

**本轮修正后的内容 revision**：`sha256:a8a632f5419821bed0017f60140d4c43ff5a17729f7ca3eeca0d09191048ca0a`（3,904 行 / 431,080 B，仓库锁定工具链 `./node_modules/.bin/markdownlint-cli2`（v0.14.0 / markdownlint **0.35.0**）实测 **0 error**，10 张卡 × 18 字段齐备）。

> **记账写入后的当前文件值**：本节与「变更说明」的记账内容写入后，`prd.md` 当前 = `sha256:ef6d13e83481853f69167b4e71cdd35cce037b5a5e208bb5538d764bfbf313a5`（3,926 行 / 435,463 B，同样 **0 error**）。两者的差别**只有**本节与变更说明的记账文字，**卡内容、共享定义、任务地图完全一致** —— 这正是 X4 说的「确认时绑定值 ≠ 当前文件值」，两个口径都必须留着。

**两处我自行核对后未采纳复核者数字的地方（如实登记）**：

- `review-materials.mjs` 与 `completion-predicates.mjs` 的命中行数，另一位子代理用窄口径复出 15 / 42；**主代理用 PRD 自己列的 9 个标识符口径复测，确认复核者的 17 / 54 正确** → 保留 17 / 54。
- C7 对 `decision-log.md` 的 markdownlint 目标：复核者按「82 − MD024×2」推 80，子代理写成 81；**主代理复算 82 的规则分解（MD032×34 + MD022×30 + MD036×12 + MD052×2 + MD024×2 + MD040×1 + MD001×1 = 82）确认目标应为 80** → 已改为 80。

#### ⚠️ 第四轮：首个**真实 wh-review 异源审查**结果与处置

前两轮复核是**独立上下文的子代理替代**，不是正式审查通道。本轮是**第一次真正通过 broker 派发到外部 provider** 的 `build_prd` 审查（2026-09-11）。

**运行事实（如实登记，不做美化）**：

| 项 | 实测值 |
| --- | --- |
| 入口 | 库入口 `runSimpleReview`（CLI 的 `run` 按契约**拒绝** build_prd：`BUILD_PRD_REPORT_ONLY_NOT_PERSISTED`） |
| material_id | `3dbe218a310f98b85f8767d70c37eb74ac6d92a04e49e7c9e30a21747650183b` |
| 墙钟 | **579,969 ms（9 分 40 秒）**；未触及 20 分钟有界等待 |
| 派发 provider | 3 个（`pi/v4flash`、`antigravity/flash`、`codex/luna`） |
| **完成** | **1 个（`antigravity/flash`）** —— 满足 `minimum_heterologous: 1` |
| 失败 | `pi/v4flash` → `PROVIDER_OUTPUT_INVALID`；`codex/luna` → `ATTACHMENT_DELIVERY_UNSUPPORTED` |
| 产出 | **2 条 findings，均为 `major`** |

**findings 与处置（两条都成立，均为本 PRD 自身的真缺陷）**：

| # | finding | 处置 |
| --- | --- | --- |
| 1 | **C9 卡仍持有 `C9-FR-6`（provider 生命周期）并等 `X30` 裁定**，与**裁定 G**（该职责归 C4、X30 关闭）冲突 —— 卡级所有权冲突 | 已改：C9「范围 / FR / 实现依赖 / 共享资源 / 来源 / 可后置 / 最小读取集 / 开工说明」**8 处**全部同步；`C9-FR-6` 标注**已由裁定 G 撤销**，C9 的 FR 到 `C9-FR-5` 为止 |
| 2 | **`C8-AC-1` 要求「具名删除清单逐项 `test ! -e`」，但其 oracle 对「仓库文件」这一类自陈「当前无 oracle」** —— 验收标准无法闭合 | 已改：`C8-AC-1` 改为**双条件** —— ① C1 的最终具名清单**已产出**（清单是 C1 的交付物）；② 该清单逐项通过。**C8 验收的是「清单存在且逐项通过」，不得凭空自带一份清单** |

**这次审查证明的三件事**（比 findings 本身更重要）：

1. **真实异源审查是可行的**，且能在 10 分钟内跑完（远低于此前的 21 分钟零产出）。
2. **它抓到了两轮子代理复核都没抓到的卡内所有权冲突** —— 说明「真 provider 审查」与「独立子代理复核」不是同一件事，不能互相替代。
3. **3 个 provider 里 2 个失败**：`ATTACHMENT_DELIVERY_UNSUPPORTED` 是**本会话第二次复现**（前一次见 T-8/T-10），是**稳定缺陷**，不是间歇问题。

**本轮修正后的 revision**：`sha256:9bb6de1a0cd1c5b3272350c780bcaa8ad9832dceb1cd87e8a6f2d28c2fad3ef8`（4,024 行，仓库锁定 `markdownlint-cli2` 实测 **0 error**，10 卡 × 18 字段齐备）。

**待办**：请用户对 **M-1 ~ M-11（第一轮）与 A–H（第二轮）合计 19 组修正**一次性**重新确认**。确认后本节状态置 `final`，`prd_revision` 更新为 `a8a632f5…`。**在本轮确认之前，任何进一步改动都应停止** —— 本 PRD 已被改动 5 次，继续迭代本身就是它要治理的那种浪费。

**关于本节的 `displayed_draft_hash` 与「当前文件值」**：写入本节会改变文件字节，因此 `prd.md` 的当前哈希**不等于**被确认的那一版。这与缺口 **X4** 记录的是同一类区分 ——「**确认时绑定值**」与「**当前文件值**」是两个口径，不得混用。已发生三次绑定：首版确认 **`4dfeb9ff…`**（用户已确认）；第一轮修正 **`acdd7be3…`**；本轮修正 **`a8a632f5…`**（待确认）。任何后续改动都必须走「变更说明」，不得默认为同一版。

#### ⚠️ 第五轮：**第二次真实异源审查**（17 条 findings）与处置

第二次真正通过 broker 派发到外部 provider 的 `build_prd` 审查（2026-09-11）。**运行事实（如实登记）**：

| 项 | 实测值 |
| --- | --- |
| 入口 | 库入口 `runSimpleReview`（与第四轮相同；CLI 的 `run` 仍按契约**拒绝** build_prd） |
| 派发 provider | 3 个 |
| **完成** | **2 / 3 个 provider 完成**（第四轮是 1/3 —— 通道可用性**有改善但未完全可用**） |
| 失败 | 1 个（与第四轮同族的投递/输出类失败） |
| **产出** | **17 条 findings**，严重度分布 = **blocking 5 / major 10 / minor 2** |
| 性质 | **17 条全部成立，均为本 PRD 自身的真缺陷**（不是 provider 误解） |

**两条新缺陷（本轮实测，编入证据）**：

| # | 缺陷 | 实测证据 | 处置 |
| --- | --- | --- | --- |
| **T-11** | **`request_id` 是确定性的且不含「协议版本」** ⇒ **协议一改，同一材料在 TTL（24h）内无法重跑**：第二次派发撞 `REQUEST_ID_CONFLICT`（**实测撞了两次**） | `managedRequestId`（`skills/wh-review/scripts/simple-review-runner.mjs:102-115`）的 identity = `stableValue({material_id, host_provider, providers, provider_identities, review_mode, prompt, subject})`，**无协议版本、无 nonce、无时间**；broker 侧按 `sha256(request_id)` 建 bindings 目录并在同一 id 绑到不同 request 时抛 `REQUEST_ID_CONFLICT`（`3rd-review/lib/broker.mjs:687-688`、`:710`、`:721`、`:732-734`）；TTL = `config.runtime.ttl_hours` 默认 **24**（`3rd-review/lib/config.mjs`） | **如实登记为已知缺陷，本 PRD 不为它造机制**：它是「协议版本没进 request 身份」的**跨仓缺陷**，落点属 **C4 的审查通道修复**范围（`C4-FR-12` 同族）；**本路线不新增 request 版本字段**（会动 `managedPublic` 的 `exactKeys` ⇒ `PROTOCOL_INCOMPATIBLE`，撞 C4-AC-11），**跨仓部分标 `unknown`**（G-4）并写明重启路径 = 换 material 或等 TTL 过期 |
| **T-12** | **708 KB 的包实测约 11 分钟**（**第一次 20 分钟不够**，被迫重跑） | 本轮实测：整包体积约 **708 KB**，单次完整审查墙钟 **约 11 分钟**；第四轮 9 分 40 秒、第三次 21 分钟零产出 —— 三者同族 | **编入 C4 作为 R-014「窄修复包」的实证支撑**（见 `C4-FR-14` 与 C4 §13 的 `R-9`）：整包重发的成本是**分钟级且不可预测**，而 focus 复审的最小输入（五项、一次性组装、不落盘）是同一成本的**严格子集** |

**这两条与 17 条 findings 的关系**：T-11 解释了「为什么同一材料改完协议后**必须重跑却跑不起来**」（这正好是 R-014 的动机）；T-12 量化了「整包重发有多贵」（这正好是 R-014 的收益）。**四条阻塞级里没有一条能靠放宽断言消除** —— 逐条处置见下节「异源审查 findings 处置表」。

**本次修正的边界（诚实声明）**：17 条中 **15 条已改 PRD**、**2 条给出了具名裁定**（`check-extensibility` 的 A–F 收进裁定 J-5 / J-10；C9 的 X31 收进裁定 J-6），**没有一条被放宽或删掉**。其中 **J-5 与 J-10 需要用户回答一句话**（见裁定 J-10）。

#### ⚠️ 第三轮追加（R-014 / R-015 + 裁定 I）

用户在**本轮**追加两条需求（**R-014 窄修复包** / **R-015 Phase 循环瘦身与 RED/GREEN 证据卫生**），并选择「**按收敛后的形态加**」（不新增卡、不新增机制）。本次追加 = **两条需求 + 裁定 I + 落进 C3 / C4 / C7** 三张**已有卡**：

| 追加内容 | 落点 | 形态（写死的判据） |
| --- | --- | --- |
| R-014（focus 复审的最小输入） | **C4-FR-14** + `C4-AC-17` + `O-8.1` | 一次性组装、**不落盘**；做成落盘持久对象即判不通过 |
| R-015③（Phase review 复用判据） | **C4-FR-15** | 复用判据 = **输入未变**（具名输入逐项相同），与 C5 的「绿灯不失效」一致 |
| R-015④（跨阶段复用） | **C4-FR-16** + `C4-AC-18` + `O-8.2/8.3` | verify 读 Phase review 的 `review_result_ref`（K5）；去重**只限重叠维度**；verify 自己的 `dsh-code-review` lens 保留 |
| R-015①（简短失败签名） | **C3-FR-8** | 写进 K2 行字段表：命令 + 退出码 + **失败签名**；原始输出**按引用进 K5** |
| R-015⑤（宿主 worktree 增殖） | **C7 §2 第 16 项** + C7 §6 oracle + `E-20` | 按 `non_goals` 登记 + 写明影响面；**不在仓内造机制** |

- **未新增卡**（仍 **10 张**）、**未新增持久对象**、**未新增 schema 文件**、**未新增 public command**、**未改 per-stage 审查标准**（裁定 I-7 的负向边界）。
- 本轮**不改**已有 FR / AC / oracle 的语义；只做**追加**与两处定点改写（`### 需求覆盖` 的小标题 → `R-001 ~ R-015`；明确排除表的「另加 4 条（E-16 ~ E-19）」→「另加 5 条（E-16 ~ E-20）」）。
- **实际值（写入后复算）**：`4022` 行 / `456130` B，仓库锁定工具链 `./node_modules/.bin/markdownlint-cli2`（v0.14.0 / markdownlint **0.35.0**）实测 **0 error**；10 张卡 × 18 字段齐备。
- **内容 revision（哈希自指口径，可复算）**：`sha256:a1528dbf9122ec84b6e21c97109962fb3e6206c0d4ea601d82b7d410949149ab`。**哈希值写进自身会改变文件字节**，故本 revision 按「把本行的 64 位值替换为 64 个 `0` 后对整文件复算」给出（替换前后长度相同 ⇒ 行数 / 字节数与交付文件一致）。复算：`python3 -c "import hashlib;t=open('prd.md').read();H='<本行的 64 位值>';print(hashlib.sha256(t.replace(H,'0'*64,1).encode()).hexdigest())"`。交付文件的原始 `shasum -a 256` 值随本轮交接报告给出，**不复写回本文件**（写入即失效）。

拒绝、未答或错版最终确认必须保持 `draft`，列出具体缺口和受影响范围。

---

## 任务卡

### 卡片阅读约定

**卡 = D-018 的 10 个具名批次；每张卡 18 个必填字段（字段定义见「共享定义」）。**

- 每张卡的「17 受影响测试清单与命令」只列**真实存在**的测试文件（逐条 `test -e` 核实过），并给出只跑这些的精确命令 —— 项目硬规则禁止无范围全量回归。
- 每张卡的「18 控制面净增减申报」给出**实测**当前行数与预计净值；估不出的如实标 `unknown`，**不编数字**。
- 每个交付组末尾附两节：`## 实测记录`（命令原文 + 关键输出，供复核）与 `### 需要裁定的新增矛盾`（卡片起草阶段实测发现、与父材料或已确认地图不符之处）。

### ⚠️ 裁定 F（新，需确认）：`npm run check` 的 oracle 必须改口径

已确认地图里 C2/C5/C7 的 oracle 写了「`npm run check` 退出码 0」。**实测该 oracle 在 HEAD 不可达**：

| 检查 | HEAD 实测 | 说明 |
| --- | --- | --- |
| `markdownlint-cli2 "**/*.md"` | **554 error / 35 files**（**仓库锁定工具链** `./node_modules/.bin/markdownlint-cli2`（v0.14.0 / markdownlint **0.35.0**）实测，exit 非 0） | 「**35 files**」= **含错误的文件数**；`markdownlint-cli2` 自报的 `Linting: N file(s)` 是**扫描口径**，两者不是一回事，本 PRD 一律用前者。其中 **420 条在 `specs/workflowhub-ui-frontend-capability-20260904/**`（22 文件）**，该目录**不在** `.markdownlint-cli2.jsonc` 的 ignores 里 |
| `tools/cli/check-task-record-paths.mjs` | **10 FAIL / exit 1** | 与本任务无关的既有红；其中 2 条来自 `skills/spec-prd/SKILL.md` 与 `skills/spec-prd/templates/prd-template.md` |
| `tools/cli/verify-structure.mjs` | **2 FAIL / exit 1** | `CONTEXT.md` 缺五段术语「test-acceptance」、含排除术语「runtime」 |

**本 PRD 采用的更正口径（不掩盖）**：

1. 所有卡的 oracle 从「退出码 0」改为「**不劣化于 HEAD 基线**（markdownlint **554** error / path-guard **10** FAIL / verify-structure **2** FAIL）**且本卡范围内清零**」。**口径锁死**：markdownlint 一律用**仓库锁定工具链** `./node_modules/.bin/markdownlint-cli2`（v0.14.0 / markdownlint **0.35.0**），**不得用 `npx`**（`npx` 会拉 0.41.1，规则集不同，同一文件会多出 0.35.0 没有的规则）。

#### 2. 本任务自己的材料必须清零

`decision-log.md` 从 **82 → 0**（C7 负责；本 PRD `prd.md` 已是 0）。**口径**：用仓库锁定 linter（`markdownlint-cli2` v0.14.0 / markdownlint **0.35.0**）实测 = **82**；此前记录里出现的 **83** 来自**更新版** linter（markdownlint 0.41.1，其中 1 条是 0.35.0 **没有的** `MD060` 规则），**不采用**。

##### 3. 既有红必须显式裁定归属

那 420 条属于一个**与本任务无关的归档 specs 目录**。C7 二选一并写明理由 —— ① 按现有惯例加**窄的** ignores 条目（`specs/archive`、`specs/m7-intake-v1`、`specs/m9-verify-code`、`specs/m10-baseline-switch` 已在 ignores 里，这是既有机制）；② 保留为**已知红基线**并在 C7 的对照表里登记，不掩盖。**不得**用放宽断言的方式让它变绿。

##### 4. 新增 red 一律判失败

任何卡合入后若使上述三个计数**上升**，即判不通过。

---

### 任务Ⅰ 卡片（C0 / C1 / C2 / C3）

> 基线：HEAD `216a546d4ec33ca3804a188a14a9536a2968f77c`（`git status --porcelain` 仅 `?? .planning/2026-09-10-workflowhub-postmortem/`）
> decision_revision：`sha256:9c5c45a2c06ff5cb01809a2712064577e84f69ef1e46ca2be97be262220bae68`（1,979 行 / 239,459 B / 30 D / 30 OI）
> 本次核查为**只读**：未修改、未创建仓库内任何文件（全部 `read`/`grep`/`wc`/`find`/`node -e`）。

---

#### C0 · 基线口径（M1–M5 写死 + 历史基线 + 不可证伪标 unknown）

- **批次**：⓪
- **交付组**：任务Ⅰ（合并列车第 1 位，首发）
- **结果与 consumer**：`specs/workflowhub-mechanism-simplification-20260910/prd.md` 的「共享定义」节内出现一张 M1–M5 口径表，每行含：指标名 / 分子（含可执行命令）/ 分母（含可执行命令）/ 单位 / 基线值 / 可得性（能算|部分能算|不能算）/ 不可证伪标记。consumer：C8 的双证验收（逐项对照本表）；C1–C7 每批验收引用同一口径；C7 用它统一父材料里 6,485 与 6,806 两个值。
- **范围**：**做**：写死 M1–M5 分子/分母；在 HEAD 实测并写死 M5 五项基线；用已有历史 store 采 M1/M3/M4 基线；把 M2 与 token 维度如实标 `unknown` 并写明缺什么；记录基线 HEAD OID。**不做**：不删任何文件；不新跑任何真实任务（用户明确否掉，L134「我不想用真实任务采一份基线」）；不新增仪器/脚本/schema（L1311「**不新增仪器**」）。
- **流程/状态**：改前——M1–M5 只有指标名与零散样本值，分子/分母**未写死**（L1302「基线口径须在批次 0 先写死」；L1320「unresolved_items/owner: 批次 0 口径定义（owner：任务Ⅰ）」）。改后——`prd.md` 有一张可复算表，任何第三方按表中命令得到同一数字。谁写：任务Ⅰ 主会话。谁读：C8 独立复核者、C1–C7 每批验收者。读不到会怎样：验收无共同分母 → M1–M5「逐项净减」不可判（RK-3，L1736）。
- **FR**：
  - `C0-FR-1`（来自 **R-003**，L14；**D-015** L1304–L1311）：写死 M1–M5 分子/分母。
  - `C0-FR-2`（来自 **D-029⑧** L1658）：不可证伪项以 `unknown` 登记，**不写成延期登记表**。
  - `C0-FR-3`（来自 **RK-7** L1740 / **G-5**）：基线须记录 HEAD OID 以防并发漂移。
  - `C0-FR-4`（来自 **D-015 修订** L1311）：token 维度标 `unknown`，R-003 的 >50% 永久标**推算**。
- **AC**：
  - AC-1 M1–M5 五行齐备且每行有分子与分母。**失败判据**：任一行缺分子或缺分母，或分子/分母写成自然语言而非可执行命令。
  - AC-2 M5 **五项**各有一个 HEAD 实测数字，**且每项都带一条可复算命令与写死的口径**（第 4 项 `validate`/`assert`/`check` 函数数、第 5 项错误码数按**裁定 J-9** 的书面定义：229 / 16）。**失败判据**：出现未经 `wc -l`/`grep -c` 实测的数字；或第 4/5 项只有数字而无命令与口径；或沿用父材料旧值（如 6,485、288、1,412、97、47）而未标注为「父材料旧值 / 不可复现」。
  - AC-3 M2 与 token 维度标 `unknown` 且写明缺什么。**失败判据**：给 M2 编一个分子/分母，或把 token 标为「可算」。
  - AC-4 口径表记录基线 HEAD OID。**失败判据**：无 OID，或 OID ≠ 该批开工时 `git rev-parse HEAD`。
  - AC-5 **零删除、零新跑任务**。**失败判据**：本批 `git diff --stat` 出现任何非 `prd.md` 的改动，或执行证据里出现真实任务 run。
- **oracle**：
  - M5 五项在 HEAD 复算（期望值下方「实测记录」节已给）：`wc -l runtime/stage/stage-content-contracts.mjs` → **6806**；`ls runtime/schemas/*.json | wc -l` → **35**；`grep -rho 'throw new' runtime/ | wc -l` → **1476**；`grep -rhoE '(^|[[:space:]])(export[[:space:]]+)?(async[[:space:]]+)?function[[:space:]]+(validate|assert|check)[A-Za-z0-9_]*' --include='*.mjs' runtime/ | wc -l` → **229**（`validate`/`assert`/`check` 函数声明数；含箭头函数常量的第二口径 = 229 + 36 = **265**，两口径**分别写死不得混用**）；`grep -oE 'class_id: "[a-z0-9_]+"' runtime/stage/protocol-error-whitelist.mjs | sort -u | wc -l` → **16**（**错误码数的书面定义** = 协议错误分类数，口径见**裁定 J-9**）。exit 0。**五项各有唯一命令与唯一期望值**；第 4/5 项此前只有父材料旧值（288/301、97/117）而无可复算命令，**本卡按 J-9 补齐并实测**。**这些数字是本卡按写死的口径复算的结果**；**不得**把本 PRD 或母材料里出现过的同名数字当基线（见 X18：同一指标随范围漂移）。
  - M5 的可证伪反例（**必须同批给**）：把第 4/5 项的口径换成任一其它口径（如 361/382、122），期望值必须随之改变 —— 若换了口径而数字不变，说明该 oracle 是恒真的，按 F9 判不通过。
  - M3：`find /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks -maxdepth 3 -name facts.jsonl | wc -l` → **49**；`-name index.json` → **49**；`-name task.json` → **116**；`-type d -name stage-outcomes` → **29**。exit 0。
  - 独立复算：另一会话按表中命令得到逐字相同的数字。**失败判据**：任一数字对不上。
- **7. 准备依赖**：无（本卡即起点）。
- **8. 实现依赖**：无（纯只读测量 + 写 `prd.md`，不依赖任何代码改动）。
- **9. 验收依赖**：无（本卡自身即验收工具；C8 是它的下游消费者而非前置）。
- **10. 合并依赖**：任务Ⅰ 首发，**必须先于 C1 合入**。合并动作 = `prd.md` 的共享定义节落盘并 commit。
- **11. 共享资源冲突与集成责任**：冲突文件 = `specs/.../prd.md`（唯一内容 writer 是 `spec-prd`，按地图 L6）。**集成责任 = 任务Ⅰ 主会话**。与 C7 冲突点：C7 要「统一父材料中的该数字」，C0 只提供唯一值，**由 C7 负责回改父材料**；C0 不改 `decision-log.md`（母材料只读）。
- **12. 来源/设计**：**D-015** L1299–L1321（M1 L1304 / M2 L1305 / M3 L1306 / M4 L1307 / M5 L1310 / token L1311 / 可用历史数据 L1315）；**D-029⑧** L1658；**RK-3** L1736；**RK-7** L1740；**G-5/G-6**；地图 §4.2 裁定 E（L221）。decision_revision `sha256:9c5c45a2c06ff5cb01809a2712064577e84f69ef1e46ca2be97be262220bae68`（1,979 行）。
- **13. 局部风险**：口径定义错 → 后续全部验收不可信（RK-3）。**具体翻车方式**：把 M1 的分子（正式测试秒 + broker review 墙钟）当成历史 store 里可查的量——实测历史 store 只有 `duration` facts（2,868 present），没有「正式测试累计秒」与「broker review 墙钟」这两个分量；照抄 L1304 的数字会被误当成「已从历史数据算出」。
- **14. 可后置技术项**：`none`（用户明确要求不要延期任务）。卡内先后顺序：先写死口径 → 再采基线 → 再标 `unknown`；三步串行，不可跳步，但都在本卡内完成。
- **15. 最小读取集**：
  - **必读**：`/Users/.../specs/workflowhub-mechanism-simplification-20260910/decision-log.md` L1299–L1321（M1–M5）、L799–L824（K1–K9）、L1730–L1740（RK-1~7）；`/tmp/wh-msd-build-prd/map-v1.md` §4.2 裁定 E。
  - **条件读**：`runtime/task/task-store.mjs`（只读 `FACT_KEYS:9` 与 `HISTORICAL_FACT_KEYS:14` 以理解历史行形状）；`runtime/stage/stage-content-contracts.mjs`（只需 `wc -l`，不必读内容）。
  - **正常不读**：`runtime/evidence/**`、`tools/cli/**`、`skills/wh-review/**`（本卡不碰）。
- **16. 五阶段开工说明**（可直接复制的文字）：
  > 本卡为 `workflowhub-mechanism-simplification-20260910` 的 **build-prd/manual 手工批次⓪**（非第六 stage；workflow `build-prd` v1.0.0，唯一内容 writer = `spec-prd`）。开工输入：①decision：`specs/workflowhub-mechanism-simplification-20260910/decision-log.md` 的 **D-015**（L1299–L1321）与 **D-029⑧**（L1658）；②spec：本 PRD 第 2 节「共享定义」的 K1–K9 与删除侧；③plan：本卡；④tasks：本卡 AC/oracle。开工前先 `git rev-parse HEAD` 记录 OID；只读测量，不删文件、不新跑任务。
- **17. 受影响测试清单与命令**：本卡**不改代码，无受影响测试**——**未找到，需新增**。⚠️ **与第 18 字段的相容写法（必须按此读）**：第 18 字段的「零新增」约束**优先**；本卡的测试载体**不新增文件**，改为把 M5 五项口径固化为**一条 `node -e` 断言命令**（写在口径表内），因此本卡**仍禁止跑 vitest**。若后续确需新增测试文件，须走 C7 的「控制面净增减申报」并计入净增减账 —— 不得在本卡内新增。**（原稿曾建议新增 `tests/contract/m1-m5-baseline-recompute.test.mjs`，该建议与第 18 字段互斥，**已作废，不作为本卡要求**。）
- **18. 控制面净增减申报**：**净增**。C0 只产出一张 `prd.md` 内的口径表，**零新增文件、零新增代码**；控制面行数净减 **0**。理由：D-015 L1311 明令「不新增仪器」。**目标净值 = 0（不得为正）**；若实现时新增了任何 `.mjs`/schema/脚本，即为违反 D-013 零新产物守卫，判不通过。

---

#### C1 · 与 `task-store.mjs` 无关的无 reader 叶子

- **批次**：①
- **交付组**：任务Ⅰ（第 2 位）
- **结果与 consumer**：与 `task-store.mjs` 无关、**且经 consumer 扫描确认无真实 consumer** 的一批具名叶子从仓库消失，且**没有任何验证因此变松**（每条删除附「无真实 consumer」证据；**裁定 H**：`stage-outcome-proofs/**`、`workflow-evolution.mjs`、protocol-error 白名单**经实测有真实 consumer，不在本卡删除面**）。consumer：C2/C3/C7（后续清理的起点）；M3 指标（每任务记录文件数 / 无 reader 比例，L1306）；`tools/cli/check-task-record-paths.mjs` 的 Authorization 表（同批收缩）。
- **范围**：**做**（逐条实测结论，见下「C1 五项实测结论」）：删「零生产 consumer」的对象 + **逐个给出 consumer 证据**。**不做**：不碰与 `task-store.mjs` 相关的东西（D-018① L1382 明文「与 `task-store.mjs` **无关的**」）；不删 `stage-outcome-proofs`（实测有活 reader，见下）；不删 `workflow-evolution.mjs`（实测 6 个生产 importer）；不删 protocol-error 白名单（实测有活生产调用点）；不动历史 store 字节（D-016②）。
- **流程/状态**：改前——仓库里存在一批「无生产 consumer」的对象（但**不是地图列的那批**，见实测）。改后——它们消失；`check-task-record-paths.mjs` 的 5 张表内对应条目同批删除，避免留下指向不存在文件的登记。谁写：任务Ⅰ 主会话。谁读：`check-task-record-paths.mjs`（守卫，每批读）。读不到会怎样：守卫对不存在文件返回 `[]`（L157-169），**不报错**——所以残留登记是卫生问题而非失败，**但 `npm run check` 在 HEAD 已红（10 条 FAIL），不能被本卡当成「新引入的红」**。
- **FR**：
  - `C1-FR-1`（**D-018①** L1382；**R-008「schema / writer / consumer」** L833/L835）：删除零生产 consumer 叶子。
  - `C1-FR-2`（**D-029⑯** L1666）：`stage-outcome-proofs` 与 `stage-outcomes/<stage>/*.json` **分类处理**，且 **D-029⑯ 对 proofs 的「内容无 reader」定性已被 X20 实测推翻**：proofs **有 3 处活生产引用**（`stage-agent-outcome-adapter.mjs:278` 写、`stage-runner.mjs:92-100` 读+校验+**读不到即 throw**、`canonical-evidence-validators.mjs:53` 形状校验）→ **本卡不删 proofs**；**它的终局已由裁定 J-4 定死 = 保留（归 K5，既不迁移也不删除，K2 行只记 `ref` + `sha256`）**；`stage-outcomes/<stage>/*.json` 归「必须**先迁移再删**」（迁移目标 = K2 行，属 C3）。
  - `C1-FR-3`（**D-020①** L1435）：每批同步改 CI 授权表，或把表改成按职责。
  - `C1-FR-4`（**D-011③ / 地图 §4.2**）：判据 = 「没有真实 consumer 就删」，不能只给「没人 import」。
- **AC**：
  - AC-1 每个被删对象附具名 consumer 扫描证据（命令 + 计数 + 命中文件清单）。**失败判据**：只写「没人 import」而无 `grep`/import 解析输出，或计数未实测。
  - AC-2 每个被删对象逐条 `test ! -e <path>` 为真。**失败判据**：任一被点名的对象仍存在。
  - AC-3 `K1–K9` 逐项比对通过，**K 清单优先**（地图 X13 L210）。**失败判据**：被删对象命中 K1–K9 任一条。
  - AC-4 `check-task-record-paths.mjs` 的失效登记同批清掉且**失败数不增加**。**失败判据**：本卡合入后 `node tools/cli/check-task-record-paths.mjs` 的 FAIL 行数 **> 10**（HEAD 基线 10）。
  - AC-5 `status` 对已有历史任务仍可读。**失败判据**：`node tools/cli/stage-runtime.mjs status` 对任一历史 task 抛错。
- **oracle**：`node tools/cli/check-task-record-paths.mjs; echo $?` → 期望 **≤ HEAD 基线的 10 条 FAIL**（**注意：HEAD 已是 exit 1，本卡不负责清零**）。逐条 `test ! -e` 期望 exit 0。**失败判据**：新出现 HEAD 没有的 FAIL 行。
- **7. 准备依赖**：C0 的口径表（M3 的「无 reader 比例」定义必须先写死，否则 AC-1 的「无 consumer」不可判）。具体文件：`prd.md` 共享定义节。
- **8. 实现依赖**：无（纯删除 + 守卫表同步）。
- **9. 验收依赖**：C0 的 M3 口径。
- **10. 合并依赖**：依赖 **C0 合入**；本卡为任务Ⅰ 第 2 位。合并动作 = 删除 commit + 守卫表同步 commit（同一 commit，D-018① 的「每批必须同步改」）。
- **11. 共享资源冲突与集成责任**：冲突资源 = `tools/cli/check-task-record-paths.mjs`（C1 改表、C2 改表、C3 删 `task-index.mjs` 登记）。**集成责任 = C1**（D-018① 首个动表者，把「按路径」改成「按职责」的骨架由 C1 建立，C2/C3 只增量维护）。若 C1 不改骨架而 C2 才改，则责任移交 C2，**但必须显式登记**（当前地图 L85 已按此分工：C2 的准备依赖写「C1 的守卫表改法已在 C1 建立」）。
- **12. 来源/设计**：**D-018①** L1382；**D-029⑯** L1666；**D-020①** L1435（**原文写「两张按文件路径硬编码的授权表」**）；**D-016②** L1335；**K1–K9** L807–L820 + 「明确不留」L824；**R-008** L832–L845。地图 C1 卡（L71–L79）。
- **13. 局部风险**：**三处具体翻车点**（全部实测）：① 照抄地图清单删 `stage-outcome-proofs` → **直接破坏 stage outcome 发布链**（`stage-runner.mjs:92-100` 读不到就 throw）；② 照抄删 `workflow-evolution.mjs` → 6 个生产 importer 断链；③ 照抄删 protocol-error 白名单 → `stage-runner.mjs:943,2500` 断链。
- **14. 可后置技术项**：`none`。卡内先后顺序：先做 consumer 扫描（AC-1）→ 再比对 K1–K9（AC-3）→ 再删除 → 最后同步守卫表。**顺序不可倒**（先删再扫 = AC-1 证据不可复现）。
- **15. 最小读取集**：
  - **必读**：`tools/cli/check-task-record-paths.mjs`（324 行，全读——5 张表的行号与条目是本卡硬依赖）；`/tmp/wh-msd-build-prd/map-v1.md` C1 卡 + §4.2 裁定 B；`decision-log.md` L1382、L1435、L1666、L807–L824。
  - **条件读**：`runtime/stage/stage-runner.mjs:85-100` 与 `runtime/stage/stage-agent-outcome-adapter.mjs:270-290`（仅在决定是否动 `stage-outcome-proofs` 时必读，**本卡结论是不动**）；`runtime/evidence/quality-store.mjs:238-250`（仅在动 `publishVerifySummary` 时读）。
  - **正常不读**：`runtime/stage/stage-content-contracts.mjs`（6,806 行，属 C2/C5）；`skills/wh-review/**`（属 C4）。
- **16. 五阶段开工说明**（可直接复制的文字）：
  > 本卡 = `workflowhub-mechanism-simplification-20260910` 的 **build-prd 批次①**（后续标准开发任务Ⅰ 的第 1 个执行批次）。开工输入：①decision：`decision-log.md` **D-018①**（L1382，删除清单）、**D-029⑯**（L1666，两类对象区分）、**D-020①**（L1435，CI 守卫表）、**D-016②**（L1335，历史字节不删）；②spec：本 PRD 第 2 节 K1–K9 保留侧 + 删除侧；③plan：本卡「范围」「流程/状态」；④tasks：本卡 AC/oracle。**开工第一条命令**：`node tools/cli/check-task-record-paths.mjs; echo $?` 记录基线 FAIL 数（HEAD = 10，exit 1）。**任何删除前必须先跑 consumer 扫描并留证据**。
- **17. 受影响测试清单与命令**（全部 `test -e` 核实存在）：

  ```text
  npx vitest run tests/task-record-paths-check.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
  ```

  - `tests/task-record-paths-check.test.mjs` — **已存在**。⚠️ 注意：其 L43-47「passes the migrated repository contract」断言 `status===0` 但 **HEAD 实测 status=1** → 该用例**开工时已是 RED**。C1 **不得**把它当成本卡引入的失败；也**不得**为让它绿而放宽断言。
  - ~~`core/__tests__/task-index.test.mjs`~~ — **已从本卡移出**（**独立复核 finding：它唯一 import 的 `runtime/task/task-index.mjs` 按裁定 B 归 C3 删除，本卡不删它、也就不会被它影响**）→ 该用例归 **C3** 的 §17 清单（C3 清单内已列），**C1 不跑它**。C1 仍须同批删掉 `tests/task-record-paths-check.test.mjs:121` 里指向 `runtime/task/task-index.mjs` 的 `it.each` 参数项（该用例自建 fixture，不依赖真实文件，故不会变红）。
  - 若 C1 决定动 `runtime/evidence/**` 的模块，追加该模块的具名测试（**当前未被 `test -e` 核实为受影响，故不列**）。
  - **禁止**：`npm test`、`npm run test:safe`、无范围 `vitest`。
- **18. 控制面净增减申报**（逐文件 `wc -l` 实测 + 预计）：

  | 文件 | 当前实测 | 删除/合并后预计 | 净值 |
  |---|---|---|---|
  | `tools/cli/check-task-record-paths.mjs` | **324** | 300（删失效登记；若改「按职责」约 280） | −24 ~ −44 |
  | `runtime/schemas/*.json`（未引用者） | 35 个文件 | 见下「C1 五项实测结论」——**实测仅 12 个零 code 引用** | 待定，**不可编数** |
  | `runtime/evidence/receipt-schema.mjs` | 实测存在（`wc -l` 未单独测） | 0（整文件删） | `unknown`（用户未要求逐个 `wc -l`；**不编数**） |
  | `runtime/evidence/journal-schema.mjs` | 同上 | 0（唯一 importer 是 `receipt-schema`） | `unknown` |

  **无法合理估计的一律标 `unknown`**，不编数字。**唯一确定净减项**：`check-task-record-paths.mjs` 的失效登记（−24 ~ −44 行）。

##### C1 五项实测结论（覆盖地图的具名清单）

**(a) `tools/cli/check-task-record-paths.mjs` 授权表 —— 实测 5 张表 + 2 个内联 Set，不是 2 张**

| # | 表 | 行号 | 类型 | 条目数 | 覆盖路径（要点） |
|---|---|---|---|---|---|
| 1 | `FIXTURE_ALLOWLIST` | **L35–L71** | `Set` | **35** 条目 / **33** 唯一（**重复 2 处**：`core/__tests__/runtime-mode.test.mjs` L38+L49、`skills/wh-review/scripts/__tests__/review-runner.test.mjs` L61+L63） | `tests/fixtures/task-path-legacy-input.json`、`core/__tests__/*.test.mjs`（20 个）、`scripts/__tests__/*`（2）、`skills/wh-review/scripts/__tests__/*`（11） |
| 2 | `CAPABILITY_AUTHORITIES` | **L75–L94** | `Map` | **16** | `runtime/evidence/storage-root.mjs`、`runtime/task/task-identity.mjs`、`runtime/task/task-handle.mjs`、`runtime/stage/stage-context.mjs`、`core/runtime-mode.mjs`、`runtime/evidence/write-boundary-preflight.mjs`、`runtime/evidence/invocation-identity.mjs`、`runtime/stage/step-manifest.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-reflect.mjs`、`tools/cli/append-lesson-observation.mjs`、`tools/cli/validate-stage-reflection.mjs`、`tools/cli/derive-consumption-edges.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs`、**`runtime/evidence/workflow-evolution.mjs`（L93）** |
| 3 | `DIRECT_WRITER_AUTHORITIES` | **L99–L134** | `Map` | **33** | `runtime/task/task-handle.mjs`、`runtime/task/material-workspace.mjs`、`runtime/task/task-store.mjs`、**`runtime/evidence/quality-store.mjs`（L104）**、`core/artifact-dir.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、**`runtime/evidence/workflow-evolution.mjs`（L107）**、`runtime/stage/stage-reflect.mjs`、…、`workflows/_spike/*.mjs`（3） |
| 4 | `GLOBAL_IDENTITY_DISCOVERY_ALLOWLIST` | **L136–L143** | `Map` | **6** | `runtime/evidence/storage-root.mjs`、`runtime/stage/step-manifest.mjs`、`tools/cli/check-task-record-paths.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs`、`runtime/stage/stage-runner.mjs` |
| 5 | `FORBIDDEN_PATTERNS` | **L145–L155** | `Array` | **9** 条正则 | legacy task-dir parser、legacy task-record resolver、`WORKFLOWHUB_TASK_TRACKING_ROOT`、`WORKFLOWHUB_TASK_DIR`、`task_tracking_root`、`worktree.json`、`process.cwd()`、`git remote`、`storageRoot\|taskPath` |
| 6 | `checkUniqueTaskPathDerivation` 内联 `allowed` | **L238** | `Set` | **2** | `runtime/task/task-identity.mjs`、**`runtime/evidence/workflow-evolution.mjs`** |
| 7 | `checkUniqueSpecsPathDerivation` 内联 `allowed` | **L258–L263** | `Set` | **4** | `core/artifact-dir.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/task/task-kernel-implementation.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs` |

##### (b) 「删 C1 清单里的任一文件，守卫会不会失败？」→ 不会。具体行号证据

- `walk()` **L157–L169**：首行 `if (!existsSync(path)) return output;` → 不存在的路径**不进入扫描集**。
- `checkRuntimeContracts()` **L223** `for (const file of runtimeFiles())` —— 只遍历 `walk()` 返回的**已存在**文件。
- `checkGlobalDirectWriters()` **L279** / `checkGlobalIdentityDiscovery()` **L300** / `checkUnique*PathDerivation()` **L241,L265** —— 同样只遍历存在的文件。
- 表查询是 `DIRECT_WRITER_AUTHORITIES.has(rel)`（**L283**）/ `FIXTURE_ALLOWLIST.has(rel)`（**L225,L243,L281,L302**）/ `CAPABILITY_AUTHORITIES.get(rel)`（**L228**）—— **只在文件存在时才被查询**。
- 结论：删除 `workflow-evolution.mjs` 或 `quality-store.mjs` 会在 **L93 / L107 / L238 / L104** 留下**失效登记（stale entry）**，守卫**照常通过**。
- `tests/task-record-paths-check.test.mjs`：**L26–L34** 的 `fixture()` 自建 `runtime/task/task-identity.mjs` 与 5 个 `workflows/<stage>/SKILL.md`；**L56–L66** 自建 `runtime/evidence/workflow-evolution.mjs`；**L123–L124** 自建 `core/source-manifest.mjs`、`runtime/evidence/requirement-ledger.mjs`、**`runtime/task/task-index.mjs`**。→ **删真实文件不破坏任何用例**。唯一跑真实仓库的是 **L43–L47**，而它**在 HEAD 已失败**（实测 exit 1）。
- ⚠️ **地图 L78「两张表」与「删任一文件守卫即红」两处均与实测不符**：表是 **5 张**；删除**不会**致红。

**(c) 「14 个零引用 schema」→ 实测：总计零引用 = 0 个；零 **代码**引用 = 12 个（共 35 个 schema）**

- 核查方法：`grep -rl --include=*.mjs --include=*.js --include=*.ts -F "<basename>" core runtime tools skills scripts workflows metrics tests | wc -l`
- **零代码引用（12 个具名）**：`audit-summary.schema.json`、`human-confirmation.v1.schema.json`、`quality-verify.v1.json`、`requirement-ledger.schema.json`、`requirements-coverage.schema.json`、`review-bundle.schema.json`、`risk-acceptance.v1.json`、`skill-catalog.schema.json`、`source-manifest.schema.json`、`steps.schema.json`、`task-fact.v1.json`、`task-index.v1.json`。
- **但这 12 个在 `specs/archive/**`、`docs/architecture/move-map.json`、`.omc/project-memory.json` 中仍有引用**（最少 2 处，如 `quality-verify.v1.json`）→ 严格意义的「零引用」**一个都没有**。
- 最小代码引用数：`quality-verify.v1.json` **2**（且**全在归档 spec**，属最接近「零」的一个）。
- 父材料 L885 声称「零引用 schema **14 个**」→ **HEAD 实测 12（代码口径）/ 0（全口径），无法复现 14**。
- 附带：`ls runtime/schemas/*.json | wc -l` = **35**；父材料 L1310/L885 写 schema 文件数 **47 → 45** → **HEAD 实测 35**，两个值都对不上。

**(d) 「`runtime/evidence/` 8 个零 importer 死模块」→ 实测 2 个零 importer；零**生产**consumer 共 7 个**

- 核查方法：import 说明符解析（`import`/`export from`/动态 `import()`/`require()`）→ 解析为绝对路径 → 统计 importer 集合。
- **零 importer（2 个）**：`receipt-schema.mjs`（0）、`journal-schema.mjs`（唯一 importer 是 `receipt-schema.mjs`，**传递性死**）。
- **仅测试引用、零生产 importer（5 个）**：`audit-summary-carrier.mjs` ←`tests/helpers/read-only-runner-fixture.mjs`；`boundary-confirm.mjs` ←`tests/boundary-confirm.test.mjs`；`capability-doctor.mjs` ←`core/__tests__/capability-doctor.test.mjs`；`requirement-ledger.mjs` ←`tests/requirement-lineage.test.mjs`；`text-utils.mjs` ←`tests/build-code-target.test.mjs`。
- **合计 7 个「无生产 consumer」**，非 8。**无法复现父材料的 8。**
- 反例（**不可删**）：`runner-identity.mjs` 有 1 importer = `runtime/evidence/invocation-identity.mjs`（后者 5 个 importer）→ **活**。

**(e) 「34 个死导出」→ 实测 `runtime/evidence/` 41 个、全仓 129 个**

- 核查方法：正则抽取 `export function|const|let|class|{...}` 的导出名 → 在**除定义文件外的所有** `.mjs/.js/.cjs/.ts`（含 tests）中做词边界搜索；零命中即死。
- **`runtime/evidence/**` 实测 41 个**（父材料 34，**无法复现**）：`audit-summary-carrier.mjs` 5、`receipt-schema.mjs` 5、`journal-schema.mjs` 5、`research-report.mjs` 5、`canonical-receipt-writer.mjs` 3、`check-skill-closure.mjs` 3、`dsh-transcript.mjs` 3、`canonical-evidence-validators.mjs` 2、`requirement-ledger.mjs` 2、`canonical-source.mjs` 1、`freshness.mjs` 1、`host-session-transcript.mjs` 1、`quality-fact.mjs` 1、`runner-identity.mjs` 1、`stage-completion-facts.mjs` 1、`storage-root.mjs` 1、`write-boundary-preflight.mjs` 1。
- **全仓实测 129 个**。`runtime/stage/stage-content-contracts.mjs` 导出 **78** 个，其中死导出 **20**（父材料 L905 Z1 写「7 个死导出」→ **无法复现**）。
- ⚠️ 该方法会**高估**（不识别 re-export 与动态访问），实现时须逐个复核，**不得直接照单删**。

**(f) 「16 个零调用者工具」→ 实测 `tools/cli/` 共 28 个 `.mjs`；零 importer 15 个；其中 3 个在 `package.json` → 12 个「零 importer 且未被 package.json 调用」**

- 零 importer（15）：`check-anti-host.mjs`、`check-contract.mjs`、`check-extensibility.mjs`、`check-metrics-schema.mjs`、`check-skill-updates.mjs`、`check-task-record-paths.mjs`、`generate-iteration-brief.mjs`、`noop.mjs`、`record-evolution-result.mjs`、`repo-skills-manifest.mjs`、`run-checks.mjs`、`source-manifest.mjs`、`task-close.mjs`、`validate-field-mapping.mjs`、`verify-structure.mjs`。
- 其中 `run-checks.mjs`/`smoke-local-skill-dispatch.mjs`/`verify-structure.mjs` 在 `package.json` scripts 中；`check-anti-host`/`check-extensibility`/`check-contract`/`check-metrics-schema`/`check-stage-quality`/`check-task-record-paths`/`check-decision-log-chain` 由 `tools/cli/run-checks.mjs` **按名字 `spawnSync`**（`resolve(here, \`${checkerName}.mjs\`)`）→ **不是零调用者**。
- **真正零调用者候选 = 12 个**：`check-skill-updates.mjs`、`generate-iteration-brief.mjs`、`noop.mjs`（`config/workflowhub.yaml` 有引用）、`record-evolution-result.mjs`、`repo-skills-manifest.mjs`、`source-manifest.mjs`、`task-close.mjs`（`CONSTITUTION.md`/`repo-skills.manifest.json` 有引用）、`validate-field-mapping.mjs`、`build-reflection-page.mjs`（唯一 importer 是 `tests/fixtures/workflow-evolution/setup-browser-fixture.mjs`，prod=0）、`check-decision-log-chain.mjs`、`check-stage-quality.mjs`、`import-historical-reflection.mjs`。**父材料 16 无法复现。**
- ⚠️ `task-close.mjs` 被 `CONSTITUTION.md` 与 `repo-skills.manifest.json` 具名 → 删它触及宪法文档，须先核 K 清单。

**(g) 「`workflows/verify-code/*.mjs` 4 个未 import 文件」→ 实测 0 个**

- `workflows/verify-code/` 的 5 个非测试 `.mjs` **全部有 ≥1 importer**：`capture.mjs`（3，prod=1 ←`tools/cli/stage-runtime.mjs`）、`design-alignment.mjs`（4，prod=0）、`facts-assembly.mjs`（1，prod=0）、`freshness.mjs`（2，prod=1 ←`workflows/verify-code/phase-1-contract.test.mjs`）、`metrics-writer.mjs`（1，prod=0）。
- **按 importer 计：0 个未 import**；按 **生产** importer 计：3 个（`design-alignment`、`facts-assembly`、`metrics-writer`）。**父材料的「4 个」两种口径都无法复现。**

**(h) 「`quality-store.mjs:238` 那个零调用者函数」→ 实测 L238 = `export function publishVerifySummary(taskRoot, summary, options = {})`；零**生产**调用者，4 个测试文件调用**

- 生产侧命中 `stage-runtime.mjs:961 context.kernel.publishVerifySummary(...)` 与 `task-kernel-implementation.mjs:742 publishVerifySummary(summary, options)` —— **两者是 kernel 方法，不是 L238 的导出**。
- L238 的导出实际调用者全在测试：`tests/contract/verify-publication.test.mjs:11,34,42`、`tests/integration/minimal-task-storage.test.mjs:8,140`、`tests/integration/vnext-delivery-close.test.mjs:13,113`、`tests/verify-code-facts.test.mjs:8,98,101`。
- 修正口径：**「零生产调用者」成立；「零调用者」不成立**。删它须同批处置 4 个测试文件。

**(i) 「`stage-outcome-proofs/**`」→ 实测：仓库内不存在该路径；但它是**活的生产证据链**

- 仓库 `find . -path "*stage-outcome-proofs*"` → **0 命中**（它不是仓库文件，是 task-store 内的产物路径）。
- **3 处活生产引用**：`runtime/stage/stage-agent-outcome-adapter.mjs:278`（**写**：`const ref = \`quality/evidence/stage-outcome-proofs/${digest}.json\`; kernel.publishCanonicalRecord(ref, raw)`）；`runtime/stage/stage-runner.mjs:92-100`（**读**：正则匹配 →`ctx.task.readRecord(ref)` → `validateStageOutcomeProof`，**任一步失败即`throw outcomeError`**）；`runtime/evidence/canonical-evidence-validators.mjs:53`（ref 形状校验）。
- 历史 store 内 **29 个任务目录**含 `stage-outcome-proofs/`，共 **20,149 个 `.json`**（复测值；**该目录是活目录，会随并发写入漂移（G-5），C8 不得拿它当固定验收数**）。
- **D-018①（L1382）与 K「明确不留」（L824）都把它列为删除目标**；**D-029⑯（L1666）却明确写「`stage-outcome-proofs`（内容无 reader）**删**」** —— D-029⑯ 对它的定性**与实测矛盾**。
- **本卡结论：`stage-outcome-proofs` 不能作为「与 `task-store.mjs` 无关的无 reader 叶子」在批次①删除**。它是活的生产证据链 ⇒ **裁定 J-4 定死为：保留，归 K5**（K2 行只记 `ref` + `sha256`，不复制内容）；这与 `stage-outcomes/<stage>/*.json`（先迁移到 K2 行再删，属 C3）**是两件不同的事**（粒度不同：per-step 证据 vs stage 级 outcome）。**这是一条需要裁定的新矛盾（记为 X20），已由裁定 J-4 结案。**

**(j) 「`workflow-evolution.mjs`」→ 实测 1,448 行（与父材料 L885 一致）、**11 个 importer，其中 6 个生产**

- 生产 importer：`runtime/stage/stage-reflect.mjs`、`tools/cli/append-lesson-observation.mjs`、`tools/cli/build-reflection-page.mjs`、`tools/cli/derive-consumption-edges.mjs`、`tools/cli/generate-iteration-brief.mjs`、`tools/cli/record-evolution-result.mjs`。测试 importer 5 个。
- 同时被守卫 3 张表登记：`CAPABILITY_AUTHORITIES` **L93**、`DIRECT_WRITER_AUTHORITIES` **L107**、`checkUniqueTaskPathDerivation` allowed **L238**。
- 与 F-071（`workflowhub-research-handoff-hardening-20260909/decision-log.md:198`）「零实例的声明型对象：… workflow-evolution 全套」一致（零**实例**），但**有活代码消费者**。**不能按「无 reader 叶子」删。**

**(k) 「protocol-error 白名单与自动重发组」→ 实测：白名单有**活生产消费者**；「自动重发组」未找到**

- `runtime/stage/protocol-error-whitelist.mjs` **216 行 / 18 个 `class_id`**（与父材料 L885 一致）。
- 生产 importer：`runtime/stage/stage-runner.mjs:25`；生产调用点 **2 处**：`stage-runner.mjs:943`、`stage-runner.mjs:2500`（`classifyProtocolError(error, { stage, surface: "stage" })`）。
- **「自动重发组」**：`grep -rn "autoResend|AUTO_RESEND|auto_resend|resend" --include=*.mjs core runtime tools skills scripts workflows` → **0 命中**。父材料 L885 称「自动重发块在 `stage-runner.mjs:2498-2507`」——该行段实测紧邻 `classifyProtocolError` 调用（L2500），**是分类调用点而非自动重发实现**。**「自动重发组」这一对象在 HEAD 无法具名复现。**

---

#### C2 · 与 `task-store.mjs` 相关的死物 + 重复实现合并

- **批次**：②
- **交付组**：任务Ⅰ（第 3 位）
- **结果与 consumer**：同一个概念在仓库里只有一处定义；`facts.jsonl` 的历史行仍可读。consumer：C3（同文件 `task-store.mjs`）、C5、C7。
- **范围**：**做**：① 合并 4 类重复实现；② CI 授权表改成按职责而非按路径（承 C1）；③ **D-011①** spec-analyze 四 profile 合并为一套共享实现（**保留 build-code 的阶段特有检查，只合并实现不合并数据表**）；④ 处置 `facts.jsonl` 的 `monitoring-fact.v1` 分支——**但按实测它不能整删**（见局部风险）。**不做**：不改 `index.json` 读写点（属 C3）；不动 stage 特定检查的数据表。
- **流程/状态**：改前——同一语义有 N 处独立实现（N 见实测），任一处漂移即静默分叉。**已实测的真实漂移**：`STAGE_REFLECTION_REF` 5 处声明中有 **3 种不同正则**，其中 `stage-handoff.mjs:17` **排除了 `verify-code` 且强制要求 sha 目录段**，其余 3 处允许 `verify-code` 且 sha 段可选 → **同一个 ref 在不同模块得到不同判定**。改后——单一具名实现，调用点全部 import 它。谁写：任务Ⅰ 主会话。谁读：C3、C5、C7 与全部 stage handler。读不到会怎样：ESM 静态解析失败 → 立即崩（**必须原子步**，参见 m15-retirement tasks.md L67 的同类教训）。
- **FR**：
  - `C2-FR-1`（**D-018②** L1383）：合并 4 类重复实现。
  - `C2-FR-2`（**D-020①** L1435）：CI 授权表改按职责。
  - `C2-FR-3`（**D-011①** L1211；落点由地图 §4.2 裁定 D L220 指定）：spec-analyze 四 profile **合并实现、不合并数据表** —— 可执行内容 = ① 四 profile 的**校验入口收敛为唯一一个** `validateStageSpecAnalyzeProfile`（`stage-content-contracts.mjs:5477`），调用点只 import；② **数据表 `STAGE_SPEC_ANALYZE_PROFILES`（`:4979`）保持 4 条、各自独立**；③ **`build-code` 的阶段特有检查必须逐项保留**（`required_materials` 含 `implementation`；`required_evidence` = `["decision-log","spec","plan","tasks","implementation","tests","ac-trace"]`）。**oracle 见 §6 第 5 条**（可执行 `node -e` 断言，含负例）。
  - `C2-FR-4`（**D-016②** L1335）：历史字节不删——**本条为实测新增的硬约束**。
- **AC**：
  - AC-1 每类重复的 grep 计数从 N 收敛到 1。**失败判据**：任一类仍有 ≥2 处独立声明。
  - AC-2 合并后语义**不外扩**——特别是 `STAGE_REFLECTION_REF` 的 `verify-code` 与 sha 段。**可执行判据（两条，按裁定 J-8 改写，原判据「比原来任一版本更宽松」字面不可满足）**：① 合并后的唯一定义与 **裁定 J-8 第 1 条的正则逐字相同**；② 接受集**不得超出**生产者的两种真实输出形态（`<stage>.json` / `<stage>/<64hex>.json`，5 个正式 stage 含 `verify-code`）。**失败判据**：正则与 J-8 不逐字相同；或 §6 第 4 条的 6 个反例（大写 hex / 非 64 位 / 多余路径段 / `..` 穿越 / 非 stage 名 / 尾随杂质）中有任一被接受。
  - AC-6 **`C2-FR-3` 的四 profile 共享实现可判**：唯一校验入口存在且被四处调用点 import，且 `build-code` 的特有检查逐项保留。**失败判据**：出现第二个等价校验入口；或 `STAGE_SPEC_ANALYZE_PROFILES` 少于 4 条 / 被合并成 1 条；或 `build-code` 的 `required_evidence` 丢失 `tests`、`ac-trace`、`implementation` 中任一项（见 §6 第 5 条 oracle）。
  - AC-3 49 个历史 `facts.jsonl` 全部仍可读。**失败判据**：任一历史任务 `readTaskFacts` 抛 `historical monitoring fact is invalid` 或 `task fact contains unsupported fields`。
  - AC-4 `npm run check` **不劣化**。**失败判据**：FAIL 数 > 10（HEAD 基线 10；见 C1 AC-4）。
  - AC-5 针对性测试全绿。**失败判据**：清单内任一文件非 0 退出。
- **oracle**：
  - 该命令数的是**声明 + 调用点**，**不能收敛到 1**。**拆成两条**：① 声明数 `grep -rn "STAGE_REFLECTION_REF =" --include=*.mjs . | grep -v node_modules | wc -l` → 期望 **1**（当前 **5**，且实测是 **3 种不同正则**）；② 定义处以外**全部 import 自同一模块**（逐处核对 import 来源）。
  - **统一正则（裁定 J-8 定稿，禁止再自行选择）**：

    ```text
    /^quality\/stage-reflection\/(?:make-decision|build-spec|build-plan|build-code|verify-code)(?:\/[a-f0-9]{64})?\.json$/
    ```

    **恰好一条，落在 `runtime/evidence/canonical-evidence-validators.mjs:12` 这个唯一定义点，其余 4 处（`task-kernel-implementation.mjs:34`、`stage-handlers.mjs:181`、`stage-handoff.mjs:17`、`stage-runner.mjs:48`）改为 import。** 理由、被否选项与「相对 5 个旧版是放宽还是收紧」的逐项回答见 **裁定 J-8**（要点：`(B) 无 sha 段` 与 `(C) 无 verify-code + 强制 sha` 的接受集**无交集** ⇒ 「取最严的交集」= 让所有 ref 非法；因此取**与全部生产者真实输出相符的最小接受集** = (A)，即**允许 verify-code + sha 段可选**）。
  - **§6 第 4 条（合并后接受集的可执行断言，与 AC-2 配套）**：

    ```bash
    node --input-type=module -e '
      const RE=/^quality\/stage-reflection\/(?:make-decision|build-spec|build-plan|build-code|verify-code)(?:\/[a-f0-9]{64})?\.json$/;
      const ok=["quality/stage-reflection/build-code.json","quality/stage-reflection/verify-code.json",
        "quality/stage-reflection/build-code/"+"a".repeat(64)+".json","quality/stage-reflection/verify-code/"+"b".repeat(64)+".json",
        "quality/stage-reflection/make-decision.json","quality/stage-reflection/verify-code/"+"0".repeat(64)+".json"];
      const bad=["quality/stage-reflection/build-code/"+"A".repeat(64)+".json","quality/stage-reflection/build-code/"+"a".repeat(63)+".json",
        "quality/stage-reflection/build-code/x/y.json","quality/stage-reflection/../build-code.json",
        "quality/stage-reflection/build-prd.json","quality/stage-reflection/build-code.json.bak"];
      const f=ok.filter(s=>!RE.test(s)).concat(bad.filter(s=>RE.test(s)));
      if(f.length) throw new Error("accepting-set mismatch: "+f.join(","));
      console.log("ok 6/6 positive, 6/6 negative");'
    ```

  - **§6 第 5 条（`C2-FR-3` 四 profile 共享实现 + build-code 特有检查，与 AC-6 配套）**：

    ```bash
    node --input-type=module -e '
      const m=await import("./runtime/stage/stage-content-contracts.mjs");
      const p=m.STAGE_SPEC_ANALYZE_PROFILES;
      if(Object.keys(p).sort().join(",")!=="build-code,build-plan,build-spec,make-decision") throw new Error("profile data tables must stay 4 and separate");
      const bc=p["build-code"];
      if(!bc.required_materials.includes("implementation")) throw new Error("build-code specific material check lost");
      if(bc.required_evidence.join(",")!=="decision-log,spec,plan,tasks,implementation,tests,ac-trace") throw new Error("build-code specific evidence checks lost");
      if(typeof m.validateStageSpecAnalyzeProfile!=="function"||typeof m.validateSpecAnalyzeCompleteness!=="function") throw new Error("shared implementation entrypoint missing");
      console.log("ok: 1 shared implementation, 4 separate data tables, build-code specific checks intact");'
    ```

    **失败判据**：任一断言抛错（把四 profile 的数据表合并、或丢掉 `build-code` 特有检查即失败）。**共用实现侧的补充判据**：`grep -rn "STAGE_SPEC_ANALYZE_PROFILES" --include='*.mjs' runtime/ core/ tools/ skills/ | grep -v "stage-content-contracts.mjs"` → 只允许 **import 行 + 消费点**（当前 4 处：`stage-agent-outcome-adapter.mjs:12`（import）、`:441`、`:669`、`stage-runner.mjs:512`），**不得出现第二处 `Object.freeze({...})` 形态的定义**。
  - 同上，**不能收敛到 1**。**改为**：声明数 → 期望 **1**（当前 **2**，逐字相同）；定义处以外**必须全部 import 自同一定义**。
  - `grep -rn 'workflowhub-stage-outcomes.v1' --include=*.mjs core runtime tools skills workflows | wc -l` → 期望 **1**（当前 **9**（**宽松口径**：凡出现该字符串）/ **6**（**严格口径**：`schema_version !== "workflowhub-stage-outcomes.v1"`，即 stage-outcome 形状校验点）；**两个口径必须写清、不得混用**）。
  - `grep -rn '\^\[a-f0-9\]{64}\$' --include=*.mjs core runtime tools skills workflows metrics | wc -l` → 当前 **107（55 个文件）**；合并后应显著下降，**目标值 = C0 口径表写死的那个数**（不可编数）。
  - 历史可读性：`node -e` 遍历历史 store 的 49 个 `facts.jsonl` 调 `readTaskFacts` → 期望 0 抛错。
- **7. 准备依赖**：C1 的守卫表改法（具体：`tools/cli/check-task-record-paths.mjs` 的 5 张表骨架已在 C1 按职责重组）。
- **8. 实现依赖**：无。
- **9. 验收依赖**：C1 的守卫表（AC-4 依附它）。
- **10. 合并依赖**：依赖 **C1 合入**；任务Ⅰ 第 3 位；**与 C3 同文件 `task-store.mjs`，必须串行**（C2 先，C3 后）。
- **11. 共享资源冲突与集成责任**：冲突资源 = `runtime/task/task-store.mjs`（C2 与 C3）、`tools/cli/check-task-record-paths.mjs`（C1/C2/C3）、`runtime/stage/stage-handlers.mjs`（C2 与 C5）。**集成责任 = C2 对 `task-store.mjs` 的 `monitoring-fact.v1` 分支，C3 对 `index.json` 与字段表**；两卡必须在**同一串行链**上，C2 合入后 C3 才开工（地图 L85/L93 已如此规定）。守卫表增量的集成责任 = C2。`stage-handlers.mjs` 与 C5 的冲突由 **C5 负责集成**（C5 的具名清单含 8 文件闭包）。
- **12. 来源/设计**：**D-018②** L1383（本轮首次定义）；**D-020①** L1435；**D-011①** L1211；**D-011③**；**D-016②** L1335；**D-017** L1353–L1365（`facts.jsonl` 五要件登记）；**F-071**（`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-20260910/specs/archive/workflowhub-research-handoff-hardening-20260909/decision-log.md:198`）；**裁定 J-8**（`STAGE_REFLECTION_REF` 的统一正则定稿与「接受集 ⊆ 生产者真实输出形态」判据）；**裁定 J-9**（C0 的 M5 书面口径，本卡的 §18 引用同一口径）。地图 C2 卡 L80–L86；§4.2 裁定 D L220。
- **13. 局部风险**：**四处具体翻车点（全部实测）**：① **`monitoring-fact.v1` 分支整删 = 历史数据全断**（62,104 行历史数据依赖它；`validateFact` L290 用**精确键集相等**）；正确做法是**保留只读分类 + 只删「为已删对象服务的校验」**，即 m15-retirement 已走过的「下沉为 schema_version 字符串判断」路线（`specs/archive/m15-retirement/tasks.md:67`）。② `STAGE_REFLECTION_REF` 三版本语义不同，**合并时必须取「与生产者真实输出相符的最小接受集」而不是「5 个旧版的交集」**（后者为空集，会让所有 ref 非法）→ 目标正则已由**裁定 J-8** 定稿；放宽的两类（`verify-code`、无 sha 段的固定 ref）**都是生产者的真实输出**，不是语义外扩；对**大写 hex / 非 64 位 / 多余路径段 / `..` 穿越 / 非 stage 名 / 尾随杂质**这 6 类仍判非法（§6 第 4 条有可执行断言）。③ 合并常量改多处调用点 → 必须只跑受影响测试（`AGENTS.md` 硬规则）。④ 中间态 ESM 崩：不得先删模块后改 import（m15-retirement FND-302 同类）。
- **14. 可后置技术项**：`none`。卡内先后顺序：先合并 `CLOSE_PLAN_REF`（2 处、逐字相同、零风险）→ 再合并 stage-outcome 形状校验（6 处）→ 再合并 `STAGE_REFLECTION_REF`（5 处 → 1 处，**目标正则已由裁定 J-8 定稿，不再是「需先裁定」**）→ 最后动 `monitoring-fact.v1` 分支（风险最高）。**四步全在本卡内完成。**
- **15. 最小读取集**：
  - **必读**：`runtime/task/task-store.mjs`（334 行，全读——L9 `FACT_KEYS`、L14 `HISTORICAL_FACT_KEYS`、L147–L196 待处置段、L287–L294 `validateFact`、L296–L332 `appendTaskFact`）；`runtime/evidence/canonical-evidence-validators.mjs:12`、`runtime/task/task-kernel-implementation.mjs:34,36`、`runtime/stage/stage-handlers.mjs:181`、`runtime/stage/stage-handoff.mjs:17`、`runtime/stage/stage-runner.mjs:48`（5 处 `STAGE_REFLECTION_REF`）；`runtime/evidence/freshness.mjs:135`；`tools/cli/check-task-record-paths.mjs`。
  - **条件读**：`runtime/stage/stage-content-contracts.mjs:4662-4685`（D-011① 的四份同构 profile）；`/Users/.../specs/archive/m15-retirement/tasks.md:67,89,185`（`monitoring-fact.v1` 下沉的先例与教训）。
  - **正常不读**：`skills/wh-review/**`（C4）；`runtime/review/**`（C4）。
- **16. 五阶段开工说明**（可直接复制的文字）：
  > 本卡 = `workflowhub-mechanism-simplification-20260910` 的 **build-prd 批次②**（后续标准开发任务Ⅰ 的第 2 个执行批次）。开工输入：①decision：`decision-log.md` **D-018②**（L1383）、**D-020①**（L1435）、**D-011①**（L1211）、**D-016②**（L1335）、**D-017**（L1353–L1365）；②spec：本 PRD 第 2 节共享定义 + K2 行字段表；③plan：本卡「范围」「流程/状态」；④tasks：本卡 AC/oracle。**前置**：C1 已合入、守卫表骨架已按职责重组。**开工第一条命令**：`node tools/cli/check-task-record-paths.mjs; echo $?`（记录不劣化基线 = 10 条 FAIL）。**硬约束**：不得让 `facts.jsonl` 的历史行不可读（实测 62,104 行 `monitoring-fact.v1`）。
- **17. 受影响测试清单与命令**（全部 `test -e` 核实存在）：

  ```text
  npx vitest run tests/integration/task-fact-index-consistency.test.mjs tests/integration/minimal-task-storage.test.mjs tests/contract/protocol-error-trace.test.mjs tests/contract/protocol-error-classification.test.mjs tests/integration/protocol-error-in-place-resend.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-reflection-paths.test.mjs tests/stage-plan-task-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
  ```

  - 逐条存在性：`tests/integration/task-fact-index-consistency.test.mjs` ✅（import `readTaskFacts`）、`tests/integration/minimal-task-storage.test.mjs` ✅（L116 断言 `historical monitoring fact is invalid`——**本卡改 `monitoring-fact.v1` 分支时这条是主判据**）、`tests/contract/protocol-error-trace.test.mjs` ✅、`tests/contract/protocol-error-classification.test.mjs` ✅、`tests/integration/protocol-error-in-place-resend.test.mjs` ✅、`tests/contract/derive-consumption-edges.test.mjs` ✅、`tests/contract/stage-reflection-paths.test.mjs` ✅、`tests/stage-plan-task-contract.test.mjs` ✅。
  - **禁止**：`npm test`、`npm run test:safe`、无范围 `vitest`。
- **18. 控制面净增减申报**（逐文件 `wc -l` 实测）：

  | 文件 | 当前实测 | 合并后预计 | 净值 |
  |---|---|---|---|
  | `runtime/task/task-store.mjs` | **334** | **≤330**（`monitoring-fact.v1` 分支**只收窄不整删**，L147–L196 中的 24 行校验体可压到约 12 行的键集判断） | ≥ −4，**上限 −12** |
  | `runtime/stage/stage-content-contracts.mjs` | **6806** | **unknown**（D-011① 只合并实现不合并数据表；不实测不可估） | `unknown` |
  | `runtime/evidence/freshness.mjs` | **781**（HEAD 实测） | 删 `CLOSE_PLAN_REF` 1 行 + 改 1 处 import | `unknown`（删除量取决于 D-009 闭包拆分，不编数） |
  | 4 类重复声明合计 | `STAGE_REFLECTION_REF` **5** + `CLOSE_PLAN_REF` **2** + stage-outcome 校验 **6** + `^[a-f0-9]{64}$` **107（55 文件）** | 各收敛到 1 处定义 + 调用点 import | **未知但必为负**（107 处散落正则的收敛是本卡最大的净减来源，**具体值待实测，不编数**） |

  **唯一可承诺的确定性**：`task-store.mjs` 净减 **≥4 行**；其余标 `unknown` 或「必为负、值待实测」。

##### C2 四类重复的逐项实测（覆盖地图 L82 的具名清单）

| 类 | 地图声称 | **实测** | 具体位置 |
|---|---|---|---|
| `STAGE_REFLECTION_REF` | ×4 | **×5 声明，3 种不同正则** | `canonical-evidence-validators.mjs:12`（sha 段可选，含 verify-code）；`task-kernel-implementation.mjs:34`（**无 sha 段**，含 verify-code）；`stage-handlers.mjs:181`（sha 段可选，含 verify-code）；`stage-handoff.mjs:17`（**强制 sha 段**，**不含 verify-code**）；`stage-runner.mjs:48`（sha 段可选，含 verify-code） |
| `CLOSE_PLAN_REF` | ×2 | **×2，逐字相同** ✅ | `freshness.mjs:135`；`task-kernel-implementation.mjs:36` |
| stage-outcome 形状校验 | ×5 | **×6** | `freshness.mjs:416`；`workflow-evolution.mjs:65`；`task-kernel-implementation.mjs:265`；`stage-handoff.mjs:267`；`stage-runner.mjs:680`；`stage-runner.mjs:2604` |
| `/^[a-f0-9]{64}$/` | 48 处 | **107 处（55 个文件）** | `grep -rn '\^\[a-f0-9\]{64}\$' --include=*.mjs core runtime tools skills scripts workflows metrics \| grep -v node_modules \| wc -l` → **107**；宽松口径（任意 `a-f0-9]{64}` 字符类）→ **219** |
| CI 授权表 | 4 张 | **5 张表 + 2 个内联 Set**（见 C1 (a)） | `check-task-record-paths.mjs` L35/L75/L99/L136/L145 + L238/L258 |
| `monitoring-fact.v1` 零生产者分支 | `task-store.mjs:147-196` | **分支确认无生产者**（唯一出现是 `task-store.mjs:13` `HISTORICAL_FACT_SCHEMA = ["monitoring","fact.v1"].join("-")`）；**但 62,104 行历史数据是它** | `task-store.mjs:147`（`validateHistoricalMonitoringFact`）、`:180`（`parseFactRecords`）、`:185-193`（分类分支） |

---

#### C3 · 一个记录文件：删 `index.json` + 改 `facts.jsonl` 字段 + 给 reader（同文件同批）

- **批次**：③
- **交付组**：任务Ⅰ（第 4 位，末位）
- **结果与 consumer**：任务目录里只剩**一个**执行记录文件（`facts.jsonl`），且它**有真实生产 reader**。consumer：C4/C5/C6；`status` 根因行；Talk 轮次输入；close；下一个 stage。
- **范围**：**做**：① 删 `index.json`（**实测 5~6 写点 / 6 读点**，见 (2)）；② 改 `facts.jsonl` 字段表以承载 K2 行（D-005 四组字段 + **`record_kind` 两行型**，见 FR-2）；③ **给 `readTaskFacts` 一个真实生产 reader**（当前 **0**）；④ `stage-outcomes/<stage>/*.json` **先迁移后删**（D-029⑯）；⑤ **`runtime/task/task-index.mjs` 归本卡**（裁定 B）；⑥ D-011② stage-reflection 结论写入 K2 行 + D-011① 结论落点 K6；⑦ **`non_stage` 的 K2 行口径在本卡闭合**（`validateFact` 的 stage 判定面扩为 `STAGE_KEYS`，谓词遍历集合**不动** —— **裁定 J-2**）；⑧ **`identity/**` 折入 K2 后的收尾**：`identity/path-cards/**` 整类删除（连同 `persistWriteBoundaryPathCard` 的落盘分支与 `TaskHandle.createPathCardRecord`；该项在本卡**登记**、由 **C5** 执行 —— **裁定 J-3**）。**不做**：不改 `monitoring-fact.v1` 只读分类分支（属 C2，且已实测不可整删）；不动历史 store 字节；**不动 `stage-outcome-proofs/**`**（**裁定 J-4**：保留为 K5，不迁移、不删除 —— 它不是「阶段级 outcome」，K2 行只记它的 `ref` + `sha256`）。
- **流程/状态**：**改前**：每阶段完成写两处（`facts.jsonl` 追加一行 + `index.json` 全量重写）；`appendTaskFact`（`task-store.mjs:296-332`）在同一 `try` 内**顺序**写两文件（`:324` 写 facts，`:325` 写 index），失败则回滚 facts（`:327`）。`index.json` 的生产读者 = `quality-store.mjs:84,223,248`、`task-kernel-implementation.mjs:801,818`、`task-store.mjs:316` 的 `readTaskIndex` 调用，以及**通过 TaskHandle 的写权限门**（`task-handle.mjs:417` **拒绝** `index.json` 与 `quality/verify.json` 经 TaskHandle 写）。**改后**：只写 `facts.jsonl` 一行（含 D-005 四组字段）；`index.json` 写点 0、读点 0；`readTaskFacts` 被 `status`/close 真实调用。**谁写**：该 stage 主会话（经写口核对）。**谁读**：下一 stage、`status`、close。**读不到会怎样**：D-005 规定「缺字段则完成声明不成立（属缺项事实，不新增 gate）」（L1076）——**不阻断推进，但完成不成立**。
- **FR**：
  - `C3-FR-1`（**D-018③** L1384；**D-004**；**R-008「task-store / writer」** L834/L844）：删 `index.json` + 改字段 + 给 reader，**同文件同批**。
  - `C3-FR-2`（**D-005** L1076–L1077；**裁定 J-1 / J-2**）：K2 行固定写四组字段 = **审查五态**（`review_origin` ∈ {`conducted`,`unavailable`,`not_run`,`same_source_degraded`,`dispatched_uncollected`}，**恰好五个，第 5 值字面量名 = `dispatched_uncollected`**，见裁定 J-1） + `review_result_ref` + `actionable_finding_disposition`）+ **真实跑过的命令与退出码（含失败签名）** + **四层状态各一格** + 严重问题处置。**行型由 `record_kind` 区分，恰好两型**（裁定 J-2）：`stage`（每 stage 一行；含 `non_stage` 工作流一行）与 `close_action`（close 五个物理动作各一行，K8）。**行型 `stage` 必填上述四组；行型 `close_action` 必填 = 动作名 + 结果 + 具名 ref + 命令与退出码（不适用写 `null` + 理由）。**
  - `C3-FR-9`（**裁定 J-2**，来源 D-025② + `task-store.mjs:291` 实测）：**`non_stage` 的 K2 行口径在本卡内闭合** —— `validateFact` 的 `STAGES.has(value.stage)` 改为 `STAGE_KEYS.has(value.stage)`，`STAGE_KEYS = STAGES ∪ NON_STAGE_WORKFLOWS`（`NON_STAGE_WORKFLOWS = ["build-prd"]`，只登记已存在的非阶段工作流，**不新增第六 stage**）；**5 阶段完成谓词与 `status` 的 `stage_completion_missing:<stage> × 5` 仍只遍历 `STAGES`**。**不再「与 C6-FR-8 同批二选一」**：C6 只消费本口径（其改动面 = 把谓词遍历集合钉死为 `STAGES`）。
  - `C3-FR-10`（**裁定 J-3**）：`identity/**` 折入 K2 的收尾 = **`identity/path-cards/**` 整类删除**（写口每次写产生一张、**零生产 reader、零测试引用**，实测见裁定 J-3）；写口第三项「待写字节」的校验**保留且强度不变**，改为**内存内**同一次比对，不符仍抛同一句 `path card source hash is stale`。**执行归 C5**（本卡只登记口径与字段归属）。
  - `C3-FR-3`（**D-017** L1356）：`facts.jsonl` 五要件登记 = owner 该 stage 主会话 / consumer 下一 stage + status 根因行 + Talk 输入 / oracle 文件存在且当阶段行含 D-005 三态字段 / 失败语义缺字段则完成声明不成立 / 退出条件被经过审查的替代记录机制取代。
  - `C3-FR-4`（**D-011②** L1211，落点见地图 §4.2 裁定 D L220）：stage-reflection 结论写入 K2 行而非独立产物。
  - `C3-FR-5`（**D-011①** L1211）：spec-analyze 结论落点 = K6，写入 K2 同一行的 `spec_analyze` 字段。
  - `C3-FR-6`（**D-028④** L1628）：本卡必须同批含 `completion-predicates.mjs`（verify 谓词 + index 读点）、`stage-handoff.mjs:291-330`、**`task-index.mjs` 删除**。
  - `C3-FR-7`（**R-013 无关**；**D-028④ + 裁定 B**）：`task-index.mjs` 归本卡。
  - `C3-FR-8`（**R-015① + 裁定 I-3 / I-5**）：**K2 行的 RED/GREEN 证据字段形态 = 命令 + 退出码 + 失败签名**。**失败签名**是**简短、可复现的判据**（例：`<测试文件> :: <用例名> :: <断言 / 错误类>`，或一行 stderr 摘要），**不复制完整原始输出**；**原始输出按引用进 K5**（与 K9 一致：不新建测试记录对象）。**不得**为 RED/GREEN 每次生成完整长期证据包，**不得**按消费者重复同一份证据（同命令同输入只留一处引用；同输入不重复启动见批次⑨）。
- **AC**：
  - AC-1 `index.json` 写点 0、读点 0。**失败判据**：`grep -rn 'index\.json'` 在 `core runtime tools skills workflows` 仍有生产命中（当前生产命中见 (2)）。
  - AC-2 `readTaskFacts` 生产调用点 **≥1**。**失败判据**：仍为 0（当前实测 0）。
  - AC-3 `facts.jsonl` **每 stage 一行**（`record_kind:"stage"`，含 `non_stage` 工作流一行）**且含 D-005 四组字段**；close 的五个物理动作各一行（`record_kind:"close_action"`）且含动作名 + 结果 + 具名 ref。**失败判据**：同一 stage 出现两行；任一 `stage` 行缺四组之一；`not_run` 无理由 / 命令与退出码为空或套话（L1077 防套话要求）；或把 `close_action` 行与 `stage` 行混成同一行型（K8 要求五个动作**各**一行）。
  - AC-4 `stage-outcomes/<stage>/*.json` 的消费者已迁移。**失败判据**：迁移后仍有生产代码读该目录（当前读点见 (3)）而 K2 承接物不存在。**范围排除（裁定 J-4）**：`stage-outcome-proofs/**` **不在本 AC 的迁移面**——它保留为 K5，由 `stage-runner.mjs:92-100` 继续按 `ref` 读；本 AC **不得**把 proofs 计入「已迁移」或「应删除」。
  - AC-5 49 个历史任务在 `index.json` 删除后仍可 `status`。**失败判据**：任一历史任务 `status` 因缺 `index.json` 抛错。
  - AC-6 针对性测试全绿。**失败判据**：清单内任一文件非 0 退出。
  - **AC-7（新增·独立复核发现，必读）**：`FACT_KEYS` 扩键承载 K2 四组字段后，**历史已落盘的 task-fact 行仍可读**。实测依据：`validateFact`（`task-store.mjs:290`）用 `Object.keys(value).sort()` 与 `FACT_KEYS` **逐字相等**判定；历史 store 里 task-fact 行**恰好 10 键**（全仓 **19 行**，分布在 **16 个非空** `facts.jsonl`；其余 **33 个 `facts.jsonl` 是 0 字节**，不可能失败）。**失败判据**：扩键后任一历史行抛 `task fact contains unsupported fields`（`parseFactRecords:193` → `readTaskFacts` → 本卡 AC-2 新挂的 `status` reader）。**修法**：按形状分流（有 `schema_version` 走旧路），与 C2 处理 `monitoring-fact.v1` 同一手法。
  - **AC-8（新增·独立复核发现；**口径已由裁定 J-2 在任务Ⅰ 内闭合，不再悬空**）**：`validateFact`（`task-store.mjs:291`）要求 `STAGES.has(value.stage)`（5 个正式阶段），而 C6-FR-8 要求 `non_stage`（build-prd 类）按自己的口径收口。**裁定 J-2 已定死**：**`non_stage` 的 K2 行进 `facts.jsonl`**（`STAGE_KEYS = STAGES ∪ ["build-prd"]`），**且不进 5 阶段谓词**（谓词遍历集合仍为 `STAGES`）。**失败判据（可执行）**：① 用一个 `stage:"build-prd"` 的 K2 行写入 → 不得抛 `task fact identity or digest is invalid`；② 同一 store 的 `status` **不得**因该行产生 `stage_completion_missing:build-prd` 或把 5 阶段缺失数从 5 变成 6。**归属**：本 AC 在 **C3（任务Ⅰ）** 内闭合；**C6 不再参与二选一**，只把谓词遍历集合钉死为 `STAGES`（`C6-FR-8`/`C6-AC-9` 判据不变）。
- **oracle**：
  - `grep -rn 'index\.json' --include=*.mjs core runtime tools skills workflows | grep -v node_modules | wc -l` → 期望 **0**（当前生产命中 **12** 处字符串，其中 5~6 为 `task-store.mjs` 读写）。
  - `grep -rn 'readTaskFacts(' --include=*.mjs core runtime tools skills workflows | grep -v node_modules` → 期望 **≥1 个调用点**（当前仅 `task-store.mjs:270` 定义行）。
  - `test ! -e runtime/task/task-index.mjs` → exit 0（当前 30 行、存在）。
  - 历史可读：对历史 store 49 个任务跑 `status`，期望 0 抛错。
- **7. 准备依赖**：C2 合入（同文件 `task-store.mjs` 串行）。具体：C2 已收窄 `monitoring-fact.v1` 分支并留出字段表位置。
- **8. 实现依赖**：K2 字段表（本 PRD 共享定义给出——**由 C0 的口径表与 D-005 L1076–L1077 决定**）。
- **9. 验收依赖**：C0 的 M3 口径。
- **10. 合并依赖**：依赖 **C2 合入**；任务Ⅰ 末位；**必须先于 C5 合入**（跨批约束 C3 → C5，T-7#2，地图 L56）。
- **11. 共享资源冲突与集成责任**：冲突资源 = `runtime/task/task-store.mjs`（C2/C3）、`tools/cli/check-task-record-paths.mjs`（C1/C2/C3）、`runtime/stage/completion-predicates.mjs`（C3 与 C5 的 8 文件闭包）、`runtime/task/task-kernel-implementation.mjs`（C3 与 C5）。**集成责任 = C3** 对 `index.json` 删除与字段表；`completion-predicates.mjs` 与 `task-kernel-implementation.mjs` 的**读点改造由 C3 负责**，C5 只负责删哈希闭包（C5 负责其自身 8 文件闭包的集成，冲突时以 C3 先合入为准）。
- **12. 来源/设计**：**D-018③** L1384；**D-028④** L1628；**D-029⑯** L1666；**D-005** L1073–L1086；**D-017** L1353–L1365；**D-011①/②** L1211；**K2** L808 / **K6** L817 / **K7** L818 / **K8** L819（close 五动作行进 K2）；**D-016②** L1335；地图 §4.2 裁定 B（L218）与裁定 D（L220）；**裁定 G**（`review_origin` 是 K2 行字段 ≠ 对象）；**裁定 J-1**（五态定稿与第 5 值字面量名）、**裁定 J-2**（两行型 + `non_stage` 口径在本卡闭合）、**裁定 J-3**（`identity/path-cards/**` 删除的口径与强度不变的替代写法）、**裁定 J-4**（`stage-outcome-proofs` 保留为 K5，不列入本卡迁移面）。**D-018 修订（item 6, major）** L1392 明确「`index.json` **不是无 reader 叶子**」。**R-015① + 裁定 I-3 / I-5**（K2 行的 RED/GREEN 证据形态 = 命令 + 退出码 + 失败签名，原始输出按引用进 K5；R-015 是 **build-prd 阶段由用户追加**的需求，不是 make-decision 阶段的产物）。
- **13. 局部风险**：**五处具体翻车点（全部实测）**：① 删 `index.json` 而不同批改 `quality-store.mjs:84,223,248` → **verify 摘要与质量事实发布断链**；② 删 `index.json` 而不同批改 `task-kernel-implementation.mjs:801,818` → kernel 发布链断；③ 漏改 `task-handle.mjs:417` 的拒绝名单 → 删对象后该守卫指向不存在的路径；④ **字段变更会让 `status` 读数形状变化**（D-018 修订已登记为**基线漂移**）→ 必须在 C0 口径里写明该漂移，否则 C8 的 M1–M5 对照会把漂移误判为劣化；⑤ **（独立复核新增，最高优先）改 `facts.jsonl` 字段表会让 19 行已落盘历史 provenance 变不可读** —— 见 AC-7；这是「不删历史字节」之外的**等价破坏路径**（让字节读不出来），本卡是**唯一**改 `facts.jsonl` 的卡，必须认领；⑥ 删 `task-index.mjs` 后 `tests/task-record-paths-check.test.mjs:121` 的 `it.each` 仍以它为参数——**该用例自建 fixture 文件，不依赖真实文件，故不会红**（已实测确认），但**必须同批删除该参数项**，否则留下指向已删对象的测试意图。**⑦（裁定 J-2 的直接风险）`STAGE_KEYS` 扩面若被写成「把 `build-prd` 加进 `STAGES`」**，会让 build-prd 变成第六个正式 stage：5 阶段谓词与 `stage_completion_missing:<stage> × 5` 会随之变成 ×6，正面违反 D-025②「不新增第六 stage」与用户「不要再加东西」。**判据**：`STAGES` 的字面量集合必须**逐字不变**，扩的只能是 `STAGE_KEYS`；违反即判不通过（AC-8 的第 ② 条判据专门拦它）。
- **14. 可后置技术项**：`none`。卡内先后顺序：① 先给 `readTaskFacts` 落一个生产 reader（AC-2）→ ② 再改字段表承载 K2 四组（AC-3）→ ③ 再迁 `stage-outcomes` 消费者（AC-4）→ ④ 最后删 `index.json` 写点与读点（AC-1）→ ⑤ 同批删 `task-index.mjs` 与守卫表登记。**顺序不可倒**：先删 `index.json` 再找 reader = 中间态无法验证历史可读性。
- **15. 最小读取集**：
  - **必读**：`runtime/task/task-store.mjs`（334 行全读）；`runtime/task/task-index.mjs`（**30 行**，全读）；`runtime/evidence/quality-store.mjs`（读点 L84、L223、L233、L238、L248、L290）；`runtime/task/task-kernel-implementation.mjs`（L801、L810–L818、**L34–L37**）；`runtime/task/task-handle.mjs:417`；`runtime/stage/completion-predicates.mjs:1124–1132`；`runtime/stage/stage-handoff.mjs:291–330`；`tools/cli/verify-structure.mjs:14–17`；`tools/architecture/public-behavior-baseline.mjs:226,265`；`tools/cli/task-bootstrap.mjs:38,80`。
  - **条件读**：`runtime/stage/stage-runner.mjs:85–100`（仅在迁 `stage-outcomes` 读点时）；`runtime/stage/stage-reflect.mjs:229,311,817`（仅在迁 stage-reflection 读点时）。
  - **正常不读**：`skills/wh-review/**`；`runtime/review/**`；`runtime/stage/stage-content-contracts.mjs`。
- **16. 五阶段开工说明**（可直接复制的文字）：
  > 本卡 = `workflowhub-mechanism-simplification-20260910` 的 **build-prd 批次③**（后续标准开发任务Ⅰ 的第 3 个执行批次，任务Ⅰ 末位）。开工输入：①decision：`decision-log.md` **D-018③**（L1384）+ **D-018 修订 item 6**（L1392）、**D-028④**（L1628）、**D-029⑯**（L1666）、**D-005**（L1073–L1086）、**D-017**（L1353–L1365）、**D-011①/②**（L1211）；②spec：本 PRD 第 2 节的 K2 行字段表与共享定义；③plan：本卡「流程/状态」的改前/改后两态；④tasks：本卡 AC/oracle。**前置**：C2 已合入（同 `task-store.mjs`，串行）。**开工第一条命令**：`grep -rn 'index\.json' --include=*.mjs core runtime tools skills workflows | grep -v node_modules` 记录写点/读点基线。**跨批硬约束**：本卡必须先于 C5 合入（C3 → C5，T-7#2）。
- **17. 受影响测试清单与命令**（全部 `test -e` 核实存在）：

  ```text
  npx vitest run core/__tests__/task-index.test.mjs tests/integration/task-fact-index-consistency.test.mjs tests/integration/minimal-task-storage.test.mjs tests/contract/protocol-error-trace.test.mjs tests/contract/verify-publication.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/verify-code-facts.test.mjs tests/contract/status-derivation.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/execution-outcome.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-reflection-e2e-constructed.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/requirement-lineage.test.mjs tests/dsh-transcript.test.mjs tests/contract/research-report.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
  ```

  - 逐条存在性：`core/__tests__/task-index.test.mjs` ✅（**唯一 import `task-index.mjs` 的文件**，L7；删该模块必须同批处置）、`tests/integration/task-fact-index-consistency.test.mjs` ✅、`tests/integration/minimal-task-storage.test.mjs` ✅、`tests/contract/protocol-error-trace.test.mjs` ✅、`tests/contract/verify-publication.test.mjs` ✅（**唯一调用 `quality-store.mjs:238` 导出的测试**）、`tests/integration/vnext-delivery-close.test.mjs` ✅、`tests/verify-code-facts.test.mjs` ✅、`tests/contract/status-derivation.test.mjs` ✅、`tests/contract/stage-handoff.test.mjs` ✅、`tests/contract/execution-outcome.test.mjs` ✅、`tests/integration/vnext-official-stage-run.test.mjs` ✅、`tests/contract/stage-reflection-e2e-constructed.test.mjs` ✅、`tests/integration/verify-freshness-selection.test.mjs` ✅、`tests/requirement-lineage.test.mjs` ✅、`tests/dsh-transcript.test.mjs` ✅、`tests/contract/research-report.test.mjs` ✅。
  - **禁止**：`npm test`、`npm run test:safe`、无范围 `vitest`。
- **18. 控制面净增减申报**（逐文件 `wc -l` 实测）：

  | 文件 | 当前实测 | 删除/合并后预计 | 净值 |
  |---|---|---|---|
  | `runtime/task/task-index.mjs` | **30** | **0**（整文件删） | **−30** |
  | `runtime/task/task-store.mjs` | **334** | 约 **300–315**（删 `initialIndex` L114–130、`validateIndex` L229–239、`validateIndexRef` L214–227、`indexRef` L198–212、`readTaskIndex` L276–279、`replaceTaskIndex` L281–285 与 L316–325 的 index 写入；新增 K2 字段表约 +10） | **−19 ~ −34** |
  | `runtime/evidence/quality-store.mjs` | **293**（HEAD 实测） | 删 3 处 `readTaskIndex` 调用 + 2 处 `replaceTaskIndex` + L238 导出体 | `unknown`（待逐段核对，不编数） |
  | `runtime/task/task-kernel-implementation.mjs` | **1,177**（HEAD 实测） | 删 L810–818 的 index 读写段 | `unknown`（待逐段核对，不编数） |
  | `runtime/stage/completion-predicates.mjs` | **1,259**（HEAD 实测） | 删 verify 谓词的 index 读点（L1124–1132） | `unknown`（待逐段核对，不编数） |
  | `tools/cli/check-task-record-paths.mjs` | **324** | 删 `task-index.mjs` 相关登记（FIXTURE_ALLOWLIST L53）| `unknown`（≤ −1） |

  **可承诺确定性净减**：`task-index.mjs` **−30** + `task-store.mjs` **−19 ~ −34** = **合计 −49 ~ −64 行**。其余标 `unknown`。

##### C3 四项实测结论（覆盖「特别要核实的」C3 条目）

**(1) `facts.jsonl` 当前真实字段形状（从 `runtime/task/task-store.mjs` 的写入函数读出）**

- 文件是 **JSONL，两种行型**，由 `parseFactRecords`（L180–196）按 `schema_version` 分流：
  - **行型 A — task fact（默认、唯一被 `appendTaskFact` 写出的）**：**恰好 10 个键**，来自 `FACT_KEYS`（**L9**）= `task_id`、`stage`、`material_digest`、`source_digest`、`invocation_id`、`source`、`status`、`content_hash`、`created_at`、`output_ref`。写入点在 `appendTaskFact` **L299–310**；校验在 `validateFact` **L287–294**（**L290 用 `Object.keys(value).sort()` 与 `FACT_KEYS` 排序后**逐字相等**判定 → 多一个键或少一个键都抛「task fact contains unsupported fields」）。**无 `schema_version` 键。**
  - **行型 B — historical monitoring fact**：`schema_version: "monitoring-fact.v1"`（常量 `HISTORICAL_FACT_SCHEMA` 由 `["monitoring","fact.v1"].join("-")` 在 **L13** 拼出），**25 个键**（`HISTORICAL_FACT_KEYS` **L14**）或 **24 个键**（兼容版本，去掉 `step_slug`，`HISTORICAL_LEGACY_FACT_KEY_SET` **L16**）：`schema_version, fact_id, task_id, project_name, fact_type, stage, step_id, step_slug, skill_id, session_id, subagent_id, run_id, attempt_id, status, value, reason, error, observed_at, source, coverage, contract_version, collector_version, adapter_version, skill_version, evidence_refs`。枚举：`HISTORICAL_FACT_TYPES`（**L10**，20 值）、`HISTORICAL_FACT_STATUSES`（**L11**，11 值）、`HISTORICAL_SOURCE_KINDS`（**L12**，7 值）。
  - **L190–192 硬拒绝**：`quality-fact.v1` / `quality-verify.v1` 出现在 `facts.jsonl` 即抛错（「quality facts must be stored under quality/facts」）。
- **`facts.jsonl` 由 `appendTaskFact` 只写行型 A**（L299–310 逐字）。行型 B **无生产者**（全仓 `grep -rn "monitoring-fact"` 生产命中只有 `task-store.mjs:13`）——**但历史数据全是行型 B**（见下）。

**(2) `index.json` 写点 / 读点 —— 实测写点 6、读点 6（D-018③ 称「5 个写点 / 6 个读点」）**

- **写点（6）**：`runtime/task/task-store.mjs:264`（`initializeTaskStore`，`createOnly`）、`:284`（`replaceTaskIndex` 本体）、`:325`（`appendTaskFact` 内）、`runtime/evidence/quality-store.mjs:233`、`:290`（两处 `replaceTaskIndex`）、`runtime/task/task-kernel-implementation.mjs:816`（`replaceTaskIndex`）。
- **读点（6）**：`task-store.mjs:278`（`readTaskIndex` 本体；调用点 `:316`）、`quality-store.mjs:84`、`:223`、`:248`、`task-kernel-implementation.mjs:801`、`:818`。
- **权限门**：`runtime/task/task-handle.mjs:417` —— `if (relativePath === "index.json" || relativePath === "quality/verify.json") throw new Error("record is kernel-owned and cannot be written through TaskHandle")`。
- 生产字符串命中另见 `tools/architecture/public-behavior-baseline.mjs:265`（`["facts.jsonl","index.json","quality/verify.json"]` 排除表）。

**(3) `readTaskFacts` 的真实调用点 —— 实测生产 **0**（与地图 L92 一致）**

- 定义：`runtime/task/task-store.mjs:270`。
- 生产 import：`core/task-close.mjs:19` —— **import 了但从不调用**（`grep -rn 'readTaskFacts(' core runtime tools skills workflows` 只回定义行）。
- 真实调用者全在测试（5 文件）：`tests/contract/protocol-error-trace.test.mjs:105,152,181`、`tests/integration/task-fact-index-consistency.test.mjs:39`、`tests/integration/minimal-task-storage.test.mjs:72,116`、`tests/integration/vnext-official-stage-run.test.mjs:1774`、`core/task-close.mjs:19`（import only）。
- 附带死导出：`tests/integration/task-fact-index-consistency.test.mjs:8` 与 `tests/integration/minimal-task-storage.test.mjs:7` 还 import 了 `readTaskIndex`。

**(4) `stage-outcomes/<stage>/*.json` 的真实消费者与迁移目标**

- **写者（2）**：`runtime/stage/stage-runner.mjs:399`（`const ref = \`quality/evidence/stage-outcomes/${ctx.stage}/${sha256}.json\``）、`runtime/stage/stage-agent-outcome-adapter.mjs:834`（+`:835` 的 `.attempt-*.lock`）。
- **真实读文件的消费者（4）**：`runtime/evidence/workflow-evolution.mjs:1161`（`readdirSync` 扫目录 → `:1171` 组 `sourceRefs`）、`runtime/task/task-handle.mjs:606`（`resolve(qualityRoot,"evidence","stage-outcomes",stage)`）、`tools/cli/build-reflection-page.mjs:349`、`tools/cli/derive-consumption-edges.mjs:78`。
- **仅校验 ref 字符串（不读文件）的生产点（≥10）**：`canonical-evidence-validators.mjs:124`、`freshness.mjs:412,416`、`workflow-evolution.mjs:65`、`task-kernel-implementation.mjs:37,224,228,265`、`stage-handlers.mjs:176,346`、`stage-handoff.mjs:16,219,221,267`、`stage-reflect.mjs:229,311,817`、`stage-runner.mjs:46,680,2602,2604`、`completion-predicates.mjs:493,662,781`。
- **迁移目标（D-029⑯ L1666 原文）**：「`stage-outcomes/<stage>/*.json`（**status 与 acceptance 绑定的真实输入**）是 K2 行的数据源之一，**必须先迁移再删**」→ 迁移目标 = **K2 行**（`facts.jsonl` 阶段行的 `stage_outcome` 字段），由本卡给出字段形状。
- 附注：该路径在历史 store 中 **29 个任务目录**存在（与 `stage-outcome-proofs` 同批出现的 29 个目录）。`stage-outcome-proofs` 是它的**每步**配套（**20,149** 个文件；复测值，**活目录会漂移（G-5），C8 不得当固定验收数**），D-029⑯ 把二者分开定性。

---

## 实测记录 · 任务Ⅰ（C0–C3）（命令原文 + 关键输出）

> 全部命令在 `/Users/Hugh/Hugh/Project/workflowhub`（HEAD `216a546d4ec33ca3804a188a14a9536a2968f77c`，`git status --porcelain` 仅 `?? .planning/2026-09-10-workflowhub-postmortem/`）或历史 store `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/` 执行。**本会话未修改任何文件**（只读 `read`/`grep`/`wc`/`find`/`node -e`/`node --input-type=module`，全部经 stdin 或 `-e`，**未写盘**）。

| # | 命令 | 关键输出 |
|---|---|---|
| 1 | `git rev-parse HEAD` | `216a546d4ec33ca3804a188a14a9536a2968f77c` |
| 2 | `wc -l runtime/stage/stage-content-contracts.mjs` | **`6806`** ← 裁定 E 要求的实测值（= RK-4/OPN-3 的 6,806；**非** D-015 的 6,485） |
| 3 | `wc -l tools/cli/check-task-record-paths.mjs` | `324` |
| 4 | `wc -l runtime/task/task-store.mjs` | `334` |
| 5 | `wc -l runtime/task/task-index.mjs` | `30` |
| 6 | **`node tools/cli/check-task-record-paths.mjs; echo $?`** | **10 条 `FAIL`，`exit=1`**：`runtime/stage/stage-handoff.mjs`、`runtime/task/task-kernel-implementation.mjs`（caller-supplied storage/task path capability）；`core/task-close.mjs`、**`skills/spec-prd/SKILL.md`**、**`skills/spec-prd/templates/prd-template.md`**（literal specs path derivation）；`runtime/distribution/skill-bundle-release.mjs`、`scripts/__tests__/smoke-local-skill-dispatch.test.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`（unclassified direct writer）；`scripts/__tests__/smoke-local-skill-dispatch.test.mjs`（storage-root env） |
| 7 | `find . -path "*stage-outcome-proofs*" -not -path "*/node_modules/*" \| wc -l`（仓库） | **`0`** |
| 8 | 同上（历史 store）→ `find . -type d -name "stage-outcome-proofs" \| wc -l` / `find . -path "*stage-outcome-proofs*" -name "*.json" \| wc -l` | **`29` 目录 / `20,149` 个 json**（首次取证 19,937 → 复测 20,149；**活目录随并发写入漂移（G-5）**，C8 不得当固定验收数） |
| 9 | `grep -rn "stage-outcome-proofs" --include=*.mjs ... core runtime tools skills workflows metrics tests` | 生产命中 **3**：`runtime/evidence/canonical-evidence-validators.mjs:53`、`runtime/stage/stage-agent-outcome-adapter.mjs:278`、`runtime/stage/stage-runner.mjs:92` |
| 10 | `sed -n '85,100p' runtime/stage/stage-runner.mjs` | `const proofMatch = /^quality\/evidence\/stage-outcome-proofs\/([a-f0-9]{64})\.json$/.exec(ref); if (!proofMatch \|\| proofMatch[1] !== sha256) throw outcomeError(...); raw = ctx.task.readRecord(ref); validateStageOutcomeProof(raw, ...)` → **读不到即 throw** |
| 11 | `grep -rl --include=*.mjs --include=*.js --include=*.ts -F "<schema>" core runtime tools skills scripts workflows metrics tests \| wc -l`（逐 35 个 schema） | **零代码引用 12 个**：`audit-summary.schema.json`、`human-confirmation.v1.schema.json`、`quality-verify.v1.json`、`requirement-ledger.schema.json`、`requirements-coverage.schema.json`、`review-bundle.schema.json`、`risk-acceptance.v1.json`、`skill-catalog.schema.json`、`source-manifest.schema.json`、`steps.schema.json`、`task-fact.v1.json`、`task-index.v1.json`；**最小非零 = 1**（多个），**全口径零引用 = 0** |
| 12 | `ls runtime/schemas/*.json \| wc -l` / `ls schemas/ \| wc -l` | **`35`** / **`0`**（父材料称 45、47 → **均无法复现**） |
| 13 | import 说明符解析脚本（`node --input-type=module`，扫描 8 个根，解析 `import`/`export from`/`import()`/`require()`）→ 逐 `runtime/evidence/*.mjs` 计 importer | **零 importer 2 个**：`receipt-schema.mjs`(0)、`journal-schema.mjs`(1←`receipt-schema`)；**仅测试引用 5 个**：`audit-summary-carrier.mjs`、`boundary-confirm.mjs`、`capability-doctor.mjs`、`requirement-ledger.mjs`、`text-utils.mjs` |
| 14 | 同上脚本，导出名全仓词边界搜索 | **死导出：`runtime/evidence/**` = 41；全仓 = 129**（`stage-content-contracts.mjs` 导出 78、死 20） |
| 15 | 同上脚本，逐 `tools/cli/*.mjs` 计 importer + `package.json`/`run-checks.mjs` 具名调用 | `tools/cli` 共 **28** 个 `.mjs`；零 importer **15**；`run-checks.mjs` 按名字 `spawnSync` 7 个 checker；**真正零调用者候选 12 个** |
| 16 | 同上脚本，逐 `workflows/verify-code/*.mjs` | `capture.mjs` 3(prod1)、`design-alignment.mjs` 4(prod0)、`facts-assembly.mjs` 1(prod0)、`freshness.mjs` 2(prod1)、`metrics-writer.mjs` 1(prod0) → **0 个未 import** |
| 17 | `grep -rn 'readTaskFacts(' --include=*.mjs core runtime tools skills workflows` | **仅 `runtime/task/task-store.mjs:270`（定义）** → 生产调用点 **0** |
| 18 | `grep -rn '"index\.json"\|index\.json' --include=*.mjs core runtime tools skills workflows metrics` | 写点 **6**、读点 **6**（见 C3 (2)）；`task-handle.mjs:417` 为写权限门 |
| 19 | `grep -rn "STAGE_REFLECTION_REF" --include=*.mjs .` | **5 处声明**：`canonical-evidence-validators.mjs:12`、`task-kernel-implementation.mjs:34`、`stage-handlers.mjs:181`、`stage-handoff.mjs:17`、`stage-runner.mjs:48` |
| 20 | `grep -rn "CLOSE_PLAN_REF" --include=*.mjs .` | **2 处，逐字相同**：`freshness.mjs:135`、`task-kernel-implementation.mjs:36` |
| 21 | `grep -rn 'schema_version !== "workflowhub-stage-outcomes.v1"' --include=*.mjs core runtime tools skills workflows` | **6 处**（**严格口径** = 形状校验点）：`freshness.mjs:416`、`workflow-evolution.mjs:65`、`task-kernel-implementation.mjs:265`、`stage-handoff.mjs:267`、`stage-runner.mjs:680`、`stage-runner.mjs:2609`(2604)。**宽松口径**（凡出现该字符串）= **9 处**；两个口径不得混用 |
| 22 | `grep -rn '\^\[a-f0-9\]{64}\$' --include=*.mjs core runtime tools skills scripts workflows metrics \| grep -v node_modules \| wc -l`（+ `-l \| wc -l`） | **`107` 处 / `55` 个文件**（父材料称 48 → **无法复现**；宽松口径 219） |
| 23 | `sed -n '230,250p' runtime/evidence/quality-store.mjs` | **L238 = `export function publishVerifySummary(taskRoot, summary, options = {}) {`** |
| 24 | `grep -rn "publishVerifySummary" --include=*.mjs .` | L238 导出的调用者**全在测试**：`tests/contract/verify-publication.test.mjs:11,34,42`、`tests/integration/minimal-task-storage.test.mjs:8,140`、`tests/integration/vnext-delivery-close.test.mjs:13,113`、`tests/verify-code-facts.test.mjs:8,98,101`；`stage-runtime.mjs:961` 与 `task-kernel-implementation.mjs:742` 是 **kernel 方法**（非 L238） |
| 25 | `wc -l runtime/evidence/workflow-evolution.mjs` / `wc -l runtime/stage/protocol-error-whitelist.mjs` / `grep -c class_id ...` | **`1448`** / **`216`** / **`18`** ← 三者与父材料 L885 一致 ✅ |
| 26 | `grep -rho 'throw new' runtime/ \| wc -l` | **`1476`** ← 与父材料 L885 一致（父材料旧值 1,412）✅ |
| 27 | `grep -rn "monitoring-fact" --include=*.mjs core runtime tools skills workflows` | 生产命中**仅** `runtime/task/task-store.mjs:13` → **零生产者确认** |
| 28 | 历史 store：`grep -o '"schema_version":"[^"]*"' <all facts.jsonl>` \| `sort \| uniq -c` | **`62104 "schema_version":"monitoring-fact.v1"`**（task-fact 行无该键） |
| 29 | 历史 store：无 `schema_version` 行的键集 | `task_id, stage, material_digest, source_digest, invocation_id, source, status, content_hash, created_at, output_ref` = **10 键** ✅ 与 `FACT_KEYS` 一致 |
| 30 | 历史 store：`grep -o '"fact_type":"[^"]*"' \| sort \| uniq -c` | `transcript_event` 27106、**`token` 11737**、`tool_use` 7166、`step` 4825、**`duration` 4823**、`skill` 2060、`acceptance_criterion` 1107、`source_status` 1014、`verify` 756、`review` 547、`stage` 379、`test` 357、`human_intervention` 147、`confirmation` 80 |
| 31 | 历史 store：`token` fact 样本 | `"fact_type":"token", ..., "status":"unavailable", "value":null, "reason":"tokens_unavailable"` → **token 维度实测不可得** ✅ 支持 L1311 |
| 32 | 历史 store：`duration` fact status / grain 分布 | status：`present` **2868**、`unavailable` 1825、`conflict` 130；grain：`stage_outcome` 2454、`step` 295、`skill` 119 |
| 33 | 历史 store：`find . -maxdepth 3 -name facts.jsonl \| wc -l` / `index.json` / `task.json` | **`49` / `49` / `116`** |
| 34 | 历史 store：`find . -maxdepth 6 -type d -name "stage-outcomes" \| wc -l` / `-type d -name quality` | **`29` / `50`** |
| 35 | `test -e <19 个候选测试文件>` | **18 个 EXISTS**；`tests/contract/workflow-evolution-ledger.test.mjs` **MISSING**（不作引用） |
| 36 | `grep -rn "autoResend\|AUTO_RESEND\|auto_resend\|resend" --include=*.mjs core runtime tools skills scripts workflows` | **0 命中** → 父材料所称「自动重发组」**无法具名复现** |
| 37 | 母材料取证（子代理，`read`+`grep -n` 逐行） | M1 L1304 / M2 L1305 / M3 L1306 / M4 L1307 / M5 L1310 / token L1311；D-018① L1382、② L1383、③ L1384、修订 L1392、执行序 L1391；D-028④ L1628；D-029⑦ L1657、⑯ L1666；D-011① L1211；D-020① L1435、② L1436、③ L1437；D-016 L1335；D-017 L1356；D-019 L1413；K1–K9 L807–L820 + 删除侧 L824；R-001~R-013 L12–L24；RK-1~RK-7 L1734–L1740。**父材料无 `## 度量`/`## 基线` 章节**；M1–M5 唯一权威定义在 `#### D-015`（L1299–L1321） |

### C0 五项指标的可得性判定（逐个回答「能算/不能算/部分能算」）

| 指标 | 判定 | 依据 |
|---|---|---|
| **M1** 机制记录墙钟占比 | **不能算** | 分子要求「正式测试累计秒 + broker review 墙钟」（L1304，值 12,182.1 s + 6,054.384 s，标注「记录实际值」）——**这两个分量在历史 store 中不存在**。历史 store 只有 `duration` facts（2,868 `present`，grain 为 `stage_outcome`/`step`/`skill`），**无「正式测试累计」与「broker review 墙钟」两个聚合量**；分母「会话跨度 91,234 s」同样不在 store 中。**缺**：测试与审查的墙钟分段聚合。 |
| **M2** 每任务机制阻塞次数 | **不能算** | L1305 **只给指标名与一个样本值**（「本任务 make-decision 实测 3 条，其中 2 条发生在任何 provider 被联系之前」），**分子/分母定义在父材料中根本不存在**。且 detail 审查 L934 已判「M2 同样需新任务」。**缺**：阻塞的定义、计数口径与历史记录载体。 |
| **M3** 每任务记录文件数 / 无 reader 比例 | **能算** | 历史 store 实测：**49** 个任务目录含 `facts.jsonl` + `index.json`，**116** 个 `task.json`，**29** 个 `stage-outcomes` 目录，**29** 个 `stage-outcome-proofs` 目录（**20,149** 个 proof json；复测值，**活目录会随并发写入漂移（G-5），C8 不得拿它当固定验收数**）。文件数可逐目录 `find \| wc -l`；「无 reader」可按 C1 的 consumer 扫描口径判定。 |
| **M4** git 净行增减 | **能算** | 纯 git 历史统计，与 store 无关。父材料已给两个对照值（close-readiness-governance +11,174、execution-simplification +8,039，L1307）。 |
| **M5** 控制面体量面（5 子项） | **能算**（**第 4/5 项的口径已由裁定 J-9 书面写死并实测**） | 全部可在 HEAD/基线 commit 直接测量。**HEAD 实测**：`stage-content-contracts.mjs` **6,806** 行；`runtime/schemas/*.json` **35** 个；`runtime/` `throw new` **1,476**；`validate`/`assert`/`check` 函数声明 **229**（第二口径含箭头常量 **265**）；**错误码数 = 协议错误分类数 `class_id` 去重 = 16**（参考口径 122，不作判据）。`workflow-evolution.mjs` **1,448**。父材料的 288/301、97/117 **均不可复现**（X17/X18）。 |
| **token 维度** | **不能算** | 历史 store 的 `token` fact **11,737 条全部 `status:"unavailable"`、`value:null`、`reason:"tokens_unavailable"`** → 与 L1311「历史数据里 token 分层不可得，如实标 `unknown`」**实测吻合**。 |

### 需要裁定的新增矛盾 · 任务Ⅰ（C0–C3）

| # | 矛盾 | 两处原文 | 实测 | 建议裁定 |
|---|---|---|---|---|
| **X20** | `stage-outcome-proofs` 定性 | **D-018① L1382** 与 **K 删除侧 L824** 列为删除目标；**D-029⑯ L1666** 明写「`stage-outcome-proofs`（**内容无 reader**）**删**」 | **有 3 处活生产引用**，含 `stage-runner.mjs:92-100` 的**读+校验+throw**；仓库内不存在该路径，只存在于 29 个历史任务、**20,149** 个文件（复测值；**活目录会漂移（G-5）**，C8 不得当固定验收数） | **从 C1 删除清单移出**；**终局由裁定 J-4 定死 = 保留（归 K5，不迁移不删除，K2 行只记 `ref` + `sha256`）**；`stage-outcomes/<stage>/*.json` 才走「先迁移再删」（属 C3）。裁定 H 确认三项都不在 C1 删除 |
| **X21** | `check-task-record-paths.mjs` 授权表数量与「删除即红」 | **D-020① L1435**「**两张**按文件路径硬编码的授权表…删除或搬动其中任一文件，守卫**即失败**」；地图 L78 同 | 实测 **5 张表 + 2 个内联 Set**；**守卫在 HEAD 已 exit 1（10 条 FAIL）**；`walk()` L157-169 对不存在路径返回 `[]` → **删文件不会致红，只留失效登记** | C1/C2 的 oracle 改为「FAIL 数 **不劣化于 10**」；「改成按职责」由 C1 立骨架、C2 完成 |
| **X22** | 五项计数（零引用 schema 14 / runtime-evidence 死模块 8 / 死导出 34 / 零调用者工具 16 / verify-code 未 import 4） | **D-018① L1382** + 父材料 **L885** | 实测 **12 / 2（+5 仅测试）/ 41（全仓 129）/ 12 / 0** —— **五项全部无法复现** | C1 的具名清单按本报告的实测值重写（**裁定 H 已裁定**：清单以 HEAD 实测为准，三项有真实 consumer 者不在 C1 删除）；C0 口径表登记「父材料计数以 HEAD 实测为准」 |
| **X23** | `npm run check` 在 HEAD 已红，且红色部分来自**已合入的 build-prd 自身** | — | 10 条 FAIL 中的 `skills/spec-prd/SKILL.md`、`skills/spec-prd/templates/prd-template.md`（literal specs path derivation）**属于本次 build-prd 交付物** | C0 基线必须记录「`npm run check` 开工即红（10 条）」；**C2/C5 的「退出码 0」oracle 改为「不劣化 + 本卡范围内清零」**；这 10 条的清零应在 **C7**（治理同步）或**本 build-prd 的收口批**明确归属，否则任务Ⅱ 会背一个不属于它的红 |
| **X24** | `monitoring-fact.v1` 分支的处置口径 | **D-018② L1383**「删 `facts.jsonl` 里 `monitoring-fact.v1` **零生产者分支**（`task-store.mjs:147-196`）」；K 删除侧 L824 亦列 | 分支**确无生产者**（生产命中仅 `task-store.mjs:13`），**但 62,104 行历史数据是它**（task-fact 行 0 个 `schema_version`）；`validateFact` L287-294 用 `Object.keys()` 与 `FACT_KEYS` **逐字相等**判定 → 整删后 `parseFactRecords`（L185-193）落到它会抛 `task fact contains unsupported fields`，**16 个非空历史 `facts.jsonl` 读取失败**（另 33 个是 0 字节，不可能失败 —— **独立复核更正了原稿的「49 个」**），违 D-016②「不删已落盘历史字节」 | **只能收窄，不能整删**：保留只读分类（沿用 m15-retirement 已走过的「下沉为 `schema_version` 字符串判断」，见 `specs/archive/m15-retirement/tasks.md:67`），只删「为已删对象服务的校验体」；C2 AC-3 以「49 个历史 store 全部仍可 `readTaskFacts`」为硬判据 |
| **X25** | 父材料所称「自动重发组」在 HEAD 无法具名 | **D-018① L1382** 与 K 删除侧 L824 均列「protocol-error 白名单与自动重发组」；**父材料 L885** 称「自动重发块在 `stage-runner.mjs:2498-2507`（方案写 `:2257-2283`）」 | `grep -rn "autoResend\|AUTO_RESEND\|auto_resend\|resend" --include=*.mjs core runtime tools scripts skills workflows` → **0 命中**；`stage-runner.mjs:2498-2507` 行段实测紧邻 `classifyProtocolError` 调用（**:2500**），**是分类调用点而非自动重发实现** | **「自动重发组」作为一个可删对象在 HEAD 不存在**，C1 不得按此名目删除；该行段归 C2 的「protocol-error 分类收窄」，且 `protocol-error-whitelist.mjs`（216 行 / 18 `class_id`）**有活生产消费者**（`stage-runner.mjs:25` import，`:943`、`:2500` 两处调用），**不可整删**（**裁定 H 已裁定**：protocol-error 白名单**不在 C1 删除**）；C0 口径表登记该项为「父材料计数/对象无法在 HEAD 复现」 |

**未找到 / 无法核实的项（如实登记）**：`stage-outcome-proofs` 的具名删除授权（**已由裁定 J-4 结案：保留为 K5，不删**）；「自动重发组」的代码位置（0 命中，见 X25）；`workflow-evolution.mjs` 的「7 个死导出」口径（实测 20）；`runtime/evidence/` 各文件的确切行数（未逐个 `wc -l`，控制面申报中标 `unknown`）；~~validate/assert/check 函数数与错误码数在 HEAD 的实测值~~（**已由裁定 J-9 补齐：229 / 16，各带可复算命令与写死口径**）。

---

### 任务Ⅱ 卡片 A（C9 / C4）

> 输入契约：`/tmp/wh-msd-build-prd/map-v1.md`（`map_revision = build-prd-map-v1`）
> 主仓 HEAD：`216a546d4ec33ca3804a188a14a9536a2968f77c`（`git rev-parse HEAD`）
> 3rd-review HEAD：`99d6a3c22ef8ee2fae7ec81f3d30bc208c6269fd`
> 所有 file:line / 行数 / 输出均为本轮实测；核不出的写 `unknown` 并注明查了什么。

---

#### C9 · 批次⑨ 执行面四条：慢测试切分 / 同命令去重 / 超时保留已完成部分 / 开工前 preflight（任务Ⅱ 首发）

##### 1. 结果与 consumer

- 结果：跑任务时不再有 900 秒空等；同一条命令不重复启动；超时不抹掉已完成部分；坏命令/坏路径/坏体积在昂贵动作前 5 秒内被拦下并给出具体原因。
- consumer：**C4/C5/C6 的运行成本**（每张卡的验收都要跑受影响测试，C9 决定这个成本）；每个后续任务。直接受益点：`tools/cli/stage-runtime.mjs` 的 `capture-tests` / `review-record` 两条昂贵命令。
- 不服务的 consumer（明确排除）：宿主/broker 的 lifecycle 与 `requirementAuthentication`（D-026③，母材料 `## 非目标`）。

##### 2. 范围

- 在范围内（**四条**）：① 慢测试三层节奏与硬时间预算；② 同命令去重；③ 超时保留已完成部分；④ 开工前 preflight。
- **明确不在范围内**：provider 生命周期。地图 §2.3-C9 曾按「R-026② 修订」把它放进本卡，但**裁定 G 已把它划归 C4**（与 D-030 同批），且本卡实测该词在 1,979 行母材料中**仅出现 1 次**（`decision-log.md:855`，分类学表「依赖外部类」行），D-026 正文（`:1563-1592`）四条内**不含**它。→ **C9 不再持有该条**。
- **不新增对象**：四条一律复用现有判定/落盘点/错误文案（D-026② 明文）。
- 明确不做：不改 `npm test` / `test:safe` / `test:exclusive` 的语义；不动任何 stage 完成谓词；不把 preflight 做成门禁（撞 F11）。
- 具名落点清单（全部实测存在）：

  | 落点 | 实测行数 | 现状 |
    | --- | --- | --- |
    | `tools/cli/run-checks.mjs` | 304 | 已有 `inner/medium/large` 三档与 `ceiling_ms`，但**未被 `npm test` 调用** |
    | `runtime/stage/stage-content-contracts.mjs` | **6,806** | `TEST_RUNTIME_PROFILE_NAMES`（`:57`）、`TEST_RUNTIME_PROFILE_LIMITS_MS`（`:58-62`） |
    | `vitest.config.mjs` | 41 | 只有 `include/exclude/pool`，**无 tier/project 分档** |
    | `runtime/evidence/canonical-receipt-writer.mjs` | 870 | `reusableTestCapture`（`:299`）、`command_hash`（`:776`） |
    | `runtime/task/workspace-runner.mjs` | 222 | `runWorkspaceCommand`（`:215`）＝唯一进程启动点 |
    | `tools/cli/stage-runtime.mjs` | 1,095 | `runPreflight`（`:527`）＝**空实现** |
    | `skills/wh-review/scripts/simple-review-runner.mjs` | 1,267 | `DEFAULT_MANAGED_TERMINAL_WAIT_MS`（`:21`）、`waitForManagedTerminal`（`:432`） |
    | `package.json` | 24 | 5 个 test script，无分档 |

##### 3. 流程/状态

- 现状流程：`stage-runtime <cmd>` → `runPreflight`（`stage-runtime.mjs:527`，只做结构校验后返回 `{status:"valid",diagnostics:[]}`）→ 真正的昂贵动作（`capture-tests` 落 `canonical-receipt-writer.captureTests`；`review-record` 落 `review-record-route.recordSimpleReviewRequest`）。**没有「先探测再执行」的中间态。**
- 目标状态（三条独立可判定的状态跃迁）：
  1. 命令进入执行前 → 先过一次 `preflight`（存在性 / 能力 / 体积），不合格 → `status:"protocol_invalid"` + `diagnostics[{path,expected,actual}]`（**沿用现有返回形状**，`stage-runtime.mjs:518-523`），**不启动子进程**；**并且**：它不是门禁 —— **不写完成谓词、不写 gate、不改 stage 状态、不阻止该 stage 的其他动作或进入下一动作**；修正后可原地重试。（**这两句话必须同时成立**，裁定 J-14 前的「失败即拦」与「失败不阻断」是同一件事的两面：**拦的是这一次昂贵动作，不是任务推进**。）
  2. 执行中若**同 `command` 已有完成的 receipt** → `dispatch_state:"reused"`（已有字面量，`review-record-route.mjs:890`）并回读既有 receipt，**不启动第二次**。（**裁定 J-6 定死为「已完成结果复用」**；**并发在途不在本卡范围** —— 不为它造锁。）
  3. 执行超时 → 已完成部分落盘且可被下一次读回（现状：超时**会**写 output 与 receipt，`canonical-receipt-writer.mjs:773,795`；被外层 `timeout 900` 杀进程才全丢）。
- 不新增状态：全部复用上述三个既有字面量。

##### 4. FR

- `C9-FR-1`（D-026② ①）：测试命令按三层节奏分组，每层有硬时间预算 —— inner 分钟级、phase 3–5 分钟、aggregate 每任务一次。来源 `decision-log.md:1390`（D-018 批次⑨）、`:1570`（D-026②）。
- `C9-FR-2`（D-026② ②；**裁定 J-6**）：同 `command`（`sha256(command)` 相等）**已有完成的 receipt** 时**不重复启动**，**回读既有 receipt**；复用**现有**判定（`canonical-receipt-writer.mjs:299 reusableTestCapture` + `:340/:776 command_hash`），**不新增对象**。**并发在途去重明确不在本 FR 范围**（需新锁对象，撞 E-6 + D-013）。来源 `decision-log.md:1570`。
- `C9-FR-3`（D-026② ③）：超时不得抹掉已完成的 provider member / 已跑完的测试文件；已完成部分可读回。来源 `decision-log.md:1570`。
- `C9-FR-4`（D-026② ④）：开工前 preflight 校验命令与路径存在性、provider/host 能力、packet 体积，5 秒内返回具体原因。来源 `decision-log.md:1390`。
- `C9-FR-5`（R-006 工程/测试类防护；**语义已统一，见 C9-AC-9**）：preflight **只校验这一次昂贵动作、不阻断推进** —— 精确定义为三条同时成立：① 校验不合格 ⇒ **不启动该次子进程**；② 如实返回 `status:"protocol_invalid"` + 非空 `diagnostics`（含 `path`/`expected`/`actual`）；③ **不新增任何门禁**：不写完成谓词、不写 gate、不改 stage 状态、不阻止该 stage 的其他动作或进入下一动作（F11：不得新增卡级硬门）。来源 `decision-log.md:855` + `map-v1.md:102`。
- ~~`C9-FR-6`：provider 生命周期归本卡~~ —— **已由裁定 G 撤销**：该条**改归 C4**（与 D-030 同批），**X30 已关闭**。C9 的 FR 清单**到 `C9-FR-5` 为止**，不存在 `C9-FR-6`。

##### 5. AC（每条带失败判据）

- `C9-AC-1`：存在一份写死的三层命令表（inner / phase / aggregate），每层有 `ceiling_ms`。**失败判据**：任一层无数字预算，或层名与 `TEST_RUNTIME_PROFILE_NAMES`（`stage-content-contracts.mjs:57`）无法对应且未写明映射理由。
- `C9-AC-2`：两个 900 秒超时对应的命令**不再出现在同一层**。**失败判据**：`tests/integration/vnext-official-stage-run.test.mjs` 仍与其余 6 个文件同命令启动。
- `C9-AC-3`：1,717.39 秒单次门不再复现。**失败判据**：单次 aggregate 命令实测 wall-clock ≥ 1,717.39s，或单文件实测 ≥ 743,014ms（实测历史单文件最大值，见 §实测记录）。
- `C9-AC-4`：受影响的 7 文件集合被拆成 ≥2 个命令，且每个命令预算 ≤5 分钟（phase 层）或标记 aggregate。**失败判据**：拆分后总启动次数 > 拆分前，或拆分后仍存在跨层混跑。
- `C9-AC-5`：同一 `(stage, review_track, review_kind, review_scope, subject, phase_id, material_id, route_identity)` 的第二次请求返回 `dispatch_state:"reused"` 且未调用 `runRound`。**失败判据**：第二次仍进入 provider 派发（用一次带计数桩的针对性测试证明）。
- `C9-AC-6`：同一 `command`（`sha256(command)` 相等）的第二次 `capture-tests` **回读既有 receipt**，不启动子进程（**裁定 J-6 的 (b) 形态**）。**失败判据**：`runWorkspaceCommand` 被调用第二次；或第二次没有回读到既有 `receipt.output_ref`。
- `C9-AC-7`：超时场景下 `output_ref` 与 receipt 均已落盘且可 `readRecord` 读回。**失败判据**：超时后 `receipt.output_ref` 不可读，或 receipt 不存在。
- `C9-AC-8`：preflight 对不存在的命令 / 不存在的路径 / 超预算 packet **返回具体原因**且总耗时 ≤5 秒。**失败判据**：返回 `{}` / 无 `diagnostics` / `expected`与`actual`为空 / 耗时 >5,000ms。**实测现状必然失败**：`runPreflight`（`stage-runtime.mjs:527-530`）今天对以上三类一律返回 `{status:"valid", diagnostics:[]}`。
- `C9-AC-9`（**语义统一后的判据，与 FR-5 的三条一一对应**）：preflight 失败时**三条同时成立** —— ① 该次昂贵子进程**未启动**（`runWorkspaceCommand` 调用计数 = 0）；② 命令返回 `status:"protocol_invalid"` 且 `diagnostics` 非空、`path`/`expected`/`actual` 三字段非空；③ 任务推进**未受阻**：stage 状态未变为 blocked/terminal、未新增完成谓词或 gate 条目，且修正命令后可原地重试成功。**失败判据**：把「失败不阻断推进」实现成「失败仍启动子进程」（① 失败），或把 preflight 做成门禁（③ 失败），或返回空 diagnostics（② 失败）。

##### 6. oracle（可执行验证）

- O-1：`node tools/cli/run-checks.mjs --runtime-profile=inner --evidence-path=quality/tests/p0-inner.json -- <受影响测试 argv>` → 退出码 0 且 `quality/tests/p0-inner.json` 内 `ceiling_ms` 实测值。**现状可执行的证据**：该 profile 模式已存在（`run-checks.mjs:86-140`），且已有真实先例 `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p1-profile.json -- npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/test-runtime-profile.test.mjs tests/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（`specs/archive/workflowhub-execution-acceleration-20260909/tasks.md:48`）。
- O-2：单文件计时（本轮实测基线，见 §实测记录）：`node_modules/.bin/vitest run tests/review/review-policy-compatibility.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → 实测 `real 0m0.371s` / vitest `Duration 140ms`。**这证明 inner 层「分钟级」在部分文件上宽松 2 个数量级**，三层拆分有真实空间。
- O-3：`grep -n "command_hash" runtime/evidence/canonical-receipt-writer.mjs` 命中 `:340,:776` ⇒ 去重判定是**既有**的，可直接引用。
- O-4：`node -e`（无新文件）构造 preflight 三例（不存在的命令 / 不存在的路径 / 超预算 packet），断言 `diagnostics[0].path`、`expected`、`actual` 三字段非空且 `Date.now()` 差值 ≤5,000。
- O-5：provider member 可读回 —— **本仓不可闭合的 oracle（如实登记）**：原稿写「读 `/tmp/3rd-review/<runtime_id>/` 私有 runtime 状态」——`<runtime_id>` 是占位符、路径在 `/tmp` 且依赖某次已发生的 run，**第三方不可复现**。**替代的仓内可闭合 oracle**：用 `skills/wh-review/scripts/simple-review-runner.mjs` 的既有 member 落盘点，在一次受控的本地调用中断言「超时/失败后已完成 member 仍可读回」；**跨仓 runtime 状态那部分标 `unknown` 并写明缺什么**（本轮已用同源证据证明该路径真实存在：22 条 finding 即从 `/tmp/3rd-review/<run>/managed/public.json` 与 provider session jsonl 恢复）。

##### 7. 准备依赖

C3 合入（地图 `map-v1.md:101`）。C3 未合入前不做本卡。

##### 8. 实现依赖

无（D-026② 明文「纯工程改造，不依赖任何语义变更」）。**没有 provider 生命周期这一项** —— 裁定 G 已把它划归 C4，C9 与本卡不存在交叠。

##### 9. 验收依赖

C0 的 M1 口径（`map-v1.md:101`）。M1 的分子/分母未写死前，本卡的「启动次数」「超时次数」不可判。

##### 10. 合并依赖

任务Ⅱ 首发，在 C4 之前合入（`map-v1.md:39, 52`）。跨批约束：C3 → C5（T-7#2）与本卡无关。

##### 11. 共享资源冲突与集成责任

- `runtime/evidence/stage-content-evidence.mjs`（527 行）**同文件冲突**：C9 只读它的 `TEST_RUNTIME_PROFILE_*` 常量；C4 要删它的 `validateReviewBudget`（`:312-399`）。→ **集成责任归 C4**，C9 不得改此文件。
- `tools/cli/stage-runtime.mjs`（1,095 行）**同文件冲突**：C9 改 `runPreflight`（`:518-530`, `:606-617`）；C6 改入口统一（D-024①）。→ **串行：C9 先**，C6 后。
- `skills/wh-review/scripts/simple-review-runner.mjs`：**C9 完全不写此文件**（裁定 G 之后 C9 不再持有 provider 生命周期）；C4 独占改 `DEFAULT_MANAGED_TERMINAL_WAIT_MS` 与 `waitForManagedTerminal`。→ **集成责任归 C4**。
- `vitest.config.mjs` + `package.json`：只有 C9 动，CI 度量处置（D-020②）属 C5。
- 共享工作区并发改主仓（G-5/RK-7）→ 本卡开工前先核 HEAD。

##### 12. 来源/设计

- `decision-log.md:1390` — D-018 批次⑨定义与四条验收判据（「两个 900 秒超时与 1,717.39 秒单次门不再复现」）。
- `decision-log.md:1563-1592` — D-026 全文；`:1570`（修订后四条 + 「不需要任何新对象」）；`:1576`（「撤销延期表述」）。
- `decision-log.md:855` — 分类学表「依赖外部类」行：`provider 生命周期编入批次⑨（D-026② 修订）`。**但裁定 G 已把它改归 C4**，本行仅作**来源留痕**，不再是本卡的职责依据。
- `decision-log.md:1456-1478` — D-021（与本卡相邻：provider provenance）。
- `map-v1.md:96-102`（C9 卡）、`:39`（执行序 5）、`:51-52`（依赖图）。
- **裁定 J-6**（C9② 的目标形态 = (b) 已完成结果复用；被否 (a) 在途去重）、**裁定 J-9 第 4 项口径**（C9 §18 的 test runtime profile 常量与 M5 无关，此处只留痕）。C9 的 preflight 语义统一（FR-5 ↔ AC-9 三条一一对应）见本卡 §3 第 1 条与 §5。**C9 不持有 provider 生命周期**（裁定 G）。
- 母材料 `decision_revision = sha256:9c5c45a2c06ff5cb01809a2712064577e84f69ef1e46ca2be97be262220bae68`。

##### 13. 局部风险

- R-1：三层节奏在仓库里**只有一半对应**。实测：`inner/medium/large` 三档真实存在（`stage-content-contracts.mjs:57`；`run-checks.mjs:96`；`ceiling_ms` 见 `run-checks.mjs:106-115` = `inner 60_000` / `medium 300_000` / `large 900_000`），但 D-018 的层名是 **inner / phase / aggregate**，`phase` 与 `aggregate` **仓库里零命中**。→ 必须在卡内写死映射（建议 `phase→medium(300_000)`、`aggregate→large(900_000)` 且 aggregate 每任务一次），否则执行者会自造第四套命名。
- R-2：`run-checks.mjs` 的 profile 模式**目前不在 `npm test` 链上**（`package.json` 5 个 script 全不含 `--runtime-profile`），`npm run check` 也只调 `node tools/cli/run-checks.mjs`（无参数 = aggregate 模式）。→ 若不接线，三层节奏就是死代码。
- R-3：`large` 档在 `run-checks.mjs:133` 硬要求 `CI=true`，本地跑 aggregate 会直接报错 → aggregate 只能进 CI，本地必须留 medium 兜底。
- R-4：「同命令去重」的现有 fingerprint **有两种不同东西**（见 `X31`）。**已由裁定 J-6 定死为 (b) 已完成结果复用**（落点 `canonical-receipt-writer.mjs:299`），**(a) 在途并发去重被否决**（需新锁对象，撞 E-6 + D-013）。→ **已知后果**：同一命令**并发在途**时仍各跑一次；本卡不为它造锁，如实登记为不覆盖项。
- R-5：preflight 做成新门禁即撞 F11（`map-v1.md:102` 已登记）。
- R-6：母材料断言「同一命令至少启动 8 次」**未找到一手记录**（见 §实测记录 → `unknown`），AC 不能依赖 8 这个数字。

##### 14. 可后置技术项

`none`（用户明确要求不产出延期任务）。仅卡内先后顺序：

- ① 慢测试切分 → 先做（它决定后面三条的验收成本）；
  - ② 同命令去重 → 次之；
  - ③ 超时保留 → 再次；
  - ④ preflight → 最后（它依赖前三者暴露出的真实失败模式）。
  - ~~provider 生命周期~~：**已移出本卡**（裁定 G 归 C4，X30 已关闭）。本卡的可后置技术项为空，卡内先后顺序见下。

##### 15. 最小读取集

- **必读**：`tools/cli/run-checks.mjs`（304）、`runtime/stage/stage-content-contracts.mjs:55-200`（常量与校验）、`runtime/evidence/canonical-receipt-writer.mjs:290-400` + `:710-800`、`runtime/task/workspace-runner.mjs:1-70` + `:210-222`、`tools/cli/stage-runtime.mjs:505-530` + `:600-620`、`package.json`、`vitest.config.mjs`。
- **条件读**（只在做某一条时读）：`runtime/review/review-record-route.mjs:317-345`（审查去重键，只在核 ② 的边界时读）。**`simple-review-runner.mjs` 不在本卡读取集内**（provider 生命周期已归 C4）。
- **正常不读**：`runtime/stage/stage-content-contracts.mjs` 的 6,000+ 行主体；`runtime/stage/stage-runner.mjs`（3,000+ 行）；任何 `specs/archive/**`。

##### 16. 五阶段开工说明

1. **make-decision**：本卡即 C9，方向已由 D-026② 修订固定；本阶段只需产出「四条各一条可证伪 oracle + 三层节奏命名映射」一页材料（`decision-log.md:1570` 已是方向来源）。
2. **build-spec**：把 9 条 AC 写成 spec 的 AC 段，含每条的失败判据与 oracle 命令原文；写死三层命名映射（`phase→medium` / `aggregate→large`）。
3. **build-plan**：按第 14 条的 ①②③④ 顺序切 4 个 wave；每个 wave 必写「受影响测试清单 + 只跑这些的命令」；写「同文件同批」约束（第 11 条）。
4. **build-code**：每个 wave 只跑该 wave 的受影响测试（禁全量）。
5. **verify-code**：按 O-1~O-5 逐条给退出码与实测数字。**本卡不含 provider 生命周期项**（裁定 G 归 C4）。

##### 17. 受影响测试清单与命令

- 存在性已逐条 `test -e` 验证：

  | 文件 | 行数 |
    | --- | --- |
    | `core/__tests__/run-checks.test.mjs` | 130 |
    | `tests/contract/test-runtime-profile.test.mjs` | 240 |
    | `tests/contract/stage-runtime-preflight.test.mjs` | 221 |
    | `core/__tests__/check-extensibility.test.mjs` | （C5 范围，本卡不跑） |

  - 精确命令（**只跑这些**，禁全量）：

      ```bash
      node_modules/.bin/vitest run core/__tests__/run-checks.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/stage-runtime-preflight.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
      ```

  - 超时保留（③）与同命令去重（②）的落点在 `canonical-receipt-writer`：**未找到只覆盖 captureTests 的独立测试文件**（`grep -rln "captureTests"` 只命中 `tests/contract/test-runtime-profile.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/integration/mini-task-delivery.test.mjs` 等跨模块大文件）→ **需新增**一个只针对 `reusableTestCapture` 与超时落盘的针对性测试文件（建议 `tests/contract/test-capture-reuse.test.mjs`）。在它存在之前，②③ 不得靠跑上面那几个大文件取证。
  - 禁止：`vitest`（无范围）、`npm test`、`npm run test:safe`、`npm run check`。

##### 18. 控制面净增减申报

（`wc -l` 实测当前行数）

| 文件 | 当前行数（实测） | 预计行数 | 净值 | 说明 |
| --- | --- | --- | --- | --- |
| `tools/cli/run-checks.mjs` | 304 | 304 | **0** | 只接线（`package.json` 侧调用），不改本文件 |
| `vitest.config.mjs` | 41 | 41 | **0** | 不新增 project；用命令分组而非配置分档 |
| `package.json` | 24 | 26 | **+2** | 新增两个分档 script；**净增必须由 C5 的 `npm test` 冲突处置抵扣** |
| `runtime/evidence/canonical-receipt-writer.mjs` | 870 | 880–900 | **+10~+30** | 复用 `command_hash`（`:340`）只加读取分支，不加新对象 |
| `runtime/task/workspace-runner.mjs` | 222 | 230–245 | **+8~+23** | 在 `runWorkspaceCommand`（`:215`）前插存在性校验 |
| `tools/cli/stage-runtime.mjs` | 1,095 | 1,110–1,130 | **+15~+35** | `runPreflight`（`:527`）从空实现补齐 |
| `runtime/stage/stage-content-contracts.mjs` | **6,806** | 6,806 | **0** | **只读**，由 C4 删预算 |
| `runtime/evidence/stage-content-evidence.mjs` | 527 | 527 | **0** | 归 C4 |
| `skills/wh-review/scripts/simple-review-runner.mjs` | 1,267 | 1,267 | **0** | 归 C4 |

- **本卡净增约 +35 ~ +90 行，净减 0**。🛑 这是**整改期间唯一一张允许净增的卡**：D-018 批次⑨的定位是「纯工程改造、做完能降低后续批次的运行成本」，其收益不体现在行数而体现在 wall-clock。**必须在 build-plan 里写明：C9 的正行数由 C1/C2/C5/C6 的净减吸收，且 M4（git 净行数为负）是 C8 对全任务的判据、不是对 C9 的判据。**
  - 父材料争议值：`runtime/stage/stage-content-contracts.mjs` 的 6,485 vs 6,806 → **实测 6,806**（`wc -l`），见 `X36`。

---

#### C4 · 批次④ 审查解绑 + 降级 + 审查契约四项 + 审查通道修复（必须修）+ 审查进程健康终止（R-013 / D-030）

##### 1. 结果与 consumer

- 结果：审查**做过就算数**；卡死的审查由 3rd-review **自己判死**并进入终态；**无任何审查需要外层 `timeout` 才能结束**。
- consumer：C5/C6/C8；用户（不再被无止尽的审查浪费时间）。
- **跨仓**：本卡有两名交付对象 —— 主仓 `workflowhub` 与 `/Users/Hugh/Hugh/Project/3rd-review`（D-030⑤：3rd-review 侧**不是仓外不可交付物，是本路线明确要求的跨仓交付项**）。

##### 2. 范围

- **审查契约四项 + 解绑 + 降级**：去重键改元组；`review_origin` **5 个取值**（**第 5 值字面量名 = `dispatched_uncollected`，已由裁定 J-1 定稿，本卡只引用、不再自行定义**）；`dispatch_state` 提到聚合面；packet 组装补 `skills/` lens；异源按底层模型判定；删轮次预算（先落 `review_result_ref` 替代物再删）；删「追 findings 清零」；小修不复审。
- **provider 生命周期（裁定 G 移交，本卡独占）**：内容 = `C4-FR-8/9/10` 三条（3rd-review manager 心跳 + 健康裁决判死 → `PROCESS_STALLED` 终态 → wh-review 消费侧），**所有权条目 = `C4-FR-19`**；**不新增独立机制**、不新增协议字段。X30 已关闭，本卡不再「等裁定」。
- **方向审查的可用表面（OPN-1 / OPN-5，本卡闭合）**：`C4-FR-17`（补齐方向完整性指令）+ `C4-FR-18`（把 OI 清单绑定到 `decision-log.md` 的具体修订版本）；这两条是 `C4-AC-15` 的前置，缺它们 AC-15 不可达。
- **verify-code 执行端（R-015④ 的落点，本卡写集合内）**：verify 读 Phase review 的 `review_result_ref` 需要**执行端**配合 —— 落点 = `runtime/stage/stage-handlers.mjs` 的 verify-code 输入组装段（`:373-374`、`:2400-2403`、`:3855-3870`）与 `runtime/review/stage-materials.json`（**只读不改** `verify-code.problem_order`）；`workflows/verify-code/**` **不改**（实测它是零生产 importer 的 helper，且 I-4b 明写 verify 用 `dsh-code-review`，不是 wh-review 的第二次调用）。
- **D-030 四件**：① 3rd-review manager 心跳 + `managedStatus` 心跳过期判死（**数值、owner 与「忙但存活」判据见 §3 与 FR-8**；协议零变更）；② `PROCESS_STALLED` 补进失败枚举并接成终态；③ wh-review 侧把 `stalled` 接到下游映射、`waitForManagedTerminal` 改等健康裁决、**禁止自造墙钟停滞判定**；④ 修正 `docs/adr/0001-v4-cli-contract.md` 与归档设计文档中「沉默不杀进程」的旧决策。
- 明确不改：per-stage 审查标准与 prompt（用户明确要求保留，`map-v1.md:174`）。
- **实测行号（父材料已过期，以本处为准）**：

  | 事项 | 父材料/地图 | **HEAD 实测** |
    | --- | --- | --- |
    | 轮次预算执行点 | `review-record-route.mjs:804-805` | **`review-record-route.mjs:886-893`**（`:891-892` 是拒绝分支） |
    | 第二消费点 | （地图未列） | **`stage-handlers.mjs:2338-2343`** |
    | 去重键实现 | 「改成元组」 | **`review-record-route.mjs:317-331`（`requestLockHash`）+ `:353-373`（`findReusableReview`）** |
    | 异源判定 | `third-review-host-config.mjs:642-647` | **`third-review-host-config.mjs:642-647`（对）**，另 `:701-703`（distinctAdapters） |
    | ADR 沉默条 | 主仓 `docs/adr/0001-v4-cli-contract.md:123` | **在 3rd-review 仓**，`docs/adr/0001-v4-cli-contract.md:122-123` |
    | broker stalled | `broker.mjs:75,1335` | **`broker.mjs:97`（`workflowHubV2Outcomes`）、`:1349`（计算）** |
    | managed 信封 | `broker.mjs:139-145` | **`broker.mjs:156-164`（`managedPublic`）** |

##### 3. 流程/状态

- 现状（实测）：请求 → `recordSimpleReviewRequest`（`:779`）→ `reviewRequestMaterialId`（`:299`）→ `requestLockHash`（`:317`）→ `findReusableReview`（`:353`，**唯一去重判定**）→ `validateReviewBudget`（`:886`）→ 派发 → `recordSimpleReviewResult`（`:1123`）。
- 目标：去重键 = `(stage, phase_id, track, review_kind, origin)`（D-029③）；预算整段消失；`dispatch_state` 在聚合面可见。
- 现状（cross-repo）：`managedStatus`（`3rd-review/lib/broker.mjs:707`）只在 `operation.manager && ownerConfirmedDead(operation.manager)`（`:712`）时判 terminal。`ownerConfirmedDead`（`runtime.mjs:33-37`）**只比 pid/uid/started 身份**，无时间维度 → owner 活着但卡死时永不终态。
- 目标：manager 每次推进写心跳；`managedStatus` 扩展为「**owner 已死 或 心跳过期 / 健康裁决判死**」→ 复用现有 `SESSION_MANAGER_LOST` / managed failure group。**协议零变更**（不给 managed 信封加字段：`assertManagedPublic` 用 `exactKeys` 严格校验，`:165-171`，加字段即 `PUBLIC_RESULT_INVALID`）。
- **健康终止契约（R-013 的可复核形态，实测数值 + owner + 「忙但存活」判据；**不是外层墙钟**）**：
  1. **心跳周期**：manager 每次推进调 `noteProgress` 写心跳；**探测周期 = `intervalMs`，默认 `60_000 ms`**（`3rd-review/lib/health-runner.mjs:4`）；**配置层 liveness 周期 = `liveness_interval_ms`，默认 `1_000 ms`**（`3rd-review/lib/config.mjs` 的 v4 归一化）。
  2. **计时器 owner = 3rd-review 仓**（`health-runner.mjs` 的 `clock.setTimeout(tick, intervalMs)` + `config.runtime.liveness_interval_ms`）。**主仓 wh-review 不持有任何计时器**，只 `waitForManagedTerminal` 等终态。
  3. **过期阈值 = 3rd-review 自己的健康裁决，不是 elapsed-time**：v4 已**废除 elapsed-time 终止** —— `3rd-review/lib/config.mjs` 对 `runtime.idle_timeout_ms`、`runtime.max_duration_ms` 与 `providers.*.deadline_ms` **一旦出现即 `CONFIG_INVALID`**（"provider execution has no elapsed-time limit"），`max_wall_clock_ms` 强制归一化为 `null`。判死路径 = probe 返回 `busy` 且 `cursor`/`session_id` **均未变**连续 **5** 次（`stagnant >= 5`，`health-runner.mjs:61-65`）→ 上报 `PROCESS_STALLED`；本卡把它从 `diagnose()` 升级为可 `publish()`（终态）→ `broker.mjs` 的 `outcome:"stalled"`。
  4. **「manager 忙但存活」的判据（实测，必须写死）**：probe 返回 `progressing` / `retry` / `busy` 任一即**进程存活**；**只有 `busy` 且游标未推进才累加 `stagnant`**；`progressing` / `retry` 游标未变**只记诊断**（`HEALTH_PROGRESSING` / `HEALTH_RETRY`），**不累加、不判死**；`!probeSession` 的流式 adapter **直接跳过探测**（注释原文「Silence is not proof of failure」）。⇒ **「忙」≠「死」**；只靠墙钟的「沉默即杀」在本卡**明令禁止**。
  5. **数值归属边界**：上述周期值（60,000 / 1,000）与阈值（连续 5 次）**由 3rd-review 仓的 v4 config / health-runner 决定**；**本仓只消费其终态**，不自行选值、不复制一套计时器。**本仓验收** = O-6.2（`managedStatus` 在健康判死窗口内变 `terminal` + `group.providers[].error.code === "SESSION_MANAGER_LOST"`）与 O-6.3（wh-review 侧映射正确，不产生墙钟判定）。

##### 4. FR

- `C4-FR-1`（D-029③）：审查去重键改为元组 `(stage, phase_id, track, review_kind, origin)`；写死「大改动」的判定人与误判后果；**引用裁定 J-1 已定稿的第 5 个取值字面量名 `dispatched_uncollected`（本卡不再自行定义）**。来源 `decision-log.md:929` + `:1390`（批次④）。
- `C4-FR-2`（D-010 + D-009③）：删 `validateReviewBudget` 及其两个消费点；**顺序：先落 `review_result_ref` 去重替代物，再删预算**。来源 `decision-log.md:1184-1206`。
- `C4-FR-3`（D-022）：每 Phase 保留 1 次核心审查；**废除「反复重审直到 findings 清零」**；只有大改动（跨接口 / schema / 安全边界 / 公共契约）才允许一次 focus 复审；小修不再触发。来源 `decision-log.md:1479-1498`。
- `C4-FR-4`（D-029⑬）：`dispatch_state` 提到聚合面（今天只在 `role_results.red/blue` 内）。来源 `decision-log.md:1657` 第 13 条。
- `C4-FR-5`（D-029⑪ + D-018⑤）：packet 组装补 `skills/` lens。来源 `decision-log.md:1657` 第 11 条。
- `C4-FR-6`（D-021③ + D-029⑮）：`minimum_heterologous` 按**底层模型**判定并写明比较键。来源 `decision-log.md:1461`、`:1657` 第 15 条。
- `C4-FR-7`（D-007 + D-021①）：降级判据收紧为「已收到并读取材料之后才失败」；`review_origin` 增第 5 取值以区分「已派出但未收齐」。来源 `decision-log.md:1118-1137`、`:1456-1478`。
- `C4-FR-8`（D-030①）：3rd-review manager 心跳 + `managedStatus` 心跳过期判死；复用 `SESSION_MANAGER_LOST`；**协议零变更**；对**所有 provider** 有效（不依赖 probe）。**可复核契约（必须连同实现一起落）**：心跳周期 + 探测周期 `intervalMs` = **60,000 ms**（`health-runner.mjs:4`）、配置层 `liveness_interval_ms` = **1,000 ms**（`config.mjs`）；**计时器 owner = 3rd-review 仓**（本仓零计时器）；**过期阈值 = 3rd-review 自己的健康裁决**（`busy` 且游标未变连续 **5** 次 → `PROCESS_STALLED`），**不得写成外层墙钟**（v4 已废除 elapsed-time 终止：`idle_timeout_ms`/`max_duration_ms`/`deadline_ms` 一旦出现即 `CONFIG_INVALID`，`max_wall_clock_ms` 恒为 `null`）；**「忙但存活」判据** = probe 返回 `progressing|retry|busy` 即存活，只有 `busy` 且游标未推进才累加 `stagnant`，`!probeSession` 的流式 adapter 跳过探测。**数值归属**：周期与阈值由跨仓项（3rd-review v4 config / health-runner）决定，**本仓只消费其终态**；本仓验收见 O-6.2 / O-6.3。完整推导与实测行号见 §3 的「健康终止契约」。
- `C4-FR-9`（D-030②）：`PROCESS_STALLED` 补进失败枚举（`3rd-review/lib/provider-failure.mjs:3-22`）并接成终态（`health-runner.mjs:54` → `broker.mjs:1349` 的 `outcome:"stalled"`）。
- `C4-FR-10`（D-030③）：wh-review 侧 ① 把 `stalled` 接到下游结果映射（`review-result.mjs` 目前无 `stalled`）；② `waitForManagedTerminal`（`simple-review-runner.mjs:432`）改为等待健康裁决，`DEFAULT_MANAGED_TERMINAL_WAIT_MS=null`（`:21`）语义随之改写；③ **明令禁止**自造墙钟停滞判定。
- `C4-FR-11`（D-030④）：修正 `docs/adr/0001-v4-cli-contract.md` 与归档设计文档中「沉默不杀进程」的旧决策（**两个仓、两个文件**，见第 12 条）。
- `C4-FR-12`（D-021④ 升级为必须修 + D-029⑭）：审查通道本 run 在 red+blue 两 role 同时 `PROTOCOL_INCOMPATIBLE` 且 `provider_results=[]` → 必须修。
- `C4-FR-13`（D-008①②）：形似允许名单**四套**收敛为一套（D-029⑫ 由「三套」改为「四套」）；`MATERIAL_FORBIDDEN` 类错误必须直接列出合法取值。
- `C4-FR-14`（**R-014 + 裁定 I-1 / I-5**）：**focus 复审的最小输入形态** = **一次性组装、不落盘**：原 finding 的 ref + 受影响文件的最小 diff + 对应测试 + 当前源码树 + delta 验证结果（**恰好这五项**）。**越界判据沿用 D-022③ 的「大改动」**（公共接口 / schema / 安全边界 / 跨原审查模块）与 `C4-FR-1` 已写死的判定人，**不重复登记**。**不得**把它做成落盘的持久对象（撞 D-013 + 裁定 G「字段 ≠ 对象」）。**实证支撑（T-12，本轮实测）**：整包审查的体积约 **708 KB**、单次墙钟**约 11 分钟**（**第一次 20 分钟不够**），且同一整包在协议改动后**还可能因 T-11 的 `REQUEST_ID_CONFLICT` 根本重跑不起来** ⇒ 「只发五项最小输入」不是优化偏好，是**把分钟级不可预测成本换成可预测的小成本**。
- `C4-FR-15`（**R-015③ + 裁定 I-5**）：**Phase review 复用判据 = 输入未变**。具名输入 = 该 Phase 的 diff、受影响文件集、该 track 的审查 lens（`build-code/phase` 的 `problem_order`）、材料与该 track 的去重键；判「未变」= 上述具名输入逐项相同（**不是**哈希失效链），与 **C5** 的「绿灯不失效、不自动重跑」一致。输入变了则照常重跑，不追 findings 清零。
- `C4-FR-16`（**R-015④ + 裁定 I-4 / I-4b / I-5**）：**跨阶段复用**：verify-code 是 **`dsh-code-review` + 一次异源代码 review**（`docs/standard-workflow.md:18`、`:88`），对象是**当前实现**（`:31`）——**不是** wh-review 的第二次调用。verify **读 Phase review 的 `review_result_ref`**（指向 **K5 原始结果**）作为输入，去重**只限与 Phase review 重叠的维度**（如 `correctness`）；**verify 自己的 lens 与那次异源代码 review 必须保留，不得以「复用」为名取消或降级**。
- `C4-FR-17`（**OPN-1**，`decision-log.md:1742-1746`）：**补齐方向完整性指令**，使「对方向做方向审查」在当前 track 划分下**有可用表面** —— direction track 的审查载荷必须包含「方向完整性」指令项 + OI 快照（`review-materials.mjs` 的 direction track 载荷组装段），**不新增 surface、不改 per-stage 审查标准与 prompt**（E-18 边界）。来源：OPN-1 的关闭条件「direction/detail 两 track 的载荷边界改写完成，且带 OI 快照的方向审查能跑通」。
- `C4-FR-18`（**OPN-5 + X15 + X16**）：**把 OI 清单绑定到 `decision-log.md` 的具体修订版本** —— direction 审查输入里的 OI 快照必须同时绑定：① `decision-log.md` 的**具体修订版本值**（整文件 `sha256`，即 `decision_revision`）；② OI 条目的**逐条 `ref` + `sha256`**（`OI-001" ~ "OI-030`，禁止只给计数或摘要）；③ 交互聚合**按官方契约形状**传入（修 X16）并把**同一个**聚合对象形态修好（修 X15：`stage-handlers.mjs:3336-3340` 目前把自己的 `{ref,value,evidence}` 形态传进只在**顶层**读 `sha256` 的分析器 → 生产路径恒报 `interaction_proof: missing` + 23 条错）。**不修 X15/X16，带快照的方向审查仍会在生产路径失败，OPN-5 不可能关闭** —— 这正是 `C4-AC-15` 此前不可达的原因。
- `C4-FR-19`（**裁定 G 的移交落地 + `decision-log.md:855`**）：**provider 生命周期的唯一 owner = 本卡**。本条目是**所有权条目**，其可执行内容 = `C4-FR-8`（心跳与判死）+ `C4-FR-9`（`PROCESS_STALLED` 进枚举并接终态）+ `C4-FR-10`（wh-review 消费侧与禁止自造墙钟判定）三条，**不重复登记实现、不新增机制**。**C9 不再持有该条**（`C9-FR-6` 已由裁定 G 撤销）。

##### 5. AC（每条带失败判据）

- `C4-AC-1`：去重键含 `phase_id` 与 `track` 两个维度。**失败判据**：`findReusableReview`（`:353`）的判断条件里任一维度缺失，或 focus 复审被旧键永久锁死（用一个「同 stage 同 track 不同 phase」的针对性测试证明第二次能派发）。
- `C4-AC-2`：`validateReviewBudget` 在生产代码中零命中（`grep -rn "validateReviewBudget" runtime/` → 0）。**失败判据**：仍存在于 `stage-content-evidence.mjs` 或任一 import。
- `C4-AC-3`：`npm run check` **不劣化于 HEAD 基线**（markdownlint **554** error / path-guard **10** FAIL / verify-structure **2** FAIL）**且本卡范围内清零**（**唯一允许的例外命令**，因为本卡删的是 `check` 链上的东西；执行证据必须写明此理由与范围）。本地以 `node tools/cli/run-checks.mjs` 代替。
- `C4-AC-4`：同 track 已有 `conducted` 结果时不再派发（D-010 明文验收）。**失败判据**：第二次仍调用 `runRound`。
- `C4-AC-5`：小修不触发复审；每 Phase 恰好 1 次核心审查。**失败判据**：改一个非「大改动」文件后产生第二次 attempt。
- `C4-AC-6`：`review_origin` 的 5 个取值在 status 可见，且第 5 取值有字面量名。**失败判据**：第 5 取值无名字（写成 `unknown`/开放字符串），或 status 不可见。⚠️ 实测现状：`review_origin` 全仓 **0 命中**（见 `X30`）。
- `C4-AC-7`：detail track 的 packet 内**必然**含 `skills/simplicity-guard/SKILL.md`（+ `plan-ceo-review`、`review`）。**失败判据**：bundle 目录树无 `skills/` 子树。**实测依据**：`skills/wh-review/manifest.json:32-35` 与 `skills/wh-review/stage-skill-plan.json:14-21` 都要求 `detail → ["simplicity-guard","plan-ceo-review","review"]`，且 `skills/simplicity-guard/SKILL.md` 实测存在（97 行）。
- `C4-AC-8`：异源判定按底层模型；比较键写死。**失败判据**：仍以 profile 键字符串相等判定（现状 `sameSourceProfile` 返回 `provider === hostProvider`，`:642-647`）。
- `C4-AC-9`：**故意构造无响应场景，审查在健康判死窗口内进入终态**。**失败判据**：需要外层 `timeout` 才能结束，或 30 分钟仍非终态。构造方法见第 6 条 O-6。
- `C4-AC-10`：全流程**无 `timeout` 外层命令**（`grep` 执行记录，或人工核对命令原文）。**失败判据**：任何验收命令以 `timeout` 开头。
- `C4-AC-11`：`managedPublic`（`broker.mjs:156-164`）字段集**未变**（仍 `{version, request_id, runtime_id, state, material_id}`）。**失败判据**：多加任一字段（会直接 `PROTOCOL_INCOMPATIBLE`）。
- `C4-AC-12`：`PROCESS_STALLED` 进入 `provider-failure.mjs:3-22` 的 `structuredCodes`。**失败判据**：不在；或进了枚举但 `codes.has("PROCESS_STALLED")`（`broker.mjs:1349`）仍不可达。
- `C4-AC-13`：`stalled` 在**三处**被接受：`review-provider-client.mjs:122`（已是）、`review-result.mjs` 映射、`runtime/review/schemas/attempt.schema.json:193`。**失败判据**：任一处缺 `stalled`（见 `X34`）。
- `C4-AC-14`：ADR 与归档文档的「沉默不杀进程」表述已改。**失败判据**：`3rd-review/docs/archive/2026-07-12-v3-redesign-design.md:20,:216,:235` 原文仍在而无指向本次方向修正的标注。
- `C4-AC-15`（**判据已按 FR-17/FR-18 补齐，不再只改 AC 文字**）：`C4-FR-17` 与 `C4-FR-18` 落地后，**带 OI 快照的方向审查跑通并落 sink** → 关闭 OPN-1、OPN-5。**通过判据（两条都要）**：① 一次方向审查的 `review_result_ref` 读得回（`test -f <ref>` = 0），且输入里含 `decision_revision` + OI 逐条 `ref`/`sha256`；② `status --stage=make-decision` 的 `outline_closed` 满足（**当前实测**：`work_status=ready` / `quality_status=in_progress` / 12 项 `quality_missing`，来源 `map-v1.md:185`）。**失败判据**：`outline_closed` 仍不满足**且**没有任何一次落 sink 的方向审查结论（OPN-5 的关闭条件允许「或如实记录为不可用」，但**必须留下可读回的记录**，不得只写一句 `unavailable`）；或方向审查在生产路径仍报 `interaction_proof: missing`（= FR-18 未落地）。
- `C4-AC-16`：22+13 条回收 finding 补一次落 sink 的收取 → 关闭 OPN-2。**失败判据**：仍只有未记录证据。
- `C4-AC-17`（**R-014 / 裁定 I-5**）：focus 复审的输入组装**不产生任何新文件**（一次性组装、不落盘）**且五项齐备**。**失败判据**：组装前后 `git status --porcelain` 或受影响目录清单出现**新增/修改的落盘对象**（把窄修复包做成持久对象即失败）；**或组装出的输入缺五项（原 finding 的 `ref` / 受影响文件的最小 diff / 对应测试 / 当前源码树 / delta 验证结果）中任一项**。**oracle**：见 O-8 第 1 段（含五项齐备的 `node -e` 断言）。
- `C4-AC-18`（**R-015③④ / 裁定 I-4 / I-5**）：verify 的输入是 **Phase review 的 `review_result_ref` 指向的既有 K5 文件**（`test -f <ref>` = 0，**不重新派发 provider 审同样的东西**），且 verify 结论**显式区分**「来自 Phase review 的既有 finding」与「本阶段新发现」；verify 自己的 lens 未被删改。**失败判据**：verify 重新审理同一批 finding 却读不到该 ref；或结论不区分来源；或 `runtime/review/stage-materials.json` 的 `verify-code.problem_order` 被改写成 `build-code/phase` 的值；**或 §11 写集合点名的 verify-code 执行端（`stage-handlers.mjs:373-374/2400-2403/3855-3870`）未被改动**（= FR-16 只在文档里成立、没有执行端落点）。**oracle**：见 O-8 第 2/3/4 段。
- `C4-AC-19`（**裁定 G 的移交不是空的**）：本卡 FR 清单含 `C4-FR-19`（provider 生命周期所有权条目），其可执行落点为 `C4-FR-8/9/10`，且 **C9 卡内不存在该职责的实现项**。**失败判据**：`C4-FR-19` 缺失；或 `C9-FR-6` 未被撤销 / C9 仍要求在本卡实现 provider 生命周期；或出现**第二份**健康判死实现（本仓自造计时器即失败，撞 D-030③ 与裁定 G）。
- `C4-AC-20`（**R-013 的可复核性**）：§3「健康终止契约」的 5 条全部写进 spec，且**每一条都有实测出处**：心跳/探测周期数值、计时器 owner、过期阈值 = 3rd-review 健康裁决（连续 5 次 `busy` 无游标推进）、「忙但存活」判据、数值归属边界。**失败判据**：出现「阈值待实现时定」一类措辞；或把判死写成外层墙钟（`idle_timeout_ms`/`max_duration_ms`/`deadline_ms`/`max_wall_clock_ms` 任一被启用）；或本仓新增计时器。

##### 6. oracle（可执行验证）

- O-1（去重键）：`grep -n "phase_id\|review_track" runtime/review/review-record-route.mjs` 命中 `findReusableReview`（`:353-373`）的判断体；并用针对性测试断言「同 stage/track、不同 phase → 第二次可派发」。
- O-2（删预算）：`grep -rn "validateReviewBudget\|REVIEW_RETRY_BUDGET" runtime/ skills/ tools/` → 0 命中。
- O-3（`review_origin` 5 值）：`grep -rn "review_origin" .` 应命中定义处 + status 渲染处；第 5 取值字面量名 = **`dispatched_uncollected`**（**裁定 J-1 已定稿**）与其余 4 个同处列出；`node -e` 断言渲染出的取值集合恰好 5 个且与共享定义逐字一致（多一个或少一个即失败）。
- O-4（packet lens）：构造一次 detail 请求并 `find <bundleRoot> -path '*skills*'`，断言 3 条 `SKILL.md` 存在。**注意**：`bundleRoot` 由 `mkdtempSync(join(packetRoot, "bundle-"))` 生成（`review-materials.mjs:2063-2065`），`packetRoot = <attachmentRoot>/.wh-review-packets`。
- O-5（异源按底层模型）：读 `third-review-host-config.mjs:623-630` 的 `brokerSourceId` 与 `:701-703` 的 `adapterOf`，断言新比较键用的是 broker `identity.source_id`（含 model）而非 profile 键。**现状反例已实测**：`broker.mjs` 与主仓 review 记录里同时存在 `source_id: "codex/luna"`、`model: "gpt-5.6-luna"`、`adapter: "codex"`，且 `pi/v4flash` 的 `source_id` 实测为 `null`（见 §实测记录）→ **`source_id` 本身不足以判底层模型**，必须落到 `identity.model`。
- O-6（**故意构造无响应场景**，可执行做法，三段任一即可）：
  1. **最小单元层（快、确定、无网络）**：在 3rd-review 仓用现成 FakeClock 模式驱动 health runner ——
    `node --test test/health-runner.test.mjs`；新增一例：`setup({ intervalMs: 10, probeSession: async () => ({status:"busy", session_id:"s", cursor:"same"}) })`，`await clock.tick(50)`，断言 `decisions[0].error.code === "PROCESS_STALLED"`（今天是 `diagnostics[0].code`，改完必须变成 decision）。**失败判据**：`decisions` 为空。
  2. **managed 端到端层（证明「心跳过期判死」对所有 provider 有效）**：用 `test/managed-session-lifecycle.test.mjs` 的现成脚手架（`test/fake-cli.mjs` + `test/managed-start-caller.mjs` + `scripts/3rd-review.mjs`），把 fake provider 换成 **`test/silent-cli.mjs`**（`process.env.THIRD_REVIEW_TEST_DURATION_MS` 控制静默时长，默认 180ms）或 **`test/ignore-sigterm-cli.mjs`**（忽略 SIGTERM + `setInterval`，永远不退出），发起一次 managed run，然后在 manager 不自更新心跳的窗口内轮询 `managedStatus`，断言 state 变 `terminal` 且 `group.providers[].error.code === "SESSION_MANAGER_LOST"`。**失败判据**：state 恒为 `running`。
  - **为什么这条能覆盖事故涉及的 provider**：实测只有 opencode 有 `probeSession`（`3rd-review/lib/adapters/opencode.mjs:157`；全仓 `grep -rn "probeSession" lib/adapters/` 只此一处），antigravity/codex/pi **既无 probe 也从不发 terminal 事件** ⇒ 1 号路径对它们无效。`ignore-sigterm-cli.mjs` 正好模拟这个形态。
    3. **wh-review 调用侧层（证明下游映射正确，不证明判死逻辑）**：扩展 `tests/review/review-managed-lifecycle.test.mjs`（571 行，已有 `managedWire(state,{outcome,member})` 桩，`:117`），加一例 `managedWire("terminal", { outcome: "stalled" })`，断言结果落到预期终态而**不是** `UNKNOWN`。**边界如实标注（独立复核指出：这是「把验证推给别人」的典型，必须显式标为不可闭合）**：本仓 oracle **只能**证明**调用侧映射正确**；判死逻辑由 3rd-review 仓自身测试证明（G-4）。
- O-7（无外层 timeout）：把验收用的命令原文写进证据，`grep -c '^timeout '` = 0。
- O-8（**R-014 / R-015 的零新增、五项齐备与跨阶段复用**，可执行）：
  1. **零新增 + 五项齐备**：组装一次 focus 复审输入后，`git status --porcelain` 的输出与组装前**逐字节相同**（期望空 diff），且对 `<packetRoot>` 做目录清单比对**无新增持久对象**；**并断言五项齐备**（缺任一即失败）：

     ```bash
     node --input-type=module -e '
       const input = buildFocusReviewInput(/* 由 C4 实现后填实参 */);
       const need = ["finding_ref","minimal_diff","tests","source_tree","delta_verification"];
       const missing = need.filter((k) => input?.[k] === undefined || input[k] === null || input[k] === "");
       if (missing.length) throw new Error("focus input missing: " + missing.join(","));
       if (Object.keys(input).length !== need.length) throw new Error("focus input must be exactly five items");'
     ```

  2. **复用（FR-15 的「输入未变不重跑」↔「输入变了照常重跑」双判据，可执行）**：用 `tests/review/review-record-route.test.mjs` 的针对性用例断言 —— ① **正例**：同一 Phase 的**具名输入逐项相同**（该 Phase 的 diff、受影响文件集、该 track 的审查 lens、材料、该 track 的去重键）时，第二次请求返回 `dispatch_state:"reused"` 且 `runRound` 调用计数 = **1**；② **反例**：改动**任一项**具名输入后，第二次请求**必须派发**（`runRound` 计数 = 2）。**失败判据**：正例产生第二次派发（= 未复用），或反例被旧键永久锁死（= 复用过头）。
  3. **ref 可读**：`grep -n "review_result_ref" runtime/task/task-store.mjs runtime/review/review-record-route.mjs` 命中 K2 行字段与去重判定；verify 侧读的是该 ref 指向的**既有 K5 文件**（`test -f <ref>` = 0），**不需要重新派发 provider**。
  4. **lens 保留**（证明 verify 的审查不得被「复用」砍掉）：`node -e 'const j=require("./runtime/review/stage-materials.json");console.log(JSON.stringify(j.surfaces["verify-code"].problem_order))'` → 期望 `["implementation","consumer","correctness","lifecycle_security","test_strength"]`，与 `build-code.phase.problem_order` = `["spec_conformance","correctness","necessity"]` **不同**（实测值）。
  5. **verify 执行端落点存在**（FR-16 不是只写在文档里）：`grep -n "phase_review_ref\|review_result_ref" runtime/stage/stage-handlers.mjs` 必须命中 verify-code 输入组装段（`:373-374`、`:2400-2403`、`:3855-3870` 三者至少其一）；**失败判据**：命中 0（= AC-18 无执行端）。
- O-9（**OPN-1 / OPN-5，可执行**）：
  1. **输入绑定**：对一次 make-decision 方向审查的输入做 `node -e` 断言 —— 含 `decision_revision`（64 位小写 hex，且等于 `sha256(decision-log.md)`）与 **OI 逐条 `{id, ref, sha256}`**（`id` 覆盖 `OI-001`~`OI-030`，无缺项、无重复、无只给计数）。
  2. **落 sink**：`test -f <review_result_ref>` = 0，且该文件可从 K5 按 ref 读回（用 `readRecord`）。
  3. **X15/X16 已修**：生产路径跑一次方向审查，断言**不出现** `interaction_proof: "missing"` 与 `core interaction proof is not current or does not bind its OI/group/disposition`；修前**已知必然失败**（X15 实测：23 条该报错 + `interaction_proof: "missing"`）。
  4. **`outline_closed`**：`node tools/cli/stage-runtime.mjs status --stage=make-decision --project=... --task=...` 的 `outline_closed` 满足；**若如实记录为不可用**，必须在同一处留下可读回的 `review_result_ref`（OPN-5 的关闭条件允许不可用，但不允许「没有记录」）。
- O-10（**R-013 健康终止契约的数值复核，可执行 + 跨仓**）：
  1. **本仓零计时器**：`grep -rn "setInterval\|setTimeout" skills/wh-review/scripts/simple-review-runner.mjs` 不得新增用于判死的计时器；`DEFAULT_MANAGED_TERMINAL_WAIT_MS`（`:21`）保持 `null` 语义 = **无墙钟上限，等健康裁决**。
  2. **跨仓数值取自 3rd-review 仓**（本仓只消费终态）：`cd /Users/Hugh/Hugh/Project/3rd-review && grep -n "intervalMs = 60_000\|stagnant >= 5" lib/health-runner.mjs` 与 `grep -n "liveness_interval_ms\|max_wall_clock_ms: null\|no longer supported" lib/config.mjs` —— 断言 elapsed-time 三字段仍被拒（`idle_timeout_ms` / `max_duration_ms` / `deadline_ms`）。**失败判据**：本仓复制了一套周期/阈值；或某处恢复了 elapsed-time 终止。
  3. **端到端判死**：O-6.2 的 `managedStatus` 变 `terminal` + `error.code === "SESSION_MANAGER_LOST"`；**跨仓部分标 `unknown`**（G-4），由 3rd-review 仓自身测试证明。

##### 7. 准备依赖

C9 合入（`map-v1.md:110`）。

##### 8. 实现依赖

C3 的 K2 行字段（`map-v1.md:110`）——`review_origin` / `review_result_ref` 要写进 `facts.jsonl` 的阶段行。

##### 9. 验收依赖

C0 的 M2 口径（`map-v1.md:110`）。

##### 10. 合并依赖

任务Ⅱ 第 2 位（`map-v1.md:40`），在 C9 之后、C5 之前。跨仓部分在 `/Users/Hugh/Hugh/Project/3rd-review` **单独交付**（D-030⑤）。

##### 11. 共享资源冲突与集成责任

- `runtime/evidence/stage-content-evidence.mjs`（527 行）：C4 删 `:312-399`（`validateReviewBudget`，**88 行**）。C9 只读常量 → **C4 是本文件的集成责任人**。
- `runtime/stage/stage-handlers.mjs`（3,956 行）：C4 改 `:2338-2343`（第二预算消费点）、聚合面 `dispatch_state`、**verify-code 输入组装段（`:373-374`、`:2400-2403`、`:3855-3870`；R-015④ 的执行端落点）**、**X15 的 OI 绑定通道（`:3336-3340`）与 X16 的聚合形状（`:602-607`、`:611`、`:626`）**。**同文件同时被 C6 改** → 串行，C4 先。
- `runtime/review/stage-materials.json`：**C4 只读、且必须证明未改**（`verify-code.problem_order` 与 `build-code.phase.problem_order` 两张 lens 表**必须保持实测值**，见 O-8 第 4 段）。若确需新增输入项，只能加**新键**、**不得改写既有 `problem_order`**；改写即撞裁定 I-4 与 `C4-AC-18`。
- `workflows/verify-code/**`（`facts-assembly.mjs` 59 行等 5 个非测试 `.mjs`，零生产 importer）：**C4 不改**（I-4b 明写 verify 用 `dsh-code-review`，不是 wh-review 的第二次调用）；此处登记只为**排除误改**。
- `skills/wh-review/scripts/review-materials.mjs`（2,225 行）：C4 补 `skills/` lens。**同文件被 C5 改**（`skill-deps.yaml` 的 consumer 声明相关）→ 串行，C4 先。
- `runtime/review/review-record-route.mjs`（1,257 行）：**C4 独占**（C5 点名要改的 8 文件闭包含它，见 `map-v1.md:115`）→ 与 C5 串行。
- `skills/wh-review/scripts/simple-review-runner.mjs`（1,267 行）：C4 独占（C9 只读）。
- `3rd-review/lib/broker.mjs`（1,354 行）/ `health-runner.mjs`（75）/ `provider-failure.mjs`（82）/ `process.mjs`（163）/ `runtime.mjs`（260）：**C4 独占，且是跨仓** → 集成责任 = 任务Ⅱ 主会话 + 3rd-review 仓 owner 双签。
- `docs/adr/0001-v4-cli-contract.md`（**3rd-review 仓**，174 行）与 `docs/archive/2026-07-12-v3-redesign-design.md`（419 行）：C4 独占；与 C7 的治理同步（主仓宪法/ADR）**跨仓不共享文件**，无冲突。

##### 12. 来源/设计

（引用具体 D 号 + 行号 + revision）

- `decision-log.md:1390` — 批次④定义全文（含 D-030 四件的落点与验收判据）。
  - `decision-log.md:1456-1478` — **D-021** 全文（①review_origin 第 5 取值；②降级门槛收紧；③异源按底层模型；④provider_results 保留逐 provider 身份）。
  - `decision-log.md:1479-1498` — **D-022** 全文（每 Phase 1 次核心审查；删追零循环；大改动才 focus；小修不复审）。
  - `decision-log.md:1184-1206` — **D-010** 全条（删预算 + 修订段：编入批次④ + 顺序约束「先落替代物再删预算」）。
  - `decision-log.md:1162-1182` — **D-009** 修订③（去重键替代物 = `review_result_ref`，零新增对象）。
  - `decision-log.md:1118-1137` — **D-007**（降级判据与 `same_source_degraded`）。
  - `decision-log.md:1139-1160` — **D-008**（四套形似契约；错误文案列合法取值；`dispatch_state` 显示；不新增降级资格字段）。
  - `decision-log.md:1097-1116` — **D-006**（审查不作通关条件）。
  - `decision-log.md:1801-1821` — **D-030** 全文（①②③④⑤ + 事故证据行 + `## 未决项` 三条）。
  - `decision-log.md:855` — 分类学表「依赖外部类」行（provider 生命周期归批次⑨，与 D-030 的分工）。
  - `decision-log.md:1657` 第 3/11/12/13/14/15/16 条 — D-029 的元组键、lens、四套契约、聚合面、必须修、异源层、D-003 两类对象。
  - `decision-log.md:1938-1979` — 「带 OI 快照的方向审查：终止记录与发现」（21 分钟空转的活体复现，X-B）。
  - `decision-log.md:1742-1746` — **OPN-1 / OPN-5 的定义与关闭条件**（`C4-FR-17` / `C4-FR-18` / `C4-AC-15` 的直接来源）；OPN-1 关闭条件 = 「direction/detail 两 track 的载荷边界改写完成，且带 OI 快照的方向审查能跑通」；OPN-5 关闭条件 = 「带快照的方向审查完成，或如实记录为不可用」。
  - **X15 / X16**（本 PRD「风险与交付说明 · X1–X19」表）：生产路径 `interaction_proof` 恒失败、交互聚合形状缺键 —— 二者是 `C4-FR-18` 必须一并修掉的前置，否则带快照的方向审查在生产路径仍会红。
  - **裁定 G**（provider 生命周期归本卡、X30 关闭 —— `C4-FR-19` 的来源）、**裁定 J-1**（`review_origin` 五态与第 5 值字面量名 `dispatched_uncollected`）。
  - **D-030① 的历史参照**：`3rd-review/docs/archive/2026-07-12-v3-redesign-design.md:233` 写有「每 5 秒更新一次 heartbeat」；**HEAD 实测的周期是 60,000 ms 探测 + 1,000 ms liveness**，以实测为准。
  - `map-v1.md:104-111`（C4 卡）、`:40`（执行序 6）、`:58`（能力前置）、`:187`（G-4 跨仓边界）。
  - **「沉默不杀进程」原文实测命中位置**（父材料行号有误，见 `X35`）：
  - 主仓：**无此文件**（`docs/adr/` 实测 **30 个 `.md`**，无 `0001-v4-cli-contract.md`）。
  - `/Users/Hugh/Hugh/Project/3rd-review/docs/adr/0001-v4-cli-contract.md:122-123`：「恢复过程由 managed session、provider process 和 health guardian 的真实活跃、失联、退出或失败事实裁决，不使用 adapter 固定总时限或 idle 时限。」
  - `/Users/Hugh/Hugh/Project/3rd-review/docs/archive/2026-07-12-v3-redesign-design.md:20`：「不再设置默认 180 秒或 120 秒杀进程。默认 `deadline_seconds=null`……**沉默只产生 `idle_warning`/`stalled_suspected`，不自动杀进程、不自动重新派发同一任务**。」（同义句另见 `:216`、`:235`；`:233` 还写有「每 5 秒更新一次 heartbeat」，可作 D-030① 的历史参照）。
  - **R-014 / R-015 / 裁定 I**（本 PRD 内：`## 任务地图 · 需求覆盖` 表的 R-014 / R-015 两行；`#### 裁定 I` 全文 I-1 ~ I-7）：R-014 的「越界才重跑」= D-022③（`decision-log.md:1482`，「大改动 = 接口 / schema / 安全边界 / 公共契约」）+ D-029 批次④ 第 3 条（`:1653`，写死判定人与误判后果）；R-015③④ 的落点见裁定 I-5；**这两条是 build-prd 阶段由用户追加的需求，不是 make-decision 阶段的产物**；verify-code 的工具与对象口径见 `docs/standard-workflow.md:18`、`:31`、`:88`（`dsh-code-review` + 一次异源代码 review，对象 = 当前实现）。

##### 13. 局部风险

- R-1（最高）：wh-review 若自造墙钟停滞判定 = 「timeout 换皮」，**明令禁止**（D-030④）。实测依据：managed 活跃信封 `managedPublic`（`broker.mjs:156-164`）只有 `{version, request_id, runtime_id, state, material_id}`，**零进度、零时间戳** → wh-review 唯一可观测的是「进程还活着 + 本地墙钟」。**因此判死必须由 3rd-review 的健康裁决给出**（§3「健康终止契约」第 3 条），本仓不持有计时器。
- R-2（**已按裁定 G 改写，不再是「等裁定」**）：`review_origin` 在 HEAD 全仓 0 命中（X30）⇒ 它是**新增 K2 行字段**，不是「已有枚举补第 5 值」。**裁定 G 已裁定**：K2 行内的字段**不属于**「持久化对象」粒度 ⇒ 与「零新增对象」不冲突；**本卡的风险不是「要不要新增」，而是「落点只能有一个」** —— 该字段的字段表由 **C3** 定（任务Ⅰ），本卡（任务Ⅱ 第 2 位）**只引用、不得自建第二份记录或并行字段**。**失败形态**：本卡自建一份 review 事实载体（撞 K7 与裁定 G 第 4 条）。
- R-3：**通道修复会连带改 public 行为**（D-008 `consequences_and_risks` 明文「属 public 行为，需单独测试」）。
- R-4：`stalled` 的下游落点比父材料多一处 —— `runtime/review/schemas/attempt.schema.json:193` 的 `group_outcome` 枚举无 `stalled`（见 `X34`）。漏改则 schema 校验直接红。
- R-5：**跨仓项不在本仓可验证范围内**（G-4）。本仓只能证明调用侧映射正确。
- R-6：只有 opencode 有 probe（`3rd-review/lib/adapters/opencode.mjs:157`）⇒ 若只做 D-030②（probe 路径），**覆盖不了本次事故涉及的 antigravity/codex/pi**。D-030①（心跳过期判死）才是主机制，②只是增强。
- R-7（**数值与 owner 已写死，见 §3「健康终止契约」与 FR-8，不再是「实现时定」**）：`runManagedOperation`（`broker.mjs:736-755`）当前是**单次长 `await this.run`**，需改成带定时器的结构；同构参考是 `runtime-guardian.mjs`（`setInterval(tick, 1_000)`，实测存在）。**周期值（60,000 / 1,000）与阈值（连续 5 次 `busy` 无游标推进）由 3rd-review 仓决定，本仓只消费终态**；**剩余的真实风险** = 「`progressing` 但游标长期不变」（实测：该形态**只记诊断、不累加 `stagnant`**）→ 会被判为「忙但存活」而永不判死。**处置**：如实登记为**已知不覆盖项**（它是「沉默不是失败证据」这一设计取舍的必然代价），**不得**为它在本仓加墙钟兜底。
- R-8：删预算会牵动 `tests/contract/review-budget-namespace.test.mjs`（129 行，整份文件是为预算写的）→ 该文件必须同批处置（删除或改写成「预算不存在」断言），否则测试直接红。
- R-9（**T-12 的实证支撑，本轮实测**）：**整包审查的成本是分钟级且不可预测** —— 708 KB 的包实测**约 11 分钟**，第一次用 20 分钟上限仍不够被迫重跑；第三轮更出现 **21 分钟零产出**。⇒ `C4-FR-14` 的「五项最小输入、一次性组装、不落盘」是本卡**收益最直接**的一条；**它的失败形态** = 把窄修复包做成持久对象（多一个落盘对象、却仍要整包重发）⇒ 两头都输，撞 D-013 与裁定 I-7。
- R-10（**T-11，跨仓缺陷，本仓不可闭合**）：`request_id` 确定性且不含协议版本（`simple-review-runner.mjs:102-115`）⇒ 协议改动后同一材料在 TTL（24h）内重跑会撞 `REQUEST_ID_CONFLICT`（**实测两次**）。**本卡不为它新增 request 版本字段**（会动 `managedPublic` 的 `exactKeys` ⇒ `PROTOCOL_INCOMPATIBLE`，撞 `C4-AC-11`）；**跨仓部分标 `unknown`**（G-4），现场重启路径 = 换 material 或等 TTL 过期；**若 C4 的通道修复要让「改协议后能重跑」成立，必须由 3rd-review 仓决定 request 身份是否纳入协议版本**（本仓只消费其终态）。

##### 14. 可后置技术项

`none`（用户明确要求不产出延期任务）。仅卡内先后顺序：

- 先 **去重键元组化 + 落 `review_result_ref` 替代物**（`C4-FR-1`、`C4-FR-2` 前半）；
  - 再 **删预算**（`C4-FR-2` 后半）——D-010 明文顺序约束，**不可颠倒**；
  - 再 **D-030①②**（3rd-review 侧，跨仓），**再 ③④**（主仓消费侧 + 文档）——③ 依赖 ①② 的产出，④ 可与 ①② 并行；
  - **`C4-FR-18` 必须先行于 `C4-AC-15`**：先修 X15/X16（OI 绑定通道 + 聚合形状），再跑带 OI 快照的方向审查，否则 `outline_closed` 不可达（这条是 AC-15 此前不可满足的根因）；
  - **`C4-FR-17` 可与 `C4-FR-18` 并行**（前者改 direction track 载荷的指令项，后者改 OI 绑定与聚合形状）；
  - **`C4-FR-16` 的执行端改造（`stage-handlers.mjs` verify-code 段）必须与 `C4-FR-15` 同 wave**：复用判据与读取端是同一件事的两面；
  - `C4-FR-3/4/5/6/13/19` 可与其他并行（互不共享文件）。
  - **无任何一条离开本批次**。

##### 15. 最小读取集

- **必读**：`runtime/review/review-record-route.mjs:299-400` + `:770-1000`；`runtime/evidence/stage-content-evidence.mjs:280-400`；`runtime/stage/stage-handlers.mjs:2310-2360`；`skills/wh-review/scripts/review-materials.mjs:1908-1935` + `:2050-2125`；`skills/wh-review/scripts/review-provider-client.mjs:95-145` + `:240-260` + `:350-375` + `:460-480`；`skills/wh-review/scripts/review-result.mjs:140-175`；`skills/wh-review/scripts/simple-review-runner.mjs:15-30` + `:425-460`；`skills/wh-review/manifest.json`、`skills/wh-review/stage-skill-plan.json:1-25`；`runtime/review/schemas/attempt.schema.json:185-198`。
- **必读（跨仓）**：`3rd-review/lib/broker.mjs:90-100` + `:156-176` + `:625-640` + `:690-760` + `:1326-1354`；`3rd-review/lib/health-runner.mjs:1-75`（全文 75 行）；`3rd-review/lib/provider-failure.mjs:1-25`；`3rd-review/lib/runtime.mjs:30-42`；`3rd-review/lib/runtime-guardian.mjs`（全文）；`3rd-review/docs/adr/0001-v4-cli-contract.md:110-135`；`3rd-review/docs/archive/2026-07-12-v3-redesign-design.md:18-22` + `:210-236`。
- **条件读**：`skills/wh-review/scripts/third-review-host-config.mjs:620-730`（只做异源时）；`skills/wh-review/scripts/review-runner.mjs:100-135`（只做删追零时）；`3rd-review/lib/process.mjs:60-120`（只做 D-030② 时）。
- **正常不读**：`skills/wh-review/scripts/review-materials.mjs` 的 2,000 行主体；`runtime/stage/stage-handlers.mjs` 的 3,900 行主体；`3rd-review/lib/broker.mjs` 的 1,200 行主体；任何 `specs/archive/**`。

##### 16. 五阶段开工说明

1. **make-decision**：方向已由 D-030 固定；**`X30` 已由裁定 G 关闭**（`review_origin` = 新增 **K2 行字段**、5 值集合由**裁定 J-1** 定稿），因此本阶段**不再需要为它取得新裁定**。本阶段要产出的只有两件：① 把 D-030 四件与裁定 G 的字段裁定落成 spec 条目；② **把 `C4-FR-17` / `C4-FR-18`（OPN-1 / OPN-5 所需的「方向完整性指令」与「OI 清单绑定到 `decision-log.md` 具体修订版本」）写成可执行条件** —— 否则 `C4-AC-15` 不可达。
2. **build-spec**：把 **20 条 AC** 写成 AC 段；把 D-030 四件拆成**跨仓两张子卡**（主仓 / 3rd-review），各自写死接口契约与验收判据；**把 §3「健康终止契约」的 5 条（周期数值、owner、过期阈值 = 健康裁决、忙但存活判据、数值归属）原样写进 spec**（这是 `C4-AC-20` 的对象）；写死 `stalled` 的语义（是否等同 `unavailable`、如何计入阶段完成行 —— D-030 `unresolved_items` 第 ②）；写死 `C4-FR-19` 的所有权条目与它的三条落点。
3. **build-plan**：按第 14 条顺序切 wave；跨仓部分写**接收方、接口契约、验收判据**（D-030⑤ 明文要求），不写成延期；每个 wave 写「受影响测试清单 + 只跑这些的命令」。
4. **build-code**：主仓 wave 与跨仓 wave 分开提交；跨仓 wave 在 3rd-review 仓内跑 `node --test test/health-runner.test.mjs test/managed-session-lifecycle.test.mjs`（3rd-review 的 `package.json` 只声明 `node --test test/*.test.mjs`）。
5. **verify-code**：按 O-1~O-7 逐条给退出码与实测值；O-6 的三段分别标注「本仓证明」与「跨仓证明」。

##### 17. 受影响测试清单与命令

- 存在性已逐条 `test -e` 验证：

  | 文件 | 行数 | 覆盖 |
    | --- | --- | --- |
    | `tests/review/review-record-route.test.mjs` | 1,385 | 去重键 / 预算 / 聚合面 |
    | `tests/review/review-managed-lifecycle.test.mjs` | 571 | managed 终态 / `stalled` 映射（O-6.3） |
    | `tests/review/review-policy-compatibility.test.mjs` | 82 | 异源策略 |
    | `tests/contract/review-budget-namespace.test.mjs` | 129 | **删预算时必须同批处置** |
    | `tests/contract/review-materials-contract.test.mjs` | 1,237 | packet 组装 / lens（O-4） |
    | `tests/contract/build-prd-review-contract.test.mjs` | 258 | 非 stage 审查契约 |
    | `skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs` | 87 | provider 超时 |
    | `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` | 1,098 | managed 轮询 / `waitForManagedTerminal` |
    | `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs` | 506 | 异源选择 |
    | `tests/verify-code-facts.test.mjs` | — (存在) | **verify 输入组装（FR-16 / AC-18 的执行端落点）** |
    | `tests/contract/verify-architect-acceptance.test.mjs` | — (存在) | **verify 结论分区：既有 finding vs 本阶段新发现** |
    | `/Users/Hugh/Hugh/Project/3rd-review/test/health-runner.test.mjs` | — | `PROCESS_STALLED` 诊断→终态（O-6.1、O-10.2） |
    | `/Users/Hugh/Hugh/Project/3rd-review/test/managed-session-lifecycle.test.mjs` | — | 心跳过期判死（O-6.2、O-10.3） |

  - 精确命令（**只跑这些**，禁全量）：

      ```bash
      # 主仓 · 审查契约四项 + 聚合面
      node_modules/.bin/vitest run tests/review/review-record-route.test.mjs tests/review/review-policy-compatibility.test.mjs tests/contract/review-materials-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism

      # 主仓 · D-030③（stalled 下游映射 + managed 轮询）
      node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs --poolOptions.forks.singleFork --no-fileParallelism

      # 主仓 · 异源
      node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs --poolOptions.forks.singleFork --no-fileParallelism

      # 主仓 · 删预算时同批
      node_modules/.bin/vitest run tests/contract/review-budget-namespace.test.mjs --poolOptions.forks.singleFork --no-fileParallelism

      # 主仓 · verify-code 执行端（R-015④ 的读取改造；AC-18）
      node_modules/.bin/vitest run tests/verify-code-facts.test.mjs tests/contract/verify-architect-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism

      # 跨仓 · 判死逻辑（3rd-review 的 package.json 只有 "test": "node --test test/*.test.mjs"）
      cd /Users/Hugh/Hugh/Project/3rd-review && node --test test/health-runner.test.mjs test/managed-session-lifecycle.test.mjs test/provider-failure.test.mjs
      ```

  - 明确禁止：`vitest`（无范围）、`npm test`、`npm run test:safe`。`npm run check` **仅**在验证「删预算后守卫**不劣化**（markdownlint 554 / path-guard 10 / verify-structure 2）」时跑一次，且必须在执行证据里写明该例外理由与范围（本条依 `AGENTS.md` 测试硬规则的例外条款）。
- **未找到**：`review-result.mjs` 的 `stalled` 映射**没有专属测试文件**（`grep -rln "stalled" skills/wh-review/scripts/__tests__/` → 0）→ **需新增断言**（建议落在 `tests/review/review-managed-lifecycle.test.mjs` 内，O-6.3）。
- **未找到（R-015③④ 的复用双判据）**：`findReusableReview` 目前只有「返回既有结果」的正向用例，**没有「输入未变不重跑 / 输入变了照常重跑」的成对断言** → **需在 `tests/review/review-record-route.test.mjs` 内新增一例正例 + 一例反例**（O-8 第 2 段）。
- **未找到（OPN-1/OPN-5 的输入绑定）**：**没有测试断言方向审查输入含 `decision_revision` + OI 逐条 `{id, ref, sha256}`** → **需新增断言**，建议落在 `tests/contract/build-prd-review-contract.test.mjs`（O-9 第 1 段）。

##### 18. 控制面净增减申报

（`wc -l` 实测当前行数）

| 文件 | 当前行数（实测） | 预计行数 | 净值 | 说明 |
| --- | --- | --- | --- | --- |
| `runtime/evidence/stage-content-evidence.mjs` | 527 | 439 | **−88** | 删 `validateReviewBudget`（`:312-399`） |
| `runtime/review/review-record-route.mjs` | 1,257 | 1,150–1,210 | **−47 ~ −107** | 删预算 import/调用/返回字段（17 处命中）；去重键元组化为原地改写，净增 ≈0 |
| `runtime/stage/stage-handlers.mjs` | 3,956 | 3,945–3,950 | **−6 ~ −11** | 删第二预算消费点（`:2338-2343`）；聚合面 `dispatch_state` 原地 |
| `runtime/review/schemas/attempt.schema.json` | 361 | 361 | **0** | 枚举加一个值，原地 |
| `runtime/review/stage-materials.json` | — | — | **0** | **只读**：两张 `problem_order` lens 表必须保持实测值（O-8 第 4 段）；只允许新增输入键，不得改写既有 lens |
| `skills/wh-review/scripts/review-runner.mjs` | 514 | 489 | **−25** | 删 `reviewCycleDecision`（`:107-131`） |
| `skills/wh-review/scripts/review-result.mjs` | 366 | 366–375 | **0 ~ +9** | 加 `stalled` 映射 |
| `skills/wh-review/scripts/review-materials.mjs` | 2,225 | 2,235–2,255 | **+10 ~ +30** | 补 `skills/` lens 组装；删 `:1044` 追零边界句 |
| `skills/wh-review/scripts/review-provider-client.mjs` | 642 | 650–670 | **+8 ~ +28** | 上层模型比较键 + 有界等待消费 |
| `skills/wh-review/scripts/third-review-host-config.mjs` | 729 | 735–750 | **+6 ~ +21** | `sameSourceProfile`（`:642-647`）改按底层模型 |
| `skills/wh-review/scripts/simple-review-runner.mjs` | 1,267 | 1,255–1,285 | **−12 ~ +18** | `DEFAULT_MANAGED_TERMINAL_WAIT_MS`（`:21`）语义改写；`waitForManagedTerminal`（`:432`）改等健康裁决 |
| `skills/wh-review/manifest.json` | 58 | 58 | **0** | 只读 |
| `skills/wh-review/stage-skill-plan.json` | 89 | 89 | **0** | 只读 |
| `tests/contract/review-budget-namespace.test.mjs` | 129 | 0 或 60–90 | **−129 或 −39 ~ −69** | 同批处置（删文件或改写成「预算不存在」） |
| **`3rd-review/lib/broker.mjs`** | 1,354 | 1,370–1,400 | **+16 ~ +46** | manager 心跳 + `managedStatus` 心跳过期（`:707-719`） |
| **`3rd-review/lib/health-runner.mjs`** | 75 | 78–88 | **+3 ~ +13** | `:54` 由 `diagnose` 升级为可 `publish` |
| **`3rd-review/lib/provider-failure.mjs`** | 82 | 84–88 | **+2 ~ +6** | `structuredCodes`（`:3-22`）加 `PROCESS_STALLED` |
| **`3rd-review/lib/process.mjs`** | 163 | 165–175 | **+2 ~ +12** | 诊断→终态的传递 |
| **`3rd-review/lib/runtime.mjs`** | 260 | 268–285 | **+8 ~ +25** | 心跳字段与过期判定 |
| **`3rd-review/lib/config.mjs`** | — | — | **0** | **只读**：v4 已废除 elapsed-time 终止（`idle_timeout_ms`/`max_duration_ms`/`deadline_ms` 出现即 `CONFIG_INVALID`，`max_wall_clock_ms` 恒 `null`）；本卡**不得**恢复任一 elapsed-time 字段 |
| **`3rd-review/docs/adr/0001-v4-cli-contract.md`** | 174 | 174–180 | **0 ~ +6** | 方向修正标注 |
| **`3rd-review/docs/archive/2026-07-12-v3-redesign-design.md`** | 419 | 419–425 | **0 ~ +6** | 同上（归档件加 superseded 标注，不重写） |

- **本卡主仓净减约 −100 ~ −160 行**（不含测试文件处置；含则 −140 ~ −290）。跨仓净增约 **+31 ~ +108 行**。
  - 跨仓正行数**必须单列**，不与主仓 M4（git 净行数为负）混算 —— M4 的口径是主仓 git 净行数。**已定死（不再留成「需一次裁定」）**：**M4 只计主仓 git 净行数**；跨仓行数**不计入 M4**，只在 C4 的 §18 单列并计入「跨仓交付项」清单（D-030⑤ 已把它定为明确交付项，故不需要用 M4 再证明一次）。
  - 父材料争议值：`runtime/stage/stage-content-contracts.mjs` 实测 **6,806 行**（本卡不碰它，C4 只在 C5 语境下引用）。

---

### 需要裁定的新增矛盾 · 任务Ⅱ-A（C9 / C4）

| # | 矛盾 / 残留 | 父材料或地图原文位置 | **HEAD 实测** | 建议裁定 |
| --- | --- | --- | --- | --- |
| **X30** | `review_origin` 字段**在 HEAD 完全不存在**，D-005/D-021①/D-029③ 都按「已有 4 值枚举、补第 5 值」表述 | `decision-log.md:1077`（D-005②）、`:1461`（D-021①）、`:929`（D-029③） | `grep -rn "review_origin" .`（排除 `.git/`、`node_modules/`）→ **0 行**；大小写变体 `reviewOrigin`/`review-origin` 亦 0。最接近的现存字段是 **`dispatch_state`**（值域 `dispatched` / `blocked_before_dispatch`；`reused` 仅出现在返回值 `review-record-route.mjs:890`；`legacy_unclassified` 为渲染回退 `:395`） | **改写 D-005②/D-021①/D-029③ 的措辞为「新增 `review_origin` 字段（5 值）」**，并在 C3 的 K2 字段表里登记。这不是「新增降级资格对象」（D-008④ 禁的是资格对象），但与 D-026② 的「零新对象」口径需一次显式裁定 |
| **X31** | D-026② 说「命令去重=复用现有 **fingerprint** 判定」 | `decision-log.md:1570` | HEAD **没有命令级 fingerprint**，只有两个不同东西：① `canonical-receipt-writer.mjs:299` `reusableTestCapture` + `:340`/`:776` 的 `command_hash = sha256(command)` —— 这是**已完成 receipt 的复用**（比对 `receipt.command !== command`），**不是**在途并发去重；② `review-record-route.mjs:317` `requestLockHash` —— 这是**审查请求**去重键，与 shell 命令无关。另 `specs/archive/wh-review-rebuild/spec.md` 等 23 处 `fingerprint` 命中**全部在 archive 或文档**，非生产实现 | **已由裁定 J-6 结案**：目标形态 = **(b) 已完成结果复用**（落点 `canonical-receipt-writer.mjs:299`，现有 `command_hash` 即判据）；**(a) 在途并发去重被否**（需新锁对象，撞 E-6 + D-013）。C9 §3/§5/§13 与 `C9-FR-2`/`C9-AC-6` 已同步；并发在途不覆盖 = 已知后果 |
| **X32** | 「删轮次预算」的实测执行点已漂移 | `decision-log.md:1188`（D-010 写 `review-record-route.mjs:804-805`）、`:49`（N-001-g 同引） | 实测：导入在 `:4`；**定义与判定在 `:886-893`**（`:891` 是 `REVIEW_RETRY_BUDGET_EXHAUSTED` 拒绝分支）；`REVIEW_RETRY_BUDGET_UNKNOWN` 在 `:855-856`；第二消费点 `stage-handlers.mjs:2338-2343` | C4 与 C7 一律改用实测行号；D-010 正文行号标为过期 |
| **X33** | D-030② 说 `outcome:"stalled"` 是「broker 已预留」（`broker.mjs:75,1335`），「三段已就位、只差接线」 | `decision-log.md:1805`（D-030②）、`:1817`（未决项） | 行号过期：`workflowHubV2Outcomes` 在 **`broker.mjs:97`**；`outcome` 计算在 **`:1349`**。**更关键**：`codes.has("PROCESS_STALLED")` **永不为真** —— `PROCESS_STALLED` 只在 `health-runner.mjs:54` 经 `diagnose()` 上报（不是 `publish()`），经 `process.mjs:76` → `broker.mjs:988`/`:1199` 只写入 `touch({last_health_diagnostic})`，**从不进入 `providers[].error.code`**；且它不在 `provider-failure.mjs:3-22` 的 `structuredCodes` ⇒ 需要 **3 处**（枚举 + 诊断转终态 + 走到 `error.code`），不是「只差接线」。**另需确认**：managed 走 v2（`broker.mjs:633` 强制 v2；`review-provider-client.mjs:474` 发 v2）⇒ `#finish` 走 `:1347-1352` 的 legacy-v4 分支，`stalled` 确实落在 managed 可达路径上（结论对，理由与父材料不同） | C4 按 3 处实现；D-030② 的「只差接线」表述需更正为「三处接线 + 一处枚举」 |
| **X34** | `stalled` 的下游落点，父材料只点了 `review-result.mjs` | `decision-log.md:1806`（D-030③①） | 实测**两处**都缺：① `skills/wh-review/scripts/review-result.mjs` 的 `FAILURE_CATEGORIES`（`:145-167`）无 `stalled`（且 `grep -rn "stalled" skills/wh-review/scripts/*.mjs` 全仓只 1 命中 = `review-provider-client.mjs:122`）；② **`runtime/review/schemas/attempt.schema.json:193`** 的 `coverage.group_outcome` 枚举是 `["completed","partial","unavailable","cancelled"]`，**无 `stalled`**。已接受 `stalled` 的只有 `review-provider-client.mjs:122` 的 `managedOutcomes` 与 `:360` 的 `validateManagedGroup` | C4 的 AC-13 按**三处**判（已是 1 处 + 需改 2 处） |
| **X35** | 「沉默不杀进程」的原文位置 | `decision-log.md:1817`（D-030④ 与未决项写 `docs/adr/0001-v4-cli-contract.md:123`） | ① 该文件**不在主仓**（主仓 `docs/adr/` 实测 **30 个 `.md`**，无 `0001-v4-cli-contract.md`）；在 **`/Users/Hugh/Hugh/Project/3rd-review/docs/adr/0001-v4-cli-contract.md`**（174 行）。② **`:123` 的原句不是「沉默不杀进程」**，而是「恢复过程由 managed session、provider process 和 health guardian 的真实活跃、失联、退出或失败事实裁决，不使用 adapter 固定总时限或 idle 时限。」（`:122-123`）。③ **真正的「沉默不杀进程」原文**在 `3rd-review/docs/archive/2026-07-12-v3-redesign-design.md:20`：「沉默只产生 `idle_warning`/`stalled_suspected`，不自动杀进程、不自动重新派发同一任务」（同义见 `:216`、`:235`） | D-030④ 的修正目标写成「3rd-review 仓 2 个文件、4 处行号」，并标注主仓无此 ADR |
| **X36** | `runtime/stage/stage-content-contracts.mjs` 行数 6,485 vs 6,806 | `map-v1.md:189`（G-6）、`:199`（X2）；`decision-log.md:1599` 附近 vs RK-4/OPN-3 | **实测 `wc -l` = 6,806**（`runtime/stage/stage-content-contracts.mjs`）⇒ **RK-4/OPN-3 的 6,806 正确**，R-008 表/D-027③ 的 6,485 过期（与 N-001-z 的 HEAD 重测一致，`decision-log.md:885`） | 裁定 E 可立即结案：**唯一值 = 6,806**，C0 无需重测此项 |

（本轮未发现的其它可疑行号：`map-v1.md` 与 `decision-log.md` 中 C4/C9 之外的条目未逐条核验，本次只核了本两张卡的点名行号。）

#### 裁定 G（新，本次给出裁定值）：`review_origin` 是「新增持久化字段」还是「既有枚举补值」

**独立复核发现（X30）**：`review_origin` 在 HEAD **全仓 0 命中** —— 它不是「已有 4 值枚举、补第 5 值」，而是一个**全新字段**。这与排除项「不新增持久化对象」正面冲突；原稿把它留成「需一次显式裁定」等于**变相延期**。

**裁定值**：**`review_origin` 不算「新增持久化对象」**。理由与边界：

1. **「对象」指独立的持久化对象 / 文件 / schema / public command / 状态机**（母材料 R-008 点名的对象族就是这个粒度：`index.json`、`quality/verify.json`、product-release 投影、`stage-outcome-proofs/**`……）。**K2 行内的一个字段不属于该粒度**。
2. 该字段是**已确认方向的直接要求**：D-005② 的完成判据必须能区分「审查真做过 / 不可用 / 没跑 / 降级」，用户在 Talk round 4 明确「**用字段承接，不要用状态机承接**」。不给字段，D-005 无法落地。
3. **因此「不新增持久化对象」保持不变**，`review_origin` 作为 **K2 行字段**落地；**C7 必须把这条区分写进宪法负向条款**（「字段 ≠ 对象」），否则下一次还会撞同一个歧义。
4. **不做的事**：不为它新增独立文件、schema 文件、public command 或状态机；不建第二份 review 事实对象（K7 已定：原始结果进 K5，K2 行只记 `review_origin` + `review_result_ref`）。

**连带影响**：C9-FR-6（provider 生命周期）的落点随之确定 —— 由 **C4** 承接（与 D-030 同批），**C9 不再持有该条**；C9 的 oracle 与第 16 字段据此更新，**`X30` 关闭**。

#### 裁定 H（新，本次给出裁定值）：C1 删除清单与已确认地图的冲突 —— **以 HEAD 实测为准**

**独立复核发现（X20 / X22 / X25）**：C1 卡「范围」明确**不删** `stage-outcome-proofs/**`、`workflow-evolution.mjs`、protocol-error 白名单，但三者仍被登记为「待裁定的 X20 / X22 / X25」，**只有建议值、没有真裁定**；而已确认地图的 C1 清单仍按母材料 D-018① / D-029⑯ 的口径把它们列进删除面 → **卡片与地图直接冲突**。

**裁定值：以实测为准 —— 这三项都不在 C1 删除。**

1. **判据**：D-013 / D-011③ 的删除判据是「**没有真实 consumer 就删**」。三者**有**真实 consumer，故**不满足删除判据**。
2. **母材料与地图的清单是未复核判断**：D-018①（母材料 L1382）与已确认地图 `map-v1.md` 的 C1 清单基于「无 reader」的**未复核判断**；该判断现被 **HEAD 实测推翻**（证据见第 3 条）。
3. **HEAD 实测证据**：
   - `stage-outcome-proofs` —— **3 处活生产引用**：`runtime/stage/stage-agent-outcome-adapter.mjs:278`（**写**）、`runtime/stage/stage-runner.mjs:92-100`（**读** + 正则校验 + `validateStageOutcomeProof`，**读不到即 `throw outcomeError`**）、`runtime/evidence/canonical-evidence-validators.mjs:53`（ref 形状校验）。
   - `workflow-evolution.mjs`（真实路径 `runtime/evidence/workflow-evolution.mjs`，1,448 行）—— **6 个生产 importer**：`stage-reflect.mjs`、`append-lesson-observation.mjs`、`build-reflection-page.mjs`、`derive-consumption-edges.mjs`、`generate-iteration-brief.mjs`、`record-evolution-result.mjs`。
   - protocol-error 白名单（真实路径 `runtime/stage/protocol-error-whitelist.mjs`，216 行）—— 被 `runtime/stage/stage-runner.mjs:25`（import）、`:943`、`:2500` **活调用**。
4. **地图 C1 的「结果」据此改写**为：「与 `task-store.mjs` 无关、**且经 consumer 扫描确认无真实 consumer** 的叶子不再占地方」。本 PRD 的「任务地图」表与 C1 卡的「结果与 consumer」字段已按此改写。
5. **这不是推翻用户的裁定方向**：用户要的是「**删没人看的**」，不是「删这三项」。本裁定只是把清单换成**经 HEAD 实测的**那一份（X22 已实测「父材料五项计数全部无法复现」，故清单必须以实测值为准）。
6. **连带**：
   - `stage-outcome-proofs/**` **终局由裁定 J-4 定死 = 保留（归 K5），不在 C1、也不在 C3 的删除面**；`stage-outcomes/<stage>/*.json` 才走「先迁移到 K2 行再删」（属 C3）；「自动重发组」这一对象在 HEAD 无法具名，C1 **不得按此名目删除**（X25）。
   - **C8 §18 的验收清单必须改用各卡实测值**：12 个零代码引用 schema（全口径零引用为 0，共 35 个 schema）/ `STAGE_REFLECTION_REF` ×5（3 种不同正则）/ stage-outcome 形状校验 ×6 / `/^[a-f0-9]{64}$/` 107 处 55 文件 / `index.json` 6 写点 6 读点 / `quality_gaps` 10 处 / `validateRiskCloseQualityReasons` `:1763`（`:1772` 是抛错行）—— **不得沿用母材料旧值**；C8 §6(a) 的「必须留在表外的活对象」清单与本裁定一致。

#### 裁定 I（本次追加）：R-014 / R-015 的分派——已覆盖的不重复登记，只补具名形态

**来源**：R-014 / R-015 是 **build-prd 阶段由用户追加**的需求（**不是 make-decision 阶段的产物**，母材料 `decision-log.md` 里没有这两条）。用户选择「**按收敛后的形态加**」。本裁定把它们**分派到已有卡**，**未新增卡、未新增持久对象**。

**I-1（R-014 的一半已被覆盖，不重复登记）**：R-014 的「**只有越界时才重跑完整审查**」与母材料 **D-022③ 逐字对应**（「只有**大改动**（跨越原审查覆盖面：接口、schema、安全边界、公共契约）才允许一次 focus 复审」，`decision-log.md:1482`），且 **D-029 批次④ 第 3 条**已要求「写死『大改动』的**判定人与误判后果**」（`decision-log.md:1653`，落点 `C4-FR-1`）。→ **不重复登记**，已在 **C4** 范围内。新增的**只有**「focus 复审的**最小输入形态**」（I-5 第 1 行）。

**I-2（R-014 的动机句由 C5 消灭，禁止为它造机制）**：R-014 的动机「材料一改，审查结果立刻过期」**就是哈希失效链**，而 **C5 整张卡的功能就是删它**（D-009①；用户原话「去掉哈希，不要改一点就变一下」）。C5 成立后，修 finding **不会**让审查结果 stale。→ **不得新增任何「防 stale」机制**；违者撞 **D-013 零新产物守卫**。

**I-3（三处已覆盖，只补具名形态）**：R-015 的 ①②③ 已由 **K9**（原始输出按引用进 K5；K2 行只记命令 + 退出码；不新建测试记录对象）、**K5**（按引用存在，不再是 14,942 个自证文件）、**D-003**（删「每步完成证据」体系）、**批次⑨**（同命令去重＝同输入不重复启动）、**C5**（绿灯不失效、不自动重跑）覆盖。→ **只补三处具名形态**，见 I-5 的落点表。

**I-4（R-015④ 跨阶段复用：能复用什么、不能复用什么 —— 这条最容易做错）**：

先分清**两类审查根本不同**（实测）：

| | build-code 的 Phase review | verify-code 的 review |
| --- | --- | --- |
| 工具 | wh-review（`build-code/phase` track） | **`dsh-code-review` + 一次异源代码 review**（`docs/standard-workflow.md:18`、`:88`） |
| 对象 | **该 Phase 的 diff** | **当前实现**（`docs/standard-workflow.md:31`：当前实现 / 真实 consumer / 相关测试上下文 / 代码风险） |
| lens（实测 `runtime/review/stage-materials.json`） | `problem_order = ["spec_conformance","correctness","necessity"]` | `problem_order = ["implementation","consumer","correctness","lifecycle_security","test_strength"]` |

**因此「verify 又做一遍」有一半是设计使然**（对象与工具都不同），**不能简单用「复用」把它砍掉**。真正能消除的浪费是另外两件：

1. **Phase review 的产物没有任何消费者** —— 它的 findings + 处置**应当成为 verify 的输入**（verify 读 `review_result_ref` 指向的 **K5 原始结果**），这样 verify **不必重新审理同一批 finding**，只需处理「Phase review 没覆盖的维度 + 跨 Phase 的整体一致性」。这符合 **K7**（「保留审查原始结果文件（K5），K2 行只记 `review_origin` + `review_result_ref`；不再有 receipt/review fact 三件套」）。
2. **重叠维度的重复取证** —— Phase review 与 verify 都看的维度（如 `correctness`），其**证据按引用复用**，不重新打包。

**必须保留**：verify **自己的** `dsh-code-review` 审查与那**一次异源代码 review**（per-stage 审查标准是用户明确要求保留的，母材料 `## 非目标`）。**不得**以「复用」为名取消或降级它。

**判据（可执行）**：verify 的输入里**必须出现** Phase review 的 `review_result_ref`（读得到文件）；verify 的结论里**必须显式说明**「哪些 finding 来自 Phase review 的既有结论、哪些是本阶段新发现」。

**I-4b（事实登记，供 C4 引用）**：`docs/standard-workflow.md` 明写 verify-code **不调用 wh-review**、改用 `dsh-code-review` + 一次异源代码 review（`:18`、`:88`），对象是**当前实现**（`:31`）。因此 C4 在写「跨阶段复用」时**不得**把 verify 的 review 当成 wh-review 的第二次调用 —— 那是两个不同工具。若 C4/C7 同期要改这条流程口径，必须**显式登记并取得确认**，不得默认改写。

**I-5（落点表，不新增卡）**：

| 追加项 | 落点 | 形态（必须写死） |
| --- | --- | --- |
| R-014 focus 复审的最小输入 | **C4** | **一次性组装、不落盘**：原 finding 的 ref + 受影响文件的最小 diff + 对应测试 + 当前源码树 + delta 验证结果。**做成落盘的持久对象即判不通过**（撞 D-013 + 裁定 G「字段 ≠ 对象」） |
| R-015③ Phase review 复用判据 | **C4** | 复用判据 = **输入未变**（具名：哪些输入、怎么判「未变」）；与 C5 的「绿灯不失效」一致 |
| R-015④ 跨阶段复用 | **C4** | verify **读 Phase review 的 `review_result_ref`**（指向 K5 原始结果）；去重只限**重叠维度**；verify 自己的 `dsh-code-review` 与那一次异源代码 review **保留** |
| R-015① 简短失败签名形态 | **C3** | 写进 **K2 行字段表**：命令 + 退出码 + **失败签名**（简短、可复现的判据）；原始输出**按引用进 K5**，不复制成长期证据包 |
| R-015⑤ 宿主机 worktree 增殖 | **C7** | 见 I-6，按 `non_goals` 登记 |

**I-6（宿主机 worktree 增殖不在本仓范围）**：实测 `runtime/task/workspace.mjs:419` 的注释是 `/** Create or validate the ONE deterministic worktree for this task. */`，`execFileSync("git", ["worktree","add",...])` 在 `runtime/task/workspace.mjs:435`，且 **`git worktree add` 在生产代码里全仓只有这一处**（其余命中全在 `tests/**` 与 `core/__tests__/`）；当前 `git worktree list` = **14 棵**（其中 6 棵在 `~/.codex/worktrees/`）。→ workflowhub **每个任务只建一棵确定性 worktree**；「好几十棵」是**宿主（codex / claude）每个会话或 phase 各建一棵**的行为，属**仓外**，与 D-026③ 已登记的宿主/broker 缺口同类。→ **按 `non_goals` 登记 + 写明影响面**（落 C7），**不在仓内造机制去治宿主行为**。

**I-7（本裁定的负向边界）**：**不新增卡、不新增持久化对象、不新增 schema 文件、不新增 public command、不改 per-stage 审查标准**。任何执行者若为落实 R-014/R-015 而新增上述任一，即判不通过。

#### 裁定 J（本次追加）：把 6 处「实现关键选择菜单」改成**路线**

**来源**：第二个真实异源审查（17 条 findings，其中 **blocking 5 / major 10 / minor 2**）指出本 PRD 仍把实现关键选择留成菜单 —— 这正是用户最初的抱怨。本裁定把下列每一处**选一个**，写明理由、被否选项与后果。**J-1 ~ J-9 是路线；J-10 是唯一需要用户回答的那一个问题。**

**J-1（`review_origin` 第 5 取值定稿）**：字面量名 = **`dispatched_uncollected`**，语义 = 「**已派出且 provider 已产出，但调用方未收取 / 未收齐**」（D-021① 实测的 X1 情形：既非 `conducted` 也非 `not_run`）。5 个取值 = `{conducted, unavailable, not_run, same_source_degraded, dispatched_uncollected}`，**在「共享定义 · 术语」处定稿**，C4-FR-1 与 C4-AC-6 只引用、不再自行定义。**被否**：`unknown` / 开放字符串（C4-AC-6 已判失败）；`partially_collected`（易与「部分收到」混淆，而实测情形是**已产出但未收取**）。

**J-2（K2 行的行型与 `non_stage` 口径定死；归属前移到 C3）**：

1. **行型**：`facts.jsonl` 有且仅有 `record_kind:"stage"` 与 `record_kind:"close_action"` 两型（见术语）。**close 的五个动作行 = K2 的 `close_action` 行，是 K2 行的一种**；「每 stage 一行」是行型 ① 的唯一性约束，与行型 ② 不冲突。被否：为 close 另建文件（撞 K10「一个执行记录文件」与 D-013）；把 5 个 close 动作塞进 stage 行（违反 K8 的逐动作结果）。
2. **`non_stage`（build-prd 类）的 K2 行口径：进 `facts.jsonl`，不扩 5 阶段谓词面。** 具体：`validateFact`（`task-store.mjs:291`）的 `STAGES.has(stage)` 改为 `STAGE_KEYS.has(stage)`，`STAGE_KEYS = STAGES ∪ NON_STAGE_WORKFLOWS`，`NON_STAGE_WORKFLOWS = ["build-prd"]`（**只登记已存在的非阶段工作流，不新增第六 stage**）；**5 阶段完成谓词与 `status` 的 `stage_completion_missing:<stage> × 5` 仍只遍历 `STAGES`** ⇒ `non_stage` 行进得了记录、进不了谓词，与 C6-FR-8 / C6-AC-9 完全一致。**被否**：「不进 `facts.jsonl`」—— 它会让 planning close 的 K8 动作行与 `non_stage` 的事实**无家可归**，等于用「不进文件」把门禁问题换成「没有记录」，正面违反 K2/K8 与 D-017。
3. **归属前移（原 X-悬空）**：该口径**在 C3（任务Ⅰ）内闭合**，C3-AC-8 与 C3-FR-2/FR-9 直接引用本裁定；**C6-FR-8 只消费，不再「与 C3 同批二选一」** —— 原写法让任务Ⅰ 开工时校验契约悬空（C3 属任务Ⅰ、C6 属任务Ⅱ）。**C6 侧改动面 = 只把谓词遍历集合钉死为 `STAGES`**，不再决定 `non_stage` 写不写。

**J-3（`identity/path-cards/**` 的终局：删除）**：

- **裁定：删除**。`persistWriteBoundaryPathCard` 的**落盘分支**整段删除，连同 `TaskHandle.createPathCardRecord`（`task-handle.mjs:845`）与 `PATH_CARD_WRITERS`（`task-handle.mjs:886-893`）的路径门；删除侧族级清单的 `identity/**`（折入 K2）因此**真的清空**（不再留一个例外）。
- **理由（实测）**：① **零生产 reader、零测试引用** —— 全仓命中只有写者自己（`write-boundary-preflight.mjs:234,240`）与写门（`task-handle.mjs:845,887`）；`grep -rn "path-cards\|persistWriteBoundaryPathCard" tests/ core/__tests__/ skills/` → **0 命中**。② 它自己的文档注释即写明 `informational, append-only`、`Cards never participate in bootstrap or authorization`，卡片体里写着 `authority: "informational_only"` ⇒ 按 D-013「没有真实 consumer 就删」，它是一个**无 reader 的持久对象**。③ 它**不是**「待写字节」这项核对的载体：`:217` 的 `sha256(sourceRaw) !== source.hash` 校验的是**被引用的 source 记录的当前字节**，与卡片本身无关。
- **同步（不许放宽）**：第三项「待写字节」**保留且强度不变** —— 该校验改为在写口**内存内**做同一次比对（读 `source.ref` 当前字节 → 与声明的 `source.hash` 比对），**不符仍抛同一句 `path card source hash is stale`**。C5 的 §2 表第 3 项与第 12 项、`C5-FR-2`、`C5-AC-5`、§13 风险、§18 账目同步改写（`write-boundary-preflight.mjs` 与 `task-handle.mjs` 的净值从 `unknown` 改为负值）。
- **被否**：①「折进 K2 行」—— 写口每次写都产一张卡，而 K2 是**每 stage 一行**，折入会把行撑爆并让写者从「该 stage 主会话」变成写口本身；②「保留为工作文件」—— 它没有任何读者，保留等于把「一个执行记录文件」的承诺改成「一个记录文件 + 一堆没人看的工作文件」。

**J-4（`stage-outcome-proofs` 的终局：保留，归 K5；并定死 C1 最终清单的产出者与时点）**：

1. **终局 = 保留（不迁移、不删除）**，定性 = **K5「被引用的原始证据」**（按引用存在、以 `sha256` 命名、由 `stage-runner.mjs:92-100` 读 + 校验 + 读不到即 `throw`）。**与 K2 行的关系**：K2 行**只记 `ref` + `sha256`**（现有形态），**不复制 proof 内容**；D-029⑯ 的「阶段级 outcome 由 K2 行承接」只适用于 `stage-outcomes/<stage>/*.json`（status/acceptance 的真实输入），**不适用于 per-step 的 proofs**（粒度不同：一个 stage 一行 vs 每个 step 一份）。
2. **理由（实测）**：3 处活生产引用（写：`stage-agent-outcome-adapter.mjs:278`；读+校验+throw：`stage-runner.mjs:92-100`；形状校验：`canonical-evidence-validators.mjs:53`）；仓库内**不存在**该路径（只存在于 29 个历史任务、20,149 个文件，活目录漂移 G-5）。**被否**：迁移（要重写 stage 发布链的三处，并把 per-step 证据压成 stage 行 → 违净减法）；删除（`stage-runner.mjs:92-100` 读不到即 throw → 直接破坏发布链，裁定 H 已禁）。
3. **C1 最终具名清单的产出者与时点（原为「尚未定义」）**：清单是 **C1 的交付物**，由 **C1 在批次① 的 build-spec 阶段产出并冻结、随 C1 合入**；其**上限**已由裁定 H 写死（`stage-outcome-proofs` / `workflow-evolution.mjs` / protocol-error 白名单**不在**删除面），故 C8 可交叉核对；**C8 不得自带或自行编造清单**（C8-AC-1 已如此规定）。`stage-outcome-proofs` 在本清单中**固定写作「不删」**。
4. **连带**：`C1-FR-2`、C3 §4（新增保留条目）、C8 §6(a) 的「必须留在表外的活对象」四处同步为**同一句**：「保留为 K5，不在 C1/C3 删除面」。

**J-5（C5 `check-extensibility` 的 content-hash 度量：选 A —— 原样保留）**：

- **裁定：A（原样保留）**。它是**同进程、`runKernel` 之前抓取、调用之后比对**的自足检查（`createCoreSnapshot() :52-59` / `isCoreUnchangedFromSnapshot() :72-89`），**不持久化任何 baseline** ⇒ 它不是「改一点就变一下」的哈希失效链（这正是裁定 C 理由句被 X41/裁定 H 更正后的结论）。
- **理由**：① A 是**唯一不降低保护强度**的选项（保留「本次 dispatch 未改 runtime 字节」这条真断言）；② 零改动、零风险，C5 的 §18 该项从 `unknown` 变为 **0**；③ 其余候选都更差：B（`git status` 前后比对）会把合法脏工作树永久变红、仍需 baseline；C（`git diff <base>`）要持久化 base OID，**正面撞 D-024②「不冻结 base OID」**；D（mtime+size）会让 falsifiability 用例（`core/__tests__/check-extensibility.test.mjs:190-242` 的**原内容改写**）可能不变 ⇒ 守卫变恒真，违 F9；F（入库清单）每次合法改 runtime 都要重生成 ⇒ **变回失效链**。
- **后果（必须一并做）**：**C7-FR-8 的表述责任加重** —— 必须在宪法/文档里写清「**同进程 before/after 内容比对 ≠ 持久化哈希失效链**」，否则表述上仍像留着一套哈希度量；`C5-AC-7` 的可证伪要求不变。
- **需要用户点头的理由与问题见 J-10**（裁定 C 是用户已确认的地图裁定，把它落实为「保留」而不是「替代」，等于修正一条已确认决定的落地形态）。

**J-6（C9 的「同命令去重」：选 (b) 已完成结果复用）**：

- **裁定：(b) 已完成结果复用** —— 落点 `canonical-receipt-writer.mjs:299 reusableTestCapture` + `:340/:776` 的 `command_hash = sha256(command)`；同一 `command` 的第二次 `capture-tests` **回读既有 receipt、不启动子进程**。(b) **就是** 现有 fingerprint，因此 D-026② 的「复用现有 fingerprint 判定、不新增对象」只有 (b) 成立；且 `C9-AC-6` 的失败判据（`runWorkspaceCommand` 被调用第二次）**本来就是按 (b) 写的**。
- **被否 (a) 在途并发去重**（落点 `workspace-runner.mjs:215`）：它需要一个新的「活跃 attempt 锁」持久对象 ⇒ 正面对撞**已明确拒绝的 E-6**（`command fingerprint + active-attempt lock`）与 D-013 零新产物守卫。
- **后果（如实登记）**：同一命令**并发**在途时仍会各跑一次；本卡**不为它造锁**。C9 §3 第 2 条的「在途/已完成」改为只描述 (b)；C9 §13 的 R-4（「选错会把在途去重误做成结果复用」）改写为「已裁定为 (b)；并发在途不覆盖，属已知后果」。

**J-7（C6 的 canonical ref 集合与 `risk_close` 替代判据定死）**：

1. **canonical ref 集合（闭集，恰好 6 类，全部具名，禁止目录扫描）**：① `task.json`（K1）；② `facts.jsonl`（K2，含 `stage` 与 `close_action` 两型行）；③ `specs/<task-id>/{decision-log,spec,plan,tasks}.md`（K3，四份具名）；④ `quality/confirmations/**` 与 `quality/authorizations/**`（K4，按 ref 点名）；⑤ **被 K2 行 / close 动作行点名的 K5 原始证据**（按 `ref` 逐个点名，**不 `readdir`**）；⑥ 四份材料与 HEAD 的**具名 diff 输入**（close 的 commit 前四项前置检查按 ref 读）。**失败判据**：出现 `readdirSync` 扫目录决定读取来源，或出现第 7 类来源。
2. **`risk_close` 的替代判据（替换「与当前 `quality_gaps` 完全一致」）**：`risk_close.quality_reasons` **去重排序后必须与 `status` 根因行里登记的具名 ref 集合逐项全等**；空集仍抛 `delivery risk close requires at least one current quality gap`；不等仍抛错。**理由**：`quality_gaps` 是与 `release_gaps` 同源的**投影**（`stage-runtime.mjs:417-418`），C6 删它；替代物必须**同样是 fail-loud 的等值判定**，而不是「不再校验」。**仍会拦**（C6-AC-6 的失败判据「任意内容都能 close 成功」不成立）。**被否**：删掉该校验（C6-AC-6 判失败）；改判「非空即可」（放宽断言）；改读已删的 `quality/verify.json`（对象不存在）。

**J-8（统一 `STAGE_REFLECTION_REF` 正则定稿：取 (A) 即「含 verify-code + sha 段可选」）**：

1. **定稿字面量（唯一一条，5 处声明合并到这一条；定义点保持 `runtime/evidence/canonical-evidence-validators.mjs:12`，其余 4 处 import）**：

   ```text
   /^quality\/stage-reflection\/(?:make-decision|build-spec|build-plan|build-code|verify-code)(?:\/[a-f0-9]{64})?\.json$/
   ```

2. **为什么不是「5 个旧版的交集 / 最严」**：实测 5 处声明是 **3 种**互斥正则 ——
   - (A) 含 verify-code + sha 段可选：`canonical-evidence-validators.mjs:12`、`stage-handlers.mjs:181`、`stage-runner.mjs:48`（**3 处，逐字相同**）；
   - (B) 含 verify-code + **无** sha 段：`task-kernel-implementation.mjs:34`；
   - (C) **不含** verify-code + **强制** sha 段：`stage-handoff.mjs:17`。
   **(B) 与 (C) 的接受集无交集** ⇒ 「取交集」= 让**所有** ref 非法（含生产者自己的输出）。因此「最严」不可实现为交集，只能实现为「**与全部已知生产者输出相符的最小接受集**」，而那就是 (A)。
3. **与生产者的一致性（实测，证明 (A) 不是拍脑袋）**：真实生产者写两种形态 —— 无 sha 段的固定 ref（`stage-reflect.mjs:110` `quality/stage-reflection/${stage}.json`、`stage-runner.mjs:976` 同形）与带 sha 段的 ref（`stage-reflect.mjs:356` `.../${stage}/${hash(raw)}.json`、`:847` 同形）；且 `STAGE_REFLECTION_STAGES`（`stage-reflect.mjs:29-35`）**含 `verify-code`** ⇒ (C) 会把 `verify-code` 的**真实输出判为非法**，(B) 会把带 sha 段的**真实输出判为非法**。
4. **逐项回答「相对 5 个旧版是放宽还是收紧、会不会让原本非法的 ref 通过」**：
   - 对 (A) 的 3 处：**逐字等价**，不宽不紧、零影响。
   - 对 (B)（`task-kernel-implementation.mjs:34`）：**放宽** —— 原本被它拒绝的 `quality/stage-reflection/<stage>/<64hex>.json`（`stage-reflect.mjs:356,847` 的真实输出）现在通过。这是**修掉一个过窄实现**，影响面 = `:77` 的 `normalizeStageReflectionRef` 由「拒绝」变「接受」。
   - 对 (C)（`stage-handoff.mjs:17`）：**两处放宽、一处等价** —— ① 接受 `verify-code`（原本拒绝，但它是 `STAGE_REFLECTION_STAGES` 的合法成员）；② 接受无 sha 段的固定 ref（原本拒绝，但它是 `stage-reflect.mjs:110` 的真实输出）；③ 对 `.../<stage>/<64hex>.json` 形态等价。**仍拒绝**：大写 hex、非 64 位、多余路径段、`..` 穿越、5 个正式 stage 之外的名字。
   - **结论：放宽的两类都不是「语义外扩」，而是把 3 个实现中两个过窄者对齐到生产者契约**。
5. **连带（必须改，否则 AC 自相矛盾）**：`C2-AC-2` 的失败判据从「合并后的单一正则比原来**任一**版本更宽松」（字面不可满足）改为两条可执行判据 —— ① 与 J-8 第 1 条**逐字相同**；② 接受集**不得超出**「`<stage>.json` / `<stage>/<64hex>.json`」两种形态（`node -e` 用 6 个正例 + 6 个反例断言）。**这不是放宽 C2-AC-2，而是把它从不可执行改成可执行。**

**J-9（C0 的 M5 两项补齐：书面定义 + 可复算命令，不删指标）**：

- **M5-4「`validate`/`assert`/`check` 函数数」**：口径 = `runtime/` 内**函数声明**名以 `validate`/`assert`/`check` 开头的个数，命令 `grep -rhoE '(^|[[:space:]])(export[[:space:]]+)?(async[[:space:]]+)?function[[:space:]]+(validate|assert|check)[A-Za-z0-9_]*' --include='*.mjs' runtime/ | wc -l` → **229**；含箭头函数常量（`(export )?const (validate|assert|check)* =`，36 个）合计 **265**。**两个口径分别写死、不得混用**；父材料 288/301 标注为「旧口径、不可复现为同一 commit 的同一口径」（X18）。
- **M5-5「错误码数」**：**给出书面定义，不删指标**。默认口径 = **协议错误分类数** = `runtime/stage/protocol-error-whitelist.mjs` 的 `class_id` 去重数，命令 `grep -oE 'class_id: "[a-z0-9_]+"' runtime/stage/protocol-error-whitelist.mjs | sort -u | wc -l` → **16**（它与 X17 记录的「16 个 class_id」一致）。参考口径（**不作判据**）= `runtime/` 内全大写 SNAKE_CASE 字符串字面量去重数 → **122**。父材料的 **97 与 117 两者均不可复现**，永久标注为「不可复现」（X17）。**M5 仍是 5 项**，不因无定义而缩水。

**J-10（唯一需要用户回答的一个问题）—— ✅ 已由用户回答：接受 A**：

> **`check-extensibility` 的 content-hash 度量，是否接受按 J-5「原样保留」（不降低任何保护强度，只需 C7 在宪法/文档里写清「同进程 before/after 内容比对 ≠ 持久化哈希失效链」），而不改用更弱的替代判据？**
>
> **用户答复：「接受 A」。** 裁定 J-5 据此**定稿**：`check-extensibility` **原样保留、C5 不改它**；C7 负责在宪法/文档里写清「同进程 before/after 内容比对 ≠ 持久化哈希失效链」这条区分。裁定 C 的**方向（归 C5 处置）不变，落地形态定为「保留 + 写清区分」**。被否的 E（纯路由断言）不采纳。

**背景（一句话）**：裁定 C 是**用户已确认**的地图裁定，把它的落地形态从「换替代判据」定成「保留」，等于修正一条已确认决定的落地形态，故须用户点头（已完成）。**J-1 ~ J-9 均为本 PRD 自主给出的路线，不留待用户选择。**

---

## 实测记录 · 任务Ⅱ-A（C9 / C4）（命令原文 + 关键输出）

### A. 仓库与基线

```text
$ cd /Users/Hugh/Hugh/Project/workflowhub && git rev-parse HEAD
216a546d4ec33ca3804a188a14a9536a2968f77c
$ cd /Users/Hugh/Hugh/Project/3rd-review && git rev-parse HEAD
99d6a3c22ef8ee2fae7ec81f3d30bc208c6269fd
$ wc -l /tmp/wh-msd-build-prd/map-v1.md   →  243 /tmp/wh-msd-build-prd/map-v1.md
$ wc -l .../specs/workflowhub-mechanism-simplification-20260910/decision-log.md   →  1979
```

### B. 行数实测（`wc -l`，均为当前 HEAD；**控制面净增减申报的原始数据**）

```text
$ wc -l runtime/stage/stage-content-contracts.mjs
6806 runtime/stage/stage-content-contracts.mjs        ← G-6/X2 唯一裁定值（6,485 过期）
$ wc -l runtime/review/review-record-route.mjs runtime/evidence/stage-content-evidence.mjs \
        runtime/stage/stage-handlers.mjs runtime/evidence/canonical-receipt-writer.mjs \
        runtime/task/workspace-runner.mjs tools/cli/run-checks.mjs tools/cli/stage-runtime.mjs \
        vitest.config.mjs package.json
1257 review-record-route.mjs | 527 stage-content-evidence.mjs | 3956 stage-handlers.mjs
 870 canonical-receipt-writer.mjs | 222 workspace-runner.mjs | 304 run-checks.mjs
1095 stage-runtime.mjs | 41 vitest.config.mjs | 24 package.json
$ wc -l skills/wh-review/scripts/{review-materials,review-provider-client,review-result,review-runner,third-review-host-config,simple-review-runner}.mjs \
        skills/wh-review/{stage-skill-plan.json,manifest.json} runtime/review/schemas/attempt.schema.json
2225 review-materials.mjs | 642 review-provider-client.mjs | 366 review-result.mjs
 514 review-runner.mjs | 729 third-review-host-config.mjs | 1267 simple-review-runner.mjs
  89 stage-skill-plan.json | 58 manifest.json | 361 attempt.schema.json
$ cd /Users/Hugh/Hugh/Project/3rd-review && wc -l lib/broker.mjs lib/health-runner.mjs lib/provider-failure.mjs \
        lib/process.mjs lib/runtime.mjs docs/adr/0001-v4-cli-contract.md docs/archive/2026-07-12-v3-redesign-design.md
1354 broker.mjs | 75 health-runner.mjs | 82 provider-failure.mjs | 163 process.mjs | 260 runtime.mjs
 174 0001-v4-cli-contract.md | 419 2026-07-12-v3-redesign-design.md
```

### C. 「慢测试」真实证据（1,717.39 秒 / 900 秒的来源）

一手记录在 `specs/archive/workflowhub-make-decision-hardening/tasks.md`（`:325` 与 `:374`），与母材料数字一致：

```text
$ sed -n '374p' .../workflowhub-make-decision-hardening/tasks.md
:374: ... `npx vitest run tests/contract/decision-convergence-depth.test.mjs
      tests/contract/requirement-convergence-regression.test.mjs tests/contract/stage-completion.test.mjs
      tests/contract/test-runtime-profile.test.mjs tests/e2e/vnext-five-stage-current.test.mjs
      tests/integration/vnext-delivery-close.test.mjs tests/integration/vnext-official-stage-run.test.mjs
      --poolOptions.forks.singleFork --no-fileParallelism` — exit `0`, 7 files, 237 passed, 1 skipped,
      duration `1717.39s`. The official-stage file passed 94/94 in 743014ms; the current five-stage E2E
      passed 24/24 with 1 skipped in 459885ms; delivery-close passed 29/29 in 442689ms; the remaining
      contract files passed 114/114.
$ sed -n '325p' .../workflowhub-make-decision-hardening/tasks.md
:325: ... attempted with the declared command and a 900s outer timeout; it terminated with exit `124` ...
      Before timeout, `tests/integration/vnext-official-stage-run.test.mjs` completed `94 passed / 0 failed`
      in `744491ms`. A same-scope six-file split (omitting only that official-stage file) also terminated
      at the 900s timeout ... `tests/e2e/vnext-five-stage-current.test.mjs` completed `23 passed / 1 skipped
      / 0 failed` in `447272ms`, while the other five files had no terminal file-level result.
```

具名慢测试清单（7 文件，全部 `test -e` 实测存在）与逐文件历史耗时：

| 文件 | 行数 | 历史耗时 |
| --- | --- | --- |
| `tests/integration/vnext-official-stage-run.test.mjs` | 2450 | 743,014 ms（94/94） |
| `tests/e2e/vnext-five-stage-current.test.mjs` | 1388 | 459,885 ms（24/24 + 1 skipped） |
| `tests/integration/vnext-delivery-close.test.mjs` | 700 | 442,689 ms（29/29） |
| `tests/contract/decision-convergence-depth.test.mjs` | 330 | 其余 4 文件合计 114/114，未逐文件计时 |
| `tests/contract/requirement-convergence-regression.test.mjs` | 553 | 同上 |
| `tests/contract/stage-completion.test.mjs` | 443 | 同上 |
| `tests/contract/test-runtime-profile.test.mjs` | 240 | 同上 |

旁证：`specs/archive/workflowhub-execution-acceleration-20260909/decision-log.md:23`「单测试集合 600–900s；45 次正式测试约 203 分钟」（该任务标 `deferred（DEFER-S3）`）；`specs/archive/workflowhub-review-flow-repair-20260906/decision-log.md:33`（F-005：provider 180s / broker 600s / aggregate 上限 900s）。

### D. 三层节奏是否存在（实测）

```text
$ grep -n "TEST_RUNTIME_PROFILE" runtime/stage/stage-content-contracts.mjs
:57:export const TEST_RUNTIME_PROFILE_NAMES = Object.freeze(["inner", "medium", "large"]);
:58:export const TEST_RUNTIME_PROFILE_LIMITS_MS = Object.freeze({ inner: 60_000, medium: 300_000, large: null });
$ sed -n '96p;115p' tools/cli/run-checks.mjs
:96:  if (!new Set(["inner", "medium", "large"]).has(runtimeProfile)) throw new Error("runtime profile must be inner, medium, or large");
:115:  const ceiling_ms = runtimeProfile === "large" ? 900_000 : { inner: 60_000, medium: 300_000 }[runtimeProfile];
$ grep -rn "phase tier\|aggregate tier" --include=*.mjs --include=*.json .
(无命中)  ⇒ "phase"/"aggregate" 在仓库零命中，需写死映射
$ grep -n "runtime-profile" package.json
(无命中)  ⇒ profile 模式不在 npm test 链上（死代码风险 R-2）
$ node -e "console.log(JSON.stringify(require('./package.json').scripts,null,2))"
{ "check": "markdownlint-cli2 \"**/*.md\" && node tools/cli/verify-structure.mjs && node tools/cli/run-checks.mjs && npm run check:skill-closure && npm run smoke:skill-packages",
  "check:skill-closure": ..., "smoke:skill-packages": ...,
  "test": "npm run test:safe && npm run test:exclusive",
  "test:safe": "vitest run --exclude=core/__tests__/check-extensibility.test.mjs --exclude=core/__tests__/check-anti-host.test.mjs",
  "test:exclusive": "vitest run core/__tests__/check-extensibility.test.mjs core/__tests__/check-anti-host.test.mjs --poolOptions.forks.singleFork --no-fileParallelism" }
```

真实 profile 调用先例（证明该模式可用）：

```text
$ sed -n '48p' specs/archive/workflowhub-execution-acceleration-20260909/tasks.md
:48: node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p1-profile.json -- npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/test-runtime-profile.test.mjs tests/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
```

### E. 同命令去重 / fingerprint（实测）

```text
$ grep -rn "fingerprint" (全仓，排除 node_modules/.git) | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -3
     23 ./specs/archive/wh-review-rebuild/spec.md
     12 ./tests/contract/test-runtime-profile.test.mjs
     12 ./runtime/stage/stage-content-contracts.mjs
⇒ 生产代码里没有 "command fingerprint" 这个东西；高命中全在 archive/文档。
$ grep -n "command_hash\|FULL_TEST_COMMAND\|function reusableTestCapture" runtime/evidence/canonical-receipt-writer.mjs
:19:const FULL_TEST_COMMAND = "npm test";
:299:function reusableTestCapture({ task, workspace, snapshot, stage, component, command, receiptRef, ... }) {
:340:        || typeof receipt.command_hash !== "string" || receipt.command_hash !== sha256(command)) {
:776:          producer: { stage, component, version }, command, command_hash: commandHash, exit_code: exitCode,
⇒ 现有可复用的是【已完成 receipt 的 command_hash 比对】，不是命令级指纹，也不是在途并发去重。
$ grep -n "function requestLockHash" -A 12 runtime/review/review-record-route.mjs
:317:function requestLockHash(request, materialId, routeIdentity) { const stable = { stage, review_track,
      review_kind, review_scope, subject, subject_kind, phase_id, route_identity, host_provider,
      material_id, authenticated_evidence_sha256 }; return textHash(canonicalJson(stable)); }
⇒ 这是【审查请求】去重键。
$ grep -n "function findReusableReview" -A 20 runtime/review/review-record-route.mjs
:353:function findReusableReview({ history, request, identity, materialId, requestKey }) {
     比对字段：stage / review_track / review_kind / phase_id / subject_kind / request_key
```

### F. 超时保留已完成部分（实测）

```text
$ grep -n "TEST_CAPTURE_TIMEOUT_MS\|MAX_TEST_CAPTURE_TIMEOUT_MS\|write(outputRef, output)\|write(receiptRef, raw)" runtime/evidence/canonical-receipt-writer.mjs
:24:export const TEST_CAPTURE_TIMEOUT_MS = 10 * 60 * 1000;
:25:const MAX_TEST_CAPTURE_TIMEOUT_MS = 15 * 60 * 1000;
:744:          status: "failed", category: "test_timeout", code: "TEST_CAPTURE_TIMEOUT", exit_code: exitCode,
:773:        write(outputRef, output);
:795:        const raw = `${JSON.stringify(receipt, null, 2)}\n`; write(receiptRef, raw);
⇒ 超时（proc.error.code === "ETIMEDOUT"）仍会写 output 与 receipt。丢结果的唯一路径是【外层 kill 整个 harness】。
$ grep -n "export function runWorkspaceCommand" runtime/task/workspace-runner.mjs
:215:export function runWorkspaceCommand(workspace, command, args = [], options = {}) {
⇒ 唯一进程启动点（spawn :168 / spawnSync :52），preflight 与去重的自然插入点。
$ grep -n "#store(runtime_id, entry, result, privateResult = null)" 3rd-review/lib/broker.mjs
:1333:  #store(...) { ... updateRuntime(..., providers: { ...next.providers, [entry.id]: { ...next.providers[entry.id],
        provider: entry.id, tier: entry.tier, ...result, ...(privateResult ?? {}), completed_at_ms: Date.now() } }) }
⇒ 每个 provider member 完成即写 runtime 私有状态（不等整组）。事故 22 条 finding 正是从
   /tmp/3rd-review/<run>/managed/public.json 与 provider session jsonl 恢复（decision-log.md:205），
   证明 member 落盘点在真实事故中确实存活。
```

### G. preflight / dispatch_state / 错误文案（实测）

```text
$ sed -n '518,530p' tools/cli/stage-runtime.mjs
:518:function preflightDiagnostic(error) { ... return { path: "$", expected: "valid stage payload", actual: error?.message ?? String(error) }; }
:527:function runPreflight(stage, input) { validateStageInvocation(stage, input); return { status: "valid", diagnostics: [] }; }
⇒ preflight 命令存在但【不校验命令存在性 / 路径存在性 / provider-host 能力 / packet 体积】。AC-8 现状必然失败。（**:525 是 `preflightDiagnostic` 的收尾 `}`**；函数实测在 `:527`，`sed -n '518,528p'` 的原记录截断了它，已按 HEAD 更正）
$ sed -n '606,617p' tools/cli/stage-runtime.mjs
:606:  if (command === "preflight" || (command === "run" && values.action === "preflight")) {
:610:    if (!new Set(["build-code", "verify-code"]).has(values.stage)) throw new TypeError(...);
:616:      if (error?.preflight_protocol === true) return { status: "protocol_invalid", diagnostics: [preflightDiagnostic(error)] };
⇒ 可复用：返回形状 {status, diagnostics[{path,expected,actual}]} + stage 白名单 + input 必填。
$ grep -rn "blocked_before_dispatch" runtime/ skills/wh-review/scripts/ (排除 __tests__) | wc -l
12   ⇒ 既有字面量可直接复用（D-026② 明文）
$ grep -rn "MATERIAL_FORBIDDEN\|MATERIAL_TOO_LARGE" runtime/review/ skills/wh-review/scripts/
review-materials.mjs:467,547,564,774,1833,1942,1944,1950  MATERIAL_FORBIDDEN（8 处）
review-materials.mjs:2162-2163  MATERIAL_TOO_LARGE: review packet exceeds 330 KiB after content deduplication and semantic slicing
⇒ packet 体积的既有文案与阈值（330 KiB）就是 preflight ④ 的现成依据。
$ grep -n "export function doctorCapabilities" runtime/evidence/capability-doctor.mjs
:16:export function doctorCapabilities({ manifest, activeConditions = [], probes = {}, commands = {}, run = spawnSync } = {}) {
⇒ provider/host 能力的既有探测实现。
```

### H. packet 组装缺 `skills/` lens（实测）

```text
$ grep -rn 'write(bundleRoot, `skills/' --include=*.mjs .   (排除 node_modules)
./skills/wh-review/scripts/review-materials.mjs:2115:    write(bundleRoot, `skills/${skill}/SKILL.md`, readRegisteredFile(resolve(workflowhubSkills, skill, "SKILL.md"), `${skill} skill`));
⇒ 全仓【唯一一处】写 skills/ lens。
$ sed -n '2112,2115p' skills/wh-review/scripts/review-materials.mjs
:2112:  const selectedSkills = [...(stagePlan?.required_skills ?? []), ...];
:2113:  if (["build-code", "verify-code"].includes(stage) && (stagePlan.required_skills ?? []).length === 0) throw new Error(`MATERIAL_INCOMPLETE: ...`);
:2115:    write(bundleRoot, `skills/${skill}/SKILL.md`, ...);
$ sed -n '207,209p' tools/cli/stage-runtime.mjs
:207:function isIntegrationReviewRequest(request) {
:208:  return request?.stage === "build-code" && (request.review_scope ?? request.reviewScope ?? null) === "integration";
$ sed -n '883,899p' tools/cli/stage-runtime.mjs
        runRound: ... useTaskBoundIntegrationBundle ? runTaskBoundIntegrationReview : runSimpleReview,
        materialIdForRequest: ... useTaskBoundIntegrationBundle ? (request) => prepareBundle(request).materialId
                                                        : (request) => createSimpleReviewPacket(request).material_id,
⇒ buildReviewMaterials 在 stage-runtime 侧【只被 integration review 调用】；make-decision direction/detail
  走 useTaskBoundIntegrationBundle=false ⇒ 走 createSimpleReviewPacket ⇒【完全不经 buildReviewMaterials】⇒ 不写 skills/。
$ sed -n '492,520p' skills/wh-review/scripts/simple-review-runner.mjs
export function createSimpleReviewPacket(input) { ... materials: Object.entries(packetMaterials).map(...) ... }
⇒ 只把调用方传入的 materials 映射进 packet，不新增任何 skills/ 条目。
⇒ 【结论】"packet 组装缺 skills/ lens" 的精确位置 = review-materials.mjs:2115 的写入路径只在
   build-code/integration 可达；make-decision detail（及 build-spec/build-plan/verify-code/build-code phase）全部拿不到。
$ sed -n '32,35p' skills/wh-review/manifest.json  &&  sed -n '4,21p' skills/wh-review/stage-skill-plan.json
manifest.json:33:  "direction": ["intake-decision-review", "plan-ceo-review", "review"],
manifest.json:34:  "detail":    ["simplicity-guard", "plan-ceo-review", "review"]
stage-skill-plan.json:14-20: "detail": { "required_skills": ["simplicity-guard","plan-ceo-review","review"],
                             "review_mode": "lens-only", "lens_owner": "wh-review", "lens_dispatch": "delegated",
                             "delivery_mode": "file_only" }
⇒ 声明层是齐的；缺的是调用链。修法应为「让非 integration 路径也经 buildReviewMaterials」或
  「在 createSimpleReviewPacket 侧补 lens」，二者选一，都零新对象。
$ for s in simplicity-guard plan-ceo-review review; do test -e "skills/$s/SKILL.md" && echo "EXISTS $(wc -l < skills/$s/SKILL.md) skills/$s/SKILL.md"; done
EXISTS 97 skills/simplicity-guard/SKILL.md | EXISTS 30 skills/plan-ceo-review/SKILL.md | EXISTS 31 skills/review/SKILL.md
```

### I. 异源按底层模型 / 去重键 / 预算 / 追零（实测）

```text
$ grep -n "function sameSourceProfile" -A 5 skills/wh-review/scripts/third-review-host-config.mjs
:642:function sameSourceProfile(_config, provider, hostProvider) {
:643:  // WorkflowHub route/profile keys are the only configured dispatch identity.
:644:  // Broker identity.source_id remains result provenance and is validated at
:645:  // the public result boundary; it is not a second pre-dispatch config gate.
:646:  return provider === hostProvider;
⇒ 现状 = profile 键的精确字符串相等（与 D-029⑮ 描述一致）。
$ sed -n '701,703p' skills/wh-review/scripts/third-review-host-config.mjs
:702:    const distinctAdapters = new Set(selected.map((provider) => adapterOf(provider, "3rd-review provider"))).size;
:703:    if (configuredRoute && distinctAdapters < minimum) throw new Error("wh_review route has insufficient enabled heterologous providers");
⇒ 预派发门槛按【adapter】去重（adapterOf at :204），不是底层模型。
$ sed -n '164,177p' skills/wh-review/scripts/review-runner.mjs
function reuseSatisfiesCurrentPolicy({ result, attempt, reviewPolicy }) { ...
    const adapter = providerAttempt.identity?.adapter; const sourceId = providerAttempt.identity?.source_id; ...
    return adapters.size >= policy.minimum_heterologous && sources.size >= reviewPolicy.minimum_heterologous; }
⇒ 复用侧才用到 source_id；但 source_id 实测可为 null，故仍须落到 identity.model。
真实记录里的身份字段（grep 命中已落盘 review JSON 原文）：
  "identity":{"provider":"pi/v4flash","adapter":"pi","model":"cc-switch-deep-seek/deepseek-v4-flash","source_id":"pi/v4flash",...}
  "provider_identities":{"pi/v4flash":{"source_id":null,...}}   ← 同一记录里 source_id 一为字符串一为 null
  "identity":{"provider":"codex/luna","adapter":"codex","model":"gpt-5.6-luna","source_id":"codex/luna",...}
⇒ 底层模型只在 identity.model；profile 键（codex/luna）与 adapter（codex）都不能判异源。
$ grep -n "validateReviewBudget\|REVIEW_RETRY_BUDGET\|dispatch_state: \"reused\"" runtime/review/review-record-route.mjs
:4:import { validateReviewBudget } from "../evidence/stage-content-evidence.mjs";
:856:        error: { code: "REVIEW_RETRY_BUDGET_UNKNOWN", ... }
:886:    const reviewBudget = validateReviewBudget({ material_revision: ..., attempts, canonical_attempts: attempts, request: {...} });
:890:    if (reusable) return { status: "recorded", reused: true, dispatch_state: "reused", ...reusable, review_budget: reviewBudget };
:891-892:    if (!reviewBudget.ok) return { status: "unavailable", ..., error: { code: "REVIEW_RETRY_BUDGET_EXHAUSTED", ... } };
⇒ 【父材料的 :804-805 已过期；实测在 :886-893】
$ grep -n "validateReviewBudget" runtime/stage/stage-handlers.mjs
:14:import { ... validateReviewBudget } ...   |   :2338:    ? validateReviewBudget({
⇒ 第二个消费点（实测 :2338-2343）。
$ grep -n "export function validateReviewBudget" runtime/evidence/stage-content-evidence.mjs   →   :312
$ grep -n "^}" runtime/evidence/stage-content-evidence.mjs | awk -F: '$1>312' | head -1   →   399:}
⇒ 函数体 = :312-399，共 88 行。
$ grep -n "export function reviewCycleDecision" skills/wh-review/scripts/review-runner.mjs   →   :107
$ grep -n "^}" skills/wh-review/scripts/review-runner.mjs | awk -F: '$1>107' | head -1   →   131:}
⇒ :107-131 = 25 行（"追 findings 清零"的裁决器；review-materials.mjs:1044 的 prompt 仍写
   "a review cycle is clean only when ... has no actionable major or blocking finding"）。
```

### J. D-030 跨仓实测（3rd-review）

```text
$ grep -n "managedStatus\|ownerConfirmedDead\|SESSION_MANAGER_LOST" lib/broker.mjs
:9:import { ... ownerConfirmedDead ... } from "./runtime.mjs";
:707:  managedStatus(runtime_id, operation_id = null) {
:712:    if (operation.state !== "terminal" && operation.manager && ownerConfirmedDead(operation.manager)) {
:713:      const group = managedFailureGroup(state, operation, operation.cancel_requested ? "CANCELLED" : "SESSION_MANAGER_LOST");
$ sed -n '736,742p' lib/broker.mjs
  async runManagedOperation(runtime_id, operation_id, job) { ...
    const manager = { ...currentOwnerIdentity(), started_at_ms: Date.now() };
    updateRuntime(..., managed: { ...next.managed, operations: ... { ...item, state: "running", manager } ... });
⇒ manager 只在【开始时写一次】{pid, uid, started, started_at_ms}，之后不再更新 ⇒【无心跳字段】。
  其后是单次长 await this.run(job.request, ...)（:748）。
$ grep -n "export function ownerConfirmedDead" -A 4 lib/runtime.mjs
:33:export function ownerConfirmedDead(owner) { ... const current = processIdentity(owner.pid);
:36:  return current === null || current.uid !== owner.uid || current.started !== owner.started; }
⇒ 纯身份判定，零时间维度。
$ cat lib/runtime-guardian.mjs   →   tick(); setInterval(tick, 1_000);
⇒ D-030 提的「1s tick 是现成的同构参考」成立。
$ sed -n '156,169p' lib/broker.mjs
:156:function managedPublic(operation, runtime_id) {
:162:  const value = { version: "workflowhub-run.v1", request_id: operation.request_id, runtime_id, state, material_id: operation.material_id };
:163:  return state === "terminal" ? { ...value, group: operation.group } : value;
:165:function assertManagedPublic(value) { ... !["starting","running","terminal"].includes(value.state) ... fail("PUBLIC_RESULT_INVALID", ...) }
:169:  else if (Object.hasOwn(value, "group")) fail("PUBLIC_RESULT_INVALID", "non-terminal managed result must not include a provider group");
⇒ 活跃态信封 = {version, request_id, runtime_id, state, material_id}，【零进度、零时间戳】。
  父材料写 broker.mjs:139-145 —— 实测 :139-145 是 managedPublicPath/managedJobPath/writePrivateJson；
  managedPublic 在 :156-164。
$ grep -rn "PROCESS_STALLED" .   (排除 node_modules/.omc)
./lib/health-runner.mjs:54:        if (stagnant >= 5 && !stalledDiagnostic) { stalledDiagnostic = true; diagnose("PROCESS_STALLED", result); }
./test/health-runner.test.mjs:85, :111   （两处断言 diagnostics[0].code === "PROCESS_STALLED"）
⇒ 【只诊断不终止】。阈值 = stagnant >= 5 × intervalMs；broker 从不设 healthCheckIntervalMs
  （grep 只命中 process.mjs:16 的默认参数 60_000）⇒ 实测约 5 分钟。
$ sed -n '32p' lib/health-runner.mjs   →   :32:    if (!probeSession) { schedule(); return; }
⇒ 无 probe 的 provider 上【直接空转】，连诊断都不产生。
$ sed -n '1,3p' lib/provider-failure.mjs   +   sed -n '20,22p' lib/provider-failure.mjs
export const PROVIDER_FAILURE_PREFIX = "3RD_REVIEW_FAILURE ";
const structuredCodes = new Set([ "AUTHENTICATION_FAILED", ... "SESSION_UNKNOWN", ]);
⇒ 【无 PROCESS_STALLED】。D-030② 的「枚举里没有它」实测成立。
$ sed -n '71,76p' lib/process.mjs
:71:      const healthProbe = probeSession ?? plan.probeSession;
:72:      healthRunner = createHealthRunner({ ..., onDecision: (decision) => { ... }, onDiagnostic: (diagnostic) => plan.onHealthDiagnostic?.(diagnostic) });
$ grep -n "onHealthDiagnostic" lib/broker.mjs
:988:  ... execute({ ...attemptPlan, onOutput: capture.write, onHealthDiagnostic: (diagnostic) => touch({ last_health_diagnostic: diagnostic }) }, options);
:1199: ... execute({ ...rewritePlan, ..., onHealthDiagnostic: (diagnostic) => touch({ last_health_diagnostic: diagnostic }) }, {...});
⇒ 诊断的最终归宿只有 touch({last_health_diagnostic})，【永不进入 providers[].error.code】。
$ sed -n '94,98p;1340,1352p' lib/broker.mjs
:97:const workflowHubV2Outcomes = new Set(["completed", "unavailable", "cancelled", "stalled", "unverifiable", "invalid_output"]);
:1341:    if (input.required_result_protocol === WORKFLOWHUB_RESULT_PROTOCOL_V3) { ... return createWorkflowHubResultV3(...); }
:1343:    const codes = new Set(providers.map((item) => item.error?.code).filter(Boolean));
:1349:          : codes.has("PROCESS_STALLED") ? "stalled"    : ...  : "invalid_output";
⇒ 【outcome:"stalled" 已预留】= :97（校验集合）+ :1349（计算）。父材料写 :75,1335。
  可达性：managed 走 v2（下）⇒ 不进 :1341 的 V3 分支 ⇒ :1349 确在 managed 路径上；
  但 codes.has("PROCESS_STALLED") 永不为真 ⇒【当前不可达】成立，且比父材料说的更彻底。
$ sed -n '633p' lib/broker.mjs   →   :633:    if (input.required_result_protocol !== WORKFLOWHUB_RESULT_PROTOCOL_V2) fail("PROTOCOL_INCOMPATIBLE", "managed sessions require workflowhub-result.v2");
$ sed -n '474p' .../workflowhub/skills/wh-review/scripts/review-provider-client.mjs   →   :474:      required_result_protocol: "workflowhub-result.v2",
  旁证：3rd-review/lib/workflowhub-result-v3.mjs:20  outcomes = ["completed","partial","unavailable","cancelled"]（v3 无 stalled）。
$ grep -rn "probeSession" lib/adapters/   →   lib/adapters/opencode.mjs:157:  return { ...result, ..., probeSession: createOpenCodeProbe({ url }) };
⇒ 【只有 opencode 有 probe】。antigravity/codex/pi 既无 probe 也从不发 terminal 事件。
$ grep -n "idle_timeout_ms\|max_duration_ms\|max_wall_clock_ms\|deadline_ms" lib/config.mjs
:35:  ... fail("CONFIG_INVALID", "config.runtime.idle_timeout_ms and max_duration_ms are no longer supported; provider execution has no elapsed-time limit");
:47:    max_wall_clock_ms: null,
:68:    ... fail("CONFIG_INVALID", `providers.${id}.deadline_ms is no longer supported; ...`);
⇒ 【当前没有任何 stall 阈值配置项】⇒ 阈值只能硬编码（D-030 未决项 ① 属实）。
```

wh-review 侧（同一次实测）：

```text
$ grep -n "DEFAULT_MANAGED_TERMINAL_WAIT_MS\|waitForManagedTerminal\|while (current.state" skills/wh-review/scripts/simple-review-runner.mjs
:21:const DEFAULT_MANAGED_TERMINAL_WAIT_MS = null;
:432:async function waitForManagedTerminal({ lifecycle, client, requestId, hostProvider, providers, materials }, dependencies) {
:433:  const maxWaitMs = dependencies.managedTerminalWaitMs ?? DEFAULT_MANAGED_TERMINAL_WAIT_MS;
:442:  while (current.state !== "terminal") {
:449:    if (maxWaitMs !== null && Date.now() - startedAt >= maxWaitMs) { ...cancelManaged...; throw REVIEW_STATUS_UNAVAILABLE }
:452:    if (pollMs > 0) await new Promise((resolve) => setTimeout(resolve, pollMs));
⇒ DEFAULT_MANAGED_TERMINAL_WAIT_MS 实测 = null（第 21 行）✓；父材料写 :443 是轮询位置，实测 :442 才是 while（1 行偏差）。
$ sed -n '17,21p' skills/wh-review/scripts/simple-review-runner.mjs
:17:// Managed review ownership lives in 3rd-review. WorkflowHub must keep polling
:18:// while the broker reports a live session; a default wall-clock deadline would
:19:// cancel healthy long-running providers. A finite value remains an explicit
:20:// test/operator override.
$ grep -rn "stall" skills/wh-review/scripts/*.mjs
review-provider-client.mjs:122:const managedOutcomes = new Set(["completed", "unavailable", "cancelled", "stalled", "unverifiable", "invalid_output"]);
⇒ 【wh-review 侧唯一的 stalled 命中】。
$ grep -rn "stalled\|stall" skills/wh-review/scripts/review-result.mjs   →   (无命中)   ⇒ 无 stalled 映射 ✓（父材料对）
$ sed -n '193p' runtime/review/schemas/attempt.schema.json
        "group_outcome": { "enum": ["completed", "partial", "unavailable", "cancelled"] }
⇒ schema 侧也没有 stalled ✗（父材料漏点，见 X34）。校验入口 = runtime/review/schema-validator.mjs:5。
$ grep -rn "stall\|墙钟\|wall.clock" skills/wh-review/scripts/   (除上条外全无命中)
$ grep -n "Date.now()" skills/wh-review/scripts/simple-review-runner.mjs
:440:  const startedAt = Date.now();
:449:    if (maxWaitMs !== null && Date.now() - startedAt >= maxWaitMs) {
⇒ 【自造墙钟停滞判定：当前不存在】。唯一的墙钟用法就是这条【可关掉的有界等待】，默认 maxWaitMs=null ⇒ 无界。
   这就是「无停滞检测 + 无上限 ⇒ 37 分钟空转且永不返回」的代码事实（decision-log.md:955 的 X-B）。
```

ADR 与归档原文（**注意：在 3rd-review 仓，不在主仓**）：

```text
$ ls docs/adr/ | grep 0001-v4    (cwd=/Users/Hugh/Hugh/Project/workflowhub)   →   (无输出)
$ find /Users/Hugh/Hugh/Project/workflowhub /Users/Hugh/Hugh/Project/3rd-review -name '0001-v4-cli-contract.md' -not -path '*/node_modules/*'
/Users/Hugh/Hugh/Project/3rd-review/docs/adr/0001-v4-cli-contract.md
$ awk 'NR>=121 && NR<=123 {printf "%d: %s\n", NR, $0}' docs/adr/0001-v4-cli-contract.md   (cwd=3rd-review)
121: 网络失败。若 OpenCode 同时提供有效 native `session_id`，broker 只在同一 cwd 和同一材料链上再发起一次
122: 终态恢复提示；恢复过程由 managed session、provider process 和 health guardian 的真实活跃、失联、退出或
123: 失败事实裁决，不使用 adapter 固定总时限或 idle 时限。恢复结果仍须通过严格 JSON 与 session identity 校验。
⇒ 【L123 不是「沉默不杀进程」的原句】。
$ awk 'NR==20 {printf "%d: %s\n", NR, $0}' docs/archive/2026-07-12-v3-redesign-design.md
20: 不再设置默认 180 秒或 120 秒杀进程。默认 `deadline_seconds=null`，进程只要仍然活跃就继续监控；固定时间只能由调用方或全局配置显式设置。沉默只产生 `idle_warning`/`stalled_suspected`，不自动杀进程、不自动重新派发同一任务。若调用方确实需要硬上限，必须显式设置 deadline，并在 receipt 中记录。
$ awk 'NR==216 || NR==233 || NR==235' docs/archive/2026-07-12-v3-redesign-design.md
216: - `stalled_suspected_seconds`：进程仍存在但连续没有 stdout/stderr、adapter 事件或 PTY 变化时，标记为疑似卡住；只提醒和等待人工 `status/cancel`，不把它当成失败重派。...
233: 每 5 秒更新一次 heartbeat。一次 heartbeat 只需证明：进程仍存在、进程组仍存在、stdout/stderr 是否增长、adapter 是否收到新事件、tmux pane 是否存在。...
235: 长时间无输出但进程仍存活时，状态为 `idle_warning`、`stalled_suspected` 或 `waiting_unknown`。Broker 不杀、不 fresh、不重复派发；...
```

### K. 「故意构造无响应场景」的现成脚手架（`test -e` 实测存在）

```text
/Users/Hugh/Hugh/Project/3rd-review/test/silent-cli.mjs
  #!/usr/bin/env node
  const duration = Number(process.env.THIRD_REVIEW_TEST_DURATION_MS ?? 180);
  setTimeout(() => process.exit(0), duration);

/Users/Hugh/Hugh/Project/3rd-review/test/ignore-sigterm-cli.mjs
  #!/usr/bin/env node
  process.on("SIGTERM", () => {});
  setInterval(() => {}, 1_000);
  ⇒ 正好模拟「无 probe 的 antigravity/codex/pi」：既不出声，也不响应 SIGTERM。

3rd-review/test/managed-session-lifecycle.test.mjs:8-15  已 import Broker / validateConfig / readRuntime / updateRuntime，
  并引用 test/fake-cli.mjs、test/slow-cli.mjs、test/managed-start-caller.mjs、scripts/3rd-review.mjs
  ⇒ managed 端到端判死测试直接复用，无需新脚手架。
3rd-review/test/health-runner.test.mjs:5-13   FakeClock（可精确推进虚拟时间）+ setup() 返回 { clock, decisions, diagnostics, runner }
  ⇒ 判死的单元级验证直接复用。
```

命令：

```bash
cd /Users/Hugh/Hugh/Project/3rd-review
node --test test/health-runner.test.mjs                    # O-6.1 单元层
node --test test/managed-session-lifecycle.test.mjs        # O-6.2 managed 端到端层
cd /Users/Hugh/Hugh/Project/workflowhub
node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs \
  --poolOptions.forks.singleFork --no-fileParallelism      # O-6.3 调用侧映射层
```

### L. 受影响测试清单存在性（逐条 `test -e`）

```text
$ for f in ...; do test -e "$f" && echo "EXISTS $(wc -l < $f) $f" || echo "MISSING $f"; done
EXISTS 1385 tests/review/review-record-route.test.mjs        EXISTS  571 tests/review/review-managed-lifecycle.test.mjs
EXISTS   82 tests/review/review-policy-compatibility.test.mjs EXISTS  129 tests/contract/review-budget-namespace.test.mjs
EXISTS 1237 tests/contract/review-materials-contract.test.mjs EXISTS  258 tests/contract/build-prd-review-contract.test.mjs
EXISTS   87 skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs
EXISTS 1098 skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs
EXISTS  506 skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs
EXISTS  130 core/__tests__/run-checks.test.mjs              EXISTS  240 tests/contract/test-runtime-profile.test.mjs
EXISTS  221 tests/contract/stage-runtime-preflight.test.mjs EXISTS 2450 tests/integration/vnext-official-stage-run.test.mjs
EXISTS 1388 tests/e2e/vnext-five-stage-current.test.mjs     EXISTS  700 tests/integration/vnext-delivery-close.test.mjs
EXISTS  330 tests/contract/decision-convergence-depth.test.mjs
EXISTS  553 tests/contract/requirement-convergence-regression.test.mjs
EXISTS  443 tests/contract/stage-completion.test.mjs
```

未找到（如实登记，需新增）：

- `stalled` 下游映射无专属测试：`grep -rln "stalled" skills/wh-review/scripts/__tests__/` → 0 命中。
- `captureTests` 的独立针对性测试不存在：`grep -rln "captureTests" tests/ core/__tests__/` → 只命中跨模块大文件（`test-runtime-profile.test.mjs`、`acceptance-execution-tier.test.mjs`、`official-component-receipts.test.mjs`、`mini-task-delivery.test.mjs`）。

### M. 本轮唯一一次测试执行（有范围，非全量）

```text
$ cd /Users/Hugh/Hugh/Project/workflowhub && time node_modules/.bin/vitest run \
    tests/review/review-policy-compatibility.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=basic
 RUN  v2.1.9 /Users/Hugh/Hugh/Project/workflowhub
 ✓ tests/review/review-policy-compatibility.test.mjs (3 tests) 9ms
 Test Files  1 passed (1)      Tests  3 passed (3)
   Duration  140ms (transform 23ms, setup 0ms, collect 27ms, tests 9ms, environment 0ms, prepare 25ms)
real 0m0.371s   user 0m0.314s   sys 0m0.080s   [exit 0]
```

⇒ 证明（a）受影响测试的精确命令形式可用；（b）单个策略级文件 = 371ms，与 743,014ms 的 `vnext-official-stage-run`
相差 **~2,000×**，三层拆分的收益有真实数量级支撑。
⇒ **未跑**：全量 `vitest`、`npm test`、`npm run test:safe`、`npm run check`。

### N. `unknown` 登记（核不出的项）

| 项 | 状态 | 查了什么 |
| --- | --- | --- |
| 「同一命令至少启动 8 次」 | **`unknown`** | `decision-log.md:1570`/`:1578` 是唯一出处；对 `decision-log.md` 全文 grep `npx vitest run` 与命令串计数 → 无一手重复启动记录。C9-AC 不得依赖 `8` 这个数字。 |
| provider 生命周期（D-026② 修订）的**具体内容** | **`unknown`** | 该词在 1,979 行母材料中仅 1 次（`:855`）；D-026 正文 `:1563-1592` 四条内不含；全仓 grep `provider 生命周期` → 1 命中。见 X30。 |
| 「inner 分钟级」的实测最慢 inner 文件 | **`unknown`** | 需按三层拆分后逐层计时；本轮只测 1 个文件（371ms）。历史记录中无 inner/phase/aggregate 分层计时。 |
| `C9-FR-4` 的「5 秒内返回」是否有既存 SLO | **`unknown`** | `grep -rn "5000\|5_000\|5s" tools/cli/stage-runtime.mjs` 无 preflight 相关命中；`runPreflight` 是空实现，无计时。 |
| `run-checks.mjs` profile 模式是否曾真的产出过 `quality/tests/*.json` | **`unknown`** | 只找到 `specs/archive/workflowhub-execution-acceleration-20260909/tasks.md:48` 的命令原文（该任务把 R-009 标为 `deferred（DEFER-S3）`），未找到实际产出文件。 |

---

### 任务Ⅱ 卡片 B（C5 / C6）

- HEAD（实测）：`216a546d4ec33ca3804a188a14a9536a2968f77c`
- 母材料：`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`（1,979 行）
- 地图：`/tmp/wh-msd-build-prd/map-v1.md`（`build-prd-map-v1`）
- 已生效裁定：**裁定 C**（`check-extensibility.mjs` 的 content-hash 度量归本卡）、**裁定 D**（D-011②/D-024/D-025①/② 归本卡）
- 所有路径、行号、计数均为 `test -e` / `grep -n` / `wc -l` 实测；核不出的标 `unknown`。

---

#### C5 · 删哈希失效链，只留写口一次身份核对

**1. 结果与 consumer**
结果：改一个已审文件后，既有绿灯**不失效、不自动重跑**；写口仍有一次**真会拦**的身份核对，且只有三项（task_id + 工作区路径 + 待写字节）。生产代码与 `workflows/*/skill-deps.yaml` 中 `material_revision` / `snapshot_tree` **零残留**；`npm run check` **不劣化于 HEAD 基线**（markdownlint **554** error / path-guard **10** FAIL / verify-structure **2** FAIL）**且本卡范围内清零**。
consumer：C6（`status`/`close` 的读取来源改为具名 ref 前必须先没有哈希驱动）、C8（M4/M5 净减复核）；用户（不再「改一点就变一下」，Q22 原文：「绿灯有过一次就可以了，后续的测试、审查和 verify-code 来兜底，不要改一点就变一下」）。

##### 2. 范围

- 删：材料整体哈希、snapshot tree、currentness 重算、fact 级 freshness 评估，及由它们派生的「改字段 → 既有证据失效 → 重跑审查/测试」链条（D-009①）。
- 删的载体（生产侧实测命中行数见 §18）：`runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/review/review-record-route.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/stage/stage-handlers.mjs`（8 文件闭包），及调用面 `stage-content-contracts.mjs` / `stage-handoff.mjs` / `material-workspace.mjs` / `canonical-evidence-validators.mjs` / `quality-fact.mjs` / `stage-reflect.mjs` / `stage-skill-runtime.mjs` / `tools/cli/stage-runtime.mjs` / `tools/host/workflowhub-stage-agent-bridge.mjs` / `runtime/review/{integration-review-subject,stage-review-disposition}.mjs` / `skills/wh-review/scripts/*` / `skills/mini-task/scripts/mini-task-runner.mjs`。
- 删的声明面：6 个 `workflows/*/skill-deps.yaml`（47 处 `material_revision`）、`runtime/schemas/stage-skill-deps.schema.json:27`、`runtime/evidence/check-skill-closure.mjs:154` 与 `:290`。
- 移出：`runtime/task/git-worktree-snapshot.mjs` 的 snapshot **捕获/写入**能力从写路径移出（`captureGitWorktreeSnapshot` `:469`、`captureExecutionSnapshot` `:472`、`captureSnapshot` `:432`、`ensureGitSnapshotObjectStore` `:142`、`writeLooseObject` `:150`、`materializeGitSnapshot` `:199`）。
- **删（裁定 J-3）**：`identity/path-cards/**` 整类删除 —— `persistWriteBoundaryPathCard`（`write-boundary-preflight.mjs:205-246`）的**落盘分支**、`TaskHandle.createPathCardRecord`（`task-handle.mjs:845`）与 `PATH_CARD_WRITERS`（`task-handle.mjs:886-893`）。**实测依据**：零生产 reader、零测试引用（`grep -rn "path-cards\|persistWriteBoundaryPathCard" tests/ core/__tests__/ skills/` → 0），函数自述 `informational_only`、`never participate in bootstrap or authorization`。**强度不变**：第三项「待写字节」校验改为**内存内**同一次比对（读 `source.ref` 当前字节 → 与声明的 `source.hash` 比对），**不符仍抛同一句 `path card source hash is stale`**。
- **跨卡排除项（X47，裁定 J-8 之外的独立裁定）**：`core/task-close.mjs:1712-1713` 的 **planning close 哈希校验**（`planning.material_revision` / `planning.snapshot_tree` / `planning.snapshot_commit`）**不由本卡处置**，**归 C6**（与 D-025② 的 `non_stage` 收口口径同批）。**本卡不得单方面删除它**；本卡的 AC-1 零残留面因此**显式排除 `core/task-close.mjs` 的 planning 分支**（见 AC-1 的「覆盖面」定义）。
- 保留（**只有三项，不得长胖**）：写口身份核对 = `task_id` + 工作区路径 + 待写字节。
- **不做**：不改 wh-review 的 per-stage 审查标准与 prompt；不新增对象；不新增门禁；不新增 command。

**「现在几项 → 目标三项」逐项对照**（实测 `runtime/evidence/write-boundary-preflight.mjs`，246 行）

`inspectWriteBoundary`（`:44-152`）当前实际参与核对/产出的条目：

| # | 现项 | 实测位置 | 核对内容 | 目标 |
| --- | --- | --- | --- | --- |
| 1 | `task_id` | `:113`、`:127`、`:208`、`:220` | invocation 与 handle 的 task_id 必须相等 | **保留** |
| 2 | 工作区路径 | `:55-56` `TARGET_GIT_TOP_MISMATCH`、`:64-68` `WORKTREE_GIT_TOP_MISMATCH` / `WORKTREE_TASK_REPOSITORY_MISMATCH`、`:70` `WORKTREE_IDENTITY_INVALID`、`:131` `worktree_root` | target repo git toplevel、worktree git toplevel、两者 git common dir 相等、workspace 是已认证 Workspace/CandidateWorkspace | **保留**（收敛为「工作区路径」一项，子检查是实现细节） |
| 3 | 待写字节 | `:205-238` `persistWriteBoundaryPathCard`：`:217` `if (sha256(sourceRaw) !== source.hash) throw new Error("path card source hash is stale")`；`:234` ref = `identity/path-cards/<stage>/<sha256(raw)>.json` | 即将写入的确切字节与 path-card source hash 不符即 fail-loud | **保留（强度不变）**，但**载体改变（裁定 J-3）**：卡片落盘整段删除，校验改为**内存内**同一次比对，错误文案不变 |
| 4 | `project_name` | `:113` | invocation.project_name === handle.identity.projectName | **删** |
| 5 | `stage` | `:113-114`、`:46`（`STAGES.has(stage)`） | invocation.stage === stage；stage 必须属 5 正式阶段 | **删**（保留侧不含 stage） |
| 6 | `operation` | `:47-49`、`:129` | 形状 `^[a-z][a-z0-9._-]*$` | **删** |
| 7 | `source_digest` / snapshot tree | `:52-54`、`:74-77`（`captureGitWorktreeSnapshot` / `assertCurrentSourceDigest`）、`:80` `SOURCE_SNAPSHOT_UNAVAILABLE`、`:134` | 整个工作树的 git tree OID + source_digest | **删**（D-009 修订①：改为直接对「待写字节」核对，不再经 snapshot） |
| 8 | `invocation.ref` + 记录 hash | `:86-87` `INVOCATION_IDENTITY_INVALID`、`:93` `readRecord`、`:100` `INVOCATION_RECORD_UNAVAILABLE`、`:104` `INVOCATION_RECORD_HASH_MISMATCH`、`:110` `INVOCATION_RECORD_INVALID` | invocation 记录存在且 `sha256(raw) === invocation.hash` | **删** |
| 9 | `source_kind` / `source_clean` / `source.git_oid` / `source.git_tree` | `:116-117` | 执行来源的形状与 OID 形状 | **删** |
| 10 | `contracts.agents.sha256` / `stage_skill.sha256` / `constitution.sha256` | `:118-121` `EXECUTION_CONTENT_IDENTITY_INVALID` | 三份契约文件的 sha256 形状 | **删**（这是被 D-009① 点名的哈希面） |
| 11 | `execution_manifest_hash` / `release.content_id` | `identity/invocation-identity.mjs:80,86` | `sha256(canonical(value))`、`sha256(canonical({git_oid,git_tree,contracts}))` | **删** |
| 12 | path-card ref 的 hash 派生路径 | `:234` | ref 本身由 `sha256(raw)` 生成 | **删（连同卡片整段，裁定 J-3）**：不再派生任何 ref；**同时删除** `task-handle.mjs:845` 的写门与 `:886-893` 的路径正则 |
| 13 | `legacy_identity` | `:136` | `handle.manifest.execution_mode` 判定 | 随 8/9/11 一并移出 |

合计：**现在 13 项 → 目标 3 项**。

**3. 流程/状态**
删前：写质量事实带 `material_revision` + `snapshot_tree` → 读时 `evaluateFactFreshness`（`:709-781`）比对 `material`/`tree`/`fact` 三依赖 → 材料改一字节 → 全部旧事实 `stale` → 审查/测试重跑。
删后：事实记录**只记一次命令与退出码**（Q22：跑完记一行，不因改动自动作废）；读侧只做**身份**核对（是不是同一个 task、同一个工作区）；「改过就不再有效」这条链整体不存在。写口：`inspectWriteBoundary` → 三项核对 → `persistWriteBoundaryPathCard` 用**待写字节**做最后一次 stale 检查 → 不匹配 fail-loud。

##### 4. FR

| ID | 内容 | 来源 |
| --- | --- | --- |
| `C5-FR-1` | 生产代码中 `material_revision` / `materialRevision` / `snapshot_tree` / `snapshotTree` / `evaluateFactFreshness` / `isStageSnapshotCurrent` / `materialRevisionFromValues` / `stageMaterialScopeRevision` / `isMaterialOnlySnapshotDelta` 及 git snapshot 捕获面全部删除或移出写路径 | D-009①、D-009 修订① |
| `C5-FR-2` | 唯一保留的写口身份核对 = `task_id` + 工作区路径 + 待写字节；**恰好三项**，不得含 project_name / stage / operation / invocation / contracts 三哈希 / source_digest。**三项的载体（裁定 J-3）**：前两项来自 `task.json`（K1）与已认证 workspace；第三项 = **内存内**比对 `sha256(readRecord(source.ref)) === source.hash`，**不落任何 path card** | D-009②、Q17=A、RK-1、**裁定 J-3** |
| `C5-FR-3` | 写口预检不再经 snapshot（`inspectWriteBoundary` 不消费 `captureGitWorktreeSnapshot` / `assertCurrentSourceDigest`）；`git-worktree-snapshot.mjs` 捕获能力从写路径移出 | D-009 修订①（本条即 detail 审查 item 3，blocking） |
| `C5-FR-4` | 声明面同步：`check-skill-closure.mjs:154` 冻结数组 + `:290` 全等校验 + `runtime/schemas/stage-skill-deps.schema.json:27` 的 `const` + 6 个 `skill-deps.yaml`（47 处）**四者同批改** | D-029⑨(a)、D-020① |
| `C5-FR-5` | `workflows/build-prd/skill-deps.yaml:3` 的 `spec-prd` consumer `identity` 同步；**本阶段自身正在用这条声明** | T-7#3（母材料 `:194`） |
| `C5-FR-6` | `tools/cli/check-extensibility.mjs` 的 content-hash 度量给出替代判据并落地（裁定 C 归本卡）→ **已由裁定 J-5 选型为 A「原样保留」**：不换判据，只由 C7 在宪法/文档里写清「同进程 before/after 内容比对 ≠ 持久化哈希失效链」；本卡该项净变化 = **0** | D-020②、地图 §4.2 裁定 C、**裁定 J-5** |
| `C5-FR-7` | 去重键不再由材料哈希驱动（替代物 `review_result_ref` 由 C4 落地，本卡只做**验收**，不重复实现） | D-009 修订②、D-010 修订、D-029③ |
| `C5-FR-8` | **跨卡排除项（X47）**：`core/task-close.mjs:1712-1713` 的 planning close 哈希校验（`material_revision` / `snapshot_tree` / `snapshot_commit`）**不在本卡删除面**，由 **C6** 在改 `non_stage` / planning 收口口径时一并处置；本卡须在 §18 与 AC-1 里显式登记该排除 | **X47** + D-025② + `map-v1.md:115`（C5 具名清单未含 planning close） |

##### 5. AC（每条带失败判据）

- `AC-1` **零残留只对「本卡自身的 write-set 覆盖面」要求**（**口径已按 X47 收窄；这是裁定，不是放宽**）。**覆盖面定义**：§2「删的载体」8 文件闭包 + §2「调用面」具名清单 + §2「删的声明面」+ §18 点名的每个文件 —— **逐个文件**要求 9 个标识符 grep 命中 0。**显式排除（不得由本卡删、也不计入本卡零残留）**：`core/task-close.mjs` 的 **planning 分支**（`:1712-1713`、`:1717-1720`、`:1803-1804`；**X47 已裁定归 C6**）。**失败判据**：① 覆盖面内任一标识符命中 >0；② 本卡动了 `core/task-close.mjs` 的 planning 分支（越界，撞 X47）；③ 把 `core/task-close.mjs` 从「排除」改成「必须清零」而不给 C6 的承接登记。⚠️ `currentness` **不列入**本清单——HEAD 实测它是零命中标识符（见 X44）。**oracle 见 §6 的两段式命令（先测覆盖面，再单独打印排除项的当前命中数作为 C6 的移交证据）。**
- `AC-2` 6 个 `workflows/*/skill-deps.yaml` 的 `material_revision`、`snapshot_tree` 命中均为 0。**失败判据**：任一文件命中 >0。
- `AC-3` `node runtime/evidence/check-skill-closure.mjs` 退出码 0。**失败判据**：非 0（含 `consumer identity is invalid` 与 schema 校验失败）。
- `AC-4` 写口核对只比三项。**失败判据**：`inspectWriteBoundary` 的 violations 枚举里仍存在 `SOURCE_SNAPSHOT_UNAVAILABLE`、`EXECUTION_CONTENT_IDENTITY_INVALID`、`INVOCATION_RECORD_HASH_MISMATCH`，或仍读 `invocation.contracts.*.sha256`、仍调用 `captureGitWorktreeSnapshot` / `assertCurrentSourceDigest`。
- `AC-5` 写口核对**真会拦**：三项中任一项不符必须 fail-loud（错 task_id / 错工作区路径 / 待写字节与声明的 `source.hash` 不符）。**失败判据**：改任一项后 `assertWriteBoundary` 仍返回 `status:"valid"`；**或待写字节这项校验被删、被弱化、或不再抛 `path card source hash is stale`**（**注意**：`persistWriteBoundaryPathCard` 这个**函数体**按裁定 J-3 删除，但**这句错误与这次比对必须原样存活**在写口路径上 —— 判据查的是**行为**与**错误文案**，不是函数名）。
- `AC-6` 改一个已审文件后：旧绿灯不失效、不自动重跑。**失败判据**：出现由材料内容变化触发的失效判定（`evaluateFactFreshness` 已删后，表现为任何读路径仍以材料字节差异拒绝既有事实）。
- `AC-7` `check-extensibility` 的替代判据**可证伪**：故意让被测行为为假时该检查真报失败。**失败判据**：把替代判据造假后检查仍 PASS（即恒真守卫——违反 `CLAUDE.md`「检查须在『实际为假』时真报失败」）。**裁定 J-5 选 A 后本 AC 不变**：仍以 `core/__tests__/check-extensibility.test.mjs:190-242` 的「原内容改写」用例为负例。
- `AC-8` 针对性测试全绿（见 §17）。**失败判据**：清单内任一文件非绿。
- `AC-9`（**裁定 J-3 的收尾**）：`identity/path-cards/**` 在生产代码中零命中，且 `TaskHandle.createPathCardRecord` 与 `PATH_CARD_WRITERS` 已删。**失败判据**：`grep -rn 'path-cards\|createPathCardRecord\|persistWriteBoundaryPathCard' --include='*.mjs' runtime/ core/ tools/ skills/` 仍有命中（测试除外）；**或**为删卡片而连带弱化了「待写字节」这次比对（= 用净减换掉一条真检查，撞 AC-5）。

##### 6. oracle（可执行验证）

```bash
cd /Users/Hugh/Hugh/Project/workflowhub
# AC-1 零残留 —— 两段式：① 只测【本卡 write-set 覆盖面】；② 单独打印排除项作为 C6 的移交证据
# ① 覆盖面（§18 点名的每个文件；任一命中 >0 即失败）
grep -rn 'material_revision\|materialRevision\|snapshot_tree\|snapshotTree\|evaluateFactFreshness\|isStageSnapshotCurrent\|materialRevisionFromValues\|stageMaterialScopeRevision\|isMaterialOnlySnapshotDelta' \
  --include='*.mjs' --include='*.yaml' --include='*.json' \
  runtime/evidence/freshness.mjs runtime/stage/completion-predicates.mjs runtime/stage/stage-runner.mjs \
  runtime/review/review-record-route.mjs runtime/stage/stage-agent-outcome-adapter.mjs \
  runtime/task/task-kernel-implementation.mjs runtime/evidence/canonical-receipt-writer.mjs \
  runtime/stage/stage-handlers.mjs runtime/stage/stage-content-contracts.mjs runtime/stage/stage-handoff.mjs \
  runtime/task/material-workspace.mjs runtime/evidence/canonical-evidence-validators.mjs runtime/evidence/quality-fact.mjs \
  runtime/stage/stage-reflect.mjs runtime/stage/stage-skill-runtime.mjs tools/cli/stage-runtime.mjs \
  tools/host/workflowhub-stage-agent-bridge.mjs runtime/review/integration-review-subject.mjs \
  runtime/review/stage-review-disposition.mjs skills/wh-review/scripts skills/mini-task/scripts/mini-task-runner.mjs \
  runtime/evidence/write-boundary-preflight.mjs runtime/task/task-handle.mjs \
  workflows/build-prd/skill-deps.yaml workflows/build-code/skill-deps.yaml workflows/build-plan/skill-deps.yaml \
  workflows/build-spec/skill-deps.yaml workflows/make-decision/skill-deps.yaml workflows/verify-code/skill-deps.yaml \
  runtime/schemas/stage-skill-deps.schema.json runtime/evidence/check-skill-closure.mjs \
  | grep -v -E '__tests__|/tests?/|\.test\.' ; echo "coverage_exit=$?"
# ② 排除项（X47：planning close 归 C6）—— 本卡【不删】；此处只打印当前命中，作为 C6 的移交基线
grep -n 'material_revision\|snapshot_tree\|snapshot_commit' core/task-close.mjs | sed -n '1,20p'
echo "EXCLUDED-FROM-C5: core/task-close.mjs planning branch (lines 1712-1713/1717-1720/1803-1804) -> C6"
# AC-2
for f in workflows/*/skill-deps.yaml; do echo "$f $(grep -c 'material_revision\|snapshot_tree' "$f")"; done
# AC-3
node runtime/evidence/check-skill-closure.mjs; echo "exit=$?"
# AC-4 源码侧
grep -n 'SOURCE_SNAPSHOT_UNAVAILABLE\|EXECUTION_CONTENT_IDENTITY_INVALID\|INVOCATION_RECORD_HASH_MISMATCH\|captureGitWorktreeSnapshot\|assertCurrentSourceDigest\|contracts?\.\(agents\|stage_skill\|constitution\)' runtime/evidence/write-boundary-preflight.mjs
# AC-5 行为侧（写口真会拦）
npx vitest run core/__tests__/invocation-identity.test.mjs tests/left-shift/left-shift-suite.test.mjs
# AC-7（裁定 J-5 选 A：判据不变，仍是原内容改写的 falsifiability）
npx vitest run core/__tests__/check-extensibility.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# AC-9（裁定 J-3：path card 与写门已删）
grep -rn 'path-cards\|createPathCardRecord\|persistWriteBoundaryPathCard' --include='*.mjs' runtime/ core/ tools/ skills/ | grep -v -E '__tests__|/tests?/|\.test\.' ; echo "expect_no_match=$?"
```

**7. 准备依赖**：C4 合入（去重键替代物 `review_result_ref` 先落地；D-009 修订③ + D-010 修订明令「两套去重不能同时消失」）。
**8. 实现依赖**：C3 记录重建完成（`facts.jsonl` 成为唯一执行记录；T-7#2「记录重建必须先于删失效链」）。
**9. 验收依赖**：C0 的 M5 口径（`validate/assert/check` 函数数、`throw` 站点数、错误码数、schema 文件数、单文件最大行数）。
**10. 合并依赖**：任务Ⅱ 第 3 位（C9 → C4 → **C5** → C6）。批内含 CI 度量处置（裁定 C）。与 C7 **互锁**：C7 只同步宪法/文档表述，实现替代在本卡。

##### 11. 共享资源冲突与集成责任

- **同文件串行**：`tools/cli/stage-runtime.mjs`（1,095 行）与 `runtime/stage/completion-predicates.mjs`（1,259 行）同时被 C5 与 C6 改 → **C5 先合、C6 后合，中间不得并行**（见 X46）。
- **跨卡排除（X47）**：`core/task-close.mjs` **不进本卡写集合**。它的 planning 分支（`:1712-1713`/`:1717-1720`/`:1803-1804`）的哈希校验归 **C6**；本卡只负责在 §18/AC-1 里登记「排除 + 由 C6 承接」，**不得**出现「C5 删了它、C6 不知情」的中间态。
- **同卡内新增写口文件**：`runtime/evidence/write-boundary-preflight.mjs` 与 `runtime/task/task-handle.mjs` —— 前者被 C5 改写（删卡片、保留内存校验），后者被 C5 删写门（`createPathCardRecord` + `PATH_CARD_WRITERS`）；两者**本卡独占**，但 `task-handle.mjs` 同时是 `index.json` 权限门（`:417`，属 **C3**）的所在文件 → **串行：C3 先合**（C3 已在其 §15 必读集里列入该行）。
- **CI 守卫表**：`tools/cli/check-task-record-paths.mjs` 有 4+ 张按文件路径硬编码的授权表（`:14/:22/:35/:136/:145`），其中 `:81` 点名 `runtime/evidence/write-boundary-preflight.mjs`。删/移任一被点名文件即守卫红 → 本卡必须同批改表或把表改成按职责（D-020①，owner = C1）。
- **测试源码断言**：`tests/left-shift/left-shift-suite.test.mjs:8-14` 用**源码字符串**断言 `runtime/stage/stage-runner.mjs` 含 `function assertWriteBoundary(`（实测定义在 `stage-runner.mjs:1345`，调用在 `:1364`）与 `assertWriteBoundary(ctx);`。移动/改名这个函数会红 → 本卡要么保留这层写口包装，要么同批改该测试。
- **集成责任**：C5 主会话负责「删完 `npm run check` **不劣化于 HEAD 基线**（markdownlint 554 / path-guard 10 / verify-structure 2）**且本卡范围内清零**」；`check-extensibility` 的落地形态**已由裁定 J-5 定死为 A（原样保留）**，不再需要执行者选型 —— **只剩 J-10 的那一句话待用户确认**（若用户不接受 A，则按 E 执行并接受保护损失）。
- **跨批接管**：`skills/wh-review/**`（`wh-review-cli.mjs` 46 命中行、`review-runner.mjs` 35、`review-materials.mjs` 17）与 `tools/host/workflowhub-stage-agent-bridge.mjs`（21 命中行）也在删除面内；C4 刚在批次④改过审查侧，C5 须与其 diff 对齐，不得回退 C4 的去重键语义。

##### 12. 来源/设计（具体 D 号 + 行号 + revision）

| 来源 | 母材料行号 | revision / 状态 | HEAD 复核 |
| --- | --- | --- | --- |
| D-009 | `:1162-1201` | 含**修订段**（`:1167`，detail 审查 item 3/4，blocking） | 一致 |
| D-011② | `:1213` | （归 C6 的 status 占一行） | 一致 |
| D-020② | `:1436` | 原文（字面放任务Ⅲ，与自身「二者必有一废」冲突） | 见 X41 |
| D-029⑨(a) | `:941` | 父材料给 `check-skill-closure.mjs:154,290` | **实测一致**：`:154` `PORTABLE_DEPENDENCY_IDENTITY = Object.freeze(["task_id","stage","material_revision","snapshot_tree"])`；`:290` `if (JSON.stringify(consumer.identity) !== JSON.stringify(PORTABLE_DEPENDENCY_IDENTITY))` |
| D-029⑦ | `:933` | 「6 个 `workflows/*/skill-deps.yaml`（47 处 `material_revision`）」 | **实测一致**：build-code 9 / build-plan 12 / build-spec 13 / make-decision 8 / verify-code 4 / build-prd 1 = **47** |
| T-7#1/#2/#3 | `:188/:192/:194` | T-7#3 = `workflows/build-prd/skill-deps.yaml:3` consumer `identity` | 一致（该行实测为 `identity: ["task_id", "stage", "material_revision", "snapshot_tree"]`） |
| 裁定 C | `map-v1.md:219` | 已生效：content-hash 度量归 C5，C7 只同步表述 | 理由句与实测不符，见 X41 |
| 用户 Q17 / Q22 | `:759` 邻行 Talk 表 | Q17=A（保留写口核对）、Q22=A（彻底不判） | 一致 |
| **裁定 J-3** | 本 PRD | `identity/path-cards/**` 零 reader ⇒ 整类删除；「待写字节」校验改为内存内比对、错误文案不变 | **新增**（本卡是该裁定的执行者） |
| **裁定 J-5** | 本 PRD | `check-extensibility` 的 content-hash 度量 = **A 原样保留**（C7 承担表述责任） | **新增**（本卡该项净变化 = 0） |
| **裁定 F / 裁定 J-9** | 本 PRD | 所有 oracle 用「不劣化于 HEAD 基线 + 本卡范围内清零」；M5 第 4/5 项口径见 J-9 | 一致 |
| **X47** | 本 PRD | planning close 哈希校验归 **C6**；本卡显式排除（`C5-FR-8`） | **新增** |

**裁定 C：`check-extensibility.mjs` 的 content hash 实测用法**

- `createCoreSnapshot()` `:52-59`：对 `scanCoreFiles()` 的每个文件算 `sha256(readFileSync(f))`，键为相对 `repoRoot` 的路径。
- `isCoreUnchangedFromSnapshot(baseline)` `:72-89`：正向比对（任一文件内容不同 → false）+ 反向比对（baseline 里有、现在没有 → false）。
- 调用点：`verifySwappability` `:103`（baseline 缺省时 `createCoreSnapshot()`）、`:109`、`:113`；`verifyExtensibility` `:134`、`:141`、`:145`。
- `scanCoreFiles()` = `tools/cli/scan-core-files.mjs:35` 递归 `runtime/**/*.mjs`（跳过 `__tests__`）。**注意**：文件头注释写的是 `core/*.mjs`，实现扫的是 `runtime/` —— 注释与实现不符（独立缺陷，见 X41）。
- CLI 路径：`main()` `:176`/`:192` 调 `verifySwappability({configPath, workflowId})` / `verifyExtensibility(...)` 时**不传** `baselineCoreSnapshot`，因此 baseline 在 `runKernel` 之前同进程抓取 → 测的是「这次 dispatch 有没有改动 runtime 字节」，**不是**「对 HEAD 的 runtime 零改动」。
- 挂载链：`tools/cli/run-checks.mjs:184-188`（`check-extensibility` 是 run-checks 的第 2 项）+ `package.json` 的 `test:exclusive`（`vitest run core/__tests__/check-extensibility.test.mjs core/__tests__/check-anti-host.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`）。

##### 裁定 C 的落地形态（**已由裁定 J-5 定死为 A「原样保留」**；下表保留为**被否选项与后果的留痕**，不再是候选菜单）

| 候选 | 内容 | 后果 |
| --- | --- | --- |
| A | 原样保留（它只是同进程 before/after 比对，与被删的失效链无代码依赖） | 零改动、零风险；但「仓里还留着一套 content-hash 度量」这句话在表述上仍成立，C7 的宪法/文档同步必须解释它为何不算失效链 |
| B | 换成 `git status --porcelain -- runtime/` 前后比对 | 不再读内容；但合法脏工作树会永久红，仍需一个 baseline → 用更差精度重造同一件事 |
| C | 换成 `git diff --name-only <baseline> -- runtime/` | 需要持久化一个 base OID —— 正面撞 D-024②「不冻结 base OID」，把要删的东西请回来 |
| D | 换成 `runtime/**` 的 mtime + size 指纹 | 不再读内容；但 falsifiability 测试是**原内容改写**（`core/__tests__/check-extensibility.test.mjs:190-242`），mtime/size 可能不变 → 守卫变恒真，违反「检查须在实际为假时真报失败」 |
| E | 收窄为纯路由断言：只证 `runKernel(configPath, workflowId)` 经 registry 解析且未直传组件路径，**删掉**「runtime 字节未变」这一主张 | 更贴 FR-EXT-001/002 的真实主张；但失去「核心零改动」这层保护，需 C7 同批改宪法 / FR-EXT 表述 |
| F | 检查一份**入库的** runtime 清单文件 | 每次合法改 runtime 都要重生成清单 → 变回「改一点就红」的失效链，与 D-009 正面对撞 |

**已选路线（裁定 J-5）= A**。理由：它是唯一**不降低保护强度**的选项，且它**不持久化任何 baseline**（同进程 before/after 比对）⇒ 不是哈希失效链。**被否选项与本卡的后果**：B/C/D/F 分别会引入合法脏工作树永久红、**正面撞 D-024② 的不冻结 base OID**、让守卫变恒真（违 F9）、把失效链请回来；**E（纯路由断言）**会删掉「runtime 字节未变」这条真断言 ⇒ 只有在用户明确接受该损失时才可采用（**J-10 的那一个问题**）。**本卡据此把 `check-extensibility.mjs` 的净变化从 `unknown` 定死为 0。**

##### 13. 局部风险

- RK-1：保留的那一层做胖会慢慢长回原样 → 写死只有三项，AC-4 逐项点名禁止字段。
- **裁定 C 的选型已由裁定 J-5 定死为 A（原样保留）** → 不再由执行者自决，也不再是「选 E/F 会把真保护换掉」的开放风险。**剩余风险 = C7 的表述责任**：若 C7 没写清「同进程 before/after 内容比对 ≠ 持久化哈希失效链」，治理文字上仍像留着一套哈希度量。**唯一未闭环点**：A 是「保留」，而裁定 C 是用户已确认的裁定 ⇒ 需用户对 **J-10 的那一句话**确认（默认路线 = A）。
- **具名清单漏项**：`runtime/schemas/stage-skill-deps.schema.json:27`（`identity` 的 `const` 硬编码 4 项）不在父材料与地图的 C5 具名清单里，漏改必红（见 X40）。
- **planning close 被连带打断（X47，处置已定）**：`core/task-close.mjs:1712-1713` 用 `/^revision-[a-f0-9]{64}$/` 校验 `planning.material_revision`、用 `/^[a-f0-9]{40,64}$/i` 校验 `planning.snapshot_tree`；删 D-009① 会直接打断 planning close 的这条校验。**X47 的裁定 = 归 C6**（与 D-025② 同批），**本卡显式排除**（`C5-FR-8` + AC-1 第 ② 条 + §6 oracle 第 ② 段）。**本卡的风险因此从「会不会误删」变成「会不会越界删」**：越界即撞 X47 与 D-025② 的收口分工。
- 删除面横跨 30+ 文件、含 `skills/wh-review/**` 与 `tools/host/**` → 只改 `runtime/` 会留半删状态。
- 父材料 D-020④ 的三个测试侧计数与 HEAD 不符（见 X42），执行者若照抄会误判收敛。

**14. 可后置技术项**：`none`（用户明确要求不产出延期项；D-026 修订已撤销「延期 + 触发条件」形态，与「不要延期任务」一致）。

##### 15. 最小读取集

- **必读**：`runtime/evidence/write-boundary-preflight.mjs`（246 行，全文）、`runtime/evidence/check-skill-closure.mjs:148-300`、`runtime/schemas/stage-skill-deps.schema.json`（72 行，全文）、`workflows/*/skill-deps.yaml`（6 个，共 116 行）、`runtime/task/git-worktree-snapshot.mjs:23-115` 与 `:432-500` 与 `:594-647`、`tools/cli/check-extensibility.mjs`（218 行，全文）、`tools/cli/scan-core-files.mjs`（41 行，全文）、`runtime/stage/completion-predicates.mjs:1-70`、**`runtime/task/task-handle.mjs:410-420`（`index.json` 权限门，属 C3 —— 只读以避让）与 `:838-895`（path-card 写门，裁定 J-3 的删除面）**。
- **条件读（改到才读）**：`runtime/evidence/freshness.mjs:709-781`、`runtime/review/review-record-route.mjs:30-50` 与 `:785`、`runtime/stage/stage-agent-outcome-adapter.mjs:221-231`、`runtime/task/task-kernel-implementation.mjs:8-12` 与 `:543-560` 与 `:864` 与 `:977`、`runtime/evidence/canonical-receipt-writer.mjs:11` 与 `:350`、`runtime/stage/stage-handlers.mjs:11,49,117,1637,2071,2227`、`runtime/stage/stage-runner.mjs:339-347,689,1405,1792,2642`、`skills/wh-review/scripts/*`、`skills/mini-task/scripts/mini-task-runner.mjs:293`、`tools/host/workflowhub-stage-agent-bridge.mjs`。
- **正常不读**：`runtime/stage/stage-content-contracts.mjs` 全文（**6,806 行**，只按 49 处命中行定位）、`specs/**`、`docs/**`、`skills/**/SKILL.md` 正文。

##### 16. 五阶段开工说明

- **make-decision**：不适用为新建决定（本卡是已批准批次；D-009 与裁定 C 已给结论）。**裁定 C 的选型已由裁定 J-5 定死为 A（原样保留）**，故本阶段**不再回到人做 A–F 选择**；只有「改三段语义」这一件仍必须回到人（那等于修正一条用户已确认的决定）。**唯一待用户确认的是 J-10 的那一句话**（把裁定 C 的落地形态从「换替代判据」定成「保留」）。
- **build-spec**：把 §4 的 **8 条 FR** 与 §5 的 **9 条 AC** 定稿；**写明裁定 J-5 = A 及其后果接受**（C7 承担「同进程比对 ≠ 失效链」的表述责任）；写明 `C5-FR-8` 的跨卡排除项与它的 C6 承接登记。
- **build-plan**：按 §12 的具名落点排 write-set；把「同文件串行」写进任务顺序（C3 先于 C5 改 `runtime/task/task-handle.mjs`；C5 先于 C6 改 `tools/cli/stage-runtime.mjs` 与 `runtime/stage/completion-predicates.mjs`）；**把 X40 补进 C5 的 write-set**；**X47 不进 C5 write-set，改为写入「排除清单 + C6 承接登记」**（原稿「把 X40/X47 两个漏项补进 write-set」会让 C5 越界删 planning 分支，与 X47 的裁定直接冲突）。
- **build-code**：按 §17 只跑受影响测试；**禁止全量回归**（`AGENTS.md` 硬规则 + `docs/standard-workflow.md:310`）。
- **verify-code**：以 `node runtime/evidence/check-skill-closure.mjs` 退出码 0 + §6 的 grep 零残留 + §5 AC-5「真会拦」负例为收口证据；**本卡不跑 `npm run check` 全链** —— 只跑 §17 的针对性测试 + 单点 `node runtime/evidence/check-skill-closure.mjs`；**`npm run check` 全链由 C8 在末次跑一次并记录退出码**，判据是「**不劣化于 HEAD 基线**」而非 0。

**17. 受影响测试清单与命令**（全部 `test -e` 已验证存在）

| 测试文件 | 实测行数 | 为什么受影响 |
| --- | --- | --- |
| `core/__tests__/check-skill-closure.test.mjs` | — (存在) | FR-EXT-002 声明面；`:154`/:290 冻结数组改动的直接回归 |
| `core/__tests__/check-extensibility.test.mjs` | 304 | content-hash 度量改动点；含 `createCoreSnapshot` 与两组 falsifiability（`:84-136`、`:190-242`） |
| `core/__tests__/invocation-identity.test.mjs` | 156 | 写口 invocation 身份；AC-5「真会拦」 |
| `tests/left-shift/left-shift-suite.test.mjs` | 52 | `:8-14` 源码字符串断言 `assertWriteBoundary` |
| `tests/close/freshness-consistency.test.mjs` | 67 | 失效链删除的核心回归 |
| `tests/contract/per-ac-material-freshness.test.mjs` | — (存在) | 材料 freshness 读侧 |
| `tests/contract/stage-completion.test.mjs` | 443 | `completion-predicates` 谓词 |
| `tests/review/review-record-route.test.mjs` | 1385 | `review-record-route.mjs:40` freshness 输入（D-009 修订②） |
| `tests/integration/execution-snapshot-isolation.test.mjs` | — (存在) | git-worktree-snapshot 写路径移出 |
| `tests/integration/verify-freshness-selection.test.mjs` | — (存在) | freshness 选择 |
| `tests/verify-code-freshness.test.mjs` | — (存在) | verify-code freshness |
| `tests/contract/stage-skill-consumer-contract.test.mjs` | — (存在) | skill-deps consumer 声明 |
| `tests/task-record-paths-check.test.mjs` | — (存在) | CI 守卫表（若同批改表） |

命令（逐条，不合并成全量）：

```bash
npx vitest run core/__tests__/check-skill-closure.test.mjs
npx vitest run core/__tests__/check-extensibility.test.mjs --poolOptions.forks.singleFork --no-fileParallelism  # flag 抄 package.json 的 test:exclusive
npx vitest run core/__tests__/invocation-identity.test.mjs tests/left-shift/left-shift-suite.test.mjs
npx vitest run tests/close/freshness-consistency.test.mjs tests/contract/per-ac-material-freshness.test.mjs
npx vitest run tests/contract/stage-completion.test.mjs tests/review/review-record-route.test.mjs
npx vitest run tests/integration/execution-snapshot-isolation.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/verify-code-freshness.test.mjs
npx vitest run tests/contract/stage-skill-consumer-contract.test.mjs tests/task-record-paths-check.test.mjs
node runtime/evidence/check-skill-closure.mjs
```

纪律：**不跑** `npm test` / `npm run check` / `npm run test:safe`（`AGENTS.md` 禁止无范围全量回归；`docs/standard-workflow.md:310`）。**C5 不跑 `check` 全链**；只跑上面的针对性测试 + 单点 `node runtime/evidence/check-skill-closure.mjs`。`npm run check` 全链由 **C8** 在末次跑一次并记退出码，判据为「**不劣化于 HEAD 基线**」（markdownlint 554 / path-guard 10 / verify-structure 2）而非 0。

**18. 控制面净增减申报**（`wc -l` 实测；「删行下限」= 含可删符号的行数，是**下限估计**，非实测删除量）

| 文件 | 实测行数 | 删行下限 | 预计删除后 | 净 |
| --- | --- | --- | --- | --- |
| `runtime/stage/stage-content-contracts.mjs` | **6,806** | 49 | ~6,757 | −49（下限） |
| `runtime/stage/stage-handlers.mjs` | 3,956 | 96 | ~3,860 | −96 |
| `runtime/stage/stage-runner.mjs` | 3,161 | 77 | ~3,084 | −77 |
| `runtime/stage/completion-predicates.mjs` | 1,259 | 54 | ~1,205 | −54 |
| `runtime/review/review-record-route.mjs` | 1,257 | 62 | ~1,195 | −62 |
| `runtime/task/task-kernel-implementation.mjs` | 1,177 | 39 | ~1,138 | −39 |
| `runtime/stage/stage-agent-outcome-adapter.mjs` | 1,096 | 34 | ~1,062 | −34 |
| `runtime/evidence/canonical-receipt-writer.mjs` | 870 | 25 | ~845 | −25 |
| `runtime/evidence/freshness.mjs` | 781 | 50 | ~731 | −50 |
| `runtime/task/git-worktree-snapshot.mjs` | 647 | 6 直命中 | **unknown**（写路径搬出，行数取决于搬到哪，可能是 0 或 +N） | unknown |
| `runtime/evidence/check-skill-closure.mjs` | 824 | 0（`:154` 改值不改行数；`:290` 留） | 824 | 0 |
| `runtime/schemas/stage-skill-deps.schema.json` | 72 | 0（`:27` 改 const） | 72 | 0 |
| `tools/cli/check-extensibility.mjs` | 218 | 0（**裁定 J-5 = A：原样保留**） | 218 | **0（已从 `unknown` 定死）** |
| `tools/cli/scan-core-files.mjs` | 41 | 0 | 41 | 0 |
| `runtime/evidence/write-boundary-preflight.mjs` | 246 | 0 直命中（`:74-77` 是 snapshot 调用块） | ~206 | ~−40（**裁定 J-3**：删卡片落盘分支 `:205-246`；内存校验保留） |
| `runtime/task/task-handle.mjs` | — | — | ~−10（**裁定 J-3**：删 `createPathCardRecord`（`:845`）与 `PATH_CARD_WRITERS`（`:886-893`）；**注意** `:417` 的 `index.json` 权限门属 **C3**，本卡不动） | 负值（**待逐段核对，不编数**） |
| `core/task-close.mjs` | — | — | **0（显式排除，X47 归 C6）** | **0** |
| `workflows/*/skill-deps.yaml`（6 文件合计） | 116 | 47 | ~69 | −47 |
| `skills/wh-review/scripts/wh-review-cli.mjs` | 1,182 | 46 | ~1,136 | −46 |
| `skills/wh-review/scripts/review-runner.mjs` | 514 | 35 | ~479 | −35 |
| `skills/wh-review/scripts/review-materials.mjs` | 2,225 | 17 | ~2,208 | −17 |
| `skills/wh-review/scripts/review-source.mjs` | 279 | 7 | ~272 | −7 |
| `skills/wh-review/scripts/ac-evidence-summary.mjs` | 233 | 7 | ~226 | −7 |
| `skills/mini-task/scripts/mini-task-runner.mjs` | 1,172 | 64 | ~1,108 | −64 |
| `tools/cli/stage-runtime.mjs` | 1,095 | 38 | ~1,057 | −38 |
| `tools/host/workflowhub-stage-agent-bridge.mjs` | 594 | 21 | ~573 | −21 |
| `runtime/task/material-workspace.mjs` | 288 | 13 | ~275 | −13 |
| `runtime/evidence/canonical-evidence-validators.mjs` | 436 | 25 | ~411 | −25 |
| `runtime/evidence/quality-fact.mjs` | 94 | 5 | ~89 | −5 |
| `runtime/stage/stage-handoff.mjs` | 416 | 18 | ~398 | −18 |
| `runtime/stage/stage-reflect.mjs` | 1,074 | 11 | ~1,063 | −11 |
| `runtime/stage/stage-skill-runtime.mjs` | 165 | 6 | ~159 | −6 |
| `runtime/review/integration-review-subject.mjs` | 449 | 13 | ~436 | −13 |
| `runtime/review/stage-review-disposition.mjs` | 321 | 6 | ~315 | −6 |
| `runtime/evidence/stage-content-evidence.mjs` | 527 | 18 | ~509 | −18 |
| `runtime/evidence/acceptance-evidence-validator.mjs` | 83 | 7 | ~76 | −7 |
| `runtime/evidence/research-report.mjs` | 231 | 8 | ~223 | −8 |
| `tools/cli/validate-stage-reflection.mjs` | 434 | 1 | ~433 | −1 |

**申报**：生产代码新增 **0 个文件、0 个新对象、0 个新 command、0 个新门禁**；净减 **≥ 约 −820 行**（下限合计；`git-worktree-snapshot.mjs` 标 `unknown`，不影响「净减」方向；`check-extensibility.mjs` 已由裁定 J-5 定死为 **0**；`write-boundary-preflight.mjs` 与 `task-handle.mjs` 因裁定 J-3 由「≈0」变为负值）。**无新控制面**。

---

#### C6 · `status`/`close` 只报根因 + 读取来源收敛为具名 ref + 删质量投影

**1. 结果与 consumer**
结果：`status` 只告诉我出了什么事——**根因行 + 具名 ref 集合**，不再给一堆投影；`quality/verify.json` 与 product-release 投影**连对象不存在**；入口统一为 `project` + `task_id` → 唯一 config resolver → canonical task path；main 前进只报 stale、不冻结 base OID；close 的四项前置检查发生在 commit **之前**；`non_stage` 工作流不再被 5 阶段谓词考核。
consumer：C7（治理表述同步）、C8（双证验收）；**每个后续任务的收口动作**；用户（不再「一个根因几十条红字」）。

##### 2. 范围

- 删：`quality/verify.json`（含 `runtime/schemas/quality-verify.v1.json`，25 行）与 product-release 投影（`deriveProductRelease` / `deriveCurrentProductRelease` / release reasons）**连对象**。
- 删：`tools/cli/stage-runtime.mjs:366-484` `deriveStatusGroups` 的四个派生投影 `quality_gaps` / `release_gaps` / `close_preparation_gaps` / `actionable_now`（及 `gap_groups` / `next_action` / `close_supported`，见 §5 AC-2）。
- 同批改：`core/task-close.mjs` 的 `deriveCurrentProductRelease`（`:21` import、`:1959` 调用）、`delivery.quality_gaps`（实测 **10 处**）、`validateRiskCloseQualityReasons`（`:1763-1775`，**替代判据已由裁定 J-7 定死**）。
- **承接 X47（planning close 哈希校验）**：`core/task-close.mjs:1712-1713`（`planning.material_revision` / `planning.snapshot_tree` / `planning.snapshot_commit` 三条正则）、`:1717-1720`（`planning.materials[file]` 的 sha256 要求）、`:1803-1804`（`publishPlanningHumanConfirmation` 要求两字段为 string）——**由本卡在改 `non_stage` / planning 收口口径时一并处置**（C5 显式排除，见 `C5-FR-8`）。**处置方向 = 与 D-025② 一致**：planning 收口只保证**自己的材料与事实**（`planning.materials[file]` 的 sha256 + `prd.md` 附件绑定），**不再要求** `material_revision` / `snapshot_tree` 这两个被删概念。
- 同批落地：**D-024①**（入口统一 `project` + `task_id` → 唯一 config resolver → canonical task path；`--task-path` 降为受控诊断 override 并**记录来源**）、**D-024②**（main 前进只报 stale、**不冻结 base OID**）、**D-025①**（close 前置检查提到 commit 前，**不新增 `close --preflight-only`**）、**D-025②**（`non_stage` 不按 5 阶段谓词收口；**谓词遍历集合钉死为 `STAGES`** —— 裁定 J-2）、**D-011②**（stage-reflection 结论在 status 占一行）。
- **与 `stage-outcome-proofs` 的边界（裁定 J-4）**：本卡**不迁移、不删除、不改写** `stage-outcome-proofs/**`；它保留为 **K5**，由 `stage-runner.mjs:92-100` 按 `ref` 读。本卡改 status/close 的读取来源时，该 ref **仍以具名 ref 形式出现**（J-7 的 canonical ref 集合第 ⑤ 类），**不得**因为「收敛读取来源」把它从读取面删掉。
- 同批落地：**D-024①**（入口统一 `project` + `task_id` → 唯一 config resolver → canonical task path；`--task-path` 降为受控诊断 override 并**记录来源**）、**D-024②**（main 前进只报 stale、**不冻结 base OID**）、**D-025①**（close 前置检查提到 commit 前，**不新增 `close --preflight-only`**）、**D-025②**（`non_stage` 不按 5 阶段谓词收口）、**D-011②**（stage-reflection 结论在 status 占一行）。
- **顺序硬约束**：**先补 D-015③ 的链路功能验收，再动 status/close**。
- **不做**：不新增 public command（public runtime 仍只有 `doctor`/`status`/`run`/`review`/`verify`/`confirm`/`authorize` 七类）；不改 wh-review 的 per-stage 审查标准与 prompt。

**3. 流程/状态**
删前：`status` → `deriveStageProgress` + `deriveStageCompletion` + `currentProductReleaseView` + `deriveStatusGroups` → 输出 18 个键、其中 `status_groups` 内嵌套 10 个字段（含 4 个派生投影、`gap_groups`、`research`）→ 人看到几十条红字（实测 30 条 release reason 只对应 2–4 个真问题）。
删后：`status` → 根因行（同一根因只出现一次）+ **具名 ref 集合**（读到的 canonical 文件逐个点名）+ 一行 stage-reflection 结论 → 不再有 `product_release_*`、不再有 `status_groups`、不再有 `release_gaps`/`quality_gaps`。
relax 侧：材料/工作区身份读取统一走 `resolveStorageRoot()`（`runtime/evidence/storage-root.mjs:80`）→ `deriveTaskPath()`（`runtime/task/task-identity.mjs:37-49`）；main 前进不再抛「baseline changed」，改为 status 里一行 stale。

##### 4. FR

| ID | 内容 | 来源 |
| --- | --- | --- |
| `C6-FR-1` | `status` 只输出根因归并条目 + 具名 ref 集合；派生投影不作为独立条目展示；同一根因只出现一次 | D-012（`:1229-1247`） |
| `C6-FR-2` | `quality/verify.json` 与 product-release 投影连对象收掉；删 `runtime/schemas/quality-verify.v1.json`；删 `deriveProductRelease` / `deriveCurrentProductRelease` 及其状态机 | D-023①（`:1500-1519`）、Q21=A |
| `C6-FR-3` | `status`/`close` **只读 canonical 输出，禁止自行扫描旁路目录**；读取来源枚举为**具名 ref 集合** —— **集合已由裁定 J-7 定死为恰好 6 类**：① `task.json`（K1）；② `facts.jsonl`（K2，含 `stage` 与 `close_action` 两型行）；③ `specs/<task-id>/{decision-log,spec,plan,tasks}.md`（K3，四份具名）；④ `quality/confirmations/**` 与 `quality/authorizations/**`（K4，按 ref 点名）；⑤ **被 K2 行 / close 动作行点名的 K5 原始证据**（按 `ref` 逐个点名，**含 `stage-outcome-proofs/**` 的 ref**，**不 `readdir`**）；⑥ 四份材料与 HEAD 的**具名 diff 输入**（close 的 commit 前四项前置检查按 ref 读）。 | D-023③、D-029④（`:930`）、**裁定 J-7** |
| `C6-FR-4` | `core/task-close.mjs` 不再依赖 `deriveCurrentProductRelease`；`delivery.quality_gaps` 的 10 处消费点收口；`validateRiskCloseQualityReasons` 的「与当前 `quality_gaps` 完全一致」改用**裁定 J-7 的替代判据**：`risk_close.quality_reasons` 去重排序后**必须与 `status` 根因行里登记的具名 ref 集合逐项全等**（空集仍抛 `delivery risk close requires at least one current quality gap`，不等仍抛错） | D-023④、D-020③（`:1437`）、Q21、**裁定 J-7** |
| `C6-FR-5` | 所有入口统一为「`project` + `task_id` → 唯一 config resolver → canonical task path」；`--task-path` 降为**受控诊断 override 并记录来源** | D-024①（`:1521-1540`）、Q25=A |
| `C6-FR-6` | 任务期间 main 前进**不冻结 base OID**；只要求「不许静默使用旧快照，必须报 stale」，stale 显示并入 status 根因行 | D-024②、Q25=A |
| `C6-FR-7` | close 的 sidecar 发布 / merge 预检 / 允许清单 / 远端对象检查**全部发生在 commit 之前**；**不新增 `close --preflight-only`** | D-025①（`:1542-1568`）、Q24=A |
| `C6-FR-8` | `non_stage`（build-prd 类）只保证自己的材料与事实，**不按 5 阶段谓词收口**（含不要求 `prd.md` 进 close）。**口径已由裁定 J-2 在 C3 内定死**：`non_stage` 行**进 `facts.jsonl`**（`STAGE_KEYS`），**但不进 5 阶段谓词**。**本卡只做一件事**：把谓词与 status 的**遍历集合钉死为 `STAGES`**（不得改为 `STAGE_KEYS`），**不再参与「写不写」的二选一** | D-025②、Q24=A、**裁定 J-2** |
| `C6-FR-9` | stage-reflection 结论写入 `facts.jsonl` 本阶段行并在 status **占一行** | D-011②（`:1213`）、Q11 |
| `C6-FR-10` | **链路功能验收（D-015③）先行**：写完 → status 立即可读 → 重放不产生重复，三步作为删 status/close 之前的通过前提 | D-015③（`:759` Q23=A；D-029⑧ `:934` 正式编号） |
| `C6-FR-11` | **承接 X47**：`core/task-close.mjs` 的 planning close 哈希校验（`:1712-1713` 三条正则、`:1717-1720` 的 `planning.materials[file]` sha256 要求、`:1803-1804` 的 string 要求）由本卡在 planning 收口口径内一并处置；**保留** `planning.materials[file]` 的 sha256 与 `prd.md` 附件绑定，**删除**对 `material_revision` / `snapshot_tree` 的要求；**不得**把 planning close 变成「不校验任何身份」 | **X47** + D-025② + `C5-FR-8`（C5 的显式排除） |

##### 5. AC（每条带失败判据）

- `AC-1` `status` 输出 = 根因行 + 具名 ref 集合。**失败判据**：返回对象仍含 `product_release_status` / `product_release_reasons` / `product_release_input_refs` / `status_groups` 任一键。
- `AC-2` 四个派生投影不存在。**失败判据**：`deriveStatusGroups` 或其输出仍含 `quality_gaps` / `release_gaps` / `close_preparation_gaps` / `actionable_now` 任一字段。⚠️ 实测 `quality_gaps` 与 `release_gaps` 是**同一数组的两份拷贝**（`tools/cli/stage-runtime.mjs:417-418`），必须一起收，不能只收一个。
- `AC-3` `status_groups` 零消费者的事实不再被违反。**失败判据**：删掉 `tools/cli/stage-runtime.mjs:770` 的产出后，出现任何新的 `status_groups` 消费者（即有人在删之前又给它加了 reader）。
- `AC-4` `quality/verify.json` 与 release 投影对象不存在。**失败判据**：`runtime/schemas/quality-verify.v1.json` 仍存在，或生产代码仍写/读 `quality/verify.json`。
- `AC-5` close 不依赖已删投影。**失败判据**：`core/task-close.mjs` 仍 import 或调用 `deriveCurrentProductRelease`；或仍引用 `deriveProductRelease`。
- `AC-6` `validateRiskCloseQualityReasons` 的「完全一致」有替代判据且**仍会拦**（**裁定 J-7 的等值判定**）。**失败判据**：删掉该校验后，`risk_close.quality_reasons` 可以填写任意内容而 close 仍成功；**或**替代判据不是等值判定（例如改成「非空即可」= 放宽断言）；**或**替代判据的比对源仍是已删的 `quality_gaps` / `quality/verify.json`。
- `AC-13`（**裁定 J-7.1**）：`status`/`close` 的读取来源**恰好是 J-7 的 6 类具名 ref**，且**没有 `readdir` 扫目录**。**失败判据**：出现第 7 类来源；或读取路径里出现 `readdirSync`/`readdir` 决定读取内容；或把 K5 证据（含 `stage-outcome-proofs/**` 的 ref）从读取面删掉（撞裁定 J-4）。
- `AC-14`（**X47 承接完成**）：planning close 在 `material_revision` / `snapshot_tree` 被删后**仍可完成**，且**身份校验未被清空**。**失败判据**：① 构造一个只带 `planning.materials[file]`（sha256 齐全）+ `prd.md` 附件的 planning close，close 仍抛 `planning close material identity is invalid`；**或** ② 反向：把整个 `validateDeliveryPlan` 的 planning 分支删成「不校验任何身份」而 close 成功。
- `AC-7` D-015③ 链路功能验收通过（三步全绿）。**失败判据**：写完 `facts.jsonl` 后 `status` 读不到该行；或重放同一写入产生第二行/第二个对象。
- `AC-8` close 前置检查确实发生在 commit **之前**（用一次真实 close 证明，观察侧：`commit-delivery` 步骤执行前 merge 冲突/sidecar 已被拦下）。**失败判据**：构造一个有 merge 冲突的场景，close 仍先执行 `commit-delivery` 再在 `merge-task-branch` 报冲突。
- `AC-9` `non_stage` 工作流不再被 5 阶段谓词考核。**失败判据**：build-prd 类任务的收口仍产生 `stage_completion_missing:<stage>` × 5 或 `expected_acceptance_ids_missing` 类判定；**或**把谓词遍历集合改成 `STAGE_KEYS`（**裁定 J-2** 明令：扩的只能是 `validateFact` 的接受面，谓词遍历集合必须是 `STAGES` 且逐字不变）。
- `AC-10` 入口统一且 `--task-path` 来源被记录。**失败判据**：`--task-path` 仍静默生效而不记录来源；或仍存在 `--task-path` 优先于 config resolver 且无标记的路径。
- `AC-11` main 前进只报 stale、不冻结 base OID。**失败判据**：main 前进后仍抛 `baseline_commit does not match task worktree HEAD` / `local target baseline changed` / `task worktree HEAD must equal the make-decision baseline` 一类**硬失败**，而非在 status 里报 stale。
- `AC-12` 针对性测试全绿（见 §17）。
- `AC-15`（**裁定 J-7.1 的 oracle 化**）：`grep -rn "readdirSync\|readdir(" --include='*.mjs' runtime/task/quality-store.mjs tools/cli/stage-runtime.mjs core/task-close.mjs` 的命中**不得**用于决定 status/close 的读取内容（允许用于具名目录内的存在性枚举，且必须逐个 ref 点名）；`grep -rn "stage-outcome-proofs" runtime/stage/stage-runner.mjs` 仍命中（**裁定 J-4：保留**）。**失败判据**：为「收敛读取来源」把 proofs 的 ref 读点删掉。

##### 6. oracle（可执行验证）

```bash
cd /Users/Hugh/Hugh/Project/workflowhub

# --- 现状基线（改之前先取证）---
# status 真实输出形状（18 键）与 status_groups 的 10 个内层字段
sed -n '762,773p' tools/cli/stage-runtime.mjs
sed -n '460,484p' tools/cli/stage-runtime.mjs
# status_groups 的消费者（实测：全仓仅 1 处 = 唯一产出点）
grep -rn 'status_groups' --include='*.mjs' --exclude-dir=node_modules --exclude-dir=specs . | grep -v -E '__tests__|/tests/|\.test\.'

# --- AC-4 verify.json 写者/读者全清单 ---
grep -rn 'quality/verify\.json\|quality-verify\.v1' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.planning --exclude-dir=specs . | grep -v -E '__tests__|/tests/|\.test\.'

# --- AC-5 close 依赖 ---
grep -n 'deriveCurrentProductRelease\|deriveProductRelease\|quality_gaps' core/task-close.mjs

# --- AC-6 risk_close 一致性校验（贴代码确认「完全一致」语义）---
sed -n '1763,1775p' core/task-close.mjs

# --- AC-8 close 动作顺序 ---
sed -n '1851,1857p' core/task-close.mjs     # DELIVERY_STEPS 固定五步
grep -n 'plannedMergePreflight' core/task-close.mjs   # def :1664 / 唯一调用 :2369（在 merge 步内）

# --- AC-10 入口面 ---
grep -c 'task-path' tools/cli/task-close.mjs tools/cli/task-bootstrap.mjs tools/cli/source-manifest.mjs tools/cli/stage-runtime.mjs
sed -n '41,44p' tools/cli/task-close.mjs
sed -n '57,70p' tools/cli/stage-runtime.mjs

# --- AC-11 base OID 冻结点 ---
sed -n '325,341p' runtime/task/workspace.mjs
sed -n '1654,1662p' core/task-close.mjs

# --- AC-9 non_stage 被 5 阶段谓词考核的考核点 ---
sed -n '7p;930,932p;983p' runtime/stage/completion-predicates.mjs
sed -n '2140,2150p' core/task-close.mjs
sed -n '1722,1723p' core/task-close.mjs

# --- AC-7 D-015③ 链路功能验收（三步）---
# 1) 写完：向 facts.jsonl 追加一行
# 2) status 立即可读：node tools/cli/stage-runtime.mjs status --stage=... --project=... --task=...
# 3) 重放不产生重复：重复同一写入，facts.jsonl 行数不变
wc -l <quality 目录>/facts.jsonl   # 重放前后须相等

# --- AC-6 risk_close 替代判据（裁定 J-7.2）：等值判定必须仍然 fail-loud ---
# 负例 1：quality_reasons 与 status 根因行登记的具名 ref 集合不等 → 必须抛
#   delivery risk close quality_reasons must exactly match current quality gaps（错误文案可改，但必须抛）
# 负例 2：quality_reasons 为空数组 → 必须抛 delivery risk close requires at least one current quality gap
# 正例：逐项全等 → close 继续
node -e 'const j=require("./runtime/review/stage-materials.json");void j'   # 占位：具体入口由 C6 定型后写死
grep -rn "quality_gaps" core/task-close.mjs | wc -l   # 期望 0（10 处消费点已收口）

# --- AC-13 canonical ref 集合闭集（裁定 J-7.1）：不得出现第 7 类来源 ---
grep -rn "resolveStorageRoot\|deriveTaskPath\|readTaskFacts\|readRecord(" tools/cli/stage-runtime.mjs core/task-close.mjs | sed -n '1,40p'
grep -rn "readdirSync\|readdir(" tools/cli/stage-runtime.mjs core/task-close.mjs   # 不得用于决定读取内容
grep -n "stage-outcome-proofs" runtime/stage/stage-runner.mjs                     # 必须仍命中（裁定 J-4）

# --- AC-14 planning close 承接（X47）---
sed -n '1710,1722p' core/task-close.mjs    # 改后：三条哈希正则不再出现，materials[file] sha256 与 prd.md 附件绑定仍在
grep -n "material_revision\|snapshot_tree" core/task-close.mjs | sed -n '1,20p'   # 期望仅剩本卡保留的具名用途 0 处
```

**7. 准备依赖**：C5 合入（删哈希失效链完成，读侧才会只剩身份核对）。
**8. 实现依赖**：C3 的 K2 行（`facts.jsonl` **两型行** + D-005 **五态**字段；D-015③ 的「写完 → status 立即可读 → 重放不产生重复」正是对它的功能验收）；**裁定 J-2 的 `non_stage` 口径**（本卡只消费，不重定义）；**裁定 J-4**（proofs 归 K5 ⇒ 本卡改读取来源时它仍是第 ⑤ 类具名 ref，不得删读点）。
**9. 验收依赖**：C0 口径（M1–M5）。
**10. 合并依赖**：任务Ⅱ 末位（C9 → C4 → C5 → **C6**）。与 C7 交接：C7 负责把宪法/`AGENTS.md:44/:58`/`move-map.json`/`control-plane-inventory.json` 的表述与本卡删掉的对象对齐。

##### 11. 共享资源冲突与集成责任

- **同文件串行**：`runtime/stage/completion-predicates.mjs`（C5 删 54 行命中；C6 删 `deriveProductRelease` `:859`、`deriveCurrentProductRelease` `:1020`、`quality/verify.json` 谓词 `:1124-1132`）与 `tools/cli/stage-runtime.mjs`（C5 38 命中；C6 `deriveStatusGroups` + `currentProductReleaseView`）→ **C5 先合、C6 后合**。
- **父材料明令同批**：`AGENTS.md:44/:58` 明写保留 `index.json` 与 `quality/verify.json`，与 D-004/D-023 直接冲突（D-029⑩，`:944`）。删 `quality/verify.json` 时 `AGENTS.md` 必须同批改，否则文档与代码矛盾。**但 `AGENTS.md` 归 C7** → 两卡交接点，C6 必须留出这一条给 C7，且不得自行改文档。
- **X47 承接的跨卡交接点**：`core/task-close.mjs` 是 **C6 独占**（C5 已按 `C5-FR-8` 显式排除其 planning 分支）；`tools/cli/task-close.mjs` 也在本卡读取面内（`--task-path` 的 3 个 CLI 之一，X45）。**集成责任 = C6**：planning close 与 risk close 两条校验路径必须**同批**改完，不得只改一条（否则同一文件内两条口径不一致）。
- **C3 记录交接**：`runtime/task/task-handle.mjs:417` 把 `index.json` 与 `quality/verify.json` 并列为 kernel-owned special case。C3 已处理 `index.json`；C6 删 `verify.json` 时该分支要收缩到只剩 `index.json` 或整体移除 → 与 C3 的 write-set 有重叠，需在 build-plan 里显式标注。
- **`tools/architecture/public-behavior-baseline.mjs:265`** 的排除清单含 `"quality/verify.json"`；删 `verify.json` 后该清单与测试 fixture `tests/fixtures/public-behavior-baseline/v1/candidate.json`（**28 处** `quality/verify.json` 命中）需同批改，否则 `probe:public-behavior` 红。
- **集成责任**：C6 主会话负责 `AC-7` 链路功能验收**先行通过**；`AC-8` 需要一次真实 close，由主会话排期并记录证据。

##### 12. 来源/设计（具体 D 号 + 行号 + revision）

| 来源 | 母材料行号 | revision / 状态 | HEAD 复核 |
| --- | --- | --- | --- |
| D-011② | `:1213` | 原文 | 一致 |
| D-012 | `:1229-1247` | 原文；facts 给 `deriveStatusGroups`（`tools/cli/stage-runtime.mjs:322`） | **行号已漂移**：实测 `export function deriveStatusGroups` 在 `tools/cli/stage-runtime.mjs:366`（父材料 `:322` 在 HEAD 不成立）。内层字段位置实测 `:400/:401/:402/:417/:418/:459/:461-465/:472/:473` |
| D-015③ | `:759`（Q23=A）、`:934`、`:1658` | 由 D-029⑧ 正式编号 | **原文定义**：Q23=A「补一条最小功能验收（**写完 → status 立即可读 → 重放不产生重复**）」 |
| D-020③ | `:1437` | 父材料给 `deriveCurrentProductRelease`（`:1959`）、`delivery.quality_gaps`（8 处）、`validateRiskCloseQualityReasons`（`:1772`） | **部分不符**：`:1959` 一致；`:1772` 是**抛错行**，函数定义在 `:1763-1775`；`quality_gaps` 实测 **10 处**（不是 8 处；D-029 的 R9 `:899` 已更正为 10） |
| D-023 | `:1500-1519` | 原文 | 一致 |
| D-024 | `:1521-1540` | 原文 | 入口面实测比字面窄（见 X45） |
| D-025① | `:1542-1568` | 原文 | 四项实测位置见 §3 与 X43 邻节 |
| D-025② | `:1552` | 原文 | 考核点实测见 X40 邻节 / §"non_stage 实测" |
| **裁定 J-2** | 本 PRD「裁定 J」节 | 新增 | `non_stage` 行**进** `facts.jsonl`（`STAGE_KEYS`）、**不进**谓词（遍历集合钉死 `STAGES`）；口径在 C3 内闭合，本卡只消费 |
| **裁定 J-7** | 本 PRD「裁定 J」节 | 新增 | canonical ref 集合 = 恰好 6 类具名 ref（无 `readdir`）；`risk_close` 替代判据 = 与 status 根因行登记的具名 ref 集合**逐项全等**（仍会拦） |
| **裁定 J-4** | 本 PRD「裁定 J」节 | 新增 | `stage-outcome-proofs/**` 保留为 K5 ⇒ 改读取来源时它是第 ⑤ 类具名 ref，**不得删读点** |
| **X47** | 本 PRD「任务Ⅱ-B · 需要裁定的新增矛盾」 | 裁定 = **归本卡** | `core/task-close.mjs:1712-1713 / :1717-1720 / :1803-1804` 的 planning close 哈希校验由本卡承接（`C6-FR-11` / `C6-AC-14`）；C5 已按 `C5-FR-8` 显式排除 |
| 裁定 D | `map-v1.md:220` | 已生效：D-011②/D-024/D-025①/② 归 C6 | 一致 |
| 用户 Q21 / Q24 / Q25 / Q26 | `:759` 邻行 Talk 表 | Q21=A（投影一起收掉）、Q24=A、Q25=A、Q26=A | 一致 |

**`status` 当前输出真实形状（实测）**

`tools/cli/stage-runtime.mjs:762-773` 的返回对象（status 命令的完整形状）：

| 键 | 来源（file:line） |
| --- | --- |
| `stage` / `work_status` / `continuation_allowed` / `work_authority` / `readiness_source` / `required_materials` / `missing_materials` | `...progression`（`:762`）← `deriveStageProgress`（`:752` → `runtime/stage/completion-predicates.mjs:1223-1240`） |
| `quality_status` | `:763` ← `deriveStageCompletion`（`:747`） |
| `quality_missing` | `:764` |
| `quality_fact_refs` | `:765`（`observations.map(({fact}) => fact.ref).sort()`） |
| `quality_predicates` | `:766` |
| `product_release_status` | `:767` ← `productRelease`（`:753-757`） |
| `product_release_reasons` | `:768` |
| `product_release_input_refs` | `:769` |
| `status_groups` | `:770` ← `deriveStatusGroups`（`:760`） |
| `research` | `:771` |
| `execution_outcome` | `:772` |

`status_groups` 内层（`deriveStatusGroups`，`tools/cli/stage-runtime.mjs:366-484`）：

| 内层字段 | 实测位置 |
| --- | --- |
| `actionable_now` | 构造 `:400`；push `:408`、`:414`；返回 `:461` |
| `external_unavailable` | 构造 `:401`；push `:410`、`:456`；返回 `:462` |
| `not_applicable` | 构造 `:402`；push `:412`；返回 `:463` |
| `quality_gaps` | 定义 `:417`（`[...new Set(productRelease?.reasons ?? [])]`）；返回 `:464` |
| `release_gaps` | 定义 `:418`（`[...quality_gaps]` —— **同一数组的拷贝**）；返回 `:465` |
| `gap_groups` | 构造 `:427-450`；返回 `:466-470`（含 `root_cause_id` / `source_layer` / `owner` / `derived_views` / `gaps`） |
| `close_supported` | `:419`（`stage === "verify-code"`）；返回 `:471` |
| `close_preparation_gaps` | 输入 `:420-425`；定义 `:459`；返回 `:472` |
| `next_action` | `:473` |
| `research` | 缺省构造 `:474-483` |

**`quality/verify.json` 的写入者与读取者（逐个 file:line，实测）**

写入者：

| file:line | 角色 |
| --- | --- |
| `runtime/evidence/quality-store.mjs:253`（schema）/ `:267`（`target = resolve(taskRoot,"quality/verify.json")`）/ `:286-287`（index 条目）/ `:291`（返回 ref） | `publishVerifySummary`；`:238-240` 对 canonical vnext task root **直接抛错**（`current verify summary requires the stage-runtime/TaskKernel canonical writer`） |
| `runtime/task/task-handle.mjs:417` / `:873`（`writeAtomicAt(realTaskPath,"quality/verify.json",data,options)`） | kernel-owned special case + 原子写 |
| `runtime/task/task-kernel-implementation.mjs:777` / `:794` / `:802` / `:804` / `:807` / `:812-813` / `:819` / `:823` | vNext canonical writer 的发布与 readback 校验 |
| `runtime/task/task-store.mjs:249` / `:261-262`（`atomicWrite(..., {createOnly:true})`） | `initializeTaskStore` bootstrap 时 createOnly 写 |
| `runtime/task/task-store.mjs:123-124` / `:190` | index 投影 + `["quality-fact.v1","quality-verify.v1"]` 判定 |

读取者：

| file:line | 角色 | 是否 load-bearing |
| --- | --- | --- |
| `runtime/stage/completion-predicates.mjs:1124-1132` | **`deriveCurrentProductRelease` 内的完成谓词**（`verifyRef = "quality/verify.json"`；`schema_version`/`task_id`/`stage`/`material_revision`/`snapshot_tree` 五项 identity current 校验），`:1136` 取值、`:1150` `source: "verify-summary"`、`:1178` 过滤 | **是**。它是 `deriveProductRelease` 的 `acceptance_results` 来源（`:1217`） |
| `runtime/stage/completion-predicates.mjs:363` / `:375` / `:381` | `quality-verify.v1` 形状 + `evidence_ref === "quality/verify.json"` → 返回 null | 是（同一谓词族） |
| `runtime/stage/stage-runner.mjs:111` | `normalized === "quality/verify.json"` 白名单 | 是 |
| `runtime/stage/stage-agent-outcome-adapter.mjs:80` | `if (value === "quality/verify.json") return true` | 是 |
| `tools/architecture/verify-final-coverage.mjs:161` | `value.schema_version !== "quality-verify.v1"` | 诊断工具 |
| `tools/architecture/public-behavior-baseline.mjs:265` | 排除清单含 `"quality/verify.json"` | 基线比对 |
| `docs/research/workflowhub-batch-governance-simplification-design-20260825.md:34,82`、`docs/research/workflowhub-batch-governance-inventory-20260825.md:48,137`、`docs/operations/deferred-tasks-m17.md:44` | 文档表述（归 C7） | 否 |

**`quality/verify.json` 的传递依赖链（决定 C6 为什么必须同时改 close）**
`core/task-close.mjs` **不直接**引用字符串 `quality/verify.json`（grep 实测零命中），但 `core/task-close.mjs:1959` 调 `deriveCurrentProductRelease`，后者在 `:1125` 读它 → **close 通过这条链依赖 verify.json**。同一函数还被 `tools/cli/stage-runtime.mjs:319 currentProductReleaseView` 调用（status）。⇒ 删 verify.json 必须同时改 `completion-predicates.mjs:1020` 的整个函数与 `core/task-close.mjs:21`/`:1959`。

**`deriveProductRelease` / release reasons 的位置与消费者**

| 位置 | 角色 |
| --- | --- |
| `runtime/stage/completion-predicates.mjs:859` | `deriveProductRelease` 定义 |
| `:900` | `expected_acceptance_ids_missing` |
| `:930-932` | `for (const stage of STAGES) { if (!stageByName.has(stage)) productReason(reasons, 'stage_completion_missing:'+stage) }` —— **对 5 个正式阶段无条件补齐** |
| `:983` | `no_applicable_acceptance_results` |
| `:1006` | `DERIVED.add(result)` |
| `:1020` | `deriveCurrentProductRelease` 定义 |
| `:1217` | `return deriveProductRelease({...})` |
| 消费者 | `tools/cli/stage-runtime.mjs:29`（import）、`:319`（`currentProductReleaseView`）、`:754-755`（status 选择）、`:767-769`（输出三键）；`core/task-close.mjs:21`（import）、`:1959`（close 调用）、**`:1976`**（`productRelease.reasons` 进 `qualityReasons`；**`:1998` 是 `task branch does not exist` 抛错行**，父材料与旧稿的行号有误） |

**`core/task-close.mjs` 对投影的依赖（实测行号与命中数）**

- `deriveCurrentProductRelease`：import `:21`；调用 `:1959`（父材料 `:1959` **一致**）。
- `delivery.quality_gaps`：**实测 10 处**（`grep -c 'quality_gaps' core/task-close.mjs` = 10）：`:1066`、`:1440`、`:1691`、`:1706`、`:1772`、`:2041`、`:2161`、`:2162`、`:2227`、`:2605`。父材料 D-020③ 写 8 处（D-029 的 R9 `:899` 已更正为 10）。
- `validateRiskCloseQualityReasons`：定义 `:1763-1775`；调用点 `:1691`（在 `validateDeliveryPlan` 内的 `if (delivery.risk_close !== undefined)` 分支）。父材料给 `:1772` —— 那是**抛错行**，不是函数位置。

**`validateRiskCloseQualityReasons` 实际校验逻辑（代码贴出，`core/task-close.mjs:1763-1775`）**

```js
function validateRiskCloseQualityReasons(risk, qualityGaps) {
  const expected = [...new Set((Array.isArray(qualityGaps) ? qualityGaps : [])
    .filter((item) => typeof item === "string" && item.trim() !== "")
    .map((item) => item.trim()))].sort();
  const supplied = [...new Set(risk.quality_reasons.map((item) => item.trim()))].sort();
  if (expected.length === 0) {
    throw new Error("delivery risk close requires at least one current quality gap");
  }
  if (expected.length !== supplied.length || expected.some((item, index) => item !== supplied[index])) {
    throw new Error("delivery risk close quality_reasons must exactly match current quality_gaps");
  }
  return risk;
}
```

**回答**：**是**，它要求 `risk_close.quality_reasons` 与当前 `delivery.quality_gaps` **完全一致**——去重、trim、排序后**长度相等且逐项相等**，并且 `quality_gaps` 为空时直接抛错（「至少要有一个 current quality gap」）。⇒ 删 `quality_gaps` 时这条校验必须给出替代判据（例如改为「人显式列出他所接受的风险项，非空即可」），否则 `manual-risk-close` 直接不可用。

**close 的当前动作顺序（哪些在 commit 前、哪些在之后）**
入口 `closeDelivery`（`core/task-close.mjs:1360-1446`）：

1. `:1384` 幂等短路（`operations/close/completed.json`）
2. `:1387` `prepareDeliveryClosePlan(...)`
3. `:1396` `confirmClosePlan({outcome:"confirmed"})`
4. `:1398-1414` 逐 operation 发布不可逆授权
5. `:1415` `executeClosePlan(...)`，executor 由 `createDeliveryCloseExecutorRegistry`（`:2270`）提供

固定五步（`DELIVERY_STEPS` `:1851-1857`；`:2274-2275` 强制「恰好这五步且顺序为 commit→merge→archive→push→cleanup」）：
`commit-delivery` → `merge-task-branch` → `archive-spec` → `push-target-branch` → `cleanup`。

四项前置检查的**实测位置**：

| 项 | 实测位置 | 相对 `commit-delivery` |
| --- | --- | --- |
| **sidecar 发布** | `:1894` `assertNoCloseExecutionSidecars(worktree,{taskId})`（在 `prepareDeliveryClosePlan` 内） | **之前** ✅（另在 commit 步内 `:2317`、`:2336` 复检） |
| **允许清单** | 唯二的清单对象：`runtime/task/git-worktree-snapshot.mjs:23` `EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES`、`:28-31` `CLOSE_EXECUTION_SIDECAR_PREFIXES`；消费点 `git-worktree-snapshot.mjs:107` → `task-close.mjs:1894`、`:2317`、`:2336`；另有 `task-close.mjs:1501-1523` `sourceWorktreeStatus`/`unstagedSourcePaths` 消费前者（用于 `targetPreflight` `:1657`、archive-spec `:2358`） | **之前** ✅ |
| **远端对象检查** | `:2046` `targetPreflight(delivery)`（缺省 `checkRemote:true`，`:1661` 比对 `remoteOid(root,remote,target_branch) !== remote_target_baseline`）；另 `:2014` `remoteOid(...)` 取 baseline | **之前** ✅（另在 push 步 `:2383` 复检） |
| **merge 预检** | `plannedMergePreflight` 定义 `:1664-1671`（`git merge-tree --write-tree target_baseline task_tip`）；**唯一调用点 `:2369`，位于 `merge-task-branch` executor 内** | **之后** ❌ |

⇒ **实测结论**：四项中 **3 项已在 commit 之前**（sidecar / 允许清单 / 远端对象），**唯一仍在 commit 之后的是 merge 预检**（`:2369`）。这与「上次第二轮撞 5 组冲突文件」的返工形态一致：`commit-delivery` 已发布 task branch 后才做 `merge-tree`。C6 的 D-025① 落地面因此比字面窄：**把 `plannedMergePreflight` 提到 `prepareDeliveryClosePlan` 的 `:2046` 附近（与 `targetPreflight` 同批）**，其余三项只需保持并补回执。

**`--task-path` 当前解析路径与 config resolver**

- `--task-path` 当前解析：`tools/cli/task-close.mjs:41-44`

  ```js
  function taskPath(values, project, taskId) {
    if (values["task-path"] !== undefined) return required(values, "task-path");
    return deriveTaskPath(resolveStorageRoot(), project, taskId);
  }
  ```

  → **显式值无条件优先、不记录来源、不做 canonical 校验**。
- 唯一 config resolver：`runtime/evidence/storage-root.mjs:80` `resolveStorageRoot({env,home})`（`:57` `resolveStorageRootDetails`）。
- canonical task path：`runtime/task/task-identity.mjs:37-49` `deriveTaskPath(storageRoot, projectName, taskId)`：`resolve(root,"Projects")` → `resolve(projectsRoot, project, "tasks", task)` → `assertInside(projectsRoot, taskPath)`；`validateProjectName`/`validateTaskId`（`:22-28`，`SAFE_SEGMENT` 单段校验）。
- 接受 `--task-path` 的 CLI（实测计数）：`tools/cli/task-close.mjs` **8**、`tools/cli/task-bootstrap.mjs` **4**、`tools/cli/source-manifest.mjs` **2**；`tools/cli/stage-runtime.mjs` **0**（已走目标形态，`resolveWorkflowHubIdentity` `:57-70`：「显式 project+task」或「认证 worktree 派生」，两者冲突即抛 `WorkflowHub identity conflict`；`:66` 返回 `{...explicit, taskPath: undefined, source: "explicit"}`）。
- `tools/cli/stage-runtime.mjs:671` 的 `status` 只接受 `--stage`/`--project`/`--task`/`--reason` → **`--task-path` 在 stage-runtime 已被排除**。
- 另一处：`tools/cli/task-bootstrap.mjs:29-34` 把 `["task-path","project","task","runner-root","stage"]` 作为「existing task bootstrap」的允许键集合，也走 `openTask(values["task-path"], values.project, values.task)`。

##### main 前进时的 base OID 冻结逻辑（实测）

| file:line | 行为 |
| --- | --- |
| `runtime/task/workspace.mjs:224-229`（`workspaceForCreation`） | 创建时抓 `baselineCommit = git rev-parse --verify HEAD^{commit}`（target repo HEAD） |
| `runtime/task/workspace.mjs:331-332` | `if (facts?.baseline_commit !== expected.baselineCommit) throw new Error("make-decision baseline_commit does not match task worktree HEAD")` ← **冻结点 1** |
| `runtime/task/workspace.mjs:341` | `if (git rev-parse HEAD !== expected.baselineCommit) throw new Error("task worktree HEAD must equal the make-decision baseline")` ← **冻结点 2** |
| `runtime/task/workspace.mjs:357` | `if (... !== expected.baselineCommit) throw new Error("CandidateWorkspace HEAD changed")` ← **冻结点 3** |
| `runtime/task/workspace.mjs:476` | `git cat-file -e ${facts.baseline_commit}^{commit}` ← baseline 必须仍存在 |
| `core/task-close.mjs:1660` | `targetPreflight`：`if (expectedLocal !== null && branchOid(root, target_branch) !== expectedLocal) throw new Error("local target baseline changed")` |
| `core/task-close.mjs:1661` | `if (checkRemote && remoteOid(...) !== delivery.remote_target_baseline) throw new Error("remote target baseline changed")` |
| `core/task-close.mjs:1683-1684` | `oid(delivery.target_baseline, ...)` / `oid(delivery.remote_target_baseline, ...)` 硬校验两个 OID 必须存在且形状正确 |

⇒ 现状是**硬失败式冻结**（三处 throw + close 两处 throw），**没有任何一处报 stale**。D-024② 要求把这三/五处改成「报 stale 而不冻结」，并把 stale 显示并入 status 根因行。

**`non_stage` 是否真的被 5 阶段谓词考核（具体考核点，实测）**
**是，被考核。** 具体考核点：

| # | file:line | 考核内容 | 后果 |
| --- | --- | --- | --- |
| 1 | `runtime/stage/completion-predicates.mjs:7` `const STAGES = ["make-decision","build-spec","build-plan","build-code","verify-code"]` | 5 阶段枚举是唯一权威 | build-prd 不在其中 |
| 2 | `runtime/stage/completion-predicates.mjs:930-932`（在 `deriveProductRelease` 内） | `for (const stage of STAGES) { if (!stageByName.has(stage)) productReason(reasons, 'stage_completion_missing:'+stage) }` | **对任何 build-prd 任务无条件产生 5 条 `stage_completion_missing:<stage>`** |
| 3 | `runtime/stage/completion-predicates.mjs:900` | `expected_acceptance_ids_missing` | build-prd 没有 `spec.md` 的 AC，必然命中 |
| 4 | `runtime/stage/completion-predicates.mjs:983` | `no_applicable_acceptance_results` | 同上 |
| 5 | `runtime/stage/completion-predicates.mjs:1223-1224`（`deriveStageProgress`） | `if (!STAGES.includes(stage)) throw new TypeError('unsupported stage: ' + stage)` | 若把 `build-prd` 当 `--stage` 传入 → **硬抛错** |
| 6 | `core/task-close.mjs:2148` | `...(planningMode ? [...] : [["verify_facts_fresh", verifyFreshness.current]])` | 普通 delivery close 要求 verify-code facts 齐；build-prd 没有 → close incomplete |
| 7 | `core/task-close.mjs:1722-1723` | `const prdBytes = gitBlobBytes(root, delivery.task_commit,`${delivery.spec_source_path}/prd.md`); if (prdBytes === null) throw new Error("planning close PRD declaration is unavailable from the task snapshot")` | **正是 D-025③ 说的「close 一直要求一个设计上拒绝产出的 `prd.md`」** |
| 8 | `core/task-close.mjs:1959` + `completion-predicates.mjs:930-932` | close 也走 `deriveCurrentProductRelease` → 同样吃到 5 条 `stage_completion_missing` | close 侧也确认被 5 阶段谓词考核 |
| — | **已有的部分支持**：`runtime/review/review-policy.mjs:68-74`（`stage === "build-prd"` → `matrix.non_stage?.build_prd`）与 `runtime/review/stage-materials.json:55-67`（`non_stage.build_prd` 的 required/optional/forbidden 面） | **审查面**已给 build-prd 单独的 non_stage 规则 | ⇒ 缺的只有**完成/收口面**，C6 只补这一面，不新增机制 |

**D-015③「链路功能验收」具体要验什么（从原文读出）**
出处：母材料 `:759` Talk 表 Q23 = **A**，原文：「正式改写「不要把 facts.jsonl 补写成第二权威」这条禁令；它成为唯一执行记录并按五要件登记；**补一条最小功能验收（写完 → status 立即可读 → 重放不产生重复）**」；由 D-029⑧（`:934`）正式编号为 **D-015③**（`:1658` 第 8 条再次点名）。

三步验收（本卡必须在动 status/close **之前**跑通）：

##### 1. 写完

向唯一执行记录（`facts.jsonl`，即 C3 的 K2 行）写入一阶段事实（含 D-005 三态字段：`review_origin` + 真实命令与退出码 + 四层状态 + 严重问题处置）。

##### 2. status 立即可读

同一写入后**立刻**用 `status` 读到该事实（无需任何重建、重算或投影生成步骤）。

##### 3. 重放不产生重复

重复同一次写入，`facts.jsonl` 行数与对象数**不变**（幂等）。
**失败判据**：任一环节需要「先重建投影 / 先重算哈希 / 先跑一次同步」，或重放产生第二行/第二个对象。

##### 13. 局部风险

- **D-020③ 已实测 close 强依赖投影 → 只改 status 不改 close 会直接破坏 close**（父材料原文）。本卡把二者绑同批，且 §18 已实测出真正的传递链在 `completion-predicates.mjs:1125`。
- **`quality_gaps` 与 `release_gaps` 是同一数组的拷贝**（`:417-418`）→ 删 `deriveProductRelease` 会同时打断 `close_preparation_gaps`（`:459`）与 `gap_groups`（`:447-448`），必须一起收。
- **`validateRiskCloseQualityReasons` 是 `manual-risk-close` 的唯一理由校验**（`:1763-1775` 要求完全一致且非空）→ 删 `quality_gaps` 而不给替代判据 = `manual-risk-close` 直接不可用。
- **D-024② 的 stale 显示位**：状态面还没有为「main 前进」预留显示位置；若同时删 `status_groups` 又加 stale 行，必须先定 stale 行的形状（这是 D-024②「需要一处显示 stale 的位置（并入 status 根因行）」的字面要求）。
- **`non_stage` 收口替代**：C6 若只把 `STAGES` 扩成 6 值，会让 build-prd 变成「第六个正式阶段」——违反 `workflows/build-prd/SKILL.md` 的 Boundaries（「Do not add `build-prd` to the canonical five stages」）与 D-025② 的「不按 5 阶段谓词收口」。替代必须走**显式的 non_stage 收口口径**，不是扩枚举。
- **真实 close 证据不可回退**：AC-8 需要一次真实 close，属不可逆动作 → 必须经人确认（`CONSTITUTION.md` F9 / `CLAUDE.md`「推进/不可逆操作经人确认」）。
- **测试 fixture 连带**：`tests/fixtures/public-behavior-baseline/v1/candidate.json` 有 **28 处** `quality/verify.json` 命中；删对象必须同批处理该 fixture 与 `tools/architecture/public-behavior-baseline.mjs:265`。

**14. 可后置技术项**：`none`（用户明确要求不产出延期项）。

##### 15. 最小读取集

- **必读**：`core/task-close.mjs:1359-1451`（`closeDelivery`）、`:1865-2060`（`prepareDeliveryClosePlan`）、`:2270-2400`（五步 executor）、`:1654-1675`（`targetPreflight` / `plannedMergePreflight`）、`:1763-1775`（`validateRiskCloseQualityReasons`）；`tools/cli/stage-runtime.mjs:319-350` 与 `:366-484` 与 `:670-773`；`runtime/stage/completion-predicates.mjs:7`、`:859-1006`、`:1020-1218`（含 `:1124-1132`）；`tools/cli/task-close.mjs:41-52`；`runtime/task/task-identity.mjs`（49 行，全文）；`runtime/evidence/storage-root.mjs:57-82`；`runtime/task/workspace.mjs:224-229` 与 `:325-360`。
- **条件读（改到才读）**：`runtime/stage/stage-handlers.mjs`（`deriveStatusGroups` 之外的 status 输入）、`runtime/evidence/quality-store.mjs:230-293`、`runtime/task/task-handle.mjs:417,873`、`runtime/task/task-kernel-implementation.mjs:770-825`、`runtime/task/task-store.mjs:110-130,185-195,240-265`、`tools/architecture/public-behavior-baseline.mjs:220-270`、`runtime/review/review-policy.mjs:68-74`、`runtime/review/stage-materials.json:55-67`、`workflows/build-prd/SKILL.md`（60 行）。
- **正常不读**：`runtime/stage/stage-content-contracts.mjs`（6,806 行）、`specs/**`、`docs/research/**`、`docs/operations/**`（表述类归 C7）。

##### 16. 五阶段开工说明

- **make-decision**：不适用为新建决定（D-011②/D-015③/D-023/D-024/D-025 已批准）。**但 D-024② 的 stale 显示形状、`non_stage` 收口口径、`risk_close` 理由校验的替代判据三处是新语义**——若这三处要改口径而非仅落地，须回到人。
- **build-spec**：把 §4 的 **11 条 FR** 与 §5 的 **15 条 AC** 定稿；**必须先写清 D-015③ 三步验收的判定方式**（哪个文件、哪条命令、什么算「重放不产生重复」）；写死 `C6-FR-11`（X47 承接）与 `C6-AC-14` 的通过/失败两面。
- **build-plan**：① 把「D-015③ 链路功能验收」排为**第 0 步**（在动 status/close 之前）；② 排「同文件串行」（C5 先于 C6）；③ 把 `AGENTS.md:44/:58` 与 `public-behavior-baseline` fixture 标为交接给 C7 / 同批改；④ AC-8 的真实 close 证据单独排期并预留人的确认点。
- **build-code**：按 §17 只跑受影响测试；**禁止全量回归**。
- **verify-code**：以 §6 的源码取证 + AC-7 三步实测 + AC-8 一次真实 close 的观测记录为收口证据。

**17. 受影响测试清单与命令**（全部 `test -e` 已验证存在）

| 测试文件 | 实测行数 | 为什么受影响 |
| --- | --- | --- |
| `tests/contract/status-derivation.test.mjs` | 682 | `deriveStatusGroups` / `quality/verify.json`（`:72,:99,:621-622`）/ status 形状 |
| `tests/close/close-contract.test.mjs` | 241 | close 契约 |
| `tests/contract/close-sidecar-and-archive.test.mjs` | — (存在) | sidecar 检查位置（AC-8） |
| `tests/contract/close-authorization-diagnostics.test.mjs` | — (存在) | close 授权诊断 |
| `tests/integration/vnext-delivery-close.test.mjs` | 700 | 五步 delivery close 全链（AC-8） |
| `tests/integration/build-prd-delivery.test.mjs` | — (存在) | **non_stage 收口（AC-9）** |
| `tests/contract/build-prd-review-contract.test.mjs` | — (存在) | build-prd non_stage 审查面 |
| `tests/contract/identity-resolution.test.mjs` | 115 | D-024① 入口解析（AC-10） |
| `tests/contract/verify-publication.test.mjs` | — (存在) | `quality/verify.json` 发布路径（AC-4） |
| `tests/integration/projection-replacement.test.mjs` | — (存在) | 投影替换（`:38` 读 `quality/verify.json`） |
| `tests/contract/task-bootstrap-integrity.test.mjs` | — (存在) | bootstrap 写 `quality/verify.json`（`:62,:69`） |
| `tests/verify-code-facts.test.mjs` | — (存在) | verify 叶子发布（`:80,:99`） |
| `tests/contract/public-behavior-baseline.test.mjs` | — (存在) | fixture 排除清单 |
| `tests/contract/control-plane-governance.test.mjs` | — (存在) | 控制面登记（净增减申报） |
| `tests/stage-risk-acceptance.test.mjs` | — (存在) | `risk_close` / `quality_gaps` 一致性（AC-6） |
| `tests/contract/human-confirmation-v3.test.mjs` | — (存在) | close 确认链 |
| `tests/integration/vnext-official-stage-run.test.mjs` | — (存在) | 五阶段 current（AC-9 反向：正式阶段仍受考核） |
| `tests/final-cutover-guards.red.test.mjs` | — (存在) | 收口守卫 |

命令（逐条，不合并成全量）：

```bash
npx vitest run tests/contract/status-derivation.test.mjs tests/close/close-contract.test.mjs
npx vitest run tests/contract/close-sidecar-and-archive.test.mjs tests/contract/close-authorization-diagnostics.test.mjs
npx vitest run tests/integration/vnext-delivery-close.test.mjs
npx vitest run tests/integration/build-prd-delivery.test.mjs tests/contract/build-prd-review-contract.test.mjs
npx vitest run tests/contract/identity-resolution.test.mjs tests/contract/verify-publication.test.mjs
npx vitest run tests/integration/projection-replacement.test.mjs tests/contract/task-bootstrap-integrity.test.mjs tests/verify-code-facts.test.mjs
npx vitest run tests/stage-risk-acceptance.test.mjs tests/contract/human-confirmation-v3.test.mjs
npx vitest run tests/contract/public-behavior-baseline.test.mjs tests/contract/control-plane-governance.test.mjs
npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/final-cutover-guards.red.test.mjs
```

纪律：**不跑** `npm test` / `npm run check` / `npm run test:safe`。

**18. 控制面净增减申报**（`wc -l` 实测；「删行下限」= 含可删符号的行数，下限估计）

| 文件 | 实测行数 | 删行下限 | 预计删除后 | 净 |
| --- | --- | --- | --- | --- |
| `core/task-close.mjs` | 2,613 | 24 → **收窄为 18（下限）** | ~2,595 | −18（下限）：**X47 承接**=删 3 条哈希正则 + 收敛 2 处 string 要求，**保留** `materials[file]` sha256 与 `prd.md` 附件绑定；`quality_gaps` 10 处收口另计。**同文件与 C7 交接**（`operations/close/**` 落盘段删除）⇒ **串行：C6 先合、C7 后合** |
| `tools/cli/stage-runtime.mjs` | 1,095 | 12（C6 部分；C5 另 38） | ~1,057（合计口径，见 C5） | −12（C6 下限） |
| `runtime/stage/completion-predicates.mjs` | 1,259 | 9（C6 部分；C5 另 54） | ~1,196 | −9（C6 下限） |
| `runtime/evidence/quality-store.mjs` | 293 | 5 | ~288 | −5 |
| `runtime/task/task-store.mjs` | 334 | 6 | ~328 | −6 |
| `runtime/task/task-handle.mjs` | 959 | 2 | ~957 | −2 |
| `runtime/task/task-kernel-implementation.mjs` | 1,177 | 9（C6 部分；C5 另 39） | ~1,138 | −9（C6 下限） |
| `runtime/stage/stage-runner.mjs` | 3,161 | 1（C6 部分；C5 另 77） | ~3,084 | −1（C6 下限） |
| `runtime/stage/stage-agent-outcome-adapter.mjs` | 1,096 | 1（C6 部分；C5 另 34） | ~1,062 | −1（C6 下限） |
| `tools/architecture/public-behavior-baseline.mjs` | 515 | 1 | ~514 | −1 |
| `tools/architecture/verify-final-coverage.mjs` | 481 | 1 | ~480 | −1 |
| `runtime/schemas/quality-verify.v1.json` | **25** | 25（**整文件删除**） | 0 | **−25** |
| `tests/fixtures/public-behavior-baseline/v1/candidate.json` | — (存在) | **28 处**命中（预计删除整 fixture 条目，行数） | unknown | unknown |
| `workflows/build-prd/SKILL.md` | — | 0 | — | 0 |

**新增控制面申报**：D-024② 需要一个 **stale 显示位**（并入 status 根因行，**不新建对象**）；D-025② 只需要**把谓词遍历集合钉死为 `STAGES`**（`non_stage` 写入口径由 **裁定 J-2** 在 C3 内给出；**不扩 `STAGES` 枚举、不新增 stage、不新增 command**）；`risk_close` 理由校验需要**裁定 J-7.2 的替代判据**（与 status 根因行登记的具名 ref 集合逐项全等；**不新增持久对象**）；**X47 的承接只删不增**（`C6-FR-11`：删 3 条哈希正则、保留 `materials[file]` sha256 与 `prd.md` 附件绑定）。⇒ 新增 **0 个文件、0 个对象、0 个 command**；净减 **≥ 约 −95 行**（C6 单独下限；与 C5 合计见 C5 §18）。**无新控制面**。

---

## 实测记录 · 任务Ⅱ-B（C5 / C6）（命令原文 + 关键输出）

### 环境与基线

```text
$ cd /Users/Hugh/Hugh/Project/workflowhub && git rev-parse HEAD && git status --porcelain | head -20 && pwd
216a546d4ec33ca3804a188a14a9536a2968f77c
?? .planning/2026-09-10-workflowhub-postmortem/
/Users/Hugh/Hugh/Project/workflowhub
```

### 单文件行数（`wc -l` 原文）

```text
$ wc -l runtime/evidence/freshness.mjs runtime/stage/completion-predicates.mjs runtime/stage/stage-runner.mjs \
      runtime/review/review-record-route.mjs runtime/stage/stage-agent-outcome-adapter.mjs \
      runtime/task/task-kernel-implementation.mjs runtime/evidence/canonical-receipt-writer.mjs \
      runtime/stage/stage-handlers.mjs runtime/task/git-worktree-snapshot.mjs \
      runtime/evidence/check-skill-closure.mjs runtime/evidence/write-boundary-preflight.mjs \
      tools/cli/check-extensibility.mjs tools/cli/scan-core-files.mjs \
      runtime/stage/stage-content-contracts.mjs core/task-close.mjs tools/cli/stage-runtime.mjs \
      tools/cli/task-close.mjs runtime/evidence/quality-store.mjs
     781 runtime/evidence/freshness.mjs
    1259 runtime/stage/completion-predicates.mjs
    3161 runtime/stage/stage-runner.mjs
    1257 runtime/review/review-record-route.mjs
    1096 runtime/stage/stage-agent-outcome-adapter.mjs
    1177 runtime/task/task-kernel-implementation.mjs
     870 runtime/evidence/canonical-receipt-writer.mjs
    3956 runtime/stage/stage-handlers.mjs
     647 runtime/task/git-worktree-snapshot.mjs
     824 runtime/evidence/check-skill-closure.mjs
     246 runtime/evidence/write-boundary-preflight.mjs
     218 tools/cli/check-extensibility.mjs
      41 tools/cli/scan-core-files.mjs
    6806 runtime/stage/stage-content-contracts.mjs
    2613 core/task-close.mjs
    1095 tools/cli/stage-runtime.mjs
     204 tools/cli/task-close.mjs
     293 runtime/evidence/quality-store.mjs
```

**`stage-content-contracts.mjs` 裁定**：实测 **6,806 行**（与父材料 RK-4 / OPN-3 的 6,806 **一致**；D-015 M5 基线的 6,485 在 HEAD **不成立** —— 与母材料 N-001-z `:885` 的「6,485 → 6,806」记录一致）。

```text
$ wc -l runtime/schemas/stage-skill-deps.schema.json runtime/schemas/quality-verify.v1.json \
      runtime/evidence/quality-fact.mjs runtime/review/review-policy.mjs \
      runtime/evidence/storage-root.mjs runtime/stage/stage-context.mjs \
      tests/contract/status-derivation.test.mjs tests/close/close-contract.test.mjs \
      tests/close/freshness-consistency.test.mjs tests/integration/vnext-delivery-close.test.mjs \
      tests/contract/stage-completion.test.mjs tests/review/review-record-route.test.mjs
      72 runtime/schemas/stage-skill-deps.schema.json
      25 runtime/schemas/quality-verify.v1.json
      94 runtime/evidence/quality-fact.mjs
     103 runtime/review/review-policy.mjs
      82 runtime/evidence/storage-root.mjs
     228 runtime/stage/stage-context.mjs
     682 tests/contract/status-derivation.test.mjs
     241 tests/close/close-contract.test.mjs
      67 tests/close/freshness-consistency.test.mjs
     700 tests/integration/vnext-delivery-close.test.mjs
     443 tests/contract/stage-completion.test.mjs
    1385 tests/review/review-record-route.test.mjs
```

```text
$ wc -l workflows/*/skill-deps.yaml
      20 workflows/build-code/skill-deps.yaml
      22 workflows/build-plan/skill-deps.yaml
       6 workflows/build-prd/skill-deps.yaml
      28 workflows/build-spec/skill-deps.yaml
      26 workflows/make-decision/skill-deps.yaml
      14 workflows/verify-code/skill-deps.yaml
     116 total
```

### C5：哈希失效链标识符计数（生产侧 vs 测试侧）

```text
$ count() { local id="$1"; ... }   # 见下：ALL / TEST / PROD(rest) 三口径
material_revision            ALL=161f/789h  TEST=57f/281h  PROD(rest)=104f/508h
materialRevision             ALL=56f/355h   TEST=25f/134h  PROD(rest)=31f/221h
snapshot_tree                ALL=241f/1605h TEST=92f/675h  PROD(rest)=149f/930h
snapshotTree                 ALL=64f/530h   TEST=29f/241h  PROD(rest)=35f/289h
evaluateFactFreshness        ALL=24f/69h    TEST=10f/49h   PROD(rest)=14f/20h
isStageSnapshotCurrent       ALL=5f/13h     TEST=1f/4h     PROD(rest)=4f/9h
materialRevisionFromValues   ALL=22f/51h    TEST=7f/23h    PROD(rest)=15f/28h
stageMaterialScopeRevision   ALL=11f/30h    TEST=3f/6h     PROD(rest)=8f/24h
isMaterialOnlySnapshotDelta  ALL=14f/30h    TEST=1f/4h     PROD(rest)=13f/26h
```

（口径：`grep -rI --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.planning` 全仓；TEST = 路径含 `__tests__` / `/tests/` / `.test.`；PROD = 其余。）

生产侧限制在 `runtime/ core/ tools/ skills/ workflows/ config/ scripts/ bin/`（排除 `__tests__`/`tests/`/`.test.`）的计数：

```text
material_revision            prod_files=42  prod_hits=329
materialRevision             prod_files=19  prod_hits=198
snapshot_tree                prod_files=55  prod_hits=589
snapshotTree                 prod_files=28  prod_hits=267
evaluateFactFreshness        prod_files=4   prod_hits=8
isStageSnapshotCurrent       prod_files=3   prod_hits=8
materialRevisionFromValues   prod_files=10  prod_hits=24
stageMaterialScopeRevision   prod_files=8   prod_hits=24
isMaterialOnlySnapshotDelta  prod_files=7   prod_hits=17
currentness                  prod_files=0   prod_hits=0
```

**`currentness` 零命中复核**（case-insensitive，全仓，排除 node_modules）：

```text
$ grep -rni 'currentness' . --include='*' | grep -v node_modules
./specs/archive/workflowhub-verify-close-protocol-robustness-20260902/spec.md:331: ...
./specs/archive/workflowhub-make-decision-hardening/tasks.md:297,311,346,348,477: ...
./specs/archive/workflowhub-make-decision-hardening/plan.md:41,332,343: ...
./specs/archive/workflowhub-execution-simplification-20260907/plan.md:179: ...
./.planning/2026-09-09-build-spec-and-build-plan/build-code-P3-phase-card.md:7: ...
./.planning/2026-09-09-build-spec-and-build-plan/build-code-P3-review-request.json:12: ...
```

⇒ 只在历史 `specs/archive/**` 与 `.planning/**` 出现；`runtime/ tools/ core/` 零命中。`isCurrent*` 系列实测只命中 `runtime/task/git-worktree-snapshot.mjs:34,267,461,491,521` 的 `isCurrentMaterialPath`（与 currentness 无关）。

### C5：`check-skill-closure.mjs` 实测行号与 `npm run check` 影响

```text
$ wc -l runtime/evidence/check-skill-closure.mjs
     824 runtime/evidence/check-skill-closure.mjs

$ sed -n '148,165p' runtime/evidence/check-skill-closure.mjs
    ]),
    completion_evidence: Object.freeze([
      Object.freeze({ kind: "portable_workflow_outcome", uri_or_path: "quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json" }),
    ]),
  }),
]);
const PORTABLE_DEPENDENCY_IDENTITY = Object.freeze(["task_id", "stage", "material_revision", "snapshot_tree"]);
const PORTABLE_DEPENDENCY_INPUTS = Object.freeze(["decision", "required_sources", "map_confirmation", "design_facts"]);
...
$ sed -n '280,300p' runtime/evidence/check-skill-closure.mjs
    if (typeof dep.trigger !== "string" || dep.trigger.trim() === "") errors.push(`${label} trigger is invalid`);
    const consumer = dep.consumer;
    ...
    if (consumer.target !== "build-prd#orchestrate") errors.push(`${label} consumer target must be build-prd#orchestrate`);
    if (JSON.stringify(consumer.inputs) !== JSON.stringify(PORTABLE_DEPENDENCY_INPUTS)) {
      errors.push(`${label} consumer inputs are invalid`);
    }
    if (JSON.stringify(consumer.identity) !== JSON.stringify(PORTABLE_DEPENDENCY_IDENTITY)) {
      errors.push(`${label} consumer identity is invalid`);
    }
```

⇒ 父材料给的 `:154,:290` **实测一致**。

```text
$ node -e "const p=require('./package.json');console.log(JSON.stringify(p.scripts,null,1))"
{
 "check": "markdownlint-cli2 \"**/*.md\" && node tools/cli/verify-structure.mjs && node tools/cli/run-checks.mjs && npm run check:skill-closure && npm run smoke:skill-packages",
 "check:skill-closure": "node runtime/evidence/check-skill-closure.mjs",
 "smoke:skill-packages": "node tools/cli/smoke-local-skill-dispatch.mjs",
 "probe:public-behavior": "WORKFLOWHUB_LIVE_PUBLIC_BEHAVIOR=1 vitest run tests/contract/public-behavior-baseline.test.mjs --poolOptions.forks.singleFork --no-fileParallelism",
 "compare:public-behavior": "node tools/architecture/public-behavior-baseline.mjs compare --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf --candidate=worktree",
 "test": "npm run test:safe && npm run test:exclusive",
 "test:safe": "vitest run --exclude=core/__tests__/check-extensibility.test.mjs --exclude=core/__tests__/check-anti-host.test.mjs",
 "test:exclusive": "vitest run core/__tests__/check-extensibility.test.mjs core/__tests__/check-anti-host.test.mjs --poolOptions.forks.singleFork --no-fileParallelism"
}
```

**`npm run check` 影响链（源码读出，未执行该脚本）**：`markdownlint-cli2` → `tools/cli/verify-structure.mjs` → `tools/cli/run-checks.mjs` → `npm run check:skill-closure` → `npm run smoke:skill-packages`。`check-skill-closure` 在这条链的**独立一环**（不是 `run-checks.mjs` 的子项）。

**漏项（父材料与地图都没点）—— 三方同步是四条不是三条**：

```text
$ grep -n 'material_revision\|snapshot_tree\|identity' runtime/schemas/stage-skill-deps.schema.json
22:            "required": ["target", "inputs", "identity"],
26:              "identity": {
27:                "const": ["task_id", "stage", "material_revision", "snapshot_tree"]
```

⇒ 只改 `check-skill-closure.mjs:154/:290` + 6 个 `skill-deps.yaml` 而不改 `runtime/schemas/stage-skill-deps.schema.json:27`，5 个正式 stage 的 `skill-deps.yaml` 会 **schema 校验失败**（`:487` `validateManifest = schemaValidator(root, "stage-skill-deps")`、`:630` `validateSchema(...)`）→ `check-skill-closure` 非 0 → `npm run check` 红。

**6 个 `workflows/*/skill-deps.yaml` 的 47 处实测分布**：

```text
$ for f in workflows/*/skill-deps.yaml; do echo "$f : $(grep -c 'material_revision' "$f")"; done
workflows/build-code/skill-deps.yaml : 9
workflows/build-plan/skill-deps.yaml : 12
workflows/build-prd/skill-deps.yaml : 1
workflows/build-spec/skill-deps.yaml : 13
workflows/make-decision/skill-deps.yaml : 8
workflows/verify-code/skill-deps.yaml : 4
$ grep -rn 'material_revision' workflows/*/skill-deps.yaml | wc -l
      47
```

⇒ D-029⑦ 的「6 个 `workflows/*/skill-deps.yaml`（47 处 `material_revision`）」 **实测一致**。

`workflows/build-prd/skill-deps.yaml` 全文（6 行）：

```text
stage: build-prd
skills:
  - { name: spec-prd, path: skills/spec-prd/SKILL.md, execution: independent, trigger: prd_outline_or_detail, bundle: skills/spec-prd/skill-bundle.json, owner: portable_workflow, consumer: { target: "build-prd#orchestrate", inputs: ["decision", "required_sources", "map_confirmation", "design_facts"], identity: ["task_id", "stage", "material_revision", "snapshot_tree"], result: "prd_draft_or_body" } }
runtime_capabilities:
  - { id: node, kind: cli, version_policy: ">=24", doctor: [node, --version], required_when: always, absence_semantics: diagnostic }
external_capabilities: []
```

⇒ T-7#3 的 `identity` 在 `:3`，实测一致。

### C5：写口身份核对当前实现

```text
$ wc -l runtime/evidence/write-boundary-preflight.mjs
     246 runtime/evidence/write-boundary-preflight.mjs

$ grep -n 'snapshot\|digest\|sha256\|taskId\|task_id\|worktree\|bytes\|pathCard\|identity\|export ' runtime/evidence/write-boundary-preflight.mjs
7:import { inspectOfficialInvocation, isOfficialInvocation, persistOfficialInvocation } from "./invocation-identity.mjs";
9:import { assertCurrentSourceDigest, captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
15:function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
44:export function inspectWriteBoundary({ task, stage, operation, invocation, workspace, sourceDigest } = {}) {
52:  if (sourceDigest !== undefined && !HASH.test(sourceDigest ?? "")) throw new TypeError(...)
56:  if (targetTop !== handle.manifest.target_repo_root) violations.push("TARGET_GIT_TOP_MISMATCH");
65:      if (targetGitTop(worktreeRoot) !== worktreeRoot) violations.push("WORKTREE_GIT_TOP_MISMATCH");
68:      if (common !== targetCommon) violations.push("WORKTREE_TASK_REPOSITORY_MISMATCH");
70:      violations.push("WORKTREE_IDENTITY_INVALID");
74:      const snapshot = sourceDigest === undefined
75:        ? captureGitWorktreeSnapshot(worktreeRoot, handle.identity.taskId)
76:        : assertCurrentSourceDigest(worktreeRoot, sourceDigest, handle.identity.taskId);
77:      observedSourceDigest = snapshot.source_digest;
80:        violations.push("SOURCE_SNAPSHOT_UNAVAILABLE");
87:    violations.push("INVOCATION_IDENTITY_INVALID");
100:        violations.push("INVOCATION_RECORD_UNAVAILABLE");
104:      if (sha256(raw) !== invocation.hash) violations.push("INVOCATION_RECORD_HASH_MISMATCH");
113:    if (!identity || identity.task_id !== handle.identity.taskId || identity.project_name !== handle.identity.projectName
114:        || identity.stage !== stage) {
115:      violations.push("INVOCATION_IDENTITY_INVALID");
116:    } else if (identity.source_kind !== "git_invocation" || typeof identity.source_clean !== "boolean"
117:        || !OID.test(identity.source?.git_oid ?? "") || !OID.test(identity.source?.git_tree ?? "")
118:        || !HASH.test(identity.contracts?.agents?.sha256 ?? "")
119:        || !HASH.test(identity.contracts?.stage_skill?.sha256 ?? "")
120:        || !HASH.test(identity.contracts?.constitution?.sha256 ?? "")) {
121:      violations.push("EXECUTION_CONTENT_IDENTITY_INVALID");
154:export function assertWriteBoundary(input) {
205:export function persistWriteBoundaryPathCard({ task, boundary, source } = {}) {
208:      || boundary.task_id !== handle.identity.taskId
217:  if (sha256(sourceRaw) !== source.hash) throw new Error("path card source hash is stale");
234:  const ref = `identity/path-cards/${boundary.stage}/${sha256(raw)}.json`;
```

⇒ 「待写字节」核对在 `:217`（`persistWriteBoundaryPathCard`），不在 `inspectWriteBoundary` 里；`inspectWriteBoundary` 自身**没有**「待写字节」项。三项对照见 C5 §2 表。

`identity/path-cards/**` 的产出者与消费者：

```text
$ grep -rn 'assertWriteBoundary\|write-boundary-preflight\|identity/path-cards\|persistWriteBoundaryPathCard' \
    runtime/stage/stage-runner.mjs runtime/stage/stage-context.mjs runtime/task/task-handle.mjs tools/cli/check-task-record-paths.mjs
runtime/stage/stage-runner.mjs:1345:function assertWriteBoundary(ctx) {
runtime/stage/stage-runner.mjs:1364:  assertWriteBoundary(ctx);
runtime/stage/stage-context.mjs:9:import { authenticateWriteBoundary } from "../evidence/write-boundary-preflight.mjs";
tools/cli/check-task-record-paths.mjs:81:  ["runtime/evidence/write-boundary-preflight.mjs", new Set(["caller-supplied storage/task path capability"])],
```

（母材料 T-7#1 `:192` 说 `identity/path-cards/**` 由 `write-boundary-preflight.mjs:139,234` 产出、`identity/executions/**` 由 `invocation-identity.mjs:78` 产出、`task-handle.mjs:850` 校验 path-card 路径形状 —— HEAD 实测 `:139` 是 `path_card` 起始行、`:234` 是 ref 生成行、`invocation-identity.mjs:78` 是 `const ref = \`identity/executions/${runId}.json\``一行，**均一致**；`task-handle.mjs:850` 未逐字复核，标 `unknown`。）

**写口源码断言测试（会红的硬耦合）**：

```text
$ sed -n '8,14p' tests/left-shift/left-shift-suite.test.mjs
  it("FR-LEFT-001: stage-runner source contains write-boundary identity and cwd assertions", () => {
    const src = readFileSync(fileURLToPath(new URL("../../runtime/stage/stage-runner.mjs", import.meta.url)), "utf8");
    expect(src).toContain("function assertWriteBoundary(");
    expect(src).toContain("kernel.task !== task");
    expect(src).toContain("cwd is outside the task worktree");
    expect(src).toContain("assertWriteBoundary(ctx);");
  });
```

### C5：`git-worktree-snapshot.mjs` 的写路径

```text
$ grep -n '^export \|^function \|^async function \|writeFileSync\|materialize\|ensureGitSnapshotObjectStore' \
    runtime/task/git-worktree-snapshot.mjs
23:export const EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES = Object.freeze(["evidence/", "quality/", ".multica/"]);
28:export const CLOSE_EXECUTION_SIDECAR_PREFIXES = Object.freeze([
34:function isCurrentMaterialPath(path, taskId = null) {
93:export function listCloseExecutionSidecarPaths(root, { taskId } = {}) {
107:export function assertNoCloseExecutionSidecars(root, options = {}) {
142:export function ensureGitSnapshotObjectStore(root) {
146:function hashObject(format, type, body) {
150:function writeLooseObject(objectDir, format, type, body) {      # ← writeFileSync :157
199:export function materializeGitSnapshot(root, snapshot) {        # ← 写路径
432:function captureSnapshot(root, excludedPrefixes = [], taskId = null) {   # :436 ensureGitSnapshotObjectStore
469:export function captureGitWorktreeSnapshot(root, taskId = null) { return captureSnapshot(root, [], taskId); }
472:export function captureExecutionSnapshot(root, taskId = null) { return captureSnapshot(root, EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES, taskId); }
480:export function isMaterialOnlySnapshotDelta(root, expectedTree, actualTree, taskId = null) {
503:export function isStageMaterialOnlySnapshotDelta(root, expectedTree, actualTree, {
552:export function materialRevisionFromValues(values) {
569:export function isExecutionRecordOnlyMaterialDelta(root, expectedTree, actualTree, taskId) {
594:export function assertCurrentSourceDigest(root, expectedDigest, taskId = null) {
621:export function equivalentWorkspaceTrees(root, expectedTree, actualTree) {
```

写路径的消费者（`captureGitWorktreeSnapshot` / `captureExecutionSnapshot` import 点）：

```text
runtime/evidence/write-boundary-preflight.mjs:9
runtime/evidence/invocation-identity.mjs:8
runtime/evidence/canonical-receipt-writer.mjs:11
runtime/stage/stage-agent-outcome-adapter.mjs:8
runtime/task/task-kernel-implementation.mjs:8
core/task-close.mjs:8
skills/wh-review/scripts/review-runner.mjs:14
skills/mini-task/scripts/mini-task-runner.mjs:5
```

### C5：`check-extensibility.mjs` 的 content hash 用法（裁定 C）

```text
$ wc -l tools/cli/check-extensibility.mjs tools/cli/scan-core-files.mjs
     218 tools/cli/check-extensibility.mjs
      41 tools/cli/scan-core-files.mjs

$ grep -n 'scanCoreFiles\|createHash\|hash\|sha256\|digest\|coreFiles' tools/cli/check-extensibility.mjs
10: * Runtime-zero-diff is measured by content-hash of scanCoreFiles() before/after
21:import { createHash } from "node:crypto";
27:// scanCoreFiles is the single source of truth for the production runtime body.
28:import { scanCoreFiles } from "./scan-core-files.mjs";
32:// tools/cli/ -> repository root. Keep checker fixtures and runtime snapshots
48:function sha256(content) {
49:  return createHash("sha256").update(content).digest("hex");
54:  const files = scanCoreFiles();
56:    snapshot.set(relative(repoRoot, f), sha256(readFileSync(f)));
74:  const files = scanCoreFiles();
79:    if (expected.get(rel) !== sha256(readFileSync(f))) {
```

```text
$ cat tools/cli/scan-core-files.mjs      # 41 行全文要点
 * Returns all *.mjs files under runtime/. Compatibility files under core/ are
 * intentionally outside this production-root check.
 ...
export function scanCoreFiles() {
  const runtimeDir = join(repoRoot, "runtime");
  return collectMjs(runtimeDir).sort();     # 跳过 __tests__
}
```

```text
$ grep -n 'createCoreSnapshot\|baselineCoreSnapshot\|coreDiffEmpty' core/__tests__/check-extensibility.test.mjs | head
17:let createCoreSnapshot, verifySwappability, verifyExtensibility;
20:  createCoreSnapshot = mod.createCoreSnapshot;
75:  it("reports coreDiffEmpty = true (no core files were modified)", () => {
77:    expect(result.coreDiffEmpty).toBe(true);
84:describe("FR-EXT-001 falsifiability: core file modified → verifySwappability fails", () => {
96:    baselineCoreSnapshot = createCoreSnapshot();
122:  it("returns passed=false when a core file has been modified (coreDiffEmpty=false)", () => {
190:describe("FR-EXT-002 falsifiability: core file modified → verifyExtensibility fails", () => {
200:    baselineCoreSnapshot = createCoreSnapshot();
227:  it("returns passed=false when a core file has been modified", () => {
```

```text
$ wc -l core/__tests__/check-extensibility.test.mjs
     304 core/__tests__/check-extensibility.test.mjs

$ sed -n '184,188p' tools/cli/run-checks.mjs
  // 2. check-extensibility (no args, CLI self-builds tmpdir config)
  console.log("[run-checks] running check-extensibility ...");
  const extCode = runChecker("check-extensibility", []);
  if (extCode !== 0) failures.push({ name: "check-extensibility", code: extCode });
```

### C6：status 输出形状与四个派生投影

```text
$ grep -n 'deriveStatusGroups\|status_groups\|quality_gaps\|release_gaps\|close_preparation_gaps\|actionable_now' tools/cli/stage-runtime.mjs
366:export function deriveStatusGroups({ ... } = {}) {
400:  const actionable_now = [];
408:      actionable_now.push(subject);
414:      actionable_now.push(subject);
417:  const quality_gaps = [...new Set(productRelease?.reasons ?? [])];
418:  const release_gaps = [...quality_gaps];
423:      ...quality_gaps,
444:  for (const gap of release_gaps) {
459:  const close_preparation_gaps = close_gaps;
461:    actionable_now: Object.freeze(actionable_now),
464:    quality_gaps: Object.freeze(quality_gaps),
465:    release_gaps: Object.freeze(release_gaps),
472:    close_preparation_gaps: Object.freeze(close_preparation_gaps),
473:    next_action: actionable_now[0] ?? (external_unavailable[0] ?? null),
760:    const statusGroups = deriveStatusGroups({ stage: values.stage, quality, productRelease, observations: statusObservations, research: researchDisclosure });
770:      status_groups: statusGroups,
```

父材料 D-012 给 `deriveStatusGroups`（`tools/cli/stage-runtime.mjs:322`）—— HEAD 实测在 **`:366`**（行号已漂移）。

```text
$ grep -rn 'status_groups' --include='*.mjs' --exclude-dir=node_modules --exclude-dir=specs . | grep -v -E '__tests__|/tests/|\.test\.'
./tools/cli/stage-runtime.mjs:770:      status_groups: statusGroups,
$ grep -rln 'status_groups' --include='*.mjs' --exclude-dir=node_modules . | grep -E '__tests__|/tests/|\.test\.'
(空)
```

⇒ **全仓仅 1 处命中且是唯一产出点；连测试都没有消费者。** D-012「无任何仓内文件读 `status_groups`、属 print-only」**实测成立**。

status 返回对象的 11 个键（`:762-773`）：

```text
      ...progression,
      quality_status: quality.status,
      quality_missing: quality.missing,
      quality_fact_refs: Object.freeze(observations.map(({ fact }) => fact.ref).sort()),
      quality_predicates: quality.predicates,
      product_release_status: productRelease.status,
      product_release_reasons: productRelease.reasons,
      product_release_input_refs: productRelease.input_refs,
      status_groups: statusGroups,
      research: researchDisclosure,
      execution_outcome: executionOutcome?.[values.stage] ?? { status: "unavailable", blocking: false, attempt_count: 0, completed_attempt_count: 0, refs: [], diagnostic: null },
```

### C6：`quality/verify.json` 的写入者与读取者

```text
$ grep -rn 'quality/verify\.json\|quality-verify\.v1' --exclude-dir=node_modules --exclude-dir=.git \
    --exclude-dir=.planning --exclude-dir=specs . | grep -v -E '__tests__|/tests/|\.test\.'
./tools/architecture/verify-final-coverage.mjs:161
./tools/architecture/public-behavior-baseline.mjs:226,265
./runtime/evidence/quality-store.mjs:253,267,286,287,291
./runtime/schemas/quality-verify.v1.json:3,9
./runtime/task/task-handle.mjs:417,873
./runtime/task/task-kernel-implementation.mjs:777,794,802,804,807,812,813,819,823
./runtime/task/task-store.mjs:123,124,190,249,261,262
./runtime/stage/stage-agent-outcome-adapter.mjs:80
./runtime/stage/stage-runner.mjs:111
./runtime/stage/completion-predicates.mjs:363,375,381,1124,1127
./docs/research/... (3 个研究文档)
```

`core/task-close.mjs` **零命中**（它经 `deriveCurrentProductRelease` 间接依赖）。

```text
$ sed -n '1119,1132p' runtime/stage/completion-predicates.mjs
  // The verify summary is the existing per-AC product-result authority. It is
  // not a new store or a second status machine; it is the canonical record
  // already written by verify-code. Bind every criterion to the summary bytes
  // and refuse to treat a summary from another material/snapshot as current.
  try {
    const verifyRef = "quality/verify.json";
    const verifyRaw = read(verifyRef);
    const verify = JSON.parse(verifyRaw);
    const verifyIdentityCurrent = verify?.schema_version === "quality-verify.v1"
      && verify.task_id === taskId
      && verify.stage === "verify-code"
      && verify.material_revision === materialRevision
      && (verify.snapshot_tree === snapshotTree
        || (snapshotRoot && isMaterialOnlySnapshotDelta(snapshotRoot, verify.snapshot_tree, snapshotTree, taskId)));
```

父材料 N-001-v 与地图给 `:1124-1132` —— **实测一致**。所在函数（实测）= `deriveCurrentProductRelease`（`:1020` 定义），不是独立的谓词函数。

### C6：product-release 投影与 `core/task-close.mjs` 依赖

```text
$ grep -rn 'deriveProductRelease\|currentProductReleaseView\|product_release_status\|product_release_reasons\|product_release_input_refs' \
    --include='*.mjs' --exclude-dir=node_modules --exclude-dir=specs . | grep -v -E '__tests__|/tests/|\.test\.'
./tools/cli/stage-runtime.mjs:29,319,754,755,767,768,769
./runtime/stage/completion-predicates.mjs:859,1006,1217

$ grep -n 'for (const stage of STAGES)\|stage_completion_missing\|expected_acceptance_ids_missing\|no_applicable_acceptance_results' \
    runtime/stage/completion-predicates.mjs
900:    productReason(reasons, "expected_acceptance_ids_missing");
930:  for (const stage of STAGES) {
931:    if (!stageByName.has(stage)) productReason(reasons, `stage_completion_missing:${stage}`);
983:    productReason(reasons, "no_applicable_acceptance_results");

$ wc -l core/task-close.mjs && grep -c 'quality_gaps' core/task-close.mjs && grep -n 'quality_gaps' core/task-close.mjs
    2613 core/task-close.mjs
10
1066:      ...(Array.isArray(delivery.quality_gaps) ? delivery.quality_gaps : []),
1440:      quality_gaps: structuredClone(prepared.plan.delivery.quality_gaps),
1691:    validateRiskCloseQualityReasons(delivery.risk_close, delivery.quality_gaps);
1706:    if (!Array.isArray(delivery.quality_gaps)) throw new TypeError("planning close quality_gaps must be an array");
1772:    throw new Error("delivery risk close quality_reasons must exactly match current quality_gaps");
2041:      quality_gaps: [...new Set(qualityReasons)],
2161:      quality_gaps: Object.freeze([...new Set([
2162:        ...(delivery.quality_gaps ?? []),
2227:        quality_gaps: structuredClone(delivery.quality_gaps),
2605:        quality_gaps: structuredClone(delivery.quality_gaps),

$ grep -n 'deriveCurrentProductRelease' core/task-close.mjs
21:import { deriveCurrentProductRelease, deriveStageOutcomeStatuses, stageMaterialScopeRevisions, STAGE_PREDICATES, qualityPredicateSatisfied } from "../runtime/stage/completion-predicates.mjs";
1959:        productRelease = deriveCurrentProductRelease({
```

- `deriveCurrentProductRelease` 调用点 `:1959` —— 父材料 `:1959` **一致**。
- `delivery.quality_gaps` **实测 10 处** —— 父材料 D-020③ 写 8 处（母材料 R9 `:899` 已自更正为 10）。**以 HEAD 实测为准：10 处。**
- `validateRiskCloseQualityReasons` **定义在 `:1763-1775`**，调用点在 `:1691` —— 父材料给的 `:1772` 是**抛错那一行**（`throw new Error("delivery risk close quality_reasons must exactly match current quality_gaps")`），不是函数位置。

`validateRiskCloseQualityReasons` 全文（`core/task-close.mjs:1763-1775`）见 C6 §12 —— **回答：是，要求完全一致**（去重 + trim + 排序后长度相等且逐项相等），且 `quality_gaps` 为空时直接抛「requires at least one current quality gap」。

### C6：close 当前动作顺序与四项前置检查位置

```text
$ grep -n '^export function \|^export async function \|^function \|^async function \|^export const ' core/task-close.mjs | sed -n '1,200p'
1186:function validatePlan(plan, task) {
1359:export async function closeDelivery({
1451:function executorFor(executors, step) {
1654:function targetPreflight(delivery, expectedLocal = delivery.target_baseline, { checkRemote = true } = {}) {
1664:function plannedMergePreflight(delivery) {
1865:export function prepareDeliveryClosePlan({
2061:export function inspectDeliveryCloseState({ task: taskHandle, kernel: taskKernel, plan } = {}) {
2180:export async function completeDeliveryClosePlan({ ... } = {}) {
2270:export function createDeliveryCloseExecutorRegistry({ task: taskHandle, kernel: taskKernel, plan } = {}) {
2476:export async function executeClosePlan(options = {}) {

$ sed -n '1851,1857p' core/task-close.mjs
const DELIVERY_STEPS = Object.freeze([
  ["commit-delivery", "commit-delivery"],
  ["merge-task-branch", "merge-task-branch"],
  ["archive-spec", "archive-spec"],
  ["push-target-branch", "push-target-branch"],
  ["cleanup", "cleanup"],
]);

$ sed -n '2274,2275p' core/task-close.mjs
  if (plan.steps.length !== DELIVERY_STEPS.length || plan.steps.some((step, index) => step.step_id !== DELIVERY_STEPS[index][0] || step.operation !== DELIVERY_STEPS[index][1])) {
    throw new Error("delivery close plan must contain exactly the fixed five steps in order commit→merge→archive→push→cleanup");

$ grep -n 'plannedMergePreflight' core/task-close.mjs
1664:function plannedMergePreflight(delivery) {
2369:          plannedMergePreflight(delivery);
```

⇒ `plannedMergePreflight` **只有 1 个调用点，在 `:2369`（`merge-task-branch` executor 内）**；`prepareDeliveryClosePlan` **不调用它**。⇒ merge 预检确实在 `commit-delivery` **之后**。

```text
$ grep -n 'targetPreflight\|assertNoCloseExecutionSidecars' core/task-close.mjs
1654:function targetPreflight(...)
1894:  assertNoCloseExecutionSidecars(worktree, { taskId: task.identity.taskId });     # prepare，commit 前
2046:  targetPreflight(delivery);                                                     # prepare，commit 前
2316:          targetPreflight(delivery, undefined, { checkRemote: false });           # commit 步内
2317:          assertNoCloseExecutionSidecars(worktree, { ... });                        # commit 步内
2336:          assertNoCloseExecutionSidecars(worktree, { ... });                        # commit 步内
2345:          targetPreflight(delivery, null, { checkRemote: false });                  # archive 步内
2368:          targetPreflight(delivery, undefined, { checkRemote: false });             # merge 步内
2370:          targetPreflight(delivery, undefined, { checkRemote: false });             # merge 步内
2383:          targetPreflight(delivery, null);                                          # push 步内（checkRemote:true）
2437:              assertNoCloseExecutionSidecars(worktree, { ... });                    # cleanup 步内
```

### C6：`--task-path` 与 config resolver

```text
$ grep -c 'task-path' tools/cli/task-close.mjs tools/cli/task-bootstrap.mjs tools/cli/source-manifest.mjs tools/cli/stage-runtime.mjs
tools/cli/task-close.mjs:8
tools/cli/task-bootstrap.mjs:4
tools/cli/source-manifest.mjs:2
tools/cli/stage-runtime.mjs:0

$ sed -n '41,44p' tools/cli/task-close.mjs
function taskPath(values, project, taskId) {
  if (values["task-path"] !== undefined) return required(values, "task-path");
  return deriveTaskPath(resolveStorageRoot(), project, taskId);
}

$ sed -n '57,70p' tools/cli/stage-runtime.mjs
export function resolveWorkflowHubIdentity(values, cwd = process.cwd(), env = process.env) {
  const hasProject = typeof values.project === "string" && values.project.trim() !== "";
  const hasTask = typeof values.task === "string" && values.task.trim() !== "";
  if (hasProject !== hasTask) throw new TypeError("--project and --task must be supplied together");
  const explicit = hasProject ? Object.freeze({ project: validateProjectName(values.project), task: validateTaskId(values.task) }) : null;
  const derived = deriveIdentityFromAuthenticatedWorktree(cwd, env);
  if (explicit && derived && (explicit.project !== derived.project || explicit.task !== derived.task)) {
    throw new Error(`WorkflowHub identity conflict: explicit ${explicit.project}/${explicit.task} does not match authenticated worktree ${derived.project}/${derived.task}`);
  }
  if (explicit) return Object.freeze({ ...explicit, taskPath: undefined, source: "explicit" });
  if (derived) return derived;
  throw new Error("WorkflowHub identity missing: supply --project and --task or run from an authenticated task worktree");
}

$ grep -n 'status accepts only' tools/cli/stage-runtime.mjs
671:    if (Object.keys(values).some((key) => !allowed.has(key))) throw new TypeError("status accepts only --stage, --project, --task, and optional --reason");

$ sed -n '36,49p' runtime/task/task-identity.mjs
/** Derive the task leaf once at the launcher boundary. */
export function deriveTaskPath(storageRoot, projectName, taskId) {
  if (typeof storageRoot !== "string" || !isAbsolute(storageRoot)) throw new TypeError("storageRoot must be an absolute path");
  const root = resolve(storageRoot);
  const project = validateProjectName(projectName);
  const task = validateTaskId(taskId);
  const projectsRoot = resolve(root, "Projects");
  const taskPath = resolve(projectsRoot, project, "tasks", task);
  assertInside(projectsRoot, taskPath);
  return taskPath;
}

$ grep -rn 'export function resolveStorageRoot' runtime/evidence/storage-root.mjs
80:export function resolveStorageRoot({ env = process.env, home = homedir() } = {}) {
```

### C6：main 前进的 base OID 冻结点

```text
$ sed -n '325,341p' runtime/task/workspace.mjs
function validateCandidate(task, expected, facts = { worktree_root: expected.worktreeRoot, baseline_commit: expected.baselineCommit }) {
  if (typeof facts?.worktree_root !== "string" || resolve(facts.worktree_root) !== expected.worktreeRoot) {
    throw new Error(`make-decision worktree_root does not match the authenticated task workspace: ${facts?.worktree_root}`);
  }
  if (facts?.baseline_commit !== expected.baselineCommit) {
    throw new Error("make-decision baseline_commit does not match task worktree HEAD");
  }
  ...
  if (gitValue(realWorktree, ["rev-parse", "HEAD"], "task worktree HEAD") !== expected.baselineCommit) {
    throw new Error("task worktree HEAD must equal the make-decision baseline");
  }

$ sed -n '355,358p' runtime/task/workspace.mjs
    if (gitValue(realWorktree, ["rev-parse", "HEAD"], "CandidateWorkspace HEAD") !== expected.baselineCommit) throw new Error("CandidateWorkspace HEAD changed");

$ sed -n '1654,1662p' core/task-close.mjs
function targetPreflight(delivery, expectedLocal = delivery.target_baseline, { checkRemote = true } = {}) {
  const root = delivery.target_repo_root;
  if (gitResult(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]).stdout !== delivery.target_branch) throw new Error("target branch must be checked out in the target repository");
  const dirtySource = sourceWorktreeStatus(root);
  if (dirtySource !== "") throw new Error("target repository has uncommitted source changes; preserve them under their owning task before the authorized close merge");
  if (gitResult(root, ["rev-parse", "--verify", "MERGE_HEAD"]).ok) throw new Error("target repository has an unfinished merge");
  if (expectedLocal !== null && branchOid(root, delivery.target_branch) !== expectedLocal) throw new Error("local target baseline changed");
  if (checkRemote && remoteOid(root, delivery.remote, delivery.target_branch) !== delivery.remote_target_baseline) throw new Error("remote target baseline changed");
}
```

⇒ 全部是 **throw（硬失败）**，**没有一处报 stale**。

### C6：`non_stage` 被 5 阶段谓词考核的考核点

```text
$ sed -n '7p' runtime/stage/completion-predicates.mjs
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

$ sed -n '930,932p' runtime/stage/completion-predicates.mjs
  for (const stage of STAGES) {
    if (!stageByName.has(stage)) productReason(reasons, `stage_completion_missing:${stage}`);
  }

$ sed -n '1223,1224p' runtime/stage/completion-predicates.mjs
export function deriveStageProgress(stage, observations = [], materials = null) {
  if (!STAGES.includes(stage)) throw new TypeError(`unsupported stage: ${stage}`);

$ sed -n '2140,2150p' core/task-close.mjs
    ...(planningMode ? [["planning_material", planningArchive?.status === "complete" && delivery.material_status === "complete"]] : [["verify_facts_fresh", verifyFreshness.current]]),

$ sed -n '1722,1723p' core/task-close.mjs
    const prdBytes = gitBlobBytes(delivery.target_repo_root, delivery.task_commit, `${delivery.spec_source_path}/prd.md`);
    if (prdBytes === null) throw new Error("planning close PRD declaration is unavailable from the task snapshot");

$ sed -n '68,74p' runtime/review/review-policy.mjs
  if (stage === "build-prd") {
    if (track !== null && track !== undefined) throw new Error("MATERIAL_INCOMPLETE: build-prd review kind does not use review_track");
    if (reviewScope !== null && reviewScope !== undefined) throw new Error("MATERIAL_INCOMPLETE: build-prd review kind does not use review_scope");
    const rule = matrix.non_stage?.build_prd;
    if (!rule) throw new Error("MATERIAL_INCOMPLETE: build-prd review surface is unavailable");
    return rule;
  }

$ sed -n '55,67p' runtime/review/stage-materials.json
  "non_stage": {
    "build_prd": {
      "source_bundle": "none",
      "required": ["decision_log", "prd", "task_map", "design_facts", "quality_facts", "review_instructions"],
      "optional": [...],
      "generated": ["review_instructions"],
      "forbidden": [...],
      "minimum_reviewers": 1,
      "v2_required_maps": []
    }
  },
```

⇒ **是，被 5 阶段谓词考核**，考核点共 8 处（见 C6 §12 表）；**审查面**已有独立的 non_stage 规则，缺的只是**完成/收口面**。

### C6：D-015③ 原文（链路功能验收）

```text
$ grep -n 'D-015③\|链路功能验收' decision-log.md
649:    selected_disposition: "三项验收定稿；M1–M5 用已有历史数据复算；token 维度如实标记为不可得；链路功能验收写成 D-015③"
759:| Q23 | facts.jsonl 禁令改写 + 链路功能验收 | **A** | 正式改写「不要把 facts.jsonl 补写成第二权威」这条禁令；它成为唯一执行记录并按五要件登记；补一条最小功能验收（写完 → status 立即可读 → 重放不产生重复） |
934:  | 7 | ... | **D-029⑧**：...；把「链路功能验收」正式写成 D-015③ |
1387:  - **批次⑥**：...。**先补 D-015③ 的链路功能验收**。
1389:  - **批次⑧**：双证验收 —— 静态净减法 + M1–M5 对照 + D-015③ 链路功能验收；不可证伪项如实标 `unknown`。
1658:  8. **不可证伪声明**：...；「链路功能验收」正式写成 **D-015③**（此前只是 OI-017 的一行问题）。
```

⇒ **D-015③ 的具体内容 = Q23=A 的括号内容：写完 → status 立即可读 → 重放不产生重复。**

### C6：受影响测试文件存在性（`test -e`）

```text
$ for f in tests/contract/status-derivation.test.mjs tests/close/close-contract.test.mjs \
    tests/contract/close-sidecar-and-archive.test.mjs tests/contract/close-authorization-diagnostics.test.mjs \
    tests/integration/vnext-delivery-close.test.mjs tests/integration/build-prd-delivery.test.mjs \
    tests/contract/build-prd-review-contract.test.mjs tests/contract/identity-resolution.test.mjs \
    tests/contract/verify-publication.test.mjs tests/integration/projection-replacement.test.mjs \
    tests/contract/task-bootstrap-integrity.test.mjs tests/verify-code-facts.test.mjs \
    tests/contract/public-behavior-baseline.test.mjs tests/contract/control-plane-governance.test.mjs \
    tests/stage-risk-acceptance.test.mjs tests/contract/human-confirmation-v3.test.mjs \
    tests/integration/vnext-official-stage-run.test.mjs tests/final-cutover-guards.red.test.mjs \
    core/__tests__/check-extensibility.test.mjs core/__tests__/check-skill-closure.test.mjs \
    core/__tests__/invocation-identity.test.mjs tests/left-shift/left-shift-suite.test.mjs \
    tests/close/freshness-consistency.test.mjs tests/contract/per-ac-material-freshness.test.mjs \
    tests/contract/stage-completion.test.mjs tests/review/review-record-route.test.mjs \
    tests/integration/execution-snapshot-isolation.test.mjs tests/integration/verify-freshness-selection.test.mjs \
    tests/verify-code-freshness.test.mjs tests/contract/stage-skill-consumer-contract.test.mjs \
    tests/task-record-paths-check.test.mjs ; do
  printf '%-62s ' "$f"; test -e "$f" && echo EXISTS || echo MISSING; done
（全部 EXISTS，无一 MISSING）
```

### 未执行的命令（遵守硬规则，如实登记）

本草案**未执行**：`npm test`、`npm run check`、`npm run test:safe`、`npm run test:exclusive`、`npx vitest run`（任何全量）、`node runtime/evidence/check-skill-closure.mjs`、`node tools/cli/check-extensibility.mjs`。原因：`AGENTS.md` 测试硬规则 + 用户「不要跑全量测试」的明确要求。因此：

- `AC-3` 的「退出码 0」是**目标态**，不是实测值；HEAD 当前退出码 **`unknown`**。
- `AC-7` 的 `check-extensibility` 在 HEAD 是否已绿 —— **`unknown`**（源码读出它是同进程 before/after 比对，理论上应绿，但未运行验证）。
- `check-extensibility` 的「删哈希后是否会红」—— 实测源码得出**无代码依赖**（见 X41），但未运行验证。
- **未修改任何仓库文件**。本文件写在 `/tmp/wh-msd-build-prd/cards-task2b.md`（仓外）。

---

### 需要裁定的新增矛盾 · 任务Ⅱ-B（C5 / C6）

（主 PRD 已用 X1–X39；本组从 **X40** 起编号。）

| # | 矛盾 / 残留 | 两处原文位置 vs 实测 | 影响 | 建议裁定值 |
| --- | --- | --- | --- | --- |
| **X40** | C5 的具名清单**漏了第 4 个同步点** `runtime/schemas/stage-skill-deps.schema.json:27`（`"identity": { "const": ["task_id","stage","material_revision","snapshot_tree"] }`） | 父材料 D-029⑨(a)（`:941`）与地图 §2.3 C5（`map-v1.md:115`）只点了 `check-skill-closure.mjs:154,290` + 6 个 yaml；实测 `runtime/evidence/check-skill-closure.mjs` 在 `:487` 用 `schemaValidator(root,"stage-skill-deps")`、`:630` 用 `validateSchema(...)` 校验 5 个正式 stage 的 yaml | 只按具名清单改 → 5 个正式 stage 的 `skill-deps.yaml` schema 校验失败 → `check-skill-closure` 非 0 → `npm run check` 红 | 把 `runtime/schemas/stage-skill-deps.schema.json:27` **补进 C5 具名清单**，与 `check-skill-closure.mjs:154/:290` + 6 个 yaml **四方同批** |
| **X41** | **裁定 C 的理由句与实测不符**：父材料与地图说「C5 删哈希直接把它（`check-extensibility`）弄红」 | D-020②（`:1436`）与地图 §4.2 裁定 C（`map-v1.md:219`）的理由是「C5 删哈希直接把它弄红」；实测 `tools/cli/check-extensibility.mjs:52-59 createCoreSnapshot()` 在**同进程、`runKernel` 之前**抓 `scanCoreFiles()` 内容 sha256，`:72-89 isCoreUnchangedFromSnapshot()` 在调用后比对（调用点 `:103/:109/:113`、`:134/:141/:145`）。`scanCoreFiles()`（`tools/cli/scan-core-files.mjs:35`）扫的是 `runtime/**/*.mjs`，与 `material_revision`/`snapshot_tree` **零代码依赖** | 理由错会误导执行者以为「不改它就必红」，从而在选型时低估 A 方案（原样保留）的可行性 | **结论保留（归 C5 处置），理由改写成**「这是同类 content-hash 度量的最后一处，不是会被弄红的一处」。另记一处**文件头注释与实现不符**：`check-extensibility.mjs` 文件头与 `scan-core-files.mjs` 注释都写 `core/*.mjs`，实现扫 `runtime/` |
| **X42** | **D-020④ 的三个测试侧计数与 HEAD 实测不符** | 父材料 D-020④（`:1438`）：`snapshot_tree` **84 文件/589 命中**、`materialRevision` **20/114**、`evaluateFactFreshness` **10/48**。HEAD 实测（全仓 / 测试侧 / 生产侧）：`snapshot_tree` 241/1,605、**92/675**、149/930；`materialRevision` 56/355、**25/134**、31/221；`evaluateFactFreshness` 24/69、**10/49**、14/20。**注意 `589` 恰等于 `snapshot_tree` 的「生产侧命中数」**——父材料疑似把生产侧命中数标成了测试暴露面；「84 文件」在三种口径（241/92/149）下**都对不上** | C5 的受影响测试清单不能直接引用父材料数字；按它估工作量会低估 | **以 HEAD 实测为准**；C0 在基线口径里重列这三项，C7 更正父材料（并入 X2/X3 的同类处置） |
| **X43** | **`check-skill-closure` 与 `check-extensibility` 不在同一条 CI 链上**，但父材料与地图把它们并列描述 | `package.json` 的 `check` = `markdownlint-cli2` → `tools/cli/verify-structure.mjs` → `node tools/cli/run-checks.mjs` → `npm run check:skill-closure` → `npm run smoke:skill-packages`；`check-extensibility` 在 `tools/cli/run-checks.mjs:184-188`（run-checks 第 2 项）+ `package.json` 的 `test:exclusive`（`vitest run core/__tests__/check-extensibility.test.mjs ...`）。D-029⑨(a) 说 `check-skill-closure` 挂 `npm run check` **正确**，但它**不在** `run-checks.mjs` 里 | 执行者会以为改 `run-checks.mjs` 就能同时调两处；实际 `check-skill-closure` 走 `npm run check:skill-closure` | C5 的验收命令必须**两条链分别列**：`node runtime/evidence/check-skill-closure.mjs` 与 `node tools/cli/run-checks.mjs`（或 `npm run check` 全链）。C7 在文档里写清两条链的边界 |
| **X44** | **`currentness` 在 HEAD 是零命中标识符**，不是可 grep 的符号 | D-009①（`:1166`）与地图 §2.3 C5（`map-v1.md:115`）把「currentness」列为必删项之一；实测 `grep -rni 'currentness'`（全仓、排除 node_modules）只在 `specs/archive/**`（4 文件）与 `.planning/**`（2 文件）命中；`runtime/ tools/ core/` 零命中。`isCurrent*` 只命中 `runtime/task/git-worktree-snapshot.mjs` 的 `isCurrentMaterialPath`（`:34,267,461,491,521`，与 currentness 无关） | AC-1 若把 `currentness` 写进零残留 grep 清单，会得到「本来就 0」，无法证伪 | C5 的 AC-1 用**9 个真标识符**（`material_revision`/`materialRevision`/`snapshot_tree`/`snapshotTree`/`evaluateFactFreshness`/`isStageSnapshotCurrent`/`materialRevisionFromValues`/`stageMaterialScopeRevision`/`isMaterialOnlySnapshotDelta`）；「currentness」改写为**概念性删除**并在 spec 里注明它不是符号 |
| **X45** | **`--task-path` 的入口面比 D-024① 描述的窄** | D-024①（`:1528`）说「所有入口统一为…；`--task-path` 降为受控诊断 override」；实测接受 `--task-path` 的 CLI 只有 3 个：`tools/cli/task-close.mjs`（**8** 处）、`tools/cli/task-bootstrap.mjs`（**4**）、`tools/cli/source-manifest.mjs`（**2**）；`tools/cli/stage-runtime.mjs` **0 处**（已走目标形态：`resolveWorkflowHubIdentity` `:57-70`，`:671` status 只允许 `--stage/--project/--task/--reason`） | C6 把 D-024① 当成「全部入口大改」会高估工作量；反之若只改 stage-runtime 就以为完成，会漏掉真正还在用 `--task-path` 的 3 个 CLI | C6 的 D-024① 落地面 = **3 个 CLI**（`task-close` / `task-bootstrap` / `source-manifest`）；`stage-runtime` 已达标，只需补「记录来源」这一项对齐 |
| **X46** | **C5/C6 的同文件交接点比地图登记的更紧** | 地图 §2.3（`map-v1.md:113-129`）只写了 C5 的 consumer 是 C6，未登记同文件。实测 `runtime/stage/completion-predicates.mjs` 同时是 C5 的删除面（`isStageSnapshotCurrent` `:58`、`stageMaterialScopeRevision` `:37`，**54** 命中行）与 C6 的删除面（`deriveProductRelease` `:859`、`deriveCurrentProductRelease` `:1020`、`quality/verify.json` 谓词 `:1124-1132`，9 命中行）；`tools/cli/stage-runtime.mjs` 同样两边都碰（C5 38 命中行 / C6 `:319-350` + `:366-484` + `:760-773`） | 两卡并行会在同一文件冲突；若 C6 先合，C5 的删除面会与被删的投影交织 | 地图补一句：**C5 与 C6 在 `runtime/stage/completion-predicates.mjs` 与 `tools/cli/stage-runtime.mjs` 上必须串行（C5 先合）**；D-018 的「同文件同批」原则同样适用于跨卡 |
| **X47** | **planning close 的哈希校验会被 C5 打断，但没人把它列进 C5/C6 的具名清单** | `core/task-close.mjs:1712-1713`（在 `validateDeliveryPlan` 的 planning 分支内）：`\|\| !/^revision-[a-f0-9]{64}$/.test(planning.material_revision ?? "") \|\| !/^[a-f0-9]{40,64}$/i.test(planning.snapshot_tree ?? "") \|\| !/^[a-f0-9]{40}$/i.test(planning.snapshot_commit ?? "")` → 抛 `"planning close material identity is invalid"`；另`:1717-1720` 要求 `planning.materials[file]`全是 sha256；`:1803-1804``publishPlanningHumanConfirmation` 要求 `planning.material_revision`/`snapshot_tree`为 string。地图 §2.3 的 C5 具名清单（`map-v1.md:115`）与 C6 具名清单（`map-v1.md:124`）**均未包含 planning close** | C5 按具名清单删 `material_revision`/`snapshot_tree` 后，**planning close（build-prd 类任务的收口路径）会直接抛错**；而 C6 的 D-025② 又要求「`non_stage` 只保证自己的材料与事实」——两条恰好指向同一处 | **planning close 的哈希校验归 C6**（与 D-025② 同批），在 C5 的具名清单里显式登记为**跨卡排除项**并写明「不得由 C5 单方面删除，须由 C6 在改 planning 收口口径时一并处置」 |

**X40–X47 的共同点**：全部是「父材料或已确认地图的具名清单/计数与 HEAD 实测不符」。影响面集中在 **C5 的可执行性**（X40、X42、X44）与 **C5↔C6 的批次边界**（X46、X47）；X41 影响裁定 C 的表述而非归属，X43 影响验收命令的写法，X45 影响 D-024① 的落地面估算。建议在地图核对时一并确认或否掉，并把 X40/X46/X47 写回 C5/C6 的具名清单与「同文件同批」约束。

---

### 任务Ⅲ 卡片（C7 / C8）

- 组：任务Ⅲ（2 张卡）；卡号 = 批次号（D-018 修订 L1380–L1391）
- 主仓 HEAD：`216a546d4ec33ca3804a188a14a9536a2968f77c`（2026-09-10，实测）
- 母材料：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-20260910/specs/workflowhub-mechanism-simplification-20260910/decision-log.md`
  - decision_revision（实测）：`sha256:9c5c45a2c06ff5cb01809a2712064577e84f69ef1e46ca2be97be262220bae68`（1,979 行 / 239,459 B）
- 通例：所有路径/行号/计数均为本次实测；核不出者写 `unknown` 并注明查了什么。

---

#### C7 · 批次⑦ 治理同步

##### 1. 结果与 consumer

- 结果（可独立验证）：仓库里**治理文字与代码事实逐条一致**，且**下一次想加东西时宪法先拦住**——具体表现为三件可验的事：①`CONSTITUTION.md`、`constitution-checklist.md`、`AGENTS.md`、`CLAUDE.md`、`docs/architecture/*.json`、`docs/audit-contracts.md`、`package.json` 中不再有与 HEAD 代码相反的陈述；②宪法新增**负向条款**（已裁定不采纳清单）+ **控制面净减法**硬规则 + **阻塞分类学常驻规则**（八类 + 防护 + owner）；③父材料 `decision-log.md` 与已确认地图的**已登记矛盾 / 残留 / 缺陷共 51 条**（X1–X19 / X20–X25 / X26–X29 / X30–X36 / X40–X47 / X50–X56）**逐项裁定**，其中母材料文本侧的 **X1–X14 由本卡直接更正**，批次计数全文只有「10 个具名批次」一个口径。
- consumer：**C8**（双证验收的第一道静态证据）；**未来的所有改动**（下一个 agent 读 `AGENTS.md`/`CONSTITUTION.md` 时拿到的是与代码一致的事实）。
- owner：任务Ⅲ 主会话。

##### 2. 范围

- 在范围内：
  1. `CONSTITUTION.md`：F3、F6 修订；F5 或 F11 增加「控制面净减法」；新增负向条款（已裁定不采纳清单）；新增阻塞分类学常驻规则；同步 Version、修订记录、旧→新映射；条目数不变（22）。
  2. `constitution-checklist.md`：与宪法逐条同步 + **条目数保持 22** + 新增一条「已裁定不采纳」对照项 —— **该对照项不新增第 23 条、也不替换/合并任何既有 F/Q/S 条目**：它落在 checklist 的**非条款区**（与既有「close 三义判据（**非宪法新增条款**，仅作可复核解释清单）」**同一形态**），宪法侧对应**新增的 `## 负向条款（已裁定不采纳）`段**（该段**不是** F/Q/S 编号条款）；**因此 22 这个数字在任何一侧都不变**。⚠️ **不得**把它做成 F5 或 F11 的第 23 条（会同时破 `CONSTITUTION.md:187` 的「条目变更须同步四件」与 `C7-AC-3` 的「条目数 = 22」）。**被否**：替换 F5（会把「关卡按需添加」的判据挤掉）；合并 F11（会让「控制面受限」的判据句过长而失焦）。
  3. ADR：按 D-014 指定的 6 个方向同步（`0017` freshness / `0019` canonical ownership / `0020` close transcription / `0011` review generation / `0009` same-snapshot recovery / `0025` review-dispatch-preflight）。
  4. `AGENTS.md` / `CLAUDE.md`：修正 `:44` / `:58` 与 D-004/D-023 的冲突；修正顶层 `schemas/` 引用；补登记 `quality/confirmations`、`CURRENT_MATERIAL_FILES` 口径。
  5. `docs/architecture/move-map.json`（362 entries）、`docs/architecture/control-plane-inventory.json`（6 controls + 21 skip_dispositions）。
  6. `docs/audit-contracts.md`。
  7. `package.json` 的 `npm test` 与「禁止全量回归」冲突。
  8. `check-extensibility.mjs` 的**宪法/文档表述**同步（实现替代在 C5，不在本卡）。
  9. 阻塞分类学常驻规则（八类 + 防护 + owner）进宪法。
  10. `operations/close/**` 多文件计划收敛为一次性展示（T-7#4 / K8）—— **这是本卡唯一允许的代码侧删除**，具名面 = `core/task-close.mjs` 的**计划对象落盘段**（`operations/close/plans/<hash>/plan.json` `:2051`、`.../steps/<step_id>.json` `:1484`、`operations/close/completed.json` 的多文件写入 `:1446/:2232/:2610`、`operations/close/manual-risk-close.json` `:1179`）与 `tools/cli/task-close.mjs` 对应的 `readRecord` 读取面（`:59/:67/:135/:140/:141/:157/:176`）。**收敛口径**：**保留**确认文件（`operations/close/confirmations/<planHash>/<uuid>.json`，K4 的人确认凭证，`closeConfirmation` 的绑定判据依赖它）与**一次性展示**的计划文本；**删除**计划/步骤/完成记录的多文件持久化，五动作结果改写 **K2 的 `record_kind:"close_action"` 行**（字段表见 C3-FR-2，裁定 J-2）。
  11. **D-025③ 的 `prd.md` 措辞更正**（裁定 A）。
  12. **父材料 `decision-log.md` 的 X1–X14 矛盾更正**。
  13. **清零 HEAD 上已存在的 10 条 `check-task-record-paths.mjs` FAIL**。
  14. **清零 HEAD 上已存在的 2 条 `verify-structure.mjs` FAIL**。
  15. **清零父材料 `decision-log.md` 的 markdownlint 错误（仓库锁定 linter 实测 82 条）**。
  16. **宿主 worktree 增殖登记进 `non_goals` + 写明影响面（裁定 I-6）**：把「宿主（codex / claude）每会话或每 phase 自建 worktree」按 `non_goals` 登记，并写明影响面 = build-code 期间 worktree 数量由宿主决定、**不阻断任何阶段结束**、本仓不造机制。依据（实测）：workflowhub **每个任务只建一棵确定性 worktree**（`runtime/task/workspace.mjs:419` 的注释 + `:435` 的 `execFileSync("git", ["worktree","add",...])`；`git worktree add` 在**生产代码**里全仓只此一处），当前 `git worktree list` = **14 棵**（其中 6 棵在 `~/.codex/worktrees/`）⇒「好几十棵」是**仓外**行为，与 D-026③ 已登记的宿主/broker 缺口同类。
- 明确不在范围内：**除第 10 项点名的 `operations/close/**` 持久化删除之外**，不做任何其他生产代码行为改动（其余生产行为改动属 C1–C6/C9）；任何新增机制、schema、runtime gate 或持久对象；任何历史任务字节的修改（D-016）。**边界一句写死**：本卡的代码侧改动**只减不增**，且必须**同时**满足 —— ① 只删「计划/步骤/完成记录的多文件落盘」这一层；② 不删人确认凭证（`operations/close/confirmations/**`）与 plan hash 绑定校验；③ 五动作结果有 K2 落点（`C3-FR-2` 的 `close_action` 行）。**违反任一条即越界**（撞 K8 与 D-013）。

##### 3. 流程/状态

- 前置：C6 合入；C5 合入（哈希类文档表述须与删哈希后一致）。
- 步骤：① 开工前核 HEAD（G-5 基线漂移）；② 逐条建立「文档表述 ↔ 代码事实」对照表并留痕；③ 改宪法 → 改 checklist → 改 ADR → 改治理文档 → 改 `package.json`；④ 清零 10+2+82 条预存在 FAIL；⑤ 更正父材料 X1–X14；⑥ 跑本卡受影响测试 + 三条具名命令；⑦ 产出对照表交 C8 复核。
- 退出状态：`npm run check` 的**第一步 markdownlint 与后三步**在仓库范围内**不劣化于 HEAD 基线**（markdownlint **554** error / path-guard **10** FAIL / verify-structure **2** FAIL）**且本卡范围内清零**（受 X50 约束，见下）；10 条 path-guard FAIL = 0；2 条 verify-structure FAIL = 0；`decision-log.md` markdownlint = 0；X1–X14 逐项复核表无「仍矛盾」项。
- 状态机：`draft → 对照表产出 → 宪法/checklist/ADR 改完 → 治理文档改完 → 预存在 FAIL 清零 → 父材料更正 → 验证 → 完成`。任一验证红 → 退回对应步骤，**不得**标注完成。

##### 4. FR

| FR | 内容 | 来自 |
| --- | --- | --- |
| `C7-FR-1` | 修订 F3：`hash` → 「任务与工作区身份」；F3 定义句（`CONSTITUTION.md:28`）不再要求 hash | D-014（L1278–L1298，`source_type/reference/exact_excerpt` 引 `CONSTITUTION.md:28`） |
| `C7-FR-2` | 修订 F6：去掉「内容校验值 / 合同内容校验值」要求（原 `CONSTITUTION.md:49`） | D-014 |
| `C7-FR-3` | 把「控制面净减法」写成 F5 或 F11 的一句硬规则 | D-014 |
| `C7-FR-4` | 同步 `constitution-checklist.md`、版本号、修订记录、旧→新映射；条目数保持 22 | D-014 + `CONSTITUTION.md:187`（条目变更须同步四件） |
| `C7-FR-5` | 守卫三要件写入宪法负向条款旁：①登记字段（职责/真实 consumer/owner/测试/删除或保留条件 + 替代关系 + 净增减自陈）；②违反后果 = 用户确认点不通过；③范围与自适性 = 本任务及后续 3 个任务的每次改动，含自指 | D-013 修订（L1254–L1260） |
| `C7-FR-6` | 「已裁定不采纳」清单进 `CONSTITUTION.md` 负向条款 + `constitution-checklist.md` 一条对照项；decision-log 只留来源引用；给清单 owner 与核对点 | D-029⑥（L1656）+ `## 拒绝方案`（L1708–L1728） |
| `C7-FR-7` | 阻塞分类学常驻规则进宪法：新登记阻塞必须先归八类（事实/状态、门禁/流程、依赖外部、新鲜度/身份、编排/上下文、工程/测试、交付/收口、治理/增殖）之一并登记防护与 owner；归不进先扩表 | `## 阻塞分类学与防护`（L847–L862）+ D-014 `补记`（L1260） |
| `C7-FR-8` | `check-extensibility.mjs` 的宪法/文档表述与删哈希后一致（实现替代归 C5） | D-020②（L1436）+ 裁定 C（map §4.2） |
| `C7-FR-9` | `AGENTS.md:44` / `:58` 与 D-004/D-023 的冲突修正；`AGENTS.md`/`CLAUDE.md` 纳入批次⑦ | D-029⑩（L1660） |
| `C7-FR-10` | 治理文档三处矛盾同批修正：不存在的顶层 `schemas/` 引用、`audit-contracts.md` 把死对象称权威、`package.json` 的 `npm test` 与「禁止全量回归」直接冲突 | D-028⑤（L1635） |
| `C7-FR-11` | `move-map.json`（362 entries）与 `control-plane-inventory.json` 的登记义务同步（后者由 `control-plane-governance.test.mjs` 强制） | D-029⑦（L1657）+ D-029⑨（L1659） |
| `C7-FR-12` | `operations/close/**` 多文件计划对象收掉，计划改为一次性展示；close 五动作结果写入 **K2 的 `record_kind:"close_action"` 行**（字段表由 **C3-FR-2 / 裁定 J-2** 定；本卡只消费）。**代码侧删除面（本卡唯一允许的代码改动）** = `core/task-close.mjs` 的 `:1179` / `:1446` / `:1484` / `:2051` / `:2232` / `:2610` 六处落盘点 + `tools/cli/task-close.mjs` 的 `:59/:67/:135/:140/:141/:157/:176` 读取面；**保留** `operations/close/confirmations/**`（人确认凭证与 plan hash 绑定）与 plan hash 校验 | K8（L819）+ T-7#4 + `C3-FR-2`（K2 行型） |
| `C7-FR-13` | 更正 D-025③ 措辞：`prd.md` **不是第五份材料**（不是「永不产出」）；保证它不进 `CURRENT_MATERIAL_FILES`、close 不得要求它 | 裁定 A（map §4.2 L217）+ D-025③（L1546） |
| `C7-FR-14` | 父材料 X1–X14 逐项更正（含批次计数统一为 10、`decision_hash` 两口径写清、聚合文件名以落盘为准、重复章节合并、章节归位、`task-index.mjs` 归属、`check-extensibility.mjs` 落点、4 条无落点决定编批次、K 清单优先、Exit checks 复核） | G-1（map §4 L184）+ map §4.1（L194–L211） |
| `C7-FR-15` | **清零 HEAD 上 10 条 `check-task-record-paths.mjs` FAIL**（C1/C2 只保证「不劣化于 10」，清零归本卡） | 用户/主 PRD 追加（本次实测 10 条，见 §实测记录 F1） |
| `C7-FR-16` | **清零 HEAD 上 2 条 `verify-structure.mjs` FAIL** | 用户/主 PRD 追加（本次实测 2 条，见 §实测记录 F2） |
| `C7-FR-17` | **清零父材料 `decision-log.md` 的 markdownlint 错误**（仓库锁定 linter `markdownlint 0.35.0` 实测 **82** 条；其中 MD024×2 随 X6 去重一并消失） | 用户/主 PRD 追加（实测 82 条，见 §实测记录 F3） |

##### 5. AC（每条带失败判据）

| AC | 通过判据 | 失败判据 |
| --- | --- | --- |
| `C7-AC-1` | F3 定义句不再含 `hash` 作为写边界必要条件；F6 定义句不再含「内容校验值」要求；两处改前/改后原文与行号写进对照表 | 任一处仍要求 hash / 内容校验值；或改了但未同步版本号/修订记录/映射 |
| `C7-AC-2` | 「控制面净减法」以硬规则形式出现在 F5 或 F11 正文；守卫三要件（登记字段/违反后果/自适性）三件齐备且**未新增对象** | 做成计数器/schema/gate/检查器（撞 `CONSTITUTION.md:85` F11「不得另造计数器…」）；或三要件缺一 |
| `C7-AC-3` | 宪法负向条款含「已裁定不采纳」清单（**覆盖母材料 `## 拒绝方案` 表的全部 15 条**，逐条可追溯）与阻塞分类学八类+防护+owner；checklist 条目数 = 宪法条目数 = 22 | 清单缺失或只写在 decision-log；**漏掉 `## 拒绝方案` 表任一行**；checklist 条目数 ≠ 22 |
| `C7-AC-4` | 逐条对照表：`AGENTS.md`/`CLAUDE.md`/`move-map.json`/`control-plane-inventory.json`/`audit-contracts.md`/`package.json` 的每处陈述与代码事实一致，无「仍矛盾」行 | 对照表存在任一未消解矛盾；或对照表缺行（漏检对象） |
| `C7-AC-5` | `npm run check` **第一步**（`markdownlint-cli2 "**/*.md"`，**仓库锁定工具链**）与后四步在仓库范围内**不劣化于 HEAD 基线**（markdownlint **554** error / path-guard **10** FAIL / verify-structure **2** FAIL）**且本卡范围内清零** | 任一步**劣化**（计数上升）；或本卡范围内的 FAIL 未清零（受 X50 约束：若 `specs/workflowhub-ui-frontend-capability-20260904/**` 的 420 条不动，仓库范围不可达 0 → 必须显式处置或如实标 `unknown`） |
| `C7-AC-6` | `node tools/cli/check-task-record-paths.mjs` **不劣化于 HEAD 基线**（**10** FAIL）**且本卡范围内清零**（`C7-FR-15` 明令清零 ⇒ FAIL 计数 = 0、退出码 0） | FAIL 计数 > 0；或把守卫表放宽以「凑绿」（= 假绿，撞 F9） |
| `C7-AC-7` | `node tools/cli/verify-structure.mjs` **不劣化于 HEAD 基线**（**2** FAIL）**且本卡范围内清零**（`C7-FR-16` 明令清零 ⇒ FAIL 计数 = 0、退出码 0） | FAIL 计数 > 0；或改 `CONTEXT.md` 时把真实术语删成不完整 |
| `C7-AC-8` | 用**仓库锁定工具链** `./node_modules/.bin/markdownlint-cli2 "<decision-log 路径>"` 报告 0 issues（实测 **82** = MD032×34 + MD022×30 + MD036×12 + MD052×2 + MD024×2 + MD040×1 + MD001×1；MD024×2 随 X6 去重消失 → **其余 80 条**需逐条修或按治理裁定加 ignores 并写明理由）。**不得用 `npx`**（0.41.1 规则集不同：0.35.0 **没有** `MD060`） | issues > 0；或直接用 `npx` 的口径凑数；或把该文件加进 ignores 而不写明理由与 owner（= 掩盖问题） |
| `C7-AC-9` | X1–X14 逐项复核表 14/14 无「仍矛盾」；批次计数全文只有「10 个具名批次」一个口径（`L1756`/`L660`/`L667` 已改） | 任一项仍矛盾；或全文仍出现「9 个批次」 |
| `C7-AC-10` | `decision_hash` 两个口径写清（「用户确认时的绑定值」= `e357a72d…`（L1788）/ `ca12f0b0…`（L977,L1892,L1929）；「当前文件值」= 实测 `9c5c45a2…`）；聚合文件名以实际落盘 `59f1998e….json` 为准（L1771 的 `8b44558e…` 更正） | 两个口径混用；或更正了行号但没写清「为什么有两个值」 |
| `C7-AC-11` | D-025③ 措辞改为「`prd.md` 不是第五份材料」，且 `CURRENT_MATERIAL_FILES`（`runtime/task/material-workspace.mjs:6`）仍为 4 项、close 不要求 `prd.md` | 措辞仍为「永不产出」（与已合并的 `spec-prd` 契约冲突）；或 `CURRENT_MATERIAL_FILES` 被改成 5 项 |
| `C7-AC-12` | 控制面净增减申报：本卡点名的每个文件 `wc -l` 改前/改后实测 + 净值；净值为负或 `unknown` 并说明 | 只写「预计」不写改后实测；或净值 > 0 且未登记理由 |
| `C7-AC-13`（**范围与所有权必须自洽**） | 本卡的代码侧改动**恰好等于** §2 第 10 项点名的两面（`core/task-close.mjs` 6 处落盘点 + `tools/cli/task-close.mjs` 读取面），且**同时**满足三条边界：① 只删计划/步骤/完成记录的多文件落盘；② `operations/close/confirmations/**` 与 plan hash 绑定校验仍在（`closeConfirmation` 的绑定判据不失效）；③ 五动作结果在 K2 的 `close_action` 行有落点 | 出现第 10 项之外的任何生产行为改动（越界）；或为「不做代码改动」而只改文档、留下指向已不存在的 `plans/**` 的读取代码（半删状态）；或删掉了人确认凭证 / plan hash 校验（撞 K4 与 F7） |

**6. oracle（可执行验证）**
见 §实测记录 F1–F5 的原始命令。汇总：

```bash
cd /Users/Hugh/Hugh/Project/workflowhub
node tools/cli/check-task-record-paths.mjs        # 不劣化于 HEAD 基线（10 FAIL），且本卡范围内清零 → 期望 FAIL=0
node tools/cli/verify-structure.mjs               # 不劣化于 HEAD 基线（2 FAIL），且本卡范围内清零 → 期望 FAIL=0
./node_modules/.bin/markdownlint-cli2 "**/*.md"   # 不劣化于 HEAD 基线（554 error / 35 files），且本卡范围内清零
                                                  # ⚠️ 必须用仓库锁定工具链；不得用 npx（0.41.1 规则集不同）
./node_modules/.bin/markdownlint-cli2 "<worktree>/specs/workflowhub-mechanism-simplification-20260910/decision-log.md"
                                                  # 期望 0 issues（仓库锁定 linter 实测 82）
node -e 'const j=require("./docs/architecture/move-map.json");console.log(j.entries.length)'   # 362
node -e 'const j=require("./docs/architecture/control-plane-inventory.json");console.log(j.controls.length,j.skip_dispositions.length)'  # 6 21
grep -rn 'CURRENT_MATERIAL_FILES' --include=*.mjs runtime/ tools/ core/ | head   # 定义点 runtime/task/material-workspace.mjs:6
```

另需（非命令类）oracle：①「文档表述 ↔ 代码事实」逐条对照表；②X1–X14 逐项复核表；③守卫自指可证伪——本卡自身的新增（新增的宪法段落、checklist 条目）**必须回填进净增减账**（D-013 修订③）。

**`C7-FR` 追加项（`C7-FR-15/16/17`）与 `non_goals` 登记的 oracle**：

```bash
cd /Users/Hugh/Hugh/Project/workflowhub
# 17) 宿主 worktree 增殖登记（裁定 I-6）：non_goals 中确有该条且写明影响面
grep -rn 'worktree' AGENTS.md CLAUDE.md CONSTITUTION.md docs/ | grep -i 'non_goals\|non-goals'   # 期望 ≥1 命中（登记处）
git worktree list | wc -l                                                                       # 实测基线 14（不作为验收固定值）
grep -rn '"worktree", "add"' --include=*.mjs runtime/ tools/ skills/ core/                       # 生产代码只此一处 = runtime/task/workspace.mjs:435
```

- **判据**：`non_goals` 登记处存在「宿主每会话 / 每 phase 自建 worktree」条目，且该条目**同时**写出：①它属**仓外**（宿主行为）；②**不阻断任何阶段结束**；③**本仓不造机制**；④依据 = `runtime/task/workspace.mjs:419,435` 与 `git worktree list` 实测计数。
- **失败判据**：条目存在但只写「不支持 / 排除」而**未写影响面**；或为治它而新增仓内机制（撞 `E-20` + 裁定 I-7）。

##### 7. 准备依赖

- C6 合入（`status`/`close` 只报根因 + 读取来源收敛为具名 ref 集合 + `quality/verify.json` 与 release 投影收掉）。理由：宪法/文档里关于 status/verify 的表述只能在代码定型后同步，否则同步完又漂移。
- 开工前实测 HEAD（G-5：共享工作区有其他 agent 并发改主仓）。
- 无需新工具、新 schema、新命令。

##### 8. 实现依赖

- C5 合入：删哈希失效链后，宪法 F3/F6 与 `skill-deps.yaml` 的 `material_revision` 表述才有唯一正确版本（否则会写两份）。
- C1/C2 合入：`move-map.json` 的 entries 与 `control-plane-inventory.json` 的 controls 处置要反映**删除后**的真实形状。
- 无外部（宿主/broker）依赖。

##### 9. 验收依赖

- 无（本卡即验收工具链的一部分）。C8 是它的 consumer，不是它的前置。

##### 10. 合并依赖

- 任务Ⅲ 第 1 位；C8 依赖 C7 合入（末位）。
- 与 C5 **互锁**：C5 改实现（哈希度量），C7 改表述；C5 未合入前 C7 不得定稿哈希类段落。
- 单一合并列车：`C7 → C8`（任务Ⅲ）。

##### 11. 共享资源冲突与集成责任

| 共享资源 | 冲突方 | 集成责任 |
| --- | --- | --- |
| `docs/architecture/control-plane-inventory.json` | C1/C2/C6（删除/收对象）改代码事实，C7 改登记 | **C7 负责**在 C1–C6 全部合入后重核 `controls`/`skip_dispositions`，并处置 X51（4 条 retain 与决定冲突） |
| `docs/architecture/move-map.json`（362 entries） | C1/C2/C3/C5 删文件后 entries 失配 | C1–C5 各自更新自己删的条目；**C7 负责**最终一致性核对与 `entries` 计数写死 |
| `package.json` | C5（批内含 `check-extensibility` 度量处置）、C9（测试命令切分） | **C7 负责** `test`/`test:exclusive` 语义与「禁止全量回归」的对齐；C9 若要改测试分组，须与 C7 同批或明确先后 |
| `CONSTITUTION.md` / `constitution-checklist.md` | 无其他卡改 | C7 独占 |
| `AGENTS.md` / `CLAUDE.md` | 无其他卡改 | C7 独占 |
| `decision-log.md`（父材料，在 worktree `specs/<task-id>/`，**不在主仓工作树内**） | 无其他卡改 | C7 独占。**注意**：该文件当前不在主仓 `HEAD` 工作树内（主仓 `specs/` 只有 `archive` 与 `workflowhub-ui-frontend-capability-20260904`），故它的 markdownlint 错误在合并/归档前**不会**让主仓 `npm run check` 变红 |
| `docs/audit-contracts.md` | 无其他卡改 | C7 负责处置 X52 |

##### 12. 来源/设计（D 号 + 行号 + revision）

- 母材料 revision：`sha256:9c5c45a2c06ff5cb01809a2712064577e84f69ef1e46ca2be97be262220bae68`（实测，1,979 行）。
- **D-013**（L1252–L1276）；修订段（三要件）**L1254–L1260**；补记（阻塞分类学）**L1260**。
- **D-014**（L1278–L1298）；`source_type/reference/exact_excerpt` 引 `CONSTITUTION.md:28`、`:49`、`:100`；ADR 六向在 L1281。
- **D-015③**（链路功能验收，L1658 命名；批次⑥ L1387、批次⑧ L1389）。
- **D-016**（L1332–L1352，历史只读冻结）。
- **D-025③**（L1546）；D-025 全条 L1542–L1562。
- **D-027③/⑥**（L1599–L1605 区段，D-027 条 L1593–L1620）。
- **D-029⑥/⑦/⑧/⑨/⑩**（L1656/L1657/L1658/L1659/L1660）；D-029 全条 L1647–L1683。
- **D-028⑤**（L1635）；D-028 全条 L1621–L1646。
- **D-030**（L1801–L1826）。
- `## 保留记录清单` K1–K9（L799–L824；K1 L807，K2 L808，K3 L809，K4 L810，K5 L811，K6 L817，K7 L818，K8 L819，K9 L820）。
- `## 阻塞分类学与防护`（L847–L862；常驻规则 L862）。
- `## 拒绝方案`（L1708–L1728）；`## 风险` RK-1~RK-7（L1730–L1740）；`## 未决项` OPN-1~OPN-5（L1742–L1750）；`## Supersedes`（L1752–L1764）；`## 文档结果`（L1766–L1774）；`## Exit checks`（L1776–L1794）；`## 决定（补记：非目标与风险）`（L1796–L1799）。
- 裁定 A（map §4.2 L217）、裁定 C（L219）、裁定 D（L220）、裁定 E（L221）；map §4.1 X1–X14（L194–L211）。
- **裁定 I-6 + R-015⑤**（本 PRD）：宿主 worktree 增殖按 `non_goals` 登记 + 写明影响面；实测 `runtime/task/workspace.mjs:419`（注释「the ONE deterministic worktree」）、`:435`（唯一的 `git worktree add`），`git worktree list` = **14 棵**（6 棵在 `~/.codex/worktrees/`）。**R-015 是 build-prd 阶段由用户追加**的需求，不是 make-decision 阶段的产物。
- 宪法行号（HEAD 实测）：`CONSTITUTION.md` 208 行 / Version **1.8.0**（L3）/ 22 条（L6）；**F3 L26–L31**（定义 L28）；**F5 L40–L45**；**F6 L47–L52**（定义 L49）；**F10 L75–L80**（反例 L80）；**F11 L82–L87**（定义 L84，含 L85「不得另造计数器…」）；治理节 L184–L188（L187 = 条目变更须同步四件）；Version 行 L190；修订记录 L192–L208；旧→新映射 L196。

##### 13. 局部风险

- `RK-C7-1` 治理同步最容易变成「再加一层文档」→ 本卡**只做表述与代码对齐 + 父材料矛盾更正**，不新增机制、不新增 gate。判定：本卡净增行数 > 0 且无法归因于「更正矛盾」，即视为违规（D-013 自指）。
- `RK-C7-2` 宪法条目变更须同步四件（版本号/修订记录/映射/checklist 条目数）——漏一件就是治理缺陷（`CONSTITUTION.md:187` 明文）。
- `RK-C7-3` **X50（新发现）**：`npm run check` 在 HEAD **已经红**——第一步 markdownlint 实测 **554 error / 35 files**（仓库锁定工具链；含错误的文件数），其中 **420 条在 `specs/workflowhub-ui-frontend-capability-20260904/**`（22 文件）**，该目录**不在** `.markdownlint-cli2.jsonc` 的 ignores 里。因此 C7/C2/C5 的「`npm run check` 退出码 0」oracle 在不处置该目录的前提下**不可达**。必须在 C7 内显式处置（修 / 加 ignores 并写明 owner 与理由 / 或如实标 `unknown`），否则该 oracle 是假绿。**统一口径**：所有卡改判「**不劣化于 HEAD 基线（554 / 10 / 2）且本卡范围内清零**」。
- `RK-C7-4` 清零 10 条 path-guard FAIL 时，**放宽守卫表 = 假绿**（撞 F9）。10 条里有 6 条是「unclassified direct filesystem writer」，正解是分类为 trusted infrastructure 或改用 TaskHandle/ArtifactDir，不是加白名单。且 `check-task-record-paths.mjs` 本身有**按文件路径硬编码的授权表**（L35 `FIXTURE_ALLOWLIST`、L76+ 第二张表）——C1 若删/搬文件会先让它红（D-020①）。
- `RK-C7-5` 更正父材料 X4（`decision_hash` 三值）时**不能只留一个值**：`e357a72d…` 是用户确认时的绑定值（当时 material 内容），`ca12f0b0…` 是含 R-013 后的当版绑定值，`9c5c45a2…` 是当前文件值。三者语义不同，必须写清口径而不是「统一成一个」。
- `RK-C7-6` 父材料行号可能继续漂移（本卡实测：D-028⑤ 引 `package.json:24-26`，实际 `:12-14`；D-014 引 `AGENTS.md:31`，实际 `:37`）→ 更正时必须**同时写文件与行号**并注明「以 HEAD 实测为准」。
- `RK-C7-7` `decision-log.md` 在 worktree 内、不在主仓工作树内 → 改它**不会**被主仓 `npm run check` 看到；不要误以为「改了它就修好了 CI」。合并后它会随 `archive specs/...` 提交进入 `specs/archive/`（**在 ignores 内**），故它对本仓 CI 的影响是**瞬态**的（见 X50 的实测：`692c27ea archive specs/...` 是 merge `82ba3d86` 的**后代**）。

**14. 可后置技术项**
`none`（用户明确要求不产出延期任务，D-026 修订 L1566–L1568 / `## 拒绝方案` L1726）。

##### 15. 最小读取集

- **必读**：`CONSTITUTION.md`（全文 208 行）；`constitution-checklist.md`（58 行）；`AGENTS.md`（62 行）；`CLAUDE.md`（30 行）；`package.json`（scripts）；`.markdownlint-cli2.jsonc`；`docs/architecture/move-map.json`（只读元数据 + `entries.length`）；`docs/architecture/control-plane-inventory.json`（38 行全文）；`docs/audit-contracts.md`（55 行全文）；`docs/adr/` 目录清单 + D-014 点的 6 个 ADR；`tools/cli/check-task-record-paths.mjs`（324 行，至少 L35 与 L76+ 两张表）；`tools/cli/verify-structure.mjs`；`runtime/task/material-workspace.mjs:6`（`CURRENT_MATERIAL_FILES`）；`specs/<task-id>/decision-log.md` 的 X1–X14 相关行（L660/L667/L977/L1382/L1386/L1391/L1436/L1628/L1657/L1756/L1771/L1779–L1796/L1788/L1827/L1851/L1901/L1925）。
- **条件读**：`docs/standard-workflow.md`（close 三义）；`contexts/` 或 `contracts/make-decision.md`（若需核 `prd.md` 契约，裁定 A）；`runtime/evidence/check-skill-closure.mjs:154,290`（仅在核 `material_revision` 表述是否与代码一致时）；`skills/wh-review/SKILL.md`（仅在核「异源复核」表述时）。
- **正常不读**：`specs/archive/**`；`node_modules/**`；历史任务 store `~/Knowledge/Projects/workflowhub/tasks/**`（除 C8 的 M3 计数）；`runtime/stage/stage-content-contracts.mjs`（6,806 行，C1/C2/C5 的读取对象）。

##### 16. 五阶段开工说明

- **build-spec**：把 §4 的 17 条 FR 逐条落成 spec 条目（含裁定 A/C/D 的落点），并写出「before/after commitments」——F3、F5、F6、F10、F11 的**改前原文**已在本卡 §12 给出行号，改后措辞由 build-spec 起草并须用户批准（D-014 `unresolved_items`：具体条目措辞由后续任务起草并须用户批准）。产出「文档表述 ↔ 代码事实」对照表的**空表模板**。**「已裁定不采纳」对照项按 §2 第 2 项落非条款区（不新增第 23 条）**。**禁止**在本阶段扩大范围到生产代码。
- **build-plan**：按 §3 的 7 个步骤排 wave；把 15 项具名清单排成 seam，标明「同文件同批」约束（`CONSTITUTION.md` + `constitution-checklist.md` 同批；`AGENTS.md` + `CLAUDE.md` 同批；`move-map.json` + `control-plane-inventory.json` 同批）。给出卡文件数说明（D-026①：>10 个生产文件须写明为什么必须一起改，但**不拦截**）。
- **build-code**：按需只读；**只跑 §17 的受影响针对性测试**；每改一个点即时更新对照表；新增的宪法段落与 checklist 条目**必须回填净增减账**（D-013 修订③自指）。
- **verify-code**：运行 §6 全部 oracle；逐条判 §5 的 **13** 条 AC；`unknown` 如实标（尤其 `npm run check` 若因 X50 未消解而不可达）；**异源复核**按 C8 §6 的机制执行。
- **收口**：close 只记物理事实；`prd.md` 不参与 close 的完成判据（裁定 A）；`operations/close/**` 计划对象已按 K8 收敛为一次性展示。

##### 17. 受影响测试清单与命令
>
> 全部经 `test -e` 验证存在（§实测记录 F6）。**只跑这些；禁止全量回归**（`AGENTS.md` 硬规则 / `docs/standard-workflow.md` L310）。

```bash
cd /Users/Hugh/Hugh/Project/workflowhub
# 1) 守卫与结构（本卡直接 oracle）
node tools/cli/check-task-record-paths.mjs
node tools/cli/verify-structure.mjs
# 2) 登记类契约（move-map / control-plane-inventory / ADR / 宪法引用）
npx --no-install vitest run tests/contract/control-plane-governance.test.mjs tests/contract/repository-governance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# 3) 路径守卫的自身测试（C1 改守卫表时必须同跑）
npx --no-install vitest run tests/task-record-paths-check.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# 4) 扩展性度量表述同步（实现替代在 C5）
npx --no-install vitest run core/__tests__/check-extensibility.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# 5) 公共行为基线（status/close 语义表述）
npx --no-install vitest run tests/contract/public-behavior-baseline.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# 6) 记录重建相关（跨批一致性）
npx --no-install vitest run core/__tests__/task-index.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/execution-outcome.test.mjs tests/contract/review-budget-namespace.test.mjs tests/contract/verify-publication.test.mjs tests/contract/research-report.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# 7) spec-prd 契约（裁定 A 的 prd.md 口径）
npx --no-install vitest run tests/contract/spec-prd-skill-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# 8) markdownlint（父材料 + 仓库范围）
npx --no-install markdownlint-cli2 "<worktree>/specs/workflowhub-mechanism-simplification-20260910/decision-log.md"
npx --no-install markdownlint-cli2 "**/*.md"
```

- **未找到、需新增**：①「宪法条目数 = checklist 条目数」的机器核对测试（现仅 `constitution-checklist.md:40` 的人工声明 + `CONSTITUTION.md:187` 的规则）——**本卡不新增**（新增机器检查器 = 撞 F11，须由材料纪律承接）；②「负向条款含已裁定不采纳清单」的核对测试——同上，不新增；③`docs/audit-contracts.md` 的文档-代码一致性测试——**未找到，且本卡判定不新增**（X52 的处置是更正文档表述，不是造检查器）。
- **明确禁止**：`npm test`（= `test:safe` + `test:exclusive`，实测 `package.json:12-14`）、无范围 `vitest`、`test:safe`、`npm run check` 作为**常规**验证手段（仅在落 §6 oracle 时按其单步执行）。

##### 18. 控制面净增减申报
>
> owner = 任务Ⅲ C7；consumer = C8 双证验收 + 后续 3 个任务的守卫自指核对；替代关系；删除/保留条件。

点名文件实测行数（`wc -l`，HEAD `216a546d`）与预计变化：

| 文件 | HEAD 实测 | 预计变化 | 净值 |
| --- | --- | --- | --- |
| `CONSTITUTION.md` | **208** | F3/F6 改写（净 ±0~+4）；新增「控制面净减法」硬规则（+1~+3）；新增负向条款段（+10~+25）；新增阻塞分类学常驻规则段（+6~+15）；修订记录 +1~+3 | **+18 ~ +50（净增）** |
| `constitution-checklist.md` | **58** | 条目数不变（22）；新增负向条款对照项 ×1（+1~+2）；治理同步记录 +1~+3 | **+2 ~ +5（净增）** |
| `AGENTS.md` | **62** | `:44`/`:58` 改写（±0~+2）；`:37` 顶层 `schemas/` 更正（−0~+1） | **±0 ~ +2** |
| `CLAUDE.md` | **30** | `:23` 顶层 `schemas/` 更正（±0） | **0** |
| `docs/architecture/move-map.json` | **3,192** | 随 C1–C5 删除收缩 entries（−N，N = 被删对象数，C7 不推定） | **负（N 由 C1–C5 决定）** |
| `docs/architecture/control-plane-inventory.json` | **38** | 6 controls / 21 skip_dispositions 重核（见 X51：4 条 retain 与决定冲突，预计收 4 条 → −4 行） | **−4（估）** |
| `docs/audit-contracts.md` | **55** | X52 处置：更正「唯一 verdict 权威」表述（±0~−10，若整段作废） | **0 ~ −10** |
| `docs/adr/<6 files>` | `unknown`（本次未逐文件 `wc -l`） | 每文件加修订段 1~5 行 | **+6 ~ +30（净增）** |
| `package.json` | `unknown`（本次未 `wc -l`） | `test`/`test:exclusive` 语义对齐（±0~+2 行） | **±0 ~ +2** |
| `tools/cli/check-task-record-paths.mjs` | **324** | 10 条 FAIL 清零：分类 trusted infrastructure 或改 TaskHandle/ArtifactDir（±0~+8；**不得**靠放宽授权表） | **±0 ~ +8** |
| `tools/cli/verify-structure.mjs` | `unknown` | 2 条 FAIL 清零（改 `CONTEXT.md` 术语，大概率 0 行） | **0** |
| `CONTEXT.md` | `unknown` | 补五段术语「test-acceptance」、修正含排除术语「runtime」（+1~+3） | **+1 ~ +3** |
| `<worktree>/specs/<task-id>/decision-log.md` | **1,979** | X6 去重（−74：L1827–L1900 与 L1901–L1924 两组共 2 处重复，实测两段各约 74 行）；X1–X14 更正（+5~+20）；markdownlint 修复（纯空行/语言标注，+30~+90 行） | **约 −40 ~ +40（接近 0）** |
| `docs/architecture/*` 其他治理文件 | `unknown` | 未逐文件实测 | `unknown` |
| `core/task-close.mjs` | **2,613** | **`operations/close/**` 多文件计划落盘段删除**（`:1179` / `:1446` / `:1484` / `:2051` / `:2232` / `:2610`）+ `C6-FR-11` 的 X47 承接（删 3 条哈希正则）→ **本卡与 C6 有同文件交接点** | **负（本卡部分：估 −20 ~ −40，待逐段核对，不编数）**；**串行：C6 先合、C7 后合**（否则同一文件两条口径不一致） |
| `tools/cli/task-close.mjs` | `unknown`（本次未 `wc -l`） | 计划/完成记录的读取面收敛（`:59/:67/:135/:140/:141/:157/:176`） | **负（待实测，不编数）** |

- **净增减结论**：本卡的**唯一合法净增**是治理文字（宪法负向条款 + 分类学 + 修订记录）。这与用户「不要延期任务」和「不要再加东西」并不矛盾——D-014 明确要求宪法同步，D-029⑥ 明确要求「不再只写在 decision-log 里」。但按 D-013 自指要求：**以上每一处净增都必须逐条写明「它替代了什么」或「它为什么不是新增控制面」**，否则 C8 判为净增违规。
- **替代关系**：新增的宪法负向条款**替代**「只写在 decision-log 的拒绝方案清单」（D-029⑥ 原文）；新增的分类学常驻规则**替代**「一次性枚举」形态（L862 原文）；markdownlint 修复**替代**零（纯合规）。
- **删除/保留条件**：本卡不新增任何可删对象；新增的宪法段落无删除条件（宪法条款按治理流程变更）。
- **guard 自指**：本卡新增的宪法段落与 checklist 条目**计入本卡自己的净增减账**（D-013 修订③）。

---

#### C8 · 批次⑧ 双证验收

##### 1. 结果与 consumer

- 结果（可独立验证）：**能看到这次整改真的净减了，而不是搬了家**——具体是四件可验的事：①**静态净减法成立**：C1–C6/C9 的具名删除清单**逐项在仓库中不存在**；②**M1–M5 逐项对照 C0 基线「净减或不劣化」**，M4 git 净行数**必须为负**；③**D-015③ 链路功能验收通过**（写完 → status 立即可读 → 重放不产生重复）；④**不可证伪项如实标 `unknown`**，且**异源复核**完成。
- consumer：**用户**（整改是否真的有效的最终判据）；**本 PRD 的验收结论**。
- owner：任务Ⅲ 主会话（**异源复核**由独立来源独立上下文产出，禁止自审自判，`CONSTITUTION.md:107` Q3）。

##### 2. 范围

- 在范围内：
  1. **静态净减法**：把 §4 的具名删除清单转成路径列表，逐项 `test ! -e`（见 §6 oracle）。
  2. **M1–M5 对照 C0 基线**：逐项给出「净减 / 不劣化 / 劣化 / `unknown`」判定。
  3. **M1/M2 复测**（D-029⑧ 明文编入批次⑧ 的验收动作）。
  4. **D-015③ 链路功能验收**。
  5. **适配代码计入净增减账**（D-015 修订：CI 授权表 D-020① + 测试矩阵 D-020④ 新增的代码必须计入）。
  6. **异源复核**。
  7. 本卡**不新跑真实任务**（用户明确否掉）。
- 不在范围内：任何代码改动（本卡只读 + 出验收结论）；任何新仪器（M1–M4 无一项度量 token 时**不新增仪器**，D-015 修订明文）。

##### 3. 流程/状态

- 前置：C0 基线（口径写死 + 基线值）、C1–C7 全部合入。
- 步骤：① 核对 HEAD 与 C0 记录的 HEAD（G-5）；② 静态净减法逐项核实；③ M1–M5 逐项计算（用 C0 写死的分子/分母定义与命令）；④ M1/M2 复测；⑤ D-015③ 链路功能验收；⑥ 适配代码计入净增减；⑦ 异源复核；⑧ 出验收结论（含 `unknown` 清单）。
- 退出状态：双证齐备 + 异源复核完成 + `unknown` 清单显式登记。
- 状态机：`待开工 → 静态证 → 动态证（M1–M5）→ 复测 → 链路验收 → 异源复核 → 完成`。任一证不成立 → 结论为**不通过**并退回对应卡，**不得**标注完成。

##### 4. FR

| FR | 内容 | 来自 |
| --- | --- | --- |
| `C8-FR-1` | 静态净减法：具名删除清单逐项 `test ! -e`；每删一个对象须给出「它没有真实 consumer」的证据（不能只给「没人 import」） | D-015 ①（L1303）+ map §2.3 C1 oracle ③ |
| `C8-FR-2` | M1–M5 逐项对照 C0 基线，判「净减 / 不劣化 / 劣化 / `unknown`」 | D-015（L1299–L1331）；M5 在 L1310；口径漂移见 G-6/裁定 E |
| `C8-FR-3` | **M4 git 净行数必须为负** | map §2.3 C8 oracle ①；D-015 M4（L1309） |
| `C8-FR-4` | **M1/M2 复测**（不写成延期登记表） | D-029⑧（L1658） |
| `C8-FR-5` | **D-015③ 链路功能验收**：写完 → `status` 立即可读 → 重放不产生重复 | D-015③（L1658 命名；Talk Q23 L759） |
| `C8-FR-6` | 不可证伪项如实标 `unknown`（至少：token 维度、M1/M2 的历史数据出处、D-013 自指在零产物下恒为 0） | D-015 修订（L1311）+ D-029⑧（L1658）+ `RK-3`（L1734） |
| `C8-FR-7` | **适配代码计入净增减账**：CI 授权表（D-020①）与测试矩阵（D-020④）新增代码 | D-015 修订（L1312） |
| `C8-FR-8` | **异源复核**：由独立来源在独立上下文产出质量裁决，禁止自审自判 | `CONSTITUTION.md:105–110`（Q3）+ Q3 判据（checklist L25）；机制见 §6 |
| `C8-FR-9` | 历史任务规模/阶段不同，比值不可直接平均，**只能逐项对照** | D-015 `consequences_and_risks`（L1327）+ `RK-3`（L1734） |
| `C8-FR-10` | 本卡**不新跑真实任务** | 用户 Q15 收紧原文（L1313）；map §3 排除表 |

##### 5. AC（每条带失败判据）

| AC | 通过判据 | 失败判据 |
| --- | --- | --- |
| `C8-AC-1` | **两个条件同时成立**：① **C1 的最终具名删除清单已产出**（清单本身是 C1 的交付物；**产出者与时点 = C1 在批次① 的 build-spec 阶段产出、随 C1 合入冻结**，见**裁定 J-4 第 3 条**）；② 该清单逐项 `test ! -e` 全部通过、每项附「无真实 consumer」证据。**C8 验收的是「清单存在且逐项通过」，不是凭空自带一份清单。** **清单的上限已由裁定 H 写死**（`stage-outcome-proofs` / `workflow-evolution.mjs` / protocol-error 白名单**不在**删除面），**`stage-outcome-proofs` 在清单中固定写作「不删（归 K5，裁定 J-4）」** —— C8 可据此交叉核对清单是否越界。 | 清单未产出（C8 不得自行编造）；任一对象仍存在；或证据只是「没人 import」（CLI 入口因此被误判，见 §6 方法论警告）；**或清单把裁定 H 的三项 / 裁定 J-4 的 proofs 列进删除面** |
| `C8-AC-2` | M1–M5 逐项有判定；劣化项有具名归因 | 任一项无判定；或劣化项被写成「不劣化」（假绿，撞 F9） |
| `C8-AC-3` | M4 = Σadded − Σremoved（首父 merge diff）**为负** | ≥ 0；或没写明测量口径（`git diff --numstat`）导致不可复核 |
| `C8-AC-4` | M1/M2 有复测值或如实 `unknown` + 说明缺什么 | 声称复测但无命令/无出处；或把父材料的 20.0% 直接当实测引用（**本次已证其不可复现**，见 §6） |
| `C8-AC-5` | D-015③ 链路验收三步全过 | 任一步失败；或只跑了测试没做真实链路 |
| `C8-AC-6` | `unknown` 清单显式登记（至少含 token 维度、M1/M2 历史出处、D-013 自指） | 任一项被写成通过；或 `unknown` 清单为空 |
| `C8-AC-7` | 净增减账包含 CI 授权表与测试矩阵的新增代码 | 只算生产代码，把适配代码排除在外 |
| `C8-AC-8` | 异源复核由**非本任务主会话**的独立来源、独立上下文产出，且复核者身份与底层模型与执行者不同源 | 自审自判；或复核者与执行者同底层模型（`third-review-host-config.mjs:642–647` 现为精确字符串相等，会漏判——见 §6） |
| `C8-AC-9` | 验收结论逐项可被第三方用**同一条命令**复算出同一个数 | 结论无法复算；或依赖未写死的口径 |

##### 6. oracle（可执行验证）

##### (a) 静态净减法——可执行检查方式

```bash
cd /Users/Hugh/Hugh/Project/workflowhub
# 把具名删除清单转成路径列表，逐项断言不存在
# 具名删除清单按【四类对象】分别断言——不得再用一张混合清单
# ── 类 1：仓库文件（真正会被删掉的文件路径）─────────────────────────
#    ⚠️ 该表【必须由 C1 卡 §范围 的最终具名清单填满】才可执行。
#    当前冻结稿里 C1 卡尚未产出该清单（X22：父材料五项计数无法复现），
#    因此 C8-AC-1 对「仓库文件」这一类当前【无 oracle】——如实登记，不得假绿。
#    已知必须留在表外的四项（避免误删活对象）：
#      runtime/evidence/workflow-evolution.mjs    → C1 明写不删（6 个生产 importer）
#      runtime/stage/protocol-error-whitelist.mjs → 活调用 stage-runner.mjs:943,2500
#      runtime/task/task-index.mjs                → 裁定 B 归 C3，不归 C1
#      quality/evidence/stage-outcome-proofs      → 非仓库路径；**裁定 J-4：保留为 K5（固定写作「不删」）**；是 29 个历史任务的 20,149 个文件（活目录，会漂移，G-5；不得当固定验收数）
# ── 类 2：任务实例内的对象类型（不是仓库路径，绝不 test ! -e）────────
#    oracle = 对一个符合 C0 口径的新任务 store 断言 test ! -e <store>/<obj>
# ── 类 3：代码内的符号（不是文件）───────────────────────────────────
#    oracle = grep -c = 0，且须三源合并（import 图 + package.json/CI 引用 + spawn 字符串）
# ── 类 4：整类目录（仓内路径与 store 内路径都可能是）─────────────────
#    oracle = test ! -d <仓内路径> + find <store> -name '<name>' | wc -l = 0
#    ⚠️ 排除（裁定 J-4）：stage-outcome-proofs 不是删除目标（保留为 K5），不得进入本类清单
echo "类 1/2/3/4 分别执行，禁止合并成一张 test ! -e 清单"
while read -r p; do [ -z "$p" ] && continue; case "$p" in \#*) continue;; esac
  if test ! -e "$p"; then echo "OK   absent: $p"; else echo "FAIL present: $p"; fi
done < /tmp/wh-c8-deleted.txt
```

> ⚠️ **方法论警告（本次实测）**：上表的原始清单里混了四类不同对象——**仓库文件**、**任务实例内的对象类型**（`quality/verify.json`、`index.json`、`operations/close/**`）、**代码内的符号**（`quality-store.mjs:238` 那个函数、34 个死导出、16 个零调用者工具）、**整类目录**（`stage-outcome-proofs/**`）。C8 必须先按这四类拆分，再对每类用不同 oracle：
>
> - 仓库文件 → `test ! -e`
> - 任务实例对象 → 对新跑（C0 口径内的）任务 store 断言 `test ! -e <store>/<obj>`
> - 代码符号 → `grep -c` 计数 = 0（如 `grep -rn 'protocol-error-whitelist' --include=*.mjs .`）
> - 整类目录 → `test ! -d` + `find . -name 'stage-outcome-proofs' | wc -l` = 0
>
> **⚠️ 第二个方法论警告（本次实测，会直接导致误删）**：「零 importer」≠「零 caller」。本卡实测：`tools/` 下**33** 个生产 `.mjs` 在模块图上零 importer，但其中绝大多数是 **npm script / shell 入口**（`tools/cli/task-close.mjs`、`tools/cli/verify-structure.mjs`、`tools/cli/run-checks.mjs`、`tools/cli/check-*`…）。只用 import 图判定会**删掉活的 CLI**。C8 的「无真实 consumer」证据必须**三源合并**：①模块 import 图；②`package.json` scripts 与 `*.sh`/CI 引用；③`child_process` / `spawn` 字符串引用。

**(b) M1–M5 的数据可得性与实测判定**（本卡逐个实测，见 §实测记录 F7–F11）

| 指标 | 判定 | 依据与缺什么 |
| --- | --- | --- |
| **M1** 机制记录墙钟占比 | **不能算 → 不可复现，属未记录证据** | 父材料的三个数（12,182.1 s / 6,054.384 s / 91,234 s）在整个 `~/Knowledge/Projects/workflowhub/tasks/` 树中**只命中 1 个文件**：`workflowhub-mechanism-simplification-20260910/quality/evidence/stage-outcomes/make-decision/09e16e901017af283fe75920f2aa66e92fe6f86d9da93300e6984a72ed6eb31a.json`——即**本任务自己的 stage outcome 转写了决定文本**，属自引用。三个源任务 store（acceleration / simplification / close-readiness）**零命中**。另：`facts.jsonl` 在 acceleration 与 simplification 两个 store 里均为 **0 字节**；`quality/tests/*.json` 实测为 `workflowhub-receipt.v1`（有 `command`/`command_hash`/`exit_code`/`snapshot_head`/`snapshot_tree`，**无 duration 字段**）。→ **缺**：逐次测试的墙钟、broker review 的累计墙钟、会话跨度三项的原始记录。 |
| **M2** 每任务机制阻塞次数 | **不能算 → 不可复现** | 「make-decision 实测 3 条」只出现在同一个自引用的 stage outcome JSON 里；49 个有 `facts.jsonl` 的任务目录中**没有一个**有机制阻塞计数字段；全树含「机制阻塞」字样的文件数 = **1**（同一个文件）。→ **缺**：机制阻塞的记录载体（K2 行建立后才可能有）。 |
| **M3** 每任务记录文件数 / 无 reader 比例 | **能算**（分子分母明确，可直接复算） | acceleration = **1,771** 文件；`quality/evidence/` = **1,052**；其中 `stage-outcome-proofs` = **423** —— **三项与 D-015 声称的 1,771 / 1,052 / 423 逐一吻合**。execution-simplification = **962**（与 D-015 `facts_and_constraints` 的 962 吻合）。close-readiness-governance = **1,406**。「无 reader 比例」需 reader 图，C0 须写死用哪种（见 (d)）。 |
| **M4** git 净行增减 | **能算且已复现** | 口径 = `git diff --numstat <merge>^1 <merge>` 的 Σadded − Σremoved。实测：close-readiness-governance merge **82ba3d86** = 11,337 − 163 = **11,174** ✓；execution-simplification merge **5c246bda** = 9,063 − 1,024 = **8,039** ✓。**两个基线值均精确复现**。 |
| **M5** 控制面体量面 | **部分能算** | 配方（regex）**未在父材料中写死**，本次用最自然的三种口径各测一遍：`stage-content-contracts.mjs` = **6,806 行** ✓（与 HEAD 实测值吻合）；`runtime/` 内 `throw new` = **1,476** ✓（与 N-001-z 的 HEAD 值吻合）；但 `validate/assert/check` = **229**（仅 function 声明）/ **268**（含箭头函数常量）vs 父材料 288/301；大写错误码 = **107** vs 父材料 97/117；schema json 文件数（`runtime/schemas/*.json`）= **35** vs 父材料 47/45（`schemas/` 与 `core/schemas/` 实测 **不存在**）。→ **部分能算，缺口径**：C0 必须把 M5 五项的正则/查找路径写死，否则「逐项净减」不可判（裁定 E）。 |

**(c) M1–M5 覆盖 R-003 的口径边界**：R-003 的原始表述是 **token 与时间**；M1–M4 **无一项度量 token**。D-015 修订明文：「token 维度在历史数据上不可得，如实标 `unknown`」，「>50%」永久标注为**推算**。C8 必须原样保持这两个标注，**不得**把它升级为实测。

**(d) 「无 reader」判定口径（C0 写死，C8 沿用）**：本卡实测的 import 图脚本（见 §实测记录 F8）在 `runtime/evidence/`（32 个生产 `.mjs`）上得到 **6** 个零 importer（`audit-summary-carrier.mjs`、`boundary-confirm.mjs`、`capability-doctor.mjs`、`receipt-schema.mjs`、`requirement-ledger.mjs`、`text-utils.mjs`），而父材料写 **8** —— 差异来自「是否把 `__tests__` 的 import 计入」「是否把入口点算作有 consumer」，**父材料未写死这一条**。C0 必须在口径里写死「零 importer」的三种边界（生产图 / 含测试 / 含入口点），C8 按写死的口径复算并如实标注与父材料数字的差异。

**(e) D-015③ 链路功能验收**（三步，可执行）

```bash
cd /Users/Hugh/Hugh/Project/workflowhub
# 1) 写一行 K2（经写口核对）→ 2) status 立即可读 → 3) 同身份同内容重放不新增行
# 具体命令由 C3/C6 的 task facts 接口定型后写死；C8 记录实际命令 + 退出码 + 行数前后对比。
```

> 本卡实测**未能**给出该三步的精确命令——`facts.jsonl` 在 acceleration/simplification 两个真实 store 中均为 0 字节，说明「写完即可读」这条链路**从未在真实任务上成功跑通过**（这本身是链路验收要证明的东西，如实登记）。

##### (f) 异源复核的既有做法（可复用的现成机制）

- **技能**：`skills/wh-review/`（`SKILL.md` v4.1.0，描述原文 "Send current-stage materials to configured heterologous reviewers and return their real findings"）。脚本目录 `skills/wh-review/scripts/`（含 `wh-review-cli.mjs`、`simple-review-runner.mjs`、`review-provider-client.mjs`、`review-result.mjs`、`review-runner.mjs`、`third-review-host-config.mjs` 等）。
- **异源判定的现有实现**：`skills/wh-review/scripts/third-review-host-config.mjs:642–647` 的 `sameSourceProfile(_config, provider, hostProvider)`，当前为**精确字符串相等** `return provider === hostProvider;`（与 D-029⑮ L1668 的实测一致）。
- **异源门槛的现有实现**：`minimum_heterologous` 出现在 `runtime/review/review-record-route.mjs:458–459, 1010, 1012, 1069`、`runtime/review/canonical-review-result.mjs:225, 231`、`runtime/stage/stage-handlers.mjs:1831–1832`。
- **C8 用法**：直接复用 `wh-review` 产出裁决，**不自造**复核通道；但必须在验收结论里写明复核者身份与**底层模型**，因为 `sameSourceProfile` 的精确字符串相等会漏判「裸 adapter `codex` vs `codex/luna`」这类同模型不同名情形（D-029⑮ + X-C）。C4 修好审查通道与异源判定后，C8 才能拿到可信的异源裁决；在此之前，本卡的异源复核**可能只能以 `unknown`/`unavailable` 登记**（撞 `RK-5` / OPN-1/OPN-2）。

##### 7. 准备依赖

- **C0 基线**（口径写死 + 基线值 + `unknown` 登记）。**本卡实测的结论**：C0 至少必须补齐四件事，否则 M1/M2/M5 不可判——① M5 五项的精确正则与查找路径；② 「零 importer」的三种边界；③ M1/M2 在历史数据上**确认不可复现**并登记 `unknown`（见 §6(b)）；④ M4 口径写死为「首父 merge diff 的 Σadded − Σremoved」（已复现，可直接采用）。
- C0 必须记录基线 HEAD（G-5）。

##### 8. 实现依赖

- **C1–C7 全部合入**（静态净减法的对象只在删除后不存在；M1–M5 的「整改后值」只在全部改动定型后才有意义）。
- 具体耦合：`C3 → C5`（记录重建必须先于删失效链，T-7#2）；`C5 ↔ C7` 互锁（哈希度量 vs 哈希表述）。

##### 9. 验收依赖

- **C0 口径 + 异源复核**。异源复核依赖 C4（审查通道修复 + 异源按底层模型判定），故 C4 的完成度是 C8 异源复核能否成立的实际前置。

##### 10. 合并依赖

- 任务Ⅲ 末位；依赖 C7 合入。
- 单一合并列车：`C7 → C8`。

##### 11. 共享资源冲突与集成责任

| 共享资源 | 冲突 | 集成责任 |
| --- | --- | --- |
| C0 基线口径 | C8 是 C0 的 consumer；C1–C7 各批引同一口径 | **C8 负责**在开工前把 C0 口径与「本卡实测的缺口」（§7）逐条比对；口径缺项 → 退回 C0 补，**不得**自行发明口径 |
| 历史任务 store `~/Knowledge/Projects/workflowhub/tasks/` | G-5 并发写入；M3 依赖它 | **C8 负责**记录采样时刻与目录快照计数；对可变目录如实标注采样时间 |
| 主仓 HEAD | G-5 基线漂移 | **C8 负责**记录验收时的 HEAD，并声明基线 HEAD；两者不同须写明差异影响 |
| `skills/wh-review/**` | C4 会改（packet 组装、`stalled` 映射、异源判定层） | **C8 负责**在 C4 合入后再做异源复核；C8 **不得**改 wh-review |
| 净增减账 | C1–C7 各自的申报 | **C8 负责**汇总核对，含适配代码（CI 授权表 + 测试矩阵） |

##### 12. 来源/设计（D 号 + 行号 + revision）

- **D-015**（L1299–L1331）；M1–M4 修订段 **L1305–L1309**；M5 修订段 **L1310**；token 维度 **L1311**；适配代码计入 **L1312**；`source_type/reference/exact_excerpt` **L1313**；`facts_and_constraints` **L1315**；`consequences_and_risks` **L1327**（比值不可直接平均）；`rejected_alternatives` **L1329**（不新跑任务）。
- **D-015③**（链路功能验收）：L1658 命名；批次⑥ L1387；批次⑧ L1389；Talk Q23 原文 L759。
- **D-029⑧**（L1658，不可证伪声明 + M1/M2 复测编入批次⑧）。
- **D-013**（L1252–L1276）；自指 **L1259**；`facts_and_constraints` **L1272**（前两次「简化」净增 +11,174 / +8,039）。
- **D-016**（L1332–L1352；历史只读冻结）。
- **D-020①/②/④**（CI 授权表 / `check-extensibility` content hash / 测试矩阵）——适配代码计入净增减。
- `RK-3`（L1734：历史基线口径可能不全，验收部分不可证伪；不可证伪项如实标记；M1/M2 复测编入批次⑧）。
- `OPN-1`（L1746）/`OPN-2`（L1747）：方向审查无可用表面、22+13 条回收 finding 属未记录证据 → 影响异源复核的可信度。
- `CONSTITUTION.md`（HEAD 实测 208 行）：**Q3 L105–L110**（异源审查加人工把关，L107 = 质量裁决必须由独立来源在独立上下文产出，禁止自审自判）；**F9 L68–L73**（可证伪、不假绿）；**F4 L33–L38**（finding 不锁死修复）；`constitution-checklist.md:25`（Q3 判据）。
- map §2.3 C8 段（L139–L145）；map §4.2 裁定 E（L221）。

##### 13. 局部风险

- `RK-C8-1` **历史任务规模/阶段不同，比值不可直接平均，只能逐项对照**（D-015 L1327 + RK-3）。判定：任何把 20.0% 与整改后比例「相减」的做法即违规。
- `RK-C8-2` **M1 的三项数字不可复现**（本卡实测，见 §6(b)）——若把它当已记录证据引用，就是**未记录证据当实测**，直接撞 `AGENTS.md`「provenance 必须保留，不能把失败改写为通过」与 F9。
- `RK-C8-3` **M5 配方未写死**——不写死正则，「逐项净减」不可判；且父材料内部已有 288/301、97/117、47/45/35 三组不一致（G-6 + 本次实测）。
- `RK-C8-4` **「无 reader」口径未写死**——本卡实测 `runtime/evidence/` 零 importer = 6，父材料写 8。不写死边界就会得到不同数。
- `RK-C8-5` **「零 importer」≠「零 caller」**——`tools/` 下 33 个零 importer 中绝大多数是 npm script 入口。只用 import 图取证 = **误删活 CLI**。
- `RK-C8-6` **D-013 自指在零产物下恒为 0，不可证伪**（D-029⑧ 原文）——即「守卫自身计入净增减」这条**不能**证明整改真的净减；能证伪的是「没净删 / 在搬家」，**不能**证伪 R-003/R-006 的未来阻塞减少。如实标 `unknown`。
- `RK-C8-7` **异源复核可能拿不到可信裁决**——`sameSourceProfile` 现为精确字符串相等（`third-review-host-config.mjs:642–647`），会漏判同底层模型不同 adapter 名；且 OPN-2 的 22+13 条 finding 属未记录证据、OPN-1 的方向审查无可用表面。C8 必须写明复核者的**底层模型**，并在拿不到时如实标 `unavailable`。
- `RK-C8-8` **G-5 基线漂移**：共享工作区有其他 agent 并发改主仓 → C8 的「整改后值」与 C0 的「基线值」必须各自绑定 HEAD，否则 M1–M5 的对照无意义。
- `RK-C8-9` **`facts.jsonl` 在两个真实 store 中均为 0 字节** → D-015③ 的「写完 → status 立即可读」链路**从未在真实任务上跑通**；若 C3 之后该链路仍不通，C8 必须判 D-015③ **不通过**，不得因「测试绿」而放过。

**14. 可后置技术项**
`none`（用户明确要求不产出延期任务）。

##### 15. 最小读取集

- **必读**：C0 的口径定义与基线值（写死版）；C1–C7 各卡的「具名删除清单」与「控制面净增减申报」；`~/Knowledge/Projects/workflowhub/tasks/workflowhub-execution-acceleration-20260909/`（`facts.jsonl` 0 B 实测；`index.json` 746 B / `facts` 数组 len 0 / `archives` 数组 len 0；`quality/evidence/` 1,052；`stage-outcome-proofs` 423；总 1,771 文件）；`.../workflowhub-execution-simplification-20260907/`（962 文件）；`.../workflowhub-close-readiness-governance-20260906/`（1,406 文件）；`skills/wh-review/SKILL.md` + `skills/wh-review/scripts/third-review-host-config.mjs:642–647`；`package.json`（scripts）；`CONSTITUTION.md:105–110`（Q3）。
- **条件读**：`runtime/review/review-record-route.mjs`（仅当需核 `minimum_heterologous` 的实际行为）；`core/task-close.mjs`（仅当核 close 是否仍依赖已删投影）；`docs/adr/0009-*`、`0025-review-dispatch-preflight-boundaries.md`（仅当需核异源/派发契约）。
- **正常不读**：`specs/archive/**`；`node_modules/**`；`runtime/stage/stage-content-contracts.mjs`（6,806 行）——C8 只读它的 `wc -l`，不读正文。

##### 16. 五阶段开工说明

- **build-spec**：把 §4 的 10 条 FR 落成 spec 条目；把 §6(a) 的**四类对象拆分**与 §6(d) 的**口径写死要求**写成 spec 的必填小节；把「不可证伪项清单」写成 spec 的显式登记表。**禁止**在本阶段发明 C0 未写死的口径。
- **build-plan**：按 §3 的 8 步排 wave；把 §6(a) 的路径列表转成**可执行脚本**（`test ! -e` / `grep -c` / `find | wc -l` 三类）作为 plan 的产物；把「适配代码计入净增减」写成 plan 的收口检查项；给出卡文件数说明（D-026①，>10 个生产文件须写明理由但**不拦截**）。
- **build-code**：本卡**几乎无 code**（只读 + 验收脚本 + 结论文档）；若为验收新增脚本，须计入净增减账并声明删除条件；**只跑 §17 的针对性命令**。
- **verify-code**：运行 §6 全部 oracle；逐条判 §5 的 9 条 AC；`unknown` 如实标；**异源复核**按 §6(f) 复用 `wh-review`，并写明复核者身份与底层模型；不得自审自判。
- **收口**：close 只记物理事实；验收结论（含 `unknown` 清单）随任务归档；不可逆操作独立授权。

##### 17. 受影响测试清单与命令
>
> 全部经 `test -e` 验证存在（§实测记录 F6）。**只跑这些；禁止全量回归**。C8 的主体 oracle 是 §6 的**命令类检查**，不是测试套件。

```bash
cd /Users/Hugh/Hugh/Project/workflowhub
# A) 静态净减法（命令类，非 vitest）——三类断言
#   1) 仓库文件：test ! -e <path>
#   2) 代码符号：grep -rn '<symbol>' --include=*.mjs . | wc -l   → 期望 0
#   3) 整类目录：find . -name '<dir>' -not -path './node_modules/*' | wc -l → 期望 0
# B) 登记类（删除后 move-map / control-plane-inventory 仍自洽）
npx --no-install vitest run tests/contract/control-plane-governance.test.mjs tests/contract/repository-governance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# C) 路径守卫（C1 改表的回归）
npx --no-install vitest run tests/task-record-paths-check.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
npx --no-install vitest run core/__tests__/task-index.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# D) 记录重建 / 写口 / 链路（D-015③ 的测试侧证据）
npx --no-install vitest run tests/contract/stage-handoff.test.mjs tests/contract/verify-publication.test.mjs tests/contract/execution-outcome.test.mjs tests/contract/review-budget-namespace.test.mjs tests/contract/research-report.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# E) 公共行为基线（status/close 语义不变）
npx --no-install vitest run tests/contract/public-behavior-baseline.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# F) 架构分层（C1/C2 删模块后）
npx --no-install vitest run tests/contract/core-runtime-layering.test.mjs tests/requirement-lineage.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
# G) 结构/守卫命令（C7 已清零，C8 复核不劣化）
node tools/cli/check-task-record-paths.mjs      # 期望 FAIL=0
node tools/cli/verify-structure.mjs             # 期望 FAIL=0
# H) M4（git 净行数，必须为负）
git diff --numstat <task3-merge>^1 <task3-merge> | awk '{a+=$1;r+=$2} END{print "net="a-r}'
```

- **未找到、需新增**：①**M1/M2 的测量路径**——历史数据不可得，需新任务才能复测；D-029⑧ 明文「M1/M2 需新任务复测」，但用户同时明确「不新跑真实任务」⇒ 本卡如实标 `unknown`，**不新增仪器**（D-015 修订明文「不新增仪器」）；②**「无 reader 比例」的可执行 oracle**——`unknown`，需 C0 先写死三种边界才可能有；③**`docs/audit-contracts.md` 文档-代码一致性测试**——未找到，本卡判定不新增（X52 处置是改文档，不是造检查器）；④**「宪法条目数 = checklist 条目数」的机器核对**——未找到，本卡判定**不新增**（撞 F11，由材料纪律承接）。
- **明确禁止**：`npm test`（= `test:safe` + `test:exclusive`，实测 `package.json:12–14`；`test:safe` 排除 `check-extensibility` 与 `check-anti-host` 后**跑全量**）、无范围 `vitest`、`test:safe`。

##### 18. 控制面净增减申报

- **本卡自身**：本卡是**验收卡**，正向净增应为 **0**。
  - 预计新增：`/tmp` 下的验收脚本（**不入仓**）；若必须入仓，须声明唯一 consumer（C8 验收）、owner（任务Ⅲ）、替代关系（替代人工逐项核对）、删除条件（验收结论归档后）
  - 预计修改：**仓库内 0 个生产文件**（C8 只读）
- **本卡汇总他卡的净增减**（C8 的核心职责之一）：

> ⚠️ **本表一律用各卡实测值，不得沿用母材料旧值**（裁定 H 第 6 条）。逐项对应关系：C1「14 个零引用 schema」→ **12** 个零**代码**引用（全口径零引用为 0，共 **35** 个 schema）；C2「`STAGE_REFLECTION_REF` ×4」→ **×5（3 种不同正则）**、「stage-outcome 形状校验 ×5」→ **×6**、「`/^[a-f0-9]{64}$/` 48 处」→ **107 处 / 55 文件**；C3「`index.json` 5 写点 / 6 读点」→ **6 写点 / 6 读点**；C6「`quality_gaps`(8 处)」→ **(10 处)**、「`validateRiskCloseQualityReasons`(:1772)」→ **(:1763；`:1772` 是抛错行)**。

| 来源 | 计入项 | 说明 |
| --- | --- | --- |
| C1 | `quality-store.mjs:238` 函数、**12** 个零**代码**引用 schema（全口径零引用为 **0**，共 **35** 个 schema）、`runtime/evidence/` 死模块、死导出、零调用者工具、`workflows/verify-code/*.mjs` 未 import 文件 | 删除侧；须逐项与 K1–K9 比对，**K 清单优先**（X13）。**不在本卡删除面（裁定 H，实测有真实 consumer）**：`quality/evidence/stage-outcome-proofs/**`（3 处活生产引用）、`runtime/evidence/workflow-evolution.mjs`（**1,448 行**，6 个生产 importer）、`runtime/stage/protocol-error-whitelist.mjs`（**216 行**，`stage-runner.mjs:25,943,2500` 活调用） |
| C2 | `task-store.mjs:147-196`、`STAGE_REFLECTION_REF` **×5（3 种不同正则）**、`CLOSE_PLAN_REF` ×2、stage-outcome 形状校验 **×6**、`/^[a-f0-9]{64}$/` **107 处（55 文件）** | 收敛侧；改动点数量按上列实测值 |
| C3 | `index.json` **6 写点 / 6 读点**、`task-index.mjs`（实测 **30 行**）、`stage-outcomes/<stage>/*.json` 先迁移后删 | 删除 + 迁移侧 |
| C5 | `check-skill-closure.mjs:154,290`、**6 个 `workflows/*/skill-deps.yaml` 的 47 处 `material_revision`**（实测 47 ✓）、8 文件闭包、`git-worktree-snapshot.mjs` 写路径移出 | 删除侧；**替换为**唯一写口身份核对（task_id + 工作区路径 + 待写字节，RK-1） |
| C6 | `quality/verify.json` + product-release 投影连对象、`deriveCurrentProductRelease`(:1959)、`delivery.quality_gaps`(**10 处**)、`validateRiskCloseQualityReasons`(**`:1763`**；`:1772` 是抛错行) | 删除侧 |
| C9 | 执行面四条（慢测试切分 / 同命令去重 / 超时保留 / preflight） | **净增侧**（纯工程改造）；须逐条给出「不新增对象」的证据 |
| C7 | 治理文字净增（见 C7 §18，约 **+18~+50** 行宪法 + **+2~+5** 行 checklist + ADR **+6~+30** 行 + markdownlint 修复） | **唯一的合法净增**；须逐条写明「替代了什么 / 为什么不是新增控制面」 |
| **适配代码** | CI 授权表（D-020①）、测试矩阵（D-020④）新增的代码 | **D-015 修订明文必须计入**（不得排除） |
| **他卡未申报项** | `unknown` | 本卡职责：向 C1–C7 追齐；追不齐如实标 `unknown`，不得推定 |

- **净增减结论判定**：M4 的 git 净行数（Σadded − Σremoved）**必须为负**；若为正，则「整改 = 搬家」成立，C8 判**不通过**（map §2.3 C8 oracle ①）。
- **替代关系**：本卡不新增对象；验收脚本（若入仓）替代人工逐项核对。
- **删除/保留条件**：验收脚本在验收结论归档后可删；C0 口径定义随任务归档永久保留（K3/K2）。
- **guard 自指**：本卡自己的验收脚本计入净增减账（D-013 修订③）。

---

### 需要裁定的新增矛盾 · 任务Ⅲ（C7 / C8）

| # | 矛盾 | 实测证据 | 建议裁定 |
| --- | --- | --- | --- |
| **X50** | **`npm run check` 在 HEAD 已经红**：第一步 `markdownlint-cli2 "**/*.md"` 实测 **554 error / 35 files**（REAL_EXIT=1；**仓库锁定工具链**，35 = 含错误的文件数），其中 **420 条集中在 `specs/workflowhub-ui-frontend-capability-20260904/**`（22 个文件）**，该目录**不在** `.markdownlint-cli2.jsonc` 的 ignores 里。父材料与地图**从未提及**这一预存在红。⇒ map §2.3 C7 oracle ⑤、C2 oracle ④、C5 oracle ④ 的「`npm run check` 退出码 0」**在不动该目录的前提下不可达**。 | `./node_modules/.bin/markdownlint-cli2 "**/*.md"` → `Summary: 554 error(s)`；含错误的文件数 = **35**；`./node_modules/.bin/markdownlint-cli2 "specs/**/*.md"` → 420 条 / 22 文件（文件清单见 §实测记录 F4） | **C7 一并处置**（三选一，须显式登记）：① 修掉 `specs/workflowhub-ui-frontend-capability-20260904/**` 的 420 条；② 把它加进 `.markdownlint-cli2.jsonc` 的 ignores 并写明理由与 owner；③ 保留并**下调** C7/C2/C5 的 oracle 为「**不劣化于 554**」，同时把「退出码 0」如实标 `unknown`。**本 PRD 采用 ③ 的「不劣化 + 本卡范围内清零」口径**（见裁定 F），并保留 ①/② 作为 C7 的显式处置选项 |
| **X51** | `docs/architecture/control-plane-inventory.json` 的 **6 条 `retain` 中有 4 条与本决定集正面冲突**：`review-budget-namespace`（`review-record-route.mjs#readCanonicalBudgetHistory`）↔ **D-010 删轮次预算**；`execution-outcome`（`completion-predicates.mjs#deriveExecutionOutcomes`）↔ **D-027③ 阶段级 outcome 删除**；`verify-summary-writer`（`quality-store.mjs#publishVerifySummary`）↔ **D-023① `quality/verify.json` 连对象收掉**；`gap-root-cause`（`status_groups quality/release/close views`）↔ **D-029④ status 读取来源收敛为具名 ref 集合**。该文件由 `control-plane-governance.test.mjs` 强制，不改它就与 C5/C6 同时矛盾。 | 实测 `controls.length = 6`，六条 `disposition` 全为 `"retain"`；与 D-010（L1184–L1207）、D-027③（L1599）、D-023①（L1500–L1520）、D-029④（L1654）逐条对照 | **C7 在 C5/C6 合入后重核并收敛这 4 条**（改为 `retire_with_replacement` 或删除条目）；`control-plane-governance.test.mjs` 同批改。map §2.3 C7 只说「`control-plane-inventory.json`」未点明这 4 条冲突 |
| **X52** | `docs/audit-contracts.md:5` 称 **`core/audit-aggregator.mjs` 是唯一可签发 canonical `verdict` 的组件**，但该文件在 HEAD **不存在**（实测 MISSING）。文档描述的是一套已拆分的审计子系统。 | `test -e core/audit-aggregator.mjs` → MISSING；`runtime/schemas/steps.schema.json` 存在（52 行）、`runtime/schemas/audit-summary.schema.json` 存在（20 行）、`runtime/schemas/requirement-ledger.schema.json` 存在（55 行）、`runtime/evidence/audit-summary-carrier.mjs` 存在（68 行）；`grep -rn 'audit-aggregator' --include=*.mjs core runtime tools scripts workflows skills tests` 仅 6 个文件命中，其中生产侧只有 `runtime/evidence/audit-summary-carrier.mjs` 与 `tools/architecture/reference-audit.mjs` | **C7 更正文档表述**（把「`core/audit-aggregator.mjs` 签发 verdict」改为实际存活组件），或整段作废并写明替代；**不新增检查器**（撞 F11）。父材料 R8（L898）只提到「把两个零引用死 schema 称为唯一拓扑权威」，未发现「唯一 verdict 发行者已不存在」 |
| **X53** | markdownlint 口径冲突：**83**（更新版 linter）≠ **82**（仓库锁定 linter）。 | **仓库锁定 linter** `./node_modules/.bin/markdownlint-cli2`（v0.14.0 / markdownlint **0.35.0**）实测 `Summary: 82 error(s)`；按规则 MD032×34、MD022×30、MD036×12、MD052×2、MD024×2、MD040×1、MD001×1 = **82**。**83** 来自 `npx --no-install markdownlint-cli2` 拉的 **0.41.1**，多出的一条是 `decision-log.md:24:246 MD060/table-column-style` —— **0.35.0 没有 MD060 规则** | 以**锁定 linter 的 82** 为准；C7 的具名清单与 oracle 写 **82**（并注明 MD024×2 随 X6 去重消失 → 目标值 **81**）。**不得用 `npx`**（规则集不同） |
| **X54** | `docs/adr/` 存在**编号冲突**：`0002` ×2、`0009` ×2、`0025` ×3（实测 30 个文件）。D-014 要同步的 6 个方向里，**`0009`（same-snapshot recovery）与 `0025`（review dispatch preflight）各有两个/三个同号文件**，无法唯一定位。 | `ls -1 docs/adr/` → 30 项，含 `0002-requirement-lineage-and-step-audit.md` / `0002-v4-review-exception-state-matrix.md`；`0009-same-snapshot-phase0-recovery-requires-explicit-intent.md` / `0009-stage-content-authority.md`；`0025-convergence-outline-and-close-loop.md` / `0025-planning-branch-and-maintainable-prd.md` / `0025-review-dispatch-preflight-boundaries.md` | **C7 在卡内点名具体文件**（`0009-same-snapshot-phase0-recovery-requires-explicit-intent.md`、`0025-review-dispatch-preflight-boundaries.md`），并在更正时登记编号冲突这一事实；是否重编号为**治理动作**，须用户点头（不在 C7 自主范围内） |
| **X55** | `package.json` 的 `npm test` 实测在 **`:12–14`**，父材料 D-028⑤（L1635）与 R8（L898）写的 **`:24-26`** 已过期。 | `grep -n '"test"' package.json` → `12: "test": "npm run test:safe && npm run test:exclusive"`；`13: test:safe`；`14: test:exclusive` | 以实测为准；C7 更正时写「文件 + 行号 + HEAD」三元组，并注明「父材料行号可能漂移，一律按 HEAD 重核」（父材料 `next_stage_boundary` 第 ⑤ 条已自认此风险） |
| **X56** | D-014 `facts_and_constraints`（L1290）称「`AGENTS.md:31` 与 `CLAUDE.md` 声明顶层 `schemas/` 为历史兼容区」，实测 `AGENTS.md` 的对应句在 **`:37`**（`:31` 是 `CONTEXT.md` 行）。 | `grep -n 'schemas/' AGENTS.md CLAUDE.md` → `AGENTS.md:34`（`runtime/` 分区，合法）、`AGENTS.md:37`（顶层 `schemas/`，**目标行**）、`CLAUDE.md:23`（顶层 `schemas/`，**目标行**） | 以实测为准；C7 按 `AGENTS.md:37` + `CLAUDE.md:23` 更正。另：`AGENTS.md:44` / `:58` 的引用**与实测一致**（D-029⑩ 的行号是准的） |

---

## 实测记录 · 任务Ⅲ（C7 / C8）（命令原文 + 关键输出）

### 环境

```text
$ cd /Users/Hugh/Hugh/Project/workflowhub && git log -1 --format='%H %ad %s'
216a546d4ec33ca3804a188a14a9536a2968f77c Thu Sep 10 21:56:40 2026 +0800 archive specs/workflowhub-make-decision-hardening

$ shasum -a 256 <decision-log.md>
9c5c45a2c06ff5cb01809a2712064577e84f69ef1e46ca2be97be262220bae68  decision-log.md
$ wc -l <decision-log.md>  →  1979   (239,459 B)
```

> `decision-log.md` 位于 **worktree** `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-20260910/specs/workflowhub-mechanism-simplification-20260910/`。主仓 `specs/` 实测只有 `archive/` 与 `workflowhub-ui-frontend-capability-20260904/`（该 specs 目录**不在主仓工作树内**）。

### F1 · `check-task-record-paths.mjs` = 10 FAIL（REAL_EXIT=1）

```text
$ node tools/cli/check-task-record-paths.mjs ; echo "REAL_EXIT=$?"
[check-task-record-paths] FAIL: runtime/stage/stage-handoff.mjs: caller-supplied storage/task path capability
[check-task-record-paths] FAIL: runtime/task/task-kernel-implementation.mjs: caller-supplied storage/task path capability
[check-task-record-paths] FAIL: core/task-close.mjs: literal specs path derivation is only legal in core/artifact-dir.mjs
[check-task-record-paths] FAIL: skills/spec-prd/SKILL.md: literal specs path derivation is only legal in core/artifact-dir.mjs
[check-task-record-paths] FAIL: skills/spec-prd/templates/prd-template.md: literal specs path derivation is only legal in core/artifact-dir.mjs
[check-task-record-paths] FAIL: runtime/distribution/skill-bundle-release.mjs: unclassified direct filesystem writer; use TaskHandle/ArtifactDir or classify trusted infrastructure
[check-task-record-paths] FAIL: scripts/__tests__/smoke-local-skill-dispatch.test.mjs: unclassified direct filesystem writer; use TaskHandle/ArtifactDir or classify trusted infrastructure
[check-task-record-paths] FAIL: skills/wh-review/scripts/third-review-host-config.mjs: unclassified direct filesystem writer; use TaskHandle/ArtifactDir or classify trusted infrastructure
[check-task-record-paths] FAIL: skills/wh-review/scripts/wh-review-cli.mjs: unclassified direct filesystem writer; use TaskHandle/ArtifactDir or classify trusted infrastructure
[check-task-record-paths] FAIL: scripts/__tests__/smoke-local-skill-dispatch.test.mjs: stage/component must not read the storage-root environment
REAL_EXIT=1
```

→ **10 条，与主 PRD 声称一致**；含 `skills/spec-prd/SKILL.md`、`skills/spec-prd/templates/prd-template.md`、`core/task-close.mjs`、6 条 "unclassified direct filesystem writer"。
`wc -l tools/cli/check-task-record-paths.mjs` → **324**；两张按路径硬编码的表：L35 `FIXTURE_ALLOWLIST = new Set([`，L76+ 第二张（`["runtime/evidence/storage-root.mjs", new Set([...])]` …）。

### F2 · `verify-structure.mjs` = 2 FAIL（REAL_EXIT=1）

```text
$ node tools/cli/verify-structure.mjs ; echo "REAL_EXIT=$?"
结构验收 FAILED：
  - CONTEXT.md 缺五段术语「test-acceptance」
  - CONTEXT.md 含排除术语「runtime」
REAL_EXIT=1
```

→ **2 条，与主 PRD 声称一致**。

### F3 · `decision-log.md` markdownlint = **82**（仓库锁定 linter 实测）

```text
$ cd /Users/Hugh/Hugh/Project/workflowhub
$ ./node_modules/.bin/markdownlint-cli2 \
    "../workflowhub-workflowhub-mechanism-simplification-20260910/specs/workflowhub-mechanism-simplification-20260910/decision-log.md"
markdownlint-cli2 v0.14.0 (markdownlint v0.35.0)
Linting: 1 file(s)
Summary: 82 error(s)
```

按规则：`MD032×34  MD022×30  MD036×12  MD052×2  MD024×2  MD040×1  MD001×1` = **82**
**口径**：必须用**仓库锁定工具链** `./node_modules/.bin/markdownlint-cli2`（v0.14.0 / markdownlint **0.35.0**），**不得用 `npx`** —— `npx --no-install markdownlint-cli2` 会拉 **0.41.1**，规则集不同，同一文件报 **83**（多出的 1 条是 0.35.0 **没有的** `MD060/table-column-style` @ `:24:246`）；该 **83 不采用**。
关键行：`MD052×2` @ `:1606:44` 与 `:1606:75`（`[5][6][7]` / `[6][7]` 缺引用定义）；`MD024×2` @ `:1901`（六项大白话总结）与 `:1925`（阶段收口状态）——**随 X6 去重消失**；`MD001` @ `:1801`（D-030 从 h2 跳到 h4）；`MD040` @ `:1857`。
`.markdownlint-cli2.jsonc` ignores 实测**不含**任何 `specs/<task-id>`（只含 `specs/archive`、`specs/m7-intake-v1`、`specs/m9-verify-code`、`specs/m10-baseline-switch`）。

### F4 · `npm run check` 第一步已红（**554 error / 35 files**）

```text
$ cd /Users/Hugh/Hugh/Project/workflowhub
$ ./node_modules/.bin/markdownlint-cli2 "**/*.md" ; echo "REAL_EXIT=$?"
markdownlint-cli2 v0.14.0 (markdownlint v0.35.0)
Finding: **/*.md !node_modules !.agents !.claude !specs/archive !specs/m7-intake-v1 !.omc !specs/m9-verify-code !specs/m10-baseline-switch !docs/...
Summary: 554 error(s)
REAL_EXIT=1

# 含错误的文件数（本 PRD 一律用这个口径）：
$ ./node_modules/.bin/markdownlint-cli2 "**/*.md" 2>&1 | grep -oE "^[^ ]+\.md:[0-9]+" | cut -d: -f1 | sort -u | wc -l
35
# 注意：`markdownlint-cli2` 自报的 `Linting: N file(s)` 是【扫描口径】，与【含错误的文件数】不是一回事，本 PRD 不用它。

$ ./node_modules/.bin/markdownlint-cli2 "specs/**/*.md" | grep -cE 'MD[0-9]{3}'
420
# 按规则：MD029×194 MD032×103 MD022×62 MD034×20 MD058×16 MD036×13 MD040×6 MD056×2 MD037×2 MD031×2
# 涉及 22 个文件，全部在 specs/workflowhub-ui-frontend-capability-20260904/ 下（decision-log.md、prd-ui-frontend-capability.md、ui-frontend-workflow-handbook.md、evidence/** 等）
```

→ 见 X50。

### F5 · 关键文件行数 / 计数（HEAD 实测）

```text
CONSTITUTION.md              208 行   Version: 1.8.0 (L3)   22 条 (L6)
constitution-checklist.md     58 行   条目数 22 (L40)  F11+Q3+S8 = 11+3+8
AGENTS.md                     62 行   :37 顶层 schemas/   :44 index.json   :58 quality/verify.json + index.json
CLAUDE.md                     30 行   :23 顶层 schemas/
docs/audit-contracts.md       55 行   L5 称 core/audit-aggregator.mjs 为唯一 verdict 发行者
docs/adr/                     30 个文件（0002×2, 0009×2, 0025×3 编号冲突）
docs/architecture/move-map.json                 3192 行   entries.length = 362
docs/architecture/control-plane-inventory.json    38 行   controls=6 (全 retain)  skip_dispositions=21
package.json            :12 "test": "npm run test:safe && npm run test:exclusive"
                        :13 "test:safe": "vitest run --exclude=core/__tests__/check-extensibility.test.mjs --exclude=core/__tests__/check-anti-host.test.mjs"
                        :14 "test:exclusive": "vitest run core/__tests__/check-extensibility.test.mjs core/__tests__/check-anti-host.test.mjs --poolOptions.forks.singleFork --no-fileParallelism"
runtime/stage/stage-content-contracts.mjs       6806 行   ← 与 D-028 的 HEAD 实测值吻合（父材料另处写 6,485）
runtime/stage/stage-handlers.mjs                3956 行
runtime/stage/stage-runner.mjs                  3161 行
runtime/stage/completion-predicates.mjs         1259 行
runtime/stage/stage-handoff.mjs                  416 行
runtime/evidence/workflow-evolution.mjs         1448 行   ← 真实路径（非 runtime/stage/，非 core/）
runtime/stage/protocol-error-whitelist.mjs       216 行   ← 真实路径（N-001-z 更正为 runtime/stage/，实测成立）
runtime/task/task-index.mjs                       30 行
runtime/task/task-store.mjs                      334 行
runtime/evidence/quality-store.mjs               293 行
runtime/evidence/check-skill-closure.mjs         824 行   L154 PORTABLE_DEPENDENCY_IDENTITY / L290 全等校验
runtime/task/git-worktree-snapshot.mjs           647 行
workflows/*/skill-deps.yaml                        6 个    material_revision 共 47 处（9+12+1+13+8+4）
workflows/verify-code/*.mjs                        6 个（5 非测试 + 1 .test.mjs）
runtime/task/material-workspace.mjs               L6  export const CURRENT_MATERIAL_FILES = Object.freeze(["decision-log.md","spec.md","plan.md","tasks.md"])
runtime/review/review-record-route.mjs            L458,459,1010,1012,1069 minimum_heterologous
runtime/review/canonical-review-result.mjs        L225,231 minimum_heterologous
skills/wh-review/scripts/third-review-host-config.mjs  L642-647 sameSourceProfile → return provider === hostProvider;
```

M5 组件复测（HEAD）：`runtime/schemas/*.json` = **35**（`schemas/`、`core/schemas/` 实测 **不存在**）；`runtime/` 内 `throw new` = **1,476**（与 N-001-z 吻合）；`validate|assert|check` function 声明 = **229**（含箭头函数常量 = 268）；大写错误码 = **107**；`runtime/` 单文件最大 = `stage-content-contracts.mjs` **6,806 行**。

### F6 · 受影响测试文件存在性（`test -e` 全部 EXISTS）

```text
tests/task-record-paths-check.test.mjs                       EXISTS
tests/contract/control-plane-governance.test.mjs             EXISTS
tests/contract/repository-governance.test.mjs                EXISTS
core/__tests__/check-extensibility.test.mjs                  EXISTS
core/__tests__/check-anti-host.test.mjs                      EXISTS
core/__tests__/task-index.test.mjs                           EXISTS
tests/contract/public-behavior-baseline.test.mjs             EXISTS
tests/requirement-lineage.test.mjs                           EXISTS
tests/contract/core-runtime-layering.test.mjs                EXISTS
tests/contract/stage-handoff.test.mjs                        EXISTS
tests/contract/verify-publication.test.mjs                   EXISTS
tests/contract/execution-outcome.test.mjs                    EXISTS
tests/contract/review-budget-namespace.test.mjs              EXISTS
tests/contract/research-report.test.mjs                      EXISTS
tests/contract/stage-completion.test.mjs                     EXISTS
```

### F7 · M1/M2 出处追踪（**不可复现**）

```text
$ D=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks
$ for pat in '12,182\.1' '6,054\.384' '91,234'; do grep -rl "$pat" "$D"; done
workflowhub-mechanism-simplification-20260910/quality/evidence/stage-outcomes/make-decision/09e16e901017af283fe75920f2aa66e92fe6f86d9da93300e6984a72ed6eb31a.json
（三个 pattern 均只命中这一个文件 —— 即本任务自己的 stage outcome，属自引用）

$ for t in workflowhub-execution-acceleration-20260909 workflowhub-execution-simplification-20260907 workflowhub-close-readiness-governance-20260906; do
    grep -rl '12,182\.1\|6,054\.384\|91,234' "$D/$t"; done
（三个 store 全部零命中）

$ wc -c "$D/workflowhub-execution-acceleration-20260909/facts.jsonl"      →  0
$ wc -c "$D/workflowhub-execution-simplification-20260907/facts.jsonl"    →  0
$ node -e 'const j=require(".../acceleration.../index.json"); ...'        →  facts: len=0, archives: len=0
$ grep -rn '机制阻塞\|mechanism_block' "$D" | wc -l                        →  1（同一个文件）
$ 49 个 task 目录含 facts.jsonl；其中 16 个非空（wc -c > 0）
```

### F8 · M3 复算（**与 D-015 声称值逐项吻合**）

```text
acceleration  : find | wc -l = 1771    quality/evidence = 1052    stage-outcome-proofs = 423
simplification: find | wc -l =  962
close-readiness-governance:    find | wc -l = 1406
（D-015 声称 1,771 / 1,052 / 423 —— 三项全部吻合）

# import 图脚本（production graph，排除 node_modules/.git/specs/tests/__tests__/fixtures）
runtime/evidence prod .mjs total: 32
zero-importer (production graph only): 6
  audit-summary-carrier.mjs  boundary-confirm.mjs  capability-doctor.mjs
  receipt-schema.mjs  requirement-ledger.mjs  text-utils.mjs
tools/ zero-importer: 33   ← 绝大多数是 npm script / shell 入口，不可当死代码
```

→ 父材料写「`runtime/evidence/` 8 个零 importer」；实测 **6**。差异来自「是否把 `__tests__` import 计入 / 是否把入口点算作有 consumer」，**父材料未写死边界**。

### F9 · M4 复现（**两个基线值精确复现**）

```text
$ git log --oneline --all --grep='close-readiness-governance' | head -1
82ba3d86 Merge branch 'task/workflowhub/workflowhub-close-readiness-governance-20260906'
$ git diff --numstat 82ba3d86^1 82ba3d86 | awk '{a+=$1;r+=$2;f++} END{print "added="a" removed="r" files="f}'
added=11337 removed=163 files=147          →  11337 - 163 = 11174   ✓ 与 D-015 的 +11,174 吻合

$ git log --oneline --all --grep='execution-simplification' | head -1
5c246bda Merge branch 'codex/workflowhub-execution-simplification-20260907'
$ git diff --numstat 5c246bda^1 5c246bda | awk '{a+=$1;r+=$2;f++} END{print "added="a" removed="r" files="f}'
added=9063 removed=1024 files=83           →  9063 - 1024 = 8039     ✓ 与 D-015 的 +8,039 吻合
```

→ **M4 口径写死为「首父 merge diff 的 Σadded − Σremoved」即可复现**；`83 files` 亦与 D-026 的「上次 83 文件 / +9,063 行」吻合。

### F10 · `operations/close/**` 真实形状（T-7#4 证实）

```text
$ find "$D/workflowhub-execution-acceleration-20260909/operations" -type f
operations/close/completed.json
operations/close/confirmations/5f1819cc.../9406f73e-f65c-4e90-86d0-a9196dad4227.json
operations/close/plans/5f1819cc.../plan.json
operations/close/plans/5f1819cc.../confirmation.json
operations/close/plans/5f1819cc.../steps/commit-delivery.json
operations/close/plans/5f1819cc.../steps/merge-task-branch.json
operations/close/plans/5f1819cc.../steps/push-target-branch.json
operations/close/plans/5f1819cc.../steps/archive-spec.json
operations/close/plans/5f1819cc.../steps/cleanup.json
→ 单个任务的 operations/close 下共 9 个文件（1 个 completed + 1 个 confirmations + 1 plans/<hash>/{plan,confirmation}+5 steps）
```

→ K8 的「`operations/close/**` 的多文件计划对象收掉，计划改为一次性展示」**证实**。`operations/` 目录在 159 个任务目录中有 **20 个**存在。

### F11 · 父材料 X1–X14 实测行号（**与父材料给的行号有偏差处已标注**）

```text
X1  D-018① = L1382        D-017 = L1353-1374      R-008 表 = L826-845
X2  6485 见 L199/L842    6806 见 L1737 (RK-4) / L1745 (OPN-3)     实测文件 = 6806 ✓
X3  D-015 修订段 L1307-1308（288/1,412/97/47/6,485 行）
X4  e357a72d… = L1788 (Exit checks)   ca12f0b0… = L977 / L1892 / L1929   实测文件值 = 9c5c45a2…
X5  8b44558e….json = L1771            实际落盘 59f1998e… = L297,298,…,978（数十处）
X6  六项大白话总结 = L1827 / L1901     阶段收口状态 = L1851 / L1925
X7  ## Exit checks = L1776   →   ## 决定（补记：非目标与风险） = L1796
X8  旧口径 decision 行 = L1379         执行序唯一口径 = L1391
X9  「9 个批次」= L660 / L667 / L1756
X10 D-018① = L1382      D-028④ = L1628      相关 R4 = L894
X11 D-020② = L1436      批次⑤ = L1386
X12 D-029⑦ = L1657（未给批次号）；D-011 条 = L1208-1228；D-024 条 = L1521-1541；D-025 条 = L1542-1562
X13 L1382  vs  K 清单 = L803-824（K1 L807 … K9 L820）
X14 Exit checks「R-001~R-013 全部有处置」= L1781
D-030 = L1801
```

（父材料给的行号本轮实测**基本准确**；偏差仅在 D-014 引 `AGENTS.md:31`→实测 `:37`、D-028⑤ 引 `package.json:24-26`→实测 `:12-14`。）

### F12 · 治理文档点名对象命中

```text
$ grep -n 'index\.json\|verify\.json\|quality/confirmations\|CURRENT_MATERIAL_FILES\|schemas/' AGENTS.md CLAUDE.md
AGENTS.md:34  runtime/ 分区含 schemas/
AGENTS.md:37  core/、scripts/、顶层 schemas/：历史兼容区        ← 目标行（D-014 写 :31，实测 :37）
AGENTS.md:44  ...只放 task.json、facts.jsonl、quality/、index.json 等执行文件...   ← D-029⑩ 引 :44 ✓
AGENTS.md:58  vNext task 目录只保留 ... quality/verify.json、index.json ...        ← D-029⑩ 引 :58 ✓
CLAUDE.md:23  core/、scripts/、顶层 schemas/ 只保留 move-map 登记的历史兼容文件     ← 目标行
（quality/confirmations 与 CURRENT_MATERIAL_FILES 在 AGENTS.md / CLAUDE.md 中命中 0 次）

$ grep -rn 'CURRENT_MATERIAL_FILES' --include=*.mjs --include=*.json . | grep -v node_modules | grep -v '^\./specs/' | wc -l
36（定义点 runtime/task/material-workspace.mjs:6，冻结 4 项）

$ grep -rn 'quality/confirmations' --include=*.mjs . | grep -v node_modules | grep -v '^\./specs/' | wc -l
生产侧多处：runtime/task/task-store.mjs:42,48-49；runtime/task/task-kernel-implementation.mjs:89,93,946,967；
core/task-close.mjs:1824；runtime/evidence/freshness.mjs:120；runtime/stage/stage-handlers.mjs:168,1364；
tools/cli/stage-runtime.mjs:640；tools/cli/build-reflection-page.mjs:147；tools/cli/validate-stage-reflection.mjs:206-214；
core/__tests__/task-kernel-security.test.mjs:63；runtime/schemas/stage-reflection.v1.json:161 / v2.json:261
（K4 明文保留；AGENTS.md/CLAUDE.md 零字 → 治理文字缺口）
```

### F13 · 治理文件内容概要（供 PRD 引用）

- `CONSTITUTION.md`：208 行，Version **1.8.0**，22 条（F1–F11 / Q1–Q3 / S1–S8）。F3 L26–31、F5 L40–45、F6 L47–52、F10 L75–80（反例 = 9.5 万行 gate 代码 / 单文件 6000+ 行）、F11 L82–87（L85 = 「不得另造计数器、schema、运行时 gate 或测试框架来检查『是否足够简单』」）。治理节 L184–188（L187 = 变更须同步版本号/修订记录/映射/checklist 条目数）。L190 Version 行；L192–208 修订记录；L196 旧→新映射。
- `constitution-checklist.md`：58 行。F 段 L9–19（11 条）、Q 段 L23–25（3 条）、S 段 L29–36（8 条）；L40 条目数 22；L43–49 治理同步记录 4 条；L51–58「close 三义判据」（CLOSE-F9/Q1/F7/F3，非宪法条款）。

---

## 风险与交付说明

### 缺口与受影响范围

#### 总体缺口

| # | 缺口 | 影响范围 | 处置落点 |
| --- | --- | --- | --- |
| **G-1** | 母材料 `decision-log.md` 与已确认地图存在 **多处内部矛盾 / 残留 / 实测缺陷**（**全文共 51 条**：X1–X19 / X20–X25 / X26–X29 / X30–X36 / X40–X47 / X50–X56，见「任务卡」各组末尾） | 若照抄进 PRD 会把矛盾固化 | **C7** 同批更正；本 PRD 采用**裁定值** |
| **G-2** | 本任务 make-decision 的形式收口未完成：`outline_closed` 的 `direction_snapshot` 分支未满足（OPN-5） | **不阻断 build-prd**（宪法 F3/Q2「四材料可读即可继续」） | **C4** 修好审查健康终止后自然满足 |
| **G-3** | OPN-3：`stage-content-contracts.mjs` 与 `runtime/stage/` 三个巨人的主体级收窄方案未定 | 宪法 F10 反例在整改后仍成立 | **本 PRD 关闭**：C1/C2/C5/C6 的第 18 字段给出主体级行数净减目标 |
| **G-4** | D-030 的判死逻辑在 3rd-review 仓，不在本仓可验证范围 | C4 验收只能证明**调用侧映射正确** | C4 卡内如实标注；跨仓部分由 3rd-review 仓自身测试证明 |
| **G-5** | 共享工作区有其他 agent 并发改主仓（RK-7） | 基线漂移 | 每批开工前核对 HEAD。**本 PRD 的基线已核对**：HEAD `216a546d`，tracked 文件零修改（唯一未跟踪项 `.planning/`，不含代码），主仓与 worktree 的 `runtime/` 逐字节相同 |
| **G-6** | **M5 的五个"基线"不可能来自同一个 commit**，且「错误码数」**在 HEAD 无法复现** | M5「逐项净减」**按现状不可判** | **C0 必须逐指标写明范围与定义**；见 X2/X3/X18 |
| **G-7** | **4 条决定全文无批次落点**：D-011①、D-011②、D-024、D-025 | 这 4 条会被执行者漏掉 | 裁定 D 已给出落点，写进 C2/C3/C6/C7 |
| **G-8** | `check-extensibility.mjs` 在 10 批次中**无落点**，且 D-020② 自述「二者必有一废」却把它放在与删哈希不同的任务里 | `npm run check` 与 `npm test` 两条链会一直红 | 裁定 C：归 **C5** |
| **G-9** | 批次计数在父材料内有「9 个批次」残留 | 划批口径不唯一 | **C7** 统一为 10；本 PRD 只认 10 |
| **G-10** | 母材料 `## Exit checks` 记的「`interaction_proof=passed`（22 条核心项已绑）」**只在直接调用形态下成立**——生产路径必然失败（见 X15） | 该条完成依据**不可提交、不可核验** | **C4**；母材料该行须按 X15 更正 |
| **G-11** | `runtime/review/stage-materials.json` 的 `surfaces[*].contract` 有 **8 个条目零生产读者**，且路径口径易误读（见 X19） | 声明与实现不一致；属"无 reader 对象"类 | **C1**（按「没有真实 consumer 就删」处置）+ **C7**（口径写清） |

#### 裁定 A 的官方契约背书（**不是我的偏好，是已合并契约的要求**）

用户已确认裁定 A1（写 `prd.md`）。此后在 HEAD 找到**直接证据**，A1 实际上不是"修正决定"，而是**执行已合并的官方契约**：

| 证据 | 位置 | 内容 |
| --- | --- | --- |
| 官方 review 契约 | `skills/wh-review/contracts/build-prd.md`（66 行） | 「`prd`: the complete current PRD draft/body」列为 **Required packet materials** 之一 |
| 材料矩阵 | `runtime/review/stage-materials.json` → `surfaces["build-prd"].semantic_fields` | `["decision_log", "prd", "task_map", "map_confirmation", "design_facts", "quality_facts", "source_facts", "confirmation_facts", "delivery_facts", "analysis_facts", "reflection_facts"]` —— `prd` 在其中 |
| 非 stage 规则 | 同上 → `non_stage.build_prd.required` | `["decision_log", "prd", "task_map", "design_facts", "quality_facts", "review_instructions"]` —— **`prd` 是 required** |
| 契约测试 | `tests/contract/build-prd-review-contract.test.mjs:30-36` | 测试夹具 `fullPrdMaterials()` 明确提供 `prd: "# Product requirements\n\nA complete PRD with task cards and acceptance criteria.\n"` |
| workflow 契约 | `workflows/build-prd/SKILL.md:16-20` | 「The `spec-prd` skill is the only owner of formal PRD prose and the single `prd.md` write target」 |

**结论**：`prd` 是 build-prd 表面**必需的**材料。D-025③ 的「永不产出」与**已合并的官方契约直接冲突**；其真意（理由句）是「**不新增第五份当前材料**」，而这一点由「不进 `CURRENT_MATERIAL_FILES`、`close` 不得要求它」完全满足。C7 需据此更正 D-025③ 的措辞，**不是**删掉契约。

同时该契约还给本 PRD 定了三条硬边界（本 PRD 已遵守）：

##### 1. 只审查一次

，不建第二次审查流、不做"追 findings 清零"的循环、不建质量门（§"No second review flow, retry-for-clean-findings loop, or quality gate"）。

##### 2. findings 不是规划完成

（"A review with no findings is advice, not planning completion"）。

##### 3. 不得伪装成 `build-plan`

`approved_spec` / `draft_plan` / `draft_tasks` / `tasks` / `changes_diff` 在本表面 **forbidden** —— 本 PRD **不含**这些材料。

#### X1–X19、X26–X29：矛盾、残留与实测缺陷（母材料 / 地图核对侧，共 23 条；X20–X25 见「任务Ⅰ」节，X30+ 见各交付组节）

| # | 内容 | 证据 / 实测 | 本 PRD 采用的裁定值 |
| --- | --- | --- | --- |
| **X1** | `task-fact.v1.json`：**删**（批次①）vs **改字段保留**（D-017 / D-018③ / R-008 表） | 母材料两处原文 | **删 schema 文件**（实测从未被加载，校验是手写的）；「改字段」落为**改 `task-store.mjs:287-294` 的手写字段表** |
| **X2** | `stage-content-contracts.mjs` 行数：6,485 vs 6,806 | **实测 @HEAD：6,806**（`git ls-files \| xargs wc -l \| sort -rn`）。6,485 是 **16 个 commit 之前**（`276622e9`）的值 | **6,806**。仓库自己的 `lineCount()` 因尾换行给 6,807，统一用 `wc -l` 口径 |
| **X3** | M5 五项基线 288/1,412/97/47/6,485 | **实测：该集合不可能来自同一个 commit**——288 与 47 在 HEAD 成立；1,412 只在 6 个 commit 之前成立；6,485 只在 16 个 commit 之前成立；**97 在任何 commit 都不成立** | **整套作废，由 C0 重测写死**（见 X18） |
| **X4** | `decision_hash` 的三个值 | **实测：`ca12f0b0…` 是"确认那一刻的整文件 sha256"，而该 revision 已不在磁盘上**（文件在确认后被追加**并就地重写**）；代码只在 `stage-handlers.mjs:3309` 与 `task-kernel-implementation.mjs:609` 对**整文件**取哈希，**不存在任何"按章节取哈希"的实现**；当前文件 = `9c5c45a2…` | 分清**「确认时绑定值」（已不可复现）**与**「当前文件值」**两个口径。**编辑文件无法恢复 `ca12f0b0`**（子代理穷举了行前缀/后缀、全部 8 种章节切法、章节两两/三三组合、去重、rstrip、CRLF 折叠，0 命中） |
| **X5** | 交互聚合文件名 `8b44558e…` vs 实际 `59f1998e…` | 实际落盘文件 | 以**实际落盘**为准；C7 更正 |
| **X6** | `## 六项大白话总结` 出现 2 次（**逐字节相同**，L1827-1850 与 L1901-1924）；`## 阶段收口状态` 出现 2 次（内容不同） | 实测行号 | 各合并为 1 处，保留信息量更大的版本；C7 执行。**注意**：删任一份都会改变整文件哈希（→ `14f02460…` / `ec715604…`），但**这两个值也都不等于 `ca12f0b0`** |
| **X7** | `## Exit checks` 之后还有 `## 决定（补记：非目标与风险）`，形成第 17 个 `##` | L1776 vs L1796 | 章节顺序异常 → C7 归位（内容不删） |
| **X8** | D-018 的 `- decision:` 行仍是**旧口径**（任务Ⅰ=①②③ / Ⅱ=④⑤⑥ / Ⅲ=⑦⑧，无 ⓪⑨） | L1379 vs L1391 修订句 | **只认 L1391 的执行序句**；C7 在 L1379 加指向标注 |
| **X9** | `## Supersedes` 表与 OI 相关行仍写「**9 个批次**」 | L1756；OI 行 L660/665/667 | 统一为 **10 个具名批次**；C7 更正 |
| **X10** | `task-index.mjs` 归属：批次①（D-018①）vs 批次③（D-028④） | 母材料 L1382 vs L1628 | 裁定 B：**归 C3**。实测 `runtime/task/task-index.mjs` **零生产 importer**（唯一 importer 是 `core/__tests__/task-index.test.mjs:7`），而 `task-store.mjs:116,230` 把 `task-index.v1` **内联写**了 → 它是 `index.json` 的第二份实现，随对象一起死；同批改两处登记（`tools/cli/check-task-record-paths.mjs:53`、`tests/task-record-paths-check.test.mjs:121`） |
| **X11** | `check-extensibility.mjs` 归批次⑤ 还是批次⑦ | 母材料 L1436 vs L1386 | 裁定 C：**归 C5**。实测它同时挂在 `npm run check`（经 `tools/cli/run-checks.mjs` 聚合）与 `npm test`（`test:exclusive` 直接跑 `core/__tests__/check-extensibility.test.mjs`）两条链上 |
| **X12** | D-029⑦ 声称「逐项显式编入批次」但**未给批次号** | 母材料 L1657 + 全文检索 | 裁定 D 给出落点（见 G-7） |
| **X13** | 批次① 的删除清单与「保留记录清单 K1–K9」可能交叉 | 母材料 L1382 vs L803–821 | 每批删除前与 K1–K9 逐项比对，**K 清单优先**；写入 C7 |
| **X14** | `## Exit checks` 声称「R-001~R-013 全部有处置」 | L1781 | 已复核 R-001~R-013 均有处置行；但 `interaction_proof` 一条按 X15 须更正 |
| **X15** | **【新发现·实测·阻塞级】生产路径上 `interaction_proof` 必然失败** | `runtime/stage/stage-handlers.mjs:3336-3340` 把**自己的**对象 `{ ref, value, evidence:{ ref, sha256 } }`（`:614-618` / `:641` 构造）传进分析器；而 `runtime/stage/stage-content-contracts.mjs:3041` 读的是**顶层** `interactionAggregate.sha256 ?? interaction_hash ?? hash` → 恒为 `undefined` → `:3054` 对**每一个核心 OI** 报 `core interaction proof is not current or does not bind its OI/group/disposition`。活体复现：真实文件走该路径得 `interaction_proof: "missing"` + 23 条该报错；把同一个聚合按**测试用的形态** `{ref, sha256:"59f1998e…", value}` 传入则 `interaction_proof: "passed"`、0 错误（`tests/contract/decision-convergence-depth.test.mjs:65-83`） | **归 C4**（与"审查/证据绑定通道修复"同族）。**单测绿、生产红**是典型的"验证在骗自己" |
| **X16** | **【新发现·实测】交互聚合形状缺键，官方发布路径会直接拒绝它** | 落盘聚合含 `confirmation` → `stage-handlers.mjs:602-604` 判定为 current-contract 形态 → 但 `validateInteractionAggregateContract`（`:606-607`）报 `MATERIAL_INCOMPLETE: … original_requirement must bind a ref and hash; … decision must bind ref, hash, and material revision` | **归 C4**。另：`stage-handlers.mjs:611` 与 `:626` 会把聚合里的 `decision_hash`（`ca12f0b0…`）与**现场重算的整文件哈希**（`9c5c45a2…`）比较 → 恒不等（见 X4） |
| **X17** | **【新发现·实测】M5「错误码数」指标在仓库里没有定义** | 无任何错误码登记表；可复现的值域 16–236 取决于定义（`protocol-error-whitelist.mjs` 16 个 class_id / runtime UPPER_SNAKE 93 / 生产 UPPER_SNAKE 188 / `throw new X("CODE…")` 首 token 35 / 去重抛出消息 1363）；**97 与 117 都复现不出来** | **归 C0**：**要么给出书面定义，要么从 M5 里删掉这一项**。不得用一个定义不明的数字当验收判据 |
| **X18** | **【新发现·实测】M1/M2/M5 的「生产范围」在母材料里从未定义** | 同一指标随范围漂移：函数数 **288**（`runtime`+`tools`）/ **301**（+`core`）/ **361**（生产，按仓库自己的定义）/ **382**（生产+测试）；`throw new` **1,476**（`runtime`）/ **2,467**（生产）/ **2,530**（生产+测试）；schema 文件 **19 / 39 / 42 / 45 / 47** 五种都说得通 | **归 C0**：逐指标写明范围，并**优先复用仓库已有的定义**（`tools/architecture/complexity-report.mjs:22-33` 的生产文件定义、`:251` 的 schema 定义，其自带目标值是 8）→ **零新对象**（符合 D-013） |
| **X19** | **【新发现·实测】`surfaces[*].contract` 8 个条目零生产读者，且路径口径易误读** | `runtime/review/review-policy.mjs` **不读** `.contract`；全仓 grep `\.contract\b` 在生产侧**无命中该字段**。8 条路径写作 `contracts/<name>.md`，但仓库根的 `contracts/` 里**这些文件都不存在**；真实文件在 `skills/wh-review/contracts/<name>.md`（8 个全部存在，路径相对 `skills/wh-review/`）。**易被误判为悬空引用**（我最初就误判了一次，已自查更正） | **C1**（按「没有真实 consumer 就删」的判据：要么删字段，要么给出读者）+ **C7**（把相对根写清）。**本 PRD 不把它当悬空引用上报** |
| **X26** | **【新发现·实测·漏改必红】`runtime/schemas/stage-skill-deps.schema.json:27` 的 identity 常量不在任何批次清单里** | 实测该行 = `"identity": { "const": ["task_id", "stage", "material_revision", "snapshot_tree"] }`（`required: ["target","inputs","identity"]`，`additionalProperties: false`）。父材料与地图只点了 `check-skill-closure.mjs:154,290` 与 6 个 `skill-deps.yaml`，**都没点这个 schema** | **归 C5**：只改后两者而不改 schema → 5 个正式 stage 的 `skill-deps.yaml` **schema 校验直接失败** → `npm run check` 红。四处必须同批改 |
| **X27** | **【新发现·实测】已确认地图的裁定 C 理由句被实测推翻（结论保留）** | 实测 `tools/cli/check-extensibility.mjs`：`createCoreSnapshot()`（`:52-59`）在**同一进程内、调用 `runKernel` 之前**抓 `scanCoreFiles()`（= `runtime/**/*.mjs`，`tools/cli/scan-core-files.mjs:35`）的 sha256，`isCoreUnchangedFromSnapshot()`（`:72-89`）调用后比对 → 它测的是「**这次 dispatch 有没有改 runtime 字节**」，与 `material_revision` / `snapshot_tree` **无代码依赖** | **裁定 C 的结论（归 C5）保留，理由更正**：不是「C5 会把它弄红」，而是「它是**同一原理的第二套哈希失效链**，是同类机制的最后一处」。另附一处独立缺陷：该文件头注释写 `core/*.mjs`，实现扫的是 `runtime/**/*.mjs`，**注释与实现不符** |
| **X28** | **【新发现·实测】`currentness` 在 HEAD 是概念名，不是标识符** | 大小写不敏感全仓检索 `.mjs`/`.json`：除 `specs/archive/**` 与 `.planning/**` 的历史文档外**零命中** | 卡里**不得**写成「删 `currentness` 符号」；它是一个**语义主张**（"材料变了旧事实就不算数"），删的是实现它的那条链 |
| **X29** | **【新发现·实测】C6 的两处同根因** | ① `status_groups` **全仓零 consumer**（生产唯一产出点 `tools/cli/stage-runtime.mjs:770`，连测试都没有）→ D-012 的 "print-only" 实测成立；② `quality_gaps` 与 `release_gaps` 是**同一个数组的两份拷贝**（`tools/cli/stage-runtime.mjs:417-418`：`quality_gaps = [...new Set(productRelease?.reasons ?? [])]`，紧接 `release_gaps = [...quality_gaps]`） | **归 C6**：删 product-release 投影时这两个字段**同一根因，必须一起收**；只收一个等于留下一个空壳字段 |

**受影响范围小结**：**全文 51 条** X 中，**X1–X16 全部落在母材料文本与 `runtime/stage/` 的 OI 证据绑定链上**（X17/X18 是 M5 度量口径、归 C0；X19 是 `runtime/review/stage-materials.json` 的零读者字段、归 C1/C7；X20–X25 归任务Ⅰ 各组、X30–X36 归任务Ⅱ-A、X40–X47 归任务Ⅱ-B、X50–X56 归任务Ⅲ），**不影响**本 PRD 的任务切分、10 张卡、执行序与四类依赖；受影响的只有：①C7 多一项"父材料更正"；②C4 多一项"OI 绑定通道修复"（X15/X16）；③C0 多一项"逐指标定义范围与取舍"（X17/X18）；④母材料 `## Exit checks` 的 `interaction_proof` 一行须按 X15 更正。

#### 本 PRD **不**声称的事（诚实边界）

##### 1. 不声称 make-decision 已形式收口

`outline_closed` 未满足（G-2）。

##### 2. 不声称母材料自洽

它有 **共 51 条**已登记的矛盾 / 残留 / 缺陷（**X1–X19 / X20–X25 / X26–X29 / X30–X36 / X40–X47 / X50–X56**；编号按交付组分段；X37、X38、X48、X49、X57–X59 是未使用的空号）。全部已逐项裁定，但**母材料文本本身尚未更正**（C7 才更正）。

##### 3. 不声称任何代码已改

本 PRD 只做规划。

##### 4. 不声称 M1–M5 已有可信基线

现有五数**不可能来自同一个 commit**，且第五项无定义（X3/X17/X18）；基线由 C0 重测。

##### 5. 不声称 `decision_hash` 可复现

`ca12f0b0…` 对应的 revision 已不在磁盘上（X4）。

##### 6. 不声称跨仓部分已验证

D-030 的判死逻辑在 3rd-review 仓（G-4）。

##### 7. 不声称宿主/broker 能力可用

属仓外范围，影响面已登记。

### 异源审查 findings 处置表（**17 条，逐条不漏**）

**来源**：第二次真实异源审查（见「最终展示稿确认 · 第五轮」）；**2/3 provider 完成**、**17 条 findings**（blocking **5** / major **10** / minor **2**）。**17 条全部成立**，均为本 PRD 自身的真缺陷。**处置口径**：**不许为了让 finding 消失而放宽断言或删掉内容** —— 要么真改方案（改卡/改 FR/改 AC/改 oracle），要么给出具名裁定，要么如实登记为不可解。**本表结论：0 条不可解；15 条已改 PRD；2 条给出具名裁定（落在裁定 J-5/J-6，且 J-5 附一句待用户回答的问题）。**

| # | 严重度 | 处置 | 一句话理由 |
| --- | --- | --- | --- |
| **1** | blocking | **已改 + 裁定**：共享定义「术语 · 阶段执行记录行（K2）」重写（两行型 + 必填子集）；`C3-FR-2`/新增 `C3-FR-9`、`C3-AC-3`/`AC-8` 改写；**裁定 J-1**（第 5 值字面量名 `dispatched_uncollected`）、**裁定 J-2**（K2 行型 + `non_stage` 口径，**归属前移到 C3**） | 三处缺口各自补齐：第 5 值有名字、`non_stage` 二选一定死为「进 `facts.jsonl` 不进谓词」、close 五动作行**是** K2 的 `close_action` 行（「每 stage 一行」是行型唯一性约束，不是文件只有一种行） |
| **2** | blocking | **已改**：`C5-AC-1` 改为「只对本卡 write-set 覆盖面要求零残留」并把 `core/task-close.mjs` 的 planning 分支**显式排除**；§6 oracle 改两段式（覆盖面 + 排除项移交证据）；新增 `C5-FR-8` | **选「C5 排除 + C6 承接」**（不选改归 C5）：X47 已裁定归 C6，且它必须与 D-025② 的 planning 收口同批；改归 C5 会把同一处收口口径劈成两半，违反「同文件同批」 |
| **3** | blocking | **裁定 J-3 = 删除**：`identity/path-cards/**` 整类删除（含 `persistWriteBoundaryPathCard` 落盘分支、`TaskHandle.createPathCardRecord`、`PATH_CARD_WRITERS`）；同步 C3 §2/新 `C3-FR-10`、C5 §2 表第 3/12 行、`C5-FR-2`、`C5-AC-5`、新 `C5-AC-9`、C5 §13/§15/§18、删除侧族级清单 | 实测**零生产 reader、零测试引用**，函数自述 `informational_only`；按 D-013「没有真实 consumer 就删」。**「待写字节」强度不变**（改内存内比对、错误文案不变），所以这不是放宽 |
| **4** | blocking | **裁定 J-4 = 保留（归 K5，不迁移不删除）**：`C1-FR-2`、C1 §(i)/X20 行、C3 §2/`C3-AC-4`、`C6-FR-3`/新 `C6-AC-15`、`C8` §6(a)、裁定 H 连带**四处同步为同一句**；并**定死 C1 最终具名清单的产出者与时点**（C1 在 build-spec 产出、随 C1 合入冻结；上限由裁定 H 写死；C8 不得自造） | 3 处活生产引用（含 `stage-runner.mjs:92-100` 读不到即 `throw`）⇒ 删不得；迁移要重写发布链三处且把 per-step 证据压进 stage 行 ⇒ 违净减法。**「阶段级 outcome 由 K2 承接」只管 `stage-outcomes`，不管 per-step proofs（粒度不同）** |
| **5** | blocking | **已改（不只改 AC 文字）**：新增 `C4-FR-17`（补齐方向完整性指令）与 `C4-FR-18`（OI 清单绑定到 `decision-log.md` 的具体修订版本 + 修 X15/X16）；`C4-AC-15` 重写为「ref 可读 + 输入含 decision_revision 与 OI 逐条 ref/sha256 + `outline_closed` 满足」；新增 `O-9` 四段 oracle；`C4-FR-18` 列为 `AC-15` 的前置 | `outline_closed` 不可达的根因是**生产路径 `interaction_proof` 恒失败（X15）+ 聚合形状缺键（X16）**，而 OPN-1/OPN-5 的关闭条件是「带 OI 快照的方向审查能跑通」—— 不补 FR 就永远关不掉 |
| **6** | major | **已改**：C4 §13 `R-2` 重写（X30 已关闭；风险改为「落点只能有一个」）、§16 第 1 步重写（不再「取得裁定」）；新增 `C4-FR-19`（provider 生命周期**所有权条目**，可执行落点 = FR-8/9/10）与 `C4-AC-19`（C9 不得再持有、不得出现第二份判死实现） | 裁定 G 的移交此前**只有撤销、没有接收** —— 一个没有条目的所有权等于空移交；X30 残留则会让 build-spec 把「改枚举」写死成事实 |
| **7** | major | **裁定 J-2.3：前移到 C3**（任务Ⅰ 内闭合）。`C3-AC-8` 重写为可执行双判据；`C3-FR-9` 定死 `STAGE_KEYS = STAGES ∪ ["build-prd"]`；`C6-FR-8`/`C6-AC-9` 收缩为「只把谓词遍历集合钉死为 `STAGES`」；C3 §13 增 ⑦（扩面若写成「把 build-prd 加进 `STAGES`」即失败） | C3 属任务Ⅰ、C6 属任务Ⅱ，原「同批二选一」让任务Ⅰ 开工时**校验契约悬空**；且「不进 `facts.jsonl`」会让 planning close 的 K8 动作行无家可归 |
| **8** | major | **已改（三处对齐）**：C5 侧 = §2 新增跨卡排除项 + `C5-FR-8` + `AC-1` 第 ② 条 + §6 oracle 第 ② 段 + §13 风险 + §16 build-plan（**不再「把 X47 补进 write-set」**）+ §18「0」；C6 侧 = §2 承接段 + `C6-FR-11` + `C6-AC-14` + §6 oracle + §12 来源 + §18；X47 行同步为「归 C6」 | 原状是「C5 被要求补进 write-set、C6 没有任何条目、X47 只说归 C6」—— 三处互不一致；现在三处是同一句话 |
| **9** | major | **已改（选择补进 C4 而非收窄 AC-18）**：C4 §2 新增 verify-code 执行端条目（点名 `stage-handlers.mjs:373-374`/`:2400-2403`/`:3855-3870`，并**排除** `workflows/verify-code/**`）；§11 新增三条共享资源（含 `stage-materials.json` **只读不改** lens）；§17 新增 2 个测试文件与 1 条命令；`C4-AC-18` 增「执行端未被改动即失败」；`O-8` 增第 5 段 | 收窄 `AC-18` 会掏空 R-015④ 的落点（裁定 I-4/I-5 明写落 C4）；补进 C4 只需在手写集合里加**已被本卡触碰的同一文件的具名段**，不引入新的跨卡冲突 |
| **10** | major | **裁定 J-8：统一正则 = (A)「含 verify-code + sha 段可选」**，5 处声明合并到唯一定义点；`C2-AC-2` 改为两条可执行判据；C2 §6 新增正/反例断言（6 正 + 6 反）、§13 风险 ② 重写、§14 去掉「需先裁定」 | 「取 5 个旧版的交集/最严」**不可实现**：(B) 无 sha 段 与 (C) 无 verify-code + 强制 sha 的接受集**无交集**，取交集会让所有 ref 非法；取**与全部生产者真实输出相符的最小接受集**才是正解。放宽的两类（`verify-code`、无 sha 段固定 ref）**都是生产者的真实输出**（`stage-reflect.mjs:29-35`/`:110`/`:356`），其余 6 类仍判非法 |
| **11** | major | **已改**：C4 §3 新增「**健康终止契约**」5 条（心跳/探测周期 60,000 ms、配置层 liveness 1,000 ms、**计时器 owner = 3rd-review 仓**、过期阈值 = 健康裁决（`busy` 且游标连续 5 次未推进 → `PROCESS_STALLED`）、**「忙但存活」判据**、数值归属边界）；`C4-FR-8` 补齐同一组；新增 `C4-AC-20` 与 `O-10`；§13 `R-7` 重写（`progressing` 但游标长期不变 = **已知不覆盖项**，不得用墙钟兜底） | v4 已**废除 elapsed-time 终止**（`idle_timeout_ms`/`max_duration_ms`/`deadline_ms` 出现即 `CONFIG_INVALID`，`max_wall_clock_ms` 恒 `null`）⇒ 判死必须写「由 3rd-review 自己的健康裁决给出」；本仓零计时器 |
| **12** | major | **裁定 J-5 / J-6 / J-7 三处各选一**（收进裁定 J）：C5 `check-extensibility` = **A 原样保留**（被否 B/C/D/E/F 逐条给后果；**J-10 附一句待用户回答的问题**）；C9 去重 = **(b) 已完成结果复用**（被否 (a) 在途去重）；C6 = **canonical ref 集合定死为 6 类具名 ref** + **`risk_close` 替代判据 = 与 status 根因行登记的具名 ref 集合逐项全等**。同步：C5 §11/§12（候选表改为「已选路线 + 被否留痕」）/§13/§16/§18；C9 §3/`FR-2`/`AC-6`/§13 `R-4`/§12 + X31 行；C6 `FR-3`/`FR-4`/`AC-6`/新 `AC-13`/§6/§18 | 这是**用户最初的抱怨本身**：菜单=变相延期。三处都给出唯一路线、理由、被否选项与后果；**唯一需要用户输入的是 J-10 那一句话**（因为裁定 C 是已确认裁定，把它的落地形态定成「保留」等于修正已确认决定的落地形态） |
| **13** | major | **已改**：C7 §2 第 2 项写死「对照项落**非条款区**（与既有『close 三义判据（非宪法新增条款）』同形态），**不新增第 23 条、不替换任何 F/Q/S 条目**」；§2 第 10 项点名 `operations/close/**` 的**具名代码删除面**（`core/task-close.mjs` 六处落盘点 + `tools/cli/task-close.mjs` 读取面，保留确认凭证与 plan hash 校验）；「明确不在范围内」改为「除第 10 项外不做生产行为改动」+ 三条边界；`C7-FR-12` 与新增 `C7-AC-13`；§18 新增两行（含**串行：C6 先合、C7 后合**） | 原状自相矛盾：一边要求移除 `operations/close` 的生产持久化，一边排除任何生产代码改动；checklist 要求「保持 22 条并新增一条」却不说替换谁 —— 现在两者都有具名答案 |
| **14** | major | **已改（FR 与 AC 同时改到一致）**：C9 §3 第 1 条、`C9-FR-5`、`C9-AC-9` 统一为**三条一一对应**：① 校验不合格 ⇒ **不启动该次子进程**；② 如实返回 `protocol_invalid` + 非空 `diagnostics`；③ **不新增门禁**（不写谓词/gate、不改 stage 状态、不阻止推进，修正后可原地重试） | 「失败即拦」与「失败不阻断」不是矛盾，而是**拦这一次昂贵动作 ≠ 拦任务推进**；把这句话写进判据后两句话同时成立且可执行 |
| **15** | major | **已改（三条各补可执行 oracle）**：C2 新增 §6 第 5 条（`node -e` 断言 1 个共享实现 + 4 张独立数据表 + `build-code` 特有检查逐项保留）与 `C2-AC-6`；C4 `O-8` 第 1 段增「五项齐备」断言、第 2 段改为**正例/反例成对**（输入未变不重跑 / 输入变了照常重跑） | 原 AC 只验「不落盘」和 phase key，等于**没有 oracle 证明该说的那件事**；补的是断言而不是文字 |
| **16** | minor | **已改**：C1 §17 的精确命令去掉 `core/__tests__/task-index.test.mjs`，并加一条划掉说明（**该用例归 C3 的 §17 清单**，C1 不跑它）；保留「同批删除 `tests/task-record-paths-check.test.mjs:121` 的参数项」这一必要动作 | `task-index.mjs` 按裁定 B 归 C3 删除，C1 不删它就不该把它列入受影响测试 |
| **17** | minor | **已改 + 裁定 J-9**：C0 oracle 补齐 M5 第 4 项（`validate`/`assert`/`check` 函数声明 **229**，含箭头常量第二口径 **265**）与第 5 项（**错误码数的书面定义** = 协议错误分类数 `class_id` 去重 = **16**；参考口径 122 不作判据）；`C0-AC-2` 同步；M5 可证伪反例一并给出；§实测记录与「未找到项」同步 | X17 已登记「错误码数没有定义、不可复现」并给了两条出路 —— **本裁定选择「给出书面定义 + 可复算命令」，不删指标**（删指标才是放宽）；父材料的 97/117 永久标注不可复现 |

**对「不许放宽断言」的自查**：17 条里**没有一条**通过「改 AC 文字让它变绿」处置。三处看起来像「变」的地方都已写明为什么不是放宽：① finding 2 的 AC-1 是**收窄验收覆盖面到本卡 write-set**（越界即失败，且排除项必须登记 C6 承接）；② finding 10 的 `C2-AC-2` 是**把不可满足的判据改成可执行判据**（6 正 + 6 反断言，反例比旧版更具体）；③ finding 17 的 M5 是**给指标补定义**而非删指标。

### 质量事实

- 本 PRD 由 `spec-prd` 依据**已确认**的母决定产出；母决定材料与已确认地图的核对**共登记 51 条矛盾 / 残留 / 缺陷**（X1–X19 / X20–X25 / X26–X29 / X30–X36 / X40–X47 / X50–X56），**全部已具名登记并给出裁定值**，未静默继承。
- 本 PRD 的所有数字与路径均标注了**来源与实测命令**；无法实测的一律标 `unknown` 并写明查了什么。
- **本任务 make-decision 的形式收口未完成**：`outline_closed` 的 `direction_snapshot` 分支未满足（OPN-5）。**不阻断 build-prd**（宪法 F3/Q2「四材料可读即可继续」）。
- 本 PRD **未改动任何代码**，未执行任何不可逆动作。

### 交付说明

- **规划完成**：任务地图已由用户确认为 `build-prd-map-v1`；任务卡已展开为 18 字段完整卡。
- **材料可用**：`specs/workflowhub-mechanism-simplification-20260910/prd.md`（本文件）。四份当前材料中其余三份（`spec.md` / `plan.md` / `tasks.md`）**不在本工作流范围**，由后续 3 个任务的各自阶段产出。
- **开发状态**：**未开始**。本 PRD 只是规划交接物。
- **质量事实**：见上。缺失项保持 `unknown` / `unavailable`，未伪造通过。
- **必要附件与版本**：母决定 `decision-log.md`（revision 见上）、地图 `build-prd-map-v1`、仓库 HEAD `216a546d`。
- **物理动作及授权**：**无**。本工作流不授权 Git、发布、归档或任何物理交付动作。

---

## 变更说明

| 版本 | 日期 | 变更 | 依据 | 影响 |
| --- | --- | --- | --- | --- |
| v1 | 2026-09-11 | 首版：从已确认的 `make-decision` 方向展开为 3 交付组 / 10 张任务卡 | 母决定 D-018/D-019/D-025；地图 `build-prd-map-v1` 经用户确认 | 后续 3 个标准开发任务的开工输入 |
| v1.1 | 2026-09-11 | **实质变化（需重新确认）**：按两次异源复核的阻塞级发现修正 11 组 —— C8 删除清单按四类对象重写（M-1）、3 处测试路径（M-2）、新增 C3-AC-7/AC-8（M-3）、C1-FR-2 定性更正（M-4）、C0 字段 17/18 互斥消解（M-5）、C2 两条 oracle 改可达（M-6）、新增**裁定 G**（`review_origin` 字段 ≠ 对象，M-7）、补四处实测行数（M-8）、拼写/路径更正（M-9）、两处跨仓 oracle 标不可闭合并给仓内替代（M-10）、X24 计数更正（M-11） | 两次独立上下文异源复核（对抗性证伪 A1–A7 + 母材料逐条核验）；`displayed_draft_hash` 首版 `4dfeb9ff…`，修正版 `acdd7be3…` | **实质变化，按本 PRD「变更说明」规则必须重新取得真实确认**；确认前状态保持 `draft`；受影响的承诺面 = C8 验收口径、C1 删除边界、C3 记录字段、C0 零新增、C2 oracle、C9-FR-6 归属 |
| v1.2 | 2026-09-11 | **实质变化（需重新确认）**：按第二份独立复核的 A–H 八组更正 —— 新增**裁定 H**（C1 三项不删，实测有真实 consumer，A）、**裁定 F 真正落到 8 处卡上**并消解 C5 §16/§17 自相矛盾（B）、C8 §18 汇总表换实测值（C）、14 处硬性数字失配（D）、X 计数统一为 51（E）、明确排除表 7→19 行覆盖母材料 15 条拒绝方案（F）、文件头目标态措辞 + C0 oracle 边界 + 导航（G）、`stage-outcome-proofs` 计数 19,937→20,149（H） | 第二份独立上下文异源复核（41 处抽检：27 处吻合、14 处硬性失配） | 受影响承诺面 = C1 删除边界（新增裁定 H）、全部卡的 `npm run check` 验收口径、C8 验收账本、X 计数口径、拒绝方案覆盖判据；确认前状态保持 `draft` |
| v1.3b | 2026-09-11 | **实质变化（需重新确认）**：按**首个真实 wh-review 异源审查**的 2 条 `major` findings 修正 —— C9 卡 8 处同步裁定 G（`C9-FR-6` 撤销，provider 生命周期归 C4）、`C8-AC-1` 改为「C1 清单已产出 + 逐项通过」双条件 | 真实 `build_prd` 审查（broker → `antigravity/flash` 完成；`pi/v4flash` 与 `codex/luna` 失败），material_id `3dbe218a…`，9 分 40 秒，2 条 finding | 受影响承诺面 = C9 的卡内容与职责边界、C8 的验收判据；确认前状态保持 `draft` |
| v1.3 | 2026-09-11 | **追加（需确认）**：用户在 build-prd 阶段追加 **R-014 窄修复包** 与 **R-015 Phase 循环瘦身与 RED/GREEN 证据卫生**，并新增 **裁定 I**（I-1 ~ I-7：已覆盖的不重复登记、只补具名形态；负向边界 = 不新增卡 / 持久对象 / schema / public command、不改 per-stage 审查标准）。落点：**C4**（`C4-FR-14/15/16`、`C4-AC-17/18`、`O-8`、§12 引用）、**C3**（`C3-FR-8` = K2 行的失败签名字段形态、§12 引用）、**C7**（`non_goals` 登记宿主 worktree 增殖 + §6 oracle + §12 引用）；**明确排除表**新增 `E-20`；`需求覆盖` 表扩到 R-015 并标注「build-prd 阶段用户追加」 | 用户本会话追加需求（build-prd 阶段）；实测依据 `docs/standard-workflow.md:18,31,88`（verify-code 用 `dsh-code-review`，对象 = 当前实现）、`runtime/review/stage-materials.json`（两张 lens 表不同）、`runtime/task/workspace.mjs:419,435` 与 `git worktree list` = 14 棵 | 受影响承诺面 = **C4 的 FR / AC / oracle**、**C3 的 K2 行字段表**、**C7 的 `non_goals` 登记**；**未新增卡、未新增持久对象**；确认前状态保持 `draft` |
| v1.4 | 2026-09-11 | **实质变化（需重新确认）**：处置**第二次真实异源审查的 17 条 findings**（blocking 5 / major 10 / minor 2），新增 **裁定 J（J-1 ~ J-10）**把 6 处实现关键选择**从菜单改成路线**，并新增「**异源审查 findings 处置表**」与「**第五轮：第二次真实异源审查**」两节。逐条落点：K2 契约闭合（J-1/J-2 → 共享定义 + C3）、C5 零残留口径按 X47 收窄（`C5-AC-1`/`C5-FR-8`）、`identity/path-cards/**` 删除（J-3 → C3/C5）、`stage-outcome-proofs` 保留为 K5（J-4 → C1/C3/C6/C8）、C4 补 `FR-17/18/19` 与 `AC-15/19/20`、C3 `AC-8` 前移闭合（J-2）、X47 三处对齐（C5 排除 / C6 承接 / X47 同步）、verify-code 执行端补进 C4（§2/§11/§17/`AC-18`）、统一 `STAGE_REFLECTION_REF` 正则（J-8 → C2）、R-013 健康终止契约数值化（C4 §3/`FR-8`/`O-10`/`R-7`）、C9 preflight 语义统一（`FR-5` ↔ `AC-9`）、C7 范围与 checklist 条目归属（`FR-12`/`AC-13`）、C2/C4 补可执行 oracle、C1 测试清单移出 `task-index.test.mjs`、C0 补 M5 第 4/5 项书面定义（J-9）；**编入两条新缺陷 T-11（`request_id` 不含协议版本 → TTL 内无法重跑）/ T-12（708 KB ≈ 11 分钟 → R-014 实证）** | 第二次真实 `build_prd` 异源审查（**2/3 provider 完成**，17 条 findings，全部成立）；本轮实测 `simple-review-runner.mjs:102-115`、`3rd-review/lib/broker.mjs:687-734`、`3rd-review/lib/config.mjs`、`3rd-review/lib/health-runner.mjs:4,61-65`、`runtime/stage/stage-reflect.mjs:29-35,110,356`、`runtime/evidence/write-boundary-preflight.mjs:205-246`、`runtime/task/task-handle.mjs:845,886-893`、`runtime/stage/stage-handlers.mjs:373-374,2400-2403,3336-3340,3855-3870`、`core/task-close.mjs:1712-1713,1717-1720,1803-1804`、`tools/architecture/complexity-report.mjs` | 受影响承诺面 = **C0 的 M5、C1 的测试清单、C2 的 FR-3/AC-2/oracle、C3 的 K2 字段表与 AC-8、C4 的全部 FR/AC/oracle/风险、C5 的 AC-1/AC-5/FR-2/FR-6/§18、C6 的 FR-3/FR-4/FR-11/AC-6/AC-9、C7 的范围与 §18、C8 的 AC-1**；**未新增卡、未新增持久对象、未新增 schema、未新增 public command**；**唯一待用户回答 = 裁定 J-10 的一句话**（`check-extensibility` 是否接受 A「原样保留」）；确认前状态保持 `draft` |

本任务Ⅰ的当前材料：specs/workflowhub-mechanism-simplification-t1-20260911/（口径、范围与验收以该处为准）。
归档维护时：窄小的错字/链接/澄清类**小修**保留依据与影响即可；对方向、权限、范围、设计行为或验收的**实质变化**必须**先展示 before/after 承诺并取得真实确认**，再记录来源 revision、受影响条款/卡片与在途影响。历史决定、确认、审查、测试与物理事实**保持不可变**。
