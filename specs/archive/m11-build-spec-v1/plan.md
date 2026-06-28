---
milestone: m11-build-spec-v1
stage: plan
status: draft
upstream: spec.md + decision-log.md (approved 2026-06-28)
---

# Plan -- M11 build-spec v1

## Technical Context

**交付仓**：`/Users/Hugh/Hugh/Project/workflowhub`
**执行环境**：workflowhub vibecoding 五段流程（make-decision → build-spec → build-plan → build-code → verify-code）
**上游依赖**：M10 SWITCH 自举切换点已完成；M6 五段薄骨架可用；M7 make-decision v1 可用；M4 collector.mjs 可用
**外部依赖**：
- speckit-specify SKILL.md（`~/.claude/skills/speckit-specify/SKILL.md`）——改造源头，保留核心质量机制（模板生成/交互澄清/质量检查清单）
- speckit-clarify SKILL.md（`~/.claude/skills/speckit-clarify/SKILL.md`）——改造源头，保留 10 维歧义分类法/一次一题/增量更新
- speckit 脚手架模板（`multica-agenthub/.specify/templates/spec-template.md`）——模板结构参考源头
- constitution-checklist.md（workflowhub 仓内）——21 条宪法对照母本
- M10 baseline report（`specs/archive/m10-baseline-switch/baseline-report.md`）——5 项基线对照源
- metrics/collector.mjs（M4 已交付）——指标记录

**现有骨架**：`workflows/build-spec/SKILL.md`（M6 薄骨架）定义了 F10 gate + stage-result 契约 + metrics 种子字段，是升级起点。

**NEEDS CLARIFICATION**：无。全部 8 条决策（D-M11-1~8）已在 make-decision 阶段经用户批准落盘；4 个开放问题在本 plan 内全部解决。

---

## Constitution Check（对照 21 条逐条）

| 条款 | 结论 | 说明 |
|------|------|------|
| F1 薄核心 | YES | build-spec SKILL.md 只做调度（依次调 spec-specify → spec-clarify → 宪法检查 → baseline 对照 → 人审），重活由两组件技能承担 |
| F2 窄契约 | YES | spec-specify/clarify 仅通过 task-id 参数和 spec 文件路径与外界交互，无共享状态 |
| F3 物理事实靠机器校验但不阻断 | YES | 宪法检查输出 21 条勾选结果（record fact），baseline 对照表产出数字（record fact），均不阻断推进 |
| F4 质量靠异源审查与人 | YES | v1 设一次人审检查点（明文停顿等人确认），不设自动审查门 |
| F5 gate 谨慎添加 | YES | 所有新增机制均过 F10 4 问 gate（见 §F10 Gate 应用记录），不达标只记录不阻断（FR-CONSTITUTION-002） |
| F6 统一外置执行记录 | YES | 沿用 M4 collector.mjs recordSkeleton/updateOwnResult，stage-result 写 durable |
| F7 推进与不可逆操作不自动越过人 | YES | build-spec 段无可逆操作（不切分支、不 merge、不删文件），人审检查点为 push-only 确认，非 gates |
| F8 简单优先 | YES | 两技能为纯 SKILL.md 提示词（无 .mjs / 无脚本 / 无新增 runtime），宪法检查为人工逐条勾 |
| F9 可证伪、不假绿 | YES | task-id 缺失 → spec-specify 报明确错误（物理信号）；宪法检查缺条 → grep 可证伪红 |
| F10 不为机器可校验堆基建 | YES | 宪法检查不建自动化脚本（人工逐条勾）；baseline 对照不建度量 pipeline（手工填表）；不建 CI gate |
| Q1 记事实而非阻断 | YES | 宪法检查不达标仅浮现不阻断；baseline 对照阈值人拍、不达标不阻断；metrics 写失败只 warn |
| Q2 gate 三类划分 | YES | 入口校验（task-id 存在）vs 记录浮现（宪法勾选/baseline 对照）vs 人工确认（人审检查点） |
| Q3 异源审查加人工把关 | YES | 宪法检查结果浮现供人审查；build-spec v1 含一次人审确认点 |
| S1 能用外部就不造轮子 | YES | spec-specify/clarify 从 speckit 改造适配，不重写；constitution-checklist.md 直接用；collector.mjs 直接用 |
| S2 外部技能可改造合宪 | YES | speckit→spec-specify/clarify：去分支推断、模板内置化、task-id 参数化，改造后台账登记 reuse-registry |
| S3 迭代保持最新 | YES | reuse-registry.md 登记来源路径（speckit-specify/clarify SKILL.md 原始路径），便于检查更新 |
| S4 自定义技能必须有指标系统 | YES | spec-specify/clarify 各接 recordSkeleton/updateOwnResult，build-spec 沿用 M6 metrics 契约 |
| S5 方便子代理调用 | YES | 两技能 SKILL.md 提示词自包含，可被 build-spec 子代理独立调起 |
| S6 参考市面方案不闭门造车 | YES | 参考 speckit 的质量清单/交互澄清格式/10 维歧义分类法，适配 workflowhub 契约 |
| S7 一阶段一技能一文件夹 | YES | spec-specify/clarify 各独立文件夹（`workflows/spec-specify/`、`workflows/spec-clarify/`），从属 build-spec stage |
| S8 可独立调用可搬运 | YES | 两技能不依赖 git 分支/项目 `.specify/`/外部命令行，仅凭 task-id 参数 + workflowhub 内部模板即可调用 |

