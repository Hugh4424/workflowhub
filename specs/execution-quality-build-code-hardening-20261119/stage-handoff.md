# Stage Handoff：make-decision → build-plan

- 日期：2026-11-19
- 任务：修复 workflowhub 开发任务质量差、build-code 浪费、上一轮方案未落地
- 工作树：`/Users/Hugh/Hugh/Project/workflowhub-execution-quality-build-code-hardening-20261119`
- 分支：`task/workflowhub/execution-quality-build-code-hardening-20261119`
- 基线：`ad708bff948109f41aab1dd65a179e41d03205e1`
- 当前阶段：make-decision 已做最终确认（含具名缺口）；build-plan 未开始
- 当前日志：`decision-log.md`，880 行，sha256 `0a0eb724…a60b9`

## 当前状态（2026-11-20，build-plan 审查后）

- build-plan 已产出 `spec.md` + 10 个 Phase；审查报告 010，修复与根因 011。
- 已修：AC 27 条；P3 manifest/静态依赖；P5 就绪门；P7 八变量；AC-P8-002 降为 fixture 级；P10 依赖 P1..P9；每 Phase 配套四项；来源绑定；decision-log 回填 5.0.1。
- 已验证：`run-checks --material-root … --stage=build-plan` exit 0；`build-skill-manifests --check` exit 0；P5 `build-code-readiness` 9/9；相邻 stage-runtime 14/14；decision-log chain 0 warning；baseline exit 0。
- 四条 RED：P1/P9/P10 是真实目标 RED；P4 是装置失败（`prepare-test-data.mjs` 不存在）。
- 未做：P4 fixture；P1/P9/P10 实现；41 条既有全量失败逐条复核；AC-P10-008；Antigravity 官方三路复跑；工作树提交。
- 下一步：build-code 首段补 P4 fixture，并实现 P1 当前回执、P9 `check-replay`、P10 baseline 标题块解析；同一 gate 命令转绿后再继续。

## 1. 这轮做完了什么

### 1.1 decision-log 重写

- 旧版归档：`quality/evidence/archive/decision-log/2026-11-19-decision-log-v1-original.md`。
- 当前日志按“一个事实只出现一次”重写：入口、需求与确认、包目录、每包设计、跨包共享、证据索引。
- 10 包、每包十项：原始需求、最初方案、发散与被否、调研、最终决定、完整方案、配套与影响、验收、风险/回退、未决/消费者/证据。
- 每包“配套与影响”固定四项：配套调整、配套迁移、配套移除、影响范围。
- 加 AC 总表 22 条、G-01..G-30 逐项表、U-001..U-022 答复表、D-001..D-010 决定索引。
- 用户逐包确认：U-021「全部确认，这些包我都早就确认过了」；需求 11–14 转写：U-022「认可转写」。

### 1.2 模板与技能

- 新模板：`skills/decision-log/templates/decision-log-template-v2.md`；旧模板保留在 `templates/archive/decision-log-template-v1.md`。
- `skills/decision-maker/SKILL.md`：三角色（调研/设计/审查）、八步、十一格卡、冷读六问、对抗九问、并行、质量门、失败处理。
- 模板：`skills/decision-maker/templates/`（上下文包、卡、冷读、对抗）。
- 脚本：`validate-card.mjs`、`dispatch.mjs`、`status.mjs`；`validate-card` 在卡模板上 exit 0。
- `skills/catalog.yaml` 已登记 decision-maker；一致性检查 exit 0。
- `make-decision` 和 `decision-log` 技能已指向 v2；旧日志仍读旧模板。

### 1.3 配套对齐

- `skills/material-writing/SKILL.md`：增加“每包十项是记录节”的例外，不压设计历程。
- `workflows/make-decision/SKILL.md`：方向 alternatives 必须含“最初方案＋谁否＋为什么”；细节审查逐包核十项。
- `skills/wh-review/scripts/review-materials.mjs`、`workflows/build-plan/SKILL.md`、`skills/spec-plan/scripts/build-decision-baseline.mjs`：审查输入和 baseline 支持十项/配套。
- 测试：`review-decision-baseline`、`review-materials-contract` 的改动通过；`align-impl` 报告 91 passed。

### 1.4 Antigravity 真因与修复

- 真因不是 `agy`，也不是包装器：
  - 3rd-review 配置用 `/Users/Hugh/.local/bin/agy`，单独调用正常；
  - 旧 prompt 让模型先读 packet 根目录；实际文件在 `bundle/`；pre-tool hook 只允许精确 `bundle/` 文件；
  - 模型读根目录/跑 `ls` 被 hook 拒，最终 `status: ERROR`；适配器把非 SUCCESS 报成 `PROVIDER_HEALTH_FAILED`。
