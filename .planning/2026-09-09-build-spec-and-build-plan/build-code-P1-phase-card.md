# Build-code Phase P1 Card

- Goal: explicit `host-session` requirement source uses the existing strict zstd/registered-source authentication chain; malformed source stays unavailable with zero messages.
- Allowed files/symbols: `runtime/evidence/host-session-transcript.mjs` (thin adapter and decoder delegation), `tools/host/workflowhub-stage-agent-bridge.mjs` (`buildRequirementAuthentication` / `runBridge`, preserving `coordination`), `tests/contract/dsh-requirement-source.test.mjs`, `tests/dsh-transcript.test.mjs`.
- Covered ACs: `AC-SOURCE-001`, `AC-SOURCE-002`; supporting `AC-GOV-001` coordination boundary.
- Non-goals: no new public command/store/schema, no latest/env/caller selection, no second decoder, no changes to `decision-log.md`/`spec.md` or P2/P3 behavior.
- Compatibility: no descriptor keeps existing bridge behavior; explicit `kind:"host-session"` is opt-in; main `session.coordination` contract remains intact.
- Test route: `feature` / `backend-testing`; planned P1 gate command from `tasks.md`, RED must fail at a named source/decoder assertion, GREEN must pass with all invalid cases unavailable/zero messages.
- Stop conditions: decoder copies/skips malformed frames, caller/latest selection, coordination regression, or production files outside boundary.
- Stage-end handoff: record actual changed files, command exits, AC results, review result/disposition, and known limits in T001/T002 facts.

## Execution facts

- **Build-code routing advisor**:

  ```json
  {"routing_tier":"feature","routing_rationale":"P1 changes the host-session evidence adapter, strict zstd frame boundary handling, and the bridge seam with authenticated source/identity behavior; this is one backend feature domain with contract and subprocess tests, not a UI or deployment change.","result":"pass","ts":"2026-09-10T00:50:00Z"}
  ```

- **Backend-testing route**: the exact P1 command covers valid/invalid host-source extraction, cross-identity replay, concatenated/skippable/truncated/checksum zstd frames, bridge coordination preservation, and host frontend parity. No live host or network is required; same-task source-failure cases remain unavailable rather than green.
- **Focused test evidence**: initial paired GREEN passed 4 files/31 tests; after strict decoder and source-boundary repair plus valid/unavailable source matrix, the same command exited `0` with 4 files/44 tests. `node --check` for the three P1 production files and `git diff --check` exited `0`.
- **Phase review fact**: P1 review attempt `quality/reviews/attempts/fc659856-4297-5e24-adf1-783bdd28abeb/attempt.json` remains unavailable (`MATERIAL_INCOMPLETE`, blocked before dispatch); no provider result or finding is claimed.
- **Coverage limits**: the adapter cannot detect a same-host process forging identical producer fields, and no real external host Stage Agent supplied a current authenticated outcome; both limits stay explicit.
