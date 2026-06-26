# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-26T11:05:00.251Z

## Original task

review the following diff for workflowhub Phase 4+5 fixes. Context: R2 had 2 remaining blockers: B4 (dangling script refs in isolated-browser-qa.md) and B5 (FR-TEST-002 placeholder). The fixes are:

B4 fix: Removed all executable bash $VERIFY_CODE_DIR/.../scripts/browser-qa-*.sh lines from isolated-browser-qa.md. Remaining .sh refs are only: scripts/stop-services.sh (generic safety rule, not a missing file) and doc section listing scripts as 'documented for future implementation'.

B5 fix: FR-TEST-002-evidence.md now honestly states evidence is pending M9 self-bootstrap. Design rationale per D-M9-7/F10: FR-TEST-002 is satisfied by actual self-bootstrap run of verify-code, which produces stage-result-verify-code.json. No separate E2E framework should be built (F10). This evidence file documents what the evidence WILL be, not faking it as present.

Please review the diff below for correctness, honesty, and whether the fixes actually address the R2 blockers without introducing new issues. Pay special attention to:
1. Whether removing executable script refs leaves the doc coherent (still has context script eval, doctor, cleanup sections but empty code blocks)
2. Whether 'documented for future implementation' is an honest characterization
3. Whether FR-TEST-002-evidence.md honestly represents pending status vs faking evidence
4. Any new issues introduced by these fixes

Diff:
diff --git a/specs/m9-verify-code/FR-TEST-002-evidence.md b/specs/m9-verify-code/FR-TEST-002-evidence.md
index c9ce253..d0e188e 100644
--- a/specs/m9-verify-code/FR-TEST-002-evidence.md
+++ b/specs/m9-verify-code/FR-TEST-002-evidence.md
@@ -4,6 +4,6 @@ FR-TEST-002 要求 M9 自举端到端实跑（make-decision → build-code → v
 
 按 D-M9-7/F10：不单列实现 task，不堆额外 E2E 框架。
 
-**验收证据**：M9 自举完成后，verify-code 产出的 `stage-result-verify-code.json` 即为端到端实跑证据。
+**验收证据**：M9 自举完成后，verify-code 产出的 `specs/{task-id}/stage-result-verify-code.json` 即为端到端实跑证据。
 
-**状态**：待 M9 自举实跑后落盘。
+**当前状态**：M9 verify-code v1 代码已交付（apply 阶段完成），但自举实跑尚未执行（需在 test-acceptance 或后续会话中运行完整三段闭环）。本文件标注证据 pend，不伪造 pass。
diff --git a/workflows/verify-code/isolated-browser-qa.md b/workflows/verify-code/isolated-browser-qa.md
index 9b0063e..8d8b7eb 100644
--- a/workflows/verify-code/isolated-browser-qa.md
+++ b/workflows/verify-code/isolated-browser-qa.md
@@ -72,7 +72,6 @@ Always start with the bundled context script. The caller must set `VERIFY_CODE_D
 ```bash
 VERIFY_CODE_DIR="${VERIFY_CODE_DIR:-.}"
 export BROWSER_QA_ENGINE="${BROWSER_QA_ENGINE:-agent-browser}"
-eval "$(bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-context.sh" "<url>")"
 ```
 
 The script exports:
@@ -90,7 +89,6 @@ The script exports:
 Run the bundled doctor before browser actions:
 
 ```bash
-bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-doctor.sh" "$BROWSER_QA_ENGINE"
 ```
 
 If the selected engine is missing or broken, repair that engine only. Do not check or launch the other engine as fallback.
@@ -98,7 +96,6 @@ If the selected engine is missing or broken, repair that engine only. Do not che
 ### 3. Cleanup Before Launch
 
 ```bash
-bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-cleanup.sh" "$BROWSER_QA_SESSION" "$BROWSER_QA_ENGINE"
 ```
 
 This cleanup is only for browser automation resources. It must not stop the target app.
@@ -176,7 +173,6 @@ For repair rules, read `references/fallback.md`.
 Always finish with:
 
 ```bash
-bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-cleanup.sh" "$BROWSER_QA_SESSION" "$BROWSER_QA_ENGINE"
 ```
 
 The task is not done until cleanup has run and the target app service is still left running.
@@ -228,10 +224,10 @@ If the selected engine stayed blocked, report:
 
 ## Bundled Resources
 
-- `scripts/browser-qa-context.sh`: derives session, engine, host, allowed domains, auth/profile metadata.
-- `scripts/browser-qa-doctor.sh`: checks selected browser CLI availability.
-- `scripts/browser-qa-cleanup.sh`: closes the selected engine session without stopping app services.
-- `scripts/cleanup-browser-qa.sh`: compatibility wrapper for older calls.
+- `scripts/browser-qa-context.sh` (documented for future implementation): derives session, engine, host, allowed domains, auth/profile metadata.
+- `scripts/browser-qa-doctor.sh` (documented for future implementation): checks selected browser CLI availability.
+- `scripts/browser-qa-cleanup.sh` (documented for future implementation): closes the selected engine session without stopping app services.
+- `scripts/cleanup-browser-qa.sh` (documented for future implementation): compatibility wrapper for older calls.
 - `references/agent-browser.md`: agent-browser command workflow.
 - `references/browser-use.md`: browser-use-specific workflow.
 - `references/auth.md`: login and profile policy.

Return a structured verdict with: pass/blocking/needs-revision, list of findings (each with severity: blocking/major/minor/nit), and specific recommendations if any.

## Final prompt

review the following diff for workflowhub Phase 4+5 fixes. Context: R2 had 2 remaining blockers: B4 (dangling script refs in isolated-browser-qa.md) and B5 (FR-TEST-002 placeholder). The fixes are:

B4 fix: Removed all executable bash $VERIFY_CODE_DIR/.../scripts/browser-qa-*.sh lines from isolated-browser-qa.md. Remaining .sh refs are only: scripts/stop-services.sh (generic safety rule, not a missing file) and doc section listing scripts as 'documented for future implementation'.

B5 fix: FR-TEST-002-evidence.md now honestly states evidence is pending M9 self-bootstrap. Design rationale per D-M9-7/F10: FR-TEST-002 is satisfied by actual self-bootstrap run of verify-code, which produces stage-result-verify-code.json. No separate E2E framework should be built (F10). This evidence file documents what the evidence WILL be, not faking it as present.

Please review the diff below for correctness, honesty, and whether the fixes actually address the R2 blockers without introducing new issues. Pay special attention to:
1. Whether removing executable script refs leaves the doc coherent (still has context script eval, doctor, cleanup sections but empty code blocks)
2. Whether 'documented for future implementation' is an honest characterization
3. Whether FR-TEST-002-evidence.md honestly represents pending status vs faking evidence
4. Any new issues introduced by these fixes

Diff:
diff --git a/specs/m9-verify-code/FR-TEST-002-evidence.md b/specs/m9-verify-code/FR-TEST-002-evidence.md
index c9ce253..d0e188e 100644
--- a/specs/m9-verify-code/FR-TEST-002-evidence.md
+++ b/specs/m9-verify-code/FR-TEST-002-evidence.md
@@ -4,6 +4,6 @@ FR-TEST-002 要求 M9 自举端到端实跑（make-decision → build-code → v
 
 按 D-M9-7/F10：不单列实现 task，不堆额外 E2E 框架。
 
-**验收证据**：M9 自举完成后，verify-code 产出的 `stage-result-verify-code.json` 即为端到端实跑证据。
+**验收证据**：M9 自举完成后，verify-code 产出的 `specs/{task-id}/stage-result-verify-code.json` 即为端到端实跑证据。
 
-**状态**：待 M9 自举实跑后落盘。
+**当前状态**：M9 verify-code v1 代码已交付（apply 阶段完成），但自举实跑尚未执行（需在 test-acceptance 或后续会话中运行完整三段闭环）。本文件标注证据 pend，不伪造 pass。
diff --git a/workflows/verify-code/isolated-browser-qa.md b/workflows/verify-code/isolated-browser-qa.md
index 9b0063e..8d8b7eb 100644
--- a/workflows/verify-code/isolated-browser-qa.md
+++ b/workflows/verify-code/isolated-browser-qa.md
@@ -72,7 +72,6 @@ Always start with the bundled context script. The caller must set `VERIFY_CODE_D
 ```bash
 VERIFY_CODE_DIR="${VERIFY_CODE_DIR:-.}"
 export BROWSER_QA_ENGINE="${BROWSER_QA_ENGINE:-agent-browser}"
-eval "$(bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-context.sh" "<url>")"
 ```
 
 The script exports:
@@ -90,7 +89,6 @@ The script exports:
 Run the bundled doctor before browser actions:
 
 ```bash
-bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-doctor.sh" "$BROWSER_QA_ENGINE"
 ```
 
 If the selected engine is missing or broken, repair that engine only. Do not check or launch the other engine as fallback.
@@ -98,7 +96,6 @@ If the selected engine is missing or broken, repair that engine only. Do not che
 ### 3. Cleanup Before Launch
 
 ```bash
-bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-cleanup.sh" "$BROWSER_QA_SESSION" "$BROWSER_QA_ENGINE"
 ```
 
 This cleanup is only for browser automation resources. It must not stop the target app.
@@ -176,7 +173,6 @@ For repair rules, read `references/fallback.md`.
 Always finish with:
 
 ```bash
-bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-cleanup.sh" "$BROWSER_QA_SESSION" "$BROWSER_QA_ENGINE"
 ```
 
 The task is not done until cleanup has run and the target app service is still left running.
@@ -228,10 +224,10 @@ If the selected engine stayed blocked, report:
 
 ## Bundled Resources
 
-- `scripts/browser-qa-context.sh`: derives session, engine, host, allowed domains, auth/profile metadata.
-- `scripts/browser-qa-doctor.sh`: checks selected browser CLI availability.
-- `scripts/browser-qa-cleanup.sh`: closes the selected engine session without stopping app services.
-- `scripts/cleanup-browser-qa.sh`: compatibility wrapper for older calls.
+- `scripts/browser-qa-context.sh` (documented for future implementation): derives session, engine, host, allowed domains, auth/profile metadata.
+- `scripts/browser-qa-doctor.sh` (documented for future implementation): checks selected browser CLI availability.
+- `scripts/browser-qa-cleanup.sh` (documented for future implementation): closes the selected engine session without stopping app services.
+- `scripts/cleanup-browser-qa.sh` (documented for future implementation): compatibility wrapper for older calls.
 - `references/agent-browser.md`: agent-browser command workflow.
 - `references/browser-use.md`: browser-use-specific workflow.
 - `references/auth.md`: login and profile policy.

Return a structured verdict with: pass/blocking/needs-revision, list of findings (each with severity: blocking/major/minor/nit), and specific recommendations if any.

## Raw output

