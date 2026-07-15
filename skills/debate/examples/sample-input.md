# Sample Input — API Authentication Scheme Decision

> This is a fictional but realistic example showing what a typical `debate` input looks like.
> Scenario: a backend team is mid-sprint and Claude proposed an auth scheme; the reviewer pushed back on three points.

---

## Background

The team is building a public-facing REST API for a SaaS product. Claude proposed using API keys (long-lived, per-workspace tokens) as the primary auth mechanism, arguing it's the simplest path for the initial launch. The reviewer (codex) ran a security-focused pass and flagged three issues.

---

## Claude's Decisions (甲队代言方)

**甲1 — Use long-lived API keys, no expiry by default**
API keys are issued once and stored by the client. No rotation required unless the user revokes manually. Rationale: reduces client-side complexity; most developer-facing SaaS (Stripe, Twilio) does this at launch.

**甲2 — Authenticate at the API gateway layer only; skip re-validation in downstream services**
The gateway stamps a verified header (`X-Workspace-Id`) on every request. Internal services trust this header and do not re-validate the token. Rationale: avoids redundant crypto on every hop, keeps service code simple.

**甲3 — Store API key hashes in a single `api_keys` table, no per-key scope column yet**
Scopes are a future concern. Right now every key has full workspace access. Column can be added later when the scope model is defined. Rationale: YAGNI; building the scope system now without a clear permission model wastes a sprint.

---

## Reviewer Findings (乙队代言方)

**乙1 — No expiry = permanent credential leak window (direction-level)**
Long-lived keys with no forced rotation mean a leaked key is valid indefinitely. The reviewer argues the team should ship with a default 90-day expiry (auto-renewable) at launch, not defer it. This is a product security posture decision, not an implementation detail — it changes what "secure by default" means for the product.

**乙2 — Trusting an internal header is an implicit trust-boundary decision (direction-level)**
Stamping `X-Workspace-Id` and letting downstream services trust it without verification assumes the internal network is fully trusted. The reviewer argues this is a deliberate architecture call that should be documented as a conscious decision, and that any future service exposed outside the gateway (e.g., a webhook processor, a third-party integration endpoint) will silently inherit this assumption and become a bypass vector.

**乙3 — `api_keys` table is missing a `last_used_at` column (implementation-level)**
Without recording when a key was last used, there is no way to detect stale keys or alert users. Adding `last_used_at` is a one-column migration with no schema complexity. This is a straightforward addition that does not change the auth model.

---

## Classification Note

| Finding | Type | Triggers debate? |
|---------|------|-----------------|
| 乙1 no-expiry credential leak | Direction-level (security posture) | Yes |
| 乙2 implicit trust-boundary decision | Direction-level (architecture assumption) | Yes |
| 乙3 missing `last_used_at` column | Implementation-level (additive, no model change) | No |
