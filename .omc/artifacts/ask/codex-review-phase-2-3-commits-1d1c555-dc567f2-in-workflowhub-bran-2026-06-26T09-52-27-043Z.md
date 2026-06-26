# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-26T09:52:27.044Z

## Original task

Review Phase 2+3 commits (1d1c555..dc567f2) in workflowhub branch m9-verify-code for compliance with tasks.md requirements.

## Phase 2 Requirements (freshness.mjs)
- `checkFreshness(buildSha, headSha)` pure function, no IO, no side effects
- Returns `{ anomaly_flags, warnings }`
- sha match -> empty arrays; sha mismatch -> `anomaly_flags:["stale_sha"]` + warnings with `{type:"warning", message:"..."}`
- anomaly_flags non-empty MUST produce non-empty warnings (FR-FRESH-004 visibility)
- NEVER throw, NEVER set status="failure" (C2, D5/D7 non-blocking)
- `getAnomalyFlagsText(anomaly_flags)` formats array to human-readable string
- Tests: sha match, sha mismatch, warnings non-empty when flags non-empty, never throws (null/undefined/empty strings), falsifiability guard

## Phase 3 Requirements (facts-assembly.mjs + C1 build-code)
- `readCommand(buildResult)` reads `facts.tests.command` from parsed JSON object (not file)
- Missing `facts.tests.command` -> throw with message containing "command"
- Missing `facts.tests` entirely -> throw with `error.retryable = true`
- `assembleStageResult({verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable})` returns 7-key object
- All 7 keys must exist (falsifiable: delete user_decision -> test must fail)
- `writeStageResult(taskSpecDir, taskId, result)` writes `${taskSpecDir}/stage-result-verify-code.json`
- `validateMetricRecord(record)` checks all 10 metric keys exist
- C1 backward compat: old M8 facts without `command` field must still be valid
- C1: if `command` present, must be string type; if absent, still valid
- build-code SKILL.md must document `command` field in facts.tests

## Diff (1d1c555..dc567f2)

The diff includes these files:
- tests/build-code-facts.test.mjs - C1 backward compat tests added
- tests/verify-code-facts.test.mjs - NEW: tests for readCommand, assembleStageResult, writeStageResult, validateMetricRecord
- tests/verify-code-freshness.test.mjs - NEW: tests for checkFreshness, getAnomalyFlagsText
- workflows/build-code/SKILL.md - command field documented in facts.tests
- workflows/build-code/facts-schema.mjs - C1 optional command field validation added
- workflows/verify-code/facts-assembly.mjs - NEW: readCommand, assembleStageResult, writeStageResult, validateMetricRecord
- workflows/verify-code/freshness.mjs - NEW: checkFreshness, getAnomalyFlagsText

Key implementation details from diff:

freshness.mjs:
- checkFreshness(buildSha, headSha) is pure function, no IO
- Converts inputs with `(buildSha || '').toString()` for null-safety
- Returns `{ anomaly_flags: [], warnings: [] }` on match
- Returns `{ anomaly_flags: ["stale_sha"], warnings: [{type:"warning", message:"..."}] }` on mismatch
- Never throws - handles null/undefined/empty strings gracefully
- getAnomalyFlagsText formats array with emoji prefix

facts-assembly.mjs:
- readCommand(buildResult) reads from parsed JSON, throws on missing command with retryable=true when facts.tests missing entirely
- assembleStageResult returns 7-key object: verdict, evidence_ref, anomaly_flags, missing_items, user_decision, reason, error_code
- writeStageResult(taskSpecDir, taskId, result) writes to `${taskSpecDir}/stage-result-verify-code.json`
- validateMetricRecord checks 10 metric keys via METRIC_KEYS array filter

facts-schema.mjs (C1):
- Added optional command validation: if present must be string, if absent still valid
- Old M8 facts without command remain valid

build-code SKILL.md:
- Documents command field in facts.tests description
- Example JSON includes command field

## Review Instructions

Verify ALL requirements from Phase 2 and Phase 3 are met by the code in the diff. Check:
1. Each requirement has corresponding implementation
2. Code quality (naming, structure, edge cases)
3. Test falsifiability (tests would actually fail if implementation were broken)
4. Any gaps between requirements and implementation

Report verdict as: pass / revise_required / escalate
For each finding: file:line, severity (blocking/non-blocking), description
Be specific and cite exact lines.

## Final prompt

Review Phase 2+3 commits (1d1c555..dc567f2) in workflowhub branch m9-verify-code for compliance with tasks.md requirements.

## Phase 2 Requirements (freshness.mjs)
- `checkFreshness(buildSha, headSha)` pure function, no IO, no side effects
- Returns `{ anomaly_flags, warnings }`
- sha match -> empty arrays; sha mismatch -> `anomaly_flags:["stale_sha"]` + warnings with `{type:"warning", message:"..."}`
- anomaly_flags non-empty MUST produce non-empty warnings (FR-FRESH-004 visibility)
- NEVER throw, NEVER set status="failure" (C2, D5/D7 non-blocking)
- `getAnomalyFlagsText(anomaly_flags)` formats array to human-readable string
- Tests: sha match, sha mismatch, warnings non-empty when flags non-empty, never throws (null/undefined/empty strings), falsifiability guard

## Phase 3 Requirements (facts-assembly.mjs + C1 build-code)
- `readCommand(buildResult)` reads `facts.tests.command` from parsed JSON object (not file)
- Missing `facts.tests.command` -> throw with message containing "command"
- Missing `facts.tests` entirely -> throw with `error.retryable = true`
- `assembleStageResult({verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable})` returns 7-key object
- All 7 keys must exist (falsifiable: delete user_decision -> test must fail)
- `writeStageResult(taskSpecDir, taskId, result)` writes `${taskSpecDir}/stage-result-verify-code.json`
- `validateMetricRecord(record)` checks all 10 metric keys exist
- C1 backward compat: old M8 facts without `command` field must still be valid
- C1: if `command` present, must be string type; if absent, still valid
- build-code SKILL.md must document `command` field in facts.tests

## Diff (1d1c555..dc567f2)

The diff includes these files:
- tests/build-code-facts.test.mjs - C1 backward compat tests added
- tests/verify-code-facts.test.mjs - NEW: tests for readCommand, assembleStageResult, writeStageResult, validateMetricRecord
- tests/verify-code-freshness.test.mjs - NEW: tests for checkFreshness, getAnomalyFlagsText
- workflows/build-code/SKILL.md - command field documented in facts.tests
- workflows/build-code/facts-schema.mjs - C1 optional command field validation added
- workflows/verify-code/facts-assembly.mjs - NEW: readCommand, assembleStageResult, writeStageResult, validateMetricRecord
- workflows/verify-code/freshness.mjs - NEW: checkFreshness, getAnomalyFlagsText

Key implementation details from diff:

freshness.mjs:
- checkFreshness(buildSha, headSha) is pure function, no IO
- Converts inputs with `(buildSha || '').toString()` for null-safety
- Returns `{ anomaly_flags: [], warnings: [] }` on match
- Returns `{ anomaly_flags: ["stale_sha"], warnings: [{type:"warning", message:"..."}] }` on mismatch
- Never throws - handles null/undefined/empty strings gracefully
- getAnomalyFlagsText formats array with emoji prefix

facts-assembly.mjs:
- readCommand(buildResult) reads from parsed JSON, throws on missing command with retryable=true when facts.tests missing entirely
- assembleStageResult returns 7-key object: verdict, evidence_ref, anomaly_flags, missing_items, user_decision, reason, error_code
- writeStageResult(taskSpecDir, taskId, result) writes to `${taskSpecDir}/stage-result-verify-code.json`
- validateMetricRecord checks 10 metric keys via METRIC_KEYS array filter

facts-schema.mjs (C1):
- Added optional command validation: if present must be string, if absent still valid
- Old M8 facts without command remain valid

build-code SKILL.md:
- Documents command field in facts.tests description
- Example JSON includes command field

## Review Instructions

Verify ALL requirements from Phase 2 and Phase 3 are met by the code in the diff. Check:
1. Each requirement has corresponding implementation
2. Code quality (naming, structure, edge cases)
3. Test falsifiability (tests would actually fail if implementation were broken)
4. Any gaps between requirements and implementation

Report verdict as: pass / revise_required / escalate
For each finding: file:line, severity (blocking/non-blocking), description
Be specific and cite exact lines.

## Raw output

