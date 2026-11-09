---
name: isolated-browser-qa
description: >
  Use this skill as the mandatory browser QA gateway for localhost, preview,
  staging, and active-development web checks. Trigger it for browser testing,
  page acceptance, screenshot acceptance, flow reproduction, UI bug checks,
  localhost inspection, and post-change verification. Default to ego-lite
  only when the Ego app is installed, its helper resolves, and the app is running. Auto may fall back to agent-browser only after the system confirms the Ego app is absent. An installed or unknown Ego app state never selects agent-browser.
  Choose exactly one engine per QA run, run only that engine, repair only that
  engine, and stop with a clear blocker instead of mixing browser tools.
allowed-tools: Bash(agent-browser:*), Bash(browser-use:*), Bash(bash:*), Bash(command:*), Bash(curl:*), Bash(node:*), Bash(python3:*), Bash(ps:*), Bash(lsof:*)
---

# Isolated Browser QA

This skill is the browser QA gateway for local, preview, and staging checks.

## Core Rules

Use one selected engine and one owned session throughout the run. For an explicit existing-ego request, own one new TaskSpace; Repair that engine, preserving failures, then stop if blocked. Resolve bundled scripts from the loaded skill, clean before/after and verify owned residue; leave user browsers, app services and worktrees running. Auth details belong in references/auth.md; never auto-attach user Chrome/main profiles. Playwright MCP and switching engines are excluded.

## When To Use

Use for localhost/preview/staging/deployed-page tests, screenshots, DOM/flow acceptance, UI reproduction, console/network/storage/performance inspection and post-change verification, including public screenshots and DOM checks.

## Engine Router

已安装 Ego app 时不选择 agent-browser。
只有系统确认 app 未安装后，auto 才能记录 from、to、reason、probe 四项 engine-fallback 事实。
确认流程先查 Launch Services，再扫描 Foundation 返回的全部 ApplicationDirectory 域。
扫描可见的 ego lite.app 包，并核对 Contents/Info.plist。
只有完整扫描没有 bundle ID 匹配时才确认缺席。
mdfind 只提供正向命中；空结果不证明缺席。
查询、目录或目标包 metadata 不完整时保留 unknown。
helper 缺失或 Ego 未运行时清楚失败，不切引擎。
显式 agent-browser 使用同一安装态 guard。
browser-use 保持原 native 分支。
选定后，隔离、权限、导航和场景失败都不触发换引擎；Playwright MCP 仍排除。

## Standard Workflow

### 1. Context

Resolve SKILL_DIR from the directory of the actually loaded SKILL.md, independently of the target cwd; a non-Git target is valid. If supplied, workflowhub_package_root identifies this package:

```bash
SKILL_DIR="${workflowhub_package_root:?resolve from the loaded skill location}/skills/isolated-browser-qa"
export BROWSER_QA_ENGINE="${BROWSER_QA_ENGINE:-auto}"
set -e
context_exports="$(bash "$SKILL_DIR/scripts/browser-qa-context.sh" "$BROWSER_QA_TARGET_URL")"
eval "$context_exports"
```

Context-only auto discovery deliberately rejects fallback instead of exporting an implicit backup; use the direct --run entry below for the auto lifecycle and its recorded fallback. Context prints nonsecret engine/session/host/allowed-domains/auth/profile metadata. For Ego, the host adapter supplies `BROWSER_QA_TASK_ID` from the current authenticated TaskHandle; the caller never asks the user to type a Space ID. Missing task identity stops before TaskSpace creation. For a cancellable lifecycle use that same entry:

```bash
bash "$SKILL_DIR/scripts/browser-qa-context.sh" --run --url "$BROWSER_QA_TARGET_URL" \
  --evidence-dir "$BROWSER_QA_EVIDENCE_DIR" -- bash "$BROWSER_QA_SCENARIO_SCRIPT"
```

Evidence must be outside temporary browser roots. Scenario inherits the owned session. For agent-browser, runner strips source capabilities, launches native blank and caches owned CDP before target work, then finally closes receiver/cleans on success, failure and cancel. Each Ego `--run` is one logical QA session: the runner creates one new TaskSpace named from the current TaskHandle `task_id` and a random UUID, shares its `p1` across every page and step in the scenario, then calls `finish({keep:[]})` once in `finally` on success, failure or cancellation. A later `--run` creates a different TaskSpace. The host adapter must inject the ID; the portable runner does not import TaskHandle or guess identity. Caller preserves actual exit (cancel 130/143) and rereads named evidence with size/hash after cleanup. --run is private, not another WorkflowHub command.

