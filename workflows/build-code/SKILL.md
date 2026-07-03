---
name: build-code
description: Implement each task phase by phase using TDD, collecting RED and GREEN evidence for every phase, enforcing diff-only bounds, running 3rd-review on each GREEN, and writing structured facts into the stage-result.
---

# build-code

## Goal

Implement the change described by the upstream stage-result. The upstream may be `build-plan` (full path) or `make-decision` directly (slim path — small tasks that skip design and planning). Read the upstream `stage-result` first and consume its `facts` keys to understand scope and constraints.

Each phase follows a strict RED → implement → GREEN cycle. No phase is done without both evidence files. After GREEN, a 3rd-review is run and its verdict is recorded in `facts.review`.

## What to do

### 1. 前置读取

Read the `stage-result` produced by the previous stage and extract the relevant `facts`:

- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks_ref` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list. `facts.tasks` is the M6 summary/count field; do **not** treat it as a file path.
- If upstream is **`make-decision`** (slim path): read `facts.decision` (the decision text) and `facts.scope` (the bounded change area). `tasks.md` and `plan.md` do not exist on the slim path; derive implementation work directly from these two keys.

The full path exposes a richer fact surface; the slim path is intentionally leaner. Adapt accordingly and never assume a key exists — check before reading.

### 2. TDD 外部强制

For each implementation unit (phase), enforce TDD via the external `capture.mjs` harness. Do **not** run test commands directly — always route through `capture.mjs` so evidence is machine-readable and anomaly-detected.

> **Delegation:** For multi-file or non-trivial phases, dispatch the RED/GREEN capture to a subagent — it runs `capture.mjs` in its own context and returns only the evidence file path + exit code. The orchestrator does not run capture commands in the main context for these. Trivial single-file phases may be run directly.

Sequence per phase:

1. **Write tests first** — ensure the test file exists and the assertions describe the intended behavior before any implementation code is written.
2. **Collect RED evidence** — run:

   ```bash
   node workflows/build-code/capture.mjs <testcmd> <outputPath>
   ```

   where `<outputPath>` **must be an absolute path** resolved via `parseTaskDir` — see path resolution rule below. The command exits non-zero when tests fail (RED is valid); `capture.mjs` records stdout, exit code, content hash, and anomaly flags.
3. **Implement** the minimum code needed to make the tests pass. Do not add production code unrelated to the failing tests.
4. **Collect GREEN evidence** — run capture.mjs again with `<outputPath>` set to the absolute path for `phase-N-GREEN.json`, resolved the same way.
5. Do not advance to the next phase until the current one has both RED and GREEN evidence files on disk.

### 3. 假绿检测

After both RED and GREEN evidence files are written, compare their `content_hash` fields. If `RED.content_hash === GREEN.content_hash`, the test output did not change between runs — this is a suspected false-green.

Inspect the `anomaly_flags` array in each evidence file for any of:

- `suspicious_red_exit` — RED exited 0 (tests should have failed)
- `suspicious_green_exit` — GREEN exited non-zero (tests should have passed)
- `green_test_files_empty` — no test files were discovered in the GREEN run

When any of these conditions hold, surface a **non-blocking warning** to the user. Do not halt the phase; record the warning in the phase notes. A false-green does not automatically invalidate the phase, but must be acknowledged.

### 4. diff-only 越界检测

After each phase's implementation, run:

> **Delegation:** Scanning the diff is a read-heavy action — dispatch it to a subagent (e.g. an explore worker) that runs `diff-scanner.mjs` and returns only the violation list. The orchestrator does not run the scan itself.

```bash
node workflows/build-code/diff-scanner.mjs scanDiff
```

This checks the current `git diff` against the C2 bounded-change list defined in `docs/contracts/C2-scope-bounds.md`. The scanner returns a list of violations (files or patterns outside the declared scope).

**If violations are found: STOP immediately.** Do not auto-proceed. Show the violation type and affected paths to the user and wait for **explicit human confirmation** before continuing. This is enforced by FR-DIFF-002 — no automated bypass is permitted.

### 5. worktree 路径可配置

The skill accepts a caller-provided `worktree_root` config key that specifies the absolute path to the implementation worktree. Never hardcode a path. Never resolve upward to the host agenthub repo directory — the worktree is always the provided `worktree_root` and all file operations are scoped to it. This is enforced by FR-WT-001.

If `worktree_root` is absent from the caller config, fail fast with a clear error rather than guessing.

### 6. 子任务派发后端

Use the available dispatch backend to run implementation work outside the main coordinator context. The dispatch backend is an implementation detail — do not inline its logic.

Preferred backends:

- In Multica issue mode: create phase child issues under the current build-code issue and assign them to implementation agents.
- Outside Multica issue mode: use Worker-Mode as the fallback dispatch backend (external semver dependency — version-pin it in the skill config).

When dispatching implementation work, regardless of backend:

- Pass **ABSOLUTE paths** for all file references (source files, evidence output paths, task dir).
- Pass the configured `worktree_root`.
- Include the phase TASK_SLICE, allowed paths, RED/GREEN evidence output paths, and the required PHASE_RESULT format.
- Explicitly forbid `git commit` — include the instruction `DO NOT commit. Leave changes in the working tree.` (FR-SUB-002).
- The implementer returns only its PHASE_RESULT summary and artifact paths; the orchestrating skill (this SKILL.md) reads those outputs and proceeds to the next step.

### 7. 3rd-review standalone

After GREEN evidence is confirmed for a phase, call the **3rd-review standalone entry**. Feed the real `git diff` output (not a natural-language description of the change — using prose triggers the same-source downgrade path in 3rd-review's classifier).

Consume the 3-state verdict:

- `pass` — proceed to the next phase.
- `revise_required` — return to implementation and address findings before re-running GREEN + 3rd-review.
- `escalate_to_human` — halt and present the finding summary to the user; do not auto-resolve.

If the 3rd-review skill is unavailable (not installed or not reachable), downgrade gracefully to `same_source` review and record `facts.review.source = "same_source"` so downstream stages can detect the degraded state.

> **Note:** The current build-code workflow uses the two-stage independent review described in §13 and the A/B/C escalation rules in §14. The standalone 3rd-review entry documented above is still the backend invoked by each review subagent.

### 8. facts.review 产出

After 3rd-review completes for each phase, construct the review fact using `facts-schema.mjs`:

```js
import { buildReviewFact } from "./facts-schema.mjs";
// When review ran successfully:
const artifact_path = "{taskDir}/{task-id}/reviews/build-code-phase-N.md";
const reviewFact = buildReviewFact({ status: "executed", source, verdict, artifactPath: artifact_path });
// source must be "third_party" or "same_source"; verdict must be "pass" | "revise_required" | "escalate_to_human"
// artifact_path is the durable path to the review report, resolved via parseTaskDir, e.g. "{taskDir}/{task-id}/reviews/build-code-phase-N.md"
// Note: buildReviewFact's parameter is named artifactPath (camelCase), but the value stored in the fact is artifact_path (snake_case).

