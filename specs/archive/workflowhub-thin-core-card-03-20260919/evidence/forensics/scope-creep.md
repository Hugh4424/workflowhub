# 越界取证：paperbuilder-live-simulation-durability-post-20260925 / build-code

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 18:39（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §17 M5 与 §18 E10（续跑先对现实、材料与代码不一致时以代码为准）

范围：W2=/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-live-simulation-durability-post-20260925
转录：/Users/Hugh/.codex/sessions/2026/09/25/rollout-2026-09-25T12-36-51-01a0d6da-1328-7873-9acf-cbf439afd194.jsonl（159,847 行，2026-09-25T04:36Z→09-29T10:31Z，0 次 git commit）
只读证据文件：/tmp/pb-forensics/{before_restore.tsv,after_restore.tsv,numstat.tsv,out_of_writeset.txt,usermsgs.tsv,turncomplete.tsv}

## 1. 原始需求（W2/specs/.../spec.md）
- 目标 spec.md:122-129；范围内 spec.md:131-133（M1–M11）；明确不做 spec.md:458-469（10 条）
- 验收：Appendix A spec.md:651-771 = **17 个唯一 AC**（AC-CLEAN×3/CONTRAST×2/OPS×2/QUALITY/RESUME×2/ROLL/ RUN×3/STATE/UNIQUE×2），24 个 FR
- 写面：Global File Boundary spec.md:541-554，逐 Phase MODIFY/NEW 表；spec.md:543「一个文件只能出现在一个 Phase」「新发现的生产文件必须先改边界」；spec.md:554 DO NOT TOUCH 含 `paperbuilder/c1`…`c10`、`app_services`、`api.py`
- 阶段任务：spec.md:582-605 R-001..R-010→T001..T020（T017=25 提交/F-015 账本+全质量+真实验收聚合）
- 当前范围修订（09-29 重基线后）：CURRENT-001..006 spec.md:5-61；LC-001..LC-006 取代 17 AC 成为当前分母；P4 状态 RETIRED、T014/T020/T003-005/T007-008/T018-019 退役

## 2. 实际改了什么
- 会话内 patch 操作：Update 1734 / Add 156 / Delete 20；阶段：09-25 588、09-26 630、09-27 381、09-28 1380、09-29 800 次写入
- **ordinal 140692（2026-09-28T23:11:55Z）执行 `git restore --staged --worktree :/`（workdir=W2）：整个工作树被还原到 HEAD**，此后只重建精简子集
- 现存工作树：`git status --porcelain` = 41 M + 3 ??（`.planning/`、`specs/…`、`tests/test_t14_intraday_contrast.py`）；`git diff --numstat` 合计 3788 行改动
- 还原前：194 个唯一文件 / 1474 次 patch 操作（tests 56、paperbuilder 32、frontend 23、evidence 尾缀 65、runtime_ops 7）
- 无分支产出、无 commit、无 merge：HEAD 3012a32（2026-09-24 23:38）早于会话起点

