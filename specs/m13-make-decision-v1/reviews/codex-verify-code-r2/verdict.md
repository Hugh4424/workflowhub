# Codex Verify-Code Independent Review R2 — M13 make-decision-v1

VERDICT: revise_required

结论：verify-code 的 PASS 裁决不成立。测试命令真实执行，当前复跑也是 `133 passed (133)`，没有发现 `.skip/.only` 或空断言式假跑；但 verify-code 把真实 spec/实现矛盾、统计自相矛盾、证据不足的 AC 继续包装为 PASS。该 PASS 不诚实、不可合并。

## 复审摘要

- fresh test command: `npx vitest run tests/m13-make-decision.test.mjs`
- fresh-capture exit_code: `0`，见 `specs/m13-make-decision-v1/evidence/fresh-capture.json:5`
- 本轮复跑：`Test Files 1 passed (1)`，`Tests 133 passed (133)`，exit_code `0`
- 当前 HEAD: `278ebabd8e791d80bef5512fa7ed40cf29d5aa79`
- fresh-capture git_sha: `278ebabd8e791d80bef5512fa7ed40cf29d5aa79`
- `.skip/.only` 扫描：未发现 `test.skip` / `describe.skip` / `it.skip` / `test.only` / `describe.only` / `it.only`
- 桩测试扫描：未发现 `assert.ok(true)` / `expect(true)` / `vi.mock` / M13 测试内 `stub` 冒充通过

## 上轮 6 个 blocking 修复核验

1. stage-result schema：已修。当前 `stage-result-verify-code.json` 有 `status/error_code/retryable/facts` 结构，见 `specs/m13-make-decision-v1/stage-result-verify-code.json:1`。
2. AC 编号错位：大体已修。当前 AC 表按 spec 的 AC1-AC6 展开，见 `specs/m13-make-decision-v1/test/final-test-report.md:52`。
3. AC4 错判：未真正修好。上轮指出 AC4 是 metrics 自动核查项；本轮报告改成 PASS，但证据不足，见 blocking 4。
4. FR/AC 分母漏项：部分修好但仍不自洽。当前 FR 表列到 27 个 FR，但 summary/stage-result 统计互相冲突，见 blocking 3。
5. FR-ENV-01：未真正修好。报告从 PASS 改成 PENDING，但该项是可自动验证的 spec/实现矛盾，不是 human-in-loop，见 blocking 2。
6. constitution-check 条款旧口径：条款名已基本对齐当前 `constitution-checklist.md`，但仍有 `[x]` 证据不足，见 major 3。

## BLOCKING findings

1. `specs/m13-make-decision-v1/test/final-test-report.md:29` 将 `FR-RESEARCH-03` 判 PASS，但实现仍违反 spec 的“双路返空即停”要求。  
   `specs/m13-make-decision-v1/spec.md:128` 到 `:132` 要求 muyu 和 anysearch 两路均空时立即停止，并且不得继续合成摘要；`specs/m13-make-decision-v1/plan.md:147` 和 `specs/m13-make-decision-v1/tasks.md:106` 也写明要停止、报告用户、等待指令、不合成摘要。实际 `workflows/make-decision/SKILL.md:162` 只写“双路均返空则记录 `dual_research_empty: true`”，随后 `workflows/make-decision/SKILL.md:167` 继续“汇总双路产出”。这是实质实现不满足 FR，测试只查字符串 `dual_research_empty`，没有查停止语义。verify-code 把该项判 PASS 是假绿。