// When review was skipped or could not run:
// const reviewFact = buildReviewFact({ status: "not_executed" });
```

Write the result into `stage-result` under the `facts.review` key. The `buildReviewFact` function enforces the schema; do not hand-construct the object.

### 9. 事实包产出

When all phases are complete, write the stage-result with a structured facts package (FR-PKG-001/002/003). The three required keys are:

- `facts.changed` — **array** of changed file paths (one entry per file, not a comma-joined string).
- `facts.tests` — **struct** with at minimum `{ passed: <n>, total: <n>, files: [...], command: <string>, risk_level: <P0|P1|P2|P3|null> }`. The `command` field is required for verify-code downstream consumption (M9 C1). For multi-phase tasks, also include `phases: [{ phase_id, risk_level }, ...]` so each phase's risk level is traceable (FR-RISK-001).
- `facts.review` — **struct** produced by `buildReviewFact` (see §8 above).

Write the stage-result to a durable task path (not a temp file) so downstream stages can read it. The path must be resolved via `parseTaskDir` (AC-16): `{taskDir}/{task-id}/stage-result-build-code.json`. Do not hard-code `tasks/{task-id}/`.

Example shape:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "changed": ["core/text-utils.mjs", "tests/text-utils.test.mjs"],
    "tests": { "passed": 12, "total": 12, "files": ["tests/text-utils.test.mjs"], "command": "pnpm exec vitest run tests/text-utils.test.mjs", "risk_level": "P1", "phases": [{ "phase_id": "phase-1", "risk_level": "P1" }] },
    "review": { "status": "executed", "source": "third_party", "verdict": "pass", "artifact_path": "{taskDir}/{task-id}/reviews/build-code-phase-1.md" }
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "All phases implemented with RED→GREEN evidence and 3rd-review pass."
}
```

