# browser-use Workflow

Canonical Engine Router owns selection.

Use canonical `--run` with `BROWSER_QA_ENGINE=browser-use`. The private CLI reuses 0.12.6 public parser/send_command/handlers and one SDK instance; it skips native main migration/auto-start. Direct original binaries, foreign sessions, profile/CDP auto-connect and cloud are outside this owned route.

## Local Launch

```bash
bash "$SKILL_DIR/scripts/browser-qa-doctor.sh" browser-use
# Inside the --run scenario only:
browser-use --session "$BROWSER_QA_SESSION" open "$BROWSER_QA_TARGET_URL"
browser-use state
```

Requires Python with browser-use 0.12.6 and public-located Chrome. Optional BROWSER_QA_BROWSER_USE_PYTHON/BROWSER_QA_BROWSER_EXECUTABLE select existing executables; missing dependencies fail closed, without installation. Doctor checks dependencies, not browser behavior. HOME/TMPDIR stay unchanged; requests carry cwd, restored after Python threads end. Auth Rules own login/secret limits.

The owner blocks off-scope Document navigation/redirects before requests, including new tabs/iframes. Minimal native args retain popup support but omit background-network/update/sync suppression; this is not an all-network sandbox.

## Interaction

Use `state` indices:

```bash
browser-use --session "$BROWSER_QA_SESSION" click 5
browser-use --session "$BROWSER_QA_SESSION" input 3 "demo@example.com"
browser-use --session "$BROWSER_QA_SESSION" keys "Enter"
browser-use --session "$BROWSER_QA_SESSION" screenshot "$BROWSER_QA_EVIDENCE_DIR/screen.png"
```

## Repair

§6/§7 own repair/cleanup. Report browser/helper TERM fallback, exit and retained handles. CLI/JSON failures fail the owner even if ignored by shell.
