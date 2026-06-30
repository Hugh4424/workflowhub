# AGENTS — m13b-build-spec-deepening

本 task 的角色与协作约定。初始化于 2026-06-30（make-decision stage）。

## Task 定位

M13b：build-spec 深化。补三类质量缺口（scope-triage 分档、spec 自检、decision-log×spec 对齐、独立 spec-reviewer）+ 落地跨 stage handoff v1 契约。五 stage 自举：make-decision → build-spec → build-plan → build-code → verify-code。

## 角色

| 角色 | 职责 | 红线 |
|---|---|---|
| 工头（orchestrator） | 拆分、派发子代理、汇总、维护状态 | 不自己写代码 |
| make-decision agent | 把需求变可执行方向，产 scope-decision | 不写代码、不拆 coding task |
| build-spec agent | 按 SKILL.md 产 spec + handoff 写回 | 自检不阻断（F3） |
| spec-reviewer 子代理 | 独立上下文审查 spec | 仅参考，禁 blocking（Q1/Q3） |

## 权威源（只读）

- decision-log.md（D1–D6 已批准方向，不可改）
- roadmap.md 行 350–357（M13b 段）
- CONSTITUTION.md F2/F3/F8/F10/Q1/Q3

## 硬约束

- 记事实不阻断：所有新增检查只浮现事实到文件，不卡推进（违宪 F3）。
- 独立审查：spec-reviewer 须独立子代理上下文（同源即违 Q3），禁自审自判。
- 窄契约：stage 间只走 handoff/latest.json + required_reads[] 窄引用；长报告 artifact-first。
- 不可逆/推进操作经人确认。

## 本 stage 产物

- tasks/m13b-build-spec-deepening/scope-decision.md（本 stage 产出，含 5 开放问题）
- tasks/m13b-build-spec-deepening/AGENTS.md（本文件）

## 下一步

用户拍板 OQ-1~OQ-5 → 进入 build-spec stage。
