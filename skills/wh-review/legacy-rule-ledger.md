# Legacy Rule Ledger

This is an auditable, one-rule-per-row migration ledger for AgentHub verifier
contracts. `host` means WorkflowHub proves the fact before dispatch; `lens`
means a selected repository skill evaluates it; `keep` means a V4 contract or
schema owns it. `removed (evidence)` records why a rule is deliberately absent.
The ledger is migration evidence, never a new gate.

Sources: `base-verifier.md`, `intake-reviewer-contract.md`,
`design-reviewer-contract.md`, `plan-reviewer-contract.md`,
`code-reviewer-contract.md`, and `test-acceptance-reviewer-contract.md`.

| Rule | Legacy source clause | Decision | V4 mapping or deletion evidence |
| --- | --- | --- | --- |
| `AGH-BASE-01` | `base-verifier.md` role and checkpoint report | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#publishUnderLock`; V4 receipt/core projection replaces AgentHub checkpoint reports |
| `AGH-BASE-02` | protocol 1: first-round full review | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; initial packet and stage contract |
| `AGH-BASE-03` | protocol 1: later delta-only review | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; continuation delta and frozen initial runtime |
| `AGH-BASE-04` | protocol 1: independent session each round | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#run`; V4 continues the initial runtime/provider session |
| `AGH-BASE-05` | protocol 2: no chat history | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; provider protocol limits provider to frozen packet |
| `AGH-BASE-06` | protocol 3: reviewer does not edit | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; provider protocol read-only rule |
| `AGH-BASE-07` | protocol 4: required artifact completeness | host | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; packet schema, manifest and host source verification |
| `AGH-BASE-08` | protocol 5/8: verdict whitelist | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; reviewer-output schema |
| `AGH-BASE-09` | protocol 6: insufficient evidence is not pass | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; business-valid validator and aggregation filter |
| `AGH-BASE-10` | protocol 7: immutable numbered reports/index | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#updateReceiptAndFlow` and `#recoverPendingReceiptBinding`; hash-journaled mutable private state, not immutable numbered report/index semantics |
| `AGH-BASE-11` | protocol 9: late blocking finding restriction | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; `late_finding` reconciliation caps undiscoverable findings |
| `AGH-BASE-12` | protocol 10: cross-phase comparison | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; cross-stage carryovers in continuation delta |
| `AGH-BASE-13` | protocol 10: `workflow-issues.jsonl` write | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#checkedCarryovers`; carryover receipt replaces AgentHub lifecycle artifact |
| `AGH-BASE-14` | protocol 11: precondition-fix label | removed (evidence) | `skills/wh-review/schemas/dispositions.schema.json#properties.items`; no V4 field persists this AgentHub-specific label |
| `AGH-BASE-15` | report markdown envelope/source report path | removed (evidence) | `skills/wh-review/scripts/public-review-projection.mjs#projectPublicReviewCore`; providers never receive host paths |
| `AGH-BASE-16` | revise rootCause/fixApproach | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; reviewer-output schema/validator |
| `AGH-BASE-17` | escalate reason and pass resolution summary | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; reviewer-output schema/validator |
| `AGH-BASE-18` | delegated final verifier owns verdict | keep | `skills/wh-review/scripts/review-round-facade.mjs#ReviewRoundFacade`; provider output is sole semantic verdict source |
| `AGH-BASE-19` | delegated facts/risk/candidate findings only | removed (evidence) | `skills/wh-review/contracts/provider-protocol.md#Provider Protocol`; V4 has no opaque subreview bundle transport |
| `AGH-BASE-20` | delegated forced read set/coverage downgrade/sample | removed (evidence) | `skills/wh-review/contracts/provider-protocol.md#Provider Protocol`; frozen packet is the complete review boundary |
| `AGH-INTAKE-01` | shared scope: direction and detail reviewers | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; `make-decision` direction/detail track contracts |
| `AGH-INTAKE-02` | MR-2 problem-change classification | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; direction contract C/H rules |
| `AGH-INTAKE-03` | MR-2 scope/priority classification | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; direction contract C/H rules |
| `AGH-INTAKE-04` | MR-2 interpretation classification | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; direction contract C/H rules |
| `AGH-INTAKE-05` | MR-2 implementation-only downgrade | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; contract-only minor finding policy |
| `AGH-INTAKE-06` | severe implementation risk escalates, not blocks | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; provider `escalate_to_human` verdict |
| `AGH-INTAKE-07` | incremental prior blocking and changed input | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; continuation previous findings/delta manifest |
| `AGH-INTAKE-08` | repeated blocking root/scope/matrix/checklist | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; structured closure bundle hard gate |
| `AGH-INTAKE-09` | third repeated blocking escalates | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; finding-state human gate |
| `AGH-INTAKE-10` | append-only revision record | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#updateReceiptAndFlow`; hash-bound receipt history replaces AgentHub report artifact |
| `AGH-INTAKE-11` | Knowledge root/task absolute path rule | removed (evidence) | `skills/wh-review/scripts/lib/safe-id.mjs#taskRoot`; AgentHub-only path/runtime assumption, V4 validates relative ids |
| `AGH-INTAKE-12` | direction three axes and five questions | lens | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; `make-decision` direction skill bundle |
| `AGH-INTAKE-13` | direction required plan-ceo-review/review | lens | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; stage skill plan and `skillResults` evidence |
| `AGH-INTAKE-14` | direction source is raw context, not decision log | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; direction packet projection |
| `AGH-INTAKE-15` | direction blocking/nonblocking lists | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; direction C/H rules and severity policy |
| `AGH-INTAKE-16` | direction communication simplicity advice | removed (evidence) | `skills/wh-review/contracts/make-decision.md#review_track: direction`; host response style is not an independent-review rule |
| `AGH-INTAKE-17` | blind framework challenge/no proposed direction input | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; direction frozen packet profile |
| `AGH-INTAKE-18` | proposed direction in blind packet escalates | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; material-invalid/human escalation contract |
| `AGH-INTAKE-19` | detail five axes and five questions | lens | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; `make-decision` detail skill bundle |
| `AGH-INTAKE-20` | detail source honesty/consistency/assumption/AC gates | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; detail C/H rules |
| `AGH-INTAKE-21` | blindspot blocking/nonblocking list | lens | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; detail review lens |
| `AGH-INTAKE-22` | drift blocking/nonblocking list | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; detail source/delta rules |
| `AGH-INTAKE-23` | scope four dimensions and verdict consistency | keep | `skills/wh-review/contracts/make-decision.md` §review_track: direction/detail; direction/detail contract evidence |
| `AGH-DESIGN-01` | three axes: problem/spec/boundary | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; `build-spec.md` C/H rules |
| `AGH-DESIGN-02` | plan-ceo-review requirement | lens | `skills/wh-review/contracts/build-spec.md` §Hard invariants; selected design skill bundle |
| `AGH-DESIGN-03` | review requirement | lens | `skills/wh-review/contracts/build-spec.md` §Hard invariants; selected design skill bundle |
| `AGH-DESIGN-04` | UI plan-design-review requirement | lens | `skills/wh-review/contracts/build-spec.md` §Hard invariants; UI-only stage skill plan profile |
| `AGH-DESIGN-05` | unavailable skill escalates | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; `skillResults` validation/human verdict |
| `AGH-DESIGN-06` | skill-file fallback | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#attachments`; provider receives frozen skill files, no host fallback |
| `AGH-DESIGN-07` | three-part skill evidence | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; reviewer-output `skillResults` validator |
| `AGH-DESIGN-08` | hollow skill evidence rejection | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; reviewer-output validator |
| `AGH-DESIGN-09` | goal/boundary/decision/AC/source questions | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; build-spec C/H rules |
| `AGH-DESIGN-10` | SPEC deviation decision tree | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; build-spec contract and human escalation |
| `AGH-DESIGN-11` | incremental full-boundary rescan | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; delta manifest affected-material policy |
| `AGH-DESIGN-12` | source trace and bidirectional impact trace | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; build-spec C/H rules |
| `AGH-DESIGN-13` | scope drift/approved scope risk classification | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; contract severity rules |
| `AGH-DESIGN-14` | objective AC and user-story completeness | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; acceptance/design packet and contract |
| `AGH-DESIGN-15` | AgentHub RuntimeAdapter/Knowledge boundary | removed (evidence) | `skills/wh-review/contracts/build-spec.md#Hard invariants`; AgentHub-only architecture is outside V4 stage boundary |
| `AGH-DESIGN-16` | AgentHub file placement/Knowledge task path | removed (evidence) | `skills/wh-review/scripts/lib/safe-id.mjs#taskRoot`; AgentHub-only path/runtime assumption |
| `AGH-DESIGN-17` | Spec-Purity absolute/hook/TS/shell blacklist | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; build-spec contract packet validation |
| `AGH-DESIGN-18` | UI authorization/state/interaction gate | lens | `skills/wh-review/contracts/build-spec.md` §Hard invariants; UI design skill profile |
| `AGH-DESIGN-19` | impact-range exhaustive check and grandfather rule | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; build-spec impact C/H rules |
| `AGH-DESIGN-20` | ORACLE denominator/paired/source checks | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; build-spec C/H rules |
| `AGH-DESIGN-21` | nonblocking scope/wording/numbering advice | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; minor finding policy |
| `AGH-DESIGN-22` | checkpoint package/file-listening rule | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#prepare`; AgentHub checkpoint mechanism has no V4 target |
| `AGH-DESIGN-23` | design contract/UI component extraction detail | lens | `skills/wh-review/contracts/build-spec.md` §Hard invariants; UI skill profile only when selected |
| `AGH-DESIGN-24` | revision record and repeated-finding rule | keep | `skills/wh-review/contracts/build-spec.md` §Hard invariants; receipt history and structured closure bundle |
| `AGH-PLAN-01` | three axes: traceability/executability/verification | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; `build-plan.md` C/H rules |
| `AGH-PLAN-02` | `speckit-analyze` requirement | lens | `skills/wh-review/contracts/build-plan.md` §Hard invariants; repository `spec-analyze` skill bundle |
| `AGH-PLAN-03` | `plan-eng-review` requirement | lens | `skills/wh-review/contracts/build-plan.md` §Hard invariants; selected plan engineering lens |
| `AGH-PLAN-04` | independent review requirement | lens | `skills/wh-review/contracts/build-plan.md` §Hard invariants; selected review lens |
| `AGH-PLAN-05` | unavailable/hollow skill evidence | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; `skillResults` validator/human verdict |
| `AGH-PLAN-06` | skill-file fallback | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#attachments`; frozen bundle is delivered, not host fallback |
| `AGH-PLAN-07` | phase/depends/files/risk/verify/FR principles | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; build-plan contract |
| `AGH-PLAN-08` | continuation resolution summary per prior finding | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; closure evidence and receipt finding state |
| `AGH-PLAN-09` | constitution and FR-task-verify trace | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; build-plan C/H rules |
| `AGH-PLAN-10` | phase size/order/dependency/[P] constraints | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; build-plan C/H rules |
| `AGH-PLAN-11` | objective verify and fake-command checks | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; build-plan C/H rules |
| `AGH-PLAN-12` | existing interface signature anchors | host | `skills/wh-review/contracts/build-plan.md` §Hard invariants; host-verified facts in immutable packet |
| `AGH-PLAN-13` | forbidden file/upstream merge safety | host | `skills/wh-review/contracts/build-plan.md` §Hard invariants; host source/diff and manifest evidence |
| `AGH-PLAN-14` | governance seven-category matrix | host | `skills/wh-review/contracts/build-plan.md` §Hard invariants; host-verified facts, not provider filesystem |
| `AGH-PLAN-15` | UI contract/visual six-dimension rules | lens | `skills/wh-review/contracts/build-plan.md` §Hard invariants; UI plan-review skill profile |
| `AGH-PLAN-16` | no unapproved fallback/legacy/platform coupling | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; build-plan scope C/H rules |
| `AGH-PLAN-17` | behavior, not existence-only acceptance | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; build-plan contract |
| `AGH-PLAN-18` | pass is not human approval/STOP | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; disposition and human-gate protocol |
| `AGH-PLAN-19` | concept drift, impact coverage, YAGNI/KISS | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; build-plan C/H rules |
| `AGH-PLAN-20` | nonblocking phase/file/UI suggestions | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; minor finding policy |
| `AGH-PLAN-21` | knowledge/checkpoint artifact planning | removed (evidence) | `skills/wh-review/contracts/build-plan.md#Hard invariants`; AgentHub lifecycle artifact model has no V4 target |
| `AGH-PLAN-22` | repeated finding/revision record | keep | `skills/wh-review/contracts/build-plan.md` §Hard invariants; closure bundle and immutable receipt history |
| `AGH-CODE-01` | three axes: spec/standards/structural quality | keep | `skills/wh-review/contracts/build-code.md` §Hard invariants; `build-code.md` C/H rules |
| `AGH-CODE-02` | six behavior/scope/test/evidence/side-effect questions | keep | `skills/wh-review/contracts/build-code.md` §Hard invariants; build-code contract |
| `AGH-CODE-03` | AgentHub gate.sh/guard.sh automation split | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#sealPacket`; AgentHub hooks absent, V4 host verifies packet evidence |
| `AGH-CODE-04` | continuation prior finding/delta/boundary rescan | keep | `skills/wh-review/contracts/build-code.md` §Hard invariants; continuation delta and affected materials |
| `AGH-CODE-05` | new blocking restriction | keep | `skills/wh-review/contracts/build-code.md` §Hard invariants; late-finding state reconciliation |
| `AGH-CODE-06` | independent session each round | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#run`; V4 broker continuation is mandatory |
| `AGH-CODE-07` | functional/test/scope/evidence/FR blocking list | keep | `skills/wh-review/contracts/build-code.md` §Hard invariants; build-code C/H rules |
| `AGH-CODE-08` | report/readability/index/summary minor list | removed (evidence) | `skills/wh-review/scripts/public-review-projection.mjs#projectPublicReviewCore`; AgentHub report lifecycle artifact semantics removed |
| `AGH-CODE-09` | design/standards/task/diff review matrix | keep | `skills/wh-review/contracts/build-code.md` §Hard invariants; packet material and build-code contract |
| `AGH-CODE-10` | test command/shell diagnostic execution | host | `skills/wh-review/contracts/build-code.md` §Hard invariants; host test evidence and manifest/hash |
| `AGH-CODE-11` | structural quality gate branches/leaks/duplication | lens | `skills/wh-review/contracts/build-code.md` §Hard invariants; code review skill lens |
| `AGH-CODE-12` | absolute path/cast/atomicity/file-size/wrapper gate | keep | `skills/wh-review/contracts/build-code.md` §Hard invariants; build-code C/H rules |
| `AGH-CODE-13` | RED/GREEN provenance and no placeholders | host | `skills/wh-review/contracts/build-code.md` §Hard invariants; packet test evidence and host facts |
| `AGH-CODE-14` | Host-Verified Facts conflict escalates | keep | `skills/wh-review/contracts/build-code.md` §Hard invariants; validator/human verdict policy |
| `AGH-CODE-15` | FR consumption scan/revise-plan artifact | removed (evidence) | `skills/wh-review/scripts/finding-state.mjs#validateClosureBundle`; current-delta closure replaces AgentHub revision artifact |
| `AGH-CODE-16` | repeated finding closure requirements | keep | `skills/wh-review/contracts/build-code.md` §Hard invariants; structured closure bundle hard gate |
| `AGH-CODE-17` | substantive review four questions | lens | `skills/wh-review/contracts/build-code.md` §Hard invariants; code review skill lens |
| `AGH-CODE-18` | append-only report revision triple | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#updateReceiptAndFlow`; AgentHub request identifiers are not exposed in V4 |
| `AGH-ACCEPT-01` | three axes: AC/evidence/workflow closure | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; `verify-code.md` C/H rules |
| `AGH-ACCEPT-02` | `qa-only` must be used, not `qa` | lens | `skills/wh-review/contracts/verify-code.md` §Hard invariants; selected acceptance skill bundle |
| `AGH-ACCEPT-03` | `verify-change --light` requirement | lens | `skills/wh-review/contracts/verify-code.md` §Hard invariants; selected verification skill bundle |
| `AGH-ACCEPT-04` | unavailable/hollow skill evidence | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; `skillResults` validator/human verdict |
| `AGH-ACCEPT-05` | skill-file fallback and openspec ban | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#attachments`; frozen bundle replaces AgentHub command naming |
| `AGH-ACCEPT-06` | AC/fresh/verdict/Knowledge/delivery questions | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; verify-code contract |
| `AGH-ACCEPT-07` | continuation prior finding/delta/new-blocking limit | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; continuation delta and late-finding policy |
| `AGH-ACCEPT-08` | first-round `workflow-issues.jsonl` record | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#checkedCarryovers`; V4 carryovers replace lifecycle artifact |
| `AGH-ACCEPT-09` | report-index open status list | removed (evidence) | `skills/wh-review/scripts/public-review-projection.mjs#projectPublicReviewCore`; V4 core receipt findings replace index model |
| `AGH-ACCEPT-10` | AC/plan-test/user-problem coverage | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; verify-code C/H rules and packet evidence |
| `AGH-ACCEPT-11` | fresh round raw output/no historical citation | host | `skills/wh-review/contracts/verify-code.md` §Hard invariants; host test evidence and manifest/hash |
| `AGH-ACCEPT-12` | test/typecheck/build/no skipped tests | host | `skills/wh-review/contracts/verify-code.md` §Hard invariants; host test evidence |
| `AGH-ACCEPT-13` | evidence JSON/provenance/no placeholders | host | `skills/wh-review/contracts/verify-code.md` §Hard invariants; host verified facts and packet manifest |
| `AGH-ACCEPT-14` | latest earlier review/revision closure | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; prior core receipt and continuation finding state |
| `AGH-ACCEPT-15` | browser QA/screenshots/trace/hash/tool consistency | lens | `skills/wh-review/contracts/verify-code.md` §Hard invariants; `isolated-browser-qa` UI-only skill profile |
| `AGH-ACCEPT-16` | visual comparison/design contract latest | lens | `skills/wh-review/contracts/verify-code.md` §Hard invariants; UI acceptance skill profile |
| `AGH-ACCEPT-17` | scope/target/self-consistency | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; verify-code contract |
| `AGH-ACCEPT-18` | ORACLE denominator/paired/source rules | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; verify-code C/H rules |
| `AGH-ACCEPT-19` | minor screenshot/report/config/fixture suggestions | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; minor finding policy |
| `AGH-ACCEPT-20` | every FR and original request no sampling | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; verify-code C/H rules |
| `AGH-ACCEPT-21` | dogfood exemption reason | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; verify-code packet/contract rule |
| `AGH-ACCEPT-22` | repeated verification evidence escalation | keep | `skills/wh-review/contracts/verify-code.md` §Hard invariants; structured closure bundle and human gate |
| `AGH-ACCEPT-23` | Knowledge close/archive/BrainInbox procedure | removed (evidence) | `skills/wh-review/contracts/verify-code.md#Hard invariants`; AgentHub lifecycle/absolute path assumption has no V4 target |

## Closure bundle evidence

When an open blocking finding has `blocking_streak >= 2`, a closure is valid only
with root cause, scanned scope, counterexample matrix, checklist, repo-relative
anchors tied to current file hashes, and the exact current delta hash. Missing or
mismatched material remains open, produces a human gate, and cannot publish pass.