```text
**Verdict: blocking**

| Severity | Finding | Location | Why it matters |
|---|---|---|---|
| blocking | B4 未真正关闭 | [isolated-browser-qa.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md:70) | 正文仍要求运行不存在的 bundled context script |
| blocking | 空代码块造成不可执行规范 | [isolated-browser-qa.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md:89) | doctor/cleanup/finish 章节说“运行”，但命令为空 |
| major | “Bundled Resources” 表述不诚实 | [isolated-browser-qa.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md:225) | 文件不存在，却仍放在 bundled resources 下 |
| major | 安全规则仍假设 bundled scripts 存在 | [isolated-browser-qa.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md:199) | 与“future implementation”矛盾 |
| minor | FR-TEST-002 表述基本诚实，但可更精确 | [FR-TEST-002-evidence.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/FR-TEST-002-evidence.md:7) | 建议同时写出 M9 自举的具体预期路径 |

**具体问题**

B4 的修复只删除了可执行命令行，但没有删除“必须使用 bundled scripts”的规范语义。现在文档读起来是：必须运行 context script、doctor、cleanup；但代码块是空的，且本地确认这些脚本目录和文件都不存在。这样会把 blocker 从“dangling executable refs”变成“dangling mandatory process refs”。

“documented for future implementation”本身可以诚实，但不能放在 `Bundled Resources` 下面。`Bundled` 的含义是当前随包提供。更诚实的写法是改成 `Planned Resources` / `Future Resources`，并明确“not available in this version; do not call these paths”。

FR-TEST-002 这份 evidence 文件没有伪造 pass。它明确说自举尚未执行、证据 pending，这个方向是对的。小问题是 `specs/{task-id}/stage-result-verify-code.json` 是通用契约；对 M9 自举验收，最好补一句具体预期路径：`specs/m9-verify-code/stage-result-verify-code.json`，与 tasks.md 里的验收出口保持一致。

**推荐修正**

**推荐方案：把 isolated-browser-qa.md 改成“无脚本 v1”文档。**

1. 删除或改写“Always start with the bundled context script”。
2. 删除“Run the bundled doctor”和“Always finish with bundled cleanup script”的强制说法。
3. 删除空 bash code block。
4. 把 `Bundled Resources` 改成 `Planned Resources`，并写明这些脚本当前未实现、不得调用。
5. 把 line 199 的“this skill provides bundled scripts”改掉，因为当前并不提供。

可选方案是直接补齐这些脚本，但这会扩大 Phase 4+5 修复范围，也违背你给出的 F10 风格：不为文档 blocker 临时堆框架。

**FR-TEST-002 结论**

B5 基本通过。它诚实表达了 pending 状态，没有假装已有 evidence。建议只做一个小修：把 “pend” 改成 “pending”，并补上 M9 自举的具体证据路径。


2026-06-26T11:03:54.360413Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T11:03:54.360468Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T11:03:54.360470Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T11:03:54.360471Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T11:03:54.360473Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T11:03:54.360474Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T11:03:54.360475Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T11:03:54.360477Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T11:03:54.360478Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T11:03:54.360479Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T11:03:54.360480Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T11:03:54.360482Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: medium
reasoning summaries: none
session id: 019f0399-b727-7df1-b5d5-d8a64f5e6a34
--------
user
review the following diff for workflowhub Phase 4+5 fixes. Context: R2 had 2 remaining blockers: B4 (dangling script refs in isolated-browser-qa.md) and B5 (FR-TEST-002 placeholder). The fixes are:

B4 fix: Removed all executable bash $VERIFY_CODE_DIR/.../scripts/browser-qa-*.sh lines from isolated-browser-qa.md. Remaining .sh refs are only: scripts/stop-services.sh (generic safety rule, not a missing file) and doc section listing scripts as 'documented for future implementation'.

B5 fix: FR-TEST-002-evidence.md now honestly states evidence is pending M9 self-bootstrap. Design rationale per D-M9-7/F10: FR-TEST-002 is satisfied by actual self-bootstrap run of verify-code, which produces stage-result-verify-code.json. No separate E2E framework should be built (F10). This evidence file documents what the evidence WILL be, not faking it as present.

Please review the diff below for correctness, honesty, and whether the fixes actually address the R2 blockers without introducing new issues. Pay special attention to:
1. Whether removing executable script refs leaves the doc coherent (still has context script eval, doctor, cleanup sections but empty code blocks)
2. Whether 'documented for future implementation' is an honest characterization
3. Whether FR-TEST-002-evidence.md honestly represents pending status vs faking evidence
4. Any new issues introduced by these fixes

Diff:
diff --git a/specs/m9-verify-code/FR-TEST-002-evidence.md b/specs/m9-verify-code/FR-TEST-002-evidence.md
index c9ce253..d0e188e 100644
--- a/specs/m9-verify-code/FR-TEST-002-evidence.md
+++ b/specs/m9-verify-code/FR-TEST-002-evidence.md
@@ -4,6 +4,6 @@ FR-TEST-002 要求 M9 自举端到端实跑（make-decision → build-code → v
 
 按 D-M9-7/F10：不单列实现 task，不堆额外 E2E 框架。
 
-**验收证据**：M9 自举完成后，verify-code 产出的 `stage-result-verify-code.json` 即为端到端实跑证据。
+**验收证据**：M9 自举完成后，verify-code 产出的 `specs/{task-id}/stage-result-verify-code.json` 即为端到端实跑证据。
 
-**状态**：待 M9 自举实跑后落盘。
+**当前状态**：M9 verify-code v1 代码已交付（apply 阶段完成），但自举实跑尚未执行（需在 test-acceptance 或后续会话中运行完整三段闭环）。本文件标注证据 pend，不伪造 pass。
diff --git a/workflows/verify-code/isolated-browser-qa.md b/workflows/verify-code/isolated-browser-qa.md
index 9b0063e..8d8b7eb 100644
--- a/workflows/verify-code/isolated-browser-qa.md
+++ b/workflows/verify-code/isolated-browser-qa.md
@@ -72,7 +72,6 @@ Always start with the bundled context script. The caller must set `VERIFY_CODE_D
 ```bash
 VERIFY_CODE_DIR="${VERIFY_CODE_DIR:-.}"
 export BROWSER_QA_ENGINE="${BROWSER_QA_ENGINE:-agent-browser}"
-eval "$(bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-context.sh" "<url>")"
 ```
 
 The script exports:
@@ -90,7 +89,6 @@ The script exports:
 Run the bundled doctor before browser actions:
 
 ```bash
-bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-doctor.sh" "$BROWSER_QA_ENGINE"
 ```
 
 If the selected engine is missing or broken, repair that engine only. Do not check or launch the other engine as fallback.
@@ -98,7 +96,6 @@ If the selected engine is missing or broken, repair that engine only. Do not che
 ### 3. Cleanup Before Launch
 
 ```bash
-bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-cleanup.sh" "$BROWSER_QA_SESSION" "$BROWSER_QA_ENGINE"
 ```
 
 This cleanup is only for browser automation resources. It must not stop the target app.
@@ -176,7 +173,6 @@ For repair rules, read `references/fallback.md`.
 Always finish with:
 
 ```bash
-bash "$VERIFY_CODE_DIR/workflows/verify-code/isolated-browser-qa/scripts/browser-qa-cleanup.sh" "$BROWSER_QA_SESSION" "$BROWSER_QA_ENGINE"
 ```
 
 The task is not done until cleanup has run and the target app service is still left running.
@@ -228,10 +224,10 @@ If the selected engine stayed blocked, report:
 
 ## Bundled Resources
 
