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
| `AGH-BASE-01` | `base-verifier.md` role and checkpoint report | removed (evidence) | AgentHub checkpoint/report model; V4 private receipt and public core replace it |
| `AGH-BASE-02` | protocol 1: first-round full review | keep | initial packet and stage contract |
| `AGH-BASE-03` | protocol 1: later delta-only review | keep | continuation delta and frozen initial runtime |
| `AGH-BASE-04` | protocol 1: independent session each round | removed (evidence) | V4 continues first runtime/provider session by design |
| `AGH-BASE-05` | protocol 2: no chat history | keep | provider protocol limits provider to frozen packet |
| `AGH-BASE-06` | protocol 3: reviewer does not edit | keep | provider protocol read-only rule |
| `AGH-BASE-07` | protocol 4: required artifact completeness | host | packet schema, manifest and host source verification |
| `AGH-BASE-08` | protocol 5/8: verdict whitelist | keep | reviewer-output schema |
| `AGH-BASE-09` | protocol 6: insufficient evidence is not pass | keep | business-valid validator and aggregation filter |
| `AGH-BASE-10` | protocol 7: immutable numbered reports/index | keep | immutable private receipt, core projection and report index |
| `AGH-BASE-11` | protocol 9: late blocking finding restriction | keep | `late_finding` reconciliation caps undiscoverable findings |
| `AGH-BASE-12` | protocol 10: cross-phase comparison | keep | cross-stage carryovers in continuation delta |
| `AGH-BASE-13` | protocol 10: `workflow-issues.jsonl` write | removed (evidence) | AgentHub lifecycle artifact; carryover receipt is V4 provenance |
| `AGH-BASE-14` | protocol 11: precondition-fix label | keep | contract-only finding/disposition evidence |
| `AGH-BASE-15` | report markdown envelope/source report path | removed (evidence) | providers never receive host paths; public report is projection |
| `AGH-BASE-16` | revise rootCause/fixApproach | keep | reviewer-output schema/validator |
| `AGH-BASE-17` | escalate reason and pass resolution summary | keep | reviewer-output schema/validator |
| `AGH-BASE-18` | delegated final verifier owns verdict | keep | provider output is sole semantic verdict source |
| `AGH-BASE-19` | delegated facts/risk/candidate findings only | removed (evidence) | V4 has no opaque subreview bundle transport |
| `AGH-BASE-20` | delegated forced read set/coverage downgrade/sample | removed (evidence) | provider cannot access repo; frozen packet is complete review boundary |
| `AGH-INTAKE-01` | shared scope: direction and detail reviewers | keep | `make-decision` direction/detail track contracts |
| `AGH-INTAKE-02` | MR-2 problem-change classification | keep | direction contract C/H rules |
| `AGH-INTAKE-03` | MR-2 scope/priority classification | keep | direction contract C/H rules |
| `AGH-INTAKE-04` | MR-2 interpretation classification | keep | direction contract C/H rules |
| `AGH-INTAKE-05` | MR-2 implementation-only downgrade | keep | contract-only minor finding policy |
| `AGH-INTAKE-06` | severe implementation risk escalates, not blocks | keep | provider `escalate_to_human` verdict |
| `AGH-INTAKE-07` | incremental prior blocking and changed input | keep | continuation previous findings/delta manifest |
| `AGH-INTAKE-08` | repeated blocking root/scope/matrix/checklist | keep | structured closure bundle hard gate |
| `AGH-INTAKE-09` | third repeated blocking escalates | keep | finding-state human gate |
| `AGH-INTAKE-10` | append-only revision record | removed (evidence) | AgentHub report artifact; V4 immutable receipts preserve rounds |
| `AGH-INTAKE-11` | Knowledge root/task absolute path rule | removed (evidence) | AgentHub-only path/runtime assumption; relative packet validation |
| `AGH-INTAKE-12` | direction three axes and five questions | lens | `make-decision` direction skill bundle |
| `AGH-INTAKE-13` | direction required plan-ceo-review/review | lens | stage skill plan and `skillResults` evidence |
| `AGH-INTAKE-14` | direction source is raw context, not decision log | keep | direction packet projection |
| `AGH-INTAKE-15` | direction blocking/nonblocking lists | keep | direction C/H rules and severity policy |
| `AGH-INTAKE-16` | direction communication simplicity advice | removed (evidence) | host response style, not independent-review business rule |
| `AGH-INTAKE-17` | blind framework challenge/no proposed direction input | keep | direction frozen packet profile |
| `AGH-INTAKE-18` | proposed direction in blind packet escalates | keep | material-invalid/human escalation contract |
| `AGH-INTAKE-19` | detail five axes and five questions | lens | `make-decision` detail skill bundle |
| `AGH-INTAKE-20` | detail source honesty/consistency/assumption/AC gates | keep | detail C/H rules |
| `AGH-INTAKE-21` | blindspot blocking/nonblocking list | lens | detail review lens |
| `AGH-INTAKE-22` | drift blocking/nonblocking list | keep | detail source/delta rules |
| `AGH-INTAKE-23` | scope four dimensions and verdict consistency | keep | direction/detail contract evidence |
| `AGH-DESIGN-01` | three axes: problem/spec/boundary | keep | `build-spec.md` C/H rules |
| `AGH-DESIGN-02` | plan-ceo-review requirement | lens | selected design skill bundle |
| `AGH-DESIGN-03` | review requirement | lens | selected design skill bundle |
| `AGH-DESIGN-04` | UI plan-design-review requirement | lens | UI-only stage skill plan profile |
| `AGH-DESIGN-05` | unavailable skill escalates | keep | `skillResults` validation/human verdict |
| `AGH-DESIGN-06` | skill-file fallback | removed (evidence) | provider receives frozen skill files; no host skill-tool fallback |
| `AGH-DESIGN-07` | three-part skill evidence | keep | reviewer-output `skillResults` validator |
| `AGH-DESIGN-08` | hollow skill evidence rejection | keep | reviewer-output validator |
| `AGH-DESIGN-09` | goal/boundary/decision/AC/source questions | keep | build-spec C/H rules |
| `AGH-DESIGN-10` | SPEC deviation decision tree | keep | build-spec contract and human escalation |
| `AGH-DESIGN-11` | incremental full-boundary rescan | keep | delta manifest affected-material policy |
| `AGH-DESIGN-12` | source trace and bidirectional impact trace | keep | build-spec C/H rules |
| `AGH-DESIGN-13` | scope drift/approved scope risk classification | keep | contract severity rules |
| `AGH-DESIGN-14` | objective AC and user-story completeness | keep | acceptance/design packet and contract |
| `AGH-DESIGN-15` | AgentHub RuntimeAdapter/Knowledge boundary | removed (evidence) | AgentHub-only architecture; V4 stages use workflowhub boundary |
| `AGH-DESIGN-16` | AgentHub file placement/Knowledge task path | removed (evidence) | AgentHub-only path/runtime assumption; packet is repo-relative |
| `AGH-DESIGN-17` | Spec-Purity absolute/hook/TS/shell blacklist | keep | build-spec contract packet validation |
| `AGH-DESIGN-18` | UI authorization/state/interaction gate | lens | UI design skill profile |
| `AGH-DESIGN-19` | impact-range exhaustive check and grandfather rule | keep | build-spec impact C/H rules |
| `AGH-DESIGN-20` | ORACLE denominator/paired/source checks | keep | build-spec C/H rules |
| `AGH-DESIGN-21` | nonblocking scope/wording/numbering advice | keep | minor finding policy |
| `AGH-DESIGN-22` | checkpoint package/file-listening rule | removed (evidence) | AgentHub checkpoint mechanism not used by WorkflowHub |
| `AGH-DESIGN-23` | design contract/UI component extraction detail | lens | UI skill profile only when selected |
| `AGH-DESIGN-24` | revision record and repeated-finding rule | keep | receipt history and structured closure bundle |
| `AGH-PLAN-01` | three axes: traceability/executability/verification | keep | `build-plan.md` C/H rules |
| `AGH-PLAN-02` | `speckit-analyze` requirement | lens | repository `spec-analyze` skill bundle |
| `AGH-PLAN-03` | `plan-eng-review` requirement | lens | selected plan engineering lens |
| `AGH-PLAN-04` | independent review requirement | lens | selected review lens |
| `AGH-PLAN-05` | unavailable/hollow skill evidence | keep | `skillResults` validator/human verdict |
| `AGH-PLAN-06` | skill-file fallback | removed (evidence) | frozen bundle is delivered to provider, not host fallback |
| `AGH-PLAN-07` | phase/depends/files/risk/verify/FR principles | keep | build-plan contract |
| `AGH-PLAN-08` | continuation resolution summary per prior finding | keep | closure evidence and receipt finding state |
| `AGH-PLAN-09` | constitution and FR-task-verify trace | keep | build-plan C/H rules |
| `AGH-PLAN-10` | phase size/order/dependency/[P] constraints | keep | build-plan C/H rules |
| `AGH-PLAN-11` | objective verify and fake-command checks | keep | build-plan C/H rules |
| `AGH-PLAN-12` | existing interface signature anchors | host | host-verified facts in immutable packet |
| `AGH-PLAN-13` | forbidden file/upstream merge safety | host | host source/diff and manifest evidence |
| `AGH-PLAN-14` | governance seven-category matrix | host | host-verified facts, not provider filesystem |
| `AGH-PLAN-15` | UI contract/visual six-dimension rules | lens | UI plan-review skill profile |
| `AGH-PLAN-16` | no unapproved fallback/legacy/platform coupling | keep | build-plan scope C/H rules |
| `AGH-PLAN-17` | behavior, not existence-only acceptance | keep | build-plan contract |
| `AGH-PLAN-18` | pass is not human approval/STOP | keep | disposition and human-gate protocol |
| `AGH-PLAN-19` | concept drift, impact coverage, YAGNI/KISS | keep | build-plan C/H rules |
| `AGH-PLAN-20` | nonblocking phase/file/UI suggestions | keep | minor finding policy |
| `AGH-PLAN-21` | knowledge/checkpoint artifact planning | removed (evidence) | AgentHub lifecycle artifact model |
| `AGH-PLAN-22` | repeated finding/revision record | keep | closure bundle and immutable receipt history |
| `AGH-CODE-01` | three axes: spec/standards/structural quality | keep | `build-code.md` C/H rules |
| `AGH-CODE-02` | six behavior/scope/test/evidence/side-effect questions | keep | build-code contract |
| `AGH-CODE-03` | AgentHub gate.sh/guard.sh automation split | removed (evidence) | AgentHub hooks absent; V4 host verifies packet evidence |
| `AGH-CODE-04` | continuation prior finding/delta/boundary rescan | keep | continuation delta and affected materials |
| `AGH-CODE-05` | new blocking restriction | keep | late-finding state reconciliation |
| `AGH-CODE-06` | independent session each round | removed (evidence) | V4 broker continuation is mandatory |
| `AGH-CODE-07` | functional/test/scope/evidence/FR blocking list | keep | build-code C/H rules |
| `AGH-CODE-08` | report/readability/index/summary minor list | removed (evidence) | AgentHub report lifecycle artifacts |
| `AGH-CODE-09` | design/standards/task/diff review matrix | keep | packet material and build-code contract |
| `AGH-CODE-10` | test command/shell diagnostic execution | host | host test evidence and manifest/hash |
| `AGH-CODE-11` | structural quality gate branches/leaks/duplication | lens | code review skill lens |
| `AGH-CODE-12` | absolute path/cast/atomicity/file-size/wrapper gate | keep | build-code C/H rules |
| `AGH-CODE-13` | RED/GREEN provenance and no placeholders | host | packet test evidence and host facts |
| `AGH-CODE-14` | Host-Verified Facts conflict escalates | keep | validator/human verdict policy |
| `AGH-CODE-15` | FR consumption scan/revise-plan artifact | removed (evidence) | AgentHub revision artifact; closure bundle anchors current delta |
| `AGH-CODE-16` | repeated finding closure requirements | keep | structured closure bundle hard gate |
| `AGH-CODE-17` | substantive review four questions | lens | code review skill lens |
| `AGH-CODE-18` | append-only report revision triple | removed (evidence) | AgentHub report/request identifiers not exposed in V4 |
| `AGH-ACCEPT-01` | three axes: AC/evidence/workflow closure | keep | `verify-code.md` C/H rules |
| `AGH-ACCEPT-02` | `qa-only` must be used, not `qa` | lens | selected acceptance skill bundle |
| `AGH-ACCEPT-03` | `verify-change --light` requirement | lens | selected verification skill bundle |
| `AGH-ACCEPT-04` | unavailable/hollow skill evidence | keep | `skillResults` validator/human verdict |
| `AGH-ACCEPT-05` | skill-file fallback and openspec ban | removed (evidence) | frozen repository bundle; AgentHub command naming absent |
| `AGH-ACCEPT-06` | AC/fresh/verdict/Knowledge/delivery questions | keep | verify-code contract |
| `AGH-ACCEPT-07` | continuation prior finding/delta/new-blocking limit | keep | continuation delta and late-finding policy |
| `AGH-ACCEPT-08` | first-round `workflow-issues.jsonl` record | removed (evidence) | AgentHub lifecycle artifact; V4 carryovers |
| `AGH-ACCEPT-09` | report-index open status list | removed (evidence) | AgentHub index model; V4 core receipt findings |
| `AGH-ACCEPT-10` | AC/plan-test/user-problem coverage | keep | verify-code C/H rules and packet evidence |
| `AGH-ACCEPT-11` | fresh round raw output/no historical citation | host | host test evidence and manifest/hash |
| `AGH-ACCEPT-12` | test/typecheck/build/no skipped tests | host | host test evidence |
| `AGH-ACCEPT-13` | evidence JSON/provenance/no placeholders | host | host verified facts and packet manifest |
| `AGH-ACCEPT-14` | latest earlier review/revision closure | keep | prior core receipt and continuation finding state |
| `AGH-ACCEPT-15` | browser QA/screenshots/trace/hash/tool consistency | lens | `isolated-browser-qa` UI-only skill profile |
| `AGH-ACCEPT-16` | visual comparison/design contract latest | lens | UI acceptance skill profile |
| `AGH-ACCEPT-17` | scope/target/self-consistency | keep | verify-code contract |
| `AGH-ACCEPT-18` | ORACLE denominator/paired/source rules | keep | verify-code C/H rules |
| `AGH-ACCEPT-19` | minor screenshot/report/config/fixture suggestions | keep | minor finding policy |
| `AGH-ACCEPT-20` | every FR and original request no sampling | keep | verify-code C/H rules |
| `AGH-ACCEPT-21` | dogfood exemption reason | keep | verify-code packet/contract rule |
| `AGH-ACCEPT-22` | repeated verification evidence escalation | keep | structured closure bundle and human gate |
| `AGH-ACCEPT-23` | Knowledge close/archive/BrainInbox procedure | removed (evidence) | AgentHub-only lifecycle and absolute path assumption |

## Closure bundle evidence

When an open blocking finding has `blocking_streak >= 2`, a closure is valid only
with root cause, scanned scope, counterexample matrix, checklist, repo-relative
anchors tied to current file hashes, and the exact current delta hash. Missing or
mismatched material remains open, produces a human gate, and cannot publish pass.
