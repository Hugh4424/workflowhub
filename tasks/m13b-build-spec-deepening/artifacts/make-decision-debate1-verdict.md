# Debate#1 裁决书（S5.4）

> task-id: m13b-build-spec-deepening ｜ 2026-06-30
> 模式：单人三档（CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 未设置 → 五方法庭降级）
> 裁决员 source_family: openai（codex gpt-5.5）｜ raw: `.omc/artifacts/ask/codex-debate-*.md`
> 触发原因：S5 盲审出现 blocking findings（B1/B2）+ direction_divergence=true

## 裁决：建议改（partial adopt）

甲方（Hugh 确认方向）主干成立，但须吸收乙方两条 blocking。

### 保留（甲方成立）
- blocking gate → 「记录事实 + 浮现 + 人确认推进，不阻断」=合宪，不推倒。
- 5 机制（异源审查/journal-evidence/spec-purity/7自检/摩擦即记）可作为 build-spec 质量事实来源。

### 修正（乙方坚持）
- **B1 让位「移植外壳」**：目标从「移植 agenthub 机制清单」改写为「build-spec 必须产出哪些质量事实」；机制只做候选实现，能少则少。
- **B2 成立**：5 框架外部调研与本 stage 无依赖，切出，不绑进 M13b 交付。

### 边界（明确不可越）
- 该让位：不能因「来自 agenthub」否定全部机制（B1 不可全盘照单）。
- 该坚持：不恢复任何阻断门；不把外部调研塞进最小交付。

## 待 Hugh S9 定夺的三行留痕（决定 Y / 理由 Z 待填）

```
反对 B1：「移植 agenthub 质保体系」框架是路径依赖、违立项初衷
决定 Y：<待 Hugh>
理由 Z：<待 Hugh>
```
```
反对 B2：5 框架外部调研捆绑进 build-spec 深化，违最小可交付
决定 Y：<待 Hugh>
理由 Z：<待 Hugh>
```
