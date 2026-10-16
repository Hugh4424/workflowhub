# browser-use Workflow

Select only when browser-use-specific isolated capability is required; canonical Engine Router is authoritative.

The installed native CLI requires `open URL`; `get` supports title/html/text/value/attributes/bbox, not cdp-url, and uses BROWSER_USE_HOME (default ~/.browser-use) for its own PID/socket rather than AGENT_BROWSER_SOCKET_DIR. Therefore context --run reports BROWSER_USE_RUN_UNAVAILABLE before launch for this engine. Use the manual isolated local route below with explicit finally cleanup; it has no verified cancellable-ticket lifecycle. Do not switch engines or treat this capability limit as broken ownership/auth.

## Local Launch

```bash
command -v browser-use
browser-use doctor
browser-use --session "$BROWSER_QA_SESSION" open "<url>"
browser-use --session "$BROWSER_QA_SESSION" state
```

For isolation and login restrictions follow canonical Auth Rules and references/auth.md; keep the selected engine/session and target whitelist.

## Interaction

Use indices from `state`:

```bash
browser-use --session "$BROWSER_QA_SESSION" click 5
browser-use --session "$BROWSER_QA_SESSION" input 3 "demo@example.com"
browser-use --session "$BROWSER_QA_SESSION" keys "Enter"
browser-use --session "$BROWSER_QA_SESSION" screenshot /tmp/codex-qa.png
```

## Repair

Use canonical Standard Workflow §6 and the same browser-use session. Recheck browser-use doctor after a failed drive; reset only owned isolated resources. Persistent failure remains blocked; report unsupported ticket capabilities rather than switching to agent-browser or Playwright MCP.