### 10. metrics 記録

Record metrics via `metrics/collector.mjs`. Call `recordSkeleton` at stage start (before any implementation work) and `updateOwnResult` at stage end (after the stage-result is written). Fields must align with the M4 record-schema:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "build-code",
  "stage": "build-code",
  "skill_version": "1.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": false,
  "friction_ref": null
}
```

Do not hand-write a raw jsonl line. Use the collector API only.

### 11. P0-P3 风险定级 (FR-RISK-001)

During §1 pre-read, inspect `facts.tasks` for the ordered phase list. Each phase descriptor may carry a `risk_level` field (P0, P1, P2, P3). Derive and record the risk level as follows:

1. If `phase.risk_level` is present and is one of `P0|P1|P2|P3`, use it.
2. If it is missing, malformed, or out of range, log a non-blocking warning and default to `P2`. Do **not** halt build-code because of a classification failure.
3. Write the current phase's `risk_level` into the per-phase evidence:
   - `phase-N-RED.json` must contain `risk_level` (capture.mjs writes this field; see §2).
   - `phase-N-GREEN.json` must contain `risk_level`, `base_sha`, `head_sha`, and `commit_sha` (capture.mjs writes these fields; see §2 and §15). At GREEN capture time the commit has usually not happened yet, so `commit_sha` will be `null`; the coordinator backfills it after the final commit. `base_sha` and `head_sha` reflect the working tree state and are available immediately.
4. When assembling the stage-result, set `facts.tests.risk_level` to the current phase's level and append `{ phase_id, risk_level }` to `facts.tests.phases` for multi-phase traceability.

**P0 coverage prompt:** For any phase classified as `P0`, emit an explicit log line such as:

```
[P0-risk] phase <phase_id>: behavior must be covered by tests in the current phase.
```

This log is a traceability record, not a blocking gate. Classification failures are recorded in `missing_items` or phase notes, never used to stop execution.

### 12. L2 集成冒烟 (FR-SMOKE-001)

After **all** implementation phases have GREEN evidence, trigger an L2 integration smoke step before writing the final stage-result.

1. Dispatch the agenthub `test-routing-advisor` skill as an independent subagent in its own context.
   - Cross-repo lock: `https://github.com/Hugh4424/AgentHub.git` at commit `f59b4b471df3522fcf46ec4f01c78874c90ded3c`, path `packages/core/agenthub/skills/test-routing-advisor/SKILL.md`.
   - Pass the task context (changed files, phase count, test command) so the advisor can select a tier.
2. The advisor selects one of three routing tiers: `simple`, `feature`, or `fullstack`.
3. Persist the report to `{taskDir}/{task-id}/evidence/l2-integration-test-report.json` with exactly these fields:
   - `routing_tier`: one of `simple|feature|fullstack`
   - `routing_rationale`: non-empty string explaining why this tier was chosen (traceability requirement AC-SMOKE-003)
   - `result`: `pass` or `fail`
   - `ts`: ISO-8601 timestamp
4. If the smoke run fails or the advisor cannot be reached, record the failure in `missing_items` and continue. L2 smoke is a fact-recording step, not a blocking gate.

### 13. 两阶段独立审查拆分 (FR-REVIEW-001)

Replace the single post-GREEN 3rd-review call with two independent subagent invocations. They must run in separate contexts so that a failure in one does not terminate the other.

**Subagent 1 — spec compliance review:**

- Input: the real `git diff` for the current phase and the relevant spec/plan excerpts.
- Output: `{taskDir}/{task-id}/evidence/phase-N-spec-compliance-verdict.md` (include the phase number so multi-phase tasks do not overwrite earlier verdicts).
- Verdict shape: `verdict` (`pass`, `revise_required`, or `escalate_to_human`), `findings` array.
- Scope only: does the change satisfy the spec? No code-quality judgments.

**Subagent 2 — code quality review:**

- Input: the real `git diff` for the current phase.
- Output: `{taskDir}/{task-id}/evidence/phase-N-code-quality-verdict.md` (include the phase number so multi-phase tasks do not overwrite earlier verdicts).
- Verdict shape: `verdict` (`pass`, `revise_required`, or `escalate_to_human`), `findings` array.
- Scope only: code quality, style, and maintainability. No spec-compliance judgments.

**Orchestrator handling:**

