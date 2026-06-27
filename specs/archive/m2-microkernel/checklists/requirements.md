# Specification Quality Checklist: M2 微内核核心

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-06-22
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — 技术栈（Node/YAML）在 decision-log 记录，spec 正文用"结构化结果/统一检查入口"等行为语言，未夹具体框架
- [x] Focused on user value and business needs — 以"开发者能观察到的行为"为场景，验收均为行为判据
- [x] Written for non-technical stakeholders — 速读卡 + 场景用大白话
- [x] All mandatory sections completed — 11 章齐全

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain — 无（需求源已经两轮审查+两次辩论收敛）
- [x] Requirements are testable and unambiguous — 每条 FR 带 Given/When/Then 行为验收
- [x] Success criteria are measurable — 验收清单 11 项均可命令/手动验证（绿/红、零/非零退出）
- [x] Success criteria are technology-agnostic — 用"非零退出/报红/调起"等行为表述，未绑框架
- [x] All acceptance scenarios are defined — 第 3 章 15 条场景覆盖正常/边界/失败/守卫/可证伪
- [x] Edge cases are identified — 缺必备键、占位键缺失、组件失败、输出非法、漏扫等
- [x] Scope is clearly bounded — 第 2/8/9 章明确不做 + 承接下游里程碑
- [x] Dependencies and assumptions identified — 第 9 章隐性必达（平台约束交叉比对结论、术语补充、可证伪）

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria — 18 条 FR 每条有验收
- [x] User scenarios cover primary flows — 调起/换/加/解析/失败/守卫六类主流程
- [x] Feature meets measurable outcomes — 第 10 章验收清单逐项对应 FR
- [x] No implementation details leak into specification — 核心边界只写行为判据，glob/字段表/路径均留 plan/M3

## Notes

- 核心目录边界的 glob 表达、反宿主第四类完整匹配模式、组件清单条目最小结构 = 第 10 章「未决问题」，明确留 plan 阶段，符合 design 阶段"不写文件路径/代码"约束。
- 每条 FR 可回指 decision-log 决策编号（第 4 章括注），满足扎根可追溯要求。
