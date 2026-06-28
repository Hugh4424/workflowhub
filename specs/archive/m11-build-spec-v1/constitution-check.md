# 宪法符合性检查清单 — M11 build-spec v1

> 任务：m11-build-spec-v1
> 检查对象：M11 任务的 spec（`specs/m11-build-spec-v1/spec.md`）+ 实现（`workflows/build-spec/SKILL.md` v1、`workflows/spec-specify/SKILL.md`、`workflows/spec-clarify/SKILL.md`、`reuse-registry.md`、`config/workflowhub.yaml`）
> 母本：`constitution-checklist.md`（21 条，与 CONSTITUTION.md 条目数严格相等）
> 规则：记录事实，不阻断推进。`[ ]` 附判据属有效输出，不因不达标阻断 build-spec 主流程。

---

## 框架原则（F1–F10）

- [x] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。M11 的 build-spec v1 SKILL.md 只做编排——调度 spec-specify → spec-clarify → 宪法检查 → baseline 对照 → 人审检查点 → stage-result。spec 生成的重量逻辑下沉到独立技能文件（spec-specify/SKILL.md、spec-clarify/SKILL.md），build-spec 自身保持轻薄。改动牵连面小：新增两个技能文件不影响已有 7 个 skill。

- [x] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。模块间接口：build-spec 通过 task-id 调用 spec-specify（输入 task-id + 描述文本，输出 spec.md + checklists/requirements.md），再通过 task-id/spec-path 调用 spec-clarify（输入 spec 路径，输出更新后 spec.md）。宪法检查读取 constitution-checklist.md（静态文件），baseline 对照读取 baseline-report.md（静态文件）。所有接口均为文件路径或字面量参数，不暴露各自内部实现细节。

- [x] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。M11 spec 明确要求（FR-CONSTITUTION-002）：宪法检查不达标不阻断（stage-result 仍可 success）；baseline 对照不达标不阻断（阈值人拍）。物理事实由 collector.mjs 客观采集到 task-metrics.jsonl。spec 的场景 3.5 明确"不因不达标阻断 build-spec 主流程推进"。spec 文档自身含 AC2/AC3 的"产出完整与否"校验规则（可机检），但不以达标率为阻断条件。

- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。build-spec v1 流程含一次人审检查点（§7 HUMAN_REVIEW_CHECKPOINT），要求人在宪法检查/baseline 对照/F10 gate 完成后确认，不自动推进。宪法符合性检查本身是"记录采集"而非阻断门。spec-specify 的质量检查清单（checklists/requirements.md）是自检工具但不阻断。未引入阻断式 CI gate 或 pre-commit hook。

- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。M11 新增的 gate：F10 反过度工程 gate（4 问，从 M6 保留），人审检查点（1 处）。未新增其他 gate。宪法检查不是 gate（只记录不阻断）。baseline 对照不是 gate（只记录不阻断）。没有预先堆砌的 CI 门、pre-commit hook 或 pipeline stage。

- [x] **F6 统一外置执行记录** — 判据：进度/指标/回溯是否统一记录、可回溯。M11 所有阶段通过 collector.mjs 的 recordSkeleton + updateOwnResult 统一写入指标（task-metrics.jsonl）。每段产出 stage-result JSON（`specs/{task-id}/stage-result-{stage}.json`）。spec 产物的"FR 编号溯源 D-M11-x"保证了决策可追溯。所有记录外置、文件可 grep、时间线可重建。

- [x] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作是否经人边界确认。build-spec v1 SKILL.md §7 设有人审检查点（HUMAN_REVIEW_CHECKPOINT），明确"stage must NOT auto-proceed past this point without explicit human confirmation"。spec 自身不要求 commit/merge/删分支等不可逆操作。spec-specify/spec-clarify 不执行 git 命令（去耦约束明文中禁止 git checkout/branch/fetch）。

