# Build-code P3 Phase Card — T005 RED

- **task / phase**: T005 / Phase P3 — 派发前预检、等待止损与源漂移分类
- **goal**: 在不改生产代码、也不改当前四个 RED 测试文件的前提下，建立可证伪的 `PREFLIGHT-DRIFT` RED；记录派发前预检、运行期空输出边界、等待止损和源漂移重试事实。
- **authenticated WorkflowHub worktree**: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-cost-baseline-and-blocker-close-20260917`
- **branch / HEAD at authentication**: `task/workflowhub/workflowhub-cost-baseline-and-blocker-close-20260917` / `160778878912124c292f1beb0e5008299c396743`
- **current four-material identity**: `material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`; runtime rule excludes only the `tasks.md` execution-status block.
- **current material SHA-256**: `decision-log.md=22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3`; `spec.md=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`; `plan.md=8b91fd02b8a07ece0daf723b64dc213e9e64b47743e6f493589dfdb214ed01d4`; `tasks.md=ed3f01eedf3204afcd8ffeb86abc8d3e434dfb181bbff3e9b7587badecc2effe`.
- **material anchors read**: `tasks.md:295-363` (P3/T005); `plan.md:660-711` (P3); `spec.md:384-400` (AC-PREFLIGHT-001/002/003) and `spec.md:462-466` (AC-CLEANUP-005).

## Exact test files and symbols

The four current RED files are read-only evidence inputs for this runner. No test-file byte is edited here.

1. `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs:203` — `it("rejects a host provider outside the supported 3rd-review provider registry")` (`AC-PREFLIGHT-001`).
2. `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs:1001-1425` — `describe("review flow static preflight")`, including:
   - `it("blocks an unsupported host_provider before bundle, lock, or dispatch")` at `:1193` (`AC-PREFLIGHT-001`);
   - `it.each(...)("blocks a provider with an invalid %s before bundle, lock, or dispatch")` at `:1254` for `MODEL_ID_INVALID`, `CLI_UNAVAILABLE`, `AUTH_INVALID`, and `ACTIVE_PROBE_FAILED` (`AC-PREFLIGHT-002`);
   - `it("skips one preflight-blocked provider while dispatching the remaining provider")` at `:1315` (`AC-PREFLIGHT-002`);
   - `it("keeps a runtime agy timeout as a dispatched provider failure, not a static preflight capture")` at `:1388` (`AC-PREFLIGHT-003`).
3. `tests/contract/review-material-change-redispatch.test.mjs:238` — `it("retains a dispatched source/material drift failure and admits a material_changed retry")` (`AC-CLEANUP-005`).
4. `tests/review/review-record-route.test.mjs` — `it("does not reuse a zero-member REVIEW_WAIT_EXCEEDED fact and admits judged retry")` at `:1347` and `describe("T005 managed source/material drift")` / `it("stops polling on material identity drift, records the failed attempt, and detaches without cancelling")` at `:1439-1492` (`AC-CLEANUP-005`).

The local helper seam `trustedDependencies` / `providerPreflight` in `simple-review-runner.test.mjs:71-92` is part of the test fixture boundary only; it is not a production change.

## Covered acceptance criteria

- **AC-PREFLIGHT-001** (`FR-PREFLIGHT-001`): an illegal `host_provider` is rejected before `buildBundle`, lock, or dispatch, with `dispatch_state=blocked_before_dispatch` and `provider_attempts=0`.
- **AC-PREFLIGHT-002** (`FR-PREFLIGHT-002`): model id, CLI executability, authentication, and active probe retain their structured error codes; all-provider failure blocks before dispatch, while one blocked provider is skipped and a healthy sibling is dispatched.
- **AC-PREFLIGHT-003** (`FR-PREFLIGHT-003`): the material states the static-preflight limit honestly; an antigravity-style runtime exit-0/empty-output timeout remains a dispatched runtime failure and is not claimed as a static preflight capture.
- **AC-CLEANUP-005** (`FR-CLEANUP-005`): source/material drift stops managed polling, records a failed dispatched attempt with `error.code=REVIEW_SOURCE_DRIFT`, detaches without `cancelManaged`, and permits an explicit `material_changed` / judged retry without implicit redispatch or fabricated success.

## Non-goals

- RED only: no production implementation, schema, configuration, provider, confirmation-point, or material-semantic edit.
- No edit to the four current RED test files; no changes to P1/P2 files or route/testing facts, and no P1/P2 rerun.
- No real network/provider call, service startup, `cancelManaged` call by the runner, review, GREEN, RED→GREEN aggregate, commit, push, merge, archive, release, or cleanup.
- No claim that the expected exit `1` is achieved until the single command returns; the actual exit code and failure ownership are authoritative.

## Boundary

The only writes authorized by this phase are this Phase Card, the external raw test output `quality/tests/output/P3-red.txt`, and the T005 execution-status facts in `specs/workflowhub-cost-baseline-and-blocker-close-20260917/tasks.md`. Existing dirty production/test/material bytes in the authenticated worktree are preserved and are not silently attributed to this runner. The T005 test command reads the four listed files and their deterministic local fixtures; it does not authorize writing production code or the config files named `DO NOT TOUCH` by the plan.

## Route, testing skill, command, and oracle

- **old route**: `feature`, the P3 task/plan pre-design for a targeted backend review/dispatch behavior run.
- **selected route**: `fullstack`.
- **reroute**: `yes`; the one direct advisor classified the actual four changed test paths as `fullstack` because they span both `skills/` and `tests/` top-level roots. This is the advisor script's conservative path-boundary result, not a claim of UI/database/deployment coverage.
- **test-routing-advisor**: used exactly once for this Phase, at `2026-09-17T18:35:39.305Z`; result:

  `{ "routing_tier":"fullstack", "routing_rationale":"skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs, skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs, tests/contract/review-material-change-redispatch.test.mjs, tests/review/review-record-route.test.mjs => fullstack 边界", "result":"pass", "ts":"2026-09-17T18:35:39.305Z" }`

- **concrete testing skill**: `backend-testing`, used directly exactly once after authenticating the real changed-file boundary. It selected a targeted local Vitest run for backend review/dispatch behavior; no service or network/provider is required.
- **backend-testing inputs**: changed files are exactly the four paths above; FR/AC are `FR-PREFLIGHT-001/002/003` and `FR-CLEANUP-005` / the four ACs above; fixtures are deterministic `tmpdir` and injected fake route/provider seams; snapshot binding is the authenticated worktree `HEAD=160778878912124c292f1beb0e5008299c396743` plus `material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`.
- **declared command, exactly once**:

  `./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/contract/review-material-change-redispatch.test.mjs tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`

- **expected exit**: `1` for T005 RED, but actual exit is authoritative. A valid RED must be target assertion failure; setup, fixture, environment, or command failure is `incomplete`, not a clean RED.
- **oracle**: `ORACLE-PREFLIGHT-DRIFT {"pass":"PREFLIGHT-DRIFT 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`.
- **evidence**: active canonical T005 RED `quality/tests/output/P3-red.txt` — `34956 bytes`, `sha256=431f5c1b563a4bf4059abaa5cd2253544458fa22c887e54832a9fdb15fcefaa5`. `quality/tests/output/P3-red-pre-t006.txt` remains historical provenance only; it is not an active T005 ref. T006 GREEN remains a separate current individual ref; the existing RED→GREEN aggregate is historical/provenance only, not a current aggregate.
- **coverage limits**: only the four listed ACs, their named assertions, the deterministic preflight/drift seams, and retained negative guards in the declared four-file command. This does not prove implementation, GREEN, P1/P2, full regression, seven-redline completeness, external producer completion, review quality, release, or task completion.

## STOP

Stop and preserve the raw failure if the exact command cannot run, the output file cannot be safely preserved, the result is setup/environment/fixture failure rather than target assertion RED, the changed boundary leaves the four named test files or the authorized T005 status block, a config/provider/confirmation-point change is needed, P1/P2 route/testing would be rerun, a retained negative guard regresses, or any review/implementation action is requested implicitly. Do not run a second test or execute review. RED does not authorize T006 GREEN or Phase/Stage completion.

## Stage-end summary

The canonical T005 RED gate was published for the exact task-declared command; gate metadata reports `started_at_utc=2026-09-18T06:45:21Z`, `finished_at_utc=2026-09-18T06:48:27Z`, and `exit_code=1`.

- **raw evidence**: active canonical T005 RED `quality/tests/output/P3-red.txt` — `34956 bytes`, `sha256=431f5c1b563a4bf4059abaa5cd2253544458fa22c887e54832a9fdb15fcefaa5`. Historical provenance only: `quality/tests/output/P3-red-pre-t006.txt` — `986 lines / 53517 bytes`, `sha256=254ca562cec23b613509c311e5dcd5a1453cb6a1195ae000631be939d2852282`; it is not an active T005 ref.
- **canonical RED run summary**: four P3 test files, `4/4 collected`, `exit_code=1`, `27 failed / 213 passed`; setup/env failure `0`.
- **failure ownership**: target preflight/redispatch failures `8`; non-target later-phase failures `19`; the non-target failures remain outside T005 target RED. This is a valid RED under `ORACLE-PREFLIGHT-DRIFT`.
- **route/testing**: one `test-routing-advisor` use only: old=`feature`, selected=`fullstack`, reroute=`yes`, result=`pass`; one direct `backend-testing` use only; P1/P2 route/testing was not rerun. The selected fullstack tier follows the advisor's conservative `skills/` + `tests/` path classifier and does not imply UI/database/deployment coverage.
- **review/delivery**: review `unavailable`; `error=PROTOCOL_INCOMPATIBLE`; `coverage=incomplete`; no production code, config, provider, confirmation-point, material-semantic, commit, push, merge, archive, or release change was made by this runner. T005 and T006 task boundaries are `completed`; P3 remains `incomplete`; no Phase/Stage completion is authorized.
- **material binding**: the four-material `material_revision` is `revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`; changing only the T005 execution-status block is excluded by the runtime material contract.

## Current closeout addendum — T006

- **current identity**: `spec_sha256=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`; `material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`.
- **T005 readback**: active canonical RED is `quality/tests/output/P3-red.txt` (`34956 bytes`, `sha256=431f5c1b563a4bf4059abaa5cd2253544458fa22c887e54832a9fdb15fcefaa5`). `quality/tests/output/P3-red-pre-t006.txt` remains historical provenance only (`986 lines / 53517 bytes`, `sha256=254ca562cec23b613509c311e5dcd5a1453cb6a1195ae000631be939d2852282`).
- **T006 result**: implementation + the same targeted GREEN completed once with `exit_code=0`; `Test Files 4 passed (4)`, `Tests 221 passed (221)`, `11/11` target cases passed across the four P3 ACs. Raw GREEN is `quality/tests/output/P3-green.txt` (`106 lines / 12700 bytes`, `sha256=6ba289775a67fb79f4ef65b1a745fa4cd7c0a3b9ac125619527204f9e65938f0`).
- **historical/provenance RED→GREEN aggregate (not active evidence/current aggregate)**: `quality/tests/output/P3-red-green.txt` (`28 lines / 3519 bytes`, `sha256=4a2ae6ad41543a5e12628a7fac919c2b3a99f091fc4d790d136d5b34e08b154f`). It records that the `35` non-target failures in the RED backup are absent from GREEN (`non-target failures=0`), without claiming full-regression coverage.
- **review fact**: `unavailable`, `dispatch_state=blocked_before_dispatch`, `result_ref=null`, error `PROTOCOL_INCOMPATIBLE` (`configured providers mismatch`), coverage `incomplete`. Canonical attempt/report refs for `7c2970d1-a8dc-553b-ad7d-a929b36c6fb4` are `quality/reviews/attempts/7c2970d1-a8dc-553b-ad7d-a929b36c6fb4/attempt.json` and `quality/reviews/reports/7c2970d1-a8dc-553b-ad7d-a929b36c6fb4.md`; canonical root readback confirms both refs exist, so no provider semantic review result or coverage is claimed.
- **status boundary**: T005 `status=completed` means valid canonical RED only; T006 `status=completed` means implementation + targeted GREEN only. Review remains `unavailable` with `PROTOCOL_INCOMPATIBLE`, review coverage remains `incomplete`, and untested provider semantics remain explicit; P3, Phase, and Stage completion are not claimed.
- **next pending task**: `T007 — RED：格式宽容、CJK 脱敏与七红线` (`tasks.md` currently shows `[ ]` and `status=pending`).
