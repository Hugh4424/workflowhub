---
name: spec-research
description: Research planning uncertainties from a frozen specification packet.
version: 1.0.0
---

# Spec Research

Receive frozen specification content and explicit research questions from
build-plan or build-spec. Do not receive a writer or discover task/storage/repo paths.
External research follows the host's approved search capability.

## 与 deep-research 的分工

`spec-research` 只承担 build-plan/build-spec 阶段的轻量规划问题，以及后续阶段已经
收敛方向后的点状疑问；它返回内存中的 `spec-research-result.v1`，不写正式研究报告。
`deep-research` 才承担 make-decision 深度调研：R0-R5、原文阅读、并行深读、
三角测量、content-addressed `research-report.v1` 和独立复核。两者不能在同一消费场景
重复承担深度调研，也不能把 `spec-research` 的内存结果冒充正式研究报告。

Return one in-memory `spec-research-result.v1` value. For each question it
records evidence, alternatives, recommendation, trade-offs, and remaining
uncertainty. If research is unnecessary, return `status: skipped` with the
supplied reason instead of pretending research was performed. Never write a
file or publish a formal artifact.