- 修复：
  - prompt 改成“先读 `bundle/review-instructions.md` 和 `bundle/manifest.json`；不存在再读根目录；不要跑 shell/列目录”；
  - 适配器保留第一条 hook 拒绝为 `diagnostic`；
  - 加 bundle prompt 测试和 hook 诊断测试。
- 验证：用同一 packet 直接跑 `agy`，**0 次 hook 拒绝，`status: SUCCESS`，正常产出 findings**；定向测试通过。
- 未验证：官方 `wh-review` 三路完整复跑尚未做；build-plan 前应跑一次。

## 2. 验证状态

已通过：
- `node tools/cli/check-decision-log-chain.mjs --file …/decision-log.md` → exit 0，**0 warning**。
- `node skills/spec-plan/scripts/build-decision-baseline.mjs --decision-log …/decision-log.md` → exit 0，604 行。
- `validate-card` 在卡模板 → exit 0；catalog 一致性 → exit 0。
- Antigravity 直接复跑 → 0 拒绝、SUCCESS。
- 定向测试：bundle prompt、hook 诊断、baseline/review 合同 → 通过。

未通过/未验证：
- 全量 vitest 仍有 41 条与 stage 注册相关的既有失败（`unknown review stage verify-code/build-spec`），不是这次 prompt 改动；不要把它们当本次回归，也不要宣称全绿。
- 880 行版本的独立 detail review / spec-analyze **没有重跑**；之前 006/007/008/009 的结论对应旧版本。
- `wh-review` 三路完整复跑未做。

## 3. 具名缺口（不能当已解决）

1. **逐包确认**：U-021 已明确全部确认；但包 4 机器/人判分界、包 6 是否必须截图、包 8 迁移/备份 N/水位、包 9 最终签字人仍是未决。
2. **需求 8/11–14 独立原件**：未取得；U-022 认可日志转写，缺口记 owner/时点。
3. **A/B/C 对账**：只设计，未实施；build-code 落方法文本/链检查/测试。
4. **31 条 major / 47 条 needs_human**：已进全局未决和 G 表，但没有逐条独立复验；build-plan 前逐条给 owner。
5. **T6/T16 原件已失**：只能用 fixture 回放，环境不符记“不可比”。
6. **跨项目命令**（建库/迁移/对账）不在本仓：具名缺口，不在本任务执行。
7. **工作树未提交**：16 个改动/新增，含 skills/runtime/decision-log；build-plan 前先决定提交范围。
8. **Antigravity 官方三路未复跑**：直接 `agy` 成功，不等于 `wh-review` 全链成功。

## 4. 下一步

1. **build-plan**：读 `decision-log.md`、`requirement-index.md`；按 10 包十项写 spec/phases；A/B/C 只做设计引用，实施留 build-code。
2. **build-code**：
   - 落 A/B/C 方法文本、链检查、测试；
   - 补 decision-maker 的脚本验收和真实包试跑；
   - 实现 P1–P10；
   - 跑一次官方 `wh-review` 三路，确认 antigravity 修复在真实路径生效。
3. **独立复验**：对 880 行版本重跑 detail review 和 spec-analyze；通过后再 stage-close。
4. **stage-close**：归档、两条推送、handoff 文档图/close 代码图、最终签收。

## 5. 关键路径

- 当前日志：`specs/execution-quality-build-code-hardening-20261119/decision-log.md`
- 需求索引：任务库 `quality/evidence/decision-log-refs/requirement-index.md`
- 覆盖矩阵：任务库 `quality/evidence/decision-log-refs/coverage-matrix-5d.md`
- 新模板：`skills/decision-log/templates/decision-log-template-v2.md`
- decision-maker：`skills/decision-maker/SKILL.md`
- 细节审查 v2：任务库 `quality/reviews/2026-11-19-008-make-decision-detail-v2.json`
- spec-analyze v2：任务库 `quality/reviews/2026-11-19-009-spec-analyze-v2.md`
- 旧日志：任务库 `quality/evidence/archive/decision-log/`
- Antigravity 原始 stdout：`/tmp/3rd-review/564963a7-…/raw/antigravity%2Fhydrogen/round-*.stdout`（临时目录，24h）

## 6. 不要重复做的事

- 不要再用旧模板 `decision-log-template.md` 写新日志；新日志用 v2。
- 不要把 U-021 的整体确认当成“每包细节都无未决”；具体未决仍按第 5 节处理。
- 不要用旧 006/007 的“已修”记录替代 880 行版本的复验。
- 不要把 antigravity 的 `PROVIDER_HEALTH_FAILED` 当 provider 病；先看 hook 拒绝和 packet 路径。
- 不要在没有跑官方三路的情况下写“三路完成”。
