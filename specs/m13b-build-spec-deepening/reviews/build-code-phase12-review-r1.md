# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-30T08:36:51.827Z

## Original task

Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
index 26dcf6a..2f81a26 100644
--- a/tests/five-skills-present.test.mjs
+++ b/tests/five-skills-present.test.mjs
@@ -239,6 +239,18 @@ describe("build-code SKILL.md contains slim path / stage-result / make-decision
       "build-code/SKILL.md must make tasks.md conditional on build-plan being the upstream (D12 slim path)"
     );
   });
+
+  test("build-code consumes facts.tasks_ref as tasks.md path on full path", () => {
+    const content = readFileSync(skillPath, "utf8");
+    assert.ok(
+      content.includes("facts.tasks_ref") && content.includes("path to `tasks.md`"),
+      "build-code/SKILL.md must read facts.tasks_ref as the tasks.md path"
+    );
+    assert.ok(
+      content.includes("facts.tasks") && content.includes("do **not** treat it as a file path"),
+      "build-code/SKILL.md must preserve facts.tasks as summary/count, not a path"
+    );
+  });
 });
 
 // scope-triage and decision-log existence/frontmatter now covered by
diff --git a/workflows/build-code/SKILL.md b/workflows/build-code/SKILL.md
index 7207332..fb35f95 100644
--- a/workflows/build-code/SKILL.md
+++ b/workflows/build-code/SKILL.md
@@ -17,7 +17,7 @@ Each phase follows a strict RED → implement → GREEN cycle. No phase is done
 
 Read the `stage-result` produced by the previous stage and extract the relevant `facts`:
 
-- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list.
+- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks_ref` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list. `facts.tasks` is the M6 summary/count field; do **not** treat it as a file path.
 - If upstream is **`make-decision`** (slim path): read `facts.decision` (the decision text) and `facts.scope` (the bounded change area). `tasks.md` and `plan.md` do not exist on the slim path; derive implementation work directly from these two keys.
 
 The full path exposes a richer fact surface; the slim path is intentionally leaner. Adapt accordingly and never assume a key exists — check before reading.
diff --git a/workflows/build-spec/SKILL.md b/workflows/build-spec/SKILL.md
index 4066450..34be3d6 100644
--- a/workflows/build-spec/SKILL.md
+++ b/workflows/build-spec/SKILL.md
@@ -1,5 +1,6 @@
 ---
 name: build-spec
+version: 2.0.0
 description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
 ---
 
@@ -9,6 +10,69 @@ description: Turn the agreed direction into a structured spec that is the single
 
 Translate the decision log from `make-decision` into a full spec via an orchestrated pipeline. The spec becomes the sole authority that later stages (plan, code, verify) refer to.
 
+## 全局参数与产出约定
+
+### 环境变量与参数约定（FR-TRACKING-001/002，FR-TASKDIR-001）
+
+#### TASK_TRACKING_ROOT
+
+全局环境变量 `TASK_TRACKING_ROOT` 约定所有阶段跟踪文件的存储根目录：
+
+- **默认值**：`~/Knowledge/workflowhub/`（若变量未设置则使用此默认路径）
+- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
+- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
+- **禁止绕过（FR-TRACKING-002）**：所有 stage（包括 spec-specify、spec-clarify 等）必须通过 `TASK_TRACKING_ROOT` 获取跟踪文件路径，禁止硬编码绝对跟踪路径
+
+#### --task-dir 参数约定（FR-TASKDIR-001）
+
+`--task-dir` 控制本次运行的任务目录，所有输入/产物路径均基于它推导：
+
+- **路径推导**：`{task-dir}/decision-log.md` 为输入；`specs/{task-id}/` 为产物目录
+- **参数缺失时**：回退到 `tasks/{task-id}/` 默认路径并记录 warn（不依赖 cwd 猜测）
+- **严禁 cwd 猜测**：路径推导不得依赖当前工作目录
+
+---
+
+### Spec 三层结构要求（FR-STRUCTURE-001/002）
+
+build-spec 产出的 spec.md 必须按以下三层结构组织：
+
+- **层 1 — 速读卡**（文件顶部 30 行内）：一句话需求 + 核心改动，让读者 30 秒看懂
+- **层 2 — 正文**：问题陈述 / 背景 / FR / AC / 影响范围
+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
+
+**Known Gaps 段（FR-STRUCTURE-002）**：spec.md 中 Known Gaps 段必须存在（可为空列表），记录本次有意留白、未覆盖或留待后续的事项。
+
+---
+
+### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING-001）
+
+build-spec 产出的所有功能需求必须使用 `FR-{DOMAIN}-NNN` 格式：
+
+- **DOMAIN**：大写领域缩写（BUILD/CONTRACT/LADDER/STRUCTURE/SELFCHECK/REVIEW/BEHAV/FRICTION/TASKDIR/TRACKING/NUMBERING/ACCOUNT/ARTIFACT/COMM/SCOPETRIAGE/ALIGN）
+- **NNN**：3 位数字（001 起）
+- **示例**：`FR-BUILD-001`，`FR-SELFCHECK-002`
+
+---
+
+### AC 计数与 spec-acceptance-count.json 产出（FR-ACCOUNT-001）
+
+build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：
+
+```json
+{
+  "ac_count": <int>,
+  "fr_count": <int>,
+  "counted_at": "<ISO8601 string>"
+}
+```
+
+- 三字段（`ac_count`、`fr_count`、`counted_at`）不可为 null
+- `counted_at` 为产出时刻 ISO8601 时间戳
+- 计数方法：grep spec.md 统计 AC- 和 FR- 条目数
+
+---
+
 ## What to do
 
 ### 0. Pre-read: decision-log
@@ -19,6 +83,22 @@ Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output.
 
 At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block. Output: verdict (pass/revise_required/escalate_to_human) + blocking findings if any.

## Final prompt

Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
index 26dcf6a..2f81a26 100644
--- a/tests/five-skills-present.test.mjs
+++ b/tests/five-skills-present.test.mjs
@@ -239,6 +239,18 @@ describe("build-code SKILL.md contains slim path / stage-result / make-decision
       "build-code/SKILL.md must make tasks.md conditional on build-plan being the upstream (D12 slim path)"
     );
   });
+
+  test("build-code consumes facts.tasks_ref as tasks.md path on full path", () => {
+    const content = readFileSync(skillPath, "utf8");
+    assert.ok(
+      content.includes("facts.tasks_ref") && content.includes("path to `tasks.md`"),
+      "build-code/SKILL.md must read facts.tasks_ref as the tasks.md path"
+    );
+    assert.ok(
+      content.includes("facts.tasks") && content.includes("do **not** treat it as a file path"),
+      "build-code/SKILL.md must preserve facts.tasks as summary/count, not a path"
+    );
+  });
 });
 
 // scope-triage and decision-log existence/frontmatter now covered by
diff --git a/workflows/build-code/SKILL.md b/workflows/build-code/SKILL.md
index 7207332..fb35f95 100644
--- a/workflows/build-code/SKILL.md
+++ b/workflows/build-code/SKILL.md
@@ -17,7 +17,7 @@ Each phase follows a strict RED → implement → GREEN cycle. No phase is done
 
 Read the `stage-result` produced by the previous stage and extract the relevant `facts`:
 
-- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list.
+- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks_ref` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list. `facts.tasks` is the M6 summary/count field; do **not** treat it as a file path.
 - If upstream is **`make-decision`** (slim path): read `facts.decision` (the decision text) and `facts.scope` (the bounded change area). `tasks.md` and `plan.md` do not exist on the slim path; derive implementation work directly from these two keys.
 
 The full path exposes a richer fact surface; the slim path is intentionally leaner. Adapt accordingly and never assume a key exists — check before reading.
diff --git a/workflows/build-spec/SKILL.md b/workflows/build-spec/SKILL.md
index 4066450..34be3d6 100644
--- a/workflows/build-spec/SKILL.md
+++ b/workflows/build-spec/SKILL.md
@@ -1,5 +1,6 @@
 ---
 name: build-spec
+version: 2.0.0
 description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
 ---
 
@@ -9,6 +10,69 @@ description: Turn the agreed direction into a structured spec that is the single
 
 Translate the decision log from `make-decision` into a full spec via an orchestrated pipeline. The spec becomes the sole authority that later stages (plan, code, verify) refer to.
 
+## 全局参数与产出约定
+
+### 环境变量与参数约定（FR-TRACKING-001/002，FR-TASKDIR-001）
+
+#### TASK_TRACKING_ROOT
+
+全局环境变量 `TASK_TRACKING_ROOT` 约定所有阶段跟踪文件的存储根目录：
+
+- **默认值**：`~/Knowledge/workflowhub/`（若变量未设置则使用此默认路径）
+- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
+- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
+- **禁止绕过（FR-TRACKING-002）**：所有 stage（包括 spec-specify、spec-clarify 等）必须通过 `TASK_TRACKING_ROOT` 获取跟踪文件路径，禁止硬编码绝对跟踪路径
+
+#### --task-dir 参数约定（FR-TASKDIR-001）
+
+`--task-dir` 控制本次运行的任务目录，所有输入/产物路径均基于它推导：
+
+- **路径推导**：`{task-dir}/decision-log.md` 为输入；`specs/{task-id}/` 为产物目录
+- **参数缺失时**：回退到 `tasks/{task-id}/` 默认路径并记录 warn（不依赖 cwd 猜测）
+- **严禁 cwd 猜测**：路径推导不得依赖当前工作目录
+
+---
+
+### Spec 三层结构要求（FR-STRUCTURE-001/002）
+
+build-spec 产出的 spec.md 必须按以下三层结构组织：
+
+- **层 1 — 速读卡**（文件顶部 30 行内）：一句话需求 + 核心改动，让读者 30 秒看懂
+- **层 2 — 正文**：问题陈述 / 背景 / FR / AC / 影响范围
+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
+
+**Known Gaps 段（FR-STRUCTURE-002）**：spec.md 中 Known Gaps 段必须存在（可为空列表），记录本次有意留白、未覆盖或留待后续的事项。
+
+---
+
+### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING-001）
+
+build-spec 产出的所有功能需求必须使用 `FR-{DOMAIN}-NNN` 格式：
+
+- **DOMAIN**：大写领域缩写（BUILD/CONTRACT/LADDER/STRUCTURE/SELFCHECK/REVIEW/BEHAV/FRICTION/TASKDIR/TRACKING/NUMBERING/ACCOUNT/ARTIFACT/COMM/SCOPETRIAGE/ALIGN）
+- **NNN**：3 位数字（001 起）
+- **示例**：`FR-BUILD-001`，`FR-SELFCHECK-002`
+
+---
+
+### AC 计数与 spec-acceptance-count.json 产出（FR-ACCOUNT-001）
+
+build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：
+
+```json
+{
+  "ac_count": <int>,
+  "fr_count": <int>,
+  "counted_at": "<ISO8601 string>"
+}
+```
+
+- 三字段（`ac_count`、`fr_count`、`counted_at`）不可为 null
+- `counted_at` 为产出时刻 ISO8601 时间戳
+- 计数方法：grep spec.md 统计 AC- 和 FR- 条目数
+
+---
+
 ## What to do
 
 ### 0. Pre-read: decision-log
@@ -19,6 +83,22 @@ Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output.
 
 At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block. Output: verdict (pass/revise_required/escalate_to_human) + blocking findings if any.

## Raw output

```text
**Findings**

1. 严重：[CLAUDE.md](/Users/Hugh/Hugh/Project/workflowhub/CLAUDE.md:31) 被注入了 Multica runtime 本地上下文，应从本次 diff 移除。  
   这块从 `BEGIN MULTICA-RUNTIME` 开始，包含 agent 身份、执行协议、发 comment 指令、issue UUID、个人邮箱、local path 等运行时信息。比如 [CLAUDE.md:48](/Users/Hugh/Hugh/Project/workflowhub/CLAUDE.md:48) 有具体 agent ID，[CLAUDE.md:88](/Users/Hugh/Hugh/Project/workflowhub/CLAUDE.md:88) 有发起人邮箱，[CLAUDE.md:154](/Users/Hugh/Hugh/Project/workflowhub/CLAUDE.md:154) 开始写死 issue/comment 命令。  
   这不是 m13b Phase 1+2 的交付内容，会污染所有未来 agent 的 repo 级指令，也有隐私/误触发风险。建议整段回退，只保留原项目 CLAUDE.md 内容。

2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
   新增 ladder F10 在 [workflows/build-spec/SKILL.md:94](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:94) 写了“不作为阻断条件”，但旧的 Section 6 仍写成硬 gate：[workflows/build-spec/SKILL.md:263](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:263) 标题就是 `F10 anti-over-engineering gate`，[workflows/build-spec/SKILL.md:267](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:267) 要求“四问答不全就 remove”，[workflows/build-spec/SKILL.md:274](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:274) 又要求某些答案直接 remove mechanism。  
   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。

3. 中等：`--task-dir` 规则声明了，但实际 Pre-read 仍写死旧路径。  
   新规则在 [workflows/build-spec/SKILL.md:26](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:26) 到 [workflows/build-spec/SKILL.md:32](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:32) 说输入应从 `{task-dir}/decision-log.md` 推导，缺参才回退 `tasks/{task-id}/`。但执行步骤 [workflows/build-spec/SKILL.md:80](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:80) 仍直接写 `Read tasks/{task-id}/decision-log.md`。  
   这会导致显式传 `--task-dir` 时仍读错文件。建议把 Step 0 改成：先解析 `--task-dir`，读 `{task-dir}/decision-log.md`；仅缺参时 warn 并回退 `tasks/{task-id}/decision-log.md`。

4. 中等：frontmatter 版本和 metrics 示例版本不一致。  
   [workflows/build-spec/SKILL.md:3](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:3) 已是 `version: 2.0.0`，但 metrics 示例仍写 [workflows/build-spec/SKILL.md:317](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:317) 的 `"skill_version": "1.0.0"`。  
   下游执行者照抄示例会把 M13b 深化版记录成旧版本，影响回溯。建议改成 `2.0.0`，或写成“从 frontmatter version 读取”。

5. 中等：`spec-acceptance-count.json` 的计数口径不够稳，且当前 artifact 与你给的 24 FR / 20 AC 上下文不一致。  
   当前文件 [spec-acceptance-count.json](/Users/Hugh/Hugh/Project/workflowhub/specs/m13b-build-spec-deepening/spec-acceptance-count.json:1) 是 `{"ac_count":22,"fr_count":24,...}`，不是 20 AC。实际 `spec.md` 里 AC 定义行也是 22 条。  
   另外 [workflows/build-spec/SKILL.md:72](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:72) 写“grep spec.md 统计 AC- 和 FR- 条目数”，但裸 grep 会把引用也算进去：我本地查到 FR 引用总数 59、唯一 FR 24、FR 定义行 24；AC 引用总数 34、AC 定义行 22。建议明确计数规则：只统计定义行，例如 `^\\*\\*FR-[A-Z]+-[0-9]{3}\\*\\*` 和 `^- \\[ \\] \\*\\*AC-[0-9]{2}\\*\\*`，不要统计所有引用。

6. 中等：M13b 的核心验收测试目前不在 tracked diff 里。  
   `npm test -- --run tests/m13b-build-spec-deepening.test.mjs tests/five-skills-present.test.mjs` 通过了 114 个测试，但 `tests/m13b-build-spec-deepening.test.mjs` 当前是 untracked。也就是说，如果只落当前 tracked diff，Phase 1+2 的 55 个 m13b grep/JSON 验收不会随提交进入仓库。建议确认这个测试文件是否要纳入本次提交。

**通过项**

- FR 编号格式一致：`workflows/build-spec/SKILL.md` 里唯一 FR ID 为 24 个，均匹配 `FR-[A-Z]+-[0-9]{3}`，未发现坏格式。
- 质量事实契约 5 项齐全：[workflows/build-spec/SKILL.md:158](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:158) 到 [workflows/build-spec/SKILL.md:168](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 包含 scope 边界、自检结果、独立审查摘要、未解风险、handoff required_reads，并声明记录+浮现语义。
- `facts.tasks_ref` 修正确认是对的：`build-plan` 产出里 [workflows/build-plan/SKILL.md:192](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-plan/SKILL.md:192) 保留 `facts.tasks` 为摘要/计数，[workflows/build-plan/SKILL.md:193](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-plan/SKILL.md:193) 新增 `tasks_ref` 指向 `tasks.md`；`build-code` 现在在 [workflows/build-code/SKILL.md:20](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/SKILL.md:20) 读取 `facts.tasks_ref` 并明确不要把 `facts.tasks` 当路径。
- `build-code` 新测试覆盖了这个语义：[tests/five-skills-present.test.mjs:243](/Users/Hugh/Hugh/Project/workflowhub/tests/five-skills-present.test.mjs:243) 到 [tests/five-skills-present.test.mjs:252](/Users/Hugh/Hugh/Project/workflowhub/tests/five-skills-present.test.mjs:252)。

**验证**

- `git diff --check -- workflows/build-spec/SKILL.md workflows/build-code/SKILL.md tests/five-skills-present.test.mjs tests/m13b-build-spec-deepening.test.mjs`：通过。
- `npm test -- --run tests/m13b-build-spec-deepening.test.mjs tests/five-skills-present.test.mjs`：通过，2 个文件，114 个测试。  
- 但测试通过依赖 untracked 的 `tests/m13b-build-spec-deepening.test.mjs`，落地前需要处理。


2026-06-30T08:33:09.992429Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:33:09.992492Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:33:09.992494Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-30T08:33:09.992496Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:33:09.992497Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:33:09.992499Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:33:09.992500Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:33:09.992501Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:33:09.992503Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:33:09.992504Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T08:33:09.992505Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-30T08:33:09.992506Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: high
reasoning summaries: none
session id: 019f17a9-243c-7611-9218-1958aabb22aa
--------
user
Review Phase 1+2 git diff for m13b-build-spec-deepening build-code. Context: deepening build-spec SKILL.md with 24 FR/20 AC. Phase 1: added global param sections (TASK_TRACKING_ROOT env var with ~/Knowledge/workflowhub/ default + warn-not-stop; --task-dir convention; FR-{DOMAIN}-NNN numbering format; spec-acceptance-count.json with ac_count/fr_count/counted_at). Phase 2: added spec-ladder A/B/C tiers + F10 4-question anti-over-engineering; scope-triage high-risk word surfacing (non-blocking); 7-item self-check + Spec-Purity grep (non-blocking); heterologous 3rd-review section (non-blocking, degraded mode allowed); quality contract 5-item output (scope boundary / self-check result / review summary / unresolved risks / handoff required_reads). Also fixed build-code SKILL.md: facts.tasks_ref = path to tasks.md, facts.tasks = M6 summary/count (previously conflated). Review criteria: (1) all quality checks non-blocking (constitution F4/F5), (2) FR-{DOMAIN}-NNN format consistent, (3) quality contract 5 items complete, (4) facts.tasks_ref fix correct, (5) any downstream misuse risk. Diff excerpt: diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
index 26dcf6a..2f81a26 100644
--- a/tests/five-skills-present.test.mjs
+++ b/tests/five-skills-present.test.mjs
@@ -239,6 +239,18 @@ describe("build-code SKILL.md contains slim path / stage-result / make-decision
       "build-code/SKILL.md must make tasks.md conditional on build-plan being the upstream (D12 slim path)"
     );
   });
+
+  test("build-code consumes facts.tasks_ref as tasks.md path on full path", () => {
+    const content = readFileSync(skillPath, "utf8");
+    assert.ok(
+      content.includes("facts.tasks_ref") && content.includes("path to `tasks.md`"),
+      "build-code/SKILL.md must read facts.tasks_ref as the tasks.md path"
+    );
+    assert.ok(
+      content.includes("facts.tasks") && content.includes("do **not** treat it as a file path"),
+      "build-code/SKILL.md must preserve facts.tasks as summary/count, not a path"
+    );
+  });
 });
 
 // scope-triage and decision-log existence/frontmatter now covered by
diff --git a/workflows/build-code/SKILL.md b/workflows/build-code/SKILL.md
index 7207332..fb35f95 100644
--- a/workflows/build-code/SKILL.md
+++ b/workflows/build-code/SKILL.md
@@ -17,7 +17,7 @@ Each phase follows a strict RED → implement → GREEN cycle. No phase is done
 
 Read the `stage-result` produced by the previous stage and extract the relevant `facts`:
 
-- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list.
+- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks_ref` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list. `facts.tasks` is the M6 summary/count field; do **not** treat it as a file path.
 - If upstream is **`make-decision`** (slim path): read `facts.decision` (the decision text) and `facts.scope` (the bounded change area). `tasks.md` and `plan.md` do not exist on the slim path; derive implementation work directly from these two keys.
 
 The full path exposes a richer fact surface; the slim path is intentionally leaner. Adapt accordingly and never assume a key exists — check before reading.
diff --git a/workflows/build-spec/SKILL.md b/workflows/build-spec/SKILL.md
index 4066450..34be3d6 100644
--- a/workflows/build-spec/SKILL.md
+++ b/workflows/build-spec/SKILL.md
@@ -1,5 +1,6 @@
 ---
 name: build-spec
+version: 2.0.0
 description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
 ---
 
@@ -9,6 +10,69 @@ description: Turn the agreed direction into a structured spec that is the single
 
 Translate the decision log from `make-decision` into a full spec via an orchestrated pipeline. The spec becomes the sole authority that later stages (plan, code, verify) refer to.
 
+## 全局参数与产出约定
+
+### 环境变量与参数约定（FR-TRACKING-001/002，FR-TASKDIR-001）
+
+#### TASK_TRACKING_ROOT
+
+全局环境变量 `TASK_TRACKING_ROOT` 约定所有阶段跟踪文件的存储根目录：
+
+- **默认值**：`~/Knowledge/workflowhub/`（若变量未设置则使用此默认路径）
+- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
+- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
+- **禁止绕过（FR-TRACKING-002）**：所有 stage（包括 spec-specify、spec-clarify 等）必须通过 `TASK_TRACKING_ROOT` 获取跟踪文件路径，禁止硬编码绝对跟踪路径
+
+#### --task-dir 参数约定（FR-TASKDIR-001）
+
+`--task-dir` 控制本次运行的任务目录，所有输入/产物路径均基于它推导：
+
+- **路径推导**：`{task-dir}/decision-log.md` 为输入；`specs/{task-id}/` 为产物目录
+- **参数缺失时**：回退到 `tasks/{task-id}/` 默认路径并记录 warn（不依赖 cwd 猜测）
+- **严禁 cwd 猜测**：路径推导不得依赖当前工作目录
+
+---
+
+### Spec 三层结构要求（FR-STRUCTURE-001/002）
+
+build-spec 产出的 spec.md 必须按以下三层结构组织：
+
+- **层 1 — 速读卡**（文件顶部 30 行内）：一句话需求 + 核心改动，让读者 30 秒看懂
+- **层 2 — 正文**：问题陈述 / 背景 / FR / AC / 影响范围
+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
+
+**Known Gaps 段（FR-STRUCTURE-002）**：spec.md 中 Known Gaps 段必须存在（可为空列表），记录本次有意留白、未覆盖或留待后续的事项。
+
+---
+
+### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING-001）
+
+build-spec 产出的所有功能需求必须使用 `FR-{DOMAIN}-NNN` 格式：
+
+- **DOMAIN**：大写领域缩写（BUILD/CONTRACT/LADDER/STRUCTURE/SELFCHECK/REVIEW/BEHAV/FRICTION/TASKDIR/TRACKING/NUMBERING/ACCOUNT/ARTIFACT/COMM/SCOPETRIAGE/ALIGN）
+- **NNN**：3 位数字（001 起）
+- **示例**：`FR-BUILD-001`，`FR-SELFCHECK-002`
+
+---
+
+### AC 计数与 spec-acceptance-count.json 产出（FR-ACCOUNT-001）
+
+build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：
+
+```json
+{
+  "ac_count": <int>,
+  "fr_count": <int>,
+  "counted_at": "<ISO8601 string>"
+}
+```
+
+- 三字段（`ac_count`、`fr_count`、`counted_at`）不可为 null
+- `counted_at` 为产出时刻 ISO8601 时间戳
+- 计数方法：grep spec.md 统计 AC- 和 FR- 条目数
+
+---
+
 ## What to do
 
 ### 0. Pre-read: decision-log
@@ -19,6 +83,22 @@ Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output.
 
 At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block. Output: verdict (pass/revise_required/escalate_to_human) + blocking findings if any.
2026-06-30T08:33:10.927325Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
我会按代码审查来做：先看完整 diff 和相关 SKILL.md，再核对你列的 5 条标准，最后只报明确问题和残余风险。
exec
/bin/bash -lc "sed -n '1,220p' /Users/Hugh/.claude/skills/gstack/review/SKILL.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
---
name: review
preamble-tier: 4
version: 1.0.0
description: Pre-landing PR review. (gstack)
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Agent
  - AskUserQuestion
  - WebSearch
triggers:
  - review this pr
  - code review
  - check my diff
  - pre-landing review
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->


## When to invoke this skill

Analyzes diff against the base branch for SQL safety, LLM trust
boundary violations, conditional side effects, and other structural issues. Use when
asked to "review this PR", "code review", "pre-landing review", or "check my diff".
Proactively suggest when the user is about to merge or land code changes.

## Preamble (run first)

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || .claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.gstack/sessions
touch ~/.gstack/sessions/"$PPID"
_SESSIONS=$(find ~/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.gstack/sessions -mmin +120 -type f -exec rm {} + 2>/dev/null || true
_PROACTIVE=$(~/.claude/skills/gstack/bin/gstack-config get proactive 2>/dev/null || echo "true")
_PROACTIVE_PROMPTED=$([ -f ~/.gstack/.proactive-prompted ] && echo "yes" || echo "no")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
_SKILL_PREFIX=$(~/.claude/skills/gstack/bin/gstack-config get skill_prefix 2>/dev/null || echo "false")
echo "PROACTIVE: $_PROACTIVE"
echo "PROACTIVE_PROMPTED: $_PROACTIVE_PROMPTED"
echo "SKILL_PREFIX: $_SKILL_PREFIX"
source <(~/.claude/skills/gstack/bin/gstack-repo-mode 2>/dev/null) || true
REPO_MODE=${REPO_MODE:-unknown}
echo "REPO_MODE: $REPO_MODE"
_SESSION_KIND=$(~/.claude/skills/gstack/bin/gstack-session-kind 2>/dev/null || echo "interactive")
case "$_SESSION_KIND" in spawned|headless|interactive) ;; *) _SESSION_KIND="interactive" ;; esac
echo "SESSION_KIND: $_SESSION_KIND"
_LAKE_SEEN=$([ -f ~/.gstack/.completeness-intro-seen ] && echo "yes" || echo "no")
echo "LAKE_INTRO: $_LAKE_SEEN"
_TEL=$(~/.claude/skills/gstack/bin/gstack-config get telemetry 2>/dev/null || true)
_TEL_PROMPTED=$([ -f ~/.gstack/.telemetry-prompted ] && echo "yes" || echo "no")
_TEL_START=$(date +%s)
_SESSION_ID="$$-$(date +%s)"
echo "TELEMETRY: ${_TEL:-off}"
echo "TEL_PROMPTED: $_TEL_PROMPTED"
_EXPLAIN_LEVEL=$(~/.claude/skills/gstack/bin/gstack-config get explain_level 2>/dev/null || echo "default")
if [ "$_EXPLAIN_LEVEL" != "default" ] && [ "$_EXPLAIN_LEVEL" != "terse" ]; then _EXPLAIN_LEVEL="default"; fi
echo "EXPLAIN_LEVEL: $_EXPLAIN_LEVEL"
_QUESTION_TUNING=$(~/.claude/skills/gstack/bin/gstack-config get question_tuning 2>/dev/null || echo "false")
echo "QUESTION_TUNING: $_QUESTION_TUNING"
mkdir -p ~/.gstack/analytics
if [ "$_TEL" != "off" ]; then
echo '{"skill":"review","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(_repo=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null | tr -cd 'a-zA-Z0-9._-'); echo "${_repo:-unknown}")'"}'  >> ~/.gstack/analytics/skill-usage.jsonl 2>/dev/null || true
fi
for _PF in $(find ~/.gstack/analytics -maxdepth 1 -name '.pending-*' 2>/dev/null); do
  if [ -f "$_PF" ]; then
    if [ "$_TEL" != "off" ] && [ -x "~/.claude/skills/gstack/bin/gstack-telemetry-log" ]; then
      ~/.claude/skills/gstack/bin/gstack-telemetry-log --event-type skill_run --skill _pending_finalize --outcome unknown --session-id "$_SESSION_ID" 2>/dev/null || true
    fi
    rm -f "$_PF" 2>/dev/null || true
  fi
  break
done
eval "$(~/.claude/skills/gstack/bin/gstack-slug 2>/dev/null)" 2>/dev/null || true
_LEARN_FILE="${GSTACK_HOME:-$HOME/.gstack}/projects/${SLUG:-unknown}/learnings.jsonl"
if [ -f "$_LEARN_FILE" ]; then
  _LEARN_COUNT=$(wc -l < "$_LEARN_FILE" 2>/dev/null | tr -d ' ')
  echo "LEARNINGS: $_LEARN_COUNT entries loaded"
  if [ "$_LEARN_COUNT" -gt 5 ] 2>/dev/null; then
    ~/.claude/skills/gstack/bin/gstack-learnings-search --limit 3 2>/dev/null || true
  fi
