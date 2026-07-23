# wh-review v2 — validation record

## Configuration

On 2026-07-23, the real host configuration at
`~/.config/workflowhub/config.json` loaded successfully against
`~/.config/3rd-review/config.json`.

- The build-code route is exactly `kimi/coding`, `codex/terra`, `full_only`;
  route configuration has no packet byte budget.
- Build-spec, build-plan and verify-code use `full_on_structural_rework`: ordinary or unverified repairs make no second provider call; only complete bound ledgers that explicitly declare structural change use the same initial high-strength group for at most one fresh full review. Optional response-ledger evidence is an external `verified|unverified` audit record, never a pass gate. Verify-code runs its own configured external quality review only after fresh tests and acceptance evidence; that non-gate fact never replaces build-code acceptance lineage.
- With a Codex host, only `kimi/coding` remains eligible; with a Kimi host,
  only `codex/terra` remains eligible. The complete candidate pair is still
  sent once to 3rd-review; it returns the same-adapter member as
  `SAME_SOURCE`. Both routes are recorded as `single_external` coverage.
- Enabled registered profiles are `codex/terra`, `claude-code/opus`,
  `kimi/k3`, `kimi/coding`, `pi/deepseek`, `pi/k3`, `pi/coding`, and
  `antigravity/flash`.
- Both `opencode` and `opencode/glm` are explicitly disabled and absent from
  all V2 routes, per the user's instruction to defer the local adapter.

`loadTrustedThirdReviewConfig()` resolves the deployed V2 broker command and
all configured routes. With a Codex/Terra host, the build-code broker group is
the complete `kimi/coding`, `codex/terra` pair and local eligible quorum is
only `kimi/coding`; broker attestation supplies the `SAME_SOURCE` fact.
`3rd-review doctor` passes with this configuration.

## Regression boundary

The final focused suite proves:

- normal repair writes only external audit data and never becomes a stage receipt;
- absent/invalid evidence is recorded as `unknown/unverified`, without faking `fixed` or `pass`;
- absent/invalid ledger returns `none` plus an `unknown/unverified` audit, while declared structural repair gets at most one fresh initial-group full review and its full packet excludes `response_ledger`;
- build-spec/build-plan stage-runtime E2E advances from `revise_required` as a quality fact;
- accepted risk is visibly surfaced at build-plan/verify human boundaries, without changing task schema or gating; and
- build-code remains `full_only`; V2 configuration rejects a closure-capable
  non-code route; and
- complete candidate groups, not host-filtered groups, are sent to the broker.

Targeted routing/runner/controller/schema tests pass. The complete WorkflowHub
suite passes: 102/102 files and 956/956 tests. `git diff --check` passes.
The broker suite passes: 196/196 tests and `git diff --check` passes.

Real independent reviews are recorded in
`reports/code-review-closure-001.md`: Pi/DeepSeek found and verified one
fallback validation fix; Kimi/coding iterated through the final group/round
semantics and the final 54,489-byte focused packet returned `pass` with no
findings. These packets contain only selected implementation excerpts and
contract facts, never the project or raw logs.

No time, token, packet-size, output-size, or repeated-finding cap was used to
finish either live review.
