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

   where `<outputPath>` is `specs/{task-id}/evidence/phase-N-RED.json`. The command exits non-zero when tests fail (RED is valid); `capture.mjs` records stdout, exit code, content hash, and anomaly flags.
3. **Implement** the minimum code needed to make the tests pass. Do not add production code unrelated to the failing tests.
4. **Collect GREEN evidence** — run capture.mjs again with `<outputPath>` set to `specs/{task-id}/evidence/phase-N-GREEN.json`.
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

### 6. Worker-Mode 子代理

Use Worker-Mode to spawn an implementer worker for the actual code-writing work. Worker-Mode is an external semver dependency — version-pin it in the skill config and do not inline its logic.

When dispatching to the worker:

- Pass **ABSOLUTE paths** for all file references (source files, evidence output paths, task dir).
- Explicitly forbid the worker from running `git commit` — include the instruction `DO NOT commit. Leave changes in the working tree.` in the worker prompt (FR-SUB-002).
- The worker returns its output; the orchestrating skill (this SKILL.md) reads it and proceeds to the next step.

### 7. 3rd-review standalone

After GREEN evidence is confirmed for a phase, call the **3rd-review standalone entry**. Feed the real `git diff` output (not a natural-language description of the change — using prose triggers the same-source downgrade path in 3rd-review's classifier).

Consume the 3-state verdict:

- `pass` — proceed to the next phase.
- `revise_required` — return to implementation and address findings before re-running GREEN + 3rd-review.
- `escalate_to_human` — halt and present the finding summary to the user; do not auto-resolve.

If the 3rd-review skill is unavailable (not installed or not reachable), downgrade gracefully to `same_source` review and record `facts.review.source = "same_source"` so downstream stages can detect the degraded state.

### 8. facts.review 产出

After 3rd-review completes for each phase, construct the review fact using `facts-schema.mjs`:

```js
import { buildReviewFact } from "./facts-schema.mjs";
// When review ran successfully:
const reviewFact = buildReviewFact({ status: "executed", source, verdict, artifactPath });
// source must be "third_party" or "same_source"; verdict must be "pass" | "revise_required" | "escalate_to_human"
// artifactPath is the durable path to the review report, e.g. "specs/{task-id}/reviews/build-code-phase-N.md"

// When review was skipped or could not run:
// const reviewFact = buildReviewFact({ status: "not_executed" });
```

Write the result into `stage-result` under the `facts.review` key. The `buildReviewFact` function enforces the schema; do not hand-construct the object.

### 9. 事实包产出

When all phases are complete, write the stage-result with a structured facts package (FR-PKG-001/002/003). The three required keys are:

- `facts.changed` — **array** of changed file paths (one entry per file, not a comma-joined string).
- `facts.tests` — **struct** with at minimum `{ passed: <n>, total: <n>, files: [...] }`. Must include `command` field (the test command string that was executed) for verify-code downstream consumption (M9 C1).
- `facts.review` — **struct** produced by `buildReviewFact` (see §8 above).

Write the stage-result to a durable task path (not a temp file) so downstream stages can read it. The exact path follows the project convention: `specs/{task-id}/stage-result-build-code.json`.

Example shape:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "changed": ["core/text-utils.mjs", "tests/text-utils.test.mjs"],
    "tests": { "passed": 12, "total": 12, "files": ["tests/text-utils.test.mjs"], "command": "pnpm exec vitest run tests/text-utils.test.mjs" },
    "review": { "status": "executed", "source": "third_party", "verdict": "pass", "artifact_path": "specs/{task-id}/reviews/build-code-phase-1.md" }
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
