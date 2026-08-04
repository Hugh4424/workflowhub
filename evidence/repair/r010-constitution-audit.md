# vNext stage/close 修复宪法核对

核对基准：`CONSTITUTION.md` 1.5.0 与 `constitution-checklist.md` 21 条。此次修复没有修改宪法或 checklist。

- F1：通过。新增逻辑只做 current fact/receipt 认证与 public status 投影；不增加 provider 或业务技能逻辑。
- F2：通过。close 只消费 quality fact 的 typed evidence；status 通过已有 `ref + sha256` freshness 契约。
- F3：通过。四材料仍决定可继续工作；formal publication/close 的 task、worktree、hash、snapshot 错误仍 fail-loud。
- F4：通过。review 仍是质量事实，不是修复准入证；unavailable 不伪造 pass。
- F5：通过。新增 gate 只对应已复现的 close 错绑、status 假 missing、receipt 缺失问题。
- F6：通过。记录仍外置；没有永久绑定 runner 路径、旧 accepted 或 replacement 链。
- F7：通过。三处人工确认与 commit/push/merge/archive/cleanup 独立授权边界不变。
- F8：通过。没有恢复旧 writer、`accepted.json`、`results/*` 或兼容桥；实现保持单写入。
- F9：通过。close 正例与 receipt 缺失/tree/commit 错配反例均覆盖；status 只接受当前认证 fact。
- F10：通过。只增加小范围回归测试与认证修复，不新建通用 gate/runner/自动化平台。
- Q1：通过。质量事实不阻止继续修复；测试、AC、review、确认不完整时仍不能报完成。
- Q2：通过。推进、fact freshness、publication、formal close 分开；`snapshot_commit` 不复制进 quality fact。
- Q3：通过。独立 review 仍由外部审查流程产生；本地 close/status 代码不产生质量 verdict。
- S1：通过。未重造技能能力。
- S2：通过。现有 stage 技能仍按项目宪法运行，修复不改变技能合约。
- S3：通过。没有新增或替换外部技能；现有技能路径保持可检查。
- S4：通过。未新增自定义技能。
- S5：通过。未新增需要主上下文承载的技能逻辑。
- S6：通过。未新增自研技能方案。
- S7：通过。五阶段与 workflow 目录结构不变。
- S8：通过。修复使用 task-relative canonical ref、Git snapshot 和 public behavior/action，不绑定单一 provider。

结论：方案和实现符合 21 条宪法；最关键的防回退约束是“不把 receipt 的 `snapshot_commit` 复制成第二 quality fact 字段、不恢复 accepted/results、不把 status 或 evidence 当 accepted”。

## r012 补充核对

- `review:risk` / `authorize:risk` 现在是最小的 vNext 风险处置链：只绑定当前 review、finding card、snapshot 和用户 reply；保留原始 review verdict，不把风险接受变成结构性材料许可证，符合 F4/Q1/Q2。
- `confirm:decision` 的 accepted/rejected 分别产生 passed/failed confirmation fact；重复相同确认复用已有 canonical record，符合 Q2，不制造第二写入 owner。
- make-decision 的 research/grill fact 直接绑定 handler 产出的 receipt ref/hash；status 与 close 仍只消费认证的 current quality fact，符合 F3/F8/Q2。
- 新增 7 个 vNext E2E 场景覆盖 public route、拒绝确认、风险暂停/接受、缺料无副作用、五阶段、同 task 修复与失败证据修复；未恢复 `accepted.json`、`results/*` 或旧 attempt/review-flow。

补充结论：以上修复仍符合 21 条宪法；复杂度增加限于恢复原技能已经声明的最小人工风险处置，不新增任务、run history、provider fallback 或独立推进许可证。
