# P5/T007 vNext gaps and per-AC evidence candidates — 2026-09-27

## Boundaries

- Task worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`, branch `task/workflowhub/workflowhub-thin-core-card-04-20260919`, HEAD `ef920f1fbd415fe87d50930359059b661e141acd`.
- Current material after this edit: `spec.md` SHA-256 `7dd86b4dee54703d60464e142485140eb47be8b42e7b20ff9295c56d08004188`; `phases/P5.md` SHA-256 `d1b8c4379aa67995a445ace3d0cf79f73b284ad33a4285512c7682ae4af21095`. These material hashes were recorded after the source edit, not as a contemporaneous before/after pair.
- Only `runtime/stage/stage-end-report.mjs` and the appended tests in `runtime/stage/stage-end-report.test.mjs` changed for this repair. The original eight test cases were left in place; the pre-append test SHA-256 was `c6273eb0272b6f12914da2b2dcf15282ae4e471f84f27701325d39b06a376165`. The old exact eight-test stdout remains `T007-source-binding-green-frozen.stdout.txt`, SHA-256 `e9b5f24b498aa759202a7e85ff855ecbc38162efbec4537737ba82f0be05b278`.

## Test sequence

- Before source edit, source SHA-256 `143360c0493fec52aa7d39839ee31b3e222c9d503fff45cb9d60e55195ecaf93`; appended test SHA-256 `6ca38e177bed0e5f5d57dfcd4a251781e8b713cd7a5dc375f2518e948b9776a8`.
- RED command: `npx vitest run runtime/stage/stage-end-report.test.mjs`. Exit `1`; **5 failed / 9 passed of 14**. The failures were the new vNext status/material disclosures and three invalid per-AC evidence references. Raw stdout SHA-256 `a9c8f09d1d224e0775c0e0793424fe3fc273b8e3b2b230bb0fab6acc0d4eabed`, stderr SHA-256 `92a98c311188037c5354e83bb71812f6aa339b9191093c289aa526756a7a96eb`; corresponding `.stdout.txt`, `.stderr.txt`, and `.exit.txt` are retained.
- GREEN command: `npx vitest run runtime/stage/stage-end-report.test.mjs tests/contract/acceptance-result-machine-classes.test.mjs`. Exit `0`; **2 files / 42 tests passed**. Raw stdout SHA-256 `7bfb786589cd470a6e2095cc20f22ef612262b257290a2dff3fd670fe90613cc`, stderr SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; corresponding `.stdout.txt`, `.stderr.txt`, and `.exit.txt` are retained. Final source SHA-256 `ca6fd47a80380832a8af300fcc31d1c8c60d63ab646350f529354763515e171f`; final test SHA-256 remains `6ca38e177bed0e5f5d57dfcd4a251781e8b713cd7a5dc375f2518e948b9776a8`. `node --check` passed for both files.

## Behavior and limits

- A formal vNext result with `status=in_progress` now has a sourced `not_done` entry even if `quality_status=passed` and `work_status=ready`. Each `completion.missing[]` and `readiness.missing_materials[]` entry gets its own source path. `blocked_by_missing_material` is also disclosed. A `ready` work status alone is not reported as completion.
- A per-AC evidence array needs at least one nonblank `ref` with a 64-character lowercase hex `hash` to count as a structurally valid candidate. Empty objects, blank refs, and bad hashes each produce a sourced per-AC `not_done` entry. This pure transformer does **not** authenticate the reference, hash, task, or snapshot; its existing `source_binding=unavailable` disclosure remains.
- This does not change `exceptions`, implement T008 source capture, or certify P5/T007. The still-open human-declaration rule and independent review remain separate.
