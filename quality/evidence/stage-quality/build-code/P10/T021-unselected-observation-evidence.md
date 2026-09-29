# T021 unique extra observation diagnostic

Scope: P8 OCR finding F-02b644404ec7. The only production change is the final observation-count diagnostic in `workflows/build-code/case-reconciliation.mjs`: `duplicate_runner_identity` → `runner_identity_mismatch`. The earlier exact-identity duplicate check remains first.

## Reproduction and checks

| Check | Command | Exit | Result |
| --- | --- | ---: | --- |
| RED | `node quality/evidence/stage-quality/build-code/P10/T021-unselected-observation-probe.mjs` | 1 | Valid selected A alone reaches `unauthenticated_business_oracle` with `observed` entry; selected A plus unique unselected B returned `duplicate_runner_identity`, contrary to the asserted `runner_identity_mismatch`. |
| GREEN | Same command after one-line correction | 0 | Unique B returns `runner_identity_mismatch` with no entries; exact duplicate A still returns `duplicate_runner_identity`; neither has a passed entry. |
| Frozen T021 | `npx vitest run tests/contract/build-code-case-reconciliation.test.mjs` | 1 | 13 collected, 11 passed, 2 failed. The same alpha/beta positive assertions demand `reconciled`, while the seam returns `unavailable` because independent business oracle provenance is absent. No new failure. |
| Syntax | `node --check workflows/build-code/case-reconciliation.mjs` and `node --check quality/evidence/stage-quality/build-code/P10/T021-unselected-observation-probe.mjs` | 0 each | Parsed. |

Raw outputs and exit metadata: `T021-unselected-observation-{red,green,frozen}.raw.txt` and matching `.meta.txt` in this directory. The probe writes a valid TAP report and separate before/after account artifacts in a temporary directory, hashes their bytes, checks A's observed baseline, and removes temporary files. B is a distinct case/test identity. The test does not establish an authenticated business or AC pass.

## SHA-256

| File | SHA-256 |
| --- | --- |
| `case-reconciliation.mjs` before | `38b6ef11aeb39930d170ffb8090b6928b545cbe28f16f7d90bd665d74ed352ab` |
| `case-reconciliation.mjs` after | `20ad57f0b686d215e3f2d13774ce979bfe27c7063383bb53f81aa61e923ca056` |
| Frozen test | `60a8d271ec77d81cd2c8308a7dd6798bf89b40114887cbf2dcce345da54f9ed3` |
| Probe | `0d16ea6be53f70059eca74d3e7f18c72a75047a76cc7011bc704eaf02db1c742` |
| RED raw | `2523785a199b16527abfdffd0197ba8eaff0a7a43adc3b9f54a2e14d96bf8869` |
| GREEN raw | `7ce268802d48870cbe6f16c22751e7f8c6d1b1891d25d7e09267c0f01ee1a0e4` |
| Frozen raw | `bb0e32b2808face2a9d77d04a94d49335ce1265a1e72d3aa3bce62b8069cd482` |

Limit: the final status remains `unavailable/unauthenticated_business_oracle` for valid A; this diagnostic fix does not wire an independent rule source, TaskHandle, or canonical receipt verifier.
