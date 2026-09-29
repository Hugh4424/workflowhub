# AC-27 当前写入与读取链只读核查（2026-09-27）

范围：CARD-04 worktree `task/workflowhub/workflowhub-thin-core-card-04-20260919`，外置 Task `workflowhub-thin-core-card-04-20260919`。仅检查文件与既有事实；未改生产代码，未跑测试。当前事实绑定 `material_revision=revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`、`snapshot_tree=a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`。

## 结论

1. **生产能力：局部存在，四类真实产出仍缺。** CARD-05 已并入本分支的 HEAD 历史（`24a4a751` merge；当前 HEAD `ef920f1f`）。CARD-04 P7 的 `validateAcceptanceEvidence` 接受 `missing/inconsistent/incomplete/unavailable`，`quality-store` 对这些值判 `incomplete`；这是校验与辅助分类能力。当前通用生产路径 `runtime/stage/stage-runner.mjs:1793-1800` 把 `missing` 写成 `deferred`，没有四类映射；`runtime/stage/stage-handlers.mjs:650-655` 的 `classifyAcceptanceEvidenceResult` 也只认 `pass/fail/inconclusive/deferred`。`stage-runner.mjs:2177-2196,2235,2279-2292` 允许给 **另一 subject** `stage_end_spec_analyze` 特设三值 override，不是 AC-27 四类生产。`stage-runner.mjs:3320-3355` 的逐 AC writer 用 `publishAcceptanceQualityFact` 发布当前 AC 事实，但没有把 AC-27 的四类结果映射进去。因此 CARD-05 合并本身没有使本项生产要求完成。
2. **当前 Task 事实：有 AC-27 的缺证据原件，没有四类原件。** `quality/facts/41f08dd081e4648d7a8aa0e341a19ba1ea4cdbb936d17ab6a63c959c41a4d144.json` 是 `kind=acceptance_criterion, subject=AC-27, status=missing`。它引用 `quality/evidence/acceptance/build-code/AC-27-0a4fdc2056e6fdd56f53c6b165ba09d9aa868a1ef260a840c026bb31fcdc4f78.json`，该 wrapper 的 `result=deferred`；再引用 `quality/evidence/stage-quality/build-code/AC-27-a952cdbfc821434ff65f8916b8834884a6a59d68e7418148e83158cbc7f133d5.json`，其 `subject_fact.evidence_refs=[]`、`evidence_state=unknown_empty_evidence`。后两份文件的 SHA-256 与文件名一致。这个原件证明“缺证据”被如实记下，不能证明 `missing/inconsistent/incomplete/unavailable` 四类已由真实阶段产出。当前 `facts.jsonl` 第 3 行 build-code 为 `partial/incomplete`，不是 AC-27 通过声明。
3. **读取能力：已有认证骨架，AC-27 仍不能得出业务效果。** 两个 AC-27 catalog case（`CARD04-ACCEPTANCE-MACHINE-CLASSES` 与 `CARD04-DEFERRED-ACCEPTANCE-REGRESSION`）的 `effect_observation.reader.implementation_status=not_implemented`（`docs/quality/business-case-catalog.json:244-281,388-405`）。现在代码 `workflows/build-code/case-reconciliation.mjs:305-375` 已能寻找同 Task/版本/快照的质量事实，认证 wrapper 与嵌套原件，并要求原件含本次测试收据；但 AC-27 机器类没有独立四类效果判断分支，落到 `independent_effect_reader_unavailable`。`reconcileCurrentTaskCases` 在 `:542-545` 先看到机器类 case 的 `producer_status=not_implemented` 就返回 `producer_unavailable`；对 deferred 回归 case 虽有专门分支，也要求嵌套原件绑定本次测试收据（`:345-358`），而当前 AC-27 原件的 `evidence_refs=[]`，故不能据当前 wrapper 得出业务通过。最后返回仍是 `status=unavailable, business_effect_status=unknown`（`:561-565`）。如果本次选择还含未映射改动，`:526-533` 会更早返回 `unmapped_changed_path`。

## 最小下一步

在现有 CARD-05 写入路径明确四类结果各自对应的真实输入与触发条件，按 AC-27 的当前材料补上生产映射，并用逐类真实阶段执行留下同 Task、同材料、同快照的原件；旧 `deferred` 原件保留。随后把 P10 读取端接到这些原件，独立检查每一类的输入、结果及“不被判通过”的负例，并在 catalog 更新真实能力状态和读回证据。不要仅改 catalog 标记，或把当前 `deferred` 包装为 `missing` 类产出。历史 123 条逐字兼容仍须另取认证基线，不能由当前 Task 原件代替。

不能宣称：AC-27 四类真实生产已完成、AC-27 业务效果已观察、P10/T021 对 AC-27 已通过、历史 123 条兼容已证实。