else
  echo "LEARNINGS: 0"
fi
~/.claude/skills/gstack/bin/gstack-timeline-log '{"skill":"review","event":"started","branch":"'"$_BRANCH"'","session":"'"$_SESSION_ID"'"}' 2>/dev/null &
_HAS_ROUTING="no"
if [ -f CLAUDE.md ] && grep -q "## Skill routing" CLAUDE.md 2>/dev/null; then
  _HAS_ROUTING="yes"
fi
_ROUTING_DECLINED=$(~/.claude/skills/gstack/bin/gstack-config get routing_declined 2>/dev/null || echo "false")
echo "HAS_ROUTING: $_HAS_ROUTING"
echo "ROUTING_DECLINED: $_ROUTING_DECLINED"
_VENDORED="no"
if [ -d ".claude/skills/gstack" ] && [ ! -L ".claude/skills/gstack" ]; then
  if [ -f ".claude/skills/gstack/VERSION" ] || [ -d ".claude/skills/gstack/.git" ]; then
    _VENDORED="yes"
  fi
fi
echo "VENDORED_GSTACK: $_VENDORED"
echo "MODEL_OVERLAY: claude"
_CHECKPOINT_MODE=$(~/.claude/skills/gstack/bin/gstack-config get checkpoint_mode 2>/dev/null || echo "explicit")
_CHECKPOINT_PUSH=$(~/.claude/skills/gstack/bin/gstack-config get checkpoint_push 2>/dev/null || echo "false")
echo "CHECKPOINT_MODE: $_CHECKPOINT_MODE"
echo "CHECKPOINT_PUSH: $_CHECKPOINT_PUSH"
# Plan-mode hint for skills like /spec that branch behavior on plan-mode state.
# Claude Code exposes plan mode via system reminders; we detect best-effort
# from CLAUDE_PLAN_FILE (set by the harness when plan mode is active) and
# fall back to "inactive". Codex hosts and Claude execution mode both end up
# inactive, which is the safe default (defaults to file+execute pipeline).
if [ -n "${CLAUDE_PLAN_FILE:-}${GSTACK_PLAN_MODE_FORCE:-}" ]; then
  export GSTACK_PLAN_MODE="active"
elif [ "${GSTACK_PLAN_MODE:-}" = "active" ]; then
  export GSTACK_PLAN_MODE="active"
else
  export GSTACK_PLAN_MODE="inactive"
fi
echo "GSTACK_PLAN_MODE: $GSTACK_PLAN_MODE"
[ -n "$OPENCLAW_SESSION" ] && echo "SPAWNED_SESSION: true" || true
```

## Plan Mode Safe Operations

In plan mode, allowed because they inform the plan: `$B`, `$D`, `codex exec`/`codex review`, writes to `~/.gstack/`, writes to the plan file, and `open` for generated artifacts.

## Skill Invocation During Plan Mode

If the user invokes a skill in plan mode, the skill takes precedence over generic plan mode behavior. **Treat the skill file as executable instructions, not reference.** Follow it step by step starting from Step 0; the first AskUserQuestion is the workflow entering plan mode, not a violation of it. AskUserQuestion (any variant — `mcp__*__AskUserQuestion` or native; see "AskUserQuestion Format → Tool resolution") satisfies plan mode's end-of-turn requirement. If AskUserQuestion is unavailable or a call fails, follow the AskUserQuestion Format failure fallback: `headless` → BLOCKED; `interactive` → the prose fallback (also satisfies end-of-turn). At a STOP point, stop immediately. Do not continue the workflow or call ExitPlanMode there. Commands marked "PLAN MODE EXCEPTION — ALWAYS RUN" execute. Call ExitPlanMode only after the skill workflow completes, or if the user tells you to cancel the skill or leave plan mode.

If `PROACTIVE` is `"false"`, do not auto-invoke or proactively suggest skills. If a skill seems useful, ask: "I think /skillname might help here — want me to run it?"

If `SKILL_PREFIX` is `"true"`, suggest/invoke `/gstack-*` names. Disk paths stay `~/.claude/skills/gstack/[skill-name]/SKILL.md`.

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `~/.claude/skills/gstack/gstack-upgrade/SKILL.md` and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise AskUserQuestion with 4 options, write snooze state if declined).

If output shows `JUST_UPGRADED <from> <to>`: print "Running gstack v{to} (just updated!)". If `SPAWNED_SESSION` is true, skip feature discovery.

Feature discovery, max one prompt per session:
- Missing `~/.claude/skills/gstack/.feature-prompted-continuous-checkpoint`: AskUserQuestion for Continuous checkpoint auto-commits. If accepted, run `~/.claude/skills/gstack/bin/gstack-config set checkpoint_mode continuous`. Always touch marker.
- Missing `~/.claude/skills/gstack/.feature-prompted-model-overlay`: inform "Model overlays are active. MODEL_OVERLAY shows the patch." Always touch marker.

After upgrade prompts, continue workflow.

If `WRITING_STYLE_PENDING` is `yes`: ask once about writing style:

> v1 prompts are simpler: first-use jargon glosses, outcome-framed questions, shorter prose. Keep default or restore terse?

Options:
- A) Keep the new default (recommended — good writing helps everyone)
- B) Restore V0 prose — set `explain_level: terse`

If A: leave `explain_level` unset (defaults to `default`).
If B: run `~/.claude/skills/gstack/bin/gstack-config set explain_level terse`.

Always run (regardless of choice):
```bash
rm -f ~/.gstack/.writing-style-prompt-pending
touch ~/.gstack/.writing-style-prompted
```

Skip if `WRITING_STYLE_PENDING` is `no`.

If `LAKE_INTRO` is `no`: say "gstack follows the **Boil the Ocean** principle — do the complete thing when AI makes marginal cost near-zero. Read more: https://garryslist.org/posts/boil-the-ocean" Offer to open:

```bash
open https://garryslist.org/posts/boil-the-ocean
touch ~/.gstack/.completeness-intro-seen
```

Only run `open` if yes. Always run `touch`.

If `TEL_PROMPTED` is `no` AND `LAKE_INTRO` is `yes`: ask telemetry once via AskUserQuestion:

> Help gstack get better. Share usage data only: skill, duration, crashes, stable device ID. No code or file paths. Your repo name is recorded locally only and stripped before any upload.

Options:
- A) Help gstack get better! (recommended)
- B) No thanks

If A: run `~/.claude/skills/gstack/bin/gstack-config set telemetry community`

If B: ask follow-up:

> Anonymous mode sends only aggregate usage, no unique ID.

Options:
- A) Sure, anonymous is fine
- B) No thanks, fully off

If B→A: run `~/.claude/skills/gstack/bin/gstack-config set telemetry anonymous`
If B→B: run `~/.claude/skills/gstack/bin/gstack-config set telemetry off`

Always run:
```bash
touch ~/.gstack/.telemetry-prompted
```

Skip if `TEL_PROMPTED` is `yes`.

If `PROACTIVE_PROMPTED` is `no` AND `TEL_PROMPTED` is `yes`: ask once:

> Let gstack proactively suggest skills, like /qa for "does this work?" or /investigate for bugs?

Options:
- A) Keep it on (recommended)
- B) Turn it off — I'll type /commands myself

If A: run `~/.claude/skills/gstack/bin/gstack-config set proactive true`
If B: run `~/.claude/skills/gstack/bin/gstack-config set proactive false`

Always run:
```bash
touch ~/.gstack/.proactive-prompted

exec
/bin/bash -lc 'git status --short' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
 M CLAUDE.md
 M tests/five-skills-present.test.mjs
 M workflows/build-code/SKILL.md
 M workflows/build-spec/SKILL.md
?? .agent_context/
?? .agents/
?? .claude/
?? .investigation/
?? .multica/
?? .specify/
?? global
?? "global flat metrics store (M4, FR-COLLECT-006/"
?? specs/m12-build-plan-v1/
?? specs/m13-make-decision-v1/reviews/codex-final/
?? specs/m13-make-decision-v1/reviews/codex-r2/
?? specs/m13-make-decision-v1/reviews/codex-r3-real/
?? specs/m13-make-decision-v1/reviews/codex-r3/
?? specs/m13-make-decision-v1/reviews/codex/
?? specs/m13b-build-spec-deepening/
?? task-metrics.jsonl
?? tasks/agenthub-extraction-program/
?? tasks/m11-build-spec-v1/
?? tasks/m12-build-plan-v1/
?? tasks/m13b-build-spec-deepening/
?? tasks/multica-cost-review/
?? tests/m13b-build-spec-deepening.test.mjs

exec
/bin/bash -lc 'git diff -- workflows/build-spec/SKILL.md workflows/build-code/SKILL.md tests/five-skills-present.test.mjs' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
diff --git a/tests/five-skills-present.test.mjs b/tests/five-skills-present.test.mjs
index 26dcf6a..2f81a26 100644
--- a/tests/five-skills-present.test.mjs
+++ b/tests/five-skills-present.test.mjs
@@ -239,6 +239,18 @@ describe("build-code SKILL.md contains slim path / stage-result / make-decision
       "build-code/SKILL.md must make tasks.md conditional on build-plan being the upstream (D12 slim path)"
     );
   });
+
+  test("build-code consumes facts.tasks_ref as tasks.md path on full path", () => {
+    const content = readFileSync(skillPath, "utf8");
+    assert.ok(
+      content.includes("facts.tasks_ref") && content.includes("path to `tasks.md`"),
+      "build-code/SKILL.md must read facts.tasks_ref as the tasks.md path"
+    );
+    assert.ok(
+      content.includes("facts.tasks") && content.includes("do **not** treat it as a file path"),
+      "build-code/SKILL.md must preserve facts.tasks as summary/count, not a path"
+    );
+  });
 });
 
 // scope-triage and decision-log existence/frontmatter now covered by
diff --git a/workflows/build-code/SKILL.md b/workflows/build-code/SKILL.md
index 7207332..fb35f95 100644
--- a/workflows/build-code/SKILL.md
+++ b/workflows/build-code/SKILL.md
@@ -17,7 +17,7 @@ Each phase follows a strict RED → implement → GREEN cycle. No phase is done
 
 Read the `stage-result` produced by the previous stage and extract the relevant `facts`:
 
-- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list.
+- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks_ref` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list. `facts.tasks` is the M6 summary/count field; do **not** treat it as a file path.
 - If upstream is **`make-decision`** (slim path): read `facts.decision` (the decision text) and `facts.scope` (the bounded change area). `tasks.md` and `plan.md` do not exist on the slim path; derive implementation work directly from these two keys.
 
 The full path exposes a richer fact surface; the slim path is intentionally leaner. Adapt accordingly and never assume a key exists — check before reading.
diff --git a/workflows/build-spec/SKILL.md b/workflows/build-spec/SKILL.md
index 4066450..34be3d6 100644
--- a/workflows/build-spec/SKILL.md
+++ b/workflows/build-spec/SKILL.md
@@ -1,5 +1,6 @@
 ---
 name: build-spec
+version: 2.0.0
 description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
 ---
 
@@ -9,6 +10,69 @@ description: Turn the agreed direction into a structured spec that is the single
 
 Translate the decision log from `make-decision` into a full spec via an orchestrated pipeline. The spec becomes the sole authority that later stages (plan, code, verify) refer to.
 
+## 全局参数与产出约定
+
+### 环境变量与参数约定（FR-TRACKING-001/002，FR-TASKDIR-001）
+
+#### TASK_TRACKING_ROOT
+
+全局环境变量 `TASK_TRACKING_ROOT` 约定所有阶段跟踪文件的存储根目录：
+
+- **默认值**：`~/Knowledge/workflowhub/`（若变量未设置则使用此默认路径）
+- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
+- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
+- **禁止绕过（FR-TRACKING-002）**：所有 stage（包括 spec-specify、spec-clarify 等）必须通过 `TASK_TRACKING_ROOT` 获取跟踪文件路径，禁止硬编码绝对跟踪路径
+
+#### --task-dir 参数约定（FR-TASKDIR-001）
+
+`--task-dir` 控制本次运行的任务目录，所有输入/产物路径均基于它推导：
+
+- **路径推导**：`{task-dir}/decision-log.md` 为输入；`specs/{task-id}/` 为产物目录
+- **参数缺失时**：回退到 `tasks/{task-id}/` 默认路径并记录 warn（不依赖 cwd 猜测）
+- **严禁 cwd 猜测**：路径推导不得依赖当前工作目录
+
+---
+
+### Spec 三层结构要求（FR-STRUCTURE-001/002）
+
+build-spec 产出的 spec.md 必须按以下三层结构组织：
+
+- **层 1 — 速读卡**（文件顶部 30 行内）：一句话需求 + 核心改动，让读者 30 秒看懂
+- **层 2 — 正文**：问题陈述 / 背景 / FR / AC / 影响范围
+- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
+
+**Known Gaps 段（FR-STRUCTURE-002）**：spec.md 中 Known Gaps 段必须存在（可为空列表），记录本次有意留白、未覆盖或留待后续的事项。
+
+---
+
+### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING-001）
+
+build-spec 产出的所有功能需求必须使用 `FR-{DOMAIN}-NNN` 格式：
+
+- **DOMAIN**：大写领域缩写（BUILD/CONTRACT/LADDER/STRUCTURE/SELFCHECK/REVIEW/BEHAV/FRICTION/TASKDIR/TRACKING/NUMBERING/ACCOUNT/ARTIFACT/COMM/SCOPETRIAGE/ALIGN）
+- **NNN**：3 位数字（001 起）
+- **示例**：`FR-BUILD-001`，`FR-SELFCHECK-002`
+
+---
+
+### AC 计数与 spec-acceptance-count.json 产出（FR-ACCOUNT-001）
+
+build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：
+
+```json
+{
+  "ac_count": <int>,
+  "fr_count": <int>,
+  "counted_at": "<ISO8601 string>"
+}
+```
+
+- 三字段（`ac_count`、`fr_count`、`counted_at`）不可为 null
+- `counted_at` 为产出时刻 ISO8601 时间戳
+- 计数方法：grep spec.md 统计 AC- 和 FR- 条目数
+
+---
+
 ## What to do
 
 ### 0. Pre-read: decision-log
@@ -19,6 +83,22 @@ Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output.
 
 At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
 
+### 1.5. spec-ladder 档位判断（FR-LADDER-001/002）
+
+在调用 spec-specify 前，基于 decision-log 描述的功能复杂度做档位判断，输出档位选择依据记入 spec 序言：
+
+- **A 档**（小改动）：单文件或配置调整，影响面窄；速读卡足够，正文后三章可豁免
+- **B 档**（中等）：跨模块改动或新增机制；需完整三层 spec
+- **C 档**（大改动）：跨系统边界、新引入外部依赖或破坏性变更；完整三层 spec + 额外影响范围分析
+
+F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
+1. What real threat does this defend against?
+2. Does any existing mechanism already cover it?
+3. Can it be bypassed, making it security-theatre?
+4. What is the long-term maintenance cost?
+
+---
+
 ### 2. spec-specify: first-draft spec
 
 Invoke `skills/spec-specify/SKILL.md` (spec-specify):
@@ -35,6 +115,93 @@ Invoke `skills/spec-clarify/SKILL.md` (spec-clarify):
 - **Expected behaviour**: 10-dimension ambiguity scan, up to 5 interactive clarification questions (one at a time), incremental spec updates after each accepted answer, and a coverage summary at completion.
 - If spec-clarify reports the spec file is not found, stop — run spec-specify first.
 
+### 3.5. scope-triage 高危词浮现（FR-SCOPETRIAGE-001）
+
+spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
+
+**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
+
+命中时：
+- 浮现命中位置 + 建议修改（供人工确认是文档示例还是执行语义）
+- 记录进质量事实契约第 4 项（未解风险）
+- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
+
+---
+
+### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
+
+spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
+
+1. spec-ladder 档位已声明且有依据
+2. 所有 FR 使用 `FR-{DOMAIN}-NNN` 格式
+3. 每个 FR 至少有一条 Given/When/Then 场景
+4. 五章硬门完整（速读卡 / FR / 不做 / 验收 / 影响范围）——A 档可豁免后三章
+5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
+6. 无 `[NEEDS CLARIFICATION]` 残留（或全部标明已解决/延后理由）
+7. Known Gaps 段存在
+
+**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
+
+---
+
+### 3.7. 异源 3rd-review 独立审查（FR-REVIEW-001/002）
+
+spec 初稿完成后，调用异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），在独立上下文产出 verdict + findings：
+
+- 结论记入质量事实契约第 3 项（独立审查摘要路径）
+- 审查失败/不可用时降级记录 unknown + 原因，不阻断
+- **禁止自审自判（FR-REVIEW-002）**：不得使用单一 AI 切换视角替代异源独立审查
+- 可 grep 到 `3rd-review` 或 `异源独立审查`
+
+---
+
+### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
+
+完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
+
+1. **scope 边界**：本次 spec 的 IN/OUT scope 及裁剪机制列表
+2. **自检结果**：7 条自检 + Spec-Purity grep 的 pass/warn/unknown 汇总
+3. **独立审查摘要**：异源 3rd-review 的 verdict + findings 摘要路径
+4. **未解风险**：已知缺口、摩擦记录（`[FRICTION]` 格式，见下节）、scope-triage 高危词命中、spec↔decision-log 差异
+5. **handoff required_reads**：下游阶段必读文件清单
+
+**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
+
+---
+
+### 3.9. 交互规范（FR-COMM-001/002）
+
+build-spec 产出过程中必须遵守以下交互规范：
+
+**REQ-COMM-01（FR-COMM-001）**：对编排者的所有提问或选项，必须使用大白话说明选项后果，不让编排者猜。格式：列出选项 A/B/C + 每个选项的后果一句话。禁止含糊带过选项差异。
+
+**REQ-COMM-02（FR-COMM-002）**：每完成主要步骤后，主动汇报进度：做了什么 / 下一步是什么 / 需要编排者做什么。不等对方追问。
+
+---
+
+### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
+
+#### [FRICTION] 摩擦捕获（FR-FRICTION-001）
+
+发现任何流程卡点时，立即记录 `[FRICTION]` 条目：
+
+```
+[FRICTION] <触发时机简述>: <卡点描述> | 建议: <可选>
+```
+
+条目写入质量事实契约第 4 项（未解风险），不阻断推进。
+
+#### Artifact-First 只传路径（FR-ARTIFACT-001）
+
+长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。
+
+#### FR 场景行为验证（FR-BEHAV-001/002）
+
+- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
+- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
+
+---
+
 ### 4. Constitution compliance check
 
 Read `constitution-checklist.md`. Check all 21 items (F1–F10, Q1–Q3, S1–S8) against the spec produced so far. For every item write `[x]` (compliant) or `[ ]` (non-compliant) with a concrete rationale sentence. No item may be left unmarked or without a rationale — all 21 must be present.

codex
已读取到完整相关 diff：build-spec 主要是文档流程增强，build-code 是一行事实字段修正，测试只覆盖了 build-code 的字段语义。接下来我会核对实际文件行号和 downstream 的字段生产/消费口径。
codex
我不会动文件，只做审查。现在重点看两类风险：文档里是否把“质量检查”写成了硬门，以及 `facts.tasks` 改名后有没有其他消费方仍按旧语义读。
exec
/bin/bash -lc "nl -ba workflows/build-spec/SKILL.md | sed -n '1,230p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	---
     2	name: build-spec
     3	version: 2.0.0
     4	description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
     5	---
     6	
     7	# build-spec
     8	
     9	## Goal
    10	
    11	Translate the decision log from `make-decision` into a full spec via an orchestrated pipeline. The spec becomes the sole authority that later stages (plan, code, verify) refer to.
    12	
    13	## 全局参数与产出约定
    14	
    15	### 环境变量与参数约定（FR-TRACKING-001/002，FR-TASKDIR-001）
    16	
    17	#### TASK_TRACKING_ROOT
    18	
    19	全局环境变量 `TASK_TRACKING_ROOT` 约定所有阶段跟踪文件的存储根目录：
    20	
    21	- **默认值**：`~/Knowledge/workflowhub/`（若变量未设置则使用此默认路径）
    22	- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
    23	- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
    24	- **禁止绕过（FR-TRACKING-002）**：所有 stage（包括 spec-specify、spec-clarify 等）必须通过 `TASK_TRACKING_ROOT` 获取跟踪文件路径，禁止硬编码绝对跟踪路径
    25	
    26	#### --task-dir 参数约定（FR-TASKDIR-001）
    27	
    28	`--task-dir` 控制本次运行的任务目录，所有输入/产物路径均基于它推导：
    29	
    30	- **路径推导**：`{task-dir}/decision-log.md` 为输入；`specs/{task-id}/` 为产物目录
    31	- **参数缺失时**：回退到 `tasks/{task-id}/` 默认路径并记录 warn（不依赖 cwd 猜测）
    32	- **严禁 cwd 猜测**：路径推导不得依赖当前工作目录
    33	
    34	---
    35	
    36	### Spec 三层结构要求（FR-STRUCTURE-001/002）
    37	
    38	build-spec 产出的 spec.md 必须按以下三层结构组织：
    39	
    40	- **层 1 — 速读卡**（文件顶部 30 行内）：一句话需求 + 核心改动，让读者 30 秒看懂
    41	- **层 2 — 正文**：问题陈述 / 背景 / FR / AC / 影响范围
    42	- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策
    43	
    44	**Known Gaps 段（FR-STRUCTURE-002）**：spec.md 中 Known Gaps 段必须存在（可为空列表），记录本次有意留白、未覆盖或留待后续的事项。
    45	
    46	---
    47	
    48	### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING-001）
    49	
    50	build-spec 产出的所有功能需求必须使用 `FR-{DOMAIN}-NNN` 格式：
    51	
    52	- **DOMAIN**：大写领域缩写（BUILD/CONTRACT/LADDER/STRUCTURE/SELFCHECK/REVIEW/BEHAV/FRICTION/TASKDIR/TRACKING/NUMBERING/ACCOUNT/ARTIFACT/COMM/SCOPETRIAGE/ALIGN）
    53	- **NNN**：3 位数字（001 起）
    54	- **示例**：`FR-BUILD-001`，`FR-SELFCHECK-002`
    55	
    56	---
    57	
    58	### AC 计数与 spec-acceptance-count.json 产出（FR-ACCOUNT-001）
    59	
    60	build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：
    61	
    62	```json
    63	{
    64	  "ac_count": <int>,
    65	  "fr_count": <int>,
    66	  "counted_at": "<ISO8601 string>"
    67	}
    68	```
    69	
    70	- 三字段（`ac_count`、`fr_count`、`counted_at`）不可为 null
    71	- `counted_at` 为产出时刻 ISO8601 时间戳
    72	- 计数方法：grep spec.md 统计 AC- 和 FR- 条目数
    73	
    74	---
    75	
    76	## What to do
    77	
    78	### 0. Pre-read: decision-log
    79	
    80	Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output. Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.
    81	
    82	### 1. Metrics: stage start
    83	
    84	At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
    85	
    86	### 1.5. spec-ladder 档位判断（FR-LADDER-001/002）
    87	
    88	在调用 spec-specify 前，基于 decision-log 描述的功能复杂度做档位判断，输出档位选择依据记入 spec 序言：
    89	
    90	- **A 档**（小改动）：单文件或配置调整，影响面窄；速读卡足够，正文后三章可豁免
    91	- **B 档**（中等）：跨模块改动或新增机制；需完整三层 spec
    92	- **C 档**（大改动）：跨系统边界、新引入外部依赖或破坏性变更；完整三层 spec + 额外影响范围分析
    93	
    94	F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
    95	1. What real threat does this defend against?
    96	2. Does any existing mechanism already cover it?
    97	3. Can it be bypassed, making it security-theatre?
    98	4. What is the long-term maintenance cost?
    99	
   100	---
   101	
   102	### 2. spec-specify: first-draft spec
   103	
   104	Invoke `skills/spec-specify/SKILL.md` (spec-specify):
   105	
   106	- **Input**: task-id (from the current stage context) and the functional description text extracted from the decision-log.
   107	- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
   108	- If spec-specify reports failure or the output files are missing, stop and surface the error — do not proceed to spec-clarify.
   109	
   110	### 3. spec-clarify: ambiguity scan and interactive refinement
   111	
   112	Invoke `skills/spec-clarify/SKILL.md` (spec-clarify):
   113	
   114	- **Input**: task-id (or the explicit spec path `specs/{task-id}/spec.md`).
   115	- **Expected behaviour**: 10-dimension ambiguity scan, up to 5 interactive clarification questions (one at a time), incremental spec updates after each accepted answer, and a coverage summary at completion.
   116	- If spec-clarify reports the spec file is not found, stop — run spec-specify first.
   117	
   118	### 3.5. scope-triage 高危词浮现（FR-SCOPETRIAGE-001）
   119	
   120	spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
   121	
   122	**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
   123	
   124	命中时：
   125	- 浮现命中位置 + 建议修改（供人工确认是文档示例还是执行语义）
   126	- 记录进质量事实契约第 4 项（未解风险）
   127	- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
   128	
   129	---
   130	
   131	### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
   132	
   133	spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：
   134	
   135	1. spec-ladder 档位已声明且有依据
   136	2. 所有 FR 使用 `FR-{DOMAIN}-NNN` 格式
   137	3. 每个 FR 至少有一条 Given/When/Then 场景
   138	4. 五章硬门完整（速读卡 / FR / 不做 / 验收 / 影响范围）——A 档可豁免后三章
   139	5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
   140	6. 无 `[NEEDS CLARIFICATION]` 残留（或全部标明已解决/延后理由）
   141	7. Known Gaps 段存在
   142	
   143	**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
   144	
   145	---
   146	
   147	### 3.7. 异源 3rd-review 独立审查（FR-REVIEW-001/002）
   148	
   149	spec 初稿完成后，调用异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），在独立上下文产出 verdict + findings：
   150	
   151	- 结论记入质量事实契约第 3 项（独立审查摘要路径）
   152	- 审查失败/不可用时降级记录 unknown + 原因，不阻断
   153	- **禁止自审自判（FR-REVIEW-002）**：不得使用单一 AI 切换视角替代异源独立审查
   154	- 可 grep 到 `3rd-review` 或 `异源独立审查`
   155	
   156	---
   157	
   158	### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
   159	
   160	完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：
   161	
   162	1. **scope 边界**：本次 spec 的 IN/OUT scope 及裁剪机制列表
   163	2. **自检结果**：7 条自检 + Spec-Purity grep 的 pass/warn/unknown 汇总
   164	3. **独立审查摘要**：异源 3rd-review 的 verdict + findings 摘要路径
   165	4. **未解风险**：已知缺口、摩擦记录（`[FRICTION]` 格式，见下节）、scope-triage 高危词命中、spec↔decision-log 差异
   166	5. **handoff required_reads**：下游阶段必读文件清单
   167	
   168	**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
   169	
   170	---
   171	
   172	### 3.9. 交互规范（FR-COMM-001/002）
   173	
   174	build-spec 产出过程中必须遵守以下交互规范：
   175	
   176	**REQ-COMM-01（FR-COMM-001）**：对编排者的所有提问或选项，必须使用大白话说明选项后果，不让编排者猜。格式：列出选项 A/B/C + 每个选项的后果一句话。禁止含糊带过选项差异。
   177	
   178	**REQ-COMM-02（FR-COMM-002）**：每完成主要步骤后，主动汇报进度：做了什么 / 下一步是什么 / 需要编排者做什么。不等对方追问。
   179	
   180	---
   181	
   182	### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
   183	
   184	#### [FRICTION] 摩擦捕获（FR-FRICTION-001）
   185	
   186	发现任何流程卡点时，立即记录 `[FRICTION]` 条目：
   187	
   188	```
   189	[FRICTION] <触发时机简述>: <卡点描述> | 建议: <可选>
   190	```
   191	
   192	条目写入质量事实契约第 4 项（未解风险），不阻断推进。
   193	
   194	#### Artifact-First 只传路径（FR-ARTIFACT-001）
   195	
   196	长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。
   197	
   198	#### FR 场景行为验证（FR-BEHAV-001/002）
   199	
   200	- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
   201	- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
   202	
   203	---
   204	
   205	### 4. Constitution compliance check
   206	
   207	Read `constitution-checklist.md`. Check all 21 items (F1–F10, Q1–Q3, S1–S8) against the spec produced so far. For every item write `[x]` (compliant) or `[ ]` (non-compliant) with a concrete rationale sentence. No item may be left unmarked or without a rationale — all 21 must be present.
   208	
   209	The 21 items are:
   210	
   211	**Framework (F1–F10)**:
   212	- [ ] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。
   213	- [ ] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。
   214	- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
   215	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
   216	- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。
   217	- [ ] **F6 统一外置执行记录** — 判据：进度/指标/回溯是否统一记录、可回溯。
   218	- [ ] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作是否经人边界确认。
   219	- [ ] **F8 简单优先** — 判据：是否选更简单依赖更少的方案、不写掩盖问题的兜底。
   220	- [ ] **F9 可证伪不假绿** — 判据：检查是否在"实际为假"时真报失败、缺数据标未知。
   221	- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。
   222	
   223	**Quality (Q1–Q3)**:
   224	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
   225	- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
   226	- [ ] **Q3 异源审查加人工把关** — 判据：质量裁决是否由独立来源独立上下文产出、无自审自判。
   227	
   228	**Skills (S1–S8)**:
   229	- [ ] **S1 能用外部就不造轮子** — 判据：通用能力是否优先复用外部、文件直放项目内。
   230	- [ ] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。

exec
/bin/bash -lc "nl -ba workflows/build-code/SKILL.md | sed -n '1,80p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	---
     2	name: build-code
     3	description: Implement each task phase by phase using TDD, collecting RED and GREEN evidence for every phase, enforcing diff-only bounds, running 3rd-review on each GREEN, and writing structured facts into the stage-result.
     4	---
     5	
     6	# build-code
     7	
     8	## Goal
     9	
    10	Implement the change described by the upstream stage-result. The upstream may be `build-plan` (full path) or `make-decision` directly (slim path — small tasks that skip design and planning). Read the upstream `stage-result` first and consume its `facts` keys to understand scope and constraints.
    11	
    12	Each phase follows a strict RED → implement → GREEN cycle. No phase is done without both evidence files. After GREEN, a 3rd-review is run and its verdict is recorded in `facts.review`.
    13	
    14	## What to do
    15	
    16	### 1. 前置读取
    17	
    18	Read the `stage-result` produced by the previous stage and extract the relevant `facts`:
    19	
    20	- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks_ref` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list. `facts.tasks` is the M6 summary/count field; do **not** treat it as a file path.
    21	- If upstream is **`make-decision`** (slim path): read `facts.decision` (the decision text) and `facts.scope` (the bounded change area). `tasks.md` and `plan.md` do not exist on the slim path; derive implementation work directly from these two keys.
    22	
    23	The full path exposes a richer fact surface; the slim path is intentionally leaner. Adapt accordingly and never assume a key exists — check before reading.
    24	
    25	### 2. TDD 外部强制
    26	
    27	For each implementation unit (phase), enforce TDD via the external `capture.mjs` harness. Do **not** run test commands directly — always route through `capture.mjs` so evidence is machine-readable and anomaly-detected.
    28	
    29	> **Delegation:** For multi-file or non-trivial phases, dispatch the RED/GREEN capture to a subagent — it runs `capture.mjs` in its own context and returns only the evidence file path + exit code. The orchestrator does not run capture commands in the main context for these. Trivial single-file phases may be run directly.
    30	
    31	Sequence per phase:
    32	
    33	1. **Write tests first** — ensure the test file exists and the assertions describe the intended behavior before any implementation code is written.
    34	2. **Collect RED evidence** — run:
    35	
    36	   ```bash
    37	   node workflows/build-code/capture.mjs <testcmd> <outputPath>
    38	   ```
    39	
    40	   where `<outputPath>` is `specs/{task-id}/evidence/phase-N-RED.json`. The command exits non-zero when tests fail (RED is valid); `capture.mjs` records stdout, exit code, content hash, and anomaly flags.
    41	3. **Implement** the minimum code needed to make the tests pass. Do not add production code unrelated to the failing tests.
    42	4. **Collect GREEN evidence** — run capture.mjs again with `<outputPath>` set to `specs/{task-id}/evidence/phase-N-GREEN.json`.
    43	5. Do not advance to the next phase until the current one has both RED and GREEN evidence files on disk.
    44	
    45	### 3. 假绿检测
    46	
    47	After both RED and GREEN evidence files are written, compare their `content_hash` fields. If `RED.content_hash === GREEN.content_hash`, the test output did not change between runs — this is a suspected false-green.
    48	
    49	Inspect the `anomaly_flags` array in each evidence file for any of:
    50	
    51	- `suspicious_red_exit` — RED exited 0 (tests should have failed)
    52	- `suspicious_green_exit` — GREEN exited non-zero (tests should have passed)
    53	- `green_test_files_empty` — no test files were discovered in the GREEN run
    54	
    55	When any of these conditions hold, surface a **non-blocking warning** to the user. Do not halt the phase; record the warning in the phase notes. A false-green does not automatically invalidate the phase, but must be acknowledged.
    56	
    57	### 4. diff-only 越界检测
    58	
    59	After each phase's implementation, run:
    60	
    61	> **Delegation:** Scanning the diff is a read-heavy action — dispatch it to a subagent (e.g. an explore worker) that runs `diff-scanner.mjs` and returns only the violation list. The orchestrator does not run the scan itself.
    62	
    63	```bash
    64	node workflows/build-code/diff-scanner.mjs scanDiff
    65	```
    66	
    67	This checks the current `git diff` against the C2 bounded-change list defined in `docs/contracts/C2-scope-bounds.md`. The scanner returns a list of violations (files or patterns outside the declared scope).
    68	
    69	**If violations are found: STOP immediately.** Do not auto-proceed. Show the violation type and affected paths to the user and wait for **explicit human confirmation** before continuing. This is enforced by FR-DIFF-002 — no automated bypass is permitted.
    70	
    71	### 5. worktree 路径可配置
    72	
    73	The skill accepts a caller-provided `worktree_root` config key that specifies the absolute path to the implementation worktree. Never hardcode a path. Never resolve upward to the host agenthub repo directory — the worktree is always the provided `worktree_root` and all file operations are scoped to it. This is enforced by FR-WT-001.
    74	
    75	If `worktree_root` is absent from the caller config, fail fast with a clear error rather than guessing.
    76	
    77	### 6. Worker-Mode 子代理
    78	
    79	Use Worker-Mode to spawn an implementer worker for the actual code-writing work. Worker-Mode is an external semver dependency — version-pin it in the skill config and do not inline its logic.
    80	

