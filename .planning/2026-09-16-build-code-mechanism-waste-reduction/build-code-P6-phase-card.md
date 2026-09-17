# Build-code Phase P6 Card

- Goal: keep build-code acceptance evidence on the existing official derivation writer, distinguish unknown empty evidence / zero review findings / explicit not-applicable, and publish the existing interaction aggregate exactly once through TaskKernel.
- Allowed files: `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/task/task-kernel-implementation.mjs`, `tools/cli/stage-runtime.mjs` (boundary clarification for the already specified public `run` ingress), `tests/contract/acceptance-single-writer-empty-values.test.mjs`.
- Covered ACs: `AC-EVID-001`; supporting `AC-RUNTIME-001` for the already specified `outline_closed` consumer.
- Non-goals: no new schema, public command, task-store writer, second acceptance projection, browser QA, or changes to the four current materials.
- Contract: caller/host payloads cannot override official acceptance coverage; the official build-code handler derives the current acceptance leaves from task materials and canonical receipts. Empty states stay distinct: unknown means no evidence supplied, zero findings means a real recorded review with an empty findings list, and not-applicable requires an explicit reason.
- Interaction: `talk_clarify` is an existing quality fact; `receipts.interaction` is a reference to the existing kernel-published immutable interaction aggregate, and `outline_closed` consumes that same fact rather than a caller-authored duplicate.
- Test route: feature / backend-testing; deterministic TaskKernel fixtures only; `non_ui`.
- RED oracle: a competitor can overwrite acceptance coverage, an empty array is treated as coverage, or interaction/talk facts are missing or published twice.
- GREEN oracle: only official derivation writes acceptance coverage; all three empty states remain distinguishable; interaction publication is content-addressed/idempotent and its reference is consumed by `outline_closed`.
- Stop conditions: satisfying the contract requires changing a stable schema or creating a second writer/control plane, or the existing outline consumer cannot read the kernel publication.
- Required handoff: writer ownership, three empty-state readbacks, interaction ref/idempotence, RED/GREEN exits, canonical receipt, review fact/disposition, and remaining limits recorded in T011/T012.

## Execution closure

- Status: `completed`.
- T011 RED: exact target command exited `1`; failures were caller-owned coverage accepted, `not_applicable` unsupported, and public `interaction_aggregate` unknown. Evidence: `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T011.stdout`.
- T012 GREEN: exact target command exited `0`, 1 file / 4 tests passed. Evidence: `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T012.stdout`.
- Implementation: current vNext official handler rejects caller-owned AC coverage; runner writes `evidence_state`/N/A reason into existing stage-quality acceptance leaves without changing stable schemas; Stage Agent acceptance coverage remains provenance-only for current vNext; existing TaskKernel interaction publication is invoked by the official make-decision route, its canonical ref is injected into `receipts.interaction`, and replay is idempotent. `tools/cli/stage-runtime.mjs` only exposes the already planned field on `run`.
- Verification: focused vNext official-flow checks 4/4; interaction regression 3/3; preflight regression 9/9; P2 retry regression after review repair 3/3; `git diff --check` and P6 syntax checks exit `0`.
- Public receipt: `quality/tests/build-code-p6-acceptance-single-writer.json`, SHA-256 `88570bb00612bacd37336b3b997a44d1b1e2a3dfc55f2925b286a413257dcf3d`.
- Review: attempt `52ba1bc8-e1a8-5547-ae19-a78bd300539c`; semantic result at minimum threshold, Kimi reported two minor findings, Codex failed `PUBLIC_RESULT_INVALID`. `F-9e438ac1cd33` rejected as invalid against current source; `F-a022469f250b` fixed in `runtime/review/review-record-route.mjs` with P2 regression coverage. No re-review after the nonblocking cross-phase repair; immutable provider facts retained.
- Limit: explicit N/A is validated and represented by the shared shape/writer, while the current no-evidence vNext official derivation intentionally remains unknown; no N/A inference was invented.
- No commit, push, merge, archive, cleanup, or close performed.
