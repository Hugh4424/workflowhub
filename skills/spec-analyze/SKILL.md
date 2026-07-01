---
kind: sub-skill  # helper sub-skill invoked within build-plan's stage; metrics covered by orchestrator per plan S4
name: spec-analyze
description: 跨产物一致性扫描——读取 spec/plan/tasks 三产物，识别不一致、重复、歧义、欠定义四类问题，产出只读分析报告。不阻断下游流程。改造自 speckit-analyze，适配 workflowhub 契约。
---

# spec-analyze

> 本文件改造自 speckit-analyze，适配为 workflowhub 契约：
> - 去 .specify/ 及 git 分支耦合，改用 task-id 参数推导产物路径；
> - 输出报告落盘到 `specs/{task-id}/cross-artifact-analysis.md`；
> - 保留核心分析能力：五类问题扫描（含宪法对齐标记）+ 五字段发现契约 + Severity 分类 + Metrics + Next Actions + 50 条发现上限；
> - 报告只读、不阻断下游推进。

## 输入

- **task-id**（必填，string 字面量）：任务 ID，用于推导产物路径 `specs/{task-id}/`。
  - **缺失时 fail-loud**：立即报错 "task-id required"，停止执行，不推测、不静默回退、不做分支推断。
- **spec.md**、**plan.md**、**tasks.md**：三产物必须全部存在于 `specs/{task-id}/` 目录下。
  - **任一缺失时 fail-loud**：报错 "<文件名> not found at specs/{task-id}/<文件名>"，停止执行。
  - 不依赖外部脚手架目录、不执行版本控制命令定位文件。

## 工作流程

### 1. 检查 task-id 参数

- 若 task-id 缺失或为空字符串 → 报错 "task-id required" 并停止（exit code 为非 0）。
- 不执行任何 git 操作，不调用外部脚本定位文件。

### 2. 检查三产物存在性

按 task-id 推导路径，逐一检查以下三个产物是否存在：

- `specs/{task-id}/spec.md`
- `specs/{task-id}/plan.md`
- `specs/{task-id}/tasks.md`

任一个不存在 → 报错 "<文件名> not found at specs/{task-id}/<文件名>"，停止执行（exit code 为非 0）。

### 3. 加载三产物

读取 `spec.md`、`plan.md`、`tasks.md` 全文，提取以下关键信息：

**从 spec.md**：
- 功能需求（FR）编号与描述
- 用户场景与用例
- 验收标准

**从 plan.md**：
- 实现步骤
- 文件清单
- 验收映射

**从 tasks.md**：
- 任务 ID 与描述
- FR 映射
- 依赖关系

### 4. 五类问题扫描

逐项扫描三产物，识别以下五类问题：

- **inconsistency（不一致）**：同一 FR 在不同产物中描述或引用不同。例如 spec.md 的 FR 在 tasks.md 中被不同地表述。
  子类型包括：术语漂移（同一概念在不同文件中名称不同）、跨文件实体不匹配、任务排序矛盾、冲突需求。
- **duplicate（重复）**：同一概念或任务在产物中重复出现。例如同一 FR 在 tasks.md 中多次出现。标记质量较差的措辞建议合并。
- **ambiguity（歧义）**：模糊表述，包括：含模糊形容词（fast/scalable/secure/robust 等缺可度量标准）、未解决的占位符（TODO/TKTK/???/`<placeholder>`）。
- **underdefined（欠定义）**：产物引用其他产物中不存在的项。例如 plan.md 引用了 spec.md 中不存在的 FR，或 tasks.md 漏掉了 spec.md 中的 FR。
  包括：需求有动词但缺宾语/可度量结果、用户故事缺验收标准对齐、任务引用 spec/plan 中未定义的文件或组件。
- **constitution-alignment（宪法对齐）**：**仅记录，不阻断**。检测 spec/plan/tasks 中与宪法 MUST 原则冲突或遗漏宪法规定的质量门/章节的问题。
  宪法冲突为自动 CRITICAL（记录维度），但**不阻断**下游推进——宪法检查由 orchestrator（build-plan）执行，本 skill 只标记发现。
  注意：本 skill 不加载外部宪法文件，宪法对齐检测基于 plan.md 自带的 Constitution Check 章节（21-clause）与 spec/tasks 内容的交叉检查。