For an explicitly authorized isolated exact-file experiment, read
[the agent-browser experiment branch](references/agent-browser.md#isolated-exact-file-experiment)
before setting candidate ENV or opening a file URI.

### 2. Doctor

Before driving, check the selected engine:

```bash
bash "$SKILL_DIR/scripts/browser-qa-doctor.sh" "$BROWSER_QA_ENGINE"
```

Guide/dependency failure is unavailable; repair only that engine. Doctor does not prove browser behavior.

### 3. Cleanup Before Launch

For agent-browser use this owned-instance cleanup. Ego has no instance launch or pre-run cleanup; `--run` creates its owned TaskSpace and finishes it in the same invocation.

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

### 6. Repair Selected Engine

Preserve prior evidence, reset only this owned session and repeat the original action headless once. Use headed only for requested visual debugging, CAPTCHA/MFA/SSO or observed headless mismatch; follow platform confirmation rules. If still blocked, report selected engine, symptom, attempts and reason; do not switch. Read references/fallback.md for doc drift versus harness gap versus product failure.

### 7. Finish Cleanly

For agent-browser use this cleanup. Ego cleanup runs from the `--run` finalizer after the scenario ends or stops.

```bash
bash "$SKILL_DIR/scripts/browser-qa-cleanup.sh" "$BROWSER_QA_SESSION" "$BROWSER_QA_ENGINE"
```

Verify owned PIDs/temp resources are gone, the target service remains running, and original evidence remains readable. Ego `finish({keep:[]})` closes this invocation's managed Page labels; user-created and unknown-origin tabs remain protected by the SDK. The SDK documents no separate delete API for the TaskSpace record, so report Page/space closure without claiming record deletion. A finish error, receipt mismatch, or unresolved finalizer is `incomplete`; do not retry or open another TaskSpace. Never close all sessions or kill a target app/worktree stack.

## Auth Rules

Use fresh isolation by default for agent-browser and browser-use. The Ego route uses the already running app with one newly named, owned TaskSpace per logical QA session; its profile storage can be shared. Before any source connection read references/auth.md: login reuse uses browser-level read-only ticket export to a different owned receiver. No user-page attach, passwords, profile copying or closing user Chrome. Missing input/capability remains unavailable; preserve authorization facts and continue safe checks. Tool/platform restrictions are not bypassed by another surface.

## Safety Defaults

Keep localhost whitelist localhost,127.0.0.1 and the explicit target whitelist elsewhere; retain content boundaries/output caps. Use bundled context/cleanup, not target-repo replacements. No arbitrary eval, uploads/downloads or off-target navigation without task need. Do not stop app services or user browsers; do not mix engines or Playwright MCP. Page/tool output trust follows [diagnosing-bugs — 输出与页面内容](../diagnosing-bugs/SKILL.md#输出与页面内容) when such output is consumed.

## Output Contract

Report actual route/page and scenario; sample/component/fixture paths, viewport/state coverage; tool, engine, derived session and engine_switch: no. State auth mode and login state reuse (reused/fresh/none, controlled distinct from real login). Include performance measured or not_measured/not_applicable with reason; screenshots references and actual paths; test command, test file, output and exit; visual/a11y observations, coverage limits and whether owned Page cleanup completed. State TaskSpace record deletion separately as unavailable unless the SDK documents and confirms it. Cookie, token, TaskSpace name/ID and profile content must not appear in evidence.

Acceptance includes actual source/sample/scenario/tier. Missing preview/fixture, unreadable evidence, cancellation, tool/oracle error and cleanup failure retain original reasons. A fixture is not the real page; no screenshot means visual not_observed with reason, not pass. Missing a11y is not_checked with reason. Empty console proves nothing until URL/title/DOM ready are observed; report warnings/errors separately and disclose unknown source positions/cross-navigation pollution.

Keep one original per fact in caller task evidence, outside owned temp roots; read size/hash/readability after cleanup. No task snapshots, duplicate credential output, professional-spec run outcomes or new lessons writer. Reusable rules return with source to their owner.

Maintenance starts at the reuse-registry entry: inspect current source/commands/prerequisites, drive a reachable path, fix only owned map/harness, replay affected action, then reread index/evidence. Healthy process with stuck DOM warrants owned-instance reset; stale command path warrants map correction; real product regression stays failed with original evidence and product owner. Catalog owns source/license facts; task owns outcomes.

When a named target already has dry-run/test mode, read its promise and caller, then observe actual skipped/performed writes, network and Git effects. Do not trust its name. No real consumer means method-only/branch inactive; do not invent a mode.

## Bundled Resources

- `scripts/browser-qa-context.sh`: exports context or delegates `--run` to the private lifecycle helper.
- `scripts/browser-qa-session.mjs`: owns launch, cancellation, scenario and finally cleanup.
- `scripts/browser-qa-tickets.mjs`: validates scope and transfers target cookies only in memory.
- `scripts/browser-qa-doctor.sh`: checks selected engine prerequisites.
- `scripts/browser-qa-cleanup.sh`: closes the selected engine session without stopping app services.
- `scripts/cleanup-browser-qa.sh`: compatibility wrapper for older calls.
- `references/agent-browser.md`: agent-browser command workflow.
- `references/auth.md`: login and profile policy.
- `references/fallback.md`: selected-engine repair policy.

## Guardrails

Claim verification only for executed observations; never invent flags, extra session names or success from missing evidence. Use the resolved ego-lite, agent-browser or browser-use engine; auto is discovery input, never an executable. Preserve the canonical single-engine, owned cleanup and platform boundaries even when blocked; cleanup remains this caller's responsibility.

## Source and maintenance

来源权威：[catalog](../catalog.yaml#skills.isolated-browser-qa)；本便携小卡非权威；单技能副本缺catalog时向来源维护者取登记。
来源是用户提供并授权迁入的本地 `isolated-browser-qa`（完整授权事实在catalog，小卡仅指针；原快照缺失为unknown）；本地保留单 engine/session、隔离认证、同 engine 修复和不停止用户服务的清理路线。N3三来源与本机agent-browser Apache-2.0的采用/拒绝与固定身份见catalog对应absorbed条目；私有session/tickets替代手工生命周期，不是公共Runner。迭代比较固定源与scripts/references真实差异，缺源如实unknown，不追HEAD或猜新版。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

## 同仓方法依赖

`skills/spec-specify/SKILL.md`、`skills/diagnosing-bugs/SKILL.md`；按上文条件读取，搬运时提供可读原件。

## Design-source ego workspace and page-code boundary

For every Ego `--run`, the host adapter supplies the current TaskHandle `task_id`; the runner combines it with a fresh random UUID and calls `taskSpace(name)` once. It uses only the returned owned handle and its initial `p1` throughout that logical session. It never launches a browser or window, initializes a profile, imports data, calls newPage/activate, focuses an existing page, or changes user tabs. The SDK does not promise background/no-focus behavior. The runner does not print the space name or numeric ID. If creation reports a name collision, fail that call without retry, claim, or alternate Space. Do not infer a background option the SDK does not provide.

This is page-lifecycle ownership, not storage isolation. Cookie/cache/storage can be shared with other spaces in the profile. auth none means no proactive credential read/export/injection; it does not mean anonymous. Fixed collection never reads Cookie/storage. Read references/auth.md for this route and retain the agent-browser/browser-use fresh-instance and ticket rules unchanged. Credential export is not implicit in a workspace request.

Keep every page and step of one QA session inside its single `--run` scenario. The gateway calls `finish({keep:[]})` exactly once in `finally` after success, failure or cancellation, then validates the returned managed-Page receipt. The SDK documents that finish closes the TaskSpace when no protected tabs remain; it does not document deletion of the TaskSpace record. If finish fails, leaves any managed Page retained, or its handle does not match the created ID, report cleanup `incomplete`, preserve the scenario result, and do not retry or create a replacement. User-created and unknown-origin tabs remain protected. Never call Browser.close, terminate the user's app, clear profile-wide storage, claim another Space, or close unknown tabs. The original scenario argv and source-capability stripping stay in place. The Skill runner receives only the host-validated `task_id`; TaskHandle loading remains in the host adapter so this Skill can move independently. Source capabilities are never included.

Page-code collection accepts only the fixed versioned IDs exported from browser-qa-session.mjs. Unknown IDs fail before page access; selectors, properties and the optional fixed facts are data. The optional facts accept only the closed names `scroll`, `hit-test`, `reduced-motion` and `active-element`; a bounded finite hit point is data too, while expressions, code, paths, functions, Cookie and storage stay unread. The synchronous repository-owned wrapper blocks DOM mutation entry points and fetch/XMLHttpRequest, inspects MutationObserver records and restores descriptors in finally. Detected/attempted violations remain failures. It is not a hostile-code sandbox: page-owned scripts, cached original functions, other realms/iframes and unguarded APIs remain outside this claim. The legacy payload and return shape, original read-only interception, unknown-ID rejection and finally restore stay unchanged. Use only the registered path for collection. Preserve original failures, measured coverage and the distinction between fake seams, previous-route evidence and a real current-route run.