```text
Verdict: `revise_required`

测试命令已跑过，当前 34 个测试全绿：

`node node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs tests/build-code-facts.test.mjs --passWithNoTests=false`

但 Phase 3 有需求缺口，测试也没有真正锁住。

| 位置 | 严重性 | 问题 |
|---|---:|---|
| [tests/verify-code-facts.test.mjs](/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-facts.test.mjs:61) | blocking | `evidence_ref` 测试写反 |
| [workflows/verify-code/facts-assembly.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs:31) | blocking | `evidence_ref` 未约束相对路径 |
| [workflows/verify-code/facts-assembly.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs:19) | blocking | command 缺失错误没有 `retryable=true` |
| [workflows/verify-code/facts-assembly.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs:2) | non-blocking | `dirname` 未使用 |

具体说明：

1. `evidence_ref` 要求是相对 `specs/{task-id}/` 的路径，不应包含 `specs/{task-id}/` 前缀。但测试第 61-64 行传入 `specs/m9/evidence/fresh-capture.json`，并断言原样通过。这和 Phase 3 requirement 相反，导致 FR-PATH-003 不可证伪。实现第 31 行也只是原样赋值，没有校验或拒绝错误前缀。

2. `readCommand()` 在 `facts.tests.command` 缺失时只抛普通 Error。`tasks.md` 的实现约束要求 command 缺失抛 `{ message, retryable: true }` 语义。当前只有 `facts.tests` 整体缺失时才设置 `retryable=true`，字段缺失路径不符合。

3. `dirname` import 没用，清掉即可。不影响行为。

符合项：

- Phase 2 `checkFreshness()` 基本满足：纯函数、无 IO、返回 `{ anomaly_flags, warnings }`、mismatch 时有 `stale_sha` 和 warning、不会设置 failure。
- `getAnomalyFlagsText()` 有实现。
- C1 build-code schema 满足：`command` 可选，存在时必须是 string，旧 M8 facts 无 command 仍 valid。
- build-code `SKILL.md` 已记录 `facts.tests.command`，示例也包含 command。
- `validateMetricRecord()` 覆盖 10 个 key。
- `assembleStageResult()` 当前确实返回 7 个顶层 key，`user_decision` 可证伪测试存在。

建议修改后再通过：先修 `evidence_ref` 的测试和实现，再给 command 缺失错误补 `retryable=true`。


2026-06-26T09:49:54.490266Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:49:54.490318Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:49:54.490320Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T09:49:54.490321Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:49:54.490323Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:49:54.490324Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:49:54.490325Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:49:54.490326Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:49:54.490328Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:49:54.490329Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:49:54.490330Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T09:49:54.490331Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: medium
reasoning summaries: none
session id: 019f0355-f759-7bc2-9cf5-efc9eaba1a99
--------
user
Review Phase 2+3 commits (1d1c555..dc567f2) in workflowhub branch m9-verify-code for compliance with tasks.md requirements.

## Phase 2 Requirements (freshness.mjs)
- `checkFreshness(buildSha, headSha)` pure function, no IO, no side effects
- Returns `{ anomaly_flags, warnings }`
- sha match -> empty arrays; sha mismatch -> `anomaly_flags:["stale_sha"]` + warnings with `{type:"warning", message:"..."}`
- anomaly_flags non-empty MUST produce non-empty warnings (FR-FRESH-004 visibility)
- NEVER throw, NEVER set status="failure" (C2, D5/D7 non-blocking)
- `getAnomalyFlagsText(anomaly_flags)` formats array to human-readable string
- Tests: sha match, sha mismatch, warnings non-empty when flags non-empty, never throws (null/undefined/empty strings), falsifiability guard

## Phase 3 Requirements (facts-assembly.mjs + C1 build-code)
- `readCommand(buildResult)` reads `facts.tests.command` from parsed JSON object (not file)
- Missing `facts.tests.command` -> throw with message containing "command"
- Missing `facts.tests` entirely -> throw with `error.retryable = true`
- `assembleStageResult({verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable})` returns 7-key object
- All 7 keys must exist (falsifiable: delete user_decision -> test must fail)
- `writeStageResult(taskSpecDir, taskId, result)` writes `${taskSpecDir}/stage-result-verify-code.json`
- `validateMetricRecord(record)` checks all 10 metric keys exist
- C1 backward compat: old M8 facts without `command` field must still be valid
- C1: if `command` present, must be string type; if absent, still valid
- build-code SKILL.md must document `command` field in facts.tests

## Diff (1d1c555..dc567f2)

The diff includes these files:
- tests/build-code-facts.test.mjs - C1 backward compat tests added
- tests/verify-code-facts.test.mjs - NEW: tests for readCommand, assembleStageResult, writeStageResult, validateMetricRecord
- tests/verify-code-freshness.test.mjs - NEW: tests for checkFreshness, getAnomalyFlagsText
- workflows/build-code/SKILL.md - command field documented in facts.tests
- workflows/build-code/facts-schema.mjs - C1 optional command field validation added
- workflows/verify-code/facts-assembly.mjs - NEW: readCommand, assembleStageResult, writeStageResult, validateMetricRecord
- workflows/verify-code/freshness.mjs - NEW: checkFreshness, getAnomalyFlagsText

Key implementation details from diff:

freshness.mjs:
- checkFreshness(buildSha, headSha) is pure function, no IO
- Converts inputs with `(buildSha || '').toString()` for null-safety
- Returns `{ anomaly_flags: [], warnings: [] }` on match
- Returns `{ anomaly_flags: ["stale_sha"], warnings: [{type:"warning", message:"..."}] }` on mismatch
- Never throws - handles null/undefined/empty strings gracefully
- getAnomalyFlagsText formats array with emoji prefix

facts-assembly.mjs:
- readCommand(buildResult) reads from parsed JSON, throws on missing command with retryable=true when facts.tests missing entirely
- assembleStageResult returns 7-key object: verdict, evidence_ref, anomaly_flags, missing_items, user_decision, reason, error_code
- writeStageResult(taskSpecDir, taskId, result) writes to `${taskSpecDir}/stage-result-verify-code.json`
- validateMetricRecord checks 10 metric keys via METRIC_KEYS array filter

facts-schema.mjs (C1):
- Added optional command validation: if present must be string, if absent still valid
- Old M8 facts without command remain valid

build-code SKILL.md:
- Documents command field in facts.tests description
- Example JSON includes command field

## Review Instructions

Verify ALL requirements from Phase 2 and Phase 3 are met by the code in the diff. Check:
1. Each requirement has corresponding implementation
2. Code quality (naming, structure, edge cases)
3. Test falsifiability (tests would actually fail if implementation were broken)
4. Any gaps between requirements and implementation

Report verdict as: pass / revise_required / escalate
For each finding: file:line, severity (blocking/non-blocking), description
Be specific and cite exact lines.
2026-06-26T09:49:55.395163Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
我会按代码评审处理：先核对 `tasks.md` 与目标 diff，再用独立子上下文做一轮对照，最后只给结论和具体行号。
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
/bin/bash -lc 'git status --short && git rev-parse --abbrev-ref HEAD && git log --oneline -5' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
?? .omc/
?? specs/m9-verify-code/
m9-verify-code
dc567f2 feat(verify-code): Phase 3 — facts-assembly.mjs + C1 build-code command
a3a56ee feat(verify-code): Phase 2 — freshness.mjs 鲜度校验纯函数
1d1c555 feat(verify-code): Phase 1 — capture.mjs 物理事实采集脚本
bb8a378 docs(build-code): add subagent delegation discipline for read-heavy actions
7f3a9b9 Merge feature/m8-build-code: build-code skill v1

collab: SpawnAgent
2026-06-26T09:50:25.110308Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:50:25.110335Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:50:25.110340Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T09:50:25.110344Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:50:25.110348Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:50:25.110351Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:50:25.110356Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:50:25.110359Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:50:25.110363Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:50:25.110367Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:50:25.110371Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T09:50:25.110374Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:50:25.943846Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
codex
我先本地读 diff 和测试文件；子上下文同时做独立核对，避免只靠同一条推理链自审。
exec
/bin/bash -lc 'git diff --stat 1d1c555..dc567f2' in /Users/Hugh/Hugh/Project/workflowhub
exec
/bin/bash -lc 'git diff --name-only 1d1c555..dc567f2' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
tests/build-code-facts.test.mjs
tests/verify-code-facts.test.mjs
tests/verify-code-freshness.test.mjs
workflows/build-code/SKILL.md
workflows/build-code/facts-schema.mjs
workflows/verify-code/facts-assembly.mjs
workflows/verify-code/freshness.mjs

 succeeded in 0ms:
 tests/build-code-facts.test.mjs          |  79 +++++++++----------
 tests/verify-code-facts.test.mjs         | 126 +++++++++++++++++++++++++++++++
 tests/verify-code-freshness.test.mjs     |  68 +++++++++++++++++
 workflows/build-code/SKILL.md            |   4 +-
 workflows/build-code/facts-schema.mjs    |   5 +-
 workflows/verify-code/facts-assembly.mjs |  55 ++++++++++++++
 workflows/verify-code/freshness.mjs      |  39 ++++++++++
 7 files changed, 330 insertions(+), 46 deletions(-)

exec
/bin/bash -lc "sed -n '1,240p' specs/m9-verify-code/tasks.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
---
milestone: m9-verify-code
stage: plan
status: draft
ui_change: false
total_phases: 5
total_tasks: 19
---

# Tasks — M9 verify-code v1

> 所有 phase ui_change: false（M9 纯 skill 逻辑，无 UI 改动）
> 三段闭环：make-decision → build-code → verify-code
> 关键脚本：capture.mjs / freshness.mjs / facts-assembly.mjs（均在 workflows/verify-code/）

---

## Phase 1：capture.mjs 物理事实采集脚本（FR-FRESH-001/002）

**ui_change: false**

### Goal

新建 `workflows/verify-code/capture.mjs`，实现外部进程级物理事实采集：执行测试命令、采集 exit 码、提取 Test Files 行、记录 git_sha，写入 durable evidence JSON。不靠 LLM 自报，不阻断推进（F3/Q1）。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs` — 新建
- `/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs` — 新建

### Tasks

**Task 1.1 — 写 capture 测试（RED）** [FR-FRESH-001, FR-FRESH-002, FR-TEST-001]

- 入参：无（capture.mjs 不存在）
- 出参：`tests/verify-code-capture.test.mjs`，测试以下行为：
  1. `runCapture(command, outputPath, opts)` — 执行命令，写 JSON 到 outputPath，返回 `{ exit_code, git_sha, test_files_line, content_hash, timestamp, command }`
  2. exit_code 字段为真实整数
  3. 失败命令（exit≠0）时 JSON 仍写出，不抛异常（F3 不阻断）
  4. content_hash 为 sha256 hex，同输出同 hash（幂等）
  5. test_files_line 从 stdout 提取 `Test Files` 开头行，无匹配时为 null
  6. git_sha 字段为当前 HEAD sha（40 位 hex 字符串），opts.gitSha 可覆盖（供测试 stub）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs`

**Task 1.2 — 实现 capture.mjs（GREEN）** [FR-FRESH-001, FR-FRESH-002, FR-TEST-001]

- 入参：RED 证据（exit≠0）
- 出参：`workflows/verify-code/capture.mjs`
- 实现约束：
  - ESM `.mjs`，Node 22，`import { execSync } from 'node:child_process'`，`import { createHash } from 'node:crypto'`
  - 导出 `export async function runCapture(command, outputPath, { cwd, gitSha } = {})`
  - outputPath 目录不存在时自动 `mkdirSync` 创建
  - JSON 格式：`{ command, cwd, git_sha, exit_code, timestamp, test_files_line, content_hash }`
  - git_sha 未传时用 `git rev-parse HEAD` 获取当前 HEAD
  - 失败命令 exit≠0 时仍写 JSON，不 throw（F3）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs`