**关键合宪确认**：
- FR-DECOUPLE-001~003 → F8/F9 YES：task-id 显式参数替代分支推断，参数缺失 fail-loud，不做隐藏兼容层（Let-it-crash）
- FR-CONSTITUTION-002 → Q1/F3/F5 YES：宪法检查不达标仅记录不阻断
- FR-SKELETON-001/002 → F2/F6 YES：M6 F10 gate/stage-result 契约/metrics 契约保留不变

---

## 最简方案判断（YAGNI 阶梯）

**需要存在吗？**

- spec-specify SKILL.md：YES——FR-SPECIFY-001/002/003/004/005 要求结构化 spec 生成能力，现 build-spec 骨架无此能力
- spec-clarify SKILL.md：YES——FR-CLARIFY-001/002/003/004/005 要求 10 维歧义扫描 + 交互澄清，现骨架无此能力
- spec-template.md（内置模板）：YES——FR-TEMPLATE-001/002 要求模板内置化，不读目标项目 `.specify/`
- build-spec SKILL.md 升级：YES——骨架缺 spec-specify/clarify 集成/宪法检查/baseline 对照/人审检查点 四大能力
- config/workflowhub.yaml 更新：YES——M2 微内核 architecture 约束：spec-specify / spec-clarify 作为 workflowhub 内部 workflow 必须登记 `config/workflowhub.yaml` registry 才能被 kernel dispatch（非 FR 派生，属 M2 基础架构必需项）
- reuse-registry.md 更新：YES——FR-REGISTRY-001/002 要求登记来源路径

**已有吗？**

- metrics/collector.mjs：已有（M4 交付），直接调用 recordSkeleton / updateOwnResult
- constitution-checklist.md：已有（M1），直接读取 21 条逐条对照
- M10 baseline report：已有（`specs/archive/m10-baseline-switch/baseline-report.md`），直接读取 5 项基线值
- stage-result 契约：build-spec SKILL.md 骨架已有七键结构，直接保留
- F10 gate：build-spec SKILL.md 骨架已有 4 问，直接保留

**已有模块可复用吗？**

- spec-specify/clarify 的核心逻辑已在 speckit-specify/clarify SKILL.md 中——改造适配而非重写：去分支推断逻辑、task-id 参数化、模板内部引用路径替换、保留质量机制（质量清单/交互澄清格式/10 维分类法）
- 3rd-review 的全局注册模式（`~/.claude/skills/` symlink）不适用于本 case——spec-specify/clarify 由 build-spec 内调，非独立用户面技能，按 workflowhub 既有组件 skill 模式（scope-triage/decision-log）落 `workflows/` 目录

**更简单吗？**

- 两技能为纯 SKILL.md 提示词，无 .mjs 脚本、无 npm 依赖、无 runtime 基建

> **FR-TEMPLATE-001 "自带所需模板和必要脚本"的调和说明**：FR-TEMPLATE-001 原文要求"技能自带所需模板和必要脚本"。M11 方案中"必要脚本 = 无"——speckit 原 `create-new-feature.sh`（建目录+创建分支+复制模板）和 `check-prerequisites.sh`（从 git 分支推断 FEATURE_DIR）的职责，在 M11 由 SKILL.md 内嵌指令替代承担：(a) task-id 参数推导产物路径替代分支推断；(b) SKILL.md 内嵌 fail-loud 缺参检查替代 check-prerequisites.sh；(c) 内置模板文件替代 create-new-feature.sh 的模板复制。能力等价替代，不丢功能，故"必要脚本"集合为空，不违反 FR-TEMPLATE-001。不因此新增脚本文件——保持纯 SKILL.md 最小方案。
- 宪法检查为 SKILL.md 内一步提示词指令（人工逐条勾），不建脚本/工具
- baseline 对照为 SKILL.md 内一步提示词指令（手工填表），不建自动化 pipeline
- 模板为一份静态 markdown 文件，不需要编译/预处理

