# P12 handoff current official targeted test

- Exact card command: `npx vitest run tests/contract/verify-code-business-handoff.test.mjs`. Public verify call, new receipt/output refs, timeout 1200000 ms.
- Task workflowhub-thin-core-card-04-20260919; branch task/workflowhub/workflowhub-thin-core-card-04-20260919; HEAD ef920f1fbd415fe87d50930359059b661e141acd; before identity tree a8ba4bcc213c29f78aec61e4f64139444d3b0d1b, material revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044. Double preflight stable: true.
- CLI exit 0; receipt internal exit 0;  Test Files  1 passed (1);       Tests  3 passed (3);    Duration  110ms (transform 10ms, setup 0ms, collect 7ms, tests 2ms, environment 0ms, prepare 27ms).
- Receipt quality/tests/card04-P12-handoff-current-d00c2491-3e88-4dec-8727-d3095da1c7c0.json SHA-256 3dd40a9d74556229012aef312a16492178cb23fac62db2c4ffa9e0551edb0e20; output quality/tests/output/card04-P12-handoff-current-d00c2491-3e88-4dec-8727-d3095da1c7c0.output SHA-256 49cfd376cfae63526cd2a185bdfebafe920d0e1455c40cebcea56866ef8eadfc.
- 16 materials and related source/test SHA before/after: equal; facts equal: true; identity equal: true. Raw CLI, status, receipt/output copies and hashes are in this directory.
- This is a scoped test fact only. It does not prove business effect, Phase completion, CARD04 acceptance, or user confirmation.
