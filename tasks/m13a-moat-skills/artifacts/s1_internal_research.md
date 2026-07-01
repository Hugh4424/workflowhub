# S1 Internal Research — m13a-moat-skills

## 1. How Each Moat Action Is Currently Wired in make-decision SKILL.md (v2.0.0)

### talk#1 (S2), talk#2 (S4), talk#3 (S7)

**Current form**: Fully inlined in SKILL.md. No separate skill file, no delegation syntax. Each talk round is described as a sequential Q&A procedure within the SKILL.md body itself.

- S2 talk#1: presents internal research summary, asks Q1 (external research needed?), waits for user reply.
- S4 talk#2: baseline 台账 + asks Q2 (framing/direction questions), waits for user reply.
- S7 talk#3: synthesizes S5/S6 findings, asks Q3 (follow-up clarifications per impact rank), waits for user reply.

**Invocation form**: Pure inline prose. No `invoke skill:` syntax, no env var, no path reference.
**Gap**: No `skills/talk-with-zhipeng/SKILL.md` exists. The "按影响排序 (FR-TALK-02)" and "一次只问一个问题 (FR-TALK-01)" rules are stated inline but not in a canonical delegatable skill.

---

### blind-review / intake-review (S5)

**Current form**: S5 calls a "单次独立盲审" that invokes `intake-decision-review` — a single unified review covering direction reasonableness, problem framing, and scope boundaries simultaneously. References:
- Reads `THIRD_REVIEW_RUNNER` env var (default: `run-heterologous-review.mjs`) for the runner binary.
- Reads `REVIEW_DISPATCH_CONFIG` env var (default: empty, uses internal default dispatch).
- Invokes `intake-decision-review` (combined) via the runner.
- Output: `tasks/{task-id}/artifacts/make-decision-review.md` with exactly 3 findings.
- Failure: `fallback_used: true` is fatal; must not silently degrade.

**Invocation form**: Named reference to `intake-decision-review` (string name, not a path), driven by env-var-configured runner binary.
**Gap**: No `skills/intake-direction-review/SKILL.md`, `skills/intake-framing-challenge/SKILL.md`, `skills/intake-scope-review/SKILL.md`, or `skills/intake-review-orchestrator/SKILL.md` exist. The three "intake-*" skills are listed by name but not instantiated as in-repo files. The orchestrator is also not an in-repo file.

---

### grill (S7)

**Current form**: S7 step 2 uses "纯委托 (pure delegation)" syntax: delegates to `grill-with-docs-lite` skill.
- Output: `tasks/{task-id}/artifacts/make-decision-grill-with-docs.md`
- Failure (non-blocking): if skill path unreachable or call fails, write failure artifact and continue.
- The name `grill-with-docs-lite` is referenced as a skill name but has no in-repo SKILL.md.

**Invocation form**: Named reference (`grill-with-docs-lite`), pure delegation — make-decision does not inline grill logic.
**Gap**: No `skills/grill-with-docs-lite/SKILL.md` exists.

---

### debate (S5 gate + S7 gate)

**Current form**: Controlled via env vars `MAKE_DECISION_DEBATE_PATH` (default `/Users/Hugh/Hugh/Project/debate`) and `MAKE_DECISION_SKIP_DEBATE`. Two debate gates exist:
- S5 debate gate: triggers if any `blocking` findings from blind-review. Path validity checked; if invalid → skip with log.
- S7 debate gate: same mechanism, re-checks env.
- Reads `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` to decide five-court vs. single-agent mode.

**Invocation form**: External path via env var. Debate is explicitly external and stays that way — M13a does NOT need to create a debate skill.

---

### orchestrator (S7, step "orchestrator 审查 + 第二次 debate")

**Current form**: S7 step 4 references "orchestrator 审查" but does not explicitly call a named orchestrator skill. It describes orchestrator behavior inline (sequence: grill → draft → orchestrator review → second debate gate).

**Gap**: The `~/.claude/skills/intake-review-orchestrator/SKILL.md` exists externally but has no in-repo counterpart. M13a must create `skills/intake-review-orchestrator/SKILL.md`.

---

## 2. Existing In-Repo Skills — File Convention

**Observed from `skills/decision-log/SKILL.md`**:

```
---
name: <skill-name>
description: <one-line description>
---

<!-- component skill — physically independent, invoked independently by foreman subagent -->
<!-- source/origin: external-adapted; source path: <path> -->

# <skill-name>

This is a **component skill**. Does NOT produce its own `stage-result`. [...]

## Goal
## Input
## Output artifact file
## What to do
## "agenthub-clean" requirement
## Metric record caller responsibility
```