### 4.1 Ambiguity items (FR-ANALYZE-001, FR-ANALYZE-002)

For every ambiguity finding, produce an entry in `stage-result.facts.ambiguity_items[]`:

```json
{
  "description": "<clear description of the ambiguity>",
  "escalation_path": "<human_confirm|next_iteration|acceptable_ambiguity>"
}
```

- `description` must be non-empty and describe the ambiguity in one or two sentences.
- `escalation_path` is optional but recommended. Allowed values:
  - `human_confirm` — needs human confirmation before proceeding
  - `next_iteration` — resolve in the next spec/build-plan iteration
  - `acceptable_ambiguity` — acknowledged as acceptable risk
- If `escalation_path` is missing, write a warning to the quality-contract but do **not** block downstream progress.
- `ambiguity_items[]` is appended to stage-result `facts` alongside `analysis_ref`.

### 5. 发现项记录（五字段契约）

对每一条**非摘要**发现，必须记录以下全部 5 个字段：

| 字段 | 说明 | 示例值 |
|------|------|--------|
| **type** | 问题类型枚举 | `inconsistency` / `duplicate` / `ambiguity` / `underdefined` |
| **source_artifact** | 问题所在的源产物文件名 | `spec.md`、`plan.md`、`tasks.md` |
| **target_artifact** | 受牵连的目标产物文件名 | 如不一致发现中 source=spec.md、target=tasks.md；无目标产物时写 `"N/A"` |
| **fr_or_task_id** | 涉及的 FR 编号或 task 行号标识 | 如 `FR-BP-001`、`task-3`；无法定位时写 `"unknown"` |
| **line_or_anchor** | 行号或稳定锚点 | 如 `spec.md:L244`、`plan.md 第三节"文件清单"`；无法定位时注明原因如 `"unable to locate: 全文件扫描发现"` |

**缺任一字段的发现视为无效**——该报告判为"未达标"（non-compliant）。必须明确指出缺失字段，并在报告末尾标注"报告未达标：发现项 xx 缺少字段 yy"。

### 6. Severity 分类（仅记录，不阻断）

为每条发现分配严重级别。以下为启发式规则：

- **CRITICAL**：违反宪法 MUST 原则、缺少核心产物、需求零覆盖（基线功能缺失）。记录严重级别，不阻断流程。
- **HIGH**：重复或冲突需求、安全/性能属性模糊、不可测试的验收标准。
- **MEDIUM**：术语漂移、非功能需求任务覆盖缺失、边界情况欠定义。
- **LOW**：风格/措辞改进、不影响执行顺序的轻微冗余。

### 7. 发现数量上限与溢出处理

- 最多 **50 条** 发现输出到报告正文的发现表中。
- 超出 50 条时，前 50 条按严重级别排序（CRITICAL > HIGH > MEDIUM > LOW）列出，其余在 **"溢出摘要"** 中聚合报告（如 "另有 12 条 LOW 级别发现，涉及术语漂移和轻微冗余，详见完整扫描日志"）。

### 8. 无问题时的处理

如果扫描后未发现任何一致性问题：

- 报告中只输出一行摘要：**"无一致性问题"**
- 不要求五字段（无具体发现项时不适用）

### 9. 报告写入

- 将分析报告写入 `specs/{task-id}/cross-artifact-analysis.md`
- 报告内容为 **只读**（read-only），仅记录不修改三产物
- 报告**不阻断**下游推进——不一致发现后写入报告，不阻止 build-plan v1 后续步骤

报告格式参考（含恢复的 speckit 质量维度：Severity、Coverage Summary、Metrics、Next Actions）：

