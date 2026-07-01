---
task_id: m13a-moat-skills
stage: build-plan
spec_version: 1.1.0
plan_version: 1.1.0
---

# 实施计划：护城河能力内置化（M13a）

> 基于 spec.md（32 FR / 32 AC，ladder B），decision-log.md（D1-D6，user_decision:true），宪法优先。
> 本计划不可覆盖 CONSTITUTION.md。

---

## Technical Context

**项目定位**：workflowhub 是一个 AI 开发工作流编排工具。本里程碑（M13a）将 make-decision 的三个护城河动作（talk/grill/异源审查）从内联逻辑/外部依赖升级为独立的 in-repo skill 文件，并强化测试断言，杜绝假绿。

**关键设计决策（来自 decision-log.md D1-D6）**：
- D1：护城河 skill 数量定为 3 个（talk-with-zhipeng、grill-with-docs、intake-decision-review）
- D2：talk-with-zhipeng 源自 multica-agenthub 搬运，adapter 路径改写，删 gbrain 依赖
- D3：grill-with-docs 源自 ~/.claude/skills/grill-with-docs/ 全量搬运（非 lite 变体）
- D4：intake-decision-review 为单一 skill（非 4 个独立 intake-* + orchestrator 方案）
- D5：make-decision 引用切换为 in-repo 相对路径，不重构 583 行主壳
- D6：测试断言写入 tests/moat-skills.test.mjs，断言文件存在性+契约条款

**范围边界（不可触碰）**：
- `workflows/build-code/SKILL.md`（不改）
- `workflows/verify-code/SKILL.md`（不改）
- `workflows/build-spec/SKILL.md`（不改）
- `workflows/build-plan/SKILL.md`（不改）
- make-decision 583 行主壳调度逻辑（不重构，仅改引用路径）
- debate skill（保持外部 /Users/Hugh/Hugh/Project/debate 现状）

---

## Implementation Steps

### Phase 1: 新建 skill 文件（基础设施）

**Step 1.1**：新建 `skills/talk-with-zhipeng/SKILL.md`
- 源自 multica-agenthub talk-with-zhipeng skill 搬运
- adapter 改写：将宿主路径替换为 workflowhub in-repo 路径
- 删除 gbrain context 查询逻辑（office-hours 相关）
- 保留：输入/步骤/执行协议章节，`talk` 关键词，"按影响排序"（impact-ordered）声明
- frontmatter 含 `name: talk-with-zhipeng`
- 验证：无 `/Users/`、`~/.claude`、`multica-agenthub`、`gbrain`、`office-hours` 残留
- 映射 FR：FR-MOAT-001, FR-MOAT-002, FR-MOAT-003, FR-TALK-001, FR-TALK-002, FR-TALK-003
- 验收：AC-01, AC-06, AC-07, AC-08, AC-09, AC-22, AC-26

**Step 1.2**：新建 `skills/grill-with-docs/SKILL.md` + 附属格式文件
- 源自 ~/.claude/skills/grill-with-docs/ 全量搬运（含 CONTEXT-FORMAT.md、ADR-FORMAT.md）
- adapter 改写：宿主路径替换为 workflowhub in-repo 路径
- 保留：输入/输出/步骤章节，`grill` 关键词，核心协议段完整
- frontmatter 含 `name: grill-with-docs`
- 三个文件均不含宿主路径残留
- 映射 FR：FR-MOAT-001, FR-MOAT-002, FR-MOAT-003, FR-GRILL-001, FR-GRILL-002, FR-GRILL-003
- 验收：AC-02, AC-04, AC-05, AC-06, AC-07, AC-08, AC-27

**Step 1.3**：新建 `skills/intake-decision-review/SKILL.md`
- 定义三角度审查结构：每次产出恰好 3 条 findings，标注 direction/framing/scope，三类全覆
- 单次拼装调用模式（将三角度拼装后调用一次 3rd-review）
- fallback_used=true 时立即停止报错，不采用该结果
- findings 不足 3 条或缺角度时要求重跑，不得自行编造
- frontmatter 含 `name: intake-decision-review`
- 语义硬证据（grep 可验证）：`不足\|缺角度`、`重跑\|rerun`、`不得编造\|不自行编造`
- 映射 FR：FR-MOAT-001, FR-MOAT-002, FR-MOAT-003, FR-REVIEW-001, FR-REVIEW-002, FR-REVIEW-003, FR-REVIEW-004
- 验收：AC-03, AC-06, AC-07, AC-08, AC-28(2)

