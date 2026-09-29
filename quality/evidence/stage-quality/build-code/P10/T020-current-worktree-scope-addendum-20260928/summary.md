# P10 current worktree scope addendum (read-only)

Captured 2026-09-27 16:34:55 UTC on CARD04 branch `task/workflowhub/workflowhub-thin-core-card-04-20260919`, HEAD `ef920f1fbd415fe87d50930359059b661e141acd`. The dirty path/status-list fingerprint is SHA-256 `686f153442e0a32c369470ccd0e2b950534e349cc6682da2df750264381eb67e`; per-file current SHA-256 and consumer/test edges are in [index.json](index.json). This is **not** a canonical dirty snapshot tree or source digest.

The earlier [61-path audit](../T020-worktree-only-61-audit-20260927/summary.md) and 206-unmapped count belong to snapshot tree `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b` and catalog revision `.10`. Source and catalog have since changed. Those counts are historical, not a current denominator and not a claim that paths have been removed from the selector.

## Small current traceable group

Sixteen paths from the old 61 have a present file, current hash, named owner/consumer edge and focused test file identity. They cover P8 catalog/source binding; P9 pre-execution change scope and independent three-target test registry; P10 selection, safe runner, fixed capture and result readback. `index.json` gives each exact path and hash. Source call sites show `capture.mjs` reads P9/P8 and selects cases, `targeted-capture.mjs` runs selected targets, and `case-reconciliation.mjs` reads the result. P8 catalog currently binds all 3 source-file hashes; P9 registry currently binds all 3 registered test-file hashes and lists 6 + 28 + 15 runnable leaves. These are **byte and relation checks only**. No test or fixed entry was run for this addendum.

Crucial limit: **0 of these 16 paths is a `change_triggers` path in the current three-case catalog.** A consumer/test trace is not a business-case selector mapping. The catalog is intentionally a finite three-case seed; it does not cover all changed files. Do not count these 16 as resolved unmapped paths, omit them from the next change scope, or claim business effects from 49 historical test leaves. The current all-path unmapped count and canonical result require a new authenticated snapshot and new fixed-entry run.

## Next fixed-entry preconditions

1. Freeze/authenticate this Task's current worktree snapshot, task start, current material revision, and source digest. Recompute the complete changed-path set at that same instant; do not reuse the old 215/206 denominator or this path-list fingerprint as a snapshot tree.
2. Recheck catalog source **and rule** revisions and registry target hashes against that snapshot. The current source-file and target-file hashes match, but this addendum did not independently validate all rule excerpts or runnable reporter leaves.
3. Give every changed production/test/document path an owner-backed consumer and case relationship or an independently justified non-business treatment, including the P8/P9/P10 mechanism paths here. Keep any unexplained path as `unavailable`; do not filter it out to make a green result.
4. Use the existing fixed command only after its authenticated inputs are stable. Preserve its outer canonical receipt plus inner argv/reporter/effect refs and hashes. Compare results to independent business observations; local contract pass alone is not AC-32/33 or whole-card completion.

This addendum only records a bounded current audit. It changes no source, catalog, registry, selector, receipt or quality conclusion.
