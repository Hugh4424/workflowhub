# 决策记录 · workflowhub-mechanism-simplification-t2-20260911

## 0. 任务身份

| 项 | 值 |
| --- | --- |
| project | workflowhub |
| task_id | `workflowhub-mechanism-simplification-t2-20260911` |
| stage | make-decision |
| worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-t2-20260911` |
| branch | `task/workflowhub/workflowhub-mechanism-simplification-t2-20260911` |
| baseline_commit | `4330290eba56ba7e1e46c6b33fc59d1d62c20e78` |
| task_path | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t2-20260911` |
| created_at | 2026-09-11 |
| 交付组 | **任务Ⅱ = 批次 ⑨ → ④ → ⑤ → ⑥（卡号 C9 → C4 → C5 → C6）**，一条合并列车 |
| 需求来源（只读参考） | 任务组 PRD `specs/workflowhub-mechanism-simplification-20260910/prd.md`（4,346 行）与母决定 `specs/workflowhub-mechanism-simplification-20260910/decision-log.md`（1,979 行）。两者与 hardening worktree 的副本**逐字节相同**（实测 `diff -q` 无输出） |
| 前序任务 | **当前：已满足**。任务Ⅰ（C0–C3）由 `9f9d0c44` 合入，四材料由 `35a6fb6f` 归档至 `specs/archive/workflowhub-mechanism-simplification-t1-20260911/`；历史阶段状态见 §0.1 修正说明 |
| 并发任务 | `workflowhub-build-prd-workflow-hardening-20260911` 已收口并合入 main（HEAD 的 15 个提交里 3 个来自它） |

### 0.1 Post-Task-I 合并后权威修正（2026-09-11）

> 本节是 Task I 合并后的**新增决定修正**，不是把新决定伪造成旧决定。前文和后文保留的 `4330290e`、任务Ⅰ“未合入”、`record_kind` 待改名、以及旧守卫计数，均只代表当时的历史研究/问答；凡与本节冲突，**以本节为当前权威**。

| 项 | 当前权威事实 / 决定 |
| --- | --- |
| Task I 状态 | Task I（C0–C3）已由 merge commit `9f9d0c44` 合入；`git merge-base --is-ancestor 9f9d0c44 HEAD` 在当前实现输入上成功。四份 Task I 材料随后由 `35a6fb6f` 原样归档到 `specs/archive/workflowhub-mechanism-simplification-t1-20260911/`。当前实现/归档输入为 `35a6fb6f`；前置条件已满足。 |
| K2 冻结合同（用户决定 A） | 接受 Task I 已落地的 discriminator `record_kind`，取值恰为 `stage` 或 `close_action`；同时接受 `review_origin` 五值与 `review_result_ref` 的 frozen 16-key 行合同。**不改名、不迁移、不加兼容机制、不回填历史。** `HANDOFF-T2-006` 以“上游已冻结且用户接受”关闭，旧的改名决定只作历史。 |
| C4 真实剩余量 | K2 字段创建、五值枚举与 D-015 stage-row 发布均已落地，只作 regression seam。C4 剩余是把真实 review facts 合并/传播进既有行与 status/verify 消费面，并删除 `validateReviewBudget` 及实际消费者；不是新建字段。 |
| C5 真实边界（用户决定的含义） | OI-26 A 类明确包含 K2 行身份及 K5 不可变 proof binding 字段；保留 `material_digest` / `snapshot_tree` 等身份、完整性和历史绑定。只删除“材料变化 ⇒ 旧事实失效/重跑”的 freshness/currentness 比较、函数和调用链。材料正常编辑不得使已有有效事实失效或触发重跑；不得因看见 `snapshot_tree` 字面量就删对象。 |
| 已删 predecessor CLI | `tools/cli/validate-current-plan-tasks.mjs` 已由 Task I 物理删除；该 predecessor 项已完成。T2 不得重建、修改、写入、设 gate operand 或登记为新交接。旧 task artifact 只读保留；新执行行只写 `facts.jsonl`，不迁移/回填。 |
| Tier-C schema 删除（用户决定 B，再确认） | 用户在本次合并后修正中再次确认：仍物理删除 `runtime/schemas/quality-verify.v1.json`。这是对 ADR-0030 的 post-merge amendment：同批处理 Runner distribution 目录扫描、实际 registry/inventory 与针对性 distribution tests；归档 specs 是不可变历史引用，**不得重写**。删除证明和 rollback 必须覆盖 schema、consumer、distribution manifest/clean install、`docs/architecture/move-map.json`、`docs/architecture/deletion-plan.json`、`docs/architecture/repository-inventory.tsv` 的恢复。 |
| Close 现状 | `LEGACY_DELIVERY_STEPS`、`UNARCHIVED_PLANNING_STEPS`、`POST_CLEANUP_ARCHIVE_STEPS` 三条 route 与 `recordCloseActionRow` 已由 Task I 落地，必须全部保留；T2 只做剩余 close/status 简化与 regression。`stage-outcome-proofs` 是 K5 证据/历史，不是当前 status authority。 |
| 基线与质量真相 | 旧 `612/35`、`10`、`2` 只保留为 `4330290e` 时点历史测量，不可当 `35a6fb6f` 当前阈值；T0 必须重测并让后续 gate 读取 artifact 变量。Task I 的 implementation/acceptance evidence 已存在，但独立质量事实仍是 `incomplete`，先前审查为 `unavailable`，最终 integration review 为 `not_run`；不得改写成质量通过。 |
| predecessor refs | 任务Ⅰ的 live predecessor 引用统一指向 `specs/archive/workflowhub-mechanism-simplification-t1-20260911/`；归档内容只读，不改字节。 |

**修正后的当前实施基线**：`35a6fb6f0bc0987644cbf903d915eff063879581`。历史 `baseline_commit=4330290e...` 仍保留在 §0 表中，仅表示本任务最初 make-decision 输入，不再是 build-code 当前输入。

## 1. 原始需求（用户原话，未改写）

> 请检查“/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-mechanism-simplification-20260910/prd.md”，我准备开始其中第2个任务了。第一个任务已经完成了设计和计划“/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-simplification-t1-20260911/specs/workflowhub-mechanism-simplification-t1-20260911”，正在研发。
> 我希望现在按标准 WorkflowHub 开始这个第二个任务，先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。注意主会话上下文控制和子代理派发。Talk 和grill请用大白话说明选项、后果和风险；

### 1.1 需求来源分层（本任务与「原始需求」的真实距离）

> 本节的目的：**不许把决定条文当成用户原话**。四张卡要解决的问题源头有两层，必须分清。

| 层 | 来源 | 是否有用户逐字原话 | 本任务怎么用 |
| --- | --- | --- | --- |
| L1 | §1 本会话用户消息 | **有**（逐字引用） | 本任务的直接需求 |
| L2 | 母决定 `## 原始需求`（L8–L24）与用户问答原话 | **部分有**（见下表逐字） | 四张卡要解决的问题源头 |
| L3 | 母决定 D-003 / D-005 / D-009 / D-010 / D-013 / D-015 / D-019 / D-020 / D-021 / D-022 / D-026 / D-029 / D-030 | **无**（经用户确认的决定条文，不是原话） | 方向已定；本阶段只做落地形态，不重开方向 |
| L4 | PRD 卡 `#### C9 / C4 / C5 / C6`（18 字段 + FR/AC/oracle） | 无 | 执行细节与可证伪判据 |

#### L2 逐字原话（母决定行号）

| 原话（逐字） | 行号 | 本任务哪张卡承接 |
| --- | --- | --- |
| 「我觉得这个方案就算实施了，未来也一样会出现很多阻塞和问题」 | L12 | 全体（路线形态本身） |
| 「只有不到50%的token和时间花在任务本身上面，超过50%的token和时间在处理这些流程和机制上面」 | L14 | 全体（净减主线） |
| 「我希望去掉哈希这件事，不要总是去检查哈希，正常改动是正常的流程，不用总是返工、重审」 | L81（Q10） | **C5** |
| 「绿灯有过一次就可以了，后续的测试、审查和verify-code来兜底，不要改一点就变一下」 | L758（Q22） | **C5** |
| 「我不希望通过timeout来停止这种审查，还是要通过3rd-review的健康的检查来自动关闭失败的审查进程，保证workflowhub流程运行的健康和效率，再也不要被这种无止尽的审查浪费时间了」 | L24（R-013） | **C4** |

**L2 缺口（如实登记，不美化）**：母材料里**没有**关于「慢测试 / 900 秒等待 / 同命令重复执行 / 超时丢已完成结果 / 开工前 preflight」的用户逐字原话。这四条的唯一来源是 **D-026②**（母决定基于实测事实作出的决定条文，L1566–1567），实测事实在母材料 L1570 与 OI-024（L692）。**不得把 D-026② 当作用户原话引用。**

### 1.2 可再生原始需求索引

本表只把 §1 与 L2 的既有条目建立导航，不新增产品决定、不改写母材料、不替代原文。

| Source ID | 原始来源 | 当前含义 |
| --- | --- | --- |
| R-001 | §1 原话第 2 句 | 按标准 WorkflowHub 五阶段执行本任务；不跳阶段；不把需求缺口推给 build-spec |
| R-002 | §1 原话第 3 句 | make-decision 内与用户共同梳理六类边界：完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期项 |
| R-003 | §1 原话第 4 句 | 主会话只收摘要，重读量动作派子代理 |
| R-004 | §1 原话第 5 句 | Talk 与 Grill 用大白话说明选项、后果与风险 |
| R-005 | 母决定 L12（用户原话） | 「未来也一样会出现很多阻塞和问题」——路线必须让后续改动趋向净减少 |
| R-006 | 母决定 L14（用户原话） | 「超过50% 花在流程和机制上」——净减主线的来源 |
| R-007 | 母决定 L24（用户原话，PRD 的 R-013） | 审查不靠 timeout 关闭；由 3rd-review 健康检查自动关闭失败审查 |
| R-008 | 母决定 L81 / L758（用户原话） | 去掉哈希失效链；绿灯一次就够，不要改一点就变一下 |
| R-009 | 母决定 D-026②（L1566–1567） | 执行面四条（慢测试切分 / 同命令去重 / 超时保留已完成部分 / 开工前 preflight）编入批次⑨；**不是用户原话** |
| R-010 | 母决定 D-018（L1376–1396，口径句 L1391） | 批次执行序：任务Ⅱ = ⑨（最先）→④→⑤→⑥ |
| R-011 | PRD `## 任务地图`（L106–L117） | 四张卡的结果与 consumer、owner、合并依赖 |
| R-012 | PRD `#### C9` 卡（L845–L1017） | C9：执行面四条 |
| R-013 | PRD `#### C4` 卡（L1018–L1321） | C4：审查解绑 + 降级 + 契约四项 + 通道修复 + 健康终止（R-013/D-030） |
| R-014 | PRD `#### C5` 卡（L1949–L2213） | C5：删哈希失效链，只留写口一次身份核对 |
| R-015 | PRD `#### C6` 卡（L2214–L2642） | C6：status/close 只报根因 + 读取来源收敛为具名 ref + 删质量投影 |
| R-016 | PRD `### 明确排除`（L156–L183） | E-1 ~ E-20：已裁定排除项 |
| R-017 | PRD `### ⚠️ 裁定 F`（L336–L360） | oracle 口径 = 不劣化于 HEAD 基线 + 本卡范围内清零；新增 red 一律判失败 |
| R-018 | PRD `#### 裁定 G / I / J`（L1336–L1491） | 已定裁定：`review_origin` 字段≠对象（G）、R-014/R-015 分派（I）、J-1~J-10 |
| R-019 | 任务Ⅰ 决策记录 §3.5 / §12（`HANDOFF-001` / `HANDOFF-002`） | 任务Ⅰ 明确移交给任务Ⅱ 的两条具名交接项 |
| R-020 | 本会话 Talk 各轮的真实答复 | 见 §5；本任务的**需求权威**（PRD 只当参考） |

## 1.5 需求框架预设（先于研究/Talk 选定）

- **framework**：`functional`（背景 → 问题 → 目标 → 方案 → 验收 → 扩展）。
- **选择理由**：本任务是「把一个已经定好方向的整改路线落成四批可执行开发」——主体是行为/结构改动而非证据研究；母决定已把事实研究做完，本阶段只需在既有节点下回填，并在落地形态上与本会话新发现的事实对账。
- **回填规则**：Talk、调研、审查、Grill 只更新本份 `decision-log.md` 的 OI 表，不新建第二张表、不新建需求账本。混合内容以 `functional` 为外层，在受影响节点下挂 `research` 子树。

六个功能骨架节点：`background` / `problem` / `goal` / `solution` / `acceptance` / `extension`。
六类固定类别：`complete_user_flow` / `page_scope` / `data_state` / `success_failure_boundary` / `non_goals` / `deferred`。

## 2. OI 大纲（唯一当前版本 · 版本 v1 · 研究前建立）

> 身份绑定：本表全部 OI 绑定 `task_id = workflowhub-mechanism-simplification-t2-20260911`、`outline_version = v1`。
> **`outline_version` 已于 Round 3 后由 `v1` 升为 `v1.1`**（新增 OI-25 / OI-26 并改写 OI-24 / OI-14 题面；见 §16 开头）。下表原文保留 `v1` 的表述不改写，**以 §16 的 `v1.1` 为当前权威**；本表共 **24** 条，§16 追加 **2** 条 ⇒ 当前共 **26** 条。
> 状态取值只用四个合法值：`open` / `confirmed` / `deferred` / `not_applicable`。本表在 step 1/2 建立时为**草案态**，Round 2 收敛后回填终态。
> 本表是本阶段唯一权威 OI 清单；Talk 各轮只更新本表，不新建第二张表。
> `requires_user_decision` 语义：该 OI 是否**必须**由用户裁决。由仓库事实或既有已确认决定直接回答的记 `false`。

### 2.0 OI 骨架覆盖表（机器可读契约）

| 骨架节点 / 固定类别 | OI 覆盖 | 覆盖状态 |
| --- | --- | --- |
| `background` | OI-01, OI-02 | covered |
| `problem` | OI-03, OI-04 | covered |
| `goal` | OI-05, OI-06 | covered |
| `solution` | OI-07, OI-08, OI-09, OI-10, OI-11, OI-12, OI-13, OI-14 | covered |
| `acceptance` | OI-15, OI-16 | covered |
| `extension` | OI-17, OI-18 | covered |
| `complete_user_flow` | OI-19 | covered |
| `page_scope` | OI-20 | covered |
| `data_state` | OI-21 | covered |
| `success_failure_boundary` | OI-22 | covered |
| `non_goals` | OI-23 | covered |
| `deferred` | OI-24 | covered |

### 2.1 需求框架节点

| oi_id | category | question（当前未知/待收敛） | source | status | requires_user_decision |
| --- | --- | --- | --- | --- | --- |
| OI-01 | background | 任务Ⅱ 四张卡是否构成一个可独立验收的交付组？各自的原始需求来源分别属于 L1–L4 的哪一层？ | 母决定 L8–L24 + D-018 L1391 + PRD L106–L117 | open | false |
| OI-02 | background | 本任务开工基线 `4330290e` 与 PRD 基线 `216a546d` 之间 15 个提交带来的漂移，哪些让 PRD 的实测前提在 HEAD 上不再成立？ | 本记录 §4 实测 + 漂移分析子代理 | open | false |
| OI-03 | problem | 母材料原始抱怨（900 秒空等 / 同命令重复 / 超时丢已完成部分 / 坏命令未拦 / 审查卡死 / 改一文件绿灯失效 / status 噪音）**逐条**在 T2 HEAD 上是否仍成立？ | §4 实测 + 母决定 L1570 / OI-024 | open | false |
| OI-04 | problem | 基线之后**新增的生产文件**（`current-close-projection.mjs`、`produce-final-current-snapshot.mjs`、`measure-test-runtime-profile.mjs`、`validate-current-plan-tasks.mjs` 等）是否改变「净减」账与 C5/C6 的删除边界？ | §4 实测 | open | **true** |
| OI-05 | goal | 本任务的成功标准用哪一套尺子（卡自身 oracle / T1 的「三条可复算」/ 端到端跑顺）？ | §1 R-002 + PRD 裁定 F + T1 §3.5 | open | **true** |
| OI-06 | goal | 「净减控制面」主线在 **C9 是唯一净增卡（+35~+90 行）** 且基线后新增了 4 个生产文件的事实下怎么记账？ | PRD C9 §18 + D-002 + 母决定 L14 | open | **true** |
| OI-07 | solution | 四批执行序与合并序怎么定（含与未合入的任务Ⅰ 串行、C5/C6 同文件串行）？ | PRD L119–L132 依赖图 + 任务Ⅰ 现状 | open | **true** |
| OI-08 | solution | C9 的三层节奏怎么落：命名（`inner/phase/aggregate` vs 现有 `inner/medium/large`）、时间预算、`aggregate` 只在 CI（`run-checks.mjs` 硬要求 `CI=true`）、`--runtime-profile` 未接进任何 npm 脚本这三点怎么同时成立？ | PRD C9-FR-1 / AC-1~AC-4 + §4 实测 | open | **true** |
| OI-09 | solution | C4 的跨仓交付（3rd-review 仓）用什么形态：算进本任务、另开任务、还是只做本仓消费侧？ | PRD D-030⑤ + C4 §2/§11 | open | **true** |
| OI-10 | solution | C4 的**主机制**（3rd-review 心跳过期判死）尚未实现，而 HEAD 已有一个 20 分钟的有界等待（`DEFAULT_MANAGED_TERMINAL_WAIT_MS = 1_200_000`，代码注释自称「用户决定 option B」）。两者关系怎么定？ | 母决定 D-030①–④ + `simple-review-runner.mjs:19–37,440–471` | open | **true** |
| OI-11 | solution | C5 保留的写口身份核对**恰三项**具体是哪三项，`identity/path-cards/**` 整类删除怎么落（承接任务Ⅰ `HANDOFF-001`）？ | PRD C5-FR-2 / J-3 + 任务Ⅰ §3.5 | open | false |
| OI-12 | solution | C6 的三处新语义怎么定死：status 根因行形状、main 前进后的 `stale` 显示形状（PRD 未定形状）、`risk_close` 与 status 根因行具名 ref 集合逐项全等？ | PRD C6-FR-1/4/6 / AC-13/AC-14 / J-7 | open | **true** |
| OI-13 | solution | T-11（`request_id` 不含协议版本 ⇒ 同材料改协议后在 24h TTL 内无法重跑）怎么处置？ | PRD T-11 登记 + C4 R-10 | open | false |
| OI-14 | solution | 基线后新增的 4 个生产控制面文件归谁处置（本任务 C5/C6、任务Ⅲ C7/C8、还是维持不动）？ | §4 实测 | open | **true** |
| OI-15 | acceptance | 验收基线用哪个 HEAD、判据「不劣化」的确切口径是什么？ | PRD 裁定 F + §4 实测 | open | **true** |
| OI-16 | acceptance | 每一批的**可见结果**与**停止条件**是什么（四批 + 跨仓 + 联调）？ | §1 R-002 + T1 §3.8（T-020 形态） | open | **true** |
| OI-17 | extension | 交接给任务Ⅲ（C7/C8）的具名项有哪些（含本任务产生的口径与遗留）？ | PRD C7/C8 + 任务Ⅰ 先例 | open | false |
| OI-18 | extension | 「零延期」口径怎么落：什么算交接项、什么算延期项，任务Ⅰ 留下的两条 `HANDOFF` 谁接收？ | PRD E-13 + 任务Ⅰ §3.5/§12 | open | **true** |

### 2.2 六类固定类别

| oi_id | category | question | source | status |
| --- | --- | --- | --- | --- |
| OI-19 | complete_user_flow | 谁做、在哪个入口做、看到什么、下一步是什么、失败停在哪 —— 四批 + 跨仓（3rd-review）+ 与任务Ⅰ 的衔接怎么串成一条完整用户流程？ | §1 R-002 + T1 §3.8 | open |
| OI-20 | page_scope | 本任务是否有页面/前端范围？三输入（原始需求 / 项目现状 / 计划改动面）按证据合并的结论是什么？ | make-decision SKILL「UI applicability」+ §4 仓库事实 | open |
| OI-21 | data_state | 本任务涉及哪些记录与字段状态：`facts.jsonl` 的 `record_kind` 两型行、`review_origin` 五态、`quality/verify.json` 删除、status 读取的具名 ref 集合、`material_revision`/`snapshot_tree` 归零？ | PRD 共享定义 K1–K9 + C5/C6 卡 | open |
| OI-22 | success_failure_boundary | 成功/失败/取消/重试/恢复的边界是什么？哪些 `unknown`/`unavailable`/`incomplete` 是诚实缺口而不是失败？哪些动作不可逆、需要人确认？ | §1 R-002 + PRD 术语「诚实缺口」+ C6-AC-8 | open |
| OI-23 | non_goals | 非目标清单（E-1 ~ E-20 + 四张卡的「不做」项）里，哪些在 T2 HEAD 的新事实下需要重述或新增？ | PRD L156–L183 + 各卡 §2 | open |
| OI-24 | deferred | 为什么本任务零延期？任务Ⅰ 移交的两条 `HANDOFF` 在什么条件下关闭？什么情况才允许登记为延期项？ | PRD E-13 + 任务Ⅰ §3.5 + 母决定 L277 | open |

### 2.3 需求到决策覆盖矩阵（六行 = 原始需求五维 + 方案细节边界）

| 维度 | 原始需求 | 承载 OI | 当前处置 |
| --- | --- | --- | --- |
| 业务目标 | R-005「未来还会阻塞」/ R-006「>50% 花在机制上」 | OI-05, OI-06 | 待 Talk 收敛 |
| 流程/入口面 | R-007 审查不靠 timeout / R-009 执行面四条 | OI-03, OI-07, OI-08, OI-09, OI-10, OI-19 | 待 Talk 收敛 |
| 数据/状态 | R-008 去哈希 / 绿灯不失效 / R-015 status 收口 | OI-11, OI-12, OI-21 | 待 Talk 收敛 |
| 成功/失败/验收 | R-017 裁定 F 口径 / 各卡 oracle | OI-15, OI-16, OI-22 | 待 Talk 收敛 |
| 约束/非目标/延期 | R-016 E-1~E-20 / 零延期 | OI-18, OI-23, OI-24 | 待 Talk 收敛 |
| 方案细节边界 | R-010 批次执行序 / R-011 地图依赖 | OI-01, OI-02, OI-04, OI-13, OI-14, OI-17 | 待 Talk 收敛 |

### 2.4 OI 终态（Round 2 收敛后回填 · **已被 §16.21 的 v1.1 权威表取代，只读保留**）

> ⚠️ **本节是 `outline_version = v1` 的历史版本，只读保留。** 当前权威 = **§16.21 第 2 条的 v1.1 表（26 条，四字段齐备）**；下文表格保留原文以便追溯，**不得作为当前 OI 权威引用**。
> 终态字段：`status` / `selected_disposition` / `requires_user_decision` / 依据。Round 2 收敛后**无 `open` 残留**。
> 状态取值只用 `open` / `confirmed` / `deferred` / `not_applicable` 四个；本表全部为 `confirmed`。

| oi_id | status | selected_disposition | requires_user_decision | 依据 |
| --- | --- | --- | --- | --- |
| OI-01 | confirmed | 四张卡构成一个可独立验收的交付组 —— **「一条合并列车」仅指本仓**；跨仓部分**不在**本任务合并列车内（§16.2 / FND-T-14 / R4-Q3）。需求来源按 §1.1 四层分离登记，**不把决定条文当用户原话** | false | §1.1 + 母决定 L1391 + §16.2 |
| OI-02 | confirmed | 15 个提交的漂移已逐项实测；**PRD 有三处前提在本任务基线失效**（C4 有界等待、C4 stalled 映射、4 处引用路径写错） | false | §4.2 / §4.3 |
| OI-03 | confirmed | 逐条：开工前预检**仍是空实现**（成立）；审查卡死成立但形态已变（已有 20 分钟有界等待、缺健康判死）；哈希失效链仍在（生产 993 处命中）；绿灯失效仍在；status 噪音仍在。「同一命令启动 8 次」**无一手记录 → `unknown`** | false | §4.3 |
| OI-04 | confirmed | 4 个新增生产文件按 T-006 逐项定归属；**新增控制面这件事本身进任务级非目标**（T-014） | **true** | T-006 / T-014 |
| OI-05 | confirmed | **以四张卡各自的判据为准**（含失败判据与可执行 oracle），四批都过之后再用任务级三条总账核对一次 | **true** | T-001 |
| OI-06 | confirmed | 接受 C9 净增（含 T-010 改名带来的额外行数）；在任务级账上**单列**并写明由 C1/C2/C5/C6 的净减吸收；**不为凑数字删任何东西** | **true** | T-001 / T-006 / T-010 / T-014 |
| OI-07 | confirmed | 执行序 C9 → C4 → C5 → C6；**合并严格排在任务Ⅰ（C0–C3）合入之后**；C5 先合、C6 后合；C9 先于 C6 合 | **true** | T-008 + §4.6 |
| OI-08 | confirmed | **把仓库里的 `medium`/`large` 改名成 `phase`/`aggregate` 一次性改到底**（含权限语义 `phase↔local_ci` / `aggregate↔ci_only`、错误文案、ADR 0027），排为 **C9 的第一步**；`aggregate` 只在 CI 跑且**契约上限保持 `null`**（900,000 ms 只是 supervisor 兜底，不得升格为契约值）。**并吸收三条硬前置（FND-T-09 / §16.3）**：① 每个档位点名真实 consumer；② 必须新增独立的 npm script 命令入口（不改现有脚本语义）；③ 入口未落地前该部分**不得声明完成** —— 三条不满足即**按死代码处理、不得交付** | **true** | T-005 + T-010 + §16.3 + §16.8 |
| OI-09 | confirmed | **本任务同时交付两个仓库**：本仓做消费侧，3rd-review 侧在它自己的 main 上单独提交并跑它自己的测试；本任务验收只覆盖「调用侧接对了」，判死逻辑标 `unknown` | **true** | T-007 |
| OI-10 | confirmed | **补齐 3rd-review 的健康判死当主机制**（心跳过期判死 + `PROCESS_STALLED` 接成终态）；20 分钟有界等待**保留但显式标注为兜底**，不得成为主机制 | **true** | T-003 + §4.5 |
| OI-11 | confirmed | 写口唯一核对**恰三项** = `task_id` + 工作区路径 + 待写字节；`identity/path-cards/**` 整类删除（接任务Ⅰ `HANDOFF-001`）；**C5 的检查清单补进 `produce-final-current-snapshot.mjs` 与 `validate-current-plan-tasks.mjs`** | false | T-006 + PRD 裁定 J-3 |
| OI-12 | confirmed | 主线前进只报 `stale`，作 **status 根因行里的一条普通条目**（带具体来源，不新增字段）；canonical ref 闭集**恰 6 类**（裁定 J-7.1）；收口校验用「与根因行登记的具名 ref 集合逐项全等」（裁定 J-7.2） | **true** | T-009 + PRD 裁定 J-7 |
| OI-13 | confirmed | **修**：把协议版本加进审查请求身份（本地计算，不动公开信封字段集），并**实跑验证一次** | **true** | T-011 |
| OI-14 | confirmed | ① `current-close-projection.mjs` → **C6**；② `produce-final-current-snapshot.mjs` + `validate-current-plan-tasks.mjs` → **补进 C5 清单**；③ `measure-test-runtime-profile.mjs` → **C9 先评估能否复用** | **true** | T-006 |
| OI-15 | confirmed | 基线 = 本任务开工实测（markdownlint **612** error / 35 文件、路径守卫 **10** FAIL、结构守卫 **2** FAIL）；判据 = **不劣化于该基线 + 本任务范围内清零**；新增 red 一律判失败 | **true** | T-001 + 裁定 F + §4.2 |
| OI-16 | confirmed | 四批各自一个可见结果 + 一个停止条件；**每批做完立刻跑本批判据**，不推迟到最后；**动第二个仓库之前加一次人工确认点** | **true** | T-004 + T-012 |
| OI-17 | confirmed | 交接项按「具名 + owner + 触发条件 + 关闭条件」逐条列出，**不写成延期** | **true** | T-013 |
| OI-18 | confirmed | **零延期**；任务Ⅰ 移交的两条 `HANDOFF` 由本任务接收（见 §3.5 交接表） | **true** | T-013 + 任务Ⅰ §3.5 |
| OI-19 | confirmed | 完整用户流程 = 任务Ⅰ 形态（逐批可见结果 + 停止条件）+ **一个跨仓人工确认点**；详见 §3.8 | **true** | T-012 |
| OI-20 | confirmed | **`non_ui`**（三输入按证据合并；唯一「人看的输出」是命令行文本，不是页面或视觉规格） | false | 见 `## UI applicability` |
| OI-21 | confirmed | `facts.jsonl` 的两型行（`stage` / `close_action`）与 `review_origin` 五态**由上游定稿、本任务只引用**；`identity/path-cards/**` 删除；`quality/verify.json` 与 product-release 投影收掉；status/close 读取来源收敛为 6 类具名 ref | false | PRD 裁定 J-1 / J-2 / J-3 / J-7 |
| OI-22 | confirmed | 做不完**停在那批**、如实记「没做完 + 卡在哪」、后面批次不开工；`unknown`/`unavailable`/`incomplete` 是事实不是失败；不可逆动作（真实 close、动第二个仓库）须人确认 | **true** | T-004 + T-012 |
| OI-23 | confirmed | E-1 ~ E-20 原样沿用；**新增一条任务级非目标：整改期间不得「净」新增控制面**，确有必要的必须当场写明 consumer / owner / 删除条件（宪法级条款仍归任务Ⅲ C7） | **true** | T-014 |
| OI-24 | confirmed | 零延期；只有「跨任务、有具名 owner 与关闭条件」的才算交接项，其余必须在本任务内解决或如实标 `unknown` | **true** | T-013 |

## 3. 范围三角（step 2 triage-scope）与不确定性

> 本节在 Round 1 之前建立**草案态**；Round 2 收敛后由 §5.x 的正式范围取代。

### 3.1 范围内（草案）

任务Ⅱ = 四张卡的串行落地，一条合并列车：**C9（执行面四条）→ C4（审查生命周期与通道）→ C5（删哈希失效链）→ C6（status/close 收口）**。

### 3.2 明确的不确定性（草案 → 由 Talk 各轮收敛）

| # | 不确定性 | 为什么它改变方向 | 关到哪个 OI |
| --- | --- | --- | --- |
| U-1 | 验收尺子用哪一套（卡自身 oracle / 任务Ⅰ 的「三条可复算」/ 端到端跑顺） | 决定「做完了」怎么判 | OI-05 / OI-15 |
| U-2 | C9 是唯一净增卡（+35~+90 行），而整改主线是净减 | 决定净减账怎么记、要不要为凑数删东西 | OI-06 |
| U-3 | C9 三层命名与接线：仓库只有 `inner/medium/large`，`large` 硬要求 `CI=true`，`--runtime-profile` 未接进任何 npm 脚本 | 决定 C9 是「接上现有档位」还是「改名/改脚本语义」 | OI-08 |
| U-4 | C4 跨仓交付（3rd-review 仓）用什么形态 | 决定本任务边界与验收能否闭合 | OI-09 |
| U-5 | C4 主机制（3rd-review 心跳过期判死）**未实现**，而 HEAD 已有一个 20 分钟有界等待且代码注释自称「用户决定 option B」 | 决定「不靠 timeout 关闭审查」是否成立 | OI-10 |
| U-6 | 基线后新增 4 个生产文件，其中 `current-close-projection.mjs` 是 status/close 的**活生产 reader** 且 inventory 判 retain，而 C6 要收掉 product-release 投影 | 直接冲突：按 C6 做会打断活 reader | OI-04 / OI-12 / OI-14 |
| U-7 | 任务Ⅰ（C0–C3）**未合入 main**，而 C9/C5/C6 的合并依赖是「C3 合入」 | 决定开工/合并时序与冲突面 | OI-07 |
| U-8 | C6 的 `stale` 显示形状 PRD 未定；`non_stage` 收口口径已由裁定 J-2 前移到 C3 | 决定本阶段要不要给出形状 | OI-12 |

### 3.3 非目标（草案）

E-1 ~ E-20 原样沿用（PRD L160–L183），另加四张卡各自的「不做」项（见 OI-23）。

### 3.4 延期项（草案）

**零延期**（PRD E-13 + 母决定 L277）。任务Ⅰ 移交的两条 `HANDOFF` 在本任务内接收或明确关闭条件，不转成延期项。见 OI-18 / OI-24。

