# Code Review: build-code Phase 1 — m13-make-decision-v1

**Reviewer**: independent code-reviewer agent (separate context)
**Date**: 2026-06-29
**Verdict**: REVISE_REQUIRED
**Blocking items**: 2

---

## Scope

Changed files under review:
- `workflows/make-decision/SKILL.md` (version bump + env-var table + recordSkeleton前置步骤)
- `reuse-registry.md` (debate 外部 skill 条目)
- `tests/m13-make-decision.test.mjs` (22 条结构断言，untracked 新文件)

---

## Dimension 1 — FR 合规

### FR-ENV-01/02: 6 个 env var 齐全、有默认值、有 override 说明

SKILL.md `## Environment Variables` 表列出以下 6 个变量：

| # | 变量名 | 默认值 | override 说明 |
|---|---|---|---|
| 1 | MAKE_DECISION_DEBATE_PATH | `~/.claude/skills/debate/SKILL.md` | export 示例 |
| 2 | MAKE_DECISION_SKIP_DEBATE | `false` | export 示例 |
| 3 | MAKE_DECISION_SKIP_BLIND_REVIEW | `false` | export 示例 |
| 4 | THIRD_REVIEW_RUNNER | `agent` | export 示例 |
| 5 | REVIEW_DISPATCH_CONFIG | `{}` | export 示例 |
| 6 | CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS | `false` | export 示例 |

6 个均有默认值和 override 说明。**FR-ENV-01/02 通过。**

但注意：表头在实际落盘的 SKILL.md 中存在格式问题（第 11 行 `| 变量名 | 默认值 说明 | 方式 |` — 列头合并/缺失），导致表格为 3 列而内容为 4 列，Markdown 渲染会错位。这是 **LOW** 严重度的格式问题，不阻断 FR 合规性判定。

### FR-DEBATE-03: reuse-registry debate 条目含路径变量/默认/降级

`reuse-registry.md` 第 20 行追加的 `debate` 条目包含：
- `MAKE_DECISION_DEBATE_PATH` 路径变量 — 已包含
- 默认路径 `~/.claude/skills/debate/SKILL.md` — 已包含
- 降级行为说明（路径不可达时 skipped，记录 `debate_path_unavailable: true`，不阻断主流程）— 已包含

**然而**，spec FR-DEBATE-03 验收标准（spec.md 第 202 行）明确要求：

> `reuse-registry.md` 中存在 debate 条目，含 skill 名称和来源路径 `/Users/Hugh/Hugh/Project/debate`。

实际条目的来源路径是 `~/.claude/skills/debate/SKILL.md`（运行时由 env var 决定），**不含** spec 要求的固定路径 `/Users/Hugh/Hugh/Project/debate`。

**BLOCKING-1** (MEDIUM 严重度，HIGH 置信度): `reuse-registry.md` 中 debate 条目的来源路径与 spec FR-DEBATE-03 验收标准不符。spec 要求固定路径 `/Users/Hugh/Hugh/Project/debate`；实际写入的是变量化路径描述，缺少 spec 要求的具体路径值。需要在 reuse-registry 条目里补充 `/Users/Hugh/Hugh/Project/debate` 作为当前已知实体路径，或者与 spec owner 确认验收标准是否允许用 env-var 描述替代。

### FR-METRIC-01: recordSkeleton 列全 M4 十核心字段

新增的 `## Metrics — Stage Start` 块（SKILL.md 第 18-43 行）列出的 10 个字段：
`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`

与 SKILL.md 第 115 行引用列表完全吻合。**FR-METRIC-01 字段覆盖通过。**

**但发现不一致**（BLOCKING-2）：新增的 recordSkeleton 代码示例（第 31 行）写入 `skill_version: "2.0.0"`，而 SKILL.md 原有的 "Produce stage-result" 部分的 JSON 示例（第 105 行）仍然写 `"skill_version": "1.0.0"`。两处版本号不一致，执行 skill 时若以下游那段模板为参考，会落错版本号到 metrics。

**BLOCKING-2** (HIGH 严重度，HIGH 置信度): `workflows/make-decision/SKILL.md:105` 中 stage-result JSON 示例的 `skill_version` 字段值仍为 `"1.0.0"`，与 frontmatter 及 recordSkeleton 示例中的 `"2.0.0"` 不一致。这会导致执行方使用旧版本号落盘 metrics 记录，数据追踪错误。修复：将第 105 行 `"skill_version": "1.0.0"` 改为 `"skill_version": "2.0.0"`。

---

## Dimension 2 — 宪法合规

### 薄核心、窄契约 (F1/F2)

新增 env var 表和 recordSkeleton 前置步骤均在 `workflows/make-decision/SKILL.md` 内部，未改动核心调度层。**通过。**

### 记录态非阻断 (非阻断门原则)

env var 表明确说明：路径不可达时"自动降级跳过 debate（skipped），记录 `debate_path_unavailable: true`"，明确是记录而非阻断。`MAKE_DECISION_SKIP_BLIND_REVIEW`、`MAKE_DECISION_SKIP_DEBATE` 均走跳过+记录路径。无硬拦截逻辑。**通过。**

### 不引阻断门 (F10/宪法)

env var 不在 `config/workflowhub.yaml` 中注册（SKILL.md 第 9 行明确说明），且 grep 验证 config/workflowhub.yaml 中确无这 6 个变量。**通过。**

---

## Dimension 3 — 测试质量（22 条断言）

