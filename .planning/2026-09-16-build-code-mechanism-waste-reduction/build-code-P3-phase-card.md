# Build-code Phase P3 Card

- Goal: carry an explicit positive `minimum_heterologous` through the existing 3rd-review request, validate it against distinct underlying model identities, and preserve real member terminal states (`completed`, `failed`, `cancelled`) without treating a live/running member as failed.
- Allowed files: `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/skill-bundle.json`, `tests/contract/external-threshold-contract.test.mjs`.
- Covered ACs: `AC-EXT-001`, `AC-EXT-002`, `AC-EXT-003` on the WorkflowHub consumer side. External-repository formal acceptance, commit, push, and close remain outside this task and stay `unknown`/outside pass.
- Non-goals: no late supplement window (P4), no external repository edits, no second protocol or public command, no schema fork, no browser/live provider calls.
- Compatibility: retain the existing workflowhub-result.v3 path and provider lifecycle fields; add only the threshold/request and model-identity bindings needed by the current consumer. Failed/cancelled members remain transport facts; only completed semantic members count toward the threshold.
- Test route: `feature` / `backend-testing`; deterministic injected client/config fixtures only.
- RED oracle: missing/invalid threshold is accepted, two profiles sharing one underlying model satisfy a threshold of two, or a running member is normalized as failed.
- GREEN oracle: every provider request carries an explicit positive threshold; thresholds above distinct eligible model count fail before dispatch; threshold is satisfied only by distinct completed model identities; failed/cancelled/running states remain distinguishable.
- Stop conditions: the existing v3 contract cannot be extended without changing an external schema outside this task, a real external lifecycle cannot be observed deterministically, or model identity is absent and would require an invented default.
- Required handoff: exact request fields, model-count rule, member-state handling, RED/GREEN exits, canonical test receipt, review fact/disposition, and external unknown boundary recorded in T005/T006.

## Execution result

- Route: feature; backend-testing; non_ui. test-routing-advisor selected the planned backend route for the three wh-review scripts and deterministic contract fixture; no browser or live provider test.
- RED: T005 exit 1 at the intended threshold/model/lifecycle assertions; evidence .planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T005.stdout.
- GREEN: T006 exit 0, 1 file / 3 tests; public canonical capture quality/tests/build-code-p3-external-threshold.json, hash e5d3898ad8559c71eefd5efa9f2e2dd81c0934a8bb589c9c4a26ccbf37e4933e.
- Implementation: requests now require an explicit positive threshold; trusted route selection exposes model identities and rejects impossible distinct-model thresholds; v3 running members and in-progress attempts remain running; runner counts only completed distinct model identities and preserves failed/cancelled/running states.
- Review: public phase review attempt f546fd83-d361-588c-ac7d-616b00a98110 is terminal unavailable; kimi failed PUBLIC_RESULT_INVALID, codex failed EVIDENCE_ANCHOR_INVALID; no semantic finding was available to disposition. Provider quality remains incomplete/unavailable.
- Boundary: external /Users/Hugh/Hugh/Project/3rd-review formal acceptance, commit, push, and close were not touched and remain unknown/outside this task's pass claim.
- Release closure repair: synchronized `skills/wh-review/skill-bundle.json` with the changed `review-provider-client.mjs`, `third-review-host-config.mjs`, and `simple-review-runner.mjs` bytes, then synchronized `skills/catalog.yaml` to the resolved bundle hash, after the clean-install closure check exposed stale hashes; no behavior or protocol change was made by this metadata-only repair.