-- `scripts/browser-qa-context.sh`: derives session, engine, host, allowed domains, auth/profile metadata.
-- `scripts/browser-qa-doctor.sh`: checks selected browser CLI availability.
-- `scripts/browser-qa-cleanup.sh`: closes the selected engine session without stopping app services.
-- `scripts/cleanup-browser-qa.sh`: compatibility wrapper for older calls.
+- `scripts/browser-qa-context.sh` (documented for future implementation): derives session, engine, host, allowed domains, auth/profile metadata.
+- `scripts/browser-qa-doctor.sh` (documented for future implementation): checks selected browser CLI availability.
+- `scripts/browser-qa-cleanup.sh` (documented for future implementation): closes the selected engine session without stopping app services.
+- `scripts/cleanup-browser-qa.sh` (documented for future implementation): compatibility wrapper for older calls.
 - `references/agent-browser.md`: agent-browser command workflow.
 - `references/browser-use.md`: browser-use-specific workflow.
 - `references/auth.md`: login and profile policy.

Return a structured verdict with: pass/blocking/needs-revision, list of findings (each with severity: blocking/major/minor/nit), and specific recommendations if any.
2026-06-26T11:03:55.261017Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
我会按 `review` 技能做一次只看风险的复审，重点放在这两个 blocker 是否真正关闭，以及有没有新的文档/验收语义问题。
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
/bin/bash -lc 'pwd && git status --short' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
/Users/Hugh/Hugh/Project/workflowhub

codex
我先核对本地文件上下文，而不是只看 patch 片段；这能判断删掉命令后章节是否还可执行、是否出现“空壳说明”。
exec
/bin/bash -lc "sed -n '1,280p' workflows/verify-code/isolated-browser-qa.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
# Isolated Browser QA

This skill is the browser QA gateway for local, preview, and staging checks.

It is a router, not a wrapper around one browser tool.

## Core Rules

1. Use exactly one engine for the whole QA run.
2. Default to `agent-browser` for local Coding Agent QA.
3. Use `browser-use` only when the user explicitly needs Chrome profile reuse, Browser Use Cloud, Python-agent workflows, or browser-use-specific tasks.
4. Derive one project session and reuse it for the whole QA run.
5. Repair the selected engine only. Do not switch engines during the same run.
6. Resolve bundled scripts from this workflow directory, not from the current repo.
7. Run bundled cleanup before and after QA.
8. Cleanup must never stop the user's app service, dev server, worktree, or local stack.
9. Stay headless by default.
10. Do not auto-attach to the user's live Chrome or main profile.
11. Treat browser automation as memory-expensive: keep one derived session per task and verify residual browser processes after cleanup.
12. Do not use Playwright MCP from this skill. If the selected CLI engine is blocked, stop and report the blocker.

## When To Use

Use this skill for:

- localhost checks
- preview or staging QA
- browser acceptance after implementation
- screenshot acceptance with interaction
- multi-step flow verification
- UI bug reproduction
- console, network, storage, and basic performance inspection
- checking a deployed page that still needs interaction

Do not lead with this skill for:

- one public page screenshot with no interaction
- one quick public DOM check with no meaningful interaction

## Engine Router

Pick one engine before any browser action. The selected engine is exclusive.

Use `agent-browser` for:

- local web app smoke tests
- UI bug reproduction
- form clicking and filling
- screenshot acceptance
- console, network, HAR, cookies, localStorage, or sessionStorage inspection
- auth vault flows
- test-oriented workflows using `snapshot -i` and `@ref` selectors
- default localhost and preview QA

Use `browser-use` for:

- user-requested Chrome profile reuse
- Browser Use Cloud
- Python Agent / LLM-driven browser tasks
- browser-use-specific templates, tasks, or APIs

Do not use `browser-use` as an automatic fallback from `agent-browser`.

Do not use Playwright MCP as a fallback from either CLI. Playwright MCP is outside this skill's normal route.

## Standard Workflow

### 1. Context

Always start with the bundled context script. The caller must set `VERIFY_CODE_DIR` to the directory containing this workflow (e.g., the repo root or a workflows directory).

```bash
VERIFY_CODE_DIR="${VERIFY_CODE_DIR:-.}"
export BROWSER_QA_ENGINE="${BROWSER_QA_ENGINE:-agent-browser}"
```

The script exports:

- `BROWSER_QA_ENGINE`
- `BROWSER_QA_SESSION`
- `BROWSER_QA_HOST`
- `BROWSER_QA_ALLOWED_DOMAINS`
- `BROWSER_QA_AUTH_MODE`
- `BROWSER_QA_PROFILE`
- `BROWSER_QA_PROFILE_SOURCE`

### 2. Doctor

Run the bundled doctor before browser actions:

```bash
```

If the selected engine is missing or broken, repair that engine only. Do not check or launch the other engine as fallback.

### 3. Cleanup Before Launch

```bash
```

This cleanup is only for browser automation resources. It must not stop the target app.
It closes only the selected engine. For `agent-browser`, cleanup uses the saved session metadata, kills every daemon bound to the session socket, removes stale runtime files, then removes stale browser temp directories and Playwright MCP residuals. If cleanup still reports session residuals or exits non-zero, stop and resolve that state before launching a new browser session.

### 4. Launch With `agent-browser`

Use this section only when `BROWSER_QA_ENGINE=agent-browser`.

Read the live command guide before using `agent-browser`:

```bash
agent-browser skills get agent-browser
```

Default launch:

```bash
agent-browser \
  --session "$BROWSER_QA_SESSION" \
  --allowed-domains "$BROWSER_QA_ALLOWED_DOMAINS" \
  --content-boundaries \
  --max-output 20000 \
  open "<url>"

agent-browser \
  --session "$BROWSER_QA_SESSION" \
  snapshot -i -c
```

Use `@ref` selectors from `snapshot` for actions:

```bash
agent-browser --session "$BROWSER_QA_SESSION" click @e12
agent-browser --session "$BROWSER_QA_SESSION" fill @e8 "demo@example.com"
agent-browser --session "$BROWSER_QA_SESSION" screenshot /tmp/codex-qa.png
```

