# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-28T14:10:15.194Z

## Original task

You are doing a heterologous, independent, cross-engine code review (ROUND 2).

## Context

workflowhub: microkernel orchestrator for an AI dev workflow built to a design constitution. Five-stage flow: make-decision → build-spec → build-plan → build-code → verify-code; each stage is one SKILL.md prompt-skill (prompt-only instructions an LLM agent follows).

This diff upgrades `workflows/build-spec/SKILL.md` from M6 skeleton to v1. In ROUND 1 you returned `revise_required` with two blocking issues. They have now been fixed. Verify the fixes and look for any NEW blocking issue introduced by them.

### Round-1 blocking issues (now claimed fixed):

- **B1 (ordering / F7)**: The F10 anti-over-engineering gate sat AFTER the human-review checkpoint but before stage-result, so the human confirmed a non-final spec (the F10 gate could still prune it). FIX APPLIED: the F10 gate was moved to become section 6, BEFORE the human-review checkpoint (now section 7). The human-review prompt now states the F10 gate is already applied and the spec is final, and adds "After the human confirms, do not silently re-prune or alter the spec."

- **B2 (baseline computation / F9 vs F3)**: Section 5 said "Compute M11 actual values from collected metrics (derive from the current stage metrics record)" — but the M4 core fields only contain `rework_rounds`, not the other 4 metrics, forcing the agent to either fabricate (F9 false-green) or stop (F3/Q1 violation). FIX APPLIED: section 5 now says compute each actual from the metrics data that exists (global store + task stage records), write `unknown` + reason if a metric can't be computed, never fabricate, and `unknown` does not block the stage.

## Constitution rules that govern this file

- F3: physical facts machine-collected and surfaced but MUST NOT block progress.
- F4 / Q1 / Q3: quality from heterologous review + humans, NOT blocking gates. Record facts, don't block. No self-review.
- F7: progression and irreversible actions must not auto-bypass a human; the human confirms the FINAL artifact.
- F9: falsifiable, no false-green; missing data marked unknown.
- F10: automation added only for real observed benefit.

## What to check (round 2)

1. Is B1 genuinely fixed — does the F10 gate now run before the human-review checkpoint, and does the human confirm the final spec with no silent post-confirmation mutation?
2. Is B2 genuinely fixed — is baseline comparison now a fact-recording step with an honest `unknown` path, no fabrication, no blocking?
3. Did the fixes introduce any NEW blocking issue (e.g. broken section numbering, a new contradiction, a new auto-bypass, a new over-engineering mechanism)?
4. Is the overall pipeline still internally consistent and the M6 skeleton preserved (F10 gate text, stage-result 7-key with facts.spec_ref + facts.requirements, metrics recordSkeleton/updateOwnResult)?

## Verdict format

End with EXACTLY one of these three verdicts on its own line:
- `VERDICT: pass` — no blocking issues remain.
- `VERDICT: revise_required` — list each blocking issue as B1, B2, ... with the exact line/section and the required fix.
- `VERDICT: escalate_to_human` — a judgment call only a human should make.

Be adversarial and concrete. Do not rubber-stamp. If both fixes are correct and no new blocking issue exists, return pass.

## The diff under review (full file diff after the fixes)

```diff
diff --git a/workflows/build-spec/SKILL.md b/workflows/build-spec/SKILL.md
index d17b78d..995cd37 100644
--- a/workflows/build-spec/SKILL.md
+++ b/workflows/build-spec/SKILL.md
@@ -1,38 +1,129 @@
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
 
-## F10 anti-over-engineering gate (apply before finalising the spec)
+Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output. Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.
 
-Before writing any new mechanism, validation, CI check, gate, schema, dependency, or automation into the spec, answer all four questions. If you cannot answer all four, exclude it from scope.
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
+- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
+- **If a metric cannot be computed from available data, write `unknown` in the M11 Actual cell and state the missing-data reason in a note below the table. Never fabricate a value.** A fabricated actual is a false-green (violates F9); a real `unknown` is honest.
+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
+- The direction delta indicates whether the metric moved favourably (e.g. fewer rework rounds is better, higher test execution rate is better). For an `unknown` actual, the delta is also `unknown`.
+- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
+- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
+
+Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
+
+### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
+
+This gate runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint — so any pruning it triggers happens to the spec the human will then confirm. The human must confirm the final spec, not an intermediate one (F7).
+
+Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, remove it from the spec.
 
 1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). Hypothetical threats do not justify new infrastructure.
-2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before proposing something new. Duplication is waste.
+2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before keeping something new. Duplication is waste.
 3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
-4. **What is the long-term maintenance cost?** — Every mechanism added here must be maintained across all future changes. If the cost exceeds the benefit, exclude it.
+4. **What is the long-term maintenance cost?** — Every mechanism kept here must be maintained across all future changes. If the cost exceeds the benefit, remove it.
 
-If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", stop — do not write the mechanism into the spec.
+If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", remove the mechanism from the spec.
 
 This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
 
+### 7. Human review checkpoint
+
+After spec-specify output, spec-clarify refinement, the F10 gate, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. By this point the F10 gate has already pruned the spec, so the spec the human sees is final:
+
+> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪（F10 反过度工程门已应用，spec 为最终版），请确认后继续：
+> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新 + F10 门裁剪后的最终 spec）
+> - 宪法符合性检查清单（constitution-checklist.md 21 条逐条勾选）
+> - M11 vs M10 baseline 对照表（5 项指标）
+>
+> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
+
+The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently re-prune or alter the spec — what the human confirmed is what gets recorded.
+
 ## Produce a stage-result
 
-When the stage is complete, write a `stage-result` record with:
+When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
 
 ```json
 {
@@ -45,7 +136,7 @@ When the stage is complete, write a `stage-result` record with:
   },
   "missing_items": [],
   "user_decision": false,
-  "reason": "Spec written and cross-checked against platform constraints."
+  "reason": "Spec written via spec-specify → spec-clarify → constitution check → baseline comparison, confirmed at human review checkpoint."
 }
 ```
 
@@ -67,3 +158,5 @@ Also record a metrics entry via the collector. Call `recordSkeleton` at stage st
 ```
 
 These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.
+
+At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.

```

## Final prompt

You are doing a heterologous, independent, cross-engine code review (ROUND 2).

## Context

workflowhub: microkernel orchestrator for an AI dev workflow built to a design constitution. Five-stage flow: make-decision → build-spec → build-plan → build-code → verify-code; each stage is one SKILL.md prompt-skill (prompt-only instructions an LLM agent follows).

This diff upgrades `workflows/build-spec/SKILL.md` from M6 skeleton to v1. In ROUND 1 you returned `revise_required` with two blocking issues. They have now been fixed. Verify the fixes and look for any NEW blocking issue introduced by them.

### Round-1 blocking issues (now claimed fixed):

- **B1 (ordering / F7)**: The F10 anti-over-engineering gate sat AFTER the human-review checkpoint but before stage-result, so the human confirmed a non-final spec (the F10 gate could still prune it). FIX APPLIED: the F10 gate was moved to become section 6, BEFORE the human-review checkpoint (now section 7). The human-review prompt now states the F10 gate is already applied and the spec is final, and adds "After the human confirms, do not silently re-prune or alter the spec."

- **B2 (baseline computation / F9 vs F3)**: Section 5 said "Compute M11 actual values from collected metrics (derive from the current stage metrics record)" — but the M4 core fields only contain `rework_rounds`, not the other 4 metrics, forcing the agent to either fabricate (F9 false-green) or stop (F3/Q1 violation). FIX APPLIED: section 5 now says compute each actual from the metrics data that exists (global store + task stage records), write `unknown` + reason if a metric can't be computed, never fabricate, and `unknown` does not block the stage.

## Constitution rules that govern this file

- F3: physical facts machine-collected and surfaced but MUST NOT block progress.
- F4 / Q1 / Q3: quality from heterologous review + humans, NOT blocking gates. Record facts, don't block. No self-review.
- F7: progression and irreversible actions must not auto-bypass a human; the human confirms the FINAL artifact.
- F9: falsifiable, no false-green; missing data marked unknown.
- F10: automation added only for real observed benefit.

## What to check (round 2)

1. Is B1 genuinely fixed — does the F10 gate now run before the human-review checkpoint, and does the human confirm the final spec with no silent post-confirmation mutation?
2. Is B2 genuinely fixed — is baseline comparison now a fact-recording step with an honest `unknown` path, no fabrication, no blocking?
3. Did the fixes introduce any NEW blocking issue (e.g. broken section numbering, a new contradiction, a new auto-bypass, a new over-engineering mechanism)?
4. Is the overall pipeline still internally consistent and the M6 skeleton preserved (F10 gate text, stage-result 7-key with facts.spec_ref + facts.requirements, metrics recordSkeleton/updateOwnResult)?

## Verdict format

End with EXACTLY one of these three verdicts on its own line:
- `VERDICT: pass` — no blocking issues remain.
- `VERDICT: revise_required` — list each blocking issue as B1, B2, ... with the exact line/section and the required fix.
- `VERDICT: escalate_to_human` — a judgment call only a human should make.

Be adversarial and concrete. Do not rubber-stamp. If both fixes are correct and no new blocking issue exists, return pass.

## The diff under review (full file diff after the fixes)

```diff
diff --git a/workflows/build-spec/SKILL.md b/workflows/build-spec/SKILL.md
index d17b78d..995cd37 100644
--- a/workflows/build-spec/SKILL.md
+++ b/workflows/build-spec/SKILL.md
@@ -1,38 +1,129 @@
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
 
-## F10 anti-over-engineering gate (apply before finalising the spec)
+Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output. Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.
 
-Before writing any new mechanism, validation, CI check, gate, schema, dependency, or automation into the spec, answer all four questions. If you cannot answer all four, exclude it from scope.
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
+- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
+- **If a metric cannot be computed from available data, write `unknown` in the M11 Actual cell and state the missing-data reason in a note below the table. Never fabricate a value.** A fabricated actual is a false-green (violates F9); a real `unknown` is honest.
+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
+- The direction delta indicates whether the metric moved favourably (e.g. fewer rework rounds is better, higher test execution rate is better). For an `unknown` actual, the delta is also `unknown`.
+- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
+- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
+
+Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
+
+### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
+
+This gate runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint — so any pruning it triggers happens to the spec the human will then confirm. The human must confirm the final spec, not an intermediate one (F7).
+
+Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, remove it from the spec.
 
 1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). Hypothetical threats do not justify new infrastructure.
-2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before proposing something new. Duplication is waste.
+2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before keeping something new. Duplication is waste.
 3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
-4. **What is the long-term maintenance cost?** — Every mechanism added here must be maintained across all future changes. If the cost exceeds the benefit, exclude it.
+4. **What is the long-term maintenance cost?** — Every mechanism kept here must be maintained across all future changes. If the cost exceeds the benefit, remove it.
 
-If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", stop — do not write the mechanism into the spec.
+If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", remove the mechanism from the spec.
 
 This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
 
+### 7. Human review checkpoint
+
+After spec-specify output, spec-clarify refinement, the F10 gate, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. By this point the F10 gate has already pruned the spec, so the spec the human sees is final:
+
+> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪（F10 反过度工程门已应用，spec 为最终版），请确认后继续：
+> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新 + F10 门裁剪后的最终 spec）
+> - 宪法符合性检查清单（constitution-checklist.md 21 条逐条勾选）
+> - M11 vs M10 baseline 对照表（5 项指标）
+>
+> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
+
+The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently re-prune or alter the spec — what the human confirmed is what gets recorded.
+
 ## Produce a stage-result
 
-When the stage is complete, write a `stage-result` record with:
+When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
 
 ```json
 {
@@ -45,7 +136,7 @@ When the stage is complete, write a `stage-result` record with:
   },
   "missing_items": [],
   "user_decision": false,
-  "reason": "Spec written and cross-checked against platform constraints."
+  "reason": "Spec written via spec-specify → spec-clarify → constitution check → baseline comparison, confirmed at human review checkpoint."
 }
 ```
 
@@ -67,3 +158,5 @@ Also record a metrics entry via the collector. Call `recordSkeleton` at stage st
 ```
 
 These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.
+
+At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.

```

## Raw output

```text
未发现新的阻断问题。

核对结果：

- B1 已修复：
  - F10 门现在在 [workflows/build-spec/SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:96) 第 6 节，human review 在 [第 111 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:111) 第 7 节。
  - [第 98 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:98) 明确说 F10 在 human review 前运行，剪裁发生在人类确认前。
  - [第 122 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:122) 明确禁止确认后静默重剪或改 spec。
  - [第 126 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:126) stage-result 只能在人审确认后产出，没有自动越过人类边界。

- B2 已修复：
  - [第 87 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:87) 承认只有 `rework_rounds` 是 M4 core 直接字段，其他指标来自 broader metrics corpus。
  - [第 88 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:88) 要求算不出来就写 `unknown` 并说明原因，禁止伪造。
  - [第 89 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:89) 明确 `unknown` 不阻断 stage。
  - [第 91 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:91) 明确 baseline 只是参考，不是阈值或阻断门。

- 未发现新阻断：
  - Section 编号连续：0 到 7，再到 stage-result。
  - 没有新的自动绕过 human review。
  - 没有把 constitution check 或 baseline comparison 变成 blocking gate。
  - `rework_proxy_count` 命名正确，未回退到旧名。
  - M6 骨架保留：F10 门仍在，stage-result 仍是 7 个顶层键，`facts.spec_ref` 和 `facts.requirements` 仍在，metrics 仍要求 `recordSkeleton` 和 `updateOwnResult`。

VERDICT: pass


2026-06-28T14:08:10.563391Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T14:08:10.563414Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T14:08:10.563416Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-28T14:08:10.563417Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T14:08:10.563418Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T14:08:10.563419Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T14:08:10.563421Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T14:08:10.563422Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T14:08:10.563423Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T14:08:10.563425Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T14:08:10.563426Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-28T14:08:10.563427Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: high
reasoning summaries: none
session id: 019f0e8f-238b-71b3-9f7d-5ac735a133e6
--------
user
You are doing a heterologous, independent, cross-engine code review (ROUND 2).

## Context

workflowhub: microkernel orchestrator for an AI dev workflow built to a design constitution. Five-stage flow: make-decision → build-spec → build-plan → build-code → verify-code; each stage is one SKILL.md prompt-skill (prompt-only instructions an LLM agent follows).

This diff upgrades `workflows/build-spec/SKILL.md` from M6 skeleton to v1. In ROUND 1 you returned `revise_required` with two blocking issues. They have now been fixed. Verify the fixes and look for any NEW blocking issue introduced by them.

### Round-1 blocking issues (now claimed fixed):

- **B1 (ordering / F7)**: The F10 anti-over-engineering gate sat AFTER the human-review checkpoint but before stage-result, so the human confirmed a non-final spec (the F10 gate could still prune it). FIX APPLIED: the F10 gate was moved to become section 6, BEFORE the human-review checkpoint (now section 7). The human-review prompt now states the F10 gate is already applied and the spec is final, and adds "After the human confirms, do not silently re-prune or alter the spec."

- **B2 (baseline computation / F9 vs F3)**: Section 5 said "Compute M11 actual values from collected metrics (derive from the current stage metrics record)" — but the M4 core fields only contain `rework_rounds`, not the other 4 metrics, forcing the agent to either fabricate (F9 false-green) or stop (F3/Q1 violation). FIX APPLIED: section 5 now says compute each actual from the metrics data that exists (global store + task stage records), write `unknown` + reason if a metric can't be computed, never fabricate, and `unknown` does not block the stage.

## Constitution rules that govern this file

- F3: physical facts machine-collected and surfaced but MUST NOT block progress.
- F4 / Q1 / Q3: quality from heterologous review + humans, NOT blocking gates. Record facts, don't block. No self-review.
- F7: progression and irreversible actions must not auto-bypass a human; the human confirms the FINAL artifact.
- F9: falsifiable, no false-green; missing data marked unknown.
- F10: automation added only for real observed benefit.

## What to check (round 2)

1. Is B1 genuinely fixed — does the F10 gate now run before the human-review checkpoint, and does the human confirm the final spec with no silent post-confirmation mutation?
2. Is B2 genuinely fixed — is baseline comparison now a fact-recording step with an honest `unknown` path, no fabrication, no blocking?
3. Did the fixes introduce any NEW blocking issue (e.g. broken section numbering, a new contradiction, a new auto-bypass, a new over-engineering mechanism)?
4. Is the overall pipeline still internally consistent and the M6 skeleton preserved (F10 gate text, stage-result 7-key with facts.spec_ref + facts.requirements, metrics recordSkeleton/updateOwnResult)?

## Verdict format

End with EXACTLY one of these three verdicts on its own line:
- `VERDICT: pass` — no blocking issues remain.
- `VERDICT: revise_required` — list each blocking issue as B1, B2, ... with the exact line/section and the required fix.
- `VERDICT: escalate_to_human` — a judgment call only a human should make.

Be adversarial and concrete. Do not rubber-stamp. If both fixes are correct and no new blocking issue exists, return pass.

## The diff under review (full file diff after the fixes)

```diff
diff --git a/workflows/build-spec/SKILL.md b/workflows/build-spec/SKILL.md
index d17b78d..995cd37 100644
--- a/workflows/build-spec/SKILL.md
+++ b/workflows/build-spec/SKILL.md
@@ -1,38 +1,129 @@
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
 
-## F10 anti-over-engineering gate (apply before finalising the spec)
+Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output. Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.
 
-Before writing any new mechanism, validation, CI check, gate, schema, dependency, or automation into the spec, answer all four questions. If you cannot answer all four, exclude it from scope.
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
+- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
+- **If a metric cannot be computed from available data, write `unknown` in the M11 Actual cell and state the missing-data reason in a note below the table. Never fabricate a value.** A fabricated actual is a false-green (violates F9); a real `unknown` is honest.
+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
+- The direction delta indicates whether the metric moved favourably (e.g. fewer rework rounds is better, higher test execution rate is better). For an `unknown` actual, the delta is also `unknown`.
+- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
+- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
+
+Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
+
+### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
+
+This gate runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint — so any pruning it triggers happens to the spec the human will then confirm. The human must confirm the final spec, not an intermediate one (F7).
+
+Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, remove it from the spec.
 
 1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). Hypothetical threats do not justify new infrastructure.
-2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before proposing something new. Duplication is waste.
+2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before keeping something new. Duplication is waste.
 3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
-4. **What is the long-term maintenance cost?** — Every mechanism added here must be maintained across all future changes. If the cost exceeds the benefit, exclude it.
+4. **What is the long-term maintenance cost?** — Every mechanism kept here must be maintained across all future changes. If the cost exceeds the benefit, remove it.
 
-If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", stop — do not write the mechanism into the spec.
+If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", remove the mechanism from the spec.
 
 This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
 
+### 7. Human review checkpoint
+
+After spec-specify output, spec-clarify refinement, the F10 gate, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. By this point the F10 gate has already pruned the spec, so the spec the human sees is final:
+
+> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪（F10 反过度工程门已应用，spec 为最终版），请确认后继续：
+> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新 + F10 门裁剪后的最终 spec）
+> - 宪法符合性检查清单（constitution-checklist.md 21 条逐条勾选）
+> - M11 vs M10 baseline 对照表（5 项指标）
+>
+> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
+
+The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently re-prune or alter the spec — what the human confirmed is what gets recorded.
+
 ## Produce a stage-result
 
-When the stage is complete, write a `stage-result` record with:
+When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
 
 ```json
 {
@@ -45,7 +136,7 @@ When the stage is complete, write a `stage-result` record with:
   },
   "missing_items": [],
   "user_decision": false,
-  "reason": "Spec written and cross-checked against platform constraints."
+  "reason": "Spec written via spec-specify → spec-clarify → constitution check → baseline comparison, confirmed at human review checkpoint."
 }
 ```
 
@@ -67,3 +158,5 @@ Also record a metrics entry via the collector. Call `recordSkeleton` at stage st
 ```
 
 These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.
+
+At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.

```
2026-06-28T14:08:11.431279Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
我会按 `review` 技能做只读审查，先核对当前文件和相关骨架约束，再给结论。
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
/bin/bash -lc "nl -ba workflows/build-spec/SKILL.md | sed -n '1,230p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	---
     2	name: build-spec
     3	description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
     4	---
     5	
     6	# build-spec
     7	
     8	## Goal
     9	
    10	Translate the decision log from `make-decision` into a full spec via an orchestrated pipeline. The spec becomes the sole authority that later stages (plan, code, verify) refer to.
    11	
    12	## What to do
    13	
    14	### 0. Pre-read: decision-log
    15	
    16	Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output. Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.
    17	
    18	### 1. Metrics: stage start
    19	
    20	At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
    21	
    22	### 2. spec-specify: first-draft spec
    23	
    24	Invoke `workflows/spec-specify/SKILL.md` (spec-specify):
    25	
    26	- **Input**: task-id (from the current stage context) and the functional description text extracted from the decision-log.
    27	- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
    28	- If spec-specify reports failure or the output files are missing, stop and surface the error — do not proceed to spec-clarify.
    29	
    30	### 3. spec-clarify: ambiguity scan and interactive refinement
    31	
    32	Invoke `workflows/spec-clarify/SKILL.md` (spec-clarify):
    33	
    34	- **Input**: task-id (or the explicit spec path `specs/{task-id}/spec.md`).
    35	- **Expected behaviour**: 10-dimension ambiguity scan, up to 5 interactive clarification questions (one at a time), incremental spec updates after each accepted answer, and a coverage summary at completion.
    36	- If spec-clarify reports the spec file is not found, stop — run spec-specify first.
    37	
    38	### 4. Constitution compliance check
    39	
    40	Read `constitution-checklist.md`. Check all 21 items (F1–F10, Q1–Q3, S1–S8) against the spec produced so far. For every item write `[x]` (compliant) or `[ ]` (non-compliant) with a concrete rationale sentence. No item may be left unmarked or without a rationale — all 21 must be present.
    41	
    42	The 21 items are:
    43	
    44	**Framework (F1–F10)**:
    45	- [ ] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。
    46	- [ ] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。
    47	- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
    48	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
    49	- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。
    50	- [ ] **F6 统一外置执行记录** — 判据：进度/指标/回溯是否统一记录、可回溯。
    51	- [ ] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作是否经人边界确认。
    52	- [ ] **F8 简单优先** — 判据：是否选更简单依赖更少的方案、不写掩盖问题的兜底。
    53	- [ ] **F9 可证伪不假绿** — 判据：检查是否在"实际为假"时真报失败、缺数据标未知。
    54	- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。
    55	
    56	**Quality (Q1–Q3)**:
    57	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
    58	- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
    59	- [ ] **Q3 异源审查加人工把关** — 判据：质量裁决是否由独立来源独立上下文产出、无自审自判。
    60	
    61	**Skills (S1–S8)**:
    62	- [ ] **S1 能用外部就不造轮子** — 判据：通用能力是否优先复用外部、文件直放项目内。
    63	- [ ] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。
    64	- [ ] **S3 迭代时保持最新并就地检查** — 判据：迭代时是否查更新/更优、来源路径写进技能文件。
    65	- [ ] **S4 自定义技能必须有指标系统** — 判据：自研技能是否配套指标、纳入统一执行记录。
    66	- [ ] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能是否便于子代理调用、减少主上下文占用。
    67	- [ ] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能是否参考成熟方案优化。
    68	- [ ] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。
    69	- [ ] **S8 自定义技能可独立调用可搬运** — 判据：自研技能是否可独立调用、可跨宿主搬运、不绑死环境。
    70	
    71	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
    72	
    73	Write the completed checklist as an appendix to the spec or as a standalone file `specs/{task-id}/constitution-check.md`.
    74	
    75	### 5. Baseline comparison
    76	
    77	Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:
    78	
    79	| Metric | M11 Actual | M10 Baseline | Direction Delta |
    80	| ------ | ---------- | ------------ | --------------- |
    81	| missed_step_rate | <M11 actual> | 0.05 | <delta> |
    82	| test_execution_rate | <M11 actual> | 0.8295 | <delta> |
    83	| review_execution_rate | <M11 actual> | 1 | <delta> |
    84	| rework_rounds | <M11 actual> | 6.075 | <delta> |
    85	| rework_proxy_count | <M11 actual> | 25.25 | <delta> |
    86	
    87	- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
    88	- **If a metric cannot be computed from available data, write `unknown` in the M11 Actual cell and state the missing-data reason in a note below the table. Never fabricate a value.** A fabricated actual is a false-green (violates F9); a real `unknown` is honest.
    89	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
    90	- The direction delta indicates whether the metric moved favourably (e.g. fewer rework rounds is better, higher test execution rate is better). For an `unknown` actual, the delta is also `unknown`.
    91	- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
    92	- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
    93	
    94	Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
    95	
    96	### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
    97	
    98	This gate runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint — so any pruning it triggers happens to the spec the human will then confirm. The human must confirm the final spec, not an intermediate one (F7).
    99	
   100	Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, remove it from the spec.
   101	
   102	1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). Hypothetical threats do not justify new infrastructure.
   103	2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before keeping something new. Duplication is waste.
   104	3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
   105	4. **What is the long-term maintenance cost?** — Every mechanism kept here must be maintained across all future changes. If the cost exceeds the benefit, remove it.
   106	
   107	If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", remove the mechanism from the spec.
   108	
   109	This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
   110	
   111	### 7. Human review checkpoint
   112	
   113	After spec-specify output, spec-clarify refinement, the F10 gate, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. By this point the F10 gate has already pruned the spec, so the spec the human sees is final:
   114	
   115	> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪（F10 反过度工程门已应用，spec 为最终版），请确认后继续：
   116	> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新 + F10 门裁剪后的最终 spec）
   117	> - 宪法符合性检查清单（constitution-checklist.md 21 条逐条勾选）
   118	> - M11 vs M10 baseline 对照表（5 项指标）
   119	>
   120	> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
   121	
   122	The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently re-prune or alter the spec — what the human confirmed is what gets recorded.
   123	
   124	## Produce a stage-result
   125	
   126	When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
   127	
   128	```json
   129	{
   130	  "status": "success",
   131	  "error_code": "",
   132	  "retryable": false,
   133	  "facts": {
   134	    "spec_ref": "<relative path to spec.md>",
   135	    "requirements": "<comma-separated list of FR identifiers or one-line summary>"
   136	  },
   137	  "missing_items": [],
   138	  "user_decision": false,
   139	  "reason": "Spec written via spec-specify → spec-clarify → constitution check → baseline comparison, confirmed at human review checkpoint."
   140	}
   141	```
   142	
   143	Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:
   144	
   145	```json
   146	{
   147	  "execution_id": "<uuid>",
   148	  "skill_or_stage": "build-spec",
   149	  "stage": "build-spec",
   150	  "skill_version": "1.0.0",
   151	  "executed": true,
   152	  "tokens": null,
   153	  "duration_ms": null,
   154	  "rework_rounds": 0,
   155	  "human_intervention": false,
   156	  "friction_ref": null
   157	}
   158	```
   159	
   160	These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.
   161	
   162	At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.

exec
/bin/bash -lc 'git diff -- workflows/build-spec/SKILL.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
diff --git a/workflows/build-spec/SKILL.md b/workflows/build-spec/SKILL.md
index d17b78d..995cd37 100644
--- a/workflows/build-spec/SKILL.md
+++ b/workflows/build-spec/SKILL.md
@@ -1,38 +1,129 @@
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
 
-## F10 anti-over-engineering gate (apply before finalising the spec)
+Read `tasks/{task-id}/decision-log.md` — the upstream `make-decision` output. Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.
 
-Before writing any new mechanism, validation, CI check, gate, schema, dependency, or automation into the spec, answer all four questions. If you cannot answer all four, exclude it from scope.
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
+- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
+- **If a metric cannot be computed from available data, write `unknown` in the M11 Actual cell and state the missing-data reason in a note below the table. Never fabricate a value.** A fabricated actual is a false-green (violates F9); a real `unknown` is honest.
+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
+- The direction delta indicates whether the metric moved favourably (e.g. fewer rework rounds is better, higher test execution rate is better). For an `unknown` actual, the delta is also `unknown`.
+- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
+- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
+
+Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
+
+### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
+
+This gate runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint — so any pruning it triggers happens to the spec the human will then confirm. The human must confirm the final spec, not an intermediate one (F7).
+
+Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, remove it from the spec.
 
 1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). Hypothetical threats do not justify new infrastructure.
-2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before proposing something new. Duplication is waste.
+2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before keeping something new. Duplication is waste.
 3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
-4. **What is the long-term maintenance cost?** — Every mechanism added here must be maintained across all future changes. If the cost exceeds the benefit, exclude it.
+4. **What is the long-term maintenance cost?** — Every mechanism kept here must be maintained across all future changes. If the cost exceeds the benefit, remove it.
 
-If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", stop — do not write the mechanism into the spec.
+If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", remove the mechanism from the spec.
 
 This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
 
+### 7. Human review checkpoint
+
+After spec-specify output, spec-clarify refinement, the F10 gate, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. By this point the F10 gate has already pruned the spec, so the spec the human sees is final:
+
+> **HUMAN_REVIEW_CHECKPOINT** — 以下产物已就绪（F10 反过度工程门已应用，spec 为最终版），请确认后继续：
+> - `specs/{task-id}/spec.md`（经 spec-specify 初稿 + spec-clarify 澄清更新 + F10 门裁剪后的最终 spec）
+> - 宪法符合性检查清单（constitution-checklist.md 21 条逐条勾选）
+> - M11 vs M10 baseline 对照表（5 项指标）
+>
+> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
+
+The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently re-prune or alter the spec — what the human confirmed is what gets recorded.
+
 ## Produce a stage-result
 
-When the stage is complete, write a `stage-result` record with:
+When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
 
 ```json
 {
@@ -45,7 +136,7 @@ When the stage is complete, write a `stage-result` record with:
   },
   "missing_items": [],
   "user_decision": false,
-  "reason": "Spec written and cross-checked against platform constraints."
+  "reason": "Spec written via spec-specify → spec-clarify → constitution check → baseline comparison, confirmed at human review checkpoint."
 }
 ```
 
@@ -67,3 +158,5 @@ Also record a metrics entry via the collector. Call `recordSkeleton` at stage st
 ```
 
 These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.
+
+At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.

codex
我已核对实际文件和提交 diff，当前内容与给出的 diff 一致。接下来只看阻断问题：F10 顺序、人审边界、baseline 诚实记录路径，以及 stage-result/metrics 骨架是否被破坏。
exec
/bin/bash -lc "nl -ba constitution-checklist.md | sed -n '1,220p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	# 设计宪法检查清单
     2	
     3	> 与 `CONSTITUTION.md` 逐条对应的可勾选检查清单，供每个里程碑设计/落地时对照。
     4	> 条目数严格等于宪法条目数（21）。每条勾选项后附判据，并回指宪法对应条款。
     5	> 用法：设计/落地时逐条核对，符合则勾 `[x]`。
     6	
     7	## 框架原则（F）
     8	
     9	- [ ] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。→ [CONSTITUTION.md#f1-薄核心](CONSTITUTION.md#f1-薄核心)
    10	- [ ] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。→ [CONSTITUTION.md#f2-窄契约](CONSTITUTION.md#f2-窄契约)
    11	- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。→ [CONSTITUTION.md#f3-物理事实靠机器校验但不阻断](CONSTITUTION.md#f3-物理事实靠机器校验但不阻断)
    12	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。→ [CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门](CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门)
    13	- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。→ [CONSTITUTION.md#f5-gate-谨慎添加出事再补无用则移除](CONSTITUTION.md#f5-gate-谨慎添加出事再补无用则移除)
    14	- [ ] **F6 统一外置执行记录** — 判据：进度/指标/回溯是否统一记录、可回溯。→ [CONSTITUTION.md#f6-统一外置执行记录](CONSTITUTION.md#f6-统一外置执行记录)
    15	- [ ] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作是否经人边界确认。→ [CONSTITUTION.md#f7-推进与不可逆操作不自动越过人](CONSTITUTION.md#f7-推进与不可逆操作不自动越过人)
    16	- [ ] **F8 简单优先** — 判据：是否选更简单依赖更少的方案、不写掩盖问题的兜底。→ [CONSTITUTION.md#f8-简单优先](CONSTITUTION.md#f8-简单优先)
    17	- [ ] **F9 可证伪不假绿** — 判据：检查是否在"实际为假"时真报失败、缺数据标未知。→ [CONSTITUTION.md#f9-可证伪不假绿](CONSTITUTION.md#f9-可证伪不假绿)
    18	- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。→ [CONSTITUTION.md#f10-自动化按真实收益添加不为机器可校验本身堆基建](CONSTITUTION.md#f10-自动化按真实收益添加不为机器可校验本身堆基建)
    19	
    20	## 质量原则（Q）
    21	
    22	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。→ [CONSTITUTION.md#q1-记事实而非阻断](CONSTITUTION.md#q1-记事实而非阻断)
    23	- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。→ [CONSTITUTION.md#q2-gate-三类划分](CONSTITUTION.md#q2-gate-三类划分)
    24	- [ ] **Q3 异源审查加人工把关** — 判据：质量裁决是否由独立来源独立上下文产出、无自审自判。→ [CONSTITUTION.md#q3-异源审查加人工把关](CONSTITUTION.md#q3-异源审查加人工把关)
    25	
    26	## 技能原则（S）
    27	
    28	- [ ] **S1 能用外部就不造轮子** — 判据：通用能力是否优先复用外部、文件直放项目内。（含原 S2"外部技能文件直接放项目内"，已并入本条作为落地手法。）→ [CONSTITUTION.md#s1-能用外部就不造轮子](CONSTITUTION.md#s1-能用外部就不造轮子)
    29	- [ ] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。→ [CONSTITUTION.md#s2-外部技能可针对项目改造合宪](CONSTITUTION.md#s2-外部技能可针对项目改造合宪)
    30	- [ ] **S3 迭代时保持最新并就地检查** — 判据：迭代时是否查更新/更优、来源路径写进技能文件。→ [CONSTITUTION.md#s3-迭代时保持最新并就地检查](CONSTITUTION.md#s3-迭代时保持最新并就地检查)
    31	- [ ] **S4 自定义技能必须有指标系统** — 判据：自研技能是否配套指标、纳入统一执行记录。→ [CONSTITUTION.md#s4-自定义技能必须有指标系统](CONSTITUTION.md#s4-自定义技能必须有指标系统)
    32	- [ ] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能是否便于子代理调用、减少主上下文占用。→ [CONSTITUTION.md#s5-自定义技能方便子代理调用省主上下文](CONSTITUTION.md#s5-自定义技能方便子代理调用省主上下文)
    33	- [ ] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能是否参考成熟方案优化。→ [CONSTITUTION.md#s6-自定义技能参考市面方案不闭门造车](CONSTITUTION.md#s6-自定义技能参考市面方案不闭门造车)
    34	- [ ] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。→ [CONSTITUTION.md#s7-一阶段一技能一工作流一文件夹](CONSTITUTION.md#s7-一阶段一技能一工作流一文件夹)
    35	- [ ] **S8 自定义技能可独立调用可搬运** — 判据：自研技能是否可独立调用、可跨宿主搬运、不绑死环境。→ [CONSTITUTION.md#s8-自定义技能可独立调用可搬运](CONSTITUTION.md#s8-自定义技能可独立调用可搬运)
    36	
    37	---
    38	
    39	**条目数**：21（框架 10 + 质量 3 + 技能 8），等于 `CONSTITUTION.md` 宪法条目数。
    40	**勾选说明**：`[ ]` 未核 / `[x]` 已核符合。每条须能跳回宪法对应条款。

exec
/bin/bash -lc 'rg -n "''^## Step|''^## Workflow|Findings|Blocking|Review" /Users/Hugh/.claude/skills/gstack/review/SKILL.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
761:## Step 0: Detect platform and base branch
800:# Pre-Landing PR Review
806:## Step 1: Check branch
814:## Step 1.5: Scope Drift Detection
893:- Review report sections (`## GSTACK REVIEW REPORT`)
895:- CEO Review Decisions sections (these record choices, not work items)
1051:## Step 2: Read the checklist
1059:## Step 2.5: Check for Greptile review comments
1069:## Step 3: Get the diff
1086:## Step 3.4: Workspace-aware queue status (advisory)
1108:## Step 3.5: Slop scan (advisory)
1161:## Step 4: Critical pass (core review)
1243:## Step 4.5: Review Army — Specialist Dispatch
1449:## Step 5: Fix-First Review
1485:Output a summary header: `Pre-Landing Review: N issues (X critical, Y informational)`
1575:## Step 5.5: TODOS cross-reference
1587:## Step 5.6: Documentation staleness check
1601:## Step 5.7: Adversarial review (always-on)
1673:codex exec "IMPORTANT: Do NOT read or execute any files under ~/.claude/, ~/.agents/, .claude/skills/, or agents/. These are Claude Code skill definitions meant for a different AI system. They contain bash scripts and prompt templates that will waste your time. Ignore them completely. Do NOT modify agents/openai.yaml. Stay focused on the repository code only.\n\nReview the changes on this branch against the base branch. Run DIFF_BASE=$(git merge-base origin/<base> HEAD) && git diff "$DIFF_BASE" to see the diff. Your job is to find ways this code will fail in production. Think like an attacker and a chaos engineer. Find edge cases, race conditions, security holes, resource leaks, failure modes, and silent data corruption paths. Be adversarial. Be thorough. No compliments — just the problems. End your output with ONE line in the canonical format `Recommendation: <action> because <one-line reason naming the most exploitable finding>`. Generic reasons like 'because it's safer' do not qualify; the reason must point to a specific finding or no-fix rationale." -C "$_REPO_ROOT" -s read-only -c 'model_reasoning_effort="high"' --enable web_search_cached < /dev/null 2>"$TMPERR_ADV"
1702:codex review "IMPORTANT: Do NOT read or execute any files under ~/.claude/, ~/.agents/, .claude/skills/, or agents/. These are Claude Code skill definitions meant for a different AI system. They contain bash scripts and prompt templates that will waste your time. Ignore them completely. Do NOT modify agents/openai.yaml. Stay focused on the repository code only.\n\nReview the changes on this branch against the base branch <base>. Run git diff origin/<base>...HEAD 2>/dev/null || git diff <base>...HEAD to see the diff and review only those changes." -c 'model_reasoning_effort="high"' --enable web_search_cached < /dev/null 2>"$TMPERR"
1755:## Step 5.8: Persist Eng Review result
1758:recognize that Eng Review was run on this branch.

