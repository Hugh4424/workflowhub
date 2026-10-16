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

Canonical Standard Workflow §6 owns repair order; keep this selected engine and owned session, preserve evidence and report the actual terminal blocker.

## Report

When the selected engine stays blocked, report:

- selected engine
- failure symptom
- repair steps attempted
- why the run stopped

Healthy-but-stuck DOM, stale-map and product-regression cases follow canonical Output Contract maintenance triage; global counts remain diagnostic.
