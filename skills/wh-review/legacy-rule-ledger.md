# Legacy Rule Ledger

This is the complete migration ledger for the former AgentHub verifier contracts.
Each source clause has exactly one disposition. `host` means WorkflowHub verifies
it before dispatch; `lens` means the selected repository skill checks it; `keep`
means it remains an explicit V4 contract rule. Nothing in this ledger creates a
new gate.

| Legacy source and clause | Decision | V4 mapping or deletion evidence |
| --- | --- | --- |
| `base-verifier.md` role, JSON-only report and verdict ownership | keep | `contracts/provider-protocol.md`, reviewer-output schema |
| `base-verifier.md` pass/revise/escalate semantics | keep | reviewer-output validator and round aggregation |
| `base-verifier.md` `revise_required` root cause and fix approach | keep | reviewer-output schema and validator |
| `base-verifier.md` delegated reviewer escalation and sampling | lens | stage skill bundles; final provider remains verdict owner |
| `base-verifier.md` cross-stage continuity | keep | private flow receipt, continuation delta and carryovers |
| `intake-reviewer-contract.md` direction/detail split | keep | `make-decision` direction/detail contracts and track isolation |
| `intake-reviewer-contract.md` requirement/source/scope review | keep | `make-decision.md` C/H rules and packet requirement excerpt |
| `intake-reviewer-contract.md` skill execution claims | lens | selected `StageSkillPlan` skills with evidence triplet |
| `intake-reviewer-contract.md` two-round finding escalation | keep | structured closure bundle and third-round human gate |
| `intake-reviewer-contract.md` AgentHub Knowledge paths | removed (evidence) | AgentHub-only path/runtime assumption; packet rejects absolute paths |
| `design-reviewer-contract.md` source trace, scope, AC and impact checks | keep | `build-spec.md` C/H rules and packet design excerpt |
| `design-reviewer-contract.md` design skill evidence quality | lens | selected skill bundle and `skillResults` validator |
| `design-reviewer-contract.md` UI design-contract specifics | lens | `design-review` / UI skill profile, only when stage plan selects it |
| `design-reviewer-contract.md` AgentHub Knowledge paths | removed (evidence) | AgentHub-only path/runtime assumption; repository-relative packet only |
| `plan-reviewer-contract.md` FR-to-task, dependency and verify checks | keep | `build-plan.md` C/H rules and planning artifact packet |
| `plan-reviewer-contract.md` architecture, YAGNI and KISS review | lens | `spec-analyze` and plan review skill lenses |
| `plan-reviewer-contract.md` governance synchronization matrix | host | host-verified facts are immutable packet material, not provider filesystem work |
| `plan-reviewer-contract.md` UI visual-token implementation detail | lens | UI review skill profile when the plan declares UI scope |
| `code-reviewer-contract.md` real diff, test evidence and scope checks | keep | `build-code.md`, packet diff/hash and reviewer validator |
| `code-reviewer-contract.md` structural quality checks | lens | code-review skill lens in the frozen bundle |
| `code-reviewer-contract.md` RED/GREEN evidence provenance | host | packet `test_evidence` and host-verified facts/hash verification |
| `code-reviewer-contract.md` `workflow-issues.jsonl` and close summary | removed (evidence) | AgentHub-only lifecycle artifact; V4 uses private/core receipts and report index |
| `test-acceptance-reviewer-contract.md` AC coverage and fresh evidence | keep | `verify-code.md` C/H rules and verification packet material |
| `test-acceptance-reviewer-contract.md` browser QA and visual artifacts | lens | `isolated-browser-qa` is selected only by the stage skill plan |
| `test-acceptance-reviewer-contract.md` evidence command/provenance validation | host | host owns command evidence, manifest/hash and immutable packet assembly |
| `test-acceptance-reviewer-contract.md` AgentHub close/archive procedure | removed (evidence) | AgentHub-only lifecycle; WorkflowHub stage result is a public projection |
| all verifier contracts: provider reads real repo, runs git or uses absolute paths | removed (evidence) | frozen review packet only; provider protocol forbids repo/git/absolute paths |
| all verifier contracts: new independent session every round | removed (evidence) | first runtime and provider sessions are continued through broker only |
| all verifier contracts: free-text closure after repeated blocking | removed (evidence) | closure bundle binds root cause, anchors, current delta and hashes |
| all verifier contracts: provider transport failure as a review verdict | removed (evidence) | transport, packet and semantic statuses remain separate |
| all verifier contracts: external skill roots and old `speckit-analyze` name | removed (evidence) | repository-only resolver and `skills/spec-analyze` |

## Closure bundle evidence

When an open blocking finding has `blocking_streak >= 2`, a closure is valid only
with root cause, scanned scope, counterexample matrix, checklist, repo-relative
anchors tied to current file hashes, and the exact current delta hash. Missing or
mismatched material remains open, produces a human gate, and cannot publish pass.

This ledger is migration evidence only. It is not a review contract and cannot
add a gate.