### 3.5 收敛后的正式范围、非目标、延期与交接（Round 2 终态）

#### 正式范围（四个批次必须做，串行不可跳；顺序 = 执行序 = 合并序）

1. **C9 · 执行面四条**（任务Ⅱ 首发）
   - **第 0 步（T-010 追加）：档位改名**。把 `TEST_RUNTIME_PROFILE_NAMES` 的 `medium`/`large` 改为 `phase`/`aggregate`，**一次性改到底**：常量值、6 个引用文件、4 个测试、`docs/adr/0027-test-feedback-runtime-profile.md` 的表述，以及 `phase ↔ local_ci` / `aggregate ↔ ci_only` 这层权限校验（`stage-content-contracts.mjs:152/:158-159/:161/:164/:178/:184-186`）与错误文案（`:152`）。**这一步是 C9 里冲突面最大的动作**，必须先做完再动其余三条。
   - ① 慢测试分档 + 每档时间预算：`inner` 60,000 ms、`phase` 300,000 ms（契约上限）；`aggregate` **契约上限为 `null`**（无上限），只在 CI 跑，900,000 ms 是 `run-checks.mjs:118` 的 **supervisor 运行兜底、不是契约预算**（该处注释原文：「keep its existing CI-only supervisor timeout as an operational guard, not as a new profile value」）。
   - ② 同命令去重：复用现有「已完成 receipt 复用」判定（`canonical-receipt-writer.mjs:299` + `command_hash` `:340/:776`），**不新增锁对象**（裁定 J-6 选项 b）。
   - ③ 超时保留已完成部分：已完成结果必须可读回。
   - ④ 开工前 preflight：校验命令与路径存在性、provider/host 能力、packet 体积，5 秒内返回具体原因；**三条同时成立**（不合格不启动该次子进程 / 如实返回 `protocol_invalid` + 非空 `diagnostics` / **不新增任何门禁**）。
   - **附加动作（T-006）**：先评估 `tools/cli/measure-test-runtime-profile.mjs`（786 行）能否复用；能复用则复用，不能复用则登记为「已知重复」并列进交接项。

2. **C4 · 审查生命周期与通道**
   - **主机制（T-003）**：补齐 3rd-review 侧的**心跳过期判死**（`managedStatus` 从「owner 已死」扩展为「owner 已死 **或** 心跳过期」，复用现有 `SESSION_MANAGER_LOST`，协议零变更），并把 `PROCESS_STALLED` 接成终态；有 probe 的 provider 走更细信号作增强。
   - **兜底（T-003）**：已有的 20 分钟有界等待**保留**，但必须在代码注释与材料里**显式标注为兜底**，且**不得成为主机制**（`DEFAULT_MANAGED_TERMINAL_WAIT_MS` 的取值与语义一并写清）。
   - **终态映射（R4-Q2 = A，写死）**：v3 的合法 outcome 只有 `{completed, partial, unavailable, cancelled}`，**没有 `stalled`**。因此 3rd-review 侧判死产生终态时**必须使用现有合法 outcome**（`SESSION_MANAGER_LOST` 失败组，或 `unavailable`）；**`stalled` 只作 wh-review 侧的归类标签**（`review-result.mjs` 已有的 stalled 类），**不要求 v3 新增 outcome、不改公开信封字段集**。心跳过期与 `PROCESS_STALLED` 的**具体阈值仍留给跨仓实现定**（OPEN-001）。
   - **本仓消费侧**：`review_origin` 五态（引用裁定 J-1 的 `dispatched_uncollected`）、`dispatch_state` 提到聚合面、packet 组装补 `skills/` lens、异源按底层模型判定、删轮次预算（**先落 `review_result_ref` 替代物再删**）、删「追 findings 清零」、小修不复审、方向审查可用表面（OPN-1/OPN-5）、verify-code 执行端复用落点。
   - **T-011 修复（T-011=A）**：把协议版本加进审查请求身份（本地计算，不动公开信封字段集），并**实跑验证一次**。
   - **跨仓（T-007）**：3rd-review 侧在本任务的**一次人工确认之后**、于它自己的 main 上单独提交并跑它自己的测试；本任务验收只覆盖调用侧映射，判死逻辑标 `unknown`。

3. **C5 · 删哈希失效链**
   - 删材料整体哈希 / snapshot tree / currentness 重算 / 事实级 freshness 及其派生失效链。**9 个标识符的字面量（可复算口径，见 §16.21 第 9 条）**：`material_revision`、`materialRevision`、`snapshot_tree`、`snapshotTree`、`evaluateFactFreshness`、`isStageSnapshotCurrent`、`materialRevisionFromValues`、`stageMaterialScopeRevision`、`isMaterialOnlySnapshotDelta`；**概念性删除项**（非符号）：`currentness`。声明面：6 个 `workflows/*/skill-deps.yaml` 的 47 处、`stage-skill-deps.schema.json:27`、`check-skill-closure.mjs:154/:290`。
   - 写口**只保留一次身份核对，恰三项**：`task_id` + 工作区路径 + 待写字节。第三项**真实现**（不是保留现成的）：在真正的写入点比对「**即将写入的字节**」与「**已认证来源的字节**」，不符即 fail-loud（见 §16.11 与 §16.21 第 10 条）。**旧的 `path card source hash is stale` 随 path-cards 一起删除**，材料不再声称保留它。
   - `identity/path-cards/**` **整类删除**（接任务Ⅰ `HANDOFF-001`）。
   - **检查清单补两个文件（T-006）**：`tools/cli/produce-final-current-snapshot.mjs`（`material_revision` ×4、`snapshot_tree` ×4、`quality/verify.json` ×1）与 `tools/cli/validate-current-plan-tasks.mjs`（各 ×1）。
   - `core/task-close.mjs` 的 planning 分支**显式排除**（X47 归 C6），只登记不删。

4. **C6 · status / close 收口**
   - `status`/`close` 只报根因：删 `deriveStatusGroups` 的四个派生投影与 `quality/verify.json` 及 product-release 投影连对象。
   - **处置 `current-close-projection.mjs`（T-006）**：它是 status/close 的**活生产 reader** 且被治理登记表标为 `retain`；C6 收掉 product-release 投影时**必须同批处理它**，不得只改一半留下读一个已删域的活 reader。
   - 读取来源收敛为**恰 6 类具名 ref**（裁定 J-7.1），禁止用 `readdir` 扫目录决定读取内容。
   - **主线上前进只报 `stale`**（T-009）：作 status 根因行里的一条**普通条目**，带具体来源（例如「主线已从 X 前进到 Y」），**不新增 status 字段、不新增投影**。
   - 收口校验用**等值判据**（裁定 J-7.2）：`risk_close` 的 `quality_reasons` 去重排序后须与 status 根因行登记的具名 ref 集合**逐项全等**；空集仍抛、不等仍抛。
   - 承接 X47；落**母决定的** D-024①/②、D-025①/②、D-011②（**注意：这四个编号是任务组母材料的编号，不是本记录 §9 的 D-001~D-024**）；**先补母决定 D-015③ 的三步链路验收再动 status/close**。
   - **`current-close-projection.mjs` 的终局处置（R4-Q4 = A）**：由 **C6 改写它** —— 把 `product_release` 从 `CURRENT_STATUS_DOMAINS` 的五个状态域中移除，该域改为按**新的具名 ref 读取路径**取事实；**文件保留**（它仍是 `task-close.mjs` 的活 reader），**不删**。

#### 正式验收口径（T-001 + 裁定 F）

- **主尺子**：四张卡各自的 FR/AC/oracle（含失败判据与可执行命令）逐条跑。
- **任务级核对**：四批都过之后，用三条总账核对一次 —— ① `git diff --shortstat <baseline>..<delivery>` 的净行数；② 每个任务的记录文件数（`find <store>/<task> -type f | wc -l`）；③ 无 reader 对象数（consumer 扫描）。
- **基线**：本任务开工实测 —— markdownlint **612** error / **35** 个出错文件、`check-task-record-paths.mjs` **10** FAIL、`verify-structure.mjs` **2** FAIL。判据 = **不劣化于该基线 + 本任务范围内清零**；任一计数上升即判不通过。markdownlint 一律用仓库锁定工具链 `./node_modules/.bin/markdownlint-cli2`（v0.14.0 / markdownlint 0.35.0），**不得用 `npx`**。
- **范围**：只跑受影响针对性测试；**禁止无范围全量 `vitest` / `npm test` / `test:safe` / `npm run check`**（全链由任务Ⅲ C8 末次跑一次记退出码，判据 = 不劣化）。
- **每批做完立刻跑本批判据并留证据**，不把验证推迟到四批之后（否则后续改动会掩盖前面的回归）。
- **净减账**：允许 `unknown`，但必须写「为何算不出 + 下次可算的触发条件」；C9 的正行数**单列**并写明由 C1/C2/C5/C6 的净减吸收。

#### 非目标（E-1 ~ E-20 原样沿用，逐条见 PRD L160–L183；另加任务级约束）

- **T-014 新增任务级非目标**：整改期间**不得「净」新增控制面**（新对象 / 新 public command / 新 schema / 新持久化字段）。确有必要的，必须**当场**写明唯一 consumer、owner、替代关系与删除条件；**宪法级负向条款仍归任务Ⅲ C7**，本任务不自行新增宪法条文。
- **E-16「本任务不实现任何删除」的适用范围收窄（FND-T-05）**：该条约束的是**写 PRD 的那个任务**（母决定 D-019），**对执行任务不适用** —— 任务Ⅱ 是执行任务，删除正是它的工作（§3.7 原有说明升格为本条显式边界）。
- 不新增第五份材料 / public command / 持久化对象 / 状态机；不改 wh-review 的 per-stage 审查标准与 prompt；不改历史 store 与已落盘 provenance 字节；不迁移历史任务、不做兼容桥、不建双写；不改 `workflows/verify-code/**`；不扩 `STAGES` 枚举；不新增 `close --preflight-only`；**不新增任何「防 stale」机制**（修 finding 不得让审查结果过期）；**不为凑净减数字删任何东西**。

#### 延期与交接

- **零延期**（PRD E-13 + 母决定 L277）。本任务不产出任何延期项。
- **接收任务Ⅰ 移交的两条具名交接项**：

| 来源 | ID | 内容 | 本任务归属与关闭条件 |
| --- | --- | --- | --- |
| 任务Ⅰ §3.5 | `HANDOFF-001` | `identity/path-cards/**` 整类删除（任务Ⅰ 只登记不执行） | **C5**；关闭条件 = 生产代码零命中且 `createPathCardRecord` / `PATH_CARD_WRITERS` 已删，而字节比对强度不变 |
| 任务Ⅰ §3.5 | `HANDOFF-002` | 跨仓审查通道缺陷 T-11（`request_id` 不含协议版本）与 `ATTACHMENT_DELIVERY_UNSUPPORTED` | **C4**；T-11 部分按 T-011 修复并实跑验证后关闭；`ATTACHMENT_DELIVERY_UNSUPPORTED` 的 managed 路径已由基线提交改善，剩余部分随跨仓项标 `unknown` |
| 任务Ⅰ §3.5 | `HANDOFF-003` | 宿主每会话 / 每 phase 自建 worktree 的增殖 | **不在本仓范围内**（宿主行为）；本任务只保证不新增机制去对抗它 |

- **本任务产生的交接项**（T-013，按「具名 + owner + 关闭条件」列出，不写成延期）：

| ID | 内容 | owner | 触发条件 | 消费者 | 关闭条件 |
| --- | --- | --- | --- | --- | --- |
| `HANDOFF-T2-001` | 档位改名（`medium/large → phase/aggregate`）带来的 `docs/adr/0027-test-feedback-runtime-profile.md` 与治理文本表述同步 | 任务Ⅲ C7 | C9 合入 | 治理文档读者 | ADR 与治理文本不再使用旧档位名 |
| `HANDOFF-T2-002` | 新行为需进治理文本：审查的**主机制=健康判死、20 分钟=兜底**；`review_origin` 五态（含 `dispatched_uncollected`） | 任务Ⅲ C7 | C4 合入 | 治理文档读者、后续任务 | 治理文本写清两者关系，且不再出现「沉默不杀进程」式旧表述 |
| `HANDOFF-T2-003` | 跨仓（3rd-review）交付项本仓不可闭合的事实与它的验收判据 | 任务Ⅲ C8 | C4 合入 | 验收者、后续任务 | 3rd-review 侧有自己的测试证明判死，或如实标 `unknown` |
| `HANDOFF-T2-004` | 任务Ⅰ 列为 Tier B 的 4 个「零生产引用、仅测试引用」工具（含 `validate-current-plan-tasks.mjs`、`measure-test-runtime-profile.mjs` 等）的最终归属 | 任务Ⅲ C7/C8 | 任务Ⅰ C1 合入 | 后续治理 | 每个文件有唯一处置（删 / 留 + consumer 登记） |
| `HANDOFF-T2-006` | **已关闭（post-merge superseded/accepted）**：Task I 已冻结 `record_kind` 为 `stage` 或 `close_action`，用户现明确接受；旧改名提案保留为历史问答 | 无后续 owner | `9f9d0c44` 合入并在 `35a6fb6f` 输入复核 | 无（closed） | 不改名、不迁移、不兼容、不回填；本任务只做 regression |
| `HANDOFF-T2-007` | `CONTEXT.md` 的「阶段完成判据」一句改写为新判据输入 | 任务Ⅲ C7（复核）；任务Ⅱ C5 执行改写 | C5 合入 | 治理文档读者、后续任务 | `CONTEXT.md` 该句不再引用 `material revision` / `snapshot` |
| `HANDOFF-T2-005` | 本任务新增/保留的 `unknown` 项（§4.7 的 U-a ~ U-h）中仍未关闭的部分 | 任务Ⅲ C8 | 本任务合入 | 验收者 | 每项被关闭或继续如实标 `unknown` |

**页面范围**：`non_ui`（见 `## UI applicability`）。本任务唯一「人看的输出」是命令行文本行（status/close 的根因行），不是页面、交互稿或视觉规格。

### 3.6 命名唯一定义（本任务材料内的权威源）

| 命名 | 唯一定义值 | 唯一定义源 | 本阶段权限 |
| --- | --- | --- | --- |
| 测试档位名 | `inner`（契约上限 60,000 ms）/ `phase`（契约上限 300,000 ms，本地或 CI）/ `aggregate`（**契约上限 `null`，即无上限**；只在 CI 跑；900,000 ms 是 supervisor 兜底而非契约值） | **本任务 §3.5 C9 条 + `stage-content-contracts.mjs:57-62`（改名后）** | 本阶段定；build-spec 只能细化键名，**不得改取值集合** |
| `review_origin` 五态 | `conducted` / `unavailable` / `not_run` / `same_source_degraded` / `dispatched_uncollected` | PRD 共享定义「术语 · 审查五态」+ 裁定 J-1 | **上游已定稿**，本任务只引用 |
| `facts.jsonl` 行型 | `record_kind` 为 `stage` 或 `close_action` | Task I merge/archive + current implementation + post-merge 用户决定 | **字段名和取值均冻结**；不改名、不迁移、不兼容、不回填 |
| status/close 读取来源 | 恰 6 类具名 ref（K1 `task.json` / K2 `facts.jsonl` / K3 四份材料 / K4 confirmations+authorizations / K5 被点名的原始证据 / 四份材料与 HEAD 的具名 diff 输入） | PRD 裁定 J-7.1 + C6-FR-3 | **上游已定稿**，本任务只引用 |
| `facts.jsonl` 行型判别字段的**当前名字** | **`record_kind`**；取值恰为 `stage` / `close_action` | Task I archived spec + merge `9f9d0c44` + `runtime/task/task-store.mjs` frozen contract；用户 post-merge 接受 | 不改名、不迁移、不兼容、不回填；T2 只保护 exact 16-key row 与 reader/writer regression |
| 兜底等待常量 | `DEFAULT_MANAGED_TERMINAL_WAIT_MS = 1_200_000`，语义 = **兜底（非主机制）** | 本任务 §3.5 C4 条 + `simple-review-runner.mjs:37`（注释同步改写） | 本阶段定语义；build-spec 写死文案 |

### 3.7 任务组 PRD 卡与本任务决策的逐条对账

> 目的：防止「PRD 只当参考」在实现期变成事实权威；同时把本任务**有意偏离**的地方显式登记。

| PRD 条目 | PRD 要求 | 本任务决策 | 关系 |
| --- | --- | --- | --- |
| C9-FR-1 / AC-1 | 三层节奏 = `inner`/`phase`/`aggregate`，且层名要与 `TEST_RUNTIME_PROFILE_NAMES` 对应 | T-005+T-010：**把仓库常量改名成 `phase`/`aggregate`**（含权限语义与 ADR） | **超集**（PRD 未要求改权限语义与 ADR；本任务为消除「材料名≠代码名」而做，已登记 RISK-001） |
| C9 §18 | 本卡净增 +35~+90 行，是唯一允许净增的卡 | 沿用；**改名会再加行数**，一并单列并注明由其他批次净减吸收 | **细化** |
| C9 受影响测试 | 3 个针对性测试 | 沿用，**再加 4 个被改名波及的测试** | **超集**（改名连带） |
| C4-FR-10② | `DEFAULT_MANAGED_TERMINAL_WAIT_MS = null` 语义改写为「等健康裁决」 | T-003：**不回到 `null`**；保留 20 分钟并显式标为兜底，同时补齐健康判死当主机制 | **偏离**（PRD 的前提在 HEAD 已被推翻；已登记 RISK-002） |
| C4-FR-10① | `stalled` 接下游映射 | **基线后已完成**（`review-result.mjs:151-152`），本任务只验收并补 `stalled` 在 v3 终态侧的缺口 | **已被 HEAD 满足** |
| C4 跨仓 | D-030⑤：跨仓交付项必须登记接收方、接口契约与验收判据 | T-007：本任务同时交付两仓；跨仓部分标 `unknown` | 一致（细化） |
| C4-AC-3 / C5 / C7 的 `npm run check` | 不劣化于 HEAD 基线 + 本卡范围内清零 | post-merge 修正：T0 在 `35a6fb6f` 重测并写 task-store artifact，后续 gate 读变量；旧 612/10/2 仅历史 | 一致（动态重测） |
| C5-FR-1 删除检查 | 删除 freshness/currentness invalidation、保留身份/proof binding | post-merge 修正：用 behavioral/symbol/use-site checks；`validate-current-plan-tasks.mjs` 已删，只验证 absence 与其遗留 artifact consumer 收口，不重建 | **用户新决定 supersedes 旧全局零字面 oracle** |
| C6-FR-3 / AC-13 | 收掉 product-release 投影 | T-006：**同批处置 `current-close-projection.mjs`**（活生产 reader + 治理登记为 retain） | **超集**（PRD 未登记该文件） |
| C6-FR-6 / AC-11 | main 前进只报 `stale`，不冻 base OID | T-009：**作根因行里的一条普通条目**（PRD 未定形状） | **细化** |
| C4 R-10 / T-11 | 不为 T-11 造机制（会撞 `PROTOCOL_INCOMPATIBLE`） | T-011：**修**（本地请求身份加协议版本），并实跑验证 | **偏离**（PRD 的理由经实测不成立：请求身份与公开信封字段集不是一回事；已登记 RISK-004） |
| E-13 零延期 | 不产出延期项 | 沿用；新增 5 条具名交接项（§3.5） | 一致 |
| E-16「本任务不实现任何删除」 | 约束写 PRD 的那个任务 | 任务Ⅱ 是**执行任务**，删除正是它的工作 | 范围说明 |
| 裁定 J-5 / J-10 | `check-extensibility.mjs` 原样保留（用户已答「接受 A」） | 沿用；C7 承担表述责任 | 一致 |

### 3.8 完整用户流程、数据状态与失败语义（T-012 定稿）

#### 逐批用户流程（每批一个可见结果 + 一个停止条件 + 不新增日常确认点）

