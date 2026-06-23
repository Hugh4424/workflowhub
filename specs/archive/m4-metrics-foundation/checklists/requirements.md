# Specification Quality Checklist: M4 指标底座（metrics foundation）

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-06-23
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — 全文无文件路径/类名/语言；实体只描述字段语义
- [x] Focused on user value and business needs — 以"运维/优化决策者能查到执行表现"为价值轴
- [x] Written for non-technical stakeholders — 叙述层 + 速读卡大白话
- [x] All mandatory sections completed — §1-§11 + 速读卡齐全

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain — 未决问题已显式列入 §10，非 inline marker
- [x] Requirements are testable and unambiguous — 每条 FR 至少一个 Given/When/Then
- [x] Success criteria are measurable — AC1-AC11 均可判真伪（出现/缺失/数量为零/复算一致）
- [x] Success criteria are technology-agnostic — AC 不提语言/框架/工具
- [x] All acceptance scenarios are defined — 12 场景覆盖正常/边界/失败
- [x] Edge cases are identified — 场景七/八/九（无审查/重开/历史缺字段）
- [x] Scope is clearly bounded — §9 明确不做逐条列出
- [x] Dependencies and assumptions identified — §2 背景 + §11 影响范围 + §10 未决问题

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria — FR↔AC 可对应
- [x] User scenarios cover primary flows — 场景一至六覆盖主流程
- [x] Feature meets measurable outcomes defined in Success Criteria — AC 覆盖每个功能域
- [x] No implementation details leak into specification — Spec-Purity 自检通过

## 溯源自检（design-reviewer-contract 专项）

- [x] FR 编号用 FR-<域缩写>-NNN（COLLECT/EXECREC/FEEDBACK/VERSION/BASELINE/GUARD/CI），无 FR-001 平铺
- [x] 新增类决策对应 FR 已注"来源：decision-log 决策 N（新增类）"
- [x] 第 11 章只写业务影响，不写文件路径/代码符号
- [x] FR-SRC-TRACE 双向核对段已写（decision-log 改动消费关系 → 第 11 章）
- [x] 无"来源类型=新增 且 用户批准=否"的死规则决策被写进 FR（18 决策均用户批准）

## Notes

- 所有项通过，无需迭代修订。
- 5 条未决问题留 plan/实现阶段定，均为实现细节（告警形态/用量源择一/返工取值/执行标识生成/卡点参数），不影响 spec 完整性。
