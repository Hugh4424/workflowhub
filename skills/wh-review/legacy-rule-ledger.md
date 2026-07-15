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
| `AGH-DESIGN-01` | three axes: problem/spec/boundary | keep | `skills/wh-review/contracts/build-spec.md` C1/C2/C3 and H1/H2/H3 |
| `AGH-DESIGN-02` | plan-ceo-review requirement | lens | `skills/wh-review/contracts/build-spec.md#Required skills`; selected design skill bundle owns the judgment |
| `AGH-DESIGN-03` | review requirement | lens | `skills/wh-review/contracts/build-spec.md#Required skills`; selected review skill bundle owns the judgment |
| `AGH-DESIGN-04` | UI plan-design-review requirement | lens | `skills/wh-review/stage-skill-plan.json#stages.build-spec` UI-only profile; selected UI design lens |
| `AGH-DESIGN-05` | unavailable skill escalates | keep | `skills/wh-review/scripts/reviewer-output-validator.mjs#validateSkillResults`; missing required `skillResults` makes provider output business-invalid |
| `AGH-DESIGN-06` | skill-file fallback | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#attachments`; provider receives frozen skill files, no host fallback |
| `AGH-DESIGN-07` | three-part skill evidence | keep | `skills/wh-review/schemas/reviewer-output.schema.json#skillResults`; checked objects, evidence and conclusion are mandatory |
| `AGH-DESIGN-08` | hollow skill evidence rejection | keep | `skills/wh-review/scripts/reviewer-output-validator.mjs#validateSkillResults`; empty/unbound lens evidence is business-invalid |
| `AGH-DESIGN-09` | goal/boundary/decision/AC/source questions | keep | `skills/wh-review/contracts/build-spec.md` C1/C2/C3, H1/H2/H3 and Specification quality questions 1-4 |
| `AGH-DESIGN-10` | SPEC deviation decision tree | keep | `skills/wh-review/contracts/build-spec.md` H1/H2 plus classification rule: unresolved product ambiguity uses `escalate_to_human` |
| `AGH-DESIGN-11` | incremental full-boundary rescan | keep | `skills/wh-review/scripts/review-round-facade.mjs#prepare`; host-built continuation delta carries affected materials; `skills/wh-review/contracts/build-spec.md#Continuation closure` |
| `AGH-DESIGN-12` | source trace and bidirectional impact trace | keep | `skills/wh-review/contracts/build-spec.md#Specification quality questions`; C1 requires bidirectional source trace |
| `AGH-DESIGN-13` | scope drift/approved scope risk classification | keep | `skills/wh-review/contracts/build-spec.md` C1/C3, H2/H3 and classification rules |
| `AGH-DESIGN-14` | objective AC and user-story completeness | keep | `skills/wh-review/contracts/build-spec.md#Specification quality questions`; C2 requires success, failure, boundary and decidable acceptance |
| `AGH-DESIGN-15` | AgentHub RuntimeAdapter/Knowledge boundary | removed (evidence) | `skills/wh-review/contracts/build-spec.md#Reviewer role`; AgentHub-only RuntimeAdapter/Knowledge architecture is outside V4 stage boundary |
| `AGH-DESIGN-16` | AgentHub file placement/Knowledge task path | removed (evidence) | `skills/wh-review/scripts/lib/safe-id.mjs#taskRoot`; AgentHub-only path/runtime assumption |
| `AGH-DESIGN-17` | Spec-Purity absolute/hook/TS/shell blacklist | removed (evidence) | `skills/wh-review/contracts/build-spec.md#Specification quality questions`; portable outcome/boundary checks replace AgentHub-specific implementation-token blacklist |
| `AGH-DESIGN-18` | UI authorization/state/interaction gate | lens | `skills/wh-review/stage-skill-plan.json#stages.build-spec` UI-only profile; selected UI design lens owns UI semantics |
| `AGH-DESIGN-19` | impact-range exhaustive check and grandfather rule | keep | `skills/wh-review/contracts/build-spec.md` C1/C3 and Specification quality questions 1/3; no legacy grandfather exemption retained |
| `AGH-DESIGN-20` | ORACLE denominator/paired/source checks | keep | `skills/wh-review/contracts/build-spec.md#Specification quality questions`; C1/C2 require source, complete scenario denominator and decidable evidence |
| `AGH-DESIGN-21` | nonblocking scope/wording/numbering advice | keep | `skills/wh-review/contracts/build-spec.md#分类`; non-correctness wording/organization advice is `minor` |
| `AGH-DESIGN-22` | checkpoint package/file-listening rule | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#prepare`; AgentHub checkpoint mechanism has no V4 target |
| `AGH-DESIGN-23` | design contract/UI component extraction detail | lens | `skills/wh-review/stage-skill-plan.json#stages.build-spec` UI-only profile; absent UI profile means the legacy extraction detail is not applied |
| `AGH-DESIGN-24` | revision record and repeated-finding rule | keep | `skills/wh-review/scripts/finding-state.mjs#reconcileFindingState` and `#validateClosureBundle`; receipt finding state plus structured closure evidence |
| `AGH-PLAN-01` | three axes: traceability/executability/verification | keep | `skills/wh-review/contracts/build-plan.md` C1/C2/C3 and H1/H2/H3 |
| `AGH-PLAN-02` | `speckit-analyze` requirement | lens | `skills/wh-review/contracts/build-plan.md#Required skills`; repository `spec-analyze` bundle, when selected |
| `AGH-PLAN-03` | `plan-eng-review` requirement | lens | `skills/wh-review/contracts/build-plan.md#Required skills`; selected plan engineering lens |
| `AGH-PLAN-04` | independent review requirement | lens | `skills/wh-review/contracts/build-plan.md#Required skills`; selected review lens supplies `skillResults` |
| `AGH-PLAN-05` | unavailable/hollow skill evidence | keep | `skills/wh-review/scripts/reviewer-output-validator.mjs#validateSkillResults`; missing or unbound required lens evidence is business-invalid |
| `AGH-PLAN-06` | skill-file fallback | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#attachments`; frozen bundle is delivered, not host fallback |
| `AGH-PLAN-07` | phase/depends/files/risk/verify/FR principles | keep | `skills/wh-review/contracts/build-plan.md#Plan quality questions`; C1-C3 cover consumption, order, failure and verification |
| `AGH-PLAN-08` | continuation resolution summary per prior finding | keep | `skills/wh-review/contracts/build-plan.md#Continuation closure`; `skills/wh-review/scripts/finding-state.mjs#validateClosureBundle` validates per-finding closure evidence |
| `AGH-PLAN-09` | constitution and FR-task-verify trace | keep | `skills/wh-review/contracts/build-plan.md` C1/H1 and Plan quality questions 1/5; frozen constitution is a required material |
| `AGH-PLAN-10` | phase size/order/dependency/[P] constraints | keep | `skills/wh-review/contracts/build-plan.md` C2, H2 and Plan quality questions 2/4; no fixed legacy phase-size threshold retained |
| `AGH-PLAN-11` | objective verify and fake-command checks | keep | `skills/wh-review/contracts/build-plan.md#Plan quality questions`; verification must be executable and falsifiable |
| `AGH-PLAN-12` | existing interface signature anchors | keep | `skills/wh-review/contracts/build-plan.md#Plan quality questions`; provider checks interfaces only when frozen planning materials contain anchors |
| `AGH-PLAN-13` | forbidden file/upstream merge safety | keep | `skills/wh-review/contracts/build-plan.md#Plan quality questions`; provider checks frozen scope and changed-files evidence, not an unverified host claim |
| `AGH-PLAN-14` | governance seven-category matrix | removed (evidence) | `skills/wh-review/contracts/build-plan.md#Plan quality questions`; portable consumer/boundary/verification checks replace AgentHub-specific fixed governance matrix |
| `AGH-PLAN-15` | UI contract/visual six-dimension rules | removed (evidence) | `skills/wh-review/contracts/build-plan.md#Plan quality questions`; build-plan has no UI lens, while portable boundary and verification checks remain |
| `AGH-PLAN-16` | no unapproved fallback/legacy/platform coupling | keep | `skills/wh-review/contracts/build-plan.md` C2, H3 and Plan quality questions 3/5 |
| `AGH-PLAN-17` | behavior, not existence-only acceptance | keep | `skills/wh-review/contracts/build-plan.md#Plan quality questions`; existence-only verification is explicitly invalid |
| `AGH-PLAN-18` | pass is not human approval/STOP | keep | `skills/wh-review/contracts/provider-protocol.md#Verdict`; `skills/wh-review/scripts/review-round-facade.mjs#publish` keeps provider verdict separate from host disposition/human gate |
| `AGH-PLAN-19` | concept drift, impact coverage, YAGNI/KISS | keep | `skills/wh-review/contracts/build-plan.md#Plan quality questions`; minimum implementation and consumer coverage are explicit |
| `AGH-PLAN-20` | nonblocking phase/file/UI suggestions | keep | `skills/wh-review/contracts/build-plan.md#分类`; optional organization/readability advice is `minor` |
| `AGH-PLAN-21` | knowledge/checkpoint artifact planning | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#prepare`; AgentHub lifecycle artifact model has no V4 target |
| `AGH-PLAN-22` | repeated finding/revision record | keep | `skills/wh-review/scripts/finding-state.mjs#reconcileFindingState` and `#validateClosureBundle`; hash-bound receipts retain round history |
| `AGH-CODE-01` | three axes: spec/standards/structural quality | keep | `skills/wh-review/contracts/build-code.md` C1/C2/C3 and H1/H2/H3 |
| `AGH-CODE-02` | six behavior/scope/test/evidence/side-effect questions | keep | `skills/wh-review/contracts/build-code.md#Structural quality questions`; behavior, boundary, side effect and evidence questions are explicit |
| `AGH-CODE-03` | AgentHub gate.sh/guard.sh automation split | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#sealPacket`; AgentHub hooks absent, V4 host verifies packet evidence |
| `AGH-CODE-04` | continuation prior finding/delta/boundary rescan | keep | `skills/wh-review/contracts/build-code.md#Continuation closure`; host-built delta includes prior findings and affected materials |
| `AGH-CODE-05` | new blocking restriction | keep | `skills/wh-review/scripts/finding-state.mjs#reconcileFindingState`; only host-proven introduced/previously-impossible roots retain late blocking severity |
| `AGH-CODE-06` | independent session each round | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#run`; V4 broker continuation is mandatory |
| `AGH-CODE-07` | functional/test/scope/evidence/FR blocking list | keep | `skills/wh-review/contracts/build-code.md` C1/C2/C3, H1/H2/H3 and Structural quality questions 1-6 |
| `AGH-CODE-08` | report/readability/index/summary minor list | removed (evidence) | `skills/wh-review/scripts/public-review-projection.mjs#projectPublicReviewCore`; AgentHub report lifecycle artifact semantics removed |
| `AGH-CODE-09` | design/standards/task/diff review matrix | keep | `skills/wh-review/contracts/build-code.md#Structural quality questions`; C1-C3 bind approved design, boundary and diff evidence |
| `AGH-CODE-10` | test command/shell diagnostic execution | keep | `skills/wh-review/contracts/build-code.md#Structural quality questions`; provider reviews frozen test evidence while non-artifact assertions remain producer attestations |
| `AGH-CODE-11` | structural quality gate branches/leaks/duplication | keep | `skills/wh-review/contracts/build-code.md#Structural quality questions`; contract directly checks behavior, state, concurrency and consumers |
| `AGH-CODE-12` | absolute path/cast/atomicity/file-size/wrapper gate | keep | `skills/wh-review/contracts/build-code.md#Structural quality questions`; portable atomicity/boundary checks retained, fixed token and size bans removed |
| `AGH-CODE-13` | RED/GREEN provenance and no placeholders | keep | `skills/wh-review/contracts/build-code.md#Structural quality questions`; provider checks frozen provenance and placeholder evidence without claiming host execution proof |
| `AGH-CODE-14` | Host-Verified Facts conflict escalates | keep | `skills/wh-review/contracts/provider-protocol.md#Evidence rules`; reviewer-output `escalate_to_human` handles unresolved conflict with typed host facts |
| `AGH-CODE-15` | FR consumption scan/revise-plan artifact | removed (evidence) | `skills/wh-review/scripts/finding-state.mjs#validateClosureBundle`; current-delta closure replaces AgentHub revision artifact |
| `AGH-CODE-16` | repeated finding closure requirements | keep | `skills/wh-review/contracts/build-code.md#Continuation closure`; `skills/wh-review/scripts/finding-state.mjs#validateClosureBundle` enforces structured evidence |
| `AGH-CODE-17` | substantive review four questions | keep | `skills/wh-review/contracts/build-code.md#Structural quality questions`; contract directly owns substantive review with no code lens |
| `AGH-CODE-18` | append-only report revision triple | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#updateReceiptAndFlow`; AgentHub request identifiers are not exposed in V4 |
| `AGH-ACCEPT-01` | three axes: AC/evidence/workflow closure | keep | `skills/wh-review/contracts/verify-code.md` C1-C6 and H1/H2/H3 |
| `AGH-ACCEPT-02` | `qa-only` must be used, not `qa` | lens | `skills/wh-review/contracts/verify-code.md#Required skills`; selected acceptance lens replaces the AgentHub command name |
| `AGH-ACCEPT-03` | `verify-change --light` requirement | lens | `skills/wh-review/contracts/verify-code.md#Required skills`; selected verification lens replaces the AgentHub command flag |
| `AGH-ACCEPT-04` | unavailable/hollow skill evidence | keep | `skills/wh-review/scripts/reviewer-output-validator.mjs#validateSkillResults`; missing or unbound required lens evidence is business-invalid |
| `AGH-ACCEPT-05` | skill-file fallback and openspec ban | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#attachments`; frozen bundle replaces AgentHub command naming |
| `AGH-ACCEPT-06` | AC/fresh/verdict/Knowledge/delivery questions | keep | `skills/wh-review/contracts/verify-code.md` C1-C6, H1-H3 and Acceptance quality questions 1-6; AgentHub Knowledge procedure is separately removed in ACCEPT-23 |
| `AGH-ACCEPT-07` | continuation prior finding/delta/new-blocking limit | keep | `skills/wh-review/contracts/verify-code.md#Continuation closure`; `skills/wh-review/scripts/finding-state.mjs#reconcileFindingState` enforces late-blocking policy |
| `AGH-ACCEPT-08` | first-round `workflow-issues.jsonl` record | removed (evidence) | `skills/wh-review/scripts/review-round-facade.mjs#checkedCarryovers`; V4 carryovers replace lifecycle artifact |
| `AGH-ACCEPT-09` | report-index open status list | removed (evidence) | `skills/wh-review/scripts/public-review-projection.mjs#projectPublicReviewCore`; V4 core receipt findings replace index model |
| `AGH-ACCEPT-10` | AC/plan-test/user-problem coverage | keep | `skills/wh-review/contracts/verify-code.md#Acceptance quality questions`; every AC and original problem requires separate evidence |
| `AGH-ACCEPT-11` | fresh round raw output/no historical citation | keep | `skills/wh-review/contracts/verify-code.md#Acceptance quality questions`; provider checks freshness from frozen evidence metadata |
| `AGH-ACCEPT-12` | test/typecheck/build/no skipped tests | keep | `skills/wh-review/contracts/verify-code.md#Acceptance quality questions`; provider judges available test evidence without claiming host execution |
| `AGH-ACCEPT-13` | evidence JSON/provenance/no placeholders | keep | `skills/wh-review/contracts/provider-protocol.md#Provider Protocol`; artifact bytes are host-verified, non-artifact assertions remain explicitly unverified |
| `AGH-ACCEPT-14` | latest earlier review/revision closure | keep | `skills/wh-review/contracts/verify-code.md` C5/H3; host-bound previous receipt and `verification_closure` supply closure state |
| `AGH-ACCEPT-15` | browser QA/screenshots/trace/hash/tool consistency | keep | `skills/wh-review/contracts/verify-code.md#Acceptance quality questions`; UI evidence is reviewed when present, missing collection becomes unknown/human escalation |
| `AGH-ACCEPT-16` | visual comparison/design contract latest | keep | `skills/wh-review/contracts/verify-code.md#Acceptance quality questions`; provider judges frozen current visual evidence without claiming host proof |
| `AGH-ACCEPT-17` | scope/target/self-consistency | keep | `skills/wh-review/contracts/verify-code.md` C1/C2/C6, H1/H3 and Acceptance quality questions 1/6 |
| `AGH-ACCEPT-18` | ORACLE denominator/paired/source rules | keep | `skills/wh-review/contracts/verify-code.md#Acceptance quality questions`; full denominator, source, freshness and positive/negative evidence are explicit |
| `AGH-ACCEPT-19` | minor screenshot/report/config/fixture suggestions | keep | `skills/wh-review/contracts/verify-code.md#分类`; non-correctness presentation/organization advice is `minor` |
| `AGH-ACCEPT-20` | every FR and original request no sampling | keep | `skills/wh-review/contracts/verify-code.md#Acceptance quality questions`; per-item evidence and no sampling are explicit |
| `AGH-ACCEPT-21` | dogfood exemption reason | removed (evidence) | `skills/wh-review/contracts/verify-code.md#Acceptance quality questions`; universal dogfood is not portable, while any omitted counterexample requires packet evidence |
| `AGH-ACCEPT-22` | repeated verification evidence escalation | keep | `skills/wh-review/contracts/verify-code.md#Continuation closure`; `skills/wh-review/scripts/finding-state.mjs#validateClosureBundle` and three-round human gate |
| `AGH-ACCEPT-23` | Knowledge close/archive/BrainInbox procedure | removed (evidence) | `skills/wh-review/contracts/verify-code.md#Reviewer role`; AgentHub lifecycle/absolute path assumption has no V4 target |

## Closure bundle evidence

When an open blocking finding has `blocking_streak >= 2`, a closure is valid only
with root cause, scanned scope, counterexample matrix, checklist, repo-relative
anchors tied to current file hashes, and the exact current delta hash. Missing or
mismatched material remains open, produces a human gate, and cannot publish pass.
