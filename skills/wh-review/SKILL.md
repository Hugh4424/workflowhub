---
name: wh-review
description: Freeze current materials, ask the configured 3rd-review broker for findings, and preserve the real review facts.
---

# wh-review

`wh-review` records quality facts. It never decides whether an Agent may keep working and never turns a provider result into a WorkflowHub progression gate.

## Main path

1. Read the current four materials and the review subject needed by this stage: relevant diff/code context, test facts, acceptance facts, or open risks.
2. Add any applicable `simplicity-guard` and `plan-ceo-review` files as read-only advisory lenses in this same packet. Do not invoke either lens as a separate skill or create a second output path.
3. Build one frozen, path-safe provider bundle. Include only bytes listed in its manifest.
4. Resolve provider/model from trusted 3rd-review configuration. Call the broker once through its public request contract and request findings only.
5. Preserve the broker's real public result and provenance, including findings and transport status, as an immutable review fact.
6. Report findings to the Stage Agent. The Stage Agent judges each finding, repairs valid findings, and records the disposition.

WorkflowHub does not start models directly and does not implement provider polling, native coordination locks, session lifecycle, fallback routing, retry loops, or a second timeout. Those belong to the 3rd-review broker.

## Commands

Run from the authenticated WorkflowHub package root:

```bash
node skills/wh-review/scripts/wh-review-cli.mjs run < input.json
node skills/wh-review/scripts/wh-review-cli.mjs verify-final < input.json
node skills/wh-review/scripts/wh-review-cli.mjs doctor
```

`doctor` is a read-only diagnostic. Its warnings do not change work readiness. A normal `run` validates only the route and material needed by that request.

Send transient input through stdin. If a host cannot pipe stdin, use an OS temporary file and delete it in the same foreground operation. Do not put transient inputs in the target repository, CandidateWorkspace, or TaskHandle.

## Input

Read `runtime/review/stage-materials.json` before building input. The common shape is:

```json
{
  "task_path": "/absolute/task-handle/path",
  "project_name": "project",
  "task_id": "task",
  "stage": "build-spec",
  "host_provider": "codex",
  "materials": {
    "approved_decision": "...",
    "draft_spec": "..."
  }
}
```

- `task_path`, project, task and stage identify where the canonical quality fact is written. They do not grant access to source paths.
- Callers cannot select provider, model, effort, thinking, credentials, broker config or fallback. Each invocation is one fresh review request; trusted configuration owns routing.
- The stage matrix is a strict material allowlist. Current `decision-log.md`, `spec.md`, `plan.md`, `tasks.md` are the authoritative design inputs.
- `context_map` and `evidence_map` are optional packet optimizations. When supplied they must be well formed and path safe; when absent, the runner derives the minimum useful context from the supplied current materials. Their absence must not stop a provider call or same-task work.
- `review_instructions`, packet metadata and hashes are runner-generated. Caller-supplied generated fields fail before provider dispatch.

There is no `scope_revision` review kind or state machine. A user-requested direction change updates the same four materials through the normal responsible stage, then the affected current stage reviews the new material through its ordinary review track.

The two ordinary lenses are packet-local advisory material. They do not write `*-facts`, invocation
receipts, dispatch records, stage results, or independent runtime state. Their absence is a review
fact, not a prerequisite for continuing the same task.

## Material and path safety

- The provider receives only the frozen bundle and cannot read the repository, host paths, Git, shell or network.
- Every visible byte is listed with a hash in `manifest.json`; `material_id` binds the bundle and `snapshot_tree` binds source context when code is reviewed.
- Reject symlinks, hard links, traversal, escaped realpaths, undeclared attachments, tampered hashes and host-path leakage before dispatch.
- Large diffs may use the existing hash-addressed index/shard representation. Missing shards or incomplete change coverage fail before dispatch.
- Security failure rejects that review write. It does not stop the Agent from fixing materials or code in the same task.

## Broker result

3rd-review returns its public managed result. WorkflowHub preserves:

- requested and actual profile/provider/model;
- runtime/session IDs that the broker publicly exposes;
- duration and usage when provided, otherwise `not provided`;
- raw public diagnostics, findings and provenance;
- an immutable `unavailable` result for authentication, timeout, transport, malformed output or protocol failure.

An `unavailable` result is never `pass`.

Transport success is not a clean review. Empty findings are quality advice, not stage completion.
`unavailable` remains an unavailable fact and is never rewritten as empty findings or `pass`.
It may leave the quality claim incomplete, but it does not block same-task work.

WorkflowHub does not inspect broker-private files or infer liveness. It awaits the broker's public request and records the terminal public outcome. If the broker call itself cannot return a trustworthy terminal result, record the exact failure as `unavailable`; do not select another provider or create a local lifecycle controller.

## Findings and repeat reviews

- Keep every original finding and source attribution.
- The Stage Agent records one disposition per finding: fixed, rejected with reason, accepted risk with authority, or needs human decision.
- Review only a changed material/snapshot or a specifically repaired risk. Never rerun an unchanged review merely to obtain an empty findings list.
- Same-adapter profiles are not multiple independent sources. Aggregation keeps actual adapter independence and concrete anchors visible.
- A valid direct or machine anchor may support a major finding. Inferred evidence from one source remains uncorroborated rather than becoming blocking truth.

## Stage subjects

- `make-decision`: direction and detail of the current decision.
- `build-spec`: current decision and draft specification.
- `build-plan`: current decision/specification and draft plan/tasks.
- `build-code`: current diff, risk-relevant tests and acceptance trace.
- `verify-code`: current acceptance summary, final test facts, open risks and implementation assessment.

Phase build-code review 的 subject 由宿主从 `phase_id` 和 Git 工作树推导。调用方只提供
`phase_id`，不得从 `tasks.md` 传入 `execution_file_paths`、`phasePaths` 或其他路径选择器。
宿主记录已提交 Phase 的直接父提交与候选提交树；未提交 Phase 记录真实的
`commit_oid=null`，不伪造 commit。提交树与候选树不一致时，审查事实为
`unavailable`/`incomplete`，旧结果不得冒充当前结果。这些字段只保证审查对象可追溯，
不把 phase review、receipt 或 provider 结果变成任务推进许可证。

Review contracts under `contracts/<stage>.md` describe the question for each subject. They may request useful maps, but cannot make optional maps a provider-call or work-readiness gate.

## Completion boundary

CLI success returns a task-relative review fact reference and the bound source identity when applicable. Consumers open that fact and do not trust copied finding text.

`verify-final` checks that a referenced final code review still matches the current implementation. A mismatch or missing review is a truthful completion gap; it does not prevent same-task repair. Commit, push and merge remain separately authorized operations.
