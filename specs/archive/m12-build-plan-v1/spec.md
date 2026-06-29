---
task_id: m12-build-plan-v1
milestone: M12
stage: build-spec
source_decision_log: tasks/m12-build-plan-v1/decision-log.md
status: draft
---

# 功能规格：build-plan v1（升级 workflows/build-plan/SKILL.md）

> 基于 decision-log.md（m12-build-plan-v1，8 条决策 D-M12-1 至 D-M12-8）。本文件不可覆盖项目级规则。

**功能名**: `m12-build-plan-v1`
**来源**: decision-log.md M12 build-plan v1（speckit-plan/tasks/analyze 三件改造迁移 + 跨产物一致性检查 + 宪法符合性检查 + baseline 对照度量 + 人审检查点 + reuse-registry 登记）
**状态**: 草稿

---

## 修订记录

- **2026-06-29（ZHI-5 决策）**：技能命名改为镜像 speckit 来源（spec-plan / spec-tasks / spec-analyze），遵循 M11 spec-specify 先例；技能位置改为 `skills/` 目录（`workflows/` 仅保留五段核心技能）。本次修订覆盖原 FR-MIG-001/FR-MIG-002 及假设 1/3/4、未决 1/3/4 的相反决策。

---

## 速读卡（30 秒看懂这个需求）

- **一句话需求**：把 build-plan SKILL.md 从 M6 薄骨架升级到 v1——迁移改编 speckit-plan/tasks/analyze 三件技能（零 per-project clone、内置脚手架）、加 spec/plan/tasks 跨产物一致性检查、加宪法符合性检查（21 条逐条勾）、加 M10 baseline 5 项指标对照、加一次人审检查点、加 reuse-registry 登记。
- **核心改动点**：
  - 在 `workflows/build-plan/SKILL.md` 中集成 spec-plan + spec-tasks + spec-analyze 三技能的调用流程（改造自 speckit-plan/tasks/analyze，适配 workflowhub 契约）
  - 三件技能的去耦：feature 身份改用显式参数（task-id），模板从 workflowhub 内部加载，不依赖 per-project `.specify/`
  - 跨产物一致性检查：analyze 件扫描 spec/plan/tasks 三产物，产出只读分析报告（不一致记录不阻断）
  - 宪法符合性检查：跑 `constitution-checklist.md` 21 条逐条勾选，结果写入产物，非 blocking
  - 基线对照度量：产出 M12 自举 task vs M10 baseline 5 项指标对照（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count），阈值人拍、不达标不阻断、产不出对照即失败
  - reuse-registry.md 登记 spec-plan / spec-tasks / spec-analyze 三行（类别=外部改造适配 + 来源路径）
  - build-plan v1 流程含一次人审检查点
- **最大影响面**：`workflows/build-plan/SKILL.md`（升级） + 新增 `skills/spec-plan/`、`skills/spec-tasks/`、`skills/spec-analyze/` 三个技能目录（含 SKILL.md 与模板） + `reuse-registry.md`（追加三行）+ `constitution-checklist.md` 用法变更（被 build-plan v1 流程读取并产出勾选结果）
- **验收信号**：build-plan v1 跑完产出 plan.md + tasks.md → 产物含 constitution-checklist 21 条勾选结果 → spec-analyze 分析报告已产出 → 5 项 M10 baseline 对照已产出 → reuse-registry 可见三新行 → 含一次人审记录。

---

## 1. 问题陈述

当前：workflowhub 的 build-plan stage（M6 五段薄骨架之一）只有通用"读 spec → 列文件 → 写 plan.md/tasks.md → F10 gate → stage-result"提示词骨架。功能太薄，缺少 speckit-plan/tasks 编排能力、缺少 speckit-analyze 跨产物一致性检查、缺少宪法符合性检查、缺少自举对照度量、缺少 reuse-registry 登记。

问题：M11（build-spec v1）已完成，五段流水线的第三段 build-plan 仍然是 M6 薄骨架（`workflows/build-plan/SKILL.md`，v1.0.0，3.5KB），无法承接 speckit-plan/tasks/analyze 的改造迁移，也无法产出 M12 自举 task 的对照度量。需要把 build-plan 升级到 v1，引入三件技能 + 跨产物检查 + 宪法检查 + 基线对照，吃自己狗粮（第二个自举 task）。

---

## 2. 背景、目标和边界

### 背景

workflowhub 五段骨架已在 M6 建成。M11 已完成 build-spec v1 升级（引入 spec-specify/spec-clarify），明确将 speckit-plan/tasks/analyze 的路由留给 M12（D-M11-7 路由表）。这三个技能的 per-project clone 摩擦（setup-plan.sh 从分支推断 FEATURE_DIR、模板在 `.specify/` 下）已在 M11 确认并计划在 M12 解决。M10 基线已建立 5 项对照指标，M11 已验证可套。workflowhub 宪法（CONSTITUTION.md 21 条）需要每个里程碑做符合性检查。

### 目标

- build-plan v1 能从上游 spec 产出完整的 plan.md + tasks.md，过程集成 spec-plan（生成实施计划）+ spec-tasks（生成任务分解）+ spec-analyze（跨产物一致性分析）
- spec-plan/spec-tasks/spec-analyze 三技能改名生效，不与本地 speckit-* 冲突
- 零 per-project clone：三技能不要求目标项目 clone/初始化 `.specify/`；模板/脚手架内置 workflowhub 技能包内
- feature 身份改用显式参数（task-id），不依赖 git 分支推断
- 加跨产物一致性检查步骤：analyze 件产出 spec/plan/tasks 三产物只读分析报告
- 加宪法符合性检查步骤：产出 constitution-checklist.md 21 条勾选结果
- 产出自举 task vs M10 baseline 5 项指标对照
- 在 reuse-registry.md 登记 spec-plan / spec-tasks / spec-analyze
- 含一次人审检查点
- 保留 M6 骨架已有的 F10 反过度工程 gate + stage-result 契约 + metrics collector 契约（不回归）

### 非目标（明确不做）

> 逐条继承自 decision-log.md 第 5 节「明确不做」。build-plan / build-code 阶段不得逾越。

1. **不做 blocking 质量门**——宪法符合性检查 + analyze 输出结果即可，不因不达标卡推进（承接 D5/D7/F4/F10）。
2. **不在目标项目 clone / 初始化 `.specify/`**——脚手架内置技能包，全局直用（承接 D-M11-5）。
3. **不迁移 speckit-constitution**——冗余，既有 constitution-checklist.md 覆盖（承接 D-M11-6）。
4. **不改 build-code / verify-code 行为**——只走流程引用（D-M12-8）。
5. **不碰 design 阶段其他技能**——M11 D-M11-7 已路由完。
6. **不强制 historical-lessons-used 引用**——按需记、不校验（承接 D22/D5/D7）。

### 假设

> spec-specify 生成 spec 时做的每一条推断都记在这里。每条假设注明来源和理由。

