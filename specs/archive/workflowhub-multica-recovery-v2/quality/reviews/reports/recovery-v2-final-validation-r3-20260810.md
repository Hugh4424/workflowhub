# WorkflowHub Multica recovery v2 — final validation facts after namespace and parser fixes

- Date: 2026-08-10
- Worktree: `/Users/Hugh/Hugh/Project/workflowhub-worktrees/workflowhub-multica-recovery-v2`
- Branch: `codex/workflowhub-multica-recovery-v2`
- Base: clean `main@6efd67593ef1e191a4ab929a75402905bc6b49ce`
- Public-behavior candidate tree observed by compare before this report: `c1fe2bc69c6cb6809651dce2839002021571583c`

## Command facts

- `npm test`: exit `0`; safe suite `145` files, `1245 passed`, `1 skipped`; exclusive suite `2` files, `31 passed`.
- `npm run check`: exit `0`; Markdown lint `0` errors over `132` files; constitutional structure `21` anchors passed; anti-host scanned `57` files with no violations; all checks, skill closure, and five-stage package smoke passed.
- `npm run compare:public-behavior`: exit `0`; baseline `c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`; all seven public behaviors classified as approved internal changes, with `authorize` classified as an approved bug fix.
- `npm run probe:public-behavior`: exit `0`; `10` tests passed.
- `node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`: exit `0`; baseline contains `7` behaviors and `8` probes.
- `git diff --check`: exit `0`.

## Fixes covered by this snapshot

- vNext canonical records, implementation diffs, manual delivery close, acceptance evidence, and verify evidence now write only under `quality/`; existing legacy `evidence/` remains read-only compatible where the reader explicitly supports it.
- Stage-level publication lock is removed; TaskKernel remains the single atomic canonical-write authority.
- Current H2 task cards require non-empty line-local execution facts; empty execution facts cannot be silently replaced by the following evidence line.
- Current tests and fixtures use the vNext quality namespace; a TaskHandle regression test rejects new root-level evidence writes.

## Boundary

These are immutable validation facts, not a new runtime permit or current material. No Multica source, provider/model/API key/daemon configuration, commit, push, merge, cleanup, or synchronization was performed. A fresh `opencode/v4flash` review is still required before T6 may be marked complete.