For details, read `references/agent-browser.md`.

### 5. Launch With `browser-use`

Use this section only when `BROWSER_QA_ENGINE=browser-use`. Do not run it after `agent-browser` has already been selected for the same QA run.

```bash
command -v browser-use
browser-use doctor
browser-use --session "$BROWSER_QA_SESSION" open "<url>"
browser-use --session "$BROWSER_QA_SESSION" state
```

If a QA profile is mapped:

```bash
browser-use --session "$BROWSER_QA_SESSION" --profile "$BROWSER_QA_PROFILE" open "<url>"
```

For details, read `references/browser-use.md`.

### 6. Repair Selected Engine

If the selected tool fails:

1. Keep the same derived session.
2. Close and reopen that tool's session.
3. Retry headless once.
4. Retry headed only if visual debugging, CAPTCHA, MFA, SSO, or headless mismatch requires it.
5. If the selected engine remains blocked, stop and report the blocker.
6. Do not switch to the alternate CLI or Playwright MCP in the same QA run.

For repair rules, read `references/fallback.md`.

### 7. Finish Cleanly

Always finish with:

```bash
```

The task is not done until cleanup has run and the target app service is still left running.
Do not use broad `agent-browser close --all` during normal QA cleanup. Use the derived session cleanup script, which applies command timeouts, PID-file fallback, and stale temporary directory cleanup.

## Auth Rules

1. Prefer `agent-browser` auth vault when credentials are already saved.
2. Prefer a dedicated QA state or mapped QA profile.
3. Use a real Chrome profile only when the user explicitly asks for it.
4. Do not silently choose `Default`, the user's main profile, or a random profile.
5. Never put plaintext passwords in chat, shell history, screenshots, or logs.
6. If auth is required and no safe auth path exists, stop and ask.

For details, read `references/auth.md`.

## Safety Defaults

- For localhost QA, restrict allowed domains to `localhost` and `127.0.0.1`.
- Use content boundaries when supported.
- Cap page output when supported.
- Do not upload, download, run arbitrary `eval`, or leave the target domain unless required by the task.
- Do not attach to live Chrome unless the user explicitly asks.
- Do not use repo-local cleanup or context scripts when this skill provides bundled scripts.
- Do not run `make stop-worktree`, `make stop`, `scripts/stop-services.sh`, or similar shutdown commands as part of browser QA cleanup.
- Do not run `agent-browser`, `browser-use`, and Playwright MCP in the same QA run.

## Output Contract

Report only:

- what was tested
- tool used
- selected engine
- derived session
- whether login state was reused
- whether an engine switch happened; this should be `no`
- evidence collected
- pass/fail result
- cleanup completion
- whether the app service was left running

If the selected engine stayed blocked, report:

- selected engine
- failure symptom
- repair steps attempted
- why the run stopped

## Bundled Resources

- `scripts/browser-qa-context.sh` (documented for future implementation): derives session, engine, host, allowed domains, auth/profile metadata.
- `scripts/browser-qa-doctor.sh` (documented for future implementation): checks selected browser CLI availability.
- `scripts/browser-qa-cleanup.sh` (documented for future implementation): closes the selected engine session without stopping app services.
- `scripts/cleanup-browser-qa.sh` (documented for future implementation): compatibility wrapper for older calls.
- `references/agent-browser.md`: agent-browser command workflow.
- `references/browser-use.md`: browser-use-specific workflow.
- `references/auth.md`: login and profile policy.
- `references/fallback.md`: selected-engine repair policy.

## Guardrails

- Do not claim browser verification without running it.
- Do not treat unresolved tool breakage as permission to switch tools.
- Do not invent extra session names when the derived project session works.
- Do not leave cleanup to the user.
- Do not document unsupported CLI flags as if they exist.
- Do not use `auto` as an engine value.
- Do not call Playwright MCP from this skill.

exec
/bin/bash -lc "sed -n '1,120p' specs/m9-verify-code/FR-TEST-002-evidence.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
# FR-TEST-002 验收出口记录

FR-TEST-002 要求 M9 自举端到端实跑（make-decision → build-code → verify-code 三段闭环）。

按 D-M9-7/F10：不单列实现 task，不堆额外 E2E 框架。

**验收证据**：M9 自举完成后，verify-code 产出的 `specs/{task-id}/stage-result-verify-code.json` 即为端到端实跑证据。

**当前状态**：M9 verify-code v1 代码已交付（apply 阶段完成），但自举实跑尚未执行（需在 test-acceptance 或后续会话中运行完整三段闭环）。本文件标注证据 pend，不伪造 pass。

exec
/bin/bash -lc 'find workflows/verify-code/isolated-browser-qa -maxdepth 3 -type f | sort' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
find: workflows/verify-code/isolated-browser-qa: No such file or directory