- **假设 1**：三件技能的最终名称已定为 spec-plan、spec-tasks、spec-analyze——镜像 speckit 来源命名（speckit-plan→spec-plan, speckit-tasks→spec-tasks, speckit-analyze→spec-analyze），遵循 M11 spec-specify 先例（speckit-specify→spec-specify）。来源：decision-log §6 提议名 + ZHI-5 用户决策（2026-06-29）。理由：揭示 provenance、与 M11 spec-specify 命名先例一致；spec-plan vs speckit-plan 前缀不同不冲突。名称与路径绑死——见假设 4 固定路径。
- **假设 2**：feature 身份显式化采用 task-id 参数推导产物路径的方式（`specs/{task-id}/` 作为统一产物根），与 M11 spec-specify/spec-clarify 保持同一契约。来源：decision-log §6 开放问题 2（"task-id 推断？"）+ M11 FR-DECOUPLE 先例。理由：同一项目内保持一致性，降低学习成本。
- **假设 3**：plan-template.md / tasks-template.md 模板存放在各自技能目录下的 `templates/` 子目录（如 `skills/spec-plan/templates/plan-template.md`），与 M11 spec-specify 的 `./templates/spec-template.md` 布局一致。来源：decision-log §6 开放问题 3（模板存放位置）。理由：与 M11 先例对齐，内部自包含、运维简单。
- **假设 4**：三件技能为 workflowhub 内 aux skill，各自为 `skills/` 下的独立技能目录——`skills/spec-plan/`、`skills/spec-tasks/`、`skills/spec-analyze/`，每个目录含 `SKILL.md`，spec-plan 和 spec-tasks 额外含 `templates/` 子目录（`templates/plan-template.md`、`templates/tasks-template.md`）。`workflows/` 仅保留五段核心技能（build-plan/build-code/verify-code 等），aux 生成技能归入 `skills/`。来源：decision-log §6 开放问题 4（注册方式）+ ZHI-5 用户决策（2026-06-29）。理由：分离核心流程技能与辅助生成技能，降低 `workflows/` 目录复杂度。
- **假设 5**：speckit-plan/tasks/analyze 的去分支/脚手架内置逻辑可在不丢核心能力前提下重写——plan 模板生成、依赖排序 tasks 生成、跨产物一致性扫描。来源：decision-log §4 假设 [ASSUMPTION] 第一条。理由：M11 已验证同类重构可行（spec-specify/spec-clarify），三件技能的核心能力为纯文本处理，不依赖外部状态。
- **假设 6**：M10 baseline-report.md 5 项指标口径可直接套用到 M12 自举 task 度量。来源：decision-log §4 假设 [ASSUMPTION] 第二条 + M11 已验证。理由：同口径对照才有意义，M11 已验证可行。
- **假设 7**：spec-analyze 的执行形态为"纯文本分析 + 人工逐项确认"——即 analyze 件自动扫描 spec/plan/tasks 并产出一份问题清单，人审逐条确认清单项的严重性和处置方式。来源：decision-log §6 开放问题 5（analyze 执行形态）。理由：当前阶段不引入自动修复能力（YAGNI），只记录不一致供人判断。

---

## 3. 用户场景与用例

> 角色「编排者」= 在 workflowhub 里驱动一条任务流程的人或主 AI；「子代理」= 被派去执行某段 skill 的助手。

### 场景 3.1：编排者走完整 build-plan v1 流程（正常路径）

- **角色**：编排者有一条已完成 build-spec 的 task，需要把 spec 转为 plan.md + tasks.md。
- **前置条件**：`specs/{task-id}/spec.md` 存在且含完整章节（用户场景 / FR / 验收标准）。
- **操作步骤**：调起 build-plan v1，内部按顺序执行：读 spec → 调 spec-plan 生成 plan.md → 调 spec-tasks 生成 tasks.md → 调 spec-analyze 做三产物一致性扫描 → 执行宪法符合性检查（21 条逐条勾选）→ 执行 M10 baseline 5 项指标对照 → 在人审检查点停顿等确认 → 产 stage-result。
- **预期结果**：`specs/{task-id}/plan.md` + `specs/{task-id}/tasks.md` 存在；spec-analyze 分析报告已产出；宪法符合性检查勾选结果可见（21 条逐条勾）；M10 baseline 对照已产出；stage-result 含 facts 字段（plan_ref + tasks，v1 追加 tasks_ref）。

### 场景 3.2：spec-plan 用显式 task-id 定位输入和产物（正常路径）

- **角色**：build-plan v1 调用 spec-plan 生成 plan.md。
- **前置条件**：task-id = `m12-build-plan-v1` 已传入，`specs/m12-build-plan-v1/spec.md` 存在。
- **操作步骤**：spec-plan 接收 task-id 参数，推导 spec 路径（`specs/{task-id}/spec.md`）并读取，按内置模板生成 plan，写入 `specs/{task-id}/plan.md`。
- **预期结果**：plan.md 写入正确路径，不触发 git 操作。task-id 缺失时 spec-plan 报明确错误（不静默回退到分支推断）。

### 场景 3.3：spec-tasks 按依赖排序产出 tasks.md（正常路径）

- **角色**：build-plan v1 调用 spec-tasks 生成 tasks.md。
- **前置条件**：spec.md + plan.md 已存在。
- **操作步骤**：spec-tasks 读取 spec 和 plan，按 FR 依赖关系排序生成任务列表，写入 `specs/{task-id}/tasks.md`。
- **预期结果**：tasks.md 存在，任务列表含依赖关系标注。spec 或 plan 不存在时报明确错误。

### 场景 3.4：spec-analyze 产出一致性分析报告（正常路径）

- **角色**：build-plan v1 调用 spec-analyze 做三产物一致性检查。
- **前置条件**：spec.md、plan.md、tasks.md 均存在。
- **操作步骤**：analyze 件扫描三文件，识别跨文件不一致（如 FR 在 spec 中存在但在 tasks 中无对应任务项）、重复定义、歧义表述、欠定义项（如 plan 中引用了 spec 未定义的 FR），产出分析报告。
- **预期结果**：分析报告存在且含具体发现项（不一致/重复/歧义/欠定义）。三产物缺任一时报错。报告仅记录不阻断推进。

### 场景 3.5：宪法符合性检查产出勾选结果（正常路径）

- **角色**：build-plan v1 在执行宪法符合性检查步骤。
- **前置条件**：constitution-checklist.md 文件存在。
- **操作步骤**：逐条对照 constitution-checklist.md 的 21 条（F1-F10 / Q1-Q3 / S1-S8），对每一条勾选 `[x]` 符合或 `[ ]` 不符合并附判据，勾选结果写入 plan 产物或独立文件。
- **预期结果**：21 条全部在场（不得缺条）；每条必须携带勾选状态（`[x]` 或 `[ ]`）和判据文字。任一条缺状态或缺判据即视为"未产出完整勾选结果"= 验收失败。`[ ]` 附判据的条目属有效输出，不因不达标阻断。

### 场景 3.6：基线对照度量产出（正常路径）

- **角色**：build-plan v1 执行 M10 baseline 5 项指标对照。
- **前置条件**：M10 baseline-report.md 存在且含 5 项基线值，M12 自举 task 已走过 make-decision + build-spec 两段。
- **操作步骤**：采集 M12 自举 task 各段指标，与 M10 baseline 值（missed_step_rate=0.05 / test_execution_rate=0.8295 / review_execution_rate=1 / rework_rounds=6.075 / rework_proxy_count=25.25）逐项对照，输出对照表。阈值由人设，不达标不阻断。
- **预期结果**：对照表含 5 行（每行：指标名 + M12 实值 + M10 baseline 值 + 方向 delta），表非空。对照表不存在或任一行缺值即失败。

### 场景 3.7：人审检查点停顿并留痕（正常路径）

- **角色**：build-plan v1 流程到达人审检查点后获人工确认。
- **前置条件**：plan.md + tasks.md 已生成、analyze 报告已产出、宪法检查已执行、基线对照已完成。
- **操作步骤**：SKILL.md 提示词在此处写明停顿文字，要求执行者在继续前等待人工确认。人工确认（批准或拒绝）后，执行者将 `review` 信息写入 stage-result，继续完成 stage-result 产出 + metrics 写入。
- **预期结果**：检查点可被观察到（SKILL.md 中可 grep 到明确的停顿标记）；stage-result JSON 含 `review` 对象，`review.state` 为 `"approved"` 或 `"rejected"`（非 `"pending"`），`review.decision` 含批准/拒绝描述。若无人确认直接推进（`review.state="pending"`），stage-result 仍产出但标注 pending，不因缺确认而缺失 stage-result。

### 场景 3.8：reuse-registry 登记（正常路径）

- **角色**：build-plan v1 完成后，reuse-registry.md 被更新。
- **前置条件**：reuse-registry.md 存在。
- **操作步骤**：在 reuse-registry.md 表中新增三行——spec-plan、spec-tasks、spec-analyze，每行含复用类别（"外部改造适配"）+ 来源路径（指向原始 speckit-plan/tasks/analyze SKILL.md）。
- **预期结果**：三行均可在 reuse-registry.md 中 grep 到，每行含合法类别枚举值和非空来源路径。缺任一行即失败。

