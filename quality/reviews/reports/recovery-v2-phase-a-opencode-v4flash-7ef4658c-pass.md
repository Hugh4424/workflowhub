# Phase A 异源审查

- **提交**：`95bc663`（Phase A 最终修正提交；基线 `535e9cb^`）
- **provider**：`opencode/v4flash`
- **runtime**：`7ef4658c-b7d2-40b5-aa2a-93c86c3d4cd0`
- **session**：`ses_016fa445fffeYfyD6G283nb0is`
- **packet**：`workflowhub-phase-a-95bc663-compact`
- **material_hash**：`7b360ed9f98aaae7ffcf10d756f359a9f747990310aa4b7c32e6dec39fa830e6`
- **diff_sha256**：`55741d2a4f4826efbaca9cffabd834361f87cb112740faa8e575a48c11ae5703`
- **结果**：`PASS`，无 blocking；file-only 字节身份校验通过。

## 为什么使用 compact packet

第一次完整 raw diff（159816 bytes）导致 provider 进程退出，记录为 `unavailable`，没有被当作通过。第二次 packet 保留四份当前材料、完整变更文件清单、关键 hunks 和 `build-plan/steps.json` 的前后语义解析；因此审查结论只基于该冻结包，不伪称 provider 阅读了超出 packet 的 raw patch。

## 审查结论

- `testing-system-blueprint` 只在 build-plan 做 advisory 设计，不执行测试、不产生第二 ledger、receipt 或 gate；build-code 不重复调用。
- build-plan 没有 Grill、RED/GREEN 执行或 receipt/handoff/comment 工作门槛。
- build-code 对每个行为 Phase 实时 route，并只选择一个具体 testing skill。
- 四份当前材料唯一，Phase review 保留；review subject 由 host 绑定真实 Phase 文件、基线、候选树、提交 OID、parent 和树事实，无提交时真实记录 unavailable。
- 未发现新的 public command、ledger、lock、bridge、第二执行器或越界文件。

## 非阻断项及处置

1. compact dossier 没有直接展开 `workflows/build-code/steps.json` 的语义；后续 Phase B 的 review packet 或合同测试补齐。当前 `SKILL.md` 与 `skill-deps.yaml` 已提供一致的行为约束，不阻断 Phase A。
2. dossier 的 tree 字段已绑定提交树，但后续 packet 显式标注 `commit_oid^{tree}`、candidate tree equality/mismatch 规则。FR-10/AC-11/T005 已写入该规则。
3. build-plan 的用户回复只影响“接受/交接声明”，不是工作资格；当前四材料已明确该边界，无需修改。

## 主代理 disposition

- **F-1 至 F-6**：`accepted`，与本 Phase 代码和四材料一致。
- **NB-1**：`deferred_to_phase_b`，补齐 build-code steps 语义断言/审查材料。
- **NB-2**：`fixed_in_materials`，FR-10/AC-11 已显式写入提交 OID、直接 parent、`commit_oid^{tree}`、候选树和 mismatch 规则。
- **NB-3**：`accepted_as_non_gate`，保持“通知/交接声明”和“工作资格”分离。

## 当前交接

Phase A 的聚焦测试与材料 lint 均通过；T002 未在实现前捕获 RED，已如实记录，未伪造历史失败。Phase A 不新增控制面。下一步是 Phase B：只处理 Phase review subject 的 host 派生、提交树绑定、无提交 truthful unavailable 和树变化失效，并在该 Phase 的合同测试、异源 review 和交接事实齐全后继续。
