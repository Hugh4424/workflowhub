# Auth Policy

The default is no real user profile.

## Priority

1. `agent-browser` auth vault, if the needed credential profile already exists.
2. Dedicated QA state or profile mapped for the target host.
3. `browser-use` profile only when the task explicitly needs browser-use profile reuse.
4. User-approved live Chrome or main profile only when the user explicitly asks.

## Rules

- Do not auto-attach to live Chrome.
- Do not auto-pick `Default`.
- Do not use the user's main profile unless explicitly approved.
- Do not put plaintext credentials in chat, shell history, screenshots, or logs.
- If auth is required and no safe auth path exists, stop and ask.

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