### 场景 3.9：模板从 workflowhub 内部加载（正常路径）

- **角色**：spec-plan / spec-tasks 需要加载各自模板。
- **前置条件**：技能目录下的 `templates/` 子目录含对应模板文件。
- **操作步骤**：从 workflowhub 技能包内部路径（如 `skills/spec-plan/templates/plan-template.md`）读模板，不访问目标项目 `.specify/`。
- **预期结果**：模板加载成功，产物按模板结构生成。模板路径不存在时报明确错误（不做 `.specify/` 回退）。

### 场景 3.10：无 task-id 参数（失败场景）

- **角色**：编排者调 spec-plan / spec-tasks / spec-analyze 但未传入 task-id。
- **前置条件**：task-id 参数缺失。
- **操作步骤**：技能检测到 task-id 缺失。
- **预期结果**：报明确错误信息，exit 非 0，不创建任何产物，不做分支推断回退。

### 场景 3.11：spec 不存在（失败场景）

- **角色**：build-plan v1 或子技能尝试读取 spec 但文件不存在。
- **前置条件**：`specs/{task-id}/spec.md` 不存在。
- **操作步骤**：读取 spec 时检测到文件缺失。
- **预期结果**：报明确错误，exit 非 0，不生成 plan/tasks。

### 场景 3.12：宪法符合性检查缺条或缺判据（失败场景）

- **角色**：build-plan v1 执行宪法符合性检查但勾选不完整。
- **前置条件**：constitution-checklist.md 含 21 条。
- **操作步骤**：检查勾选结果是否为 21 条全部在场、每条有状态且有判据。
- **预期结果**：任一条缺失、任一条无勾选状态、或任一条无判据文字 → 判"未产出完整勾选结果"失败（不因不达标失败，因产出不完整失败）。

### 场景 3.13：M6 骨架能力不回归（边界场景）

- **角色**：build-plan v1 SKILL.md 内容。
- **前置条件**：v1 SKILL.md 已编写。
- **操作步骤**：验证 F10 gate 仍在 SKILL.md 中（4 问可 grep）、stage-result 契约字段不变（plan_ref + tasks）、metrics collector 调用不变（recordSkeleton + updateOwnResult）。
- **预期结果**：三者均在场，M6 既有能力不被 v1 升级覆盖或删除。

### 场景 3.14：build-code/verify-code 行为未改（边界场景）

- **角色**：M12 改动范围的约束验证。
- **前置条件**：M12 改动已实施。
- **操作步骤**：检查改动文件列表，确认不包含 `workflows/build-code/SKILL.md` 或 `workflows/verify-code/SKILL.md` 的修改。
- **预期结果**：build-code/verify-code 的 SKILL.md 和关联逻辑文件无任何 diff。

### 场景 3.15：plan 缺关键章节或 task 无依赖排序（失败场景）

- **角色**：build-plan v1 产出 plan.md / tasks.md 后内检。
- **前置条件**：spec-plan 和 spec-tasks 已执行。
- **操作步骤**：检查 plan.md 是否含必要章节（实现步骤 / 文件清单 / 验收映射），tasks.md 是否含依赖排序。
- **预期结果**：缺必要章节或任务无依赖排序 → build-plan 报错、不产 stage-result success。

---

## 4. 功能需求

> 溯源规则：每条 FR 标注来源 decision-log 决策编号（D-M12-x），可追溯回决策记录。FR 编号格式 FR-{域缩写}-NNN。

### build-plan v1 核心流程（FR-BP）

- **FR-BP-001**：build-plan v1 的 SKILL.md 必须编排以下步骤的完整串行流程——读上游 spec → 调 spec-plan 生成 plan.md → 调 spec-tasks 生成 tasks.md → 调 spec-analyze 做三产物一致性检查 → 执行宪法符合性检查（21 条逐条勾）→ 执行 M10 baseline 5 项指标对照 → 人审检查点停顿 → 产 stage-result + metrics。来源：D-M12-1、D-M12-4、D-M12-5、D-M12-6、D-M12-7。
  - **场景**：Given spec 已由上游 build-spec 产出且 task-id 明确，When 运行 build-plan v1，Then plan.md + tasks.md + 宪法勾选结果 + analyze 报告 + baseline 对照全部产出，缺任一项即失败。
  - **场景**：Given 流程任一步骤失败且不可恢复（如 spec 不存在），When build-plan v1 运行，Then 报错并阶段失败，不产 success stage-result。

- **FR-BP-002**：build-plan v1 的 plan.md 产物必须含——（a）实现步骤（逐步骤描述要做什么）、（b）文件清单（需创建或修改的文件列表）、（c）验收映射（每步骤对应哪些 FR/AC）。tasks.md 产物必须含——（a）任务列表按依赖排序、（b）每条任务标注对应 FR、（c）任务间依赖关系。任一项缺失即判失败。来源：D-M12-1、D-M12-4。
  - **场景**：Given spec-plan 和 spec-tasks 执行完毕，When 检查 plan.md，Then 含实现步骤 + 文件清单 + 验收映射三节。
  - **场景**：Given spec-tasks 执行完毕，When 检查 tasks.md，Then 任务列表含依赖关系标注，每条任务有对应 FR。

- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
  - **场景**：Given build-plan v1 产出的 stage-result JSON，When 校验，Then 含 plan_ref + tasks（M6 既有字段在场）+ v1 追加的 tasks_ref，且 status/error_code/retryable/missing_items/user_decision/reason 结构不变。

### speckit-plan/tasks/analyze 迁移（FR-MIG）

- **FR-MIG-001**：三件 speckit 技能必须改造迁移进 workflowhub `skills/` 目录，命名必须镜像 speckit 来源——spec-plan（来源=speckit-plan）、spec-tasks（来源=speckit-tasks）、spec-analyze（来源=speckit-analyze），遵循 M11 spec-specify 先例（speckit-specify→spec-specify）。此命名揭示 provenance，且 spec-plan vs speckit-plan 前缀不同、不冲突。来源：D-M12-4、ZHI-5 用户决策（2026-06-29）。
  - **命名检查要求**：技能标识符必须为 spec-plan / spec-tasks / spec-analyze。结构化检查以下三处——（a）`skills/` 下新增目录 basename、（b）技能定义文件（SKILL.md）的 skill name 字段或等效标识、（c）其他技能 SKILL.md 中的 callable 技能名引用。**明确豁免**：（i）`reuse-registry.md` 中的来源路径引用（允许出现 `speckit-plan SKILL.md` 等文字，以保留溯源信息）；（ii）迁移说明、provenance 脚注、决策记录、注释中的历史名称引用；（iii）配置文件中的第三方路径声明。
  - **场景**：Given 三技能已迁移，When 结构化检查以下三处（不全文 grep）——（a）`skills/` 下目录 basename、（b）各 SKILL.md 中的 skill name 字段、（c）callable 技能名引用字段——Then 技能标识符为 spec-plan / spec-tasks / spec-analyze。**排除区域**（以下文本不纳入检查）：provenance 脚注、注释行（`#` / `>` 开头）、`reuse-registry.md` 全文、迁移笔记文件。
  - **场景**：Given `reuse-registry.md` 含 "来源=speckit-plan SKILL.md"，When 执行命名冲突检查，Then 该行不触发冲突——来源路径引用属于豁免范围。
  - **场景**：Given workflowhub 内存在 spec-plan 等技能定义文件，When 与 speckit-* 同名检查，Then 无冲突（spec-plan 与 speckit-plan 前缀不同）。

- **FR-MIG-002**：迁移后的三技能各自必须为独立可调起的技能，路径已固定：`skills/spec-plan/`（含 `SKILL.md` + `templates/plan-template.md`）、`skills/spec-tasks/`（含 `SKILL.md` + `templates/tasks-template.md`）、`skills/spec-analyze/`（含 `SKILL.md`，无需模板）。每个技能含输入参数契约（task-id 或等价显式身份），不依赖其他 speckit-* 技能或目标项目脚手架。来源：D-M12-4、D-M11-5。
  - **场景**：Given `skills/spec-plan/` 目录存在，When 检查，Then 含 SKILL.md + `templates/plan-template.md` + 参数契约描述。
  - **场景**：Given spec-tasks 被调起但目标项目无 `.specify/` 目录，When 执行，Then 正常产出 tasks.md，不报"missing .specify/"类错误。