exec
/bin/bash -lc 'rg -n "browser-qa-(context|doctor|cleanup)|cleanup-browser-qa|FR-TEST-002|stage-result-verify-code|pend|pending|documented for future implementation" workflows specs README.md CONSTITUTION.md constitution-checklist.md CONTEXT.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
specs/m9-verify-code/FR-TEST-002-evidence.md:1:# FR-TEST-002 验收出口记录
specs/m9-verify-code/FR-TEST-002-evidence.md:3:FR-TEST-002 要求 M9 自举端到端实跑（make-decision → build-code → verify-code 三段闭环）。
specs/m9-verify-code/FR-TEST-002-evidence.md:7:**验收证据**：M9 自举完成后，verify-code 产出的 `specs/{task-id}/stage-result-verify-code.json` 即为端到端实跑证据。
specs/m9-verify-code/FR-TEST-002-evidence.md:9:**当前状态**：M9 verify-code v1 代码已交付（apply 阶段完成），但自举实跑尚未执行（需在 test-acceptance 或后续会话中运行完整三段闭环）。本文件标注证据 pend，不伪造 pass。
specs/m9-verify-code/spec.md:21:- stage-result 落 specs/{task-id}/stage-result-verify-code.json；M4 metrics 双写 task + global
specs/m9-verify-code/spec.md:42:- **stage-result**：verify-code 执行完毕后写入 `specs/{task-id}/stage-result-verify-code.json` 的结构化记录，含 status / error_code / retryable / facts / missing_items / user_decision / reason 七个顶层键。
specs/m9-verify-code/spec.md:172:verify-code 的 stage-result 写入 `specs/{task-id}/stage-result-verify-code.json`，与 build-code 的 `specs/{task-id}/stage-result-build-code.json` 同级。
specs/m9-verify-code/spec.md:199:**FR-TEST-002** M9 自举端到端实跑（来源：D-M9-7）
specs/m9-verify-code/spec.md:259:- **当前 vs 历史**：stage-result 落固定路径 `specs/{task-id}/stage-result-verify-code.json`，同一 task 重跑（rerun）会覆盖前次结果；不同 task 靠 task-id 目录自然隔离。如需保留历史快照，调用方在 rerun 前自行备份，verify-code 本身不做多版本管理。
specs/m9-verify-code/plan.md:359:| FR-PATH-001 | facts-assembly.mjs writeStageResult 落 specs/{task-id}/stage-result-verify-code.json |
specs/m9-verify-code/plan.md:367:| FR-TEST-002 | M9 自举端到端（无需额外 E2E 框架，F10） |
specs/m9-verify-code/tasks.md:198:  - 导出 `export function writeStageResult(taskSpecDir, result)` — 写 `${taskSpecDir}/stage-result-verify-code.json`
specs/m9-verify-code/tasks.md:247:- writeStageResult 写 `specs/{task-id}/stage-result-verify-code.json`，task-id 由调用方传入（不硬编码）
specs/m9-verify-code/tasks.md:284:  8. **stage-result 落盘**：调用 facts-assembly.mjs assembleStageResult + writeStageResult，落 `specs/{task-id}/stage-result-verify-code.json`（FR-PATH-001）；final-test-report.md 落 `specs/{task-id}/test/`（FR-PATH-002）
specs/m9-verify-code/tasks.md:348:## Phase 5：CI 冒烟配置 + 轻量三段闭环检查 + 全量回归（FR-TEST-003, FR-TEST-002, FR-REG-001）
specs/m9-verify-code/tasks.md:354:在 CI 配置中新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查（结构性验证 make-decision → build-code → verify-code 产物链路贯通，不引入重型 E2E 框架，满足验收标准 5 同时遵守 D-M9-7/F10）。执行全量回归确认无新增失败；维护 plan.md 证据契约；明确 FR-TEST-002 验收出口。
specs/m9-verify-code/tasks.md:373:  3. **verify-code 段**：验证 `specs/{task-id}/stage-result-verify-code.json` 路径结构符合 D-M9-6。
specs/m9-verify-code/tasks.md:397:**Task 5.4 — FR-TEST-002 验收出口记录（非代码任务）** [FR-TEST-002]
specs/m9-verify-code/tasks.md:400:- 说明：FR-TEST-002（M9 自举端到端实跑）按 D-M9-7/F10 不单列实现 task，不堆额外 E2E 框架；端到端三段闭环靠 M9 自举实跑验证。
specs/m9-verify-code/tasks.md:401:- 出参：在 `specs/m9-verify-code/` 目录（或 plan.md 验收清单）明确记录 FR-TEST-002 的验收证据：
specs/m9-verify-code/tasks.md:402:  1. M9 自举走完一次完整 verify-code 验收+收尾（make-decision → build-code → verify-code 三段全部真跑）即为 FR-TEST-002 证据；
specs/m9-verify-code/tasks.md:403:  2. 证据落盘路径：`specs/m9-verify-code/stage-result-verify-code.json`（verify-code 自举产出的 stage-result 即为端到端实跑证据）；
specs/m9-verify-code/tasks.md:405:- 区分说明：本 task 是"按 F10 故意不建 E2E 框架"而非"漏验"——FR-TEST-002 由自举实跑满足，证据就是自举完成后落盘的 stage-result-verify-code.json。（来源：D-M9-7、F10、验收标准 1/2）
specs/m9-verify-code/tasks.md:406:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/stage-result-verify-code.json`（自举完成后存在）
specs/m9-verify-code/tasks.md:432:- FR-TEST-002 端到端验证靠 M9 自举实跑（D-M9-7），证据 = 自举产出的 stage-result-verify-code.json，不在 CI 里模拟三段闭环
specs/m9-verify-code/tasks.md:438:Phase 5 完成条件：`.github/workflows/ci.yml` 含 verify-code 冒烟步骤 + 轻量三段闭环检查步骤；`scripts/ci-chain-check.mjs` 可运行；全量 vitest run exit=0，所有 verify-code-*.test.mjs 跑到；三脚本均可 import；FR-TEST-002 验收出口已记录（Task 5.4）。
workflows/scope-triage/SKILL.md:6:<!-- component skill — physically independent, can be invoked independently by foreman or subagent -->
workflows/scope-triage/SKILL.md:41:This skill does NOT write its own `stage-result`. The calling collector MUST write ONE independent metric record with `"stage": "scope-triage"` (never `"make-decision"`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line.
workflows/build-plan/SKILL.md:25:For every new mechanism, validation, CI check, gate, schema, dependency, or automation proposed in the plan, answer all four questions. If you cannot answer all four, remove it from the plan.
workflows/verify-code/isolated-browser-qa.md:227:- `scripts/browser-qa-context.sh` (documented for future implementation): derives session, engine, host, allowed domains, auth/profile metadata.
workflows/verify-code/isolated-browser-qa.md:228:- `scripts/browser-qa-doctor.sh` (documented for future implementation): checks selected browser CLI availability.
workflows/verify-code/isolated-browser-qa.md:229:- `scripts/browser-qa-cleanup.sh` (documented for future implementation): closes the selected engine session without stopping app services.
workflows/verify-code/isolated-browser-qa.md:230:- `scripts/cleanup-browser-qa.sh` (documented for future implementation): compatibility wrapper for older calls.
workflows/verify-code/facts-assembly.mjs:54:  const path = join(taskSpecDir, 'stage-result-verify-code.json');
workflows/decision-log/SKILL.md:6:<!-- component skill — physically independent, can be invoked independently by foreman or subagent -->
workflows/decision-log/SKILL.md:31:   - `用户批准`: yes / no / pending
workflows/decision-log/SKILL.md:51:This skill is a **pure prompt** — no runtime entry point, no executable code, no agenthub-internal coupling. It must remain invocable by any foreman or subagent without any harness dependency.
workflows/decision-log/SKILL.md:55:This skill does NOT write its own `stage-result`. The calling collector MUST write ONE independent metric record with `"stage": "decision-log"` (never `"make-decision"`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line.
workflows/verify-code/SKILL.md:76:Call `facts-assembly.mjs` `assembleStageResult` + `writeStageResult`. Write the stage-result to `specs/{task-id}/stage-result-verify-code.json` (FR-PATH-001). The `final-test-report.md` goes to `specs/{task-id}/test/` (FR-PATH-002).
workflows/build-spec/SKILL.md:22:Before writing any new mechanism, validation, CI check, gate, schema, dependency, or automation into the spec, answer all four questions. If you cannot answer all four, exclude it from scope.
workflows/build-code/diff-scanner.mjs:36:  // though both are checked independently (no break).
specs/archive/m5-quality-mechanism/tasks.md:250:## Dependencies
workflows/build-code/SKILL.md:78:Use Worker-Mode to spawn an implementer worker for the actual code-writing work. Worker-Mode is an external semver dependency — version-pin it in the skill config and do not inline its logic.
specs/archive/m4-metrics-foundation/plan.md:32:2. **已有能力能否覆盖**：jsonl 原子追加用 Node `fs.appendFileSync`（O_APPEND 原子性），不引第三方写库；schema 校验用手写逐条（沿用 `validate-contract.mjs` 风格），**不引 AJV**（M1-M3 没用，保持一致）。✓
specs/archive/m4-metrics-foundation/checklists/requirements.md:23:- [x] Dependencies and assumptions identified — §2 背景 + §11 影响范围 + §10 未决问题
specs/archive/m8-build-code/checklists/requirements.md:23:- [x] Dependencies and assumptions identified (§4 假设继承自 decision-log)

codex
本地上下文显示两个改动方向不同：FR-TEST-002 的状态说明基本诚实；isolated-browser-qa 这边删了命令，但保留了“必须运行脚本”的正文，形成了新的不可执行规范。
exec
/bin/bash -lc 'nl -ba specs/m9-verify-code/FR-TEST-002-evidence.md' in /Users/Hugh/Hugh/Project/workflowhub
exec
/bin/bash -lc "nl -ba workflows/verify-code/isolated-browser-qa.md | sed -n '60,115p;165,235p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	# FR-TEST-002 验收出口记录
     2	
     3	FR-TEST-002 要求 M9 自举端到端实跑（make-decision → build-code → verify-code 三段闭环）。
     4	
     5	按 D-M9-7/F10：不单列实现 task，不堆额外 E2E 框架。
     6	
     7	**验收证据**：M9 自举完成后，verify-code 产出的 `specs/{task-id}/stage-result-verify-code.json` 即为端到端实跑证据。
     8	
     9	**当前状态**：M9 verify-code v1 代码已交付（apply 阶段完成），但自举实跑尚未执行（需在 test-acceptance 或后续会话中运行完整三段闭环）。本文件标注证据 pend，不伪造 pass。

 succeeded in 0ms:
    60	- browser-use-specific templates, tasks, or APIs
    61	
    62	Do not use `browser-use` as an automatic fallback from `agent-browser`.
    63	
    64	Do not use Playwright MCP as a fallback from either CLI. Playwright MCP is outside this skill's normal route.
    65	
    66	## Standard Workflow
    67	
    68	### 1. Context
    69	
    70	Always start with the bundled context script. The caller must set `VERIFY_CODE_DIR` to the directory containing this workflow (e.g., the repo root or a workflows directory).
    71	
    72	```bash
    73	VERIFY_CODE_DIR="${VERIFY_CODE_DIR:-.}"
    74	export BROWSER_QA_ENGINE="${BROWSER_QA_ENGINE:-agent-browser}"
    75	```
    76	
    77	The script exports:
    78	
    79	- `BROWSER_QA_ENGINE`
    80	- `BROWSER_QA_SESSION`
    81	- `BROWSER_QA_HOST`
    82	- `BROWSER_QA_ALLOWED_DOMAINS`
    83	- `BROWSER_QA_AUTH_MODE`
    84	- `BROWSER_QA_PROFILE`
    85	- `BROWSER_QA_PROFILE_SOURCE`
    86	
    87	### 2. Doctor
    88	
    89	Run the bundled doctor before browser actions:
    90	
    91	```bash
    92	```
    93	
    94	If the selected engine is missing or broken, repair that engine only. Do not check or launch the other engine as fallback.
    95	
    96	### 3. Cleanup Before Launch
    97	
    98	```bash
    99	```
   100	
   101	This cleanup is only for browser automation resources. It must not stop the target app.
   102	It closes only the selected engine. For `agent-browser`, cleanup uses the saved session metadata, kills every daemon bound to the session socket, removes stale runtime files, then removes stale browser temp directories and Playwright MCP residuals. If cleanup still reports session residuals or exits non-zero, stop and resolve that state before launching a new browser session.
   103	
   104	### 4. Launch With `agent-browser`
   105	
   106	Use this section only when `BROWSER_QA_ENGINE=agent-browser`.
   107	
   108	Read the live command guide before using `agent-browser`:
   109	
   110	```bash
   111	agent-browser skills get agent-browser
   112	```
   113	
   114	Default launch:
   115	
   165	4. Retry headed only if visual debugging, CAPTCHA, MFA, SSO, or headless mismatch requires it.
   166	5. If the selected engine remains blocked, stop and report the blocker.
   167	6. Do not switch to the alternate CLI or Playwright MCP in the same QA run.
   168	
   169	For repair rules, read `references/fallback.md`.
   170	
   171	### 7. Finish Cleanly
   172	
   173	Always finish with:
   174	
   175	```bash
   176	```
   177	
   178	The task is not done until cleanup has run and the target app service is still left running.
   179	Do not use broad `agent-browser close --all` during normal QA cleanup. Use the derived session cleanup script, which applies command timeouts, PID-file fallback, and stale temporary directory cleanup.
   180	
   181	## Auth Rules
   182	
   183	1. Prefer `agent-browser` auth vault when credentials are already saved.
   184	2. Prefer a dedicated QA state or mapped QA profile.
   185	3. Use a real Chrome profile only when the user explicitly asks for it.
   186	4. Do not silently choose `Default`, the user's main profile, or a random profile.
   187	5. Never put plaintext passwords in chat, shell history, screenshots, or logs.
   188	6. If auth is required and no safe auth path exists, stop and ask.
   189	
   190	For details, read `references/auth.md`.
   191	
   192	## Safety Defaults
   193	
   194	- For localhost QA, restrict allowed domains to `localhost` and `127.0.0.1`.
   195	- Use content boundaries when supported.
   196	- Cap page output when supported.
   197	- Do not upload, download, run arbitrary `eval`, or leave the target domain unless required by the task.
   198	- Do not attach to live Chrome unless the user explicitly asks.
   199	- Do not use repo-local cleanup or context scripts when this skill provides bundled scripts.
   200	- Do not run `make stop-worktree`, `make stop`, `scripts/stop-services.sh`, or similar shutdown commands as part of browser QA cleanup.
   201	- Do not run `agent-browser`, `browser-use`, and Playwright MCP in the same QA run.
   202	
   203	## Output Contract
   204	
   205	Report only:
   206	
   207	- what was tested
   208	- tool used
   209	- selected engine
   210	- derived session
   211	- whether login state was reused
   212	- whether an engine switch happened; this should be `no`
   213	- evidence collected
   214	- pass/fail result
   215	- cleanup completion
   216	- whether the app service was left running
   217	
   218	If the selected engine stayed blocked, report:
   219	
   220	- selected engine
   221	- failure symptom
   222	- repair steps attempted
   223	- why the run stopped
   224	
   225	## Bundled Resources
   226	
   227	- `scripts/browser-qa-context.sh` (documented for future implementation): derives session, engine, host, allowed domains, auth/profile metadata.
   228	- `scripts/browser-qa-doctor.sh` (documented for future implementation): checks selected browser CLI availability.
   229	- `scripts/browser-qa-cleanup.sh` (documented for future implementation): closes the selected engine session without stopping app services.
   230	- `scripts/cleanup-browser-qa.sh` (documented for future implementation): compatibility wrapper for older calls.
   231	- `references/agent-browser.md`: agent-browser command workflow.
   232	- `references/browser-use.md`: browser-use-specific workflow.
   233	- `references/auth.md`: login and profile policy.
   234	- `references/fallback.md`: selected-engine repair policy.
   235	

exec
/bin/bash -lc 'test -d workflows/verify-code/isolated-browser-qa/scripts; echo scripts_dir_exit=$?; test -f workflows/verify-code/isolated-browser-qa/scripts/browser-qa-context.sh; echo context_file_exit=$?; test -f workflows/verify-code/isolated-browser-qa/scripts/browser-qa-doctor.sh; echo doctor_file_exit=$?; test -f workflows/verify-code/isolated-browser-qa/scripts/browser-qa-cleanup.sh; echo cleanup_file_exit=$?' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
scripts_dir_exit=1
context_file_exit=1
doctor_file_exit=1
cleanup_file_exit=1

codex
**Verdict: blocking**

| Severity | Finding | Location | Why it matters |
|---|---|---|---|
| blocking | B4 未真正关闭 | [isolated-browser-qa.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md:70) | 正文仍要求运行不存在的 bundled context script |
| blocking | 空代码块造成不可执行规范 | [isolated-browser-qa.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md:89) | doctor/cleanup/finish 章节说“运行”，但命令为空 |
| major | “Bundled Resources” 表述不诚实 | [isolated-browser-qa.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md:225) | 文件不存在，却仍放在 bundled resources 下 |
| major | 安全规则仍假设 bundled scripts 存在 | [isolated-browser-qa.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md:199) | 与“future implementation”矛盾 |
| minor | FR-TEST-002 表述基本诚实，但可更精确 | [FR-TEST-002-evidence.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/FR-TEST-002-evidence.md:7) | 建议同时写出 M9 自举的具体预期路径 |

**具体问题**

B4 的修复只删除了可执行命令行，但没有删除“必须使用 bundled scripts”的规范语义。现在文档读起来是：必须运行 context script、doctor、cleanup；但代码块是空的，且本地确认这些脚本目录和文件都不存在。这样会把 blocker 从“dangling executable refs”变成“dangling mandatory process refs”。

“documented for future implementation”本身可以诚实，但不能放在 `Bundled Resources` 下面。`Bundled` 的含义是当前随包提供。更诚实的写法是改成 `Planned Resources` / `Future Resources`，并明确“not available in this version; do not call these paths”。

FR-TEST-002 这份 evidence 文件没有伪造 pass。它明确说自举尚未执行、证据 pending，这个方向是对的。小问题是 `specs/{task-id}/stage-result-verify-code.json` 是通用契约；对 M9 自举验收，最好补一句具体预期路径：`specs/m9-verify-code/stage-result-verify-code.json`，与 tasks.md 里的验收出口保持一致。

**推荐修正**

**推荐方案：把 isolated-browser-qa.md 改成“无脚本 v1”文档。**

1. 删除或改写“Always start with the bundled context script”。
2. 删除“Run the bundled doctor”和“Always finish with bundled cleanup script”的强制说法。
3. 删除空 bash code block。
4. 把 `Bundled Resources` 改成 `Planned Resources`，并写明这些脚本当前未实现、不得调用。
5. 把 line 199 的“this skill provides bundled scripts”改掉，因为当前并不提供。

可选方案是直接补齐这些脚本，但这会扩大 Phase 4+5 修复范围，也违背你给出的 F10 风格：不为文档 blocker 临时堆框架。

**FR-TEST-002 结论**

B5 基本通过。它诚实表达了 pending 状态，没有假装已有 evidence。建议只做一个小修：把 “pend” 改成 “pending”，并补上 M9 自举的具体证据路径。
hook: Stop
hook: Stop Completed
tokens used
32,198

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
