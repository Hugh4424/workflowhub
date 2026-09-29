# T025 real Codex CLI launch feasibility, 2026-09-27

## Result

**Failed before model connection. AC-17/T025 remains incomplete.** This was a temporary, synthetic `READY` response probe, not a real Task implementation or acceptance run. No authenticated CARD04 source, test, or Task store was supplied to the process. No repository code was edited.

## Isolated setup

- Host: macOS; `/usr/bin/sandbox-exec`; `codex-cli 0.157.0`; Node `/usr/local/bin/node`.
- Physical temporary root: `/private/tmp/card04-ac17-cli-6lhvvqnt`. Separate `src`, `auth`, `home`, `scratch`, `out` directories. `src` contained only a temporary README. A copy of the local Codex auth file was placed in `auth` with mode `0400`; its contents were never printed and the temporary copy was removed after this record was written.
- The profile began `(deny default)`, allowed process execution, system/CLI reads, the isolated temporary directory, limited system Mach services, writes only under `src`, `home`, `scratch`, `out`, and outbound TCP port 443. It did **not** allow reading the original repository or Codex history. This network allowance is a feasibility prototype and has **not** been shown to exclude a local service on port 443; it is not a finished isolation policy.
- Final profile SHA-256: `8691534268a1416b126a1a6014a1d31a3612b0b5229e54239883d0ca3a2d5626`. Environment names passed to the process: `PATH`, `HOME`, `CODEX_HOME`, `TMPDIR`, `TERM`, `LANG`; values for HOME/CODEX_HOME/TMPDIR pointed only inside the temporary root.

Final launch argv (the final `-` read a trivial prompt from stdin):

```text
/usr/bin/sandbox-exec -f /private/tmp/card04-ac17-cli-6lhvvqnt/profile.sb /usr/local/bin/node /Users/Hugh/.npm-global/lib/node_modules/@openai/codex/bin/codex.js --no-daemon -C /private/tmp/card04-ac17-cli-6lhvvqnt/src -s danger-full-access -a never exec --ephemeral --skip-git-repo-check --ignore-user-config -
```

The prompt was `Reply with exactly READY and no other text.` The process working directory was `src`. `danger-full-access` referred only to Codex's *inner* command sandbox; the outer macOS sandbox was installed before Codex started. The CLI symlink itself could not be executed under this profile (`execvp ... Operation not permitted`), so the final argv invoked its JS entry through the resolved Node binary.

## Observed exits

| Probe | Exit | Sanitized output |
|---|---:|---|
| Default-deny profile, before allowing root path metadata | 134 | `sandbox-exec` aborted before `/bin/echo` |
| Root path metadata allowed; Node JavaScript, before `sysctl-read` | 134 | `LowLevelAlloc arithmetic overflow` |
| Narrow `sysctl-read` allowed; CLI `--version` | 0 | `codex-cli 0.157.0` |
| Real `codex exec`, before `/etc` read | 1 | `Failed to read requirements file /etc/codex/requirements.toml: Operation not permitted` |
| Real `codex exec`, final profile | 1 | `WARNING: ... could not create PATH aliases: Operation not permitted`; `Error: failed to initialize in-process app-server client: Operation not permitted` |
| Host-existing `/Users/Hugh/.codex/history.jsonl`, sandbox `cat` | 1 | `Operation not permitted` |
| Host-existing original repository `README.md`, sandbox `cat` | 1 | `Operation not permitted` |

macOS sandbox logs during early attempts showed denied lookups of `com.apple.system.notification_center`, `com.apple.system.opendirectoryd.libinfo`, and `com.apple.logd`; only those exact system service names were later allowed. The final app-server initialization still failed. No general Mach or local IPC allowance was added. There was no model response (`stdout` empty), no real implementation, and no frozen-test result. We stopped rather than grant broad original-repository/session access or unrestricted local IPC.

## Remaining decision for implementation

Identify the exact required app-server operation and prove a narrow allowance that cannot read an external oracle through an unisolated service. Then repeat with a real authenticated Task, separate tests, two isolation modes, host-side RED/GREEN checks, and independent review. This document is evidence of a failed feasibility probe only.
