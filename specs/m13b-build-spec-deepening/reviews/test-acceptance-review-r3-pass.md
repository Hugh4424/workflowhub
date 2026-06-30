# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-30T09:37:08.081Z

## Original task

Test-Acceptance Review R3 — checkpoint: test-acceptance-review, round: 3, task_id: m13b-build-spec-deepening.

R2 revise_required: B1 AC-16 missing Chinese 阻断 gate check; B2 AC-21 missing TodoWrite + Exit Conditions checks.

R3 fixes applied to tests/m13b-build-spec-deepening.test.mjs:
1. AC-16: Added test 'SKILL.md does not use Chinese 阻断 as a hard execution gate'. Filter: finds lines with 阻断, allows 不阻断/非阻断/不构成阻断/不作为阻断/而非阻断 (negation), 黑名单/检测阻断/阻断语义/禁止附加/记录事实 (context), Q[0-9]/F[0-9]/CONSTITUTION (principle refs). Hard gate like '若X则阻断流程' would be caught. Checked SKILL.md: all 15 lines with 阻断 are in negated or explanatory context — test passes legitimately.
2. AC-21: Added TodoWrite check (non-explanatory lines); Added Exit Conditions/stage_exit count ≤ 1 check. Both pass (neither appear in SKILL.md).

R3 test result: 848 passed (848), 44 files, exit_code 0, timestamp 2026-06-30T09:35:10Z.

Question: Are the AC-16 and AC-21 fixes now non-vacuous and sufficient? Is the overall verdict now PASS?

Please return:
{"verdict": "pass|revise_required|escalate_to_human", "round": 3, "blocking": [], "non_blocking": []}

## Final prompt

Test-Acceptance Review R3 — checkpoint: test-acceptance-review, round: 3, task_id: m13b-build-spec-deepening.

R2 revise_required: B1 AC-16 missing Chinese 阻断 gate check; B2 AC-21 missing TodoWrite + Exit Conditions checks.

R3 fixes applied to tests/m13b-build-spec-deepening.test.mjs:
1. AC-16: Added test 'SKILL.md does not use Chinese 阻断 as a hard execution gate'. Filter: finds lines with 阻断, allows 不阻断/非阻断/不构成阻断/不作为阻断/而非阻断 (negation), 黑名单/检测阻断/阻断语义/禁止附加/记录事实 (context), Q[0-9]/F[0-9]/CONSTITUTION (principle refs). Hard gate like '若X则阻断流程' would be caught. Checked SKILL.md: all 15 lines with 阻断 are in negated or explanatory context — test passes legitimately.
2. AC-21: Added TodoWrite check (non-explanatory lines); Added Exit Conditions/stage_exit count ≤ 1 check. Both pass (neither appear in SKILL.md).

R3 test result: 848 passed (848), 44 files, exit_code 0, timestamp 2026-06-30T09:35:10Z.

Question: Are the AC-16 and AC-21 fixes now non-vacuous and sufficient? Is the overall verdict now PASS?

Please return:
{"verdict": "pass|revise_required|escalate_to_human", "round": 3, "blocking": [], "non_blocking": []}

## Raw output