**阶梯结论**：最小切口 = 2 个新 SKILL.md（spec-specify + spec-clarify）+ 1 个模板文件 + build-spec SKILL.md 升级 + config 更新 + reuse-registry 更新。STOP。

**不可简化红线**：
- task-id 缺失必须 fail-loud，不做分支推断回退（FR-DECOUPLE-001，Let-it-crash）
- 模板从 workflowhub 内部加载，不做 `.specify/` 回退（FR-DECOUPLE-002）
- F10 gate 4 问 / stage-result 七键 / metrics 调用指令不可删减（FR-SKELETON-001/002）
- 宪法检查 21 条缺任一条即验收失败（FR-CONSTITUTION-001/003）
- speckit 模板章节结构保留但适配为 workflowhub archive 风格（FR-TEMPLATE-002）

---

## 4 个未决设计问题的解决方案

### 设计问题 1：去 git 分支身份的替代机制

**决策**：**task-id-derived path**。接口为：接受显式 `task-id` 参数（必填，string 字面量），由 task-id 推导 `specs/{task-id}/spec.md` 产物路径。不提供显式 `feature-dir` 参数——单参数已足够，加第二个参数增加歧义和误用面。

**接口定义**：
- spec-specify 入参：`task-id: string`（必填，缺失时 fail-loud 报 "task-id required"，exit 非 0）
- spec-clarify 入参：`task-id: string` 或 `spec-path: string`（接受 task-id 推导或显式文件路径；缺失时 fail-loud）
- 产物路径推导：`specs/{task-id}/spec.md`（spec-specify 写入）、`specs/{task-id}/`（spec-clarify 读取并写回）

**Fail-loud 点**（FR-DECOUPLE-001/002/003）：
1. task-id 缺失 → spec-specify / spec-clarify 报明确错误，不执行，不做分支推断
2. 推导的 spec 路径文件不存在 → spec-clarify 报明确错误，不运行歧义扫描
3. 内部模板路径不存在 → spec-specify 报 "template not found at <internal-path>"，不做 `.specify/` 回退

**为什么不是显式 feature-dir**：spec 已全局锚定 task-id 路径约定（FR-TASK-002），加 feature-dir 引入第二套命名空间，增加调用方认知负担且无实际收益。注：speckit 原实现 `create-new-feature.sh` 已有 `--no-branch` 和 `--feature` 参数可作为零-clone 可行性佐证，但 M11 方案不依赖它们——SKILL.md 直接用 task-id 派生路径，绕开脚本调用。

**F10 4 问**：
| 问 | 答 |
|----|-----|
| Q1 真实威胁？ | 多 task 并行时分支推断冲突 + per-project clone 摩擦（inventory 已确认） |
| Q2 已有覆盖？ | 无——现 speckit-specify 硬编码 `git checkout -b`，clarify 用 `check-prerequisites.sh` 从分支推断 FEATURE_DIR |
| Q3 可绕过？ | 否——task-id 缺失时 fail-loud，不做分支推断回退 |
| Q4 长期维护成本？ | 低——单 string 参数，路径推导一行逻辑 |

---

### 设计问题 2：模板存放位置 + 引用路径

**决策**：模板从 speckit 原仓库 `multica-agenthub/.specify/templates/spec-template.md` 提取，**存放于 `workflows/spec-specify/templates/spec-template.md`**——与 spec-specify 技能同目录，符合 S7 "一阶段一技能一文件夹"原则。spec-specify SKILL.md 通过相对路径 `./templates/spec-template.md` 引用。

**内容适配**（FR-TEMPLATE-002）：保留 speckit 原模板的 11 章骨架（用户场景/FR/成功标准/关键实体等），但适配为 workflowhub archive 风格：
- 章节编号从罗马数字改为中文锚点（速读卡 + 1. 问题陈述 + 2. 背景/目标/边界 + ...）
- 对齐 `specs/archive/m7-intake-v1/spec.md` 和 `specs/archive/m9-verify-code/spec.md` 的章节结构
- 不保留 speckit 原有 `.specify/` 路径引用、`create-new-feature.sh` 调用等 speckit 专有元素

