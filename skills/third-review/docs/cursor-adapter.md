# Cursor Agent adapter

`cursor` profiles execute the native `cursor-agent` CLI. The adapter keeps the
same broker-facing contract as the other streamed, continuable providers:

- prompts are delivered on stdin;
- `stream-json` provides progress, one native session ID, one successful
  terminal result, final assistant text, and usage;
- continuation must resume the exact native session;
- `file_only` and `always_embed` attachment delivery are supported;
- `doctor` checks the executable only, while real model verification remains a
  separate broker smoke test.

Cursor stores authentication and conversations in host state. Profiles
therefore require `allow_host_state: true`. Each broker runtime uses a stable,
mode-0700 HOME, XDG directories, and Cursor data directory. Only the macOS
`login.keychain-db` is linked into that HOME so native Cursor login keeps
working without copying or printing a token. This prevents the process from
loading the user's normal Cursor, Claude, Codex, or Agents configuration.

The broker runs with Cursor's sandbox enabled. A generated isolated CLI profile
denies native reads, writes, shell, and web fetches. It enables unrestricted
approval only inside that isolated profile to work around the current Cursor
CLI bug that ignores project MCP allowlists in headless mode. The only generated
MCP server exposes `list_bundle` and `read_bundle`; both are rooted below the
realpath of the frozen bundle, expose only destinations declared in the
broker-owned attachment control, and recheck size plus SHA-256 on every read.
The control file itself is never listed or readable. Stream supervision
immediately terminates any tool call that is not an admitted bundle call. The
sealed `bundle/` remains hash-verified by the broker.

A prompt-only review has no frozen bundle, so the server is pointed at an empty
bundle directory that carries no control file. It still starts and advertises an
empty file set, because exiting instead made Cursor report the allowlisted
server as missing; the agent's discovery attempt then returned a degraded event
that supervision could not attribute, and the whole review failed. An empty
control set still declares nothing readable, and a control file that is present
but malformed remains a hard startup failure.

Because a prompt-only request has no bundle, *every* tool call it makes is out
of scope and supervision kills the turn. Review prose is dense with `path:line`
citations, which is precisely the shape that makes the agent reach for a read
tool, so these reviews failed frequently with `PROVIDER_PERMISSION_DENIED`. The
adapter therefore owns the constraint rather than trusting each caller to prefix
its own "do not read files" text: when no bundle exists it prepends a text-only
directive stating that no files are attached, that no tool may be called, and
that every `path:line` is literal quoted text. It also passes `--mode ask`, the
CLI's read-only Q&A mode. There is no native "no tools at all" switch, so
`--mode ask` only narrows the surface; the prompt directive and stream
supervision remain the actual guarantee.

If a prompt-only turn is still denied, the broker retries it exactly once with a
strictly stronger directive, as a fresh turn rather than a resume, because the
denied session was killed mid tool call. The retry is gated on the adapter's
`promptOnlyRetry` flag, which is set from bundle absence, and is single-shot: the
escalated plan never sets the flag again. A bundled `file_only` run never carries
the flag, so its permission denials stay terminal and its tool surface, prompt,
and `deny` permissions are unchanged. The retry grants no capability; it only
restates the rule, and the extra turn is recorded in `retry_count` rather than
hidden.

Admission is decided on the `tool_call` `started` event, which carries the
authoritative target identity, and is consumed by its matching `completed`
event. Cursor may omit the server and tool arguments from the completion, so
re-deriving admission from a completion would deny an already-scoped call. A
large `read_bundle` result can also contain Cursor's `outputLocation.filePath`;
the adapter records that exact path only when it resolves to a regular file
under the current isolated `cursor-data/**/agent-tools` directory, then admits
one paired native `readToolCall` for that path. Other native reads remain
denied. An unmatched or replayed completion, a call without an id, and any
call whose start was never admitted all remain permission denials.

These controls are a provider permission boundary, not an operating-system
read sandbox. Cursor's account/team policy and built-in behavior remain part of
the provider baseline. The native-login bridge, `--data-dir`, MCP approval, and
permission behavior are version-sensitive, so the real status, model, initial,
attachment, native-read denial, and resume probes must be rerun after a Cursor
CLI upgrade.

The canonical local profile is:

```json
{
  "cursor/grok": {
    "enabled": true,
    "allow_host_state": true,
    "command": "/Users/Hugh/.local/bin/cursor-agent",
    "model": "cursor-grok-4.5-high",
    "effort": null,
    "thinking": null,
    "auth": { "type": "native" },
    "env": []
  }
}
```

The model name encodes the High reasoning variant. Generic `effort` and an
explicit `thinking: false` are rejected instead of being silently ignored.
