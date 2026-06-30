# M13 make-decision — env-var design

## 调研摘要

### 现有 workflowhub env-var 惯例

- `config/workflowhub.yaml` 是唯一全局配置来源，纯静态注册表，不读 env。
- `scripts/run-checks.mjs` 唯一使用 env 的核心脚本：`RUN_CHECKS_FORCE_FAIL_CHECKER`（测试注入用，非业务 env）。
- `workflows/build-code/diff-scanner.mjs` 注释提到 `process.env.NODE_ENV` 仅作反例，不实际读取。
- 结论：**workflowhub 目前无业务 env-var 惯例**，env 只用于测试注入。所有业务路由靠 `config/workflowhub.yaml` 注册表 + SKILL.md 剧本。

### debate 外部 skill env 需求

来源：`/Users/Hugh/Hugh/Project/debate/SKILL.md` + `README.zh-CN.md`

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`：启用五方法庭对抗模式。**不设置时自动降级为单人三档模式**，非阻断。
- debate 自身无其它必需 env；降级路径完整，环境不具备时不报错。

### 3rd-review skill env 需求

来源：`/Users/Hugh/Hugh/Project/3rd-review/standalone.sh` + specs

- `THIRD_REVIEW_RUNNER`：注入自定义 reviewer runner 命令（可选，默认 `run-heterologous-review.mjs`）。
- `REVIEW_DISPATCH_CONFIG`（即将替换 `AGENTHUB_REVIEW_DISPATCH_CONFIG`）：自定义 dispatch 配置路径（可选，默认 `~/.config/3rd-review/review-dispatch-config.json`）。
- 两者均可选，有安全默认值，不影响降级路径。

### 其它动作 env 需求

- **clarify-lite**：纯 inline 问答，无外部依赖，不需要 env。
- **dual-path research**：异构双路调研，runner 选择可复用 `THIRD_REVIEW_RUNNER` 约定（若调用 omc ask），无独立 env 需求。
- **talk-with-zhipeng**：inline 单问题对话，无外部依赖，不需要 env。
- **grill**：grill-with-docs-lite shell，无外部后端选择需求，不需要 env。

---

## env-var 设计方案

### 设计原则

1. **可选 + 安全默认**：所有 env 均可选，缺失时走降级路径，不阻断（D5）。
2. **不引入新惯例**：尽量复用上游 skill 已有 env（debate、3rd-review），不在 workflowhub 层重复包装。
3. **不硬编码密钥**：API key 由运行时环境（Claude Code / Multica）注入，make-decision 层不感知。
4. **透传而非封装**：workflowhub make-decision SKILL.md 只需在调用外部 skill 前检查对应 env，不自定义新 env 名。

---

## env-var 清单

| 变量名 | 用途 | 默认值 | 消费方 | 必需？ |
|--------|------|--------|--------|--------|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | 启用 debate 五方法庭对抗模式；未设置自动降级单人三档 | 未设置（降级） | debate action | 否 |
| `THIRD_REVIEW_RUNNER` | 覆盖 3rd-review 盲审 runner 命令（默认 run-heterologous-review.mjs） | 空（用默认 runner） | blind-review action | 否 |
| `REVIEW_DISPATCH_CONFIG` | 覆盖 3rd-review dispatch 配置文件路径 | `~/.config/3rd-review/review-dispatch-config.json` | blind-review action | 否 |
| `MAKE_DECISION_DEBATE_PATH` | 覆盖 debate skill 根路径（默认 `/Users/Hugh/Hugh/Project/debate`） | `/Users/Hugh/Hugh/Project/debate` | debate action | 否 |
| `MAKE_DECISION_SKIP_DEBATE` | 设为 `1` 强制跳过 debate（覆盖自动检测，快速测试用） | 未设置（按检测走） | debate action | 否 |
| `MAKE_DECISION_SKIP_BLIND_REVIEW` | 设为 `1` 跳过盲审（非阻断标志，调试 / 离线环境用） | 未设置（正常执行） | blind-review action | 否 |

---

## 动作 → env 对应关系

```
clarify-lite          → 无 env 依赖
dual-path research    → 无独立 env（复用运行时 API 凭据）
blind-review          → THIRD_REVIEW_RUNNER, REVIEW_DISPATCH_CONFIG, MAKE_DECISION_SKIP_BLIND_REVIEW
talk-with-zhipeng     → 无 env 依赖
grill                 → 无 env 依赖
debate                → CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS, MAKE_DECISION_DEBATE_PATH, MAKE_DECISION_SKIP_DEBATE
```

---

## 降级行为说明

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 未设置 → debate 降级单人三档，输出裁决书.md，不报错。
- `THIRD_REVIEW_RUNNER` 未设置 → 3rd-review 用内置 `run-heterologous-review.mjs`，R6 降级走 clean sub-agent。
- `MAKE_DECISION_DEBATE_PATH` 路径不存在 → debate action 记录 skip 原因到 decision-log，继续后续步骤。
- `MAKE_DECISION_SKIP_*` 系列 → 记录跳过原因，不阻断，不报错。

---

## 实现建议

1. SKILL.md 在 debate action 入口加一行检测：`if $MAKE_DECISION_DEBATE_PATH 不可达 || $MAKE_DECISION_SKIP_DEBATE=1 → skip + log`。
2. blind-review action 入口：`if $MAKE_DECISION_SKIP_BLIND_REVIEW=1 → skip + log`；否则透传 `THIRD_REVIEW_RUNNER` / `REVIEW_DISPATCH_CONFIG` 给 standalone.sh。
3. 不在 `config/workflowhub.yaml` 中注册 env-var（保持注册表为纯组件路由表）。
4. 所有 env 检测结果写入 decision-log 的"执行环境"字段，供复盘溯源。
