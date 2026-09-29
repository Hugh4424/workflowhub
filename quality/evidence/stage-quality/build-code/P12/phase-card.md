# CARD-04 build-code P12 Phase Card

- Goal: extend the existing verify-code instructions for independent risk-based business semantic sampling and actionable handoff to the existing final authorized business confirmation.
- Task/AC: T023, FR-34/AC-34. This is a skill contract update; genuine P10 per-case facts, P11 UI results, provider review and human reply remain separate evidence.
- Write set: `workflows/verify-code/SKILL.md` only. Frozen `tests/contract/verify-code-business-handoff.test.mjs` is read-only; no `business-handoff.mjs`, new stage, confirmation slot, or protected runtime/review edit.
- Route: use `writing-for-agents` for a concise executable skill section. Capture target RED and same-command GREEN with `npx vitest run tests/contract/verify-code-business-handoff.test.mjs`; run syntax on frozen test only if needed. Check the actual CARD-05 rewritten review/confirmation order and preserve it.
- Behavior: list sampled and unsampled case/AC IDs and reasons; compare original rule, real consumer, test identity, external effect, mock vs real dependency, uncertainty and high-risk negative/recovery paths; hand an authorized non-implementer precise steps/evidence through existing verify-code confirmation. No reply or unavailable service remains unknown/unavailable, not pass.
- STOP: needing a new producer, protected consumer, new confirmation or business approval, or a target RED caused by setup/zero tests. Record what remains missing and owner without inventing evidence.
- Review: one independent P12 OCR Phase review after stable text and evidence; disposition findings. Handoff states local contract result separately from real business acceptance and next P13 aggregate.
