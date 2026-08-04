# wh-review report — build-code

- attempt: `c61ef1f7-b30c-4407-b60a-76c4abee19bb`
- task: `workflowhub-complexity-governance-v3-20260802`
- subject: `worktree`
- snapshot: `4bd4aec7b2d4a58c7a87ec2a2c6955b25d8fcf2b`
- material: `cb1eca05ff6c3a7b5c0b7453b644d769fadaf13b3b7d85cf776d47fc4c391e94`
- terminal status: `semantic`
- verdict: `pass`

## Routing and coverage

- policy: `wh_review.v2/initial`; configured mode `full_only`
- requested profiles: `kimi/coding`, `cursor/grok`
- requested profile pins: `kimi/coding` priority=11; model=kimi-code/kimi-for-coding; effort=null; thinking=true | `cursor/grok` priority=15; model=cursor-grok-4.5-high; effort=null; thinking=null
- eligible profiles: `kimi/coding`, `cursor/grok`
- same-source exclusions: none
- coverage: `parallel_external`; 1/1 valid reviewers
- attempt classification: completed=1, OUTPUT_INVALID=0, PROVIDER_UNAVAILABLE=0, TIMEOUT=0, SAME_SOURCE=0, UNKNOWN=1
- finding classification: valid=0, invalid_anchor=2, minor=0, not_adopted=0; quality denominator=1; failed duration=49506 ms

## Provider runs

| Provider | Model / thinking | Duration | Token usage | Runtime / session state | Status |
| --- | --- | ---: | --- | --- | --- |
| cursor/grok | cursor/cursor-grok-4.5-high; effort=UNAVAILABLE; thinking=UNAVAILABLE | 49506 ms | TOKENS_UNAVAILABLE | d78a96f0-1ac0-44c1-b711-7bae20ca9179/9f2eb6f7-c91a-4a92-bd04-99372adfa596; state=SESSION_PATH_UNAVAILABLE | failed (PROVIDER_PERMISSION_DENIED) |
| kimi/coding | kimi/kimi-code/kimi-for-coding; effort=UNAVAILABLE; thinking=true | 181849 ms | TOKENS_UNAVAILABLE | d78a96f0-1ac0-44c1-b711-7bae20ca9179/3be91028-07b2-42f3-84e7-34e7ccfac8f0; state=SESSION_PATH_UNAVAILABLE | completed |

Provider unavailable diagnostics:

- cursor/grok: PROVIDER_PERMISSION_DENIED — Cursor Agent attempted a tool outside the scoped review bundle

## Findings and adjudication

### F-621a863a04e4 — blocking / invalid_evidence

- providers: `kimi/coding`; adapters: 1; evidence: `invalid_anchor`
- finding: requirements/phase_coverage.json:1 — Phase review coverage is recorded as 'unavailable' with no checkpoint, so no formal phase review trace exists for the implementation phases.
- root cause: The build-code integration contract (contracts/build-code.md) treats '历史正式审查没有 trace' as MATERIAL_INCOMPLETE. The supplied phase-review-coverage.v1 file explicitly sets 'status':'unavailable' and 'checkpoint':null, so per-phase review results, tree/hash continuity, and GREEN receipts cannot be verified.
- correction direction: Provide a completed phase-review-coverage.v1 that certifies each implementation Phase with its review result, snapshot/tree binding, and GREEN receipt before re-running integration review; do not substitute cumulative diff, raw logs, or focused review-material tests.

### F-e4a1c62f3091 — blocking / invalid_evidence

- providers: `kimi/coding`; adapters: 1; evidence: `invalid_anchor`
- finding: canonical-evidence.json:1 — Canonical evidence container is empty, providing no broker-verified receipts or canonical artifacts.
- root cause: Integration review requires binding to the implementation receipt, fresh test receipt, and final snapshot. An empty canonical-evidence.json ('[]') means no canonical receipts are available for the reviewer to anchor claims about implementation or test completion.
- correction direction: Populate canonical-evidence.json with the broker-verified implementation receipt, green test receipt, and any required canonical references, or defer integration review until canonical evidence is delivered.

## Provider finding details

### kimi/coding — revise_required

- summary: Integration review packet lacks completed phase-review trace and canonical evidence: requirements/phase_coverage.json records status 'unavailable' and canonical-evidence.json is empty. Per the build-code integration contract, this is MATERIAL_INCOMPLETE because integration closure requires a certified phase-review-coverage.v1 trace and canonical receipts binding the final snapshot, not just a focused review-material-repair GREEN receipt.
- blocking: requirements/phase_coverage.json:1 — Phase review coverage is recorded as 'unavailable' with no checkpoint, so no formal phase review trace exists for the implementation phases.
  - root cause: The build-code integration contract (contracts/build-code.md) treats '历史正式审查没有 trace' as MATERIAL_INCOMPLETE. The supplied phase-review-coverage.v1 file explicitly sets 'status':'unavailable' and 'checkpoint':null, so per-phase review results, tree/hash continuity, and GREEN receipts cannot be verified.
  - correction direction: Provide a completed phase-review-coverage.v1 that certifies each implementation Phase with its review result, snapshot/tree binding, and GREEN receipt before re-running integration review; do not substitute cumulative diff, raw logs, or focused review-material tests.
- blocking: canonical-evidence.json:1 — Canonical evidence container is empty, providing no broker-verified receipts or canonical artifacts.
  - root cause: Integration review requires binding to the implementation receipt, fresh test receipt, and final snapshot. An empty canonical-evidence.json ('[]') means no canonical receipts are available for the reviewer to anchor claims about implementation or test completion.
  - correction direction: Populate canonical-evidence.json with the broker-verified implementation receipt, green test receipt, and any required canonical references, or defer integration review until canonical evidence is delivered.

Native CLI session files and broker runtime paths stay provider-private; reports expose only the public managed result.