- **FR-MIG-003**：spec-tasks 生成的 task 列表必须支持阶段分组，通过 `--stage N` 参数标注（注意：是 **标注** 而非过滤——将任务按依赖关系分组到有序阶段中，与 Multica `--stage` 语义一致）。来源：D-M12-4（保留 speckit-tasks 核心能力）。
  - `--stage N` **参数契约**：
    - **接受值**：N 为正整数（N ≥ 1），阶段按升序依次执行。
    - **省略行为**：若调用方不传 `--stage N`，所有任务归入单一隐式阶段，tasks.md 仍须按依赖排序但不输出阶段块标题。
    - **语义**：标注/分组，非过滤。N 为 **目标阶段数的上限**——即 `--stage N` 表示"将任务划分为**最多 N 个有序阶段**，但不得为凑齐 N 块而制造虚假阶段或割裂真实依赖链"。当任务的实际依赖深度不足 N 层时，tasks.md 只产出实际可分的阶段数（如依赖链仅 2 层但传入 N=4，产出仅 2 个 `## Stage` 块），不强制块数 = N。
  - **tasks.md 阶段块语法**：
    - 每个阶段以 `## Stage N` 二级标题起块（N 为阶段序号），块内列出该阶段的任务项及依赖标注。
    - 阶段间顺序由 N 升序决定——Stage 1 完成后才能启动 Stage 2，同阶段内任务可并行。
    - 任务项必须标注所属阶段序号（如 `- [ ] 任务描述 (stage:1, depends:无)`），使跨阶段依赖可追溯。
  - **验证规则**：验收时检查——（a）阶段序号连续（从 1 开始不跳跃），（b）任务依赖关系有效（被依赖的阶段排在前），（c）实际阶段块数 ≤ N。不要求块数等于 N（依赖深度不足时少于 N 属正常）。
  - **场景**：Given spec 含多 FR 且有明确依赖链，When spec-tasks 以 `--stage 3` 生成 tasks.md，Then 任务按最多 3 阶段分组，阶段间有顺序依赖标注，阶段序号连续。
  - **场景**：Given 依赖图自然只有 2 层深度，When spec-tasks 以 `--stage 4` 生成 tasks.md，Then tasks.md 产出 2 个 `## Stage` 块（不机械填充 4 块），验收不因块数 ≠ 4 而失败。
  - **场景**：Given spec-tasks 未传入 `--stage`，When 生成 tasks.md，Then 任务列表仍含依赖排序，但不出现 `## Stage N` 阶段块标题。

### 去耦：feature 身份显式化（FR-DECOUPLE）

- **FR-DECOUPLE-001**：spec-plan / spec-tasks / spec-analyze 不得从 git 分支推断 feature 身份。feature 身份必须通过显式 task-id 参数传入，参数缺失时 fail-loud（明确错误信息，非零退出，不做分支推断回退，不做自动探测兼容层）。来源：D-M12-4 假设验证 1、D-M11-5。
  - **场景**：Given task-id = "m12-build-plan-v1" 传入 spec-plan，When 执行，Then 产物落 `specs/m12-build-plan-v1/plan.md`，不执行 git 命令。
  - **场景**：Given 无 task-id 传入 spec-plan，When 启动，Then 报 "task-id required" 错误，exit 非 0。

- **FR-DECOUPLE-002**：spec-plan 和 spec-tasks 所需的模板（plan-template.md / tasks-template.md）必须从 workflowhub 技能内部路径加载（如 `skills/spec-plan/templates/plan-template.md`），不读目标项目的 `.specify/templates/`。模板路径不存在时 fail-loud，不做 `.specify/` 回退。来源：D-M12-4 假设验证 2。
  - **场景**：Given workflowhub 内部模板路径存在，When spec-plan 加载模板，Then 成功加载并生成 plan。
  - **场景**：Given 内部模板路径不存在，When spec-plan 尝试加载，Then 报 "template not found at <internal-path>" 错误，exit 非 0。

- **FR-DECOUPLE-003**：spec-analyze 定位 spec/plan/tasks 三产物时必须通过显式路径（task-id 推导），不通过 `.specify/specs/<branch>` 或 git 分支推断。来源：D-M12-4 假设验证 3。
  - **场景**：Given task-id = "m12-build-plan-v1"，When analyze 定位三产物，Then 读 `specs/m12-build-plan-v1/spec.md`、`plan.md`、`tasks.md`，不执行任何 git 命令。
  - **场景**：Given 传入 task-id 但 spec.md 不存在，When analyze 定位，Then 报 "spec not found at <path>" 错误。

### 跨产物一致性检查（FR-XARTIFACT）

- **FR-XARTIFACT-001**：spec-analyze 必须在 build-plan v1 流程中执行一次 spec/plan/tasks 三产物跨文件一致性扫描，产出只读分析报告——识别以下四类问题：（a）不一致（spec 中的 FR 在 plan/tasks 中被不同地描述或引用）、（b）重复（同一 FR 在 tasks 中多次出现）、（c）歧义（plan 描述与 tasks 实现步骤冲突）、（d）欠定义（plan 引用了 spec 中不存在的 FR、tasks 漏掉了 spec 中的 FR）。来源：D-M12-5。
  - **每条发现的具体性要求**：报告中除全局摘要行外，每条非摘要发现必须包含以下字段，缺任一字段的发现视为无效——该报告判为"未达标"（验收失败）：
    - **type**：问题类型枚举（`inconsistency` / `duplicate` / `ambiguity` / `underdefined`）。
    - **source_artifact**：问题所在的源产物文件名（如 `spec.md`、`plan.md`、`tasks.md`）。
    - **target_artifact**：受牵连的目标产物文件名（如不一致发现中 `spec.md` 的 FR 在 `tasks.md` 中描述不同，则 source=`spec.md`，target=`tasks.md`）；无目标产物时写 `"N/A"`。
    - **fr_or_task_id**：涉及的 FR 编号或 task 行号标识（如 `FR-BP-001`、`task-3`）；无法定位到具体 FR/task 时写 `"unknown"`。
    - **line_or_anchor**：行号或稳定锚点（如 `spec.md:L244`、`plan.md 第三节"文件清单"` 或 `tasks.md 第 5 项`）；无法定位时必须标注原因如 `"unable to locate: 全文件扫描发现"`。
  - **场景**：Given spec 含 5 条 FR，tasks 只覆盖 4 条，When analyze 执行，Then 报告含至少一条发现满足：`type=underdefined`、`source_artifact=spec.md`、`target_artifact=tasks.md`、`fr_or_task_id` 为遗漏的 FR 编号、`line_or_anchor` 含 spec 中该 FR 的行号或章节。
  - **场景**：Given spec/plan/tasks 完全一致，When analyze 执行，Then 报告产出摘要行（如"无一致性问题"），视为达标（无具体发现时不要求发现字段）。

- **FR-XARTIFACT-002**：spec-analyze 的分析报告仅记录、不阻断——不一致/重复/歧义/欠定义发现后写入报告，不阻止 build-plan v1 后续推进。来源：D-M12-5（承接 F4 异源审查不卡死）。
  - **场景**：Given analyze 报告含 10 条不一致发现，When build-plan v1 完成，Then stage-result status=success（若无其他阻塞），报告浮现供人审查。

### 宪法符合性检查（FR-CONSTITUTION）

- **FR-CONSTITUTION-001**：build-plan v1 流程必须含一步宪法符合性检查——对照 `constitution-checklist.md` 的 21 条（F1-F10 / Q1-Q3 / S1-S8），逐条勾选 `[x]`（符合）或 `[ ]`（不符合）并附判据，产出含 21 条完整勾选结果的文档。来源：D-M12-6。
  - **场景**：Given build-plan v1 执行完毕，When 检查产物，Then 含 21 条勾选结果（缺任一条即失败），每条有状态（`[x]` 或 `[ ]`）+ 判据文字。
  - **场景**：Given 21 条全部有状态有判据（含 `[ ]` 附判据的条目），When 验收，Then 视为"已产出完整勾选结果"。

