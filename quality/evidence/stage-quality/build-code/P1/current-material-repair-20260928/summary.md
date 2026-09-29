# P1 当前材料语义修订（2026-09-28）

范围：只修当前 `phases/P1.md` 与同任务 `spec.md`；依据 `P1/current-semantic-independent-review-20260928.md` 的问题 3/4/5、当前 `decision-log.md`、真实入口库存及 P6/T025–T027 独立样例结论。工作树分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。

| 文件 | 修前 SHA-256 | 修后 SHA-256 | 差分 SHA-256 |
| --- | --- | --- | --- |
| `specs/workflowhub-thin-core-card-04-20260919/phases/P1.md` | `dbec2499828cbfbf5e3cf4779fef29d5cdadea0c084ff1cd1ae3e095a5277057` | `e3d12ac47880da20f3b4f264ab2ec28bc629e6a1a57ee3f4f11556317fbff07b` | `a66d2d853c1b9e05302b7547b6b0167ec2ea687a075561a3c5b0ab1ecd5bf6fe` |
| `specs/workflowhub-thin-core-card-04-20260919/spec.md` | `5c26350bd12e9976e60aef871b2d03247670eed6699de2ff509c3764e74cdceb` | `cd75ee933bc1d9eff265581126d40170867cf15f9dd8abfc9b9e4a83fb4f0524` | `16d248500507b060578e27be0d599f0a71194378a370ee35d0f0b4fcdd5d9e40` |

原字节和逐行差分分别为同目录 `P1.before.md`、`spec.before.md`、`P1.before-after.diff`、`spec.before-after.diff`。

- P1/T002 改用实际存在的 CLI、运行时入口、`package.json`、`README.md` 和库存证据；明确 `ENTRYPOINT.md` 不存在。库存已落盘且旧结构检查曾通过，页面消费者仍需核实，故 UI 适用性仍为 `unknown/provisional`。
- P1/T003 的 ADR 内容来源写为 D-002/D-004/D-005，D-008 只负责落地时序；R-007 仅为流程纪律。旧 ADR 迁号和旧 RED 原件未改。
- `spec.md` AC-17/18/19 的判据和失败例未改。现行处置承认三项窄样例已有独立复核，仍明确完整验收、P6 和整卡未完成。

校验：`git diff --no-index --check` 对两份修订均未报空白错误；修订后搜索已无旧的“库存仍 RED”“没有真正受限实施者原件”“外部候选缺检查”等过时现状。未运行 P1 gate、正式审查或发布 Task facts；修订后须按当前字节重采并独立审查，不能用旧绿色证明完成。
