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

Broker command, broker config, and packet root come only from the host-owned
`~/.workflowhub/config.json` `third_review` object. They are never accepted in a
workflow/CLI request. `third_review.attachment_root` must be a real directory, and
the selected 3rd-review config must allowlist that exact realpath with source prefix
`.wh-review-packets`; otherwise dispatch fails before a provider starts. The broker
doctor is always called with that same root and must return
`attachment_root.status:"ready"`.

Provider candidates, attachment delivery support, and continuation eligibility come only from the selected broker command's validated `doctor.providers[]` snapshot. Callers must not provide `provider_capabilities` or `attachment_delivery`; both are rejected instead of forwarded. The first round stores the normalized snapshot hash and the actual candidate/continuable provider sets. A changed snapshot blocks continuation until a human-approved reset.

Before any provider prompt is rendered, the host freezes one complete provider-visible triad: `review-packet.v1.json`, `changes.diff`, and a non-self-referential `manifest.json`. The inner manifest binds packet/diff hashes, changed files, byte total, and every covered attachment name/size/SHA-256; the broker's outer manifest binds the inner manifest itself. For `file_only`, every triad attachment is `embed:false` and the request is only a short instruction, attachment IDs, and the inner-manifest hash—never a diff, packet, chunk, host path, worktree path, or repository handle. `always_embed` receives the same frozen material; the broker alone renders and applies its total final-prompt byte gate. Raw provider-visible source containing an absolute-path literal fails as `SOURCE_CONTAINS_ABSOLUTE_PATH`; it is not silently redacted or given a new hash.

First round stores one `initial_runtime_id` and the initial provider-material manifest hash in the private receipt. Later rounds reuse `continuation:{runtime_id:initial_runtime_id}` and deliver a separately frozen delta triad (including `continuation-delta.v1.json`); they never put delta content in the prompt, pass raw provider session ids, or silently start a new runtime. Missing/expired/ineligible continuation requires `wh-review-cli.mjs reset` with `reason` and `human_approval_ref`.

## Contract, track, and skill source

`contracts/provider-protocol.md` is shared by every provider. The selected stage contract is the only stage rule source. `make-decision` requires an explicit `direction` or `detail` track; the tracks are separate review flows.

Required skills resolve only from this repository's `skills/` directory and must declare `review-bundle.json`. Host skill directories, nested framework paths, and implicit fallback are not valid sources. Bundles are report-only lenses; external providers receive only the frozen bundle selected by `stage-skill-plan.json`.

## Provider outcomes, receipts, and cancellation

Each provider has independent `transport_status`, `packet_status`, and `semantic_verdict`. Only `completed + complete + business_valid + semantic_verdict` participates in aggregate findings. `CANCELLED`, authentication failure, timeout, malformed JSON, material incompleteness, and hash mismatch are diagnostics, never semantic verdicts. A cancellation must record its source; broker liveness/duration limits remain broker-owned and no wh-review outer timeout kills a provider.

Private receipts retain `runtime_id`, provider `session_id`, delivery mode, provider-visible manifest hash, material byte total, and a copied original stdout/stderr audit chain below `reviews/private/round-*`: `raw_output_ref`/`raw_stdout_ref` bytes must hash to `raw_stdout_sha256`, and `raw_stderr_ref` bytes must hash to `raw_stderr_sha256`. Parsed provider text is separate (`parsed_output_ref`/`parsed_output_sha256`) and is never represented as raw stdout. Delivery/copy success is not a verdict: only broker raw output followed by host disposition can publish a semantic verdict. Core receipt, report, report index, and stage result are ordered, atomic redacted projections. Runtime/session/raw/parsed paths must never appear in public artifacts. A published `semantic_verdict` is cryptographically bound into the core receipt and is accompanied by its `core_receipt_hash` and `needs_human` flag.

## Durable artifacts

Paths are resolved through `core/task-dir-parser.mjs` (`WORKFLOWHUB_TASK_DIR`, then workflowhub configuration); no machine-specific task path is hardcoded.

- `tasks/{task-id}/reviews/private/round-*/review-packet.json`
- `tasks/{task-id}/reviews/private/round-*/providers/<provider>.raw.txt`
- `tasks/{task-id}/reviews/private/round-*/round-receipt.json`
- redacted core receipt, Chinese report, report index, and stage result under `tasks/{task-id}/reviews/`

## Verdict handling

Any hard-invariant finding is `revise_required` regardless of provider majority. The main Agent must disposition every merged finding as `accept`, `reject`, or `defer` with evidence; it cannot accept a hard-invariant finding. Never convert infrastructure failure into `pass` or reviewer findings.