- **FR-CONSTITUTION-002**：宪法符合性检查输出仅记录不阻断——勾选结果浮现到 plan 产物中供人审查，不因 checklist 不达标而阻断 build-plan 后续推进（stage-result 仍可 status=success）。来源：D-M12-6（承接 D5/D7/F4/Q1）。
  - **场景**：Given checklist 有 5 条不达标（`[ ]`），When build-plan v1 完成，Then stage-result 正常产出，不达标仅记录。

- **FR-CONSTITUTION-003**：宪法符合性检查的"未产出完整勾选结果"判据为——21 条中（a）任一条缺失，（b）任一条无勾选状态（既非 `[x]` 也非 `[ ]`），（c）任一条无判据文字——任一项满足即验收失败。来源：D-M12-6。
  - **场景**：Given checklist 产物含 15 条 `[x]` + 判据 + 6 条 `[ ]` + 判据，When 验收，Then 视为完整输出（全部有状态有判据），验收通过。
  - **场景**：Given checklist 产物缺第 5 条（F5），或第 8 条（F8）有勾选无判据，When 验收，Then 判"未产出完整勾选结果"失败。

### 基线对照度量（FR-BASELINE）

- **FR-BASELINE-001**：build-plan v1 流程必须产出 M12 自举 task vs M10 baseline 的 5 项指标对照——指标名为 missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count，M10 baseline 值为 0.05 / 0.8295 / 1 / 6.075 / 25.25（来自 `specs/archive/m10-baseline-switch/baseline-report.md`），对照表含指标名 + M12 实值 + M10 baseline 值 + 方向 delta。来源：D-M12-3。
  - **M12 实值数据源与可得性**（每项指标须引用证据，不可写无来源的手工数）。**关键约束**：基线对照步骤在 build-plan 流程中排在 stage-result + metrics 写入之前（见 FR-BP-001 串行顺序），故 build-plan 自身的 metrics record 在对照执行时尚未写入。对照仅可使用**已完成且已落盘的 upstream 阶段**（make-decision → build-spec 两段的 stage-result + metrics 记录）：
    - **missed_step_rate**：来源 = metrics/collector.mjs 记录中 upstream 阶段的 missed_step 计数 / 总 step 计数。build-plan 对照时仅 make-decision + build-spec 两段记录已落盘可供读取，build-plan 自身记录尚未写入、不可引用。**此时全 5 段值不可得——必填 `unknown`，原因="仅 upstream make-decision/build-spec 两段已完成且已落盘，全五段值待 verify-code 完成后才可计算"**。
    - **test_execution_rate**：来源 = metrics/collector.mjs 记录中的 test 执行计数。仅 build-code/verify-code 阶段产出测试执行数据，**build-plan 时不可得——必填 `unknown`，原因="build-plan 阶段无测试执行数据，待 build-code/verify-code"**。
    - **review_execution_rate**：来源 = metrics/collector.mjs 记录中的 review 执行计数。3rd-review 在 build-code 之后执行，**build-plan 时不可得——必填 `unknown`，原因="review 阶段尚未执行"**。
    - **rework_rounds**：来源 = metrics/collector.mjs 记录中阶段内返工轮次。仅全流程完成后可计，**build-plan 时不可得——必填 `unknown`，原因="全流程未完成，无返工数据"**。
    - **rework_proxy_count**：来源 = metrics/collector.mjs 记录中代理返工计数。仅全流程完成后可计，**build-plan 时不可得——必填 `unknown`，原因="全流程未完成，无代理返工数据"**。
  - **"unknown" 使用规则**（遵循 F9 "缺数据如实标未知，不得制造虚假通过"）：不可得的指标必须写 `unknown` 而非任意占位值（如 0、"-"、"--"）。每条 `unknown` 必须附带原因说明文字（不可仅有 `unknown` 而无原因）。原因文字必须精确说明为何不可得（引用上述可得性规则）。对照表中的 delta 列对 `unknown` 行同样写 `unknown`（不可编造方向）。
  - **场景**：Given build-plan v1 执行对照步骤，When 对照产出落盘，Then 表含 5 行，每行 4 列（指标名 / M12 值 / M10 基线值 / delta）。M12 值列——全部 5 项均为 `unknown` + 原因（因此时仅 upstream 两段已落盘，build-plan 自身及后续阶段数据不可得）。任一行缺值或 `unknown` 行无原因文字即失败。
  - **场景**：Given 对照表中出现非 `unknown` 的 M12 值但无对应的 upstream stage metrics 记录引用，When 验收，Then 判"无证据的占位值"失败。

- **FR-BASELINE-002**：基线对照的阈值由人设定——build-plan v1 不在 SKILL.md 或代码内硬编码达标/不达标判定逻辑。不达标不阻断推进。来源：D-M12-3。
  - **场景**：Given 对照表中某指标 M12 值远差于 M10 baseline，When build-plan v1 完成，Then 不因指标差距阻断，对照表浮现供人判断。

- **FR-BASELINE-003**：第 5 项指标命名必须使用 `rework_proxy_count`（M10 baseline-report.md 落盘字段真名），不得使用别名或旧称。来源：D-M12-3。
  - **场景**：Given 对照表表头或叙述中出现非 `rework_proxy_count` 的别名，When 验收，Then 判命名不合规，失败。

### reuse-registry 登记（FR-REGISTRY）

- **FR-REGISTRY-001**：spec-plan / spec-tasks / spec-analyze 三技能必须各在 `reuse-registry.md` 中登记一行——skill 名分别为 spec-plan / spec-tasks / spec-analyze，复用类别均为"外部改造适配"，来源路径分别指向原始 speckit-plan / speckit-tasks / speckit-analyze SKILL.md 的路径。来源：D-M12-7、D15/D16。
  - **场景**：Given build-plan v1 完成后，When grep reuse-registry.md，Then 存在三行各自含类别 + 来源路径，类别 = "外部改造适配"，来源非空。

- **FR-REGISTRY-002**：reuse-registry.md 中三新行的登记必须通过格式校验——类别为合法枚举值（"外部改造适配" / "自研" / "外部依赖" / "改造适配" / "其他平台原生"之一），来源路径为实际存在的文件路径或合法的外部引用字符串。来源：D-M12-7 + D15 + D16。
  - **场景**：Given 任一行类别不是合法枚举值，When 校验，Then 判格式不合法，验收失败。
  - **场景**：Given 任一行来源路径为空字符串，When 校验，Then 判格式不合法，验收失败。

### 人审检查点（FR-REVIEW）

- **FR-REVIEW-001**：build-plan v1 的 SKILL.md 必须含一且仅一次人审检查点——在 plan.md + tasks.md 生成、analyze 报告产出、宪法检查完成、基线对照完成之后、产出 stage-result 之前，SKILL.md 提示词明文要求执行者停顿等人确认。来源：D-M12-7。
  - **人审证据持久化**：人审确认/拒绝必须有可审计的持久记录——stage-result JSON 必须包含 `review` 对象，字段如下：
    - `review.state`：字符串，只能为 `"pending"`（检查点已到达但尚未获得确认）、`"approved"`（确认通过）、`"rejected"`（确认拒绝）之一。
    - `review.reviewer`：字符串，执行确认的人或Agent标识（pending 时可为空字符串）。
    - `review.timestamp`：RFC3339 时间戳，确认发生的时刻（pending 时可为空字符串）。
    - `review.decision`：人可读的确认决定描述，**所有三态均必须非空**。approved 时写批准理由（如 "plan/tasks 产物通过、宪法检查无不符项、baseline 对照阈值符合预期"）；rejected 时写拒绝原因；pending 时写固定字符串 `"检查点已触达但未获确认"`。
    - `review.notes`：自由文本，附注（可为空字符串）。
  - **各态行为与转换条件**：
    - **approved**：人给出确认批准后，`review.state="approved"`，stage-result 正常产出，`status` 按流程结果决定（可为 success）。
    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
  - **场景**：Given build-plan v1 SKILL.md，When grep 人审相关停顿文字，Then 存在一处人审检查点（不多于一处，不少于一处）。
  - **场景**：Given 人审检查点获批准，When build-plan v1 产 stage-result，Then `review.state="approved"`，`review.reviewer` 和 `review.timestamp` 非空，`review.decision` 含批准描述。
  - **场景**：Given 人审检查点被拒绝，When build-plan v1 产 stage-result，Then `review.state="rejected"`，`status="failure"`，`reason` 含拒绝原因。
  - **场景**：Given 人审检查点无响应，When build-plan v1 产 stage-result，Then `review.state="pending"`，stage-result 不因 pending 省略——`pending` 本身是有效状态。

