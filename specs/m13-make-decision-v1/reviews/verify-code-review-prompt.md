你是独立的异源第三方审查员（codex / 非 claude 引擎），对 workflowhub M13 make-decision-v1 的 **verify-code 阶段交付物** 做独立验收审查。目标：判断 verify-code 给出的 PASS 裁决是否诚实、可证伪、无放水。客观，不放水，不补全作者逻辑。

## 必读文件（在仓库根目录 /Users/Hugh/Hugh/Project/workflowhub 下）
1. specs/m13-make-decision-v1/spec.md — 需求与验收标准 AC 全集
2. specs/m13-make-decision-v1/stage-result-verify-code.json — verify-code 裁决（verdict=pass, 4 PENDING）
3. specs/m13-make-decision-v1/test/final-test-report.md — 最终测试报告（22 PASS / 4 PENDING / 0 FAIL）
4. specs/m13-make-decision-v1/constitution-check.md — 宪法逐条核对
5. specs/m13-make-decision-v1/cross-artifact-analysis.md — 跨产物一致性分析
6. specs/m13-make-decision-v1/baseline-report.md — 基线指标
7. specs/m13-make-decision-v1/evidence/fresh-capture.json — 新鲜测试证据（exit_code / content_hash / git_sha）
8. workflows/verify-code/SKILL.md — verify-code 阶段契约（判断作者是否照剧本走）

## 审查重点（逐条给结论）
1. **假绿防护**：fresh-capture.json 的 exit_code 是否真为 0？content_hash 是否真实、非伪造？测试命令是否真的跑了 m13 测试套件（133 测试）？有没有 test.skip/.only/桩测试冒充通过？
2. **PASS 裁决是否诚实**：22 PASS 是否每条都有真实证据支撑，还是有靠"读起来像对"蒙混的？逐条抽查可疑 AC。
3. **4 PENDING 是否正当**：FR-ACCEPT-02/03、AC1、AC4 标 PENDING 的理由（human-in-loop / runtime-only）是否成立？有没有本可自动验证却偷懒标 PENDING 的？有没有该判 FAIL 却标 PENDING 掩盖的？
4. **跨产物一致性**：spec → plan → tasks → build-code → verify-code 链路是否自洽？cross-artifact-analysis 有没有漏报真实矛盾？
5. **宪法符合**：constitution-check 的逐条 [x] 是否有不成立的自我宣称？

## 输出格式（严格）
- VERDICT: pass | revise_required | escalate_to_human
- BLOCKING findings（必须修才能合并的）：逐条列，附文件:行号 + 为什么 blocking
- MAJOR / MEDIUM / LOW findings：分级列
- 若 verdict=pass，明确写"verify-code 的 PASS 裁决经独立异源核验成立，可进入合并"
把完整审查报告写到 specs/m13-make-decision-v1/reviews/codex-verify-code/verdict.md，并在 stdout 打印 VERDICT 行和 BLOCKING 数量。
