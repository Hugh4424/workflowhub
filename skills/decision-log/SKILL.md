---
name: decision-log
description: Convert supplied decision material into a structured downstream record.
---

# Decision Log

Receive original requirement, confirmed direction, constraints, rejected
alternatives, risks, and a controlled TaskHandle record callback from
make-decision. Do not accept or derive any filesystem root or task path.

Produce these sections: goal, scope, decisions, alternatives, constraints,
risks, documentation and exit checks, and unresolved items. Return the content
to the parent, which records it through TaskHandle/TaskKernel. Missing
load-bearing reasoning is reported rather than invented.

Record every load-bearing decision separately. Each entry must state:

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

Preserve actual user wording when it defines an interface or boundary. If a
later answer changes an earlier decision, retain both entries and make the new
entry's `supersedes` relationship explicit; never rewrite history as if the old
decision did not exist.

Before final confirmation, reconcile every actual user answer and every adopted
grill or review choice against the entries. Each must map to one decision entry
or be explicitly marked as a non-decision fact. This is a text completeness
check, not a new ledger or schema.

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
