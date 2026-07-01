# S0 Context — m13a-moat-skills

## Task Background

**Milestone**: M13a "护城河能力内置化补交付"
**Parent issues**: ZHI-23 / ZHI-27

M13 deepened `workflows/make-decision/SKILL.md` (v2.0.0, 583 lines) but left the six moat-action capabilities as either inlined prose or external `~/.claude/skills/` dependencies — never promoted to standalone in-repo `skills/` files with their own SKILL.md. M13a must create those six skill files and wire them into the existing make-decision contract.

## Deliverables Required

| # | Skill file to create | Source to adapt |
|---|---|---|
| 1 | `skills/talk-with-zhipeng/SKILL.md` | `~/.claude/skills/office-hours/SKILL.md` + superpowers brainstorming; self-built question-weight/impact-ranking |
| 2 | `skills/grill-with-docs-lite/SKILL.md` | `~/.claude/skills/grill-with-docs/SKILL.md` (lite variant) |
| 3 | `skills/intake-direction-review/SKILL.md` | thin shell over 3rd-review heterologous chain |
| 4 | `skills/intake-framing-challenge/SKILL.md` | thin shell over 3rd-review heterologous chain |
| 5 | `skills/intake-scope-review/SKILL.md` | thin shell over 3rd-review heterologous chain |
| 6 | `skills/intake-review-orchestrator/SKILL.md` | `~/.claude/skills/intake-review-orchestrator/SKILL.md`, adapted to make-decision contract |

Additionally:
- Update `workflows/make-decision/SKILL.md` S7-grill and S5-blindreview references to point to in-repo skill paths
- Update `reuse-registry.md` with 6 new rows
- Add/update tests (file existence, frontmatter)

## Known Constraints

1. **宪法 F1 薄核心**：skills must be pure-prompt, no runtime coupling; core (make-decision) only delegates, does not inline capability.
2. **宪法 F2 窄契约**：each skill exposes a narrow, stable interface; internal steps are not exposed to callers.
3. **宪法 Q-series**：independent review required; self-review/self-approval forbidden. The three `intake-*` skills exist precisely to enforce this via the heterologous chain.
4. **No blocking quality gates** (F10 / 宪法 amendment 1.1.0): skills must not introduce gates that block workflow progression. Non-blocking fallback paths must exist.
5. **agenthub-clean**: skills must be pure prompt, no executable code, invocable by any foreman subagent without harness dependency (pattern from `skills/decision-log/SKILL.md`).
6. **Metric record caller responsibility**: component skills do NOT write their own stage-result; the calling foreman is responsible.
7. **Existing test pattern**: `tests/m13-make-decision.test.mjs` uses vitest + node:assert, checks file existence, frontmatter fields (name/version/description), and registry rows. New tests for m13a should follow this pattern.

## Core Terms

| Term | Meaning |
|---|---|
| 护城河 (moat) | Defensive capability step in make-decision that strengthens decision quality |
| talk | Three-round Socratic Q&A with user (S2/S4/S7 in make-decision) |
| grill | Deep challenge session against docs/domain model (S7 in make-decision) |
| blind-review / intake-review | Independent heterologous 3rd-party review of direction/framing/scope (S5 in make-decision) |
| debate | Adversarial debate skill (external, path-controlled via env var) |
| orchestrator | Thin coordination shell that sequences intake-direction-review, intake-framing-challenge, intake-scope-review |
| heterologous | Cross-engine, non-self review (different LLM provider than current host) |
| component skill | A skill that produces only an artifact, no stage-result; caller writes the metric record |
| reuse-registry.md | Registry table of all skills with their reuse category and source path |
