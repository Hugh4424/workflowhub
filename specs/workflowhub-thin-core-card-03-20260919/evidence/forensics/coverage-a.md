# 过程与产物类问题 → card-03 设计档案覆盖判定（只读分析，未改动 W）

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 18:44（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §17/§18 落地前的「设计档案是否已覆盖该问题」覆盖判定（A 组：过程与产物类）

被检查档案（只读）：`W = /Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`
- `W/specs/workflowhub-thin-core-card-03-20260919/decision-log.md`（749 行）
- `W/specs/workflowhub-thin-core-card-03-20260919/design.md`（3418 行）
- `W/skills/spec-plan/templates/phase-template.md`（217 行）
参考：`/Users/Hugh/Hugh/Project/workflowhub/specs/archive/workflowhub-thin-core-card-04-20260919/decision-log.md`（指针继承源）

素材：`/tmp/pb-forensics/{time-and-process.md,scope-creep.md,repo-damage.md,bloat-and-guard.md}` — **四份全部存在，全部读毕**（271 行合计）。

## 覆盖判定表

| 编号 | 问题一句话 | 判定 | card-03 侧证据锚点（可核验） | 若不完整：最小补充文本 + 插入位置 | 需用户拍板 |
| --- | --- | --- | --- | --- | --- |
| P1 零提交 | 78 h 工作 0 次 `git commit`，HEAD `3012a32` 早于会话 | **部分覆盖** | `skills/spec-plan/templates/phase-template.md:7`「它能独立提交吗？写完这个 Phase 就能 commit 并停手」；`design.md:2263` I-3「one independently acceptable and **independently committable** functional result」；`decision-log.md:66`/`:741` T-022=A「产出方自己提交／开 PR」；`decision-log.md:684` 本地提交 `94000a65` 未推送 | 只覆盖了「Phase 可独立提交」的切分判据，**没有一条要求真的落提交**。建议在 `workflows/build-code/SKILL.md` 方法章节（I-6/I-9 同批）加：「每个 Phase 收尾落一个提交；Phase 未提交时不得继续下一个 Phase；不得把整段工作长期留在未提交工作区。」 | 是 |
| P2 整树回滚 | `git restore --staged --worktree :/` 一次清零 194 文件 / 1474 改动（09-28T23:11:55Z） | **部分覆盖** | `decision-log.md:111` R-014 逐字「②**不可逆 Git 授权（宪法级）**」；`design.md:2175` SD-17/OI-012「只有**两道人为门**（推进中的人为确认对话、不可逆 Git 授权）」；`design.md:878`「不删、不改、不动它们。历史已经证明删除不可持续」 | 只有「不可逆 Git 授权须人为门」的原则，**没有点名禁止整树丢弃工作区**。建议加到 `skills/spec-plan/templates/phase-template.md` 的 `### 风险与回滚`（`:100-107`）末行：「回滚粒度＝单个文件或单个 Phase；禁止用 `git restore/reset/checkout -- :/` 整树丢弃工作区；确需丢弃前先留下被丢弃路径清单并取得人的授权。」 | 是 |
| P3 双版本冲突 | 同一 HEAD 下 main 与 W2 对同 3 文件是两份不同版本 | **部分覆盖** | `design.md:3106` §14.13.3「**同一文件不得同时由主会话与子代理写入**」；`design.md:3112` §14.13.4「写面碰撞登记」；`decision-log.md:57` T-013 写面冲突「按**时间错开**消解」；`decision-log.md:648` build-plan 先行的写面重叠风险如实登记；`decision-log.md:409-433` §七 CARD-04 在研写面撞车实测 | 现有手段是「时间错开 + 登记事实」，**没有「同一 HEAD 下不得留两份未合并版本」的规则**。建议在 `design.md:3112` §14.13.4 段末追加：「同一 HEAD 下同一路径只允许存在一份未合并版本；写前先确认基线已合并，发现第二份版本时登记为事实并停止写入该路径。」 | 否（落点已在授权写面内） |
| P4 白等与轮询 | `wait_agent` 537 次 / 77.8% 超时；`sleep` 91 + `wait` 38 + `list_agents` 305＝666 次 / 4.07 h | **已覆盖** | `design.md:76` R1 轮询式等待（card-02 实测 278 次＝27.0% token / 15,638 s＝42% 墙钟）；`design.md:79` 落点＝`AGENTS.md` 条②（插在 `:15` 与 `:16` 之间）；条②逐字「派发子代理后不轮询等待，也不为查看进度而空转等待调用：子代理的回传本身就是事件」；`design.md:341` §1.E.1 R1 加强「等待的三种烧法在 E 里各自有独立账」；`decision-log.md:61` T-019=B | — | 否 |
| P5 无人确认的自动续跑 | 真人消息仅 43 条；最长空档 50.05 h（28 轮）/ 15.32 h（31 轮） | **已覆盖** | `design.md:280` R13 自治续跑无人类边界（落点 `docs/standard-workflow.md:97` 后）；逐字「阶段的推进确认只由真实用户回复产生：没有回复时停在当前 stage，记录 `awaiting_user` 的真实事实，不自行进入下一 stage、不代签确认、不把等待写成完成」；`design.md:2429` I-12（落 `AGENTS.md` 新 `### 卡住与升级（本任务后续执行）` 段，已落地）；`decision-log.md:681` §十六 第 3 条「**无人确认的连续自动推进**」事实登记 | 子点「无人类通知渠道」不在本卡（见③） | 否 |
| P6 串行读-想-改循环 | 模型生成占墙钟 78.1%；`apply_patch` 1738 次，7 文件占 67%（单文件最多 163 次）；44.5% 输出带失败标记 | **部分覆盖** | `design.md:221` R9 phase 重入＝全量重做；`design.md:236` R10 并行派不出去（`Promise.all` 仅 14.6%；882 条 exec 中 793 条只包 1 条命令）；`design.md:2296` I-6 一次只推进一个 Phase（turn@37989 同回合 11 个相位目标；重叠最大 `P13\|P8`=21,766 s）；`design.md:2320` I-7 缺口集中退回（61 条缺口里现场自拍板 33＝54%）；`design.md:96` R2 跨 phase 全量快照绑定 | 覆盖了并行与重入，**没覆盖「同一文件反复改写」与「失败输出不处置」**。建议在 `workflows/build-code/SKILL.md` 的 `## Work loop` 第 1 条之后加：「同一文件为同一目的连续改写而事实未推进时，停下并报告；同一命令连续两次带失败标记时不得原样重跑，先记录失败原因。」 | 否 |
| P7 重复读取与上下文膨胀 | 同材料重复读 216/116/99 次；`compacted` 112 次；112.5 MB 工具输出回灌 | **已覆盖** | `design.md:126` R3 重复读/重跑（落 `docs/standard-workflow.md:92` 后；逐字「同一 task 内，同一文件为同一目的只读一次，同一命令为同一 oracle 只跑一次」）；`design.md:142` R4 压缩被动撞墙（card-05 触发 49 次）；`design.md:395` R15「压缩压的是对话，不是材料」；`design.md:187` R7 巨量输出无闸门 | — | 否 |
| P8 空证据目录 | `evidence/` 8 子目录 **0 文件**，却被材料引用 41 次 | **部分覆盖** | `design.md:2512` I-15 交接前可执行性核查逐字「直接打开源文件确认入口、真实消费者、权限、测试工具、**样例原件**与外部依赖是否已经具备…核不到的东西写成 `unknown` 与它的负责人」；`design.md:2846` §14.11.1 c（关键来源/消费者/外部前置条件没在交接前核实；build-code 侧判定 **无**）；`skills/spec-plan/templates/phase-template.md:205`「尚未执行时写 `unavailable`」 | I-15 只覆盖 build-plan 交接时的**产物**核查，不覆盖「材料里引用的路径悬空」。建议把 I-15 的 `docs/standard-workflow.md` 段落追加一句：「材料里出现的每个 `路径`／`evidence_path` 在落盘时必须实测存在或显式写 `unknown`；引用比原件多的空目录视为悬空引用，必须删引用或补原件。」 | 否 |
| P9 外围产物膨胀 | `.planning` 24 文件/1934 行；曾写 65 份 evidence md；外部 `tasks/.../quality` 3565 文件/91 MB | **已覆盖** | `design.md:2361` I-9 逐字「证据只留原件与指针：一次原始测试输出、一次正式回执、一份 review 原件各留一份…**不得把整棵工作树、整个目录或整个 `specs/` 树复制成证据**」（实测靶子：外置任务目录 7,469 文件 / 163,362,314 B，`quality/` 占 98.7%；同名同大小重复 3,849 文件 / 97,258,563 B＝61.1%）；`design.md:2858` §14.11.1 g「证据无限膨胀（三份整树快照 5,576 文件 / 143 MB）」；`design.md:163` R5 逐字「Worktree 根目录的 `progress.md`、`task_plan.md`、`findings.md`、`HANDOFF-*.md`、**`.planning/` 不是当前任务材料**」 | — | 否 |
| P10 材料三副本 | `decision-log.md`/`spec.md`/`P1–P6` 各 3 份；lean 重基线后 current 比 legacy **更大**（+4274 B / +3688 B） | **部分覆盖** | `decision-log.md:674` card-04 继承项「`BP-R01`…`BP-R12`、`C-01`…`C-22`、`OPEN-006`…**不在本档复制**；继承源＝…」（指针式继承的既有先例）；`decision-log.md:327` OI-006 counterexample 逐字「出现第二份规则正文（**副本漂移**）」；`design.md:1564` 自我否决 #8（否决「让 phase 文件'自足'到完全不用读 spec」的整段复制）；`design.md:1543`「它本身是『第三份进度说明』」 | 有「防副本漂移」的原则与指针继承先例，**没有「材料重建时旧副本必须下沉为指针」的规则**。建议在 `docs/standard-workflow.md:92` 之后（与 R3/R4/R15 同插入位）加：「材料重建时只保留一份正文；被取代的正文下沉为纯指针（路径 + 一句状态），不与 current 并存，也不得让 current 因并入历史而变大。」 | 否 |
| P11 未入库的测试 | `tests/test_t14_intraday_contrast.py` 有 `.pyc` 却仍 untracked | **未覆盖** | 仅间接：`skills/spec-plan/templates/phase-template.md:7`「独立提交」；全档 `grep` `git add`／`入库`／`未跟踪纪律`＝**0 命中**（`design.md:2799`/`:3171` 的 `git stash` 是「责任分清」用法，不是入库纪律） | 与 P1 同一根因，建议合并成一条：在 P1 的补句后加半句「被运行过的新文件（含测试）必须已入库，或在本 stage 行登记为「未入库事实」。」 | 是（并入 P1 一并拍板） |
| P12 测试净削减 | diff 删 3 个 `def test_`；`test_v2_live_execution_worker.py` 删 146 行、`v2_execution_worker.py` 删 134 行 | **未覆盖** | 最近的三处都不是这条：`design.md:1074` §5.5.1「改动前就已经红的两条：**既有红，非本卡引入**」（只要求登记既有红）；`design.md:1093` §5.5.3「保留的不确定项，**不得写成'保证不红'**」；`AGENTS.md:21-22` 只跑受影响针对性测试、禁止全量回归；`design.md:2361` I-9 测试段只讲证据留存 | 建议在 `docs/standard-workflow.md` 的 `### review、测试和成本` 段末（I-9 同段）加：「删除任何既有测试用例必须在当前 stage 行登记为事实，并说明替代覆盖或写明覆盖缺口；未登记的净削减视为声明不实。」 | 否 |