```markdown
# 跨产物一致性分析报告

## 摘要

[概述发现的问题数量和类型分布，或 "无一致性问题"]

## 发现项

| # | type | severity | source_artifact | target_artifact | fr_or_task_id | line_or_anchor | 描述 |
|---|------|----------|-----------------|-----------------|---------------|----------------|------|
| 1 | underdefined | CRITICAL | spec.md | tasks.md | FR-BP-001 | spec.md:L204 | tasks.md 未覆盖 FR-BP-001 |

（最多 50 条。超出时追加溢出摘要。）

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| <!-- 需求键 --> | <!-- Yes/No --> | <!-- 关联任务ID --> | <!-- 备注 --> |

## Constitution Alignment Issues

<!-- 宪法对齐发现（如存在）。格式同发现表，类型为 constitution-alignment。
     仅为记录，不阻断推进。 -->

## Unmapped Tasks

<!-- 未映射到任何需求的孤立任务（如存在） -->

## Metrics

- Total Requirements: [N]
- Total Tasks: [N]
- Coverage % (requirements with >=1 task): [N]%
- Ambiguity Count: [N]
- Duplication Count: [N]
- Critical Issues Count: [N]

## Next Actions

<!-- 按严重级别给处置建议 -->
- **CRITICAL > 0**: 建议在实现前解决 CRITICAL 问题。
- **仅 LOW/MEDIUM**: 可继续推进，但提供改进建议。
- **具体建议**: [如 "运行 spec-specify 细化需求"、"手动编辑 tasks.md 补 'performance-metrics' 覆盖"]

## 溢出摘要

<!-- 超过 50 条时填写，聚合剩余发现的类型和级别分布 -->
```

### 10. facts.analysis_ref 与 ambiguity_items

报告写入后，在 stage-result 的 `facts` 字段中记录报告路径和歧义项：

```json
{
  "facts": {
    "analysis_ref": "specs/{task-id}/cross-artifact-analysis.md",
    "ambiguity_items": [
      {
        "description": "plan.md uses 'fast' without a measurable threshold",
        "escalation_path": "next_iteration"
      }
    ]
  }
}
```

- `analysis_ref` points to the cross-artifact analysis report.
- `ambiguity_items` lists every ambiguity finding with `description` and optional `escalation_path` (`human_confirm`, `next_iteration`, or `acceptable_ambiguity`).
- Missing `escalation_path` triggers a quality-contract warning only; it does **not** block downstream progress.

## 产出

- `specs/{task-id}/cross-artifact-analysis.md`：跨产物一致性分析报告（只读）

## 下一步

- 报告由 build-plan v1 流程读取并引用到 stage-result 的 `facts.analysis_ref`。
- 不一致发现不阻断 build-plan v1 后续步骤，由人工审查后决定处置方式。

## 通用原则

- **只读分析**：不修改任何产物文件。
- **不阻断**：报告仅记录问题，不阻止后续流程推进。
- **五字段完整性**：每条非摘要发现必须具备全部 5 个字段，缺失即报告未达标。
- **严重级别仅记录**：CRITICAL / HIGH / MEDIUM / LOW 分类仅标记发现严重程度，不据此阻断推进。
- **发现数量上限**：最多 50 条放入报告正文，超出部分聚合到溢出摘要。
- **宪法对齐仅标记**：本 skill 检测 spec/plan/tasks 与宪法原则的冲突并标记为 constitution-alignment 发现（级别 CRITICAL），但这是记录维度标记——不阻断下游推进。宪法符合性正式检查由 orchestrator（build-plan）执行。
- **零问题产出有效摘要**：无问题时不强制要求发现项，只输出"无一致性问题" + 指标摘要。
- **fail-loud**：task-id 缺失、产物缺失均立即报错并停止，不静默回退。

## task_dir 解析器接入（AC-16）

读写任务跟踪文件前调用 `core/task-dir-parser.mjs` 取得路径，不得硬编码。

```javascript
// AC-16 consumable call — grep: parseTaskDir
import { parseTaskDir } from "../../core/task-dir-parser.mjs";

const taskDir = parseTaskDir(); // reads config/workflowhub.yaml task_dir, falls back to ~/Knowledge/workflowhub/
```

- `parseTaskDir()` has no third-party dependencies (FR-TASKDIR-001).
- The returned value is a string path (configured value or `~/Knowledge/workflowhub/`).
- Parse failures are fail-loud and must not be swallowed.

## 去耦约束

本 skill 已从 speckit-analyze 解耦，硬性约束如下：
- **不执行版本控制命令**：不执行任何版本控制操作或调用外部定位脚本。
- **不读项目脚手架目录**：不从目标项目脚手架目录读取任何文件（模板、脚本、配置）。
- **不参考外部宪章文件**：speckit-analyze 原版依赖外部 memory/constitution.md，本改造版已移除该依赖——宪法符合性检查由 build-plan v1 流程单独执行。
- **不做分支推断**：产物路径完全由 task-id 推导，不做分支回退或自动探测兼容层。
