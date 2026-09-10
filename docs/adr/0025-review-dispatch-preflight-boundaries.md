# ADR 0025 — Review dispatch preflight boundaries

- Status: Accepted
- Date: 2026-09-09
- Scope: review dispatch preflight and public lifecycle facts

## Decision

Review preflight is a bounded, authenticated dispatch check for current identity,
material, route, provider selection, token/context/health observations, and
capability compatibility. A rejection before dispatch records `blocked_before_dispatch`
with zero provider calls; an unknown observation proceeds only under the existing
byte/identity checks and remains an explicit quality fact. Provider start/status,
recovery, terminal aggregation, and member harvesting remain runtime-owned and are
reported through the existing public status contract.

The packet plan remains telemetry about material selection and exclusion. It is not
an outer budget, release gate, quality gate, or reason to poll from the main session.
Provider `pass`, `revise_required`, `unavailable`, `unknown`, and preflight failure
remain quality facts; none is rewritten into a stage pass. Missing enforcement or
unverifiable capability remains `unavailable`.

## Boundaries and consequences

- No new public stage, command, store, broker/provider protocol, or duplicate writer.
- The existing broker-managed lifecycle and canonical review writer remain the only
  publication path.
- ADR 0007's runtime-owned public status polling and non-gate semantics are preserved.
- `standard-workflow.md` continues to treat timing as diagnostic only and keeps no
  unified budget gate.
- This ADR amends only the approved packet-plan and unified-budget wording; unrelated
  governance, constitutional, and workflow materials are unchanged.
