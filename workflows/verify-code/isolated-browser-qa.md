# Isolated Browser QA

This skill is the browser QA gateway for local, preview, and staging checks.

It is a router, not a wrapper around one browser tool.

## Core Rules

1. Use exactly one engine for the whole QA run.
2. Default to `agent-browser` for local Coding Agent QA.
3. Use `browser-use` only when the user explicitly needs Chrome profile reuse, Browser Use Cloud, Python-agent workflows, or browser-use-specific tasks.
4. Derive one project session and reuse it for the whole QA run.
5. Repair the selected engine only. Do not switch engines during the same run.
6. Resolve bundled scripts from this workflow directory, not from the current repo.
7. Run bundled cleanup before and after QA.
8. Cleanup must never stop the user's app service, dev server, worktree, or local stack.
9. Stay headless by default.
10. Do not auto-attach to the user's live Chrome or main profile.
11. Treat browser automation as memory-expensive: keep one derived session per task and verify residual browser processes after cleanup.
12. Do not use Playwright MCP from this skill. If the selected CLI engine is blocked, stop and report the blocker.

## When To Use

Use this skill for:

- localhost checks
- preview or staging QA
- browser acceptance after implementation
- screenshot acceptance with interaction
- multi-step flow verification
- UI bug reproduction
- console, network, storage, and basic performance inspection
- checking a deployed page that still needs interaction

Do not lead with this skill for:

- one public page screenshot with no interaction
- one quick public DOM check with no meaningful interaction

## Engine Router

Pick one engine before any browser action. The selected engine is exclusive.

Use `agent-browser` for:

- local web app smoke tests
- UI bug reproduction
- form clicking and filling
- screenshot acceptance
- console, network, HAR, cookies, localStorage, or sessionStorage inspection
- auth vault flows
- test-oriented workflows using `snapshot -i` and `@ref` selectors
- default localhost and preview QA

Use `browser-use` for:

- user-requested Chrome profile reuse
- Browser Use Cloud
- Python Agent / LLM-driven browser tasks
- browser-use-specific templates, tasks, or APIs

Do not use `browser-use` as an automatic fallback from `agent-browser`.

Do not use Playwright MCP as a fallback from either CLI. Playwright MCP is outside this skill's normal route.

## Standard Workflow

### 1. Context

The source skill provides a bundled context script. When browser QA scripts become available, the caller sets:

```bash
VERIFY_CODE_DIR="${VERIFY_CODE_DIR:-.}"
export BROWSER_QA_ENGINE="${BROWSER_QA_ENGINE:-agent-browser}"
```

The script exports:

- `BROWSER_QA_ENGINE`
- `BROWSER_QA_SESSION`
- `BROWSER_QA_HOST`
- `BROWSER_QA_ALLOWED_DOMAINS`
- `BROWSER_QA_AUTH_MODE`
- `BROWSER_QA_PROFILE`
- `BROWSER_QA_PROFILE_SOURCE`

### 2. Doctor

The source skill provides a doctor check. When available, run before browser actions:


If the selected engine is missing or broken, repair that engine only. Do not check or launch the other engine as fallback.

### 3. Cleanup Before Launch (Planned)


This cleanup is only for browser automation resources. It must not stop the target app.
It closes only the selected engine. For `agent-browser`, cleanup uses the saved session metadata, kills every daemon bound to the session socket, removes stale runtime files, then removes stale browser temp directories and Playwright MCP residuals. If cleanup still reports session residuals or exits non-zero, stop and resolve that state before launching a new browser session.

### 4. Launch With `agent-browser`

Use this section only when `BROWSER_QA_ENGINE=agent-browser`.

Read the live command guide before using `agent-browser`:

```bash
agent-browser skills get agent-browser
```

Default launch:

```bash
agent-browser \
  --session "$BROWSER_QA_SESSION" \
  --allowed-domains "$BROWSER_QA_ALLOWED_DOMAINS" \
  --content-boundaries \
  --max-output 20000 \
  open "<url>"

agent-browser \
  --session "$BROWSER_QA_SESSION" \
  snapshot -i -c
```

Use `@ref` selectors from `snapshot` for actions:

```bash
agent-browser --session "$BROWSER_QA_SESSION" click @e12
agent-browser --session "$BROWSER_QA_SESSION" fill @e8 "demo@example.com"
agent-browser --session "$BROWSER_QA_SESSION" screenshot /tmp/codex-qa.png
```

For details, read `references/agent-browser.md`.

### 5. Launch With `browser-use`

Use this section only when `BROWSER_QA_ENGINE=browser-use`. Do not run it after `agent-browser` has already been selected for the same QA run.

```bash
command -v browser-use
browser-use doctor
browser-use --session "$BROWSER_QA_SESSION" open "<url>"
browser-use --session "$BROWSER_QA_SESSION" state
```

If a QA profile is mapped:

```bash
browser-use --session "$BROWSER_QA_SESSION" --profile "$BROWSER_QA_PROFILE" open "<url>"
```

For details, read `references/browser-use.md`.

### 6. Repair Selected Engine

If the selected tool fails:

1. Keep the same derived session.
2. Close and reopen that tool's session.
3. Retry headless once.
4. Retry headed only if visual debugging, CAPTCHA, MFA, SSO, or headless mismatch requires it.
5. If the selected engine remains blocked, stop and report the blocker.
6. Do not switch to the alternate CLI or Playwright MCP in the same QA run.

For repair rules, read `references/fallback.md`.

### 7. Finish Cleanly

Always finish with:


The task is not done until cleanup has run and the target app service is still left running.
Do not use broad `agent-browser close --all` during normal QA cleanup. Use the derived session cleanup script, which applies command timeouts, PID-file fallback, and stale temporary directory cleanup.

## Auth Rules

1. Prefer `agent-browser` auth vault when credentials are already saved.
2. Prefer a dedicated QA state or mapped QA profile.
3. Use a real Chrome profile only when the user explicitly asks for it.
4. Do not silently choose `Default`, the user's main profile, or a random profile.
5. Never put plaintext passwords in chat, shell history, screenshots, or logs.
6. If auth is required and no safe auth path exists, stop and ask.

For details, read `references/auth.md`.

## Safety Defaults

- For localhost QA, restrict allowed domains to `localhost` and `127.0.0.1`.
- Use content boundaries when supported.
- Cap page output when supported.
- Do not upload, download, run arbitrary `eval`, or leave the target domain unless required by the task.
- Do not attach to live Chrome unless the user explicitly asks.
- Do not use repo-local cleanup or context scripts. Bundled scripts are planned for future implementation.
- Do not run `make stop-worktree`, `make stop`, `scripts/stop-services.sh`, or similar shutdown commands as part of browser QA cleanup.
- Do not run `agent-browser`, `browser-use`, and Playwright MCP in the same QA run.

## Output Contract

Report only:

- what was tested
- tool used
- selected engine
- derived session
- whether login state was reused
- whether an engine switch happened; this should be `no`
- evidence collected
- pass/fail result
- cleanup completion
- whether the app service was left running

If the selected engine stayed blocked, report:

- selected engine
- failure symptom
- repair steps attempted
- why the run stopped

## Planned Resources (not yet implemented — documented from source skill)

- `scripts/browser-qa-context.sh` (documented for future implementation): derives session, engine, host, allowed domains, auth/profile metadata.
- `scripts/browser-qa-doctor.sh` (documented for future implementation): checks selected browser CLI availability.
- `scripts/browser-qa-cleanup.sh` (documented for future implementation): closes the selected engine session without stopping app services.
- `scripts/cleanup-browser-qa.sh` (documented for future implementation): compatibility wrapper for older calls.
- `references/agent-browser.md`: agent-browser command workflow.
- `references/browser-use.md`: browser-use-specific workflow.
- `references/auth.md`: login and profile policy.
- `references/fallback.md`: selected-engine repair policy.

## Guardrails

- Do not claim browser verification without running it.
- Do not treat unresolved tool breakage as permission to switch tools.
- Do not invent extra session names when the derived project session works.
- Do not leave cleanup to the user.
- Do not document unsupported CLI flags as if they exist.
- Do not use `auto` as an engine value.
- Do not call Playwright MCP from this skill.
