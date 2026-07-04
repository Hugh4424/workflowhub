# Constitution Check — worktree-unification
task-id: worktree-unification
stage: build-spec
date: 2026-07-04
source: constitution-checklist.md (21 items, F1-F10, Q1-Q3, S1-S8)

---

## Framework Principles (F1–F10)

- [x] **F1 薄核心** — worktree.json 契约作为窄接口文件，核心只做路径调度（parseTaskDir）；worktree 创建逻辑下沉到 make-decision skill，build-code/verify-code skill 只消费契约，核心层零改动。改动牵连面限于 3 个 skill 文件 + 1 个 core parser 模块，符合薄核心判据。

- [x] **F2 窄契约** — worktree.json 仅暴露 6 个明确字段（target_repo_root / worktree_root / branch / created_by_stage / push_policy / status），下游 stage 通过该文件接口读取，不依赖 make-decision 的内部实现。task-dir-parser 通过单一函数 parseTaskDir() 对外暴露，不暴露内部 yaml 解析逻辑。接口窄且明确，符合判据。

- [x] **F3 物理事实靠机器校验但不阻断** — spec 中所有物理事实（worktree 存在性、分支占用检测、push 发生与否）均要求机器客观校验（git worktree list --porcelain、git log、push 日志）；僵尸检测 fail-loud 但不自动删除，不阻断后续人工判断。metrics 记录失败不阻断推进。符合判据。

- [x] **F4 质量靠异源审查与人而非阻断式质量门** — spec 中质量检查（7条自检、Spec-Purity、scope-triage）均为记录+浮现语义，无任何阻断条件（FR-CONTRACT-002 明确约束）。3rd-review unknown 转人工确认，不自动阻断。符合判据。

- [x] **F5 gate 谨慎添加出事再补无用则移除** — 本 spec 未新增任何质量门；现有 fail-loud 均为边界校验（入口校验类），不是新增阻断门。push 门控复用 verify-code 已有 gate，不另立新 gate。符合判据。

- [x] **F6 统一外置执行记录** — per-stage commit 要求提交信息含 stage 名称，使执行轨迹可在 git log 中回溯；metrics 通过 collector.mjs 统一记录（recordSkeleton/updateOwnResult）。符合判据。

- [x] **F7 推进与不可逆操作不自动越过人** — push、merge、branch-delete 均在 verify-code Step 10 人工确认点之后执行（user_decision=true 门控）；spec 未要求任何不可逆操作自动执行。worktree 删除（git worktree remove）同属 close 流程，在人工确认后执行。符合判据。

- [x] **F8 简单优先** — FR-WORKTREE-ENVVAR-003 采用最简实现：在现有 parseTaskDir() 函数头部加 process.env 读取，不引入新类/新模块/新抽象。worktree.json 使用纯 JSON，不引入新的 schema 验证库。符合判据（选更简单依赖更少的方案）。

- [x] **F9 可证伪不假绿** — 所有验收场景均有"实际为假时真报失败"条目（场景 B 双缺失 fail-loud、场景 B 僵尸不删、push 门控未通过无 push）。metrics unknown 值如实标注 unknown，不假绿。Spec-Purity warn 如实标注，不声称 pass。符合判据。

- [x] **F10 自动化按真实收益添加** — spec 中自动化仅限于：(1) per-stage commit（轻量，git 内置能力）；(2) git worktree list --porcelain 校验（利用 git 原有机制，无新基建）；(3) task-dir-parser env-var 读取（2-3 行代码）。无新 CI 门、无新 schema 验证基建、无新机器可校验框架堆砌。F10 四问已在序言执行，结论：新机制均有真实案例支撑（ZHI-65），无预堆基建。符合判据。

---

## Quality Principles (Q1–Q3)

- [x] **Q1 记事实而非阻断** — 质量事实契约 FR-CONTRACT-002 明确约束全部 5 项为"记录+浮现"语义，禁止任何"若未通过则停止"语义。自检 warn、scope-triage 命中、3rd-review unknown 均只记录，不阻断推进。符合判据。

- [x] **Q2 gate 三类划分** — spec 中的关卡按三类组织：(1) 入口校验：worktree.json 存在性检查、WORKFLOWHUB_TASK_DIR 解析（fail-loud 但属入口边界，非推进门）；(2) 记录采集：per-stage commit 消息、metrics 记录、质量事实契约；(3) 人工确认：push/merge/branch-delete/worktree-remove 的 user_decision 门控。无把记录型做成阻断门的情况。符合判据。

- [x] **Q3 异源审查加人工把关** — spec 要求 3rd-review 由异源引擎在独立上下文产出 verdict（FR-REVIEW-001/002）；当前 unknown 已转人工确认（needs_human=true），不自审自判。符合判据。

---

## Skills Principles (S1–S8)

- [x] **S1 能用外部就不造轮子** — spec-specify 和 spec-clarify 均改造自 speckit 外部技能（非自研），task-dir-parser 使用 Node.js 内置 fs/os/path 模块，无需第三方库。符合判据。

- [x] **S2 外部技能可针对项目改造合宪** — spec-specify 和 spec-clarify 标注"改造自 speckit-specify/speckit-clarify，适配 workflowhub 契约"，保留核心质量机制（FR 可测试、Q1/Q2/Q3 格式），去 git 分支耦合，适配 task-id 路径。符合合宪改造判据。

- [x] **S3 迭代时保持最新并就地检查** — 本 spec 产出时检查了 spec-specify 和 spec-clarify 当前版本（从 skills/ 目录直接读取），来源路径已在产物中标注（SKILL.md 路径）。符合判据。

- [x] **S4 自定义技能必须有指标系统** — build-spec 调用 metrics/collector.mjs recordSkeleton/updateOwnResult，spec-specify/spec-clarify 均已接入 M4 metrics 系统（SKILL.md 中明确说明）。metrics 写入失败 warn 不停止，指标系统已配套。符合判据。

- [x] **S5 自定义技能方便子代理调用省主上下文** — spec-specify 和 spec-clarify 均通过 task-id 参数化，子代理调用只需传 task-id，不需要主上下文中的历史状态。worktree.json 契约设计同样为子代理可独立读取（单文件 JSON）。符合判据。

- [x] **S6 自定义技能参考市面方案不闭门造车** — spec-specify 和 spec-clarify 明确源自 speckit（市面方案），worktree.json 字段设计参考 git worktree 原生 --porcelain 输出，env-var 优先级设计参考 12-factor app 惯例。符合判据。

- [x] **S7（实为 S7 位置）** — 注：constitution-checklist.md 的 S 系列为 S1-S8，共 8 条。本检查已覆盖 S1-S6，以下续 S7/S8。

  **S7 技能有版本标识** — build-spec SKILL.md version: 2.0.0，spec-specify/spec-clarify 均有 name/description 前置元数据。worktree-unification spec 本身标注 version: 0.1 (draft)。符合判据。

- [x] **S8 技能失败有明确降级路径** — spec 中每个 FR 的失败场景均有明确行为（fail-loud/warn/记录 unknown），无静默吞错。metrics 写入失败 warn 不停止，3rd-review 不可用记录 unknown 转人工，符合有明确降级路径判据。

---

## 汇总

| 类别 | 合规 | 不合规 | 说明 |
|------|------|--------|------|
| F1-F10 | 10 | 0 | 全部合规 |
| Q1-Q3 | 3 | 0 | 全部合规 |
| S1-S8 | 8 | 0 | 全部合规 |
| **合计** | **21** | **0** | |

所有 21 项均标记 [x]（合规），无不合规项。