**为什么不是全局 templates/ 目录**：单技能专用模板，放技能目录内降低耦合——未来其他技能不需要 spec 模板，不需要共享目录。

**F10 4 问**：
| 问 | 答 |
|----|-----|
| Q1 真实威胁？ | per-project clone 摩擦、模板不同步（多项目各自维护 `.specify/templates/`） |
| Q2 已有覆盖？ | 无——现 speckit 从目标项目 `.specify/templates/spec-template.md` 加载 |
| Q3 可绕过？ | 否——模板路径硬编码为 workflowhub 内部路径，不存在时 fail-loud，不做回退 |
| Q4 长期维护成本？ | 低——一份静态 markdown 文件，仅在模板结构变更时更新 |

---

### 设计问题 3：改名后注册形态

**决策**：**workflowhub-internal workflow**（存储为 `workflows/spec-specify/SKILL.md` 和 `workflows/spec-clarify/SKILL.md`），在 `config/workflowhub.yaml` 中以独立 component_id 注册。**不注册为全局 Claude skill（不用 symlink）**。

**理由**：
1. spec-specify/clarify 由 build-spec SKILL.md 内调，不是独立用户面技能——用户不会直接 `/spec-specify`，而是走 `/build-spec` 流程
2. workflowhub 已有组件 skill 先例（scope-triage / decision-log 从属 make-decision，各自独立 folder + registry 条目）
3. 全局 Claude skill（symlink 模式）适用于独立用户面技能（如 3rd-review），不适于内部组件——symlink 引入版本不一致风险（全局 vs 仓内一份）
4. 放 workflowhub 仓内使提示词内容受版本控制、与 build-spec SKILL.md 的引用关系可 grep 验证

**AC6 满足**：skill 名称为 `spec-specify` / `spec-clarify`，无 `speckit-*` 前缀，不与本地 `~/.claude/skills/speckit-*` 冲突。

**AC7 满足**：两技能为 workflowhub 仓内文件，调用方传入 task-id 即可，不要求目标项目 clone/初始化 `.specify/`。

**F10 4 问**：
| 问 | 答 |
|----|-----|
| Q1 真实威胁？ | 与本地 speckit-* 全局技能名冲突 → 改名规避；symlink 版本不一致 → 仓内存储规避 |
| Q2 已有覆盖？ | workflowhub 已有 scope-triage/decision-log 组件 skill 模式可复用 |
| Q3 可绕过？ | 否——仓内路径可直接 grep 验证存在 |
| Q4 长期维护成本？ | 低——两份 SKILL.md 文件，与其余 7 个 skill 维护方式一致 |

---

### 设计问题 4：宪法符合性检查执行形态

**决策**：**人工逐条勾选**。build-spec SKILL.md 中包含一步显式指令：执行者读取 `constitution-checklist.md`，对 21 条（F1-F10/Q1-Q3/S1-S8）逐条写 `[x]` 符合或 `[ ]` 不符合并附判据，结果写入 spec 产物附录。

**为什么不是半自动辅助**：
1. 宪法条款的判断需要理解 spec 内容的语义（不是机械匹配），LLM 天然适合此任务
2. 建自动化脚本违反 F10——为"机器可校验"堆基建，而实际判断仍需人工/LLM 解读
3. 半自动辅助的"辅助"部分（如自动 grep 关键词匹配）产出假阳性/假阴性，需人工复核 → 两遍工作量
4. AC2 要求的"21 条逐条有状态+判据"通过 SKILL.md 提示词指令即可满足，无需额外工具

**产物格式**：一张 markdown 表，21 行，每行含条款编号、勾选状态（`[x]`/`[ ]`）、判据文字。写入 spec 产物附录或独立文件。

**F10 4 问**：
| 问 | 答 |
|----|-----|
| Q1 真实威胁？ | 无宪法对照导致合规盲区、设计偏离宪法 |
| Q2 已有覆盖？ | constitution-checklist.md 存在但未被流程串联——build-spec v1 将其串入流程 |
| Q3 可绕过？ | 否——SKILL.md 明文指令执行者做 21 条勾选，验收阶段 grep 验证完整性 |
| Q4 长期维护成本？ | 低——SKILL.md 中一步提示词指令，无代码/脚本维护负担。宪法条目数变动时同步更新 count 断言 |