Key conventions:
- Frontmatter: `name`, `description` (no `version` in component skills, but main workflow skills have `version`)
- HTML comment block: states component-skill identity + source/origin path
- Sections: Goal, Input, Output artifact file, What to do, agenthub-clean requirement, Metric record caller responsibility
- Explicit statement that the skill is "pure prompt, no runtime entry point, no executable code, no agenthub-internal coupling"
- Metric record responsibility delegated to caller, with JSON schema for `recordSkeleton`

---

## 3. reuse-registry.md — Current Format and Required New Rows

**Format** (table, 3 columns):
```
| skill 名 | 复用类别 | 来源路径 |
```

**Current relevant rows**:
- `3rd-review` | 外部依赖 | `packages/core/agenthub/skills/3rd-review`
- `debate (make-decision 护城河)` | 外部依赖 | `~/.claude/skills/debate` (inferred from env var path)

**6 new rows to add**:

| skill 名 | 复用类别 | 来源路径 |
|---|---|---|
| `talk-with-zhipeng` | 外部改造适配 | `~/.claude/skills/office-hours/SKILL.md` + `~/.claude/skills/superpowers-brainstorming/` |
| `grill-with-docs-lite` | 外部改造适配 | `~/.claude/skills/grill-with-docs/SKILL.md` |
| `intake-direction-review` | 外部改造适配 | `~/.claude/skills/intake-review-orchestrator/SKILL.md` (sections) + `3rd-review` heterologous chain |
| `intake-framing-challenge` | 外部改造适配 | same |
| `intake-scope-review` | 外部改造适配 | same |
| `intake-review-orchestrator` | 外部改造适配 | `~/.claude/skills/intake-review-orchestrator/SKILL.md` |

---

## 4. Source Skills — Availability and Location

| Source | Path | Available | Notes |
|---|---|---|---|
| `office-hours` | `~/.claude/skills/office-hours/SKILL.md` | YES | YC Office Hours pattern; 2 modes; has gstack gbrain context |
| `superpowers-brainstorming` | `~/.claude/skills/superpowers-brainstorming/` (dir) | YES | Listed in `~/.claude/skills/` |
| `grill-with-docs` | `~/.claude/skills/grill-with-docs/SKILL.md` | YES | Full version (not lite); asks relentlessly, waits per Q; has CONTEXT.md + ADR awareness |
| `intake-review-orchestrator` | `~/.claude/skills/intake-review-orchestrator/SKILL.md` | YES | Confirmed exists |
| `3rd-review` | `~/.claude/skills/3rd-review.md` | YES | Heterologous chain; standalone.sh; runner configurable via THIRD_REVIEW_RUNNER |
| `debate` | `/Users/Hugh/Hugh/Project/debate` (env var default) | NOT an in-repo skill | External only; stays external |
| `agenthub/skills/3rd-review` | `packages/core/agenthub/skills/3rd-review` | NOT FOUND | Path referenced in registry but directory does not exist at that path in repo |

**Key finding**: `packages/core/agenthub/skills/` does not exist in the repo. The 3rd-review external source is `~/.claude/skills/3rd-review.md`.

---

## 5. Constitution Hard Rules Bearing on This Task

From `CONSTITUTION.md` v1.1.0:

- **F1 薄核心**: make-decision core must not inline moat logic — must delegate to skills. This is exactly what M13a enforces by externalizing the 6 moat skills.
- **F2 窄契约**: Each moat skill must expose a narrow interface (input → artifact path). Internal orchestration steps must not bleed into the caller's contract.
- **Q-series (independent review)**: The intake-* skills and orchestrator must guarantee independence — heterologous chain, non-self-review. The `fallback_used: true` = fatal rule (no silent degradation) is an expression of this.
- **F10 自动化按真实收益添加** (added M6): Do not add gates or automation that block progression without real benefit. All moat skills must have non-blocking fallback paths (already modeled by make-decision's failure branches).
- **Let-it-crash**: Errors must be explicit, not swallowed. Missing skill path → fail visibly, not silently.
- **agenthub-clean**: Each skill must be pure-prompt, no executable code, no agenthub-internal coupling. Invocable by any foreman.

---

## 6. Test Touchpoints

Existing test file: `tests/m13-make-decision.test.mjs`
- Pattern: vitest + node:assert, `existsSync` + `readFileSync`
- Tests: frontmatter block present, `name:`/`version:`/`description:` fields, registry rows by text content

New tests for m13a should assert:
1. Each of the 6 new `skills/*/SKILL.md` files exists
2. Each has a frontmatter block (`---` delimited)
3. Each frontmatter has `name:` and `description:`
4. Each is registered in `reuse-registry.md` (text content check)
5. `workflows/make-decision/SKILL.md` references the new in-repo paths (text content check)

Related test file to check: `tests/spike-intake-design.test.mjs` — may already assert on intake skill shape.
