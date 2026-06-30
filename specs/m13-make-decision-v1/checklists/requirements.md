# Requirements Quality Checklist — m13-make-decision-v1

> 每条 FR 逐项核对：清晰（Clear）、可测试（Testable）、有决策溯源（Traced）、无歧义（Unambiguous）。
> 全部通过才可推进 build-plan。

## 检查项说明

| 列 | 含义 |
|----|------|
| Clear | 非技术干系人可读，无实现细节泄露 |
| Testable | 有明确失败判据，可手动或命令验证 |
| Traced | 有对应决策来源（D1–D6 或 CONSTITUTION 条款） |
| Unambiguous | 无多义词、无"尽量/可能/适当"等模糊副词 |

---

## FR-FLOW 系列

| FR | Clear | Testable | Traced | Unambiguous | 备注 |
|----|-------|----------|--------|-------------|------|
| FR-FLOW-01（11 步顺序） | [x] | [x] journal 事件可查 | [x] D1 | [x] 顺序固定枚举 | |
| FR-FLOW-02（档位路由） | [x] | [x] journal skipped 事件可查 | [x] D1 | [x] lite/full 二值 | |

## FR-RESEARCH 系列

| FR | Clear | Testable | Traced | Unambiguous | 备注 |
|----|-------|----------|--------|-------------|------|
| FR-RESEARCH-01（muyu extra_sources>=3） | [x] | [x] artifacts 中 get_sources 核实结果可查 | [x] D2 + skill-reuse-classification §1 | [x] >=3 明确数值 | |
| FR-RESEARCH-02（anysearch 调用） | [x] | [x] artifacts source:anysearch 标记可查 | [x] D2 | [x] | |
| FR-RESEARCH-03（返空即停） | [x] | [x] dual_research_empty:true 标记可查 | [x] D2 | [x] "均返回空"定义明确 | |

## FR-REVIEW 系列

| FR | Clear | Testable | Traced | Unambiguous | 备注 |
|----|-------|----------|--------|-------------|------|
| FR-REVIEW-01（三角度异源盲审） | [x] | [x] 三个产物文件独立 reviewer_runtime_id 可查 | [x] D3 | [x] 三角度枚举明确 | |
| FR-REVIEW-02（输入隔离） | [x] | [x] 产物中无交叉引用内容 | [x] D4 + flow-aligned §S5 | [x] 隔离逻辑通过独立 reviewer 保证 | |
| FR-REVIEW-03（防漏阀留痕） | [x] | [x] blocking 时三行格式可 grep | [x] D4 + flow-aligned §防漏阀 | [x] 格式固定三行 | |

## FR-DEBATE 系列

| FR | Clear | Testable | Traced | Unambiguous | 备注 |
|----|-------|----------|--------|-------------|------|
| FR-DEBATE-01（第一次 debate 门控） | [x] | [x] artifacts/make-decision-debate-1.md 或 journal skipped 事件 | [x] D1 + D5 | [x] 触发条件明确（blocking>2 或方向级分歧） | |
| FR-DEBATE-02（第二次 debate 门控） | [x] | [x] artifacts/make-decision-debate-2.md 或 journal skipped 事件 | [x] D1 + D5 | [x] | |
| FR-DEBATE-03（reuse-registry 登记） | [x] | [x] reuse-registry.md grep debate | [x] D5 | [x] | |
| FR-DEBATE-04（降级路径） | [x] | [x] artifacts 中 debate_skipped_reason 可查 | [x] D5 + env-var-design §实现建议 | [x] 两种 skip 原因枚举明确 | |

## FR-TALK 系列

| FR | Clear | Testable | Traced | Unambiguous | 备注 |
|----|-------|----------|--------|-------------|------|
| FR-TALK-01（三轮 talk 结构） | [x] | [x] artifacts 三轮标记 + journal skill_called 事件 | [x] D1 | [x] 三轮目的和产物路径明确 | |
| FR-TALK-02（一次一问按影响排序） | [x] | [x] 产物中问题排序编号可查，无批量提问格式 | [x] D1 + decision-log §D1 | [x] | |

## FR-GRILL 系列

| FR | Clear | Testable | Traced | Unambiguous | 备注 |
|----|-------|----------|--------|-------------|------|
| FR-GRILL-01（grill-with-docs-lite） | [x] | [x] artifacts/make-decision-grill-with-docs.md 存在；退出条件可验证 | [x] D1 + skill-reuse-classification §5 | [x] 退出条件（四件事或 3 轮上限）明确 | |

## FR-LEDGER 系列

| FR | Clear | Testable | Traced | Unambiguous | 备注 |
|----|-------|----------|--------|-------------|------|
| FR-LEDGER-01（台账两个渲染点） | [x] | [x] 两个产物文件存在且含状态标注 | [x] D4 + flow-aligned §台账渲染点①② | [x] 两个时间点明确 | |
| FR-LEDGER-02（禁止静默丢弃） | [x] | [x] 对比输入需求 vs decision-log 范围，差集有台账驳回 | [x] D4 | [x] | |
| FR-LEDGER-03（新想法回退 D15） | [x] | [x] 候选列表存在（可空）；无自动范围扩大 | [x] D4 + flow-aligned §D15 | [x] | |

## FR-ACCEPT 系列

| FR | Clear | Testable | Traced | Unambiguous | 备注 |
|----|-------|----------|--------|-------------|------|
| FR-ACCEPT-01（方向基线确认 S4） | [x] | [x] artifacts round:2 含方向基线摘要；journal user_confirmed 事件 | [x] D1 + flow-aligned §S4 | [x] 四件事格式明确 | |
| FR-ACCEPT-02（S9 唯一硬门控） | [x] | [x] journal s9_user_approved:true；decision-log user_decision:true | [x] D5 | [x] "明确回复同意"不含隐式确认 | |
| FR-ACCEPT-03（S9 台账逐条核对） | [x] | [x] S9 产物含台账逐条状态 | [x] D4 + D5 | [x] | |

## FR-ENV 系列

| FR | Clear | Testable | Traced | Unambiguous | 备注 |
|----|-------|----------|--------|-------------|------|
| FR-ENV-01（6 个可选 env var） | [x] | [x] 未设置时流程可跑；env 检测结果在 decision-log 可查 | [x] D6 + env-var-design | [x] 6 个 var 枚举明确，默认值明确 | |
| FR-ENV-02（env var 不进注册表） | [x] | [x] grep config/workflowhub.yaml 无 MAKE_DECISION | [x] D6 + env-var-design §实现建议 | [x] | |

## FR-METRIC 系列

| FR | Clear | Testable | Traced | Unambiguous | 备注 |
|----|-------|----------|--------|-------------|------|
| FR-METRIC-01（metrics 记录完整） | [x] | [x] task-metrics.jsonl 可查；异常注入可验证不阻断 | [x] CONSTITUTION F6 | [x] 10 字段枚举明确 | |

---

## 汇总

- 总 FR 数：22
- 全部 Clear: 22/22
- 全部 Testable: 22/22
- 全部 Traced: 22/22
- 全部 Unambiguous: 22/22

**结论**：所有 FR 通过质量检查，可推进 spec-clarify 歧义扫描。