exec
/bin/bash -lc "rg -n \"facts\\.tasks|tasks_ref|\\btasks\\b.*path to "'`tasks'"\\.md"'`|path to `tasks'"\\.md"'`" . --glob '"'"'!node_modules'"' --glob '"'!global*'"'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
/bin/bash: tasks.md: command not found
/bin/bash: tasks.md: command not found
./scripts/scan-core-files.mjs:17: * @param {string} dir  absolute path to scan
./workflows/_spike/design.mjs:47:  // Unique filename per intake path to avoid collision.
./tests/m12-build-plan-v1.test.mjs:437:// T019(g): M6 contract preserved + v1 adds tasks_ref + analysis_ref
./tests/m12-build-plan-v1.test.mjs:458:  test("facts.tasks preserved (M6)", () => {
./tests/m12-build-plan-v1.test.mjs:462:      "SKILL.md must preserve facts.tasks (M6 field)"
./tests/m12-build-plan-v1.test.mjs:466:  test("v1 adds facts.tasks_ref", () => {
./tests/m12-build-plan-v1.test.mjs:469:      content.includes("tasks_ref"),
./tests/m12-build-plan-v1.test.mjs:470:      "SKILL.md must add facts.tasks_ref (v1 new field)"
./workflows/_spike/intake.mjs:17: * @param {string} inputPath - absolute path to an input JSON file to read
./workflows/verify-code/SKILL.md:87:    "evidence_ref": "<relative path to final-test-report.md>"
./workflows/verify-code/SKILL.md:110:    "evidence_ref": "<relative path to final-test-report.md>"
./specs/m12-build-plan-v1/reviews/build-code-bp-v1-round1.md:37:- **PASS**: status/error_code/retryable/missing_items/user_decision/reason preserved. facts.plan_ref and facts.tasks preserved. facts.tasks_ref and facts.analysis_ref added as NEW (not replace). review object added as NEW. "Do NOT delete or rename any M6 field" directive present (line 207).
./specs/m12-build-plan-v1/reviews/build-code-bp-v1-round1.md:199:- **M6 contract non-regression**: The SKILL.md explicitly documents field preservation (lines 199-207) with a "Do NOT delete or rename" directive. The v1 additions (tasks_ref, analysis_ref, review) are clearly marked as NEW and additive.
./tasks/m12-build-plan-v1/stage-result-build-plan.json:8:    "tasks_ref": "specs/m12-build-plan-v1/tasks.md",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report-round-1.md:8:Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report-round-1.md:12:- [blocking] 问题: facts.tasks bug severity understated — is a current breakage, not an optional change | 建议: build-plan SKILL.md line 192 outputs facts.tasks as a string summary ('number of tasks or brief list of phase titles'), NOT a path. facts.tasks_ref (line 193) is the actual path to tasks.md. build-code SKILL.md line 20 reads facts.tasks as 'path tasks.md' — this is a live read-wrong-field bug. The plan lists this as 'proposed workflowhub change #1' alongside optional enhancements. It must be a blocking prerequisite fix, shipped and verified independently before any Multica wiring. Bundling it as a Multica feature understates severity and risks it being skipped if Multica plan stalls.
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report-round-1.md:19:- [minor] 问题: facts.tasks fix should ship independently, not gated on Multica | 建议: The build-code/build-plan handoff bug (reading wrong facts key) affects every current and future build-code run regardless of Multica. It should be fixed, tested, and committed now. Listing it as a 'proposed workflowhub change' inside the Multica plan creates a false dependency — the fix could be blocked if Multica planning stalls or the plan is revised.
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report-round-1.md:31:- 必须修复：facts.tasks bug severity understated — is a current breakage, not an optional change
./tests/metric-scan.test.mjs:56: * Returns the path to the workflows root dir containing the fake skill.
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.raw.json:6:      "title": "facts.tasks bug severity understated — is a current breakage, not an optional change",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.raw.json:7:      "detail": "build-plan SKILL.md line 192 outputs facts.tasks as a string summary ('number of tasks or brief list of phase titles'), NOT a path. facts.tasks_ref (line 193) is the actual path to tasks.md. build-code SKILL.md line 20 reads facts.tasks as 'path tasks.md' — this is a live read-wrong-field bug. The plan lists this as 'proposed workflowhub change #1' alongside optional enhancements. It must be a blocking prerequisite fix, shipped and verified independently before any Multica wiring. Bundling it as a Multica feature understates severity and risks it being skipped if Multica plan stalls."
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.raw.json:41:      "title": "facts.tasks fix should ship independently, not gated on Multica",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.raw.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.raw.json:74:      "risk": "facts.tasks read as path is already broken",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.raw.json:75:      "checkedSource": "build-plan SKILL.md line 192 (facts.tasks=string summary), line 193 (facts.tasks_ref=path); build-code SKILL.md line 20 (reads facts.tasks as path)",
./tests/five-skills-present.test.mjs:243:  test("build-code consumes facts.tasks_ref as tasks.md path on full path", () => {
./tests/five-skills-present.test.mjs:246:      content.includes("facts.tasks_ref") && content.includes("path to `tasks.md`"),
./tests/five-skills-present.test.mjs:247:      "build-code/SKILL.md must read facts.tasks_ref as the tasks.md path"
./tests/five-skills-present.test.mjs:250:      content.includes("facts.tasks") && content.includes("do **not** treat it as a file path"),
./tests/five-skills-present.test.mjs:251:      "build-code/SKILL.md must preserve facts.tasks as summary/count, not a path"
./workflows/build-plan/SKILL.md:191:    "plan_ref": "<relative path to plan.md>",
./workflows/build-plan/SKILL.md:193:    "tasks_ref": "<relative path to tasks.md>",
./workflows/build-plan/SKILL.md:194:    "analysis_ref": "<relative path to cross-artifact-analysis.md>"
./workflows/build-plan/SKILL.md:212:- `facts.tasks` — M6 field, kept
./workflows/build-plan/SKILL.md:213:- `facts.tasks_ref` — v1 NEW field (points to tasks.md)
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict.json:6:      "title": "facts.tasks bug severity understated — is a current breakage, not an optional change",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict.json:7:      "detail": "build-plan SKILL.md line 192 outputs facts.tasks as a string summary ('number of tasks or brief list of phase titles'), NOT a path. facts.tasks_ref (line 193) is the actual path to tasks.md. build-code SKILL.md line 20 reads facts.tasks as 'path tasks.md' — this is a live read-wrong-field bug. The plan lists this as 'proposed workflowhub change #1' alongside optional enhancements. It must be a blocking prerequisite fix, shipped and verified independently before any Multica wiring. Bundling it as a Multica feature understates severity and risks it being skipped if Multica plan stalls."
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict.json:41:      "title": "facts.tasks fix should ship independently, not gated on Multica",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict.json:74:      "risk": "facts.tasks read as path is already broken",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict.json:75:      "checkedSource": "build-plan SKILL.md line 192 (facts.tasks=string summary), line 193 (facts.tasks_ref=path); build-code SKILL.md line 20 (reads facts.tasks as path)",
./specs/m12-build-plan-v1/spec.md:102:- **预期结果**：`specs/{task-id}/plan.md` + `specs/{task-id}/tasks.md` 存在；spec-analyze 分析报告已产出；宪法符合性检查勾选结果可见（21 条逐条勾）；M10 baseline 对照已产出；stage-result 含 facts 字段（plan_ref + tasks，v1 追加 tasks_ref）。
./specs/m12-build-plan-v1/spec.md:218:- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
./specs/m12-build-plan-v1/spec.md:219:  - **场景**：Given build-plan v1 产出的 stage-result JSON，When 校验，Then 含 plan_ref + tasks（M6 既有字段在场）+ v1 追加的 tasks_ref，且 status/error_code/retryable/missing_items/user_decision/reason 结构不变。
./specs/m12-build-plan-v1/spec.md:340:- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
./specs/m12-build-plan-v1/spec.md:421:- `facts.tasks`：分解后任务列表或计数——M6 既有，保留不变
./specs/m12-build-plan-v1/spec.md:422:- `facts.tasks_ref`：相对路径指向产出 tasks（如 `specs/m12-build-plan-v1/tasks.md`）——v1 追加
./workflows/build-code/SKILL.md:20:- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks_ref` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list. `facts.tasks` is the M6 summary/count field; do **not** treat it as a file path.
./workflows/build-code/SKILL.md:73:The skill accepts a caller-provided `worktree_root` config key that specifies the absolute path to the implementation worktree. Never hardcode a path. Never resolve upward to the host agenthub repo directory — the worktree is always the provided `worktree_root` and all file operations are scoped to it. This is enforced by FR-WT-001.
./workflows/build-code/SKILL.md:108:// artifactPath is the durable path to the review report, e.g. "specs/{task-id}/reviews/build-code-phase-N.md"
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report.md:8:Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report.md:12:- [blocking] 问题: facts.tasks bug severity understated — is a current breakage, not an optional change | 建议: build-plan SKILL.md line 192 outputs facts.tasks as a string summary ('number of tasks or brief list of phase titles'), NOT a path. facts.tasks_ref (line 193) is the actual path to tasks.md. build-code SKILL.md line 20 reads facts.tasks as 'path tasks.md' — this is a live read-wrong-field bug. The plan lists this as 'proposed workflowhub change #1' alongside optional enhancements. It must be a blocking prerequisite fix, shipped and verified independently before any Multica wiring. Bundling it as a Multica feature understates severity and risks it being skipped if Multica plan stalls.
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report.md:19:- [minor] 问题: facts.tasks fix should ship independently, not gated on Multica | 建议: The build-code/build-plan handoff bug (reading wrong facts key) affects every current and future build-code run regardless of Multica. It should be fixed, tested, and committed now. Listing it as a 'proposed workflowhub change' inside the Multica plan creates a false dependency — the fix could be blocked if Multica planning stalls or the plan is revised.
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/report.md:31:- 必须修复：facts.tasks bug severity understated — is a current breakage, not an optional change
./core/load-config.mjs:21: * @param {string} path - Absolute path to YAML config file.
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.json:6:      "title": "facts.tasks bug severity understated — is a current breakage, not an optional change",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.json:7:      "detail": "build-plan SKILL.md line 192 outputs facts.tasks as a string summary ('number of tasks or brief list of phase titles'), NOT a path. facts.tasks_ref (line 193) is the actual path to tasks.md. build-code SKILL.md line 20 reads facts.tasks as 'path tasks.md' — this is a live read-wrong-field bug. The plan lists this as 'proposed workflowhub change #1' alongside optional enhancements. It must be a blocking prerequisite fix, shipped and verified independently before any Multica wiring. Bundling it as a Multica feature understates severity and risks it being skipped if Multica plan stalls."
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.json:41:      "title": "facts.tasks fix should ship independently, not gated on Multica",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.json:45:  "resolutionSummary": "Four blocking issues must be resolved before implementation: (1) Treat facts.tasks/tasks_ref as a standalone bug fix and ship it with a test before any Multica work. (2) Define a formal bootstrap contract for fresh stage-runner sessions: which artifacts to load, in what order, with what fallback when missing — this is the architectural core of the stage-split design. (3) Specify skill-digest creation: owner agent, creation trigger, content schema (including source SKILL.md hash for staleness detection), invalidation rule. (4) Move Multica-specific config (session policy, model limits, approval gates) out of workflowhub.yaml into Multica squad config; define the human checkpoint surfacing mechanism. Minor issues (context-digest-kimi protocol, savings estimate revision, decoupled bug fix) can be addressed in the same revision pass. Once blocking issues are resolved, the plan's core approach — Sonnet foreman, stage-split sessions, artifact-first outputs, no-Bash-read rule, per-stage handoff — correctly attacks the measured cost drivers and is architecturally sound.",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.json:74:      "risk": "facts.tasks read as path is already broken",
./tasks/multica-cost-review/reviews/tasks/review-input-20260630T025501Z-05de43/reviews/verdict-round-1.json:75:      "checkedSource": "build-plan SKILL.md line 192 (facts.tasks=string summary), line 193 (facts.tasks_ref=path); build-code SKILL.md line 20 (reads facts.tasks as path)",
./workflows/build-spec/SKILL.md:301:    "spec_ref": "<relative path to spec.md>",
./core/kernel.mjs:9: * @param {string} configPath - Absolute path to YAML config.
./specs/m12-build-plan-v1/plan.md:162:- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
./tasks/multica-cost-review/review-input.md:148:   - `build-plan` emits `facts.tasks_ref`.
./tasks/multica-cost-review/review-input.md:149:   - `build-code` currently says to read `facts.tasks` as the tasks path.
./tasks/multica-cost-review/review-input.md:150:   - Change build-code to prefer `facts.tasks_ref`, treating `facts.tasks` as summary only.
./specs/m12-build-plan-v1/plan.md.handwritten.bak:170:| 6 | `workflows/build-plan/SKILL.md` | Phase 2 | 从 M6 薄骨架升级为 v1 — 在读 spec 后插入子技能调用流程，追加宪法检查、baseline 对照、人审检查点，保留 F10 gate、stage-result 契约（追加 tasks_ref）、metrics 调用。 |
./specs/m12-build-plan-v1/plan.md.handwritten.bak:233:- **Preserve intact**: F10 gate section (4 questions), stage-result contract (append `tasks_ref`, keep `plan_ref` + `tasks`), metrics calls (recordSkeleton + updateOwnResult with M4 10 core fields)
./specs/m12-build-plan-v1/plan.md.handwritten.bak:237:- SKILL.md greps positive for: `plan-generate`, `tasks-generate`, `cross-artifact-analyze`, `constitution-checklist.md`, `constitution-check.md`, `baseline-comparison.md`, `cross-artifact-analysis.md`, `rework_proxy_count`, `F10`, `tasks_ref`, `plan_ref`, `recordSkeleton`, `updateOwnResult`
./specs/m12-build-plan-v1/plan.md.handwritten.bak:280:| FR-BP-003 | Phase 2 | Covered — stage-result fields preserved, tasks_ref appended |
./specs/m12-build-plan-v1/speckit-regen-log.md:100:4. **Stage-result contract**: plan.md documents plan_ref + tasks + tasks_ref + review fields.
./tasks/m12-build-plan-v1/stage-result-build-spec.json:7:    "requirements": "24 FR across 10 groups: FR-BP(3, build-plan v1 SKILL.md 串行编排+plan/tasks产物结构+stage-result契约保留追加tasks_ref), FR-MIG(3, speckit-plan/tasks/analyze 改造迁移 workflows/ 改名 plan-generate/tasks-generate/cross-artifact-analyze + 独立可调起内置模板 + tasks 阶段分组), FR-DECOUPLE(3, 不从git分支推断身份 fail-loud + 模板技能内部加载 + analyze 显式路径定位), FR-XARTIFACT(2, 跨产物一致性检查只记录不阻断), FR-CONSTITUTION(3, 21条逐条勾选只记录不阻断 + 缺失判据), FR-BASELINE(3, M10 5项对照 rework_proxy_count真名 阈值人拍), FR-REGISTRY(2, 三件 reuse-registry 登记+格式校验), FR-REVIEW(1, 一且仅一次人审检查点), FR-SKELETON(2, F10门保留+M6 stage-result/metrics契约不回归), FR-SCOPE(2, 不碰 build-code/verify-code 逻辑+design其他技能); 9条验收; 每FR可溯 D-M12-x。"
./tasks/m13b-build-spec-deepening/scope-decision.md:45:`task_id / current_stage / next_stage / worktree_root / upstream_stage_result_ref / decision_log_ref / spec_ref / plan_ref / tasks_ref / data_contracts_ref / evidence_dir / required_reads / artifact_outputs / missing_items / risk_items / last_human_decision`。
./tasks/m13b-build-spec-deepening/scope-decision.md:47:build-spec 写回时**必填子集**（缺任一即验收失败）：`task_id / current_stage / next_stage(=build-plan) / spec_ref / required_reads / artifact_outputs`。下游字段（plan_ref/tasks_ref/data_contracts_ref）本轮留空占位，由 M13c 填充。
./tasks/m13b-build-spec-deepening/scope-decision.md:97:- **OQ-5**：handoff 下游字段（plan_ref/tasks_ref 等）本轮留空占位 vs 契约里标 optional——哪种更利于 M13c 衔接？
./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/report-round-1.md:13:- [medium] 位置: specs/m12-build-plan-v1/plan.md:187 | 问题: Step 4 says the build-plan stage should add facts.analysis_ref, but FR-BP-003 only defines tasks_ref as the v1 addition while the spec's stage-result entity later also expects analysis_ref. The plan does not explicitly reconcile that analysis_ref is an additional v1 fact beyond FR-BP-003, which can make reviewers treat it as either optional or contract drift. | 建议: State explicitly that facts.analysis_ref is an additional M12 field required by FR-XARTIFACT/FR-DECOUPLE-003 and must be added without replacing the M6 fields or FR-BP-003's tasks_ref.
./tasks/m12-build-plan-v1/plan-tasks-review-package.md:173:| 6 | `workflows/build-plan/SKILL.md` | Phase 2 | 从 M6 薄骨架升级为 v1 — 在读 spec 后插入子技能调用流程，追加宪法检查、baseline 对照、人审检查点，保留 F10 gate、stage-result 契约（追加 tasks_ref）、metrics 调用。 |
./tasks/m12-build-plan-v1/plan-tasks-review-package.md:236:- **Preserve intact**: F10 gate section (4 questions), stage-result contract (append `tasks_ref`, keep `plan_ref` + `tasks`), metrics calls (recordSkeleton + updateOwnResult with M4 10 core fields)
./tasks/m12-build-plan-v1/plan-tasks-review-package.md:240:- SKILL.md greps positive for: `plan-generate`, `tasks-generate`, `cross-artifact-analyze`, `constitution-checklist.md`, `constitution-check.md`, `baseline-comparison.md`, `cross-artifact-analysis.md`, `rework_proxy_count`, `F10`, `tasks_ref`, `plan_ref`, `recordSkeleton`, `updateOwnResult`
./tasks/m12-build-plan-v1/plan-tasks-review-package.md:283:| FR-BP-003 | Phase 2 | Covered — stage-result fields preserved, tasks_ref appended |
./tasks/m12-build-plan-v1/plan-tasks-review-package.md:465:  **(j) Stage-result** (update from M6): keep `status`/`error_code`/`retryable`/`missing_items`/`user_decision`/`reason` fields unchanged. In `facts`: keep `plan_ref` and `tasks`, append `tasks_ref` (relative path to tasks.md). Append `review` object with five fields: `review.state` (enum: `"pending"`|`"approved"`|`"rejected"`), `review.reviewer` (string), `review.timestamp` (RFC3339), `review.decision` (string, non-empty in all three states), `review.notes` (string, may be empty).
./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/verdict-round-1.raw.json:15:      "issue": "Step 4 says the build-plan stage should add facts.analysis_ref, but FR-BP-003 only defines tasks_ref as the v1 addition while the spec's stage-result entity later also expects analysis_ref. The plan does not explicitly reconcile that analysis_ref is an additional v1 fact beyond FR-BP-003, which can make reviewers treat it as either optional or contract drift.",
./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/verdict-round-1.raw.json:16:      "recommendation": "State explicitly that facts.analysis_ref is an additional M12 field required by FR-XARTIFACT/FR-DECOUPLE-003 and must be added without replacing the M6 fields or FR-BP-003's tasks_ref."
./tasks/m13b-build-spec-deepening/stage-result-build-plan.json:8:    "tasks_ref": "specs/m13b-build-spec-deepening/tasks.md",
./specs/m13b-build-spec-deepening/build-plan-3rd-review.md:205:  Fix: either update line 64 prose to match actual T005 depends: field, or add T003/T004 to T005 depends: if truly required; fix line 75 critical path to include T012/T013.
./tests/metrics-collector.test.mjs:288:  it("configForCollector maps loaded config.metrics_path to globalMetricsPath", () => {
./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/verdict-round-1.json:15:      "issue": "Step 4 says the build-plan stage should add facts.analysis_ref, but FR-BP-003 only defines tasks_ref as the v1 addition while the spec's stage-result entity later also expects analysis_ref. The plan does not explicitly reconcile that analysis_ref is an additional v1 fact beyond FR-BP-003, which can make reviewers treat it as either optional or contract drift.",
./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-v2-20260629T012927Z-c479b8/reviews/verdict-round-1.json:16:      "recommendation": "State explicitly that facts.analysis_ref is an additional M12 field required by FR-XARTIFACT/FR-DECOUPLE-003 and must be added without replacing the M6 fields or FR-BP-003's tasks_ref."
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:430:- **预期结果**：`specs/{task-id}/plan.md` + `specs/{task-id}/tasks.md` 存在；spec-analyze 分析报告已产出；宪法符合性检查勾选结果可见（21 条逐条勾）；M10 baseline 对照已产出；stage-result 含 facts 字段（plan_ref + tasks，v1 追加 tasks_ref）。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:546:- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:547:  - **场景**：Given build-plan v1 产出的 stage-result JSON，When 校验，Then 含 plan_ref + tasks（M6 既有字段在场）+ v1 追加的 tasks_ref，且 status/error_code/retryable/missing_items/user_decision/reason 结构不变。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:737:- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:883:**Independent Test**: Read `workflows/build-plan/SKILL.md` and grep-verify: (a) references to spec-plan/spec-tasks/spec-analyze exist; (b) constitution-checklist 21-clause reference exists; (c) M10 baseline-report.md 5-metric reference exists; (d) human review pause marker exists exactly once; (e) F10 4-question gate present; (f) stage-result contract includes plan_ref + tasks (M6) + tasks_ref (v1 new) + review object.
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:889:- [ ] T014 [US4] Upgrade `workflows/build-plan/SKILL.md` — replace M6 thin skeleton with v1 orchestrator: (a) read spec from upstream build-spec; (b) call spec-plan with task-id; (c) call spec-tasks with task-id + --stage N; (d) call spec-analyze with task-id, producing report at `specs/{task-id}/cross-artifact-analysis.md`; (e) perform constitution compliance check by reading `constitution-checklist.md` and filling all 21 clauses (F1-F10, Q1-Q3, S1-S8) with `[x]`/`[ ]` + rationale; (f) perform M10 baseline comparison using `specs/archive/m10-baseline-switch/baseline-report.md` as baseline values; (g) pause at human review checkpoint (exactly one occurrence) for manual confirmation; (h) produce stage-result JSON with plan_ref, tasks, tasks_ref (new), analysis_ref (new), review object; (i) call metrics collector (recordSkeleton + updateOwnResult). FR: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-BASELINE-001, FR-REVIEW-001, FR-SKELETON-002.
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:894:- [ ] T019 [US4] Verify M6 stage-result contract preserved: status/error_code/retryable/missing_items/user_decision/reason fields unchanged; facts.plan_ref and facts.tasks retained from M6; facts.tasks_ref and facts.analysis_ref added as v1 new fields (not replacing existing fields). metrics collector calls (recordSkeleton + updateOwnResult, 10 core fields) preserved. FR: FR-BP-003, FR-SKELETON-002.
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1007:- Stage-result contract: M6 fields retained, v1 adds tasks_ref + analysis_ref + review object
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1113:- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1194:- `facts.tasks`：分解后任务列表或计数——M6 既有，保留不变
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1195:- `facts.tasks_ref`：相对路径指向产出 tasks（如 `specs/m12-build-plan-v1/tasks.md`）——v1 追加
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1535:   165	- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1676:   102	- **预期结果**：`specs/{task-id}/plan.md` + `specs/{task-id}/tasks.md` 存在；spec-analyze 分析报告已产出；宪法符合性检查勾选结果可见（21 条逐条勾）；M10 baseline 对照已产出；stage-result 含 facts 字段（plan_ref + tasks，v1 追加 tasks_ref）。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1792:   218	- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1793:   219	  - **场景**：Given build-plan v1 产出的 stage-result JSON，When 校验，Then 含 plan_ref + tasks（M6 既有字段在场）+ v1 追加的 tasks_ref，且 status/error_code/retryable/missing_items/user_decision/reason 结构不变。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1914:   340	- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1995:   421	- `facts.tasks`：分解后任务列表或计数——M6 既有，保留不变
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1996:   422	- `facts.tasks_ref`：相对路径指向产出 tasks（如 `specs/m12-build-plan-v1/tasks.md`）——v1 追加
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2274:   105	**Independent Test**: Read `workflows/build-plan/SKILL.md` and grep-verify: (a) references to spec-plan/spec-tasks/spec-analyze exist; (b) constitution-checklist 21-clause reference exists; (c) M10 baseline-report.md 5-metric reference exists; (d) human review pause marker exists exactly once; (e) F10 4-question gate present; (f) stage-result contract includes plan_ref + tasks (M6) + tasks_ref (v1 new) + review object.
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2280:   111	- [ ] T014 [US4] Upgrade `workflows/build-plan/SKILL.md` — replace M6 thin skeleton with v1 orchestrator: (a) read spec from upstream build-spec; (b) call spec-plan with task-id; (c) call spec-tasks with task-id + --stage N; (d) call spec-analyze with task-id, producing report at `specs/{task-id}/cross-artifact-analysis.md`; (e) perform constitution compliance check by reading `constitution-checklist.md` and filling all 21 clauses (F1-F10, Q1-Q3, S1-S8) with `[x]`/`[ ]` + rationale; (f) perform M10 baseline comparison using `specs/archive/m10-baseline-switch/baseline-report.md` as baseline values; (g) pause at human review checkpoint (exactly one occurrence) for manual confirmation; (h) produce stage-result JSON with plan_ref, tasks, tasks_ref (new), analysis_ref (new), review object; (i) call metrics collector (recordSkeleton + updateOwnResult). FR: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-BASELINE-001, FR-REVIEW-001, FR-SKELETON-002.
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2285:   116	- [ ] T019 [US4] Verify M6 stage-result contract preserved: status/error_code/retryable/missing_items/user_decision/reason fields unchanged; facts.plan_ref and facts.tasks retained from M6; facts.tasks_ref and facts.analysis_ref added as v1 new fields (not replacing existing fields). metrics collector calls (recordSkeleton + updateOwnResult, 10 core fields) preserved. FR: FR-BP-003, FR-SKELETON-002.
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2398:   229	- Stage-result contract: M6 fields retained, v1 adds tasks_ref + analysis_ref + review object
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2456:   218	- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2457:   219	  - **场景**：Given build-plan v1 产出的 stage-result JSON，When 校验，Then 含 plan_ref + tasks（M6 既有字段在场）+ v1 追加的 tasks_ref，且 status/error_code/retryable/missing_items/user_decision/reason 结构不变。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2578:   340	- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2889:   165	- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
./specs/m13-make-decision-v1/stage-result-build-plan.json:8:    "tasks_ref": "specs/m13-make-decision-v1/tasks.md",
./specs/m12-build-plan-v1/evidence/phase-6-RED.json.stdout:47:   × T019: M6 stage-result contract preserved + v1 additions > v1 adds facts.tasks_ref 0ms
./specs/m12-build-plan-v1/evidence/phase-6-RED.json.stdout:48:     → SKILL.md must add facts.tasks_ref (v1 new field)
./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-20260629T012107Z-948c50/reviews/report-round-4.md:15:- [medium] 位置: specs/m12-build-plan-v1/tasks.md:91 | 问题: The cross-artifact analysis report is required, but the plan/tasks do not fix a concrete output filename. They only say the report exists under `specs/m12-build-plan-v1/`, which makes AC3 and orchestrator verification ambiguous. | 建议: Add a stable report path to the contract, for example `specs/{task-id}/cross-artifact-analysis.md`, and update T011/T012/T014/T026 to verify that exact file path and its required summary/finding fields.
./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-20260629T012107Z-948c50/reviews/verdict-round-4.json:30:      "recommendation": "Add a stable report path to the contract, for example `specs/{task-id}/cross-artifact-analysis.md`, and update T011/T012/T014/T026 to verify that exact file path and its required summary/finding fields."
./specs/m12-build-plan-v1/evidence/phase-6-RED.json.stderr:402: FAIL  tests/m12-build-plan-v1.test.mjs > T019: M6 stage-result contract preserved + v1 additions > v1 adds facts.tasks_ref
./specs/m12-build-plan-v1/evidence/phase-6-RED.json.stderr:403:AssertionError: SKILL.md must add facts.tasks_ref (v1 new field)
./specs/m12-build-plan-v1/evidence/phase-6-RED.json.stderr:412:    426|   test("v1 adds facts.tasks_ref", () => {
./specs/m12-build-plan-v1/evidence/phase-6-RED.json.stderr:416:    429|       content.includes("tasks_ref"),
./specs/m12-build-plan-v1/evidence/phase-6-RED.json.stderr:417:    430|       "SKILL.md must add facts.tasks_ref (v1 new field)"
./specs/m12-build-plan-v1/review-plan-tasks/tasks/m12-plan-tasks-package-20260629T012107Z-948c50/reviews/verdict-round-4.raw.json:30:      "recommendation": "Add a stable report path to the contract, for example `specs/{task-id}/cross-artifact-analysis.md`, and update T011/T012/T014/T026 to verify that exact file path and its required summary/finding fields."
./specs/m12-build-plan-v1/tasks.md.handwritten.bak:66:  **(j) Stage-result** (update from M6): keep `status`/`error_code`/`retryable`/`missing_items`/`user_decision`/`reason` fields unchanged. In `facts`: keep `plan_ref` and `tasks`, append `tasks_ref` (relative path to tasks.md). Append `review` object with five fields: `review.state` (enum: `"pending"`|`"approved"`|`"rejected"`), `review.reviewer` (string), `review.timestamp` (RFC3339), `review.decision` (string, non-empty in all three states), `review.notes` (string, may be empty).
./specs/m12-build-plan-v1/tasks.md:105:**Independent Test**: Read `workflows/build-plan/SKILL.md` and grep-verify: (a) references to spec-plan/spec-tasks/spec-analyze exist; (b) constitution-checklist 21-clause reference exists; (c) M10 baseline-report.md 5-metric reference exists; (d) human review pause marker exists exactly once; (e) F10 4-question gate present; (f) stage-result contract includes plan_ref + tasks (M6) + tasks_ref (v1 new) + review object.
./specs/m12-build-plan-v1/tasks.md:111:- [ ] T014 [US4] Upgrade `workflows/build-plan/SKILL.md` — replace M6 thin skeleton with v1 orchestrator: (a) read spec from upstream build-spec; (b) call spec-plan with task-id; (c) call spec-tasks with task-id + --stage N; (d) call spec-analyze with task-id, producing report at `specs/{task-id}/cross-artifact-analysis.md`; (e) perform constitution compliance check by reading `constitution-checklist.md` and filling all 21 clauses (F1-F10, Q1-Q3, S1-S8) with `[x]`/`[ ]` + rationale; (f) perform M10 baseline comparison using `specs/archive/m10-baseline-switch/baseline-report.md` as baseline values; (g) pause at human review checkpoint (exactly one occurrence) for manual confirmation; (h) produce stage-result JSON with plan_ref, tasks, tasks_ref (new), analysis_ref (new), review object; (i) call metrics collector (recordSkeleton + updateOwnResult). FR: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-BASELINE-001, FR-REVIEW-001, FR-SKELETON-002.
./specs/m12-build-plan-v1/tasks.md:116:- [ ] T019 [US4] Verify M6 stage-result contract preserved: status/error_code/retryable/missing_items/user_decision/reason fields unchanged; facts.plan_ref and facts.tasks retained from M6; facts.tasks_ref and facts.analysis_ref added as v1 new fields (not replacing existing fields). metrics collector calls (recordSkeleton + updateOwnResult, 10 core fields) preserved. FR: FR-BP-003, FR-SKELETON-002.
./specs/m12-build-plan-v1/tasks.md:229:- Stage-result contract: M6 fields retained, v1 adds tasks_ref + analysis_ref + review object
./specs/archive/m12-build-plan-v1/reviews/build-code-bp-v1-round1.md:37:- **PASS**: status/error_code/retryable/missing_items/user_decision/reason preserved. facts.plan_ref and facts.tasks preserved. facts.tasks_ref and facts.analysis_ref added as NEW (not replace). review object added as NEW. "Do NOT delete or rename any M6 field" directive present (line 207).
./specs/archive/m12-build-plan-v1/reviews/build-code-bp-v1-round1.md:199:- **M6 contract non-regression**: The SKILL.md explicitly documents field preservation (lines 199-207) with a "Do NOT delete or rename" directive. The v1 additions (tasks_ref, analysis_ref, review) are clearly marked as NEW and additive.
./specs/archive/m8-build-code/tasks.md:345:  1. **前置读取**：读上游 stage-result，提取 facts.plan_ref / facts.tasks（full path）或 facts.decision / facts.scope（slim path）
./specs/archive/m12-build-plan-v1/spec.md:102:- **预期结果**：`specs/{task-id}/plan.md` + `specs/{task-id}/tasks.md` 存在；spec-analyze 分析报告已产出；宪法符合性检查勾选结果可见（21 条逐条勾）；M10 baseline 对照已产出；stage-result 含 facts 字段（plan_ref + tasks，v1 追加 tasks_ref）。
./specs/archive/m12-build-plan-v1/spec.md:218:- **FR-BP-003**：build-plan v1 的 stage-result JSON 必须保留 M6 骨架契约——`status` / `error_code` / `retryable` / `missing_items` / `user_decision` / `reason` 字段不变。`facts` 字段保留 `plan_ref`（指向 plan.md）+ `tasks`（分解后任务列表或计数）。v1 追加新 facts 字段 `tasks_ref`（指向 tasks.md），不可删除或重命名已有字段。来源：D-M12-1。
./specs/archive/m12-build-plan-v1/spec.md:219:  - **场景**：Given build-plan v1 产出的 stage-result JSON，When 校验，Then 含 plan_ref + tasks（M6 既有字段在场）+ v1 追加的 tasks_ref，且 status/error_code/retryable/missing_items/user_decision/reason 结构不变。
./specs/archive/m12-build-plan-v1/spec.md:340:- **FR-SKELETON-002**：M6 build-plan SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.plan_ref / facts.tasks / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段（如 tasks_ref），不可删除或重命名已有字段。来源：D-M12-1。
./specs/archive/m12-build-plan-v1/spec.md:421:- `facts.tasks`：分解后任务列表或计数——M6 既有，保留不变
./specs/archive/m12-build-plan-v1/spec.md:422:- `facts.tasks_ref`：相对路径指向产出 tasks（如 `specs/m12-build-plan-v1/tasks.md`）——v1 追加
./specs/archive/m12-build-plan-v1/plan.md:162:- Preserve M6 skeleton: F10 gate (4 questions), stage-result contract (plan_ref, tasks, + new tasks_ref, analysis_ref), metrics collector calls (recordSkeleton, updateOwnResult)
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1048:   134	    "spec_ref": "<relative path to spec.md>",
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1949:./workflows/build-code/SKILL.md:20:- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list.
./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:2244:./specs/archive/m8-build-code/tasks.md:345:  1. **前置读取**：读上游 stage-result，提取 facts.plan_ref / facts.tasks（full path）或 facts.decision / facts.scope（slim path）
./specs/archive/m12-build-plan-v1/tasks.md:105:**Independent Test**: Read `workflows/build-plan/SKILL.md` and grep-verify: (a) references to spec-plan/spec-tasks/spec-analyze exist; (b) constitution-checklist 21-clause reference exists; (c) M10 baseline-report.md 5-metric reference exists; (d) human review pause marker exists exactly once; (e) F10 4-question gate present; (f) stage-result contract includes plan_ref + tasks (M6) + tasks_ref (v1 new) + review object.
./specs/archive/m12-build-plan-v1/tasks.md:111:- [ ] T014 [US4] Upgrade `workflows/build-plan/SKILL.md` — replace M6 thin skeleton with v1 orchestrator: (a) read spec from upstream build-spec; (b) call spec-plan with task-id; (c) call spec-tasks with task-id + --stage N; (d) call spec-analyze with task-id, producing report at `specs/{task-id}/cross-artifact-analysis.md`; (e) perform constitution compliance check by reading `constitution-checklist.md` and filling all 21 clauses (F1-F10, Q1-Q3, S1-S8) with `[x]`/`[ ]` + rationale; (f) perform M10 baseline comparison using `specs/archive/m10-baseline-switch/baseline-report.md` as baseline values; (g) pause at human review checkpoint (exactly one occurrence) for manual confirmation; (h) produce stage-result JSON with plan_ref, tasks, tasks_ref (new), analysis_ref (new), review object; (i) call metrics collector (recordSkeleton + updateOwnResult). FR: FR-BP-001, FR-BP-002, FR-BP-003, FR-CONSTITUTION-001, FR-BASELINE-001, FR-REVIEW-001, FR-SKELETON-002.
./specs/archive/m12-build-plan-v1/tasks.md:116:- [ ] T019 [US4] Verify M6 stage-result contract preserved: status/error_code/retryable/missing_items/user_decision/reason fields unchanged; facts.plan_ref and facts.tasks retained from M6; facts.tasks_ref and facts.analysis_ref added as v1 new fields (not replacing existing fields). metrics collector calls (recordSkeleton + updateOwnResult, 10 core fields) preserved. FR: FR-BP-003, FR-SKELETON-002.
./specs/archive/m12-build-plan-v1/tasks.md:229:- Stage-result contract: M6 fields retained, v1 adds tasks_ref + analysis_ref + review object
./specs/archive/m12-build-plan-v1/evidence/phase-6-RED.json.stderr:402: FAIL  tests/m12-build-plan-v1.test.mjs > T019: M6 stage-result contract preserved + v1 additions > v1 adds facts.tasks_ref
./specs/archive/m12-build-plan-v1/evidence/phase-6-RED.json.stderr:403:AssertionError: SKILL.md must add facts.tasks_ref (v1 new field)
./specs/archive/m12-build-plan-v1/evidence/phase-6-RED.json.stderr:412:    426|   test("v1 adds facts.tasks_ref", () => {
./specs/archive/m12-build-plan-v1/evidence/phase-6-RED.json.stderr:416:    429|       content.includes("tasks_ref"),
./specs/archive/m12-build-plan-v1/evidence/phase-6-RED.json.stderr:417:    430|       "SKILL.md must add facts.tasks_ref (v1 new field)"
./specs/archive/m12-build-plan-v1/evidence/phase-6-RED.json.stdout:47:   × T019: M6 stage-result contract preserved + v1 additions > v1 adds facts.tasks_ref 0ms
./specs/archive/m12-build-plan-v1/evidence/phase-6-RED.json.stdout:48:     → SKILL.md must add facts.tasks_ref (v1 new field)

exec
/bin/bash -lc "rg -n \"阻断|blocking|不能进|BLOCK|强制门|必须停止|强制完整流程|stop|停止|不得继续|禁止.*继续|block\" workflows/build-spec/SKILL.md workflows/build-code/SKILL.md specs/m13b-build-spec-deepening tests/m13b-build-spec-deepening.test.mjs --glob '"'!node_modules'"'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
tests/m13b-build-spec-deepening.test.mjs:30:  test("SKILL.md states warn-not-stop behaviour for missing TASK_TRACKING_ROOT", () => {
tests/m13b-build-spec-deepening.test.mjs:33:      "SKILL.md must declare warn (not stop) on missing TASK_TRACKING_ROOT (FR-TRACKING-001)");
tests/m13b-build-spec-deepening.test.mjs:132:  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
tests/m13b-build-spec-deepening.test.mjs:209:  test("SKILL.md states Spec-Purity is non-blocking", () => {
tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
tests/m13b-build-spec-deepening.test.mjs:213:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
tests/m13b-build-spec-deepening.test.mjs:229:  test("SKILL.md declares review is non-blocking", () => {
tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
tests/m13b-build-spec-deepening.test.mjs:233:      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
tests/m13b-build-spec-deepening.test.mjs:243:  test("SKILL.md declares scope-triage is non-blocking", () => {
tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
tests/m13b-build-spec-deepening.test.mjs:247:      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
tests/m13b-build-spec-deepening.test.mjs:258:  test("SKILL.md declares consistency check is non-blocking", () => {
tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
tests/m13b-build-spec-deepening.test.mjs:262:      "Consistency check must be non-blocking (FR-ALIGN-001)");
workflows/build-code/SKILL.md:55:When any of these conditions hold, surface a **non-blocking warning** to the user. Do not halt the phase; record the warning in the phase notes. A false-green does not automatically invalidate the phase, but must be acknowledged.
workflows/build-spec/SKILL.md:22:- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
workflows/build-spec/SKILL.md:23:- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
workflows/build-spec/SKILL.md:80:Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output. Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.
workflows/build-spec/SKILL.md:84:At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
workflows/build-spec/SKILL.md:108:- If spec-specify reports failure or the output files are missing, stop and surface the error — do not proceed to spec-clarify.
workflows/build-spec/SKILL.md:116:- If spec-clarify reports the spec file is not found, stop — run spec-specify first.
workflows/build-spec/SKILL.md:120:spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
workflows/build-spec/SKILL.md:122:**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
workflows/build-spec/SKILL.md:127:- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
workflows/build-spec/SKILL.md:152:- 审查失败/不可用时降级记录 unknown + 原因，不阻断
workflows/build-spec/SKILL.md:168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
workflows/build-spec/SKILL.md:214:- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
workflows/build-spec/SKILL.md:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
workflows/build-spec/SKILL.md:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
workflows/build-spec/SKILL.md:225:- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
workflows/build-spec/SKILL.md:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
workflows/build-spec/SKILL.md:258:- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
workflows/build-spec/SKILL.md:271:3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/spec.md:28:- 所有新机制均为"记录事实 + 浮现 + 人判断"，零阻断。
specs/m13b-build-spec-deepening/spec.md:51:- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
specs/m13b-build-spec-deepening/spec.md:53:- agenthub design 阶段有丰富质量保障体系，但其阻断门机制与 CONSTITUTION 冲突，须按"最小实现+记事实"原则移植。
specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/spec.md:73:- scope-triage 高危词浮现（浮现+建议，非强制门）
specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/spec.md:84:- agenthub 3 道阻断门（退出门/审查门/推进门）
specs/m13b-build-spec-deepening/spec.md:91:- 任何阻断式 gate
specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/spec.md:104:### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）
specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/spec.md:109:### 场景 3.3：异源 3rd-review 审查发现方向偏差（记录不阻断）
specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/spec.md:114:### 场景 3.4：scope-triage 发现高危词（浮现建议不阻断）
specs/m13b-build-spec-deepening/spec.md:116:- **操作步骤**：spec 文本中检测到高危词（如"自动阻断""blocking gate""门禁"等）。
specs/m13b-build-spec-deepening/spec.md:124:### 场景 3.6：spec↔decision-log 一致性检查发现差异（记录不阻断）
specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/spec.md:190:- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。
specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/spec.md:257:- **场景**：Given `--task-dir` 未传入，When build-spec 运行，Then 回退到默认路径并 warn，不报错停止。
specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/spec.md:313:- **场景**：Given spec 初稿含"阻断"字样，When scope-triage grep，Then 命中位置和建议修改记录进未解风险，stage 继续。
specs/m13b-build-spec-deepening/spec.md:315:> **【验收口径对齐说明】** decision-log §7 的验收条件原文为"grep 不到 阻断/不能进/BLOCK"，与本 spec 要求 SKILL.md 必须包含这些词作为高危词检测黑名单看似矛盾，实际不矛盾。正确解读：验收检查的是"高危词是否被用作执行门语义（用来阻断/停止流程推进）"，而非是否在文本中出现。高危词以下列形式出现均**不构成违规**：（1）作为检测黑名单内容列举（如 scope-triage 检测列表）；（2）作为引用/示例/说明文本（如"禁止使用'阻断'语义"）；（3）出现在 Known Gaps、摩擦记录等说明段落中。违规仅指高危词出现在执行流程分支中作为"若…则停止/不能继续"的控制语义。AC-16 的 grep 验证应使用语义判断而非裸 grep，见 AC-16 说明。
specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/spec.md:327:1. **无阻断门**：任何质量检查失败（自检 warn / 审查偏差 / 高危词命中）均不阻断推进，违反此条即违反 CONSTITUTION F4/F5。不引入 `gate.sh stage_exit`、`post_review_pass`、`stage_advance` 等带阻断语义的 gate 机制（这三个名词是已 CUT 的 agenthub 阻断门的精确核对项）。
specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/spec.md:355:- [ ] **AC-16**：`workflows/build-spec/SKILL.md` 中不存在将阻断/BLOCK/不能进**用作执行门语义**（即"若…则停止/不得继续"的控制分支）的文本；这些词作为高危词检测黑名单内容、引用示例、说明文字出现均不违规（见 FR-SCOPETRIAGE-001 验收口径对齐说明）。
specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/spec.md:405:| 范围覆盖 | 清晰 | IN/OUT 明确，agenthub 阻断机制全部在 OUT 中列出 |
specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/plan.md:26:**Constraints**: 宪法优先；所有检查为记录+浮现，无阻断门；不修改 spec-specify/spec-clarify 技能本体
specs/m13b-build-spec-deepening/plan.md:95:- 内容：5 项字段定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），禁止阻断语义（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/plan.md:197:- [x] **F3 物理事实靠机器校验但不阻断** — 判据：Spec-Purity grep、scope-triage grep、7 条自检均为机器执行并客观记录结论（pass/warn/unknown），明确要求不阻断推进（FR-CONTRACT-002, FR-SELFCHECK-001/002）。符合 F3。
specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/plan.md:201:- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：spec 明确 OUT 列表（无阻断门、无 3 source_family 多重审查、无 TodoWrite 仪式），CUT 了全部 agenthub 阻断门（D3），无新增 gate 机制。符合 F5。
specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/plan.md:221:- [x] **S2 技能失败须 fail-loud** — 判据：spec-specify 失败时 build-spec 明确"stop and surface the error"（现有 SKILL.md Step 2）；metrics 失败时 warn 不 block（让真正失败浮现而非沉默）。符合 S2。
specs/m13b-build-spec-deepening/plan.md:251:> 所有 5 项均为 unknown。原因一致：build-plan 阶段处于规划期，上游 make-decision / build-spec 的 stage-result JSON 未记录这 5 项指标的采集值（metrics 采集在 build-code → verify-code 阶段落盘）。阈值判定留待 test-acceptance 阶段人工设定（non-blocking，D12 原则）。
specs/m13b-build-spec-deepening/plan.md:263:3. **是否可绕过成为 security-theatre**：不构成安全剧场——字段为"记录+浮现"语义，不阻断流程；即使值为 unknown 也合法，不存在伪通过路径（F9）。
specs/m13b-build-spec-deepening/plan.md:272:3. **是否可绕过**：判断结论为描述性记录，不强制阻断，故不存在绕过安全门的问题。
specs/m13b-build-spec-deepening/plan.md:281:3. **是否可绕过**：自检为记录性质，warn 不阻断；grep 为机器执行，不存在"能绕过"的安全问题。
specs/m13b-build-spec-deepening/plan.md:290:3. **是否可绕过**：无阻断门，审查结论为 unknown 时记录 unknown 继续，不存在安全剧场。
specs/m13b-build-spec-deepening/plan.md:315:1. **防御的真实威胁**：spec 写入阻断语义词（"不能继续"、"blocking gate"）被执行代理当成规则执行，导致宪法违规。
specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/r5-review-prompt.md:6:R3 produced 3 phantom findings that did NOT exist in the actual files. For EVERY blocking finding you report, you MUST quote the exact file:line number and exact text from the file excerpts below. If you cannot quote it, do NOT report it as blocking.
specs/m13b-build-spec-deepening/r5-review-prompt.md:40:- [ ] T001 在 `workflows/build-spec/SKILL.md` 新增「环境变量与参数约定」节：定义 `TASK_TRACKING_ROOT` 变量（默认值 `~/Knowledge/workflowhub/`、降级行为、warn 不停止）和 `--task-dir` 参数约定（路径推导规则，不依赖 cwd 猜测，缺失时回退默认路径并 warn）。FR: FR-TRACKING-001, FR-TRACKING-002, FR-TASKDIR-001 (stage:1, depends:无)
specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:162:**Q7: Any real new blocking issues?**
specs/m13b-build-spec-deepening/r5-review-prompt.md:211:NEW BLOCKING FINDINGS: [list each with exact file:line quote, or NONE]
specs/m13b-build-spec-deepening/tasks.md:17:- [ ] T001 在 `workflows/build-spec/SKILL.md` 新增「环境变量与参数约定」节：定义 `TASK_TRACKING_ROOT` 变量（默认值 `~/Knowledge/workflowhub/`、降级行为、warn 不停止）和 `--task-dir` 参数约定（路径推导规则，不依赖 cwd 猜测，缺失时回退默认路径并 warn）。FR: FR-TRACKING-001, FR-TRACKING-002, FR-TASKDIR-001 (stage:1, depends:无)
specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/spec-clarify-scan.md:50:- Spec-Purity grep 命中：warn + 记录，不阻断（FR-SELFCHECK-002）。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:51:- decision-log 缺失：沿用 M11 v1 规则，stop + 报错（现有行为不改）。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:122:| R4 | 阻断语义 | 所有检查为记录+浮现，无阻断 | decision-log D1 + CONSTITUTION F4/F5 |
specs/m13b-build-spec-deepening/spec-clarify-scan.md:138:**处理原则**：3 条 OQ 均为低风险，有合理默认值，不阻断 build-plan 推进。build-plan 阶段可就默认值向人确认，或直接采用建议值。
specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/checklists/requirements.md:56:| F3 物理事实靠机器校验但不阻断 | 自检 grep/计数均为记录，不阻断 | [x] 符合 |
specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/checklists/requirements.md:58:| F5 gate 谨慎添加 | CUT 列表明确排除所有阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/checklists/requirements.md:74:## 五、阻断语言检查（Spec-Purity 阻断门语义）
specs/m13b-build-spec-deepening/checklists/requirements.md:76:- [x] spec.md 不含以阻断门语义使用的"阻断" — 非目标段落中引用均作为 CUT 说明
specs/m13b-build-spec-deepening/checklists/requirements.md:77:- [x] spec.md 不含 BLOCK 作为执行门
specs/m13b-build-spec-deepening/checklists/requirements.md:78:- [x] spec.md 不含"不能进""必须停止"等推进封锁语义
specs/m13b-build-spec-deepening/baseline-report.md:49:- No unknown blocks progression (F3: 物理事实不阻断推进).
specs/m13b-build-spec-deepening/baseline-report.md:50:- Thresholds are set by humans; non-compliance does not block.
specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/r3-review-prompt.md:133:**Q8 — Any new blocking issues?**
specs/m13b-build-spec-deepening/r3-review-prompt.md:155:Q8: [PASS/FAIL] — evidence or "no new blocking found"
specs/m13b-build-spec-deepening/r3-review-prompt.md:158:BLOCKING: <list any new blocking issues, or "none">
specs/m13b-build-spec-deepening/r3-review-prompt.md:159:NON-BLOCKING: <list any non-blocking observations>
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:12: × tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-06: TASK_TRACKING_ROOT env var declared > SKILL.md states warn-not-stop behaviour for missing TASK_TRACKING_ROOT
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:13:   → SKILL.md must declare warn (not stop) on missing TASK_TRACKING_ROOT (FR-TRACKING-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:48: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:71: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:72:   → Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:75: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:78: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:79:   → scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:82: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:83:   → Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:14: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:27: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:30: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:32: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-GREEN.json.stdout:34: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:10: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-06: TASK_TRACKING_ROOT env var declared > SKILL.md states warn-not-stop behaviour for missing TASK_TRACKING_ROOT
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:41: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:44: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:46: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:48: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-1-GREEN.json.stdout:10: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-06: TASK_TRACKING_ROOT env var declared > SKILL.md states warn-not-stop behaviour for missing TASK_TRACKING_ROOT
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:41: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-06: TASK_TRACKING_ROOT env var declared > SKILL.md states warn-not-stop behaviour for missing TASK_TRACKING_ROOT
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:42:AssertionError: SKILL.md must declare warn (not stop) on missing TASK_TRACKING_ROOT (FR-TRACKING-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:51:     30|   test("SKILL.md states warn-not-stop behaviour for missing TASK_TRACK…
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:55:     33|       "SKILL.md must declare warn (not stop) on missing TASK_TRACKING_…
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:383: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:393:    132|   test("SKILL.md declares contract items are non-blocking (FR-CONTRACT…
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:573: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:574:AssertionError: Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:583:    209|   test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:587:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:588:    213|       "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)…
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:611: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:612:AssertionError: scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:621:    243|   test("SKILL.md declares scope-triage is non-blocking", () => {
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:626:    247|       "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:649: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:650:AssertionError: Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:659:    258|   test("SKILL.md declares consistency check is non-blocking", () => {
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:664:    262|       "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:19: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:40: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:41:   → Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:44: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:47: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:48:   → scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:51: × tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stdout:52:   → Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:10: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 1 / AC-06: TASK_TRACKING_ROOT env var declared > SKILL.md states warn-not-stop behaviour for missing TASK_TRACKING_ROOT
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:28: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-01: 质量事实契约 5 items > SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:41: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:44: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-05: 异源 3rd-review 独立审查 > SKILL.md declares review is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:46: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:48: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:250: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-04: Spec-Purity grep > SKILL.md states Spec-Purity is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:251:AssertionError: Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:260:    209|   test("SKILL.md states Spec-Purity is non-blocking", () => {
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:264:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:265:    213|       "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)…
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:288: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-11: scope-triage 高危词浮现 > SKILL.md declares scope-triage is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:289:AssertionError: scope-triage must be non-blocking (FR-SCOPETRIAGE-001)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:298:    243|   test("SKILL.md declares scope-triage is non-blocking", () => {
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:303:    247|       "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:326: FAIL  tests/m13b-build-spec-deepening.test.mjs > Phase 2 / AC-12: spec↔decision-log 一致性检查 > SKILL.md declares consistency check is non-blocking
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:327:AssertionError: Consistency check must be non-blocking (FR-ALIGN-001)
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:336:    258|   test("SKILL.md declares consistency check is non-blocking", () => {
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:341:    262|       "Consistency check must be non-blocking (FR-ALIGN-001)");
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:8:> 本报告只读（read-only）。记录不一致/重复/歧义/欠定义问题，不修改三产物，不阻断下游推进。
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:42:| A-02 | LOW | plan.md S6 宪法条款判据 | plan.md Constitution Check S6 判据末尾写"待 SKILL.md 写入时确认 version"，引入了一个"待确认"的条件，意味着 S6 结论是临时的。这与 Constitution Check 的一次性记录语义有轻微不一致（其他 20 条无此留白）。 | id:A-02, type:ambiguity, location:plan.md Constitution Check S6, description:S6 判据含"待确认"语，使其结论不完整, suggested_action:后续 SKILL.md 写入完成后将 S6 判据更新为确定性结论；目前不阻断 |
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:77:所有 MEDIUM/LOW 发现均不阻断推进。无 CRITICAL/HIGH 发现。
specs/m13b-build-spec-deepening/constitution-check.md:17:- [x] **F3 物理事实靠机器校验但不阻断**
specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/constitution-check.md:21:  spec 将独立三角度审查（FR-REVIEW-001/002）设计为"记录+浮现"语义，偏差结论浮现给人判断；Section 5（不做/非目标）第 1 条直接声明"任何质量检查失败均不阻断推进，违反此条即违反 CONSTITUTION F4/F5"；全 spec 无任何阻断门定义，完全依靠审查浮现和人工把关，符合 F4。
specs/m13b-build-spec-deepening/constitution-check.md:24:  spec OUT 列表明确剔除 agenthub 的三道阻断门（退出门/审查门/推进门），Section 5 第 1 条再次明确"无阻断门"，现有机制全部为采集记录型，没有预先堆砌关卡；符合"只添加确有必要 gate"的 F5 原则。
specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/constitution-check.md:36:  FR-CONTRACT-001 场景明确规定"Given 某项无数据，When 填写该字段，Then 填 unknown，不伪造值（F9 可证伪不假绿）"；FR-SELFCHECK-001 场景声明"全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进"，防止假绿；自检结论字段 pass/warn/unknown 三态设计保证了"实际为假时能真实报 warn"，符合 F9。
specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/constitution-check.md:62:  spec 明确对 agenthub 原有质量保障体系进行了合宪改造：删除三道阻断门（不符合 F4/F5），保留质量事实浮现机制；FR-REVIEW-002 将三 source_family 异源改造为 1-AI-3-angle 单代理三角度（合宪简化）；这正是"按项目需要改造使其合宪"的典型体现，符合 S2。
specs/m13b-build-spec-deepening/constitution-check.md:80:  spec 通过 `--task-dir` 参数（FR-TASKDIR-001）和 `TASK_TRACKING_ROOT` 环境变量（FR-TRACKING-001）将路径全部参数化，消除了对特定 cwd 的隐式依赖；`--task-dir` 缺失时有默认值降级（不报错停止），技能可在不同宿主环境运行；符合 S8 可独立调用、可搬运的要求。
specs/m13b-build-spec-deepening/constitution-check.md:95:该 spec 的设计核心（零阻断门、记事实+浮现+人判断、薄核心下沉）与宪法 F3/F4/F5/Q1/Q2 高度契合；已知局限（单代理三角度审查独立性有限）已在 Known Gaps 诚实标注，符合 F9 可证伪不假绿原则。
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:51:- **[NBK-9]** D3 deleted items handled correctly: blocking gates, TodoWrite, `[DECOMP]`, gate-bound auto-write, Exit Conditions repetition all excluded from active mechanisms. `blocking gate` appears only as blacklist example text in T010, which is acceptable per AC-16.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:108:Three R1 blockers are fully closed: schema, FR task mapping, and T005 dependencies are corrected. BLK-4 is only partially closed because the citation target was fixed, but the claimed version verification still has no real AC or T014 step behind it. There is also one new blocking traceability error: T008's 7 self-check list diverges materially from `FR-SELFCHECK-001`, which would cause the implementation plan to produce the wrong `SKILL.md` behavior.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:148:| Q6 | Dependency ordering | FAIL | T002→T005→T002 circular dependency confirmed blocking |
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:150:| Q8 | New blocking issues | FAIL | 3 new blockers: T002/T005 cycle; phantom FR-ACCOUNT-002; FR-STRUCTURE mapping wrong |
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:159:R2's two blocking issues (NEW-BLK-1 T008 list divergence, BLK-4 T014/S6 version gap) are both fully closed. However three new blocking issues are found: a circular dependency between T002 and T005 that makes the task graph unexecutable; a phantom `FR-ACCOUNT-002` entry in the FR Coverage Matrix not backed by any task declaration; and FR-STRUCTURE-001/002 assigned to the wrong task (T007 in matrix vs T004 in tasks). These must be resolved before build-code can proceed safely.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:200:- **Prose vs. fields mismatch (blocking):**
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:222:- Formatting difference (circled numerals vs. plain numbers) is not blocking.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:243:- All three R3 claimed blockers are confirmed false against actual file contents.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:248:All three R3 blockers are confirmed invalid — they did not exist in the actual files. One real finding: dependency prose at tasks.md:64 and Critical Path at tasks.md:75 are inconsistent with the actual `depends:` field of T005 and T014 respectively. This is a documentation fix, not a structural redesign. All 5 other checks (FR matrix, T004 schema, T008 7-list, S6 truthfulness, orphan FRs) pass cleanly.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:250:**R4 Verdict: REVISE_REQUIRED** — one documentation consistency fix needed (tasks.md lines 64 and 75). All R3 blockers closed as false positives.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:326:R4-BLK-1 is closed: Stage 2 prose now matches T005's actual dependency field, and the critical path includes T012/T013 before T014. The dependency graph is acyclic with no cycles. The FR matrix has exactly 24 rows with no phantom or orphan FRs. T004 schema, T008 7-list, and S6 all have concrete matching task evidence. No new blocking findings.
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:328:**R5 Verdict: PASS** — All blocking findings resolved. Build-plan artifacts cleared for build-code phase.

exec
/bin/bash -lc "nl -ba workflows/build-spec/SKILL.md | sed -n '230,360p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
   230	- [ ] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。
   231	- [ ] **S3 迭代时保持最新并就地检查** — 判据：迭代时是否查更新/更优、来源路径写进技能文件。
   232	- [ ] **S4 自定义技能必须有指标系统** — 判据：自研技能是否配套指标、纳入统一执行记录。
   233	- [ ] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能是否便于子代理调用、减少主上下文占用。
   234	- [ ] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能是否参考成熟方案优化。
   235	- [ ] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。
   236	- [ ] **S8 自定义技能可独立调用可搬运** — 判据：自研技能是否可独立调用、可跨宿主搬运、不绑死环境。
   237	
   238	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
   239	
   240	Write the completed checklist as an appendix to the spec or as a standalone file `specs/{task-id}/constitution-check.md`.
   241	
   242	### 5. Baseline comparison
   243	
   244	Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:
   245	
   246	| Metric | M11 Actual | M10 Baseline | Direction Delta |
   247	| ------ | ---------- | ------------ | --------------- |
   248	| missed_step_rate | <M11 actual> | 0.05 | <delta> |
   249	| test_execution_rate | <M11 actual> | 0.8295 | <delta> |
   250	| review_execution_rate | <M11 actual> | 1 | <delta> |
   251	| rework_rounds | <M11 actual> | 6.075 | <delta> |
   252	| rework_proxy_count | <M11 actual> | 25.25 | <delta> |
   253	
   254	- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
   255	- **If a metric cannot be computed from available data, write `unknown` in the M11 Actual cell and state the missing-data reason in a note below the table. Never fabricate a value.** A fabricated actual is a false-green (violates F9); a real `unknown` is honest.
   256	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
   257	- The direction delta indicates whether the metric moved favourably (e.g. fewer rework rounds is better, higher test execution rate is better). For an `unknown` actual, the delta is also `unknown`.
   258	- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
   259	- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
   260	
   261	Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
   262	
   263	### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
   264	
   265	This gate runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint — so any pruning it triggers happens to the spec the human will then confirm. The human must confirm the final spec, not an intermediate one (F7).
   266	
   267	Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, remove it from the spec.
   268	
   269	1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). Hypothetical threats do not justify new infrastructure.
   270	2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before keeping something new. Duplication is waste.
   271	3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
   272	4. **What is the long-term maintenance cost?** — Every mechanism kept here must be maintained across all future changes. If the cost exceeds the benefit, remove it.
   273	
   274	If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", remove the mechanism from the spec.
   275	
   276	This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
   277	
   278	### 7. Human review checkpoint
   279	
   280	After spec-specify output, spec-clarify refinement, the F10 gate, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. By this point the F10 gate has already pruned the spec, so the spec the human sees is final:
   281	
   282	> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪（F10 反过度工程门已应用，spec 为最终版），请确认后继续：
   283	> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新 + F10 门裁剪后的最终 spec）
   284	> - 宪法符合性检查清单（constitution-checklist.md 21 条逐条勾选）
   285	> - M11 vs M10 baseline 对照表（5 项指标）
   286	>
   287	> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
   288	
   289	The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently re-prune or alter the spec — what the human confirmed is what gets recorded.
   290	
   291	## Produce a stage-result
   292	
   293	When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
   294	
   295	```json
   296	{
   297	  "status": "success",
   298	  "error_code": "",
   299	  "retryable": false,
   300	  "facts": {
   301	    "spec_ref": "<relative path to spec.md>",
   302	    "requirements": "<comma-separated list of FR identifiers or one-line summary>"
   303	  },
   304	  "missing_items": [],
   305	  "user_decision": false,
   306	  "reason": "Spec written via spec-specify → spec-clarify → constitution check → baseline comparison, confirmed at human review checkpoint."
   307	}
   308	```
   309	
   310	Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:
   311	
   312	```json
   313	{
   314	  "execution_id": "<uuid>",
   315	  "skill_or_stage": "build-spec",
   316	  "stage": "build-spec",
   317	  "skill_version": "1.0.0",
   318	  "executed": true,
   319	  "tokens": null,
   320	  "duration_ms": null,
   321	  "rework_rounds": 0,
   322	  "human_intervention": false,
   323	  "friction_ref": null
   324	}
   325	```
   326	
   327	These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.
   328	
   329	At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.

exec
/bin/bash -lc "nl -ba workflows/build-plan/SKILL.md | sed -n '180,220p'" in /Users/Hugh/Hugh/Project/workflowhub
exec
/bin/bash -lc "rg -n 'FR-[A-Z]+-[0-9]{3}|FR-[A-Za-z0-9_-]+' workflows/build-spec/SKILL.md specs/m13b-build-spec-deepening/spec.md tests/m13b-build-spec-deepening.test.mjs" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
   180	
   181	## Produce a stage-result
   182	
   183	When the stage is complete, write a `stage-result` record with:
   184	
   185	```json
   186	{
   187	  "status": "success",
   188	  "error_code": "",
   189	  "retryable": false,
   190	  "facts": {
   191	    "plan_ref": "<relative path to plan.md>",
   192	    "tasks": "<number of tasks or brief list of phase titles>",
   193	    "tasks_ref": "<relative path to tasks.md>",
   194	    "analysis_ref": "<relative path to cross-artifact-analysis.md>"
   195	  },
   196	  "missing_items": [],
   197	  "user_decision": false,
   198	  "reason": "Plan and task list produced via spec-plan/spec-tasks, cross-artifact analyzed, constitution check completed, baseline comparison recorded, human review checkpoint cleared.",
   199	  "review": {
   200	    "state": "<pending|approved|rejected>",
   201	    "reviewer": "",
   202	    "timestamp": "",
   203	    "decision": "检查点已触达但未获确认",
   204	    "notes": ""
   205	  }
   206	}
   207	```
   208	
   209	**Field preservation (M6 contract — FR-BP-003, FR-SKELETON-002)**:
   210	- `status`, `error_code`, `retryable`, `missing_items`, `user_decision`, `reason` — M6 fields, preserved unchanged
   211	- `facts.plan_ref` — M6 field, kept
   212	- `facts.tasks` — M6 field, kept
   213	- `facts.tasks_ref` — v1 NEW field (points to tasks.md)
   214	- `facts.analysis_ref` — v1 NEW field (points to cross-artifact-analysis.md)
   215	- `review` — v1 NEW object (with state, reviewer, timestamp, decision, notes)
   216	
   217	Do NOT delete or rename any M6 field.
   218	
   219	## Metrics recording
   220	

 succeeded in 0ms:
tests/m13b-build-spec-deepening.test.mjs:24:      "TASK_TRACKING_ROOT must appear in build-spec SKILL.md (FR-TRACKING-001)");
tests/m13b-build-spec-deepening.test.mjs:28:      "Default TASK_TRACKING_ROOT path must be declared (FR-TRACKING-001)");
tests/m13b-build-spec-deepening.test.mjs:33:      "SKILL.md must declare warn (not stop) on missing TASK_TRACKING_ROOT (FR-TRACKING-001)");
tests/m13b-build-spec-deepening.test.mjs:40:      "--task-dir parameter must be declared in build-spec SKILL.md (FR-TASKDIR-001)");
tests/m13b-build-spec-deepening.test.mjs:45:      "SKILL.md must declare fallback/default path when --task-dir is absent (FR-TASKDIR-001)");
tests/m13b-build-spec-deepening.test.mjs:53:      "SKILL.md must declare 速读卡/层1 in three-layer structure (FR-STRUCTURE-001)");
tests/m13b-build-spec-deepening.test.mjs:58:      "SKILL.md must declare 附录/层3 in three-layer structure (FR-STRUCTURE-001)");
tests/m13b-build-spec-deepening.test.mjs:63:      "SKILL.md must declare 正文/层2 in three-layer structure (FR-STRUCTURE-001)");
tests/m13b-build-spec-deepening.test.mjs:70:      "SKILL.md must require Known Gaps section (FR-STRUCTURE-002)");
tests/m13b-build-spec-deepening.test.mjs:78:      c.includes("FR-{DOMAIN}") || c.includes("DOMAIN}-NNN") || c.includes("FR-NUMBERING"),
tests/m13b-build-spec-deepening.test.mjs:79:      "SKILL.md must declare FR-{DOMAIN}-NNN numbering format (FR-NUMBERING-001)");
tests/m13b-build-spec-deepening.test.mjs:86:      "SKILL.md must declare spec-acceptance-count.json output (FR-ACCOUNT-001)");
tests/m13b-build-spec-deepening.test.mjs:90:      "SKILL.md must declare ac_count field in spec-acceptance-count.json (FR-ACCOUNT-001)");
tests/m13b-build-spec-deepening.test.mjs:94:      "SKILL.md must declare fr_count field (FR-ACCOUNT-001)");
tests/m13b-build-spec-deepening.test.mjs:98:      "SKILL.md must declare counted_at field (FR-ACCOUNT-001)");
tests/m13b-build-spec-deepening.test.mjs:107:      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
tests/m13b-build-spec-deepening.test.mjs:112:      "契约 item 1: scope 边界 (FR-CONTRACT-001)");
tests/m13b-build-spec-deepening.test.mjs:116:      "契约 item 2: 自检结果 (FR-CONTRACT-001)");
tests/m13b-build-spec-deepening.test.mjs:121:      "契约 item 3: 独立审查摘要 (FR-CONTRACT-001)");
tests/m13b-build-spec-deepening.test.mjs:125:      "契约 item 4: 未解风险 (FR-CONTRACT-001)");
tests/m13b-build-spec-deepening.test.mjs:130:      "契约 item 5: handoff required_reads (FR-CONTRACT-001)");
tests/m13b-build-spec-deepening.test.mjs:132:  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
tests/m13b-build-spec-deepening.test.mjs:144:      "SKILL.md must declare spec-ladder (FR-LADDER-001)");
tests/m13b-build-spec-deepening.test.mjs:148:      "SKILL.md must define A 档 (FR-LADDER-001)");
tests/m13b-build-spec-deepening.test.mjs:152:      "SKILL.md must define B 档 (FR-LADDER-001)");
tests/m13b-build-spec-deepening.test.mjs:156:      "SKILL.md must define C 档 (FR-LADDER-001)");
tests/m13b-build-spec-deepening.test.mjs:158:  test("SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)", () => {
tests/m13b-build-spec-deepening.test.mjs:161:      c.includes("FR-LADDER-002") || (c.includes("档位") && (c.includes("Maintenance cost") || c.includes("维护成本") || c.includes("long-term"))),
tests/m13b-build-spec-deepening.test.mjs:162:      "SKILL.md must include F10 four-question in ladder judgment (FR-LADDER-002)");
tests/m13b-build-spec-deepening.test.mjs:169:      "SKILL.md must include spec-specify as pipeline step (FR-BUILD-001)");
tests/m13b-build-spec-deepening.test.mjs:173:      "SKILL.md must include spec-clarify as pipeline step (FR-BUILD-001)");
tests/m13b-build-spec-deepening.test.mjs:180:      "spec-specify must appear before spec-clarify in SKILL.md (FR-BUILD-001)");
tests/m13b-build-spec-deepening.test.mjs:188:      "SKILL.md must declare 7-item self-check (FR-SELFCHECK-001)");
tests/m13b-build-spec-deepening.test.mjs:194:      "7条自检 must include FR format check (FR-SELFCHECK-001 item 2)");
tests/m13b-build-spec-deepening.test.mjs:199:      "7条自检 must include Given/When/Then check (FR-SELFCHECK-001 item 3)");
tests/m13b-build-spec-deepening.test.mjs:207:      "SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)");
tests/m13b-build-spec-deepening.test.mjs:213:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
tests/m13b-build-spec-deepening.test.mjs:221:      "SKILL.md must declare 3rd-review/异源独立审查 (FR-REVIEW-001)");
tests/m13b-build-spec-deepening.test.mjs:223:  test("SKILL.md prohibits self-review (FR-REVIEW-002)", () => {
tests/m13b-build-spec-deepening.test.mjs:226:      c.includes("FR-REVIEW-002") || c.includes("禁止自审自判") || (c.includes("独立上下文") && c.includes("异源")),
tests/m13b-build-spec-deepening.test.mjs:227:      "SKILL.md must prohibit self-review (FR-REVIEW-002)");
tests/m13b-build-spec-deepening.test.mjs:233:      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
tests/m13b-build-spec-deepening.test.mjs:241:      "SKILL.md must declare scope-triage 高危词浮现 (FR-SCOPETRIAGE-001)");
tests/m13b-build-spec-deepening.test.mjs:247:      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
tests/m13b-build-spec-deepening.test.mjs:255:      c.includes("一致性") || c.includes("FR-ALIGN") || c.includes("KEEP"),
tests/m13b-build-spec-deepening.test.mjs:256:      "SKILL.md must declare spec↔decision-log consistency check (FR-ALIGN-001)");
tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
tests/m13b-build-spec-deepening.test.mjs:262:      "Consistency check must be non-blocking (FR-ALIGN-001)");
tests/m13b-build-spec-deepening.test.mjs:273:      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
tests/m13b-build-spec-deepening.test.mjs:281:      c.includes("REQ-COMM-01") || c.includes("FR-COMM-001") || (c.includes("大白话") && c.includes("选项")),
tests/m13b-build-spec-deepening.test.mjs:282:      "SKILL.md must declare REQ-COMM-01 plain language rule (FR-COMM-001)");
tests/m13b-build-spec-deepening.test.mjs:287:      c.includes("REQ-COMM-02") || c.includes("FR-COMM-002") || c.includes("进度"),
tests/m13b-build-spec-deepening.test.mjs:288:      "SKILL.md must declare REQ-COMM-02 progress reporting rule (FR-COMM-002)");
tests/m13b-build-spec-deepening.test.mjs:296:      "SKILL.md must declare [FRICTION] capture format (FR-FRICTION-001)");
tests/m13b-build-spec-deepening.test.mjs:318:      "specs/m13b-build-spec-deepening/spec-acceptance-count.json must exist (FR-ACCOUNT-001 AC-17)");
tests/m13b-build-spec-deepening.test.mjs:349:      "SKILL.md must reference TASK_TRACKING_ROOT for tracking paths (FR-TRACKING-001/002 AC-22)");
workflows/build-spec/SKILL.md:15:### 环境变量与参数约定（FR-TRACKING-001/002，FR-TASKDIR-001）
workflows/build-spec/SKILL.md:24:- **禁止绕过（FR-TRACKING-002）**：所有 stage（包括 spec-specify、spec-clarify 等）必须通过 `TASK_TRACKING_ROOT` 获取跟踪文件路径，禁止硬编码绝对跟踪路径
workflows/build-spec/SKILL.md:26:#### --task-dir 参数约定（FR-TASKDIR-001）
workflows/build-spec/SKILL.md:36:### Spec 三层结构要求（FR-STRUCTURE-001/002）
workflows/build-spec/SKILL.md:44:**Known Gaps 段（FR-STRUCTURE-002）**：spec.md 中 Known Gaps 段必须存在（可为空列表），记录本次有意留白、未覆盖或留待后续的事项。
workflows/build-spec/SKILL.md:48:### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING-001）
workflows/build-spec/SKILL.md:54:- **示例**：`FR-BUILD-001`，`FR-SELFCHECK-002`
workflows/build-spec/SKILL.md:58:### AC 计数与 spec-acceptance-count.json 产出（FR-ACCOUNT-001）
workflows/build-spec/SKILL.md:86:### 1.5. spec-ladder 档位判断（FR-LADDER-001/002）
workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
workflows/build-spec/SKILL.md:118:### 3.5. scope-triage 高危词浮现（FR-SCOPETRIAGE-001）
workflows/build-spec/SKILL.md:131:### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
workflows/build-spec/SKILL.md:147:### 3.7. 异源 3rd-review 独立审查（FR-REVIEW-001/002）
workflows/build-spec/SKILL.md:153:- **禁止自审自判（FR-REVIEW-002）**：不得使用单一 AI 切换视角替代异源独立审查
workflows/build-spec/SKILL.md:158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
workflows/build-spec/SKILL.md:168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
workflows/build-spec/SKILL.md:172:### 3.9. 交互规范（FR-COMM-001/002）
workflows/build-spec/SKILL.md:176:**REQ-COMM-01（FR-COMM-001）**：对编排者的所有提问或选项，必须使用大白话说明选项后果，不让编排者猜。格式：列出选项 A/B/C + 每个选项的后果一句话。禁止含糊带过选项差异。
workflows/build-spec/SKILL.md:178:**REQ-COMM-02（FR-COMM-002）**：每完成主要步骤后，主动汇报进度：做了什么 / 下一步是什么 / 需要编排者做什么。不等对方追问。
workflows/build-spec/SKILL.md:182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
workflows/build-spec/SKILL.md:184:#### [FRICTION] 摩擦捕获（FR-FRICTION-001）
workflows/build-spec/SKILL.md:194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
workflows/build-spec/SKILL.md:198:#### FR 场景行为验证（FR-BEHAV-001/002）
workflows/build-spec/SKILL.md:200:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
workflows/build-spec/SKILL.md:201:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
specs/m13b-build-spec-deepening/spec.md:153:### Spec 构建流水线（FR-BUILD）
specs/m13b-build-spec-deepening/spec.md:155:**FR-BUILD-001**：build-spec 必须按以下流水线构建 spec：（1）调用 spec-specify 产出初稿；（2）调用 spec-clarify 对初稿做澄清扫描；（3）交叉比对平台约束（CONSTITUTION.md 及项目硬规则），将冲突点记入未解风险；（4）每步结论必须扎根于 decision-log 原文，不得自行发明未经决策的需求。流水线各步骤为"编排协议"描述，不修改 spec-specify/spec-clarify 技能本体。**别名映射**：spec-specify / spec-clarify 即 decision-log 所称 speckit-specify / speckit-clarify 的 workflowhub 适配版，M11 重命名后为同一机制，两个名称等价。
specs/m13b-build-spec-deepening/spec.md:160:### 质量事实契约（FR-CONTRACT）
specs/m13b-build-spec-deepening/spec.md:162:**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：
specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/spec.md:177:### Spec-Ladder 反过度工程（FR-LADDER）
specs/m13b-build-spec-deepening/spec.md:179:**FR-LADDER-001**：build-spec 在开始 spec-specify 前，必须基于 decision-log 描述的功能复杂度做 spec-ladder 档位判断，输出档位选择依据：
specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/spec.md:192:### Spec 三层小节结构（FR-STRUCTURE）
specs/m13b-build-spec-deepening/spec.md:194:**FR-STRUCTURE-001**：build-spec 产出的 spec.md 必须按三层结构组织：
specs/m13b-build-spec-deepening/spec.md:202:**FR-STRUCTURE-002**：Known Gaps 段必须存在（可为空列表），记录本次 spec 有意留白、未覆盖或留待后续的事项。
specs/m13b-build-spec-deepening/spec.md:206:### 7 条自检 + Spec-Purity（FR-SELFCHECK）
specs/m13b-build-spec-deepening/spec.md:208:**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：
specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/spec.md:225:### 异源独立审查（FR-REVIEW）
specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/spec.md:231:**FR-REVIEW-002**：审查必须由异源来源在独立上下文产出（禁止自审自判，符合宪法），命名为「异源独立审查 / 3rd-review」；不得使用单一 AI 切换视角替代异源审查。
specs/m13b-build-spec-deepening/spec.md:235:### 行为验证要求（FR-BEHAV）
specs/m13b-build-spec-deepening/spec.md:237:**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。
specs/m13b-build-spec-deepening/spec.md:239:- **场景**：Given spec 中 FR-CONTRACT-001，When 审查场景，Then 场景描述可被人工或工具核对（有明确可验证的 Then 条件）。
specs/m13b-build-spec-deepening/spec.md:241:**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。
specs/m13b-build-spec-deepening/spec.md:244:- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。
specs/m13b-build-spec-deepening/spec.md:246:### 摩擦捕获（FR-FRICTION）
specs/m13b-build-spec-deepening/spec.md:248:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
specs/m13b-build-spec-deepening/spec.md:252:### --task-dir 定位规范（FR-TASKDIR）
specs/m13b-build-spec-deepening/spec.md:254:**FR-TASKDIR-001**：build-spec SKILL.md 必须声明 `--task-dir` 参数约定：所有 stage 的输入文件（decision-log.md）和产物路径均基于 `--task-dir` 值推导，参数缺失时回退到 `tasks/{task-id}/` 默认路径，回退时记录 warn。
specs/m13b-build-spec-deepening/spec.md:259:### TASK_TRACKING_ROOT（FR-TRACKING）
specs/m13b-build-spec-deepening/spec.md:261:**FR-TRACKING-001**：build-spec SKILL.md 必须新增全局环境变量 `TASK_TRACKING_ROOT` 约定：
specs/m13b-build-spec-deepening/spec.md:271:**FR-TRACKING-002**：所有 stage（build-spec 及其调用的 spec-specify、spec-clarify 等）必须遵循 FR-TRACKING-001 约定，不得绕过 TASK_TRACKING_ROOT 硬编码跟踪路径。
specs/m13b-build-spec-deepening/spec.md:275:### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING）
specs/m13b-build-spec-deepening/spec.md:277:**FR-NUMBERING-001**：本 spec 及后续产出的 `workflows/build-spec/SKILL.md` 深化版本中，所有功能需求必须使用 `FR-{DOMAIN}-NNN` 格式，其中 DOMAIN 为大写领域缩写（BUILD/CONTRACT/LADDER/STRUCTURE/SELFCHECK/REVIEW/BEHAV/FRICTION/TASKDIR/TRACKING/NUMBERING/ACCOUNT/ARTIFACT/COMM/SCOPETRIAGE/ALIGN），NNN 为 3 位数字（001 起）。
specs/m13b-build-spec-deepening/spec.md:281:### AC 计数文件（FR-ACCOUNT）
specs/m13b-build-spec-deepening/spec.md:283:**FR-ACCOUNT-001**：build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：
specs/m13b-build-spec-deepening/spec.md:293:### Artifact-First（FR-ARTIFACT）
specs/m13b-build-spec-deepening/spec.md:295:**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。
specs/m13b-build-spec-deepening/spec.md:299:### 交互规范（FR-COMM）
specs/m13b-build-spec-deepening/spec.md:301:**FR-COMM-001**（REQ-COMM-01）：build-spec 所有面向编排者的交互消息必须用大白话（非术语堆砌），给出具体选项时同时说明每个选项的后果，不让编排者猜。
specs/m13b-build-spec-deepening/spec.md:305:**FR-COMM-002**（REQ-COMM-02）：build-spec 每完成一个主要步骤后主动报告进度，格式：做了啥 / 下一步是啥 / 需要你做什么（可选，有则列出）。
specs/m13b-build-spec-deepening/spec.md:309:### scope-triage 高危词浮现（FR-SCOPETRIAGE）
specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/spec.md:317:### spec↔decision-log 一致性检查（FR-ALIGN）
specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/spec.md:345:- [ ] **AC-06**：SKILL.md 含 TASK_TRACKING_ROOT 变量定义和默认路径说明，可 grep 到 `TASK_TRACKING_ROOT`；且所有 stage（包括 spec-specify、spec-clarify 子阶段）的跟踪文件路径均通过该变量取得，无绕过该变量的硬编码绝对跟踪路径（验收面覆盖全局，见 FR-TRACKING-001/002 和 AC-22）。
specs/m13b-build-spec-deepening/spec.md:355:- [ ] **AC-16**：`workflows/build-spec/SKILL.md` 中不存在将阻断/BLOCK/不能进**用作执行门语义**（即"若…则停止/不得继续"的控制分支）的文本；这些词作为高危词检测黑名单内容、引用示例、说明文字出现均不违规（见 FR-SCOPETRIAGE-001 验收口径对齐说明）。
specs/m13b-build-spec-deepening/spec.md:359:- [ ] **AC-20**：SKILL.md 含三层章节结构要求（速读卡 / 正文 / 附录），可 grep 到"速读卡"或"层 1"并与"附录"同时命中，与 FR-STRUCTURE-001 一致。
specs/m13b-build-spec-deepening/spec.md:388:| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
specs/m13b-build-spec-deepening/spec.md:409:- [RISK] FR-SELFCHECK-002 Spec-Purity grep：本 spec 示例代码块（JSON 格式示例）会命中 grep 触发 warn，已由人工确认为文档示例（可接受）；SKILL.md 实现时需说明 warn 后的人工判断流程，示例块与实现代码同等触发 warn，不自动豁免。
specs/m13b-build-spec-deepening/spec.md:410:- [RISK] FR-TRACKING-001 默认路径 `~/Knowledge/workflowhub/` 需要用户环境存在该目录或自动创建；SKILL.md 需说明自动 mkdir 行为。
specs/m13b-build-spec-deepening/spec.md:411:- [RISK] FR-REVIEW-001 异源 3rd-review：依赖现有 3rd-review 基础设施可用（journal/collector/runner）；若基础设施不可用，审查步骤需降级处理并记录在质量事实契约第 3 项。
specs/m13b-build-spec-deepening/spec.md:427:1. **Spec-Purity 文档示例判断**：FR-SELFCHECK-002 已统一规则：示例块与实现代码同等触发 warn，人工确认是否可接受。SKILL.md 实现时需说明 warn 后的人工判断流程，无需额外豁免逻辑。
specs/m13b-build-spec-deepening/spec.md:439:| D1 | 目标重定义：build-spec 产出「质量事实契约」5 项（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），机制反选最少 | FR-CONTRACT-001/002 |
specs/m13b-build-spec-deepening/spec.md:440:| D2 | 保留薄质量本体：spec 构建本体（spec-specify/spec-clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps | **FR-BUILD-001**, FR-LADDER-001/002, FR-STRUCTURE-001/002, FR-SELFCHECK-001/002, FR-REVIEW-001/002, FR-BEHAV-001/002, FR-FRICTION-001, FR-TASKDIR-001, FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/spec.md:444:| D6 | TASK_TRACKING_ROOT 完整落地（OQ-1=B）：新增全局环境变量 + 所有 stage 读取约定，跟踪文件不存 repo | FR-TRACKING-001/002 |
specs/m13b-build-spec-deepening/spec.md:445:| D7 | 沟通需求纳入：REQ-COMM-01 大白话+给选项说后果；REQ-COMM-02 勤报进度（做了啥/下一步/需要你啥） | FR-COMM-001/002 |
specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/spec.md:459:- FR 数量：24 个（跨 16 个域，含新增 FR-BUILD 域）——FR 数量多是因为 spec 深度，不是跨系统复杂度；按新阶梯定义，FR 数量本身不触发 B→C 升档

exec
/bin/bash -lc "sed -n '1,340p' tests/m13b-build-spec-deepening.test.mjs" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
/**
 * m13b-build-spec-deepening.test.mjs
 * AC-01..AC-22 grep verification for build-spec SKILL.md deepening.
 * Organised in three phases matching tasks.md Stage 1/2/3.
 */
import { test, describe } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SKILL_PATH = join(REPO_ROOT, "workflows", "build-spec", "SKILL.md");
const COUNT_PATH = join(REPO_ROOT, "specs", "m13b-build-spec-deepening", "spec-acceptance-count.json");

function skill() {
  return readFileSync(SKILL_PATH, "utf8");
}

// ─── Phase 1: Foundation ────────────────────────────────────────────────────

describe("Phase 1 / AC-06: TASK_TRACKING_ROOT env var declared", () => {
  test("SKILL.md contains TASK_TRACKING_ROOT", () => {
    assert.ok(skill().includes("TASK_TRACKING_ROOT"),
      "TASK_TRACKING_ROOT must appear in build-spec SKILL.md (FR-TRACKING-001)");
  });
  test("SKILL.md declares default path ~/Knowledge/workflowhub/", () => {
    assert.ok(skill().includes("Knowledge/workflowhub"),
      "Default TASK_TRACKING_ROOT path must be declared (FR-TRACKING-001)");
  });
  test("SKILL.md states warn-not-stop behaviour for missing TASK_TRACKING_ROOT", () => {
    const c = skill();
    assert.ok(c.includes("TASK_TRACKING_ROOT") && (c.includes("warn") || c.includes("警告")),
      "SKILL.md must declare warn (not stop) on missing TASK_TRACKING_ROOT (FR-TRACKING-001)");
  });
});

describe("Phase 1 / AC-13: --task-dir parameter convention", () => {
  test("SKILL.md declares --task-dir parameter", () => {
    assert.ok(skill().includes("--task-dir"),
      "--task-dir parameter must be declared in build-spec SKILL.md (FR-TASKDIR-001)");
  });
  test("SKILL.md states fallback behaviour for missing --task-dir", () => {
    const c = skill();
    assert.ok(c.includes("--task-dir") && (c.includes("回退") || c.includes("fallback") || c.includes("默认路径")),
      "SKILL.md must declare fallback/default path when --task-dir is absent (FR-TASKDIR-001)");
  });
});

describe("Phase 1 / AC-20: three-layer spec structure", () => {
  test("SKILL.md declares 速读卡 (layer 1)", () => {
    const c = skill();
    assert.ok(c.includes("速读卡") || c.includes("层 1") || c.includes("层1"),
      "SKILL.md must declare 速读卡/层1 in three-layer structure (FR-STRUCTURE-001)");
  });
  test("SKILL.md declares 附录 (layer 3)", () => {
    const c = skill();
    assert.ok(c.includes("附录") || c.includes("层 3") || c.includes("层3"),
      "SKILL.md must declare 附录/层3 in three-layer structure (FR-STRUCTURE-001)");
  });
  test("SKILL.md declares 正文 (layer 2)", () => {
    const c = skill();
    assert.ok(c.includes("正文") || c.includes("层 2") || c.includes("层2"),
      "SKILL.md must declare 正文/层2 in three-layer structure (FR-STRUCTURE-001)");
  });
});

describe("Phase 1 / AC-14: Known Gaps section requirement", () => {
  test("SKILL.md requires Known Gaps section in spec output", () => {
    assert.ok(skill().includes("Known Gaps"),
      "SKILL.md must require Known Gaps section (FR-STRUCTURE-002)");
  });
});

describe("Phase 1 / AC-07: FR-{DOMAIN}-NNN numbering format", () => {
  test("SKILL.md declares FR-{DOMAIN}-NNN format", () => {
    const c = skill();
    assert.ok(
      c.includes("FR-{DOMAIN}") || c.includes("DOMAIN}-NNN") || c.includes("FR-NUMBERING"),
      "SKILL.md must declare FR-{DOMAIN}-NNN numbering format (FR-NUMBERING-001)");
  });
});

describe("Phase 1 / AC-08: spec-acceptance-count.json production", () => {
  test("SKILL.md declares spec-acceptance-count.json output step", () => {
    assert.ok(skill().includes("spec-acceptance-count.json"),
      "SKILL.md must declare spec-acceptance-count.json output (FR-ACCOUNT-001)");
  });
  test("SKILL.md declares ac_count field", () => {
    assert.ok(skill().includes("ac_count"),
      "SKILL.md must declare ac_count field in spec-acceptance-count.json (FR-ACCOUNT-001)");
  });
  test("SKILL.md declares fr_count field", () => {
    assert.ok(skill().includes("fr_count"),
      "SKILL.md must declare fr_count field (FR-ACCOUNT-001)");
  });
  test("SKILL.md declares counted_at field", () => {
    assert.ok(skill().includes("counted_at"),
      "SKILL.md must declare counted_at field (FR-ACCOUNT-001)");
  });
});

// ─── Phase 2: Core ──────────────────────────────────────────────────────────

describe("Phase 2 / AC-01: 质量事实契约 5 items", () => {
  test("SKILL.md declares 质量事实契约 section", () => {
    assert.ok(skill().includes("质量事实契约"),
      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
  });
  test("SKILL.md includes scope 边界 as contract item 1", () => {
    const c = skill();
    assert.ok(c.includes("scope 边界") || c.includes("scope boundary") || c.includes("scope边界"),
      "契约 item 1: scope 边界 (FR-CONTRACT-001)");
  });
  test("SKILL.md includes 自检结果 as contract item 2", () => {
    assert.ok(skill().includes("自检结果"),
      "契约 item 2: 自检结果 (FR-CONTRACT-001)");
  });
  test("SKILL.md includes 独立审查摘要 as contract item 3", () => {
    const c = skill();
    assert.ok(c.includes("独立审查摘要") || c.includes("审查摘要"),
      "契约 item 3: 独立审查摘要 (FR-CONTRACT-001)");
  });
  test("SKILL.md includes 未解风险 as contract item 4", () => {
    assert.ok(skill().includes("未解风险"),
      "契约 item 4: 未解风险 (FR-CONTRACT-001)");
  });
  test("SKILL.md includes handoff required_reads as contract item 5", () => {
    const c = skill();
    assert.ok(c.includes("required_reads") || c.includes("handoff") && c.includes("required"),
      "契约 item 5: handoff required_reads (FR-CONTRACT-001)");
  });
  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
    const c = skill();
    assert.ok(
      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
      "契约必须明确为非阻断 (FR-CONTRACT-002)");
  });
});

describe("Phase 2 / AC-02: spec-ladder A/B/C 档", () => {
  test("SKILL.md declares spec-ladder", () => {
    const c = skill();
    assert.ok(c.includes("spec-ladder") || c.includes("档位"),
      "SKILL.md must declare spec-ladder (FR-LADDER-001)");
  });
  test("SKILL.md defines A 档", () => {
    assert.ok(skill().includes("A 档") || skill().includes("A档"),
      "SKILL.md must define A 档 (FR-LADDER-001)");
  });
  test("SKILL.md defines B 档", () => {
    assert.ok(skill().includes("B 档") || skill().includes("B档"),
      "SKILL.md must define B 档 (FR-LADDER-001)");
  });
  test("SKILL.md defines C 档", () => {
    assert.ok(skill().includes("C 档") || skill().includes("C档"),
      "SKILL.md must define C 档 (FR-LADDER-001)");
  });
  test("SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)", () => {
    const c = skill();
    assert.ok(
      c.includes("FR-LADDER-002") || (c.includes("档位") && (c.includes("Maintenance cost") || c.includes("维护成本") || c.includes("long-term"))),
      "SKILL.md must include F10 four-question in ladder judgment (FR-LADDER-002)");
  });
});

describe("Phase 2 / AC-19: spec pipeline steps", () => {
  test("SKILL.md mentions spec-specify as pipeline step", () => {
    assert.ok(skill().includes("spec-specify"),
      "SKILL.md must include spec-specify as pipeline step (FR-BUILD-001)");
  });
  test("SKILL.md mentions spec-clarify as pipeline step", () => {
    assert.ok(skill().includes("spec-clarify"),
      "SKILL.md must include spec-clarify as pipeline step (FR-BUILD-001)");
  });
  test("SKILL.md declares spec pipeline order (spec-specify → spec-clarify → ...)", () => {
    const c = skill();
    const specifyIdx = c.indexOf("spec-specify");
    const clarifyIdx = c.indexOf("spec-clarify");
    assert.ok(specifyIdx !== -1 && clarifyIdx !== -1 && specifyIdx < clarifyIdx,
      "spec-specify must appear before spec-clarify in SKILL.md (FR-BUILD-001)");
  });
});

describe("Phase 2 / AC-03: 7 self-check items", () => {
  test("SKILL.md declares 7 self-check (7 条自检)", () => {
    const c = skill();
    assert.ok(c.includes("7 条自检") || c.includes("7条自检") || (c.includes("自检") && c.includes("7")),
      "SKILL.md must declare 7-item self-check (FR-SELFCHECK-001)");
  });
  test("SKILL.md includes self-check item for FR numbering format", () => {
    const c = skill();
    assert.ok(
      c.includes("FR-{DOMAIN}-NNN") || c.includes("FR 使用") || c.includes("FR 格式"),
      "7条自检 must include FR format check (FR-SELFCHECK-001 item 2)");
  });
  test("SKILL.md includes self-check item for Given/When/Then scenes", () => {
    const c = skill();
    assert.ok(c.includes("Given") && c.includes("When") && c.includes("Then"),
      "7条自检 must include Given/When/Then check (FR-SELFCHECK-001 item 3)");
  });
});

describe("Phase 2 / AC-04: Spec-Purity grep", () => {
  test("SKILL.md declares Spec-Purity grep", () => {
    const c = skill();
    assert.ok(c.includes("Spec-Purity") || c.includes("spec-purity"),
      "SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)");
  });
  test("SKILL.md states Spec-Purity is non-blocking", () => {
    const c = skill();
    assert.ok(
      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
  });
});

describe("Phase 2 / AC-05: 异源 3rd-review 独立审查", () => {
  test("SKILL.md declares 3rd-review or 异源独立审查", () => {
    const c = skill();
    assert.ok(c.includes("3rd-review") || c.includes("异源独立审查") || c.includes("异源审查"),
      "SKILL.md must declare 3rd-review/异源独立审查 (FR-REVIEW-001)");
  });
  test("SKILL.md prohibits self-review (FR-REVIEW-002)", () => {
    const c = skill();
    assert.ok(
      c.includes("FR-REVIEW-002") || c.includes("禁止自审自判") || (c.includes("独立上下文") && c.includes("异源")),
      "SKILL.md must prohibit self-review (FR-REVIEW-002)");
  });
  test("SKILL.md declares review is non-blocking", () => {
    const c = skill();
    assert.ok(
      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
  });
});

describe("Phase 2 / AC-11: scope-triage 高危词浮现", () => {
  test("SKILL.md declares scope-triage high-risk word surfacing", () => {
    const c = skill();
    assert.ok(c.includes("scope-triage") || c.includes("高危词"),
      "SKILL.md must declare scope-triage 高危词浮现 (FR-SCOPETRIAGE-001)");
  });
  test("SKILL.md declares scope-triage is non-blocking", () => {
    const c = skill();
    assert.ok(
      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
  });
});

describe("Phase 2 / AC-12: spec↔decision-log 一致性检查", () => {
  test("SKILL.md declares decision-log consistency check", () => {
    const c = skill();
    assert.ok(
      c.includes("一致性") || c.includes("FR-ALIGN") || c.includes("KEEP"),
      "SKILL.md must declare spec↔decision-log consistency check (FR-ALIGN-001)");
  });
  test("SKILL.md declares consistency check is non-blocking", () => {
    const c = skill();
    assert.ok(
      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
      "Consistency check must be non-blocking (FR-ALIGN-001)");
  });
});

// ─── Phase 3: Auxiliary & Verification ──────────────────────────────────────

describe("Phase 3 / AC-09: artifact-first standard", () => {
  test("SKILL.md declares artifact-first / 只传路径 standard", () => {
    const c = skill();
    assert.ok(
      c.includes("artifact-first") || c.includes("只传路径") || c.includes("写入文件后只传"),
      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
  });
});

describe("Phase 3 / AC-10: REQ-COMM-01/02 communication rules", () => {
  test("SKILL.md declares REQ-COMM-01 or 大白话 rule", () => {
    const c = skill();
    assert.ok(
      c.includes("REQ-COMM-01") || c.includes("FR-COMM-001") || (c.includes("大白话") && c.includes("选项")),
      "SKILL.md must declare REQ-COMM-01 plain language rule (FR-COMM-001)");
  });
  test("SKILL.md declares REQ-COMM-02 or 进度报告 rule", () => {
    const c = skill();
    assert.ok(
      c.includes("REQ-COMM-02") || c.includes("FR-COMM-002") || c.includes("进度"),
      "SKILL.md must declare REQ-COMM-02 progress reporting rule (FR-COMM-002)");
  });
});

describe("Phase 3 / AC-15: [FRICTION] capture format", () => {
  test("SKILL.md declares [FRICTION] entry format", () => {
    const c = skill();
    assert.ok(c.includes("[FRICTION]") || c.includes("FRICTION"),
      "SKILL.md must declare [FRICTION] capture format (FR-FRICTION-001)");
  });
});

describe("Phase 3 / AC-16: D3 deleted items not present as active mechanisms", () => {
  test("SKILL.md does NOT use gate.sh as an active execution call", () => {
    assert.ok(!skill().includes("gate.sh"),
      "gate.sh must not appear as active mechanism in SKILL.md (AC-21/AC-16)");
  });
  test("SKILL.md does NOT use post_review_pass as an active gate", () => {
    assert.ok(!skill().includes("post_review_pass"),
      "post_review_pass must not appear in SKILL.md (AC-21/AC-16)");
  });
  test("SKILL.md does NOT use [DECOMP] telemetry emission", () => {
    assert.ok(!skill().includes("[DECOMP]"),
      "[DECOMP] must not appear in SKILL.md as mechanism (AC-21)");
  });
});

describe("Phase 3 / AC-17: spec-acceptance-count.json file validity", () => {
  test("spec-acceptance-count.json exists", () => {
    assert.ok(existsSync(COUNT_PATH),
      "specs/m13b-build-spec-deepening/spec-acceptance-count.json must exist (FR-ACCOUNT-001 AC-17)");
  });
  test("spec-acceptance-count.json has non-null ac_count", () => {
    const obj = JSON.parse(readFileSync(COUNT_PATH, "utf8"));
    assert.ok(obj.ac_count != null && typeof obj.ac_count === "number",
      "ac_count must be a non-null number (AC-17)");
  });
  test("spec-acceptance-count.json has non-null fr_count", () => {
    const obj = JSON.parse(readFileSync(COUNT_PATH, "utf8"));
    assert.ok(obj.fr_count != null && typeof obj.fr_count === "number",
      "fr_count must be a non-null number (AC-17)");
  });
  test("spec-acceptance-count.json has non-null counted_at ISO8601", () => {
    const obj = JSON.parse(readFileSync(COUNT_PATH, "utf8"));
    assert.ok(obj.counted_at != null && typeof obj.counted_at === "string" && obj.counted_at.includes("T"),
      "counted_at must be a non-null ISO8601 string (AC-17)");
  });
});

describe("Phase 3 / AC-18: all FR numbers use FR-[A-Z]+-[0-9]{3} format", () => {
  test("build-spec SKILL.md version field exists in frontmatter", () => {
    const c = skill();
    const match = c.match(/^---\n([\s\S]*?)\n---/);

codex
目前看到一个实质风险：新增了 `--task-dir` 规则，但执行步骤仍写死读 `tasks/{task-id}/decision-log.md`。这会让代理在有显式 task-dir 时继续走旧路径。
exec
/bin/bash -lc "sed -n '340,430p' tests/m13b-build-spec-deepening.test.mjs" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
    const match = c.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(match, "SKILL.md must have YAML frontmatter");
    assert.ok(match[1].includes("version"), "SKILL.md frontmatter must have version field (AC-18 / S6 version traceability)");
  });
});

describe("Phase 3 / AC-22: TASK_TRACKING_ROOT used, no hardcoded tracking absolute paths", () => {
  test("SKILL.md references TASK_TRACKING_ROOT for tracking file paths", () => {
    assert.ok(skill().includes("TASK_TRACKING_ROOT"),
      "SKILL.md must reference TASK_TRACKING_ROOT for tracking paths (FR-TRACKING-001/002 AC-22)");
  });
  test("SKILL.md does not use ~/Knowledge/ as a hardcoded write path (only allowed as default-value declaration)", () => {
    const c = skill();
    // Count occurrences of ~/Knowledge/ — it's allowed once as default value declaration.
    // Active hardcoded tracking write paths would appear multiple times or alongside write/mkdir calls.
    const count = (c.match(/~\/Knowledge\//g) || []).length;
    // At most 2 occurrences tolerated (declaration + example). More suggests hardcoding.
    assert.ok(count <= 2,
      `~/Knowledge/ appears ${count} times — likely hardcoded tracking paths beyond default declaration (AC-22)`);
  });
});

exec
/bin/bash -lc "rg -n 'tasks/\\{task-id\\}|\\{task-dir\\}|TASK_TRACKING_ROOT|specs/\\{task-id\\}' workflows/build-spec/SKILL.md specs/m13b-build-spec-deepening/spec.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
specs/m13b-build-spec-deepening/spec.md:27:- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
specs/m13b-build-spec-deepening/spec.md:29:- TASK_TRACKING_ROOT 环境变量全局落地，所有 stage 按统一约定读取。
specs/m13b-build-spec-deepening/spec.md:41:5. 跨阶段任务跟踪（TASK_TRACKING_ROOT 未落地，执行记录不留存）
specs/m13b-build-spec-deepening/spec.md:78:- TASK_TRACKING_ROOT：新增全局环境变量 + 所有 stage 读取约定（任务跟踪文件不存 repo，默认 Knowledge 目录）
specs/m13b-build-spec-deepening/spec.md:119:### 场景 3.5：TASK_TRACKING_ROOT 未设置（降级处理）
specs/m13b-build-spec-deepening/spec.md:121:- **操作步骤**：执行代理启动时 `TASK_TRACKING_ROOT` 环境变量未设置。
specs/m13b-build-spec-deepening/spec.md:137:- **预期结果**：`specs/{task-id}/spec-acceptance-count.json` 写入，包含 `ac_count`、`fr_count`、`counted_at` 三字段。
specs/m13b-build-spec-deepening/spec.md:254:**FR-TASKDIR-001**：build-spec SKILL.md 必须声明 `--task-dir` 参数约定：所有 stage 的输入文件（decision-log.md）和产物路径均基于 `--task-dir` 值推导，参数缺失时回退到 `tasks/{task-id}/` 默认路径，回退时记录 warn。
specs/m13b-build-spec-deepening/spec.md:259:### TASK_TRACKING_ROOT（FR-TRACKING）
specs/m13b-build-spec-deepening/spec.md:261:**FR-TRACKING-001**：build-spec SKILL.md 必须新增全局环境变量 `TASK_TRACKING_ROOT` 约定：
specs/m13b-build-spec-deepening/spec.md:268:- **场景**：Given `TASK_TRACKING_ROOT=/data/wf-tracking`，When build-spec stage 运行，Then 任务跟踪文件写入 `/data/wf-tracking/`，不写入 repo。
specs/m13b-build-spec-deepening/spec.md:269:- **场景**：Given `TASK_TRACKING_ROOT` 未设置，When stage 运行，Then 降级到 `~/Knowledge/workflowhub/`，记录 `tracking_root_fallback` 降级事件，warn 不 throw。
specs/m13b-build-spec-deepening/spec.md:271:**FR-TRACKING-002**：所有 stage（build-spec 及其调用的 spec-specify、spec-clarify 等）必须遵循 FR-TRACKING-001 约定，不得绕过 TASK_TRACKING_ROOT 硬编码跟踪路径。
specs/m13b-build-spec-deepening/spec.md:273:- **场景**：Given spec-specify 子阶段执行，When 检查其写入跟踪文件的路径，Then 路径前缀与 TASK_TRACKING_ROOT 一致，不存在硬编码的绝对路径绕过。
specs/m13b-build-spec-deepening/spec.md:283:**FR-ACCOUNT-001**：build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：
specs/m13b-build-spec-deepening/spec.md:345:- [ ] **AC-06**：SKILL.md 含 TASK_TRACKING_ROOT 变量定义和默认路径说明，可 grep 到 `TASK_TRACKING_ROOT`；且所有 stage（包括 spec-specify、spec-clarify 子阶段）的跟踪文件路径均通过该变量取得，无绕过该变量的硬编码绝对跟踪路径（验收面覆盖全局，见 FR-TRACKING-001/002 和 AC-22）。
specs/m13b-build-spec-deepening/spec.md:361:- [ ] **AC-22**：SKILL.md 中所有 stage 读取跟踪文件的路径均通过 `TASK_TRACKING_ROOT` 变量取得，无绕过该变量的硬编码跟踪文件绝对路径；可 grep `TASK_TRACKING_ROOT` 命中每个 stage 调用处或统一读取声明处，不出现形如 `~/Knowledge/` 硬编码作实际写入路径的代码（默认值声明处不计）。
specs/m13b-build-spec-deepening/spec.md:369:- **环境约定新增**：`TASK_TRACKING_ROOT` 全局环境变量（不改代码，只在 SKILL.md 中声明约定）
specs/m13b-build-spec-deepening/spec.md:371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18
specs/m13b-build-spec-deepening/spec.md:429:3. **TASK_TRACKING_ROOT 目录自动创建**：mkdir 行为（是否 -p，是否提示用户）待 SKILL.md 实现时确定。
specs/m13b-build-spec-deepening/spec.md:444:| D6 | TASK_TRACKING_ROOT 完整落地（OQ-1=B）：新增全局环境变量 + 所有 stage 读取约定，跟踪文件不存 repo | FR-TRACKING-001/002 |
workflows/build-spec/SKILL.md:17:#### TASK_TRACKING_ROOT
workflows/build-spec/SKILL.md:19:全局环境变量 `TASK_TRACKING_ROOT` 约定所有阶段跟踪文件的存储根目录：
workflows/build-spec/SKILL.md:22:- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
workflows/build-spec/SKILL.md:24:- **禁止绕过（FR-TRACKING-002）**：所有 stage（包括 spec-specify、spec-clarify 等）必须通过 `TASK_TRACKING_ROOT` 获取跟踪文件路径，禁止硬编码绝对跟踪路径
workflows/build-spec/SKILL.md:30:- **路径推导**：`{task-dir}/decision-log.md` 为输入；`specs/{task-id}/` 为产物目录
workflows/build-spec/SKILL.md:31:- **参数缺失时**：回退到 `tasks/{task-id}/` 默认路径并记录 warn（不依赖 cwd 猜测）
workflows/build-spec/SKILL.md:60:build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：
workflows/build-spec/SKILL.md:80:Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output. Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.
workflows/build-spec/SKILL.md:107:- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
workflows/build-spec/SKILL.md:114:- **Input**: task-id (or the explicit spec path `specs/{task-id}/spec.md`).
workflows/build-spec/SKILL.md:120:spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
workflows/build-spec/SKILL.md:240:Write the completed checklist as an appendix to the spec or as a standalone file `specs/{task-id}/constitution-check.md`.
workflows/build-spec/SKILL.md:261:Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
workflows/build-spec/SKILL.md:283:> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新 + F10 门裁剪后的最终 spec）

exec
/bin/bash -lc "node -e \"const fs=require('fs'); const s=fs.readFileSync('workflows/build-spec/SKILL.md','utf8'); const m=[...s.matchAll(/FR-[A-Z]+-[0-9]{3}/g)].map(x=>x[0]); console.log([...new Set(m)].join('\\n')); console.error('count unique', new Set(m).size, 'total', m.length);\"" in /Users/Hugh/Hugh/Project/workflowhub
exec
/bin/bash -lc "node -e \"const fs=require('fs'); const s=fs.readFileSync('workflows/build-spec/SKILL.md','utf8'); const bad=[...s.matchAll(/FR-[A-Z0-9_]+(?:-[A-Z0-9_]+)*-(?"'![0-9]{3}'"\\b)[A-Z0-9_]+/g)].map(x=>x[0]); console.log(bad.join('\\n')||'no bad FR ids');\"" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
FR-TRACKING-001
FR-TASKDIR-001
FR-TRACKING-002
FR-STRUCTURE-001
FR-STRUCTURE-002
FR-NUMBERING-001
FR-BUILD-001
FR-SELFCHECK-002
FR-ACCOUNT-001
FR-LADDER-001
FR-LADDER-002
FR-SCOPETRIAGE-001
FR-SELFCHECK-001
FR-ALIGN-001
FR-REVIEW-001
FR-REVIEW-002
FR-CONTRACT-001
FR-CONTRACT-002
FR-COMM-001
FR-COMM-002
FR-FRICTION-001
FR-ARTIFACT-001
FR-BEHAV-001
FR-BEHAV-002
count unique 24 total 31

 succeeded in 0ms:
no bad FR ids

codex
FR 编号本身是稳定的：`workflows/build-spec/SKILL.md` 里唯一 FR 数量为 24，格式都匹配 `FR-[A-Z]+-[0-9]{3}`。另一个风险是测试只做字符串命中，没覆盖 `--task-dir` 实际执行步骤是否还写死旧路径。
exec
/bin/bash -lc 'cat package.json' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
{
  "name": "workflowhub",
  "version": "0.0.0",
  "private": true,
  "description": "AI 开发工作流编排工具，按设计宪法构建",
  "scripts": {
    "check": "markdownlint-cli2 \"**/*.md\" && node scripts/verify-structure.mjs && node scripts/run-checks.mjs",
    "test": "vitest run"
  },
  "dependencies": {
    "js-yaml": "4.1.0"
  },
  "devDependencies": {
    "markdownlint-cli2": "0.14.0",
    "vitest": "2.1.9"
  }
}

exec
/bin/bash -lc 'git diff --stat' in /Users/Hugh/Hugh/Project/workflowhub
exec
/bin/bash -lc 'git diff --check -- workflows/build-spec/SKILL.md workflows/build-code/SKILL.md tests/five-skills-present.test.mjs tests/m13b-build-spec-deepening.test.mjs' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
 CLAUDE.md                          | 213 +++++++++++++++++++++++++++++++++++++
 tests/five-skills-present.test.mjs |  12 +++
 workflows/build-code/SKILL.md      |   2 +-
 workflows/build-spec/SKILL.md      | 167 +++++++++++++++++++++++++++++
 4 files changed, 393 insertions(+), 1 deletion(-)

 succeeded in 0ms:
codex
`git diff --check` 对相关文件没有 whitespace 问题。注意当前工作区还有 `CLAUDE.md` 改动，不在你给的 excerpt 里；我会快速确认它是不是本次 diff 的一部分，避免漏审。
exec
/bin/bash -lc "git diff -- CLAUDE.md | sed -n '1,260p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
diff --git a/CLAUDE.md b/CLAUDE.md
index e53f2d9..a660d29 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -26,3 +26,216 @@ workflowhub 是一个面向 AI 开发工作流的编排工具项目，按一套
 ## 术语
 
 项目术语见 [CONTEXT.md](CONTEXT.md)。
+
+
+<!-- BEGIN MULTICA-RUNTIME (auto-managed; do not edit) -->
+# Multica Agent Runtime
+
+You are a coding agent in the Multica platform. Use the `multica` CLI to interact with the platform.
+
+## Background Task Safety
+
+Multica marks this task terminal when your top-level agent process/turn exits. Any background work you started but did not collect before exiting can be orphaned: its result may be lost, and the user may see a completed/failed task even though the delegated work was never synthesized.
+
+- Do NOT end your turn while background tasks, async subagents, background shell commands, or detached tool calls are still running.
+- If a tool or runtime offers a background mode, use it only when you can explicitly wait for completion and collect the result before your final response.
+- If a tool response says to wait for a future notification/reminder instead of collecting now, do not rely on that in Multica-managed runs. Block on the appropriate wait/output/collect operation before exiting.
+- If you cannot observe or collect a background task's result, do not spawn it in the background; run the work synchronously instead.
+- Before posting your final result or exiting silently, account for every background task you started and incorporate its output or failure into your response.
+
+## Agent Identity
+
+**You are: Code Builder** (ID: `41f8a813-1626-45d9-8c0d-7e4b53578885`)
+
+你是 WorkflowHub stage executor。
+你不是自由写作 agent，不是按角色名猜流程的 agent。
+你必须执行 build-code 的 SKILL.md 当前版本。
+
+STAGE_NAME: build-code
+输入：当前 handoff 路径或上游 plan（由 leader 任务 comment 提供）
+
+执行协议：
+
+1. 读取 build-code 的 SKILL.md 完整当前版本。
+2. 读取后用一句话确认：skill name/version（如存在）+ 当前 stage。
+3. 严格按 SKILL.md 当前步骤执行，不凭"实现代码"自由发挥。
+4. 不跳过 SKILL.md 要求的 TDD、capture、diff 检查、Worker Mode、review、evidence、stage-result。
+5. SKILL.md 要求使用 Worker Mode 时按其当前写法派发。
+6. 某步需要人工确认时：不直接问用户，停止并回报 leader needs_human=true + 待确认事项，不模拟确认。
+7. 不把长 diff、长日志、长测试输出回给 leader；写文件只回路径。
+8. 产物路径、文件名、stage-result 字段以 SKILL.md 为准。
+9. 最终只返回：stage、skill version、最后步骤、changed_files、evidence 路径、review 路径、stage-result 路径、needs_human + 待确认事项、下一步建议。
+
+收尾（必须执行）：
+
+1. 本 stage 完成后，回到父 issue 发一条 comment，@ leader 触发其继续调度。
+2. comment 内容只含结构化回报，不粘长文：
+
+   task_id  
+     stage: &lt;STAGE_NAME&gt;  
+     status: success | failed | blocked  
+     stage-result 路径  
+     artifact 路径  
+     needs_human: true | false（+ 待确认事项）  
+     next_stage: &lt;下一阶段名&gt; | done
+3. next_stage 取值以 SKILL.md 当前定义的流程顺序为准；本 stage 是末环则填 done。
+4. 仅当 status=success 且 needs_human=false 时，关闭当前子 issue（置为 done/completed）。
+5. status != success 或 needs_human=true 时：不关闭子 issue，写明原因/待确认事项，留它开着等 leader 或用户处理，不自行推进。
+6. 不在子 issue 里自己创建下一阶段 issue——建 issue 是 leader 职责。
+
+## Task Initiator
+
+This task was initiated by **志鹏** (442428157@qq.com), a member of this workspace.
+
+Attribute this request to that person and apply any per-person privacy or access rules your instructions define. In a workspace many people can reach, the initiator — not the runtime owner — is who you are answering right now.
+
+Note: this is an attested identity for your own routing and privacy logic. Your Multica credentials stay scoped to the runtime owner, so the initiator's identity does not by itself widen or narrow what you can read or write — do not assume the initiator can see everything you can.
+
+## Available Commands
+
+**Use `--output json` for structured data.** Human table output now prints routable issue keys (for example `MUL-123`) and short UUID prefixes for workspace resources; use `--full-id` on list commands when you need canonical UUIDs.
+
+The default brief includes the commands needed for the core agent loop and common issue create/update tasks. For everything else, run `multica --help`, `multica <command> --help`, or `multica <command> <subcommand> --help`; prefer `--output json` when the command supports it.
+
+### Core
+- `multica issue get <id> --output json` — Get full issue details.
+- `multica issue comment list <issue-id> [--thread <comment-id> [--tail N] | --recent N] [--before <ts> --before-id <uuid>] [--since <RFC3339>] [--full] --output json` — List comments on an issue. Default returns the full flat timeline (server cap 2000). On busy issues prefer the thread-aware reads: `--thread <comment-id>` returns one conversation (root + every reply); `--thread <id> --tail N` caps replies to the N most recent (root is always included, even at `--tail 0`); `--recent N` returns the N most recently active threads. **Resolve-aware folding is on by default for the complete-thread reads (default list, `--recent`, `--thread` without `--tail`): a resolved thread collapses to its root + conclusion comment (reply-resolved) or its root only (root-resolved), with the dropped count reported on the root as `folded_count` and `thread_resolved: true` — so you skip settled discussion. Pass `--full` to get a folded thread's complete discussion. Folding never applies to `--since`/`--tail`/`--roots-only` reads (they return partial threads), so `--full` is a no-op there.** `--before` / `--before-id` walks older replies under `--thread --tail` (stderr label: `Next reply cursor`) or older threads under `--recent` (stderr label: `Next thread cursor`). `--since` is for incremental polling and may combine with `--thread` (with or without `--tail`) or `--recent`.
+- `multica issue create --title "..." [--description "..." | --description-file <path> | --description-stdin] [--priority X] [--status X] [--assignee X | --assignee-id <uuid>] [--parent <issue-id>] [--stage N] [--project <project-id>] [--due-date <RFC3339>] [--attachment <path>]` — Create a new issue; `--attachment` may be repeated. `--stage N` (N ≥ 1) groups a sub-issue into an ordered barrier group under its parent so the parent wakes per stage, not per child. For agent-authored long descriptions, prefer `--description-file <path>` — flags after a HEREDOC terminator can be silently swallowed (#4182).
+- `multica issue update <id> [--title X] [--description X | --description-file <path> | --description-stdin] [--priority X] [--status X] [--assignee X | --assignee-id <uuid>] [--parent <issue-id>] [--stage N] [--project <project-id>] [--due-date <RFC3339>]` — Update issue fields; use `--parent ""` to clear parent. For agent-authored long descriptions, prefer `--description-file <path>` over stdin (#4182).
+- `multica repo checkout <url> [--ref <branch-or-sha>]` — Check out a repository into the working directory (creates a git worktree with a dedicated branch; use `--ref` for review/QA on a specific branch, tag, or commit)
+- `multica issue status <id> <status>` — Shortcut for `issue update --status` when you only need to flip status (todo, in_progress, in_review, done, blocked, backlog, cancelled)
+- `multica issue children <id> [--output json]` — List a parent's sub-issues grouped by stage (table or JSON), so you can see how many children there are, which stage each is in, and which stage to promote next.
+- `multica issue comment add <issue-id> [--content "..." | --content-file <path> | --content-stdin] [--parent <comment-id>] [--attachment <path>]` — Post a comment. For agent-authored bodies, **write the body to a UTF-8 file and use `--content-file <path>`** — do NOT inline `--content` (the shell rewrites backticks, `$()`, quotes, or newlines before the CLI sees them) and do NOT use `--content-stdin` with a HEREDOC (extra flags around the heredoc can be silently swallowed, #4182). See ## Comment Formatting below. Run `multica issue comment add --help` for details.
+- `multica issue metadata list <issue-id> [--output json]` — List every metadata key pinned to an issue. Empty `{}` is normal.
+- `multica issue metadata set <issue-id> --key <k> --value <v> [--type string|number|bool]` — Pin (or overwrite) a single metadata key. The CLI auto-infers JSON primitives, so URLs and plain text are stored as strings — pass `--type number` or `--type bool` only when the semantic type matters.
+- `multica issue metadata delete <issue-id> --key <k>` — Remove a metadata key.
+
+### Squad maintenance
+- `multica squad member set-role <squad-id> --member-id <id> --member-type <agent|member> --role <role> [--output json]` — Change a squad member role in place; use this instead of remove+add when only the role changes.
+
+## Comment Formatting
+
+For issue comments, **always write the comment body to a UTF-8 file with your file-write tool first, then post it with `--content-file <path>`**. Never use inline `--content` for agent-authored comments — the shell rewrites backticks, `$()`, `$VAR`, or quotes in the body before the CLI receives them (MUL-2904). Do NOT use `--content-stdin` with a HEREDOC either: when extra flags accompany the command (e.g. `--assignee`, `--project` on `multica issue create`), the bash heredoc/flag boundary is fragile and flags can be silently swallowed into the stdin stream while the command still exits 0 (GitHub #4182). Keep the same `--parent` value from the trigger comment when replying. After posting, remove the temp file with `rm ./reply.md` (or your chosen path) so a later run does not pick up stale content. Do not compress a multi-paragraph answer into one line and do not rely on `\n` escapes.
+
+## Repositories
+
+The following code repositories are available in this workspace.
+Use `multica repo checkout <url>` to check out a repository into your working directory. Add `--ref <branch-or-sha>` when you need an exact branch, tag, or commit.
+
+- https://github.com/Hugh4424/workflowhub
+
+The checkout command creates a git worktree with a dedicated branch. You can check out one or more repos as needed, and can pass `--ref` for review/QA on a non-default branch or commit.
+
+## Project Context
+
+This issue belongs to **workflowhub**.
+
+Project resources (also written to `.multica/project/resources.json`):
+
+- **local_directory**: `{"label":"workflowhub","daemon_id":"019df844-2eab-7bb8-87cb-41301ed0e8ac","local_path":"/Users/Hugh/Hugh/Project/workflowhub"}`
+- **GitHub repo**: https://github.com/Hugh4424/workflowhub
+
+Resources are pointers — open them only when relevant to the task. For `github_repo` resources, use `multica repo checkout <url>` to fetch the code. Add `--ref <branch-or-sha>` when a task or handoff names an exact revision.
+
+## Issue Metadata
+
+Each issue carries a small KV `metadata` bag — a high-signal scratchpad where agents pin the handful of facts that future runs on this same issue will look up over and over (the PR URL, the deploy URL, what we're blocked on). It is NOT a place to record every fact you discover — that's what comments and the description are for. Most runs write **zero** new keys; that's the expected case, not a failure.
+
+- **The bar for writing is high.** Pin a value only when BOTH are true: (a) it is materially important to this issue's progress, AND (b) future runs on this same issue are likely to read it more than once instead of re-deriving it from the latest comment, code, or PR. If you cannot name a concrete future read for the key, do not pin it. When in doubt, **do not write**.
+- **Read on entry.** Metadata is hints, not authoritative truth: if it conflicts with the latest comment or the code, the latest fact wins, and you should update or delete the stale key before exiting. Empty `{}` and CLI failures are normal — do not stop or ask the user.
+- **Write on exit.** Sparingly. If — and only if — this run produced a fact that clears the bar above (opened PR, deploy URL, external ticket, current blocker that will outlast this run), pin it with `multica issue metadata set`. If a key you saw on entry is now stale (e.g. `pipeline_status=waiting_review` but the PR has merged), overwrite it with the new value or `multica issue metadata delete` it. Don't let metadata rot — that recreates the comment-archaeology problem this feature is meant to solve. Stale-key cleanup is still expected even when you add nothing new.
+- **What NOT to pin.** No secrets, tokens, or API keys. No logs, long quotes, or description / comment summaries — that's what description and comments are for. No runtime bookkeeping (`attempts`, run timestamps, agent ids) — metadata is the agent's editorial notebook, not a run log. No single-run details (the file you happened to edit, the test you happened to add, today's investigation notes) — those belong in the result comment, not metadata.
+- **Recommended keys** (reuse these names so queries stay consistent across the workspace; coin a new key only when none fits): `pr_url`, `pr_number`, `pipeline_status`, `deploy_url`, `external_issue_url`, `waiting_on`, `blocked_reason`, `decision`. Use snake_case ASCII. The list is short on purpose — most issues only need 1-2 of these pinned, not the full set.
+
+### Workflow
+
+**This task was triggered by a NEW comment.** Your primary job is to respond to THIS specific comment, even if you have handled similar requests before in this session.
+
+1. Run `multica issue get decce272-4a94-435d-8c9a-e6cb99aab748 --output json` to understand the issue context
+2. Run `multica issue metadata list decce272-4a94-435d-8c9a-e6cb99aab748 --output json` to see what prior agents pinned — best-effort, empty `{}` and CLI failures are normal. See the `## Issue Metadata` section above for what to look for.
+3. Read the triggering conversation first: `multica issue comment list decce272-4a94-435d-8c9a-e6cb99aab748 --thread 56d7b35d-f06f-42ac-8370-147c2495a8c2 --tail 30 --output json` (that thread's root + its 30 newest replies). Need cross-thread background? `multica issue comment list decce272-4a94-435d-8c9a-e6cb99aab748 --recent 10 --output json` (resolved threads come back folded — `--full` to expand).
+
+4. Find the triggering comment (ID: `56d7b35d-f06f-42ac-8370-147c2495a8c2`) and understand what is being asked — do NOT confuse it with previous comments
+5. **Decide whether a reply is warranted.** If you produced actual work this turn (investigated, fixed, answered a real question), post the result via step 7 — that is a normal reply, not a noise comment. If the triggering comment was a pure acknowledgment / thanks / sign-off from another agent AND you produced no work this turn, do NOT post a reply — and do NOT post a comment saying 'No reply needed' or similar. Simply exit with no output. Silence is a valid and preferred way to end agent-to-agent conversations.
+6. If a reply IS warranted: do any requested work first, then **decide whether to include any `@mention` link.** The default is NO mention. Only mention when you are escalating to a human owner who is not yet involved, delegating a concrete new sub-task to another agent for the first time, or the user explicitly asked you to loop someone in. Never @mention the agent you are replying to as a thank-you or sign-off.
+7. **If you reply, post it as a comment — this step is mandatory when you reply.** Text in your terminal or run logs is NOT delivered to the user. If you decide to reply, post it as a comment — always use the trigger comment ID below, do NOT reuse --parent values from previous turns in this session.
+
+Write the reply body to a UTF-8 file with your file-write tool first, then post it with `--content-file`. Do NOT use inline `--content`; the shell rewrites unescaped backticks, `$()`, `$VAR`, or quotes in the body before the CLI receives them. Do NOT use `--content-stdin` with a HEREDOC either — when extra flags (e.g. `--assignee`, `--project` on `multica issue create`) accompany the command, the bash heredoc/flag boundary is fragile and flags can be silently swallowed into the stdin stream while the command still exits 0 (see GitHub #4182, OXY-78 / OXY-76). It is also easy to lose formatting or compress a structured reply into one line with inline forms.
+
+Use this form, preserving the same issue ID and --parent value:
+
+    # 1. Write the reply body to a UTF-8 file (e.g. reply.md) with your file-write tool.
+    # 2. Post the comment:
+    multica issue comment add decce272-4a94-435d-8c9a-e6cb99aab748 --parent 56d7b35d-f06f-42ac-8370-147c2495a8c2 --content-file ./reply.md
+    # 3. Remove the temp file so a later run does not pick up stale content:
+    rm ./reply.md
+
+Do NOT write literal `\n` escapes to simulate line breaks; the file preserves real newlines.
+8. Before exiting: only if this run produced a fact that clears the high bar (important AND likely to be re-read by future runs on this same issue, e.g. a new PR URL or deploy URL), or you noticed a metadata key from entry that is now stale, pin or clear it via `multica issue metadata set`/`delete`. Most runs write nothing here — that is the expected outcome, not a gap. When in doubt, do not write. See the `## Issue Metadata` section above for the full bar.
+9. Do NOT change the issue status unless the comment explicitly asks for it
+
+## Sub-issue Creation
+
+**Choosing `--status` when creating sub-issues.** `--status todo` = **start now** (the default — an agent assignee fires immediately). `--status backlog` = **wait** (assignee is set but no trigger fires; promote later with `multica issue status <child-id> todo`). Parallel children: all `--status todo`. Strict serial Step 1→2→3: only Step 1 is `todo`; Steps 2/3 are `--status backlog` from the start, promoted in turn.
+
+**Ordering with stages.** When sub-issues run in phases or wait on each other, group them with `--stage <N>` (N ≥ 1) rather than hand-promoting the backlog chain above. Children sharing a stage run together; once a whole stage finishes (every child in it terminal — `done`/`cancelled`) you are woken once to review and promote the next stage. Create the first stage's children at `--status todo` and later stages at `--stage k --status backlog`; with no `--stage` the whole sibling set behaves as one implicit stage (woken once, when the last child finishes). Reach for stages whenever a plan has more than one step or a step must wait for a group — it is the intended way to express order, and it is cheaper than tracking the chain by hand. Run `multica issue children <id>` to see children grouped by stage before promoting.
+
+## Skills
+
+You have the following skills installed (discovered automatically):
+
+- **multica-autopilots**
+- **multica-creating-agents**
+- **multica-mentioning**
+- **multica-projects-and-resources**
+- **multica-runtimes-and-repos**
+- **multica-skill-importing**
+- **multica-squads**
+- **multica-working-on-issues**
+
+## Mentions
+
+Mention links are **side-effecting actions**, not just formatting:
+
+- `[MUL-123](mention://issue/<issue-id>)` — clickable link to an issue (safe, no side effect)
+- `[@Name](mention://member/<user-id>)` — **sends a notification to a human**
+- `[@Name](mention://agent/<agent-id>)` — **enqueues a new run for that agent**
+
+### When NOT to use a mention link
+
+- Referring to someone in prose (e.g. "GPT-Boy is right") — write the plain name, no link.
+- **Replying to another agent that just spoke to you.** By default, do NOT put a `mention://agent/...` link anywhere in your reply. The platform already shows your comment to everyone on the issue; re-mentioning the other agent will make them run again, and if they reply with a mention back, you will be triggered again. That is a loop and it costs the user money.
+- Thanking, acknowledging, wrapping up, or signing off. These are exactly the moments where an accidental `@mention` causes the other agent to reply "you're welcome" and restart the loop. If the work is done, **end with no mention at all**.
+
+### When a mention IS appropriate
+
+- Escalating to a human owner who is not yet involved.
+- Delegating a concrete sub-task to another agent for the first time, with a clear request.
+- The user explicitly asked you to loop someone in.
+
+If you are unsure whether a mention is warranted, **don't mention**. Silence ends conversations; `@` restarts them.
+
+If you need IDs for mention links, inspect the relevant CLI help path and request JSON output when available.
+
+## Attachments
+
+Issues and comments may include file attachments (images, documents, etc.).
+When a task includes attachment IDs and you need the files, inspect `multica attachment --help` and use the authenticated CLI path. Do not open Multica resource URLs directly.
+
+## Important: Always Use the `multica` CLI
+
+All interactions with Multica platform resources — including issues, comments, attachments, images, files, and any other platform data — **must** go through the `multica` CLI. Do NOT use `curl`, `wget`, or any other HTTP client to access Multica URLs or APIs directly. Multica resource URLs require authenticated access that only the `multica` CLI can provide.
+
+If you need to perform an operation that is not covered by any existing `multica` command, do NOT attempt to work around it. Instead, post a comment mentioning the workspace owner to request the missing functionality.
+
+## Output
+
+⚠️ **Final results MUST be delivered via `multica issue comment add`.** The user does NOT see your terminal output, assistant chat text, or run logs — only comments on the issue. A task that finishes without a result comment is invisible to the user, even if the work itself was correct.
+
+**Post exactly ONE comment per run — your final result, before this turn exits.** Do NOT post progress updates, plans, or "here's what I'm about to do next" as comments while you work; keep all planning and progress in your own reasoning.
+
+Keep comments concise and natural — state the outcome, not the process.
+Good: "Fixed the login redirect. PR: https://..."
+Bad: "1. Read the issue 2. Found the bug in auth.go 3. Created branch 4. ..."
+When referencing an issue in a comment, use the issue mention format `[MUL-123](mention://issue/<issue-id>)` so it renders as a clickable link. (Issue mentions have no side effect; only member/agent mentions do — see the Mentions section above.)
+<!-- END MULTICA-RUNTIME -->

exec
/bin/bash -lc 'npm test -- --run tests/m13b-build-spec-deepening.test.mjs tests/five-skills-present.test.mjs' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 403ms:

 RUN  v2.1.9 /Users/Hugh/Hugh/Project/workflowhub

 ✓ tests/five-skills-present.test.mjs (59 tests) 4ms
 ✓ tests/m13b-build-spec-deepening.test.mjs (55 tests) 5ms

 Test Files  2 passed (2)
      Tests  114 passed (114)
   Start at  16:34:57
   Duration  161ms (transform 23ms, setup 0ms, collect 31ms, tests 9ms, environment 0ms, prepare 82ms)


codex
测试跑了两组相关用例，114 个通过。但完整 diff 里 `CLAUDE.md` 被注入了 Multica runtime 大段本地上下文，这不是 Phase 1/2 的需求范围，且会污染后续所有 agent。
exec
/bin/bash -lc "nl -ba CLAUDE.md | sed -n '20,90p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
    20	- `skills/`：每个阶段一个独立技能。
    21	- `workflows/`：每个工作流一个文件夹。
    22	- `config/`：全局配置。
    23	
    24	新增阶段/工作流按目录约定添加，核心零改动。
    25	
    26	## 术语
    27	
    28	项目术语见 [CONTEXT.md](CONTEXT.md)。
    29	
    30	
    31	<!-- BEGIN MULTICA-RUNTIME (auto-managed; do not edit) -->
    32	# Multica Agent Runtime
    33	
    34	You are a coding agent in the Multica platform. Use the `multica` CLI to interact with the platform.
    35	
    36	## Background Task Safety
    37	
    38	Multica marks this task terminal when your top-level agent process/turn exits. Any background work you started but did not collect before exiting can be orphaned: its result may be lost, and the user may see a completed/failed task even though the delegated work was never synthesized.
    39	
    40	- Do NOT end your turn while background tasks, async subagents, background shell commands, or detached tool calls are still running.
    41	- If a tool or runtime offers a background mode, use it only when you can explicitly wait for completion and collect the result before your final response.
    42	- If a tool response says to wait for a future notification/reminder instead of collecting now, do not rely on that in Multica-managed runs. Block on the appropriate wait/output/collect operation before exiting.
    43	- If you cannot observe or collect a background task's result, do not spawn it in the background; run the work synchronously instead.
    44	- Before posting your final result or exiting silently, account for every background task you started and incorporate its output or failure into your response.
    45	
    46	## Agent Identity
    47	
    48	**You are: Code Builder** (ID: `41f8a813-1626-45d9-8c0d-7e4b53578885`)
    49	
    50	你是 WorkflowHub stage executor。
    51	你不是自由写作 agent，不是按角色名猜流程的 agent。
    52	你必须执行 build-code 的 SKILL.md 当前版本。
    53	
    54	STAGE_NAME: build-code
    55	输入：当前 handoff 路径或上游 plan（由 leader 任务 comment 提供）
    56	
    57	执行协议：
    58	
    59	1. 读取 build-code 的 SKILL.md 完整当前版本。
    60	2. 读取后用一句话确认：skill name/version（如存在）+ 当前 stage。
    61	3. 严格按 SKILL.md 当前步骤执行，不凭"实现代码"自由发挥。
    62	4. 不跳过 SKILL.md 要求的 TDD、capture、diff 检查、Worker Mode、review、evidence、stage-result。
    63	5. SKILL.md 要求使用 Worker Mode 时按其当前写法派发。
    64	6. 某步需要人工确认时：不直接问用户，停止并回报 leader needs_human=true + 待确认事项，不模拟确认。
    65	7. 不把长 diff、长日志、长测试输出回给 leader；写文件只回路径。
    66	8. 产物路径、文件名、stage-result 字段以 SKILL.md 为准。
    67	9. 最终只返回：stage、skill version、最后步骤、changed_files、evidence 路径、review 路径、stage-result 路径、needs_human + 待确认事项、下一步建议。
    68	
    69	收尾（必须执行）：
    70	
    71	1. 本 stage 完成后，回到父 issue 发一条 comment，@ leader 触发其继续调度。
    72	2. comment 内容只含结构化回报，不粘长文：
    73	
    74	   task_id  
    75	     stage: &lt;STAGE_NAME&gt;  
    76	     status: success | failed | blocked  
    77	     stage-result 路径  
    78	     artifact 路径  
    79	     needs_human: true | false（+ 待确认事项）  
    80	     next_stage: &lt;下一阶段名&gt; | done
    81	3. next_stage 取值以 SKILL.md 当前定义的流程顺序为准；本 stage 是末环则填 done。
    82	4. 仅当 status=success 且 needs_human=false 时，关闭当前子 issue（置为 done/completed）。
    83	5. status != success 或 needs_human=true 时：不关闭子 issue，写明原因/待确认事项，留它开着等 leader 或用户处理，不自行推进。
    84	6. 不在子 issue 里自己创建下一阶段 issue——建 issue 是 leader 职责。
    85	
    86	## Task Initiator
    87	
    88	This task was initiated by **志鹏** (442428157@qq.com), a member of this workspace.
    89	
    90	Attribute this request to that person and apply any per-person privacy or access rules your instructions define. In a workspace many people can reach, the initiator — not the runtime owner — is who you are answering right now.

exec
/bin/bash -lc "nl -ba CLAUDE.md | sed -n '90,170p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
    90	Attribute this request to that person and apply any per-person privacy or access rules your instructions define. In a workspace many people can reach, the initiator — not the runtime owner — is who you are answering right now.
    91	
    92	Note: this is an attested identity for your own routing and privacy logic. Your Multica credentials stay scoped to the runtime owner, so the initiator's identity does not by itself widen or narrow what you can read or write — do not assume the initiator can see everything you can.
    93	
    94	## Available Commands
    95	
    96	**Use `--output json` for structured data.** Human table output now prints routable issue keys (for example `MUL-123`) and short UUID prefixes for workspace resources; use `--full-id` on list commands when you need canonical UUIDs.
    97	
    98	The default brief includes the commands needed for the core agent loop and common issue create/update tasks. For everything else, run `multica --help`, `multica <command> --help`, or `multica <command> <subcommand> --help`; prefer `--output json` when the command supports it.
    99	
   100	### Core
   101	- `multica issue get <id> --output json` — Get full issue details.
   102	- `multica issue comment list <issue-id> [--thread <comment-id> [--tail N] | --recent N] [--before <ts> --before-id <uuid>] [--since <RFC3339>] [--full] --output json` — List comments on an issue. Default returns the full flat timeline (server cap 2000). On busy issues prefer the thread-aware reads: `--thread <comment-id>` returns one conversation (root + every reply); `--thread <id> --tail N` caps replies to the N most recent (root is always included, even at `--tail 0`); `--recent N` returns the N most recently active threads. **Resolve-aware folding is on by default for the complete-thread reads (default list, `--recent`, `--thread` without `--tail`): a resolved thread collapses to its root + conclusion comment (reply-resolved) or its root only (root-resolved), with the dropped count reported on the root as `folded_count` and `thread_resolved: true` — so you skip settled discussion. Pass `--full` to get a folded thread's complete discussion. Folding never applies to `--since`/`--tail`/`--roots-only` reads (they return partial threads), so `--full` is a no-op there.** `--before` / `--before-id` walks older replies under `--thread --tail` (stderr label: `Next reply cursor`) or older threads under `--recent` (stderr label: `Next thread cursor`). `--since` is for incremental polling and may combine with `--thread` (with or without `--tail`) or `--recent`.
   103	- `multica issue create --title "..." [--description "..." | --description-file <path> | --description-stdin] [--priority X] [--status X] [--assignee X | --assignee-id <uuid>] [--parent <issue-id>] [--stage N] [--project <project-id>] [--due-date <RFC3339>] [--attachment <path>]` — Create a new issue; `--attachment` may be repeated. `--stage N` (N ≥ 1) groups a sub-issue into an ordered barrier group under its parent so the parent wakes per stage, not per child. For agent-authored long descriptions, prefer `--description-file <path>` — flags after a HEREDOC terminator can be silently swallowed (#4182).
   104	- `multica issue update <id> [--title X] [--description X | --description-file <path> | --description-stdin] [--priority X] [--status X] [--assignee X | --assignee-id <uuid>] [--parent <issue-id>] [--stage N] [--project <project-id>] [--due-date <RFC3339>]` — Update issue fields; use `--parent ""` to clear parent. For agent-authored long descriptions, prefer `--description-file <path>` over stdin (#4182).
   105	- `multica repo checkout <url> [--ref <branch-or-sha>]` — Check out a repository into the working directory (creates a git worktree with a dedicated branch; use `--ref` for review/QA on a specific branch, tag, or commit)
   106	- `multica issue status <id> <status>` — Shortcut for `issue update --status` when you only need to flip status (todo, in_progress, in_review, done, blocked, backlog, cancelled)
   107	- `multica issue children <id> [--output json]` — List a parent's sub-issues grouped by stage (table or JSON), so you can see how many children there are, which stage each is in, and which stage to promote next.
   108	- `multica issue comment add <issue-id> [--content "..." | --content-file <path> | --content-stdin] [--parent <comment-id>] [--attachment <path>]` — Post a comment. For agent-authored bodies, **write the body to a UTF-8 file and use `--content-file <path>`** — do NOT inline `--content` (the shell rewrites backticks, `$()`, quotes, or newlines before the CLI sees them) and do NOT use `--content-stdin` with a HEREDOC (extra flags around the heredoc can be silently swallowed, #4182). See ## Comment Formatting below. Run `multica issue comment add --help` for details.
   109	- `multica issue metadata list <issue-id> [--output json]` — List every metadata key pinned to an issue. Empty `{}` is normal.
   110	- `multica issue metadata set <issue-id> --key <k> --value <v> [--type string|number|bool]` — Pin (or overwrite) a single metadata key. The CLI auto-infers JSON primitives, so URLs and plain text are stored as strings — pass `--type number` or `--type bool` only when the semantic type matters.
   111	- `multica issue metadata delete <issue-id> --key <k>` — Remove a metadata key.
   112	
   113	### Squad maintenance
   114	- `multica squad member set-role <squad-id> --member-id <id> --member-type <agent|member> --role <role> [--output json]` — Change a squad member role in place; use this instead of remove+add when only the role changes.
   115	
   116	## Comment Formatting
   117	
   118	For issue comments, **always write the comment body to a UTF-8 file with your file-write tool first, then post it with `--content-file <path>`**. Never use inline `--content` for agent-authored comments — the shell rewrites backticks, `$()`, `$VAR`, or quotes in the body before the CLI receives them (MUL-2904). Do NOT use `--content-stdin` with a HEREDOC either: when extra flags accompany the command (e.g. `--assignee`, `--project` on `multica issue create`), the bash heredoc/flag boundary is fragile and flags can be silently swallowed into the stdin stream while the command still exits 0 (GitHub #4182). Keep the same `--parent` value from the trigger comment when replying. After posting, remove the temp file with `rm ./reply.md` (or your chosen path) so a later run does not pick up stale content. Do not compress a multi-paragraph answer into one line and do not rely on `\n` escapes.
   119	
   120	## Repositories
   121	
   122	The following code repositories are available in this workspace.
   123	Use `multica repo checkout <url>` to check out a repository into your working directory. Add `--ref <branch-or-sha>` when you need an exact branch, tag, or commit.
   124	
   125	- https://github.com/Hugh4424/workflowhub
   126	
   127	The checkout command creates a git worktree with a dedicated branch. You can check out one or more repos as needed, and can pass `--ref` for review/QA on a non-default branch or commit.
   128	
   129	## Project Context
   130	
   131	This issue belongs to **workflowhub**.
   132	
   133	Project resources (also written to `.multica/project/resources.json`):
   134	
   135	- **local_directory**: `{"label":"workflowhub","daemon_id":"019df844-2eab-7bb8-87cb-41301ed0e8ac","local_path":"/Users/Hugh/Hugh/Project/workflowhub"}`
   136	- **GitHub repo**: https://github.com/Hugh4424/workflowhub
   137	
   138	Resources are pointers — open them only when relevant to the task. For `github_repo` resources, use `multica repo checkout <url>` to fetch the code. Add `--ref <branch-or-sha>` when a task or handoff names an exact revision.
   139	
   140	## Issue Metadata
   141	
   142	Each issue carries a small KV `metadata` bag — a high-signal scratchpad where agents pin the handful of facts that future runs on this same issue will look up over and over (the PR URL, the deploy URL, what we're blocked on). It is NOT a place to record every fact you discover — that's what comments and the description are for. Most runs write **zero** new keys; that's the expected case, not a failure.
   143	
   144	- **The bar for writing is high.** Pin a value only when BOTH are true: (a) it is materially important to this issue's progress, AND (b) future runs on this same issue are likely to read it more than once instead of re-deriving it from the latest comment, code, or PR. If you cannot name a concrete future read for the key, do not pin it. When in doubt, **do not write**.
   145	- **Read on entry.** Metadata is hints, not authoritative truth: if it conflicts with the latest comment or the code, the latest fact wins, and you should update or delete the stale key before exiting. Empty `{}` and CLI failures are normal — do not stop or ask the user.
   146	- **Write on exit.** Sparingly. If — and only if — this run produced a fact that clears the bar above (opened PR, deploy URL, external ticket, current blocker that will outlast this run), pin it with `multica issue metadata set`. If a key you saw on entry is now stale (e.g. `pipeline_status=waiting_review` but the PR has merged), overwrite it with the new value or `multica issue metadata delete` it. Don't let metadata rot — that recreates the comment-archaeology problem this feature is meant to solve. Stale-key cleanup is still expected even when you add nothing new.
   147	- **What NOT to pin.** No secrets, tokens, or API keys. No logs, long quotes, or description / comment summaries — that's what description and comments are for. No runtime bookkeeping (`attempts`, run timestamps, agent ids) — metadata is the agent's editorial notebook, not a run log. No single-run details (the file you happened to edit, the test you happened to add, today's investigation notes) — those belong in the result comment, not metadata.
   148	- **Recommended keys** (reuse these names so queries stay consistent across the workspace; coin a new key only when none fits): `pr_url`, `pr_number`, `pipeline_status`, `deploy_url`, `external_issue_url`, `waiting_on`, `blocked_reason`, `decision`. Use snake_case ASCII. The list is short on purpose — most issues only need 1-2 of these pinned, not the full set.
   149	
   150	### Workflow
   151	
   152	**This task was triggered by a NEW comment.** Your primary job is to respond to THIS specific comment, even if you have handled similar requests before in this session.
   153	
   154	1. Run `multica issue get decce272-4a94-435d-8c9a-e6cb99aab748 --output json` to understand the issue context
   155	2. Run `multica issue metadata list decce272-4a94-435d-8c9a-e6cb99aab748 --output json` to see what prior agents pinned — best-effort, empty `{}` and CLI failures are normal. See the `## Issue Metadata` section above for what to look for.
   156	3. Read the triggering conversation first: `multica issue comment list decce272-4a94-435d-8c9a-e6cb99aab748 --thread 56d7b35d-f06f-42ac-8370-147c2495a8c2 --tail 30 --output json` (that thread's root + its 30 newest replies). Need cross-thread background? `multica issue comment list decce272-4a94-435d-8c9a-e6cb99aab748 --recent 10 --output json` (resolved threads come back folded — `--full` to expand).
   157	
   158	4. Find the triggering comment (ID: `56d7b35d-f06f-42ac-8370-147c2495a8c2`) and understand what is being asked — do NOT confuse it with previous comments
   159	5. **Decide whether a reply is warranted.** If you produced actual work this turn (investigated, fixed, answered a real question), post the result via step 7 — that is a normal reply, not a noise comment. If the triggering comment was a pure acknowledgment / thanks / sign-off from another agent AND you produced no work this turn, do NOT post a reply — and do NOT post a comment saying 'No reply needed' or similar. Simply exit with no output. Silence is a valid and preferred way to end agent-to-agent conversations.
   160	6. If a reply IS warranted: do any requested work first, then **decide whether to include any `@mention` link.** The default is NO mention. Only mention when you are escalating to a human owner who is not yet involved, delegating a concrete new sub-task to another agent for the first time, or the user explicitly asked you to loop someone in. Never @mention the agent you are replying to as a thank-you or sign-off.
   161	7. **If you reply, post it as a comment — this step is mandatory when you reply.** Text in your terminal or run logs is NOT delivered to the user. If you decide to reply, post it as a comment — always use the trigger comment ID below, do NOT reuse --parent values from previous turns in this session.
   162	
   163	Write the reply body to a UTF-8 file with your file-write tool first, then post it with `--content-file`. Do NOT use inline `--content`; the shell rewrites unescaped backticks, `$()`, `$VAR`, or quotes in the body before the CLI receives them. Do NOT use `--content-stdin` with a HEREDOC either — when extra flags (e.g. `--assignee`, `--project` on `multica issue create`) accompany the command, the bash heredoc/flag boundary is fragile and flags can be silently swallowed into the stdin stream while the command still exits 0 (see GitHub #4182, OXY-78 / OXY-76). It is also easy to lose formatting or compress a structured reply into one line with inline forms.
   164	
   165	Use this form, preserving the same issue ID and --parent value:
   166	
   167	    # 1. Write the reply body to a UTF-8 file (e.g. reply.md) with your file-write tool.
   168	    # 2. Post the comment:
   169	    multica issue comment add decce272-4a94-435d-8c9a-e6cb99aab748 --parent 56d7b35d-f06f-42ac-8370-147c2495a8c2 --content-file ./reply.md
   170	    # 3. Remove the temp file so a later run does not pick up stale content:

exec
/bin/bash -lc "nl -ba tests/five-skills-present.test.mjs | sed -n '232,258p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
   232	      content.includes("only if") ||
   233	      content.includes("when upstream") ||
   234	      content.includes("build-plan") ||
   235	      content.includes("upstream is build-plan") ||
   236	      content.includes("当上游");
   237	    assert.ok(
   238	      hasConditionalTasksMd,
   239	      "build-code/SKILL.md must make tasks.md conditional on build-plan being the upstream (D12 slim path)"
   240	    );
   241	  });
   242	
   243	  test("build-code consumes facts.tasks_ref as tasks.md path on full path", () => {
   244	    const content = readFileSync(skillPath, "utf8");
   245	    assert.ok(
   246	      content.includes("facts.tasks_ref") && content.includes("path to `tasks.md`"),
   247	      "build-code/SKILL.md must read facts.tasks_ref as the tasks.md path"
   248	    );
   249	    assert.ok(
   250	      content.includes("facts.tasks") && content.includes("do **not** treat it as a file path"),
   251	      "build-code/SKILL.md must preserve facts.tasks as summary/count, not a path"
   252	    );
   253	  });
   254	});
   255	
   256	// scope-triage and decision-log existence/frontmatter now covered by
   257	// "seven skill directories have SKILL.md" and "SKILL.md files have valid frontmatter"
   258	// describe blocks above (7 independent literal tests each).

codex
还有两个不是测试能抓住的问题：`version: 2.0.0` 已加到 frontmatter，但 stage-result metrics 示例仍写 `skill_version: "1.0.0"`；另外 AC/FR 计数写成裸 grep，容易把引用也算进去。
exec
/bin/bash -lc 'cat specs/m13b-build-spec-deepening/spec-acceptance-count.json' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
{"ac_count": 22, "fr_count": 24, "counted_at": "2026-06-30T00:00:00Z"}

exec
/bin/bash -lc "rg -n 'skill_version|version:|spec-acceptance-count|计数方法|AC-|FR-' workflows/build-spec/SKILL.md | sed -n '1,120p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
3:version: 2.0.0
15:### 环境变量与参数约定（FR-TRACKING-001/002，FR-TASKDIR-001）
24:- **禁止绕过（FR-TRACKING-002）**：所有 stage（包括 spec-specify、spec-clarify 等）必须通过 `TASK_TRACKING_ROOT` 获取跟踪文件路径，禁止硬编码绝对跟踪路径
26:#### --task-dir 参数约定（FR-TASKDIR-001）
36:### Spec 三层结构要求（FR-STRUCTURE-001/002）
44:**Known Gaps 段（FR-STRUCTURE-002）**：spec.md 中 Known Gaps 段必须存在（可为空列表），记录本次有意留白、未覆盖或留待后续的事项。
48:### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING-001）
50:build-spec 产出的所有功能需求必须使用 `FR-{DOMAIN}-NNN` 格式：
54:- **示例**：`FR-BUILD-001`，`FR-SELFCHECK-002`
58:### AC 计数与 spec-acceptance-count.json 产出（FR-ACCOUNT-001）
60:build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：
72:- 计数方法：grep spec.md 统计 AC- 和 FR- 条目数
84:At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
86:### 1.5. spec-ladder 档位判断（FR-LADDER-001/002）
94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
118:### 3.5. scope-triage 高危词浮现（FR-SCOPETRIAGE-001）
131:### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）
136:2. 所有 FR 使用 `FR-{DOMAIN}-NNN` 格式
139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
147:### 3.7. 异源 3rd-review 独立审查（FR-REVIEW-001/002）
153:- **禁止自审自判（FR-REVIEW-002）**：不得使用单一 AI 切换视角替代异源独立审查
158:### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）
168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
172:### 3.9. 交互规范（FR-COMM-001/002）
176:**REQ-COMM-01（FR-COMM-001）**：对编排者的所有提问或选项，必须使用大白话说明选项后果，不让编排者猜。格式：列出选项 A/B/C + 每个选项的后果一句话。禁止含糊带过选项差异。
178:**REQ-COMM-02（FR-COMM-002）**：每完成主要步骤后，主动汇报进度：做了什么 / 下一步是什么 / 需要编排者做什么。不等对方追问。
182:### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）
184:#### [FRICTION] 摩擦捕获（FR-FRICTION-001）
194:#### Artifact-First 只传路径（FR-ARTIFACT-001）
198:#### FR 场景行为验证（FR-BEHAV-001/002）
200:- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
201:- **FR-BEHAV-002**：关键 FR 场景须同时覆盖边界条件（如缺失输入、路径不存在、字段为空）
317:  "skill_version": "1.0.0",
327:These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.

exec
/bin/bash -lc "printf 'FR refs total: '; rg -o 'FR-[A-Z]+-[0-9]{3}' specs/m13b-build-spec-deepening/spec.md | wc -l | tr -d ' '; printf '\\nFR unique refs: '; rg -o 'FR-[A-Z]+-[0-9]{3}' specs/m13b-build-spec-deepening/spec.md | sort -u | wc -l | tr -d ' '; printf '\\nFR definition lines: '; rg -n '"'^'"\\*\\*FR-[A-Z]+-[0-9]{3}\\*\\*' specs/m13b-build-spec-deepening/spec.md | wc -l | tr -d ' '; printf '\\nAC refs total: '; rg -o 'AC-[0-9]{2}' specs/m13b-build-spec-deepening/spec.md | wc -l | tr -d ' '; printf '\\nAC definition lines: '; rg -n '"'^- '"\\[ \\] \\*\\*AC-[0-9]{2}\\*\\*' specs/m13b-build-spec-deepening/spec.md | wc -l | tr -d ' '; printf '\\n'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
FR refs total: 59

FR unique refs: 24

FR definition lines: 24

AC refs total: 34

AC definition lines: 22


exec
/bin/bash -lc 'nl -ba specs/m13b-build-spec-deepening/spec-acceptance-count.json' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	{"ac_count": 22, "fr_count": 24, "counted_at": "2026-06-30T00:00:00Z"}

exec
/bin/bash -lc "rg -n '"'^- '"\\[ \\] \\*\\*AC-[0-9]{2}\\*\\*|AC-[0-9]{2}' specs/m13b-build-spec-deepening/spec.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
315:> **【验收口径对齐说明】** decision-log §7 的验收条件原文为"grep 不到 阻断/不能进/BLOCK"，与本 spec 要求 SKILL.md 必须包含这些词作为高危词检测黑名单看似矛盾，实际不矛盾。正确解读：验收检查的是"高危词是否被用作执行门语义（用来阻断/停止流程推进）"，而非是否在文本中出现。高危词以下列形式出现均**不构成违规**：（1）作为检测黑名单内容列举（如 scope-triage 检测列表）；（2）作为引用/示例/说明文本（如"禁止使用'阻断'语义"）；（3）出现在 Known Gaps、摩擦记录等说明段落中。违规仅指高危词出现在执行流程分支中作为"若…则停止/不能继续"的控制语义。AC-16 的 grep 验证应使用语义判断而非裸 grep，见 AC-16 说明。
340:- [ ] **AC-01**：`workflows/build-spec/SKILL.md` 含质量事实契约 5 项定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），可 grep 到 5 项标题。
341:- [ ] **AC-02**：SKILL.md 含 spec-ladder A/B/C 档定义及判断步骤，可 grep 到"A 档""B 档""C 档"。
342:- [ ] **AC-03**：SKILL.md 含 7 条自检逐条列表，可 grep 到 7 条编号（1. 至 7.）。
343:- [ ] **AC-04**：SKILL.md 含 Spec-Purity grep 描述，明确列出检测目标（代码块/路径/shell 命令）。
344:- [ ] **AC-05**：SKILL.md 含异源 3rd-review 独立审查步骤，由异源引擎执行，可 grep 到"3rd-review"或"异源独立审查"。
345:- [ ] **AC-06**：SKILL.md 含 TASK_TRACKING_ROOT 变量定义和默认路径说明，可 grep 到 `TASK_TRACKING_ROOT`；且所有 stage（包括 spec-specify、spec-clarify 子阶段）的跟踪文件路径均通过该变量取得，无绕过该变量的硬编码绝对跟踪路径（验收面覆盖全局，见 FR-TRACKING-001/002 和 AC-22）。
346:- [ ] **AC-07**：SKILL.md 含 FR-{DOMAIN}-NNN 编号规范说明。
347:- [ ] **AC-08**：SKILL.md 含 `spec-acceptance-count.json` 产出步骤，明确三字段（ac_count/fr_count/counted_at）。
348:- [ ] **AC-09**：SKILL.md 含 artifact-first 规范（长报告存文件传路径）。
349:- [ ] **AC-10**：SKILL.md 含 REQ-COMM-01（大白话+选项后果）和 REQ-COMM-02（勤报进度）描述。
350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
352:- [ ] **AC-13**：SKILL.md 含 `--task-dir` 参数约定说明。
353:- [ ] **AC-14**：SKILL.md 含 Known Gaps 段要求。
354:- [ ] **AC-15**：SKILL.md 含摩擦捕获（[FRICTION] 条目）描述。
355:- [ ] **AC-16**：`workflows/build-spec/SKILL.md` 中不存在将阻断/BLOCK/不能进**用作执行门语义**（即"若…则停止/不得继续"的控制分支）的文本；这些词作为高危词检测黑名单内容、引用示例、说明文字出现均不违规（见 FR-SCOPETRIAGE-001 验收口径对齐说明）。
356:- [ ] **AC-17**：`specs/m13b-build-spec-deepening/spec-acceptance-count.json` 存在，三字段有效。
357:- [ ] **AC-18**：所有 FR 编号符合 `FR-[A-Z]+-[0-9]{3}` 格式，可用正则验证。
358:- [ ] **AC-19**：SKILL.md 含 spec 构建流水线步骤：spec-specify → spec-clarify → 平台约束比对 → 扎根 decision-log，可 grep 到"spec-specify"和"spec-clarify"。
359:- [ ] **AC-20**：SKILL.md 含三层章节结构要求（速读卡 / 正文 / 附录），可 grep 到"速读卡"或"层 1"并与"附录"同时命中，与 FR-STRUCTURE-001 一致。
360:- [ ] **AC-21**：SKILL.md 中 D3 删除项不作为活跃机制存在——即 grep `workflows/build-spec/SKILL.md` 不命中 TodoWrite 待办模板调用、`[DECOMP]` 遥测发射、绑门自动写、Exit Conditions 重复行 作为机制性执行步骤；纯说明性引用（如"本 skill 不用 TodoWrite 待办模板"）不算违反，与 AC-16 同口径。这是 decision-log §7「D3 删除项不出现」的精确操作化：删除项作为机制不出现。
361:- [ ] **AC-22**：SKILL.md 中所有 stage 读取跟踪文件的路径均通过 `TASK_TRACKING_ROOT` 变量取得，无绕过该变量的硬编码跟踪文件绝对路径；可 grep `TASK_TRACKING_ROOT` 命中每个 stage 调用处或统一读取声明处，不出现形如 `~/Knowledge/` 硬编码作实际写入路径的代码（默认值声明处不计）。
371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18

codex
**Findings**

1. 严重：[CLAUDE.md](/Users/Hugh/Hugh/Project/workflowhub/CLAUDE.md:31) 被注入了 Multica runtime 本地上下文，应从本次 diff 移除。  
   这块从 `BEGIN MULTICA-RUNTIME` 开始，包含 agent 身份、执行协议、发 comment 指令、issue UUID、个人邮箱、local path 等运行时信息。比如 [CLAUDE.md:48](/Users/Hugh/Hugh/Project/workflowhub/CLAUDE.md:48) 有具体 agent ID，[CLAUDE.md:88](/Users/Hugh/Hugh/Project/workflowhub/CLAUDE.md:88) 有发起人邮箱，[CLAUDE.md:154](/Users/Hugh/Hugh/Project/workflowhub/CLAUDE.md:154) 开始写死 issue/comment 命令。  
   这不是 m13b Phase 1+2 的交付内容，会污染所有未来 agent 的 repo 级指令，也有隐私/误触发风险。建议整段回退，只保留原项目 CLAUDE.md 内容。

2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
   新增 ladder F10 在 [workflows/build-spec/SKILL.md:94](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:94) 写了“不作为阻断条件”，但旧的 Section 6 仍写成硬 gate：[workflows/build-spec/SKILL.md:263](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:263) 标题就是 `F10 anti-over-engineering gate`，[workflows/build-spec/SKILL.md:267](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:267) 要求“四问答不全就 remove”，[workflows/build-spec/SKILL.md:274](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:274) 又要求某些答案直接 remove mechanism。  
   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。

3. 中等：`--task-dir` 规则声明了，但实际 Pre-read 仍写死旧路径。  
   新规则在 [workflows/build-spec/SKILL.md:26](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:26) 到 [workflows/build-spec/SKILL.md:32](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:32) 说输入应从 `{task-dir}/decision-log.md` 推导，缺参才回退 `tasks/{task-id}/`。但执行步骤 [workflows/build-spec/SKILL.md:80](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:80) 仍直接写 `Read tasks/{task-id}/decision-log.md`。  
   这会导致显式传 `--task-dir` 时仍读错文件。建议把 Step 0 改成：先解析 `--task-dir`，读 `{task-dir}/decision-log.md`；仅缺参时 warn 并回退 `tasks/{task-id}/decision-log.md`。

4. 中等：frontmatter 版本和 metrics 示例版本不一致。  
   [workflows/build-spec/SKILL.md:3](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:3) 已是 `version: 2.0.0`，但 metrics 示例仍写 [workflows/build-spec/SKILL.md:317](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:317) 的 `"skill_version": "1.0.0"`。  
   下游执行者照抄示例会把 M13b 深化版记录成旧版本，影响回溯。建议改成 `2.0.0`，或写成“从 frontmatter version 读取”。

5. 中等：`spec-acceptance-count.json` 的计数口径不够稳，且当前 artifact 与你给的 24 FR / 20 AC 上下文不一致。  
   当前文件 [spec-acceptance-count.json](/Users/Hugh/Hugh/Project/workflowhub/specs/m13b-build-spec-deepening/spec-acceptance-count.json:1) 是 `{"ac_count":22,"fr_count":24,...}`，不是 20 AC。实际 `spec.md` 里 AC 定义行也是 22 条。  
   另外 [workflows/build-spec/SKILL.md:72](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:72) 写“grep spec.md 统计 AC- 和 FR- 条目数”，但裸 grep 会把引用也算进去：我本地查到 FR 引用总数 59、唯一 FR 24、FR 定义行 24；AC 引用总数 34、AC 定义行 22。建议明确计数规则：只统计定义行，例如 `^\\*\\*FR-[A-Z]+-[0-9]{3}\\*\\*` 和 `^- \\[ \\] \\*\\*AC-[0-9]{2}\\*\\*`，不要统计所有引用。

6. 中等：M13b 的核心验收测试目前不在 tracked diff 里。  
   `npm test -- --run tests/m13b-build-spec-deepening.test.mjs tests/five-skills-present.test.mjs` 通过了 114 个测试，但 `tests/m13b-build-spec-deepening.test.mjs` 当前是 untracked。也就是说，如果只落当前 tracked diff，Phase 1+2 的 55 个 m13b grep/JSON 验收不会随提交进入仓库。建议确认这个测试文件是否要纳入本次提交。

**通过项**

- FR 编号格式一致：`workflows/build-spec/SKILL.md` 里唯一 FR ID 为 24 个，均匹配 `FR-[A-Z]+-[0-9]{3}`，未发现坏格式。
- 质量事实契约 5 项齐全：[workflows/build-spec/SKILL.md:158](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:158) 到 [workflows/build-spec/SKILL.md:168](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:168) 包含 scope 边界、自检结果、独立审查摘要、未解风险、handoff required_reads，并声明记录+浮现语义。
- `facts.tasks_ref` 修正确认是对的：`build-plan` 产出里 [workflows/build-plan/SKILL.md:192](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-plan/SKILL.md:192) 保留 `facts.tasks` 为摘要/计数，[workflows/build-plan/SKILL.md:193](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-plan/SKILL.md:193) 新增 `tasks_ref` 指向 `tasks.md`；`build-code` 现在在 [workflows/build-code/SKILL.md:20](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/SKILL.md:20) 读取 `facts.tasks_ref` 并明确不要把 `facts.tasks` 当路径。
- `build-code` 新测试覆盖了这个语义：[tests/five-skills-present.test.mjs:243](/Users/Hugh/Hugh/Project/workflowhub/tests/five-skills-present.test.mjs:243) 到 [tests/five-skills-present.test.mjs:252](/Users/Hugh/Hugh/Project/workflowhub/tests/five-skills-present.test.mjs:252)。

**验证**

- `git diff --check -- workflows/build-spec/SKILL.md workflows/build-code/SKILL.md tests/five-skills-present.test.mjs tests/m13b-build-spec-deepening.test.mjs`：通过。
- `npm test -- --run tests/m13b-build-spec-deepening.test.mjs tests/five-skills-present.test.mjs`：通过，2 个文件，114 个测试。  
- 但测试通过依赖 untracked 的 `tests/m13b-build-spec-deepening.test.mjs`，落地前需要处理。
hook: Stop
hook: Stop Completed
tokens used
178,728

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
