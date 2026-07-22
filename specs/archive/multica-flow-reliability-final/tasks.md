# WorkflowHub × Multica 流程可靠性修复任务清单

## 阶段 0：基线与取舍

- [ ] **T001** 记录 local main、origin/main、candidate baseline 和 detached 事故提交图。依赖：无。证据：基线报告。覆盖：FR-001/AC-001。
- [ ] **T002** 逐项判断事故提交保留、重做或拒绝，禁止整串 merge。依赖：T001。证据：提交取舍表。覆盖：FR-001/AC-001。
- [ ] **T003** 冻结拟改文件 allowlist、依赖基线和生产文件基线。依赖：T002。证据：diff 基线。覆盖：NFR-002/003。
- [ ] **T004** 跑当前全量测试、五阶段 E2E、close、Skill closure 和 anti-host 基线。依赖：T001。证据：测试回执。覆盖：AC-001/017。
- [ ] **T005** 建立 FR/AC—测试—证据 Markdown 台账。依赖：T003/T004。证据：覆盖索引。覆盖：全部 FR/AC。

## 阶段 1：runner 与自动阶段

- [ ] **T006** 先写 runner/candidate 分离、OID 匹配/漂移 RED 测试。依赖：T005。证据：预期失败。覆盖：FR-002/AC-002。
- [ ] **T007** 在现有 bootstrap/runtime 记录并回验 `runner_root/runner_oid`；显式 migration 才能更新，身份/Workspace 漂移必须在写入前 fail-loud。依赖：T006。证据：定向测试。覆盖：FR-002/AC-002/NFR-005。
- [ ] **T008** 先写 build-spec/build-code run→accepted 与 publish 中断恢复 RED 测试。依赖：T005。证据：预期失败。覆盖：FR-003/AC-003。
- [ ] **T009** 复用现有 accept 能力闭合 build-spec/build-code 自动接受。依赖：T008。证据：定向测试。覆盖：FR-003/AC-003。
- [ ] **T010** 回归 make-decision/build-plan/verify-code/close 人工边界未变化。依赖：T009。证据：policy 测试。覆盖：FR-003/AC-003。

## 阶段 2：receipt、review、质量事实

- [ ] **T011** 写 build-spec/build-plan 审查后修订触发 `EEXIST` 的 RED 测试。依赖：T005。证据：事故复现。覆盖：FR-004/AC-004。
- [ ] **T012** 调整现有 stage 顺序为 draft→初审→最多一次复审→正式 receipt。依赖：T011。证据：顺序测试。覆盖：FR-004/AC-004。
- [ ] **T013** 锁定“每个业务问题最多两轮 review、一个正式 receipt”，正常路径不创建 revision receipt。依赖：T012。证据：调用计数测试。覆盖：FR-004/AC-004。
- [ ] **T014** 写 `revise_required/test fail/AC gap/unavailable` 不得假 pass 的 RED 测试。依赖：T005。证据：预期失败。覆盖：FR-005/AC-005/NFR-004。
- [ ] **T015** 将四类质量状态写入现有 facts/human brief，并保留身份、Workspace、provenance、安全和权限的既有硬阻断边界。依赖：T014。证据：facts/policy 测试。覆盖：FR-005/AC-005/NFR-004/005。

## 阶段 3：checkpoint、AC、handoff、Coder

- [ ] **T016** 写合法 no-diff 与额外 changed path 的 checkpoint RED/回归测试。依赖：T005。证据：两类结果。覆盖：FR-006/AC-006。
- [ ] **T017** 修复现有 checkpoint/Workspace 逻辑并在 implementation receipt 前复查。依赖：T016。证据：定向测试。覆盖：FR-006/AC-006。
- [ ] **T018** 写 AC `covered/missing/unknown` 和 review baseline 来源测试。依赖：T005。证据：遗漏 AC 复现。覆盖：FR-008/AC-008。
- [ ] **T019** 在现有 test evidence/human brief 输出逐项 AC 状态与 refs。依赖：T018。证据：聚合结果。覆盖：FR-008/AC-008。
- [ ] **T020** 扩展现有 human brief 文本并测试下游不再询问数据根、路径或 AC。依赖：T019。证据：handoff E2E。覆盖：FR-010/AC-010。
- [ ] **T021** 在现有 `build-code` Skill 加入 Coder Phase 卡片、RED/GREEN、测试、scoped diff 和禁止越权合同。依赖：T020。证据：Skill contract 测试。覆盖：FR-011/AC-011。
- [ ] **T022** 用代表性 Phase 验证 Coder 完成实现证据但不 commit/review/accept/merge/push/close。依赖：T021。证据：Coder 合同测试。覆盖：FR-011/AC-011。

