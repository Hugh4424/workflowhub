# P9 inventory current official targeted test

- Exact card command: `npx vitest run tests/contract/build-code-test-registry.test.mjs tests/contract/build-code-test-inventory.test.mjs`. Public verify call, new receipt/output refs, timeout 1200000 ms.
- Task workflowhub-thin-core-card-04-20260919; branch task/workflowhub/workflowhub-thin-core-card-04-20260919; HEAD ef920f1fbd415fe87d50930359059b661e141acd; before identity tree a8ba4bcc213c29f78aec61e4f64139444d3b0d1b, material revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044. Double preflight stable: true.
- CLI exit 0; receipt internal exit 0;  Test Files  2 passed (2);       Tests  11 passed (11);    Duration  23.00s (transform 168ms, setup 0ms, collect 732ms, tests 26.62s, environment 0ms, prepare 65ms).
- Receipt quality/tests/card04-P9-inventory-current-18c2b580-6d2b-4053-8186-a00855cfbb73.json SHA-256 e9a5697087e3d527d232051a40390c47ebf41a5d5c94f2f91a92a72a4c00fff7; output quality/tests/output/card04-P9-inventory-current-18c2b580-6d2b-4053-8186-a00855cfbb73.output SHA-256 74ee4014027b98e27d4dafafe24027d79733d1854da197c5f30b5c37089fac3a.
- 16 materials and related source/test SHA before/after: equal; facts equal: true; identity equal: true. Raw CLI, status, receipt/output copies and hashes are in this directory.
- This is a scoped test fact only. It does not prove business effect, Phase completion, CARD04 acceptance, or user confirmation.
