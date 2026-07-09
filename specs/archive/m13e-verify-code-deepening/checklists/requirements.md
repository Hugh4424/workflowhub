# 需求质量检查清单 — m13e-verify-code-deepening

> 对应 spec-specify 质量门，逐条核对。

## 文档质量

- [x] 无实现细节泄露（无编程语言、框架、API 名称）
- [x] 聚焦用户价值与业务需求（证据可信度和放行判断可靠性）
- [x] 非技术干系人可读（FR 用业务语言描述）
- [x] 所有必填章节已完成（速读卡/FR/不做/验收/影响范围 五章齐全）

## 需求完整性

- [x] 所有 [NEEDS CLARIFICATION] 标记已解决 — NC-01/02/03 均已由 spec 阶段自行定义，无待澄清项
- [x] 所有功能需求可测试、无歧义（FR-TRACE-001/002、FR-STRATEGY-001、FR-FRESH-001、FR-L3-001、FR-SUMMARY-001、FR-L3IRON-001、FR-COLOR-001 均有 Given/When/Then 场景）
- [x] 成功标准可度量（第三章验收标准 7 条均为可机器检查的物理事实）
- [x] 成功标准不含实现细节
- [x] 所有验收场景已定义（每个 FR 至少 2 个场景，含正向+边界）
- [x] 边界情况已标识（跳过留痕、偶发失败 flaky、旧报告复用场景均已覆盖）
- [x] 范围已明确界定（"不做"章节列出 5 条出 scope 项）
- [x] 依赖和假设已记录（附录 A 四条假设）

## 功能就绪

- [x] 每条功能需求有明确验收标准 — NC-01/02/03 对应 FR 验收标准已在正文中补全（no_browser_test、ac_routes、stage-summary.jsonl）
- [x] 用户场景覆盖主要流程（正向 + 边界 + 跳过留痕 + 偶发失败 + 历史报告复用 均有覆盖）
- [x] 功能满足成功标准中定义的可度量目标
- [x] 无实现细节泄漏进规格书

## FR 列表

| FR ID | 对应决策 | 说明 | 场景数 |
|---|---|---|---|
| FR-TRACE-001 | D1 | 查痕步骤 | 3 |
| FR-TRACE-002 | D1 | 关联比对可验证 | 1 |
| FR-STRATEGY-001 | D2 | test-strategy skill | 3 |
| FR-FRESH-001 | D3 | freshness 四段校验 | 2 |
| FR-L3-001 | D4 | L3 复用 isolated-browser-qa | 2 |
| FR-SUMMARY-001 | D5 | stage-summary 双调用 | 1 |
| FR-L3IRON-001 | D6 | L3 fresh 重跑铁律 | 2 |
| FR-COLOR-001 | D7 | 三色门 | 3 |

## 已解决项（原 NC-01/02/03，spec 阶段已自行定义）

1. **NC-01 已定义**：跳过留痕字段名 `no_browser_test: true`，位于 spec `meta` 段
2. **NC-02 已定义**：`ac_routes` YAML 字段；AC ID 正则 `^AC-\d+$`；缺 route 报错 `MISSING_ROUTE: {AC_ID} has no route in test-strategy.md`
3. **NC-03 已定义**：`evidence/stage-summary.jsonl`，每行 `{"event":"stage_summary","phase":"start"|"end","ts":"<ISO8601>"}` ，行数必须等于 2

本清单现已全部达标。