**Task 1.3 — 维护知识文件** [FR-FRESH-001]

- 入参：Phase 1 完成状态
- 出参：在 plan.md phase 1 evidence-contract 段填写真实 git_sha 和 timestamp
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`

### Verify

```bash
# RED（预期 exit≠0）
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false

# GREEN（预期 exit=0）
node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false
# 确认 "Test Files  1 passed (1)"

# 直接调用验证
node workflows/verify-code/capture.mjs 2>&1 | head -5
```

### Knowledge

- capture.mjs 必须是外部进程，不能用 vi.mock 替代真实 exec（否则 exit 码可证伪性消失）
- test_files_line 提取用 `stdout.split('\n').find(l => l.includes('Test Files'))`
- outputPath 要用绝对路径，capture.mjs 内部不假设 cwd
- opts.gitSha stub 用于测试中替换 git 命令（让测试可在任何 HEAD 下稳定运行）

### STOP

Phase 1 完成条件：`tests/verify-code-capture.test.mjs` exit=0，`workflows/verify-code/capture.mjs` 可直接 import。

---

## Phase 2：freshness.mjs 鲜度校验纯函数（FR-FRESH-002/003/004）

**ui_change: false**

### Goal

新建 `workflows/verify-code/freshness.mjs`，实现鲜度校验逻辑：比对 build-code 事实包的 git_sha 与当前 HEAD，不匹配时写 `anomaly_flags:["stale_sha"]`，有 anomaly_flags 时产出可见 warnings，绝不 BLOCK / exit2（D-M9-2，C2，D5/D7）。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/freshness.mjs` — 新建
- `/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-freshness.test.mjs` — 新建

### Tasks

**Task 2.1 — 写 freshness 测试（RED）** [FR-FRESH-002, FR-FRESH-003, FR-FRESH-004, FR-TEST-001]

- 入参：无（freshness.mjs 不存在）
- 出参：`tests/verify-code-freshness.test.mjs`，测试以下行为：
  1. `checkFreshness(buildSha, headSha)` — sha 一致时返回 `{ anomaly_flags: [], warnings: [] }`
  2. sha 不一致时返回 `{ anomaly_flags: ["stale_sha"], warnings: [{ type: "warning", message: "..." }] }`
  3. anomaly_flags 非空时 warnings 数组非空（FR-FRESH-004 可见输出）
  4. **可证伪测试（FR-FRESH-004）**：构造 buildSha≠headSha 后断言 warnings 非空；注释掉 warning 生成代码时测试必须变红
  5. anomaly_flags 含 "stale_sha" 时，checkFreshness 不 throw，不 FAIL（FR-FRESH-003）
  6. `getAnomalyFlagsText(anomaly_flags)` — 将 anomaly_flags 数组格式化为人可读字符串（供 SKILL.md 边界输出）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-freshness.test.mjs`

**Task 2.2 — 实现 freshness.mjs（GREEN）** [FR-FRESH-002, FR-FRESH-003, FR-FRESH-004]

- 入参：RED 证据（exit≠0）
- 出参：`workflows/verify-code/freshness.mjs`
- 实现约束：
  - ESM `.mjs`，纯函数，无 IO，无副作用
  - 导出 `export function checkFreshness(buildSha, headSha)` — 比对两个 sha，返回 `{ anomaly_flags, warnings }`
  - 导出 `export function getAnomalyFlagsText(anomaly_flags)` — 格式化警告文本
  - 绝不 throw，绝不因 stale_sha 置 status="failure"（C2，D5/D7）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/freshness.mjs`

**Task 2.3 — 维护知识文件** [FR-FRESH-003]

- 入参：Phase 2 完成状态
- 出参：在 plan.md phase 2 evidence-contract 段填写真实 git_sha 和 timestamp
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`

### Verify

```bash
# RED（预期 exit≠0）
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs --passWithNoTests=false

# GREEN（预期 exit=0）
node node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs --passWithNoTests=false

# 可证伪性：故意注释掉 warning 生成代码，确认 exit≠0
```

### Knowledge

- checkFreshness 是纯函数，不读 git（git_sha 由调用方传入），测试无环境依赖
- anomaly_flags 非空时 warnings 必须有对应条目（FR-FRESH-004 可见性红线）
- "stale_sha" 只是告知性警告，不影响 verdict（spec §8 anomaly_flags 扩展预留）

### STOP

Phase 2 完成条件：`tests/verify-code-freshness.test.mjs` exit=0，anomaly_flags 可证伪测试通过（故意破坏后变红）。

---

## Phase 3：facts-assembly.mjs stage-result 组装（FR-CMD-001/002, FR-PATH-001/002/003, FR-METRICS-004）

**ui_change: false**

### Goal

新建 `workflows/verify-code/facts-assembly.mjs`，实现：从事实包读取 command 字段（缺失时浮现明确错误，不静默）、组装七键 stage-result 结构、evidence_ref 路径对齐 D-M9-6、写 durable JSON。同时补 C1 build-code 侧 command 字段。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs` — 新建
- `/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-facts.test.mjs` — 新建
- `/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/facts-schema.mjs` — 修改（C1：追加 command 字段）

### Tasks

**Task 3.1 — 写 facts-assembly 测试（RED）** [FR-CMD-001, FR-CMD-002, FR-PATH-001, FR-PATH-002, FR-PATH-003, FR-METRICS-004, FR-TEST-001]

- 入参：无（facts-assembly.mjs 不存在）
- 出参：`tests/verify-code-facts.test.mjs`，测试以下行为：
  1. `readCommand(buildResult)` — 读 `facts.tests.command`（接收已解析的 JSON 对象），合法时返回 string
  2. `facts.tests.command` 缺失时抛错，error message 包含 "command" 字样（FR-CMD-002，可证伪：删掉抛错逻辑后测试变红）
  3. `facts.tests` 字段整体不存在时抛错，retryable=true 语义在 error.retryable 字段
  4. `assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable })` — 返回七键 stage-result 对象，所有键均存在
  5. 七键存在性可证伪：删掉 `user_decision` 字段后断言必须红
  6. `evidence_ref` 必须是相对 `specs/{task-id}/` 的相对路径（不含 `specs/{task-id}/` 前缀）（FR-PATH-003）
  7. **metrics 10 字段结构性检查**（FR-METRICS-004）：构造含 `execution_id/skill_or_stage/stage/skill_version/executed/tokens/duration_ms/rework_rounds/human_intervention/friction_ref` 十键的对象，`validateMetricRecord(record)` 返回 `{ valid: true, missing: [] }`；删掉任一键时返回 `{ valid: false, missing: [<key>] }`
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-facts.test.mjs`

**Task 3.2 — 实现 facts-assembly.mjs（GREEN）** [FR-CMD-001, FR-CMD-002, FR-PATH-001, FR-PATH-002, FR-PATH-003]

- 入参：RED 证据（exit≠0）
- 出参：`workflows/verify-code/facts-assembly.mjs`
- 实现约束：
  - ESM `.mjs`，纯函数（除 writeStageResult 外无 IO）
  - 导出 `export function readCommand(buildResult)` — 接收已解析的 JSON 对象，不读文件
  - 导出 `export function assembleStageResult(opts)` — 返回七键对象
  - 导出 `export function writeStageResult(taskSpecDir, result)` — 写 `${taskSpecDir}/stage-result-verify-code.json`
  - 导出 `export function validateMetricRecord(record)` — 校验 M4 10 字段是否全部存在
  - readCommand 对 command 缺失抛 `{ message, retryable: true }` 结构的 Error
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs`

**Task 3.3 — C1 build-code facts-schema.mjs 追加 command 可选字段** [FR-CMD-003]

- 入参：facts-assembly.mjs GREEN 后
- 出参：`workflows/build-code/facts-schema.mjs` 的 `validateFacts` 对 `facts.tests.command` 新增**可选字段校验**——字段 present 时校验类型为 string，字段 absent 时仍合法（不把历史 M8 旧 facts 判为 invalid，满足 C1 向后兼容要求）；如有 `buildTestsFact` 工厂函数，新增可选 command 参数
- 约束：追加语义，不删除/重命名已有字段；旧 M8 facts（无 command 字段）经 validateFacts 必须仍为 valid（回归不红）；verify-code 消费侧读到缺 command 时 status="failure" 是 verify-code 的行为，与 schema 校验无关
- 验证：`node node_modules/.bin/vitest run tests/build-code-facts.test.mjs --passWithNoTests=false` 仍 exit=0（回归不红）；须加一条测试用例：构造无 command 字段的旧 facts，验证 validateFacts 返回 valid（可证伪：改成必填后该测试变红）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/facts-schema.mjs`

**Task 3.4 — 维护知识文件** [FR-CMD-001]

- 入参：Phase 3 完成状态
- 出参：在 plan.md phase 3 evidence-contract 段填写真实 git_sha 和 timestamp
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`

**Task 3.5 — C1 同步 build-code SKILL.md 声明 command 字段** [FR-CMD-003, C1]

- 入参：Task 3.3 完成（facts-schema.mjs 已追加 command 可选字段）
- 出参：`workflows/build-code/SKILL.md` 补充说明——在 build-code 产出的 `facts.tests` 中必须包含 `command` 字段，使 skill 行为与 schema 契约对齐，确保 verify-code 消费侧能读到该字段
- 改动范围：在 SKILL.md 的 facts.tests 产物描述段落（或类似"输出产物/stage-result 结构"段落）中，明确写出 `command` 字段及其含义（所执行的测试命令字符串）
- 约束：仅在 facts.tests 产物描述段新增说明，不删/改已有字段语义；不改其他 skill 逻辑
- 可证伪验证：
  ```bash
  grep -n "command" /Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/SKILL.md
  # 预期：至少有一行命中，内容包含 command 字段说明（若无匹配则本 task 未完成）
  ```
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/SKILL.md`

### Verify

```bash
# RED（facts-assembly 测试，预期 exit≠0）
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false

# GREEN（预期 exit=0）
node node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false

# C1 回归（build-code-facts 仍绿）

