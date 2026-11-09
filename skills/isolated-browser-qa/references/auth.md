# Auth Policy

The default is no real user profile.

## Priority

Use a fresh isolated instance by default. For login reuse, the caller must explicitly authorize reading the source default context's complete `Storage.getCookies` response into adapter memory, and exporting only the target cookies. This API cannot filter at the server. A URI or nonempty cookie jar is not permission or proof of login.

## Rules

- Keep source Chrome running; use only browser-level `Browser.getVersion`, `Target.getTargets` and `Storage.getCookies`, compare targets before/after, disconnect source.
- Never attach/create/navigate/close/write user pages, use passwords or copy user profiles.
- Caller supplies `BROWSER_QA_AUTH_MODE=read-only-ticket-export`, exported `BROWSER_QA_TICKET_SOURCE_WS`, target URL and optional known `BROWSER_QA_TICKET_TOP_LEVEL_SITE` before the same context `--run` route. Do not print their values or use shell trace.
- Source URI must be explicit loopback ws/wss, explicit port and `/devtools/browser/<id>` without credentials/query/fragment. The runner removes source/site from engine and scenario environment. This assumes trusted same-machine processes; environment input is not secret from all local processes.
- Target URL uses http(s), exact host/path, no credentials/query/fragment. Keep domain whitelist. Host-only/domain-dot, RFC path boundary, secure, expiry and SameSite filtering occur before receiver transfer.
- Partition cookies require caller-known canonical https top-level site, matching target host/ancestor, exact nonopaque cookie site and `hasCrossSiteAncestor=false`. Missing known site omits partitions with coverage unknown; never downgrade to unpartitioned.
- Receiver is separately owned and authenticated by PID/start identity/profile. Cookie values/CDP payloads remain memory only, never logs/argv/environment/evidence. Only safe counts and scope may be reported.
- Success, failure and cancellation close receiver and remove owned temporary state. Device-bound/private-key sessions cannot be transported; localStorage/IDB login is unsupported. Check actual target authentication separately; injected count is not login proof.
- A real-site check still needs caller permission, existing login and connection-time observation of authorization prompt/debug banner. Missing input is unavailable, not passed.

## Profile Mapping

Profile mappings live at:

```text
~/.config/workflowhub/browser-qa-profiles.conf
```

Format:

```text
# pattern profile_name
localhost qa-local
*.staging.example.com qa-staging
accounts.example.com qa-company-auth
```

Only dedicated QA profiles belong in this file.

## Ego TaskSpace ownership

Every Ego `--run` creates one newly named owned TaskSpace using the current TaskHandle `task_id` plus a fresh UUID. The host adapter provides that identity; the user never supplies a Space ID. The runner reuses the new Space's initial `p1` for that run and calls `finish({keep:[]})` once in `finally`, including after a scenario error or cancellation.

The TaskSpace owns page labels, not a separate cookie/cache/storage jar. The SDK documents `finish()` as ending that TaskSpace's managed Pages; user-created and unknown-origin tabs are protected. It does not document a separate delete operation for the TaskSpace record, so report managed-page closure without claiming record deletion. It does not promise a background option. Do not launch or initialize another browser/profile, call newPage/activate, focus an existing page, enumerate unrelated tabs, or inspect their titles/URLs. If creation collides with a named Space, fail without retrying, claiming, or choosing another one. If finish or handle verification fails, record cleanup as incomplete and do not retry.

`auth none` means the adapter does not proactively read, export or inject credentials; ordinary browser requests may carry that profile's existing credentials, so it is not anonymous. Fixed collection must not read Cookie/storage. An existing login never grants additional credential-reading authority. The read-only-ticket-export mode remains specific to its proven original adapters; an unsupported Ego ticket request must fail rather than silently changing credential mode.
