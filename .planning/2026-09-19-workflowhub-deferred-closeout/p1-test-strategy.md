# P1 concrete testing strategy

- Testing skill: `backend-testing`.
- Actual boundary: `runtime/review/review-packet-identity.mjs` plus `tests/contract/review-material-change-redispatch.test.mjs`.
- FR/AC: `FR-IDENTITY-001/002`, `AC-IDENTITY-001/002`.
- Command: `npx vitest run tests/contract/review-material-change-redispatch.test.mjs`.
- Oracle: RED must fail the frozen cross-repo semantic vector while existing six tests remain runnable; GREEN must pass the vector, preserve different-material inequality, and keep existing review reuse/drift behavior green.
- Fixture/service: existing in-file TaskHandle fixture; no external service; BR authority read-only inspected at `lib/attachments.mjs:18-26`.
- Evidence: RED receipt `quality/tests/build-code-p1-t001-red.json` with output hash `74e69559e4569cb6878a32d4663c78854b015f2c2b39aaa704831bedad5ffa86`; first corrected-oracle rerun remained failed and was superseded by fresh GREEN; GREEN receipt `quality/tests/build-code-p1-t002-green-v2.json` with output hash `d26bb7a4ddbd401a05db15aa1092a9757e4b291ae837b9ab75b48fe1adad836c`.
- Coverage limits: proves the WH semantic identity vector and regression behavior; does not prove real provider dispatch or BR runtime behavior.
