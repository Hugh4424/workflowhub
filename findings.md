# Findings

## Authority
- The current authoritative materials are the four files under `specs/workflowhub-build-prd/`: decision log, spec, plan, tasks.
- `tasks.md` marks T001, T002, T004, T005, T006 completed; T003, T007, T008, T009 pending. This is internally inconsistent because T004 depends on T003 and P1/P3 facts are historical/incomplete.
- `plan.md` still says all tasks are pending and contains stale plan hashes in task cards. Preserve historical facts; do not silently rewrite authored material.
- Build-code status is ready/in-progress but is not a task-card reader or gate.

## Scope findings
- Intended post-P1–P3 next card is T007 RED in P4, test-only boundary `tests/integration/build-prd-delivery.test.mjs`, with fullstack/fullstack-slice-testing route because scenarios cross CLI/core/filesystem/Git close seams.
- T004 actual implementation included `workflows/build-prd/steps.json`, omitted from its declared boundary.
- T006 actual implementation includes runtime review schemas/guards, wh-review runner/recorder/helper tests, beyond its declared file list. These require truthful task-fact scope correction or explicit same-task scope note before a clean handoff.
- P4 production implementation is not yet authorized as safe: planning close must not become a second close, formal-stage carrier, fifth material, or auth bypass. Await feasibility audit.

## Metadata
- Refreshed P3 hashes and bundle/catalog resolver metadata after final simple-review-runner scope binding.
- `docs/architecture/move-map.json` is valid JSON and targeted P3 registrations match current bytes/hashes.
- `skills/catalog.yaml` current hash is `3b222a8a0c4cdb831eab920338d97211dc8581be58e9a5685ee05a649942887f`; current wh-review bundle raw hash is `24e815f54933048e8696c8987eeeb88963d9c9f0e241184492d2e68723741593`; canonical resolver hash is `1044da534aeba43e291eb2362dffc9aea398929ddafdc11172d606849e2525be`.

## Test facts
- Targeted closure/provenance/P3 contract command: 35/35 passed.
- Material/helper targeted command: 85/85 passed.
- `node tools/cli/repo-skills-manifest.mjs --check`: passed.
- `git diff --check`: passed.
- Known warning: AJV ignores unknown `date` format.

## Unavailable/incomplete
- `quality/tests/P1-portable.json`, `quality/tests/P2-spec-prd.json`, `quality/tests/P3-review.json`, and P4 receipts are absent from the target worktree.
- Real provider, external host, browser/UI, and physical delivery actions have not been performed.
- `target-test-command` and `wh-review-provider` diagnostic commands are unavailable.
- Broad phase-0 governance check has unrelated stale retention/inventory failures; do not claim global governance cleanliness.

## New independent P3 audit findings (2026-09-09)
- The rehydration camel-only packet bypass was fixed in `skills/wh-review/scripts/simple-review-runner.mjs`, but tests and bundle metadata were not yet rerun after that edit.
- Independent review then found four remaining identity-boundary gaps: malformed `build-prd` sentinel can reach `review-runner` finalization; canonical simple recorder and task-bound recorder accept arbitrary/nonformal `review_kind` values and alias conflicts; shared `assertReviewIdentity` accepts arbitrary non-null kinds; `reviewRuleFor("build_prd")` remains an underscore pseudo-stage escape hatch.
- These are same-task P3 repairs, not permission to add a formal stage or persistence surface. They must be RED/GREEN tested at public helper/recorder/finalization boundaries, then bundle hashes refreshed.
- The prescribed T007 command was probed read-only and exited 1 because `tests/integration/build-prd-delivery.test.mjs` is absent; this is setup/missing-file, not target RED. Existing TaskKernel authorization context blocks safe P4 implementation under the current boundary.
- P4 remains scope-blocked by TaskKernel authorization context; no P4 test/implementation is authorized yet.
