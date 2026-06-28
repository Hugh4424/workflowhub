You are doing a heterologous, independent, cross-engine code review (round 1).

## Context

This is the workflowhub project: a microkernel orchestrator for an AI dev workflow built to a design constitution. The five-stage flow is make-decision → build-spec → build-plan → build-code → verify-code; each stage is one SKILL.md prompt-skill (prompt-only, no executable code — these files are instructions an LLM agent follows).

This change upgrades `workflows/build-spec/SKILL.md` from the generic M6 skeleton to "v1". The v1 build-spec orchestrates a pipeline: pre-read decision-log → metrics recordSkeleton → call spec-specify (first-draft spec) → call spec-clarify (ambiguity scan + interactive refinement) → 21-clause constitution compliance check → M10-baseline comparison → one human-review checkpoint → stage-result.

## Constitution rules that govern this file

- F3: physical facts are machine-collected and surfaced but MUST NOT block progress.
- F4 / Q1 / Q3: quality comes from heterologous review + humans, NOT from blocking quality gates. Record facts, do not block. No self-review.
- F7: progression and irreversible actions must not auto-bypass a human.
- F8: simple-first; no hidden compatibility shims.
- F9: falsifiable, no false-green; missing data marked unknown.
- F10: automation added only for real, observed benefit — not to make things machine-checkable for its own sake. (A predecessor system bloated to ~95k lines of gate code chasing "everything machine-verifiable".)
- S7: one stage = one skill = one workflow = one folder.

## What to check

Review ONLY the diff below. Judge whether the v1 build-spec orchestration:

1. Is internally consistent (no step contradicts another; the pipeline order is coherent).
2. Correctly treats the constitution check and baseline comparison as record-fact-not-block steps (must NOT become blocking gates — that would violate F3/F4/Q1).
3. Has exactly ONE human-review checkpoint, placed before stage-result, that does not auto-bypass the human (F7).
4. Preserves the M6 skeleton's essential elements (F10 anti-over-engineering gate, stage-result 7-key contract with facts.spec_ref + facts.requirements, metrics recordSkeleton/updateOwnResult).
5. Does not introduce over-engineering, dead mechanisms, or machine-checkable infrastructure with no real benefit (F10).
6. Fail-loud correctly: missing decision-log → stop; spec-specify failure → stop, do not proceed; spec-clarify spec-not-found → stop.
7. The baseline table uses the correct fifth metric name `rework_proxy_count` (NOT any older name) and the M10 baseline values are presented as reference, not thresholds.

## Verdict format

End with EXACTLY one of these three verdicts on its own line:
- `VERDICT: pass` — no blocking issues.
- `VERDICT: revise_required` — list each blocking issue as B1, B2, ... with the exact line/section and the required fix.
- `VERDICT: escalate_to_human` — a judgment call only a human should make.

Be adversarial and concrete. Do not rubber-stamp. If you find no blocking issue, say so explicitly and return pass.

## The diff under review