### 骨架保留（FR-SKELETON）

- **FR-SKELETON-001**：M6 build-plan SKILL.md 中已有的 F10 反过度工程 gate（4 问：真实威胁？已有覆盖？可绕过？长期维护成本？）必须在 v1 SKILL.md 中保留并适用于 v1 所有新增机制。来源：D-M12-1。
  - **场景**：Given build-plan v1 SKILL.md，When grep "What real threat does this defend against"，Then 有匹配（F10 gate 4 问完整在场）。

- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
  - **场景**：Given build-plan v1 产出的 stage-result JSON，When 校验，Then 含 plan_ref + tasks（M6 既有），且 status/error_code/retryable/missing_items/user_decision/reason 结构不变。
  - **场景**：Given build-plan v1 SKILL.md，When 检查，Then grep 到 recordSkeleton + updateOwnResult 调用指令在场。

### 范围边界（FR-SCOPE）

- **FR-SCOPE-001**：M12 build-plan v1 的改动不得触碰 `workflows/build-code/SKILL.md` 和 `workflows/verify-code/SKILL.md` 的逻辑内容。来源：D-M12-8。
  - **场景**：Given M12 改动实施完毕，When git diff 检查，Then `workflows/build-code/SKILL.md` 和 `workflows/verify-code/SKILL.md` 无任何修改。

- **FR-SCOPE-002**：M12 build-plan v1 的改动不得触碰 design 阶段其他技能（已在 M11 D-M11-7 路由的技能）。来源：D-M12-8。
  - **受保护路径列表**（M12 不得改动其逻辑或内容）：
    - `skills/spec-specify/SKILL.md` 及 `skills/spec-specify/templates/` 下所有文件
    - `skills/spec-clarify/SKILL.md` 及 `skills/spec-clarify/templates/` 下所有文件
    - `workflows/build-spec/SKILL.md`（design 阶段主控）
    - `workflows/make-decision/SKILL.md`（design 阶段入口）
    - 3rd-review 技能（外部技能，M12 不得在其路径下新增/修改文件，不得在 workflowhub 内创建本地替代品）
  - **允许与禁止的边界**：
    - **允许（仅限引用）**：build-plan v1 的 SKILL.md 可在流程描述中提及上述技能的名称、路径或职责（如"上游 build-spec 产出 spec.md"），但不得修改其内容、逻辑或调用契约。
    - **允许（仅限引用）**：`reuse-registry.md` 可在已有行中保留上述技能的登记信息，M12 追加的三行不覆盖或删除已有行。
    - **禁止**：修改受保护文件的任何一行（含 SKILL.md 正文、模板、配置）；在受保护路径下新增文件；以 wrapper/proxy/alias 方式间接修改受保护技能的行为。
  - **场景**：Given M12 改动实施完毕，When git diff 检查受保护路径，Then `skills/spec-specify/`、`skills/spec-clarify/`、`workflows/build-spec/`、`workflows/make-decision/` 无任何 diff（不含仅引用提及的文件如 build-plan SKILL.md 自身的文字）。
  - **场景**：Given M12 改动实施完毕，When 检查，Then 不与 M11 D-M11-7 路由表冲突——不在 M12 范围内改动 design 其他技能。

---

## 5. 模块划分

> 功能涉及多技能/多模块交互，B 档条件触发，填写本章。

### build-plan SKILL.md（升级）

- **负责什么**：build-plan v1 流程主控——编排 spec-plan → spec-tasks → spec-analyze → 宪法符合性检查 → baseline 对照 → 人审检查点 → 产 stage-result + metrics。
- **对外提供什么业务能力**：输入 spec.md → 输出 plan.md + tasks.md + 宪法检查结果 + analyze 报告 + baseline 对照 + stage-result JSON。
- **需要哪些上游业务能力**：spec.md（由 build-spec 的 spec-specify/spec-clarify 产出）、constitution-checklist.md（静态规则源）、M10 baseline-report.md（对照基准）。
- **验收边界**：prompt 文件存在 + 路径引用可 grep + F10 gate 在场 + stage-result 契约字段不回归。

### spec-plan 技能（新增，`skills/spec-plan/`）

- **负责什么**：接受 task-id + spec 文本，按内置模板（`templates/plan-template.md`）生成结构化 plan.md（实现步骤 + 文件清单 + 验收映射）。
- **对外提供什么业务能力**：将 spec 中的 FR 转化为可执行的实施计划。
- **需要哪些上游业务能力**：spec.md（含完整 FR 列表和验收标准），不依赖目标项目 `.specify/` 或 git 分支状态。
- **验收边界**：可独立调起测试（传入 task-id + spec → 产出 plan.md 存在性 + 章节完整性 + 无 git 操作）。

### spec-tasks 技能（新增，`skills/spec-tasks/`）

- **负责什么**：接受 task-id + spec + plan，按 FR 依赖关系生成排序后的 tasks.md（任务列表含阶段分组和依赖标注）。
- **对外提供什么业务能力**：将 plan 分解为可分配、可追踪的任务项。
- **需要哪些上游业务能力**：spec.md + plan.md（由 build-spec 和 spec-plan 产出），不依赖 git 分支或 `.specify/`。
- **验收边界**：可独立调起测试（传入已有 spec + plan → 检查 tasks.md 含依赖排序 + 每条 task 对应 FR）。

### spec-analyze 技能（新增，`skills/spec-analyze/`）

- **负责什么**：接受 task-id，加载 spec/plan/tasks 三产物，做跨文件一致性扫描，产出只读分析报告。
- **对外提供什么业务能力**：识别 spec/plan/tasks 间的不一致/重复/歧义/欠定义，降低下游实施返工风险。
- **需要哪些上游业务能力**：spec.md + plan.md + tasks.md（由 build-plan 前序步骤产出），不依赖 `.specify/` 或 git 分支。
- **验收边界**：可独立调起测试（传入已有三产物 → 报告含四类问题标注，每条发现五字段齐全）。

### constitution-checklist.md（复用，规则来源不变）

- **负责什么**：21 条宪法符合性检查的对照母本。build-plan v1 从中读取 21 条逐条勾选，但本身不被修改。
- **对外提供什么业务能力**：静态规则参照，被 build-plan v1 流程读取。
- **需要哪些上游业务能力**：无（纯静态文档，与 CONSTITUTION.md 条目数保持严格相等）。
- **验收边界**：21 条条目数与 CONSTITUTION.md 一致，文件存在。

### reuse-registry.md（更新，追加三行）

- **负责什么**：全仓 skill 复用登记表。M12 追加 spec-plan / spec-tasks / spec-analyze 三行。
- **对外提供什么业务能力**：登记迁移技能的外部来源和改造类别。
- **需要哪些上游业务能力**：无。
- **验收边界**：三行可 grep 到，类别合法，来源非空。

---

## 6. 关键实体

**build-plan v1 stage-result 产物**（沿用 M6 结构，M12 可追加不删改）：

- `status`：success | failure
- `error_code`：失败原因描述（success 时为空字符串）
- `retryable`：布尔
- `facts.plan_ref`：相对路径指向产出 plan（如 `specs/m12-build-plan-v1/plan.md`）——M6 既有，保留不变
- `facts.tasks`：分解后任务列表或计数——M6 既有，保留不变
- `facts.tasks_ref`：相对路径指向产出 tasks（如 `specs/m12-build-plan-v1/tasks.md`）——v1 追加
- `missing_items`：未完成项清单
- `user_decision`：布尔（人审检查点确认结果）
- `reason`：人可读的结论描述
- `review`：对象——人审证据持久化字段，含 `review.state`（`"pending"`|`"approved"`|`"rejected"`）、`review.reviewer`（字符串）、`review.timestamp`（RFC3339）、`review.decision`（字符串）、`review.notes`（字符串）。v1 追加。

