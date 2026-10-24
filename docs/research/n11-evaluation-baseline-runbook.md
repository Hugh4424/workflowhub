# N11 P7 基线与同条件实跑

本文件只说明四个阶段、一个通道、两侧各一次的实跑与分母，不给收益或判官结论。实际身份和精确 argv/env 以任务库 `quality/evidence/2026-10-23-246-p7-final-preflight-eight-cells.json` 为原件；该件不是完成证明。

## 基线检出

用户已选 `3068cfd09b421bcfedc0a4e861b05871081c101b`，tree 为 `172c25561e3ddbdf0f03ccfe5bc379abb3838cf8`。现有基线位于 `/Users/Hugh/.codex/worktrees/n11-eval-baseline/workflowhub`。每次运行前核真实 HEAD 与 `git status --porcelain`；不得修改基线业务代码或注入候选 YAML。候选为 `/Users/Hugh/Hugh/Project/workflowhub-n11-same-condition-eval-20261022`，P6 交付提交 `cb021147f6b28a68c49352afa50098aea39a90ad`。P7 新增本文与测试不改变被测 procedure closure。

## 被测 worktree

ModelTest 执行 cwd 为 `/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022`，HEAD `b9680707b62cd72eaf39ae8e1ddaf77989bf1901`。`MODELTEST_WORKFLOWHUB_ROOT` 每格分别指向基线或候选，既提供真实方法源，也供既有 builder runtime imports 使用；不能声称整个 runtime 相同。

两侧 `MODELTEST_WORKFLOWHUB_DISTRIBUTION_ROOT` 均显式指向候选树，只共享已交付的 distribution collector，不向基线注候选方法。provider 配置使用任务库 `2026-10-23-024-p6-modeltest-provider-config.json`，通道 `codex/luna`、模型 `gpt-6-luna`、effort `max`、单 attempt。smoke 使用 `2026-10-23-172-p6-v5-fresh-provider-doctor.output` 原件；它只证明 executable/protocol，不能冒账号额度或阶段质量。

固定输入是 `evaluation-assets/test-fixtures/us07-workflowhub/fixed-upstream-n11-v2.json`，sha256 `cb01bfc27a336f8024f31834e896fee899173c9f7cb367292eeed9c07e7ee92a`。runner v0.4.0 的 `snapshot.sha256` 为 `fca584fd5fd8b4ce12fd76000597b10b740c189daf5632ce57f07c8aaa554255`，算法为 `sha256(stable-json(files))`，不等于 config 文件字节 hash。旧 v5 执行 snapshot 不重写。verify-code 公开 v0.2 业务 seed 与其它阶段不同，但每个阶段的两侧相同；隐藏评分不进 provider 输入。

## 逐阶段启动

只跑 `make-decision`、`build-plan`、`build-code`、`verify-code`，按此顺序每阶段 baseline→candidate 串行。禁止默认五阶段入口，`build-spec` 不跑。完整八条命令在 preflight246 的 `cells[].argv/env`，每格都有独立绝对 outputRoot。命令形状如下，实际环境值必须从该格原件取得：

```sh
env MODELTEST_WORKFLOWHUB_ROOT=<该侧> MODELTEST_WORKFLOWHUB_DISTRIBUTION_ROOT=<同collector> MODELTEST_WORKFLOWHUB_CONFIG=<024绝对路径> MODELTEST_PROVIDER_SMOKE_FILE=<172原件> MODELTEST_FIXED_UPSTREAM_FILE=<n11-v2> MODELTEST_WORKBOARD_AT_REPO_ROOT=1 MODELTEST_US07_WORKBOARD_BUNDLE=<公开v0.1.1bundle> node evaluation-assets/scripts/run-us07-fixed-stage-cohort.mjs --stage <明确阶段> --providers codex/luna --max-attempts 1 --effort max --output-root <全新绝对根>
```

基根为 `quality/evidence/n11-p7-same-condition-20261023-r1/<baseline|candidate>/<stage>`。cell 的唯一身份包含整个 outputRoot，不能只靠跨根重用的 task_id/attempt_id。已有输出根不覆盖，每次只持一个真实命令 handle，等自然终态，不重复启动。现 transport 内部既有 timeout 保留，不新增外层 deadline。共享账号和本机资源会影响等待时间，故采用串行。

## 产物校验

每格读 `cohort-summary.json`，schema 必须为 `modeltest.us07.fixed-stage-cohort.v1`、cohort 为 `developer-fixed-upstream`。实际 attempt/result/transport/output/trace 引用位于该格 `stages/<stage>/codex-luna/` 下；核其真实 ref/hash、stage、provider、模型/effort/config/fixture 与来源侧，不从旧 v5 拿样本。

固定分母是四阶段×两侧共八格。每格必须有真实 attempt 原件，或具名启动失败及真实执行回执；失败不剔除。不能启动时不合成 summary/result。汇总原件写任务库既定 `quality/evidence/n11-same-condition-eval-20261022/P7-baseline-eval.json`，引用单份原件，覆盖边界显式列 stages/providers/excluded。结构测试只证明引用、分母和边界，真实启动由命令及产物证明。

```sh
npx vitest run tests/acceptance/n11-eval-run-check.test.mjs
```

先 RED、后实跑、最终 GREEN。受控反例删阶段、剔失败、改 schema、缺覆盖边界、旧 cohort 顶替必须被拒绝。不能手改模型产物求绿。原始 RED 与失败回执保留。

## 失败与 unavailable 处置

基线启动失败写“无法对比”及具名原因、原始回执和影响面；不修基线、不注候选材料。provider 身份、授权、资源失败按项目既定零重试边界处置，其余安全工作继续。内容质量差不改 prompt 重刷，评测链实现缺陷回对应 owner，P7 不顺手修 P6。

wall 取真实 process telemetry 的 duration/起止；usage/cache 缺失保 unknown/unavailable，不能补零或用旧 N1 总量顶替。stdout 若有真实 terminal usage 才取实际值；`item.completed` 不冒步骤数。成本四组和收益属于 P8，P7只交原始事实。

P7 不证明匿名判定、成本收益、其它 provider/cohort、长期效果或业务隐藏 oracle 通过。未跑项、失败和独审覆盖限制随真实原件交 P8/verify-code，不把本文件或游标当 pass。

## 本次实际原件

本次八格均已各启动一次并自然终态，实际矩阵为任务库 `quality/evidence/2026-10-23-250-p7-eight-cell-actual-manifest.json`，sha256 `fb5f71582529e348902ee6719175ad10648f3b21fff28d10f1290940da740a40`。它逐格引用 capture185–192、summary、result、transport、output与trace原件；完整cell root、side、stage和原件hash联合归属，不能按跨根复用的official ID混样本。

八格summary均为incomplete：候选make-decision/build-plan为既有内部timeout，另六格交接后仍为incomplete。全部留在分母，不把child exit0或结构检查GREEN称stage pass。usage/cache/统一步骤计数未取得，保持unknown。

原计划路径 `P7-baseline-eval.json` 的初件误将派生trace ref按results父目录解析；250按producer真实`traceRoot=artifacts/results`纠正，并核八个trace文件实际存在。初件保留不覆写，模型和producer原件未改。测试与P8消费250实际原件，不消费错误派生指针。