```diff
diff --git a/workflows/build-spec/SKILL.md b/workflows/build-spec/SKILL.md
index d17b78d..0de544d 100644
--- a/workflows/build-spec/SKILL.md
+++ b/workflows/build-spec/SKILL.md
@@ -1,21 +1,108 @@
 ---
 name: build-spec
-description: Turn the agreed direction into a structured spec that is the single source of truth for requirements.
+description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
 ---
 
 # build-spec
 
 ## Goal
 
-Translate the decision log from `make-decision` into a full spec. The spec becomes the sole authority that later stages (plan, code, verify) refer to.
+Translate the decision log from `make-decision` into a full spec via an orchestrated pipeline. The spec becomes the sole authority that later stages (plan, code, verify) refer to.
 
 ## What to do
 
-1. Read the decision log and any existing platform constraints before writing.
-2. Cross-check the proposed change against existing architecture documents. Call out any conflict under "non-goals" or "out of scope".
-3. Write a spec with at minimum: core scenarios (Given/When/Then), functional requirements (FR), explicit non-goals, acceptance criteria, and affected areas.
-4. Every requirement must have at least one scenario. Every acceptance criterion must be verifiable by hand or by a command.
-5. Record the spec location (facts key: `spec_ref`) and a summary of requirements (facts key: `requirements`).
+### 0. Pre-read: decision-log
+
+Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output. Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.
+
+### 1. Metrics: stage start
+
+At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
+
+### 2. spec-specify: first-draft spec
+
+Invoke `workflows/spec-specify/SKILL.md` (spec-specify):
+
+- **Input**: task-id (from the current stage context) and the functional description text extracted from the decision-log.
+- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
+- If spec-specify reports failure or the output files are missing, stop and surface the error — do not proceed to spec-clarify.
+
+### 3. spec-clarify: ambiguity scan and interactive refinement
+
+Invoke `workflows/spec-clarify/SKILL.md` (spec-clarify):
+
+- **Input**: task-id (or the explicit spec path `specs/{task-id}/spec.md`).
+- **Expected behaviour**: 10-dimension ambiguity scan, up to 5 interactive clarification questions (one at a time), incremental spec updates after each accepted answer, and a coverage summary at completion.
+- If spec-clarify reports the spec file is not found, stop — run spec-specify first.
+
+### 4. Constitution compliance check
+
+Read `constitution-checklist.md`. Check all 21 items (F1–F10, Q1–Q3, S1–S8) against the spec produced so far. For every item write `[x]` (compliant) or `[ ]` (non-compliant) with a concrete rationale sentence. No item may be left unmarked or without a rationale — all 21 must be present.
+
+The 21 items are:
+
+**Framework (F1–F10)**:
+- [ ] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。
+- [ ] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。
+- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
+- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。
+- [ ] **F6 统一外置执行记录** — 判据：进度/指标/回溯是否统一记录、可回溯。
+- [ ] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作是否经人边界确认。
+- [ ] **F8 简单优先** — 判据：是否选更简单依赖更少的方案、不写掩盖问题的兜底。
+- [ ] **F9 可证伪不假绿** — 判据：检查是否在"实际为假"时真报失败、缺数据标未知。
+- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。
+
+**Quality (Q1–Q3)**:
+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
+- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
+- [ ] **Q3 异源审查加人工把关** — 判据：质量裁决是否由独立来源独立上下文产出、无自审自判。
+
+**Skills (S1–S8)**:
+- [ ] **S1 能用外部就不造轮子** — 判据：通用能力是否优先复用外部、文件直放项目内。
+- [ ] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。
+- [ ] **S3 迭代时保持最新并就地检查** — 判据：迭代时是否查更新/更优、来源路径写进技能文件。
+- [ ] **S4 自定义技能必须有指标系统** — 判据：自研技能是否配套指标、纳入统一执行记录。
+- [ ] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能是否便于子代理调用、减少主上下文占用。
+- [ ] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能是否参考成熟方案优化。
+- [ ] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。
+- [ ] **S8 自定义技能可独立调用可搬运** — 判据：自研技能是否可独立调用、可跨宿主搬运、不绑死环境。
+
+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
+
+Write the completed checklist as an appendix to the spec or as a standalone file `specs/{task-id}/constitution-check.md`.
+
+### 5. Baseline comparison
+
+Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:
+
+| Metric | M11 Actual | M10 Baseline | Direction Delta |
+| ------ | ---------- | ------------ | --------------- |
+| missed_step_rate | <M11 actual> | 0.05 | <delta> |
+| test_execution_rate | <M11 actual> | 0.8295 | <delta> |
+| review_execution_rate | <M11 actual> | 1 | <delta> |
+| rework_rounds | <M11 actual> | 6.075 | <delta> |
+| rework_proxy_count | <M11 actual> | 25.25 | <delta> |
+
+- Compute M11 actual values from collected metrics (derive from the current stage metrics record).
+- The direction delta indicates whether the metric moved favourably (e.g. fewer rework rounds is better, higher test execution rate is better).
+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
+- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
+
+Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
+
+### 6. Human review checkpoint
+
+After spec-specify output, spec-clarify refinement, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint:
+
+> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪，请确认后继续：
+> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新）
+> - 宪法符合性检查清单（constitution-checklist.md 21 条逐条勾选）
+> - M11 vs M10 baseline 对照表（5 项指标）
+>
+> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
+
+The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step.
 
 ## F10 anti-over-engineering gate (apply before finalising the spec)
 
@@ -32,7 +119,7 @@ This gate reflects constitution rule F10: automation and validation are added fo
 
 ## Produce a stage-result
 
-When the stage is complete, write a `stage-result` record with:
+When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
 
 ```json
 {
@@ -45,7 +132,7 @@ When the stage is complete, write a `stage-result` record with:
   },
   "missing_items": [],
   "user_decision": false,
-  "reason": "Spec written and cross-checked against platform constraints."
+  "reason": "Spec written via spec-specify → spec-clarify → constitution check → baseline comparison, confirmed at human review checkpoint."
 }
 ```
 
@@ -67,3 +154,5 @@ Also record a metrics entry via the collector. Call `recordSkeleton` at stage st
 ```
 
 These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.
+
+At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.

```
