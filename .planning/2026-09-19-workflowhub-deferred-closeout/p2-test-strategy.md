# P2 test strategy

- RED proof: existing BR behavior was exercised before each minimal production fix. T003/T004 are a recorded pre-existing-green exception because the BR worktree was already dirty and the required behavior was already present.
- GREEN suites:
  - `node --test test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs` → 27/27
  - `node --test test/recovery-policy.test.mjs` → 5/5
  - `node --test test/broker.test.mjs` → 36/36
  - `node --test test/attachments-protocol.test.mjs` → 47/47
- Negative coverage retained: structured private path, malformed member, timeout/retry guard, missing configured provider candidate, and all-body output cases.
- Limits: no live provider invocation; no health map change in P2; no commit/push/merge.
