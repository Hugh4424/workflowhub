# 需求检查清单 — wh-review-rebuild

> 来源：`specs/wh-review-rebuild/spec.md`
> 生成阶段：spec-specify
> 生成日期：2026-07-05

---

## 文档质量

- [x] 无实现细节泄露（无编程语言、框架、API 名称）
  — 接口描述用 `{mode, contract, materials}` 等业务口径，无具体框架
- [x] 聚焦用户价值与业务需求
  — 每条 FR 均描述用户/系统可感知的能力，不描述内部实现
- [x] 非技术干系人可读
  — 速读卡、问题陈述、UC 场景均用自然语言
- [x] 所有必填章节已完成
  — 速读卡 / FR / 不做 / 验收 / 影响范围 五章均存在

---

## 需求完整性

- [x] 所有 [NEEDS CLARIFICATION] 标记已解决
  — spec 初稿无 [NEEDS CLARIFICATION] 残留（决策日志均已定案）
- [x] 所有功能需求可测试、无歧义
  — 每条 FR 含 Given/When/Then + AC，可机器或手动验证
- [x] 成功标准可度量
  — AC 均含可判真伪的判据（grep 可检验 / 文件路径可查 / 字段非空等）
- [x] 成功标准不含实现细节
  — AC 描述行为结果，不指定技术栈
- [x] 所有验收场景已定义
  — AC-D1 至 AC-D10 及各 FR 的 AC 条目覆盖所有核心场景
- [x] 边界情况已标识
  — stage 标识缺失、合同文件缺失、连续 blocking、unknown stage 均在 FR 中标注 fail-loud
- [x] 范围已明确界定
  — §2 边界节包含 In-scope / Out-of-scope 各多条
- [x] 依赖和假设已记录
  — Known Gaps 段记录 3 条；隐性必达 3 条；OPEN-1 不阻断问题

---

## 功能就绪

- [x] 每条功能需求有明确验收标准
  — FR-WHREVIEW-001/002/003/004, FR-THIRDREVIEW-001/002, FR-STAGE-001, FR-D2-001, FR-INTAKE-001, FR-TESTACCEPTANCE-001, FR-TEST-001 共 11 条 FR，各有 AC
- [x] 用户场景覆盖主要流程
  — UC-1（触发）/ UC-2（降级）/ UC-3（升级人工）/ UC-4（D2 确认门）/ UC-5（合同路由）/ UC-6（纯引擎）/ UC-7（报告渲染）共 7 个场景
- [x] 功能满足成功标准中定义的可度量目标
  — 每条 AC 均与对应 FR 直接对应，无悬空验收条目
- [x] 无实现细节泄漏进规格书
  — 合同查找、降级逻辑、报告渲染均用功能行为描述，不指定具体函数名或算法

---

## FR 完整性列表

| FR-ID | 标题 | AC 数 | 状态 |
|---|---|---|---|
| FR-WHREVIEW-001 | wh-review 技能创建 | 3 | 完整 |
| FR-WHREVIEW-002 | stage→合同映射（5 套） | 3 | 完整 |
| FR-WHREVIEW-003 | 审查降级机制 | 3 | 完整 |
| FR-WHREVIEW-004 | 裁决枚举与报告渲染 | 3 | 完整 |
| FR-THIRDREVIEW-001 | 3rd-review 精简为纯引擎 | 3 | 完整 |
| FR-THIRDREVIEW-002 | §7 改写 | 3 | 完整 |
| FR-STAGE-001 | 5 个 stage 收尾统一 | 2 | 完整 |
| FR-D2-001 | D2 人工确认门 | 2 | 完整 |
| FR-INTAKE-001 | intake 合同覆盖 C1-C6 | 2 | 完整 |
| FR-TESTACCEPTANCE-001 | test-acceptance 合同覆盖 F1-F6 | 2 | 完整 |
| FR-TEST-001 | 端到端测试方案 | 2 | 完整 |

---

## decision-log KEEP 决策覆盖验证（FR-ALIGN-001）

| 决策 | 对应 FR | 覆盖 |
|---|---|---|
| D1 两层架构（wh-review + 3rd-review 纯引擎） | FR-WHREVIEW-001, FR-THIRDREVIEW-001 | [x] |
| D2 仅 build-spec/build-code 自动推进 | FR-D2-001 | [x] |
| D3 stage→合同映射 5 条 | FR-WHREVIEW-002 | [x] |
| D4 intake C1-C6 判据 | FR-INTAKE-001 | [x] |
| D5 verify-code F1-F6 新鲜性判据 | FR-TESTACCEPTANCE-001 | [x] |
| D6 5 stage 统一收尾模板 | FR-STAGE-001 | [x] |
| D7 端到端测试方案 | FR-TEST-001 | [x] |
| §7 改写规则（numbered step / if/else 机器可检验） | FR-THIRDREVIEW-002 | [x] |
| 降级机制（3轮降级规则、升级人工触发） | FR-WHREVIEW-003 | [x] |
| 报告渲染（render-review-report.mjs，6章结构） | FR-WHREVIEW-004 | [x] |

**覆盖率**：10/10 KEEP 决策全部有对应 FR，无遗漏。

---

## 未解问题登记

| 编号 | 描述 | 阻断? | 跟进阶段 |
|---|---|---|---|
| OPEN-1 | 3rd-review standalone.sh 调用参数与 SKILL.md 文档不一致 | 否 | build-plan（创建 tracking issue） |
| GAP-1 | 5 套合同从 agenthub 搬迁后适配点未确定 | 否 | build-plan |
| GAP-2 | render-review-report.mjs 6 章结构名称未明确 | 否 | build-plan（核实 agenthub 原实现） |
| GAP-3 | docs/human-brief-template.md 是否存在未确认 | 否 | build-plan（前置依赖核查） |
