---
name: spec-clarify
description: Resolve material ambiguity in supplied specification content.
---

# Spec Clarify

Receive the current `spec.md` content and controlled named-artifact callbacks
from build-spec. Never derive or accept task, root, repository, or product paths.

Identify only ambiguities that materially change scope, acceptance, interfaces,
data, security, or operations. Ask concise questions with a recommended answer.
Apply confirmed answers to `spec.md` through the supplied writer. Preserve
requirement IDs and append a clarification record. Unanswered material ambiguity
is reported, never silently defaulted.
