# WorkflowHub Multica recovery v2 — final validation facts after REVISE fixes

- Date: 2026-08-09
- Worktree: `/Users/Hugh/Hugh/Project/workflowhub-worktrees/workflowhub-multica-recovery-v2`
- Base: clean `main@6efd67593ef1e191a4ab929a75402905bc6b49ce`
- Public-behavior candidate tree observed by compare: `1cab69a7141fe591e36c5fe477e833cb8e87af86`

## Command facts

- `npm test`: exit `0`; safe suite `145` files, `1243 passed`, `1 skipped`; exclusive suite `2` files, `31 passed`.
- `npm run check`: exit `0`; Markdown lint `0` errors over `131` files; constitutional structure `21` anchors passed; anti-host scanned `57` files with no violations; all checks, skill closure, and five-stage package smoke passed.
- `npm run compare:public-behavior`: exit `0`; baseline `c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`; all seven public behaviors classified as approved internal changes, with `authorize` classified as an approved bug fix.
- `npm run probe:public-behavior`: exit `0`; `10` tests passed.
- `node tools/architecture/public-behavior-baseline.mjs verify`: exit `0`; baseline contains `7` behaviors and `8` probes.
- `git diff --check`: exit `0`.

## Fixes covered by this snapshot

- `make-decision` completion now requires the decision/interaction/review facts that its documented flow can produce; optional `research` and `grill` evidence remain recordable but are not impossible completion gates.
- Integration review reads current H2–H4 task cards, current `状态`/`执行事实`/`证据`/`Trace` fields, and content-addressed `quality/evidence/` or `quality/tests/` records; a current-format fixture proves Task→AC→change mapping.
- Stage handoff `stage_summary` and system `confirmation_summary` have direct alignment and drift regression coverage.
- Dead runtime-facade `publish-*` mappings are removed.

## Boundary

These are immutable validation facts, not a new runtime permit or current material. No Multica source, provider/model/API key/daemon configuration, commit, push, merge, cleanup, or synchronization was performed.