---

## 项目文件结构

```text
workflowhub/
├── workflows/
│   ├── build-spec/
│   │   └── SKILL.md                        # 【修改】从 M6 薄骨架升 v1：集成 spec-specify → spec-clarify → 宪法检查 → baseline 对照 → 人审
│   ├── spec-specify/                       # 【新增】目录
│   │   ├── SKILL.md                        # 【新增】spec-specify 技能：接受 task-id + 描述，生成 structured spec
│   │   └── templates/
│   │       └── spec-template.md            # 【新增】内置 spec 模板（workflowhub archive 风格，11 章骨架）
│   └── spec-clarify/                       # 【新增】目录
│       └── SKILL.md                        # 【新增】spec-clarify 技能：接受 task-id/spec-path，10 维歧义扫描 + 交互澄清
├── config/
│   └── workflowhub.yaml                    # 【修改】registry 新增 spec-specify / spec-clarify 两条
└── reuse-registry.md                       # 【修改】新增 spec-specify / spec-clarify 两行
```

**每个文件的职责**：

| 文件 | 变更 | 职责 |
|------|------|------|
| `workflows/spec-specify/SKILL.md` | 新建 | 纯提示词：读 task-id + 描述 → 加载内置模板 → 生成 `specs/{task-id}/spec.md` + `specs/{task-id}/checklists/requirements.md`；含 ≤3 个 [NEEDS CLARIFICATION] 交互澄清；接 collector 指标 |
| `workflows/spec-specify/templates/spec-template.md` | 新建 | 静态模板：workflowhub archive 风格（速读卡 + 11 章中文锚点），保留 speckit 核心章节结构，去除 speckit 专有路径引用 |
| `workflows/spec-clarify/SKILL.md` | 新建 | 纯提示词：读 task-id/spec-path → 加载现有 spec → 10 维歧义扫描 → ≤5 题交互澄清（一次一题 + 推荐） → 增量更新 spec + 覆盖率摘要；接 collector 指标 |
| `workflows/build-spec/SKILL.md` | 修改 | 完整 v1 提示词：前置读 decision-log → 调 spec-specify → 调 spec-clarify → 宪法符合性检查（逐条勾 21 条） → baseline 对照（5 项指标） → 人审检查点停顿 → 产 stage-result + metrics。保留 M6 F10 gate/stage-result 契约/metrics 调用 |
| `config/workflowhub.yaml` | 修改 | M2 微内核 registry 工程必需项（非 FR 派生）：新增 `spec-specify` 和 `spec-clarify` 两条目（component_id + workflow + path），使两技能能被 kernel dispatch |
| `reuse-registry.md` | 修改 | 新增两行：spec-specify（外部改造适配 / speckit-specify SKILL.md 路径）+ spec-clarify（外部改造适配 / speckit-clarify SKILL.md 路径） |

**spec 第 11 章业务影响覆盖**：

| 受影响功能 | 文件 | 变更类型 |
|-----------|------|---------|
| spec 生成（spec-specify） | `workflows/spec-specify/SKILL.md` + `templates/spec-template.md` | 新增 |
| spec 澄清（spec-clarify） | `workflows/spec-clarify/SKILL.md` | 新增 |
| build-spec 流程编排 | `workflows/build-spec/SKILL.md` | 升级 |
| 宪法符合性检查 | `workflows/build-spec/SKILL.md`（流程步骤） | 新增 |
| baseline 对照度量 | `workflows/build-spec/SKILL.md`（流程步骤） | 新增 |
| 人审检查点 | `workflows/build-spec/SKILL.md`（流程步骤） | 新增 |
| reuse-registry 登记 | `reuse-registry.md` | 追加 |
| skill registry | `config/workflowhub.yaml` | 追加 |

---

## FR 覆盖矩阵

> spec 共 28 条 FR。build-plan 阶段规划交付 26 条 FR 的实施方案（Phase 1-4）。FR-TASK-001/002 为任务级 AC9/AC10 自举约束，由 verify-code 阶段在 handoff 中验收五段闭环与路径稳定——build-plan 仅声明映射，不产出对应 build task。

