# Findings & Decisions

## Known Material Identity
- `specs/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md`
  - 1801 行
  - sha256: `22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3`
  - F1 frozen：build-plan 不得改写。
- `specs/workflowhub-cost-baseline-and-blocker-close-20260917/spec.md`
  - 1121 行
  - sha256: `f5ac146e809a855b4d35b42ad865591f8ad1b32b8b1610868b98382fb5210e52`
  - 38 FR / 38 AC / 20 PFACT / 12 SCN。

## Build-plan Inputs and Constraints
- make-decision 与 build-spec 已收口；build-spec runtime `quality_status=completed`、`quality_missing=[]`。
- D4：`runtime/stage/stage-runner.mjs` 读侧对称，复用执行记录/非材料变化豁免；必须同步更新 `tests/contract/human-confirmation-v3.test.mjs` 的旧断言并注明用户授权。不得豁免 `decision-log.md` 的实质变化。
- DEF-09 当前仍未闭合：`tests/e2e/ui-e2e-contract-dogfood.test.mjs:223` 仍有 `schema_version:"quality-verify.v1"` 残留；只能在后续 build-code 实施，本阶段仅写入 plan/tasks。
- 3rd-review 授权范围共 6 文件：
  1. `lib/adapters/antigravity.mjs`
  2. `lib/provider-failure.mjs`
  3. `lib/recovery-policy.mjs`
  4. `lib/broker.mjs`
  5. `lib/workflowhub-result-v3.mjs`
  6. `test/managed-session-lifecycle.test.mjs`
- 3rd-review 边界：不改两个 config，不减少 provider 派发；测试文件为用户明确新增授权。
- 跨仓实现顺序必须显式规划：先 3rd-review 根因修复与守卫测试，再主仓消费者、事实绑定、预检/格式/清理。
- 正式 `stage_end_spec_analyze` 事实保持 missing（退役生产者）；不得伪造通过。
- HEAD 两个既有红灯归 FR-CLEANUP-004 的后续实现范围。

## Non-goals for This Initialization
- 不读取大量材料。
- 不改 `specs/**`、代码、配置、3rd-review 或 archive。
- 不进入 build-code，不执行任何实现或测试。
- 不覆盖根部 `task_plan.md`、`findings.md`、`progress.md`。

## Background Audit Agents
| Audit | Purpose | Agent ID | Status |
|-------|---------|----------|--------|
| Audit A | build-plan 契约与 13 步覆盖审计 | `08dcbf16-1d8d-4299-8e06-96c0330d296b` | running |
| Audit B | FR/AC → plan/tasks 双向追溯与跨仓边界审计 | `c6f3e82c-8c07-4ec9-aade-abc09bd1cbed` | running |

## Protocol Audit — Agent 08dcbf16
- 当前 build-plan 从 step 1 开始；stage begin 为 `work_status=ready`、`quality_status=in_progress`，缺 fr/ac coverage、dependencies、deletion proofs、executable tasks、human confirmation。
- 标准 13 步：read-current-materials → conditional-spec-research → testing-system-blueprint → spec-plan → simplicity-guard → plan-eng-review → test-routing-advisor → spec-tasks → review-plan → main-agent-disposes-findings → final-spec-analyze → publish-plan-result → stage-reflection。
- Step 2 因跨仓、38 FR 和六个 3rd-review 文件应执行 targeted anchor/consumer/signature/test-command research，不跳过。
- Step 4/8 通过 `run --action=draft --stage=build-plan --name=plan.md|tasks.md` 写入；只允许 plan/tasks。
- Step 9 只做一次真实 independent wh-review；普通修复后不为追空 findings 重审。
- Step 12 是唯一正常用户确认点；必须在全部 authored 修复与 final analyze 后。用户确认后不得再改 plan/tasks。
- Step 13 必须 `run --action=reflect`；reflection 非阻断但不可跳。
- 必跑定向材料校验：`validatePlanTaskContract`、`validateExecutablePlanTaskMinimum`、`validateMaterialOracleContract`；结构/check 命令仅按当前标准规定执行并如实保留既有失败。

## Step 2 / Step 7 Research Summary
- Cross-repo sequencing: WorkflowHub must first tolerate non-terminal member facts, then 3rd-review may produce them; after that implement provider/broker fixes and remaining WorkflowHub consumers. Never half-publish producer before consumer compatibility.
- Proposed implementation phases: P1 WH managed-member tolerance; P2 3rd-review antigravity timeout classification/recovery; P3 broker retry/attempt/non-terminal envelope; P4 WH preflight/wait/source-drift; P5 format+CJK+seven red lines; P6 dual-track fact binding+attempt schema; P7 OI-26 D4 confirmation read-side symmetry; P8 cleanup/DEF-09/two existing red checks; FINAL targeted aggregate.
- 3rd-review writable allowlist remains exactly six authorized files. Among tests, only `test/managed-session-lifecycle.test.mjs` may be modified; all other 3rd-review tests may only be executed. New external-repo RED assertions must therefore be concentrated in the authorized test.
- Antigravity exact anchor: adapter parse becomes `(stdout, stderr)` and argv uses single `--print-timeout=20m`; exact print-timeout stderr maps honestly to provider timeout, then `PROCESS_TIMEOUT`, with one fresh-execution budget.
- Managed non-terminal public projection may expose only member `status`, `error.code`, `last_progress_at_ms`; no output/usage/attempt/session/private refs. Terminal schema and seven fail-closed red lines stay unchanged.
- Step 7 advisor supplied precise RED/GREEN commands per phase, no network/provider use, evidence output paths, failure ownership and STOP rules. Full package-level `npm test`/`test:safe` remain forbidden.

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 根部 planning 文件属于旧任务 | 已创建并激活隔离 plan，不覆盖旧文件 |
| 初始化子代理将 step 2 写成可 skip | 协议审计判定本任务触发 targeted research，已通知执行代理必须执行 |
| `status` 未传 `--action` 首次 exit 1 | 只读状态代理补用 `status --action=begin`，exit 0；不重复错误命令 |
| 只读状态代理将 `.planning` 改动识别为并发 mismatch | 这些文件由本主会话明确创建并拥有，予以保留；正式 specs 写入仍由单一执行代理负责 |
| 首任 specs writer 连续三轮只报告 drafting、无 `/tmp` 或正式文件 | 中止该 turn；将全部已收口研究交给新唯一 writer，并限定必须先产出官方 draft 和 validator 结果 |