## 阶段 4：verify 返工

- [ ] **T023** 写完整 `build accepted→verify fail→reopen→new build accepted→fresh verify` RED E2E。依赖：T009/T015/T019。证据：事故复现。覆盖：FR-007/AC-007。
- [ ] **T024** 复用现有 failure publication、controlled reopen、accepted pointer 和 archive 闭合返工。依赖：T023。证据：E2E。覆盖：FR-007/AC-007。
- [ ] **T025** 断言旧 accepted bytes 保留、新 pointer 生效、archive 无冲突、同一 reopen 不可重放。依赖：T024。证据：字节/hash 断言。覆盖：FR-007/AC-007。
- [ ] **T026** 断言 fresh verify 使用新快照和新测试，不复用旧 verdict。依赖：T024。证据：fresh verify 回执。覆盖：FR-007/AC-007。

## 阶段 5：close

- [ ] **T027** 写 archive 父目录不存在和完整目录保存测试。依赖：T005。证据：预期失败。覆盖：FR-009/AC-009。
- [ ] **T028** archive 前创建父目录，复用现有 close plan/reconcile。依赖：T027。证据：close 定向测试。覆盖：FR-009/AC-009。
- [ ] **T029** 写 remote OID 变化与网络/认证/代理失败分类测试。依赖：T005。证据：不同 stderr/exit。覆盖：FR-009/AC-009。
- [ ] **T030** 修复 `ls-remote` 错误传播，只在成功读取不同 OID 时报告 baseline changed。依赖：T029。证据：分类测试。覆盖：FR-009/AC-009。
- [ ] **T031** 测试同 plan 零 Git 写入复用 confirmation、各步骤中断恢复、权限错误 fail-loud、force push/自动 rebase/rollback 被拒绝，以及现有 executor 回归。依赖：T028/T030。证据：故障注入。覆盖：FR-009/AC-009/NFR-005。

## 阶段 6：WorkflowHub 候选验证

- [ ] **T032** 运行 T006～T031 全部定向测试和跨阶段 E2E。依赖：T010/T013/T015/T017/T022/T026/T031。证据：测试回执。覆盖：AC-002～011。
- [ ] **T033** 运行完整测试、五阶段 E2E、close、review、Skill closure、diff check。依赖：T032。证据：全量回执。覆盖：AC-001～011。
- [ ] **T034** 在无 Multica 环境运行核心测试和 anti-host 扫描。依赖：T033。证据：扫描/测试结果。覆盖：FR-017/AC-017/NFR-001。
- [ ] **T035** 核对 allowlist、依赖、生产文件和新 schema/service/platform 均无扩张。依赖：T033。证据：simplicity 报告。覆盖：NFR-002/003。
- [ ] **T036** 冻结 build-code 快照，运行 OpenCode 和 Claude Code 异源审查并人工判断 finding。依赖：T034/T035。证据：两个 review result。覆盖：全部 WorkflowHub FR/AC。

## 阶段 7：Multica 配置与 Canary

