# Legacy M14b worktree: unmerged delta

Preserved from the dirty worktree `task/workflowhub/m14b-fact-collection` before
its removal. These changes are not in the accepted M14b commit `b61e336` and
are not required by the merged M14b tests. They are retained here rather than
silently changing the active M14a contract.

```diff
diff --git a/specs/m14a-audit-contract-layer/execution-trace.schema.json b/specs/m14a-audit-contract-layer/execution-trace.schema.json
index 7d3a157..998e511 100644
--- a/specs/m14a-audit-contract-layer/execution-trace.schema.json
+++ b/specs/m14a-audit-contract-layer/execution-trace.schema.json
@@ -10,6 +10,8 @@
     "stage",
     "step_id",
     "attempt_id",
+    "source",
+    "skill_id",
     "skill",
     "skill_version",
     "task_id",
@@ -31,9 +33,11 @@
     "stage": { "type": "string", "minLength": 1, "description": "Workflow stage identity." },
     "step_id": { "type": "string", "minLength": 1, "description": "Step identity within the stage." },
     "attempt_id": { "type": "string", "minLength": 1, "description": "Unique execution attempt identity." },
+    "source": { "type": "string", "minLength": 1, "description": "Stable source namespace used in the skill aggregation key." },
+    "skill_id": { "type": "string", "minLength": 1, "description": "Stable skill identity used in the skill aggregation key." },
     "parent_step_id": { "type": ["string", "null"], "description": "Parent step identity when this step is nested." },
     "skill": { "type": "string", "minLength": 1, "description": "Skill used by this execution." },
-    "skill_version": { "type": "string", "minLength": 1, "description": "Version of the skill contract used by this execution." },
+    "skill_version": { "type": "string", "minLength": 1, "description": "Version of the skill contract used by this execution; together with source and skill_id it forms the stable skill aggregation key." },
     "agent_id": { "type": ["string", "null"] },
     "issue_id": { "type": ["string", "null"] },
     "task_id": { "type": "string", "minLength": 1, "description": "Canonical task identity." },
diff --git a/specs/m14a-audit-contract-layer/skills-inventory.schema.json b/specs/m14a-audit-contract-layer/skills-inventory.schema.json
index a50a956..8c115b7 100644
--- a/specs/m14a-audit-contract-layer/skills-inventory.schema.json
+++ b/specs/m14a-audit-contract-layer/skills-inventory.schema.json
@@ -13,7 +13,13 @@
       "type": "array",
       "items": {
         "type": "object",
-        "additionalProperties": false,
+        "description": "Canonical skill metadata plus M14b extensions such as origin, local_changes, and metrics_enabled; per-skill machine entrypoints remain forbidden.",
+        "additionalProperties": true,
+        "propertyNames": {
+          "not": {
+            "enum": ["command", "runtime", "entrypoint", "index.mjs"]
+          }
+        },
         "required": [
           "name",
           "path",
diff --git a/specs/m14a-audit-contract-layer/spec.md b/specs/m14a-audit-contract-layer/spec.md
index 3cdc513..8c115b7 100644
--- a/specs/m14a-audit-contract-layer/spec.md
+++ b/specs/m14a-audit-contract-layer/spec.md
@@ -90,7 +90,7 @@
 ### 域：CONTRACT（审计契约）

 - **FR-CONTRACT-001**：系统必须定义 execution trace 契约字段，覆盖身份与层次、执行上下文、时间与结果、事实引用四类字段。来源：D1。
-  - **场景**：Given 下游需要实现执行记录，When 读取契约字段表，Then 能看到 `run_id`、`session_id`、`stage`、`step_id`、`attempt_id`、`parent_step_id`、`skill`、`skill_version`、`agent_id`、`issue_id`、`task_id`、`task_dir`、`target_repo_root`、`worktree_root`、`branch`、`started_at`、`completed_at`、`status`、`exit_code`、`duration_ms`、`retry_of`、`transcript_refs`、`artifact_refs`、`facts_refs`、`provenance`、`schema_version`、`collector_version`。
+  - **场景**：Given 下游需要实现执行记录，When 读取契约字段表，Then 能看到 `run_id`、`session_id`、`stage`、`step_id`、`attempt_id`、`source`、`skill_id`、`parent_step_id`、`skill`、`skill_version`、`agent_id`、`issue_id`、`task_id`、`task_dir`、`target_repo_root`、`worktree_root`、`branch`、`started_at`、`completed_at`、`status`、`exit_code`、`duration_ms`、`retry_of`、`transcript_refs`、`artifact_refs`、`facts_refs`、`provenance`、`schema_version`、`collector_version`。
@@ -275,6 +275,8 @@
 | `stage` | workflow | stage runner | machine | stage timeline | stage context |
 | `step_id` | workflow | stage/skill | machine or declared | step timeline | skill contract |
 | `attempt_id` | workflow | retry controller | machine | retry chain | runtime facts |
+| `source` | skill | collector/runtime adapter | machine or declared | skill aggregation | frozen source metadata |
+| `skill_id` | skill | stage/skill registry | declared | skill aggregation | skill registry |
 | `parent_step_id` | workflow | stage/skill | machine or declared | hierarchy | skill contract |
 | `skill` | skill | stage/skill | declared | skill inventory | SKILL.md |
 | `skill_version` | skill | skill author | declared | audit/version view | SKILL.md frontmatter |
diff --git a/tests/m14a-audit-contract-layer.test.mjs b/tests/m14a-audit-contract-layer.test.mjs
index f36cd71..f05ec3d 100644
--- a/tests/m14a-audit-contract-layer.test.mjs
+++ b/tests/m14a-audit-contract-layer.test.mjs
@@ -13,7 +13,7 @@
 const surfaces = read("specs/m14a-audit-contract-layer/harness-surface.md");
 const spec = read("specs/m14a-audit-contract-layer/spec.md");

 const traceRequired = [
-  "run_id", "session_id", "stage", "step_id", "attempt_id", "skill", "skill_version",
+  "run_id", "session_id", "stage", "step_id", "attempt_id", "source", "skill_id", "skill", "skill_version",
   "task_id", "task_dir", "worktree_root", "started_at", "status", "transcript_refs",
   "artifact_refs", "facts_refs", "provenance", "schema_version", "collector_version",
   "collector_supported_schema_versions",
@@ -73,10 +73,11 @@ describe("M14a audit contract layer", () => {
     ]);
   });

-  it("keeps skills inventory as metadata, with no per-skill execution interface", () => {
+  it("allows M14b inventory metadata extensions without declaring an execution interface", () => {
     const skill = inventory.properties.skills.items;
     expect(inventory.required).toEqual(["schema_version", "generated_at", "skills"]);
-    expect(skill.additionalProperties).toBe(false);
+    expect(skill.additionalProperties).toBe(true);
+    expect(skill.propertyNames.not.enum).toEqual(["command", "runtime", "entrypoint", "index.mjs"]);
     expect(skill.required).toEqual([
       "name", "path", "version", "stage", "owner", "source",
       "portable", "metrics_expected", "subagent_friendly",
@@ -87,6 +88,12 @@ describe("M14a audit contract layer", () => {
     }
   });

+  it("carries the complete D10 skill aggregation key", () => {
+    expect(trace.required).toEqual(expect.arrayContaining(["source", "skill_id", "skill_version"]));
+    expect(trace.properties.source).toMatchObject({ type: "string", minLength: 1 });
+    expect(trace.properties.skill_id).toMatchObject({ type: "string", minLength: 1 });
+  });
+
   it("makes every declared required read non-empty", () => {
     expect(inventory.properties.skills.items.properties.required_reads).toMatchObject({
       type: "array", items: { type: "string", minLength: 1 },
```

## Untracked ADR

```markdown
# M14b fact identity and review semantics

M14b keeps fact collection deterministic and non-blocking: missing or unreadable evidence is recorded as `missing`/`unknown`, never inferred by an LLM. Skill aggregation uses the stable key `source + skill_id + version`, so the execution-trace contract carries `source` and `skill_id`; the skills inventory deliberately permits M14b metadata extensions such as origin, local changes, and metrics fields instead of freezing the M14a field set.

Review execution and review independence are separate facts. `review_invoked` records a structured invocation, including an allowed same-source fallback, while `review_independent_session` is true only when an independent session is proven. This preserves evidence about degraded-but-real review without falsely claiming independence. These choices record the human resolution on ZHI-189 and supersede the conflicting narrower interpretations in the original M14a schema.
```
