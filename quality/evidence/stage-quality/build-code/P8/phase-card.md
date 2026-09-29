# CARD-04 build-code P8 Phase Card

- Goal: create one versioned, machine-readable business case catalog with only sourced CARD-04 seeds, known regression relationships, and explicit unknown legacy/B2 obligations.
- Task/AC: T017, FR-29/30 and AC-29/30. Catalog presence and two local assertions do not prove independent inventory, automatic execution, or complete business coverage.
- Allowed implementation file: `docs/quality/business-case-catalog.json`. Frozen `tests/contract/business-case-catalog.test.mjs`, P1–P7, spec, index, runtime and skill bundles are read-only for this Phase.
- Route: capture target RED with `npx vitest run tests/contract/business-case-catalog.test.mjs` (two collected, two meaningful missing-catalog assertions); use actual-file `test-routing-advisor` and one applicable testing skill; add sourced stable seeds and seven P9–P12 evolution obligations from current physical files; run same GREEN and isolated negative controls for a broken relation/false covered claim.
- Truth boundary: `uncharted_legacy=unknown`; planned P9/P10/P11/P12 cases stay `not_done`/`unknown` until genuine source, consumer, runner result, and independent review support promotion. Do not infer business rules from test filenames or mark future features implemented.
- STOP: unknown source/owner/revision/consumer, test target drift, import/setup RED, or fabricated business rule. Record exact gap and owner without changing the frozen test.
- Review: one independent P8 OCR Phase review after files and evidence are stable; dispose findings. Handoff records case→source→target→consumer proof, actual test count/exits, AC limits and next Phase.