codex
`tasks.md` 明确了两个实现口径：Phase 3 的 `writeStageResult` 任务正文是二参 `(taskSpecDir, result)`，用户摘要里写的是三参 `(taskSpecDir, taskId, result)`。我会按实际代码和测试确认有没有因签名漂移造成问题。
exec
/bin/bash -lc "nl -ba workflows/verify-code/facts-assembly.mjs | sed -n '1,240p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	import { writeFileSync, mkdirSync } from 'node:fs';
     2	import { join, dirname } from 'node:path';
     3	
     4	const METRIC_KEYS = [
     5	  'execution_id', 'skill_or_stage', 'stage', 'skill_version',
     6	  'executed', 'tokens', 'duration_ms', 'rework_rounds',
     7	  'human_intervention', 'friction_ref',
     8	];
     9	
    10	/**
    11	 * Extract command from build-code facts. Throws on missing command.
    12	 */
    13	export function readCommand(buildResult) {
    14	  if (!buildResult.facts || !buildResult.facts.tests) {
    15	    const err = new Error('facts.tests not found in build result');
    16	    err.retryable = true;
    17	    throw err;
    18	  }
    19	  if (!buildResult.facts.tests.command) {
    20	    throw new Error('command field missing in facts.tests — build-code must include command in facts output');
    21	  }
    22	  return buildResult.facts.tests.command;
    23	}
    24	
    25	/**
    26	 * Assemble a 7-key stage-result object.
    27	 */
    28	export function assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable }) {
    29	  return {
    30	    verdict,
    31	    evidence_ref: evidenceRef,
    32	    anomaly_flags: anomalyFlags,
    33	    missing_items: missingItems,
    34	    user_decision: userDecision,
    35	    reason,
    36	    error_code: errorCode,
    37	  };
    38	}
    39	
    40	/**
    41	 * Write stage-result JSON to specs/{taskId}/stage-result-verify-code.json.
    42	 */
    43	export function writeStageResult(taskSpecDir, taskId, result) {
    44	  mkdirSync(taskSpecDir, { recursive: true });
    45	  const path = join(taskSpecDir, 'stage-result-verify-code.json');
    46	  writeFileSync(path, JSON.stringify(result, null, 2), 'utf-8');
    47	}
    48	
    49	/**
    50	 * Validate a metric record has all 10 required keys.
    51	 */
    52	export function validateMetricRecord(record) {
    53	  const missing = METRIC_KEYS.filter(k => !(k in (record || {})));
    54	  return { valid: missing.length === 0, missing };
    55	}

exec
/bin/bash -lc "nl -ba workflows/verify-code/freshness.mjs | sed -n '1,220p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	/**
     2	 * Check freshness by comparing build-code git_sha with current HEAD.
     3	 * Pure function — no IO, no side effects. Never throws (F3 non-blocking).
     4	 *
     5	 * @param {string|null|undefined} buildSha — git_sha from build-code facts
     6	 * @param {string|null|undefined} headSha — current HEAD git_sha
     7	 * @returns {{ anomaly_flags: string[], warnings: Array<{type:string, message:string}> }}
     8	 */
     9	export function checkFreshness(buildSha, headSha) {
    10	  const anomaly_flags = [];
    11	  const warnings = [];
    12	
    13	  const b = (buildSha || '').toString();
    14	  const h = (headSha || '').toString();
    15	
    16	  if (b !== h || !b || !h) {
    17	    anomaly_flags.push('stale_sha');
    18	  }
    19	
    20	  if (anomaly_flags.length > 0) {
    21	    warnings.push({
    22	      type: 'warning',
    23	      message: `stale_sha: build-code facts git_sha (${b || 'missing'}) does not match current HEAD (${h || 'missing'}) — verify-code results may not reflect latest code`,
    24	    });
    25	  }
    26	
    27	  return { anomaly_flags, warnings };
    28	}
    29	
    30	/**
    31	 * Format anomaly_flags array into a human-readable string.
    32	 *
    33	 * @param {string[]} anomaly_flags
    34	 * @returns {string}
    35	 */
    36	export function getAnomalyFlagsText(anomaly_flags) {
    37	  if (!anomaly_flags || anomaly_flags.length === 0) return '';
    38	  return `⚠ Anomaly flags: ${anomaly_flags.join(', ')}`;
    39	}

exec
/bin/bash -lc "nl -ba workflows/build-code/facts-schema.mjs | sed -n '1,260p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	// facts-schema.mjs — pure ESM, no IO
     2	
     3	const VALID_STATUSES = ['executed', 'not_executed'];
     4	const VALID_SOURCES = ['third_party', 'same_source'];
     5	const VALID_VERDICTS = ['pass', 'revise_required', 'escalate_to_human'];
     6	
     7	export function validateFacts(facts) {
     8	  const missing = [];
     9	  for (const key of ['changed', 'tests', 'review']) {
    10	    if (facts[key] == null) missing.push(key);
    11	  }
    12	  if (facts.review != null && facts.review.status == null) {
    13	    missing.push('review.status');
    14	  }
    15	  // C1 (M9): command field is optional but if present must be string
    16	  if (facts.tests != null && facts.tests.command !== undefined && typeof facts.tests.command !== 'string') {
    17	    missing.push('tests.command');
    18	  }
    19	  return { valid: missing.length === 0, missing };
    20	}
    21	
    22	export function buildReviewFact({ status, source, verdict, artifactPath }) {
    23	  if (!VALID_STATUSES.includes(status)) {
    24	    throw new Error(`Invalid status: ${status}`);
    25	  }
    26	  if (status === 'executed') {
    27	    if (!VALID_SOURCES.includes(source)) {
    28	      throw new Error(`Invalid source: ${source}`);
    29	    }
    30	    if (!VALID_VERDICTS.includes(verdict)) {
    31	      throw new Error(`Invalid verdict: ${verdict}`);
    32	    }
    33	    if (!artifactPath) {
    34	      throw new Error(`executed review requires a non-empty artifactPath`);
    35	    }
    36	    return { status, source, verdict, artifact_path: artifactPath };
    37	  }
    38	  return { status };
    39	}
    40	
    41	export function getWarnings(reviewFact) {
    42	  if (reviewFact.status === 'not_executed') {
    43	    return [{ type: 'warning', message: '审查未执行' }];
    44	  }
    45	  return [];
    46	}