### Phase 2: make-decision 引用切换 + 环境变量 + 大白话改写

**Step 2.1**：更新 `workflows/make-decision/SKILL.md`——引用路径切换
- S5 段落：将盲审引用改为 `skills/intake-decision-review/`
- S7 段落：将 grill 引用改为 `skills/grill-with-docs/`
- S2、S4、S7 的 talk 轮次：均改为 `skills/talk-with-zhipeng/`
- 清除旧外部 talk 路径（multica-agenthub.*talk、~/.claude.*talk）
- 映射 FR：FR-MAKEDEC-001, FR-MAKEDEC-002, FR-MAKEDEC-003
- 验收：AC-10, AC-11, AC-12

**Step 2.2**：更新 `workflows/make-decision/SKILL.md`——TASK_TRACKING_ROOT 环境变量
- 在 Environment Variables 表新增 `TASK_TRACKING_ROOT` 条目
- 含义、默认值、使用说明与 M13b build-spec SKILL.md 中定义对齐
- S10 落盘步骤：读取 TASK_TRACKING_ROOT 确定写入路径；未设置时降级到默认路径，记录 `tracking_root_fallback` 事件，warn 不报错
- 映射 FR：FR-TRACKING-001, FR-TRACKING-002
- 验收：AC-17, AC-18

**Step 2.3**：更新 `workflows/make-decision/SKILL.md`——S2/S4/S9 大白话改写
- S2 用户交互：无英文术语直接暴露，每选项含推荐标记和中文后果说明，grep `推荐` 在 S2 段落命中
- S4 用户交互：遇到问题时给出选项，含推荐标记和中文后果说明，grep `推荐` 在 S4 段落命中
- S9 确认段：含"不确认就不继续"或等义文本，grep `不确认\|等待确认` 在 S9 段落命中
- framing/scope 作为独立英文术语不直接暴露给用户
- 映射 FR：FR-COMM-001, FR-COMM-002, FR-COMM-003
- 验收：AC-21, AC-23

### Phase 3: 测试 + registry 更新（收尾验证）

**Step 3.1**：更新/新建 `tests/moat-skills.test.mjs`
- 文件存在性断言：三个 skill SKILL.md 均存在，缺失即报红
- frontmatter 合规断言：三个 skill 的 `name` 字段存在且非空
- 引用路径断言：make-decision SKILL.md 的 S5/S7/talk 段落含正确 in-repo 路径
- 三角度结构契约断言（direction/framing/scope 全覆盖，grep 可验证）
- "恰好 3 条"负例断言（`恰好.*3\|exactly.*3\|findings.*length.*3\|3.*findings`）
- fallback_used 停止断言
- 单次调用断言（`单次\|single.*call\|once\|calledOnce`）
- 宿主依赖扫描断言（multica-agenthub/gbrain/office-hours 结果为空）
- 不得编造/重跑断言（`不得编造\|不自行编造\|缺角度\|重跑\|rerun`）
- 映射 FR：FR-TEST-001, FR-TEST-002, FR-TEST-003, FR-TEST-004, FR-TEST-005
- 验收：AC-13, AC-14, AC-15, AC-16, AC-19, AC-20, AC-28(1)

**Step 3.2**：更新 `config/reuse-registry.md`
- 新增 3 行登记（talk-with-zhipeng、grill-with-docs、intake-decision-review），每行含名称和 in-repo 路径
- 清除 ghost 绝对路径（/Users/、/home/ 等）和宿主环境引用（~/.claude、multica-agenthub、gbrain、office-hours）
- 路径格式：in-repo 相对路径，不以 / 开头
- 映射 FR：FR-REGISTRY-001, FR-REGISTRY-002
- 验收：AC-24, AC-25

---

## File List

