---
name: wh-review
description: workflowhub-specific heterologous review dispatch layer. Owns stage routing, round-state, artifact packaging, provider execution, diagnostics, degrade/escalate rules, and report rendering.
---

# wh-review

## Goal

`wh-review` is workflowhub's heterologous review orchestration layer. It routes each workflow stage to its review contract, maintains review rounds, builds immutable review inputs, invokes the selected independent provider, records diagnostics, and renders durable reports. A synthetic failure is never a usable review verdict and must not be presented as independent review findings.

## Input and stage routing

The caller supplies:

- `task_id`, matching `^[A-Za-z0-9._-]+$` with no path separator or `..`.
- `stage`, exactly one of the following values.

| stage | contract |
|---|---|
| `make-decision` | `skills/wh-review/contracts/make-decision.md` |
| `build-spec` | `skills/wh-review/contracts/build-spec.md` |
| `build-plan` | `skills/wh-review/contracts/build-plan.md` |
| `build-code` | `skills/wh-review/contracts/build-code.md` |
| `verify-code` | `skills/wh-review/contracts/verify-code.md` |

Unknown stages and unsafe identifiers fail loud. They are not sanitized or routed to a generic contract.

## V4 round protocol

All production callers use `ReviewRoundFacade` through `wh-review-cli.mjs run`. It has three operations: `prepare()` seals `review-packet.v1`, `run()` calls the broker and validates provider output, and `publish()` writes disposition-bound projections. No workflow may call a provider runner directly. An unpublished CLI `run` result is transport/packet evidence only and has no public semantic verdict. After dispositions, `publish()` is the sole public decision boundary and returns `{ semantic_verdict, core_receipt_hash, needs_human }`.

The only broker execution form is:

```text
<third_review.command> run --config=<config> --request=<request> [--attachments=<manifest>]
```

Optional attachment and cancellation-source arguments require machine-readable `doctor` capability declarations from the selected broker command: `capabilities.attachments:true` and `capabilities.cancel_source:true`. Caller configuration cannot assert either capability. A base V4 CLI that lacks either declaration fails loud during dispatch; wh-review never sends unsupported flags or silently drops a cancellation source.

Provider candidates, attachment delivery support, and continuation eligibility come only from the selected broker command's validated `doctor.providers[]` snapshot. Callers must not provide `provider_capabilities` or `attachment_delivery`; both are rejected instead of forwarded. The first round stores the normalized snapshot hash and the actual candidate/continuable provider sets. A changed snapshot blocks continuation until a human-approved reset.

The packet is the provider's entire evidence boundary: unified diff, changed-file hashes, requirement/AC/design excerpts, host-verified test evidence, manifest/hash, contract hash, and skill bundle hash. Providers review `review-packet.v1.json` and frozen attachments only. They must not access the real repository, run `git`, or request absolute paths.

First round stores one `initial_runtime_id` in the private receipt. Later rounds send only `continuation:{runtime_id:initial_runtime_id}` and delta/closure material. They never pass raw provider session ids or silently start a new runtime. Missing/expired/ineligible continuation requires `wh-review-cli.mjs reset` with `reason` and `human_approval_ref`.

## Contract, track, and skill source

`contracts/provider-protocol.md` is shared by every provider. The selected stage contract is the only stage rule source. `make-decision` requires an explicit `direction` or `detail` track; the tracks are separate review flows.

Required skills resolve only from this repository's `skills/` directory and must declare `review-bundle.json`. Host skill directories, nested framework paths, and implicit fallback are not valid sources. Bundles are report-only lenses; external providers receive only the frozen bundle selected by `stage-skill-plan.json`.

## Provider outcomes, receipts, and cancellation

Each provider has independent `transport_status`, `packet_status`, and `semantic_verdict`. Only `completed + complete + business_valid + semantic_verdict` participates in aggregate findings. `CANCELLED`, authentication failure, timeout, malformed JSON, material incompleteness, and hash mismatch are diagnostics, never semantic verdicts. A cancellation must record its source; broker liveness/duration limits remain broker-owned and no wh-review outer timeout kills a provider.

Private receipts retain `runtime_id`, provider `session_id`, raw output, and diagnostics below `reviews/private/round-*`. Core receipt, report, report index, and stage result are ordered, atomic redacted projections. Runtime/session/raw paths must never appear in public artifacts. A published `semantic_verdict` is cryptographically bound into the core receipt and is accompanied by its `core_receipt_hash` and `needs_human` flag.

## Durable artifacts

Paths are resolved through `core/task-dir-parser.mjs` (`WORKFLOWHUB_TASK_DIR`, then workflowhub configuration); no machine-specific task path is hardcoded.

- `tasks/{task-id}/reviews/private/round-*/review-packet.json`
- `tasks/{task-id}/reviews/private/round-*/providers/<provider>.raw.txt`
- `tasks/{task-id}/reviews/private/round-*/round-receipt.json`
- redacted core receipt, Chinese report, report index, and stage result under `tasks/{task-id}/reviews/`

## Verdict handling

Any hard-invariant finding is `revise_required` regardless of provider majority. The main Agent must disposition every merged finding as `accept`, `reject`, or `defer` with evidence; it cannot accept a hard-invariant finding. Never convert infrastructure failure into `pass` or reviewer findings.
