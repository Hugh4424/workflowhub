# Audit contracts and caller guide

## Authority and schemas

`workflows/{stage}/steps.json` (`schemas/steps.schema.json`) is the sole expected-topology authority. The append-only journal plus entry/exit receipts are the sole observed-fact authority. `schemas/audit-summary.schema.json` defines `AuditSummary`; only `core/audit-aggregator.mjs` may issue its canonical `verdict`. Stage results, validators, and facts assembly carry or verify that summary; none recomputes it.

`schemas/requirement-ledger.schema.json` defines the immutable requirement ledger: stable requirement IDs, source-to-decision-to-artifact-to-acceptance lineage, hashes, and stale propagation. R1–R9 count toward coverage; R10 is `withdrawn` history and never a coverage denominator item.

## Owners and consumers

| Contract | Owner | Consumers |
| --- | --- | --- |
| Step manifest | stage-definition maintainer | executor, manifest validator, aggregator |
| Journal / receipt | executor and receipt writer | aggregator, receipt verifier, diagnostics |
| Requirement ledger | source adapter and ledger builder | coverage core, aggregator, acceptance reporting |
| Audit summary | audit aggregator | stage-result, validator, facts assembly, human review |
| Summary reference/hash | stage-result producer | validator, facts assembly, next-stage caller |

Generic core accepts only `CanonicalSourceInput`; Multica-specific fields stop at `core/multica-source-adapter.mjs`.

## Error, skip, retry, and human semantics

| Condition | Required caller behavior |
| --- | --- |
| Legacy identity/field missing | Return `LEGACY_FIELDS_MISSING`; include the field and migration hint; never invent it. |
| Unknown legacy action or required field | Return `UNKNOWN_STEP` or `unknown`; fail closed, never map to pass. |
| Source incomplete / unknown | Preserve `SOURCE_INCOMPLETE` or `SOURCE_UNKNOWN`; do not submit an empty ledger. |
| Hash mismatch / stale evidence | Return `HASH_MISMATCH` or `STALE_EVIDENCE`; the evidence cannot support pass. |
| Receipt failure, duplicate, or out-of-order | Retain observed facts for the aggregator; missing valid same-attempt evidence prevents pass. |
| Skip | Emit terminal `skipped` plus reason. Skip is an observed fact, not success. |
| Retry | Use a new `attempt_id`; never join entry and exit across attempts. |
| Human gate | Emit `needs_human`, preserve the aggregator verdict, and wait for an explicit human decision. |

## Offline and Multica caller guidance

Offline callers create `CanonicalSourceInput` from a fixture. Multica callers normalize issue/comment material through `normalizeMulticaSource`; both paths must produce the same canonical shape, ledger, summary, and verdict for equivalent content. Callers pass evidence references and hashes, invoke the aggregator once, then carry its `audit_summary_ref`, `audit_verdict`, and `audit_summary_hash`. Do not pass Multica-native fields into generic core or compute a local verdict.

## Cutover completion signal

Cutover is complete only when all five stage manifests use canonical IDs, all eight registry consumers preserve the one-summary rule, legacy callers receive explicit mapping or `unknown`, and the relevant tests cover malformed, duplicate, out-of-order, tampered, stale, legacy, offline, and Multica inputs. Until then, legacy boundaries remain explicit; they never become a second authority.