exec
/bin/bash -lc "nl -ba workflows/build-code/SKILL.md | sed -n '1,260p'" in /Users/Hugh/Hugh/Project/workflowhub
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
    20	- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list.
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
    36	   ```
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
    50	- `suspicious_red_exit` — RED exited 0 (tests should have failed)
    51	- `suspicious_green_exit` — GREEN exited non-zero (tests should have passed)
    52	- `green_test_files_empty` — no test files were discovered in the GREEN run
    53	
    54	When any of these conditions hold, surface a **non-blocking warning** to the user. Do not halt the phase; record the warning in the phase notes. A false-green does not automatically invalidate the phase, but must be acknowledged.
    55	
    56	### 4. diff-only 越界检测
    57	
    58	After each phase's implementation, run:
    59	
    60	> **Delegation:** Scanning the diff is a read-heavy action — dispatch it to a subagent (e.g. an explore worker) that runs `diff-scanner.mjs` and returns only the violation list. The orchestrator does not run the scan itself.
    61	
    62	```
    63	node workflows/build-code/diff-scanner.mjs scanDiff
    64	```
    65	
    66	This checks the current `git diff` against the C2 bounded-change list defined in `docs/contracts/C2-scope-bounds.md`. The scanner returns a list of violations (files or patterns outside the declared scope).
    67	
    68	**If violations are found: STOP immediately.** Do not auto-proceed. Show the violation type and affected paths to the user and wait for **explicit human confirmation** before continuing. This is enforced by FR-DIFF-002 — no automated bypass is permitted.
    69	
    70	### 5. worktree 路径可配置
    71	
    72	The skill accepts a caller-provided `worktree_root` config key that specifies the absolute path to the implementation worktree. Never hardcode a path. Never resolve upward to the host agenthub repo directory — the worktree is always the provided `worktree_root` and all file operations are scoped to it. This is enforced by FR-WT-001.
    73	
    74	If `worktree_root` is absent from the caller config, fail fast with a clear error rather than guessing.
    75	
    76	### 6. Worker-Mode 子代理
    77	
    78	Use Worker-Mode to spawn an implementer worker for the actual code-writing work. Worker-Mode is an external semver dependency — version-pin it in the skill config and do not inline its logic.
    79	
    80	When dispatching to the worker:
    81	- Pass **ABSOLUTE paths** for all file references (source files, evidence output paths, task dir).
    82	- Explicitly forbid the worker from running `git commit` — include the instruction `DO NOT commit. Leave changes in the working tree.` in the worker prompt (FR-SUB-002).
    83	- The worker returns its output; the orchestrating skill (this SKILL.md) reads it and proceeds to the next step.
    84	
    85	### 7. 3rd-review standalone
    86	
    87	After GREEN evidence is confirmed for a phase, call the **3rd-review standalone entry**. Feed the real `git diff` output (not a natural-language description of the change — using prose triggers the same-source downgrade path in 3rd-review's classifier).
    88	
    89	Consume the 3-state verdict:
    90	- `pass` — proceed to the next phase.
    91	- `revise_required` — return to implementation and address findings before re-running GREEN + 3rd-review.
    92	- `escalate_to_human` — halt and present the finding summary to the user; do not auto-resolve.
    93	
    94	If the 3rd-review skill is unavailable (not installed or not reachable), downgrade gracefully to `same_source` review and record `facts.review.source = "same_source"` so downstream stages can detect the degraded state.
    95	
    96	### 8. facts.review 产出
    97	
    98	After 3rd-review completes for each phase, construct the review fact using `facts-schema.mjs`:
    99	
   100	```js
   101	import { buildReviewFact } from "./facts-schema.mjs";
   102	// When review ran successfully:
   103	const reviewFact = buildReviewFact({ status: "executed", source, verdict, artifactPath });
   104	// source must be "third_party" or "same_source"; verdict must be "pass" | "revise_required" | "escalate_to_human"
   105	// artifactPath is the durable path to the review report, e.g. "specs/{task-id}/reviews/build-code-phase-N.md"
   106	
   107	// When review was skipped or could not run:
   108	// const reviewFact = buildReviewFact({ status: "not_executed" });
   109	```
   110	
   111	Write the result into `stage-result` under the `facts.review` key. The `buildReviewFact` function enforces the schema; do not hand-construct the object.
   112	
   113	### 9. 事实包产出
   114	
   115	When all phases are complete, write the stage-result with a structured facts package (FR-PKG-001/002/003). The three required keys are:
   116	
   117	- `facts.changed` — **array** of changed file paths (one entry per file, not a comma-joined string).
   118	- `facts.tests` — **struct** with at minimum `{ passed: <n>, total: <n>, files: [...] }`. Must include `command` field (the test command string that was executed) for verify-code downstream consumption (M9 C1).
   119	- `facts.review` — **struct** produced by `buildReviewFact` (see §8 above).
   120	
   121	Write the stage-result to a durable task path (not a temp file) so downstream stages can read it. The exact path follows the project convention: `specs/{task-id}/stage-result-build-code.json`.
   122	
   123	Example shape:
   124	
   125	```json
   126	{
   127	  "status": "success",
   128	  "error_code": "",
   129	  "retryable": false,
   130	  "facts": {
   131	    "changed": ["core/text-utils.mjs", "tests/text-utils.test.mjs"],
   132	    "tests": { "passed": 12, "total": 12, "files": ["tests/text-utils.test.mjs"], "command": "pnpm exec vitest run tests/text-utils.test.mjs" },
   133	    "review": { "status": "executed", "source": "third_party", "verdict": "pass", "artifact_path": "specs/{task-id}/reviews/build-code-phase-1.md" }
   134	  },
   135	  "missing_items": [],
   136	  "user_decision": false,
   137	  "reason": "All phases implemented with RED→GREEN evidence and 3rd-review pass."
   138	}
   139	```
   140	
   141	### 10. metrics 記録
   142	
   143	Record metrics via `metrics/collector.mjs`. Call `recordSkeleton` at stage start (before any implementation work) and `updateOwnResult` at stage end (after the stage-result is written). Fields must align with the M4 record-schema:
   144	
   145	```json
   146	{
   147	  "execution_id": "<uuid>",
   148	  "skill_or_stage": "build-code",
   149	  "stage": "build-code",
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
   160	Do not hand-write a raw jsonl line. Use the collector API only.

codex
目前看到一个需要重点判断的点：`freshness.mjs` 把任一 SHA 为空也判成 `stale_sha`，这比“只做 SHA 不一致比较”的需求更激进。接下来我看测试是否把这个行为锁死，以及是否存在真正漏测。
exec
/bin/bash -lc "nl -ba tests/build-code-facts.test.mjs | sed -n '1,260p'" in /Users/Hugh/Hugh/Project/workflowhub
exec
/bin/bash -lc "nl -ba tests/verify-code-freshness.test.mjs | sed -n '1,220p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	import { describe, it, expect } from 'vitest';
     2	import { validateFacts } from '../workflows/build-code/facts-schema.mjs';
     3	
     4	const completeReview = {
     5	  status: 'executed', source: 'third_party', verdict: 'pass', artifact_path: 'x.md',
     6	};
     7	const completeFacts = {
     8	  changed: { files: ['a.ts'] }, tests: { passed: true }, review: completeReview,
     9	};
    10	
    11	describe('validateFacts (C1 baseline — regression guard)', () => {
    12	  it('complete C1 facts object is valid with empty missing', () => {
    13	    const result = validateFacts(completeFacts);
    14	    expect(result.valid).toBe(true);
    15	    expect(result.missing).toEqual([]);
    16	  });
    17	  it('missing facts.changed → invalid', () => {
    18	    expect(validateFacts({ tests: completeFacts.tests, review: completeReview }).valid).toBe(false);
    19	  });
    20	  it('missing facts.tests → invalid', () => {
    21	    expect(validateFacts({ changed: completeFacts.changed, review: completeReview }).valid).toBe(false);
    22	  });
    23	  it('missing facts.review → invalid', () => {
    24	    expect(validateFacts({ changed: completeFacts.changed, tests: completeFacts.tests }).valid).toBe(false);
    25	  });
    26	  it('review missing status → invalid', () => {
    27	    const f = { changed: completeFacts.changed, tests: completeFacts.tests, review: { source: 'third_party', verdict: 'pass', artifact_path: 'x.md' } };
    28	    expect(validateFacts(f).valid).toBe(false);
    29	    expect(validateFacts(f).missing).toContain('review.status');
    30	  });
    31	  it('complete three-key structure is valid (M9 can read directly)', () => {
    32	    expect(validateFacts({ changed: { summary: 'refactor' }, tests: { coverage: 90 }, review: { status: 'executed', source: 'third_party', verdict: 'pass', artifact_path: 'r.md' } }).valid).toBe(true);
    33	  });
    34	});
    35	
    36	describe('validateFacts — C1 command field (M9 optional)', () => {
    37	  it('old M8 facts without command field → still valid (backward compat)', () => {
    38	    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true }, review: completeReview };
    39	    expect(validateFacts(facts).valid).toBe(true);
    40	  });
    41	
    42	  it('command field present with string type → valid', () => {
    43	    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true, command: 'npx vitest run' }, review: completeReview };
    44	    expect(validateFacts(facts).valid).toBe(true);
    45	  });
    46	
    47	  it('command field present but not string → invalid with missing=[tests.command]', () => {
    48	    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true, command: 123 }, review: completeReview };
    49	    const r = validateFacts(facts);
    50	    expect(r.valid).toBe(false);
    51	    expect(r.missing).toContain('tests.command');
    52	  });
    53	
    54	  // Falsifiability: if command were made required (validation removed), old facts would break
    55	  it('falsifiable: old M8 facts remain valid when command is absent', () => {
    56	    const oldFacts = { changed: { files: ['old.ts'] }, tests: { passed: true }, review: { status: 'not_executed' } };
    57	    expect(validateFacts(oldFacts).valid).toBe(true);
    58	  });
    59	});

 succeeded in 0ms:
     1	import { describe, it, expect } from 'vitest';
     2	import { checkFreshness, getAnomalyFlagsText } from '../workflows/verify-code/freshness.mjs';
     3	
     4	describe('checkFreshness', () => {
     5	  it('should return empty anomaly_flags and warnings when sha matches', () => {
     6	    const sha = 'a'.repeat(40);
     7	    const result = checkFreshness(sha, sha);
     8	    expect(result.anomaly_flags).toEqual([]);
     9	    expect(result.warnings).toEqual([]);
    10	  });
    11	
    12	  it('should return stale_sha flag when sha does not match', () => {
    13	    const result = checkFreshness('a'.repeat(40), 'b'.repeat(40));
    14	    expect(result.anomaly_flags).toContain('stale_sha');
    15	  });
    16	
    17	  it('should include warnings when anomaly_flags is non-empty', () => {
    18	    const result = checkFreshness('a'.repeat(40), 'b'.repeat(40));
    19	    expect(result.warnings.length).toBeGreaterThan(0);
    20	    expect(result.warnings[0]).toHaveProperty('type', 'warning');
    21	    expect(result.warnings[0]).toHaveProperty('message');
    22	    expect(result.warnings[0].message).toContain('stale');
    23	  });
    24	
    25	  it('should never throw (F3 non-blocking)', () => {
    26	    expect(() => checkFreshness('', '')).not.toThrow();
    27	    expect(() => checkFreshness(null, undefined)).not.toThrow();
    28	    expect(() => checkFreshness('abc', 'def')).not.toThrow();
    29	  });
    30	
    31	  it('should handle edge cases without throwing', () => {
    32	    const r1 = checkFreshness(undefined, undefined);
    33	    expect(Array.isArray(r1.anomaly_flags)).toBe(true);
    34	    expect(Array.isArray(r1.warnings)).toBe(true);
    35	
    36	    const r2 = checkFreshness(null, null);
    37	    expect(Array.isArray(r2.anomaly_flags)).toBe(true);
    38	    expect(Array.isArray(r2.warnings)).toBe(true);
    39	  });
    40	});
    41	
    42	describe('getAnomalyFlagsText', () => {
    43	  it('should return empty string for empty array', () => {
    44	    expect(getAnomalyFlagsText([])).toBe('');
    45	  });
    46	
    47	  it('should format stale_sha flag', () => {
    48	    const text = getAnomalyFlagsText(['stale_sha']);
    49	    expect(text).toContain('stale_sha');
    50	    expect(text.length).toBeGreaterThan(0);
    51	  });
    52	
    53	  it('should format multiple flags', () => {
    54	    const text = getAnomalyFlagsText(['stale_sha', 'future_flag']);
    55	    expect(text).toContain('stale_sha');
    56	    expect(text).toContain('future_flag');
    57	  });
    58	});
    59	
    60	// Falsifiability: if warnings generation is broken, this must catch it
    61	describe('falsifiability guard', () => {
    62	  it('warnings should be non-empty when anomaly_flags is non-empty (falsifiable)', () => {
    63	    const result = checkFreshness('a'.repeat(40), 'b'.repeat(40));
    64	    // If someone comments out the warnings generation, this fails
    65	    expect(result.anomaly_flags.length).toBeGreaterThan(0);
    66	    expect(result.warnings.length).toBeGreaterThan(0);
    67	  });
    68	});

