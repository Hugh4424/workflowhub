# agent-browser Workflow

Canonical Standard Workflow §4 owns engine selection and full guide loading.

## Launch

Use the canonical Standard Workflow launch with the same session/whitelist. Then snapshot -i -c and use fresh @ref selectors for click/fill/press; refresh refs after navigation or DOM changes.

## Useful QA Commands

```bash
agent-browser --session "$BROWSER_QA_SESSION" screenshot /tmp/codex-qa.png
agent-browser --session "$BROWSER_QA_SESSION" console --json
agent-browser --session "$BROWSER_QA_SESSION" errors --json
agent-browser --session "$BROWSER_QA_SESSION" network requests
agent-browser --session "$BROWSER_QA_SESSION" storage local
agent-browser --session "$BROWSER_QA_SESSION" get url
```

## Repair

Canonical Standard Workflow §6 owns repair and failure handling.

## Safety

Use `--allowed-domains`, `--content-boundaries`, and `--max-output` by default.

Do not run `eval`, upload files, download files, or leave the target domain unless the task requires it.

Console observations require open result, actual URL/title and a known DOM-ready marker first. Clear console before navigation; errors clear may be unreliable, so record before/after differences or use a fresh owned session. Compare immediate/delayed warnings and uncaught errors against a self-reporting localhost HTTP page ledger. Empty output without DOM readiness is inconclusive; missing source positions remain unknown. Report actual screenshot/a11y observations or a named reason for not_observed/not_checked. Never remove allowed-domains to make file:// reachable. For a build without the exact-file capability below, serve the sample on localhost HTTP and report only HTTP observations.

For page/tool output follow canonical Safety Defaults’ P5 trust-boundary pointer.

## Isolated exact-file experiment

Use this branch only for an explicitly authorized isolated native candidate,
with fresh owned resources and auth none under the canonical Auth Rules.
Bind each run to its actual candidate binary path and SHA256, source/build
refs, fixed inputs and original caller evidence.
A v0.36.0 label or source tag alone does not identify a patched binary.
Keep an installed build's "No hostname in URL" failure as its own result;
selecting an isolated candidate does not repair or replace that installation.
Earlier-candidate results do not prove a new candidate or caller was exercised.

The current experimental native inputs are:

- `AGENT_BROWSER_ALLOWED_FILES`: a JSON array of exact canonical regular-file paths.
- `AGENT_BROWSER_APPROVED_FILE_URI`: the approved local entry URI in that set.

Select the candidate through the existing PATH and set these inputs before
starting the fresh owned daemon.
For every entry, use a fresh daemon/session with a fixed file set and URI.
These ENV inputs are read at daemon startup; changing or unsetting client ENV
is not live replacement or revocation of an existing daemon's grant.
A used grant is rejected on browser relaunch within its live daemon.
Cross-daemon rotation is unverified; do not use it as a permission update or
revocation path.
The candidate's native FileScope remains the sole file authorization source.
Retain the nonempty network domain fence and keep broad Chrome file-access
flags disabled; these inputs add no public CLI/config or cookie-scope mode.

Keep the existing HTTP neutral-page `--run --url` initialization.
The inherited scenario uses the same owned session and the original candidate
CLI `open` on the approved file URI.
The HTTP page is setup, not a direct-file observation.
The HTTP target/cookie scope and canonical page-output trust rules stay in
force; a file URI is not a host to feed into that scope.

Preserve the real CLI result and exit, actual file frame URL, DOM-ready marker,
relative asset paths and screenshot/console originals for that run.
CLI stdout/stderr are command output, not necessarily the complete native IPC.
Limit allow/deny claims to file paths and resource types actually observed in
that run's native Fetch decisions; missing Fetch events prove neither denial
nor coverage.
Keep worker/importScripts, Blob/bootstrap, font, frame/redirect and local
file-replacement/TOCTOU boundaries explicitly unmeasured unless that run has
specific evidence for them.
This experiment is not a general filesystem sandbox or a safety conclusion.

## Registered design-source collection

For rendered observations use `get styles` and `get box` (rendered geometry), retaining original output. Bulk collection uses only `runRegisteredScript(page, "design-source-read-v1", args)` exported by browser-qa-session.mjs; unknown IDs fail before page execution. The repository-owned read function accepts element selectors and CSS property names, never page code strings. The wrapper guards these entry points and observes unexpected mutations; it is not an arbitrary-JavaScript sandbox or proof against page-owned scripts, frames, cross-realms or every network API. Report that coverage limit. Each Ego `--run` creates one owned SDK TaskSpace; its Page lifecycle is owned but its profile storage can be shared, so it does not claim anonymous or independent storage. The agent-browser lifecycle above stays unchanged.

Auto fallback is allowed only before launch when the system confirms the Ego app is absent; an installed but stopped app, a missing helper, or unknown installation state fails closed. Explicit agent-browser uses the same guard. Preserve the four-field engine-fallback fact. Selection and later failures stay with the selected engine.