| 文件路径 | 操作 | 涉及 FR |
|---|---|---|
| `skills/talk-with-zhipeng/SKILL.md` | 新建 | FR-MOAT-001~003, FR-TALK-001~003 |
| `skills/grill-with-docs/SKILL.md` | 新建 | FR-MOAT-001~003, FR-GRILL-001~003 |
| `skills/grill-with-docs/CONTEXT-FORMAT.md` | 新建 | FR-GRILL-001, FR-GRILL-003, FR-MOAT-003 |
| `skills/grill-with-docs/ADR-FORMAT.md` | 新建 | FR-GRILL-001, FR-GRILL-003, FR-MOAT-003 |
| `skills/intake-decision-review/SKILL.md` | 新建 | FR-MOAT-001~003, FR-REVIEW-001~004 |
| `workflows/make-decision/SKILL.md` | 更新 | FR-MAKEDEC-001~003, FR-TRACKING-001~002, FR-COMM-001~003 |
| `config/reuse-registry.md` | 更新 | FR-REGISTRY-001~002 |
| `tests/moat-skills.test.mjs` | 更新/新建 | FR-TEST-001~005 |
| `.mcp.json` | 新建/更新 | FR-MCP-001 |
| `skills/anysearch/SKILL.md` | 新建 | FR-SEARCH-001 |

---

## Verification Mapping

| Step | FR | AC |
|---|---|---|
| 1.1 talk-with-zhipeng/SKILL.md | FR-MOAT-001~003, FR-TALK-001~003 | AC-01, AC-06, AC-07, AC-08, AC-09, AC-22, AC-26 |
| 1.2 grill-with-docs/ | FR-MOAT-001~003, FR-GRILL-001~003 | AC-02, AC-04, AC-05, AC-06, AC-07, AC-08, AC-27 |
| 1.3 intake-decision-review/SKILL.md | FR-MOAT-001~003, FR-REVIEW-001~004 | AC-03, AC-06, AC-07, AC-08, AC-28(2) |
| 2.1 make-decision 引用切换 | FR-MAKEDEC-001~003 | AC-10, AC-11, AC-12 |
| 2.2 TASK_TRACKING_ROOT 声明 | FR-TRACKING-001~002 | AC-17, AC-18 |
| 2.3 S2/S4/S9 大白话改写 | FR-COMM-001~003 | AC-21, AC-23 |
| 3.1 tests/moat-skills.test.mjs | FR-TEST-001~005 | AC-13~16, AC-19, AC-20, AC-28(1) |
| 3.2 config/reuse-registry.md | FR-REGISTRY-001~002 | AC-24, AC-25 |
| 4.1 .mcp.json 声明 muyu-search-mcp | FR-MCP-001, FR-MCP-002 | AC-29, AC-30 |
| 4.2 skills/anysearch/ 搬入 in-repo | FR-SEARCH-001, FR-SEARCH-002 | AC-31, AC-32 |

---

Phase 4: MCP 声明 + anysearch 内置化

**Step 4.1**：新建/更新 `.mcp.json`——声明 muyu-search-mcp
- 从用户级 Claude MCP 配置提取 muyu-search-mcp 真实 command/args
- 鉴权秘密走 env 引用，不入库（`.env.example` 占位，`.env` 不入库）
- 映射 FR：FR-MCP-001, FR-MCP-002
- 验收：AC-29, AC-30

**Step 4.2**：新建 `skills/anysearch/`——搬入 in-repo
- 从 `~/.claude/skills/anysearch/` 全量搬入 `SKILL.md`
- frontmatter 合规：含非空 `name` 字段
- 清除本机绝对路径残留（`/Users/`、`/home/`）
- 真实 `.env` 不入库，`.env.example` 占位入库，`.gitignore` 覆盖
- 映射 FR：FR-SEARCH-001, FR-SEARCH-002
- 验收：AC-31, AC-32

---

## Scope Boundary Verification

不可触碰的文件和路径（本计划不产生任何写入）：
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- make-decision 主壳调度逻辑（仅改引用路径，不重构）
- `debate` skill（保持现状）

---

## Complexity Tracking

No constitution violations requiring justification.

---

## F10 Anti-Over-Engineering Gate

以下为计划中每个新机制/检查/基建的 F10 四问评估。

### 机制 1：tests/moat-skills.test.mjs——文件存在性断言

1. **防御的真实威胁**：M13 已出现假绿问题——skill 文件不存在但测试通过（因为只断言主 skill 文本内容，不断言独立文件存在）。
2. **已有机制是否覆盖**：现有测试不断言 `skills/` 目录下独立 skill 文件存在性。无已有覆盖。
3. **是否可绕过（安全剧场）**：文件存在性 grep 是硬断言，文件不存在时 `stat`/`existsSync` 必返回失败，不可绕过。
4. **长期维护成本**：极低。文件路径固定，新增 skill 时补一行断言即可，无动态注册机制。

