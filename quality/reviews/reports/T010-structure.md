# WorkflowHub Multica recovery v2 — T010 structure and history facts

- Worktree: `/Users/Hugh/Hugh/Project/workflowhub-worktrees/workflowhub-multica-recovery-v2`
- Branch: `codex/workflowhub-multica-recovery-v2`
- Base: `main@6efd67593ef1e191a4ab929a75402905bc6b49ce`
- Scope: current index, skill closure, deletion inventory, history retention, public behavior, and Phase D subject identity

## Results

- `node tools/architecture/history-inventory.mjs verify-unchanged`: exit `0`; `461` historical files before and after; no byte drift.
- `node tools/architecture/phase0-deletion-disposition.mjs --check`: exit `0`; deletion disposition, move-map, retention, and inventory facts are valid.
- `node tools/architecture/inventory.mjs --check`: exit `0`; `1174` delivery files, exactly one disposition each.
- `node tools/architecture/complexity-report.mjs --check-hard-gates`: exit `0`; report reproducible and dedicated recovery hard-zero remains `0`.
- `node tools/architecture/reference-audit.mjs --check`: exit `0`; unexpected violations `0`.
- `node tools/architecture/retention-audit.mjs --check`: exit `0`; historical bytes unchanged; M16/M17 unknown remains diagnostic/non-gating.
- `npm run check:skill-closure`: exit `0`; five changed skill bundles resolve and their catalog hashes match.
- Bundle hash readback:
  - `grill-with-docs`: `87961a81e4ca775d1630c715604228147e432d92009c389e2469af069617d49c`
  - `spec-plan`: `0bf4d23484ac31e0dc71ebf3149b91ee51ab4fc8647e609413cb61f8609329b1`
  - `spec-tasks`: `ea7f2dc50d5bff4751a815ba617f9e26f50484833ab364e78cd574dc459e71a8`
  - `testing-system-blueprint`: `c59ba3c2def665e78aec7fe5fe70effa1b6531877dd83b3a39c192e3308aec2f`
  - `wh-review`: `73248bccd6992326a79bb1a669ce6a96050d627ea3b8dde81f32411dea9122eb`
- Phase D raw subject readback using `git show --format=fuller --binary --no-ext-diff --no-color 06ff0af` exactly matches the provider fact: SHA-256 `85a59b3181fb3e4d6e631d2c54a7bb8443eed9713c12cfea4c2dab2db0d378b3`, `95620` bytes; `git diff --check` is clean; the subject contains exactly the 14 reviewed paths.
- `node tools/architecture/public-behavior-baseline.mjs compare --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf --candidate=worktree`: exit `0`; public changes classified as approved internal changes/approved bug fix.
- `npm run probe:public-behavior`: exit `0`; `10` tests passed.

## Boundary

The architecture report still exposes non-gating complexity budgets above their historical targets; these are diagnostic facts, not completion or work-readiness gates. No second ledger, receipt replacement, lock, bridge, successor/recovery object, public command, Multica source/config change, or main/origin change was introduced by T010.

This is an immutable structure fact. It does not authorize push, merge, cleanup, or Multica synchronization.
