# F10 反过度工程门 — m13d-build-code-deepening

> 对照 CONSTITUTION.md F10：自动化须按真实收益添加。
> 对 spec 中每个新引入机制逐条回答四问。
> 结论：non-blocking，findings 供人工在 human review checkpoint 决策是否砍掉。
> 生成时间：2026-07-01

---

## 机制 1：P0-P3 风险定级（FR-RISK-001）

**机制描述**：build-code 在每个 phase 开始时读取 facts.tasks 中的 risk_level 字段，将 P0-P3 风险等级记录到 evidence JSON，P0 时在执行日志中输出提示要求当前 phase 有测试覆盖。

**四问回答**：

1. **防御的真实威胁是什么？**
   已观察到的失败模式：高风险变更（跨系统边界、破坏性改动）在无额外测试覆盖时漏测，导致回归。P0-P3 分级是为了让"高风险 phase 必须有测试覆盖"这个要求在执行日志中显式浮现，而非隐含。这是 observed failure mode（agenthub 历史数据显示 test_execution_rate 最低 0.5，rework_rounds 最高 8.75）。

2. **现有机制是否已覆盖？**
   现有 build-code SKILL.md 无风险定级机制，测试覆盖要求未分级。当前机制不覆盖，新增有增量价值。

3. **能否被绕过？**
   可以。risk_level 字段由 facts.tasks 提供，若 facts.tasks 未填或填错则定级失效。P0 提示只是日志记录，不强制阻断，诚实的实施者才会遵守。对不诚实的实施者是安全剧场。
   **风险级别**: 中等（提示层面，非强制门）

4. **长期维护成本？**
   低。字段扩展到 metrics/capture.mjs（4 个字段），不引入新文件，不引入新流程依赖。AC 明确向后兼容。

**F10 结论**: 保留价值合理，但需接受"不诚实实施者可绕过"的局限性。建议保留，作为"提示+记录"而非"强制门"。

---

## 机制 2：L2 集成冒烟（FR-SMOKE-001）

**机制描述**：所有 phase 达到 GREEN 后，test-routing-advisor 选择 simple/feature/fullstack 三档之一触发冒烟，结果落盘 evidence/l2-integration-test-report.json，冒烟失败不阻断。

**四问回答**：

1. **防御的真实威胁是什么？**
   已观察到的失败模式：单 phase 测试通过但集成层失败（各 phase 单元测试 GREEN 但跨 phase 交互存在缺陷）。L2 冒烟是为了在 build-code 完成时提供一次集成层快照，让后续 verify-code 阶段有更多信息。

2. **现有机制是否已覆盖？**
   verify-code 阶段可以做集成测试，但 build-code 阶段完成时没有集成快照。L2 冒烟填补这个空白，不与 verify-code 重复（verify-code 会做更全面的验证）。

3. **能否被绕过？**
   可以。test-routing-advisor 的 tier 选择基于任务特征，若特征提取不准确则档位选择可能不恰当。冒烟失败不阻断，不诚实的实施者可以忽略失败结果。

4. **长期维护成本？**
   中等。引入 test-routing-advisor（外部技能，需改造）和 l2-integration-test-report.json 格式契约。三档选择逻辑需要维护。若任务类型变化，档位规则需更新。

**F10 结论**: 收益实际（集成层快照），成本中等（新外部技能 + 格式契约）。建议保留，但需人工确认 test-routing-advisor 外部技能改造成本是否可接受。**需人工决策：是否接受引入 test-routing-advisor 的维护成本？**

---

## 机制 3：mtime 防伪时序校验（FR-ANTIFORGERY-001）

**机制描述**：3rd-review 触发前，校验 phase-N.md / RED.json / GREEN.json 三个文件的 mtime 时序，违反"先 RED 后 GREEN"时序时 escalate_to_human。

**四问回答**：

1. **防御的真实威胁是什么？**
   假设的威胁：实施子代理伪造测试顺序（先写 GREEN.json 再补 RED.json）。这是假设性威胁，非已记录的 observed failure mode。当前 agenthub 历史数据中未见此类伪造案例记录。

2. **现有机制是否已覆盖？**
   现有无此校验。但 mtime 是文件系统层的物理时间戳，容易被 `touch` 命令重置，并非强密码学证明。3rd-review 的独立子代理本身就是质量裁决层，已能检出明显伪造迹象（若代码质量与测试结果不符）。

3. **能否被绕过？**
   **容易绕过**：`touch -t` 可任意设置 mtime，`cp` 保留时间戳，任何 git checkout 都可能重置 mtime。对诚实实施者是额外负担（需注意文件写入顺序），对不诚实实施者几乎无障碍。**高度安全剧场风险**。

4. **长期维护成本？**
   中等。需要在每个 phase 维护三个文件的写入顺序约束，违反时触发人工升级，增加人工介入频率。mtime 依赖操作系统行为，跨平台一致性存疑。

**F10 结论**: **建议人工审查是否保留**。该机制是最典型的安全剧场案例：防御假设性威胁、容易被绕过、对诚实用户增加约束。建议考虑简化为"记录三文件 mtime 到 evidence"（记录事实），去掉 escalate_to_human 的触发门。**需人工决策：是否保留 mtime 防伪 + escalate 机制，或降级为纯记录？**

---

## 机制 4：3rd-review 拆分为两个独立子代理（FR-REVIEW-001）

**机制描述**：3rd-review 由两个独立子代理分别执行 spec 合规性审查（spec-compliance-verdict.md）和代码质量审查（code-quality-verdict.md），维度正交，产物路径独立。

**四问回答**：

1. **防御的真实威胁是什么？**
   已观察到的失败模式：单一审查子代理同时承担 spec 合规和代码质量两个维度，两个维度相互干扰导致审查结论不清晰，审查质量下降。用户在 M13d decision-log 中明确批准此拆分（S9 已批准 2026-07-01）。

2. **现有机制是否已覆盖？**
   现有 build-code 使用单一 3rd-review 流程，维度未分离。本次拆分是在用户明确批准基础上的架构改进。

3. **能否被绕过？**
   两个子代理各自独立，任一失败不终止另一（AC-REVIEW-003）。若两个子代理由同一模型实例执行但 prompt 不同，仍属于"独立上下文"。整体不易被绕过。

4. **长期维护成本？**
   中等。两个独立产物文件（spec-compliance-verdict.md / code-quality-verdict.md）需要维护两套 prompt 和 verdict 格式契约。后续若审查维度扩展，需新增子代理。相比单一子代理，每次审查运行成本翻倍（tokens/时间）。

**F10 结论**: 收益实际（维度分离、审查质量提升），用户已明确批准，维护成本中等。建议保留。**无需人工决策，用户已批准（S9）。**

---

## 汇总

| 机制 | F10 风险级别 | 建议 | 是否需人工决策 |
|------|-------------|------|--------------|
| P0-P3 风险定级 | 低 | 保留（提示+记录，非强制门） | 否 |
| L2 集成冒烟 | 中 | 保留，但确认外部技能改造成本 | **是**：test-routing-advisor 维护成本 |
| mtime 防伪时序校验 | **高**（安全剧场风险） | 建议降级为纯记录，去掉 escalate 门 | **是**：是否保留 escalate 机制 |
| 3rd-review 双子代理拆分 | 低 | 保留（用户已批准 S9） | 否 |

**需人工决策的机制：2 项（mtime 防伪 + L2 冒烟外部技能成本）**
