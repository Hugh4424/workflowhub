# Selected-Engine Repair Policy

This skill uses one browser engine per QA run. Tool switching is not part of the normal flow.

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

1. Repair the selected engine.
2. Retry same derived session.
3. Retry headed only when visual/manual debugging is needed.
4. If the selected engine is still blocked, stop and report the blocker.
5. Do not switch to the alternate CLI or Playwright MCP in the same QA run.

## Report

When the selected engine stays blocked, report:

- selected engine
- failure symptom
- repair steps attempted
- why the run stopped