exec
/bin/bash -lc "nl -ba tests/verify-code-facts.test.mjs | sed -n '1,260p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	import { describe, it, expect, beforeAll, afterAll } from 'vitest';
     2	import { readCommand, assembleStageResult, writeStageResult, validateMetricRecord } from '../workflows/verify-code/facts-assembly.mjs';
     3	import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
     4	import { join } from 'node:path';
     5	import { tmpdir } from 'node:os';
     6	
     7	let tmpDir;
     8	beforeAll(() => { tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-facts-')); });
     9	afterAll(() => { if (tmpDir) rmSync(tmpDir, { recursive: true, force: true }); });
    10	
    11	describe('readCommand', () => {
    12	  it('should return command string from facts.tests.command', () => {
    13	    const cmd = readCommand({ facts: { tests: { command: 'npx vitest run' } } });
    14	    expect(cmd).toBe('npx vitest run');
    15	  });
    16	
    17	  it('should throw when facts.tests.command is missing', () => {
    18	    expect(() => readCommand({ facts: { tests: {} } })).toThrow(/command/);
    19	  });
    20	
    21	  it('should throw with retryable=true when facts.tests is missing', () => {
    22	    try {
    23	      readCommand({ facts: {} });
    24	      expect.fail('should have thrown');
    25	    } catch (e) {
    26	      expect(e.message).toBeTruthy();
    27	      expect(e.retryable).toBe(true);
    28	    }
    29	  });
    30	
    31	  it('should throw when facts is missing', () => {
    32	    expect(() => readCommand({})).toThrow();
    33	  });
    34	});
    35	
    36	describe('assembleStageResult', () => {
    37	  const baseOpts = { verdict: 'pass', evidenceRef: 'evidence/fresh-capture.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false };
    38	
    39	  it('should return 7-key stage-result object', () => {
    40	    const r = assembleStageResult(baseOpts);
    41	    expect(r).toHaveProperty('verdict');
    42	    expect(r).toHaveProperty('evidence_ref');
    43	    expect(r).toHaveProperty('anomaly_flags');
    44	    expect(r).toHaveProperty('missing_items');
    45	    expect(r).toHaveProperty('user_decision');
    46	    expect(r).toHaveProperty('reason');
    47	    expect(r).toHaveProperty('error_code');
    48	  });
    49	
    50	  it('should preserve all passed values', () => {
    51	    const r = assembleStageResult({ verdict: 'pass', evidenceRef: 'ev/1.json', anomalyFlags: ['stale_sha'], missingItems: ['browser'], userDecision: true, reason: 'ok', errorCode: 'E1', retryable: false });
    52	    expect(r.verdict).toBe('pass');
    53	    expect(r.evidence_ref).toBe('ev/1.json');
    54	    expect(r.anomaly_flags).toEqual(['stale_sha']);
    55	    expect(r.missing_items).toEqual(['browser']);
    56	    expect(r.user_decision).toBe(true);
    57	    expect(r.reason).toBe('ok');
    58	    expect(r.error_code).toBe('E1');
    59	  });
    60	
    61	  it('evidence_ref should be relative path without specs/{task-id}/ prefix', () => {
    62	    const r = assembleStageResult({ ...baseOpts, evidenceRef: 'specs/m9/evidence/fresh-capture.json' });
    63	    // evidence_ref is stored as-is; the path validation is consumer-side
    64	    expect(r.evidence_ref).toBe('specs/m9/evidence/fresh-capture.json');
    65	  });
    66	
    67	  it('should handle minimal opts', () => {
    68	    const r = assembleStageResult({ verdict: 'pass', evidenceRef: 'e.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false });
    69	    expect(r.verdict).toBe('pass');
    70	  });
    71	
    72	  // Falsifiability: delete user_decision field → test must fail
    73	  it('user_decision must be present (falsifiable)', () => {
    74	    const r = assembleStageResult(baseOpts);
    75	    expect('user_decision' in r).toBe(true);
    76	  });
    77	});
    78	
    79	describe('writeStageResult', () => {
    80	  it('should write stage-result JSON to specs/{task-id}/ directory', () => {
    81	    const result = assembleStageResult({ verdict: 'pass', evidenceRef: 'ev/1.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false });
    82	    writeStageResult(tmpDir, 'm9-test', result);
    83	    const raw = readFileSync(join(tmpDir, 'stage-result-verify-code.json'), 'utf-8');
    84	    const parsed = JSON.parse(raw);
    85	    expect(parsed.verdict).toBe('pass');
    86	  });
    87	
    88	  it('should create directory if not exists', () => {
    89	    const nested = join(tmpDir, 'nested-specs', 'm9-deep');
    90	    const result = assembleStageResult({ verdict: 'pass', evidenceRef: 'e.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false });
    91	    writeStageResult(nested, 'm9-deep', result);
    92	    const raw = readFileSync(join(nested, 'stage-result-verify-code.json'), 'utf-8');
    93	    expect(JSON.parse(raw).verdict).toBe('pass');
    94	  });
    95	});
    96	
    97	describe('validateMetricRecord', () => {
    98	  const validRecord = {
    99	    execution_id: 'exec-1', skill_or_stage: 'verify-code', stage: 'apply',
   100	    skill_version: 'v1', executed: true, tokens: 1000, duration_ms: 500,
   101	    rework_rounds: 2, human_intervention: false, friction_ref: 'none',
   102	  };
   103	
   104	  it('should return valid:true for complete 10-key record', () => {
   105	    expect(validateMetricRecord(validRecord)).toEqual({ valid: true, missing: [] });
   106	  });
   107	
   108	  it('should detect missing keys', () => {
   109	    const { execution_id, ...incomplete } = validRecord;
   110	    const r = validateMetricRecord(incomplete);
   111	    expect(r.valid).toBe(false);
   112	    expect(r.missing).toContain('execution_id');
   113	  });
   114	
   115	  it('should detect multiple missing keys', () => {
   116	    const r = validateMetricRecord({ execution_id: 'x' });
   117	    expect(r.valid).toBe(false);
   118	    expect(r.missing.length).toBeGreaterThan(1);
   119	  });
   120	
   121	  // Falsifiability: delete one key → test must fail
   122	  it('falsifiable: removing a key must be detected', () => {
   123	    const { rework_rounds, ...partial } = validRecord;
   124	    expect(validateMetricRecord(partial).valid).toBe(false);
   125	  });
   126	});

exec
/bin/bash -lc 'git diff --check 1d1c555..dc567f2' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
codex
已经有一个明确缺口：`verify-code-facts.test.mjs` 的 evidence_ref 测试写反了，注释说应由消费者校验，实际却接受 `specs/...` 前缀。这会让 FR-PATH-003 的可证伪性失效。
exec
/bin/bash -lc 'git diff --unified=80 1d1c555..dc567f2 -- workflows/verify-code/facts-assembly.mjs tests/verify-code-facts.test.mjs workflows/verify-code/freshness.mjs tests/verify-code-freshness.test.mjs workflows/build-code/facts-schema.mjs tests/build-code-facts.test.mjs workflows/build-code/SKILL.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
diff --git a/tests/build-code-facts.test.mjs b/tests/build-code-facts.test.mjs
index 809848f..dcdefc4 100644
--- a/tests/build-code-facts.test.mjs
+++ b/tests/build-code-facts.test.mjs
@@ -1,66 +1,59 @@
 import { describe, it, expect } from 'vitest';
 import { validateFacts } from '../workflows/build-code/facts-schema.mjs';
 
 const completeReview = {
-  status: 'executed',
-  source: 'third_party',
-  verdict: 'pass',
-  artifact_path: 'x.md',
+  status: 'executed', source: 'third_party', verdict: 'pass', artifact_path: 'x.md',
 };
-
 const completeFacts = {
-  changed: { files: ['a.ts'] },
-  tests: { passed: true },
-  review: completeReview,
+  changed: { files: ['a.ts'] }, tests: { passed: true }, review: completeReview,
 };
 
-describe('validateFacts', () => {
+describe('validateFacts (C1 baseline — regression guard)', () => {
   it('complete C1 facts object is valid with empty missing', () => {
     const result = validateFacts(completeFacts);
     expect(result.valid).toBe(true);
     expect(result.missing).toEqual([]);
   });
-
-  it('missing facts.changed → invalid with missing=[changed]', () => {
-    const facts = { tests: completeFacts.tests, review: completeReview };
-    const result = validateFacts(facts);
-    expect(result.valid).toBe(false);
-    expect(result.missing).toContain('changed');
+  it('missing facts.changed → invalid', () => {
+    expect(validateFacts({ tests: completeFacts.tests, review: completeReview }).valid).toBe(false);
+  });
+  it('missing facts.tests → invalid', () => {
+    expect(validateFacts({ changed: completeFacts.changed, review: completeReview }).valid).toBe(false);
   });
+  it('missing facts.review → invalid', () => {
+    expect(validateFacts({ changed: completeFacts.changed, tests: completeFacts.tests }).valid).toBe(false);
+  });
+  it('review missing status → invalid', () => {
+    const f = { changed: completeFacts.changed, tests: completeFacts.tests, review: { source: 'third_party', verdict: 'pass', artifact_path: 'x.md' } };
+    expect(validateFacts(f).valid).toBe(false);
+    expect(validateFacts(f).missing).toContain('review.status');
+  });
+  it('complete three-key structure is valid (M9 can read directly)', () => {
+    expect(validateFacts({ changed: { summary: 'refactor' }, tests: { coverage: 90 }, review: { status: 'executed', source: 'third_party', verdict: 'pass', artifact_path: 'r.md' } }).valid).toBe(true);
+  });
+});
 
-  it('missing facts.tests → invalid with missing=[tests]', () => {
-    const facts = { changed: completeFacts.changed, review: completeReview };
-    const result = validateFacts(facts);
-    expect(result.valid).toBe(false);
-    expect(result.missing).toContain('tests');
+describe('validateFacts — C1 command field (M9 optional)', () => {
+  it('old M8 facts without command field → still valid (backward compat)', () => {
+    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true }, review: completeReview };
+    expect(validateFacts(facts).valid).toBe(true);
   });
 
-  it('missing facts.review → invalid with missing=[review]', () => {
-    const facts = { changed: completeFacts.changed, tests: completeFacts.tests };
-    const result = validateFacts(facts);
-    expect(result.valid).toBe(false);
-    expect(result.missing).toContain('review');
+  it('command field present with string type → valid', () => {
+    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true, command: 'npx vitest run' }, review: completeReview };
+    expect(validateFacts(facts).valid).toBe(true);
   });
 
-  it('review present but missing status field → invalid with missing=[review.status]', () => {
-    const facts = {
-      changed: completeFacts.changed,
-      tests: completeFacts.tests,
-      review: { source: 'third_party', verdict: 'pass', artifact_path: 'x.md' },
-    };
-    const result = validateFacts(facts);
-    expect(result.valid).toBe(false);
-    expect(result.missing).toContain('review.status');
+  it('command field present but not string → invalid with missing=[tests.command]', () => {
+    const facts = { changed: { files: ['a.ts'] }, tests: { passed: true, command: 123 }, review: completeReview };
+    const r = validateFacts(facts);
+    expect(r.valid).toBe(false);
+    expect(r.missing).toContain('tests.command');
   });
 
-  it('complete three-key structure is valid (M9 can read directly)', () => {
-    const facts = {
-      changed: { summary: 'refactor' },
-      tests: { coverage: 90 },
-      review: { status: 'executed', source: 'third_party', verdict: 'pass', artifact_path: 'r.md' },
-    };
-    const result = validateFacts(facts);
-    expect(result.valid).toBe(true);
-    expect(result.missing).toEqual([]);
+  // Falsifiability: if command were made required (validation removed), old facts would break
+  it('falsifiable: old M8 facts remain valid when command is absent', () => {
+    const oldFacts = { changed: { files: ['old.ts'] }, tests: { passed: true }, review: { status: 'not_executed' } };
+    expect(validateFacts(oldFacts).valid).toBe(true);
   });
 });
diff --git a/tests/verify-code-facts.test.mjs b/tests/verify-code-facts.test.mjs
new file mode 100644
index 0000000..ec055d7
--- /dev/null
+++ b/tests/verify-code-facts.test.mjs
@@ -0,0 +1,126 @@
+import { describe, it, expect, beforeAll, afterAll } from 'vitest';
+import { readCommand, assembleStageResult, writeStageResult, validateMetricRecord } from '../workflows/verify-code/facts-assembly.mjs';
+import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
+import { join } from 'node:path';
+import { tmpdir } from 'node:os';
+
+let tmpDir;
+beforeAll(() => { tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-facts-')); });
+afterAll(() => { if (tmpDir) rmSync(tmpDir, { recursive: true, force: true }); });
+
+describe('readCommand', () => {
+  it('should return command string from facts.tests.command', () => {
+    const cmd = readCommand({ facts: { tests: { command: 'npx vitest run' } } });
+    expect(cmd).toBe('npx vitest run');
+  });
+
+  it('should throw when facts.tests.command is missing', () => {
+    expect(() => readCommand({ facts: { tests: {} } })).toThrow(/command/);
+  });
+
+  it('should throw with retryable=true when facts.tests is missing', () => {
+    try {
+      readCommand({ facts: {} });
+      expect.fail('should have thrown');
+    } catch (e) {
+      expect(e.message).toBeTruthy();
+      expect(e.retryable).toBe(true);
+    }
+  });
+
+  it('should throw when facts is missing', () => {
+    expect(() => readCommand({})).toThrow();
+  });
+});
+
+describe('assembleStageResult', () => {
+  const baseOpts = { verdict: 'pass', evidenceRef: 'evidence/fresh-capture.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false };
+
+  it('should return 7-key stage-result object', () => {
+    const r = assembleStageResult(baseOpts);
+    expect(r).toHaveProperty('verdict');
+    expect(r).toHaveProperty('evidence_ref');
+    expect(r).toHaveProperty('anomaly_flags');
+    expect(r).toHaveProperty('missing_items');
+    expect(r).toHaveProperty('user_decision');
+    expect(r).toHaveProperty('reason');
+    expect(r).toHaveProperty('error_code');
+  });
+
+  it('should preserve all passed values', () => {
+    const r = assembleStageResult({ verdict: 'pass', evidenceRef: 'ev/1.json', anomalyFlags: ['stale_sha'], missingItems: ['browser'], userDecision: true, reason: 'ok', errorCode: 'E1', retryable: false });
+    expect(r.verdict).toBe('pass');
+    expect(r.evidence_ref).toBe('ev/1.json');
+    expect(r.anomaly_flags).toEqual(['stale_sha']);
+    expect(r.missing_items).toEqual(['browser']);
+    expect(r.user_decision).toBe(true);
+    expect(r.reason).toBe('ok');
+    expect(r.error_code).toBe('E1');
+  });
+
+  it('evidence_ref should be relative path without specs/{task-id}/ prefix', () => {
+    const r = assembleStageResult({ ...baseOpts, evidenceRef: 'specs/m9/evidence/fresh-capture.json' });
+    // evidence_ref is stored as-is; the path validation is consumer-side
+    expect(r.evidence_ref).toBe('specs/m9/evidence/fresh-capture.json');
+  });
+
+  it('should handle minimal opts', () => {
+    const r = assembleStageResult({ verdict: 'pass', evidenceRef: 'e.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false });
+    expect(r.verdict).toBe('pass');
+  });
+
+  // Falsifiability: delete user_decision field → test must fail
+  it('user_decision must be present (falsifiable)', () => {
+    const r = assembleStageResult(baseOpts);
+    expect('user_decision' in r).toBe(true);
+  });
+});
+
+describe('writeStageResult', () => {
+  it('should write stage-result JSON to specs/{task-id}/ directory', () => {
+    const result = assembleStageResult({ verdict: 'pass', evidenceRef: 'ev/1.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false });
+    writeStageResult(tmpDir, 'm9-test', result);
+    const raw = readFileSync(join(tmpDir, 'stage-result-verify-code.json'), 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.verdict).toBe('pass');
+  });
+
+  it('should create directory if not exists', () => {
+    const nested = join(tmpDir, 'nested-specs', 'm9-deep');
+    const result = assembleStageResult({ verdict: 'pass', evidenceRef: 'e.json', anomalyFlags: [], missingItems: [], userDecision: null, reason: '', errorCode: null, retryable: false });
+    writeStageResult(nested, 'm9-deep', result);
+    const raw = readFileSync(join(nested, 'stage-result-verify-code.json'), 'utf-8');
+    expect(JSON.parse(raw).verdict).toBe('pass');
+  });
+});
+
+describe('validateMetricRecord', () => {
+  const validRecord = {
+    execution_id: 'exec-1', skill_or_stage: 'verify-code', stage: 'apply',
+    skill_version: 'v1', executed: true, tokens: 1000, duration_ms: 500,
+    rework_rounds: 2, human_intervention: false, friction_ref: 'none',
+  };
+
+  it('should return valid:true for complete 10-key record', () => {
+    expect(validateMetricRecord(validRecord)).toEqual({ valid: true, missing: [] });
+  });
+
+  it('should detect missing keys', () => {
+    const { execution_id, ...incomplete } = validRecord;
+    const r = validateMetricRecord(incomplete);
+    expect(r.valid).toBe(false);
+    expect(r.missing).toContain('execution_id');
+  });
+
+  it('should detect multiple missing keys', () => {
+    const r = validateMetricRecord({ execution_id: 'x' });
+    expect(r.valid).toBe(false);
+    expect(r.missing.length).toBeGreaterThan(1);
+  });
+
+  // Falsifiability: delete one key → test must fail
+  it('falsifiable: removing a key must be detected', () => {
+    const { rework_rounds, ...partial } = validRecord;
+    expect(validateMetricRecord(partial).valid).toBe(false);
+  });
+});
diff --git a/tests/verify-code-freshness.test.mjs b/tests/verify-code-freshness.test.mjs
new file mode 100644
index 0000000..47a5667
--- /dev/null
+++ b/tests/verify-code-freshness.test.mjs
@@ -0,0 +1,68 @@
+import { describe, it, expect } from 'vitest';
+import { checkFreshness, getAnomalyFlagsText } from '../workflows/verify-code/freshness.mjs';
+
+describe('checkFreshness', () => {
+  it('should return empty anomaly_flags and warnings when sha matches', () => {
+    const sha = 'a'.repeat(40);
+    const result = checkFreshness(sha, sha);
+    expect(result.anomaly_flags).toEqual([]);
+    expect(result.warnings).toEqual([]);
+  });
+
+  it('should return stale_sha flag when sha does not match', () => {
+    const result = checkFreshness('a'.repeat(40), 'b'.repeat(40));
+    expect(result.anomaly_flags).toContain('stale_sha');
+  });
+
+  it('should include warnings when anomaly_flags is non-empty', () => {
+    const result = checkFreshness('a'.repeat(40), 'b'.repeat(40));
+    expect(result.warnings.length).toBeGreaterThan(0);
+    expect(result.warnings[0]).toHaveProperty('type', 'warning');
+    expect(result.warnings[0]).toHaveProperty('message');
+    expect(result.warnings[0].message).toContain('stale');
+  });
+
+  it('should never throw (F3 non-blocking)', () => {
+    expect(() => checkFreshness('', '')).not.toThrow();
+    expect(() => checkFreshness(null, undefined)).not.toThrow();
+    expect(() => checkFreshness('abc', 'def')).not.toThrow();
+  });
+
+  it('should handle edge cases without throwing', () => {
+    const r1 = checkFreshness(undefined, undefined);
+    expect(Array.isArray(r1.anomaly_flags)).toBe(true);
+    expect(Array.isArray(r1.warnings)).toBe(true);
+
+    const r2 = checkFreshness(null, null);
+    expect(Array.isArray(r2.anomaly_flags)).toBe(true);
+    expect(Array.isArray(r2.warnings)).toBe(true);
+  });
+});
+
+describe('getAnomalyFlagsText', () => {
+  it('should return empty string for empty array', () => {
+    expect(getAnomalyFlagsText([])).toBe('');
+  });
+
+  it('should format stale_sha flag', () => {
+    const text = getAnomalyFlagsText(['stale_sha']);
+    expect(text).toContain('stale_sha');
+    expect(text.length).toBeGreaterThan(0);
+  });
+
+  it('should format multiple flags', () => {
+    const text = getAnomalyFlagsText(['stale_sha', 'future_flag']);
+    expect(text).toContain('stale_sha');
+    expect(text).toContain('future_flag');
+  });
+});
+
+// Falsifiability: if warnings generation is broken, this must catch it
+describe('falsifiability guard', () => {
+  it('warnings should be non-empty when anomaly_flags is non-empty (falsifiable)', () => {
+    const result = checkFreshness('a'.repeat(40), 'b'.repeat(40));
+    // If someone comments out the warnings generation, this fails
+    expect(result.anomaly_flags.length).toBeGreaterThan(0);
+    expect(result.warnings.length).toBeGreaterThan(0);
+  });
+});
diff --git a/workflows/build-code/SKILL.md b/workflows/build-code/SKILL.md
index b002d31..fafbb8a 100644
--- a/workflows/build-code/SKILL.md
+++ b/workflows/build-code/SKILL.md
@@ -38,123 +38,123 @@ Sequence per phase:
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
 
 ```
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
-- `facts.tests` — **struct** with at minimum `{ passed: <n>, total: <n>, files: [...] }`.
+- `facts.tests` — **struct** with at minimum `{ passed: <n>, total: <n>, files: [...] }`. Must include `command` field (the test command string that was executed) for verify-code downstream consumption (M9 C1).
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
-    "tests": { "passed": 12, "total": 12, "files": ["tests/text-utils.test.mjs"] },
+    "tests": { "passed": 12, "total": 12, "files": ["tests/text-utils.test.mjs"], "command": "pnpm exec vitest run tests/text-utils.test.mjs" },
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
diff --git a/workflows/build-code/facts-schema.mjs b/workflows/build-code/facts-schema.mjs
index fc5d904..6a8e3a4 100644
--- a/workflows/build-code/facts-schema.mjs
+++ b/workflows/build-code/facts-schema.mjs
@@ -1,43 +1,46 @@
 // facts-schema.mjs — pure ESM, no IO
 
 const VALID_STATUSES = ['executed', 'not_executed'];
 const VALID_SOURCES = ['third_party', 'same_source'];
 const VALID_VERDICTS = ['pass', 'revise_required', 'escalate_to_human'];
 
 export function validateFacts(facts) {
   const missing = [];
   for (const key of ['changed', 'tests', 'review']) {
     if (facts[key] == null) missing.push(key);
   }
   if (facts.review != null && facts.review.status == null) {
     missing.push('review.status');
   }
+  // C1 (M9): command field is optional but if present must be string
+  if (facts.tests != null && facts.tests.command !== undefined && typeof facts.tests.command !== 'string') {
+    missing.push('tests.command');
+  }
   return { valid: missing.length === 0, missing };
 }
 
 export function buildReviewFact({ status, source, verdict, artifactPath }) {
   if (!VALID_STATUSES.includes(status)) {
     throw new Error(`Invalid status: ${status}`);
   }
   if (status === 'executed') {
     if (!VALID_SOURCES.includes(source)) {
       throw new Error(`Invalid source: ${source}`);
     }
     if (!VALID_VERDICTS.includes(verdict)) {
       throw new Error(`Invalid verdict: ${verdict}`);
     }
     if (!artifactPath) {
       throw new Error(`executed review requires a non-empty artifactPath`);
     }
     return { status, source, verdict, artifact_path: artifactPath };
   }
-  // not_executed
   return { status };
 }
 
 export function getWarnings(reviewFact) {
   if (reviewFact.status === 'not_executed') {
     return [{ type: 'warning', message: '审查未执行' }];
   }
   return [];
 }
diff --git a/workflows/verify-code/facts-assembly.mjs b/workflows/verify-code/facts-assembly.mjs
new file mode 100644
index 0000000..bd24c54
--- /dev/null
+++ b/workflows/verify-code/facts-assembly.mjs
@@ -0,0 +1,55 @@
+import { writeFileSync, mkdirSync } from 'node:fs';
+import { join, dirname } from 'node:path';
+
+const METRIC_KEYS = [
+  'execution_id', 'skill_or_stage', 'stage', 'skill_version',
+  'executed', 'tokens', 'duration_ms', 'rework_rounds',
+  'human_intervention', 'friction_ref',
+];
+
+/**
+ * Extract command from build-code facts. Throws on missing command.
+ */
+export function readCommand(buildResult) {
+  if (!buildResult.facts || !buildResult.facts.tests) {
+    const err = new Error('facts.tests not found in build result');
+    err.retryable = true;
+    throw err;
+  }
+  if (!buildResult.facts.tests.command) {
+    throw new Error('command field missing in facts.tests — build-code must include command in facts output');
+  }
+  return buildResult.facts.tests.command;
+}
+
+/**
+ * Assemble a 7-key stage-result object.
+ */
+export function assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable }) {
+  return {
+    verdict,
+    evidence_ref: evidenceRef,
+    anomaly_flags: anomalyFlags,
+    missing_items: missingItems,
+    user_decision: userDecision,
+    reason,
+    error_code: errorCode,
+  };
+}
+
+/**
+ * Write stage-result JSON to specs/{taskId}/stage-result-verify-code.json.
+ */
+export function writeStageResult(taskSpecDir, taskId, result) {
+  mkdirSync(taskSpecDir, { recursive: true });
+  const path = join(taskSpecDir, 'stage-result-verify-code.json');
+  writeFileSync(path, JSON.stringify(result, null, 2), 'utf-8');
+}
+
+/**
+ * Validate a metric record has all 10 required keys.
+ */
+export function validateMetricRecord(record) {
+  const missing = METRIC_KEYS.filter(k => !(k in (record || {})));
+  return { valid: missing.length === 0, missing };
+}
diff --git a/workflows/verify-code/freshness.mjs b/workflows/verify-code/freshness.mjs
new file mode 100644
index 0000000..0027a85
--- /dev/null
+++ b/workflows/verify-code/freshness.mjs
@@ -0,0 +1,39 @@
+/**
+ * Check freshness by comparing build-code git_sha with current HEAD.
+ * Pure function — no IO, no side effects. Never throws (F3 non-blocking).
+ *
+ * @param {string|null|undefined} buildSha — git_sha from build-code facts
+ * @param {string|null|undefined} headSha — current HEAD git_sha
+ * @returns {{ anomaly_flags: string[], warnings: Array<{type:string, message:string}> }}
+ */
+export function checkFreshness(buildSha, headSha) {
+  const anomaly_flags = [];
+  const warnings = [];
+
+  const b = (buildSha || '').toString();
+  const h = (headSha || '').toString();
+
+  if (b !== h || !b || !h) {
+    anomaly_flags.push('stale_sha');
+  }
+
+  if (anomaly_flags.length > 0) {
+    warnings.push({
+      type: 'warning',
+      message: `stale_sha: build-code facts git_sha (${b || 'missing'}) does not match current HEAD (${h || 'missing'}) — verify-code results may not reflect latest code`,
+    });
+  }
+
+  return { anomaly_flags, warnings };
+}
+
+/**
+ * Format anomaly_flags array into a human-readable string.
+ *
+ * @param {string[]} anomaly_flags
+ * @returns {string}
+ */
+export function getAnomalyFlagsText(anomaly_flags) {
+  if (!anomaly_flags || anomaly_flags.length === 0) return '';
+  return `⚠ Anomaly flags: ${anomaly_flags.join(', ')}`;
+}

exec
/bin/bash -lc 'node node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs tests/build-code-facts.test.mjs --passWithNoTests=false' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 258ms:
 ✓ tests/build-code-facts.test.mjs (10 tests) 2ms
 ✓ tests/verify-code-freshness.test.mjs (9 tests) 2ms
 ✓ tests/verify-code-facts.test.mjs (15 tests) 3ms

 Test Files  3 passed (3)
      Tests  34 passed (34)
   Start at  17:51:05
   Duration  147ms (transform 24ms, setup 0ms, collect 36ms, tests 7ms, environment 0ms, prepare 98ms)


collab: Wait
codex
Verdict: `revise_required`

测试命令已跑过，当前 34 个测试全绿：

`node node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs tests/build-code-facts.test.mjs --passWithNoTests=false`

但 Phase 3 有需求缺口，测试也没有真正锁住。

| 位置 | 严重性 | 问题 |
|---|---:|---|
| [tests/verify-code-facts.test.mjs](/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-facts.test.mjs:61) | blocking | `evidence_ref` 测试写反 |
| [workflows/verify-code/facts-assembly.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs:31) | blocking | `evidence_ref` 未约束相对路径 |
| [workflows/verify-code/facts-assembly.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs:19) | blocking | command 缺失错误没有 `retryable=true` |
| [workflows/verify-code/facts-assembly.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs:2) | non-blocking | `dirname` 未使用 |

具体说明：

1. `evidence_ref` 要求是相对 `specs/{task-id}/` 的路径，不应包含 `specs/{task-id}/` 前缀。但测试第 61-64 行传入 `specs/m9/evidence/fresh-capture.json`，并断言原样通过。这和 Phase 3 requirement 相反，导致 FR-PATH-003 不可证伪。实现第 31 行也只是原样赋值，没有校验或拒绝错误前缀。

2. `readCommand()` 在 `facts.tests.command` 缺失时只抛普通 Error。`tasks.md` 的实现约束要求 command 缺失抛 `{ message, retryable: true }` 语义。当前只有 `facts.tests` 整体缺失时才设置 `retryable=true`，字段缺失路径不符合。

3. `dirname` import 没用，清掉即可。不影响行为。

符合项：

- Phase 2 `checkFreshness()` 基本满足：纯函数、无 IO、返回 `{ anomaly_flags, warnings }`、mismatch 时有 `stale_sha` 和 warning、不会设置 failure。
- `getAnomalyFlagsText()` 有实现。
- C1 build-code schema 满足：`command` 可选，存在时必须是 string，旧 M8 facts 无 command 仍 valid。
- build-code `SKILL.md` 已记录 `facts.tests.command`，示例也包含 command。
- `validateMetricRecord()` 覆盖 10 个 key。
- `assembleStageResult()` 当前确实返回 7 个顶层 key，`user_decision` 可证伪测试存在。

建议修改后再通过：先修 `evidence_ref` 的测试和实现，再给 command 缺失错误补 `retryable=true`。
hook: Stop
hook: Stop Completed
tokens used
39,982

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
