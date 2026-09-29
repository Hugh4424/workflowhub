# P8/T017 deferred regression source correction

## Authority and byte boundary

`specs/workflowhub-thin-core-card-04-20260919/phases/P7.md` T015 explicitly requires the existing `tests/deferred-acceptance-semantics.test.mjs` guard to remain green while the eight-value whitelist and six-value nonterminal handling are introduced, and keeps `quality-fact.v1.status` unchanged. This is an independent current material basis for a **regression guard**. P7 does not independently prove every detailed mapper scenario or a live producer/business effect; the case statement was narrowed to the guard and those P7 obligations.

Before editing, the v2 catalog bytes were copied unchanged to `T017-catalog-before-source-fix-v2.json`; `cmp -s` exit 0. Its SHA-256 is `e92a0fe02d514d2e5baff6943e0ebce313c20750ce02c6ed40ace9dbb0f0f9e7`. Current P7 material SHA-256 is `f84be26579271b7bad51ea4aae587ad4a5cb9dff4a93762906cb3ea98e6442aa`.

`T017-source-fix.diff` is the exact unified diff (`diff -u` exit 1 because bytes differ; diff SHA-256 `23bd635965c0edf04fcc87887b7996c383b2bf2c22e32bf977370cdddefe66bd`). It changes only catalog revision `.2` → `.3` and `CARD04-DEFERRED-ACCEPTANCE-REGRESSION` source path/revision plus rule id/revision/statement. Current catalog SHA-256 is `d0d601a77cc2ed7d96a75f646aa8fbacebb922c97f8a3ba9c5130af670021dfa`. All three targets, 49 registered runnable IDs, relationships, scenarios, owner, AC/Task/Phase mappings, and other cases remain byte-identical in the diff.

## Focused checks

- Command: `npx vitest run tests/contract/business-case-catalog.test.mjs`. Raw output: `T017-source-fix-gate.raw.txt` (SHA-256 `7e651546fe0b18177253645d7e33cd3835e462e35893a83b6a212da34f1eeb2a`), 2 collected/2 passed, `EXIT=0`. Frozen test SHA-256 `9dc4435b117d52b2148b4373b61201a7f24a858335ddd36e9ad720c2ec907231`.
- Read-only Python JSON comparison: parsed the three existing Vitest JSON reporter outputs, rebuilt each full runnable ID from `test_file + ancestorTitles + title`, and compared ordered lists to the current catalog and `T017-runner-identity-alignment-crosscheck.json`. All 6/28/15 IDs match exactly; all raw assertions are `passed`, raw JSON SHA-256 values match crosscheck, and totals equal 49. Output: `T017-source-fix-ids.txt` (SHA-256 `7a3bd07e509e2c3b5907e2a99ba6010e475a9b11d66c84abfa5e3fb49437c3cb`), `EXIT=0`.

These are catalog and test-identity checks. They do not supply a CARD-04 canonical P9 inventory, a P10 business oracle, historical 123-record compatibility, or production deferred effect. Those remain separately evidenced or unknown.
