---
name: isolated-browser-qa
description: >
  Use this skill as the mandatory browser QA gateway for localhost, preview,
  staging, and active-development web checks. Trigger it for browser testing,
  page acceptance, screenshot acceptance, flow reproduction, UI bug checks,
  localhost inspection, and post-change verification. Default to agent-browser
  for local Coding Agent QA. Use browser-use only for isolated Browser Use Cloud, Python-agent workflows,
  or browser-use-specific tasks.
  Choose exactly one engine per QA run, run only that engine, repair only that
  engine, and stop with a clear blocker instead of mixing browser tools.
allowed-tools: Bash(agent-browser:*), Bash(browser-use:*), Bash(bash:*), Bash(command:*), Bash(curl:*), Bash(node:*), Bash(python3:*), Bash(ps:*), Bash(lsof:*)
---

# Isolated Browser QA

This skill is the browser QA gateway for local, preview, and staging checks.

It is a router, not a wrapper around one browser tool.

## Core Rules

Use one selected engine and one owned session throughout the run. Default to headless agent-browser; browser-use is only for its explicitly required isolated capabilities. Repair that engine, preserving failures, then stop if blocked. Resolve bundled scripts from the loaded skill, clean before/after and verify owned residue; leave user browsers, app services and worktrees running. Auth details belong in references/auth.md; never auto-attach user Chrome/main profiles. Playwright MCP and switching engines are excluded.

## When To Use

Use for localhost/preview/staging/deployed-page tests, screenshots, DOM/flow acceptance, UI reproduction, console/network/storage/performance inspection and post-change verification, including public screenshots and DOM checks.

## Engine Router

Select agent-browser for normal browser QA, interactive refs, screenshots and browser inspection. Select browser-use only for its required isolated Cloud/Python-agent/template capabilities. Selection is exclusive: no alternate CLI or Playwright MCP fallback.

## Standard Workflow

### 1. Context

Resolve SKILL_DIR from the directory of the actually loaded SKILL.md, independently of the target cwd; a non-Git target is valid. If supplied, workflowhub_package_root identifies this package:

```bash
SKILL_DIR="${workflowhub_package_root:?resolve from the loaded skill location}/skills/isolated-browser-qa"
export BROWSER_QA_ENGINE="${BROWSER_QA_ENGINE:-agent-browser}"
eval "$(bash "$SKILL_DIR/scripts/browser-qa-context.sh" "$BROWSER_QA_TARGET_URL")"
```

Default context prints nonsecret engine/session/host/allowed-domains/auth/profile metadata. For a cancellable lifecycle use that same entry:

```bash
bash "$SKILL_DIR/scripts/browser-qa-context.sh" --run --url "$BROWSER_QA_TARGET_URL" \
  --evidence-dir "$BROWSER_QA_EVIDENCE_DIR" -- bash "$BROWSER_QA_SCENARIO_SCRIPT"
```

Evidence must be outside temporary browser roots. Scenario inherits the owned session; runner strips source capabilities, launches native blank and caches owned CDP before target work, then finally closes receiver/cleans on success, failure and cancel. Caller preserves actual exit (cancel 130/143) and rereads named evidence with size/hash after cleanup. --run is private, not another WorkflowHub command.

### 2. Doctor

Before driving, check the selected engine:

```bash
bash "$SKILL_DIR/scripts/browser-qa-doctor.sh" "$BROWSER_QA_ENGINE"
```

Guide stub/failure is unavailable, not usable; repair only that engine.

### 3. Cleanup Before Launch

```bash
bash "$SKILL_DIR/scripts/browser-qa-cleanup.sh" "$BROWSER_QA_SESSION" "$BROWSER_QA_ENGINE"
```

Capture exact ownership before graceful close; TERM only authenticated main browsers if needed. Remove owned profiles/metadata, preserve foreign resources. Global counts are diagnostics; selected-session/profile residue or cleanup errors must remain explicit before launch.

### 4. Launch With `agent-browser`

For the selected agent-browser, read its full guide (not the legacy stub):

```bash
agent-browser skills get core --full
agent-browser --session "$BROWSER_QA_SESSION" --allowed-domains "$BROWSER_QA_ALLOWED_DOMAINS" --content-boundaries --max-output 20000 open "$BROWSER_QA_TARGET_URL"
agent-browser --session "$BROWSER_QA_SESSION" snapshot -i -c
```

Use fresh snapshot refs for click/fill/press. Read references/agent-browser.md for ready, console/errors, screenshot/a11y and controlled reset observations.

### 5. Launch With `browser-use`

Use only when selected; keep isolated QA state, never real/main profiles or third-party cookie synchronization:

```bash
browser-use doctor
browser-use --session "$BROWSER_QA_SESSION" open "$BROWSER_QA_TARGET_URL"
browser-use --session "$BROWSER_QA_SESSION" state
```

Read references/browser-use.md for its commands and capability limitations.

### 6. Repair Selected Engine