- [x] **F8 简单优先** — 判据：是否选更简单依赖更少的方案、不写掩盖问题的兜底。方案选择：spec-specify/spec-clarify 用提示词文件（SKILL.md + 内部模板）实现，无外部服务、无数据库、无 MCP primitive、无 Docker 依赖。Feature 身份用 task-id 字面量代替 git 分支推断（更简单）。模板内置化代替 per-project `.specify/` 脚手架（零额外铺设）。缺失参数 fail-loud 而不写静默回退兜底（FR-DECOUPLE-001 要求"不做分支推断回退，不做自动探测兼容层"）。

- [x] **F9 可证伪不假绿** — 判据：检查是否在"实际为假"时真报失败、缺数据标未知。AC2 可证伪：任一条缺勾选状态或缺判据文字 → 验收失败（不是"不达标"失败，而是"未完整产出"失败）。AC3 可证伪：对照表不存在或任一行缺值即失败。spec-specify 对 task-id 缺失报 "task-id required" 并 exit 非 0（fail-loud，不做静默回退）。baseline 对照对算不出的指标明确要求"写 unknown"而非编数。附录 B 经验 #7 明确"数据不足标'未知'，不做填充"。宪法符合性检查本身要求 21 条全有状态+判据，不允许空条——这个条件可证伪。

- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。M11 的每一个新机制均在 spec 附录 C 中通过 F10 4 问（Q1 真实威胁 → Q2 已有覆盖 → Q3 可绕过 → Q4 维护成本），全部结论为"纳入"。所有机制均为提示词内嵌逻辑（SKILL.md 正文、checklist 勾选、对照表），未引入 CI pipeline、pre-commit hook、gate.sh 等额外基建。录 appendix B 经验 #3 中明确把 gate.sh stage_exit + post_review_pass 替换为 F10 反过度工程 gate 4 问——即用轻量提示词替代重量脚本基建。

## 质量原则（Q1–Q3）

- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。宪法检查结果只记录浮现（`[ ]` 附判据视为有效输出，不阻断 stage-result 成功）。baseline 对照结果只记录浮现（不达标不阻断推进）。metrics 写失败只 warn 不 throw（"metrics write failure must not undo a successful stage completion"）。FR-CONSTITUTION-002 明确"checklist 不达标而阻断 build-spec 后续推进"为禁止行为。

- [x] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。三类 gate 在场且分类正确：(1) 记录采集——宪法符合性检查逐条勾选、baseline 对照表产出、collector.mjs 写指标；(2) 人工确认——人审检查点（§7 HUMAN_REVIEW_CHECKPOINT）；(3) 入口校验——F10 反过度工程 gate（在 spec 进入人审前裁剪）。没有把记录型（宪法检查、baseline）做成阻断门。spec-specify 的 task-id 缺失检查属于入口校验但不阻断 build-spec 主流程。

- [x] **Q3 异源审查加人工把关** — 判据：质量裁决是否由独立来源独立上下文产出、无自审自判。宪法符合性检查：母本 constitution-checklist.md（独立静态文件）vs spec+实现（被审对象），来源不同。人审检查点：审查者是人（独立于 AI 执行者），上下文独立。spec 附录 B 经验 #4 明确把 speckit 的 design-review pipeline（自审自判）替换为一次人工确认。collection（metrics 写、宪法 check 填）与 judgment（人审确认）由不同角色在不同时间点完成。

## 技能原则（S1–S8）

- [x] **S1 能用外部就不造轮子** — 判据：通用能力是否优先复用外部、文件直放项目内。spec-specify 和 spec-clarify 改造自 speckit-specify/speckit-clarify（外部成熟方案），而非从零自研。reuse-registry.md 已登记两行（类别：外部改造适配），来源路径指向原始 speckit SKILL.md。TDD 件（capture.mjs）复用自 tdd-red-green skill。3rd-review 保持外部依赖。未新建与已有外部工具功能重复的自研件。

