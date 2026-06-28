You are doing a heterologous, independent, cross-engine code review.

## Context

workflowhub: microkernel orchestrator for an AI dev workflow. `config/workflowhub.yaml` has a `registry:` array mapping each workflow component to a path; the kernel uses it to resolve and dispatch components. `reuse-registry.md` is a provenance table (skill name | reuse category | source path) tracking where each skill came from, for traceability and external-dependency update checks.

This change (Phase 4 of build-code for M11) registers two new skills — spec-specify and spec-clarify (adapted from speckit-specify / speckit-clarify) — that were created earlier in this task at `workflows/spec-specify/SKILL.md` and `workflows/spec-clarify/SKILL.md`.

## Requirements being satisfied

- FR-REGISTRY-001: both new skills must be registered in reuse-registry.md.
- FR-REGISTRY-002: each reuse-registry row must have a non-empty source path and a valid category enum value. The valid category for an adapted external skill is "外部改造适配".
- M2 kernel requirement: a workflowhub-internal workflow must be listed in config/workflowhub.yaml registry (component_id / workflow / path) to be dispatchable.
- AC6: the new skills' own identity must NOT use the `speckit-*` prefix (they are renamed to spec-*); a source attribution mentioning speckit-* is allowed only as provenance, not as the skill's own name.

## What to check

1. Are both spec-specify and spec-clarify added to config/workflowhub.yaml registry with the correct 3-key shape (component_id / workflow / path), matching the existing entries' format and indentation, and placed INSIDE the registry: array (before task_dir:)?
2. Are both rows added to reuse-registry.md with category exactly "外部改造适配" and a non-empty source path, matching the existing 3-column table format?
3. Do the paths point to the real files (workflows/spec-specify/SKILL.md, workflows/spec-clarify/SKILL.md)?
4. Any existing entry accidentally modified or removed?
5. Any AC6 violation (a `speckit-*` string used as the registered component identity rather than as a source-path provenance note)?

## Verdict format

End with EXACTLY one of these three verdicts on its own line:
- `VERDICT: pass` — no blocking issues.
- `VERDICT: revise_required` — list each blocking issue as B1, B2, ... with exact location and required fix.
- `VERDICT: escalate_to_human` — a judgment call only a human should make.

Be adversarial and concrete. If no blocking issue, return pass.

## The diff under review

```diff
diff --git a/config/workflowhub.yaml b/config/workflowhub.yaml
index 1852503..229e227 100644
--- a/config/workflowhub.yaml
+++ b/config/workflowhub.yaml
@@ -27,6 +27,12 @@ registry:
   - component_id: decision-log
     workflow: decision-log
     path: workflows/decision-log/SKILL.md
+  - component_id: spec-specify
+    workflow: spec-specify
+    path: workflows/spec-specify/SKILL.md
+  - component_id: spec-clarify
+    workflow: spec-clarify
+    path: workflows/spec-clarify/SKILL.md
 
 # task_dir: framework config — the task-execution-record directory. M2 only
 # declares it as a static config entry; it is resolved through the single path
diff --git a/reuse-registry.md b/reuse-registry.md
index 82f4a90..5853d92 100644
--- a/reuse-registry.md
+++ b/reuse-registry.md
@@ -13,3 +13,5 @@
 | 3rd-review | 外部依赖 | packages/core/agenthub/skills/3rd-review |
 | TDD 件（capture.mjs） | 外部改造适配 | tdd-red-green skill |
 | `isolated-browser-qa` | 改造适配 | `~/.claude/skills/isolated-browser-qa` |
+| spec-specify | 外部改造适配 | ~/.claude/skills/speckit-specify/SKILL.md |
+| spec-clarify | 外部改造适配 | ~/.claude/skills/speckit-clarify/SKILL.md |

```
