# Selected-Engine Repair Policy

## Blocked Means

A browser tool is blocked only when one of these remains true after selected-engine repair:

- command missing or install broken
- session cannot open or close
- snapshot/state remains empty for a page that is otherwise reachable
- browser daemon or CDP connection remains unusable
- required auth mode is unsupported by the selected tool
- the tool lacks a feature required by the task

## Not Blocked

These do not justify switching engines:

- first command failed once
- stale session before cleanup
- wrong URL or stopped app service
- auth required but no safe profile has been chosen
- page bug found during QA

## Order

Before launch, auto may record engine-fallback only after the detector confirms absence. It checks Launch Services first, then scans every Foundation ApplicationDirectory domain for the visible canonical ego lite.app package and verifies its CFBundleIdentifier. A complete scan with no match is the only absence result. An indexed mdfind hit is checked as a real bundle; an empty or stale search is not absence evidence. If Launch Services fails, an application domain cannot be read, or matching bundle metadata is unreadable, retain unknown. `from` is ego-lite, `to` is agent-browser, `reason` states confirmed app absence, and `probe` retains the installation observation. An installed app with a missing helper or a stopped app is an Ego error, not absence. Unknown installation state, probe exceptions and EACCES fail closed; explicit agent-browser uses the same installation guard. Once selected, keep this engine and owned session, preserve evidence and report the actual terminal blocker.

## Report

When the selected engine stays blocked, report:

- selected engine
- failure symptom
- repair steps attempted
- why the run stopped

Healthy-but-stuck DOM, stale-map and product-regression cases follow canonical Output Contract maintenance triage; global counts remain diagnostic.
