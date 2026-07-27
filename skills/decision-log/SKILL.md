---
name: decision-log
description: Convert supplied decision material into a structured downstream record.
---

# Decision Log

Receive original requirement, confirmed direction, constraints, rejected
alternatives, risks, and a controlled TaskHandle record callback from
make-decision. Do not accept or derive any filesystem root or task path.

Produce the human-readable `decision-log.md` from
[`templates/decision-log-template.md`](./templates/decision-log-template.md).
The main document and every accepted omission use the same
`decision-entry.v1` shape; there is no shorter appendix-only decision shape.
Return the content to the parent, which records it through TaskHandle/TaskKernel.
Missing load-bearing reasoning is reported rather than invented.

Record every load-bearing decision separately. Each entry must state:

- **Question and final option**: the plain-language question and the option
  actually selected.
- **Recommendation**: whether the selected option was recommended and why.
- **Plain-language meaning**: what the option means without internal IDs or
  workflow terms.
- **Decision**: the exact choice that now governs downstream work.
- **Source**: a specific original requirement, actual user answer, research
  result, code fact, grill result, or independent-review finding. Preserve the
  supplied stable source reference and one exact answer excerpt. If no reference
  was supplied, say it is missing; do not write only “confirmed” or “from discussion”.
- **Facts and constraints**: the evidence-bearing premises used.
- **Logic**: `source fact -> constraint -> chosen option -> expected result`.
- **Choice and reason**: why this option won.
- **Impact**: affected scope, interface, acceptance, data, security, or
  operations.
- **Consequences and risks**: immediate trade-offs and future cost.
- **Rejected alternatives**: each rejected option and its rejection reason.
- **Unresolved items**: what remains undecided, why, and who must resolve it.
- **Supersedes**: the exact earlier decision replaced, or `none`.
- **Approval binding**: approval status plus the supplied host-visible
  reference and hash. The hash is delivery binding, not proof of human identity.

Preserve actual user wording when it defines an interface or boundary. If a
later answer changes an earlier decision, retain both entries and make the new
entry's `supersedes` relationship explicit; never rewrite history as if the old
decision did not exist.

Before final confirmation, run the automatic coverage audit over every original
requirement, actual user answer, adopted grill/review choice, and load-bearing
decision. Each source item must map exactly once to the main document or to one
`decision-omission-acceptance.v1` appendix. Show every missing item to the user
and wait for a real choice before continuing. A review risk record cannot stand
in for omission acceptance.

Publish a `decision-correction-appendix.v1` for D1-D7. It points to the original
decision ref/hash, uses the accepted literal correction text, and sets
`does_not_rewrite_upstream=true`; never edit the old bytes.

The documentation and exit-check section must record the supplied
`grill-with-docs` result: `CONTEXT.md` changed/no-change with reason and file
reference; ADR created/not-needed with reason and file reference; each of the
three ADR criteria — hard to reverse, surprising without context, and a genuine
trade-off; terminology/ADR conflicts and resolution; and all four
objective exit checks. Missing facts stay missing rather than being inferred.

Also return a host-visible summary that does not copy the full log. For each
load-bearing decision, state the decision, source type, plain-language reason,
affected scope, consequence, and main risk. End with explicit non-goals,
unresolved items, and the documentation outcome. Keep internal IDs, paths,
hashes, receipt/attempt refs, and raw evidence out of this summary.