## 3. 额外工作（需求/写面之外）Top5
1. **未申报的新生产文件**（还原前）：runtime_ops/live_runtime_supervisor.py、paperbuilder/application/live_smoke_worker.py、runtime_ops/v2_run_lifecycle.py、paperbuilder/application/v2_execution_preload.py、paperbuilder/contracts/v2_contrast.py、frontend/src/simulation-detail-page.tsx、frontend/src/v2-run-detail-api.ts。动机（turncomplete 09-27T19:48）「修复边界跨 runtime_ops/live_runtime_supervisor.py、scr…」
2. **越界改动既有/禁改模块**（现存树上）：paperbuilder/components/c1_ingestion/aggregation.py +66、c1/aggregation.py、c1/__init__.py、components/c1_ingestion/__init__.py、app_services/__init__.py（spec.md:554）、contracts/v2_live_runtime.py、runtime_ops/runtime_lock.py、application/v2_market_api.py +18、frontend/src/v2-simulation-api.ts（P5 表未列）
3. **超出非目标的功能面**：Historical 逐笔补数 + C2 补数回执 + 恢复屏障（OPEN-003）、封存行情修订（sealed revision）、CAS 发布、多 Worker 协调、per-run ingress 队列。自述（turncomplete 09-26T05:52）「OPEN-003 已获批准…Historical 逐笔补数、C2 补数回执和恢复屏障；对应正式测试 53 项通过」；（09-28T22:58）「根因…是把"实时模拟"改成了"实时行情 + 多层持久化 + 历史补数 + 封存日修订 + CAS 发布 + 多 Worker 协调"的复杂系…」
4. **外围产物**：.planning/2026-09-29-live-core-simplification/ 24 文件 1934 行；specs/…/evidence/build-code 曾写 65 份证据 md（现 evidence/ 下 **0 文件**，全被删/rebase）；外部任务跟踪 /Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/…/quality 3565 文件 91M（build-code 测试产物 384、evidence 144）；/Users/Hugh/Downloads/PaperBuilder-live-*.md；20 分钟监控定时任务（用户 09-29T09:21 要求，非自创）
5. **权威材料整体重写**：spec.md/decision-log.md/P1–P6/index.md 被 delete+add 重写为"执行摘要"；用户两次抗议（「比简陋…被你改成…」09-29T09:29、09-29T09:33 自认「替换」）；旧材料归档 legacy/20260929-before-lean-rebaseline/ 10 文件 744K
- 附带：无关模块测试连带修改（还原前）tests/test_f9_attribution_storage.py、test_f11_manual_iteration_storage.py、test_intelligent_iteration_storage_v21.py、tests/backend/f17_risk_templates/test_contracts_store_domain.py、test_c1_parameters.py、components/c2_storage/f19_manual_editor_store.py

## 4. 要求了却没做
1. build-code 层状态：facts.jsonl:2 `implementation_completion=partial, stage_quality=incomplete, delivery=unavailable, task_closure=unavailable`（2026-09-27T22:39:20Z）
2. 17 个 AC 全部未达成：quality/evidence/acceptance/build-code/AC-*.json 中 578 条 `"result":"deferred"`、459 条 `"actual_outcome":"missing"`；quality/stage-reflection/build-code/1e104a4e….json:1 `"status":"degraded"`，理由「all 17 AC facts missing…live acceptance still needs a real trading session」
3. 原 P4 交付物不存在：runtime_ops/purge_v2_runs.py、tests/runtime_ops/test_purge_v2_runs.py、tests/runtime_ops/test_disk_governance_durability.py（spec 声明；现 P4 已 RETIRED）
4. 真实 CME 全天 + 故障注入证据缺失 → LC-001..LC-006 只能 incomplete（spec.md:57-61；phases/index.md）
5. 断网自愈不成立：用户 09-29T10:22「根本没有自愈…一直停留在断网的那一刻」、10:28「遗漏的K没有自动补充」
6. 0 commit / 0 分支 / 未合并：T017 要求的 25 提交账本与提交质量无产物
7. Databento 真实查询与费用未验证（turncomplete 09-26T05:52）
8. T014 盘中对照（AC-CONTRAST-001/002）未完成即退役；仅存未跟踪 tests/test_t14_intraday_contrast.py（175 行，09-29 17:55）
9. 浏览器/UI 验收缺席，直到用户 09-29T04:38 投诉「你完全没做浏览器验收」后才补
10. 真实验收矩阵 exit 0 但 0 通过：turncomplete 09-27T04:21「`python3 scripts/build_code_acceptance.py` **退出码为 0**，但矩阵…」

## 5. 越界规模量化（命令与数字）
- 写面判定：对每个改动路径 `grep -F` 全文比对 spec.md+phases/P1..P6+index（python 单遍），0 命中=未声明
- 还原前：194 文件/1474 ops，其中 **110 文件（56.7%）、275 ops（18.7%）从未声明**；按目录 specs 70、tests 22、paperbuilder 7、frontend 5、.planning 3、runtime_ops 2、quality 1
- 当前树：42 路径/3788 行，其中 **15 文件 / 373 行（9.8%）未声明**（v2-simulation-api.ts、app_services/__init__.py、c1/…、c1_ingestion/aggregation.py +66、contracts/v2_live_runtime.py、runtime_lock.py、v2_market_api.py、4 个测试）
- 目录外产物：.planning 24 文件 1934 行；evidence 曾 65 份 md→现 0；legacy 10 文件 744K；外部 quality 3565 文件 91M
- 结论比例：**还原前约 1/5 的写操作、超过一半的改动文件落在声明写面之外；现存交付中接近 1/10 的行数越界**