```text
{"verdict":"pass","round":3,"blocking":[],"non_blocking":[]}


2026-06-30T09:35:57.377915Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T09:35:57.377936Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T09:35:57.377938Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-30T09:35:57.377939Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T09:35:57.377941Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T09:35:57.377942Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T09:35:57.377944Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T09:35:57.377945Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T09:35:57.377947Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T09:35:57.377948Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-30T09:35:57.377949Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-30T09:35:57.377950Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: high
reasoning summaries: none
session id: 019f17e2-a1eb-7af0-af94-fc299490a92f
--------
user
Test-Acceptance Review R3 — checkpoint: test-acceptance-review, round: 3, task_id: m13b-build-spec-deepening.

R2 revise_required: B1 AC-16 missing Chinese 阻断 gate check; B2 AC-21 missing TodoWrite + Exit Conditions checks.

R3 fixes applied to tests/m13b-build-spec-deepening.test.mjs:
1. AC-16: Added test 'SKILL.md does not use Chinese 阻断 as a hard execution gate'. Filter: finds lines with 阻断, allows 不阻断/非阻断/不构成阻断/不作为阻断/而非阻断 (negation), 黑名单/检测阻断/阻断语义/禁止附加/记录事实 (context), Q[0-9]/F[0-9]/CONSTITUTION (principle refs). Hard gate like '若X则阻断流程' would be caught. Checked SKILL.md: all 15 lines with 阻断 are in negated or explanatory context — test passes legitimately.
2. AC-21: Added TodoWrite check (non-explanatory lines); Added Exit Conditions/stage_exit count ≤ 1 check. Both pass (neither appear in SKILL.md).

R3 test result: 848 passed (848), 44 files, exit_code 0, timestamp 2026-06-30T09:35:10Z.

Question: Are the AC-16 and AC-21 fixes now non-vacuous and sufficient? Is the overall verdict now PASS?

Please return:
{"verdict": "pass|revise_required|escalate_to_human", "round": 3, "blocking": [], "non_blocking": []}
2026-06-30T09:35:58.242011Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
我会按仓库规则做最小验收复核：只看 R3 涉及的测试、对应 `SKILL.md` 文本，以及必要的测试结果证据。
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
/bin/bash -lc 'pwd && git status --short && rg -n "AC-16|AC-21|阻断|TodoWrite|Exit Conditions|stage_exit" tests/m13b-build-spec-deepening.test.mjs workflows/build-spec/SKILL.md specs/m13b-build-spec-deepening -S' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
/Users/Hugh/Hugh/Project/workflowhub
 M CLAUDE.md
 M specs/m13b-build-spec-deepening/tasks.md
 M task-metrics.jsonl
 M tests/m13b-build-spec-deepening.test.mjs
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
?? specs/m13b-build-spec-deepening/evidence/fresh-capture.json
?? specs/m13b-build-spec-deepening/stage-result-verify-code.json
?? specs/m13b-build-spec-deepening/test-acceptance-review-prompt.md
?? specs/m13b-build-spec-deepening/test-acceptance-review-r2-prompt.md
?? specs/m13b-build-spec-deepening/test/
?? tasks/agenthub-extraction-program/
?? tasks/m11-build-spec-v1/
?? tasks/m12-build-plan-v1/
?? tasks/multica-cost-review/
workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
workflows/build-spec/SKILL.md:120:spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
workflows/build-spec/SKILL.md:122:**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
workflows/build-spec/SKILL.md:127:- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
workflows/build-spec/SKILL.md:152:- 审查失败/不可用时降级记录 unknown + 原因，不阻断
workflows/build-spec/SKILL.md:168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
workflows/build-spec/SKILL.md:196:长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
workflows/build-spec/SKILL.md:203:以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
workflows/build-spec/SKILL.md:216:- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
workflows/build-spec/SKILL.md:217:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
workflows/build-spec/SKILL.md:226:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
workflows/build-spec/SKILL.md:227:- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
workflows/build-spec/SKILL.md:240:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
workflows/build-spec/SKILL.md:258:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
tests/m13b-build-spec-deepening.test.mjs:300:describe("Phase 3 / AC-16: high-risk words not used as execution gate semantics", () => {
tests/m13b-build-spec-deepening.test.mjs:309:      `SKILL.md must not use 不能进 as execution gate (AC-16); found outside blacklist/example context: ${gateLines.join(" | ")}`);
tests/m13b-build-spec-deepening.test.mjs:311:  test("SKILL.md does not use Chinese 阻断 as a hard execution gate", () => {
tests/m13b-build-spec-deepening.test.mjs:313:    // 阻断 may appear as: 不阻断/非阻断 (negated), blacklist listing (黑名单),
tests/m13b-build-spec-deepening.test.mjs:314:    // detection description (检测阻断), constitution refs (Q1/F3/F4/F5), 而非阻断 (explanatory).
tests/m13b-build-spec-deepening.test.mjs:315:    // A hard gate like 若X则阻断流程 MUST be rejected.
tests/m13b-build-spec-deepening.test.mjs:317:      if (!l.includes("阻断")) return false;
tests/m13b-build-spec-deepening.test.mjs:319:      if (l.includes("不阻断") || l.includes("非阻断") || l.includes("不构成阻断") ||
tests/m13b-build-spec-deepening.test.mjs:320:          l.includes("不作为阻断") || l.includes("不得阻断") || l.includes("而非阻断")) return false;
tests/m13b-build-spec-deepening.test.mjs:322:      if (l.includes("黑名单") || l.includes("检测阻断") || l.includes("阻断语义") ||
tests/m13b-build-spec-deepening.test.mjs:329:      `SKILL.md must not use 阻断 as hard execution gate (AC-16); suspect lines: ${hardGateLines.slice(0,3).join(" | ")}`);
tests/m13b-build-spec-deepening.test.mjs:334:    // Allowed: 不阻断, non-blocking, do not block, NOT block, don't block, 黑名单, 不构成阻断
tests/m13b-build-spec-deepening.test.mjs:338:      if (l.includes("不阻断") || l.includes("非阻断") || l.includes("不构成阻断") ||
tests/m13b-build-spec-deepening.test.mjs:339:          l.includes("不作为阻断") || l.includes("阻断语义") || l.includes("黑名单")) return false;
tests/m13b-build-spec-deepening.test.mjs:347:      `SKILL.md must not use BLOCK/blocking as hard gate (AC-16); suspect lines: ${hardGateLines.slice(0,3).join(" | ")}`);
tests/m13b-build-spec-deepening.test.mjs:351:describe("Phase 3 / AC-21: D3 deleted items not present as active mechanisms", () => {
tests/m13b-build-spec-deepening.test.mjs:354:      "gate.sh must not appear as active mechanism in SKILL.md (AC-21)");
tests/m13b-build-spec-deepening.test.mjs:358:      "post_review_pass must not appear in SKILL.md (AC-21)");
tests/m13b-build-spec-deepening.test.mjs:362:      "[DECOMP] must not appear in SKILL.md as mechanism (AC-21)");
tests/m13b-build-spec-deepening.test.mjs:364:  test("SKILL.md does NOT contain TodoWrite template call as active mechanism", () => {
tests/m13b-build-spec-deepening.test.mjs:365:    // TodoWrite is a D3 deleted item — must not appear as an active step/call
tests/m13b-build-spec-deepening.test.mjs:366:    // (explanatory references to the concept are allowed, same semantics as AC-16)
tests/m13b-build-spec-deepening.test.mjs:369:      l => l.includes("TodoWrite") && !l.includes("//") && !l.includes("注：") && !l.includes("例如")
tests/m13b-build-spec-deepening.test.mjs:372:      `TodoWrite must not appear as active mechanism in SKILL.md (AC-21); found: ${twLines.slice(0,2).join(" | ")}`);
tests/m13b-build-spec-deepening.test.mjs:374:  test("SKILL.md does NOT contain duplicate Exit Conditions sections as mechanism steps", () => {
tests/m13b-build-spec-deepening.test.mjs:375:    // At most one Exit Conditions heading is allowed; a duplicate signals a D3 gate pattern
tests/m13b-build-spec-deepening.test.mjs:377:    const exitCondMatches = (c.match(/## Exit Conditions|## 退出条件|stage_exit/g) || []);
tests/m13b-build-spec-deepening.test.mjs:379:      `Duplicate Exit Conditions/stage_exit sections detected (${exitCondMatches.length}) — D3 gate pattern violation (AC-21)`);
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:263:   新增 ladder F10 在 [workflows/build-spec/SKILL.md:94](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:94) 写了“不作为阻断条件”，但旧的 Section 6 仍写成硬 gate：[workflows/build-spec/SKILL.md:263](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:263) 标题就是 `F10 anti-over-engineering gate`，[workflows/build-spec/SKILL.md:267](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:267) 要求“四问答不全就 remove”，[workflows/build-spec/SKILL.md:274](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:274) 又要求某些答案直接 remove mechanism。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:832:+F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:849:+spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:851:+**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:856:+- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:868:+5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:872:+**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:881:+- 审查失败/不可用时降级记录 unknown + 原因，不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:897:+**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:921:+条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1038:    94	F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1064:   120	spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1066:   122	**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1071:   127	- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1083:   139	5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1087:   143	**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1096:   152	- 审查失败/不可用时降级记录 unknown + 原因，不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1112:   168	**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1136:   192	条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1158:   214	- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1159:   215	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1168:   224	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1169:   225	- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1337:./tasks/m12-build-plan-v1/stage-result-build-spec.json:7:    "requirements": "24 FR across 10 groups: FR-BP(3, build-plan v1 SKILL.md 串行编排+plan/tasks产物结构+stage-result契约保留追加tasks_ref), FR-MIG(3, speckit-plan/tasks/analyze 改造迁移 workflows/ 改名 plan-generate/tasks-generate/cross-artifact-analyze + 独立可调起内置模板 + tasks 阶段分组), FR-DECOUPLE(3, 不从git分支推断身份 fail-loud + 模板技能内部加载 + analyze 显式路径定位), FR-XARTIFACT(2, 跨产物一致性检查只记录不阻断), FR-CONSTITUTION(3, 21条逐条勾选只记录不阻断 + 缺失判据), FR-BASELINE(3, M10 5项对照 rework_proxy_count真名 阈值人拍), FR-REGISTRY(2, 三件 reuse-registry 登记+格式校验), FR-REVIEW(1, 一且仅一次人审检查点), FR-SKELETON(2, F10门保留+M6 stage-result/metrics契约不回归), FR-SCOPE(2, 不碰 build-code/verify-code 逻辑+design其他技能); 9条验收; 每FR可溯 D-M12-x。"
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1422:/bin/bash -lc "rg -n \"阻断|blocking|不能进|BLOCK|强制门|必须停止|强制完整流程|stop|停止|不得继续|禁止.*继续|block\" workflows/build-spec/SKILL.md workflows/build-code/SKILL.md specs/m13b-build-spec-deepening tests/m13b-build-spec-deepening.test.mjs --glob '"'!node_modules'"'" in /Users/Hugh/Hugh/Project/workflowhub
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1427:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1428:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1430:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1433:tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1436:tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1439:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1446:workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1449:workflows/build-spec/SKILL.md:120:spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1450:workflows/build-spec/SKILL.md:122:**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1451:workflows/build-spec/SKILL.md:127:- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1452:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1453:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1454:workflows/build-spec/SKILL.md:152:- 审查失败/不可用时降级记录 unknown + 原因，不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1455:workflows/build-spec/SKILL.md:168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1456:workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1457:workflows/build-spec/SKILL.md:214:- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1458:workflows/build-spec/SKILL.md:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1459:workflows/build-spec/SKILL.md:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1460:workflows/build-spec/SKILL.md:225:- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1461:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1462:workflows/build-spec/SKILL.md:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1465:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1466:specs/m13b-build-spec-deepening/spec.md:28:- 所有新机制均为"记录事实 + 浮现 + 人判断"，零阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1467:specs/m13b-build-spec-deepening/spec.md:51:- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1468:specs/m13b-build-spec-deepening/spec.md:53:- agenthub design 阶段有丰富质量保障体系，但其阻断门机制与 CONSTITUTION 冲突，须按"最小实现+记事实"原则移植。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1469:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1470:specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1472:specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1473:specs/m13b-build-spec-deepening/spec.md:84:- agenthub 3 道阻断门（退出门/审查门/推进门）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1474:specs/m13b-build-spec-deepening/spec.md:91:- 任何阻断式 gate
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1475:specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1476:specs/m13b-build-spec-deepening/spec.md:104:### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1477:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1478:specs/m13b-build-spec-deepening/spec.md:109:### 场景 3.3：异源 3rd-review 审查发现方向偏差（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1479:specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1480:specs/m13b-build-spec-deepening/spec.md:114:### 场景 3.4：scope-triage 发现高危词（浮现建议不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1481:specs/m13b-build-spec-deepening/spec.md:116:- **操作步骤**：spec 文本中检测到高危词（如"自动阻断""blocking gate""门禁"等）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1482:specs/m13b-build-spec-deepening/spec.md:124:### 场景 3.6：spec↔decision-log 一致性检查发现差异（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1483:specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1484:specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1486:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1487:specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1488:specs/m13b-build-spec-deepening/spec.md:190:- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1489:specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1490:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1491:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1492:specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1494:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1495:specs/m13b-build-spec-deepening/spec.md:313:- **场景**：Given spec 初稿含"阻断"字样，When scope-triage grep，Then 命中位置和建议修改记录进未解风险，stage 继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1496:specs/m13b-build-spec-deepening/spec.md:315:> **【验收口径对齐说明】** decision-log §7 的验收条件原文为"grep 不到 阻断/不能进/BLOCK"，与本 spec 要求 SKILL.md 必须包含这些词作为高危词检测黑名单看似矛盾，实际不矛盾。正确解读：验收检查的是"高危词是否被用作执行门语义（用来阻断/停止流程推进）"，而非是否在文本中出现。高危词以下列形式出现均**不构成违规**：（1）作为检测黑名单内容列举（如 scope-triage 检测列表）；（2）作为引用/示例/说明文本（如"禁止使用'阻断'语义"）；（3）出现在 Known Gaps、摩擦记录等说明段落中。违规仅指高危词出现在执行流程分支中作为"若…则停止/不能继续"的控制语义。AC-16 的 grep 验证应使用语义判断而非裸 grep，见 AC-16 说明。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1497:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1498:specs/m13b-build-spec-deepening/spec.md:327:1. **无阻断门**：任何质量检查失败（自检 warn / 审查偏差 / 高危词命中）均不阻断推进，违反此条即违反 CONSTITUTION F4/F5。不引入 `gate.sh stage_exit`、`post_review_pass`、`stage_advance` 等带阻断语义的 gate 机制（这三个名词是已 CUT 的 agenthub 阻断门的精确核对项）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1499:specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1500:specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1501:specs/m13b-build-spec-deepening/spec.md:355:- [ ] **AC-16**：`workflows/build-spec/SKILL.md` 中不存在将阻断/BLOCK/不能进**用作执行门语义**（即"若…则停止/不得继续"的控制分支）的文本；这些词作为高危词检测黑名单内容、引用示例、说明文字出现均不违规（见 FR-SCOPETRIAGE-001 验收口径对齐说明）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1502:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1503:specs/m13b-build-spec-deepening/spec.md:405:| 范围覆盖 | 清晰 | IN/OUT 明确，agenthub 阻断机制全部在 OUT 中列出 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1504:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1506:specs/m13b-build-spec-deepening/plan.md:26:**Constraints**: 宪法优先；所有检查为记录+浮现，无阻断门；不修改 spec-specify/spec-clarify 技能本体
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1507:specs/m13b-build-spec-deepening/plan.md:95:- 内容：5 项字段定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），禁止阻断语义（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1508:specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1509:specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1510:specs/m13b-build-spec-deepening/plan.md:197:- [x] **F3 物理事实靠机器校验但不阻断** — 判据：Spec-Purity grep、scope-triage grep、7 条自检均为机器执行并客观记录结论（pass/warn/unknown），明确要求不阻断推进（FR-CONTRACT-002, FR-SELFCHECK-001/002）。符合 F3。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1511:specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1512:specs/m13b-build-spec-deepening/plan.md:201:- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：spec 明确 OUT 列表（无阻断门、无 3 source_family 多重审查、无 TodoWrite 仪式），CUT 了全部 agenthub 阻断门（D3），无新增 gate 机制。符合 F5。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1513:specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1516:specs/m13b-build-spec-deepening/plan.md:263:3. **是否可绕过成为 security-theatre**：不构成安全剧场——字段为"记录+浮现"语义，不阻断流程；即使值为 unknown 也合法，不存在伪通过路径（F9）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1517:specs/m13b-build-spec-deepening/plan.md:272:3. **是否可绕过**：判断结论为描述性记录，不强制阻断，故不存在绕过安全门的问题。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1518:specs/m13b-build-spec-deepening/plan.md:281:3. **是否可绕过**：自检为记录性质，warn 不阻断；grep 为机器执行，不存在"能绕过"的安全问题。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1519:specs/m13b-build-spec-deepening/plan.md:290:3. **是否可绕过**：无阻断门，审查结论为 unknown 时记录 unknown 继续，不存在安全剧场。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1520:specs/m13b-build-spec-deepening/plan.md:315:1. **防御的真实威胁**：spec 写入阻断语义词（"不能继续"、"blocking gate"）被执行代理当成规则执行，导致宪法违规。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1521:specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1524:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1526:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1527:specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1529:specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1533:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1535:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1536:specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1538:specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1539:specs/m13b-build-spec-deepening/spec-clarify-scan.md:50:- Spec-Purity grep 命中：warn + 记录，不阻断（FR-SELFCHECK-002）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1541:specs/m13b-build-spec-deepening/spec-clarify-scan.md:122:| R4 | 阻断语义 | 所有检查为记录+浮现，无阻断 | decision-log D1 + CONSTITUTION F4/F5 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1542:specs/m13b-build-spec-deepening/spec-clarify-scan.md:138:**处理原则**：3 条 OQ 均为低风险，有合理默认值，不阻断 build-plan 推进。build-plan 阶段可就默认值向人确认，或直接采用建议值。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1543:specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1544:specs/m13b-build-spec-deepening/checklists/requirements.md:56:| F3 物理事实靠机器校验但不阻断 | 自检 grep/计数均为记录，不阻断 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1545:specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1546:specs/m13b-build-spec-deepening/checklists/requirements.md:58:| F5 gate 谨慎添加 | CUT 列表明确排除所有阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1547:specs/m13b-build-spec-deepening/checklists/requirements.md:74:## 五、阻断语言检查（Spec-Purity 阻断门语义）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1548:specs/m13b-build-spec-deepening/checklists/requirements.md:76:- [x] spec.md 不含以阻断门语义使用的"阻断" — 非目标段落中引用均作为 CUT 说明
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1551:specs/m13b-build-spec-deepening/baseline-report.md:49:- No unknown blocks progression (F3: 物理事实不阻断推进).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1553:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1561:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1586:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1588:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1592:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:587:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1619:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:264:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1629:specs/m13b-build-spec-deepening/cross-artifact-analysis.md:8:> 本报告只读（read-only）。记录不一致/重复/歧义/欠定义问题，不修改三产物，不阻断下游推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1630:specs/m13b-build-spec-deepening/cross-artifact-analysis.md:42:| A-02 | LOW | plan.md S6 宪法条款判据 | plan.md Constitution Check S6 判据末尾写"待 SKILL.md 写入时确认 version"，引入了一个"待确认"的条件，意味着 S6 结论是临时的。这与 Constitution Check 的一次性记录语义有轻微不一致（其他 20 条无此留白）。 | id:A-02, type:ambiguity, location:plan.md Constitution Check S6, description:S6 判据含"待确认"语，使其结论不完整, suggested_action:后续 SKILL.md 写入完成后将 S6 判据更新为确定性结论；目前不阻断 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1631:specs/m13b-build-spec-deepening/cross-artifact-analysis.md:77:所有 MEDIUM/LOW 发现均不阻断推进。无 CRITICAL/HIGH 发现。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1632:specs/m13b-build-spec-deepening/constitution-check.md:17:- [x] **F3 物理事实靠机器校验但不阻断**
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1633:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1634:specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1635:specs/m13b-build-spec-deepening/constitution-check.md:21:  spec 将独立三角度审查（FR-REVIEW-001/002）设计为"记录+浮现"语义，偏差结论浮现给人判断；Section 5（不做/非目标）第 1 条直接声明"任何质量检查失败均不阻断推进，违反此条即违反 CONSTITUTION F4/F5"；全 spec 无任何阻断门定义，完全依靠审查浮现和人工把关，符合 F4。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1636:specs/m13b-build-spec-deepening/constitution-check.md:24:  spec OUT 列表明确剔除 agenthub 的三道阻断门（退出门/审查门/推进门），Section 5 第 1 条再次明确"无阻断门"，现有机制全部为采集记录型，没有预先堆砌关卡；符合"只添加确有必要 gate"的 F5 原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1638:specs/m13b-build-spec-deepening/constitution-check.md:36:  FR-CONTRACT-001 场景明确规定"Given 某项无数据，When 填写该字段，Then 填 unknown，不伪造值（F9 可证伪不假绿）"；FR-SELFCHECK-001 场景声明"全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进"，防止假绿；自检结论字段 pass/warn/unknown 三态设计保证了"实际为假时能真实报 warn"，符合 F9。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1639:specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1640:specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1641:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1642:specs/m13b-build-spec-deepening/constitution-check.md:62:  spec 明确对 agenthub 原有质量保障体系进行了合宪改造：删除三道阻断门（不符合 F4/F5），保留质量事实浮现机制；FR-REVIEW-002 将三 source_family 异源改造为 1-AI-3-angle 单代理三角度（合宪简化）；这正是"按项目需要改造使其合宪"的典型体现，符合 S2。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1644:specs/m13b-build-spec-deepening/constitution-check.md:95:该 spec 的设计核心（零阻断门、记事实+浮现+人判断、薄核心下沉）与宪法 F3/F4/F5/Q1/Q2 高度契合；已知局限（单代理三角度审查独立性有限）已在 Known Gaps 诚实标注，符合 F9 可证伪不假绿原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1645:specs/m13b-build-spec-deepening/build-plan-3rd-review.md:51:- **[NBK-9]** D3 deleted items handled correctly: blocking gates, TodoWrite, `[DECOMP]`, gate-bound auto-write, Exit Conditions repetition all excluded from active mechanisms. `blocking gate` appears only as blacklist example text in T010, which is acceptable per AC-16.
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1669:   238	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1687:   256	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1832:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1833:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1858:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1877:workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1880:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1881:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1885:workflows/build-spec/SKILL.md:168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1902:specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1908:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1910:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1934:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1936:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1938:specs/m13b-build-spec-deepening/spec.md:355:- [ ] **AC-16**：`workflows/build-spec/SKILL.md` 中不存在将阻断/BLOCK/不能进**用作执行门语义**（即"若…则停止/不得继续"的控制分支）的文本；这些词作为高危词检测黑名单内容、引用示例、说明文字出现均不违规（见 FR-SCOPETRIAGE-001 验收口径对齐说明）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1947:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2090:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2091:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2167:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2187:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2201:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2216:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2255:describe("Phase 3 / AC-16: D3 deleted items not present as active mechanisms", () => {
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2258:      "gate.sh must not appear as active mechanism in SKILL.md (AC-21/AC-16)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2262:      "post_review_pass must not appear in SKILL.md (AC-21/AC-16)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2266:      "[DECOMP] must not appear in SKILL.md as mechanism (AC-21)");
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2345:specs/m13b-build-spec-deepening/spec.md:371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2358:workflows/build-spec/SKILL.md:120:spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2891:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2895:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2896:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2900:168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2935:315:> **【验收口径对齐说明】** decision-log §7 的验收条件原文为"grep 不到 阻断/不能进/BLOCK"，与本 spec 要求 SKILL.md 必须包含这些词作为高危词检测黑名单看似矛盾，实际不矛盾。正确解读：验收检查的是"高危词是否被用作执行门语义（用来阻断/停止流程推进）"，而非是否在文本中出现。高危词以下列形式出现均**不构成违规**：（1）作为检测黑名单内容列举（如 scope-triage 检测列表）；（2）作为引用/示例/说明文本（如"禁止使用'阻断'语义"）；（3）出现在 Known Gaps、摩擦记录等说明段落中。违规仅指高危词出现在执行流程分支中作为"若…则停止/不能继续"的控制语义。AC-16 的 grep 验证应使用语义判断而非裸 grep，见 AC-16 说明。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2946:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2947:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2951:355:- [ ] **AC-16**：`workflows/build-spec/SKILL.md` 中不存在将阻断/BLOCK/不能进**用作执行门语义**（即"若…则停止/不得继续"的控制分支）的文本；这些词作为高危词检测黑名单内容、引用示例、说明文字出现均不违规（见 FR-SCOPETRIAGE-001 验收口径对齐说明）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2956:360:- [ ] **AC-21**：SKILL.md 中 D3 删除项不作为活跃机制存在——即 grep `workflows/build-spec/SKILL.md` 不命中 TodoWrite 待办模板调用、`[DECOMP]` 遥测发射、绑门自动写、Exit Conditions 重复行 作为机制性执行步骤；纯说明性引用（如"本 skill 不用 TodoWrite 待办模板"）不算违反，与 AC-16 同口径。这是 decision-log §7「D3 删除项不出现」的精确操作化：删除项作为机制不出现。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2958:371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2968:   新增 ladder F10 在 [workflows/build-spec/SKILL.md:94](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:94) 写了“不作为阻断条件”，但旧的 Section 6 仍写成硬 gate：[workflows/build-spec/SKILL.md:263](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:263) 标题就是 `F10 anti-over-engineering gate`，[workflows/build-spec/SKILL.md:267](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:267) 要求“四问答不全就 remove”，[workflows/build-spec/SKILL.md:274](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:274) 又要求某些答案直接 remove mechanism。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:91: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use gate.sh as an active execution call
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:92: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use post_review_pass as an active gate
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:93: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use [DECOMP] telemetry emission
specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/spec.md:28:- 所有新机制均为"记录事实 + 浮现 + 人判断"，零阻断。
specs/m13b-build-spec-deepening/spec.md:51:- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
specs/m13b-build-spec-deepening/spec.md:53:- agenthub design 阶段有丰富质量保障体系，但其阻断门机制与 CONSTITUTION 冲突，须按"最小实现+记事实"原则移植。
specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/spec.md:84:- agenthub 3 道阻断门（退出门/审查门/推进门）
specs/m13b-build-spec-deepening/spec.md:85:- TodoWrite 待办模板仪式
specs/m13b-build-spec-deepening/spec.md:88:- Exit Conditions 重复行
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
specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/spec.md:190:- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。
specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/spec.md:313:- **场景**：Given spec 初稿含"阻断"字样，When scope-triage grep，Then 命中位置和建议修改记录进未解风险，stage 继续。
specs/m13b-build-spec-deepening/spec.md:315:> **【验收口径对齐说明】** decision-log §7 的验收条件原文为"grep 不到 阻断/不能进/BLOCK"，与本 spec 要求 SKILL.md 必须包含这些词作为高危词检测黑名单看似矛盾，实际不矛盾。正确解读：验收检查的是"高危词是否被用作执行门语义（用来阻断/停止流程推进）"，而非是否在文本中出现。高危词以下列形式出现均**不构成违规**：（1）作为检测黑名单内容列举（如 scope-triage 检测列表）；（2）作为引用/示例/说明文本（如"禁止使用'阻断'语义"）；（3）出现在 Known Gaps、摩擦记录等说明段落中。违规仅指高危词出现在执行流程分支中作为"若…则停止/不能继续"的控制语义。AC-16 的 grep 验证应使用语义判断而非裸 grep，见 AC-16 说明。
specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/spec.md:327:1. **无阻断门**：任何质量检查失败（自检 warn / 审查偏差 / 高危词命中）均不阻断推进，违反此条即违反 CONSTITUTION F4/F5。不引入 `gate.sh stage_exit`、`post_review_pass`、`stage_advance` 等带阻断语义的 gate 机制（这三个名词是已 CUT 的 agenthub 阻断门的精确核对项）。
specs/m13b-build-spec-deepening/spec.md:328:2. **无 TodoWrite 仪式**：不引入 TodoWrite 待办模板机制，不要求执行代理维护结构化 todo 列表。
specs/m13b-build-spec-deepening/spec.md:331:5. **无 Exit Conditions 重复行**：不在 SKILL.md 多处重复退出条件定义。
specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/spec.md:355:- [ ] **AC-16**：`workflows/build-spec/SKILL.md` 中不存在将阻断/BLOCK/不能进**用作执行门语义**（即"若…则停止/不得继续"的控制分支）的文本；这些词作为高危词检测黑名单内容、引用示例、说明文字出现均不违规（见 FR-SCOPETRIAGE-001 验收口径对齐说明）。
specs/m13b-build-spec-deepening/spec.md:360:- [ ] **AC-21**：SKILL.md 中 D3 删除项不作为活跃机制存在——即 grep `workflows/build-spec/SKILL.md` 不命中 TodoWrite 待办模板调用、`[DECOMP]` 遥测发射、绑门自动写、Exit Conditions 重复行 作为机制性执行步骤；纯说明性引用（如"本 skill 不用 TodoWrite 待办模板"）不算违反，与 AC-16 同口径。这是 decision-log §7「D3 删除项不出现」的精确操作化：删除项作为机制不出现。
specs/m13b-build-spec-deepening/spec.md:371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18
specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/spec.md:405:| 范围覆盖 | 清晰 | IN/OUT 明确，agenthub 阻断机制全部在 OUT 中列出 |
specs/m13b-build-spec-deepening/spec.md:441:| D3 | 删除：agenthub 3 道门（退出门/审查门/推进门）、TodoWrite 待办模板仪式、`[DECOMP]` 遥测、绑门自动写、Exit Conditions 重复行（CUT，无需 FR 覆盖） | — |
specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/tasks.md:31:- [x] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/tasks.md:33:- [x] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/tasks.md:37:- [x] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/tasks.md:39:- [x] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/tasks.md:41:- [x] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/tasks.md:43:- [x] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/checklists/requirements.md:56:| F3 物理事实靠机器校验但不阻断 | 自检 grep/计数均为记录，不阻断 | [x] 符合 |
specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/checklists/requirements.md:58:| F5 gate 谨慎添加 | CUT 列表明确排除所有阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/checklists/requirements.md:74:## 五、阻断语言检查（Spec-Purity 阻断门语义）
specs/m13b-build-spec-deepening/checklists/requirements.md:76:- [x] spec.md 不含以阻断门语义使用的"阻断" — 非目标段落中引用均作为 CUT 说明
specs/m13b-build-spec-deepening/spec-clarify-scan.md:50:- Spec-Purity grep 命中：warn + 记录，不阻断（FR-SELFCHECK-002）。
specs/m13b-build-spec-deepening/spec-clarify-scan.md:122:| R4 | 阻断语义 | 所有检查为记录+浮现，无阻断 | decision-log D1 + CONSTITUTION F4/F5 |
specs/m13b-build-spec-deepening/spec-clarify-scan.md:138:**处理原则**：3 条 OQ 均为低风险，有合理默认值，不阻断 build-plan 推进。build-plan 阶段可就默认值向人确认，或直接采用建议值。
specs/m13b-build-spec-deepening/test-acceptance-review-prompt.md:95:- AC-16: SKILL.md does NOT use blocking/BLOCK/不能进 as execution gate semantics (control branch "if X then stop"); these words may appear as high-risk word detection blacklist content, reference/example text, or explanation paragraphs — not violations
specs/m13b-build-spec-deepening/test-acceptance-review-prompt.md:100:- AC-21: D3 deleted items do NOT appear as active mechanisms in SKILL.md — grep must NOT find TodoWrite template calls, [DECOMP] telemetry dispatch, gate auto-write, or duplicate Exit Conditions as mechanism steps; pure explanatory references not a violation (same semantics as AC-16)
specs/m13b-build-spec-deepening/test-acceptance-review-prompt.md:113:3. **F3/Q1 red line**: The authoring agent claims all new checks in workflows/build-spec/SKILL.md are non-blocking. Is this plausible given the AC descriptions (AC-11, AC-12, AC-16, AC-22)?
specs/m13b-build-spec-deepening/baseline-report.md:49:- No unknown blocks progression (F3: 物理事实不阻断推进).
specs/m13b-build-spec-deepening/constitution-check.md:17:- [x] **F3 物理事实靠机器校验但不阻断**
specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/constitution-check.md:21:  spec 将独立三角度审查（FR-REVIEW-001/002）设计为"记录+浮现"语义，偏差结论浮现给人判断；Section 5（不做/非目标）第 1 条直接声明"任何质量检查失败均不阻断推进，违反此条即违反 CONSTITUTION F4/F5"；全 spec 无任何阻断门定义，完全依靠审查浮现和人工把关，符合 F4。
specs/m13b-build-spec-deepening/constitution-check.md:24:  spec OUT 列表明确剔除 agenthub 的三道阻断门（退出门/审查门/推进门），Section 5 第 1 条再次明确"无阻断门"，现有机制全部为采集记录型，没有预先堆砌关卡；符合"只添加确有必要 gate"的 F5 原则。
specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/constitution-check.md:36:  FR-CONTRACT-001 场景明确规定"Given 某项无数据，When 填写该字段，Then 填 unknown，不伪造值（F9 可证伪不假绿）"；FR-SELFCHECK-001 场景声明"全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进"，防止假绿；自检结论字段 pass/warn/unknown 三态设计保证了"实际为假时能真实报 warn"，符合 F9。
specs/m13b-build-spec-deepening/constitution-check.md:39:  spec 影响范围第 7 节明确"测试边界：grep SKILL.md 验证 AC-01 至 AC-16；JSON schema 验证 AC-17；正则验证 AC-18"，验证手段为轻量 grep/正则而非独立 CI 门；Section 5（不做）明确排除了遥测分解 [DECOMP] 和门绑定自动写；附录 D F10 四问执行结论"维护成本低（均为 SKILL.md 描述性内容，非代码）"，符合 F10 按真实收益添加自动化的原则。
specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/constitution-check.md:62:  spec 明确对 agenthub 原有质量保障体系进行了合宪改造：删除三道阻断门（不符合 F4/F5），保留质量事实浮现机制；FR-REVIEW-002 将三 source_family 异源改造为 1-AI-3-angle 单代理三角度（合宪简化）；这正是"按项目需要改造使其合宪"的典型体现，符合 S2。
specs/m13b-build-spec-deepening/constitution-check.md:95:该 spec 的设计核心（零阻断门、记事实+浮现+人判断、薄核心下沉）与宪法 F3/F4/F5/Q1/Q2 高度契合；已知局限（单代理三角度审查独立性有限）已在 Known Gaps 诚实标注，符合 F9 可证伪不假绿原则。
specs/m13b-build-spec-deepening/plan.md:26:**Constraints**: 宪法优先；所有检查为记录+浮现，无阻断门；不修改 spec-specify/spec-clarify 技能本体
specs/m13b-build-spec-deepening/plan.md:95:- 内容：5 项字段定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），禁止阻断语义（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/plan.md:148:| Step 2.3 | FR-CONTRACT-001, FR-CONTRACT-002 | AC-01, AC-16 |
specs/m13b-build-spec-deepening/plan.md:197:- [x] **F3 物理事实靠机器校验但不阻断** — 判据：Spec-Purity grep、scope-triage grep、7 条自检均为机器执行并客观记录结论（pass/warn/unknown），明确要求不阻断推进（FR-CONTRACT-002, FR-SELFCHECK-001/002）。符合 F3。
specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/plan.md:201:- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：spec 明确 OUT 列表（无阻断门、无 3 source_family 多重审查、无 TodoWrite 仪式），CUT 了全部 agenthub 阻断门（D3），无新增 gate 机制。符合 F5。
specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/plan.md:263:3. **是否可绕过成为 security-theatre**：不构成安全剧场——字段为"记录+浮现"语义，不阻断流程；即使值为 unknown 也合法，不存在伪通过路径（F9）。
specs/m13b-build-spec-deepening/plan.md:272:3. **是否可绕过**：判断结论为描述性记录，不强制阻断，故不存在绕过安全门的问题。
specs/m13b-build-spec-deepening/plan.md:281:3. **是否可绕过**：自检为记录性质，warn 不阻断；grep 为机器执行，不存在"能绕过"的安全问题。
specs/m13b-build-spec-deepening/plan.md:290:3. **是否可绕过**：无阻断门，审查结论为 unknown 时记录 unknown 继续，不存在安全剧场。
specs/m13b-build-spec-deepening/plan.md:315:1. **防御的真实威胁**：spec 写入阻断语义词（"不能继续"、"blocking gate"）被执行代理当成规则执行，导致宪法违规。
specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/test-acceptance-review-r2-prompt.md:9:R1 blocking finding B1 claimed: AC-18 test was wrong (checked frontmatter version instead of FR regex), AC-16 test was missing, AC-21 was mislabeled as AC-16, tasks.md all unchecked.
specs/m13b-build-spec-deepening/test-acceptance-review-r2-prompt.md:15:2. **AC-16**: New describe block added. Two tests:
specs/m13b-build-spec-deepening/test-acceptance-review-r2-prompt.md:17:   - "BLOCK/blocking" not used as hard gate — only appears as "not block", "do not block", "不阻断", "non-blocking", or Q1/F3/F4/F5 principle references — filter passes
specs/m13b-build-spec-deepening/test-acceptance-review-r2-prompt.md:19:3. **AC-21**: Renamed from "AC-16: D3 deleted items" to "AC-21: D3 deleted items". Tests: gate.sh not present ✓, post_review_pass not present ✓, [DECOMP] not present ✓
specs/m13b-build-spec-deepening/test-acceptance-review-r2-prompt.md:24:- Tests: 845 passed (845) [+3 from new AC-16/AC-21 cases]
specs/m13b-build-spec-deepening/test-acceptance-review-r2-prompt.md:32:2. Is the AC-16 fix non-vacuous? (The filter actually rejects hard gate lines — does the test have real falsifiability, i.e. would it catch an actual blocking gate in SKILL.md?)
specs/m13b-build-spec-deepening/test-acceptance-review-r2-prompt.md:33:3. Is the AC-21 rename sufficient?
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:55: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use gate.sh as an active execution call
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:56: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use post_review_pass as an active gate
specs/m13b-build-spec-deepening/evidence/phase-3-RED.json.stdout:57: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use [DECOMP] telemetry emission
specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:8:> 本报告只读（read-only）。记录不一致/重复/歧义/欠定义问题，不修改三产物，不阻断下游推进。
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:42:| A-02 | LOW | plan.md S6 宪法条款判据 | plan.md Constitution Check S6 判据末尾写"待 SKILL.md 写入时确认 version"，引入了一个"待确认"的条件，意味着 S6 结论是临时的。这与 Constitution Check 的一次性记录语义有轻微不一致（其他 20 条无此留白）。 | id:A-02, type:ambiguity, location:plan.md Constitution Check S6, description:S6 判据含"待确认"语，使其结论不完整, suggested_action:后续 SKILL.md 写入完成后将 S6 判据更新为确定性结论；目前不阻断 |
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:48:| G-01 | LOW | spec.md AC-20, AC-21 vs plan.md/tasks.md | spec.md 含 AC-20（Known Gaps 段可搜索）和 AC-21（行为验证场景格式覆盖）。plan.md Verification Mapping 未单独列出 AC-20/AC-21 的对应 Step（AC-20 隐含在 Step 1.2 / FR-STRUCTURE-002，AC-21 隐含在 Step 3.2 / FR-BEHAV-001/002）。 | id:G-01, type:coverage_gap, location:plan.md Verification Mapping, description:AC-20/AC-21 未显式在 Verification Mapping 中出现, suggested_action:可将 AC-20 加入 Step 1.2 行、AC-21 加入 Step 3.2 行；低优先级，功能覆盖已存在 |
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:74:4. **G-01 可选补充**：plan.md Verification Mapping 显式列出 AC-20/AC-21 映射。
specs/m13b-build-spec-deepening/cross-artifact-analysis.md:77:所有 MEDIUM/LOW 发现均不阻断推进。无 CRITICAL/HIGH 发现。
specs/m13b-build-spec-deepening/build-plan-3rd-review.md:51:- **[NBK-9]** D3 deleted items handled correctly: blocking gates, TodoWrite, `[DECOMP]`, gate-bound auto-write, Exit Conditions repetition all excluded from active mechanisms. `blocking gate` appears only as blacklist example text in T010, which is acceptable per AC-16.
specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:264:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:99:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:104:- 所有新机制均为"记录事实 + 浮现 + 人判断"，零阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:127:- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:129:- agenthub design 阶段有丰富质量保障体系，但其阻断门机制与 CONSTITUTION 冲突，须按"最小实现+记事实"原则移植。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:142:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:143:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:150:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:160:- agenthub 3 道阻断门（退出门/审查门/推进门）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:161:- TodoWrite 待办模板仪式
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:164:- Exit Conditions 重复行
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:167:- 任何阻断式 gate
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:178:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:180:### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:183:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:185:### 场景 3.3：异源 3rd-review 审查发现方向偏差（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:188:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:190:### 场景 3.4：scope-triage 发现高危词（浮现建议不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:192:- **操作步骤**：spec 文本中检测到高危词（如"自动阻断""blocking gate""门禁"等）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:200:### 场景 3.6：spec↔decision-log 一致性检查发现差异（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:203:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:234:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:251:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:264:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:266:- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:294:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:296:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:303:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:305:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:341:specs/m13b-build-spec-deepening/spec.md:51:- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:342:specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:343:specs/m13b-build-spec-deepening/spec.md:190:- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:345:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:348:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:349:tasks/m13b-build-spec-deepening/decision-log.md:46:- 不做任何阻断式 gate（gate.sh stage_exit / post_review_pass / stage_advance 的阻断语义）。理由：违宪 F4/F5/F7/F10，F10 反例点名 agenthub。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:357:specs/m13b-build-spec-deepening/spec.md:51:- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:359:specs/m13b-build-spec-deepening/spec.md:116:- **操作步骤**：spec 文本中检测到高危词（如"自动阻断""blocking gate""门禁"等）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:360:specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:361:specs/m13b-build-spec-deepening/spec.md:190:- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:362:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:365:specs/m13b-build-spec-deepening/spec.md:360:- [ ] **AC-21**：SKILL.md 中 D3 删除项不作为活跃机制存在——即 grep `workflows/build-spec/SKILL.md` 不命中 TodoWrite 待办模板调用、`[DECOMP]` 遥测发射、绑门自动写、Exit Conditions 重复行 作为机制性执行步骤；纯说明性引用（如"本 skill 不用 TodoWrite 待办模板"）不算违反，与 AC-16 同口径。这是 decision-log §7「D3 删除项不出现」的精确操作化：删除项作为机制不出现。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:366:specs/m13b-build-spec-deepening/spec.md:371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:367:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:373:specs/m13b-build-spec-deepening/spec.md:441:| D3 | 删除：agenthub 3 道门（退出门/审查门/推进门）、TodoWrite 待办模板仪式、`[DECOMP]` 遥测、绑门自动写、Exit Conditions 重复行（CUT，无需 FR 覆盖） | — |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:375:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:376:tasks/m13b-build-spec-deepening/decision-log.md:26:- **D3（删除）**：agenthub 3 道门（退出门/审查门/推进门）整层删（检查内容已被 D2 的 7 自检+纯净度扫描+独立审查覆盖，重复）；TodoWrite 待办模板仪式、`[DECOMP]` 遥测、绑门自动写、Exit Conditions 重复行。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:378:tasks/m13b-build-spec-deepening/decision-log.md:46:- 不做任何阻断式 gate（gate.sh stage_exit / post_review_pass / stage_advance 的阻断语义）。理由：违宪 F4/F5/F7/F10，F10 反例点名 agenthub。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:379:tasks/m13b-build-spec-deepening/decision-log.md:49:- 不搬 agenthub TodoWrite 待办模板、`[DECOMP]` 遥测、绑门自动写。理由：纯 token 开销、workflowhub 无对应。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:388:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:389:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:390:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:398:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:399:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:263:   新增 ladder F10 在 [workflows/build-spec/SKILL.md:94](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:94) 写了“不作为阻断条件”，但旧的 Section 6 仍写成硬 gate：[workflows/build-spec/SKILL.md:263](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:263) 标题就是 `F10 anti-over-engineering gate`，[workflows/build-spec/SKILL.md:267](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:267) 要求“四问答不全就 remove”，[workflows/build-spec/SKILL.md:274](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:274) 又要求某些答案直接 remove mechanism。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:400:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:404:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:832:+F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:405:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:872:+**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:409:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1038:    94	F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:410:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1087:   143	**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:423:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1337:./tasks/m12-build-plan-v1/stage-result-build-spec.json:7:    "requirements": "24 FR across 10 groups: FR-BP(3, build-plan v1 SKILL.md 串行编排+plan/tasks产物结构+stage-result契约保留追加tasks_ref), FR-MIG(3, speckit-plan/tasks/analyze 改造迁移 workflows/ 改名 plan-generate/tasks-generate/cross-artifact-analyze + 独立可调起内置模板 + tasks 阶段分组), FR-DECOUPLE(3, 不从git分支推断身份 fail-loud + 模板技能内部加载 + analyze 显式路径定位), FR-XARTIFACT(2, 跨产物一致性检查只记录不阻断), FR-CONSTITUTION(3, 21条逐条勾选只记录不阻断 + 缺失判据), FR-BASELINE(3, M10 5项对照 rework_proxy_count真名 阈值人拍), FR-REGISTRY(2, 三件 reuse-registry 登记+格式校验), FR-REVIEW(1, 一且仅一次人审检查点), FR-SKELETON(2, F10门保留+M6 stage-result/metrics契约不回归), FR-SCOPE(2, 不碰 build-code/verify-code 逻辑+design其他技能); 9条验收; 每FR可溯 D-M12-x。"
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:448:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1446:workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:449:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1453:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:450:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1467:specs/m13b-build-spec-deepening/spec.md:51:- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:451:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1481:specs/m13b-build-spec-deepening/spec.md:116:- **操作步骤**：spec 文本中检测到高危词（如"自动阻断""blocking gate""门禁"等）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:452:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1487:specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:453:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1488:specs/m13b-build-spec-deepening/spec.md:190:- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:454:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1490:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:455:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1502:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:456:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1512:specs/m13b-build-spec-deepening/plan.md:201:- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：spec 明确 OUT 列表（无阻断门、无 3 source_family 多重审查、无 TodoWrite 仪式），CUT 了全部 agenthub 阻断门（D3），无新增 gate 机制。符合 F5。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:457:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:458:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1526:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:459:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:460:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:461:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1535:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:462:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:463:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1553:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:464:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:465:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1642:specs/m13b-build-spec-deepening/constitution-check.md:62:  spec 明确对 agenthub 原有质量保障体系进行了合宪改造：删除三道阻断门（不符合 F4/F5），保留质量事实浮现机制；FR-REVIEW-002 将三 source_family 异源改造为 1-AI-3-angle 单代理三角度（合宪简化）；这正是"按项目需要改造使其合宪"的典型体现，符合 S2。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:475:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1877:workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:476:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1881:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:477:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1902:specs/m13b-build-spec-deepening/spec.md:188:**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:478:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1908:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:483:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2345:specs/m13b-build-spec-deepening/spec.md:371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:486:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2891:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:487:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2896:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:488:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2956:360:- [ ] **AC-21**：SKILL.md 中 D3 删除项不作为活跃机制存在——即 grep `workflows/build-spec/SKILL.md` 不命中 TodoWrite 待办模板调用、`[DECOMP]` 遥测发射、绑门自动写、Exit Conditions 重复行 作为机制性执行步骤；纯说明性引用（如"本 skill 不用 TodoWrite 待办模板"）不算违反，与 AC-16 同口径。这是 decision-log §7「D3 删除项不出现」的精确操作化：删除项作为机制不出现。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:489:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2958:371:- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:491:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:492:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2968:   新增 ladder F10 在 [workflows/build-spec/SKILL.md:94](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:94) 写了“不作为阻断条件”，但旧的 Section 6 仍写成硬 gate：[workflows/build-spec/SKILL.md:263](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:263) 标题就是 `F10 anti-over-engineering gate`，[workflows/build-spec/SKILL.md:267](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:267) 要求“四问答不全就 remove”，[workflows/build-spec/SKILL.md:274](/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md:274) 又要求某些答案直接 remove mechanism。  
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:493:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:496:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:498:specs/m13b-build-spec-deepening/plan.md:201:- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：spec 明确 OUT 列表（无阻断门、无 3 source_family 多重审查、无 TodoWrite 仪式），CUT 了全部 agenthub 阻断门（D3），无新增 gate 机制。符合 F5。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:504:tasks/m13b-build-spec-deepening/journal.jsonl:10:{"seq":10,"event":"constitution_crosscheck_done","ts":"2026-06-30T04:42:00Z","artifact":"artifacts/direction-constitution-crosscheck.md","note":"grill: 5 mechanisms constitutional & portable; 3 blocking gates (stage_exit/post_review_pass/stage_advance) violate F4/F5/F10/Q1/Q2/F7. F10 反例 names agenthub explicitly."}
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:509:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:516:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:518:specs/m13b-build-spec-deepening/constitution-check.md:39:  spec 影响范围第 7 节明确"测试边界：grep SKILL.md 验证 AC-01 至 AC-16；JSON schema 验证 AC-17；正则验证 AC-18"，验证手段为轻量 grep/正则而非独立 CI 门；Section 5（不做）明确排除了遥测分解 [DECOMP] 和门绑定自动写；附录 D F10 四问执行结论"维护成本低（均为 SKILL.md 描述性内容，非代码）"，符合 F10 按真实收益添加自动化的原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:519:specs/m13b-build-spec-deepening/constitution-check.md:62:  spec 明确对 agenthub 原有质量保障体系进行了合宪改造：删除三道阻断门（不符合 F4/F5），保留质量事实浮现机制；FR-REVIEW-002 将三 source_family 异源改造为 1-AI-3-angle 单代理三角度（合宪简化）；这正是"按项目需要改造使其合宪"的典型体现，符合 S2。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:521:tasks/m13b-build-spec-deepening/artifacts/s5-prompt-framing.md:5:背景：workflowhub 是 AI 开发工作流编排工具，宪法核心信条：薄核心窄契约、记事实不阻断、质量靠独立审查与人。它立项就是为逃离前身 agenthub——agenthub 堆约 9.5 万行 gate 代码、半数提交修 gate 死锁，被宪法 F10 列为反例。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:526:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:527:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:533:tasks/m13b-build-spec-deepening/artifacts/s5-prompt-direction.md:5:背景：workflowhub 是 AI 开发工作流编排工具，有一套宪法 CONSTITUTION（核心信条：薄核心窄契约、记事实不阻断、质量靠独立审查与人、不写阻断式质量门）。它的立项根因之一就是逃离前身系统 agenthub——agenthub 堆了约 9.5 万行 gate/校验代码，约一半提交在修 gate 死锁，宪法 F10 反例点名此事。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:534:tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:4:workflowhub 是 AI 工作流编排工具，宪法核心：薄核心窄契约、记事实不阻断、质量靠独立审查与人、不写阻断式质量门。立项是为逃离前身 agenthub（堆 9.5 万行 gate 代码、半数提交修 gate 死锁，被宪法 F10 点名反例）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:536:tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:4:workflowhub：AI 工作流编排工具，宪法核心=薄核心、记事实不阻断、质量靠独立审查与人、不写阻断式质量门。立项为逃离前身 agenthub（堆 9.5 万行 gate 代码、半数提交修 gate 死锁，宪法 F10 反例点名）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:537:tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:10:3. 删：agenthub 那 3 道门（退出门/审查门/推进门）整层删（检查内容已被 7 自检+纯净度扫描+异源审查覆盖）；TodoWrite 待办模板仪式、[DECOMP] 遥测、绑门自动写、重复行。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:538:tasks/m13b-build-spec-deepening/artifacts/make-decision-original-context.md:19:- CONSTITUTION.md v1.1.0 已亲读：F4/F5/F10/Q1/Q2 明确禁止「阻断式质量门」；**F10 反例原文点名 agenthub 的 9.5 万行 gate 代码为永久警示**。【基准已读】
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:540:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:37:| host 自动写 capture+stage_summary 绑 gate 的描述 | 18 | 绑在阻断门上的自动写仪式，门删了它也没意义。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:541:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:549:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:20:| 1 | 退出检查门 gate.sh stage_exit（没过不能进） | **违 F4/F5/F10/Q2** | 不可照搬。改：6 条检查照跑，结果记事实+浮现边界，**不阻断**；推进由人确认（F7） |
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:551:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:31:- **必须改造（违宪，不可照搬）**：stage_exit 门、post_review_pass 门、stage_advance 门 → 3 道 blocking gate。照搬即违 F4/F5/F7/F10/Q1/Q2，且违 CLAUDE.md 硬规则「不引入会阻断推进的质量门」。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:557:/bin/bash -lc 'rg -n "''^##|''^###|F10|HUMAN_REVIEW_CHECKPOINT|pruned|pruning|prune|re-prune|裁剪后|裁剪|remove|auto-?remove|automatic changes|阻断|blocking|不得继续|不能继续|停止" workflows/build-spec/SKILL.md' in /Users/Hugh/Hugh/Project/workflowhub
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:573:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:577:120:spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:578:122:**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:579:127:- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:581:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:582:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:584:152:- 审查失败/不可用时降级记录 unknown + 原因，不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:587:168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:591:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:597:214:- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:598:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:600:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:601:225:- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:602:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:604:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:712:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:738:spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:740:**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:745:- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:757:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:761:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:770:- 审查失败/不可用时降级记录 unknown + 原因，不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:786:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:810:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:832:- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:833:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:842:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:843:- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:856:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:874:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:950:/bin/bash -lc 'rg -n "pruned|pruning|裁剪后|re-prune|auto-?remove|自动删除|自动移除|automatic changes|remove mechanism|机制移除|阻断条件|blocking condition|stop|停止|不得继续|不能继续|gate" workflows/build-spec tests specs/m13b-build-spec-deepening/tasks.md' in /Users/Hugh/Hugh/Project/workflowhub
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:953:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:957:workflows/build-spec/SKILL.md:94:F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:960:workflows/build-spec/SKILL.md:122:**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:961:workflows/build-spec/SKILL.md:127:- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:962:workflows/build-spec/SKILL.md:168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:964:workflows/build-spec/SKILL.md:225:- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:965:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:976:tests/m13b-build-spec-deepening.test.mjs:303:      "gate.sh must not appear as active mechanism in SKILL.md (AC-21/AC-16)");
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:53: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use gate.sh as an active execution call
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:54: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use post_review_pass as an active gate
specs/m13b-build-spec-deepening/evidence/phase-3-GREEN.json.stdout:55: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use [DECOMP] telemetry emission
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:587:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/test/final-test-report.md:53:| AC-11 | scope-triage 高危词浮现（非阻断）| PASS |
specs/m13b-build-spec-deepening/test/final-test-report.md:54:| AC-12 | spec↔decision-log 一致性检查（非阻断）| PASS |
specs/m13b-build-spec-deepening/test/final-test-report.md:58:| AC-16 | 语义判断：无阻断式控制语义 | PASS |
specs/m13b-build-spec-deepening/test/final-test-report.md:63:| AC-21 | 无 post_review_pass 阻断门，无 [DECOMP] | PASS |
specs/m13b-build-spec-deepening/test/final-test-report.md:64:| AC-22 | 5 项质量事实契约全部为非阻断语义 | PASS |
specs/m13b-build-spec-deepening/test/final-test-report.md:68:`workflows/build-spec/SKILL.md` 中所有新增检查均为"记录+浮现"语义，无阻断门：
specs/m13b-build-spec-deepening/test/final-test-report.md:69:- scope-triage 高危词浮现：`不阻断`
specs/m13b-build-spec-deepening/test/final-test-report.md:70:- 3rd-review 失败降级：`不阻断`
specs/m13b-build-spec-deepening/test/final-test-report.md:71:- spec↔decision-log 一致性：`不阻断推进`
specs/m13b-build-spec-deepening/test/final-test-report.md:72:- artifact-first 违规：`warn，非阻断`
specs/m13b-build-spec-deepening/test/final-test-report.md:73:- FR-CONTRACT-002 明确禁止附加阻断语义
specs/m13b-build-spec-deepening/test/final-test-report.md:99:| AC-16 测试缺失：describe 块仅覆盖 D3 删除项（gate.sh 等），但 AC-16 要求"高危词不作执行门"未测试 | tests/m13b-build-spec-deepening.test.mjs:300 | 新增专属 AC-16 describe 块，检查 `不能进`/`BLOCK/blocking` 不作执行门（含中英文否定形式白名单）；原 D3 块改标为 AC-21 |
specs/m13b-build-spec-deepening/test/final-test-report.md:110:- B1 (AC-16): Test didn't check Chinese `阻断` as hard gate (only checked `不能进` and English BLOCK/blocking)
specs/m13b-build-spec-deepening/test/final-test-report.md:111:- B2 (AC-21): Missing checks for TodoWrite template calls and duplicate Exit Conditions sections
specs/m13b-build-spec-deepening/test/final-test-report.md:117:| AC-16 missing `阻断` check | Added new test: filters `阻断` lines, allows negated/blacklist/constitution context; hard gate like `若X则阻断流程` would fail |
specs/m13b-build-spec-deepening/test/final-test-report.md:118:| AC-21 missing TodoWrite check | Added test: `TodoWrite` must not appear as active mechanism (non-explanatory lines) |
specs/m13b-build-spec-deepening/test/final-test-report.md:119:| AC-21 missing duplicate Exit Conditions check | Added test: `## Exit Conditions` / `stage_exit` count ≤ 1 |
specs/m13b-build-spec-deepening/test/final-test-report.md:123:- Tests: 848 passed (848) [+3 from AC-16 阻断 test + AC-21 TodoWrite + Exit Conditions tests]
specs/m13b-build-spec-deepening/test/final-test-report.md:130:验证通过，所有 22 AC 满足，845/845 测试绿（含 R2 修复后新增 3 个 AC 测试），非阻断约束满足，3rd-review R1→R2 已闭环。待用户确认合并与删分支。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:9:3rd-review Phase 3 R3 for m13b-build-spec-deepening. Single remaining R2 finding: FR-ARTIFACT-001 non-blocking note was not explicit enough. Fixed: now reads '违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）'. This matches the same explicit pattern used for FR-BEHAV-001/002. 55 tests pass. Please verify FR-ARTIFACT-001 non-blocking clause is now complete and output final verdict: pass | revise_required.
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:13:3rd-review Phase 3 R3 for m13b-build-spec-deepening. Single remaining R2 finding: FR-ARTIFACT-001 non-blocking note was not explicit enough. Fixed: now reads '违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）'. This matches the same explicit pattern used for FR-BEHAV-001/002. 55 tests pass. Please verify FR-ARTIFACT-001 non-blocking clause is now complete and output final verdict: pass | revise_required.
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:25:- 明确“不自动停止 stage（非阻断）”
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:64:3rd-review Phase 3 R3 for m13b-build-spec-deepening. Single remaining R2 finding: FR-ARTIFACT-001 non-blocking note was not explicit enough. Fixed: now reads '违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）'. This matches the same explicit pattern used for FR-BEHAV-001/002. 55 tests pass. Please verify FR-ARTIFACT-001 non-blocking clause is now complete and output final verdict: pass | revise_required.
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:73:/bin/bash -lc "rg -n \"FR-ARTIFACT-001|FR-BEHAV-001|FR-BEHAV-002|质量事实契约|非阻断|不自动停止\" specs tasks . -g '"'!node_modules'"'" in /Users/Hugh/Hugh/Project/workflowhub
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:75:./CLAUDE.md:14:- **记录事实而非阻断**：物理事实机器采集、浮现到边界，但不卡死推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:76:./constitution-checklist.md:12:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。→ [CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门](CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:77:./constitution-checklist.md:22:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。→ [CONSTITUTION.md#q1-记事实而非阻断](CONSTITUTION.md#q1-记事实而非阻断)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:78:tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:79:tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:80:tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.raw.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:81:tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.raw.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:82:./README.md:7:workflowhub 把开发流程拆成五个阶段，每个阶段做成一个独立、可搬运、可被子代理调用的技能；多个技能组成一个工作流。它强调：薄核心、窄契约、质量靠独立审查与人（而非阻断式质量门）、记录事实而非卡死流程。完整的设计原则见 [CONSTITUTION.md](CONSTITUTION.md)，逐条检查清单见 [constitution-checklist.md](constitution-checklist.md)。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:83:tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:84:tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:85:./skills/spec-plan/templates/plan-template.md:37:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。<!-- 判据说明 -->
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:86:./skills/spec-plan/templates/plan-template.md:47:- [ ] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。<!-- 判据说明 -->
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:87:tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report.md:8:第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:88:tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report.md:16:- [major] 位置: spec.md:323 | 问题: FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。 | 建议: 明确：`[ ]` 不符合项不阻断；但 21 条缺失、无状态、无判据属于检查产物无效，应使 build-plan 失败。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:89:specs/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:90:specs/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:91:tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report-round-3.md:8:第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:92:tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report-round-3.md:16:- [major] 位置: spec.md:323 | 问题: FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。 | 建议: 明确：`[ ]` 不符合项不阻断；但 21 条缺失、无状态、无判据属于检查产物无效，应使 build-plan 失败。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:93:tasks/m12-build-plan-v1/review/codex-raw-output.txt:608:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:94:tasks/m12-build-plan-v1/review/codex-raw-output.txt:618:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:95:tasks/m12-build-plan-v1/review/codex-raw-output.txt:1101:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:96:tasks/m12-build-plan-v1/review/codex-raw-output.txt:1102:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:97:tasks/m12-build-plan-v1/review/codex-raw-output.txt:1406:    36	- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:98:tasks/m12-build-plan-v1/review/codex-raw-output.txt:1416:    46	- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:99:tasks/m12-build-plan-v1/review/codex-raw-output.txt:1902:   328	    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:100:tasks/m12-build-plan-v1/review/codex-raw-output.txt:1903:   329	    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:101:tasks/m12-build-plan-v1/review/codex-raw-output.txt:2566:   328	    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:102:tasks/m12-build-plan-v1/review/codex-raw-output.txt:2567:   329	    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:103:tasks/m12-build-plan-v1/review/codex-raw-output.txt:2630:specs/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:104:tasks/m12-build-plan-v1/review/codex-raw-output.txt:2634:specs/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:105:tasks/m12-build-plan-v1/review/codex-raw-output.txt:2692:specs/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:106:tasks/m12-build-plan-v1/review/codex-raw-output.txt:2693:specs/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:107:tasks/m12-build-plan-v1/review/codex-raw-output.txt:2760:    36	- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:108:tasks/m12-build-plan-v1/review/codex-raw-output.txt:2770:    46	- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:109:./workflows/make-decision/SKILL.md:57:其余步骤失败均记录后继续推进（非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:110:./workflows/make-decision/SKILL.md:119:**失败处理**（非阻断）：
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:111:./workflows/make-decision/SKILL.md:122:- 无论成功或失败，S1 均非阻断，必须继续到 S2。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:112:./workflows/make-decision/SKILL.md:186:3. 接收用户回答后，记录 journal 事件 `event: "s4_baseline_recorded"`（非阻断，不等确认直接继续）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:113:./workflows/make-decision/SKILL.md:389:**失败/不可达分支**（非阻断）：
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:114:./workflows/make-decision/SKILL.md:564:| `s1_all_agents_failed` | S1（full 档） | `reason: "<原因>"`, `s1_mode: "subagent"/"inline_serial"` | 内部调研全部失败（非阻断） |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:115:specs/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:116:specs/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:117:tasks/m13-make-decision-v1/review/codex-review-prompt.md:19:2. 方向盲审（blind review）——复用 3rd-review skill，异源，非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:118:tasks/m13-make-decision-v1/review/codex-review-prompt.md:23:全部非阻断（D5），唯一 hard gate 是 S9 用户明确批准。"
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:119:tasks/m13-make-decision-v1/review/codex-review-prompt.md:83:理由: workflowhub 无既有业务 env 惯例，所有 env 透传外部 skill 已有约定，不引入新惯例；可选+安全默认保证 D5 非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:120:tasks/m13-make-decision-v1/review/codex-review-prompt.md:86:来源证据: tasks/m13-make-decision-v1/research/env-var-design.md §env-var清单全节 + §设计原则；D5 CONSTITUTION 非阻断原则
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:121:tasks/m13-make-decision-v1/review/codex-review-prompt.md:93:理由: 宪法 D5 记录事实而非阻断；quality 靠独立审查和人确认，不靠自动机器 gate；台账无静默踢出防止需求被悄悄丢弃
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:122:tasks/m13-make-decision-v1/review/codex-review-prompt.md:96:来源证据: make-decision-flow-aligned.md §横切质量机制表；原始 intake.md 各条；CONSTITUTION.md D5 非阻断原则
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:123:tasks/m13-make-decision-v1/review/codex-review-prompt.md:174:2. 方向盲审（blind review）via 3rd-review, 异源, 非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:124:tasks/m12-build-plan-v1/plan-tasks-review-package.md:81:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:125:tasks/m12-build-plan-v1/plan-tasks-review-package.md:104:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:126:tasks/m12-build-plan-v1/decision-log.md:73:- **理由链**：M11 D-M11-7 路由表明确 speckit-analyze 留 M12。analyze 天然只读非破坏，符合"记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:127:tasks/m13-make-decision-v1/stage-result-make-decision.json:6:    "decision": "M13 深化 make-decision 为 12 步流程（S0、S0.5、S1-S10）：背景扎根→scope-triage→内部调研→talk#1门控外部→条件性双路调研(muyu-search-mcp+anysearch,返空即停)→talk#2收敛+方向基线确认→三角度异源盲审(3rd-review)+第一次debate调用点→给用户看→talk#3→grill→草稿→orchestrator审查+第二次debate调用点→同步CONTEXT/ADR→S9用户批准→落盘。全部非阻断(D5)，debate触发判断和五方法庭/单人三档模式委托 /Users/Hugh/Hugh/Project/debate 技能 Step 1，make-decision 只做skip/path/call/read verdict薄编排，唯一hard gate=S9。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:128:tasks/m13-make-decision-v1/decision-log.md:16:> 2. 方向盲审（blind review）——复用 3rd-review skill，异源，非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:129:tasks/m13-make-decision-v1/decision-log.md:20:> 全部非阻断（D5），唯一 hard gate 是 S9 用户明确批准。"
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:130:tasks/m13-make-decision-v1/decision-log.md:106:| 理由 | workflowhub 无既有业务 env 惯例，所有 env 透传外部 skill 已有约定，不引入新惯例；可选+安全默认保证 D5 非阻断 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:131:tasks/m13-make-decision-v1/decision-log.md:109:| 来源证据 | `tasks/m13-make-decision-v1/research/env-var-design.md` §env-var清单全节 + §设计原则；D5 CONSTITUTION 非阻断原则 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:132:tasks/m13-make-decision-v1/decision-log.md:121:| 理由 | 宪法 D5 "记录事实而非阻断"；quality 靠独立审查和人确认，不靠自动机器 gate；台账无静默踢出防止需求被悄悄丢弃 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:133:tasks/m13-make-decision-v1/decision-log.md:124:| 来源证据 | `tasks/m13-make-decision-v1/research/make-decision-flow-aligned.md` §横切质量机制表；原始 intake.md D28台账/方向基线确认衔接点/三角度输入隔离/防漏阀留痕/新想法回退判定D15/双路返空即停/交互简洁各条；CONSTITUTION.md D5 非阻断原则 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:134:./workflows/build-plan/SKILL.md:80:- The check is about recording facts (Q1: 记事实而非阻断), NOT about passing a quality gate
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:135:tasks/m13b-build-spec-deepening/scope-decision.md:40:### D-M13b-3：spec-reviewer 触发条件 = 可选、非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:136:tasks/m13b-build-spec-deepening/scope-decision.md:61:| spec-reviewer（M0 ref） | 新建 | 独立子代理，非阻断 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:137:tasks/m13-make-decision-v1/research/env-var-design.md:16:- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`：启用五方法庭对抗模式。**不设置时自动降级为单人三档模式**，非阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:138:tasks/m13-make-decision-v1/research/env-var-design.md:56:| `MAKE_DECISION_SKIP_BLIND_REVIEW` | 设为 `1` 跳过盲审（非阻断标志，调试 / 离线环境用） | 未设置（正常执行） | blind-review action | 否 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:139:specs/m12-build-plan-v1/constitution-check.md:16:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — cross-artifact-analyze 作为独立第三方技能扫描三产物（FR-XARTIFACT-001），加一次人审检查点（FR-REVIEW-001），决策 D-M12-5 明确引用"承接 F4 异源审查不卡死"，未设阻断式质量门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:140:specs/m12-build-plan-v1/constitution-check.md:26:- [x] **Q1 记事实而非阻断** — 宪法检查结果"仅记录浮现供人审查，不因不达标阻断"（FR-CONSTITUTION-002），analyze 报告"仅记录不阻断"（FR-XARTIFACT-002），基线对照"不达标不阻断推进"（FR-BASELINE-002），与 F3/F4 一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:142:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:144:tasks/m13b-build-spec-deepening/decision-log.md:28:- **D4（审查恢复修正）**【修正 2026-06-30，Hugh 授权】：原降级基于错误前提——将「异源独立审查」误当成「3 个不同 source_family 各审一角度」的高成本机制。事实是 agenthub design 原审查 = 单一异源引擎（如 codex）的 3rd-review 独立审查，workflowhub 现有 3rd-review 基础设施可直接复用，成本仅一次异源调用。**恢复为 B=真·异源独立审查：复用现有 3rd-review（单一异源引擎），产出 verdict+findings，记入质量事实契约第 3 项，非阻断（记录+浮现+人判断）。不做 3 source_family 多重审查（过度工程，Hugh 从未要求）。单一异源满足宪法独立裁决最小要求。**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:146:tasks/m13b-build-spec-deepening/decision-log.md:60:- 审查机制为真·异源独立审查（复用现有 3rd-review，单一异源引擎），结论记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:147:specs/m12-build-plan-v1/plan.md.handwritten.bak:78:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:148:specs/m12-build-plan-v1/plan.md.handwritten.bak:101:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:152:./workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:157:./workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:159:./workflows/build-spec/SKILL.md:196:长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:163:./workflows/build-spec/SKILL.md:203:以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:164:./workflows/build-spec/SKILL.md:217:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:165:./workflows/build-spec/SKILL.md:226:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:166:./workflows/build-spec/SKILL.md:240:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:167:./workflows/build-spec/SKILL.md:258:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:168:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:169:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:170:specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/report-round-1.md:14:- [major] 位置: workflows/make-decision/SKILL.md:292 | 问题: S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。 | 建议: 把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:171:specs/m13-make-decision-v1/plan.md:11:将 `skills/make-decision/SKILL.md` 从 M7 的两步骤（scope-triage + decision-log）全面重写为带五类护城河动作的 12 步流程（S0、S0.5、S1–S10）。新增：S0 背景扎根、S0.5 scope-triage(分档 lite/full)、S1 内部调研（full档专属）、S2/S4/S7 三轮 talk 交互、S3 双路外部调研、S5 三角度异源盲审+第一次debate门控、S6 展示盲审/debate结果给用户、S7 talk#3→grill→draft→orchestrator→第二次debate门控、S8 台账渲染、S9 用户批准（唯一硬门）、S10 decision-log 落盘。所有步骤均为记录态非阻断，S9 是唯一强制等待点。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:172:specs/m13-make-decision-v1/plan.md:37:| **F4 质量靠异源审查与人而非阻断式质量门** | [x] | 盲审（S5 三角度异源 3rd-review）、debate（S5/S7 门控）、S9 用户确认均为质量机制；无任何自动化阻断 gate（S9 唯一硬门且需人确认）。|
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:173:specs/m13-make-decision-v1/plan.md:38:| **F5 gate谨慎添加出事再补无用则移除** | [x] | 全流程仅 S9 一个 gate（人工确认），其余检查点均为记录态非阻断；F10 Gate 章节对每个机制逐条过四问，零冗余机制。|
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:174:specs/m13-make-decision-v1/plan.md:44:| **Q1 记事实而非阻断** | [x] | 所有失败/跳过路径（s1_all_agents_failed、debate_1: skipped、debate_triggered_invalid 等）均记录事实到 journal，继续推进，不阻断。|
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:175:specs/m13-make-decision-v1/plan.md:150:**Step 2.6 — S4 方向设计 + talk#2（非阻断，记录态）**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:176:specs/m13-make-decision-v1/plan.md:153:- 动作：向用户展示方向摘要，问 Q2 收敛方向；用户回答后记 `s4_baseline_recorded: true`（非阻断，不等确认即继续）；渲染点①：写 `artifacts/make-decision-original-context.md`（原始需求逐条初始状态），此文件落盘后 S5 方可执行
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:177:specs/m13-make-decision-v1/plan.md:245:| FR-ACCEPT-01 S4 方向基线记录（非阻断） | 带错方向进入高成本盲审 | 无 S5 前检查点 | 可跳过（非代码门），记录态继续 | 低 | **保留** |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:178:specs/m13-make-decision-v1/plan.md:267:| Step 2.6 S4 + talk#2 + 渲染点① | FR-ACCEPT-01, FR-TALK-01, FR-LEDGER-01 | `s4_baseline_recorded: true`（非阻断）；original-context.md 在 S5 前落盘 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:179:specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.raw.json:22:      "issue": "S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:180:specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.raw.json:23:      "recommendation": "把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。"
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:181:./tests/m12-spec-analyze.test.mjs:177:      content.includes("非阻断");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:183:specs/m13-make-decision-v1/review/plan-review-r4.md:112:- S9 仍是唯一 hard gate；S4 为记录态非阻断；未发现新增 blocking gate。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:186:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:187:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:193:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:868:+5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:198:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:921:+条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:206:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1083:   139	5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:211:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1136:   192	条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:216:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1159:   215	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:217:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1168:   224	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:218:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1427:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:219:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1428:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:220:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1430:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:221:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1433:tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:222:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1436:tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:223:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1439:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:224:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1452:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:225:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1456:workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:226:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1458:workflows/build-spec/SKILL.md:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:227:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1459:workflows/build-spec/SKILL.md:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:228:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1461:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:229:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1462:workflows/build-spec/SKILL.md:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:230:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1465:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:231:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1469:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:232:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1470:specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:233:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1472:specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:234:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1475:specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:235:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1477:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:236:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1479:specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:237:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1483:specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:238:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1484:specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:240:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1486:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:241:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1489:specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:242:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1491:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:243:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1492:specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:244:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1494:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:245:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1497:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:246:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1499:specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:247:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1500:specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:248:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1504:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:249:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:250:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1508:specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:251:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1509:specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:252:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1511:specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:253:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1513:specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:254:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1521:specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:255:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1524:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:256:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:257:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1527:specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:258:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:259:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1529:specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:260:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1533:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:261:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:262:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1536:specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:263:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:264:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1538:specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:265:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1543:specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:266:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1545:specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:268:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1561:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:272:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1586:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:273:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1588:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:276:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1633:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:277:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1634:specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:278:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:279:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1639:specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:280:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1640:specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:281:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1641:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:282:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1669:   238	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:283:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1687:   256	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:285:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1832:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:286:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1833:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:287:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1858:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:289:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1880:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:300:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1910:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:306:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1934:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:307:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1936:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:312:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1947:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:313:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:318:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2090:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:319:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2091:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:320:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2167:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:321:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2187:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:322:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2201:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:323:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2216:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:329:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2895:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:337:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2946:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:338:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2947:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:339:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:340:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:342:specs/m13-make-decision-v1/review/plan-review-r1.md:81:S4 被 plan/tasks 写成等待用户确认的 gate，违反上游 spec 和“唯一硬门 S9”规则。spec 明确要求 S4 是“记录模式，非阻断”，展示方向基线后直接推进到 S5，不等待显式确认；journal 事件应为 `s4_baseline_recorded: true`，不是 `s4_baseline_confirmed: true`。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:343:specs/m13-make-decision-v1/review/plan-review-r1.md:294:- S4 非阻断被 plan/tasks 改成确认 gate
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:344:specs/m13-make-decision-v1/review/plan-review-r1.md:346:当前 plan/tasks 不是小修即可放行。必须先修正 12 步命名、lite/full 路由、S4 非阻断、S5/S6 分工、台账渲染时机、env var 清单、宪法检查和 cross-analysis 假绿问题。修完后应重新执行 build-plan 的 spec-plan/spec-tasks/spec-analyze 三步，确保三产物同步。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:346:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:99:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:351:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:142:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:352:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:143:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:353:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:150:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:356:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:178:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:357:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:183:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:358:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:188:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:359:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:203:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:361:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:234:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:366:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:251:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:369:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:294:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:370:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:303:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:371:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:305:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:377:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:348:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:378:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:375:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:379:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:388:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:380:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:390:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:381:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:398:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:382:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:400:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:383:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:457:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:384:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:459:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:385:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:460:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:386:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:462:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:387:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:464:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:388:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:491:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:389:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:493:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:390:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:509:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:391:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:393:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:516:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:394:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:526:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:395:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:396:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:541:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:397:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:581:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:400:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:591:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:403:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:598:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:404:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:600:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:405:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:602:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:406:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:604:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:410:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:757:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:415:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:810:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:420:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:833:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:421:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:842:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:422:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:856:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:423:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:874:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:424:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:953:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:425:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:965:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:427:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:432:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:433:specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:434:specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:437:specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:438:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:439:specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:440:specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:442:specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:447:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:450:specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:451:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:452:specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:458:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:459:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:461:specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:462:specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:469:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:470:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:473:specs/m13-make-decision-v1/review/plan-review-r6-prompt.md:13:核 R5 的 1 minor 是否真修好：cross-analyze B5 追溯说明已用新格式「反对 X：/决定 Y：/理由 Z：」且已解决列点名全链路(spec/plan/tasks/decision-log D6/T016)，全仓 artifacts 无旧斜杠格式 `反对X/决定Y/理由Z` 残留。同时整体扫一遍有无任何残留矛盾/假绿/新引入问题。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:474:specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.json:22:      "issue": "S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:475:specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.json:23:      "recommendation": "把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。"
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:476:specs/m13-make-decision-v1/review/plan-review-prompt.md:17:6. 是否违反项目硬规则：薄核心窄契约、记录态非阻断（D5）、唯一硬门 S9、不自审自判。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:477:./tests/m13-make-decision.test.mjs:428:      content.includes("非阻断") ||
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:483:specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:484:specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:489:specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:490:specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:495:specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:499:specs/m13-make-decision-v1/review/plan-review-r3-prompt.md:13:逐条核 R2 的 12 findings 是否真修好（宪法21条对真实清单/S8含CONTEXT同步/FR-REVIEW-03三行留痕/盲审fallback失败语义/双路均空即停/grill artifact/metrics十core fields/cross-analyze五字段无假绿/FR-SCOPE-01/decision-log D1+开放问题/baseline注脚）。同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:500:specs/m13-make-decision-v1/review/plan-review-r5-prompt.md:17:同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:501:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:16:| 7 条自检清单 | 128-136 | 非阻断自检，便宜。含 Spec-Purity grep（纯事实粗筛）。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:502:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:505:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:506:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:507:specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:508:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:509:specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:516:specs/m13-make-decision-v1/review/plan-review-r2.md:27:| 3 | fixed | S4 已改为 `s4_baseline_recorded: true`，非阻断，不再写 confirmed。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:517:specs/m13-make-decision-v1/review/plan-review-r2.md:58:- 真实 F8 是“简单优先”，plan F8 写成“记录事实而非阻断”。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:518:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:23:| 4 | 7 条自检清单（全过才能触发审查） | 清单**合宪**；"才能触发"阻断味**违 Q1** | 保留自检，非阻断 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:519:specs/m13-make-decision-v1/review/plan-review-r6.md:55:### 记录态非阻断 / 唯一硬门 S9
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:521:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:522:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:523:specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:524:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:525:specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:538:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:540:specs/m13-make-decision-v1/reviews/build-code-phase-1.md:72:### 记录态非阻断 (非阻断门原则)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:541:specs/m13-make-decision-v1/reviews/build-code-phase-1.md:74:env var 表明确说明：路径不可达时"自动降级跳过 debate（skipped），记录 `debate_path_unavailable: true`"，明确是记录而非阻断。`MAKE_DECISION_SKIP_BLIND_REVIEW`、`MAKE_DECISION_SKIP_DEBATE` 均走跳过+记录路径。无硬拦截逻辑。**通过。**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:542:specs/m13-make-decision-v1/reviews/build-code-phase-1.md:146:- env var 表设计完整，6 个变量均有安全默认值、降级路径说明和 override 示例，符合宪法"记录态非阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:547:./tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:548:./tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:549:./tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:550:./tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:551:./tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:552:./tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:554:specs/m13-make-decision-v1/review/plan-review-r2-prompt.md:13:逐条核 R1 的 15 findings 是否真修好（尤其：12步统一含S0背景扎根+S0.5、lite只跳S1+S3不跳talk/盲审/grill、S4非阻断s4_baseline_recorded、S5盲审+debate门控/S6展示、台账原始需求落盘在S4后S5前、6个env var正确、宪法21条对齐真实清单无幻引、talk三轮S2/S4/S7、双路extra_sources>=3+get_sources停下、盲审5字段+FR-REVIEW-03、grill纯委托、T-final每task有FR回指、cross-analyze去假绿、metrics recordSkeleton+updateOwnResult、baseline 4列）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:555:specs/m13-make-decision-v1/review/plan-review-r2-prompt.md:15:同时查有无新引入的矛盾/假绿/遗漏。硬规则：薄核心窄契约、记录态非阻断(D5)、唯一硬门S9、不自审自判、不假绿不占位。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:556:tasks/m13b-build-spec-deepening/artifacts/s5-prompt-scope.md:8:1. 移植 7 个质保机制进 build-spec SKILL.md（异源审查、journal/evidence、spec-purity 扫描、7 自检、退出门、推进门、摩擦即记，全部合宪改造为非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:561:specs/m13-make-decision-v1/review/spec-review-r2.md:32:ID: F-02 | STATUS: PARTIALLY_CLOSED | EVIDENCE: spec.md 的 FR-ACCEPT-01 已改成"记录模式，非阻断"，并要求 S4 后直接进入 S5。问题是权威 decision-log.md 的 D6 仍写着"S4 后 S5 前，未确认挡住流程但非机器gate"，这仍和"S9 唯一 hard gate"冲突。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:562:specs/m13-make-decision-v1/review/spec-review-r2.md:82:| F-02 | blocking | PARTIALLY_CLOSED | spec 改为非阻断，但 decision-log.md D6 仍写"S4 未确认挡住流程"，权威文档矛盾未解 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:563:./specs/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:564:./specs/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:573:tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:19:- **维持**（甲方方向成立，乙方意见降级为非阻断备注）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:574:specs/m13-make-decision-v1/review/plan-review-r4-prompt.md:18:同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:577:specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:578:specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:579:./specs/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:580:./specs/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:588:specs/m13-make-decision-v1/stage-result-build-spec.json:7:    "spec_summary": "M13 make-decision 深化 spec：FR 覆盖 12 步流程（S0、S0.5、S1-S10）+ FR-RESEARCH-00/01/02/03 双路调研 + FR-REVIEW-01/02 三角度异源盲审 + FR-DEBATE 双调用点委托 debate 技能自判 + FR-TALK-01/02 + FR-GRILL-01 + FR-LEDGER 台账D28 + FR-ENV-01 六环境变量 + FR-METRIC + FR-DRAFT-01 + FR-ACCEPT-01/02/03 验收。全程记录态非阻断，唯一硬门 S9。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:589:specs/m13-make-decision-v1/tasks.md:108:### T010：实现 S4 方向设计 + talk#2 + 台账渲染点①（非阻断记录态）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:590:specs/m13-make-decision-v1/tasks.md:109:- **FR 映射**：FR-ACCEPT-01（S4 方向基线，非阻断），FR-TALK-01（talk#2），FR-LEDGER-01（渲染点①：original-context.md 在 S4 后 S5 前落盘）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:591:specs/m13-make-decision-v1/tasks.md:114:- **完成条件**：向用户展示方向摘要，问 Q2 收敛方向；用户回答后记 `s4_baseline_recorded: true`（非阻断，不等确认直接继续）；渲染点①写入 `make-decision-original-context.md`（原始需求逐条初始状态）；S5 依赖此文件存在，T011 depends T010
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:592:./specs/m12-build-plan-v1/constitution-check.md:16:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — cross-artifact-analyze 作为独立第三方技能扫描三产物（FR-XARTIFACT-001），加一次人审检查点（FR-REVIEW-001），决策 D-M12-5 明确引用"承接 F4 异源审查不卡死"，未设阻断式质量门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:593:./specs/m12-build-plan-v1/constitution-check.md:26:- [x] **Q1 记事实而非阻断** — 宪法检查结果"仅记录浮现供人审查，不因不达标阻断"（FR-CONSTITUTION-002），analyze 报告"仅记录不阻断"（FR-XARTIFACT-002），基线对照"不达标不阻断推进"（FR-BASELINE-002），与 F3/F4 一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:594:specs/m13-make-decision-v1/constitution-check.md:10:- [x] **F3 物理事实靠机器校验但不阻断** — metrics 写失败 warn 不 throw（FR-METRIC-01）；muyu get_sources 失败**立即停下报告用户等待指令**（FR-RESEARCH-01，非自动降级，已在 spec OPEN-1 解决）；两路均空记录 dual_research_empty 不阻断（FR-RESEARCH-03）。注：muyu 失败属"物理来源核实失败需人决策"，停下等人是 let-it-crash 原则，不违反非阻断原则（非阻断指不因质量判断阻断，不指掩盖数据缺失）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:595:specs/m13-make-decision-v1/constitution-check.md:11:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 三角度盲审走 3rd-review 异源链（FR-REVIEW-01），各 reviewer 独立，审查结果非阻断；debate 有条件触发非默认阻断；S9 是唯一人确认点。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:596:specs/m13-make-decision-v1/constitution-check.md:14:- [x] **F7 推进与不可逆操作不自动越过人** — S9 方向确认硬门控须用户明确回复"同意"才可落盘（FR-ACCEPT-02，唯一强制 gate）；S4 方向基线为记录模式非阻断检查点（FR-ACCEPT-01，已修正）；任何护城河跳过均有 journal 记录。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:597:specs/m13-make-decision-v1/constitution-check.md:21:- [x] **Q1 记事实而非阻断** — 台账驳回理由、blocking 留痕（FR-REVIEW-03）、muyu 失败标记均为记录性产物；所有护城河跳过时 journal 记录 skipped 而非报错阻断（隐性必达 1）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:598:./specs/m12-build-plan-v1/plan.md.handwritten.bak:78:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:599:./specs/m12-build-plan-v1/plan.md.handwritten.bak:101:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:600:specs/m13-make-decision-v1/spec.md:14:  2. 新增三角度异源盲审（3rd-review 链，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:601:specs/m13-make-decision-v1/spec.md:35:make-decision 是工作流第一阶段，决策质量直接决定后续所有阶段的价值。M13 继承 M7 已有 scope-triage 和 decision-log 不变，在其基础上增加五类护城河动作（D1–D5）并保证全程非阻断（D5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:602:specs/m13-make-decision-v1/spec.md:40:- 五类护城河动作均可独立触发和跳过（非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:603:specs/m13-make-decision-v1/spec.md:77:6. S4：talk-with-zhipeng 第 2 轮 + 方向基线确认（记录模式，非阻断对话检查点）+ 原始需求落盘
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:604:specs/m13-make-decision-v1/spec.md:91:**验收标准**：lite 档时 S1 和 S3 对应 journal 事件分别记录 `skipped: scope=lite`；full 档时 S1 必须执行；S3 仅在 S2/talk#1 门控外部调研为"需要"时执行，否则记录 `skipped: s2_gate=no_external_research` （非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:605:specs/m13-make-decision-v1/spec.md:108:- **失败行为**：若任一 sub-agent 失败，记录失败 agent ID 和原因到 `internal-research-summary.md` 中，继续执行其余 agents 的输出合并；若全部 agents 失败，记录 `s1_all_agents_failed: true`，继续推进到 S2（非阻断，告知用户内部调研失败原因）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:606:specs/m13-make-decision-v1/spec.md:296:### FR-ACCEPT-01：方向基线确认（S4，记录模式，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:607:specs/m13-make-decision-v1/spec.md:385:- **隐性必达 1**：所有护城河动作非阻断（跳过时 journal 有记录，不报错）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:608:specs/m13-make-decision-v1/spec.md:492:| FR-DEBATE-01/02: debate 条件门控 | >2 blocking 时缺乏升级机制 | 无 | 理论可绕（计数错），但非阻断低风险 | 低 | **保留** |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:616:./specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:617:./specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:620:./specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:621:./specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:622:./specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:623:./specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:628:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:629:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:635:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:868:+5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:640:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:921:+条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:648:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1083:   139	5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:653:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1136:   192	条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:658:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1159:   215	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:659:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1168:   224	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:660:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1427:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:661:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1428:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:662:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1430:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:663:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1433:tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:664:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1436:tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:665:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1439:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:666:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1452:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:667:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1456:workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:668:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1458:workflows/build-spec/SKILL.md:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:669:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1459:workflows/build-spec/SKILL.md:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:670:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1461:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:671:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1462:workflows/build-spec/SKILL.md:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:672:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1465:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:673:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1469:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:674:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1470:specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:675:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1472:specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:676:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1475:specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:677:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1477:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:678:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1479:specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:679:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1483:specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:680:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1484:specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:682:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1486:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:683:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1489:specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:684:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1491:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:685:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1492:specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:686:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1494:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:687:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1497:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:688:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1499:specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:689:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1500:specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:690:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1504:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:691:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:692:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1508:specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:693:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1509:specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:694:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1511:specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:695:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1513:specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:696:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1521:specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:697:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1524:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:698:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:699:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1527:specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:700:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:701:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1529:specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:702:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1533:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:703:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:704:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1536:specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:705:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:706:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1538:specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:707:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1543:specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:708:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1545:specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:710:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1561:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:714:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1586:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:715:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1588:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:718:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1633:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:719:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1634:specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:720:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:721:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1639:specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:722:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1640:specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:723:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1641:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:724:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1669:   238	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:725:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1687:   256	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:727:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1832:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:728:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1833:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:729:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1858:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:731:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1880:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:742:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1910:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:748:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1934:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:749:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1936:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:754:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1947:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:755:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:760:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2090:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:761:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2091:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:762:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2167:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:763:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2187:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:764:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2201:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:765:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2216:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:771:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2895:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:779:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2946:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:780:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2947:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:781:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:782:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:784:specs/m13-make-decision-v1/evidence/phase-2-notes.md:33:- **S1 非阻断**：全部 sub-agents 失败时记录 `s1_all_agents_failed: true` 并继续到 S2，不抛错不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:786:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:99:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:791:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:142:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:792:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:143:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:793:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:150:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:796:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:178:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:797:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:183:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:798:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:188:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:799:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:203:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:801:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:234:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:806:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:251:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:809:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:294:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:810:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:303:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:811:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:305:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:817:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:348:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:818:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:375:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:819:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:388:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:820:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:390:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:821:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:398:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:822:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:400:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:823:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:457:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:824:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:459:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:825:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:460:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:826:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:462:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:827:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:464:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:828:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:491:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:829:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:493:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:830:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:509:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:831:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:833:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:516:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:834:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:526:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:835:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:836:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:541:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:837:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:581:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:840:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:591:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:843:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:598:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:844:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:600:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:845:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:602:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:846:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:604:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:850:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:757:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:855:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:810:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:860:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:833:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:861:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:842:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:862:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:856:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:863:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:874:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:864:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:953:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:865:./specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:965:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:874:specs/archive/m9-verify-code/plan.md:40:| Q1 记事实而非阻断 | YES | anomaly_flags 浮现警告不 FAIL；metrics 写失败只 warn 不 throw |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:876:./specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:881:./specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:882:./specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:883:./specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:886:./specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:887:./specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:888:./specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:889:./specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:891:./specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:896:./specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:899:./specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:900:./specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:901:./specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:907:./specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:908:./specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:910:./specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:911:./specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:918:./specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:919:./specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:932:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:934:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:948:./specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:949:./specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:954:./specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:955:./specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:960:./specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:966:./CONSTITUTION.md:31:### F4 质量靠异源审查与人，而非阻断式质量门
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:967:./CONSTITUTION.md:82:### Q1 记事实而非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:970:./specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:971:./specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:972:./specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:973:./specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:974:./specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:990:specs/m13b-build-spec-deepening/cross-artifact-analysis.md:48:| G-01 | LOW | spec.md AC-20, AC-21 vs plan.md/tasks.md | spec.md 含 AC-20（Known Gaps 段可搜索）和 AC-21（行为验证场景格式覆盖）。plan.md Verification Mapping 未单独列出 AC-20/AC-21 的对应 Step（AC-20 隐含在 Step 1.2 / FR-STRUCTURE-002，AC-21 隐含在 Step 3.2 / FR-BEHAV-001/002）。 | id:G-01, type:coverage_gap, location:plan.md Verification Mapping, description:AC-20/AC-21 未显式在 Verification Mapping 中出现, suggested_action:可将 AC-20 加入 Step 1.2 行、AC-21 加入 Step 3.2 行；低优先级，功能覆盖已存在 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:992:./specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:993:./specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:994:./specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:995:./specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:996:./specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1003:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1004:specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1007:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1008:specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1009:specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1010:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1020:./specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1021:./specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1022:./specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/report-round-1.md:14:- [major] 位置: workflows/make-decision/SKILL.md:292 | 问题: S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。 | 建议: 把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1028:./specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.raw.json:22:      "issue": "S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1029:./specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.raw.json:23:      "recommendation": "把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。"
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1038:./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1040:./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1041:./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1049:./specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.json:22:      "issue": "S5 source_family 冲突处理语义不一致。文档同时说“fallback_used:true 视为该角度审查失败、结果不进合并、立即停下报告用户”，又在开头声明 S9 是唯一硬门、其余步骤失败非阻断或仅输入不可用才致命停止。这里会让执行者不知道 S5 冲突到底是用户等待、致命停止，还是可继续降级。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1050:./specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/verdict-round-1.json:23:      "recommendation": "把 S5 source_family 冲突归入一个明确类别：要么是致命输入停止并写固定 journal 事件，要么是非阻断失败并继续；不要同时使用“停下报告用户”和“其余失败继续推进”。"
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1058:./tasks/m13b-build-spec-deepening/scope-decision.md:40:### D-M13b-3：spec-reviewer 触发条件 = 可选、非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1059:./tasks/m13b-build-spec-deepening/scope-decision.md:61:| spec-reviewer（M0 ref） | 新建 | 独立子代理，非阻断 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1060:./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1061:./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1062:./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report.md:8:第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1063:./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report.md:16:- [major] 位置: spec.md:323 | 问题: FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。 | 建议: 明确：`[ ]` 不符合项不阻断；但 21 条缺失、无状态、无判据属于检查产物无效，应使 build-plan 失败。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1064:./tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1065:./tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1066:./tasks/m12-build-plan-v1/decision-log.md:73:- **理由链**：M11 D-M11-7 路由表明确 speckit-analyze 留 M12。analyze 天然只读非破坏，符合"记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1068:./tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1070:./tasks/m13b-build-spec-deepening/decision-log.md:28:- **D4（审查恢复修正）**【修正 2026-06-30，Hugh 授权】：原降级基于错误前提——将「异源独立审查」误当成「3 个不同 source_family 各审一角度」的高成本机制。事实是 agenthub design 原审查 = 单一异源引擎（如 codex）的 3rd-review 独立审查，workflowhub 现有 3rd-review 基础设施可直接复用，成本仅一次异源调用。**恢复为 B=真·异源独立审查：复用现有 3rd-review（单一异源引擎），产出 verdict+findings，记入质量事实契约第 3 项，非阻断（记录+浮现+人判断）。不做 3 source_family 多重审查（过度工程，Hugh 从未要求）。单一异源满足宪法独立裁决最小要求。**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1072:./tasks/m13b-build-spec-deepening/decision-log.md:60:- 审查机制为真·异源独立审查（复用现有 3rd-review，单一异源引擎），结论记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1085:./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1087:./specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1090:./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report-round-3.md:8:第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1091:./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/report-round-3.md:16:- [major] 位置: spec.md:323 | 问题: FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。 | 建议: 明确：`[ ]` 不符合项不阻断；但 21 条缺失、无状态、无判据属于检查产物无效，应使 build-plan 失败。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1099:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:608:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1100:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:618:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1101:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1101:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1102:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1102:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1103:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1406:    36	- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1104:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1416:    46	- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1105:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1902:   328	    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1106:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:1903:   329	    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1107:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2566:   328	    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1108:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2567:   329	    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1109:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2630:specs/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1110:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2634:specs/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1111:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2692:specs/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1112:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2693:specs/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1113:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2760:    36	- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1114:./tasks/m12-build-plan-v1/review/codex-raw-output.txt:2770:    46	- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1115:./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.raw.json:36:      "issue": "FR-CONSTITUTION-002 说 checklist 不达标不阻断；FR-CONSTITUTION-003 说未产出完整勾选结果验收失败。与 analyze 类似，缺少“检查结果不达标”和“检查产物不完整”的显式边界，执行者可能把缺条也当成非阻断。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1116:./tasks/m12-build-plan-v1/review-build-spec-r2/tasks/spec-20260629T000102Z-de524a/reviews/verdict-round-3.raw.json:47:  "resolutionSummary": "第 3 轮规格已补强大部分前轮问题，但仍有 6 处需要修改，核心是 `--stage N` 精确语义、人审 pending 转换规则，以及非阻断检查与产物失败之间的边界。建议修正后再进入实现。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1117:./specs/m13-make-decision-v1/plan.md:11:将 `skills/make-decision/SKILL.md` 从 M7 的两步骤（scope-triage + decision-log）全面重写为带五类护城河动作的 12 步流程（S0、S0.5、S1–S10）。新增：S0 背景扎根、S0.5 scope-triage(分档 lite/full)、S1 内部调研（full档专属）、S2/S4/S7 三轮 talk 交互、S3 双路外部调研、S5 三角度异源盲审+第一次debate门控、S6 展示盲审/debate结果给用户、S7 talk#3→grill→draft→orchestrator→第二次debate门控、S8 台账渲染、S9 用户批准（唯一硬门）、S10 decision-log 落盘。所有步骤均为记录态非阻断，S9 是唯一强制等待点。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1118:./specs/m13-make-decision-v1/plan.md:37:| **F4 质量靠异源审查与人而非阻断式质量门** | [x] | 盲审（S5 三角度异源 3rd-review）、debate（S5/S7 门控）、S9 用户确认均为质量机制；无任何自动化阻断 gate（S9 唯一硬门且需人确认）。|
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1119:./specs/m13-make-decision-v1/plan.md:38:| **F5 gate谨慎添加出事再补无用则移除** | [x] | 全流程仅 S9 一个 gate（人工确认），其余检查点均为记录态非阻断；F10 Gate 章节对每个机制逐条过四问，零冗余机制。|
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1120:./specs/m13-make-decision-v1/plan.md:44:| **Q1 记事实而非阻断** | [x] | 所有失败/跳过路径（s1_all_agents_failed、debate_1: skipped、debate_triggered_invalid 等）均记录事实到 journal，继续推进，不阻断。|
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1121:./specs/m13-make-decision-v1/plan.md:150:**Step 2.6 — S4 方向设计 + talk#2（非阻断，记录态）**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1122:./specs/m13-make-decision-v1/plan.md:153:- 动作：向用户展示方向摘要，问 Q2 收敛方向；用户回答后记 `s4_baseline_recorded: true`（非阻断，不等确认即继续）；渲染点①：写 `artifacts/make-decision-original-context.md`（原始需求逐条初始状态），此文件落盘后 S5 方可执行
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1123:./specs/m13-make-decision-v1/plan.md:245:| FR-ACCEPT-01 S4 方向基线记录（非阻断） | 带错方向进入高成本盲审 | 无 S5 前检查点 | 可跳过（非代码门），记录态继续 | 低 | **保留** |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1124:./specs/m13-make-decision-v1/plan.md:267:| Step 2.6 S4 + talk#2 + 渲染点① | FR-ACCEPT-01, FR-TALK-01, FR-LEDGER-01 | `s4_baseline_recorded: true`（非阻断）；original-context.md 在 S5 前落盘 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1127:./specs/m13-make-decision-v1/reviews/build-code-phase-1.md:72:### 记录态非阻断 (非阻断门原则)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1128:./specs/m13-make-decision-v1/reviews/build-code-phase-1.md:74:env var 表明确说明：路径不可达时"自动降级跳过 debate（skipped），记录 `debate_path_unavailable: true`"，明确是记录而非阻断。`MAKE_DECISION_SKIP_BLIND_REVIEW`、`MAKE_DECISION_SKIP_DEBATE` 均走跳过+记录路径。无硬拦截逻辑。**通过。**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1129:./specs/m13-make-decision-v1/reviews/build-code-phase-1.md:146:- env var 表设计完整，6 个变量均有安全默认值、降级路径说明和 override 示例，符合宪法"记录态非阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1138:./specs/m13-make-decision-v1/review/plan-review-r4.md:112:- S9 仍是唯一 hard gate；S4 为记录态非阻断；未发现新增 blocking gate。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1139:specs/archive/m7-intake-v1/spec.md:244:- **隐性必达 4**：宪法保持 21 条、F10 在册，既有运行时非阻断提醒（protected-paths）不破坏。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1146:./specs/m13-make-decision-v1/review/plan-review-r1.md:81:S4 被 plan/tasks 写成等待用户确认的 gate，违反上游 spec 和“唯一硬门 S9”规则。spec 明确要求 S4 是“记录模式，非阻断”，展示方向基线后直接推进到 S5，不等待显式确认；journal 事件应为 `s4_baseline_recorded: true`，不是 `s4_baseline_confirmed: true`。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1147:./specs/m13-make-decision-v1/review/plan-review-r1.md:294:- S4 非阻断被 plan/tasks 改成确认 gate
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1148:./specs/m13-make-decision-v1/review/plan-review-r1.md:346:当前 plan/tasks 不是小修即可放行。必须先修正 12 步命名、lite/full 路由、S4 非阻断、S5/S6 分工、台账渲染时机、env var 清单、宪法检查和 cross-analysis 假绿问题。修完后应重新执行 build-plan 的 spec-plan/spec-tasks/spec-analyze 三步，确保三产物同步。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1151:./specs/m13-make-decision-v1/review/plan-review-r6-prompt.md:13:核 R5 的 1 minor 是否真修好：cross-analyze B5 追溯说明已用新格式「反对 X：/决定 Y：/理由 Z：」且已解决列点名全链路(spec/plan/tasks/decision-log D6/T016)，全仓 artifacts 无旧斜杠格式 `反对X/决定Y/理由Z` 残留。同时整体扫一遍有无任何残留矛盾/假绿/新引入问题。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1154:./specs/m13b-build-spec-deepening/cross-artifact-analysis.md:48:| G-01 | LOW | spec.md AC-20, AC-21 vs plan.md/tasks.md | spec.md 含 AC-20（Known Gaps 段可搜索）和 AC-21（行为验证场景格式覆盖）。plan.md Verification Mapping 未单独列出 AC-20/AC-21 的对应 Step（AC-20 隐含在 Step 1.2 / FR-STRUCTURE-002，AC-21 隐含在 Step 3.2 / FR-BEHAV-001/002）。 | id:G-01, type:coverage_gap, location:plan.md Verification Mapping, description:AC-20/AC-21 未显式在 Verification Mapping 中出现, suggested_action:可将 AC-20 加入 Step 1.2 行、AC-21 加入 Step 3.2 行；低优先级，功能覆盖已存在 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1155:./specs/m13-make-decision-v1/spec.md:14:  2. 新增三角度异源盲审（3rd-review 链，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1156:./specs/m13-make-decision-v1/spec.md:35:make-decision 是工作流第一阶段，决策质量直接决定后续所有阶段的价值。M13 继承 M7 已有 scope-triage 和 decision-log 不变，在其基础上增加五类护城河动作（D1–D5）并保证全程非阻断（D5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1157:./specs/m13-make-decision-v1/spec.md:40:- 五类护城河动作均可独立触发和跳过（非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1158:./specs/m13-make-decision-v1/spec.md:77:6. S4：talk-with-zhipeng 第 2 轮 + 方向基线确认（记录模式，非阻断对话检查点）+ 原始需求落盘
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1159:./specs/m13-make-decision-v1/spec.md:91:**验收标准**：lite 档时 S1 和 S3 对应 journal 事件分别记录 `skipped: scope=lite`；full 档时 S1 必须执行；S3 仅在 S2/talk#1 门控外部调研为"需要"时执行，否则记录 `skipped: s2_gate=no_external_research` （非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1160:./specs/m13-make-decision-v1/spec.md:108:- **失败行为**：若任一 sub-agent 失败，记录失败 agent ID 和原因到 `internal-research-summary.md` 中，继续执行其余 agents 的输出合并；若全部 agents 失败，记录 `s1_all_agents_failed: true`，继续推进到 S2（非阻断，告知用户内部调研失败原因）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1161:./specs/m13-make-decision-v1/spec.md:296:### FR-ACCEPT-01：方向基线确认（S4，记录模式，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1162:./specs/m13-make-decision-v1/spec.md:385:- **隐性必达 1**：所有护城河动作非阻断（跳过时 journal 有记录，不报错）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1163:./specs/m13-make-decision-v1/spec.md:492:| FR-DEBATE-01/02: debate 条件门控 | >2 blocking 时缺乏升级机制 | 无 | 理论可绕（计数错），但非阻断低风险 | 低 | **保留** |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1164:./tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:16:| 7 条自检清单 | 128-136 | 非阻断自检，便宜。含 Spec-Purity grep（纯事实粗筛）。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1165:./tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1166:./specs/m13-make-decision-v1/review/plan-review-prompt.md:17:6. 是否违反项目硬规则：薄核心窄契约、记录态非阻断（D5）、唯一硬门 S9、不自审自判。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1167:./specs/m13-make-decision-v1/review/plan-review-r3-prompt.md:13:逐条核 R2 的 12 findings 是否真修好（宪法21条对真实清单/S8含CONTEXT同步/FR-REVIEW-03三行留痕/盲审fallback失败语义/双路均空即停/grill artifact/metrics十core fields/cross-analyze五字段无假绿/FR-SCOPE-01/decision-log D1+开放问题/baseline注脚）。同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1168:./tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:23:| 4 | 7 条自检清单（全过才能触发审查） | 清单**合宪**；"才能触发"阻断味**违 Q1** | 保留自检，非阻断 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1169:./specs/m13-make-decision-v1/review/plan-review-r5-prompt.md:17:同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1170:./tasks/m13b-build-spec-deepening/artifacts/s5-prompt-scope.md:8:1. 移植 7 个质保机制进 build-spec SKILL.md（异源审查、journal/evidence、spec-purity 扫描、7 自检、退出门、推进门、摩擦即记，全部合宪改造为非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1171:./tasks/m12-build-plan-v1/plan-tasks-review-package.md:81:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1172:./tasks/m12-build-plan-v1/plan-tasks-review-package.md:104:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1173:./specs/m13-make-decision-v1/review/plan-review-r2.md:27:| 3 | fixed | S4 已改为 `s4_baseline_recorded: true`，非阻断，不再写 confirmed。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1174:./specs/m13-make-decision-v1/review/plan-review-r2.md:58:- 真实 F8 是“简单优先”，plan F8 写成“记录事实而非阻断”。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1175:./specs/m13-make-decision-v1/constitution-check.md:10:- [x] **F3 物理事实靠机器校验但不阻断** — metrics 写失败 warn 不 throw（FR-METRIC-01）；muyu get_sources 失败**立即停下报告用户等待指令**（FR-RESEARCH-01，非自动降级，已在 spec OPEN-1 解决）；两路均空记录 dual_research_empty 不阻断（FR-RESEARCH-03）。注：muyu 失败属"物理来源核实失败需人决策"，停下等人是 let-it-crash 原则，不违反非阻断原则（非阻断指不因质量判断阻断，不指掩盖数据缺失）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1176:./specs/m13-make-decision-v1/constitution-check.md:11:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 三角度盲审走 3rd-review 异源链（FR-REVIEW-01），各 reviewer 独立，审查结果非阻断；debate 有条件触发非默认阻断；S9 是唯一人确认点。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1177:./specs/m13-make-decision-v1/constitution-check.md:14:- [x] **F7 推进与不可逆操作不自动越过人** — S9 方向确认硬门控须用户明确回复"同意"才可落盘（FR-ACCEPT-02，唯一强制 gate）；S4 方向基线为记录模式非阻断检查点（FR-ACCEPT-01，已修正）；任何护城河跳过均有 journal 记录。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1178:./specs/m13-make-decision-v1/constitution-check.md:21:- [x] **Q1 记事实而非阻断** — 台账驳回理由、blocking 留痕（FR-REVIEW-03）、muyu 失败标记均为记录性产物；所有护城河跳过时 journal 记录 skipped 而非报错阻断（隐性必达 1）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1179:./specs/m13-make-decision-v1/review/plan-review-r4-prompt.md:18:同时扫新引入矛盾。硬规则：记录态非阻断(D5)/唯一硬门S9/薄核心窄契约/不假绿不占位。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1180:./specs/m13-make-decision-v1/review/plan-review-r6.md:55:### 记录态非阻断 / 唯一硬门 S9
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1181:./specs/m13-make-decision-v1/tasks.md:108:### T010：实现 S4 方向设计 + talk#2 + 台账渲染点①（非阻断记录态）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1182:./specs/m13-make-decision-v1/tasks.md:109:- **FR 映射**：FR-ACCEPT-01（S4 方向基线，非阻断），FR-TALK-01（talk#2），FR-LEDGER-01（渲染点①：original-context.md 在 S4 后 S5 前落盘）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1183:./specs/m13-make-decision-v1/tasks.md:114:- **完成条件**：向用户展示方向摘要，问 Q2 收敛方向；用户回答后记 `s4_baseline_recorded: true`（非阻断，不等确认直接继续）；渲染点①写入 `make-decision-original-context.md`（原始需求逐条初始状态）；S5 依赖此文件存在，T011 depends T010
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1184:./specs/m13-make-decision-v1/review/plan-review-r2-prompt.md:13:逐条核 R1 的 15 findings 是否真修好（尤其：12步统一含S0背景扎根+S0.5、lite只跳S1+S3不跳talk/盲审/grill、S4非阻断s4_baseline_recorded、S5盲审+debate门控/S6展示、台账原始需求落盘在S4后S5前、6个env var正确、宪法21条对齐真实清单无幻引、talk三轮S2/S4/S7、双路extra_sources>=3+get_sources停下、盲审5字段+FR-REVIEW-03、grill纯委托、T-final每task有FR回指、cross-analyze去假绿、metrics recordSkeleton+updateOwnResult、baseline 4列）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1185:./specs/m13-make-decision-v1/review/plan-review-r2-prompt.md:15:同时查有无新引入的矛盾/假绿/遗漏。硬规则：薄核心窄契约、记录态非阻断(D5)、唯一硬门S9、不自审自判、不假绿不占位。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1186:./specs/m13-make-decision-v1/review/spec-review-r2.md:32:ID: F-02 | STATUS: PARTIALLY_CLOSED | EVIDENCE: spec.md 的 FR-ACCEPT-01 已改成"记录模式，非阻断"，并要求 S4 后直接进入 S5。问题是权威 decision-log.md 的 D6 仍写着"S4 后 S5 前，未确认挡住流程但非机器gate"，这仍和"S9 唯一 hard gate"冲突。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1187:./specs/m13-make-decision-v1/review/spec-review-r2.md:82:| F-02 | blocking | PARTIALLY_CLOSED | spec 改为非阻断，但 decision-log.md D6 仍写"S4 未确认挡住流程"，权威文档矛盾未解 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1188:./specs/archive/m9-verify-code/plan.md:40:| Q1 记事实而非阻断 | YES | anomaly_flags 浮现警告不 FAIL；metrics 写失败只 warn 不 throw |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1190:./tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:19:- **维持**（甲方方向成立，乙方意见降级为非阻断备注）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1191:./specs/m13-make-decision-v1/evidence/phase-2-notes.md:33:- **S1 非阻断**：全部 sub-agents 失败时记录 `s1_all_agents_failed: true` 并继续到 S2，不抛错不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1192:specs/archive/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1193:specs/archive/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1194:specs/archive/m12-build-plan-v1/constitution-check.md:16:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — cross-artifact-analyze 作为独立第三方技能扫描三产物（FR-XARTIFACT-001），加一次人审检查点（FR-REVIEW-001），决策 D-M12-5 明确引用"承接 F4 异源审查不卡死"，未设阻断式质量门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1195:specs/archive/m12-build-plan-v1/constitution-check.md:26:- [x] **Q1 记事实而非阻断** — 宪法检查结果"仅记录浮现供人审查，不因不达标阻断"（FR-CONSTITUTION-002），analyze 报告"仅记录不阻断"（FR-XARTIFACT-002），基线对照"不达标不阻断推进"（FR-BASELINE-002），与 F3/F4 一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1196:specs/archive/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1197:specs/archive/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1198:specs/archive/m6-five-stage-skeleton/spec.md:38:agenthub 的 vibecoding workflow 有成熟的五段提示词（intake/design/plan/apply/test-acceptance），但与运行时 gate 深度耦合。workflowhub 已立宪法 F4（质量靠异源审查+人，非阻断质量门）和 F10（自动化按真实收益，不为"机器可校验"本身堆基建），并已删除 check-path-guard CI 护栏、把 findViolation 解耦进 core/protected-paths.mjs 作运行时非阻断提醒（commit 7453d4b，已在 main）。M3 已定窄契约 stage-result，M4 已有指标系统与 check-stage-quality.mjs 扫描器。本期在这些基础上建五段骨架。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1199:specs/archive/m6-five-stage-skeleton/spec.md:256:- **隐性必达 4**：宪法保持 21 条、F10 在册、check-path-guard 已删且 core/protected-paths.mjs 运行时非阻断提醒在位（既有状态，本期不得破坏）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1200:specs/archive/m6-five-stage-skeleton/spec.md:276:- [ ] **AC12**：宪法 F10 在册（21 条），check-path-guard 已删且运行时非阻断提醒保留。← 隐性必达 4
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1201:specs/archive/m6-five-stage-skeleton/spec.md:289:- **不受影响**：agenthub 全部现有功能（本期零改动）；workflowhub 宪法（保持 21 条不变）；既有运行时非阻断提醒（protected-paths）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1202:specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:102:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1203:specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:111:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1204:specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:125:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1205:specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:143:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1206:./specs/archive/m7-intake-v1/spec.md:244:- **隐性必达 4**：宪法保持 21 条、F10 在册，既有运行时非阻断提醒（protected-paths）不破坏。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1207:specs/archive/m8-build-code/plan.md:41:| Q1 记事实而非阻断 | YES | 假绿浮现、越界浮现，均不 block 推进 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1208:specs/archive/m6-five-stage-skeleton/plan.md:11:- 已有基建：CONSTITUTION.md（21 条，含 F4/F10）、contracts/stage-result.contract.json（facts 开放 object）、config/workflowhub.yaml（registry + metrics_path）、scripts/check-stage-quality.mjs（指标质量扫描器，344 行）、core/protected-paths.mjs（运行时非阻断提醒）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1209:specs/archive/m6-five-stage-skeleton/plan.md:20:- F4 质量靠异源审查+人非阻断门：YES — 不引运行时质量 gate，质量靠 plan/design-review + 人。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1210:./tasks/m13-make-decision-v1/review/codex-review-prompt.md:19:2. 方向盲审（blind review）——复用 3rd-review skill，异源，非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1211:./tasks/m13-make-decision-v1/review/codex-review-prompt.md:23:全部非阻断（D5），唯一 hard gate 是 S9 用户明确批准。"
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1212:./tasks/m13-make-decision-v1/review/codex-review-prompt.md:83:理由: workflowhub 无既有业务 env 惯例，所有 env 透传外部 skill 已有约定，不引入新惯例；可选+安全默认保证 D5 非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1213:./tasks/m13-make-decision-v1/review/codex-review-prompt.md:86:来源证据: tasks/m13-make-decision-v1/research/env-var-design.md §env-var清单全节 + §设计原则；D5 CONSTITUTION 非阻断原则
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1214:./tasks/m13-make-decision-v1/review/codex-review-prompt.md:93:理由: 宪法 D5 记录事实而非阻断；quality 靠独立审查和人确认，不靠自动机器 gate；台账无静默踢出防止需求被悄悄丢弃
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1215:./tasks/m13-make-decision-v1/review/codex-review-prompt.md:96:来源证据: make-decision-flow-aligned.md §横切质量机制表；原始 intake.md 各条；CONSTITUTION.md D5 非阻断原则
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1216:./tasks/m13-make-decision-v1/review/codex-review-prompt.md:174:2. 方向盲审（blind review）via 3rd-review, 异源, 非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1217:./specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:102:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1218:./specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:111:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1219:./specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:125:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1220:./specs/archive/m11-build-spec-v1/reviews/phase-3-prompt.md:143:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1221:./tasks/m13-make-decision-v1/stage-result-make-decision.json:6:    "decision": "M13 深化 make-decision 为 12 步流程（S0、S0.5、S1-S10）：背景扎根→scope-triage→内部调研→talk#1门控外部→条件性双路调研(muyu-search-mcp+anysearch,返空即停)→talk#2收敛+方向基线确认→三角度异源盲审(3rd-review)+第一次debate调用点→给用户看→talk#3→grill→草稿→orchestrator审查+第二次debate调用点→同步CONTEXT/ADR→S9用户批准→落盘。全部非阻断(D5)，debate触发判断和五方法庭/单人三档模式委托 /Users/Hugh/Hugh/Project/debate 技能 Step 1，make-decision 只做skip/path/call/read verdict薄编排，唯一hard gate=S9。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1222:specs/archive/m5-quality-mechanism/plan.md:33:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**：CI 扫描守零，非自动阻断，符合。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1223:specs/archive/m5-quality-mechanism/plan.md:39:- [x] **Q1 记事实而非阻断**：FR-FACT-003 / FR-GATE-002 明确只记不挡，符合。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1224:./specs/archive/m5-quality-mechanism/plan.md:33:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**：CI 扫描守零，非自动阻断，符合。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1225:./specs/archive/m5-quality-mechanism/plan.md:39:- [x] **Q1 记事实而非阻断**：FR-FACT-003 / FR-GATE-002 明确只记不挡，符合。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1226:./tasks/m13-make-decision-v1/decision-log.md:16:> 2. 方向盲审（blind review）——复用 3rd-review skill，异源，非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1227:./tasks/m13-make-decision-v1/decision-log.md:20:> 全部非阻断（D5），唯一 hard gate 是 S9 用户明确批准。"
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1228:./tasks/m13-make-decision-v1/decision-log.md:106:| 理由 | workflowhub 无既有业务 env 惯例，所有 env 透传外部 skill 已有约定，不引入新惯例；可选+安全默认保证 D5 非阻断 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1229:./tasks/m13-make-decision-v1/decision-log.md:109:| 来源证据 | `tasks/m13-make-decision-v1/research/env-var-design.md` §env-var清单全节 + §设计原则；D5 CONSTITUTION 非阻断原则 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1230:./tasks/m13-make-decision-v1/decision-log.md:121:| 理由 | 宪法 D5 "记录事实而非阻断"；quality 靠独立审查和人确认，不靠自动机器 gate；台账无静默踢出防止需求被悄悄丢弃 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1231:./tasks/m13-make-decision-v1/decision-log.md:124:| 来源证据 | `tasks/m13-make-decision-v1/research/make-decision-flow-aligned.md` §横切质量机制表；原始 intake.md D28台账/方向基线确认衔接点/三角度输入隔离/防漏阀留痕/新想法回退判定D15/双路返空即停/交互简洁各条；CONSTITUTION.md D5 非阻断原则 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1232:specs/archive/m11-build-spec-v1/plan.md:43:| Q1 记事实而非阻断 | YES | 宪法检查不达标仅浮现不阻断；baseline 对照阈值人拍、不达标不阻断；metrics 写失败只 warn |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1233:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:110:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1234:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:119:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1235:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:133:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1236:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:151:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1237:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:301:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1238:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:310:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1239:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:324:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1240:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:342:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1241:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:571:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1242:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:580:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1243:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:594:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1244:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:612:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1245:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:110:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1246:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:119:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1247:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:133:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1248:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:151:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1249:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:301:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1250:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:310:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1251:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:324:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1252:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:342:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1253:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:571:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1254:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:580:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1255:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:594:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1256:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r1.md:612:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1257:specs/archive/m11-build-spec-v1/reviews/phase-3.diff:60:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1258:specs/archive/m11-build-spec-v1/reviews/phase-3.diff:69:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1259:specs/archive/m11-build-spec-v1/reviews/phase-3.diff:83:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1260:specs/archive/m11-build-spec-v1/reviews/phase-3.diff:101:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1261:./specs/m13-make-decision-v1/stage-result-build-spec.json:7:    "spec_summary": "M13 make-decision 深化 spec：FR 覆盖 12 步流程（S0、S0.5、S1-S10）+ FR-RESEARCH-00/01/02/03 双路调研 + FR-REVIEW-01/02 三角度异源盲审 + FR-DEBATE 双调用点委托 debate 技能自判 + FR-TALK-01/02 + FR-GRILL-01 + FR-LEDGER 台账D28 + FR-ENV-01 六环境变量 + FR-METRIC + FR-DRAFT-01 + FR-ACCEPT-01/02/03 验收。全程记录态非阻断，唯一硬门 S9。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1262:./specs/archive/m12-build-plan-v1/spec.md:328:    - **rejected**：人给出确认拒绝后，`review.state="rejected"`，stage-result 正常产出，`status="failure"`，`reason` 记录拒绝原因。此为事实记录，非阻断门——拒绝后由人决定是否重跑，系统不自闭。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1263:./specs/archive/m12-build-plan-v1/spec.md:329:    - **no-response → pending 转换条件**：满足以下任一条件时，不再等待确认，立即记录 `review.state="pending"` 并继续产出 stage-result（不可缺省 stage-result）——（a）运行环境为非交互式（stdin 不可读、无终端），无法采集人工输入；（b）执行者在停顿提示后明确输入"跳过/skip"或等效指令，放弃本次确认；（c）停顿超过与具体 runtime 无关的合理时限后仍未收到确认（时限由执行者自行把握，不在 spec 中硬编码）。`pending` 标注"检查点已触达但未获确认"这一事实，符合 F9 "缺数据如实标未知而非假绿" 和 Q1 "记录事实而非阻断"。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1264:./tasks/m13-make-decision-v1/research/env-var-design.md:16:- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`：启用五方法庭对抗模式。**不设置时自动降级为单人三档模式**，非阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1265:./tasks/m13-make-decision-v1/research/env-var-design.md:56:| `MAKE_DECISION_SKIP_BLIND_REVIEW` | 设为 `1` 跳过盲审（非阻断标志，调试 / 离线环境用） | 未设置（正常执行） | blind-review action | 否 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1266:./specs/archive/m12-build-plan-v1/plan.md:36:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。人审检查点（FR-REVIEW-001）在产物生成后停顿等人确认；3rd-review 保持外部依赖不替代。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1267:./specs/archive/m12-build-plan-v1/plan.md:46:- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。宪法检查勾选结果、analyze 报告、baseline 对照均只记录浮现，不因不达标阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1268:specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:103:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1269:specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:112:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1270:specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:126:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1271:specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:144:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1272:specs/archive/m11-build-spec-v1/constitution-check.md:18:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。build-spec v1 流程含一次人审检查点（§7 HUMAN_REVIEW_CHECKPOINT），要求人在宪法检查/baseline 对照/F10 gate 完成后确认，不自动推进。宪法符合性检查本身是"记录采集"而非阻断门。spec-specify 的质量检查清单（checklists/requirements.md）是自检工具但不阻断。未引入阻断式 CI gate 或 pre-commit hook。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1273:specs/archive/m11-build-spec-v1/constitution-check.md:34:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。宪法检查结果只记录浮现（`[ ]` 附判据视为有效输出，不阻断 stage-result 成功）。baseline 对照结果只记录浮现（不达标不阻断推进）。metrics 写失败只 warn 不 throw（"metrics write failure must not undo a successful stage completion"）。FR-CONSTITUTION-002 明确"checklist 不达标而阻断 build-spec 后续推进"为禁止行为。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1274:./specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:103:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1275:./specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:112:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1276:./specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:126:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1277:./specs/archive/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:144:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1278:./specs/archive/m11-build-spec-v1/constitution-check.md:18:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。build-spec v1 流程含一次人审检查点（§7 HUMAN_REVIEW_CHECKPOINT），要求人在宪法检查/baseline 对照/F10 gate 完成后确认，不自动推进。宪法符合性检查本身是"记录采集"而非阻断门。spec-specify 的质量检查清单（checklists/requirements.md）是自检工具但不阻断。未引入阻断式 CI gate 或 pre-commit hook。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1279:./specs/archive/m11-build-spec-v1/constitution-check.md:34:- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。宪法检查结果只记录浮现（`[ ]` 附判据视为有效输出，不阻断 stage-result 成功）。baseline 对照结果只记录浮现（不达标不阻断推进）。metrics 写失败只 warn 不 throw（"metrics write failure must not undo a successful stage completion"）。FR-CONSTITUTION-002 明确"checklist 不达标而阻断 build-spec 后续推进"为禁止行为。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1280:./specs/archive/m8-build-code/plan.md:41:| Q1 记事实而非阻断 | YES | 假绿浮现、越界浮现，均不 block 推进 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1281:specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:62:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1282:specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:71:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1283:specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:85:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1284:specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:103:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1285:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:111:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1286:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:120:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1287:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:134:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1288:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:152:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1289:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:319:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1290:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:328:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1291:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:342:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1292:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:360:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1293:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:578:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1294:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:587:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1295:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:601:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1296:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:619:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1297:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:962:    48	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1298:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:971:    57	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1299:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:985:    71	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1300:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1003:    89	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1301:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1142:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1302:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1151:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1303:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1165:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1304:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1183:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1305:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1260:    12	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。→ [CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门](CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1306:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1270:    22	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。→ [CONSTITUTION.md#q1-记事实而非阻断](CONSTITUTION.md#q1-记事实而非阻断)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1307:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1436:./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:125:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1308:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1462:./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:126:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1309:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1562:./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:85:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1310:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1627:./specs/m11-build-spec-v1/reviews/phase-3.diff:83:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1311:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1971:./workflows/build-spec/SKILL.md:71:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1312:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:2147:./specs/archive/m6-five-stage-skeleton/plan.md:11:- 已有基建：CONSTITUTION.md（21 条，含 F4/F10）、contracts/stage-result.contract.json（facts 开放 object）、config/workflowhub.yaml（registry + metrics_path）、scripts/check-stage-quality.mjs（指标质量扫描器，344 行）、core/protected-paths.mjs（运行时非阻断提醒）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1313:specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:2179:./specs/archive/m6-five-stage-skeleton/spec.md:38:agenthub 的 vibecoding workflow 有成熟的五段提示词（intake/design/plan/apply/test-acceptance），但与运行时 gate 深度耦合。workflowhub 已立宪法 F4（质量靠异源审查+人，非阻断质量门）和 F10（自动化按真实收益，不为"机器可校验"本身堆基建），并已删除 check-path-guard CI 护栏、把 findViolation 解耦进 core/protected-paths.mjs 作运行时非阻断提醒（commit 7453d4b，已在 main）。M3 已定窄契约 stage-result，M4 已有指标系统与 check-stage-quality.mjs 扫描器。本期在这些基础上建五段骨架。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1314:./specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:62:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1315:./specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:71:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1316:./specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:85:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1317:./specs/archive/m11-build-spec-v1/reviews/phase-3-r2.diff:103:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1318:./specs/archive/m11-build-spec-v1/reviews/phase-3.diff:60:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1319:./specs/archive/m11-build-spec-v1/reviews/phase-3.diff:69:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1320:./specs/archive/m11-build-spec-v1/reviews/phase-3.diff:83:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1321:./specs/archive/m11-build-spec-v1/reviews/phase-3.diff:101:+- **Thresholds are set by humans, not by this stage.** Non-compliance with any baseline threshold does NOT block progression — per F3 (物理事实不阻断推进) and Q1 (记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1322:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:111:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1323:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:120:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1324:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:134:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1325:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:152:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1326:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:319:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1327:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:328:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1328:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:342:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1329:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:360:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1330:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:578:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1331:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:587:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1332:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:601:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1333:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:619:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1334:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:962:    48	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1335:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:971:    57	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1336:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:985:    71	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1337:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1003:    89	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1338:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1142:+- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1339:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1151:+- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1340:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1165:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1341:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1183:+- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1342:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1260:    12	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。→ [CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门](CONSTITUTION.md#f4-质量靠异源审查与人而非阻断式质量门)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1343:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1270:    22	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。→ [CONSTITUTION.md#q1-记事实而非阻断](CONSTITUTION.md#q1-记事实而非阻断)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1344:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1436:./specs/m11-build-spec-v1/reviews/phase-3-prompt.md:125:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1345:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1462:./specs/m11-build-spec-v1/reviews/phase-3-r2-prompt.md:126:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1346:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1562:./specs/m11-build-spec-v1/reviews/phase-3-r2.diff:85:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1347:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1627:./specs/m11-build-spec-v1/reviews/phase-3.diff:83:+**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1348:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:1971:./workflows/build-spec/SKILL.md:71:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1349:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:2147:./specs/archive/m6-five-stage-skeleton/plan.md:11:- 已有基建：CONSTITUTION.md（21 条，含 F4/F10）、contracts/stage-result.contract.json（facts 开放 object）、config/workflowhub.yaml（registry + metrics_path）、scripts/check-stage-quality.mjs（指标质量扫描器，344 行）、core/protected-paths.mjs（运行时非阻断提醒）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1350:./specs/archive/m11-build-spec-v1/reviews/build-code-phase-3-r2-pass.md:2179:./specs/archive/m6-five-stage-skeleton/spec.md:38:agenthub 的 vibecoding workflow 有成熟的五段提示词（intake/design/plan/apply/test-acceptance），但与运行时 gate 深度耦合。workflowhub 已立宪法 F4（质量靠异源审查+人，非阻断质量门）和 F10（自动化按真实收益，不为"机器可校验"本身堆基建），并已删除 check-path-guard CI 护栏、把 findViolation 解耦进 core/protected-paths.mjs 作运行时非阻断提醒（commit 7453d4b，已在 main）。M3 已定窄契约 stage-result，M4 已有指标系统与 check-stage-quality.mjs 扫描器。本期在这些基础上建五段骨架。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1351:./specs/archive/m6-five-stage-skeleton/spec.md:38:agenthub 的 vibecoding workflow 有成熟的五段提示词（intake/design/plan/apply/test-acceptance），但与运行时 gate 深度耦合。workflowhub 已立宪法 F4（质量靠异源审查+人，非阻断质量门）和 F10（自动化按真实收益，不为"机器可校验"本身堆基建），并已删除 check-path-guard CI 护栏、把 findViolation 解耦进 core/protected-paths.mjs 作运行时非阻断提醒（commit 7453d4b，已在 main）。M3 已定窄契约 stage-result，M4 已有指标系统与 check-stage-quality.mjs 扫描器。本期在这些基础上建五段骨架。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1352:./specs/archive/m6-five-stage-skeleton/spec.md:256:- **隐性必达 4**：宪法保持 21 条、F10 在册、check-path-guard 已删且 core/protected-paths.mjs 运行时非阻断提醒在位（既有状态，本期不得破坏）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1353:./specs/archive/m6-five-stage-skeleton/spec.md:276:- [ ] **AC12**：宪法 F10 在册（21 条），check-path-guard 已删且运行时非阻断提醒保留。← 隐性必达 4
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1354:./specs/archive/m6-five-stage-skeleton/spec.md:289:- **不受影响**：agenthub 全部现有功能（本期零改动）；workflowhub 宪法（保持 21 条不变）；既有运行时非阻断提醒（protected-paths）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1355:./specs/archive/m6-five-stage-skeleton/plan.md:11:- 已有基建：CONSTITUTION.md（21 条，含 F4/F10）、contracts/stage-result.contract.json（facts 开放 object）、config/workflowhub.yaml（registry + metrics_path）、scripts/check-stage-quality.mjs（指标质量扫描器，344 行）、core/protected-paths.mjs（运行时非阻断提醒）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1356:./specs/archive/m6-five-stage-skeleton/plan.md:20:- F4 质量靠异源审查+人非阻断门：YES — 不引运行时质量 gate，质量靠 plan/design-review + 人。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1357:./specs/archive/m11-build-spec-v1/plan.md:43:| Q1 记事实而非阻断 | YES | 宪法检查不达标仅浮现不阻断；baseline 对照阈值人拍、不达标不阻断；metrics 写失败只 warn |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1358:./specs/archive/m12-build-plan-v1/constitution-check.md:16:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — cross-artifact-analyze 作为独立第三方技能扫描三产物（FR-XARTIFACT-001），加一次人审检查点（FR-REVIEW-001），决策 D-M12-5 明确引用"承接 F4 异源审查不卡死"，未设阻断式质量门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1359:./specs/archive/m12-build-plan-v1/constitution-check.md:26:- [x] **Q1 记事实而非阻断** — 宪法检查结果"仅记录浮现供人审查，不因不达标阻断"（FR-CONSTITUTION-002），analyze 报告"仅记录不阻断"（FR-XARTIFACT-002），基线对照"不达标不阻断推进"（FR-BASELINE-002），与 F3/F4 一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1394:/bin/bash -lc 'rg -n "FR-ARTIFACT-001|FR-BEHAV-001|FR-BEHAV-002|质量事实契约|违规时记录为 warn|不自动停止 stage|非阻断" specs/m13b-build-spec-deepening tasks/m13b-build-spec-deepening tests/m13b-build-spec-deepening.test.mjs workflows/build-spec/SKILL.md' in /Users/Hugh/Hugh/Project/workflowhub
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1400:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1401:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1402:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1403:tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1404:tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1405:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1410:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1415:workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1417:workflows/build-spec/SKILL.md:196:长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1421:workflows/build-spec/SKILL.md:203:以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1422:workflows/build-spec/SKILL.md:217:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1423:workflows/build-spec/SKILL.md:226:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1424:workflows/build-spec/SKILL.md:240:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1425:workflows/build-spec/SKILL.md:258:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1426:tasks/m13b-build-spec-deepening/scope-decision.md:40:### D-M13b-3：spec-reviewer 触发条件 = 可选、非阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1427:tasks/m13b-build-spec-deepening/scope-decision.md:61:| spec-reviewer（M0 ref） | 新建 | 独立子代理，非阻断 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1428:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1429:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1432:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1433:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1439:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:868:+5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1444:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:921:+条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1452:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1083:   139	5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1457:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1136:   192	条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1462:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1159:   215	- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1463:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1168:   224	- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1464:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1427:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1465:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1428:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1466:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1430:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1467:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1433:tests/m13b-build-spec-deepening.test.mjs:232:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1468:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1436:tests/m13b-build-spec-deepening.test.mjs:246:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1469:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1439:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1470:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1452:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1471:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1456:workflows/build-spec/SKILL.md:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1472:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1458:workflows/build-spec/SKILL.md:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1473:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1459:workflows/build-spec/SKILL.md:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1474:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1461:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1475:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1462:workflows/build-spec/SKILL.md:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1476:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1465:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1477:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1469:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1478:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1470:specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1479:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1472:specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1480:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1475:specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1481:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1477:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1482:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1479:specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1483:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1483:specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1484:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1484:specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1486:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1486:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1487:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1489:specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1488:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1491:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1489:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1492:specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1490:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1494:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1491:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1497:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1492:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1499:specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1493:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1500:specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1494:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1504:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1495:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1496:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1508:specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1497:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1509:specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1498:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1511:specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1499:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1513:specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1500:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1521:specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1501:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1524:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1502:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1503:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1527:specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1504:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1505:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1529:specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1506:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1533:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1507:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1508:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1536:specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1509:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1510:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1538:specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1511:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1543:specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1512:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1545:specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1514:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1561:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1518:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1586:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1519:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1588:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1522:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1633:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1523:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1634:specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1524:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1525:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1639:specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1526:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1640:specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1527:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1641:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1528:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1669:   238	**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1529:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1687:   256	- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1531:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1832:tests/m13b-build-spec-deepening.test.mjs:135:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1532:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1833:tests/m13b-build-spec-deepening.test.mjs:136:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1533:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1858:tests/m13b-build-spec-deepening.test.mjs:261:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1535:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1880:workflows/build-spec/SKILL.md:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1546:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1910:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1552:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1934:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1553:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1936:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1558:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1947:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1559:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1564:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2090:      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1565:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2091:      "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1566:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2167:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1567:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2187:      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1568:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2201:      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1569:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2216:      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1575:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2895:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1583:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2946:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1584:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2947:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1585:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1586:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1589:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1591:tasks/m13b-build-spec-deepening/decision-log.md:28:- **D4（审查恢复修正）**【修正 2026-06-30，Hugh 授权】：原降级基于错误前提——将「异源独立审查」误当成「3 个不同 source_family 各审一角度」的高成本机制。事实是 agenthub design 原审查 = 单一异源引擎（如 codex）的 3rd-review 独立审查，workflowhub 现有 3rd-review 基础设施可直接复用，成本仅一次异源调用。**恢复为 B=真·异源独立审查：复用现有 3rd-review（单一异源引擎），产出 verdict+findings，记入质量事实契约第 3 项，非阻断（记录+浮现+人判断）。不做 3 source_family 多重审查（过度工程，Hugh 从未要求）。单一异源满足宪法独立裁决最小要求。**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1593:tasks/m13b-build-spec-deepening/decision-log.md:60:- 审查机制为真·异源独立审查（复用现有 3rd-review，单一异源引擎），结论记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1595:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:99:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1600:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:142:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1601:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:143:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1602:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:150:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1605:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:178:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1606:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:183:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1607:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:188:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1608:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:203:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1610:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:234:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1615:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:251:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1618:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:294:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1619:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:303:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1620:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:305:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1626:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:348:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1627:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:375:tasks/m13b-build-spec-deepening/decision-log.md:18:目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1628:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:388:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1629:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:390:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1630:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:398:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:262:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1631:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:400:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:264:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1632:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:457:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1525:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1633:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:459:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1634:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:460:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1534:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1635:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:462:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1537:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1636:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:464:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1637:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1637:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:491:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2967:2. 严重：`build-spec` 仍有阻断式 F10 gate，和“所有质量检查非阻断”标准冲突。  
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1638:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:493:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2969:   下游 agent 按完整 SKILL 执行时，会把 F10 当成可自动裁剪 spec 的阻断/改写门，而不是记录+浮现。这不符合你给的 criteria (1) 和 CONSTITUTION F4/F5。建议把 Section 6 改成“记录 F10 结论到质量事实契约/未解风险，交给 human review 判断”，不要自动 remove。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1639:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:509:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1640:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1642:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:516:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1643:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:526:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1644:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:528:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1645:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:541:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1646:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:581:139:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1649:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:591:192:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1652:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:598:215:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1653:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:600:224:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1654:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:602:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1655:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:604:256:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1659:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:757:5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1664:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:810:条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1669:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:833:- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1670:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:842:- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1671:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:856:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1672:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:874:- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1673:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:953:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1674:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:965:workflows/build-spec/SKILL.md:238:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1676:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1681:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1682:specs/m13b-build-spec-deepening/spec.md:67:- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1683:specs/m13b-build-spec-deepening/spec.md:74:- spec↔decision-log 一致性检查（非阻断，记差异）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1686:specs/m13b-build-spec-deepening/spec.md:102:- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1687:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1688:specs/m13b-build-spec-deepening/spec.md:112:- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1689:specs/m13b-build-spec-deepening/spec.md:127:- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1691:specs/m13b-build-spec-deepening/spec.md:158:- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1696:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1699:specs/m13b-build-spec-deepening/spec.md:218:- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1700:specs/m13b-build-spec-deepening/spec.md:227:**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1701:specs/m13b-build-spec-deepening/spec.md:229:- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1707:specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1708:specs/m13b-build-spec-deepening/spec.md:319:**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1710:specs/m13b-build-spec-deepening/spec.md:350:- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1711:specs/m13b-build-spec-deepening/spec.md:351:- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1718:specs/m13b-build-spec-deepening/spec.md:442:| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1719:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1725:specs/m13b-build-spec-deepening/plan.md:110:- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1726:specs/m13b-build-spec-deepening/plan.md:115:- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1731:specs/m13b-build-spec-deepening/plan.md:199:- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1732:specs/m13b-build-spec-deepening/plan.md:213:- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1737:specs/m13b-build-spec-deepening/plan.md:317:3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1743:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1744:specs/m13b-build-spec-deepening/r5-review-prompt.md:56:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1745:specs/m13b-build-spec-deepening/r5-review-prompt.md:62:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1746:specs/m13b-build-spec-deepening/r5-review-prompt.md:64:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1747:specs/m13b-build-spec-deepening/r5-review-prompt.md:66:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1756:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1757:specs/m13b-build-spec-deepening/tasks.md:33:- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1758:specs/m13b-build-spec-deepening/tasks.md:39:- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1759:specs/m13b-build-spec-deepening/tasks.md:41:- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1760:specs/m13b-build-spec-deepening/tasks.md:43:- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1773:specs/m13b-build-spec-deepening/checklists/requirements.md:47:| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1774:specs/m13b-build-spec-deepening/checklists/requirements.md:57:| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1775:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:16:| 7 条自检清单 | 128-136 | 非阻断自检，便宜。含 Spec-Purity grep（纯事实粗筛）。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1776:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1782:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:23:| 4 | 7 条自检清单（全过才能触发审查） | 清单**合宪**；"才能触发"阻断味**违 Q1** | 保留自检，非阻断 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1783:tasks/m13b-build-spec-deepening/artifacts/s5-prompt-scope.md:8:1. 移植 7 个质保机制进 build-spec SKILL.md（异源审查、journal/evidence、spec-purity 扫描、7 自检、退出门、推进门、摩擦即记，全部合宪改造为非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1792:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stdout:49:   → 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1802:tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:19:- **维持**（甲方方向成立，乙方意见降级为非阻断备注）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1825:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1826:specs/m13b-build-spec-deepening/constitution-check.md:20:- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1829:specs/m13b-build-spec-deepening/constitution-check.md:33:  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1830:specs/m13b-build-spec-deepening/constitution-check.md:45:- [x] **Q1 记事实而非阻断**
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1831:specs/m13b-build-spec-deepening/constitution-check.md:46:  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1832:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1847:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:384:AssertionError: 契约必须明确为非阻断 (FR-CONTRACT-002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1849:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:398:    136|       "契约必须明确为非阻断 (FR-CONTRACT-002)");
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1856:specs/m13b-build-spec-deepening/cross-artifact-analysis.md:48:| G-01 | LOW | spec.md AC-20, AC-21 vs plan.md/tasks.md | spec.md 含 AC-20（Known Gaps 段可搜索）和 AC-21（行为验证场景格式覆盖）。plan.md Verification Mapping 未单独列出 AC-20/AC-21 的对应 Step（AC-20 隐含在 Step 1.2 / FR-STRUCTURE-002，AC-21 隐含在 Step 3.2 / FR-BEHAV-001/002）。 | id:G-01, type:coverage_gap, location:plan.md Verification Mapping, description:AC-20/AC-21 未显式在 Verification Mapping 中出现, suggested_action:可将 AC-20 加入 Step 1.2 行、AC-21 加入 Step 3.2 行；低优先级，功能覆盖已存在 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1880:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1884:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1889:workflows/build-spec/SKILL.md:196:长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1890:workflows/build-spec/SKILL.md:203:以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1896:tasks/m13b-build-spec-deepening/journal.jsonl:10:{"seq":10,"event":"constitution_crosscheck_done","ts":"2026-06-30T04:42:00Z","artifact":"artifacts/direction-constitution-crosscheck.md","note":"grill: 5 mechanisms constitutional & portable; 3 blocking gates (stage_exit/post_review_pass/stage_advance) violate F4/F5/F10/Q1/Q2/F7. F10 反例 names agenthub explicitly."}
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1901:tasks/m13b-build-spec-deepening/journal.jsonl:22:{"seq":22,"event":"design_granular_eval_done","ts":"2026-06-30T06:02:00Z","stage":"make-decision","artifact":"artifacts/agenthub-design-keep-cut-modify.md","note":"read design.md full 247 lines. keep 10 blocks (spec body/spec-ladder/3-tier/self-check/3rd-review/behavior-verify/task-dir/friction/gaps); modify 3 gates non-blocking; cut TodoWrite ceremony + [DECOMP] telemetry + gate-bound auto-write + dup exit line."}
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1912:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:872:+**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1919:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1087:   143	**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1932:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1430:tests/m13b-build-spec-deepening.test.mjs:212:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1934:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1453:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1935:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1465:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1936:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1469:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1937:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1476:specs/m13b-build-spec-deepening/spec.md:104:### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1938:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1477:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1939:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1486:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1940:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1490:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1941:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1502:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1942:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1507:specs/m13b-build-spec-deepening/plan.md:95:- 内容：5 项字段定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），禁止阻断语义（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1943:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1510:specs/m13b-build-spec-deepening/plan.md:197:- [x] **F3 物理事实靠机器校验但不阻断** — 判据：Spec-Purity grep、scope-triage grep、7 条自检均为机器执行并客观记录结论（pass/warn/unknown），明确要求不阻断推进（FR-CONTRACT-002, FR-SELFCHECK-001/002）。符合 F3。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1944:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1524:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1945:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1526:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1946:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1533:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1947:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1535:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1948:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1539:specs/m13b-build-spec-deepening/spec-clarify-scan.md:50:- Spec-Purity grep 命中：warn + 记录，不阻断（FR-SELFCHECK-002）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1949:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1547:specs/m13b-build-spec-deepening/checklists/requirements.md:74:## 五、阻断语言检查（Spec-Purity 阻断门语义）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1950:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1553:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1958:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1592:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:587:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1966:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1619:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:264:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1968:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1633:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1969:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1641:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1976:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1881:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1980:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1908:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:1997:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2167:      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2001:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2896:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2007:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2008:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2009:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:99:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2012:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:142:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2015:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:180:### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2017:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:183:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2020:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:251:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2022:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:296:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2025:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:345:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2026:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:362:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2028:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:367:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2031:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:389:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2037:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:405:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:872:+**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2038:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:410:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1087:   143	**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2039:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:449:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1453:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2040:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:454:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1490:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2041:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:455:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1502:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2042:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:458:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1526:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2043:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:461:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1535:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2044:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:463:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1553:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2045:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:476:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1881:workflows/build-spec/SKILL.md:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2046:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:478:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1908:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2048:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:487:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:2896:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2049:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:496:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2051:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:504:tasks/m13b-build-spec-deepening/journal.jsonl:10:{"seq":10,"event":"constitution_crosscheck_done","ts":"2026-06-30T04:42:00Z","artifact":"artifacts/direction-constitution-crosscheck.md","note":"grill: 5 mechanisms constitutional & portable; 3 blocking gates (stage_exit/post_review_pass/stage_advance) violate F4/F5/F10/Q1/Q2/F7. F10 反例 names agenthub explicitly."}
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2052:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:509:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:6:    "decision": "M13b build-spec 深化方向 = 质量事实契约 + 最小实现（非逐机制照搬 agenthub design）。KEEP：spec 正文/spec-ladder/三层小节/7 条自检+Spec-Purity grep/独立三角度审查/行为验证/摩擦捕获/--task-dir/Known Gaps。CUT：3 个门(MODIFY 块)、TodoWrite 仪式、[DECOMP] 遥测、门绑定自动写、重复行。S5 简化为 1-AI-3-angle 独立三角度审查（非三 source_family）。5 框架外部调研移出（单列任务）。TASK_TRACKING_ROOT 本批完整落地（OQ-1=B：全局环境变量+所有 stage 读取约定）。+REQ-COMM-01 大白话+给选项，REQ-COMM-02 勤报进度。Hugh 8 项全部纳入（D8）：6 项已在 D1/D2/D4，2 项低成本新增(FR-{DOMAIN}-NNN 编号/AC 计数存文件)，0 新增阻断门，高危词为浮现+建议非强制门。全部非阻断，唯一 hard gate=S9 已获 Hugh 'A' 批准。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2053:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2054:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:521:tasks/m13b-build-spec-deepening/artifacts/s5-prompt-framing.md:5:背景：workflowhub 是 AI 开发工作流编排工具，宪法核心信条：薄核心窄契约、记事实不阻断、质量靠独立审查与人。它立项就是为逃离前身 agenthub——agenthub 堆约 9.5 万行 gate 代码、半数提交修 gate 死锁，被宪法 F10 列为反例。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2055:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:527:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2056:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:533:tasks/m13b-build-spec-deepening/artifacts/s5-prompt-direction.md:5:背景：workflowhub 是 AI 开发工作流编排工具，有一套宪法 CONSTITUTION（核心信条：薄核心窄契约、记事实不阻断、质量靠独立审查与人、不写阻断式质量门）。它的立项根因之一就是逃离前身系统 agenthub——agenthub 堆了约 9.5 万行 gate/校验代码，约一半提交在修 gate 死锁，宪法 F10 反例点名此事。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2057:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:534:tasks/m13b-build-spec-deepening/artifacts/s5-debate1-prompt.md:4:workflowhub 是 AI 工作流编排工具，宪法核心：薄核心窄契约、记事实不阻断、质量靠独立审查与人、不写阻断式质量门。立项是为逃离前身 agenthub（堆 9.5 万行 gate 代码、半数提交修 gate 死锁，被宪法 F10 点名反例）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2058:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:536:tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:4:workflowhub：AI 工作流编排工具，宪法核心=薄核心、记事实不阻断、质量靠独立审查与人、不写阻断式质量门。立项为逃离前身 agenthub（堆 9.5 万行 gate 代码、半数提交修 gate 死锁，宪法 F10 反例点名）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2059:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:537:tasks/m13b-build-spec-deepening/artifacts/s5-economy-review-prompt.md:10:3. 删：agenthub 那 3 道门（退出门/审查门/推进门）整层删（检查内容已被 7 自检+纯净度扫描+异源审查覆盖）；TodoWrite 待办模板仪式、[DECOMP] 遥测、绑门自动写、重复行。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2060:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:538:tasks/m13b-build-spec-deepening/artifacts/make-decision-original-context.md:19:- CONSTITUTION.md v1.1.0 已亲读：F4/F5/F10/Q1/Q2 明确禁止「阻断式质量门」；**F10 反例原文点名 agenthub 的 9.5 万行 gate 代码为永久警示**。【基准已读】
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2062:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:540:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:37:| host 自动写 capture+stage_summary 绑 gate 的描述 | 18 | 绑在阻断门上的自动写仪式，门删了它也没意义。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2063:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:541:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:44:build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2065:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:549:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:20:| 1 | 退出检查门 gate.sh stage_exit（没过不能进） | **违 F4/F5/F10/Q2** | 不可照搬。改：6 条检查照跑，结果记事实+浮现边界，**不阻断**；推进由人确认（F7） |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2067:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:551:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:31:- **必须改造（违宪，不可照搬）**：stage_exit 门、post_review_pass 门、stage_advance 门 → 3 道 blocking gate。照搬即违 F4/F5/F7/F10/Q1/Q2，且违 CLAUDE.md 硬规则「不引入会阻断推进的质量门」。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2070:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:582:143:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2075:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:761:**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2089:tasks/m13b-build-spec-deepening/decision-log.md:34:- **D8（8 项纳入裁定）**：Hugh 提的 8 件事全部纳入本任务，无新增阻断门。映射：①handoff.json→D1 required_reads（已在）；②范围判断+高危词→scope-triage（D2，已在，"强制完整流程"改为高危词浮现+建议，不卡推进）；③需求自检 4 类→7 条自检（D2，已在，记录不卡）；④前后一致性→spec↔decision-log 对齐（D1，已在）；⑤独立审查→异源3rd-review独立审查（D4修正，复用现有基础设施）；⑥FR-{DOMAIN}-NNN 编号格式→新增小项（便宜）；⑦AC 条数计数存文件→新增小项（便宜）；⑧长报告只存路径→REQ-COMM/artifact-first（已在）。结论：6 项已在 D1/D2/D4，2 项（⑥⑦）为低成本新增，0 项引入阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2095:specs/m13b-build-spec-deepening/spec.md:23:**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2098:specs/m13b-build-spec-deepening/spec.md:66:- 7 条自检 + Spec-Purity grep（非阻断，记事实）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2101:specs/m13b-build-spec-deepening/spec.md:104:### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2103:specs/m13b-build-spec-deepening/spec.md:107:- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2106:specs/m13b-build-spec-deepening/spec.md:175:- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2108:specs/m13b-build-spec-deepening/spec.md:220:**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2117:specs/m13b-build-spec-deepening/spec.md:404:| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2123:specs/m13b-build-spec-deepening/plan.md:95:- 内容：5 项字段定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），禁止阻断语义（FR-CONTRACT-001/002）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2127:specs/m13b-build-spec-deepening/plan.md:197:- [x] **F3 物理事实靠机器校验但不阻断** — 判据：Spec-Purity grep、scope-triage grep、7 条自检均为机器执行并客观记录结论（pass/warn/unknown），明确要求不阻断推进（FR-CONTRACT-002, FR-SELFCHECK-001/002）。符合 F3。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2136:specs/m13b-build-spec-deepening/r5-review-prompt.md:54:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2137:specs/m13b-build-spec-deepening/r5-review-prompt.md:60:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2143:specs/m13b-build-spec-deepening/tasks.md:31:- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2144:specs/m13b-build-spec-deepening/tasks.md:37:- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2147:tasks/m13b-build-spec-deepening/artifacts/make-decision-original-context.md:35:1. **5 机制合宪直搬**：异源审查（复用 3rd-review skill）、journal/evidence 留痕（复用 journal.jsonl + collector）、Spec-Purity grep 扫描、7 条自检清单、摩擦即记精神。全部「记事实 + 浮现，不阻断」。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2149:specs/m13b-build-spec-deepening/spec-clarify-scan.md:50:- Spec-Purity grep 命中：warn + 记录，不阻断（FR-SELFCHECK-002）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2154:specs/m13b-build-spec-deepening/checklists/requirements.md:74:## 五、阻断语言检查（Spec-Purity 阻断门语义）
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2158:specs/m13b-build-spec-deepening/r3-review-prompt.md:32:Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2162:tasks/m13b-build-spec-deepening/artifacts/agenthub-design-keep-cut-modify.md:16:| 7 条自检清单 | 128-136 | 非阻断自检，便宜。含 Spec-Purity grep（纯事实粗筛）。 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2171:tasks/m13b-build-spec-deepening/artifacts/direction-constitution-crosscheck.md:22:| 3 | Spec-Purity grep 预检（不过不能提审） | grep 扫描**合宪**（F3 机器采集）；"不能提审"阻断**违 Q1** | 保留扫描，结果记事实，命中浮现给人，不阻断 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2207:specs/m13b-build-spec-deepening/evidence/phase-1-RED.json.stderr:587:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2219:specs/m13b-build-spec-deepening/constitution-check.md:18:  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2220:specs/m13b-build-spec-deepening/constitution-check.md:49:  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2246:specs/m13b-build-spec-deepening/evidence/phase-2-RED.json.stderr:264:    212|       c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes…
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2269:   168	**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2293:   192	条目写入质量事实契约第 4 项（未解风险），不阻断推进。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2297:   196	长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2304:   203	以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2338:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2409:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2456:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1505:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2527:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r1.md:1950:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2555:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2581:specs/m13b-build-spec-deepening/reviews/build-code-phase12-review-r3-pass.md:510:tasks/m13b-build-spec-deepening/stage-result-make-decision.json:7:    "scope": "in: 质量事实契约定义+最小实现、独立三角度审查(1-AI-3-angle)、7 条自检+Spec-Purity grep、行为验证、摩擦捕获、handoff required_reads、scope-triage 高危词浮现、spec↔decision-log 一致性、FR-{DOMAIN}-NNN 编号、AC 计数存文件、artifact-first 长报告存路径、TASK_TRACKING_ROOT 全局变量+全 stage 读取约定。out: 5 框架外部调研(单列)、任何阻断式门、逐机制照搬 agenthub design 的死仪式(TodoWrite/[DECOMP]/门绑定自动写/重复行)。",
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2608:specs/m13b-build-spec-deepening/spec.md:446:| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2634:   261	      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2658:从原 R1/R2 截图可见，旧问题是 FR-ARTIFACT-001 只写了“只传路径”，没有把违规后的非阻断处理写清楚。当前正文已经补齐这个处理链。为了不只看文本，我跑一次对应测试文件确认当前状态。
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2845: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use gate.sh as an active execution call
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2846: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use post_review_pass as an active gate
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2847: ✓ tests/m13b-build-spec-deepening.test.mjs > Phase 3 / AC-16: D3 deleted items not present as active mechanisms > SKILL.md does NOT use [DECOMP] telemetry emission
specs/m13b-build-spec-deepening/reviews/build-code-phase3-review-r3-pass.md:2870:- 明确“不自动停止 stage（非阻断）”

codex
我已经确认当前工作区是脏的，但本次只读复核，不改文件。接下来重点看新增断言是不是会抓真实违规，而不是只匹配当前文本。
exec
/bin/bash -lc "sed -n '292,384p' tests/m13b-build-spec-deepening.test.mjs" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
describe("Phase 3 / AC-15: [FRICTION] capture format", () => {
  test("SKILL.md declares [FRICTION] entry format", () => {
    const c = skill();
    assert.ok(c.includes("[FRICTION]") || c.includes("FRICTION"),
      "SKILL.md must declare [FRICTION] capture format (FR-FRICTION-001)");
  });
});

describe("Phase 3 / AC-16: high-risk words not used as execution gate semantics", () => {
  test("SKILL.md does not use 不能进 as an execution gate (only allowed in blacklist/example context)", () => {
    const c = skill();
    // 不能进 may appear in the high-risk-word blacklist enumeration (黑名单) — that is fine.
    // It must NOT appear as a hard gate controlling execution flow outside that context.
    const gateLines = c.split("\n").filter(
      l => l.includes("不能进") && !l.includes("黑名单") && !l.includes("示例") && !l.includes("例如")
    );
    assert.ok(gateLines.length === 0,
      `SKILL.md must not use 不能进 as execution gate (AC-16); found outside blacklist/example context: ${gateLines.join(" | ")}`);
  });
  test("SKILL.md does not use Chinese 阻断 as a hard execution gate", () => {
    const c = skill();
    // 阻断 may appear as: 不阻断/非阻断 (negated), blacklist listing (黑名单),
    // detection description (检测阻断), constitution refs (Q1/F3/F4/F5), 而非阻断 (explanatory).
    // A hard gate like 若X则阻断流程 MUST be rejected.
    const hardGateLines = c.split("\n").filter(l => {
      if (!l.includes("阻断")) return false;
      // Negated forms
      if (l.includes("不阻断") || l.includes("非阻断") || l.includes("不构成阻断") ||
          l.includes("不作为阻断") || l.includes("不得阻断") || l.includes("而非阻断")) return false;
      // Detection / blacklist / explanation context
      if (l.includes("黑名单") || l.includes("检测阻断") || l.includes("阻断语义") ||
          l.includes("禁止附加") || l.includes("记录事实")) return false;
      // Constitution principle references
      if (l.match(/Q[0-9]|F[0-9]|CONSTITUTION/)) return false;
      return true;
    });
    assert.ok(hardGateLines.length === 0,
      `SKILL.md must not use 阻断 as hard execution gate (AC-16); suspect lines: ${hardGateLines.slice(0,3).join(" | ")}`);
  });
  test("SKILL.md does not use BLOCK or blocking as a hard execution gate (only non-blocking or blacklist context)", () => {
    const c = skill();
    // Lines with BLOCK/blocking are fine when negated or in blacklist/explanation context.
    // Allowed: 不阻断, non-blocking, do not block, NOT block, don't block, 黑名单, 不构成阻断
    const hardGateLines = c.split("\n").filter(l => {
      if (!l.match(/\bBLOCK\b|blocking/i)) return false;
      // Chinese negation forms
      if (l.includes("不阻断") || l.includes("非阻断") || l.includes("不构成阻断") ||
          l.includes("不作为阻断") || l.includes("阻断语义") || l.includes("黑名单")) return false;
      // English negation forms (do not block, NOT block, non-blocking, won't block)
      if (l.match(/non.?block|not block|do not block|does not block|don.t block|won.t block/i)) return false;
      // Explanation / principle context (constitution refs, rule notes)
      if (l.includes("Q1") || l.includes("F3") || l.includes("F4") || l.includes("F5")) return false;
      return true;
    });
    assert.ok(hardGateLines.length === 0,
      `SKILL.md must not use BLOCK/blocking as hard gate (AC-16); suspect lines: ${hardGateLines.slice(0,3).join(" | ")}`);
  });
});

describe("Phase 3 / AC-21: D3 deleted items not present as active mechanisms", () => {
  test("SKILL.md does NOT use gate.sh as an active execution call", () => {
    assert.ok(!skill().includes("gate.sh"),
      "gate.sh must not appear as active mechanism in SKILL.md (AC-21)");
  });
  test("SKILL.md does NOT use post_review_pass as an active gate", () => {
    assert.ok(!skill().includes("post_review_pass"),
      "post_review_pass must not appear in SKILL.md (AC-21)");
  });
  test("SKILL.md does NOT use [DECOMP] telemetry emission", () => {
    assert.ok(!skill().includes("[DECOMP]"),
      "[DECOMP] must not appear in SKILL.md as mechanism (AC-21)");
  });
  test("SKILL.md does NOT contain TodoWrite template call as active mechanism", () => {
    // TodoWrite is a D3 deleted item — must not appear as an active step/call
    // (explanatory references to the concept are allowed, same semantics as AC-16)
    const c = skill();
    const twLines = c.split("\n").filter(
      l => l.includes("TodoWrite") && !l.includes("//") && !l.includes("注：") && !l.includes("例如")
    );
    assert.ok(twLines.length === 0,
      `TodoWrite must not appear as active mechanism in SKILL.md (AC-21); found: ${twLines.slice(0,2).join(" | ")}`);
  });
  test("SKILL.md does NOT contain duplicate Exit Conditions sections as mechanism steps", () => {
    // At most one Exit Conditions heading is allowed; a duplicate signals a D3 gate pattern
    const c = skill();
    const exitCondMatches = (c.match(/## Exit Conditions|## 退出条件|stage_exit/g) || []);
    assert.ok(exitCondMatches.length <= 1,
      `Duplicate Exit Conditions/stage_exit sections detected (${exitCondMatches.length}) — D3 gate pattern violation (AC-21)`);
  });
});

describe("Phase 3 / AC-17: spec-acceptance-count.json file validity", () => {
  test("spec-acceptance-count.json exists", () => {

exec
/bin/bash -lc "sed -n '80,280p' workflows/build-spec/SKILL.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
Read `{--task-dir}/decision-log.md` — the upstream `make-decision` output (default path when `--task-dir` absent: `tasks/{task-id}/decision-log.md`, per FR-TASKDIR-001). Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.

### 1. Metrics: stage start

At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.

### 1.5. spec-ladder 档位判断（FR-LADDER-001/002）

在调用 spec-specify 前，基于 decision-log 描述的功能复杂度做档位判断，输出档位选择依据记入 spec 序言：

- **A 档**（小改动）：单文件或配置调整，影响面窄；速读卡足够，正文后三章可豁免
- **B 档**（中等）：跨模块改动或新增机制；需完整三层 spec
- **C 档**（大改动）：跨系统边界、新引入外部依赖或破坏性变更；完整三层 spec + 额外影响范围分析

F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
1. What real threat does this defend against?
2. Does any existing mechanism already cover it?
3. Can it be bypassed, making it security-theatre?
4. What is the long-term maintenance cost?

---

### 2. spec-specify: first-draft spec

Invoke `skills/spec-specify/SKILL.md` (spec-specify):

- **Input**: task-id (from the current stage context) and the functional description text extracted from the decision-log.
- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
- If spec-specify reports failure or the output files are missing, stop and surface the error — do not proceed to spec-clarify.

### 3. spec-clarify: ambiguity scan and interactive refinement

Invoke `skills/spec-clarify/SKILL.md` (spec-clarify):

- **Input**: task-id (or the explicit spec path `specs/{task-id}/spec.md`).
- **Expected behaviour**: 10-dimension ambiguity scan, up to 5 interactive clarification questions (one at a time), incremental spec updates after each accepted answer, and a coverage summary at completion.
- If spec-clarify reports the spec file is not found, stop — run spec-specify first.

### 3.5. scope-triage 高危词浮现（FR-SCOPETRIAGE-001）

spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：

**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`

命中时：
- 浮现命中位置 + 建议修改（供人工确认是文档示例还是执行语义）
- 记录进质量事实契约第 4 项（未解风险）
- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）

---

### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）

spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：

1. spec-ladder 档位已声明且有依据
2. 所有 FR 使用 `FR-{DOMAIN}-NNN` 格式
3. 每个 FR 至少有一条 Given/When/Then 场景
4. 五章硬门完整（速读卡 / FR / 不做 / 验收 / 影响范围）——A 档可豁免后三章
5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
6. 无 `[NEEDS CLARIFICATION]` 残留（或全部标明已解决/延后理由）
7. Known Gaps 段存在

**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。

---

### 3.7. 异源 3rd-review 独立审查（FR-REVIEW-001/002）

spec 初稿完成后，调用异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），在独立上下文产出 verdict + findings：

- 结论记入质量事实契约第 3 项（独立审查摘要路径）
- 审查失败/不可用时降级记录 unknown + 原因，不阻断
- **禁止自审自判（FR-REVIEW-002）**：不得使用单一 AI 切换视角替代异源独立审查
- 可 grep 到 `3rd-review` 或 `异源独立审查`

---

### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）

完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：

1. **scope 边界**：本次 spec 的 IN/OUT scope 及裁剪机制列表
2. **自检结果**：7 条自检 + Spec-Purity grep 的 pass/warn/unknown 汇总
3. **独立审查摘要**：异源 3rd-review 的 verdict + findings 摘要路径
4. **未解风险**：已知缺口、摩擦记录（`[FRICTION]` 格式，见下节）、scope-triage 高危词命中、spec↔decision-log 差异
5. **handoff required_reads**：下游阶段必读文件清单

**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。

---

### 3.9. 交互规范（FR-COMM-001/002）

build-spec 产出过程中必须遵守以下交互规范：

**REQ-COMM-01（FR-COMM-001）**：对编排者的所有提问或选项，必须使用大白话说明选项后果，不让编排者猜。格式：列出选项 A/B/C + 每个选项的后果一句话。禁止含糊带过选项差异。

**REQ-COMM-02（FR-COMM-002）**：每完成主要步骤后，主动汇报进度：做了什么 / 下一步是什么 / 需要编排者做什么。不等对方追问。

---

### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）

#### [FRICTION] 摩擦捕获（FR-FRICTION-001）

发现任何流程卡点时，立即记录 `[FRICTION]` 条目：

```
[FRICTION] <触发时机简述>: <卡点描述> | 建议: <可选>
```

条目写入质量事实契约第 4 项（未解风险），不阻断推进。

#### Artifact-First 只传路径（FR-ARTIFACT-001）

长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。

#### FR 场景行为验证（FR-BEHAV-001/002）

- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
- **FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为；meta 场景（描述 build-spec 机制本身的）豁免此要求

以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。

---

### 4. Constitution compliance check

Read `constitution-checklist.md`. Check all 21 items (F1–F10, Q1–Q3, S1–S8) against the spec produced so far. For every item write `[x]` (compliant) or `[ ]` (non-compliant) with a concrete rationale sentence. No item may be left unmarked or without a rationale — all 21 must be present.

The 21 items are:

**Framework (F1–F10)**:
- [ ] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。
- [ ] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。
- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。
- [ ] **F6 统一外置执行记录** — 判据：进度/指标/回溯是否统一记录、可回溯。
- [ ] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作是否经人边界确认。
- [ ] **F8 简单优先** — 判据：是否选更简单依赖更少的方案、不写掩盖问题的兜底。
- [ ] **F9 可证伪不假绿** — 判据：检查是否在"实际为假"时真报失败、缺数据标未知。
- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。

**Quality (Q1–Q3)**:
- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
- [ ] **Q3 异源审查加人工把关** — 判据：质量裁决是否由独立来源独立上下文产出、无自审自判。

**Skills (S1–S8)**:
- [ ] **S1 能用外部就不造轮子** — 判据：通用能力是否优先复用外部、文件直放项目内。
- [ ] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。
- [ ] **S3 迭代时保持最新并就地检查** — 判据：迭代时是否查更新/更优、来源路径写进技能文件。
- [ ] **S4 自定义技能必须有指标系统** — 判据：自研技能是否配套指标、纳入统一执行记录。
- [ ] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能是否便于子代理调用、减少主上下文占用。
- [ ] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能是否参考成熟方案优化。
- [ ] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。
- [ ] **S8 自定义技能可独立调用可搬运** — 判据：自研技能是否可独立调用、可跨宿主搬运、不绑死环境。

**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).

Write the completed checklist as an appendix to the spec or as a standalone file `specs/{task-id}/constitution-check.md`.

### 5. Baseline comparison

Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:

| Metric | M11 Actual | M10 Baseline | Direction Delta |
| ------ | ---------- | ------------ | --------------- |
| missed_step_rate | <M11 actual> | 0.05 | <delta> |
| test_execution_rate | <M11 actual> | 0.8295 | <delta> |
| review_execution_rate | <M11 actual> | 1 | <delta> |
| rework_rounds | <M11 actual> | 6.075 | <delta> |
| rework_proxy_count | <M11 actual> | 25.25 | <delta> |

- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
- **If a metric cannot be computed from available data, write `unknown` in the M11 Actual cell and state the missing-data reason in a note below the table. Never fabricate a value.** A fabricated actual is a false-green (violates F9); a real `unknown` is honest.
- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
- The direction delta indicates whether the metric moved favourably (e.g. fewer rework rounds is better, higher test execution rate is better). For an `unknown` actual, the delta is also `unknown`.
- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.

Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.

### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)

This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).

Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).

1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). Hypothetical threats do not justify new infrastructure.
2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before keeping something new. Duplication is waste.
3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
4. **What is the long-term maintenance cost?** — Every mechanism kept here must be maintained across all future changes. High ongoing cost is a signal worth surfacing.

If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", **record the finding in the quality contract (item 4: 未解风险) and surface to human** — do not automatically remove the mechanism. The human at the review checkpoint decides whether to prune.

This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.

### 7. Human review checkpoint

exec
/bin/bash -lc "rg -n \"F10 anti|若|则阻断|停止|不得继续|不能进|强制门|必须停止|BLOCK|blocking|gate|stage_exit|Exit Conditions|TodoWrite|post_review_pass|gate\\.sh|\\[DECOMP\\]\" workflows/build-spec/SKILL.md tests/m13b-build-spec-deepening.test.mjs specs/m13b-build-spec-deepening/spec.md -S" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
tests/m13b-build-spec-deepening.test.mjs:132:  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
tests/m13b-build-spec-deepening.test.mjs:209:  test("SKILL.md states Spec-Purity is non-blocking", () => {
tests/m13b-build-spec-deepening.test.mjs:213:      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
tests/m13b-build-spec-deepening.test.mjs:229:  test("SKILL.md declares review is non-blocking", () => {
tests/m13b-build-spec-deepening.test.mjs:233:      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
tests/m13b-build-spec-deepening.test.mjs:243:  test("SKILL.md declares scope-triage is non-blocking", () => {
tests/m13b-build-spec-deepening.test.mjs:247:      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
tests/m13b-build-spec-deepening.test.mjs:258:  test("SKILL.md declares consistency check is non-blocking", () => {
tests/m13b-build-spec-deepening.test.mjs:262:      "Consistency check must be non-blocking (FR-ALIGN-001)");
tests/m13b-build-spec-deepening.test.mjs:300:describe("Phase 3 / AC-16: high-risk words not used as execution gate semantics", () => {
tests/m13b-build-spec-deepening.test.mjs:301:  test("SKILL.md does not use 不能进 as an execution gate (only allowed in blacklist/example context)", () => {
tests/m13b-build-spec-deepening.test.mjs:303:    // 不能进 may appear in the high-risk-word blacklist enumeration (黑名单) — that is fine.
tests/m13b-build-spec-deepening.test.mjs:304:    // It must NOT appear as a hard gate controlling execution flow outside that context.
tests/m13b-build-spec-deepening.test.mjs:305:    const gateLines = c.split("\n").filter(
tests/m13b-build-spec-deepening.test.mjs:306:      l => l.includes("不能进") && !l.includes("黑名单") && !l.includes("示例") && !l.includes("例如")
tests/m13b-build-spec-deepening.test.mjs:308:    assert.ok(gateLines.length === 0,
tests/m13b-build-spec-deepening.test.mjs:309:      `SKILL.md must not use 不能进 as execution gate (AC-16); found outside blacklist/example context: ${gateLines.join(" | ")}`);
tests/m13b-build-spec-deepening.test.mjs:311:  test("SKILL.md does not use Chinese 阻断 as a hard execution gate", () => {
tests/m13b-build-spec-deepening.test.mjs:313:    // 阻断 may appear as: 不阻断/非阻断 (negated), blacklist listing (黑名单),
tests/m13b-build-spec-deepening.test.mjs:315:    // A hard gate like 若X则阻断流程 MUST be rejected.
tests/m13b-build-spec-deepening.test.mjs:318:      // Negated forms
tests/m13b-build-spec-deepening.test.mjs:329:      `SKILL.md must not use 阻断 as hard execution gate (AC-16); suspect lines: ${hardGateLines.slice(0,3).join(" | ")}`);
tests/m13b-build-spec-deepening.test.mjs:331:  test("SKILL.md does not use BLOCK or blocking as a hard execution gate (only non-blocking or blacklist context)", () => {
tests/m13b-build-spec-deepening.test.mjs:333:    // Lines with BLOCK/blocking are fine when negated or in blacklist/explanation context.
tests/m13b-build-spec-deepening.test.mjs:334:    // Allowed: 不阻断, non-blocking, do not block, NOT block, don't block, 黑名单, 不构成阻断
tests/m13b-build-spec-deepening.test.mjs:336:      if (!l.match(/\bBLOCK\b|blocking/i)) return false;
tests/m13b-build-spec-deepening.test.mjs:340:      // English negation forms (do not block, NOT block, non-blocking, won't block)
tests/m13b-build-spec-deepening.test.mjs:347:      `SKILL.md must not use BLOCK/blocking as hard gate (AC-16); suspect lines: ${hardGateLines.slice(0,3).join(" | ")}`);
tests/m13b-build-spec-deepening.test.mjs:352:  test("SKILL.md does NOT use gate.sh as an active execution call", () => {
tests/m13b-build-spec-deepening.test.mjs:353:    assert.ok(!skill().includes("gate.sh"),
tests/m13b-build-spec-deepening.test.mjs:354:      "gate.sh must not appear as active mechanism in SKILL.md (AC-21)");
tests/m13b-build-spec-deepening.test.mjs:356:  test("SKILL.md does NOT use post_review_pass as an active gate", () => {
tests/m13b-build-spec-deepening.test.mjs:357:    assert.ok(!skill().includes("post_review_pass"),
tests/m13b-build-spec-deepening.test.mjs:358:      "post_review_pass must not appear in SKILL.md (AC-21)");
tests/m13b-build-spec-deepening.test.mjs:360:  test("SKILL.md does NOT use [DECOMP] telemetry emission", () => {
tests/m13b-build-spec-deepening.test.mjs:361:    assert.ok(!skill().includes("[DECOMP]"),
tests/m13b-build-spec-deepening.test.mjs:362:      "[DECOMP] must not appear in SKILL.md as mechanism (AC-21)");
tests/m13b-build-spec-deepening.test.mjs:364:  test("SKILL.md does NOT contain TodoWrite template call as active mechanism", () => {
tests/m13b-build-spec-deepening.test.mjs:365:    // TodoWrite is a D3 deleted item — must not appear as an active step/call
tests/m13b-build-spec-deepening.test.mjs:369:      l => l.includes("TodoWrite") && !l.includes("//") && !l.includes("注：") && !l.includes("例如")
tests/m13b-build-spec-deepening.test.mjs:372:      `TodoWrite must not appear as active mechanism in SKILL.md (AC-21); found: ${twLines.slice(0,2).join(" | ")}`);
tests/m13b-build-spec-deepening.test.mjs:374:  test("SKILL.md does NOT contain duplicate Exit Conditions sections as mechanism steps", () => {
tests/m13b-build-spec-deepening.test.mjs:375:    // At most one Exit Conditions heading is allowed; a duplicate signals a D3 gate pattern
tests/m13b-build-spec-deepening.test.mjs:377:    const exitCondMatches = (c.match(/## Exit Conditions|## 退出条件|stage_exit/g) || []);
tests/m13b-build-spec-deepening.test.mjs:379:      `Duplicate Exit Conditions/stage_exit sections detected (${exitCondMatches.length}) — D3 gate pattern violation (AC-21)`);
workflows/build-spec/SKILL.md:21:- **默认值**：`~/Knowledge/workflowhub/`（若变量未设置则使用此默认路径）
workflows/build-spec/SKILL.md:22:- **降级行为**：若 `TASK_TRACKING_ROOT` 未设置，记录 warn（不停止），继续使用默认路径
workflows/build-spec/SKILL.md:23:- **目录创建**：若路径不存在，尝试自动 `mkdir -p` 创建；失败时 warn 不停止
workflows/build-spec/SKILL.md:122:**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`
workflows/build-spec/SKILL.md:168:**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。
workflows/build-spec/SKILL.md:196:长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
workflows/build-spec/SKILL.md:203:以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。
workflows/build-spec/SKILL.md:218:- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。
workflows/build-spec/SKILL.md:227:- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
workflows/build-spec/SKILL.md:240:**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).
workflows/build-spec/SKILL.md:265:### 6. F10 anti-over-engineering gate (apply before the human review checkpoint, while the spec can still be revised)
workflows/build-spec/SKILL.md:267:This step runs on the spec produced by spec-specify → spec-clarify, **before** the human review checkpoint. It records F10 findings (non-blocking) so the human sees them at the checkpoint and can decide whether to revise. The human confirms the spec as-is; no automatic changes are made before the human sees it (F7).
workflows/build-spec/SKILL.md:269:Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).
workflows/build-spec/SKILL.md:278:This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.
specs/m13b-build-spec-deepening/spec.md:73:- scope-triage 高危词浮现（浮现+建议，非强制门）
specs/m13b-build-spec-deepening/spec.md:85:- TodoWrite 待办模板仪式
specs/m13b-build-spec-deepening/spec.md:86:- [DECOMP] 遥测
specs/m13b-build-spec-deepening/spec.md:88:- Exit Conditions 重复行
specs/m13b-build-spec-deepening/spec.md:91:- 任何阻断式 gate
specs/m13b-build-spec-deepening/spec.md:116:- **操作步骤**：spec 文本中检测到高危词（如"自动阻断""blocking gate""门禁"等）。
specs/m13b-build-spec-deepening/spec.md:173:**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。
specs/m13b-build-spec-deepening/spec.md:248:**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。
specs/m13b-build-spec-deepening/spec.md:257:- **场景**：Given `--task-dir` 未传入，When build-spec 运行，Then 回退到默认路径并 warn，不报错停止。
specs/m13b-build-spec-deepening/spec.md:311:**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。
specs/m13b-build-spec-deepening/spec.md:315:> **【验收口径对齐说明】** decision-log §7 的验收条件原文为"grep 不到 阻断/不能进/BLOCK"，与本 spec 要求 SKILL.md 必须包含这些词作为高危词检测黑名单看似矛盾，实际不矛盾。正确解读：验收检查的是"高危词是否被用作执行门语义（用来阻断/停止流程推进）"，而非是否在文本中出现。高危词以下列形式出现均**不构成违规**：（1）作为检测黑名单内容列举（如 scope-triage 检测列表）；（2）作为引用/示例/说明文本（如"禁止使用'阻断'语义"）；（3）出现在 Known Gaps、摩擦记录等说明段落中。违规仅指高危词出现在执行流程分支中作为"若…则停止/不能继续"的控制语义。AC-16 的 grep 验证应使用语义判断而非裸 grep，见 AC-16 说明。
specs/m13b-build-spec-deepening/spec.md:327:1. **无阻断门**：任何质量检查失败（自检 warn / 审查偏差 / 高危词命中）均不阻断推进，违反此条即违反 CONSTITUTION F4/F5。不引入 `gate.sh stage_exit`、`post_review_pass`、`stage_advance` 等带阻断语义的 gate 机制（这三个名词是已 CUT 的 agenthub 阻断门的精确核对项）。
specs/m13b-build-spec-deepening/spec.md:328:2. **无 TodoWrite 仪式**：不引入 TodoWrite 待办模板机制，不要求执行代理维护结构化 todo 列表。
specs/m13b-build-spec-deepening/spec.md:329:3. **无 [DECOMP] 遥测**：不做遥测分解标记。
specs/m13b-build-spec-deepening/spec.md:330:4. **无门绑定自动写**：不因 gate 触发自动写入任何文件（gate 已 CUT）。
specs/m13b-build-spec-deepening/spec.md:331:5. **无 Exit Conditions 重复行**：不在 SKILL.md 多处重复退出条件定义。
specs/m13b-build-spec-deepening/spec.md:355:- [ ] **AC-16**：`workflows/build-spec/SKILL.md` 中不存在将阻断/BLOCK/不能进**用作执行门语义**（即"若…则停止/不得继续"的控制分支）的文本；这些词作为高危词检测黑名单内容、引用示例、说明文字出现均不违规（见 FR-SCOPETRIAGE-001 验收口径对齐说明）。
specs/m13b-build-spec-deepening/spec.md:360:- [ ] **AC-21**：SKILL.md 中 D3 删除项不作为活跃机制存在——即 grep `workflows/build-spec/SKILL.md` 不命中 TodoWrite 待办模板调用、`[DECOMP]` 遥测发射、绑门自动写、Exit Conditions 重复行 作为机制性执行步骤；纯说明性引用（如"本 skill 不用 TodoWrite 待办模板"）不算违反，与 AC-16 同口径。这是 decision-log §7「D3 删除项不出现」的精确操作化：删除项作为机制不出现。
specs/m13b-build-spec-deepening/spec.md:411:- [RISK] FR-REVIEW-001 异源 3rd-review：依赖现有 3rd-review 基础设施可用（journal/collector/runner）；若基础设施不可用，审查步骤需降级处理并记录在质量事实契约第 3 项。
specs/m13b-build-spec-deepening/spec.md:441:| D3 | 删除：agenthub 3 道门（退出门/审查门/推进门）、TodoWrite 待办模板仪式、`[DECOMP]` 遥测、绑门自动写、Exit Conditions 重复行（CUT，无需 FR 覆盖） | — |

exec
/bin/bash -lc 'ls package.json vitest.config.* 2>/dev/null || true && rg -n "m13b-build-spec-deepening" package.json tests -S' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
package.json
vitest.config.mjs
tests/m13b-build-spec-deepening.test.mjs:2: * m13b-build-spec-deepening.test.mjs
tests/m13b-build-spec-deepening.test.mjs:13:const COUNT_PATH = join(REPO_ROOT, "specs", "m13b-build-spec-deepening", "spec-acceptance-count.json");
tests/m13b-build-spec-deepening.test.mjs:386:      "specs/m13b-build-spec-deepening/spec-acceptance-count.json must exist (FR-ACCOUNT-001 AC-17)");

codex
目前看，R3 新增的两个检查不是空检查：它们确实扫描 `workflows/build-spec/SKILL.md`，并且能覆盖 R2 指出的两个缺口。我要再跑一次相关测试，确认不是只靠用户提供的结果。
exec
/bin/bash -lc "node --input-type=module - <<'NODE'
const samples = [
  '若X则阻断流程',
  '失败时阻断执行',
  '命中时不阻断推进',
  '高危词黑名单：阻断 / BLOCK',
  '检测阻断语义词',
  '质量靠异源审查与人而非阻断式质量门',
  'TodoWrite({ todos })',
  '注：TodoWrite 是删除项',
  '## Exit Conditions',
  'stage_exit gate',
];
function ac16(l) {
  if ("'!l.includes('"'阻断')) return false;
  if (l.includes('不阻断') || l.includes('非阻断') || l.includes('不构成阻断') ||
      l.includes('不作为阻断') || l.includes('不得阻断') || l.includes('而非阻断')) return false;
  if (l.includes('黑名单') || l.includes('检测阻断') || l.includes('阻断语义') ||
      l.includes('禁止附加') || l.includes('记录事实')) return false;
  if (l.match(/Q[0-9]|F[0-9]|CONSTITUTION/)) return false;
  return true;
}
function ac21Todo(l) { return l.includes('TodoWrite') && "'!l.includes('"'//') && "'!l.includes('"'注：') && "'!l.includes('"'例如'); }
for (const s of samples) console.log("'`${JSON.stringify(s)} ac16=${ac16(s)} ac21Todo=${ac21Todo(s)}`);
NODE' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
"若X则阻断流程" ac16=true ac21Todo=false
"失败时阻断执行" ac16=true ac21Todo=false
"命中时不阻断推进" ac16=false ac21Todo=false
"高危词黑名单：阻断 / BLOCK" ac16=false ac21Todo=false
"检测阻断语义词" ac16=false ac21Todo=false
"质量靠异源审查与人而非阻断式质量门" ac16=false ac21Todo=false
"TodoWrite({ todos })" ac16=false ac21Todo=true
"注：TodoWrite 是删除项" ac16=false ac21Todo=false
"## Exit Conditions" ac16=false ac21Todo=false
"stage_exit gate" ac16=false ac21Todo=false

exec
/bin/bash -lc 'npm test -- --run tests/m13b-build-spec-deepening.test.mjs' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 340ms:

 RUN  v2.1.9 /Users/Hugh/Hugh/Project/workflowhub

 ✓ tests/m13b-build-spec-deepening.test.mjs (61 tests) 5ms

 Test Files  1 passed (1)
      Tests  61 passed (61)
   Start at  17:36:54
   Duration  157ms (transform 12ms, setup 0ms, collect 12ms, tests 5ms, environment 0ms, prepare 29ms)


codex
相关测试本地通过：`tests/m13b-build-spec-deepening.test.mjs` 里 61 个测试全绿。样例突变也显示 `若X则阻断流程`、`失败时阻断执行` 会被 AC-16 判为违规，`TodoWrite({ todos })` 会被 AC-21 判为违规。
exec
/bin/bash -lc 'npm test -- --run' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 3405ms:

 RUN  v2.1.9 /Users/Hugh/Hugh/Project/workflowhub

 ✓ tests/m12-spec-analyze.test.mjs (33 tests) 5ms
 ✓ tests/m12-spec-tasks.test.mjs (20 tests) 4ms
 ✓ tests/m12-build-plan-v1.test.mjs (35 tests) 4ms
 ✓ tests/m12-spec-plan.test.mjs (17 tests) 4ms
 ✓ tests/five-skills-present.test.mjs (59 tests) 8ms
 ✓ tests/m13b-build-spec-deepening.test.mjs (61 tests) 9ms
 ✓ tests/build-code-diff-only.test.mjs (23 tests) 3ms
 ✓ tests/stage-result-contract.test.mjs (17 tests) 3ms
 ✓ tests/facts-subschema.test.mjs (37 tests) 3ms
 ✓ tests/m13-make-decision.test.mjs (163 tests) 23ms
[collectFacts warn] review_invoked not derivable for exec-9; defaulting to false.
 ✓ tests/metric-scan.test.mjs (24 tests) 95ms
 ✓ tests/baseline.test.mjs (19 tests) 4ms
[collectFacts warn] review_invoked not derivable for exec-cold; defaulting to false.
 ✓ tests/m12-templates.test.mjs (19 tests) 3ms
[boundary-confirm warn] boundary decision write failed for exec-bound-writefail
 ✓ tests/boundary-confirm.test.mjs (10 tests) 16ms
 ✓ core/__tests__/parse-framework-config.test.mjs (8 tests) 3ms
 ✓ tests/knowledge-card.test.mjs (19 tests) 4ms
 ✓ tests/spike-intake-design.test.mjs (7 tests) 9ms
[collectFacts warn] review_invoked not derivable for exec-d; defaulting to false.
 ✓ tests/execution-record.test.mjs (14 tests) 3ms
[collectFacts warn] review_invoked not derivable for exec-h; defaulting to false.
 ✓ tests/stage-quality.test.mjs (7 tests) 115ms
 ✓ core/__tests__/resolve-path.test.mjs (12 tests) 3ms
 ✓ tests/m12-reuse-registry.test.mjs (15 tests) 2ms
 ✓ tests/verify-code-facts.test.mjs (19 tests) 5ms
[collectFacts warn] review_invoked not derivable for exec-gap; defaulting to false.
 ✓ tests/metrics-collector.test.mjs (25 tests) 325ms
[collectFacts warn] review_invoked not derivable for exec-facts-001; defaulting to false.
 ✓ tests/build-code-review.test.mjs (12 tests) 3ms
[collectFacts warn] review_invoked not derivable for exec-facts-002; defaulting to false.
 ✓ core/__tests__/validate-contract.test.mjs (7 tests) 2ms
 ✓ tests/m12-subskill-exclusion.test.mjs (2 tests) 5ms
 ✓ core/__tests__/load-config.test.mjs (8 tests) 4ms
 ✓ tests/build-code-facts.test.mjs (10 tests) 3ms
[collectFacts warn] fact write failed for exec-facts-003
 ✓ tests/fact-collector.test.mjs (3 tests) 168ms
 ✓ tests/verify-code-freshness.test.mjs (9 tests) 5ms
 ✓ core/__tests__/check-contract.test.mjs (13 tests) 411ms
 ✓ tests/verify-code-capture.test.mjs (15 tests) 374ms
 ✓ core/__tests__/check-anti-host.test.mjs (17 tests) 426ms
 ✓ tests/contract-freeze.test.mjs (5 tests) 1ms
 ✓ core/__tests__/kernel.test.mjs (9 tests) 270ms
 ✓ core/__tests__/protected-paths.test.mjs (7 tests) 1ms
 ✓ tests/reuse-registry.test.mjs (3 tests) 2ms
 ✓ tests/build-code-target.test.mjs (4 tests) 1ms
 ✓ tests/smoke.test.mjs (1 test) 1ms
[collectFacts warn] review_invoked not derivable for smoke-test-exec-id-001; defaulting to false.
 ✓ tests/metrics-smoke.test.mjs (4 tests) 71ms
 ✓ tests/agenthub-baseline.test.mjs (9 tests) 366ms
 ✓ tests/build-code-capture.test.mjs (23 tests) 1327ms
 ✓ core/__tests__/check-extensibility.test.mjs (13 tests) 2112ms
   ✓ FR-EXT-001: verifySwappability — stub dispatched + core diff empty > resolves successfully with { passed: true } 316ms
 ✓ core/__tests__/run-checks.test.mjs (11 tests) 2689ms
   ✓ FR-CI-001: aggregate mode (no args) > exits 0 on a clean repo 628ms
   ✓ FR-CI-001: aggregate mode (no args) > stdout mentions check-anti-host (checker was invoked) 422ms
   ✓ FR-CI-001: aggregate mode (no args) > stdout mentions check-extensibility (checker was invoked) 327ms
   ✓ FR-CI-001: aggregate mode (no args) > stdout mentions check-contract (checker was invoked) 416ms
   ✓ FR-CI-001: non-zero propagation > exits non-zero when a checker signals failure 359ms
   ✓ FR-CI-001: non-zero propagation > reports which checker failed 348ms

 Test Files  44 passed (44)
      Tests  848 passed (848)
   Start at  17:36:59
   Duration  3.23s (transform 435ms, setup 0ms, collect 1.19s, tests 8.90s, environment 6ms, prepare 1.55s)


codex
{"verdict":"pass","round":3,"blocking":[],"non_blocking":[]}
hook: Stop
hook: Stop Completed
tokens used
67,421

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
