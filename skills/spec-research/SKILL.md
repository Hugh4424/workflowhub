# spec-research — Phase 0 Research Skill

## 概述

Phase 0 Research Skill。对应 **FR-RESEARCH-001**：新建 `skills/spec-research/SKILL.md`，接受 `task-id` 和功能描述文本为输入，产出 `specs/{task-id}/research.md`。

为后续 build-spec / build-plan 阶段提供背景研究依据。

---

## 输入

| 字段              | 类型   | 说明                        |
|-----------------|------|-----------------------------|
| `task_id`       | string | 任务唯一标识，如 `m13c-build-plan-deepening` |
| `feature_desc`  | string | 功能描述（自然语言）          |

---

## 输出

- 文件路径：`specs/{task_id}/research.md`
- 内容：功能背景、相关技术调研、已有实现参考、风险点摘要

---

## 语义规则

### FR-RESEARCH-002 fail-loud + non-blocking

- **fail-loud**：执行过程中发现问题必须明确报错，不静默吞掉。
- **non-blocking**：Research 阶段失败不阻断整个 pipeline 继续推进，但
  **non-blocking ≠ 跳过**：
  - 若 `specs/{task_id}/research.md` 缺失，必须先暂停并人工升级，不得自动跳过进入下一阶段。
  - 人工确认「接受缺失 research 的风险」后，方可继续。

### FR-RESEARCH-003 跳过选项

调用方可传入 `skip_research: true` 跳过本阶段：

```yaml
# 调用示例
task_id: my-feature
feature_desc: "新增用户登录流程"
skip_research: true   # FR-RESEARCH-003: 明确声明跳过，需附原因
skip_reason: "已有同类 research，复用 specs/auth-v2/research.md"
```

跳过时 Skill 记录 `skip_reason`，不产出 `research.md`，后续阶段消费者须自行处理缺失。

---

## task_dir 解析器接入（AC-16）

Research 阶段产出写入 `specs/{task_id}/research.md`，路径基准由 `task_dir` 字段决定。
`task_dir` 通过以下解析器读取（AC-16 grep anchor: parseTaskDir）：

```javascript
// AC-16 consumable call — grep: parseTaskDir
import { parseTaskDir } from "../../core/task-dir-parser.mjs";

const taskDir = parseTaskDir(); // 读 config/workflowhub.yaml 的 task_dir 字段
                                 // 缺失时回退 ~/Knowledge/workflowhub/（FR-TASKDIR-001）
```

- `parseTaskDir()` 无第三方依赖（FR-TASKDIR-001）。
- 返回值为字符串路径（已配置值 或 `~/Knowledge/workflowhub/`）。
- 解析失败时 fail-loud 抛出，不静默。

---

## 执行流程

```
输入 (task_id, feature_desc)
  ↓
[FR-RESEARCH-003] skip_research=true? → 记录 skip_reason → 结束
  ↓
调用 parseTaskDir() 获取 task_dir (AC-16)
  ↓
生成 specs/{task_id}/research.md
  ↓
[FR-RESEARCH-002] 成功 → 产出文件
                  失败 → fail-loud 报错，暂停等待人工处理
```

---

## 产出格式（research.md 骨架）

```markdown
# Research: {feature_desc}

## 背景
...

## 相关技术 / 已有实现
...

## 风险点
...

## 结论 / 建议
...
```