| 批次 | 谁做 | 入口 | 用户可见结果 | 下一步 | 失败停在哪 |
| --- | --- | --- | --- | --- | --- |
| **C9** 执行面四条 | 本任务主会话 | `tools/cli/{run-checks,stage-runtime,measure-test-runtime-profile}.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`stage-content-contracts.mjs` | ① 改名后的档位表（含权限语义与 ADR 同步）；② `preflight` 三类非法输入的真实 `diagnostics`；③ 同命令第二次返回复用且未启动子进程；④ 超时后已完成部分可读回 | 进入 C4 | `preflight` 仍返空 diagnostics；或拆分后总启动次数变多；或 `phase`/`aggregate` 与权限校验不一致 → 停在 C9 |
| **C4** 审查生命周期 | 本任务主会话（**跨仓前需一次人工确认**） | `skills/wh-review/scripts/*`、`runtime/review/review-record-route.mjs`、`runtime/evidence/stage-content-evidence.mjs`、3rd-review 仓 | ① 请求身份含协议版本且实跑通过；② 5 态在 status 可见；③ 故意空转的审查由**健康裁决**进终态（不是外层 timeout）；④ packet 含 `skills/` lens | 进入 C5 | 仍需要外层 timeout 才能结束；或 provider 被调用两次审同一批 finding；或 `managedPublic` 字段集被改 → 停在 C4 |
| **C5** 删哈希失效链 | 本任务主会话 | `runtime/evidence/{write-boundary-preflight,freshness}.mjs`、`runtime/task/task-handle.mjs`、6 个 `workflows/*/skill-deps.yaml`、`check-skill-closure.mjs` | ① 9 个标识符在**补全后的清单**上生产侧命中 0；② 写口恰三项；③ `identity/path-cards/**` 零生产命中；④ 改一个已审文件后**既有事实不失效、不自动重跑** | 进入 C6 | 清单外仍有命中（假绿）；或第三项字节比对被弱化；或守卫 `check-skill-closure` 退出码非 0 → 停在 C5 |
| **C6** status/close 收口 | 本任务主会话 | `tools/cli/stage-runtime.mjs`、`runtime/stage/completion-predicates.mjs`、`core/task-close.mjs`、`runtime/stage/current-close-projection.mjs` | ① `status` 只剩根因行 + 6 类具名 ref；② `verify.json` 与 product-release 投影对象不存在；③ 主线前进只多一行 `stale`；④ D-015③ 三步链路验收（写完 → status 立即可读 → 重放不重复） | 四批完成，交任务Ⅲ | 四投影仍有 reader；或收口校验被放宽成「非空即可」；或 D-015③ 任一步需要先重建投影 → 停在 C6 |

**跨仓人工确认点（T-012）与「被拒」出口（R4-Q3 = A，写死）**：在 C4 动 3rd-review 仓**之前**，主会话必须停下来向用户展示「要改哪个文件、改成什么、怎么验收、失败怎么办」，收到真实答复后才动手。这是本任务**唯一**新增的确认点；其余批次之间不加确认点。**若该确认被拒或无响应**：C4 **只交付本仓消费侧**（停滞映射、等待语义、文档修正），跨仓部分标 `unknown`，**任务不因此停批** —— 因为本批的**本仓判据此时已全部通过**。同时写死：「`unknown` ≠ 完成」这条**只适用于 R-013 的跨仓部分**，**不适用于本批的本仓判据**。

**与任务Ⅰ 的衔接（T-008）**：本任务现在开工做决策与实现；**合并严格排在任务Ⅰ（C0–C3）合入之后**；期间两边不并行改同一批文件。若任务Ⅰ 长期未合入，本任务按 T-004 停在当前批，不自行合并。

#### 数据状态与失败语义

| 状态 | 含义 | 是否等于完成 |
| --- | --- | --- |
| `completed` | 本批判据全部实测通过 | 是 |
| `unavailable` | 环境/通道不可得（例如无宿主 bridge 时的正式 stage outcome、跨仓测试跑不了） | **否**，且不阻断同 task 修复 |
| `incomplete` | 判据未跑齐或存在未处置缺口 | **否** |
| `partial` | 只完成一部分（例如只删了部分文件） | **否**，且不得按已完成上报 |
| `unknown` | 查过了但算不出（如「同一命令启动 8 次」无一手记录） | **否**，必须写明「查了什么 + 缺什么」 |

**恢复规则**：同一 task 内允许继续修复与重跑受影响判据；**不得**把 `unavailable` / `incomplete` / `partial` / `unknown` 改写成通过；**不得**新建 successor / continuation / 替代记录。数据状态写入沿用现有 `facts.jsonl`（K2）落点，不新增状态对象。

**不可逆动作边界（T-012 + CONSTITUTION F9）**：① **动 3rd-review 仓**前需人工确认；② 任何真实的 close / commit / merge / push 需人工确认；③ 本阶段的 make-decision **不做任何不可逆动作**。

## 4. 事实与证据（step 1 load-context / step 2 triage-scope 现场核查）

> 本节每条事实都可以在任务 worktree 内用行内命令复算。重读量核查由独立子代理在只读上下文执行，主会话只收结论摘要（`AGENTS.md`「重读量动作点默认派子代理」）。

### 4.1 任务身份与官方通道核实（实测）

| 项 | 实测值 | 复算方式 |
| --- | --- | --- |
| worktree 创建 | `git worktree add -b task/workflowhub/<task-id> <path> 4330290e`（由 `prepareTaskWorkspace` 确定性生成） | `node tools/cli/task-bootstrap.mjs --project=workflowhub --task=<task-id> --target-repo=/Users/Hugh/Hugh/Project/workflowhub` |
| 分支 / 基线 | `task/workflowhub/workflowhub-mechanism-simplification-t2-20260911` / `4330290eba56ba7e1e46c6b33fc59d1d62c20e78` | `git rev-parse HEAD`；`git branch --show-current` |
| task_path | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t2-20260911` | bootstrap 返回 |
| 官方通道可用 | `doctor --action=workspace` 返回 `materials: "working"`、`baseline_commit` 一致、`storage.selected_source = config` | 见 §4.1 命令 |
| 材料写入通道 | `run --action=draft --stage=make-decision --name=decision-log.md --input=<file>` → `artifact_ref`（本记录全程用该通道写入） | 同上 |
| `node_modules` | 新 worktree 无 `node_modules`；已按同仓先例补**软链**到主仓（被 `.gitignore` 覆盖，`git status` 仍干净） | `ls -la node_modules` |

### 4.2 基线漂移事实（PRD 基线 `216a546d` → 本任务基线 `4330290e`，中间 **15 个提交**）

| 事实 | PRD 记录值（`216a546d`） | 本任务实测（`4330290e`） | 影响 |
| --- | --- | --- | --- |
| markdownlint error / 出错文件数 | **554** / 35 | **612** / 35 | 裁定 F 的基线数字要用实测值 |
| `specs/workflowhub-ui-frontend-capability-20260904/**` lint | 420 / 22 | **420 / 22**（一致） | 无漂移 |
| `tools/cli/check-task-record-paths.mjs` | 10 FAIL / exit 1 | **10 FAIL / exit 1** | 无漂移 |
| `tools/cli/verify-structure.mjs` | 2 FAIL / exit 1 | **2 FAIL / exit 1** | 无漂移 |
| `tools/cli/stage-runtime.mjs` 行数 | 1,095 | **1,182** | C9/C6 落点行号全部漂移 |
| `runtime/stage/stage-content-contracts.mjs` | 6,485 / 6,806（两值并存） | **7,014** | C4/C5 引用行号漂移 |
| `runtime/stage/completion-predicates.mjs` | 1,259 | **1,333** | C5/C6 落点漂移 |
| `core/task-close.mjs` | 2,613 | **2,671** | C6 落点漂移 |
| `runtime/stage/stage-runner.mjs` | 3,161 | **3,194** | C5 落点漂移 |
| `skills/wh-review/scripts/simple-review-runner.mjs` | 1,267 | **1,294** | C4 落点漂移 |
| `skills/wh-review/scripts/review-materials.mjs` | 2,225 | **2,239** | C4 落点漂移 |
| 路径纠错（PRD 引用路径不成立） | `runtime/stage/freshness.mjs`、`runtime/task/quality-store.mjs`、`runtime/evidence/git-worktree-snapshot.mjs`、`tools/cli/check-skill-closure.mjs` | 实际为 `runtime/evidence/freshness.mjs`(781)、`runtime/evidence/quality-store.mjs`(293)、`runtime/task/git-worktree-snapshot.mjs`(647)、`runtime/evidence/check-skill-closure.mjs`(824) | **PRD 的 4 处路径写错**；按原路径 `test -e` 会误判为「已删除」 |
| `path-cards` 生产命中 | 7 | **7**（无漂移） | 任务Ⅰ `HANDOFF-001` 仍开放 |
| `review_origin` 全仓命中 | 0 | **0**（无漂移） | 裁定 G 前提成立（新增 K2 行字段） |
| `workflows/*/skill-deps.yaml` 的 `material_revision` / `snapshot_tree` | build-code 9 / build-plan 12 / build-prd 1 / build-spec 13 / make-decision 8 / verify-code 4 | **完全相同** | C5 声明面未变 |
| `STAGE_REFLECTION_REF` / `CLOSE_PLAN_REF` 生产命中 | 14 | **14**（无漂移） | C2 目标未变 |
| `runPreflight` | 空实现（`:527-530`） | **仍是空实现**（`:594-597`），本区间未被改 | C9-AC-8 前提成立 |

### 4.3 四张卡前提在 HEAD 的逐条核对（子代理只读取证）

| 卡 | 前提 | HEAD 实测 | 结论 |
| --- | --- | --- | --- |
| C9 | `runPreflight` 是空实现，三类非法输入都返 `{status:"valid",diagnostics:[]}` | `tools/cli/stage-runtime.mjs:594-597`，与基线逐字相同 | **成立**（行号 527→594） |
| C9 | 测试三层节奏常量存在但仓库只有 `inner/medium/large` | `stage-content-contracts.mjs:57` = `["inner","medium","large"]`；`:58-62` `TEST_RUNTIME_PROFILE_LIMITS_MS = {inner:60_000, medium:300_000, large:null}`（**PRD 写的常量名 `LIMITS` 不准确**） | 成立，名称需更正 |
| C9 | `large` 档硬要求 `CI=true` | `tools/cli/run-checks.mjs:140`（PRD 写的 `:133` 已漂移） | 成立 |
| C9 | `aggregate` 的 900 秒是「契约预算」还是「supervisor 兜底」 | **是 supervisor 兜底**：`run-checks.mjs:115-118` 注释明写「The large profile deliberately has no contract ceiling; keep its existing CI-only supervisor timeout as an operational guard, **not as a new profile value**」；`TEST_RUNTIME_PROFILE_LIMITS_MS.large = null`，`:118` 用 `?? 900_000` 兜底 | **PRD 未登记此区分**；本任务材料已改正 —— **不得把兜底值升格为契约预算**（否则是静默语义漂移，且不在任何卡的判据内）；**ADR 0027:29 独立印证**：「`large`：仅 CI 环境；其时长上限仍由 runtime contract 的**无界声明**解释」；**`CONTEXT.md` 不含任何档位名**（实测 0 命中）⇒ 改名不波及治理术语表） |
| C9 | `--runtime-profile` 未接进任何 npm 脚本 | `package.json` 8 个 scripts，**0 个**含 `--runtime-profile` | **成立**（R-2 风险成立） |
| C9 | 「同一命令至少启动 8 次」 | 母材料唯一出处 L1570/L1578，**无一手记录** | **`unknown`**，AC 不得依赖 8 |
| C4 | `DEFAULT_MANAGED_TERMINAL_WAIT_MS = null`（无界等待） | **不成立**：`:37 = 1_200_000`（20 分钟） | **PRD 前提已被 HEAD 推翻** |
| C4 | `waitForManagedTerminal` 无停滞判定、无上限 | 有上限（`:461`），无停滞判定 | 部分成立 |
| C4 | `review-result.mjs` 无 `stalled` 映射 | **不成立**：`:151-152` 已把 `PROCESS_STALLED` 与 `REVIEW_WAIT_EXCEEDED` 映射为 `stalled`，并入 `ATTEMPT_CLASS_CODES` | **C4-FR-10① 已在基线后完成** |
| C4 | `managedRequestId` identity 无协议版本、无 nonce | `simple-review-runner.mjs:102-114`，字段仍为 `{material_id, host_provider, providers, provider_identities, review_mode, prompt, subject}` | **成立**（T-11 仍开放） |
| C4 | CLI 的 `run` 拒绝 build_prd | 仍在：`wh-review-cli.mjs:219-220`（原 215/217） | 成立（行号漂移） |
| C5 | 9 个哈希失效链标识符生产侧命中 | HEAD = **993 行**（同法基线 = 955） | 成立（有漂移） |
| C5 | `check-skill-closure.mjs` 在 `:154`/`:290` 强制 `material_revision`/`snapshot_tree` | 文件在 `runtime/evidence/`（824 行），两处仍在 | 成立（路径需更正） |
| C6 | `status_groups` 全仓 1 处产出、测试侧 0 消费者 | 成立（`tools/cli/stage-runtime.mjs:770`） | 成立 |
| C6 | `quality/verify.json` 有真实生产读者 | 成立：`completion-predicates.mjs:1124-1132` 为 load-bearing | 成立 |
| C6 | `--task-path` 只在 3 个 CLI 被接受、`stage-runtime.mjs` 已 0 | 成立 | 成立 |
| C5/C6 | K2 的 `record_kind`「恰好两种取值」是否已在代码里成立 | **不成立（是 C3 要新增的字段）**：`task-store.mjs:291` 的 `validateFact` 用**精确键集** `FACT_KEYS` 校验，**其中没有 `record_kind`**；现行 `facts.jsonl` 仍是旧的 10 键形状（`task_id`/`stage`/`material_digest`/`source_digest`/`invocation_id`/`source`/`status`/`content_hash`/`created_at`/`output_ref`）。**同名冲突风险**：`record_kind` 这个名字在别处已被至少 3 个记录族使用 —— stage-reflection 用 `judgment`（`stage-reflect.mjs:335`、`stage-runner.mjs:1059`）、workflow-evolution ledger 用 `candidate`/`batch_begin`/`batch_commit`/`batch_abort`/`snapshot_record`/`refresh_result`/`publication_proof`（`workflow-evolution.mjs`） | **PRD 未登记该同名冲突**；C5/C6 的「零残留」计数若把别族的 `record_kind` 计入会误判 |

### 4.4 ⚠️ 基线之后**新增的生产控制面**（PRD 与任务Ⅰ 材料**均未登记**）

全部由同一次提交 `b6049afa`（来自已归档任务 `workflowhub-execution-acceleration-deferred-20260909`）加入：

| 新文件 | 行数 | 是否写盘 | 生产 consumer | 与四张卡的关系 |
| --- | --- | --- | --- | --- |
| `runtime/stage/current-close-projection.mjs` | 256 | **否**（自述 "owns no store and writes no record"） | **有**：`tools/cli/task-close.mjs:27,136`；且已登记进 `docs/architecture/control-plane-inventory.json`（disposition = **retain**） | **与 C6 直接冲突**：它是 status/close 的活生产 reader，且含 `product_release`（`:11/:237/:246`），而 C6 要收掉 product-release 投影 |
| `tools/cli/produce-final-current-snapshot.mjs` | 968 | **是**（create-only 写 `$TASK_DIR/quality/tests/final/current-snapshot.json`） | 无 import 型生产读者（仅测试 + 一处 `gate_cmd` 间接校验） | 含 `material_revision` ×4、`snapshot_tree` ×4、`quality/verify.json` ×1；**不在 C5 的 oracle 文件清单内 ⇒ 任务级「零残留」主张会为假** |
| `tools/cli/measure-test-runtime-profile.mjs` | 786 | **是**（create-only 写 profile JSON + manifest） | 仅测试 + `run-checks.mjs` 按路径读回 | **与 C9 直接相关**：它已是「测试耗时画像」的现成实现，C9-FR-1 必须先说明与它的关系（复用/接线/不动） |
| `tools/cli/validate-current-plan-tasks.mjs` | 169 | 条件写（仅 `--output` 给定时） | 仅测试 | 含 `material_revision` ×1、`snapshot_tree` ×1；任务Ⅰ 已把它列为 **C1 Tier B**（零生产引用、仅测试引用）删除候选 |

**结论**：这四项是「整改期间新增控制面」的实例，**与 D-002（净减）方向相反**，且其中两项与 C5/C6 的删除目标正面相交。本任务必须在 make-decision 里给出归属裁定。

### 4.5 ⚠️ C4 审查生命周期的**真实终局路径**（子代理只读取证，跨两仓）

| 问题 | HEAD 实测 | 事实依据 |
| --- | --- | --- |
| 「审查卡死」的终局由谁给出 | **可读到的终局只有墙钟**：`DEFAULT_MANAGED_TERMINAL_WAIT_MS = 1_200_000`，到点抛 `REVIEW_WAIT_EXCEEDED`，被记为 `stalled` | `simple-review-runner.mjs:37`、`:448-472`、`review-result.mjs:151-152` |
| 3rd-review 的健康裁决能否给出终态 | **不能（对 provider 停滞）**：`health-runner.mjs:54` 的 `PROCESS_STALLED` **只诊断不终止**（`:72` 明确不 SIGTERM 活进程）；`managedStatus` 只判 **manager 进程**死（`broker.mjs:762-765` → `SESSION_MANAGER_LOST`） | 3rd-review @ `a96f28b7` |
| 心跳过期判死（D-030① 的主机制） | **未实现**：`runtime.mjs:33-37` `ownerConfirmedDead` 只比 `pid/uid/lstart`，零时间维度 | 同上 |
| 超时后 provider 会被终止吗 | **不会**：`:462` 明确不调 `cancelManaged`；`cancelManaged` 全仓**零调用点** | `simple-review-runner.mjs:462`、`review-provider-client.mjs:566` |
| 孤儿会被回收吗 | **源码未体现回收路径**：`runtime.mjs:108` 对非终态 managed runtime 直接 `continue`；**代码注释 `:32` 声称「orphans are reaped by cleanup(root, ttl_hours)」与实现不一致** | 同上 |
| v3 协议里有没有 `stalled` 终态 | **没有**：`managedV3Outcomes = {completed, partial, unavailable, cancelled}`；3rd-review 的 `workflowhub-result-v3.mjs:20` 同样无 `stalled` | `review-provider-client.mjs:127` |
| 代码注释自称的依据 | `simple-review-runner.mjs:18-36` 标题写「Bounded caller-side wait (**user decision 2026-09-11, option B**)」，并自述「It is a **total wait bound, NOT a stall detector**」 | 源码注释 |

**诚实登记**：该注释声称的「用户决定 option B」在**母材料、任务组 PRD、hardening 任务的四份材料里都找不到具名记录**（已 grep 全部相关 specs 与 task quality 目录）。它是一条**未经核验的 provenance 断言**，不得当作用户已确认的决定引用；本记录按「源码注释」如实标注。

**与 D-030 的逐条对账**：D-030③ 要求「`=null` 语义改为等待 3rd-review 健康裁决，外层墙钟**不再是主机制**」；D-030④ 允许有界等待**只作次要防线且必须显式标注为兜底，不得成为主机制**。HEAD 现状 = 有界等待**事实上是唯一机制**（健康裁决对 provider 停滞不出终态）⇒ **D-030 的主机制部分仍未落地**。

### 4.6 并发与合并序事实

| 事实 | 实测 | 含义 |
| --- | --- | --- |
| 任务Ⅰ 分支 | `task/workflowhub/workflowhub-mechanism-simplification-t1-20260911` @ `50995220`，merge-base = `4330290e`；worktree 内 `plan.md`/`tasks.md` 仍是**未提交**状态 | 任务Ⅰ 在 build-plan 收尾，**C0–C3 尚未实现** |
| 任务Ⅰ 的合并依赖 | PRD 地图：C9「依赖 C3 合入」；C5「准备依赖 C4 合入、实现依赖 C3 记录重建完成」 | 任务Ⅱ 的合并必须排在任务Ⅰ 之后 |
| C5/C6 同文件 | `runtime/stage/completion-predicates.mjs` 与 `tools/cli/stage-runtime.mjs` 同时被 C5、C6 改（PRD X46） | **C5 先合、C6 后合，中间不得并行** |
| C9/C6 同文件 | `tools/cli/stage-runtime.mjs` 同时被 C9（`runPreflight`）与 C6（入口统一）改 | C9 先、C6 后 |
| 跨仓 | `/Users/Hugh/Hugh/Project/3rd-review` 是**独立 git 仓库**（`main` @ `a96f28b7`，工作区干净，`broker.mjs` 已从 1,354 涨到 **1,429** 行） | 跨仓改动不经过本任务的 close 序列 |

### 4.7 `unknown` 登记（如实保留，不编数字）

| # | 未知项 | 查了什么 |
| --- | --- | --- |
| U-a | 「同一命令至少启动 8 次」 | 母材料唯一出处 L1570/L1578；**无一手重复启动记录** |
| U-b | D-026② 所说「provider 生命周期」的具体内容 | 1,979 行母材料仅 `:855` 一处命中，语义未展开 |
| U-c | 「inner 分钟级」对应的最慢 inner 文件 | 本轮只测到 1 个文件 371ms，不足以代表 |
| U-d | C9-FR-4「5 秒内返回」是否已有既存 SLO | 无 preflight 计时记录 |
| U-e | `run-checks.mjs` 的 profile 模式是否真产出过 `quality/tests/*.json` | 只有命令原文，无产出文件 |
| U-f | `simple-review-runner.mjs:18-36` 注释所引「用户决定 option B」的具名出处 | 已 grep 母材料 / PRD / hardening 任务四份材料 / task quality 目录，**未找到** |
| U-g | 3rd-review 侧心跳与 `PROCESS_STALLED` 接线的具体阈值 | D-030 unresolved_items 明确留给实现时定 |
| U-h | 跨仓判死逻辑的正确性 | 本仓不可闭合（G-4）；只能证明调用侧映射正确 |

## 5. Talk（真实问答）

> 生命周期：每个 Round 各自 `ask`（问题卡在会话中可见）→ `wait` → 用户真实回复 → `resume` → 重排。用户可只回编号。
> 结构化问答工具：本会话使用宿主的 `ask_user_question`（每题含 `options` 与推荐项，答案为选项原文或自由文本）。

### Round 1（step 3 · 已完成 · 用户真实回复）

> 用途：核实痛点真实性、成功标准、是否需要调研，以及在新事实下重新确认方向。

| talk_id | 问题/选项（大白话） | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | 做到什么程度算「成了」：**A 四张卡各自判据为主 + 最后用三条总账核对一次** / B 只看三条总账 / C 以端到端跑通一次五阶段为准 | 决定「验收尺子」落在哪一层 | 选 **A** | OI-05 → confirmed；OI-15 / OI-16 细化 | 用户本会话结构化答复 |
| T-002 | 开工前要不要外部调研：**A 不做，记「跳过」并写理由** / B 做一次窄调研（进程停滞与健康判死惯例）/ C 只补读 3rd-review 仓 | 决定 step 4 是否执行 | 选 **A** | step 4 记 `skipped` 并写明理由（§6） | 用户本会话结构化答复 |
| T-003 | 「审查卡死」怎么收场：**A 补齐 3rd-review 健康判死当主机制 + 20 分钟上限降级为显式兜底** / B 认 20 分钟上限当机制 / C 先去掉上限回到无限等 | 直接决定 R-013 是否成立 | 选 **A** | OI-10 → confirmed；OI-09（跨仓形态）影响档升高；新增 RISK-002（跨仓不可闭合）与 RISK-003（孤儿进程） | 用户本会话结构化答复；事实依据 §4.5 |
| T-004 | 中间某批做不完怎么停：**A 停在那批、如实记、后面不开工** / B 跳过继续 / C 降级为只登记 | 决定失败边界与批次串行纪律 | 选 **A** | OI-22 → confirmed；OI-16（每批停止条件）据此写死 | 用户本会话结构化答复 |

**Round 1 收敛结论**：4 问全部收敛；重排后仍有 5 个 `high` 待答项，全部转入 Round 2。
关键结论 = ① 验收以卡判据为主、总账做任务级核对；② 不做外部调研；③ 补齐 3rd-review 健康判死当主机制、20 分钟上限降级为兜底；④ 做不完就停在那批。
保留风险 = 跨仓部分本仓不可闭合（RISK-002）；孤儿进程回收路径源码未体现（RISK-003）。

### Round 2（step 5 · 已完成 · 用户真实回复 · 共 3 批）

> 用途：方向、范围、非目标、关键取舍和风险。第一批 5 问（方向与范围），答后重排再问第二批 3 问（取舍回显与流程形态），再问第三批 2 问（交接与非目标）。

#### 第一批（T-005 ~ T-009）

| talk_id | 问题/选项（大白话） | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-005 | C9 三层节奏怎么落：A 不改名、写死映射 / **B 把 `medium`/`large` 改名成 `phase`/`aggregate`** / C 直接接进 `npm test` | 决定是否改一个共享契约文件 | 选 **B** | OI-08 初定；**派生 T-010（波及面回显）** | 用户本会话结构化答复 |
| T-006 | 基线后新增的 4 个生产文件怎么归属：**A 按「谁的目标撞到它谁负责」逐项定归属** / B 全留给任务Ⅲ / C 不动且把 C5/C6 判据收窄 | 决定 C5 判据是否假绿、C6 是否踩坏活 reader | 选 **A** | OI-04 / OI-11 / OI-14 → confirmed；C5 清单补 2 文件、`current-close-projection.mjs` 归 C6、`measure-test-runtime-profile.mjs` 归 C9 | 用户本会话结构化答复；事实依据 §4.4 |
| T-007 | C4 跨仓交付形态：**A 本任务同时交付两仓、跨仓标 `unknown`** / B 另开任务 / C 不做跨仓 | 决定 R-013 是否有人落地 | 选 **A** | OI-09 → confirmed；新增 HANDOFF-T2-003 | 用户本会话结构化答复 |
| T-008 | 与任务Ⅰ 的时序：**A 现在开工、合并严格排在任务Ⅰ 合入之后** / B 等任务Ⅰ 合入 / C 独立合并 | 决定冲突面与工期 | 选 **A** | OI-07 → confirmed | 用户本会话结构化答复；事实依据 §4.6 |
| T-009 | status 里怎么报「落后了」：**A 作根因行里的一条普通条目（带具体来源）** / B 单独加字段 / C 不显示 | 决定是否与 C6「只报根因」自相矛盾 | 选 **A** | OI-12 → confirmed | 用户本会话结构化答复 |

#### 第二批（T-010 ~ T-012）

| talk_id | 问题/选项（大白话） | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-010 | T-005 的改名**实测波及面比选项里写的大**（权限语义、20 个文件、1 篇 ADR、与 C5/C6 同文件），回显后确认：**A 维持改名并排成 C9 第一步** / B 改成不改名写映射 / C 只改对外名字 | 决定 C9 第一步的动作与冲突面 | 选 **A**（维持 T-005） | OI-08 终态；新增 **RISK-001**（改名与 D-002 措辞的张力、ADR 与 C7 撞车） | 用户本会话结构化答复；事实依据 = 本会话实测（6 个常量引用文件 / 20 个 `runtime_profile` 文件 / ADR 0027） |
| T-011 | T-11（请求身份不含协议版本 ⇒ 改协议后 24h 内无法重跑）修不修：**A 修：把协议版本加进请求身份并实跑验证一次** / B 维持 PRD 只登记 / C 推到 3rd-review 仓 | 决定 C4 自己的验收会不会被 T-11 卡死 | 选 **A** | OI-13 → confirmed；新增 **RISK-004**（偏离 PRD 原判，且实跑验证成本） | 用户本会话结构化答复；事实依据 = 子代理实测「请求身份是本地计算、与公开信封字段集不是一回事」 |
| T-012 | 完整用户流程形态：**A 沿用任务Ⅰ 形态 + 「动第二个仓库」前加一个人工确认点** / B 完全沿用不加确认点 / C 每批都加确认点 | 决定确认点数量与不可逆动作的保护 | 选 **A** | OI-16 / OI-19 / OI-22 → confirmed | 用户本会话结构化答复 |

#### 第三批（T-013 ~ T-014）

| talk_id | 问题/选项（大白话） | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-013 | 交接给任务Ⅲ 什么：**A 按「具名 + owner + 关闭条件」列全部交接项** / B 只交接改名后果 / C 不专门列 | 决定下一站是否有人接 | 选 **A** | OI-17 / OI-18 / OI-24 → confirmed；产出 HANDOFF-T2-001 ~ 005（§3.5） | 用户本会话结构化答复 |
| T-014 | 要不要自我约束「不得净新增控制面」：**A 加一条任务级非目标（必要的当场写清 consumer/owner/删除条件）** / B 交给任务Ⅲ C7 / C 加且要求 C9 也必须净减 | 决定本任务是否当场回应 R-005「改动会再加东西」 | 选 **A** | OI-23 → confirmed；OI-06 去掉「C9 必须净减」的分支 | 用户本会话结构化答复 |

**Round 2 收敛结论**：两批共 10 问全部收敛；重排后队列**无剩余 `high`/`medium` 待答项**，本轮结束。
关键结论 = ① 档位改名一次性改到底并排为 C9 第一步；② 新增 4 个文件按「谁撞到谁负责」逐项定归属；③ 本任务同时交付两仓、跨仓标 `unknown`；④ 现在开工但合并排在任务Ⅰ 之后；⑤ stale 作根因行普通条目；⑥ 修 T-11 并实跑验证；⑦ 流程沿用任务Ⅰ 形态 + 跨仓前一个确认点；⑧ 交接项按具名+owner+关闭条件列全；⑨ 新增任务级非目标「不得净新增控制面」。
保留风险 = RISK-001（改名波及面）/ RISK-002（跨仓不可闭合）/ RISK-003（孤儿进程）/ RISK-004（T-11 偏离 PRD 原判）。

### Round 3（step 7 · 已完成 · 方向审查后 · 用户真实回复）

> 输入 = §8.1 的方向审查事实 + §8.2 的 **14 条独立问题逐条清单**（原始 20 条去重；**未压缩成泛化摘要**）。
> 本轮**没有 debate 裁决书**——本次审查未传 `review_flow`，故 Round 3 的输入只有原始 findings。

| talk_id | 问题/选项（大白话） | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-015 | 审查者给的 **blocking**：C4 主体在外部仓，「一条合并列车」无法闭环跨仓交付与验收 → **A 维持 T-007=A 但把「不是纯本仓合并列车」写死进材料** / B 本任务只做本仓适配层、跨仓拆出去 / C 维持同时交付但改成「本仓先合、跨仓后动」 | 决定 blocking 是否消解、以及完成声明能闭合到什么程度 | 选 **A** | FND-D-03 → `accepted_risk`；§3.5「一条合并列车」表述收窄（§16.2） | 用户本会话结构化答复；审查原文 §8.2 FND-D-03 |
| T-016 | 审查者说 C9 分档「无用户原话支持、无命令入口、无测试消费者」→ **A 保留 C9 但加硬前置：点名真实 consumer + 必须新增命令入口，否则不得交付** / B 从任务Ⅱ 删掉分档 / C 维持原样不加前置 | 决定 C9 是否触犯「不得净新增控制面」 | 选 **A** | FND-D-04 → `fixed`；新增三条硬前置（§16.3） | 用户本会话结构化答复；审查原文 §8.2 FND-D-04 |
| T-017 | 审查者挑战 T-003：既然你否决靠 timeout，就不该把它当开放权衡，应**彻底废弃** 1200000 ms → **A 维持 T-003=A（主机制健康判死 + 20 分钟显式兜底）** / B 采纳审查者彻底删除 / C 保留但调短到 10 分钟 | 决定 R-013 的落地形态 | 选 **A**（维持原选择） | FND-D-06 → `accepted_risk`（审查者反对意见原文保留） | 用户本会话结构化答复；审查原文 §8.2 FND-D-06 |
| T-018 | 审查者抓到真实遗漏：你的原话要求「注意主会话上下文控制和子代理派发」，但完整用户流程完全没写 → **A 补一个 OI + §3.8 一节，写死责任与失败处理** / B 只加一句说明 / C 不补 | 决定原始需求这条是否被覆盖 | 选 **A** | FND-D-07 / D-13 → `fixed`；新增 **OI-25** 与 §3.8 新节（§16.5） | 用户本会话结构化答复；审查原文 §8.2 FND-D-07 |
| T-019 | 审查者说成功标准可以在「机制仍占一半时间」时全部通过，没验证核心目标 → A 加一条可复算的行为判据（同一批测试的命令条数与墙钟净降）/ **B 不加** / C 跑一次端到端五阶段计时对比 | 决定「>50%」这条核心抱怨是否被直接验证 | 选 **B（不加）** | FND-D-09 → `accepted_risk`（缺口如实保留，不淡化） | 用户本会话结构化答复；审查原文 §8.2 FND-D-09 |
| T-020 | 审查者说档位没说清：`aggregate` 的 `null` 上限是否允许、怎么调用、无入口时看到什么失败 → **A 允许 null，写死「仅 CI + 900 s 只是 supervisor 兜底 + 必须有命令入口」三条** / B 把 900 秒升格为契约上限 / C 取消 aggregate 档 | 决定档位契约与 ADR 0027 是否一致 | 选 **A** | FND-D-11 → `fixed`；§16.8 | 用户本会话结构化答复；审查原文 §8.2 FND-D-11 |

**Round 3 收敛结论**：6 问全部收敛。审查 14 条独立问题中 **4 条由用户明确维持原选择或明确不加**（FND-D-03 / D-06 / D-09），**10 条判 `fixed`**（含 3 条是我的装配缺陷），`rejected_invalid` 与 `needs_human` 均为 **0**。
关键结论 = ① 跨仓不进本任务合并列车，但本任务仍同时交付两仓；② C9 保留但加三条硬前置（consumer 点名 + 必须新增命令入口 + 未落地不得声明完成）；③ 20 分钟上限维持为**显式兜底**；④ 补 OI-25 承载主会话/子代理责任边界与执行入口条件；⑤ **不加**新的行为型成功判据；⑥ `aggregate` 允许 `null` 上限但必须仅 CI + 兜底不写进契约 + 必须有入口。
保留风险 = RISK-002（跨仓不可闭合）、RISK-003（孤儿进程与注释不一致）、RISK-009（**验收不直接证明机制开销净降**，用户明确不加判据）。

**Round 3 后新增的两条 `accepted_risk` 之外的遗留**：审查者提出的「送审输入缺任务级 non_goals」（FND-D-12）与「三条总账未标 consumer/owner」（FND-D-14）已判 `fixed`，修正落在 §16.9 / §16.10。

### Talk 总数重算

`当前总数 = 已提出问题数 + 重排后仍会改变方向的开放问题数`：Round 1 结束时 = 4 + 5 = 9；Round 2 结束时 = 14 + 0 = 14；Round 3 结束时 = **20 + 0 = 20**（全部收敛，无遗留）。

## 6. 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 OI |
| --- | --- | --- | --- | --- |
| R-SKIP-1 | 外部调研 | **跳过**。理由（逐条）：① 本任务五个待答方向问题（C9 接线、控制面归属、跨仓形态、任务Ⅰ 时序、C6 形状）的答案全在**仓内可复算事实**里（`git`/`grep`/`wc`/`node`），外部知识改变不了其中任何一条；② 唯一涉及外部世界的部分是 provider 的真实停滞行为，而 D-030 已把「怎么判死」明确交给 3rd-review 仓自己实现，本仓只做消费侧映射——本任务不需要外部惯例作为判据；③ 用户 T-002 选 A。支撑事实 = §4.2–§4.7 的全部实测，以及 9 个独立子代理的只读核查 | `skipped`（有真实理由） | OI-01 ~ OI-24 的收敛均不依赖外部资料 |

**外部接口核实检查（talk-with-zhipeng §4.5 前置检查）**：本任务涉及的外部接口 = ① WorkflowHub 官方执行通道（`tools/cli/stage-runtime.mjs`）；② 3rd-review 仓的 managed 审查接口（`lib/broker.mjs`）。两者都已由独立子代理**读源码核实**真实调用方式，不是凭文档或记忆假设（证据 §4.1 / §4.5）。**通过**。

**命名唯一定义检查**：本任务后面会被多处复用的命名 —— ① 三层测试档位名；② `review_origin` 五态；③ `facts.jsonl` 的 `record_kind` 两型行；④ C6 保留的六类具名 ref；⑤ 兜底等待常量的语义。全部已在 **§3.6** 钉死唯一定义源（②③④ 为上游已定稿、本任务只引用；①⑤ 由本阶段定稿）。**通过（Round 2 补充定义后）。**

## 7. grill

> Grill = 交互式思考，**不调用 wh-review、不产生 review finding**。生命周期同为 `ask → wait → 真实回复 → resume → 重排`。
> 提问前已先核实：能从代码、文档或已确认事实得到的答案不重复问用户。本轮采用**一批 frontier 问题**（6 题互相独立），每题只含一个决策轴。
> 候选问题池由独立子代理产出（8 条），主会话逐条复算后选取；其中 **G-001 / G-002 / G-004** 三条的行内事实由主会话亲自复算确认（见下表「证据」列）。

| grill_id | CONTEXT/冲突（压测点） | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | **写口「第三项 待写字节」名实不符**：`inspectWriteBoundary`（`write-boundary-preflight.mjs:44-152`）内**没有任何字节比对**；唯一一处 ref+hash 比对在 `persistWriteBoundaryPathCard:216-217`，而它正是裁定 J-3 要删的 path-card 落盘分支；且 `tools/cli/task-close.mjs:189-195` 先 `readRecord` 算 hash 再传入、callee 又 `readRecord` 一次比对 ⇒ **同源自比、恒真** | **A：真实现**一个「待写字节」核对 —— 在真正的写入点比对「即将写入的字节」与「已认证来源的字节」，不符 fail-loud；材料写明这是**把 D-009② 本就要的语义补实**，不是新增控制面对象 | 落 §16.11；**不新建 ADR**（无新取舍，只是把已确认决定的语义做实） | 主会话亲自复算（`grep -n "sha256\|hash\|stale" write-boundary-preflight.mjs` + `task-close.mjs:185-200`）；用户本会话真实回复 |
| G-002 | **完成判据的输入被自己删掉**：`CONTEXT.md:374` 写「只有当前 task、stage、**material revision 和适用 snapshot** 上的…才可宣称完成」，而 C5 删的正是生产侧 `material_revision` / `snapshot_tree` 链 | **A：C5 同一批**修正 `CONTEXT.md` 这句话，把输入换成新判据（identity 三项 + `facts.jsonl` 本阶段行 + 六类具名 ref），并登记交接项交任务Ⅲ C7 复核 | 落 §16.12；**ADR = not needed**；`CONTEXT.md` 由 no-change **改为 changed**（§15 已同步更正） | `CONTEXT.md:374` 原文；用户本会话真实回复 |
| G-003 | **事实底座 vs 派生投影的界线未写**：`CONTEXT.md:48-49` 把 `status_matrix` / `identity` / `source_completeness` 叫「judgment 层的事实底座」，而 C6 要收掉派生投影 | **A：保留**这三块事实底座，只收掉 `product_release` 投影与 `status_groups` 四投影；材料里把「事实底座」与「派生投影」的界线写死 | 落 §16.13；**不新建 ADR** | `CONTEXT.md:48-49` 原文；用户本会话真实回复 |
| G-004 | **历史问题（当时输入）**：`record_kind` 同名冲突；当时 `task-store.mjs:291` 的 `validateFact` 精确键集尚无该字段 | **历史选择 B**：曾要求给 `facts.jsonl` 换一个不冲突的新字段名；**已被 §0.1 post-merge amendment supersede** | 历史落点 §16.14；当前不执行改名 | 当时源码复算与用户回复；当前权威见 §0.1/§16.14 post-merge amendment |
| G-005 | **实跑验证算不算第二次审查**：T-011 要求「修完协议版本后实跑验证一次」，而 `CONTEXT.md:98` 的审查闭环规定「一个 stage 的某条审查面只做一轮」，只有「上一轮无任何语义建议**且**具体传输/材料问题已改变」才能重发 | **A：定性为「通道验证」（transport verification）**——不产出 findings、不进 sink、**不计入 stage 的审查面轮次**；只在事实里记「同一材料改协议后可重跑」的退出码。它正好落进闭环条款允许的「具体传输问题已经改变」那一档 | 落 §16.15；**不新建 ADR** | `CONTEXT.md:98` 原文；用户本会话真实回复 |
| G-006 | **历史落地问题**：G-004=B 当时会形成跨任务改名约束 | **历史选择 A**：曾登记跨任务约束；**现已关闭**，Task I 合并后用户接受 frozen `record_kind` | 历史落点 §16.14 + `HANDOFF-T2-006`；当前不执行 | 当时 Task I 材料与用户回复；当前权威见 §0.1，交接已 closed |

### 全需求覆盖矩阵（Grill 先建矩阵，再挑战）

| 消息类 | 覆盖轴 | 承载 OI / 结论 | 覆盖状态 |
| --- | --- | --- | --- |
| `goal` | 净减主线、C9 净增的记账、验收尺子 | OI-05 / OI-06 / D-001 / D-004 + §16.10 | complete |
| `flow_or_surface` | 逐批可见结果 + 停止条件 + 跨仓确认点 + **主会话/子代理责任边界与执行入口条件** | OI-16 / OI-19 / **OI-25** / §3.8 / §16.5 | complete（Round 3 补齐 FND-D-07 / D-13） |
| `data_or_state` | K2 两型行、`review_origin` 五态、`facts.jsonl` 行型字段**改名**、六类具名 ref、**哈希按 consumer 分类** | OI-12 / OI-21 / **OI-26** / G-004 / G-006 / §16.6 / §16.14 | complete |
| `success_failure_acceptance` | 卡判据 + 三条总账、失败停在那批、五类状态语义、**不直接证明机制开销净降的缺口** | OI-15 / OI-16 / OI-22 / RISK-009 / §8.2 FND-D-09 | complete（缺口以 `accepted_risk` 如实保留） |
| `constraint_non_goal_defer` | E-1 ~ E-20 + 任务级非目标 + 零延期 + 交接项 + **送审必须含非目标** | OI-18 / OI-23 / OI-24 / §3.5 / §16.9 | complete |

### Grill 四项客观退出检查

| # | 检查项 | 结果 | 事实依据 |
| --- | --- | --- | --- |
| 1 | 外部依赖接口是否已核实真实定义（非文档假设） | **pass** | 官方执行通道（`stage-runtime.mjs doctor --action=workspace` 实测返回 workspace/baseline/materials）；3rd-review 的 managed 接口由子代理**读源码**核实（`broker.mjs` 的 `managedStatus` / `ownerConfirmedDead`、`health-runner.mjs` 的判死阈值）；**本轮还实测跑通了一次真实审查**（2×3 派发，产出 20 条原始 findings） |
| 2 | 涉及字段/路径命名是否已有唯一权威定义 | **pass** | §3.6 定义五个命名；对 G-004 暴露的 **`record_kind` 同名冲突**，已由 G-004 / G-006 裁定为「换名 + 跨任务约束」，裁决源写进 §16.14 与 `HANDOFF-T2-006` |
| 3 | 失败路径/异常语义是否明确 | **pass** | §3.8 五类状态语义 + 逐批停止条件；§16.7 补审查生命周期的状态转移与清理 owner；G-001 补写口失败语义（fail-loud） |
| 4 | 范围边界「做什么/不做什么」是否写死、无隐性口头扩大 | **pass** | §3.5 正式范围四项 + E-1 ~ E-20 + 任务级非目标；§16.2 把「一条合并列车」收窄为「本仓一条 + 跨仓独立」；§16.3 给 C9 加三条硬前置 |

### 结束记录（grill_summary）

```yaml
grill_summary:
  status: completed
  direction_changing_challenges_resolved: true
  context:
    status: changed
    reason: "C5 删掉生产侧 material_revision / snapshot_tree 链后，CONTEXT.md 的『阶段完成判据』一句失去输入来源，必须同批改写为新判据输入（identity 三项 + facts.jsonl 本阶段行 + 六类具名 ref）"
    file_references: ["CONTEXT.md（阶段完成判据一句，由任务Ⅱ C5 同批修改；见 §16.12）"]
  adr:
    status: not-needed
    reason: "本轮六条结论都是『把已确认决定的语义做实』或『消除同名/边界歧义』，没有产生新的真实取舍，三条 ADR 判据未同时成立。唯一涉及既有 ADR 的是档位改名（D-003）对 docs/adr/0027-test-feedback-runtime-profile.md 表述的同步，那是修改既有 ADR 而非新建，已登记为 HANDOFF-T2-001"
    file_references: []
  conflicts:
    status: resolved
    disposition: "① CONTEXT.md『事实投影=事实底座』与 C6『收掉派生投影』的界线 → 保留三块事实底座、只收派生投影（G-003 / §16.13）；② CONTEXT.md『完成判据含 material revision/snapshot』与 C5 删链 → 同批改写该句（G-002 / §16.12）；③ 本仓 record_kind 同名三族 → 任务Ⅰ 换名（G-004 + G-006 / §16.14）；④ T-011 实跑验证与审查闭环 → 定性为通道验证、不计轮次（G-005 / §16.15）"
  requirement_coverage:
    status: complete
    message_classes: [goal, flow_or_surface, data_or_state, success_failure_acceptance, constraint_non_goal_defer]
    uncovered: []
  exit_checks:
    external_interfaces: pass
    canonical_names: pass
    failure_semantics: pass
    scope_boundaries: pass
  decision_updates:
    - "G-001：写口第三项『待写字节』必须真实现（补实 D-009② 语义），新增实现单列进净减账"
    - "G-002：C5 同批修正 CONTEXT.md 的完成判据输入；交接 C7 复核"
    - "G-003：保留 status_matrix / identity / source_completeness 三块事实底座，只收 product_release 投影与 status_groups 四投影，界线写死"
    - "G-004 + G-006：facts.jsonl 行型字段换不冲突的新名；改名作为跨任务约束交任务Ⅰ C3，本任务按新名消费"
    - "G-005：T-011 的实跑定性为通道验证，不产出 review fact、不计审查轮次"
    - "开放问题：任务Ⅰ 若已按旧名开工，改名成本上升；登记为 RISK-010 与 HANDOFF-T2-006 的关闭条件"
```

**面向用户的历史 Grill 总结（当时呈现，非当前实施指令）**：本轮当时压力测试了 6 件事；其中曾选择给 `facts.jsonl` discriminator 改名并跨任务协调。**Post-merge amendment（当前权威）**：Task I 已冻结 `record_kind: stage | close_action` 且用户接受，故该历史改名选择不再执行，风险与交接均关闭；其余写口、CONTEXT、跨仓与机制开销风险结论仍按各自当前条款执行。

## 8. 审查处置

### 8.1 方向审查（step 6）运行事实

> **本节的第一次记录有误，已按权威证据整体更正**：我最初只读到 broker 的 **red 组** runtime，误记为「3 个 provider 全部完成、0 失败、12 条 findings」。实际这是**红/蓝成对**审查。以下为更正后的实测值。

| 项 | 实测值 |
| --- | --- |
| 入口 | `node skills/wh-review/scripts/wh-review-cli.mjs run`（stdin 送 JSON）。HEAD 上 CLI 只有三个命令：`doctor` / `run`（= `runReviewRecovery`）/ 其余（= `verifyFinalReview`）——**没有独立的「首次审查」命令** |
| 送审材料 | `raw_requirement` + `objective_facts` + `convergence_outline`（24 条 OI 的 questions-only 投影），`review_instructions` 由 CLI 生成 |
| **审查形态** | **红/蓝成对**：`public_request_count = 2`（red / blue），各派发 3 个 provider（kimi/coding、antigravity/flash、codex/luna） |
| red 组（`runtime_id = caa59167-…`） | `outcome = "completed"`；kimi 140,943 ms ✓、antigravity 111,218 ms ✓、codex 443,459 ms ✓ |
| blue 组（`runtime_id = ed096ef1-…`） | `outcome = "partial"`；**kimi `RATE_LIMITED` 失败（5,234 ms）**、antigravity 147,138 ms ✓、codex 396,863 ms ✓ |
| material_id | `29a934d871f1f1a16789e68e59f96003b6a231d59c596ac5c44d3bfdc38e9568`，两侧一致，且与本地 CLI 代码复算值相同 |
| 墙钟 | 23:52:38 → 00:00:02（约 7 分 24 秒） |
| 产出 | **原始 20 条 findings**；去重后 **14 条独立问题**（blocking 2 / major 11 / minor 1） |
| **官方记录通道** | **失败**：`TypeError: review recovery result status is invalid`（`wh-review-cli.mjs:229`，`normalizeBareRecoveryResult`），exit 1、stdout **0 字节**、**未写 sink、未落任何 review 结果**。**根因（已定位到具体契约）**：bare 路径只接受 `available \| unavailable`，而成对审查在**有 provider 失败**时得到的是 `available-with-failures` ⇒ 归一化器直接抛错、整包结果被丢弃 |
| **本阶段可声明的审查事实** | **`unavailable`**（通道失败）—— **不是** `conducted`，**也不是**「零 findings」。按 wh-review 单轮契约与 D-030③ 取向，**未重试、未重派 provider**；技能要求「unavailable 只在缺失路由/材料被修复后才可重试」，而修复该 CLI 属 C4 的生产代码工作，**不在 make-decision 范围** |
| 原始证据落点 | 全部在 task 证据区，文件名 = 内容 sha256：<br>· `e4693cf06361b8e8bf6650672df8328dcb574079214d6140f965823a5f885bb9.json`（25,955 B，**20 条 findings 全文** + 两 rol 元数据）<br>· `00853be4c2a9a6d9cbd6a0d42bf58bdfa85394ddece54609822cb5c6aa5b233b.json`（18,064 B，red 组 broker public 原文）<br>· `bae52c2f249238056b791bea7198fb2d69ac1e74573240f1cd84e781425fd0d5.json`（15,463 B，送审请求原文）<br>· `93fe3c41893652e130cf45ccb531e1ab13c4ef94a46dcb6b1308b3c583d5dbe1.log`（465 B，stderr）<br>· `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.stdout.txt`（0 B，stdout 原文）<br>这些是**原始证据**，**不是**正式审查事实 |
| **这条通道缺陷本身** | **本任务实测复现的第四条审查通道缺陷**（前三条：T-11 `REQUEST_ID_CONFLICT`、`ATTACHMENT_DELIVERY_UNSUPPORTED`、`PROTOCOL_INCOMPATIBLE`）。它比前三条**更贵**：审查完整跑完 2×3 次派发、产出 20 条 findings，**然后被 CLI 整包丢掉**。归 C4「审查通道修复（必须修）」范围，作为该卡的新增实证 |
| 送审包的**主动缺陷**（我的装配缺陷，2 个 provider 独立命中） | ① **OI-24 题面不是答案中性的**（「为什么本任务不产出延期项？」预设了结论）；② **OI-14 题面披露了处置**（「被治理登记表标为保留」「含有将被清零的字段」）；③ **`objective_facts` 未含任务级 non_goals**，而 OI-23 引用的 PRD 内容不在送审字节里。**我先前只用关键词 grep 得出的「送审包干净」结论不成立** |
| 未使用的潜在泄漏通道（如实登记） | bare 路径 allowlist 把 `current_selection` / `alternatives` / `selection_rationale` / `key_assumptions` / `independent_reconstruction` 列为 **optional 且不经 `directionMode` 裁剪**。本次**未送**这些字段，但该口子存在，归 C4 参考 |
| 未命中的失败 | 全程无 `MATERIAL_FORBIDDEN` / `PROVIDER_OUTPUT_INVALID` / `ATTACHMENT_DELIVERY_UNSUPPORTED` / `REQUEST_ID_CONFLICT` |

**方法学后果（如实登记，与任务Ⅰ 同类）**：本次方向审查的**记录通道失败**，因此它的 findings 只能以**原始证据**身份进入处置，不能作为正式审查事实被下游引用；同时，它「未发现某类问题」**不能**当作该类问题不存在。本次未传 `review_flow`，故**未产生 debate 裁决书**，Round 3 的输入只有上述原始 findings（已逐条列出，未压缩成泛化摘要）。

### 8.1b 同一通道缺陷在 **detail track 上二次复现**（本节写于 step 10 之后）

Step 10 的细节审查**复现了与 step 6 完全相同的 CLI 缺陷**，抛错点逐字相同：`TypeError: review recovery result status is invalid`（`wh-review-cli.mjs:229`，`normalizeBareRecoveryResult`）。

| 项 | step 6（direction） | step 10（detail） |
| --- | --- | --- |
| 抛错点 | `normalizeBareRecoveryResult`（`:229`） | **同一处、同一文案** |
| broker 结局 | 两个 role 均 `state = terminal`；red `completed` / blue `partial` | 两个 role 均 `state = terminal`、**`outcome` 均为 `partial`** |
| CLI 结局 | exit 1、stdout 0 字节、**未写 sink** | **同样 exit 1、stdout 0 字节、未写 sink** |

**detail track 的 8 次派发实测**（5 次产出、3 次失败）：

| runtime | kimi/coding | pi/v4flash | antigravity/flash | codex/luna |
| --- | --- | --- | --- | --- |
| `e19eba9a…` | **failed `RATE_LIMITED`**（5,767 ms） | completed 639,852 ms / 5,680 B | **failed（无错误码）** 579,793 ms | completed 579,790 ms / 10,594 B |
| `a6290a79…` | **failed `PROVIDER_OUTPUT_INVALID`**（568,319 ms） | completed 628,365 ms / 5,521 B | completed 588,659 ms / 3,848 B | completed 588,659 ms / 5,599 B |

**结论（升级后的判据）**：该缺陷**不再是「观察到一次」** —— 它在**两个不同 track、两次独立运行**上以同一抛错点复现，且**每次都是「审查真实跑完、结果被整包丢弃」**。这使 C4「审查通道修复（必须修）」多了一条**可复现**的实证：**「有 provider 失败」是成对审查的常态（两次运行都是 `partial`），而归一化器只认 `available | unavailable` ⇒ 只要有一个 provider 失败，整轮审查结果必然被丢。**

**本阶段的事实口径**：detail 审查同样只能声明 **`unavailable`**（通道失败），**不是** `conducted`，也**不是**「零 findings」；原始 broker 证据按内容寻址保全；**未重试、未重派 provider**。

### 8.2 方向审查 14 条独立问题（原始 20 条去重）逐条处置

> `status` 取值 = `fixed` / `rejected_invalid` / `accepted_risk` / `needs_human`。原始事实保留在 8.1 的落点文件里，本节只记处置。
> **`rejected_invalid` = 0 条；`needs_human` = 0 条。没有一条被放宽或删掉。**

| finding_id | 原始 # | severity | 位置 | 问题（一句话） | status | 处置与依据 |
| --- | --- | --- | --- | --- | --- | --- |
| FND-D-01 | 1 / 7 / 16 | **blocking** | `convergence_outline` OI-24 | questions-only 投影**不是答案中性的**：OI-24 题面预设「本任务不产出延期项」 | **fixed** | **成立，是我的装配缺陷**。OI-24 题面改为中性问句，并按 T-013 把「哪些属本任务 / 交接 / 非目标 / 延期，各自 owner 与关闭条件」写成待答项；见 §16 第 1 条 |
| FND-D-02 | 2 | minor | `convergence_outline` OI-14 | 题面披露处置（「被标为保留」「将被清零」） | **fixed** | **成立**。OI-14 改为纯问题形式；见 §16 第 1 条 |
| FND-D-03 | 3 / 13 | **blocking** | `raw_requirement` 范围 | C4 主体在外部仓，**单条本地合并列车无法闭环跨仓交付与验收** | **accepted_risk** | **成立但用户明确维持**（R3-Q1 = A）：仍同时交付两仓，但把「**本任务不是一条纯本仓合并列车**」写死进材料，跨仓部分不进本任务合并列车；风险保留在 RISK-002 |
| FND-D-04 | 4 / 14 | major | `convergence_outline` OI-06 | C9 分档**无用户原话支持、无命令入口、无测试消费者**，违「不新增无真实 consumer 的控制面」 | **fixed** | **部分成立**（`run-checks.mjs` 与 2 个契约测试确实在消费它，但**命令入口确实为 0**）。用户 R3-Q2 = A：保留 C9 但加**硬前置** —— 每个档位点名真实 consumer + **必须新增命令入口**，否则按死代码处理、不得交付；见 §16 第 3 条 |
| FND-D-05 | 5 / 15 | major | `convergence_outline` OI-07 / OI-11 | 依赖**未合入**的任务Ⅰ 决策条文与 `HANDOFF-001` | **fixed** | **成立**，已由 D-016 / RISK-005 覆盖；按审查建议补写「任务Ⅱ 的决策输入严格基于当前主干基线 `4330290e`，不把未合入分支的中间形态当作决策前置」；见 §16 第 4 条 |
| FND-D-06 | 6 | major | `convergence_outline` OI-10 | 用户已否决靠 timeout 收场，却把 20 分钟上限当「开放权衡」；建议**彻底废弃** `1_200_000 ms` | **accepted_risk** | **成立但用户明确维持**（R3-Q3 = A）：主机制 = 健康判死，20 分钟**显式兜底**。已按 D-030④ 把「它是兜底、不是主机制」写进 §3.5 C4 条与 §3.6 命名表；审查者的反对意见完整保留在本行 |
| FND-D-07 | 8 | major | `convergence_outline` OI-19 | 完整用户流程**未覆盖「主会话上下文控制和子代理派发」** | **fixed** | **成立**（这是用户原话里的明确要求）。用户 R3-Q4 = A：新增 **OI-25** 与 §3.8 的「主会话与子代理责任边界」一节；见 §16 第 5 条 |
| FND-D-08 | 9 | major | `convergence_outline` OI-13 | 哈希简化被收窄成协议版本问题，未按 consumer 分类 **993 处**标识符、未说明哪些校验必须保留 | **fixed** | **成立**（C5 卡实际覆盖了，但**投影没表达**）。新增 **OI-26** 承载「按 consumer 分类哈希用途 + 哪些属身份/完整性校验必须保留」；见 §16 第 6 条 |
| FND-D-09 | 10 | major | `convergence_outline` OI-05 | 成功标准**未直接验证核心目标**（减少机制开销）；三个尺子都可能在全流程仍 >50% 时通过 | **accepted_risk** | **成立**；用户 R3-Q5 = **B（不加）**。审查者的反对意见完整保留在本行：本任务的验收**不直接证明**「机制开销净降」，只证明四批判据 + 三条总账 |
| FND-D-10 | 11 / 19 | major | `convergence_outline` OI-10 | 未明确卡死进程如何进终态、**谁清理非终态 runtime**、已完成结果如何保留、重试如何恢复 | **fixed** | **成立**。§3.8 补一张「审查生命周期状态转移与清理 owner」表（stuck / manager death / completed / cancelled / retry），区分**用户可见的等待边界**与**内部健康裁决**；见 §16 第 7 条 |
| FND-D-11 | 12 | major | `convergence_outline` OI-08 | 未明确 `large`（=`aggregate`）的 `null` 上限是否允许、如何调用、**无入口时用户看到什么失败** | **fixed** | **成立**。用户 R3-Q6 = A：允许 `null`，写死「仅 CI + 900,000 ms 只是 supervisor 兜底、不写进契约 + **必须有命令入口**」三条；同时改正了我自己写错的「900 秒是契约预算」；见 §16 第 8 条 |
| FND-D-12 | 17 | major | `objective_facts` | 送审输入**不含任何任务级 non_goals**；OI-23 引用的 PRD 内容不在送审字节里 | **fixed** | **成立，是送审包缺陷**。下一轮送审（step 10 细节审查）必须把**任务级非目标**（E-1 ~ E-20 + T-014 新增条）作为独立材料字段送进去；见 §16 第 9 条 |
| FND-D-13 | 18 | major | `convergence_outline` | 大纲未保留原始需求里的**执行入口条件**（先建 worktree、阶段准入权威、不靠 build-spec 补需求） | **fixed** | **成立**。与 FND-D-07 同批补进 OI-25；见 §16 第 5 条 |
| FND-D-14 | 20 | major | `convergence_outline` OI-05 / OI-06 | 三条总账**未证明是既有 consumer 的只读事实** | **fixed** | **成立**。给每条总账标注既有 consumer 与 owner，并写明「它们是**只读计算**，不是新对象、不新增计数器」（避开 F11）；见 §16 第 10 条 |

**处置小结**：`fixed` **11** 条、`accepted_risk` **3** 条（FND-D-03 / D-06 / D-09，均由用户在 Round 3 明确裁决）、`rejected_invalid` **0** 条、`needs_human` **0** 条。
**三条 `accepted_risk` 的争议点原文完整保留在上表**（跨仓无法闭环、20 分钟兜底与用户原话的张力、验收不直接证明开销净降），未被改写或淡化。

### 8.3 细节审查（step 10）运行事实

> **与 §8.1b 的关系**：§8.1b 记的是「同一缺陷二次复现」这一事实；本节记 detail 审查的完整运行事实与证据落点。

| 项 | 实测值 |
| --- | --- |
| 调用方式（**按当前 HEAD 重新确认，未照抄旧记录**） | `skills/wh-review/contracts/make-decision.md` 的 detail 契约 + `validateDetailReviewInput`：`materials` 只接受 `raw_requirement` / `approved_direction` / `draft_spec_or_acceptance`（另允许可选 `context_map` / `evidence_map`）。因此 `objective_facts` / `oi_terminal_records`(26) / `decisions`(24) 三个结构块**承载在 `draft_spec_or_acceptance` 文本内**，未新增第四个 material key |
| 审查形态 | **成对（red/blue）** → `runSimpleReview` → `combinePairedResults`；**任一 provider 失败即得 `available-with-failures`**，正是 bare 归一化拒绝的取值 |
| red `e19eba9a-…` | `outcome = partial`：kimi `RATE_LIMITED`（5,767 ms）、pi/v4flash completed 639,852 ms、antigravity/flash **`PUBLIC_RESULT_INVALID`**（579,793 ms）、codex/luna completed 579,790 ms |
| blue `a6290a79-…` | `outcome = partial`：kimi `PROVIDER_OUTPUT_INVALID`（568,319 ms）、pi/v4flash completed 628,365 ms、antigravity/flash completed 588,659 ms、codex/luna completed 588,659 ms |
| material_id | `57661354348cb1d3d448814de292b779a97025ed646c636ae3f7ed46956f5e35`，两 role 一致；`reused = false`（无 sink） |
| 产出 | **原始 41 条 findings**（blocking **9** / major **28** / minor **4**；red 19 / blue 22），按根因合并为 **15 项** |
| **官方记录通道** | **失败**（同 §8.1b）：`normalizeBareRecoveryResult`（`:229`）→ exit 1、stdout **0 字节**、**未写 sink** |
| 证据落点（`quality/evidence/`，文件名 = 内容 sha256） | `2f8224c3….input.json`（254,052 B 送审输入）、`339e505a….json`（118,029 B broker 恢复证据，内含 `NOT a wh-review CLI result` + 真实失败原因 + 41 条原始 findings）、`234afca2….stderr.log`（382 B）、`e3b0c442….stdout.txt`（0 B）、`c3750034….json`（6,330 B 装配注记） |
| **本阶段可声明的审查事实** | **`unavailable`**（通道失败），**不是** `conducted`、也**不是**「零 findings」；未重试、未重派 |

#### 8.3.1 ⚠️ 主会话的流程错误（如实登记，不辩解）

**审查期间 `decision-log.md` 被本会话继续改写**：装配时冻结的字节是 **176,659 B / 1,315 行 / sha256 `9bc2f510…`**，而审查结束时该文件已是 **196,361 B / 1,463 行 / sha256 `4d0437bc…`**。

- **后果**：本次 detail 审查**只覆盖冻结字节**，**不覆盖当前文件**；它在「材料身份绑定」上的 4 条 findings（原始 #8/#20/#32 等）由此诱发。
- **性质**：这是**我的流程错误**——**在审查在飞期间编辑被审材料**。正确做法是冻结后停止写入，或在写入后重派（但重派撞单轮契约与成本）。
- **处置**：不重派；本结果按「覆盖冻结字节」如实使用，材料侧差异在 §16.21 逐条对齐。

#### 8.3.2 装配方自认的三项装配缺陷（记在装配注记 `c3750034…` 里）

1. `requires_user_decision` **误解析**材料里的 `**true**`（波及 18 条）；
2. 头部引用的源 sha 与实际交付字节不一致（诱发 4 条 identity findings）；
3. `source_ref` 行号偏移 8–11 行。

### 8.4 细节审查 15 项（原始 41 条去重）逐条处置

> `status` 取值 = `fixed` / `rejected_invalid` / `accepted_risk` / `needs_human`。原始 41 条全文保留在 §8.3 的证据落点里，本节只记处置。

| finding_id | severity | 问题（一句话） | status | 处置 |
| --- | --- | --- | --- | --- |
| FND-T-01 | blocking | `approved_direction` 身份绑定不成立（头部声明的 sha/字节与交付包不符） | **fixed** | 归因清楚：**runner packet 脱敏** + **我在审查在飞期间改写材料**（§8.3.1，我的流程错误）。处置 = §16.21 第 1 条：材料里**不再声明源 sha/字节**，改为「以 `decision-log.md` 为唯一权威源」的指针式表述 |
| FND-T-02 | blocking | OI 权威分叉：§2.4 的 v1/24 条 与 §16 的 v1.1/26 条 并存 | **fixed** | §16.21 第 2 条：**合并为单一 v1.1 权威表**（26 条，含 `task_id` / `outline_version` / `impact_dimensions` / `requires_user_decision`），旧表标注「已被 v1.1 表取代」 |
| FND-T-03 | blocking | **历史 finding**：当时 §3.6 与 §16.14 对行型字段名冲突 | **fixed then superseded** | 历史修复曾等待新名；post-merge amendment 现接受 frozen `record_kind: stage \| close_action`，`HANDOFF-T2-006` closed |
| FND-T-04 | blocking | C4 生命周期：v3 无 `stalled` 终态，心跳阈值与清理 owner 未定 | **fixed** | **R4-Q2 = A**：§16.21 第 4 条写死映射规则 —— 判死产生终态时用**现有合法 outcome**（`SESSION_MANAGER_LOST` 失败组 / `unavailable`），`stalled` **只作 wh-review 侧归类标签**；阈值仍留 OPEN-001 给跨仓实现定 |
| FND-T-05 | blocking | 非目标 E-16「本任务不实现任何删除」与 C5/C6 的删除冲突 | **fixed** | §16.21 第 5 条：**在材料内收窄 E-16 的适用范围** —— E-16 约束的是**写 PRD 的那个任务**（D-019），对**执行任务**不适用；§3.7 原有说明升格为显式边界 |
| FND-T-06 | blocking | 送审的「待审方案」未含四卡的 FR/AC/oracle ⇒ 被判「不是可执行规格」 | **fixed** | **R4-Q1 = A**：§16.21 第 6 条声明**阶段边界** —— detail 审查的对象是 **OI 终态记录 + 决定链 + 事实**；四卡细节在任务组 PRD（附**卡号 + PRD 行号**具名引用），`spec.md` 由 build-spec 产出，本阶段不产出也不应产出 |
| FND-T-07 | major | `oi_terminal_records` 缺 `task_id` / `outline_version` / `impact_dimensions`；`requires_user_decision` 有错 | **fixed** | 两个来源分别处置：**18 条不匹配 = 装配方自认的解析失误**（§8.3.2 第 1 条，不属材料缺陷）；**字段缺失 = 装配缺口** → §16.21 第 2 条的 v1.1 权威表**逐条补齐四个字段** |
| FND-T-08 | major | OI-25/OI-26 终态不合规（`requires_user_decision: null`、disposition 整节粘贴、未并入大纲） | **fixed** | 同 FND-T-07：两条件并入 §16.21 第 2 条的 v1.1 权威表，字段取本记录 §16.5/§16.6 的合法值 |
| FND-T-09 | major | C9 的 §16.3 / §16.8 硬前置未进 OI-08 终态；改名波及 20 文件违最小改造 | **fixed** | §16.21 第 7 条：OI-08 终态**吸收三条硬前置与 `aggregate` 三条硬约束**，并写明「三条不满足即按死代码处理、不得交付」；改名的最小改造争议保留在 RISK-001（用户已知情并维持） |
| FND-T-10 | major | C6 的六类具名 ref 等值校验不可执行；`current-close-projection.mjs` 无终局处置 | **fixed** | **R4-Q4 = A**：§16.21 第 8 条给**可执行的闭集**（六类各自的 ref 形态与 glob 禁令），并定死 `current-close-projection.mjs` 由 **C6 改写**（去掉 `product_release` 域、换成具名 ref 读取），**不删文件** |
| FND-T-11 | major | C5/OI-26 的「9 个标识符 / 993 处」未逐项分类 ⇒ 零残留不可证伪 | **fixed** | §16.21 第 9 条：在 §3.5 C5 条**列出 9 个标识符的字面量**并给出可复算 grep 口径；OI-26 的四类分类（A 身份/完整性、B 失效链、C 并行快照/变体、D 无 consumer 残留）与逐类处置一并写死 |
| FND-T-12 | major | 写口第三项：§3.5 的旧文案 vs §16.11 的新文案/比对对象冲突 | **fixed** | §16.21 第 10 条：统一为「**真实现**，比对『即将写入的字节』与『已认证来源的字节』，不符 fail-loud」；旧的 `path card source hash is stale` **随 path-card 一起删除**，不再声称保留 |
| FND-T-13 | major | 验收不直接度量「>50% 花在机制上」 | **accepted_risk** | **与方向审查 FND-D-09 同源**；用户已在 R3-Q5 明确选择**不加**行为型判据。本条**不改写、不淡化**，RISK-009 已登记该缺口 |
| FND-T-14 | major | 跨仓三处对不上：OI-01 仍写「一条合并列车」；`unknown` 与「unknown≠完成 + 零延期」无出口；人工确认点无「被拒」分支 | **fixed** | **R4-Q3 = A**：§16.21 第 11 条写死出口 —— 被拒/无响应则 **C4 只交付本仓消费侧**、跨仓标 `unknown`、**任务不因此停批**；并写明「unknown ≠ 完成」**只适用于跨仓部分**；OI-01 终态同步收窄 |
| FND-T-15 | minor | 计数与编号：交接项 5 vs 7、§8.2 的 `fixed` 10 vs 11、D 编号跨命名空间 | **fixed** | 三处已修正：交接项统一为 **7**（§9 D-017 + §15）；§8.2 小结改为 `fixed` **11**；§16.21 第 12 条把 C6 条里的 D 编号**显式标注为母决定的编号**，与本记录的 D-001~D-024 区分 |

**处置小结**：`fixed` **14** 条、`accepted_risk` **1** 条（FND-T-13，与 FND-D-09 同源）、`rejected_invalid` **0** 条、`needs_human` **0** 条。

## 9. 决定

> 组织方式：按框架的 solution / 裁决模块分组，每组一个 `### <模块>`；模块内按因果链顺序（需求/问题 → 事实/约束 → 选项 → 决定 → 特征/consumer → 验收）。
> 每条决定记录 `module` / `requirement_ids` / `artifacts` 三个纯文本链字段与 `derived_from`；**它们只是文档字段，不是 runtime gate**。
> `approval_binding` 在 step 11 用户最终确认后统一回填。

### M-需求权威与验收尺子

#### D-001 · 验收以四张卡各自的判据为主，任务级三条总账做一次核对

- **module**: 需求权威与验收尺子
- **derived_from**: []
- **requirement_ids**: [R-001, R-005, R-006]
- **question / final_option**: 这个任务做到什么程度算「成了」？→ **以四张卡各自的 FR/AC/oracle 为准；四批都过之后再用任务级三条总账核对一次**。
- **recommendation / plain_language**: 推荐项且被采纳。含义：每张卡用它自己写好的可跑判据来验；最后再算一次「净减了多少行 / 每个任务留下几个记录文件 / 有多少没人读的对象」，回答「整体是不是真的变简单了」。
- **source_type / reference / exact_excerpt**: 真实用户答复（本会话 Talk Round 1）：「A（推荐）以四张卡各自的判据为准，最后再用三条总账核对一次」。
- **facts_and_constraints**: 四张卡各带 FR/AC/oracle（C9 5+9+5、C4 19+20+10、C5 8+9+8、C6 11+15+15）；任务级三条总账的定义来自母决定 D-015 与 PRD C0；禁止无范围全量回归。
- **Logic**: 单卡判据可逐条复算 -> 但没有统一分母看不出整体趋势 -> 用三条总账补一个任务级视角 -> 两层分工，互不替代。
- **choice_reason / impact**: 决定「验收尺子」；影响每一步的「做完」声明与任务Ⅲ C8 的验收输入。
- **consequences_and_risks**: 判据条目多（合计 43 条 AC），逐条跑要花时间；部分判据需要真跑测试。风险 = 时间成本高于只看总账。
- **rejected_alternatives**: ① 只看三条总账（太粗，单卡做没做到位看不出，且 C9 净增会被总账压住）；② 以端到端跑通一次五阶段为准（要真跑任务，用户此前明确否过「为采基线新跑真实任务」）。
- **unresolved_items / owner**: 无。
- **Supersedes**: none

#### D-002 · 不做外部调研

- **module**: 需求权威与验收尺子
- **derived_from**: [D-001]
- **requirement_ids**: [R-001, R-003]
- **question / final_option**: 开工前要不要做一轮外部调研？→ **不做，记 `skipped` 并写明理由**。
- **recommendation / plain_language**: 推荐项且被采纳。含义：要回答的问题都能在仓库里查到（含第二个仓库的源码），外部知识改变不了方向。
- **source_type / reference / exact_excerpt**: 真实用户答复（Talk Round 1）：「A（推荐）不做，直接记「跳过」并写明理由」。
- **facts_and_constraints**: 五个待答方向问题的答案全在仓内可复算事实里；唯一涉及外部世界的 provider 停滞行为已由 D-030 交给 3rd-review 仓决定。
- **Logic**: 问题可由仓内事实证明 -> 外部调研无法改变方向 -> 跳过并登记理由，避免把「研究」当成推迟决策的借口。
- **choice_reason / impact**: 决定 step 4 的执行状态；影响交付周期。
- **consequences_and_risks**: 若某 provider 的行为只能靠外部文档解释，只能如实标 `unknown`。风险 = 个别结论的证据强度弱于有外部来源时。
- **rejected_alternatives**: ① 做一次窄调研（进程停滞与健康判死惯例）——那部分是跨仓实现细节，本任务定不了；② 只补读 3rd-review 仓——已由子代理完成，作为事实登记更准确。
- **unresolved_items / owner**: 无。
- **Supersedes**: none

### M-执行面（C9）

#### D-003 · 测试档位名一次性改到底：`medium` → `phase`、`large` → `aggregate`

- **module**: 执行面（C9）
- **derived_from**: [D-001]
- **requirement_ids**: [R-009, R-006]
- **question / final_option**: 材料写的档位名（`inner`/`phase`/`aggregate`）与仓库现有名（`inner`/`medium`/`large`）不一致，怎么落？→ **把仓库里的值改名成 `phase`/`aggregate`，一次性改到底，并排为 C9 的第一步**。
- **recommendation / plain_language**: 用户**未选推荐项**（推荐项是「不改名、写死映射」）。含义：代码与材料同名，以后没人会搞混；代价是这一步会动一个被 20 个文件引用、且绑定了执行环境权限的共享契约。
- **source_type / reference / exact_excerpt**: 真实用户答复（Talk Round 2 第一批 T-005）：「B 把仓库里的 medium/large 改名成 phase/aggregate」；回显波及面后（T-010）确认：「A 维持改名，接受上述波及面，并在计划里把它排成 C9 的第一步」。
- **facts_and_constraints**: `TEST_RUNTIME_PROFILE_NAMES = ["inner","medium","large"]`（`stage-content-contracts.mjs:57`）；`TEST_RUNTIME_PROFILE_LIMITS_MS = {inner:60000, medium:300000, large:null}`（`:58-62`）；值绑定权限语义 —— `large` 要求 `permissions.environment === "ci_only"`（`:161/:184-185`）、`medium` 要求 `local_ci` 或 `ci_only`（`:186`）；错误文案写死「inner, medium, or large」（`:152`）；引用该常量的文件 **6 个**（含 4 个测试）；提到 `runtime_profile` 的文件 **20 个**（含 `core/task-close.mjs`、`stage-runner.mjs`、`stage-handlers.mjs`、`canonical-receipt-writer.mjs`）；存在 ADR `docs/adr/0027-test-feedback-runtime-profile.md`；`stage-content-contracts.mjs` **同时是 C5/C6 的改动目标**。
- **Logic**: 三档节奏需要名字 -> 材料名与代码名不一致会长期误导 -> 用户选择统一到材料名 -> 必须连权限语义、错误文案、测试与 ADR 一起改，否则改名不彻底反而更乱。
- **choice_reason / impact**: 决定 C9 的第一步与整个任务的冲突面；影响 C9 的净增行数、C5/C6 的串行位置、以及任务Ⅲ C7 的 ADR 同步。
- **consequences_and_risks**: 风险 ①**改名本身在母决定 D-002 里被列为失败形态**（「把删除替换成搬家/改名」）——本任务登记为有意偏离，理由 = 这里不是拿改名替代删除，而是消除「材料名≠代码名」；风险 ②这一步把 C9 从「只接线」变成「改共享契约」，是四批里冲突面最大的一步；风险 ③改 ADR 会与任务Ⅲ C7 的治理同步撞车，已登记 `HANDOFF-T2-001`；④ 波及 4 个既有测试，必须同批处置。
- **rejected_alternatives**: ① 不改名、只在材料里写死映射（用户 T-010 改选为维持改名）；② 只改对外名字、代码内部不动（多一层「名字↔名字」映射，错误文案易对不上）。
- **unresolved_items / owner**: ADR 与治理文本的同步由任务Ⅲ C7 承接（`HANDOFF-T2-001`）。
- **Supersedes**: none

#### D-004 · C9 保持四条范围、净增在任务级账上单列

- **module**: 执行面（C9）
- **derived_from**: [D-003]
- **requirement_ids**: [R-009, R-005]
- **question / final_option**: C9 是唯一净增的卡，而整改主线是「净减控制面」。怎么记账？→ **接受 C9 净增（含 D-003 改名带来的额外行数），在任务级账上单列并写明由其余批次吸收；不为凑数字删任何东西**。
- **recommendation / plain_language**: 推荐项且被采纳。含义：C9 的活是「把已有的东西接上」，天生会变胖；这个胖要摊开写清楚，而不是靠删别的东西抹平。
- **source_type / reference / exact_excerpt**: 用户 T-001（尺子 = 卡判据 + 任务级总账）、T-006（新增文件归属）、T-014（不加「C9 也必须净减」的分支）。
- **facts_and_constraints**: PRD C9 §18 申报净增约 +35~+90 行；母决定 D-002 要求「净减法给出具名删除清单」；PRD E-12/否决项禁止「硬拦截改动文件数」与「为让数字好看而删」。
- **Logic**: C9 本质是把现有能力接上线 -> 必然净增 -> 若强求净减只能删守卫或测试 -> 撞用户明确禁止的形态 -> 改为任务级单列 + 由 C1/C2/C5/C6 的净减吸收。
- **choice_reason / impact**: 决定净减账的诚实形态；影响 C8 的 M4 判据解释。
- **consequences_and_risks**: 风险 = 「唯一净增卡」在总账里显眼，可能被误读为整改失败；已通过在 §3.5 写明「任务级判据只对全任务成立、C9 单卡不适用」来消解。
- **rejected_alternatives**: ① 要求 C9 也净减（只能删守卫/测试，用户 T-014 明确否掉）；② 缩减 C9 范围去掉 preflight（会丢掉「坏命令开工前被拦下」这条真实收益）。
- **unresolved_items / owner**: C9 的准确净增行数需在本任务 build-code 后实测回填。
- **Supersedes**: none

#### D-005 · 先评估能否复用现有耗时测量工具，再决定是否新增

- **module**: 执行面（C9）
- **derived_from**: [D-004]
- **requirement_ids**: [R-009, R-005, R-004]
- **question / final_option**: 基线之后新增的 `tools/cli/measure-test-runtime-profile.mjs`（786 行）与 C9 的分档目标高度重合，怎么办？→ **C9 先评估它能否复用；能复用则复用，不能复用则登记为「已知重复」并列进交接项**。
- **recommendation / plain_language**: 推荐项且被采纳（T-006 的 A 项里第 ③ 条）。含义：先看看现成的轮子能不能用，不要又造一个。
- **source_type / reference / exact_excerpt**: 用户 T-006：「A（推荐）按「谁的目标撞到它谁负责」逐项定归属」。
- **facts_and_constraints**: 该文件会 create-only 写 profile JSON + manifest；消费者只有 1 个测试，`run-checks.mjs` 只按路径读回、不 import；PRD 与任务Ⅰ 材料均未登记它。
- **Logic**: 已有同类工具 -> 先评估复用 -> 避免「整改期间新增控制面」-> 不能复用则如实登记重复而不是假装不存在。
- **choice_reason / impact**: 影响 C9 的实现选型与净增行数。
- **consequences_and_risks**: 风险 = 若判定「不能复用」，本任务会保留一处重复实现，需由任务Ⅲ 处理。
- **rejected_alternatives**: ① 直接删掉它（无依据：它有真实消费者——一个契约测试）；② 直接忽略它（会让 C9 重复造轮子，撞 D-014 的任务级非目标）。
- **unresolved_items / owner**: 复用判定的结论在本任务 build-code 产出，未复用时进 `HANDOFF-T2-004`。
- **Supersedes**: none

### M-审查生命周期（C4）

#### D-006 · 审查卡死由 3rd-review 的健康判死收场；20 分钟有界等待降级为显式兜底

- **module**: 审查生命周期（C4）
- **derived_from**: [D-001]
- **requirement_ids**: [R-007, R-005]
- **question / final_option**: 审查卡住时由谁收场？→ **补齐 3rd-review 侧的健康判死当主机制；已有的 20 分钟有界等待保留，但显式标注为兜底、不得成为主机制**。
- **recommendation / plain_language**: 推荐项且被采纳。含义：让审查系统自己检查出「这次审查已经失败了」并自己收进终态；外面那个 20 分钟的上限不删，但只在健康判死失灵时才起作用，并且要在代码和材料里写清楚它只是兜底。
- **source_type / reference / exact_excerpt**: 真实用户答复（Talk Round 1 T-003）：「A（推荐）按原方向补齐 3rd-review 的健康判死当主机制，20 分钟上限保留但明确标成「兜底」」。原始需求原话（母决定 L24）：「我不希望通过timeout来停止这种审查，还是要通过3rd-review的健康的检查来自动关闭失败的审查进程……再也不要被这种无止尽的审查浪费时间了」。
- **facts_and_constraints**: 本任务基线实测 —— `DEFAULT_MANAGED_TERMINAL_WAIT_MS = 1_200_000`（`simple-review-runner.mjs:37`，基线时是 `null`）；到点抛 `REVIEW_WAIT_EXCEEDED` 并被映射为 `stalled`（`review-result.mjs:151-152`）；**不调用 `cancelManaged`**（全仓 0 调用点）⇒ provider 变孤儿；3rd-review @ `a96f28b7`：`health-runner.mjs:54` 的 `PROCESS_STALLED` **只诊断不终止**（`:72` 明确不 SIGTERM 活进程），`runtime.mjs:33-37` 的 `ownerConfirmedDead` 只比 `pid/uid/lstart`、**零时间维度**（无心跳过期判死），`runtime.mjs:108` 对非终态 managed runtime 的 cleanup **直接跳过**（与 `simple-review-runner.mjs:32` 注释「orphans are reaped by cleanup」不一致）；v3 outcomes **无 `stalled`**（`review-provider-client.mjs:127`）；`managedPublic` 只有 `{version, request_id, runtime_id, state, material_id}` 且有 `exactKeys` 严格校验 ⇒ 加字段会直接 `PROTOCOL_INCOMPATIBLE`；母决定 D-030④ 明确允许有界等待**只作次要防线且必须显式标注为兜底**。
- **Logic**: 外层 timeout 会误杀健康审查、又会放任卡死审查 -> 必须是审查侧的健康裁决 -> 3rd-review 已有诊断但未接线，且对无 probe 的 provider 完全无效 -> 选「心跳过期判死」为对全体 provider 有效且协议零变更的主机制 -> 兜底保留但降级 -> 本仓只消费不自造墙钟判定。
- **choice_reason / impact**: 直接决定 R-013 是否成立；影响 C4 的 FR/AC/oracle 与跨仓交付。
- **consequences_and_risks**: ①跨仓改动不经过本任务的提交/合并流程，可能留下未提交改动；②本任务验收只能证明「调用侧接对了」，判死逻辑本仓不可闭合（标 `unknown`）；③存在误杀慢 provider 的风险，故必须用「心跳」而非「无输出」界定；④源码注释所引「用户决定 option B」在全部任务材料里**找不到具名记录**（§4.5），已如实登记为未核验的 provenance 断言。
- **rejected_alternatives**: ① 认 20 分钟上限当机制（R-013 实际不成立，且每次卡住留孤儿）；② 去掉上限回到无限等（在健康判死做完之前会无限挂住，正是当初 37 分钟空转的原因）。
- **unresolved_items / owner**: 3rd-review 侧心跳与 `PROCESS_STALLED` 接线的具体阈值（D-030 unresolved_items 明确留给实现时定）；`stalled` 在下游结果映射中的语义（是否等同 unavailable、如何计入阶段完成行）。
- **Supersedes**: 修正任务组 PRD `C4-FR-10②` 的字面表述（PRD 要求回到 `=null`；本任务不回到 `null`，而是保留取值并改写语义为「兜底」）。

#### D-007 · 跨仓交付：本任务同时交付两仓，跨仓部分标 `unknown`

- **module**: 审查生命周期（C4）
- **derived_from**: [D-006]
- **requirement_ids**: [R-007, R-001]
- **question / final_option**: C4 的主体在另一个 git 仓库里，而本流程的提交/合并/收口只管本仓。跨仓部分怎么交付？→ **本任务同时交付两仓；3rd-review 侧在它自己的 main 上单独提交并跑它自己的测试；本任务验收只覆盖调用侧，判死逻辑标 `unknown`**。
- **recommendation / plain_language**: 推荐项且被采纳。含义：一次做完，但你最初的要求能否算达成，本任务只能证明一半——判死本身要靠那边自己的测试来证。
- **source_type / reference / exact_excerpt**: 真实用户答复（Talk Round 2 第一批 T-007）：「A（推荐）本任务同时交付两个仓库，跨仓部分标 unknown」。
- **facts_and_constraints**: `/Users/Hugh/Hugh/Project/3rd-review` 是独立 git 仓库（`main` @ `a96f28b7`，工作区干净，另有 1 棵 codex worktree）；母决定 D-030⑤ 明确要求「跨仓交付项必须登记接收方、接口契约与验收判据，不以延期形态留存」；本仓 `activeWorkspace` 只覆盖本任务 worktree。
- **Logic**: D-030 的能力横跨两仓 -> 只做本仓则主机制无人实现 -> 另开任务则要多走一轮五阶段且期间审查仍会卡 -> 选「同时交付 + 如实标不可闭合」。
- **choice_reason / impact**: 决定任务边界与完成声明的诚实口径。
- **consequences_and_risks**: 跨仓改动没有流程保护，一旦改坏只能靠 Git 历史恢复；完成声明必须写明「跨仓部分本仓不可闭合」。已登记 `HANDOFF-T2-003`。
- **rejected_alternatives**: ① 另开独立任务（多一轮流程，且消费侧改完后要等对方）；② 不动第二个仓库（T-003=A 落空，R-013 无人落地）。
- **unresolved_items / owner**: 3rd-review 侧改动的提交时机与分支策略由主会话在 **D-008 的确认点**向用户呈报后决定。
- **Supersedes**: none

#### D-008 · 动第二个仓库之前加一个人工确认点

- **module**: 审查生命周期（C4）
- **derived_from**: [D-007]
- **requirement_ids**: [R-002, R-004]
- **question / final_option**: 完整用户流程按哪种形态？→ **沿用任务Ⅰ 的形态（四批串行、逐批可见结果 + 停止条件、不加日常确认点），但在「动第二个仓库」之前加一个人工确认点**。
- **recommendation / plain_language**: 推荐项且被采纳。含义：日常不打断你，只有那一次不可逆的跨仓动作前会停下来问你。
- **source_type / reference / exact_excerpt**: 真实用户答复（Talk Round 2 第二批 T-012）：「A（推荐）沿用任务Ⅰ 的形态，但「动第二个仓库」前加一个人工确认点」。
- **facts_and_constraints**: CONSTITUTION F9「推进/不可逆操作经人确认」；跨仓改动不在本任务授权范围内。
- **Logic**: 四批本身可逆且各有停止条件 -> 不需要日常确认点 -> 跨仓改动不可逆且无流程保护 -> 只在该处加一个确认点。
- **choice_reason / impact**: 决定确认点数量与不可逆动作的保护强度。
- **consequences_and_risks**: 只有那一次介入机会，前面三批的问题要到批末才暴露（但每批都有停止条件兜底）。
- **rejected_alternatives**: ① 完全沿用不加确认点（跨仓改动无保护）；② 每批都加确认点（要打断用户五次，且与「机制占用 >50%」的抱怨相悖）。
- **unresolved_items / owner**: 确认点的具体呈报内容（改哪些文件、改成什么、怎么验收、失败怎么办）在 C4 开工时给出。
- **Supersedes**: none

#### D-009 · 修 T-11：把协议版本加进审查请求身份，并实跑验证一次

- **module**: 审查生命周期（C4）
- **derived_from**: [D-006]
- **requirement_ids**: [R-007, R-001]
- **question / final_option**: 审查请求身份确定性但不含协议版本，协议一改同一材料在 24 小时内无法重跑（实测撞过两次）。修不修？→ **修：把协议版本加进请求身份，并实跑验证一次**。
- **recommendation / plain_language**: 推荐项且被采纳。含义：让「改了协议之后的同一份材料」能直接重跑，不必靠换材料或等一天。
- **source_type / reference / exact_excerpt**: 真实用户答复（Talk Round 2 第二批 T-011）：「A（推荐）修：把协议版本加进请求身份，并实跑验证一次」。
- **facts_and_constraints**: `managedRequestId` 的 identity = `stableValue({material_id, host_provider, providers, provider_identities, review_mode, prompt, subject})`（`simple-review-runner.mjs:102-114`），**无协议版本、无 nonce、无时间**；broker 侧按 `sha256(request_id)` 建 bindings 目录，同一 id 绑到不同 request 时抛 `REQUEST_ID_CONFLICT`；TTL 默认 24h；**该身份是本地计算的，与 `managedPublic` 的 `exactKeys` 字段集不是一回事**（PRD 的反对理由经实测不成立）。
- **Logic**: 通道修复本身会改协议 -> 改完同一材料跑不起来 -> C4 自己的验收会被卡死 -> 修请求身份比绕过去更省。
- **choice_reason / impact**: 决定 C4 验收是否可重复；影响跨仓接口契约。
- **consequences_and_risks**: 偏离 PRD 原判（PRD 明写「不为它造机制」）；**未实跑验证前不能声称已解决**——实跑是判据的一部分。
- **rejected_alternatives**: ① 维持 PRD 只登记（C4 验收可能得靠换材料绕过，证据不完整）；② 推到 3rd-review 仓改（把可本地解决的问题推给另一个仓库，两仓各一套逻辑）。
- **unresolved_items / owner**: 实跑验证的结果在 C4 build-code/verify 阶段回填；若实跑失败则回到本决定重新裁定。
- **Supersedes**: 修正任务组 PRD 的 T-11 处置结论（PRD：「不为它造机制」；本任务：修）。

### M-记录与失效链（C5）

#### D-010 · 写口只保留三项身份核对，`identity/path-cards/**` 整类删除

- **module**: 记录与失效链（C5）
- **derived_from**: [D-001]
- **requirement_ids**: [R-008, R-002]
- **question / final_option**: 删掉哈希失效链之后，写入口保留什么？→ **保留唯一一次核对，恰三项：`task_id` + 工作区路径 + 待写字节；`identity/path-cards/**` 整类删除**。
- **recommendation / plain_language**: 由上游决定直接回答（母决定 D-009②+D-009①、PRD 裁定 J-3）且被任务Ⅰ 明确移交（`HANDOFF-001`）。含义：写东西之前还是核对身份，但只核对这三样，不再维护任何「材料改了就失效」的链。
- **source_type / reference / exact_excerpt**: 母决定 D-009②「写口保留一次窄核对（task_id+工作区路径+待写字节），不经 snapshot、不匹配 fail-loud」；用户原话（母决定 L81）：「我希望去掉哈希这件事，不要总是去检查哈希，正常改动是正常的流程，不用总是返工、重审」；任务Ⅰ `HANDOFF-001`。
- **facts_and_constraints**: 当前写口实参 **13 项**（含 `project_name`/`stage`/`operation`/`contracts` 三哈希/`source_digest` 等）；「待写字节」在 `write-boundary-preflight.mjs:217`；9 个哈希失效链标识符生产侧命中 **993 处**（基线 955）；`identity/path-cards/**` 生产命中 **7 处**（`createPathCardRecord` / `PATH_CARD_WRITERS` / `persistWriteBoundaryPathCard` 落盘分支），**零生产 reader、零测试引用**，函数自述 `informational_only`。
- **Logic**: 失效链让「改一个文件」触发全面返工 -> 删链 -> 写口仍需最小身份保证 -> 保留恰三项、第三项改内存内比对（不落 card）-> 错误文案不变，强度不放宽。
- **choice_reason / impact**: 直接实现「绿灯一次就够、不要改一点就变一下」。
- **consequences_and_risks**: 风险 = 保留层被做胖（故必须逐项点名禁止字段）；path-cards 删除后字节比对的强度不能降，否则是用删除换放宽。
- **rejected_alternatives**: ① 连三项核对一起删（会把写口变成不校验身份，违反 CONSTITUTION F3/F9）；② 把 path card 迁到别处（等于搬家，撞 D-002）。
- **unresolved_items / owner**: `core/task-close.mjs` 的 planning 分支哈希校验**归 C6**（X47），C5 只登记不删。
- **Supersedes**: none

#### D-011 · C5 的零残留检查清单补进两个文件

- **module**: 记录与失效链（C5）
- **derived_from**: [D-010]
- **requirement_ids**: [R-008, R-005]
- **question / final_option**: 基线后新增的 `produce-final-current-snapshot.mjs`（含 `material_revision` ×4、`snapshot_tree` ×4、`quality/verify.json` ×1）与 `validate-current-plan-tasks.mjs`（各 ×1）不在 C5 的 oracle 清单里，怎么办？→ **补进 C5 的检查清单**。
- **recommendation / plain_language**: 推荐项且被采纳（T-006 的 A 项里第 ② 条）。含义：不补的话，C5 那句「生产代码零残留」在字面上就是假的。
- **source_type / reference / exact_excerpt**: 用户 T-006：「A（推荐）按「谁的目标撞到它谁负责」逐项定归属」。
- **facts_and_constraints**: 两文件均由 `b6049afa` 加入，PRD 与任务Ⅰ 材料均未登记；`produce-final-current-snapshot.mjs` 会 create-only 写 `$TASK_DIR/quality/tests/final/current-snapshot.json`；`validate-current-plan-tasks.mjs` 仅 `--output` 给定时写盘，且任务Ⅰ 已把它列为 C1 Tier B 删除候选。
- **Logic**: 判据的覆盖面必须与仓库真实命中一致 -> 清单漏项会让判据假绿 -> 补进清单。
- **choice_reason / impact**: 决定 C5 判据是否可证伪。
- **consequences_and_risks**: C5 范围扩一个文件，改动量与串行冲突面略增。
- **rejected_alternatives**: ① 不管（判据假绿）；② 收窄判据到原清单（为通过而放宽断言，PRD 明令禁止）。
- **unresolved_items / owner**: 若 `validate-current-plan-tasks.mjs` 最终被任务Ⅰ C1 删除，则本项随 C1 合入自动关闭。
- **Supersedes**: none

### M-收口与状态（C6）

#### D-012 · 主线前进只报一条普通根因行

- **module**: 收口与状态（C6）
- **derived_from**: [D-001]
- **requirement_ids**: [R-002, R-008]
- **question / final_option**: C6 要求「main 前进了不要卡住 close，只在 status 里报一句 stale」，这句话长什么样？→ **作 status 根因行里的一条普通条目，带具体来源（例如「主线已从 X 前进到 Y」），不新增字段、不新增投影**。
- **recommendation / plain_language**: 推荐项且被采纳。含义：跟其他根因同形同待遇，人一眼能看到，机器也不用学新字段。
- **source_type / reference / exact_excerpt**: 真实用户答复（Talk Round 2 第一批 T-009）：「A（推荐）当成根因行里的一条普通条目，带具体来源」。
- **facts_and_constraints**: 当前 base OID 冻结点全部是 `throw`（`workspace.mjs:331-332/:341/:357`、`task-close.mjs:1660/:1661/:1683-1684`），无一处报 stale；status 当前返回对象有 11 条键语句（`stage-runtime.mjs:762-773`）；C6 的目标是「只报根因」。
- **Logic**: 主线前进是常见情形 -> 硬失败会卡住收口 -> 改成可见的事实条目 -> 但不能变成新投影（否则与 C6 自己的目标相反）-> 用既有根因行承载。
- **choice_reason / impact**: 决定 status 的最终形状与 C6 判据的可观察性。
- **consequences_and_risks**: 根因行会多一条，需保证只在真的前进时出现，否则变噪音。
- **rejected_alternatives**: ① 单独加 status 字段（新增投影，与 C6 目标相反，且 status 已够长）；② 不显示只记录（人看不到落后，close 时才发现冲突）。
- **unresolved_items / owner**: 无。
- **Supersedes**: none

#### D-013 · `current-close-projection.mjs` 由 C6 同批处置

- **module**: 收口与状态（C6）
- **derived_from**: [D-012]
- **requirement_ids**: [R-008, R-002]
- **question / final_option**: `runtime/stage/current-close-projection.mjs`（256 行）是 status/close 的**活生产 reader**、含 `product_release` 域、且被治理登记表标为 `retain`；而 C6 要收掉 product-release 投影。怎么办？→ **C6 同批处理它**（改它或并掉它），不得只改一半留下读一个已删域的活 reader。
- **recommendation / plain_language**: 推荐项且被采纳（T-006 的 A 项里第 ① 条）。含义：删东西的时候必须把读它的人一起处理，否则一改就坏。
- **source_type / reference / exact_excerpt**: 用户 T-006：「A（推荐）按「谁的目标撞到它谁负责」逐项定归属」。
- **facts_and_constraints**: 该文件零 import、自述 "owns no store and writes no record"；生产消费者 `tools/cli/task-close.mjs:27,136`；已登记进 `docs/architecture/control-plane-inventory.json`（disposition = `retain`）；含 `product_release`（`:11/:237/:246`）；`material_revision`/`snapshot_tree`/`quality/verify.json`/`status_groups`/`index.json` 均 0 命中。
- **Logic**: C6 收投影 -> 必须同时处理它的 reader -> 否则 status/close 直接坏 -> 归 C6 同批。
- **choice_reason / impact**: 决定 C6 的改动面与 status/close 的正确性。
- **consequences_and_risks**: 会动到治理登记表（`control-plane-inventory.json`），需与任务Ⅲ C7 的治理同步对齐。
- **rejected_alternatives**: ① 全留给任务Ⅲ（C6 改完 status/close 会留一个读已删域的活 reader）；② 不动（同前）。
- **unresolved_items / owner**: 治理登记表的同步归属在 build-plan 里与 C7 分工写清。
- **Supersedes**: none

### M-流程、失败与非目标

#### D-014 · 某一批做不完就停在那批

- **module**: 流程、失败与非目标
- **derived_from**: [D-001]
- **requirement_ids**: [R-002, R-001]
- **question / final_option**: 中间某批卡住怎么办？→ **停在那批，如实记「没做完 + 卡在哪」，后面批次不开工**。
- **recommendation / plain_language**: 推荐项且被采纳，与任务Ⅰ 的选择一致。含义：不把问题带到下一批。
- **source_type / reference / exact_reply**: 真实用户答复（Talk Round 1 T-004）：「A（推荐）停在那批，如实记「没做完 + 卡在哪」，后面的批次不开工」。
- **facts_and_constraints**: 四批串行且 C5/C6 改同一批文件；PRD E-13 禁止任务级延期；四类状态语义（`completed`/`unavailable`/`incomplete`/`partial`）已写入 §3.8。
- **Logic**: 批次间有真实依赖 -> 跳过会让后面的批次不可验证 -> 停在原地 + 如实记录 + 不伪造完成。
- **choice_reason / impact**: 决定失败边界；影响进度可预测性。
- **consequences_and_risks**: 整个任务会停在某处等用户介入，进度取决于响应速度。
- **rejected_alternatives**: ① 跳过继续（依赖不成立，等于把卡住搬两个地方）；② 降级为只登记（登记项无强制机制，正是 E-13 禁止的延期形态）。
- **unresolved_items / owner**: 无。
- **Supersedes**: none

#### D-015 · 新增任务级非目标：整改期间不得「净」新增控制面

- **module**: 流程、失败与非目标
- **derived_from**: [D-004, D-005]
- **requirement_ids**: [R-005, R-004]
- **question / final_option**: 是否给本任务加一条针对「改动会再加东西」的任务级约束？→ **加：整改期间不得「净」新增控制面（新对象 / 新 public command / 新 schema / 新持久化字段）；确有必要的必须当场写明唯一 consumer、owner、替代关系与删除条件。宪法级负向条款仍归任务Ⅲ C7。**
- **recommendation / plain_language**: 推荐项且被采纳。含义：你最初那句「改动会再加东西」在本任务里当场生效，不等最后一轮。
- **source_type / reference / exact_excerpt**: 真实用户答复（Talk Round 2 第三批 T-014）：「A（推荐）加一条任务级非目标：不得净新增控制面，必要的当场写清 consumer/owner/删除条件」。原始需求原话（母决定 L12）：「我觉得这个方案就算实施了，未来也一样会出现很多阻塞和问题」。
- **facts_and_constraints**: 实测证据 —— PRD 定稿之后 main 上多了 **4 个生产文件、合计 2,179 行**，其中 2 个会写盘、1 个是 status/close 的活 reader，**PRD 与任务Ⅰ 材料均未登记**；CONSTITUTION F11 禁止「另造计数器来检查是否足够简单」⇒ 本约束靠材料纪律执行，不新增检查器。
- **Logic**: 前一波已经长出新控制面 -> 只在最后一轮拦太晚 -> 本任务自己加任务级约束 -> 但只能用「净」口径（C9/改名天然净增）-> 且必须当场登记 consumer/owner/删除条件。
- **choice_reason / impact**: 直接回应 R-005；影响四批的实现选型与 C8 的净减验收。
- **consequences_and_risks**: C9 本身净增、改名又动共享契约，执行时容易「看起来违反」；故已写明它管的是**净**增，不是绝对不增。
- **rejected_alternatives**: ① 交给任务Ⅲ C7（本任务四批可能再长出控制面，C7 拦太晚）；② 要求 C9 也必须净减（为凑数字删东西，用户明确否掉）。
- **unresolved_items / owner**: 宪法级负向条款与对照项仍由任务Ⅲ C7 新增（`HANDOFF-T2-002` 的邻接项）。
- **Supersedes**: none

#### D-016 · 现在开工，但合并严格排在任务Ⅰ 合入之后

- **module**: 流程、失败与非目标
- **derived_from**: [D-014]
- **requirement_ids**: [R-001, R-002]
- **question / final_option**: 任务Ⅰ（C0–C3）设计完但未实现，而 C9/C5/C6 的合并依赖是「C3 合入」。时序怎么定？→ **本任务现在开工做决策与实现，合并严格排在任务Ⅰ 合入之后；期间两边不并行改同一批文件**。
- **recommendation / plain_language**: 推荐项且被采纳。含义：不浪费时间，也不制造语义级冲突。
- **source_type / reference / exact_excerpt**: 真实用户答复（Talk Round 2 第一批 T-008）：「A（推荐）现在开工，但合并严格排在任务Ⅰ 合入之后」。
- **facts_and_constraints**: 任务Ⅰ 分支 @ `50995220`，merge-base = `4330290e`；其 worktree 内 `plan.md`/`tasks.md` **仍未提交**（C0–C3 尚未实现）；C5/C6 要改 C3 同样要改的 `runtime/task/task-handle.mjs` 与 `facts.jsonl` 字段表；本次已实测到 main 在两个任务之间前进了 15 个提交。
- **Logic**: 两边共改同一批语义文件 -> 并行合并会出语义级冲突 -> 但决策与实现不依赖 C3 的代码 -> 选「现在做、之后并」。
- **choice_reason / impact**: 决定工期与冲突面；影响本任务的交付节奏。
- **consequences_and_risks**: 合并时间取决于任务Ⅰ 的进度；若拖得久，本任务会攒着一堆待合改动，期间 main 继续前进还会带来新漂移。
- **rejected_alternatives**: ① 等任务Ⅰ 合入再开工（完全停摆，且等多久不确定）；② 独立合并现场解决冲突（语义级冲突，很可能把任务Ⅰ 的设计改坏）。
- **unresolved_items / owner**: 任务Ⅰ 的实际合入时间未知；若长期未合入，本任务按 D-014 停在该批，不自行合并。
- **Supersedes**: none

#### D-017 · 交接项按「具名 + owner + 关闭条件」列全；零延期

- **module**: 流程、失败与非目标
- **derived_from**: [D-014, D-016]
- **requirement_ids**: [R-002, R-001]
- **question / final_option**: 怎么交接给任务Ⅲ，以及任务Ⅰ 移交过来的两条怎么接？→ **按「具名 + owner + 触发条件 + 关闭条件」列全部交接项（不写成延期）；任务Ⅰ 的 `HANDOFF-001` 归 C5、`HANDOFF-002` 归 C4、`HANDOFF-003` 明确不在本仓范围**。
- **recommendation / plain_language**: 推荐项且被采纳。含义：下一轮拿到一份可核对的清单，不会出现「没人做」。
- **source_type / reference / exact_excerpt**: 真实用户答复（Talk Round 2 第三批 T-013）：「A（推荐）按「具名 + 谁负责 + 关闭条件」列全部交接项」。
- **facts_and_constraints**: PRD E-13 与母决定 L277 均要求零延期；任务Ⅰ §3.5 明确移交两条 `HANDOFF` 给任务Ⅱ；本任务产出 **7** 条交接项（`HANDOFF-T2-001` ~ `007`，见 §3.5）。
- **Logic**: 零延期 + 有跨任务遗留 -> 只能用具名交接项承载 -> 每条必须带关闭条件，否则会变成变相延期。
- **choice_reason / impact**: 决定与任务Ⅲ 的边界与可核性。
- **consequences_and_risks**: 交接项多了要防止变成变相延期 —— 处置 = 每条必须有 owner 与关闭条件。
- **rejected_alternatives**: ① 只交接改名后果（跨仓不可闭合、新行为未进治理文本两件事会没人接）；② 不专门列（无强制机制，事实上等于延期）。
- **unresolved_items / owner**: **7** 条交接项的最终关闭由任务Ⅲ C7/C8 承担。
- **Supersedes**: none

### M-跨任务与治理边界

#### D-018 · 本任务的 `UI applicability` 为 `non_ui`

- **module**: 跨任务与治理边界
- **derived_from**: []
- **requirement_ids**: [R-002]
- **question / final_option**: 本任务是否涉及页面、交互或视觉设计？→ **`non_ui`**。
- **recommendation / plain_language**: 由三个输入按证据合并直接回答（不是按 caller 标签）。含义：这个任务改的是命令行和运行时，没有页面。
- **source_type / reference / exact_excerpt**: 见 `## UI applicability` 的 fenced JSON fact（三输入逐项给出 `result` 与描述）。
- **facts_and_constraints**: `raw_requirement` 无页面诉求。`project_inventory`：本仓由 Markdown/JSON/YAML/.mjs 组成，仓内唯一 `.html` 是 `tools/cli/build-reflection-page-template.html`（模板，不是前端应用），无界面框架、无路由表、无可视化部件。`planned_or_changed_frontend_fact`：改动面为 runtime/tools/skills/workflows/core/tests/docs-adr，唯一「人看的输出」是 C6 的 status/close 根因**文本行**。
- **Logic**: 三输入一致指向无界面 -> 按证据合并得 `non_ui` -> 并写明重算触发条件。
- **choice_reason / impact**: 决定下游是否需要页面/视觉输入；影响 build-spec 的页面需求小节。
- **consequences_and_risks**: 若任一批次引入需人看的界面改动，必须**重算**本事实（已在 `recompute_trigger` 写明）。
- **rejected_alternatives**: 无（事实结论）。
- **unresolved_items / owner**: 无。
- **Supersedes**: none

### M-Grill 压力测试结论（step 8）

#### D-019 · 写口「待写字节」真实现（不改语义、只补实）

- **module**: 记录与失效链（C5）
- **derived_from**: [D-010]
- **requirement_ids**: [R-002, R-008]
- **question / final_option**: C5 说的「写口保留三项、强度不变」在 HEAD 上只有两项真检查（第三项恒真）。怎么办？→ **真实现第三项**：在真正的写入点比对「即将写入的字节」与「已认证来源的字节」，不符 fail-loud。
- **recommendation / plain_language**: 推荐项且被采纳。含义：把母决定本来就要的那道核对**做实**，而不是把文字改小。
- **source_type / reference / exact_excerpt**: 真实用户答复（Grill G-001）：「A（推荐）真实现一个「待写字节」核对（补齐 D-009② 本就要的语义，在净减账里单列）」。
- **facts_and_constraints**: `inspectWriteBoundary`（`:44-152`）内零字节比对；唯一 ref+hash 比对在 `persistWriteBoundaryPathCard:216-217`（J-3 删除目标）且**同源自比、恒真**；`stage-runner.mjs:1361` 是另一个同名本地函数、不比对字节。
- **Logic**: 一个挂着「身份核对」名字却恒真的检查比没有更糟（制造虚假信心）-> 要么删要么做实 -> 母决定 D-009② 明确要三项 -> 做实。
- **choice_reason / impact**: 决定写边界的真实强度；是本任务唯一的新增实现。
- **consequences_and_risks**: 需在净减账里单列并由其他批次净减吸收；风险 = 若被做成新对象会撞 T-014（已登记 RISK-011 与硬约束）。
- **rejected_alternatives**: ① 如实改成两项（等于修正已确认的母决定，且会弱化写边界）；② 保留 path-card 落盘分支（与裁定 J-3 正面冲突，且那个比对恒真、留着也无用）。
- **unresolved_items / owner**: 具体落点函数与错误文案由 C5 build-spec 写死。
- **Supersedes**: none

#### D-020 · `CONTEXT.md` 完成判据一句由 C5 同批改写

- **module**: 记录与失效链（C5）
- **derived_from**: [D-019]
- **requirement_ids**: [R-002]
- **question / final_option**: C5 删掉 `material revision`/`snapshot` 链后，`CONTEXT.md:374` 的完成判据输入由谁提供？→ **C5 同批改写该句**，换成 identity 三项 + `facts.jsonl` 本阶段行 + 六类具名 ref；并交接 C7 复核。
- **recommendation / plain_language**: 推荐项且被采纳。含义：删了东西就把依赖它的那句话一起改掉，不留空窗。
- **source_type / reference / exact_excerpt**: 真实用户答复（Grill G-002）：「A（推荐）本任务 C5 同批修正这句话，并交接给 C7 复核」。
- **facts_and_constraints**: `CONTEXT.md:374` 原文；PRD 把治理正文归任务Ⅲ C7。
- **Logic**: 输入被删 -> 判据悬空 -> 实现各自解释「当前 revision」-> 假绿；同批改写并交 C7 复核可同时满足「不断链」与「治理归属」。
- **choice_reason / impact**: 决定完成判据是否始终有权威来源；影响 §15 的文档结果（`no-change` → `changed`）。
- **consequences_and_risks**: 本任务触碰治理文本一句，需登记交接（`HANDOFF-T2-007`）。
- **rejected_alternatives**: ① 只登记失效交 C7（中间窗口无权威来源）；② 少删一点保留 `material revision`（为不改文档而留机制，正是用户否掉的哈希链）。
- **unresolved_items / owner**: C7 复核；关闭条件见 `HANDOFF-T2-007`。
- **Supersedes**: none

#### D-021 · 保留三块事实底座，只收派生投影

- **module**: 收口与状态（C6）
- **derived_from**: [D-012]
- **requirement_ids**: [R-002, R-008]
- **question / final_option**: `status_matrix` / `identity` / `source_completeness` 留不留？→ **保留**（它们是事实），只收 `product_release` 投影与 `status_groups` 四投影。
- **recommendation / plain_language**: 推荐项且被采纳。含义：事实留下、由事实再加工出来的中间结论收掉。
- **source_type / reference / exact_excerpt**: 真实用户答复（Grill G-003）：「A（推荐）保留三块事实底座，只收派生投影，并把界线写死」。
- **facts_and_constraints**: `CONTEXT.md:48-49` 称三块为「judgment 层的事实底座，不推导质量结论」；C6 的目标是「只报根因」；六类具名 ref 闭集（J-7.1）与禁 `readdir` 要求。
- **Logic**: 底座是事实 -> 收掉会让 Talk 输入与 close 凭证核对失去依据、退回扫目录 -> 保留底座、只收派生。
- **choice_reason / impact**: 决定 status 的最终信息面与 close 凭证核对的依据。
- **consequences_and_risks**: 三块底座必须逐块写出 consumer；写不出的按 D-013 另行裁定。
- **rejected_alternatives**: ① 三块一起收（失去底座）；② 留给 C7（C6 改 status 时必然碰到，边改边定易分歧）。
- **unresolved_items / owner**: 三块底座各自的 consumer 由 C6 build-spec 写清。
- **Supersedes**: none

#### D-022 · `facts.jsonl` 行型字段改名（历史决定，已被 post-merge amendment supersede）

- **module**: 数据状态与命名（跨任务）
- **derived_from**: [D-010]
- **requirement_ids**: [R-002]
- **question / historical_option（非当前指令）**: K2 的行型字段名 `record_kind` 与本仓另外 ≥3 个记录族同名。怎么办？→ 当时选择换名并跨任务协调；该选择已由本决定下方 post-merge amendment supersede。
- **recommendation / plain_language**: 用户**未选推荐项**（推荐项是「只在 `facts.jsonl` 内定义、材料里写明同名边界」）。含义：从根上消除同名，读代码的人不会再在同一名字下撞到三个族。
- **source_type / reference / exact_excerpt**: 真实用户答复（Grill G-004）：「B 给 facts.jsonl 换一个不冲突的新字段名」；（G-006）：「A（推荐）记为跨任务约束：任务Ⅰ 改名，本任务按新名消费」。
- **facts_and_constraints**: `task-store.mjs:291` 的 `validateFact` 用精确键集校验，**现值不含 `record_kind`**（旧 10 键形状）；同名别族 = stage-reflection 的 `judgment`、workflow-evolution 的 `candidate`/`batch_*`/`snapshot_record`/`refresh_result`/`publication_proof`；任务Ⅰ `spec.md:346` 已写 `record_kind`（`plan.md:322`、`tasks.md:389` 同）；任务Ⅰ T-009 明写「键名留 build-spec、语义不可改」。
- **Logic**: 同名跨族 -> 计数与阅读都会混淆 -> 换名 -> 但字段定义权在任务Ⅰ -> 记为跨任务约束并带回关闭条件。
- **choice_reason / impact**: 决定 `facts.jsonl` 行型的最终字段名；影响任务Ⅰ 的 spec/plan 与任务Ⅱ C5/C6 的消费。
- **consequences_and_risks**: 风险 = 任务Ⅰ 若已按旧名开工，改名成本上升（RISK-010）。
- **rejected_alternatives**: ① 不改名，只在材料里写明同名边界（混淆仍在）；② 本任务不引用字段名、只用语义隔离（计数与零残留判据变模糊）。
- **unresolved_items / owner**: 任务Ⅰ（C3）执行改名；关闭条件见 `HANDOFF-T2-006`。**只改名，不改取值与语义**（仍恰好两值）。
- **Supersedes**: none
- **Post-merge amendment（当前权威）**: Task I 已冻结并实现 `record_kind: stage | close_action`，用户接受；D-022 不再是实施指令。不得改名、迁移、兼容或回填；`HANDOFF-T2-006` 已关闭。

#### D-023 · T-011 的实跑定性为「通道验证」

- **module**: 审查生命周期（C4）
- **derived_from**: [D-009]
- **requirement_ids**: [R-007]
- **question / final_option**: T-011 的实跑验证算不算第二次审查？→ **不算**：定性为通道验证，不产出 findings、不进 sink、不计审查轮次，只记退出码。
- **recommendation / plain_language**: 推荐项且被采纳。含义：只验证「改完协议之后能不能重跑」，不假装又做了一轮审查。
- **source_type / reference / exact_excerpt**: 真实用户答复（Grill G-005）：「A（推荐）定性为通道验证（不算审查轮次、不产出 review fact）」。
- **facts_and_constraints**: `CONTEXT.md:98` 审查闭环：「一条审查面只做一轮」，仅当「上一轮无任何语义建议 **且** 具体传输或材料问题已经改变」才可重发；T-011 的修复正属后者。
- **Logic**: 审查轮次是稀缺且昂贵的 -> 通道验证不是审查 -> 定性清楚才能既验证又不违反闭环。
- **choice_reason / impact**: 决定 C4 的验收方式与审查轮次纪律是否被破坏。
- **consequences_and_risks**: 材料必须写明「它不产出审查事实」，否则下游会误引用。
- **rejected_alternatives**: ① 当第二次审查走完整记录（违反闭环且再花 ~10 分钟 + provider 成本）；② 只做静态验证（证明不了不再撞 `REQUEST_ID_CONFLICT`）。
- **unresolved_items / owner**: 实跑结果由 C4 在 build-code/verify 回填。
- **Supersedes**: none

#### D-024 · 送审材料必须含任务级非目标；三条总账标 consumer/owner

- **module**: 流程、失败与非目标
- **derived_from**: [D-015, D-001]
- **requirement_ids**: [R-002, R-005]
- **question / final_option**: 审查指出的两处装配缺陷怎么处置？→ ① **下一轮送审必须把任务级非目标作为独立材料字段送入**；② **三条任务级总账逐条标注既有 consumer 与 owner**，并声明它们是**只读计算**。
- **recommendation / plain_language**: 由审查 finding 直接要求且被采纳（FND-D-12 / FND-D-14 判 `fixed`）。含义：审查看不到非目标就会误判范围；总账不标来源就会被当成新计数器。
- **source_type / reference / exact_excerpt**: 审查 findings 原文（原始 #17 与 #20，见 §8.1 落点文件）；处置见 §8.2 FND-D-12 / D-14。
- **facts_and_constraints**: 本次送审的 `objective_facts` **不含任何任务级 non_goals**（审查者实测）；CONSTITUTION F11 禁止「另造计数器检查是否足够简单」。
- **Logic**: 缺非目标 -> 审查无法判断范围是否被扩大；总账无 owner -> 易被当成新对象 -> 两处都在送审/材料层面修，不新增判据。
- **choice_reason / impact**: 决定 step 10 的送审材料形状与总账的记账口径。
- **consequences_and_risks**: 与用户 R3-Q5=**B（不加新的行为型判据）** 一致：只在材料层面标注与补字段，**不新增验收判据**。
- **rejected_alternatives**: 新增行为型成功判据（用户 R3-Q5 明确不加，见 RISK-009）。
- **unresolved_items / owner**: step 10 送审材料由主会话装配；判据见 §16.9。
- **Supersedes**: none

## 10. 最终确认

> 待 step 11（approve-decision）填入**用户真实答复原文**后定稿。以下为**呈给用户的大白话最终决策卡**（SKILL 要求的八项：方向 / 范围 / 非目标 / 成功判据 / 风险 / 建议事实 / 未决项 / 延期项），生成于细节审查之后。

### 10.1 最终决策卡（呈用户）

**方向**：把 WorkflowHub 的执行面、审查生命周期、记录失效链、收口状态四件事一次收敛——**跑得更快、审查不靠 timeout 收场、改一个文件不再让绿灯失效、status 只报根因**。四个批次串行，一批做完验一批，做不完就停在那批。

**范围（四批，串行）**：

1. **C9 执行面**：档位改名（`medium/large` → `phase/aggregate`）→ 慢测试分档 + 硬时间预算 → 同命令不重复跑 → 超时保留已完成部分 → 开工前 5 秒内拦下坏命令。三条硬前置：**每个档位要点名真实消费者**、**必须新增真正的命令入口**、**入口没落地就不算做完**。
2. **C4 审查生命周期**：给 3rd-review 补上「心跳过期判死」当**主机制**（它自己发现审查失败、自己收进终态）；现有的 20 分钟上限**保留但明确标注为兜底**；补审查请求身份里的协议版本并**实跑验证一次**（定性为通道验证，不算第二次审查）。**终态映射已写死**：v3 的合法 outcome 只有 `{completed, partial, unavailable, cancelled}`，判死时用**现有合法 outcome**，`stalled` 只作调用侧标签，**不改协议**。**跨仓被拒/无响应的出口也已写死**：C4 只交付本仓消费侧、跨仓标 `unknown`、**任务不因此停批**。
3. **C5 记录失效链**：删掉「材料哈希 / 快照树 / 一改就失效」整条链；写口只留**三项**核对，其中**第三项「待写字节」要真做出来**（现在那个是恒真的空壳）；`identity/path-cards/**` 整类删除。
4. **C6 收口状态**：`status`/`close` **只报根因** + 六类具名引用；收掉 `verify.json` 与 product-release 派生投影（保留三块**事实底座**）；主线前进只多一行「落后了」。**`current-close-projection.mjs` 的终局已定**：C6 **改写它**（去掉 `product_release` 域、换成具名 ref 读取），**不删文件**（它仍是 close 的活 reader）。

**非目标**：不新增第五份材料 / public command / 持久化对象 / 状态机；不改 wh-review 的分阶段审查标准；不动历史字节、不做兼容桥、不建双写；不改 `workflows/verify-code/**`；**不产出任何延期项**。**新增一条任务级约束**：整改期间**不得「净」新增控制面**，确有必要的必须当场写清谁用、谁负责、什么时候删。

**成功判据**：四张卡各自的判据逐条跑（含失败判据与可执行命令）；四批都过之后用三条总账核对一次（净行数 / 每任务记录文件数 / 没人读的对象数）；守卫计数（markdownlint **612 / 35 文件**、路径守卫 **10**、结构守卫 **2**）**不得上升**——这三个值已在决策记录写到 1,418 行之后**在 T2 worktree 内复核过**（§16.18），与开工基线逐项一致；**本任务四份材料**（当前只有 `decision-log.md` 存在，另三份由后续 stage 各自产出时同）markdownlint 保持 **0 error**，且该约束**可被独立复算**——`specs/<本任务>/` 不在 lint 忽略列表里，会被全仓扫描。

**主要风险（已如实登记，不淡化）**：

- 跨仓部分**本仓不可闭合**——判死逻辑在另一个仓库，本任务只能证明「调用侧接对了」。
- 本任务的验收**不直接证明**「机制开销真的降了」——你明确选择不加这条判据。
- 改名会动一个被 20 个文件引用、绑定了执行环境权限、还带一篇 ADR 的共享契约。
- 任务Ⅰ 若已按旧字段名开工，`facts.jsonl` 改名的成本会上升。
- 每次审查卡住都会留下一个**孤儿进程**（回收路径源码未体现，注释与实现不一致）。
- 无宿主 bridge ⇒ 正式 stage outcome 与阶段复盘预计只能是 `unavailable`。

**建议与审查事实**：

- 方向审查（异源、红/蓝、3 provider）**真实跑完了**：20 条原始 findings、去重 14 条，`fixed` 10 条（含 3 条是我的装配缺陷）、`accepted_risk` 3 条（均由你明确裁决）、`rejected_invalid` 与 `needs_human` **均为 0**。
- **但它的正式记录通道失败了**：CLI 归一化器只认 `available|unavailable`，成对审查有 provider 失败时是 `available-with-failures` → 整包被丢。这是本任务实测复现的**第四条通道缺陷**，已归 C4，并作为它的新增实证。
- 调研：**跳过**（理由已逐条写明）；Grill：6 问全部收敛，四项客观退出检查全 `pass`。

**未决项**：3rd-review 侧判死阈值的具体数值；`stalled` 在下游的语义；T-011 实跑结果；C9 的准确净增行数；`measure-test-runtime-profile.mjs` 能否复用；正式 stage outcome 是否可得；那条代码注释所引「用户决定 option B」的具名出处（**全部任务材料里都找不到**）；任务Ⅰ 的实际合入时间；交互聚合 `decision.revision` 的取值方法。

**延期项**：**零**。任务Ⅰ 移交的两条交接项已由本任务接收（`HANDOFF-001` 归 C5、`HANDOFF-002` 归 C4）；本任务另产出 7 条具名交接项交任务Ⅲ，每条带 owner 与关闭条件。

### 10.2 用户真实答复（原文）与确认绑定

- **用户原话**：**「接受，继续」**（本会话结构化确认，`approve-decision` 步骤；确认的是 §10.1 那张卡所对应的**本记录当时字节**）。
- **host-visible 绑定**：`quality/confirmations/62c2aa461ff668dbb5cbf024f3458dd98cbb640d3b6a0b1c38f441dd7395d169.json`，`schema_version = human-confirmation.v3`，`decision = accepted`，`step_slug = approve-decision`；同时产出质量事实 `quality/facts/7b17de51….json`。
- **批准绑定的材料**：`specs/workflowhub-mechanism-simplification-t2-20260911/decision-log.md`。
- **自指说明（如实登记，与任务Ⅰ 先例一致）**：本文件既是聚合绑定的对象、又是记录该绑定的载体。**把聚合的 ref 或本文件的 sha256 内联进本文件会立刻改变本文件字节、使刚建立的绑定失效**（任务Ⅰ 实测踩过：`run --action=execute` 报 `interaction aggregate does not bind the current task and decision`）。因此：
  - 本节**只记落点与绑定关系，不内联任何 ref / sha256**；
  - **真实哈希由确认凭证与聚合文件各自记录**；
  - 交互聚合落在 task store 的 `quality/evidence/interactions/`，`schema_version = workflowhub-interaction-aggregate.v1`，**`round_count = 3`**（Talk 三轮）+ **Grill 一轮**；
  - 装配次序见 §16.17：**先写完本节 → 再按最终字节重算 `decision.hash` / `decision.revision` → 再装配聚合并取 sha256**。
- **确认后的材料变化（如实登记）**：本 §10.2 本身是**确认之后**追加的记录性内容；它**不含任何 OI 终态、决定或验收口径的改动**，按 decision-log 契约「正常方向确认绑定批准内容范围，后续材料细化不使该批准失效」处理。
- **未确认内容**：无（26 条 OI 全部收敛并包含在本次确认内）。

## 11. 拒绝方案

> 只收录**本任务实际考虑并否决**的选项；PRD 的 E-1 ~ E-20 是上游已裁定排除项，原样沿用，不在此重复。

| # | 选项 | 拒绝理由 | 关联 D / 来源 |
| --- | --- | --- | --- |
| 1 | 只用三条总账（净减行数 / 记录文件数 / 无 reader 对象数）当验收尺子 | 太粗：单张卡做没做到位看不出来，且 C9 是净增卡会被总账压住 | D-001 / T-001 选项 B |
| 2 | 以「完整跑一遍五阶段不再卡住」为验收尺子 | 要真跑任务、耗时长；一次跑通不代表下次不卡；用户此前明确否过「为采基线新跑真实任务」 | D-001 / T-001 选项 C、PRD E-19 |
| 3 | 开工前做一次窄调研（进程停滞与健康判死惯例） | 那部分是跨仓实现细节，本任务定不了；换来的是一条本就要交给对方决定的参数 | D-002 / T-002 选项 B |
| 4 | 认 20 分钟有界等待当收场机制，不做 3rd-review 健康判死 | R-013 实际不成立；每次卡住留下一个继续跑的孤儿进程 | D-006 / T-003 选项 B |
| 5 | 去掉 20 分钟上限、回到无限等，等健康判死做完再加回来 | 在健康判死做出来之前，卡住的审查会无限挂住——正是当初 37 分钟空转零产出的原因 | D-006 / T-003 选项 C |
| 6 | 档位不改名，只在材料里写死映射 `phase = medium` / `aggregate = large` | 用户 T-010 看过实测波及面后**明确改选为维持改名**；理由 = 代码与材料同名可消除长期误导 | D-003 / T-005 选项 A、T-010 选项 B |
| 7 | 只改对外名字（材料 / 输出 / 错误文案），代码内部常量与权限键不动 | 会多出一层「名字 ↔ 名字」映射，错误文案容易对不上；且没有解决共享契约本身的命名不一致 | D-003 / T-010 选项 C |
| 8 | 新增的 4 个生产文件全部留给任务Ⅲ（C7/C8）处置 | C5 的「零残留」在字面上就是假的（清单外仍有命中）；C6 收掉 product-release 投影后会留下读该域的活 reader，直接踩坏 status/close | D-011 / D-013 / T-006 选项 B |
| 9 | 四个文件都不动，并把 C5/C6 的判据收窄成「只在我自己列的清单内为零」 | 这是把尺子改小以便通过，正是 PRD 反复禁止的「为让 finding 消失而放宽断言」；用户最初抱怨的「机制越加越多」会被原样保留 | D-011 / D-013 / T-006 选项 C、PRD finding 处置口径 |
| 10 | 3rd-review 仓另开一个独立任务，本任务只做主仓消费侧 | 要多走一轮完整五阶段；消费侧改完后要等对方，中间那段时间审查仍会卡 20 分钟 | D-007 / T-007 选项 B |
| 11 | 本任务不动 3rd-review 仓，跨仓部分整体登记为「未做」 | 用户 T-003=A 落空：「让 3rd-review 自己判死」没有任何人做，R-013 无人落地 | D-007 / T-007 选项 C |
| 12 | 等任务Ⅰ（C0–C3）合入后再开工本任务 | 现在完全停摆；任务Ⅰ 自身仍在研发，等多久不确定 | D-016 / T-008 选项 B |
| 13 | 本任务独立合并，冲突时现场解决 | `facts.jsonl` 字段表、`task-handle.mjs`、`completion-predicates.mjs` 是**语义级**冲突，现场解决很可能把任务Ⅰ 的设计改坏 | D-016 / T-008 选项 C |
| 14 | 给 status 单独加一个字段（如 `baseline_status: "stale"`） | 新增字段/新投影，与 C6 自己「收掉派生投影、只报根因」的目标相反；status 已有 11 条键语句，再加更吵 | D-012 / T-009 选项 B |
| 15 | stale 不显示，只记录在事实里 | 人看不到「这条分支已经落后」，往往到 close 时才发现合并冲突 | D-012 / T-009 选项 C |
| 16 | 维持 PRD 原判：不为 T-11 造机制，只登记 | 若 C4 的通道修复本身改了协议，修完之后同一材料在 24 小时内根本重跑不起来，C4 的验证只能靠换材料绕过，证据不完整 | D-009 / T-011 选项 B |
| 17 | 不在本仓修 T-11，推到 3rd-review 仓去解决 | 把本可以本地解决的问题推给另一个仓库，而该仓改动不经过本任务流程；两仓各一套逻辑，以后容易不一致 | D-009 / T-011 选项 C |
| 18 | 完全沿用任务Ⅰ 形态，包括跨仓也不加确认点 | 跨仓改动不在本任务的提交/合并保护里，一旦改坏只能靠 Git 历史恢复 | D-008 / T-012 选项 B、CONSTITUTION F9 |
| 19 | 每一批都加人工确认点 | 四批 + 跨仓要打断用户五次，而用户的原始抱怨正是「流程和机制占了超过一半的时间」 | D-008 / T-012 选项 C、母决定 L14 |
| 20 | 只交接改名造成的治理后果，其余留在本任务材料里 | 跨仓不可闭合、新行为未进治理文本这两件事会没人接 | D-017 / T-013 选项 B |
| 21 | 不专门列交接清单，靠材料自然被下游读到 | 没有任何强制机制保证下游真的会看；不列清单容易变成「事实上的延期」，与 E-13 冲突 | D-017 / T-013 选项 C |
| 22 | 本任务不加「不得净新增控制面」的自我约束，完全交给任务Ⅲ C7 | 本任务四批本身也可能再长出控制面（前一波已长出 4 个、2,179 行），C7 要到最后一轮才拦 | D-015 / T-014 选项 B |
| 23 | 加自我约束，并要求 C9 也必须净减 | 为凑数字删东西——正是 PRD 否决项 E-12 / E-11 禁止的形态；且 C9 的活是「把已有能力接上线」，不是删东西 | D-015 / T-014 选项 C、D-004 |
| 24 | 中间某批卡住时跳过，先做后面的 | C5 与 C6 改同一批文件、C9 与 C6 也改同一个文件；跳过会让后面的批次既做不对也验不了 | D-014 / T-004 选项 B |
| 25 | 把卡住的部分降级成「只登记不修」继续走完 | 登记项没有强制机制，很容易变成没人做——正是 E-13 禁止的延期形态 | D-014 / T-004 选项 C |

## 12. 风险与延期交接

| risk_id | 风险内容 | 触发 / 后果 | 处理阶段 / owner |
| --- | --- | --- | --- |
| RISK-001 | **档位改名（`medium/large → phase/aggregate`）的波及面**：它同时是①母决定 D-002 列为失败形态的「改名」动作、②一个绑定执行环境权限的共享契约、③20 个文件的引用面、④一篇 ADR、⑤C5/C6 也要改的同一文件 | 若改名不彻底，代码与材料继续不一致；若彻底，则 C9 第一步就是全任务冲突面最大的动作，且 ADR 改动会与任务Ⅲ C7 的治理同步撞车 | 任务Ⅱ C9（第一步）；ADR 同步登记为 `HANDOFF-T2-001`；**用户已在 T-010 看过波及面后明确维持** |
| RISK-002 | **跨仓部分本仓不可闭合**：判死逻辑在 `/Users/Hugh/Hugh/Project/3rd-review`，本任务只能证明「调用侧接对了」 | 本任务的完成声明中「R-013 成立」只能部分成立；跨仓改动无流程保护，改坏只能靠 Git 历史恢复 | 任务Ⅱ C4；`HANDOFF-T2-003`；**用户已在 T-007 明确接受** |
| RISK-003 | **孤儿进程**：审查等待超时后不调用 `cancelManaged`（全仓 0 调用点），manager 由 broker detached 派生；而 `runtime.mjs:108` 对非终态 managed runtime 的 cleanup **直接跳过** —— 与 `simple-review-runner.mjs:32` 注释「orphans are reaped by cleanup(root, ttl_hours)」**不一致** | 每次卡住都留下一个继续跑的审查进程；注释与实现不一致会误导下一个 agent | 任务Ⅱ C4（随 D-006 的健康判死一并处置）；**注释与实现不一致这一条如实登记，不得用「已经有人回收」掩盖** |
| RISK-004 | **T-11 的修复偏离 PRD 原判**（PRD 明写「不为它造机制」），且**尚未实跑验证** | 若实跑失败，C4 的验收会被 `REQUEST_ID_CONFLICT` 卡死，结论要回到本决定重裁 | 任务Ⅱ C4；实跑验证是判据的一部分（D-009）；**用户已在 T-011 明确选择修复** |
| RISK-005 | **基线继续漂移**：任务Ⅰ 未合入，main 在两个任务之间已前进 15 个提交 | 本任务开工基线 `4330290e` 在合并时可能已不是主线，合并判据失真 | 任务Ⅱ close 前必须重新核对主线；D-016 已定「合并排在任务Ⅰ 之后」 |
| RISK-006 | **无外部宿主 bridge** ⇒ 正式 stage outcome 预计 `unavailable`，`outline_closed` 类形式收口不成立 | 本任务的正式完成事实可能只能是 `unavailable`；交接物不得依赖 `outline_closed` | 本任务全阶段；如实登记，不伪造通过 |
| RISK-007 | **新增控制面文件的 consumer 信息不完整**：`produce-final-current-snapshot.mjs` 与 `measure-test-runtime-profile.mjs` **未登记进** `control-plane-inventory.json`；它们的消费者只有测试与被按路径读回 | 可能出现「没人读但一直存在」的对象；任务级「无 reader 对象数」总账会失真 | 任务Ⅱ C5/C9 处置；剩余归属 `HANDOFF-T2-004` |
| RISK-010 | **历史风险，已关闭**：曾担心 Task I 按旧字段名开工后改名成本上升 | Task I 最终冻结并实现 `record_kind: stage \| close_action`，用户 post-merge 接受，故不再有改名成本 | closed；当前要求是不改名、不迁移、不兼容、不回填 |
| RISK-011 | **写口新增的「待写字节」核对是本任务唯一的新增实现**（G-001=A） | 若不加约束，它可能被做成新的控制面对象（新文件 / schema / 命令），撞 T-014 的任务级非目标 | 任务Ⅱ C5；硬约束 = 只在既有写入点内实现、不新增文件/schema/command，并在净减账里单列（§16.11） |
| RISK-009 | **验收不直接证明「机制开销净降」**：卡判据 + 三条总账都可能在「机制仍占一半时间」的情况下全部通过（方向审查 FND-D-09 的原话） | 本任务可能「全部通过」却仍没解决用户最初那句「>50% 花在流程和机制上」 | 任务Ⅱ 全体；**用户 R3-Q5 明确选择不加新的行为型判据**，故缺口如实保留为 `accepted_risk`，不淡化、不假装已解决 |
| RISK-008 | **送审包纯度**：方向审查的投影若仍夹带处置或候选方案，审查会被预锚定，其「未发现某类问题」**不能**当作该类问题不存在 | 审查结论的可信度下降 | 本任务主会话；本次投影为 questions-only（只含 ID/类别/问题/来源与可复算事实），纯度事实记录在 §8 运行事实上 |

### 质量边界

- **质量事实**：方向审查（step 6）与细节审查（step 10）各一次；真实 provider 结果、失败与降级如实登记，不美化。
- **推进资格**：不适用（质量事实不是推进许可）。
- **完成判据**：Talk 三轮收敛 + Grill 完成 + 两个审查事实已记录且每条 finding 有处置 + 用户真实确认 + 交互聚合绑定被确认的那一版决策。
- **不可逆授权边界**：本阶段不做任何不可逆动作（无 commit、无 merge、无跨仓改动、无删除）。

## 13. 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 3rd-review 侧心跳与 `PROCESS_STALLED` 接线的**具体阈值** | 母决定 D-030 的 `unresolved_items` 明确留给实现时定 | 任务Ⅱ C4 跨仓实现；本阶段只写「主机制在那边、本仓零计时器」 |
| OPEN-002 | `stalled` 在下游结果映射中的**语义**（是否等同 `unavailable`、如何计入阶段完成行） | 同上（D-030 `unresolved_items` 第② 条） | 任务Ⅱ C4 定；本记录 §3.8 只定四类状态语义 |
| OPEN-003 | T-11 修复的**实跑验证结果** | 尚未执行（D-009 要求实跑） | 任务Ⅱ C4 build-code/verify；未通过则回到 D-009 重裁 |
| OPEN-004 | C9 的**准确净增行数** | 需在实现后实测 | 任务Ⅱ build-code 末回填 |
| OPEN-005 | `measure-test-runtime-profile.mjs` 能否被 C9 **复用** | 需先读该文件再判定（D-005） | 任务Ⅱ C9 开工时判定 |
| OPEN-006 | 无外部宿主 bridge 时的**正式 stage outcome** | 本会话无宿主 bridge（RISK-006） | 阶段末如实登记；不伪造通过 |
| OPEN-007 | 档案里那句代码注释所引「用户决定 option B」的**具名出处** | 已 grep 母材料 / 任务组 PRD / hardening 任务四份材料 / task quality 目录，**均未找到**（§4.5、§4.7 U-f） | 保持 `unknown`；本任务不据此声称用户已确认该取值 |
| OPEN-009 | **交互聚合的 `decision.revision` 取值**：算法已查明 = `materialRevisionFromValues` 对 `[decision-log.md, spec.md, plan.md, tasks.md]` 规范序列化后取 `revision-<sha256>`（`tasks.md` 先剥执行状态区，见 `git-worktree-snapshot.mjs:552`）；但本阶段**只有 `decision-log.md` 存在**，另三份由后续 stage 产出 | 无法在 make-decision 内用真实三份材料算出该值；契约只校验**形式**（`/^revision-[a-f0-9]{64}$/`），不校验它与运行时期望值相等（运行时比的是 `decision.ref` 与 `decision.hash`） | **已用真实材料算出并登记**（`materialRevisionFromValues`）：按「`decision-log.md` 真实内容 + 另三份为 `null`」= `revision-e5e032081e5d1a276d7cb0a66e2ff40cfba073640eddfd781479165603f3a99a`（算于 1,386 行 / 185,363 B 那一版）。**注意：该值随材料字节变化**，装配时必须按**当时的最终字节**重算；契约只校验形式（`/^revision-[a-f0-9]{64}$/`），运行时比的是 `decision.ref` 与 `decision.hash` |
| OPEN-008 | 任务Ⅰ 的**实际合入时间** | 任务Ⅰ 仍在研发 | 由任务Ⅰ 决定；本任务按 D-014 停在该批，不自行合并 |

## 14. Supersedes

无（本任务首版 decision-log）。本记录对**上游材料表述**的两处修正已在 §3.7 逐条登记（`C4-FR-10②` 的 `=null` 语义、T-11 的处置结论），按「保留两种口径」的要求，上游原文不改写。

## 15. 文档结果

- **CONTEXT.md**：**changed（由 step 8 Grill 裁定并更正，见 §16.12）**。原文写的 `no-change` 已被 Grill 更正：**C5 删掉生产侧 `material_revision` / `snapshot_tree` 链后，`CONTEXT.md:374` 的「阶段完成判据」一句失去输入来源**，必须由 C5 同批改写为新判据输入（identity 三项 + `facts.jsonl` 本阶段行 + 六类具名 ref）。原 `no-change` 的理由（未引入新领域概念、`record_kind`/`review_origin` 属实现字段）**对该句之外的内容仍然成立**，因此改动范围仅限这一句。文件引用：`CONTEXT.md`（计划由任务Ⅱ C5 修改；交接 `HANDOFF-T2-007` 交任务Ⅲ C7 复核）。**原始 `no-change` 判断保留在此，不删除**：理由 = 本任务未引入新的领域概念；档位名（`inner`/`phase`/`aggregate`）、`review_origin` 五态、`record_kind` 两型属实现字段，而 `CONTEXT.md` 按其边界只收领域专家会用的概念。文件引用：无（未改动）。**step 8 必须逐项核实这条结论**。
- **ADR**：**not-needed（待 step 8 Grill 复核）**。理由 = 本任务的三处取舍（改名、跨仓形态、T-11 修复）都能在 decision-log 与 spec 里写清，且**任务Ⅰ 已建 `docs/adr/0030-mechanism-simplification-deletion-boundary.md`**；本任务再建一条会与任务Ⅲ C7 的治理同步撞车。**例外**：D-003 改名会**修改既有** `docs/adr/0027-test-feedback-runtime-profile.md` 的表述（不是新建 ADR），该动作登记为 `HANDOFF-T2-001`。
- **ADR criteria（三条）**：① hard to reverse —— 改名**是**（20 个文件 + 权限语义 + ADR）；跨仓交付**是**；T-11 修复**否**（本地函数，回退容易）。② surprising without context —— 改名**是**（读代码的人不会知道为什么叫 `phase`）；③ genuine trade-off —— 改名**是**（同名可读性 vs 共享契约冲突面）。三条全成立的只有改名一项，而它**修改既有 ADR** 而非新建，故仍记 `not-needed` + 交接。
- **术语/ADR 冲突及处理**：**有冲突且已处理** —— `docs/adr/0027-test-feedback-runtime-profile.md` 记录的是旧档位名，与 D-003 冲突；处理 = 由 C9 同批改该 ADR 的表述，并登记 `HANDOFF-T2-001` 交任务Ⅲ C7 复核。
- **不复制 spec 的边界**：本文件只记方向、事实索引、决定链与边界；页面、接口、任务与测试细节留给 spec/plan/tasks。

### Exit checks

- **上下文一致**：**pass**。§1 原始需求的每一句都能追到 T-00x / D-0xx（§1.2 索引 + §5 两轮 Talk + §9 决定链）；六个框架节点与六类固定类别均有 OI 覆盖（§2.0），且 **26 条 OI 全部收敛** —— §2.4 的 **24** 条 + §16.5/§16.6 追加的 **OI-25 / OI-26**（`outline_version` 已由 `v1` 升为 `v1.1`，§2 头部已同步标注）。
- **owner/接口一致**：**pass**。任务Ⅰ 的三条 `HANDOFF` 逐条给出本任务归属与关闭条件；本任务产出 **7** 条交接项各带 owner / 触发 / 消费者 / 关闭条件（§3.5）。
- **失败语义明确**：**pass**。§3.8 给出五类状态的语义与「是否等于完成」，并写死恢复规则（不放宽、不伪造、不建替代记录）。
- **范围与延期明确**：**pass**。§3.5 正式范围四项 + E-1~E-20 + 新增任务级非目标 + 零延期与 **7** 条交接项；§3.8 给出逐批停止条件。

## 16. Round 3 后的材料修正与补充（审查驱动的更新）

> 本节记录 Talk Round 3 之后对前文的**全部修正与补充**，逐条对应 §8.2 的处置。**前文原文保留不改写**（保留两种口径），以本节为最新权威。
>
> 本节的修正使 `outline_version` 从 `v1` 升为 **`v1.1`**：新增 **OI-25** / **OI-26**，并改写 OI-24 / OI-14 的题面。它们都属于**同一份 OI 大纲**的更新，**不新建第二张表**；`outline_version` 变更按 decision-log 契约使旧的消费者结果（本次方向审查）失效——本次审查结果本已因通道失败记为 `unavailable`，与此一致。

### 16.1 送审包装配缺陷的更正（FND-D-01 / D-02）

1. **OI-24 题面改为答案中性**：原为「为什么本任务不产出延期项？」（预设结论）。**新题面**：「本任务应登记哪些延期项、哪些应转为交接项？允许登记延期项的条件是什么？」相应地，`deferred` 类别的权威表述改为**待答**，而不是既有结论。
2. **OI-14 题面改为纯问题形式**：原题面含「被治理登记表标为保留」「含有将被清零的字段」等处置性陈述。**新题面**：「四个新增生产文件各自应获得什么处置与唯一的 consumer / owner？」
3. **纯度自查结论更正**：§8.1 已登记——我先前只用关键词 grep（`selected_disposition` / `RISK-` / 推荐项）得出的「送审包干净」结论**不成立**；正确判据是**逐题读题面，检查是否预设结论或披露处置**。
4. **未使用的潜在泄漏通道**：bare 路径 allowlist 把 `current_selection` / `alternatives` / `selection_rationale` / `key_assumptions` / `independent_reconstruction` 列为 optional 且不经 `directionMode` 裁剪。本任务**不使用**这些字段，并把该口子登记给 C4 参考。

### 16.2 跨仓交付的表述更正（FND-D-03，accepted_risk）

- §3.5 的「一条合并列车」表述**收窄为**：本任务在**本仓**是一条合并列车；**跨仓部分不在本任务合并列车内**，它在 3rd-review 仓自己的 main 上单独提交、单独验收，本任务只验收「调用侧接对了」。
- 该偏离与用户 R3-Q1=A 的裁决、以及 RISK-002 的登记一致；审查者的 blocking 意见原文保留在 §8.2 FND-D-03。

### 16.3 C9 的硬前置（FND-D-04）

C9 保留，但**新增三条硬前置**（不满足即按死代码处理、**不得交付**）：

1. **每个档位必须点名真实 consumer**：`inner` / `phase` / `aggregate` 各自列出**既有**的消费点（至少含 `tools/cli/run-checks.mjs` 的 profile 消费、`tests/contract/test-runtime-profile.test.mjs`、`tests/contract/runtime-profile-consumer-readback.test.mjs`）。点不出 consumer 的档位不得保留。
2. **必须新增真正的命令入口**：新增一个**独立的 npm script**（**不改**现有 `test` / `test:safe` / `test:exclusive` / `check` 的语义），使分档可被真实调用。在材料里写明：这是**接线**（让已有能力有入口），不是新增控制面对象。
3. **命令入口未落地前，C9 的分档部分不得声明完成**。

### 16.4 与任务Ⅰ 的基线隔离（FND-D-05）

- **本任务的决策输入严格基于当前主干基线 `4330290e`**；任务Ⅰ 的决策条文与 `HANDOFF-001` 只作为**待接收的交接项**（有 owner 与关闭条件），**不作为本任务决策的既成前提**。
- 与 D-016 一致：本任务现在开工做决策与实现，**合并严格排在任务Ⅰ 合入之后**。

### 16.5 新增 OI-25：主会话与子代理的责任边界 + 执行入口条件（FND-D-07 / D-13）

**新增 OI-25（`complete_user_flow`）**，并在 §3.8 补一节：

| 环节 | 规则 |
| --- | --- |
| 谁决策 | **只有主会话**可以发布阶段决策、批准决定链、签发确认 |
| 重读量动作 | 全仓 grep 扫描、跑测试/采证、多文件对标、反向引用扫描**默认派子代理**；主会话只收「结论 + 证据 ref + 置信度」 |
| 交互 | Talk 与 Grill **只能由主会话**发出；**子代理不得代答、不得模拟用户回复** |
| 回传格式 | 结论条目 + 证据 ref（文件:行号或 artifact ref）+ 置信度；研究/草稿/汇总类 ≤500 字，复核类按「severity \| 位置 \| 问题 \| 建议」一行一条；**不回传长日志** |
| 并行上限 | 研究 4 / debate 4 / 红蓝 2；交互步骤与依赖链按顺序执行 |
| 失败处理 | 子代理失败或跑偏时：**保留真实失败事实**，主会话**不得**补写它的结论；必要时在**同一 task 内**重派，并在材料里登记重派原因 |
| 执行入口条件 | 原始需求明写的三条前置同样是**待答/待核项**：① 先创建认证 worktree；② 阶段准入权威（谁能宣布 stage 完成）；③ **不靠 build-spec 补需求**（方向缺口必须在 make-decision 闭合） |

### 16.6 新增 OI-26：按 consumer 分类哈希用途（FND-D-08）

**新增 OI-26（`data_state`）**：把生产侧 **993 处**哈希失效链标识符**按真实 consumer 分类**，并逐类给出处置：

| 类 | 含义 | 本任务处置 |
| --- | --- | --- |
| A 身份 / 完整性校验 | 用来确认「写的是不是这个对象」「来源是否被篡改」 | **必须保留**（写口唯一核对的三项之一即属此类） |
| B 失效触发链 | 材料字节一变就判定既有事实过期 | **删除**（D-010 / C5 的主体） |
| C 并行快照 / 变体构造 | 测试或变体构造用 | **保留但不得进入生产读路径**，逐处写明 |
| D 无 consumer 的残留 | 既无人读也不触发行为 | **删除并在具名清单里逐项列出** |

判据 = 每一类都有可复算的 `grep` 口径与计数；**不得**用一个总数代替分类。

### 16.7 审查生命周期的状态转移与清理 owner（FND-D-10）

补进 §3.8：

| 事件 | 审查记录如何进终态 | 谁清理 | 已完成结果 | 用户可见边界 |
| --- | --- | --- | --- | --- |
| **stuck（无进展但进程活着）** | 由 **3rd-review 健康裁决**判死（心跳过期 / `PROCESS_STALLED`）→ 复用 `SESSION_MANAGER_LOST` 或 `stalled` 终态 | **3rd-review 仓**（本仓零计时器） | 已完成 provider member 必须**可读回** | 调用侧只等健康裁决；20 分钟兜底**只在健康裁决失灵时**生效 |
| **manager death** | 现有路径：`ownerConfirmedDead` → `SESSION_MANAGER_LOST` | 3rd-review | 同上 | 无需用户介入 |
| **completed** | `outcome = completed` | 正常回收 | 全部 member 可读回 | 一次审查面**只做一轮**（CONTEXT.md 审查闭环） |
| **cancelled** | `managedV3Outcomes` 含 `cancelled` | 3rd-review | 保留已完成部分 | 记为 cancelled 事实，不当作通过 |
| **retry** | 只在「上一轮无任何语义建议 **且** 具体传输/材料问题已改变」时才允许重发（CONTEXT.md 审查闭环）；本任务**不新增重试预算** | 调用方 | 复用既有结果 | 重试原因必须登记 |
| **非终态 runtime 的清理** | — | **`runtime.mjs:108` 当前对非终态 managed runtime 直接 `continue`，源码未体现回收路径**；且代码注释声称的「orphans are reaped by cleanup」与实现不一致 | — | 该不一致登记为 RISK-003，随 D-006 一并处置 |

### 16.8 `aggregate` 档的三条硬约束（FND-D-11）

1. **契约上限保持 `null`**（尊重 `stage-content-contracts.mjs:58-62` 与 `docs/adr/0027-test-feedback-runtime-profile.md:29` 的「无界声明」）。
2. **只在 CI 跑**（`run-checks.mjs:140` 硬要求 `CI=true`）。900,000 ms 是 `run-checks.mjs:118` 的 **supervisor 运行兜底**，**不得写进契约**（该处注释原文：`not as a new profile value`）。
3. **必须有命令入口**（同 §16.3 第 2 条），否则视为死代码。
4. 附加如实登记：因为它是「无界」，本任务材料必须写明**靠什么防止无限跑**——目前只有 CI 平台自身的 job 上限；本仓**不新增**墙钟停滞判定（D-030③）。

### 16.9 下一轮送审必须含任务级非目标（FND-D-12）

- Step 10（细节审查）的送审材料**必须**新增独立字段携带**任务级非目标**：E-1 ~ E-20 全文要点 + T-014 新增的「整改期间不得净新增控制面」。
- 判据：送审字节里能按名字找到每条非目标；找不到即视为该轮送审的装配缺陷，按 FND-D-12 同类处置。

### 16.9b FND-D-12 的修复已验证（不是声称）

Step 10 细节审查的送审包由独立子代理装配，落点 `quality/evidence/2f8224c3….input.json`（254,052 B）。主会话**逐项复核**了它的内容，结论：

| 检查项 | 结果 |
| --- | --- |
| 真实的 detail 材料契约 | `raw_requirement` / `approved_direction` / `draft_spec_or_acceptance`（+ 可选 `context_map`），出自 `skills/wh-review/contracts/make-decision.md` §detail —— **不是**我最初按 direction 形状猜的三项 |
| **任务级非目标是否在送审字节里**（FND-D-12 的修复判据） | **在**。`不得「净」新增控制面`（T-014）与 `E-20` 均命中 |
| OI 终态记录 | `OI-24` / `OI-25` / `OI-26` 均命中（`approved_direction` 含 §2.4 与 §16） |
| 决定链 | `D-024` 命中（`draft_spec_or_acceptance` 含 §9 全文） |
| Grill 结论落地 | `facts.jsonl` 改名（G-004/G-006）与 C9 三条硬前置均命中 |
| 已登记的 `accepted_risk` | `机制开销`（FND-D-09）命中，缺口未被隐藏 |
| 审查通道缺陷事实 | `normalizeBareRecoveryResult` 命中 |

**结论**：方向审查 14 条中判 `fixed` 的 10 条，其材料侧修复在 step 10 的送审字节里**可验证地生效**；这不是声称，是逐项 grep 复核的结果。

### 16.10 三条总账的 consumer / owner 标注（FND-D-14）

- 三条任务级总账（净行数 / 每任务记录文件数 / 无 reader 对象数）**是只读计算**，不是新对象、不新增计数器（避开 CONSTITUTION F11）。
- 每条标注**既有 consumer 与 owner**：
  - 净行数 → consumer = C8 双证验收的 M4；owner = 任务Ⅲ 主会话；命令 = `git diff --shortstat <baseline>..<delivery>`。
  - 每任务记录文件数 → consumer = C8 的 M3；owner = 任务Ⅲ；命令 = `find <store>/<task> -type f | wc -l`。
  - 无 reader 对象数 → consumer = C8 的 M3 附属项；owner = 任务Ⅲ；方法 = §4.4 的逐对象 consumer 扫描。
- 用户 R3-Q5 = **B（不加新的行为型判据）**；因此本任务的验收**不直接证明**「机制开销净降」——该缺口作为 `accepted_risk` 保留在 §8.2 FND-D-09，不改写、不淡化。

### 16.11 写口「第三项 待写字节」必须真实现（G-001）

- **实测事实**：`inspectWriteBoundary`（`runtime/evidence/write-boundary-preflight.mjs:44-152`）内**没有任何「待写字节」比对**；唯一一处 ref+hash 比对在 `persistWriteBoundaryPathCard:216-217`（裁定 J-3 的删除目标），且 `tools/cli/task-close.mjs:189-195` 先 `readRecord` 算 hash、callee 再 `readRecord` 比对 ⇒ **同源自比、恒真**；`stage-runner.mjs:1361` 的 `assertWriteBoundary` 是**另一个同名本地函数**，只查身份/工作区/cwd，**一个字节都不比**。
- **裁定（G-001=A）**：在**真正的写入点**新增一次核对 —— 比对「**即将写入的字节**」与「**已认证来源的字节**」，不符即 **fail-loud**。
- **性质声明**：这是**把母决定 D-009② 本就要的语义补实**，**不是**新增控制面对象（不新增文件 / schema / public command / 状态机），因此不与 T-014 的任务级非目标冲突。
- **记账要求**：这是本任务**唯一的「新增实现」**，必须在 §3.5 的净减账里**单列**，并由 C1/C2/C5/C6 的净减吸收。
- **失败语义**：不符时抛明确错误（沿用现有 `path card source hash is stale` 之外的具名文案），**不得静默放过**；错误文案与判据一并写进 C5 的 AC。

### 16.12 完成判据的输入必须同批改写（G-002）

- `CONTEXT.md:374` 原文要求「当前 task、stage、**material revision 和适用 snapshot**」；C5 删除该链后该句**失去输入来源**。
- **裁定（G-002=A）**：由 **C5 同一批**把该句改写为新判据输入：**identity 三项（`task_id` + 工作区路径 + 待写字节）+ `facts.jsonl` 本阶段行 + 六类具名 ref**；并登记交接项（`HANDOFF-T2-007`）交任务Ⅲ C7 复核。
- **边界声明**：本任务只改**这一句**，不改 `CONTEXT.md` 的其他内容，不替代 C7 的治理同步。

### 16.13 事实底座与派生投影的界线（G-003）

- **保留（事实底座）**：`status_matrix`、`identity`、`source_completeness` 三块 —— 它们是**事实**，不是派生结论。
- **收掉（派生投影）**：`product_release` 投影、`status_groups` 及其四投影（`quality_gaps` / `release_gaps` / `close_preparation_gaps` / `actionable_now`）。
- **界线判据（写死）**：**能由具名 ref 直接读出的事实**属于「底座」，**由其他投影再加工得出的中间结论**属于「派生投影」。C6 只收后者。
- **附加要求**：三块底座必须逐块写出各自的 consumer；写不出 consumer 的按 D-013「没有真实 consumer 就删」另行裁定，不得默认保留。

### 16.14 `facts.jsonl` 行型字段旧改名决定（历史）与 post-merge amendment

- **历史决定（当时有效）**：G-004/G-006 曾要求任务Ⅰ把 discriminator 从 `record_kind` 改名，并登记 `HANDOFF-T2-006`。保留这段事实，不倒填历史。
- **post-merge 用户修正（当前权威）**：Task I 最终在 `9f9d0c44` 冻结并实现 `record_kind: stage | close_action`；用户现明确接受。`HANDOFF-T2-006` 关闭为 superseded/accepted。
- **实施后果**：不改名、不迁移、不做 compatibility、不回填；C5/C6 的扫描不得把 `record_kind` 或 K2/K5 身份/绑定字段当删除目标，只删 freshness/currentness 比较与 use sites。

### 16.15 T-011 的实跑定性为「通道验证」（G-005）

- **裁定（G-005=A）**：T-011 的实跑验证**不是第二次审查** —— 它**不产出 findings、不进 sink、不计入 stage 的审查面轮次**；只在事实里记录「同一材料改协议后可重跑」的**退出码**。
- **依据**：`CONTEXT.md:98` 的审查闭环允许在「上一轮无任何语义建议 **且** 具体传输或材料问题**已经改变**」时重发；T-011 的修复正是「具体传输问题已经改变」那一档。
- **硬约束**：材料里必须写明「**它不产出审查事实**」，否则下游会把它当审查引用（这正是 FND-D-09 类误读的来源）。

### 16.16 交互聚合的形状已预演验证（不是猜测）

在 step 11 之前，主会话用**仓库自身的校验器**（`validateInteractionAggregateContract` + `validateInteractionLifecycleSequence`，`runtime/stage/stage-content-contracts.mjs`）对一份草稿聚合做了两次 dry-run，把形状要求逐项钉死：

| 要求 | 事实（第一次预演失败 → 第二次通过） |
| --- | --- |
| Talk 回复必须带 `remaining_question_ids` | 缺它时校验器报 `talk reply must preserve and re-rank remaining question ids`；本任务 20 问全部已答，故取值 **`[]`** |
| Grill 回复必须带 `remaining_frontier_ids` | 同上，取值 **`[]`** |
| `grill.summary` 必须是**非空字符串** | 传对象时报 `interaction aggregate grill must retain a completed summary`；`explicitFact` 的定义 = `nonEmptyString(value) && !/^(?:unknown\|unavailable\|n\/a\|na)$/i.test(value.trim())` |
| 每轮的 `card_ref` 必须**互不相同** | 复用同一占位 ref 时报 `interaction card … was started more than once` |
| `advice.status = "unavailable"` 可用 | 但必须带非空 `reason`（本任务用它承载审查通道失败） |
| 事件序列固定 | 恰好 `ask → wait → reply → resume`，且 `wait.status = "waiting-for-user"`、`resume.status = "resumed"`、`reply.source = "user"`、`re-hash` 三者必须逐字绑定同一张卡与同一轮 |
| Grill 不得产出审查事实 | `review_fact` 键或 `produces_review_fact: true` 出现即判失败（本任务不写这两个字段） |

**方法学声明（如实登记）**：本任务产出的 `card_ref` / `card_hash` / `reply_ref` / `reply_hash` 是**内容寻址的问答凭证** —— 由主会话把当轮的问题卡与用户真实答复分别做规范序列化后取 sha256，并把规范字节落盘到 `quality/evidence/interactions/cards/<sha256>.json`，使第三方可以**按文件重算哈希**核对。它与任务Ⅰ 的 `session:card:talk-r1` 式非内容寻址引用不同：**本任务的引用可被独立复算**。

### 16.17 交互聚合的装配次序约束（与任务Ⅰ 同一个坑，提前登记）

交互聚合绑定的是**决策记录的最终字节**（`decision.hash`），但聚合的落点与绑定关系又要写进同一份决策记录 —— **把哈希内联进材料会立刻让该哈希失效**。任务Ⅰ 已实测踩过（其 §10 原文：「先在 §10 写了聚合 ref 与材料哈希，随后写 §16/§17 即让聚合绑定失效，`run --action=execute` 报 `interaction aggregate does not bind the current task and decision`」）。

**本任务遵守的次序（写死）**：

1. 先把 §10 的**用户真实答复原文**写完（**只写文字，不内联任何 ref / sha256**）；
2. 再按**当时的最终字节**重算 `decision.hash` 与 `decision.revision`；
3. 然后装配聚合、序列化、取 sha256、写到 `quality/evidence/interactions/<sha256>.json`；
4. §10 里**只记落点与绑定关系**（「聚合落在 task store 的 `quality/evidence/interactions/`，`schema_version = workflowhub-interaction-aggregate.v1`，`round_count = 3`」），**不写哈希**。

**计入材料的事实**（算于 1,386 行 / 185,363 B 那一版，仅供对照，**不作为装配依据**）：

| 量 | 值 |
| --- | --- |
| `decision-log.md` sha256 | `60008699b0a262c598184bdb581bc6c28ac7344f6406aca7aa8e7beeab1d25ca` |
| `materialRevisionFromValues([decision-log.md, spec.md=null, plan.md=null, tasks.md=null])` | `revision-e5e032081e5d1a276d7cb0a66e2ff40cfba073640eddfd781479165603f3a99a` |

### 16.18 验收基线在 T2 worktree 内复核（写入材料之后，不是开工时的旧值）

§3.5 的「正式验收口径」写的是本任务开工实测值。在决策记录已写到 1,404 行之后，主会话**在 T2 worktree 内重新实测**了三个守卫，确认「写入材料」本身没有让基线劣化：

| 守卫 | 命令 | 实测 | 与基线 |
| --- | --- | --- | --- |
| markdownlint | `./node_modules/.bin/markdownlint-cli2 "**/*.md"` | **612 error(s) / 35 个出错文件**，exit 1 | **一致** |
| 路径守卫 | `node tools/cli/check-task-record-paths.mjs` | **10 条 FAIL**，exit 1 | **一致** |
| 结构守卫 | `node tools/cli/verify-structure.mjs` | **2 条 FAIL**（`CONTEXT.md 缺五段术语「test-acceptance」`、`CONTEXT.md 含排除术语「runtime」`），exit 1 | **一致** |