Preserve prior evidence, reset only this owned session and repeat the original action headless once. Use headed only for requested visual debugging, CAPTCHA/MFA/SSO or observed headless mismatch; follow platform confirmation rules. If still blocked, report selected engine, symptom, attempts and reason; do not switch. Read references/fallback.md for doc drift versus harness gap versus product failure.

### 7. Finish Cleanly

```bash
bash "$SKILL_DIR/scripts/browser-qa-cleanup.sh" "$BROWSER_QA_SESSION" "$BROWSER_QA_ENGINE"
```

Verify owned PIDs/temp resources are gone, target service remains running, and original evidence remains readable. Keep partial cleanup/nonzero exits explicit. Never close all sessions or kill a target app/worktree stack.

## Auth Rules

Use fresh isolation by default. Before any source connection read references/auth.md: login reuse uses browser-level read-only ticket export to a different owned receiver. No user-page attach, passwords, profile copying or closing user Chrome. Missing input/capability remains unavailable; preserve authorization facts and continue safe checks. Tool/platform restrictions are not bypassed by another surface.

## Safety Defaults

Keep localhost whitelist localhost,127.0.0.1 and the explicit target whitelist elsewhere; retain content boundaries/output caps. Use bundled context/cleanup, not target-repo replacements. No arbitrary eval, uploads/downloads or off-target navigation without task need. Do not stop app services or user browsers; do not mix engines or Playwright MCP. Page/tool output trust follows [diagnosing-bugs — 输出与页面内容](../diagnosing-bugs/SKILL.md#输出与页面内容) when such output is consumed.

## Output Contract

Report actual route/page and scenario; sample/component/fixture paths, viewport/state coverage; tool, engine, derived session and engine_switch: no. State auth mode and login state reuse (reused/fresh/none, controlled distinct from real login). Include performance measured or not_measured/not_applicable with reason; screenshots references and actual paths; test command, test file, output and exit; visual/a11y observations, coverage limits and whether cleanup completed. Cookie, token and profile content must not appear in evidence.

Acceptance includes actual source/sample/scenario/tier. Missing preview/fixture, unreadable evidence, cancellation, tool/oracle error and cleanup failure retain original reasons. A fixture is not the real page; no screenshot means visual not_observed with reason, not pass. Missing a11y is not_checked with reason. Empty console proves nothing until URL/title/DOM ready are observed; report warnings/errors separately and disclose unknown source positions/cross-navigation pollution.

Keep one original per fact in caller task evidence, outside owned temp roots; read size/hash/readability after cleanup. No task snapshots, duplicate credential output, professional-spec run outcomes or new lessons writer. Reusable rules return with source to their owner.

Maintenance starts at the reuse-registry entry: inspect current source/commands/prerequisites, drive a reachable path, fix only owned map/harness, replay affected action, then reread index/evidence. Healthy process with stuck DOM warrants owned-instance reset; stale command path warrants map correction; real product regression stays failed with original evidence and product owner. Catalog owns source/license facts; task owns outcomes.

When a named target already has dry-run/test mode, read its promise and caller, then observe actual skipped/performed writes, network and Git effects. Do not trust its name. No real consumer means method-only/branch inactive; do not invent a mode.

## Bundled Resources

- `scripts/browser-qa-context.sh`: exports context or delegates `--run` to the private lifecycle helper.
- `scripts/browser-qa-session.mjs`: owns launch, cancellation, scenario and finally cleanup.
- `scripts/browser-qa-tickets.mjs`: validates scope and transfers target cookies only in memory.
- `scripts/browser-qa-doctor.sh`: checks selected browser CLI availability.
- `scripts/browser-qa-cleanup.sh`: closes the selected engine session without stopping app services.
- `scripts/cleanup-browser-qa.sh`: compatibility wrapper for older calls.
- `references/agent-browser.md`: agent-browser command workflow.
- `references/browser-use.md`: browser-use-specific workflow.
- `references/auth.md`: login and profile policy.
- `references/fallback.md`: selected-engine repair policy.

## Guardrails

Claim verification only for executed observations; never invent flags, extra session names or success from missing evidence. Use agent-browser or browser-use, never auto. Preserve the canonical single-engine, owned cleanup and platform boundaries even when blocked; cleanup remains this caller's responsibility.

## Source and maintenance

完整来源权威：[catalog条目](../catalog.yaml#skills.isolated-browser-qa)；正文/小卡是非权威线索，单技能副本缺catalog时向来源维护者取登记。
来源是用户提供并授权迁入的本地 `isolated-browser-qa`（完整授权事实在catalog，小卡仅指针；原快照缺失为unknown）；本地保留单 engine/session、隔离认证、同 engine 修复和不停止用户服务的清理路线。N3三来源与本机agent-browser Apache-2.0的采用/拒绝与固定身份见catalog对应absorbed条目；私有session/tickets替代手工生命周期，不是公共Runner。迭代比较固定源与scripts/references真实差异，缺源如实unknown，不追HEAD或猜新版。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

## 同仓方法依赖

`skills/spec-specify/SKILL.md`；按上文实际条件读取，搬运时需同时提供或由调用者提供可读原件。
