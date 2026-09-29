# P5/T008 producer design check (read-only)

Status: `not_done/G2`. This checks the current implementation and contracts; it is not a capture, receipt, or independent approval. No `report-facts.json`, `report.md`, or `T008-delivery.txt` was produced.

## Source and serialization boundary

| Required input | Current authenticated source | Boundary |
| --- | --- | --- |
| `chainRows` | `currentPostBuildCodeSpecAnalyze` constructs `acceptanceChain` and puts it in its private `packet.acceptance_coverage` (`runtime/stage/stage-runner.mjs:4300-4330`). | The public vNext result does not expose that packet or the chain (`runtime/stage/stage-runner.mjs:3290-3340`). Reconstructing rows from material or status would invent a source. |
| `stageResult` | `run --action=execute` returns `runOfficialStage`'s result (`tools/cli/stage-runtime.mjs:1909-1916`). | The CLI serializes this result once to stdout after return (`tools/cli/stage-runtime.mjs:2090-2110`); no canonical stage-result file is published. `status --action=begin` is not this result. |
| Command/exit/output | Canonical test receipt facts contain `command`, `exit_code`, `receipt_ref`, `output_ref`, and hashes (`runtime/stage/stage-handlers.mjs:739-782`). | The public vNext result has no `commands[]`; the T007 transformer marks it `missing` (`runtime/stage/stage-end-report.mjs:118-135`). `collectStageEndReportFacts` needs an actual result file and referenced output files (`:224-255`); it cannot authenticate an absent file. |

There is no current single producer boundary holding authenticated chain rows, final public result, command receipts, and the exact serialized CLI stdout together. The internal chain exists before publication/reflection; the CLI has the final result but no chain. Rerunning `run` to fetch either input would execute and publish the stage again. An external one-shot wrapper could capture exact stdout and verify current task/worktree/snapshot plus canonical receipt refs, but it still lacks a public chain source and does not serve callers that invoke the CLI directly. A runtime/CLI projection would need its own reviewed interface, owner, consumer, source binding, and one serialization/write transaction; P5/T008 explicitly excludes editing `runtime/stage/**` and `tools/cli/**` (`specs/workflowhub-thin-core-card-04-20260919/phases/P5.md:50-56,73-75`).

## Exact counterexamples

1. The frozen T012 E2E creates only `phases/P1.md` (`tests/e2e/card-04-real-entry-chain-e2e.test.mjs:42-44,99-122`), calls the real build-code CLI, then demands that temporary task's `quality/evidence/stage-quality/build-code/P5/report-facts.json` (`:213,236,447-480`). A truthful P5-checkpoint producer would not fire in a P1-only task; an unconditional producer would falsely label a P1 run as P5. The worktree's static P5 artifact cannot satisfy the fixture's task path.
2. `publishVNextEvidence` accepts identical bytes at a fixed ref but rejects changed bytes (`runtime/stage/stage-runner.mjs:1607-1617`). A later real run may have a new snapshot, timestamp, receipts, and result (`:3455-3461`). A fixed immutable P5 path can truthfully mean **first P5 checkpoint only**, with later changes reported elsewhere; it cannot also mean “latest run” without overwrite or a new selector/history object. Reports are immutable, and vNext forbids a second progress authority.

## Minimal decision needed

- **For actual T008:** build-plan/P5 owner must define a bounded one-shot capture of a *real P5 checkpoint*, its authenticated task/worktree/material/snapshot and receipt refs, and how genuine AC rows become available. Until then, retain missing `chainRows`/commands as `incomplete` or `missing`; the existing T007 module's output shape is not provenance.
- **For T012:** P6/T012 test/material owner must reconcile its P1-only fixture and fixed P5-path expectation with the P5 checkpoint contract, or expressly authorize a phase-neutral report contract and corresponding source/producer changes. This cannot be solved honestly by a P5-only three-file write.
- **For repeated runs:** choose first-checkpoint immutable semantics or an explicitly reviewed versioned-source/current-selection design. Do not silently overwrite the fixed report.

After contract changes, validate only the affected T007/P5 and T012 targets, one-run stdout/ref/hash binding, missing-chain and missing-command controls, and repeated same/different-snapshot behavior. No test or stage command was run for this design check. P13's final aggregate files remain untouched.