**plan.md 产物**（build-plan v1 核心产出之一）：

- 实现步骤：逐步骤描述要做什么
- 文件清单：需创建或修改的文件列表
- 验收映射：每步骤对应哪些 FR/AC

**tasks.md 产物**（build-plan v1 核心产出之一）：

- 任务列表按依赖排序
- 每条任务对应 FR
- 任务间依赖关系
- 阶段分组：若传入 `--stage N`，以 `## Stage 1`…`## Stage N` 二级标题分块，每块内任务标所属阶段与依赖；未传入时不输出阶段块标题

**spec-analyze 分析报告**：

- 跨文件一致性扫描结果
- 四类问题标注：不一致/重复/歧义/欠定义
- 每条非摘要发现必须含 type / source_artifact / target_artifact / fr_or_task_id / line_or_anchor 五字段，缺任一字段的发现视为无效

**宪法符合性检查产物**（含于 plan 产物或作为独立文件）：

- 21 条逐条勾选（F1-F10 / Q1-Q3 / S1-S8），每条为 `[x]` 或 `[ ]` + 判据，无空条

**基线对照表**（含于 plan 产物或作为独立文件）：

- 5 行（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count），每行 4 列（指标名 / M12 实值 / M10 baseline 值 / delta）

**reuse-registry.md 新增行**：

- spec-plan：类别=外部改造适配，来源=speckit-plan SKILL.md 路径
- spec-tasks：类别=外部改造适配，来源=speckit-tasks SKILL.md 路径
- spec-analyze：类别=外部改造适配，来源=speckit-analyze SKILL.md 路径

---

## 7. 数据和生命周期

- **build-plan stage-result**：每次 build-plan 执行产出一份，落 `specs/{task-id}/stage-result-build-plan.json`。同一 task 重跑覆盖前次。
- **plan.md**：`specs/{task-id}/plan.md`，是整个 task 的实施计划真相源，由 spec-plan 写入，后续 build-code 以它为输入。
- **tasks.md**：`specs/{task-id}/tasks.md`，是 build-code 的任务输入，由 spec-tasks 写入。含依赖顺序，build-code 按其分配。
- **analyze 报告**：随 plan 产物一起落 `specs/{task-id}/`，只读不覆写。
- **宪法检查结果**：含于 plan 产物或独立文件，随 plan 产物一起落档。
- **基线对照表**：含于 plan 产物或独立文件，随 plan 产物落档。
- **reuse-registry.md**：追加三行，随代码提交长期保留。
- **metrics 记录**：recordSkeleton 在 build-plan 开始时写入，updateOwnResult 在结束时补全。写失败只 warn 不 throw。
- 本期不涉及数据库 / 迁移 / 多版本数据演进。

---

## 8. 兼容性预留

- **plan/tasks 产物章节扩展预留**：plan.md 和 tasks.md 的章节结构可追加新节（如未来需要风险分析或资源估算），已有章节不删不改。下游 build-code 按已知章消费，不识别的章跳过。
- **技能文件路径已固定**：spec-plan / spec-tasks / spec-analyze 的存放路径已在本 spec 中确定——`skills/spec-plan/`、`skills/spec-tasks/`、`skills/spec-analyze/`。约束：可被 build-plan SKILL.md 引用、内部含全量所需模板和逻辑、不依赖目标项目 `.specify/`。
- **baseline 对照指标扩展预留**：当前 5 项指标，未来 M10 baseline 可追加新指标，对照表格式支持追加列。
- **宪法符合性检查模式预留**：当前为"人工逐条勾"模式，未来可演进为"半自动辅助"，但检查的产出格式（21 条逐条勾 + 判据）不变。
- **向后兼容 M6 骨架**：v1 SKILL.md 必须含 F10 gate + stage-result 契约 + metrics 调用，M6 既有能力不可回归。

---

## 9. 不做和隐性必达

### 明确不做

> 以下逐条继承自 decision-log §5「明确不做」。design/plan/build 阶段不得逾越。

1. **不做 blocking 质量门**——宪法符合性检查 + analyze 输出结果即可，不因不达标卡推进（承接 D5/D7/F4/F10）。
2. **不在目标项目 clone / 初始化 `.specify/`**——脚手架内置技能包，全局直用（D-M11-5）。
3. **不迁移 speckit-constitution**——冗余，既有 constitution-checklist.md 覆盖（D-M11-6）。
4. **不改 build-code / verify-code 行为**——只走流程引用（D-M12-8）。
5. **不碰 design 阶段其他技能**——M11 D-M11-7 已路由完。
6. **不强制 historical-lessons-used 引用**——按需记、不校验（D22/D5/D7）。

### 隐性必达

- **技能命名**：迁移后三技能在 `skills/` 目录名、SKILL.md 的 skill name / callable 标识中使用 spec-plan / spec-tasks / spec-analyze 命名，镜像 speckit 来源（speckit-plan→spec-plan, speckit-tasks→spec-tasks, speckit-analyze→spec-analyze），遵循 M11 spec-specify 先例。reuse-registry.md 来源路径、迁移笔记、provenance 脚注中的 speckit-* 历史引用不在禁止范围。（ZHI-5 用户决策，2026-06-29）
- **零 per-project clone 可验证**：build-plan v1 后续验证须证实三技能在无 `.specify/` 的目标项目中正常调用。
- **不静默回退**：FR-DECOUPLE 三条假设任一不成立必须 fail-loud，不写隐藏兼容层（承接 Let-it-crash）。
- **不废弃 speckit 模板/脚本能力**：只废弃 per-project 铺设（D-M11-5 明确要求）。
- **M6 骨架不回归**：F10 gate / stage-result 契约 / metrics 契约均保留（FR-SKELETON-001/002）。
- **M12 不误收非本期件**：路由表（M11 D-M11-7）已明确 speckit-constitution 不迁移、3rd-review 保持外部依赖、design 其他技能已路由完成。M12 不突破此边界。
- **build-plan v1 流程对 M12 自举 task 自身可跑通**（吃自己狗粮）：M12 自举 task 通过 build-plan v1 产出自身 plan.md + tasks.md（不自举即失败）。

---

## 10. 验收清单及未决问题

> 逐条来自 decision-log §7（8 条验收标准：6 条 roadmap-hard + 2 条 derived）。每条可手动或命令验证。

### 验收检查（success_criteria）

- [ ] **AC1 — 能产出 plan + tasks**：build-plan v1 跑完产出 plan.md + tasks.md（plan 含实现步骤/文件清单/验收映射，tasks 含依赖排序和 FR 映射，产不出任一项即失败）。来源：decision-log 验收 1。← FR-BP-001, FR-BP-002
  - 验证方式：检查 `specs/{task-id}/plan.md` 和 `specs/{task-id}/tasks.md` 存在且含必要章节。
  - 反向：缺文件或缺必要章节即失败。

- [ ] **AC2 — 宪法符合性检查有输出**：产物含 constitution-checklist.md 21 条逐条勾选结果（每条至少 `[x]` 或 `[ ]` + 判据，无空条）。来源：decision-log 验收 2。← FR-CONSTITUTION-001, FR-CONSTITUTION-002
  - 验证方式：grep 勾选结果，确认 21 条全部在场、每条有状态 + 判据文字。21 条全部"有状态 + 有判据"视为完整输出。
  - 反向：缺任一条、任一条无勾选状态、或任一条无判据文字 → "未产出完整勾选结果"失败。

