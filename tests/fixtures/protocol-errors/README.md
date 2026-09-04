# Protocol-error fixture sources

These fixtures preserve the exact historical lesson `error` text and source
`entry_id` values. They are test inputs, not a new authority: the runtime
whitelist is the only classification authority. This portable checkout does
not contain the source lesson files, so `source_line` is explicitly `null` and
provenance records that limitation rather than claiming a line-level replay.

There are **15 historical entries across four files** and **15 specification
classes**. The counts are intentionally different concepts: repeated lesson
messages are multiple examples of one class, while runtime-derived classes may
have no historical example in the portable fixture set.

## Historical entry files

- `build-code-schema.json` — 4 entries for the build-code/build-plan
  `review_kind` and `review_track` schema classes.
- `build-code-acceptance-coverage.json` — 3 build-code acceptance-coverage
  entries.
- `verify-code-binding.json` — 4 verify-code binding entries.
- `close-authorization.json` — 4 entries from the resolved-review authorization
  boundary; one receipt-field entry belongs to the verify-code stage class.

Sources are represented by portable project-relative lesson paths such as
`workflowhub/lessons/build-code.jsonl` and
`PaperBuilder/lessons/verify-code.jsonl`. The original absolute source paths
were local to the source machine and are deliberately not treated as portable
proof. Each JSON entry keeps `source_line: null` and a provenance limitation;
no historical error string has been rewritten.

## The 15 specification classes

The `class_id` names below are the stable runtime categories required by
FR-CLASS-003. `historical entry` lists every fixture entry mapped to that
class; `runtime-derived` means the class is derived from the current checked-in
validation chain and has no portable lesson entry. `source_line: null` on a
historical entry means the lesson source is unavailable in this checkout, not
that a line number was guessed.

| class_id | stage / surface | diagnostic check_id | historical entry or runtime-derived basis |
| --- | --- | --- | --- |
| `verify_review_without_outcome` | verify-code / stage | `review_binding` | `verify-code-binding.json`: `29aea205-9fe0-4456-a3e9-f6475153a9ee`, `a4a06292-c12f-4bdc-9bfd-646e6169bbab`, `50d4f9d1-1cf1-401d-b893-d08533b90641` |
| `verify_outcome_unbound_review` | verify-code / stage | `review_binding` | `verify-code-binding.json`: `b8dbb5a0-7289-465d-a98b-4d252927addc` |
| `verify_review_mismatch` | verify-code / stage | `review_binding` | runtime-derived from `runtime/stage/stage-runner.mjs` verify-code binding branch (host review ref mismatch) |
| `verify_receipt_fields` | verify-code / stage | `receipt_fields` | `close-authorization.json`: `54dfd9b1-9965-4f40-a3c9-8dc0386d1b49` |
| `close_bind_outcome` | verify-code / resolved-review authorization | `bind_outcome` | runtime-derived from `runtime/task/task-kernel-implementation.mjs` authorization input/outcome binding checks |
| `close_outcome_ref` | verify-code / resolved-review authorization | `outcome_ref` | runtime-derived from `runtime/task/task-kernel-implementation.mjs` outcome ref/hash checks |
| `close_outcome_current` | verify-code / resolved-review authorization | `outcome_current` | `close-authorization.json`: `a7eed10a-f1ae-40af-a788-f45943b08d86` |
| `close_review_binding` | verify-code / resolved-review authorization | `review_binding` | `close-authorization.json`: `b82d2b1e-56c7-46a1-8f26-0ca114467e52`, `4020ded8-fae5-4805-917b-03bd15670668` |
| `close_review_identity` | verify-code / resolved-review authorization | `review_identity` | runtime-derived from `runtime/task/task-kernel-implementation.mjs` review hash/identity checks |
| `close_finding_coverage` | verify-code / resolved-review authorization | `finding_coverage` | runtime-derived from `runtime/task/task-kernel-implementation.mjs` actionable-finding/disposition coverage checks |
| `build_review_kind` | build-code | `review_kind` | `build-code-schema.json`: `38729c0d-a82c-479a-8051-45e7add41b4e`, `1e59804c-cd63-4520-aee6-dc784b27a6e7` |
| `build_review_track` | build-code/build-plan | `review_track` | `build-code-schema.json`: `0095c4ae-6967-43ee-bcc6-25190250b39e`, `a692c5d5-e1d7-4cdd-8225-ba4cefddb24a` |
| `acceptance_coverage_spec_mismatch` | build-code | `acceptance_coverage` | `build-code-acceptance-coverage.json`: `00501eae-fda5-4771-bf18-7c158b0ce5d8` |
| `acceptance_coverage_invalid_status` | build-code | `acceptance_coverage` | `build-code-acceptance-coverage.json`: `83e619f7-02b0-40b6-bc36-ff8165dd7b95` |
| `acceptance_coverage_invalid_evidence` | build-code | `acceptance_coverage` | `build-code-acceptance-coverage.json`: `519fff47-1ff3-458f-9ba8-933ed23cad2e` |

The six close `check_id` values and their order are fixed by the spec:
`bind_outcome` → `outcome_ref` → `outcome_current` → `review_binding` →
`review_identity` → `finding_coverage`. The fixture mapping explicitly marks
which of those have historical examples and which are runtime-derived; a
fixture filename or entry count is not used as proof of class coverage.

## Compatibility note

The planned legacy fixtures are separate from these historical lesson inputs.
Old stage outcomes and authorization records remain read-only; any future
compatibility fixture must identify whether it is a real preserved record or a
synthetic sample. New implementation facts must use existing content-addressed
quality records and must not rewrite these fixture bytes.