| FR | 映射到 |
|----|--------|
| FR-TASK-001 | M11 任务级 AC9：五段闭环由 verify-code 阶段验收（不属 build-plan 产出范围） |
| FR-TASK-002 | M11 任务级 AC10：task-id=`m11-build-spec-v1`，路径基线在 decision-log + spec 中已锚定 |
| FR-SPECIFY-001 | Phase 3 Task 3.1（build-spec SKILL.md 集成 spec-specify 调用） + Phase 1 Task 1.1（spec-specify SKILL.md） |
| FR-SPECIFY-002 | Phase 1 Task 1.1（spec-specify SKILL.md：保留 speckit 质量机制——关键概念提取/假设记录/≤3 NEEDS CLARIFICATION/FR 可测试） |
| FR-SPECIFY-003 | Phase 1 Task 1.2（spec-template.md：A 档硬门五章必填/B 档条件触发/C 档可精简的三档裁剪） |
| FR-SPECIFY-004 | Phase 1 Task 1.1（spec-specify SKILL.md：指令生成 checklists/requirements.md 质量检查清单） |
| FR-SPECIFY-005 | Phase 1 Task 1.1（spec-specify SKILL.md：≤3 NEEDS CLARIFICATION 交互格式——3-5 互斥选项+推荐，一次呈现） |
| FR-CLARIFY-001 | Phase 3 Task 3.1（build-spec SKILL.md 集成 spec-clarify 调用） + Phase 2 Task 2.1（spec-clarify SKILL.md） |
| FR-CLARIFY-002 | Phase 2 Task 2.1（spec-clarify SKILL.md：保留 speckit 10 维歧义分类法，每维标 Clear/Partial/Missing） |
| FR-CLARIFY-003 | Phase 2 Task 2.1（spec-clarify SKILL.md：一次一题+推荐+上限 5 题纪律） |
| FR-CLARIFY-004 | Phase 2 Task 2.1（spec-clarify SKILL.md：每答一题增量更新 spec，Clarifications 节+对应章节整合） |
| FR-CLARIFY-005 | Phase 2 Task 2.1（spec-clarify SKILL.md：完成时输出覆盖率摘要——Resolved/Deferred/Clear/Outstanding） |
| FR-DECOUPLE-001 | Phase 1 Task 1.1 + Phase 2 Task 2.1（两 SKILL.md 均要求 task-id 必填，缺失 fail-loud，不做分支推断） |
| FR-DECOUPLE-002 | Phase 1 Task 1.1（spec-specify SKILL.md：模板从 `./templates/spec-template.md` 加载，不存在 fail-loud） |
| FR-DECOUPLE-003 | Phase 2 Task 2.1（spec-clarify SKILL.md：定位 spec 通过 task-id 推导或显式路径，不调 check-prerequisites.sh） |
| FR-TEMPLATE-001 | Phase 1 Task 1.2（spec-template.md 存放在 `workflows/spec-specify/templates/`，技能自带不铺设到目标项目） |
| FR-TEMPLATE-002 | Phase 1 Task 1.2（spec-template.md 保留 speckit 11 章骨架但适配为 workflowhub archive 风格） |
| FR-CONSTITUTION-001 | Phase 3 Task 3.1（build-spec SKILL.md：宪法符合性检查步骤——逐条勾 21 条，每条有状态+判据） |
| FR-CONSTITUTION-002 | Phase 3 Task 3.1（build-spec SKILL.md：明确宪法检查仅记录不阻断，不达标不置 status=failure） |
| FR-CONSTITUTION-003 | verify-code 阶段验收：21 条勾选结果完整性检查（缺条/缺状态/缺判据即失败）由 verify-code 执行，不属 build-plan 产出范围 |
| FR-BASELINE-001 | Phase 3 Task 3.1（build-spec SKILL.md：baseline 对照步骤——产出 5 行×4 列表，M10 值 0.05/0.8295/1/6.075/25.25） |
| FR-BASELINE-002 | Phase 3 Task 3.1（build-spec SKILL.md：阈值人拍，不达标不阻断） |
| FR-BASELINE-003 | Phase 3 Task 3.1（build-spec SKILL.md：第 5 项使用 rework_proxy_count，不用旧称） |
| FR-REGISTRY-001 | Phase 4 Task 4.1（reuse-registry.md 新增 spec-specify/spec-clarify 两行） |
| FR-REGISTRY-002 | Phase 4 Task 4.1 + Task 4.3（Task 4.1 保证行存在；Task 4.3 做格式校验——类别枚举+来源非空+awk 列核实） |
| FR-REVIEW-001 | Phase 3 Task 3.1（build-spec SKILL.md：一且仅一次人审检查点——明文停顿等人确认，在 stage-result 前） |
| FR-SKELETON-001 | Phase 3 Task 3.1（build-spec SKILL.md：保留 F10 gate 完整 4 问，可 grep） |
| FR-SKELETON-002 | Phase 3 Task 3.1（build-spec SKILL.md：保留 stage-result 七键结构+metrics 调用指令，不可删改） |

