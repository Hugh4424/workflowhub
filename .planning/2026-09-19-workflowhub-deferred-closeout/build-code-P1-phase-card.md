# Build-code Phase P1 Card — 跨仓材料标识对齐

## Goal

完成 T001 RED 与 T002 GREEN：WH `reviewPacketMaterialId` 对同一语义材料集与 BR `canonicalWorkflowHubMaterialId` 产出同值；保持四个既有相等点严格比较，不修改 BR 权威实现。

## Allowed files / symbols

- `runtime/review/review-packet-identity.mjs`：仅 `reviewPacketMaterialId` 实现段（计划锚点约 121–156）。
- `tests/contract/review-material-change-redispatch.test.mjs`：仅新增/扩展冻结向量断言与负例。
- `.planning/2026-09-19-workflowhub-deferred-closeout/*`：执行卡、事实和进度记录。
- 外置 task store：仅通过现有 public runtime 写当前事实。

## AC / scope

- `AC-IDENTITY-001`：同包两侧标识一致，包装件排除，文件记录为 `{path, bytes, lowercase sha256}`，UTF-8 字节序排序，`sha256(JSON.stringify(entries))`。
- `AC-IDENTITY-002`：同材料集稳定；不同材料集仍不同。
- 非目标：BR `lib/attachments.mjs`；四个既有相等点；跨仓派发端到端；新增生产文件。

## Test route

- 预判 route：`feature`（跨仓协议身份行为，需契约测试）。
- 具体 skill：`backend-testing`；先用 `test-routing-advisor` 按实际 changed files 重判。
- RED/GREEN：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`，预期 RED=1、GREEN=0；RED 必须是目标断言失败，不接受 import/setup 失败。
- 证据：`quality/evidence/build-code/material_identity/`，外置 facts 由 public runtime 记录。

## Stop conditions

- 需要改 BR 权威算法、取消严格比较、修改 spec/plan/tasks、扩大文件边界或测试环境失败。
- `npm ci` 未完成前不执行 WH gate command。

## Expected handoff

记录实际 changed files、RED/GREEN stdout/stderr 与 exit、AC 结果、route 重判、一次 phase review 与 findings disposition；未取得 review 或 reflection 时保留 `unavailable`。
