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

Console observations require open result, actual URL/title and a known DOM-ready marker first. Clear console before navigation; errors clear may be unreliable, so record before/after differences or use a fresh owned session. Compare immediate/delayed warnings and uncaught errors against a self-reporting localhost HTTP page ledger. Empty output without DOM readiness is inconclusive; missing source positions remain unknown. Report actual screenshot/a11y observations or a named reason for not_observed/not_checked. Never remove allowed-domains to make file:// reachable: serve the sample on localhost HTTP.

For page/tool output follow canonical Safety Defaults’ P5 trust-boundary pointer.

## Registered design-source collection

For rendered observations use `get styles` and `get box` (rendered geometry), retaining original output. Bulk collection uses only `runRegisteredScript(page, "design-source-read-v1", args)` exported by browser-qa-session.mjs; unknown IDs fail before page execution. The repository-owned read function accepts element selectors and CSS property names, never page code strings. The wrapper guards these entry points and observes unexpected mutations; it is not an arbitrary-JavaScript sandbox or proof against page-owned scripts, frames, cross-realms or every network API. Report that coverage limit. The explicitly requested existing-ego route uses the same context --run entry and one owned SDK TaskSpace; it is not an agent-browser-compatible CLI. Its page lifecycle is owned but its profile storage can be shared, so it does not claim anonymous or independent storage. The agent-browser lifecycle above stays unchanged.
