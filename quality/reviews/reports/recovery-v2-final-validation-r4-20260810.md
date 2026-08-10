# WorkflowHub Multica recovery v2 — final local validation (2026-08-10)

Worktree: `/Users/Hugh/Hugh/Project/workflowhub-worktrees/workflowhub-multica-recovery-v2`
Branch: `codex/workflowhub-multica-recovery-v2`
Base: `main@6efd67593ef1e191a4ab929a75402905bc6b49ce`

## Commands and results

- `npm test`: exit `0`; safe `145` files, `1245 passed`, `1 skipped`; exclusive `2` files, `31 passed`.
- Targeted regression: exit `0`; six affected files, `132 passed`:
  `tests/contract/stage-completion.test.mjs`,
  `tests/contract/stage-progress-contract.test.mjs`,
  `tests/interaction-quality-contract.test.mjs`,
  `tests/e2e/vnext-five-stage-current.test.mjs`,
  `tests/integration/vnext-official-stage-run.test.mjs`,
  `tests/final-cutover-guards.red.test.mjs`.
- `npm run check`: exit `0`; markdownlint `136` files; structure, anti-host, run-checks, skill closure, and local package smoke all passed.
- `npm run compare:public-behavior`: exit `0`; seven public behavior families classified `approved_internal_change`; `authorize` classified `approved_bug_fix`.
- `npm run probe:public-behavior`: exit `0`; `10 passed`.
- `node tools/architecture/public-behavior-baseline.mjs verify --baseline=tests/fixtures/public-behavior-baseline/v1`: exit `0`; `7 behaviors / 8 probes`.
- `git diff --check`: exit `0`.

## Scope-specific conclusions

- Official `run` rejects caller-owned `audit`; no production audit writer exists. Missing audit is now preserved as `audit_gaps`, not completion `missing_items`.
- `build-spec` no longer has an audit-only `traceability` completion predicate.
- `build-code` no longer has the historical `tasks_complete` completion predicate; task history remains an audit fact through existing phase certification.
- `sectionHasContent` now parses current Markdown headings line-by-line, so the Chinese decision-log sections used by make-decision are actually checked.
- Four-material readiness remains separate from quality completion. Missing quality/review/audit facts are not false passes and do not block same-task repair.
- No Multica source, provider/model/API Key, daemon, localhost browser route, commit, push, merge, cleanup, or synchronization was performed.

This is an immutable validation fact. It does not authorize irreversible delivery actions.