- [ ] **T037** 从当前线上 Prompt/Skill/Squad 生成最小对照草案，每条规则映射 FR-012～019。依赖：T005。证据：配置 diff 草案。覆盖：FR-012～019。
- [ ] **T038** 静态审查大白话状态模板、决策卡、自修/升级边界和上游返回握手。依赖：T037。证据：Prompt 审查。覆盖：FR-012/013、AC-012/013。
- [ ] **T039** 静态审查 Issue 拓扑、assignee/status、barrier/mention、有界等待、陈旧 no-op 和单 generation。依赖：T037。证据：Prompt/Squad 审查。覆盖：FR-014～016、AC-014/015。
- [ ] **T040** 静态审查 verify/close/工头最终清理和 Coder 不绑定完整 Skill。依赖：T037。证据：配置审查。覆盖：FR-011/017、AC-011/016。
- [ ] **T041** 等 Agent idle，导出七个 Agent、Squad、五个 Skill 的线上快照。依赖：T036/T038/T039/T040。证据：发布前快照。覆盖：FR-018/AC-018。
- [ ] **T042** 原位覆盖现有 Prompt、Squad instructions 和五个 Skill；不创建新对象。依赖：T041。证据：CLI 操作记录。覆盖：FR-018/AC-018。
- [ ] **T043** 回读 Skill ID、supporting files、绑定、Prompt 与 Squad，逐项比对。依赖：T042。证据：发布后快照。覆盖：FR-018/AC-018。
- [ ] **T044** 在非 WorkflowHub 外部小项目启动两个 Phase 的五阶段 Canary，逐阶段断言父子关系、assignee、status 和串行顺序符合 FR-014。依赖：T043。证据：父子 Issue/run/status 时间线。覆盖：FR-014/019、AC-014/019。
- [ ] **T045** 注入一次确定性 verify 返工并验证原 Phase/Issue 复用和 fresh verify。依赖：T044。证据：返工时间线。覆盖：FR-007/014/019、AC-007/014/019。
- [ ] **T046** 验证上游 comment+真实 mention 在无用户干预时产生原下游新 run 并恢复 `in_progress`。依赖：T044。证据：run/mention 记录。覆盖：FR-013/015、AC-013。
- [ ] **T047** 注入陈旧/重复 completion，验证快速 no-op、无双触发、无第二 generation。依赖：T044。证据：事件记录。覆盖：FR-015/016、AC-014/015。
- [ ] **T048** 完成 close 和全状态清理，检查 Canary 全部 Agent comment。依赖：T045/T046/T047。证据：comment/status/close 清单。覆盖：FR-012/017/019、AC-012/016/019。
- [ ] **T049** 汇总时间、run、用户评论、重复 review/test、人工救火；不建设监控服务。依赖：T048。证据：一次性 Canary 报告。覆盖：AC-019/NFR-002。
- [ ] **T050** Canary 任一关键项失败时恢复 T041 快照、暂停推广并记录平台/WorkflowHub 归属。依赖：T044～T049。证据：回滚或成功豁免记录。覆盖：FR-019/AC-019。

## 阶段 8：合并和旧任务收尾

- [ ] **T051** Canary 全通过后，按独立 close 授权合并并 push WorkflowHub candidate。依赖：T049 且 T050 无失败。证据：close status。覆盖：FR-019/AC-019。
- [ ] **T052** 恢复 ZHI-184：保留有效 verify，重新核对 Git/remote 后完成 close。依赖：T051。证据：ZHI-184 close。覆盖：FR-019/AC-020。
- [ ] **T053** 清理 ZHI-184 有效链为 done、废弃链为 cancelled、父 Issue最后 done。依赖：T052。证据：Issue 状态表。覆盖：FR-017/AC-016/020。
- [ ] **T054** 判断 ZHI-102 runner/accepted lineage；可信则 fresh verify/必要 reopen，不可信则唯一 replacement generation。依赖：T053。证据：lineage 决策。覆盖：FR-016/019、AC-015/020。
- [ ] **T055** 完成 ZHI-102 fresh verify、必要返工、close 和全部状态清理。依赖：T054。证据：ZHI-102 最终时间线。覆盖：FR-007/017/019、AC-007/016/020。
- [ ] **T056** 汇总最终 FR/AC、测试、审查、配置、Canary 和两个旧任务证据，执行最终独立复核。依赖：T055。证据：最终交付包。覆盖：全部 FR/AC/NFR。

## 依赖硬约束

- T006～T010 完成后，才能把新 runner/auto-accept 语义用于后续 receipt/reopen E2E。
- T011～T015 完成后，才能发布新的正式阶段证据。
- T023～T026 必须串行，不能用旧 accepted/review 冒充 fresh verify。
- T041 前只允许准备 Multica 配置草案，禁止线上覆盖。
- T044 前必须完成 T043 回读。
- T051 前必须完成 Canary；T052、T054 禁止并行。
- 任何新生产文件、依赖、schema、service、通用状态机或 Multica adapter 提议，必须停止当前阶段并回到 spec，不得在 build-code 顺手加入。

## 覆盖结论

- FR：19/19 有实施任务。
- AC：20/20 有可证伪证据任务。
- NFR：5/5 有检查或回归任务。
- 用户新增要求：5/5 已覆盖。
- 两份事故审计的共同根因与 ZHI-102/ZHI-184 独有阻塞：全部映射到 T006～T055。
