# D-031 代码 diff 基线：CARD-02 有界诊断包

状态：**只读设计；未调用 provider，未生成基线结果。** 本文件不充当 canonical review、go/no-go 结论或质量通过事实。

## 可冻结来源

- CARD-02 合并提交 `dd80ceb13264b3e8e74eb94678bedf9437954044`；第一父 `b39f34baca116d036c52fdf42f914810a7ae66e3`，CARD-02 第二父 `66d2e3baf59a9d262f9ff208cbb975c8c22fe2d4`。第二父直接基于第一父。树 OID 分别为 `bf0ff24b8ee0bb382fc7d7195e929c2779007ff3`、`f9057625e977035a16643cc5873f9074d2112fd0`。以这两个完整 commit OID 冻结 Git 两端；不要改用当前 HEAD。依据：`git show --pretty=raw dd80ceb1`、`git rev-parse <commit>^{tree}` 的本地读回。
- 全 CARD-02 range `b39f34ba..66d2e3ba` 是真实合并工作，但有 128 文件、3,368,891 B 的 binary diff，含大量文档/研究，成本高。最小有界代码语料选同一 range 中 **`runtime/review/review-record-route.mjs` 一文件**：真实 diff 24,232 B、282 增行/71 删行。生成命令须固定完整 OID、`--binary --full-index --no-ext-diff --no-textconv` 和此唯一路径；记录 diff 文件 SHA-256 与实际字节数。依据：本地 `git diff --numstat`、`git diff --binary ... | wc -c`；源文件与变更来自 CARD-02 合并树。
- 原始产品/实现上下文：现存归档 `spec.md` 的 `FR-REVIEW-001..003`、`AC-REVIEW-001..003`（约 L284–300、L503–521）；`tasks.md` 的 Phase P2/T003–T004（约 L160–255），其中 T004 记录 review route 的 timeout、信号取消、派发前失败、真实分母/分子及自检改动。冻结历史原件时须读 `66d2e3ba:specs/workflowhub-thin-core-card-02-20260919/spec.md` 与同目录 `tasks.md`，当时尚未迁入 `specs/archive/`。相应定向测试：`tests/contract/review-materials-contract.test.mjs`、`tests/contract/review-public-entrypoints.test.mjs`、`tests/review/review-record-route.test.mjs`；这些文件存在于上述 CARD-02 range。不能拿后来的 main 文件覆盖历史输入。
- 历史限制：CARD-02 P2 已有一次正式 Phase review attempt，`quality/reviews/attempts/74b8bb6a-9cdb-5a59-a7b3-0ee09b42d119/attempt.json`；`tasks.md` 约 L467–470 记 `REVIEW_INPUT_TOO_LARGE`、`blocked_before_dispatch`、零 provider 派发、无 finding/result。它是失败基线事实，**不是 D-031 要求的“真实代码 diff 面 wh-review 实跑”**。

## 完整同型输入清单与现有缺口

正式 `build-code/phase` 审查须有：认证 TaskHandle/工作树与当前 source diff、Phase ID、`approved_spec`、AC 全文、当前测试证据、固定 `review_instructions`、由宿主生成的 change/impact/reuse/acceptance maps、完整 diff 与依赖 context、provider route/transport 事实；`runtime/review/stage-materials.json` 的 Phase profile 规定 `source_bundle=diff` 与必需字段，`skills/wh-review/contracts/build-code.md` 要求完整当前 Phase diff，调用方不得传路径选择器。公共 `review --action=record` 从认证工作树派生 diff，不能通过 request 指定 CARD-02 历史 Git range（`skills/wh-review/scripts/review-source.mjs:209-289`；`workflows/build-code/SKILL.md:158-165`）。CARD-02 已归档，CARD-05 当前 TaskHandle 不能把历史 range 冒充当前 Phase。若要完整同型正式基线，须另有认证历史快照 TaskHandle/worktree 和原件测试/映射；现未找到可直接调用的现成路线。

