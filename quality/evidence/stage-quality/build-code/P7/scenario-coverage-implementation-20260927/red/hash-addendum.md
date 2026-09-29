# RED source and raw hash addendum

The original `run.json`, stdout and stderr remain unchanged. This later read-only hash check fills two fields absent from that run index; it is not a claim that hashes were recorded before execution.

- Before `runtime/stage/stage-handlers.mjs` copy: SHA-256 `d3449bb5a66960fdc84f0555051f5d821abb1804c9bfefd311c26366626b6e40`.
- Before `runtime/stage/stage-runner.mjs` copy: SHA-256 `9ee916e5692042df9535a1f278efce14a84ddf2dd61c87f9dadef5362337cc84`.
- `red/stdout.raw.txt`: SHA-256 `b5069bc108b5052f9fdc3c0d6ec4099700d5bac67260aa70f7d6c8135679e2b8`.
- `red/stderr.raw.txt`: SHA-256 `1875d5632cea34f02125cc82f51a4cfad95fee26dc493fbb5c2c02523c7ee0ce`.

The copies are in `../before/` and the raw files are in this directory. The targeted result remains 3 expected failures and 1 passing positive control, not a full P7 verdict.
