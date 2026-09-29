# T025 app-server initialization diagnosis, 2026-09-27

## Result

The isolated real Codex CLI still exited before a model connection. This is a temporary `READY` feasibility probe, **not** a real Task implementation or AC-17 acceptance. No repository source or test was changed. The exact operation responsible for the final `Operation not permitted` has **not** been isolated, so there is no safe final allowance to add yet.

## Bounded reproduction

- Host: macOS, `/usr/bin/sandbox-exec`, `/usr/local/bin/node`, `codex-cli 0.157.0`.
- Temporary physical root: `/private/tmp/card04-ac17-diag-ynhlqlqp`, with separate `src`, `auth`, `home`, `scratch`, `out`. `src` contained a one-line temporary README. A mode `0400` copy of `auth.json` was used under `auth`; its contents and environment values were not printed. This temporary root was removed after diagnosis.
- Final temporary profile SHA-256: `2caa663e7067d732f5aa579fd9f8d521bd46f441f974432ea85060b57610992c`. It used `(deny default)`, explicit system/CLI/temp reads, writes confined to `src`, `home`, `scratch`, `out`, outbound TCP 443, and named system services. No original repository, original Codex history, or general local IPC read allowance was added. The network rule remains a feasibility prototype; it has not been shown to exclude a localhost service on port 443.
- Environment names were `PATH`, `HOME`, `CODEX_HOME`, `TMPDIR`, `TERM`, `LANG`; the latter three path variables pointed inside the temporary root. Command form matched the earlier CLI probe: `sandbox-exec -f profile.sb /usr/local/bin/node .../codex.js --no-daemon -C src -s danger-full-access -a never exec --ephemeral --skip-git-repo-check --ignore-user-config -`. Prompt: `Reply with exactly READY and no other text.` Each model attempt had a 35-second timeout and exited in under 0.1 seconds.

## Exact observations

1. A default-deny profile with only `file-read-metadata` on `/` caused `sandbox-exec` itself to abort (exit 134), even for `/bin/echo`. Adding `file-read*` for the **literal root path** `/` made `/bin/echo` work. This does not grant reading paths below `/`.
2. Node then reported `EPERM: lstat '/Users'`. Adding metadata-capable `file-read*` for the literal parent paths `/Users` and `/Users/Hugh` let the CLI start. With `/etc` omitted, it reported denial reading `/etc/codex/requirements.toml`. Adding `/etc`/`/private/etc` reads restored the earlier app-server failure.
3. At 08:26:48 local time, macOS `launchd` logged a denied lookup of the exact Mach service `com.apple.SystemConfiguration.configd` for the sandboxed `codex` process. At 08:26:53, a kernel sandbox report named `ipc-posix-shm-read-data apple.shm.notification_center` for that process. These are observed denials, **not established as the final cause**.
4. Adding only `com.apple.SystemConfiguration.configd` to the existing named Mach allowlist did not change the result: exit 1, empty stdout, stderr `Error: failed to initialize in-process app-server client: Operation not permitted (os error 1)`. Adding `ipc-posix-shm` for only the named `apple.shm.notification_center` did not change it either. A first attempt using a `literal` filter for the shared-memory name was also ineffective; the macOS profile examples use `ipc-posix-name`.
5. The current profile denied reading both the original `/Users/Hugh/.codex/history.jsonl` and original repository `README.md` (`cat` exit 1 each). Thus this probe did not obtain an external test or history through those paths.

The PATH-alias warning (`Operation not permitted`) persisted and did not prevent `--version`; its relationship to app-server startup is unproven. The unified log exposed no further named denial for these later 0.05-second attempts. The final error could also arise from an unreported operation. No broad `mach-lookup`, shared-memory, local-socket, or original-home allowance was used to make the model run.

## Next diagnostic boundary

Use a host tracing facility that can identify the exact denied operation, or a trusted launcher with a documented narrow service contract. Verify the specific operation and a localhost-helper negative control before calling any allowance safe. A real authenticated Task, separate test oracle, two modes, and host-side RED/GREEN checks are still absent. **Model connection: not established. T025 / AC-17: incomplete.**
