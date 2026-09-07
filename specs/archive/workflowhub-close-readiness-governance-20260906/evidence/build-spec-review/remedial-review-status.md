# 补救审查与处置状态（事实记录，非完成声明）

## 审查本身

- 用户授权：`quality/confirmations/fda42d1424234a09b67bde9e7af0528edbb1639329eb33b53b8494043384dc41.json`（一次性，原因=旧 v61/v62 切片提交 + simplicity-guard/plan-ceo-review lens 未证实执行）。
- 执行：`node skills/wh-review/scripts/wh-review-cli.mjs run < remedial-review-input.json`（stdin 仅 stage/host_provider/materials；materials 含 decision-log、当前 spec、constitution、checklist、两个 lens 技能正文、review_scope_instructions）。
- 结果：`status=available, outcome=completed`；providers：kimi/coding completed、grok/grok failed(PROVIDER_IDENTITY_INVALID)、antigravity/flash completed、codex/luna completed；min_heterologous=1；findings=12。
- 正式记录：`quality/reviews/results/build-spec-simple-85d30d33-58f1-4b21-9858-d87851991c15.json`（attempt_ref `quality/reviews/attempts/f0cd3f7e-4bfd-4f13-a353-c8435e4b536d/attempt.json`，review-record exit 0）。
- material_id=`76413e14f77530cad15984553554c07c20051411387debeb443eb2dd97d668af`；runtime_id=`0889f9a1-d05d-47bc-8460-0ae753d5b093`。

## 处置状态

- 台账：`specs/.../evidence/build-spec-review/remedial-findings-ledger.json`（原始 12 条保真，disposition 由处置子代理回填）。
- 处置子代理 agent 1aec6ae8 运行中：逐条 fixed/rejected_invalid 处置，重跑四校验器与向量自检脚本，禁止改 decision-log/plan/tasks、禁止新 provider、禁止 bridge/publish。
- 处置完成后必须先把台账 disposition 与 spec 新 sha 核实过，才能进入阶段末 spec-analyze；不得把处置中的状态当作完成。

## 边界（不可省略）

- 12 条 findings 未处置完之前不进入阶段末分析；向量已生成且独立交叉验证通过（gap-001/packet-001）。
- grok failed 为真实失败事实，保留原样，不得改写成通过。
- 全部处置完成且校验通过后，主会话才执行阶段末 spec-analyze（真实语义对照 R-001~R-011），再发布 stage outcome 与 reflection；随后按用户要求停下大白话汇报，不自动进入 build-plan。