**判定：保留**（防真实已发生的假绿，成本极低，不可绕过）。

### 机制 2：tests/moat-skills.test.mjs——frontmatter 合规断言

1. **防御的真实威胁**：搬运 skill 文件可能遗漏 frontmatter，导致 workflowhub skill 发现机制无法识别该 skill。
2. **已有机制是否覆盖**：无现有 frontmatter 校验断言。
3. **是否可绕过**：frontmatter 格式固定（`^name:`），grep 硬断言，不可绕过。
4. **长期维护成本**：极低。仅检查 `name` 字段存在，无 schema 解析器依赖。

**判定：保留**（防搬运遗漏，成本极低）。

### 机制 3：tests/moat-skills.test.mjs——宿主依赖扫描断言

1. **防御的真实威胁**：adapter 改写可能遗漏宿主路径（/Users/、~/.claude、gbrain 等），导致 skill 在其他环境不可用。RISK-01/RISK-02 已明确记录该风险。
2. **已有机制是否覆盖**：无现有宿主路径扫描断言。
3. **是否可绕过**：grep 精确字符串匹配，路径残留必被命中，不可绕过。
4. **长期维护成本**：低。扫描目标列表（4 个宿主标记）稳定，不随业务逻辑变化。

**判定：保留**（防已知 RISK-01/RISK-02，成本低，精确可验证）。

### 机制 4：tests/moat-skills.test.mjs——三角度结构契约断言

1. **防御的真实威胁**：intake-decision-review 若不断言三角度结构，实现可能只检查 findings 数量而不检查类型覆盖，仍导致假绿。M13 假绿根因即在于断言不充分。
2. **已有机制是否覆盖**：无。三角度结构为新引入契约。
3. **是否可绕过**：grep `direction.*framing.*scope` 等是硬文本断言，SKILL.md 中若无对应关键词必报红。
4. **长期维护成本**：极低。三角度（direction/framing/scope）为固定域概念，不随迭代变化。

**判定：保留**（防假绿，契约固定，不可绕过）。

### 机制 5：make-decision TASK_TRACKING_ROOT 环境变量声明

1. **防御的真实威胁**：make-decision 的落盘路径若硬编码，与其他 workflow（build-spec）的路径体系不对齐，导致指标采集碎片化（FR-TRACKING-001/002 来自 M13b 对齐需求）。
2. **已有机制是否覆盖**：build-spec SKILL.md 已有 TASK_TRACKING_ROOT，但 make-decision 尚未声明。两者不对齐是真实问题。
3. **是否可绕过**：环境变量声明为文档级契约，不引入新运行时检查机制，不阻断流程。
4. **长期维护成本**：极低。仅在 Environment Variables 表新增一行，S10 段落新增一句降级逻辑。

**判定：保留**（对齐现有体系，成本极低，非新基建）。

### F10 结论

**无项目因 F10 被移除**。所有 5 个机制均针对已观察到的真实问题（M13 假绿、RISK-01/02、路径体系不对齐），维护成本均低，无一可被轻易绕过，无安全剧场成分。

---

## M10 Baseline Comparison

M10 基线来源：`specs/archive/m10-baseline-switch/baseline-report.md`（4 个历史 agenthub task 平均值）。

| 指标 | M10 基线值 | 本计划（build-plan 阶段） | 状态 |
|---|---|---|---|
| missed_step_rate | 0.05 | unknown — build-plan 自身不采集此指标；上游 make-decision/build-spec 的本任务数据尚未产出，无可用记录 | 待采集 |
| test_execution_rate | 0.8295 | unknown — 同上，本任务测试执行数据在 build-code/verify-code 阶段产出，当前阶段不可得 | 待采集 |
| review_execution_rate | 1.0 | unknown — 本任务 make-decision 阶段已执行异源盲审（R6 pass），但 build-plan 阶段尚未完成 verify-code，stage-result 中 review 字段为 pending，无终态记录 | 待采集 |
| rework_rounds | 6.075 | unknown — rework 轮次需 journal 事件序列推算，当前 build-plan 阶段无 journal 产出；仅上游 make-decision 记录可参考，但 make-decision 本任务的 stage-result 未采集此字段 | 待采集 |
| rework_proxy_count | 25.25 | unknown — 同 rework_rounds，需 journal 推算，当前阶段无数据；spec 自检显示 6 轮审查（R1-R6），但这是 build-spec 阶段数据，不在 build-plan 指标口径内 | 待采集 |

