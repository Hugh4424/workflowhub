# Phase 9 coverage audit

Current source identity is `88cb76865eb446e7c10a2f509b311ae1fecf9c0e20a210e604eaf45e2e2af9d2`. A simple AC names one focused,
hash-checked oracle; a matrix AC names a fixed, hash-checked `oracles[]` set.
Every member occurs in the same canonical Vitest execution.

The current direct matrix is `evidence/phase-9/final-targeted-matrix-final-rebind.json`: 18 requested test
files expanded to 37 suites / 313 passing tests. It contains every AC-01..AC-15
oracle plus the current stage, task-handle, and risk contract tests.

The final command set was rerun against this source tree: inventory, clean-install,
`npm test`, `npm run check`, the direct matrix, hard-gate checks, and
`git diff --check`. Their hash-bound outputs are in
`evidence/phase-9/final-gates.json`.

`docs/architecture/final-complexity-report.json` contains the current full
`buildReport()` payload, including readable budgets, hotspots, exact hard-zero
audit scope, and the tracked-tree SHA-256.
