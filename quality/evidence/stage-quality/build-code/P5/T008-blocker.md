# T008 current source boundary

Status: `not_done/G2`. T007 now has a tested module implementation, but this does not create the authenticated P5 intermediate stage source required by T008.

The public `run --action=execute --stage=build-code` is an active stage transaction: it writes task and quality facts and computes a stage completion result. Its stdout is `stage-runtime-result.vnext`; it does not expose runtime-only `acceptanceChain`, per-command output rows, or embedded task/material/snapshot identity. `verify --action=execute` captures a test command receipt, not an already completed stage result. Running `run` just to manufacture this checkpoint would execute the stage out of sequence. `collectStageEndReportFacts` can read a local result file and check output paths, but it cannot authenticate the caller, the CLI invocation, receipt hashes, or missing AC rows.

Independent read-only design audit: `/root/p5_capture_design`, 2026-09-26; code pointers `runtime/stage/stage-runner.mjs:2964-2975,3219-3279,3297-3339,4300-4330`, `tools/cli/stage-runtime.mjs:1876-1881,2051-2069`, and `specs/workflowhub-thin-core-card-04-20260919/phases/P5.md:49-75`. No stage command was run for this investigation. No `report-facts.json`, `report.md`, or `T008-delivery.txt` has been created.

Owner: build-plan for the T008 capture/provenance contract and its approved consumer; the current WorkflowHub build-code session can implement only after a real, single canonical source and bounded invocation are established. P13 owns the final all-Phase report. Missing command/AC rows must remain `incomplete`, even if a later shape check passes.