**关键细节**：本任务的 `specs/workflowhub-mechanism-simplification-t2-20260911/` **不在** `.markdownlint-cli2.jsonc` 的 ignores 里（ignores 只含 `specs/archive`、`specs/m7-intake-v1`、`specs/m9-verify-code`、`specs/m10-baseline-switch`），所以新写的 `decision-log.md` **确实被纳入全仓扫描**，而它自测 0 error ⇒ 全仓计数不变。这条同时说明：**本任务四份材料保持 0 error 是可核对的硬约束，不是自评**。

**与 §3.5 的关系**：`CONTEXT.md` 的两条既有 FAIL 属**既有红基线**（与 C5 计划改写的那一句无关），本任务不负责清零，但**不得使其上升**。

### 16.19 问答凭证的生成方法与**还原边界**（如实登记，不掩饰）

8 个凭证已生成在 `quality/evidence/interactions/cards/`，文件名 = 内容的 sha256（无尾换行、规范序列化）。**主会话逐项复核通过**：8/8 哈希与文件名一致；4 张卡的题目数 4/10/6/6 与三轮 Talk + Grill 完全对应；全部通过 `validateInteractionQuestionBatch`（axis 卡内唯一、推荐项合法、每题 2–3 个选项且四个字段齐备）；4 份回复**零缺失、零多余、零错误绑定**（26 问全对）。