---

## 实现顺序与 Commit 边界

### 实现顺序

Phase 1 + Phase 2（spec-specify 和 spec-clarify 并行）→ Phase 3（build-spec 升级）→ Phase 4（注册+验证）

依赖关系：
- Phase 1 和 Phase 2 无互依赖，可并行；两技能均为新建文件，冲突风险为零。统一表述为 Phase 1 + Phase 2（并行），不加 → 误导串行依赖
- Phase 3 依赖 Phase 1+2（build-spec SKILL.md 引用两技能路径，路径引用需可 grep 验证）
- Phase 4 依赖 Phase 1+2+3（registry 条目指向已存在的 SKILL.md 路径；reuse-registry 登记来源路径）

### Commit 边界

| Commit | 内容 | Phase |
|--------|------|-------|
| C1 | `workflows/spec-specify/` 全目录（SKILL.md + templates/spec-template.md） | Phase 1 |
| C2 | `workflows/spec-clarify/SKILL.md` | Phase 2 |
| C3 | `workflows/build-spec/SKILL.md` v1 升级 | Phase 3 |
| C4 | `config/workflowhub.yaml` + `reuse-registry.md` 更新 | Phase 4 |
| C5（可选） | 宪法符合性检查产物（21 条勾选结果写入 spec 附录）+ baseline 对照表 | Phase 4 验证 |

单 commit 也可（4 个文件变更 + 2 个新目录，范围清晰），但分 commit 便于 review 和回滚。

---

## 验证策略

M11 build-spec v1 的交付物全为 SKILL.md 提示词文件（无 .mjs / 无可执行代码），验证以 grep/结构检查为主：

| 类别 | 验证方式 | 通过判据 |
|------|---------|---------|
| spec-specify SKILL.md 存在 | `test -f workflows/spec-specify/SKILL.md` | exit 0 |
| spec-specify 含 task-id 必填声明 | `grep "task-id" workflows/spec-specify/SKILL.md` | 有匹配 |
| spec-template.md 存在且含必要章 | `grep -c "用户场景\|功能需求\|验收" workflows/spec-specify/templates/spec-template.md` | >=3 |
| spec-clarify SKILL.md 存在 | `test -f workflows/spec-clarify/SKILL.md` | exit 0 |
| spec-clarify 含 task-id 参数 | `grep "task-id" workflows/spec-clarify/SKILL.md` | 有匹配 |
| spec-clarify 含 10 维分类 | 逐一断言 10 个维度名（Functional Scope / Domain & Data / Interaction & UX / Non-Functional / Integration / Edge Cases / Constraints / Terminology / Completion / Misc），见 Task 2.2 | 任一缺即 fail |
| build-spec v1 集成 spec-specify | `grep "spec-specify" workflows/build-spec/SKILL.md` | 有匹配 |
| build-spec v1 集成 spec-clarify | `grep "spec-clarify" workflows/build-spec/SKILL.md` | 有匹配 |
| build-spec v1 含宪法检查 | `grep -c "constitution-checklist\|F1\|F2" workflows/build-spec/SKILL.md` | >=2 |
| build-spec v1 含 baseline 对照 | `grep -c "rework_proxy_count\|baseline\|M10" workflows/build-spec/SKILL.md` | >=3 |
| build-spec v1 含人审检查点 | `grep "人审\|人工确认\|停顿\|等人" workflows/build-spec/SKILL.md` | 有匹配 |
| build-spec v1 保留 F10 gate | `grep "What real threat does this defend against" workflows/build-spec/SKILL.md` | 有匹配 |
| build-spec v1 保留 stage-result 契约 | `grep -c "spec_ref\|requirements\|stage-result" workflows/build-spec/SKILL.md` | >=2 |
| build-spec v1 保留 metrics 调用 | `grep -c "recordSkeleton\|updateOwnResult" workflows/build-spec/SKILL.md` | >=2 |
| config registry 含 spec-specify | `grep "spec-specify" config/workflowhub.yaml` | 有匹配 |
| config registry 含 spec-clarify | `grep "spec-clarify" config/workflowhub.yaml` | 有匹配 |
| reuse-registry 含两新行 | `grep -c "spec-specify\|spec-clarify" reuse-registry.md` | >=2 |
| 宪法检查产物 21 条全部在场 | 人工逐条核对 constitution checklist 产物含 F1-F10/Q1-Q3/S1-S8 全部 21 条 | 缺任一条即失败 |
| AC6 无 speckit-* 命名 | 仅查 frontmatter name 行：`grep -q "^name: speckit-" workflows/spec-specify/SKILL.md && fail` + 同样查 spec-clarify（不扫全文，允许文件头来源注释含 speckit-*），见 Task 4.3 | name 行无 speckit-* 前缀 |
| 三 SKILL.md 均含 collector 指令 | `grep -l "recordSkeleton" workflows/spec-specify/SKILL.md workflows/spec-clarify/SKILL.md workflows/build-spec/SKILL.md` | 三文件均命中 |

