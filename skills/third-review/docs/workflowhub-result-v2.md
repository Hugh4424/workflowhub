# workflowhub-result.v2 public contract

## Purpose

`workflowhub-result.v2` is the public 3rd-review result consumed by
WorkflowHub. It exposes only broker-safe execution facts. It never grants
access to the runtime directory, provider working directory, raw output files,
or native session files.

## Request

Use a v4 broker request with `required_result_protocol: "workflowhub-result.v2"`
and a non-empty `provider_allowlist` candidate group of configured profile IDs.
The broker owns group dispatch: it keeps the caller's group order and starts
at most one candidate per CLI adapter in parallel. The first heterologous
candidate for an adapter is eligible to run; a host-adapter candidate and each
later candidate with an already selected adapter are not request errors. They
are returned as public failed results with `error.code: "SAME_SOURCE"`, without
starting that CLI. The same selection applies to initial and continuation
rounds. This lets WorkflowHub request multiple review perspectives without
duplicating 3rd-review's adapter isolation, workspace, attachment, retry, and
native-session handling.

Like v1, every initial or continuation round requires a complete sealed
attachment bundle. The broker rejects an unsupported protocol before creating a
runtime or starting a provider.

## Provider result

Every returned provider result has these fields:

    provider, adapter, model, effort, thinking
    status, result_protocol, material_id
    runtime_id, session_id, session_file_path, continuable
    timing.started_at_ms, timing.completed_at_ms, timing.duration_ms
    usage
    retry.count, retry.progress_events
    raw_output_ref
    unavailable_diagnostics
    output, error

- `model`, `effort`, and `thinking` are the selected trusted profile's
  invocation facts. They are `null` when that profile does not declare one.
- Each `timing` member is a non-negative integer when the broker observed it;
  otherwise it is `null`.
- `usage` is provider-parsed usage only. It is `null` when the provider did
  not return usage; packet size is not substituted as usage.
- `session_file_path` is always `null`. `runtime_id` and `session_id` are
  opaque identifiers, not filesystem paths.
- `raw_output_ref` is either `null` or a logical reference containing the
  runtime ID, provider ID, and stdout/stderr SHA-256 digests. It is a
  correlation reference, not a readable path or fetch capability.
- `unavailable_diagnostics` is `null` for a completed result. Otherwise it
  contains only the public error code and message, including `SAME_SOURCE` for
  a candidate excluded by host-adapter isolation or a later same-adapter group
  candidate.
- Every non-completed provider result has a non-empty `error.code` and
  `error.message`; `unavailable_diagnostics` carries the same public code and
  message. A missing provider message becomes the fixed safe text `provider
  error message is unavailable`.

The broker validates this exact provider projection before publishing it. An
undocumented field, a non-null `session_file_path`, invalid timing/retry shape,
or an absolute host path is rejected. A provider error that includes an
absolute host path retains its stable error code but replaces the message with
the fixed public redaction text. Empty error messages are rejected at public
group validation, so they cannot reappear through a managed status response.

`status: "skipped"` is normalized to `"failed"` in both WorkflowHub public
protocols so a route cannot treat a skipped review as a successful result.

## Compatibility and privacy

`workflowhub-result.v1` remains supported with its exact seven-field provider
projection. `doctor.result_protocols` advertises both versions. Consumers must
select a version explicitly and must not read broker-private runtime state to
fill absent fields.

## Managed group lifecycle

`3rd-review start` owns an asynchronous `workflowhub-result.v2` group.  It
requires the normal V4 request, its sealed attachment triple, and a caller
supplied `--request-id`.  It validates and copies the material into broker
private storage before it starts a detached manager.  The public start result
is exactly:

```json
{
  "version": "workflowhub-run.v1",
  "request_id": "opaque-id",
  "runtime_id": "opaque-id",
  "state": "starting|running|terminal",
  "material_id": "sha256"
}
```

The same request ID and immutable request/material/route binding reconnect to
the same runtime. A changed binding fails with `REQUEST_ID_CONFLICT`.
`status --runtime-id` returns the same public shape while running and has no
provider output. At terminal state it adds one `group`, which is the validated
`workflowhub-result.v2` group. Its provider `raw_output_ref` is always `null`;
it never exposes a runtime path, raw-output reference, attachment path, or
native session-file path.

`cancel --runtime-id` is the managed cancellation operation. Legacy
provider-specific cancel with `--provider` remains available only for
non-managed runtimes.
Caller SIGTERM is not cancellation. If the detached manager identity is
confirmed lost, status publishes `SESSION_MANAGER_LOST` without signalling a
healthy provider; an explicit managed cancel can still terminate that
provider and replace the terminal group with `CANCELLED`.