**用真实凭证装出的聚合已过校验**：`validateInteractionLifecycleSequence` 的 talk 与 grill 两条序列均 `ok`；`validateInteractionAggregateContract` 对完整聚合返回 **`valid`、0 error**（`decision.hash` 仍为占位，待 step 11 写入 §10 后重算）。

**必须如实登记的还原边界**（生成子代理主动披露，主会话确认无误）：

| # | 还原项 | 边界 |
| --- | --- | --- |
| 1 | **T-010 的推荐项** | 决策记录里**没有**逐字推荐标记（当时该题是中性追问），凭证按 D-003 的推荐语义填 `recommended_option = B`，用户实选 A ⇒ 记为「非推荐」。`recommendation_reason` 已写明该依据 |
| 2 | **T-019 的推荐项** | 同上按 D-003 语义填 `A`，用户实选 B ⇒ 「非推荐」。其余 Round 3 各题按「用户实选即推荐」处理，reason 已写明 |
| 3 | **Round 3 与 Grill 的未选项文本** | `§7 grill` 表只有四列（无逐项选项列），G-001~G-005 的未选项取自 §9 对应决定的 `rejected_alternatives` 真实文字；**G-006 材料只记了选中的 A**，故该题只有 2 个选项（B 由该行表述还原） |
| 4 | 未选项的 `consequence` / `risk` | 由 §8.2 / §9 / §16 的文字整理，**未新增材料之外的结论** |

