# P4/T006 当前有界收尾

本次不改代码、测试、Phase/spec/index，不发审查、不写正式阶段事实。沿 `test-routing-advisor` 判 feature，并使用本仓 `backend-testing`：仅接回来源/决策/FR/证据/披露的后端函数边界、现行七项测试及真实索引，真实 CLI→P5 后置集成留原 owner。

## 实跑结果

| 命令/范围 | 原始结果 |
| --- | --- |
| `npx vitest run runtime/stage/stage-runner.test.mjs` | 收集七项，7/7，exit 0 |
| `npx vitest run tests/contract/post-acceptance-chain-source-index.test.mjs`，当前工作区 | 1/1，exit 0；AC-29 六个 `U-006-01..06`，AC-18 无索引为空并披露 |
| 同一索引命令，隔离副本仅把 AC-29 返回 source_ids 改成 [] | 收集一项，目标 `expected [] to deeply equal [U-006-01..06]` 失败，exit 1 |
| 恢复隔离源码原字节，测试和真实材料不改，同一索引命令 | 1/1，exit 0 |
| Phase 指定三文件 `node --check` 和 `git diff -- vitest.config.mjs` | 四条均 exit 0，include 差分原件已存；运行确实收集七项，非零收集假绿 |

四次 Vitest 输出、命令/exit、源码原字节和单行故障副本、mutation.diff、测试/材料 SHA、身份及静态检查统一由 `resume-20260928.evidence.json` 引用；所有输出 hash 已读回核对。临时当前源码副本已删除，共享工作树未注入故障。前后所核十份文件字节及运行时身份一致：材料 `revision-79b692d73940194c4c879794e157eca9f5ee9315584b60b8ef23fe0f6b6f55cb`，工作树 `c9e158ed78b2fe4efb37df92cf3ff7483e77e668`；这些身份只说明测试当时实际字节，不迁移成将来的整卡身份。

## 实际写入/读取接口

`stage-runner.mjs:4264,4286-4290,4321-4324` 从当前 decision-log 普查与 R→U/V 索引取可认证来源；无索引不伪造 R。`:4332-4339` 保留数组说明并披露坏项；`:4354-4364` 保留原行/task_ids 后补真实字段；`:4450-4465` 由真实 `currentPostBuildCodeSpecAnalyze` 调用并传给同次捕获，`:4480-4495` 送现有分析器。P5 转换器 `stage-end-report.mjs:142-157` 消费逐行证据/披露，但 P5 完整来源报告仍由 P5 验收，不用此次纯函数绿代证。

`vitest.config.mjs:27,50` 当前 include runtime 并拒绝零测试；新增索引测试已在 `move-map.json:3571-3577` 登记唯一 owner/consumer/删除条件。没有改校验器、task_ids、review_ref 或新增公共入口。

## 原两次审查 finding 当前对照

原 `3d13aab6` 九项及 `1258c827` 六项均保留原字节/裁决；不再派第三次、不称现版已审。P4 局部 `F-205df6ef8547` 的无索引 R 假来源和 `F-a2f33615e177` 的数组说明丢失由现七项及真实索引负控支持已修，历史 RED/修订原件见 `T006-source-and-array-revision-20260927.md`。`F-2c53ff18326f` 所指旧包没带负控/原始输出，现新增完整故障→恢复原件，旧包和原分类仍不倒改。

跨 Phase 发现继续归原 owner：P5 `F-0dc92d92984d/F-28802ff9def2` 真实报告/可信人工来源仍须 P5 验收（`:4601-4610` 虽有解析，尚无独立可信来源时仍返回 null）；`F-abb55219e4cd/F-c05bd41e4842` 为 P5 旧测试注释/路线 hard_requirements 语义，未由本次核验关闭。P6 `F-18b734c3d5ed/F-7c5886e8c82b` 的宿主路径与文件数量阈值仍沿原风险记录；P2 `F-a99590ddd5f1` 留 P2 最终数值/守卫核验。

P10 `F-2a7ad4ee1d25` 的旧未授权前提已按原处置 rejected_invalid，真实结果仍由 P10验收；`F-3c5d09b97170` 当前代码已建立独立进程组并杀组（targeted-runner:44-54），`F-608af91c7e3a` 当前只选 active 且拒绝未知状态（case-selection:101-113），此处只读确认差分，不代 P10 行为测试。P11 `F-22f0e3f6fa8d` 当前已有 browser 同源判定分支（stage-handlers:1742,1809-1810），不等于真实页面通过。`F-c595f6fd3a9c` 当前选项有读取者（stage-runner:4785-4790），旧“完全无 reader”已非现状，其历史分支边界归 P7/原 owner核验。

P4 指定局部测试、真实来源负控和接口接线现有证据成立；P2/P3/P5 后置四命令和完整 CLI→报告旅程按现行 Phase 在依赖可用后核，不阻塞本次 P4 局部收尾，也不提前宣称整卡完成。UI 关系仍 unknown。
