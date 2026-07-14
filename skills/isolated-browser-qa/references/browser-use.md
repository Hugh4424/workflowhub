# browser-use Workflow

Use `browser-use` only when the task needs browser-use-specific capability:

- Chrome profile reuse
- Browser Use Cloud
- Python Agent / LLM-driven browser tasks
- browser-use templates, tasks, or APIs

Do not use `browser-use` as an automatic fallback after `agent-browser` was selected for the same QA run.

## Local Launch

```bash
command -v browser-use
browser-use doctor
browser-use --session "$BROWSER_QA_SESSION" open "<url>"
browser-use --session "$BROWSER_QA_SESSION" state
```

If a mapped QA profile exists:

```bash
browser-use --session "$BROWSER_QA_SESSION" --profile "$BROWSER_QA_PROFILE" open "<url>"
```

Do not choose `Default` or the user's main profile unless the user explicitly asks for it.

## Interaction

Use indices from `state`:

```bash
browser-use --session "$BROWSER_QA_SESSION" click 5
browser-use --session "$BROWSER_QA_SESSION" input 3 "demo@example.com"
browser-use --session "$BROWSER_QA_SESSION" keys "Enter"
browser-use --session "$BROWSER_QA_SESSION" screenshot /tmp/codex-qa.png
```

## Repair

```bash
browser-use doctor
browser-use sessions || true
browser-use --session "$BROWSER_QA_SESSION" close >/dev/null 2>&1 || true
browser-use --session "$BROWSER_QA_SESSION" open "<url>"
browser-use --session "$BROWSER_QA_SESSION" state
```

If it still fails, report the blocker and stop this QA run. Do not switch to `agent-browser` or Playwright MCP in the same run.