**结论**：凭证的**结构性事实**（问了什么、答了什么、选项绑定、轮次与顺序）**可被第三方按文件重算核对**；**选项的文案细节**在少数几处是**从决策记录还原**的，不是原始传输字节的拷贝。这条区分写在这里，供下游与验收者正确理解 `card_hash` / `reply_hash` 的证据强度。

### 16.20 stage 末三步的**诚实边界**（只记有后果的事实，不抄流程）

- **无宿主 bridge** ⇒ 运行时的**认证 stage outcome 预计为 `unavailable`**，`outline_closed` 类形式收口不成立；`stage-reflect` 又要求 judgment 的 executor 身份与**认证 outcome 逐项相等** ⇒ **复盘同样预计只能是 `unavailable`**。按 RISK-006 如实登记：**不得**把「在主会话内跑过 lens 语义」说成「已认证通过」，也**不得**用旧原件冒充本次完成。
- **`spec-analyze` 在 make-decision 的输入边界**：只吃**原始需求 + `decision-log.md`**，不请求额外文件、不自行定位仓库文件；它必须单独评估的五项与 `status --action=begin` 报出的 `quality_missing` 逐项对齐（`requirement_coverage` / `goal_achievement` / `acceptance_clarity` / `solution_convergence` / `plain_language_card`）。这五项在 step 12 全部补齐之前，**quality 事实保持 `in_progress`**，不得自称完成。