---

## 治理文件同步矩阵

| 类别 | 改/不改 | 原因 | Task |
|------|---------|------|------|
| 项目规则（CLAUDE.md / AGENTS.md） | 不改 | M11 仅新增 skill 文件，不触碰项目级规则 | -- |
| workflow 定义（SKILL.md） | 改 | 新增 spec-specify/SKILL.md + spec-clarify/SKILL.md；升级 build-spec/SKILL.md | Task 1.1, 2.1, 3.1 |
| reviewer contract | 不改 | M11 v1 不设审查门 | -- |
| schema | 不改 | M11 不改 facts-subschema.json（build-spec facts 结构不变，仅内容扩展） | -- |
| runtime config | 改 | `config/workflowhub.yaml` registry 新增两条（spec-specify + spec-clarify），M2 架构约束非 FR 派生 | Task 4.2 |
| knowledge/doc | 不改 | M11 不引入新宪法条款、不追加 CONTEXT.md | -- |
| automation gates / CI | 不改 | M11 交付全为 SKILL.md 提示词，无 .mjs / 无 CI 变更 | -- |
| reuse-registry | 改 | 新增 spec-specify / spec-clarify 两行 | Task 4.2 |

---

## F10 Gate 应用记录

> build-spec v1 规划中每个新增/修改项均过 F10 4 问。

| 机制 | Q1 真实威胁 | Q2 已有覆盖 | Q3 可绕过 | Q4 维护成本 | 结论 |
|------|------------|------------|----------|------------|------|
| spec-specify SKILL.md（新增） | 现 build-spec 无结构化 spec 生成能力 | 无 | 否——SKILL.md 可 grep 验证存在 | 低——纯提示词文件 | 纳入 |
| spec-clarify SKILL.md（新增） | spec 歧义未经消除导致下游返工 | 无 | 否——SKILL.md 可 grep 验证存在 | 低——纯提示词文件 | 纳入 |
| spec-template.md（内置模板） | per-project clone 摩擦、模板不同步 | 无 | 否——内部路径硬编码，不存在 fail-loud | 低——静态 markdown | 纳入 |
| task-id 参数化（替代分支推断） | 多 task 并行冲突 + per-project clone | 无 | 否——缺失 fail-loud，不做回退 | 低——单参数传递 | 纳入 |
| 宪法符合性检查步骤（SKILL.md 指令） | 无宪法对照致合规盲区 | constitution-checklist.md 存在但未被流程串联 | 否——SKILL.md 明文指令，验收 grep | 低——一步提示词指令 | 纳入 |
| baseline 对照步骤（SKILL.md 指令） | 无对比基线无法评估流程改进 | 无 | 否——SKILL.md 明文指令，验收 grep | 低——一步提示词指令 | 纳入 |
| 人审检查点（SKILL.md 停顿） | 无人审致方向漂移 | Q3 原则已定但无具体检查点 | 否——明文停顿文字，可 grep | 低——一行提示词 | 纳入 |
| config registry 扩展 | 新技能不可发现/不可调度 | 已有 registry 机制（M2） | 否——YAML 可解析 | 低——两条 YAML 条目 | 纳入 |
| reuse-registry 追加 | 外部依赖无溯源 | reuse-registry.md 存在 | 否——markdown 表行可 grep | 低——两行追加 | 纳入 |

**F10 结论**：所有机制均为 Q1 有真实威胁、Q2 无冗余覆盖、Q3 不可绕过、Q4 低维护成本。无一被排除。