## ① 「未覆盖」项按严重度排序（7 条）

1. **P2 整树回滚**（最严重：1474 次改动一次性不可逆清零，且当时无人授权记录）— 插入点：`skills/spec-plan/templates/phase-template.md` 的 `### 风险与回滚`（`:100-107`）末行。
2. **P1 零提交 + P11 未入库测试**（78 h 工作从未入库，测试跑过却不 add）— 插入点：`workflows/build-code/SKILL.md` 方法章节，与 I-6/I-9 同批落。
3. **P12 测试净削减**（删 3 个 `def test_`、146 行测试无登记）— 插入点：`docs/standard-workflow.md` 的 `### review、测试和成本` 段末（I-9 同段）。
4. **P6 尾差：同文件反复改写 + 失败输出不处置**（单文件 163 次改写；44.5% 输出带失败标记仍继续）— 插入点：`workflows/build-code/SKILL.md` 的 `## Work loop` 第 1 条之后。
5. **P8 悬空引用 / 空证据目录**（`evidence/` 8 目录 0 文件却被引用 41 次）— 插入点：I-15 的 `docs/standard-workflow.md` build-plan 段落，追加一句覆盖所有材料引用。
6. **P10 材料三副本**（重基线后 current 反而比 legacy 大）— 插入点：`docs/standard-workflow.md:92` 之后，与 R3/R4/R15 同插入位。
7. **P3 双版本冲突**（同一 HEAD 下两份未合并版本）— 插入点：`design.md:3112` §14.13.4 段末追加一句。