### 16.21 Round 4 后的材料修正（细节审查 15 项处置的落地）

> 本节对应 §8.4 的处置表；**前文原文保留不改写**，以本节与就地修正后的 §3.5/§2.4 为最新权威。

**第 1 条（FND-T-01）· 不再声明源 sha/字节**：材料里**不写**送审源的 sha256 或字节数（写了就会因为任何一次后续写入而失效，并诱发身份类 findings）。改为指针式表述：**以 `specs/<task-id>/decision-log.md` 当前字节为唯一权威源**；任何消费者自行按当前文件重算。同时登记 §8.3.1 的流程错误：**审查在飞期间不得改写被审材料**。

**第 2 条（FND-T-02 / T-07 / T-08）· 单一 v1.1 权威 OI 表**：下表**取代 §2.4 的表**（§2.4 标注为 `v1` 历史版本，只读保留）。共 **26** 条，四个字段齐备。

| oi_id | category | status | requires_user_decision | selected_disposition（摘要；全文见 §2.4 同名行与 §16 对应小节） |
| --- | --- | --- | --- | --- |
| OI-01 | background | confirmed | false | 「一条合并列车」**仅指本仓**；跨仓不在本任务合并列车内（§16.2） |
| OI-02 | background | confirmed | false | 15 提交漂移已逐项实测；PRD 三处前提在本基线失效 |
| OI-03 | problem | confirmed | false | 逐条：预检仍空实现；审查卡死形态已变；哈希链仍在；绿灯失效仍在；status 噪音仍在；「启动 8 次」`unknown` |
| OI-04 | problem | confirmed | true | 4 个新增生产文件按 T-006 逐项定归属；新增控制面本身进任务级非目标 |
| OI-05 | goal | confirmed | true | 以四张卡各自判据为准 + 任务级三条总账核对一次 |
| OI-06 | goal | confirmed | true | 接受 C9 净增并单列；不为凑数字删东西 |
| OI-07 | solution | confirmed | true | 执行序 C9→C4→C5→C6；合并排在任务Ⅰ 之后；C5 先于 C6 |
| OI-08 | solution | confirmed | true | 档位改名改到底 + `aggregate` 契约上限 `null` + **三条硬前置**（consumer 点名 / 必须新增命令入口 / 未落地不得声明完成） |
| OI-09 | solution | confirmed | true | 同时交付两仓；跨仓标 `unknown`；跨仓改动前一个人工确认点，**被拒则只交本仓消费侧、不停批**（R4-Q3） |
| OI-10 | solution | confirmed | true | 主机制 = 3rd-review 健康判死；20 分钟**显式兜底**；**终态用现有合法 outcome，`stalled` 只作调用侧标签**（R4-Q2） |
| OI-11 | solution | confirmed | false | 写口恰三项，第三项**真实现**；`path-cards` 整类删；C5 清单补两个文件 |
| OI-12 | solution | confirmed | true | `stale` 作根因行普通条目；canonical ref **六类闭集**；收口用等值判定 |
| OI-13 | solution | confirmed | true | **修** T-11（协议版本进请求身份）并实跑验证一次 |
| OI-14 | solution | confirmed | true | 四文件逐项归属：projection→C6（**改写、不删**，R4-Q4）；produce/validate→补进 C5 清单；measure→C9 先评估复用 |
| OI-15 | acceptance | confirmed | true | 基线 = 开工实测（612 / 10 / 2）；判据 = 不劣化 + 本任务范围内清零 |
| OI-16 | acceptance | confirmed | true | 四批各一可见结果 + 一停止条件；每批做完立刻验；跨仓前一个确认点 |
| OI-17 | extension | confirmed | true | 交接项按「具名 + owner + 触发 + 关闭条件」列全（**7 条**） |
| OI-18 | extension | confirmed | true | 零延期；任务Ⅰ 两条 `HANDOFF` 由本任务接收 |
| OI-19 | complete_user_flow | confirmed | true | 任务Ⅰ 形态 + 跨仓确认点；**并含主会话/子代理责任边界与执行入口条件**（OI-25 承载） |
| OI-20 | page_scope | confirmed | false | **`non_ui`**（三输入按证据合并） |
| OI-21 | data_state | confirmed | true | K2 两型行的 frozen discriminator = `record_kind`，值为 `stage` / `close_action`；另含 `review_origin` 五态、`path-cards` 删除、`verify.json` 收掉、六类具名 ref |
| OI-22 | success_failure_boundary | confirmed | true | 做不完停在那批；五类状态语义；不可逆动作须人确认 |
| OI-23 | non_goals | confirmed | true | E-1~E-20 沿用 + **E-16 适用范围收窄** + 任务级非目标「不得净新增控制面」 |
| OI-24 | deferred | confirmed | true | 零延期；**中性问句版**：哪些属本任务/交接/非目标/延期，各带 owner 与关闭条件 |
| OI-25 | complete_user_flow | confirmed | true | **主会话与子代理责任边界 + 执行入口条件**（§16.5；FND-D-07 / D-13 的落点） |
| OI-26 | data_state | confirmed | true | **按 consumer 分类 993 处哈希用途**（四类：身份/完整性保留、失效链删、并行快照限生产读路径、无 consumer 残留删）（§16.6） |

