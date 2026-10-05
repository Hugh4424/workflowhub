# WorkflowHub managed review session design

## Problem

`3rd-review run` is a blocking child process. If the caller's execution host
receives `SIGTERM`, the broker's current signal handler calls `shutdown()` and
terminates otherwise healthy provider processes. Leaving the child detached is
not a fix: it loses deterministic result collection and creates unmanaged
orphans.

The review lifecycle must be owned by 3rd-review, not by a temporary WorkflowHub
caller process. WorkflowHub must consume only public facts and must never read
broker runtime state, raw output, session files, or paths.

## Scope

- Add a managed asynchronous API for `workflowhub-result.v2` groups:
  `start`, `status`, and explicit `cancel`.
- Preserve existing blocking `run` behavior for compatible direct consumers.
- Keep provider routing, same-source exclusion, sealed material validation,
  public-result privacy isolation, and native continuation semantics unchanged.
- Do not add time, packet-size, token, output-count, or retry-count limits.

## Public contract

`start` takes the existing V4 request and sealed attachment triple plus a
caller-supplied deterministic `request_id`.

It returns only:

```json
{
  "version": "workflowhub-run.v1",
  "request_id": "opaque-id",
  "runtime_id": "opaque-id",
  "state": "starting|running|terminal",
  "material_id": "sha256"
}
```

The same `request_id` with the same immutable request/material/route binding
returns the same runtime. A different binding fails `REQUEST_ID_CONFLICT`.

`status` takes `runtime_id` and returns public lifecycle facts. Before terminal
state it includes no provider output. At terminal state it includes exactly one
validated `workflowhub-result.v2` group. It never returns a runtime path,
state-file path, raw-output reference, attachment path, or native session-file
path.

`cancel` is the only action allowed to stop providers. It records a public
cancelled terminal result; a caller `SIGTERM` does not imply cancellation.

## Ownership and private state

`start` validates and freezes the request/material binding before returning,
then launches a detached session manager. The manager, not the start/status
caller, owns provider processes and writes the terminal public group atomically
inside broker-private runtime storage.

Private state may contain the sealed job, config snapshot, process identity,
provider workspaces, raw output, native sessions, and absolute paths. It is not
part of the public API. The manager must validate the terminal public group for
schema and private-path safety before publishing it.

Each execution has an `operation_id`; continuation creates a distinct operation
under the same runtime. A running operation cannot overlap another operation on
that runtime. This prevents status from returning a previous round's group.

If the manager identity is conclusively lost, the operation becomes terminal
`SESSION_MANAGER_LOST` without signalling healthy provider processes. Explicit
cancel remains available. Cleanup may remove only expired inactive runtimes.

## WorkflowHub integration

WorkflowHub computes a deterministic request id from its canonical review
identity, material id, route/policy identity, host provider and prompt hash.
It writes a small immutable dispatch intent, calls `start`, and polls public
`status` until terminal. Polling has no deadline and performs no cancellation.
On restart it reuses the dispatch intent and calls `start` again, so it reconnects
to the same broker runtime instead of dispatching another reviewer group.

Only short record locks guard dispatch-intent and terminal attempt/result writes.
Provider execution is never held under a WorkflowHub record lock. The migration
removes `REVIEW_LOCK_WAIT_MS`, the TaskHandle's fixed record-lock timeout,
`brokerRuntimeRoot`, `state.json` probes, and `session_artifact_path` reporting.

## Required tests

1. Kill a `start`/`status` caller while the managed provider remains healthy;
   a later status call returns the same terminal group.
2. Repeat `start` with an identical request id: one runtime and one provider
   execution. A changed binding returns `REQUEST_ID_CONFLICT`.
3. Explicit cancel is the only path that terminates a provider and yields a
   cancelled public terminal group.
4. Public start/status/result bytes contain no private paths, raw output, or
   session-file paths; a polluted provider remains only that provider's
   `PUBLIC_RESULT_INVALID` failure.
5. Continuation gets a new operation id, cannot overlap, and status never
   returns an earlier operation result.
6. WorkflowHub restart/retry reconnects by dispatch intent without duplicate
   dispatch; reviews longer than the old 10-second/5-minute windows complete.