2. `specs/m13-make-decision-v1/test/final-test-report.md:47` 将 `FR-ENV-01` 作为 PENDING 处理，但这是可自动验证的 spec/implementation 矛盾，不是 human-in-loop。  
   spec 明确 6 个 env var 及默认值：`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 默认 `0`、`MAKE_DECISION_SKIP_DEBATE` 默认 `0`、`MAKE_DECISION_SKIP_BLIND_REVIEW` 默认 `0`、`THIRD_REVIEW_RUNNER` 默认 `run-heterologous-review.mjs`，见 `specs/m13-make-decision-v1/spec.md:309` 到 `:318`。实际 SKILL 使用 `WORKFLOWHUB_AGENT_TEAMS_ENABLED`、默认 `false`，并把 skip 变量也设成 `false`，见 `workflows/make-decision/SKILL.md:14` 到 `:18`。测试也跟随实现检查 `WORKFLOWHUB_AGENT_TEAMS_ENABLED`，见 `tests/m13-make-decision.test.mjs:65` 到 `:72`。若 spec 是权威源，该项应 FAIL；若权威未定，总体 verdict 也不能 PASS。

3. `specs/m13-make-decision-v1/stage-result-verify-code.json:18` 与 `specs/m13-make-decision-v1/test/final-test-report.md:69` 到 `:77` 的 PASS/PENDING 统计互相冲突，PASS 裁决不可采信。  
   stage-result reason 写 `21 FRs PASS; 1 FR PENDING ...; 2 FRs PENDING ...; 4 ACs PASS; 2 ACs PENDING`。final report summary 写 `FR PASS: 23`、`FR PENDING: 4`，但 FR 表实际只有 `FR-ACCEPT-02`、`FR-ACCEPT-03`、`FR-ENV-01` 三个 PENDING，见 `specs/m13-make-decision-v1/test/final-test-report.md:45` 到 `:47`；同一 summary 行还重复列 `FR-ACCEPT-02/03`。用户要求核验的“22 PASS / 4 PENDING / 0 FAIL”在当前产物中没有一致证据。

4. `specs/m13-make-decision-v1/test/final-test-report.md:59` 将 AC4 metrics 记录判 PASS，但证据不足以证明 spec 要求的 `recordSkeleton` + `updateOwnResult` 都发生。  
   spec AC4 要求 `task-metrics.jsonl` 中有 make-decision 阶段的 `recordSkeleton` 和 `updateOwnResult` 记录，见 `specs/m13-make-decision-v1/spec.md:404` 到 `:405`。现有 `tasks/m13-make-decision-v1/task-metrics.jsonl:1` 只有一条 make-decision 记录，且 `skill_version` 是 `1.0.0`，与当前 `workflows/make-decision/SKILL.md:3` 的 `2.0.0` 不一致。`metrics/collector.mjs:127` 和 `:151` 显示 `recordSkeleton`/`updateOwnResult` 都通过 `upsert` 写同一 execution_id，单行最终记录不能证明两次 runtime 调用都实际发生。AC4 不能判 PASS；最多 PENDING，或补充可核验调用证据。

5. `specs/m13-make-decision-v1/cross-artifact-analysis.md:17` 和 `:24` 声称文件清单一致且无残留一致性问题，但 spec/plan/tasks/build-code 的实际路径链路不自洽。  
   spec 写最大影响面是 `skills/make-decision/SKILL.md`，见 `specs/m13-make-decision-v1/spec.md:18`；plan 也写核心产物为 `skills/make-decision/SKILL.md`，见 `specs/m13-make-decision-v1/plan.md:75` 到 `:77`；tasks 输出同样写 `skills/make-decision/SKILL.md`，见 `specs/m13-make-decision-v1/tasks.md:41`。但实际注册路径是 `workflows/make-decision/SKILL.md`，见 `config/workflowhub.yaml:9` 到 `:11`；build-code changed 也是 `workflows/make-decision/SKILL.md`，见 `specs/m13-make-decision-v1/stage-result-build-code.json:6` 到 `:9`。cross-artifact-analysis 漏报真实矛盾，verify-code 不能基于它宣称链路自洽。

6. `specs/m13-make-decision-v1/test/final-test-report.md:81` 声称 “No implementation contradicts any AC or FR structurally”，但已存在最终异源 review 的 `revise_required` 结构性矛盾没有被 verify-code 如实浮现。  
   最终 code review 明确 `verdict: revise_required`，见 `specs/m13-make-decision-v1/reviews/codex-final/tasks/m13-bundle-final-20260629T135946Z-727b9c/reviews/report.md:3`；summary 指出 debate gating、blind-review skip、journal event keys、legacy instructions 仍内部不一致，见同文件 `:8`；具体 4 个 major 见同文件 `:12` 到 `:15`。build-code stage-result 也承认 residual `4 major + 2 medium`，见 `specs/m13-make-decision-v1/stage-result-build-code.json:28`。这些可按宪法不做阻断质量门，但 verify-code 不能写成“无结构矛盾”后给干净 PASS。

## MAJOR findings

1. `specs/m13-make-decision-v1/evidence/fresh-capture.json:8` 的 `content_hash` 不能由现有证据复算。  
   `workflows/verify-code/capture.mjs:65` 到 `:68` 显示 hash 来源是 `stdout + "\n" + stderr`，但 fresh-capture 只保存 hash，没有保存 stdout/stderr。Vitest 输出含动态 `Start at` / `Duration`，本轮复跑 hash 不同属合理现象，不证明伪造；但证据链不完整，不能把 hash 当成独立可复验证据。

2. `specs/m13-make-decision-v1/evidence/fresh-capture.json:4` 的 git_sha 合理但不足以绑定当前被测内容。  
   当前 `git rev-parse HEAD` 与 fresh-capture 一致；但 `git status --short` 显示 `reuse-registry.md`、`workflows/make-decision/SKILL.md` 有未提交修改，`specs/m13-make-decision-v1/`、`tests/m13-make-decision.test.mjs`、`task-metrics.jsonl` 等是未跟踪内容。HEAD SHA 不能固定这些文件内容，因此 freshness 只能证明 HEAD 一致，不能证明完整证据包可复现。

3. `specs/m13-make-decision-v1/constitution-check.md:29` 和 `:34` 的 `[x]` 证据不足。  
   `constitution-check.md:29` 声称双路调研、盲审、debate、talk、grill 均可通过 env var 独立触发或跳过；实际 env table 只有 debate、blind-review、runner/config、agent teams，没有 talk/grill/dual-research 的独立触发 env，见 `workflows/make-decision/SKILL.md:11` 到 `:18`。`constitution-check.md:34` 声称 collector 记录 `skill_version: 2.0.0`，但现有 make-decision metrics 记录是 `1.0.0`，见 `tasks/m13-make-decision-v1/task-metrics.jsonl:1`。

4. `specs/m13-make-decision-v1/stage-result-build-plan.json:7` 与当前 `specs/m13-make-decision-v1/tasks.md:5` 不一致。  
   build-plan stage-result 写 `17 tasks, 6 stages`，当前 tasks.md 写 `Total Tasks: 19 | Stages: 6`。这是跨阶段产物残留不一致，cross-artifact-analysis 未报。

5. `tasks/m13-make-decision-v1/stage-result-make-decision.json:6` 仍写 11 步流程，而当前 spec 明确为 S0、S0.5、S1-S10 的 12 步，见 `specs/m13-make-decision-v1/spec.md:69` 到 `:83`。  
   这说明上游 stage-result 未同步当前权威 spec。它不单独证明实现失败，但削弱了 verify-code “链路自洽”的声明。

## MEDIUM findings

1. `FR-ACCEPT-02` 和 `FR-ACCEPT-03` 标 PENDING 正当。  
   spec 要求 S9 用户明确确认、decision-log `user_decision: true`、journal `s9_user_approved: true`，见 `specs/m13-make-decision-v1/spec.md:343` 到 `:353`。这确实依赖 live human-in-loop，自动结构测试不能完整替代。

2. `AC1` 标 PENDING 正当，但报告措辞过强。  
   spec AC1 要求 workflowhub 自身 dogfooding 中五类护城河可触发并产出 artifacts，见 `specs/m13-make-decision-v1/spec.md:395` 到 `:397`。当前没有完整 runtime dogfooding 产物，所以 PENDING 合理；不能用“结构已定义”暗示已经满足。

3. `AC6` 是当前文件里的真实 PENDING，且正当；它不在用户给出的 4 PENDING 列表内。  
   final report 将 AC6 标 PENDING，见 `specs/m13-make-decision-v1/test/final-test-report.md:61`。spec AC6 要求 decision-log `user_decision: true` 且 journal `s9_user_approved: true`，见 `specs/m13-make-decision-v1/spec.md:410` 到 `:411`。这进一步说明本轮产物的 PENDING 列表与口径不一致。

4. `tests/m13-make-decision.test.mjs` 是大量全文字符串结构断言，不能支撑 runtime AC。  
   例如 `tests/m13-make-decision.test.mjs:457` 到 `:462` 只检查 `dual_research_empty` 字符串存在，没有断言“停止/等待用户/不得合成摘要”；`tests/m13-make-decision.test.mjs:443` 到 `:446` 只查全文 `skipped: scope=lite`；`tests/m13-make-decision.test.mjs:1001` 到 `:1006` 只要全文含 `debate_2_triggered` 或 `debate_2_skipped` 即通过。测试可以证明部分文档结构存在，不能证明流程行为正确。

## LOW findings

1. `specs/m13-make-decision-v1/test/final-test-report.md:71` 的 PENDING 列表重复写 `FR-ACCEPT-02/03`，是明显报告质量问题。

2. `tests/m13-make-decision.test.mjs:115` 在 `config/workflowhub.yaml` 不存在时会 `return`，导致“不得注册 env var”测试静默跳过。当前仓库存在该文件，所以本轮不构成假绿。

## 4 PENDING 正当性结论

- `FR-ACCEPT-02`: PENDING 成立，live S9 用户确认不可由结构测试替代。
- `FR-ACCEPT-03`: PENDING 成立，S9 台账逐条核对依赖真实交互记录。
- `AC1`: PENDING 成立，dogfooding runtime 触发和 artifacts 产出尚无完整证据。
- `AC4`: 当前不是 PENDING，而是被报告判 PASS；该 PASS 不成立，按现有证据应降为 PENDING 或补证据。

额外说明：当前 final report 还把 `FR-ENV-01` 和 `AC6` 标为 PENDING；这与用户给出的“4 PENDING = FR-ACCEPT-02/03、AC1、AC4”不一致。

## 假绿防护结论

- `fresh-capture.json` 的 `exit_code` 真为 `0`。
- 测试命令确实跑了 `tests/m13-make-decision.test.mjs`，本轮复跑为 `133 passed (133)`。
- 未发现 `.skip` / `.only`。
- 未发现明显空断言桩测试。
- 但测试主要是文档字符串结构断言，已经漏掉 `FR-RESEARCH-03` 的停止语义；不能用 133/133 通过证明 verify-code PASS 成立。

## 最终裁决

VERDICT: revise_required

verify-code 的 PASS 裁决未经独立异源核验成立，不能进入合并。必须至少修正：`FR-RESEARCH-03` 实现与测试、`FR-ENV-01` spec/实现权威源、AC4 metrics 证据、最终报告统计口径、cross-artifact-analysis 漏报，并如实处理最终异源 review 残留 major。