- [ ] **AC3 — 跨产物一致性检查有可操作的输出**：spec-analyze 产出 spec/plan/tasks 三产物一致性分析报告。报告存在且非空（可仅为摘要行"无一致性问题"）。若有非摘要发现，每条必须有 type / source_artifact / target_artifact / fr_or_task_id / line_or_anchor 五字段且均非空；缺任一字段的发现视为无效，该报告判未达标。无报告即失败。不一致只记录不阻断。来源：decision-log 验收 3。← FR-XARTIFACT-001, FR-XARTIFACT-002
  - 验证方式：检查分析报告存在；若含发现项，逐条校验五字段齐全。
  - 反向：报告不存在即失败；报告含发现项但任一发现缺五字段之一即失败。

- [ ] **AC4 — 对照度量产出**：产出 M12 自举 task vs M10 baseline 5 项指标对照表（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count，M10 baseline 值为 0.05 / 0.8295 / 1 / 6.075 / 25.25）。5 行 4 列完整在场（指标名/M12 实值/M10 baseline/delta），M12 实值列——不可得指标可为 `unknown`（须附带原因说明），不得用无证据的占位值（0、"-"等）。来源：decision-log 验收 4。← FR-BASELINE-001
  - 验证方式：检查对照表含 5 行 4 列完整；M12 实值列——已知值须引用 metrics 记录或 stage-result 证据，不可得值须为 `unknown` + 原因；delta 列对应 `unknown` 行亦为 `unknown`。
  - 反向：对照表不存在或任一行缺列即失败；可用但写 `unknown` 或不可得但写占位值即失败。阈值人拍、不达标不阻断。

- [ ] **AC5 — 复用登记**：reuse-registry.md 含 spec-plan / spec-tasks / spec-analyze 三行，各有复用类别（"外部改造适配"）+ 来源路径（非空）。来源：decision-log 验收 5。← FR-REGISTRY-001, FR-REGISTRY-002
  - 验证方式：grep reuse-registry.md 确认三行均在，类别合法，来源非空。
  - 反向：缺任一行、类别非枚举值、或来源路径为空即失败。

- [ ] **AC6 — 一次人审，有持久证据**：build-plan v1 的 SKILL.md 含一且仅一次人审检查点（明文停顿等人确认），且产出的 stage-result JSON 含 `review` 对象——`review.state` 为 `"pending"` / `"approved"` / `"rejected"` 之一，`review.decision` 非空（当 state 非 pending 时 `review.reviewer` 和 `review.timestamp` 亦非空），`review.notes` 在场。来源：decision-log 验收 6。← FR-REVIEW-001
  - 验证方式：（a）grep SKILL.md 中人审停顿标记，确认仅一处；（b）解析 stage-result JSON，确认 `review` 对象存在且字段齐全，`review.state` 为合法三态之一，`review.decision` 非空。
  - 反向：SKILL.md 无人审标记或多处标记即失败；stage-result 缺 `review` 对象或其字段不完整即失败。

- [ ] **AC7 — 去项目化生效**（派生）：build-plan 走查证明三件技能无需在目标项目 clone/初始化 `.specify/` 即可直接调用（脚手架内置技能包）。来源：decision-log 验收 7。← FR-MIG-002, FR-DECOUPLE-001, FR-DECOUPLE-002
  - 验证方式：在一个不含 `.specify/` 的目录下执行任意一件技能，验证不报"missing .specify/"类错误且正常产出。
  - 反向：要求 `.specify/` 或自动创建 `.specify/` 即失败。

- [ ] **AC8 — build-code / verify-code 行为未改**（派生）：M12 改动不触碰 build-code/verify-code 的逻辑文件（只走流程引用）。来源：decision-log 验收 8。← FR-SCOPE-001
  - 验证方式：git diff 检查 `workflows/build-code/SKILL.md` 和 `workflows/verify-code/SKILL.md` 无修改。
  - 反向：任一文件有 diff 即失败。

- [ ] **AC9 — 五段自举闭环（任务级）**：M12 自举 task 跑完 5 段（make-decision → build-spec → build-plan → build-code → verify-code），5 段 stage-result JSON 均落 `specs/m12-build-plan-v1/` 目录，5 段各有一条 metrics collector 记录。来源：D-M12-1（走完整五段顺序自举）。← FR-BP-001
  - 验证方式：检查 `specs/m12-build-plan-v1/` 下存在 5 个 stage-result-{stage}.json 文件。
  - 反向：任一段 stage-result 缺失或任一段 metrics 无记录 → 失败。注：此为任务级验收，非 build-plan 自身能力的验收。

### 未决问题和风险

> 以下问题来自 decision-log §6 开放问题——本 spec 确认它们为待设计问题，且已有工作假设（见 §2 假设段）。留 build-plan 阶段实现时验证和确认。

- **未决 1（技能最终命名）**：已定——三技能名称固定为 spec-plan / spec-tasks / spec-analyze，与假设 4 固定路径绑死。← 见假设 1。
- **未决 2（git 分支身份替代机制）**：采用 task-id 推导产物路径，与 M11 契约一致。build-plan 阶段实现时若发现 task-id 推导不覆盖某种场景需显式 feature-dir 参数，以 build-plan 决定为准。← 见假设 2。
- **未决 3（模板存储/引用位置）**：已确定——`skills/spec-plan/templates/plan-template.md` + `skills/spec-tasks/templates/tasks-template.md`，与 M11 一致。← 见假设 3。
- **未决 4（技能注册方式）**：已确定——注册为 `skills/spec-plan/`、`skills/spec-tasks/`、`skills/spec-analyze/` 三个 workflowhub 内 workflow 目录，参照 M11 spec-specify/spec-clarify。← 见假设 4。
- **未决 5（analyze 执行形态）**：纯文本分析 + 人工逐项确认，暂不引入自动修复。← 见假设 7。
- **风险**：若三件 speckit 技能的去分支重构难度超预期（假设 5），可能导致 M12 build-plan 实现延期。Mitigation：Let-it-crash 策略——任一不成立暴露报错，M12 自举失败作为经验记录，不作为 workflowhub 流程缺陷。

---

## 11. 影响范围（业务性质）

- **受影响：build-plan SKILL.md**
  - 既有行为：M6 薄骨架（v1.0.0，3.5KB），通用"读 spec → 写 plan/tasks → F10 gate → stage-result"提示词。
  - 本需求影响：升级为 v1，集成 spec-plan → spec-tasks → spec-analyze → 宪法符合性检查 → baseline 对照 → 人审 → 产 stage-result 的完整流程。
  - 回归要点：F10 gate、stage-result 契约（plan_ref / tasks）、metrics 调用（recordSkeleton / updateOwnResult）必须保留不减。

- **受影响：skills/ 目录（新增技能文件）**
  - 既有行为：无 spec-plan / spec-tasks / spec-analyze 技能。
  - 本需求影响：新增 `skills/spec-plan/`（含 `SKILL.md` + `templates/plan-template.md`）、`skills/spec-tasks/`（含 `SKILL.md` + `templates/tasks-template.md`）、`skills/spec-analyze/`（含 `SKILL.md`）三个技能目录，各为独立可调起的 skill。
  - 回归要点：新增技能不影响已有 workflowhub 技能和行为。

- **受影响：reuse-registry.md**
  - 既有行为：已有 spec-specify/spec-clarify 等多行登记。
  - 本需求影响：追加 spec-plan / spec-tasks / spec-analyze 三行（类别：外部改造适配）。
  - 回归要点：已有行不变，只追加不删除。

- **受影响：constitution-checklist.md（使用方式变更）**
  - 既有行为：静态文档，供里程碑对照。
  - 本需求影响：被 build-plan v1 流程读取并产出勾选结果；文件本身内容不被 M12 修改。
  - 回归要点：21 条条目数不变，与 CONSTITUTION.md 条目数保持严格相等。

- **可能受冲击的业务规则**：D5（记事实非 blocking）和 D7（按需记不校验）——宪法检查不达标不阻断、historical-lessons-used 不校验。M12 实现不得将此两条升级为 blocking gate。M11 路由表（D-M11-7）不得被 M12 覆盖或降级。

- **明确无影响**：make-decision / build-spec / build-code / verify-code 已有技能（M12 只引用不改动）；M4 collector.mjs 底座；M11 产出的 spec-specify / spec-clarify 技能（不回归）；agenthub 现有实现（零改动）。
