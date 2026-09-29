# P1 当前缺口核查（2026-09-28，只读）

范围：CARD-04 的 P1/T001–T003。核查期间未改规格、三份交付文档、测试或 Task 事实；未运行测试或 P1 文档 gate。下列结论只代表本次读到的工作区，不宣称 P1 完成。

## 当前文件与身份

- 工作区：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`；分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`；HEAD `ef920f1fbd415fe87d50930359059b661e141acd`，HEAD tree `2a0e21e65488fba4e4507e4491f9edcab8e4585b`。
- T001 `docs/architecture/test-asset-governance-rules.md` SHA-256 `7522aded2bc14460c740ea2c42ab4775660c1249753f6201ba122e94f82ff128`；T002 `docs/architecture/real-entry-inventory.md` SHA-256 `394a73b8007defd569d77280f76b7db92853348a922d71fc48b1efbeb7ac23a0`；T003 `docs/adr/0033-acceptance-truth-presentation-and-cohort-parity.md` SHA-256 `77b43e75e1ca63ca565467a49f6bec34e880f39543a7de6e2f601ebb830c1c9f`。三份字节哈希均与 2026-09-27 的 T001–T003 原件所记一致。
- `git ls-files --stage` 显示 ADR-0033 为 `100644 481f798519113c594a9d04c75bade79b888a39d7 0`；`git status --short` 为 `A`。它已暂存、未进入当前 HEAD。两份架构文档为 `??`，也未提交。
- 本次只读 `node tools/cli/stage-runtime.mjs status --action=begin --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-04-20260919` 返回 exit 0，身份为材料版本 `revision-30e50b760cb29e92f9b114a9be6db6105647a76b7c3c8caeb15a4a949a4975b6`、来源树 `4381e90d43a7072ba12d1a4359ba757c3ddd5786`；整体执行仍为 `partial`，完成次数 0，旧阶段行被报告为 `stale`。此身份会随其它相位并行改动而变，不应在后续重采时硬编码。

## 已有执行记录及其边界

- `ADR0033-current-gate-refresh-20260927/` 保存 P1 复合 Node/git 命令的原始 stdout、stderr、exit、带框 transcript 和哈希；当时输出 `P1 doc assertions OK`、`ADR-0033 tracked`，exit 0。`T001-T003-current-task-checks-20260927-e341aa18/` 分别保存三个任务的原始命令与带框 transcript：`rules doc OK`、`entry inventory OK`、`ADR-0033 OK`，exit 均为 0。其 `kind=command_checks`、相位两个有序 check ID 与任务各自 check ID 已登记。旧的 ADR-0032 原件只作为历史，不替代 0033。
- 上述四份通过记录均绑定旧材料版本 `revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`、旧来源树 `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`。现行 `phases/index.md` SHA-256 为 `9f8745adf9fb5c6f8a79ae40b55451e6deb28bff8a46f8577d15527cae085fbe`，旧原件记录为 `123f9f99f76d2718632d8527fc891f54e251958bf371e4c3de5128f429af28ad`。三份目标文档字节未变，只能保留“旧版检查曾通过”的事实，不能称为当前同版 P1 gate 已完成。
- 原 P1 官方审查 `quality/reviews/attempts/e7623be1-6f1d-5258-aded-9b1e72812074/attempt.json` 的 `terminal_status=unavailable`、`error.code=REVIEW_SOURCE_DRIFT`，没有正式审查结果。独立替代审查见 `architect-fallback-output.json`；三条问题及修复声明见 `architect-fallback-dispositions.json`。修复声明引用的是此前材料/旧编号，仍需对现行 ADR-0033 和两份文档做独立语义复核；不能把该替代审查写成正式审查通过。
- P1 文档 gate 仅核必备文字与 ADR 的 Git 跟踪状态，不证明入口真实可运行、规则被消费者正确执行、AC-16/17 的真实样例或业务结果。`real-entry-inventory.md` 明列未跑过的入口，不能因文档存在而改写。

## AC-16 旧发现的当前处置

旧 `AC16-full-acceptance-set-audit-20260927.md` 读取的是 `spec.md` SHA-256 `41b61a820c95f4ae489ee96f1a47e683abed54f387acb4dce37cee2d3fb2f328`，指出其 `:506` 错指决策日志 `:1313–1340`。当前 `spec.md` SHA-256 已是 `ef1e45942e1d95bb7d0b6b37ab53d3f2441d766a8767c3ccd383371738f7810a`；当前 `:515` 明确 19 项来自 Appendix A，决策日志对应前六项且不另计数，已无旧行号指针。**该旧指针问题不再是当前缺口。** 旧审计仍原样保存；当前版本的完整语义和实际样例另需按现行材料复核，不能沿用旧审计的未完成结论，也不能仅凭修文字宣称 AC-16 通过。

## 最小下一步

1. 等本卡其它正在进行的源文件/材料修改稳定，先用上述只读 `status --action=begin` 重新取当时的 task、材料版本、来源树，并记三份目标文档及 `P1.md`、`index.md` 的 SHA-256。
2. 从**当前** `specs/workflowhub-thin-core-card-04-20260919/phases/P1.md` 逐字取 T001、T002、T003 各自 `RED/GREEN gate_cmd` 和 L0 唯一复合 `gate_cmd`，只跑这四条 Node/git 定向命令；分别存精确命令、CWD、UTC、stdout、stderr、exit、带框 `COMMAND=`/`EXIT=0` 原件、文件哈希及运行前后同版身份。不能用旧 GREEN、`node --version` 或测试 runner ID 冒充文档检查。已有 RED 原件保留，不重写。
3. 独立上下文复核现行三文档与 `decision-log.md`、`spec.md`、真实入口/消费者的一致性，逐条处置新旧 finding。若正式审查仍不可用，按原始失败记录 `unavailable`，保留替代审查的身份和覆盖边界。核 AC-16 时以当前 Appendix A 19 项及现行来源为分母，并区分定义可失败与真实样例已执行。
4. P13/T024 若要把 P1 标为通过，必须只读消费**当时当前版**四份原始检查及哈希：相位 `kind=command_checks`、`check_ids=[P1-DOC-ASSERTIONS,P1-ADR-TRACKED]`，任务分别为 `P1-RULES-DOC`、`P1-ENTRY-INVENTORY`、`P1-ADR-TRACKED`；每份有唯一 `COMMAND=` 开头、原始 marker 按序、`EXIT=0` 收尾，匹配 P1 原命令及 task/snapshot 身份；通过任务还需能回读本 Task 外置 `quality/` 下的来源。P13 不能替 P1 伪造这些原件。

核查来源：当前 `phases/P1.md`、`spec.md`、三份目标文档及 Git index；上述 P1 证据目录；外置 Task 的官方审查 attempt 和 `facts.jsonl`；`tests/contract/card04-final-aggregate.test.mjs` 的 P1 检查逻辑。未运行 P1 gate、测试、正式审查或写入 Task 事实。