文件状态：`tests/m13-make-decision.test.mjs` 是未追踪的新文件（git status: `??`），未含在 git diff 中但已存在于工作目录。

### 语法问题（LOW/HIGH）

测试文件存在多处明显语法错误，导致文件无法被 vitest 解析执行（即当前所有 22 条断言实际上无法 RED 也无法 GREEN）：
- 第 4 行：`import { test, describe } "vitest"` — 缺 `from`
- 第 5 行：`import "node:assert/strict"` — 缺 `assert as assert` 或命名导入
- 第 6-7 行：`import { readFileSync, existsSync } "node:fs"`, `import { join } "node:path"` — 缺 `from`
- 第 19-22 行：`readRegistry()` 函数缺 `{` 开括号
- 第 25、26 行：`describe("...", () {` — 箭头函数缺 `=>`（多处重复）
- 多处变量声明缺 `const`/`let`（如第 27 行 `content readSkill()`）
- 第 172 行：`missing M4_FIELDS.filter(...)` — 缺 `const missing =`

这些语法错误意味着**测试在当前状态下无法运行**，不满足"实现缺失时能 RED"的要求。

### 断言质量（排除语法问题后逻辑评估）

排除语法错误，从逻辑层面评估：
- T002(a)：frontmatter 存在性检查 — 非空洞，有实际语义
- T002(b)：6 个 env var 名称逐一 `content.includes(envVar)` — 非空洞，能检测缺失
- T002(c)：`config/workflowhub.yaml` NOT 含特定 env var — 存在 `if (!existsSync) return` 的跳过逻辑，当 yaml 文件不存在时断言自动通过而不验证任何东西（vacuous pass）。这是一个弱点但非严重问题，因为 spec 的约束方向是"不要加"，缺文件本身即合规。
- T002(d)：recordSkeleton 存在 + 10 个 M4 字段 — 非空洞，且已正确覆盖所有字段名
- T003：debate 在 reuse-registry 中、含 MAKE_DECISION_DEBATE_PATH、含默认路径 — 非空洞

**严重问题**：语法错误导致测试文件完全不可执行，违背 TDD 红绿周期的基础要求。

**BLOCKING-3** (HIGH 严重度，HIGH 置信度): `tests/m13-make-decision.test.mjs` 存在多处 ES module import 语法缺失 `from` 关键字、箭头函数缺 `=>`、变量声明缺 `const` 等错误，导致文件无法被 Node.js/vitest 解析。当前 22 条断言全部无法运行，TDD RED 阶段无效。需要修复所有语法错误后重新验证断言在实现缺失时确实 RED。

---

## Dimension 4 — 越界检查

`git diff HEAD --name-only` 输出仅含：
- `CLAUDE.md`
- `reuse-registry.md`
- `workflows/make-decision/SKILL.md`

下游阶段文件（`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`）未被修改。`config/workflowhub.yaml` 未被修改。**无越界，通过。**

---

## Blocking 清单

| # | 严重度 | 置信度 | 文件:行 | 问题 | 修复方向 |
|---|---|---|---|---|---|
| BLOCKING-1 | MEDIUM | HIGH | `reuse-registry.md:20` | debate 条目来源路径未含 spec FR-DEBATE-03 要求的 `/Users/Hugh/Hugh/Project/debate` | 补充具体路径，或与 spec owner 确认是否允许 env-var 描述替代固定路径 |
| BLOCKING-2 | HIGH | HIGH | `workflows/make-decision/SKILL.md:105` | stage-result JSON 示例中 `skill_version: "1.0.0"` 与 frontmatter v2.0.0 不一致 | 将第 105 行改为 `"skill_version": "2.0.0"` |
| BLOCKING-3 | HIGH | HIGH | `tests/m13-make-decision.test.mjs` 全文 | 多处 ES module 语法错误（缺 `from`、缺 `=>`、缺 `const`），文件无法被 vitest 解析执行 | 修复所有语法错误并验证 `npm run test -- tests/m13-make-decision.test.mjs` 能正常 RED |

---

## 非 Blocking 问题

| 严重度 | 置信度 | 文件:行 | 问题 |
|---|---|---|---|
| LOW | HIGH | `workflows/make-decision/SKILL.md:11` | Markdown 表头列数（3列）与内容列数（4列）不符，渲染错位 |
| LOW | MEDIUM | `tests/m13-make-decision.test.mjs:110-116` | T002(c) 的 `if (!existsSync(YAML_CONFIG_PATH)) return` 导致 yaml 不存在时断言 vacuous pass，弱化了"不注册"验证 |

---

## 正面观察

- env var 表设计完整，6 个变量均有安全默认值、降级路径说明和 override 示例，符合宪法"记录态非阻断"原则。
- reuse-registry 条目结构好于现有其他条目，首次明确写出路径变量名、默认值和降级行为。
- T002(d) 的 10 个 M4 字段逐一列出检查，覆盖完整、非空洞。
- SKILL.md `## Metrics — Stage Start` 前置步骤的设计位置正确（在所有 S0 步骤之前），符合 FR-METRIC-01 的"最前置"要求。
- config/workflowhub.yaml 和下游阶段文件均未被触碰，边界清晰。

---

## 裁决

**REVISE_REQUIRED**

3 个 blocking 项，均为 HIGH 置信度。其中 BLOCKING-2 和 BLOCKING-3 为 HIGH 严重度，BLOCKING-1 为 MEDIUM 严重度但直接关联 spec FR-DEBATE-03 验收标准。

修复优先级：BLOCKING-3 > BLOCKING-2 > BLOCKING-1。