**说明**：build-plan 自身不产出指标原始数据；所有 5 项均 `unknown`，因为本任务当前阶段（build-plan）的指标在 build-code/verify-code 执行后才可采集。仅上游（make-decision、build-spec）已完成阶段的数据可在此比较，但上游 stage-result 中未记录这 5 项指标。non-blocking，记录+浮现供人审查。

---

## Constitution Check

> 21 条全覆盖，[x] = 符合，[ ] = 不符合或需记录，每条附判据。

### 框架原则（F）

- [x] **F1 薄核心** — 本计划所有实质能力（talk/grill/intake-decision-review）均下沉到 `skills/` 独立文件层；`workflows/make-decision/SKILL.md` 只更新引用路径，不增加内联逻辑；核心调度逻辑零改动。符合"重活下沉技能层，核心只做调度"。
- [x] **F2 窄契约** — skill 文件间通过路径引用（`skills/talk-with-zhipeng/`、`skills/grill-with-docs/`、`skills/intake-decision-review/`）交互，接口为文件路径字符串，不暴露内部实现细节。intake-decision-review 的输出契约（3 条 findings，标注类型）为窄而明确的接口定义。
- [x] **F3 物理事实靠机器校验但不阻断** — tests/moat-skills.test.mjs 的所有断言（文件存在、frontmatter、引用路径、宿主路径扫描）均为机器可客观采集的物理事实；constitution check 和 baseline 比较均为记录+浮现，不阻断推进；F10 gate 为记录型，不阻断 stage-result。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — spec 阶段已完成 6 轮 codex 异源盲审（R6 pass，direction_divergence=false）；build-plan 设 review checkpoint（Step 8），非交互环境下 pending 不阻断；无阻断式质量门。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — F10 gate 评估保留了 5 个测试机制，均针对已观察的真实问题（M13 假绿、RISK-01/02）；未预先堆砌任何假设性关卡；F10 无项被移除说明当前机制刚好必要。
- [x] **F6 统一外置执行记录** — TASK_TRACKING_ROOT 声明（Step 2.2）将 make-decision 落盘路径纳入与 build-spec 一致的统一记录体系；tracking_root_fallback 事件可回溯；stage-result 统一写入 `specs/m13a-moat-skills/`。
- [x] **F7 推进与不可逆操作不自动越过人** — build-plan Step 8 设置人工审查检查点；intake-decision-review 的 fallback_used=true 停止报错而非静默继续；findings 不足时要求重跑而非自动编造，均为"不自动越过人"的体现。
- [x] **F8 简单优先** — 本计划选择直接搬运 + adapter 改写（不自研），是最简单路径（D1-D4）；make-decision 只改引用路径不重构主壳（D5）；tests 用 grep 文本断言而非引入 AST 解析器或 mock 框架，依赖最少。
- [x] **F9 可证伪不假绿** — FR-TEST-004 的五类负例断言均设计为"实际为假时真报红"；文件存在性断言在文件被删后必报红（AC-20 验证）；宿主路径扫描在有残留时必报红；三角度断言在缺角度时必报红。杜绝 M13 假绿是本 milestone 核心目标。
- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — F10 gate 已逐一评估每个机制（见上方 F10 记录）；所有保留项均针对已发生真实问题；无 CI pipeline、schema validator、动态注册器等超额基建；tests 文件纯文本 grep，维护成本极低。

### 质量原则（Q）

- [x] **Q1 记事实而非阻断** — M10 baseline 5 项全部标记 `unknown + 原因`，不用占位值；constitution check 结果嵌入 plan.md 供人审查，不阻断 stage-result；cross-artifact-analysis.md 为只读报告，不阻断推进；review checkpoint pending 是有效终态。
- [x] **Q2 gate 三类划分** — 入口校验：spec.md/plan.md/tasks.md 存在性检查（fail-loud）；记录采集：M10 baseline 比较、constitution check、F10 评估（均写入 plan.md，不阻断）；人工确认：Step 8 review checkpoint（interactive 等待，non-interactive 标 pending）。三类清晰，无记录型被做成阻断门。
- [x] **Q3 异源审查加人工把关** — spec 阶段已完成 codex 异源盲审（6 轮，独立上下文，trueCrossEngine）；build-plan Step 8 设人工审查检查点；build-plan 不自审自判（constitution check 为记录型，非自判型质量门）。