- Dispatch both subagents in parallel via the available backend.
- Wait for both to finish, even if one errors or returns `revise_required`.
- Read both verdict files.
- Aggregate the two verdicts into a single `facts.review` struct using `buildReviewFact`:
  - `pass` only if both subagents return `pass`.
  - `revise_required` if at least one returns `revise_required` and neither returns `escalate_to_human`.
  - `escalate_to_human` if either subagent returns `escalate_to_human`. A direct `escalate_to_human` from a subagent is treated as a C-class escalation: produce the escalation record, pause automatic progression, and wait for human confirmation (see §14).
- The `artifact_path` should point to a durable combined report (e.g. `{taskDir}/{task-id}/reviews/build-code-phase-N.md`) that references the two underlying verdict files.

If the 3rd-review skill is unavailable for either subagent, downgrade that side to `same_source` review and record the degraded source.

### 14. verdict-handler A/B/C 升级分类 (FR-REVIEW-002)

Track the per-subagent verdict history after each review round. Classify the response into three categories. If a subagent returns `escalate_to_human` directly in any round, treat it as C-class escalation immediately (skip A and B).

| Class | Condition | Action |
|---|---|---|
| A | Subagent returns `pass`. | Proceed to the next phase. |
| B | Subagent returns `revise_required` and the consecutive count for that same subagent on the same phase is **1 or 2**. | Return to implementation, address findings, re-run GREEN + two-stage review. |
| C | The **same subagent** returns `revise_required` **3 times in a row** for the same phase. | Trigger `escalate_to_human`. |

**Escalation behavior (C-class):**

1. Produce a structured escalation record at `{taskDir}/{task-id}/evidence/escalation-record.json` containing:
   - `phase_id`
   - `subagent`: `spec-compliance` or `code-quality`
   - `consecutive_revises`: 3
   - `verdict_files`: paths to the three verdict files
   - `summary`: brief human-readable summary of the repeated findings
   - `ts`: ISO-8601 timestamp
2. Set `facts.review.verdict` to `escalate_to_human`.
3. **Pause automatic progression and wait for explicit human confirmation** before continuing. Do not silently loop back into another implementation/review round. This is enforced by AC-REVIEW-006.

The escalation record is a durable artifact for downstream traceability.

### 15. 原子提交留痕 (FR-COMMIT-001)

**Commit authority:** The orchestrating skill (this SKILL.md / the build-code coordinator) owns the commit decision. Implementation subagents must **never** run `git commit` themselves.

Explicit instruction to pass to every implementation subagent:

> DO NOT commit. Leave changes in the working tree.

**Commit timing:**

- Commit only at a semantic completion point: all phases are GREEN, two-stage review passes (no `revise_required` or `escalate_to_human`), and L2 smoke has been recorded.
- The coordinator computes `base_sha` and `head_sha` before and after the commit, and captures the resulting `commit_sha`.

**Evidence fields:**

`capture.mjs` writes the following into every `phase-N-GREEN.json` (values are `null` if not available at the time of capture):

- `commit_sha`
- `base_sha`
- `head_sha`
- `risk_level`

These fields are required by the evidence contract (see §11). When the coordinator finally commits, it should also record `commit_sha`, `base_sha`, and `head_sha` in the stage-result notes or in a dedicated `commit_record` fact.

### 16. worktree.json 复用协议 (FR-WORKTREE-001)

Before starting implementation, locate the worktree descriptor at `{taskDir}/{task-id}/worktree.json`.

**Normal paths:**

1. **File exists and is valid JSON** with a valid `worktree_root` pointing to an existing directory → reuse it. Do not re-clone or re-checkout.
2. **File does not exist** → create the worktree following the make-decision stage rules, then write a valid `worktree.json`.

**Exception paths:**

3. **Corrupted file:** If `worktree.json` cannot be parsed as JSON, or if `worktree_root` is missing / not a string / empty string / points to a non-existent path / is not a git worktree directory, do **not** read the corrupted content and do **not** guess a path. Trigger `escalate_to_human`, stop build-code progression, and record the corruption details in `missing_items`.
4. **Checkout failure:** If creating the worktree fails, do **not** write a half-baked `worktree.json` file. Leave the file absent or keep the previous valid version, surface the error, and stop.

The `worktree_root` config key passed to this skill (see §5) must always match the path recorded in `worktree.json`. Never resolve upward to the host agenthub repo directory.
