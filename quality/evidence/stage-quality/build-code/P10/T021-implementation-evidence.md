# CARD-04 P10/T021 scoped evidence

- UTC observed: 2026-09-26T12:48:49Z
- CWD: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`
- HEAD: `ef920f1fbd415fe87d50930359059b661e141acd`
- Changed boundary: `workflows/build-code/case-reconciliation.mjs`, scoped instruction in `workflows/build-code/SKILL.md`, and this T021 evidence. T020, P8/P9, runtime, CLI, and frozen tests remain untouched in this assignment.
- Test route: `test-routing-advisor` category `feature` for a backend business-evidence seam; `backend-testing` focused on real runner output and negative ref/hash/effect checks. This is a local route choice, not a published task fact.

## Frozen target

Command before and after: `npx vitest run tests/contract/build-code-case-reconciliation.test.mjs`.

| Run | Raw output | Exit | Result |
| --- | --- | ---: | --- |
| Before edit | `T021-red.raw.txt` | 1 | 13 collected, 13 assertion failures; no import/setup failure |
| After implementation | `T021-after-implementation.raw.txt` | 1 | 11 passed, 2 failed |
| Final | `T021-final.raw.txt` | 1 | 11 passed, 2 failed |

All 11 reason-specific negative cases pass: pending/skipped/todo/failed, duplicate identity, absent oracle, changed balance, active cancellation, forged report digest, wrong runner identity, and missing effect artifact. The two positive fixture cases still expect `reconciled` and an AC `passed` entry. Their input has only a test title and caller-supplied effect fields/paths/hashes; no project-owned rule/version or authenticated Task/receipt reader. The module returns `unavailable/unauthenticated_business_oracle` with `observed` artifact entries after validating exact runner/report/AC/ref/hash/effect consistency. These two RED assertions are intentionally retained; they cannot be converted into an official business pass from this interface.

Frozen test SHA-256 `60a8d271ec77d81cd2c8308a7dd6798bf89b40114887cbf2dcce345da54f9ed3`; RED raw SHA-256 `8828cc01a7ed8d1c45fdeb6a5c18850101c9dcadd475c9b743a02c3e7fd776b4`; final raw SHA-256 `2ec676a198c55872c55a0fdb3e291adb80208a943e3d1c3c2f8aa14872ced0fe`.

## Direct controls

Command: `node quality/evidence/stage-quality/build-code/P10/T021-direct-probe.mjs`; exit 0. Output: `T021-direct-probe.raw.txt`. Matching test-owned artifacts remain `observed/unauthenticated_business_oracle`; a forged report digest gives `report_digest_mismatch`, and a changed account ID gives `business_effect_mismatch`. This synthetic probe adds no authority to the frozen test-owned business fixture.

Syntax command: `node --check workflows/build-code/case-reconciliation.mjs && node --check quality/evidence/stage-quality/build-code/P10/T021-direct-probe.mjs`; exit 0.

## Consumer and completion limit

The skill now directs the agent to launch one fixed trusted command, derive the case list rather than choose paths by hand, retain per-case runner and effect refs, and preserve old and new same-task repair evidence. No fixed launcher/official P10 consumer, independent business oracle, or authenticated per-AC receipt was added. AC-33 and the P10 Phase journey remain unknown/not_done; no OCR, commit, or official quality verdict is claimed here.
