# agent-browser Workflow

Use `agent-browser` as the default engine for local Coding Agent QA.

Before commands, load the live command guide:

```bash
agent-browser skills get agent-browser
```

## Launch

```bash
agent-browser \
  --session "$BROWSER_QA_SESSION" \
  --allowed-domains "$BROWSER_QA_ALLOWED_DOMAINS" \
  --content-boundaries \
  --max-output 20000 \
  open "<url>"
```

Then inspect:

```bash
agent-browser --session "$BROWSER_QA_SESSION" snapshot -i -c
```

Use `@ref` values from the snapshot for actions:

```bash
agent-browser --session "$BROWSER_QA_SESSION" click @e12
agent-browser --session "$BROWSER_QA_SESSION" fill @e8 "demo@example.com"
agent-browser --session "$BROWSER_QA_SESSION" press Enter
```

## Useful QA Commands

```bash
agent-browser --session "$BROWSER_QA_SESSION" screenshot /tmp/codex-qa.png
agent-browser --session "$BROWSER_QA_SESSION" console
agent-browser --session "$BROWSER_QA_SESSION" errors
agent-browser --session "$BROWSER_QA_SESSION" network requests
agent-browser --session "$BROWSER_QA_SESSION" storage local
agent-browser --session "$BROWSER_QA_SESSION" cookies get
```

## Repair

If the session is stale or broken:

```bash
agent-browser --session "$BROWSER_QA_SESSION" close || true
agent-browser --session "$BROWSER_QA_SESSION" open "<url>"
agent-browser --session "$BROWSER_QA_SESSION" snapshot -i -c
```

Retry with `--headed` only when the user needs to watch the browser, headless differs, or manual auth/CAPTCHA/MFA is involved.

If it still fails, report the blocker and stop this QA run. Do not switch to `browser-use` or Playwright MCP in the same run.

## Safety

Use `--allowed-domains`, `--content-boundaries`, and `--max-output` by default.

Do not run `eval`, upload files, download files, or leave the target domain unless the task requires it.