exec
/bin/bash -lc 'rg -n "recordSkeleton|updateOwnResult|rework_proxy_count|baseline-report|stage-result|facts|requirements" -S .' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
./CLAUDE.md:54:定位当前段:看 specs/{task-id}/ 下已有的 stage-result-&lt;stage&gt;.json,最后产出那段=已完成,下一段=要做的。
./CLAUDE.md:60:- 上游 stage-result-&lt;上一段&gt;.json ← 当前段的输入
./CLAUDE.md:64:1. 照 SKILL.md 步骤走,完成后按契约把 stage-result 落盘到 specs/{task-id}/,经 metrics/collector.mjs 记指标。
./CLAUDE.md:69:开始别先总结计划。先定位当前段、读 SKILL.md + 上游 stage-result,再报真实状态 + 下一步动作。
./CLAUDE.md:127:Each issue carries a small KV `metadata` bag — a high-signal scratchpad where agents pin the handful of facts that future runs on this same issue will look up over and over (the PR URL, the deploy URL, what we're blocked on). It is NOT a place to record every fact you discover — that's what comments and the description are for. Most runs write **zero** new keys; that's the expected case, not a failure.
./task-metrics.jsonl:1:{"execution_id":"smoke-test-exec-id-001","verdict":"pass","facts":{"exit_code":null,"git_sha":"fc142b066ee05627f244e6ac6257398932336b69","files_changed":["CLAUDE.md"],"review_invoked":false}}
./CONTEXT.md:47:- 不单独产 stage-result（stage-result 一段一张，由顶层 stage 产），只产 collector 指标记录。
./scripts/check-metrics-schema.mjs:51:    facts: {},
./scripts/check-stage-quality.mjs:70: *   (a) a call to collectFacts (or a function named collectFacts / collectfacts / collect_facts)
./scripts/check-stage-quality.mjs:113: * The compliant use of stage_result / stage-result: it is a CI/spec-layer format
./scripts/check-stage-quality.mjs:119: *   (a) import or require of a "stage-result" or "stage_result" contract/schema
./scripts/check-stage-quality.mjs:126:  description: "stage_result/stage-result contract used to throw/block at runtime",
./scripts/check-stage-quality.mjs:128:    // Check (a): import of stage-result or stage_result
./scripts/check-stage-quality.mjs:178: * scanSkillMetrics — check whether a single SKILL.md has both recordSkeleton
./scripts/check-stage-quality.mjs:179: * AND updateOwnResult instructions (i.e. is correctly wired to metrics/collector.mjs).
./scripts/check-stage-quality.mjs:182: *   - `recordSkeleton`  (call at stage start)
./scripts/check-stage-quality.mjs:183: *   - `updateOwnResult` (call at stage end)
./scripts/check-stage-quality.mjs:203:  const hasRecordSkeleton = /\brecordSkeleton\b/.test(content);
./scripts/check-stage-quality.mjs:204:  const hasUpdateOwnResult = /\bupdateOwnResult\b/.test(content);
./scripts/check-stage-quality.mjs:207:  // Rationale: token names alone (recordSkeleton/updateOwnResult) could appear in docs
./scripts/check-stage-quality.mjs:216:  // is not flagged here (recordSkeleton/updateOwnResult checks already catch unwired skills).
./scripts/check-stage-quality.mjs:235:  // B1 fix: wired skills (recordSkeleton + updateOwnResult + collector.mjs all present)
./scripts/check-stage-quality.mjs:245:  if (!hasRecordSkeleton) missing.push("recordSkeleton");
./scripts/check-stage-quality.mjs:246:  if (!hasUpdateOwnResult) missing.push("updateOwnResult");
./contracts/execution-record.contract.json:1:{"version":"1.0.0","validated_by_stage":"design","required_fields":[{"name":"execution_id","type":"string"},{"name":"progress","type":"object"},{"name":"facts","type":"object"},{"name":"metrics","type":"object"},{"name":"feedback","type":"object"},{"name":"boundary_decisions","type":"object"},{"name":"trace_index","type":"object"}]}
./workflows/make-decision/SKILL.md:3:description: Clarify requirements with the user, then produce a decision log that captures the agreed direction and scope.
./workflows/make-decision/SKILL.md:34:   3. **决策记录** — one entry per decision; each entry MUST carry a non-empty `来源证据` field. The chosen direction maps to facts key `decision`.
./workflows/make-decision/SKILL.md:36:   5. **明确不做** — items explicitly excluded, with brief reason each. The in/out boundary maps to facts key `scope`.
./workflows/make-decision/SKILL.md:39:3. Record the path of this file as facts key `decision_log_path`.
./workflows/make-decision/SKILL.md:41:## Produce stage-result
./workflows/make-decision/SKILL.md:43:When the stage is complete, write a `stage-result` record with:
./workflows/make-decision/SKILL.md:50:  "facts": {
./workflows/make-decision/SKILL.md:61:Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:
./contracts/facts-subschema.json:3:  "description": "Per-stage facts sub-schema (FR-CONTRACT-002 / D11). Each stage must have the listed required_keys present and non-empty in facts.",
./contracts/facts-subschema.json:14:      "required_keys": ["spec_ref", "requirements"],
./contracts/facts-subschema.json:17:        "requirements": "Functional requirements list or count"
./contracts/facts-subschema.json:30:        "changed": "List of changed artifacts from this stage",
./docs/freeze-and-retire.md:21:- 基线来源记录在 baseline-report.md 中
./scripts/ci-chain-check.mjs:19:  JSON.parse(readFileSync(`${specsDir}/stage-result-make-decision.json`, 'utf-8'));
./scripts/ci-chain-check.mjs:20:  console.log('[OK] make-decision stage-result exists and is valid JSON');
./scripts/ci-chain-check.mjs:26:// 2. build-code: verify facts.tests.command
./scripts/ci-chain-check.mjs:28:  const bc = JSON.parse(readFileSync(`${specsDir}/stage-result-build-code.json`, 'utf-8'));
./scripts/ci-chain-check.mjs:29:  if (!bc.facts?.tests?.command || typeof bc.facts.tests.command !== 'string') {
./scripts/ci-chain-check.mjs:30:    console.error('[FAIL] build-code: facts.tests.command missing or not string');
./scripts/ci-chain-check.mjs:33:    console.log(`[OK] build-code: facts.tests.command = ${bc.facts.tests.command}`);
./scripts/ci-chain-check.mjs:40:// 3. verify-code: check 7-key structure at TOP level (aligned with facts-assembly.mjs assembleStageResult)
./scripts/ci-chain-check.mjs:42:  const vc = JSON.parse(readFileSync(`${specsDir}/stage-result-verify-code.json`, 'utf-8'));
./scripts/ci-chain-check.mjs:52:  console.error(`[FAIL] verify-code stage-result: ${e.message}`);
./tests/stage-result-contract.test.mjs:2: * stage-result-contract.test.mjs — M5 Phase 4 (T012/T013).
./tests/stage-result-contract.test.mjs:13:const contractPath = join(import.meta.dirname, "..", "contracts", "stage-result.contract.json");
./tests/stage-result-contract.test.mjs:23:    facts: {},
./tests/stage-result-contract.test.mjs:70:      "facts",
./tests/stage-result-contract.test.mjs:181:      facts: { attempt: 2 },
./tests/stage-result-contract.test.mjs:192:// A minimal real downstream consumer (core/decide-from-stage-result.mjs) reads
./contracts/stage-result.contract.json:1:{"version":"1.0.0","validated_by_stage":"design","allowed_status_values":["success","failed","unknown"],"required_fields":[{"name":"status","type":"string"},{"name":"error_code","type":"string"},{"name":"retryable","type":"boolean"},{"name":"facts","type":"object"},{"name":"missing_items","type":"object","semantic":"array"},{"name":"user_decision","type":"boolean"},{"name":"reason","type":"string"}]}
./scripts/validate-stage-result.mjs:3: * validate-stage-result.mjs — M6 Phase 2 (FR-CONTRACT-001/002 / D11).
./scripts/validate-stage-result.mjs:5: * Validates a stage-result artifact in two steps:
./scripts/validate-stage-result.mjs:6: *   1. Top-level contract: contracts/stage-result.contract.json (seven required fields + types).
./scripts/validate-stage-result.mjs:7: *   2. Per-stage facts sub-schema: contracts/facts-subschema.json (each stage's required_keys,
./scripts/validate-stage-result.mjs:11: * CLI:     node scripts/validate-stage-result.mjs <stage> <artifact-json-path>
./scripts/validate-stage-result.mjs:26:  readFileSync(resolve(repoRoot, "contracts", "stage-result.contract.json"), "utf8")
./scripts/validate-stage-result.mjs:28:const factsSubschema = JSON.parse(
./scripts/validate-stage-result.mjs:29:  readFileSync(resolve(repoRoot, "contracts", "facts-subschema.json"), "utf8")
./scripts/validate-stage-result.mjs:33: * Returns true if a facts value is considered "non-empty":
./scripts/validate-stage-result.mjs:51: * Step 1: validates artifact against stage-result.contract.json.
./scripts/validate-stage-result.mjs:52: * Step 2: validates artifact.facts against the per-stage facts sub-schema.
./scripts/validate-stage-result.mjs:54: * additionalProperties in facts are allowed — only the agreed required_keys are enforced.
./scripts/validate-stage-result.mjs:59:  // Step 1: top-level stage-result contract
./scripts/validate-stage-result.mjs:65:  // Step 2: per-stage facts sub-schema
./scripts/validate-stage-result.mjs:66:  const stageSchema = factsSubschema.stages[stage];
./scripts/validate-stage-result.mjs:68:    errors.push(`unknown stage: "${stage}" — not defined in facts-subschema.json`);
./scripts/validate-stage-result.mjs:72:  const facts = artifact.facts;
./scripts/validate-stage-result.mjs:74:    if (!(key in facts)) {
./scripts/validate-stage-result.mjs:75:      errors.push(`facts missing required key for stage "${stage}": "${key}"`);
./scripts/validate-stage-result.mjs:76:    } else if (!isNonEmpty(facts[key])) {
./scripts/validate-stage-result.mjs:78:        `facts["${key}"] for stage "${stage}" must be non-empty (got ${JSON.stringify(facts[key])})`
./scripts/validate-stage-result.mjs:95:    console.error("Usage: node scripts/validate-stage-result.mjs <stage> <artifact-json-path>");
./scripts/validate-stage-result.mjs:104:    console.error(`[validate-stage-result] Failed to read artifact: ${err.message}`);
./scripts/validate-stage-result.mjs:110:    console.log(`[validate-stage-result] PASS — stage "${stage}" artifact valid`);
./scripts/validate-stage-result.mjs:114:      console.error(`[validate-stage-result] FAIL: ${e}`);
./metrics/collector.mjs:124: * recordSkeleton — timing 1: skill start. Lays down a minimal record (FR-COLLECT-003).
./metrics/collector.mjs:127:export function recordSkeleton(seed, cfg) {
./metrics/collector.mjs:148: * updateOwnResult — timing 2: skill end. Patches the record's own result fields
./metrics/collector.mjs:151:export function updateOwnResult(execution_id, patch, cfg) {
./metrics/collector.mjs:164: * collectFacts — FR-FACT-001/002/003: write 4 physical facts into the task record.
./metrics/collector.mjs:165: * Derives facts from real zero-cost sources (patch for exit_code, git for sha/files,
./metrics/collector.mjs:212:    const facts = { exit_code, git_sha, files_changed, review_invoked };
./metrics/collector.mjs:213:    const ok = upsert(cfg.taskMetricsPath, execution_id, { facts }, cfg);
./tasks/m11-build-spec-v1/task-metrics.jsonl:1:{"execution_id":"e3f6b5cb-e755-4a27-95de-d6d94da76683","skill_or_stage":"make-decision","stage":"make-decision","skill_version":"1.0.0","executed":true,"tokens":null,"duration_ms":null,"rework_rounds":0,"human_intervention":true,"friction_ref":null,"action_count":0,"stage_unit":null,"exit_code":0,"facts":{"exit_code":0,"git_sha":"fc142b066ee05627f244e6ac6257398932336b69","files_changed":["CLAUDE.md"],"review_invoked":false}}
./tasks/m11-build-spec-v1/task-metrics.jsonl:2:{"execution_id":"0505c0fa-163d-4f4d-9686-93ac8c9e096c","skill_or_stage":"scope-triage","stage":"scope-triage","skill_version":"1.0.0","executed":true,"tokens":null,"duration_ms":null,"rework_rounds":0,"human_intervention":true,"friction_ref":null,"action_count":0,"stage_unit":null,"exit_code":0,"facts":{"exit_code":0,"git_sha":"fc142b066ee05627f244e6ac6257398932336b69","files_changed":["CLAUDE.md"],"review_invoked":false}}
./tasks/m11-build-spec-v1/task-metrics.jsonl:3:{"execution_id":"aec14e6c-5c70-4572-b357-005526d05850","skill_or_stage":"decision-log","stage":"decision-log","skill_version":"1.0.0","executed":true,"tokens":null,"duration_ms":null,"rework_rounds":0,"human_intervention":false,"friction_ref":null,"action_count":0,"stage_unit":null,"exit_code":0,"facts":{"exit_code":0,"git_sha":"fc142b066ee05627f244e6ac6257398932336b69","files_changed":["CLAUDE.md"],"review_invoked":false}}
./tasks/m11-build-spec-v1/task-metrics.jsonl:4:{"execution_id":"8670a839-1508-436d-8f1d-7fec8fe83558","skill_or_stage":"build-spec","stage":"build-spec","skill_version":"1.0.0","executed":true,"tokens":null,"duration_ms":null,"rework_rounds":1,"human_intervention":false,"friction_ref":null,"action_count":0,"stage_unit":null,"exit_code":0,"facts":{"exit_code":0,"git_sha":"fc142b066ee05627f244e6ac6257398932336b69","files_changed":["CLAUDE.md"],"review_invoked":false}}
./tasks/m11-build-spec-v1/task-metrics.jsonl:5:{"execution_id":"01336176-3013-47bf-91e9-c9b36db01535","skill_or_stage":"build-plan","stage":"build-plan","skill_version":"1.0.0","executed":true,"tokens":null,"duration_ms":null,"rework_rounds":4,"human_intervention":false,"friction_ref":null,"action_count":0,"stage_unit":null,"exit_code":0,"facts":{"exit_code":0,"git_sha":"fc142b066ee05627f244e6ac6257398932336b69","files_changed":["CLAUDE.md"],"review_invoked":false}}
./tests/boundary-confirm.test.mjs:15:import { recordSkeleton } from "../metrics/collector.mjs";
./tests/boundary-confirm.test.mjs:52:  recordSkeleton(
./metrics/execution-record.mjs:22:  "facts",
./tests/build-code-review.test.mjs:2:import { buildReviewFact, getWarnings } from '../workflows/build-code/facts-schema.mjs';
./tests/build-code-review.test.mjs:5:  it('builds a valid facts.review object for executed/third_party/pass', () => {
./scripts/agenthub-baseline.mjs:26:  "defect_count",  // renamed to rework_proxy_count on output (D10)
./scripts/agenthub-baseline.mjs:97:  rework_proxy_count: { source_type: "weak_proxy", source_ref: "journal: checkpoint_request" },
./scripts/agenthub-baseline.mjs:205: * rework_proxy_count: sum of max(0, count-1) across stages
./scripts/agenthub-baseline.mjs:268:      obj.rework_proxy_count = obj.defect_count;
./metrics/adapters/host-adapter.mjs:10:import { recordSkeleton, updateOwnResult, updateStageImpact } from "../collector.mjs";
./metrics/adapters/host-adapter.mjs:19:      return recordSkeleton(seed, cfg);
./metrics/adapters/host-adapter.mjs:22:      return updateOwnResult(execution_id, patch ?? {}, cfg);
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:7:This change upgrades `workflows/build-spec/SKILL.md` from the generic M6 skeleton to "v1". The v1 build-spec orchestrates a pipeline: pre-read decision-log → metrics recordSkeleton → call spec-specify (first-draft spec) → call spec-clarify (ambiguity scan + interactive refinement) → 21-clause constitution compliance check → M10-baseline comparison → one human-review checkpoint → stage-result.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:11:- F3: physical facts are machine-collected and surfaced but MUST NOT block progress.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:12:- F4 / Q1 / Q3: quality comes from heterologous review + humans, NOT from blocking quality gates. Record facts, do not block. No self-review.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:25:3. Has exactly ONE human-review checkpoint, placed before stage-result, that does not auto-bypass the human (F7).
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:26:4. Preserves the M6 skeleton's essential elements (F10 anti-over-engineering gate, stage-result 7-key contract with facts.spec_ref + facts.requirements, metrics recordSkeleton/updateOwnResult).
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:29:7. The baseline table uses the correct fifth metric name `rework_proxy_count` (NOT any older name) and the M10 baseline values are presented as reference, not thresholds.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:50:-description: Turn the agreed direction into a structured spec that is the single source of truth for requirements.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:51:+description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:65:-3. Write a spec with at minimum: core scenarios (Given/When/Then), functional requirements (FR), explicit non-goals, acceptance criteria, and affected areas.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:67:-5. Record the spec location (facts key: `spec_ref`) and a summary of requirements (facts key: `requirements`).
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:74:+At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:81:+- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:125:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:131:+Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:139:+| rework_proxy_count | <M11 actual> | 25.25 | <delta> |
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:144:+- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:146:+Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:150:+After spec-specify output, spec-clarify refinement, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint:
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:157:+> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:159:+The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step.
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:165: ## Produce a stage-result
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:167:-When the stage is complete, write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:168:+When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:172:@@ -45,7 +132,7 @@ When the stage is complete, write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:181:@@ -67,3 +154,5 @@ Also record a metrics entry via the collector. Call `recordSkeleton` at stage st
./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:186:+At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.
./tasks/m11-build-spec-v1/stage-result-make-decision.json:5:  "facts": {
./tasks/m11-build-spec-v1/stage-result-build-plan.json:5:  "facts": {
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:11:- **B1 (ordering / F7)**: The F10 anti-over-engineering gate sat AFTER the human-review checkpoint but before stage-result, so the human confirmed a non-final spec (the F10 gate could still prune it). FIX APPLIED: the F10 gate was moved to become section 6, BEFORE the human-review checkpoint (now section 7). The human-review prompt now states the F10 gate is already applied and the spec is final, and adds "After the human confirms, do not silently re-prune or alter the spec."
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:17:- F3: physical facts machine-collected and surfaced but MUST NOT block progress.
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:18:- F4 / Q1 / Q3: quality from heterologous review + humans, NOT blocking gates. Record facts, don't block. No self-review.
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:28:4. Is the overall pipeline still internally consistent and the M6 skeleton preserved (F10 gate text, stage-result 7-key with facts.spec_ref + facts.requirements, metrics recordSkeleton/updateOwnResult)?
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:49:-description: Turn the agreed direction into a structured spec that is the single source of truth for requirements.
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:50:+description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:64:-3. Write a spec with at minimum: core scenarios (Given/When/Then), functional requirements (FR), explicit non-goals, acceptance criteria, and affected areas.
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:66:-5. Record the spec location (facts key: `spec_ref`) and a summary of requirements (facts key: `requirements`).
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:75:+At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:82:+- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:126:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:132:+Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:140:+| rework_proxy_count | <M11 actual> | 25.25 | <delta> |
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:142:+- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:147:+- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:149:+Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:171:+After spec-specify output, spec-clarify refinement, the F10 gate, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. By this point the F10 gate has already pruned the spec, so the spec the human sees is final:
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:178:+> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:180:+The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently re-prune or alter the spec — what the human confirmed is what gets recorded.
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:182: ## Produce a stage-result
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:184:-When the stage is complete, write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:185:+When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:189:@@ -45,7 +136,7 @@ When the stage is complete, write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:198:@@ -67,3 +158,5 @@ Also record a metrics entry via the collector. Call `recordSkeleton` at stage st
./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:203:+At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.
./tasks/m11-build-spec-v1/stage-result-build-spec.json:5:  "facts": {
./tasks/m11-build-spec-v1/stage-result-build-spec.json:7:    "requirements": "28 FR across 11 groups: FR-TASK(2,任务级五段自举+task-id路径稳定), FR-SPECIFY(5), FR-CLARIFY(5), FR-DECOUPLE(3,feature身份显式化fail-loud), FR-TEMPLATE(2,脚手架内置化), FR-CONSTITUTION(3,21条逐条勾选只记录不阻断), FR-BASELINE(3,M10 5项对照 rework_proxy_count真名), FR-REGISTRY(2), FR-REVIEW(1,一次人审), FR-SKELETON(2,F10+stage-result契约不回归); 10条验收(AC1-8 roadmap/派生 + AC9五段闭环 + AC10路径稳定); 每FR可溯D-M11-x。"
./tests/agenthub-baseline.test.mjs:41:      "rework_proxy_count",
./tests/agenthub-baseline.test.mjs:83:  it("rework_proxy_count is a non-negative number", () => {
./tests/agenthub-baseline.test.mjs:86:    const v = data.metrics.rework_proxy_count;
./tests/agenthub-baseline.test.mjs:102:      "rework_proxy_count",
./tasks/m11-build-spec-v1/decision-log.md:28:> 走完整五段顺序自举、`m11-build-spec-v1`、用 M10 `baseline-report.md` 5 项指标。另外还有一些需求：
./tasks/m11-build-spec-v1/decision-log.md:59:### D-M11-3 对照基线 = M10 baseline-report.md 5 项指标
./tasks/m11-build-spec-v1/decision-log.md:60:- **决策**：自举 task vs 基线的对照，用 M10 `specs/archive/m10-baseline-switch/baseline-report.md` 的 5 项流程指标。字段以 baseline-report.md 实际落盘字段名为准（不混写）：
./tasks/m11-build-spec-v1/decision-log.md:65:  5. `rework_proxy_count`（返工代理计数）—— **即 roadmap §8.3 所称"缺陷数"在 M10 的落地实现：用返工代理计数作缺陷代理（defect proxy）。不写成 `defect_count`，统一用 baseline-report.md 真名 `rework_proxy_count`。**
./tasks/m11-build-spec-v1/decision-log.md:67:- **来源证据**：第二轮原文"用 M10 baseline-report.md 5 项指标"。**M10 基线聚合快照（已核对 baseline-report.md 真实落盘值，非记忆）**：missed_step_rate=0.05, test_execution_rate=0.8295, review_execution_rate=1, rework_rounds=6.075, rework_proxy_count=25.25。
./tasks/m11-build-spec-v1/decision-log.md:105:| stage-summary / evidence(MCP) | **不迁移** | workflowhub 用 stage-result JSON + collector.mjs 替代 |
./tasks/m11-build-spec-v1/decision-log.md:120:- [ASSUMPTION] M10 baseline-report.md 5 项指标口径可直接套用到 M11 自举 task 度量（M10 已做字段映射 field-mapping.md）。
./tasks/m11-build-spec-v1/decision-log.md:145:3. **对照度量产出**：能输出 M11 自举 task vs M10 基线的 5 项指标对照（missed_step_rate/test_execution_rate/review_execution_rate/rework_rounds/rework_proxy_count，字段名以 baseline-report.md 为准；阈值人拍、不达标不阻断；产不出即失败）。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:230:+- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:231:+- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:265:+> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:287:+   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:311:+   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:364:+    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:382:+- `specs/{task-id}/checklists/requirements.md`：质量检查清单
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:826:+- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:827:+- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:861:+> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:883:+   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:907:+   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:960:+    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:978:+- `specs/{task-id}/checklists/requirements.md`：质量检查清单
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1496:+- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1497:+- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1531:+> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1553:+   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1577:+   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1630:+    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1648:+- `specs/{task-id}/checklists/requirements.md`：质量检查清单
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1890:    11	> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1912:    33	   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1936:    57	   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:1989:   110	    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:2007:   128	- `specs/{task-id}/checklists/requirements.md`：质量检查清单
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:2423:   197	- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:2424:   198	- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:2454:/bin/bash -lc 'rg -n "必须恰好提供一个|spec not found|每题须为多选题|每题答案后保存|一次只呈现一题|10 维|Clear / Partial / Missing|Resolved|Deferred|Outstanding|recordSkeleton|updateOwnResult" workflows/spec-clarify/SKILL.md workflows/spec-specify/SKILL.md workflows/spec-specify/templates/spec-template.md' in /Users/Hugh/Hugh/Project/workflowhub
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:2456:workflows/spec-specify/SKILL.md:11:> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:2457:workflows/spec-specify/SKILL.md:33:   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:2458:workflows/spec-specify/SKILL.md:110:    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:2472:workflows/spec-clarify/SKILL.md:197:- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r2-pass.md:2473:workflows/spec-clarify/SKILL.md:198:- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:11:## What M11 must satisfy (authoritative roadmap facts — the ground truth)
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:24:Round1: build M11 as a real task. Round2: full 5-stage sequential bootstrap; task-id = m11-build-spec-v1; use M10 baseline-report.md 5 metrics; PLUS req-1 (migrate speckit skills into workflowhub, may rename, enable multi-task parallel, no per-project speckit init needed) and req-2 (evaluate other agenthub design-stage skills for porting). Round3: req-1 detail = rename to spec-specify / spec-clarify (avoid clash with local speckit-* skills); ZERO per-project clone wanted ("I don't want future-project clone, I want to use the skill directly, clone nothing"); speckit's constitution idea should become a UNIVERSAL all-project constitution, NOT project-specific; project-specific constitution goes via CLAUDE.md and AGENTS.md. req-2 = "good" (accepted the routing).
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:29:B. Constitution alignment: workflowhub constitution = thin core, narrow contracts, NO blocking quality gates (quality via heterologous review + human), record-facts-not-block, simple-first/falsifiable, F10 anti-over-engineering. Does any decision violate these? Especially: does the speckit de-coupling / rename create over-engineering or hidden blocking gates?
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:70:> 走完整五段顺序自举、`m11-build-spec-v1`、用 M10 `baseline-report.md` 5 项指标。另外还有一些需求：
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:101:### D-M11-3 对照基线 = M10 baseline-report.md 5 项指标
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:102:- **决策**：自举 task vs 基线的对照，用 M10 `specs/archive/m10-baseline-switch/baseline-report.md` 的 5 项流程指标：漏步骤率 / 测试执行率 / 审查执行率 / 返工轮次 / 缺陷数。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:104:- **来源证据**：第二轮原文"用 M10 baseline-report.md 5 项指标"。M10 基线快照：missed_step_rate=0.05, test_execution_rate=0.875, review_execution_rate=0.1, rework_rounds=0, rework_proxy_count=0。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:142:| stage-summary / evidence(MCP) | **不迁移** | workflowhub 用 stage-result JSON + collector.mjs 替代 |
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:157:- [ASSUMPTION] M10 baseline-report.md 5 项指标口径可直接套用到 M11 自举 task 度量（M10 已做字段映射 field-mapping.md）。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:191:## What M11 must satisfy (authoritative roadmap facts — the ground truth)
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:204:Round1: build M11 as a real task. Round2: full 5-stage sequential bootstrap; task-id = m11-build-spec-v1; use M10 baseline-report.md 5 metrics; PLUS req-1 (migrate speckit skills into workflowhub, may rename, enable multi-task parallel, no per-project speckit init needed) and req-2 (evaluate other agenthub design-stage skills for porting). Round3: req-1 detail = rename to spec-specify / spec-clarify (avoid clash with local speckit-* skills); ZERO per-project clone wanted ("I don't want future-project clone, I want to use the skill directly, clone nothing"); speckit's constitution idea should become a UNIVERSAL all-project constitution, NOT project-specific; project-specific constitution goes via CLAUDE.md and AGENTS.md. req-2 = "good" (accepted the routing).
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:209:B. Constitution alignment: workflowhub constitution = thin core, narrow contracts, NO blocking quality gates (quality via heterologous review + human), record-facts-not-block, simple-first/falsifiable, F10 anti-over-engineering. Does any decision violate these? Especially: does the speckit de-coupling / rename create over-engineering or hidden blocking gates?
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:250:> 走完整五段顺序自举、`m11-build-spec-v1`、用 M10 `baseline-report.md` 5 项指标。另外还有一些需求：
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:281:### D-M11-3 对照基线 = M10 baseline-report.md 5 项指标
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:282:- **决策**：自举 task vs 基线的对照，用 M10 `specs/archive/m10-baseline-switch/baseline-report.md` 的 5 项流程指标：漏步骤率 / 测试执行率 / 审查执行率 / 返工轮次 / 缺陷数。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:284:- **来源证据**：第二轮原文"用 M10 baseline-report.md 5 项指标"。M10 基线快照：missed_step_rate=0.05, test_execution_rate=0.875, review_execution_rate=0.1, rework_rounds=0, rework_proxy_count=0。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:322:| stage-summary / evidence(MCP) | **不迁移** | workflowhub 用 stage-result JSON + collector.mjs 替代 |
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:337:- [ASSUMPTION] M10 baseline-report.md 5 项指标口径可直接套用到 M11 自举 task 度量（M10 已做字段映射 field-mapping.md）。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:373:- D-M11-3 / 验收标准 3：M10 第 5 个基线指标写法不一致。权威事实要求 5 项是 `missed_step_rate, test_execution_rate, review_execution_rate, rework_rounds, defect_count`，但 D-M11-3 的快照写成 `rework_proxy_count=0`。验收标准 3 又写“缺陷数”。这会导致后续比较口径跑偏。必须统一为 `defect_count`，如果历史文件里实际字段叫 `rework_proxy_count`，也要明确说明它如何映射为 `defect_count`，不能混写。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:383:COVERAGE-CHECK: yes，三轮用户决策基本完整捕获；但 `defect_count` 被 D-M11-3 的 `rework_proxy_count` 混写扭曲，必须修正后才可继续。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:412:## What M11 must satisfy (authoritative roadmap facts — the ground truth)
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:425:Round1: build M11 as a real task. Round2: full 5-stage sequential bootstrap; task-id = m11-build-spec-v1; use M10 baseline-report.md 5 metrics; PLUS req-1 (migrate speckit skills into workflowhub, may rename, enable multi-task parallel, no per-project speckit init needed) and req-2 (evaluate other agenthub design-stage skills for porting). Round3: req-1 detail = rename to spec-specify / spec-clarify (avoid clash with local speckit-* skills); ZERO per-project clone wanted ("I don't want future-project clone, I want to use the skill directly, clone nothing"); speckit's constitution idea should become a UNIVERSAL all-project constitution, NOT project-specific; project-specific constitution goes via CLAUDE.md and AGENTS.md. req-2 = "good" (accepted the routing).
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:430:B. Constitution alignment: workflowhub constitution = thin core, narrow contracts, NO blocking quality gates (quality via heterologous review + human), record-facts-not-block, simple-first/falsifiable, F10 anti-over-engineering. Does any decision violate these? Especially: does the speckit de-coupling / rename create over-engineering or hidden blocking gates?
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:471:> 走完整五段顺序自举、`m11-build-spec-v1`、用 M10 `baseline-report.md` 5 项指标。另外还有一些需求：
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:502:### D-M11-3 对照基线 = M10 baseline-report.md 5 项指标
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:503:- **决策**：自举 task vs 基线的对照，用 M10 `specs/archive/m10-baseline-switch/baseline-report.md` 的 5 项流程指标：漏步骤率 / 测试执行率 / 审查执行率 / 返工轮次 / 缺陷数。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:505:- **来源证据**：第二轮原文"用 M10 baseline-report.md 5 项指标"。M10 基线快照：missed_step_rate=0.05, test_execution_rate=0.875, review_execution_rate=0.1, rework_rounds=0, rework_proxy_count=0。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:543:| stage-summary / evidence(MCP) | **不迁移** | workflowhub 用 stage-result JSON + collector.mjs 替代 |
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:558:- [ASSUMPTION] M10 baseline-report.md 5 项指标口径可直接套用到 M11 自举 task 度量（M10 已做字段映射 field-mapping.md）。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:596:- D-M11-3 / 验收标准 3：M10 第 5 个基线指标写法不一致。权威事实要求 5 项是 `missed_step_rate, test_execution_rate, review_execution_rate, rework_rounds, defect_count`，但 D-M11-3 的快照写成 `rework_proxy_count=0`。验收标准 3 又写“缺陷数”。这会导致后续比较口径跑偏。必须统一为 `defect_count`，如果历史文件里实际字段叫 `rework_proxy_count`，也要明确说明它如何映射为 `defect_count`，不能混写。
./tasks/m11-build-spec-v1/review-make-decision-codex-r1.md:606:COVERAGE-CHECK: yes，三轮用户决策基本完整捕获；但 `defect_count` 被 D-M11-3 的 `rework_proxy_count` 混写扭曲，必须修正后才可继续。
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:8:-description: Turn the agreed direction into a structured spec that is the single source of truth for requirements.
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:9:+description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:23:-3. Write a spec with at minimum: core scenarios (Given/When/Then), functional requirements (FR), explicit non-goals, acceptance criteria, and affected areas.
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:25:-5. Record the spec location (facts key: `spec_ref`) and a summary of requirements (facts key: `requirements`).
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:34:+At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:41:+- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:85:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:91:+Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:99:+| rework_proxy_count | <M11 actual> | 25.25 | <delta> |
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:101:+- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:106:+- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:108:+Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:130:+After spec-specify output, spec-clarify refinement, the F10 gate, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. By this point the F10 gate has already pruned the spec, so the spec the human sees is final:
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:137:+> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:139:+The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently re-prune or alter the spec — what the human confirmed is what gets recorded.
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:141: ## Produce a stage-result
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:143:-When the stage is complete, write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:144:+When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:148:@@ -45,7 +136,7 @@ When the stage is complete, write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:157:@@ -67,3 +158,5 @@ Also record a metrics entry via the collector. Call `recordSkeleton` at stage st
./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:162:+At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.
./workflows/verify-code/SKILL.md:22:Read `specs/{task-id}/stage-result-build-code.json`, extract `facts.tests.command`. If the command field is missing, surface an explicit error and stop. Do not proceed silently without a test command.
./workflows/verify-code/SKILL.md:26:At stage start, call `metrics/collector.mjs` `recordSkeleton`, passing a seed with all 10 core fields:
./workflows/verify-code/SKILL.md:47:Call `node workflows/verify-code/capture.mjs` with the command extracted in step 1. Write the evidence to `specs/{task-id}/evidence/fresh-capture.json`. The capture script records: exit code, git SHA, Test Files line, content hash, timestamp, and command — all durable, externally-verifiable facts.
./workflows/verify-code/SKILL.md:72:- **User rejects**: Set `user_decision=false`, terminate the skill, and record the reason in the stage-result (FR-CLOSE-002).
./workflows/verify-code/SKILL.md:74:### 8. stage-result 落盘
./workflows/verify-code/SKILL.md:76:Call `facts-assembly.mjs` `assembleStageResult` + `writeStageResult`. Write the stage-result to `specs/{task-id}/stage-result-verify-code.json` (FR-PATH-001). The `final-test-report.md` goes to `specs/{task-id}/test/` (FR-PATH-002).
./workflows/verify-code/SKILL.md:78:The stage-result record has this structure:
./workflows/verify-code/SKILL.md:85:  "facts": {
./workflows/verify-code/SKILL.md:97:Call `updateOwnResult` to finalize the metrics record, then call `import("./metrics-writer.mjs").then(m => m.runMetricsWriter({ taskDir, taskId, verdict, executionId }))` to record task-metrics.jsonl for M10 baseline comparison. Metrics write failure only warns — it does not throw (FR-METRICS-002, F3).
./workflows/verify-code/SKILL.md:99:## Produce a stage-result
./workflows/verify-code/SKILL.md:101:When verification is complete, write a `stage-result` record with:
./workflows/verify-code/SKILL.md:108:  "facts": {
./workflows/verify-code/SKILL.md:118:Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:
./workflows/verify-code/SKILL.md:120:> **M10 wiring**: After calling `recordSkeleton` and `updateOwnResult`, also call `../../workflows/verify-code/metrics-writer.mjs` `runMetricsWriter({ taskDir, taskId, verdict, executionId })` to record task-metrics.jsonl for baseline comparison (FR-COLL-001).
./workflows/scope-triage/SKILL.md:11:This is a **component skill**. It does NOT produce its own `stage-result`. The calling collector or foreman is responsible for writing all stage-level records. This skill produces only a scope verdict that the caller consumes.
./workflows/scope-triage/SKILL.md:19:- Requirement text, user story, or upstream stage-result content (from `make-decision` or direct user input).
./workflows/scope-triage/SKILL.md:41:This skill does NOT write its own `stage-result`. The calling collector MUST write ONE independent metric record with `"stage": "scope-triage"` (never `"make-decision"`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line.
./workflows/scope-triage/SKILL.md:43:Call `recordSkeleton` at invocation start and `updateOwnResult` at completion, passing at minimum:
./specs/m11-build-spec-v1/tasks.md:23:新建 `workflows/spec-specify/` 目录，含 SKILL.md（改造自 speckit-specify）和内置模板 `templates/spec-template.md`（workflowhub archive 风格）。spec-specify 接受 task-id 参数生成 `specs/{task-id}/spec.md` + `specs/{task-id}/checklists/requirements.md`，不做 git 分支操作、不读目标项目 `.specify/`。
./specs/m11-build-spec-v1/tasks.md:46:  6. **质量检查清单**：生成 `specs/{task-id}/checklists/requirements.md`，检查项含无实现细节泄漏/FR 可测试/成功标准可度量/验收场景已定义/边界已标识/范围已明确
./specs/m11-build-spec-v1/tasks.md:49:  9. **metrics 接入**：指令调用 `metrics/collector.mjs` 的 recordSkeleton + updateOwnResult，stage 字段填 `spec-specify`
./specs/m11-build-spec-v1/tasks.md:101:  grep -q "recordSkeleton" workflows/spec-specify/SKILL.md || fail "metrics wiring missing"
./specs/m11-build-spec-v1/tasks.md:102:  grep -q "checklists/requirements" workflows/spec-specify/SKILL.md || fail "checklist generation not found"
./specs/m11-build-spec-v1/tasks.md:125:spec-specify SKILL.md 出现实际执行 git checkout / git branch / create-new-feature.sh 的指令（禁止性声明如"不执行 git checkout"和来源说明不算）→ 停（违 FR-DECOUPLE-001）。task-id 缺失时未声明 fail-loud → 停（违 FR-DECOUPLE-001）。模板路径含 `.specify/` 目录读取指令（禁止性声明不算）→ 停（违 FR-DECOUPLE-002）。无 recordSkeleton 引用 → 停（违 S4 指标系统）。
./specs/m11-build-spec-v1/tasks.md:169:  8. **metrics 接入**：指令调用 `metrics/collector.mjs` 的 recordSkeleton + updateOwnResult，stage 字段填 `spec-clarify`
./specs/m11-build-spec-v1/tasks.md:209:  grep -q "recordSkeleton" workflows/spec-clarify/SKILL.md || fail "metrics wiring missing"
./specs/m11-build-spec-v1/tasks.md:240:将 `workflows/build-spec/SKILL.md` 从 M6 薄骨架升级为 v1 完整提示词：集成 spec-specify → spec-clarify → 宪法符合性检查 → baseline 对照 → 人审检查点 → 产 stage-result + metrics。保留 M6 F10 gate、stage-result 七键契约、metrics 调用指令。
./specs/m11-build-spec-v1/tasks.md:253:  2. **metrics 开始**：stage 启动时指令调用 `metrics/collector.mjs` recordSkeleton，传入 M4 10 核心字段 seed
./specs/m11-build-spec-v1/tasks.md:262:     - 指标名：missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count
./specs/m11-build-spec-v1/tasks.md:263:     - M10 baseline 值：0.05 / 0.8295 / 1 / 6.075 / 25.25（来自 `specs/archive/m10-baseline-switch/baseline-report.md`）
./specs/m11-build-spec-v1/tasks.md:266:     - 第 5 项命名使用 `rework_proxy_count`，不用旧称（FR-BASELINE-003）
./specs/m11-build-spec-v1/tasks.md:267:  7. **人审检查点**：在 spec 生成/澄清/宪法检查/baseline 对照全部完成后、产出 stage-result 之前，明文停顿等人确认：
./specs/m11-build-spec-v1/tasks.md:271:     - 人确认 → 继续；人拒绝或未确认 → 不自动推进到 stage-result 产出
./specs/m11-build-spec-v1/tasks.md:272:  8. **stage-result 产出**：沿用 M6 七键结构（status/error_code/retryable/facts/missing_items/user_decision/reason），facts 含 spec_ref + requirements（FR-SKELETON-002）
./specs/m11-build-spec-v1/tasks.md:273:  9. **metrics 结束**：指令调用 updateOwnResult，metrics 写失败只 warn 不 throw
./specs/m11-build-spec-v1/tasks.md:296:  grep -q "rework_proxy_count" workflows/build-spec/SKILL.md || fail "rework_proxy_count missing"
./specs/m11-build-spec-v1/tasks.md:304:  STAGE_COUNT=$(grep -c "spec_ref\|requirements" workflows/build-spec/SKILL.md)
./specs/m11-build-spec-v1/tasks.md:305:  test "$STAGE_COUNT" -ge 2 || fail "stage-result contract ($STAGE_COUNT < 2)"
./specs/m11-build-spec-v1/tasks.md:307:  METRICS_COUNT=$(grep -c "recordSkeleton\|updateOwnResult" workflows/build-spec/SKILL.md)
./specs/m11-build-spec-v1/tasks.md:315:- **验证目标**：build-spec v1 SKILL.md 集成两技能+宪法检查+baseline 对照+人审检查点+F10 gate/stage-result/metrics 保留（FR-*）
./specs/m11-build-spec-v1/tasks.md:324:- F10 gate 4 问、stage-result 七键、metrics recordSkeleton/updateOwnResult 是从 M6 继承的不变体——v1 只能追加内容，不可删除或重命名这些元素
./specs/m11-build-spec-v1/tasks.md:423:    grep -q "recordSkeleton" "$f" || fail "$f missing recordSkeleton"
./specs/m11-build-spec-v1/tasks.md:429:  grep -q "requirements" workflows/build-spec/SKILL.md || fail "requirements missing"
./specs/m11-build-spec-v1/tasks.md:433:  grep -q "rework_proxy_count" workflows/build-spec/SKILL.md || fail "rework_proxy_count naming missing"
./specs/m11-build-spec-v1/reviews/phase-3.diff:8:-description: Turn the agreed direction into a structured spec that is the single source of truth for requirements.
./specs/m11-build-spec-v1/reviews/phase-3.diff:9:+description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
./specs/m11-build-spec-v1/reviews/phase-3.diff:23:-3. Write a spec with at minimum: core scenarios (Given/When/Then), functional requirements (FR), explicit non-goals, acceptance criteria, and affected areas.
./specs/m11-build-spec-v1/reviews/phase-3.diff:25:-5. Record the spec location (facts key: `spec_ref`) and a summary of requirements (facts key: `requirements`).
./specs/m11-build-spec-v1/reviews/phase-3.diff:32:+At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
./specs/m11-build-spec-v1/reviews/phase-3.diff:39:+- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
./specs/m11-build-spec-v1/reviews/phase-3.diff:83:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./specs/m11-build-spec-v1/reviews/phase-3.diff:89:+Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:
./specs/m11-build-spec-v1/reviews/phase-3.diff:97:+| rework_proxy_count | <M11 actual> | 25.25 | <delta> |
./specs/m11-build-spec-v1/reviews/phase-3.diff:102:+- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
./specs/m11-build-spec-v1/reviews/phase-3.diff:104:+Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
./specs/m11-build-spec-v1/reviews/phase-3.diff:108:+After spec-specify output, spec-clarify refinement, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint:
./specs/m11-build-spec-v1/reviews/phase-3.diff:115:+> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
./specs/m11-build-spec-v1/reviews/phase-3.diff:117:+The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step.
./specs/m11-build-spec-v1/reviews/phase-3.diff:123: ## Produce a stage-result
./specs/m11-build-spec-v1/reviews/phase-3.diff:125:-When the stage is complete, write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3.diff:126:+When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3.diff:130:@@ -45,7 +132,7 @@ When the stage is complete, write a `stage-result` record with:
./specs/m11-build-spec-v1/reviews/phase-3.diff:139:@@ -67,3 +154,5 @@ Also record a metrics entry via the collector. Call `recordSkeleton` at stage st
./specs/m11-build-spec-v1/reviews/phase-3.diff:144:+At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.
./tests/metric-scan.test.mjs:5: * A skill is "wired" when its SKILL.md contains recordSkeleton and updateOwnResult
./tests/metric-scan.test.mjs:65:// A minimal SKILL.md with NO metrics wiring (missing recordSkeleton / updateOwnResult)
./tests/metric-scan.test.mjs:77:## Produce stage-result
./tests/metric-scan.test.mjs:79:When stage complete, write \`stage-result\` record with the usual fields.
./tests/metric-scan.test.mjs:82:// A minimal SKILL.md WITH correct metrics wiring (recordSkeleton + updateOwnResult +
./tests/metric-scan.test.mjs:96:## Produce stage-result
./tests/metric-scan.test.mjs:98:Also record metrics entry via collector. Call \`recordSkeleton\` at stage start
./tests/metric-scan.test.mjs:99:and \`updateOwnResult\` at stage end, passing at minimum the core fields.
./tests/metric-scan.test.mjs:127:  it("scanSkillMetrics detects a skill SKILL.md without recordSkeleton/updateOwnResult", async () => {
./tests/metric-scan.test.mjs:139:  it("scanSkillMetrics: SKILL.md with only recordSkeleton but NOT updateOwnResult → missing", async () => {
./tests/metric-scan.test.mjs:147:Call \`recordSkeleton\` at stage start but never update result.
./tests/metric-scan.test.mjs:155:  it("scanSkillMetrics: SKILL.md with only updateOwnResult but NOT recordSkeleton → missing", async () => {
./tests/metric-scan.test.mjs:163:Call \`updateOwnResult\` at stage end but no skeleton at start.
./tests/metric-scan.test.mjs:177:  it("scanSkillMetrics: SKILL.md with both recordSkeleton AND updateOwnResult → no violation", async () => {
./tests/metric-scan.test.mjs:197:    it(`${skill}/SKILL.md has both recordSkeleton and updateOwnResult`, async () => {
./tests/metric-scan.test.mjs:215:// NEG-C: wired skill (recordSkeleton + updateOwnResult + collector.mjs) BUT
./tests/metric-scan.test.mjs:221:  it("NEG-C: SKILL.md with recordSkeleton+updateOwnResult+collector.mjs but NO stage key in JSON block → found:true", async () => {
./tests/metric-scan.test.mjs:235:Call \`recordSkeleton\` at stage start and \`updateOwnResult\` at stage end.
./tests/metric-scan.test.mjs:260:  it("scope-triage/SKILL.md passes full scanSkillMetrics (recordSkeleton + updateOwnResult + collector.mjs + correct stage)", async () => {
./tests/metric-scan.test.mjs:267:  it("decision-log/SKILL.md passes full scanSkillMetrics (recordSkeleton + updateOwnResult + collector.mjs + correct stage)", async () => {
./tests/metric-scan.test.mjs:293:  // Negative A: content has recordSkeleton + updateOwnResult but MISSING collector.mjs string.
./tests/metric-scan.test.mjs:297:  it("NEG-A: SKILL.md with recordSkeleton+updateOwnResult but NO collector.mjs → found:true (FR-METRIC-003)", async () => {
./tests/metric-scan.test.mjs:305:description: A skill that has recordSkeleton and updateOwnResult but lacks collector reference.
./tests/metric-scan.test.mjs:312:Call \`recordSkeleton\` at stage start and \`updateOwnResult\` at stage end.
./tests/metric-scan.test.mjs:342:Call \`recordSkeleton\` at stage start and \`updateOwnResult\` at stage end.
./specs/m11-build-spec-v1/spec.md:27:- 基线对照度量：产出 M11 自举 task vs M10 baseline 5 项指标对照（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count），阈值人拍、不达标不阻断、产不出对照即失败
./specs/m11-build-spec-v1/spec.md:39:workflowhub 的 build-spec stage（M6 五段薄骨架之一）现阶段只是通用"写 spec"提示词骨架：读 decision-log → 写 spec → 产 stage-result → 记 metrics。功能太薄，缺少 speckit 改造后的 spec 生成/澄清能力、缺少宪法符合性检查、缺少自举对照度量、缺少 reuse-registry 登记。M10 自举切换点已完成，需要一个低风险 task 来验证 workflowhub 自研五段流程真能跑通——M11 build-spec v1 就是这个验证载体。
./specs/m11-build-spec-v1/spec.md:59:- 保留 M6 骨架已有的 F10 反过度工程 gate + stage-result 契约 + metrics collector 契约（不回归）
./specs/m11-build-spec-v1/spec.md:81:- **操作步骤**：调起 `/build-spec`，build-spec v1 内部按提示词执行：读 decision-log → 调 spec-specify 生成 spec 初稿 → 调 spec-clarify 消除歧义 → 执行宪法符合性检查（逐条勾选 constitution-checklist.md 21 条，结果写入 spec 产物）→ 执行 M10 baseline 5 项指标对照 → 在人审检查点停顿等确认 → 产 stage-result。
./specs/m11-build-spec-v1/spec.md:82:- **预期结果**：`specs/m11-build-spec-v1/spec.md` 存在且含必要章节（场景 / FR / 不做 / 验收 / 影响范围，缺一即失败）；宪法符合性检查结果可见（21 条逐条勾，无输出即失败）；M10 baseline 5 项对照已产出（产不出即失败）；stage-result facts 含 `spec_ref` + `requirements`。
./specs/m11-build-spec-v1/spec.md:111:- **操作步骤**：对本次 M11 自举 task 采集 5 项指标（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count），与 M10 baseline 值（0.05 / 0.8295 / 1 / 6.075 / 25.25）逐项对照，输出对照表。阈值由人设定（不在 build-spec 内硬编码），不达标不阻断推进。
./specs/m11-build-spec-v1/spec.md:117:- **操作步骤**：SKILL.md 提示词在此处写明停顿文字，要求执行者在继续前等待人工确认。确认后继续后续步骤（stage-result 产出 + metrics 写入）。
./specs/m11-build-spec-v1/spec.md:130:- **预期结果**：缺 FR 场景或硬门五章缺失→ build-spec 报错、不产 stage-result success、status=failure。
./specs/m11-build-spec-v1/spec.md:147:- **操作步骤**：验证 F10 gate 仍在 SKILL.md 中（4 问可 grep）、stage-result 契约字段不变（spec_ref + requirements）、metrics collector 调用不变（recordSkeleton + updateOwnResult）。
./specs/m11-build-spec-v1/spec.md:153:- **操作步骤**：按顺序执行 make-decision → build-spec → build-plan → build-code → verify-code，每段产出一份 stage-result JSON（落 `specs/m11-build-spec-v1/stage-result-{stage}.json`）并写一条 metrics collector 记录。
./specs/m11-build-spec-v1/spec.md:154:- **预期结果**：5 段 stage-result JSON 文件均存在（缺任一段即失败）；5 条 metrics 记录均存在（缺任一条即失败）。执行顺序可被验证（stage-result 文件时间戳或执行记录体现串行顺序）。
./specs/m11-build-spec-v1/spec.md:159:- **操作步骤**：按 D-M11-2 约定的路径访问——task 追踪根 `tasks/m11-build-spec-v1/`（含 decision-log.md）、spec 产物根 `specs/m11-build-spec-v1/`（含 spec.md 和各段 stage-result JSON）。
./specs/m11-build-spec-v1/spec.md:160:- **预期结果**：三条路径基线均可解析：`tasks/m11-build-spec-v1/decision-log.md` 存在、`specs/m11-build-spec-v1/spec.md` 存在、`specs/m11-build-spec-v1/` 目录作为 stage-result 落盘根可写。task-id 拼写固定为 `m11-build-spec-v1`，不因分支名或环境变量变化。
./specs/m11-build-spec-v1/spec.md:170:**FR-TASK-001**：M11 自举 task（task-id=m11-build-spec-v1）必须跑完 workflowhub 完整五段流程（make-decision → build-spec → build-plan → build-code → verify-code），五段按序执行、各不跳过。每段产出一份 stage-result JSON 文件（落 `specs/m11-build-spec-v1/stage-result-{stage}.json`）并写一条独立 metrics collector 记录。任一段缺失、任一段 stage-result 文件不存在、任一段 metrics 记录缺失即判任务级验收失败。（来源：D-M11-1——走完整五段顺序自举，产不出对照即失败）
./specs/m11-build-spec-v1/spec.md:171:- **场景**：Given M11 自举 task 执行完成，When 检查 `specs/m11-build-spec-v1/` 目录，Then 5 段 stage-result JSON 均在（make-decision / build-spec / build-plan / build-code / verify-code），缺任一段即失败。
./specs/m11-build-spec-v1/spec.md:175:**FR-TASK-002**：task-id 固定为 `m11-build-spec-v1`，产物路径基线以该 task-id 为唯一锚定——task 追踪根 `tasks/m11-build-spec-v1/`（含 decision-log.md）、spec 产物根 `specs/m11-build-spec-v1/`（含 spec.md + 各段 stage-result JSON）。task-id 不得因分支名、环境变量或执行上下文改变，下游消费者可直接按该字面量解析路径。（来源：D-M11-2——task-id = m11-build-spec-v1，产物落 specs/m11-build-spec-v1/，task 追踪根 tasks/m11-build-spec-v1/）
./specs/m11-build-spec-v1/spec.md:177:- **场景**：Given 某段 stage-result 未按约定路径落盘（如落在分支名推导路径），When 验收，Then 判"路径不稳定"失败。
./specs/m11-build-spec-v1/spec.md:192:**FR-SPECIFY-004**：spec-specify 完成后必须生成 spec 质量检查清单（类似 speckit-specify 的 `checklists/requirements.md`），检查项含：无实现细节泄漏、FR 可测试且无歧义、成功标准可度量、所有验收场景已定义、边界已标识、范围已明确。（来源：D-M11-4 + D-M11-5——保留 speckit-specify 质量检查清单机制；附录B 经验#2）
./specs/m11-build-spec-v1/spec.md:193:- **场景**：Given spec-specify 完成 spec 生成，When 检查产物，Then `checklists/requirements.md` 存在且各检查项已逐条勾选。
./specs/m11-build-spec-v1/spec.md:253:**FR-CONSTITUTION-002**：宪法符合性检查输出仅记录不阻断——checklist 勾选结果（含不达标条目）浮现到 spec 产物中供人审查，不因 checklist 不达标而阻断 build-spec 后续推进（stage-result 仍可 status=success）。（来源：D-M11-8 验收 2 注释、D5/D7/F4/Q1）
./specs/m11-build-spec-v1/spec.md:254:- **场景**：Given checklist 有 5 条不达标（`[ ]`），When build-spec v1 完成，Then stage-result status=success（若无其他阻塞），不达标仅记录不阻断。
./specs/m11-build-spec-v1/spec.md:264:**FR-BASELINE-001**：build-spec v1 流程必须产出 M11 自举 task vs M10 baseline 的 5 项指标对照——指标名为 missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count，M10 baseline 值为 0.05 / 0.8295 / 1 / 6.075 / 25.25（来自 `specs/archive/m10-baseline-switch/baseline-report.md`），对照表含指标名 + M11 实值 + M10 baseline 值 + 方向 delta。（来源：D-M11-3——对照基线 = M10 baseline-report.md 5 项指标）
./specs/m11-build-spec-v1/spec.md:268:- **场景**：Given 对照表中某指标 M11 值远差于 M10 baseline，When build-spec v1 完成，Then 不因指标差距阻断，stage-result 正常产出，对照表浮现供人判断。
./specs/m11-build-spec-v1/spec.md:270:**FR-BASELINE-003**：第 5 项指标命名必须使用 `rework_proxy_count`（M10 baseline-report.md 落盘字段真名），不得使用 roadmap 缺陷数口径旧称或其它别名。对照表表头、文档叙述、代码标识符均用此名。（来源：D-M11-3——统一用 baseline-report.md 真名 rework_proxy_count）
./specs/m11-build-spec-v1/spec.md:271:- **场景**：Given 对照表表头或叙述中出现非 `rework_proxy_count` 的别名/旧称（如 roadmap 缺陷数口径旧字段名），When 验收，Then 判命名不合规，失败。
./specs/m11-build-spec-v1/spec.md:288:**FR-REVIEW-001**：build-spec v1 的 SKILL.md 必须含一且仅一次人审检查点——在 spec 生成/澄清/宪法检查/基线对照全部完成后、产出 stage-result 之前，SKILL.md 提示词明文要求执行者停顿等人确认。（来源：D-M11-8 验收 5——一次人审）
./specs/m11-build-spec-v1/spec.md:290:- **场景**：Given build-spec v1 在人审检查点未获确认，When 尝试继续，Then 不自动推进到 stage-result 产出步骤。
./specs/m11-build-spec-v1/spec.md:299:**FR-SKELETON-002**：M6 build-spec SKILL.md 中定义的 stage-result 契约（status / error_code / retryable / facts.spec_ref / facts.requirements / missing_items / user_decision / reason）和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。v1 可追加新 facts 字段，不可删除或重命名已有字段。（来源：D-M11-1——完整五段自举要求每段保留既有契约，build-spec 段不可回归 M6 骨架接口；附录B 经验#8）
./specs/m11-build-spec-v1/spec.md:300:- **场景**：Given build-spec v1 产出的 stage-result JSON，When 校验，Then 含 spec_ref + requirements（M6 既有字段在场），且 status/error_code/retryable/missing_items/user_decision/reason 结构不变。
./specs/m11-build-spec-v1/spec.md:301:- **场景**：Given build-spec v1 SKILL.md，When 检查，Then grep 到 recordSkeleton + updateOwnResult 调用指令在场。
./specs/m11-build-spec-v1/spec.md:307:> 各模块之间通过 stage-result 产物文件和 prompt 文本引用单向传递，属窄契约耦合。
./specs/m11-build-spec-v1/spec.md:311:- **负责什么**：build-spec v1 流程主控——编排 spec-specify → spec-clarify → 宪法符合性检查 → baseline 对照 → 人审检查点 → 产 stage-result + metrics。
./specs/m11-build-spec-v1/spec.md:312:- **对外接口**：产 `specs/{task-id}/spec.md` + stage-result JSON + metrics record。
./specs/m11-build-spec-v1/spec.md:314:- **测试边界**：提示词文件存在性 + 路径引用可 grep + F10 gate 在场 + stage-result 契约字段不回归。
./specs/m11-build-spec-v1/spec.md:319:- **对外接口**：输入为 task-id + 描述文本；输出为 `specs/{task-id}/spec.md` + `specs/{task-id}/checklists/requirements.md`。
./specs/m11-build-spec-v1/spec.md:346:**build-spec v1 stage-result 产物**（沿用 M6 结构，M11 可追加不删改）：
./specs/m11-build-spec-v1/spec.md:350:- `facts.spec_ref`：相对路径指向产出 spec（如 `specs/m11-build-spec-v1/spec.md`）
./specs/m11-build-spec-v1/spec.md:351:- `facts.requirements`：FR 标识符列表或单行摘要
./specs/m11-build-spec-v1/spec.md:374:- 5 行（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count），每行 4 列（指标名 / M11 实值 / M10 baseline 值 / delta）
./specs/m11-build-spec-v1/spec.md:384:- **build-spec stage-result**：每次 build-spec 执行产出一份，落 `specs/{task-id}/stage-result-build-spec.json`。同一 task 重跑覆盖前次。
./specs/m11-build-spec-v1/spec.md:389:- **metrics 记录**：recordSkeleton 在 build-spec 开始时写入，updateOwnResult 在结束时补全。metrics 写失败只 warn 不 throw（对齐 CONSTITUTION F3/Q1）。
./specs/m11-build-spec-v1/spec.md:422:- **M6 骨架不回归**：F10 gate / stage-result 契约 / metrics 契约均保留（FR-SKELETON-001/002）。
./specs/m11-build-spec-v1/spec.md:440:- [ ] **AC3 — 对照度量产出**：产出 M11 自举 task vs M10 baseline 5 项指标对照表（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count，M10 baseline 值为 0.05 / 0.8295 / 1 / 6.075 / 25.25），每行 4 列非空。（来源：D-M11-8 验收 3）
./specs/m11-build-spec-v1/spec.md:464:- [ ] **AC9 — 五段自举闭环（任务级）**：M11 自举 task 跑完 5 段（make-decision → build-spec → build-plan → build-code → verify-code），5 段 stage-result JSON 均落 `specs/m11-build-spec-v1/` 目录，5 段各有一条 metrics collector 记录（共 5 条，缺任一段即失败）。（来源：D-M11-1——走完整五段顺序自举）
./specs/m11-build-spec-v1/spec.md:465:  - 验证方式：检查 `specs/m11-build-spec-v1/` 下存在 5 个 stage-result-{stage}.json 文件 + task-metrics.jsonl 中 5 段各有记录。
./specs/m11-build-spec-v1/spec.md:466:  - 反向：任一段 stage-result 缺失、任一段 metrics 无记录、或执行顺序可证明跳段 → 失败。注：此为任务级验收，非 build-spec 自身能力的验收——build-spec 自身 stage-result 仍由 AC1 覆盖。
./specs/m11-build-spec-v1/spec.md:487:  - 本需求影响：升级为 v1，集成 spec-specify/clarify → 宪法符合性检查 → baseline 对照 → 人审 → 产 stage-result 的完整流程。
./specs/m11-build-spec-v1/spec.md:488:  - 回归要点：F10 gate、stage-result 契约（spec_ref / requirements）、metrics 调用（recordSkeleton / updateOwnResult）必须保留不减。
./specs/m11-build-spec-v1/spec.md:521:| stage-summary / evidence(MCP) | **不迁移** | workflowhub 用 stage-result JSON + collector.mjs 替代 |
./specs/m11-build-spec-v1/spec.md:535:2. **speckit-specify 质量检查清单**（`checklists/requirements.md`）：保留为 FR-SPECIFY-004，确保 spec 在进入 plan 前自检完整性。
./specs/m11-build-spec-v1/spec.md:547:1. **stage-summary（开始/结束版）** → 替换为 **stage-result JSON**。理由：workflowhub 用结构化 JSON 替代 prose 报告（M3 窄契约 stage-result），stage-summary 的进度追踪功能由 M4 collector.mjs 的 recordSkeleton/updateOwnResult 覆盖。design.md 的"待办模板"模式在 workflowhub 中由 TodoWrite 工具承担。
./specs/m11-build-spec-v1/spec.md:548:2. **evidence(MCP) + journal.jsonl** → 替换为 **collector.mjs recordSkeleton/updateOwnResult**。理由：workflowhub 已有自研 M4 metrics 底座，不需要 MCP primitive。指标证据统一进 task-metrics.jsonl + global metrics。design.md 的 journal 事件溯源模型被 metrics 记录替代。
./tests/metrics-smoke.test.mjs:38:      // verify the metrics file exists (collector creates it on updateOwnResult)
./workflows/verify-code/freshness.mjs:5: * @param {string|null|undefined} buildSha — git_sha from build-code facts
./workflows/verify-code/freshness.mjs:23:      message: `stale_sha: build-code facts git_sha (${b || 'missing'}) does not match current HEAD (${h || 'missing'}) — verify-code results may not reflect latest code`,
./workflows/build-plan/SKILL.md:10:Take the spec from `build-spec` and decompose it into a concrete plan (`plan.md`) and a sequenced task list (`tasks.md`). The plan is the bridge between requirements and code.
./workflows/build-plan/SKILL.md:21:8. Record the plan location (facts key: `plan_ref`) and a summary of tasks (facts key: `tasks`).
./workflows/build-plan/SKILL.md:36:## Produce a stage-result
./workflows/build-plan/SKILL.md:38:When the stage is complete, write a `stage-result` record with:
./workflows/build-plan/SKILL.md:45:  "facts": {
./workflows/build-plan/SKILL.md:55:Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:
./tests/fact-collector.test.mjs:4: * FR-FACT-001/002/003: collectFacts writes 4 physical facts into task record.
./tests/fact-collector.test.mjs:17:import { collectFacts, recordSkeleton } from "../metrics/collector.mjs";
./tests/fact-collector.test.mjs:24:  workDir = mkdtempSync(join(tmpdir(), "m5-facts-"));
./tests/fact-collector.test.mjs:53:  it("fact collector writes 4 physical facts", () => {
./tests/fact-collector.test.mjs:54:    // Drive collection via the REAL caller path (makeHostAdapter -> onSkillEnd -> updateOwnResult).
./tests/fact-collector.test.mjs:57:    const execution_id = "exec-facts-001";
./tests/fact-collector.test.mjs:68:    // onSkillEnd passes patch (with exit_code) to updateOwnResult which calls collectFacts.
./tests/fact-collector.test.mjs:76:    expect(record.facts).toBeDefined();
./tests/fact-collector.test.mjs:78:    expect(record.facts.exit_code).toBe(0);
./tests/fact-collector.test.mjs:80:    expect(typeof record.facts.git_sha).toBe("string");
./tests/fact-collector.test.mjs:81:    expect(record.facts.git_sha.length).toBeGreaterThan(0);
./tests/fact-collector.test.mjs:83:    expect(Array.isArray(record.facts.files_changed)).toBe(true);
./tests/fact-collector.test.mjs:85:    expect(typeof record.facts.review_invoked).toBe("boolean");
./tests/fact-collector.test.mjs:91:    const execution_id = "exec-facts-002";
./tests/fact-collector.test.mjs:94:    recordSkeleton(
./tests/fact-collector.test.mjs:104:    expect(record?.facts?.review_invoked).toBe(false);
./tests/fact-collector.test.mjs:112:    const execution_id = "exec-facts-003";
./tests/execution-record.test.mjs:4: * (progress / facts / metrics / feedback / boundary_decisions / trace_index).
./tests/execution-record.test.mjs:27:    facts: { coreDiffEmpty: true },
./tests/execution-record.test.mjs:39:      "facts",
./tests/execution-record.test.mjs:130:      progress: {}, facts: {}, metrics: { ref: "a" }, feedback: { ref: "b" },
./tests/facts-subschema.test.mjs:2: * facts-subschema.test.mjs — M6 Phase 2 (FR-CONTRACT-002 / D11).
./tests/facts-subschema.test.mjs:4: * Validates that validateStageResult enforces per-stage facts sub-schema:
./tests/facts-subschema.test.mjs:6: *   - negative: facts={} → fails; missing key → fails; empty value → fails
./tests/facts-subschema.test.mjs:13:import { validateStageResult } from "../scripts/validate-stage-result.mjs";
./tests/facts-subschema.test.mjs:15:// Base valid stage-result that satisfies the top-level stage-result.contract.json
./tests/facts-subschema.test.mjs:21:    facts: {},
./tests/facts-subschema.test.mjs:30:describe("make-decision facts sub-schema (FR-CONTRACT-002 D11)", () => {
./tests/facts-subschema.test.mjs:34:      facts: {
./tests/facts-subschema.test.mjs:44:  it("negative: facts={} → fails (empty object false-green prevention)", () => {
./tests/facts-subschema.test.mjs:45:    const artifact = { ...base(), facts: {} };
./tests/facts-subschema.test.mjs:53:    const artifact = { ...base(), facts: { scope: "full rewrite" } };
./tests/facts-subschema.test.mjs:60:    const artifact = { ...base(), facts: { decision: "proceed" } };
./tests/facts-subschema.test.mjs:67:    const artifact = { ...base(), facts: { decision: "", scope: "something" } };
./tests/facts-subschema.test.mjs:74:    const artifact = { ...base(), facts: { decision: "go", scope: "" } };
./tests/facts-subschema.test.mjs:80:  it("positive: extra keys in facts are allowed (additionalProperties)", () => {
./tests/facts-subschema.test.mjs:83:      facts: {
./tests/facts-subschema.test.mjs:97:      facts: {
./tests/facts-subschema.test.mjs:111:      facts: { decision: "ship now", scope: "backend only" },
./tests/facts-subschema.test.mjs:121:      facts: {
./tests/facts-subschema.test.mjs:135:describe("build-spec facts sub-schema (FR-CONTRACT-002 D11)", () => {
./tests/facts-subschema.test.mjs:136:  it("positive: spec_ref + requirements non-empty → ok", () => {
./tests/facts-subschema.test.mjs:139:      facts: { spec_ref: "specs/my-feature.md", requirements: "12 requirements" },
./tests/facts-subschema.test.mjs:145:  it("negative: facts={} → fails", () => {
./tests/facts-subschema.test.mjs:146:    const artifact = { ...base(), facts: {} };
./tests/facts-subschema.test.mjs:152:    const artifact = { ...base(), facts: { requirements: "3 items" } };
./tests/facts-subschema.test.mjs:158:  it("negative: missing 'requirements' → fails", () => {
./tests/facts-subschema.test.mjs:159:    const artifact = { ...base(), facts: { spec_ref: "specs/foo.md" } };
./tests/facts-subschema.test.mjs:162:    expect(result.errors.join(" ")).toMatch(/requirements/);
./tests/facts-subschema.test.mjs:166:    const artifact = { ...base(), facts: { spec_ref: "", requirements: "some" } };
./tests/facts-subschema.test.mjs:172:  it("negative: 'requirements' empty string → fails", () => {
./tests/facts-subschema.test.mjs:173:    const artifact = { ...base(), facts: { spec_ref: "specs/f.md", requirements: "" } };
./tests/facts-subschema.test.mjs:176:    expect(result.errors.join(" ")).toMatch(/requirements/);
./tests/facts-subschema.test.mjs:182:describe("build-plan facts sub-schema (FR-CONTRACT-002 D11)", () => {
./tests/facts-subschema.test.mjs:186:      facts: { plan_ref: "plans/feature-plan.md", tasks: "4 tasks" },
./tests/facts-subschema.test.mjs:192:  it("negative: facts={} → fails", () => {
./tests/facts-subschema.test.mjs:193:    const artifact = { ...base(), facts: {} };
./tests/facts-subschema.test.mjs:199:    const artifact = { ...base(), facts: { tasks: "2 tasks" } };
./tests/facts-subschema.test.mjs:206:    const artifact = { ...base(), facts: { plan_ref: "plans/foo.md" } };
./tests/facts-subschema.test.mjs:213:    const artifact = { ...base(), facts: { plan_ref: "", tasks: "some" } };
./tests/facts-subschema.test.mjs:220:    const artifact = { ...base(), facts: { plan_ref: "plans/p.md", tasks: "" } };
./tests/facts-subschema.test.mjs:229:describe("build-code facts sub-schema (FR-CONTRACT-002 D11)", () => {
./tests/facts-subschema.test.mjs:233:      facts: { changed: ["src/foo.ts", "src/bar.ts"], tests: "12 passed, 0 failed" },
./tests/facts-subschema.test.mjs:239:  it("negative: facts={} → fails", () => {
./tests/facts-subschema.test.mjs:240:    const artifact = { ...base(), facts: {} };
./tests/facts-subschema.test.mjs:246:    const artifact = { ...base(), facts: { tests: "5 passed" } };
./tests/facts-subschema.test.mjs:253:    const artifact = { ...base(), facts: { changed: ["file.ts"] } };
./tests/facts-subschema.test.mjs:260:    const artifact = { ...base(), facts: { changed: [], tests: "ok" } };
./tests/facts-subschema.test.mjs:267:    const artifact = { ...base(), facts: { changed: "", tests: "ok" } };
./tests/facts-subschema.test.mjs:274:    const artifact = { ...base(), facts: { changed: ["f.ts"], tests: "" } };
./tests/facts-subschema.test.mjs:283:describe("verify-code facts sub-schema (FR-CONTRACT-002 D11)", () => {
./tests/facts-subschema.test.mjs:287:      facts: { verdict: "pass", evidence_ref: "evidence/verify-code-2026-06-24.json" },
./tests/facts-subschema.test.mjs:293:  it("negative: facts={} → fails", () => {
./tests/facts-subschema.test.mjs:294:    const artifact = { ...base(), facts: {} };
./tests/facts-subschema.test.mjs:302:      facts: { evidence_ref: "evidence/foo.json" },
./tests/facts-subschema.test.mjs:310:    const artifact = { ...base(), facts: { verdict: "pass" } };
./tests/facts-subschema.test.mjs:319:      facts: { verdict: "", evidence_ref: "evidence/e.json" },
./tests/facts-subschema.test.mjs:329:      facts: { verdict: "pass", evidence_ref: "" },
./tests/facts-subschema.test.mjs:337:// ── Cross-cutting: top-level contract validation before facts sub-schema ──────
./tests/facts-subschema.test.mjs:339:describe("top-level stage-result contract validated first", () => {
./tests/facts-subschema.test.mjs:340:  it("artifact missing 'status' field fails even with correct facts", () => {
./tests/facts-subschema.test.mjs:345:      facts: { decision: "go", scope: "all" },
./tests/facts-subschema.test.mjs:356:    const artifact = { ...base(), facts: { decision: "go", scope: "x" } };
./tests/metrics-collector.test.mjs:20:  recordSkeleton,
./tests/metrics-collector.test.mjs:21:  updateOwnResult,
./tests/metrics-collector.test.mjs:90:    recordSkeleton({ execution_id: "exec-9", skill_or_stage: "speckit-plan", stage: "plan" }, cfg);
./tests/metrics-collector.test.mjs:91:    updateOwnResult("exec-9", { tokens: 200, duration_ms: 5000, executed: true }, cfg);
./tests/metrics-collector.test.mjs:104:    recordSkeleton({ execution_id: "exec-cold", skill_or_stage: "x", stage: "plan" }, cfg);
./tests/metrics-collector.test.mjs:106:    updateOwnResult("exec-cold", { tokens: 7 }, cfg);
./tests/metrics-collector.test.mjs:115:    recordSkeleton({ execution_id: "exec-d", skill_or_stage: "x", stage: "plan" }, cfg);
./tests/metrics-collector.test.mjs:116:    updateOwnResult("exec-d", { executed: true }, cfg);
./tests/metrics-collector.test.mjs:127:    recordSkeleton({ execution_id: "exec-g", skill_or_stage: "speckit-plan", stage: "plan", skill_version: "1.2.0" }, cfg);
./tests/metrics-collector.test.mjs:164:    recordSkeleton({ execution_id: "exec-cnt", skill_or_stage: "x", stage: "plan", actions }, cfg);
./tests/metrics-collector.test.mjs:173:    recordSkeleton({ execution_id: "exec-w1", skill_or_stage: "x", stage: "apply", stage_unit: "u1" }, cfg);
./tests/metrics-collector.test.mjs:175:    recordSkeleton({ execution_id: "exec-w2", skill_or_stage: "x", stage: "apply", stage_unit: "u1" }, cfg);
./tests/metrics-collector.test.mjs:184:    recordSkeleton({ execution_id: "exec-gap", skill_or_stage: "x", stage: "plan" }, cfg);
./tests/metrics-collector.test.mjs:185:    updateOwnResult("exec-gap", {}, cfg);
./tests/metrics-collector.test.mjs:199:      recordSkeleton({ execution_id: "exec-fail", skill_or_stage: "x", stage: "plan" }, cfg);
./tests/metrics-collector.test.mjs:208:    recordSkeleton({ execution_id: "exec-ok", skill_or_stage: "x", stage: "plan" }, cfg);
./tests/metrics-collector.test.mjs:320:    recordSkeleton({ execution_id: "e-tok", skill_or_stage: "x", stage: "plan" }, cfg);
./tests/metrics-collector.test.mjs:335:    recordSkeleton({ execution_id: "e-gap", skill_or_stage: "x", stage: "plan" }, cfg);
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:12:- spec-specify (workflows/spec-specify/SKILL.md + templates/spec-template.md): adapted from speckit-specify. Must: accept required task-id param (fail-loud if missing), load template from ./templates/spec-template.md (fail-loud if absent), output specs/{task-id}/spec.md + checklists/requirements.md, preserve speckit quality mechanisms (key-concept extraction, assumption recording, <=3 NEEDS CLARIFICATION with Q1/Q2/Q3 3-5-option+recommendation format, testable FRs, 3-tier tailoring), decouple from git (NO git checkout/branch/create-new-feature.sh, NO reading .specify/, NO speckit script calls), wire metrics (recordSkeleton + updateOwnResult, stage=spec-specify).
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:225:+- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:226:+- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:260:+> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:282:+   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:306:+   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:358:+    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:376:+- `specs/{task-id}/checklists/requirements.md`：质量检查清单
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:595:- spec-specify (workflows/spec-specify/SKILL.md + templates/spec-template.md): adapted from speckit-specify. Must: accept required task-id param (fail-loud if missing), load template from ./templates/spec-template.md (fail-loud if absent), output specs/{task-id}/spec.md + checklists/requirements.md, preserve speckit quality mechanisms (key-concept extraction, assumption recording, <=3 NEEDS CLARIFICATION with Q1/Q2/Q3 3-5-option+recommendation format, testable FRs, 3-tier tailoring), decouple from git (NO git checkout/branch/create-new-feature.sh, NO reading .specify/, NO speckit script calls), wire metrics (recordSkeleton + updateOwnResult, stage=spec-specify).
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:808:+- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:809:+- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:843:+> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:865:+   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:889:+   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:941:+    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:959:+- `specs/{task-id}/checklists/requirements.md`：质量检查清单
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:1250:- Metrics wiring is present by name and stage, but still underspecified operationally. The files say to call `metrics/collector.mjs`, `recordSkeleton`, and `updateOwnResult`, but do not give an invocation shape or minimum payload example. Not blocking for a prompt-only port, but a later runner may interpret this inconsistently.
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:1284:- spec-specify (workflows/spec-specify/SKILL.md + templates/spec-template.md): adapted from speckit-specify. Must: accept required task-id param (fail-loud if missing), load template from ./templates/spec-template.md (fail-loud if absent), output specs/{task-id}/spec.md + checklists/requirements.md, preserve speckit quality mechanisms (key-concept extraction, assumption recording, <=3 NEEDS CLARIFICATION with Q1/Q2/Q3 3-5-option+recommendation format, testable FRs, 3-tier tailoring), decouple from git (NO git checkout/branch/create-new-feature.sh, NO reading .specify/, NO speckit script calls), wire metrics (recordSkeleton + updateOwnResult, stage=spec-specify).
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:1497:+- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:1498:+- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:1532:+> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:1554:+   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:1578:+   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:1630:+    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:1648:+- `specs/{task-id}/checklists/requirements.md`：质量检查清单
./specs/m11-build-spec-v1/reviews/build-code-phase-12-r1.md:1941:- Metrics wiring is present by name and stage, but still underspecified operationally. The files say to call `metrics/collector.mjs`, `recordSkeleton`, and `updateOwnResult`, but do not give an invocation shape or minimum payload example. Not blocking for a prompt-only port, but a later runner may interpret this inconsistently.
./tests/five-skills-present.test.mjs:208:describe("build-code SKILL.md contains slim path / stage-result / make-decision support (D12)", () => {
./tests/five-skills-present.test.mjs:211:  test("build-code mentions stage-result as upstream input", () => {
./tests/five-skills-present.test.mjs:214:      content.includes("stage-result"),
./tests/five-skills-present.test.mjs:215:      "build-code/SKILL.md must reference stage-result as upstream input (D12 slim path)"
./tests/five-skills-present.test.mjs:410:        content.includes("recordSkeleton") ||
./tests/five-skills-present.test.mjs:431:// --- AC6 predicate ②: facts-subschema.json declares make-decision required_keys ---
./tests/five-skills-present.test.mjs:434:describe("AC6 ②: facts-subschema.json make-decision required_keys contract shape", () => {
./tests/five-skills-present.test.mjs:435:  const schemaPath = join(REPO_ROOT, "contracts", "facts-subschema.json");
./tests/five-skills-present.test.mjs:439:  test('facts-subschema.json make-decision.required_keys includes "decision"', () => {
./tests/five-skills-present.test.mjs:446:  test('facts-subschema.json make-decision.required_keys includes "scope"', () => {
./tests/five-skills-present.test.mjs:453:  test('facts-subschema.json make-decision.required_keys includes "decision_log_path"', () => {
./workflows/verify-code/facts-assembly.mjs:11:  if (!buildResult.facts || !buildResult.facts.tests) {
./workflows/verify-code/facts-assembly.mjs:12:    const err = new Error('facts.tests not found in build result');
./workflows/verify-code/facts-assembly.mjs:16:  const cmd = buildResult.facts.tests.command;
./workflows/verify-code/facts-assembly.mjs:18:    const err = new Error('command field missing in facts.tests — build-code must include command in facts output');
./workflows/verify-code/facts-assembly.mjs:23:    const err = new Error(`facts.tests.command must be a string, got ${typeof cmd}`);
./workflows/verify-code/facts-assembly.mjs:54:  const path = join(taskSpecDir, 'stage-result-verify-code.json');
./specs/m11-build-spec-v1/verify/phase-2.sh:31:grep -q "recordSkeleton" workflows/spec-clarify/SKILL.md || fail "metrics wiring missing"
./tests/verify-code-facts.test.mjs:2:import { readCommand, assembleStageResult, writeStageResult, validateMetricRecord } from '../workflows/verify-code/facts-assembly.mjs';
./tests/verify-code-facts.test.mjs:8:beforeAll(() => { tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-facts-')); });
./tests/verify-code-facts.test.mjs:12:  it('should return command string from facts.tests.command', () => {
./tests/verify-code-facts.test.mjs:13:    expect(readCommand({ facts: { tests: { command: 'npx vitest run' } } })).toBe('npx vitest run');
./tests/verify-code-facts.test.mjs:16:  it('should throw when facts.tests.command is missing', () => {
./tests/verify-code-facts.test.mjs:17:    expect(() => readCommand({ facts: { tests: {} } })).toThrow(/command/);
./tests/verify-code-facts.test.mjs:20:  it('should throw with retryable=true when facts.tests.command is missing', () => {
./tests/verify-code-facts.test.mjs:21:    try { readCommand({ facts: { tests: {} } }); expect.fail(); }
./tests/verify-code-facts.test.mjs:25:  it('should throw with retryable=true when facts.tests is missing', () => {
./tests/verify-code-facts.test.mjs:26:    try { readCommand({ facts: {} }); expect.fail(); }
./tests/verify-code-facts.test.mjs:31:    expect(() => readCommand({ facts: { tests: { command: 123 } } })).toThrow(/string/);
./tests/verify-code-facts.test.mjs:35:    try { readCommand({ facts: { tests: { command: 123 } } }); expect.fail(); }
./tests/verify-code-facts.test.mjs:43:  it('should return 7-key stage-result object', () => {
./tests/verify-code-facts.test.mjs:90:  it('should write stage-result JSON', () => {
./tests/verify-code-facts.test.mjs:93:    const raw = readFileSync(join(tmpDir, 'stage-result-verify-code.json'), 'utf-8');
./tests/verify-code-facts.test.mjs:100:    expect(JSON.parse(readFileSync(join(nested, 'stage-result-verify-code.json'), 'utf-8')).verdict).toBe('pass');
./specs/m11-build-spec-v1/verify/phase-1.sh:19:grep -q "recordSkeleton" workflows/spec-specify/SKILL.md || fail "metrics wiring missing"
./specs/m11-build-spec-v1/verify/phase-1.sh:20:grep -q "checklists/requirements" workflows/spec-specify/SKILL.md || fail "checklist generation not found"
./specs/m11-build-spec-v1/plan.md:20:- M10 baseline report（`specs/archive/m10-baseline-switch/baseline-report.md`）——5 项基线对照源
./specs/m11-build-spec-v1/plan.md:23:**现有骨架**：`workflows/build-spec/SKILL.md`（M6 薄骨架）定义了 F10 gate + stage-result 契约 + metrics 种子字段，是升级起点。
./specs/m11-build-spec-v1/plan.md:38:| F6 统一外置执行记录 | YES | 沿用 M4 collector.mjs recordSkeleton/updateOwnResult，stage-result 写 durable |
./specs/m11-build-spec-v1/plan.md:49:| S4 自定义技能必须有指标系统 | YES | spec-specify/clarify 各接 recordSkeleton/updateOwnResult，build-spec 沿用 M6 metrics 契约 |
./specs/m11-build-spec-v1/plan.md:58:- FR-SKELETON-001/002 → F2/F6 YES：M6 F10 gate/stage-result 契约/metrics 契约保留不变
./specs/m11-build-spec-v1/plan.md:75:- metrics/collector.mjs：已有（M4 交付），直接调用 recordSkeleton / updateOwnResult
./specs/m11-build-spec-v1/plan.md:77:- M10 baseline report：已有（`specs/archive/m10-baseline-switch/baseline-report.md`），直接读取 5 项基线值
./specs/m11-build-spec-v1/plan.md:78:- stage-result 契约：build-spec SKILL.md 骨架已有七键结构，直接保留
./specs/m11-build-spec-v1/plan.md:100:- F10 gate 4 问 / stage-result 七键 / metrics 调用指令不可删减（FR-SKELETON-001/002）
./specs/m11-build-spec-v1/plan.md:223:| `workflows/spec-specify/SKILL.md` | 新建 | 纯提示词：读 task-id + 描述 → 加载内置模板 → 生成 `specs/{task-id}/spec.md` + `specs/{task-id}/checklists/requirements.md`；含 ≤3 个 [NEEDS CLARIFICATION] 交互澄清；接 collector 指标 |
./specs/m11-build-spec-v1/plan.md:226:| `workflows/build-spec/SKILL.md` | 修改 | 完整 v1 提示词：前置读 decision-log → 调 spec-specify → 调 spec-clarify → 宪法符合性检查（逐条勾 21 条） → baseline 对照（5 项指标） → 人审检查点停顿 → 产 stage-result + metrics。保留 M6 F10 gate/stage-result 契约/metrics 调用 |
./specs/m11-build-spec-v1/plan.md:256:| FR-SPECIFY-004 | Phase 1 Task 1.1（spec-specify SKILL.md：指令生成 checklists/requirements.md 质量检查清单） |
./specs/m11-build-spec-v1/plan.md:273:| FR-BASELINE-003 | Phase 3 Task 3.1（build-spec SKILL.md：第 5 项使用 rework_proxy_count，不用旧称） |
./specs/m11-build-spec-v1/plan.md:276:| FR-REVIEW-001 | Phase 3 Task 3.1（build-spec SKILL.md：一且仅一次人审检查点——明文停顿等人确认，在 stage-result 前） |
./specs/m11-build-spec-v1/plan.md:278:| FR-SKELETON-002 | Phase 3 Task 3.1（build-spec SKILL.md：保留 stage-result 七键结构+metrics 调用指令，不可删改） |
./specs/m11-build-spec-v1/plan.md:322:| build-spec v1 含 baseline 对照 | `grep -c "rework_proxy_count\|baseline\|M10" workflows/build-spec/SKILL.md` | >=3 |
./specs/m11-build-spec-v1/plan.md:325:| build-spec v1 保留 stage-result 契约 | `grep -c "spec_ref\|requirements\|stage-result" workflows/build-spec/SKILL.md` | >=2 |
./specs/m11-build-spec-v1/plan.md:326:| build-spec v1 保留 metrics 调用 | `grep -c "recordSkeleton\|updateOwnResult" workflows/build-spec/SKILL.md` | >=2 |
./specs/m11-build-spec-v1/plan.md:332:| 三 SKILL.md 均含 collector 指令 | `grep -l "recordSkeleton" workflows/spec-specify/SKILL.md workflows/spec-clarify/SKILL.md workflows/build-spec/SKILL.md` | 三文件均命中 |
./specs/m11-build-spec-v1/plan.md:343:| schema | 不改 | M11 不改 facts-subschema.json（build-spec facts 结构不变，仅内容扩展） | -- |
./tests/build-code-facts.test.mjs:2:import { validateFacts } from '../workflows/build-code/facts-schema.mjs';
./tests/build-code-facts.test.mjs:12:  it('complete C1 facts object is valid with empty missing', () => {
./tests/build-code-facts.test.mjs:17:  it('missing facts.changed → invalid', () => {
./tests/build-code-facts.test.mjs:20:  it('missing facts.tests → invalid', () => {
./tests/build-code-facts.test.mjs:23:  it('missing facts.review → invalid', () => {
./tests/build-code-facts.test.mjs:37:  it('old M8 facts without command field → still valid (backward compat)', () => {
./tests/build-code-facts.test.mjs:38:    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true }, review: completeReview };
./tests/build-code-facts.test.mjs:39:    expect(validateFacts(facts).valid).toBe(true);
./tests/build-code-facts.test.mjs:43:    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true, command: 'npx vitest run' }, review: completeReview };
./tests/build-code-facts.test.mjs:44:    expect(validateFacts(facts).valid).toBe(true);
./tests/build-code-facts.test.mjs:48:    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true, command: 123 }, review: completeReview };
./tests/build-code-facts.test.mjs:49:    const r = validateFacts(facts);
./tests/build-code-facts.test.mjs:54:  // Falsifiability: if command were made required (validation removed), old facts would break
./tests/build-code-facts.test.mjs:55:  it('falsifiable: old M8 facts remain valid when command is absent', () => {
./tests/stage-quality.test.mjs:94:import { validateStageResult } from "./contracts/stage-result.contract.mjs";
./tests/stage-quality.test.mjs:132:    upsert(cfg.taskMetricsPath, execution_id, { facts: result }, cfg);
./specs/m11-build-spec-v1/verify/phase-3.sh:13:grep -q "rework_proxy_count" workflows/build-spec/SKILL.md || fail "rework_proxy_count missing"
./specs/m11-build-spec-v1/verify/phase-3.sh:21:STAGE_COUNT=$(grep -c "spec_ref\|requirements" workflows/build-spec/SKILL.md)
./specs/m11-build-spec-v1/verify/phase-3.sh:22:test "$STAGE_COUNT" -ge 2 || fail "stage-result contract ($STAGE_COUNT < 2)"
./specs/m11-build-spec-v1/verify/phase-3.sh:24:METRICS_COUNT=$(grep -c "recordSkeleton\|updateOwnResult" workflows/build-spec/SKILL.md)
./workflows/spec-specify/SKILL.md:11:> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
./workflows/spec-specify/SKILL.md:33:   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
./workflows/spec-specify/SKILL.md:57:   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
./workflows/spec-specify/SKILL.md:110:    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
./workflows/spec-specify/SKILL.md:128:- `specs/{task-id}/checklists/requirements.md`：质量检查清单
./workflows/build-code/facts-schema.mjs:1:// facts-schema.mjs — pure ESM, no IO
./workflows/build-code/facts-schema.mjs:7:export function validateFacts(facts) {
./workflows/build-code/facts-schema.mjs:10:    if (facts[key] == null) missing.push(key);
./workflows/build-code/facts-schema.mjs:12:  if (facts.review != null && facts.review.status == null) {
./workflows/build-code/facts-schema.mjs:16:  if (facts.tests != null && facts.tests.command !== undefined && typeof facts.tests.command !== 'string') {
./specs/m11-build-spec-v1/verify/phase-4.sh:37:  grep -q "recordSkeleton" "$f" || fail "$f missing recordSkeleton"
./specs/m11-build-spec-v1/verify/phase-4.sh:43:grep -q "requirements" workflows/build-spec/SKILL.md || fail "requirements missing"
./specs/m11-build-spec-v1/verify/phase-4.sh:47:grep -q "rework_proxy_count" workflows/build-spec/SKILL.md || fail "rework_proxy_count naming missing"
./workflows/spec-clarify/SKILL.md:197:- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
./workflows/spec-clarify/SKILL.md:198:- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
./workflows/build-code/SKILL.md:3:description: Implement each task phase by phase using TDD, collecting RED and GREEN evidence for every phase, enforcing diff-only bounds, running 3rd-review on each GREEN, and writing structured facts into the stage-result.
./workflows/build-code/SKILL.md:10:Implement the change described by the upstream stage-result. The upstream may be `build-plan` (full path) or `make-decision` directly (slim path — small tasks that skip design and planning). Read the upstream `stage-result` first and consume its `facts` keys to understand scope and constraints.
./workflows/build-code/SKILL.md:12:Each phase follows a strict RED → implement → GREEN cycle. No phase is done without both evidence files. After GREEN, a 3rd-review is run and its verdict is recorded in `facts.review`.
./workflows/build-code/SKILL.md:18:Read the `stage-result` produced by the previous stage and extract the relevant `facts`:
./workflows/build-code/SKILL.md:20:- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list.
./workflows/build-code/SKILL.md:21:- If upstream is **`make-decision`** (slim path): read `facts.decision` (the decision text) and `facts.scope` (the bounded change area). `tasks.md` and `plan.md` do not exist on the slim path; derive implementation work directly from these two keys.
./workflows/build-code/SKILL.md:97:If the 3rd-review skill is unavailable (not installed or not reachable), downgrade gracefully to `same_source` review and record `facts.review.source = "same_source"` so downstream stages can detect the degraded state.
./workflows/build-code/SKILL.md:99:### 8. facts.review 产出
./workflows/build-code/SKILL.md:101:After 3rd-review completes for each phase, construct the review fact using `facts-schema.mjs`:
./workflows/build-code/SKILL.md:104:import { buildReviewFact } from "./facts-schema.mjs";
./workflows/build-code/SKILL.md:114:Write the result into `stage-result` under the `facts.review` key. The `buildReviewFact` function enforces the schema; do not hand-construct the object.
./workflows/build-code/SKILL.md:118:When all phases are complete, write the stage-result with a structured facts package (FR-PKG-001/002/003). The three required keys are:
./workflows/build-code/SKILL.md:120:- `facts.changed` — **array** of changed file paths (one entry per file, not a comma-joined string).
./workflows/build-code/SKILL.md:121:- `facts.tests` — **struct** with at minimum `{ passed: <n>, total: <n>, files: [...] }`. Must include `command` field (the test command string that was executed) for verify-code downstream consumption (M9 C1).
./workflows/build-code/SKILL.md:122:- `facts.review` — **struct** produced by `buildReviewFact` (see §8 above).
./workflows/build-code/SKILL.md:124:Write the stage-result to a durable task path (not a temp file) so downstream stages can read it. The exact path follows the project convention: `specs/{task-id}/stage-result-build-code.json`.
./workflows/build-code/SKILL.md:133:  "facts": {
./workflows/build-code/SKILL.md:146:Record metrics via `metrics/collector.mjs`. Call `recordSkeleton` at stage start (before any implementation work) and `updateOwnResult` at stage end (after the stage-result is written). Fields must align with the M4 record-schema:
./workflows/verify-code/metrics-writer.mjs:4: * Accepts external executionId from verify-code flow. Only calls updateOwnResult
./workflows/verify-code/metrics-writer.mjs:5: * to append verdict to the existing record (verify-code already called recordSkeleton).
./workflows/verify-code/metrics-writer.mjs:8:import { updateOwnResult, configForCollector } from "../../metrics/collector.mjs";
./workflows/verify-code/metrics-writer.mjs:13:  if (!executionId) throw new Error("executionId required — must come from verify-code recordSkeleton");
./workflows/verify-code/metrics-writer.mjs:21:    updateOwnResult(executionId, { verdict }, cfg);
./workflows/build-spec/SKILL.md:3:description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → human review checkpoint.
./workflows/build-spec/SKILL.md:20:At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.
./workflows/build-spec/SKILL.md:27:- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
./workflows/build-spec/SKILL.md:71:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
./workflows/build-spec/SKILL.md:77:Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:
./workflows/build-spec/SKILL.md:85:| rework_proxy_count | <M11 actual> | 25.25 | <delta> |
./workflows/build-spec/SKILL.md:87:- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
./workflows/build-spec/SKILL.md:92:- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.
./workflows/build-spec/SKILL.md:94:Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.
./workflows/build-spec/SKILL.md:113:After spec-specify output, spec-clarify refinement, the F10 gate, constitution check, and baseline comparison are all complete — but **before** producing the stage-result — pause at the human review checkpoint. By this point the F10 gate has already pruned the spec, so the spec the human sees is final:
./workflows/build-spec/SKILL.md:120:> 请确认上述产物是否可接受。回复"确认"继续产出 stage-result；回复修改意见则返回相应步骤修正。
./workflows/build-spec/SKILL.md:122:The stage must NOT auto-proceed past this point without explicit human confirmation. If the human rejects or does not confirm, do not advance to stage-result production — loop back to the relevant step. After the human confirms, do not silently re-prune or alter the spec — what the human confirmed is what gets recorded.
./workflows/build-spec/SKILL.md:124:## Produce a stage-result
./workflows/build-spec/SKILL.md:126:When the stage is complete (all steps above done and human review checkpoint confirmed), write a `stage-result` record with:
./workflows/build-spec/SKILL.md:133:  "facts": {
./workflows/build-spec/SKILL.md:135:    "requirements": "<comma-separated list of FR identifiers or one-line summary>"
./workflows/build-spec/SKILL.md:143:Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:
./workflows/build-spec/SKILL.md:162:At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.
./workflows/decision-log/SKILL.md:11:This is a **component skill**. It does NOT produce its own `stage-result`. The calling collector or foreman is responsible for writing all stage-level records. This skill produces only the decision-log artifact that the caller consumes.
./workflows/decision-log/SKILL.md:55:This skill does NOT write its own `stage-result`. The calling collector MUST write ONE independent metric record with `"stage": "decision-log"` (never `"make-decision"`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line.
./workflows/decision-log/SKILL.md:57:Call `recordSkeleton` at invocation start and `updateOwnResult` at completion, passing at minimum:
./specs/archive/m9-verify-code/spec.md:17:- 从空骨架（64 行 SKILL.md）补三个 .mjs 脚本（capture / freshness / facts 组装）
./specs/archive/m9-verify-code/spec.md:18:- 测试命令从 build-code 事实包 facts.tests.command 读取，不硬编码
./specs/archive/m9-verify-code/spec.md:22:- stage-result 落 specs/{task-id}/stage-result-verify-code.json；M4 metrics 双写 task + global
./specs/archive/m9-verify-code/spec.md:24:**最大影响面**：workflowhub workflows/verify-code/ — 由空骨架升为 v1 可用 skill；build-code facts.tests 加 command 字段（C1 同步）
./specs/archive/m9-verify-code/spec.md:32:verify-code 是 workflowhub extraction program 五段薄骨架的最后一段（M9）。M8 已交付 build-code v1，产出验收事实包（`specs/{task-id}/stage-result-build-code.json`，含三键 changed/tests/review）。verify-code 的 SKILL.md 骨架已存在但无可执行 .mjs 脚本，导致三段闭环断链。
./specs/archive/m9-verify-code/spec.md:42:- **事实包**：build-code 产出的 `stage-result-build-code.json`，verify-code 以此为输入。
./specs/archive/m9-verify-code/spec.md:43:- **stage-result**：verify-code 执行完毕后写入 `specs/{task-id}/stage-result-verify-code.json` 的结构化记录，含 status / error_code / retryable / facts / missing_items / user_decision / reason 七个顶层键。
./specs/archive/m9-verify-code/spec.md:44:- **anomaly_flags**：stage-result facts 内的警告列表，仅记录 / 浮现，不触发 FAIL。
./specs/archive/m9-verify-code/spec.md:48:- **user_decision**：stage-result 中布尔键，`true` 表示该步骤在执行前已获得人工确认（用于合并/删分支收尾）。
./specs/archive/m9-verify-code/spec.md:49:- **collector**：`metrics/collector.mjs`，M4 metrics 底座，提供 recordSkeleton / updateOwnResult / collectFacts / updateStageImpact 四个接口。
./specs/archive/m9-verify-code/spec.md:59:给定：build-code 已产出事实包，facts.tests.command 有效，当前 HEAD git_sha 与 M8 执行时一致。
./specs/archive/m9-verify-code/spec.md:61:那么：测试全部通过，stage-result facts.verdict=pass，facts.evidence_ref 指向 final-test-report.md，anomaly_flags 为空。
./specs/archive/m9-verify-code/spec.md:67:那么：stage-result facts.anomaly_flags 含 "stale_sha"，测试依然跑完，verdict 由测试结果决定，不因 stale_sha 置 FAIL / status="failure"。
./specs/archive/m9-verify-code/spec.md:73:那么：SKIP 分支触发，stage-result missing_items 记录"browser-acceptance: no UI acceptance items"，不调用 isolated-browser-qa，不阻断后续收尾。
./specs/archive/m9-verify-code/spec.md:79:那么：stage-result user_decision=true，合并与删分支均已完成，reason 记录操作结果。
./specs/archive/m9-verify-code/spec.md:83:给定：build-code 事实包 facts.tests 缺少 command 字段（M8 旧版本或 C1 未同步）。
./specs/archive/m9-verify-code/spec.md:85:那么：stage-result status="failure"，error_code 描述 command 字段缺失，retryable=true，浮现明确错误，不静默跳过。
./specs/archive/m9-verify-code/spec.md:89:给定：facts.tests.command 有效，但当前代码测试有失败用例。
./specs/archive/m9-verify-code/spec.md:91:那么：stage-result facts.verdict=fail，final-test-report.md 中逐条列出失败的测试用例，status="failure"。注：此场景 missing_items 为空（missing_items 记录的是"跳过未执行的验收项"，如浏览器验收 SKIP；测试本身跑了但失败，不属于 missing_items 范畴，二者语义不同）。
./specs/archive/m9-verify-code/spec.md:97:那么：合并/删分支不执行，stage-result user_decision=false，skill 终止并记录用户拒绝原因，不自动越界。
./specs/archive/m9-verify-code/spec.md:103:那么：三键均可读取，verify-code 无需额外转换即可消费 facts.tests.command 和 facts.review.verdict。
./specs/archive/m9-verify-code/spec.md:108:当：verify-code 完成一次完整执行（recordSkeleton → updateOwnResult）。
./specs/archive/m9-verify-code/spec.md:115:那么：调用 isolated-browser-qa（workflowhub 本地副本，已去除 agenthub 硬编码路径），结果写入 stage-result，SKIP 分支不触发。
./specs/archive/m9-verify-code/spec.md:126:verify-code 必须自己执行测试命令，不读取 M8 stage-result-build-code.json 中已有的测试结果作为本次验收证据。每次 verify-code 执行均产出新的 capture 证据。
./specs/archive/m9-verify-code/spec.md:129:verify-code 执行时通过 capture 脚本采集当前 HEAD git_sha，与 build-code 事实包（stage-result-build-code.json）中记录的 git_sha 比对，结果写入 stage-result facts。注：比对对象为"capture 时的 HEAD"与"M8 事实包记录的 git_sha"，是 freshness 的操作定义，属实现约定而非 decision-log 明文要求。
./specs/archive/m9-verify-code/spec.md:132:git_sha 不匹配时，stage-result facts.anomaly_flags 写入 "stale_sha"，同时在 skill 执行边界输出可见警告。绝不因 stale_sha 置 status="failure"、绝不 exit2、绝不把鲜度校验做成 blocking gate。
./specs/archive/m9-verify-code/spec.md:140:verify-code 从 `specs/{task-id}/stage-result-build-code.json` 的 facts.tests.command 字段读取测试命令，不在 verify-code 侧硬编码任何命令。
./specs/archive/m9-verify-code/spec.md:143:若 facts.tests.command 字段不存在或为空，stage-result status="failure"，error_code 描述缺失原因，retryable=true，不静默跳过也不使用任何回退默认命令。
./specs/archive/m9-verify-code/spec.md:145:**FR-CMD-003** build-code facts.tests 加 command 字段（来源：C1）
./specs/archive/m9-verify-code/spec.md:146:作为 M9 同步改动，build-code 侧 `workflows/build-code/facts-schema.mjs` 及对应 SKILL.md 需在 facts.tests 中新增 command 字段。新增字段向后兼容，不破坏已有 changed/tests/review 三键的消费方。
./specs/archive/m9-verify-code/spec.md:154:当 task 无 UI 验收项时，verify-code 不调用 isolated-browser-qa，stage-result missing_items 中记录"browser-acceptance: no UI acceptance items"，不以缺少浏览器验收为由置 status="failure"。
./specs/archive/m9-verify-code/spec.md:165:用户确认后执行合并/删分支，stage-result user_decision=true。用户拒绝时 user_decision=false，合并/删分支不执行，skill 正常终止并记录原因。
./specs/archive/m9-verify-code/spec.md:172:**FR-PATH-001** stage-result 落 specs/{task-id}/（来源：D-M9-6）
./specs/archive/m9-verify-code/spec.md:173:verify-code 的 stage-result 写入 `specs/{task-id}/stage-result-verify-code.json`，与 build-code 的 `specs/{task-id}/stage-result-build-code.json` 同级。
./specs/archive/m9-verify-code/spec.md:179:stage-result facts.evidence_ref 为相对 `specs/{task-id}/` 根的相对路径（如 `test/final-test-report.md`），不使用绝对路径，不使用相对 repo 根的路径。
./specs/archive/m9-verify-code/spec.md:183:**FR-METRICS-001** recordSkeleton 在 stage 开始时调用（来源：D-M9-7，M4 collector 契约）
./specs/archive/m9-verify-code/spec.md:184:verify-code 启动时调用 `metrics/collector.mjs` 的 recordSkeleton，传入含全部 10 个核心字段的 seed（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）。
./specs/archive/m9-verify-code/spec.md:186:**FR-METRICS-002** updateOwnResult 在 stage 结束时调用（来源：D-M9-7，M4 collector 契约）
./specs/archive/m9-verify-code/spec.md:187:verify-code 执行完毕（success 或 failure）后调用 updateOwnResult，更新 executed / tokens / duration_ms 等字段。不手写原始 jsonl 行。
./specs/archive/m9-verify-code/spec.md:198:capture 脚本、freshness 脚本、facts 组装脚本各有对应单元测试，覆盖正常路径和关键边界（command 缺失、sha 不匹配、anomaly_flags 非空）。
./specs/archive/m9-verify-code/spec.md:206:1. **verify-code 冒烟**：覆盖 capture / freshness / facts 组装三个脚本的单元测试（vitest）；
./specs/archive/m9-verify-code/spec.md:207:2. **轻量三段闭环检查**：CI 跑一个最小验证脚本，串起 make-decision → build-code → verify-code 三段产物链，检查 stage-result-build-code.json 可被读取（facts.tests.command 字段存在）、verify-code stage-result 落盘路径贯通。该检查不引入重型 E2E 基建，不模拟完整 UI 流程（按 D-M9-7/F10），只做产物链路贯通的结构性验证。CI 全部绿才视为交付完整。
./specs/archive/m9-verify-code/spec.md:222:- [ ] **验收 2 — 三段闭环连接**：make-decision → build-code → verify-code 三段全部打通，verify-code 成功读取 build-code 产出的 stage-result-build-code.json。三段任一断链即失败。（来源：验收标准 2）
./specs/archive/m9-verify-code/spec.md:224:- [ ] **验收 3 — 事实包消费**：verify-code 从 facts.tests.command 读取测试命令并执行（C1 同步后）。command 字段缺失时浮现明确错误而非静默跳过。stage-result facts.verdict 和 evidence_ref 均有效。（来源：验收标准 3，D-M9-3，C1，FR-CMD-001/002）
./specs/archive/m9-verify-code/spec.md:228:- [ ] **验收 5 — CI 纳入**：CI 包含 verify-code 冒烟（capture / freshness / facts 组装单元测试）+ 轻量三段闭环检查（结构性验证 make-decision → build-code → verify-code 产物链路贯通，不引入重型 E2E 框架，见 FR-TEST-003 和 D-M9-7/F10 说明），CI 全部通过后视为交付完整。（来源：验收标准 5，FR-TEST-003）
./specs/archive/m9-verify-code/spec.md:234:**stage-result（verify-code 产出）**（来源：D-M9-6 落盘路径约定；七键结构沿用 build-code 既有 stage-result 约定，属实现契约而非 decision-log 明文 schema）：
./specs/archive/m9-verify-code/spec.md:239:- `facts`：验收事实对象
./specs/archive/m9-verify-code/spec.md:249:- `facts.tests.command`：verify-code 执行的测试命令（C1 新增字段，原有 red_exit_code / green_baseline_hash 等字段不变）
./specs/archive/m9-verify-code/spec.md:250:- `facts.review.verdict`：M8 审查结论（verify-code 可用于报告，非执行依据）
./specs/archive/m9-verify-code/spec.md:258:- **数据粒度**：以一次 verify-code skill 执行（单任务验收）为单位，产出一份 stage-result + 一份 final-test-report.md。
./specs/archive/m9-verify-code/spec.md:259:- **数据时效**：stage-result 在 skill 执行结束时落 durable，之后不变更（只读）。
./specs/archive/m9-verify-code/spec.md:260:- **补传策略**：若中途失败，已采集的部分事实写入 stage-result，失败原因浮现，不覆盖已有报告。
./specs/archive/m9-verify-code/spec.md:261:- **当前 vs 历史**：stage-result 落固定路径 `specs/{task-id}/stage-result-verify-code.json`，同一 task 重跑（rerun）会覆盖前次结果；不同 task 靠 task-id 目录自然隔离。如需保留历史快照，调用方在 rerun 前自行备份，verify-code 本身不做多版本管理。
./specs/archive/m9-verify-code/spec.md:262:- **metrics 生命周期**：recordSkeleton 在 stage 开始即写入（metrics 写失败只 warn 不 throw，继承 M4 metrics collector 的写失败保护语义，对齐 CONSTITUTION F3/Q1 记事实非 blocking）；updateOwnResult 在 stage 结束补全；任何一次写失败不阻断 skill 主流程。
./specs/archive/m9-verify-code/spec.md:268:- **facts.tests.command 向后兼容**：C1 在 build-code 侧新增 command 字段属于追加，已有 red_exit_code / green_baseline_hash 等字段语义不变，现有消费方不受影响。
./specs/archive/m9-verify-code/spec.md:270:- **stage-result 契约预留**：verify-code stage-result 的 facts 结构 design 只加不删，M10 可在 facts 下追加新键，不破坏现有字段语义。
./specs/archive/m9-verify-code/spec.md:290:- stage-result 落 durable 路径，skill 进程结束后仍可读
./specs/archive/m9-verify-code/spec.md:323:  - 回归要点：原有骨架定义的接口（stage-result 结构、M4 metrics 字段契约）不被破坏
./specs/archive/m9-verify-code/spec.md:325:- **受影响功能：build-code facts.tests（C1 同步）**
./specs/archive/m9-verify-code/spec.md:326:  - 既有行为：facts.tests 含 red_exit_code / green_baseline_hash 等字段，无 command 字段
./specs/archive/m9-verify-code/spec.md:327:  - 本需求影响：新增 command 字段（向后兼容追加），同步更新 build-code 侧 facts-schema.mjs 和 SKILL.md
./specs/archive/m9-verify-code/spec.md:333:  - 回归要点：make-decision 和 build-code 内部逻辑不被 M9 修改；三段之间仅通过 stage-result JSON 文件传递数据
./specs/archive/m7-intake-v1/spec.md:7:**需求权威源**: `tasks/m7-intake-v1/artifacts/decision-log.md`（13 决策 D-M7-1 至 D-M7-13）
./specs/archive/m7-intake-v1/spec.md:14:  - 新建 `workflows/scope-triage/` 和 `workflows/decision-log/` 两个组件 skill 目录，各放一份 SKILL.md，按"改造适配"类引入（接 workflowhub stage-result 契约 + 指标，非纯抄）。
./specs/archive/m7-intake-v1/spec.md:15:  - 升级 `workflows/make-decision/SKILL.md`：内联 scope-triage / decision-log 逻辑摘要，显式写出两个路径引用（`workflows/scope-triage/SKILL.md`、`workflows/decision-log/SKILL.md`），stage-result facts 增加 `decision_log_path` 字段。
./specs/archive/m7-intake-v1/spec.md:30:workflowhub 已有五段薄骨架（M6），宪法 F4/F10 确立"质量靠异源审查+人，不靠运行时 gate"原则。M3 窄契约 stage-result、M4 指标系统 collector.mjs 已就位。本期在这些基础上加深 make-decision 一段。`D-M7-1` 已核实：make-decision（M6 已建）即 roadmap 所指 intake 入口，不需要再建顶层 intake 壳。`D-M7-9` 命名已全局对齐（roadmap.md 的 intake/design/plan/apply/test-acceptance 改为 make-decision/build-spec/build-plan/build-code/verify-code）。
./specs/archive/m7-intake-v1/spec.md:36:- make-decision stage-result facts 含 `decision_log_path`，供下游 M8 消费。
./specs/archive/m7-intake-v1/spec.md:56:- **操作步骤**：调起 `/make-decision`，make-decision 内部按提示词步骤执行 scope-triage（分流范围）→ decision-log（收敛产出决策记录）→ 产出 stage-result。
./specs/archive/m7-intake-v1/spec.md:57:- **预期结果**：`tasks/<任务>/decision-log.md` 存在且含必要章节（7 节）、至少一条含来源证据的决策记录；stage-result facts 含 `decision`、`scope`、`decision_log_path` 三个 key（非空）；collector 记录数 ≥ 本次涉及 skill 数。
./specs/archive/m7-intake-v1/spec.md:68:- **操作步骤**：从 make-decision 产出的 stage-result 读 `facts.decision_log_path` 字段，定位并读取 decision-log 文件。
./specs/archive/m7-intake-v1/spec.md:98:本需求的核心是**升级 make-decision + 新建两组件 skill**。INTK 域定义 make-decision 本体的升级要求——消费关系写法、路径引用约束、stage-result facts 扩展；SCOPE 域定义 scope-triage 组件 skill；DLOG 域定义 decision-log 组件 skill；REG 域定义 reuse-registry.md 及其校验要求；METRIC 域定义三 skill 各自的指标接入规则；CI 域定义 CI 冒烟从 5 扩到 7 并纳入 registry 断言的要求。
./specs/archive/m7-intake-v1/spec.md:107:- **FR-INTK-002**：make-decision 这一 stage 结束时产一张 stage-result，其 facts 必须含 `decision`、`scope`、`decision_log_path` 三个 key（均非空）；`decision_log_path` 值形如 `tasks/<任务>/decision-log.md`，供下游 M8 build-code 读完整决策记录。来源：D-M7-4（stage-result 一段一张）+ O3（decision_log_path 字段）。
./specs/archive/m7-intake-v1/spec.md:108:  - **场景**：Given make-decision 执行后的 stage-result，When 校验 facts，Then 含 `decision`、`scope`、`decision_log_path` 三个 key 且均非空（缺任一或空值即失败）。
./specs/archive/m7-intake-v1/spec.md:117:- **FR-SCOPE-001**：在 `workflows/scope-triage/` 下建 SKILL.md，定性为 make-decision 的组件 skill，物理独立、可被工头/子代理独立调起；文件头写明来源路径（按"改造适配"类引入，接 workflowhub stage-result 契约 + 指标，非纯抄）。来源：D-M7-2、D-M7-3。
./specs/archive/m7-intake-v1/spec.md:119:- **FR-SCOPE-002**：scope-triage SKILL.md 是纯提示词，不含执行代码，不单独产 stage-result；其输入为需求文本/上游内容，输出为范围判定结果（in-scope/out-of-scope 分流）。来源：D-M7-2（组件 skill 不产 stage-result）。
./specs/archive/m7-intake-v1/spec.md:120:  - **场景**：Given scope-triage SKILL.md，When 检查，Then 无单独 stage-result 产出要求（不误导执行者单独产 stage-result）。
./specs/archive/m7-intake-v1/spec.md:130:- **FR-DLOG-002**：decision-log SKILL.md 是纯提示词，不含执行代码，不单独产 stage-result；其输入为需求文本/已有输入，输出为收敛后的决策内容（落 `tasks/<任务>/decision-log.md`，含必要章节 7 节、至少一条含来源证据的决策记录）。来源：D-M7-2（组件不产 stage-result）、D-M7-6（产物落 `tasks/<任务>/`）。
./specs/archive/m7-intake-v1/spec.md:151:- **FR-METRIC-001**：make-decision、scope-triage、decision-log 三个 skill 各自调 collector.mjs 写一条独立指标记录，各自一条（三条总计），各自含 execution_id、skill_version、tokens、duration_ms 等标准字段。来源：D-M7-5（三 skill 各接指标）、D-M7-4a（collector 与 stage-result 是两套独立机制）。
./specs/archive/m7-intake-v1/spec.md:168:- **FR-CI-003**：CI 冒烟按 M6:228 定义，只压契约管道（验 make-decision 产出走 stage-result 契约、断链即失败），不执行 skill 本身、不为 skill 加机器执行入口。来源：D-M7-8。
./specs/archive/m7-intake-v1/spec.md:173:> 各模块之间靠 stage-result 产物（文件）+ collector 记录单向传递，是窄契约耦合。
./specs/archive/m7-intake-v1/spec.md:177:- **负责什么**：升级后的 make-decision 纯提示词，内联 scope-triage / decision-log 逻辑摘要，显式路径引用两组件，要求执行者产 stage-result（facts 含 decision + scope + decision_log_path）+ 写 collector 指标。
./specs/archive/m7-intake-v1/spec.md:178:- **对外接口**：产 stage-result 产物（落本 task 目录），供下游 build-spec / build-code 读取；facts.decision_log_path 供 M8 读完整 decision-log。
./specs/archive/m7-intake-v1/spec.md:179:- **依赖谁**：依赖 scope-triage 和 decision-log 组件 skill（提示词引用）、stage-result 契约、collector.mjs。
./specs/archive/m7-intake-v1/spec.md:185:- **依赖谁**：依赖 collector.mjs；不依赖 stage-result（不单独产）。
./specs/archive/m7-intake-v1/spec.md:192:- **依赖谁**：依赖 collector.mjs；不依赖 stage-result（不单独产）。
./specs/archive/m7-intake-v1/spec.md:204:- **负责什么**：seven-skills-present 断言 + stage-result 契约校验 + metric-scan（token 存在）+ reuse-registry 行格式校验。
./specs/archive/m7-intake-v1/spec.md:210:- **make-decision stage-result 产物**（make-decision 这一 stage 结束产一张）：
./specs/archive/m7-intake-v1/spec.md:212:  - `facts.decision`：本次拍板的方向/结论（非空）。
./specs/archive/m7-intake-v1/spec.md:213:  - `facts.scope`：范围边界（做什么/不做什么，非空）。
./specs/archive/m7-intake-v1/spec.md:214:  - `facts.decision_log_path`：完整 decision-log 文件的稳定路径，形如 `tasks/<任务>/decision-log.md`（非空，供 M8 消费）。
./specs/archive/m7-intake-v1/spec.md:215:  - `error_code` / `retryable` / `missing_items` / `user_decision` / `reason`：沿用现有 stage-result.contract.json 其余字段。
./specs/archive/m7-intake-v1/spec.md:227:- make-decision stage-result 产物：每次执行时产出，作为下游 build-spec / build-code 输入，生命周期随本次流程；落盘位置由 make-decision 提示词约定（落本 task 目录）。
./specs/archive/m7-intake-v1/spec.md:235:本期不切片，标"本期不涉及"。make-decision SKILL.md 是升级（非新建），facts key 新增 `decision_log_path` 属 additive 扩展（原有 `decision`/`scope` 保留）。两组件 skill 是新增目录，不影响已有五段。reuse-registry.md 是新增文件，不改现有任何契约。
./specs/archive/m7-intake-v1/spec.md:242:- **隐性必达 2**：不引入运行时阻断式 gate（宪法 F4/F10），collector 记录和 stage-result 是两套独立机制（D-M7-4a），不混用。
./specs/archive/m7-intake-v1/spec.md:254:- [ ] **AC1**：**M7 验收（契约/记录层，机器可查）**：make-decision SKILL.md 正确指令产出 `tasks/<任务>/decision-log.md`——该产物契约由 decision-log 组件 skill 定义（完整 7 节结构 + 至少一条含非空来源证据字段的决策记录），且 make-decision 的 stage-result facts 含非空 `decision_log_path` 指向该路径。验证方式（参考，非 oracle）：核对 SKILL.md 契约 + facts-subschema，通过标准是文件/契约状态而非命令执行结果（M7 无机器执行入口，见 FR-INTK-003 / D-M7-8）。反向（M7）：产物契约缺任意节、缺来源证据字段、或 decision_log_path 空/占位符，即失败。**M8+ 运行时 oracle（deferred）**：实际跑一次 make-decision 产出真实 decision-log.md 文件并按上述结构核对，依赖 M8+ 集成入口届时坐实。← FR-DLOG-002 / FR-INTK-002
./specs/archive/m7-intake-v1/spec.md:256:- [ ] **AC3**：**M7 验收（契约/记录层，机器可查）**：make-decision / scope-triage / decision-log 三个 SKILL.md 各被指令写一条独立 collector 记录（metric wiring 完整：recordSkeleton + updateOwnResult + collector.mjs 引用 + stage 字面量正确），故一次完整流程的记录数契约 ≥ 实际调起 skill 数（各一条，上限 3 条），每条 execution_id / stage / skill_version 字段非空。验证方式（参考，非 oracle）：核 scanSkillMetrics 扫描 + metric-scan 测试，通过标准是 metric wiring 契约状态而非命令执行结果（M7 无机器执行入口，见 FR-CI-003 / D-M7-8）。反向（M7）：任一 skill metric wiring 不全、stage 字面量错、或契约字段空，即失败。**M8+ 运行时 oracle（deferred）**：实际跑一次产真实 collector 记录并按记录数核对，依赖 M8+ 集成入口届时坐实。← FR-METRIC-001
./specs/archive/m7-intake-v1/spec.md:259:- [ ] **AC6**：冒烟测试套件状态为：4/4 谓词全部满足——①seven-skills-present：7 个 skill 名字面量独立断言均在场（删任一 skill 目录则 1/7 断言为假即红）；②stage-result 契约形状：make-decision 产出的 stage-result facts 含 decision、scope、decision_log_path 三个非空 key（3/3 key 在场）；③metric-scan：三个 skill 的 collector 记录中 tokens 字段均非空（3/3 记录 tokens 在场）；④reuse-registry 行格式：7 行各满足类别枚举 + 来源非空（7/7 行合法）。反向：任一谓词不满足（缺 skill、缺 key、tokens 为空、行格式非法），即冒烟失败。验证方式（参考，非 oracle）：可运行测试套件辅助核对，但通过标准是上述状态谓词均为真而非"测试命令执行成功"。← FR-CI-001 / FR-CI-002 / FR-CI-003
./specs/archive/m7-intake-v1/spec.md:264:- **~~未决 2（组件 skill 概念扩展性）—— 已决~~**：「组件 skill」是 M7 新引入概念（D-M7-2），其定义写入 workflowhub `CONTEXT.md`（或 `SPEC.md`），**不动宪法 21 条**。核心定义：组件 skill 是从属于某一顶层 skill 的可独立调起子流程，不单独产 stage-result，只产 collector 指标记录；来源/消费关系由顶层 skill 提示词显式引用路径字符串声明。apply 阶段在 CONTEXT.md 补此定义段，防后续 M8+ 执行者对"组件 skill 是否单独产 stage-result"产生歧义。
./specs/archive/m7-intake-v1/spec.md:278:- `workflows/make-decision/SKILL.md` — 升级：内联两组件逻辑摘要 + 显式路径引用 + facts 扩展 `decision_log_path`
./specs/archive/m7-intake-v1/spec.md:280:- `contracts/facts-subschema.json` — make-decision.required_keys 追加 decision_log_path（FR-INTK-002，Phase 3 T010）
./specs/archive/m7-intake-v1/spec.md:281:- `tests/facts-subschema.test.mjs` — decision_log_path 的红/绿测试（Phase 3 T009）
./specs/archive/m7-intake-v1/spec.md:283:- `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md`（Knowledge 仓，**不在 workflowhub 仓**）— 命名全局对齐（intake→make-decision 等，D-M7-9；仅改 roadmap.md 文档约 26 处 M6/M7/M10/M13/X4 段命名，代码级 intake 改名出 M7 范围）
./specs/archive/m7-intake-v1/spec.md:293:- contracts/stage-result.contract.json（复用现有契约，不新建 schema，D-M7-4）
./specs/archive/m6-five-stage-skeleton/tasks.md:28:- [x] T002 写 workflows/make-decision/SKILL.md：纯提示词，intake 段"该阶段干什么"（澄清需求→产 stage-result 产物 facts 含 decision/scope→写一条指标），无 gate/checkpoint/Post-Review 段。[FR-SKILL-001][FR-SKILL-002][FR-SKILL-003]
./specs/archive/m6-five-stage-skeleton/tasks.md:29:- [x] T003 写 workflows/build-spec/SKILL.md：design 段纯提示词（产 spec→facts 含 spec_ref/requirements→写指标），内置 F10 防过度工程硬约束文字段。[FR-SKILL-001][FR-SKILL-002][FR-ANTIBLOAT-001]
./specs/archive/m6-five-stage-skeleton/tasks.md:30:- [x] T004 写 workflows/build-plan/SKILL.md：plan 段纯提示词（产 plan→facts 含 plan_ref/tasks→写指标），内置 F10 防过度工程约束文字段。[FR-SKILL-001][FR-SKILL-002][FR-ANTIBLOAT-001]
./specs/archive/m6-five-stage-skeleton/tasks.md:31:- [x] T005 写 workflows/build-code/SKILL.md：apply 段纯提示词（只认上游 stage-result 产物按 facts key 取输入→facts 含 changed/tests→写指标），slim 路直读 make-decision 产物不假定 spec/plan。[FR-SKILL-001][FR-SKILL-002][FR-CONTRACT-003]
./specs/archive/m6-five-stage-skeleton/tasks.md:32:- [x] T006 写 workflows/verify-code/SKILL.md：test-acceptance 段纯提示词（验证交付→facts 含 verdict/evidence_ref→写指标），写清与 verify-change 的语义区别。[FR-SKILL-001][FR-SKILL-002]
./specs/archive/m6-five-stage-skeleton/tasks.md:54:## Phase 2: facts 子 schema 校验 + 指标接入
./specs/archive/m6-five-stage-skeleton/tasks.md:60:五段 facts 子 schema 落地校验（每段必含 spec 第 6 章约定 key 非空，防空 object 假绿），每段提示词要求写一条指标到 metrics_path。完成定义：tests/facts-subschema.test.mjs 绿（正样例过 + 反样例 facts={}/缺 key 判失败）。
./specs/archive/m6-five-stage-skeleton/tasks.md:64:- 新增 contracts/facts-subschema.json（五段 facts 子 schema）
./specs/archive/m6-five-stage-skeleton/tasks.md:65:- 新增 scripts/validate-stage-result.mjs（校验产物过 stage-result + 本段 facts 子 schema）
./specs/archive/m6-five-stage-skeleton/tasks.md:66:- 新增 tests/facts-subschema.test.mjs
./specs/archive/m6-five-stage-skeleton/tasks.md:71:- [x] T009 采集失败输出：写 tests/facts-subschema.test.mjs（正样例：build-code facts 含 changed+tests 非空→过；反样例：facts={} 或缺 key→失败，逐段覆盖五段 key）。跑应 RED（校验脚本/schema 未建），存 apply/evidence/phase-2-RED.json。[FR-CONTRACT-002]
./specs/archive/m6-five-stage-skeleton/tasks.md:72:- [x] T010 写 contracts/facts-subschema.json：按 spec 第 6 章表定五段 facts 子 schema（make-decision: decision/scope; build-spec: spec_ref/requirements; build-plan: plan_ref/tasks; build-code: changed/tests; verify-code: verdict/evidence_ref），每段 required 含约定 key、key 值非空约束。[FR-CONTRACT-002]
./specs/archive/m6-five-stage-skeleton/tasks.md:73:- [x] T011 写 scripts/validate-stage-result.mjs：先过 stage-result.contract.json，再按段名取 facts-subschema 校验 facts 含约定 key 非空（SIG-001）。[FR-CONTRACT-001][FR-CONTRACT-002]
./specs/archive/m6-five-stage-skeleton/tasks.md:74:- [x] T012 确认五段 SKILL.md 提示词要求写一条指标记录到 metrics_path（含"哪段/哪个 skill"标识，复用现有 metrics 格式不另立 schema）。跑 GREEN：`node --test tests/facts-subschema.test.mjs` 应 0，存 apply/evidence/phase-2-GREEN.json。[FR-METRIC-001][FR-CONTRACT-002]
./specs/archive/m6-five-stage-skeleton/tasks.md:75:- [x] T013 维护知识文件：写 apply/phase-2.md（facts 子 schema 与 spec 第 6 章对齐确认 + 指标接入方式），evidence 落盘，同步 ledger + state。
./specs/archive/m6-five-stage-skeleton/tasks.md:79:- **验证目标**：facts 子 schema 防空 object 假绿（AC7）+ 每段约定 key（FR-CONTRACT-002）。
./specs/archive/m6-five-stage-skeleton/tasks.md:80:- **gate_cmd**：`node --test tests/facts-subschema.test.mjs`
./specs/archive/m6-five-stage-skeleton/tasks.md:83:- **display_cmd**：`node scripts/validate-stage-result.mjs --self-test 2>&1 | tail`
./specs/archive/m6-five-stage-skeleton/tasks.md:87:apply/phase-2.md 记五段 facts key 与 spec 第 6 章逐段对照 + 校验脚本接入点。
./specs/archive/m6-five-stage-skeleton/tasks.md:91:facts 子 schema key 与 spec 第 6 章不一致 → 停（范围漂移，回 spec 核）。反样例 facts={} 不判失败 → 停（假绿未防住）。
./specs/archive/m6-five-stage-skeleton/tasks.md:114:- [x] T017 人/AI 实跑端到端：big 路（五段全走）+ small 路（make-decision→build-code 跳步）。**端到端证据（写入 apply/phase-3.md）**：①big 路五段各产物的 stage-result 文件路径 + 各自 facts 约定 key 值快照；②small 路 build-code 实际从 make-decision facts.decision 取输入的证据；③metrics 文件里五段各一条记录的快照（AC5）；④大输出 skill 子代理回报样例证明只含摘要+路径无大段原文（AC9）；⑤任一段 error/无产物/传不到下段则记为失败。[FR-WIRING-002][FR-WIRING-003][FR-CONTRACT-003][FR-METRIC-001]
./specs/archive/m6-five-stage-skeleton/tasks.md:137:- Phase 1 → Phase 2（facts 校验依赖五段已建）→ Phase 3（扫描器/优化/串通依赖前两 phase）。
./specs/archive/m8-build-code/spec.md:38:workflowhub 轻结构 repo，M7 已交付（make-decision workflow + reuse-registry.md）。build-code 空骨架已存在（M6 留存）。contracts/ 五契约齐（含 stage-result）。3rd-review 已独立成外部 repo，提供脱平台独立入口。Worker-Mode 插件提供 implementer/qa/reviewer 等 worker，零项目绑定。
./specs/archive/m8-build-code/spec.md:68:那么：facts.review.status=executed，source=third_party，verdict=pass，artifact_path 指向审查报告 durable 路径，事实包落盘完整。
./specs/archive/m8-build-code/spec.md:73:那么：facts.review.verdict=revise_required 如实记录，skill 浮现返修提示，不自动推进至下游。
./specs/archive/m8-build-code/spec.md:78:那么：facts.review.status=not_executed 记录在事实包，stage 边界浮现提示"审查未执行"，不被静默隐藏。
./specs/archive/m8-build-code/spec.md:93:那么：facts.review.status=executed（审查被调用，非未执行）、facts.review.source=same_source（标记降级，区别于 third_party），verdict 照常记录，M9 读到时可区分真异源 vs 同源降级（来源：C4，D8）。
./specs/archive/m8-build-code/spec.md:98:那么：facts.changed、facts.tests、facts.review 三键均存在，M9 无需额外转换即可消费。
./specs/archive/m8-build-code/spec.md:119:build-code 在 RED 阶段完成后，必须从外部读取三项物理信号：测试进程 exit 码、Test Files 行内容、当前测试输出内容 hash。三项信号均采集后写入 facts.tests。不依赖 implementer 自报。
./specs/archive/m8-build-code/spec.md:122:GREEN 阶段后，同样采集 exit 码、Test Files 行、内容 hash，与 RED 基线对比（失败数变化、hash 是否变更）。对比结果写入 facts.tests，含 green_baseline_hash 字段。不得依赖 implementer 自报测试结果，必须由 build-code 外部独立采集物理信号。
./specs/archive/m8-build-code/spec.md:125:若 RED 阶段采集到 exit 码为零，判定为可疑假红，浮现警告，记录 red_exit_code=0 至 facts.tests。不 blocking 推进（符合 D5/D7 记事实非 blocking）。可观测合同：facts.tests 含 anomaly_flags 字段，其中枚举值 suspicious_red_exit 表示假红可疑；stage 边界输出含 warning 类型条目，内容包含"RED 阶段未真红"字样。验收人可通过读取 facts.tests.anomaly_flags 和 stage 边界输出客观判定浮现是否发生，不依赖主观判断。
./specs/archive/m8-build-code/spec.md:128:若 GREEN exit 码为零但内容 hash 与 RED 阶段相同（或 Test Files 行为空），判定为可疑假绿，浮现警告，记录异常状态至 facts.tests。不 blocking 推进。可观测合同：facts.tests 含 anomaly_flags 字段，其中枚举值 suspicious_green_exit（hash 未变）或 green_test_files_empty（Test Files 行为空）表示假绿可疑；stage 边界输出含 warning 类型条目，内容包含"GREEN 阶段疑似假绿"字样。验收人可通过读取 facts.tests.anomaly_flags 和 stage 边界输出客观判定浮现是否发生。
./specs/archive/m8-build-code/spec.md:131:facts.tests 下所有字段在阶段结束前落 task durable 路径，不落临时路径。证据必须在 skill 进程结束后仍可读。不得写入系统易失路径（如临时目录或内存缓冲区），否则进程退出后证据不可达。
./specs/archive/m8-build-code/spec.md:147:build-code 产出的事实包必须包含三个顶层键：`facts.changed`（变更清单）、`facts.tests`（含 red_exit_code/green_baseline_hash 等测试事实，审查记录不混入此键）、`facts.review`（审查记录独立键，含 status/source/verdict/artifact_path）。design 可在此基础上加字段，不可删减。
./specs/archive/m8-build-code/spec.md:150:事实包在 skill 执行结束前落 task durable 路径，路径格式与 stage-result 契约对齐，M9 可通过约定路径直接读取，无需额外传参。
./specs/archive/m8-build-code/spec.md:153:事实包格式必须与 stage-result 契约中的 facts 结构不冲突，M9 verify-code 读取时无需转换或适配。不得要求 M9 做 schema 转换、字段重映射或格式适配；M9 侧按 C1 契约直接读取，无需感知 M8 内部实现。
./specs/archive/m8-build-code/spec.md:161:facts.review.status 必须记录两态之一：executed（审查被成功调用并有 verdict）或 not_executed（审查未被调用或调用失败）。缺字段即视为审查状态不可知。
./specs/archive/m8-build-code/spec.md:164:facts.review.source 记录：third_party（真异源）、same_source（同源降级，D8 合法）两值。M9 据此区分审查质量。用户主动跳过审查的情形用 facts.review.status=not_executed 表达（C3），不在 source 引入未批准的枚举值。同源降级（same_source）属于"真调了审查"，facts.review.status 仍记 executed，不记 not_executed；M9 靠 source 字段区分审查质量，而非靠 status 区分是否降级（来源：C4）。
./specs/archive/m8-build-code/spec.md:167:当 facts.review.status=not_executed 时，skill 在 stage 边界结构化浮现提示"审查未执行"，不静默隐藏。可证伪性由构造场景测试承载（用户主动构造"审查没调"场景验记录如实）。可观测合同：facts.review.status=not_executed 时，stage 边界输出必须含 warning 类型条目，内容包含"审查未执行"字样；验收人可通过读取 facts.review.status 字段和 stage 边界输出客观判定浮现是否发生，被静默隐藏（字段存在但无 warning 输出）即判 fail。
./specs/archive/m8-build-code/spec.md:170:审查执行后，审查报告落 durable 路径，facts.review.artifact_path 指向该路径。
./specs/archive/m8-build-code/spec.md:204:- [ ] **验收 1 — TDD 完整闭环**：选独立小目标任务，用 build-code skill 跑完整 RED → GREEN → 审查。验证：facts.tests 中 red_exit_code 非零、GREEN 后 exit 码为零、green_baseline_hash 与 RED 阶段 hash 不同；facts.review.status=executed；事实包 durable 路径可读。任一环缺失即失败。（来源：D-M8-3）
./specs/archive/m8-build-code/spec.md:208:- [ ] **验收 3 — 审查遗漏可见**：构造"审查没调"场景（主动跳过 3rd-review 调用）。验证：facts.review.status=not_executed，stage 边界浮现"审查未执行"提示，不被静默隐藏。被隐藏即失败。（来源：C3，FR-REVIEW-002/004）
./specs/archive/m8-build-code/spec.md:210:- [ ] **验收 4 — 验收事实包完整**：build-code 完成后读取 durable 路径下事实包。验证：facts.changed、facts.tests（含 red_exit_code/green_baseline_hash）、facts.review（含 status/source/verdict/artifact_path）三键均存在，缺任一键即失败。（来源：C1，FR-PKG-001/002/003）
./specs/archive/m8-build-code/spec.md:219:- `facts.changed`：本次执行变更的模块/文件清单（不含审查记录）
./specs/archive/m8-build-code/spec.md:220:- `facts.tests`：TDD 物理事实汇总
./specs/archive/m8-build-code/spec.md:224:- `facts.review`：审查记录独立键
./specs/archive/m8-build-code/spec.md:248:- **命名预留**：facts.tests 和 facts.review 键名在 C1 契约中固定，design 只加不删，M9 侧可安全读任意扩展键。
./specs/archive/m8-build-code/spec.md:249:- **容器预留**：stage-result 契约的 facts 结构已按 C1 设计，M9/M10 等后续里程碑可在 facts 下加新键，不破坏现有消费方。
./specs/archive/m8-build-code/spec.md:250:- **状态预留**：facts.review.source 的两值（third_party/same_source）已覆盖当前已批准场景，未来审查模式扩展可追加枚举值，已有值语义不变。
./specs/archive/m8-build-code/spec.md:267:- facts.review.status 两态必须都可产生并可被测试（构造"审查没调"场景可证伪）
./specs/archive/m8-build-code/spec.md:301:  - 回归要点：原有骨架定义的接口（RED→implement→GREEN 循环、消费上游 stage-result facts、产 stage-result）不被破坏
./specs/archive/m8-build-code/spec.md:303:- **受影响功能：stage-result 契约（M9 边界）**
./specs/archive/m8-build-code/spec.md:304:  - 既有行为：facts 结构已有 changed/tests 键，M9 侧按既有 schema 读取
./specs/archive/m8-build-code/spec.md:305:  - 本需求影响：在 facts 下新增 review 键（C1），可能扩展 tests 键字段
./specs/archive/m6-five-stage-skeleton/plan.md:4:> 需求权威源：tasks/m6-five-stage-skeleton/artifacts/decision-log.md（D1-D14）。
./specs/archive/m6-five-stage-skeleton/plan.md:11:- 已有基建：CONSTITUTION.md（21 条，含 F4/F10）、contracts/stage-result.contract.json（facts 开放 object）、config/workflowhub.yaml（registry + metrics_path）、scripts/check-stage-quality.mjs（指标质量扫描器，344 行）、core/protected-paths.mjs（运行时非阻断提醒）。
./specs/archive/m6-five-stage-skeleton/plan.md:13:- NEEDS CLARIFICATION：无（design 阶段已消歧，facts 子 schema 在 spec 第 6 章锚定）。
./specs/archive/m6-five-stage-skeleton/plan.md:18:- F2 窄契约：YES — 五段靠 stage-result 单向传递，facts 子 schema 是窄接口。
./specs/archive/m6-five-stage-skeleton/plan.md:22:- F9 可证伪不假绿：YES — facts 子 schema 防空 object 假绿，扫描器检漏接指标，AC 带正反样例。
./specs/archive/m6-five-stage-skeleton/plan.md:25:- S5 方便子代理调用省主上下文：YES — 回报复用 stage-result 摘要（FR-WIRING-003）。
./specs/archive/m6-five-stage-skeleton/plan.md:38:| schema（journal event / checkpoint / *.schema.json） | 改 | 新增 contracts/facts-subschema.json（五段 facts 子 schema） | T010 |
./specs/archive/m6-five-stage-skeleton/plan.md:48:| facts 校验落点 | 新建 schema / 复用 stage-result + 子 schema 约定 | 复用 + 子 schema | D6/D11：不新建 skill-summary schema |
./specs/archive/m6-five-stage-skeleton/plan.md:54:本期不涉及数据库/迁移。涉及的数据结构（stage-result 产物 facts 子 schema、指标记录）已在 spec 第 6 章锚定，不重复。
./specs/archive/m6-five-stage-skeleton/plan.md:67:│   ├── make-decision/SKILL.md      # 新增 — intake 段纯提示词（facts: decision/scope）
./specs/archive/m6-five-stage-skeleton/plan.md:68:│   ├── build-spec/SKILL.md         # 新增 — design 段（facts: spec_ref/requirements，含 F10 注入）
./specs/archive/m6-five-stage-skeleton/plan.md:69:│   ├── build-plan/SKILL.md         # 新增 — plan 段（facts: plan_ref/tasks，含 F10 注入）
./specs/archive/m6-five-stage-skeleton/plan.md:70:│   ├── build-code/SKILL.md         # 新增 — apply 段（facts: changed/tests，slim 路认 make-decision 产物）
./specs/archive/m6-five-stage-skeleton/plan.md:71:│   └── verify-code/SKILL.md        # 新增 — test-acceptance 段（facts: verdict/evidence_ref）
./specs/archive/m6-five-stage-skeleton/plan.md:74:│   └── facts-subschema.json        # 新增 — 五段 facts 子 schema（FR-CONTRACT-002，每段必含 key 非空）
./specs/archive/m6-five-stage-skeleton/plan.md:76:│   ├── validate-stage-result.mjs   # 新增 — 校验产物过 stage-result + 本段 facts 子 schema
./specs/archive/m6-five-stage-skeleton/plan.md:79:    ├── facts-subschema.test.mjs    # 新增 — 五段 facts 子 schema 正反样例
./specs/archive/m6-five-stage-skeleton/plan.md:88:make-decision 产 stage-result（facts.decision/scope）→ [big 路] build-spec→build-plan→build-code→verify-code 逐段读上游 facts 约定 key；[small 路] make-decision → build-code 直读 facts.decision。每段写一条指标到 metrics_path。
./specs/archive/m6-five-stage-skeleton/plan.md:98:- stage-result 契约：不改契约文件本身，新增 facts 子 schema 作旁路校验。
./specs/archive/m6-five-stage-skeleton/plan.md:108:| SIG-001 | contracts/stage-result.contract.json | 顶层 required: status/error_code/retryable/facts/missing_items/user_decision/reason；facts 开放 object |
./specs/archive/m6-five-stage-skeleton/plan.md:113:复用优先：facts 校验复用 stage-result + AJV；指标检查扩展 check-stage-quality.mjs；不新造扫描器。
./specs/archive/m6-five-stage-skeleton/plan.md:120:| 2 | facts 子 schema 与 spec 第 6 章 key 不一致 | task 直接引 spec 第 6 章表 | revert contract + 校验脚本 |
./specs/archive/m6-five-stage-skeleton/plan.md:127:- [x] **交付标准（done）**：每 phase Goal 写可勾完成定义（五目录各有 SKILL.md / facts 子 schema 校验过正反样例 / 扫描器检出漏接）。
./specs/archive/m6-five-stage-skeleton/plan.md:128:- [x] **异常标准（边界）**：facts={} 或缺 key → 契约判失败；漏接指标 → 扫描器退出码非 0；small 跳步路缺 spec/plan 不报错。
./specs/archive/m6-five-stage-skeleton/plan.md:170:    "command": "node --test tests/facts-subschema.test.mjs",
./specs/archive/m6-five-stage-skeleton/plan.md:179:    "command": "node --test tests/facts-subschema.test.mjs",
./specs/archive/m6-five-stage-skeleton/plan.md:189:    "tests/facts-subschema.test.mjs"
./specs/archive/m6-five-stage-skeleton/spec.md:6:**来源用户故事**: workflowhub roadmap M6（agenthub-extraction-program/artifacts/roadmap.md 行 208-233）
./specs/archive/m6-five-stage-skeleton/spec.md:7:**需求权威源**: `tasks/m6-five-stage-skeleton/artifacts/decision-log.md`（14 决策 D1-D14）
./specs/archive/m6-five-stage-skeleton/spec.md:15:  - 每段提示词内置要求：产 stage-result 契约产物（带本段约定的 facts key）+ 写一条指标记录。
./specs/archive/m6-five-stage-skeleton/spec.md:16:  - 给五段各定最小 facts 子 schema（每段 1-2 个 key），防空 object 假绿。
./specs/archive/m6-five-stage-skeleton/spec.md:20:- **验收信号**：五个命令各能调起 → 跑一遍五段，metrics 里五段各有一条记录 → 五段产物都过 stage-result 契约校验 → big/small 两路都跑通 → 扫描器能揪出漏接指标的 skill。
./specs/archive/m6-five-stage-skeleton/spec.md:26:- Q: 每段产物里标识本段产出的 facts key，现在定字面量还是留 plan/apply 定？ → A: design 阶段即定五段各自最小 facts 子 schema（每段 1-2 个语义化 key，见第 6 章「五段 facts 子 schema」表）。D11 原文要求「facts 定每段最小子 schema（每段必含 1-2 个 key）…design 阶段细化」，故由 design 定锚点、plan/apply 据此执行（design-review round-1 blocking 纠偏：原推迟到 plan/apply 属范围漂移，已撤回）。
./specs/archive/m6-five-stage-skeleton/spec.md:38:agenthub 的 vibecoding workflow 有成熟的五段提示词（intake/design/plan/apply/test-acceptance），但与运行时 gate 深度耦合。workflowhub 已立宪法 F4（质量靠异源审查+人，非阻断质量门）和 F10（自动化按真实收益，不为"机器可校验"本身堆基建），并已删除 check-path-guard CI 护栏、把 findViolation 解耦进 core/protected-paths.mjs 作运行时非阻断提醒（commit 7453d4b，已在 main）。M3 已定窄契约 stage-result，M4 已有指标系统与 check-stage-quality.mjs 扫描器。本期在这些基础上建五段骨架。
./specs/archive/m6-five-stage-skeleton/spec.md:44:- 每段提示词要求 AI 产 stage-result 契约产物 + 写一条指标记录。
./specs/archive/m6-five-stage-skeleton/spec.md:54:3. **不新建 skill-summary-report.schema.json**（D6）——摘要回报复用现有 stage-result.contract.json。
./specs/archive/m6-five-stage-skeleton/spec.md:69:- **操作步骤**：依次调起 /make-decision → /build-spec → /build-plan → /build-code → /verify-code，每段把上一段的 stage-result 产物作为输入传给下一段。
./specs/archive/m6-five-stage-skeleton/spec.md:70:- **预期结果**：五段各产出一份合法 stage-result 产物（status/facts 等字段齐全）；每段在 metrics 里各留一条记录；上游产物能被下游正确读到并继续。
./specs/archive/m6-five-stage-skeleton/spec.md:75:- **操作步骤**：只调 /make-decision，然后直接跳到 /build-code，把 make-decision 的 stage-result 产物直接传给 build-code。
./specs/archive/m6-five-stage-skeleton/spec.md:76:- **预期结果**：build-code 只认上游传来的合法 stage-result 产物（靠 facts 子 schema 约定的 key 拿到输入），不假定 spec/plan 存在，正常执行并产物；这条路也跑得通。
./specs/archive/m6-five-stage-skeleton/spec.md:81:- **操作步骤**：构造某一段产出一个不符合 stage-result 契约的产物（如 facts 为空 object、缺 status 字段）。
./specs/archive/m6-five-stage-skeleton/spec.md:94:- **预期结果**：子代理回报只给摘要 + 文件路径引用，主上下文不出现大段原文（S6 省 token，复用 stage-result 契约回报摘要）。
./specs/archive/m6-five-stage-skeleton/spec.md:105:- [x] **空态**：需覆盖 → 场景三（facts 空 object 被契约判失败）。
./specs/archive/m6-five-stage-skeleton/spec.md:119:本需求的核心是**五份纯提示词 skill**，它们共享同一套契约与指标接线。SKILL 域定义五段本体——每段是一份能 /命令 调起的标准 skill，内容是从 agenthub 对应阶段提示词提取的纯阶段指导，命名语义化、横向齐全。CONTRACT 域规定每段产物必须过 stage-result 窄契约，并给每段定最小 facts 子 schema，让"产了什么事实"可被校验、防空 object 假绿，也让下游能靠约定 key 拿到上游输入。METRIC 域规定每段跑完写一条指标记录，并让扫描器能揪出漏接指标的段。WIRING 域管"装得上、调得起、串得通"——registry 注册、命令调起、big/small 两路端到端贯通、大输出节制。ANTIBLOAT 域把宪法 F10 防过度工程约束以提示词文字注入 build-spec/build-plan。OPT 域要求五份初稿齐全后逐份用 writing-great-skills 优化。
./specs/archive/m6-five-stage-skeleton/spec.md:131:  - **场景**：Given 任一 SKILL.md，When 检查，Then 文件内无可执行 runtime 入口代码，且提示词正文要求产 stage-result 产物与写指标。
./specs/archive/m6-five-stage-skeleton/spec.md:135:### 窄契约与 facts 子 schema（CONTRACT）
./specs/archive/m6-five-stage-skeleton/spec.md:137:- **FR-CONTRACT-001**：五段产物都用现有 stage-result 契约校验，不新建 skill-summary schema。来源：decision-log 决策 D6/D14。
./specs/archive/m6-five-stage-skeleton/spec.md:138:  - **场景**：Given 任一段产出 stage-result 产物，When 用 stage-result.contract.json 校验，Then 合法产物通过。
./specs/archive/m6-five-stage-skeleton/spec.md:139:  - **场景**：Given 构造一段不认契约的产物（缺 status / facts 非法），When 校验，Then 判失败（不放行）。
./specs/archive/m6-five-stage-skeleton/spec.md:140:- **FR-CONTRACT-002**：给五段各定最小 facts 子 schema（每段 1-2 个语义化 key，键集见第 6 章「五段 facts 子 schema」表），约束 facts 不得为空 object 且必含本段约定 key，防空 object 假绿、支撑 small 跳步路按 key 取输入。来源：decision-log 决策 D11。
./specs/archive/m6-five-stage-skeleton/spec.md:141:  - **场景**：Given 某段 facts 为空 object，When 按该段 facts 子 schema 校验，Then 判失败。
./specs/archive/m6-five-stage-skeleton/spec.md:142:  - **场景**：Given 某段 facts 含约定 key，When 校验，Then 通过。
./specs/archive/m6-five-stage-skeleton/spec.md:143:- **FR-CONTRACT-003**：small 跳步路下，build-code 只认上游传来的合法 stage-result 产物（靠 facts 子 schema 约定 key 拿到输入），不假定 spec/plan 产物存在。来源：decision-log 决策 D12。
./specs/archive/m6-five-stage-skeleton/spec.md:163:- **FR-WIRING-003**：大输出 skill 经子代理调用后，主上下文只增加摘要 + 文件路径引用，不出现大段原文（S6 省 token，复用 stage-result 契约回报摘要）。来源：decision-log 决策 D6（S6 本期落实）。
./specs/archive/m6-five-stage-skeleton/spec.md:179:> 五段 skill 之间靠 stage-result 产物（文件）单向传递，是窄契约耦合。
./specs/archive/m6-five-stage-skeleton/spec.md:184:- **对外接口**：上游产 stage-result 产物 → 下游读其 facts 约定 key 作输入。
./specs/archive/m6-five-stage-skeleton/spec.md:185:- **依赖谁**：依赖 stage-result 契约（CONTRACT）、指标系统（METRIC）、registry（WIRING）。
./specs/archive/m6-five-stage-skeleton/spec.md:188:### stage-result 契约 + facts 子 schema
./specs/archive/m6-five-stage-skeleton/spec.md:190:- **负责什么**：校验各段产物结构合法、facts 非空且含约定 key。
./specs/archive/m6-five-stage-skeleton/spec.md:191:- **对外接口**：contracts/stage-result.contract.json + 五段各自 facts 子 schema 约定。
./specs/archive/m6-five-stage-skeleton/spec.md:192:- **依赖谁**：无（已有契约文件，本期只补 facts 子 schema 约定）。
./specs/archive/m6-five-stage-skeleton/spec.md:211:- **stage-result 产物**（每段产出一份）：
./specs/archive/m6-five-stage-skeleton/spec.md:213:  - `facts`：开放 object，但本期给每段约定最小子 schema（1-2 个 key），不得为空。
./specs/archive/m6-five-stage-skeleton/spec.md:214:  - `error_code` / `retryable` / `missing_items` / `user_decision` / `reason`：契约其余字段（沿用现有 stage-result.contract.json）。
./specs/archive/m6-five-stage-skeleton/spec.md:220:### 五段 facts 子 schema（D11：每段最小 1-2 个语义化 key，design 阶段锚定）
./specs/archive/m6-five-stage-skeleton/spec.md:222:> facts 仍是开放 object，但每段必含下表约定的 key（非空）；下游按这些 key 取上游输入。key 名为设计级约定锚点，apply 落地时字段含义不得偏离本表语义。
./specs/archive/m6-five-stage-skeleton/spec.md:229:| build-spec | `requirements` | 功能需求清单或计数 |
./specs/archive/m6-five-stage-skeleton/spec.md:237:约束：每段产物的 facts 至少含该段上表 key 且值非空；缺 key 或空值 → 契约校验判失败（防空 object 假绿，FR-CONTRACT-002）。
./specs/archive/m6-five-stage-skeleton/spec.md:241:- stage-result 产物：每段执行时产出，作为下游输入，生命周期随本次流程；落盘位置由各段提示词约定（与 M5 同模式落本 task 目录 / tmp）。
./specs/archive/m6-five-stage-skeleton/spec.md:247:本期不切片，标"本期不涉及"。五段命名已定终态（不预留改名），registry 三字段格式沿用现有约定（不预留新字段）。facts 子 schema 是新增约定但属本期落地，非未来预留。
./specs/archive/m6-five-stage-skeleton/spec.md:271:- [ ] **AC7**：五段都通过 stage-result 契约校验 + 各段 facts 含第 6 章约定 key 且非空（正样例：build-code 的 facts 含 `changed`+`tests` 非空 → 通过；反样例：facts 为 `{}` 或缺约定 key → 判失败）。任一段不认契约或缺约定 key 即失败。← FR-CONTRACT-001/002
./specs/archive/m6-five-stage-skeleton/spec.md:288:- **受影响的已有功能**：workflowhub 的 registry（新增五条注册）、指标系统（新增五段写入）、契约校验（新增五段 facts 子 schema 约定）、质量扫描器（扩展为能检漏接指标）。这些是既有模块的增量接入，不改其对外语义。
./specs/archive/m8-build-code/checklists/requirements.md:27:- [x] All functional requirements have clear acceptance criteria
./specs/archive/m8-build-code/checklists/requirements.md:35:- §6 关键实体中 facts.tests 字段列表为契约原型形状，属设计阶段允许的 schema 例外（非代码片段），符合 design.md Forbidden Actions 例外项
./specs/archive/m8-build-code/tasks.md:240:## Phase 4：facts 结构三键 + review 两态（FR-PKG-001~003, FR-REVIEW-001~005）
./specs/archive/m8-build-code/tasks.md:246:实现 C1 最小字段契约校验函数（验证 stage-result facts 结构完整性）和 review 两态/降级场景的可测试逻辑，覆盖 FR-REVIEW-001~005 全部需求。
./specs/archive/m8-build-code/tasks.md:250:- `/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/facts-schema.mjs` — 新建，C1 契约校验
./specs/archive/m8-build-code/tasks.md:251:- `/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-facts.test.mjs` — 新建
./specs/archive/m8-build-code/tasks.md:256:**Task 4.1 — 写 facts 契约测试（RED）** [FR-PKG-001, FR-PKG-003]
./specs/archive/m8-build-code/tasks.md:258:- 入参：无（facts-schema.mjs 不存在）
./specs/archive/m8-build-code/tasks.md:259:- 出参：`tests/build-code-facts.test.mjs`，测试：
./specs/archive/m8-build-code/tasks.md:260:  1. `validateFacts(facts)` 对合法 C1 结构返回 `{ valid: true, missing: [] }`
./specs/archive/m8-build-code/tasks.md:261:  2. 缺 `facts.changed` → `{ valid: false, missing: ['changed'] }`
./specs/archive/m8-build-code/tasks.md:262:  3. 缺 `facts.tests` → `{ valid: false, missing: ['tests'] }`
./specs/archive/m8-build-code/tasks.md:263:  4. 缺 `facts.review` → `{ valid: false, missing: ['review'] }`
./specs/archive/m8-build-code/tasks.md:264:  5. `facts.review` 存在但缺 `status` 字段 → `{ valid: false, missing: ['review.status'] }`
./specs/archive/m8-build-code/tasks.md:266:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-facts.test.mjs`
./specs/archive/m8-build-code/tasks.md:272:  1. `buildReviewFact({ status: 'executed', source: 'third_party', verdict: 'pass', artifactPath: 'x.md' })` → 返回合法 facts.review 对象
./specs/archive/m8-build-code/tasks.md:281:**Task 4.3 — 实现 facts-schema.mjs** [FR-PKG-001, FR-PKG-002, FR-PKG-003, FR-REVIEW-002, FR-REVIEW-003]
./specs/archive/m8-build-code/tasks.md:284:- 出参：`workflows/build-code/facts-schema.mjs`
./specs/archive/m8-build-code/tasks.md:287:  - 导出 `export function validateFacts(facts)` — C1 最小字段校验
./specs/archive/m8-build-code/tasks.md:288:  - 导出 `export function buildReviewFact({ status, source, verdict, artifactPath })` — 构造合法 facts.review 对象，含枚举校验
./specs/archive/m8-build-code/tasks.md:292:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/facts-schema.mjs`
./specs/archive/m8-build-code/tasks.md:305:node node_modules/.bin/vitest run tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false
./specs/archive/m8-build-code/tasks.md:309:node node_modules/.bin/vitest run tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false
./specs/archive/m8-build-code/tasks.md:317:- facts.review 独立键，不混入 facts.tests（C1 契约边界）
./specs/archive/m8-build-code/tasks.md:331:将 `workflows/build-code/SKILL.md` 从骨架升为 v1 完整提示词，写清 TDD 外部强制流程、diff-only 越界处理、3rd-review standalone 调用、facts.review 产出格式、Worker-Mode 子代理派发约束。同步更新 reuse-registry.md 登记三个外部依赖。
./specs/archive/m8-build-code/tasks.md:343:- 入参：Phase 1~4 交付物（capture.mjs / diff-scanner.mjs / facts-schema.mjs 已存在）
./specs/archive/m8-build-code/tasks.md:345:  1. **前置读取**：读上游 stage-result，提取 facts.plan_ref / facts.tasks（full path）或 facts.decision / facts.scope（slim path）
./specs/archive/m8-build-code/tasks.md:351:  7. **3rd-review standalone**：完成 GREEN 后调用 3rd-review standalone 入口，喂真实 git diff（非自然语言），消费 verdict 三态（pass / revise_required / escalate_to_human）；不可用时降级 same_source 并记入 facts.review.source
./specs/archive/m8-build-code/tasks.md:352:  8. **facts.review 产出**：调用 facts-schema.mjs buildReviewFact 构造，写入 stage-result facts.review 键
./specs/archive/m8-build-code/tasks.md:353:  9. **事实包产出**：stage-result 写 facts.changed（数组）/ facts.tests（结构体）/ facts.review（结构体），落 durable task 路径
./specs/archive/m8-build-code/tasks.md:354:  10. **metrics 记录**：recordSkeleton 在 stage 开始，updateOwnResult 在结束，字段对齐 M4 record-schema
./specs/archive/m8-build-code/tasks.md:381:  node node_modules/.bin/vitest run tests/build-code-target.test.mjs tests/build-code-capture.test.mjs tests/build-code-diff-only.test.mjs tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false
./specs/archive/m8-build-code/tasks.md:401:grep -c "TDD\|diff-only\|3rd-review\|facts.review\|Worker-Mode\|worktree_root\|capture.mjs\|buildReviewFact\|recordSkeleton\|updateOwnResult" workflows/build-code/SKILL.md
./specs/archive/m8-build-code/tasks.md:405:node node_modules/.bin/vitest run tests/build-code-target.test.mjs tests/build-code-capture.test.mjs tests/build-code-diff-only.test.mjs tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false
./specs/archive/m8-build-code/plan.md:20:**现有骨架**：`workflows/build-code/SKILL.md`（73 行）定义了 RED→implement→GREEN 循环和 facts.changed/tests 键，是升级起点。
./specs/archive/m8-build-code/plan.md:32:| F2 窄契约 | YES | stage-result C1 最小字段契约，三键固定 |
./specs/archive/m8-build-code/plan.md:36:| F6 统一外置执行记录 | YES | metrics/collector.mjs 已有，stage-result 写入 durable |
./specs/archive/m8-build-code/plan.md:47:| S4 自定义技能有指标系统 | YES | metrics/collector.mjs recordSkeleton/updateOwnResult |
./specs/archive/m8-build-code/plan.md:60:- SKILL.md 升级：YES — 骨架无 TDD 外部强制/diff-only/3rd-review/facts.review 四大能力
./specs/archive/m8-build-code/plan.md:67:- stage-result 契约：已有 facts.changed/tests 键，只需扩展 facts.review 键（加不删）
./specs/archive/m8-build-code/plan.md:81:- facts.review 必须独立键，不混入 facts.tests（C1 契约，M9 消费边界）
./specs/archive/m8-build-code/plan.md:97:│       ├── SKILL.md                  # 【修改】从骨架升 v1：TDD红绿外部强制+capture调用+diff-only+3rd-review+facts.review
./specs/archive/m8-build-code/plan.md:100:│       └── facts-schema.mjs          # 【新建】C1 facts 三键契约校验 + buildReviewFact
./specs/archive/m8-build-code/plan.md:106:│   ├── build-code-facts.test.mjs     # 【新建】facts结构三键契约测试（FR-ACPT-001验收链）
./specs/archive/m8-build-code/plan.md:119:| 验收事实包（C1 facts.review） | SKILL.md + facts-schema.mjs + build-code-facts.test.mjs | 新增/扩展 |
./specs/archive/m8-build-code/plan.md:123:| stage-result 契约（M9 边界） | SKILL.md（facts 结构向后兼容扩展） | 扩展 |
./specs/archive/m8-build-code/plan.md:207:    "command": "node_modules/.bin/vitest run tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false",
./specs/archive/m8-build-code/plan.md:216:    "command": "node_modules/.bin/vitest run tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false",
./specs/archive/m8-build-code/plan.md:225:  "affectedTests": ["tests/build-code-facts.test.mjs", "tests/build-code-review.test.mjs"]
./specs/archive/m8-build-code/plan.md:272:| review.status=not_executed | 构造 3rd-review 不可用场景，测试 facts.review.status 字段值 |
./specs/archive/m8-build-code/plan.md:282:| build-code-facts.test.mjs | `vitest run tests/build-code-facts.test.mjs` |
./specs/archive/m8-build-code/plan.md:287:- `workflows/build-code/SKILL.md`：人工检查四大能力段（TDD/diff-only/3rd-review/facts.review）均存在
./specs/archive/m8-build-code/plan.md:293:## Data Model（facts 结构变更）
./specs/archive/m8-build-code/plan.md:322:**向后兼容**：已有消费方读 `facts.changed`/`facts.tests` 不受 `facts.review` 新增影响。`tests` 结构体是 M8→M9 的 C1 新契约，M9 按 C1 契约直接实现读取，无需 schema 转换或字段重映射（符合 FR-PKG-003：M9 侧不做格式适配）。骨架 v0 的旧字符串 `facts.tests` 在 workflowhub 无其他消费方，不保留旧字符串格式。
./specs/archive/m8-build-code/plan.md:334:5. **事实包三键**（FR-PKG-001/002/003）：stage-result 写 `facts.changed`/`facts.tests`/`facts.review` 三键，落 durable。
./specs/archive/m8-build-code/plan.md:335:6. **3rd-review standalone**（FR-REVIEW-001/002/003/004/005）：SKILL.md 描述 standalone 调用流程，消费 verdict 三态，facts.review 记两态 + source 标记。
./specs/archive/m8-build-code/plan.md:350:| schema（journal event / checkpoint / *.schema.json） | 不改 | facts 结构扩展通过 facts-schema.mjs 运行时校验，不触碰 stage-result schema 文件本身（仅 additive 字段扩展） | — |
./specs/archive/m8-build-code/plan.md:367:| `tests/build-code-facts.test.mjs` | 新建 | FR-PKG-001~003, FR-WT-001 |
./specs/archive/m8-build-code/plan.md:385:| FR-PKG-001 | stage-result facts 三键 |
./specs/archive/m8-build-code/plan.md:387:| FR-PKG-003 | facts 结构 M9 可直接读 |
./specs/archive/m8-build-code/plan.md:389:| FR-REVIEW-002 | facts.review.status 两态 |
./specs/archive/m8-build-code/plan.md:390:| FR-REVIEW-003 | facts.review.source 标记 |
./specs/archive/m9-verify-code/plan.md:14:**上游依赖**：M8 已交付（build-code v1 / facts-schema.mjs / metrics/collector.mjs 可用）；M7 已交付（make-decision skill 可用）
./specs/archive/m9-verify-code/plan.md:18:- metrics/collector.mjs — M4 已交付，直接调用 recordSkeleton / updateOwnResult
./specs/archive/m9-verify-code/plan.md:20:**现有骨架**：`workflows/verify-code/SKILL.md`（64 行）定义了 stage-result 结构和 metrics 种子字段，是升级起点。
./specs/archive/m9-verify-code/plan.md:30:| F1 薄核心 | YES | verify-code 本体只做调度，重活交给 capture.mjs / freshness.mjs / facts-assembly.mjs 脚本 |
./specs/archive/m9-verify-code/plan.md:31:| F2 窄契约 | YES | stage-result 七键契约最小固定，与 build-code 仅通过 facts.tests.command 单字段对接 |
./specs/archive/m9-verify-code/plan.md:35:| F6 统一外置执行记录 | YES | metrics/collector.mjs 已有，stage-result 写 durable |
./specs/archive/m9-verify-code/plan.md:46:| S4 自定义技能必须有指标系统 | YES | recordSkeleton + updateOwnResult，对齐 M4 10 字段 |
./specs/archive/m9-verify-code/plan.md:66:- `facts-assembly.mjs`：YES — FR-CMD-001/002/003 command 字段读取 + stage-result 组装；独立纯函数使 M9 自举测试中可直接 import
./specs/archive/m9-verify-code/plan.md:69:- build-code 侧 command 字段（C1）：YES — FR-CMD-003，verify-code 消费 facts.tests.command；M8 已交付但此字段缺失
./specs/archive/m9-verify-code/plan.md:75:- metrics/collector.mjs：已有（M4 交付），直接调用 recordSkeleton / updateOwnResult
./specs/archive/m9-verify-code/plan.md:77:- build-code facts-schema.mjs：已有（M8），C1 在此基础上加 command 字段（追加，不删）
./specs/archive/m9-verify-code/plan.md:78:- stage-result 契约：SKILL.md 骨架已定义七键结构，直接落实
./specs/archive/m9-verify-code/plan.md:84:- `facts-assembly.mjs` 消费 M8 的 `facts-schema.mjs` 导出的 `validateFacts`（入参校验），不重复实现。
./specs/archive/m9-verify-code/plan.md:92:**阶梯结论**：最小切口 = 3 个 .mjs 脚本（capture/freshness/facts-assembly）+ SKILL.md 升级 + isolated-browser-qa 一份文件 copy + C1 build-code 侧 command 字段 + CI 冒烟配置 + reuse-registry 更新。STOP。
./specs/archive/m9-verify-code/plan.md:117:│   │   ├── facts-assembly.mjs              # 【新建】stage-result 组装：读事实包 command 字段（缺失报错）、组装七键 stage-result、路径对齐 D-M9-6
./specs/archive/m9-verify-code/plan.md:120:│       ├── facts-schema.mjs                # 【修改】C1：facts.tests 新增 command 字段（追加，不破坏已有三键）
./specs/archive/m9-verify-code/plan.md:121:│       └── SKILL.md                        # 【修改】C1：声明 build-code 产出的 facts.tests 必须包含 command 字段
./specs/archive/m9-verify-code/plan.md:125:│   └── verify-code-facts.test.mjs          # 【新建】facts-assembly.mjs 单元测试：command 读取/缺失报错/stage-result 结构七键/evidence_ref 路径
./specs/archive/m9-verify-code/plan.md:127:└── .github/workflows/ci.yml                # 【修改】CI 新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查（检查 make-decision 产物 → build-code stage-result + command 字段 → verify-code stage-result 路径，覆盖完整三段产物链）
./specs/archive/m9-verify-code/plan.md:137:| `workflows/verify-code/facts-assembly.mjs` | 新建 | 纯函数：`readCommand(buildResult)` 读 command 字段（接收已解析 JSON 对象，缺失抛明确错误）；`assembleStageResult(opts)` 组装七键 stage-result；`writeStageResult(path, result)` 写 durable |
./specs/archive/m9-verify-code/plan.md:139:| `workflows/build-code/facts-schema.mjs` | 修改 | C1：`validateFacts` 对 `facts.tests.command` 字段做**可选校验**——字段存在时校验类型为 string，字段缺失时仍合法（向后兼容 M8 旧产物，不把旧 facts 判非法）；`buildTestsFact` 新增可选 command 参数 |
./specs/archive/m9-verify-code/plan.md:140:| `workflows/build-code/SKILL.md` | 修改 | C1：声明 build-code 产出的 `facts.tests` 必须包含 `command` 字段；使 build-code skill 与 facts-schema.mjs 的可选校验契约对齐，确保新产物实际写出 command（FR-CMD-003，C1） |
./specs/archive/m9-verify-code/plan.md:143:| `tests/verify-code-facts.test.mjs` | 新建 | facts-assembly.mjs 单测：command 缺失报错/七键结构/evidence_ref 相对路径 |
./specs/archive/m9-verify-code/plan.md:145:| `.github/workflows/ci.yml` | 修改 | 新增两步：① verify-code 冒烟（`vitest run tests/verify-code-*.test.mjs --passWithNoTests=false`）；② 轻量三段闭环检查（检查 make-decision 产物存在可读 → 验证 build-code stage-result-build-code.json 可读且 facts.tests.command 存在 → 验证 verify-code stage-result 落盘路径结构，覆盖完整三段 make-decision → build-code → verify-code，不引入重型 E2E 框架） |
./specs/archive/m9-verify-code/plan.md:155:| stage-result 落盘路径 | SKILL.md + facts-assembly.mjs | 新增 |
./specs/archive/m9-verify-code/plan.md:157:| build-code facts.tests.command（C1） | workflows/build-code/facts-schema.mjs + workflows/build-code/SKILL.md | 扩展 |
./specs/archive/m9-verify-code/plan.md:218:    "command": "node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false",
./specs/archive/m9-verify-code/plan.md:227:    "command": "node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false",
./specs/archive/m9-verify-code/plan.md:236:  "affectedTests": ["tests/verify-code-facts.test.mjs"]
./specs/archive/m9-verify-code/plan.md:243:    "command": "node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false",
./specs/archive/m9-verify-code/plan.md:252:    "command": "node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false",
./specs/archive/m9-verify-code/plan.md:264:    "tests/verify-code-facts.test.mjs"
./specs/archive/m9-verify-code/plan.md:280:| C1 facts-schema 单测 | `node_modules/.bin/vitest run tests/build-code-facts.test.mjs --passWithNoTests=false` | exit 0（command 字段新增后仍绿）|
./specs/archive/m9-verify-code/plan.md:297:## Data Model（stage-result 结构）
./specs/archive/m9-verify-code/plan.md:299:**verify-code stage-result 七键契约**（FR-PATH-001，spec §6）：
./specs/archive/m9-verify-code/plan.md:306:  "facts": {
./specs/archive/m9-verify-code/plan.md:317:**向后兼容**：M10 可在 facts 下追加新键，不破坏现有字段语义（spec §8）。
./specs/archive/m9-verify-code/plan.md:323:1. **build-code facts.tests.command（C1）**（FR-CMD-003）：`workflows/build-code/facts-schema.mjs` 的 `validateFacts` 对 `facts.tests.command` 做**可选字段校验**——present 时校验类型为 string，absent 时仍合法（不把历史 M8 旧 facts 判为 invalid，满足 C1 向后兼容要求）。`buildTestsFact` 新增可选 command 参数，新产物写入该字段。verify-code 侧读到旧包缺 command 时 status="failure" 并给明确错误（这是 verify-code 的消费行为，不是 schema 非法）。已有消费方读 `red_exit_code`/`green_baseline_hash` 等字段不受影响（追加语义）。**同步改动**：`workflows/build-code/SKILL.md` 需声明 build-code 产出的 `facts.tests` 必须包含 `command` 字段，确保 skill 行为与 schema 契约一致，让 verify-code 输入可靠（C1 + FR-CMD-003 要求同步两件）。
./specs/archive/m9-verify-code/plan.md:324:2. **metrics collector**（FR-METRICS-001~004）：直接调用 M4 的 `metrics/collector.mjs`，recordSkeleton 在 stage 开始，updateOwnResult 在结束，双写 task-level + global（FR-COLLECT-006/007）。写失败 warn 不 throw（FR-GUARD-001）。
./specs/archive/m9-verify-code/plan.md:336:| schema | 运行时 facts schema 改，项目级/平台级 schema 不改 | `workflows/build-code/facts-schema.mjs` 新增 command 可选字段校验（C1）；`workflows/build-code/SKILL.md` 声明产出必须包含 command 字段（C1）；项目级 CLAUDE.md / 平台 schema 文件不改 | Task 3.3 + Task 3.5 |
./specs/archive/m9-verify-code/plan.md:354:| FR-CMD-001 | facts-assembly.mjs readCommand；SKILL.md 读 facts.tests.command |
./specs/archive/m9-verify-code/plan.md:355:| FR-CMD-002 | facts-assembly.mjs readCommand 缺失抛错；verify-code-facts.test.mjs |
./specs/archive/m9-verify-code/plan.md:356:| FR-CMD-003 | workflows/build-code/facts-schema.mjs C1 追加 command 可选字段；workflows/build-code/SKILL.md 声明产出必须包含 command（C1 同步两件） |
./specs/archive/m9-verify-code/plan.md:358:| FR-BROWSER-002 | SKILL.md SKIP 分支；facts-assembly.mjs missing_items 写入 |
./specs/archive/m9-verify-code/plan.md:361:| FR-CLOSE-002 | SKILL.md user_decision 记录；facts-assembly.mjs assembleStageResult |
./specs/archive/m9-verify-code/plan.md:363:| FR-PATH-001 | facts-assembly.mjs writeStageResult 落 specs/{task-id}/stage-result-verify-code.json |
./specs/archive/m9-verify-code/plan.md:365:| FR-PATH-003 | facts-assembly.mjs evidence_ref 相对 specs/{task-id}/ 根 |
./specs/archive/m9-verify-code/plan.md:366:| FR-METRICS-001 | SKILL.md recordSkeleton 在 stage 开始 |
./specs/archive/m9-verify-code/plan.md:367:| FR-METRICS-002 | SKILL.md updateOwnResult 在 stage 结束 |
./specs/archive/m9-verify-code/plan.md:369:| FR-METRICS-004 | verify-code-facts.test.mjs 10 字段结构性检查 |
./specs/archive/m9-verify-code/plan.md:370:| FR-TEST-001 | verify-code-capture/freshness/facts 三个 .test.mjs 文件 |
./specs/archive/m9-verify-code/plan.md:372:| FR-TEST-003 | .github/workflows/ci.yml 新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查脚本（scripts/ci-chain-check.mjs：检查 make-decision 产物存在可读 → build-code stage-result-build-code.json 可读且 facts.tests.command 存在 → verify-code stage-result 落盘路径结构，覆盖完整三段 make-decision → build-code → verify-code 产物链，不引入重型 E2E 框架，满足验收标准 5 + D-M9-7/F10） |
./specs/archive/m7-intake-v1/plan.md:4:需求权威源：tasks/m7-intake-v1/artifacts/decision-log.md（D-M7-1 至 D-M7-13）。
./specs/archive/m7-intake-v1/plan.md:10:**场景一（主路）**：工头跑 `/make-decision`，make-decision 内部按提示词步骤执行 scope-triage（分流范围）→ decision-log（收敛产出决策记录）→ 产出 stage-result（facts 含 decision/scope/decision_log_path 三个 key）。M8 build-code 后续读 `facts.decision_log_path` 获取完整决策记录。
./specs/archive/m7-intake-v1/plan.md:18:M6 已建五段薄骨架（make-decision 是其中一段，纯提示词，facts 含 decision/scope）。M7 在此基础上三步扩展：
./specs/archive/m7-intake-v1/plan.md:21:2. 升级 make-decision SKILL.md：内联两组件逻辑摘要 + 显式路径引用 + facts 扩展 decision_log_path。
./specs/archive/m7-intake-v1/plan.md:32:| facts 扩展 decision_log_path | ③现有 stage-result 契约 additive 扩展即可 | 不新建 schema，改 facts-subschema.json |
./specs/archive/m7-intake-v1/plan.md:44:- **make-decision SKILL.md**（升级）：内联两组件逻辑摘要，显式路径引用，facts 扩展 decision_log_path，升级 collector 记录。
./specs/archive/m7-intake-v1/plan.md:46:- **CI 冒烟扩展**（修改 tests/five-skills-present.test.mjs）：five→seven-skills 字面量断言 + registry 行格式断言 + stage-result 契约形状断言 + metric-scan 三 skill 扩展。
./specs/archive/m7-intake-v1/plan.md:58:- `workflows/make-decision/SKILL.md` — 升级提示词内容 + facts 扩展
./specs/archive/m7-intake-v1/plan.md:59:- `contracts/facts-subschema.json` — make-decision 段 required_keys 加 `decision_log_path`
./specs/archive/m7-intake-v1/plan.md:63:- `roadmap.md`（路径：`/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md`，在 program artifacts 树（Knowledge），不在 workflowhub 仓）— 命名全局对齐（intake→make-decision 等，仅文档，约 26 处）
./specs/archive/m7-intake-v1/plan.md:72:- make-decision facts 新增 `decision_log_path` key：additive 扩展，不破坏现有消费方（下游 build-code 读不到该 key 则静默跳过，兼容性见 spec 第 8 章）。
./specs/archive/m7-intake-v1/plan.md:80:| FR-INTK-002 | Phase 3 T009（tests）+ T010（facts-subschema 扩展）+ T011（SKILL.md facts 示例） |
./specs/archive/m7-intake-v1/plan.md:100:M7 改了 workflow prompts（SKILL.md）、schema（facts-subschema.json）、automation（check-stage-quality.mjs）、knowledge/doc，以下采用 plan-reviewer-contract 规定的固定 7 分类逐类判断：
./specs/archive/m7-intake-v1/plan.md:105:| workflow 定义（stage prompts / *.workflow.ts / SKILL.md） | **改** | 新增 scope-triage/decision-log SKILL.md；升级 make-decision SKILL.md（内联组件引用 + facts 扩展） | T002、T006、T011 |
./specs/archive/m7-intake-v1/plan.md:107:| schema（journal event / checkpoint / *.schema.json / facts-subschema.json） | **改** | facts-subschema.json 的 make-decision required_keys 加 decision_log_path | T010 |
./specs/archive/m7-intake-v1/plan.md:133:- **Phase 3**（make-decision 升级 + facts 扩展）：`npx vitest run tests/facts-subschema.test.mjs` — make-decision facts 含 decision_log_path 反例红/正例绿。
./specs/archive/m7-intake-v1/plan.md:145:    "command": "npx vitest run tests/facts-subschema.test.mjs --reporter=verbose",
./specs/archive/m7-intake-v1/plan.md:154:    "command": "npx vitest run tests/facts-subschema.test.mjs --reporter=verbose",
./specs/archive/m7-intake-v1/plan.md:164:    "tests/facts-subschema.test.mjs"
./specs/archive/m7-intake-v1/plan.md:204:- 修改 contracts/facts-subschema.json：additive 扩展（make-decision required_keys 加一项），不改已有项，低风险。
./specs/archive/m7-intake-v1/plan.md:213:| F4（无运行时阻断 gate） | YES | CI 冒烟只压契约管道（静态断言），不执行 skill 本身，无 runtime blocking 入口；collector 与 stage-result 双独立机制（D-M7-4a），互不阻断 |
./specs/archive/m7-intake-v1/plan.md:215:| F9（可证伪） | YES | 七 skill 字面量独立断言（删任一目录精确一红）；facts-subschema 反例（缺 decision_log_path 即红）；metric-scan 负例（漏 collector.mjs 路径退出非 0） |
./specs/archive/m7-intake-v1/plan.md:225:| SIG-001 | contracts/stage-result.contract.json | 顶层 required: status/error_code/retryable/facts/missing_items/user_decision/reason；facts 开放 object |
./specs/archive/m7-intake-v1/plan.md:226:| SIG-002 | contracts/facts-subschema.json | make-decision required_keys: [decision, scope]；本期扩展加 decision_log_path |
./specs/archive/m7-intake-v1/plan.md:229:| SIG-005 | metrics/collector.mjs | recordSkeleton / updateOwnResult API，stage 字段用自身 skill 名 |
./specs/archive/m7-intake-v1/tasks.md:13:新建 `workflows/scope-triage/SKILL.md`，定性为 make-decision 的组件 skill，合法 frontmatter（name=scope-triage/description 非空），纯提示词（无执行代码、不产 stage-result），接 collector 指标（stage=`scope-triage`），在 registry 注册一条。完成定义：运行 `npx vitest run tests/five-skills-present.test.mjs` 中 scope-triage 相关新断言绿。
./specs/archive/m7-intake-v1/tasks.md:23:- [x] T002 新建 `workflows/scope-triage/SKILL.md`：合法 frontmatter（name: scope-triage），纯提示词正文含——①定性为组件 skill 的说明（物理独立、可被工头/子代理独立调起）；②改造适配类引入声明（来源路径写文件头，接 workflowhub stage-result 契约 + 指标，非纯抄）；③输入为需求文本/上游内容，输出为范围判定结果（in-scope/out-of-scope 分流）；④明确说明不单独产 stage-result；⑤要求调 collector.mjs 写一条独立指标记录，stage 字段填 `scope-triage`（不填 make-decision），含 recordSkeleton / updateOwnResult M4 核心字段。[FR-SCOPE-001][FR-SCOPE-002][FR-SCOPE-003][FR-METRIC-001][FR-METRIC-002]
./specs/archive/m7-intake-v1/tasks.md:41:T001 RED 未见红 → 停（测试断言没写对）。scope-triage SKILL.md 含执行代码或产 stage-result 要求 → 停（违 FR-SCOPE-002）。collector stage 字段非 `scope-triage` → 停（违 FR-METRIC-002）。
./specs/archive/m7-intake-v1/tasks.md:51:新建 `workflows/decision-log/SKILL.md`，定性为 make-decision 的组件 skill，合法 frontmatter（name=decision-log），纯提示词（无执行代码、不单独产 stage-result），产物落 `tasks/<任务>/decision-log.md`（7 节结构、至少一条含来源证据的决策），接 collector 指标（stage=`decision-log`），registry 注册一条。完成定义：运行 `npx vitest run tests/five-skills-present.test.mjs` 中 decision-log 相关新断言绿。
./specs/archive/m7-intake-v1/tasks.md:62:- [x] T006 新建 `workflows/decision-log/SKILL.md`：合法 frontmatter（name: decision-log），纯提示词正文含——①定性为组件 skill 的说明（物理独立、可独立调起）；②改造适配类引入声明（来源路径文件头，接契约 + 指标，非纯抄）；③输入为需求文本/已有输入，输出为收敛后的决策内容；④明确说明产物落 `tasks/<任务>/decision-log.md`，含必要 7 节结构（原始需求/问题与目标/决策记录/假设/明确不做/开放问题/验收标准），至少一条决策记录含非空来源证据；⑤明确说明不单独产 stage-result；⑥引入清洁声明：产物不含 agenthub 专属元素（intake 阶段第 N 步等）；⑦要求调 collector.mjs 写一条独立指标记录，stage 字段填 `decision-log`（不填 make-decision），含 recordSkeleton / updateOwnResult M4 核心字段。[FR-DLOG-001][FR-DLOG-002][FR-DLOG-003][FR-DLOG-004][FR-METRIC-001][FR-METRIC-002]
./specs/archive/m7-intake-v1/tasks.md:84:## Phase 3: make-decision 升级 + facts-subschema 扩展
./specs/archive/m7-intake-v1/tasks.md:90:升级 `workflows/make-decision/SKILL.md`：内联 scope-triage/decision-log 逻辑摘要，文本中可 grep 到两个路径字符串（`workflows/scope-triage/SKILL.md` 和 `workflows/decision-log/SKILL.md`），stage-result facts 扩展 `decision_log_path` key；同步更新 `contracts/facts-subschema.json` 的 make-decision required_keys 加 decision_log_path。完成定义：`npx vitest run tests/facts-subschema.test.mjs` 中 make-decision facts 含 decision_log_path 的反例红 / 正例绿。
./specs/archive/m7-intake-v1/tasks.md:95:- 修改 `contracts/facts-subschema.json`（make-decision required_keys 加 decision_log_path）
./specs/archive/m7-intake-v1/tasks.md:96:- 修改 `tests/facts-subschema.test.mjs`（加 decision_log_path 反例 + 正例断言）
./specs/archive/m7-intake-v1/tasks.md:100:- [x] T009 写 tests/facts-subschema.test.mjs 中 decision_log_path 相关新断言：反例（facts 缺 decision_log_path → 应失败）+ 正例（facts 含 decision/scope/decision_log_path 三 key 非空 → 应过）。跑 `npx vitest run tests/facts-subschema.test.mjs` 应 RED（schema 未更新），存 apply/evidence/phase-3-RED.json。[FR-INTK-002][FR-CI-001]
./specs/archive/m7-intake-v1/tasks.md:101:- [x] T010 更新 `contracts/facts-subschema.json`：make-decision 段的 required_keys 从 `[decision, scope]` 扩为 `[decision, scope, decision_log_path]`，semantics 补 decision_log_path 说明（值形如 tasks/<任务>/decision-log.md，供下游 M8 消费）。[FR-INTK-002]
./specs/archive/m7-intake-v1/tasks.md:102:- [x] T011 升级 `workflows/make-decision/SKILL.md`：在提示词正文中——①内联 scope-triage 逻辑摘要（执行步骤：分流范围，判定 in-scope/out-of-scope）；②内联 decision-log 逻辑摘要（执行步骤：收敛产出 decision-log 文件，7 节结构）；③显式写出路径引用字符串 `workflows/scope-triage/SKILL.md` 和 `workflows/decision-log/SKILL.md`（可 grep）；④stage-result facts 示例扩展加 decision_log_path key（值示例 tasks/<任务>/decision-log.md）；⑤保留原有 collector 指标记录要求（recordSkeleton/updateOwnResult）；⑥无执行代码、无 runtime 入口。跑 GREEN：`npx vitest run tests/facts-subschema.test.mjs` 应 0，存 apply/evidence/phase-3-GREEN.json。[FR-INTK-001][FR-INTK-002][FR-INTK-003][FR-METRIC-001]
./specs/archive/m7-intake-v1/tasks.md:103:- [x] T012 维护知识文件：写 apply/phase-3.md（make-decision 升级要点 + 路径引用位置 + facts-subschema 改动 + evidence 路径），同步 workflow-issues.jsonl + state.json。
./specs/archive/m7-intake-v1/tasks.md:107:- **验证目标**：make-decision facts 含 decision_log_path 防空 object 假绿（FR-INTK-002）+ 路径引用可 grep（FR-INTK-001）
./specs/archive/m7-intake-v1/tasks.md:108:- **gate_cmd**：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/facts-subschema.test.mjs --reporter=verbose`
./specs/archive/m7-intake-v1/tasks.md:115:apply/phase-3.md 记 make-decision 升级后的路径引用位置 + facts-subschema make-decision 段前后对比。
./specs/archive/m7-intake-v1/tasks.md:119:反例 facts 缺 decision_log_path 不判失败 → 停（假绿，违 FR-INTK-002）。make-decision SKILL.md 内找不到两个路径字符串 → 停（违 FR-INTK-001）。文件含执行代码 → 停（违 FR-INTK-003）。
./specs/archive/m7-intake-v1/tasks.md:139:- [x] T013 改 `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md`（roadmap.md 在 program artifacts 树（Knowledge），不在 workflowhub 仓）：全局搜索 intake/design/plan/apply/test-acceptance 等原名，逐处替换为 make-decision/build-spec/build-plan/build-code/verify-code（M7 roadmap 段 + M8-M13 段引用 + X4 等），约 26 处；不改 workflowhub 代码侧任何 intake 字面量（D-M7-9-clarify）。[FR-CI-003]（隐性必达 6）
./specs/archive/m7-intake-v1/tasks.md:140:- [x] T014 改 `CONTEXT.md`：追加「组件 skill（Component Skill）」概念定义段（不改已有内容，追加末尾）。内容含——①定义：组件 skill 是从属于某一顶层 skill 的可独立调起子流程；②约束：不单独产 stage-result（stage-result 一段一张由顶层 stage 产），只产 collector 指标记录；③引用关系：由顶层 skill 提示词正文显式写路径字符串声明；④合宪依据：S7 约束 stage 级 skill，stage 内可复用组件不与 S7 冲突（D-M7-2）。[FR-SCOPE-001][FR-DLOG-001]（已决 2）
./specs/archive/m7-intake-v1/tasks.md:147:- **gate_cmd**：`set -euo pipefail; test -f /Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md || (echo "ERROR: roadmap.md not found" && exit 1); grep -q "make-decision" /Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md || (echo "ERROR: roadmap.md has no make-decision occurrences" && exit 1); test -f /Users/Hugh/Hugh/Project/workflowhub/reuse-registry.md || (echo "ERROR: reuse-registry.md not found" && exit 1); INTAKE_HITS=$(grep -r "intake" /Users/Hugh/Hugh/Project/workflowhub/workflows/ /Users/Hugh/Hugh/Project/workflowhub/contracts/ /Users/Hugh/Hugh/Project/workflowhub/config/ 2>/dev/null | grep -v "_spike" | grep -v "binary" | grep -v ".json:" || true); test -z "$INTAKE_HITS" || (echo "ERROR: forbidden code-level intake literals found: $INTAKE_HITS" && exit 1); echo "Phase 4 gate: all checks passed"`
./specs/archive/m7-intake-v1/tasks.md:172:- 修改 `tests/five-skills-present.test.mjs`（加 scope-triage/decision-log 字面量断言 + registry 行格式断言 + stage-result 契约形状 decision_log_path 断言）
./specs/archive/m7-intake-v1/tasks.md:178:- [x] T017 改 tests/five-skills-present.test.mjs 两处：①存在性检查段（当前第 33-39 行为 for-of SKILL_DIRS 遍历，弱可证伪，删一目录循环跟着缩不红）——展开成 7 个独立字面量 test()，skill 名逐个硬编码（make-decision/build-spec/build-plan/build-code/verify-code/scope-triage/decision-log），禁 for-of，删任一目录则精确一个 test 红；②registry 检查段（当前第 79-112 行已是逐字面量独立 test()，仅含原 5 个 skill）——扩到 7 个字面量，覆盖 scope-triage/decision-log；另加 registry 行格式断言（逐行校验：含类别枚举值三选一 + 来源路径非空）+ stage-result 契约形状断言（make-decision facts 含 decision/scope/decision_log_path 三 key 非空，用 facts-subschema.json 校验）；③新增 AC5 机器覆盖断言——读取 `workflows/make-decision/SKILL.md` 内容，独立 test() 断言含字符串 `workflows/scope-triage/SKILL.md`，再一个独立 test() 断言含字符串 `workflows/decision-log/SKILL.md`，缺任一则该 test 红（两断言禁合并成一个 test，须各自独立，保证删任一引用路径精确一红）。跑 `npx vitest run tests/five-skills-present.test.mjs` 应 RED（改动前缺 scope-triage/decision-log/registry），存 apply/evidence/phase-5-RED.json。[FR-CI-001][FR-CI-002][FR-CI-003][FR-REG-002][AC5]
./specs/archive/m7-intake-v1/tasks.md:179:- [x] T018 改 `tests/metric-scan.test.mjs`：在正例测试套件中加 scope-triage 和 decision-log 两个 SKILL.md 的正例覆盖断言（两文件含 recordSkeleton + updateOwnResult + metrics/collector.mjs → scanSkillMetrics 返回 found:false），以及扫描器处理三 skill 后全量退出 0 的集成测试。[FR-METRIC-003][FR-METRIC-001]
./specs/archive/m7-intake-v1/tasks.md:180:- [x] T019 增强 `scripts/check-stage-quality.mjs` 的 `scanSkillMetrics` 函数：在已有 token 名检查（recordSkeleton/updateOwnResult）基础上，新增两项检查——①用字符串匹配扫描 SKILL.md 文件内容是否含 `collector.mjs`（组件 skill 必须显式引用路径，不能只写 token 名，缺该字符串则 scanSkillMetrics 返回 found:false）；②stage 字段是正确的字面量（scope-triage 文件里 stage 字段值为 `scope-triage`，decision-log 文件里为 `decision-log`，不能是 `make-decision`）。对应测试 `tests/metric-scan.test.mjs`（T018）须加以下两项可证伪负例断言，每个负例提交前须手工改坏确认真红才算过：a) 构造含 recordSkeleton/updateOwnResult 但无 `collector.mjs` 字符串的 SKILL 内容（即删掉 collector.mjs 引用行） → scanSkillMetrics 应返回 found:false，且扫描器对该 SKILL 退出非 0（负例可证伪：不删该行测试无法红）；b) 构造含正确 `collector.mjs` 路径引用但 stage 字面量错误（如 `stage: 'make-decision'`）的 scope-triage SKILL → scanSkillMetrics 应返回 found:false（负例可证伪：stage 字面量改正确后测试变绿）。跑 GREEN：`npx vitest run tests/five-skills-present.test.mjs tests/metric-scan.test.mjs` 应 0，存 apply/evidence/phase-5-GREEN.json。[FR-METRIC-003][FR-METRIC-002]
./specs/archive/m7-intake-v1/tasks.md:183:  - **AC1（decision-log 产出契约）** [FR-INTK-002 spec AC1]：**M7 验收**：make-decision SKILL.md 正确指令产出 `tasks/<任务>/decision-log.md`——产物契约由 decision-log 组件 skill 定义（7 节：原始需求/问题与目标/决策记录/假设/明确不做/开放问题/验收标准 + 至少一条含非空来源证据的决策），且 stage-result facts 含非空 `decision_log_path`（facts-subschema required_keys 守护，可 grep 核实 FR-INTK-001）。pass(M7): SKILL.md 契约含 7 节指令 + facts 含 decision_log_path 非空 + decision-log 组件契约对齐。fail(M7): 契约缺节 / facts 漏 decision_log_path / 为空占位。**M8+ oracle（deferred）**：实跑 /make-decision 产真实 decision-log.md 文件按 7 节核对，依赖 M8+ 集成入口。
./specs/archive/m7-intake-v1/tasks.md:184:  - **AC3（collector 记录数契约 ≥ 涉及 skill 数）** [spec AC3]：**M7 验收**：make-decision / scope-triage / decision-log 三 SKILL.md 各被指令写一条独立 collector 记录（metric wiring 完整：recordSkeleton + updateOwnResult + collector.mjs 引用 + stage 字面量正确），故记录数契约 ≥ 实际调起数（≤3）。pass(M7): 三 skill metric wiring 均完整（scanSkillMetrics + metric-scan 测试绿）。fail(M7): 任一 wiring 不全。**M8+ oracle（deferred）**：实跑一次产真实 collector 记录、按记录数核对，依赖 M8+ 入口。
./specs/archive/m7-intake-v1/tasks.md:185:  - **AC5（组件 stage 字面量 + execution_id 契约）** [FR-INTK-002 spec AC5]：**M7 验收**：scope-triage / decision-log 两组件 SKILL.md 各被指令写 stage 字面量分别为 `scope-triage` / `decision-log` 的独立 collector 记录（独立 execution_id 由各 skill 指令保证，stage 字面量由 scanner 可证伪守护——破坏即 RED），且 make-decision facts 的 decision_log_path 与 AC1 产物契约路径一致。pass(M7): 两组件 stage 字面量正确 + wiring 完整 + decision_log_path 路径形态对齐。fail(M7): stage 字面量错 / wiring 不全 / 路径不对齐。**M8+ oracle（deferred）**：实跑后两条 collector 记录各有独立 execution_id，依赖 M8+ 入口。
./specs/archive/m7-intake-v1/tasks.md:211:- Phase 3 → Phase 5（facts-subschema 扩展后 Phase 5 的契约形状断言才能绿）
./specs/archive/m7-intake-v1/tasks.md:217:MVP = Phase 1 + Phase 2（两组件 skill 可发现）。Phase 3 补 make-decision 升级和 facts 扩展。Phase 4 补文档。Phase 5 补 CI 扩展和全量验证。每 phase 独立可测（各有 RED→GREEN）。
./specs/archive/m9-verify-code/FR-TEST-002-evidence.md:7:**验收证据**：M9 自举完成后，verify-code 产出的 `specs/{task-id}/stage-result-verify-code.json` 即为端到端实跑证据。
./specs/archive/m9-verify-code/tasks.md:14:> 关键脚本：capture.mjs / freshness.mjs / facts-assembly.mjs（均在 workflows/verify-code/）
./specs/archive/m9-verify-code/tasks.md:161:## Phase 3：facts-assembly.mjs stage-result 组装（FR-CMD-001/002, FR-PATH-001/002/003, FR-METRICS-004）
./specs/archive/m9-verify-code/tasks.md:167:新建 `workflows/verify-code/facts-assembly.mjs`，实现：从事实包读取 command 字段（缺失时浮现明确错误，不静默）、组装七键 stage-result 结构、evidence_ref 路径对齐 D-M9-6、写 durable JSON。同时补 C1 build-code 侧 command 字段。
./specs/archive/m9-verify-code/tasks.md:171:- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs` — 新建
./specs/archive/m9-verify-code/tasks.md:172:- `/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-facts.test.mjs` — 新建
./specs/archive/m9-verify-code/tasks.md:173:- `/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/facts-schema.mjs` — 修改（C1：追加 command 字段）
./specs/archive/m9-verify-code/tasks.md:177:**Task 3.1 — 写 facts-assembly 测试（RED）** [FR-CMD-001, FR-CMD-002, FR-PATH-001, FR-PATH-002, FR-PATH-003, FR-METRICS-004, FR-TEST-001]
./specs/archive/m9-verify-code/tasks.md:179:- 入参：无（facts-assembly.mjs 不存在）
./specs/archive/m9-verify-code/tasks.md:180:- 出参：`tests/verify-code-facts.test.mjs`，测试以下行为：
./specs/archive/m9-verify-code/tasks.md:181:  1. `readCommand(buildResult)` — 读 `facts.tests.command`（接收已解析的 JSON 对象），合法时返回 string
./specs/archive/m9-verify-code/tasks.md:182:  2. `facts.tests.command` 缺失时抛错，error message 包含 "command" 字样（FR-CMD-002，可证伪：删掉抛错逻辑后测试变红）
./specs/archive/m9-verify-code/tasks.md:183:  3. `facts.tests` 字段整体不存在时抛错，retryable=true 语义在 error.retryable 字段
./specs/archive/m9-verify-code/tasks.md:184:  4. `assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable })` — 返回七键 stage-result 对象，所有键均存在
./specs/archive/m9-verify-code/tasks.md:188:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-facts.test.mjs`
./specs/archive/m9-verify-code/tasks.md:190:**Task 3.2 — 实现 facts-assembly.mjs（GREEN）** [FR-CMD-001, FR-CMD-002, FR-PATH-001, FR-PATH-002, FR-PATH-003]
./specs/archive/m9-verify-code/tasks.md:193:- 出参：`workflows/verify-code/facts-assembly.mjs`
./specs/archive/m9-verify-code/tasks.md:198:  - 导出 `export function writeStageResult(taskSpecDir, result)` — 写 `${taskSpecDir}/stage-result-verify-code.json`
./specs/archive/m9-verify-code/tasks.md:201:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs`
./specs/archive/m9-verify-code/tasks.md:203:**Task 3.3 — C1 build-code facts-schema.mjs 追加 command 可选字段** [FR-CMD-003]
./specs/archive/m9-verify-code/tasks.md:205:- 入参：facts-assembly.mjs GREEN 后
./specs/archive/m9-verify-code/tasks.md:206:- 出参：`workflows/build-code/facts-schema.mjs` 的 `validateFacts` 对 `facts.tests.command` 新增**可选字段校验**——字段 present 时校验类型为 string，字段 absent 时仍合法（不把历史 M8 旧 facts 判为 invalid，满足 C1 向后兼容要求）；如有 `buildTestsFact` 工厂函数，新增可选 command 参数
./specs/archive/m9-verify-code/tasks.md:207:- 约束：追加语义，不删除/重命名已有字段；旧 M8 facts（无 command 字段）经 validateFacts 必须仍为 valid（回归不红）；verify-code 消费侧读到缺 command 时 status="failure" 是 verify-code 的行为，与 schema 校验无关
./specs/archive/m9-verify-code/tasks.md:208:- 验证：`node node_modules/.bin/vitest run tests/build-code-facts.test.mjs --passWithNoTests=false` 仍 exit=0（回归不红）；须加一条测试用例：构造无 command 字段的旧 facts，验证 validateFacts 返回 valid（可证伪：改成必填后该测试变红）
./specs/archive/m9-verify-code/tasks.md:209:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/facts-schema.mjs`
./specs/archive/m9-verify-code/tasks.md:219:- 入参：Task 3.3 完成（facts-schema.mjs 已追加 command 可选字段）
./specs/archive/m9-verify-code/tasks.md:220:- 出参：`workflows/build-code/SKILL.md` 补充说明——在 build-code 产出的 `facts.tests` 中必须包含 `command` 字段，使 skill 行为与 schema 契约对齐，确保 verify-code 消费侧能读到该字段
./specs/archive/m9-verify-code/tasks.md:221:- 改动范围：在 SKILL.md 的 facts.tests 产物描述段落（或类似"输出产物/stage-result 结构"段落）中，明确写出 `command` 字段及其含义（所执行的测试命令字符串）
./specs/archive/m9-verify-code/tasks.md:222:- 约束：仅在 facts.tests 产物描述段新增说明，不删/改已有字段语义；不改其他 skill 逻辑
./specs/archive/m9-verify-code/tasks.md:233:# RED（facts-assembly 测试，预期 exit≠0）
./specs/archive/m9-verify-code/tasks.md:235:node node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false
./specs/archive/m9-verify-code/tasks.md:238:node node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false
./specs/archive/m9-verify-code/tasks.md:240:# C1 回归（build-code-facts 仍绿）
./specs/archive/m9-verify-code/tasks.md:241:node node_modules/.bin/vitest run tests/build-code-facts.test.mjs --passWithNoTests=false
./specs/archive/m9-verify-code/tasks.md:247:- writeStageResult 写 `specs/{task-id}/stage-result-verify-code.json`，task-id 由调用方传入（不硬编码）
./specs/archive/m9-verify-code/tasks.md:253:Phase 3 完成条件：`tests/verify-code-facts.test.mjs` exit=0；`tests/build-code-facts.test.mjs` exit=0（C1 回归不红）；command 缺失测试可证伪（删掉抛错逻辑后变红）。
./specs/archive/m9-verify-code/tasks.md:275:- 入参：Phase 1~3 交付物（capture.mjs / freshness.mjs / facts-assembly.mjs 已存在）
./specs/archive/m9-verify-code/tasks.md:277:  1. **前置读取**：读 `specs/{task-id}/stage-result-build-code.json`，提取 facts.tests.command（command 缺失时浮现错误并终止）
./specs/archive/m9-verify-code/tasks.md:278:  2. **metrics 开始**：stage 启动时调用 `metrics/collector.mjs` recordSkeleton，传入含全部 10 个核心字段的 seed
./specs/archive/m9-verify-code/tasks.md:284:  8. **stage-result 落盘**：调用 facts-assembly.mjs assembleStageResult + writeStageResult，落 `specs/{task-id}/stage-result-verify-code.json`（FR-PATH-001）；final-test-report.md 落 `specs/{task-id}/test/`（FR-PATH-002）
./specs/archive/m9-verify-code/tasks.md:285:  9. **metrics 结束**：调用 updateOwnResult，metrics 写失败只 warn 不 throw（FR-METRICS-002，F3）
./specs/archive/m9-verify-code/tasks.md:314:  node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false
./specs/archive/m9-verify-code/tasks.md:318:  grep -c "capture.mjs\|freshness\|anomaly_flags\|isolated-browser-qa\|missing_items\|明文停顿\|user_decision\|stage-result\|recordSkeleton" workflows/verify-code/SKILL.md
./specs/archive/m9-verify-code/tasks.md:327:node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false
./specs/archive/m9-verify-code/tasks.md:333:grep -c "capture.mjs\|freshness\|anomaly_flags\|isolated-browser-qa\|missing_items\|明文停顿\|user_decision\|stage-result\|recordSkeleton" workflows/verify-code/SKILL.md
./specs/archive/m9-verify-code/tasks.md:368:  node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false
./specs/archive/m9-verify-code/tasks.md:371:  1. **make-decision 段**：检查 make-decision 产物存在且可读（`specs/{task-id}/stage-result-make-decision.json` 或同等 make-decision 输出产物路径），验证其为合法 JSON 对象；
./specs/archive/m9-verify-code/tasks.md:372:  2. **build-code 段**：读取 `specs/{task-id}/stage-result-build-code.json`，验证 `facts.tests.command` 字段存在且类型为 string；验证该文件能正常解析（即 build-code 接上了 make-decision 的产物）；
./specs/archive/m9-verify-code/tasks.md:373:  3. **verify-code 段**：验证 `specs/{task-id}/stage-result-verify-code.json` 路径结构符合 D-M9-6。
./specs/archive/m9-verify-code/tasks.md:387:- 额外核实：`node --input-type=module --eval "import { readCommand } from './workflows/verify-code/facts-assembly.mjs'; console.log(typeof readCommand)"` 输出 `function`
./specs/archive/m9-verify-code/tasks.md:403:  2. 证据落盘路径：`specs/m9-verify-code/stage-result-verify-code.json`（verify-code 自举产出的 stage-result 即为端到端实跑证据）；
./specs/archive/m9-verify-code/tasks.md:405:- 区分说明：本 task 是"按 F10 故意不建 E2E 框架"而非"漏验"——FR-TEST-002 由自举实跑满足，证据就是自举完成后落盘的 stage-result-verify-code.json。（来源：D-M9-7、F10、验收标准 1/2）
./specs/archive/m9-verify-code/tasks.md:406:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/stage-result-verify-code.json`（自举完成后存在）
./specs/archive/m9-verify-code/tasks.md:420:node --input-type=module --eval "import { readCommand } from './workflows/verify-code/facts-assembly.mjs'; console.log(typeof readCommand)"
./specs/archive/m9-verify-code/tasks.md:432:- FR-TEST-002 端到端验证靠 M9 自举实跑（D-M9-7），证据 = 自举产出的 stage-result-verify-code.json，不在 CI 里模拟三段闭环
./specs/archive/m4-metrics-foundation/checklists/requirements.md:27:- [x] All functional requirements have clear acceptance criteria — FR↔AC 可对应
./specs/archive/m2-microkernel/plan.md:3:**Feature**: [spec.md](./spec.md) | **Decision source**: [decision-log.md](../../../Knowledge/Projects/multica-agenthub/tasks/m2-microkernel/artifacts/decision-log.md)
./specs/archive/m9-verify-code/test/final-test-report.md:34: ✓ tests/facts-subschema.test.mjs (37 tests) 3ms
./specs/archive/m9-verify-code/test/final-test-report.md:35: ✓ tests/stage-result-contract.test.mjs (17 tests) 3ms
./specs/archive/m9-verify-code/test/final-test-report.md:46: ✓ tests/verify-code-facts.test.mjs (19 tests) 4ms
./specs/archive/m9-verify-code/test/final-test-report.md:50:[collectFacts warn] review_invoked not derivable for exec-facts-001; defaulting to false.
./specs/archive/m9-verify-code/test/final-test-report.md:55:[collectFacts warn] review_invoked not derivable for exec-facts-002; defaulting to false.
./specs/archive/m9-verify-code/test/final-test-report.md:57:[collectFacts warn] fact write failed for exec-facts-003
./specs/archive/m9-verify-code/test/final-test-report.md:61: ✓ tests/build-code-facts.test.mjs (10 tests) 4ms
./specs/archive/m9-verify-code/test/final-test-report.md:109:| FR-CMD-003 | build-code facts.tests 加 command 字段 | build-code-capture.test.mjs | PASS |
./specs/archive/m9-verify-code/test/final-test-report.md:116:| FR-PATH-001 | stage-result 落 specs/{task-id}/ | stage-result-contract.test.mjs | PASS |
./specs/archive/m9-verify-code/test/final-test-report.md:117:| FR-PATH-002 | final-test-report.md 落 specs/{task-id}/test/ | stage-result-contract.test.mjs | PASS |
./specs/archive/m9-verify-code/test/final-test-report.md:118:| FR-PATH-003 | evidence_ref 相对路径 | stage-result-contract.test.mjs | PASS |
./specs/archive/m9-verify-code/test/final-test-report.md:119:| FR-METRICS-001 | recordSkeleton 调用 | metrics-collector.test.mjs | PASS |
./specs/archive/m9-verify-code/test/final-test-report.md:120:| FR-METRICS-002 | updateOwnResult 调用 | metrics-collector.test.mjs | PASS |
./specs/archive/m9-verify-code/test/final-test-report.md:134:- workflows/verify-code/facts-assembly.mjs — Stage result assembly
./specs/archive/m9-verify-code/test/final-test-report.md:137:- workflows/build-code/facts-schema.mjs — Build-code schema (C1: optional command)
./specs/archive/m9-verify-code/test/final-test-report.md:144:- tests/verify-code-facts.test.mjs — 19 tests
./specs/archive/m9-verify-code/test/final-test-report.md:145:- tests/build-code-facts.test.mjs — 10 tests (C1 backward compat)
./specs/archive/m9-verify-code/test/final-test-report.md:215:2. **B5: Untracked files** — Cleaned up stale codex artifacts from working tree.
./specs/archive/m9-verify-code/test/final-test-report.md:220:1. **B1: CI failures** — `npm run check` markdownlint errors predate M9 changes (exist on main too). `ci-chain-check.mjs` needs stage-result files from self-bootstrap — this is precisely what FR-TEST-002 captures (circular: the tool must exist before it can verify itself).
./specs/archive/m9-verify-code/test/final-test-report.md:221:2. **B3: Stage-result structure** — The `assembleStageResult` returns a flat 7-key structure by design. It's a pure-function building block called by the SKILL.md orchestrator. The full wrapper (status/retryable/facts) is assembled at the orchestration level. Documented as known gap in cross-doc consistency check.
./specs/archive/m9-verify-code/test/final-test-report.md:222:3. **B4: Metrics FR coverage** — Scripts (capture/freshness/facts-assembly) are pure functions by design. Metrics collector calls (recordSkeleton/updateOwnResult with side effects) happen at the SKILL.md orchestration level, not in pure functions. The FR-METRICS tests verify the collector integration points correctly; verify-code scripts are consumers of build-code output, not metrics producers themselves.
./specs/archive/m4-metrics-foundation/spec.md:5:**需求权威源**: `artifacts/decision-log.md`（18 决策，用户 2026-06-23 批准）
./specs/archive/m4-metrics-foundation/plan.md:5:**需求权威源**: tasks/m4-metrics-foundation/artifacts/decision-log.md（D1-D18）
./specs/archive/m4-metrics-foundation/plan.md:85:- **统一执行记录（JSON）**：六类键 progress/facts/metrics/feedback/boundary_decisions/trace_index；每类键标 first_consumer，无消费方者可选；含扩展预留位。
./specs/archive/m10-baseline-switch/spec.md:53:| rework_proxy_count | checkpoint_request | rework_rounds | sum(max(0, count-1)) all stages | ↓ | weak_proxy | no review→0 |
./specs/archive/m10-baseline-switch/spec.md:67:- FR-MAP-002：rework_proxy_count 标注为 weak_proxy，附说明"所有 stage 返工轮次之和，不代表真实缺陷数"
./specs/archive/m10-baseline-switch/spec.md:68:  - Given 映射表 rework_proxy_count 行，When 查看 source_type，Then 值为 weak_proxy
./specs/archive/m10-baseline-switch/spec.md:107:- 职责：导入 metrics/collector.mjs，在 verify-code 运行前后调 recordSkeleton + updateOwnResult
./specs/archive/m2-microkernel/checklists/requirements.md:27:- [x] All functional requirements have clear acceptance criteria — 18 条 FR 每条有验收
./specs/archive/m2-microkernel/archive.json:8:  "artifacts": ["spec.md", "plan.md", "tasks.md"]
./specs/archive/m10-baseline-switch/field-mapping.md:11:| rework_proxy_count | checkpoint_request | rework_rounds | sum(max(0, count-1)) across stages | ↓ better | weak_proxy | no review→0 |
./specs/archive/m10-baseline-switch/baseline-report.md:17:        "rework_proxy_count": 17
./specs/archive/m10-baseline-switch/baseline-report.md:29:        "rework_proxy_count": 30
./specs/archive/m10-baseline-switch/baseline-report.md:41:        "rework_proxy_count": 35
./specs/archive/m10-baseline-switch/baseline-report.md:53:        "rework_proxy_count": 19
./specs/archive/m10-baseline-switch/baseline-report.md:62:    "rework_proxy_count": 25.25
./specs/archive/m10-baseline-switch/baseline-report.md:81:    "rework_proxy_count": {
./specs/archive/m10-baseline-switch/baseline-report.md:95:- rework_proxy_count 标注 weak_proxy：推导自 checkpoint_request 计数（D10）
./specs/archive/m5-quality-mechanism/spec.md:5:**需求权威源**: `artifacts/decision-log.md`（9 决策，用户 2026-06-23 批准）
./specs/archive/m5-quality-mechanism/spec.md:14:- fact collector：4 个零开销物理事实（exit_code / git_sha / files_changed / review_invoked）写进 M4 execution-record 已有 facts 键，复用不新建文件。
./specs/archive/m5-quality-mechanism/spec.md:17:- stage_result 最小 schema：自造完整七字段（status/error_code/retryable/facts/missing_items/user_decision/reason），护栏是 spec 约定，绝不做成运行时 gate。
./specs/archive/m5-quality-mechanism/spec.md:21:**验收信号**：造"测试没跑"场景，流程能继续推进 + facts 里能查到遗漏；出现任何质量类 blocking 即判失败。
./specs/archive/m5-quality-mechanism/spec.md:27:- Q: stage_result 的 facts 字段装哪些物理事实？ → A: 只装当次 stage 相关的事实子集（最小够用，非全装 4 个；stage_result 是失败传播契约，下游要的是这次失败的事实快照，全装违背 YAGNI）。
./specs/archive/m5-quality-mechanism/spec.md:32:M3 给窄契约（stage 间传 {component_id, output_path}，失败裸 throw 无结构化错误）；M4 给指标双写管道 + execution-record（facts 键为空地）+ "只记不挡"铁律，但只采语义层指标，未采物理事实。workflowhub 现有 7 个 check 全为合规/结构类 blocking，零质量类 blocking（这是对的），但缺"事实观测"和"结构化失败传播"两块。M5 要把质量靠记录不靠拦路落成代码，且绝不重蹈 agenthub 记录臃肿覆辙（实证：单 task events.jsonl 632KB/3421 行，63% 是噪音）。
./specs/archive/m5-quality-mechanism/spec.md:38:agenthub 历史里最大的问题是记录太多太重——63% 是 hook 噪音，真物理事实仅占 6%。M5 的核心设计取向是最小切口：复用 M4 已有的 execution-record + facts 键，只加 4 个零开销字段，不新建任何文件。gate 三类遵循 D7 决策：质量门=0 守住别新增、fact collector 只记不挡、不可逆操作只在真危险点问人。
./specs/archive/m5-quality-mechanism/spec.md:57:### 场景一：正常 stage 执行，facts 隐形落盘
./specs/archive/m5-quality-mechanism/spec.md:59:Given 某 stage 正常执行完，When 采集触发，Then exit_code / git_sha / files_changed / review_invoked 四字段自动写进该 stage 对应的 execution-record.facts 键，对主流程无额外交互、无可感知耗时；fact 里能查到这条记录即通过。
./specs/archive/m5-quality-mechanism/spec.md:63:Given 某 stage 测试被跳过（exit_code 不为 0 或 review_invoked=false），When stage 交接，Then 流程能继续推进；facts 里能查到"测试没跑"这个遗漏；流程被 BLOCK 即失败。
./specs/archive/m5-quality-mechanism/spec.md:97:| 正常采集 | facts 四字段隐形落盘 | 场景一 |
./specs/archive/m5-quality-mechanism/spec.md:113:M5 干四件事：**采事实**——每个 stage 结束时顺手把 4 个物理事实塞进已有的 execution-record.facts 键，零额外文件、零额外时机，完全隐形。**结构化边界**——stage 交接遇到三态时有明确接口让 agent 选"继续"并记原因，接口固定不走孤儿路径。**守 gate**——CI 跑扫描确认质量类 blocking 数量=0，fact collector 只记不挡，不可逆操作只在四种真危险（删/push/merge/归档）问人，超时仍放行只记事实。**传错误**——skill 结构化失败通过七字段 schema 从上游传到下游，下游不用盲目崩溃。这四件事有两条铁律贯穿：一切都是观测不是拦截；schema 护栏写在 spec 约定里，绝不做成运行时 gate。
./specs/archive/m5-quality-mechanism/spec.md:119:- **FR-FACT-001**：系统须在每个 stage 执行结束时，自动采集 exit_code / git_sha / files_changed / review_invoked 四个物理事实，写入该 stage 对应的 M4 execution-record 的 facts 键；不新建任何文件，不新增采集时机。来源：决策 1/2。
./specs/archive/m5-quality-mechanism/spec.md:120:  - **场景**：Given stage 执行完，When 采集，Then execution-record.facts 含四字段，execution-record 文件已存在无新建。
./specs/archive/m5-quality-mechanism/spec.md:121:  - **场景**：Given facts 写入，When 检查副作用，Then 无额外模型调用、无额外人工交互。
./specs/archive/m5-quality-mechanism/spec.md:124:- **FR-FACT-003**：facts 键只装这 4 个机器事实，保持干净；采集失败（如 git 命令失败）须发可观测告警但不阻断 stage 推进。来源：决策 2 / D7 铁律。
./specs/archive/m5-quality-mechanism/spec.md:125:  - **场景**：Given git_sha 采集失败，When stage 仍推进，Then 流程继续 + 有可观测告警 + facts.git_sha 标缺口而非填零。
./specs/archive/m5-quality-mechanism/spec.md:144:  - **场景**：Given 采集 facts 时失败，When stage 推进，Then 流程不被 BLOCK，只有告警。
./specs/archive/m5-quality-mechanism/spec.md:154:- **FR-RESULT-001**：系统须有 stage_result 最小 schema，完整七字段一个不漏：status / error_code / retryable / facts / missing_items / user_decision / reason。schema 放 contracts/ 目录，对齐现有 contract 格式（version + validated_by_stage + required_fields[]），不引 AJV。来源：决策 3。
./specs/archive/m5-quality-mechanism/spec.md:157:- **FR-RESULT-002**：七字段语义约束——status 枚举（成功/失败/unknown）；error_code 字符串标识失败类型；retryable 布尔（此失败是否可安全重试）；facts 形状复用 execution-record 先例（type:object），**只装当次 stage 相关的物理事实子集，非全装 4 个**（Clarifications 2026-06-23 定）；missing_items 数组（缺少什么让下游知道该补什么）；user_decision 布尔或枚举（是否有过人工介入决策）；reason 面向 orchestrator 的解释字符串（非 debug message）。来源：决策 3。
./specs/archive/m5-quality-mechanism/spec.md:172:- **负责什么**：在 stage updateOwnResult 时机把 4 个物理事实写进 execution-record.facts 键；失败时发告警但不抛拦截异常。
./specs/archive/m5-quality-mechanism/spec.md:173:- **对外接口**：被 M4 updateOwnResult 钩子触发，接收进程退出码 + git 上下文。
./specs/archive/m5-quality-mechanism/spec.md:174:- **依赖谁**：M4 execution-record 结构（复用 facts 键，且 review_invoked 从同一 execution-record 推导）。无 journal 依赖（workflowhub 现状无 journal）。
./specs/archive/m5-quality-mechanism/spec.md:175:- **测试边界**：分两层——**单元测试**喂固定进程上下文进、查 execution-record.facts 出（单测本就隔离，不搭完整 stage 环境）；**验收（V1）**仍须真跑活流程，把 facts 写进真实 execution-record 并读回断言（非隔离 fixture，遵 decision-log 决策 8b）。两层不冲突：单测验逻辑、验收验真实流程闭合。
./specs/archive/m5-quality-mechanism/spec.md:192:- **负责什么**：维护 contracts/stage-result.contract.json（七字段 + 类型约定 + CI 格式校验）；护栏在 spec/contract 层，不进运行时。
./specs/archive/m5-quality-mechanism/spec.md:198:- **execution-record.facts**（复用 M4）：
./specs/archive/m5-quality-mechanism/spec.md:212:  - `facts`：当次 stage 相关物理事实子集（非全装 4 个），object，复用 execution-record 形状。
./specs/archive/m5-quality-mechanism/spec.md:239:- **V1 不卡死**：造"测试没跑"场景（exit_code≠0 或 review_invoked=false），流程能继续推进 + execution-record.facts 里能查到这个遗漏；流程被 BLOCK 即失败。（防假绿：把 facts 写入改 BLOCK 后验 V1 应红）
./specs/archive/m5-quality-mechanism/spec.md:253:- **stage_result.facts 字段子集**：✅ 已决（Clarifications 2026-06-23）——只装当次 stage 相关子集，非全装 4 个。
./specs/archive/m5-quality-mechanism/spec.md:260:- **受影响功能：M4 execution-record（facts 键）**
./specs/archive/m5-quality-mechanism/spec.md:261:  - 既有行为：M4 execution-record 已建，facts 键为空地。
./specs/archive/m5-quality-mechanism/spec.md:262:  - 本需求影响：M5 fact collector 写进 facts 键的 4 个物理事实；不新建文件，不改 execution-record 其他字段。
./specs/archive/m5-quality-mechanism/spec.md:263:  - 回归要点：验证 execution-record 其他字段（进度/指标/反馈等六类键）在 M5 接入后保持不变；facts 键写入失败不阻断 execution-record 整体写入。
./specs/archive/m5-quality-mechanism/spec.md:278:- 决策 2（复用 M4 execution-record facts 键）→ 第 10 章"受影响功能：M4 execution-record"。
./specs/archive/m10-baseline-switch/tasks.md:62:  - 入参：metrics/collector.mjs (recordSkeleton, updateOwnResult, collectFacts)
./specs/archive/m10-baseline-switch/tasks.md:80:verify-code目录下新增metrics-writer.mjs,导入collector.mjs。在verify-code SKILL.md的步骤2(recordSkeleton)和步骤9(updateOwnResult)处插入metrics-writer.mjs调用,产task-metrics.jsonl。不碰host-adapter.mjs。
./specs/archive/m10-baseline-switch/tasks.md:106:  - 验证：7列齐全(metric_name/journal_event/workflowhub_field/formula/polarity/source_type/missing_behavior),rework_proxy_count标注weak_proxy
./specs/archive/m10-baseline-switch/tasks.md:110:  - 出参：specs/m10-baseline-switch/baseline-report.md (固定表格+三行结论)
./specs/archive/m10-baseline-switch/tasks.md:111:  - 文件：specs/m10-baseline-switch/baseline-report.md
./specs/archive/m10-baseline-switch/tasks.md:115:  - 入参：baseline-report.md
./specs/archive/m10-baseline-switch/tasks.md:118:  - 验证：grep baseline-report.md 含"代理推导"或"proxy"
./specs/archive/m10-baseline-switch/tasks.md:131:- specs/m10-baseline-switch/baseline-report.md (新增)
./specs/archive/m10-baseline-switch/plan.md:6:- Key deps: metrics/baseline.mjs (import DERIVED_METRICS + DERIVATION_SOURCE constants only), metrics/collector.mjs (recordSkeleton + updateOwnResult), metrics/record-schema.mjs (CORE_FIELDS)
./specs/archive/m10-baseline-switch/plan.md:41:│   └── baseline-report.md             # 首个端到端对照报告
./specs/archive/m10-baseline-switch/plan.md:99:                                 baseline-report.md  ← 基线对照报告
./specs/archive/m10-baseline-switch/plan.md:104:                         recordSkeleton → run → updateOwnResult
./specs/archive/m10-baseline-switch/plan.md:115:| recordSkeleton | metrics/collector.mjs | import 函数，直接调用 |
./specs/archive/m10-baseline-switch/plan.md:116:| updateOwnResult | metrics/collector.mjs | import 函数，直接调用 |
./specs/archive/m10-baseline-switch/plan.md:118:| stage-result contract | contracts/ | 引用，不修改 |
./specs/archive/m5-quality-mechanism/tasks.md:7:**Architecture:** 全在 workflowhub 仓（`/Users/Hugh/Hugh/Project/workflowhub`），零新依赖；复用 M4 execution-record facts 键 + M2 path-guard 接口 + 已有 validate-contract/upsert；新增 3 个 .mjs 文件 + 1 个 contract JSON + 对现有文件的最小改动（collector.mjs 追加 collectFacts 调用 ≤5 行 + 给 upsert 加 export；run-checks.mjs 追加第 6 个 checker；check-path-guard.mjs 给 findViolation 加 export）。upsert/findViolation 现为各自文件的内部函数（collector.mjs:80 / check-path-guard.mjs:97），boundary-confirm.mjs 跨文件复用前必须先加 `export`（仅加关键字、零行为变更）。守恒铁律：只记不挡，任何 facts 采集或 stage_result 护栏不得成为运行时 blocking。
./specs/archive/m5-quality-mechanism/tasks.md:21:在 `metrics/collector.mjs` 的 `updateOwnResult` 末尾追加 `collectFacts` 调用（≤5 行）；`collectFacts` 写 4 个物理事实到 execution-record.facts 键；失败时 stderr 告警不 throw，零阻断。新建 `tests/fact-collector.test.mjs`。
./specs/archive/m5-quality-mechanism/tasks.md:25:- Modify: `/Users/Hugh/Hugh/Project/workflowhub/metrics/collector.mjs` — 追加 `collectFacts` 导出 + 在 `updateOwnResult` 末尾调用
./specs/archive/m5-quality-mechanism/tasks.md:26:- Create: `/Users/Hugh/Hugh/Project/workflowhub/tests/fact-collector.test.mjs` — 单元测试，喂固定进程上下文，查 facts 出
./specs/archive/m5-quality-mechanism/tasks.md:28:- Reference: `/Users/Hugh/Hugh/Project/workflowhub/metrics/collector.mjs` — A-001 updateOwnResult，A-002 upsert（同模块内部函数，collectFacts 同文件直用、无需 export/import），签名不变不重写
./specs/archive/m5-quality-mechanism/tasks.md:38:- [x] T002 [FR-FACT-001/FR-FACT-002/FR-FACT-003] 实现 `collectFacts`，接入 `updateOwnResult`
./specs/archive/m5-quality-mechanism/tasks.md:40:  - 出参：`metrics/collector.mjs`（修改，追加 collectFacts 导出 + updateOwnResult 末尾调用）
./specs/archive/m5-quality-mechanism/tasks.md:41:  - 做什么：在 `updateOwnResult`（A-001）末尾追加 collectFacts 调用，≤5 行；collectFacts 内部用已有 upsert（A-002）写 facts 键；采集 exit_code/git_sha/files_changed 走进程/git 零开销来源；review_invoked 从 execution-record 推导，推导不到记 `false` + stderr 告警；整个 collectFacts 用 try/catch 包住，失败只 stderr warn 不 throw（FR-FACT-003 守恒铁律）；GAP 哨兵（A-004）用于 review_invoked 推导失败时标缺口
./specs/archive/m5-quality-mechanism/tasks.md:42:  - 验证意图：真跑活流程——经真实 collector 管道（updateOwnResult 触发 collectFacts）写 facts；读回 execution-record 断言四字段；采集失败路径（如强制让 git 命令返回非零）验流程继续 + 有 stderr 告警（判据必须是被测命令真实退出码，不吞退出码）
./specs/archive/m5-quality-mechanism/tasks.md:52:- V1（不卡死）：造 exit_code≠0 或 review_invoked=false 场景，流程能继续推进 + facts 里能查到遗漏；流程被 BLOCK 即失败
./specs/archive/m5-quality-mechanism/tasks.md:55:- 防假绿：把 facts 写入改成 blocking check 后验 V1 应红；用 set -o pipefail 确保判据是真实退出码
./specs/archive/m5-quality-mechanism/tasks.md:203:新建 `contracts/stage-result.contract.json`（七字段，对齐已有 contract 格式）；新建 `tests/stage-result-contract.test.mjs` 含七字段完整性测试 + 语义约束测试 + 运行时拦截违规检出测试；用 A-007 validateContract（zero-AJV）做 CI 格式校验。
./specs/archive/m5-quality-mechanism/tasks.md:207:- Create: `/Users/Hugh/Hugh/Project/workflowhub/contracts/stage-result.contract.json` — 七字段最小 schema
./specs/archive/m5-quality-mechanism/tasks.md:208:- Create: `/Users/Hugh/Hugh/Project/workflowhub/tests/stage-result-contract.test.mjs` — 契约测试
./specs/archive/m5-quality-mechanism/tasks.md:214:- [x] T012 [FR-RESULT-001/002/003/004] 新建 `tests/stage-result-contract.test.mjs`，写七字段测试；先跑失败命令存证
./specs/archive/m5-quality-mechanism/tasks.md:216:  - 出参：`tests/stage-result-contract.test.mjs`；RED 证据存 `$TASK_DIR/apply/evidence/v4-stage-result-RED.txt`
./specs/archive/m5-quality-mechanism/tasks.md:217:  - 做什么：测试七字段齐全性（status/error_code/retryable/facts/missing_items/user_decision/reason 一个不漏）；测试语义约束——status 限 success/failed/unknown 枚举、missing_items 为 array、retryable 为 boolean——这些约束靠独立语义校验而非只 typeof 的 validateContract（FR-RESULT-002）；测试下游能从 stage_result 读到 error_code/retryable/missing_items 三字段（FR-RESULT-004）；先跑失败命令存 RED 证据（contract 文件不存在 → exit 1）
./specs/archive/m5-quality-mechanism/tasks.md:220:- [x] T013 [FR-RESULT-001/002/003/004] 实现 `contracts/stage-result.contract.json`
./specs/archive/m5-quality-mechanism/tasks.md:222:  - 出参：`contracts/stage-result.contract.json`（新建）
./specs/archive/m5-quality-mechanism/tasks.md:223:  - 做什么：按 A-008 格式（version + validated_by_stage + required_fields[]）写七字段契约；七字段逐条含类型约定——status（string，enum: success/failed/unknown）、error_code（string）、retryable（boolean）、facts（object，当次 stage 相关子集，非全装四个）、missing_items（array）、user_decision（boolean）、reason（string，面向 orchestrator 非 debug）；零 AJV（A-007），格式对齐已有 contract；护栏仅在 spec/CI 层，绝不进运行时（FR-RESULT-003）
./specs/archive/m5-quality-mechanism/tasks.md:228:  - 出参：`$TASK_DIR/apply/phase-4.md`；evidence 路径 `$TASK_DIR/apply/evidence/v4-stage-result-GREEN.txt`
./specs/archive/m5-quality-mechanism/tasks.md:242:- facts 字段装当次 stage 相关子集，非全装四个（Clarifications 2026-06-23）
./specs/archive/m5-quality-mechanism/tasks.md:246:Phase 4 完成条件：T012-T014 全绿；V4 真跑活流程；七字段语义校验可证伪；contracts/stage-result.contract.json 格式对齐 A-008。
./specs/archive/m5-quality-mechanism/tasks.md:255:- M2 check-path-guard（findViolation）和 M4 execution-record（facts 键）是前置依赖，已存在于 workflowhub
./specs/archive/m5-quality-mechanism/plan.md:13:  - `metrics/execution-record.mjs`——facts 键写入（复用，无新文件）
./specs/archive/m5-quality-mechanism/plan.md:14:  - `metrics/collector.mjs`——updateOwnResult 时机追加 facts 写入
./specs/archive/m5-quality-mechanism/plan.md:17:  - `contracts/stage-result.contract.json`——新增 stage_result schema
./specs/archive/m5-quality-mechanism/plan.md:32:- [x] **F3 物理事实靠机器校验但不阻断**：facts 写入失败发告警不 throw，符合。
./specs/archive/m5-quality-mechanism/plan.md:35:- [x] **F6 统一外置执行记录**：facts 写进已有 execution-record，不新建文件，符合。
./specs/archive/m5-quality-mechanism/plan.md:58:| schema | contracts/stage-result.contract.json（新增） | 改 | T012-T014 |
./specs/archive/m5-quality-mechanism/plan.md:68:| facts 写入时机 | recordSkeleton / updateOwnResult / updateStageImpact | updateOwnResult（timing 2）| 进程结束时才有 exit_code，timing 2 是"skill 结束"最小时机 |
./specs/archive/m5-quality-mechanism/plan.md:75:**execution-record.facts**（复用 M4，仅写入内容，不改结构）：
./specs/archive/m5-quality-mechanism/plan.md:89:**stage_result schema**（contracts/stage-result.contract.json）：
./specs/archive/m5-quality-mechanism/plan.md:96:| facts | object | 当次 stage 相关物理事实**子集**（非全装 4 个） |
./specs/archive/m5-quality-mechanism/plan.md:115:// metrics/collector.mjs (新增导出，在 updateOwnResult 之后)
./specs/archive/m5-quality-mechanism/plan.md:118:// cfg: same as updateOwnResult cfg
./specs/archive/m5-quality-mechanism/plan.md:127:  contracts/stage-result.contract.json — 七字段 stage_result 最小 schema
./specs/archive/m5-quality-mechanism/plan.md:134:  metrics/collector.mjs             — updateOwnResult 后追加 collectFacts 调用；新增 collectFacts 导出
./specs/archive/m5-quality-mechanism/plan.md:142:  → updateOwnResult(execution_id, patch, cfg)
./specs/archive/m5-quality-mechanism/plan.md:144:      → 采集成功：写 execution-record.facts（upsert）
./specs/archive/m5-quality-mechanism/plan.md:153:  → 返回 stage_result = {status:"failed", error_code, retryable, facts, missing_items, user_decision, reason}
./specs/archive/m5-quality-mechanism/plan.md:166:  - `metrics/collector.mjs`——updateOwnResult（复用）/upsert（同模块直用；跨文件复用前加 export，见 A-002b）
./specs/archive/m5-quality-mechanism/plan.md:177:  - `metrics/collector.mjs` 的 `updateOwnResult` 末尾追加 `collectFacts` 调用（最小钩子）。
./specs/archive/m5-quality-mechanism/plan.md:179:- **是否使用了最小 hook**：是。updateOwnResult 是"skill 结束"的唯一稳定时机；runAggregate 是唯一 CI 聚合入口。改动量：各 ≤5 行。
./specs/archive/m5-quality-mechanism/plan.md:196:| A-001 | `metrics/collector.mjs:updateOwnResult`（L150）| timing 2 skill 结束时 patch facts/tokens/duration | 追加 collectFacts 调用；签名不变 | 不重写、不挪位 |
./specs/archive/m5-quality-mechanism/plan.md:200:| A-004 | `metrics/execution-record.mjs:SIX_KEYS / GAP`（L20/L35）| 六键顺序 + GAP 哨兵 | collectFacts 写入 facts 键时遵循相同顺序；GAP 用作 review_invoked 推导失败哨兵 | 不另定义同名常量 |
./specs/archive/m5-quality-mechanism/plan.md:204:| A-007 | `core/validate-contract.mjs:validateContract`（全文）| 手写 contract 校验（zero-AJV）| check-stage-quality.mjs 用此校验 stage-result.contract.json | 不引入 AJV |
./specs/archive/m5-quality-mechanism/plan.md:205:| A-008 | `contracts/execution-record.contract.json`（格式参考）| version/validated_by_stage/required_fields[] 极简格式 | stage-result.contract.json 对齐此格式 | 不引入 $schema |
./specs/archive/m5-quality-mechanism/plan.md:211:| facts 写入 | 适配已有 | A-001 updateOwnResult | 最小时机钩子，5 行内完成 |
./specs/archive/m5-quality-mechanism/plan.md:216:| stage_result contract | 新增 | contracts/stage-result.contract.json | 七字段无现有同形 contract；格式对齐已有 |
./specs/archive/m5-quality-mechanism/plan.md:223:| T001 fact collector | collectFacts throw 导致 updateOwnResult 后续被中断 | try/catch + stderr warn，保证 never-throw；测试故意让 git 命令失败验证告警路径 | 删 collectFacts 调用行（1 行 rollback）|
./specs/archive/m5-quality-mechanism/plan.md:225:| T003 stage_result schema | 七字段漏写或类型不对 | 对照 FR-RESULT-002 逐字段核 + CI 格式校验测试 | 改 contracts/stage-result.contract.json |
./specs/archive/m5-quality-mechanism/plan.md:240:    "command": "npm test -- --reporter=verbose --testNamePattern=\"fact collector writes 4 physical facts\"",
./specs/archive/m5-quality-mechanism/plan.md:249:    "command": "npm test -- --reporter=verbose --testNamePattern=\"fact collector writes 4 physical facts\"",
./specs/archive/m5-quality-mechanism/plan.md:346:  "evidenceSink": "$TASK_DIR/apply/evidence/v4-stage-result.txt",
./specs/archive/m5-quality-mechanism/plan.md:348:    "tests/stage-result-contract.test.mjs",
./specs/archive/m5-quality-mechanism/plan.md:362:  - T001：`execution-record.facts` 在 updateOwnResult 后含 exit_code/git_sha/files_changed/review_invoked（或告警标记），无新文件新建。
./specs/archive/m5-quality-mechanism/plan.md:364:  - T003：`contracts/stage-result.contract.json` 存在，validateContract 通过七字段校验，CI 格式校验报绿。
./specs/archive/m5-quality-mechanism/plan.md:367:  - fact 采集失败（git 命令失败）：告警 stderr，facts.git_sha = null + 标"推导失败"，updateOwnResult 正常返回。
./specs/archive/m5-quality-mechanism/plan.md:377:- **验证目标**：facts 写入失败不 BLOCK 推进，遗漏有迹可查。
./specs/archive/m5-quality-mechanism/plan.md:416:- **evidence_path**：`$TASK_DIR/apply/evidence/v4-stage-result.txt`
./specs/archive/m5-quality-mechanism/plan.md:417:- **display_cmd**：`grep -E "error_code|retryable|missing_items" $TASK_DIR/apply/evidence/v4-stage-result.txt`
./specs/archive/m5-quality-mechanism/plan.md:445:| SIG-001 | `metrics/collector.mjs:updateOwnResult` | `(execution_id: string, patch: object, cfg: {taskMetricsPath, globalMetricsPath, tokenSourceReachable?}) → object\|null` |
./specs/archive/m5-quality-mechanism/plan.md:446:| SIG-002 | `metrics/collector.mjs:recordSkeleton` | `(seed: {execution_id, skill_or_stage, stage, skill_version, executed, tokens, duration_ms, rework_rounds, human_intervention, friction_ref, actions, stage_unit}, cfg) → object` |
./specs/archive/m5-quality-mechanism/plan.md:450:| SIG-006 | `metrics/execution-record.mjs:assembleExecutionRecord` | `(seed: {execution_id, progress?, facts?, metrics?, feedback?, boundary_decisions?, trace_index?, consumers?, ext?}) → object` |
./specs/archive/m5-quality-mechanism/plan.md:465:- [x] **不适用段已标注 N/A 并写理由**：API Contracts（无 REST 改动）/ UI 实现合同（无 UI）已标 N/A；Data Model 实写（涉及 facts/boundary/stage_result 数据结构）；证据契约 + 验证策略实写（落仓库改动，不 N/A）。

codex
目前没有看到原阻断问题复发。唯一需要确认的是 stage-result 仍只要求 7 个顶层键和 `facts.spec_ref`/`facts.requirements`，文件第 128-140 行保持了这个骨架。
exec
/bin/bash -lc "sed -n '1161,1455p' /Users/Hugh/.claude/skills/gstack/review/SKILL.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
## Step 4: Critical pass (core review)

Apply the CRITICAL categories from the checklist against the diff:
SQL & Data Safety, Race Conditions & Concurrency, LLM Output Trust Boundary, Shell Injection, Enum & Value Completeness.

Also apply the remaining INFORMATIONAL categories that are still in the checklist (Async/Sync Mixing, Column/Field Name Safety, LLM Prompt Issues, Type Coercion, View/Frontend, Time Window Safety, Completeness Gaps, Distribution & CI/CD).

**Enum & Value Completeness requires reading code OUTSIDE the diff.** When the diff introduces a new enum value, status, tier, or type constant, use Grep to find all files that reference sibling values, then Read those files to check if the new value is handled. This is the one category where within-diff review is insufficient.

**Search-before-recommending:** When recommending a fix pattern (especially for concurrency, caching, auth, or framework-specific behavior):
- Verify the pattern is current best practice for the framework version in use
- Check if a built-in solution exists in newer versions before recommending a workaround
- Verify API signatures against current docs (APIs change between versions)

Takes seconds, prevents recommending outdated patterns. If WebSearch is unavailable, note it and proceed with in-distribution knowledge.

Follow the output format specified in the checklist. Respect the suppressions — do NOT flag items listed in the "DO NOT flag" section.

## Confidence Calibration

Every finding MUST include a confidence score (1-10):

| Score | Meaning | Display rule |
|-------|---------|-------------|
| 9-10 | Verified by reading specific code. Concrete bug or exploit demonstrated. | Show normally |
| 7-8 | High confidence pattern match. Very likely correct. | Show normally |
| 5-6 | Moderate. Could be a false positive. | Show with caveat: "Medium confidence, verify this is actually an issue" |
| 3-4 | Low confidence. Pattern is suspicious but may be fine. | Suppress from main report. Include in appendix only. |
| 1-2 | Speculation. | Only report if severity would be P0. |

**Finding format:**

\`[SEVERITY] (confidence: N/10) file:line — description\`

Example:
\`[P1] (confidence: 9/10) app/models/user.rb:42 — SQL injection via string interpolation in where clause\`
\`[P2] (confidence: 5/10) app/controllers/api/v1/users_controller.rb:18 — Possible N+1 query, verify with production logs\`

### Pre-emit verification gate (#1539 — kills the "field doesn't exist" FP class)

Before any finding is promoted to the report, the gate requires:

1. **Quote the specific code line that motivates the finding** — file:line plus
   the verbatim text of the line(s) that triggered it. If the finding is "field
   X doesn't exist on model Y", quote the lines of class Y where the field
   would live. If "dict.get() might return None", quote the dict initialization.
   If "race condition between A and B", quote both A and B.

2. **If you cannot quote the motivating line(s), the finding is unverified.**
   Force its confidence to 4-5 (suppressed from the main report). It still goes
   into the appendix so reviewers can audit calibration, but the user does NOT
   see it in the critical-pass output. Do not work around this by inventing
   speculative confidence 7+ — that defeats the gate.

**Framework-meta nudge:** When the symbol is generated by a framework
metaclass, descriptor, ORM Meta inner-class, or migration history (Django
`Meta`, Rails `has_many`/`scope`, SQLAlchemy `relationship`/`Column`,
TypeORM decorators, Sequelize `init`/`belongsTo`, Prisma generated client),
quote the meta-construct (the `Meta` block, the migration, the decorator,
the schema file) instead of expecting the literal name in the class body.
The verification is "I read the source that creates this symbol", not "I
grep'd for the name and didn't find it." Deeper framework-aware verification
(model introspection, migration-history-aware checks, ORM dialect detection)
is deliberately out of scope for the lighter gate — see the deferred
`~/.gstack-dev/plans/1539-framework-aware-review.md` design doc.

The FP classes the gate kills (measured against Django Sprint 2.5 #1539):

| FP class | Why the gate catches it |
|---|---|
| "field doesn't exist on model" | Requires quoting the model class body or Meta; the field's absence becomes obvious |
| "dict.get() might be None" | Requires quoting the dict initialization (e.g. Django form's `cleaned_data` is `{}`-initialized) |
| "save() might lose fields" | Requires quoting the ORM signature or model definition |
| "update_fields might miss X" | Requires quoting the field set; if X doesn't exist, the FP is self-evident |

**Calibration learning:** If you report a finding with confidence < 7 and the user
confirms it IS a real issue, that is a calibration event. Your initial confidence was
too low. Log the corrected pattern as a learning so future reviews catch it with
higher confidence.

---

## Step 4.5: Review Army — Specialist Dispatch

### Detect stack and scope

```bash
source <(~/.claude/skills/gstack/bin/gstack-diff-scope <base> 2>/dev/null) || true
# Detect stack for specialist context
STACK=""
[ -f Gemfile ] && STACK="${STACK}ruby "
[ -f package.json ] && STACK="${STACK}node "
[ -f requirements.txt ] || [ -f pyproject.toml ] && STACK="${STACK}python "
[ -f go.mod ] && STACK="${STACK}go "
[ -f Cargo.toml ] && STACK="${STACK}rust "
echo "STACK: ${STACK:-unknown}"
DIFF_BASE=$(git merge-base origin/<base> HEAD)
DIFF_INS=$(git diff "$DIFF_BASE" --stat | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
DIFF_DEL=$(git diff "$DIFF_BASE" --stat | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo "0")
DIFF_LINES=$((DIFF_INS + DIFF_DEL))
echo "DIFF_LINES: $DIFF_LINES"
# Detect test framework for specialist test stub generation
TEST_FW=""
{ [ -f jest.config.ts ] || [ -f jest.config.js ]; } && TEST_FW="jest"
[ -f vitest.config.ts ] && TEST_FW="vitest"
{ [ -f spec/spec_helper.rb ] || [ -f .rspec ]; } && TEST_FW="rspec"
{ [ -f pytest.ini ] || [ -f conftest.py ]; } && TEST_FW="pytest"
[ -f go.mod ] && TEST_FW="go-test"
echo "TEST_FW: ${TEST_FW:-unknown}"
```

### Read specialist hit rates (adaptive gating)

```bash
~/.claude/skills/gstack/bin/gstack-specialist-stats 2>/dev/null || true
```

### Select specialists

Based on the scope signals above, select which specialists to dispatch.

**Always-on (dispatch on every review with 50+ changed lines):**
1. **Testing** — read `~/.claude/skills/gstack/review/specialists/testing.md`
2. **Maintainability** — read `~/.claude/skills/gstack/review/specialists/maintainability.md`

**If DIFF_LINES < 50:** Skip all specialists. Print: "Small diff ($DIFF_LINES lines) — specialists skipped." Continue to Step 5.

**Conditional (dispatch if the matching scope signal is true):**
3. **Security** — if SCOPE_AUTH=true, OR if SCOPE_BACKEND=true AND DIFF_LINES > 100. Read `~/.claude/skills/gstack/review/specialists/security.md`
4. **Performance** — if SCOPE_BACKEND=true OR SCOPE_FRONTEND=true. Read `~/.claude/skills/gstack/review/specialists/performance.md`
5. **Data Migration** — if SCOPE_MIGRATIONS=true. Read `~/.claude/skills/gstack/review/specialists/data-migration.md`
6. **API Contract** — if SCOPE_API=true. Read `~/.claude/skills/gstack/review/specialists/api-contract.md`
7. **Design** — if SCOPE_FRONTEND=true. Use the existing design review checklist at `~/.claude/skills/gstack/review/design-checklist.md`

### Adaptive gating

After scope-based selection, apply adaptive gating based on specialist hit rates:

For each conditional specialist that passed scope gating, check the `gstack-specialist-stats` output above:
- If tagged `[GATE_CANDIDATE]` (0 findings in 10+ dispatches): skip it. Print: "[specialist] auto-gated (0 findings in N reviews)."
- If tagged `[NEVER_GATE]`: always dispatch regardless of hit rate. Security and data-migration are insurance policy specialists — they should run even when silent.

**Force flags:** If the user's prompt includes `--security`, `--performance`, `--testing`, `--maintainability`, `--data-migration`, `--api-contract`, `--design`, or `--all-specialists`, force-include that specialist regardless of gating.

Note which specialists were selected, gated, and skipped. Print the selection:
"Dispatching N specialists: [names]. Skipped: [names] (scope not detected). Gated: [names] (0 findings in N+ reviews)."

---

### Dispatch specialists in parallel

For each selected specialist, launch an independent subagent via the Agent tool.
**Launch ALL selected specialists in a single message** (multiple Agent tool calls)
so they run in parallel. Each subagent has fresh context — no prior review bias.

**Each specialist subagent prompt:**

Construct the prompt for each specialist. The prompt includes:

1. The specialist's checklist content (you already read the file above)
2. Stack context: "This is a {STACK} project."
3. Past learnings for this domain (if any exist):

```bash
~/.claude/skills/gstack/bin/gstack-learnings-search --type pitfall --query "{specialist domain}" --limit 5 2>/dev/null || true
```

If learnings are found, include them: "Past learnings for this domain: {learnings}"

4. Instructions:

"You are a specialist code reviewer. Read the checklist below, then run
`DIFF_BASE=$(git merge-base origin/<base> HEAD) && git diff "$DIFF_BASE"` to get the full diff. Apply the checklist against the diff.

For each finding, output a JSON object on its own line:
{\"severity\":\"CRITICAL|INFORMATIONAL\",\"confidence\":N,\"path\":\"file\",\"line\":N,\"category\":\"category\",\"summary\":\"description\",\"fix\":\"recommended fix\",\"fingerprint\":\"path:line:category\",\"specialist\":\"name\"}

Required fields: severity, confidence, path, category, summary, specialist.
Optional: line, fix, fingerprint, evidence, test_stub.

If you can write a test that would catch this issue, include it in the `test_stub` field.
Use the detected test framework ({TEST_FW}). Write a minimal skeleton — describe/it/test
blocks with clear intent. Skip test_stub for architectural or design-only findings.

If no findings: output `NO FINDINGS` and nothing else.
Do not output anything else — no preamble, no summary, no commentary.

Stack context: {STACK}
Past learnings: {learnings or 'none'}

CHECKLIST:
{checklist content}"

**Subagent configuration:**
- Use `subagent_type: "general-purpose"`
- Do NOT use `run_in_background` — all specialists must complete before merge
- If any specialist subagent fails or times out, log the failure and continue with results from successful specialists. Specialists are additive — partial results are better than no results.

---

### Step 4.6: Collect and merge findings

After all specialist subagents complete, collect their outputs.

**Parse findings:**
For each specialist's output:
1. If output is "NO FINDINGS" — skip, this specialist found nothing
2. Otherwise, parse each line as a JSON object. Skip lines that are not valid JSON.
3. Collect all parsed findings into a single list, tagged with their specialist name.

**Fingerprint and deduplicate:**
For each finding, compute its fingerprint:
- If `fingerprint` field is present, use it
- Otherwise: `{path}:{line}:{category}` (if line is present) or `{path}:{category}`

Group findings by fingerprint. For findings sharing the same fingerprint:
- Keep the finding with the highest confidence score
- Tag it: "MULTI-SPECIALIST CONFIRMED ({specialist1} + {specialist2})"
- Boost confidence by +1 (cap at 10)
- Note the confirming specialists in the output

**Apply confidence gates:**
- Confidence 7+: show normally in the findings output
- Confidence 5-6: show with caveat "Medium confidence — verify this is actually an issue"
- Confidence 3-4: move to appendix (suppress from main findings)
- Confidence 1-2: suppress entirely

**Compute PR Quality Score:**
After merging, compute the quality score:
`quality_score = max(0, 10 - (critical_count * 2 + informational_count * 0.5))`
Cap at 10. Log this in the review result at the end.

**Output merged findings:**
Present the merged findings in the same format as the current review:

```
SPECIALIST REVIEW: N findings (X critical, Y informational) from Z specialists

[For each finding, in order: CRITICAL first, then INFORMATIONAL, sorted by confidence descending]
[SEVERITY] (confidence: N/10, specialist: name) path:line — summary
  Fix: recommended fix
  [If MULTI-SPECIALIST CONFIRMED: show confirmation note]

PR Quality Score: X/10
```

These findings flow into Step 5 Fix-First alongside the CRITICAL pass findings from Step 4.
The Fix-First heuristic applies identically — specialist findings follow the same AUTO-FIX vs ASK classification.

**Compile per-specialist stats:**
After merging findings, compile a `specialists` object for the review-log entry in Step 5.8.
For each specialist (testing, maintainability, security, performance, data-migration, api-contract, design, red-team):
- If dispatched: `{"dispatched": true, "findings": N, "critical": N, "informational": N}`
- If skipped by scope: `{"dispatched": false, "reason": "scope"}`
- If skipped by gating: `{"dispatched": false, "reason": "gated"}`
- If not applicable (e.g., red-team not activated): omit from the object

Include the Design specialist even though it uses `design-checklist.md` instead of the specialist schema files.
Remember these stats — you will need them for the review-log entry in Step 5.8.

---

### Red Team dispatch (conditional)

**Activation:** Only if DIFF_LINES > 200 OR any specialist produced a CRITICAL finding.

If activated, dispatch one more subagent via the Agent tool (foreground, not background).

The Red Team subagent receives:
1. The red-team checklist from `~/.claude/skills/gstack/review/specialists/red-team.md`
2. The merged specialist findings from Step 4.6 (so it knows what was already caught)
3. The git diff command

Prompt: "You are a red team reviewer. The code has already been reviewed by N specialists
who found the following issues: {merged findings summary}. Your job is to find what they
MISSED. Read the checklist, run `DIFF_BASE=$(git merge-base origin/<base> HEAD) && git diff "$DIFF_BASE"`, and look for gaps.
Output findings as JSON objects (same schema as the specialists). Focus on cross-cutting
concerns, integration boundary issues, and failure modes that specialist checklists
don't cover."

If the Red Team finds additional issues, merge them into the findings list before
Step 5 Fix-First. Red Team findings are tagged with `"specialist":"red-team"`.

If the Red Team returns NO FINDINGS, note: "Red Team review: no additional issues found."
If the Red Team subagent fails or times out, skip silently and continue.

---

## Step 5: Fix-First Review

**Every finding gets action — not just critical ones.**

### Step 5.0: Cross-review finding dedup

Before classifying findings, check if any were previously skipped by the user in a prior review on this branch.

exec
/bin/bash -lc "sed -n '1,80p' contracts/stage-result.contract.json" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
{"version":"1.0.0","validated_by_stage":"design","allowed_status_values":["success","failed","unknown"],"required_fields":[{"name":"status","type":"string"},{"name":"error_code","type":"string"},{"name":"retryable","type":"boolean"},{"name":"facts","type":"object"},{"name":"missing_items","type":"object","semantic":"array"},{"name":"user_decision","type":"boolean"},{"name":"reason","type":"string"}]}

exec
/bin/bash -lc "sed -n '1,80p' contracts/facts-subschema.json" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
{
  "version": "1.0.0",
  "description": "Per-stage facts sub-schema (FR-CONTRACT-002 / D11). Each stage must have the listed required_keys present and non-empty in facts.",
  "stages": {
    "make-decision": {
      "required_keys": ["decision", "scope", "decision_log_path"],
      "semantics": {
        "decision": "Direction/conclusion decided (slim-path anchor for build-code)",
        "scope": "Scope boundary — what is in and what is out",
        "decision_log_path": "Path to the produced decision log, e.g. tasks/<task>/decision-log.md; consumed downstream by M8."
      }
    },
    "build-spec": {
      "required_keys": ["spec_ref", "requirements"],
      "semantics": {
        "spec_ref": "Locator of the produced spec (anchor for downstream build-plan)",
        "requirements": "Functional requirements list or count"
      }
    },
    "build-plan": {
      "required_keys": ["plan_ref", "tasks"],
      "semantics": {
        "plan_ref": "Locator of the produced plan",
        "tasks": "Decomposed task list or count"
      }
    },
    "build-code": {
      "required_keys": ["changed", "tests"],
      "semantics": {
        "changed": "List of changed artifacts from this stage",
        "tests": "Test execution conclusion (pass/fail counts)"
      }
    },
    "verify-code": {
      "required_keys": ["verdict", "evidence_ref"],
      "semantics": {
        "verdict": "Acceptance verdict",
        "evidence_ref": "Locator of acceptance evidence"
      }
    }
  }
}

codex
未发现新的阻断问题。

核对结果：

- B1 已修复：
  - F10 门现在在 [workflows/build-spec/SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:96) 第 6 节，human review 在 [第 111 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:111) 第 7 节。
  - [第 98 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:98) 明确说 F10 在 human review 前运行，剪裁发生在人类确认前。
  - [第 122 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:122) 明确禁止确认后静默重剪或改 spec。
  - [第 126 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:126) stage-result 只能在人审确认后产出，没有自动越过人类边界。

- B2 已修复：
  - [第 87 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:87) 承认只有 `rework_rounds` 是 M4 core 直接字段，其他指标来自 broader metrics corpus。
  - [第 88 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:88) 要求算不出来就写 `unknown` 并说明原因，禁止伪造。
  - [第 89 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:89) 明确 `unknown` 不阻断 stage。
  - [第 91 行](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:91) 明确 baseline 只是参考，不是阈值或阻断门。

- 未发现新阻断：
  - Section 编号连续：0 到 7，再到 stage-result。
  - 没有新的自动绕过 human review。
  - 没有把 constitution check 或 baseline comparison 变成 blocking gate。
  - `rework_proxy_count` 命名正确，未回退到旧名。
  - M6 骨架保留：F10 门仍在，stage-result 仍是 7 个顶层键，`facts.spec_ref` 和 `facts.requirements` 仍在，metrics 仍要求 `recordSkeleton` 和 `updateOwnResult`。

VERDICT: pass
hook: Stop
hook: Stop Completed
tokens used
57,679

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