**第 3 条（FND-T-03）· `facts.jsonl` 行型字段名（post-merge 当前权威）**：Task I 已冻结并实现 discriminator `record_kind`，取值恰为 `stage` / `close_action`，用户接受。历史「字段名不定稿 / 不得复用 / 等待新名」决定已 supersede；`HANDOFF-T2-006` 已关闭。本任务及下游必须接受现有 frozen 合同，不改名、不迁移、不兼容、不回填。

**第 3.1 条（用户于当前会话确认的 C4 最小 origin 口径）**：用户授权把 C4 五维元组的 `origin` 定义为**宿主认证、有限且可由现有非新增持久字段重建的 scope/subject 分类**；材料内容、材料 ID、路由身份、provider 身份和证据哈希只属于 provenance/integrity，不得成为 origin。该授权不等于把 K2 的 `review_origin` 当作语义 origin，也不授权新增 request/schema/K2 字段或兼容桥。若现有历史记录无法无歧义重建此分类，必须 fail-closed；readback 必须在身份匹配后通过既有 K2 `review_result_ref` 指向的 K5 原件完成。

**第 3.2 条（用户于当前会话确认的 T18 删预算写边界扩项）**：AC-C4-002 要求 `validateReviewBudget` 在 `runtime/` 零命中，但实测存在一个**边界外、无任务认领的直接消费者** `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`（具名 import 该符号 + 7 处行为断言，当前 28/28 通过），该文件不在 T17/T18 的 7 个授权文件内、不在 C4 批测试矩阵（plan.md:347）、不在 plan.md 全局 File Boundary 并集，plan.md/tasks.md 全文均未提及。具名 ESM import 决定「删导出必链接失败、留导出必 grep 红」，故按现有边界无解。用户于当前会话选择**扩边界**：授权把 `tests/contract/freeze-classification-budget-usage-protocol.test.mjs` 加入 T17/T18 写边界，按 AC-C4-002 真删 `validateReviewBudget` 及其两个运行期消费点（`runtime/review/review-record-route.mjs`、`runtime/stage/stage-handlers.mjs`），并把「每 Phase 一次核心审查 + 只在大改动时一次 focus 复审」的判定表搬到审查路由自己名下（保留同样的允许/拒绝结论，FR-C4-003 的策略不删），同时把该测试块改为对同一判定表断言同样的策略结果并补一条公共入口断言。该扩项只覆盖这一个文件；其余 C4 批只读消费者（`tests/review/review-record-route.test.mjs`、`tests/contract/review-budget-namespace.test.mjs`）仍不得修改，其可观察 `review_budget` 结论必须保持通过。

**第 3.3 条（用户于当前会话确认的 C9 门禁修正 + 边界归属）**：用户于当前会话确认修正 T12/T13 的尾部检查。原检查 `&& ! grep -rn medium runtime/stage/stage-content-contracts.mjs docs/adr/0027-test-feedback-runtime-profile.md | grep -qv tests` 语义过宽：该文件里残留的三处 `medium` 全是 `REQUIREMENT_IMPACTS = ["high","medium","low"]`（只被 `validateRequirementCoverage` 使用的需求影响词汇），与档位改名无关；档位常量 `TEST_RUNTIME_PROFILE_NAMES`/`TEST_RUNTIME_PROFILE_LIMITS_MS` 早已是 `inner/phase/aggregate`，旧名 `large` 在该文件与 ADR 中均为零命中，行为 oracle `ORA-C9-001` 也已证明改名到底。用户选择「只查档位词」，故 T12/T13 门禁尾段改为：`test -z "$(grep -nE '"(medium|large)"' runtime/stage/stage-content-contracts.mjs | grep -viE 'impact|REQUIREMENT')" && ! grep -nE '\b(medium|large)\b' docs/adr/0027-test-feedback-runtime-profile.md`；不改 requirement impact 公共词汇，不动 C9 写边界外的 schema/CLI。修正后 C9 批门禁首次 exit 0（5 文件 40 测试全绿）。同一会话另修两处：C9 T8/T9 把 `reusableTestCapture` 的复用范围守卫整段删除导致 verify-code 可为任意命令复用 build-code 回执（已按「同阶段任意命令可复用 + 仅全量测试命令允许跨阶段复用」收紧，`test-capture-reuse` 2/2、`review-materials-contract` 42/42）；T23/T24 新增的仓库根访问触发 `check-anti-host` class 2（`REPO_ROOT =` 与多段父目录上行），已改为运行时既有批准写法 `fileURLToPath(new URL("../../", import.meta.url))` 与既有常量名 `REPOSITORY_ROOT`，守卫 exit 0。

**第 4 条（FND-T-04）· C4 终态映射**：见 §3.5 C4 条的「终态映射（R4-Q2 = A，写死）」段。

**第 5 条（FND-T-05）· E-16 适用范围收窄**：见 §3.5 非目标首条。

**第 6 条（FND-T-06）· detail 审查的对象边界（R4-Q1 = A，写死）**：detail 审查的对象是**本阶段的产出** —— **OI 终态记录 + 决定链 + 客观事实**；**不要求**四卡的逐条 FR/AC/oracle，因为：① 它们属于**任务组 PRD**（本材料以**卡号 + PRD 行号**作具名引用，供审查者自行核对）；② `spec.md` 由 **build-spec** 产出，make-decision **不产出也不应产出**它；③ decision-log 的契约明写「保持决策索引，**不抄 spec**」。后续送审材料必须**显式声明这条边界**，避免再被判为「不是可执行规格」。

**第 7 条（FND-T-09）· OI-08 吸收硬前置**：见 §16.6/v1.1 表中 OI-08 行与 §16.3。

**第 8 条（FND-T-10）· C6 的六类具名 ref 闭集（可执行口径）**：

| 类 | 形态 | 读取方式 | 禁令 |
| --- | --- | --- | --- |
| K1 任务身份 | `task.json`（单文件具名） | 直接读该 ref | — |
| K2 执行记录 | `facts.jsonl`（单文件具名，含 `stage` / `close_action` 两型行） | 直接读该 ref | — |
| K3 四份材料 | 四个**具名文件**：`decision-log.md` / `spec.md` / `plan.md` / `tasks.md` | 逐个按名读 | 不得列目录后自行挑选 |
| K4 人确认与授权 | `quality/confirmations/<sha256>.json` / `quality/authorizations/<sha256>.json`，**按 ref 逐个点名** | 按点名的 ref 读 | 不得用 `readdir` 扫目录决定读什么 |
| K5 被点名的原始证据 | 由 K2 行或 close 动作行**逐个点名**的 ref（含 `stage-outcome-proofs/**` 的具体文件） | 按点名的 ref 读 | 同上 |
| K6 具名 diff 输入 | 四份材料与 HEAD 的具名 diff | 直接算 | — |

**允许**「具名目录的存在性枚举 + 逐个 ref 点名」；**禁止**「`readdir` 的结果决定读取内容」。这条同时是 C6-AC-13 的判据。

**第 9 条（FND-T-11）· C5 的 9 个标识符与 OI-26 的四类**：见 §3.5 C5 条（已列字面量）与 §16.6（四类分类口径）。可复算命令：对 §3.5 C5 条的**覆盖面清单**逐个文件跑
`grep -rn "<9 个标识符的择一>" --include='*.mjs' --include='*.yaml' --include='*.json' <清单> | grep -v -E '__tests__|/tests?/|\.test\.'`，期望 **0 命中**；并**显式打印**排除项（`core/task-close.mjs` 的 planning 分支）作为 C6 的移交证据。

**第 10 条（FND-T-12）· 写口第三项的文案统一**：见 §3.5 C5 条（已改）。**旧文案 `path card source hash is stale` 随 path-cards 一起删除**，材料不再声称保留它；新核对的错误文案由 **C5 build-spec 定名并写进 AC**。

**第 11 条（FND-T-14）· 跨仓三处对齐（R4-Q3 = A）**：见 §3.5 的「跨仓人工确认点与『被拒』出口」段与 v1.1 表的 OI-01 / OI-09 行。

**第 12 条（FND-T-15）· 编号纪律**：本记录的 D 编号（`D-001`~`D-024`）与**任务组母材料的 D 编号**是两个命名空间。**凡引用母决定的编号，必须显式写「母决定 D-0xx」**；§3.5 C6 条已按此修正。

## 17. stage-end spec-analyze（step 12）

> 按 `skills/spec-analyze/SKILL.md`（`mode = lens-only`）在 make-decision 的输入边界内执行：**只吃原始需求 + 本决策记录**，不请求额外文件、不自行定位仓库外的材料。

### 17.1 五项 stage 专属评估

| 评估项 | 结论 | 事实依据（可复算） |
| --- | --- | --- |
| `requirement_coverage` | **pass** | §1.2 的 **R-001 ~ R-020** 在本文档内**逐条被引用**（实测计数 R-001:8 / R-002:18 / R-003:2 / R-004:4 / R-005:11 / R-006:4 / R-007:6 / R-008:8 / R-009:5 / R-010:2 / R-011:2 / R-012:1 / R-013:13 / R-014:2 / R-015:3 / R-016:2 / R-017:2 / R-018:1 / R-019:1 / R-020:1，**无一为 0**）；六类固定类别 `complete_user_flow` / `page_scope` / `data_state` / `success_failure_boundary` / `non_goals` / `deferred` **全部有承载** |
| `goal_achievement` | **pass（并有一处如实保留的缺口）** | 目标（四批收敛 + 净减主线）在 §3.5 正式范围与 26 条 OI 终态里逐条落成；**缺口 = 验收不直接证明「机制开销净降」**，由用户 R3-Q5 明确选择不加判据，登记为 RISK-009 与 §8.2 FND-D-09 / §8.4 FND-T-13，**未淡化** |
| `acceptance_clarity` | **pass** | §3.5「正式验收口径」给出**主尺子**（四卡各自判据）、**任务级核对**（三条总账）、**基线**（markdownlint 612/35、路径守卫 10、结构守卫 2，已复核）、**禁止事项**（无范围全量回归）、**每批即时验证**与**净减账记账规则**；§3.8 给出逐批**停止条件** |
| `solution_convergence` | **pass** | 方向已收敛：Talk 三轮 20 问 + Grill 6 问 + Round 4 4 问全部收到真实回复，**无遗留 `high`/`medium` 待答项**；26 条 OI 终态**无 `open` 残留**；两份审查的 **61 条原始 findings** 逐条处置完毕（`fixed` 25 / `accepted_risk` 4 / `rejected_invalid` 0 / `needs_human` 0） |
| `plain_language_card` | **pass** | §10.1 的大白话结束卡**八项齐备**：方向 / 范围（四批）/ 非目标 / 成功判据 / 主要风险 / 建议与审查事实 / 未决项 / 延期项（实测八项标记各命中） |

### 17.2 六段大白话摘要

1. **当前阶段做了什么（`stage_work`）**：把一个已经定好方向的整改路线，落成**四批可执行开发**的决策——四批是执行面（C9）、审查生命周期（C4）、记录失效链（C5）、收口状态（C6）；建立了 26 条当前 OI 大纲并全部收敛，做完三轮 Talk（20 问）、一次 Grill（6 问）、两次独立异源审查与一次细节审查后的追加裁决（4 问），并取得用户真实确认。
2. **原始需求覆盖到什么程度（`requirement_coverage`）**：R-001 ~ R-020 **全部有承载**，无一遗漏；母材料里**没有用户原话**的那四条（慢测试 / 900 秒 / 同命令重复 / 开工前预检）已**如实标注为「来自决定条文而非用户原话」**，没有伪装成用户要求。
3. **与上游、实际语义和证据是否一致（`upstream_alignment`）**：与任务组 PRD 的偏离**逐条登记在 §3.7**（超集 4 处、偏离 2 处、细化 2 处、已被 HEAD 满足 1 处）；其中两处偏离有明确实测依据（PRD 的 `C4-FR-10②` 前提在 HEAD 已被推翻、T-11 的反对理由经实测不成立），并各自带 RISK 登记。
4. **当前阶段当场修复了什么（`current_stage_repairs`）**：两次审查共 **61 条原始 findings** 中判 `fixed` 的 **25 条**全部在本阶段修复并留证；另修复了**我自己的两处失误**（送审包题面预设结论、审查在飞期间改写被审材料）与**装配方的三项装配缺陷**（`requires_user_decision` 误解析、头部引用源 sha、`source_ref` 行号偏移）。
5. **剩余风险、未决和延期（`remaining_risks`）**：RISK-001 ~ RISK-011（含跨仓不可闭合、孤儿进程、改名波及面、任务Ⅰ 时序、验收不测核心结果）；OPEN-001 ~ OPEN-009；**延期项为零**。
6. **下游可以直接消费什么、不能自行猜什么（`next_stage_boundary`）**：**可以直接消费** —— §16.21 的 **v1.1 权威 OI 表**、§9 的 24 条决定链、§3.5 的正式范围/非目标/交接项、§3.6 的命名唯一定义、§3.8 的用户流程与失败语义。**不得自行猜** —— ① `facts.jsonl` 行型字段的**新名**（由任务Ⅰ 定，本任务只约束禁项）；② 3rd-review 侧的**判死阈值**；③ `stalled` 的**下游语义**；④ 四张卡的 **FR/AC/oracle 细节**（在任务组 PRD 里，本材料只给卡号与行号引用）；⑤ 本文档**未写死**的任何验收口径。

### 17.3 findings 与 metrics

- **findings：无一致性问题**（在本阶段的输入边界内，未发现 inconsistency / duplicate / ambiguity / underdefined / deferred_open_handoff / constitution-alignment 类新问题）。
- **Coverage Summary / Metrics**：Total Requirements = **20**（R-001~R-020，另有母材料逐字原话 5 条）；Total OIs = **26**；Coverage = **100%**；Ambiguity Count = **0**；Duplication Count = **0**；Critical Issues Count = **0**。
- **执行事实（如实）**：本 lens 由**主会话**在 make-decision 的输入边界内执行；**无宿主 bridge ⇒ 运行时的认证 stage outcome 预计为 `unavailable`**，因此**不得**把它说成「已认证通过」（§16.20 的诚实边界）。若将来有 bridge，本节的结论可作为其输入重跑。

## 18. publish-decision（step 13）· 阶段末遗漏披露与交接

### 18.1 阶段末遗漏披露（逐项列出，无遗漏就明说）

| step / skill | 状态 | 真实原因与证据 |
| --- | --- | --- |
| step 1 load-context | **completed** | §0–§4；官方通道 `run --action=draft` 写入 |
| step 2 triage-scope | **completed** | §3.1–§3.4 + §3.5 正式版 |
| step 3 talk-round-1 | **completed** | §5 Round 1（T-001~T-004，真实问答） |
| step 4 research-inputs | **skipped（有真实理由）** | §6 `R-SKIP-1`；用户 T-002 选 A |
| step 5 talk-round-2 | **completed** | §5 Round 2（T-005~T-014，三批） |
| step 6 direction-advice | **unavailable（部分完成）** | 审查**真实跑完**（2×3 派发、20 条 findings），但 **CLI 记录通道失败**、未写 sink ⇒ 只能声明 `unavailable`；原始证据保全（§8.1/§8.1b） |
| step 7 talk-round-3 | **completed** | §5 Round 3（T-015~T-020） |
| step 8 grill-with-docs | **completed** | §7（6 问 + 覆盖矩阵 + 四项退出检查全 `pass` + `grill_summary`） |
| step 9 write-decision-draft | **completed** | §9（24 条决定 D-001~D-024） |
| step 10 detail-advice | **unavailable（部分完成）** | 同上：真实跑完（2×4 派发、41 条 findings），CLI 记录通道失败（§8.3） |
| step 10b 条件性 talk-round-4 | **completed（已触发）** | 细节审查有 4 项方向级/影响验收的争议 ⇒ 触发并完成（R4-Q1~Q4，全部 A） |
| step 11 approve-decision | **completed** | §10；官方 `confirm --action=decision` 签发 `quality/confirmations/62c2aa46….json`（`decision=accepted`）；交互聚合已装配并写盘（`quality/evidence/interactions/8e043f1c….json`，`valid`） |
| step 12 stage-end spec-analyze | **completed（主会话执行）** | §17；但**认证 outcome 预计 `unavailable`**（无宿主 bridge） |
| step 13 publish-decision | **completed** | 本节 |
| step 14 stage-reflection | **见 §19** | 预计 `unavailable`（judgment 的 executor 身份需与认证 outcome 逐项相等，而后者不可得） |
| skill `deep-research` | **not_applicable** | 用户 T-002 明确不做外部调研；理由已逐条登记（§6） |
| skill `wh-review`（两次） | **unavailable** | 见 step 6 / step 10 行；**不得**当作通过，也**不得**当作「零 findings」 |
| 宿主 bridge / `outline_closed` | **unavailable** | 本会话无外部宿主 bridge；`outline_closed` 形式收口不成立（RISK-006） |
| 官方 `run --action=execute`（stage 交接） | **unavailable（实测）** | 已实际调用并取回真实结果：`stage_handoff.status = "unavailable"`、`current = false`、`reflection_status = "unavailable"`，错误 = `ENOENT: … specs/workflowhub-mechanism-simplification-t2-20260911/spec.md` —— **make-decision 阶段本就没有 `spec.md`**（它是 build-spec 的产出），因此该 ENOENT 是**阶段边界的正确表现**，不是缺陷。运行时另产出两条 availability 事实：`quality/evidence/stage-reflection-availability/b6826b23….json`（step 14 尝试）与 `e7682dc6….json`（本次 execute 尝试） |

**无遗漏声明**：上表已列出本阶段**全部**未完成 / 失败 / 跳过 / 不适用 / `unknown` / `unavailable` / `incomplete` 的 step 与 skill，**没有遗漏**。

### 18.2 下一阶段（build-spec）当前输入边界

1. `facts.jsonl` 行型字段已由 post-merge amendment 冻结为 `record_kind`，取值恰为 `stage` / `close_action`；build-spec 与所有下游必须接受，不改名、不迁移、不兼容、不回填。历史换名意见不得再作为 live 输入。
2. 3rd-review 侧的**判死阈值**与 `stalled` 的下游语义（OPEN-001 / OPEN-002）。
3. 四张卡的 **FR/AC/oracle 细节** —— 在任务组 PRD 里（本材料给卡号与行号引用）；make-decision **不产出 spec**。
4. 本文档**未写死**的任何验收口径；**零延期**不代表可以把未决项推给下游。
5. **E-16 的适用范围**（只约束写 PRD 的那个任务，不约束执行任务）。

## 19. stage-reflection（step 14）

### 19.1 执行事实（真实结果，不是声称）

| 项 | 实测值 |
| --- | --- |
| 入口 | `node tools/cli/stage-runtime.mjs run --action=reflect --stage=make-decision --project=workflowhub --task=… --input=<judgment.json>` |
| judgment | 已按 `stage-reflection.v2` + `record_kind: "judgment"` 产出，六区块齐全（`what_helped` / `what_to_improve` / `blockers` / `intervention_reasons` / `what_to_simplify` / `simplifiable_now`），每条带 `evidence_refs` 与 `confidence` |
| 第一次尝试 | `stage_status: "in_progress"` → **被拒**：`Error: reflection stage_status must be completed or failed`（`stage-reflect.mjs:151`）。**如实保留**：本阶段确实不是「认证完成」，改状态只是为了走到下一步核查，不是把它说成完成 |
| 第二次尝试 | `stage_status: "completed"` → **运行时不发布复盘，只产出 availability 事实**：`error = "reflection requires exactly one explicit authenticated executor outcome"`，`publication = null`、`lesson = null` |
| **落点** | `quality/evidence/stage-reflection-availability/b6826b23ebcc39f0ac824f4e023d3ca9315a61bf1cd2725deaba57a43edbb422.json`（`availability_sha256` = 同名） |
| **本阶段可声明的复盘事实** | **`unavailable`** —— 与 RISK-006 的预测一致：**无宿主 bridge ⇒ 无认证 stage outcome ⇒ judgment 的 executor 身份无法与它逐项相等**。**未伪造通过、未用旧原件冒充本次完成**（旧原件只读保留的规则已遵守） |

### 19.2 judgment 六区块要点（供复盘纳入，不含秘密）

- **`what_helped`**：① 重读量动作**全部派子代理**（13 次只读核查在子代理上下文完成，主会话只收摘要）；② **先复算再提问**（Grill 三条硬问题都由主会话亲自 grep 后才问）；③ **把审查者当真实信号**（61 条 findings 逐条处置，含我自己的缺陷）。
- **`what_to_improve`**：① **审查在飞期间改写了被审材料**（两次都发生，导致身份绑定失效并诱发 4 条 identity findings）；② **送审包两次泄漏处置**（direction 的 OI-24/OI-14 题面、detail 的 objective_facts 缺非目标），此前只用关键词 grep 做纯度自查、**没逐题读题面**；③ **交互聚合装配次序反复**（先装配后写 §17/§18 使绑定失效，需重装）——而这条次序约束任务Ⅰ 已经踩过并写在材料里。
- **`blockers`**：① wh-review CLI 归一化器缺陷（两次审查整包被丢，实测复现的第四条通道缺陷）；② 无宿主 bridge ⇒ 认证 outcome 与复盘均不可得。
- **`intervention_reasons`**：用户在 Round 3 与 R3-Q5 两次**明确维持**审查者反对的选择（20 分钟兜底、不加行为型判据），意见原文完整保留在 §8.2。
- **`what_to_simplify`**：make-decision 阶段被要求产出 19 个文档小节，其中 step 12/13 的契约细节本可直接执行。
- **`simplifiable_now`**：把交互聚合的装配次序从「写在材料里提醒自己」变成「**材料写入冻结后一次性装配**」的机械约束。

## UI applicability

三输入按证据合并（不是按 caller 标签）：

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "result": "non_ui", "description": "用户原话只要求按标准五阶段做任务Ⅱ 并共同梳理六类边界；未提出任何页面、交互或视觉诉求" },
    "project_inventory": { "result": "non_ui", "description": "本仓是命令行与运行时项目：runtime／tools／core／skills／workflows 由 Markdown、JSON、YAML 与 .mjs 组成；仓内唯一 .html 是 tools/cli/build-reflection-page-template.html（模板，不是前端应用）；无界面框架、无路由表、无可视化部件" },
    "planned_or_changed_frontend_fact": { "result": "non_ui", "description": "任务Ⅱ 计划改动面为 runtime/**、tools/cli/**、skills/wh-review/**、workflows/*/skill-deps.yaml、core/task-close.mjs、tests/**、docs/adr/0027*；唯一「人看的输出」是 C6 改的 status/close 根因文本行，是命令行文本而非页面、交互稿或视觉规格" }
  },
  "recompute_trigger": "任一批次引入需要人看的界面改动（交互稿、页面、视觉规格）时必须重算本事实"
}
```

**未声明 high risk**：用户未声明本任务为高风险用户可见，三输入也未建立该分类，因此本记录**不写** `high_risk_fact`。若后续某批次引入用户可见界面改动，须重算三输入并重新评估该分类。

## 20. 大白话结束卡（收敛检查的结构探针要求的三段）

> 本节是「大白话结束卡」的机器可读形态：运行时对决策记录做结构探针时，要求存在**核心需求 / 核心目标 / 已选方向**三段可读正文（不是只有内部 ID）。它是 §10.1 那张卡的结构化对应物，**不新增任何方向或口径**。

### 核心需求

按任务组 PRD 的**任务Ⅱ**，一次做完 **C9 / C4 / C5 / C6** 四个具名批次：执行面（测试分档、同命令去重、超时保留已完成部分、开工前预检）、审查生命周期（审查做过就算数、卡死由审查系统自己判死）、记录失效链（改一个文件不再让既有绿灯失效）、收口状态（只报根因）。用户原话要求「一起去仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项」。

### 核心目标

让 WorkflowHub 的机制**不再自我增殖**：跑得更快、审查不靠 timeout 收场、改一个文件不再让绿灯失效、`status` 只报根因。主线是**控制面净减**；C9 是唯一净增的卡，其正行数单列并由其余批次吸收；整改期间**不得净新增控制面**。

### 已选方向

按 **C9 → C4 → C5 → C6** 串行落地（执行序 = 合并序），合并严格排在任务Ⅰ 合入之后；每批一个可见结果、一个停止条件，做不完停在那批；跨仓部分同时交付但**本仓不可闭合**，动第二个仓库前有一个人工确认点，被拒则只交本仓消费侧并标 `unknown`、任务不停批。能删的删、能合的合，必要的兜底（20 分钟有界等待）必须**显式标注为兜底**。

## 收敛检查

> 机器可读形态：本表的「维度」列只写 `目标` / `范围` / `方案` / `验收`（运行时的结构探针按这四种字面量识别）。各行的用户答复原文与完整依据见 **§5（Talk 三轮 20 问）**、**§7（Grill 6 问）**、**§8.4（细节审查追加裁决 R4-Q1~Q4）** 与 **§10.2**。

| 维度 | 用户答案 | 事实与材料引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户确认 Round 1 T-001：以四张卡各自的判据为准，最后再用任务级三条总账核对一次 | D-001、D-004、decision-log.md#3.5 | 见「验收」行 |
| 范围 | 用户确认 Round 2 T-004/T-006/T-007/T-008/T-010/T-014 与 Round 3 T-015/T-016/T-018/T-020 及 Grill G-003/G-006 | D-003、D-014、D-015、decision-log.md#3.5、decision-log.md#16.2 | 见「验收」行 |
| 方案 | 用户确认 Round 3 T-017 与 Grill G-001/G-002/G-004/G-005/G-006 及 Round 4 R4-Q1~Q4；历史曾选择改 discriminator，现已由 post-merge amendment 接受 frozen `record_kind` 并关闭该交接；其余被拒方案与未决项按各自当前条款保留 | D-006、D-019、D-020、D-022（历史，已 superseded）、D-023、decision-log.md#16.21、decision-log.md#13 | 见「验收」行 |
| 验收 | 用户确认 Round 1 T-001/T-002/T-004 与 Round 2 T-012；确认原话为「接受，继续」 | D-001、D-016、decision-log.md#3.5、decision-log.md#10.2 | 场景：在本任务 worktree 内按 C9→C4→C5→C6 四个批次串行执行；数据来源：各卡针对性测试与 oracle 命令、开工实测基线 markdownlint 612 与路径守卫 10 与结构守卫 2、facts.jsonl 本阶段行；通过：本批判据全部实测通过且三个守卫计数不劣化；失败：任一判据失败、或守卫计数上升、或出现未经登记的新增控制面，即停在该批 |

---

> 以下四个小节是**运行时结构探针**所需的**可读小节**：探针要求标题为**精确的二级标题、不带序号**（`^## 范围$` 等），而本文档其余小节为保持可导航性都带编号。因此这里给出**同内容的无序号标题形态**；**不新增任何方向或口径**，正文与 §3.5 / §12 / §1 一致。

## 范围

本任务做任务组 PRD 的**任务Ⅱ**四批，串行不可跳：**C9 执行面**（档位改名 `medium/large` → `phase/aggregate`，慢测试分档与硬时间预算，同命令不重复跑，超时保留已完成部分，开工前预检 5 秒内给具体原因，另加三条硬前置：点名真实 consumer、必须新增命令入口、入口未落地不得声明完成）；**C4 审查生命周期**（补齐 3rd-review 健康判死当主机制，20 分钟有界等待保留并显式标注为兜底，终态映射用现有合法 outcome，请求身份加协议版本并实跑验证）；**C5 记录失效链**（删材料哈希与快照树与一改就失效的整条链，写口只留三项且第三项真实现，`identity/path-cards/**` 整类删除）；**C6 收口状态**（`status` 与 `close` 只报根因加六类具名引用，收掉 `verify.json` 与 product-release 派生投影但保留三块事实底座，主线前进只多一行落后提示，`current-close-projection.mjs` 改写不删）。

## 非目标

不新增第五份材料、public command、持久化对象或状态机；不改 wh-review 的分阶段审查标准与 prompt；不改历史 store 与已落盘 provenance 字节；不迁移历史任务、不做兼容桥、不建双写；不改 `workflows/verify-code/**`；不扩 `STAGES` 枚举；不新增 `close --preflight-only`；不新增任何防 stale 机制；不为凑净减数字删东西。**零延期**，不产出任何延期项。E-16「本任务不实现任何删除」的适用范围**收窄**为「约束写 PRD 的那个任务」，对执行任务不适用。另加一条任务级非目标：整改期间**不得净新增控制面**，确有必要的必须当场写明唯一 consumer、owner、替代关系与删除条件。

## 风险与延期交接

风险共 **11 条**（RISK-001 ~ RISK-011）：改名波及面、跨仓部分本仓不可闭合、审查卡住留下孤儿进程、T-11 修复偏离 PRD 原判且未实跑验证、基线继续漂移、无宿主 bridge 导致正式事实不可得、新增控制面文件的 consumer 登记不全、送审包纯度、**验收不直接证明机制开销净降**、任务Ⅰ 若已按旧字段名开工则改名成本上升、写口新增核对不得长成新对象。**延期项为零**；任务Ⅰ 移交的两条 `HANDOFF` 由本任务接收（`HANDOFF-001` 归 C5、`HANDOFF-002` 归 C4、`HANDOFF-003` 不属本仓范围），本任务另产出 **7 条具名交接项**交任务Ⅲ，每条带 owner、触发条件与关闭条件。

## 原始需求

用户本会话原话要求：按标准 WorkflowHub 开始任务Ⅱ，先创建 worktree、再从 make-decision 开始、不跳阶段、不依赖 build-spec 补需求；并在 make-decision 内与用户一起梳理完整用户流程、页面范围、数据状态、成功与失败边界、非目标与延期项；注意主会话上下文控制与子代理派发；Talk 与 Grill 用大白话说明选项、后果与风险。母材料里的用户逐字原话另见 §1.1；其中**慢测试、900 秒等待、同命令重复、超时丢结果、开工前预检**四条**不是用户原话**，来源是母决定 D-026②，已如实登记。

| 需求 | 含义 | 处置 | 承载卡 / 决定 |
| --- | --- | --- | --- |
| R-001 | 按标准五阶段执行、不跳阶段、不把需求推给 build-spec | covered | 全体 / D-001 |
| R-002 | make-decision 内梳理六类边界 | covered | 全体 / D-001 |
| R-003 | 主会话只收摘要、重读量派子代理 | covered | OI-25 / §16.5 |
| R-004 | Talk 与 Grill 用大白话说明选项后果风险 | covered | §5 / §7 |
| R-005 | 「未来还会阻塞」——改动须趋向净减少 | covered | D-004、D-015 |
| R-006 | 「超过 50% 花在流程和机制上」 | covered | D-015、RISK-009 |
| R-007 | 审查不靠 timeout 关闭，由健康检查自动关闭 | covered | C4 / D-006 |
| R-008 | 去掉哈希失效链、绿灯一次就够 | covered | C5 / D-010 |
| R-009 | 执行面四条（慢测试 / 去重 / 超时保留 / 预检） | covered | C9 / D-003、D-004 |
| R-010 | 批次执行序 ⑨→④→⑤→⑥ | covered | D-016、§3.5 |
| R-011 | 四张卡的结果与 consumer、合并依赖 | covered | §3.5 |
| R-012 | C9 执行面四条 | covered | C9 / §3.5 |
| R-013 | C4 审查解绑与健康终止 | covered | C4 / D-006 |
| R-014 | C5 删哈希失效链只留写口一次核对 | covered | C5 / D-010 |
| R-015 | C6 status/close 只报根因 | covered | C6 / D-012 |
| R-016 | E-1 ~ E-20 已裁定排除项 | covered | §3.5 非目标 |
| R-017 | oracle 口径 = 不劣化于基线 | covered | OI-15 / §3.5 |
| R-018 | 裁定 G / I / J 已定 | covered | §3.7 |
| R-019 | 任务Ⅰ 移交的两条 HANDOFF | covered | D-017 / §3.5 |
| R-020 | 本会话 Talk 各轮真实答复为需求权威 | covered | §5 / §10.2 |