- [x] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。speckit-specify → spec-specify 的具体改造：(1) 去 git 分支耦合改用 task-id 参数；(2) 模板从 workflowhub 内部加载（不读 `.specify/`）；(3) 接 M4 metrics 系统（recordSkeleton + updateOwnResult）；(4) 保留核心质量机制但适配 workflowhub 契约。speckit-clarify → spec-clarify 同理。改造后两个技能均满足 workflowhub 宪法（窄契约、薄核心、不依赖外部基建、fail-loud）。

- [x] **S3 迭代时保持最新并就地检查** — 判据：迭代时是否查更新/更优、来源路径写进技能文件。spec-specify SKILL.md 头部注明"本文件改造自 speckit-specify"。spec-clarify SKILL.md 头部注明"改造自 speckit-clarify"。reuse-registry.md 记录两技能的来源路径（`~/.claude/skills/speckit-specify/SKILL.md`、`~/.claude/skills/speckit-clarify/SKILL.md`），可追溯更新。技能文件内明确标注去耦约束，就地可检查合宪性。

- [x] **S4 自定义技能必须有指标系统** — 判据：自研技能是否配套指标、纳入统一执行记录。build-spec、spec-specify、spec-clarify 均在 SKILL.md 中写明了 metrics 接入指令——recordSkeleton（阶段开始）+ updateOwnResult（阶段结束），使用 M4 十个核心字段。spec-specify 的步骤 3 和步骤 10 分别定义了指标记录点。build-spec 的 §1 和 §Produce stage-result 定义了指标记录点。所有技能通过统一的 collector.mjs 写入 task-metrics.jsonl，纳入统一执行记录。

- [x] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能是否便于子代理调用、减少主上下文占用。所有技能均为独立 SKILL.md 文件，每个技能含完整执行流程和约束，可被 Orchestrator 作为独立子代理任务分发。spec-specify 仅需 task-id + 描述文本两个参数，spec-clarify 仅需 task-id 或 spec-path 一个参数。技能间通过产物文件（spec.md、stage-result JSON）单向传递，子代理不需要主上下文中的会话历史。

- [x] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能是否参考成熟方案优化。spec-specify/spec-clarify 参考 speckit 框架（开源成熟方案），保留了其核心质量机制：关键概念提取 + 假设记录 + NEEDS CLARIFICATION 上限 + FR 可测试 + 10 维歧义分类法 + 交互澄清纪律（一次一题/推荐/上限 5 题）+ 增量更新。spec 模板章节参考了 workflowhub archive 已有 spec 格式（m7/m9）和 speckit 11 章模板结构进行融合。附录 B 完整记录了保留/替换/延期的经验教训及其理由。

- [x] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。目录结构符合约定：`workflows/build-spec/SKILL.md`（升级，已有文件夹）、`workflows/spec-specify/SKILL.md`（新增文件夹）、`workflows/spec-clarify/SKILL.md`（新增文件夹）。每个技能独立文件夹，每个阶段对应一个技能文件。新增 spec-specify/spec-clarify 文件夹不影响已有 `workflows/make-decision/`、`workflows/build-plan/` 等 7 个技能。核心（config/workflowhub.yaml）零改动。新增技能通过目录约定自然融入调度体系。

- [x] **S8 自定义技能可独立调用可搬运** — 判据：自研技能是否可独立调用、可跨宿主搬运、不绑死环境。spec-specify 仅依赖：(1) 自身 SKILL.md 文件，(2) 同目录下 `templates/spec-template.md`，(3) 仓库根 `metrics/collector.mjs`（可选——写失败只 warn）。不依赖 git 仓库状态、分支名、`.specify/` 脚手架、环境变量、外部服务或平台特定 API。spec-clarify 同理。技能文件夹整体搬运到另一 workflowhub 实例即可工作（需对应 adjust 路径引用）。不绑死 Multica 或特定 Agent 运行时。

---

**汇总**：21 条全部已核，`[x]` 21 条，`[ ]` 0 条。
**条目数**：21（框架 10 + 质量 3 + 技能 8），与 `CONSTITUTION.md` 条目数严格相等。
