# Decision Log — M13a 护城河能力内置化补交付

> task_id: m13a-moat-skills · stage: make-decision · skill v2.0.0
> 决策日期: 2026-06-30 · 用户确认: A（talk#2）· 异源盲审: codex trueCrossEngine, direction_divergence=false

## 1. 原始需求

M13 深化了 `workflows/make-decision/SKILL.md`（583 行），但护城河动作（talk/grill/异源审查）只内联进主 skill 或当外部依赖，未做成独立 in-repo skill 文件，且测试只断言单文件文本造成假绿。M13a 补齐护城河能力的 in-repo 内置化。

## 2. 问题与目标

把护城河能力做成可被 make-decision 真实调用的 in-repo skill，并让测试能断言关键契约，杜绝 M13 的假绿（skill 不存在/不被引用却测试通过）。

## 3. 决策（D1–D6）

- **D1 护城河 skill 数量 6→3**：
  - `skills/talk-with-zhipeng/`：搬 `multica-agenthub/packages/core/agenthub/skills/talk-with-zhipeng/`（已实现按影响排序，不自研）；adapter 层路径改 workflowhub；删 office-hours 的 gbrain context 查询。
  - `skills/grill-with-docs/`：搬 `~/.claude/skills/grill-with-docs/` 原版（不做 lite），含 CONTEXT-FORMAT.md / ADR-FORMAT.md。
  - `skills/intake-decision-review/`：三角度审查 = **一个 skill、拼装内容、调一次 3rd-review**，返回方向/框架/范围三条建议，不审三次。取消原 4 个独立 intake-* + orchestrator，取消 grill-with-docs-lite。
- **D2 引用切换**：make-decision S5 引用 `skills/intake-decision-review/`、S7 引用 `skills/grill-with-docs/`、talk 各轮引用 `skills/talk-with-zhipeng/`。不切则 skill 是死文件——必须同批切。
- **D3 intake-decision-review 契约（含异源 F1 收紧）**：单次拼装调用，输出**恰好 3 条 findings，每条标注 direction / framing / scope 之一且三类全覆盖**；`fallback_used:true` → 停止报错不静默降级；缺某类或不足 3 条 → 重跑。
- **D4 测试契约**：断言关键字段——3-findings 三角度结构契约、talk-with-zhipeng 按影响排序声明、make-decision S5/S7/talk 引用指向 in-repo 路径（grep 可断言），不止文件存在。
- **D5 TASK_TRACKING_ROOT env**：照 build-spec/SKILL.md 模式加入 env 表，S10 落盘读取。
- **D6 大白话改写**：S2/S4/S9 用户交互改成高中生能懂，每选项给推荐 + 后果。

## 4. 假设

- agenthub talk-with-zhipeng 的 core 层可直接搬，仅 adapter 层路径需重写（异源 F2：搬入须系统断言移除宿主依赖 multica-agenthub/~/.claude/gbrain，无隐性耦合残留）。
- grill-with-docs 全目录可搬（异源 F3：验收须检查 CONTEXT-FORMAT.md/ADR-FORMAT.md 引用完整、无本机绝对路径残留）。

## 5. 明确不做

- **make-decision 583 行拆分重构**：本轮不做，另起 milestone。理由：split-plan 自身 Codex 异源审查结论"现在别全拆"——拆完增隐式跨 skill 契约（debate 门控 finding_id、盲审→debate 字段、stage-result 唯一性）易出假绿，应先修 7 个历史 bug + 写 schema 契约再小步拆。
- debate skill 保持外部（`/Users/Hugh/Hugh/Project/debate`），不转 in-repo。

## 6. 开放问题

无阻断性开放问题。异源 F1（blocking）已于 D3 收紧解决，F2/F3（non-blocking）已折入 D4 验收。

## 7. 验收标准

- 3 个 skill 文件存在、frontmatter 合规、无本机绝对路径/宿主依赖残留。
- make-decision S5/S7/talk 引用指向 in-repo 路径，测试可 grep 断言。
- intake-decision-review 单次调用产出恰好 3 条、三角度全覆盖；失败语义可测。
- reuse-registry 新增 3 行（去 ghost 绝对路径）。
- 全量 npm test green。

---

## Blocking 留痕（异源盲审 F1-direction）

反对 X：异源审查 F1 — intake-decision-review 契约只约束数量（恰好 3 条），未约束三角度结构与失败行为。
决定 Y：契约升级为"恰好 3 条且每条标注 direction/framing/scope 之一、三类全覆盖；fallback_used→停止不降级；缺类/不足 3 条→重跑"（见 D3）。
理由 Z：缺结构约束会让单次调用退化成 3 条同质 findings，失去三角度价值；无失败语义会假绿。

## 执行环境

- 异源盲审引擎：codex（trueCrossEngine=true，via omc-ask advisor）
- direction_divergence: false
- 审查产物：tasks/m13a-moat-skills/artifacts/make-decision-review.md
- 用户最终确认：talk#2 选项 A（仅护城河搬运，拆分另起一轮）
