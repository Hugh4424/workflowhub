# 配对审查只保留在方向审查

## Status

accepted（2026-10-14，make-decision 阶段，任务 `skills-framework-redesign-20261014`）

审查时的 red/blue 配对（同一材料、同一批 provider 跑两遍，只差提示词里一句角色焦点）
**只保留在 `make-decision` 的方向审查**。细节审查与 build-plan 审查**取消配对**，
每个 provider 各跑一次；build-code 与 verify-code 使用 OCR，本就没有配对之分。

## Considered Options

- **全部审查面都保留配对**（当时的现状）：实测占**调用数份额 54.5%**、token **×2**，
  但**墙钟增量 ≈ 0**（red/blue 发起间隔仅 5–28 ms，`wall ≈ max(duration)`）。
  **找不到任何一手来源**支持"同材料同批模型跑两遍只差角色提示"；
  Anthropic 自家表态反向（"a single LLM call with a single prompt was the most consistent"），
  且其自家 code-review 产品按**问题类别**分工 + 一个验证步，不是角色对立。
  实测 red 9 条 / blue 9 条**交集为 0**，也没有 ground truth 能证明谁更好。
- **全部取消配对**：省得最多，但方向错误的下游代价最高，冗余在这个面上最有价值。
- **改按模型家族计数而不动配对**：多样性确实来自模型家族（异质 61.3% vs 同模型采样 56.7%，
  仅 +4.6pt），但角色/人格是噪声（162 角色 × 4 家族 × 2410 题，无提升，性别项 p=0.561）。

## 三项判据

1. **难以反转**：真——它**推翻**了原有非目标"不改动 red/blue 配对"，
   并在不同审查面之间建立了不对称规则。
2. **无背景会意外**：真——读者会问"为什么只有方向审查跑两遍，其他审查不跑"。
3. **存在真实取舍**：真——在"全部省下来"与"关键面上保留冗余"之间选了后者，
   代价是**成本目标存在天花板**（那 54.5% 的调用只在方向审查保留）。

## Consequences

- `make-decision` 的方向审查保留配对；**细节审查与 build-plan 审查每 provider 一次**。
- **异源判定应改按模型家族**（现按 `adapter` + `source_id` 计数，数错了维度）；
  改按 `identity.model` 的决定**早已存在于归档**
  （`specs/archive/workflowhub-mechanism-simplification-t2-20260911/spec.md:141` 的 FR-C4-006），
  只是从未落到代码 → 本次是**补执行**，不是新决定。
- **成本目标的分母必须写明**：排除宿主全局注入面，并写明配对只在方向审查保留所造成的天花板。
- 依据：用户 2026-10-14 的裁决（逐字见 `requirement-change-log.md#U-012`）；
  记录者按事实补充的内在逻辑是**方向错误的下游代价最高，冗余在这个面上最值**。