下述 **单文件 bare 诊断**只保证送达一段真实代码 diff；它缺完整 Phase diff、真实 Phase 测试/映射和正式 task-bound provenance。可作为发现能力的探索性样本，**不得当成正式同型质量基线，更不得直接用于 D-011/OI-004 的 go/no-go**。本机当前 build-code 配置 `initial.length=2`、`mode=full_only`；bare 入口可能真实派发两路 provider，最长 managed wait 默认 1,200,000 ms（`skills/wh-review/scripts/simple-review-runner.mjs:42`），不是廉价检查。

## 诊断调用草案（未执行）

1. 在认证 CARD-05 worktree 内把上述固定 Git range 的唯一文件 diff 写到任务 research 临时输入，保存字节数与 SHA-256。把历史 `FR-REVIEW-001..003` / `AC-REVIEW-001..003`、T004 摘录另存为来源明确的上下文；若拼入同一个 `implementation` 文本，逐段标原始 Git blob 路径/OID，避免宣称宿主构建了正式 Phase packet。
2. 生成 `<request.json>`：`{"stage":"build-code","review_scope":"phase","subject_kind":"phase","phase_id":"CARD02-P2-DIAGNOSTIC","host_provider":"<当前真实 host provider>","materials":{"implementation":"<原始单文件 diff 与来源标头>"}}`。`host_provider` 必须是已配置、与被选 provider 异源的真实身份；不可自造。bare `runSimpleReview` 要求 stage、host_provider、非空 materials（`simple-review-runner.mjs:1261-1270`）；这里只有未知的 `implementation` 键，按 generic bare 路径送达文本，**不执行正式 Phase 材料校验**。调用前用只读代码/配置检查实际 route，不以无 provider 的本地预检声称已审。
3. 命令草案：`node skills/wh-review/scripts/wh-review-cli.mjs run <request.json> > <stdout.json> 2> <stderr.log>`；立即记录 shell `exit_code`、开始/终止 UTC 时间、命令 argv、请求/diff SHA-256、stdout/stderr 原始字节、返回 `sink_ref`、`status`、`dispatch_state`、`provider_attempts`、每路 `provider_results`/`usage`/`timing`/`findings`/`discarded_facts`。不可只摘录成功 finding；失败码及派发前后位置须保留。`runReviewRecovery` 入口见 `skills/wh-review/scripts/wh-review-cli.mjs:536-560,583-590`。
4. bare sink 位于 `WORKFLOWHUB_REVIEW_SINK_ROOT` 或默认 `~/.workflowhub/review-sink/<request-key>.json`；记录自带 `authoritative:false`，重用相同请求时不会再派发（`wh-review-cli.mjs:99-165,249-319`）。原始 sink JSON 应与 stdout/stderr 一起保留。**禁止**将 bare sink/result 导入 `review --action=record` 伪装成正式 canonical review。

## 入库存证方式

现有 `publishEvidence({task,sourcePath,sourceRoot,evidenceType,publisher,recordedAt})` 把认证 worktree 下的源文件原样封装成不可变 `quality/evidence/<evidenceType>/<source-sha256>.json`，并返回 `store_ref`（`runtime/evidence/canonical-receipt-writer.mjs:114-177`）。执行时可将请求 JSON、diff、命令/exit/时间清单、stdout、stderr、bare sink 的**原始字节**分别保存在 worktree 内，再以 `evidenceType: "review-baseline"`、`publisher: "build-plan"` 调用该现有 writer，并读回每个 ref/hash。此 API 是私有代码接口；公共 `stage-runtime` 的 evidence capture 只限 `build-code` 且未映射为独立 public action（`tools/cli/stage-runtime.mjs:780-808,1124-1137,1385-1430`）。这些入库对象只是**诊断实验原件**，不产生 `quality/reviews/results/` canonical 结果或 build-plan 完成事实。

最终 D-031 代码面正式基线若仍缺，则在 spec/Phase 中明确 `unavailable/incomplete`；后续可选 D-031 原定另一候选，即 CARD-05 自身 build-code 出现真实代码 diff 后，按现有公共 `review --action=record` 的 TaskHandle 路径实跑，独立保留原始/有效/丢弃 finding、锚定和时间口径。
