---
name: spec-research
description: Research planning uncertainties from a frozen specification packet.
---

# Spec Research

Receive frozen specification content and explicit research questions from
build-plan. Do not receive a writer or discover task/storage/repo paths.
External research follows the host's approved search capability.

Return one in-memory `spec-research-result.v1` value. For each question it
records evidence, alternatives, recommendation, trade-offs, and remaining
uncertainty. If research is unnecessary, return `status: skipped` with the
supplied reason instead of pretending research was performed. Never write a
file or publish a formal artifact.