### 技能原则（S）

- [x] **S1 能用外部就不造轮子** — talk-with-zhipeng 源自 multica-agenthub 已实现版本搬运（不自研）；grill-with-docs 源自 ~/.claude/skills/grill-with-docs/ 全量搬运（不自研）；intake-decision-review 是对已有 3rd-review 机制的包装，不新建审查引擎。
- [x] **S2 外部技能可针对项目改造合宪** — 搬运的 skill 文件进行 adapter 改写：宿主路径替换为 workflowhub in-repo 路径、删除 gbrain 依赖、frontmatter 格式对齐 workflowhub 规范。改造范围最小化（仅路径/依赖，不改核心逻辑）。
- [x] **S3 迭代时保持最新并就地检查** — 每个 skill 文件的来源路径写入计划（multica-agenthub、~/.claude/skills/grill-with-docs/），便于未来迭代时就地查更新；config/reuse-registry.md 登记来源方便追踪。
- [x] **S4 自定义技能必须有指标系统** — intake-decision-review 为新自定义 skill，其执行结果（findings 3 条、类型覆盖）可由测试断言采集；TASK_TRACKING_ROOT 声明使指标落盘路径统一；宿主路径扫描为可机器验证的合规指标。
- [x] **S5 自定义技能方便子代理调用省主上下文** — 三个 skill 以独立文件形式存在（`skills/{name}/SKILL.md`），可被子代理直接读取调用，不需要主上下文持有内联逻辑；make-decision 只保留路径引用，主上下文负担最小。
- [x] **S6 自定义技能参考市面方案不闭门造车** — talk-with-zhipeng 参考 multica-agenthub 已实现按影响排序方案；grill-with-docs 参考 ~/.claude 已有 grill 协议；intake-decision-review 基于 codex 异源盲审实践（3rd-review 机制），不闭门造车。
- [x] **S7 一阶段一技能一工作流一文件夹** — 新建 skill 均遵循 `skills/{name}/` 目录约定：talk-with-zhipeng/、grill-with-docs/、intake-decision-review/ 各自独立文件夹；make-decision 阶段对应 `workflows/make-decision/` 单一文件夹；核心零改动。
- [x] **S8 自定义技能可独立调用可搬运** — 三个 skill 文件内不含宿主绝对路径（FR-MOAT-003 / AC-07/08 断言兜底）；frontmatter 合规（AC-06）；路径全部为 in-repo 相对路径，可在任意 workflowhub 环境直接调用，不绑死本机环境。

### 机制 4：.mcp.json——muyu-search-mcp 声明

1. **防御的真实威胁**：muyu-search-mcp 当前仅存在于用户级 Claude 配置，换环境即不可用；RISK-06 已记录该风险。
2. **已有机制是否覆盖**：无现有 `.mcp.json` 声明，无 in-repo MCP 配置。
3. **是否可绕过**：AC-29 通过 stat `.mcp.json` 确认文件存在，AC-30 通过 grep 确认 `muyu-search-mcp` 条目；两者均为硬断言，不可绕过。
4. **长期维护成本**：极低。JSON 配置文件，command/args 稳定，env 引用无秘密泄漏风险。

**判定：保留**（防真实已记录的环境可移植问题，成本极低）。

### 机制 5：skills/anysearch/——anysearch 内置化

1. **防御的真实威胁**：anysearch 当前仅在用户级 `~/.claude/skills/`，换环境不可用；S3 路径 B 调用会静默失败（RISK-07 相关）。
2. **已有机制是否覆盖**：无现有 in-repo anysearch skill 文件，无现有断言。
3. **是否可绕过**：frontmatter `^name:` grep 硬断言；绝对路径扫描 `/Users/\|/home/` 硬匹配，不可绕过。
4. **长期维护成本**：极低。文件搬运 + adapter 改写，无动态注册器依赖。

**判定：保留**（防真实可移植问题，成本极低，与 talk/grill 同模式）。

**Constitution Check 汇总**：21/21 条已评估，21 条 [x]，0 条 [ ]。Phase 4 新增两个机制（.mcp.json、anysearch）均符合 F8（最简路径）、F9（可证伪）、F10（有真实防御对象，成本极低）。

