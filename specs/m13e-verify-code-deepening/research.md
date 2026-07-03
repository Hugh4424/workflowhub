# research.md — m13e-verify-code-deepening

**task-id**: m13e-verify-code-deepening
**generated-by**: spec-research SKILL.md
**date**: 2026-07-02

---

## 1. 功能背景

verify-code 阶段当前存在 7 个已识别漏洞（D1-D7），本次以 7 个补丁修复，档位 C（跨模块破坏性 schema 变更）。影响范围仅限 verify-code 阶段及其调用的子技能。

核心改动：
- D1：新增查痕步骤（trace-check），在 test-strategy 之后、L3 之前插入
- D2：新建独立 test-strategy skill，作为子代理调用
- D3：扩展 freshness.mjs 至完整四段校验（phase-N.md / RED / GREEN / L2）
- D4：L3 E2E 直接复用 isolated-browser-qa，不重新设计执行器
- D5：stage-summary 开始/结束双调用，产出 evidence/stage-summary.jsonl
- D6：L3 fresh 重跑铁律，git_sha 必须与当前 HEAD 匹配
- D7：stage-result status 从 green/red 二色升三色（green/yellow/red）

---

## 2. 已有实现参考

| 组件 | 当前路径 | 说明 |
|------|----------|------|
| verify-code 主技能 | `skills/verify-code/SKILL.md` | 本次修改主目标 |
| freshness.mjs | `skills/verify-code/freshness.mjs`（推断路径） | 需扩展至四段 |
| isolated-browser-qa | `skills/isolated-browser-qa/` | D4 直接复用，不改造 |
| stage-summary | `skills/stage-summary/` | D5 双调用 |
| test-strategy skill | 不存在，本次新建 `skills/test-strategy/SKILL.md` | D2 新机制 |

---

## 3. 技术选型与决策约束（来自 decision-log.md）

decision-log 中有以下未被 spec 完全捕获的约束：

1. **trace-check 关联比对**：极端攻击场景失效条件不在本次量化，但"机器可查"是硬要求（不依赖人工判断）。具体字段/命令留给实现阶段。
2. **stage-summary 两次调用可验证**：必须能证明确实调用了两次，具体输出位置由 spec 阶段拍板（已在 spec 中定义为 `evidence/stage-summary.jsonl` 追加写）。
3. **查痕跳过留痕**：不涉及界面的任务必须有显式 `no_browser_test: true` 字段；无标记又无报告一律计入 `missing_ac_coverage[]`。字段名固定 snake_case。
4. **test-strategy 机器可查**：AC ID 格式 `^AC-\d+$`，路由值合法集合 `P0/P1/P2/P3/skip`；缺 route 报 `MISSING_ROUTE:...`，未知 AC ID 报 `UNKNOWN_AC:...`。
5. **执行环境**：`MAKE_DECISION_SKIP_BLIND_REVIEW` 未设置（S5 单次盲审正常），`THIRD_REVIEW_RUNNER` 未设置（无仓库自定义）。

---

## 4. 风险点摘要

| 风险 | 说明 | 应对 |
|------|------|------|
| stage-result schema 破坏性变更 | green/red → green/yellow/red，下游消费者需同步 | 只改 verify-code 内部；stage-result 格式变更有文档记录 |
| test-strategy skill 新机制 | 子代理独立上下文，可能超时或失联 | SKILL.md 定义超时行为，失败记入 yellow |
| freshness.mjs 四段扩展 | 须同时处理 git_sha 和 content_hash，逻辑复杂 | 与 D1 trace-check 共用同一套验证逻辑，避免重复实现 |
| L3 fresh 重跑铁律 | CI 环境可能无 UI，偶发失败需降级路径 | D7 yellow 路径覆盖 flaky_failure=true 场景 |
| 跳过留痕字段 | 字段名 `no_browser_test` 与 spec 场景描述中出现的 `skip_ui_test` 不一致 | spec 正文 FR-TRACE-001 拍板为 `no_browser_test`，场景举例中 `skip_ui_test` 属笔误，以 FR 正文为准 |

---

## 5. 结论

研究完成。所有关键约束均已提取。一处已识别不一致（字段名歧义）已记录于风险点第 5 条，供后续 spec-analyze 扫描确认。无需人工升级即可进入后续步骤。
