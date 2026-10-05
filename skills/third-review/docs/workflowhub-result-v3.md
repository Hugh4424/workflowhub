# workflowhub-result.v3

`workflowhub-result.v3` is the additive public result protocol for WorkflowHub.
The existing v1 and v2 projections remain unchanged and remain readable by
their existing consumers.

The broker owns provider execution. A v3 group contains one member for every
configured profile in the submitted candidate group. A member is terminal on
its own; one successful member is not rerun because another member failed.
`completed`, `partial`, `unavailable`, and `cancelled` are aggregate facts, not
stage completion permissions.

Each member exposes safe profile identity, material/contract identity, an
explicit provider deadline fact (always `null` in v4; the broker adds no
wall-clock execution limit), timing, provider usage (or `null`), every broker
attempt, and three separate recovery counters:

- `provider_internal_retry_count`
- `fresh_execution_retry_count` (at most one)
- `same_session_repair_count` (at most one)

Raw output and session paths stay private. Public provenance contains only the
runtime identifier and output digests. A v2 member or group is rejected as a
mixed-version result; callers must explicitly request the protocol they consume.

### Public member details

`output` is the provider's review body, not a private attachment channel. It is
published only when non-empty and free of host absolute paths and `file://`
URIs. The same path-safety validation applies when validating an already-built
v3 group; callers cannot bypass it by constructing a member directly. Logical
API routes such as `/api/items/42`, slash-separated review terms such as
`map/AC`, ordinary prose mentioning a bare token such as `/secret`, and JSX/HTML
closing-tag syntax such as `</li>` remain valid.

Each public attempt has the fields `attempt_id`, `completed_at_ms`,
`duration_ms`, `error`, `kind`, `parse_outcome`, `process_outcome`,
`provider_retry_count`, `session_id`, `started_at_ms`, and `status`. The two
outcome fields are nullable when the producer has no fact. Otherwise
`process_outcome` is one of `ok`, `timeout`, `launch_failure`, or `exit_nonzero`;
`parse_outcome` is one of `ok`, `empty_output`, or `invalid`. Attempt objects
are allow-listed; unknown fields are rejected.

Public errors contain `code` and `message`, and may additionally contain
`cause_code` when a provider error is normalized to a public error. All are
non-empty safe strings; private paths are rejected. No other error fields are
published.

Recovery is classified once by the broker: configuration/authentication,
packet, and timeout errors do not recover; startup/death/recoverable transport
errors may receive one fresh execution; output syntax/schema errors may receive
one same-session repair when the provider has a resumable native session. A
same-session repair does not become a fresh execution when no session is
available. Other result protocols do not inherit this v3 retry policy.
Generic fresh-execution recovery is suppressed for `single_round` and
`full_only` review modes. This does not suppress the separately scoped Cursor
prompt-only permission-denial escalation: it is available only without
attachments, strengthens the no-tools directive, and never applies to bundled
`file_only` runs; see [the Cursor adapter contract](cursor-adapter.md). Output-
parse same-session repair remains limited to one attempt.
WorkflowHub does not add another retry layer.

Usage token counters remain non-negative safe integers. Provider accounting may
also expose a finite non-negative decimal `cost`; the broker may add it across
recovery attempts without treating it as a token counter.