（仅 7 条达到「未覆盖/需补」的门槛；P5 的人类通知渠道见③，不计入本表。）

## ② 不建议补充的项及理由（避免过度登记）

1. **P4 白等与轮询**：R1 已给逐字条文与落点（`design.md:76`/`:79`），再添一笔只会在同一处形成第二份正文——这正是 `decision-log.md:327` 自己写下的 counterexample「出现第二份规则正文（副本漂移）」。
2. **P7 重复读取与上下文膨胀**：R3/R4/R15 三条已分别覆盖「重复读」「被动压缩」「压缩不压材料」，逐字草案均已落盘，无缺口。
3. **P5 的「无人类通知渠道」**：card-03 只写纪律文本；建通道属于新增 runtime 能力，命中 `design.md:2175` SD-17/OI-012「一切机器/流程门禁删除」与 `:2182` §0「**不新增 public runtime 命令**」，应另开卡，不应塞进本卡。
4. **P9 的 `.planning` 24 文件/1934 行**：`design.md:163` R5 已逐字把它排除出「当前任务材料」，再为单一目录立条款属过度登记。
5. **P9 的「外部 quality 3565 文件 / 91 MB」**：I-9（`design.md:2361`）已用更大的同一断面靶子（7,469 文件 / 163,362,314 B）覆盖，不必按本案例再写一遍数字。
6. **P2 的「被丢弃清单」做成新载体**：`design.md:2182` §0 明确不新增账本/projection；P2 只宜写成一句纪律，不宜立新文件或新字段。

## ③ 无法判定项（缺什么证据）

1. **P3 是否真被「时间错开」消解**：缺 card-04 侧合并后的实测结论。`decision-log.md:660` 只给了 `git log --oneline 97092b30..main` 为空（main ⊆ `97092b30`），**没有给出那 3 个冲突文件在合并后的最终 sha/内容**，无法判定两份版本是否已归一。
2. **P10 的字节对账在 card-03 侧无对应证据**：card-03 档案没有 `legacy/` 目录，`grep legacy` 仅命中 `design.md:2782` 的无关行（测试文件名字面替换），因此「current 比 legacy 大 +4274 B / +3688 B」只能靠 PaperBuilder 案例本身，不能在 card-03 材料里复核。
3. **P4 的三个具体工具名是否被 R1 字面覆盖**：R1 条②写的是语义（「不轮询等待，也不为查看进度而空转等待调用」），**未点名** `sleep`／`wait`／`list_agents`。语义上应覆盖，但字面是否被验收者接受需设计者/用户确认措辞强度。
